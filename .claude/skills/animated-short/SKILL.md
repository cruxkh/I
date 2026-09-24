---
name: animated-short
description: Produce a festival-grade 2D animated short (default 60 s, 1920x1080, 30 fps MP4) with story, voiced dialogue, lip-sync, sound design, original score and optional brand end card, using a code-driven "virtual animation studio" of parallel agents. Use when the user asks for an animated video / סרטון אנימציה / "כמו חבילה מהבית" / "the animation method" / "תפעיל את הסטודיו".
---

# The Code-Driven Animation Studio ("שיטת הסטודיו")

Reference production: `anim/` in this repo ("Packet From Home · חבילה מהבית", GOTV promo). Reuse its tools; copy
`anim/engine.js`, `anim/engine_post.js`, `anim/render.js`, `anim/tools/{tts.py,mix.py,build.sh}` into a new folder and
rewrite the content. Read `anim/BIBLE.md`, `anim/SCENES.md`, `anim/KITS_API.md` as examples of the documents to write.

## Stack (all procedural; nothing is drawn by hand, no image AI)
- **Picture:** HTML Canvas2D drawn by JavaScript, rendered frame-by-frame in headless Chromium via Playwright
  (`render.js`: stills, contact sheets, parallel full render). Every frame is a pure function of time `t`.
- **Voices:** Kokoro neural TTS (English voices; models from GitHub releases of thewh1teagle/kokoro-onnx into /opt/kokoro).
  Pitch-shift per character, per-frame lip-sync envelopes and word timings are generated into `kits/lipsync.js`.
  Hebrew speech TTS is not reachable from the sandbox, so dialogue is English with big Hebrew subtitles.
- **Fonts:** Rubik / Secular One / Fredoka / Bangers from google/fonts on raw.githubusercontent.com (Hebrew capable).
- **Sound effects:** synthesized in numpy/scipy (layered, enveloped, convolution reverb) + a JSON cue sheet.
- **Score:** GeneralUser GS SoundFont (GitHub) rendered with `tinysoundfont` + numpy-synthesized instruments, hits aligned to sync points.
- **Mix:** `tools/mix.py`: per-location voice FX (room / PA / TV / data / underwater), sidechain ducking, glue comp,
  -15 LUFS, look-ahead limiter. **Encode:** ffmpeg (from `imageio-ffmpeg`) x264 CRF 17 + AAC.

## Pipeline (the director = the main session; up to ~13 agents)
1. **Director alone:** story (logline + beat table with exact global seconds), dialogue `audio/script.json`,
   run `tools/tts.py` (fix overlaps), write `BIBLE.md` (story, sync table, style, colour script, character designs,
   EXACT kit API contracts, determinism/perf rules, text rules), `SCENES.md` (shot list per scene file).
2. **Phase 1, in parallel (background agents):** 2 character-kit agents, 2 environment-kit agents, 1 sound designer,
   1 composer. Each writes only its own files, builds a demo page, renders previews, LOOKS at them and iterates.
   While they work the director writes `tools/mix.py` + `tools/build.sh`.
3. **Review:** director reads previews, collects each kit's API report into `KITS_API.md`, shows the user sheets.
4. **Phase 2:** one director-agent per scene file (6 scenes), each launched as soon as the kits it needs are done.
   Scene agents may add `audio/cues/<scene>.json`.
5. **QA agent:** full contact sheets over 0 to 60 s, continuity across cuts, subtitle band clear, perf, text rules.
6. **Build:** `tools/build.sh` → `out/<name>.mp4`; send the MP4 to the user; commit + push (large audio stems gitignored).

## Rules that made it work
- Kit API contracts are fixed in the bible BEFORE agents start, so kits and scenes can be built in parallel.
- Sync-point table in global seconds is law for picture, SFX and music alike.
- Determinism (no Math.random/Date), `A.layer` caching, ≤ 250 ms/frame.
- Every agent must render and visually inspect its own output (Read tool on PNGs) and iterate.
- Client text rule: no em/en dashes in on-screen text; avoid repetitive dialogue ("go go go go").
- If the session hits a usage limit, resume each agent with SendMessage to its id: files on disk are kept.

## How the user starts a new one
"תפעיל את שיטת הסטודיו (animated-short) על: <נושא>, <אורך>, <מותג/לוגו לסיום>"
