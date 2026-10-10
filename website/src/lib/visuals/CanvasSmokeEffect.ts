import type { ExperienceStateData } from '../ExperienceState';
import type { VisualEffect } from './VisualEffect';

/** A scene-relative incense plume. Independent canvas avoids clearing other particles. */
export class CanvasSmokeEffect implements VisualEffect {
    readonly id = 'incense-smoke';
    readonly name = 'Incense smoke';
    readonly description = 'Soft wisps rising from the original Temple incense bowl';
    readonly version = '1.0.0';
    readonly category = 'particles' as const;
    enabled = true;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private textures: HTMLCanvasElement[] = [];
    private observer: ResizeObserver | null = null;
    private frame = 0;
    private time = 0;
    private previous = 0;
    private amount = 35;
    private visible = false;
    private running = false;
    private motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    constructor(private stage: HTMLElement) {}
    initialise() {
        const scene = this.stage.querySelector<HTMLElement>('.preview-scene');
        if (!scene || !this.ctx) return;
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.className = 'smoke-canvas';
        this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';
        scene.append(this.canvas);
        for (let variant = 0; variant < 3; variant++) {
            const texture = document.createElement('canvas');
            texture.width = texture.height = 96;
            const ctx = texture.getContext('2d')!;
            for (let i = 0; i < 7; i++) {
                const x = 48 + Math.sin(i * 2.4 + variant) * 15;
                const y = 48 + Math.cos(i * 1.8 + variant) * 18;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
                gradient.addColorStop(0, 'rgba(213,207,195,.20)');
                gradient.addColorStop(.5, 'rgba(213,207,195,.08)');
                gradient.addColorStop(1, 'rgba(213,207,195,0)');
                ctx.fillStyle = gradient; ctx.fillRect(0, 0, 96, 96);
            }
            this.textures.push(texture);
        }
        this.observer = new ResizeObserver(() => { this.resize(); this.draw(); });
        this.observer.observe(scene);
        this.resize();
        document.addEventListener('visibilitychange', this.visibility);
        this.motion.addEventListener('change', this.visibility);
    }
    private resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
        this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }
    update(state: ExperienceStateData) {
        this.visible = state.smoke?.enabled === true;
        const value = state.smoke?.amount;
        this.amount = typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 35;
        this.draw(); this.schedule();
    }
    private eligible() { return this.visible && this.amount > 0 && this.stage.dataset.scene === 'temple'; }
    private draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        const w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        if (!this.eligible() || !this.textures.length) return;
        // Bowl centre at x=24%, rim at y=66% in the original 16:9 image.
        for (let i = 0; i < 48; i++) {
            const age = ((this.time / 9 + i / 48) % 1);
            const curl = Math.sin(age * 11 + this.time * .32) * age * .013;
            const x = w * (.24 + curl + Math.sin(age * 22 + i * .12) * age * .004);
            const y = h * (.66 - age * .33);
            const size = w * (.009 + age * .044);
            const fade = Math.min(1, age * 14) * Math.pow(1 - age, 1.8);
            ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(age * 8 + i) * .6);
            ctx.globalAlpha = fade * (this.amount / 100) * .7;
            ctx.drawImage(this.textures[i % 3], -size / 2, -size * .8, size, size * 1.6);
            ctx.restore();
        }
    }
    private tick = (now: number) => {
        this.frame = 0;
        if (this.previous) this.time += Math.min((now - this.previous) / 1000, .05);
        this.previous = now;
        this.draw(); this.schedule();
    };
    private schedule() {
        if (this.running && this.eligible() && !document.hidden && !this.motion.matches && !this.frame) this.frame = requestAnimationFrame(this.tick);
        else if (!this.running || !this.eligible() || document.hidden || this.motion.matches) {
            cancelAnimationFrame(this.frame); this.frame = 0; this.previous = 0;
        }
    }
    private visibility = () => { this.draw(); this.schedule(); };
    start() { this.running = true; this.schedule(); }
    stop() { this.running = false; this.schedule(); this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    destroy() {
        this.stop(); this.observer?.disconnect(); this.canvas.remove(); this.textures = [];
        document.removeEventListener('visibilitychange', this.visibility);
        this.motion.removeEventListener('change', this.visibility);
    }
}
