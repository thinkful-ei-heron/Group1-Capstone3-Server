const socketService = {
    findRoom(db) {
        return db('room_queue')
            .select('*')
            .first();
    },


    makeRoom(db, playerId, roomName) {
        return db.into('game_history')
            .insert({
                player1: playerId,
                room_id: roomName
            })
            .returning('*')
            .then(rows => rows[0]);
    },


    updatePlayer2(db, playerId, gameId) {
        return db('game_history')
        .where({ id: gameId })
        .update({
            player2: playerId
        });
    },


    enqueue(db, gameHistId) {
        let queue = db('room_queue')
            .select('*')
            .first();
        queue.then(q => {
            //If a queue has not been established or it it empty
            if (!q) {
                return db.into('room_queue')
                    .insert({
                        size: 1,
                        first: gameHistId,
                        last: gameHistId
                    });
            }
            else if (q.size === 0) {
                return db('room_queue')
                    .update({
                        size: 1,
                        first: gameHistId,
                        last: gameHistId
                    });
            }
            else {
                db('game_history')
                    .where({ id: q.last })
                    .update({
                        next: gameHistId
                    })
                    .then(() => {
                        return db('room_queue')
                            .update({
                                size: q.size++,
                                first: q.first,
                                last: gameHistId
                            });
                    });
            }
        });
    },


    dequeue(db, queue) {
        if (queue.size === 1) {
            return db('room_queue')
                .where({ id: 1 })
                .update({
                    size: 0,
                    first: null,
                    last: null
                })
                .then(() => {
                    return db('game_history')
                        .select('*')
                        .where({ id: queue.first })
                        .first();
                });
        }
        else {
            db('game_history')
                .where({ id: queue.first })
                .select('next')
                .first()
                .then(next => {
                    return db('room_queue')
                        .where({ id: 1 })
                        .update({
                            size: queue.size--,
                            first: next,
                            last: queue.last
                        });
                });
        }
    },

    
    setNewGameData(db, gameId) {
        return db
            .insert({ game_id: gameId })
            .into('game_data')
            .returning('*')
            .then(rows => {
                return rows;
            });
    },



    swapTurn(db, gameId) {
        return db('game_history')
            .where({ id: gameId })
            .select('turn')
            .first()
            .then(turn => {
                let newTurn = (turn.turn === 'player1') ? 'player2': 'player1';

                return db('game_history')
                    .where({ id: gameId })
                    .update({
                        turn: newTurn
                    });
            });
    }
};

module.exports = socketService;