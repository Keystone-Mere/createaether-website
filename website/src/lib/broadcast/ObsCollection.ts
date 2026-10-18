import template from './ObsTemplate.json';
import { broadcastScreens, screenLabels, createBroadcastUrl, validateBroadcast, isLogo, type BroadcastSettings } from './BroadcastSettings';

/** A fresh collection: device choices and credentials never travel with the export. */
export function createObsCollection(value: BroadcastSettings, origin: string, logo = '') {
    const settings = validateBroadcast(value);
    if (logo && !isLogo(logo)) throw new Error('Invalid logo');
    const sources: unknown[] = [];
    const names = broadcastScreens.map(screen => screen === 'live' ? 'Main Show' : screenLabels[screen]);
    for (const [index, screen] of broadcastScreens.entries()) {
        const name = names[index];
        const browser = structuredClone(template.browser);
        browser.name = `Aether — ${name}`; browser.uuid = crypto.randomUUID();
        // Logo stays in the fragment, so it is not sent to the web server.
        const url = createBroadcastUrl({ ...settings, screen }, origin) + (logo ? `&logo=${encodeURIComponent(logo)}` : '');
        Object.assign(browser.settings, { url, width: 1920, height: 1080, fps: 30, reroute_audio: false, shutdown: true, restart_when_active: screen === 'starting' });
        browser.muted = true;
        const scene = structuredClone(template.scene);
        scene.name = name; scene.uuid = crypto.randomUUID();
        const item = structuredClone(template.item);
        item.name = browser.name; item.source_uuid = browser.uuid;
        Object.assign(scene.settings, { items: [item] });
        sources.push(browser, scene);
    }
    return { ...structuredClone(template.collection), name: `Aether — ${settings.show || 'My Show'}`, scene_order: names.map(name => ({ name })), current_scene: names[0], current_program_scene: names[0], sources };
}
