const express = require('express');
const shipsRouter = express.Router();
const jsonBodyParser = express.json();
const ShipsService = require('./ShipsService');

//this route is used to set the ships on each players board
shipsRouter
  .route('/')
  .post(jsonBodyParser, (req,res,next) => {
    const knexInstance = req.app.get('db');
    const { shipData, playerNum, gameId } = req.body;

    if(!playerNum || !gameId){
      return res.status(400).json({error: 'Must provide player number and game id to save ship data'});
    }

    if(shipData.length < 5){
      return res.status(400).json({error: 'Must provide complete data for all 5 ships'});
    }
    
    shipData.map(ship => {
      if(ship.spaces.length === 0){
        return res.status(400).json({error: 'Must provide complete data for all 5 ships'});
      }
    });

    ShipsService.setPlayerShips(knexInstance, gameId, playerNum, JSON.stringify(shipData))
      .then(result => {
        return res.status(201).json(result);
      }).catch(next);
  });


  module.exports = shipsRouter;