import type { EnvironmentalState } from '../scene-lab/mersey-state';
/** Distorts existing photographic reflections in bounded horizontal strips. */
export class WaterReflectionEffect {
  private source = document.createElement('canvas');
  constructor(private image: HTMLImageElement, private mask: HTMLImageElement) {}
  resize(w: number, h: number) {
    this.source.width = w; this.source.height = h;
    this.source.getContext('2d')!.drawImage(this.image, 0, 0, w, h);
  }
  render(ctx: CanvasRenderingContext2D, t: number, state: EnvironmentalState) {
    const w = this.source.width, h = this.source.height;
    ctx.clearRect(0,0,w,h);
    if (!state.reflection) return;
    const start = Math.floor(h * 608 / 1152);
    const step = Math.max(2, Math.round(h / 160));
    for (let y=start; y<h; y+=step) {
      const depth = (y-start)/(h-start);
      const shift = Math.sin(y*.19+t*(.7+state.wind*3))*state.wind*8*(.25+depth) + Math.sin(y*.51-t*2)*state.turbulence*4*depth;
      const dx = Math.round(shift*w/850);
      const strip = Math.min(step,h-y);
      ctx.drawImage(this.source,0,y,w,strip,0,y,w,strip);
      ctx.drawImage(this.source,0,y,w,strip,dx,y,w,strip);
    }
    ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(this.mask,0,0,w,h);
    ctx.globalCompositeOperation='source-over';
  }
}
