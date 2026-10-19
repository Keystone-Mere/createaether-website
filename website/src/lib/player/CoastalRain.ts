import type { Experience } from '../models/Experience';
/** One rain effect outside, plus the existing optional incense plume indoors. */
export function applyCoastalRain(source: Experience): Experience {
  const copy = structuredClone(source) as Experience & { effectLayers?: unknown };
  delete copy.background;
  delete copy.effectLayers;
  copy.backgroundId = 'ocean-pod';
  copy.sceneId = 'ocean';
  copy.particles = { preset:'storm-rain', motion:'rain', count:150, colour:'#b6cddd', glow:0,
    minRadius:.35, maxRadius:.9, minSpeed:40, maxSpeed:50, drift:2,
    minOpacity:.18, maxOpacity:.48, minLifetime:5, maxLifetime:9 };
  copy.atmosphere.particles = true;
  copy.atmosphere.fog = false;
  copy.smoke = { enabled:true, amount:35 };
  copy.lighting = { ...copy.lighting, colour:'#e8c99b', intensity:.25, pulse:false };
  return copy;
}
