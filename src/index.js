const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const path = require('path');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { getUser, removeUser, getUsersInRoom, addUser } = require('./utils/users')

const publicPath = path.join(__dirname, "../public");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New WebSocket connection!')


  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if(error) return callback(error)

    socket.join(user.room);

    socket.emit('message', generateMessage('Chat', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Chat', `${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    
    const filter = new Filter();
    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  })

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, location));
    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if(user) {
      io.to(user.room).emit('message', generateMessage('Chat' , `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})


server.listen(port, () => {
  console.log(`Server has started on port ${port}`);
})
