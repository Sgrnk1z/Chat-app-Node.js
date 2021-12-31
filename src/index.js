const express = require('express')
const http = require('http')
const path = require('path')
const socket = require('socket.io')
const filterBadWords = require('bad-words')
const generateMessage = require('../src/utils/messages')
const { getUsersInRoom, getUser, removeUser, addUser } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socket(server)
const port = process.env.PORT | 5000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.json())
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log("New Websocket connection");

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            console.log("Error", error);
            return callback(error)
        }
        socket.join(room)

        socket.emit('receiveMessage', generateMessage("Admin", `Hello ${user.username}, welcome to Chat-App`));
        socket.broadcast.to(user.room).emit("receiveMessage", generateMessage("Admin", `${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        return callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        if (user && user.room) {
            const m = new filterBadWords()
            if (m.isProfane(msg)) {
                return callback("Bad words detected.");
            }
            io.to(user.room).emit('receiveMessage', generateMessage(user.username, msg))
        }
        callback()
    })

    socket.on("location", (loc, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit(
            'receiveLocation',
            generateMessage(user.username, `https://google.com/maps?q=${loc.latitude},${loc.longitude}`)
        )
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit("receiveMessage", generateMessage("Admin", `${user.username} has left!`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(process.env.PORT | 5000, () => {
    console.log("Server is up and running on " + process.env.PORT | 5000);
})