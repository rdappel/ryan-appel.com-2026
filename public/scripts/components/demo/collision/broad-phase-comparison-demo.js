// components/demo/broad-phase-comparison-demo.js

import { CanvasDemoElement } from '../canvas-demo-element.js'
import { vec, add, scale, clamp, randomRange, pairKey } from '../utils/math.js'
import { drawCircle, drawLine, drawGrid, clear, drawText } from '../utils/canvas.js'

// ---------- helpers ----------

const createBall = ({ width, height, radius = null }) => {
  const r = radius ?? randomRange(8, 15)
  const angle = Math.random() * Math.PI * 2
  const speed = randomRange(50, 110)

  return {
    position: vec(
      randomRange(r, width - r),
      randomRange(r, height - r)
    ),
    velocity: vec(Math.cos(angle) * speed, Math.sin(angle) * speed),
    radius: r,
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

const getNaivePairs = balls => {
  const pairs = []

  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      pairs.push([i, j])
    }
  }

  return pairs
}

const getSectorMap = ({ balls, sectorSize }) => {
  const sectorMap = new Map()

  balls.forEach((ball, i) => {
    const sx = Math.floor(ball.position.x / sectorSize)
    const sy = Math.floor(ball.position.y / sectorSize)
    const key = `${sx},${sy}`

    const list = sectorMap.get(key) ?? []
    list.push(i)
    sectorMap.set(key, list)
  })

  return sectorMap
}

const getPartitionPairs = sectorMap => {
  const pairSet = new Set()

  for (const list of sectorMap.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        pairSet.add(pairKey(list[i], list[j]))
      }
    }
  }

  return Array.from(pairSet).map(key => key.split(':').map(Number))
}

const drawBallLabels = (ctx, balls) => {
  balls.forEach((ball, i) => {
    drawCircle(ctx, ball.position, ball.radius, { fill: '#ffffff' })

    drawText(ctx, String(i), ball.position.x, ball.position.y, {
      color: '#0f172a',
      size: 12,
    })
  })
}

const drawPairs = (ctx, balls, pairs, stroke) => {
  pairs.forEach(([a, b]) => {
    drawLine(ctx, balls[a].position, balls[b].position, {
      stroke,
      lineWidth: 1.5,
    })
  })
}

const drawSectorHeat = (ctx, sectorMap, sectorSize) => {
  sectorMap.forEach((list, key) => {
    const [sx, sy] = key.split(',').map(Number)
    const alpha = Math.min(0.35, list.length / 5)

    ctx.fillStyle = `rgba(96,165,250,${alpha})`
    ctx.fillRect(
      sx * sectorSize,
      sy * sectorSize,
      sectorSize,
      sectorSize
    )
  })
}

const drawPanelFrame = (ctx, x, y, width, height) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)
}

const withViewport = (ctx, x, y, width, height, fn) => {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.translate(x, y)
  fn()
  ctx.restore()
}

// ---------- component ----------

export class BroadPhaseComparisonDemo extends CanvasDemoElement {
  static get observedAttributes() {
    return ['ball-count']
  }

  get ballCount() {
    return this.getNumberAttr('ball-count', 10)
  }

  get sectorSize() {
    return 80
  }

  renderControls() {
    this.$toolbar.innerHTML = ''

    this.addRangeControl({
      label: 'Balls',
      attr: 'ball-count',
      min: 4,
      max: 20,
      value: this.ballCount,
    })

    this.$naiveStat = this.addStat('Naive pairs: 0')
    this.$gridStat = this.addStat('Grid pairs: 0')
    this.$sectorStat = this.addStat('Occupied sectors: 0')
  }

  reset() {
    const width = this.$canvas.width || 900
    const height = this.$canvas.height || 420
    const panelWidth = Math.max(1, Math.floor(width / 2))
    const simWidth = Math.max(1, panelWidth - 24)
    const simHeight = Math.max(1, height - 48)

    const balls = Array.from({ length: this.ballCount }, () =>
      createBall({ width: simWidth, height: simHeight })
    )

    this.state = {
      balls,
      naivePairs: [],
      sectorMap: new Map(),
      partitionPairs: [],
    }
  }

  handleResize() {
    if (!this.state.balls?.length) return

    const width = this.$canvas.width
    const height = this.$canvas.height
    const panelWidth = Math.max(1, Math.floor(width / 2))
    const simWidth = Math.max(1, panelWidth - 24)
    const simHeight = Math.max(1, height - 48)

    this.state.balls = this.state.balls.map(ball => ({
      ...ball,
      position: {
        x: clamp(ball.position.x, ball.radius, simWidth - ball.radius),
        y: clamp(ball.position.y, ball.radius, simHeight - ball.radius),
      },
    }))
  }

  update(dt) {
    const width = this.$canvas.width
    const height = this.$canvas.height
    const panelWidth = Math.max(1, Math.floor(width / 2))
    const simWidth = Math.max(1, panelWidth - 24)
    const simHeight = Math.max(1, height - 48)

    const balls = this.state.balls.map(ball =>
      updateBall({ ball, width: simWidth, height: simHeight, dt })
    )

    const naivePairs = getNaivePairs(balls)
    const sectorMap = getSectorMap({ balls, sectorSize: this.sectorSize })
    const partitionPairs = getPartitionPairs(sectorMap)

    this.state = {
      balls,
      naivePairs,
      sectorMap,
      partitionPairs,
    }

    this.$naiveStat.textContent = `Naive pairs: ${naivePairs.length}`
    this.$gridStat.textContent = `Grid pairs: ${partitionPairs.length}`
    this.$sectorStat.textContent = `Occupied sectors: ${sectorMap.size}`
  }

  drawHalf({ x, y, width, height, title, subtitle, drawContent }) {
    const { ctx } = this

    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(x, y, width, height)

    drawPanelFrame(ctx, x, y, width, height)

    drawText(ctx, title, x + 12, y + 16, {
      align: 'left',
      baseline: 'middle',
      color: '#e5e7eb',
      size: 15,
    })

    drawText(ctx, subtitle, x + 12, y + 36, {
      align: 'left',
      baseline: 'middle',
      color: '#9ca3af',
      size: 12,
    })

    withViewport(ctx, x + 12, y + 48, width - 24, height - 60, () => {
      drawContent()
    })
  }

  draw() {
    const { ctx } = this
    const { width, height } = ctx.canvas
    const halfWidth = Math.floor(width / 2)

    clear(ctx, { color: '#0f172a' })

    this.drawHalf({
      x: 0,
      y: 0,
      width: halfWidth,
      height,
      title: 'Naive',
      subtitle: `Every ball checks every other ball (${this.state.naivePairs.length} pairs)`,
      drawContent: () => {
        drawPairs(
          ctx,
          this.state.balls,
          this.state.naivePairs,
          'rgba(248,113,113,0.34)'
        )

        drawBallLabels(ctx, this.state.balls)
      },
    })

    this.drawHalf({
      x: halfWidth,
      y: 0,
      width: width - halfWidth,
      height,
      title: 'Broad Phase Grid',
      subtitle: `Only compare likely candidates (${this.state.partitionPairs.length} pairs)`,
      drawContent: () => {
        drawSectorHeat(ctx, this.state.sectorMap, this.sectorSize)
        drawGrid(ctx, this.sectorSize, { color: 'rgba(255,255,255,0.1)' })

        drawPairs(
          ctx,
          this.state.balls,
          this.state.partitionPairs,
          'rgba(248,113,113,0.72)'
        )

        drawBallLabels(ctx, this.state.balls)
      },
    })

    ctx.beginPath()
    ctx.moveTo(halfWidth, 0)
    ctx.lineTo(halfWidth, height)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

if (!customElements.get('broad-phase-comparison-demo')) {
  customElements.define(
    'broad-phase-comparison-demo',
    BroadPhaseComparisonDemo
  )
}