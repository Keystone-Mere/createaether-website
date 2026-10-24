import { isClearSpace } from '../clear-space/ClearSpace';
import type { Experience } from './Experience';
import { isBackground } from '../player/Background';
import { isBackgroundId } from '../player/BackgroundChoices';

/** Aether's content/save version; independent of the portable URL envelope. */
export const EXPERIENCE_FORMAT_VERSION = 1 as const;

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

export function isExperience(
    value: unknown
): value is Experience {
    if (!isRecord(value)) {
        return false;
    }

    return (
        (value.formatVersion === undefined || value.formatVersion === EXPERIENCE_FORMAT_VERSION) &&
        (value.sceneId === undefined || (typeof value.sceneId === 'string' && value.sceneId.trim() !== '')) &&
        typeof value.id === 'string' &&
        value.id.trim() !== '' &&
        typeof value.name === 'string' &&
        value.name.trim() !== '' &&
        typeof value.description === 'string' &&
        typeof value.status === 'string' &&
        (value.background === undefined || isBackground(value.background)) &&
        (value.backgroundId === undefined || isBackgroundId(value.backgroundId)) &&
        (value.clearSpace === undefined || isClearSpace(value.clearSpace)) &&
        (value.smoke === undefined || (isRecord(value.smoke) && typeof value.smoke.enabled === 'boolean' && isFiniteNumber(value.smoke.amount) && value.smoke.amount >= 0 && value.smoke.amount <= 100)) &&
        isRecord(value.audio) &&
        isRecord(value.atmosphere) &&
        isRecord(value.lighting) &&
        isRecord(value.fog) &&
        isRecord(value.particles) &&
        isRecord(value.transition) &&
        typeof value.audio.enabled === 'boolean' &&
        isFiniteNumber(value.audio.volume) &&
        (value.audio.layerVolume === undefined || isFiniteNumber(value.audio.layerVolume)) &&
        typeof value.audio.track === 'string' &&
        typeof value.atmosphere.particles === 'boolean' &&
        typeof value.atmosphere.lighting === 'boolean' &&
        typeof value.atmosphere.fog === 'boolean' &&
        (value.environment === undefined ||
            (isRecord(value.environment) &&
                typeof value.environment.colour === 'string')) &&
        typeof value.lighting.preset === 'string' &&
        typeof value.lighting.colour === 'string' &&
        isFiniteNumber(value.lighting.intensity) &&
        typeof value.lighting.pulse === 'boolean' &&
        isFiniteNumber(value.lighting.speed) &&
        typeof value.fog.preset === 'string' &&
        typeof value.fog.colour === 'string' &&
        isFiniteNumber(value.fog.density) &&
        isFiniteNumber(value.fog.speed) &&
        typeof value.particles.preset === 'string' &&
        (value.particles.motion === undefined ||
            ['rise', 'wander', 'flow', 'rain', 'snow', 'burst'].includes(
                String(value.particles.motion)
            )) &&
        typeof value.particles.colour === 'string' &&
        [
            'count', 'glow', 'minRadius', 'maxRadius',
            'minSpeed', 'maxSpeed', 'drift', 'minOpacity',
            'maxOpacity', 'minLifetime', 'maxLifetime'
        ].every((key) => isFiniteNumber((value.particles as Record<string, unknown>)[key])) &&
        isFiniteNumber(value.transition.duration) &&
        typeof value.transition.easing === 'string'
    );
}


/** Legacy unversioned experiences are v1. Never reinterpret a future version. */
export function normalizeExperience(value: unknown): Experience {
    if (!isExperience(value)) {
        throw new TypeError('Invalid experience or unsupported Aether format version.');
    }
    const copy = structuredClone(value);
    copy.formatVersion = EXPERIENCE_FORMAT_VERSION;
    copy.environment ??= { colour: copy.lighting.colour };
    return copy;
}

/** Independent copy, including optional smoke and future nested content. */
export function cloneExperience(value: Experience): Experience {
    return structuredClone(value);
}
