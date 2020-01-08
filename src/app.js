require('dotenv').config();
const {NODE_ENV} = require('./config');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const authRouter = require('./auth/auth-router'); 
const signupRouter = require('./signup/signupRouter');
const userRouter = require('./user/user-router');
const errorHandler = require('./middleware/error-handler');

const app = express();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganOption));
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/api/auth', authRouter);  // CHECK THIS
app.use('/api/user', userRouter);
app.use(signupRouter);
app.use(errorHandler);

module.exports = app;