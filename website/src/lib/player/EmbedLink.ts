import type { Experience } from '../models/Experience';
import { validatePlayback } from './PlaybackLink';
import { audioTracks } from '../../data/audio/tracks';
import { isBackground } from './Background';
const limit=(v:number)=>Math.min(100,Math.max(0,v));
export function validateEmbed(value:unknown): Experience {
 const clean=validatePlayback(value);
 const original=value as Experience;
 const track=audioTracks.find(track=>track.id===original.audio.track);
 if(!track)throw new Error('Choose an Aether audio track before exporting.');
 clean.audio={enabled:original.audio.enabled,volume:limit(original.audio.volume),layerVolume:limit(original.audio.layerVolume??0),track:track.id};
 return clean;
}
function originOnly(origin:string) {
 const url=new URL(origin);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Invalid website origin');
 return url.origin;
}
export function createEmbedUrl(experience:Experience,origin:string):string {
 const json=JSON.stringify({v:1,type:'embed',experience:validateEmbed(experience)});
 const encoded=btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(encoded.length>12000)throw new Error('Scene settings are too large to embed.');
 return `${originOnly(origin)}/embed/#${encoded}`;
}
export function readEmbedHash(hash:string):Experience {
 const encoded=hash.replace(/^#/,'');
 if(!encoded||encoded.length>12000||!/^[A-Za-z0-9_-]+$/.test(encoded))throw new Error('Invalid embed link');
 const binary=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
 const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
 if(payload?.v!==1||payload?.type!=='embed')throw new Error('Unsupported embed');
 return validateEmbed(payload.experience);
}
const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function createIframeCode(url:string,name:string):string {
 const parsed=new URL(url);
 if(!['http:','https:'].includes(parsed.protocol)||parsed.pathname!=='/embed/'||parsed.username||parsed.password)throw new Error('Invalid embed URL');
 readEmbedHash(parsed.hash);
 return `<iframe src="${escape(parsed.href)}" title="${escape(name.slice(0,120))} — Aether scene" width="100%" height="450" loading="lazy" allow="fullscreen" allowfullscreen style="display:block;border:0;border-radius:12px;max-width:100%"></iframe>`;
}
export function createEmbedHtml(url:string,background:string):string {
 if(!isBackground(background))throw new Error('Invalid background');
 createIframeCode(url,'Aether');
 const literal=(value:string)=>JSON.stringify(value).replace(/</g,'\\u003c');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aether scene</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;overflow:hidden;background:#000}</style></head><body><iframe title="Aether scene" allow="fullscreen" allowfullscreen></iframe><script>const frame=document.querySelector('iframe');const origin=${literal(new URL(url).origin)};window.addEventListener('message',event=>{if(event.source===frame.contentWindow&&event.origin===origin&&event.data==='aether-embed-ready')frame.contentWindow.postMessage({type:'aether-embed-background',image:${literal(background)}},origin)});frame.src=${literal(url)};</script></body></html>`;
}
