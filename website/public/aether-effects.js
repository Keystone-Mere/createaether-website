/* Aether page effects v1 — transparent snowfall, optional click-to-play audio. */
(function () {
 'use strict';
 const script=document.currentScript;
 if(!script||window.AetherPageEffects)return;
 let config;try{config=JSON.parse(script.getAttribute('data-aether-effects')||'{}');}catch{return;}
 if(!config||typeof config!=='object'||Array.isArray(config))return;
 const clamp=(value,fallback,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
 const amount=clamp(config.count,80,0,300),speed=clamp(config.speed,60,5,180);
 const colour=typeof config.colour==='string'&&/^#[a-f0-9]{6}$/i.test(config.colour)?config.colour:'#ffffff';
 let audioUrl='';
 try{const base=new URL(script.src,location.href);const url=new URL(config.audioSrc,base);if(typeof config.audioSrc==='string'&&['http:','https:'].includes(url.protocol)&&url.origin===base.origin&&/^\/audio\/[^/]+\.mp3$/.test(url.pathname)&&!url.search&&!url.hash)audioUrl=url.href;}catch{}
 function mount(){
  if(!document.body)return;
  const host=document.createElement('div');host.setAttribute('data-aether-page-effects','');
  host.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483000;background:transparent;';
  const shadow=host.attachShadow({mode:'open'});
  const style=document.createElement('style');style.textContent=':host{color-scheme:dark}canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent}.controls{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100% - 24px);pointer-events:auto}button{border:1px solid #94a3b8;border-radius:8px;padding:8px 12px;min-height:40px;background:#0f172ae8;color:#fff;font:14px/1.4 system-ui;cursor:pointer}button:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}.status{position:absolute;right:12px;bottom:60px;max-width:300px;padding:8px;background:#0f172aeb;color:white;border-radius:8px;font:14px/1.4 system-ui}.status:empty{display:none}';
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
  const controls=document.createElement('div');controls.className='controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Page effects');
  const toggle=document.createElement('button');toggle.type='button';controls.append(toggle);
  const status=document.createElement('div');status.className='status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  shadow.append(style,canvas,controls,status);document.body.append(host);
  const ctx=canvas.getContext('2d');if(!ctx){host.remove();return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let enabled=!reduced.matches;
  let width=0,height=0,dpr=1,flakes=[],raf=0,last=0,destroyed=false;
  let audio=null,audioButton=null;
  const updateToggle=()=>{toggle.textContent=enabled?'Pause snow':'Enable snow';toggle.setAttribute('aria-pressed',String(enabled));};
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(300,Math.round(amount*Math.min(1.5,width*height/(1280*720))));flakes=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,r:1+Math.random()*3,v:.5+Math.random()*.8,phase:Math.random()*Math.PI*2}));}
  function frame(time){raf=0;if(destroyed||!enabled||document.hidden)return;const dt=last?Math.min((time-last)/1000,.05):0;last=time;ctx.clearRect(0,0,width,height);ctx.fillStyle=colour;ctx.shadowColor='#334155';ctx.shadowBlur=2;
   for(const f of flakes){f.phase+=dt*.6;f.y+=speed*f.v*dt;f.x+=Math.sin(f.phase)*10*dt;if(f.y>height+5){f.y=-5;f.x=Math.random()*width;}if(f.x>width+5)f.x=-5;if(f.x< -5)f.x=width+5;ctx.globalAlpha=.5+f.v*.3;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;raf=requestAnimationFrame(frame);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
  function start(){if(!raf&&enabled&&!document.hidden&&!destroyed)raf=requestAnimationFrame(frame);}
  toggle.addEventListener('click',()=>{enabled=!enabled;updateToggle();if(enabled)start();else{stop();ctx.clearRect(0,0,width,height);}});
  if(audioUrl){audio=new Audio();audio.loop=true;audio.preload='none';audio.volume=clamp(config.volume,30,0,100)/100;audioButton=document.createElement('button');audioButton.type='button';audioButton.textContent='Play audio';audioButton.setAttribute('aria-pressed','false');controls.append(audioButton);const update=()=>{audioButton.textContent=audio.paused?'Play audio':'Pause audio';audioButton.setAttribute('aria-pressed',String(!audio.paused));};audio.addEventListener('play',update);audio.addEventListener('pause',update);audio.addEventListener('error',()=>{audio.pause();status.textContent='Audio could not load.';});audioButton.addEventListener('click',async()=>{if(!audio.paused){audio.pause();return;}try{if(!audio.src)audio.src=audioUrl;await audio.play();status.textContent='';}catch{status.textContent='Audio could not start. Try again.';}});}
  const visibility=()=>{if(document.hidden){stop();audio?.pause();}else start();};
  const changeMotion=()=>{enabled=!reduced.matches;updateToggle();stop();ctx.clearRect(0,0,width,height);start();};
  const pagehide=event=>{if(event.persisted){stop();audio?.pause();}else destroy();};const pageshow=()=>start();
  function destroy(){if(destroyed)return;destroyed=true;stop();audio?.pause();if(audio){audio.removeAttribute('src');audio.load();}host.remove();removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',changeMotion);removeEventListener('pagehide',pagehide);removeEventListener('pageshow',pageshow);delete window.AetherPageEffects;}
  addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',changeMotion);addEventListener('pagehide',pagehide);addEventListener('pageshow',pageshow);
  window.AetherPageEffects={destroy};resize();updateToggle();start();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
