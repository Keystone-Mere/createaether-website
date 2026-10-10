import type { Experience } from '../models/Experience';
import type { BroadcastSettings } from './BroadcastSettings';
import { createStudioRuntime } from '../studio/StudioRuntime';
import storm from '../../data/experiences/storm.json';

export function createBroadcastController(root: HTMLElement) {
    const stage = root.querySelector<HTMLElement>('.preview-stage')!;
    let runtime: ReturnType<typeof createStudioRuntime> | null = null;
    let motion: string | null = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentSettings: BroadcastSettings | null = null;
    function update(settings: BroadcastSettings, logo = '', guides = false) {
        currentSettings = settings;
        root.dataset.layout = settings.layout; root.dataset.guides = String(guides);
        root.style.setProperty('--show-accent', settings.accent);
        for (const [selector, text] of [['[data-show-title]', settings.show], ['[data-episode]', settings.episode], ['[data-host]', settings.host], ['[data-guest]', settings.guest]]) {
            root.querySelector<HTMLElement>(selector)!.textContent = text;
        }
        const logoImage = root.querySelector<HTMLImageElement>('.broadcast-logo')!;
        logoImage.hidden = !logo; if (logo) logoImage.src = logo; else logoImage.removeAttribute('src');
        const effectiveMotion = reducedMotion.matches ? 'still' : settings.motion;
        root.dataset.motion = effectiveMotion;
        if (motion === effectiveMotion) return;
        motion = effectiveMotion;
        runtime?.destroy(); runtime = null;
        if (motion === 'still') return;
        const experience: Experience = {
            ...storm, sceneId: 'storm', name: settings.show,
            audio: { enabled:false, volume:0, layerVolume:0, track:'' },
            atmosphere: { particles:true, lighting:false, fog:false },
            // The lounge window sits fully inside the existing rain geometry; CSS masks the glass.
            particles: { ...storm.particles, preset:'storm-rain', motion:'rain', count:motion === 'subtle' ? 75 : 150, minSpeed:40, maxSpeed:60, minOpacity:.15, maxOpacity:motion === 'subtle' ? .35 : .6, minLifetime:5, maxLifetime:9 },
            transition: { duration:0, easing:'linear' },
        };
        runtime = createStudioRuntime({ audioElement:null, audioEnabledToggle:null, volumeControl:null, layerVolumeControl:null, volumeValue:null, particlesToggle:null, lightingToggle:null, fogToggle:null, previewStage:stage, previewCanvas:stage.querySelector('canvas'), particlesStatus:null, lightingStatus:null, fogStatus:null });
        runtime.experienceLoader.load(experience);
    }
    function preferenceChanged() { motion = null; if (currentSettings) update(currentSettings, root.querySelector<HTMLImageElement>('.broadcast-logo')?.getAttribute('src') ?? '', root.dataset.guides === 'true'); }
    reducedMotion.addEventListener('change', preferenceChanged);
    return { update, stop() { runtime?.destroy(); runtime=null; motion=null; }, destroy() { runtime?.destroy(); runtime=null; motion=null; reducedMotion.removeEventListener('change', preferenceChanged); } };
}
