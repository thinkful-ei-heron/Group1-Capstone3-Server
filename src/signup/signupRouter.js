const signupService = require('./signupService');
const express = require('express');
const xss = require('xss');

const signupRouter = express.Router();

signupRouter
    .post('/', (req, res, next) => {
        let db = req.app.get('db');
        let { username, password } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Must provide username.' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Must provide password.' });
        }

        //Sanitizing input
        let xssU = xss(username);
        let xssP = xss(password);


        let usernameError = signupService.validateUsername(xssU);
        if (usernameError) {
            return res.status(400).json({ error: usernameError });
        }

        let passError = signupService.validatePassword(xssP);
        if (passError) {
            return res.status(400).json({ error: passError });
        }


        //Checks to see if the username provided is taken
        signupService.checkUsername(db, xssU)
            .then(user => {
                if (user) return res.status(400).json({ error: 'Username is taken.' });

                //Hashes the password for storage
                return signupService.hashPass(xssP)
                    .then(hashed => {
                        //Creates and sends new user to database. 
                        let post = { username: xssU, password: hashed};
                        return signupService.insert(db, post)
                            .then(resp => {
                                if (resp) {
                                    //add the stats row to start tracking for a new user
                                    signupService.createNewStatsRow(db, resp.id);
                                    return res.status(201).end();
                                }
                            });
                    });

            })
            .catch(next);
    });

module.exports = signupRouter;