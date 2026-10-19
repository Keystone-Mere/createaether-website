import type { Experience } from '../models/Experience';
import { applyCoastalRain } from './CoastalRain';
/** Apply weather only when selecting a recognised background, never on saved-scene load. */
export function applyWeatherBackground(source: Experience, backgroundId: string): Experience {
  if (backgroundId === 'ocean-pod') return applyCoastalRain(source);
  if (!['bamboo-rain-pavilion', 'indoor-snow-cabin'].includes(backgroundId)) return source;
  const copy = structuredClone(source) as Experience & { effectLayers?: unknown };
  delete copy.background;
  delete copy.effectLayers;
  copy.backgroundId = backgroundId;
  copy.sceneId = backgroundId === 'bamboo-rain-pavilion' ? 'forest' : 'retreat';
  copy.atmosphere.particles = true;
  copy.atmosphere.fog = false;
  copy.smoke = { enabled:false, amount:35 };
  copy.lighting = { ...copy.lighting, colour:'#eee2ce', intensity:.18, pulse:false };
  copy.particles = backgroundId === 'bamboo-rain-pavilion'
    ? { preset:'storm-rain', motion:'rain', count:180, colour:'#b6cddd', glow:0,
        minRadius:.35, maxRadius:.9, minSpeed:40, maxSpeed:50, drift:2,
        minOpacity:.18, maxOpacity:.48, minLifetime:5, maxLifetime:9 }
    : { preset:'retreat-snow', motion:'snow', count:100, colour:'#ffffff', glow:0,
        minRadius:.8, maxRadius:2.2, minSpeed:6, maxSpeed:15, drift:3,
        minOpacity:.35, maxOpacity:.7, minLifetime:12, maxLifetime:25 };
  return copy;
}
