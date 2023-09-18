const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

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
  for (const frontendProjectileId in frontendProjectiles) {
    if (!backendProjectiles[frontendProjectileId]) {
      delete frontendProjectiles[frontendProjectileId]
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
        color: backendPlayer.color,
        username: backendPlayer.username
      })
      document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score="${backendPlayer.score}">${backendPlayer.username}: ${backendPlayer.score}</div>`
    } else {
      document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backendPlayer.username}: ${backendPlayer.score}`
      document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backendPlayer.score)
      
      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))
        return scoreB - scoreA
      })

      childDivs.forEach(div => {
        parentDiv.removeChild(div)
      })
      childDivs.forEach(div => {
        parentDiv.appendChild(div)
      })

      frontendPlayers[id].target = {
        x: backendPlayer.x,
        y: backendPlayer.y
      }

      
      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
        
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
        if (lastBackendInputIndex > -1)
        playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach(input => {
          frontendPlayers[id].target.x += input.dx
          frontendPlayers[id].target.y += input.dy
        })
      }
    }
  }
  //delete frontend player
  for (const id in frontendPlayers) {
    if (!backendPlayers[id]) {

      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if (id === socket.id){
        document.querySelector('#usernameForm').style.display = 'block'
      }
      delete frontendPlayers[id]
    }
  }
})


let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.clearRect(0, 0, canvas.width, canvas.height)

  for (const id in frontendPlayers) {
    const frontendPlayer = frontendPlayers[id]

    if (frontendPlayer.target){
      frontendPlayers[id].x += (frontendPlayers[id].target.x - frontendPlayers[id].x) * 0.5
      frontendPlayers[id].y += (frontendPlayers[id].target.y - frontendPlayers[id].y) * 0.5


    }
    frontendPlayer.draw()
  }
  for (const id in frontendProjectiles) {
    const frontendProjectile = frontendProjectiles[id]
    frontendProjectile.draw()
  }
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

const SPEED = 5
const playerInputs = []
let sequenceNumber = 0

setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber})
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber})
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber})
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
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

document.querySelector('#usernameForm').addEventListener('submit', (e) => {
  e.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    width: canvas.width, 
    height: canvas.height, 
    devicePixelRatio,
    username: document.querySelector('#usernameInput').value
    
    })
})
