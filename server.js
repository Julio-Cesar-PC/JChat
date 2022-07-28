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

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/app/index.html');
});

server.listen(app.get('port'), function () {
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
    messages: [],
    users: []
}

var messages = [];
var users = [];
var rooms = [];

function verifyRoom(room) {
    var found = false;
    rooms.forEach(function (r) {
        if (r.room == room) {
            found = true;
        }
    });
    return found;
}

function findRoom(room) {
    var found = false;
    rooms.forEach(function (r) {
        if (r.room == room) {
            found = r;
        }
    });
    return found;
}

function getArrayOfRooms() {
    var array = [];
    rooms.forEach(function (r) {
        array.push(r.room);
    });
    return array;
}

function findUser(userId) {
    var found = false;
    users.forEach(function (u) {
        if (u.id == userId) {
            found = u;
        }
    });
    return found;
}

function verifyUser(userId) {
    var found = false;
    users.forEach(function (u) {
        if (u.id == userId) {
            found = true;
        }
    });
    return found;
}

function verifyUsersInRoom(room, user) {
    var found = false;
    rooms.forEach(function (r) {
        if (r.room == room) {
            r.users.forEach(function (u) {
                if (u == user) {
                    found = true;
                }
            });
        }
    });
    return found;
}

io.on('connection', function (socket) {
    console.log('socket: ' + socket.id + ' connected');

    io.emit('updateRooms', rooms);

    socket.on('joinRoom', function (data) {
        if (!verifyUsersInRoom(data.room, data.user)) {
            if (!verifyRoom(data.room)) {
                console.log('Room: ' + data.room + ' created');
                rooms.push({ room: data.room, users: [], messages: [] });
            }
            let room = findRoom(data.room);
            room.users = room.users.concat(data.user);
            socket.join(data.room);
            console.log(data.user + ' joined in ' + data.room);
            socket.emit('updateUsers', room.users);
            socket.emit('initChat', room.messages);
            io.emit('updateRooms', rooms);
        } else {
            console.log('User ' + data.user + ' already in room ' + data.room);
            socket.emit('userAlreadyInRoom', { user: data.user, room: data.room });
        }

    });

    socket.on('sendMsg', function (data) {
        var newMessage = { room: data.room, text: data.message, user: data.user, date: dateFormat(new Date(), 'shortTime') };
        let room = findRoom(data.room);
        room.messages = room.messages.concat(newMessage);
        console.log('Message ' + data.message + ' sent by ' + data.user + ' in room ' + data.room);
        io.to(data.room).emit('readMsg', newMessage);
    });

    socket.on('addUser', function (data) {
        users.push({ id: socket.id, name: data.user, room: data.room });
        let usersInRoom = findRoom(data.room).users;
        io.to(data.room).emit('updateUsers', usersInRoom);
    });

    socket.on('disconnect', function () {
        if (verifyUser(socket.id)) {
            if (verifyRoom(findUser(socket.id).room)) {
                let room = findRoom(findUser(socket.id).room)
                room.users = room.users.filter(user => user != findUser(socket.id).name);
                users = users.filter(function (user) {
                    return user.id != socket.id;
                });
                io.to(room.room).emit('updateUsers', room.users);
                console.log(findUser(socket.id).name + ' disconnected from room ' + room.room);
            }
        }
    });
});