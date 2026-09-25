# GOTV · חבילה מהבית, painted edition: production bible (read fully before any code)

We are re-making the whole 96-second GOTV commercial from scratch in the HAND-PAINTED WATERCOLOR style of the
"I'm Upping My P(doom)" video. Same story, same dialogue, same audio timeline (already final: `assets/master.wav`),
new picture. Engine: this folder (MIT JohnHeibel/ClaudeAnimationBase: p5.js + p5.brush). Read `ANIMATION_GUIDE.md`
(engine + craft rules, follow them), `ref/PDOOM_ANIMATION_GUIDE.md` and `ref/PDOOM_STORYBOARD.md` (THE look to match;
reference only, never copy code from that repo), then `src/core.js`, `src/timeline.js`, `src/lines.js`.
The previous (vector) version lives in `../anim/` (BIBLE.md, SCENES.md, scenes/*.js): use it for story beats only,
NOT for look. Do not git commit.

## Look (non-negotiable)
Picture-book watercolour + ink. Characters: flat `wash` colour + boiling ink outline (sw ~0.8–1.6). Backgrounds: soft
watercolour `fill` shapes (bleed .05–.3, tex .3–.9), usually no outline. Light: low-opacity fills and `glow()`. Paper
under everything. Soft, fun, saturated-but-soft palette, never pure black/white. SIMPLE: fewer, bigger shapes; one
focal action; big readable characters (hero ~30–45% of frame height in key shots); crowds as a few painted bands plus
a handful of individual figures in front, not thousands of sprites. Everything alive (boil, idle motion, camera drift).
Mood changes never snap. Anticipation, squash/stretch, overshoot. Motivated transitions (brush wipes between chapters,
cut on action, zoom through a screen). Text-light: only story-critical words (Hebrew signs listed below, the GOTV logo,
the WhatsApp chat, scoreboard) + the subtitles.

## Hard rules
- Frames are pure functions of t (parallel, out of order). `hash()`/`jit()` only, no Math.random, no state.
- Hebrew text: draw with Canvas2D (`drawingContext`) using font `Rubik` (loaded in studio.html), `direction='rtl'`.
  No em/en dashes in on-screen text. Keep key action above y≈900 while someone speaks (subtitle band).
- Subtitles are drawn globally by `src/subs.js` (house style: big bold Hebrew line on a dark translucent pill, small
  English line whose words light up yellow in sync). Don't draw your own. `NO_SUBS_AFTER = 92.7`.
- Lip-sync: `mouthOf('SABA', t)` etc. from `src/lines.js` (global t). Speakers SABA NOA BIT CATPACKET ILVIP EMBY ANNOUNCER.
- Rendering here has NO GPU: always `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node render.mjs
  --soft-gl ...`. Frames are slow (~10–30 s each) and 4 CPUs are shared by all agents: check with small sheets
  (`--sheet=a,b,c --cols=3 --w=640`) and crops, never render ranges yourself. Budget: ≤ 8 s/frame at 1920x1080 on
  soft-gl; cost = number of fill shapes/strokes; prefer fewer bigger shapes; cache nothing across frames.
- Final render is done by the director at 12 fps ("on twos", matches the 12/s boil) and doubled to 24 fps.
- Only edit your own files. Shared: core.js, clawd.js, timeline.js, lines.js, subs.js, studio.html, render.mjs.

## Timeline (global seconds; audio is final, sync is law)
| t | beat |
|---|---|
| C1 0–10.2 `src/ch/c1_drone.js` | Night drone over Tel Aviv (sea, Azrieli towers, rooftops) descends to the floodlit stadium, then swings in low along the MACCABI TEL AVIV home stand (yellow/blue): fans jumping, scarves, huge flags, tifo `מכבי תל אביב`, yellow flare smoke, pitch + tiny players behind. ANNOUNCER 1.2–4.9 "Eighty-nine minutes gone, one all...". Crowd swell 5.2, roar 5.5–8.3. 8.5 whip up to the broadcast mast/building with sign `שידור חי` + `IPTV · ISRAEL`; 9.0 packets launch (Bit's gold glint ~9.6); 10.0–10.2 transition out. |
| C2 10.2–39.2 `src/ch/c2_home.js` | Toronto living room, snowy night. Opens inside (window with snow, then Saba). SABA 10.9 "Noa! Eighty-nine minutes. One one. This is it." NOA 14.5 (holding closed backgammon case) "Saba, come play backgammon with me!" SABA 16.5 "Not now, motek! I'm in the middle of the game!" (rises, eyes on TV). FREEZE 19.3 (old provider: picture freezes, blocky, spinner, grey corner logo `הספק הישן`). SABA 20.0 "No! Not now!" SABA 21.8 "Again?! Every single game it gets stuck!" (TV error `שגיאה`). NOA 24.6 "Because you're still with the old provider, Saba. Everyone switched to GOTV!" NOA 29.0 "Bye-bye, old box!": yanks old set-top box + cable spaghetti ~29.3, tosses into bin 30.4. NOA 31.3 "One message to GOTV...": phone, WhatsApp close-up: 32.4 her bubble `אני רוצה להתחבר לשירותי הצפייה שלכם באפליקציה על מסך הטלוויזיה`, 33.4 typing, 34.2 rep `GOTV · נציג שירות`: `בכיף! המנוי מופעל ✅`. NOA 35.3 "Activated! Look, Saba!": GOTV app opens on the smart TV. 37.0 gold light pours out of the TV, push into the screen, 38.7–39.2 gold-white flash. |
| C3 39.2–58.4 `src/ch/c3_queue.js` | Inside the internet (glowing fibre tunnel). Out of the flash: chase cam behind BIT (gold GOTV packet, tag `#5401 GOAL`) running into a long queue of packets; BIT 40.6 "Excuse me! Live goal coming through! Live goal!"; he pushes, bumps, vaults, gets stuck, weaves (varied cinematic angles); ~47.0 reaches the front under a queue sign `ממתין בתור`; ILVIP (crowned, grumpy) 47.4 "Hey! We've been waiting in line since the first half!"; EMBY (nightcap, sleepy, spinner) 50.1 "Still... buffering..."; CATPACKET (big bored cat video packet, inside the crowd, normal size) 51.9 "Get in line, kid. Cat videos first."; BIT close-up 54.7 "Sorry! GOTV doesn't wait in line!"; BOOST 56.5 over the whole queue (everyone looks up in shock); 57.7 bursts into open fibre; hard cut 58.4. |
| C4 58.4–69.4 `src/ch/c4_ocean.js` | Deep ocean, glowing undersea cable on the sea floor; Bit a gold pulse racing inside; small route-map inset TLV → Marseille → Gibraltar → Halifax → Toronto with km counter. BIT 60.1 "Marseille... the Atlantic..."; shark appears ~61.8; BIT 62.2 bored, dismissive "Ahh... another attacker..." (eye roll); lunge 63.5; CHOMP 63.9 on the cable; zap 64.1, shark dazed (spiral eyes), Bit LAUGHS 64.25–65.4; BIT 65.5 "Nice try, fishy!" + wink; Atlantic; 68.4 arrival (Toronto lights above the water); 69.2 light streak. |
| C5 69.4–73.9 `src/ch/c5_lastmile.js` | Snowy Toronto street at night: Bit zips up a utility pole, along the wire into the lit apartment window; BIT 69.8 "Last mile... last meter..."; along the cable behind the TV cabinet (a lost Bamba puff); up to the SMART TV; BIT 72.5 "Delivered!" dives into the screen; 72.8 impact (TV jolts, flash); settle on the TV showing spinner 99% → 100%. |
| C6 73.9–96.0 `src/ch/c6_goal.js` | 73.9 TV unfreezes (GOTV logo in the corner), 74.3 ball in the net, scoreboard now מכבי 2 : 1 הפועל (each number next to its own team name); ANNOUNCER 74.5 "Goooal! Maccabi!"; 75.5 Saba LEAPS, confetti + Bamba; SABA 76.2 "Gooool! Noa, you are a genius!" + hug; NOA 79.3 "Thank GOTV, Saba. No more freezing!"; SABA 82.0 "And now... backgammon! Come, let's play!"; 84.0 case opens on the side table, 85.0 dice roll (double six), checkers 85.8 / 86.4, they laugh; TV behind plays smoothly with GOTV logo + `LIVE · 4K · ללא תקיעות`. 87.4 tag at the TV cabinet: Bit flopped exhausted under the glowing smart TV; ILVIP + EMBY stagger in late, panting; ILVIP 88.0 "Did... did we miss the goal?"; BIT 89.8 "Sorry, guys... GOTV got here first."; 92.4 wink; 92.8 END CARD: painted GOTV logo slams in (yellow letters, blue outline, the O a play-button ring), Hebrew `הטלוויזיה של ישראל`, under it `(התקנת אפליקציה על המסך החכם)`, small `PACKET FROM HOME · חבילה מהבית`; Bit pops up between logo and text, then ~94.5 sticks his TONGUE OUT teasing; crash zoom into his face 94.8–95.1; hold; engine fade 95.7–96.0. |

No old set-top box anywhere after 30.4. Team = Maccabi Tel Aviv yellow/blue everywhere.

## Characters (painted redesigns of the originals; keep their identity)
- SABA (78): round belly, olive-tan skin, bald crown + white side tufts, HUGE bushy white eyebrows, big white moustache, thick black-rim glasses, brown cardigan, white undershirt, grey trousers, sandals with socks, yellow/blue striped Maccabi scarf. Teal wing-back armchair.
- NOA (10): big curly dark-brown hair puff, yellow scrunchie, freckles, big eyes, oversized teal hoodie, jeans, fuzzy socks.
- BIT: chubby glowing golden packet/envelope (GOTV's), football emblem, luggage tag `#5401 GOAL`, big eyes + brows, stubby arms/legs, light trail.
- Competitors (dull desaturated, funny not mean): ILVIP (mauve, bent crown), EMBY (sage, striped nightcap, spinner), LAGTV (slate, taped rabbit ears), LOADING+ (beige, hourglass); generic commuter packets. CATPACKET: big lilac-grey cat-eared packet, sunglasses pushed up, label `cat_video_FINAL(3).mp4`, bored.
- SHARK: goofy cartoon shark, hungry → dazed.

## Kit files (built first, in parallel) and their exported API
- `src/kit_family.js` (+ `src/subs.js`): `saba(x,y,s,o)`, `noa(x,y,s,o)` (poses: sit/stand/rise/jump/crouch, moods via `o.mood` changes that act, gestures: point, armsUp, headHands, fists, reach, mug/case holding, hug, cheer, throw; `o.mouth` default `mouthOf(...)`, `o.look`, `o.flip`), `livingRoom(t,o)` (full set, `o.shelfEmpty` after the box is gone), `armchair(x,y,s,layer)`, `tvSet(x,y,w,h,t,o)` with `o.screen`: 'live' | 'freeze' | 'error' | 'app' | 'goal' | 'smooth' (+ `o.bug`: 'old' | 'gotv', `o.spinner`, `o.pct`, scoreboard), `backgammon(x,y,s,o)` (case/board, dice, checker hop), `phoneChat(x,y,s,t,o)` (WhatsApp-style chat, RTL bubbles), `oldBox(x,y,s,o)` with cable spaghetti.
- `src/kit_packets.js`: `bit(x,y,s,o)` (moods determined/panic/cheeky/joy/bored/laugh/exhausted/tongue, limbs run/fly/flop/armsUp/crouch, `o.back` back view, `o.vel` squash + trail, `o.boost`, `o.wink`), `packet(x,y,s,o)` (generic, `o.kind`, `o.mood`, `o.honk`, `o.back`), `brandPacket(x,y,s,o)` (`o.brand` ILVIP/EMBY/LAGTV/LOADING+, `o.mood` grumpy/sleepy/shock/panting, `o.spinner`, `o.back`), `catPacket(x,y,s,o)`, `shark(x,y,s,o)` (`o.bite`, `o.mood` hungry/dazed, `o.flip`), `queueSign(x,y,s,o)`.
- `src/kit_telaviv.js`: `tlvCity(t,cam)` drone views of the night city from above/oblique, `stadium(t,o)` bowl + pitch + players, `ultras(t,o)` the Maccabi home stand crowd (painted bands + front-row figures, jumping waves, scarves, flags, tifo, flare smoke), `mast(t,o)` broadcast building + signs, `packetStream(pts,t,o)`.
- `src/kit_journey.js`: `fibreTunnel(t,o)`, `ocean(t,o)` + `cableY(x,o)` + `routeMap(x,y,w,h,t,o)`, `torontoStreet(t,o)` + pole/wire path, `gotvLogo(x,y,s,t,o)` (painted wordmark for the end card and the TV corner).
Each kit agent: put a comment block at the top documenting every function/option, build a model sheet via a LOOPS entry
(`LOOPS.kit_family = t => {...}; LOOPS.kit_family.len = N`, render with `--loop=kit_family --sheet=...`) and iterate
until it matches the P(doom) charm.
