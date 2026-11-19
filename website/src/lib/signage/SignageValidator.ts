import type { SignageConfig } from './SignageConfig.ts';

export interface SignageValidationResult {
  valid: boolean;
  errors: string[];
}

const LIMITS: Record<string, [number, number]> = {
  rain: [0, 100],
  ripples: [0, 100],
  vapour: [0, 100],
  lighting: [0, 100]
};

function timeToMinutes(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateSignageConfig(
  config: SignageConfig
): SignageValidationResult {
  const errors: string[] = [];

  if (config.schemaVersion !== 1) {
    errors.push('Unsupported configuration schema.');
  }

  for (const key of ['venueId', 'deviceId', 'timezone'] as const) {
    if (typeof config[key] !== 'string' || !config[key].trim()) {
      errors.push(`Missing ${key}.`);
    }
  }

  try {
    new Intl.DateTimeFormat('en-GB', {
      timeZone: config.timezone
    });
  } catch {
    errors.push('Invalid venue timezone.');
  }

  if (!['pi4', 'standard'].includes(config.performanceProfile)) {
    errors.push('Invalid performance profile.');
  }

  const sceneIds = new Set<string>();

  function validateState(
    state: unknown,
    context: string
  ): void {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      errors.push(`${context}: invalid environmental state.`);
      return;
    }

    for (const [key, value] of Object.entries(state)) {
      if (key === 'audioEnabled') {
        if (typeof value !== 'boolean') {
          errors.push(`${context}: audioEnabled must be boolean.`);
        }
      } else if (key in LIMITS) {
        const [min, max] = LIMITS[key];

        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < min ||
          value > max
        ) {
          errors.push(`${context}: ${key} must be between ${min} and ${max}.`);
        }
      } else {
        errors.push(`${context}: unknown setting ${key}.`);
      }
    }
  }

  for (const scene of config.scenes) {
    if (!scene.id?.trim() || sceneIds.has(scene.id)) {
      errors.push(`Missing or duplicate scene ID: ${scene.id}`);
    }

    sceneIds.add(scene.id);

    if (!scene.path?.startsWith('/') || scene.path.startsWith('//')) {
      errors.push(`Scene ${scene.id}: invalid local path.`);
    }

    validateState(scene.defaultState, `Scene ${scene.id}`);
  }

  if (!sceneIds.has(config.defaultSceneId)) {
    errors.push('Default scene does not exist.');
  }

  const scheduleIds = new Set<string>();
  const occupied = new Uint8Array(1440);

  for (const entry of config.schedule) {
    if (!entry.id?.trim() || scheduleIds.has(entry.id)) {
      errors.push(`Missing or duplicate schedule ID: ${entry.id}`);
    }

    scheduleIds.add(entry.id);

    if (!sceneIds.has(entry.sceneId)) {
      errors.push(`Schedule ${entry.id}: scene not found.`);
    }

    if (entry.state !== undefined) {
      validateState(entry.state, `Schedule ${entry.id}`);
    }

    const start = timeToMinutes(entry.startTime);
    const end = timeToMinutes(entry.endTime);

    if (start === null || end === null || start === end) {
      errors.push(`Schedule ${entry.id}: invalid time range.`);
      continue;
    }

    const duration = (end - start + 1440) % 1440;

    for (let offset = 0; offset < duration; offset++) {
      const minute = (start + offset) % 1440;

      if (occupied[minute]) {
        errors.push(`Schedule ${entry.id}: overlaps another schedule.`);
        break;
      }

      occupied[minute] = 1;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
