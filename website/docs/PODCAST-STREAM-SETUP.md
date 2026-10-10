# Aether Podcast & Stream - first demo

Open `/studio/podcast/` (also linked from the dashboard, sidebar and the main CTA on `/podcasts/`).

## Included

- Liverpool waterfront viewed from a fictional lounge on the Wirral: an AI-generated interpretation of a real location.
- One-host, two-person and no-frame layouts; camera guides appear only in the editor.
- Show name, tagline/episode title, host/guest names, accent colour and optional raster logo.
- Still, Subtle and Atmospheric rain. Rain is masked to the window. Reduced-motion preferences override animation.
- Automatic browser-local saving, reset, full-screen preview with an exit button.
- Silent, self-contained text/layout playback links and downloadable HTML wrappers that include logos.

## Install

Extract the ZIP into the repository root, so its `website` folder merges into your existing `website` folder. No new npm dependencies are required.

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\aether-podcast-stream-patch.zip" -DestinationPath "C:\Users\Tom\Documents\createaether-website" -Force
```

If the development server is not running:

```powershell
npm --prefix "C:\Users\Tom\Documents\createaether-website\website" run dev
```

Open `http://localhost:4321/studio/podcast/`.

## OBS

1. Add a Browser source with width 1920 and height 1080.
2. For a link: paste the copied link. For a logo: download the OBS file, enable Local file in the Browser source and select that HTML file.
3. Add your camera sources above the Aether source and position them just inside the preview frames. Camera positions and sizes are shown under Set up in OBS.
4. The output never includes camera placeholders or audio. Add participants, recording and sound using your existing OBS workflow.
5. Each copied link or downloaded file is a snapshot. Export again after making changes.

A downloaded HTML file still needs internet access to load the hosted scene. Links/files generated on localhost need the local dev server to remain running. Once deployed, create a new link/file from the live site for use without the dev server. Logo files stay in the browser's local storage and in the downloaded wrapper; regular links omit logos, with that distinction labelled in the UI.

## Checks completed

The supplied source was built with Astro 7.3.2 using an isolated static configuration. Browser checks covered image loading, text/layout editing, Unicode text and HTML-like text rendering safely, browser-local restore, invalid link handling and hash recovery, logo preparation, local-file iframe playback and reload, silence, hidden camera guides in output, reduced-motion changes, fullscreen entry/exit and mobile overflow. The original repository's package/config and remaining public assets were not included in the source ZIP. Native OBS and a two-hour recording remain local acceptance checks.

## Image provenance

Asset: `website/public/images/podcast/wirral-liverpool.jpg`.
Created with the built-in image-generation tool, then converted to JPEG for the website. The fictional lounge was retained while replacing the window view with an interpretation of Liverpool's waterfront across the Mersey. The user supplied a screenshot of geographic references and accepted the resulting image. This is not a documentary photograph or a promise of exact architectural accuracy.

Final image prompt:

Use case: lighting-weather / precise background replacement. Image 1 is the edit target: our generated modern rainy lounge backdrop. Image 2 is a geographic reference screenshot only, showing Liverpool waterfront viewed across the River Mersey from Wirral. Edit image 1: replace ONLY the scene through the large picture window with a photorealistic blue-hour rainy view across the broad River Mersey from a waterside lounge on the Wirral near Seacombe, looking toward Liverpool Pier Head and city skyline. Recognizable Royal Liver Building with twin clock towers and Liver Birds, adjacent Cunard Building and domed Port of Liverpool Building, Museum of Liverpool, modern waterfront towers and distant Radio City Tower. Natural credible relative scale and arrangement, city all on far bank across wide river, soft reflections of waterfront lights in grey-blue Mersey water. Window view should be unobstructed, remove foreground trees and garden from outside only. Preserve exact lounge interior, sofa, lamp, wood, camera viewpoint, window opening and frame coordinates. No text, no UI, no people, no camera panels. Preserve wide 16:9 format. Architectural interpretation of a real location, not a historical or documentary claim. Quiet tasteful scene, city details visible rather than tiny or hidden in darkness. Rain outside only.
