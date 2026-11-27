import type { EnvironmentalState } from '../scene-lab/mersey-state';
/** Stationary photographic base with independently advected, fading wavelets. */
export class WaterSurfaceEffect {
 private source=document.createElement('canvas');
 private base=document.createElement('canvas');
 private waves:{x:number;d:number;size:number;speed:number;age:number;life:number;dir:number}[]=[];
 private seed=931;
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 constructor(private image:HTMLImageElement,private mask:HTMLImageElement,private texture:HTMLImageElement){}
 resize(w:number,h:number){
  this.source.width=this.base.width=w;this.source.height=this.base.height=h;
  this.source.getContext('2d')!.drawImage(this.image,0,0,w,h);
  const start=Math.floor(h*608/1152);
  this.base.getContext('2d')!.drawImage(this.texture,0,start,w,h-start);
  if(!this.waves.length) this.waves=Array.from({length:220},()=>({x:this.random(),d:this.random(),size:this.random(),speed:.5+this.random(),age:this.random()*5,life:5+this.random()*7,dir:this.random()*2-1}));
 }
 render(ctx:CanvasRenderingContext2D,dt:number,s:EnvironmentalState){
  const w=this.source.width,h=this.source.height,start=Math.floor(h*608/1152),depth=h-start,k=w/850;
  ctx.clearRect(0,0,w,h);ctx.drawImage(this.base,0,0);
  ctx.globalAlpha=s.reflection*(.28-.18*s.turbulence);
  ctx.drawImage(this.source,0,start,w,depth,0,start,w,depth);ctx.globalAlpha=1;
  const motion=Math.min(1,Math.abs(s.current)+s.wind);
  for(const a of this.waves){
   const d=a.d, speed=(.25+d*.75)*a.speed;
   a.x+=dt*speed*(s.current*.085+s.wind*a.dir*.035);
   a.x=((a.x%1)+1)%1;
   a.age+=dt*motion;
   if(a.age>=a.life){a.age=0;a.d=this.random();a.x=this.random();}
   const x=a.x*w,y=start+a.d*depth;
   const len=Math.min(w-x,k*(8+a.size*42)*(.25+a.d)*s.waveScale),ht=Math.min(h-y,k*(1+a.d*3));
   if(len<1||ht<1)continue;
   const fade=Math.sin(Math.PI*a.age/a.life)*Math.min(1,x/(20*k),(w-x)/(20*k));
   // Local photographic contrast, not full-width displacement.
   ctx.globalAlpha=fade*motion*s.turbulence*.35;
   const sx=Math.max(0,Math.min(w-len,x+k*(a.size-.5)*12));
   ctx.drawImage(this.base,sx,y,len,ht,x,y,len,ht);
   ctx.globalAlpha=fade*motion*s.shimmer*(.08+.22*s.turbulence);
   const g=ctx.createLinearGradient(x,y,x+len,y);g.addColorStop(0,'rgba(165,200,225,0)');g.addColorStop(.5,'rgba(165,200,225,.8)');g.addColorStop(1,'rgba(165,200,225,0)');
   ctx.fillStyle=g;ctx.fillRect(x,y,len,ht*.55);
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.mask,0,0,w,h);ctx.globalCompositeOperation='source-over';
 }
}
