import { initialState } from './mersey-state';
import { WaterSurfaceEffect } from '../visuals/WaterSurfaceEffect';
import { registerRuntimeCleanup } from '../runtime/RuntimeLifecycle';
export function mountMersey(root: HTMLElement) {
 const state = {...initialState};
 const canvas = root.querySelector('canvas')!;
 const ctx = canvas.getContext('2d')!;
 const image = root.querySelector('img')!;
 const mask = new Image();
 const texture = new Image();
 texture.src='/scene-lab/mersey/mersey-water-texture.webp';
 const status = root.querySelector<HTMLElement>('[data-status]')!;
 const abort = new AbortController();
 let paused=false, previous=0;
 let raf=0, dead=false, last=0, count=0, sum=0, windowStart=0;
 registerRuntimeCleanup(()=>{dead=true; cancelAnimationFrame(raf); abort.abort();});
 mask.src='/scene-lab/mersey/mersey-water-mask.png';
 Promise.all([image.decode(),mask.decode(),texture.decode()]).then(()=>{
  if(dead) return;
  const effect = new WaterSurfaceEffect(image,mask,texture);
  const resize=()=>{canvas.width=state.width; canvas.height=Math.round(state.width*9/16); effect.resize(canvas.width,canvas.height);};
  resize();
  const controls=Array.from(root.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-param]'));
  const sync=()=>{for(const el of controls){const key=el.dataset.param as keyof typeof state;state[key]=Number(el.value);const out=root.querySelector<HTMLElement>(`[data-value="${key}"]`);if(out)out.textContent=key==='current'||key==='waveScale'?state[key].toFixed(2):Math.round(state[key]*100)+'%';}};
  sync();resize();
  for(const el of controls)el.addEventListener('input',()=>{sync();if(el.dataset.param==='width')resize();},{signal:abort.signal});
  const pause=root.querySelector<HTMLButtonElement>('[data-pause]')!;
  pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Resume animation':'Pause animation';},{signal:abort.signal});
  root.querySelector('[data-reset]')?.addEventListener('click',()=>{for(const el of controls)el.value=String(initialState[el.dataset.param as keyof typeof state]);sync();resize();paused=false;pause.textContent='Pause animation';},{signal:abort.signal});
  root.querySelector('[data-fullscreen]')?.addEventListener('click',()=>{if(document.fullscreenElement) void document.exitFullscreen(); else void root.querySelector<HTMLElement>('[data-stage]')?.requestFullscreen().catch(()=>{status.textContent='Fullscreen unavailable';});},{signal:abort.signal});
  const tick=(now:number)=>{
   if(dead)return;
   if(!windowStart) windowStart=now;
   if(now-last>=1000/state.fps-1){
    last=now; const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now; const begin=performance.now(); effect.render(ctx,paused?0:dt,state); sum+=performance.now()-begin; count++;
   }
   if(now-windowStart>=1000){status.textContent=`${(count*1000/(now-windowStart)).toFixed(1)} FPS | ${(sum/Math.max(1,count)).toFixed(1)} ms CPU draw | ${canvas.width} × ${canvas.height}`; count=0;sum=0;windowStart=now;}
   raf=requestAnimationFrame(tick);
  }; raf=requestAnimationFrame(tick);
 }).catch((error)=>{console.error("Mersey initialisation",error);if(!dead)status.textContent='Unable to load Mersey assets';});
}
