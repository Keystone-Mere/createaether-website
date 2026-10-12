import type {
    ExperienceStateData
} from '../ExperienceState';

import type {
    ExperienceRuntimeSystem
} from '../ExperienceRuntime';

import type {
    VisualEffect
} from '../visuals/VisualEffect';

export class VisualSystem
    implements ExperienceRuntimeSystem {
    public readonly id = 'visuals';
    public readonly version = '0.16.0';
    public readonly priority = 30;
    public enabled = true;

    private readonly effects =
        new Map<string, VisualEffect>();

    private readonly initialisedEffects =
        new WeakSet<VisualEffect>();

    private readonly startedEffects =
        new WeakSet<VisualEffect>();

    private initialised = false;
    private started = false;

    private initialiseEffect(
        effect: VisualEffect
    ): void {
        if (this.initialisedEffects.has(effect)) {
            return;
        }

        if (typeof effect.initialise === 'function') {
            effect.initialise();
        }

        this.initialisedEffects.add(effect);
    }

    private startEffect(
        effect: VisualEffect
    ): void {
        if (this.startedEffects.has(effect)) {
            return;
        }

        this.initialiseEffect(effect);

        if (typeof effect.start === 'function') {
            effect.start();
        }

        this.startedEffects.add(effect);
    }

    private stopEffect(
        effect: VisualEffect
    ): void {
        if (!this.startedEffects.has(effect)) {
            return;
        }

        this.startedEffects.delete(effect);
        if (typeof effect.stop === 'function') {
            effect.stop();
        }

    }

    private destroyEffect(
        effect: VisualEffect
    ): void {
        try {
            this.stopEffect(effect);
        } finally {
            try {
                if (this.initialisedEffects.has(effect) && typeof effect.destroy === 'function') {
                    effect.destroy();
                }
            } finally {
                this.initialisedEffects.delete(effect);
                this.startedEffects.delete(effect);
            }
        }
    }

    public register(
        effect: VisualEffect
    ): () => void {
        if (
            !effect ||
            typeof effect.id !== 'string' ||
            effect.id.trim() === '' ||
            typeof effect.update !== 'function'
        ) {
            throw new TypeError(
                'Visual effects must provide an id and update method.'
            );
        }

        if (this.effects.has(effect.id)) {
            throw new Error(
                `Visual effect "${effect.id}" is already registered.`
            );
        }

        this.effects.set(
            effect.id,
            effect
        );

        if (effect.enabled && this.initialised) {
            this.initialiseEffect(effect);
        }

        if (effect.enabled && this.started) {
            this.startEffect(effect);
        }

        return () => {
            this.unregister(effect.id);
        };
    }

    public unregister(
        effectId: string
    ): boolean {
        const effect =
            this.effects.get(effectId);

        if (!effect) {
            return false;
        }

        this.destroyEffect(effect);

        return this.effects.delete(effectId);
    }

    public get(
        effectId: string
    ): VisualEffect | null {
        return this.effects.get(effectId) ?? null;
    }

    public has(
        effectId: string
    ): boolean {
        return this.effects.has(effectId);
    }

    public enable(
        effectId: string
    ): boolean {
        const effect =
            this.effects.get(effectId);

        if (!effect) {
            return false;
        }

        if (effect.enabled) {
            return true;
        }

        effect.enabled = true;

        if (this.initialised) {
            this.initialiseEffect(effect);
        }

        if (this.started) {
            this.startEffect(effect);
        }

        return true;
    }

    public disable(
        effectId: string
    ): boolean {
        const effect =
            this.effects.get(effectId);

        if (!effect) {
            return false;
        }

        if (!effect.enabled) {
            return true;
        }

        this.stopEffect(effect);
        effect.enabled = false;

        return true;
    }

    public list(): VisualEffect[] {
        return Array.from(
            this.effects.values()
        );
    }

    public listEnabled(): VisualEffect[] {
        return this.list().filter(
            (effect) => effect.enabled
        );
    }

    public count(): number {
        return this.effects.size;
    }

    public countEnabled(): number {
        return this.listEnabled().length;
    }

    public initialise(): void {
        this.initialised = true;
        this.started = false;

        this.effects.forEach((effect) => {
            if (effect.enabled) {
                this.initialiseEffect(effect);
            }
        });
    }

    public start(): void {
        this.initialised = true;
        this.started = true;

        this.effects.forEach((effect) => {
            if (effect.enabled) {
                this.startEffect(effect);
            }
        });
    }

    public update(
        state: ExperienceStateData
    ): void {
        if (!this.started) {
            return;
        }

        this.effects.forEach((effect) => {
            if (!effect.enabled) {
                return;
            }

            effect.update(state);
        });
    }

    public stop(): void {
        this.started = false;

        this.effects.forEach((effect) => {
            try { this.stopEffect(effect); }
            catch (error) { console.error(`Visual effect "${effect.id}" failed during stop().`, error); }
        });
    }

    public destroy(): void {
        this.started = false;
        this.initialised = false;

        this.effects.forEach((effect) => {
            try { this.destroyEffect(effect); }
            catch (error) { console.error(`Visual effect "${effect.id}" failed during destroy().`, error); }
        });

        this.effects.clear();
    }
}
