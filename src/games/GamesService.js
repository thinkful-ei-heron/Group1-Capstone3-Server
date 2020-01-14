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


  getPlayerIds(db, game_id){
    return db
    .from('game_history')
    .select('game_history.player1', 'game_history.player2')
    .where({id: game_id})
    .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  updateGameData(db, game_id, winner){
    return db
    .from('game_data')
    .where({game_id})
    .update({winner})
    .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  endGame(db, game_id){
    return db
      .from('game_history')
      .where({id: game_id})
      .update({game_status: 'complete'})
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  updateWinnerStats(db, winner_id){
    return db
    .from('stats')
    .where({userid: winner_id})
    .increment('wins', 1)
    .returning('*')
    .then(rows => {
      return rows[0];
    });
  },

  updateLoserStats(db, loser_id){
    return db
    .from('stats')
    .where({userid: loser_id})
    .increment('losses', 1)
    .returning('*')
    .then(rows => {
      return rows[0];
    });
  },

};

module.exports = GamesService;