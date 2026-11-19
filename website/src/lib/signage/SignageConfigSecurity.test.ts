import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSignageConfig } from './SignageConfigParser.ts';

const baseConfig = {
  schemaVersion: 1,
  venueId: 'pilot-hotel',
  deviceId: 'screen-01',
  timezone: 'Europe/London',
  defaultSceneId: 'ullswater',
  performanceProfile: 'pi4',
  scenes: [{
    id: 'ullswater',
    name: 'Ullswater Retreat',
    path: '/scene-lab/ullswater/',
    defaultState: { rain: 0 }
  }],
  schedule: []
};

test('rejects path traversal', () => {
  const result = parseSignageConfig({
    ...baseConfig,
    scenes: [{
      ...baseConfig.scenes[0],
      path: '/scene-lab/../private/'
    }]
  });

  assert.equal(result.valid, false);
});

test('rejects external scene URLs', () => {
  const result = parseSignageConfig({
    ...baseConfig,
    scenes: [{
      ...baseConfig.scenes[0],
      path: 'https://example.com/player'
    }]
  });

  assert.equal(result.valid, false);
});

test('rejects excessive scene counts', () => {
  const scenes = Array.from({ length: 1001 }, (_, index) => ({
    id: `scene-${index}`,
    name: `Scene ${index}`,
    path: `/scene-lab/scene-${index}/`,
    defaultState: { rain: 0 }
  }));

  const result = parseSignageConfig({
    ...baseConfig,
    defaultSceneId: 'scene-0',
    scenes
  });

  assert.equal(result.valid, false);
});
