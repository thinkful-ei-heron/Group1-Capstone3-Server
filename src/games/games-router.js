const express = require('express');
const gamesRouter = express.Router();
const GamesService = require('./GamesService');


gamesRouter
  //in future change this to just /games endpoint and get the user id from the req object.
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    
    return GamesService.getAllActiveGames(knexInstance, userId).then(result => {
      return res.status(200).json({ result, userId });
    });
  });

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



module.exports = gamesRouter;