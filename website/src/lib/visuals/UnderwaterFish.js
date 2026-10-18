// Aether v5.2: image-aligned aquatic sprite prototype.
// Drop-in replacement; preserves constructor/start/pause/destroy/speedMultiplier API.
export class UnderwaterFish {
  constructor(canvas, count = 8, species = 'school', speed = 1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.species = species;
    this.speedMultiplier = speed;
    this.running = false;
    this.elapsed = 0;
    this.last = null;
    this.frame = 0;
    this.count = Math.max(1, Math.min(24, count));
    this.sprite = new Image();
    this.sprite.src = '/images/aether/fish-silver.png';
    this.sprite.onload = () => this.draw();
    this.fish = Array.from({ length: this.count }, (_, i) => ({
      x: 0.30 + (i % 4) * 0.075 + Math.floor(i / 4) * 0.016,
      y: 0.36 + Math.floor(i / 4) * 0.065 + (i % 3) * 0.015,
      depth: 0.55 + ((i * 7) % 11) / 20,
      phase: i * 1.73,
      speed: 0.010 + ((i * 3) % 7) / 1200,
    }));
    this.resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {canvas.width = width; canvas.height = height;}
      this.draw();
    };
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);
    this.resize();
  }
  // Match the *visible* image, not the fullscreen canvas's black letterbox bars.
  imageBounds() {
    const canvasRect = this.canvas.getBoundingClientRect();
    const image = document.getElementById('scene-image');
    if (!image || !image.naturalWidth || !image.naturalHeight || !canvasRect.width || !canvasRect.height)
      return { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
    const rect = image.getBoundingClientRect();
    const fit = getComputedStyle(image).objectFit;
    const intrinsic = image.naturalWidth / image.naturalHeight;
    const box = rect.width / Math.max(1, rect.height);
    let width = rect.width, height = rect.height;
    if (fit === 'contain') {
      if (intrinsic > box) height = width / intrinsic;
      else width = height * intrinsic;
    }
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const scaleX = this.canvas.width / canvasRect.width;
    const scaleY = this.canvas.height / canvasRect.height;
    const x1 = Math.max(0, (left - canvasRect.left) * scaleX);
    const y1 = Math.max(0, (top - canvasRect.top) * scaleY);
    const x2 = Math.min(this.canvas.width, (left + width - canvasRect.left) * scaleX);
    const y2 = Math.min(this.canvas.height, (top + height - canvasRect.top) * scaleY);
    return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
  }
  start() {if (this.running) return; this.running = true; this.last = null; this.frame = requestAnimationFrame(this.tick);}
  pause() {this.running = false; cancelAnimationFrame(this.frame);}
  tick = (timestamp) => {
    if (!this.running) return;
    const dt = this.last === null ? 0 : Math.min((timestamp - this.last) / 1000, 0.05);
    this.last = timestamp;
    this.elapsed += dt * Math.max(0, this.speedMultiplier);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };
  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const b = this.imageBounds();
    if (b.w < 5 || b.h < 5) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    const t = this.elapsed;
    // Shared centre keeps the school together; individual offsets keep it organic.
    const centreX = 0.47 + Math.sin(t * 0.075) * 0.25;
    const centreY = 0.44 + Math.sin(t * 0.13) * 0.07;
    for (const [i, f] of this.fish.entries()) {
      const isSchool = this.species === 'school';
      const px = isSchool ? centreX + (f.x - 0.43) * 0.7 + Math.sin(t * 0.19 + f.phase) * 0.026 : 0.5 + Math.sin(t * f.speed + f.phase) * 0.30;
      const py = isSchool ? centreY + (f.y - 0.43) * 0.8 + Math.cos(t * 0.23 + f.phase) * 0.015 : f.y + Math.sin(t * 0.16 + f.phase) * 0.045;
      const length = b.w * (isSchool ? 0.032 : this.species === 'shark' ? 0.12 : 0.095) * f.depth;
      const x = b.x + px * b.w, y = b.y + py * b.h;
      ctx.save(); ctx.translate(x, y);
      const direction = Math.cos(t * (isSchool ? 0.075 : f.speed) + (isSchool ? 0 : f.phase)) >= 0 ? 1 : -1;
      ctx.scale(direction, 1);
      ctx.rotate(Math.sin(t * 0.7 + f.phase) * 0.035);
      ctx.globalAlpha = 0.45 + 0.4 * f.depth;
      if (isSchool && this.sprite.complete && this.sprite.naturalWidth) {
        const h = length * 0.47;
        // Gentle body yaw and a subtle moving tail accent.
        ctx.drawImage(this.sprite, -length * 0.5, -h * 0.5, length, h);
      } else {
        // Existing ray/shark outlines remain placeholders for a later artwork pass.
        ctx.fillStyle = this.species === 'shark' ? '#23485a' : '#648e9c';
        ctx.beginPath();
        if (this.species === 'ray') {
          const wing = Math.sin(t * 1.4 + f.phase) * length * 0.08;
          ctx.moveTo(length * .4, 0); ctx.quadraticCurveTo(0, -length * .5 - wing, -length * .4, 0);
          ctx.quadraticCurveTo(0, length * .5 + wing, length * .4, 0);
        } else {
          ctx.moveTo(length * .5, 0);ctx.lineTo(0, -length * .13);ctx.lineTo(-length * .13,-length * .32);
          ctx.lineTo(-length * .25,-length * .1);ctx.lineTo(-length * .5,-length * .2);
          ctx.lineTo(-length * .43,0);ctx.lineTo(-length * .5,length * .2);
          ctx.lineTo(-length * .22,length * .08);ctx.lineTo(0,length * .13);
        }
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  destroy() {this.pause();this.observer.disconnect();this.sprite.onload = null;this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
