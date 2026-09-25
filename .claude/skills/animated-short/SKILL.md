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

## Timing and craft (from JohnHeibel/ClaudeAnimationBase ANIMATION_GUIDE.md, adopted by the user)
- **Model the viewer: write the reads.** For every shot, list in order what the viewer must understand ("reads"), each with
  a start and end time. Each read needs time for the eye to find it, understand it, and register it before the next starts.
  One read at a time; cause, then reaction, in sequence. Fast actions, slow meanings: anticipate, act fast, then HOLD.
  Lead the eye (something moves / lights up / is looked at) before an important read. Reads set the shot length.
- **Nothing ever still** (idle motion, camera drift), **faces act, never snap**, characters big enough to feel.
- **Transitions at every seam**, chosen for the story (match cut, cut on action, whip with smear, iris, carry-through
  camera move). Never a pop; props arrive/leave on arcs. Never "zoom in then immediately zoom out".
- **Avoid twinning:** offset phases/seeds so crowds, arms and blinks never move in unison.
- **Rhyme the ending with the opening**; keep screen direction consistent across cuts; props carry over.
- **Review loop, three zooms:** contact sheet (shape of the piece), STRIP of every frame for each key motion and every
  seam/transition (catches pops, flashes, 1-frame glitches), and full-res CROPS of faces/text. Count frames per read.
- Not adopted: the guide's "no text" rule (this client needs Hebrew subtitles, brand, signs) and its p5.brush
  hand-painted boil look (a different style; would mean redrawing everything).

## Lessons from this client's feedback (GOTV promo, v1 to v7)
- Anything that flashes for a second before its moment reads as a BUG (a sign visible too early, a location shown
  out of order, a zoom in/out bounce). Reveal things only when the story reaches them.
- Cinematic, commercial-grade camera language: chase cam behind the hero, over-the-shoulder two-shots, side tracking;
  avoid awkward giant close-ups with the hero tiny in a corner.
- Drone shots must FEEL like a drone: one continuous stabilized glide, slow yaw, gentle float, gimbal tilt change.
- Crowds (stadium) must be rich and alive: jumping, scarves, flags, tifo, flares; team is Maccabi Tel Aviv (yellow/blue).
- Scoreboards in RTL: put each team's number next to its own name.
- Mobile deliverable must be under 30 MB: 2-pass x264 at ~(28.5 MB x 8 / duration) kbps; keep film grain light and held
  2 frames or busy scenes (ocean particles) turn blocky.
- Retiming without rewriting: load a scene file after `A.SHIFT = d` (engine.js) and shift its cue file in mix.py.
- Always explain back to the user what you understood before a big change when they ask; answer in Hebrew.

## How the user starts a new one
"תפעיל את שיטת הסטודיו (animated-short) על: <נושא>, <אורך>, <מותג/לוגו לסיום>"
