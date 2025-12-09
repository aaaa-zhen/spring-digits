class CountdownTimer {
  constructor() {
    this.digits = {
      minTens: document.querySelector('[data-digit="min-tens"] .digit-wrapper'),
      minOnes: document.querySelector('[data-digit="min-ones"] .digit-wrapper'),
      secTens: document.querySelector('[data-digit="sec-tens"] .digit-wrapper'),
      secOnes: document.querySelector('[data-digit="sec-ones"] .digit-wrapper'),
    };

    this.digitHeight = 56; // 每个数字的高度
    this.currentTime = 0;
    this.isRunning = false;
    this.intervalId = null;

    this.initControls();
    this.setTime(65); // 默认 1:05
  }

  initControls() {
    document.getElementById('startBtn').addEventListener('click', () => {
      if (this.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.reset();
    });
  }

  setTime(totalSeconds) {
    this.currentTime = totalSeconds;
    this.updateDisplay(false); // 初始化时不用动画
  }

  updateDisplay(animate = true) {
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = this.currentTime % 60;

    const minTens = Math.floor(minutes / 10);
    const minOnes = minutes % 10;
    const secTens = Math.floor(seconds / 10);
    const secOnes = seconds % 10;

    this.animateDigit(this.digits.minTens, minTens, animate, 0);
    this.animateDigit(this.digits.minOnes, minOnes, animate, 0.02);
    this.animateDigit(this.digits.secTens, secTens, animate, 0.04);
    this.animateDigit(this.digits.secOnes, secOnes, animate, 0.06);
  }

  animateDigit(wrapper, targetDigit, animate, delay) {
    const targetY = -targetDigit * this.digitHeight;

    // 获取当前位置
    const currentY = gsap.getProperty(wrapper, 'y') || 0;
    const currentDigit = Math.round(-currentY / this.digitHeight);

    // 如果数字没变化，不执行动画
    if (currentDigit === targetDigit) return;

    if (animate) {
      wrapper.classList.add('animating');

      gsap.to(wrapper, {
        y: targetY,
        duration: 0.5,
        delay: delay,
        ease: 'back.out(1.2)', // 弹性效果，更自然
        onComplete: () => {
          wrapper.classList.remove('animating');
        }
      });
    } else {
      gsap.set(wrapper, { y: targetY });
    }
  }

  start() {
    if (this.currentTime <= 0) return;

    this.isRunning = true;
    document.getElementById('startBtn').textContent = 'Pause';

    this.intervalId = setInterval(() => {
      if (this.currentTime > 0) {
        this.currentTime--;
        this.updateDisplay(true);

        if (this.currentTime === 0) {
          this.pause();
          this.onComplete();
        }
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    document.getElementById('startBtn').textContent = 'Start';

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    const inputTime = parseInt(document.getElementById('timeInput').value) || 65;
    this.setTime(inputTime);
  }

  onComplete() {
    // 完成时的动画效果
    gsap.to('.timer-card', {
      scale: 1.05,
      duration: 0.3,
      yoyo: true,
      repeat: 3,
      ease: 'power2.inOut'
    });
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new CountdownTimer();
});
