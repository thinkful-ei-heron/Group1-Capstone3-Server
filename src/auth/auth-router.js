const express = require('express')
const AuthService = require('./auth-service')
const { requireAuth } = require('../middleware/jwt-auth')

const authRouter = express.Router()
const jsonBodyParser = express.json()

authRouter
  .route('/token')
  .post(jsonBodyParser, async (req, res, next) => {
    const { username, password } = req.body
    const loginUser = { username, password}

    for(cosnt [key, value] of Object.entries(loginUser))
      if(value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    try { 
      const dbUser = await AuthService.getUserWithUserName(
      req.app.get('db'),
      loginUser.username
      )

      if(!dbUser)
        return res.status(400).json({
          error: 'Incorrect username!',
        })

      const compareMatch = await AuthService.comparePasswords(
        req.app.get('db'),
        loginUser.password
      )

      if(!compareMatch)
        return res.status(400).json({
          error: 'Incorrect password!'
        })
      
      const subject = dbUser.username
      const payload = { 
          user_id: dbUser.id,
          name: dbUser.name,
      }

      res.send({
        authToken: AuthService.createJwt(subject, payload),
      })
    } catch (error) {
      next(error)
    } 
  })

  .put(requireAuth, (req, res) => {
    const sub = req.user.username
    const payload = { 
      user_id: req.user.id, 
      name: req.user.name,
    }
    res.send({
      authToken: AuthService.createJwt(subject, payload),
    })
  })

module.exports = authRouter