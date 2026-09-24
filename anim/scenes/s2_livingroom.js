// ============================================================================
// S2 v2 · "Buffering" · global 6.2–29.2 · Toronto living room (shift 0).
// Shots (global t):
//   A  6.20–7.00  out of S1's flash: inside the room, close on the window (snow falling outside, warm lamp),
//                 caption טורונטו · 15:47, then an eased pan onto Saba for "Noa!"
//   B  7.00–10.20 close on Saba ("Noa!") → pull back to the master; Noa waits with her backgammon case
//   C 10.20–12.45 two-shot: Noa steps up, lifts the case: "Saba, come play backgammon with me!"
//   D 12.45–13.90 Saba MCU, eyes on the TV, waves her off: "Not now, motek!" (Noa deflates at frame right)
//   E 13.90–14.90 medium: he rises out of the chair, "I'm in the middle of the game!"
//   F 14.90–15.75 TV insert full screen: breakaway... 15.3 FREEZE (old provider), glitch, spinner
//   G 15.75–17.72 Saba frozen mid-rise, 16.0 snap zoom to his face ("No! Not now!"), spinner in his glasses
//   G2 17.72–20.35 Saba vs. the TV (error toast): "Again?! Every single game it gets stuck!"
//   H 20.35–24.80 Saba slumps; Noa sets the case on the pouf, knowing smile: "...Everyone switched to GOTV!"
//   I 24.80–29.20 Noa dashes to the router: "Switching you to GOTV... now!" → TV switch overlay, LED turns gold,
//                 push into the gold LED, whoosh, white-gold flash (S4 opens at 29.2)
// Everything is a pure function of t. Props from kits/props.js are guarded (placeholders if missing).
// ============================================================================
(() => {
  const LR = A.LR, E = A.ease, K = A.key, cl = A.clamp, lerp = A.lerp, inv = A.inv, sm = A.smooth, D = Math.PI / 180;
  const FREEZE = 15.3, PRESS = 30.95; // PRESS = the GOTV app opens on the TV
  const SAB = { x: LR.chair.x, y: LR.chair.y, s: 0.95 };
  const NOA_S = 0.95;
  const ROUTER = LR.router;
  const LED = A.routerLED(ROUTER.x, ROUTER.y, ROUTER.s);
  const GOLD = '#ffc93c';
  const NOA_CAB = 1300, BOX_HOME = [1475, 710];

  // ------------------------------------------------------------ helpers
  function gseq(t, seq) {
    let i = 0; while (i + 1 < seq.length && t >= seq[i + 1][0]) i++;
    const [t0, g, d] = seq[i];
    if (i === 0 || !d) return { gesture: g };
    const k = cl((t - t0) / d);
    return k >= 1 ? { gesture: g } : { gesture: g, gestureFrom: seq[i - 1][1], gestureK: k };
  }
  function mseq(t, seq) {
    let i = 0; while (i + 1 < seq.length && t >= seq[i + 1][0]) i++;
    const [t0, m, d] = seq[i];
    if (i === 0 || !d) return { mood: m };
    const k = cl((t - t0) / d);
    return k >= 1 ? { mood: m } : { mood: m, moodFrom: seq[i - 1][1], moodK: E.inOut(k) };
  }
  const zkey = (t, ks) => Math.exp(K(t, ks.map(k => [k[0], Math.log(k[1]), k[2]])));

  // ------------------------------------------------------------ TV
  function tvState(t) {
    if (t < FREEZE) return { state: 'live', matchT: t - 13.8 };
    const ft = t - FREEZE;
    const glitch = Math.max(0.3, 1 - ft / 0.7) + (ft > 2.2 && ft < 2.45 ? 0.35 : 0) + (t > 17.8 && t < 18.05 ? 0.4 : 0) + (t > 19.9 && t < 20.1 ? 0.3 : 0);
    const pct = Math.floor(K(t, [[15.45, 0], [16.2, 11, 'out'], [17.0, 23, 'out'], [17.7, 31, 'out'], [18.3, 36, 'out'], [19.4, 37, 'out'], [21.0, 38, 'out'], [26.0, 38], [26.8, 39]]));
    return { state: 'freeze', matchT: 1.5, freezeT: FREEZE, freezeGlitch: Math.min(1, glitch) * (1 - sm(PRESS, PRESS + 0.2, t)), spinner: sm(15.42, 15.65, t) * (1 - sm(PRESS, PRESS + 0.15, t)), bufferPct: pct };
  }
  function tvLight(t) {
    if (t < FREEZE) {
      const f = 0.95 + 0.22 * A.noise1(t * 5.3) + 0.1 * A.noise1(t * 13.1 + 4);
      const warm = 0.5 + 0.5 * A.noise1(t * 0.9 + 2);
      return { color: A.mixc('#9ff5d0', '#d6f7a8', warm * 0.5), intensity: f * (t > 14.0 ? 1.15 : 1) };
    }
    if (t >= PRESS) { const k = sm(PRESS, PRESS + 0.35, t); return { color: A.mixc('#aeb8d4', '#ffd98a', k), intensity: 0.62 + 0.9 * k + 0.6 * Math.exp(-(t - PRESS - 0.35) * 5) * (t > PRESS + 0.35 ? 1 : 0) }; }
    const ft = t - FREEZE, burst = Math.exp(-ft * 7) * 1.6;
    return { color: A.mixc('#e8f4ff', '#aeb8d4', cl(ft / 0.4)), intensity: 0.62 + burst };
  }
  // draw inside a screen rect in the 1920×1080 broadcast reference space (same fit as drawTVScreen)
  function screenRef(ctx, x, y, w, h, fn) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y);
    const sc = Math.max(w / 1920, h / 1080); ctx.translate((w - 1920 * sc) / 2, (h - 1080 * sc) / 2); ctx.scale(sc, sc);
    fn(ctx); ctx.restore();
  }
  // the kit's broadcast has an IPTV·IL bug baked in: cover it with the OLD provider bug
  function oldBug(g, t) {
    g.save();
    g.fillStyle = '#20283f'; A.rrect(g, 1536, 36, 308, 84, 18); g.fill();
    const sw = sm(PRESS + 0.3, PRESS + 0.45, t);
    if (sw > 0) {
      g.globalAlpha = sw;
      if (A.drawGOTVBug) A.drawGOTVBug(g, 1690, 78, 1.6, { t, alpha: 1 });
      else { A.text(g, 'GO', 1668, 80, { font: '900 58px Rubik', fill: '#ffd21f', align: 'right' }); A.text(g, 'TV', 1672, 80, { font: '900 58px Rubik', fill: '#5fa0ff', align: 'left' }); }
      g.globalAlpha = 1 - sw; if (sw >= 1) { g.restore(); return; }
    }
    if (A.drawOldProviderBug) A.drawOldProviderBug(g, 1690, 78, 1.6, { t, alpha: 0.95 });
    else {
      g.fillStyle = 'rgba(150,152,165,0.9)'; A.rrect(g, 1556, 50, 58, 56, 12); g.fill();
      g.strokeStyle = '#20283f'; g.lineWidth = 5; A.ellipse(g, 1585, 78, 15, 15); g.stroke();
      A.text(g, 'הספק הישן', 1728, 79, { font: '800 40px Rubik', fill: '#b9bcc8', dir: 'rtl' });
    }
    g.restore();
  }
  // error toast during "Again?!"
  function errorToast(g, t) {
    const a = sm(18.3, 18.5, t) * (1 - sm(21.6, 22.0, t)) * (1 - sm(PRESS, PRESS + 0.1, t));
    if (a <= 0) return;
    const pop = E.outBack(sm(18.3, 18.55, t));
    g.save(); g.globalAlpha = a; g.translate(960, 850); g.scale(pop, pop);
    g.fillStyle = 'rgba(20,14,30,0.85)'; A.rrect(g, -380, -60, 760, 120, 26); g.fill();
    g.strokeStyle = '#ff5a4e'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#ff5a4e'; g.beginPath(); g.moveTo(290, -34); g.lineTo(328, 32); g.lineTo(252, 32); g.closePath(); g.fill();
    A.text(g, '!', 290, 12, { font: '900 44px Rubik', fill: '#1a1330' });
    A.text(g, 'שגיאה · נסה שוב', 10, 2, { font: '800 54px Rubik', fill: '#fff', dir: 'rtl' });
    // retry arrow spinning uselessly
    g.save(); g.translate(-300, 0); g.rotate(t * 5); g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 24, 0.3, 5.4); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(24 * Math.cos(5.4) + 10, 24 * Math.sin(5.4) - 2); g.lineTo(24 * Math.cos(5.4) - 8, 24 * Math.sin(5.4) - 12); g.lineTo(24 * Math.cos(5.4) - 4, 24 * Math.sin(5.4) + 10); g.fill();
    g.restore();
    g.restore();
  }
  let OVL = null;
  function switchOverlay(ctx, x, y, w, h, t) {
    const p = inv(PRESS, PRESS + 0.6, t);
    if (p <= 0) return;
    if (A.drawSwitchOverlay) {
      // props.js drawSwitchOverlay leaves an unbalanced save() (with its screen clip) while p < ~1, so draw it on a
      // scratch canvas whose state is reset every call, then composite.
      if (!OVL) OVL = document.createElement('canvas');
      OVL.width = 1920; OVL.height = 1080; // also resets the context state stack
      const g = OVL.getContext('2d'); g.setTransform(ctx.getTransform());
      A.drawSwitchOverlay(g, x, y, w, h, t, { p });
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(OVL, 0, 0); ctx.restore();
      return;
    }
    screenRef(ctx, x, y, w, h, g => {
      g.fillStyle = `rgba(6,10,30,${0.6 * cl(p * 4)})`; g.fillRect(0, 0, 1920, 1080);
      if (p < 0.8) {
        g.fillStyle = 'rgba(13,16,51,0.92)'; A.rrect(g, 560, 380, 800, 300, 30); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 5; g.stroke();
        A.text(g, 'עובר ל-GOTV...', 960, 480, { font: '800 64px Rubik', fill: '#fff', dir: 'rtl' });
        g.fillStyle = '#2a3070'; A.rrect(g, 640, 570, 640, 36, 18); g.fill();
        g.fillStyle = GOLD; A.rrect(g, 640, 570, 640 * cl(p / 0.8), 36, 18); g.fill();
      } else {
        const k = E.outBack(inv(0.8, 1, p));
        A.glow(g, 960, 540, 700 * k, GOLD, 0.8);
        g.save(); g.translate(960, 540); g.scale(k, k);
        A.text(g, '✓ GOTV פעיל', 0, 0, { font: '900 120px Rubik', fill: GOLD, stroke: '#0d1033', lw: 14, dir: 'rtl' });
        g.restore();
      }
    });
  }
  // TV screen overlays (after drawTV / drawTVScreen)
  function tvOverlays(ctx, x, y, w, h, t) {
    screenRef(ctx, x, y, w, h, g => { oldBug(g, t); errorToast(g, t); });
    switchOverlay(ctx, x, y, w, h, t);
  }
  // cool/desaturate grade after the freeze (screen space)
  function grade(ctx, t, amt) {
    if (amt <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.42 * amt; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28 * amt; ctx.fillStyle = '#9fb0d8'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  }
  const gradeAmt = t => t < FREEZE ? 0 : sm(FREEZE, FREEZE + 0.4, t) * (1 - 0.85 * sm(PRESS, PRESS + 0.6, t));

  // ------------------------------------------------------------ props (guarded)
  function drawCase(ctx, x, y, s, t, o = {}) {
    if (A.drawBackgammon) { A.drawBackgammon(ctx, x, y, s, Object.assign({ mode: 'case', t }, o)); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (o.rot) ctx.rotate(o.rot);
    ctx.lineJoin = 'round'; ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 6;
    // handle
    A.rrect(ctx, -30, -132, 60, 26, 12); ctx.stroke(); ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 6;
    A.rrect(ctx, -90, -116, 180, 116, 14); ctx.fillStyle = A.linear(ctx, 0, -116, 0, 0, [[0, '#b0703a'], [1, '#7a4420']]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3018'; ctx.fillRect(-90, -62, 180, 6);
    ctx.fillStyle = '#e9d3a2'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-78 + i * 26, -104); ctx.lineTo(-66 + i * 26, -104); ctx.lineTo(-72 + i * 26, -72); ctx.fill(); }
    ctx.fillStyle = '#ffd98a'; A.rrect(ctx, -10, -66, 20, 14, 3); ctx.fill();
    ctx.restore();
  }
  function glassesReflection(ctx, o, t, amt, sx) {
    if (amt <= 0) return;
    const idle = o.idle ?? 1, breath = o.breath ?? 1;
    const MOOD = { neutral: [0, 0, 0], eager: [0.2, 3, 0.1], tense: [0.25, 10, 0.35], horror: [-0.1, 14, 1], joy: [-0.05, -2, 0] }; // [lean, shoulders, tremble]
    const mv = (i) => { const b = MOOD[o.mood][i]; return o.moodFrom ? lerp(MOOD[o.moodFrom][i], b, o.moodK) : b; };
    const tremble = o.tremble ?? mv(2), shoulders = o.shoulders ?? mv(1);
    const tr = (sd, f = 19) => tremble * A.noise1(t * f + sd);
    const br = Math.sin(t * A.TAU / 3.6) * breath;
    const rise = o.rise || 0, e = E.inOut(cl(rise));
    const Py = lerp(-176, -182, e);
    const leanDeg = ((o.lean ?? 0) + mv(0)) * 22 + (o.pose === 'rise' ? Math.sin(Math.PI * cl(rise)) * 16 : 0) + idle * A.wob(t, 3, 0.35) * 1.2;
    const turn = cl((o.turn ?? 0.25) + (o.look ? o.look[0] * 0.12 : 0), -1, 1);
    const tilt = ((o.headTilt ?? 0) + (o.look ? o.look[1] * 4 : 0) + idle * A.wob(t, 13, 0.3) * 2.5 + tr(12, 23) * 2) * D;
    const headP = [8 + turn * 6 + tr(14) * 1.2, -266 - br * 1.6 - shoulders * 0.4];
    const sq = o.squash ?? 0;
    ctx.save();
    ctx.translate(sx, SAB.y); ctx.scale(SAB.s, SAB.s); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(0, 150);
    ctx.translate(tr(1) * 1.5, Py - br * 1.2); ctx.rotate(leanDeg * D);
    ctx.translate(headP[0], headP[1] + 70); ctx.rotate(tilt); ctx.scale(1.08, 1.08); ctx.translate(0, -70);
    const fx = turn * 26, farK = 1 - Math.max(0, turn) * 0.25, nearK = 1 - Math.max(0, -turn) * 0.25;
    const lens = [[fx - 30, nearK], [fx + 29, farK]];
    ctx.beginPath(); for (const [ex, k] of lens) ctx.roundRect(ex - 28 * k + 2, -2 - 22 + 2, 56 * k - 4, 40, 10); ctx.clip();
    for (const [ex, k] of lens) {
      // the TV (at his right) mirrored in the upper-outer part of each lens: dark screen + white buffering wheel
      ctx.save(); ctx.translate(ex + 8 * k, -11); ctx.scale(k * 1.3, 1.3); ctx.transform(1, 0, -0.2, 1, 0, 0);
      ctx.globalAlpha = 0.5 * amt; ctx.fillStyle = '#1c2340'; A.rrect(ctx, -14, -9, 28, 18, 3); ctx.fill();
      ctx.globalAlpha = 0.35 * amt; ctx.fillStyle = '#7d8fbf'; ctx.fillRect(-14, 3, 28, 6);
      const n = 12, rot = Math.floor(t * 12) / 12 * A.TAU;
      for (let i = 0; i < n; i++) {
        const a = rot + i / n * A.TAU, f = i / n;
        ctx.globalAlpha = (0.12 + 0.88 * f) * amt; ctx.fillStyle = '#ffffff';
        ctx.save(); ctx.rotate(a); ctx.fillRect(2.6, -0.85, 3.4, 1.7); ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ the room with everyone in it (world coords)

  // ------------------------------------------------------------ SABA acting
  function sabaO(t) {
    const o = { t };
    const rise = t < 14.0 ? 0
      : t < 20.35 ? K(t, [[14.0, 0], [14.35, 0.62, 'out'], [14.8, 0.9, 'out'], [16.0, 0.9], [16.25, 1, 'out']])
        : t < 32.3 ? K(t, [[20.35, 1], [20.5, 1.0, 'out'], [20.95, 0, 'in']])
          : K(t, [[32.3, 0], [33.4, 0.85, 'inOut'], [35.2, 0.95]]);
    o.pose = rise > 0.001 ? 'rise' : 'sit'; o.rise = rise;
    o.squash = 0.06 * Math.sin(Math.PI * inv(13.85, 14.05, t)) + (t > 20.95 ? 0.11 * Math.exp(-(t - 20.95) * 9) * Math.cos((t - 20.95) * 24) : 0);
    Object.assign(o, mseq(t, [[0, 'eager'], [9.3, 'tense', 0.35], [12.3, 'eager', 0.3], [15.95, 'horror', 0.25], [17.65, 'tense', 0.3], [20.9, 'neutral', 0.5], [24.3, 'eager', 0.4], [25.3, 'neutral', 0.5], [PRESS + 0.2, 'eager', 0.3], [32.9, 'joy', 0.4]]));
    Object.assign(o, gseq(t, [[0, 'grip'], [7.12, 'point', 0.32], [8.5, 'fists', 0.25], [9.3, 'grip', 0.3], [12.45, 'point', 0.22], [13.45, 'grip', 0.3], [13.95, 'fists', 0.18],
      [16.2, 'headHands', 0.3], [17.7, 'fists', 0.2], [18.85, 'point', 0.25], [19.85, 'fists', 0.2], [20.4, 'grip', 0.45], [32.45, 'point', 0.3], [33.4, 'armsUp', 0.5]]));
    // "Not now, motek!": a dismissive wave toward Noa without taking his eyes off the TV
    if (t > 12.67 && t < 13.45) {
      const w = sm(12.67, 12.8, t) * (1 - sm(13.2, 13.45, t));
      o.armR = [100 - 22 * w, 6 + 48 * Math.sin((t - 12.67) * 15) * w]; o.handShapeR = 'open'; o.armRBehind = false;
    }
    // fist shaking at the TV
    if (t > 17.8 && t < 18.85) { const w = sm(17.8, 17.95, t) * (1 - sm(18.6, 18.85, t)); o.shoulders = 10 + 6 * Math.sin((t - 17.8) * 22) * w; }
    const TV = [0.95, -0.12], NOA = [0.6, 0.55], UP = [0.35, -0.95], POUF = [0.85, 0.35], CAB = [0.9, 0.35], BIN = [0.85, 0.5], NOA2 = [0.9, 0.25];
    o.look = K(t, [[6.85, TV], [6.98, NOA, 'out'], [7.55, NOA], [7.75, TV, 'out'], [11.3, TV], [11.4, NOA, 'out'], [11.65, NOA], [11.8, TV, 'out'],
      [12.95, TV], [13.02, NOA], [13.18, NOA], [13.28, TV],
      [16.85, TV], [17.0, UP, 'out'], [17.35, UP], [17.55, TV, 'out'], [20.6, TV], [20.95, POUF, 'out'], [24.8, POUF], [25.05, CAB, 'out'], [26.2, CAB], [26.35, BIN, 'out'], [26.9, BIN], [27.1, NOA2, 'out'], [PRESS, NOA2], [PRESS + 0.1, TV, 'out']]);
    if (t > 8.9 && t < 9.25) o.look = K(t, [[8.9, TV], [8.97, NOA], [9.18, NOA], [9.25, TV]]);
    const toNoa = K(t, [[6.85, 0], [7.0, 1, 'out'], [7.55, 1], [7.8, 0], [21.1, 0], [21.5, 0.6], [24.3, 0.6], [24.45, 1, 'out'], [24.9, 1], [25.2, 0.5], [PRESS, 0.5], [PRESS + 0.15, 0, 'out']]);
    o.headTilt = toNoa * 7;
    o.turn = 0.25 - toNoa * 0.1;
    if (t > 15.98 && t < 16.55) { const k = sm(15.98, 16.06, t) * (1 - sm(16.3, 16.55, t)); o.headTilt += Math.sin((t - 15.98) * 21) * 7 * k; o.turn += Math.sin((t - 15.98) * 21 + 0.6) * 0.2 * k; }
    if (t > 17.34 && t < 17.8) o.headTilt += Math.sin((t - 17.34) * 7) * 2.5 * sm(17.34, 17.5, t);
    if (t > 17.8 && t < 20.3) o.headTilt += Math.sin((t - 17.8) * 9) * 2.2; // ranting bob
    o.lean = K(t, [[6.2, 0.28], [9.3, 0.3], [9.6, 0.48, 'out'], [12.3, 0.44], [12.5, 0.3], [13.9, 0.3], [14.1, 0.25, 'out'], [16.0, 0.25], [16.25, -0.12, 'out'],
      [17.5, -0.05], [17.85, 0.4, 'outBack'], [19.9, 0.3], [20.3, 0.2], [21.4, -0.25], [24.3, -0.25], [24.6, 0.2, 'outBack'], [25.4, 0.1], [26.45, 0.1], [26.52, -0.25, 'out'], [26.9, 0], [PRESS, -0.05], [PRESS + 0.2, 0.3, 'outBack'], [32.3, 0.3]]);
    o.browRaise = K(t, [[24.2, 0], [24.5, 0.65, 'outBack'], [25.2, 0.3], [26.4, 0.2], [26.5, 0.9, 'outBack'], [27.0, 0.3], [PRESS, 0.2], [PRESS + 0.2, 0.95, 'outBack'], [33.5, 0.7]]);
    if (t > 27.1 && t < PRESS) o.browL = 0.45; // one skeptical eyebrow
    o.lid = K(t, [[21.0, 0], [21.5, 0.35], [24.2, 0.35], [24.4, 0]]); // sulking
    o.scarfWave = K(t, [[14.0, 0], [14.3, 0.9], [14.8, 0.6], [15.0, 0], [17.8, 0], [18.0, 0.5], [18.8, 0.3], [19.0, 0]]);
    o.vel = [0, (t > 14.0 && t < 14.8) || (t > 32.3 && t < 33.4) ? -500 : 0];
    // THE FREEZE: he freezes too, mouth open
    if (t >= FREEZE && t < 15.95) { o.idle = 0; o.breath = 0; o.jaw = 0.5; o.mouth = 0; o.tremble = 0; }
    if (t >= 15.95 && t < 16.05) o.jaw = 0.5 * (1 - inv(15.95, 16.05, t));
    if (t >= 17.34 && t < 17.72) { o.tremble = 1; o.jaw = 0.25; }
    if (t > 20.35 && t < 21.2) o.tremble = 0.3;
    // the crash in the bin makes him jump in his chair
    if (t > 26.45 && t < 26.9) o.squash = -0.07 * Math.exp(-(t - 26.45) * 8) * Math.cos((t - 26.45) * 20);
    // wonder: the GOTV app opens; he rises toward the light
    if (t > PRESS) { o.jaw = 0.35 * sm(PRESS, PRESS + 0.3, t); o.mouth = t > 33.0 ? 0.25 + 0.15 * Math.sin(t * 9) : undefined; }
    const L = tvLight(t);
    o.rimColor = L.color; o.light = [0.95, -0.35]; o.rimA = cl(0.35 + 0.35 * L.intensity, 0, 0.9);
    return o;
  }

  // ------------------------------------------------------------ NOA acting
  // returns {x, y, o, caseP: [x,y,s,rot] | null}
  const walkBob = (t, a, b) => (t > a && t < b ? -Math.abs(Math.sin((t - a) * 14)) * 7 : 0);
  function noaState(t) {
    const o = { t };
    let x, y = 905, caseP = null;
    const holdCase = (hx, hy, s = 0.46) => { // case centre in facing-local units → hands + world case
      o.gesture = 'none';
      o.handL = [hx - 34, hy + 6]; o.handR = [hx + 30, hy + 2]; o.handShapeL = 'grip'; o.handShapeR = 'grip';
      const f = o.flip ? -1 : 1;
      caseP = [x + f * hx * NOA_S, y + (hy + 28) * NOA_S, s, 0];
    };
    if (t < 20.6) {
      x = K(t, [[10.1, 1115], [10.6, 1025, 'inOut'], [13.95, 1025], [14.3, 1068, 'out']]); y = 905 + walkBob(t, 10.1, 10.6) + walkBob(t, 13.95, 14.3);
      o.pose = 'stand'; o.flip = true;
      Object.assign(o, mseq(t, [[0, 'neutral'], [10.45, 'joy', 0.2], [12.85, 'neutral', 0.35], [19.6, 'amused', 0.4]]));
      const SABA = [0.8, -0.3], TV = [-0.85, -0.3], ROLL = [0.1, -0.95], DOWN = [0.3, 0.85], ROUT = [-0.6, 0.85];
      o.look = K(t, [[6.2, SABA], [7.6, SABA], [7.75, ROLL, 'out'], [8.1, ROLL], [8.3, TV], [9.9, TV], [10.1, SABA, 'out'], [12.9, SABA], [13.1, DOWN, 'out'], [14.1, DOWN], [14.3, TV, 'out'],
        [15.9, TV], [16.05, SABA, 'out'], [19.2, SABA], [19.35, ROUT, 'out'], [19.8, ROUT], [19.95, SABA, 'out']]);
      o.turn = K(t, [[8.2, 0.25], [8.35, -0.3], [9.9, -0.3], [10.1, 0.25], [14.1, 0.25], [14.3, -0.3], [15.9, -0.3], [16.05, 0.25], [19.2, 0.25], [19.35, 0.0], [19.85, 0.25]]);
      o.browRaise = K(t, [[6.85, 0.2], [6.98, 0.75, 'outBack'], [7.6, 0.4], [8.2, 0.1], [10.4, 0.2], [10.6, 0.55, 'out'], [12.3, 0.45], [12.9, 0], [15.3, 0], [15.4, 0.5, 'outBack'], [15.9, 0.1], [19.9, 0.1], [20.1, 0.35]]);
      o.browAngle = K(t, [[6.2, 0.35], [10.4, 0.35], [10.6, 0.2], [12.85, 0.2], [13.2, 0.7], [15.2, 0.6], [19.5, 0.5], [19.8, -0.1]]);
      o.bounce = K(t, [[6.9, 0], [7.0, 0.8], [7.5, 0], [11.2, 0], [11.35, 0.7], [11.8, 0]]);
      o.shoulders = K(t, [[12.9, 0], [13.2, -6], [15.2, -5], [15.4, 0]]);
      o.headTilt = K(t, [[10.5, 0], [10.8, -7, 'out'], [12.3, -6], [12.8, 0], [13.1, 5], [14.2, 4], [14.4, 0], [19.8, 0], [20.0, -6, 'outBack']]);
      // the case: held at the chest, lifted and jiggled on "backgammon", then drops to her hip when he waves her off
      const lift = K(t, [[10.7, 0], [11.25, 1, 'outBack'], [12.3, 0.8], [12.9, 0.7], [13.3, 0]]);
      const sag = K(t, [[12.9, 0], [13.35, 1, 'out'], [19.6, 1], [20.1, 0.6]]);
      const jig = t > 11.3 && t < 12.0 ? Math.sin((t - 11.3) * 20) * 5 * (1 - inv(11.3, 12.0, t)) : 0;
      holdCase(34 + lift * 10 - sag * 6, -176 - lift * 42 + sag * 50 + jig + Math.sin(t * A.TAU / 3) * 1.5);
    } else if (t < 21.05) {
      // steps back to the pouf (facing right)
      x = K(t, [[20.6, 1068], [21.05, 1178]]); y = 905 + walkBob(t, 20.6, 21.05);
      o.pose = 'stand'; o.flip = false; o.mood = 'amused'; o.look = [0.3, 0.5];
      holdCase(34, -130);
    } else if (t < 21.75) {
      // crouch: set the case down on the pouf
      x = 1178; o.pose = 'crouch'; o.flip = true; o.mood = 'amused';
      const k = E.inOut(inv(21.1, 21.5, t));
      const cw = [lerp(1178 - 50 * NOA_S, 1108, k), lerp(905 - 90 * NOA_S, 790, k)];
      caseP = [cw[0], cw[1], 0.46, 0];
      o.gesture = 'reach'; o.reachTo = [(x - cw[0]) / NOA_S, (cw[1] - 28 - y) / NOA_S];
      if (t > 21.55) { o.gestureFrom = 'reach'; o.gesture = 'none'; o.gestureK = inv(21.55, 21.75, t); }
      o.squash = 0.12 * Math.exp(-(t - 21.05) * 10) * Math.cos((t - 21.05) * 20);
      o.look = [0.5, 0.7];
    } else if (t < 24.75) {
      // turns to Saba, knowing smile
      x = 1178; o.pose = 'stand'; o.flip = true;
      Object.assign(o, mseq(t, [[0, 'amused'], [22.4, 'proud', 0.4]]));
      o.squash = -0.06 * Math.exp(-(t - 21.75) * 8) * Math.cos((t - 21.75) * 18);
      Object.assign(o, gseq(t, [[0, 'none'], [23.25, 'shrug', 0.25], [24.45, 'none', 0.3]]));
      o.look = K(t, [[21.75, [0.8, -0.1]], [24.4, [0.8, -0.1]], [24.55, [-0.6, 0.6], 'out']]); // glance at the router
      o.turn = K(t, [[24.4, 0.25], [24.55, 0.0]]);
      o.headTilt = K(t, [[21.8, 0], [22.2, -8, 'out'], [23.2, -6], [23.5, -10, 'outBack'], [24.5, -6]]);
      o.browRaise = K(t, [[23.2, 0.1], [23.4, 0.5, 'outBack'], [24.5, 0.3]]);
    } else if (t < 25.2) {
      // marches to the TV cabinet
      x = K(t, [[24.75, 1178], [25.2, NOA_CAB, 'inOut']]); y = 905 + walkBob(t, 24.75, 25.2);
      o.pose = 'stand'; o.flip = false; o.mood = 'focused';
      Object.assign(o, gseq(t, [[0, 'none'], [24.95, 'reach', 0.25]]));
      o.reachTo = [(BOX_HOME[0] - 40 - x) / NOA_S, (BOX_HOME[1] + 6 - y) / NOA_S];
      o.look = [0.7, 0.35];
    } else if (t < 26.5) {
      // "Bye-bye, old box!": grab, tug (stuck), YANK, hold it up in disgust, fling it over her shoulder
      x = NOA_CAB; o.pose = 'stand'; o.flip = false;
      Object.assign(o, mseq(t, [[0, 'focused'], [25.7, 'amused', 0.2], [26.2, 'proud', 0.2]]));
      const b = boxState(t);
      if (t < 26.12) {
        const hx = (b.x - x) / NOA_S, hy = (b.y - y) / NOA_S;
        o.handL = [hx - 46, hy + 4]; o.handR = [hx + 30, hy + 2]; o.handShapeL = 'grip'; o.handShapeR = 'grip';
      } else {
        const k = E.inOut(inv(26.12, 26.3, t));
        o.handL = [lerp(-10, -62, k), lerp(-230, -318, k)]; o.handR = [lerp(50, -20, k), lerp(-232, -322, k)];
        o.handShapeL = t > 26.27 ? 'open' : 'grip'; o.handShapeR = o.handShapeL;
      }
      o.lean = K(t, [[25.2, 0.25], [25.42, 0.3], [25.55, -0.45, 'out'], [25.8, -0.15], [26.1, -0.1], [26.3, -0.3, 'out'], [26.5, -0.05]]);
      o.squash = t > 25.45 ? 0.14 * Math.exp(-(t - 25.45) * 9) * Math.cos((t - 25.45) * 22) : 0;
      if (t > 25.2 && t < 25.45) o.tremble = 1, o.shoulders = 6 + 3 * Math.sin(t * 50);
      o.look = K(t, [[25.2, [0.7, 0.35]], [25.7, [0.5, 0.0]], [26.1, [0.5, 0.0]], [26.25, [0.9, -0.3]]]);
      o.headTilt = K(t, [[25.7, 0], [25.85, -8, 'out'], [26.1, -6], [26.3, 6]]);
      o.lid = K(t, [[25.75, 0], [25.9, 0.3], [26.4, 0.35]]);
    } else if (t < 27.0) {
      // dusts off her hands, smug, not even looking back
      x = NOA_CAB; o.pose = 'stand'; o.flip = false; o.mood = 'proud';
      const r = Math.sin((t - 26.5) * 34) * sm(26.5, 26.58, t) * (1 - sm(26.85, 27.0, t));
      o.handL = [18 + r * 10, -150]; o.handR = [40 - r * 10, -156]; o.handShapeL = 'open'; o.handShapeR = 'open';
      o.look = [0.2, -0.3]; o.lid = 0.35; o.headTilt = -6;
      o.squash = -0.05 * Math.exp(-(t - 26.5) * 8);
    } else {
      // phone out: "One message to GOTV..." → "Activated! Look, Saba!"
      x = NOA_CAB; o.pose = 'stand'; o.flip = true;
      Object.assign(o, mseq(t, [[0, 'proud'], [27.2, 'focused', 0.3], [28.2, 'amused', 0.3], [PRESS + 0.1, 'joy', 0.25]]));
      const up = E.outBack(inv(27.0, 27.3, t));
      if (t < 31.25) {
        o.handL = [lerp(10, 36, up), lerp(-130, -188, up)]; o.handR = [lerp(26, 62, up), lerp(-126, -186, up)]; o.handShapeL = 'grip'; o.handShapeR = 'grip';
        o.look = t < PRESS ? [0.3, 0.8] : [-0.85, -0.45]; o.turn = t < PRESS ? 0.25 : -0.3;
        o.headTilt = t < PRESS ? 8 : 0;
      } else {
        Object.assign(o, gseq(t, [[0, 'none'], [31.25, 'cheer', 0.15], [31.95, 'shrug', 0.25], [32.85, 'none', 0.4]]));
        o.look = K(t, [[31.25, [-0.85, -0.45]], [31.95, [-0.85, -0.45]], [32.05, [0.85, -0.2], 'out'], [32.75, [0.85, -0.2]], [32.9, [-0.85, -0.4], 'out']]);
        o.turn = K(t, [[31.95, -0.3], [32.05, 0.25], [32.75, 0.25], [32.9, -0.3]]);
      }
      o.phone = t >= 27.0 && t < 31.25 ? 1 : 0;
    }
    return { x, y, o, caseP };
  }

  // ------------------------------------------------------------ the room with everyone in it (world coords)
  // ------------------------------------------------------------ the OLD set-top box, its cable spaghetti, the bin
  // kit cabinet: middle compartments at mx=1386, mw=178; upper cavity y 668..726 holds the box (1408..1542 × 696..724)
  const CAV = { x: 1386, w: 178, y1: 668, h1: 58, y2: 736, h2: 92 };
  const BIN = { x: 1160, y: 914 };
  const BOX_LAND = 26.45;
  // box centre + rotation (world). Pure function of t.
  function boxState(t) {
    const home = BOX_HOME, noaHold = [NOA_CAB + 42 * NOA_S, 905 - 176 * NOA_S];
    if (t < 25.2) return { x: home[0], y: home[1], rot: 0, ph: 'shelf' };
    if (t < 25.45) return { x: home[0] - 6 * sm(25.2, 25.45, t) + Math.sin(t * 70) * 3, y: home[1] + Math.sin(t * 55) * 1.5, rot: Math.sin(t * 60) * 0.02, ph: 'stuck' };
    if (t < 25.7) { const k = E.outBack(inv(25.45, 25.7, t)); return { x: lerp(home[0] - 6, noaHold[0], k), y: lerp(home[1], noaHold[1], k) - Math.sin(Math.PI * inv(25.45, 25.7, t)) * 30, rot: -0.25 * Math.sin(Math.PI * inv(25.45, 25.7, t)), ph: 'yank' }; }
    if (t < 26.12) { const lift = E.outBack(inv(25.72, 25.95, t)); return { x: noaHold[0] + 6 * lift, y: noaHold[1] - 34 * lift + Math.sin(t * 9) * 2, rot: 0.08 * lift, ph: 'held' }; }
    const rel = [NOA_CAB - 40 * NOA_S, 905 - 320 * NOA_S];
    if (t < 26.27) { const k = E.inOut(inv(26.12, 26.27, t)); return { x: lerp(noaHold[0] + 6, rel[0], k), y: lerp(noaHold[1] - 34, rel[1], k), rot: lerp(0.08, -0.6, k), ph: 'swing' }; }
    if (t < BOX_LAND) { const k = inv(26.27, BOX_LAND, t); const end = [BIN.x + 6, BIN.y - 84]; return { x: lerp(rel[0], end[0], k), y: lerp(rel[1], end[1], k) - Math.sin(Math.PI * k) * 120 + k * k * 30, rot: -0.6 - k * 4.2, ph: 'air' }; }
    const w = Math.exp(-(t - BOX_LAND) * 7) * Math.sin((t - BOX_LAND) * 30);
    return { x: BIN.x + 6 + w * 4, y: BIN.y - 84 + Math.abs(w) * 6, rot: -4.8 + 0.1 * w + 0.12 + A.TAU, ph: 'bin' };
  }
  function drawOldBox(ctx, x, y, rot, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = A.linear(ctx, 0, -14, 0, 14, [[0, '#4a4a5a'], [1, '#15151d']]); A.rrect(ctx, -67, -14, 134, 28, 5); ctx.fill();
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-62, -12, 124, 3);
    ctx.fillStyle = '#081a22'; ctx.fillRect(-53, -6, 60, 12);
    A.text(ctx, 'IPTV', -23, 0.5, { font: '700 10px Rubik', fill: '#5fe8ff' });
    const alive = t < 25.45 ? 1 : (Math.sin(t * 30) > 0.3 && t < 26.3 ? 1 : 0);
    ctx.fillStyle = t < 25.45 ? '#48ff8a' : '#ff4a3a'; ctx.globalAlpha = 0.3 + 0.7 * alive; A.ellipse(ctx, 42, 0, 3, 3); ctx.fill();
    ctx.restore();
  }
  // one tangled cable from a to b (world), loopy spaghetti with plugs
  const CABLES = [['#141218', 7, 0], ['#e9e6ee', 5, 1], ['#2d2d38', 6, 2], ['#d9b033', 4, 3], ['#3a64d8', 4, 4]];
  function drawCable(ctx, a, b, seed, slack, t, lw, col) {
    const N = 42, pts = [];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const loops = 2 + (seed % 3), ph = seed * 1.7 + t * 0.8;
    for (let i = 0; i <= N; i++) {
      const u = i / N, env = Math.sin(Math.PI * u);
      const r = slack * (16 + 6 * (seed % 2)) * env;
      const wig = slack * 22 * Math.sin(u * Math.PI * (3 + seed) + ph) * env;
      pts.push([a[0] + dx * u + nx * wig + r * Math.cos(A.TAU * loops * u + ph), a[1] + dy * u + ny * wig + r * Math.sin(A.TAU * loops * u + ph) + slack * 40 * env]);
    }
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    path(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = lw + 3; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    // plug at the loose end
    ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(pts[1][1] - a[1], pts[1][0] - a[0]));
    ctx.fillStyle = col; A.rrect(ctx, -12, -5, 14, 10, 2); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c9c2a0'; ctx.fillRect(-18, -2.5, 6, 5);
    ctx.restore();
  }
  function drawSpaghetti(ctx, t, b) {
    if (t < 25.2) return;
    // where the loose ends are: behind the shelf while attached, then trailing through the air, then hanging out of the bin
    let src;
    if (t < 26.27) src = [BOX_HOME[0] + 50, BOX_HOME[1] + 8];
    else if (t < BOX_LAND + 0.05) { const b2 = boxState(Math.max(26.27, t - 0.12)); src = [b2.x + 40, b2.y + 30]; }
    else src = [BIN.x + 70, BIN.y - 8];
    const slack = t < 25.45 ? 0.15 : t < 25.7 ? lerp(0.15, 1, inv(25.45, 25.7, t)) : 1;
    CABLES.forEach(([col, lw, sd], i) => {
      const a = [src[0] + (i - 2) * 9, src[1] + (i % 2) * 8];
      const bb = [b.x + Math.cos(b.rot) * (40 - i * 8), b.y + Math.sin(b.rot) * (40 - i * 8) + 8];
      drawCable(ctx, a, bb, sd, slack * (t >= BOX_LAND ? 0.6 : 1), t, lw, col);
    });
  }
  function coverShelf(ctx) {
    const cav = (cy, ch) => { ctx.fillStyle = A.linear(ctx, 0, cy, 0, cy + ch, [[0, '#0e0605'], [0.7, '#23130d'], [1, '#2e1a12']]); ctx.fillRect(CAV.x, cy, CAV.w, ch); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2.5; ctx.strokeRect(CAV.x, cy, CAV.w, ch); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(CAV.x, cy, CAV.w, 8); };
    ctx.save(); cav(CAV.y1, CAV.h1); cav(CAV.y2, CAV.h2);
    // a dust-free rectangle where the box used to sit
    ctx.fillStyle = 'rgba(120,80,60,0.18)'; ctx.fillRect(1410, 718, 130, 6);
    ctx.restore();
  }
  function drawBin(ctx, t, layer) {
    const wob = t > BOX_LAND ? 0.13 * Math.exp(-(t - BOX_LAND) * 6) * Math.sin((t - BOX_LAND) * 26) : 0;
    ctx.save(); ctx.translate(BIN.x, BIN.y); ctx.rotate(wob);
    const H = 108, wt = 50, wb = 40;
    if (layer === 'back') {
      ctx.fillStyle = A.radial(ctx, 0, 4, 0, 70, [[0, 'rgba(10,3,3,0.5)'], [1, 'rgba(10,3,3,0)']]); ctx.save(); ctx.scale(1, 0.2); ctx.fillRect(-80, -60, 160, 120); ctx.restore();
      A.ellipse(ctx, 0, -H, wt, 12); ctx.fillStyle = '#1c1a22'; ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-wt, -H); ctx.lineTo(-wb, 0); ctx.quadraticCurveTo(0, 8, wb, 0); ctx.lineTo(wt, -H); ctx.quadraticCurveTo(0, -H + 12, -wt, -H); ctx.closePath();
      ctx.fillStyle = A.linear(ctx, -wt, 0, wt, 0, [[0, '#5d6478'], [0.35, '#a7afc2'], [0.6, '#7b8397'], [1, '#474d5e']]); ctx.fill();
      ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(30,30,45,0.35)'; ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -H + 10); ctx.lineTo(i * 9.6, -6); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, -H, wt, 12, 0, 0, Math.PI); ctx.strokeStyle = '#c9cfdc'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  function crashFX(ctx, t) {
    const k = inv(BOX_LAND, BOX_LAND + 0.45, t); if (k <= 0 || k >= 1) return;
    const cx = BIN.x, cy = BIN.y - 110;
    ctx.save();
    // impact star lines
    ctx.strokeStyle = `rgba(255,240,200,${1 - k})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 8), r0 = 50 + 60 * E.out(k), r1 = r0 + 40 * (1 - k); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.8); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.8); ctx.stroke(); }
    // flying bits (a key, a remote button, a screw)
    const r = A.rng(9);
    for (let i = 0; i < 8; i++) {
      const vx = (r() - 0.5) * 520, vy = -260 - r() * 320, tt = t - BOX_LAND, x = cx + vx * tt, y = cy + vy * tt + 900 * tt * tt;
      ctx.save(); ctx.translate(x, y); ctx.rotate(tt * (6 + i)); ctx.globalAlpha = 1 - k;
      ctx.fillStyle = ['#2d2d38', '#5fe8ff', '#c9c2a0', '#48ff8a'][i % 4]; ctx.fillRect(-4, -3, 8, 6); ctx.restore();
    }
    // dust puff
    for (let i = 0; i < 6; i++) { const a = Math.PI * (1 + i / 5), rr = 30 + 50 * E.out(k); ctx.globalAlpha = 0.35 * (1 - k); ctx.fillStyle = A.radial(ctx, cx + Math.cos(a) * rr, cy + 10 + Math.sin(a) * rr * 0.3, 0, 26, [[0, '#d8d0c8'], [1, 'rgba(216,208,200,0)']]); ctx.fillRect(cx + Math.cos(a) * rr - 30, cy + 10 + Math.sin(a) * rr * 0.3 - 30, 60, 60); }
    ctx.restore();
  }
  // Noa's phone in the room (anchor-local hand position → world)
  function roomPhone(ctx, n, t) {
    if (!n.o.phone) return;
    const f = n.o.flip ? -1 : 1, up = E.outBack(inv(27.0, 27.3, t));
    const lx = lerp(18, 50, up), ly = lerp(-128, -196, up);
    const x = n.x + f * lx * NOA_S, y = n.y + ly * NOA_S;
    A.glow(ctx, x, y - 10, 110, '#c9ffd8', 0.35 * up);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12 * f);
    A.rrect(ctx, -15, -27, 30, 54, 6); ctx.fillStyle = '#16161c'; ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#e9f7ee'; ctx.fillRect(-12, -23, 24, 44); ctx.fillStyle = '#008069'; ctx.fillRect(-12, -23, 24, 8);
    ctx.fillStyle = '#d9fdd3'; ctx.fillRect(-10, -8, 16, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, 2, 14, 5);
    ctx.restore();
  }

  // ------------------------------------------------------------ the room with everyone in it (world coords)
  function room(ctx, t, opt = {}) {
    const L = tvLight(t);
    A.drawLivingRoom(ctx, t, { tvGlow: { color: L.color, intensity: L.intensity } });
    if (t >= 25.45) coverShelf(ctx);
    const tv = LR.tv;
    A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, tvState(t));
    tvOverlays(ctx, tv.x, tv.y, tv.w, tv.h, t);
    // router (plain home internet): busy while live, lazy after the freeze, busy again once GOTV runs
    const tR = t < FREEZE ? t : t < PRESS ? FREEZE + (t - FREEZE) * 0.3 : t - PRESS + FREEZE + (PRESS - FREEZE) * 0.3;
    A.drawRouter(ctx, ROUTER.x, ROUTER.y, ROUTER.s, { t: tR, activity: t < FREEZE || t >= PRESS ? 0.65 : 0.08, ledColor: t < FREEZE + 0.15 || t >= PRESS ? '#7ff6ff' : '#ffa23a' });
    // Saba (steps forward out of the chair as he rises)
    const so = sabaO(t), out = so.rise > 0.5;
    const sx = SAB.x + 58 * E.inOut(cl(so.rise || 0));
    A.drawArmchair(ctx, SAB.x, SAB.y, 1, 'back');
    if (out) A.drawArmchair(ctx, SAB.x, SAB.y, 1, 'front');
    A.drawSaba(ctx, sx, SAB.y, SAB.s, so);
    if (!out) A.drawArmchair(ctx, SAB.x, SAB.y, 1, 'front');
    if (opt.reflect) glassesReflection(ctx, so, t, opt.reflect, sx);
    // the bin (appears as she marches over; it was always there by the cabinet)
    const bs = boxState(t);
    if (t > 24.6) {
      drawBin(ctx, t, 'back');
      if (bs.ph === 'bin') { drawOldBox(ctx, bs.x, bs.y, bs.rot, t); drawSpaghetti(ctx, t, bs); }
      drawBin(ctx, t, 'front');
    }
    // Noa + the backgammon case
    const n = noaState(t);
    if (!n.caseP && t >= 21.5) drawCase(ctx, 1108, 790, 0.46, t);
    if (bs.ph === 'shelf' || bs.ph === 'stuck') { drawOldBox(ctx, bs.x, bs.y, bs.rot, t); }
    A.drawNoa(ctx, n.x, n.y, NOA_S, n.o);
    if (n.caseP) drawCase(ctx, n.caseP[0], n.caseP[1], n.caseP[2], t);
    if (bs.ph !== 'bin' && bs.ph !== 'shelf') { drawSpaghetti(ctx, t, bs); if (bs.ph !== 'stuck') drawOldBox(ctx, bs.x, bs.y, bs.rot, t); }
    crashFX(ctx, t);
    roomPhone(ctx, n, t);
    A.glow(ctx, tv.x + tv.w * 0.4, tv.y + tv.h * 0.6, 900, L.color, 0.09 * L.intensity);
  }
  function caption(ctx, t) {
    const a = sm(6.45, 6.85, t) * (1 - sm(8.9, 9.4, t));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const x = 78, y = 86, dx = (1 - E.out(sm(6.45, 7.1, t))) * -16;
    ctx.fillStyle = 'rgba(12,8,28,0.35)'; A.rrect(ctx, x - 22 + dx, y - 30, 300, 60, 14); ctx.fill();
    ctx.fillStyle = '#ffd21f'; ctx.fillRect(x - 22 + dx, y - 30, 5, 60);
    A.text(ctx, 'טורונטו · 15:47', x + dx, y + 1, { font: '700 34px Rubik', fill: '#fff8e6', align: 'left', dir: 'rtl', stroke: 'rgba(15,10,35,0.6)', lw: 5 });
    ctx.restore();
  }

  // ------------------------------------------------------------ camera per shot (interior shots)
  function interiorCam(t) {
    const c = interiorCam0(t), z = Math.max(1, c.zoom);
    c.x = cl(c.x, 960 / z, 1920 - 960 / z); c.y = cl(c.y, 540 / z, 1080 - 540 / z);
    return c;
  }
  function interiorCam0(t) {
    if (t < 10.2) return {
      x: K(t, [[6.2, 330], [6.45, 350], [7.0, 745, 'inOut'], [7.55, 740], [8.7, 960], [10.2, 950]]),
      y: K(t, [[6.2, 300], [6.45, 305], [7.0, 470, 'inOut'], [7.55, 475], [8.7, 540], [10.2, 530]]),
      zoom: zkey(t, [[6.2, 2.25], [6.45, 2.2], [7.0, 1.85, 'inOut'], [7.55, 1.7], [8.7, 1.0], [10.2, 1.06]]),
    };
    if (t < 12.45) return { x: K(t, [[10.2, 870], [12.45, 885]]), y: K(t, [[10.2, 545], [12.45, 540]]), zoom: K(t, [[10.2, 1.5], [12.45, 1.62]], 'lin') };
    if (t < 13.9) return { x: K(t, [[12.45, 800], [13.9, 790]]), y: 472, zoom: K(t, [[12.45, 2.05], [13.9, 2.2]], 'lin') };
    if (t < 14.9) return { x: K(t, [[13.9, 860], [14.9, 850]]), y: K(t, [[13.9, 575], [14.9, 520]], 'out'), zoom: K(t, [[13.9, 1.35], [14.9, 1.5]], 'out') };
    if (t < 17.72) return {
      x: K(t, [[15.75, 760], [16.0, 760], [16.22, 722, 'out'], [17.72, 716]]),
      y: K(t, [[15.75, 540], [16.0, 540], [16.22, 468, 'out'], [17.72, 462]]),
      zoom: zkey(t, [[15.75, 1.42], [16.0, 1.45], [16.22, 2.55, 'out'], [17.72, 2.85, 'lin']]),
    };
    if (t < 20.35) return { x: K(t, [[17.72, 1090], [20.35, 1070]]), y: K(t, [[17.72, 488], [20.35, 480]]), zoom: K(t, [[17.72, 1.3], [20.35, 1.4]], 'lin') };
    if (t < 24.8) return {
      x: K(t, [[20.35, 880], [21.2, 930], [24.8, 960]]), y: K(t, [[20.35, 560], [21.2, 575], [24.8, 565]]),
      zoom: zkey(t, [[20.35, 1.4], [21.2, 1.5], [24.8, 1.62, 'lin']]),
    };
    const base = {
      x: K(t, [[24.8, 960], [25.7, 1428], [28.0, 1426]]),
      y: K(t, [[24.8, 565], [25.7, 630], [28.0, 640]]),
      zoom: zkey(t, [[24.8, 1.62], [25.7, 1.92], [28.0, 2.02, 'lin']]),
    };
    if (t >= 28.1) {
      const p = inv(28.1, 28.6, t), q = inv(28.6, 29.2, t);
      base.x = lerp(base.x, LED[0], E.inOut(Math.min(1, p * 1.4)));
      base.y = lerp(base.y, LED[1], E.inOut(Math.min(1, p * 1.4)));
      base.zoom = 2.02 * Math.pow(7 / 2.02, E.in(p)) * Math.pow(18 / 7, E.out(q));
    }
    return base;
  }

  // full-screen TV insert
  function tvInsert(ctx, t) {
    const push = K(t, [[14.9, 1.0], [FREEZE, 1.06, 'lin'], [FREEZE + 0.06, 1.1, 'out'], [15.75, 1.12, 'lin']]);
    const jx = t >= FREEZE && t < FREEZE + 0.12 ? A.noise1(t * 60) * 14 : 0;
    ctx.save();
    ctx.translate(960 + jx, 540); ctx.scale(push, push); ctx.translate(-960, -540);
    A.drawTVScreen(ctx, 0, 0, 1920, 1080, t, tvState(t));
    tvOverlays(ctx, 0, 0, 1920, 1080, t);
    ctx.restore();
    ctx.save();
    ctx.drawImage(A.layer('s2:scan', 1920, 1080, (g, w, h) => {
      g.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2);
      g.fillStyle = A.linear(g, 0, 0, w, h, [[0, 'rgba(255,255,255,0.10)'], [0.3, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.66, 'rgba(255,255,255,0.05)'], [0.7, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h);
      g.fillStyle = A.radial(g, w / 2, h / 2, h * 0.55, h * 1.1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]); g.fillRect(0, 0, w, h);
    }), 0, 0);
    if (t >= FREEZE && t < FREEZE + 0.12) { ctx.globalAlpha = 1 - (t - FREEZE) / 0.12; ctx.fillStyle = '#e8fbff'; ctx.fillRect(0, 0, 1920, 1080); }
    ctx.restore();
  }

  // ------------------------------------------------------------ dive into the gold LED (screen space)
  function diveFX(ctx, t) {
    if (t < PRESS) return;
    const q = inv(28.6, 29.2, t);
    const c = [960, 540];
    const bl = sm(28.1, 28.95, t);
    A.glow(ctx, c[0], c[1], 120 + 700 * bl * bl, '#ffd36a', 0.2 + 0.6 * bl);
    if (q > 0) {
      const R = 120 + 1600 * E.in(q);
      ctx.save(); ctx.globalAlpha = sm(28.6, 28.75, t);
      ctx.fillStyle = A.radial(ctx, c[0], c[1], 0, R, [[0, '#ffffff'], [0.35, 'rgba(255,250,228,0.97)'], [0.7, 'rgba(255,214,110,0.55)'], [1, 'rgba(255,201,60,0)']]);
      ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
    const sl = sm(28.4, 28.75, t) * (1 - sm(29.05, 29.2, t));
    if (sl > 0) {
      ctx.save();
      const r = A.rng(5);
      for (let i = 0; i < 90; i++) {
        const a = r() * A.TAU, sp = 0.6 + r() * 1.4, ph = (r() + (t - 28.35) * sp * 2.4) % 1;
        const r0 = 80 + ph * ph * 1300, len = 60 + ph * 420 * (0.5 + q);
        const warm = r() < 0.7;
        ctx.globalCompositeOperation = q > 0.3 ? 'source-over' : 'lighter';
        ctx.strokeStyle = warm ? `rgba(${q > 0.3 ? '235,170,40' : '255,214,120'},${0.6 * sl})` : `rgba(${q > 0.3 ? '41,190,230' : '160,250,255'},${0.45 * sl})`;
        ctx.lineWidth = 1.5 + ph * 5 * r();
        ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0); ctx.lineTo(c[0] + Math.cos(a) * (r0 + len), c[1] + Math.sin(a) * (r0 + len)); ctx.stroke();
      }
      for (let k = 0; k < 6; k++) {
        const ph = ((t - 28.45) * 2.2 + k / 6) % 1; if (ph < 0) continue;
        ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(255,190,50,${0.4 * sl * (1 - ph)})`; ctx.lineWidth = 3 + ph * 20;
        A.ellipse(ctx, c[0], c[1], 40 + ph * ph * 1400, 40 + ph * ph * 1400); ctx.stroke();
      }
      ctx.restore();
    }
    const f = sm(28.85, 29.1, t);
    if (f > 0) {
      ctx.save(); ctx.globalAlpha = f;
      ctx.fillStyle = A.radial(ctx, 960, 540, 0, 1200, [[0, '#ffffff'], [0.5, '#fffbe8'], [1, '#ffe7a6']]); ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ scene
  const INSERT = [14.9, 15.75];
  A.scene({
    name: 's2_livingroom', start: 6.2, end: 29.2,
    draw(ctx, s) {
      const t = s.t;
      const inside = 1;
      const inInsert = t >= INSERT[0] && t < INSERT[1];
      if (!inInsert && inside > 0) {
        ctx.save(); ctx.globalAlpha = inside;
        ctx.save(); A.camera(ctx, interiorCam(t));
        room(ctx, t, { reflect: t > 15.8 && t < 17.72 ? sm(15.85, 16.2, t) : 0 });
        ctx.restore();
        ctx.restore();
        grade(ctx, t, gradeAmt(t) * (1 - 0.4 * sm(28.0, 28.5, t)));
      }
      if (inInsert) { tvInsert(ctx, t); grade(ctx, t, 0.35 * sm(FREEZE, FREEZE + 0.3, t)); }
      const f0 = 1 - sm(6.2, 6.5, t);
      if (f0 > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f0;
        ctx.fillStyle = '#dff8ff'; ctx.fillRect(0, 0, 1920, 1080);
        ctx.fillStyle = A.linear(ctx, 0, 480, 0, 600, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 480, 1920, 120);
        ctx.restore();
      }
      caption(ctx, t);
      diveFX(ctx, t);
    },
  });
})();
