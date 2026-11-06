# Music integration and CI validation

## Preserved engine

NeonDAW remains the original browser DAW: 8 modules, Tone.js synthesis/samples,
project persistence, mixer/effects, JSON import/export and offline WAV rendering.
No audio algorithm, transport, project format or module functionality was replaced.

Source: https://github.com/XanthanL/neon-daw
Pinned upstream commit: `81eef8ae073bd600adeed531670167b02a7dacb5`.
MIT license is copied unchanged to `/TO_startup/engines/music/LICENSE.txt`.
The upstream README attributes piano samples to Alexander Holm (Salamander Grand
Piano v3, CC BY 3.0) and other instruments to Frank Neff (FluidR3_GM via
midi-js-soundfonts, CC BY 3.0). Bundled samples are preserved unchanged.

`prepare-music.mjs` applies four small integration/accessibility adjustments:

- `MotionConfig reducedMotion="user"` and CSS reduced-motion support;
- Enter/Space, accessible names and `aria-pressed` for sequencer cells;
- browser pinch zoom is allowed;
- home module names and descriptions wrap on narrow screens.

## Wrapper

`Beat.tsx` / `Beat.css` add a responsive header, return action, direct app link,
fullscreen control where supported, loading feedback, a 25-second timeout and
retry. The entrypoint probe rejects HTTP errors and SPA fallback HTML; readiness
requires React content in the same-origin iframe. Network attempts and timers are
cleaned up on unmount. Fullscreen gracefully falls back to focusing the iframe on
unsupported devices, with the direct link always available.

## Reproduction

```sh
npm ci
npm test
npm run build
bash scripts/build-upstream-engines.sh
npx playwright test tests/music.spec.ts --workers=1
```

The engine build uses its own upstream lockfile with `npm ci`, an exact git SHA,
a fresh temporary directory and cleanup trap. It works outside GitHub Actions.
Optional `ENGINE_OUTPUT_DIR` overrides its target. Coloring assets are versioned
separately under `public/coloring`, and this script does not overwrite them.

## Browser scenarios verified locally

Actual Chromium desktop and Pixel 7 emulation were used to verify:

- opening and closing the embedded DAW;
- toggling a sequencer step and restoring it after reload;
- keyboard activation of a step;
- Play/Stop;
- downloading a project JSON and inspecting its patterns;
- real offline WAV export, inspecting RIFF/WAVE headers and nonzero audio data;
- no page errors and no failed music-resource HTTP responses during those flows;
- unavailable engine feedback and successful retry.

A mobile screenshot was inspected at `/workspace/artifacts/music-mobile.png`.
During concurrent work, rebuilding `dist` removed the music bundle, and parallel
Playwright processes cleared each other's default trace folders. These were test
coordination failures; reruns should use one production build and one full suite,
or separate `--output` folders. Parent integration QA supplies the final complete
run and deployed-site status.

Observed upstream limitations: the DAW interface is English/Chinese; its idle
AudioContext initialization can generate browser autoplay warnings before a user
gesture. User-triggered playback and export succeeded. The engine bundle is about
839 kB raw / 242 kB gzip, loaded only on the music-app route. The full music asset
folder is about 14 MB, including unchanged local instrument samples. No real
Android/iPhone hardware, microphone capture or audible speaker output was available;
mobile checks use browser emulation and WAV data validation.

## Publication gate

The Pages workflow calls reusable `quality.yml`. It installs from the root lockfile,
runs unit tests and production TypeScript/Vite build, builds the pinned DAW, then
runs Playwright and checks required production/license files. Only that tested
Pages artifact can reach deployment (`needs: verify`). Browser evidence is saved
on failure. Final GitHub run/deployment status is verified by the parent agent.

## Firefox audio-backend investigation (2026-11-06)

The Firefox full-suite run passed six of seven scenarios; the musical Play/Stop
scenario could not resume its AudioContext. Instrumenting native contexts found
`resume()` pending indefinitely, `state=suspended`, `currentTime=0`, and
`baseLatency=0`, after an actual user click.

A separate minimal native Web Audio page (no Tone.js, NeonDAW, or iframe) reproduced
the same pending resume. Three Firefox configurations were tested: default,
autoplay explicitly allowed, and an explicitly selected null cubeb backend with
autoplay allowed. All three reproduced it. This execution environment had no
`/dev/snd`, no running PulseAudio/PipeWire service, and no PulseAudio tools.
This isolates the failure to the environment's Firefox audio backend rather than
the DAW integration or autoplay policy. No engine code was changed to fabricate a
successful transport state. A working system audio backend is needed to complete
that Firefox playback validation.

Investigation evidence (workspace artifacts): `artifacts/firefox-diagnosis.log`,
`artifacts/firefox-native-diagnosis.log`, `artifacts/firefox-investigate.mjs`, and
`artifacts/firefox-native-audio.mjs`. These are diagnostics, not production assets.

### Firefox backend resolved

A local PulseAudio daemon and a genuine `module-null-sink` were then started from
SHA256-verified Debian 13 packages extracted under `/workspace/audio-runtime`.
No system files or browser AudioContext implementation were replaced. With
`PULSE_SERVER=unix:/workspace/audio-runtime/run/native`, the existing Firefox music
suite passed **2/2**: full sequencer edit/persistence/keyboard/Play/Stop/JSON and
nonzero WAV export in 9.2 seconds, and error/retry in 0.94 seconds. No Firefox
preference or DAW engine change was needed. This confirms the original failing
transport scenario was caused by the unavailable system audio backend.

`quality.yml` now installs all three real browser engines (Chromium, Firefox,
WebKit) with their OS dependencies and starts a real PulseAudio null sink through
`scripts/start-ci-audio.sh` before E2E. The null sink is an operating-system audio
output device; it does not simulate browser transport state or exported samples.
The final integrated browser-suite result is recorded by the parent agent.
