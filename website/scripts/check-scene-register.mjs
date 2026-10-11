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
  const { sceneAssets, sceneDefinitions, audioAssets, sceneAsset, sceneAssetForSource } = await load('data/assets/SceneRegistry.ts');
  const { backgroundChoices } = await load('lib/player/BackgroundChoices.ts');
  const { applyBackground, applyStoryAsset, displayedAssetId } = await load('lib/player/ScenePresentation.ts');
  const { particleBoundary } = await load('data/scenes/EffectBoundaries.ts');
  const { createPlaybackUrl, readPlaybackHash } = await load('lib/player/PlaybackLink.ts');
  const { audioTracks } = await load('data/audio/tracks.ts');
  class Stage { dataset = {}; image = { src:'', getAttribute() { return this.src; } }; querySelector() { return this.image; } }
  globalThis.HTMLElement = Stage;
  check('asset and audio identifiers are unique', () => {
    assert.equal(new Set(sceneAssets.map(a=>a.id)).size, sceneAssets.length);
    assert.equal(new Set(audioAssets.map(a=>a.id)).size, audioAssets.length);
  });
  check('all seven defaults resolve to registered images and tracks', () => {
    assert.equal(sceneDefinitions.length,7);
    for (const def of sceneDefinitions) {
      assert.equal(sceneAsset(def.defaultAssetId).sceneId,def.id);
      assert.ok(audioTracks.find(t=>t.id===def.defaultAudioTrackId));
    }
    for (const track of audioTracks) for (const src of [track.src,track.layerSrc].filter(Boolean)) assert.ok(audioAssets.find(a=>a.src===src));
  });
  check('every asset records credit status and valid geometry', () => {
    for (const asset of sceneAssets) {
      assert.ok(['documented','review-needed'].includes(asset.credit.status));
      if (asset.credit.status==='documented') for (const key of ['creator','sourceUrl','licence','licenceUrl']) assert.ok(asset.credit[key]);
      const b=asset.geometry.particles;
      if (!b) continue;
      if (b.kind==='rectangle') {
        assert.ok(b.x>=0 && b.y>=0 && b.width>0 && b.height>0 && b.x+b.width<=1 && b.y+b.height<=1);
      } else for (const polygon of b.polygons) {
        assert.ok(polygon.length>=3);
        for (const point of polygon) for (const coordinate of point) assert.ok(coordinate>=0 && coordinate<=1);
      }
    }
  });
  for (const def of sceneDefinitions) {
    const preset=JSON.parse(await readFile(path.join(website,'src/data/experiences',def.id+'.json'),'utf8'));
    for (const choice of [undefined,...backgroundChoices.filter(c=>c.sceneId===def.id)]) {
      check(`${def.id}: ${choice?.id ?? 'original'} survives playback and selects image geometry`, () => {
        const experience={...preset,sceneId:def.id,...(choice?{backgroundId:choice.id}:{})};
        const linked=readPlaybackHash(new URL(createPlaybackUrl(experience,'https://example.com')).hash);
        const editor=new Stage(), player=new Stage();
        applyBackground(editor,experience); applyBackground(player,linked);
        assert.deepEqual(player.dataset,editor.dataset); assert.equal(player.image.src,editor.image.src);
        const asset=sceneAsset(choice?.id ?? def.defaultAssetId);
        assert.equal(displayedAssetId(player),asset.id);
        assert.equal(particleBoundary(def.id,'storm-rain','rain',choice?.id,displayedAssetId(player)),asset.geometry.particles);
        // Fullscreen uses this same stage; boundaries remain normalised at either size.
        assert.equal(particleBoundary(def.id,'christmas-snow','snow',choice?.id,displayedAssetId(player)),asset.geometry.particles);
      });
    }
  }
  check('upload clears a previously selected coastal boundary', () => {
    const stage=new Stage(); applyBackground(stage,{id:'storm',backgroundId:'storm-coast'});
    applyBackground(stage,{id:'storm',backgroundId:'storm-coast',background:'data:image/png;base64,example'});
    assert.equal(stage.dataset.assetId,'user-background');
    assert.equal(particleBoundary('storm','storm-rain','rain','storm-coast',displayedAssetId(stage)),null);
  });
  check('outdoor winter photo does not inherit an indoor snow mask', () => assert.equal(sceneAsset('christmas-fireside').geometry.particles,null));
  check('city terrace and conservatory have their own geometry', () => {
    assert.notDeepEqual(sceneAsset('storm-city').geometry.particles,sceneAsset('storm').geometry.particles);
    assert.notDeepEqual(sceneAsset('christmas-village').geometry.particles,sceneAsset('christmas').geometry.particles);
  });
  check('Bardsey shelter identity is independent of the shared photograph', () => {
    const stage=new Stage(), src=sceneAsset('bardsey-coast').src;
    applyStoryAsset(stage,src,'bardsey-shelter'); assert.equal(displayedAssetId(stage),'bardsey-shelter');
    assert.ok(particleBoundary('story','storm-rain','rain',undefined,displayedAssetId(stage)));
    applyStoryAsset(stage,src,'bardsey-coast'); assert.equal(particleBoundary('story','storm-rain','rain',undefined,displayedAssetId(stage)),null);
  });
  check('unknown and mismatched story images cannot borrow geometry', () => {
    const stage=new Stage(); applyStoryAsset(stage,'/unregistered.jpg','bardsey-shelter');
    assert.equal(displayedAssetId(stage),'user-background');
    assert.equal(sceneAssetForSource('https://example.com'+sceneAsset('storm').src),undefined);
    assert.equal(particleBoundary('storm','storm-rain','rain',undefined,'unknown'),null);
  });
  console.log(`\n${checks} scene register checks passed.`);
} finally { await rm(temp, { recursive: true, force: true }); }
