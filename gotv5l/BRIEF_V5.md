# GOTV v5: "PAPER COLLAGE" (new film, NOT the anime one)

Business: **GOTV** (Israeli IPTV app: live Israeli broadcasts, Netflix, Disney+, Apple TV, all sports channels incl. Sport 5 and Charlton, Turkish/Korean series, anime, library updated all week, fast smooth live, NO FREEZING).
Format: vertical 1080x1920 @30 fps, 40.0 s. Voice-over (Hebrew, already recorded) = `audio/vo.wav`, starts at t=0, ends 36.88. End card 36.9 to 40.
Project dir: `/home/user/I/gotv5` (index.html loads engine.js, words.js, lines.js, cl.js, scenes/s0..s8, host/plan2.js, host/host.js, main.js).

## LOOK (all agents, strictly)
Hand-made paper collage in stop-motion. Kraft/cream paper backgrounds, torn-edge paper scraps, tape, white die-cut sticker outlines with hard (no blur) drop shadows, marker scribbles (underline, circle, arrow, cross), halftone dots, ransom-note cut-out lettering, stamps. Decorations "boil" at 12 fps (`CL.j`, `CL.q`), pop in with stepped stop-motion easing (`CL.pop`). Palette: kraft, cream, ink black, Maccabi Tel Aviv yellow #FFD60A + blue #1F4FFF, tomato red, plus green/pink/orange accents (`CL.C`).
FORBIDDEN: glow, bloom, blur, neon, gradients as the main look, anime speed lines/katakana, the previous navy/glass look, motion blur. Must feel like a physical crafted collage that a creative YouTuber would be proud of. Be BOLD and inventive; big shapes, big type, strong composition, fast rhythm, a new visual idea every ~1.5 s.

## HARD RULES
- Deterministic: a frame is a pure function of time t. No Math.random, no Date. Use `A.hash`, `A.rng(seed)`, `CL.j`.
- No em dashes or en dashes in any on-screen text. Hebrew spelled correctly: **טורקיות** (never תורכיות).
- Hebrew text: `ctx.direction='rtl'`. English/latin: 'ltr'. Fonts: Rubik (300-900), Secular, Bangers, Fredoka (all loaded).
- Sync: element pops must land ON the spoken word start. Exact word times: `/home/user/I/gotv5/words.js` (`WORDS`: {w,t0,t1,ph}, seconds on the global clock = video time). Phrases: `lines.js` (`A.LINES`). Cue the visual to `t0` of the word (a frame early is fine, never late).
- Captions (`main.js`) are drawn on top automatically as paper chips around y=1400 (English gloss strip below ~y=1500). Do NOT draw your own subtitles of the voice-over. Keep the key content of your scene above y~1280 or design around the caption band; you can move captions per time by defining `CL.capYAt = t => y` (only one scene should do this: tell the director). You may add to `CL.noCap` windows if your scene shows the spoken words as giant type itself.
- Real logos: `CL.logoImg(name)`, `CL.logoCard(ctx,name,cx,cy,w,h,{rot,scale,tape,alpha})`, `CL.sticker(ctx,img,cx,cy,w,h,{rot})`. Names: netflix, disney, appletv, prime, hbo, sport1..sport4, sport5 (+sport5live, sport5plus, sport5gold, sport5stars, sport5_4k), one, one2, kan11, keshet12, reshet13, ch14, ch9, i24, yes, hot. There is NO Sport 6 and NO Charlton image: Charlton = a designed paper wordmark sticker "צ'רלטון" / "CHARLTON" (invent one, clearly readable). Logos must be BIG and clearly readable (min ~380 px wide when featured), and animate in the right section.
- Team colours: Maccabi Tel Aviv (yellow/blue).
- Each scene file registers with `A.scene({name, start, end, draw(ctx, s)})`; `s.t` = global seconds, `s.lt` = seconds since scene start. A later-registered scene draws ON TOP of earlier ones. Every scene draws its own full-frame paper background (`CL.paper(ctx, kind)`) and its own ENTRY TRANSITION: it starts 0.2 s before its phrase and covers the previous scene with a torn-paper wipe/flip/peel/slide (be creative, vary it). Scenes end 0.4 s AFTER the next scene's phrase begins (so the next scene has fully covered it).
- Do NOT edit shared files (engine.js, cl.js, main.js, words.js, lines.js, index.html). Put helpers you need inside your own scene file (wrap in an IIFE). If you need a change in a shared file, say so in your final report.
- Test: `cd /home/user/I/gotv5 && node render.js --sheet A:B:N --prefix yourprefix` (frame numbers = t*30; output previews/yourprefix_A-B.jpg) then LOOK at the image; `node render.js --frames 90,120 --prefix x` for single frames. Iterate until it looks great. Use `--fast` flag if slow. Other agents render at the same time: use at most 2 parallel workers.
- Performance: cache static drawing with `CL.layer(key,w,h,fn)`; avoid ctx.filter and shadowBlur.
- Final report: 5 lines max (what you built, times, anything for the director).

## SCENE MAP (global seconds; phrase times from the recording)
| file | scene | window | spoken |
|---|---|---|---|
| s0_hook.js | HOOK | 0 to 5.0 | "מחפשים את כל התוכן שאתם אוהבים במקום אחד?" (0.1-2.66) "אם כן, הגעתם למקום הנכון" (3.0-4.64) |
| s1_live_ott.js | LIVE + STREAMERS | 4.8 to 9.4 | "כל השידורים החיים בישראל" (4.97-6.41) "תכנים מנטפליקס, תכנים מדיסני פלוס" (6.69-8.82) (add Apple TV as a third sticker near the end) |
| s2_sports.js | SPORTS | 8.8 to 12.4 | "כל ערוצי הספורט" (9.02-10.09) "כולל ספורט 5 וצ'רלטון" (10.2-11.8): Sport 1,2,3,4,5 logos + Sport 5 hero + Charlton |
| s3_series.js | SERIES | 11.8 to 15.9 | "סדרות טורקיות, קוריאניות, אנימה ועוד המון תוכן" (12.0-15.44) |
| s4_library.js | LIBRARY UPDATED ALL WEEK | 15.6 to 20.9 | "והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע" (15.79-18.56) "ככה שתמיד יש משהו חדש לראות" (18.8-20.34) |
| s5_smooth.js | LIVE, FAST AND SMOOTH + suspense | 20.5 to 25.9 | "יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה" (20.68-23.56) "והדבר שאנחנו הכי גאים בו?" (24.01-25.22) end on a held-breath beat before the punchline |
| s6_nofreeze.js | NO FREEZING. PERIOD. | 25.4 to 30.5 | "אין תקיעות. נקודה." (25.64-27.23) BIG stamp moment; "בלי להיתקע בדיוק ברגע החשוב" (27.19-29.96) the frozen/buffering wheel crossed out, a goal moment that is NOT interrupted |
| s7_press.js | PRESS AND WATCH + recap | 29.9 to 36.9 | "פשוט לוחצים, וצופים" (30.12-32.09) "כל התוכן שאתם אוהבים, השידורים החיים שאתם צריכים," (32.05-35.25) "וחוויית צפייה בלי תקיעות" (35.21-36.9) |
| s8_end.js | END CARD | 36.7 to 40.0 | silent: GOTV logo big, "הטלוויזיה של ישראל", small "(התקנת אפליקציה על המסך החכם)" |

## HOST (the creator, real footage cut out)
`host/host.js` provides `window.HOST = {prepare(t) (async), overlay(ctx,t)}`; main.js calls them each frame (overlay runs after the scenes, before captions). The host is a real person cut out of the user's video and shown as a die-cut paper sticker (white outline, hard shadow, slight 12 fps boil), popping in suddenly from different angles (edges, corners, from behind a scrap, peeking) and reacting. Matted frames: `host/src/fNNNN.jpg` + `host/mask_rgba/fNNNN.png` (338 frames, 720x1280 @ 23.976 fps, indices in `host/plan2.js` HPLAN/HANCH; see /home/user/I/gotv4/yt2 for the source and tools if more frames are needed). He must not cover the main content of scenes for long; coordinate by looking at scene renders in previews/.

## AUDIO
`audio/master.wav` (40.0 s, 48 kHz stereo) built by the sound agent: VO at t=0 plus playful paper/stop-motion SFX and a bouncy handmade-feel score, all cued to the scene code. Scene agents: leave an easily greppable cue comment for the big moments, e.g. `// CUE 25.64 stamp` and `// CUE 6.69 pop`.
