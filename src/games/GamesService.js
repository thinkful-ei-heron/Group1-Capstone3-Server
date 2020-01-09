const GamesService = {
  
  startNewGame(db, userId, userId2){
    return db
      .insert({player1: userId, player2: userId2})
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

  getAllActiveGames(db, userId){
    return db
      .select('*')
      .from('game_history')
      .where({player1: userId, game_status:'active'})
      .orWhere({player2: userId, game_status:'active'})
      .returning('*')
      .then(rows => {
        return rows;
      });
  }

};

module.exports = GamesService;