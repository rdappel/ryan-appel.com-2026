// components/demo/base-demo-element.js

export const html = (strings, ...values) =>
  String.raw({ raw: strings }, ...values)

export const parseNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export class BaseDemoElement extends HTMLElement {
  static get observedAttributes() {
    return []
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.state = {}
    this.refs = {}
    this.resizeObserver = null

    this.shadowRoot.innerHTML = html`
      <style>
        :host {
          display: block;
          width: 100%;
          color: #e5e7eb;
          --demo-bg: #0f172a;
          --demo-panel: #111827;
          --demo-border: #374151;
          --demo-text: #e5e7eb;
          --demo-muted: #9ca3af;
          --demo-accent: #60a5fa;
          font-family: system-ui, sans-serif;
        }

        .wrap {
          display: grid;
          gap: 0.75rem;
        }

        .panel {
          border: 1px solid var(--demo-border);
          border-radius: 16px;
          background: var(--demo-panel);
          overflow: hidden;
        }

        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid var(--demo-border);
        }

        .toolbar:empty {
          display: none;
        }

        .toolbar label {
          display: inline-flex;
          gap: 0.4rem;
          align-items: center;
          font-size: 0.9rem;
          color: var(--demo-text);
        }

        .toolbar input[type="range"] {
          width: 120px;
        }

        .toolbar output,
        .stat {
          color: var(--demo-muted);
          font-size: 0.9rem;
        }

        button {
          border: 1px solid var(--demo-border);
          background: #1f2937;
          color: var(--demo-text);
          border-radius: 10px;
          padding: 0.45rem 0.7rem;
          cursor: pointer;
        }

        button:hover {
          border-color: var(--demo-accent);
        }

        .stage {
          background: var(--demo-bg);
          min-height: 320px;
        }

        canvas {
          display: block;
          width: 100%;
          height: 420px;
        }
      </style>

      <div class="wrap">
        <div class="panel">
          <div class="toolbar" part="toolbar"></div>
          <div class="stage" part="stage"></div>
        </div>
      </div>
    `

    this.$toolbar = this.shadowRoot.querySelector('.toolbar')
    this.$stage = this.shadowRoot.querySelector('.stage')
  }

  connectedCallback() {
    this.renderControls()
    this.renderStage()
    this.setupResizeObserver()
    this.afterMount()
  }

  disconnectedCallback() {
    this.beforeUnmount()
    this.resizeObserver?.disconnect()
  }

  attributeChangedCallback() {
    if (!this.isConnected) return

    this.renderControls()
    this.onAttributesChanged()
  }

  setupResizeObserver() {
    this.resizeObserver?.disconnect()
    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(this)
  }

  getNumberAttr(name, fallback) {
    return parseNumber(this.getAttribute(name), fallback)
  }

  setNumberAttr(name, value) {
    this.setAttribute(name, String(value))
  }

  setRef(name, value) {
    this.refs[name] = value
    return value
  }

  getRef(name) {
    return this.refs[name]
  }

  renderControls() {
    this.$toolbar.innerHTML = ''
  }

  renderStage() {}

  afterMount() {}
  beforeUnmount() {}
  onResize() {}
  onAttributesChanged() {}

  addRangeControl = ({ label, attr, min, max, step = 1, value, onInput }) => {
    const id = `${this.tagName.toLowerCase()}-${attr}`
    const wrapper = document.createElement('label')

    wrapper.innerHTML = `
      <span>${label}</span>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
      <output for="${id}">${value}</output>
    `

    const input = wrapper.querySelector('input')
    const output = wrapper.querySelector('output')

    input.addEventListener('input', event => {
      const nextValue = event.target.value
      output.value = nextValue

      if (onInput) {
        onInput(nextValue)
        return
      }

      this.setNumberAttr(attr, nextValue)
    })

    this.$toolbar.append(wrapper)

    return input
  }

  addButton = ({ text, onClick }) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = text
    button.addEventListener('click', onClick)
    this.$toolbar.append(button)
    return button
  }

  addStat = text => {
    const stat = document.createElement('span')
    stat.className = 'stat'
    stat.textContent = text
    this.$toolbar.append(stat)
    return stat
  }
}