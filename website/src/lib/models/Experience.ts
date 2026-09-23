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

export interface EnvironmentSettings {
  colour: string;
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
  motion?: "rise" | "wander" | "flow" | "rain" | "snow" | "burst";

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

  /** Optional so experiences exported before the colour editor remain importable. */
  environment?: EnvironmentSettings;

  lighting: LightingSettings;
  fog: FogSettings;
  particles: ParticleSettings;

  transition: TransitionSettings;
}
