# PROMO: "כל התוכן במקום אחד" (37 s ad), team brief

Client: an Israeli streaming app (live Israeli TV + international content in one place). Brand-neutral: NO logo, no brand name.
Voice-over (Hebrew, already recorded, `audio/vo.wav`, 36.9 s) drives everything. 1920x1080, 30 fps, digital 2D vector (Canvas2D).
Goal: BLOW THE VIEWER AWAY. Rich, polished, motion-designed, clear reads, lots of energy, funny/charming where possible.

## Tech
- `engine.js` (read it, 141 lines): `A.*` helpers (A.ease, A.key, A.smooth, A.inv, A.lerp, A.rng, A.hash, A.noise1, A.hex, A.mixc, A.path, A.blob, A.rrect, A.ellipse, A.fillStroke, A.radial, A.linear, A.glow, A.text, A.layer (cache statics!), A.camera, A.scene).
- `design.js`: `D` palette + `D.tile`, `D.LIVE`, `D.starburst`. Extend with your OWN helpers inside your own scene file (do not edit shared files: engine.js, design.js, lines.js, post.js, index.html).
- Every frame is a PURE FUNCTION of time `t` (no state, no Math.random; use A.rng(seed)/A.hash). Scenes register with
  `A.scene({name, start, end, draw(ctx, s)})`, s = {t (GLOBAL seconds), lt (local), p, dur, f}. Use global seconds everywhere.
- Preview: `cd /home/user/I/promo && node render.js --sheet <f0>:<f1>:<n> --prefix mine` (frame = seconds*30; writes previews/mine_sheet_*.jpg, view with Read) or `node render.js --frames 90,120 --prefix mine --scale 1` for single full-size PNGs. Other scene files are placeholders while you work; that is fine.
  Look at REAL frames constantly (many, full-size for details). Fix what looks weak. Perf target: < 400 ms/frame.
- Fonts: Rubik (Hebrew+Latin, weights 300-900), Fredoka, Bangers, Secular One. Hebrew text: `A.text(..., {dir:'rtl'})`.
- Look: flat vector shapes, thick dark outline `A.OUTLINE`, gradients, soft `A.glow` lights, subtle shadows, parallax, secondary motion (overshoot, squash & stretch, anticipation). Deep indigo/violet base (#0E0B2E, #2B1B6B) with gold (#FFC24A) + cyan (#38D9F5) + magenta (#FF4F9A) accents. Brand-neutral "app tiles" via D.tile.
- HARD RULES: (1) NO em dash / en dash characters in any on-screen text. (2) Subtitles are drawn by post.js in y 930-1060: keep key action/faces ABOVE y=900 (backgrounds may continue below). (3) Do not draw real trademarked logos; plain typographic labels ("NETFLIX", "Disney+") are OK because the narrator says them. (4) Hebrew must be correct (RTL, no reversed words). (5) Never show the old project's characters or the word GOTV.
- Motion language: snappy eased moves (A.ease.out/inOut/back if present; check engine.js), whip pans with motion blur streaks, scale-pops on beats, camera always moving (push-ins, drifts, small rotations). Cuts on action. No dead static holds > 0.5 s.
- Transitions: your scene is drawn from `start` to `end + 0.3` (0.3 s tail overlap). YOUR ENTRY must fully cover the previous scene (opaque) within 0.3 s of `start` (whip, wipe, push-through, tile-expand, flash...). Match the handoffs described in your task.
- Sound cues: write `audio/cues/<scene>.json` = [{"t":<global s>,"sound":"snake_case_name","desc":"what it sounds like, 1 line","gain_db":-10,"pan":0}] for every visual hit (whooshes, pops, UI blips, impacts, crowd, kicks...). 8-25 cues per scene. Sound is designed later from your descriptions; be specific and put t exactly on the visual impact frame.
- Deliver: your scene file(s) only, plus previews for review, plus the cue json. When done, reply with a SHORT report: what is on screen when (global s), any problems, preview paths.

## Global timeline (VO phrases, global seconds; visuals should hit at the start of each phrase/word)
 0.00-2.86  "מחפשים את כל התוכן שאתם אוהבים במקום אחד?" (looking for all the content you love in one place?)  [1.96-2.0 tiny gap, "במקום אחד" 2.0-2.86]
 3.05-4.96  "אם כן, הגעתם למקום הנכון." (if so, you've come to the right place)
 5.00-6.63  "כל השידורים החיים בישראל" (all live broadcasts in Israel)
 6.70-7.95  "תכנים מנטפליקס" (content from Netflix)     8.00-9.00 "תכנים מדיסני פלוס" (Disney Plus)
 9.05-10.20 "כל ערוצי הספורט" (all sports channels)     10.25-12.0 "כולל ספורט חמש" (Sport 5)   12.05-13.08 "וצ'רלטון" (Charlton)
 13.10-13.99 "סדרות תורכיות" (Turkish series)   14.00-14.6 "קוריאניות" (Korean)   14.6-15.05 "אנימה" (anime)   15.05-15.42 "ועוד המון תוכן" (and lots more content); pause to 15.81
 15.81-18.55 "והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע" (most important: the library updates all week long)
 18.81-20.40 "ככה שתמיד יש משהו חדש לראות" (so there's always something new to watch)
 20.64-23.50 "יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה" (live broadcasts too, fast smooth viewing)
 23.90-25.50 "והדבר שאנחנו הכי גאים בו?" (and what we're proudest of?)  [dead silence 25.50-25.61]
 25.61-27.18 "אין תקיעות. נקודה." (no freezing. period.)  "אין תקיעות" 25.61-26.47, "נקודה" 26.55-27.18
 27.20-30.00 "בלי להיתקע בדיוק ברגע החשוב" (never stuck at exactly the crucial moment)  ["בלי להיתקע" 27.2-27.88, "בדיוק ברגע החשוב" 28.0-30.0]
 30.12-32.04 "פשוט לוחצים, וצופים" ("פשוט לוחצים" 30.12-31.09, "וצופים" 31.1-32.04)
 32.04-33.42 "כל התוכן שאתם אוהבים,"  33.42-35.19 "השידורים החיים שאתם צריכים,"  35.19-36.17 "וחוויית הצפייה"  36.2-36.88 "בלי תקיעות"
 (post.js fades to black 36.65-37.0)

## Scene ownership (global seconds)
 S1  0.00-5.00   s1_chaos.js                  (uses kit_people.js)
 S2a 5.00-9.05   s2a_live_netflix_disney.js
 S2b 9.05-13.10  s2b_sports.js               (sports montage, Sport 5, Charlton)
 S2c 13.10-15.81 s2c_series.js               (Turkish, Korean, anime, 'and lots more' mosaic)
 S3a 15.81-20.64 s3a_library.js
 S3b 20.64-23.90 s3b_smooth_live.js
 S4  23.90-30.12 s4_nofreeze.js
 S5  30.12-36.88 s5_press_watch.js            (uses kit_people.js)
Music is 120 BPM (beat = 0.5 s), so nice hit points: every 0.5 s, but VO timing wins.
