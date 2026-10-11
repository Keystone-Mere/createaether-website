import type { EffectBoundary } from '../../data/scenes/EffectBoundaries';

/** Apply scene geometry without knowing the experience, preset or page. */
export function clipEffectBoundary(
  context: CanvasRenderingContext2D,
  boundary: EffectBoundary,
  width: number,
  height: number
): void {
  context.beginPath();
  if (boundary.kind === 'rectangle') {
    context.rect(boundary.x * width, boundary.y * height, boundary.width * width, boundary.height * height);
  } else {
    for (const polygon of boundary.polygons) {
      polygon.forEach(([x, y], index) => {
        if (index === 0) context.moveTo(x * width, y * height);
        else context.lineTo(x * width, y * height);
      });
      context.closePath();
    }
  }
  context.clip();
}
