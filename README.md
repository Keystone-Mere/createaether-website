# Aether

Aether is a modular experience engine for creating and shaping immersive digital atmospheres through controllable audio, lighting, particles, fog and environmental effects.

The project is developed by [Keystone Mere Ltd](https://keystonemere.com).

## Current status

🟢 **Working MVP**

The browser-based Studio currently supports:

- Five experience presets: Temple, Forest, Ocean, Christmas and Storm
- Live atmosphere previews
- Controllable soundscapes and volume
- Lighting, fog and particle controls
- Local saving and importing of experience configurations
- Reusable JSON-based presets
- A modular TypeScript runtime

Try the current showcase at [createaether.com](https://createaether.com).

## MVP purpose

The current MVP is designed to prove that users can:

1. Choose an atmosphere preset.
2. Adjust its audio and visual systems.
3. Preview their changes immediately.
4. Save the resulting configuration locally.
5. Return to refine the experience.

Marketplace distribution, publishing, account services and a public SDK remain planned rather than current features.

## Experience presets

| Experience | Atmosphere |
|---|---|
| Temple | Meditative ambience, subtle lighting and ritual atmosphere |
| Forest | Layered woodland audio, particles and responsive ambience |
| Ocean | Waves, wind and slow cinematic movement |
| Christmas | Warm seasonal lighting, snowfall and winter ambience |
| Storm | Rainfall, thunder, shifting light and atmospheric audio |

## Technology

The current application uses:

- Astro
- TypeScript
- HTML Canvas
- CSS
- Browser local storage
- Cloudflare Pages
- Auth0
- PostHog
- Sentry

## Repository structure

```text
docs/       Project documentation
website/    Public website and Aether Studio MVP