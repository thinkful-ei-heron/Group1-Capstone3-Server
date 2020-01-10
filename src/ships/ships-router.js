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

// shipsRouter
//   .route('/opponent')
//   //the following post route is to fire upon the opponents ship. a result object will be returning containing result and ship
//   // where result will be 'hit' or 'miss'. If a hit was made ship's value will be the name of the ship that was hit otherwise null.
//   //to fire on the opponent the frontend client must send the target coordinate, playerNum(ie: player1 or player2) and the gameId.
//   .post(jsonBodyParser, (req,res,next) => {
//     const knexInstance = req.app.get('db');
//     const { target, playerNum, gameId } = req.body;

//     if(!playerNum || !gameId){
//       return res.status(400).json({error:'must provide player number and game id'});
//     }
    
//     let result;
//     //the overarching if/else is based on if the firing user is player 1 or player 2
//     //after determining if the user is player 1 or 2, we access the opponents ships.
//     //then we check to see if we hit one of the opponent's ships.
//     //if the result was a hit then we add the target to the 'hits' value in the database.
//     // if the result was a miss then we add the target to the 'miss' values in the database.
//     //at the end we return the result and ship name that was hit (or null if it was a miss) to the
//     // client end.
//     if(playerNum === 'player1'){
//       ShipsService.accessPlayer2Ships(knexInstance, gameId).then(res => {
//         result = ShipsService.checkForHit(target, res.player2_ships);
//       }).then(() => {


//         if(result.result === 'hit'){
//           //if the target was a hit we will add it to the database in player 1 hits
//           return ShipsService.accessPlayer1Hits(knexInstance, gameId).then(res => {
//             let newValue = [target];
//             if(res.player1_hits !== null && res.player1_hits !== '' ){
//               let currentHits = JSON.parse(res.player1_hits);
//               newValue = [...currentHits, target];
//             }
//             return ShipsService.addToHitsPlayer1(knexInstance, gameId, JSON.stringify(newValue));
//           });


//         } else {
//           //else we are adding the target to player 1's misses
//           return ShipsService.accessPlayer1Misses(knexInstance, gameId).then(res => {
//             let newValue = [target];
//             if(res.player1_misses !== null && res.player1_misses !== '' ){
//               let currentHits = JSON.parse(res.player1_misses);
//               newValue = [...currentHits, target];
//             }
//             return ShipsService.addToMissesPlayer1(knexInstance, gameId, JSON.stringify(newValue));
//           });
//         }



//       })
//       .then(() => res.status(200).json(result));




//     } else {
//       //now we are repeating the above operations if it were player 2 who fired the shot.
//       ShipsService.accessPlayer1Ships(knexInstance, gameId).then(res => {
//         result = ShipsService.checkForHit(target, res.player1_ships);
//     }).then(() => {


//       if(result.result === 'hit'){
//         //if the target was a hit we will add it to the database in player 2 hits
//         return ShipsService.accessPlayer2Hits(knexInstance, gameId).then(res => {
//           let newValue = [target];
//           if(res.player2_hits !== null && res.player2_hits !== '' ){
//             let currentHits = JSON.parse(res.player2_hits);
//             newValue = [...currentHits, target];
//           }
//           return ShipsService.addToHitsPlayer2(knexInstance, gameId, JSON.stringify(newValue));
//         });




//       } else {
//         //else we are adding the target to player 2's misses
//         return ShipsService.accessPlayer2Misses(knexInstance, gameId).then(res => {
//           let newValue = [target];
//           if(res.player2_misses !== null && res.player2_misses !== '' ){
//             let currentHits = JSON.parse(res.player2_misses);
//             newValue = [...currentHits, target];
//           }
//           return ShipsService.addToMissesPlayer2(knexInstance, gameId, JSON.stringify(newValue));
//         });
//       }


      
//     })
//     .then(() => res.status(200).json(result));
//     }
//     //websockets will need to be in play here so that we tell the other player if their boat
//     //was hit.
//   });

  module.exports = shipsRouter;