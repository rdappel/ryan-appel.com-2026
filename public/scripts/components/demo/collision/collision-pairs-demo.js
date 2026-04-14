// components/demo/collision/collision-pairs-demo.js

import { CanvasDemoElement } from '../canvas-demo-element.js'
import { vec, add, scale, clamp, randomRange, pairKey } from '../utils/math.js'
import { drawCircle, drawLine, drawGrid, clear } from '../utils/canvas.js'

// ---------- helpers ----------

const createBall = ({ width, height }) => {
  const radius = randomRange(8, 15)
  const angle = Math.random() * Math.PI * 2
  const speed = randomRange(50, 110)

  return {
    position: vec(
      randomRange(radius, width - radius),
      randomRange(radius, height - radius)
    ),
    velocity: vec(Math.cos(angle) * speed, Math.sin(angle) * speed),
    radius,
  }
}

const updateBall = ({ ball, width, height, dt }) => {
  const next = add(ball.position, scale(ball.velocity, dt))

  let vx = ball.velocity.x
  let vy = ball.velocity.y

  if (next.x - ball.radius < 0 || next.x + ball.radius > width) {
    vx *= -1
  }

  if (next.y - ball.radius < 0 || next.y + ball.radius > height) {
    vy *= -1
  }

  return {
    ...ball,
    position: {
      x: clamp(next.x, ball.radius, width - ball.radius),
      y: clamp(next.y, ball.radius, height - ball.radius),
    },
    velocity: { x: vx, y: vy },
  }
}

// ---------- component ----------

export class CollisionPairsDemo extends CanvasDemoElement {
  static get observedAttributes() {
    return ['ball-count', 'sector-size']
  }

  get ballCount() {
    return this.getNumberAttr('ball-count', 12)
  }

  get sectorSize() {
    return this.getNumberAttr('sector-size', 80)
  }

  renderControls() {
    this.$toolbar.innerHTML = ''

    this.addRangeControl({
      label: 'Balls',
      attr: 'ball-count',
      min: 4,
      max: 40,
      value: this.ballCount,
    })

    this.addRangeControl({
      label: 'Sector Size',
      attr: 'sector-size',
      min: 30,
      max: 180,
      value: this.sectorSize,
    })

    this.addButton({
      text: 'Reset',
      onClick: () => this.reset(),
    })

    this.$pairs = this.addStat('Pairs: 0')
    this.$sectors = this.addStat('Sectors: 0')
  }

  reset() {
    const width = this.$canvas.width || 800
    const height = this.$canvas.height || 420

    this.state = {
      balls: Array.from({ length: this.ballCount }, () =>
        createBall({ width, height })
      ),
      sectorMap: new Map(),
      pairs: [],
    }
  }

  handleResize() {
    if (!this.state.balls) return

    const { width, height } = this.$canvas

    this.state.balls = this.state.balls.map(b => ({
      ...b,
      position: {
        x: clamp(b.position.x, b.radius, width - b.radius),
        y: clamp(b.position.y, b.radius, height - b.radius),
      },
    }))
  }

  update(dt) {
    const { width, height } = this.$canvas

    const balls = this.state.balls.map(b =>
      updateBall({ ball: b, width, height, dt })
    )

    // ---------- build sectors ----------

    const sectorMap = new Map()

    balls.forEach((ball, i) => {
      const sx = Math.floor(ball.position.x / this.sectorSize)
      const sy = Math.floor(ball.position.y / this.sectorSize)
      const key = `${sx},${sy}`

      const list = sectorMap.get(key) ?? []
      list.push(i)
      sectorMap.set(key, list)
    })

    // ---------- candidate pairs ----------

    const pairSet = new Set()

    for (const list of sectorMap.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          pairSet.add(pairKey(list[i], list[j]))
        }
      }
    }

    const pairs = Array.from(pairSet).map(k =>
      k.split(':').map(Number)
    )

    this.state = { balls, sectorMap, pairs }

    this.$pairs.textContent = `Pairs: ${pairs.length}`
    this.$sectors.textContent = `Sectors: ${sectorMap.size}`
  }

  draw() {
    const { ctx } = this
    const { width, height } = ctx.canvas

    clear(ctx, { color: '#0f172a' })

    // heatmap
    this.state.sectorMap.forEach((list, key) => {
      const [sx, sy] = key.split(',').map(Number)
      const alpha = Math.min(0.35, list.length / 5)

      ctx.fillStyle = `rgba(96,165,250,${alpha})`
      ctx.fillRect(
        sx * this.sectorSize,
        sy * this.sectorSize,
        this.sectorSize,
        this.sectorSize
      )
    })

    drawGrid(ctx, this.sectorSize)

    // candidate pairs
    this.state.pairs.forEach(([a, b]) => {
      drawLine(ctx,
        this.state.balls[a].position,
        this.state.balls[b].position,
        { stroke: 'rgba(248,113,113,0.5)' }
      )
    })

    // balls
    this.state.balls.forEach((b, i) => {
      drawCircle(ctx, b.position, b.radius, {
        fill: '#ffffff',
      })

      ctx.fillStyle = '#0f172a'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(i, b.position.x, b.position.y)
    })
  }
}

// register once
if (!customElements.get('collision-pairs-demo')) {
  customElements.define('collision-pairs-demo', CollisionPairsDemo)
}