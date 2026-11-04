/** Forest Live Director weather overlay, independent of decorative scene particles. */
type Cue = {rain:number; mist:number; shade:number};
const CUES:Cue[] = [
 {rain:0,mist:.025,shade:0},
 {rain:.24,mist:.14,shade:.07},
 {rain:.82,mist:.35,shade:.18},
 {rain:.015,mist:.58,shade:.06},
 {rain:0,mist:.045,shade:0},
];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
type Drop={x:number;y:number;speed:number;length:number;opacity:number;depth:number;seed:number;wind:number};
type Wisp={x:number;y:number;width:number;phase:number;speed:number;opacity:number;rise:number};
export function createForestDirectorWeather(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 let target=CUES[0],rain=0,mist=.025,shade=0,last=0,raf=0,dead=false,motion=true,elapsed=0;
 const drops:Drop[]=Array.from({length:720},()=>({x:Math.random(),y:Math.random(),speed:rand(.34,1.05),length:rand(.009,.026),opacity:rand(.14,.55),depth:rand(.45,1.4),seed:Math.random(),wind:rand(.025,.075)}));
 const wisps:Wisp[]=Array.from({length:28},()=>({x:rand(.12,.88),y:rand(.67,.85),width:rand(.10,.23),phase:rand(0,Math.PI*2),speed:rand(.0015,.005),opacity:rand(.12,.32),rise:rand(.002,.007)}));
 const sprite=document.createElement('canvas');sprite.width=256;sprite.height=96;
 const sc=sprite.getContext('2d')!;const gradient=sc.createRadialGradient(128,48,0,128,48,123);
 gradient.addColorStop(0,'rgba(218,232,226,.18)');gradient.addColorStop(.35,'rgba(218,232,226,.105)');gradient.addColorStop(.72,'rgba(218,232,226,.025)');gradient.addColorStop(1,'rgba(218,232,226,0)');sc.fillStyle=gradient;sc.fillRect(0,0,256,96);
 function resize(){const r=canvas.getBoundingClientRect();const d=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));draw(0);}
 function draw(dt:number){const w=canvas.width,h=canvas.height;ctx!.clearRect(0,0,w,h);if(!motion)return;
 ctx!.fillStyle=`rgba(12,24,29,${shade*.46})`;ctx!.fillRect(0,0,w,h);
 // Weather stays mainly inside the woodland opening, avoiding the sky and seating ledge.
 ctx!.save();ctx!.beginPath();ctx!.moveTo(w*.09,h*.27);ctx!.lineTo(w*.91,h*.27);ctx!.lineTo(w*.94,h*.80);ctx!.lineTo(w*.06,h*.80);ctx!.closePath();ctx!.clip();
 // Ground mist is made of many faint, drifting layers, not opaque circular clouds.
 for(const p of wisps){const wave=Math.sin(elapsed*.17+p.phase);const x=p.x+wave*.025+elapsed*p.speed*.15;const y=p.y-Math.min(.10,elapsed*p.rise*.12)% .10;const fade=.62+.38*Math.sin(elapsed*.24+p.phase)**2;
 ctx!.globalAlpha=mist*p.opacity*fade;ctx!.drawImage(sprite,((x%1+1)%1-p.width/2)*w,y*h,p.width*w,h*.10);}
 ctx!.globalAlpha=1;
 // Three depth bands with independent lengths, speeds, wind and opacity.
 for(const p of drops){p.y+=dt*p.speed*p.depth;p.x+=dt*p.wind;if(p.y>.82||p.x>.95){p.y=.27-rand(0,.10);p.x=rand(.07,.91);}
 if(p.seed>rain)continue;const gust=.85+.15*Math.sin(elapsed*1.4+p.seed*11);const len=p.length*p.depth;
 ctx!.strokeStyle=`rgba(203,225,235,${Math.min(.58,p.opacity*p.depth*.68*gust)})`;
 ctx!.lineWidth=Math.max(.55,w/1200)*Math.min(1.55,p.depth);ctx!.beginPath();ctx!.moveTo(p.x*w,p.y*h);ctx!.lineTo((p.x+p.wind*.055)*w,(p.y+len)*h);ctx!.stroke();}
 ctx!.restore();}
 function tick(now:number){raf=0;if(dead||!motion||document.hidden)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;elapsed+=dt;
 const r=1-Math.exp(-dt*1.15),m=1-Math.exp(-dt*.48),s=1-Math.exp(-dt*.7);
 rain=mix(rain,target.rain,r);mist=mix(mist,target.mist,m);shade=mix(shade,target.shade,s);draw(dt);raf=requestAnimationFrame(tick);}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
 function start(){if(!raf&&!dead&&motion&&!document.hidden)raf=requestAnimationFrame(tick);}
 const observer=new ResizeObserver(resize);observer.observe(canvas);const visibility=()=>{if(document.hidden)stop();else start();};document.addEventListener('visibilitychange',visibility);resize();start();
 return {setCue(index:number){target=CUES[Math.max(0,Math.min(CUES.length-1,index))];},setMotionEnabled(value:boolean){motion=value;if(value)start();else{stop();draw(0);}},destroy(){dead=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);ctx!.clearRect(0,0,canvas.width,canvas.height);}};
}
