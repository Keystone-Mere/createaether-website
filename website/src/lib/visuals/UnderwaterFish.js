// Each fish is an object. Positions are fractions of the underwater window.
export class UnderwaterFish {
  constructor(canvas, count = 8, species = 'school', speed = 1) {
    this.species = species;
    this.speedMultiplier = speed;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.time = 0;
    this.frame = 0;
    this.fish = Array.from({ length: count }, (_, i) => ({
      x: -0.08 - i * 0.045,
      y: species === 'school' ? 0.44 + Math.random() * 0.12 : 0.3 + Math.random() * 0.35,
      speed: species === 'school' ? 0.032 + Math.random() * 0.003 : 0.018 + Math.random() * 0.007,
      size: species === 'school' ? 0.012 + Math.random() * 0.012 : species === 'shark' ? 0.09 : 0.075,
      phase: Math.random() * Math.PI * 2,
      delay: i * 1.5,
      direction: 1,
    }));
    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      this.draw();
    };
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);
    this.resize();
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = null;
    this.frame = requestAnimationFrame(this.tick);
  }
  pause() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }
  // Arrow functions keep `this` pointing at our animation object.
  tick = (now) => {
    if (!this.running) return;
    const dt = this.last === null ? 0 : Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    for (const fish of this.fish) {
      if (this.time < fish.delay) continue;
      fish.x += fish.speed * this.speedMultiplier * fish.direction * dt;
      // Turn offscreen, avoiding an abrupt flip in the middle of the view.
      if (fish.x > 1.12) fish.direction = -1;
      if (fish.x < -0.12 && fish.direction < 0) fish.direction = 1;
    }
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };
  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const fish of this.fish) {
      if (this.time < fish.delay) continue;
      const length = w * fish.size;
      const phase = this.species === 'school' ? fish.phase * 0.15 : fish.phase;
      const drift = Math.sin(this.time * 0.35 + phase) * h * 0.035;
      const tail = Math.sin(this.time * 5 + fish.phase) * length * 0.12;
      ctx.save();
      ctx.translate(fish.x * w, fish.y * h + drift);
      ctx.scale(fish.direction, 1);
      ctx.globalAlpha = Math.min(0.8, 0.45 + fish.size * 10);
      if (this.species !== 'school') {
        this.drawCreature(ctx, length, fish.phase);
        ctx.restore();
        continue;
      }
      const gradient = ctx.createLinearGradient(0, -length * 0.2, 0, length * 0.2);
      gradient.addColorStop(0, '#88b9bd');
      gradient.addColorStop(1, '#245b68');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, length * 0.5, length * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-length * 0.42, 0);
      ctx.lineTo(-length * 0.8, -length * 0.25 + tail);
      ctx.lineTo(-length * 0.8, length * 0.25 + tail);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#102f3a';
      ctx.beginPath();
      ctx.arc(length * 0.3, -length * 0.035, Math.max(0.6, length * 0.025), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  // Different shapes and motion give each creature its own character.
  drawCreature(ctx, length, phase) {
    const l = length;
    const pulse = Math.sin(this.time * 1.7 + phase);
    ctx.fillStyle = this.species === 'shark' ? '#102f38' : '#38616a';
    ctx.beginPath();
    if (this.species === 'shark') {
      // Side profile: pointed nose, dorsal fin and asymmetric tail.
      ctx.moveTo(l * 0.58, 0);
      ctx.quadraticCurveTo(l * 0.3, -l * 0.17, -l * 0.1, -l * 0.1);
      ctx.lineTo(-l * 0.17, -l * 0.35);
      ctx.lineTo(-l * 0.32, -l * 0.09);
      ctx.lineTo(-l * 0.57, -l * 0.03);
      ctx.lineTo(-l * 0.83, -l * 0.28 + pulse * l * 0.035);
      ctx.lineTo(-l * 0.73, 0);
      ctx.lineTo(-l * 0.81, l * 0.17 + pulse * l * 0.035);
      ctx.lineTo(-l * 0.55, l * 0.035);
      ctx.lineTo(-l * 0.12, l * 0.12);
      ctx.lineTo(l * 0.05, l * 0.28);
      ctx.lineTo(l * 0.1, l * 0.1);
      ctx.quadraticCurveTo(l * 0.4, l * 0.1, l * 0.58, 0);
    } else {
      // A ray viewed at an angle, with gently undulating wings.
      const wing = l * (0.32 + pulse * 0.055);
      ctx.moveTo(l * 0.48, 0);
      ctx.quadraticCurveTo(l * 0.15, -l * 0.15, -l * 0.15, -wing);
      ctx.quadraticCurveTo(-l * 0.38, -l * 0.13, -l * 0.4, 0);
      ctx.quadraticCurveTo(-l * 0.38, l * 0.13, -l * 0.15, wing);
      ctx.quadraticCurveTo(l * 0.15, l * 0.15, l * 0.48, 0);
    }
    ctx.closePath();
    ctx.fill();
    if (this.species === 'ray') {
      ctx.strokeStyle = '#294c55';
      ctx.lineWidth = Math.max(1, l * 0.025);
      ctx.beginPath();
      ctx.moveTo(-l * 0.36, 0);
      ctx.quadraticCurveTo(-l * 0.7, pulse * l * 0.08, -l, pulse * l * 0.12);
      ctx.stroke();
    }
  }
  destroy() {
    this.pause();
    this.observer.disconnect();
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
