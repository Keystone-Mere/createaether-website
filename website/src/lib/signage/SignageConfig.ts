export type PerformanceProfile = 'pi4' | 'standard';

export interface SignageEnvironmentState {
  rain?: number;
  ripples?: number;
  vapour?: number;
  lighting?: number;
  audioEnabled?: boolean;
}

export interface SignageScene {
  id: string;
  name: string;
  path: string;
  defaultState: SignageEnvironmentState;
}

export interface SignageScheduleEntry {
  id: string;
  startTime: string;
  endTime: string;
  sceneId: string;
  state?: SignageEnvironmentState;
}

export interface SignageConfig {
  schemaVersion: 1;
  venueId: string;
  deviceId: string;
  timezone: string;
  defaultSceneId: string;
  performanceProfile: PerformanceProfile;
  scenes: SignageScene[];
  schedule: SignageScheduleEntry[];
}
