// components/demo/sector-sizing-demo.js

import { CanvasDemoElement } from '../canvas-demo-element.js'
import { vec, add, scale, clamp, randomRange, pairKey } from '../utils/math.js'
import { drawCircle, drawGrid, clear, drawText, drawLine } from '../utils/canvas.js'

const DEFAULT_MIN_RADIUS = 6
const DEFAULT_MAX_RADIUS = 18

// ---------- helpers ----------

const createBall = ({ width, height, minRadius, maxRadius }) => {
  const radius = randomRange(minRadius, maxRadius)
  const angle = Math.random() * Math.PI * 2
  const speed = randomRange(45, 95)

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

const getSectorMap = ({ balls, sectorSize }) => {
  const sectorMap = new Map()

  balls.forEach((ball, i) => {
    const minSectorX = Math.max(0, Math.floor((ball.position.x - ball.radius) / sectorSize))
    const maxSectorX = Math.max(0, Math.floor((ball.position.x + ball.radius) / sectorSize))
    const minSectorY = Math.max(0, Math.floor((ball.position.y - ball.radius) / sectorSize))
    const maxSectorY = Math.max(0, Math.floor((ball.position.y + ball.radius) / sectorSize))

    for (let sectorX = minSectorX; sectorX <= maxSectorX; sectorX += 1) {
      for (let sectorY = minSectorY; sectorY <= maxSectorY; sectorY += 1) {
        const key = `${sectorX},${sectorY}`
        const list = sectorMap.get(key) ?? []

        list.push(i)
        sectorMap.set(key, list)
      }
    }
  })

  return sectorMap
}

const getSectorStats = ({ balls, sectorMap }) => {
  const occupiedSectorCount = sectorMap.size
  const counts = Array.from(sectorMap.values()).map(list => list.length)
  const totalAssignments = counts.reduce((sum, count) => sum + count, 0)
  const averagePerOccupiedSector =
    occupiedSectorCount === 0 ? 0 : totalAssignments / occupiedSectorCount
  const maxInSector = counts.length === 0 ? 0 : Math.max(...counts)

  const radii = balls.map(ball => ball.radius)
  const minBallRadius = radii.length === 0 ? 0 : Math.min(...radii)
  const maxBallRadius = radii.length === 0 ? 0 : Math.max(...radii)
  const averageBallRadius =
    radii.length === 0
      ? 0
      : radii.reduce((sum, radius) => sum + radius, 0) / radii.length

  return {
    occupiedSectorCount,
    averagePerOccupiedSector,
    maxInSector,
    minBallRadius,
    maxBallRadius,
    averageBallRadius,
  }
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

const drawSectorHeat = (ctx, sectorMap, sectorSize) => {
  sectorMap.forEach((list, key) => {
    const [sx, sy] = key.split(',').map(Number)
    const alpha = Math.min(0.42, 0.08 + list.length / 10)

    ctx.fillStyle = `rgba(96,165,250,${alpha})`
    ctx.fillRect(
      sx * sectorSize,
      sy * sectorSize,
      sectorSize,
      sectorSize
    )
  })
}

const drawBalls = (ctx, balls) => {
  balls.forEach((ball, i) => {
    drawCircle(ctx, ball.position, ball.radius, {
      fill: '#ffffff',
    })

    drawText(ctx, String(i), ball.position.x, ball.position.y, {
      color: '#0f172a',
      size: 11,
    })
  })
}

const drawPairs = (ctx, balls, pairs) => {
  pairs.forEach(([a, b]) => {
    drawLine(ctx, balls[a].position, balls[b].position, {
      stroke: 'rgba(248,113,113,0.72)',
      lineWidth: 1.5,
    })
  })
}

// ---------- component ----------

export class SectorSizingDemo extends CanvasDemoElement {
  static get observedAttributes() {
    return ['ball-count', 'sector-size']
  }

  get ballCount() {
    return this.getNumberAttr('ball-count', 24)
  }

  get sectorSize() {
    return this.getNumberAttr('sector-size', 50)
  }

  renderControls() {
    this.$toolbar.innerHTML = ''

    this.addRangeControl({
      label: 'Sector Size',
      attr: 'sector-size',
      min: 40,
      max: 200,
      value: this.sectorSize,
    })

    this.$occupiedStat = this.addStat('Occupied sectors: 0')
    this.$avgSectorStat = this.addStat('Avg / occupied sector: 0.0')
    this.$maxSectorStat = this.addStat('Max in one sector: 0')
    this.$radiusStat = this.addStat('Ball radius avg: 0.0')
  }

  reset() {
    const width = this.$canvas.width || 900
    const height = this.$canvas.height || 420

    this.state = {
      balls: Array.from({ length: this.ballCount }, () =>
        createBall({
          width,
          height,
          minRadius: DEFAULT_MIN_RADIUS,
          maxRadius: DEFAULT_MAX_RADIUS,
        })
      ),
      sectorMap: new Map(),
      pairs: [],
      stats: {
        occupiedSectorCount: 0,
        averagePerOccupiedSector: 0,
        maxInSector: 0,
        averageBallRadius: 0,
      },
    }
  }

  onAttributesChanged() {
    if (!this.state.balls) return

    const nextCount = this.ballCount
    const currentCount = this.state.balls.length
    if (nextCount === currentCount) return

    if (nextCount < currentCount) {
      this.state.balls = this.state.balls.slice(0, nextCount)
      return
    }

    const { width, height } = this.$canvas
    const additions = Array.from({ length: nextCount - currentCount }, () =>
      createBall({
        width,
        height,
        minRadius: DEFAULT_MIN_RADIUS,
        maxRadius: DEFAULT_MAX_RADIUS,
      })
    )

    this.state.balls = [...this.state.balls, ...additions]
  }

  handleResize() {
    if (!this.state.balls?.length) return

    const { width, height } = this.$canvas

    this.state.balls = this.state.balls.map(ball => ({
      ...ball,
      position: {
        x: clamp(ball.position.x, ball.radius, width - ball.radius),
        y: clamp(ball.position.y, ball.radius, height - ball.radius),
      },
    }))
  }

  update(dt) {
    const { width, height } = this.$canvas
    const balls = this.state.balls.map(ball =>
      updateBall({ ball, width, height, dt })
    )

    const sectorMap = getSectorMap({
      balls,
      sectorSize: this.sectorSize,
    })
    const pairs = getPartitionPairs(sectorMap)

    const stats = getSectorStats({ balls, sectorMap })

    this.state = {
      balls,
      sectorMap,
      pairs,
      stats,
    }

    this.$occupiedStat.textContent =
      `Occupied sectors: ${stats.occupiedSectorCount}`

    this.$avgSectorStat.textContent =
      `Avg / occupied sector: ${stats.averagePerOccupiedSector.toFixed(1)}`

    this.$maxSectorStat.textContent =
      `Max in one sector: ${stats.maxInSector}`

    this.$radiusStat.textContent =
      `Ball radius avg: ${stats.averageBallRadius.toFixed(1)}`
  }

  drawLegend() {
    const avgDiameter = this.state.stats.averageBallRadius * 2

    drawText(
      this.ctx,
      `Average diameter: ${avgDiameter.toFixed(1)}  |  Sector size: ${this.sectorSize}`,
      12,
      14,
      {
        align: 'left',
        baseline: 'top',
        color: '#9ca3af',
        size: 12,
      }
    )
  }

  draw() {
    const { ctx } = this

    clear(ctx, { color: '#0f172a' })

    drawSectorHeat(ctx, this.state.sectorMap, this.sectorSize)
    drawGrid(ctx, this.sectorSize, { color: 'rgba(255,255,255,0.1)' })
    drawPairs(ctx, this.state.balls, this.state.pairs)
    drawBalls(ctx, this.state.balls)
    this.drawLegend()
  }
}

if (!customElements.get('sector-sizing-demo')) {
  customElements.define('sector-sizing-demo', SectorSizingDemo)
}