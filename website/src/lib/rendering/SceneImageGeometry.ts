/** Normalised source-image bounds transformed through centred CSS cover/contain. */
export function sceneImageRect(sw: number, sh: number, iw: number, ih: number, fit = 'cover') {
  const scale = fit === 'contain' ? Math.min(sw / iw, sh / ih) : Math.max(sw / iw, sh / ih);
  const width = iw * scale, height = ih * scale;
  return { x: (sw - width) / 2, y: (sh - height) / 2, width, height };
}
