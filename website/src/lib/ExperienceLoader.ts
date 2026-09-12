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

    private validate(
        experience: Experience
    ): void {
        if (
            !experience ||
            typeof experience.id !== 'string' ||
            experience.id.trim() === ''
        ) {
            throw new TypeError(
                'Experiences must provide a valid id.'
            );
        }

        if (
            !experience.audio ||
            !experience.atmosphere ||
            !experience.lighting ||
            !experience.fog ||
            !experience.particles ||
            !experience.transition
        ) {
            throw new TypeError(
                'Experiences must provide audio, atmosphere, lighting, fog, particle and transition settings.'
            );
        }
    }

    private createState(
        experience: Experience
    ): ExperienceStateData {
        return {
            audio: {
                ...experience.audio
            },

            atmosphere: {
                ...experience.atmosphere
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

    private cloneExperience(
        experience: Experience
    ): Experience {
        return {
            ...experience,

            audio: {
                ...experience.audio
            },

            atmosphere: {
                ...experience.atmosphere
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

    public load(
        experience: Experience
    ): Experience {
        this.validate(experience);

        const previousExperience =
            this.activeExperience
                ? this.cloneExperience(
                    this.activeExperience
                )
                : null;

        const nextExperience =
            this.cloneExperience(experience);

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
