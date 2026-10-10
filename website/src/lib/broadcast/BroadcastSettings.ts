export type Layout = 'duo' | 'solo' | 'background';
export type Motion = 'still' | 'subtle' | 'atmospheric';
export interface BroadcastSettings {
    show: string; episode: string; host: string; guest: string;
    accent: string; layout: Layout; motion: Motion;
}
export const defaultBroadcast: BroadcastSettings = {
    show: 'The Evening Conversation', episode: 'Good conversations. A little space to unwind.',
    host: 'Host', guest: 'Guest', accent: '#d6ad72', layout: 'duo', motion: 'subtle',
};
export function validateBroadcast(value: unknown): BroadcastSettings {
    if (!value || typeof value !== 'object') throw new Error('Invalid show settings');
    const v = value as Record<string, unknown>;
    const text = (key: string, limit: number) => {
        if (typeof v[key] !== 'string') throw new Error('Invalid show text');
        return (v[key] as string).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, limit);
    };
    if (typeof v.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.accent)) throw new Error('Invalid accent');
    if (!['duo', 'solo', 'background'].includes(v.layout as string) || !['still', 'subtle', 'atmospheric'].includes(v.motion as string)) throw new Error('Invalid layout or motion');
    return { show: text('show', 80), episode: text('episode', 120), host: text('host', 40), guest: text('guest', 40), accent: v.accent, layout: v.layout as Layout, motion: v.motion as Motion };
}
export function createBroadcastUrl(settings: BroadcastSettings, origin: string): string {
    const json = JSON.stringify({ v: 1, show: validateBroadcast(settings) });
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${origin}/broadcast/#${encoded}`;
}
export function readBroadcastHash(hash: string): BroadcastSettings {
    const encoded = hash.replace(/^#/, '');
    if (!encoded || encoded.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Invalid show link');
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
    if (data?.v !== 1) throw new Error('Unsupported show link');
    return validateBroadcast(data.show);
}
export function isLogo(value: unknown): value is string {
    return typeof value === 'string' && value.length < 100000 && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export async function prepareLogo(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP logo smaller than 5 MB.');
    const bitmap = await createImageBitmap(file);
    try {
        for (const size of [256, 192, 128, 96]) {
            const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const result = canvas.toDataURL('image/png');
            if (isLogo(result)) return result;
        }
        throw new Error('Try a simpler logo image.');
    } finally { bitmap.close(); }
}
/** Logos travel in a local OBS wrapper so browser-source URLs stay short. */
export function createBroadcastHtml(url: string, logo: string): string {
    if (logo && !isLogo(logo)) throw new Error('Invalid logo');
    const origin = new URL(url).origin;
    const literal = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Aether Show</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;overflow:hidden;background:#000}</style></head><body><iframe title="Aether show setting"></iframe><script>const frame=document.querySelector('iframe'),origin=${literal(origin)},logo=${literal(logo)};window.addEventListener('message',event=>{if(event.source===frame.contentWindow&&event.origin===origin&&event.data==='aether-show-ready')frame.contentWindow.postMessage({type:'aether-show-logo',logo},origin)});frame.src=${literal(url)};</script></body></html>`;
}
