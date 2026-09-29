// ============================================================================
// GOTV v4 / S3 SPORTS  (ANIME LEGEND EDITION, brand new design)
//  v 9.02-10.15  anime-cut sports montage (football volley, dunk, tennis smash, boxing) + real channel bugs, logo cascade
//  T 22.75-25.15 CROWD INTERLUDE (outT): chanting stand, tifo, flares, drums, goal roar at u 1.2, whip out
//  v 10.15-10.41 charge-up   10.41 SPORT 5 hero slam   10.63-10.96 family cascade   11.08 CHARLTON slam
//  hold 7 (v 11.208) Sport 5 stack alive   hold 8 (v 11.90) CHARLTON hero alive   11.92 whip out (tail to 12.30)
// ============================================================================
(() => {
  const { clamp, lerp, ease, hash, rng } = A, TAU = A.TAU, PI = Math.PI, M = Math;
  const sin = M.sin, cos = M.cos, abs = M.abs, INK = '#0b0720';
  const eo = t => ease.out(clamp(t)), eob = t => ease.outBack(clamp(t)), ein = t => ease.in(clamp(t)), eio = t => ease.inOut(clamp(t));
  const D2R = a => a * PI / 180;
  const HP = () => (A.H && A.H.dur && A.H.kind === 'hold') ? clamp(A.H.u / A.H.dur) : 0;      // hold progress 0..1
  const ENV = () => (A.H && A.H.kind === 'hold') ? sin(PI * HP()) : 0;                         // 0 at both ends of a hold
  const OSC = (n, ph = 0) => sin(TAU * (n * HP() + ph)) * ENV();                                // zero at both ends
  const GOLD = [[0, '#FFF6C8'], [.45, '#FFC24A'], [1, '#E48A12']];

  // ------------------------------------------------------------------ anime primitives
  function rays(ctx, cx, cy, t, o = {}) {
    const { n = 80, r0 = 250, r1 = 2200, col = '#fff', a = .5, seed = 1, w = .03, fps = 12, wmin = .25 } = o;
    const k = M.floor(t * fps), R = rng(seed * 977 + k * 13 + 5);
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const an = (i + R()) / n * TAU, ww = w * (wmin + R() * (1 - wmin)), ra = r0 * (.75 + R() * .6);
      ctx.moveTo(cos(an) * ra, sin(an) * ra); ctx.lineTo(cos(an - ww) * r1, sin(an - ww) * r1); ctx.lineTo(cos(an + ww) * r1, sin(an + ww) * r1);
    }
    ctx.fill(); ctx.restore();
  }
  function burst(ctx, cx, cy, rot, n, c1, c2, R = 2600, a = 1) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = a; const st = TAU / n;
    for (let pass = 0; pass < 2; pass++) {
      const col = pass ? c2 : c1; if (!col) continue; ctx.fillStyle = col; ctx.beginPath();
      for (let i = pass; i < n; i += 2) { ctx.moveTo(0, 0); ctx.lineTo(cos(i * st) * R, sin(i * st) * R); ctx.lineTo(cos((i + 1) * st) * R, sin((i + 1) * st) * R); }
      ctx.fill();
    }
    ctx.restore();
  }
  function halftone(ctx, x0, y0, w, h, sp, col, a, fn, ang = .6, rmax = .52) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath();
    const cxm = x0 + w / 2, cym = y0 + h / 2, R = M.hypot(w, h) / 2, n = M.ceil(R / sp), ca = cos(ang), sa = sin(ang);
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      const u = i * sp, v = j * sp, x = cxm + u * ca - v * sa, y = cym + u * sa + v * ca;
      if (x < x0 - sp || x > x0 + w + sp || y < y0 - sp || y > y0 + h + sp) continue;
      const f = fn(x, y); if (f <= .03) continue; const r = sp * rmax * M.sqrt(clamp(f)); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill(); ctx.restore();
  }
  function kana(ctx, txt, x, y, size, rot, pop, o = {}) {
    if (pop <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(pop, pop);
    ctx.font = `900 ${size}px "IPAGothic","Rubik",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = size * .34; ctx.strokeStyle = o.out || '#fff'; ctx.strokeText(txt, 0, 0);
    ctx.lineWidth = size * .2; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = o.grad ? V.lin(ctx, 0, -size * .5, 0, size * .5, o.grad) : (o.fill || '#ff3b4a'); ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function heb(ctx, txt, x, y, size, rot, pop, o = {}) {
    if (pop <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(pop, pop); ctx.direction = 'rtl';
    ctx.font = `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (!o.noink) { ctx.lineWidth = size * .3; ctx.strokeStyle = o.out || '#fff'; ctx.strokeText(txt, 0, 0); }
    if (!o.noink) { ctx.lineWidth = size * .18; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0); }
    ctx.fillStyle = o.grad ? V.lin(ctx, 0, -size * .5, 0, size * .5, o.grad) : (o.fill || '#fff'); ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function spiky(ctx, x, y, r, rot, seed, c1, c2, n = 14, ink = true) {   // manga impact explosion
    const R = rng(seed), J = []; for (let i = 0; i < n * 2; i++) J.push(.72 + R() * .5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    const path = k => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const an = i / (n * 2) * TAU, rr = (i % 2 ? .48 : 1) * r * k * (i % 2 ? 1 : J[i]); ctx.lineTo(cos(an) * rr, sin(an) * rr); } ctx.closePath(); };
    path(1); if (ink) { ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); } ctx.fillStyle = c1; ctx.fill(); path(.68); ctx.fillStyle = c2; ctx.fill(); ctx.restore();
  }
  const ring = (ctx, x, y, r, w, col, a = 1) => { if (a <= .01 || r <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); };
  const sparkle = (ctx, x, y, r, col, rot = 0, a = 1) => V.sparkle(ctx, x, y, r, col, rot, a);
  const shake = (v, t0, dur, amp) => { const u = (v - t0) / dur; if (u < 0 || u > 1) return [0, 0]; const e = (1 - u) * (1 - u) * amp; return [A.noise1(v * 60 + 3) * e, A.noise1(v * 60 + 40) * e]; };
  // impact frame: negative inversion then flat white with black rays (2-3 frames)
  function impactFrame(ctx, v, t0, n = 3) {
    const k = M.floor((v - t0) * 30 + 1e-3); if (k < 0 || k >= n) return;
    if (k === 1) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    else if (k === 0) { ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); rays(ctx, 540, 640, v, { n: 70, r0: 120, col: '#000', a: 1, seed: 9, w: .05 }); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  }

  // ------------------------------------------------------------------ real logos as anime stickers
  const SIL = {};
  function sil(name, col) { const k = name + col; if (SIL[k]) return SIL[k]; const im = V.logoImg(name); if (!im) return null; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return SIL[k] = c; }
  const SCR = document.createElement('canvas'); SCR.width = 520; SCR.height = 660; const SG = SCR.getContext('2d');
  // draw a real logo (aspect kept) centred at x,y with drawn width w: ink outline, optional extrude, glow, light sweep (0..1)
  function sticker(ctx, name, x, y, w, o = {}) {
    const im = V.logoImg(name); if (!im) return { w: 0, h: 0 };
    const sc = w / im.width, h = im.height * sc;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.glow) A.glow(ctx, 0, 0, M.max(w, h) * .95, o.glow, o.glowA ?? .5);
    const ol = o.ol ?? 7, s1 = sil(name, o.olCol || INK);
    if (o.ext && s1) { const se = sil(name, o.ext); for (let i = o.extN ?? 10; i >= 1; i--) ctx.drawImage(se, -w / 2 + i * .9, -h / 2 + i * 1.1, w, h); }
    if (ol > 0 && s1) for (let i = 0; i < 16; i++) { const an = i / 16 * TAU; ctx.drawImage(s1, -w / 2 + cos(an) * ol, -h / 2 + sin(an) * ol, w, h); }
    if (o.sweep != null && o.sweep > -.5 && o.sweep < 1.5) {
      SG.clearRect(0, 0, 520, 660); SG.globalCompositeOperation = 'source-over'; SG.drawImage(im, 0, 0);
      SG.globalCompositeOperation = 'source-atop'; SG.save(); SG.transform(1, 0, -.42, 1, 0, 0); const px = lerp(-.3, 1.5, o.sweep) * im.width;
      const g = SG.createLinearGradient(px - 80, 0, px + 80, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      SG.fillStyle = g; SG.fillRect(px - 80, -20, 160, im.height + 40); SG.restore(); SG.globalCompositeOperation = 'source-over';
      ctx.drawImage(SCR, 0, 0, im.width, im.height, -w / 2, -h / 2, w, h);
    } else ctx.drawImage(im, -w / 2, -h / 2, w, h);
    ctx.restore(); return { w, h };
  }
  // slanted anime plate (dark glass with gold rim) used behind coloured / dark logos
  function plate(ctx, x, y, w, h, o = {}) {
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    const sk = o.skew ?? h * .14, bw = o.bw ?? 7;
    const path = () => { ctx.beginPath(); ctx.moveTo(-w / 2 + sk, -h / 2); ctx.lineTo(w / 2 + sk, -h / 2); ctx.lineTo(w / 2 - sk, h / 2); ctx.lineTo(-w / 2 - sk, h / 2); ctx.closePath(); };
    ctx.save(); ctx.translate(9, 11); path(); ctx.fillStyle = 'rgba(0,0,25,.45)'; ctx.fill(); ctx.restore();
    path(); ctx.lineJoin = 'round'; ctx.lineWidth = bw * 2 + 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = V.lin(ctx, 0, -h / 2, 0, h / 2, [[0, o.c1 || '#1c2a78'], [1, o.c2 || '#0a1040']]); ctx.fill();
    ctx.save(); path(); ctx.clip();
    halftone(ctx, -w / 2 - sk, -h / 2, w + 2 * sk, h, 12, 'rgba(255,255,255,1)', .12, (px, py) => clamp(1 - (py + h / 2) / h * 1.6), .5);
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-w / 2 - sk, -h / 2); ctx.lineTo(w * .1, -h / 2); ctx.lineTo(-w * .12, h / 2); ctx.lineTo(-w / 2 - sk, h / 2); ctx.fill();
    ctx.lineWidth = bw + 2; ctx.strokeStyle = o.rim || '#FFC24A'; path(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  // ------------------------------------------------------------------ anime athlete figure (jointed, cel-shaded, ink outline, rim light)
  function cel(ctx, pf, pal, k = 12, ol = 6) {
    ctx.save(); pf(); ctx.lineJoin = 'round'; ctx.lineWidth = ol * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = pal[2] || '#fff'; ctx.fill();
    ctx.clip();
    ctx.save(); ctx.translate(-3.5, -3.5); pf(); ctx.fillStyle = pal[1]; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(-k, -k * 1.05); pf(); ctx.fillStyle = pal[0]; ctx.fill(); ctx.restore();
    ctx.restore();
  }
  function limbPath(ctx, p0, p1, r0, r1) {
    return () => {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = M.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      ctx.beginPath(); ctx.arc(p0[0], p0[1], r0, 0, TAU); ctx.moveTo(p1[0] + r1, p1[1]); ctx.arc(p1[0], p1[1], r1, 0, TAU);
      let q = [[p0[0] + nx * r0, p0[1] + ny * r0], [p1[0] + nx * r1, p1[1] + ny * r1], [p1[0] - nx * r1, p1[1] - ny * r1], [p0[0] - nx * r0, p0[1] - ny * r0]];
      let ar = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; ar += a[0] * b[1] - b[0] * a[1]; } if (ar < 0) q = q.reverse();
      ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath();
    };
  }
  const lerpArr = (a, b, t) => a.map((x, i) => lerp(x, b[i], t));
  function lerpPose(a, b, t) { const o = { ...b }; for (const k of ['x', 'y', 'sc', 'to', 'hd']) o[k] = lerp(a[k], b[k], t); for (const k of ['ab', 'af', 'lb', 'lf']) o[k] = lerpArr(a[k], b[k], t); return o; }
  function head(ctx, c, ang, pal, face, t) {
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(D2R(180 - ang));
    const R = 60;
    // hair back spikes
    const hairBack = () => { ctx.beginPath(); const n = 10; for (let i = 0; i <= n; i++) { const an = D2R(-200 + i * (190 / n)), rr = i % 2 ? R * 1.02 : R * (1.5 + .12 * hash(i + face.seed)); ctx.lineTo(cos(an) * rr, sin(an) * rr); } ctx.lineTo(R * .7, -8); ctx.lineTo(0, 10); ctx.closePath(); };
    cel(ctx, hairBack, [pal.hair, pal.hairSh, pal.hairRim], 10, 6);
    cel(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); }, [pal.skin, pal.skinSh, pal.rim], 16, 6);
    cel(ctx, () => { ctx.beginPath(); ctx.ellipse(-14, 8, 11, 15, 0, 0, TAU); }, [pal.skin, pal.skinSh, pal.skin], 4, 4);   // ear
    // bangs
    const bangs = () => { ctx.beginPath(); const n = 8; for (let i = 0; i <= n; i++) { const an = D2R(-185 + i * (165 / n)), rr = i % 2 ? R * 1.05 : R * 1.32; ctx.lineTo(cos(an) * rr, sin(an) * rr); }
      ctx.lineTo(R * .98, -14); ctx.lineTo(44, -6); ctx.lineTo(37, -30); ctx.lineTo(22, -8); ctx.lineTo(8, -34); ctx.lineTo(-8, -10); ctx.lineTo(-26, -34); ctx.lineTo(-44, -8); ctx.lineTo(-R * .95, -6); ctx.closePath(); };
    cel(ctx, bangs, [pal.hair, pal.hairSh, pal.hairRim], 10, 6);
    // face: 3/4 view looking right
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(14, -19); ctx.lineTo(42, -10); ctx.stroke();       // near brow (angry slant)
    ctx.beginPath(); ctx.moveTo(48, -12); ctx.lineTo(64, -18); ctx.lineWidth = 7; ctx.stroke();                                    // far brow
    const eye = (ex, ey, rx, ry) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, .1, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = pal.eye; ctx.beginPath(); ctx.ellipse(ex + rx * .3, ey + 1, rx * .58, ry * .9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + rx * .35, ey + 1, rx * .3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + rx * .05, ey - ry * .35, rx * .2, 0, TAU); ctx.fill(); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(ex - rx * 1.05, ey - ry * .55); ctx.lineTo(ex + rx * 1.1, ey - ry * .85); ctx.stroke(); };
    eye(28, 0, 12, 10); eye(56, -2, 8, 8);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(60, 12); ctx.lineTo(66, 18); ctx.lineTo(60, 20); ctx.stroke();                     // nose
    if (face.mode === 'shout') { ctx.fillStyle = '#2a0a18'; ctx.beginPath(); ctx.ellipse(40, 36, 17, 15 + 3 * sin(t * 30), .15, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(28, 24, 24, 7); ctx.fillStyle = '#ff5a6e'; ctx.beginPath(); ctx.ellipse(41, 44, 10, 6, 0, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(24, 30, 32, 14, 4); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(34, 30); ctx.lineTo(34, 44); ctx.moveTo(45, 30); ctx.lineTo(45, 44); ctx.stroke(); }
    if (face.band) { ctx.fillStyle = face.band; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-58, -26); ctx.lineTo(60, -34); ctx.lineTo(62, -22); ctx.lineTo(-60, -12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  // P: {x,y,sc,flip, to (torso angle), hd, ab, af, lb, lf, glove, hand(ctx,pt,ang)}; angles: 0 = down, 90 = right, 180 = up, 270 = left
  function person(ctx, P, pal, t = 0) {
    const L = { th: 175, sn: 172, to: 235, ua: 135, fa: 125 }, sc = P.sc || 1, fl = P.flip || 1;
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(fl * sc, sc);
    const vv = a => [sin(D2R(a)), cos(D2R(a))], add = (p, a, l) => { const d = vv(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
    const hip = [0, 0], nk = add(hip, P.to, L.to), sh = add(hip, P.to, L.to * .9), f = vv(P.to - 90);
    const hc = add(nk, P.to + (P.hd || 0), 52);
    const arm = (a, o) => { const s0 = [sh[0] + f[0] * o, sh[1] + f[1] * o], e = add(s0, a[0], L.ua), h = add(e, a[1], L.fa); return { s: s0, e, h }; };
    const leg = a => { const k = add(hip, a[0], L.th), an = add(k, a[1], L.sn); return { k, a: an }; };
    const AB = arm(P.ab, -14), AF = arm(P.af, 8), LB = leg(P.lb), LF = leg(P.lf), J = {};
    const drawArm = (A_, glove, sleeve) => {
      cel(ctx, limbPath(ctx, A_.e, A_.h, 21, 17), pal.skinP, 9, 6);
      cel(ctx, limbPath(ctx, A_.s, A_.e, 27, 22), sleeve ? pal.shirtP : pal.skinP, 12, 6);
      if (glove) cel(ctx, () => { ctx.beginPath(); ctx.arc(A_.h[0] + (A_.h[0] - A_.e[0]) * .15, A_.h[1] + (A_.h[1] - A_.e[1]) * .15, 42, 0, TAU); }, pal.gloveP, 16, 7);
      else cel(ctx, () => { ctx.beginPath(); ctx.arc(A_.h[0], A_.h[1], 19, 0, TAU); }, pal.skinP, 5, 5);
    };
    const drawLeg = (L_) => {
      const ft = add(L_.a, ((P.footA ?? 90) + 0), 62);
      cel(ctx, limbPath(ctx, L_.a, ft, 25, 18), pal.bootP, 9, 6);
      cel(ctx, limbPath(ctx, L_.k, L_.a, 29, 22), pal.skinP, 12, 6);
      const s2 = add(L_.k, P.sockA?.(L_) ?? 0, 0); if (pal.sockP) cel(ctx, limbPath(ctx, [L_.k[0] + (L_.a[0] - L_.k[0]) * .38, L_.k[1] + (L_.a[1] - L_.k[1]) * .38], L_.a, 26, 22), pal.sockP, 9, 6);
      cel(ctx, limbPath(ctx, hip, L_.k, 46, 32), pal.shortsP, 14, 6);
    };
    // legs need their own foot direction: derive from shin angle
    const footLeg = (L_, ang) => { const ft = add(L_.a, ang + 90, 60);
      cel(ctx, limbPath(ctx, L_.a, ft, 25, 17), pal.bootP, 9, 6);
      cel(ctx, limbPath(ctx, L_.k, L_.a, 29, 22), pal.skinP, 12, 6);
      if (pal.sockP) cel(ctx, limbPath(ctx, [L_.k[0] + (L_.a[0] - L_.k[0]) * .4, L_.k[1] + (L_.a[1] - L_.k[1]) * .4], L_.a, 26, 22), pal.sockP, 9, 6);
      cel(ctx, limbPath(ctx, hip, L_.k, 48, 33), pal.shortsP, 14, 6); return ft; };
    drawArm(AB, P.glove, !P.sleeveless);
    J.ftB = footLeg(LB, P.lb[1]);
    // torso
    const S = (o, d) => { const b = add(hip, P.to, d); return [b[0] + f[0] * o, b[1] + f[1] * o]; };
    const pts = [S(-40, 6), S(-36, 80), S(-34, 150), S(-44, 205), S(-20, L.to + 4), S(30, L.to + 2), S(50, 200), S(38, 130), S(40, 70), S(46, 14), S(0, -14)];
    cel(ctx, () => A.blob(ctx, pts, true), pal.shirtP, 20, 7);
    if (pal.stripe) { ctx.save(); A.blob(ctx, pts, true); ctx.clip(); ctx.strokeStyle = pal.stripe; ctx.lineWidth = 15; ctx.beginPath(); const a = S(-50, 170), b = S(60, 170); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); }
    cel(ctx, () => A.blob(ctx, [S(-46, -8), S(-42, 60), S(40, 66), S(48, -4), S(0, -22)], true), pal.shortsP, 12, 6);
    J.ftF = footLeg(LF, P.lf[1]);
    drawArm(AF, P.glove, !P.sleeveless);
    cel(ctx, limbPath(ctx, sh, nk, 22, 20), pal.skinP, 6, 5);
    head(ctx, hc, P.to + (P.hd || 0), pal, P.face || { mode: 'shout', seed: 1 }, t);
    if (P.hand) P.hand(ctx, AF.h, P.af[1], AF);
    ctx.restore();
    const W = p => [P.x + fl * sc * p[0], P.y + sc * p[1]];
    return { handF: W(AF.h), handB: W(AB.h), ankleF: W(LF.a), footF: W(J.ftF), footB: W(J.ftB), head: W(hc), sc };
  }
  const PAL = (o) => ({ skin: o.skin, skinSh: o.skinSh, rim: o.rim || '#9fe8ff', hair: o.hair, hairSh: o.hairSh, hairRim: o.rim || '#9fe8ff', eye: o.eye || '#2a6cff',
    skinP: [o.skin, o.skinSh, o.rim || '#9fe8ff'], shirtP: [o.shirt, o.shirtSh, o.rim || '#9fe8ff'], shortsP: [o.shorts, o.shortsSh, o.rim || '#9fe8ff'], bootP: [o.boot || '#141428', '#000', '#77b8ff'],
    sockP: o.sock ? [o.sock, o.sockSh, o.rim || '#9fe8ff'] : null, gloveP: [o.glove || '#ff3b4a', '#a01029', '#ffb0b8'], stripe: o.stripe, band: o.band });

  // ------------------------------------------------------------------ balls
  function ball(ctx, kind, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    if (kind === 'foot') { ctx.fillStyle = '#fff'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#c9d8ff'; ctx.beginPath(); ctx.arc(r * .3, r * .3, r, 0, TAU); ctx.arc(-r * .1, -r * .1, r, 0, TAU, true); ctx.fill(); ctx.fillStyle = INK;
      ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; ctx.lineTo(cos(a) * r * .38, sin(a) * r * .38); } ctx.fill();
      for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5 + TAU / 10; ctx.beginPath(); ctx.arc(cos(a) * r * .95, sin(a) * r * .95, r * .3, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cos(a) * r * .38, sin(a) * r * .38); ctx.lineTo(cos(a) * r * .7, sin(a) * r * .7); ctx.strokeStyle = INK; ctx.stroke(); } ctx.restore(); }
    else if (kind === 'basket') { ctx.fillStyle = '#ff8a1c'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#c9560a'; ctx.beginPath(); ctx.arc(r * .3, r * .3, r, 0, TAU); ctx.arc(-r * .1, -r * .1, r, 0, TAU, true); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * .9, -1, 1); ctx.arc(r * 1.25, 0, r * .9, PI - 1, PI + 1); ctx.stroke(); ctx.restore(); }
    else { ctx.fillStyle = '#d8ff3a'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#9cc21a'; ctx.beginPath(); ctx.arc(r * .3, r * .3, r, 0, TAU); ctx.arc(-r * .1, -r * .1, r, 0, TAU, true); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-r * 1.2, 0, r * 1.05, -.8, .8); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.2, 0, r * 1.05, PI - .8, PI + .8); ctx.stroke(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
  }

  // ------------------------------------------------------------------ montage backgrounds
  function shotBG(ctx, u, o) {
    ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, o.g[0]], [.5, o.g[1]], [1, o.g[2]]]); ctx.fillRect(-300, -300, 1680, 2520);
    burst(ctx, o.fx, o.fy, u * .5 + (o.rot0 || 0), o.nb || 30, o.b1, o.b2, 2800, o.ba ?? .5);
    A.glow(ctx, o.fx, o.fy, 700, o.glow || '#fff', .35);
    halftone(ctx, -100, -100, 1280, 2120, 32, o.ht || '#000', .28, (x, y) => clamp((y - 700) / 900) + clamp((300 - y) / 500) * .8, .55);
  }
  function speed(ctx, cx, cy, v, o = {}) { rays(ctx, cx, cy, v, { n: 64, r0: o.r0 ?? 430, r1: 2300, col: o.col || '#fff', a: o.a ?? .5, seed: o.seed || 3, w: .028, fps: 15 }); }
  function sweat(ctx, x, y, s, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(22, 0, 20, 24, 0, 24); ctx.bezierCurveTo(-20, 24, -22, 0, 0, -30); ctx.fillStyle = '#bfefff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, 8, 5, 0, TAU); ctx.fill(); ctx.restore(); }

  // ---- shot 1: football volley
  const POSE_F_A = { x: 560, y: 840, sc: .98, to: 196, hd: -8, ab: [258, 300], af: [95, 130], lb: [215, 250], lf: [160, 178], face: { mode: 'shout', seed: 3 } };
  const POSE_F_B = { x: 570, y: 810, sc: .98, to: 212, hd: -18, ab: [250, 292], af: [100, 128], lb: [238, 190], lf: [118, 96], face: { mode: 'shout', seed: 3 } };
  const PALF = PAL({ skin: '#f0b98a', skinSh: '#c98456', hair: '#2a1a3a', hairSh: '#150c22', shirt: '#ffc24a', shirtSh: '#d98b12', shorts: '#2f6bff', shortsSh: '#1b3fb0', sock: '#2f6bff', sockSh: '#1b3fb0', stripe: '#2f6bff', boot: '#181830', eye: '#ff7a1a' });
  function shotFoot(ctx, u, v) {
    shotBG(ctx, u, { g: ['#3a0f6e', '#ff5a3c', '#ffb347'], b1: '#ff9a3c', b2: '#ffd86a', fx: 700, fy: 800, glow: '#ffe6a0', ht: '#5a1060', nb: 26 });
    // stadium silhouette + floodlights
    ctx.fillStyle = '#2a0a4a'; ctx.beginPath(); ctx.moveTo(-50, 1000); for (let i = 0; i <= 20; i++) ctx.lineTo(i * 60, 940 - 26 * hash(i + 4)); ctx.lineTo(1130, 1000); ctx.lineTo(1130, 1300); ctx.lineTo(-50, 1300); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = INK; ctx.fillRect(90 + i * 300 - 6, 700, 12, 300); ctx.fillRect(90 + i * 300 - 50, 660, 100, 50); A.glow(ctx, 90 + i * 300, 685, 160, '#fff6c8', .8); }
    // grass
    ctx.fillStyle = V.lin(ctx, 0, 1000, 0, 1300, [[0, '#1fa055'], [1, '#0a5a30']]); ctx.beginPath(); ctx.moveTo(-50, 1030); ctx.quadraticCurveTo(540, 960, 1130, 1030); ctx.lineTo(1130, 1400); ctx.lineTo(-50, 1400); ctx.fill();
    const e = eo(u / .09), P = lerpPose(POSE_F_A, POSE_F_B, e);
    const J = person(ctx, P, PALF, v);
    const bx = J.footF[0] + 40, by = J.footF[1] - 20;
    // ball + trail + impact
    ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(bx, by - 46); ctx.lineTo(bx + 460, by - 8); ctx.lineTo(bx, by + 46); ctx.fill(); ctx.restore();
    spiky(ctx, J.footF[0] + 12, J.footF[1] - 4, 105 + 70 * (1 - eo(u / .12)), .3, 4, '#fff6c8', '#ffb347', 12);
    ball(ctx, 'foot', bx + 20 + 210 * ein(u / .21) * .3, by, 52, u * 14);
    // flying grass
    const R = rng(11); ctx.fillStyle = '#2fc26a'; for (let i = 0; i < 14; i++) { const gx = 330 + R() * 400 + u * 200 * R(), gy = 1020 - R() * 200 * (u + .1) * 3; ctx.save(); ctx.translate(gx, gy); ctx.rotate(R() * 6); ctx.fillRect(-9, -4, 18, 8); ctx.restore(); }
    speed(ctx, J.footF[0] + 80, J.footF[1], v, { r0: 470, col: '#fff', a: .55, seed: 5 });
    return J;
  }
  // ---- shot 2: basketball dunk
  const POSE_B_A = { x: 430, y: 990, sc: .95, to: 180, hd: 4, ab: [255, 235], af: [140, 150], lb: [205, 250], lf: [150, 185], face: { mode: 'grit', seed: 5 } };
  const POSE_B_B = { x: 470, y: 900, sc: .95, to: 170, hd: 4, ab: [250, 228], af: [155, 172], lb: [255, 330], lf: [128, 210], face: { mode: 'shout', seed: 5 } };
  const PALB = PAL({ skin: '#a8714a', skinSh: '#7a4a2c', hair: '#0d0d18', hairSh: '#000', shirt: '#ffffff', shirtSh: '#b8c4ff', shorts: '#ffc24a', shortsSh: '#d98b12', boot: '#ff3b4a', sock: '#ffffff', sockSh: '#b8c4ff', rim: '#ffd0ff', eye: '#3a2a1a', stripe: '#8a5bff', sleeveless: true });
  function shotDunk(ctx, u, v) {
    shotBG(ctx, u, { g: ['#0b1450', '#5a1fb8', '#ff4f9a'], b1: '#8a5bff', b2: '#c9a6ff', fx: 620, fy: 500, glow: '#ffb0ff', ht: '#12082e', nb: 34, rot0: .2 });
    // arena crowd blur dots
    const R = rng(21); for (let i = 0; i < 70; i++) { ctx.fillStyle = `hsla(${280 + R() * 80},90%,${55 + R() * 30}%,.5)`; ctx.beginPath(); ctx.arc(R() * 1080, 1050 + R() * 250, 10 + R() * 14, 0, TAU); ctx.fill(); }
    // spot cones
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const sx = 200 + i * 340; ctx.fillStyle = V.lin(ctx, sx, 0, sx, 1000, [[0, 'rgba(255,240,255,.55)'], [1, 'rgba(255,240,255,0)']]); ctx.beginPath(); ctx.moveTo(sx - 20, 0); ctx.lineTo(sx + 20, 0); ctx.lineTo(sx + 170 - i * 60, 1000); ctx.lineTo(sx - 170 - i * 60, 1000); ctx.fill(); } ctx.restore();
    // court floor
    ctx.fillStyle = V.lin(ctx, 0, 1080, 0, 1400, [[0, '#d98a3c'], [1, '#7a3a12']]); ctx.beginPath(); ctx.moveTo(-50, 1100); ctx.lineTo(1130, 1100); ctx.lineTo(1130, 1500); ctx.lineTo(-50, 1500); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-50, 1100); ctx.lineTo(1130, 1100); ctx.stroke();
    // backboard + rim + net
    ctx.save(); ctx.translate(840, 380); ctx.lineJoin = 'round';
    ctx.fillStyle = INK; ctx.fillRect(-14, 0, 28, 620); ctx.beginPath(); ctx.roundRect(-40, -190, 80, 300, 8); ctx.fillStyle = '#e8f0ff'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = '#ff3b4a'; ctx.lineWidth = 8; ctx.strokeRect(-24, -20, 48, 90); ctx.restore();
    const rimX = 690, rimY = 452, sw = sin(u * 40) * 6 * clamp(1 - u / .2);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(rimX - 78, rimY); ctx.lineTo(rimX - 46 + sw, rimY + 120); ctx.lineTo(rimX + 46 + sw, rimY + 120); ctx.lineTo(rimX + 78, rimY); ctx.fill(); ctx.stroke();
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(rimX - 78 + i * 31, rimY); ctx.lineTo(rimX - 46 + sw + i * 18.4, rimY + 120); ctx.stroke(); }
    ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.beginPath(); ctx.ellipse(rimX, rimY, 82, 22, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#ff5a1c'; ctx.stroke();
    const e = eo(u / .09), P = lerpPose(POSE_B_A, POSE_B_B, e);
    P.hand = null; const J = person(ctx, P, PALB, v);
    ball(ctx, 'basket', J.handF[0] + 24, J.handF[1] - 42, 58, u * 8);
    spiky(ctx, rimX - 10, rimY - 30, 90 + 90 * (1 - eo(u / .14)), .6, 8, '#fff', '#ff9ad2', 13);
    speed(ctx, 640, 470, v, { r0: 470, col: '#fff', a: .5, seed: 7 });
    return J;
  }
  // ---- shot 3: tennis smash
  const POSE_T_A = { x: 480, y: 940, sc: .95, to: 188, hd: 6, ab: [190, 205], af: [175, 200], lb: [230, 200], lf: [140, 185], face: { mode: 'grit', seed: 7 } };
  const POSE_T_B = { x: 500, y: 880, sc: .95, to: 196, hd: 12, ab: [172, 178], af: [145, 172], lb: [232, 215], lf: [118, 192], face: { mode: 'shout', seed: 7 } };
  const PALT = PAL({ skin: '#f7d2b0', skinSh: '#d9a07a', hair: '#e8b23a', hairSh: '#b8801a', shirt: '#ffffff', shirtSh: '#aac4ff', shorts: '#1f3fd0', shortsSh: '#122a90', boot: '#ffffff', sock: '#ffffff', sockSh: '#aac4ff', rim: '#fff2a0', eye: '#12a8ff', band: '#ff3b4a' });
  function racket(ctx, p, ang, len, tilt) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(D2R(180 - ang) + tilt); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * .5); ctx.stroke(); ctx.strokeStyle = '#ff3b4a'; ctx.lineWidth = 16; ctx.stroke();
    ctx.translate(0, -len * .5 - 110); ctx.beginPath(); ctx.ellipse(0, 0, 78, 112, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd24a'; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); for (let i = -6; i <= 6; i++) { ctx.moveTo(i * 14, -120); ctx.lineTo(i * 14, 120); ctx.moveTo(-90, i * 18); ctx.lineTo(90, i * 18); } ctx.stroke(); ctx.restore(); ctx.restore();
  }
  function shotTennis(ctx, u, v) {
    shotBG(ctx, u, { g: ['#0a5aa8', '#19b6d8', '#b8f2a0'], b1: '#5ad1ff', b2: '#c8f4ff', fx: 620, fy: 400, glow: '#ffffff', ht: '#053a70', nb: 24, rot0: .05 });
    // stadium tiers
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#0c3a78', '#12508f', '#1a6aa8'][i]; ctx.beginPath(); ctx.moveTo(-50, 860 + i * 60); for (let x = 0; x <= 1130; x += 40) ctx.lineTo(x, 850 + i * 60 - 12 * hash(x + i)); ctx.lineTo(1130, 1400); ctx.lineTo(-50, 1400); ctx.fill(); }
    ctx.fillStyle = V.lin(ctx, 0, 1000, 0, 1300, [[0, '#2fb35a'], [1, '#0c6a3a']]); ctx.fillRect(-50, 1010, 1180, 500); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-50, 1010); ctx.lineTo(1130, 1010); ctx.moveTo(0, 1200); ctx.lineTo(1080, 1140); ctx.stroke();
    const e = eo(u / .09), P = lerpPose(POSE_T_A, POSE_T_B, e);
    P.hand = (c, hp, ang) => racket(c, hp, ang, 120, -.12);
    const J = person(ctx, P, PALT, v);
    const bx = J.handF[0] + 60 + 120 * u, by = J.handF[1] - 250 - 60 * u;
    ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#e8ff5a'; ctx.beginPath(); ctx.moveTo(bx - 40, by - 30); ctx.lineTo(bx - 240, by - 250); ctx.lineTo(bx + 30, by + 30); ctx.fill(); ctx.restore();
    ball(ctx, 'tennis', bx, by, 40, u * 10);
    spiky(ctx, J.handF[0] + 20, J.handF[1] - 200, 96 + 80 * (1 - eo(u / .12)), .2, 12, '#fffbd0', '#ffe84a', 12);
    speed(ctx, J.handF[0] + 40, J.handF[1] - 210, v, { r0: 440, col: '#fff', a: .5, seed: 9 });
    return J;
  }
  // ---- shot 4: boxing
  const POSE_X_A = { x: 400, y: 900, sc: 1.0, to: 168, hd: 6, ab: [150, 205], af: [125, 175], lb: [300, 350], lf: [55, 8], glove: true, sleeveless: true, face: { mode: 'grit', seed: 9 } };
  const POSE_X_B = { x: 420, y: 900, sc: 1.0, to: 150, hd: 14, ab: [138, 200], af: [90, 88], lb: [302, 352], lf: [50, 6], glove: true, sleeveless: true, face: { mode: 'shout', seed: 9 } };
  const PALX = PAL({ skin: '#d9a070', skinSh: '#a86a3c', hair: '#0d0d18', hairSh: '#000', shirt: '#d9a070', shirtSh: '#a86a3c', shorts: '#1f3fd0', shortsSh: '#122a90', boot: '#ffc24a', rim: '#ffb0a0', eye: '#7a1a1a', glove: '#ff3b4a' });
  function shotBox(ctx, u, v) {
    shotBG(ctx, u, { g: ['#12040a', '#a01028', '#ff5a3c'], b1: '#ff3b4a', b2: '#7a0a20', fx: 780, fy: 800, glow: '#ff9a7a', ht: '#000', nb: 30, rot0: .1, ba: .55 });
    // ring ropes + spot
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = V.lin(ctx, 540, 0, 540, 1000, [[0, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(580, 0); ctx.lineTo(1000, 1100); ctx.lineTo(80, 1100); ctx.fill(); ctx.restore();
    ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const y0 = 640 + i * 130; ctx.strokeStyle = INK; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-50, y0); ctx.lineTo(1130, y0 - 60); ctx.stroke(); ctx.strokeStyle = ['#fff', '#ff3b4a', '#fff'][i]; ctx.lineWidth = 14; ctx.stroke(); }
    ctx.fillStyle = V.lin(ctx, 0, 1080, 0, 1400, [[0, '#28407a'], [1, '#0c1440']]); ctx.fillRect(-50, 1080, 1180, 500);
    const e = eo(u / .07), P = lerpPose(POSE_X_A, POSE_X_B, e);
    const J = person(ctx, P, PALX, v);
    for (let i = 0; i < 4; i++) sweat(ctx, J.head[0] - 60 - i * 40, J.head[1] - 60 + (i % 2) * 70 - u * 90, 1 - i * .1, -.8 + i * .5);
    spiky(ctx, J.handF[0] + 96, J.handF[1] - 4, 130 + 90 * (1 - eo(u / .12)), .1, 14, '#fff', '#ffe04a', 15);
    speed(ctx, J.handF[0] + 60, J.handF[1], v, { r0: 460, col: '#fff', a: .55, seed: 11 });
    return J;
  }

  // ------------------------------------------------------------------ montage compositor
  const SHOT_T = [9.02, 9.23, 9.44, 9.65, 9.86];
  const BUGS = [['sport1', 132], ['sport2', 337], ['sport3', 542], ['sport4', 747], ['one', 952]];
  const KANA = [['ドカッ', '#ffe04a', 760, 300, -.14], ['ズドン', '#ff4fd8', 640, 250, .1], ['パァン', '#ffffff', 300, 300, -.08], ['ドゴォ', '#ffe04a', 640, 250, .12]];
  function bugStrip(ctx, v, upto) {
    const y = 1105;
    for (let i = 0; i < BUGS.length; i++) {
      const t0 = SHOT_T[i] - .03; if (v < t0 || i >= upto) continue; const u = v - t0, pop = u < .14 ? eob(u / .14) : 1, big = 1 + 1.3 * (1 - eo(u / .12)) * (u < .12 ? 1 : 0);
      const [nm, x] = BUGS[i]; plate(ctx, x, y, 208, 88, { scale: pop * (u < .1 ? 1 + .5 * (1 - u / .1) : 1), rot: (1 - pop) * .5, c1: '#141c60', c2: '#070a30', rim: ['#4dffa0', '#ff4a5a', '#ffe84a', '#4dfff8', '#5aa8ff'][i] });
      if (pop > .3) sticker(ctx, nm, x, y, nm === 'one' ? 160 : 168, { scale: pop * (u < .1 ? 1 + .5 * (1 - u / .1) : 1), ol: 3, rot: (1 - pop) * .5 });
      if (u < .2) { ring(ctx, x, y, 40 + u * 900, 6, '#fff', 1 - u / .2); }
    }
  }
  function montage(ctx, v) {
    const fnc = [shotFoot, shotDunk, shotTennis, shotBox];
    let si = 0; for (let i = 0; i < SHOT_T.length; i++) if (v >= SHOT_T[i]) si = i;
    if (si < 4) {
      const u = v - SHOT_T[si], dur = SHOT_T[si + 1] - SHOT_T[si], p = u / dur;
      ctx.save();
      const sh = shake(v, SHOT_T[si], .12, 22), z = 1.02 + .2 * eo(p) + (si === 3 ? .08 * p : 0), rot = [-.05, .04, -.035, .05][si] * (1 - .6 * p);
      ctx.translate(540 + sh[0], 640 + sh[1]); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-540, -640);
      fnc[si](ctx, u, v);
      ctx.restore();
      // SFX katakana slam
      const k = KANA[si]; kana(ctx, k[0], k[2], k[3] + 60, 190, k[4], u < .09 ? eob(u / .09) * 1.15 : 1.05, { fill: k[1] });
      // ink vignette corners
      ctx.save(); ctx.fillStyle = V.rad(ctx, 540, 640, 500, 1250, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(6,2,20,.7)']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
      bugStrip(ctx, v, si + 1);
    } else finale1(ctx, v);
    impactFrame(ctx, v, SHOT_T[0], 2);
    for (let i = 1; i < 4; i++) { const u = v - SHOT_T[i]; if (u >= 0 && u < .06) { ctx.save(); ctx.globalAlpha = .5 * (1 - u / .06); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); } }
  }
  // logo cascade grid: "all the sports channels" on a gold burst (9.86-10.15)
  function finale1(ctx, v) {
    const u = v - SHOT_T[4], r = rng(4);
    ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, '#ff7a1c'], [.5, '#ffb62e'], [1, '#c8400c']]); ctx.fillRect(0, 0, 1080, 1920);
    burst(ctx, 540, 640, u * .8, 32, '#ffd24a', '#ff8a1c', 2800, .9);
    halftone(ctx, 0, 0, 1080, 1920, 30, '#a02808', .35, (x, y) => clamp(M.hypot(x - 540, y - 640) / 900), .5);
    speed(ctx, 540, 640, v, { r0: 520, col: '#fff', a: .5, seed: 13 });
    const cells = [['sport1', 300, 330, '#4dffa0'], ['sport2', 780, 330, '#ff4a5a'], ['sport3', 300, 570, '#ffe84a'], ['sport4', 780, 570, '#4dfff8'], ['one', 300, 810, '#5aa8ff'], ['one2', 780, 810, '#5aa8ff']];
    cells.forEach(([nm, x, y, rc], i) => {
      const t0 = SHOT_T[4] - .03 + i * .045, uu = v - t0; if (uu < 0) return; const pop = eob(uu / .13), sx = (i % 2 ? 1 : -1) * (1 - eo(uu / .18)) * 500;
      plate(ctx, x + sx, y, 430, 176, { scale: pop, rot: (i % 2 ? .05 : -.05) * (1 - eo(uu / .2)) + (i % 2 ? .03 : -.03), c1: '#171f70', c2: '#070a34', rim: rc });
      sticker(ctx, nm, x + sx, y, nm.startsWith('one') ? 330 : 360, { scale: pop, ol: 4 });
      if (uu < .22) ring(ctx, x + sx, y, 60 + uu * 1200, 7, '#fff', 1 - uu / .22);
    });
    // katakana
    kana(ctx, 'ドドド', 540, 1010, 170, -.05, eob((u - .02) / .1), { fill: '#fff44a' });
    for (let i = 0; i < 16; i++) { const px = 60 + r() * 960, py = 140 + r() * 1000, ph = (v * 3 + i * .37) % 1; sparkle(ctx, px, py, 26 * sin(PI * ph), '#fff', ph * 3, 1); }
  }

  // ------------------------------------------------------------------ SPORT 5 / CHARLTON  (v 10.15 - 12.3)
  const T_S5 = 10.41, CASC = [['sport5live', 10.63], ['sport5plus', 10.74], ['sport5gold', 10.85], ['sport5_4k', 10.96]], T_CH = 11.08;
  function stadiumBG(ctx, v, o) {
    const hp = HP();
    ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, o.g[0]], [.5, o.g[1]], [1, o.g[2]]]); ctx.fillRect(-100, -100, 1280, 2120);
    burst(ctx, 540, o.cy, v * .25 + hp * (2 * TAU / o.nb), o.nb, o.b1, o.b2, 2800, o.ba ?? .55);
    A.glow(ctx, 540, o.cy, 800, o.glow, .55);
    halftone(ctx, -100, -100, 1280, 2120, 34, o.ht, .32, (x, y) => clamp(M.hypot(x - 540, y - o.cy) / 1000) * .9, .5);
  }
  function chargeBG(ctx, v) {
    const u = v - 10.15, hp = HP();
    ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, '#04061c'], [.5, '#0a1660'], [1, '#050a2a']]); ctx.fillRect(-100, -100, 1280, 2120);
    // floodlight towers turning on 10.20, 10.27, 10.34, 10.40
    const xs = [110, 370, 710, 970], ts = [10.20, 10.27, 10.34, 10.40];
    xs.forEach((x, i) => { const on = clamp((v - ts[i]) / .05), fl = on * (v < ts[i] + .05 ? 1.6 : 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 * on; ctx.fillStyle = V.lin(ctx, x, 200, x, 1300, [[0, 'rgba(180,220,255,.9)'], [1, 'rgba(180,220,255,0)']]); ctx.beginPath(); ctx.moveTo(x - 30, 200); ctx.lineTo(x + 30, 200); ctx.lineTo(x + (540 - x) * .55 + 170, 1300); ctx.lineTo(x + (540 - x) * .55 - 170, 1300); ctx.fill(); ctx.restore();
      ctx.fillStyle = INK; ctx.fillRect(x - 8, 260, 16, 700); ctx.fillStyle = '#1a2260'; ctx.fillRect(x - 60, 190, 120, 80);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { ctx.fillStyle = on > .1 ? '#fffbe0' : '#22307a'; ctx.beginPath(); ctx.arc(x - 34 + a * 34, 212 + b * 36, 11, 0, TAU); ctx.fill(); }
      if (on > 0) A.glow(ctx, x, 230, 260 * fl, '#cfe6ff', .9 * on); });
    // converging speed lines toward the coming logo
    const cv = clamp((v - 10.15) / .26), R = rng(33);
    ctx.save(); ctx.translate(540, 470); ctx.strokeStyle = 'rgba(255,220,120,.9)'; ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const an = R() * TAU, r1 = 1300 - cv * 1000 * (.6 + R() * .4) + 200, r0 = r1 + 200 + R() * 260; ctx.lineWidth = 3 + R() * 6; ctx.globalAlpha = .25 + .5 * R(); ctx.beginPath(); ctx.moveTo(cos(an) * r0, sin(an) * r0); ctx.lineTo(cos(an) * r1, sin(an) * r1); ctx.stroke(); }
    ctx.restore();
    // gold energy orb charging
    const orb = 20 + 300 * ein(cv) + 20 * sin(v * 50);
    A.glow(ctx, 540, 470, orb * 2.2, '#ffd24a', .9); A.glow(ctx, 540, 470, orb, '#ffffff', .95);
    ring(ctx, 540, 470, 600 * (1 - cv) + 40, 6, '#fff', .8 * cv);
    halftone(ctx, 0, 900, 1080, 1020, 34, '#0a1660', .5, (x, y) => clamp((y - 900) / 700), .5);
    // ゴゴゴ trembling
    const j = A.noise1(v * 80) * 6; kana(ctx, 'ゴゴゴ', 250 + j, 1060, 130, -.12, clamp(u / .05), { fill: '#fff', out: '#6a8cff' }); kana(ctx, 'ゴゴゴ', 830 - j, 1090, 130, .12, clamp(u / .05), { fill: '#fff', out: '#6a8cff' });
  }
  function sport5Layer(ctx, v) {
    const hp = HP(), env = ENV(), H0 = 440;
    if (v < T_S5) { chargeBG(ctx, v); return; }
    const u = v - T_S5;
    stadiumBG(ctx, v, { g: ['#061040', '#0d2aa8', '#061040'], b1: '#1a46e0', b2: '#0a2288', cy: 520, nb: 28, glow: '#7aa8ff', ht: '#000a30' });
    // gold streak ring behind logo
    rays(ctx, 540, 520, v, { n: 60, r0: 380, col: '#ffe27a', a: .5, seed: 21, w: .022, fps: 15 });
    ring(ctx, 540, 520, 300 + 900 * eo(u / .5), 14, '#ffd24a', .8 * (1 - eo(u / .5)));
    ring(ctx, 540, 520, 200 + 700 * eo(u / .4), 26, '#fff', .8 * (1 - eo(u / .4)));
    // hero logo
    const s0 = u < .22 ? 1 + 1.6 * (1 - eob(u / .22)) : 1, breathe = 1 + .012 * OSC(2, 0) + .012 * sin(v * 3) * 0;
    const rot = (1 - eo(u / .2)) * -.14;
    const sw = A.H ? lerp(-.2, 1.4, hp) : (u > .05 && u < .5 ? (u - .05) / .45 : -1);
    sticker(ctx, 'sport5', 540, H0 + 20 * OSC(1, 0), 380, { scale: s0 * breathe, rot, ol: 11, ext: '#e6a10a', extN: 12, glow: '#8ab4ff', glowA: .8, sweep: sw });
    A.glow(ctx, 540, H0, 380, '#ffd24a', .18 + .1 * env);
    if (u < .5) { kana(ctx, 'ドン!', 190, 250, 200, -.18, u < .1 ? eob(u / .1) * 1.15 : (u < .5 ? 1.05 : 0), { fill: '#ffe04a', out: '#fff' }); kana(ctx, 'ズバッ', 900, 730, 130, .16, clamp((u - .1) / .1) * (u < .4 ? 1 : 0), { fill: '#5ad1ff' }); }
    // family cascade
    const xs = [195, 425, 655, 885];
    CASC.forEach(([nm, t0], i) => {
      const uu = v - (t0 - .03); if (uu < 0) return; const pop = uu < .16 ? eob(uu / .16) : 1, fy = (1 - eo(uu / .2)) * 380, bob = 8 * OSC(1, i * .25), x = xs[i], y = 800 + fy + bob;
      const rc = ['#5ad1ff', '#ff8ad8', '#ffc24a', '#7dff9a'][i];
      plate(ctx, x, y, 208, 262, { scale: pop, rot: (1 - eo(uu / .22)) * (i % 2 ? .3 : -.3) + (i % 2 ? .02 : -.02), c1: '#1a2a90', c2: '#081048', rim: rc, skew: 16 });
      sticker(ctx, nm, x, y - 4, 128, { scale: pop, ol: 4, rot: (1 - eo(uu / .22)) * (i % 2 ? .3 : -.3), sweep: A.H ? lerp(-.3, 1.4, clamp(hp * 1.4 - i * .12)) : -1 });
      if (uu < .25) ring(ctx, x, 800, 40 + uu * 1000, 7, '#fff', 1 - uu / .25);
      if (uu < .3) for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + i, rr = 80 + uu * 700; sparkle(ctx, x + cos(an) * rr, 800 + sin(an) * rr * .8, 20 * (1 - uu / .3), '#fff', an, 1); }
    });
    // ambient glints in the hold
    for (let i = 0; i < 9; i++) { const ph = (v * .7 + i * .29 + hp * 1) % 1, px = 100 + hash(i * 3.3) * 880, py = 220 + hash(i * 7.7) * 780; const a = A.H ? sin(PI * ((hp * 2 + i * .17) % 1)) * env : 0; if (a > .01) sparkle(ctx, px, py, 34 * a, '#fff', i, 1); }
    // energy motes
    const R = rng(51); for (let i = 0; i < 24; i++) { const px = R() * 1080, py = ((R() * 1300 - v * 90 * (.4 + R())) % 1300 + 1300) % 1300 + 100; ctx.fillStyle = 'rgba(255,230,140,.7)'; ctx.beginPath(); ctx.arc(px, py, 3 + R() * 5, 0, TAU); ctx.fill(); }
  }
  // ---- CHARLTON
  function charltonWord() {
    return A.layer('s3_charlton_word', 1160, 420, (g, W, Hh) => {
      g.translate(580, 200); g.transform(1, 0, -.17, 1, 0, 0); g.lineJoin = 'round'; g.miterLimit = 2; g.textAlign = 'center'; g.textBaseline = 'middle';
      let size = 230; g.font = `900 ${size}px Rubik`; if (g.letterSpacing !== undefined) g.letterSpacing = '6px'; const w = g.measureText('CHARLTON').width; size *= M.min(1, 980 / w); g.font = `900 ${size}px Rubik`;
      for (let i = 34; i >= 1; i--) { g.strokeStyle = i % 2 ? '#3a0a66' : '#5a1490'; g.lineWidth = 34; g.strokeText('CHARLTON', i * 1.0, i * 1.25); }
      g.lineWidth = 44; g.strokeStyle = INK; g.strokeText('CHARLTON', 0, 0);
      g.lineWidth = 30; g.strokeStyle = '#fff'; g.strokeText('CHARLTON', 0, 0);
      g.lineWidth = 16; g.strokeStyle = INK; g.strokeText('CHARLTON', 0, 0);
      const gr = g.createLinearGradient(0, -size * .5, 0, size * .5); gr.addColorStop(0, '#FFF3B0'); gr.addColorStop(.47, '#FFD04A'); gr.addColorStop(.5, '#FF9A1C'); gr.addColorStop(1, '#F0501A');
      g.fillStyle = gr; g.fillText('CHARLTON', 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-560, -size * .5, 1120, size * .09);
      g.globalCompositeOperation = 'source-over';
    });
  }
  const CH = () => charltonWord();
  function charltonBanner(ctx, v) {
    if (v < T_CH) return;
    const u = v - T_CH, env = ENV(), hp = HP();
    const pk = clamp((v - 11.36) / .30), e2 = eob(pk);
    const y = lerp(1090, 600, e2), scl = lerp(.64, .9, e2);
    const p = clamp(u / .1), slam = u < .1 ? 1 + 1.6 * (1 - p) * (1 - p) : 1 + .05 * sin(u * 60) * M.exp(-(u - .1) * 30);
    const tilt = -.05 + (u < .1 ? .1 * (1 - p) : 0);
    ctx.save(); ctx.translate(540, y); ctx.rotate(tilt); ctx.scale(scl * slam, scl * slam);
    ctx.translate(0, 4 * OSC(1, 0) / scl);
    if (v > 11.5) A.glow(ctx, 0, 0, 640, '#ff4fd8', .35 + .15 * env);
    const layer = CH(), sw = A.H ? lerp(-.3, 1.3, hp) : (u > .12 && u < .5 ? (u - .12) / .38 : -1);
    if (sw > -.25 && sw < 1.25) ctx.drawImage(charltonSweep(layer, sw), -580, -200); else ctx.drawImage(layer, -580, -200);
    // Hebrew tag
    const tg = clamp((v - 11.52) / .14), te = eob(tg);
    if (tg > 0) {
      ctx.save(); ctx.translate(0, 205 - 30 * (1 - te)); ctx.scale(te, te);
      plate(ctx, 0, 0, 560, 128, { c1: '#ffffff', c2: '#d8e0ff', rim: '#ff4fd8', bw: 8, skew: 20 });
      heb(ctx, "צ'רלטון", 0, 6, 100, 0, 1, { fill: '#2a0a66', noink: true });
      ctx.restore();
    }
    ctx.restore();
    // slam FX
    if (u < .5) { ring(ctx, 540, 1090, 80 + 1600 * eo(u / .45), 24, '#fff', 1 - u / .5); ring(ctx, 540, 1090, 40 + 1000 * eo(u / .4), 12, '#ff4fd8', 1 - u / .4); }
    if (u < .12) { kana(ctx, 'ズバァン!', 250, 700, 120, -.2, eob(u / .07) * 1.1, { fill: '#ff4fd8', out: '#fff' }); spiky(ctx, 880, 1000, 100 * eob(u / .07), .3, 31, '#fff', '#ffe04a', 12); }
  }
  const CSW = document.createElement('canvas'); CSW.width = 1160; CSW.height = 420; const CG = CSW.getContext('2d');
  function charltonSweep(layer, sw) {
    CG.clearRect(0, 0, 1160, 420); CG.globalCompositeOperation = 'source-over'; CG.drawImage(layer, 0, 0);
    CG.globalCompositeOperation = 'source-atop'; CG.save(); CG.transform(1, 0, -.4, 1, 0, 0); const px = lerp(-.1, 1.15, sw) * 1160;
    const g = CG.createLinearGradient(px - 120, 0, px + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); CG.fillStyle = g; CG.fillRect(px - 120, 0, 240, 420); CG.restore();
    // keep only sweep result: mask by layer alpha, remove base by drawing lighter? we redraw full layer with sweep baked in
    CG.globalCompositeOperation = 'source-over'; return CSW;
  }
  function burstShape(ctx, cx, cy, R, seed, n = 30) {
    ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const an = i / (n * 2) * TAU + .1, rr = R * (i % 2 ? .93 : 1.07 + .05 * hash(i + seed)); ctx.lineTo(cx + cos(an) * rr, cy + sin(an) * rr); } ctx.closePath();
  }
  function charltonBG(ctx, v) {
    const hp = HP(), env = ENV();
    ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, '#1a0640'], [.5, '#6a14b0'], [1, '#2a0a55']]); ctx.fillRect(-100, -100, 1280, 2120);
    burst(ctx, 540, 640, v * .35 + hp * (2 * TAU / 26), 26, '#ff4fa8', '#7a1fd0', 2800, .8);
    A.glow(ctx, 540, 640, 900, '#ffb0f0', .5);
    halftone(ctx, -100, -100, 1280, 2120, 34, '#2a0060', .4, (x, y) => clamp(M.hypot(x - 540, y - 640) / 1000) * .95, .5);
    rays(ctx, 540, 640, v, { n: 60, r0: 420, col: '#fff', a: .4, seed: 61, w: .02, fps: 15 });
    const R = rng(71); for (let i = 0; i < 30; i++) { const px = R() * 1080, py = ((R() * 1400 - v * 110 * (.4 + R())) % 1400 + 1400) % 1400 + 80; ctx.fillStyle = i % 3 ? 'rgba(255,220,140,.8)' : 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(px, py, 3 + R() * 6, 0, TAU); ctx.fill(); }
    const j = A.H ? sin(HP() * 40) * 3 * env : 0;
    kana(ctx, 'ゴゴゴ', 200 + j, 1000, 130, -.1, clamp((v - 11.6) / .08), { fill: '#fff', out: '#ff4fd8' }); kana(ctx, 'ゴゴゴ', 880 - j, 300, 130, .1, clamp((v - 11.62) / .08), { fill: '#fff', out: '#ff4fd8' });
    for (let i = 0; i < 10; i++) { const a = A.H ? sin(PI * ((hp * 2 + i * .21) % 1)) * env : 0; if (a > .01) sparkle(ctx, 100 + hash(i * 3.1) * 880, 200 + hash(i * 5.9) * 800, 36 * a, '#fff', i, 1); }
  }
  function finale(ctx, v) {
    // whip out of the whole finale (v 11.92 -> 12.1)
    const wq = clamp((v - 11.92) / .16), WX = -ein(wq) * 1700;
    ctx.fillStyle = '#2a0a55'; ctx.fillRect(0, 0, 1080, 1920);
    if (v >= 12.06) { whipStreaks(ctx, v); return; }
    ctx.save(); ctx.translate(WX, 0);
    const sh = shake(v, T_S5, .3, 24), sh2 = shake(v, T_CH, .3, 26), scx = sh[0] + sh2[0], scy = sh[1] + sh2[1];
    ctx.translate(scx, scy);
    // burst radius (Charlton bg reveal)
    let Rb = 0; if (v >= T_CH) { const u = v - T_CH; Rb = u < .09 ? 230 * eob(u / .09) : (v < 11.30 ? 230 : 230 + 2400 * eio((v - 11.30) / .30)); }
    // sport5 stack (punched up as burst grows)
    if (Rb < 2400) {
      const q = eio((v - 11.30) / .28); ctx.save(); ctx.translate(540, 600); ctx.rotate(-q * .16); ctx.translate(-540, -600 - q * 500); sport5Layer(ctx, v); ctx.restore();
    }
    if (Rb > 0) {
      ctx.save(); burstShape(ctx, 540, 1090 + (v > 11.36 ? -(1090 - 640) * eio((v - 11.36) / .3) : 0), Rb, 5); ctx.clip(); charltonBG(ctx, v); ctx.restore();
      ctx.save(); burstShape(ctx, 540, 1090 + (v > 11.36 ? -(1090 - 640) * eio((v - 11.36) / .3) : 0), Rb, 5); ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
    }
    charltonBanner(ctx, v);
    ctx.restore();
    if (wq > 0) whipStreaks(ctx, v, wq);
  }
  function whipStreaks(ctx, v, wq = 1) {
    const R = rng(81 + M.floor(v * 30)); ctx.save(); const a = clamp(wq * 1.4);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(42,10,85,.7)'; if (wq >= 1) ctx.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 44; i++) { const y = R() * 1920, h = 4 + R() * 30; ctx.globalAlpha = a * (.25 + R() * .6); ctx.fillStyle = ['#ff4fd8', '#fff', '#ffd24a', '#7a4fff'][i % 4]; ctx.fillRect(R() * 300 - 100, y, 700 + R() * 700, h); }
    ctx.restore();
  }
  function sport5(ctx, v) {
    if (v < 10.15 + .1) { /* whip-in streaks from the crowd interlude */ }
    finale(ctx, v);
    if (v >= 10.15 && v < 10.28) { const q = (v - 10.15) / .13; const R = rng(91 + M.floor(v * 30)); ctx.save(); for (let i = 0; i < 40; i++) { ctx.globalAlpha = (1 - q) * (.3 + R() * .6); ctx.fillStyle = ['#ffc24a', '#2f6bff', '#fff'][i % 3]; ctx.fillRect(-200 + R() * 500 * q, R() * 1920, 900 + R() * 600, 6 + R() * 28); } ctx.restore(); }
    impactFrame(ctx, v, T_S5, 3);
    impactFrame(ctx, v, T_CH, 2);
  }

  A.scene({
    name: 's3_sports', start: 9.02, end: 12.30,
    draw(ctx, s) {
      const v = s.t;
      if (A.H && A.H.kind === 'interlude') return;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, 1920); ctx.clip();
      if (v < 10.15) montage(ctx, M.min(v, 10.149)); else sport5(ctx, v);
      ctx.restore();
    },
  });

  // ================================================================== CROWD INTERLUDE (T 22.75 - 25.15)
  const TEAM = [['#ffc24a', '#d98b12', '#fff2b0'], ['#2f6bff', '#1b3fb0', '#9fc4ff'], ['#ff3b4a', '#b01528', '#ffb0b8']];
  const SKINS = [['#f4c7a0', '#d99a6c'], ['#e0a97c', '#b8794c'], ['#c68a5e', '#985a34'], ['#ffddbf', '#e0aa88'], ['#a8714a', '#7a4a2c']];
  const HAIRS = ['#1a1020', '#3a2418', '#0d0d18', '#6a3b1a', '#e8c25a'];
  // one fan (hip at 0,0, head ~ -150). lod 0 full, 1 medium, 2 flat. amp = jump height
  function fan(ctx, x, y, s, seed, t, amp, lod, mode, roar) {
    const hs = hash(seed * 3.1), team = hs < .6 ? 0 : hs < .88 ? 1 : 2, jc = TEAM[team], sk = SKINS[M.floor(hash(seed * 7.7) * 5)], hc = HAIRS[M.floor(hash(seed * 9.1) * 5)];
    const ph = hash(seed * 1.7), bob = abs(sin(PI * (t * 2 + ph * .5))) * amp * s, wv = sin(t * 10 + ph * 6) * (.12 + .12 * roar);
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lw = lod === 2 ? 4 : 7 / M.max(.6, s) * .8;
    const sh = [[-36, -96], [36, -96]], hands = [];
    for (let i = 0; i < 2; i++) { const sgn = i ? 1 : -1, an = sgn * (.32 + .16 * roar) + wv * sgn * (mode === 'flag' && i ? 0 : 1) + (i ? .1 : -.1) * sin(t * 6 + ph * 5), len = 150; const hx = sh[i][0] + sin(an) * len, hy = sh[i][1] - cos(an) * len; hands.push([hx, hy]);
      ctx.strokeStyle = INK; ctx.lineWidth = 40 + lw; ctx.beginPath(); ctx.moveTo(sh[i][0], sh[i][1]); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = sk[0]; ctx.lineWidth = 34; ctx.stroke();
      ctx.strokeStyle = jc[0]; ctx.lineWidth = 36; ctx.beginPath(); ctx.moveTo(sh[i][0], sh[i][1]); ctx.lineTo(sh[i][0] + (hx - sh[i][0]) * .42, sh[i][1] + (hy - sh[i][1]) * .42); ctx.stroke(); }
    // torso
    ctx.beginPath(); ctx.moveTo(-58, -100); ctx.quadraticCurveTo(0, -122, 58, -100); ctx.lineTo(66, 70); ctx.lineTo(-66, 70); ctx.closePath(); ctx.lineWidth = lw * 1.6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = jc[0]; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = jc[1]; ctx.fillRect(10, -130, 90, 240); if (lod < 2) { ctx.fillStyle = team === 0 ? '#2f6bff' : '#fff'; ctx.fillRect(-70, -40, 140, 22); } ctx.restore();
    // head
    ctx.beginPath(); ctx.arc(0, -150, 46, 0, TAU); ctx.lineWidth = lw * 1.6; ctx.stroke(); ctx.fillStyle = sk[0]; ctx.fill();
    if (lod < 2) { ctx.save(); ctx.clip(); ctx.fillStyle = sk[1]; ctx.beginPath(); ctx.arc(14, -138, 46, 0, TAU); ctx.arc(-6, -156, 46, 0, TAU, true); ctx.fill(); ctx.restore(); }
    // hair
    ctx.beginPath(); for (let i = 0; i <= 8; i++) { const an = D2R(-195 + i * 210 / 8), rr = i % 2 ? 48 : 64; ctx.lineTo(cos(an) * rr, -150 + sin(an) * rr * (i % 2 ? 1 : .9)); } ctx.lineTo(30, -160); ctx.lineTo(0, -172); ctx.lineTo(-30, -160); ctx.closePath(); ctx.fillStyle = hc; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
    if (lod < 2) {
      // face: squeezed happy eyes, roaring mouth
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-26, -158); ctx.lineTo(-12, -150); ctx.lineTo(-26, -142); ctx.moveTo(26, -158); ctx.lineTo(12, -150); ctx.lineTo(26, -142); ctx.stroke();
      const mo = 12 + 10 * abs(sin(t * 8 + ph * 9)) + 8 * roar; ctx.fillStyle = '#2a0a18'; ctx.beginPath(); ctx.ellipse(0, -124, 17, mo, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      if (mo > 14) { ctx.fillStyle = '#ff6a7e'; ctx.beginPath(); ctx.ellipse(0, -118 + mo * .3, 9, 5, 0, 0, TAU); ctx.fill(); }
      if (team === 0 && lod === 0) { ctx.fillStyle = '#2f6bff'; ctx.fillRect(-32, -140, 10, 6); ctx.fillRect(22, -140, 10, 6); }
    }
    // scarf or flag between the hands
    if (mode === 'scarf') { const [a, b] = hands; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 60 + 20 * sin(t * 8 + ph * 4), b[0], b[1]); ctx.lineWidth = 44; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 32; ctx.strokeStyle = team === 1 ? '#fff' : '#ffc24a'; ctx.stroke(); ctx.setLineDash([26, 26]); ctx.lineWidth = 32; ctx.strokeStyle = '#2f6bff'; ctx.stroke(); ctx.setLineDash([]); }
    if (mode === 'flag') { const h0 = hands[1]; flag(ctx, h0[0], h0[1], t, ph, team); }
    for (const h of hands) { ctx.fillStyle = sk[0]; ctx.beginPath(); ctx.arc(h[0], h[1], 21, 0, TAU); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }
  function flag(ctx, x, y, t, ph, team) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(0, -330); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 8; ctx.stroke();
    const N = 12, W = 320, Hh = 200, cols = team === 1 ? ['#2f6bff', '#fff'] : ['#ffc24a', '#2f6bff'];
    for (let pass = 0; pass < 2; pass++) { ctx.beginPath();
      for (let i = 0; i <= N; i++) { const px = 8 + i / N * W, py = -330 + sin(t * 7 - i * .7 + ph * 5) * 16 * (i / N) + (pass ? Hh : 0); if (pass === 0) ctx.lineTo(px, py); }
      for (let i = N; i >= 0; i--) { const px = 8 + i / N * W, py = -330 + Hh + sin(t * 7 - i * .7 + ph * 5) * 16 * (i / N); ctx.lineTo(px, py); }
      ctx.closePath(); if (pass === 0) { ctx.fillStyle = cols[0]; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); break; } }
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(8, -330 + 70); for (let i = 0; i <= N; i++) { const px = 8 + i / N * W, py = -330 + 70 + sin(t * 7 - i * .7 + ph * 5) * 16 * (i / N); ctx.lineTo(px, py); } for (let i = N; i >= 0; i--) { const px = 8 + i / N * W, py = -330 + 130 + sin(t * 7 - i * .7 + ph * 5) * 16 * (i / N); ctx.lineTo(px, py); } ctx.fill();
    // star of David-free emblem: simple star
    V.sparkle(ctx, 8 + W * .5, -330 + Hh * .5 + sin(t * 7 - 3.5 + ph * 5) * 8, 36, '#fff', 0, 1);
    ctx.restore();
  }
  function tifoLayer() {
    return A.layer('s3_tifo', 1500, 560, (g, W, Hh) => {
      const cell = 20;
      for (let j = 0; j < Hh / cell; j++) for (let i = 0; i < W / cell; i++) {
        const x = i * cell + cell / 2, y = j * cell + cell / 2, dx = x - W / 2, dy = y - Hh / 2, d = M.hypot(dx, dy * 1.5);
        let c; const diag = (x / W) * .55 + (y / Hh) * .45;
        if (d < 190) c = ((M.floor(d / 40) % 2) ? '#ffffff' : '#ffc24a'); else if (d < 250) c = '#0b1450'; else c = diag < .5 ? '#2f6bff' : '#ffc24a';
        // ray pattern
        const an = M.atan2(dy, dx); if (d > 250 && M.floor((an + PI) / TAU * 24) % 2 === 0) c = c === '#2f6bff' ? '#1b46c8' : '#f0a020';
        g.fillStyle = c; g.fillRect(i * cell, j * cell, cell + .5, cell + .5);
      }
      g.fillStyle = 'rgba(255,255,255,.16)'; for (let j = 0; j < Hh / cell; j++) for (let i = 0; i < W / cell; i++) if ((i + j) % 2 === 0) g.fillRect(i * cell + 4, j * cell + 4, cell - 8, cell - 8);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.lineJoin = 'round'; g.font = '900 150px Rubik';
      g.lineWidth = 46; g.strokeStyle = INK; g.strokeText('עד הסוף', W / 2, Hh / 2 + 6); g.lineWidth = 22; g.strokeStyle = '#fff'; g.strokeText('עד הסוף', W / 2, Hh / 2 + 6);
      g.fillStyle = '#0b1450'; g.fillText('עד הסוף', W / 2, Hh / 2 + 6);
    });
  }
  function flare(ctx, x, y, t, k, inten) {
    const R = rng(k * 7 + 3);
    for (let i = 0; i < 16; i++) { const age = (t * .55 + i / 16 + R() * .05) % 1, yy = y - age * 620, xx = x + sin(age * 5 + k + i) * 40 + age * 60, r = 34 + age * 170; ctx.save(); ctx.globalAlpha = (1 - age) * .5 * inten;
      ctx.fillStyle = V.rad(ctx, xx, yy, 0, r, [[0, age < .3 ? 'rgba(255,120,60,.9)' : 'rgba(255,90,110,.7)'], [1, 'rgba(160,20,60,0)']]); ctx.fillRect(xx - r, yy - r, r * 2, r * 2); ctx.restore(); }
    A.glow(ctx, x, y - 8, 190 * (.8 + .3 * inten), '#ff5a3c', .9); A.glow(ctx, x, y - 8, 70, '#fff6c8', 1);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + 90); ctx.lineTo(x, y); ctx.stroke(); ctx.strokeStyle = '#ff3b4a'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
  }
  function bigFace(ctx, x, y, r, t, roar) {
    ctx.save(); ctx.translate(x, y); ctx.scale(r / 100, r / 100); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // scarf around neck / shoulders
    ctx.fillStyle = '#ffc24a'; ctx.beginPath(); ctx.moveTo(-190, 190); ctx.quadraticCurveTo(0, 120, 190, 190); ctx.lineTo(240, 330); ctx.lineTo(-240, 330); ctx.closePath(); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#2f6bff'; for (let i = -6; i < 6; i++) ctx.fillRect(i * 70, 100, 34, 300); ctx.restore();
    // hair
    ctx.beginPath(); for (let i = 0; i <= 12; i++) { const an = D2R(-200 + i * 220 / 12), rr = i % 2 ? 108 : 150; ctx.lineTo(cos(an) * rr, sin(an) * rr - 8); } ctx.closePath(); ctx.fillStyle = '#20122e'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 110, 128, 0, 0, TAU); ctx.fillStyle = '#f4c7a0'; ctx.fill(); ctx.lineWidth = 12; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#d99a6c'; ctx.beginPath(); ctx.ellipse(34, 20, 110, 128, 0, 0, TAU); ctx.ellipse(-12, -12, 110, 128, 0, 0, TAU, true); ctx.fill();
    // painted stripes on cheeks
    ctx.fillStyle = '#ffc24a'; ctx.fillRect(-120, 10, 240, 26); ctx.fillStyle = '#2f6bff'; ctx.fillRect(-120, 36, 240, 26); ctx.restore();
    // bangs
    ctx.beginPath(); ctx.moveTo(-112, -30); for (let i = 0; i <= 8; i++) ctx.lineTo(-112 + i * 28, i % 2 ? -78 : -40); ctx.lineTo(112, -60); ctx.lineTo(120, -110); ctx.lineTo(-120, -110); ctx.closePath(); ctx.fillStyle = '#20122e'; ctx.fill(); ctx.lineWidth = 10; ctx.stroke();
    // squeezed eyes > <
    ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-72, -30); ctx.lineTo(-30, -14); ctx.lineTo(-72, 4); ctx.moveTo(72, -30); ctx.lineTo(30, -14); ctx.lineTo(72, 4); ctx.stroke();
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-84, -56); ctx.lineTo(-26, -40); ctx.moveTo(84, -56); ctx.lineTo(26, -40); ctx.stroke();
    // giant roaring mouth
    const mo = 44 + 16 * roar + 8 * sin(t * 30); ctx.fillStyle = '#2a0a18'; ctx.beginPath(); ctx.ellipse(0, 78, 64, mo, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-46, 44, 92, 24, 6); ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#ff6a7e'; ctx.beginPath(); ctx.ellipse(0, 78 + mo * .5, 38, 20, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  A.scene({
    name: 's3_crowd_interlude', outT: true, start: 22.75, end: 25.15,
    draw(ctx, s) {
      const u = s.t - 22.75, t = s.t, rr = clamp((u - 1.2) / .25), roar = u < 1.2 ? .25 + .35 * clamp((u - .3) / .8) : 1;
      // camera
      const panX = lerp(-90, 140, eio(u / 1.2)) + (u > 1.2 ? -40 * eo((u - 1.2) / 1) : 0), zoom = 1 + .05 * eio(u / 1.2) + (u >= .95 && u < 1.2 ? .1 * (u - .95) / .25 : 0) + (u > 1.2 ? .05 : 0);
      const shk = u > 1.2 ? 26 * M.exp(-(u - 1.2) * 4.2) : (u > .95 ? 8 * (u - .95) / .25 : 0);
      const whip = u > 2.2 ? ein((u - 2.2) / .2) : 0, inX = u < .32 ? -(1 - eo(u / .32)) * 1500 : 0;
      ctx.fillStyle = '#0a0f3a'; ctx.fillRect(0, 0, 1080, 1920);
      ctx.save();
      ctx.translate(540 + inX + whip * 1700 + A.noise1(t * 55) * shk, 800 + A.noise1(t * 55 + 30) * shk); ctx.rotate(u > 1.2 ? A.noise1(t * 22) * .012 * (shk / 26) : 0); ctx.scale(zoom, zoom); ctx.translate(-540, -800);
      // ---- sky + roof floodlights
      ctx.fillStyle = V.lin(ctx, 0, -100, 0, 800, [[0, '#050830'], [1, '#1c2a80']]); ctx.fillRect(-400, -200, 1900, 1100);
      for (let i = 0; i < 4; i++) { const lx = 60 + i * 320 + panX * .1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = V.lin(ctx, lx, 40, lx, 800, [[0, 'rgba(200,230,255,.5)'], [1, 'rgba(200,230,255,0)']]); ctx.beginPath(); ctx.moveTo(lx - 40, 40); ctx.lineTo(lx + 40, 40); ctx.lineTo(lx + 230, 800); ctx.lineTo(lx - 230, 800); ctx.fill(); ctx.restore();
        ctx.fillStyle = INK; ctx.fillRect(lx - 70, 20, 140, 60); for (let a = 0; a < 4; a++) { ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(lx - 45 + a * 30, 50, 10, 0, TAU); ctx.fill(); } A.glow(ctx, lx, 50, 220, '#dff0ff', .9); }
      // ---- tifo (drops at u 1.2)
      const drop = u < 1.2 ? 0 : eob((u - 1.2) / .32), tifoY = lerp(-500, 120, drop) + (u < 1.2 ? -1 : 0) * 0;
      const tf = tifoLayer(), tw = 1500, th = 560, tx = -210 + panX * .35;
      ctx.save(); ctx.translate(0, tifoY);
      for (let sx = 0; sx < tw; sx += 20) { const wy = sin(t * 2.6 + sx * .012) * 10 + sin(t * 1.3 + sx * .02) * 6 * (u > 1.2 ? 1.6 : 1); ctx.drawImage(tf, sx, 0, 20.5, th, tx + sx, wy, 20.5, th); }
      ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeRect(tx, 0, tw, th); ctx.restore();
      // ---- stand rows (far to near): steps + fans
      const rows = [{ y: 770, s: .34, sp: 74, lod: 2, par: .5, amp: 26, mode: '', c: '#0e1650' }, { y: 900, s: .52, sp: 108, lod: 1, par: .7, amp: 32, mode: 'scarf', c: '#0b1244' }, { y: 1080, s: .8, sp: 156, lod: 0, par: .88, amp: 42, mode: 'scarf', c: '#080e38' }, { y: 1330, s: 1.22, sp: 260, lod: 0, par: 1, amp: 46, mode: 'flag', c: '#050a2a' }];
      rows.forEach((rw, ri) => {
        ctx.fillStyle = rw.c; ctx.fillRect(-400, rw.y + 20 * rw.s * 3, 1900, 1400);
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(-400, rw.y + 60 * rw.s, 1900, 4);
        const off = panX * rw.par, n = M.ceil(1500 / rw.sp);
        for (let i = -2; i < n + 2; i++) { const seed = ri * 100 + i + 40, x = i * rw.sp + off + hash(seed) * rw.sp * .5 - 150; const md = rw.mode === 'flag' ? (i % 2 ? 'flag' : 'scarf') : rw.mode;
          if (x < -200 || x > 1280) continue; fan(ctx, x, rw.y + (hash(seed + 5) - .5) * 24 * rw.s, rw.s, seed, t, rw.amp * (u > 1.2 ? 1.5 : 1), rw.lod, md, roar); }
        if (ri < 2) { ctx.fillStyle = 'rgba(20,40,120,.35)'; ctx.fillRect(-400, rw.y - 400, 1900, 800); }   // atmospheric haze between rows
      });
      // ---- flares + smoke
      const fi = u < 1.2 ? .7 : 1.4;
      flare(ctx, 250 + panX * .8, 1000, t, 1, fi); flare(ctx, 800 + panX * .85, 940, t, 2, fi); flare(ctx, 540 + panX * .9, 1150, t, 3, fi * .9);
      // ---- drum
      const beat = (t * 4) % 1, hit = M.exp(-beat * 9);
      ctx.save(); ctx.translate(180 + panX * 1.1, 1260); ctx.scale(1 + .05 * hit, 1 - .04 * hit); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 0, 150, 60, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffc24a'; ctx.fillRect(-140, 0, 280, 130); ctx.beginPath(); ctx.ellipse(0, 130, 140, 50, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f5f0e0'; ctx.beginPath(); ctx.ellipse(0, 0, 140, 52, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeRect(-140, 0, 280, 130);
      ring(ctx, 0, 0, 160 + 240 * (1 - hit), 8, '#fff', hit * .8); ctx.restore();
      // ---- confetti after goal
      if (u > 1.2) { const c = u - 1.2, R = rng(5); for (let i = 0; i < 140; i++) { const a = R() * TAU, sp = 300 + R() * 900, x0 = 540 + panX * 0, px = x0 + cos(a) * sp * c * (1 - .3 * c) + (R() - .5) * 200, py = 700 + sin(a) * sp * c * .8 + 700 * c * c; ctx.save(); ctx.translate(px, py); ctx.rotate(R() * 6 + c * 8 * (R() - .5)); ctx.fillStyle = ['#ffc24a', '#2f6bff', '#fff', '#ff3b4a', '#5ad1ff'][i % 5]; ctx.scale(1, abs(cos(c * 9 + i))); ctx.fillRect(-11, -6, 22, 12); ctx.restore(); } }
      ctx.restore();
      // ---- close-up panel (u 0.95 - 1.2)
      if (u >= .95 && u < 1.2) {
        const q = clamp((u - .95) / .06), pxs = (1 - eo(q)) * 1300, zz = 1 + (u - .95) * .5;
        ctx.save(); ctx.translate(pxs, 0); ctx.beginPath(); ctx.moveTo(150, 250); ctx.lineTo(1040, 200); ctx.lineTo(930, 1130); ctx.lineTo(40, 1180); ctx.closePath(); ctx.save(); ctx.clip();
        ctx.fillStyle = '#ffc24a'; ctx.fillRect(0, 0, 1080, 1400); burst(ctx, 540, 700, u * 2, 26, '#ffe27a', '#ff9a1c', 2000, 1); halftone(ctx, 0, 0, 1080, 1400, 26, '#a02808', .4, (x, y) => clamp(M.hypot(x - 540, y - 700) / 700), .5);
        ctx.save(); ctx.translate(540, 700); ctx.scale(zz, zz); ctx.translate(-540, -700); bigFace(ctx, 540, 700, 300, t, roar); ctx.restore();
        rays(ctx, 540, 700, t, { n: 70, r0: 380, col: '#fff', a: .55, seed: 3, w: .03, fps: 15 });
        ctx.restore(); ctx.lineWidth = 18; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.stroke();
        sweat(ctx, 830, 420, 1.6, .5); sweat(ctx, 230, 480, 1.3, -.5);
        kana(ctx, 'ウォォ', 540, 1060, 180, -.05, 1.0, { fill: '#ff3b4a' });
        ctx.restore();
      }
      // ---- goal eruption
      if (u >= 1.2 && u < 2.2) {
        const c = u - 1.2, pop = eob(c / .18), wob = 1 + .05 * sin(c * 14) * M.exp(-c * 2);
        rays(ctx, 540, 600, t, { n: 60, r0: 300 + 500 * eo(c / .3), col: '#ffe27a', a: .45 * (1 - c * .6), seed: 5, w: .03, fps: 15 });
        ring(ctx, 540, 600, 60 + 1500 * eo(c / .5), 30, '#fff', 1 - c / .5);
        heb(ctx, 'גוווול!', 540, 600, 330, -.06, pop * wob, { grad: GOLD, out: '#fff' });
        kana(ctx, 'ワァァァ', 270, 960, 105, -.14, clamp((c - .06) / .08) * 1.08, { fill: '#5ad1ff' }); kana(ctx, 'ドドド', 820, 990, 105, .12, clamp((c - .1) / .08) * 1.08, { fill: '#ff4fd8' });
        for (let i = 0; i < 12; i++) { const ph = (c * 3 + i * .31) % 1; sparkle(ctx, 80 + hash(i * 5.3) * 920, 160 + hash(i * 2.9) * 900, 40 * sin(PI * ph), '#fff', i, 1); }
      }
      // ---- whip-in / whip-out streaks
      const sIn = u < .32 ? 1 - u / .32 : 0, sOut = u > 2.2 ? (u - 2.2) / .2 : 0, sk = M.max(sIn, sOut);
      if (sk > 0) { const R = rng(41 + M.floor(t * 30)); ctx.save(); for (let i = 0; i < 46; i++) { ctx.globalAlpha = sk * (.3 + R() * .7); ctx.fillStyle = ['#ffc24a', '#2f6bff', '#fff', '#ffc24a'][i % 4]; const w = 600 + R() * 900, x = sIn > 0 ? -300 + R() * 800 * (1 - sk) : 1080 - w + R() * 500 - 400 * (1 - sk); ctx.fillRect(x, R() * 1920, w, 6 + R() * 34); } ctx.restore(); }
      if (u > 2.28) { ctx.fillStyle = `rgba(255,194,74,${clamp((u - 2.28) / .12) * .85})`; ctx.fillRect(0, 0, 1080, 1920); }
      impactFrame(ctx, t, 22.75 + 1.2, 3);
    },
  });
})();
