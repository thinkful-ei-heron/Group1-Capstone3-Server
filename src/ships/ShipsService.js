const STORE = require('../STORE');

const ShipsService = {

  checkForHit(target) {
    let result = 'miss';
    let ship = null;
    STORE.opponentShips.forEach(boat => {
      if (boat.spaces.includes(target)) {
        result = 'hit';
        ship = boat.name;
        //add this target to the hits for the user for this game.
      }
    });
    //maybe we can also add a way to check to see if all of a boats' coordinates
    //have been hit. if so we can return a message that ship has been sunk and 
    //we can mark it as sunk in the database.
    if (result === 'miss') {
      //add this target to the misses for the user for this game.
    }
    return { result, ship };
  }

};

module.exports = ShipsService;