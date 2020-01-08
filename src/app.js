require('dotenv').config();
const {NODE_ENV} = require('./config');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const authRouter = require('./auth/auth-router'); 
const signupRouter = require('./signup/signupRouter');

const app = express();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganOption));
app.use(express.json());
app.use(helmet());
app.use(cors());

//app.use('/api/user', userRouter);
//app.use(errorHandler);

// app.use(function validateBearerToken(req, res, next) {
//     const apiToken = process.env.API_TOKEN;
//     const authToken = req.get('Authorization');

//     if (!authToken || authToken.split(' ')[1] !== apiToken) {
//         return res.status(401).json({ message: 'Unauthorized request' });
//     }
//     next();
// });

app.use('/api/auth', authRouter);  // CHECK THIS
app.use(signupRouter);



// app.use(function errorHandler(error, req, res, next) {
//     let response;
//     if (NODE_ENV === 'production') {
//         response = { error: { message: 'server error' } };
//     } 
//     else {
//         console.error(error);
//         response = { message: error.message };
//     }
//     res.status(500).json(response);
// });



module.exports = app;