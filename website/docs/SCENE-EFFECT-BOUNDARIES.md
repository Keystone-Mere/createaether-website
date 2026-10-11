# Scene effect boundaries — foundation pass 2

## Change

`src/data/scenes/EffectBoundaries.ts` holds the existing Cosy Retreat window rectangle, Storm shelter polygon and three Christmas window polygons, plus a measured Coastal storm shelter opening. Coordinates are fractions of the existing scene coordinate space.

`src/lib/rendering/EffectBoundary.ts` applies a rectangle or polygon boundary to a canvas, independent of scene names and particle presets. `CanvasParticleEffect.ts` selects the existing boundary and calls that helper rather than embedding the shapes.

## Compatibility

The numeric coordinates, rectangle versus polygon commands, boundary priority, motion/preset selection rules and simulation coordinate system are identical to the previous renderer. Cosy Retreat's boundary continues to take priority over particle preset selection. Existing alternate backgrounds and uploaded images keep their previous behaviour.

This pass extracts clipping geometry only. Particle spawning, speeds, smoke, ocean wave geometry, audio, saved experience format and background selection are unchanged. The named Coastal storm shelter now receives its own measured rain mask via its background ID. Other alternative backgrounds do not automatically receive measured/custom masks; a later pass can extend these definitions after inspecting each image. The present definitions describe the current covers and are not universal masks for every photograph.

## Checks

From `website`, run:

    node scripts/check-foundations.mjs
    node scripts/check-scene-boundaries.mjs
    npm.cmd run build

The boundary test compares the actual renderer's canvas drawing calls with snapshots captured from the pre-refactor renderer. It covers nine scene/preset/motion combinations at preview, fullscreen and portrait sizes, plus hidden and stopped canvases: 32 checks, including coastal selection through the loader event, resetting to the original boundary and compatibility with other backgrounds. These complement the existing 27 foundation checks.

A full Astro build and browser/OBS inspection require the complete local project. The patch workspace contains uploaded source plus the previously supplied patches, without the full project configuration/dependencies.

## Local visual check before promotion

- Cosy Retreat rain and winter: effects remain outside the cabin in preview and fullscreen.
- Christmas snow: effects remain inside the existing window panes.
- Storm rain: sheltered foreground remains dry; fullscreen preserves alignment.
- One portable OBS link: same effects, silent audio.

## Adding a future background

Measure its visible exterior region and add rectangle or polygon geometry here. Then explicitly connect its background ID to the appropriate definition and test preview/fullscreen/OBS. Do not reuse a window mask simply because two images have the same experience name. No new background-selection UI is introduced in this pass.

## Coastal correction

The coastal alternative previously inherited the original city-balcony rain boundary. The renderer now retains the bundled background ID from `experience:loaded` and selects coastal geometry for rain. This works even when the page marks an alternative background as `custom`, as both Studio and portable playback use the shared loader. Uploaded images do not inherit the coastal-specific mask. Visible bundled background names no longer include `(AI)`.
