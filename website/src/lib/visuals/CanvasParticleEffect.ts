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

  public readonly version = "0.21.1";

  public readonly category: VisualEffectCategory = "particles";

  public enabled = true;

  private active = true;

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

    const { context, width, height, deltaTime } = frame;

    if (width <= 1 || height <= 1) {
      return;
    }

    this.ensureParticleCount(width, height);

    const deltaSeconds = Math.min(deltaTime / 1000, 0.1);

    for (const particle of this.particles) {
      this.updateParticle(particle, deltaSeconds, width, height);

      this.drawParticle(context, particle);
    }
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
  }

  private ensureParticleCount(width: number, height: number): void {
    while (this.particles.length > this.settings.count) {
      this.particles.pop();
    }

    while (this.particles.length < this.settings.count) {
      this.particles.push(this.createParticle(width, height, true));
    }
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
      if (motion === "rise") y = height + this.randomBetween(4, 40);
      if (motion === "rain" || motion === "snow")
        y = -this.randomBetween(4, 40);
      if (motion === "flow") x = -this.randomBetween(4, 40);
    }

    if (motion === "wander") {
      velocityY = this.randomBetween(-speed, speed);
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

    particle.x += particle.velocityX * deltaSeconds;
    particle.y += particle.velocityY * deltaSeconds;

    if (motion === "wander") {
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

    if (expired || outsideScene || outsideFireworkSky) {
      Object.assign(particle, this.createParticle(width, height));
    }
  }
  private drawParticle(
    context: CanvasRenderingContext2D,
    particle: Particle,
  ): void {
    const progress = particle.age / particle.lifetime;

    const fade = Math.sin(Math.PI * Math.min(Math.max(progress, 0), 1));

    const alpha = particle.opacity * fade;

    if (alpha <= 0) {
      return;
    }

    context.save();

    context.globalAlpha = alpha;

    context.shadowColor = this.settings.colour;

    context.shadowBlur = particle.radius * this.settings.glow;

    context.fillStyle = this.settings.colour;
    context.strokeStyle = this.settings.colour;

    const motion = this.resolveMotion();

    if (motion === "rain") {
      context.lineWidth = Math.max(0.5, particle.radius);
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(
        particle.x - particle.velocityX * 0.45,
        particle.y - particle.velocityY * 1.8,
      );
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
