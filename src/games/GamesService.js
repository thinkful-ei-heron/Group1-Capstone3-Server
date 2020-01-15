const GamesService = {

  getAllActiveGames(db, userId){
    return db
      .select('game_history.*', 
        'player1.username as player1_username',
        'player2.username as player2_username')
      .from('game_history')
      .where({player1: userId, game_status:'active'})
      .orWhere({player2: userId, game_status:'active'})
      .join('users as player1', 'player1.id', 'game_history.player1')
      .leftJoin('users as player2', 'player2.id', 'game_history.player2')
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  retrieveGameData(db, gameId) {
    return db
      .select('game_data.*', 'game_history.turn')
      .from('game_data')
      .where({game_id: gameId})
      .join('game_history', 'game_data.game_id', 'game_history.id')
      .returning('*')
      .then(rows => {
        return rows;
      });
  },

  retrieveResults(db, gameId) {
    return db
    .select('game_data.*')
    .from('game_data')
    .where({game_id: gameId})
    .returning('*')
    .then(rows => {
      return rows;
    });
  }

};

module.exports = GamesService;