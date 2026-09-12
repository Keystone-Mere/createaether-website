import type {
    ExperienceStateData
} from '../ExperienceState';

import {
    TransitionController
} from '../runtime/TransitionController';

import {
    ColourInterpolator
} from '../runtime/ColourInterpolator';

import type {
    VisualEffect,
    VisualEffectCategory
} from './VisualEffect';

export class CssLightingEffect
    implements VisualEffect {
    public readonly id = 'css-lighting';
    public readonly name = 'CSS Lighting';
    public readonly description =
        'Controls preset-driven Studio lighting and orb illumination.';
    public readonly version = '0.23.0';
    public readonly category:
        VisualEffectCategory = 'lighting';

    public enabled = true;

    private readonly previewStage:
        Element | null;

    private readonly lightingStatus:
        Element | null;

    private readonly intensityTransition =
        new TransitionController();

    private readonly pulseTransition =
        new TransitionController();

    private readonly colourTransition =
        new TransitionController();

    private currentIntensity:
        number | null = null;

    private currentPulseDuration:
        number | null = null;

    private currentColour:
        string | null = null;

    constructor(
        previewStage: Element | null,
        lightingStatus: Element | null
    ) {
        this.previewStage = previewStage;
        this.lightingStatus = lightingStatus;
    }

    private applyIntensity(
        intensity: number
    ): void {
        if (
            !(this.previewStage instanceof HTMLElement)
        ) {
            return;
        }

        const clampedIntensity =
            Math.min(
                1,
                Math.max(0, intensity)
            );

        this.currentIntensity =
            clampedIntensity;

        this.previewStage.style.setProperty(
            '--aether-lighting-intensity',
            String(clampedIntensity)
        );

        this.previewStage.style.setProperty(
            '--aether-lighting-glow-strength',
            `${6 + clampedIntensity * 18}%`
        );

        this.previewStage.style.setProperty(
            '--aether-lighting-orb-strength',
            `${22 + clampedIntensity * 48}%`
        );

        this.previewStage.style.setProperty(
            '--aether-lighting-shadow-strength',
            `${12 + clampedIntensity * 38}%`
        );
    }

    private applyColour(
        colour: string
    ): void {
        if (
            !(this.previewStage instanceof HTMLElement)
        ) {
            return;
        }

        this.currentColour = colour;

        this.previewStage.style.setProperty(
            '--aether-lighting-colour',
            colour
        );

        this.previewStage.style.setProperty(
            '--aether-stage-ambient',
            colour
        );
    }

    private applyPulseDuration(
        duration: number
    ): void {
        if (
            !(this.previewStage instanceof HTMLElement)
        ) {
            return;
        }

        this.currentPulseDuration =
            duration;

        this.previewStage.style.setProperty(
            '--aether-lighting-pulse-duration',
            `${duration}s`
        );
    }

    public update(
        state: ExperienceStateData
    ): void {
        const lightingEnabled =
            state.atmosphere.lighting;

        const targetIntensity =
            Math.min(
                1,
                Math.max(
                    0,
                    state.lighting.intensity
                )
            );

        const pulseSpeed =
            Math.min(
                1,
                Math.max(
                    0,
                    state.lighting.speed
                )
            );

        const targetPulseDuration =
            state.lighting.pulse
                ? 8 - pulseSpeed * 5
                : 4;

        const transitionDuration =
            Math.max(
                0,
                state.transition.duration
            );

        if (
            this.previewStage instanceof HTMLElement
        ) {
            this.previewStage.classList.toggle(
                'preview-stage--lighting-disabled',
                !lightingEnabled
            );

            this.previewStage.classList.toggle(
                'preview-stage--lighting-static',
                !state.lighting.pulse
            );

            this.previewStage.dataset.lightingPreset =
                state.lighting.preset;

            const targetColour =
                state.lighting.colour;

            if (this.currentColour === null) {
                this.applyColour(
                    targetColour
                );
            } else if (
                this.currentColour !== targetColour
            ) {
                const startColour =
                    this.currentColour;

                this.colourTransition.animate({
                    from: 0,
                    to: 1,
                    duration: transitionDuration,
                    onUpdate: (progress) => {
                        this.applyColour(
                            ColourInterpolator.interpolate(
                                startColour,
                                targetColour,
                                progress
                            )
                        );
                    },
                    onComplete: () => {
                        this.applyColour(
                            targetColour
                        );
                    }
                });
            }

            if (this.currentIntensity === null) {
                this.applyIntensity(
                    targetIntensity
                );
            } else {
                this.intensityTransition.animate({
                    from: this.currentIntensity,
                    to: targetIntensity,
                    duration: transitionDuration,
                    onUpdate: (value) => {
                        this.applyIntensity(value);
                    }
                });
            }

            if (
                this.currentPulseDuration === null
            ) {
                this.applyPulseDuration(
                    targetPulseDuration
                );
            } else {
                this.pulseTransition.animate({
                    from:
                        this.currentPulseDuration,
                    to:
                        targetPulseDuration,
                    duration:
                        transitionDuration,
                    onUpdate: (value) => {
                        this.applyPulseDuration(
                            value
                        );
                    }
                });
            }
        }

        if (
            this.lightingStatus instanceof HTMLElement
        ) {
            this.lightingStatus.textContent =
                lightingEnabled
                    ? `Lighting active · ${state.lighting.preset}`
                    : 'Lighting disabled';
        }
    }

    public destroy(): void {
        this.intensityTransition.cancel();
        this.pulseTransition.cancel();
        this.colourTransition.cancel();

        this.currentIntensity = null;
        this.currentPulseDuration = null;
        this.currentColour = null;
    }
}
