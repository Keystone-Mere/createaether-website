import type { Experience } from '../models/Experience';
export interface StoryScene {
  id: string; title: string; caption: string; image: string; imageAlt: string;
  imageCredit: string; aspectRatio: string; experience: Experience;
}
/** Visitor-paced navigation, independent of the page or a particular story. */
export class StorySequence {
  private position = 0;
  constructor(public readonly scenes: readonly StoryScene[]) {
    if (!scenes.length) throw new Error('A story needs at least one scene.');
  }
  get index() { return this.position; }
  get current() { return this.scenes[this.position]; }
  get first() { return this.position === 0; }
  get last() { return this.position === this.scenes.length - 1; }
  next() { this.position = Math.min(this.position + 1, this.scenes.length - 1); }
  back() { this.position = Math.max(this.position - 1, 0); }
  replay() { this.position = 0; }
}
