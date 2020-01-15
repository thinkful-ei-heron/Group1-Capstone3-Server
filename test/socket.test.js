require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const io = require('socket.io-client');

describe('Socket Routes', () => {
    let db;
    let testUser = { username: 'admin1', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG', email: 'someEmail@gmail.com' };
    let testUser2 = { username: 'admin2', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG', email: 'someEmail2@gmail.com' };
    let testUser3 = { username: 'admin3', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG', email: 'someEmail3@gmail.com' };

    let URL = 'http://localhost:8000';
    server = require('../src/server');
    let authOptions = {
        transportOptions: {
            polling: {
                extraHeaders: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE1NzkwMzk0NjMsInN1YiI6ImFkbWluMSJ9.pn2pMZHk3ocopmvODV4hG5t5ue9fbwjD-gwWawZY0H4'
                }
            }
        }
    };
    let authOptions2 = {
        transportOptions: {
            polling: {
                extraHeaders: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJpYXQiOjE1NzkxMTYwMTcsInN1YiI6ImFkbWluMiJ9.aj1zxaaN_NnXviDJW2dFfcI9CsklS2Lx6Y1be1VjqbE'
                }
            }
        }
    };
    let failAuthOptions = {
        transportOptions: {
            polling: {
                extraHeaders: {
                    'Authorization': 'Bearer notavalidtoken'
                }
            }
        }
    };



    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });

        app.set('db', db);
    });

    before((done) => {
        db.raw('truncate users, stats, game_history, game_data, room_queue restart identity cascade');

        done();
    });


    afterEach(() => db.raw('truncate users, stats, game_history, game_data, room_queue restart identity cascade'));

    after(() => db.destroy());


    describe('Socket Auth', () => {

        beforeEach(() => {
            return db.into('users')
                .insert(testUser)
                .then(() => {
                    return db.into('room_queue')
                        .insert({ size: 0 });
                })
        });


        it('emits an error-message if improper auth headers', (done) => {
            const client = io.connect(URL, failAuthOptions);

            client.on('error', error => {
                expect(error).to.eql({ error: 'Invalid Authorization headers' });
                client.disconnect(true);
                done();
            });
        });

        it('connects properly if provided with correct auth headers', (done) => {
            const client = io.connect(URL, authOptions);

            client.on('connect', () => {
                client.disconnect(true);
                done();
            });
        });
    });


    describe('Socket join_room', () => {

        context('Nothing in queue', () => {
            beforeEach(async () => {
                await db.into('users')
                    .insert(testUser)
                    .then(() => {
                        return db.into('room_queue')
                            .insert({ size: 0 })
                    });
            });

            it('joins to a random room if provided with `random` string and nothing in queue', (done) => {


                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('joined', data => {
                        expect(data).to.be.an('Object');
                        expect(data).to.have.all.keys('room', 'player', 'gameId');
                        expect(data.player).to.equal('player1');
                        expect(data.gameId).to.equal(1);

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', 'random');
                });

            });
        });



        context('One game in queue', () => {
            beforeEach(async () => {
                await db.into('users')
                    .insert([testUser, testUser2])
                    .then(() => {
                        db.into('game_history')
                            .insert({ player1: 2, room_id: '1234' })
                            .then(() => {
                                return db.into('room_queue')
                                    .insert({ size: 1, first: 1, last: 1 })
                            });
                    });
            });


            it('joins to the queued room if provided with `random` string and someone else in queue', (done) => {


                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('joined', data => {

                        expect(data).to.be.an('Object');
                        expect(data).to.have.all.keys('room', 'player', 'gameId');
                        expect(data.player).to.equal('player2');
                        expect(data.gameId).to.equal(1);
                        expect(data.room).to.equal('1234')

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', 'random');
                });

            });
        });




        context('Your game in queue', () => {
            beforeEach(async () => {
                await db.into('users')
                    .insert([testUser, testUser2])
                    .then(() => {
                        db.into('game_history')
                            .insert({ player1: 1, room_id: '1234' })
                            .then(() => {
                                return db.into('room_queue')
                                    .insert({ size: 1, first: 1, last: 1 })
                            });
                    });
            });

            it('errors if you try to join a queue with yourself', (done) => {
                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('error-message', data => {
                        expect(data).to.eql({ error: 'You can only have one game in the queue at a given time. Please wait for someone else to match against you.' });

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', 'random');
                });
            });
        });



        context('10 active games', () => {

            let tenGames = [
                { player1: 1, player2: 2, room_id: '1' }, { player1: 1, player2: 2, room_id: '2' }, { player1: 1, player2: 2, room_id: '3' },
                { player1: 1, player2: 2, room_id: '4' }, { player1: 1, player2: 2, room_id: '5' }, { player1: 1, player2: 2, room_id: '6' },
                { player1: 1, player2: 2, room_id: '7' }, { player1: 1, player2: 2, room_id: '8' }, { player1: 1, player2: 2, room_id: '9' },
                { player1: 1, player2: 2, room_id: '10', game_status: 'complete' }, { player1: 3, player2: 2, room_id: '11' }]


            beforeEach(async () => {
                await db.into('users')
                    .insert([testUser, testUser2, testUser3])
                    .then(() => {
                        db.into('game_history')
                            .insert(tenGames)
                            .then(() => {
                                return db.into('room_queue')
                                    .insert({ size: 0 })
                            });
                    });
            });

            it('errors if you try to create a game if you already have 10 active games', (done) => {
                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('error-message', data => {
                        expect(data).to.eql({ error: 'You can only have up to 10 active games at any time.' });

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', 'random');
                });
            });


            it('rejoins to room if allowed', (done) => {
                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('reconnected', data => {
                        expect(data).to.eql({ room: '3' });

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', '3');
                });
            });


            it('errors if not allowed in room', (done) => {
                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('error-message', data => {
                        expect(data).to.eql({ error: 'You are not allowed in this room' });

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', '11');
                });
            });


            it('errors if game is completed', (done) => {
                const client = io.connect(URL, authOptions);

                client.on('connect', () => {
                    client.on('error-message', data => {
                        expect(data).to.eql({ error: 'This game has already been finished' });

                        client.disconnect(true);
                        done();
                    });

                    client.emit('join_room', '10');
                });
            });
        });

























    });

    describe('Socket in active game', () => {
        let activeGame = { player1: 1, player2: 2, room_id: '1' }

        beforeEach(async () => {
            await db.into('users')
                .insert([testUser, testUser2])
                .then(() => {
                    db.into('game_history')
                        .insert(activeGame)
                        .then(() => {
                            return db.into('room_queue')
                                .insert({ size: 0 })
                        });
                });
        });



        it('ships_ready broadcasts to opponent', (done) => {
            const client = io.connect(URL, authOptions);
            const client2 = io.connect(URL, authOptions2);

            client.on('connect', () => {
                client.on('reconnected', () => {
                    
                    client.on('opponent_ready', () => {
                        client.disconnect(true);
                        done();
                    });
                });

                client.emit('join_room', '1');
            });

            client2.on('connect', () => {
                client2.on('reconnected', () => {
                    
                    client2.emit('ships_ready', '1')
                    client2.disconnect(true);
                });

                client2.emit('join_room', '1');
            });
        });

        it('send-message broadcasts to opponent', (done) => {
            const client = io.connect(URL, authOptions);
            const client2 = io.connect(URL, authOptions2);

            client.on('connect', () => {
                client.on('reconnected', () => {
                    
                    client.on('chat-message', (data) => {
                        expect(data).to.be.an('Object');
                        expect(data.username).to.equal('admin2');
                        expect(data.message).to.equal('This test is working');


                        client.disconnect(true);
                        done();
                    });
                });

                client.emit('join_room', '1');
            });

            client2.on('connect', () => {
                client2.on('reconnected', () => {
                    
                    client2.emit('send-message', {room: '1', message: 'This test is working'})
                    client2.disconnect(true);
                });

                client2.emit('join_room', '1');
            });
        });


        // it('send-message broadcasts to opponent', (done) => {
        //     const client = io.connect(URL, authOptions);
        //     const client2 = io.connect(URL, authOptions2);

        //     client.on('connect', () => {
        //         client.on('reconnected', () => {
                    
        //             client.on('chat-message', (data) => {
        //                 expect(data).to.be.an('Object');
        //                 expect(data.username).to.equal('admin2');
        //                 expect(data.message).to.equal('This test is working');


        //                 client.disconnect(true);
        //                 done();
        //             });
        //         });

        //         client.emit('join_room', '1');
        //     });

        //     client2.on('connect', () => {
        //         client2.on('reconnected', () => {
                    
        //             client2.emit('send-message', {room: '1', message: 'This test is working'})
        //             client2.disconnect(true);
        //         });

        //         client2.emit('join_room', '1');
        //     });
        // });
    });

    // describe('Socket send-message', () => {

    // });

    // describe('', () => {

    // });
});