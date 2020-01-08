const STORE = {
  opponentShips: [{ 'name': 'Aircraft Carrier', 'length': 5, 'spaces': ['A4','A5','A6','A7', 'A8'] },
  { 'name': 'Battleship', 'length': 4, 'spaces': ['H3', 'H4', 'H5', 'H6'] },
  { 'name': 'Cruiser', 'length': 3, 'spaces': ['I1', 'I2', 'I3'] },
  { 'name': 'Submarine', 'length': 3, 'spaces': ['E1', 'F1', 'G1'] },
  { 'name': 'Defender', 'length': 2, 'spaces': ['D2', 'D3'] }],

userShips: [ 
  { name: 'Aircraft Carrier', length: 5, spaces: [ 'A3', 'A4', 'A5', 'A6', 'A7' ] },
  { name: 'Battleship', length: 4, spaces: [ 'A3', 'A4', 'A5', 'A6' ] },
  { name: 'Cruiser', length: 3, spaces: [ 'A3', 'A4', 'A5' ] },
  { name: 'Submarine', length: 3, spaces: [ 'A3', 'A4', 'A5' ] },
  { name: 'Defender', length: 2, spaces: [ 'A3', 'A4' ] } ],


};

module.exports = STORE;