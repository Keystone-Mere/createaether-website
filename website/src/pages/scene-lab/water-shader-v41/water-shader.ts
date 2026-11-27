const vertex = `attribute vec2 a; varying vec2 uv; void main(){uv=vec2((a.x+1.0)*0.5,(1.0-a.y)*0.5);gl_Position=vec4(a,0.,1.);}`;
const fragment = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv; uniform sampler2D photo,water,mask;
uniform float wind,rough,scale,reflection,shimmer,phase,flow;
void main(){
 float shore=608.0/1152.0; float d=clamp((uv.y-shore)/(1.0-shore),0.,1.);
 float m=texture2D(mask,uv).r; if(uv.y<shore || m<0.01){gl_FragColor=vec4(0.);return;}
 vec2 p=vec2(uv.x*42.,log(1.+d*18.)*19.)/scale;
 float a=sin(dot(p,vec2(1.2,1.7))-phase*2.1-flow);
 float b=sin(dot(p,vec2(-1.8,2.9))-phase*3.3+flow*1.5);
 float c=sin(dot(p,vec2(3.1,-1.1))-phase*1.4-flow*2.);
 float e=sin(dot(p,vec2(.65,4.2))-phase*2.7-flow*.5);
 float amp=rough*(.12+.88*d)*smoothstep(0.,.025,d);
 vec2 offset=vec2(a+b*.45+e*.22,b+c*.5)*amp*vec2(.021,.009);
 vec2 q=clamp(vec2(uv.x,d)*.88+.06+offset,vec2(.001),vec2(.999));
 vec3 base=texture2D(water,q).rgb;
 vec2 r=clamp(uv+offset*vec2(1.65,.45),vec2(.001,shore),vec2(.999,.999));
 vec3 refl=texture2D(photo,r).rgb;
 float light=max(max(refl.r,refl.g),refl.b);
 float warm=smoothstep(.035,.30,refl.r-refl.b);
 float white=smoothstep(.72,.98,min(refl.r,min(refl.g,refl.b)));
 float bright=smoothstep(.48,.92,light)*max(warm,white);
 float glint=pow(clamp(.5+.5*(a*.40+b*.25+c*.20+e*.15),0.,1.),3.);
 float fade=1.-d*.72;
 vec3 color=mix(base,refl,reflection*(.16+.23*(1.-rough))*fade);
 color+=refl*reflection*shimmer*bright*(.22+1.1*glint)*fade;
 color+=vec3(.10,.13,.16)*amp*(a*.45+b*.25+c*.15+e*.15);
 // Blend the first few pixels into the original shoreline, not the whole reflection.
 gl_FragColor=vec4(clamp(color,0.,1.),m*smoothstep(0.,.012,d));
}`;
export async function mountWaterShader(){
 const canvas=document.querySelector<HTMLCanvasElement>('#water')!, status=document.querySelector<HTMLOutputElement>('#status')!;
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});
 if(!gl){status.textContent='WebGL unavailable. V3.2 remains unchanged.';return;}
 let raf=0,dead=false;const abort=new AbortController();
 const stop=()=>{dead=true;cancelAnimationFrame(raf);abort.abort();};
 window.addEventListener('pagehide',stop,{once:true});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();status.textContent='WebGL context lost. Reload to retry.';});
 try{
 const compile=(kind:number,src:string)=>{const s=gl.createShader(kind)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'Shader compile failed');return s;};
 const program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Link failed');gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const names=['photo','water','mask'];const files=['mersey-base.webp','mersey-water-texture.webp','mersey-water-mask.png'];
 await Promise.all(files.map(async(file,i)=>{const img=new Image();img.src='/scene-lab/mersey/'+file;await img.decode();if(dead)return;gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);gl.uniform1i(gl.getUniformLocation(program,names[i]),i);}));if(dead)return;
 const inputs=Array.from(document.querySelectorAll<HTMLInputElement>('[data-key]'));const width=document.querySelector<HTMLSelectElement>('#width')!,fps=document.querySelector<HTMLSelectElement>('#fps')!;const pause=document.querySelector<HTMLButtonElement>('#pause')!;
 const state:Record<string,number>={};const loc:Record<string,WebGLUniformLocation|null>={};for(const key of [...inputs.map(e=>e.dataset.key!), 'phase','flow'])loc[key]=gl.getUniformLocation(program,key);
 const sync=()=>{for(const e of inputs){const key=e.dataset.key!;state[key]=Number(e.value);document.querySelector(`[data-value="${key}"]`)!.textContent=e.value;}};
 const resize=()=>{canvas.width=Number(width.value);canvas.height=Math.round(canvas.width*9/16);gl.viewport(0,0,canvas.width,canvas.height);};sync();resize();
 for(const e of inputs)e.addEventListener('input',sync,{signal:abort.signal});width.addEventListener('change',resize,{signal:abort.signal});let paused=false,phase=0,flow=0;
 pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Resume':'Pause';};document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{for(const e of inputs)e.value=e.defaultValue;width.value='850';fps.value='30';phase=flow=0;paused=false;pause.textContent='Pause';sync();resize();};document.querySelector<HTMLButtonElement>('#full')!.onclick=()=>{void document.querySelector('#stage')!.requestFullscreen().catch(console.error);};
 let prev=0,last=0,start=0,count=0;const tick=(now:number)=>{if(dead)return;if(!start)start=now;if(now-last>=1000/Number(fps.value)-1){const dt=prev?Math.min(.1,(now-prev)/1000):0;prev=last=now;if(!paused){phase=(phase+dt*state.wind)% (Math.PI*20);flow=(flow+dt*state.current*1.8)%(Math.PI*4);}for(const [key,value] of Object.entries(state))gl.uniform1f(loc[key],value);gl.uniform1f(loc.phase,phase);gl.uniform1f(loc.flow,flow);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);count++;}if(now-start>=1000){status.textContent=`WebGL | ${(count*1000/(now-start)).toFixed(1)} FPS | ${canvas.width} × ${canvas.height}${paused?' | Paused':''}`;start=now;count=0;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
 }catch(e){stop();status.textContent='Shader initialisation failed: '+String(e);console.error(e);}
}
