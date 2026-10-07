/** Raster images only; bounded so saved projects cannot exhaust storage unexpectedly. */
export function isBackground(value: unknown): value is string {
    return typeof value === 'string' && value.length <= 900000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export async function prepareBackground(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.');
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, 1920 / bitmap.width, 1080 / bitmap.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.85, 0.7, 0.55, 0.4]) {
            const result = canvas.toDataURL('image/jpeg', quality);
            if (isBackground(result)) return result;
        }
        throw new Error('This image is too detailed to save. Try a smaller image.');
    } finally { bitmap.close(); }
}

export function createBackdropHtml(url: string, background: string): string {
    if (!isBackground(background)) throw new Error('Invalid background');
    const origin = new URL(url).origin;
    // All dynamic values are JSON literals; escape HTML delimiters inside the script.
    const literal = (value: string) => JSON.stringify(value).replace(/</g, '\\u003c');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Aether OBS Backdrop</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;overflow:hidden;background:#000}</style></head><body><iframe title="Aether backdrop"></iframe><script>const frame=document.querySelector('iframe');const origin=${literal(origin)};window.addEventListener('message',event=>{if(event.source===frame.contentWindow&&event.origin===origin&&event.data==='aether-background-ready')frame.contentWindow.postMessage({type:'aether-background',image:${literal(background)}},origin)});frame.src=${literal(url)};</script></body></html>`;
}
