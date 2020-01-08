const express = require('express');
const shipsRouter = express.Router();
const jsonBodyParser = express.json();
const ShipsService = require('./ShipsService');

//this route is used to set the ships on each players board.
shipsRouter
  .route('/')
  //perhaps a .all() here that makes sure the gameID is in the request body and sets it
  //on the request object.
  .post(jsonBodyParser, (req,res,next) => {
    const { shipData } = req.body;
    if(shipData.length < 5){
      res.status(400).json({error: 'must provide data for all 5 ships'});
    }
    //need to store shipData in the database for the user and gameId associated with it.
    console.log(shipData);
    res.status(201).json(shipData);
    //create service object to store ship data in the database
    //we will need the user to send the gameId of the current game they are playing
    //we will need to require auth so that we also have access to the userId.
  });

shipsRouter
  .route('/opponent')
  .post(jsonBodyParser, (req,res,next) => {
    const { target } = req.body;
    console.log(target);
    let result = ShipsService.checkForHit(target);
    console.log(result);
    res.status(200).json(result);
    //websockets will need to be in play here so that we tell the other player if their boat
    //was hit.
  });

  module.exports = shipsRouter;