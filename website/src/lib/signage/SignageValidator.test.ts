import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSignageConfig } from './SignageValidator.ts';
import type { SignageConfig } from './SignageConfig.ts';

const validConfig: SignageConfig = {
  schemaVersion: 1,
  venueId: 'pilot-hotel',
  deviceId: 'screen-01',
  timezone: 'Europe/London',
  defaultSceneId: 'ullswater',
  performanceProfile: 'pi4',
  scenes: [
    {
      id: 'ullswater',
      name: 'Ullswater Retreat',
      path: '/scene-lab/ullswater/',
      defaultState: { rain: 0, ripples: 10, vapour: 0 }
    },
    {
      id: 'garden',
      name: 'Layered Garden',
      path: '/scene-lab/garden-player/',
      defaultState: { rain: 20 }
    }
  ],
  schedule: [
    {
      id: 'daytime',
      startTime: '09:00',
      endTime: '17:00',
      sceneId: 'garden'
    }
  ]
};

test('accepts a valid venue configuration', () => {
  const result = validateSignageConfig(validConfig);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects overlapping schedules', () => {
  const config: SignageConfig = {
    ...validConfig,
    schedule: [
      ...validConfig.schedule,
      {
        id: 'overlap',
        startTime: '16:00',
        endTime: '20:00',
        sceneId: 'ullswater'
      }
    ]
  };

  const result = validateSignageConfig(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('overlaps')));
});

test('rejects duplicate scene identifiers', () => {
  const config: SignageConfig = {
    ...validConfig,
    scenes: [...validConfig.scenes, validConfig.scenes[0]]
  };

  const result = validateSignageConfig(config);
  assert.equal(result.valid, false);
});

test('rejects invalid environmental values', () => {
  const config: SignageConfig = {
    ...validConfig,
    scenes: [{
      ...validConfig.scenes[0],
      defaultState: { rain: 150 }
    }]
  };

  const result = validateSignageConfig(config);
  assert.equal(result.valid, false);
});

test('rejects an invalid timezone', () => {
  const config: SignageConfig = {
    ...validConfig,
    timezone: 'Invalid/Timezone'
  };

  const result = validateSignageConfig(config);
  assert.equal(result.valid, false);
});
