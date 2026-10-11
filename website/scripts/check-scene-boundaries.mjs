import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--worker')) {
  const result = spawnSync(process.execPath, ['--experimental-transform-types', fileURLToPath(import.meta.url), '--worker', ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
const temp = await mkdtemp(path.join(tmpdir(), 'aether-boundaries-'));
try {
  async function copy(dir, target) {
    await mkdir(target, { recursive: true });
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const source = path.join(dir, entry.name), destination = path.join(target, entry.name);
      if (entry.isDirectory()) await copy(source, destination);
      else if (/\.(ts|json)$/.test(entry.name)) {
        let text = await readFile(source, 'utf8');
        if (entry.name.endsWith('.ts')) text = text.replace(/(from\s+)(['"])(\.[^'"]+)\2(\s*;?)/g, (all, before, quote, specifier, after) => {
          if (specifier.endsWith('.json')) return `${before}${quote}${specifier}${quote} with { type: 'json' }${after}`;
          if (!path.extname(specifier)) specifier += '.ts';
          return `${before}${quote}${specifier}${quote}${after}`;
        });
        await writeFile(destination, text);
      }
    }
  }
  const sourceRoot = path.join(website, 'src');
  await copy(sourceRoot, path.join(temp, 'src'));
  await writeFile(path.join(temp, 'package.json'), '{"type":"module"}');
  const { CanvasParticleEffect } = await import(pathToFileURL(path.join(temp, 'src/lib/visuals/CanvasParticleEffect.ts')).href);
  globalThis.HTMLElement = class { constructor(scene) { this.dataset = { scene }; } };
  const cases = [
    ['retreat', 'rain', 'retreat-rain'], ['retreat', 'snow', 'christmas-snow'],
    ['retreat', 'rain', 'storm-rain'], ['storm', 'rain', 'storm-rain'],
    ['christmas', 'snow', 'christmas-snow'], ['christmas', 'rain', 'christmas-snow'],
    ['temple', 'rise', 'temple-embers'], [null, 'rain', 'storm-rain'],
    ['forest', 'snow', 'christmas-snow'],
  ];
  const captures = [];
  for (const [scene, motion, preset] of cases) for (const [width, height] of [[960, 540], [1920, 1080], [360, 640]]) {
    const calls = [];
    const context = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) });
    const effect = new CanvasParticleEffect({}, {}, scene === null ? null : new HTMLElement(scene));
    effect.applySettings({ ...effect.settings, count: 0, motion, preset });
    effect.render({ context, width, height, deltaTime: 16 });
    captures.push({ scene, motion, preset, width, height, calls });
  }
  const snapshotPath = path.join(website, 'scripts/fixtures/scene-boundaries-v1.json');
    const expected = JSON.parse(await readFile(snapshotPath, 'utf8'));
    assert.deepEqual(captures, expected, 'Rendering paths must match the pre-refactor renderer exactly.');
    const calls = [];
    const effect = new CanvasParticleEffect({}, {}, null);
    const context = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) });
    effect.render({ context, width: 0, height: 0, deltaTime: 16 });
    assert.deepEqual(calls, [], 'A hidden/zero-size canvas must not render.');
    effect.stop(); effect.render({ context, width: 960, height: 540, deltaTime: 16 });
    assert.deepEqual(calls, [], 'Stopped particles must not render.');
    // Named backgrounds must select geometry through the shared loader event, including OBS.
    const handlers = {};
    const coastalCalls = [];
    const coastalContext = new Proxy({}, { get: (_, name) => (...args) => coastalCalls.push([name, ...args]) });
    const coastal = new CanvasParticleEffect(
      { register: () => () => {} },
      { on: (name, handler) => { handlers[name] = handler; return () => {}; } },
      new HTMLElement('custom')
    );
    coastal.initialise();
    const particles = { ...coastal.settings, count: 0, motion: 'rain', preset: 'storm-rain' };
    handlers['experience:loaded']({ experience: { backgroundId: 'storm-coast', particles } });
    coastal.render({ context: coastalContext, width: 960, height: 540, deltaTime: 16 });
    const { sceneEffectBoundaries, particleBoundary } = await import(pathToFileURL(path.join(temp, 'src/data/scenes/EffectBoundaries.ts')).href);
    const polygon = sceneEffectBoundaries['storm-coast'].polygons[0];
    assert.deepEqual(coastalCalls.filter(call => ['moveTo', 'lineTo'].includes(call[0])),
      polygon.map(([x, y], index) => [index ? 'lineTo' : 'moveTo', x * 960, y * 540]),
      'Portable/custom stage must select coastal geometry from the experience background ID.');
    handlers['experience:loaded']({ experience: { particles } });
    coastalCalls.length = 0;
    coastal.render({ context: coastalContext, width: 960, height: 540, deltaTime: 16 });
    assert.deepEqual(coastalCalls, expected.find(row => row.scene === 'storm' && row.width === 960).calls,
      'Switching back to the original scene must clear the coastal boundary.');
    assert.equal(particleBoundary('custom', 'storm-rain', 'rain', 'storm-city'), sceneEffectBoundaries.storm,
      'Other backgrounds retain their previous behaviour.');
    coastal.destroy();
    console.log('32 scene boundary checks passed (29 previous checks, coastal selection, original reset, other-background compatibility).');

} finally { await rm(temp, { recursive: true, force: true }); }
