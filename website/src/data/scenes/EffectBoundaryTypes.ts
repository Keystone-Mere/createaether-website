/** Fractions of the existing 960 x 540 scene coordinate space. */
export type ScenePoint = readonly [number, number];
export type EffectBoundary =
  | { readonly kind: 'rectangle'; readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | { readonly kind: 'polygons'; readonly polygons: readonly (readonly ScenePoint[])[] };

