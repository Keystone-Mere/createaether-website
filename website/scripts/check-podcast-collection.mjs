import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temp = await mkdtemp(join(tmpdir(), 'aether-podcast-check-'));
async function compile(source, name) {
  const code = await readFile(join(root, source), 'utf8');
  const result = stripTypeScriptTypes(code, { mode: 'transform' })
    .replaceAll("'../../data/assets/SceneRegistry'", "'./SceneRegistry.mjs'")
    .replaceAll("'./BroadcastSettings'", "'./BroadcastSettings.mjs'");
  await writeFile(join(temp, name), result);
}
try {
  await compile('src/data/assets/SceneRegistry.ts', 'SceneRegistry.mjs');
  await compile('src/lib/broadcast/BroadcastSettings.ts', 'BroadcastSettings.mjs');
  await compile('src/lib/broadcast/CameraPlacement.ts', 'CameraPlacement.mjs');
  const settings = await import(pathToFileURL(join(temp, 'BroadcastSettings.mjs')));
  const { cameraPlacement } = await import(pathToFileURL(join(temp, 'CameraPlacement.mjs')));
  assert.equal(settings.broadcastBackgrounds.length, 7);
  assert.equal(new Set(settings.broadcastBackgrounds.map(x => x.id)).size, 7);
  assert.equal(settings.broadcastBackgroundGroups[0].assets.length, 3);
  assert.equal(settings.broadcastBackgroundGroups[1].assets.length, 4);
  for (const asset of settings.broadcastBackgrounds) {
    for (const layout of ['solo', 'duo', 'background']) {
      const value = { ...settings.defaultBroadcast, background: asset.id, layout, show: 'Café & conversation 🎙' };
      const url = settings.createBroadcastUrl(value, 'https://createaether.com');
      assert.deepEqual(settings.readBroadcastHash(new URL(url).hash), value);
      const placements = cameraPlacement(layout, asset.id);
      assert.equal(placements.length, layout === 'duo' ? 2 : layout === 'solo' ? 1 : 0);
      for (const p of placements) {
        assert.equal(p.width / p.height, 16 / 9);
        assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.width <= 1920 && p.y + p.height <= 1080);
        if (settings.studioBackgroundIds.includes(asset.id)) assert.ok(p.y >= 1080 * .32);
      }
    }
    if (settings.studioBackgroundIds.includes(asset.id)) await access(join(root, 'public', asset.src));
  }
  const legacy = { ...settings.defaultBroadcast }; delete legacy.background;
  assert.equal(settings.validateBroadcast(legacy).background, 'wirral-liverpool');
  assert.throws(() => settings.validateBroadcast({ ...settings.defaultBroadcast, background: 'unknown' }));
  assert.deepEqual(cameraPlacement('duo'), cameraPlacement('duo', 'wirral-liverpool'));
  assert.deepEqual(cameraPlacement('solo'), cameraPlacement('solo', 'ocean'));
  const css = await readFile(join(root, 'src/components/studio/BroadcastStage.astro'), 'utf8');
  assert.match(css, /data-framing="presenter-safe"\]\s+\.broadcast-cameras\s*\{\s*top:32%/);
  const page = await readFile(join(root, 'src/pages/studio/podcast.astro'), 'utf8');
  assert.match(page, /cameraPlacement\(s\.layout,s\.background\)/);
  assert.match(page, /broadcastBackgroundGroups\.map/);
  const controller = await readFile(join(root, 'src/lib/broadcast/BroadcastController.ts'), 'utf8');
  assert.match(controller, /root\.dataset\.framing = broadcastFraming\(settings\.background\)/);
  let starts = 0, destroys = 0, preferenceListeners = 0;
  globalThis.__aetherRuntimeTest = () => ({ experienceLoader: { load() { starts++; } }, destroy() { destroys++; } });
  globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() { preferenceListeners++; }, removeEventListener() { preferenceListeners--; } }) };
  const testController = stripTypeScriptTypes(controller, { mode: 'transform' })
    .replaceAll("'../../data/assets/SceneRegistry'", "'./SceneRegistry.mjs'")
    .replaceAll("'./BroadcastSettings'", "'./BroadcastSettings.mjs'")
    .replace(/import\s*\{\s*createStudioRuntime\s*\}\s*from\s*['"][^'"]+['"];?/, 'const createStudioRuntime = globalThis.__aetherRuntimeTest;')
    .replace(/import\s+storm\s+from\s*['"][^'"]+['"];?/, 'const storm = { particles: {} };');
  await writeFile(join(temp, 'BroadcastController.mjs'), testController);
  const { createBroadcastController } = await import(pathToFileURL(join(temp, 'BroadcastController.mjs')));
  const image = { src: '', getAttribute() { return this.src; } };
  const logo = { hidden: true, src: '', getAttribute() { return this.src; }, removeAttribute() { this.src = ''; } };
  const stage = { dataset: {}, setAttribute() {}, querySelector(s) { return s === '.preview-scene-image' ? image : {}; } };
  const nodes = new Map();
  const rootNode = { dataset: {}, style: { setProperty() {} }, querySelector(s) {
    if (s === '.preview-stage') return stage;
    if (s === '.broadcast-logo') return logo;
    if (!nodes.has(s)) nodes.set(s, { textContent: '' });
    return nodes.get(s);
  } };
  const player = createBroadcastController(rootNode);
  player.update(settings.defaultBroadcast);
  assert.equal(starts, 1);
  for (const id of settings.studioBackgroundIds) {
    player.update({ ...settings.defaultBroadcast, background: id });
    assert.equal(rootNode.dataset.framing, 'presenter-safe');
    assert.equal(rootNode.dataset.motion, 'still');
    assert.equal(image.src, settings.broadcastBackgrounds.find(x => x.id === id).src);
  }
  assert.equal(starts, 1, 'new still backgrounds must not start rain');
  assert.equal(destroys, 1, 'switching away from legacy rain must stop its runtime');
  player.update(settings.defaultBroadcast);
  assert.equal(rootNode.dataset.framing, 'legacy');
  assert.equal(starts, 2);
  player.destroy();
  assert.equal(destroys, 2);
  assert.equal(preferenceListeners, 0);
  delete globalThis.__aetherRuntimeTest;
  delete globalThis.window;
  console.log('PASS: seven backgrounds, all playback links and layouts, legacy settings, image paths and OBS framing.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
