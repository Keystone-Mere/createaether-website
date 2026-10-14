import forest from '../../data/experiences/forest.json';
import ocean from '../../data/experiences/ocean.json';
import type { Experience } from '../models/Experience';
export interface PilotSettings {scene:'forest'|'ocean'|'abstract';motion:number;brightness:number;volume:number;}
export const pilotDefaults: PilotSettings = {scene:'abstract',motion:0,brightness:65,volume:15};
export function readPilotSettings(value: unknown): PilotSettings {
 const v = value && typeof value === 'object' ? value as Partial<PilotSettings> : {};
 const bounded = (n: unknown, fallback:number, min:number,max:number) => typeof n==='number' && Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
 return {scene:v.scene==='forest'||v.scene==='ocean'?v.scene:'abstract',motion:bounded(v.motion,0,0,100),brightness:bounded(v.brightness,65,20,100),volume:bounded(v.volume,15,0,50)};
}
export function pilotExperience(settings:PilotSettings, sound:boolean, reducedMotion:boolean):Experience {
 const base=structuredClone(settings.scene==='ocean'?ocean:forest) as Experience;
 const motion=reducedMotion?0:settings.motion;
 const scale=motion/100;
 base.name=settings.scene==='abstract'?'Soft colour':settings.scene==='ocean'?'Ocean':'Forest';
 base.atmosphere={particles:motion>0,lighting:false,fog:false};
 base.smoke={enabled:false,amount:0};
 base.audio={...base.audio,enabled:sound,volume:settings.volume,layerVolume:0};
 base.particles={...base.particles,count:settings.scene==='ocean'?Math.round(8+scale*16):Math.round(6+scale*12),minSpeed:base.particles.minSpeed*scale*.45,maxSpeed:base.particles.maxSpeed*scale*.45,drift:base.particles.drift*scale*.4,glow:Math.min(base.particles.glow,1.5),minOpacity:.12,maxOpacity:.3};
 base.transition={duration:0,easing:'linear'};
 return base;
}
