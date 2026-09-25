// c4_ocean.js · CHAPTER 4 · deep ocean, the undersea cable · global 58.4–69.4 (audio is final, sync is law)
//
// Shots (global t) · transitions · reads
//   A  58.40–60.00  [in: gold-white flash fades off C3's burst]  WIDE abyss: Bit a gold pulse racing left→right inside the
//                   glowing cable on the sea floor; route-map inset slides in (km counter rolling).
//   B  60.00–61.70  [cut on speed]  TRACKING close alongside Bit inside the glass tube: "Marseille... the Atlantic..."
//                   (map pins Marseille 60.3, Gibraltar 61.2).
//   C  61.70–62.20  [cut on a shadow]  REVEAL: the shark glides in from the right above the cable, hungry, eyes the glow.
//   D  62.20–63.45  [cut in]  Bit close-up, bored eye roll: "Ahh... another attacker..."; shark's jaw looms at right.
//   E  63.45–64.20  MID: shark coils back, LUNGE 63.5, CHOMP 63.9 on the cable (shake), ZAP 64.1 (flash, shark fried).
//   F  64.20–66.60  [cut on the zap]  two-shot: shark dazed (spiral eyes) drifting, Bit LAUGHS (HA HA) 64.25–65.4,
//                   then cheeky "Nice try, fishy!" + wink ~66.1.
//   G  66.60–68.20  [cut on action]  WIDE racing across the Atlantic, map back, Halifax pin.
//   H  68.20–69.40  crane up: Toronto lights shimmer through the surface (68.4), Bit shoots up as a light streak 69.2,
//                   gold-white flash out (C5 opens from it).
(() => {
  const GW = '#FFF4D8';
  const bitMood = t => packMoods(t, [
    [58.4, 'determined'], [62.15, 'bored', { lookX: .5, lookY: -.5 }], [63.6, 'panic'], [63.95, 'cheeky'],
    [64.22, 'laugh'], [65.45, 'cheeky', { lookX: .7 }], [66.6, 'determined'], [68.4, 'joy'],
  ]);
  const mapP = t => kf(t, [[58.4, 0], [60.3, .29], [61.2, .40], [64, .55], [66.6, .66], [68.0, .84], [69.3, 1]], x => x);

  // Bit inside the cable at screen x (pre-camera coords, same as ocean()): the glass tube bulges around him.
  function tubeBit(bx, s, sc, t, o = {}) {
    const [x, y, a] = cablePt(bx, { scroll: sc }), m = bitMood(t);
    const bob = Math.sin(t * 9) * .25;
    bit(x, y + 50 * s, s, { limbs: 'fly', rot: a, vel: o.vel || [0, 0], boilKey: 'c4bit', ...m,
      dy: m.dy + bob + (o.dy || 0), sq: m.sq + (o.sq || 0), ...o.bo });
    // glass bulge (ink arcs only, so his gold stays clean)
    boilSeed('c4 bulge');
    const rx = 108 * s, ry = 78 * s, top = [], bot = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10, xx = x - rx + 2 * rx * k, e = Math.pow(Math.sin(k * Math.PI), .8);
      top.push([xx, y - 15 - (ry - 15) * e + Math.tan(a) * (xx - x)]);
      bot.push([xx, y + 15 + (ry * .75 - 15) * e + Math.tan(a) * (xx - x)]);
    }
    inkLine(top, .8, '#CFF7F4', 'ink', .5);
    inkLine(bot, .7, '#8FD9E0', 'ink', .5);
    inkLine(top.slice(3, 6).map(([px, py]) => [px, py + 8 * s]), 1.2, '#F4FFFB', 'ink', .5);
  }

  function map(t, a = 1, x = 1310, y = 48, w = 560, h = 280) { if (a > .01) routeMap(x, y, w, h, t, { p: mapP(t), alpha: a }); }

  // ---------------------------------------------------------------- shots
  function shotA(t, lt) {
    const sc = 900 * lt, bx = lerp(300, 720, easeOut(seg(lt, 0, 1.6)));
    camBegin(960 + lt * 20, 560, 1.02);
    ocean(t, { scroll: sc, glowX: bx });
    tubeBit(bx, .7, sc, t, { vel: [1100, 0] });
    camEnd();
    map(t, ease(seg(lt, .4, 1.0)));
    flash(1 - seg(lt, 0, .35), GW);
  }

  function shotB(t, lt) {
    const sc = 30000 + 520 * lt, bx = 760, [, cy] = cablePt(bx, { scroll: sc });
    camBegin(bx + 60 + 10 * Math.sin(lt * 2), cy - 70, 2.5, -.02);
    ocean(t, { scroll: sc, glowX: bx, jelly: false });
    tubeBit(bx, .62, sc, t, { vel: [1300, 0] });
    camEnd();
    map(t, 1, 1440, 40, 440, 220);
  }

  function shotC(t, lt, dur) {
    const sc = 52000 + 380 * lt, bx = 560;
    const sx = lerp(1720, 1180, easeOut(seg(lt, 0, dur + .3))), sy = 560 + 14 * Math.sin(t * 2);
    camBegin(980, 620, 1.3);
    ocean(t, { scroll: sc, glowX: bx, dark: .35 });
    shark(sx, sy, .62, { flip: true, mood: 'hungry', lookX: -1, lookY: .6, boilKey: 'c4shark' });
    tubeBit(bx, .68, sc, t, { vel: [700, 0] });
    camEnd();
  }

  function shotD(t, lt) {
    const sc = 60000 + 300 * lt, bx = 700, [, cy] = cablePt(bx, { scroll: sc });
    camBegin(bx + 90 - lt * 8, cy - 80, 3.1 + lt * .08);
    ocean(t, { scroll: sc, glowX: bx, dark: .35, jelly: false });
    // the shark's head looming from the upper right: jaws working (nom nom)
    shark(bx + 310 - lt * 12, cy - 175, .62, { flip: true, mood: 'hungry', bite: .25 + .25 * Math.abs(Math.sin(lt * 5)), lookX: -1, lookY: .8, boilKey: 'c4shark' });
    tubeBit(bx, .62, sc, t, { vel: [300, 0] });
    camEnd();
  }

  function shotE(t, lt) {
    const sc = 68000 + 260 * lt, bx = 640, CH = 63.9, ZAP = 64.1;
    const [, cy] = cablePt(bx + 70, { scroll: sc });
    // shark: coil back (anticipation), lunge (smear), chomp on the cable, recoil on the zap
    const coil = ease(seg(t, 63.45, 63.58)), lunge = easeIn(seg(t, 63.58, CH));
    let sx = lerp(1150, 1210, coil), sy = lerp(560, 540, coil);
    sx = lerp(sx, bx + 70 + 166 * .62 * .95, lunge); sy = lerp(sy, cy - 10, lunge);
    const rec = easeOut(seg(t, ZAP, ZAP + .12));
    sx += rec * 60; sy -= rec * 40;
    const bite = t < CH ? kf(t, [[63.5, .1], [63.82, 1]]) : kf(t, [[CH, 0], [ZAP, 0], [ZAP + .1, .6]]);
    const zap = t >= ZAP ? 1 - seg(t, ZAP + .08, 64.2) * .3 : 0;
    const [shx, shy] = t >= CH ? shakeXY(t, 18 * (1 - seg(t, CH, 64.2)) + (t >= ZAP ? 10 : 0)) : [0, 0];
    camBegin(900 + shx, 640 + shy, 1.55, (t >= CH ? .03 : 0));
    ocean(t, { scroll: sc, glowX: bx, dark: .35 });
    tubeBit(bx, .55, sc, t, { vel: [400, 0] });
    shark(sx, sy, .62, { flip: true, mood: 'hungry', bite, zap, lookX: -1, lookY: .5, boilKey: 'c4shark',
      rot: lunge * .2 - rec * .3, sq: t < 63.6 ? coil * .12 : -lunge * .1 });
    if (t >= CH) { boilSeed('c4 chomp'); glow(bx + 90, cy, 180, '#FFE45C', 1 - seg(t, CH, ZAP) * .5); }
    sfx('CHOMP!', bx + 150, cy - 170, 90, '#F4F1E6', t - CH, { life: .3, rot: -.12 });
    sfx('ZZZAP!', bx + 260, cy - 260, 110, '#FFE45C', t - ZAP, { life: .3, rot: .08 });
    camEnd();
    flash(t >= ZAP ? .7 * (1 - seg(t, ZAP, ZAP + .1)) : 0, '#E8FFF6');
  }

  function shotF(t, lt) {
    const sc = 74000 + 60 * lt, bx = 700, [, cy] = cablePt(bx, { scroll: sc });
    camBegin(880 + lt * 6, cy - 150, 2.0 + lt * .03);
    ocean(t, { scroll: sc, glowX: bx, dark: .3 });
    // dazed shark drifting up and away, twitching
    const sx = 1060 + lt * 14, sy = cy - 230 - lt * 10;
    shark(sx, sy, .5, { flip: true, mood: 'dazed', zap: .35 * Math.max(0, 1 - lt * .9), bite: .35, rot: -.12 + .05 * Math.sin(lt * 3), boilKey: 'c4shark' });
    const laugh = t >= 64.22 && t < 65.45, winkK = kf(t, [[66.02, 0], [66.1, 1], [66.42, 1], [66.52, 0]]);
    tubeBit(bx, .9, sc, t, { bo: { ...(laugh ? { mouth: 'laugh' } : {}), wink: winkK, limbs: laugh ? 'armsUp' : 'fly' } });
    [[64.3, -60, -150, 80, -.1], [64.7, 60, -200, 92, .08], [65.05, -20, -250, 104, -.06]].forEach(([t0, dx, dy, sz, r]) =>
      sfx('HA HA!', bx + dx, cy + dy, sz, '#FFD34D', t - t0, { life: .55, rot: r }));
    camEnd();
  }

  function shotG(t, lt) {
    const sc = 90000 + 1150 * lt, bx = lerp(520, 900, ease(seg(lt, 0, 1.6)));
    camBegin(960, 580, 1.08, -.015);
    ocean(t, { scroll: sc, glowX: bx });
    tubeBit(bx, .7, sc, t, { vel: [1300, 0] });
    camEnd();
    map(t, ease(seg(lt, 0, .35)));
  }

  function shotH(t, lt) {
    const sc = 110000 + kf(lt, [[0, 0], [.9, 700], [1.2, 760]], easeOut);
    const bx = 860, [, by] = cablePt(bx, { scroll: sc });
    const up = ease(seg(t, 68.25, 69.1));
    camBegin(960, lerp(600, 490, up), lerp(1.1, 1.0, up));
    ocean(t, { scroll: sc, glowX: bx, city: ease(seg(t, 68.4, 68.9)), dark: lerp(.2, .05, up) });
    if (t < 69.2) tubeBit(bx, .7, sc, t, { vel: [600, 0], bo: { limbs: t > 68.9 ? 'crouch' : 'fly' } });
    else {
      // light streak: Bit rockets up out of the cable to the city lights
      const k = easeIn(seg(t, 69.2, 69.36)), hy = lerp(by, -40, k);
      boilSeed('c4 streak');
      paint(ribbon([[bx, by], [bx + 30, lerp(by, hy, .5)], [bx + 60, hy]], 10, 44), { wash: '#FFE9A8', washOp: 230, ink: null });
      glow(bx + 60, hy, 200, '#FFC24A', 1);
      bit(bx + 60, hy + 80, .7, { limbs: 'fly', mood: 'joy', vel: [0, -2500], rot: -.1, boilKey: 'c4bit' });
    }
    camEnd();
    map(t, 1 - ease(seg(t, 68.6, 68.9)));
    flash(ease(seg(t, 69.25, 69.4)), GW);
  }

  shots([[58.4, shotA], [60.0, shotB], [61.7, shotC], [62.2, shotD], [63.45, shotE], [64.2, shotF], [66.6, shotG], [68.2, shotH]]);
})();
