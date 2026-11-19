import type { SignageConfig } from './SignageConfig.ts';
import {
  validateSignageConfig,
  type SignageValidationResult
} from './SignageValidator.ts';

export interface SignageConfigParseResult extends SignageValidationResult {
  config?: SignageConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isEnvironmentState(value: unknown): boolean {
  return isRecord(value);
}

export function parseSignageConfig(
  input: unknown
): SignageConfigParseResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: ['Configuration must be an object.']
    };
  }

  if (!Array.isArray(input.scenes)) {
    errors.push('Scenes must be an array.');
  }

  if (!Array.isArray(input.schedule)) {
    errors.push('Schedule must be an array.');
  }

  if (!isString(input.venueId)) {
    errors.push('venueId must be a string.');
  }

  if (!isString(input.deviceId)) {
    errors.push('deviceId must be a string.');
  }

  if (!isString(input.timezone)) {
    errors.push('timezone must be a string.');
  }

  if (!isString(input.defaultSceneId)) {
    errors.push('defaultSceneId must be a string.');
  }

  if (Array.isArray(input.scenes) && input.scenes.length > 100) {
    errors.push('Configuration exceeds the 100-scene limit.');
  }

  if (Array.isArray(input.schedule) && input.schedule.length > 100) {
    errors.push('Configuration exceeds the 100-entry schedule limit.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Array.isArray(input.scenes)) {
    for (const [index, scene] of input.scenes.entries()) {
      if (
        !isRecord(scene) ||
        !isString(scene.id) ||
        !isString(scene.name) ||
        !isString(scene.path) ||
        !isEnvironmentState(scene.defaultState)
      ) {
        errors.push(`Scene ${index}: invalid structure.`);
      } else if (
        !/^\/[a-zA-Z0-9/_-]*$/.test(scene.path) ||
        scene.path.split('/').some(
          segment => segment === '.' || segment === '..'
        )
      ) {
        errors.push(`Scene ${index}: unsafe local path.`);
      }
    }
  }

  if (Array.isArray(input.schedule)) {
    for (const [index, entry] of input.schedule.entries()) {
      if (
        !isRecord(entry) ||
        !isString(entry.id) ||
        !isString(entry.startTime) ||
        !isString(entry.endTime) ||
        !isString(entry.sceneId) ||
        (
          entry.state !== undefined &&
          !isEnvironmentState(entry.state)
        )
      ) {
        errors.push(`Schedule ${index}: invalid structure.`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const config = input as unknown as SignageConfig;
  const result = validateSignageConfig(config);

  if (!result.valid) {
    return result;
  }

  return {
    valid: true,
    errors: [],
    config
  };
}

