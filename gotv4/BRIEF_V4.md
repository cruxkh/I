# GOTV SHORT v4: ANIME LEGEND EDITION (read BRIEF_V2.md and BRIEF_V3.md first; this file overrides them where different)

## What the client said about v3 (their words, translated)
1. SYNC: "when he says 'anime' the picture shows a second later; the caption says Korean over an anime image; there is a lot missing in precision and sync". Root cause: the old word times were wrong by up to 1.5 s. New exact word times are in WORD_TIMES.txt / yt/words.json (VO clock). Every reveal must HIT ON THE SPOKEN WORD (visual hit 0-40 ms BEFORE the word onset, never after): e.g. NETFLIX logo slam on "מנטפליקס" (7.02), Disney+ on "מדיסני" (8.20), Sport 5 on "ספורט" (10.44), Charlton on "וצ'רלטון" (11.11), Turkish on "סדרות" (12.00), Korean on "קוריאניות" (13.10), anime on "אנימה" (13.99), logo wall rush on "ועוד" (14.53).
2. TOO FAST: "each segment shows for a second, nothing registers, everything disappears too fast". Fix = HOLDS: the voice-over pauses at chosen points and the picture holds (VO clock v frozen) so each thing can be seen and enjoyed, then the voice continues exactly where it stopped. Two holds are full INTERLUDES (new scenes, no narrator): a 3.8 s ANIME interlude and a 2.4 s football CROWD interlude.
3. "I loved the anime style! Make ALL the effects and design of the whole video like the anime character throughout: effects, everything, in anime style, so it comes out high quality and upgraded." => the whole film gets an ANIME look: cel shading/ink lines, halftone screen-tones, radial speed/focus lines, impact frames (black/white inversion 2-3 frames), katakana SFX text (ドン ゴゴゴ キラキラ パァ ズバッ ドドド), sparkle glints, sakura petals, manga-style panel wipes, sweat drops / anger marks / shine marks, dramatic zoom-ins, vivid saturated palette. (Global overlay is built by the anime-fx agent; scenes add their OWN anime flavour in art direction.)
4. Captions were ugly; they are being redesigned by the director (do not draw captions).
5. Real logos stay (assets/logos). Charlton has no real logo: keep the designed wordmark (client will send the image).

## The clocks (IMPORTANT)
- `A.renderFrame` now gives your scene `s.t` = VO clock v (frozen during holds) for normal scenes. During a hold `A.H = {i, u, dur, kind, v, label}` (u = seconds elapsed inside the hold, 0..dur); outside `A.H === null`. Use it to keep the frozen picture ALIVE: shine sweeps across logos, breathing glow, particles, slow camera push/drift (drive them with A.H.u so they start at 0 at the hold start), focus lines... A hold must never look like a dead freeze: the exact end-of-hold frame must equal the frame the scene will continue from (v unchanged), so animate with LOOPING/AMBIENT motion or things that are removed again before the hold ends (fade them so that at u = dur the picture is identical to u = 0 plus nothing). Rule: ambient motion in holds only (no new story events), except interludes.
- INTERLUDE scenes are registered with `outT: true` and start/end in OUTPUT time T (see timeline.json T0/T1); their `s.t` is T. They cover the whole frame, opaque, from their first frame.
- Scene clocks for `A.scene({start,end})` stay in v (VO clock) for normal scenes.
- Cue json: times in v for normal scenes; for interlude/hold-only cues add `"T": true` and give the absolute output time T.

## Holds (v = voice clock instant where the voice stops; dur in seconds)
 hold 1: v=2.83  dur=0.5  kind=hold  T=2.83..3.33  (hook question: host anime "?!" freeze)
 hold 2: v=4.8  dur=1.3  kind=hold  T=5.3..6.6  (GOTV logo hero)
 hold 3: v=6.55  dur=1.0  kind=hold  T=8.35..9.35  (live Israeli channels wall)
 hold 4: v=7.685  dur=1.4  kind=hold  T=10.485..11.885  (NETFLIX logo hero)
 hold 5: v=8.92  dur=1.4  kind=hold  T=13.12..14.52  (DISNEY+ logo hero)
 hold 6: v=10.15  dur=2.4  kind=interlude  T=15.75..18.15  (crowd: football fans chanting and roaring)
 hold 7: v=11.208  dur=1.0  kind=hold  T=19.208..20.208  (SPORT 5 logo hero)
 hold 8: v=11.9  dur=1.2  kind=hold  T=20.9..22.1  (CHARLTON)
 hold 9: v=13.07  dur=1.0  kind=hold  T=23.27..24.27  (Turkish series)
 hold 10: v=13.95  dur=1.0  kind=hold  T=25.15..26.15  (Korean series)
 hold 11: v=14.536  dur=3.8  kind=interlude  T=26.736..30.536  (ANIME interlude, no narrator, Japanese-style voices)
 hold 12: v=15.61  dur=1.2  kind=hold  T=31.61..32.81  (logo wall (and lots more))
 hold 13: v=18.68  dur=0.7  kind=hold  T=35.88..36.58  (library shelves)
 hold 14: v=26.53  dur=0.5  kind=hold  T=44.43..44.93  (after "no freezing" slam)
 hold 15: v=30.0  dur=1.0  kind=hold  T=48.4..49.4  (goal celebration + crowd)

## Scene ownership v4 (v-clock ranges)
 HOST hook 0-3.0 (director) | V1 logo reveal 3.0-4.97 (+ hold 1 at v=2.83 is host, hold 2 at v=4.80 is YOUR logo) | V2 live/Netflix/Disney 4.97-9.02 | V3 sports 9.02-12.00 (+ CROWD INTERLUDE) | V4 series/anime/more 12.00-15.81 (+ ANIME INTERLUDE) | V5a library 15.81-18.81 | HOST reaction 18.81-20.64 | V5b live/smooth 20.64-23.90 | HOST suspense 23.9-25.5 | black 25.50-25.61 | V6 impact 25.61-30.12 | HOST finale 30.12-36.88 | END CARD 36.88-39.5 (v)
 (whip tails between scenes: your scene is drawn until end+0.3 in v; next scene's entry must cover within 0.3 s of ITS start, as before.)
