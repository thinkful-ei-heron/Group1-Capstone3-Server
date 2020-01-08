//const gameService = require('./gameService');
const express = require('express');
const xss = require('xss');

const gameRouter = express.Router();

// const io = app.get('io');
// io.on('connection', function (socket) {
//     console.log('connected', socket.id);
//     socket.on('shot', (data) => {
//         console.log(data)
//         socket.emit('shot', data);
//     });
// });

gameRouter
    .post('/game', (req, res, next) => {

    });

module.exports = gameRouter;