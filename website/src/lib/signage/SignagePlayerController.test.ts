import test from 'node:test';
import assert from 'node:assert/strict';

import { SignagePlayerController } from './SignagePlayerController.ts';
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
      defaultState: { rain: 0 }
    },
    {
      id: 'garden',
      name: 'Layered Garden',
      path: '/scene-lab/garden-player/',
      defaultState: { rain: 25 }
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

test('selects the scheduled scene on startup', () => {
  const controller = new SignagePlayerController(config);

  const result = controller.update(
    new Date('2026-11-19T12:00:00Z')
  );

  assert.equal(result.changed, true);
  assert.equal(result.current.scene.id, 'garden');
});

test('does not request a reload when scene is unchanged', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T12:00:00Z'));

  const result = controller.update(
    new Date('2026-11-19T13:00:00Z')
  );

  assert.equal(result.changed, false);
  assert.equal(result.current.scene.id, 'garden');
});

test('switches to default scene after closing time', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T16:59:00Z'));

  const result = controller.update(
    new Date('2026-11-19T17:00:00Z')
  );

  assert.equal(result.changed, true);
  assert.equal(result.current.scene.id, 'ullswater');
});

test('switches back to scheduled scene next morning', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T18:00:00Z'));

  const result = controller.update(
    new Date('2026-11-20T09:00:00Z')
  );

  assert.equal(result.changed, true);
  assert.equal(result.current.scene.id, 'garden');
});

test('reset requests scene selection again', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T12:00:00Z'));
  controller.reset();

  const result = controller.update(
    new Date('2026-11-19T12:01:00Z')
  );

  assert.equal(result.changed, true);
});

test('reports initial environmental state', () => {
  const controller = new SignagePlayerController(config);

  const result = controller.update(
    new Date('2026-11-19T12:00:00Z')
  );

  assert.equal(result.changed, true);
  assert.equal(result.stateChanged, true);
});

test('does not report unchanged environmental state', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T12:00:00Z'));

  const result = controller.update(
    new Date('2026-11-19T13:00:00Z')
  );

  assert.equal(result.changed, false);
  assert.equal(result.stateChanged, false);
});

test('detects scheduled state changes without reloading the scene', () => {
  const scheduledConfig: SignageConfig = {
    ...config,
    defaultSceneId: 'ullswater',
    schedule: [
      {
        id: 'morning',
        startTime: '09:00',
        endTime: '14:00',
        sceneId: 'ullswater',
        state: { rain: 20 }
      },
      {
        id: 'afternoon',
        startTime: '14:00',
        endTime: '19:00',
        sceneId: 'ullswater',
        state: { rain: 80 }
      }
    ]
  };

  const controller = new SignagePlayerController(scheduledConfig);

  controller.update(new Date('2026-11-19T13:59:00Z'));

  const result = controller.update(
    new Date('2026-11-19T14:00:00Z')
  );

  assert.equal(result.changed, false);
  assert.equal(result.stateChanged, true);
  assert.equal(result.current.state.rain, 80);
});

test('reset triggers scene and state updates', () => {
  const controller = new SignagePlayerController(config);

  controller.update(new Date('2026-11-19T12:00:00Z'));
  controller.reset();

  const result = controller.update(
    new Date('2026-11-19T12:01:00Z')
  );

  assert.equal(result.changed, true);
  assert.equal(result.stateChanged, true);
});
