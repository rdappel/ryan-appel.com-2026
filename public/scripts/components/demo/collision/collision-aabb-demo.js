// components/demo/collision/collision-aabb-demo.js

import { CanvasDemoElement } from '../canvas-demo-element.js'
import { vec, clamp, randomRange } from '../utils/math.js'
import { clear, drawRect, drawText, drawLine } from '../utils/canvas.js'

const createHalfSize = () => vec(randomRange(26, 44), randomRange(20, 36))
const clampHalf = value => clamp(value, 8, 220)

const getLocalPointer = (event, canvas) => {
	const rect = canvas.getBoundingClientRect()
	const scaleX = canvas.width / Math.max(rect.width, 1)
	const scaleY = canvas.height / Math.max(rect.height, 1)

	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY,
	}
}

const clampBoxToCanvas = ({ position, half, width, height }) => ({
	x: clamp(position.x, half.x, width - half.x),
	y: clamp(position.y, half.y, height - half.y),
})

const intersectsAABB = (a, b) => {
	if (a.position.x + a.half.x < b.position.x - b.half.x) return false
	if (a.position.x - a.half.x > b.position.x + b.half.x) return false
	if (a.position.y + a.half.y < b.position.y - b.half.y) return false
	if (a.position.y - a.half.y > b.position.y + b.half.y) return false
	return true
}

const drawBox = (ctx, box, { fill, stroke }) => {
	const x = box.position.x - box.half.x
	const y = box.position.y - box.half.y
	const w = box.half.x * 2
	const h = box.half.y * 2

	drawRect(ctx, x, y, w, h, {
		fill,
		stroke,
		lineWidth: 2,
	})
}

export class CollisionAABBDemo extends CanvasDemoElement {
	static get observedAttributes() {
		return [
			'fixed-width',
			'fixed-height',
			'movable-width',
			'movable-height',
		]
	}

	constructor() {
		super()
		this.isDragging = false
		this.boundPointerDown = event => this.onPointerDown(event)
		this.boundPointerMove = event => this.onPointerMove(event)
		this.boundPointerUp = () => this.onPointerUp()
		this.boundKeyDown = event => this.onKeyDown(event)
	}

	renderControls() {
		this.$toolbar.innerHTML = ''

		this.addButton({
			text: 'Reset',
			onClick: () => this.reset(),
		})

		this.$status = this.addStat('Intersects: false')
	}

	getHalfFromAttrs(widthAttr, heightAttr) {
		const fallback = createHalfSize()
		const fullWidth = this.getNumberAttr(widthAttr, fallback.x * 2)
		const fullHeight = this.getNumberAttr(heightAttr, fallback.y * 2)

		return vec(
			clampHalf(fullWidth / 2),
			clampHalf(fullHeight / 2)
		)
	}

	reset() {
		const width = this.$canvas.width || 900
		const height = this.$canvas.height || 420
		const fixedHalf = this.getHalfFromAttrs('fixed-width', 'fixed-height')
		const movableHalf = this.getHalfFromAttrs('movable-width', 'movable-height')
		const center = {
			x: Math.floor(width / 2),
			y: Math.floor(height / 2),
		}

		this.state = {
			fixed: {
				position: center,
				half: fixedHalf,
			},
			movable: {
				position: clampBoxToCanvas({
					position: vec(width * 0.76, height * 0.52),
					half: movableHalf,
					width,
					height,
				}),
				half: movableHalf,
			},
			intersects: false,
		}

		this.$canvas.tabIndex = 0
		this.$canvas.setAttribute('aria-label', 'AABB collision demo canvas')
	}

	afterMount() {
		super.afterMount()
		this.$canvas.addEventListener('pointerdown', this.boundPointerDown)
		window.addEventListener('pointermove', this.boundPointerMove)
		window.addEventListener('pointerup', this.boundPointerUp)
		this.$canvas.addEventListener('keydown', this.boundKeyDown)
	}

	beforeUnmount() {
		window.removeEventListener('pointermove', this.boundPointerMove)
		window.removeEventListener('pointerup', this.boundPointerUp)
		this.$canvas?.removeEventListener('pointerdown', this.boundPointerDown)
		this.$canvas?.removeEventListener('keydown', this.boundKeyDown)
		super.beforeUnmount()
	}

	handleResize() {
		if (!this.state.fixed || !this.state.movable) return

		const { width, height } = this.$canvas
		const fixedHalf = this.state.fixed.half
		const movableHalf = this.state.movable.half
		const center = {
			x: Math.floor(width / 2),
			y: Math.floor(height / 2),
		}

		this.state.fixed.position = clampBoxToCanvas({
			position: center,
			half: fixedHalf,
			width,
			height,
		})

		this.state.movable.position = clampBoxToCanvas({
			position: this.state.movable.position,
			half: movableHalf,
			width,
			height,
		})
	}

	onPointerDown(event) {
		if (!this.state.movable) return
		this.isDragging = true
		this.$canvas.setPointerCapture?.(event.pointerId)
		this.onPointerMove(event)
	}

	onPointerMove(event) {
		if (!this.isDragging || !this.state.movable) return

		const { width, height } = this.$canvas
		const next = getLocalPointer(event, this.$canvas)

		this.state.movable.position = clampBoxToCanvas({
			position: next,
			half: this.state.movable.half,
			width,
			height,
		})
	}

	onPointerUp() {
		this.isDragging = false
	}

	onKeyDown(event) {
		if (!this.state.movable) return
		const delta = event.shiftKey ? 14 : 6
		let dx = 0
		let dy = 0

		if (event.key === 'ArrowLeft') dx = -delta
		if (event.key === 'ArrowRight') dx = delta
		if (event.key === 'ArrowUp') dy = -delta
		if (event.key === 'ArrowDown') dy = delta
		if (dx === 0 && dy === 0) return

		event.preventDefault()

		const { width, height } = this.$canvas
		this.state.movable.position = clampBoxToCanvas({
			position: {
				x: this.state.movable.position.x + dx,
				y: this.state.movable.position.y + dy,
			},
			half: this.state.movable.half,
			width,
			height,
		})
	}

	update() {
		const intersects = intersectsAABB(this.state.fixed, this.state.movable)
		this.state.intersects = intersects
		this.$status.textContent = `Intersects: ${intersects ? 'true' : 'false'}`
	}

	draw() {
		const { ctx } = this
		const { fixed, movable, intersects } = this.state

		clear(ctx, { color: '#0f172a' })

		drawText(
			ctx,
			'Drag the green box (or use arrow keys) to test AABB overlap',
			12,
			12,
			{
				align: 'left',
				baseline: 'top',
				color: '#9ca3af',
				size: 12,
			}
		)

		drawBox(ctx, fixed, {
			fill: intersects ? 'rgba(248,113,113,0.28)' : 'rgba(96,165,250,0.24)',
			stroke: intersects ? '#f87171' : '#60a5fa',
		})

		drawBox(ctx, movable, {
			fill: intersects ? 'rgba(248,113,113,0.28)' : 'rgba(52,211,153,0.2)',
			stroke: intersects ? '#f87171' : '#34d399',
		})

		drawLine(ctx,
			{ x: fixed.position.x, y: fixed.position.y },
			{ x: movable.position.x, y: movable.position.y },
			{
				stroke: intersects ? 'rgba(248,113,113,0.85)' : 'rgba(156,163,175,0.45)',
				lineWidth: 1.2,
			}
		)

		drawText(ctx, 'fixed', fixed.position.x, fixed.position.y - fixed.half.y - 10, {
			color: '#93c5fd',
			size: 11,
		})
		drawText(ctx, 'movable', movable.position.x, movable.position.y - movable.half.y - 10, {
			color: '#6ee7b7',
			size: 11,
		})
	}
}

if (!customElements.get('collision-aabb-demo')) {
	customElements.define('collision-aabb-demo', CollisionAABBDemo)
}
