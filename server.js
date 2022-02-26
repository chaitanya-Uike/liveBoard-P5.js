const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { v4: uuid } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    const roomId = uuid()
    res.redirect(roomId)
})

app.get('/:roomId', (req, res) => {
    const roomId = req.params.roomId
    res.render('room', { roomId })
})

io.on("connection", socket => {
    socket.on("join-room", roomId => {
        let clientSet = io.sockets.adapter.rooms.get(roomId)
        let host
        if (clientSet)
            host = [...clientSet][0]

        socket.join(roomId)

        if (host)
            socket.to(host).emit('send-state', socket.id)

        socket.on("send-canvas-state", (user, data) => {
            socket.to(user).emit("get-canvas-state", data)
        })

        socket.on("trigger-clear-canvas", roomId => {
            socket.to(roomId).emit('clear-canvas')
        })

        socket.on("send-path", payload => {
            socket.to(roomId).emit("draw", payload)
        })
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, console.log("Server listening on PORT 3000..."))