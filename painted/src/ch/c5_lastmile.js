// c5_lastmile.js · CHAPTER 5 · the last mile · global 69.4–73.9 (audio is final, sync is law)
//
// Shots (global t) · transitions · reads
//   A  69.40–71.15  [in: gold-white flash off C4's streak]  STREET oner: a light streak erupts from the snow at the pole
//                   base, Bit rockets up the pole, zips along the sagging wire, into the warm lit window; camera follows
//                   low, pulls back for the snowy street, then pushes into the window.  "Last mile... last meter..."
//   B  71.15–72.15  [cut on the window glow]  MACRO behind the TV cabinet: Bit races along the fat cable from the wall
//                   socket, hurdles a lost Bamba puff (71.6), leaps up out of frame (72.05).
//   C  72.15–72.95  [cut on action: he lands]  SMART TV (frozen, spinner 99%): Bit hops onto the cabinet, crouch,
//                   "Delivered!" (72.5), dives INTO the screen; 72.8 IMPACT: TV jolts, flash.
//   D  72.95–73.90  [white settles]  TV close-up: frozen picture, spinner 99% → gold pulse → 100% (73.45).
(() => {
  const GW = '#FFF4D8', IMPACT = 72.8;
  const bitMood = t => packMoods(t, [[69.4, 'determined'], [71.95, 'joy'], [72.3, 'cheeky'], [72.5, 'joy']]);
  const polyLen = P => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };
  function along(P, k) {
    let want = clamp(k) * polyLen(P);
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (want <= l || i === P.length - 1) { const u = l ? clamp(want / l) : 0; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
      want -= l;
    }
    return [...P[0], 0];
  }

  // ---------------------------------------------------------------- A · street
  const pathK = t => {
    const { poleTop, windowSill } = streetPathK;
    if (t < 69.5) return 0;
    if (t < 69.95) return lerp(0, poleTop, easeIn(seg(t, 69.5, 69.95)) * .7 + seg(t, 69.5, 69.95) * .3);
    if (t < 70.8) return lerp(poleTop, windowSill, ease(seg(t, 69.95, 70.8)) * .6 + seg(t, 69.95, 70.8) * .4);
    return lerp(windowSill, 1, easeIn(seg(t, 70.8, 71.0)));
  };
  function shotA(t, lt) {
    const k = pathK(t), [px, py, ang] = streetPath(k), onPole = k < streetPathK.poleTop;
    const [cx, cy, z] = kf(t, [[69.4, [760, 780, 1.7]], [69.95, [790, 400, 1.45]], [70.4, [1010, 470, 1.15]], [70.78, [1280, 470, 1.4]], [71.15, [1395, 485, 3.0]]]);
    torontoStreet(t, { cam: { x: cx, y: cy, zoom: z, rot: onPole ? -.03 : 0 }, keepCam: true, window: 1 + .6 * seg(t, 70.9, 71.1) });
    const { x: pX, base } = STREET.pole;
    // the eruption at the pole base
    if (t < 69.75) {
      const e = 1 - seg(t, 69.45, 69.75);
      boilSeed('c5 erupt'); glow(pX, base - 10, 260 * e + 60, '#FFC24A', e);
      paint(ribbon([[pX, base + 20], [pX + 4, lerp(base, py, .5)], [pX, py]], 36 * e + 4, 8), { wash: '#FFE9A8', washOp: 220 * e, ink: null });
    }
    if (k < .995) {
      const m = bitMood(t), dir = onPole ? [0, -1] : [Math.cos(ang), Math.sin(ang)], sp = onPole ? 1400 : 900;
      bit(px + (onPole ? -2 : 0), py, .8, { ...m, limbs: onPole ? 'fly' : 'run', phase: t * 4, rot: onPole ? -.08 : ang * .8, vel: [dir[0] * sp, dir[1] * sp], boilKey: 'c5bit' });
      // snow puffs knocked off the wire behind him
      if (!onPole) for (let i = 0; i < 3; i++) {
        const age = (t * 6 + i / 3) % 1, [qx, qy] = streetPath(Math.max(streetPathK.poleTop, k - .04 - i * .02));
        boilSeed('c5 puff' + i); paint(ellPts(qx - 10 * i, qy + 10 + age * 80, 9 + 6 * age, 7 + 5 * age, 10), { wash: '#EEF2F8', washOp: 200 * (1 - age), ink: null });
      }
    }
    camEnd();
    flash(1 - seg(lt, 0, .3), GW);
    if (t > 70.95) flash(.8 * ease(seg(t, 70.98, 71.15)), '#FFD98A');
  }

  // ---------------------------------------------------------------- B · behind the TV cabinet (macro)
  const CABLE = through([[150, 600], [230, 760], [560, 858], [1000, 842], [1440, 720], [1700, 470], [1780, 120], [1800, -120]], 6);
  const bitRun = t => ease(seg(t, 71.18, 72.12)) * .8 + seg(t, 71.18, 72.12) * .2;
  function shotB(t, lt) {
    const k = bitRun(t), [bx, by, ang] = along(CABLE, k);
    camBegin(lerp(760, 1180, ease(seg(t, 71.15, 72.1))), lerp(620, 520, ease(seg(t, 71.6, 72.15))), 1.1);
    boilSeed('c5 wall');
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: '#3B2B2E', ink: null });
    paint(ellPts(1500, 120, 900, 520, 26, 10), { wash: '#6A4636', washOp: 150, ink: null });
    glow(1650, 60, 520, '#FFC77A', .7);
    // cabinet back panel (top) and the dusty floor
    boilSeed('c5 cab');
    paint(rectPts(-200, -200, W + 400, 330, 4), { wash: '#5C3E2E', ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 4; i++) inkLine([[-100, 60 + i * 60 + 8 * hash(i)], [W + 100, 70 + i * 60]], .5, '#4A3024', 'inkfine', .3);
    paint(rectPts(-200, 800, W + 400, 500, 6), { wash: '#5A4238', ink: null });
    // wall socket
    boilSeed('c5 socket');
    paint(rrPts(90, 500, 130, 170, 14), { wash: '#E9DFC8', ink: PAL.ink, sw: 1 });
    paint(rrPts(128, 548, 54, 60, 8), { wash: '#B8AE98', ink: PAL.ink, sw: .8 });
    // dust bunnies
    [[420, 905, 34], [1330, 880, 26]].forEach(([dx, dy, r], i) => { boilSeed('c5 dust' + i); paint(ellPts(dx + (t - 71.15) * 30 * (i + 1), dy, r, r * .7, 14, 5), { wash: '#8E8480', washOp: 200, ink: '#6E6460', sw: .5 }); });
    // the fat cable
    boilSeed('c5 cable');
    paint(ribbon(CABLE, 40, 36), { wash: '#2C3140', ink: PAL.ink, sw: 1.1 });
    inkLine(CABLE.map(([x, y]) => [x - 6, y - 10]), 1.2, '#6C7A92', 'ink', .5);
    // cable glow following Bit
    glow(bx, by, 150, '#FFC24A', .9);
    // the lost Bamba puff on the cable
    const [bmx, bmy] = along(CABLE, .5), kick = spring(t, 71.62, 6, 20);
    boilSeed('c5 bamba');
    push(); translate(bmx, bmy - 42); rotate(-.12 + kick * .15);
    paint(ribbon(through([[-70, 10], [-40, -18], [-5, 8], [30, -16], [68, 6]], 4), 44, 36), { wash: '#E8A93A', ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 6; i++) paint(ellPts(-55 + i * 22, -4 + 6 * hash(i + 3), 3, 2.5, 6), { wash: '#B8761E', ink: null });
    pop();
    // Bit: runs along the cable, hurdles the puff, leaps up out of frame
    const m = bitMood(t), hop = kf(t, [[71.5, 0], [71.63, -170], [71.78, 0]], x => Math.sin(x * Math.PI / 2));
    const up = t > 71.98;
    bit(bx, by - 18 + hop, 1.6, { ...m, limbs: up ? 'fly' : hop < -20 ? 'crouch' : 'run', phase: t * 3.5, rot: up ? -.2 : ang * .6,
      vel: up ? [200, -1400] : [900, 0], boilKey: 'c5bit' });
    camEnd();
    flash(.8 * (1 - seg(lt, 0, .2)), '#FFD98A');
  }

  // ---------------------------------------------------------------- C / D · the smart TV
  function tvOpt(t) {
    const pct = t < 73.45 ? 99 : 100;
    return { screen: 'freeze', pct, gold: .35 * Math.exp(-6 * Math.max(0, t - 73.45)) * (t >= 73.45 ? 1 : 0), glow: 1 + .8 * Math.exp(-4 * Math.max(0, t - IMPACT)) * (t >= IMPACT ? 1 : 0) };
  }
  function room(t, jolt) {
    const [tx, ty, tw, th] = FAM_ROOM.tv;
    livingRoom(t, { tv: false, shelfEmpty: true });
    tvSet(tx + jolt[0], ty + jolt[1], tw, th, t, tvOpt(t));
  }
  function shotC(t, lt) {
    const [tx, ty, tw, th] = FAM_ROOM.tv, scx = tx + tw / 2, scy = ty + th / 2, top = FAM_ROOM.cabinet[1];
    const jolt = t >= IMPACT ? [spring(t, IMPACT, 7, 45) * 16, spring(t, IMPACT, 7, 38) * -10] : [0, 0];
    const [shx, shy] = t >= IMPACT ? shakeXY(t, 14 * (1 - seg(t, IMPACT, 72.95))) : [0, 0];
    camBegin(1520 + shx, 560 + shy, 2.0 + .25 * ease(seg(t, 72.3, 72.8)));
    room(t, jolt);
    const m = bitMood(t);
    if (t < 72.6) {
      // hop up onto the cabinet (72.15–72.3), land, crouch (anticipation) under "Delivered!"
      const k = seg(t, 72.15, 72.3), p = arcPt([1330, 860], [1400, top], 120, k);
      const land = t > 72.3 ? spring(t, 72.3, 9, 30) * .25 : 0, crouch = ease(seg(t, 72.42, 72.58)) * .22;
      bit(p[0], p[1], .9, { ...m, limbs: k < 1 ? 'fly' : crouch > .05 ? 'crouch' : 'armsUp', sq: m.sq + land + crouch, lookX: .8, lookY: -.5, boilKey: 'c5bit' });
    } else if (t < IMPACT) {
      // the dive into the screen's spinner: arcs up and shrinks into the picture
      const k = seg(t, 72.6, IMPACT), p = arcPt([1400, top - 40], [scx, scy + 30], 120, easeIn(k));
      bit(p[0], p[1], lerp(.9, .18, easeIn(k)), { ...m, limbs: 'fly', rot: lerp(-.3, .5, k), vel: [(scx - 1400) * 5, -300], boilKey: 'c5bit' });
    }
    if (t >= IMPACT) { boilSeed('c5 impact'); glow(scx, scy, 420, '#FFD36A', 1 - seg(t, IMPACT, 72.95) * .5); }
    camEnd();
    flash(t >= IMPACT ? 1 - seg(t, IMPACT + .05, 72.95) * .3 : 0, GW);
  }
  function shotD(t, lt) {
    const [tx, ty, tw, th] = FAM_ROOM.tv, scx = tx + tw / 2, scy = ty + th / 2;
    camBegin(scx, scy + 10, 3.3 + .25 * ease(seg(lt, 0, .95)));
    room(t, [spring(t, IMPACT, 7, 45) * 16, 0]);
    if (t >= 73.45) { boilSeed('c5 100'); glow(scx, scy + 20, 220 * (1 + .3 * Math.exp(-5 * (t - 73.45))), '#FFC24A', .9 * Math.exp(-2.5 * (t - 73.45)) + .2); }
    camEnd();
    flash(.7 * (1 - ease(seg(lt, 0, .5))), GW);
  }

  shots([[69.4, shotA], [71.15, shotB], [72.15, shotC], [72.95, shotD]]);
})();
