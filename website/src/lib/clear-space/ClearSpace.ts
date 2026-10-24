/** Percentages of the displayed stage; the ellipse is fully clear inside its boundary. */
export interface ClearSpace { enabled: boolean; x: number; y: number; width: number; height: number; }
export const defaultClearSpace: ClearSpace = { enabled:false, x:50, y:65, width:34, height:58 };
export function isClearSpace(value: unknown): value is ClearSpace {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const v = value as Record<string, unknown>;
    return typeof v.enabled === 'boolean' && ['x','y','width','height'].every(key =>
        typeof v[key] === 'number' && Number.isFinite(v[key]) && (v[key] as number) >= (key === 'width' || key === 'height' ? 5 : 0) && (v[key] as number) <= 100);
}
export function suggestedClearSpace(assetId = ''): ClearSpace {
    const lower = ['temple','temple-original','ocean-pod','bamboo-rain-pavilion','lighthouse-retreat'].includes(assetId);
    return { ...defaultClearSpace, y: lower ? 72 : 65 };
}
export function clearSpaceMask(space: ClearSpace): string {
    return space.enabled ? `radial-gradient(ellipse ${space.width / 2}% ${space.height / 2}% at ${space.x}% ${space.y}%, transparent 100%, #000 125%)` : 'none';
}
