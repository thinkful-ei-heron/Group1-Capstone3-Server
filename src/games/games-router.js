const express = require('express');
const gamesRouter = express.Router();
const GamesService = require('./GamesService');
const jsonBodyParser = express.json();


gamesRouter
  //this endpoint retrives all of the logged in user's active games
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    GamesService.getAllActiveGames(knexInstance, userId).then(result => {
      return res.status(200).json({ result, userId });
    })
      .catch(next);
  });

//this endpoint retreives the logged in user's game stats
gamesRouter
  .route('/stats')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    GamesService.getUserStats(knexInstance, userId)
      .then(stats => {
        res.status(200).json(stats);
      })
      .catch(next);
  });

//this endpoint retrieves the game data for a specific game based on the 
//gameId sent in the params. Of note, if the opponent ships are sent we will
// return 'true' otherwise we will return 'false'. This prevents us from sending 
// the location data for the opponent's ships to the current user.
gamesRouter
  .route('/activegame/:gameId/:playerNum')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { gameId, playerNum } = req.params;
    let opponentString = (playerNum === 'player1') ? 'player2' : 'player1';
    let playerString = playerNum;

    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Must send a valid game id' });
    }

    if (playerNum !== 'player1' && playerNum !== 'player2') {
      return res.status(400).json({ error: 'Must send a valid playerNum' });
    }


    GamesService.retrieveGameData(knexInstance, gameId).then(data => {
      let gameData = data;
      if (!gameData) {
        return res.status(400).json({ error: 'Must send a gameId of an existing game' });
      }
      if (gameData.winner) {
        return res.status(400).json({ error: 'Cannot resume a completed game' });
      }

      gameData[`${opponentString}_ships`] = gameData[`${opponentString}_ships`] ? true : false;
      gameData[`${playerString}_ships`] = JSON.parse(gameData[`${playerString}_ships`]);
      gameData.player1_hits = JSON.parse(gameData.player1_hits);
      gameData.player2_hits = JSON.parse(gameData.player2_hits);
      gameData.player1_misses = JSON.parse(gameData.player1_misses);
      gameData.player2_misses = JSON.parse(gameData.player2_misses);
      gameData.currentUser = playerNum;

      res.status(200).json(gameData);
    })
      .catch(next);
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { gameId } = req.params;
    const { opponentNum, opponentId } = req.body;
    const userId = req.app.get('user').id;
    
    //check to see if this game has already been forfeited/completed
    //if it has not, then proceed to update game_history, game_data, and user stats
    GamesService.getGameData(knexInstance, gameId)
    .then((data) => {

      if(data.winner) {
        return res.status(400).json({error: 'Cannot Forfeit. Game has already been forfeited, completed, or expired'});
      } 
      else {
        GamesService.updateGameDataWin(knexInstance, gameId, opponentNum);
        GamesService.forfeitGame(knexInstance, gameId);
        GamesService.updateWinnerStats(knexInstance, opponentId);
        GamesService.updateLoserStats(knexInstance, userId);
        return res.status(200).json({message:'Game forfeited'});
    }
  })
  .catch(next);
});
  

//this endpoint retrieves all of the data from the game_data table for the finished game.
gamesRouter
  .route('/results/:gameId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { gameId } = req.params;
    GamesService.retrieveResults(knexInstance, gameId).then(data => {
      if (!data[0]) {
        return res.status(400).json({ error: 'Must send a gameId of an existing game' });
      }

      if (!data[0].winner) {
        return res.status(400).json({ error: 'Game is not completed' });
      }
      res.status(200).json(data);
    })
      .catch(next);
  });



module.exports = gamesRouter;