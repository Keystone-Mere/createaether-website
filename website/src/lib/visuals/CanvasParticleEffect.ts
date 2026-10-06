import type { ExperienceStateData } from "../ExperienceState";

import type { ParticleSettings } from "../models/Experience";

import type { RuntimeEvents } from "../RuntimeEvents";

import type {
  CanvasRenderable,
  CanvasRenderFrame,
} from "../rendering/CanvasRenderer";

import { CanvasRenderer } from "../rendering/CanvasRenderer";

import type { VisualEffect, VisualEffectCategory } from "./VisualEffect";

interface Particle {
  x: number;
  y: number;

  velocityX: number;
  velocityY: number;

  radius: number;
  opacity: number;

  age: number;
  lifetime: number;
  phase: number;
  heading: number;
  targetHeading: number;
  turnTimer: number;
  flightSpeed: number;
  pulseSpeed: number;
}

const defaultParticleSettings: ParticleSettings = {
  preset: "temple-embers",
  motion: "rise",
  count: 42,
  colour: "#bfdbfe",
  glow: 5,

  minRadius: 1,
  maxRadius: 3.5,

  minSpeed: 5,
  maxSpeed: 15,

  drift: 4,

  minOpacity: 0.35,
  maxOpacity: 0.9,

  minLifetime: 5,
  maxLifetime: 12,
};

export class CanvasParticleEffect implements VisualEffect, CanvasRenderable {
  public readonly id = "canvas-particles";

  public readonly name = "Canvas Particles";

  public readonly description =
    "Renders experience-configured particles through the Canvas renderer.";

  public readonly version = "0.21.2";

  public readonly category: VisualEffectCategory = "particles";

  public enabled = true;

  private active = true;

  private oceanTime = 0;

  private settings: ParticleSettings = {
    ...defaultParticleSettings,
  };

  private unregisterRenderer: (() => void) | null = null;

  private unsubscribeExperience: (() => void) | null = null;

  private unsubscribeSettings: (() => void) | null = null;

  private readonly particles: Particle[] = [];

  constructor(
    private readonly renderer: CanvasRenderer,
    private readonly events: RuntimeEvents,
  ) {}

  public initialise(): void {
    if (!this.unregisterRenderer) {
      this.unregisterRenderer = this.renderer.register(this);
    }

    if (!this.unsubscribeExperience) {
      this.unsubscribeExperience = this.events.on(
        "experience:loaded",
        ({ experience }) => {
          this.applySettings(experience.particles);
        },
      );
    }

    if (!this.unsubscribeSettings) {
      this.unsubscribeSettings = this.events.on(
        "particles:settings-changed",
        ({ settings }) => {
          this.applySettings(settings);
        },
      );
    }
  }

  public start(): void {
    this.active = true;
    this.renderer.start();
  }

  public update(state: ExperienceStateData): void {
    this.active = state.atmosphere.particles;
  }

  public render(frame: CanvasRenderFrame): void {
    if (!this.active) {
      return;
    }

    const { context, deltaTime } = frame;
    // Keep simulation coordinates stable when the same canvas enters full screen.
    const width = 960;
    const height = 540;

    if (frame.width <= 1 || frame.height <= 1) {
      return;
    }

    context.save();
    context.scale(frame.width / width, frame.height / height);
    this.ensureParticleCount(width, height);

    const deltaSeconds = Math.min(deltaTime / 1000, 0.1);

    if (this.settings.preset === "ocean-spray" && this.resolveMotion() === "flow") {
      this.renderOceanWaves(context, deltaSeconds, width, height);
      context.restore();
      return;
    }

    if (this.isWindowSnow()) {
      this.clipChristmasWindow(context, width, height);
    }

    if (this.isStormRain()) {
      this.clipStormExterior(context, width, height);
    }

    for (const particle of this.particles) {
      this.updateParticle(particle, deltaSeconds, width, height);

      this.drawParticle(context, particle);
    }
    context.restore();
  }

  public stop(): void {
    this.active = false;
  }

  public destroy(): void {
    this.unsubscribeExperience?.();
    this.unsubscribeExperience = null;

    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;

    this.unregisterRenderer?.();
    this.unregisterRenderer = null;

    this.particles.length = 0;
    this.active = false;
  }

  private applySettings(settings: ParticleSettings): void {
    this.settings = {
      ...settings,
    };

    this.particles.length = 0;
    this.oceanTime = 0;
  }

  private ensureParticleCount(width: number, height: number): void {
    while (this.particles.length > this.settings.count) {
      this.particles.pop();
    }

    while (this.particles.length < this.settings.count) {
      this.particles.push(this.createParticle(width, height, true));
    }
  }

  private isStormRain(): boolean {
    return this.settings.preset === "storm-rain" && this.resolveMotion() === "rain";
  }

  private clipStormExterior(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    // Open balcony view; keep rain beyond the canopy and foreground rail.
    const opening = [[0, 0.08], [0.23, 0], [1, 0],
      [1, 1], [0.69, 1], [0, 0.86]];
    context.beginPath();
    opening.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x * width, y * height);
      else context.lineTo(x * width, y * height);
    });
    context.closePath();
    context.clip();
  }

  private isWindowSnow(): boolean {
    return this.settings.preset === "christmas-snow" && this.resolveMotion() === "snow";
  }

  private clipChristmasWindow(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    // Glass panes in the current Christmas cover. Leave the wooden frame,
    // tree and armchair in front of the snowfall.
    const panes = [
      [[0.233, 0.015], [0.438, 0.015], [0.438, 0.465],
       [0.270, 0.465], [0.233, 0.320]],
      [[0.460, 0.027], [0.562, 0.027], [0.562, 0.218], [0.460, 0.218]],
      [[0.460, 0.239], [0.562, 0.239], [0.562, 0.405],
       [0.530, 0.415], [0.520, 0.465], [0.460, 0.465]],
    ];
    context.beginPath();
    for (const pane of panes) {
      pane.forEach(([x, y], index) => {
        if (index === 0) context.moveTo(x * width, y * height);
        else context.lineTo(x * width, y * height);
      });
      context.closePath();
    }
    context.clip();
  }

  private renderOceanWaves(
    context: CanvasRenderingContext2D,
    deltaSeconds: number,
    width: number,
    height: number,
  ): void {
    // The current Ocean cover's horizon is at about 48% of its height.
    // Keep the identical clip and wave geometry in editor and full screen.
    const horizon = height * 0.485;
    const waterHeight = height - horizon;
    this.oceanTime += deltaSeconds;
    context.save();
    context.beginPath();
    context.rect(0, horizon, width, waterHeight);
    context.clip();
    context.strokeStyle = this.settings.colour;
    context.shadowColor = this.settings.colour;
    context.lineCap = "round";

    for (let index = 0; index < this.particles.length; index++) {
      const particle = this.particles[index];
      // Ten shared wave bands rather than independently floating dots.
      const depth = ((index % 10) + 0.65) / 10.8;
      const perspective = 0.35 + depth * 1.5;
      const speed = Math.abs(particle.velocityX) * (0.7 + depth);
      particle.x = (particle.x + speed * deltaSeconds) % width;
      particle.age = (particle.age + deltaSeconds) % particle.lifetime;
      const fade = Math.sin(Math.PI * particle.age / particle.lifetime);
      context.globalAlpha = particle.opacity * fade * (0.55 + depth * 0.45);
      context.lineWidth = Math.max(0.35, particle.radius * 0.45 * perspective);
      context.shadowBlur = Math.min(12, this.settings.glow * perspective * 0.35);
      const baseY = horizon + depth * waterHeight;
      const amplitude = (1 + this.settings.drift * 0.28) * perspective;
      const wavelength = 100 + depth * 170;
      const travellingPhase = this.oceanTime *
        ((this.settings.minSpeed + this.settings.maxSpeed) / 2 + this.settings.drift) * 0.025;
      const waveY = (x: number): number => baseY +
        Math.sin(x / wavelength * Math.PI * 2 - travellingPhase + index % 10) * amplitude;
      const halfLength = Math.max(2, particle.radius * 3.5) * perspective;
      const left = particle.x - halfLength;
      const right = particle.x + halfLength;
      context.beginPath();
      context.moveTo(left, waveY(left));
      context.quadraticCurveTo(particle.x, waveY(particle.x), right, waveY(right));
      context.stroke();
    }
    context.restore();
  }

  private resolveMotion(): NonNullable<ParticleSettings["motion"]> {
    if (this.settings.motion) {
      return this.settings.motion;
    }

    if (this.settings.preset === "storm-rain") return "rain";
    if (this.settings.preset === "christmas-snow") return "snow";
    if (this.settings.preset === "forest-fireflies") return "wander";
    if (this.settings.preset === "ocean-spray") return "flow";
    if (this.settings.preset === "festival-fireworks") return "burst";

    return "rise";
  }

  private createParticle(
    width: number,
    height: number,
    distributeAcrossScene = false,
  ): Particle {
    const lifetime = this.randomBetween(
      this.settings.minLifetime,
      this.settings.maxLifetime,
    );
    const motion = this.resolveMotion();
    const speed = this.randomBetween(
      this.settings.minSpeed,
      this.settings.maxSpeed,
    );
    const angle = this.randomBetween(0, Math.PI * 2);

    let x = this.randomBetween(0, width);
    let y = this.randomBetween(0, height);
    let velocityX = this.randomBetween(
      -this.settings.drift,
      this.settings.drift,
    );
    let velocityY = -speed;

    if (!distributeAcrossScene) {
      if (motion === "rise") {
        // Spawn inside the scene so short-lived embers remain visible.
        x = this.randomBetween(width * 0.05, width * 0.95);
        y = this.randomBetween(height * 0.55, height * 0.95);
      }
      // Short lifetimes and slow speeds must not strand every particle off-screen.
      // Distribute replacements as well as initial particles throughout the scene.
      if (motion === "rain" || motion === "snow")
        y = this.randomBetween(0, height);
      if (motion === "flow") x = this.randomBetween(0, width);
    }

    if (motion === "wander") {
      velocityX = Math.cos(angle) * speed;
      velocityY = Math.sin(angle) * speed;
    } else if (motion === "flow") {
      velocityX = speed + this.settings.drift;
      velocityY = this.randomBetween(-1, 1);
    } else if (motion === "rain" || motion === "snow") {
      velocityY = speed;
    } else if (motion === "burst") {
      // Fireworks begin across the sky, clear of the central lighting orb.
      x = this.randomBetween(width * 0.15, width * 0.85);
      y = this.randomBetween(height * 0.08, height * 0.2);
      velocityX = Math.cos(angle) * speed;
      velocityY = Math.sin(angle) * speed;
    }

    if (this.isStormRain()) {
      x = this.randomBetween(-width * 0.04, width);
      y = distributeAcrossScene ? this.randomBetween(0, height) : -8;
      // Faster fall with subtle depth variation and a consistent breeze.
      velocityY = speed * this.randomBetween(2.7, 3.6);
      velocityX = velocityY * 0.06 + this.randomBetween(-1, 1) * this.settings.drift * 0.25;
    }

    if (this.isWindowSnow()) {
      x = Math.random() < 0.67
        ? this.randomBetween(width * 0.233, width * 0.438)
        : this.randomBetween(width * 0.460, width * 0.562);
      y = distributeAcrossScene
        ? this.randomBetween(height * 0.02, height * 0.465)
        : height * 0.015;
      velocityX *= 0.25;
    }

    return {
      x,
      y,
      velocityX,
      velocityY,

      radius: this.randomBetween(
        this.settings.minRadius,
        this.settings.maxRadius,
      ),

      opacity: this.randomBetween(
        this.settings.minOpacity,
        this.settings.maxOpacity,
      ),

      age: distributeAcrossScene ? this.randomBetween(0, lifetime) : 0,

      lifetime,
      phase: this.randomBetween(0, Math.PI * 2),
      heading: angle,
      targetHeading: angle,
      turnTimer: this.randomBetween(0.4, 2.4),
      flightSpeed: speed,
      pulseSpeed: this.randomBetween(0.8, 1.6),
    };
  }
  private updateParticle(
    particle: Particle,
    deltaSeconds: number,
    width: number,
    height: number,
  ): void {
    particle.age += deltaSeconds;

    const motion = this.resolveMotion();

    if (this.settings.preset === "forest-fireflies" && motion === "wander") {
      particle.turnTimer -= deltaSeconds;
      if (particle.turnTimer <= 0) {
        particle.targetHeading = particle.heading + this.randomBetween(-1.8, 1.8);
        particle.turnTimer = this.randomBetween(0.7, 2.8);
      }
      // Smooth random turns rather than new random jitter on every frame.
      const turn = Math.atan2(
        Math.sin(particle.targetHeading - particle.heading),
        Math.cos(particle.targetHeading - particle.heading),
      );
      particle.heading += turn * (1 - Math.exp(-1.8 * deltaSeconds));
      const flutter = Math.sin(particle.age * 5.5 + particle.phase);
      const speed = particle.flightSpeed * (0.65 + 0.7 * (0.5 + 0.5 * flutter));
      const heading = particle.heading + flutter * this.settings.drift * 0.035;
      particle.velocityX = Math.cos(heading) * speed;
      particle.velocityY = Math.sin(heading) * speed;
    }

    particle.x += particle.velocityX * deltaSeconds;
    particle.y += particle.velocityY * deltaSeconds;

    if (motion === "wander" && this.settings.preset !== "forest-fireflies") {
      particle.x +=
        Math.sin(particle.age * 1.8 + particle.phase) *
        this.settings.drift *
        deltaSeconds;
      particle.y +=
        Math.cos(particle.age * 1.3 + particle.phase) *
        this.settings.drift *
        0.6 *
        deltaSeconds;
    } else if (motion === "flow") {
      particle.y +=
        Math.sin(particle.age * 0.9 + particle.phase) *
        this.settings.drift *
        0.35 *
        deltaSeconds;
    } else if (motion === "snow") {
      particle.x +=
        Math.sin(particle.age * 1.5 + particle.phase) *
        this.settings.drift *
        deltaSeconds;
    } else if (motion === "burst") {
      particle.velocityY += 7 * deltaSeconds;
    }

    const expired = particle.age >= particle.lifetime;

    const outsideScene =
      particle.y < -40 ||
      particle.y > height + 40 ||
      particle.x < -40 ||
      particle.x > width + 40;

    const outsideFireworkSky = motion === "burst" && particle.y > height * 0.27;
    const outsideWindow = this.isWindowSnow() &&
      (particle.y > height * 0.47 || particle.x < width * 0.225 || particle.x > width * 0.57);

    const outsideStormView = this.isStormRain() &&
      (particle.y > height + 20 || particle.x < -width * 0.05 || particle.x > width + 20);

    if (expired || outsideScene || outsideFireworkSky || outsideWindow || outsideStormView) {
      Object.assign(particle, this.createParticle(width, height));
    }
  }
  private drawParticle(
    context: CanvasRenderingContext2D,
    particle: Particle,
  ): void {
    const progress = particle.age / particle.lifetime;

    const fade = Math.sin(Math.PI * Math.min(Math.max(progress, 0), 1));

    const isFirefly = this.settings.preset === "forest-fireflies";
    // Each light has its own rhythm, independent of lifetime fading.
    const pulse = isFirefly
      ? 0.12 + 0.88 * Math.pow(
          0.5 + 0.5 * Math.sin(particle.age * particle.pulseSpeed + particle.phase), 2,
        )
      : 1;
    const alpha = particle.opacity * (this.isStormRain() ? 1 : fade) * pulse;

    if (alpha <= 0) {
      return;
    }

    context.save();

    context.globalAlpha = alpha;

    context.shadowColor = this.settings.colour;

    context.shadowBlur = particle.radius * this.settings.glow * (isFirefly ? 0.6 + 0.4 * pulse : 1);

    context.fillStyle = this.settings.colour;
    context.strokeStyle = this.settings.colour;

    const motion = this.resolveMotion();

    if (motion === "rain") {
      context.lineWidth = Math.max(0.5, particle.radius);
      context.lineCap = "round";
      // Droplet length stays short even when the user increases fall speed.
      const length = this.isStormRain() ? 3.5 + particle.radius * 1.5 : particle.velocityY * 0.1;
      const slant = particle.velocityY > 0 ? particle.velocityX / particle.velocityY : 0;
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x - slant * length, particle.y - length);
      context.stroke();
    } else if (motion === "burst") {
      context.lineWidth = Math.max(0.5, particle.radius * 0.75);
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(
        particle.x - particle.velocityX * 0.35,
        particle.y - particle.velocityY * 0.35,
      );
      context.stroke();
    } else {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private randomBetween(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }
}
