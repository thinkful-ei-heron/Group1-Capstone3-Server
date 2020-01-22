require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Games Endpoints', () => {
  let db;
  const {
    testUsers,
    testGames,
    testData
  } = helpers.makeGamesFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));


  describe('/api/games', () => {

    context('Given incorrect auth', () => {
      it('responds with error given no auth header', () => {
        return supertest(app)
          .get('/api/games')
          .expect(401, { error: 'Missing bearer token' });
      });
      it('responds with invalid auth given wrong auth header', () => {
        return supertest(app)
          .get('/api/games')
          .set('Authorization', 'Bearer wrong')
          .expect(401, { error: 'Invalid credentials' });
      });
    });

    context('Given no games', () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers
        )
      );

      it('responds with 200 and an empty list and the user id', () => {
        return supertest(app)
          .get('/api/games')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, { result: [], userId: testUsers[0].id });
      });
    });

    context('Given a mix of active and complete games in the db', () => {
      beforeEach('insert games', () =>
        helpers.seedGamesDataTable(
          db,
          testUsers,
          testGames,
          testData
        )
      );



      it('returns correct game data even when active expired game in game_history (FULL INTEGRATION)', () => {
        let expectedGames = helpers.makeGameHistoryArray();
        expectedGames = expectedGames.slice(0, -2);
        for (let i = 0; i < expectedGames.length; i++) {
          if (expectedGames[i].player1 === testUsers[0].id) {
            expectedGames[i].player1_username = testUsers[0].username;
            expectedGames[i].player2_username = testUsers[1].username;
          } else {
            expectedGames[i].player1_username = testUsers[1].username;
            expectedGames[i].player2_username = testUsers[0].username;
          }
        }


        return supertest(app)
          .get('/api/games')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, { result: expectedGames, userId: 1 })
          .then(() => {
            db('game_history')
              .where({ id: 5 })
              .first()
              .then(game => {
                expect(game).to.eql({
                  id: 5,
                  player1: 1,
                  player2: 2,
                  room_id: "b46c97ff-e6b1-4543-beb1-461139fa731b",
                  next: null,
                  turn: 'player2',
                  game_status: 'expired'
                });
              });
          });
      });
    });
    context('Given that there are only complete games in the db', () => {
      let adjustedTestGames = helpers.makeGameHistoryArray();
      adjustedTestGames.forEach(game => {
        game.game_status = 'complete';
      });

      beforeEach('insert complete games only', () =>
        helpers.seedGameHistory(
          db,
          adjustedTestGames,
          testUsers
        )
      );
      it('responds with an empty result array and the userid', () => {
        return supertest(app)
          .get('/api/games')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, {
            result: [],
            userId: testUsers[0].id
          });
      });
    });

    context('Given that the user has no active games', () => {
      let adjustedTestGames = helpers.makeGameHistoryArray();
      adjustedTestGames.forEach(game => {
        game.player1 = testUsers[1].id;
        game.player2 = testUsers[1].id;
      });

      beforeEach('insert games that the test-user is not a player in', () =>
        helpers.seedGameHistory(
          db,
          adjustedTestGames,
          testUsers
        )
      );

      it('responds with an empty result array and the userid', () => {
        return supertest(app)
          .get('/api/games')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, {
            result: [],
            userId: testUsers[0].id
          });
      });
    });
  });

  describe('/api/games/prev', () => {
    context('Given no games', () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers
        )
      );

      it('responds with 200 and an empty list and the user id/username', () => {
        return supertest(app)
          .get('/api/games/prev')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, { result: [], userId: testUsers[0].id, playerUsername: 'test-1' });
      });
    });

    context('Given a mix of active and complete games in the db', () => {
      beforeEach('insert games', () =>
        helpers.seedGamesDataTable(
          db,
          testUsers,
          testGames,
          testData
        )
      );

      it('returns correct previous game data', () => {

        return supertest(app)
          .get('/api/games/prev')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200)
          .then((res) => {
            expect(res.body).to.be.an('Object');
            expect(res.body).to.have.all.keys('result', 'userId', 'playerUsername');

            expect(res.body.result).to.be.an('Array');
            expect(res.body.result.length).to.equal(1);

            expect(res.body.result[0]).to.eql({
              game_id: 4,
              player1_username: 'test-1',
              player2_username: 'test-2',
              game_status: 'complete',
              winner: 'player1'
            });

            expect(res.body.userId).to.equal(1);
          });
      });
    });
  });

  describe('/api/games/stats', () => {
    context('given that the user has not played any games', () => {
      let stats = [];
      testUsers.map((user, index) => {
        stats.push({ id: index + 1, userid: user.id });
      });

      beforeEach('insert new user and blank stats row into table', () =>
        helpers.seedStatsTable(
          db,
          testUsers,
          stats
        )
      );

      it('returns stats all initialized to 0 for the logged in user', () => {
        return supertest(app)
          .get('/api/games/stats')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, {
            id: 1,
            userid: testUsers[0].id,
            username: testUsers[0].username,
            wins: 0,
            losses: 0
          });
      });
    });
    context('given that the user has won and lost some games', () => {
      let stats = [];
      testUsers.map((user, index) => {
        stats.push({ id: index + 1, userid: user.id });
      });

      beforeEach('insert new user and blank stats row into table', () =>
        helpers.incrementStats(
          db,
          testUsers[0].id,
          testUsers,
          stats
        )
      );

      it('returns incremented wins and losses for the user', () => {
        return supertest(app)
          .get('/api/games/stats')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, {
            id: 1,
            userid: testUsers[0].id,
            username: testUsers[0].username,
            wins: 2,
            losses: 1
          });
      });
    });
  });

  describe('/activegame/:gameId/:playerNum', () => {
    context('given incorrect params an error is returned', () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db,
          testUsers
        )
      );
      it('returns an error when gameId is NaN', () => {
        return supertest(app)
          .get('/api/games/activegame/wrongId/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Must send a valid game id' });
      });

      it('returns an error when gameId is NaN', () => {
        return supertest(app)
          .get('/api/games/activegame/`1`/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Must send a valid game id' });
      });

      it('returns an error when playerNum is incorrect', () => {
        return supertest(app)
          .get('/api/games/activegame/1/player3')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Must send a valid playerNum' });
      });

      it('returns an error when playerNum is incorrect', () => {
        return supertest(app)
          .get('/api/games/activegame/1/2')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Must send a valid playerNum' });
      });
    });
    context('given that game data exists', () => {
      beforeEach('insert users, game history, and game data', () =>
        helpers.seedGamesDataTable(
          db,
          testUsers,
          testGames,
          testData
        )
      );
      it('throws an error when gameId does not exist', () => {
        return supertest(app)
          .get('/api/games/activegame/99/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Must send a gameId of an existing game' });
      });

      it('throws an error when given gameId of a completed game', () => {
        return supertest(app)
          .get('/api/games/activegame/4/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(400, { error: 'Cannot resume a completed game' });
      });

      it('returns the correct gameData for game1 player1', () => {
        let expectedResult = {
          player2_ships: testData[0].player2_ships ? true : false,
          player1_ships: testData[0].player1_ships,
          player1_hits: testData[0].player1_hits,
          player2_hits: testData[0].player2_hits,
          player1_misses: testData[0].player1_misses,
          player2_misses: testData[0].player2_misses,
          currentUser: 'player1',
          id: 1,
          game_id: 1,
          turn: testGames[0].turn,
          winner: testData[0].winner,
          last_move: null
        };
        return supertest(app)
          .get('/api/games/activegame/1/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedResult);
      });
    });
    context('PATCH endpoint', () => {
      beforeEach('insert users, game history, and game data', () =>
        helpers.seedGamesDataTable(
          db,
          testUsers,
          testGames,
          testData
        )
      );
      it('returns 400 and error when trying to forfeit an game that does not exist', () => {
        return supertest(app)
          .patch('/api/games/activegame/99/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send({ opponentNum: 'player2', opponentId: 2 })
          .expect(400, { error: 'invalid game id' });
      });

      it('returns 400 and error when trying to forfeit an already ended game', () => {
        return supertest(app)
          .patch('/api/games/activegame/4/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send({ opponentNum: 'player2', opponentId: 2 })
          .expect(400, { error: 'Cannot Forfeit. Game has already been forfeited, completed, or expired' });
      });

      it('returns the correct message when forfeiting a game', () => {
        return supertest(app)
          .patch('/api/games/activegame/1/player1')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send({ opponentNum: 'player2', opponentId: 2 })
          .expect(200, { message: 'Game forfeited' });
      });
    });
  });


  describe('/api/games/results/:gameId', () => {
    beforeEach('insert users, game history, and game data', () =>
      helpers.seedGamesDataTable(
        db,
        testUsers,
        testGames,
        testData
      )
    );

    it('returns an error when given an incorrect gameId param', () => {
      return supertest(app)
        .get('/api/games/results/99')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(400, { error: 'Must send a gameId of an existing game' });
    });

    it('returns an error when given an incomplete gameId', () => {
      return supertest(app)
        .get('/api/games/results/1')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(400, { error: 'Game is not completed' });
    });

    it('returns an error when user is not part of the game', () => {
      return supertest(app)
        .get('/api/games/results/4')
        .set('Authorization', helpers.makeAuthHeader(testUsers[2]))
        .expect(400, { error: 'This is not your game.' });
    });

    it('returns the correct game data given a valid completed game', () => {

      return supertest(app)
        .get('/api/games/results/4')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {

          expect(res.body).to.be.an('Object');
          expect(res.body).to.have.all.keys('player1_hits', 'player1_misses', 'player2_hits', 'player2_misses', 'winner');
          expect(res.body.player1_hits).to.be.an('Array');
          expect(res.body.player1_hits).to.eql(['A1', 'A2', 'A3', 'A4', 'A5']);
          expect(res.body.winner).to.equal('player1');

        });
    });
  });







});

