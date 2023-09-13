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
const SPEED = 10
const RADIUS = 10
const PROJECTILE_RADIUS = 5

let projectileId = 0

io.on('connection', (socket) => {
  console.log('a user connected')
  
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

  socket.on('initGame', ({username, width, height}) => {
    backendPlayers[socket.id] ={
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${360 * Math.random()},85%, 50%)`,
      sequenceNumber: 0, 
      score: 0,
      username
    }
    backendPlayers[socket.id].canvas = {
      width, 
      height,
    }
    backendPlayers[socket.id].radius = RADIUS
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backendPlayers[socket.id]
    io.emit('updatePlayers', backendPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) =>{
    const backendPlayer = backendPlayers[socket.id]

    if (!backendPlayers[socket.id]) return
    
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
    const playerSides = {
      left: backendPlayer.x - backendPlayer.radius,
      right: backendPlayer.x + backendPlayer.radius,
      top: backendPlayer.y - backendPlayer.radius,
      bottom: backendPlayer.y + backendPlayer.radius
    }
    if (playerSides.left < 0) backendPlayers[socket.id].x = backendPlayer.radius

    if (playerSides.right > 1024)
      backendPlayers[socket.id].x = 1024 - backendPlayer.radius

    if (playerSides.top < 0) backendPlayers[socket.id].y = backendPlayer.radius

    if (playerSides.bottom > 576)
      backendPlayers[socket.id].y = 576 - backendPlayer.radius  
  })
})
//ticker
setInterval(() => {
  //update projectiles
  for (const id in backendProjectiles) {
    backendProjectiles[id].x += backendProjectiles[id].velocity.x
    backendProjectiles[id].y += backendProjectiles[id].velocity.y

    if (backendProjectiles[id].x - PROJECTILE_RADIUS >= backendPlayers[backendProjectiles[id].playerId]?.canvas?.width ||
      backendProjectiles[id].x + PROJECTILE_RADIUS <= 0 || 
      backendProjectiles[id].y - PROJECTILE_RADIUS >= backendPlayers[backendProjectiles[id].playerId]?.canvas?.height ||
      backendProjectiles[id].y + PROJECTILE_RADIUS <= 0

    ){
      delete backendProjectiles[id]
    continue;
    }
    for (const playerId in backendPlayers) {
      const backendPlayer = backendPlayers[playerId]
      
      const DISTANCE = Math.hypot(
        backendProjectiles[id].x - backendPlayer.x,
        backendProjectiles[id].y - backendPlayer.y
      )
      // collision detect
      if (DISTANCE < PROJECTILE_RADIUS + backendPlayer.radius && 
        backendProjectiles[id].playerId !== playerId){
          if(backendPlayers[backendProjectiles[id].playerId])
            backendPlayers[backendProjectiles[id].playerId].score++
        delete backendProjectiles[id]
        delete backendPlayers[playerId]
        break
      }
    }
      
  }
  io.emit('updateProjectiles', backendProjectiles)
  io.emit('updatePlayers', backendPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
