export type GardenCue =
  | 'dry'
  | 'gentle'
  | 'shower'
  | 'clearing';

const CYCLE_MS = 8 * 60 * 1000;
const STAGE_MS = 2 * 60 * 1000;

const CUES: GardenCue[] = [
  'gentle',
  'shower',
  'clearing',
  'dry'
];

export class SignageScheduler {
  private timer: number | undefined;
  private startedAt = 0;
  private lastStage = -1;

  constructor(
    private readonly onCue: (cue: GardenCue) => void
  ) {}

  start(): void {
    this.stop();

    this.startedAt = performance.now();
    this.lastStage = -1;

    this.tick();

    this.timer = window.setInterval(
      () => this.tick(),
      1000
    );
  }

  private tick(): void {
    const elapsed =
      (performance.now() - this.startedAt) % CYCLE_MS;

    const stage = Math.floor(elapsed / STAGE_MS);

    if (stage === this.lastStage) return;

    this.lastStage = stage;
    this.onCue(CUES[stage]);
  }

  stop(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

