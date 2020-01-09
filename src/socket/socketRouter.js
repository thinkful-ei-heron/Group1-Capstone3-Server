//const gameService = require('./gameService');
const express = require('express');
const xss = require('xss');
const io = require('../server');
const socket = require('socket.io');
const socketService = require('./socketService');

const socketRouter = function (io, db) {
    
    io.on('connection', function (socket) {

        console.log('connected', socket.id);
        socket.on('shot', (data) => {
            console.log(data)
            socket.emit('shot', data);
        });
    
    
        // need to send back which player they are.
        socket.on('join_room', async (room) => {
            if(room === 'random') {
                let room = await socketService.findRoom(db);
                console.log(room);
                //check to see if there are any rooms in the queue
    
                if(room.size) {
                    let roomName = await socketService.dequeue(db, room)
                    console.log(roomName.room_id)
                    socket.join(roomName.room_id);
                    socket.emit('joined', {room: roomName.room_id, player:'player2'})
                    //socket.join(queue.dequeue())
                    //add player2 id, room id, to game_history
                    //socket.emit(room name)
                }
                else {
                    let playerId = 1;
                    //fix player id

                    let randomString = `${Math.floor(Math.random() * 1000)}`;
                    let gameHistoryId = await socketService.makeRoom(db, playerId, randomString);
                    //console.log(gameHistoryId);
                    await socketService.enqueue(db, gameHistoryId.id);
                    console.log(randomString);
                    socket.join(randomString);
                    socket.emit('joined', {room: randomString, player:'player1'});
                    //socket.join that random
                    //add that room to a queue of rooms with only one person in them.
                    //add player1 id, room id, to game_history
                    //socket.emit(room name)
                }


            } else socket.join(room);
        });
    });
};

module.exports = socketRouter;