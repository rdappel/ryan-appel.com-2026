// utils/canvas.js
// Canvas + drawing helpers for demos

// ---------- canvas sizing ----------

export const resizeCanvasToDisplaySize = canvas => {
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    return true
  }

  return false
}

// ---------- clearing ----------

export const clear = (ctx, { color = null } = {}) => {
  const { canvas } = ctx
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (color) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

// ---------- primitives ----------

export const drawCircle = (ctx, { x, y }, radius, opts = {}) => {
  const {
    fill = '#fff',
    stroke = null,
    lineWidth = 1,
  } = opts

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)

  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }

  if (stroke) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

export const drawLine = (ctx, a, b, opts = {}) => {
  const {
    stroke = '#fff',
    lineWidth = 1,
  } = opts

  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = stroke
  ctx.stroke()
}

export const drawRect = (ctx, x, y, w, h, opts = {}) => {
  const {
    fill = null,
    stroke = null,
    lineWidth = 1,
  } = opts

  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(x, y, w, h)
  }

  if (stroke) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = stroke
    ctx.strokeRect(x, y, w, h)
  }
}

// ---------- grid ----------

export const drawGrid = (ctx, cellSize, opts = {}) => {
  const {
    color = 'rgba(255,255,255,0.1)',
    lineWidth = 1,
  } = opts

  const { width, height } = ctx.canvas

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth

  for (let x = cellSize; x < width; x += cellSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = cellSize; y < height; y += cellSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}

// ---------- text ----------

export const drawText = (ctx, text, x, y, opts = {}) => {
  const {
    color = '#fff',
    size = 12,
    align = 'center',
    baseline = 'middle',
    font = 'system-ui, sans-serif',
  } = opts

  ctx.fillStyle = color
  ctx.font = `${size}px ${font}`
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(text, x, y)
}

// ---------- transforms ----------

export const withSave = (ctx, fn) => {
  ctx.save()
  fn()
  ctx.restore()
}

// ---------- helpers ----------

export const getSize = ctx => ({
  width: ctx.canvas.width,
  height: ctx.canvas.height,
})