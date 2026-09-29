// ============================================================================
// S4 SERIES  (v 12.00-15.81, tail to 16.11)  +  ANIME INTERLUDE (T 33.736-37.536)
//   12.00 Turkish golden-hour Bosphorus + soap-opera drama panels   [hold 9 at 13.07]
//   13.10 Korean neon-rain Seoul (vector hangul)                     [hold 10 at 13.95]
//   13.96 ANIME PUNCH: hero "Kai" slams in, builds to the close-up frame where the interlude takes over (v 14.536)
//   14.536 LOGO WALL rush -> pull back into a huge wall by 15.42     [hold 12 at 15.61]  -> zoom-through tail
//   Interlude: emotional 3.8 s anime mini-scene (Kai close-ups, floating screen wall, sakura, aura, manga captions)
// Pure function of t. Static art is cached with A.layer. Ambient motion uses A.T (continuous through holds).
// ============================================================================
(() => {
const { clamp, lerp, ease, hash, rng, inv, smooth } = A;
const W = 1080, H = 1920, TAU = Math.PI * 2, PI = Math.PI;
const eo = x => ease.out(clamp(x)), eio = x => ease.inOut(clamp(x)), eob = x => ease.outBack(clamp(x)), ein = x => ease.in(clamp(x));
const lin = V.lin, rad = V.rad;
const INK = '#0d0a26';
const FONT = 'Rubik, "Secular One", sans-serif';
const JP = '"IPAGothic","Unifont-JP","Noto Sans CJK JP",sans-serif';
const T_TUR = 12.00, T_KOR = 13.10, T_ANI = 13.96, T_WALL = 14.536, T_LIB = 15.81, T_END = 16.11;
const IT0 = 33.736, IT1 = 37.536;
const add = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const kick = (t, t0, k = 16) => (t < t0 ? 0 : Math.exp(-(t - t0) * k));
const amb = () => (A.T || 0);                     // continuous ambient clock (keeps moving during holds without jumping)
const holdBell = () => (A.H ? Math.sin(PI * A.H.u / A.H.dur) : 0);   // 0 at hold start and end, 1 in the middle
const holdU = () => (A.H ? A.H.u : 0);
const mix = (a, b, k) => A.mixc(a, b, clamp(k));
const lay = (key, w, h, fn) => A.layer('s4_' + key, w, h, fn);

// ---------------------------------------------------------------- generic anime primitives
let _snapC = null;
function snapshot(ctx) { if (!_snapC) { _snapC = document.createElement('canvas'); _snapC.width = W; _snapC.height = H; } const g = _snapC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.globalAlpha = 1; g.filter = 'none'; g.drawImage(ctx.canvas, 0, 0); g.globalCompositeOperation = 'source-over'; return _snapC; }
// black/white impact frame: posterise the current picture to hard black & white (or inverted) : k 0..1 mix
function impactFrame(ctx, k, inv = true) {
  if (k <= 0.01) return; const s = snapshot(ctx);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(k); ctx.filter = `grayscale(1) contrast(9) brightness(1.15) ${inv ? 'invert(1)' : ''}`; ctx.drawImage(s, 0, 0); ctx.restore(); ctx.filter = 'none';
}
// radial focus / speed lines: thin at the focus, wide outside. o {r0, len, n, col, alpha, fps, w}
function speedLines(ctx, cx, cy, t, o = {}) {
  const n = o.n || 80, fr = Math.floor(t * (o.fps || 15)); ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = o.col || '#fff'; ctx.globalAlpha = o.alpha ?? 1;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 3.17 + fr * .371), h2 = hash(i * 7.9 + fr * .13), a = (i + h1 * .9) / n * TAU, r0 = (o.r0 || 320) * (.8 + .5 * h2), r1 = r0 + (o.len || 1500), w = (o.w || .028) * (.3 + h1 * 1.2);
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a - w) * r1, Math.sin(a - w) * r1); ctx.lineTo(Math.cos(a + w) * r1, Math.sin(a + w) * r1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// screentone (halftone dots) block with radial or linear size ramp, cached
function tone(ctx, key, x, y, w, h, cell, col, mode = 'radial', alpha = 1, rot = .5) {
  const c = lay('tone_' + key, w, h, (g, w, h) => { g.fillStyle = col; const n = Math.ceil((w + h) / cell); g.translate(w / 2, h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
    for (let j = -n; j < n * 2; j++) for (let i = -n; i < n * 2; i++) { const px = i * cell + (j % 2) * cell / 2, py = j * cell * .866; const rx = px, ry = py; let k;
      // ramp evaluated in unrotated space approx
      const ux = (px - w / 2) / (w / 2), uy = (py - h / 2) / (h / 2);
      k = mode === 'radial' ? clamp(Math.hypot(ux, uy) - .2, 0, 1) : mode === 'down' ? clamp((py / h)) : mode === 'up' ? clamp(1 - py / h) : 1;
      const r = cell * .55 * k; if (r > .6) { g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); } } });
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(c, x, y); ctx.restore();
}
// cherry blossom petal sprite (pink, two-tone), cached per hue index
const petalSprite = i => lay('petal' + i, 72, 72, (g) => {
  const cols = [['#FFD3E4', '#FF8FB6'], ['#FFE6EF', '#FFA8C6'], ['#FFC2DA', '#F76FA0']][i % 3]; g.translate(36, 36);
  g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-34, 10, -30, -26, -8, -30); g.lineTo(0, -20); g.lineTo(8, -30); g.bezierCurveTo(30, -26, 34, 10, 0, 30); g.closePath();
  g.fillStyle = lin(g, 0, -30, 0, 30, [[0, cols[0]], [1, cols[1]]]); g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(190,60,110,.55)'; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, -12); g.quadraticCurveTo(-10, 4, -2, 20); g.stroke();
});
function petals(ctx, t, o = {}) {
  const n = o.n || 40, sd = o.seed || 1, sp = o.speed || 1, wind = o.wind ?? 1;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 4.3 + sd), h2 = hash(i * 9.1 + sd), h3 = hash(i * 2.7 + sd), z = .35 + h2 * 1.1, fall = (t * (90 + 120 * h1) * sp * z + h3 * 2600) % 2600;
    const x = ((h1 * 1400 - 160 + Math.sin(t * (.7 + h3) + i) * 90 * z + t * 60 * wind * z) % 1400 + 1400) % 1400 - 160, y = fall - 340;
    const r = 15 + 28 * z * (o.size || 1), rot = t * (1 + h2 * 2) * (i % 2 ? 1 : -1) + i, fl = Math.abs(Math.sin(t * (2 + h1 * 3) + i));
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .45 + .55 * fl); ctx.globalAlpha = (o.alpha ?? 1) * (z > 1 ? .95 : .85); const s = r / 36;
    ctx.drawImage(petalSprite(i), -36 * s, -36 * s, 72 * s, 72 * s); ctx.restore();
  }
}
function sparkleStar(ctx, x, y, r, col = '#fff', rot = 0, a = 1) {   // 4-point anime glint
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
}
// katakana/kana SFX with pop-in, shake; fill yellow, ink stroke, white halo
function sfx(ctx, txt, x, y, size, rot, u, o = {}) {
  if (u < 0) return; const pop = eob(u / (o.pop || .12)), sh = o.shake ?? 1, k = kick(u, 0, 9), fade = o.dur ? clamp((o.dur - u) / .08) : 1; if (fade <= 0) return;
  ctx.save(); ctx.translate(x + Math.sin(u * 90) * 6 * sh * k, y + Math.cos(u * 77) * 6 * sh * k); ctx.rotate(rot); const s = lerp(.3, 1, pop) * (1 + .06 * Math.sin(u * 30) * k); ctx.scale(s, s); ctx.globalAlpha = fade;
  ctx.font = `900 ${size}px ${o.font || JP}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  ctx.lineWidth = size * .30; ctx.strokeStyle = o.halo || '#fff'; ctx.strokeText(txt, 0, 0);
  ctx.lineWidth = size * .19; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0);
  ctx.fillStyle = o.grad ? lin(ctx, 0, -size * .5, 0, size * .5, o.grad) : (o.fill || '#FFE14A'); ctx.fillText(txt, 0, 0); ctx.restore();
}
// Hebrew manga caption: slanted white burst plate, thick ink text with colour offset, kana ornament. o {rot, col, kana, u}
function mangaCaption(ctx, txt, x, y, size, u, o = {}) {
  if (u < 0) return; const pop = eob(u / .16), fade = o.dur ? clamp((o.dur - u) / .1) : 1; if (fade <= 0) return; const rot = o.rot ?? -.05;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = lerp(.55, 1, pop); ctx.scale(s, s); ctx.globalAlpha = fade * clamp(u / .05);
  ctx.font = `900 ${size}px ${FONT}`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const tw = Math.min(ctx.measureText(txt).width, 940), bw = tw + size * 1.1, bh = size * 1.55;
  // jagged burst plate
  const rr = rng(o.seed || 7); ctx.beginPath(); const N = 26; for (let i = 0; i < N; i++) { const a = i / N * TAU, ex = Math.cos(a), ey = Math.sin(a); const k = (i % 2 ? .93 : 1.08) + .02 * (rr() - .5); const px = ex * bw * .5 * k * 1.0, py = ey * bh * .5 * k * 1.12; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillStyle = INK; ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.stroke(); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff'; ctx.lineWidth = 9; ctx.strokeStyle = o.col || '#FFC24A'; ctx.stroke(); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,90,140,.16)'; for (let j = -6; j < 8; j++) for (let i = -14; i < 14; i++) { const px = i * 22 + (j % 2) * 11, py = j * 19, k = clamp((py + bh * .5) / bh); const r = 6.5 * k; if (r > .8) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); } } ctx.restore();
  const fit = tw > 900 ? 900 / tw : 1; ctx.scale(fit, fit);
  ctx.lineWidth = size * .07; ctx.strokeStyle = '#fff'; ctx.strokeText(txt, 0, 4);
  ctx.fillStyle = o.fill || INK; ctx.fillText(txt, 0, 4);
  if (o.under) { ctx.fillStyle = o.col || '#FF3D7A'; ctx.fillRect(-tw * .5 + 8, size * .5 + 2, tw - 16, 7); }
  ctx.restore();
  if (o.kana) { ctx.save(); ctx.translate(x + (o.kx ?? 0), y + (o.ky ?? -size * 1.25)); ctx.rotate(rot * 1.6); const p2 = eob((u - .06) / .16); ctx.scale(p2, p2); ctx.globalAlpha = fade; ctx.font = `900 ${size * .62}px ${JP}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * .2; ctx.strokeStyle = '#fff'; ctx.strokeText(o.kana, 0, 0); ctx.lineWidth = size * .11; ctx.strokeStyle = INK; ctx.strokeText(o.kana, 0, 0); ctx.fillStyle = o.kcol || '#FF3D7A'; ctx.fillText(o.kana, 0, 0); ctx.restore(); }
}
// tapered limb polygon along a quadratic curve
function limb(g, p0, p1, p2, w0, w1, fill, line = INK, lw = 6, shade) {
  const L = [], R = [], N = 14; for (let i = 0; i <= N; i++) { const k = i / N, x = (1 - k) * (1 - k) * p0[0] + 2 * (1 - k) * k * p1[0] + k * k * p2[0], y = (1 - k) * (1 - k) * p0[1] + 2 * (1 - k) * k * p1[1] + k * k * p2[1];
    const dx = 2 * (1 - k) * (p1[0] - p0[0]) + 2 * k * (p2[0] - p1[0]), dy = 2 * (1 - k) * (p1[1] - p0[1]) + 2 * k * (p2[1] - p1[1]), l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = lerp(w0, w1, k) / 2; L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); }
  g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
  g.fillStyle = fill; g.fill(); if (shade) { g.save(); g.clip(); g.beginPath(); R.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) { const q = [lerp(R[i][0], L[i][0], .42), lerp(R[i][1], L[i][1], .42)]; g.lineTo(q[0], q[1]); } g.closePath(); g.fillStyle = shade; g.fill(); g.restore(); }
  g.lineWidth = lw; g.strokeStyle = line; g.lineJoin = 'round'; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.stroke();
}

// ---------------------------------------------------------------- ANIME FACES (cel shaded, ink lines).  Local units: head width = 300, origin = head centre, y down.
const SKIN = { kai: ['#FFDCC0', '#F4B592', '#D98A6B'], girl: ['#FFE6D8', '#F8BFA8', '#E3927E'], man: ['#EFC6A2', '#D9A07A', '#B77C59'] };
const HAIR = { kai: ['#1B2C8E', '#0C1554', '#63A0FF'], girl: ['#4B2A22', '#26120F', '#C27A44'], man: ['#181826', '#08080F', '#5B6BA6'], gold: ['#FFC93A', '#E58A17', '#FFF7B8'] };
const IRIS = { kai: ['#5A1D00', '#C25A00', '#FFB01F', '#FFEE9A'], girl: ['#0E4A45', '#1F8A78', '#5FD0A8', '#D6FFE6'], man: ['#1A0F0A', '#4B2A17', '#8A5A2E', '#D8A56A'] };
function spikePath(g, ax, ay, bx, by, tx, ty, bend = .25) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = tx - mx, dy = ty - my, nx = -dy, ny = dx;
  g.moveTo(ax, ay); g.quadraticCurveTo(ax + dx * .55 + nx * bend * .35, ay + dy * .55 + ny * bend * .35, tx, ty); g.quadraticCurveTo(bx + dx * .5 + nx * bend * .1, by + dy * .5 + ny * bend * .1, bx, by); g.closePath();
}
function eyePath(g, k, lower = 1) { g.beginPath(); g.moveTo(-46, 10); g.bezierCurveTo(-32, -60 * k - 6, 30, -70 * k - 6, 58, -3); g.bezierCurveTo(40, 46 * k * lower + 9, -18, 58 * k * lower + 9, -46, 10); g.closePath(); }
function drawEye(g, c, side) {
  const E = c.eyes || {}, k = clamp((E.k ?? 1) * (1 - (E.blink || 0)), 0.02, 1.25), st = E.style || 'normal', id = c.id || 'kai', ic = IRIS[id];
  const ex = 70 + (id === 'man' ? -4 : 0), ey = 34, turn = c.turn || 0, sc = (id === 'man' ? .86 : id === 'girl' ? 1.04 : 1) * (E.scale || 1);
  g.save(); g.translate(side * ex + turn * 20 * (1 - .25 * side * Math.sign(turn || 1)), ey); g.scale(side * sc, sc);
  if (st === 'shut' || k < .06) { g.lineWidth = 12; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46, 12); g.quadraticCurveTo(6, 30, 58, 2); g.stroke(); g.beginPath(); g.moveTo(56, 2); g.lineTo(72, -12); g.stroke(); g.restore(); return; }
  if (st === 'happy') { g.lineWidth = 13; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.moveTo(-44, 22); g.quadraticCurveTo(6, -46, 58, 18); g.stroke(); g.beginPath(); g.moveTo(56, 16); g.lineTo(72, 4); g.stroke(); g.restore(); return; }
  // eye white
  eyePath(g, k); g.fillStyle = '#F7F9FF'; g.fill(); g.save(); g.clip();
  const ir = (E.iris || 1) * (st === 'wide' ? .8 : 1), px = (E.lx || 0) * 12, py = (E.ly || 0) * 10, icx = 5 + px, icy = 3 + py + (1 - k) * -8;
  // iris
  g.fillStyle = lin(g, 0, icy - 52 * ir, 0, icy + 54 * ir, [[0, ic[0]], [.32, ic[1]], [.72, ic[2]], [1, ic[3]]]);
  g.beginPath(); g.ellipse(icx, icy, 41 * ir, 53 * ir, 0, 0, TAU); g.fill();
  if (st === 'fire') { g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, icx, icy, 5, 50, [[0, 'rgba(255,255,220,.95)'], [1, 'rgba(255,140,0,0)']]); g.fillRect(icx - 60, icy - 60, 120, 120); g.globalCompositeOperation = 'source-over'; }
  // iris ring + limbal darkening
  g.lineWidth = 5; g.strokeStyle = ic[0]; g.beginPath(); g.ellipse(icx, icy, 40 * ir, 52 * ir, 0, 0, TAU); g.stroke();
  // pupil
  const pu = (E.pupil ?? 1) * (st === 'wide' ? .62 : 1); g.fillStyle = '#12060A'; g.beginPath(); g.ellipse(icx + px * .2, icy + py * .2, 16 * pu, 27 * pu, 0, 0, TAU); g.fill();
  // lower glow (water) band
  g.fillStyle = rad(g, icx, icy + 30 * ir, 2, 34 * ir, [[0, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.ellipse(icx, icy + 32 * ir, 30 * ir, 20 * ir, 0, 0, TAU); g.fill();
  // highlights
  const tw = c.t || 0;
  if (st === 'sparkle') {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(icx - 13, icy - 24, 17, 21, -.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(icx + 15, icy + 21, 10, 10, 0, 0, TAU); g.fill();
    for (let i = 0; i < 6; i++) { const a = i * 1.9 + .7, rr = 14 + 20 * hash(i + 3), sx = icx + Math.cos(a) * rr * .95, sy = icy + Math.sin(a) * rr * 1.25, tw2 = .55 + .45 * Math.sin(tw * (9 + i * 2) + i * 2); sparkleStar(g, sx, sy, (7 + 8 * hash(i * 2.2)) * tw2 * (E.spark ?? 1), i % 2 ? '#FFF6B0' : '#FFFFFF', tw * .5 + i, 1); }
    g.fillStyle = 'rgba(180,225,255,.9)'; g.beginPath(); g.ellipse(icx, icy + 44 * ir, 40, 6, 0, 0, TAU); g.fill();   // tear-line glisten
  } else {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(icx - 13, icy - 24, 15, 19, -.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(icx + 15, icy + 21, 7.5, 7.5, 0, 0, TAU); g.fill();
    g.globalAlpha = .7; g.beginPath(); g.ellipse(icx + 22, icy - 12, 4, 4, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  }
  // upper-lid shadow on eyeball
  g.fillStyle = lin(g, 0, -64 * k, 0, -8 * k, [[0, 'rgba(40,20,60,.5)'], [1, 'rgba(40,20,60,0)']]); g.fillRect(-60, -70 * k, 130, 62 * k);
  g.restore();
  // lid line + lashes
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  const lw = id === 'girl' ? 13 : id === 'man' ? 15 : 13;
  g.lineWidth = lw; g.beginPath(); g.moveTo(-48, 11); g.bezierCurveTo(-32, -60 * k - 6, 30, -70 * k - 6, 58, -3); g.stroke();
  g.beginPath(); g.moveTo(52, -6); g.quadraticCurveTo(66, -8, id === 'girl' ? 78 : 74, id === 'girl' ? -22 : -16); g.lineWidth = lw * .72; g.stroke();
  if (id === 'girl') { g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(20 + i * 14, -38 * k - i * 4); g.quadraticCurveTo(36 + i * 14, -52 * k - i * 5, 44 + i * 15, -60 * k - i * 7); g.stroke(); } }
  g.lineWidth = 3.5; g.strokeStyle = 'rgba(30,10,30,.65)'; g.beginPath(); g.moveTo(-40, 14); g.bezierCurveTo(-18, 56 * k + 12, 26, 56 * k + 10, 46, 12); g.stroke();   // lower lid
  g.lineWidth = 4; g.strokeStyle = 'rgba(80,30,50,.5)'; g.beginPath(); g.moveTo(-34, -30 * k - 22); g.bezierCurveTo(-10, -72 * k - 24, 30, -78 * k - 20, 56, -20 * k - 14); g.stroke();   // crease
  g.restore();
}
function drawBrow(g, c, side) {
  const B = c.brow || {}, id = c.id || 'kai', a = B.ang ?? 0, r = B.raise ?? 0, turn = c.turn || 0, th = id === 'man' ? 1.5 : id === 'girl' ? .7 : 1;
  const ix = 30 + turn * 16, iy = -62 + r - a * 26, ox = 108 + turn * 14, oy = -74 + r + a * 20 + (id === 'girl' ? 8 : 0);
  g.save(); g.scale(side, 1); const col = c.pow > .5 ? '#7A4A00' : id === 'kai' ? '#0C1554' : id === 'girl' ? '#2B1512' : '#08080F';
  g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(ix, iy); g.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) - 12, ox, oy); g.lineWidth = 15 * th; g.stroke();
  g.beginPath(); g.moveTo((ix + ox) / 2, Math.min(iy, oy) - 8); g.quadraticCurveTo((ix * .3 + ox * .7), Math.min(iy, oy) - 10, ox, oy); g.lineWidth = 8 * th; g.stroke(); g.restore();
}
function drawMouth(g, c) {
  const M = c.mouth || {}, id = c.id || 'kai', open = M.open ?? 0, curve = M.curve ?? .5, w = (M.w ?? 30) * (id === 'girl' ? .8 : 1), y0 = 138, turn = c.turn || 0;
  g.save(); g.translate(turn * 14, y0); g.lineJoin = 'round'; g.lineCap = 'round';
  const cy = -curve * 13, lipc = id === 'girl' ? '#C93A55' : INK;
  if (open < .04) { g.strokeStyle = lipc; g.lineWidth = id === 'girl' ? 8 : 6; g.beginPath(); g.moveTo(-w, cy); g.quadraticCurveTo(0, cy + 8 + curve * 26, w, cy); g.stroke(); if (curve > .55) { g.lineWidth = 4; g.beginPath(); g.moveTo(w, cy); g.lineTo(w + 8, cy - 8); g.stroke(); } g.restore(); return; }
  const ww = w * (M.wide ?? 1) * (1 + open * .1), depth = open * (M.h ?? 62);
  g.beginPath(); g.moveTo(-ww, cy); g.quadraticCurveTo(0, cy + 6 + curve * 8, ww, cy); g.bezierCurveTo(ww * .85, cy + depth * 1.3, -ww * .85, cy + depth * 1.3, -ww, cy); g.closePath();
  g.fillStyle = '#5A0F22'; g.fill(); g.save(); g.clip();
  if (M.teeth !== false) { g.fillStyle = '#fff'; g.fillRect(-ww, cy - 4, ww * 2, 15 + open * 8); }
  g.fillStyle = '#FF6F86'; g.beginPath(); g.ellipse(0, cy + depth * 1.05, ww * .62, depth * .5, 0, 0, TAU); g.fill(); g.restore();
  g.lineWidth = 6; g.strokeStyle = lipc; g.stroke(); g.restore();
}
function drawNose(g, c) { const turn = c.turn || 0; g.save(); g.translate(turn * 22, 0); g.lineCap = 'round'; g.lineJoin = 'round'; const id = c.id || 'kai'; g.strokeStyle = SKIN[id][2]; g.lineWidth = 5; g.beginPath(); g.moveTo(-3, 88); g.quadraticCurveTo(4, 98, 12, 92); g.stroke(); if (id === 'man') { g.beginPath(); g.moveTo(-8, 30); g.quadraticCurveTo(-14, 70, -6, 88); g.stroke(); } g.restore(); }
function hairColors(c) { const id = c.id || 'kai'; const a = HAIR[id], p = c.pow || 0; if (p <= 0) return a; return [A.mixc(a[0], HAIR.gold[0], p), A.mixc(a[1], HAIR.gold[1], p), A.mixc(a[2], HAIR.gold[2], p)]; }

// hair (kai: spiky hero, girl: long drama heroine, man: short swept)
function hairBack(g, c) {
  const id = c.id || 'kai', t = c.t || 0, p = c.pow || 0, hc = hairColors(c), sway = (i, a = 1) => Math.sin(t * (2.1 + p * 3) + i * 1.3) * 7 * a * (1 + p * 2.2);
  g.lineJoin = 'round';
  if (id === 'kai') {
    const N = 9; for (let i = 0; i < N; i++) {
      const ang = PI + (i + .5) / N * PI, r0 = 132, rt = (285 + 90 * hash(i * 1.7)) * (1 + p * .34), ta = ang + (i - 4) * .02 - .06 + sway(i) * .006 * 6;
      const ax = Math.cos(ang - .23) * r0, ay = Math.sin(ang - .23) * r0 - 6, bx = Math.cos(ang + .23) * r0, by = Math.sin(ang + .23) * r0 - 6, tx = Math.cos(ta) * rt + sway(i, 1.2), ty = Math.sin(ta) * rt * .96 - 6 - p * 30;
      g.beginPath(); spikePath(g, ax, ay, bx, by, tx, ty, .34 * (i % 2 ? 1 : -1)); g.fillStyle = hc[1]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    }
  } else if (id === 'girl') {
    g.beginPath(); g.moveTo(-150, -40); g.bezierCurveTo(-210, 100, -230, 380, -190, 700 + sway(1, 6) * 4); g.lineTo(190 + sway(2, 6), 700); g.bezierCurveTo(230, 380, 210, 100, 150, -40); g.bezierCurveTo(120, -200, -120, -200, -150, -40); g.closePath();
    g.fillStyle = hc[1]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  } else {
    const N = 7; for (let i = 0; i < N; i++) { const ang = PI + (i + .5) / N * PI, r0 = 140, rt = 190 + 40 * hash(i * 3.3), ta = ang - .07;
      g.beginPath(); spikePath(g, Math.cos(ang - .3) * r0, Math.sin(ang - .3) * r0, Math.cos(ang + .3) * r0, Math.sin(ang + .3) * r0, Math.cos(ta) * rt + sway(i, .6), Math.sin(ta) * rt, .3); g.fillStyle = hc[1]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); }
  }
}
function hairFront(g, c) {
  const id = c.id || 'kai', t = c.t || 0, p = c.pow || 0, hc = hairColors(c), sw = (i, a = 1) => Math.sin(t * (2.3 + p * 3) + i * 1.7) * 5 * a * (1 + p * 2), skin = SKIN[id];
  g.lineJoin = 'round'; g.lineCap = 'round';
  // cap
  const capPath = () => { g.beginPath(); g.moveTo(-152, 50); g.bezierCurveTo(-176, -70, -110, -200, 0, -204); g.bezierCurveTo(110, -200, 176, -70, 152, 50); g.lineTo(140, -30); g.bezierCurveTo(90, -60, -90, -60, -140, -30); g.closePath(); };
  let locks;
  if (id === 'kai') locks = [[-118, -72, 64, -158, 110, .3], [-70, -86, 68, -104, 12, -.2], [-24, -92, 66, -34, 66, .25], [24, -92, 66, 38, 8, -.25], [70, -86, 66, 104, 16, .25], [118, -72, 64, 160, 112, -.3]];
  else if (id === 'girl') locks = [[-112, -80, 80, -170, 240, .1], [-58, -92, 78, -52, 96, .2], [-4, -100, 70, -6, 10, 0], [50, -92, 78, 46, 92, -.2], [108, -80, 80, 168, 244, -.1]];
  else locks = [[-108, -74, 70, -140, 40, .3], [-54, -90, 70, -66, -30, -.2], [0, -96, 70, 12, -44, .2], [54, -90, 70, 86, -26, -.2], [108, -74, 70, 142, 44, -.3]];
  const L = locks.map((l, i) => { const [bx, by, w, tx, ty, bend] = l, ext = (id === 'kai' ? 1 + p * .15 : 1); return { ax: bx - w / 2, ay: by, bx: bx + w / 2, by, tx: tx + sw(i, 1.4), ty: ty * ext + sw(i + 4, 1) - p * 12, bend, i }; });
  // forehead shadow (skin shade) under the bangs
  g.save(); g.beginPath(); g.moveTo(-140, -200); g.lineTo(140, -200); g.lineTo(140, 200); g.lineTo(-140, 200); g.closePath(); g.restore();
  g.save(); g.translate(5, 20); g.fillStyle = skin[1]; g.globalAlpha = .95; g.beginPath(); L.forEach(l => spikePath(g, l.ax, l.ay, l.bx, l.by, l.tx, l.ty, l.bend)); g.fill(); g.restore();
  // cap
  capPath(); g.fillStyle = hc[0]; g.fill();
  g.save(); capPath(); g.clip();
  g.fillStyle = hc[1]; g.beginPath(); g.moveTo(40, -210); g.bezierCurveTo(130, -150, 190, -60, 160, 60); g.lineTo(60, 10); g.bezierCurveTo(100, -60, 90, -130, 40, -210); g.closePath(); g.fill();
  g.globalAlpha = .75; g.strokeStyle = hc[2]; g.lineWidth = 20; g.beginPath(); g.ellipse(-6, -84, 124, 84, 0, PI * 1.13, PI * 1.55); g.stroke(); g.lineWidth = 10; g.beginPath(); g.ellipse(-6, -84, 124, 84, 0, PI * 1.62, PI * 1.84); g.stroke(); g.globalAlpha = 1;
  g.restore(); capPath(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  // locks
  L.forEach(l => {
    g.beginPath(); spikePath(g, l.ax, l.ay - 14, l.bx, l.by - 14, l.tx, l.ty, l.bend); g.fillStyle = hc[0]; g.fill();
    g.save(); g.clip(); g.fillStyle = hc[1]; g.beginPath(); g.moveTo(l.tx, l.ty); g.lineTo(l.bx + 6, l.by); g.lineTo(lerp(l.ax, l.bx, .38), l.ay - 20); g.closePath(); g.globalAlpha = .95; g.fill(); g.globalAlpha = .8; g.strokeStyle = hc[2]; g.lineWidth = 8; g.beginPath(); g.moveTo(lerp(l.ax, l.bx, .25), l.ay - 6); g.quadraticCurveTo(lerp(l.ax, l.tx, .55), lerp(l.ay, l.ty, .3), lerp(l.ax, l.tx, .62), lerp(l.ay, l.ty, .55)); g.stroke(); g.restore();
    g.beginPath(); spikePath(g, l.ax, l.ay - 14, l.bx, l.by - 14, l.tx, l.ty, l.bend); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  });
  if (id === 'kai') {   // ahoge antenna
    const a = sw(9, 2.2); g.beginPath(); spikePath(g, -14, -196, 20, -196, 46 + a * 1.6, -336 - p * 40, .7); g.fillStyle = hc[0]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(8, -200); g.quadraticCurveTo(22 + a, -260, 40 + a, -312); g.lineWidth = 6; g.strokeStyle = hc[2]; g.stroke();
  }
  if (id === 'girl') {   // flowing side strands in front of shoulders handled by body; add a hair-clip
    g.fillStyle = '#FFC24A'; g.beginPath(); g.arc(-96, -96, 14, 0, TAU); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  }
}
// full head. c = {id,t,eyes:{k,style,lx,ly,blink,pupil,iris,scale,spark},mouth:{open,curve,w,h,teeth,wide},brow:{ang,raise},turn,blush,sweat,tear,anger,pow,glow,stubble}
function drawHead(g, c) {
  const id = c.id || 'kai', skin = SKIN[id], jaw = id === 'man' ? 1.08 : id === 'girl' ? .92 : 1;
  hairBack(g, c);
  // neck shadow stub
  g.fillStyle = skin[0]; g.fillRect(-44, 120, 88, 100); g.fillStyle = skin[1]; g.fillRect(-44, 120, 88, 50);
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(-44, 130); g.lineTo(-46, 220); g.moveTo(44, 130); g.lineTo(46, 220); g.stroke();
  // ears
  [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 140 * jaw, 34, 21, 32, s * .15, 0, TAU); g.fillStyle = skin[0]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.strokeStyle = skin[2]; g.lineWidth = 4; g.beginPath(); g.arc(s * 140 * jaw, 36, 9, PI * .6, PI * 1.5, s < 0); g.stroke(); });
  // face
  const P = [[-134 * jaw, -84], [-142 * jaw, -20], [-136 * jaw, 40], [-110 * jaw, 104], [-62 * jaw, 156], [0, id === 'man' ? 184 : 178], [62 * jaw, 156], [110 * jaw, 104], [136 * jaw, 40], [142 * jaw, -20], [134 * jaw, -84], [90, -122], [0, -136], [-90, -122]];
  A.blob(g, P); g.fillStyle = skin[0]; g.fill(); g.save(); g.clip();
  g.fillStyle = skin[1]; g.beginPath(); g.moveTo(96, -100); g.lineTo(190, -100); g.lineTo(190, 240); g.lineTo(0, 240); g.bezierCurveTo(70, 190, 120, 110, 96, -100); g.closePath(); g.globalAlpha = .55; g.fill(); g.globalAlpha = 1;   // right-side cel shade
  g.fillStyle = skin[1]; g.beginPath(); g.ellipse(0, 190, 90, 40, 0, 0, TAU); g.globalAlpha = .6; g.fill(); g.globalAlpha = 1;   // under-chin
  if (c.blush) { g.globalAlpha = clamp(c.blush) * .8; [-1, 1].forEach(s => { g.fillStyle = rad(g, s * 92, 88, 4, 44, [[0, 'rgba(255,90,120,.9)'], [1, 'rgba(255,90,120,0)']]); g.fillRect(s * 92 - 50, 40, 100, 100); g.strokeStyle = 'rgba(255,60,100,.8)'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(s * 70 + i * s * 16, 96); g.lineTo(s * 84 + i * s * 16, 74); g.stroke(); } }); g.globalAlpha = 1; }
  if (id === 'man' && c.stubble !== false) { g.fillStyle = 'rgba(30,20,30,.32)'; for (let j = 0; j < 9; j++) for (let i = 0; i < 20; i++) { const x = -70 + i * 7 + (j % 2) * 3.5, y = 108 + j * 8; if (Math.hypot(x / 90, (y - 150) / 60) < 1 && y > 96) { g.beginPath(); g.arc(x, y, 2 - j * .12, 0, TAU); g.fill(); } } }
  g.restore(); A.blob(g, P); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  drawNose(g, c); drawEye(g, c, -1); drawEye(g, c, 1); drawBrow(g, c, -1); drawBrow(g, c, 1); drawMouth(g, c);
  if (c.tear) { const tk = c.tear; [1].forEach(s => { const ex = 70 * s, ty = 74 + tk * 70; g.fillStyle = 'rgba(190,235,255,.95)'; g.beginPath(); g.moveTo(ex, 70); g.bezierCurveTo(ex + 12, 96, ex + 14, ty, ex, ty + 12); g.bezierCurveTo(ex - 14, ty, ex - 12, 96, ex, 70); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(80,140,200,.9)'; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - 4, ty - 8, 3, 6, 0, 0, TAU); g.fill(); }); }
  hairFront(g, c);
  if (c.sweat) { const k = c.sweat, sx = 128, sy = -56 + k * 34; g.save(); g.translate(sx, sy); g.scale(.9 + .25 * k, .9 + .25 * k); g.fillStyle = 'rgba(170,225,255,.95)'; g.beginPath(); g.moveTo(0, -34); g.bezierCurveTo(24, -2, 24, 22, 0, 26); g.bezierCurveTo(-24, 22, -24, -2, 0, -34); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-8, 4, 5, 10, .2, 0, TAU); g.fill(); g.restore(); }
  if (c.anger) { g.save(); g.translate(-150, -150); g.rotate(.2); g.strokeStyle = '#FF2D3D'; g.lineWidth = 9; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.quadraticCurveTo(Math.cos(a + .5) * 22, Math.sin(a + .5) * 22, Math.cos(a) * 38, Math.sin(a) * 38); g.stroke(); } g.restore(); }
}
A.scene({ name: 's4_series', start: 12.0, end: 16.11, draw(ctx, s) {
  ctx.fillStyle = '#7a5aa0'; ctx.fillRect(0, 0, W, H);
  const t = amb();
  ctx.save(); ctx.translate(300, 500); ctx.scale(1.1, 1.1); drawHead(ctx, { id: 'kai', t, eyes: { style: 'sparkle', lx: 0, ly: -.3 }, mouth: { open: .7 }, brow: { ang: 0, raise: -8 }, blush: 1, sweat: 1 }); ctx.restore();
  ctx.save(); ctx.translate(780, 500); ctx.scale(1.1, 1.1); drawHead(ctx, { id: 'kai', t, pow: 1, eyes: { style: 'fire', k: .8 }, mouth: { open: .9, w: 38, h: 70 }, brow: { ang: 1, raise: 4 }, anger: 1 }); ctx.restore();
  ctx.save(); ctx.translate(300, 1100); ctx.scale(1.1, 1.1); drawHead(ctx, { id: 'girl', t, eyes: { style: 'sparkle', lx: .4 }, mouth: { open: 0, curve: -.3 }, brow: { ang: -.5, raise: 0 }, tear: .8 }); ctx.restore();
  ctx.save(); ctx.translate(780, 1100); ctx.scale(1.1, 1.1); drawHead(ctx, { id: 'man', t, eyes: { style: 'normal', k: .8, lx: -.5 }, mouth: { open: 0, curve: -.2 }, brow: { ang: .8 } }); ctx.restore();
}});
})();
