import type { Experience } from '../models/Experience';
import retreat from '../../data/experiences/retreat.json';
import christmas from '../../data/experiences/christmas.json';
export type RetreatPreset = 'quiet' | 'rain' | 'winter';
export function applyRetreatPreset(source: Experience, preset: RetreatPreset): Experience {
    const next = structuredClone(source);
    next.sceneId = 'retreat';
    delete next.background;
    delete next.backgroundId;
    next.audio = { enabled: source.audio.enabled, volume: 25, layerVolume: 0, track: preset === 'rain' ? 'retreat-rain' : 'retreat-wind' };
    next.atmosphere = { particles: preset !== 'quiet', lighting: true, fog: false };
    next.environment = { colour: preset === 'winter' ? '#18212a' : '#251b14' };
    next.lighting = { ...retreat.lighting, colour: '#edbd7d', intensity: preset === 'quiet' ? .5 : .35, pulse: false };
    next.fog = { ...retreat.fog, density: 0 };
    next.smoke = { enabled: false, amount: 35 };
    next.particles = { ...retreat.particles, motion: 'rain' };
    if (preset === 'winter') {
        next.backgroundId = 'retreat-winter';
        next.particles = { ...christmas.particles, preset: 'retreat-snow', motion: 'snow', count: 90, minRadius: .6, maxRadius: 1.6, glow: 0, minSpeed: 7, maxSpeed: 16, drift: 2, minOpacity: .2, maxOpacity: .65 };
    }
    return next;
}
