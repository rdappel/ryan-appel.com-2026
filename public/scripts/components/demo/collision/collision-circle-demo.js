// components/demo/collision/collision-circle-demo.js

import { CanvasDemoElement } from '../canvas-demo-element.js'
import { vec, clamp, randomRange, distanceSq } from '../utils/math.js'
import { clear, drawCircle, drawText, drawLine } from '../utils/canvas.js'

const createRadius = () => randomRange(16, 32)
const clampRadius = value => clamp(value, 6, 180)

const getLocalPointer = (event, canvas) => {
	const rect = canvas.getBoundingClientRect()
	const scaleX = canvas.width / Math.max(rect.width, 1)
	const scaleY = canvas.height / Math.max(rect.height, 1)

	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY,
	}
}

const clampCircleToCanvas = ({ position, radius, width, height }) => ({
	x: clamp(position.x, radius, width - radius),
	y: clamp(position.y, radius, height - radius),
})

const intersectsCircle = (a, b) => {
	const radiusSum = a.radius + b.radius
	return distanceSq(a.position, b.position) <= radiusSum * radiusSum
}

export class CollisionCircleDemo extends CanvasDemoElement {
	static get observedAttributes() {
		return ['fixed-radius', 'movable-radius']
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
		this.$metric = this.addStat('dist² <= (r1 + r2)²')
	}

	getRadiusFromAttr(name) {
		const fallback = createRadius()
		return clampRadius(this.getNumberAttr(name, fallback))
	}

	reset() {
		const width = this.$canvas.width || 900
		const height = this.$canvas.height || 420
		const fixedRadius = this.getRadiusFromAttr('fixed-radius')
		const movableRadius = this.getRadiusFromAttr('movable-radius')
		const center = {
			x: Math.floor(width / 2),
			y: Math.floor(height / 2),
		}

		this.state = {
			fixed: {
				position: center,
				radius: fixedRadius,
			},
			movable: {
				position: clampCircleToCanvas({
					position: vec(width * 0.74, height * 0.68),
					radius: movableRadius,
					width,
					height,
				}),
				radius: movableRadius,
			},
			intersects: false,
			distanceSquared: 0,
			radiusSquared: 0,
		}

		this.$canvas.tabIndex = 0
		this.$canvas.setAttribute('aria-label', 'Circle collision demo canvas')
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
		const center = {
			x: Math.floor(width / 2),
			y: Math.floor(height / 2),
		}

		this.state.fixed.position = clampCircleToCanvas({
			position: center,
			radius: this.state.fixed.radius,
			width,
			height,
		})

		this.state.movable.position = clampCircleToCanvas({
			position: this.state.movable.position,
			radius: this.state.movable.radius,
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

		this.state.movable.position = clampCircleToCanvas({
			position: next,
			radius: this.state.movable.radius,
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
		this.state.movable.position = clampCircleToCanvas({
			position: {
				x: this.state.movable.position.x + dx,
				y: this.state.movable.position.y + dy,
			},
			radius: this.state.movable.radius,
			width,
			height,
		})
	}

	update() {
		const distanceSquared = distanceSq(this.state.fixed.position, this.state.movable.position)
		const radiusSum = this.state.fixed.radius + this.state.movable.radius
		const radiusSquared = radiusSum * radiusSum
		const intersects = intersectsCircle(this.state.fixed, this.state.movable)

		this.state.intersects = intersects
		this.state.distanceSquared = distanceSquared
		this.state.radiusSquared = radiusSquared

		this.$status.textContent = `Intersects: ${intersects ? 'true' : 'false'}`
		this.$metric.textContent = `dist²=${distanceSquared.toFixed(0)}  vs  (r1+r2)²=${radiusSquared.toFixed(0)}`
	}

	draw() {
		const { ctx } = this
		const {
			fixed,
			movable,
			intersects,
		} = this.state

		clear(ctx, { color: '#0f172a' })

		drawText(
			ctx,
			'Drag the green circle (or use arrow keys) to test circle overlap',
			12,
			12,
			{
				align: 'left',
				baseline: 'top',
				color: '#9ca3af',
				size: 12,
			}
		)

		drawLine(
			ctx,
			{ x: fixed.position.x, y: fixed.position.y },
			{ x: movable.position.x, y: movable.position.y },
			{
				stroke: intersects ? 'rgba(248,113,113,0.9)' : 'rgba(156,163,175,0.55)',
				lineWidth: 1.5,
			}
		)

		drawCircle(ctx, fixed.position, fixed.radius, {
			fill: intersects ? 'rgba(248,113,113,0.28)' : 'rgba(96,165,250,0.24)',
			stroke: intersects ? '#f87171' : '#60a5fa',
			lineWidth: 2,
		})

		drawCircle(ctx, movable.position, movable.radius, {
			fill: intersects ? 'rgba(248,113,113,0.28)' : 'rgba(52,211,153,0.2)',
			stroke: intersects ? '#f87171' : '#34d399',
			lineWidth: 2,
		})

		drawText(ctx, 'fixed', fixed.position.x, fixed.position.y - fixed.radius - 10, {
			color: '#93c5fd',
			size: 11,
		})
		drawText(ctx, 'movable', movable.position.x, movable.position.y - movable.radius - 10, {
			color: '#6ee7b7',
			size: 11,
		})
	}
}

if (!customElements.get('collision-circle-demo')) {
	customElements.define('collision-circle-demo', CollisionCircleDemo)
}
