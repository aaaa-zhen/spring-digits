/**
 * SpringNumber - 弹簧物理数字动画组件
 *
 * 使用方法:
 * const num = new SpringNumber(container, {
 *   value: 1234,        // 初始值
 *   k: 120,             // 刚度 (越大越快)
 *   b: 16,              // 阻尼 (越大回弹越少)
 *   digitHeight: 72,    // 数字高度
 *   digitWidth: 36,     // 数字宽度
 *   fontSize: 56,       // 字体大小
 * })
 *
 * num.setValue(5678)    // 更新数值
 * num.getValue()        // 获取当前值
 * num.destroy()         // 销毁组件
 */

class SpringNumber {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container

    this.options = {
      value: 0,
      k: 120,
      b: 16,
      digitHeight: 72,
      digitWidth: 36,
      fontSize: 56,
      fontWeight: 300,
      color: '#fff',
      ...options
    }

    this.digits = []
    this.animatedUntil = null
    this.rafId = null
    this.msPerStep = 4
    this.currentValue = this.options.value

    this._init()
  }

  _init() {
    this.container.style.display = 'flex'
    this._injectStyles()
    this._updateDisplay(this.options.value, false)
  }

  _injectStyles() {
    if (document.getElementById('spring-number-styles')) return

    const style = document.createElement('style')
    style.id = 'spring-number-styles'
    style.textContent = `
      .spring-digit {
        overflow: hidden;
        position: relative;
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 20%,
          black 80%,
          transparent 100%
        );
        mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          black 20%,
          black 80%,
          transparent 100%
        );
      }
      .spring-digit-wrapper {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        will-change: transform, filter, opacity;
      }
      .spring-digit-wrapper span {
        display: flex;
        align-items: center;
        justify-content: center;
        font-variant-numeric: tabular-nums;
      }
    `
    document.head.appendChild(style)
  }

  _spring(pos, k = this.options.k, b = this.options.b) {
    return { pos, dest: pos, v: 0, k, b }
  }

  _springStep(s) {
    const t = this.msPerStep / 1000
    const Fspring = -s.k * (s.pos - s.dest)
    const Fdamper = -s.b * s.v
    const a = Fspring + Fdamper
    s.v += a * t
    s.pos += s.v * t
  }

  _springIsDone(s) {
    return Math.abs(s.v) < 0.3 && Math.abs(s.dest - s.pos) < 0.3
  }

  _createDigits(count) {
    this.container.innerHTML = ''
    this.digits = []

    const { digitHeight, digitWidth, fontSize, fontWeight, color } = this.options

    for (let i = 0; i < count; i++) {
      const digitEl = document.createElement('div')
      digitEl.className = 'spring-digit'
      digitEl.style.width = `${digitWidth}px`
      digitEl.style.height = `${digitHeight}px`

      const wrapper = document.createElement('div')
      wrapper.className = 'spring-digit-wrapper'

      for (let n = 0; n <= 9; n++) {
        const span = document.createElement('span')
        span.textContent = n
        span.style.height = `${digitHeight}px`
        span.style.fontSize = `${fontSize}px`
        span.style.fontWeight = fontWeight
        span.style.color = color
        wrapper.appendChild(span)
      }

      digitEl.appendChild(wrapper)
      this.container.appendChild(digitEl)

      this.digits.push({
        wrapper,
        y: this._spring(0),
        opacity: this._spring(1, 200, 25),
      })
    }
  }

  _render = (now) => {
    if (this.animatedUntil === null) this.animatedUntil = now

    const steps = Math.floor((now - this.animatedUntil) / this.msPerStep)
    this.animatedUntil += steps * this.msPerStep

    let stillAnimating = false

    for (const d of this.digits) {
      for (let i = 0; i < steps; i++) {
        this._springStep(d.y)
        this._springStep(d.opacity)
      }

      if (this._springIsDone(d.y)) {
        d.y.pos = d.y.dest
        d.y.v = 0
      } else {
        stillAnimating = true
      }

      if (this._springIsDone(d.opacity)) {
        d.opacity.pos = d.opacity.dest
        d.opacity.v = 0
      } else {
        stillAnimating = true
      }

      const blur = Math.min(Math.abs(d.y.v) / 600, 5)
      const opacity = Math.max(0, Math.min(1, d.opacity.pos))

      d.wrapper.style.transform = `translateY(${d.y.pos}px)`
      d.wrapper.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none'
      d.wrapper.style.opacity = opacity
    }

    if (stillAnimating) {
      this.rafId = requestAnimationFrame(this._render)
    } else {
      this.rafId = null
      this.animatedUntil = null
    }
  }

  _scheduleRender() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this._render)
    }
  }

  _setDigit(index, targetDigit) {
    const d = this.digits[index]
    if (!d) return

    const targetY = -targetDigit * this.options.digitHeight
    if (Math.abs(d.y.dest - targetY) < 0.1) return

    d.opacity.dest = 0.3
    setTimeout(() => {
      d.y.dest = targetY
      d.opacity.dest = 1
      this._scheduleRender()
    }, 80)

    this._scheduleRender()
  }

  _updateDisplay(num, animate = true) {
    const str = String(num)

    if (str.length !== this.digits.length) {
      this._createDigits(str.length)
      for (let i = 0; i < str.length; i++) {
        const targetY = -parseInt(str[i]) * this.options.digitHeight
        this.digits[i].y.pos = targetY
        this.digits[i].y.dest = targetY
      }
    }

    if (animate) {
      for (let i = 0; i < str.length; i++) {
        this._setDigit(i, parseInt(str[i]))
      }
    }
  }

  // 公开 API
  setValue(value) {
    this.currentValue = value
    this._updateDisplay(value)
  }

  getValue() {
    return this.currentValue
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    this.container.innerHTML = ''
    this.digits = []
  }
}

// 支持 ES Module 和普通引入
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpringNumber
}
