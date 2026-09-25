// c6_goal.js · CHAPTER 6 · GOAL! + backgammon + tag + end card · global 73.9–96.0 (audio is final, sync is law)
//
// Shots (global t)
//   A  73.90–75.00  TV insert: the picture unfreezes (white pop), GOTV corner bug, 74.3 ball in the net (punch + shake),
//                   scoreboard מכבי 2 : 1 הפועל; ANNOUNCER "Goooal! Maccabi!" from the TV.
//   B  75.00–76.15  [cut on the roar] master room: Saba squats (anticipation) and LEAPS out of the chair 75.5, confetti
//                   + Bamba puffs burst, lamp light pops, shake; Noa cheers at right.
//   C  76.15–79.20  two-shot: SABA "Gooool! Noa, you are a genius!" points at her, hops over, big hug (~77.7).
//   D  79.20–81.90  [cut in] Noa in the hug: NOA "Thank GOTV, Saba. No more freezing!" proud, presents the TV.
//   E  81.90–84.00  Saba CU: "And now... backgammon! Come, let's play!" sly, then beckons.
//   F  84.00–87.40  [cut on the lid] side table: Saba in his chair, Noa on the pouf; case opens 84.0, push in, dice
//                   85.0 (double six), checkers 85.8 / 86.4, pull back, both laugh; TV behind plays smooth (GOTV + LIVE 4K).
//   G  87.40–92.80  tag at the TV cabinet: Bit flopped exhausted under the glowing smart TV; ILVIP + EMBY stagger in,
//                   panting; ILVIP "Did... did we miss the goal?"; BIT "Sorry, guys... GOTV got here first."; 92.4 wink.
//   H  92.80–96.00  END CARD on deep navy: gotvLogo slams in, Hebrew tagline, install line, PACKET FROM HOME; Bit pops up
//                   between logo and text, 94.5 tongue out, crash zoom 94.8–95.1, hold, fade to navy 95.7–96.0.
// No old set-top box anywhere (shelfEmpty).
(() => {
  const UNF = 73.9, NET = 74.3, LEAP = 75.5, END = 92.8;
  const NAVY = '#16205A';

  // ------------------------------------------------------------------ state
  function tvOpt(t) {
    if (t < NET) return { screen: 'smooth', score: [1, 1], clock: '90:01' };
    if (t < 78.5) return { screen: 'goal', p: seg(t, NET, 76.3) };
    return { screen: 'smooth' };
  }
  const SABA_K = [
    [73.9, 'tense', { pose: 'sit', gesture: 'grip', look: [1, 0], turn: .6 }],
    [74.35, 'surprised', { look: [1, -.1], emote: '!' }],
    [75.08, 'joy', { pose: 'crouch', gesture: 'fists', look: [1, -.2] }],
    [75.42, 'joy', { pose: 'jump', gesture: 'armsUp', emote: 'spark', look: [.6, -.4] }],
    [76.05, 'joy', { pose: 'stand', gesture: 'cheer' }],
    [76.7, 'joy', { gesture: 'point', look: [1, 0], turn: .7 }],
    [77.55, 'love', { gesture: 'hug', look: [.8, .3], turn: .6, emote: 'heart' }],
    [79.4, 'laugh', { look: [.6, .4] }],
    [81.95, 'sly', { gesture: 'present', look: [1, 0], turn: .5, emote: null }],
    [83.25, 'joy', { gesture: 'reach', look: [1, .2] }],
    [84.0, 'eager', { pose: 'sit', gesture: 'reach', look: [1, .4], turn: .5 }],
    [85.0, 'surprised', { gesture: 'fists', look: [1, .5], emote: '!' }],
    [86.1, 'laugh', { gesture: 'clap', look: [1, .2] }],
  ];
  const NOA_K = [
    [73.9, 'hopeful', { gesture: 'idle', look: [-.2, -.4], turn: -.4 }],
    [74.4, 'surprised', { look: [-.4, -.4] }],
    [75.45, 'joy', { gesture: 'armsUp', emote: 'spark', look: [-.4, -.3] }],
    [76.3, 'laugh', { gesture: 'cheer', look: [.9, -.2], turn: .3 }],
    [77.4, 'joy', { gesture: 'hug', look: [.8, -.4], turn: .4 }],
    [79.3, 'proud', { look: [.8, -.5] }],
    [80.4, 'cheeky', { gesture: 'present', look: [-1, -.2], turn: -.6 }],
    [81.95, 'amused', { gesture: 'idle', look: [.8, -.4], turn: .4 }],
    [84.0, 'focused', { pose: 'crouch', gesture: 'reach', look: [-1, .5], turn: -.2 }],
    [85.0, 'surprised', { look: [-1, .6], emote: '!' }],
    [85.9, 'laugh', { gesture: 'clap', look: [-.8, 0] }],
  ];
  const sabaX = t => t < 84 ? kf(t, [[76.9, 560], [77.5, 735]], ease) : 520;
  const noaX = t => t < 84 ? kf(t, [[77.0, 1010], [77.45, 880]], ease) : 1085;
  const noaHop = t => (t > 77.0 && t < 77.45) ? -30 * Math.sin(seg(t, 77.0, 77.45) * Math.PI) : 0;
  const noaFlip = t => t < 84 ? (t > 76.25) : true;

  // ------------------------------------------------------------------ painting helpers
  const CONF = ['#F4C21F', '#2A55A8', '#E8584A', '#43AEA4', '#FBF3E3', '#F29BB0'];
  function confetti(t, t0, n = 34, key = '') {       // screen space, falls + flutters
    const a = t - t0; if (a < 0 || a > 5) return;
    boilSeed('c6 conf ' + key);
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 7.3), h2 = hash(i * 3.1 + 2), h3 = hash(i + 11);
      const burst = easeOut(clamp(a / .45));
      const x = 960 + (h1 - .5) * 2300 * burst + 40 * Math.sin(a * 3 + i);
      const y = 560 - 700 * burst * (0.5 + h2) + 260 * a * a * .35 + a * 120 + 30 * Math.sin(a * 2.3 + i * 2);
      if (y > H + 40) continue;
      const r = a * (3 + h3 * 5) + i, w = 16 + h2 * 10, hh = 9 * Math.abs(Math.cos(r));
      const c = Math.cos(r * .7), s = Math.sin(r * .7);
      const P = [[-w, -hh], [w, -hh], [w, hh], [-w, hh]].map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
      paint(P, { wash: CONF[i % CONF.length], washOp: 235 * (1 - seg(a, 4, 5)), ink: PAL.ink, sw: .45 });
    }
  }
  function bamba(x, y, s, rot) {   // one curly peanut puff
    const P = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 1 + .18 * Math.sin(a * 3); P.push([Math.cos(a) * 26 * r, Math.sin(a) * 11 * r]); }
    const c = Math.cos(rot), sn = Math.sin(rot);
    paint(P.map(([px, py]) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s]), { wash: '#E3A94A', ink: PAL.ink, sw: .6 });
  }
  function bambaBurst(t) {          // world space, from the side table
    const a = t - LEAP; if (a < 0 || a > 1.6) return;
    boilSeed('c6 bamba');
    for (let i = 0; i < 9; i++) {
      const h = hash(i * 5.7), vx = (h - .45) * 900, vy = -900 - 500 * hash(i + 3);
      const x = 860 + vx * a, y = 700 + vy * a + 1500 * a * a;
      if (y > 1000) continue;
      bamba(x, y, .9 + .5 * hash(i + 9), a * (6 + i));
    }
  }
  function caseOnPouf(t) { if (t < 84) backgammon(1105, 918, .42, { mode: 'table' }); }

  function scene(t, o = {}) {
    const late = t >= 84;
    livingRoom(t, { tv: tvOpt(t), shelfEmpty: true, bin: false, table: !late && t < LEAP, lamp: 1 + .4 * Math.exp(-Math.max(0, t - LEAP) * 3) * (t > LEAP ? 1 : 0) });
    if (!late) caseOnPouf(t);
    if (late) backgammon(860, 742, .62, { mode: t < 84.6 ? 'table' : 'board', open: seg(t, 84.0, 84.55), dice: seg(t, 85.0, 85.7), diceFrom: [120, -160], hop: seg(t, 85.8, 86.25), hop2: seg(t, 86.4, 86.85) });
    const S = famAct('saba', t, SABA_K), N = famAct('noa', t, NOA_K);
    const sx = sabaX(t), nx = noaX(t), hug = t > 77.5 && t < 81.95;
    const sArgs = { ...S, scarfWave: t > LEAP && t < 77 ? 1 : .3, boilKey: 'saba' };
    const nArgs = { ...N, flip: noaFlip(t), dy: (N.dy || 0) + noaHop(t), boilKey: 'noa' };
    const chairIn = S.rise < .5 || t < 75.2 || late;
    if (hug) {
      saba(sx, 910, .82, { ...sArgs, layer: 'body' });
      noa(nx, 950, .82, nArgs);
      saba(sx, 910, .82, { ...sArgs, layer: 'arms' });
    } else {
      saba(sx, 910, .82, sArgs);
      if (chairIn && sx < 600) armchair(520, 910, .82, 'front');
      noa(nx, late ? 972 : 950, .82, nArgs);
    }
    bambaBurst(t);
    if (o.laughFx && t > 86.1) { sfx('HA HA!', 700, 380, 64, '#F4C21F', t - 86.1, { life: 1.3, rot: -.12, stroke: NAVY }); sfx('HA!', 1180, 480, 54, '#F4C21F', t - 86.35, { life: 1.1, rot: .1, stroke: NAVY }); }
  }
  function cam(t, cx, cy, z, sh = [0, 0]) { camBegin(cx + 6 * wob(t, .23) + sh[0], cy + 4 * wob(t, .17, .3) + sh[1], z); }

  // ------------------------------------------------------------------ shots
  function shotA(t, lt) {        // TV insert: unfreeze → GOAL
    const hit = t - NET, sh = hit > 0 ? shakeXY(t, 22 * Math.exp(-hit * 6)) : [0, 0];
    const z = kf(t, [[UNF, 1600], [NET, 1650], [NET + .12, 1780], [75.0, 1820]], easeOut);
    boilSeed('c6 tvwall');
    paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#C9A07A', ink: null });
    paint(ellPts(960, 540, 1100, 700, 24, 6), { wash: '#E7C49A', washOp: 150, ink: null });
    const w = z, h = w * 286 / 480;
    tvSet(960 - w / 2 + sh[0], 560 - h / 2 + sh[1], w, h, t, { ...tvOpt(t), noStand: true });
    flash(.8 * Math.exp(-(t - UNF) * 9), '#FFFDF6');
    if (hit > 0) { flash(.4 * Math.exp(-hit * 10), '#FFF4C8'); sfx('GOOOAL!', 960, 430, 150, '#F4C21F', t - 74.5, { life: 1.1, rot: -.06, stroke: '#1E3F96' }); }
  }
  function shotB(t, lt) {        // the LEAP
    const sh = t > LEAP ? shakeXY(t, 14 * Math.exp(-(t - LEAP) * 5)) : [0, 0];
    const z = kf(t, [[75.0, 1.22], [LEAP, 1.3], [LEAP + .15, 1.16], [76.15, 1.12]], easeOut);
    cam(t, 780, 590 - 30 * ease(seg(t, LEAP, 76)), z, sh);
    scene(t);
    camEnd();
    if (t > LEAP) flash(.35 * Math.exp(-(t - LEAP) * 8), '#FFF4C8');
    confetti(t, LEAP, 38, 'b');
  }
  function shotC(t, lt) {        // "Gooool! Noa, you are a genius!" + hug
    const cx = kf(t, [[76.15, 760], [77.6, 800], [79.2, 810]], ease), z = kf(t, [[76.15, 1.55], [77.6, 1.62], [79.2, 1.72]], ease);
    cam(t, cx, 640, z);
    scene(t);
    camEnd();
    confetti(t, LEAP, 38, 'b');
  }
  function shotD(t, lt) {        // Noa: "Thank GOTV, Saba. No more freezing!"
    cam(t, 860 - 20 * ease(seg(lt, 0, 2.7)), 650, 2.25 + .08 * ease(seg(lt, 0, 2.7)));
    scene(t);
    camEnd();
    confetti(t, LEAP, 20, 'd');
  }
  function shotE(t, lt) {        // Saba: "And now... backgammon!"
    cam(t, 760 + 15 * ease(seg(lt, 0, 2)), 560, 2.2 + .1 * ease(seg(lt, 0, 2)));
    scene(t);
    camEnd();
  }
  function shotF(t, lt) {        // the game
    const c = kf(t, [[84.0, [980, 620, 1.18]], [84.8, [900, 690, 1.6]], [85.9, [880, 700, 1.72]], [86.6, [980, 630, 1.2]]], ease);
    const sh = t > 85.45 && t < 85.8 ? shakeXY(t, 4) : [0, 0];
    cam(t, c[0], c[1], c[2], sh);
    scene(t, { laughFx: true });
    camEnd();
  }
  function shotG(t, lt) {        // tag at the TV cabinet
    const c = kf(t, [[87.4, [1540, 600, 1.75]], [88.4, [1560, 610, 1.85]], [89.7, [1520, 620, 2.0]], [90.2, [1440, 630, 2.5]], [92.8, [1420, 630, 2.75]]], ease);
    cam(t, c[0], c[1], c[2]);
    livingRoom(t, { tv: { screen: 'smooth' }, shelfEmpty: true, bin: false });
    const BM = packMoods(t, [[87.4, 'exhausted'], [89.75, 'cheeky', { lookX: .8 }], [92.3, 'cheeky', { lookX: .9 }]]);
    const wink = ease(seg(t, 92.35, 92.5)) * (1 - ease(seg(t, 92.7, 92.8)));
    bit(1410, 704, 1.35, { ...BM, limbs: BM.mood === 'exhausted' ? 'flop' : 'stand', wink, glow: .9, boilKey: 'bit' });
    // the rivals stagger in from the right along the cabinet top
    const iw = seg(t, 87.4, 88.6), ew = seg(t, 87.7, 89.3);
    const ix = lerp(1930, 1620, easeOut(iw)), ex = lerp(2020, 1760, easeOut(ew));
    const IM = packMoods(t, [[87.4, 'panting'], [90.8, 'shock']]);
    const EM = packMoods(t, [[87.4, 'panting'], [91.2, 'sleepy']]);
    brandPacket(ex, 704, 1.2, { ...EM, brand: 'EMBY', flip: true, walk: ew < 1 ? t * 2 : undefined, rot: .06 * Math.sin(t * 5), boilKey: 'emby' });
    brandPacket(ix, 704, 1.3, { ...IM, brand: 'ILVIP', flip: true, walk: iw < 1 ? t * 2.2 : undefined, rot: -.05 * Math.sin(t * 4.3), boilKey: 'ilvip' });
    camEnd();
  }
  function endBg(t) {
    boilSeed('c6 end bg');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: NAVY, ink: null });
    paint(ellPts(960, 520, 900, 520, 30, 10), { wash: '#2B3C8E', washOp: 170, ink: null });
    paint(ellPts(960, 1180, 1300, 330, 26, 10), { wash: '#E7C49A', washOp: 120, ink: null });
    for (let i = 0; i < 14; i++) {        // twinkles
      const x = 80 + hash(i * 3.3) * 1760, y = 60 + hash(i * 1.7 + 4) * 560, k = .5 + .5 * Math.sin(t * 3 + i * 2);
      if (Math.abs(x - 960) < 460 && y > 150 && y < 460) continue;
      paint(starPts(x, y, 6 + 8 * k, .35, 4), { wash: '#FFE08A', washOp: 150 + 90 * k, ink: null });
    }
  }
  function shotH(t, lt) {        // END CARD
    endBg(t);
    const zk = backOut(seg(t, 94.8, 95.1)), z = 1 + 1.9 * zk;
    const bx = 960, by = 735, fy = 610;           // Bit's feet, his face centre
    camBegin(960 + (bx - 960) * zk, 540 + (fy - 540) * zk, z);
    gotvLogo(960, 245, .85, t, { pop: seg(t, END, END + .9) });
    // Bit pops up between the logo and the text
    const up = backOut(seg(t, 93.35, 93.75));
    if (up > .01) {
      const BM = packMoods(t, [[93.3, 'joy'], [94.45, 'tongue']]);
      const bob = 4 * Math.sin(t * 5);
      bit(bx, by + (1 - up) * 160, 2.05 * Math.max(.2, up), { ...BM, sq: BM.sq + (1 - up) * -.3, dy: BM.dy + bob / 24, limbs: t < 94.45 ? 'armsUp' : 'stand', glow: 1.2, boilKey: 'bitend', mouth: t < 94.45 ? 'smile' : undefined, tag: true });
      if (t > 94.45) sfx('נה נה!', bx + 190, fy - 90, 44, '#F4C21F', t - 94.5, { life: 1.4, rot: .12, font: '900 44px Rubik', stroke: NAVY });
    }
    const tk = seg(t, 93.6, 94.1), tk2 = seg(t, 93.9, 94.4), tk3 = seg(t, 94.1, 94.6);
    letter('הטלוויזיה של ישראל', 960, 830, 92, '#FBF3E3', { pop: tk * 1.2, font: '900 92px Rubik', stroke: NAVY });
    letter('(התקנת אפליקציה על המסך החכם)', 960, 915, 46, '#F4C21F', { pop: tk2 * 1.2, font: '700 46px Rubik', ink: false });
    letter('PACKET FROM HOME · חבילה מהבית', 960, 985, 30, '#C9D3F2', { pop: tk3 * 1.2, font: '700 30px Rubik', ink: false });
    camEnd();
    if (t > 94.8 && t < 95.15) flash(.25 * (1 - seg(t, 94.8, 95.15)), '#FFF4C8');
    if (t > 95.7) { flushLetters(); flash(ease(seg(t, 95.7, 96.0)), '#0E1440'); }
  }

  shots([[73.9, shotA], [75.0, shotB], [76.15, shotC], [79.2, shotD], [81.9, shotE], [84.0, shotF], [87.4, shotG], [END, shotH]]);
})();
