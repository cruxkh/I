// s7 PRESS AND WATCH + recap (29.9 to 36.95)
// A: paper remote + giant paper finger presses the yellow button, TV lights up.  B: recap (streamers, then live/sport/football).
// C: thumbs up + check + crossed-out buffering wheel.
(() => {
  const { clamp, lerp, inv, ease, hash, rng, TAU } = A;
  const C = CL.C, W = CL.W, H = CL.H;
  const Q = (t, f = 12) => CL.q(t, f);
  const SKIN = '#F5B48A', SKIN_DK = '#D98F62';

  // ---- torn-paper wipe of a new page over the old one. dir 0 from right, 1 from bottom, 2 from left
  function wipe(ctx, dir, p, drawNew, seed = 1) {
    if (p <= 0) return; if (p >= 1) { drawNew(); return; }
    const pp = ease.out(clamp(Q(p * 100, 24) / 100)), L = (dir === 1 ? H : W) + 200, sgn = dir === 2 ? 1 : -1;
    const X = dir === 2 ? -100 + pp * L : (dir === 1 ? H : W) + 100 - pp * L, N = dir === 1 ? W : H;
    const path = off => {
      ctx.beginPath(); const x0 = X + off;
      for (let i = -1; i <= N / 30 + 1; i++) { const j = (hash(i * 1.9 + seed * 7) - .5) * 36 + (hash(i * .7 + Q(p * 60, 12)) - .5) * 6, a = i * 30;
        if (dir === 1) ctx.lineTo(a, x0 + j); else ctx.lineTo(x0 + j, a); if (i === -1) { /* first point already lineTo acts as move */ } }
      if (dir === 1) { ctx.lineTo(W + 40, H + 300); ctx.lineTo(-40, H + 300); } else { const far = dir === 2 ? -300 : W + 300; ctx.lineTo(far, N + 40); ctx.lineTo(far, -40); }
      ctx.closePath();
    };
    ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.32)'; path(sgn * 30); ctx.fill(); ctx.fillStyle = C.white; path(sgn * 13); ctx.fill();
    path(0); ctx.clip(); drawNew(); ctx.restore();
  }

  // ---- confetti scraps thrown from (cx,cy) at t0 (stepped, gravity)
  function confetti(ctx, t, t0, n, cx, cy, seed, dur = 1.8, spd = 1100) {
    const u = Q(t) - t0; if (u < 0 || u > dur) return; const cols = [C.yellow, C.blue, C.red, C.pink, C.green, C.orange, C.white];
    for (let i = 0; i < n; i++) {
      const a = hash(seed + i * 1.7) * TAU, v = (.35 + hash(seed + i * 3.1) * .65) * spd, k = (1 - Math.exp(-u * 3.5)) / 3.5;
      const x = cx + Math.cos(a) * v * k, y = cy + Math.sin(a) * v * k + 520 * u * u, s = 18 + hash(seed + i * 5.3) * 22, r = hash(seed + i) * TAU + u * 5 * (hash(seed + i * 9) - .5);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = 'rgba(40,20,0,.28)'; shape(ctx, i % 3, s, 5, 7); ctx.fillStyle = cols[i % cols.length]; shape(ctx, i % 3, s, 0, 0); ctx.restore();
    }
  }
  function shape(ctx, k, s, ox, oy) { ctx.beginPath(); if (k === 0) ctx.rect(-s * .8 + ox, -s * .5 + oy, s * 1.6, s); else if (k === 1) { ctx.moveTo(ox, -s * .7 + oy); ctx.lineTo(s * .7 + ox, s * .6 + oy); ctx.lineTo(-s * .7 + ox, s * .6 + oy); ctx.closePath(); } else ctx.arc(ox, oy, s * .5, 0, TAU); ctx.fill(); }

  // ---- static layers
  const remoteLayer = () => CL.layer('s7remote', 360, 820, g => {
    g.fillStyle = '#0B1F5C'; g.strokeStyle = C.ink; g.lineWidth = 9; g.beginPath(); g.roundRect(20, 20, 320, 780, 64); g.fill(); g.stroke();
    g.fillStyle = C.red; g.beginPath(); g.arc(180, 62, 13, 0, TAU); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.arc(180, 170, 96, 0, TAU); g.fill();                                       // recess for the yellow button
    g.fillStyle = '#2a3a8c'; g.beginPath(); g.arc(180, 400, 112, 0, TAU); g.fill(); g.lineWidth = 7; g.stroke();
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { g.save(); g.translate(180, 400); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(-22, -70); g.lineTo(22, -70); g.lineTo(0, -98); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = C.blue; g.beginPath(); g.arc(180, 400, 44, 0, TAU); g.fill(); g.lineWidth = 6; g.stroke();
    [[90, C.red], [180, C.green], [270, C.orange]].forEach(([x, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, 570, 36, 0, TAU); g.fill(); g.lineWidth = 6; g.stroke(); });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#dfe6ff'; g.beginPath(); g.roundRect(56 + c * 98, 636 + r * 72, 76, 48, 16); g.fill(); g.lineWidth = 5; g.stroke(); }
  });
  const handLayer = () => CL.layer('s7hand', 420, 1100, g => {           // pointing hand, tip at top (210,30), arm goes down
    g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = C.ink;
    g.fillStyle = C.blue; g.beginPath(); g.rect(60, 790, 300, 310); g.fill(); g.stroke();                              // sleeve
    g.fillStyle = C.yellow; g.fillRect(64, 820, 292, 46); g.strokeRect(60, 820, 300, 46);
    g.fillStyle = SKIN; g.beginPath(); g.roundRect(70, 440, 290, 370, 80); g.fill(); g.stroke();                       // palm
    g.beginPath(); g.roundRect(150, 30, 130, 560, 65); g.fill(); g.stroke();                                            // index
    g.fillStyle = '#FFE3D0'; g.beginPath(); g.roundRect(172, 44, 86, 120, 40); g.fill(); g.lineWidth = 6; g.stroke();   // nail
    g.lineWidth = 10; g.fillStyle = SKIN;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.roundRect(240, 420 + i * 82, 130, 84, 42); g.fill(); g.stroke(); }    // curled fingers
    g.beginPath(); g.save(); g.translate(120, 560); g.rotate(-.5); g.roundRect(-70, -50, 150, 100, 50); g.fill(); g.stroke(); g.restore();  // thumb
    g.strokeStyle = SKIN_DK; g.lineWidth = 7; g.beginPath(); g.moveTo(170, 330); g.lineTo(240, 330); g.moveTo(172, 400); g.lineTo(236, 400); g.stroke();
  });
  const thumbLayer = () => CL.layer('s7thumb', 620, 660, g => {
    g.lineJoin = 'round'; g.lineWidth = 11; g.strokeStyle = C.ink;
    g.fillStyle = C.blue; g.beginPath(); g.rect(16, 300, 140, 320); g.fill(); g.stroke(); g.fillStyle = C.yellow; g.fillRect(20, 350, 132, 44); g.strokeRect(16, 350, 140, 44);
    g.fillStyle = SKIN; g.beginPath(); g.roundRect(140, 290, 420, 330, 76); g.fill(); g.stroke();
    g.save(); g.translate(230, 190); g.rotate(-.08); g.beginPath(); g.roundRect(-78, -170, 156, 400, 78); g.fill(); g.stroke(); g.restore();      // thumb
    for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(250, 300 + i * 80, 350 - (i === 3 ? 30 : 0), 80, 40); g.fill(); g.stroke(); }
    g.strokeStyle = SKIN_DK; g.lineWidth = 7; g.beginPath(); g.moveTo(190, 120); g.quadraticCurveTo(210, 100, 250, 108); g.stroke();
  });
  const ballLayer = () => CL.layer('s7ball', 300, 300, g => {
    const R = 138; g.translate(150, 150); g.fillStyle = C.white; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip(); g.fillStyle = C.ink; g.strokeStyle = C.ink; g.lineWidth = 7; g.lineJoin = 'round';
    const pent = (x, y, r, a) => { g.beginPath(); for (let i = 0; i < 5; i++) { const an = a + i * TAU / 5; g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } g.closePath(); g.fill(); };
    pent(0, 0, 46, -Math.PI / 2);
    for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * TAU / 5; g.beginPath(); g.moveTo(Math.cos(an) * 46, Math.sin(an) * 46); g.lineTo(Math.cos(an) * 92, Math.sin(an) * 92); g.stroke(); pent(Math.cos(an + .63) * 142, Math.sin(an + .63) * 142, 50, an + .63 + Math.PI); }
    g.restore(); g.lineWidth = 9; g.strokeStyle = C.ink; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
  });

  // ---- TV
  function tv(ctx, cx, cy, w, h, screen, t, o = {}) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineCap = 'round';                                                 // antennas
    ctx.beginPath(); ctx.moveTo(-30, -h / 2); ctx.lineTo(-150, -h / 2 - 110); ctx.moveTo(30, -h / 2); ctx.lineTo(140, -h / 2 - 130); ctx.stroke();
    ctx.fillStyle = C.red; [[-150, -h / 2 - 110], [140, -h / 2 - 130]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.lineWidth = 7; ctx.stroke(); });
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 28, 46); ctx.fill();
    ctx.restore();
    CL.tv(ctx, cx, cy, w, h, { rot: o.rot, draw: (g, sw, sh) => screen(g, sw, sh, t) });
  }
  const statics = (g, sw, sh, t) => {
    g.fillStyle = '#1c1c26'; g.fillRect(0, 0, sw, sh); const q = Math.floor(t * 12);
    for (let i = 0; i < 120; i++) { const v = 60 + hash(q * 3 + i) * 120; g.fillStyle = `rgb(${v},${v},${v + 12})`; g.fillRect(hash(i * 1.3 + q) * sw, hash(i * 2.9 + q * 5) * sh, 30 + hash(i) * 90, 10 + hash(i * 4) * 22); }
    g.fillStyle = C.red; g.beginPath(); g.arc(sw - 40, sh - 40, 12, 0, TAU); g.fill();
  };
  const sunburst = (g, cx, cy, R, n, rot, c1, c2) => { g.fillStyle = c1; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.fillStyle = c2; for (let i = 0; i < n; i += 2) { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, rot + i * TAU / n, rot + (i + 1) * TAU / n); g.closePath(); g.fill(); } };
  const screenA = (g, sw, sh, t) => {
    const lt = t - 31.12; if (lt < 0) return statics(g, sw, sh, t);
    if (lt < .08) { g.fillStyle = '#fff'; g.fillRect(0, 0, sw, sh); return; }
    sunburst(g, sw / 2, sh / 2, 900, 16, Q(t, 8) * .18, C.yellow, C.orange);
    const s = CL.pop(t, 31.2, .3) || 0.01; g.save(); g.translate(sw / 2, sh / 2); g.scale(s * 1.05, s * 1.05); g.fillStyle = C.white; g.strokeStyle = C.ink; g.lineWidth = 10;
    g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill(); g.stroke(); g.fillStyle = C.red; g.beginPath(); g.moveTo(-36, -62); g.lineTo(70, 0); g.lineTo(-36, 62); g.closePath(); g.fill(); g.stroke(); g.restore();
  };
  const POSTER = [C.red, C.blue, C.green, C.pink, C.orange, '#8B5CF6'];
  const screenCarousel = (g, sw, sh, t) => {
    g.fillStyle = '#222'; g.fillRect(0, 0, sw, sh); CL.halftone(g, 0, 0, sw, sh, C.yellow, 26, .5, { alpha: .35 });
    const step = 250, off = Q(t, 8) * 110 % (step * POSTER.length);
    for (let i = -1; i < 6; i++) { const k = ((i + Math.floor(off / step)) % POSTER.length + POSTER.length) % POSTER.length, x = i * step - (off % step) + 30, y = sh / 2 + Math.sin(i * 2) * 8;
      g.save(); g.translate(x + 105, y); g.rotate(Math.sin(i * 3 + k) * .05); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-100 + 8, -150 + 10, 210, 310); g.fillStyle = C.white; g.fillRect(-110, -160, 220, 320); g.fillStyle = POSTER[k]; g.fillRect(-96, -146, 192, 292);
      g.fillStyle = C.cream; g.beginPath(); if (k % 3 === 0) g.arc(0, -30, 46, 0, TAU); else if (k % 3 === 1) { for (let a = 0; a < 10; a++) g.lineTo(Math.cos(a * TAU / 10 - 1.57) * (a % 2 ? 26 : 56), -30 + Math.sin(a * TAU / 10 - 1.57) * (a % 2 ? 26 : 56)); g.closePath(); } else { g.moveTo(-40, 10); g.lineTo(0, -80); g.lineTo(40, 10); g.closePath(); } g.fill();
      g.fillStyle = C.ink; g.fillRect(-70, 70, 140, 14); g.fillRect(-70, 100, 90, 12); g.restore(); }
  };
  const screenPitch = (g, sw, sh, t) => {
    g.fillStyle = '#2BC48A'; g.fillRect(0, 0, sw, sh); g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 8; i += 2) g.fillRect(i * sw / 8, 0, sw / 8, sh);
    g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(24, 24, sw - 48, sh - 48); g.beginPath(); g.moveTo(sw / 2, 24); g.lineTo(sw / 2, sh - 24); g.stroke(); g.beginPath(); g.arc(sw / 2, sh / 2, 70, 0, TAU); g.stroke();
    g.strokeRect(24, sh / 2 - 100, 100, 200); g.strokeRect(sw - 124, sh / 2 - 100, 100, 200);
    const q = Q(t, 8), bx = sw / 2 + Math.sin(q * 2.2) * 260, by = sh / 2 + Math.sin(q * 3.7) * 110;
    [[-1, C.yellow, 0], [1, C.blue, 1.3]].forEach(([d, c, p]) => { const px = bx - d * 90 + Math.sin(q * 2 + p) * 40, py = by + 60 * d + Math.cos(q * 3 + p) * 30; g.fillStyle = c; g.strokeStyle = C.ink; g.lineWidth = 7; g.beginPath(); g.arc(px, py, 30, 0, TAU); g.fill(); g.stroke(); });
    g.fillStyle = '#fff'; g.strokeStyle = C.ink; g.beginPath(); g.arc(bx, by, 17, 0, TAU); g.fill(); g.stroke();
    if (Math.floor(t * 3) % 2) { g.fillStyle = C.red; g.beginPath(); g.arc(sw - 60, 60, 16, 0, TAU); g.fill(); }
  };

  // ============ PHASE A
  const HS = .8, BTN = { x: 1127, y: 239 }, HAND_ROT = -.55, DIR = [-Math.sin(HAND_ROT), Math.cos(HAND_ROT)];
  function phaseA(ctx, t) {
    ctx.drawImage(CL.layer('s7bgA', W, H, g => CL.paper(g, 'blue', { dots: C.yellow, dotSize: 36, dotAlpha: .2, dotFade: 'radial' })), 0, 0);
    const jt = CL.j(t, 1, 2);
    CL.scrap(ctx, 470 + jt[0], 450 + jt[1], 920, 700, { fill: C.cream, seed: 11, rot: -.03, tape: false });
    CL.tape(ctx, 60, 130, -.5, 170, 50); CL.tape(ctx, 870, 750, -.45, 170, 50);
    const sh = CL.shake(t, 31.12, .5, 10);
    tv(ctx, 470 + sh[0], 470 + sh[1], 780, 520, screenA, t);
    if (t > 31.15 && t < 31.6) CL.sparks(ctx, 470, 470, 440, 520, 14, t, { color: C.ink, lw: 9 });
    // remote
    const rs = CL.pop(t, 29.95, .3); const rj = CL.j(t, 2, 2);
    if (rs) {
      ctx.save(); ctx.translate(1150 + rj[0], 430 + rj[1]); ctx.rotate(-.12); ctx.scale(.8 * rs, .8 * rs);
      const rl = remoteLayer(); CL.sticker(ctx, rl, 0, 0, 360, 820, {});
      const tp = Q(t) - 30.34, sq = tp >= 0 && tp < .09 ? .5 : tp >= .09 && tp < .2 ? .62 : tp >= .2 && tp < .25 ? .78 : tp >= .25 && tp < .33 ? 1.14 : 1;
      ctx.translate(0, -240); ctx.scale(tp >= 0 && tp < .25 ? 1.12 : 1, sq);
      ctx.fillStyle = tp >= 0 && tp < .25 ? '#F0B800' : C.yellow; ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 78, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(34, 0); ctx.lineTo(-20, 30); ctx.closePath(); ctx.fill();
      if (!(tp >= 0 && tp < .25)) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 56, 3.5, 4.4); ctx.stroke(); }
      ctx.restore();
    }
    // finger
    const qt = Q(t), fd = A.key(qt, [[30.03, 1500], [30.27, 130, 'out'], [30.34, -14, 'lin'], [30.58, -14, 'lin'], [30.8, 1500, "in"]]);
    if (fd < 1400) { const hj = CL.j(t, 5, 3), tx = BTN.x + DIR[0] * fd + hj[0], ty = BTN.y + DIR[1] * fd + hj[1];
      CL.sticker(ctx, handLayer(), tx + DIR[0] * 550 * HS, ty + DIR[1] * 550 * HS, 420 * HS, 1100 * HS, { rot: HAND_ROT }); }
    // CLICK
    if (t > 30.34 && t < 30.85) {
      CL.sparks(ctx, BTN.x, BTN.y, 90, 170, 12, t, { color: C.ink, lw: 9 });
      const s = CL.pop(t, 30.34, .25) || .01, j = CL.j(t, 7, 4); ctx.save(); ctx.translate(BTN.x - 200 + j[0], BTN.y - 105 + j[1]); ctx.scale(s * .78, s * .78); ctx.rotate(-.18);   // CUE 30.34 click
      CL.star(ctx, 0, 0, 170, 12, { fill: C.red, rot: .2 }); A.text(ctx, 'CLICK!', 0, 6, { font: '400 92px Bangers', fill: C.white, stroke: C.ink, lw: 16 }); ctx.restore();
    }
    // stars and confetti when TV comes on
    confetti(ctx, t, 31.12, 34, 470, 470, 21);
    const st = CL.pop(t, 31.3, .3);
    if (st) { const j = CL.j(t, 9, 3); CL.star(ctx, 70 + j[0], 740 + j[1], 60 * st, 8, { fill: C.pink, rot: .3 }); CL.star(ctx, 1330 - j[0], 700 - j[1], 74 * st, 10, { fill: C.yellow, rot: -.2 }); }
  }

  // ============ PHASE B
  const exitK = (t, t0 = 33.35) => { const u = inv(t0, t0 + .22, Q(t, 15)); return u; };
  function card(ctx, name, t, t0, cx, cy, w, h, rot, seed, fill) {
    const u = exitK(t); if (u >= 1) return; const s = CL.pop(t, t0, .3); if (!s) return; const j = CL.j(t, seed, 3);
    if (t < 33.35) CL.logoCard(ctx, name, cx + j[0], cy + j[1], w, h, { rot: rot + j[2], scale: s, seed, fill });
    else CL.logoCard(ctx, name, cx, cy + ease.in(u) * 600, w, h, { rot: rot + u * 1.2, scale: 1 - u * .6, seed, fill });
    if (t - t0 < .3 && t >= t0) CL.sparks(ctx, cx, cy, w * .55, w * .85, 12, t, { color: C.ink, lw: 9 });
  }
  function phaseB(ctx, t) {
    ctx.drawImage(CL.layer('s7bgB', W, H, g => CL.paper(g, 'yellow', { dots: C.blue, dotSize: 40, dotAlpha: .16, dotFade: 'radial' })), 0, 0);
    const jt = CL.j(t, 3, 2);
    CL.scrap(ctx, 740, 440, 1300, 700, { fill: C.blue, seed: 14, rot: .02, tape: false, draw: (g, w, h) => CL.halftone(g, -w / 2, -h / 2, w, h, '#5B82FF', 30, .5, { fade: 'radial' }) });
    const scr = t < 33.3 ? screenCarousel : screenPitch, sh = CL.shake(t, 33.44, .35, 8);
    tv(ctx, 740 + jt[0] + sh[0], 420 + jt[1] + sh[1], 660, 430, scr, t);
    // streamers (CUE 32.22 netflix, 32.42 disney, 32.62 appletv)
    card(ctx, 'netflix', t, 32.2, 280, 250, 540, 270, -.08, 3);     // CUE 32.2 pop
    card(ctx, 'disney', t, 32.42, 1170, 270, 540, 270, .07, 4, '#0B1F5C');
    card(ctx, 'appletv', t, 32.64, 740, 700, 540, 270, .04, 5, C.ink);
    // live / sport / football
    if (t >= 33.4) {
      const jf = CL.j(t, 8, 3);
      const c5 = CL.pop(t, 33.55, .3);
      if (c5) { CL.logoCard(ctx, 'sport5', 280 + jf[0], 250 + jf[1], 560, 280, { rot: -.07, scale: c5, seed: 6, fill: C.ink }); if (t < 33.85) CL.sparks(ctx, 280, 250, 300, 400, 12, t, { color: C.ink, lw: 9 }); }
      const c1 = CL.pop(t, 34.3, .3);
      if (c1) { CL.logoCard(ctx, 'sport1', 1170 - jf[0], 270 + jf[1], 560, 280, { rot: .06, scale: c1, seed: 7 }); if (t < 34.6) CL.sparks(ctx, 1170, 270, 300, 400, 12, t, { color: C.ink, lw: 9 }); }
      const lv = CL.pop(t, 33.95, .3);           // CUE 33.95 live
      if (lv) { ctx.save(); ctx.translate(430 + jf[0], 560 + jf[1]); ctx.rotate(-.13); ctx.scale(lv, lv); CL.blob(ctx, 0, 0, 350, 140, { fill: C.red });
        ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; if (Math.floor(t * 3) % 2 === 0) { ctx.beginPath(); ctx.arc(-110, 0, 24, 0, TAU); ctx.fill(); ctx.stroke(); }
        A.text(ctx, 'LIVE', 30, 8, { font: '400 112px Bangers', fill: C.white, stroke: C.ink, lw: 16 }); ctx.restore(); }
      const bs = CL.pop(t, 33.44, .3);            // CUE 33.44 football
      if (bs) { const qt = Q(t, 12), ph = ((qt - 33.44) % .6) / .6, hgt = Math.abs(Math.sin(ph * Math.PI)) * 120, sq = ph < .06 || ph > .94 ? .82 : 1;
        ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.25)'; ctx.beginPath(); ctx.ellipse(1010 + 20, 858, 100 - hgt * .25, 18, 0, 0, TAU); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(1010, 710 - hgt); ctx.scale(bs * (2 - sq), bs * sq); ctx.rotate(qt * 4); CL.sticker(ctx, ballLayer(), 0, 0, 240, 240, {}); ctx.restore(); }
    }
    confetti(ctx, t, 33.44, 26, 1010, 700, 33, 1.6, 900);
  }

  // ============ PHASE C
  function phaseC(ctx, t) {
    ctx.drawImage(CL.layer('s7bgC', W, H, g => CL.paper(g, 'cream')), 0, 0);
    ctx.save(); ctx.translate(0, 0); sunburst(ctx, 720, 440, 2200, 28, Q(t, 8) * .05, 'rgba(0,0,0,0)', C.yellow); ctx.restore();
    const shk = CL.shake(t, 36.39, .5, 16); ctx.save(); ctx.translate(shk[0], shk[1]);
    const j = CL.j(t, 12, 3), bc = CL.pop(t, 35.21, .3);
    if (bc) { ctx.save(); ctx.translate(420, 430); ctx.scale(bc, bc); ctx.scale(.78, .78);
      ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.arc(14, 24, 400, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, 402, 0, TAU); ctx.fill();
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(0, 0, 380, 0, TAU); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 376, 0, TAU); ctx.clip(); CL.halftone(ctx, -400, -400, 800, 800, '#5B82FF', 34, .5, { fade: 'radial' }); ctx.restore();
      CL.sticker(ctx, thumbLayer(), 10 + j[0], 20 + j[1], 700, 745, { rot: -.06 + j[2] }); ctx.restore(); }   // CUE 35.21 thumbs
    if (t > 35.25 && t < 36.2) CL.sparks(ctx, 420, 430, 320, 400, 16, t, { color: C.ink, lw: 10 });
    // check badge
    const ck = CL.pop(t, 35.63, .3);
    if (ck) { ctx.save(); ctx.translate(790, 170); ctx.rotate(.18); ctx.scale(ck * .8, ck * .8); ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.arc(10, 16, 150, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, 152, 0, TAU); ctx.fill();
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(0, 0, 136, 0, TAU); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-64, 4); ctx.lineTo(-18, 52); ctx.lineTo(70, -50); ctx.strokeStyle = C.ink; ctx.lineWidth = 58; ctx.stroke(); ctx.strokeStyle = C.white; ctx.lineWidth = 36; ctx.stroke(); ctx.restore(); }
    // buffering wheel, crossed out
    const wh = CL.pop(t, 36.0, .3);
    if (wh) { ctx.save(); ctx.translate(1030, 450); ctx.scale(wh * .95, wh * .95);
      ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.arc(12, 18, 215, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, 215, 0, TAU); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke();
      const rot = Q(t, 12) * (TAU / 12) * (t > 36.45 ? 0 : 1); ctx.rotate(rot); ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * TAU / 12); ctx.strokeStyle = `rgba(20,20,20,${.12 + i / 12 * .88})`; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(0, -160); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      const cp = Q(inv(36.39, 36.63, t), 24); if (cp > 0) { CL.cross(ctx, 1030, 450, 180, cp, { lw: 44, color: C.red }); }    // CUE 36.39 cross-out
      if (t > 36.39 && t < 36.8) CL.sparks(ctx, 1030, 450, 240, 310, 14, t, { color: C.ink, lw: 9 });
    }
    ctx.restore();
    confetti(ctx, t, 35.21, 44, 500, 430, 41, 2, 1300);
    const s1 = CL.pop(t, 35.4, .3), sj = CL.j(t, 13, 3); if (s1) { CL.star(ctx, 60 + sj[0], 700, 70 * s1, 8, { fill: C.pink, rot: .3 }); CL.star(ctx, 1300, 720 + sj[1], 80 * s1, 10, { fill: C.orange, rot: -.2 }); }
  }

  A.scene({ name: 's7_press', start: 29.9, end: 36.95, draw: (ctx, s) => {
    const t = s.t;
    if (t < 32.0) wipe(ctx, 2, inv(29.9, 30.22, t), () => phaseA(ctx, t), 1);
    else if (t < 35.12) { const p = inv(32.0, 32.3, t); if (p < 1) phaseA(ctx, t); wipe(ctx, 0, p, () => phaseB(ctx, t), 2); }
    else { const p = inv(35.12, 35.4, t); if (p < 1) phaseB(ctx, t); wipe(ctx, 2, p, () => phaseC(ctx, t), 3); }
  } });
})();
