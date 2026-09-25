// c2_home.js · CHAPTER 2 · Toronto living room, snowy night · global 10.2–39.2 (audio is final, sync is law)
//
// Shots (global t) · transitions · reads
//   A  10.20–14.35  [in: soft gold-white wash fades off C1's flash]  close on the snowy window (Toronto, snow), a quick
//                   eased pan down onto Saba in his armchair (MCU) for "Noa! Eighty-nine minutes. One one." (eager,
//                   gripping the armrests, eyes on the TV), then a slow pull back to the master for "This is it."
//   B  14.35–16.45  [cut on action: Noa steps in and lifts the case]  two-shot favouring Noa: "Saba, come play
//                   backgammon with me!" hopeful, case offered up; Saba (left) never takes his eyes off the TV.
//   C  16.45–18.45  [cut on Saba's wave-off]  Saba close-up: "Not now, motek!" waves her off, eyes on the TV;
//                   "I'm in the middle of the game!" rises out of the chair, camera tilts up with him. Noa deflates at right.
//   D  18.45–20.00  [eyeline cut to the TV]  TV insert, live breakaway; 19.3 FREEZE: jolt, blocks, spinner, % creeping.
//   E  20.00–21.75  [snap zoom]  Saba face: "No! Not now!" horror take, hands on head.
//   F  21.75–23.10  [cut on the take]  Saba vs. the TV (error): "Again?!" angry point at the screen.
//   G  23.10–24.55  [push in]  TV error insert (שגיאה) shaking on "gets stuck!"; exits on a whip pan left.
//   H  24.55–28.75  [whip pan in]  two-shot on Noa: knowing look, "...old provider, Saba." then cheeky
//                   "Everyone switched to GOTV!", turns toward the cabinet.
//   J  28.75–30.58  [cut on action: her hop]  cabinet: "Bye-bye, old box!" crouch, grab, YANK (cable spaghetti, TV
//                   goes dark), box overhead, tossed backwards over her shoulder into the bin: CRASH 30.4.
//   K  30.58–31.30  [smash cut on the crash]  Saba jumps out of his skin (!!); shelf empty from here on.
//   W  31.30–35.20  [phone swings up into frame]  WhatsApp close-up (phoneChat): typing, send 32.4, rep typing 33.4,
//                   reply 34.2 "בכיף! המנוי מופעל" with a sparkle; phone drops out of frame.
//   L  35.20–36.35  [tilt-down swish]  room: GOTV app pops on the smart TV: "Activated! Look, Saba!" Noa presents it.
//   L2 36.35–37.00  [cut on look]  Saba close-up, wonder, lit by the screen.
//   M  37.00–39.20  [light]  gold light pours out of the TV over both of them; push INTO the screen; 38.7–39.2 gold-white
//                   flash (C3 opens out of it).
(() => {
  const FREEZE = 19.3, ERR = 21.85, YANK = 29.3, CRASH = 30.4, APP = 35.3, GOLD = 37.0;
  const GW = '#FFF4D8';                                   // gold-white of the flashes
  const BIN = [1170, 912];

  // ------------------------------------------------------------------ state as a function of global t
  function tvOpt(t) {
    if (t < FREEZE) return { screen: 'live', play: t };
    if (t < ERR) return { screen: 'freeze', freezeAt: FREEZE, pct: Math.floor(kf(t, [[19.45, 0], [20.2, 21], [20.9, 34], [21.6, 37]], easeOut)) };
    if (t < YANK + .05) return { screen: 'error' };
    if (t < APP) return { screen: 'off' };
    return { screen: 'app', p: seg(t, APP, 36.9) };
  }
  const goldK = t => ease(seg(t, GOLD, 38.3));

  // Saba: one continuous performance across every shot (global key times)
  const SABA_K = [
    [10.2, 'eager', { pose: 'sit', gesture: 'grip', look: [.8, 0], turn: .5 }],
    [10.85, 'eager', { look: [.9, -.35], turn: .7 }],
    [11.9, 'eager', { gesture: 'fists', look: [.9, 0], turn: .5 }],
    [13.25, 'tense', { gesture: 'grip', look: [1, 0] }],
    [16.45, 'dismiss', { gesture: 'waveOff', look: [1, 0], turn: .6 }],
    [17.3, 'eager', { pose: 'rise', gesture: 'fists', look: [1, 0] }],
    [18.0, 'eager', { pose: 'stand', gesture: 'reach', look: [1, 0], turn: .6 }],
    [20.02, 'horror', { gesture: 'headHands', look: [.4, 0], turn: .3 }],
    [21.78, 'angry', { gesture: 'point', look: [1, 0], turn: .7 }],
    [23.3, 'angry', { gesture: 'fists' }],
    [24.5, 'sad', { gesture: 'idle', look: [.8, .1], turn: .5 }],
    [27.45, 'surprised', { look: [.9, 0] }],
    [28.6, 'neutral', { look: [1, 0], turn: .6 }],
    [30.5, 'surprised', { pose: 'jump', gesture: 'armsUp', emote: '!!', look: [1, -.2] }],
    [30.95, 'surprised', { pose: 'stand', gesture: 'idle', emote: '!!' }],
    [35.4, 'surprised', { look: [1, -.1], turn: .8, emote: '!' }],
    [36.4, 'joy', { gesture: 'reach', look: [1, -.1], turn: .8 }],
    [37.3, 'surprised', { gesture: 'armsUp', emote: 'spark' }],
  ];
  // Noa: faces left (toward Saba) until 28.5, then right (the cabinet / the TV)
  const NOA_K = [
    [10.2, 'hopeful', { gesture: 'case', gk: .15, look: [.6, -.2] }],
    [14.42, 'hopeful', { gk: 1, look: [.8, -.3] }],
    [16.7, 'surprised', { gk: .5 }],
    [17.35, 'sad', { gk: 0, look: [.4, .3] }],
    [19.55, 'surprised', { look: [-1, -.1], turn: -.5 }],
    [22.2, 'amused', { look: [.8, 0], turn: 0 }],
    [24.45, 'amused', { gesture: 'idle', hold: false, look: [.9, 0] }],
    [27.3, 'cheeky', { gesture: 'present', look: [1, 0] }],
    [28.45, 'determined', { gesture: 'idle', look: [1, .2] }],
    [29.02, 'determined', { pose: 'crouch', gesture: 'reach', look: [1, .5] }],
    [29.3, 'determined', { pose: 'stand', gesture: 'box', gk: .15, hold: 'box', look: [.6, -.4] }],
    [29.6, 'cheeky', { gk: 1 }],
    [30.07, 'cheeky', { gesture: 'armsUp', hold: false }],
    [30.55, 'proud', { gesture: 'clap' }],
    [31.0, 'focused', { gesture: 'phone', hold: 'phone', look: [.3, .6] }],
    [35.25, 'joy', { gesture: 'present', hold: false, look: [-1, 0], turn: -.7 }],
    [37.2, 'surprised', { gesture: 'armsUp', look: [.8, -.2], turn: .4 }],
  ];
  const noaFlip = t => t < 28.52;
  function noaX(t) {
    if (t < 28.5) return 1010;
    return kf(t, [[28.55, 1010], [29.0, 1285]], ease);
  }
  const noaHop = t => (t > 28.55 && t < 29.0) ? -26 * Math.abs(Math.sin(seg(t, 28.55, 29.0) * Math.PI * 2)) : 0;

  // ------------------------------------------------------------------ painting helpers
  function bin(t) {
    const [bx, by] = BIN, wb = spring(t, CRASH, 5, 26) * .12;
    push(); translate(bx, by); rotate(wb); translate(-bx, -by);
    boilSeed('c2 bin');
    paint([[bx - 44, by - 96], [bx + 44, by - 96], [bx + 34, by], [bx - 34, by]], { wash: '#8C95A8', ink: PAL.ink, sw: 1 });
    for (let i = -2; i <= 2; i++) inkLine([[bx + i * 16, by - 90], [bx + i * 12.5, by - 6]], .6, '#6B7488', 'inkfine', 0);
    paint(ellPts(bx, by - 96, 46, 10, 14), { wash: '#4E5566', ink: PAL.ink, sw: .9 });
    pop();
  }
  // the old box after it lands: jammed into the bin, cables flopping over the rim (drawn before the bin front)
  function boxInBin(t) {
    if (t < CRASH) return;
    const [bx, by] = BIN, sink = easeOut(seg(t, CRASH, CRASH + .12));
    oldBox(bx + 6, by - 70 + 26 * sink, .5, { rot: .55 + spring(t, CRASH, 5, 22) * .2, cables: .5, loose: true, to: [bx + 90, by - 20], led: 'off' });
  }
  function binFront(t) {
    if (t < CRASH) return;
    const [bx, by] = BIN, wb = spring(t, CRASH, 5, 26) * .12;
    push(); translate(bx, by); rotate(wb); translate(-bx, -by);
    boilSeed('c2 bin front');
    paint([[bx - 42, by - 70], [bx + 42, by - 70], [bx + 34, by], [bx - 34, by]], { wash: '#8C95A8', ink: PAL.ink, sw: 1 });
    for (let i = -2; i <= 2; i++) inkLine([[bx + i * 15, by - 64], [bx + i * 12.5, by - 6]], .6, '#6B7488', 'inkfine', 0);
    pop();
  }
  // flying box: leaves Noa's raised hands at 30.07, over her shoulder, into the bin at 30.4
  function flyingBox(t) {
    if (t < 30.07 || t >= CRASH) return;
    const k = seg(t, 30.07, CRASH), p = arcPt([1265, 560], [BIN[0] + 6, BIN[1] - 110], 150, easeIn(k) * .35 + k * .65);
    oldBox(p[0], p[1], .56, { rot: -k * 4.2, cables: .8, loose: true, to: [p[0] + 120 - k * 60, p[1] + 40], led: 'off' });
  }
  function crashFx(t) {
    const a = t - CRASH; if (a < 0 || a > .7) return;
    const [bx, by] = BIN, k = easeOut(a / .35);
    boilSeed('c2 crash');
    for (let i = 0; i < 5; i++) { const ang = -Math.PI / 2 + (i - 2) * .5, r = 50 + 70 * k; paint(ellPts(bx + Math.cos(ang) * r, by - 100 + Math.sin(ang) * r * .7, 22 * (1 - a / .7) + 4, 16 * (1 - a / .7) + 3, 9, 3), { wash: '#E8DCC6', washOp: 220 * (1 - a / .7), ink: null }); }
    if (a < .25) paint(starPts(bx, by - 110, 60 + 60 * k, .42, 7, .3), { wash: '#FFE08A', washOp: 230 * (1 - a / .25), ink: PAL.ink, sw: 1.1 });
  }
  // 37.0: gold light pours out of the TV (my own cheap version: washes + one glow; tvSet's gold is ~25 glows)
  function goldPour(t, g) {
    const [x, y, w, h] = FAM_ROOM.tv, cx = x + w / 2, cy = y + h / 2;
    boilSeed('c2 gold');
    paint(rectPts(x + w * .035, y + w * .035, w * .93, h - w * .07), { wash: '#FFF3C8', washOp: 255 * seg(g, .15, .7), ink: null });
    for (let i = 0; i < 7; i++) {
      const a = (i + .3) / 7 * TAU + .05 * Math.sin(t * 2 + i), L = (500 + 300 * hash(i)) * g, sp = .09;
      paint([[cx, cy], [cx + Math.cos(a - sp) * L, cy + Math.sin(a - sp) * L * .8], [cx + Math.cos(a + sp) * L, cy + Math.sin(a + sp) * L * .8]], { wash: '#FFE08A', washOp: 70 * g, ink: null });
    }
    glow(cx, cy, w * (.8 + 1.4 * g), '#FFC84A', g);
  }
  function caseOnPouf(t) {
    if (t < 24.45) return;
    backgammon(1085 + 20, 918, .42, { mode: 'table' });
  }
  // the whole room with the cast, in world space (call inside the camera)
  function scene(t, o = {}) {
    const tv = tvOpt(t), g = goldK(t);
    livingRoom(t, {
      tv, bin: false, shelfEmpty: t >= YANK, gold: 0, tvLight: tv.screen === 'off' ? 0 : 1,
      box: { shake: t > 29.02 && t < YANK ? 4 : 0, yank: seg(t, 29.1, YANK), led: 'red' },
      lamp: 1 - .35 * g,
    });
    if (tv.screen === 'app' && t < APP + 1.2) glow(1540, 547, 500 * backOut(seg(t, APP, APP + .4)), '#FFD36A', .45 * (1 - seg(t, APP + .4, APP + 1.2)) + .15);
    if (t > YANK && t < YANK + .25) glow(1540, 547, 260, '#FFFFFF', 1 - seg(t, YANK, YANK + .25));   // TV blinks off
    if (g > 0) goldPour(t, g);
    boxInBin(t); bin(t); binFront(t);
    caseOnPouf(t);
    // Saba
    const S = famAct('saba', t, SABA_K);
    saba(520, 910, .82, { ...S, scarfWave: t > 30.5 && t < 31.3 ? 1 : 0, boilKey: 'saba' });
    if (S.rise < .5) armchair(520, 910, .82, 'front');
    // Noa
    const N = famAct('noa', t, NOA_K);
    const yk = seg(t, YANK, YANK + .3);
    noa(noaX(t), 950, .82, { ...N, flip: noaFlip(t), dy: N.dy + noaHop(t), boilKey: 'noa',
      boxO: { yank: yk, loose: t > YANK + .3, to: [1460, 850], cables: .9, led: 'red', shake: t < YANK + .3 ? 3 : 0 } });
    flyingBox(t);
    crashFx(t);
    // gold light washes over the cast
    if (g > 0) glow(1100, 580, 1300 * g, '#FFC84A', .55 * g);
  }
  // camera with a hand-held drift
  function cam(t, cx, cy, z, sh = [0, 0]) {
    camBegin(cx + 6 * wob(t, .23) + sh[0], cy + 4 * wob(t, .17, .3) + sh[1], z);
  }
  // horizontal smear streaks for whip pans (screen space)
  function streaks(k, key) {
    if (k <= .01) return;
    boilSeed('c2 streaks ' + key);
    for (let i = 0; i < 9; i++) {
      const y = 60 + i * 120 + hash(i * 3) * 60, l = 900 + 700 * hash(i + 1), x = hash(i + 7) * W - 300;
      paint(ribbon([[x, y], [x + l / 2, y + 4], [x + l, y]], 40 + 60 * hash(i + 2), 6), { wash: ['#E7C49A', '#C9A07A', '#F2B25C', '#9A643F'][i % 4], washOp: 200 * k, ink: null });
    }
  }

  // ------------------------------------------------------------------ shots
  function shotA(t, lt, dur) {   // window → Saba MCU → master
    const c = kf(t, [[10.2, [955, 345, 2.45]], [10.5, [950, 360, 2.35]], [10.98, [570, 575, 2.0]], [12.9, [585, 570, 2.1]], [14.0, [960, 600, 1.08]]], ease);
    cam(t, c[0], c[1], c[2]);
    scene(t);
    camEnd();
    const inK = 1 - ease(seg(t, 10.2, 10.75));
    flash(inK, GW);
  }
  function shotB(t, lt) {        // Noa offers the backgammon case
    const z = 1.8 + .07 * ease(seg(lt, 0, 2.1));
    cam(t, 790 + 40 * ease(seg(lt, 0, 2.1)), 675, z);
    scene(t);
    camEnd();
  }
  function shotC(t, lt) {        // "Not now, motek!" CU, rises
    const cy = kf(t, [[16.45, 610], [17.3, 605], [18.1, 545]], ease);
    cam(t, 620 + 20 * seg(lt, 0, 2), cy, 1.95);
    scene(t);
    camEnd();
  }
  function tvWall(t, key) {
    boilSeed('c2 tvwall ' + key);
    paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#C9A07A', ink: null });
    paint(ellPts(960, 540, 1100, 700, 24, 6), { wash: '#E7C49A', washOp: 110, ink: null });
  }
  function insert(t, lt, opt, push0, push1, sh = [0, 0]) {
    const k = ease(seg(lt, 0, 2)), w = lerp(push0, push1, k), h = w * 286 / 480;
    tvWall(t, 'ins');
    tvSet(960 - w / 2 + sh[0], 560 - h / 2 + sh[1], w, h, t, { ...opt, noStand: true });
  }
  function shotD(t, lt) {        // TV insert: live → FREEZE
    const fz = t - FREEZE, sh = fz > 0 ? shakeXY(t, 18 * Math.exp(-fz * 6)) : [0, 0];
    insert(t, lt, tvOpt(t), 1640, 1760, sh);
    if (fz > 0) flash(.55 * Math.exp(-fz * 9), '#E8ECFF');
    if (lt < .12) streaks(1 - lt / .12, 'd');
  }
  function shotE(t, lt) {        // "No! Not now!" snap zoom
    const z = lerp(1.5, 2.55, backOut(seg(lt, 0, .2))), sh = shakeXY(t, 5 * Math.exp(-lt * 4));
    cam(t, 560, 545, z, sh);
    scene(t);
    glow(700, 520, 380, '#B8BCD0', .35);           // cold frozen-screen light on his face
    camEnd();
  }
  function shotF(t, lt) {        // "Again?!" Saba vs the error screen
    const z = 1.3 + .06 * ease(seg(lt, 0, 1.3));
    cam(t, 1060, 560, z, shakeXY(t, 6 * Math.exp(-Math.max(0, t - 21.8) * 5)));
    scene(t);
    if (t > ERR && t < ERR + .2) glow(1540, 547, 300, '#FFFFFF', 1 - seg(t, ERR, ERR + .2));
    camEnd();
  }
  function shotG(t, lt, dur) {   // error insert, shakes on "stuck!", whips out left
    const hit = Math.max(0, t - 23.9), sh = shakeXY(t, t > 23.9 ? 16 * Math.exp(-hit * 5) : 0);
    const wx = lt > dur - .16 ? -easeIn(seg(lt, dur - .16, dur)) * 900 : 0;
    insert(t, lt, tvOpt(t), 1500, 1640, [sh[0] + (-wx), sh[1]]);
    streaks(seg(lt, dur - .16, dur), 'g');
  }
  function shotH(t, lt) {        // Noa's knowing look
    const wx = lt < .22 ? -(1 - easeOut(lt / .22)) * 700 : 0;
    const k = ease(seg(t, 24.8, 28.3));
    cam(t, lerp(800, 880, k) + wx, lerp(650, 630, k), lerp(1.45, 1.75, k));
    scene(t);
    camEnd();
    if (lt < .22) streaks(1 - lt / .22, 'h');
  }
  function shotJ(t, lt) {        // yank + toss
    const sh = [shakeXY(t, t > YANK ? 10 * Math.exp(-(t - YANK) * 7) : 0), shakeXY(t + 3, t > CRASH ? 16 * Math.exp(-(t - CRASH) * 7) : 0)];
    const cx = kf(t, [[28.75, 1150], [29.2, 1300], [29.95, 1300], [30.35, 1240]], ease);
    cam(t, cx, 700, 1.7, [sh[0][0] + sh[1][0], sh[0][1] + sh[1][1]]);
    scene(t);
    camEnd();
  }
  function shotK(t, lt) {        // Saba jumps at the crash
    cam(t, 560, 515, 1.85, shakeXY(t, 9 * Math.exp(-lt * 6)));
    scene(t);
    camEnd();
  }
  function phoneBg(t) {          // soft out-of-focus room behind the phone: washes only (fills are costly here)
    boilSeed('c2 phone bg');
    paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#D9B78E', ink: null });
    paint(ellPts(260, 300, 520, 420, 24, 8), { wash: '#F2B25C', washOp: 120, ink: null });
    paint(ellPts(1560, 420, 420, 300, 24, 8), { wash: '#6E6A8C', washOp: 60, ink: null });
    paint(ellPts(1650, 900, 520, 260, 24, 8), { wash: '#9A643F', washOp: 110, ink: null });
    for (const [bx, by, r] of [[1400, 250, 60], [1700, 180, 44], [520, 820, 50]]) paint(ellPts(bx, by, r, r, 14), { wash: '#FFE9B8', washOp: 110 + 40 * wob(t, .5, bx), ink: null });
    glow(300, 280, 380, '#FFB85A', .6);
    paint(ellPts(560, 1180, 520, 330, 22, 6), { wash: '#3FA59C', washOp: 170, ink: null });   // Noa's hoodie, soft behind
  }
  function shotW(t, lt, dur) {   // WhatsApp close-up: frame the typing, then glide up to the bubbles
    phoneBg(t);
    const up = backOut(seg(lt, 0, .38)), down = easeIn(seg(lt, dur - .28, dur)), PH = 931;
    const y = lerp(1700, 545, up) + 1500 * down + 5 * wob(t, .4);
    const x = 1010 + 4 * wob(t, .31, .2) + (t > 34.2 ? 8 * spring(t, 34.2, 6, 20) : 0);
    const cy = kf(t, [[31.3, 545 + .24 * PH], [32.3, 545 + .22 * PH], [32.8, 545 - .1 * PH]], ease), z = kf(t, [[31.3, 1.3], [32.3, 1.4], [32.8, 1.62], [35.2, 1.7]], ease);
    camBegin(1010 + 5 * wob(t, .2), cy, z);
    if (t > 34.2) glow(x, y - 200, 420, '#8CE0A0', .45 * Math.exp(-(t - 34.2) * 1.5) + .1);
    phoneChat(x, y, .95, t);
    if (t > 34.25 && t < 35.1) {
      boilSeed('c2 sparkles');
      for (let i = 0; i < 6; i++) { const a = t - 34.25 - i * .06, k = backOut(seg(a, 0, .25)) * (1 - seg(a, .5, .8)); if (k > .02) paint(starPts(x - 250 + hash(i) * 500, y - 330 + hash(i + 5) * 200 - a * 50, 16 * k, .35, 4), { wash: '#FFE08A', ink: PAL.ink, sw: .6 }); }
    }
    camEnd();
    if (lt > dur - .28) streaks(seg(lt, dur - .2, dur) * .6, 'w');
  }
  function shotL(t, lt) {        // "Activated! Look, Saba!"
    const tilt = lt < .25 ? -(1 - easeOut(lt / .25)) * 260 : 0;
    cam(t, 1010, 600 + tilt, 1.13 + .04 * ease(seg(lt, 0, 1.1)));
    scene(t);
    camEnd();
    if (lt < .2) streaks((1 - lt / .2) * .5, 'l');
  }
  function shotL2(t, lt) {       // Saba's wonder
    cam(t, 600 - 20 * ease(seg(lt, 0, .65)), 545, 2.15 + .1 * ease(seg(lt, 0, .65)));
    scene(t);
    glow(760, 520, 420, '#FFD36A', .45 + .1 * wob(t, 3));
    camEnd();
  }
  function shotM(t, lt) {        // gold pours out, push into the screen, flash
    const k = easeIn(seg(t, 37.35, 38.95));
    const cx = lerp(1080, 1540, ease(seg(t, 37.2, 38.6))), cy = lerp(600, 547, ease(seg(t, 37.2, 38.6)));
    cam(t, cx, cy, lerp(1.02, 6.5, k));
    scene(t);
    camEnd();
    if (lt < .15) flash(.5 * (1 - lt / .15), '#FFE9A8');
    flash(ease(seg(t, 38.15, 38.6)), '#FFF0C0');     // the screen's light fills the frame (the zoomed screen wash can drop out)
    flash(ease(seg(t, 38.55, 38.95)) * .85 + ease(seg(t, 38.95, 39.15)) * .15, GW);
  }

  shots([[10.2, shotA], [14.35, shotB], [16.45, shotC], [18.45, shotD], [20.0, shotE], [21.75, shotF], [23.1, shotG],
         [24.55, shotH], [28.75, shotJ], [30.58, shotK], [31.3, shotW], [35.2, shotL], [36.35, shotL2], [37.0, shotM]]);
})();
