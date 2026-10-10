# Aether foundation pass 1

This pass stabilises the existing engine without changing scene appearance or adding commercial features.

## Agreed content contract

- One `Experience` describes audio, atmosphere, lighting, fog, particles, transitions and optional scene/background/smoke settings.
- `formatVersion: 1` identifies Aether content, independently of the portable link envelope's `v: 1`.
- Missing `formatVersion` is legacy v1. Loading and saving add the version to a fresh copy; source presets remain unchanged.
- Unknown versions fail validation. Saved entries that this version cannot read are retained during other saves/removals. An unsupported entry's ID cannot be overwritten. Corrupt/non-array storage is not replaced by a save.
- `ExperienceFormat.ts` is the common structural validation and cloning boundary. The loader, saved library and portable player share it. The previous storage validator export remains compatible.
- General content validation checks structure and finite numeric fields. The portable player additionally bounds values and accepts only known scenes/backgrounds. Universal slider bounds are not imposed in this pass.
- Preserve stable preset IDs and storage keys. No localStorage rewrite happens just by opening the library.
- Original presets remain configuration files; copies retain their own IDs. Optional nested settings are cloned independently.

## Existing shared player

Studio, portable playback and existing story pages already use `createStudioRuntime`. Fullscreen enlarges the current scene rather than running another renderer. This pass retains that design and gives the shared factory one idempotent cleanup owner for `pagehide` and `astro:before-swap`, including its canvas renderer.

Background selection and page controls still have page-specific code. This pass does not claim those are fully consolidated. Timed relaxation cues and visitor-paced story chapters remain separate content structures.

## Validation

Run from `website`, with Node 24 or later:

    node scripts/check-foundations.mjs
    npm run build

The automated check uses Node's experimental TypeScript transform in a temporary directory; it needs no new dependency and does not alter source files. It checks all seven presets, legacy upgrading, future-version rejection/preservation, optional nested cloning, save/staging, portable links, atomic rejection of invalid loads, three existing Djedhor chapters and cleanup hooks.

The supplied source archive has no package.json, Astro configuration or complete public assets, so a full Astro build and browser QA were not possible in the patch workspace. Run the normal project build after installation.

## Browser release check

1. Temple: change smoke, Save as Copy, reopen, export/import, compare fullscreen with preview.
2. Storm: check rain after resizing and entering/exiting fullscreen.
3. Cosy Retreat: choose rain and winter presets; confirm the current rain repair remains intact.
4. Portable link: test in browser and OBS; verify silent playback and background choice.
5. Djedhor story: next/back/replay, sound toggle, narration, then leave the page.
6. Guided relaxation: start/stop audio and leave the page. Confirm it stops.
7. Navigate repeatedly between player pages; confirm no duplicate audio or lingering animation.

## Next bounded passes

1. Move the existing normalised scene masks/horizon positions into scene metadata, preserving their exact current geometry. Identify alternative backgrounds needing their own masks before sharing defaults.
2. Consolidate background resolution and scene setup across pages after the content contract has been verified locally.
3. Add an asset register: stable asset ID, path, media type, origin, permission evidence/status, attribution, dimensions/duration and usage. Do not infer commercial clearance from a filename or generated appearance.
4. Measure long playback sessions and resizing on the actual laptop/OBS setup, then choose performance limits from evidence.

Accounts, subscriptions, tenancy, marketplace and public SDK remain deferred until a paying use case establishes requirements.
