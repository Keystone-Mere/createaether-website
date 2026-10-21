/** Frame coordinates on the 1920 × 1080 broadcast canvas. Width fixes a 16:9 ratio. */
export interface CameraFrame { x: number; y: number; width: number; }
export interface CameraLayouts { solo?: CameraFrame[]; duo?: CameraFrame[]; }
export const MIN_CAMERA_WIDTH = 320;
export const MAX_CAMERA_WIDTH = 1600;
export const CAMERA_BOTTOM = 1000; // Leave room for the name label below the frame.
export function constrainCamera(frame: CameraFrame): CameraFrame {
    const width = Math.max(MIN_CAMERA_WIDTH, Math.min(MAX_CAMERA_WIDTH, Math.round(frame.width / 16) * 16));
    return { width, x: Math.round(Math.max(0, Math.min(1920 - width, frame.x))), y: Math.round(Math.max(0, Math.min(Math.floor(CAMERA_BOTTOM - width * 9 / 16), frame.y))) };
}
export function validateCameraLayouts(value: unknown): CameraLayouts {
    if (value === undefined) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid camera positions');
    const result: CameraLayouts = {};
    for (const layout of ['solo', 'duo'] as const) {
        const frames = (value as Record<string, unknown>)[layout];
        if (frames === undefined) continue;
        if (!Array.isArray(frames) || frames.length !== (layout === 'solo' ? 1 : 2)) throw new Error('Invalid camera positions');
        result[layout] = frames.map(value => {
            if (!value || typeof value !== 'object') throw new Error('Invalid camera position');
            const f = value as CameraFrame;
            if (![f.x, f.y, f.width].every(n => typeof n === 'number' && Number.isFinite(n))) throw new Error('Invalid camera position');
            const clean = constrainCamera(f);
            if (clean.x !== f.x || clean.y !== f.y || clean.width !== f.width) throw new Error('Camera position is outside the canvas');
            return clean;
        });
    }
    return result;
}
