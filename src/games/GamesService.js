const GamesService = {

  getAllActiveGames(db, userId) {
    return db
      .select('game_history.*',
        'player1.username as player1_username',
        'player2.username as player2_username')
      .from('game_history')
      .where({ player1: userId, game_status: 'active' })
      .orWhere({ player2: userId, game_status: 'active' })
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
      .where({ game_id: gameId })
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
  },

  //return the user's stats and the username to use on the
  //dashboard page
  getUserStats(db, userid) {
    return db
      .from('stats')
      .select('stats.*', 'users.username')
      .where({ userid })
      .join('users', 'users.id', 'stats.userid')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getGameHistory(db, game_id) {
    return db
      .from('game_history')
      .select('*')
      .where({ id: game_id })
      .first();
  },

  getGameData(db, game_history_id) {
    return db
      .from('game_data')
      .select('*')
      .where({ game_id: game_history_id })
      .first();
  },

  updateGameDataWin(db, game_id, winner) {
    return db
      .from('game_data')
      .where({ game_id })
      .update({ winner })
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  endGame(db, game_id) {
    return db
      .from('game_history')
      .where({ id: game_id })
      .update({ game_status: 'complete' })
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  updateWinnerStats(db, winner_id) {
    return db
      .from('stats')
      .where({ userid: winner_id })
      .increment('wins', 1)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  updateLoserStats(db, loser_id) {
    return db
      .from('stats')
      .where({ userid: loser_id })
      .increment('losses', 1)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

};

module.exports = GamesService;