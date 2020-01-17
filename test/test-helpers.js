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
        email: 'test1Email@gmail.com',
      },
      {
        id: 2,
        username: 'test-2',
        password: 'pass',
        email: 'test2Email@gmail.com',
      },
    ]
  };

function makeGameHistoryArray(){
    return [
      {
        id: 1,
        player1: 2,
        player2: 1,
        room_id: "100",
        next: null,
        turn: 'player1',
        game_status: 'active'
      },
      {
        id: 2,
        player1: 1,
        player2: 2,
        room_id: "200",
        next: null,
        turn: 'player2',
        game_status: 'active'
      },
      {
        id: 3,
        player1: 1,
        player2: 2,
        room_id: "300",
        next: null,
        turn: 'player2',
        game_status: 'active'
      },
      {
        id: 4,
        player1: 1,
        player2: 2,
        room_id: "400",
        next: null,
        turn: 'player2',
        game_status: 'complete'
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
      player2_hits: null,
      player2_misses:null,
      winner: null
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
      winner: null
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
      winner: null
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
      winner: 'player1'
    },
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
          player2_hits: game.player2_hits,
          player2_misses: game.player2_misses,
          winner: game.winner
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