/** Node 24+, no extra packages. Exercises shipped TS using Node's type transform. */
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
// fileURLToPath handles Windows drive letters and spaces.
const { fileURLToPath } = await import('node:url');
const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--worker')) {
  const result = spawnSync(process.execPath, ['--experimental-transform-types', fileURLToPath(import.meta.url), '--worker'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
const temp = await mkdtemp(path.join(tmpdir(), 'aether-check-'));
let checks = 0;
const check = (label, run) => { run(); checks++; console.log(`PASS ${label}`); };
try {
  async function copy(dir, target) {
    await mkdir(target, { recursive: true });
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const source = path.join(dir, entry.name), destination = path.join(target, entry.name);
      if (entry.isDirectory()) await copy(source, destination);
      else if (/\.(ts|json)$/.test(entry.name)) {
        let text = await readFile(source, 'utf8');
        if (entry.name.endsWith('.ts')) {
          text = text.replace(/(from\s+)(['"])(\.[^'"]+)\2(\s*;?)/g, (all, before, quote, specifier, after) => {
            if (specifier.endsWith('.json')) return `${before}${quote}${specifier}${quote} with { type: 'json' }${after}`;
            if (!path.extname(specifier)) specifier += '.ts';
            return `${before}${quote}${specifier}${quote}${after}`;
          });
        }
        await writeFile(destination, text);
      }
    }
  }
  await copy(path.join(website, 'src'), path.join(temp, 'src'));
  await writeFile(path.join(temp, 'package.json'), '{"type":"module"}');
  const load = file => import(pathToFileURL(path.join(temp, 'src', file)).href);
  const { AudioSystem } = await load('lib/systems/AudioSystem.ts');
  const { VisualSystem } = await load('lib/systems/VisualSystem.ts');
  const { CanvasRenderer } = await load('lib/rendering/CanvasRenderer.ts');
  const { RuntimeEvents } = await load('lib/RuntimeEvents.ts');
  const { createStoryPlayer } = await load('lib/story/StoryPlayer.ts');
  const { bardseyScenes } = await load('data/stories/bardsey.ts');
  let nextFrame=0; const frames=new Map();
  globalThis.requestAnimationFrame=callback=>{const id=++nextFrame;frames.set(id,callback);return id;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  globalThis.window=Object.assign(new EventTarget(),{requestAnimationFrame,cancelAnimationFrame,devicePixelRatio:1});
  globalThis.document=new EventTarget(); document.hidden=false;
  class AudioMock extends EventTarget {
    src=''; paused=true; volume=1; loop=false; dataset={}; loads=0; plays=[];
    pause(){ this.paused=true;this.dispatchEvent(new Event('pause')); }
    play(){ this.paused=false;this.dispatchEvent(new Event('play'));return new Promise((resolve,reject)=>this.plays.push({resolve,reject})); }
    load(){this.loads++;this.paused=true;}
    getAttribute(name){return name==='src'?this.src:null;}
    removeAttribute(name){if(name==='src')this.src='';}
  }
  const created=[];
  globalThis.HTMLAudioElement=AudioMock;globalThis.Audio=class extends AudioMock {constructor(){super();created.push(this);}};
  const tracks=[{id:'one',src:'/one.mp3',layerSrc:'/layer.mp3',loop:true},{id:'two',src:'/two.mp3',layerSrc:'/layer2.mp3',loop:true}];
  const state={audio:{enabled:true,track:'one',volume:40,layerVolume:50}};
  const flush=async()=>{await Promise.resolve();await Promise.resolve();};
  {
    const main=new AudioMock(), system=new AudioSystem(main,tracks,new RuntimeEvents());
    system.update(state);main.play();const layer=created.at(-1);
    check('audio teardown pauses both tracks and cancels volume fade',()=>{
      assert.ok(frames.size);assert.equal(layer.paused,false);system.destroy();system.destroy();
      assert.equal(main.paused,true);assert.equal(layer.paused,true);assert.equal(frames.size,0);assert.equal(layer.src,'');
    });
    for(const play of layer.plays)play.resolve();await flush();
    check('late atmosphere play cannot restart destroyed audio',()=>assert.equal(layer.paused,true));
    check('destroyed audio ignores subsequent updates and main play events',()=>{
      const loads=main.loads, plays=layer.plays.length;system.update(state);main.dispatchEvent(new Event('play'));
      assert.equal(main.loads,loads);assert.equal(layer.plays.length,plays);assert.equal(frames.size,0);
    });
  }
  {
    const main=new AudioMock(),system=new AudioSystem(main,tracks);system.update(state);main.paused=false;
    system.update({audio:{...state.audio,track:'two'}});const pending=main.plays.at(-1);system.destroy();
    main.paused=false;pending.resolve();await flush();
    check('late track-switch play is paused after teardown',()=>assert.equal(main.paused,true));
  }
  check('fifty audio create/destroy cycles leave no fade frames',()=>{
    for(let i=0;i<50;i++){const main=new AudioMock(),system=new AudioSystem(main,tracks);system.update(state);system.stop();system.destroy();}
    assert.equal(frames.size,0);
  });
  {
    let stopped=0,destroyed=0,badDestroyed=0;const visual=new VisualSystem();
    visual.register({id:'bad',enabled:true,update(){},stop(){throw Error('expected stop failure');},destroy(){badDestroyed++;throw Error('expected destroy failure');}});
    visual.register({id:'good',enabled:true,update(){},stop(){stopped++;},destroy(){destroyed++;}});
    visual.initialise();visual.start();const originalError=console.error;console.error=()=>{};
    try{visual.stop();visual.destroy();visual.destroy();}finally{console.error=originalError;}
    check('a failing effect cannot block other effect cleanup',()=>{assert.equal(stopped,1);assert.equal(destroyed,1);assert.equal(badDestroyed,1);assert.equal(visual.count(),0);});
  }
  let disconnected=0;globalThis.ResizeObserver=class {observe(){}disconnect(){disconnected++;}};
  const canvas=()=>({width:960,height:540,getContext:()=>({setTransform(){},clearRect(){}}),getBoundingClientRect:()=>({width:960,height:540})});
  check('repeated canvas start creates one animation loop',()=>{
    const renderer=new CanvasRenderer(canvas());renderer.start();renderer.start();assert.equal(frames.size,1);renderer.destroy();renderer.destroy();assert.equal(frames.size,0);
    renderer.start();assert.equal(frames.size,0);
  });
  check('destroy during a canvas frame cannot schedule another frame',()=>{
    const renderer=new CanvasRenderer(canvas());renderer.setRenderCallback(()=>renderer.destroy());renderer.start();
    const [id,callback]=frames.entries().next().value;frames.delete(id);callback(performance.now());assert.equal(frames.size,0);assert.equal(renderer.isRunning(),false);
  });
  check('fifty canvas cycles disconnect every resize observer',()=>{
    const before=disconnected;
    for(let i=0;i<50;i++){const renderer=new CanvasRenderer(canvas());renderer.start();renderer.destroy();}
    assert.equal(disconnected-before,50);assert.equal(frames.size,0);
  });
  class ElementMock extends EventTarget {
    dataset={}; style={};textContent='';hidden=false;disabled=false;attributes=new Map();
    setAttribute(k,v){this.attributes.set(k,v);}removeAttribute(k){this.attributes.delete(k);}focus(){}
  }
  globalThis.HTMLElement=ElementMock;
  function story(){
    const ids=['sound','narrate','chapter-title','caption','credit','progress','back','next','replay','completion','status'];
    const elements=new Map(ids.map(id=>[id,new ElementMock()]));const stage=new ElementMock();const image=new ElementMock();
    stage.querySelector=()=>image;const root={querySelector:selector=>elements.get(selector.slice(1))};const audio=new AudioMock();let loads=0;
    const player=createStoryPlayer({scenes:bardseyScenes,root,stage,audio,loader:{load(experience){loads++;return experience;}}});
    return {player,elements,audio,get loads(){return loads;}};
  }
  for(const event of ['pagehide','astro:before-swap']){
    const s=story();s.elements.get('sound').dispatchEvent(new Event('click'));const pending=s.audio.plays.at(-1);
    (event==='pagehide'?window:document).dispatchEvent(new Event(event));
    s.audio.paused=false;pending.resolve();await flush();
    check(`${event} removes story controls and stops delayed sound`,()=>{
      const before=s.loads,index=s.player.sequence.index;s.elements.get('next').dispatchEvent(new Event('click'));
      s.elements.get('sound').dispatchEvent(new Event('click'));s.player.destroy();assert.equal(s.audio.paused,true);assert.equal(s.loads,before);assert.equal(s.player.sequence.index,index);
    });
  }
  check('manual story teardown removes page hooks and controls',()=>{
    const s=story();s.player.destroy();const before=s.loads;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));
    s.elements.get('next').dispatchEvent(new Event('click'));assert.equal(s.loads,before);document.hidden=false;
  });
  check('story teardown cancels narration and ignores its late callbacks',()=>{
    let cancelled=0,utterance;
    window.speechSynthesis={cancel(){cancelled++;},speak(value){utterance=value;}};
    globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    window.SpeechSynthesisUtterance=SpeechSynthesisUtterance;
    const s=story();s.elements.get('narrate').dispatchEvent(new Event('click'));assert.ok(utterance);
    const before=cancelled;s.player.destroy();assert.equal(cancelled,before+1);
    utterance.onerror();assert.equal(s.elements.get('status').textContent,'');
  });
  console.log(`\n${checks} runtime cleanup checks passed.`);
} finally { await rm(temp, { recursive: true, force: true }); }
