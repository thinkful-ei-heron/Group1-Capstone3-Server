const express = require('express');
const AuthService = require('./authService');
const xss = require('xss');

const loginRouter = express.Router();
const jsonBodyParser = express.json();

loginRouter
  .route('/')
  .post(jsonBodyParser, async (req, res, next) => {
    const username = xss(req.body.username);
    const password = xss(req.body.password);

    const loginUser = { username, password}

    if(!username)
    return res.status(400).json({
      error: `Missing username in request body`
    })

    if(!password)
    return res.status(400).json({
      error: `Missing password in request body`
    })

    try { 
      const dbUser = await AuthService.getUserWithUserName(
      req.app.get('db'),
      loginUser.username
      )

      if(!dbUser)
        return res.status(400).json({
          error: 'Incorrect username or password!', 
        })

      const compareMatch = await AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      )

      if(!compareMatch)
        return res.status(400).json({
          error: 'Incorrect username or password!' 
        })
      const subject = dbUser.username
      const payload = { 
          user_id: dbUser.id,
      }
      let token = AuthService.createJwt(subject, payload)

      return res.send({
        authToken: token,
      })
    } catch (error) {
      next(error)
    } 
  })

module.exports = loginRouter