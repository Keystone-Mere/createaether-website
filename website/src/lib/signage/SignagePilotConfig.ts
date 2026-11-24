import type { SignageConfig } from './SignageConfig.ts';

export const signagePilotConfig: SignageConfig = {
  schemaVersion: 1,

  venueId: 'aether-pilot',
  deviceId: 'display-01',

  timezone: 'Europe/London',
  performanceProfile: 'pi4',

  defaultSceneId: 'ullswater',

  scenes: [
    {
      id: 'ullswater',
      name: 'Ullswater Retreat',
      path: '/scene-lab/ullswater/',
      defaultState: {
        rain: 0,
        ripples: 20,
        vapour: 25
      }
    }
  ],

  schedule: [
    {
      id: 'morning',
      startTime: '07:00',
      endTime: '12:00',
      sceneId: 'ullswater',
      state: {
        rain: 10,
        ripples: 25,
        vapour: 35
      }
    },
    {
      id: 'afternoon',
      startTime: '12:00',
      endTime: '18:00',
      sceneId: 'ullswater',
      state: {
        rain: 55,
        ripples: 60,
        vapour: 45
      }
    },
    {
      id: 'evening',
      startTime: '18:00',
      endTime: '23:00',
      sceneId: 'ullswater',
      state: {
        rain: 20,
        ripples: 35,
        vapour: 65
      }
    }
  ]
};
