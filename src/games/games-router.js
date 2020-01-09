const express = require('express');
const gamesRouter = express.Router();
const jsonBodyParser = express.json();
const GamesService = require('./GamesService');


gamesRouter
  .route('/')
  //.all(requireAuth)
  .get(jsonBodyParser, (req,res,next)=>{
    const knexInstance = req.app.get('db');
    const {userId} = req.body;
    if(!userId){
      return res.status(400).json({error:'must send userId'});
    }
    return GamesService.getAllActiveGames(knexInstance, userId).then(result => {
      return res.status(200).json(result);
    });
    //maybe this endpoint could get all user's active games?
    //we also need an endpoint to retrieve all of the game data from a game being resumed.
  })
  // .post(jsonBodyParser, (req,res,next) => {
  //   //start new game.
  //   //this endpoint creates a new game in the database in game_history as long as we have two user id's
  //   // that we can pair together. It is currently hardcoded (with user id's 1 and 2) for testing purposes only.
  //   //After initiating the game_history data it also initiates a new entry in game_data associated with the game_id.
  //   const knexInstance = req.app.get('db');
  //   GamesService.startNewGame(knexInstance, 1, 2)
  //   .then(newGame => {
  //     GamesService.setNewGameData(knexInstance, newGame[0].id);
  //     return res.status(200).json(newGame);
  //   });
  // });



  module.exports = gamesRouter;