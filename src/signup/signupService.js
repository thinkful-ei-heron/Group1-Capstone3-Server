const bcrypt = require('bcryptjs');
//Regex to check password has upper/lowercase and a number
const REGEX_PASS = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[\S]+/;
const REGEX_EMAIL = /@/;

const signupService = {
    //Creates new user
    insert(db, post) {
        return db.into('users')
            .insert(post)
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },
//create new stats tracking for the new user
    createNewStatsRow(db, userid){
        return db
        .into('stats')
        .insert({userid})
        .returning('*')
        .then(rows => {
            return rows[0];
        });
    },
    
    //Checks to see if username has been used
    checkUsername(db, username) {
        return db.from('users')
            .select('username')
            .where('username', username)
            .first();
    },
    //Checks to see if email has been used
    checkEmail(db, email) {
        return db.from('users')
            .select('email')
            .where('email', email)
            .first();
    },
    //Makes sure Username passes tests 
     validateUsername(username) {
        if(username.length > 20) {
            return 'Username cannot exceed 20 characters';
        }
    },
    //Makes sure password passes all tests
    validatePassword(password) {
        if(password.length < 8) {
            return 'Password cannot be less than 8 characters long.';
        }
        if(password.length > 32) {
            return 'Password cannot be longer than 32 characters.';
        }
        if(password.includes(' ')) {
            return 'Password cannot contain a space.';
        }
        if(!REGEX_PASS.test(password)){
            return 'Password must contain at least one lowercase letter, one uppercase letter and a number';
        }
    },
    //Makes sure email passes all tests
    validateEmail(email) {
        if(email.includes(' ')) {
            return 'Email cannot contain a space.';
        }
        if(!REGEX_EMAIL.test(email)) {
            return 'Must provide valid email.';
        }
        if(email.length > 40) {
            return 'Email cannot exceed 40 characters';
        }
    },
    //Returns a hashed version of the password 
    hashPass(password) {
        return bcrypt.hash(password, 12);
    }
};

module.exports = signupService;
