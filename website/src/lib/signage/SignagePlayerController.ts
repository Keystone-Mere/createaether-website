import type {
  SignageConfig,
  SignageEnvironmentState
} from './SignageConfig.ts';

import {
  resolveSignageScene,
  type ResolvedSignageScene
} from './SignageResolver.ts';

export interface SignagePlayerUpdate {
  changed: boolean;
  stateChanged: boolean;
  current: ResolvedSignageScene;
}

function statesEqual(
  previous: SignageEnvironmentState,
  next: SignageEnvironmentState
): boolean {
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return previousKeys.every(
    key =>
      Object.prototype.hasOwnProperty.call(next, key) &&
      Object.is(
        previous[key as keyof SignageEnvironmentState],
        next[key as keyof SignageEnvironmentState]
      )
  );
}

export class SignagePlayerController {
  private currentSceneId: string | null = null;
  private currentState: SignageEnvironmentState | null = null;

  private readonly config: SignageConfig;

  constructor(config: SignageConfig) {
    this.config = config;
  }

  update(date: Date = new Date()): SignagePlayerUpdate {
    const resolved = resolveSignageScene(this.config, date);

    const changed = this.currentSceneId !== resolved.scene.id;

    const stateChanged =
      changed ||
      this.currentState === null ||
      !statesEqual(this.currentState, resolved.state);

    this.currentSceneId = resolved.scene.id;
    this.currentState = { ...resolved.state };

    return {
      changed,
      stateChanged,
      current: resolved
    };
  }

  reset(): void {
    this.currentSceneId = null;
    this.currentState = null;
  }
}
