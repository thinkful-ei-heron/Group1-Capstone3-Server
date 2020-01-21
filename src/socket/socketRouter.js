const xss = require('xss');
const socketService = require('./socketService');
const ShipsService = require('../ships/ShipsService');
const GamesService = require('../games/GamesService');

const socketRouter = function (io, db) {

    io.on('connection', function (socket) {
        // console.log('connected', socket.userInfo);

        //Connects sockets to rooms
        socket.on('join_room', async (room) => {
            let playerId = socket.userInfo.id;
            
            //If a random room is requested
            if (room === 'random') {
                let room = await socketService.findRoom(db);

                //check to see if there are any rooms in the queue
                if (room.size) {

                    //Checks to see if first in queue is you
                    let playingYourself = await socketService.checkPlayingYourself(db, room.first, playerId);
                    let activeGames = await socketService.checkNumOfGamesActive(db, playerId)

                    if (activeGames.length >= 10) {
                        socket.emit('error-message', { error: 'You can only have up to 10 active games at any time.' });
                    }

                    else if (playingYourself.player1 === playerId) {
                        socket.emit('error-message', { error: 'You can only have one game in the queue at a given time. Please wait for someone else to match against you.' });

                    } else {
                        //Dequeues from queue
                        let roomName = await socketService.dequeue(db, room);

                        //changes player 2 for the game that was at the front of the queue
                        let player1Username = await socketService.updatePlayer2(db, playerId, roomName.id);
                        
                        //Join and notify the socket
                        socket.join(roomName.room_id);
                        socket.emit('joined', { room: roomName.room_id, player: 'player2', gameId: roomName.id });
                        //Let both players know the other's user name
                        socket.emit('usernames', {usernames: {player: socket.userInfo.username, opponent: player1Username.player1_username }})
                        socket.broadcast.to(roomName.room_id).emit('usernames', {usernames: {player: player1Username.player1_username, opponent: socket.userInfo.username }})
                    }
                }
                else {
                    //Returns all active games that the player is a part of
                    let activeGames = await socketService.checkNumOfGamesActive(db, playerId)

                    if (activeGames.length >= 10) {
                        socket.emit('error-message', { error: 'You can only have up to 10 active games at any time.' });
                    } else {

                        //Creates a random string for the room_id
                        let randomString = `${Math.floor(Math.random() * 1000)}`;
                        let gameHistoryId = await socketService.makeRoom(db, playerId, randomString);

                        //Enqueues the game and initializes a new row for the game_data
                        await socketService.enqueue(db, gameHistoryId.id);
                        await socketService.setNewGameData(db, gameHistoryId.id);

                        //Join and notify the socket
                        socket.join(randomString);
                        socket.emit('joined', { room: randomString, player: 'player1', gameId: gameHistoryId.id });
                    }
                }


            } else {
                //Tries to find the game the socket is requesting
                let foundGame = await socketService.findGame(db, room);

                //If no such game exists
                if (!foundGame) {
                    socket.emit('error-message', { error: 'This room does not exist' })
                }
                //If player is not a part of that game
                else if (foundGame.player1 !== playerId && foundGame.player2 !== playerId) {
                    socket.emit('error-message', { error: 'You are not allowed in this room' })
                }
                //If the game has been finished
                else if (foundGame.game_status !== 'active') {
                    socket.emit('error-message', { error: 'This game has already been finished' })
                }
                //Join and notify the socket
                else {
                    socket.join(room);
                    socket.emit('reconnected', { room: room });
                }
            }
        });


        //Performs the check to see if a given shot is a hit or miss, updates db accordingly
        socket.on('fire', async (data) => {
            const { target, gameId, roomId} = data;
            let playerId = socket.userInfo.id;
            
            //Default the target is correct
            let targetIncorrectBool = false;
            //All possible first characters of target
            let possibleFirst = ['A','B','C','D','E','F','G','H','I','J'];
            //Target's length can only be 2 or 3 
            if(!target ||!target.length|| target.length > 3 || target.length === 1) targetIncorrectBool = true;
            else if(!possibleFirst.includes(target.charAt(0))) targetIncorrectBool = true;
            //If second character isn't a number
            else if(!parseInt(target.charAt(1))) targetIncorrectBool = true;
            //If third character exists but is not 0
            else if(target.length === 3 && parseInt(target.charAt(2)) !== 0) targetIncorrectBool = true;
            
            //Gets entire game_history table in accordance with the sockets requested gameId
            let gameHistory = await GamesService.getGameHistory(db, gameId);

            
            //If the selected target doesn't meet the above criteria
            if(targetIncorrectBool) {
                socket.emit('error-message', {error: 'The target youve selected is out of bounds'});
            }
            //If no game found
            else if(!gameHistory) {
                socket.emit('error-message', {error: 'The game you are trying to modify does not exist'});
            } 
            //If game has been finished
            else if (gameHistory.game_status !== 'active') {
                socket.emit('error-message', {error: 'The game you are trying to modify has been completed'});
            } 
            //If player is not a part of the game
            else if(gameHistory.player1 !== playerId && gameHistory.player2 !== playerId) {
                socket.emit('error-message', {error: 'You are not allowed to make changes to this game'});
            } 
            //If supplied roomId does not match the room_id in game_history
            else if(gameHistory.room_id !== roomId) {
                socket.emit('error-message', {error: 'Incorrect room-id or game-id'});
            } else {

                //Initializing variable and finding out which player sent the message
                let opponentId = (gameHistory.player1 === playerId) ? gameHistory.player2: gameHistory.player1;
                let playerString = (gameHistory.player1 === playerId) ? 'player1': 'player2';
                let opponentString = (gameHistory.player1 === playerId) ? 'player2': 'player1';
                let result = null;
                let winner = null;
                
                //Gets entire game_data table in accordance with the sockets requested gameId
                let gameData = await GamesService.getGameData(db, gameId);
                let repeatMoveBool = await ShipsService.checkForRepeatMove(target, gameData, playerString);

                //check to see if opponent ships are set in game_data
                if(!gameData[`${opponentString}_ships`]) {
                    socket.emit('error-message', {error: 'Must wait until opponent sets their ships'});
                } 
                else if(repeatMoveBool) {
                    socket.emit('error-message', {error: 'Target has already been selected'});
                }
                else if(gameHistory.turn !== playerString) {
                    socket.emit('error-message', {error: 'You cannot fire when it is not your turn'});
                }
                else {
                    //Returns an object with result and ship keys and a boolean for sunk representing if the
                    //ship has been sunk.
                    result = await ShipsService.checkForHit(target, gameData, opponentString, playerString);

                    if (result.result === 'hit') {
                        //Used to help determine which player's hits to update
                        let playerHitString = `${playerString}_hits`;
                        let newHits = [target];
    
                        //If player hits aren't empty
                        if(gameData[playerHitString]) {
                            let currentHits = JSON.parse(gameData[playerHitString]);
                            newHits = [...currentHits, target];
    
                            //If this shot won the game
                            if(newHits.length >= 17) {
                                winner = playerString;
                                GamesService.updateGameDataWin(db, gameId, playerString);
                                GamesService.endGame(db, gameId);
                                GamesService.updateWinnerStats(db, playerId);
                                GamesService.updateLoserStats(db, opponentId);
                            }
                        } 

                        //Updates player's hits
                        await ShipsService.addToHits(db, gameId, JSON.stringify(newHits), playerHitString)
                    } else {
                        //Used to help determine which player's misses to update
                        let playerMissString = `${playerString}_misses`;
                        let newMisses = [target];
    
                        //If player misses aren't empty
                        if(gameData[playerMissString]) {
                            let currentHits = JSON.parse(gameData[playerMissString]);
                            newMisses = [...currentHits, target];
                        }
    
                        //Updates player's misses
                        await ShipsService.addToMisses(db, gameId, JSON.stringify(newMisses), playerMissString)
                    }
    
                    //Changes turn in game_history
                    await socketService.swapTurn(db, gameId)
                                    
                    //Tell sockets in the room what the result of the shot was

                    io.to(roomId).emit('response', { ...result, playerNum:playerString, target });

                    
                    //if the win message exists, then transmit it
                    if (winner) {
                        io.to(roomId).emit('win', { winner });
                    }
                }
            }
        })


        socket.on('ships_ready', room => {

            socket.broadcast.to(room).emit('opponent_ready', {});
        })


        socket.on('send-message', data => {

            socket.broadcast.to(data.room).emit('chat-message', { username: socket.userInfo.username, message: data.message })
        })


        // socket.on('disconnect', () => {
        //     // console.log('Someone has left a room')

        //     io.sockets.emit('left', 'The other Player has left')
        // })
    });
};

module.exports = socketRouter;
