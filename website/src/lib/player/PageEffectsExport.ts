import {audioTracks} from '../../data/audio/tracks';
export interface PageEffectsOptions {count:number;speed:number;colour:string;audioTrack?:string;volume?:number;}
const escape=(text:string)=>text.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function createPageEffectsCode(options:PageEffectsOptions,origin:string):string {
 const base=new URL(origin);
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw new Error('Invalid website origin');
 if(![options.count,options.speed].every(Number.isFinite)||!/^#[a-f0-9]{6}$/i.test(options.colour))throw new Error('Invalid snow settings');
 const track=options.audioTrack?audioTracks.find(track=>track.id===options.audioTrack):undefined;
 if(options.audioTrack&&!track)throw new Error('Choose an Aether audio track');
 const config={count:Math.round(Math.min(300,Math.max(0,options.count))),speed:Math.min(180,Math.max(5,options.speed)),colour:options.colour,...(track?{audioSrc:track.src,volume:Number.isFinite(options.volume)?Math.min(100,Math.max(0,options.volume!)):30}:{})};
 return `<script defer src="${escape(base.origin)}/aether-effects.js" data-aether-effects="${escape(JSON.stringify(config))}"></script>`;
}
