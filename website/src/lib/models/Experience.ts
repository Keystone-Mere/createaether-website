export interface AudioSettings {
    enabled: boolean;
    volume: number;
    track: string;
}

export interface AtmosphereSettings {
    particles: boolean;
    lighting: boolean;
    fog: boolean;
}

export interface LightingSettings {
    preset: string;
    colour: string;
    intensity: number;
    pulse: boolean;
    speed: number;
}

export interface FogSettings {
    preset: string;
    colour: string;
    density: number;
    speed: number;
}

export interface ParticleSettings {
    preset: string;

    count: number;
    colour: string;
    glow: number;

    minRadius: number;
    maxRadius: number;

    minSpeed: number;
    maxSpeed: number;

    drift: number;

    minOpacity: number;
    maxOpacity: number;

    minLifetime: number;
    maxLifetime: number;
}

export interface TransitionSettings {
    duration: number;
    easing: string;
}

export interface Experience {
    id: string;
    name: string;
    description: string;
    status: string;

    audio: AudioSettings;
    atmosphere: AtmosphereSettings;

    lighting: LightingSettings;
    fog: FogSettings;
    particles: ParticleSettings;

    transition: TransitionSettings;
}
