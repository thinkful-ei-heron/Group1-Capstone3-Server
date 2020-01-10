const xss = require('xss');
const io = require('../server');
const socket = require('socket.io');
const socketService = require('./socketService');
const ShipsService = require('../ships/ShipsService');

const socketRouter = function (io, db) {
    
    io.on('connection', function (socket) {
        //console.log('connected', socket.id);

        //creates/connects sockets to rooms
        socket.on('join_room', async (room) => {
            let playerId = socket.userInfo.id;

            if (room === 'random') {
                let room = await socketService.findRoom(db);
                
                //check to see if there are any rooms in the queue
                if (room.size) {
                    
                    let roomName = await socketService.dequeue(db, room);

                    await socketService.updatePlayer2(db, playerId, roomName.id);

                    socket.join(roomName.room_id);
                    socket.emit('joined', { room: roomName.room_id, player: 'player2', gameId: roomName.id })
                }
                else {

                    let randomString = `${Math.floor(Math.random() * 1000)}`;
                    let gameHistoryId = await socketService.makeRoom(db, playerId, randomString);
                    
                    await socketService.enqueue(db, gameHistoryId.id);
                    await socketService.setNewGameData(db, gameHistoryId.id);

                    socket.join(randomString);
                    socket.emit('joined', { room: randomString, player: 'player1', gameId: gameHistoryId.id });
                }


            } else {
                //game_history id in dashboard list of active games
                //find game_history with room id
                //make sure person is allowed in the room
                //get game-data for room with room id
                //send back game data to client
               
                socket.join(room);
                socket.emit('reconnected', {});
            }
        });


        //Performs the check to see if a given shot is a hit or miss, updates db accordingly
        socket.on('fire', async (data) => {
            const { target, playerNum, gameId, roomId } = data;

            if (!playerNum || !gameId) {
                return res.status(400).json({ error: 'must provide player number and game id' });
            }

            let result;
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
                    .then(() =>  {
                        // {
                        //     result: 'hit/miss'
                        //     ship: 'shipname/null'
                        //     playernum: 'player1/2'
                        //     target: 'A1'
                        // }
                        io.to(roomId).emit('response', {...result, playerNum, target})
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
                    .then(() => io.to(roomId).emit('response', {...result, playerNum, target}));
            }
        })
    });
};

module.exports = socketRouter;