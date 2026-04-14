// components/demo/canvas-demo-element.js

import { BaseDemoElement } from './base-demo-element.js'
import { resizeCanvasToDisplaySize } from './utils/canvas.js'

export class CanvasDemoElement extends BaseDemoElement {
  constructor() {
    super()
    this.rafId = 0
    this.lastTime = 0
    this.ctx = null
    this.$canvas = null
    this.hasInitializedState = false
  }

  renderStage() {
    this.$stage.innerHTML = '<canvas part="canvas"></canvas>'
    this.$canvas = this.$stage.querySelector('canvas')
    this.ctx = this.$canvas.getContext('2d')
  }

  connectedCallback() {
    super.connectedCallback()
    resizeCanvasToDisplaySize(this.$canvas)
    if (!this.hasInitializedState) {
      this.reset()
      this.hasInitializedState = true
    }
    this.handleResize()
  }

  afterMount() {
    this.start()
  }

  beforeUnmount() {
    this.stop()
  }

  onResize() {
    if (!this.$canvas) return

    resizeCanvasToDisplaySize(this.$canvas)
    this.handleResize()
  }

  onAttributesChanged() {
    this.reset()
  }

  start() {
    if (this.rafId) return

    this.lastTime = performance.now()

    const frame = now => {
      if (!this.$canvas) return  // ← added guard

      const dt = Math.min(0.033, (now - this.lastTime) / 1000)
      this.lastTime = now

      resizeCanvasToDisplaySize(this.$canvas)
      this.update(dt)
      this.draw()

      this.rafId = requestAnimationFrame(frame)
    }

    this.rafId = requestAnimationFrame(frame)
  }

  stop() {
    cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  reset() {}
  update() {}
  draw() {}
  handleResize() {}
}