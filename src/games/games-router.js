const express = require('express');
const gamesRouter = express.Router();
const GamesService = require('./GamesService');


gamesRouter
  //this endpoint retrives all of the logged in user's active games
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    
    return GamesService.getAllActiveGames(knexInstance, userId).then(result => {
      return res.status(200).json({ result, userId });
    });
  });

  //this endpoint retreives the logged in user's game stats
gamesRouter
  .route('/stats')
  .get((req,res,next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    GamesService.getUserStats(knexInstance, userId)
    .then(stats => {
      res.status(200).json(stats);
    });
  });

  //this endpoint retrieves the game data for a specific game based on the 
  //gameId sent in the params
gamesRouter
  .route('/activegame/:gameId/:playerNum')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { gameId, playerNum } = req.params;

    GamesService.retrieveGameData(knexInstance, gameId).then(data => {
      let gameData = data[0];
      if(playerNum === 'player1'){
        gameData.player2_ships = gameData.player2_ships ? true : false;
        gameData.player1_ships = JSON.parse(gameData.player1_ships);
      }else{
        gameData.player1_ships = gameData.player1_ships ? true : false;
        gameData.player2_ships = JSON.parse(gameData.player2_ships);
      }
        gameData.player1_hits = JSON.parse(gameData.player1_hits);
        gameData.player2_hits = JSON.parse(gameData.player2_hits);
        gameData.player1_misses = JSON.parse(gameData.player1_misses);
        gameData.player2_misses = JSON.parse(gameData.player2_misses);
        gameData.currentUser = playerNum;

      res.status(200).json(gameData); 
    });
  });

  gamesRouter
  .route('/results/:gameId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const  { gameId }  = req.params;
    console.log( gameId + 'Current Game Id')
    GamesService.retrieveResults(knexInstance,  gameId).then(data => {
      res.status(200).json(data)
  })
})



module.exports = gamesRouter;