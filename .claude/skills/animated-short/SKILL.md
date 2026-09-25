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

## STEP 0, ALWAYS: offer the visual style menu (before any story or code)
At the start of EVERY new video project, remind the user (in Hebrew) that the look is a choice, present this menu with a
one-line description each, recommend 2 that fit their topic, and let them pick (or mix). Then render 2–3 style-test
frames of a key moment in the chosen style and get approval BEFORE production. Record the choice in BIBLE.md.
Lesson: the client's first film used "glossy digital vector" and later felt it looked artificial next to a hand-painted
watercolor video; offering the menu up front avoids that.

| # | Style (Hebrew name) | Look | How to build it here | Effort |
|---|---|---|---|---|
| 1 | Hand-painted watercolor (ציור ידני בצבעי מים) | brush strokes, soft pigment washes, paper texture, 12 fps "boiling" ink lines, soft muted palette, no pure black/white, simple staging | p5.brush (`paint()`/`inkLine()` style) per JohnHeibel/ClaudeAnimationBase ANIMATION_GUIDE.md; boil seeds reset 12x/s; paper grain multiplied on top; `glow()` for light only | high (all art in brush) |
| 2 | Glossy digital vector (דיגיטלי מבריק), this repo's default | clean vector shapes, gradients, rim light, neon glows, dense detail | Canvas2D kits as in `anim/` | medium |
| 3 | Painterly filter over vector (שכבת ציור על וקטור) | vector art made to feel hand-made: paper, edge wobble, watercolor bleed, desaturated palette | post-pass in `engine_post.js`: paper texture multiply, noise displacement at 12 fps, edge darkening, palette grading | low (filter only) |
| 4 | Flat motion graphics (מושן גרפיקס שטוח / אינפוגרפיקה) | flat colors, geometric shapes, bold type, smooth eased moves; corporate/explainer | Canvas2D, no gradients, strict grid, kinetic typography | low-medium |
| 5 | Paper cut-out / collage (גזרי נייר / קולאז') | layered paper with drop shadows, torn edges, stop-motion stutter at 12 fps | textured shapes with torn-edge masks, soft shadows, hold every 2 frames | medium |
| 6 | Anime cel-shaded (אנימה) | clean ink lines, 2-tone cel shading, speed lines, dramatic skies and light | Canvas2D with hard shadow shapes, painted BG layers, bloom | high |
| 7 | Comic / Spider-Verse (קומיקס) | halftone dots, bold ink, offset color print, onomatopoeia panels, frame-rate on 2s | halftone pattern fills, misregistration offset, panels | medium-high |
| 8 | Retro rubber-hose 1930s (קרטון רטרו, בסגנון Cuphead) | black-and-white or sepia, bouncy limbs, film scratches, vignette, jazz | noodle limbs, pie eyes, sepia grade, scratch/flicker overlay | medium |
| 9 | Pencil / chalk sketch (סקיצה בעיפרון / גיר על לוח) | graphite or chalk lines, hatching, eraser marks, drawn-on reveal | stroked noisy lines, hatch fills, progressive stroke reveal | medium |
| 10 | Children's book crayon (ספר ילדים בצבעי פנדה) | crayon texture, wobbly outlines, warm pastel | crayon texture brushes, pastel palette | medium |
| 11 | Claymation look (פלסטלינה) | soft rounded 3D-ish blobs, fingerprints texture, stop-motion stutter | radial shading, noise texture, hold frames on 2s | medium-high |
| 12 | Neon synthwave (ניאון רטרו שנות ה-80) | dark background, glowing neon lines, grid horizon, chrome text | additive glows, grid perspective, scanlines | low-medium |
| 13 | Pixel art (פיקסל ארט) | low-res pixel sprites, limited palette, retro game feel | render at 320x180 and nearest-neighbour upscale | medium |
| 14 | Low-poly 2.5D (לואו-פולי) | faceted geometric shapes with flat shading, parallax depth | triangle meshes with per-face shading, layered parallax | medium |

### Style 1 in practice (hand-painted watercolor), learned from JohnHeibel/PDoomVideo + ClaudeAnimationBase
- Engine: ClaudeAnimationBase (MIT) in `painted/` (p5 + p5.brush + puppeteer). No GPU here: run render.mjs with
  `--soft-gl` and `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (~30 s/frame; use workers, few-frame sheets).
  PDoomVideo has no licence: use it as style reference only, never copy its code.
- SPEED on soft GL (measured, painted v1):
  - `NO_FILL = true` in core.js: paint() turns p5.brush fills into washes. A fill cost 1.5 to 300 s; now a frame takes seconds and the look barely changes.
  - Batch glows (`glowQ`/`glowFlush`); never loop `glow()`.
  - Render with `--pd=0.5` (pixelDensity .5, upscaled on composite; grain and subtitles stay full-res): 3.5x faster, same look.
  - One browser's SwiftShader GPU process is the bottleneck. Run 3 render processes in parallel on split `--range`s (2 workers each) with `--recycle=400`.
  - Render at 12 fps and encode with `-r 24`, which gives the "on twos" hand-drawn feel.
  - Sheet "ms/frame" numbers lie (GPU is async). Time real frames with `--stills`.
  - Never `pkill -f` a pattern that is also in your own shell command (it kills your shell). Use `pgrep -x node`/`pgrep -x chrome`.
- Look: picture-book watercolour and ink. Characters = flat `wash` colour + boiling ink outline (sw ~0.8–1.6);
  backgrounds = soft watercolour `fill` shapes (bleed ~.05–.3, tex ~.3–.9), usually no outline; light = low-opacity fills
  or `glow()`; texture from fills/occasional hatch, not noise. Soft saturated palette, never pure black/white.
- Keep it SIMPLE: fewer, bigger shapes (hundreds of fills fine, thousands not); one focal action, big silhouettes
  (lead character ~40% of frame height in key shots); a clear chapter palette arc.
- Sets, not cards: each chapter lives in one place the camera moves through; recurring set/prop pays off.
- Motivated transitions: brush wipes at chapter breaks; inside chapters the action carries the cut (chomp to black, zoom
  through an eye, flash, door slam). Every shot has a push/pan/tilt/whip/zoom or on-beat shake.
- Everything on the beat (pulse/beat helpers); squash-stretch, anticipation, `backOut`/`elasticOut` overshoot.
- Mood changes never snap: squint, squash "take", emote pop, then new eyes (`mood()` / `emotions()`).
- Text-light: a few big comic SFX words at most; the subtitle band (our house subtitle style) is the only running text.
- Storyboard as tables per chapter (time | line | shot | out-transition) with a palette per chapter; rhyme the ending
  with the opening (PDoom opens and closes on the same curtain).

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
- **Subtitles: ALWAYS use this production's subtitle style** (the client loves it; implemented in `anim/engine_post.js`
  `subs()`, copy it as is): big bold Hebrew line (Rubik 700, 50 px, cream `#fff8e6`, dark stroke, rtl) on a rounded
  translucent dark pill at the bottom centre, with a smaller English line under it (Rubik 500, 26 px) whose words light up
  yellow `#ffd84a` one by one in sync with the voice (word timings from `tools/tts.py`); soft fade/slide in and out; keep
  key action out of the bottom ~140 px while someone speaks; `A.noSubs(t)` to hide them on title/end cards.
- Always explain back to the user what you understood before a big change when they ask; answer in Hebrew.

## How the user starts a new one
"תפעיל את שיטת הסטודיו (animated-short) על: <נושא>, <אורך>, <מותג/לוגו לסיום>"
