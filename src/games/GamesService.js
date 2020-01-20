const GamesService = {

  //returns all of the logged in user's active games, joined with the two player's usernames
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

  getAllPreviousGames(db, userId) {
    return db
      .select('game_history.id as game_id',
        'player1.username as player1_username',
        'player2.username as player2_username', 'game_status', 'winner')
      .from('game_history')
      .where('game_status', '!=', 'active')
      .andWhere(q => {
        q.where({ player1: userId});
        q.orWhere({ player2: userId});
      })
      .join('users as player1', 'player1.id', 'game_history.player1')
      .join('game_data', 'game_data.game_id', 'game_history.id' )
      .leftJoin('users as player2', 'player2.id', 'game_history.player2')
      .returning('*')
      .then(rows => {
        return rows;
      });
  },


  getExpiredGames(db, userId) {
    return db
      .select('player1', 'player2', 'turn', 'game_id', 'game_data.id as game_data_id')
      .from('game_history')
      .join('game_data', 'game_data.game_id', 'game_history.id' )
      .whereRaw('( now() - interval \'3 days\') > game_data.last_move')
      .andWhere(q => {
        q.where({'game_history.player1': userId, 'game_history.game_status': 'active'});
        q.orWhere({'game_history.player2': userId, 'game_history.game_status': 'active'});
      })
      .returning('*')
      .then(rows => {
        return rows;
      });
      
  },



  //retrieves all of the game data and joins with game_history to return who's turn it is.
  retrieveGameData(db, gameId) {
    return db
      .select('game_data.*', 'game_history.turn')
      .from('game_data')
      .where({ game_id: gameId })
      .join('game_history', 'game_data.game_id', 'game_history.id')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  //accesses all of the data from the game_data table for the specified gameId
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

  //retrieves the game history table data for the specified game
  getGameHistory(db, game_id) {
    return db
      .from('game_history')
      .select('*')
      .where({ id: game_id })
      .first();
  },

  //returns the game data table information from a specified game
  getGameData(db, game_history_id) {
    return db
      .from('game_data')
      .select('*')
      .where({ game_id: game_history_id })
      .first();
  },

  //updates the game_data table with either 'player1' or 'player2' as the winner.
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

  // updates the game_history table to mark the game_status as 'complete'
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


  //forfeitGame changes game_status to 'forfeited'
  forfeitGame(db, game_id){
    return db
      .from('game_history')
      .where({ id: game_id })
      .update({ game_status: 'forfeited' })
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },


  expireGame(db, game_id) {
    return db
      .from('game_history')
      .where({ id: game_id })
      .update({ game_status: 'expired' })
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  //increments the winner's win stats by 1
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

//increments the loser's lose stats by 1
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