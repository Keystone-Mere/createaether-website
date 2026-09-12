import { ExperienceState } from '../ExperienceState';
import { ExperienceRuntime } from '../ExperienceRuntime';
import { ExperienceLoader } from '../ExperienceLoader';
import { ExperienceLibrary } from '../storage/ExperienceLibrary';
import { AudioSystem } from '../systems/AudioSystem';
import { VisualSystem } from '../systems/VisualSystem';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { CanvasParticleEffect } from '../visuals/CanvasParticleEffect';
import { CssFogEffect } from '../visuals/CssFogEffect';
import { CssLightingEffect } from '../visuals/CssLightingEffect';
import { CssParticleEffect } from '../visuals/CssParticleEffect';
import { PreviewController } from '../../components/studio/PreviewController';
import { audioTracks } from '../../data/audio/tracks';

export interface StudioRuntimeElements {
    audioElement: Element | null;
    audioEnabledToggle: Element | null;
    volumeControl: Element | null;
    volumeValue: Element | null;
    particlesToggle: Element | null;
    lightingToggle: Element | null;
    fogToggle: Element | null;
    previewStage: Element | null;
    previewCanvas: Element | null;
    particlesStatus: Element | null;
    lightingStatus: Element | null;
    fogStatus: Element | null;
}

export const createStudioRuntime = (
    elements: StudioRuntimeElements
) => {
    const {
        audioElement,
        audioEnabledToggle,
        volumeControl,
        volumeValue,
        particlesToggle,
        lightingToggle,
        fogToggle,
        previewStage,
        previewCanvas,
        particlesStatus,
        lightingStatus,
        fogStatus
    } = elements;

    const experienceRuntime =
        new ExperienceRuntime();

    const experienceLibrary =
        new ExperienceLibrary();

    const previewController =
        new PreviewController({
            volumeValue
        });

    const audioSystem =
        new AudioSystem(
            audioElement,
            audioTracks,
            experienceRuntime.events
        );

    const visualSystem =
        new VisualSystem();

    visualSystem.register(
        new CssLightingEffect(
            previewStage,
            lightingStatus
        )
    );

    visualSystem.register(
        new CssFogEffect(
            previewStage,
            fogStatus
        )
    );

    visualSystem.register(
        new CssParticleEffect(
            previewStage,
            particlesStatus
        )
    );

    const canvasRenderer =
        previewCanvas instanceof HTMLCanvasElement
            ? new CanvasRenderer(previewCanvas)
            : null;

    if (canvasRenderer) {
        visualSystem.register(
            new CanvasParticleEffect(
                canvasRenderer,
                experienceRuntime.events
            )
        );
    }

    experienceRuntime.register(
        previewController
    );

    experienceRuntime.register(
        audioSystem
    );

    experienceRuntime.register(
        visualSystem
    );

    experienceRuntime.initialise();
    experienceRuntime.start();

    const experienceState =
        new ExperienceState(
            {
                audioEnabledToggle,
                audioTrack:
                    audioElement instanceof HTMLAudioElement
                        ? audioElement.dataset.trackId ?? ''
                        : '',
                volumeControl,
                particlesToggle,
                lightingToggle,
                fogToggle
            },
            (state) =>
                experienceRuntime.update(state)
        );

    const experienceLoader =
        new ExperienceLoader(
            experienceRuntime,
            experienceState
        );

    window.addEventListener(
        'pagehide',
        () => {
            experienceRuntime.destroy();
            canvasRenderer?.destroy();
        },
        {
            once: true
        }
    );

    return {
        experienceRuntime,
        experienceLibrary,
        experienceState,
        experienceLoader
    };
};
