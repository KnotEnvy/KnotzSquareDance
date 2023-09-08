const express = require('express')
const app = express()

//socket.io setup
const http = require('http')
const server = http.createServer(app)
const  { Server } = require('socket.io')
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backendPlayers = {}
const backendProjectiles ={}
const SPEED = 15
let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')
  backendPlayers[socket.id] ={
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    radius: 10,
    color: `hsl(${360 * Math.random()},85%, 50%)`,
    sequenceNumber: 0
    
  }
  //broadcast to all players
  io.emit('updatePlayers', backendPlayers)

  socket.on('shoot', ({x, y, angle}) => {
    projectileId++;

      const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }

    backendProjectiles[projectileId] = {
      x, y, velocity, 
      playerId : socket.id
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backendPlayers[socket.id]
    io.emit('updatePlayers', backendPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) =>{
    backendPlayers[socket.id].sequenceNumber = sequenceNumber
    switch(keycode) {
      case 'KeyW':
        backendPlayers[socket.id].y -= SPEED
        break
      case 'KeyA':
        backendPlayers[socket.id].x -= SPEED
        break
      case 'KeyS':
        backendPlayers[socket.id].y += SPEED
        break
      case 'KeyD':
        backendPlayers[socket.id].x += SPEED
        break
    }
  })
  console.log(backendPlayers)
})

setInterval(() => {
  //update projectiles
  for (const id in backendProjectiles) {
    backendProjectiles[id].x += backendProjectiles[id].velocity.x
    backendProjectiles[id].y += backendProjectiles[id].velocity.y
  }
  io.emit('updateProjectiles', backendProjectiles)
  io.emit('updatePlayers', backendPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
