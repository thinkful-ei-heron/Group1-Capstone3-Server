const ShipsService = {

  setPlayer1Ships(db, gameId, shipData){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .update({player1_ships: shipData})
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  setPlayer2Ships(db, gameId, shipData){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .update({player2_ships: shipData})
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  accessPlayer1Ships(db, gameId){
    return db
      .from('game_data')
      .where({game_id:gameId})
      .select('player1_ships')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  accessPlayer2Ships(db, gameId){
    return db
      .from('game_data')
      .where({game_id:gameId})
      .select('player2_ships')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  checkForHit(target, ships) {
    let opponentShips = JSON.parse(ships);
    let result = 'miss';
    let ship = null;
    opponentShips.forEach(boat => {
      if (boat.spaces.includes(target)) {
        result = 'hit';
        ship = boat.name;
      }
    });
    //maybe we can also add a way to check to see if all of a boats' coordinates
    //have been hit. if so we can return a message that ship has been sunk and 
    //we can mark it as sunk in the database.
    return { result, ship };
  },

  // HITS SERVICE FUNCTIONS
  accessPlayer1Hits(db, gameId){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .select('player1_hits')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  accessPlayer2Hits(db, gameId){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .select('player2_hits')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  addToHitsPlayer1(db, gameId, player1_hits){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .update({player1_hits})
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  addToHitsPlayer2(db, gameId, player2_hits){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .update({player2_hits})
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

// MISSES SERVICE FUNCTIONS
  accessPlayer1Misses(db, gameId){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .select('player1_misses')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  accessPlayer2Misses(db, gameId){
    return db
      .from('game_data')
      .where({game_id: gameId})
      .select('player2_misses')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

addToMissesPlayer1(db, gameId, player1_misses) {
  return db
    .from('game_data')
      .where({game_id: gameId})
      .update({player1_misses})
      .returning('*')
      .then(rows => {
        return rows[0];
      });
},

addToMissesPlayer2(db, gameId, player2_misses) {
  return db
    .from('game_data')
      .where({game_id: gameId})
      .update({player2_misses})
      .returning('*')
      .then(rows => {
        return rows[0];
      });
},

};

module.exports = ShipsService;