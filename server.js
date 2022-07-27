var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var dateFormat = require('dateformat');
var favicon = require('serve-favicon');

app.set('port', (process.env.PORT || 3000));
app.use(favicon(__dirname + '/app/images/favicon.ico'));
app.use('/npm', express.static('node_modules'));
app.use(express.static('app'));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/app/index.html');
});

server.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

user = {
    name: '',
}

message = {
    message: '',
    user: '',
    room: '',
    date: ''
}

room = {
    room: '',
    users: []
}

var messages = [];
var users = [];
var rooms = [];

function verifyRoom(room) {
    var found = false;
    rooms.forEach(function(r) {
        if (r.room == room) {
            found = true;
        }
    });
    return found;
}

io.on('connection', function(socket) {

    //users.push(socket.id);

    socket.emit('init-chat', messages);
    socket.emit('update-users', users);

    socket.on('join room', function(data) {
        console.log(data);
        if (!verifyRoom(data.room)) {
            rooms.push({room: data.room, users: [].push(data.user)});
            console.log(rooms);
            console.log('cria sala ' + rooms.find(room => room.room === data.room).room);
        }
        socket.join(data.room);
    });

    socket.on('send-msg', function(data) {
        var newMessage = { text : data.message, user : data.user, date : dateFormat(new Date(), 'shortTime') };
        messages.push(newMessage);
        // console.log(data.user + ': ' + data.message + ' at ' + dateFormat(new Date(), 'shortTime') + ' on ' + data.room);
        console.log(data)
        io.to(data.room).emit('read-msg', newMessage);
        // io.emit('read-msg', newMessage);
    });

    socket.on('add-user', function(user){
        users.push({ id: socket.id, name: user });
        io.emit('update-users', users);
    });

    socket.on('disconnect', function() {
        users = users.filter(function(user){
            return user.id != socket.id;
        });
        io.emit('update-users', users);
    });
});