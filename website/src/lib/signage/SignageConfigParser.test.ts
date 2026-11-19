import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSignageConfig } from './SignageConfigParser.ts';

const validConfig = {
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
      defaultState: { rain: 0, ripples: 10 }
    }
  ],
  schedule: [
    {
      id: 'daytime',
      startTime: '09:00',
      endTime: '17:00',
      sceneId: 'ullswater'
    }
  ]
};

test('accepts valid configuration data', () => {
  const result = parseSignageConfig(validConfig);

  assert.equal(result.valid, true);
  assert.equal(result.config?.venueId, 'pilot-hotel');
});

test('rejects null input', () => {
  const result = parseSignageConfig(null);
  assert.equal(result.valid, false);
});

test('rejects missing scenes array', () => {
  const result = parseSignageConfig({
    ...validConfig,
    scenes: undefined
  });

  assert.equal(result.valid, false);
});

test('rejects malformed scene records', () => {
  const result = parseSignageConfig({
    ...validConfig,
    scenes: [null]
  });

  assert.equal(result.valid, false);
});

test('rejects malformed schedule records', () => {
  const result = parseSignageConfig({
    ...validConfig,
    schedule: [{ id: 123 }]
  });

  assert.equal(result.valid, false);
});

test('rejects invalid environmental values', () => {
  const result = parseSignageConfig({
    ...validConfig,
    scenes: [{
      ...validConfig.scenes[0],
      defaultState: { rain: 150 }
    }]
  });

  assert.equal(result.valid, false);
});

test('rejects overlapping schedules', () => {
  const result = parseSignageConfig({
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
  });

  assert.equal(result.valid, false);
});
