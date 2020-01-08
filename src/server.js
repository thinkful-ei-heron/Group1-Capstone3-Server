const app = require('./app');
const {PORT, DB_URL} = require('./config');
const knex = require('knex');
const socket = require('socket.io');

const db = knex({
    client: 'pg',
    connection: DB_URL
});

app.set('db', db);

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const io = socket(server, {
    handlePreflightRequest: function (req, res) {
        var headers = {
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': true
        };
        res.writeHead(200, headers);
        res.end();
      }
});

io.use((socket, next) => {
    console.log(socket.handshake.headers.authorization)
    let jwt = socket.handshake.headers.authorization;
    if(jwt !== 'Bearer thisismyjwt') {
        socket.disconnect(true);
    }else 
    return next();
})

io.on('connection', function (socket) {
    
    console.log(socket.handshake.headers);
    socket.on('shot', (data) => {
        console.log(data)
        console.log(socket.handshake.extraHeaders);
        socket.emit('shot', data);
    });
});


app.set('io', io);