import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSignageScene } from './SignageResolver.ts';
import type { SignageConfig } from './SignageConfig.ts';

const config: SignageConfig = {
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
      sceneId: 'garden',
      state: { rain: 35 }
    }
  ]
};

test('selects the scheduled scene during venue opening hours', () => {
  const result = resolveSignageScene(
    config,
    new Date('2026-11-19T12:00:00Z')
  );

  assert.equal(result.scene.id, 'garden');
  assert.equal(result.state.rain, 35);
  assert.equal(result.scheduleId, 'daytime');
});

test('uses the default scene outside scheduled hours', () => {
  const result = resolveSignageScene(
    config,
    new Date('2026-11-19T20:00:00Z')
  );

  assert.equal(result.scene.id, 'ullswater');
  assert.equal(result.scheduleId, null);
});

test('handles schedules crossing midnight', () => {
  const overnight: SignageConfig = {
    ...config,
    schedule: [{
      id: 'overnight',
      startTime: '22:00',
      endTime: '06:00',
      sceneId: 'garden'
    }]
  };

  for (const timestamp of [
    '2026-11-19T23:00:00Z',
    '2026-11-20T03:00:00Z'
  ]) {
    const result = resolveSignageScene(
      overnight,
      new Date(timestamp)
    );

    assert.equal(result.scene.id, 'garden');
  }

  const daytime = resolveSignageScene(
    overnight,
    new Date('2026-11-20T12:00:00Z')
  );

  assert.equal(daytime.scene.id, 'ullswater');
});

test('uses British Summer Time for venue scheduling', () => {
  const result = resolveSignageScene(
    config,
    new Date('2026-07-15T08:30:00Z')
  );

  // 08:30 UTC is 09:30 in London during summer.
  assert.equal(result.scene.id, 'garden');
});

test('handles the autumn clock change using local time', () => {
  const autumn: SignageConfig = {
    ...config,
    schedule: [{
      id: 'early-morning',
      startTime: '01:00',
      endTime: '02:00',
      sceneId: 'garden'
    }]
  };

  // Both UTC instants occur during the repeated 01:00 hour.
  for (const timestamp of [
    '2026-10-25T00:30:00Z',
    '2026-10-25T01:30:00Z'
  ]) {
    const result = resolveSignageScene(
      autumn,
      new Date(timestamp)
    );

    assert.equal(result.scene.id, 'garden');
  }
});
