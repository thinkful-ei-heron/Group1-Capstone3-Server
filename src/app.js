require('dotenv').config();
const {NODE_ENV} = require('./config');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const loginRouter = require('./auth/loginRouter'); 
const signupRouter = require('./signup/signupRouter');
const shipsRouter = require('./ships/ships-router');
const gamesRouter = require('./games/games-router');
const checkAuth = require('./auth/checkAuth');

const app = express();
const jsonParser = express.json();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganOption));
app.use(jsonParser);
app.use(helmet());
app.use(cors());


app.use('/api/login', loginRouter);  
app.use('/api/signup', signupRouter);
app.use('/api/games', checkAuth, gamesRouter);
app.use('/api/ships', checkAuth,  shipsRouter);


app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { error: 'server error' } };
    } 
    else {
        console.error(error);
        response = { error: error.message };
    }
    res.status(500).json(response);
});


module.exports = app;