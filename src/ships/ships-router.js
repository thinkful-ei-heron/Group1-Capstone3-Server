const express = require('express');
const xss = require('xss');
const ShipsService = require('./ShipsService');
const gamesService = require('../games/GamesService');


const shipsRouter = express.Router();

//this route is used to set the ships on each players board
shipsRouter
  .route('/')
  .post(async (req, res, next) => {
    const db = req.app.get('db');
    const { shipData, playerNum, gameId } = req.body;
    const user = req.app.get('user');

    if (!playerNum || !gameId || !shipData) {
      return res.status(400).json({ error: 'Must provide player number, game id and ship data to save ship data' });
    }
    
    //Sanitizing input
    let jsonShips = JSON.stringify(shipData);
    
    let xssShipData = xss(jsonShips);
    let xssPlayerNum = xss(playerNum);
    let xssGameId = xss(gameId);

    let gameHistory = await gamesService.getGameHistory(db, xssGameId);

    if (!gameHistory) {
      return res.status(400).json({ error: 'Game not found' });
    }
    if (gameHistory[xssPlayerNum] !== user.id) {
      return res.status(400).json({ error: 'Validation failed for this game room' });
    }


    let gameData = await gamesService.getGameData(db, gameHistory.id);
    if (!gameData) {
      return res.status(400).json({ error: 'Game data not found' });
    }

    let shipDataError = await ShipsService.validateShipData(xssShipData, xssPlayerNum, gameData);
    if (shipDataError) {
      return res.status(400).json({ error: shipDataError });
    }


    await ShipsService.setPlayerShips(db, xssGameId, xssPlayerNum, xssShipData)
    return res.status(201).end();

  });


module.exports = shipsRouter;