import type { Experience } from '../models/Experience';
import { StorySequence, type StoryScene } from './StorySequence';

export interface StoryPlayerOptions {
  scenes: readonly StoryScene[];
  root: Document | HTMLElement;
  stage: HTMLElement;
  audio: HTMLAudioElement;
  loader: { load(experience: Experience): Experience };
  onSceneChange?: (scene: StoryScene, sequence: StorySequence) => void;
  onReplay?: () => void;
}

/** Shared visitor-paced playback. Story-specific activities stay with the page. */
export function createStoryPlayer(options: StoryPlayerOptions) {
const get = <T extends HTMLElement>(id: string): T => {
  const element = options.root.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Story player is missing #${id}.`);
  return element;
};
const sequence = new StorySequence(options.scenes);
const stage = options.stage;
const image = stage.querySelector<HTMLImageElement>('.preview-scene-image');
if (!image) throw new Error('Story player needs a scene image.');
const audio = options.audio;
const runtime = { experienceLoader: options.loader };
const sound = get<HTMLButtonElement>('sound');
const narrate = get<HTMLButtonElement>('narrate');
const cleanups: Array<() => void> = [];
function listen(target: EventTarget, event: string, handler: () => void) {
  target.addEventListener(event, handler);
  cleanups.push(() => target.removeEventListener(event, handler));
}
let destroyed = false;
function destroy() {
  if (destroyed) return;
  destroyed = true;
  ++audioAttempt;
  soundEnabled = false;
  stopNarration(); audio.pause();
  cleanups.splice(0).forEach(cleanup => cleanup());
}
let soundEnabled = false;
let speaking = false;
let audioAttempt = 0;
let narrationAttempt = 0;
const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
function stopNarration() {
  // Ignore callbacks from speech deliberately stopped by navigation or Replay.
  ++narrationAttempt;
  if(speechAvailable) window.speechSynthesis.cancel();
  speaking=false; narrate.textContent='Listen to chapter';
}
function loadAtmosphere() {
  const experience = structuredClone(sequence.current.experience);
  experience.audio.enabled = soundEnabled;
  runtime.experienceLoader.load(experience);
}
async function applySound() {
  const attempt = ++audioAttempt;
  loadAtmosphere();
  sound.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  sound.setAttribute('aria-pressed', String(soundEnabled));
  if (!soundEnabled) { audio.pause(); return; }
  try { await audio.play(); if(attempt!==audioAttempt && !soundEnabled) audio.pause(); }
  catch { if(attempt!==audioAttempt) return; soundEnabled=false; loadAtmosphere(); sound.textContent='Sound off'; sound.setAttribute('aria-pressed','false'); get('status').textContent='Sound could not start. You can still explore the full story.'; }
}
function render(focus=false) {
  stopNarration();
  const scene=sequence.current;
  image.src=scene.image; image.alt=scene.imageAlt; image.removeAttribute('aria-hidden');
  stage.style.aspectRatio=scene.aspectRatio;
  stage.setAttribute('aria-label',scene.title);
  get('chapter-title').textContent=scene.title;
  get('caption').textContent=scene.caption;
  get('credit').textContent=scene.imageCredit;
  get('progress').textContent=`Chapter ${sequence.index+1} of ${sequence.scenes.length}`;
  get<HTMLButtonElement>('back').disabled=sequence.first;
  get('next').hidden=sequence.last;
  get('next').textContent=scene.nextLabel ?? 'Continue →';
  get('replay').hidden=!sequence.last;
  get('completion').hidden=!sequence.last;
  get('status').textContent='';
  narrate.hidden=!speechAvailable;
  loadAtmosphere();
  options.onSceneChange?.(scene, sequence);
  if(focus) get('chapter-title').focus({preventScroll:true});
}

listen(get('next'),'click',()=>{sequence.next();render(true);});
listen(get('back'),'click',()=>{sequence.back();render(true);});
listen(get('replay'),'click',()=>{sequence.replay();options.onReplay?.();render(true);});
listen(sound,'click',()=>{soundEnabled=!soundEnabled;void applySound();});
listen(narrate,'click',()=>{
  if(speaking){stopNarration();return;}
  if(!speechAvailable) return;
  stopNarration();const attempt=narrationAttempt;
  get('status').textContent='';
  const utterance=new SpeechSynthesisUtterance(`${sequence.current.title}. ${sequence.current.caption}`);
  utterance.lang='en-GB';utterance.rate=.9;
  utterance.onend=()=>{if(attempt!==narrationAttempt)return;speaking=false;narrate.textContent='Listen to chapter';};
  utterance.onerror=()=>{if(attempt!==narrationAttempt)return;speaking=false;narrate.textContent='Listen to chapter';get('status').textContent='Device narration is unavailable. Read the chapter text instead.';};
  speaking=true;narrate.textContent='Stop narration';window.speechSynthesis.speak(utterance);
});
function silence(){stopNarration();soundEnabled=false;++audioAttempt;audio.pause();loadAtmosphere();sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');}
listen(document,'visibilitychange',()=>{if(document.hidden)silence();});
listen(window,'pagehide',destroy);
render();
return { sequence, destroy };
}
