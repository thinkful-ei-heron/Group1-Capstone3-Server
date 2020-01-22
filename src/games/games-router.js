const express = require('express');
const GamesService = require('./GamesService');
const xss = require('xss');

const gamesRouter = express.Router();
const jsonBodyParser = express.json();

gamesRouter
  //this endpoint retrives all of the logged in user's active games
  .route('/')
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    const userId = req.app.get('user').id;

    //Checks for any games that have expired
    let expiredGames = await GamesService.getExpiredGames(db, userId);

    //If any games have expired
    if (expiredGames.length) {
      await expiredGames.forEach(async game => {
        winnerString = game.turn === 'player1' ? 'player2' : 'player1';
        winnerId = game.turn === 'player1' ? game.player2 : game.player1;
        loserId = game.turn === 'player1' ? game.player1 : game.player2;

        //Make calls to db to update expired games and both players stats
        await Promise.all([
          GamesService.updateGameDataWin(db, game.game_data_id, winnerString),
          GamesService.expireGame(db, game.game_id),
          GamesService.updateWinnerStats(db, winnerId),
          GamesService.updateLoserStats(db, loserId)
        ]);
      });

    }

    //Returns only games that are active
    let activeGames = await GamesService.getAllActiveGames(db, userId);
    return res.status(200).json({ result: activeGames, userId });

  });


gamesRouter
  .route('/prev')
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    const userId = req.app.get('user').id;
    const playerUsername = req.app.get('user').username;

    let previousGames = await GamesService.getAllPreviousGames(db, userId);
    return res.status(200).json({ result: previousGames, userId, playerUsername });

  })

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
  .route('/activegame/:gameId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const gameId = xss(req.params.gameId);
    const userId = req.app.get('user').id;
    let opponentString = null;
    let playerString = null;


    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Must send a valid game id' });
    }

    GamesService.retrieveGameData(knexInstance, gameId).then(data => {
      if(data){
        if(userId === data.player1){
          playerString = 'player1'
          opponentString = 'player2'
        } else if (userId === data.player2) {
          playerString  ='player2'
          opponentString = 'player1'
        } else {
          return res.status(400).json({error: 'User does not have access to this game'})
        }
      }

      let gameData = data;
      if (!gameData) {
        return res.status(400).json({ error: 'Must send a gameId of an existing game' });
      }
      if (gameData.winner) {
        return res.status(400).json({ error: 'Cannot resume a completed game' });
      }

      //the following will be used to track the user's progress to see how many of 
      //the opponent's ships coordinates have been hit.
      let shipsCounter = {
        'aircraftCarrier': { hit: 0, length: 5, spaces: [], sunk: false },
        'battleship': { hit: 0, length: 4, spaces: [], sunk: false },
        'cruiser': { hit: 0, length: 3, spaces: [], sunk: false },
        'submarine': { hit: 0, length: 3, spaces: [], sunk: false },
        'defender': { hit: 0, length: 2, spaces: [], sunk: false }
      }

      if (gameData[`${opponentString}_ships`]) {
        JSON.parse(gameData[`${opponentString}_ships`]).map(ship => {
          return ship.spaces.map(space => {
            
            if(gameData[`${playerString}_hits`]){
              if (JSON.parse(gameData[`${playerString}_hits`]).includes(space)) {
                shipsCounter[ship.name].hit = shipsCounter[ship.name].hit + 1
                shipsCounter[ship.name].spaces = [...shipsCounter[ship.name].spaces, space]
                if(shipsCounter[ship.name].hit === shipsCounter[ship.name].length){
                  shipsCounter[ship.name].sunk = true
                } 
              }
              return null
            }
            return null
          })
        })
      }

      gameData[`${opponentString}_ships`] = gameData[`${opponentString}_ships`] ? true : false;
      gameData[`${playerString}_ships`] = JSON.parse(gameData[`${playerString}_ships`]);
      gameData.player1_hits = JSON.parse(gameData.player1_hits);
      gameData.player2_hits = JSON.parse(gameData.player2_hits);
      gameData.player1_misses = JSON.parse(gameData.player1_misses);
      gameData.player2_misses = JSON.parse(gameData.player2_misses);
      gameData.currentUser =  playerString;
      gameData.shipsCounter = shipsCounter;

      res.status(200).json(gameData);
    })
      .catch(next);
  })


  .patch(jsonBodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const userId = req.app.get('user').id;
    const gameId = xss(req.params.gameId);
    let opponentNum = null;
    let opponentId = null;
    

    //check to see if this game has already been forfeited/completed
    //if it has not, then proceed to update game_history, game_data, and user stats
    GamesService.retrieveGameData(knexInstance, gameId)
      .then((data) => {
        if(data){
          if(userId === data.player1){
            opponentNum = 'player2';
            opponentId = data.player2;
          } else if (userId === data.player2){
            opponentNum = 'player1';
            opponentId = data.player1;
          }else{
            return res.status(400).json({error: 'User does not have access to this game'})
          }
        }

        if (!data) {
          return res.status(400).json({ error: 'invalid game id' });
        }
        else if (data.winner) {
          return res.status(400).json({ error: 'Cannot Forfeit. Game has already been forfeited, completed, or expired' });
        }
        else {
          GamesService.updateGameDataWin(knexInstance, gameId, opponentNum);
          GamesService.forfeitGame(knexInstance, gameId);
          GamesService.updateWinnerStats(knexInstance, opponentId);
          GamesService.updateLoserStats(knexInstance, userId);
          return res.status(200).json({ message: 'Game forfeited' });
        }
      })
      .catch(next);
  });

//this endpoint retrieves all of the data from the game_data table for the finished game.
gamesRouter
  .route('/results/:gameId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const gameId = xss(req.params.gameId);
    const playerId = req.app.get('user').id;

    GamesService.retrieveResults(knexInstance, gameId).then(data => {
      if (!data) {
        return res.status(400).json({ error: 'Must send a gameId of an existing game' });
      }

      if (!data.winner) {
        return res.status(400).json({ error: 'Game is not completed' });
      }

      if(playerId !== data.player1 && playerId !== data.player2) {
        return res.status(400).json({error: 'This is not your game.'});
      }

      let parsed = {
        player1_hits: JSON.parse(data.player1_hits),
        player1_misses: JSON.parse(data.player1_misses),
        player2_hits: JSON.parse(data.player2_hits),
        player2_misses: JSON.parse(data.player2_misses),
        winner: data.winner
      }
      return res.status(200).json(parsed);
    })
      .catch(next);
  });



module.exports = gamesRouter;