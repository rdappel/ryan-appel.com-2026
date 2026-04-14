// utils/math.js
// Generic math + vector helpers for demos

// ---------- scalars ----------

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const lerp = (a, b, t) => a + (b - a) * t

export const invLerp = (a, b, v) =>
  a === b ? 0 : (v - a) / (b - a)

export const mapRange = (inMin, inMax, outMin, outMax, v) =>
  lerp(outMin, outMax, invLerp(inMin, inMax, v))

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp(invLerp(edge0, edge1, x), 0, 1)
  return t * t * (3 - 2 * t)
}

// ---------- random ----------

export const random = () => Math.random()

export const randomRange = (min, max) =>
  Math.random() * (max - min) + min

export const randomInt = (min, max) =>
  Math.floor(randomRange(min, max + 1))

export const randomChoice = arr =>
  arr[Math.floor(Math.random() * arr.length)]

// ---------- vectors (2D) ----------

export const vec = (x = 0, y = 0) => ({ x, y })

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })

export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })

export const scale = (v, s) => ({ x: v.x * s, y: v.y * s })

export const dot = (a, b) => a.x * b.x + a.y * b.y

export const lengthSq = v => v.x * v.x + v.y * v.y

export const length = v => Math.sqrt(lengthSq(v))

export const normalize = v => {
  const len = length(v)
  return len === 0 ? vec(0, 0) : scale(v, 1 / len)
}

export const distanceSq = (a, b) => lengthSq(sub(a, b))

export const distance = (a, b) => Math.sqrt(distanceSq(a, b))

export const perp = v => ({ x: -v.y, y: v.x })

export const angle = v => Math.atan2(v.y, v.x)

export const fromAngle = (radians, length = 1) => ({
  x: Math.cos(radians) * length,
  y: Math.sin(radians) * length,
})

// ---------- geometry ----------

export const circleContainsPoint = (center, radius, point) =>
  distanceSq(center, point) <= radius * radius

export const aabbContainsPoint = (min, max, p) =>
  p.x >= min.x && p.x <= max.x &&
  p.y >= min.y && p.y <= max.y

export const aabbOverlap = (aMin, aMax, bMin, bMax) =>
  aMin.x <= bMax.x && aMax.x >= bMin.x &&
  aMin.y <= bMax.y && aMax.y >= bMin.y

// ---------- misc ----------

// stable pair key for (i, j) regardless of order
export const pairKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`

// cheap id generator (good enough for demos)
let _id = 0
export const uid = () => ++_id