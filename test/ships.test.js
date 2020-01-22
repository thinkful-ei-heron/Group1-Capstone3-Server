require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');

describe('/ships route', () => {
    let db;
    let testUser = { username: 'admin1', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG' };
    let testUser2 = { username: 'admin2', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG' };
    let testUser3 = { username: 'admin3', password: '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG' };

    let testShips = [{ "name": "aircraftCarrier", "length": 5, "spaces": ["A1", "A2", "A3", "A4", "A5"] }, { "name": "battleship", "length": 4, "spaces": ["A6", "A7", "A8", "A9"] }, { "name": "cruiser", "length": 3, "spaces": ["A10", "B10", "C10"] }, { "name": "submarine", "length": 3, "spaces": ["D10", "E10", "F10"] }, { "name": "defender", "length": 2, "spaces": ["I10", "H10"] }];

    let webToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE1NzkwMzk0NjMsInN1YiI6ImFkbWluMSJ9.pn2pMZHk3ocopmvODV4hG5t5ue9fbwjD-gwWawZY0H4';

    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });

        app.set('db', db);
    });

    before((done) => {
        db.raw(`TRUNCATE room_queue, game_data, game_history, stats, users RESTART IDENTITY CASCADE`);

        done();
    });


    afterEach(() => {
        return db.raw(
            `TRUNCATE room_queue, game_data, game_history, stats, users RESTART IDENTITY CASCADE`
        );

    });

    after(() => db.destroy());


    describe('POST /api/ships Route', () => {

        context('database is populated', () => {
            let games = [
                { player1: 1, player2: 2, room_id: 'e4b2da9f-e85a-4d3d-b69b-e1cdf0727324' }, { player1: 1, player2: 2, room_id: 'cb36b04f-5bf8-4bcc-84ec-5a7c9413aafd' },
                { player1: 3, player2: 2, room_id: '07e295c4-bb19-447f-ba03-3eb4c91447a8' }, { player1: 1, player2: 2, room_id: '4e48861f-031e-40ed-afb9-90cc99d212dc' }
            ];

            let gameData = [
                { game_id: 1 }, { game_id: 2, player1_ships: testShips }
            ];

            beforeEach(async () => {
                await db.into('users')
                    .insert([testUser, testUser2, testUser3])
                    .then(() => {
                        db.into('game_history')
                            .insert(games)
                            .then(() => {
                                db.into('game_data')
                                    .insert(gameData)
                                    .then(() => {
                                        return db.into('room_queue')
                                            .insert({ size: 0 })
                                    });
                            });
                    });
            });



            it('returns 400 with error message if no shipData', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ playerNum: 'player1', gameId: 1 })
                    .expect(400, { error: 'Must provide player number, game id and ship data to save ship data' });
            });
            it('returns 400 with error message if no playerNum', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: [], gameId: 1 })
                    .expect(400, { error: 'Must provide player number, game id and ship data to save ship data' });
            });
            it('returns 400 with error message if no gameId', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: [], playerNum: 'player1' })
                    .expect(400, { error: 'Must provide player number, game id and ship data to save ship data' });
            });





            it('returns 400 with error message if no game found ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: testShips, playerNum: 'player1', gameId: 9999 })
                    .expect(400, { error: 'Game not found' });
            });

            it('returns 400 with error message if playerNum doesnt match with userId', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: testShips, playerNum: 'player2', gameId: 1 })
                    .expect(400, { error: 'Validation failed for this game room' });
            });

            it('returns 400 with error message if no game data found ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: testShips, playerNum: 'player1', gameId: 4 })
                    .expect(400, { error: 'Game data not found' });
            });

            it('returns 400 with error message if malformed ship data ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: '[1, 3, 4]', playerNum: 'player1', gameId: 1 })
                    .expect(400, { error: 'Malformed ship data' });
            });

            it('returns 400 with error message if already set ships ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: testShips, playerNum: 'player1', gameId: 2 })
                    .expect(400, { error: 'Cannot replace your ships' });
            });

            it('returns 400 with error message if incomplete ship data ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: [1, 3, 4], playerNum: 'player1', gameId: 1 })
                    .expect(400, { error: 'Must provide data for all 5 ships' });
            });

            it('returns 400 with error message if incomplete ship sub-data ', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: [1, 2, 3, 4, 5], playerNum: 'player1', gameId: 1 })
                    .expect(400, { error: 'Must provide complete data for all 5 ships' });
            });




            it('returns 201 if ships sucessfully set (FULL INTEGRATION)', () => {
                return supertest(app)
                    .post('/api/ships')
                    .set('Authorization', `Bearer ${webToken}`)
                    .send({ shipData: testShips, playerNum: 'player1', gameId: 1 })
                    .expect(201)
                    .then((res) => {


                        db('game_data')
                            .select('*')
                            .where({ game_id: 1 })
                            .first()
                            .then((row) => {
                                expect(row).to.be.an('Object');
                                expect(row).to.have.all.keys('id', 'game_id', 'player1_ships', 'player2_ships', 'player1_hits', 'player2_hits', 'player1_misses', 'player2_misses', 'winner', 'last_move');
                                expect(row.game_id).to.equal(1);
                                expect(JSON.parse(row.player1_ships)).to.eql(testShips);
                            });
                    });
            });
        });
    });
});