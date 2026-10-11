import { sceneAsset, sceneAssetForSource } from '../../data/assets/SceneRegistry';
import { backgroundAsset, backgroundSource, type BackgroundSelection } from './BackgroundChoices';
/** Apply once before loading effects; normal and fullscreen share this same stage. */
export function applyBackground(stage: HTMLElement, experience: BackgroundSelection) {
  const asset = backgroundAsset(experience);
  stage.dataset.assetId = asset?.id ?? 'user-background';
  stage.dataset.scene = asset?.visualScene ?? 'custom';
  const image = stage.querySelector<HTMLImageElement>('.preview-scene-image');
  if (image) image.src = backgroundSource(experience);
}
/** Story/broadcast images have their own identity, independent of Studio presets. */
export function applyStoryAsset(stage: HTMLElement, src: string, assetId?: string) {
  const asset = assetId ? sceneAsset(assetId) : sceneAssetForSource(src);
  // Do not claim a registered geometry for a different image.
  stage.dataset.assetId = asset?.src === src ? asset.id : 'user-background';
}
export function displayedAssetId(stage: Element | null): string | undefined {
  if (!(stage instanceof HTMLElement)) return undefined;
  if (stage.dataset.assetId) return stage.dataset.assetId;
  // Supports existing scenes which have not migrated to an explicit identity yet.
  const source = typeof stage.querySelector === 'function'
    ? stage.querySelector<HTMLImageElement>('.preview-scene-image')?.getAttribute('src') : null;
  return sceneAssetForSource(source)?.id;
}
