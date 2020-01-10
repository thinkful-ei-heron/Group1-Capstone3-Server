const app = require('./app');
const {PORT, DATABASE_URL, CLIENT_URL} = require('./config');
const knex = require('knex');
const socket = require('socket.io');
const socketRouter = require('./socket/socketRouter');
const authService = require('./auth/authService');
const jwt = require('jsonwebtoken');

const db = knex({
    client: 'pg',
    connection: DATABASE_URL
});

app.set('db', db);

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

//------------------------------------------------------------------------------------------------------------

const io = socket(server, {
    handlePreflightRequest: function (req, res) {
        var headers = {
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Origin': CLIENT_URL,
          'Access-Control-Allow-Credentials': true
        };
        res.writeHead(200, headers);
        res.end();
      }
});

//Authorize the sockets
io.use((socket, next) => {
    let auth = socket.handshake.headers.authorization;
    if(!auth.startsWith('Bearer ')) socket.disconnect(true);

    let token = auth.split(' ')[1];
    let verified = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']});
    
    authService.getUserWithUserName(db, verified.sub)
        .then(user => {
            if(user) {
               
                socket.userInfo = user;
                next();
            }
            else socket.disconnect(true);
        });

});

io.use(socketRouter(io, db));



app.set('io', io);

