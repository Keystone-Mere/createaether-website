import type {
    ExperienceStateData
} from '../ExperienceState';

import type {
    ParticleSettings
} from '../models/Experience';

import type {
    RuntimeEvents
} from '../RuntimeEvents';

import type {
    CanvasRenderable,
    CanvasRenderFrame
} from '../rendering/CanvasRenderer';

import {
    CanvasRenderer
} from '../rendering/CanvasRenderer';

import type {
    VisualEffect,
    VisualEffectCategory
} from './VisualEffect';

interface Particle {
    x: number;
    y: number;

    velocityX: number;
    velocityY: number;

    radius: number;
    opacity: number;

    age: number;
    lifetime: number;
}

const defaultParticleSettings: ParticleSettings = {
    count: 42,
    colour: '#bfdbfe',
    glow: 5,

    minRadius: 1,
    maxRadius: 3.5,

    minSpeed: 5,
    maxSpeed: 15,

    drift: 4,

    minOpacity: 0.35,
    maxOpacity: 0.9,

    minLifetime: 5,
    maxLifetime: 12
};

export class CanvasParticleEffect
    implements VisualEffect, CanvasRenderable {

    public readonly id = 'canvas-particles';

    public readonly name = 'Canvas Particles';

    public readonly description =
        'Renders experience-configured particles through the Canvas renderer.';

    public readonly version = '0.21.1';

    public readonly category:
        VisualEffectCategory = 'particles';

    public enabled = true;

    private active = true;

    private settings: ParticleSettings = {
        ...defaultParticleSettings
    };

    private unregisterRenderer:
        (() => void) | null = null;

    private unsubscribeExperience:
        (() => void) | null = null;

    private unsubscribeSettings:
        (() => void) | null = null;

    private readonly particles: Particle[] = [];

    constructor(
        private readonly renderer: CanvasRenderer,
        private readonly events: RuntimeEvents
    ) {}

    public initialise(): void {
        if (!this.unregisterRenderer) {
            this.unregisterRenderer =
                this.renderer.register(this);
        }

        if (!this.unsubscribeExperience) {
            this.unsubscribeExperience =
                this.events.on(
                    'experience:loaded',
                    ({ experience }) => {
                        this.applySettings(
                            experience.particles
                        );
                    }
                );
        }

        if (!this.unsubscribeSettings) {
            this.unsubscribeSettings =
                this.events.on(
                    'particles:settings-changed',
                    ({ settings }) => {
                        this.applySettings(settings);
                    }
                );
        }
    }

    public start(): void {
        this.active = true;
        this.renderer.start();
    }

    public update(
        state: ExperienceStateData
    ): void {
        this.active =
            state.atmosphere.particles;
    }

    public render(
        frame: CanvasRenderFrame
    ): void {
        if (!this.active) {
            return;
        }

        const {
            context,
            width,
            height,
            deltaTime
        } = frame;

        if (width <= 1 || height <= 1) {
            return;
        }

        this.ensureParticleCount(
            width,
            height
        );

        const deltaSeconds =
            Math.min(deltaTime / 1000, 0.1);

        for (const particle of this.particles) {
            this.updateParticle(
                particle,
                deltaSeconds,
                width,
                height
            );

            this.drawParticle(
                context,
                particle
            );
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

    private applySettings(
        settings: ParticleSettings
    ): void {
        this.settings = {
            ...settings
        };

        this.particles.length = 0;
    }

    private ensureParticleCount(
        width: number,
        height: number
    ): void {
        while (
            this.particles.length
            > this.settings.count
        ) {
            this.particles.pop();
        }

        while (
            this.particles.length
            < this.settings.count
        ) {
            this.particles.push(
                this.createParticle(
                    width,
                    height,
                    true
                )
            );
        }
    }

private createParticle(
    width: number,
    height: number,
    distributeAcrossScene = false
): Particle {
    const lifetime =
        this.randomBetween(
            this.settings.minLifetime,
            this.settings.maxLifetime
        );

    const isRain =
        this.settings.preset === 'storm-rain';

    return {
        x: this.randomBetween(
            0,
            width
        ),

        y: distributeAcrossScene
            ? this.randomBetween(0, height)
            : isRain
                ? -this.randomBetween(4, 40)
                : height + this.randomBetween(4, 40),

        velocityX:
            this.randomBetween(
                -this.settings.drift,
                this.settings.drift
            ),

        velocityY: isRain
            ? this.randomBetween(
                this.settings.minSpeed,
                this.settings.maxSpeed
            )
            : -this.randomBetween(
                this.settings.minSpeed,
                this.settings.maxSpeed
            ),

        radius:
            this.randomBetween(
                this.settings.minRadius,
                this.settings.maxRadius
            ),

        opacity:
            this.randomBetween(
                this.settings.minOpacity,
                this.settings.maxOpacity
            ),

        age: distributeAcrossScene
            ? this.randomBetween(0, lifetime)
            : 0,

        lifetime
    };
}
    private updateParticle(
        particle: Particle,
        deltaSeconds: number,
        width: number,
        height: number
    ): void {
        particle.age += deltaSeconds;

        particle.x +=
            particle.velocityX
            * deltaSeconds;

        particle.y +=
            particle.velocityY
            * deltaSeconds;

        const expired =
            particle.age >= particle.lifetime;

        const isRain =
            this.settings.preset === 'storm-rain';

        const outsideScene =
            (isRain
                ? particle.y > height + 40
                : particle.y < -40)
            || particle.x < -40
            || particle.x > width + 40;

        if (expired || outsideScene) {
            Object.assign(
                particle,
                this.createParticle(
                    width,
                    height
                )
            );
        }
    }
    private drawParticle(
        context: CanvasRenderingContext2D,
        particle: Particle
    ): void {
        const progress =
            particle.age / particle.lifetime;

        const fade =
            Math.sin(
                Math.PI
                * Math.min(
                    Math.max(progress, 0),
                    1
                )
            );

        const alpha =
            particle.opacity * fade;

        if (alpha <= 0) {
            return;
        }

        context.save();

        context.globalAlpha = alpha;

        context.shadowColor =
            this.settings.colour;

        context.shadowBlur =
            particle.radius
            * this.settings.glow;

        context.fillStyle =
            this.settings.colour;

        context.beginPath();

        context.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );

        context.fill();
        context.restore();
    }

    private randomBetween(
        minimum: number,
        maximum: number
    ): number {
        return minimum
            + Math.random()
            * (maximum - minimum);
    }
}
