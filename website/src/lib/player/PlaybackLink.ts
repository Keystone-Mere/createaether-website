import type { Experience } from '../models/Experience';
import { isExperience } from '../storage/ExperienceLibrary';

const scenes = new Set(['temple', 'forest', 'ocean', 'christmas', 'storm', 'festival']);
const colour = (value: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Invalid colour');
    return value;
};
const number = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Accept only bounded, known settings. Playback never executes imported code or URLs. */
export function validatePlayback(value: unknown): Experience {
    if (!isExperience(value)) throw new Error('Invalid experience');
    const sceneId = value.sceneId ?? value.id.split('-')[0];
    if (!scenes.has(sceneId)) throw new Error('Unknown scene');
    const p = value.particles;
    const particles = {
        preset: p.preset.slice(0, 80), motion: p.motion,
        colour: colour(p.colour), count: Math.round(number(p.count, 0, 300)),
        glow: number(p.glow, 0, 20), drift: number(p.drift, 0, 20),
        minRadius: number(p.minRadius, 0, 10), maxRadius: number(p.maxRadius, 0, 10),
        minSpeed: number(p.minSpeed, 0, 500), maxSpeed: number(p.maxSpeed, 0, 500),
        minOpacity: number(p.minOpacity, 0, 1), maxOpacity: number(p.maxOpacity, 0, 1),
        minLifetime: number(p.minLifetime, 0.1, 30), maxLifetime: number(p.maxLifetime, 0.1, 30),
    };
    for (const [min, max] of [['minRadius', 'maxRadius'], ['minSpeed', 'maxSpeed'], ['minOpacity', 'maxOpacity'], ['minLifetime', 'maxLifetime']] as const) {
        if (particles[min] > particles[max]) [particles[min], particles[max]] = [particles[max], particles[min]];
    }
    return {
        id: value.id.slice(0, 120), sceneId, name: value.name.slice(0, 120),
        ...(value.backgroundId ? { backgroundId: value.backgroundId } : {}),
        description: '', status: 'Playback',
        // Podcast backdrops are deliberately silent, irrespective of editor audio settings.
        audio: { enabled: false, volume: 0, layerVolume: 0, track: '' },
        atmosphere: { particles: value.atmosphere.particles, lighting: value.atmosphere.lighting, fog: value.atmosphere.fog },
        environment: { colour: colour(value.environment?.colour ?? value.lighting.colour) },
        lighting: { preset: value.lighting.preset.slice(0, 80), colour: colour(value.lighting.colour), intensity: number(value.lighting.intensity, 0, 2), pulse: value.lighting.pulse, speed: number(value.lighting.speed, 0, 1) },
        fog: { preset: value.fog.preset.slice(0, 80), colour: colour(value.fog.colour), density: number(value.fog.density, 0, 1), speed: number(value.fog.speed, 0, 1) },
        particles,
        transition: { duration: number(value.transition.duration, 0, 10000), easing: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(value.transition.easing) ? value.transition.easing : 'ease' },
    };
}

export function createPlaybackUrl(experience: Experience, origin: string): string {
    const payload = JSON.stringify({ v: 1, experience: validatePlayback(experience) });
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${origin}/play/#${encoded}`;
}

export function readPlaybackHash(hash: string): Experience {
    const encoded = hash.replace(/^#/, '');
    if (!encoded || encoded.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Invalid playback link');
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
    if (payload?.v !== 1) throw new Error('Unsupported playback version');
    return validatePlayback(payload.experience);
}
