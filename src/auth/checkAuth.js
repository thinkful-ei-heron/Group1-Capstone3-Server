const authService = require('./authService');
const jwt = require('jsonwebtoken');


function checkAuth (req, res, next) {
    let auth = req.headers.authorization;
    if(!auth || !auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({error: 'Missing bearer token'});

    let token = auth.split(' ')[1];
    

    try {
        let verified = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']});
        authService.getUserWithUserName(req.app.get('db'), verified.sub)
            .then(user => {
                if(user) {
                    req.app.set('user', user);
                    next();
                }
                else return res.status(401).json({error: 'Invalid credentials'});
            });
        
    }
    catch(e) {
        return res.status(401).json({error: 'Invalid credentials'});
    }
    
}

module.exports= checkAuth;