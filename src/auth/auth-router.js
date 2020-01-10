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
          error: 'Incorrect username or password!', // trial error org: user 
        })

      const compareMatch = await AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      )

      if(!compareMatch)
        return res.status(400).json({
          error: 'Incorrect username or password!' // trial error switch org: pass
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

  // .put(requireAuth, (req, res) => {
  //   const sub = req.user.username
  //   const payload = {
  //     user_id: req.user.id,
  //     name: req.user.name,
  //   }
  //   res.send({
  //     authToken: AuthService.createJwt(sub, payload),
  //   })
  // })

module.exports = authRouter