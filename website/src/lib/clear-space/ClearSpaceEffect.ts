import type { ExperienceStateData } from '../ExperienceState';
import type { VisualEffect } from '../visuals/VisualEffect';
import { clearSpaceMask, defaultClearSpace } from './ClearSpace';
/** Separate wrappers preserve existing window masks, clipping and animated fog transforms. */
export class ClearSpaceEffect implements VisualEffect {
    readonly id = 'clear-space'; readonly name = 'Clear space';
    readonly description = 'A soft exclusion area for atmospheric effects';
    readonly version = '1.0.0'; readonly category = 'particles' as const; enabled = true;
    private wrappers: HTMLElement[] = [];
    constructor(private stage: HTMLElement) {}
    initialise() {
        this.stage.querySelectorAll<HTMLElement>('.preview-canvas,.preview-fog,.smoke-canvas').forEach(layer => {
            const wrapper = document.createElement('div');
            wrapper.className = 'clear-space-effect-layer';
            wrapper.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:${getComputedStyle(layer).zIndex}`;
            layer.before(wrapper); wrapper.append(layer); this.wrappers.push(wrapper);
        });
    }
    update(state: ExperienceStateData) {
        const mask = clearSpaceMask(state.clearSpace ?? defaultClearSpace);
        for (const wrapper of this.wrappers) {
            wrapper.style.maskImage = mask; wrapper.style.webkitMaskImage = mask;
        }
    }
    destroy() {
        for (const wrapper of this.wrappers) { wrapper.replaceWith(...Array.from(wrapper.childNodes)); }
        this.wrappers = [];
    }
}
