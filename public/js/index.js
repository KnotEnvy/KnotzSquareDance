const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width * .5
const y = canvas.height * .5

const frontendPlayers = {}
const frontendProjectiles = {}
socket.on('updateProjectiles', (backendProjectiles) => {
  for (const id in backendProjectiles) {
    const backendProjectile = backendProjectiles[id]

    if (!frontendProjectiles[id]){
      frontendProjectiles[id] = new Projectile({
        x: backendProjectile.x, 
        y: backendProjectile.y, 
        radius: 5, 
        color: frontendPlayers[backendProjectile.playerId]?.color, 
        velocity: backendProjectile.velocity
      })
    } else {
      frontendProjectiles[id].x += backendProjectiles[id].velocity.x
      frontendProjectiles[id].y += backendProjectiles[id].velocity.y
    }
  }
})
//info from backend to frontend player
socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]

    if (!frontendPlayers[id]) {
      frontendPlayers[id] = new Player({
        x: backendPlayer.x, 
        y: backendPlayer.y, 
        radius: backendPlayer.radius, 
        color: backendPlayer.color
      })
    } else {
      if (id === socket.id) {
      
        // if player already exists
        frontendPlayers[id].x = backendPlayer.x
        frontendPlayers[id].y = backendPlayer.y

        const lastBackendInputIndex = playerInputs.findIndex(input => {
        
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
        if (lastBackendInputIndex > -1)
        playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach(input => {
          frontendPlayers[id].x = input.dx
          frontendPlayers[id].y = input.dy
        })
      } else {
        //for all others

        gsap.to(frontendPlayers[id], {
          x: backendPlayer.x,
          y: backendPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }
  }

  for (const id in frontendPlayers) {
    if (!backendPlayers[id]) {
      delete frontendPlayers[id]
    }
  }
})


let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (const id in frontendPlayers) {
    const frontendPlayer = frontendPlayers[id]
    frontendPlayer.draw()
  }
  for (const id in frontendProjectiles) {
    const frontendProjectile = frontendProjectiles[id]
    frontendProjectile.draw()
  }
  // for (let i= frontendProjectiles.length -1; i >= 0; i--) {
  //   const frontendProjectile = frontendProjectiles[i]
  //   frontendProjectile.update()
  // }
}

animate()

const keys= {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const SPEED = 15
const playerInputs = []
let sequenceNumber = 0

setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    frontendPlayers[socket.id].y -= SPEED
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber})
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    frontendPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber})
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    frontendPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber})
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
    frontendPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber})
  }
}, 15)

window.addEventListener('keydown', (e) => {
  if (!frontendPlayers[socket.id]) return

  switch(e.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true

      break
    case 'KeyS':
      keys.s.pressed = true

      break
    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (e) => {
  if (!frontendPlayers[socket.id]) return

  switch(e.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
  }
})
