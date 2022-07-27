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

    //users.push(socket.id);
    // socket.emit('init-chat', messages, room);
    // socket.emit('update-users', users);

    socket.on('join room', function (data) {
        // console.log(data);

        if (!verifyUsersInRoom(data.room, data.user)) {
            // console.log('User ' + data.user + ' joined room ' + data.room);
            if (!verifyRoom(data.room)) {
                // console.log('Room ' + data.room + ' created');
                rooms.push({ room: data.room, users: [], messages: [] });
                // console.log(rooms);
                // console.log('cria sala ' + rooms.find(room => room.room === data.room).room);
            }
            let room = findRoom(data.room);
            room.users = room.users.concat(data.user);
            // console.log(room.users);
            socket.emit('update-users', room.users);
            socket.join(data.room);
        } else {
            // console.log('User ' + data.user + ' already in room ' + data.room);
            socket.emit('user-already-in-room', { user: data.user, room: data.room });
        }

    });

    socket.on('send-msg', function (data) {
        var newMessage = { room: data.room, text: data.message, user: data.user, date: dateFormat(new Date(), 'shortTime') };
        let room = findRoom(data.room);
        room.messages = room.messages.concat(newMessage);
        console.log(room);
        io.to(data.room).emit('read-msg', newMessage);
    });

    socket.on('add-user', function (data) {
        users.push({ id: socket.id, name: data.user, room: data.room });
        let usersInRoom = findRoom(data.room).users;
        console.log(usersInRoom)
        io.to(data.room).emit('update-users', usersInRoom);
    });

    socket.on('disconnect', function () {
        if (verifyUser(socket.id)) {
            if (verifyRoom(findUser(socket.id).room)) {
                let room = findRoom(findUser(socket.id).room)
                room.users = room.users.filter(user => user != findUser(socket.id).name);
                let usersInRoom = room.users;
                // usersInRoom.splice(usersInRoom.indexOf(findUser(socket.id).name), 1);
                console.log(usersInRoom);

                users = users.filter(function (user) {
                    return user.id != socket.id;
                });
                io.to(room.room).emit('update-users', room.users);
            }
        }
    });
});