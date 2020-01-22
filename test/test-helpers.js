// const knext = require('knex')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const GamesService = require('../src/games/GamesService');


function makeUsersArray() {
    return [
      {
        id: 1,
        username: 'test-1',
        password: 'pass', 
      },
      {
        id: 2,
        username: 'test-2',
        password: 'pass',
      },
      {
        id: 3,
        username: 'test-3',
        password: 'pass',
      }
    ]
  };

function makeGameHistoryArray(){
    return [
      {
        id: 1,
        player1: 2,
        player2: 1,
        room_id: "4e48861f-031e-40ed-afb9-90cc99d212dc",
        next: null,
        turn: 'player1',
        game_status: 'active'
      },
      {
        id: 2,
        player1: 1,
        player2: 2,
        room_id: "8802e54c-fac9-4580-83bd-8728d40262e2",
        next: null,
        turn: 'player2',
        game_status: 'active'
      },
      {
        id: 3,
        player1: 1,
        player2: 2,
        room_id: "ed68f005-b1c4-42b3-bcca-f2d75f834a9a",
        next: null,
        turn: 'player2',
        game_status: 'active'
      },
      {
        id: 4,
        player1: 1,
        player2: 2,
        room_id: "d1774744-f331-4460-a173-a76c57c3c13e",
        next: null,
        turn: 'player2',
        game_status: 'complete'
      },
      {
        id: 5,
        player1: 1,
        player2: 2,
        room_id: "b46c97ff-e6b1-4543-beb1-461139fa731b",
        next: null,
        turn: 'player2',
        game_status: 'active'
      }
    ]
  };
function makeGamesDataArray(){
  return [
    {
      id: 1,
      game_id: 1,
      player1_ships: 
      [{ 'name': 'aircraftCarrier', 'length': 5, 'spaces': ['A1', 'A2', 'A3', 'A4', 'A5'] },
      { 'name': 'battleship', 'length': 4, 'spaces': ['B1', 'B2', 'B3', 'B4'] },
      { 'name': 'cruiser', 'length': 3, 'spaces': ['C1', 'C2', 'C3']  },
      { 'name': 'submarine', 'length': 3, 'spaces': ['D1', 'D2', 'D3'] },
      { 'name': 'defender', 'length': 2, 'spaces': ['E1', 'E2'] }],
      player2_ships: null,
      player1_hits: null,
      player1_misses: null,
      player2_hits: ['A1', 'A2', 'A3', 'A4', 'A5'],
      player2_misses:null,
      winner: null,
      last_move: null
    },
    {
      id: 2,
      game_id: 2,
      player1_ships: 
      [{ 'name': 'aircraftCarrier', 'length': 5, 'spaces': ['A1', 'A2', 'A3', 'A4', 'A5'] },
      { 'name': 'battleship', 'length': 4, 'spaces': ['B1', 'B2', 'B3', 'B4'] },
      { 'name': 'cruiser', 'length': 3, 'spaces': ['C1', 'C2', 'C3']  },
      { 'name': 'submarine', 'length': 3, 'spaces': ['D1', 'D2', 'D3'] },
      { 'name': 'defender', 'length': 2, 'spaces': ['E1', 'E2'] }],
      player2_ships: null,
      player1_hits: null,
      player1_misses: null,
      player2_hits: null,
      player2_misses:null,
      winner: null,
      last_move: null
    },
    {
      id: 3,
      game_id: 3,
      player1_ships: 
      [{ 'name': 'aircraftCarrier', 'length': 5, 'spaces': ['A1', 'A2', 'A3', 'A4', 'A5'] },
      { 'name': 'battleship', 'length': 4, 'spaces': ['B1', 'B2', 'B3', 'B4'] },
      { 'name': 'cruiser', 'length': 3, 'spaces': ['C1', 'C2', 'C3']  },
      { 'name': 'submarine', 'length': 3, 'spaces': ['D1', 'D2', 'D3'] },
      { 'name': 'defender', 'length': 2, 'spaces': ['E1', 'E2'] }],
      player2_ships: null,
      player1_hits: null,
      player1_misses: null,
      player2_hits: null,
      player2_misses:null,
      winner: null,
      last_move: null
    },
    {
      id: 4,
      game_id: 4,
      player1_ships: 
      [{ 'name': 'aircraftCarrier', 'length': 5, 'spaces': ['A1', 'A2', 'A3', 'A4', 'A5'] },
      { 'name': 'battleship', 'length': 4, 'spaces': ['B1', 'B2', 'B3', 'B4'] },
      { 'name': 'cruiser', 'length': 3, 'spaces': ['C1', 'C2', 'C3']  },
      { 'name': 'submarine', 'length': 3, 'spaces': ['D1', 'D2', 'D3'] },
      { 'name': 'defender', 'length': 2, 'spaces': ['E1', 'E2'] }],
      player2_ships: null,
      player1_hits: null,
      player1_misses: null,
      player2_hits: null,
      player2_misses:null,
      winner: 'player1',
      last_move: null
    },
    {
      id: 5,
      game_id: 5,
      player1_ships: 
      [{ 'name': 'aircraftCarrier', 'length': 5, 'spaces': ['A1', 'A2', 'A3', 'A4', 'A5'] },
      { 'name': 'battleship', 'length': 4, 'spaces': ['B1', 'B2', 'B3', 'B4'] },
      { 'name': 'cruiser', 'length': 3, 'spaces': ['C1', 'C2', 'C3']  },
      { 'name': 'submarine', 'length': 3, 'spaces': ['D1', 'D2', 'D3'] },
      { 'name': 'defender', 'length': 2, 'spaces': ['E1', 'E2'] }],
      player2_ships: null,
      player1_hits: null,
      player1_misses: null,
      player2_hits: null,
      player2_misses:null,
      winner: null,
      last_move: new Date("2016-07-27T07:45:00Z")
    }
  ]
}

function cleanTables(db) {
    return db.raw(
      `TRUNCATE 
        room_queue, 
        game_data, 
        game_history, 
        stats, 
        users
        RESTART IDENTITY CASCADE`
      );
  };

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.username,
      algorithm: 'HS256',
    })
    return `Bearer ${token}`
  };

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 1)
    }))
    return db.into('users').insert(preppedUsers)
    .then(() =>
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      ))
  
  };

function seedGameHistory(db, games, users) {
    return db.transaction(async trx => {
      await seedUsers(trx, users)
      await trx.into('game_history').insert(games)
      await trx.raw(
        `SELECT setval('game_history_id_seq', ?)`,
        [games[games.length - 1].id],
      )
    })
  };

  function seedStatsTable(db, users, stats){
    return db.transaction(async trx => {
      await seedUsers(trx, users)
      await trx.into('stats').insert(stats)
      await trx.raw(
        `SELECT setval('stats_id_seq', ?)`,
        [stats[stats.length - 1].id],
      )
    })
  }

  //increment wins by 2 and loses by 1
  function incrementStats(db, userId, users, stats){
    return db.transaction(async trx => {
      await seedStatsTable(db, users, stats)
      await GamesService.updateWinnerStats(db, userId)
      await GamesService.updateWinnerStats(db, userId)
      await GamesService.updateLoserStats(db, userId)
    })
  }

function makeGamesFixtures() {
    const testUsers = makeUsersArray();
    const testGames = makeGameHistoryArray();
    const testData = makeGamesDataArray();
    return {testUsers, testGames, testData};
  };



function seedGamesDataTable(db, users, games, data) {
  return db.transaction(async trx => {
    await seedGameHistory(trx, games, users)
      data.forEach(async game => {
        await trx.into('game_data').insert({
          id: game.id,
          game_id: game.game_id,
          player1_ships: JSON.stringify(game.player1_ships),
          player2_ships: game.player2_ships,
          player1_hits: game.player1_hits,
          player1_misses: game.player1_misses,
          player2_hits: JSON.stringify(game.player2_hits),
          player2_misses: game.player2_misses,
          winner: game.winner,
          last_move: game.last_move
        })
      })
    
    await trx.raw(
      `SELECT setval('game_data_id_seq', ?)`,
      [data[data.length - 1].id],
    )
  })
}

module.exports = {
  makeUsersArray,
  makeGameHistoryArray,
  cleanTables,
  makeAuthHeader,
  seedUsers,
  seedGameHistory,
  seedStatsTable,
  incrementStats,
  makeGamesFixtures,
  makeGamesDataArray,
  seedGamesDataTable
};