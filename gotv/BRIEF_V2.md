# GOTV SHORT v2: premium vertical ad (39.5 s, 1080x1920, 30 fps). TEAM BRIEF

Client/brand: **GOTV** (Israeli IPTV / streaming app, "הטלוויזיה של ישראל": live Israeli TV + international content in one app, no freezing).
The Hebrew voice-over (audio/vo.wav, 36.9 s) is fixed; this is a YouTube-Shorts/Reels style ad hosted by a real man (stock footage, cut-out, handled by the director) alternating with full-screen motion-graphics "portals" where the host is gone but his voice continues.
QUALITY BAR: top-tier commercial. Think Apple/Netflix/Nike promo: cinematic depth, layered parallax, rich lighting, glass + glossy materials, big confident typography, fast eased camera moves. NOT clip-art, NOT small cards, NOT flat cartoons. FULL-BLEED VERTICAL: every scene fills 1080x1920.

## Tech
- Read `engine.js` (A.*: ease, key, smooth, inv, lerp, rng, hash, noise1, fbm, text, layer(cache!), camera(centre 540,960), scene) and `vkit.js` (global `V`: palette V.C, glass panels, glossy app tiles V.tile + V.ICON, fake-3D perspective V.card3d(ctx, srcCanvas, cx, cy, w, h, rotY, rotX, fov), bokeh, beams, bgDeep, gradient text V.text, sparkle, flash, ring, glow). Extend with your OWN helpers inside your own files; never edit shared files (engine.js, vkit.js, lines.js, main.js, host.js, gotv.html, BRIEF).
- Canvas is 1080x1920. Register with `A.scene({name, start, end, draw(ctx, s)})`, s = {t (GLOBAL seconds), lt, p, dur}. Frames are a PURE FUNCTION of t (no Math.random: use A.rng(seed)/A.hash; no state).
- The compositor renders 5 temporal sub-frames per frame (shutter 180 percent): real motion blur for free, so use fast eased continuous motion, big overshoot pops, whip moves. Then it adds global bloom, vignette, film grain and the word-by-word captions (y 1230-1480 zone!).
- KEEP ALL KEY CONTENT inside y 150-1180 (safe zone: captions occupy y 1230-1480, platform UI covers y > 1540 and y < 130). Backgrounds/ambient may extend everywhere.
- Preview: `cd /home/user/I/gotv && node render.js --fast --sheet <f0>:<f1>:<n> --prefix mine` (frame = seconds*30; writes previews/mine_<f0>-<f1>.jpg; view it with Read) or `node render.js --fast --frames 90,120 --prefix mine --png`. Other agents' scenes are placeholders while you work: fine. LOOK at many real frames including full-size stills, fix weak ones, iterate at least 3 times. Perf: keep your scene < 250 ms per frame at 1080x1920 (cache static art with A.layer; avoid huge blurs/shadowBlur on big areas; ctx.filter blur only on small canvases).
- Fonts: Rubik (Hebrew+Latin, 300-900), Fredoka, Bangers, Secular One. Hebrew via `dir:'rtl'`. No em/en dash characters in any on-screen text. Correct Hebrew only.
- Brand palette: deep navy #060A1E/#0B1450, electric blue #2F6BFF, sky #5AD1FF, GOLD #FFC24A (gradient #FFF3C4 to #FFC24A to #E48A12) as the hero accent, plus magenta/violet/green accents sparingly. GOTV logo helper `V.logo(ctx, x, y, size, opts)` exists when vlogo.js is delivered (the logo agent writes it early).
- Trademarks: no real logos. Plain typographic chips/wordmarks for "NETFLIX" / "Disney+" are OK because the narrator says them.
- Transitions: your scene is drawn from `start` to `end + 0.3`. YOUR ENTRY must fully cover the previous scene (opaque) within 0.3 s of `start`: whip, light-burst, iris, push-through, shatter... Make every entry and exit feel designed and motivated (match-cuts on shape/colour/light where possible). The next scene's entry covers your tail.
- Sound cues: write `audio/cues/<name>.json` = [{"t":<global s>,"sound":"snake_case_name","desc":"what it sounds like","gain_db":-10,"pan":0}] for every visual hit (whooshes, pops, impacts, sparkles, UI blips...), 15-35 cues, exact impact frames. Reuse names from /home/user/I/promo/audio/sfx/*.wav where they fit exactly (ls that folder), otherwise invent a descriptive new name.
- Deliver your scene file(s) + previews + cue json. Final reply: SHORT report (what is on screen when in global seconds, problems, preview paths).

## VO timeline (global seconds)
 0.00-1.96 "מחפשים את כל התוכן שאתם אוהבים"   2.00-2.86 "במקום אחד?"   3.05-4.96 "אם כן, הגעתם למקום הנכון."
 5.00-6.63 "כל השידורים החיים בישראל"   6.70-7.95 "תכנים מנטפליקס"   8.00-9.00 "תכנים מדיסני פלוס"
 9.05-10.20 "כל ערוצי הספורט"   10.25-12.0 "כולל ספורט חמש"   12.05-13.08 "וצ'רלטון"
 13.10-13.99 "סדרות תורכיות"   14.00-14.6 "קוריאניות"   14.6-15.05 "אנימה"   15.05-15.42 "ועוד המון תוכן" (pause to 15.81)
 15.81-18.55 "והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע"   18.81-20.40 "ככה שתמיד יש משהו חדש לראות"
 20.64-23.50 "יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה" (live ~20.65-22.1, "חוויית צפייה" 22.4-23.3, "מהירה וחלקה" 23.3-23.5)
 23.90-25.50 "והדבר שאנחנו הכי גאים בו?"  [dead silence 25.50-25.61]  25.61-26.47 "אין תקיעות"  26.55-27.18 "נקודה."
 27.20-27.88 "בלי להיתקע"  28.0-30.0 "בדיוק ברגע החשוב"  30.12-32.04 "פשוט לוחצים, וצופים"  32.04-33.42 "כל התוכן שאתם אוהבים,"
 33.42-35.19 "השידורים החיים שאתם צריכים,"  35.19-36.17 "וחוויית הצפייה"  36.2-36.88 "בלי תקיעות"  then END CARD 36.9-39.5 (music ring-out).

## Ownership (global seconds; HOST = director, live footage)
 0.00-3.05   HOST hook (director)                       | 3.05-5.00  V1 logo reveal (v1_logo.js, logo agent) 
 5.00-9.05   V2 Live Israel + Netflix + Disney (v2_live_ott.js) | 9.05-13.10 V3 sports (v3_sports.js) | 13.10-15.81 V4 series+anime+more (v4_series.js)
 15.81-18.81 V5a weekly library (v5_library_smooth.js) | 18.81-20.64 HOST reaction | 20.64-23.90 V5b smooth live (v5_library_smooth.js)
 23.90-25.50 HOST suspense | 25.50-25.61 black | 25.61-30.12 V6 IMPACT (v6_impact.js) | 30.12-36.88 HOST finale (director)
 36.88-39.50 END CARD (logo agent, v1_logo.js)
