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

export class CssFogEffect
    implements VisualEffect {
    public readonly id = 'css-fog';
    public readonly name = 'CSS Fog';
    public readonly description =
        'Controls preset-driven atmospheric fog in the Studio preview.';
    public readonly version = '0.23.0';
    public readonly category:
        VisualEffectCategory = 'fog';

    public enabled = true;

    private readonly previewStage:
        Element | null;

    private readonly fogStatus:
        Element | null;

    private readonly densityTransition =
        new TransitionController();

    private readonly durationTransition =
        new TransitionController();

    private readonly colourTransition =
        new TransitionController();

    private currentDensity:
        number | null = null;

    private currentDriftDuration:
        number | null = null;

    private currentColour:
        string | null = null;

    private targetFogEnabled:
        boolean | null = null;

    constructor(
        previewStage: Element | null,
        fogStatus: Element | null
    ) {
        this.previewStage = previewStage;
        this.fogStatus = fogStatus;
    }

    private applyDensity(
        density: number
    ): void {
        if (
            !(this.previewStage instanceof HTMLElement)
        ) {
            return;
        }

        const clampedDensity =
            Math.min(
                1,
                Math.max(0, density)
            );

        this.currentDensity =
            clampedDensity;

        const fogOpacity =
            clampedDensity === 0
                ? 0
                : 0.22 + clampedDensity * 0.58;

        const secondaryFogOpacity =
            fogOpacity * 0.58;

        const fogBlur =
            14 + clampedDensity * 24;

        this.previewStage.style.setProperty(
            '--aether-fog-density',
            String(clampedDensity)
        );

        this.previewStage.style.setProperty(
            '--aether-fog-opacity',
            String(fogOpacity)
        );

        this.previewStage.style.setProperty(
            '--aether-fog-secondary-opacity',
            String(secondaryFogOpacity)
        );

        this.previewStage.style.setProperty(
            '--aether-fog-blur',
            `${fogBlur}px`
        );
    }

    private applyDriftDuration(
        duration: number
    ): void {
        if (
            !(this.previewStage instanceof HTMLElement)
        ) {
            return;
        }

        this.currentDriftDuration =
            duration;

        this.previewStage.style.setProperty(
            '--aether-fog-duration',
            `${duration}s`
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
            '--aether-fog-colour',
            colour
        );
    }

    public update(
        state: ExperienceStateData
    ): void {
        const fogEnabled =
            state.atmosphere.fog;

        this.targetFogEnabled =
            fogEnabled;

        const configuredDensity =
            Math.min(
                1,
                Math.max(
                    0,
                    state.fog.density
                )
            );

        const targetDensity =
            fogEnabled
                ? configuredDensity
                : 0;

        const speed =
            Math.min(
                1,
                Math.max(
                    0,
                    state.fog.speed
                )
            );

        const targetDriftDuration =
            18 - speed * 10;

        const targetColour =
            state.fog.colour;

        const transitionDuration =
            Math.max(
                0,
                state.transition.duration
            );

        if (
            this.previewStage instanceof HTMLElement
        ) {
            this.previewStage.dataset.fogPreset =
                state.fog.preset;

            this.previewStage.style.setProperty(
                '--aether-transition-duration',
                `${transitionDuration}ms`
            );

            this.previewStage.style.setProperty(
                '--aether-transition-easing',
                state.transition.easing
            );

            if (this.currentDensity === null) {
                this.applyDensity(
                    targetDensity
                );

                this.previewStage.classList.toggle(
                    'preview-stage--fog-disabled',
                    !fogEnabled
                );
            } else {
                /*
                 * Keep the fog elements available while their runtime
                 * opacity transitions. The disabled class is applied
                 * only after a fade-out reaches zero.
                 */
                this.previewStage.classList.remove(
                    'preview-stage--fog-disabled'
                );

                this.densityTransition.animate({
                    from: this.currentDensity,
                    to: targetDensity,
                    duration: transitionDuration,
                    onUpdate: (value) => {
                        this.applyDensity(value);
                    },
                    onComplete: () => {
                        if (
                            this.targetFogEnabled === false &&
                            this.previewStage instanceof HTMLElement
                        ) {
                            this.previewStage.classList.add(
                                'preview-stage--fog-disabled'
                            );
                        }
                    }
                });
            }

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

            if (
                this.currentDriftDuration === null
            ) {
                this.applyDriftDuration(
                    targetDriftDuration
                );
            } else {
                this.durationTransition.animate({
                    from:
                        this.currentDriftDuration,
                    to:
                        targetDriftDuration,
                    duration:
                        transitionDuration,
                    onUpdate: (value) => {
                        this.applyDriftDuration(
                            value
                        );
                    }
                });
            }
        }

        if (
            this.fogStatus instanceof HTMLElement
        ) {
            this.fogStatus.textContent =
                fogEnabled
                    ? `Fog active · ${state.fog.preset}`
                    : 'Fog disabled';
        }
    }

    public destroy(): void {
        this.densityTransition.cancel();
        this.durationTransition.cancel();
        this.colourTransition.cancel();

        this.currentDensity = null;
        this.currentDriftDuration = null;
        this.currentColour = null;
        this.targetFogEnabled = null;
    }
}
