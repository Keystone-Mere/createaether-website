import type { BroadcastSettings } from './BroadcastSettings';
import { cameraFrames } from './CameraPlacement';
import { constrainCamera, type CameraLayouts, type CameraFrame } from './CameraGeometry';

/** Editor-only interactions. Clean playback never attaches this module. */
export function attachCameraEditor(root: HTMLElement, read: () => BroadcastSettings, write: (layouts: CameraLayouts) => void) {
    const toggle = document.querySelector<HTMLButtonElement>('#camera-edit-toggle')!;
    const panel = document.querySelector<HTMLElement>('#camera-adjustments')!;
    const select = document.querySelector<HTMLSelectElement>('#camera-selection')!;
    const status = document.querySelector<HTMLElement>('#camera-edit-status')!;
    const reset = document.querySelector<HTMLButtonElement>('#camera-reset')!;
    const fields = Object.fromEntries(['x', 'y', 'width'].map(key => [key, document.querySelector<HTMLInputElement>(`#camera-${key}`)!])) as Record<keyof CameraFrame, HTMLInputElement>;
    const nodes = [...root.querySelectorAll<HTMLElement>('.broadcast-camera')];
    let editing = false, selected = 0;
    let drag: { id: number; node: HTMLElement; x: number; y: number; scale: number; start: CameraFrame; resize: boolean; layouts: CameraLayouts } | null = null;
    const abort = new AbortController();
    const options = { signal: abort.signal };
    nodes.forEach((node, index) => {
        const handle = document.createElement('span');
        handle.className = 'camera-resize-handle'; handle.setAttribute('aria-hidden', 'true');
        node.append(handle);
        node.setAttribute('aria-label', `${index ? 'Guest' : 'Host'} frame. Arrow keys move. Shift and Left or Right resize.`);
        node.addEventListener('pointerdown', event => {
            if (!editing || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
            const settings = read(), frames = cameraFrames(settings);
            if (!frames[index]) return;
            selected = index; select.value = String(index); node.focus();
            drag = { id: event.pointerId, node, x: event.clientX, y: event.clientY, scale: 1920 / root.getBoundingClientRect().width, start: constrainCamera(frames[index]), resize: (event.target as HTMLElement).classList.contains('camera-resize-handle'), layouts: structuredClone(settings.cameraLayouts ?? {}) };
            node.setPointerCapture(event.pointerId); sync(); event.preventDefault();
        }, options);
        node.addEventListener('pointermove', event => {
            if (!drag || drag.node !== node || drag.id !== event.pointerId) return;
            const dx = (event.clientX - drag.x) * drag.scale, dy = (event.clientY - drag.y) * drag.scale;
            change(drag.resize ? { ...drag.start, width: Math.min(1920 - drag.start.x, (1000 - drag.start.y) * 16 / 9, drag.start.width + dx) } : { ...drag.start, x: drag.start.x + dx, y: drag.start.y + dy });
        }, options);
        const finish = (event: PointerEvent) => { if (drag?.id === event.pointerId) drag = null; };
        node.addEventListener('pointerup', finish, options);
        node.addEventListener('pointercancel', () => { if (drag) { const previous = drag.layouts; drag = null; write(previous); } }, options);
        node.addEventListener('lostpointercapture', finish, options);
        node.addEventListener('keydown', event => {
            if (!editing) return;
            if (event.key === 'Escape') { editing = false; drag = null; sync(); toggle.focus(); event.preventDefault(); return; }
            const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
            if (!delta) return;
            selected = index;
            const frame = constrainCamera(cameraFrames(read())[index]);
            if (event.shiftKey && delta[0]) change({ ...frame, width: frame.width + delta[0] * 16 });
            else if (!event.shiftKey) change({ ...frame, x: frame.x + delta[0] * 8, y: frame.y + delta[1] * 8 });
            event.preventDefault();
        }, options);
    });
    function change(frame: CameraFrame) {
        const settings = read();
        if (settings.screen !== 'live' || settings.layout === 'background') return;
        const frames = cameraFrames(settings).map(constrainCamera);
        frames[selected] = constrainCamera(frame);
        write({ ...settings.cameraLayouts, [settings.layout]: frames });
    }
    function sync() {
        const settings = read(), frames = cameraFrames(settings);
        const available = settings.screen === 'live' && frames.length > 0;
        if (!available) { editing = false; drag = null; }
        selected = Math.min(selected, Math.max(0, frames.length - 1));
        toggle.closest<HTMLElement>('.camera-edit-toolbar')!.hidden = !available;
        toggle.hidden = !available; toggle.setAttribute('aria-pressed', String(editing));
        toggle.textContent = editing ? 'Finish positioning' : 'Position cameras';
        panel.hidden = !editing; root.dataset.cameraEditing = String(editing);
        select.querySelector<HTMLOptionElement>('option[value="1"]')!.disabled = frames.length < 2;
        select.value = String(selected);
        nodes.forEach((node, i) => { node.tabIndex = editing && i < frames.length ? 0 : -1; node.classList.toggle('camera-selected', editing && i === selected); });
        if (!editing || !frames[selected]) return;
        const frame = constrainCamera(frames[selected]);
        for (const key of ['x', 'y', 'width'] as const) { if (document.activeElement !== fields[key]) fields[key].value = String(frame[key]); }
        fields.x.max = String(1920 - frame.width); fields.y.max = String(Math.floor(1000 - frame.width * 9 / 16));
        status.textContent = `${selected ? 'Guest' : 'Host'} frame · X ${frame.x}, Y ${frame.y} · ${frame.width} × ${frame.width * 9 / 16}`;
    }
    toggle.addEventListener('click', () => { editing = !editing; sync(); }, options);
    select.addEventListener('change', () => { selected = Number(select.value); sync(); }, options);
    for (const key of ['x', 'y', 'width'] as const) {
        fields[key].addEventListener('input', () => {
            if (fields[key].value === '' || !Number.isFinite(fields[key].valueAsNumber)) return;
            change({ ...constrainCamera(cameraFrames(read())[selected]), [key]: fields[key].valueAsNumber });
        }, options);
        fields[key].addEventListener('blur', () => { const frame = cameraFrames(read())[selected]; if (frame) fields[key].value = String(constrainCamera(frame)[key]); }, options);
    }
    reset.addEventListener('click', () => {
        const settings = read(); if (settings.layout === 'background') return;
        const layouts = { ...settings.cameraLayouts }; delete layouts[settings.layout]; write(layouts);
    }, options);
    return { sync, destroy() { abort.abort(); drag = null; } };
}
