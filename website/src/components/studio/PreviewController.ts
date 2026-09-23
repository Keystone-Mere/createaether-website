import type {
    ExperienceStateData
} from '../../lib/ExperienceState';

import type {
    ExperienceRuntimeSystem
} from '../../lib/ExperienceRuntime';

export interface PreviewElements {
    volumeValue: Element | null;
    previewStage: Element | null;
}

export class PreviewController
    implements ExperienceRuntimeSystem {
    public readonly id = 'studio-preview';
    public readonly version = '0.11.0';
    public readonly priority = 10;
    public enabled = true;

    private readonly elements: PreviewElements;

    constructor(elements: PreviewElements) {
        this.elements = elements;
    }

    private updateVolume(
        state: ExperienceStateData
    ): void {
        const { volumeValue } = this.elements;

        if (volumeValue instanceof HTMLOutputElement) {
            volumeValue.value = `${state.audio.volume}%`;
        }
    }

    private updateEnvironment(
        state: ExperienceStateData
    ): void {
        const { previewStage } = this.elements;

        if (previewStage instanceof HTMLElement) {
            previewStage.style.setProperty(
                '--aether-environment-colour',
                state.environment.colour
            );
        }
    }

    public update(
        state: ExperienceStateData
    ): void {
        this.updateVolume(state);
        this.updateEnvironment(state);
    }
}
