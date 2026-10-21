import { cameraFrames } from './CameraPlacement';
import { sceneAsset } from '../../data/assets/SceneRegistry';
import type { Experience } from '../models/Experience';
import { broadcastFraming, type BroadcastSettings } from './BroadcastSettings';
import { createStudioRuntime } from '../studio/StudioRuntime';
import storm from '../../data/experiences/storm.json';

export function createBroadcastController(root: HTMLElement) {
    const stage = root.querySelector<HTMLElement>('.preview-stage')!;
    let runtime: ReturnType<typeof createStudioRuntime> | null = null;
    let motion: string | null = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentSettings: BroadcastSettings | null = null;
    let countdownKey = '';
    let countdownEnd = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    const countdownNode = root.querySelector<HTMLElement>('[data-countdown]')!;
    function clearTimer() { if (timer !== null) clearInterval(timer); timer = null; }
    function tick() {
        const remaining = Math.max(0, Math.ceil((countdownEnd - Date.now()) / 1000));
        countdownNode.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
        if (remaining === 0) clearTimer();
    }
    function syncCountdown(settings: BroadcastSettings, restart = false) {
        const enabled = settings.screen === 'starting' && settings.countdown;
        const key = `${enabled}:${settings.countdownSeconds}`;
        countdownNode.hidden = !enabled;
        if (!restart && countdownKey === key) return;
        countdownKey = key; clearTimer();
        if (enabled) { countdownEnd = Date.now() + settings.countdownSeconds * 1000; tick(); timer = setInterval(tick, 250); }
    }
    function update(settings: BroadcastSettings, logo = '', guides = false) {
        currentSettings = settings;
        const frames = cameraFrames(settings);
        root.querySelectorAll<HTMLElement>('.broadcast-camera').forEach((node, index) => {
            const frame = frames[index];
            if (!frame) return;
            Object.assign(node.style, { left: `${frame.x / 1920 * 100}%`, top: `${frame.y / 1080 * 100}%`, width: `${frame.width / 1920 * 100}%`, height: `${frame.width * 9 / 16 / 1080 * 100}%` });
        });
        root.dataset.screen = settings.screen;
        root.dataset.brandPosition = settings.brandPosition;
        root.style.setProperty('--brand-scale', String(settings.brandSize / 100));
        root.querySelector<HTMLElement>('[data-screen-message]')!.textContent = settings.messages[settings.screen];
        root.querySelector<HTMLElement>('[data-social]')!.textContent = settings.social;
        syncCountdown(settings);
        root.dataset.layout = settings.layout; root.dataset.guides = String(guides);
        root.dataset.framing = broadcastFraming(settings.background);
        root.style.setProperty('--show-accent', settings.accent);
        for (const [selector, text] of [['[data-show-title]', settings.show], ['[data-episode]', settings.episode], ['[data-host]', settings.host], ['[data-guest]', settings.guest]]) {
            root.querySelector<HTMLElement>(selector)!.textContent = text;
        }
        const logoImage = root.querySelector<HTMLImageElement>('.broadcast-logo')!;
        logoImage.hidden = !logo; if (logo) logoImage.src = logo; else logoImage.removeAttribute('src');
        const asset = sceneAsset(settings.background)!;
        stage.dataset.assetId = asset.id;
        stage.dataset.scene = 'custom';
        stage.setAttribute('aria-label', `${asset.name} show background`);
        const image = stage.querySelector<HTMLImageElement>('.preview-scene-image')!;
        if (image.getAttribute('src') !== asset.src) image.src = asset.src;
        root.querySelector<HTMLElement>('.broadcast-scene-credit')!.textContent = asset.name;
        const effectiveMotion = reducedMotion.matches || settings.background !== 'wirral-liverpool' ? 'still' : settings.motion;
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
    return { update, restartCountdown() { if (currentSettings) syncCountdown(currentSettings, true); }, stop() { clearTimer(); countdownKey=""; runtime?.destroy(); runtime=null; motion=null; }, destroy() { clearTimer(); countdownKey=""; runtime?.destroy(); runtime=null; motion=null; reducedMotion.removeEventListener('change', preferenceChanged); } };
}
