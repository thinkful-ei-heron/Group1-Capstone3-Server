const express = require('express');
const shipsRouter = express.Router();
const jsonBodyParser = express.json();
const ShipsService = require('./ShipsService');

//this route is used to set the ships on each players board or to fire at the opponent's board.
shipsRouter
  .route('/')
  //implement require auth for all in this route?

  //the following post route is for setting the user's ships. The front end needs to send the shipData, playerNum
  //(ie: player1 or player2) and the gameId.
  .post(jsonBodyParser, (req,res,next) => {
    const knexInstance = req.app.get('db');
    const { shipData, playerNum, gameId } = req.body;
    if(shipData.length < 5){
      return res.status(400).json({error: 'must provide data for all 5 ships'});
    }
    if(!playerNum || !gameId){
      return res.status(400).json({error:'must provide player number and game id'});
    }
    //need to store shipData in the database for the user and gameId associated with it.
    if(playerNum === 'player1'){
      ShipsService.setPlayer1Ships(knexInstance, gameId, JSON.stringify(shipData));
    } else {
      ShipsService.setPlayer2Ships(knexInstance, gameId, JSON.stringify(shipData));
    }
    res.status(201).json(shipData);
  });


  module.exports = shipsRouter;