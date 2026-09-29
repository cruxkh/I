# STUDIO PLAYBOOK: "Big-league" creator promo videos (GOTV v7 template)

> **בעברית בקצרה:** זה המסמך המלא של הסרטון של GOTV (גרסה 7): הסגנון, הכלים, הסוכנים, סדר העבודה, הפקודות המדויקות, מה עבד ומה לא.
> **לסשן חדש:** פותחים סשן, מדביקים את הפרומפט מסעיף 12 ומצרפים קובץ קריינות (WAV) וסרטון של עצמך.

Reference result: GOTV ad v9 (smooth motion, flowing holds). Files: `gotv5/out/gotv_v9_mobile.mp4` (vertical) and `gotv5l/out/gotv_v9_landscape_tv.mp4` (landscape). Both are 44.6 s long and use one audio master, `gotv5/audio/v7/master_v7t.wav`, which is `master_v7.wav` after `tighten_v7.py`.
Code: `/home/user/I/gotv5` (vertical 1080x1920) and `/home/user/I/gotv5l` (landscape 1920x1080). Git branch `claude/israeli-iptv-animation-8qu3xo` of `cruxkh/I`.

---
## 1. What the product is

- **Inputs from the client:**
  - A Hebrew voice-over, TTS from Cartesia, about 37 s: `audio/v6/vo_original_tts.wav`, 44.1 kHz mono.
  - Its exact text.
  - A talking-head video of the client: 720x1280, 23.976 fps, 54 s.
  - Business name (GOTV), content list, team colours (Maccabi Tel Aviv yellow and blue), end-card text.
- **Output:**
  - A vertical 9:16 film for phones and a landscape 16:9 film for TV and PC, both 30 fps H.264 with AAC 256k.
  - A sendable version under 25 MB of each; the chat upload failed on a 28 MB file and succeeded on 23 MB.
  - The audio master as a WAV.
- **Look ("PAPER COLLAGE stop-motion"):**
  - Paper and props: kraft and cream paper, torn-edge scraps, tape, and white die-cut sticker outlines with hard (no-blur) shadows.
  - Marks and lettering: marker marks, halftone dots, and ransom-note cut-out word chips as captions.
  - Motion: SMOOTH, continuous 30 fps with motion blur (v8). The original 12 fps stop-motion stepping (boil, stepped pops, 8-12 fps moves) read as LAG to the client and was removed: see section 7.2.
  - Forbidden: glow, bloom, blur, neon and gradients as the main look.
- **Brand elements:**
  - Real logos (Netflix, Disney+, Apple TV+, Sport 1-5, Israeli channels) as taped paper cards.
  - No real Charlton image existed, so Charlton is a designed paper wordmark.
- **Host:** the client, cut out of their video as a die-cut paper sticker (white outline, hard shadow, 12 fps jitter). The sticker pops in from edges and corners, peeks, and does big centred or side shots. The footage is matched to the voice energy.
- **HOLDS (the signature move):** the voice-over pauses and the picture holds on a moment that plays its own sound. The camera pushes in and an overlay adds its effect.
  - `cin` (after "וצ'רלטון"): the narrator's word turns into a deep movie-trailer voice. Letterbox bars, projector flicker, sepia and film scratches. The echo repeats "צ'רלטון... צ'רלטון...", a trailer boom and THX-like swell play, and "GOTV PRESENTS" appears.
  - `tur` (after "טורקיות"): Turkish-drama sting. Dum-dum-DUM hits, a Hijaz string tremolo, ney and kanun, a sob, a "Neden?!" bubble and falling tears.
  - `kor` (after "קוריאניות"): K-drama piano with strings, a spoken "사랑해요!" bubble and floating hearts.
  - `ani` (after "אנימה"): anime-opening rock sting, a "すごい！" voice, rotating rays and sparkles.
- **Story beats (scene map, v = voice clock):**

| Beats | v (s) |
|---|---|
| Hook (messy desk, then everything sucked into one TV, then the GOTV logo) | 0-5 |
| Live Israeli channels, Netflix, Disney+, Apple TV | 4.8-9.4 |
| Sports: Sport 1-5 strip, Sport 5 hero, Charlton | 8.8-12.4 |
| Series (Turkish, Korean, anime posters, avalanche) | 11.8-15.9 |
| Library calendar tearing a page per weekday, "NEW" stamps, gift box, eye | 15.6-20.9 |
| Fast and smooth (speedometer, river, progress bar), then suspense curtains and "?" | 20.5-25.9 |
| "אין תקיעות. נקודה." giant stamps, buffering wheel crossed out, goal that never freezes | 25.4-30.5 |
| Remote press, TV on, recap of logos, thumbs up | 29.9-36.9 |
| End card: GOTV logo, "הטלוויזיה של ישראל", "(התקנת אפליקציה על המסך החכם)" | 36.9-40 (+ holds = 44.6 total) |

## 2. Client rules learned (keep them)

- Reply in Hebrew. Explain your understanding before big changes. Send progress images.
- The client is impatient: always give a time estimate, and answer "done?" with a real status check (look at the files, don't guess).
- No em dashes or en dashes in any on-screen text. Spell "טורקיות", never "תורכיות".
- Sync must be word-exact: visuals and captions land on the word start. "אנימה" once appeared a second late, and that was a major complaint.
- Things shown too briefly are a complaint. The fix was HOLDS: pause the voice, let the moment breathe, then continue exactly where it stopped.
- Sound rules:
  - No marker squeak, scribble or paper rustle, and no hiss beds: "הגועל הזה".
  - Childish music (marimba, ukulele) was rejected.
  - A synth 808 "TikTok" track was rejected as poor quality.
  - What won: an epic action anthem built from REAL recorded orchestral samples, premium layered SFX, genre pastiches in the holds, and the ORIGINAL TTS kept unprocessed.
- Creativity is expected: "תעשה משהו מטורף". Propose one bold idea and build it (for example the cinema-trailer voice).
- Captions: big bold Hebrew word chips plus a small English gloss whose words light up. A "pill" highlight was rejected as ugly.

## 3. Tools (all offline in the container)

| Purpose | Tool |
|---|---|
| Frame renderer | Canvas2D in headless Chromium via Playwright (`render.js`); every frame is a pure function of time; `/opt/pw-browsers` |
| Encode | ffmpeg binary `/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2` |
| Word alignment | sherpa-onnx Whisper (small) + espeak-ng Hebrew synthesis + MFCC DTW (`gotv4/yt/align.py`), silence-delimited segments |
| Person matting | `rembg` with the `u2net_human_seg` model (`gotv4/yt2/matte.py`), 3 parallel processes |
| Host to VO matching | voice-activity / energy envelope correlation (`gotv4/yt2/plan_v5.py`) |
| Logos | public tv-logo/tv-logos repo (sparse clone) -> `assets/logos/*.png` |
| Orchestral samples | VSCO-2-CE (CC0, GitHub `sgossner/VSCO-2-CE`, sparse checkout of strings, brass, timpani, perc, harp, piano), Virtuosity Drums (CC0); numpy sampler `gotv5/audio/v7/sampler.py` |
| Soundfont (only for choir, ney, glock, celesta) | GeneralUser GS `anim/audio/music/sf/GeneralUser-GS.sf2` via `tinysoundfont` |
| Physically modelled SFX | numpy/scipy toolkit from `anim/audio/tools/sfx.py` (Karplus-Strong, modal, noise shaping, generated convolution IRs); library `anim/audio/sfx` with `INDEX.md` |
| Foreign voices | Kokoro-82M (`/opt/kokoro`), driven with IPA phonemes for languages it lacks (Korean, Turkish); checked with Whisper ASR. HuggingFace was blocked (403). GitHub worked. |
| Voice FX | WORLD vocoder (pyworld) for pitch shift with formant keep (trailer voice, sob), convolution reverb |
| Loudness | pyloudnorm-style integrated LUFS -14, true peak <= -1 dBTP, look-ahead limiter (no loudnorm filter) |
| Delivery | `SendUserFile` (keep each file under ~25 MB; retry smaller if the upload fails with 500); private Artifact page with a `<video>` as a fallback |

## 4. Project structure (gotv5)

```
index.html      loads: engine.js, timeline.js, words.js, lines.js, cl.js, scenes/s0..s8, host/plan2.js, host/host.js, main.js
engine.js       A.* math/easing/noise, A.scene({name,start,end,draw}), A.renderFrame(f) (uses A.tMap = TLF.vOf)
timeline.js     TLF: HOLDS [{v,d,k}], vOf(T), holdAt(T), TofV(v), TOTAL; sets A.DUR
cl.js           CL.* paper kit: paper(kind), scrap, tornPath, tape, sticker (die-cut), logoCard, chip, title,
                marker underline/circle/arrow/cross, star, sparks, halftone, tv(), stop-motion helpers q/j/pop/shake, palette CL.C
main.js         compositor: HOST.prepare/overlay, whole-frame 12 fps jitter + phrase punch-in, hold camera push-in,
                cinema() overlay, holdOverlay() bubbles, ransom-note captions + English gloss, grain, fades
scenes/*.js     one file per story beat (each draws its own paper background + its own entry wipe)
host/host.js    APPS list of appearances (time, side, size, flip, entry), sticker build from src jpg + mask png
words.js        WORDS [{w,t0,t1,ph}] (voice clock), lines.js A.LINES (Hebrew + English gloss per phrase)
render.js       --frames a,b | --sheet A:B:N --fast --prefix x | --range 0:N --workers 3 --out out/frames
audio/v7/       voices_v7.py, sfx_v7.py, score_v7.py (+ sampler.py, samples/), mix_v7.py -> master_v7.wav
BRIEF_V5.md     the brief every agent reads first (look rules, hard rules, scene map)
```
Landscape (`gotv5l`): the same files with W/H switched (1920x1080), captions at y 900, render viewport 960x540, sheet tiles 384x216. Each scene is RE-COMPOSED for the wide frame, not stretched.

## 5. Pipeline, step by step (with timings from the real run)

1. **Intake (5 min).** Check the uploads (`ffmpeg -i`) and read the VO text. Confirm your understanding in Hebrew in 3-4 lines. Ask for missing logos only if they are critical, and otherwise design a wordmark.
2. **Word alignment (15 min).** Produce `words.json` with every word's t0/t1 and phrase id, then generate `words.js` and `lines.js`. Verify by listening-free checks: phrase gaps must match silences.
3. **Host footage (20-30 min, can run in the background).**
   - Extract frames from the video.
   - Build a talking-head mask per frame (rembg, 3 processes).
   - Compute per-frame head anchors.
   - Pick footage segments whose speech-energy envelope matches the VO segment. Drop split-screen or dark frames.
4. **Kit + compositor + brief (20 min, done by the director = you).** Write `cl.js`, `main.js`, `timeline.js` (start with holds empty) and `BRIEF.md` with:
   - LOOK rules.
   - HARD rules: determinism, RTL, no dashes, sync to `t0`, captions band, logos API, a `// CUE <t> <text>` comment on every big moment for the sound team, test commands, performance tips, a 5-line report.
   - SCENE MAP.
   - Host notes and audio notes.
   - Render one test frame.
5. **Agents (15-25 min wall time, all in parallel, `run_in_background`).**
   - **One agent per scene file (7-8 agents):**
     - Give each a vivid creative direction per beat, with exact word times and "keep y 1290-1560 for captions".
     - Each agent renders sheets, looks at them, iterates, and reports in 5 lines.
   - **1 host agent:**
     - `host/host.js`: sticker look and about 16 appearances timed to words.
     - Keep him off the scenes' key content.
   - **1 composer:** see section 7.
   - **1 SFX + voices + mix agent:** see section 8. It greps `// CUE` comments and polls for the score.
6. **Director review.**
   - Render `--sheet 0:END:40 --fast` and look at the whole film.
   - Fix overlaps. Typical problems: host covering posters, captions on faces, entry frames.
   - Relay fixes to the owning agent with SendMessage, which resumes the same agent with its context.
7. **Holds (the client asked for "time to breathe").**
   - Add `{v, d, k}` entries to `timeline.js`.
   - Add a focus point per hold in `main.js` HOLDFOC.
   - Add the overlay in `holdOverlay` / `cinema`.
   - Captions are hidden during holds.
   - Write `audio/.../timeline.json` for the audio agents (T = v + sum of d for holds before v).
8. **Render.** `node render.js --range 0:N --workers 3 --out out/frames7` runs at about 1.2 s per frame per worker at 1080x1920. 1386 frames with 2 projects in parallel took about 10 min. Use 3 workers per project when 2 run at once, because the container was OOM-killed once when ffmpeg ran on top.
9. **Encode.**
   - Full: `-c:v libx264 -preset medium -b:v 4200k -maxrate 6000k -bufsize 9000k -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest`. At 46 s this gives about 25 MB.
   - Web fallback: 720p at 1000k gives about 9 MB.
   - The full-quality CRF 19-20 version (50-140 MB) is only for keeping.
10. **Deliver.** SendUserFile the landscape, vertical and WAV files together. Commit and push, keeping big binaries out of git: out/, previews/, frames, npy, samples, and any file over 20 MB.
11. **Landscape version.**
    - Copy the project and patch the shared files to 1920x1080.
    - SendMessage every scene agent: "re-compose your own scene for 16:9, same timings, keep a 500 px side free for the host".
    - SendMessage the host agent: "place the sticker in the left or right third, alternate sides".
    - This took about 10 min wall time.

## 6. Agents used (final run: 10 concurrent at peak; about 15 over the project)

| Agent | Output | Notes |
|---|---|---|
| s0 hook | scenes/s0_hook.js | messy desk, suction into TV at 1.98, ransom logo at 3.58 |
| s1 live+OTT | s1_live_ott.js | Israeli channel cards, Netflix slap 7.02, Disney+, Apple TV |
| s2 sports | s2_sports.js | pitch, crowd, Sport 1-5 strip, Sport 5 hero 10.4, Charlton 11.11 |
| s3 series | s3_series.js | 3 genre posters on their words, avalanche |
| s4 library | s4_library.js | week calendar tearing per day, NEW stamps, gift box, eye |
| s5 smooth | s5_smooth.js | TV, speedometer, river, curtains, raised stamp held for 25.64 |
| s6 no-freeze | s6_nofreeze.js | giant stamps, crossed buffering, goal that never freezes |
| s7+s8 press/end | s7_press.js, s8_end.js | remote press, recap, end card |
| host | host/host.js | die-cut sticker, 16 appearances |
| composer | audio/v7/score_v7.py | sample-based epic score with genre holds |
| sfx+voices+mix | voices_v7.py, sfx_v7.py, mix_v7.py | original TTS split for holds, trailer voice, genre voices, SFX, final mix |

Brief template for a scene agent (worked well):
"You are a scene artist on a 40 s vertical collage film. FIRST read BRIEF.md fully and cl.js and engine.js helpers. Then build scenes/<file> for window A to B s: '<spoken words with times>'. Creative direction: <3-5 vivid, specific beats keyed to word times>. Leave room for the host at <times/areas>. Build, render sheets, look at them, iterate until excellent. Final report max 5 lines."

## 7. Music: what finally worked

- Direction: an original epic action anthem in the style of a blockbuster trailer or sports broadcast, around 130 BPM, D minor lifting to F major.
- Parts:
  - Heroic hook on horns and trumpets in octaves: D D D'(leap) C A | Bb A G F.
  - Driving 16th spiccato string ostinato.
  - Taiko and trailer drums with a real kit.
  - Low-brass stabs, choir pads and a power-chord guitar layer.
- Real samples: VSCO-2-CE strings, brass, timpani, gong, harp and piano, plus Virtuosity Drums. Taiko, braaam, guitar, synth lead, sub, darbuka, kanun and risers are synthesised.
- The tempo map has 3 sections, so the key moments land on downbeats (logo, holds, drop, restart, final hit).
- Every hold is a genre pastiche: cinema trailer braaam, Turkish Hijaz drama, K-drama piano, anime rock. Short bridges return to the theme on the beat.
- Suspense ends in DIGITAL SILENCE of about 0.32 s, then the drop on the hit.
- Rejected earlier: marimba/ukulele "cute", a GM soundfont funk band (OK but "childish"), a synth 808 trap-pop (muddy), and public-domain classical mashups (never delivered).

### 7.1 The "cinema trailer" music recipe (client favourite: the template's music, used when the client asks for this template)
1. **Driving string ostinato:** 16th-note spiccato (violins and violas); cellos and basses accent the off-beats.
2. **Heroic brass hook:** horns and trumpets in octaves, 6-8 notes, an upward leap in the middle, a stepwise fall (used: D D D'(octave) C A | Bb A G F).
3. **Trailer percussion:** taiko, low booms, timpani rolls into hits, gong or cymbal swells, a real kit only in the big sections.
4. **Braaam and low-brass stabs** on reveals, choir "ah" pad for size.
5. **Harmony and dynamics:** minor verse (i VI III VII) lifting to the relative major at the drop. Build, suspense, ~0.3 s digital silence, then the drop on a downbeat. The final cadence must land on the end-card logo hit.
6. **Real samples are mandatory** for strings, brass, timpani and percussion (VSCO-2-CE + Virtuosity Drums, CC0, sparse clone from GitHub, ~1.2 GB, numpy sampler). GM soundfont only for choir, ney, glock, celesta.
7. **Tempo map** so every key visual moment falls on a downbeat.

**The quality bar is fixed for every film, even when the style changes.** A new design or a new business may call for a different genre (not a trailer), but the music must reach the same production quality as this score:
- An original, composed piece with a clear melodic hook, real harmony and a build, not loops or a generic bed.
- Real recorded samples for the lead instruments. GM soundfont only for colour parts. Synth-only tracks were rejected as "muddy" and "cheap".
- A tempo map that puts the key visual moments on downbeats, and a final hit that lands on the logo.
- The hold and continuity rules of section 8.2.
- Not childish (no marimba or ukulele "cute"), unless the client asks for it.

### 7.2 Smooth motion (v8, client: "the video lags, it is not smooth")
- `CL.SMOOTH = true` in `cl.js`: `CL.q(t)` returns continuous time, `CL.j` is a slow continuous noise drift (not a random jump every 1/12 s), `CL.pop` is a continuous `outBack` pop. `CL.qs(t, fps)` keeps discrete steps ONLY for random seeds (sparks, flicker) so nothing flickers per frame.
- `main.js` renders every frame as 3 temporal samples over a 0.5 shutter (`scenePass` x3, averaged) = natural motion blur. Captions, bubbles and overlays are drawn once on top (sharp). The host footage (23.976 fps) is blended by the samples, which removes the 24-to-30 fps judder.
- No whole-frame jitter; the phrase punch-in is a soft continuous zoom.
- Check: count near-identical consecutive frames (mean abs diff < 0.6 on 135x240 thumbs). v7 had 13-17 per 200 frames; v8 has 0.
- Cost: with no other load, ~150 ms per frame per worker at 3 samples (1386 frames x 2 formats in ~4 min).

## 8. Sound design and mix: what worked

- **VO:** use the ORIGINAL client TTS file.
  - Resample it with a Kaiser polyphase filter and apply a 70 Hz high-pass, and nothing else.
  - For holds, split at zero crossings with 5 ms fades and insert silence.
  - Never run loudnorm or EQ over the whole master, because that "destroyed" quality once.
- **SFX roles:**
  - Impacts: sub drop, kick, rubber stamp on wood, room reverb. The biggest goes at the key stamp.
  - Reveals: short synth-brass stab tuned to the chord.
  - Transitions: tonal riser into a short gap into a hit, plus paper-wipe whooshes.
  - Glitch plus tape-stop on the frozen buffering wheel.
  - Record scratch on the cross-out.
  - Win chime on check marks.
  - UI ticks and notification dings on calendar days.
  - Remote click and TV power-on.
  - Crowd and goal eruption.
  - Genre SFX in the holds.
- **Selectivity:** no sound on every caption chip.
- **Mix:**
  - Music ducked 8 dB under speech (150 ms look-ahead attack, 400 ms release) and raised +6 dB inside the holds.
  - SFX sit 4-8 dB under the VO when overlapping words.
  - Genre voices sit 3-5 dB above the bed.
  - Transparent look-ahead limiter, -14 LUFS, TP -1.25 dBTP.
  - Exact digital silence before the big hit.
- **Verification without ears:** LUFS, true peak, clip count, silence window, VO-to-bed ratio per word, spectral balance per band, spectrogram PNG, and Whisper ASR on the foreign-language voice lines. Always tell the client it was verified by measurement only.

### 8.1 Late additions that the client loved
- **Holds start ON the word:** the camera push-in toward the poster begins at the spoken word's start (`PRE` table in `main.js`) and is complete when the hold begins. The genre voice and its bubble come in right at the hold start (+0.03 to +0.07 s), with no dead air. The first version waited 0.3-0.5 s and felt "stuck".
- **Cinema moment:** one narrator word turns into a trailer voice (WORLD pitch -5.5 st, formant warp 0.94, chest EQ, saturation, 3.6 s hall reverb, two darker echoes). On screen: letterbox bars, sepia, projector flicker, scratches, "GOTV PRESENTS".
- **End-card tag:** "GO TV!" in the same trailer voice right after the logo slam (Kokoro `am_onyx` with phonemes `ɡˈoʊ, tˈiː vˈiː!` at speed 0.85, then the same trailer chain), with echoes "TV... TV...". Verify with Whisper ("Go TV!"). If the client can supply the real narrator (Cartesia) saying it, prefer that.
- **Provider stickers on "השידורים החיים שאתם צריכים":** yes and HOT use real logos cropped from tv-logos (`yes-brand.png` = the "yes" part of `yes-israel-il.png`; `hot-brand.png` = `hot-vod-il.png` with the coloured square removed, on a dark card). FreeTV, Cellcom tv and Partner TV had no logo available (web blocked), so they are paper wordmarks in brand-like colours (orange, purple, teal). Ask the client for real logo images.

- **Repeated small events (calendar days, list items): make them MUSIC, not UI sounds.** Synthetic clicks and notification dings sounded "metallic, not professional". The fix was `audio/v7/cal_week.py`: each torn day page plays one note of a rising phrase in the score's key, on real harp plus violin pizzicato samples, with a piano chord and a harp glissando on the last day.

### 8.2 Continuity rules (v9, client: "it feels like the film ends" / "a pause after every word")
- **A hold must never end in a hush.** A near-silent tail makes the film feel finished. Instead, end every hold with a forward pickup that lands on the downbeat where the narrator resumes. The cinema hold uses an accelerating violin/viola/cello spiccato run up the scale (16ths, then 32nds), a snare roll crescendo and a sustained choir, landing on a tutti hit plus crash, with a whoosh (`score_v7.py` `cin()`, `mix_v7.py` 13.19 whip).
- **Keep the music energy up until the narrator actually speaks again.** In `mix_v7.py` the hold envelope stays at +6 dB until 0.35 s before the next spoken word (`nxt`), not until the hold end. Otherwise the level drops about 9 dB in the gap and reads as an ending. Re-check that the worst word keeps VO-music of at least 5 dB.
- **Genre holds are short: about 1.0-1.2 s.** The zoom starts on the word, the genre line plays immediately, and the narrator continues. The tail after the genre line is dead air. `tighten_v7.py` splices the tails out of the finished master with 60 ms equal-power crossfades (XF-compensated so the length is exact), and `timeline.js` HOLDS d values must be changed to match (tur 1.0, kor 1.0, ani 1.2). Then re-render the video.
- Next time, design the holds at about 1.0-1.2 s from the start, so no splicing is needed.

## 9. Known pitfalls and fixes

- The canvas state leaked between frames. Fix: `cv.width = W` at the start of every frame.
- Font loading: `gReady = Promise.all([logosReady, document.fonts.load(...)])`.
- Frame 0 is black because of the intentional 0.15 s fade-in.
- A scene-agent's `CL.noCap` push gets overwritten by main.js. Register it lazily inside draw().
- The Fredoka font is not preloaded in `gReady`: using it gives a serif fallback. Use Rubik or add it to the preload list.
- A white logo on a white card is invisible (yes, HOT): check each card on a rendered frame.
- A symlinked `vo.wav` broke with the wrong relative path. Copy files instead of symlinking them into audio folders.
- git refused files over 100 MB (`small.raw`). Keep `*.raw`, `*.npy`, `out/`, `previews/`, frames and samples out of git.
- The upload tool returned 500 on files of 28 MB and more. Re-encode under 25 MB, or publish a private Artifact page with a `<video>`.
- The composer's final cadence can "flam" against the end-card logo hit by 0.18 s. Align the final hit to the logo slam time.
- Foreign TTS: HuggingFace is blocked, so use Kokoro with IPA phonemes and verify with Whisper. Warn the client about possible accents.

## 10. Timeline math (holds)

```
T = output time, v = voice clock (words.js and // CUE comments are in v)
HOLDS (v, d): cin 11.79 1.4 | tur 13.065 1.0 | kor 13.94 1.0 | ani 14.53 1.2   -> total 40.0 + 4.6 = 44.6 s  (v9)
T = v + sum(d for holds with hold.v < v)      (VO ends v 36.9 -> T 41.5; big hit v 25.64 -> T 30.24)
The score and mix were built on the v7 hold lengths (1.6 s each) and then tightened by splicing: see section 8.2.
```

## 11. Checklist before sending

- [ ] Whole-film contact sheet reviewed: no scene gaps or black frames except the fade, and no host covering key logos.
- [ ] Captions correct: spelling, no dashes, Hebrew RTL.
- [ ] Audio: -14 LUFS, TP <= -1, silence window exact, the VO is the original TTS.
- [ ] Both formats encoded under 25 MB, and the WAV is included.
- [ ] Committed and pushed, with no big binaries.
- [ ] Hebrew message: what is new, what was not heard or seen, one open question at most.

## 12. PROMPT FOR A NEW SESSION (copy-paste)

```
אני רוצה סרטון פרסומת חדש ברמת "הליגות הגבוהות", בדיוק לפי הטמפלט של סרטון GOTV v7.
קרא קודם את /home/user/I/STUDIO_PLAYBOOK.md מההתחלה ועד הסוף (ואת הסקיל creator-ad-studio), ואת הפרויקט /home/user/I/gotv5 כרפרנס.
מצורפים: קובץ הקריינות (wav) + הטקסט שלו, וסרטון שלי (mp4) לחיתוך הדמות.
שם העסק: <...>. צבעים: <...>. לוגואים אמיתיים שצריך: <...>. טקסט לכרטיס הסיום: <...>.
סגנון: <קולאז' נייר סטופ-מושן כמו GOTV | סגנון אחר לבחירתך, יצירתי וחדש>.
דרישות: סנכרון מדויק למילים, עצירות (holds) ברגעים החשובים עם סאונד משלהם, מוזיקה אפית מקורית מדגימות אמיתיות,
אפקטים איכותיים, הקול המקורי שלי בלי עיבוד, גרסה אנכית + גרסה אופקית לטלוויזיה, עד 15 סוכנים במקביל.
עבוד בתיקייה חדשה (אל תשנה את gotv5), שלח לי תמונות התקדמות וזמני הערכה, ובסוף שלח את שני הסרטונים וה-WAV.
```
