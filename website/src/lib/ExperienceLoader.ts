import { normalizeExperience } from './models/ExperienceFormat';
import type {
    Experience
} from './models/Experience';

import type {
    ExperienceStateData
} from './ExperienceState';

import {
    ExperienceState
} from './ExperienceState';

import {
    ExperienceRuntime
} from './ExperienceRuntime';

export class ExperienceLoader {
    private readonly runtime:
        ExperienceRuntime;

    private readonly state:
        ExperienceState;

    private activeExperience:
        Experience | null = null;

    constructor(
        runtime: ExperienceRuntime,
        state: ExperienceState
    ) {
        this.runtime = runtime;
        this.state = state;
    }

    private createState(
        experience: Experience
    ): ExperienceStateData {
        return {
            clearSpace: experience.clearSpace ? { ...experience.clearSpace } : undefined,
            smoke: experience.smoke ? { ...experience.smoke } : undefined,
            audio: {
                ...experience.audio
            },

            atmosphere: {
                ...experience.atmosphere
            },

            environment: {
                colour:
                    experience.environment?.colour
                    ?? experience.lighting.colour
            },

            lighting: {
                ...experience.lighting
            },

            fog: {
                ...experience.fog
            },

            particles: {
                ...experience.particles
            },

            transition: {
                ...experience.transition
            }
        };
    }

    private cloneExperience(experience: Experience): Experience {
        return normalizeExperience(experience);
    }

    public load(
        experience: Experience
    ): Experience {
        const validatedExperience = normalizeExperience(experience);

        const previousExperience =
            this.activeExperience
                ? this.cloneExperience(
                    this.activeExperience
                )
                : null;

        const nextExperience =
            this.cloneExperience(validatedExperience);

        this.runtime.events.emit(
            'experience:loading',
            {
                experience: nextExperience,
                previousExperience
            }
        );

        this.activeExperience =
            nextExperience;

        this.state.load(
            this.createState(nextExperience)
        );

        this.runtime.events.emit(
            'experience:loaded',
            {
                experience:
                    this.cloneExperience(
                        nextExperience
                    ),
                previousExperience
            }
        );

        return this.cloneExperience(
            nextExperience
        );
    }

    public reload(): Experience | null {
        if (!this.activeExperience) {
            return null;
        }

        return this.load(
            this.activeExperience
        );
    }

    public unload(): boolean {
        if (!this.activeExperience) {
            return false;
        }

        const unloadedExperience =
            this.cloneExperience(
                this.activeExperience
            );

        this.activeExperience = null;

        this.runtime.events.emit(
            'experience:unloaded',
            {
                experience: unloadedExperience
            }
        );

        return true;
    }

    public active(): Experience | null {
        return this.activeExperience
            ? this.cloneExperience(
                this.activeExperience
            )
            : null;
    }

    public hasActive(): boolean {
        return this.activeExperience !== null;
    }
}
