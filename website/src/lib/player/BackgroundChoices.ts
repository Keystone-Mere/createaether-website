import { sceneAssets, sceneAsset, sceneDefinitions, isSceneId } from '../../data/assets/SceneRegistry';
/** The UI and import validator share the exact same registered alternatives. */
export const backgroundChoices = sceneAssets.filter(asset=>asset.role==='alternative').map(asset=>({
  id:asset.id, sceneId:asset.sceneId!, name:asset.name, src:asset.src
}));
export function isBackgroundId(value: unknown): value is string {
  return typeof value === 'string' && backgroundChoices.some(choice=>choice.id===value);
}
export interface BackgroundSelection { id:string; sceneId?:string; background?:string; backgroundId?:string }
export function backgroundAsset(experience: BackgroundSelection) {
  if (experience.background) return undefined;
  const choice = sceneAsset(experience.backgroundId);
  if (choice?.role === 'alternative') return choice;
  const scene = experience.sceneId ?? experience.id.split('-')[0];
  const definition = sceneDefinitions.find(def=>def.id===(isSceneId(scene)?scene:'temple'))!;
  return sceneAsset(definition.defaultAssetId)!;
}
export function backgroundSource(experience: BackgroundSelection): string {
  return experience.background || backgroundAsset(experience)!.src;
}
