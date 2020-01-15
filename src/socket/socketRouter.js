const xss = require('xss');
const io = require('../server');
const socket = require('socket.io');
const socketService = require('./socketService');
const ShipsService = require('../ships/ShipsService');
const GamesService = require('../games/GamesService');

const socketRouter = function (io, db) {

    io.on('connection', function (socket) {
        // console.log('connected', socket.id);

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


                    if (playingYourself.player1 === playerId) {
                        socket.emit('error-message', { error: 'You can only have one game in the queue at a given time. Please wait for someone else to match against you.' });

                    } else {
                        //Dequeues from queue
                        let roomName = await socketService.dequeue(db, room);

                        //changes player 2 for the game that was at the front of the queue
                        await socketService.updatePlayer2(db, playerId, roomName.id);
                        
                        //Join and notify the socket
                        socket.join(roomName.room_id);
                        socket.emit('joined', { room: roomName.room_id, player: 'player2', gameId: roomName.id })
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
                if(!foundGame) {
                    socket.emit('error-message', {error: 'This room does not exist'})
                } 
                //If player is not a part of that game
                else if(foundGame.player1 !== playerId && foundGame.player2 !== playerId) {
                    socket.emit('error-message', {error: 'You are not allowed in this room'})
                } 
                //If the game has been finished
                else if (foundGame.game_status !== 'active') {
                    socket.emit('error-message', {error: 'This game has already been finished'})
                } 
                //Join and notify the socket
                else {
                    socket.join(room);
                    socket.emit('reconnected', {room: room});
                }
            }
        });


        //Performs the check to see if a given shot is a hit or miss, updates db accordingly
        socket.on('fire', async (data) => {
            const { target, playerNum, gameId, roomId } = data;
            
            if (!playerNum || !gameId) {
                return res.status(400).json({ error: 'must provide player number and game id' });
            }

            //the following code gives us access to the user's id and the opponent's id. which we will need
            // for updating the stats table for each player
            let playerId = socket.userInfo.id;
            let opponentId;
            GamesService.getPlayerIds(db, gameId).then(res => {
                if(res.player1 === playerId){
                    opponentId = res.player2
                }else{
                    opponentId = res.player1
                } 
            })

            let result = null;
            let winner = null;
            //the overarching if/else is based on if the firing user is player 1 or player 2
            //after determining if the user is player 1 or 2, we access the opponents ships.
            //then we check to see if we hit one of the opponent's ships.
            //if the result was a hit then we add the target to the 'hits' value in the database.
            // if the result was a miss then we add the target to the 'miss' values in the database.
            //at the end we return the result and ship name that was hit (or null if it was a miss) to the
            // client end.
            if (playerNum === 'player1') {
                ShipsService.accessPlayer2Ships(db, gameId).then(res => {
                    result = ShipsService.checkForHit(target, res.player2_ships);
                }).then(() => {


                    if (result.result === 'hit') {
                        //if the target was a hit we will add it to the database in player 1 hits
                        return ShipsService.accessPlayer1Hits(db, gameId).then(res => {
                            let newValue = [target];

                            if (res.player1_hits !== null && res.player1_hits !== '') {
                                
                                let currentHits = JSON.parse(res.player1_hits);
                                newValue = [...currentHits, target];
                                //if the length of newValue is the length of all the ships combined then
                                // the player has won. Need to change game status to complete in the db 
                                if(newValue.length === 17){
                                    winner = 'player1'
                                    GamesService.updateGameData(db, gameId, winner)
                                    GamesService.endGame(db, gameId)
                                    GamesService.updateWinnerStats(db, playerId)
                                    GamesService.updateLoserStats(db, opponentId)
                                }
                            }
                            return ShipsService.addToHitsPlayer1(db, gameId, JSON.stringify(newValue));
                        });


                    } else {
                        //else we are adding the target to player 1's misses
                        return ShipsService.accessPlayer1Misses(db, gameId).then(res => {
                            let newValue = [target];
                            if (res.player1_misses !== null && res.player1_misses !== '') {
                                let currentHits = JSON.parse(res.player1_misses);
                                newValue = [...currentHits, target];
                            }
                            return ShipsService.addToMissesPlayer1(db, gameId, JSON.stringify(newValue));
                        });
                    }



                })
                    .then(() => {

                        socketService.swapTurn(db, gameId)
                            .then(() => {

                                io.to(roomId).emit('response', {...result, playerNum, target});
                                //if the win message exists, then transmit it
                                if(winner){
                                    io.to(roomId).emit('win', {winner});
                                }
                            });
                    });




            } else {
                //now we are repeating the above operations if it were player 2 who fired the shot.
                ShipsService.accessPlayer1Ships(db, gameId).then(res => {
                    result = ShipsService.checkForHit(target, res.player1_ships);
                }).then(() => {


                    if (result.result === 'hit') {
                        //if the target was a hit we will add it to the database in player 2 hits
                        return ShipsService.accessPlayer2Hits(db, gameId).then(res => {
                            let newValue = [target];
                            if (res.player2_hits !== null && res.player2_hits !== '') {
                                let currentHits = JSON.parse(res.player2_hits);
                                newValue = [...currentHits, target];
                                if(newValue.length === 17){
                                    winner = 'player2'
                                    GamesService.updateGameData(db, gameId, winner)
                                    GamesService.endGame(db, gameId)
                                    GamesService.updateWinnerStats(db, playerId)
                                    GamesService.updateLoserStats(db, opponentId)
                                }
                            }
                            return ShipsService.addToHitsPlayer2(db, gameId, JSON.stringify(newValue));
                        });




                    } else {
                        //else we are adding the target to player 2's misses
                        return ShipsService.accessPlayer2Misses(db, gameId).then(res => {
                            let newValue = [target];
                            if (res.player2_misses !== null && res.player2_misses !== '') {
                                let currentHits = JSON.parse(res.player2_misses);
                                newValue = [...currentHits, target];
                            }
                            return ShipsService.addToMissesPlayer2(db, gameId, JSON.stringify(newValue));
                        });
                    }



                })
                    .then(() => {


                        socketService.swapTurn(db, gameId)
                            .then(() => {

                                io.to(roomId).emit('response', {...result, playerNum, target});
                                //if a winner exists, then transmit it
                                if(winner){
                                    io.to(roomId).emit('win', {winner});
                                }
                            });
                    });
            }
        })


        socket.on('ships_ready', room => {
          
            socket.broadcast.to(room).emit('opponent_ready', {});
        })


        socket.on('send-message', data => {
           
            socket.broadcast.to(data.room).emit('chat-message', {username: socket.userInfo.username, message: data.message})
        })


        // socket.on('disconnect', () => {
        //     // console.log('Someone has left a room')
            
        //     io.sockets.emit('left', 'The other Player has left')
        // })
    });
};

module.exports = socketRouter;