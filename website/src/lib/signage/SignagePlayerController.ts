import type { SignageConfig } from './SignageConfig.ts';
import {
  resolveSignageScene,
  type ResolvedSignageScene
} from './SignageResolver.ts';

export interface SignagePlayerUpdate {
  changed: boolean;
  current: ResolvedSignageScene;
}

export class SignagePlayerController {
  private currentSceneId: string | null = null;

  private readonly config: SignageConfig;

  constructor(config: SignageConfig) {
    this.config = config;
  }

  update(date: Date = new Date()): SignagePlayerUpdate {
    const resolved = resolveSignageScene(this.config, date);

    const changed = this.currentSceneId !== resolved.scene.id;

    this.currentSceneId = resolved.scene.id;

    return {
      changed,
      current: resolved
    };
  }

  reset(): void {
    this.currentSceneId = null;
  }
}

