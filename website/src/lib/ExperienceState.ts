import type { Experience } from './models/Experience';

export type ExperienceStateData = Pick<
    Experience,
    'audio' |
    'atmosphere' |
    'lighting' |
    'fog' |
    'particles' |
    'transition'
>;

export interface ExperienceControls {
    audioEnabledToggle: Element | null;
    audioTrack: string;
    volumeControl: Element | null;
    particlesToggle: Element | null;
    lightingToggle: Element | null;
    fogToggle: Element | null;
}

export type ExperienceRenderer = (
    state: ExperienceStateData
) => void;

export class ExperienceState {
    public readonly data: ExperienceStateData;

    private readonly controls: ExperienceControls;
    private readonly render: ExperienceRenderer;

    constructor(
        controls: ExperienceControls,
        render: ExperienceRenderer
    ) {
        this.controls = controls;
        this.render = render;

        this.data = {
            audio: {
                enabled: true,
                volume: 40,
                track: controls.audioTrack
            },

            atmosphere: {
                particles: true,
                lighting: true,
                fog: false
            },

            lighting: {
                preset: "default",
                colour: "#ffffff",
                intensity: 1,
                pulse: false,
                speed: 0
            },

            fog: {
                preset: "default",
                colour: "#ffffff",
                density: 0,
                speed: 0
            },

            particles: {
                preset: "default",
                count: 40,
                colour: "#ffffff",
                glow: 4,
                minRadius: 1,
                maxRadius: 3,
                minSpeed: 4,
                maxSpeed: 10,
                drift: 5,
                minOpacity: 0.3,
                maxOpacity: 0.8,
                minLifetime: 5,
                maxLifetime: 10
            },

            transition: {
                duration: 1000,
                easing: "ease"
            }
        };
    }

    private writeControls(): void {
        const {
            audioEnabledToggle,
            volumeControl,
            particlesToggle,
            lightingToggle,
            fogToggle
        } = this.controls;

        if (
            audioEnabledToggle
            instanceof HTMLInputElement
        ) {
            audioEnabledToggle.checked =
                this.data.audio.enabled;
        }

        if (volumeControl instanceof HTMLInputElement) {
            volumeControl.value =
                String(this.data.audio.volume);
        }

        if (particlesToggle instanceof HTMLInputElement) {
            particlesToggle.checked =
                this.data.atmosphere.particles;
        }

        if (lightingToggle instanceof HTMLInputElement) {
            lightingToggle.checked =
                this.data.atmosphere.lighting;
        }

        if (fogToggle instanceof HTMLInputElement) {
            fogToggle.checked =
                this.data.atmosphere.fog;
        }
    }

    private readControls(): void {
        const {
            audioEnabledToggle,
            volumeControl,
            particlesToggle,
            lightingToggle,
            fogToggle
        } = this.controls;

        if (
            audioEnabledToggle
            instanceof HTMLInputElement
        ) {
            this.data.audio.enabled =
                audioEnabledToggle.checked;
        }

        if (volumeControl instanceof HTMLInputElement) {
            this.data.audio.volume = Number(volumeControl.value);
        }

        if (particlesToggle instanceof HTMLInputElement) {
            this.data.atmosphere.particles =
                particlesToggle.checked;
        }

        if (lightingToggle instanceof HTMLInputElement) {
            this.data.atmosphere.lighting =
                lightingToggle.checked;
        }

        if (fogToggle instanceof HTMLInputElement) {
            this.data.atmosphere.fog = fogToggle.checked;
        }
    }

    public load(
        state: ExperienceStateData
    ): void {
        this.data.audio = {
            ...state.audio
        };

        this.data.atmosphere = {
            ...state.atmosphere
        };

        this.data.lighting = {
            ...state.lighting
        };

        this.data.fog = {
            ...state.fog
        };

        this.data.particles = {
            ...state.particles
        };

        this.data.transition = {
            ...state.transition
        };

        this.writeControls();
        this.render(this.data);
    }

    public update(): void {
        this.readControls();
        this.render(this.data);
    }

    public initialise(): void {
        this.readControls();
        this.render(this.data);
    }
}
