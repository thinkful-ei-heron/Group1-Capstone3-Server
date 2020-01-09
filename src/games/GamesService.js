const GamesService = {
  
  startNewGame(db, userId, userId2){
    return db
      .insert({player1: userId, player2: userId2, turn:true, datastring:'test'})
      .into('game_history')
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  setNewGameData(db, gameId){
    return db
      .insert({game_id: gameId})
      .into('game_data')
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

};

module.exports = GamesService;