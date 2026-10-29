export type TropicalPhase = 'warm' | 'shower' | 'downpour';
const targets = { warm: { rain:0, mist:.38 }, shower: { rain:.24, mist:.7 }, downpour: { rain:1, mist:1 } };
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const rand=(a:number,b:number)=>a+Math.random()*(b-a);

/** Experimental tropical weather, isolated from saved experiences and the shared rain preset. */
export function createTropicalWeather(canvas:HTMLCanvasElement, onPhase:(phase:TropicalPhase,playing:boolean)=>void) {
 const ctx=canvas.getContext('2d');
 if(!ctx) throw new Error('Canvas unavailable');
 const W=1280,H=720;
 let phase:TropicalPhase='shower',rain=.24,mist=.7,enabled=false,sequence=false,elapsed=0,time=0,last=0,raf=0,destroyed=false;
 const drops=Array.from({length:920},()=>newDrop(true));
 const wisps=Array.from({length:34},()=>newWisp(true));
 // Pre-render irregular, soft cloud fragments once; avoid filters and gradients per frame.
 const sprites=Array.from({length:5},()=>{
  const image=document.createElement('canvas');image.width=192;image.height=128;
  const c=image.getContext('2d')!;
  for(let i=0;i<14;i++){
   const x=rand(48,144),y=rand(35,94),r=rand(18,48);
   const gradient=c.createRadialGradient(x,y,0,x,y,r);
   gradient.addColorStop(0,'rgba(222,235,226,.13)');gradient.addColorStop(.45,'rgba(222,235,226,.07)');gradient.addColorStop(1,'rgba(222,235,226,0)');
   c.fillStyle=gradient;c.fillRect(x-r,y-r,r*2,r*2);
  }return image;
 });
 function newDrop(initial=false){const depth=Math.random();return{x:rand(150,1150),y:initial?rand(100,510):rand(65,110),depth,speed:rand(620,1250)*mix(.55,1.25,depth),length:rand(7,21)*mix(.55,1.35,depth),alpha:rand(.12,.48),weight:Math.random()};}
 function newWisp(initial=false){const life=rand(5,11);return{x:rand(210,1050),y:rand(412,490),age:initial?rand(0,life):0,life,rise:rand(12,28),drift:rand(-9,11),width:rand(155,310),height:rand(70,140),seed:rand(0,7),sprite:Math.floor(rand(0,5))};}
 function resize(){const box=canvas.getBoundingClientRect();const ratio=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(box.width*ratio));canvas.height=Math.max(1,Math.round(box.height*ratio));draw(0);}
 function draw(dt:number){
  ctx!.setTransform(1,0,0,1,0,0);ctx!.clearRect(0,0,canvas.width,canvas.height);
  if(!enabled)return;
  ctx!.save();ctx!.scale(canvas.width/W,canvas.height/H);
  // Fixed source-image opening. Roof, timber posts, deck and mat remain untouched.
  ctx!.beginPath();ctx!.rect(W*.13,H*.15,W*.765,H*.55);ctx!.clip();
  ctx!.fillStyle=`rgba(12,29,32,${rain*.15})`;ctx!.fillRect(0,0,W,H);
  for(let i=0;i<wisps.length;i++){
   let p=wisps[i];p.age+=dt;if(p.age>p.life){wisps[i]=p=newWisp();}
   const t=p.age/p.life,fade=Math.sin(Math.PI*t)**1.6;
   const x=p.x+p.drift*p.age+Math.sin(time*.35+p.seed)*13;
   const y=p.y-p.age*p.rise;
   const width=p.width*(.65+t*.8),height=p.height*(.65+t*.65);
   ctx!.globalAlpha=fade*mist*.85;
   ctx!.drawImage(sprites[p.sprite],x-width/2,y-height/2,width,height);
  }
  ctx!.globalAlpha=1;
  // Three depth layers, independent drop speeds, random respawn and slow wind changes.
  const gust=Math.sin(time*.7)*12+Math.sin(time*.19+2)*17;
  const density=rain*(.90+.07*Math.sin(time*.83)+.03*Math.sin(time*2.3));
  for(let i=0;i<drops.length;i++){
   let p=drops[i];p.y+=p.speed*dt;p.x+=(gust+8)*dt*mix(.5,1.1,p.depth);
   if(p.y>H*.72||p.x<130||p.x>1170)drops[i]=p=newDrop();
   if(p.weight>density)continue;
   const slant=(gust+8)/p.speed*p.length;
   ctx!.strokeStyle=`rgba(210,231,240,${p.alpha*mix(.6,1,p.depth)})`;
   ctx!.lineWidth=mix(.5,1.25,p.depth);ctx!.beginPath();ctx!.moveTo(p.x,p.y);ctx!.lineTo(p.x+slant,p.y+p.length);ctx!.stroke();
  }
  ctx!.restore();
 }
 function tick(now:number){raf=0;if(destroyed||!enabled||document.hidden)return;const dt=last?Math.min((now-last)/1000,.045):0;last=now;time+=dt;
  if(sequence){elapsed+=dt;const next:TropicalPhase=elapsed<15?'warm':elapsed<35?'shower':'downpour';if(next!==phase){phase=next;onPhase(phase,true);}if(elapsed>=60){sequence=false;onPhase(phase,false);}}
  const blend=1-Math.exp(-dt*.6);rain=mix(rain,targets[phase].rain,blend);mist=mix(mist,targets[phase].mist,blend);draw(dt);raf=requestAnimationFrame(tick);
 }
 function start(){last=0;if(!raf&&enabled&&!document.hidden&&!destroyed)raf=requestAnimationFrame(tick);}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
 function visibility(){if(document.hidden)stop();else start();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);document.addEventListener('visibilitychange',visibility);resize();
 return {
  setEnabled(value:boolean){enabled=value;if(value)start();else{stop();sequence=false;draw(0);onPhase(phase,false);}},
  setPhase(value:TropicalPhase){phase=value;sequence=false;onPhase(phase,false);},
  playSequence(){phase='warm';rain=0;mist=targets.warm.mist;elapsed=0;sequence=true;enabled=true;onPhase(phase,true);start();},
  stopSequence(){sequence=false;onPhase(phase,false);},
  destroy(){destroyed=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);ctx!.clearRect(0,0,canvas.width,canvas.height);sprites.forEach(s=>{s.width=s.height=0;});}
 };
}
