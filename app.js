const express = require('express')
const app = express()

//socket.io setup
const http = require('http')
const server = http.createServer(app)
const  { Server } = require('socket.io')
const io = new Server(server)

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const players = {
  player1: {
    x: 100,
    y: 100,
    color: 'yellow'
  },
  player2: {
    x: 400,
    y: 400,
    color: 'red'
  },
}

io.on('connection', (socket) => {
  console.log('a user connected')
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
