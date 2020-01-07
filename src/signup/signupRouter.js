const signupService = require('./signupService');
const express = require('express');
const xss = require('xss');

const signupRouter = express.Router();



signupRouter
    .post('/signup', (req, res, next) => {
    let db = req.app.get('db');
    let {username, password, email} = req.body;

    if(!username) {
        return res.status(400).json({error: 'Must provide username.'});
    }
    if(!password) {
        return res.status(400).json({error: 'Must provide password.'});
    }
    if(!email) {
        return res.status(400).json({error: 'Must provide email.'});
    }


    //Sanitizing input
    let xssU = xss(username);
    let xssP = xss(password);
    let xssE = xss(email);


    let usernameError = signupService.validateUsername(xssU);
    if(usernameError) {
        return res.status(400).json({error: usernameError});
    }

    let passError = signupService.validatePassword(xssP);
    if(passError) {
        return res.status(400).json({error: passError});
    }

    let emailError = signupService.validateEmail(xssE);
    if(emailError) {
        return res.status(400).json({error: emailError});
    }


    //Checks to see if the username provided is taken
    signupService.checkUsername(db, xssU)
        .then(user => {
            if(user) return res.status(400).json({error: 'Username is taken.'});
            
            //Checks to see if email has been used
            return signupService.checkEmail(db, xssE)
                .then(email => {
                    if(email) return res.status(400).json({error: 'Email is taken.'});

                    //Hashes the password for storage
                    return signupService.hashPass(xssP)
                        .then(hashed => {
                            //Creates and sends new user to database. 
                            let post = {username: xssU, password: hashed, email: xssE};
                            return signupService.insert(db, post)
                                .then(resp => {
                                    if(resp) {
                                        return res.status(201).end();
                                    }
                                });
                        });
                });
        })
        .catch(next);
});

module.exports = signupRouter;