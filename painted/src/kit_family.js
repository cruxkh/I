// kit_family.js: SABA, NOA and their snowy Toronto living room, painted (watercolour wash + boiling ink) like the rest of
// the film. Everything here draws ONE frame and is a pure function of its arguments and T (the global time).
//
// ======================================================================================================================
// CHARACTERS
//   saba(x, y, s, o)   Saba (78). s = 1: about 540 px tall standing, ~410 px sitting. (x, y) = the FLOOR point between
//                      his feet in every pose (so a sitting Saba shares x, y, s with armchair()).
//   noa(x, y, s, o)    Noa (10). s = 1: about 420 px tall standing (hair puff included). (x, y) = floor point between feet.
//     Both face screen-RIGHT (+x) by default; o.flip mirrors them. "R" below means the hand on the side they face.
//   options (all optional; any field may come from famAct(), which is how moods/poses/gestures should change in a shot):
//     t          time (default T, the global time; lip-sync and idle motion use it)
//     mood       saba: neutral eager dismiss tense horror angry joy laugh love surprised sad sly
//                noa:  neutral hopeful sad amused focused determined joy proud laugh surprised cheeky
//                (a mood = face + colour + its own idle motion. Never switch moods by hand between frames: use famAct.)
//     pose       'stand' | 'sit' | 'rise' (half out of the chair, leaning in) | 'jump' (airborne, legs kicked) | 'crouch'
//                or numbers: rise 0..1 (0 sit, 1 stand), crouch 0..1, air 0..1+ (jump height), lean (rad, + = toward
//                facing direction), bob (px, - = up), tilt (head, rad), shake (px)
//     gesture    idle grip point armsUp cheer headHands fists reach waveOff shrug hug throw clap case phone box mug
//                remote present. Blend two with gestureFrom + gestureK (0..1). gk = the gesture's own parameter:
//                throw (0 wind-up .. 1 release), box (0 at chest .. 1 overhead), case (0 held low .. 1 offered up).
//     hold       'case' | 'phone' | 'box' | 'mug' | 'remote' | 'bamba' | false (default: the holding gesture's prop).
//                Held props touch the hands; 'box' is oldBox() with its cable spaghetti (o.boxO passes options to it).
//     talk       0..1 mouth openness; default mouthOf('SABA'|'NOA', t) from src/lines.js (lip-sync is automatic)
//     look       [x, y] -1..1 (or a number for x) pupils;  turn -1..1 turns the face toward (+) / away (-) from facing
//     face       numeric face (from famAct): { bi bo by ba (brows: inner, outer, both, asymmetry), eyes, eo (eye open),
//                squint, mw mc mh mt ms (mouth width, curve, open, teeth, skew), bl (blush), pale, flush }
//     emote + emoteK + emoteAge: a clawd emote by the head ('!', '!!', '?', 'sweat', 'heart', 'spark', 'steam', 'anger' ...)
//     sq, dy (px), rot, flip, scarfWave 0..1 (Saba's scarf flutter), layer 'body' | 'arms' | 'all' (hugs: draw
//     Saba's body, then Noa, then Saba's arms), boilKey (stable boil id if characters come and go), swMul (outline weight)
//
//   famAct(who, t, keys, o)   ACTED changes, like clawd's emotions(): who = 'saba' | 'noa',
//        keys = [[t0, mood, { pose, gesture, gk, look, turn, hold, emote, ... }], [t1, mood2, {...}], ...].
//        Fields in a key persist until a later key changes them. Around every mood change the eyes squeeze shut and the
//        body squashes (anticipation), the face swaps under the squint, a take fires, brows/mouth/colour glide over with
//        overshoot, the new emote pops. Gestures blend (the eyes lead, arms follow ~60 ms later with overshoot); poses
//        blend with weight (sit -> stand leans forward and pushes up; -> jump crouches, launches, hovers kicking; landing
//        squashes). o.take scales every take. Spread the result: saba(x, y, s, { ...famAct('saba', t, keys), flip: true }).
//   FAM_MOODS = { saba: [...], noa: [...] }, FAM_GESTURES = [...]  (names, for sheets)
//
// SET
//   livingRoom(t, o)   paints the WHOLE frame (1920x1080 world): warm lamp side vs the cool snowy window (Toronto skyline,
//                      CN Tower, falling snow), Tel Aviv beach picture, hamsa, Maccabi pennant, rug, side table (Bamba bag,
//                      teapot, tea glass), teal armchair, leather pouf, bin, TV cabinet with the old box on its shelf.
//     o.tv       options for the TV (see tvSet; e.g. { screen: 'freeze', pct: 37 }), or false: the scene draws it
//     o.chair    false: skip the armchair (draw it yourself around Saba with armchair())
//     o.shelfEmpty  the old box is gone (a clean rectangle in the dust remains)   o.box  options for the box on the shelf
//     o.lamp 0..1 (default 1)  o.snow 0..1 (default 1)  o.tvLight 0..1 (TV glow on the wall, default 1)
//     o.gold 0..1 (gold light pouring out of the TV, passed to tvSet)   o.bin false hides the bin
//     o.table false hides the side-table props (Bamba, teapot) e.g. when the backgammon board is on it
//   FAM_ROOM: layout, so scenes can place things: chair [x,y,s], saba [x,y,s] (sitting in the chair), noa [x,y,s]
//     (standing spot), pouf [x,y,s] (Noa sitting), table [x,y] (tabletop centre), tv [x,y,w,h], box [x,y,s] (on shelf),
//     bin [x,y], window [x,y,w,h], cabinet [x,y,w,h]
//   armchair(x, y, s, layer)  teal wing-back armchair. Same (x, y, s) as a sitting saba(). layer 'back' (default: all of
//                      it; paint it BEFORE Saba) | 'front' (the armrest fronts, paint AFTER Saba for depth).
//   tvSet(x, y, w, h, t, o)   smart TV, (x, y) = top-left of the bezel, w x h outer size (16:9-ish). Draws its own stand.
//     o.screen   'live' | 'freeze' | 'error' | 'app' | 'goal' | 'smooth' | 'off'
//     o.bug      'old' (grey "הספק הישן") | 'gotv' | null  (default: 'old' for live/freeze/error, 'gotv' for app/goal/smooth)
//     o.score    [maccabi, hapoel] (default [1,1]; 'goal'/'smooth' default [2,1]); scoreboard reads
//                [מכבי][n] [n][הפועל], each number beside its own team.  o.clock '89:14'
//     o.play     match time for the footage (default t); 'freeze' holds o.freezeAt (default 19.3)
//     o.spinner  true/false (freeze spinner, default true), o.pct number shows "NN%" under it (e.g. 99 -> 100)
//     o.p        0..1 progress for 'app' (logo pops, tiles slide in) and 'goal' (net bulge / celebration)
//     o.gold     0..1 gold light pouring out of the screen (37.0)   o.glow 0..1 halo on the wall (default 1)
//     o.noStand  true when the TV hangs / you draw the stand
//   Text on TV / phone / box is lettering (letter()): position those props with their x, y, s arguments (the camera is
//   fine), never inside your own push()/translate(); each of them calls flushLetters() so later paint covers the text.
//
// PROPS
//   backgammon(x, y, s, o)  (x, y) = bottom centre.
//     o.mode  'case' (closed wooden case, 240x150 at s=1, inlay star, brass handle + latches; carried face-on) |
//             'table' (the same case lying on a table, 150x240; o.open 0..1 flips the lid over the hinge into the board) |
//             'board' (open board 320x240: 24 points, bar, 30 checkers in the starting position)
//     o.dice 0..1 dice roll (tumble in on an arc from o.diceFrom [dx,dy] px, bounce, land on o.diceVals, default [6,6])
//     o.hop 0..1 a checker hops from point o.hopFrom to o.hopTo (1..24; default 13 -> 7); o.hop2 / o.hop2From / o.hop2To
//   phoneChat(x, y, s, t, o)  WhatsApp-style chat on a phone, (x, y) = phone centre, s = 1: phone 500x980 px.
//     RTL layout: green header "GOTV · נציג שירות" (avatar, back arrow at the right, status מחובר/ת / מקליד/ה...),
//     sent bubbles on the left (light green, time + ticks that turn blue), received on the right (cream), typing dots.
//     Default script uses global t: Noa types 31.5-32.4, sends 32.4, read 33.1, rep types 33.4-34.2, reply 34.2
//     "בכיף! המנוי מופעל" + a painted green check box. Override: o.msgs [{ me: true, text, at, time }], o.typing
//     [t0, t1], o.readAt, o.draft [text, t0, t1] (typed into the input field), o.hand (Noa's thumb/hand, default true).
//   oldBox(x, y, s, o)  grey set-top box labelled IPTV, (x, y) = bottom centre, 230x80 at s=1.
//     o.rot, o.led ('red' | 'green' | 'off'), o.cables 0..1 (spaghetti amount, default 1), o.to [x, y] world point the
//     cables run to (default down-right), o.yank 0..1 (cables pulled taut then snap loose), o.loose (plugs dangle),
//     o.dust (cobweb), o.shake (px jitter)
//
// Model sheet: LOOPS.kit_family (render with --loop=kit_family --sheet=...). Pages of 4 s each, see the bottom.
// ======================================================================================================================
(() => {
  // ---------------------------------------------------------------- palette
  const C = {
    skin: '#C98A5E', skinDk: '#A0663F', cheek: '#E07A66',
    hair: '#F6F1E7', hairSh: '#C9C6D4',
    cardi: '#8E5B3B', cardiDk: '#6A3F27', cardiLt: '#B27D56', btn: '#4E2E1C',
    shirt: '#FBF3E3', trou: '#8C8D9C', trouDk: '#6D6E7E', sock: '#F3EEE4', sandal: '#7B4A2A', sandalLt: '#A0673F',
    rim: '#2B2233', lens: '#D5E6EF',
    scY: '#F4C21F', scB: '#2A55A8',
    nSkin: '#DDA77C', nSkinDk: '#B97F57', nHair: '#4A2C21', nHairLt: '#6F4633', scrunch: '#F4C21F',
    hood: '#43AEA4', hoodDk: '#2E857F', hoodLt: '#82CEC5', jeans: '#4D6DA6', jeansDk: '#3A5588', nSock: '#F4B2C3',
    mouth: '#5B2231', tongue: '#E4788F',
    chair: '#1E7470', chairDk: '#145452', chairLt: '#3F9C96',
    wood: '#8C5634', woodDk: '#633A21', woodLt: '#B57E50',
    navy: '#152057', mac: '#F4C21F', macB: '#1E3F96', hap: '#D6453A',
  };

  // ---------------------------------------------------------------- small helpers
  const L2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const R2 = (p, c, a) => { const s = Math.sin(a), k = Math.cos(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * k - dy * s, c[1] + dx * s + dy * k]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = v => Math.hypot(v[0], v[1]);
  // bumpy ellipse: clouds, curls, tufts, fuzzy socks. lobes = number of bumps, amp = bump size (fraction)
  function blob(cx, cy, rx, ry, n = 20, amp = .15, lobes = 6, ph = 0, rot = 0, j = 0) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, r = 1 + amp * (Math.pow(Math.abs(Math.sin(a * lobes / 2 + ph)), .6) - .5);
      const px = Math.cos(a) * rx * r, py = Math.sin(a) * ry * r;
      p.push([cx + px * Math.cos(rot) - py * Math.sin(rot) + jit(j), cy + px * Math.sin(rot) + py * Math.cos(rot) + jit(j)]);
    }
    return p;
  }
  // a bushy strip along a path (Saba's eyebrows, moustache hair): width w0 -> w1, bumps on the top edge
  function bushy(P, w0, w1, amp = .3, nb = 7, ph = 0) {
    const Cv = through(P, 5), n = Cv.length, top = [], bot = [];
    for (let i = 0; i < n; i++) {
      const a = Cv[Math.max(0, i - 1)], b = Cv[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const u = i / (n - 1), w = lerp(w0, w1, u) / 2 * Math.sin(Math.PI * clamp(u * 1.08 + .04, 0, 1)) ** .35;
      const bump = 1 + amp * Math.abs(Math.sin(u * nb * Math.PI + ph));
      top.push([Cv[i][0] + dy / d * w * bump, Cv[i][1] - dx / d * w * bump]);
      bot.push([Cv[i][0] - dy / d * w * .8, Cv[i][1] + dx / d * w * .8]);
    }
    return top.concat(bot.reverse());
  }
  const W8 = (v, d) => (v == null ? d : v);
  let MCTX = null;
  const mctx = () => MCTX || (MCTX = document.createElement('canvas').getContext('2d'));
  function wrapText(txt, font, maxW) {
    const c = mctx(); c.font = font; c.direction = 'rtl';
    const words = txt.split(' '), lines = []; let cur = '';
    for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; }
    if (cur) lines.push(cur);
    return { lines, w: Math.max(...lines.map(l => c.measureText(l).width)) };
  }
  const textW = (txt, font) => { const c = mctx(); c.font = font; return c.measureText(txt).width; };
  const heb = (txt, x, y, px, col, o = {}) => letter(txt, x, y, px, col, { font: `${o.w || 700} ${px}px Rubik`, ink: false, align: o.align || 'center', rot: o.rot, alpha: o.alpha, stroke: o.stroke, pop: o.pop });

  // ================================================================ MOODS
  // Face numbers: bi/bo = brow inner/outer lift (-1..1; inner down = angry, inner up = worried), by = both brows up,
  // ba = asymmetry (+ raises the brow on the facing side), eyes = eye kind, eo = eye opening, mw/mc/mh = mouth width,
  // curve (-1 frown .. 1 smile), open; mt = teeth; ms = skew (smirk); bl = blush; pale / flush = skin colour.
  // body(t) = the mood's own idle motion: bob (px, - = up), lean (rad), tilt (head), shake (px), sq, wig (hand jiggle).
  const bt = t => _b(t);
  const breath = (t, a = 2) => -a * Math.sin(t * TAU * .28);
  const SABA_MOODS = {
    neutral:   { eyes: 'dot', eo: 1, mw: 1, mc: .2, take: .3, body: t => ({ bob: breath(t), tilt: .025 * Math.sin(t * .9) }) },
    eager:     { bi: .35, bo: .1, by: .5, eyes: 'dot', eo: 1.12, mw: 1.1, mc: .7, mh: .1, take: .6, body: t => { const b = bt(t); return { lean: .08 + .02 * Math.sin(t * 2.2), bob: -5 * b.ab, tilt: .04, wig: 3 }; } },
    dismiss:   { bi: .1, bo: -.25, by: .1, eyes: 'narrow', eo: 1, mw: .85, mc: -.15, mh: .05, take: .4, body: t => ({ lean: .06, tilt: -.06 + .02 * Math.sin(t * 3), bob: breath(t) }) },
    tense:     { bi: -.5, bo: .3, by: -.1, eyes: 'dot', eo: .85, mw: 1.15, mc: -.25, mh: .22, mt: 1, emote: 'sweat', take: .5, body: t => ({ lean: .1, shake: 1.6 * Math.sin(t * TAU * 9), sq: .03, wig: 2 }) },
    horror:    { bi: 1, bo: -.35, by: .9, eyes: 'wide', eo: 1.3, mw: .72, mc: -.6, mh: .9, pale: .6, emote: '!!', take: 1.3, body: t => ({ lean: -.09, shake: 2.4 * Math.sin(t * TAU * 11), sq: -.04, tilt: -.04 }) },
    angry:     { bi: -1, bo: .4, by: -.2, eyes: 'angry', eo: .95, mw: 1.3, mc: -.75, mh: .35, mt: .85, flush: .6, emote: 'steam', take: 1, body: t => { const b = bt(t); return { shake: 3 * Math.sin(t * TAU * 14), sq: .07 * b.hit, lean: .07, bob: -7 * Math.sin(b.f * Math.PI) * (1 - b.f), wig: 5 }; } },
    joy:       { bi: .6, bo: .5, by: .8, eyes: 'happy', mw: 1.5, mc: 1, mh: .65, bl: .7, emote: 'spark', take: 1.2, body: t => { const b = bt(t); return { bob: -16 * b.ab, sq: .07 * b.hit, tilt: .06 * b.s1, wig: 6 }; } },
    laugh:     { bi: .45, bo: .3, by: .5, eyes: 'squeeze', mw: 1.35, mc: 1, mh: .72, bl: .75, take: .8, body: t => { const c = Math.abs(Math.sin(t * TAU * 5)); return { bob: -5 * c, tilt: -.08 + .03 * Math.sin(t * TAU * 5), lean: -.05, sq: .03 * c }; } },
    love:      { bi: .5, bo: .1, by: .4, eyes: 'closed', mw: 1.1, mc: .9, mh: .12, bl: .95, emote: 'heart', take: .7, body: t => { const b = bt(t); return { tilt: .09 * Math.sin(b.bp * Math.PI / 2), bob: -3 * b.ab }; } },
    surprised: { bi: .8, bo: .8, by: 1, eyes: 'wide', eo: 1.2, mw: .7, mc: 0, mh: .6, emote: '!', fade: true, take: 1.2, body: t => ({ lean: -.06, sq: -.06, bob: breath(t) }) },
    sad:       { bi: .9, bo: -.5, by: .1, eyes: 'dot', eo: .8, mw: .9, mc: -.7, take: .3, body: t => ({ lean: .08, tilt: .07, sq: .05, bob: 3 }) },
    sly:       { bi: -.25, bo: .3, ba: .7, eyes: 'narrow', eo: 1, mw: 1.05, mc: .65, ms: .6, mh: .05, take: .45, body: t => ({ tilt: .05 * Math.sin(t * 2), lean: .03, bob: breath(t) }) },
  };
  const NOA_MOODS = {
    neutral:   { eyes: 'dot', eo: 1, mw: .9, mc: .3, take: .3, body: t => ({ bob: breath(t, 1.5), tilt: .03 * Math.sin(t * 1.1) }) },
    hopeful:   { bi: .6, bo: .2, by: .45, eyes: 'spark', eo: 1.12, mw: 1, mc: .85, mh: .18, bl: .45, take: .6, body: t => { const b = bt(t); return { bob: -6 * b.ab, tilt: .08 * Math.sin(b.bp * Math.PI / 2), lean: .05 }; } },
    sad:       { bi: .95, bo: -.3, by: .1, eyes: 'dot', eo: .9, mw: .6, mc: -.6, take: .35, body: t => ({ lean: .06, tilt: .1, sq: .04, bob: 2 }) },
    amused:    { bi: -.1, bo: .2, ba: .8, eyes: 'narrow', eo: 1, mw: 1, mc: .75, ms: .55, mh: .04, take: .45, body: t => ({ tilt: -.07 + .02 * Math.sin(t * 2), bob: breath(t, 1.5) }) },
    focused:   { bi: -.35, bo: .1, eyes: 'dot', eo: .9, mw: .55, mc: .1, mh: 0, take: .3, body: t => ({ tilt: .12, lean: .06, bob: breath(t, 1) }) },
    determined:{ bi: -.8, bo: .35, eyes: 'angry', eo: 1, mw: 1.15, mc: .75, mh: .3, mt: .9, take: .8, body: t => ({ lean: .1, sq: .03, wig: 2, bob: breath(t) }) },
    joy:       { bi: .6, bo: .5, by: .7, eyes: 'happy', mw: 1.4, mc: 1, mh: .7, bl: .7, emote: 'spark', take: 1.1, body: t => { const b = bt(t); return { bob: -14 * b.ab, sq: .08 * b.hit, tilt: .07 * b.s1, wig: 6 }; } },
    proud:     { bi: .2, bo: .3, by: .35, eyes: 'closed', mw: 1.05, mc: .95, mh: .1, bl: .5, emote: 'spark', take: .6, body: t => ({ tilt: -.1, lean: -.05, bob: breath(t) }) },
    laugh:     { bi: .45, bo: .3, by: .5, eyes: 'squeeze', mw: 1.3, mc: 1, mh: .75, bl: .8, take: .8, body: t => { const c = Math.abs(Math.sin(t * TAU * 5.5)); return { bob: -4 * c, tilt: .08 + .03 * Math.sin(t * TAU * 5.5), sq: .04 * c }; } },
    surprised: { bi: .8, bo: .8, by: 1, eyes: 'wide', eo: 1.2, mw: .65, mc: 0, mh: .6, emote: '!', fade: true, take: 1.1, body: t => ({ sq: -.06, lean: -.05 }) },
    cheeky:    { bi: .3, bo: .5, ba: -.6, eyes: 'wink', mw: 1.1, mc: .9, mh: .25, bl: .5, take: .6, body: t => { const b = bt(t); return { tilt: .1 * b.s1, bob: -5 * b.ab }; } },
  };
  const FF = ['bi', 'bo', 'by', 'ba', 'eo', 'mw', 'mc', 'mh', 'mt', 'ms', 'bl', 'pale', 'flush'];
  const faceNums = M => { const f = {}; for (const k of FF) f[k] = M[k] ?? (k === 'eo' || k === 'mw' ? 1 : 0); f.eyes = M.eyes || 'dot'; f.squint = 0; return f; };
  const lerpFace = (a, b, k) => { const f = { ...b }; for (const n of FF) f[n] = lerp(a[n], b[n], k); return f; };

  // ================================================================ POSES
  const POSES = { stand: { rise: 1, crouch: 0, air: 0, lean: 0 }, sit: { rise: 0, crouch: 0, air: 0, lean: 0 },
    rise: { rise: .45, crouch: 0, air: 0, lean: .3 }, jump: { rise: 1, crouch: 0, air: 1, lean: -.05 }, crouch: { rise: 1, crouch: 1, air: 0, lean: .12 } };
  const poseOf = n => ({ ...(POSES[n] || POSES.stand) });

  // ================================================================ GESTURES
  // Each returns [x, y, handShape] for the hand on side sd (+1 = the facing side, "R"), in the upright body frame
  // relative to the hip point. G: sx/shY shoulders, headY/hr head, chestY, A (arm reach), rise, k (the gesture's gk).
  const GEST = {
    idle: (G, sd) => { const st = [sd * (G.sx + G.A * .1), G.shY + G.A * .9], si = [sd * G.sx * .6, -G.hr * .1]; return [...L2(si, st, G.rise), 'open']; },
    grip: (G, sd) => [sd * (G.sx + G.A * .4), G.gripY, 'fist'],
    point: (G, sd, t) => sd > 0 ? [G.sx + G.A * .9, G.shY - G.A * .3 + 3 * Math.sin(t * TAU * 1.5), 'point'] : [-G.sx * .8, -G.hr * .15, 'fist'],
    armsUp: (G, sd, t) => [sd * (G.sx + G.A * (sd > 0 ? .3 : .42)), G.shY - G.A * (sd > 0 ? .93 : .8) + G.A * .06 * Math.sin(t * TAU * 4 + sd), 'open'],
    cheer: (G, sd, t) => { const p = Math.abs(Math.sin(t * TAU * 2.2 + (sd > 0 ? 0 : 1.3))); return sd > 0 ? [G.sx + G.A * .12, G.shY - G.A * (.8 + .17 * p), 'fist'] : [-G.sx - G.A * .5, G.shY - G.A * (.35 + .2 * p), 'fist']; },
    headHands: (G, sd) => [sd * G.hr * 1.02, G.headY + G.hr * (sd > 0 ? -.05 : .08), 'open'],
    fists: (G, sd, t) => { const s = 5 * Math.sin(t * TAU * 7 + sd); return [sd * G.sx * (sd > 0 ? .7 : .55), G.shY + G.A * (sd > 0 ? .2 : .28) + s, 'fist']; },
    reach: (G, sd) => sd > 0 ? [G.sx + G.A * .95, G.shY + G.A * .1, 'open'] : [G.sx * .3 + G.A * .7, G.shY + G.A * .25, 'open'],
    waveOff: (G, sd, t) => sd > 0 ? [G.sx + G.A * .62, G.shY - G.A * .22 + G.A * .07 * Math.sin(t * TAU * 3.2), 'open'] : GEST.grip(G, sd),
    shrug: (G, sd) => [sd * (G.sx + G.A * .55), G.shY + G.A * .45, 'open'],
    hug: (G, sd) => sd > 0 ? [-G.sx * .35, G.chestY + G.A * .05, 'open'] : [G.sx * .35, G.chestY + G.A * .2, 'open'],
    throw: (G, sd, t, k) => sd > 0 ? [...L2([-G.sx * .2, G.headY - G.hr * 1.1], [G.sx + G.A * .9, G.shY - G.A * .55], easeIn(k)), 'open'] : [G.sx * .5 + G.A * .35, G.shY + G.A * .3, 'fist'],
    clap: (G, sd, t) => { const g = Math.abs(Math.sin(t * TAU * 2.5)) * G.A * .14; return [G.sx * .15 + sd * (G.A * .06 + g), G.chestY - G.A * .05, 'open']; },
    case: (G, sd, t, k) => [sd * G.A * .08, lerp(G.shY + G.A * .82, G.chestY - G.A * .15, k), 'fist'],
    phone: (G, sd) => sd > 0 ? [G.sx * .4, G.chestY + G.A * .02, 'fist'] : [G.sx * .05, G.chestY + G.A * .12, 'open'],
    box: (G, sd, t, k) => [sd * G.boxW * .5, lerp(G.chestY + G.A * .12, G.headY - G.hr * 1.5, k), 'open'],
    mug: (G, sd) => sd > 0 ? [G.sx * .75, G.chestY + G.A * .1, 'fist'] : GEST.idle(G, sd),
    remote: (G, sd) => sd > 0 ? [G.sx + G.A * .8, G.shY + G.A * .12, 'fist'] : GEST.idle(G, sd),
    present: (G, sd) => sd > 0 ? [G.sx + G.A * .85, G.shY + G.A * .02, 'open'] : [G.sx * .2, G.chestY + G.A * .3, 'open'],
  };
  const HOLDS = { case: 'case', phone: 'phone', box: 'box', mug: 'mug', remote: 'remote' };

  // ================================================================ ACTING: famAct
  function famAct(who, t, keys, o = {}) {
    const M = who === 'noa' ? NOA_MOODS : SABA_MOODS;
    const st = []; let acc = { pose: 'stand', gesture: 'idle', look: [0, 0], turn: 0, gk: 0 };
    for (const k of keys) { acc = { ...acc, ...(k[2] || {}), mood: k[1] }; st.push(acc); }
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const tc = keys[i][0], age = t - tc, cur = st[i], prev = i ? st[i - 1] : null, tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity;
    const nxt = i + 1 < keys.length ? st[i + 1] : null;
    const Mc = M[cur.mood] || M.neutral, Mp = prev ? M[prev.mood] || M.neutral : null;
    const moodCh = prev && prev.mood !== cur.mood, nextCh = nxt && nxt.mood !== cur.mood;
    // face: glides from the previous mood with overshoot; the eye kind swaps under the squint
    let face = faceNums(Mc);
    if (moodCh && age < .5) face = lerpFace(faceNums(Mp), face, backOut(seg(age, .04, .42)));
    if (moodCh && age < .05) face.eyes = Mp.eyes || 'dot';
    let squint = 0;
    if (nextCh && tn - t < .1) squint = 1 - (tn - t) / .1;
    if (moodCh && age < .14) squint = Math.max(squint, 1 - age / .14);
    face.squint = squint;
    // idle body, blended
    const bb = Mc.body ? Mc.body(t) : {}, bp = Mp && Mp.body ? Mp.body(t) : {}, kb = moodCh ? backOut(seg(age, 0, .4)) : 1;
    const B = {}; for (const f of ['bob', 'lean', 'tilt', 'shake', 'sq', 'wig']) B[f] = lerp(bp[f] || 0, bb[f] || 0, kb);
    // takes (this key's, plus the anticipation squash of the next change)
    const ts = o.take ?? 1, t1 = moodCh ? take(t, tc, (Mc.take ?? .5) * ts) : { sq: 0, dy: 0 };
    const t2 = nextCh ? take(t, tn, ((M[nxt.mood] || M.neutral).take ?? .5) * ts) : { sq: 0, dy: 0 };
    // pose
    const P1 = poseOf(cur.pose); let P = P1, pSq = 0, pDy = 0;
    if (prev && prev.pose !== cur.pose) {
      const P0 = poseOf(prev.pose);
      if (cur.pose === 'jump') {   // crouch, launch, hover
        const c = seg(age, 0, .14), up = seg(age, .14, .42);
        P = { ...P1, rise: P0.rise, air: backOut(up), crouch: .5 * Math.sin(Math.PI * c) * (1 - up) };
        pSq = .16 * Math.sin(Math.PI * c) * (1 - up) - .14 * Math.sin(Math.PI * up);
      } else if (prev.pose === 'jump') {   // fall and land
        const k = seg(age, 0, .22); P = { ...P1, air: 1 - easeIn(k) };
        if (age > .22) { const a = age - .22; pSq = .25 * Math.exp(-8 * a) * Math.cos(18 * a); }
      } else {
        const dur = Math.abs(P1.rise - P0.rise) > .3 ? .7 : .4, k = ease(seg(age, .04, dur));
        P = {}; for (const f in P1) P[f] = lerp(P0[f], P1[f], k);
        if (Math.abs(P1.rise - P0.rise) > .3) { P.lean += .32 * Math.sin(Math.PI * seg(age, 0, dur)); pSq = .06 * Math.sin(Math.PI * seg(age, 0, .2)) * (P1.rise > P0.rise ? 1 : 0); }
      }
    }
    if (cur.pose === 'jump' && !(prev && prev.pose !== 'jump' && age < .42)) P.air = 1 + .08 * Math.sin(t * TAU * 2.3);
    // gestures: arms follow the eyes by ~60 ms and overshoot into place
    const gCh = prev && prev.gesture !== cur.gesture, gk = gCh ? backOut(seg(age - .06, 0, .36)) : 1;
    const lk = prev ? ease(seg(age, 0, .22)) : 1, look = prev ? L2(toV(prev.look), toV(cur.look), lk) : toV(cur.look);
    const turn = prev ? lerp(prev.turn || 0, cur.turn || 0, ease(seg(age, 0, .3))) : cur.turn || 0;
    const gkv = prev && prev.gesture === cur.gesture && prev.gk !== cur.gk ? lerp(prev.gk || 0, cur.gk || 0, ease(seg(age, 0, .3))) : cur.gk || 0;
    // emote
    const em = cur.emote !== undefined ? cur.emote : Mc.emote, emPrev = prev ? (prev.emote !== undefined ? prev.emote : Mp.emote) : null;
    const emoteK = em && em === emPrev && !moodCh ? 1 : seg(age, .06, .32) * (Mc.fade && cur.emote === undefined ? 1 - seg(age, 1.4, 1.8) : 1);
    const out = { ...cur };
    delete out.pose; delete out.mood;
    return { ...out, mood: cur.mood, face, rise: P.rise, crouch: P.crouch, air: P.air, lean: (P.lean || 0) + B.lean + (cur.lean || 0),
      bob: B.bob, tilt: B.tilt + (cur.tilt || 0), shake: B.shake, wig: B.wig, sq: B.sq + t1.sq + t2.sq + pSq, dy: (t1.dy + t2.dy) * 18 + pDy,
      gesture: cur.gesture, gestureFrom: prev ? prev.gesture : cur.gesture, gestureK: gk, gk: gkv, look, turn,
      emote: em, emoteK, emoteAge: age, hold: cur.hold };
  }
  const toV = l => Array.isArray(l) ? l : [l || 0, 0];

  // resolve plain options (mood / pose / gesture names) into the numbers the drawing uses; famAct output passes through
  function resolve(S, o, t) {
    const M = S.moods[o.mood] || S.moods.neutral;
    const R = {};
    R.face = o.face || faceNums(M);
    const bd = o.face ? {} : (M.body ? M.body(t) : {});
    const P = poseOf(o.pose || S.pose);
    R.rise = W8(o.rise, P.rise); R.crouch = W8(o.crouch, P.crouch); R.air = W8(o.air, P.air);
    if (o.pose === 'jump' && o.air == null) R.air = 1 + .08 * Math.sin(t * TAU * 2.3);
    R.lean = W8(o.lean, (P.lean || 0) + (bd.lean || 0));
    R.bob = W8(o.bob, bd.bob || 0); R.tilt = W8(o.tilt, bd.tilt || 0); R.shake = W8(o.shake, bd.shake || 0); R.wig = W8(o.wig, bd.wig || 0);
    R.sq = W8(o.sq, bd.sq || 0); R.dy = o.dy || 0;
    R.gesture = o.gesture || (R.rise < .5 ? 'idle' : 'idle'); R.gestureFrom = o.gestureFrom || R.gesture; R.gestureK = W8(o.gestureK, 1); R.gk = o.gk || 0;
    R.look = toV(o.look); R.turn = o.turn || 0;
    R.emote = o.emote !== undefined ? o.emote : (o.face ? null : M.emote); R.emoteK = W8(o.emoteK, 1); R.emoteAge = W8(o.emoteAge, t);
    R.talk = o.talk != null ? o.talk : (typeof mouthOf === 'function' ? clamp(mouthOf(S.speaker, t) * 1.25) : 0);
    R.hold = o.hold !== undefined ? o.hold : (HOLDS[R.gestureK > .5 ? R.gesture : R.gestureFrom] || null);
    return R;
  }

  // ================================================================ FACE PARTS (drawn around the head centre, local px)
  function eyeDraw(kind, x, y, r, open, lk, sd, sw, st = {}) {
    const lx = lk[0] * r * .45, ly = lk[1] * r * .35, ink = PAL.ink;
    const shut = () => inkLine([[x - r * .9, y + r * .15], [x, y + r * .35], [x + r * .9, y + r * .15]], sw * 1.2, ink, 'ink', .5);
    if (kind === 'wink') kind = sd > 0 ? 'happy' : 'dot';
    switch (kind) {
      case 'happy': inkLine([[x - r, y + r * .4], [x, y - r * .6], [x + r, y + r * .4]], sw * 1.35, ink, 'ink', .5); return;
      case 'closed': inkLine([[x - r, y - r * .05], [x, y + r * .45], [x + r, y - r * .05]], sw * 1.25, ink, 'ink', .5); return;
      case 'squeeze': inkLine([[x - sd * r * .9, y - r * .6], [x + sd * r * .6, y], [x - sd * r * .9, y + r * .6]], sw * 1.3, ink, 'ink', .1); return;
    }
    if (open < .2) { shut(); return; }
    if (kind === 'wide') {
      paint(ellPts(x, y, r * 1.2, r * 1.35 * open, 14, r * .03), { wash: PAL.cream, ink, sw: sw * .7 });
      paint(ellPts(x + lx * 1.2, y + ly * 1.2, r * .42, r * .46, 10), { wash: ink, ink: null });
      paint(ellPts(x + lx * 1.2 - r * .14, y + ly * 1.2 - r * .16, r * .13, r * .13, 6), { wash: PAL.cream, ink: null });
      return;
    }
    if (kind === 'angry') {
      const hi = -r * 1.05 * open, lo = -r * .15 * open;
      paint([[x - r * .78 + lx, y + (sd < 0 ? hi : lo) + ly], [x + r * .78 + lx, y + (sd < 0 ? lo : hi) + ly], [x + r * .72 + lx, y + r * .6 + ly], [x + lx, y + r * .95 + ly], [x - r * .72 + lx, y + r * .6 + ly]], { wash: ink, ink: null, curv: .3 });
      paint(ellPts(x + lx - r * .2, y + ly + r * .15, r * .16, r * .18, 6), { wash: PAL.cream, ink: null });
      return;
    }
    if (kind === 'narrow') {
      paint([[x - r * .8 + lx, y + ly - r * .05], [x + r * .8 + lx, y + ly - r * .05], [x + r * .6 + lx, y + ly + r * .55 * open], [x + lx, y + ly + r * .72 * open], [x - r * .6 + lx, y + ly + r * .55 * open]], { wash: ink, ink: null, curv: .4 });
      inkLine([[x - r * 1.05, y - r * .12], [x + r * 1.05, y - r * .05]], sw * 1.1, ink, 'ink', 0);
      return;
    }
    // dot / spark
    paint(ellPts(x + lx, y + ly, r * .78, r * open, 14, r * .02), { wash: ink, ink: null });
    paint(ellPts(x + lx - r * .26, y + ly - r * .4 * open, r * .25, r * .28, 8), { wash: PAL.cream, ink: null });
    if (kind === 'spark' || st.hl2) paint(ellPts(x + lx + r * .28, y + ly + r * .38 * open, r * .13, r * .13, 6), { wash: PAL.cream, ink: null });
    if (kind === 'spark') paint(starPts(x + lx + r * .2, y + ly - r * .1, r * .32, .4, 4), { wash: '#FFF6D8', ink: null });
    if (st.lash) inkLine([[x + sd * r * .55, y - r * .78 * open], [x + sd * r * 1.05, y - r * 1.15 * open]], sw * .9, ink, 'ink', 0);
  }

  // parametric mouth: width, curve (smile), open, teeth, skew. m = mouth size. Closed = one ink curve; open = a dark shape.
  function mouthDraw(cx, cy, m, F, talk, sw) {
    const w = m * F.mw * (1 - .1 * talk), c = F.mc, h = m * Math.max(F.mh, talk * .95), sk = F.ms || 0;
    const cor = sd => -c * .36 * m - sk * sd * .28 * m;
    const cy0 = u => lerp(cor(-1), cor(1), (u + 1) / 2);
    if (h < m * .1) {
      const P = []; for (let i = 0; i <= 6; i++) { const u = -1 + i / 3, k = 1 - u * u; P.push([cx + u * w, cy + cy0(u) * u * u + c * .14 * m * k]); }
      inkLine(P, sw * 1.15, PAL.ink, 'ink', .5); return;
    }
    const topC = c * .1 * m - h * .2, botC = topC + h + Math.max(0, c) * .12 * m, top = [], bot = [];
    for (let i = 0; i <= 8; i++) { const u = -1 + i / 4, k = 1 - u * u; top.push([cx + u * w, cy + cy0(u) * u * u + topC * k]); bot.push([cx + u * w * .96, cy + cy0(u) * u * u + botC * k]); }
    paint(top.concat(bot.reverse()), { wash: C.mouth, ink: PAL.ink, sw: sw * .8, curv: .35 });
    if (h > m * .45) paint(ellPts(cx, cy + botC - h * .22, w * .42, h * .2, 12), { wash: C.tongue, ink: null });
    if (F.mt > .05) {
      const band = Math.min(h * .45, m * .35) * F.mt, tb = [];
      for (let i = 0; i <= 8; i++) { const u = -1 + i / 4, k = 1 - u * u; tb.push([cx + u * w * .92, cy + cy0(u) * u * u + topC * k + band * k * .9 + band * .1]); }
      paint(top.map(([a, b]) => [lerp(cx, a, .92), b]).concat(tb.reverse()), { wash: PAL.cream, ink: null });
    }
  }

  // ================================================================ HANDS
  function handDraw(H, ang, r, shape, sd, skin, sw) {
    push(); translate(H[0], H[1]); rotate(ang); if (sd < 0) scale(1, -1);
    if (shape === 'open') {
      const P = [];
      for (let i = 0; i < 22; i++) {
        const a = i / 22 * TAU - Math.PI, fa = Math.abs(a);
        let rr = 1;
        if (fa < 1) rr += .2 * Math.abs(Math.sin(a * 6.3));         // four finger bumps
        if (a < -.9 && a > -2) rr += .45 * Math.sin((a + .9) / -1.1 * Math.PI);   // thumb
        P.push([r * .55 + Math.cos(a) * r * 1.05 * rr, Math.sin(a) * r * .85 * rr]);
      }
      paint(P, { wash: skin, ink: PAL.ink, sw: sw * .75, curv: .3 });
    } else {
      paint(ellPts(r * .45, 0, r * .9, r * .82, 14, r * .02), { wash: skin, ink: PAL.ink, sw: sw * .75 });
      inkLine([[r * .9, -r * .45], [r * 1.05, 0], [r * .9, r * .4]], sw * .5, PAL.ink, 'inkfine', .6);
      if (shape === 'point') paint(ribbon([[r * 1.1, -r * .25], [r * 1.8, -r * .32], [r * 2.35, -r * .3]], r * .5, r * .42), { wash: skin, ink: PAL.ink, sw: sw * .7 });
      else inkLine([[r * .2, -r * .55], [r * .75, -r * .25]], sw * .55, PAL.ink, 'inkfine', .4);
    }
    pop();
  }

  // two-bone arm: shoulder S, target T; the elbow bends outward/down
  function ik(S, T, L1, L2_, sd) {
    let d = sub(T, S), dl = len(d) || 1;
    const maxL = (L1 + L2_) * .995, minL = Math.abs(L1 - L2_) + 1;
    if (dl > maxL) { T = [S[0] + d[0] / dl * maxL, S[1] + d[1] / dl * maxL]; dl = maxL; }
    if (dl < minL) dl = minL;
    const a = (L1 * L1 - L2_ * L2_ + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const ux = d[0] / (len(d) || 1), uy = d[1] / (len(d) || 1), bx = S[0] + ux * a, by = S[1] + uy * a;
    const e1 = [bx - uy * h, by + ux * h], e2 = [bx + uy * h, by - ux * h];
    const sc = E => sd * (E[0] - S[0]) + .6 * (E[1] - S[1]);
    return { E: sc(e1) >= sc(e2) ? e1 : e2, T };
  }

  // ================================================================ PROPS HELD / small props (local coordinates)
  function phoneBack(x, y, r, sw) {
    push(); translate(x, y); rotate(-.15);
    paint(rrPts(-r * .55, -r * 1.05, r * 1.1, r * 2.1, r * .22), { wash: '#34304A', ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(-r * .22, -r * .72, r * .13, r * .13, 8), { wash: '#6E6A86', ink: null });
    pop();
  }
  function teaGlass(x, y, r, sw) {
    paint([[x - r * .55, y - r * 1.5], [x + r * .55, y - r * 1.5], [x + r * .42, y], [x - r * .42, y]], { wash: '#E9C58C', washOp: 230, ink: PAL.ink, sw: sw * .6 });
    paint([[x - r * .5, y - r * 1.05], [x + r * .5, y - r * 1.05], [x + r * .42, y - r * .05], [x - r * .42, y - r * .05]], { wash: '#C0652A', ink: null });
    paint(ellPts(x + r * .2, y - r * 1.55, r * .35, r * .16, 8, 0, -.5), { wash: '#6E9F58', ink: PAL.ink, sw: sw * .4 });
  }
  function remoteProp(x, y, r, sw) {
    push(); translate(x, y); rotate(-.2);
    paint(rrPts(-r * .3, -r * 1.3, r * .6, r * 1.9, r * .2), { wash: '#3A3548', ink: PAL.ink, sw: sw * .6 });
    paint(ellPts(0, -r * .95, r * .13, r * .13, 6), { wash: '#E2476E', ink: null });
    pop();
  }
  function bambaBag(x, y, r, sw) {   // (x, y) = bottom centre; r = half width
    const P = [[x - r * .95, y], [x + r * .95, y], [x + r * 1.05, y - r * 1.6], [x + r * .9, y - r * 1.95], [x + r * .5, y - r * 1.8], [x, y - r * 2], [x - r * .5, y - r * 1.8], [x - r * .9, y - r * 1.95], [x - r * 1.05, y - r * 1.6]];
    paint(P, { wash: '#F2B233', ink: PAL.ink, sw: sw * .7, curv: .2 });
    paint(ellPts(x, y - r * 1.05, r * .62, r * .42, 12, 0, -.1), { wash: '#D8392E', ink: null });
    inkLine([[x - r * .38, y - r * 1.05], [x - r * .1, y - r * 1.2], [x + r * .15, y - r * .95], [x + r * .4, y - r * 1.12]], sw * .6, PAL.cream, 'inkfine', .6);
    inkLine([[x - r * .95, y - r * 1.72], [x + r * .95, y - r * 1.72]], sw * .5, '#C98A2A', 'inkfine', .3);
  }
  const puff = (x, y, r, rot) => paint(ribbon([[x - r, y], [x, y - r * .25], [x + r, y]], r * .75, r * .6).map(p => R2(p, [x, y], rot)), { wash: '#E6B04C', ink: PAL.ink, sw: .6 });

  // ================================================================ SPECS
  const SABA = {
    name: 'saba', speaker: 'SABA', moods: SABA_MOODS, pose: 'stand', skin: C.skin,
    legs: {   // absolute local points, floor y = 0: [hipY, knee x/y, foot x/y]
      stand: { hy: -190, kx: 44, ky: -100, fx: 48, fy: -6 }, sit: { hy: -132, kx: 64, ky: -126, fx: 60, fy: -6 },
      crouch: { hy: -118, kx: 82, ky: -122, fx: 56, fy: -6 }, tuck: { hy: -190, kx: 76, ky: -128, fx: 84, fy: -60 } },
    hipW: 38, jumpH: 110, sx: 80, shY: -172, neckY: -196, headY: -262, hr: 78, chestY: -140, L1: 92, L2: 88, handR: 21,
    gripY: -84, boxW: 150, shadow: 120,
  };
  const NOA = {
    name: 'noa', speaker: 'NOA', moods: NOA_MOODS, pose: 'stand', skin: C.nSkin,
    legs: { stand: { hy: -112, kx: 23, ky: -58, fx: 26, fy: -6 }, sit: { hy: -82, kx: 36, ky: -86, fx: 32, fy: -6 },
      crouch: { hy: -62, kx: 46, ky: -84, fx: 30, fy: -6 }, tuck: { hy: -112, kx: 40, ky: -78, fx: 46, fy: -40 } },
    hipW: 22, jumpH: 90, sx: 54, shY: -104, neckY: -118, headY: -172, hr: 60, chestY: -80, L1: 60, L2: 56, handR: 14,
    gripY: -40, boxW: 120, shadow: 80,
  };

  function legCfg(S, R) {
    const Lg = S.legs, k = (a, b, q) => { const o = {}; for (const f in a) o[f] = lerp(a[f], b[f], q); return o; };
    let c = k(Lg.sit, Lg.stand, clamp(R.rise));
    if (R.crouch > 0) c = k(c, Lg.crouch, clamp(R.crouch));
    if (R.air > 0) c = k(c, Lg.tuck, clamp(R.air));
    return c;
  }

  // ================================================================ THE CHARACTER RIG
  function person(S, x, y, s, o, drawTorso, drawHead, sleeve) {
    const t = o.t ?? T, R = resolve(S, o, t);
    const id = o.boilKey ?? ('n' + (++CLAWD_N)), rs = p => boilSeed(`fam ${S.name} ${id} ${p}`);
    const f = o.flip ? -1 : 1, sq = R.sq, rot = o.rot || 0, layer = o.layer || 'all';
    const sw = clamp(.4 + .6 * s, .5, 1.5) * (o.swMul || 1) / s;
    const LG = legCfg(S, R), lift = -Math.max(0, R.air) * S.jumpH;
    const H = [R.shake, LG.hy + lift + R.bob + R.dy];
    const up = p => R2([H[0] + p[0], H[1] + p[1]], H, R.lean);
    const kx = f * s * (1 + sq * .5), ky = s * (1 - sq), cr = Math.cos(rot), sr = Math.sin(rot);
    const M = p => { const px = p[0] * kx, py = p[1] * ky; return [x + px * cr - py * sr, y + px * sr + py * cr]; };
    const begin = () => { push(); translate(x, y); rotate(rot); scale(kx, ky); };
    const G = { sx: S.sx, shY: S.shY, headY: S.headY, hr: S.hr, chestY: S.chestY, A: S.L1 + S.L2, rise: R.rise, gripY: S.gripY, boxW: S.boxW };
    // hand targets
    const g1 = GEST[R.gesture] || GEST.idle, g0 = GEST[R.gestureFrom] || GEST.idle, gk = clamp(R.gestureK, -.3, 1.3);
    const hands = {};
    for (const sd of [1, -1]) {
      const a = g0(G, sd, t, R.gk), b = g1(G, sd, t, R.gk), p = L2(a, b, gk);
      p[1] += (R.wig || 0) * Math.sin(t * TAU * 6 + sd * 1.3);
      hands[sd] = { T: up(p), shape: gk > .5 ? b[2] : a[2] };
    }
    const shrug = (R.gesture === 'shrug' ? 1 : 0) * gk * 10;
    const shoulders = { 1: up([S.sx, S.shY - shrug]), '-1': up([-S.sx, S.shY - shrug]) };

    // ---- body
    if (layer !== 'arms') {
      rs('shadow');
      const shw = S.shadow * s * (1 - Math.min(.5, Math.max(0, R.air) * .35));
      paint(ellPts(x, y + 2 * s, shw * 1.1, shw * .2, 20), { wash: '#3A2A3A', washOp: 70, ink: null });
      begin();
      rs('legs');
      for (const sd of [-1, 1]) {
        const hip = [H[0] * .3 + sd * S.hipW, LG.hy + lift + R.bob * .6 + R.dy * .6 + 4];
        const knee = [sd * LG.kx, LG.ky + lift + R.bob * .3], foot = [sd * LG.fx + 6, LG.fy + lift];
        S.leg(hip, knee, foot, sd, sw, R, t);
      }
      rs('torso');
      push(); translate(H[0], H[1]); rotate(R.lean); drawTorso(sw, R, t, o); pop();
      rs('head');
      const hc = up([0, S.headY]);
      push(); translate(hc[0], hc[1]); rotate(R.tilt); drawHead(sw, R, t, o); pop();
      pop();
    }
    // ---- held props + arms
    if (layer !== 'body') {
      const hold = R.hold, hR = hands[1].T, hL = hands[-1].T, mid = L2(hR, hL, .5);
      if (hold === 'box') {
        rs('box');
        const bo = { ...(o.boxO || {}), rot: (o.boxO && o.boxO.rot) || 0 };
        const bw = S.boxW / 230 * s;
        oldBox(...M([mid[0], mid[1] + 36]), bw, { cables: .7, ...bo, flip: o.flip });
      }
      begin();
      rs('prop');
      if (hold === 'case') backgammon(mid[0], mid[1] + (S === NOA ? 92 : 110), S === NOA ? .55 : .62, { mode: 'case', sw: sw * .9 });
      if (hold === 'phone') { phoneBack(hR[0] + 4, hR[1] - 18, S.handR * 1.2, sw); }
      if (hold === 'mug') teaGlass(hR[0] + 6, hR[1] - 6, S.handR * .95, sw);
      if (hold === 'remote') remoteProp(hR[0] + 10, hR[1] - 4, S.handR, sw);
      if (hold === 'bamba') bambaBag(hL[0], hL[1] + 40, S.handR * 1.6, sw);
      for (const sd of [-1, 1]) {
        rs('arm' + sd);
        const Sh = shoulders[sd], { E, T: Hn } = ik(Sh, hands[sd].T, S.L1, S.L2, sd);
        const fa = Math.atan2(Hn[1] - E[1], Hn[0] - E[0]), Wr = [Hn[0] - Math.cos(fa) * S.handR * .35, Hn[1] - Math.sin(fa) * S.handR * .35];
        sleeve(Sh, E, Wr, sd, sw);
        const shp = hands[sd].shape;
        handDraw(Hn, fa, S.handR, shp, sd, R.skinNow || S.skin, sw);
      }
      pop();
    }
    rs('emote');
    if (R.emote && layer !== 'arms') {
      const ep = M(up([S.hr * .95, S.headY - S.hr * 1.05])), top = ['steam', 'stars', 'cloud', 'bulb', 'scribble'].includes(R.emote);
      const ep2 = top ? M(up([0, S.headY - S.hr * 1.6])) : ep;
      emote(R.emote, ep2[0], ep2[1], S.hr * .42 * s, R.emoteK, R.emoteAge);
    }
    rs('after');
    return { head: M(up([0, S.headY])), handR: M(hands[1].T), handL: M(hands[-1].T), hip: M(H) };
  }

  // skin colour after pale / flush
  const skinOf = (base, F) => mixCol(mixCol(base, '#EFE4D6', (F.pale || 0) * .55), '#DD5A48', (F.flush || 0) * .4);
  const blinkK = (t, seed) => ((t * .9 + seed * 1.7) % 3.7) < .13 ? 1 : 0;

  // ================================================================ SABA
  SABA.leg = (hip, knee, foot, sd, sw, R) => {
    const ank = [foot[0] - 2, foot[1] - 24];
    paint(ribbon([hip, knee, ank], 62, 48), { wash: C.trou, ink: PAL.ink, sw: sw * .8 });
    inkLine([L2(hip, knee, .3), knee, L2(knee, ank, .8)].map(p => [p[0] + sd * 6, p[1]]), sw * .4, C.trouDk, 'inkfine', .5);
    paint(ribbon([[ank[0], ank[1] - 6], [foot[0], foot[1] - 8]], 40, 38), { wash: C.sock, ink: PAL.ink, sw: sw * .6 });
    const fx = foot[0] + sd * 8 + 6;
    paint(ellPts(fx, foot[1] + 1, 36, 10, 14), { wash: C.sandal, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(fx, foot[1] - 9, 27, 13, 14), { wash: C.sock, ink: PAL.ink, sw: sw * .6 });
    paint(ribbon([[fx - 22, foot[1] - 12], [fx, foot[1] - 17], [fx + 22, foot[1] - 12]], 9, 9), { wash: C.sandalLt, ink: PAL.ink, sw: sw * .5 });
  };
  function sabaTorso(sw, R, t, o) {
    const br = 1 + .012 * Math.sin(t * TAU * .28);
    // cardigan body (an egg), front bands, undershirt
    paint(ellPts(0, -92, 106 * br, 116, 28, 1.2), { wash: C.cardi, ink: PAL.ink, sw });
    paint(ellPts(-58, -70, 38, 80, 16, 1, .15), { wash: C.cardiDk, washOp: 90, ink: null });
    const shirt = [[-22, -202], [22, -202], [34, -150], [42, -84], [36, -26], [0, -8], [-36, -26], [-42, -84], [-34, -150]];
    paint(shirt, { wash: C.shirt, ink: PAL.ink, sw: sw * .5, curv: .5 });
    inkLine([[-22, -58], [0, -52], [22, -58]], sw * .45, '#D8CBB6', 'inkfine', .5);
    for (const sd of [-1, 1]) paint(ribbon([[sd * 22, -202], [sd * 35, -150], [sd * 43, -84], [sd * 37, -26], [sd * 6, -4]], 12, 11), { wash: C.cardiLt, ink: PAL.ink, sw: sw * .5 });
    for (let i = 0; i < 4; i++) paint(ellPts(46 - i * 1.5 + (i === 3 ? -6 : 0), -150 + i * 38, 4.5, 4.5, 8), { wash: C.btn, ink: null });
    for (const sd of [-1, 1]) { paint(rrPts(sd * 72 - 20, -70, 40, 34, 6, .5), { wash: C.cardiLt, washOp: 170, ink: PAL.ink, sw: sw * .5 }); inkLine([[sd * 72 - 18, -62], [sd * 72 + 18, -62]], sw * .4, C.cardiDk, 'inkfine', 0); }
    paint(ribbon([[-78, -8], [-40, 14], [0, 20], [40, 14], [78, -8]], 14, 14), { wash: C.cardiDk, ink: PAL.ink, sw: sw * .5 });
    for (let i = 0; i < 9; i++) { const u = -1 + i / 4; inkLine([[u * 72, 4 + 12 * (1 - u * u) - 12], [u * 72, 12 + 12 * (1 - u * u) - 6]], sw * .35, C.cardi, 'inkfine', 0); }
    // Maccabi scarf: wrap + two hanging ends with blue stripes and fringe
    const sway = (o.scarfWave || 0) * Math.sin(t * TAU * 1.8) * 14 + R.lean * -30 + (R.air || 0) * -12;
    const wrap = [[-72, -188], [-38, -170], [0, -164], [38, -170], [72, -188]];
    paint(ribbon(wrap, 36, 36), { wash: C.scY, ink: PAL.ink, sw: sw * .8 });
    inkLine(wrap.map(p => [p[0], p[1] + 1]), 3.2, C.scB, 'ink', .5);
    const ends = [[[26, -170], [36 + sway * .3, -126], [42 + sway, -78]], [[4, -168], [0 + sway * .2, -130], [-6 + sway * .6, -98]]];
    ends.forEach((E, j) => {
      paint(ribbon(E, 32, 30), { wash: C.scY, ink: PAL.ink, sw: sw * .75 });
      const Cv = through(E, 6);
      for (const u of [.42, .72]) {
        const i = Math.round(u * (Cv.length - 1)), a = Cv[i], b = Cv[Math.min(Cv.length - 1, i + 2)], d = sub(b, a), dl = len(d) || 1, nx = -d[1] / dl * 15, ny = d[0] / dl * 15, tx = d[0] / dl * 4, ty = d[1] / dl * 4;
        paint([[a[0] + nx - tx, a[1] + ny - ty], [a[0] + nx + tx * 2, a[1] + ny + ty * 2], [a[0] - nx + tx * 2, a[1] - ny + ty * 2], [a[0] - nx - tx, a[1] - ny - ty]], { wash: C.scB, ink: null });
      }
      const e = E[2];
      for (let k = -2; k <= 2; k++) inkLine([[e[0] + k * 6, e[1] + 2], [e[0] + k * 6.5 + sway * .1, e[1] + 14]], sw * .6, C.scB, 'inkfine', 0);
    });
  }
  function sabaHead(sw, R, t, o) {
    const F = R.face, tn = clamp(R.turn, -1, 1), tx = tn * 16, cx = v => v * (1 - .14 * Math.abs(tn)) + tx;
    const skin = skinOf(C.skin, F); R.skinNow = skin;
    // ears, head
    for (const sd of [-1, 1]) if (sd * tn < .55) paint(ellPts(sd * 73 - tn * 12, 10, 14, 20, 12, .8), { wash: skin, ink: PAL.ink, sw: sw * .7 });
    const hp = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, lo = Math.max(0, Math.sin(a)); hp.push([Math.cos(a) * 76 * (1 + .08 * lo), Math.sin(a) * (a > 0 && a < Math.PI ? 90 : 80) + jit(.8)]); }
    paint(hp, { wash: skin, ink: PAL.ink, sw });
    paint(ellPts(-26 + tx * .4, -58, 20, 10, 10, .5, -.45), { wash: '#F7DCC0', washOp: 170, ink: null });
    if (F.by + F.bi * .5 > .4) for (const k of [0, 1]) inkLine([[cx(-24), -64 - k * 9], [cx(0), -68 - k * 9], [cx(24), -64 - k * 9]], sw * .45, C.skinDk, 'inkfine', .5);
    for (const sd of [-1, 1]) paint(ellPts(cx(sd * 50), 18, 16, 11, 10), { wash: C.cheek, washOp: 60 + 150 * clamp(F.bl), ink: null });
    // white side tufts
    for (const sd of [-1, 1]) if (sd * tn < .7) paint(blob(sd * 76 - tn * 12, -14, 24, 30, 16, .35, 5, sd, sd * .3, .6), { wash: C.hair, ink: PAL.ink, sw: sw * .55 });
    // glasses: lens tint, eyes, thick rims, glints
    const lk = R.look, sqz = clamp(F.squint + blinkK(t, S_SEED(o)) * (['dot', 'wide', 'spark'].includes(F.eyes) ? 1 : 0)), eo = F.eo * (1 - sqz);
    const lens = sd => rrPts(cx(sd * 32) - 28, -36, 56, 46, 16, .5);
    for (const sd of [-1, 1]) paint(lens(sd), { wash: C.lens, washOp: 210, ink: null });
    for (const sd of [-1, 1]) eyeDraw(F.eyes, cx(sd * 32), -12, 11, eo, lk, sd, sw);
    for (const sd of [-1, 1]) { paint(lens(sd), { ink: C.rim, sw: sw * 1.5 }); inkLine([[cx(sd * 32) - 17, -24], [cx(sd * 32) - 9, -30]], sw * .6, '#FFFFFF', 'inkfine', 0); }
    inkLine([[cx(-5), -18], [cx(0), -21], [cx(5), -18]], sw * 1.2, C.rim, 'ink', .5);
    for (const sd of [-1, 1]) if (sd * tn < .55) inkLine([[cx(sd * 60), -20], [sd * 72 - tn * 12, -12]], sw * 1.1, C.rim, 'ink', 0);
    // nose, mouth, moustache
    const talk = R.talk;
    mouthDraw(cx(0) + tx * .1, 62, 24, F, talk, sw);
    const my = 28 - talk * 5;
    const mu = []; for (let i = 0; i <= 12; i++) { const u = -1 + i / 6; mu.push([cx(u * 50), my - 8 + 6 * u * u - 5 * (1 - u * u)]); }
    for (let i = 12; i >= 0; i--) { const u = -1 + i / 6; mu.push([cx(u * 58), my + 12 + 14 * Math.pow(Math.abs(u), 2.5) + 4 * Math.abs(Math.sin(u * 9.5)) - F.mc * 5 * u * u]); }
    paint(mu, { wash: C.hair, ink: PAL.ink, sw: sw * .7, curv: .3 });
    inkLine([[cx(0), my - 4], [cx(0), my + 12]], sw * .4, C.hairSh, 'inkfine', 0);
    paint(ellPts(cx(0) + tx * .3, 10, 21, 18, 14, .5), { wash: mixCol(skin, C.cheek, .35), ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(cx(0) + tx * .3 - 7, 3, 6, 4, 8), { wash: '#F7DCC0', washOp: 200, ink: null });
    // HUGE bushy brows (over the rims)
    for (const sd of [-1, 1]) {
      const lift = F.by * 12 + sd * F.ba * 10, inn = [cx(sd * 10), -46 - F.bi * 15 - lift], out = [cx(sd * 72), -52 - F.bo * 14 - lift];
      const mid = [cx(sd * 42), -56 - lift - (F.bi + F.bo) * 7 - 3];
      paint(bushy([inn, mid, [out[0] + sd * 8, out[1] + 4]], 22, 28, .45, 5, sd), { wash: C.hair, ink: PAL.ink, sw: sw * .6 });
    }
  }
  const S_SEED = o => o.seed ?? 0;
  const sabaSleeve = (S, E, W, sd, sw) => {
    paint(ribbon([S, E, W], 46, 36), { wash: sd > 0 ? C.cardi : mixCol(C.cardi, C.cardiDk, .3), ink: PAL.ink, sw: sw * .85 });
    const d = sub(W, E), dl = len(d) || 1, c0 = [W[0] - d[0] / dl * 12, W[1] - d[1] / dl * 12];
    paint(ribbon([c0, W], 40, 40), { wash: C.cardiLt, ink: PAL.ink, sw: sw * .6 });
  };
  function saba(x, y, s = 1, o = {}) { return person(SABA, x, y, s, o, sabaTorso, sabaHead, sabaSleeve); }

  // ================================================================ NOA
  NOA.leg = (hip, knee, foot, sd, sw) => {
    const ank = [foot[0] - 1, foot[1] - 14];
    paint(ribbon([hip, knee, ank], 42, 36), { wash: C.jeans, ink: PAL.ink, sw: sw * .8 });
    paint(ribbon([[ank[0], ank[1] - 8], [ank[0], ank[1] + 2]], 40, 40), { wash: mixCol(C.jeans, '#FFFFFF', .25), ink: PAL.ink, sw: sw * .5 });
    paint(blob(foot[0] + sd * 5 + 4, foot[1] - 6, 23, 13, 16, .3, 7, sd), { wash: C.nSock, ink: PAL.ink, sw: sw * .6 });
  };
  function noaTorso(sw, R, t, o) {
    paint(blob(0, -112, 46, 17, 14, .1, 3), { wash: C.hoodDk, ink: PAL.ink, sw: sw * .7 });   // hood behind the neck
    const bd = [[-40, -120], [0, -123], [40, -120], [58, -106], [64, -64], [72, 6], [70, 24], [0, 28], [-70, 24], [-72, 6], [-64, -64], [-58, -106]];
    paint(bd, { wash: C.hood, ink: PAL.ink, sw, curv: .5 });
    paint([[-56, -92], [-62, -40], [-68, 16], [-40, 20], [-48, -40]], { wash: C.hoodDk, washOp: 80, ink: null, curv: .5 });
    paint(ribbon([[-70, 18], [0, 24], [70, 18]], 12, 12), { wash: C.hoodLt, ink: PAL.ink, sw: sw * .5 });
    paint([[-34, -30], [34, -30], [42, 8], [-42, 8]], { wash: C.hoodDk, washOp: 110, ink: PAL.ink, sw: sw * .5, curv: .2 });
    for (const sd of [-1, 1]) { inkLine([[sd * 10, -116], [sd * 12, -96], [sd * 11 + Math.sin(t * 2 + sd) * 2, -80]], sw * .7, PAL.cream, 'ink', .5); paint(ellPts(sd * 11, -78, 3, 4, 6), { wash: PAL.cream, ink: null }); }
    // a little blue flag pin
    paint(rectPts(26, -96, 14, 10), { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
    inkLine([[26, -93], [40, -93]], sw * .5, C.macB, 'inkfine', 0); inkLine([[26, -89], [40, -89]], sw * .5, C.macB, 'inkfine', 0);
  }
  function noaHead(sw, R, t, o) {
    const F = R.face, tn = clamp(R.turn, -1, 1), tx = tn * 13, cx = v => v * (1 - .14 * Math.abs(tn)) + tx;
    const skin = skinOf(C.nSkin, F); R.skinNow = skin;
    // big curly hair: back cloud, top puff with its yellow scrunchie
    paint(blob(-tn * 8, -12, 88, 76, 40, .22, 13, .3), { wash: C.nHair, ink: PAL.ink, sw: sw * .8, curv: .5 });
    const pb = Math.sin(t * TAU * .9) * 2 + (R.air || 0) * 5;
    paint(blob(-tn * 5, -96 - pb, 46, 40, 28, .26, 9, .5), { wash: C.nHair, ink: PAL.ink, sw: sw * .7, curv: .5 });
    for (const [a, b, r] of [[-40, -40, 9], [44, -30, 8], [-16, -104, 8], [-62, 14, 8]]) inkLine(Array.from({ length: 7 }, (_, i) => [a - tn * 6 + Math.cos(i * 1.2) * r * (1 - i * .1), b + Math.sin(i * 1.2) * r * (1 - i * .1)]), sw * .5, C.nHairLt, 'inkfine', .6);
    paint(blob(-tn * 6, -64 - pb * .5, 27, 10, 14, .25, 5), { wash: C.scrunch, ink: PAL.ink, sw: sw * .6 });
    for (const sd of [-1, 1]) if (sd * tn < .55) paint(ellPts(sd * 57 - tn * 10, 8, 10, 13, 10), { wash: skin, ink: PAL.ink, sw: sw * .6 });
    const hp = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, lo = Math.max(0, Math.sin(a)); hp.push([Math.cos(a) * 58 * (1 - .06 * lo), Math.sin(a) * 56 + jit(.6)]); }
    paint(hp, { wash: skin, ink: PAL.ink, sw });
    for (const sd of [-1, 1]) paint(ellPts(cx(sd * 34), 22, 12, 7, 10), { wash: PAL.rose, washOp: 70 + 140 * clamp(F.bl), ink: null });
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) paint(ellPts(cx(sd * (30 + k * 5)), 16 + (k % 2) * 5, 1.8, 1.8, 5), { wash: C.nSkinDk, ink: null });
    // eyes (big, glossy), brows, nose, mouth
    const lk = R.look, sqz = clamp(F.squint + blinkK(t, 1.3 + S_SEED(o)) * (['dot', 'wide', 'spark'].includes(F.eyes) ? 1 : 0)), eo = F.eo * (1 - sqz);
    for (const sd of [-1, 1]) eyeDraw(F.eyes, cx(sd * 22), 2, 12.5, eo, lk, sd, sw, { lash: true, hl2: true });
    for (const sd of [-1, 1]) {
      const lift = F.by * 7 + sd * F.ba * 7;
      paint(ribbon([[cx(sd * 10), -22 - F.bi * 8 - lift], [cx(sd * 22), -27 - lift - (F.bi + F.bo) * 3], [cx(sd * 33), -25 - F.bo * 8 - lift]], 7, 5), { wash: C.nHair, ink: null });
    }
    inkLine([[cx(-4), 14], [cx(0), 18], [cx(4), 15]], sw * .7, C.nSkinDk, 'ink', .5);
    mouthDraw(cx(0), 33, 15, F, R.talk, sw);
    // curly fringe: a row of fat curls along the hairline
    const fr = [];
    for (let i = 0; i <= 7; i++) { const u = -1 + i / 3.5, cxu = u * 50 - tn * 6, cyu = -44 + 12 * u * u; for (let k = 0; k < 5; k++) { const a = Math.PI * (k / 4); fr.push([cxu - Math.cos(a) * 8, cyu + Math.sin(a) * (7 + 3 * hash(i))]); } }
    fr.push([60 - tn * 6, -56], [34, -70], [-34, -70], [-60 - tn * 6, -56]);
    paint(fr, { wash: C.nHair, ink: PAL.ink, sw: sw * .7, curv: .4 });
  }
  const noaSleeve = (S, E, W, sd, sw) => {
    paint(ribbon([S, E, W], 34, 30), { wash: sd > 0 ? C.hood : mixCol(C.hood, C.hoodDk, .35), ink: PAL.ink, sw: sw * .85 });
    const d = sub(W, E), dl = len(d) || 1;
    paint(ribbon([[W[0] - d[0] / dl * 9, W[1] - d[1] / dl * 9], W], 32, 32), { wash: C.hoodLt, ink: PAL.ink, sw: sw * .6 });
  };
  function noa(x, y, s = 1, o = {}) { return person(NOA, x, y, s, o, noaTorso, noaHead, noaSleeve); }

  // ================================================================ ARMCHAIR
  // (x, y) = the floor point under a sitting Saba (between his feet). Seat top ~125 px above y at s = 1.
  function armchair(x, y, s = 1, layer = 'back') {
    const sw = clamp(.55 + .8 * s, .6, 2) / s;
    boilSeed('armchair ' + layer + Math.round(x));
    push(); translate(x, y); scale(s);
    if (layer !== 'front') {
      paint(ellPts(0, -14, 210, 26, 20), { wash: '#3A2A3A', washOp: 60, ink: null });
      for (const sd of [-1, 1]) paint([[sd * 150, -70], [sd * 162, -70], [sd * 156, -14], [sd * 150, -14]], { wash: C.woodDk, ink: PAL.ink, sw: sw * .6 });
      // wing back: the tall back with its two wings
      const back = [[-150, -150], [-165, -330], [-172, -420], [-150, -470], [-100, -492], [0, -500], [100, -492], [150, -470], [172, -420], [165, -330], [150, -150]];
      paint(back, { wash: C.chair, ink: PAL.ink, sw, curv: .5 });
      paint([[-112, -170], [-120, -400], [-80, -455], [0, -466], [80, -455], [120, -400], [112, -170]], { wash: C.chairDk, washOp: 120, ink: PAL.ink, sw: sw * .5, curv: .5 });
      for (const [bx, by] of [[-50, -400], [50, -400], [0, -330], [-60, -270], [60, -270]]) paint(ellPts(bx, by, 5, 5, 6), { wash: C.chairDk, ink: PAL.ink, sw: sw * .3 });
      paint(ellPts(-40, -440, 40, 14, 12, 1, -.1), { wash: C.chairLt, washOp: 90, ink: null });
      // seat cushion + skirt
      paint(rrPts(-150, -150, 300, 90, 20, .8), { wash: C.chair, ink: PAL.ink, sw });
      paint(rrPts(-128, -150, 256, 36, 14, .8), { wash: C.chairLt, ink: PAL.ink, sw: sw * .6 });
      inkLine([[-140, -92], [0, -88], [140, -92]], sw * .5, C.chairDk, 'inkfine', .5);
    }
    // rolled armrests (the fronts are the 'front' layer)
    for (const sd of [-1, 1]) {
      if (layer !== 'front') paint([[sd * 128, -218], [sd * 176, -226], [sd * 180, -70], [sd * 128, -70]], { wash: C.chair, ink: PAL.ink, sw, curv: .2 });
      paint(ellPts(sd * 154, -214, 30, 22, 14, .6), { wash: C.chairLt, ink: PAL.ink, sw: sw * .8 });
      paint(blob(sd * 154, -214, 12, 9, 10, .2, 3, 0, 0, .4), { wash: C.chair, ink: PAL.ink, sw: sw * .4 });
      if (layer === 'front') paint([[sd * 128, -196], [sd * 178, -196], [sd * 180, -70], [sd * 128, -70]], { wash: mixCol(C.chair, C.chairDk, .25), ink: PAL.ink, sw, curv: .2 });
    }
    pop();
    boilSeed('armchair after');
  }

  // ================================================================ OLD BOX (+ cable spaghetti)
  function oldBox(x, y, s = 1, o = {}) {
    const sw = clamp(.55 + .8 * s, .6, 2) / s, rot = o.rot || 0, sh = o.shake || 0;
    const yank = clamp(o.yank || 0), cab = o.cables ?? 1, to = o.to || [x + 260 * s, y + 140 * s];
    boilSeed('oldbox ' + Math.round(x / 50));
    const Mw = (lx, ly) => { const c = Math.cos(rot), sn = Math.sin(rot); return [x + sh * jit(1) + (lx * c - ly * sn) * s, y + (lx * sn + ly * c) * s]; };
    // spaghetti behind the box
    if (cab > 0) {
      const cols = ['#2B2233', '#77788A', '#E6E0D2', '#F2C230', '#D8394E', '#2B2233'];
      const n = Math.max(2, Math.round(6 * cab));
      for (let i = 0; i < n; i++) {
        const A = Mw(-80 + i * 32, -40), end = [to[0] + (hash(i + 3) - .5) * 90 * s, to[1] + (hash(i + 7) - .5) * 50 * s];
        const loops = 1.5 + hash(i) * 1.5, lr = (22 + 14 * hash(i + 1)) * s * (1 - yank * .85) * (o.loose ? 1.2 : 1), ph = hash(i + 2) * TAU + (o.loose ? T * 3 : 0);
        const P = [];
        for (let k = 0; k <= 24; k++) {
          const u = k / 24, b = L2(A, end, u), env = Math.sin(Math.PI * u) ** .7;
          const sag = (1 - yank) * 60 * s * Math.sin(Math.PI * u) * (o.loose ? 1.4 : 1);
          P.push([b[0] + Math.cos(u * loops * TAU + ph) * lr * env, b[1] + sag + Math.sin(u * loops * TAU + ph) * lr * env * .8]);
        }
        if (o.loose) { const e = P[P.length - 1]; P[P.length - 1] = [e[0], e[1] + 20 * s]; }
        inkLine(P, 2.2 * s * (i % 3 === 2 ? .8 : 1), cols[i % cols.length], 'ink', .6);
        const e = P[P.length - 1];
        paint(rectPts(e[0] - 6 * s, e[1] - 4 * s, 12 * s, 9 * s), { wash: i === 3 ? '#E0A92A' : '#3A3548', ink: PAL.ink, sw: .5 });
      }
    }
    push(); translate(x + sh * jit(1), y); rotate(rot); scale(s);
    paint(rrPts(-115, -80, 230, 18, 8, .5), { wash: '#B3B4BE', ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(-115, -64, 230, 60, 9, .6), { wash: '#8E8F9C', ink: PAL.ink, sw });
    for (let i = 0; i < 6; i++) inkLine([[-60 + i * 14, -76], [-54 + i * 14, -68]], sw * .45, '#6B6C79', 'inkfine', 0);
    paint(rrPts(22, -50, 58, 22, 4), { wash: '#2E3040', ink: PAL.ink, sw: sw * .5 });
    const led = o.led || 'red';
    if (led !== 'off') { const lc = led === 'green' ? '#6EDB86' : '#FF5A5A'; paint(ellPts(96, -38, 5, 5, 8), { wash: lc, ink: null }); }
    for (const sd of [-1, 1]) paint(rectPts(sd * 90 - 10, -5, 20, 7), { wash: '#4A4B58', ink: null });
    if (o.dust) { inkLine([[-115, -60], [-98, -76], [-84, -80]], sw * .3, '#E6E0D2', 'inkfine', .6); inkLine([[-112, -70], [-100, -66], [-95, -79]], sw * .3, '#E6E0D2', 'inkfine', .6); }
    pop();
    if (led !== 'off') glow(...Mw(96, -38), 18 * s, led === 'green' ? '#6EDB86' : '#FF5A5A', .6);
    const lp = Mw(-62, -34);
    letter('IPTV', lp[0], lp[1], 26 * s, '#E9E6EE', { font: `800 ${26 * s}px Rubik`, ink: false, rot });
    flushLetters();
    boilSeed('oldbox after');
  }

  // ================================================================ BACKGAMMON
  const PT = [];   // point index 1..24 -> [half(-1 left, 1 right), row(-1 top, 1 bottom), column 0..5 from the bar outward]
  for (let p = 1; p <= 24; p++) {
    if (p <= 6) PT[p] = [1, 1, 6 - p]; else if (p <= 12) PT[p] = [-1, 1, p - 7]; else if (p <= 18) PT[p] = [-1, -1, 18 - p]; else PT[p] = [1, -1, p - 19];
  }
  const START = { 24: [2, 0], 13: [5, 0], 8: [3, 0], 6: [5, 0], 1: [2, 1], 12: [5, 1], 17: [3, 1], 19: [5, 1] };   // [count, colour 0 cream / 1 dark]
  function inlayFace(cx, cy, w, h, sw, handle) {
    paint(rrPts(cx - w / 2, cy - h / 2, w, h, 10, .6), { wash: C.wood, ink: PAL.ink, sw });
    paint(rrPts(cx - w / 2 + 9, cy - h / 2 + 9, w - 18, h - 18, 6, .5), { wash: C.woodDk, washOp: 70, ink: '#E8D6B0', sw: sw * .5 });
    const r = Math.min(w, h) * .26;
    paint(starPts(cx, cy, r, .45, 8, 0), { wash: '#EFE2C4', ink: PAL.ink, sw: sw * .5 });
    paint(starPts(cx, cy, r * .55, .5, 8, Math.PI / 8), { wash: '#B98A55', ink: null });
    paint(ellPts(cx, cy, r * .18, r * .18, 8), { wash: '#F6EEDB', ink: null });
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) paint(starPts(cx + a * (w / 2 - 24), cy + b * (h / 2 - 22), 9, .4, 4, 0), { wash: '#EFE2C4', ink: null });
    if (handle === 'top') {
      paint(ribbon([[cx - 26, cy - h / 2 + 2], [cx - 22, cy - h / 2 - 20], [cx + 22, cy - h / 2 - 20], [cx + 26, cy - h / 2 + 2]], 8, 8), { wash: '#C9A043', ink: PAL.ink, sw: sw * .6 });
      for (const sd of [-1, 1]) paint(rectPts(cx + sd * w * .3 - 7, cy - h / 2 - 3, 14, 11), { wash: '#D8B04E', ink: PAL.ink, sw: sw * .4 });
    }
  }
  function checkerAt(p, i, W2, H2, bw, r) {   // position of the i-th checker on point p
    const [hf, row, col] = PT[p], bar = 12, pw = (W2 - bar) / 12;
    const x = hf * (bar / 2 + pw * (col + .5)), y = row * (H2 / 2 - r - 2 - Math.min(i, 4) * r * 1.9 + (i > 4 ? r * .6 : 0));
    return [x, y];
  }
  function backgammon(x, y, s = 1, o = {}) {
    const sw = o.sw || clamp(.55 + .8 * s, .6, 2) / s, mode = o.mode || 'case', t = o.t ?? T;
    boilSeed('backgammon ' + mode + Math.round(x / 40));
    push(); translate(x, y); scale(s);
    if (mode === 'case') {
      paint(rrPts(-120, -22, 240, 22, 8), { wash: C.woodDk, ink: PAL.ink, sw });
      inlayFace(0, -97, 240, 150, sw, 'top');
      paint([[-120, -26], [120, -26], [120, -16], [-120, -16]], { wash: '#E8D6B0', washOp: 90, ink: null });
    } else if (mode === 'table') {
      const k = clamp(o.open || 0), ang = k * Math.PI, pw = 150 * Math.cos(ang);
      paint(ellPts(0, 4, 170, 16, 16), { wash: '#3A2A3A', washOp: 50, ink: null });
      if (k > .5) halfBoard(-75, -120, 150, 240, sw, -1, o, t);     // base half, board up
      else paint(rrPts(-150, -240, 150, 240, 10), { wash: C.woodDk, ink: PAL.ink, sw });
      if (k <= .5) { if (pw > 4) inlayFace(-pw / 2, -120, Math.max(8, pw), 240, sw, null); }
      else { const w2 = -pw; if (w2 > 4) { push(); translate(w2 / 2, -120); scale(w2 / 150, 1); halfBoard(0, 0, 150, 240, sw, 1, o, t); pop(); } }
      if (k > .02 && k < .98) inkLine([[0, -240], [0, 0]], sw * 1.3, C.woodDk, 'ink', 0);
    } else {   // open board
      board(sw, o, t);
    }
    pop();
    boilSeed('backgammon after');
  }
  function halfBoard(cx, cy, w, h, sw, side, o, t) {
    paint(rrPts(cx - w / 2, cy - h / 2, w, h, 8), { wash: C.wood, ink: PAL.ink, sw });
    paint(rectPts(cx - w / 2 + 10, cy - h / 2 + 10, w - 20, h - 20), { wash: '#EAD4A8', ink: null });
    const pw = (w - 20) / 6;
    for (let i = 0; i < 6; i++) for (const row of [-1, 1]) {
      const px = cx - w / 2 + 10 + pw * i, base = cy + row * (h / 2 - 10), tip = cy + row * (h / 2 - 10 - h * .38);
      paint([[px + 1, base], [px + pw - 1, base], [px + pw / 2, tip]], { wash: (i + (row > 0 ? 1 : 0)) % 2 ? '#B0442F' : '#2E6470', ink: null });
    }
  }
  function board(sw, o, t) {
    const W2 = 320, H2 = 240, r = 11;
    paint(rrPts(-W2 / 2 - 14, -H2 - 14, W2 + 28, H2 + 28, 12), { wash: C.wood, ink: PAL.ink, sw });
    halfBoard(-W2 / 4 - 3, -H2 / 2, W2 / 2 - 6, H2, sw, -1, o, t);
    halfBoard(W2 / 4 + 3, -H2 / 2, W2 / 2 - 6, H2, sw, 1, o, t);
    paint(rectPts(-7, -H2 - 14, 14, H2 + 28), { wash: C.woodDk, ink: PAL.ink, sw: sw * .6 });
    // checkers: count per point, then hops move the top one along an arc
    const cnt = {}; for (let p = 1; p <= 24; p++) cnt[p] = START[p] ? [...START[p]] : [0, 0];
    const hops = [];
    for (const [k, a, b] of [[o.hop, o.hopFrom ?? 13, o.hopTo ?? 7], [o.hop2, o.hop2From ?? 1, o.hop2To ?? 7]]) {
      if (k == null || k <= 0 || !cnt[a][0]) continue;
      const col = cnt[a][1], from = checkerAt(a, cnt[a][0] - 1, W2, H2, 0, r);
      cnt[a][0]--;
      if (!cnt[b][0]) cnt[b][1] = col;
      const to = checkerAt(b, cnt[b][0], W2, H2, 0, r);
      if (k >= 1) { cnt[b][0]++; cnt[b][1] = col; } else hops.push([col, from, to, k]);
    }
    const disc = (p, col, lift = 0) => {
      const cy = p[1] - H2 / 2;
      if (lift > 0) paint(ellPts(p[0], cy + lift * .3, r, r * .5, 10), { wash: '#3A2A3A', washOp: 60, ink: null });
      paint(ellPts(p[0], cy - lift, r, r, 14, .3), { wash: col ? '#5B2C22' : '#F4EAD4', ink: PAL.ink, sw: sw * .55 });
      paint(ellPts(p[0], cy - lift, r * .55, r * .55, 10), { wash: col ? '#733A2C' : '#E6D6B6', ink: null });
    };
    for (let p = 1; p <= 24; p++) for (let i = 0; i < cnt[p][0]; i++) disc(checkerAt(p, i, W2, H2, 0, r), cnt[p][1]);
    for (const [col, a, b, k] of hops) { const e = ease(k), pp = arcPt(a, b, 70, e); disc(pp, col, 18 * Math.sin(Math.PI * e)); }
    // dice
    const dk = o.dice;
    if (dk != null && dk > 0) {
      const vals = o.diceVals || [6, 6], from = o.diceFrom || [-W2 * .9, -H2 * 1.2];
      for (let j = 0; j < 2; j++) {
        const land = [W2 * .18 + j * 46, -H2 / 2 + (j ? 16 : -14)], kk = clamp(dk * 1.08 - j * .08), fl = seg(kk, 0, .7);
        let p = arcPt(from, land, 120, easeOut(fl)), rot = (1 - easeOut(fl)) * 9 + j;
        if (kk > .7) { const b = seg(kk, .7, 1); p = [land[0] + (1 - b) * 10, land[1] - Math.abs(Math.sin(b * Math.PI * 2)) * 14 * (1 - b)]; rot = (1 - b) * .6 + (j ? .12 : -.1); }
        const face = kk > .82 ? vals[j] : 1 + Math.floor(hash(Math.floor(kk * 16) + j * 7) * 6);
        die(p[0], p[1], 17, rot, face, sw);
      }
    }
  }
  function die(x, y, r, rot, v, sw) {
    push(); translate(x, y); rotate(rot);
    paint(rrPts(-r, -r, 2 * r, 2 * r, r * .35), { wash: '#FBF4E6', ink: PAL.ink, sw: sw * .7 });
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
    for (const [a, b] of P) paint(ellPts(a * r * .5, b * r * .5, r * .16, r * .16, 6), { wash: v === 1 ? '#C8342E' : PAL.ink, ink: null });
    pop();
  }

  // ================================================================ TV
  function scoreboard(x, y, q, sc, clock) {
    const h = 26 * q, fnt = n => `700 ${n * q}px Rubik`;
    const seg_ = [['מכבי', 58, C.mac, C.macB], [String(sc[0]), 26, '#FBF6EA', '#1B2146'], [String(sc[1]), 26, '#FBF6EA', '#1B2146'], ['הפועל', 62, C.hap, '#FFF4E6'], [clock, 54, '#1B2146', '#FBF6EA']];
    let cx = x;
    for (const [txt, w, bg, fg] of seg_) {
      paint(rectPts(cx, y, w * q, h, .3), { wash: bg, ink: null });
      heb(txt, cx + w * q / 2, y + h * .54, 17 * q, fg, { w: 700 });
      cx += w * q + (txt === String(sc[0]) ? 3 * q : 0);
    }
    inkLine([[x, y + h], [cx, y + h]], .8, PAL.ink, 'inkfine', 0);
  }
  function footage(sx, sy, w, h, tm, o) {   // broadcast wide view: crowd band, striped pitch, goal, players, ball
    const q = w / 480;
    boilSeed('tv footage');
    paint(rectPts(sx, sy, w, h * .26), { wash: '#2C2740', ink: null });
    for (let i = 0; i < 3; i++) paint(rectPts(sx, sy + h * (.05 + i * .07), w, h * .04), { wash: ['#F4C21F', '#3A55A0', '#E8D9B0'][i], washOp: 110, ink: null });
    paint(rectPts(sx, sy + h * .26, w, h * .74), { wash: '#4E9A4E', ink: null });
    const so = frac(tm * .05) * w / 5; for (let i = -1; i < 5; i++) { const a = Math.max(sx, sx + i * w / 5 + so), b = Math.min(sx + w, sx + i * w / 5 + so + w / 10); if (b - a > 2) paint(rectPts(a, sy + h * .26, b - a, h * .74), { wash: '#5FAE58', ink: null }); }
    inkLine([[sx, sy + h * .3], [sx + w, sy + h * .3]], 1.2, '#F4F1E6', 'inkfine', 0);
    inkLine([[sx + w * .72, sy + h * .3], [sx + w * .66, sy + h], ], 1, '#F4F1E6', 'inkfine', 0);
    inkLine([[sx + w * .66, sy + h * .62], [sx + w * .94, sy + h * .62]], 1, '#F4F1E6', 'inkfine', 0);
    // goal on the right
    paint(rectPts(sx + w * .9, sy + h * .38, w * .07, h * .2), { wash: '#DDE6E0', washOp: 140, ink: '#F6F4EC', sw: 1.2 });
    const ph = tm * .9;
    const P = [[.52, .55, 1], [.6, .45, 0], [.45, .7, 1], [.7, .6, 0], [.35, .48, 1], [.78, .5, 0], [.62, .78, 1], [.25, .66, 1]];
    P.forEach(([px, py, mac], i) => {
      const xx = sx + w * clamp(px + .06 * Math.sin(ph * .7 + i * 1.7) + .05 * Math.sin(tm * .31), .04, .95), yy = sy + h * clamp(py + .05 * Math.sin(ph * .5 + i), .34, .95), u = 5.2 * q;
      const run = Math.sin(tm * 9 + i * 2) * u * .5;
      inkLine([[xx - u * .3, yy], [xx - u * .3 + run, yy + u * 1.1]], 1, PAL.ink, 'inkfine', 0);
      inkLine([[xx + u * .3, yy], [xx + u * .3 - run, yy + u * 1.1]], 1, PAL.ink, 'inkfine', 0);
      paint(rrPts(xx - u * .6, yy - u * 1.3, u * 1.2, u * 1.4, u * .3), { wash: mac ? C.mac : C.hap, ink: PAL.ink, sw: .5 });
      paint(ellPts(xx, yy - u * 1.75, u * .45, u * .45, 8), { wash: '#C98A5E', ink: null });
    });
    const bx = sx + w * clamp(.55 + .12 * Math.sin(tm * 1.3), .05, .95), by = sy + h * (.6 + .06 * Math.sin(tm * 2.1));
    paint(ellPts(bx, by, 3.4 * q, 3.4 * q, 8), { wash: '#FFFFFF', ink: PAL.ink, sw: .5 });
  }
  function gotvMark(cx, cy, px, o = {}) {   // painted GOTV wordmark: yellow letters, blue outline, the O a play-button ring
    const f = `900 ${px}px Rubik`, wG = textW('G', f), wTV = textW('TV', f), r = px * .36, gap = px * .06, tot = wG + wTV + 2 * r + 2 * gap, x0 = cx - tot / 2;
    const pop = o.pop ?? 1, k = backOut(pop);
    if (k <= .02) return;
    heb('G', x0 + wG / 2, cy + px * .02, px * k, C.mac, { w: 900, stroke: C.macB });
    const ox = x0 + wG + gap + r;
    boilSeed('gotv ring');
    paint(ellPts(ox, cy, r * 1.05 * k, r * 1.05 * k, 18), { wash: C.macB, ink: null });
    paint(ellPts(ox, cy, r * .8 * k, r * .8 * k, 18), { wash: C.mac, ink: null });
    paint(ellPts(ox, cy, r * .52 * k, r * .52 * k, 16), { wash: C.macB, ink: null });
    paint([[ox - r * .16 * k, cy - r * .26 * k], [ox + r * .3 * k, cy], [ox - r * .16 * k, cy + r * .26 * k]], { wash: '#FFF4D0', ink: null });
    heb('TV', ox + r + gap + wTV / 2, cy + px * .02, px * k, C.mac, { w: 900, stroke: C.macB });
  }
  function tvSet(x, y, w, h, t, o = {}) {
    const scr = o.screen || 'live', b = w * .035, sx = x + b, sy = y + b, sw_ = w - 2 * b, sh = h - 2 * b, q = sw_ / 480;
    const bug = o.bug !== undefined ? o.bug : (['app', 'goal', 'smooth'].includes(scr) ? 'gotv' : scr === 'off' ? null : 'old');
    const glowC = { live: '#9FD0FF', freeze: '#B8BCD0', error: '#8C9BD8', app: '#FFD36A', goal: '#FFE08A', smooth: '#A8DAFF', off: '#000000' }[scr];
    boilSeed('tv glow');
    if (scr !== 'off' && (o.glow ?? 1) > 0) glow(x + w / 2, y + h / 2, w * .9, glowC, .55 * (o.glow ?? 1));
    boilSeed('tv body');
    if (!o.noStand) { paint(rrPts(x + w * .42, y + h - 4, w * .16, h * .06, 4), { wash: '#2E2A36', ink: PAL.ink, sw: 1 }); paint(ellPts(x + w / 2, y + h * 1.07, w * .2, h * .025, 14), { wash: '#2E2A36', ink: PAL.ink, sw: 1 }); }
    paint(rrPts(x, y, w, h, w * .02, .5), { wash: '#26222E', ink: PAL.ink, sw: 1.4 });
    const tm = o.play ?? t;
    if (scr === 'off') paint(rectPts(sx, sy, sw_, sh), { wash: '#1B1A24', ink: null });
    else if (scr === 'live' || scr === 'smooth') footage(sx, sy, sw_, sh, tm, o);
    else if (scr === 'freeze') {
      const ft = o.freezeAt ?? 19.3;
      footage(sx, sy, sw_, sh, ft, o);
      boilSeed('tv blocks');
      const cols = ['#5FAE58', '#8A8A9C', '#4E9A4E', '#B9B08A', '#6E6A8C', '#9C5FA0', '#5FAE58'];
      for (let i = 0; i < 14; i++) { const bx = sx + hash(i * 3.1) * sw_ * .86, by = sy + hash(i * 7.3 + 1) * sh * .84, bw = (22 + 40 * hash(i + 5)) * q, bh = (14 + 26 * hash(i + 9)) * q; paint(rectPts(bx, by, Math.min(bw, sx + sw_ - bx), Math.min(bh, sy + sh - by)), { wash: cols[i % cols.length], washOp: 200, ink: null }); }
      paint(rectPts(sx, sy + sh * .52, sw_, sh * .06), { wash: '#7FB07A', washOp: 180, ink: null });
      paint(rectPts(sx, sy, sw_, sh), { wash: '#1E1B2C', washOp: 90, ink: null });
      if (o.spinner !== false) spinner(sx + sw_ / 2, sy + sh / 2, 26 * q, t, o.spinFrozen);
      if (o.pct != null) heb(`${Math.round(o.pct)}%`, sx + sw_ / 2, sy + sh / 2 + 50 * q, 26 * q, '#FBF6EA', { w: 800 });
    } else if (scr === 'error') {
      paint(rectPts(sx, sy, sw_, sh), { wash: '#2C3150', ink: null });
      paint(rectPts(sx, sy, sw_, sh * .5), { wash: '#343A60', washOp: 140, ink: null });
      const ix = sx + sw_ / 2, iy = sy + sh * .36;
      paint([[ix, iy - 34 * q], [ix + 36 * q, iy + 28 * q], [ix - 36 * q, iy + 28 * q]], { wash: PAL.ochre, ink: PAL.ink, sw: 1.2, curv: .1 });
      paint([[ix - 4 * q, iy - 14 * q], [ix + 4 * q, iy - 14 * q], [ix + 2 * q, iy + 10 * q], [ix - 2 * q, iy + 10 * q]], { wash: PAL.ink, ink: null });
      paint(ellPts(ix, iy + 18 * q, 3.5 * q, 3.5 * q, 6), { wash: PAL.ink, ink: null });
      heb('שגיאה', ix, sy + sh * .64, 44 * q, '#FBF6EA', { w: 800 });
      paint(rrPts(ix - 52 * q, sy + sh * .76, 104 * q, 30 * q, 12 * q), { wash: '#4E5688', ink: '#8C94C8', sw: .8 });
      heb('נסה שוב', ix, sy + sh * .76 + 15.5 * q, 17 * q, '#DCE0F4', { w: 600 });
    } else if (scr === 'app') {
      const p = o.p ?? 1;
      paint(rectPts(sx, sy, sw_, sh), { wash: '#101A4C', ink: null });
      paint(ellPts(sx + sw_ / 2, sy + sh * .4, sw_ * .42, sh * .36, 24), { wash: '#1E2E78', washOp: 180, ink: null });
      glow(sx + sw_ / 2, sy + sh * .38, 150 * q, '#FFD36A', .5 * seg(p, 0, .3));
      gotvMark(sx + sw_ / 2, sy + sh * .37, 78 * q, { pop: seg(p, 0, .35) });
      if (p > .3) heb('הטלוויזיה של ישראל', sx + sw_ / 2, sy + sh * .58, 20 * q, '#FBF0CC', { w: 600, alpha: seg(p, .3, .45) });
      const tiles = ['#E27A92', '#5FAE58', '#E8AA38', '#8EC3E6'];
      for (let i = 0; i < 4; i++) {
        const k = backOut(seg(p, .4 + i * .08, .7 + i * .08)); if (k <= .01) continue;
        const tx_ = sx + sw_ * (.1 + i * .205), ty = sy + sh * .72 + (1 - k) * 60 * q;
        paint(rrPts(tx_, ty, sw_ * .18, sh * .2, 6 * q), { wash: tiles[i], ink: '#FBF6EA', sw: .8 });
        if (i === 1) { paint(ellPts(tx_ + sw_ * .09, ty + sh * .1, 9 * q, 9 * q, 10), { wash: '#FFFFFF', ink: PAL.ink, sw: .5 }); paint(rrPts(tx_ + 4 * q, ty + 4 * q, 30 * q, 12 * q, 3 * q), { wash: '#D8394E', ink: null }); heb('LIVE', tx_ + 19 * q, ty + 10.5 * q, 9 * q, '#FFFFFF', { w: 800 }); }
      }
    } else if (scr === 'goal') {
      const p = o.p ?? 1, bul = Math.sin(Math.PI * clamp(p * 2)) * (1 - seg(p, .5, 1) * .5);
      paint(rectPts(sx, sy, sw_, sh * .3), { wash: '#2C2740', ink: null });
      for (let i = 0; i < 16; i++) { const fx = sx + hash(i * 2.3) * sw_, fy = sy + hash(i * 5.1) * sh * .28; if (frac(t * 1.7 + hash(i)) < .25) glow(fx, fy, 16 * q, '#FFFFFF', .7); }
      paint(rectPts(sx, sy + sh * .3, sw_, sh * .7), { wash: '#5FAE58', ink: null });
      paint(rectPts(sx + sw_ * .08, sy + sh * .22, sw_ * .58, sh * .5), { wash: '#E7EEE8', washOp: 120, ink: null });
      for (let i = 0; i <= 8; i++) inkLine([[sx + sw_ * (.08 + i * .0725), sy + sh * .22], [sx + sw_ * (.08 + i * .0725) + (i === 5 ? bul * 10 * q : 0), sy + sh * .72]], .7, '#F6F6F0', 'inkfine', .5);
      for (let j = 0; j <= 5; j++) inkLine([[sx + sw_ * .08, sy + sh * (.22 + j * .1)], [sx + sw_ * .66, sy + sh * (.22 + j * .1)]], .7, '#F6F6F0', 'inkfine', 0);
      paint(rectPts(sx + sw_ * .06, sy + sh * .2, sw_ * .62, sh * .03), { wash: '#FFFFFF', ink: PAL.ink, sw: .6 });
      for (const e of [.06, .65]) paint(rectPts(sx + sw_ * e, sy + sh * .2, sw_ * .03, sh * .53), { wash: '#FFFFFF', ink: PAL.ink, sw: .6 });
      paint(ellPts(sx + sw_ * (.46 + bul * .03), sy + sh * .52, 11 * q, 11 * q, 12), { wash: '#FFFFFF', ink: PAL.ink, sw: .8 });
      // celebrating Maccabi player, arms up
      const px_ = sx + sw_ * .8, py_ = sy + sh * .95, u = 20 * q, jmp = Math.abs(Math.sin(t * TAU * 1.6)) * 8 * q * seg(p, .3, .6);
      inkLine([[px_ - u * .5, py_ - u * 2 - jmp], [px_ - u * .9, py_ - jmp * .5]], 3 * q, '#2B2233', 'ink', 0);
      inkLine([[px_ + u * .5, py_ - u * 2 - jmp], [px_ + u * .8, py_ - jmp * .5]], 3 * q, '#2B2233', 'ink', 0);
      for (const sd of [-1, 1]) paint(ribbon([[px_ + sd * u * .7, py_ - u * 3.6 - jmp], [px_ + sd * u * 1.3, py_ - u * 4.6 - jmp], [px_ + sd * u * 1.5, py_ - u * 5.6 - jmp]], u * .45, u * .38), { wash: C.mac, ink: PAL.ink, sw: .8 });
      paint(rrPts(px_ - u * .9, py_ - u * 4 - jmp, u * 1.8, u * 2.2, u * .4), { wash: C.mac, ink: PAL.ink, sw: .9 });
      inkLine([[px_ - u * .9, py_ - u * 3.2 - jmp], [px_ + u * .9, py_ - u * 3.2 - jmp]], 2 * q, C.macB, 'ink', 0);
      paint(ellPts(px_, py_ - u * 4.7 - jmp, u * .6, u * .62, 12), { wash: '#B97A52', ink: PAL.ink, sw: .8 });
      for (let i = 0; i < 18; i++) { const cx_ = sx + hash(i * 1.9) * sw_, cy_ = sy + frac(hash(i * 4.4) + t * (.3 + .2 * hash(i))) * sh; paint(rectPts(cx_, cy_, 5 * q, 3 * q), { wash: [C.mac, C.macB, '#FFFFFF'][i % 3], ink: null }); }
    }
    // scoreboard + corner bug + badges
    if (['live', 'freeze', 'goal', 'smooth', 'error'].includes(scr)) {
      const sc = o.score || (['goal', 'smooth'].includes(scr) ? [2, 1] : [1, 1]);
      const clock = o.clock || (scr === 'freeze' || scr === 'error' ? '89:14' : ['goal', 'smooth'].includes(scr) ? '90:02' : `89:${String(Math.floor(clamp(tm - 10, 0, 45) + 5)).padStart(2, '0')}`);
      if (scr !== 'error') scoreboard(sx + 12 * q, sy + 12 * q, q, sc, clock);
    }
    if (bug === 'old') {
      paint(rrPts(sx + sw_ - 96 * q, sy + 10 * q, 86 * q, 26 * q, 6 * q), { wash: '#9A99A6', washOp: 200, ink: '#6E6D7C', sw: .6 });
      heb('הספק הישן', sx + sw_ - 53 * q, sy + 23.5 * q, 14 * q, '#EDEBF2', { w: 600 });
    } else if (bug === 'gotv') {
      if (scr !== 'app') gotvMark(sx + sw_ - 48 * q, sy + 24 * q, 22 * q);
    }
    if (scr === 'smooth' || o.badge) {
      const bx = sx + 12 * q, by = sy + sh - 36 * q;
      paint(rrPts(bx, by, 206 * q, 24 * q, 8 * q), { wash: '#141A3C', washOp: 210, ink: null });
      paint(ellPts(bx + 12 * q, by + 12 * q, 4.5 * q, 4.5 * q, 8), { wash: '#FF4D4D', ink: null });
      heb('LIVE · 4K ·', bx + 20 * q, by + 13 * q, 13 * q, '#FBF6EA', { w: 800, align: 'left' });
      heb('ללא תקיעות', bx + 198 * q, by + 13 * q, 13 * q, C.mac, { w: 700, align: 'right' });
    }
    // glass sheen + gold pour
    boilSeed('tv glass');
    paint([[sx + sw_ * .62, sy], [sx + sw_ * .74, sy], [sx + sw_ * .5, sy + sh], [sx + sw_ * .38, sy + sh]], { wash: '#FFFFFF', washOp: 18, ink: null });
    paint(ellPts(x + w - b * .9, y + h - b * .5, 2.2, 2.2, 6), { wash: scr === 'off' ? '#E24A4A' : '#8CE0A0', ink: null });
    flushLetters();
    const g = clamp(o.gold || 0);
    if (g > 0) {
      for (let i = 0; i < 4; i++) glow(x + w / 2, y + h / 2, w * (.3 + i * .35) * (.6 + g), '#FFC84A', g * (1 - i * .15));
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .42 + .05 * Math.sin(t * 2 + i); for (let k = 1; k <= 3; k++) glow(x + w / 2 + Math.cos(a) * w * .3 * k * g, y + h / 2 + Math.sin(a) * h * .35 * k * g, w * .16, '#FFE08A', g * .6); }
      if (g > .5) paint(rectPts(sx, sy, sw_, sh), { wash: '#FFF3C8', washOp: 255 * seg(g, .5, 1), ink: null });
    }
  }
  function spinner(cx, cy, r, t, frozen) {
    boilSeed('spinner');
    const a0 = frozen ? 2 : Math.floor(t * 12) / 12 * TAU * 1.2;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, lit = frac((a - a0) / TAU), k = Math.pow(1 - lit, 2.5);
      paint(ellPts(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * .14 * (.6 + .4 * k), r * .14 * (.6 + .4 * k), 8), { wash: mixCol('#6E6A86', '#FBF6EA', k), ink: null });
    }
  }

  // ================================================================ PHONE CHAT
  const DEFAULT_CHAT = {
    msgs: [{ me: true, text: 'אני רוצה להתחבר לשירותי הצפייה שלכם באפליקציה על מסך הטלוויזיה', at: 32.4, time: '21:47' },
           { me: false, text: 'בכיף! המנוי מופעל', at: 34.2, time: '21:48', check: true }],
    typing: [33.4, 34.2], readAt: 33.1, draft: ['אני רוצה להתחבר לשירותי הצפייה שלכם באפליקציה על מסך הטלוויזיה', 31.4, 32.35],
  };
  function checkBox(x, y, r) {
    paint(rrPts(x - r, y - r, 2 * r, 2 * r, r * .3), { wash: '#3DBB5E', ink: PAL.ink, sw: .6 });
    inkLine([[x - r * .55, y], [x - r * .12, y + r * .45], [x + r * .6, y - r * .5]], r * .11, '#FFFFFF', 'ink', 0);
  }
  function ticks(x, y, s, blue) {
    const c = blue ? '#3FA7E8' : '#8E9AA0';
    for (const d of [0, 7 * s]) inkLine([[x + d, y], [x + d + 4 * s, y + 4 * s], [x + d + 11 * s, y - 5 * s]], 1.1 * s, c, 'inkfine', 0);
  }
  function phoneChat(x, y, s = 1, t = T, o = {}) {
    const d = DEFAULT_CHAT, msgs = o.msgs || d.msgs, typing = o.typing || d.typing, readAt = o.readAt ?? d.readAt, draft = o.draft !== undefined ? o.draft : d.draft;
    const PW = 500 * s, PH = 980 * s, X0 = x - PW / 2, Y0 = y - PH / 2, sc = 16 * s, SX = X0 + sc, SY = Y0 + sc, SW = PW - 2 * sc, SH = PH - 2 * sc;
    boilSeed('phone body');
    paint(rrPts(X0 + 10 * s, Y0 + 14 * s, PW, PH, 64 * s), { wash: '#1A1624', washOp: 90, ink: null });
    paint(rrPts(X0, Y0, PW, PH, 64 * s, .5), { wash: '#2A2536', ink: PAL.ink, sw: 1.6 });
    paint(rrPts(SX, SY, SW, SH, 50 * s), { wash: '#ECE3D3', ink: null });
    boilSeed('phone doodles');
    for (let i = 0; i < 9; i++) { const px = SX + (.12 + (i % 3) * .36) * SW, py = SY + (.22 + Math.floor(i / 3) * .22) * SH; inkLine([[px, py], [px + 12 * s, py - 8 * s], [px + 22 * s, py + 2 * s]], .6 * s, '#D5C9B4', 'inkfine', .6); }
    // header (RTL: back arrow at the right, then the avatar, name right-aligned)
    const hh = 150 * s;
    boilSeed('phone header');
    paint([[SX, SY + 40 * s], [SX + SW, SY + 40 * s], [SX + SW, SY + hh], [SX, SY + hh]].concat([]), { wash: '#1E6E5E', ink: null });
    paint(rrPts(SX, SY, SW, 80 * s, 50 * s), { wash: '#1E6E5E', ink: null });
    heb('21:47', SX + 60 * s, SY + 26 * s, 20 * s, '#E6F4EE', { w: 600 });
    paint(rrPts(SX + SW - 70 * s, SY + 18 * s, 34 * s, 16 * s, 4 * s), { ink: '#E6F4EE', sw: .7 });
    paint(rectPts(SX + SW - 67 * s, SY + 21 * s, 24 * s, 10 * s), { wash: '#E6F4EE', ink: null });
    const ay = SY + 100 * s;
    inkLine([[SX + SW - 40 * s, ay - 14 * s], [SX + SW - 26 * s, ay], [SX + SW - 40 * s, ay + 14 * s]], 1.6 * s, '#E6F4EE', 'ink', 0);
    const avx = SX + SW - 90 * s;
    paint(ellPts(avx, ay, 30 * s, 30 * s, 18), { wash: '#152057', ink: '#E6F4EE', sw: .8 });
    paint(ellPts(avx, ay, 13 * s, 13 * s, 14), { wash: C.mac, ink: null });
    paint([[avx - 4 * s, ay - 7 * s], [avx + 8 * s, ay], [avx - 4 * s, ay + 7 * s]], { wash: C.macB, ink: null });
    const isTyping = t >= typing[0] && t < typing[1];
    heb('GOTV · נציג שירות', avx - 44 * s, ay - 13 * s, 29 * s, '#FFFFFF', { w: 700, align: 'right' });
    heb(isTyping ? 'מקליד/ה...' : 'מחובר/ת', avx - 44 * s, ay + 20 * s, 20 * s, '#CFEDE2', { w: 500, align: 'right' });
    for (let i = 0; i < 3; i++) paint(ellPts(SX + 30 * s, ay - 12 * s + i * 12 * s, 3 * s, 3 * s, 6), { wash: '#E6F4EE', ink: null });
    // messages, stacked from the top
    let cy = SY + hh + 36 * s;
    const fnt = `500 ${30 * s}px Rubik`, lh = 40 * s, maxW = SW * .64;
    msgs.forEach((m, i) => {
      if (t < m.at) return;
      const k = backOut(seg(t, m.at, m.at + .3));
      const wr = wrapText(m.text, fnt, maxW), bw = wr.w + (m.check ? 52 * s : 0) + 44 * s, bh = wr.lines.length * lh + 50 * s;
      const bx = m.me ? SX + 22 * s : SX + SW - 22 * s - bw;
      boilSeed('bubble ' + i);
      const col = m.me ? '#D9F5C4' : '#FFFBF3';
      push(); translate(m.me ? bx : bx + bw, cy); scale(k); translate(-(m.me ? bx : bx + bw), -cy);
      paint(rrPts(bx, cy, bw, bh, 20 * s, .4), { wash: col, ink: '#BFB4A0', sw: .7 });
      paint(m.me ? [[bx + 4 * s, cy], [bx - 14 * s, cy], [bx + 4 * s, cy + 20 * s]] : [[bx + bw - 4 * s, cy], [bx + bw + 14 * s, cy], [bx + bw - 4 * s, cy + 20 * s]], { wash: col, ink: null });
      if (m.check) checkBox(bx + 34 * s, cy + 22 * s + lh * .5, 15 * s);
      pop();
      if (k > .6) {
        wr.lines.forEach((ln, j) => heb(ln, bx + bw - 22 * s, cy + 22 * s + lh * (j + .5), 30 * s, '#1F2A28', { w: 500, align: 'right' }));
        heb(m.time || '21:47', bx + (m.me ? 64 : 40) * s, cy + bh - 16 * s, 17 * s, '#7C8A86', { w: 500 });
        if (m.me) ticks(bx + 14 * s, cy + bh - 16 * s, s, t >= readAt);
      }
      cy += bh + 22 * s;
    });
    if (isTyping) {
      boilSeed('typing');
      const bw = 110 * s, bx = SX + SW - 22 * s - bw;
      paint(rrPts(bx, cy, bw, 60 * s, 22 * s), { wash: '#FFFBF3', ink: '#BFB4A0', sw: .7 });
      for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * TAU * 2.2 - i * .9)); paint(ellPts(bx + 30 * s + i * 25 * s, cy + 30 * s - b * 8 * s, 7 * s, 7 * s, 8), { wash: mixCol('#9AA6A2', '#4E5A56', b), ink: null }); }
    }
    // input bar
    boilSeed('input bar');
    const iy = SY + SH - 100 * s;
    paint(rrPts(SX + 96 * s, iy, SW - 118 * s, 66 * s, 33 * s), { wash: '#FFFFFF', ink: '#CFC4B0', sw: .7 });
    paint(ellPts(SX + 52 * s, iy + 33 * s, 33 * s, 33 * s, 18), { wash: '#1E8E6E', ink: null });
    paint([[SX + 40 * s, iy + 20 * s], [SX + 68 * s, iy + 33 * s], [SX + 40 * s, iy + 46 * s], [SX + 45 * s, iy + 33 * s]], { wash: '#FFFFFF', ink: null });
    let dtxt = '';
    if (draft && t >= draft[1] && t < (msgs[0] ? msgs[0].at : Infinity)) { const n = Math.floor(draft[0].length * seg(t, draft[1], draft[2])); dtxt = draft[0].slice(0, n); }
    if (dtxt) {
      const c = mctx(); c.font = `500 ${26 * s}px Rubik`; let tx = dtxt; while (c.measureText(tx).width > SW - 170 * s && tx.length > 4) tx = tx.slice(1);   // keep the newest words visible
      heb(tx, SX + SW - 46 * s, iy + 34 * s, 26 * s, '#1F2A28', { w: 500, align: 'right' });
      if (frac(t * 2) < .5) inkLine([[SX + SW - 46 * s - textW(tx, `500 ${26 * s}px Rubik`) - 4 * s, iy + 18 * s], [SX + SW - 46 * s - textW(tx, `500 ${26 * s}px Rubik`) - 4 * s, iy + 50 * s]], 1 * s, '#1E8E6E', 'inkfine', 0);
    } else heb('הודעה', SX + SW - 46 * s, iy + 34 * s, 26 * s, '#A09A8E', { w: 400, align: 'right' });
    paint(rrPts(X0 + PW / 2 - 50 * s, Y0 + 26 * s, 100 * s, 22 * s, 11 * s), { wash: '#15121C', ink: null });
    flushLetters();
    // Noa's hand holding it: palm under the phone's lower-left corner, fingertips wrapping the right edge, thumb
    // reaching up toward the send button (it taps while she types)
    if (o.hand !== false) {
      boilSeed('phone hand');
      const tp = Math.abs(Math.sin(t * TAU * 3)) * 8 * s * (dtxt ? 1 : 0), by = Y0 + PH;
      paint(ribbon([[X0 - 60 * s, by + 460 * s], [X0 - 10 * s, by + 200 * s], [X0 + 40 * s, by + 90 * s]], 250 * s, 230 * s), { wash: C.hood, ink: PAL.ink, sw: 1.4 });
      paint(ribbon([[X0 + 10 * s, by + 150 * s], [X0 + 40 * s, by + 90 * s]], 240 * s, 240 * s), { wash: C.hoodLt, ink: PAL.ink, sw: 1 });
      for (let i = 0; i < 3; i++) paint(ellPts(X0 + PW - 6 * s, Y0 + PH * (.74 + i * .07), 20 * s, 24 * s, 12), { wash: C.nSkin, ink: PAL.ink, sw: 1 });
      paint(blob(X0 + 90 * s, by + 30 * s, 150 * s, 80 * s, 22, .08, 3, 0, -.2), { wash: C.nSkin, ink: PAL.ink, sw: 1.3, curv: .4 });
      paint(ribbon([[X0 + 40 * s, by - 10 * s], [X0 + 20 * s, by - 90 * s], [X0 + 52 * s + tp * .3, by - 150 * s - tp]], 58 * s, 46 * s), { wash: C.nSkin, ink: PAL.ink, sw: 1.2 });
      paint(ellPts(X0 + 50 * s + tp * .3, by - 146 * s - tp, 13 * s, 10 * s, 10, 0, -.9), { wash: '#F3D2BC', ink: PAL.ink, sw: .6 });
    }
    boilSeed('phone after');
  }

  // ================================================================ LIVING ROOM
  const RM = {
    floorY: 790, win: [790, 150, 330, 400], cab: [1235, 700, 610, 172], tv: [1300, 404, 480, 286],
    chair: [520, 910, .82], noa: [1010, 950, .82], pouf: [1085, 972, .82], table: [860, 742], box: [1400, 856, .72], bin: [1170, 912],
  };
  function livingRoom(t, o = {}) {
    const lamp = o.lamp ?? 1, snow = o.snow ?? 1;
    boilSeed('room wall');
    paint(rectPts(-200, -200, W + 400, RM.floorY + 220), { wash: '#E7C49A', ink: null });
    paint(ellPts(260, 360, 700, 520, 30, 8), { fill: '#F2B25C', fillOp: 110, bleed: .25, tex: .5, border: .3, ink: null });
    paint(ellPts(955, 360, 420, 380, 26, 6), { fill: '#9DB4D8', fillOp: 70, bleed: .25, tex: .5, border: .3, ink: null });
    paint(ellPts(1560, 380, 560, 420, 26, 6), { fill: '#C9A07A', fillOp: 70, bleed: .2, tex: .6, border: .3, ink: null });
    // window: night Toronto, CN Tower, falling snow, frosty panes
    const [wx, wy, ww, wh] = RM.win;
    boilSeed('room window');
    paint(rectPts(wx, wy, ww, wh), { wash: '#1F2B5E', ink: null });
    paint(rectPts(wx, wy + wh * .55, ww, wh * .45), { wash: '#34437E', washOp: 200, ink: null });
    const bl = [[0, .7, .12], [.1, .6, .1], [.22, .74, .09], [.33, .52, .1], [.46, .66, .09], [.62, .58, .11], [.76, .7, .1], [.88, .62, .12]];
    bl.forEach(([bx, bt_, bw_], i) => {
      paint(rectPts(wx + bx * ww, wy + bt_ * wh, bw_ * ww, (1 - bt_) * wh), { wash: i % 2 ? '#2A3572' : '#313D80', ink: null });
      for (let k = 0; k < 2; k++) if (hash(i * 5 + k) > .3) paint(rectPts(wx + (bx + .025 + k * .04) * ww, wy + (bt_ + .06 + hash(i + k) * .15) * wh, 5, 7), { wash: '#F2C66A', ink: null });
    });
    const tx0 = wx + ww * .56, tb = wy + wh;
    paint([[tx0 - 9, tb], [tx0 + 9, tb], [tx0 + 3, wy + wh * .2], [tx0 - 3, wy + wh * .2]], { wash: '#3C4890', ink: null });
    paint(ellPts(tx0, wy + wh * .33, 17, 9, 14), { wash: '#4A58A0', ink: null });
    paint(ellPts(tx0, wy + wh * .3, 11, 5, 12), { wash: '#F2C66A', washOp: 180, ink: null });
    inkLine([[tx0, wy + wh * .2], [tx0, wy + wh * .03]], 1.2, '#4A58A0', 'inkfine', 0);
    if (frac(t * .8) < .5) glow(tx0, wy + wh * .03, 16, '#FF5A5A', .9);
    if (snow > 0) {
      boilSeed('snow');
      for (let i = 0; i < 26; i++) {
        const fx = wx + 6 + frac(hash(i) + .02 * Math.sin(t * 1.3 + i)) * (ww - 12), fy = wy + 6 + frac(hash(i + 40) + t * (.05 + .05 * hash(i + 9))) * (wh - 12), r = 2.5 + 3 * hash(i + 3);
        paint(ellPts(fx, fy, r, r, 7), { wash: '#F4F2FA', ink: null });
      }
    }
    paint(blob(wx + ww / 2, wy + wh - 6, ww * .52, 16, 22, .5, 9), { wash: '#F0EEF6', ink: null });
    paint(ellPts(wx + ww * .12, wy + wh * .1, ww * .2, wh * .12, 16, 4), { fill: '#E8F0FF', fillOp: 80, bleed: .3, tex: .7, ink: null });
    glow(wx + ww / 2, wy + wh / 2, ww * .7, '#7FA0FF', .25);
    const fr = '#EFE5D3';
    for (const r_ of [[wx - 16, wy - 16, ww + 32, 18], [wx - 16, wy + wh - 2, ww + 32, 20], [wx - 16, wy - 16, 18, wh + 34], [wx + ww - 2, wy - 16, 18, wh + 34], [wx + ww / 2 - 6, wy, 12, wh], [wx, wy + wh * .45 - 6, ww, 12]]) paint(rectPts(...r_), { wash: fr, ink: null });
    paint(rectPts(wx - 16, wy - 16, ww + 32, wh + 34), { ink: PAL.ink, sw: 1 });
    paint(rectPts(wx - 34, wy + wh + 14, ww + 68, 16), { wash: '#E3D5BC', ink: PAL.ink, sw: .9 });
    // curtains
    boilSeed('curtains');
    for (const sd of [-1, 1]) {
      const cx = sd < 0 ? wx - 40 : wx + ww + 40, sway = Math.sin(t * .8 + sd) * 3;
      paint([[cx - 42, wy - 40], [cx + 42, wy - 40], [cx + 38 + sd * 10, wy + wh * .55], [cx + 50 + sway, wy + wh + 90], [cx - 50 + sway, wy + wh + 90], [cx - 38 + sd * 10, wy + wh * .55]], { wash: '#C6563F', ink: PAL.ink, sw: 1, curv: .3 });
      for (const k of [-18, 8]) inkLine([[cx + k, wy - 30], [cx + k + sd * 8, wy + wh * .55], [cx + k * 1.3 + sway, wy + wh + 80]], .7, '#8E3426', 'inkfine', .5);
      paint(ribbon([[cx - 40, wy + wh * .52], [cx, wy + wh * .56], [cx + 40, wy + wh * .52]], 12, 12), { wash: '#E8AA38', ink: PAL.ink, sw: .6 });
    }
    inkLine([[wx - 100, wy - 44], [wx + ww + 100, wy - 44]], 2.2, C.woodDk, 'ink', 0);
    // Tel Aviv beach picture, hamsa, Maccabi pennant
    boilSeed('picture');
    const px = 1215, py = 175, pw = 210, ph = 150;
    paint(rectPts(px - 14, py - 14, pw + 28, ph + 28), { wash: '#B4833F', ink: PAL.ink, sw: 1 });
    paint(rectPts(px, py, pw, ph), { wash: '#9ED3EA', ink: null });
    paint(ellPts(px + pw * .78, py + ph * .25, 16, 16, 12), { wash: '#F8C64E', ink: null });
    for (const [bx, bh_, bw_] of [[.08, .3, .07], [.16, .42, .06], [.23, .24, .08]]) paint(rectPts(px + bx * pw, py + ph * (.55 - bh_), bw_ * pw, ph * bh_), { wash: '#F2EEE4', ink: null });
    paint(rectPts(px, py + ph * .52, pw, ph * .2), { wash: '#3A9CB8', ink: null });
    paint([[px, py + ph * .72], [px + pw, py + ph * .66], [px + pw, py + ph], [px, py + ph]], { wash: '#EFD092', ink: null });
    inkLine([[px + pw * .62, py + ph * .95], [px + pw * .64, py + ph * .7]], .9, PAL.ink, 'inkfine', 0);
    paint([[px + pw * .5, py + ph * .72], [px + pw * .78, py + ph * .68], [px + pw * .64, py + ph * .6]], { wash: '#E24A4A', ink: PAL.ink, sw: .5 });
    boilSeed('hamsa');
    const hx = 390, hy = 300;
    inkLine([[hx, hy - 70], [hx, hy - 50]], .8, PAL.ink, 'inkfine', 0);
    const hm = [[hx - 38, hy + 30], [hx - 48, hy - 6], [hx - 30, hy - 14], [hx - 26, hy - 42], [hx - 12, hy - 44], [hx - 8, hy - 52], [hx + 8, hy - 52], [hx + 12, hy - 44], [hx + 26, hy - 42], [hx + 30, hy - 14], [hx + 48, hy - 6], [hx + 38, hy + 30], [hx, hy + 44]];
    paint(hm, { wash: '#3C79C8', ink: PAL.ink, sw: .9, curv: .5 });
    paint(ellPts(hx, hy + 8, 17, 10, 14), { wash: PAL.cream, ink: PAL.ink, sw: .6 });
    paint(ellPts(hx, hy + 8, 6, 6, 10), { wash: '#1F3F86', ink: null });
    boilSeed('pennant');
    const pnx = 1510, pny = 210, pwv = Math.sin(t * 1.2) * 4;
    paint([[pnx, pny], [pnx + 200, pny + 44 + pwv], [pnx, pny + 88]], { wash: C.mac, ink: PAL.ink, sw: 1 });
    paint([[pnx, pny], [pnx + 22, pny + 5], [pnx + 22, pny + 83], [pnx, pny + 88]], { wash: C.macB, ink: null });
    paint(starPts(pnx + 58, pny + 44, 17, .56, 6, -Math.PI / 2), { wash: C.macB, ink: null });
    heb('מכבי', pnx + 124, pny + 45 + pwv * .5, 26, C.macB, { w: 900, rot: .1 });
    paint(ellPts(pnx - 4, pny + 2, 5, 5, 8), { wash: '#D8394E', ink: PAL.ink, sw: .5 });
    // lamp: warm light pool
    boilSeed('lamp');
    const lx = 190;
    if (lamp > 0) glow(lx, 330, 520, '#FFB85A', .75 * lamp);
    // floor, baseboard, rug
    boilSeed('floor');
    paint(rectPts(-200, RM.floorY, W + 400, H - RM.floorY + 200), { wash: '#9A643F', ink: null });
    paint(rectPts(-200, RM.floorY, W + 400, 26), { wash: C.woodDk, ink: PAL.ink, sw: .9 });
    for (let i = 0; i < 7; i++) { const yy = RM.floorY + 40 + i * i * 7 + i * 16; inkLine([[-40, yy], [W + 40, yy + 4]], .6, '#7B4C2E', 'inkfine', 0); }
    paint(ellPts(600, 990, 900, 150, 28, 6), { fill: '#7B4C2E', fillOp: 60, bleed: .2, tex: .6, ink: null });
    boilSeed('rug');
    paint(ellPts(870, 968, 640, 118, 34, 3), { wash: '#B2453A', ink: PAL.ink, sw: 1.1 });
    paint(ellPts(870, 968, 560, 92, 30, 3), { wash: '#CF6A45', ink: null });
    paint(ellPts(870, 968, 470, 70, 30, 3), { wash: '#B2453A', ink: null });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; paint(starPts(870 + Math.cos(a) * 515, 968 + Math.sin(a) * 81, 10, .45, 4, 0), { wash: '#F2D9A8', ink: null }); }
    paint(starPts(870, 968, 60, .45, 4, 0).map(([a, b]) => [a, 968 + (b - 968) * .45]), { wash: '#F2D9A8', ink: null });
    // lamp stand (in front of the wall)
    boilSeed('lamp stand');
    paint(ellPts(lx, RM.floorY + 64, 60, 14, 16), { wash: '#4A3A30', ink: PAL.ink, sw: .9 });
    inkLine([[lx, RM.floorY + 60], [lx + 4, 520], [lx, 360]], 3.2, '#4A3A30', 'ink', .4);
    paint([[lx - 64, 360], [lx + 64, 360], [lx + 40, 250], [lx - 40, 250]], { wash: '#F6D39A', ink: PAL.ink, sw: 1 });
    paint([[lx - 64, 360], [lx + 64, 360], [lx + 60, 346], [lx - 60, 346]], { wash: '#E8AA38', ink: null });
    if (lamp > 0) glow(lx, 330, 150, '#FFE3A8', .9 * lamp);
    // TV cabinet, old box shelf, TV
    boilSeed('cabinet');
    const [cx, cy, cw, ch] = RM.cab;
    paint(rectPts(cx, cy, cw, ch), { wash: C.wood, ink: PAL.ink, sw: 1.1 });
    paint(rectPts(cx - 10, cy - 12, cw + 20, 16), { wash: C.woodLt, ink: PAL.ink, sw: 1 });
    for (const lx_ of [cx + 16, cx + cw - 30]) paint(rectPts(lx_, cy + ch, 14, 18), { wash: C.woodDk, ink: PAL.ink, sw: .6 });
    paint(rectPts(cx + 40, cy + 30, 290, 124), { wash: '#3B2418', ink: PAL.ink, sw: .9 });
    paint(rectPts(cx + 360, cy + 26, 110, 130), { wash: C.woodLt, washOp: 150, ink: PAL.ink, sw: .8 });
    paint(rectPts(cx + 480, cy + 26, 110, 130), { wash: C.woodLt, washOp: 150, ink: PAL.ink, sw: .8 });
    for (const kx of [cx + 455, cx + 494]) paint(ellPts(kx, cy + 92, 5, 5, 8), { wash: '#D8B04E', ink: PAL.ink, sw: .4 });
    if (o.shelfEmpty) {
      paint(rectPts(RM.box[0] - 80, RM.box[1] - 56, 160, 50), { wash: '#4E3326', ink: null });
      paint(rectPts(RM.box[0] - 80, RM.box[1] - 56, 160, 50), { ink: '#7A5A45', sw: .6 });
      inkLine([[RM.box[0] + 40, RM.box[1] - 8], [RM.box[0] + 110, RM.box[1] - 40]], .8, '#6B6C79', 'inkfine', .6);
    } else if (o.box !== false) oldBox(RM.box[0], RM.box[1], RM.box[2], { cables: .55, to: [RM.box[0] + 150, RM.box[1] + 30], dust: true, ...(o.box || {}) });
    if (o.tv !== false) tvSet(...RM.tv, t, { glow: o.tvLight ?? 1, gold: o.gold || 0, ...(o.tv || {}) });
    // bin
    if (o.bin !== false) {
      boilSeed('bin');
      const [bx, by] = RM.bin;
      paint([[bx - 44, by - 96], [bx + 44, by - 96], [bx + 34, by], [bx - 34, by]], { wash: '#8C95A8', ink: PAL.ink, sw: 1 });
      for (let i = -2; i <= 2; i++) inkLine([[bx + i * 16, by - 90], [bx + i * 12.5, by - 6]], .6, '#6B7488', 'inkfine', 0);
      paint(ellPts(bx, by - 96, 46, 10, 14), { wash: '#4E5566', ink: PAL.ink, sw: .9 });
    }
    // side table with Bamba, teapot, tea glass
    boilSeed('side table');
    const [tx, ty] = RM.table;
    paint(ellPts(tx, RM.floorY + 108, 60, 12, 14), { wash: '#3A2A3A', washOp: 60, ink: null });
    paint([[tx - 12, ty + 10], [tx + 12, ty + 10], [tx + 16, RM.floorY + 100], [tx - 16, RM.floorY + 100]], { wash: C.woodDk, ink: PAL.ink, sw: .9 });
    paint(ellPts(tx, RM.floorY + 104, 52, 10, 14), { wash: C.woodDk, ink: PAL.ink, sw: .8 });
    paint(ellPts(tx, ty + 8, 116, 26, 22), { wash: C.woodDk, ink: PAL.ink, sw: 1 });
    paint(ellPts(tx, ty, 116, 26, 22), { wash: C.woodLt, ink: PAL.ink, sw: 1 });
    if (o.table !== false) {
      bambaBag(tx - 62, ty + 4, 26, 1);
      puff(tx - 20, ty + 10, 7, .4); puff(tx - 4, ty + 4, 7, -.3); puff(tx + 14, ty + 14, 7, .9);
      teaGlass(tx + 70, ty + 8, 15, 1.4);
      const tpx = tx + 30, tpy = ty - 2;
      paint(ribbon([[tpx + 30, tpy - 22], [tpx + 50, tpy - 36], [tpx + 58, tpy - 46]], 12, 6), { wash: '#F2EBDD', ink: PAL.ink, sw: .8 });
      paint(ellPts(tpx - 32, tpy - 24, 12, 15, 12), { ink: PAL.ink, sw: 2.2 });
      paint(ellPts(tpx, tpy - 24, 34, 26, 18), { wash: '#F2EBDD', ink: PAL.ink, sw: 1 });
      paint(ellPts(tpx, tpy - 24, 12, 8, 10), { wash: '#5B8FD0', ink: null });
      paint(ellPts(tpx, tpy - 50, 16, 5, 10), { wash: '#E5DCCB', ink: PAL.ink, sw: .7 });
      paint(ellPts(tpx, tpy - 56, 5, 5, 8), { wash: '#5B8FD0', ink: PAL.ink, sw: .5 });
      for (let i = 0; i < 2; i++) { const ph = frac(t * .5 + i * .5); inkLine([[tpx + 58, tpy - 50 - ph * 40], [tpx + 64 + 6 * Math.sin(t * 3 + i), tpy - 62 - ph * 40], [tpx + 58, tpy - 76 - ph * 40]], .8, '#FFFFFF', 'inkfine', .6); }
    }
    // leather pouf
    boilSeed('pouf');
    const [pfx, pfy, pfs] = RM.pouf;
    pouf(pfx, pfy, pfs);
    if (o.chair !== false) armchair(...RM.chair, 'back');
    boilSeed('room after');
  }
  function pouf(x, y, s = 1) {
    push(); translate(x, y); scale(s);
    paint(ellPts(0, 0, 100, 16, 16), { wash: '#3A2A3A', washOp: 60, ink: null });
    paint([[-92, -74], [92, -74], [98, -30], [88, -4], [0, 4], [-88, -4], [-98, -30]], { wash: '#A2582F', ink: PAL.ink, sw: 1.2, curv: .5 });
    paint(ellPts(0, -76, 92, 22, 22), { wash: '#BE7040', ink: PAL.ink, sw: 1.1 });
    for (const k of [-.55, 0, .55]) inkLine([[k * 92, -62], [k * 100, -24], [k * 94, -2]], .7, '#6E3A1E', 'inkfine', .5);
    paint(ellPts(0, -76, 12, 4, 8), { wash: '#6E3A1E', ink: null });
    pop();
  }

  // ================================================================ exports
  Object.assign(window, { saba, noa, famAct, livingRoom, armchair, tvSet, backgammon, phoneChat, oldBox, pouf });
  window.FAM_ROOM = { chair: RM.chair, saba: RM.chair, noa: RM.noa, pouf: RM.pouf, table: RM.table, tv: RM.tv, box: RM.box, bin: RM.bin, window: RM.win, cabinet: RM.cab };
  window.FAM_MOODS = { saba: Object.keys(SABA_MOODS), noa: Object.keys(NOA_MOODS) };
  window.FAM_GESTURES = Object.keys(GEST);

  // ================================================================ MODEL SHEET (LOOPS.kit_family), pages of 4 s
  //  0 room + both characters     1 Saba poses      2 Saba moods       3 Saba gestures    4 Noa poses/gestures
  //  5 Noa moods                  6 acting (famAct)  7 TV screens       8 props             9 phone chat
  const paper = () => { boilSeed('sheet bg'); paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#EFE3CD', ink: null }); };
  const floorLine = y => { boilSeed('floor ' + y); paint(rectPts(-40, y, W + 80, 14), { wash: '#D9C6A6', ink: null }); };
  // Render at loop times 100+ (100 = page 0) to keep the global subtitles and lip-sync out of the sheet.
  LOOPS.kit_family = t => {
    if (t >= 100) t -= 100;
    const pg = Math.floor(t / 4), lt = t - pg * 4;
    if (pg === 0) {
      livingRoom(t, { tv: { screen: 'live' } });
      saba(...RM.chair, { mood: 'eager', pose: 'sit', gesture: 'grip', turn: .6, look: [.6, 0], talk: .3 * Math.abs(Math.sin(t * 7)) });
      armchair(...RM.chair, 'front');
      noa(RM.noa[0], RM.noa[1], RM.noa[2], { mood: 'hopeful', gesture: 'case', gk: .7, flip: true, look: [.4, -.2] });
    } else if (pg === 1) {
      paper(); floorLine(880);
      const P = [['sit', 'neutral', 'grip'], ['rise', 'eager', 'point'], ['stand', 'horror', 'headHands'], ['jump', 'joy', 'armsUp']];
      P.forEach(([pose, mood, g], i) => { const x = 250 + i * 470; if (pose === 'sit') armchair(x, 880, .78); saba(x, 880, .78, { pose, mood, gesture: g, t: t + i, talk: 0 }); if (pose === 'sit') armchair(x, 880, .78, 'front'); });
    } else if (pg === 2) {
      paper();
      const ms = ['neutral', 'eager', 'dismiss', 'tense', 'horror', 'angry', 'joy', 'laugh', 'love', 'surprised', 'sad', 'sly'];
      ms.forEach((m, i) => { const x = 170 + (i % 6) * 316, y = 540 + Math.floor(i / 6) * 520; saba(x, y + 260, 1.05, { mood: m, pose: 'stand', talk: 0, t: t + i * .37, look: [(i % 3 - 1) * .6, 0] }); });
    } else if (pg === 3) {
      paper(); floorLine(520); floorLine(1060);
      const gs = ['point', 'armsUp', 'headHands', 'fists', 'reach', 'waveOff', 'hug', 'cheer', 'throw', 'shrug'];
      const md = { point: 'angry', armsUp: 'joy', headHands: 'horror', fists: 'tense', reach: 'eager', waveOff: 'dismiss', hug: 'love', cheer: 'joy', throw: 'eager', shrug: 'sad' };
      gs.forEach((g, i) => { const x = 190 + (i % 5) * 385, y = i < 5 ? 520 : 1060; saba(x, y, .72, { gesture: g, mood: md[g], gk: frac(t * .5), t: t + i * .3, talk: 0 }); });
    } else if (pg === 4) {
      paper(); floorLine(510); floorLine(1050);
      const L = [['stand', 'idle', 'neutral'], ['sit', 'phone', 'focused'], ['crouch', 'reach', 'determined'], ['jump', 'cheer', 'joy'], ['stand', 'point', 'amused'], ['stand', 'case', 'hopeful'],
                 ['stand', 'box', 'determined'], ['stand', 'throw', 'determined'], ['stand', 'hug', 'proud'], ['stand', 'armsUp', 'laugh'], ['stand', 'present', 'cheeky'], ['stand', 'shrug', 'sad']];
      L.forEach(([pose, g, m], i) => { const x = 140 + (i % 6) * 328, y = i < 6 ? 510 : 1050; if (pose === 'sit') pouf(x, y, .9); noa(x, y, .9, { pose, gesture: g, mood: m, gk: g === 'box' ? frac(t * .4) : g === 'throw' ? frac(t * .6) : .8, t: t + i * .41, talk: 0 }); });
    } else if (pg === 5) {
      paper();
      const ms = ['neutral', 'hopeful', 'sad', 'amused', 'focused', 'determined', 'joy', 'proud', 'laugh', 'surprised', 'cheeky', 'neutral'];
      ms.forEach((m, i) => { const x = 170 + (i % 6) * 316, y = 470 + Math.floor(i / 6) * 520; noa(x, y + 330, 1.35, { mood: m, talk: i === 11 ? .8 * Math.abs(Math.sin(t * 8)) : 0, t: t + i * .29, look: [(i % 3 - 1) * .5, 0] }); });
    } else if (pg === 6) {
      // acting: C2 beats compressed (freeze, horror, exasperation, Noa's knowing answer)
      livingRoom(t, { tv: { screen: lt < 1.2 ? 'live' : lt < 2.4 ? 'freeze' : 'error', pct: 37 } });
      const sk = [[0, 'eager', { pose: 'sit', gesture: 'grip', turn: .6, look: [.7, 0] }], [1.3, 'horror', { pose: 'rise', gesture: 'headHands' }], [2.5, 'angry', { pose: 'stand', gesture: 'point' }], [3.5, 'sad', { gesture: 'shrug', turn: -.3, look: [-.6, .2] }]];
      const nk = [[0, 'hopeful', { gesture: 'case', gk: .8 }], [1.4, 'surprised', { gesture: 'case', gk: 0 }], [2.8, 'amused', { gesture: 'present' }]];
      saba(RM.chair[0], RM.chair[1], RM.chair[2], { ...famAct('saba', lt, sk), t: t, talk: 0 });
      armchair(...RM.chair, 'front');
      noa(RM.noa[0], RM.noa[1], RM.noa[2], { ...famAct('noa', lt, nk), flip: true, t: t, talk: 0 });
    } else if (pg === 7) {
      paper();
      const S = [['live', {}], ['freeze', { pct: 37 }], ['error', {}], ['app', { p: seg(lt, 0, 2.5) }], ['goal', { p: seg(lt, 0, 2) }], ['smooth', {}]];
      S.forEach(([scr, oo], i) => tvSet(90 + (i % 3) * 610, 90 + Math.floor(i / 3) * 500, 540, 310, t, { screen: scr, ...oo }));
    } else if (pg === 8) {
      paper(); floorLine(470); floorLine(1000);
      backgammon(250, 440, 1, { mode: 'case' });
      backgammon(700, 440, 1, { mode: 'table', open: seg(lt, .3, 2.3) });
      backgammon(1420, 450, 1.25, { mode: 'board', dice: seg(lt, .2, 1.8), hop: seg(lt, 2, 2.7), hop2: seg(lt, 2.8, 3.5) });
      oldBox(420, 800, 1.3, { cables: 1, to: [700, 950], dust: true });
      oldBox(1200, 800 - 120 * Math.sin(Math.PI * seg(lt, 0, 4)), 1, { rot: -.3 + lt * .25, yank: seg(lt, 0, 1.5), loose: lt > 1.5, to: [1500, 960] });
      armchair(1720, 1000, .6);
    } else {
      boilSeed('bg9'); paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#2C2A3E', ink: null });
      phoneChat(960, 560, 1, 31.2 + lt * .85);
    }
  };
  LOOPS.kit_family.len = 140;
})();
