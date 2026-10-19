import type {ExperienceStateData} from '../ExperienceState';
import type {CanvasRenderer,CanvasRenderFrame} from '../rendering/CanvasRenderer';
import type {VisualEffect} from './VisualEffect';
import {sceneImageRect} from '../rendering/SceneImageGeometry';
import {sceneAsset} from '../../data/assets/SceneRegistry';
import {clipEffectBoundary} from '../rendering/EffectBoundary';
/** Sea mist is clipped to the lighthouse opening, independent of indoor surfaces. */
export class CoastalMistEffect implements VisualEffect {
 readonly id='coastal-mist';readonly name='Coastal sea mist';readonly description='Soft mist beyond the lighthouse arch';readonly version='1.2.0';readonly category='fog' as const;enabled=true;
 private active=false;private density=.3;private speed=.18;private colour='#d8e1e3';private time=0;private unregister:(()=>void)|null=null;
 constructor(private renderer:CanvasRenderer,private stage:HTMLElement){}
 initialise(){this.unregister??=this.renderer.register(this);}start(){this.renderer.start();}
 update(state:ExperienceStateData){this.active=state.atmosphere.fog&&state.fog.preset==='coastal-sea-mist';this.density=state.fog.density;this.speed=state.fog.speed;this.colour=/^#[a-f0-9]{6}$/i.test(state.fog.colour)?state.fog.colour:'#d8e1e3';}
 render(frame:CanvasRenderFrame){
  if(!this.active||this.stage.dataset.assetId!=='lighthouse-retreat')return;
  const image=this.stage.querySelector<HTMLImageElement>('.preview-scene-image');const boundary=sceneAsset('lighthouse-retreat')?.geometry.particles;
  if(!image?.naturalWidth||!image.naturalHeight||!boundary)return;
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden)this.time+=Math.min(frame.deltaTime/1000,.05)*this.speed;
  const rect=sceneImageRect(frame.width,frame.height,image.naturalWidth,image.naturalHeight,getComputedStyle(image).objectFit),ctx=frame.context;
  ctx.save();ctx.translate(rect.x,rect.y);ctx.scale(rect.width/960,rect.height/540);clipEffectBoundary(ctx,boundary,960,540);
  const rgb=[1,3,5].map(index=>parseInt(this.colour.slice(index,index+2),16)).join(',');
  // Amount controls opacity and bank thickness. The upper range deliberately
  // obscures the rocks and water, rather than remaining a faint surface shimmer.
  const amount=Math.max(0,Math.min(1,this.density));
  for(let i=0;i<24;i++){
   const phase=((i/24+this.time*.15)%1+1)%1;
   const x=220+phase*560;
   const y=252+(i%5)*27+Math.sin(this.time*.9+i*1.9)*15;
   const width=85+(i%3)*30+amount*25,height=14+(i%4)*5+amount*13;
   const fade=Math.sin(Math.PI*phase)**2;
   ctx.save();ctx.translate(x,y);ctx.scale(width,height);
   const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
   gradient.addColorStop(0,`rgba(${rgb},${amount*.96*fade})`);
   gradient.addColorStop(.55,`rgba(${rgb},${amount*.72*fade})`);
   gradient.addColorStop(1,`rgba(${rgb},0)`);
   ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  ctx.restore();
 }
 stop(){this.active=false;}destroy(){this.active=false;this.unregister?.();this.unregister=null;}
}
