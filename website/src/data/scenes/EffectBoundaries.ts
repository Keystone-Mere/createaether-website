import { legacyEffectBoundaries, sceneAsset } from '../assets/SceneRegistry';
export type { ScenePoint, EffectBoundary } from './EffectBoundaryTypes';
export const sceneEffectBoundaries = legacyEffectBoundaries;
export function particleBoundary(sceneId: string | undefined, preset: string, motion: string, backgroundId?: string, assetId?: string) {
  if (assetId !== undefined) {
    if (assetId === 'user-background') return null;
    const asset = sceneAsset(assetId);
    if (asset) return asset.geometry.particles;
    // An unknown explicit asset never borrows a different image's geometry.
    return null;
  }
  if (backgroundId === 'storm-coast' && motion === 'rain') return sceneEffectBoundaries['storm-coast'];
  if (sceneId === 'retreat') return sceneEffectBoundaries.retreat;
  if (preset === 'christmas-snow' && motion === 'snow') return sceneEffectBoundaries.christmas;
  if (preset === 'storm-rain' && motion === 'rain') return sceneEffectBoundaries.storm;
  return null;
}
