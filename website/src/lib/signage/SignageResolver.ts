import type {
  SignageConfig,
  SignageScheduleEntry,
  SignageScene,
  SignageEnvironmentState
} from './SignageConfig.ts';

export interface ResolvedSignageScene {
  scene: SignageScene;
  state: SignageEnvironmentState;
  scheduleId: string | null;
}

function minutes(time: string): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error(`Invalid schedule time: ${time}`);
  }

  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

function matches(entry: SignageScheduleEntry, now: number): boolean {
  const start = minutes(entry.startTime);
  const end = minutes(entry.endTime);

  if (start === end) {
    throw new Error(`Schedule "${entry.id}" has identical start and end times.`);
  }

  return start < end
    ? now >= start && now < end
    : now >= start || now < end;
}

export function resolveSignageScene(
  config: SignageConfig,
  date: Date
): ResolvedSignageScene {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date.');
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const minute = Number(parts.find(p => p.type === 'minute')?.value);

  const current = hour * 60 + minute;

  const scenes = new Map(config.scenes.map(scene => [scene.id, scene]));
  const fallback = scenes.get(config.defaultSceneId);

  if (!fallback) {
    throw new Error('Default signage scene not found.');
  }

  const matchesNow = config.schedule.filter(entry => matches(entry, current));

  if (matchesNow.length > 1) {
    throw new Error('Overlapping signage schedules detected.');
  }

  const active = matchesNow[0];
  const scene = active ? scenes.get(active.sceneId) : fallback;

  if (!scene) {
    throw new Error(`Scheduled scene "${active.sceneId}" not found.`);
  }

  return {
    scene,
    state: {
      ...scene.defaultState,
      ...(active?.state ?? {})
    },
    scheduleId: active?.id ?? null
  };
}
