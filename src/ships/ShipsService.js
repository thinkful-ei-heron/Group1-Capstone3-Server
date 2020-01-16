const ShipsService = {

  setPlayer1Ships(db, gameId, shipData) {
    return db
      .from('game_data')
      .where({ game_id: gameId })
      .update({ player1_ships: shipData })
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  setPlayer2Ships(db, gameId, shipData) {
    return db
      .from('game_data')
      .where({ game_id: gameId })
      .update({ player2_ships: shipData })
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  checkForHit(target, gameData, opponentString) {
    let shipString = `${opponentString}_ships`;

    let opponentShips = JSON.parse(gameData[shipString]);

    let result = 'miss';
    let ship = null;

    for (let i = 0; i < opponentShips.length; i++) {
      if (opponentShips[i].spaces.includes(target)) {
        result = 'hit';
        ship = opponentShips[i].name;
        break;
      }
    }

    //maybe we can also add a way to check to see if all of a boats' coordinates
    //have been hit. if so we can return a message that ship has been sunk and 
    //we can mark it as sunk in the database.
    return { result, ship };
  },

  // HITS SERVICE FUNCTIONS

  addToHits(db, gameId, newHits, playerHitString) {

    return db
      .from('game_data')
      .where({ game_id: gameId })
      .update(`${playerHitString}`, newHits)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  // MISSES SERVICE FUNCTIONS

  addToMisses(db, gameId, newMisses, playerMissString) {

    return db
      .from('game_data')
      .where({ game_id: gameId })
      .update(`${playerMissString}`, newMisses)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

};

module.exports = ShipsService;