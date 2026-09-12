import type {
    ExperienceStateData
} from '../ExperienceState';

import type {
    ExperienceRuntimeSystem
} from '../ExperienceRuntime';

import type {
    AudioTrack
} from '../models/AudioTrack';

import type {
    RuntimeEvents
} from '../RuntimeEvents';

export class AudioSystem
    implements ExperienceRuntimeSystem {
    public readonly id = 'audio';
    public readonly version = '0.11.0';
    public readonly priority = 20;
    public enabled = true;

    private readonly audioElement:
        HTMLAudioElement | null;

    private readonly tracks:
        Map<string, AudioTrack>;

    private readonly fallbackTrack:
        AudioTrack | null;

    private readonly events:
        RuntimeEvents | null;

    private readonly fadeDurationMs = 650;

    private activeTrackId:
        string | null = null;

    private fadeFrame:
        number | null = null;

    constructor(
        audioElement: Element | null,
        tracks: AudioTrack[] = [],
        events: RuntimeEvents | null = null
    ) {
        this.audioElement =
            audioElement instanceof HTMLAudioElement
                ? audioElement
                : null;

        this.tracks = new Map(
            tracks.map((track) => [
                track.id,
                track
            ])
        );

        this.fallbackTrack =
            tracks[0] ?? null;

        this.events = events;
    }

    private cancelFade(): void {
        if (this.fadeFrame === null) {
            return;
        }

        window.cancelAnimationFrame(
            this.fadeFrame
        );

        this.fadeFrame = null;
    }

    private fadeTo(
        targetVolume: number,
        onComplete?: () => void
    ): void {
        if (!this.audioElement) {
            return;
        }

        this.cancelFade();

        const audioElement =
            this.audioElement;

        const clampedTarget = Math.min(
            1,
            Math.max(0, targetVolume)
        );

        const startVolume =
            audioElement.volume;

        const volumeDifference =
            clampedTarget - startVolume;

        this.events?.emit(
            'audio:fade-start',
            {
                fromVolume: startVolume,
                toVolume: clampedTarget,
                durationMs: this.fadeDurationMs
            }
        );

        if (
            Math.abs(volumeDifference)
            < 0.001
        ) {
            audioElement.volume =
                clampedTarget;

            this.events?.emit(
                'audio:fade-complete',
                {
                    volume: clampedTarget
                }
            );

            onComplete?.();

            return;
        }

        const startTime =
            performance.now();

        const animate = (
            currentTime: number
        ) => {
            const elapsed =
                currentTime - startTime;

            const progress = Math.min(
                1,
                elapsed / this.fadeDurationMs
            );

            const easedProgress =
                1 - Math.pow(
                    1 - progress,
                    3
                );

            const interpolatedVolume =
                startVolume +
                (
                    volumeDifference *
                    easedProgress
                );

            audioElement.volume = Math.min(
                1,
                Math.max(
                    0,
                    interpolatedVolume
                )
            );

            if (progress < 1) {
                this.fadeFrame =
                    window.requestAnimationFrame(
                        animate
                    );

                return;
            }

            audioElement.volume =
                clampedTarget;

            this.fadeFrame = null;

            this.events?.emit(
                'audio:fade-complete',
                {
                    volume: clampedTarget
                }
            );

            onComplete?.();
        };

        this.fadeFrame =
            window.requestAnimationFrame(
                animate
            );
    }

    public update(
        state: ExperienceStateData
    ): void {
        if (!this.audioElement) {
            return;
        }

        const requestedTrack =
            this.tracks.get(
                state.audio.track
            );

        const resolvedTrack =
            requestedTrack ??
            this.fallbackTrack;

        if (
            resolvedTrack &&
            resolvedTrack.id !==
                this.activeTrackId
        ) {
            const previousTrackId =
                this.activeTrackId;

            this.events?.emit(
                'audio:track-changing',
                {
                    fromTrackId:
                        previousTrackId,
                    toTrack:
                        resolvedTrack
                }
            );

            const wasPlaying =
                !this.audioElement.paused;

            this.audioElement.src =
                resolvedTrack.src;

            this.audioElement.loop =
                resolvedTrack.loop;

            this.audioElement.load();

            this.activeTrackId =
                resolvedTrack.id;

            this.events?.emit(
                'audio:track-changed',
                {
                    track: resolvedTrack
                }
            );

            if (
                wasPlaying &&
                state.audio.enabled
            ) {
                void this.audioElement
                    .play()
                    .catch((error) => {
                        console.error(
                            'Unable to switch audio track.',
                            error
                        );
                    });
            }
        }

        const normalisedVolume =
            Math.min(
                1,
                Math.max(
                    0,
                    state.audio.volume / 100
                )
            );

        this.audioElement.muted = false;

        if (!state.audio.enabled) {
            if (this.audioElement.paused) {
                this.cancelFade();
                this.audioElement.volume = 0;

                return;
            }

            this.fadeTo(
                0,
                () => {
                    if (
                        !this.audioElement
                    ) {
                        return;
                    }

                    this.audioElement.pause();
                }
            );

            return;
        }

        this.fadeTo(
            normalisedVolume
        );
    }
}
