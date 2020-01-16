const ShipsService = {
  //accesses the player's ships in the game_data table and updates the location
  validateShipData(shipData, playerNum, gameData) {
    let parsedData = JSON.parse(shipData);

    if(!Array.isArray(parsedData)) {
      return 'Malformed ship data';
    }

    if (gameData[`${playerNum}_ships`]) {
      return 'Cannot replace your ships';
    }

    if (parsedData.length !== 5) {
      return 'Must provide data for all 5 ships';
    }

    let badData = false;
    try {
      parsedData.forEach(ship => {
        if (ship.spaces.length <= 0 || ship.spaces.length > 5) {
          badData = true;
        }
      });
    } 
    catch(e) {
      badData = true;
    }
    
    if(badData) return 'Must provide complete data for all 5 ships';
  },




  setPlayerShips(db, game_id, playerString, shipData) {
    let shipString = `${playerString}_ships`;
    return db
      .from('game_data')
      .where({ game_id })
      .update(`${shipString}`, shipData)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  //function that checks the opponent ships to see if the target is included
  //in any of the ship location arrays. If a hit is made, it further checks to see
  // if the ship has been sunk.
  checkForHit(target, gameData, opponentString, playerString) {
    let shipString = `${opponentString}_ships`;
    let opponentShips = JSON.parse(gameData[shipString]);
    let playerHits = JSON.parse(gameData[`${playerString}_hits`]);

    let result = 'miss';
    let ship = null;
    let sunk = null;

    for (let i = 0; i < opponentShips.length; i++) {
      if (opponentShips[i].spaces.includes(target)) {
        result = 'hit';
        ship = opponentShips[i].name;
        playerHits = playerHits ? [...playerHits, target] : [target];
        if (opponentShips[i].spaces.every(value => playerHits.includes(value))) {
          sunk = true;
        }
        break;
      }
    }
    return { result, ship, sunk };
  },


  checkForRepeatMove(target, gameData, playerString) {
    let repeat = false;

    if (gameData[`${playerString}_hits`]) {
      let myHits = JSON.parse(gameData[`${playerString}_hits`]);
      if (myHits.includes(target)) repeat = true;
    }

    if (gameData[`${playerString}_misses`]) {
      let myMisses = JSON.parse(gameData[`${playerString}_misses`]);
      if (myMisses.includes(target)) repeat = true;
    }


    return repeat;

  },

  // HITS SERVICE FUNCTIONS

  // add target to player's hit's in game_data table
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

  //add target to player's misses in game_data
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