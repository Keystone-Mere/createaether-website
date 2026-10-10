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
  const { isExperience, normalizeExperience, cloneExperience } = await load('lib/models/ExperienceFormat.ts');
  const { ExperienceLibrary } = await load('lib/storage/ExperienceLibrary.ts');
  const { ExperienceLoader } = await load('lib/ExperienceLoader.ts');
  const { RuntimeEvents } = await load('lib/RuntimeEvents.ts');
  const { createPlaybackUrl, readPlaybackHash } = await load('lib/player/PlaybackLink.ts');
  const { registerRuntimeCleanup } = await load('lib/runtime/RuntimeLifecycle.ts');
  const presets = {};
  for (const name of ['temple', 'forest', 'ocean', 'christmas', 'storm', 'festival', 'retreat']) {
    presets[name] = JSON.parse(await readFile(path.join(website, 'src/data/experiences', `${name}.json`), 'utf8'));
    check(`${name} legacy preset validates and upgrades`, () => assert.equal(normalizeExperience(presets[name]).formatVersion, 1));
  }
  const temple = presets.temple;
  check('legacy source remains unchanged', () => assert.equal(temple.formatVersion, undefined));
  check('future versions rejected', () => assert.equal(isExperience({ ...temple, formatVersion: 2 }), false));
  check('invalid layer volume rejected', () => assert.equal(isExperience({ ...temple, audio: { ...temple.audio, layerVolume: NaN } }), false));
  check('invalid scene ID rejected', () => assert.equal(isExperience({ ...temple, sceneId: 42 }), false));
  check('optional nested settings cloned independently', () => { const copy = cloneExperience(temple); copy.smoke.amount = 99; assert.notEqual(copy.smoke.amount, temple.smoke.amount); });
  function memoryStorage() {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  }
  globalThis.localStorage = memoryStorage(); globalThis.sessionStorage = memoryStorage();
  const library = new ExperienceLibrary(), key = 'aether.studio.experiences.v1';
  check('save writes versioned format', () => { assert.equal(library.save(temple), true); assert.equal(JSON.parse(localStorage.getItem(key))[0].formatVersion, 1); });
  check('duplicate does not share smoke settings', () => { const copy = library.duplicate('temple'); copy.smoke.amount = 99; assert.equal(library.get('temple').smoke.amount, temple.smoke.amount); });
  check('staged editing upgrades legacy content', () => { assert.equal(library.stageForEditing(temple), true); assert.equal(library.consumeStaged().formatVersion, 1); assert.equal(library.consumeStaged(), null); });
  const future = { ...temple, id: 'future-save', formatVersion: 2 };
  check('future saves survive other saves and removal', () => {
    localStorage.setItem(key, JSON.stringify([temple, future]));
    assert.equal(library.list().length, 1); assert.equal(library.save(presets.storm), true);
    assert.equal(library.remove('temple'), true); assert.deepEqual(JSON.parse(localStorage.getItem(key)).find(x => x.id === future.id), future);
  });
  check('unsupported ID cannot be overwritten', () => assert.equal(library.save({ ...temple, id: future.id }), false));
  check('corrupt storage is not erased by save', () => { localStorage.setItem(key, '{'); assert.equal(library.save(temple), false); assert.equal(localStorage.getItem(key), '{'); });
  for (const name of ['temple', 'storm', 'retreat']) {
    check(`${name} portable link stays silent and versioned`, () => {
      const url = createPlaybackUrl(presets[name], 'https://example.com');
      const result = readPlaybackHash(new URL(url).hash);
      assert.equal(result.formatVersion, 1); assert.equal(result.audio.enabled, false); assert.equal(result.sceneId, name);
    });
  }
  const events = new RuntimeEvents(); let state = null;
  const loader = new ExperienceLoader({ events }, { load: value => { state = value; } });
  check('loader uses versioned contract', () => { assert.equal(loader.load(temple).formatVersion, 1); assert.equal(state.audio.track, temple.audio.track); });
  check('invalid load leaves active scene intact', () => { assert.throws(() => loader.load({ ...presets.storm, audio: {} })); assert.equal(loader.active().id, 'temple'); });
  const { djedhorScenes } = await load('data/stories/djedhor.ts');
  check('all existing story chapters load through same contract', () => { for (const scene of djedhorScenes) assert.equal(loader.load(scene.experience).formatVersion, 1); });
  for (const trigger of ['pagehide', 'astro:before-swap', 'manual']) {
    check(`${trigger} disposes once and removes hooks`, () => {
      const page = new EventTarget(), navigation = new EventTarget(); let calls = 0;
      const destroy = registerRuntimeCleanup(() => calls++, page, navigation);
      if (trigger === 'manual') destroy(); else (trigger === 'pagehide' ? page : navigation).dispatchEvent(new Event(trigger));
      page.dispatchEvent(new Event('pagehide')); navigation.dispatchEvent(new Event('astro:before-swap')); destroy(); assert.equal(calls, 1);
    });
  }
  console.log(`\n${checks} foundation checks passed.`);
} finally { await rm(temp, { recursive: true, force: true }); }
