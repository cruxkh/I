# PACKET FROM HOME · חבילה מהבית — Production Bible

A 60-second 2D animated short, 1920×1080, 30 fps (1800 frames), rendered from HTML Canvas2D in headless Chromium.
**Every agent reads this whole file first.** Work only in the files you own. Do not git commit.

## Logline
89th minute, 1–1. In a snowed-in Toronto apartment, Israeli grandpa **Saba Moshe** watches his beloved Maccabi Tel Aviv
over **IPTV streamed live from Israel** — and the picture freezes on the buffering wheel one second before the goal.
His granddaughter **Noa** grabs the router… and we dive inside the internet, where a tiny, brave data packet named
**Bit** — carrying *frame #5401: THE GOAL* — fights through a traffic jam of cat videos, races 11,000 km along an
undersea cable (past a cable-biting shark), and bursts into the living room router just in time. GOAL.

## Story & sync points (GLOBAL seconds — these are law; audio is being built against them in parallel)
| t | event |
|---|---|
| 0.0 | Fade from black. Tel Aviv at night: skyline (Azrieli towers: round, triangular, square), the sea, a packed floodlit stadium. |
| 0.5 | Crowd swell. |
| 1.2–4.9 | ANNOUNCER (stadium PA / TV): "Eighty-nine minutes gone, one all, and Maccabi are on the attack!" |
| 4.6 | Camera whips up from the stadium to a broadcast tower / IPTV server building labelled `IPTV · ISRAEL` (Hebrew sign `שידור חי`). |
| 5.0 | Glowing packets launch from the mast toward the sea (whoosh). Camera follows them over the water. |
| 6.2 | **CUT** → Toronto. Establishing push-in through the frosted window of a snowy apartment (warm lamp inside). |
| 6.9–10.2 | SABA: "Noa! Eighty-nine minutes. One one. This is it." (in armchair, leaning at the TV, scarf on) |
| 10.5–12.4 | NOA: "Saba, breathe. It's just football." (sitting on the sofa arm/floor with a mug of cocoa) |
| 12.6–14.7 | SABA: "Just football?! Go, Maccabi!" — on TV the striker breaks away; Saba rises out of the chair. |
| **14.5** | **FREEZE.** TV picture freezes mid-strike, blocky compression artifacts, buffering spinner appears. Music cuts. |
| 15.2–16.5 | SABA: "No! Not now!" (hands on head, horror) |
| 17.6–19.7 | NOA: "Hold on, Saba. I'll find where it's stuck." — she crouches at the router under the TV cabinet. |
| 19.8 | Push in on the router's blinking LED… |
| 20.3 | …WHOOSH, we dive into the light. |
| 21.0 | **Data world** inside the fibre: a jammed tunnel of packets. Meet BIT (gold, glowing, label `#5401 ⚽ GOAL`). |
| 21.9–23.9 | BIT: "Excuse me! Live goal coming through! Live goal!" (squeezing between packets) |
| 25.1–27.8 | CATPACKET (huge, grumpy): "Get in line, kid. Cat videos first." |
| 28.0–28.6 | BIT: "Not today!" |
| 28.6 | Bit crouches, BOOST — rockets up and over the jam (energy trail). |
| 29.8 | Bursts out the front of the jam into open fibre → streaks away. |
| 30.5 | **CUT** → Deep ocean, outside the transparent glowing undersea cable on the sea floor. Bit is a blazing pulse racing inside it. A map inset/overlay tracks route TLV → Marseille → Gibraltar → Atlantic → Toronto with km counter 0 → 11,000. |
| 32.2–33.9 | BIT: "Marseille… the Atlantic… whoa, shark!" |
| 35.6 | A cartoon shark lunges at the cable… |
| 36.0 | CHOMP (sparks). |
| 36.2 | Bit bounces off the shark's nose from inside; the shark's eyes spin (dazed). |
| 37.6–38.6 | BIT: "Nice try, fishy!" (cheeky wink) |
| 40.5 | Cable rises to the shore at Toronto (snowy coast / city lights). |
| 41.5 | **CUT** → Toronto street, night, snow. Bit zips up a utility pole, along the wire, into the apartment building. |
| 41.9–43.4 | BIT: "Last mile… last meter…" |
| 44.6–45.3 | BIT: "Delivered!" |
| 44.9 | Bit slams into the router (impact flash). |
| 46.0 | **CUT** → Living room. Spinner vanishes, TV unfreezes. |
| 46.4 | Ball hits the net (on TV). |
| 46.6–47.8 | ANNOUNCER (from TV): "Goooal! Maccabi!" |
| 47.6 | Saba leaps up, popcorn/confetti explodes, scarf whirling. |
| 48.3–50.5 | SABA: "Gooool! Noa, you are a genius!" (hugs/lifts Noa or dances) |
| 51.4–52.9 | NOA: "Thank the little packet, Saba." (she glances at the router) |
| 54.5 | Close-up on the router. Tiny Bit flops out of the LED port, exhausted. |
| 55.0–56.9 | BIT: "Next time… send the goal earlier." |
| 56.9 | Bit winks / passes out happily. |
| 57.3 | GOTV end card: GOTV logo + tagline (film title small). Subtitles off from 57.2. |
| 59.2–60.0 | Fade to black (engine does it). |

Dialogue text/timing lives in `audio/script.json`; generated timing + per-frame lip-sync in `kits/lipsync.js`
(`A.LINES`, `A.LIPSYNC`). Use `A.mouth('SABA', t)` etc. for mouths — never hand-animate mouths while a character speaks.
Speakers: `SABA`, `NOA`, `BIT`, `CATPACKET`, `ANNOUNCER`.

## Scene files & time ranges (scene agents own exactly one file)
| file | range (s) | contents |
|---|---|---|
| `scenes/s1_telaviv.js` | 0.0 – 6.2 | Tel Aviv cold open, stadium, broadcast mast, packets launch over sea |
| `scenes/s2_livingroom.js` | 6.2 – 21.0 | Toronto apartment: exterior push-in, dialogue, freeze, router, dive into LED |
| `scenes/s4_jam.js` | 21.0 – 30.5 | Data tunnel traffic jam, Bit vs Catpacket, boost over the jam |
| `scenes/s5_ocean.js` | 30.5 – 41.5 | Undersea cable race, map overlay, shark |
| `scenes/s6_lastmile.js` | 41.5 – 46.0 | Snowy Toronto street, pole, wire, into router: DELIVERED |
| `scenes/s7_goal.js` | 46.0 – 60.0 | Goal celebration, tag with tiny Bit, title card |

Register with `A.scene({name, start, end, draw(ctx, s)})`; `s = {t, lt, p, dur, f}` (global t, local t, progress 0..1).
Ranges are contiguous — each scene owns the look of its own first and last ~0.3 s (e.g. white flash, whip-pan
blur, iris). Agreed cut styles: 6.2 whip-blur/flash into snow; 21.0 white-cyan flash out of the LED dive;
30.5 hard cut; 41.5 hard cut with a light streak; 46.0 impact flash from the router continuing into the living room;
57.3 title slam.

## Visual style
Modern 2D feature-animation look: clean vector shapes, a warm-dark outline `A.OUTLINE = '#1a1330'`
(4–6 px at 1080p for characters, thinner/none for distant BG), soft cel-shading (one shadow tone + one rim light
matching the key light of the scene), gradients for atmosphere, additive `A.glow` for light sources, depth via parallax
layers and atmospheric haze. Comic accents à la Spider-Verse used sparingly: speed lines, impact frames, halftone
shading, smear frames on fast motion. Characters must feel ALIVE: breathing (subtle scale/bob), eyes that blink
(`A.blink`), overshoot & settle (`A.ease.outBack`), secondary motion (scarf, hair curls, ear flaps, antennae).
Squash & stretch on anything fast. Anticipation before big actions.

### Colour script
- S1 Tel Aviv night: sky indigo `#1b1f4a` → magenta horizon `#d8577a`, floodlights `#ffe9a8`, Maccabi yellow `#ffd21f` & blue `#1f4fbf`, sea `#0e2a55`.
- S2 living room: warm lamp amber `#ffb45e`, walls `#6b3f4f`/`#8a5a55`, cold window blue `#5d7fc4`, snow `#e8f0ff`, TV glow `#9ff5d0`.
- S4 data world: navy `#0a0f2e`, cyan `#29f0ff`, magenta `#ff3fa4`; Bit gold `#ffc93c`.
- S5 ocean: abyss `#021421` → teal `#0b4a5c`, bioluminescent cyan/violet, cable glass cyan.
- S6 Toronto street: navy night `#131a3a`, sodium lamps `#ffab4a`, snow blue-white.
- S7: warm living room + yellow/blue confetti; title card yellow `#ffd21f` on deep navy `#0d1033`.

## Characters (drawn by kits; see API below)
- **SABA MOSHE** (78): round belly, olive-tan skin `#c98f65`, bald crown with white side tufts, HUGE bushy white eyebrows and a
  white moustache, thick black-rimmed glasses, brown knitted cardigan over a white undershirt, grey trousers, **sandals with
  socks**, Maccabi scarf (yellow/blue stripes, tassels). Explosive, loving, dramatic.
- **NOA** (10): big curly dark-brown hair puff held with a yellow scrunchie, olive skin `#d9a57c`, freckles, large expressive eyes,
  oversized teal hoodie with a small blue Star-of-David/flag pin, jeans, fuzzy socks. Clever, calm, dry humour.
- **BIT**: a chubby, glowing golden packet — rounded cube/envelope `#ffc93c` with a hot-white core glow, a tiny ⚽ emblem and a
  luggage-tag label `#5401 ⚽ GOAL`. Big bright eyes with highlights, expressive eyebrows, stubby arms/legs, a trailing ribbon of
  light/binary digits when moving. Plucky hero. ~120 px tall at scale 1.
- **CATPACKET**: huge bulky lilac-grey packet with cat ears, label `cat_video_FINAL(3).mp4`, heavy-lidded bored eyes,
  tiny sunglasses pushed up, slow and gruff.
- Generic **packets**: coloured rounded cubes with icons (✉ email, ▶ video, 😂 meme, ⟳ update, 🛒 shop), sleepy commuters.
- **SHARK**: goofy cartoon blue-grey shark, oversized teeth, can look hungry or dazed (spiral eyes).

## Kit API contracts (kit agents implement EXACTLY these signatures; scene agents rely on them)
Coordinate convention: `(x, y)` is the character's **ground contact point** (bottom centre: feet, or seat contact when sitting),
`scale` 1 = the natural size given. All options optional with sensible defaults. `o.t` = global time (drives breathing, blinks,
secondary motion). `o.mouth` defaults to `A.mouth(<SPEAKER>, o.t)`. `o.look = [dx, dy]` eye direction in [-1,1]. `o.flip` mirrors
horizontally. Functions must `save()/restore()` and never leak state.

### `kits/family.js`
- `A.drawSaba(ctx, x, y, scale, o)` — standing height ≈ 560 px at scale 1. `o.pose`: `'sit'` (in armchair, (x,y)=seat contact),
  `'rise'` (half out of chair, o.rise 0..1 blends sit→stand), `'stand'`, `'jump'` (airborne celebration, arms up).
  `o.mood`: `'neutral'|'eager'|'tense'|'horror'|'joy'`. `o.gesture`: `'none'|'fists'|'point'|'headHands'|'armsUp'|'grip'`
  (grip = clutching armrests). `o.lean` (-1..1 forward/back), `o.scarfWave` (0..1 extra scarf flutter), `o.look`, `o.mouth`.
- `A.drawNoa(ctx, x, y, scale, o)` — standing height ≈ 400 px. `o.pose`: `'sit'|'stand'|'crouch'`. `o.mood`:
  `'neutral'|'amused'|'focused'|'joy'|'proud'`. `o.gesture`: `'none'|'mug'` (holding cocoa) `|'reach'` (both hands forward, for
  the router) `|'shrug'|'cheer'`. `o.look`, `o.mouth`, `o.hug` (0..1, arms wrap for being hugged/lifted).
- `A.SABA_COLORS`, `A.NOA_COLORS` palette objects.

### `kits/datafolk.js`
- `A.drawBit(ctx, x, y, scale, o)` — ~120 px tall. `o.mood`: `'determined'|'panic'|'cheeky'|'joy'|'exhausted'|'squeeze'`.
  `o.vel = [vx, vy]` px/s → auto squash/stretch + light trail length; `o.boost` (0..1 rocket-flame/aura), `o.wink` (0..1),
  `o.glow` (0..2 intensity, default 1), `o.limbs` (`'run'|'fly'|'flop'|'arms-up'`), `o.look`, `o.mouth`.
- `A.drawPacket(ctx, x, y, scale, o)` — generic ~90 px. `o.kind`: `'mail'|'video'|'meme'|'update'|'shop'|'photo'`, `o.seed`,
  `o.mood`: `'bored'|'annoyed'|'sleep'|'shock'`, `o.honk` (0..1 little honk/anger pop).
- `A.drawCatPacket(ctx, x, y, scale, o)` — ~260 px tall. `o.mood`: `'bored'|'grumpy'|'shock'`, `o.mouth`, `o.look`.
- `A.drawShark(ctx, x, y, scale, o)` — ~700 px long, (x,y)=body centre, faces right unless `o.flip`. `o.bite` (0..1 jaw),
  `o.mood`: `'hungry'|'dazed'`, `o.swim` phase, `o.look`.
- `A.drawBinaryTrail(ctx, pts, t, o)` — ribbon of glowing 0/1 digits along a polyline `pts` (array of [x,y]), `o.color`.

### `kits/home.js`
World coords of the living-room master shot are the 1920×1080 frame itself.
- `A.LR` — layout constants: `{ chair:{x,y}, sofa:{x,y}, tv:{x,y,w,h}, router:{x,y}, window:{x,y,w,h}, lamp:{x,y}, floorY }`.
- `A.drawLivingRoom(ctx, t, o)` — full master background (walls, window with falling snow + Toronto night skyline incl. CN Tower,
  bookshelf, framed photo of Tel Aviv beach, hamsa, a small Israeli flag, rug, lamp with warm glow, TV cabinet). Does NOT draw
  the TV screen content, armchair or router (drawn separately for layering). `o.tvGlow` (colour/intensity of light spill),
  `o.flash` (0..1 camera-flash/celebration light).
- `A.drawArmchair(ctx, x, y, s, layer)` — `layer: 'back'|'front'` so Saba sits between the two passes.
- `A.drawTVScreen(ctx, x, y, w, h, t, o)` — the football broadcast INSIDE a screen rect: pitch, crowd, yellow (Maccabi) vs red
  players, ball, scorebug `מכבי 1–1 הפועל 89:xx`, `LIVE`/`שידור חי` badge, channel logo `IPTV·IL`. `o.state`:
  `'live'|'freeze'|'goal'`. `o.matchT` (seconds since 14.5-local breakaway start; the strike shot reaches the net at matchT≈1.9
  in 'goal' state), `o.freezeGlitch` (0..1 macroblock artifacts), `o.spinner` (0..1 buffering wheel visibility, spins with t),
  `o.bufferPct` (number shown under spinner).
- `A.drawTV(ctx, x, y, w, h, t, o)` — the TV set frame + calls `drawTVScreen` + screen glare.
- `A.drawRouter(ctx, x, y, s, o)` — cute boxy router with antennae and a row of LEDs, ~220 px wide at s=1, (x,y)=bottom centre.
  `o.activity` (0..1 LED flicker), `o.ledGlow` (0..3 main LED bloom — the dive target), `o.shake`. `A.routerLED(x,y,s)` returns
  the main LED's screen position for camera targeting.
- `A.drawTorontoStreet(ctx, t, o)` — full-frame snowy night street: row houses/apartment, utility pole with wires, CN Tower in
  distance, sodium street lamps, falling snow (deterministic). `o.cam = {x,y,zoom}` optional parallax. Exposes `A.STREET`
  with pole top, wire path points and the apartment window/entry point for Bit's route.
- `A.drawSnow(ctx, t, o)` — reusable deterministic snowfall overlay (`o.density`, `o.wind`, `o.depth`).

### `kits/journey.js`
- `A.drawTelAviv(ctx, t, o)` — full-frame night panorama: Azrieli towers (round, triangle, square), hotels along the promenade,
  the sea with moon glints, Jaffa lights, a floodlit stadium with crowd flicker and camera flashes, a broadcast mast/IPTV server
  building with `שידור חי` / `IPTV · ISRAEL` sign. `o.cam = {x, y, zoom}` world camera (world is 3840×2160; default shows
  whole panorama). Exposes `A.TLV` with positions (stadium, mast top, sea horizon).
- `A.drawStadiumClose(ctx, t, o)` — full-frame view into the stadium: stands with flickering yellow/blue crowd, flags,
  floodlights, pitch, `o.roar` (0..1 crowd jump intensity).
- `A.drawDataTunnel(ctx, t, o)` — full-frame inside-the-fibre world: perspective tunnel of light rings, flowing streaks,
  circuit patterns. `o.speed` (flow speed), `o.z` (camera depth travelled), `o.hue` shift, `o.jam` (0..1 red brake-light mood).
- `A.drawOceanFloor(ctx, t, o)` — full-frame deep sea: light shafts, particles/marine snow, bioluminescent plankton, kelp,
  rocks, distant fish schools, and the glowing transparent undersea cable along the sea floor. `o.scroll` (world x travelled, for
  parallax), `o.cableY` (cable height), `o.depthTint`. `A.oceanCablePath(x, o)` returns the cable y at screen x.
- `A.drawRouteMap(ctx, x, y, w, h, t, o)` — stylised map inset (Mediterranean → Atlantic → Great Lakes), glowing route, pins
  TLV / Marseille / Gibraltar / Halifax / Toronto (Hebrew+English labels), `o.p` (0..1 progress) moves a gold dot,
  km counter `o.km`.
- `A.drawPacketStream(ctx, pts, t, o)` — many small glowing packets streaming along a path (used for broadcast launch).

## Audio (built in parallel by the sound designer and composer; mixed by the director)
- SFX library: `audio/sfx/<name>.wav` (48 kHz). Index with descriptions: `audio/sfx/INDEX.md`.
- Cue sheets: JSON arrays `[{"sfx": "name", "t": 12.3, "gain_db": -6, "pan": 0.0}]`. The sound designer writes
  `audio/cues/base.json` for all sync points above. **Scene agents** may add `audio/cues/<scenefile>.json` for extra
  sounds tied to their animation (only using names that exist in the library).
- Score: `audio/music/score.wav` (60.0 s, 48 kHz stereo) + stems if available.

## Engine & tools (read `engine.js` — it is short)
Helpers: `A.clamp/lerp/inv/smooth/key/ease/hash/rng/noise1/noise2/fbm/wob`, `A.blob/path/rrect/ellipse/fillStroke/radial/
linear/glow/text`, `A.layer(key,w,h,draw)` caches a static offscreen canvas — **use it for anything static**, `A.camera`,
`A.mouth/speaking/blink`. `A.noSubs = t => bool` can suppress subtitles. The engine post-pass adds vignette, grain, Hebrew+English
subtitles (bottom ~140 px band — keep key action out of y > 930 while someone speaks) and the global fades.

**Determinism:** everything is a pure function of `t`. No `Math.random`, no `Date`, no state carried between frames
(frames render out of order across 4 workers). Use `A.hash`, `A.rng(seed)`, `A.noise*`. Simulations (particles, confetti) must be
closed-form or re-simulated from a seed each frame.

**Performance:** average ≤ 250 ms/frame at 1920×1080. Cache backgrounds with `A.layer`. Avoid `ctx.filter = 'blur()'` on
full-frame canvases every frame (use cached pre-blurred layers or radial gradients); `shadowBlur` sparingly.

**Previewing:** `node render.js --frames 300,420 --prefix mytag` → PNGs in `previews/` (half-res). `--sheet 630:900:12 --prefix x`
→ a contact sheet. `--html tools/test_<kit>.html` to render a kit test page (copy `tools/_smoke.html` pattern: it includes the
engine with `../` paths; replace the smoke scene with your own demo script). **Look at your previews with the Read tool and iterate
until it looks genuinely great** — you are the art director of your piece. Delete throwaway previews you don't need.

## Quality bar
This must look like a festival-grade animated short, not a tech demo. Rich backgrounds with depth; characters with appeal and
real acting (anticipation, overshoot, follow-through, eye darts, blinks, breathing); motion that is never linear; lighting that
tells mood; dense but readable composition; little Israeli details (Hebrew signs, hamsa, Maccabi scarf, sandals with socks,
Bamba bag on the table!).

## Text rule (client request)
NO em dash "—" or en dash "–" anywhere in on-screen text (signs, captions, scorebugs, subtitles, logos, labels).
Use a period, comma, colon, middle dot "·" or a plain hyphen "-" instead (e.g. score `1-1`, not `1–1`).

# ===================== VERSION 2 (81 s) — SUPERSEDES the story table above =====================
Client brief v2: (1) Noa asks Saba to come play backgammon (שש-בש) with her; he can't, he's in the middle of the game,
and the OLD provider freezes. (2) Noa switches him to **GOTV**, and from then on everything is smooth, fast, no freezes.
(3) Comic jab at competitors: in the jam, packets of the competitors **ILVIP** and **EMBY** (plus fictional **LAGTV** and
**LOADING+**) are stuck "waiting in line"; GOTV's Bit overtakes them all and arrives FIRST to the home.
Tone: playful comic hyperbole, never nasty; competitors are sleepy/whiny packets in a queue, not villains.
Duration 81.0 s = 2430 frames. Engine: `A.DUR = 81`; scene files loaded after `A.SHIFT = d` play d s later (s.t is in
their own time base; lipsync compensates). S5 and S6 are unchanged and shifted by +12.9 s.

| global t | event |
|---|---|
| 0.0–6.2 | S1 Tel Aviv cold open (unchanged). |
| 6.2–29.2 | **S2 v2 living room** (scenes/s2_livingroom.js, now 6.2–29.2, shift 0): |
| 6.9–10.2 | SABA "Noa! Eighty-nine minutes. One one. This is it." (TV shows OLD provider bug `הספק הישן`, no GOTV anywhere yet) |
| 10.5–12.3 | NOA (holding a closed wooden backgammon case, hopeful): "Saba, come play backgammon with me!" |
| 12.5–15.1 | SABA (waves her off, eyes glued to TV, rising): "Not now, motek! I'm in the middle of the game!" — striker breakaway |
| **15.3** | **FREEZE** (old provider): macroblocks, spinner stalls. |
| 16.0–17.3 | SABA horror: "No! Not now!" |
| 17.8–20.3 | SABA exasperated at the TV: "Again?! Every single game it gets stuck!" (spinner, maybe the TV UI shows `שגיאה` / retry) |
| 20.6–24.7 | NOA (sets down the backgammon case, knowing smile): "Because you're still with the old provider, Saba. Everyone switched to GOTV!" |
| 25.0–28.0 | NOA crouches at the router: "Hold on, Saba. Switching you to GOTV... now!" On "now!" (~27.6) she presses; the TV shows `A.drawSwitchOverlay` (עובר ל-GOTV... ✓ GOTV פעיל) and the router LED turns GOTV-gold. |
| 28.0–29.2 | Push into the gold LED, whoosh, white-gold flash. |
| 29.2–43.4 | **S4 v2 jam** (scenes/s4_jam.js, now 29.2–43.4, shift 0): |
| 30.1–32.1 | BIT "Excuse me! Live goal coming through! Live goal!" |
| 32.4–34.9 | ILVIP packet (brand packet, grumpy, in the queue under a `ממתין בתור` sign): "Hey! We've been waiting in line since the first half!" |
| 35.1–36.6 | EMBY packet (sleepy, spinner on its face): "Still... buffering..." |
| 36.9–39.4 | CATPACKET "Get in line, kid. Cat videos first." |
| 39.7–41.4 | BIT "Sorry! GOTV doesn't wait in line!" |
| 41.5 | BOOST over the whole queue (ILVIP, EMBY, LAGTV, LOADING+ look up in shock). 42.7 bursts into open fibre. |
| 43.4–54.4 | S5 ocean (unchanged, shift +12.9): shark chomp 48.9, "Nice try, fishy!" 50.5. |
| 54.4–58.9 | S6 last mile (unchanged, shift +12.9): "Delivered!" impact 57.8. |
| 58.9–81.0 | **S7 v2** (scenes/s7_goal.js; rewrite its times to new global, shift 0): |
| 58.9–59.3 | TV unfreeze, now with the GOTV channel bug (A.drawGOTVBug) instead of the old one. Ball in net 59.3. |
| 59.5–60.7 | ANNOUNCER "Goooal! Maccabi!" |
| 60.5 | Saba leaps, confetti, Bamba. |
| 61.2–63.4 | SABA "Gooool! Noa, you are a genius!" hug. |
| 64.3–66.7 | NOA "Thank GOTV, Saba. No more freezing!" |
| 67.0–69.6 | SABA "And now... backgammon! Come, let's play!" |
| 69.6–72.4 | Payoff: Saba and Noa at the side table playing backgammon (A.drawBackgammon open board, dice roll), laughing; behind them the TV plays smooth live football with GOTV bug and a `LIVE · 4K · ללא תקיעות` badge. The promise delivered: he has time for her. |
| 72.4–77.8 | Router close-up tag: Bit flopped on the shelf, exhausted and proud. Two competitor brand packets (ILVIP, EMBY) finally stagger in from the cable, panting, late. ILVIP 73.0–74.5 "Did... did we miss the goal?"; BIT 74.8–77.2 "Sorry, guys... GOTV got here first." wink ~77.4. |
| 77.8–81.0 | GOTV end card (same design), taglines now: Hebrew `הטלוויזיה של ישראל` second line `(התקנת אפליקציה על המסך החכם)` Subtitles off from 77.7. Engine fades 80.2–81.0. |

Speakers now also include `ILVIP`, `EMBY` (lip-sync via A.mouth('ILVIP', t) etc.).

## v2 shared props kit `kits/props.js` (built by the props agent; scenes may guard with `if (A.drawBackgammon)` until it lands)
- `A.drawBackgammon(ctx, x, y, s, o)` — (x,y) bottom centre. `o.mode`: `'case'` (closed wooden case with inlay and handle,
  ~180 px wide at s=1, can be carried: draw it at a hand position) | `'board'` (open board on a table, ~420 px wide at s=1, seen at
  a 3/4 top-down angle, checkers in play). `o.t`, `o.dice` (0..1 roll animation: dice tumble then land), `o.diceVals [a,b]`,
  `o.move` (0..1 a checker hop between two points).
- `A.drawBrandPacket(ctx, x, y, scale, o)` — competitor packet (~100 px tall at 1), same family look as A.drawPacket but with a
  clear brand label tag. `o.brand`: `'ILVIP'|'EMBY'|'LAGTV'|'LOADING+'`, `o.who` (speaker id for lipsync, default the brand),
  `o.mood`: `'grumpy'|'sleepy'|'shock'|'panting'`, `o.spinner` (0..1 little loading spinner on its face/head),
  `o.sign` (0..1 small held sign `ממתין בתור`), `o.mouth`, `o.look`, `o.flip`, `o.vel`, `o.rot`.
- `A.drawGOTVBug(ctx, x, y, s, o)` — small TV channel logo (GOTV wordmark matching the end card look, yellow/blue), `o.alpha`.
- `A.drawOldProviderBug(ctx, x, y, s, o)` — dull grey generic logo `הספק הישן`.
- `A.drawSwitchOverlay(ctx, x, y, w, h, t, o)` — TV-screen UI overlay inside a screen rect: `o.p` 0..1: dim screen, card
  "עובר ל-GOTV..." with progress bar, then at p≥0.8 a big check `✓ GOTV פעיל` with gold burst.
- `A.drawQueueSign(ctx, x, y, s, o)` — hanging sign `ממתין בתור · WAITING IN LINE` with a ticket number.
Note (client): ILVIP and EMBY are the client's own older services, so naming them is approved by the client. Keep the jab playful.

# ===================== VERSION 5 (87 s) — SUPERSEDES the v2 table where they differ =====================
Client changes: (a) Noa no longer switches via the router: she yanks out the OLD set-top box with its messy tangle of cables and
throws it in the bin, then WhatsApps a GOTV rep on her phone; the rep replies; the GOTV app opens on the smart TV and the light/
flash comes OUT OF THE TV SCREEN; we dive into the TV and the rest continues from there. (b) Shark: Bit is unimpressed and
dismissive: "Ahh... another attacker..." and the attack makes him laugh. (c) Last mile: Bit enters the SMART TV, not the router.
(d) Tag: Bit exhausted on the TV stand/cabinet top next to the TV; ILVIP and EMBY arrive there late. The old set-top box is GONE
after 26 s everywhere (empty shelf; router may stay as plain home internet). (e) Scorebug after the goal: Maccabi 2, Hapoel 1
(each team's number next to its own name; fixed in home.js).
Shifts: S4 +6.0 (index.html A.SHIFT=6 before s4), S5/S6 +18.9, S7 +6.0. Duration 87.0 = 2610 frames.
| global t | event |
|---|---|
| 20.6–24.7 | NOA "Because you're still with the old provider, Saba. Everyone switched to GOTV!" (unchanged) |
| 25.0–26.1 | NOA "Bye-bye, old box!" — she yanks the old box out of the cabinet, spaghetti of cables comes with it |
| ~26.4 | she tosses it into a bin (crash); dusts off her hands |
| 27.3–28.8 | NOA "One message to GOTV..." — phone out; WhatsApp close-up |
| ~28.4 | her message appears: `אני רוצה להתחבר לשירותי הצפייה שלכם באפליקציה על מסך הטלוויזיה` |
| ~29.4 | rep typing… ; ~30.2 rep: `בכיף! המנוי מופעל ✅` (rep name `GOTV · נציג שירות`, green check marks) |
| 31.3–32.8 | NOA "Activated! Look, Saba!" — GOTV app splash opens on the smart TV (A.drawSwitchOverlay / GOTV bug), Saba turns |
| 33.0–35.2 | Light pours OUT of the TV screen, push into the screen, white-gold flash 34.7–35.2 |
| 35.2–49.4 | S4 jam (v2 content, +6) |
| 49.4–60.4 | S5 ocean (+18.9): BIT 51.1–52.4 "Marseille... the Atlantic..."; shark reveal ~52.9; BIT 53.2–54.9 bored, dismissive "Ahh... another attacker..." (half-lidded eye-roll); CHOMP 54.9; zap 55.1 and Bit LAUGHS at the shark; 56.5 "Nice try, fishy!" |
| 60.4–64.9 | S6 last mile (+18.9): into the apartment, along the cable to the SMART TV; "Delivered!" 63.5; impact INTO THE TV 63.8 |
| 64.9–87.0 | S7 (+6.0): goal 65.3, ... backgammon 75.6–78.4, tag at the TV stand 78.4–83.8 (ILVIP 79.0 "Did we miss the goal?", BIT 80.8 "Sorry, guys... GOTV got here first."), end card 83.8–87.0 with tongue-out crash zoom |

# ===================== VERSION 7 (96 s) — supersedes where different =====================
Team: MACCABI TEL AVIV (yellow/blue) everywhere. Duration 96.0 = 2880 frames.
Scene shifts (index.html): S1 0 (0–10.2, rebuilt), S2 +4.0 (own 6.2–35.2 → 10.2–39.2), S4 +10.0 (own 29.2–48.4 → 39.2–58.4, rebuilt),
S5/S6 +27.9 (→ 58.4–73.9), S7 +15.0 (own 58.9–81.0 → 73.9–96.0). Cue files are in each scene's own time base (mixer shifts them).
S1 0–10.2: night drone flies FORWARD (oblique, ~20–35° down tilt, NOT top-down) slowly toward the stadium, over the rim and along/into
the MACCABI TEL AVIV home stand: ultras going wild, jumping, dancing, scarves twirling, huge yellow/blue flags and tifo, flares/smoke
(yellow), drums, arms up, chanting. Announcer 1.2–4.9. ~8.5 tilt/whip up to the IPTV mast; packets launch ~9.0 (Bit glint);
flash out 10.0–10.2.
S4 own base 29.2–48.4: out of the gold flash straight into a pro chase cam BEHIND Bit (no zoom-in/zoom-out), running, jumping,
pushing, getting stuck among other providers' packets; BIT 30.6–32.6 "Excuse me! Live goal..."; reaches front ~37.0;
ILVIP 37.4–39.9; EMBY 40.1–41.55; CATPACKET 41.9–44.4 speaking FROM WITHIN the queue crowd at his normal size (two-shots /
over-the-shoulder, no giant low-angle close-up with tiny Bit in a corner); BIT 44.7–46.4 "Sorry! GOTV doesn't wait in line!";
BOOST 46.5; burst into open fibre 47.7; hard cut 48.4.
