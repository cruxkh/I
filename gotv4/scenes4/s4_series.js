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
function limb(g, p0, p1, p2, w0, w1, fill, line = INK, lw = 6, shade, open = false) {
  const L = [], R = [], N = 14; for (let i = 0; i <= N; i++) { const k = i / N, x = (1 - k) * (1 - k) * p0[0] + 2 * (1 - k) * k * p1[0] + k * k * p2[0], y = (1 - k) * (1 - k) * p0[1] + 2 * (1 - k) * k * p1[1] + k * k * p2[1];
    const dx = 2 * (1 - k) * (p1[0] - p0[0]) + 2 * k * (p2[0] - p1[0]), dy = 2 * (1 - k) * (p1[1] - p0[1]) + 2 * k * (p2[1] - p1[1]), l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = lerp(w0, w1, k) / 2; L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); }
  g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
  g.fillStyle = fill; g.fill(); if (shade) { g.save(); g.clip(); g.beginPath(); R.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) { const q = [lerp(R[i][0], L[i][0], .42), lerp(R[i][1], L[i][1], .42)]; g.lineTo(q[0], q[1]); } g.closePath(); g.fillStyle = shade; g.fill(); g.restore(); }
  g.lineWidth = lw; g.strokeStyle = line; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
  if (open) { L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineTo(R[N][0], R[N][1]); g.moveTo(R[0][0], R[0][1]); for (let i = 1; i <= N; i++) g.lineTo(R[i][0], R[i][1]); g.stroke(); return; }
  L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.stroke();
}

// ---------------------------------------------------------------- ANIME FACES (cel shaded, ink lines).  Local units: head width = 300, origin = head centre, y down.
const SKIN = { kai: ['#FFDCC0', '#F4B592', '#D98A6B'], girl: ['#FFE6D8', '#F8BFA8', '#E3927E'], man: ['#EFC6A2', '#D9A07A', '#B77C59'] };
const HAIR = { kai: ['#1B2C8E', '#0C1554', '#63A0FF'], girl: ['#4B2A22', '#26120F', '#C27A44'], man: ['#181826', '#08080F', '#5B6BA6'], gold: ['#FFC93A', '#E58A17', '#FFF7B8'] };
const IRIS = { kai: ['#5A1D00', '#C25A00', '#FFB01F', '#FFEE9A'], girl: ['#0E4A45', '#1F8A78', '#5FD0A8', '#D6FFE6'], man: ['#1A0F0A', '#4B2A17', '#8A5A2E', '#D8A56A'] };
function spikePath(g, ax, ay, bx, by, tx, ty, bend = .25) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = tx - mx, dy = ty - my, nx = -dy, ny = dx;
  g.moveTo(ax, ay); g.quadraticCurveTo(ax + dx * .55 + nx * bend * .35, ay + dy * .55 + ny * bend * .35, tx, ty); g.quadraticCurveTo(bx + dx * .5 + nx * bend * .1, by + dy * .5 + ny * bend * .1, bx, by); g.closePath();
}
function eyePath(g, k, lower = 1) { g.beginPath(); g.moveTo(-46, 10); g.bezierCurveTo(-32, -60 * k - 6, 30, -70 * k - 6, 58, -3); g.bezierCurveTo(40, 40 * k * lower + 9, -18, 48 * k * lower + 9, -46, 10); g.closePath(); }
function drawEye(g, c, side) {
  const E = c.eyes || {}, k = clamp((E.k ?? 1) * (1 - (E.blink || 0)), 0.02, 1.25), st = E.style || 'normal', id = c.id || 'kai', ic = IRIS[id];
  const ex = 72 + (id === 'man' ? -4 : 0), ey = 32, turn = c.turn || 0, sc = (id === 'man' ? .92 : id === 'girl' ? 1.12 : 1.1) * (E.scale || 1);
  g.save(); g.translate(side * ex + turn * 20 * (1 - .25 * side * Math.sign(turn || 1)), ey); g.scale(side * sc, sc);
  if (st === 'shut' || k < .06) { g.lineWidth = 12; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46, 12); g.quadraticCurveTo(6, 30, 58, 2); g.stroke(); g.beginPath(); g.moveTo(56, 2); g.lineTo(72, -12); g.stroke(); g.restore(); return; }
  if (st === 'happy') { g.lineWidth = 13; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.moveTo(-44, 22); g.quadraticCurveTo(6, -46, 58, 18); g.stroke(); g.beginPath(); g.moveTo(56, 16); g.lineTo(72, 4); g.stroke(); g.restore(); return; }
  // eye white
  eyePath(g, k); g.fillStyle = '#F7F9FF'; g.fill(); g.save(); g.clip();
  const ir = (E.iris || 1) * (st === 'wide' ? .8 : 1), px = (E.lx || 0) * 12, py = (E.ly || 0) * 10, icx = 5 + px, icy = 3 + py + (1 - k) * -8;
  // iris
  g.fillStyle = lin(g, 0, icy - 52 * ir, 0, icy + 54 * ir, [[0, ic[0]], [.32, ic[1]], [.72, ic[2]], [1, ic[3]]]);
  g.beginPath(); g.ellipse(icx, icy, 38 * ir, 51 * ir, 0, 0, TAU); g.fill();
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
  g.lineWidth = 3.5; g.strokeStyle = 'rgba(30,10,30,.55)'; g.beginPath(); g.moveTo(-30, 20); g.bezierCurveTo(-10, 44 * k + 12, 26, 44 * k + 10, 46, 12); g.stroke();   // lower lid
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
  const mp = () => { g.beginPath(); g.moveTo(-ww, cy); g.quadraticCurveTo(0, cy + 6 + curve * 8, ww, cy); g.bezierCurveTo(ww * .85, cy + depth * 1.3, -ww * .85, cy + depth * 1.3, -ww, cy); g.closePath(); }; mp();
  g.fillStyle = '#5A0F22'; g.fill(); g.save(); g.clip();
  if (M.teeth !== false) { g.fillStyle = '#fff'; g.fillRect(-ww, cy - 4, ww * 2, 15 + open * 8); }
  g.fillStyle = '#FF6F86'; g.beginPath(); g.ellipse(0, cy + depth * 1.05, ww * .62, depth * .5, 0, 0, TAU); g.fill(); g.restore();
  mp(); g.lineWidth = 6; g.strokeStyle = lipc; g.stroke(); g.restore();
}
function drawNose(g, c) { const turn = c.turn || 0; g.save(); g.translate(turn * 22, 0); g.lineCap = 'round'; g.lineJoin = 'round'; const id = c.id || 'kai'; g.strokeStyle = SKIN[id][2]; g.lineWidth = 5; g.beginPath(); g.moveTo(-3, 88); g.quadraticCurveTo(4, 98, 12, 92); g.stroke(); if (id === 'man') { g.beginPath(); g.moveTo(-8, 30); g.quadraticCurveTo(-14, 70, -6, 88); g.stroke(); } g.restore(); }
function hairColors(c) { const id = c.id || 'kai'; const a = HAIR[id], p = smooth(.3, .75, c.pow || 0); if (p <= 0) return a; return [A.mixc(a[0], HAIR.gold[0], p), A.mixc(a[1], HAIR.gold[1], p), A.mixc(a[2], HAIR.gold[2], p)]; }

// hair (kai: spiky hero, girl: long drama heroine, man: short swept)
function hairBack(g, c) {
  const id = c.id || 'kai', t = c.t || 0, p = c.pow || 0, hc = hairColors(c), sway = (i, a = 1) => Math.sin(t * (2.1 + p * 3) + i * 1.3) * 7 * a * (1 + p * 2.2);
  g.lineJoin = 'round';
  if (id === 'kai') {
    const N = 9; for (let i = 0; i < N; i++) {
      const ang = PI + (i + .5) / N * PI, r0 = 132, rt = (270 + 80 * hash(i * 1.7)) * (1 + p * .16), ta = ang + (i - 4) * .02 - .06 + sway(i) * .006 * 6;
      const ax = Math.cos(ang - .3) * r0, ay = Math.sin(ang - .3) * r0 - 6, bx = Math.cos(ang + .3) * r0, by = Math.sin(ang + .3) * r0 - 6, tx = Math.cos(ta) * rt + sway(i, 1.2), ty = Math.sin(ta) * rt * .96 - 6 - p * 30;
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
  const capPath = () => { g.beginPath(); g.moveTo(-152, 50); g.bezierCurveTo(-176, -70, -110, -200, 0, -204); g.bezierCurveTo(110, -200, 176, -70, 152, 50); g.lineTo(140, -70); g.bezierCurveTo(90, -100, -90, -100, -140, -70); g.closePath(); };
  let locks;
  if (id === 'kai') locks = [[-118, -72, 64, -160, 112, .3], [-70, -86, 68, -94, -30, -.2], [-24, -92, 62, -16, 40, .25], [24, -92, 62, 24, -2, -.25], [70, -86, 66, 98, -30, .25], [118, -72, 64, 162, 114, -.3]];
  else if (id === 'girl') locks = [[-112, -80, 80, -176, 250, .1], [-58, -92, 78, -44, 24, .2], [-4, -100, 70, -6, -10, 0], [50, -92, 78, 40, 20, -.2], [108, -80, 80, 176, 250, -.1]];
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
  hairBack(g, c); if (c.beforeFace) c.beforeFace(g, c);
  if (!c.beforeFace) { g.fillStyle = skin[0]; g.fillRect(-44, 120, 88, 100); g.fillStyle = skin[1]; g.fillRect(-44, 120, 88, 50); }
  else { g.fillStyle = skin[0]; g.fillRect(-46, 100, 92, 90); g.fillStyle = skin[1]; g.fillRect(-46, 100, 92, 70); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(-46, 130); g.lineTo(-46, 190); g.moveTo(46, 130); g.lineTo(46, 190); g.stroke(); }
  // ears
  [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 140 * jaw, 34, 21, 32, s * .15, 0, TAU); g.fillStyle = skin[0]; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.strokeStyle = skin[2]; g.lineWidth = 4; g.beginPath(); g.arc(s * 140 * jaw, 36, 9, PI * .6, PI * 1.5, s < 0); g.stroke(); });
  // face
  const P = [[-134 * jaw, -84], [-142 * jaw, -20], [-136 * jaw, 40], [-102 * jaw, 106], [-50 * jaw, 158], [0, id === 'man' ? 184 : 178], [50 * jaw, 158], [102 * jaw, 106], [136 * jaw, 40], [142 * jaw, -20], [134 * jaw, -84], [90, -122], [0, -136], [-90, -122]];
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

// ---------------------------------------------------------------- KAI: hero body, poses, aura
function fist(g, x, y, s, rot, c = {}) {   // clenched fist (front view) with knuckles
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); const sk = SKIN.kai;
  g.beginPath(); g.moveTo(-46, -30); g.bezierCurveTo(-52, -58, 44, -60, 50, -28); g.bezierCurveTo(60, 8, 44, 52, 4, 58); g.bezierCurveTo(-40, 56, -60, 12, -46, -30); g.closePath();
  g.fillStyle = sk[0]; g.fill(); g.save(); g.clip(); g.fillStyle = sk[1]; g.fillRect(-10, -60, 80, 130); g.fillStyle = sk[0]; g.fillRect(-70, -60, 60, 50); g.restore();
  g.lineWidth = 6; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
  g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-28 + i * 26, -34); g.quadraticCurveTo(-24 + i * 26, -8, -30 + i * 26, 12); g.stroke(); }
  g.beginPath(); g.moveTo(-42, 26); g.quadraticCurveTo(-8, 44, 34, 30); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-30, -42, 12, 5, -.2, 0, TAU); g.fill();
  g.restore();
}
function ribbon(g, pts, w0, w1, fill, shade, lw = 6) {
  const L = [], R = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (pts.length - 1)) / 2; L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]); }
  g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.fillStyle = fill; g.fill();
  g.save(); g.clip(); g.fillStyle = shade; g.beginPath(); R.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo((R[i][0] + L[i][0]) / 2, (R[i][1] + L[i][1]) / 2); g.closePath(); g.fill(); g.restore();
  g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.stroke();
}
const POSES = {
  idle: { L: [[-214, 300], [-282, 520], [-250, 730]], R: [[214, 300], [282, 520], [250, 730]] },
  awe: { L: [[-214, 300], [-300, 500], [-170, 460]], R: [[214, 300], [300, 500], [170, 460]] },
  power: { L: [[-214, 300], [-340, 470], [-214, 640]], R: [[214, 300], [340, 470], [214, 640]] },
  pump: { L: [[-214, 300], [-300, 520], [-238, 700]], R: [[214, 300], [372, 340], [350, 90]] },
};
function kaiBody(g, c) {
  const t = c.t || 0, p = c.pow || 0, pose = POSES[c.pose || 'idle'], tr = p * 5, sk = SKIN.kai;
  const J0 = '#20329F', J1 = '#121D70', J2 = '#6FA8FF', GOLD = '#FFC24A', GOLD2 = '#E88A12';
  // scarf tail (behind)
  const tail = []; for (let i = 0; i < 10; i++) { const k = i / 9; tail.push([110 + i * (52 + p * 22), 200 + i * 6 - p * i * 20 + Math.sin(t * 3.2 + i * .7) * (6 + p * 14) * (0.3 + k)]); }
  ribbon(g, tail, 52, 26, GOLD, GOLD2);
  // torso
  g.beginPath(); g.moveTo(-66, 176); g.bezierCurveTo(-150, 190, -222, 200, -246, 300); g.bezierCurveTo(-256, 420, -200, 700, -190, 940); g.lineTo(190, 940); g.bezierCurveTo(200, 700, 256, 420, 246, 300); g.bezierCurveTo(222, 200, 150, 190, 66, 176); g.closePath();
  g.fillStyle = J0; g.fill(); g.save(); g.clip(); g.fillStyle = J1; g.beginPath(); g.moveTo(60, 176); g.lineTo(290, 300); g.lineTo(290, 960); g.lineTo(120, 960); g.quadraticCurveTo(210, 600, 60, 176); g.fill();
  g.strokeStyle = J2; g.lineWidth = 12; g.globalAlpha = .7; g.beginPath(); g.moveTo(-256, 340); g.lineTo(-228, 900); g.stroke(); g.globalAlpha = 1; g.restore();
  g.lineWidth = 7; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
  // shirt V + emblem
  g.beginPath(); g.moveTo(-74, 178); g.lineTo(74, 178); g.lineTo(0, 500); g.closePath(); g.fillStyle = '#F3F6FF'; g.fill(); g.save(); g.clip(); g.fillStyle = '#C9D6F5'; g.beginPath(); g.moveTo(10, 170); g.lineTo(90, 170); g.lineTo(0, 520); g.fill(); g.restore(); g.lineWidth = 6; g.stroke();
  g.strokeStyle = GOLD; g.lineWidth = 10; g.beginPath(); g.moveTo(-74, 178); g.lineTo(-6, 500); g.moveTo(74, 178); g.lineTo(6, 500); g.stroke();
  g.save(); g.translate(0, 610); g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fillStyle = lin(g, 0, -46, 0, 46, [[0, '#FFF3C4'], [.5, GOLD], [1, GOLD2]]); g.fill(); g.beginPath(); g.moveTo(-14, -26); g.lineTo(28, 0); g.lineTo(-14, 26); g.closePath(); g.fillStyle = INK; g.fill(); g.restore();
  // arms
  const drawArm = (side) => {
    const P = pose[side === -1 ? 'L' : 'R'], jt = (i) => [P[i][0] + Math.sin(t * 40 + i + side) * tr, P[i][1] + Math.cos(t * 37 + i) * tr];
    const a = jt(0), b = jt(1), h = jt(2);
    limb(g, a, b, h, 100, 80, J0, INK, 7, J1, true);
    // cuff
    const dx = h[0] - b[0], dy = h[1] - b[1], l = Math.hypot(dx, dy) || 1; g.save(); g.translate(h[0] - dx / l * 34, h[1] - dy / l * 34); g.rotate(Math.atan2(dy, dx) + PI / 2); g.beginPath(); g.roundRect(-48, -14, 96, 30, 10); g.fillStyle = GOLD; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore();
    fist(g, h[0] + dx / l * 22, h[1] + dy / l * 22, 1.12 * (c.fistS || 1) * (side === 1 && c.pose === 'pump' ? (c.pumpS || 1) : 1), Math.atan2(dy, dx) - PI / 2 + (side === 1 ? .1 : -.1), c);
  };
  drawArm(-1); drawArm(1);
  // scarf wrap (front)
  const wrap = []; for (let i = 0; i <= 12; i++) { const a = PI * (.1 + .8 * i / 12); wrap.push([-Math.cos(a) * 128, 150 + Math.sin(a) * 92]); } ribbon(g, wrap, 58, 58, GOLD, GOLD2, 7);
  g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-96, 176); g.quadraticCurveTo(-44, 222, 0, 226); g.stroke();
}
// full hero: (x,y)=head centre, s=scale (1 => head width 300)
function drawKai(ctx, x, y, s, c = {}) {
  ctx.save(); ctx.translate(x, y); if (c.rot) ctx.rotate(c.rot); ctx.scale(s * (c.flip ? -1 : 1), s);
  const cc = Object.assign({}, c); if (c.body !== false) cc.beforeFace = kaiBody; drawHead(ctx, cc); ctx.restore();
}
// gold aura: flame tongues behind the hero
function aura(ctx, cx, cy, sc, t, k, o = {}) {
  if (k <= 0) return; const N = o.n || 16, hi = o.hi || '#FFF7C2', mid = o.mid || '#FFC93A', lo = o.lo || '#FF7A1A';
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  add(ctx, () => { ctx.fillStyle = rad(ctx, 0, 60, 30, 520 * k, [[0, 'rgba(255,240,160,.85)'], [.5, 'rgba(255,170,40,.32)'], [1, 'rgba(255,120,0,0)']]); ctx.fillRect(-620, -620, 1240, 1400); });
  for (let layer = 0; layer < 3; layer++) {
    const col = layer === 0 ? lo : layer === 1 ? mid : hi, sz = layer === 0 ? 1 : layer === 1 ? .78 : .5;
    ctx.fillStyle = col; ctx.globalAlpha = (layer === 0 ? .55 : layer === 1 ? .7 : .85) * clamp(k * 1.3);
    for (let i = 0; i < N; i++) {
      const u = (i + .5) / N, xb = (u - .5) * 640 * sz, hh = (330 + 380 * hash(i * 2.3 + layer)) * k * sz * (1 - Math.abs(u - .5) * .9) * (1 + .18 * Math.sin(t * 9 + i * 1.9 + layer)), w = 46 + 34 * hash(i + 5.1);
      const sway = Math.sin(t * 6 + i * 1.3) * 26 * k + (u - .5) * 120;
      ctx.beginPath(); spikePath(ctx, xb - w, 420, xb + w, 420, xb + sway, 420 - hh, (i % 2 ? .5 : -.5)); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.restore();
}

// ---------------------------------------------------------------- shared: titles, wipes
function bigTitle(ctx, txt, x, y, size, u, o = {}) {
  if (u < 0) return; const pop = eob(u / .15), sc = lerp(o.from ?? 1.9, 1, pop) * (o.sc ?? 1), fade = o.out !== undefined ? clamp(1 - o.out) : 1; if (fade <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot || 0) * (1 - pop * .5)); ctx.scale(sc, sc); ctx.globalAlpha = clamp(u / .03) * fade;
  ctx.font = `900 ${size}px ${o.font || FONT}`; ctx.direction = o.dir || 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const g0 = o.grad || V.GOLD_GRAD;
  ctx.shadowColor = o.glow || 'rgba(255,170,40,.7)'; ctx.shadowBlur = 40; ctx.lineWidth = size * .34; ctx.strokeStyle = o.halo || '#fff'; ctx.strokeText(txt, 0, 0); ctx.shadowColor = 'transparent';
  ctx.lineWidth = size * .25; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0);
  ctx.lineWidth = size * .12; ctx.strokeStyle = o.off || '#FF3D7A'; ctx.strokeText(txt, size * .045, size * .06); ctx.lineWidth = size * .25; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0);
  ctx.fillStyle = lin(ctx, 0, -size * .5, 0, size * .5, g0); ctx.fillText(txt, 0, 0);
  if (o.shine !== undefined && o.shine > -1 && o.shine < 2) { const w = ctx.measureText(txt).width, sx = lerp(-w * .8, w * .8, o.shine); ctx.fillStyle = lin(ctx, sx - 90, -size * .5, sx + 90, size * .5, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); ctx.fillText(txt, 0, 0); }
  ctx.restore();
}
// panel wipe: diagonal slabs that sweep across (progress k 0..1); returns nothing
function slabs(ctx, k, cols, ang = -.35, n = 5) {
  if (k <= 0 || k >= 1.0) return; ctx.save(); ctx.translate(540, 960); ctx.rotate(ang);
  for (let i = 0; i < n; i++) { const kk = clamp((k - i * .06) / .62), e = ease.inOut(kk), wd = 2600 / n + 30, x = lerp(-2100, 2100, e) - 0; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x - 2100 + 0, -1500 + i * (3000 / n), 2100 + 0, 3000 / n + 8); if (kk > 0 && kk < 1) { ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, -1500 + i * (3000 / n), 12, 3000 / n + 8); } }
  ctx.restore();
}

// ---------------------------------------------------------------- TURKISH WORLD
const roseSprite = () => lay('rose', 72, 72, g => { g.translate(36, 36); g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-34, 10, -30, -26, -8, -30); g.lineTo(0, -20); g.lineTo(8, -30); g.bezierCurveTo(30, -26, 34, 10, 0, 30); g.closePath(); g.fillStyle = lin(g, 0, -30, 0, 30, [[0, '#FF5A6E'], [1, '#B3122E']]); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.strokeStyle = 'rgba(255,200,210,.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-2, -12); g.quadraticCurveTo(-10, 4, -2, 20); g.stroke(); });
function rosePetals(ctx, t, o = {}) {
  const n = o.n || 24, sd = o.seed || 4; for (let i = 0; i < n; i++) {
    const h1 = hash(i * 4.3 + sd), h2 = hash(i * 9.1 + sd), h3 = hash(i * 2.7 + sd), z = .5 + h2 * 1.0, fall = (t * (110 + 130 * h1) * z + h3 * 2500) % 2500, x = ((h1 * 1300 - 110 + Math.sin(t * (.9 + h3) + i) * 110 * z - t * (70 + 40 * h2) * z) % 1300 + 1300) % 1300 - 110, y = fall - 300;
    const s = (14 + 26 * z) / 36, fl = Math.abs(Math.sin(t * (2 + h1 * 3) + i)); ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + h2 * 2) * (i % 2 ? 1 : -1) + i); ctx.scale(s, s * (.4 + .6 * fl)); ctx.globalAlpha = o.alpha ?? .95; ctx.drawImage(roseSprite(), -36, -36); ctx.restore(); }
}
function dome(g, x, by, r, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x - r, by); g.bezierCurveTo(x - r, by - r * 1.3, x + r, by - r * 1.3, x + r, by); g.closePath(); g.fill(); g.fillRect(x - 2, by - r * .98 - 22, 4, 24); g.beginPath(); g.arc(x, by - r * .98 - 24, 5, 0, TAU); g.fill(); g.fillRect(x - r * 1.02, by - 4, r * 2.04, 16); }
function minaret(g, x, by, h, col, w = 14) { g.fillStyle = col; g.fillRect(x - w / 2, by - h, w, h); g.fillRect(x - w * 1.05, by - h * .78, w * 2.1, 9); g.fillRect(x - w * .8, by - h * .78 - 4, w * 1.6, 5); g.beginPath(); g.moveTo(x - w * .78, by - h); g.lineTo(x, by - h * 1.2); g.lineTo(x + w * .78, by - h); g.closePath(); g.fill(); g.fillRect(x - 1.5, by - h * 1.2 - 18, 3, 20); g.beginPath(); g.arc(x, by - h * 1.2 - 20, 4, 0, TAU); g.fill(); g.fillRect(x - w * .9, by - h, w * 1.8, 6); }
function skylineNear(g, w, base) {
  const col = '#2A1042'; g.fillStyle = col;
  // houses
  const r = rng(11); for (let x = -20; x < w; x += 26 + r() * 30) { const hh = 30 + r() * 60; g.fillRect(x, base - hh, 30 + r() * 26, hh + 40); }
  // Hagia-Sophia style cluster (left)
  dome(g, 300, base - 22, 132, col); dome(g, 132, base - 6, 72, col); dome(g, 468, base - 6, 72, col); g.fillRect(140, base - 90, 320, 100); dome(g, 214, base - 52, 60, col); dome(g, 386, base - 52, 60, col);
  minaret(g, 70, base + 10, 300, col); minaret(g, 528, base + 10, 300, col);
  // blue-mosque style cluster (right)
  dome(g, 800, base - 30, 104, col); dome(g, 700, base - 8, 56, col); dome(g, 900, base - 8, 56, col); dome(g, 800, base - 90, 0.01 + 0, col); g.fillRect(680, base - 60, 240, 80);
  minaret(g, 630, base + 10, 290, col); minaret(g, 970, base + 10, 290, col); minaret(g, 668, base + 10, 210, col, 12); minaret(g, 932, base + 10, 210, col, 12);
  // galata tower
  g.fillRect(1040, base - 210, 46, 230); g.beginPath(); g.moveTo(1030, base - 210); g.lineTo(1063, base - 300); g.lineTo(1096, base - 210); g.closePath(); g.fill(); g.fillRect(1030, base - 216, 66, 10);
  g.fillRect(0, base, w, 60);
  // warm windows
  g.fillStyle = 'rgba(255,200,110,.85)'; const r2 = rng(3); for (let i = 0; i < 110; i++) { const x = r2() * w, y = base - 8 - r2() * 60; g.fillRect(x, y, 4, 6); }
}
function skylineFar(g, w, base) { const col = '#8D3B78'; g.fillStyle = col; const r = rng(21); for (let x = -20; x < w; x += 20 + r() * 40) { const hh = 40 + r() * 80; g.fillRect(x, base - hh, 24 + r() * 30, hh + 30); }
  dome(g, 420, base - 30, 70, col); minaret(g, 350, base, 200, col, 10); minaret(g, 495, base, 200, col, 10); dome(g, 880, base - 20, 60, col); minaret(g, 930, base, 190, col, 10); minaret(g, 830, base, 170, col, 9); g.fillRect(0, base, w, 60); }
function turBG() {
  return lay('tur_bg', 1200, 800, (g) => {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#2B1256'], [.32, '#7C2C76'], [.6, '#FF6B55'], [.85, '#FFB24E'], [1, '#FFE49A']]); g.fillRect(0, 0, 1200, 800);
    // cel clouds
    const r = rng(33); for (let i = 0; i < 9; i++) { const cx = r() * 1200, cy = 120 + r() * 420, cw = 220 + r() * 300, ch = 26 + r() * 30, warm = cy / 560;
      g.fillStyle = A.mixc('#5A2A78', '#FF9A5C', clamp(warm)); g.beginPath(); g.ellipse(cx, cy, cw, ch, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx - cw * .3, cy - ch * .7, cw * .55, ch * .8, 0, 0, TAU); g.fill();
      g.fillStyle = A.mixc('#FFB070', '#FFF0B0', clamp(warm)); g.globalAlpha = .9; g.beginPath(); g.ellipse(cx, cy + ch * .55, cw * .96, ch * .34, 0, 0, PI); g.fill(); g.globalAlpha = 1; }
  });
}
function tulip(g, x, y, h, c1, c2, sway) {
  g.save(); g.translate(x, y); g.rotate(sway); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = INK; g.lineWidth = 20; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-14, -h * .5, 0, -h); g.stroke(); g.strokeStyle = '#4FBF5A'; g.lineWidth = 11; g.stroke();
  g.fillStyle = '#4FBF5A'; g.strokeStyle = INK; g.lineWidth = 5; [[-1, .1], [1, .06]].forEach(([s, k]) => { g.beginPath(); g.moveTo(0, -h * k); g.quadraticCurveTo(s * 90, -h * .3, s * 34, -h * .62); g.quadraticCurveTo(s * 34, -h * .3, 0, -h * k - 10); g.fill(); g.stroke(); });
  g.translate(0, -h); const r = h * .16;
  const cup = (dx, tilt, col) => { g.save(); g.translate(dx, 0); g.rotate(tilt); g.beginPath(); g.moveTo(-r * .9, 0); g.bezierCurveTo(-r * 1.2, -r * 1.2, -r * .5, -r * 2.2, 0, -r * 2.5); g.bezierCurveTo(r * .5, -r * 2.2, r * 1.2, -r * 1.2, r * .9, 0); g.bezierCurveTo(r * .5, r * .7, -r * .5, r * .7, -r * .9, 0); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore(); };
  cup(-r * .5, -.22, c2); cup(r * .5, .22, c2); cup(0, 0, c1);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-r * .36, -r * 1.3, r * .12, r * .55, .15, 0, TAU); g.fill(); g.restore();
}
function teaGlass(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  // saucer
  g.beginPath(); g.ellipse(0, 6, 128, 26, 0, 0, TAU); g.fillStyle = '#FFF3E6'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.ellipse(0, 4, 100, 16, 0, 0, TAU); g.strokeStyle = '#E8A020'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#C9302E'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.beginPath(); g.arc(Math.cos(a) * 112, 6 + Math.sin(a) * 20, 4, 0, TAU); g.fill(); }
  // glass
  const gp = () => { g.beginPath(); g.moveTo(-58, -250); g.bezierCurveTo(-60, -150, -34, -120, -34, -70); g.bezierCurveTo(-34, -30, -74, -20, -66, -4); g.lineTo(66, -4); g.bezierCurveTo(74, -20, 34, -30, 34, -70); g.bezierCurveTo(34, -120, 60, -150, 58, -250); g.closePath(); };
  gp(); g.fillStyle = 'rgba(255,240,220,.28)'; g.fill(); g.save(); gp(); g.clip(); g.fillStyle = lin(g, 0, -226, 0, 0, [[0, '#E0621A'], [.5, '#B8380A'], [1, '#7A1A05']]); g.fillRect(-90, -226, 180, 230);
  g.fillStyle = 'rgba(255,220,160,.55)'; g.beginPath(); g.ellipse(0, -226, 58, 9, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-42, -210, 10, 150); g.beginPath(); g.ellipse(-40, -220, 5, 3, 0, 0, TAU); g.fill(); g.restore();
  gp(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.ellipse(0, -250, 58, 10, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.stroke();
  // steam
  add(g, () => { for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(255,240,220,${.32})`; g.lineWidth = 12 - i * 2; g.beginPath(); for (let k = 0; k <= 14; k++) { const yy = -262 - k * 22, xx = (i - 1) * 26 + Math.sin(t * 2.2 + k * .55 + i * 2) * (8 + k * 2.6); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.globalAlpha = 1; g.stroke(); } });
  g.restore();
}
function seagull(g, x, y, s, t, ph) { const f = Math.sin(t * 7 + ph) * .5; g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#2A1042'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-30, -10 * f - 6); g.quadraticCurveTo(-14, -18 - 14 * f, 0, 0); g.quadraticCurveTo(14, -18 - 14 * f, 30, -10 * f - 6); g.stroke(); g.restore(); }
function ferry(g, x, y, s, t) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#2A1042'; g.beginPath(); g.moveTo(-120, 0); g.lineTo(130, 0); g.lineTo(104, 30); g.lineTo(-100, 30); g.closePath(); g.fill(); g.fillRect(-70, -30, 120, 32); g.fillRect(-40, -52, 60, 24); g.fillRect(-4, -84, 16, 34); g.fillStyle = '#FFC86A'; for (let i = 0; i < 7; i++) g.fillRect(-62 + i * 16, -22, 9, 10); g.fillStyle = 'rgba(60,20,70,.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(8 + i * 30 + Math.sin(t + i) * 4, -96 - i * 22, 16 + i * 8, 0, TAU); g.fill(); } g.restore(); }
function panelPath(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
function panelFrame(ctx, pts, u, dirx, drawIn) {   // manga panel slam-in: offset+rotate then settle
  if (u < 0) return; const k = eob(u / .16), off = (1 - k) * 900 * dirx, rot = (1 - k) * .22 * dirx; ctx.save(); ctx.translate(540 + off, 900); ctx.rotate(rot); ctx.translate(-540, -900);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; panelPath(ctx, pts); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  ctx.save(); panelPath(ctx, pts); ctx.clip(); drawIn(); ctx.restore(); panelPath(ctx, pts); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'miter'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
}
function drawTurkish(ctx, v) {
  const tt = v - T_TUR, t = amb(), hb = holdBell(), push = 1 + .06 * eio(tt / 1.1) + .035 * hb;
  ctx.save(); ctx.translate(540, 760); ctx.scale(push, push); ctx.translate(-540, -760);
  // sky + sun + far/near skyline (parallax drift)
  const bx = -60 + Math.sin(t * .25) * 6; ctx.drawImage(turBG(), bx, 0);
  // sun
  const sunY = 590, sunR = 138; add(ctx, () => { ctx.fillStyle = rad(ctx, 540, sunY, 20, 900, [[0, 'rgba(255,220,140,.75)'], [.35, 'rgba(255,140,80,.28)'], [1, 'rgba(255,90,80,0)']]); ctx.fillRect(-400, -400, 1900, 1900); });
  ctx.fillStyle = rad(ctx, 540, sunY, 10, sunR, [[0, '#FFFBE0'], [.7, '#FFE49A'], [1, '#FFC24A']]); ctx.beginPath(); ctx.arc(540, sunY, sunR, 0, TAU); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.globalAlpha = .0; ctx.stroke(); ctx.globalAlpha = 1;
  [190, 250, 330].forEach((r, i) => { ctx.strokeStyle = `rgba(255,236,170,${.34 - i * .08})`; ctx.lineWidth = 8 + i * 3; ctx.beginPath(); ctx.arc(540, sunY, r + Math.sin(t * 1.4 + i) * 4, 0, TAU); ctx.stroke(); });
  add(ctx, () => { ctx.translate(540, sunY); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .05 + tt * .08; ctx.save(); ctx.rotate(a); ctx.fillStyle = lin(ctx, 0, 0, 0, -1400, [[0, 'rgba(255,230,160,.22)'], [1, 'rgba(255,230,160,0)']]); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-70, -1400); ctx.lineTo(70, -1400); ctx.lineTo(6, 0); ctx.fill(); ctx.restore(); } });
  const far = lay('tur_far', 1200, 240, (g) => skylineFar(g, 1200, 200)); ctx.drawImage(far, -60 + Math.sin(t * .3) * 8 + (tt - 1) * -8, 470);
  seagull(ctx, 200 + ((t * 36) % 1400) - 200, 360 + Math.sin(t * .9) * 30, 1, t, 0); seagull(ctx, 120 + ((t * 30 + 300) % 1400) - 200, 300 + Math.sin(t * .7 + 2) * 24, .7, t, 2); seagull(ctx, ((t * 41 + 700) % 1500) - 300, 430 + Math.sin(t * 1.1) * 20, .8, t, 4);
  const near = lay('tur_near', 1200, 300, (g) => skylineNear(g, 1200, 260)); ctx.drawImage(near, -60 + (tt - 1) * -16, 440);
  // water
  const wtr = lay('tur_water', 1080, 1300, g => { g.fillStyle = lin(g, 0, 0, 0, 1300, [[0, '#FF9A5A'], [.12, '#C4457A'], [.4, '#5C1E78'], [1, '#170838']]); g.fillRect(0, 0, 1080, 1300); }); ctx.drawImage(wtr, 0, 700);
  add(ctx, () => { for (let i = 0; i < 64; i++) { const k = i / 63, y = 706 + Math.pow(k, 1.55) * 520, w0 = 30 + k * 300 * (.6 + .4 * hash(i * 1.9)), x = 540 + Math.sin(t * (1.2 + k) + i * 1.3) * (10 + k * 40) + (hash(i * 3.1) - .5) * 40 * k; ctx.globalAlpha = (1 - k * .8) * .8; ctx.fillStyle = '#FFE9A8'; ctx.beginPath(); ctx.roundRect(x - w0 / 2, y, w0, 4 + k * 6, 6); ctx.fill(); }
    ctx.globalAlpha = .25; ctx.strokeStyle = '#FFB070'; ctx.lineWidth = 3; for (let i = 0; i < 22; i++) { const y = 740 + i * 34 + Math.sin(t + i) * 4, x0 = (hash(i * 7.7) * 900 + t * (10 + i)) % 1200 - 60; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 120 + i * 6, y); ctx.stroke(); } ctx.globalAlpha = 1; });
  ferry(ctx, 1240 - ((t * 26) % 1500), 738, .55, t);
  ctx.restore();
  // title
  const shine = A.H ? (A.H.u / A.H.dur * 1.4 - .2) : clamp((tt - .25) / .8) * 1.3 - .15;
  const out = clamp((v - 15.6) / 0.2) * 0;   // title stays until the Korean slabs cover it
  bigTitle(ctx, 'סדרות', 540, 262, 196, v - 12.0, { from: 2.3, rot: -.07, shine: A.H ? shine : undefined });
  bigTitle(ctx, 'טורקיות', 540, 476, 222, v - 12.39, { from: 2.1, rot: .05, shine: A.H ? shine - .15 : undefined, grad: [[0, '#FFF3C4'], [.45, '#FFB53A'], [1, '#E0620A']], off: '#B3122E' });
  // drama panels
  const u2 = v - 12.39, kk = kick(u2, .02, 20), blink = A.blink(t, 3);
  const PG = [[40, 760], [590, 718], [540, 1176], [40, 1200]], PM = [[618, 742], [1040, 716], [1040, 1196], [570, 1176]];
  if (u2 > 0 && u2 < .5) { ctx.save(); ctx.globalAlpha = kick(u2, .06, 30); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(600, 640); ctx.lineTo(520, 900); ctx.lineTo(590, 900); ctx.lineTo(470, 1240); ctx.lineTo(640, 930); ctx.lineTo(570, 930); ctx.lineTo(690, 640); ctx.closePath(); ctx.fill(); ctx.restore(); }
  panelFrame(ctx, PG, u2 - .04, -1, () => {
    ctx.fillStyle = rad(ctx, 320, 960, 40, 620, [[0, '#FF7C96'], [.5, '#C0245C'], [1, '#4A0A3A']]); ctx.fillRect(0, 700, 700, 520); tone(ctx, 'tg', 20, 700, 640, 520, 16, 'rgba(60,0,40,.5)', 'radial', 1);
    speedLines(ctx, 300, 1010, t, { r0: 260, len: 700, n: 46, col: 'rgba(255,255,255,.28)', fps: 10 });
    const tear = clamp((v - 12.62) / 1.0);
    ctx.save(); ctx.translate(310 + Math.sin(t * 1.3) * 3, 1000 + Math.sin(t * 2) * 3); ctx.scale(1.12, 1.12); drawHead(ctx, { id: 'girl', t, eyes: { style: 'sparkle', lx: .5, ly: -.1, blink, spark: 1 }, mouth: { open: 0, curve: -.5, w: 26 }, brow: { ang: -.75, raise: -2 }, turn: .2, blush: .55, tear }); ctx.restore();
    ctx.globalAlpha = .9; rosePetals(ctx, t, { n: 14, seed: 9, alpha: .9 }); ctx.globalAlpha = 1;
    sfx(ctx, 'ドキッ', 130, 800, 78, -.2, u2 - .12, { fill: '#FF9AC0', shake: 1 });
  });
  panelFrame(ctx, PM, u2 - .08, 1, () => {
    ctx.fillStyle = rad(ctx, 820, 960, 40, 620, [[0, '#3C6E9E'], [.55, '#182C5E'], [1, '#0A0E2A']]); ctx.fillRect(560, 700, 500, 520); tone(ctx, 'tm', 560, 700, 500, 520, 15, 'rgba(0,0,30,.55)', 'radial', 1);
    add(ctx, () => { ctx.fillStyle = lin(ctx, 1040, 720, 700, 1180, [[0, 'rgba(255,190,90,.55)'], [1, 'rgba(255,190,90,0)']]); ctx.fillRect(560, 700, 500, 520); });
    ctx.save(); ctx.translate(816 + Math.sin(t * 1.1) * 3, 980); ctx.scale(1.08, 1.08); drawHead(ctx, { id: 'man', t, eyes: { style: 'normal', k: .82, lx: -.75, ly: .05, blink: A.blink(t, 8) }, mouth: { open: 0, curve: -.15, w: 24 }, brow: { ang: .55, raise: 0 }, turn: -.22 }); ctx.restore();
    sparkleStar(ctx, 700, 990, 20 + 8 * Math.sin(t * 6), '#fff', t, .9);
  });
  // heart beat between panels
  { const hk = eob((u2 - .3) / .2), beat = 1 + .16 * Math.pow(Math.max(0, Math.sin(t * 7.5)), 6); ctx.save(); ctx.translate(578, 1208); ctx.scale(hk * beat * 1.3, hk * beat * 1.3); ctx.beginPath(); ctx.moveTo(0, 38); ctx.bezierCurveTo(-62, -6, -32, -46, 0, -16); ctx.bezierCurveTo(32, -46, 62, -6, 0, 38); ctx.fillStyle = '#FF3D7A'; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-20, -14, 9, 5, -.6, 0, TAU); ctx.fill(); ctx.restore(); }
  // foreground: tulips (left) + tea (right), petals
  const sw = Math.sin(t * 1.4) * .03;
  [[46, 1290, 330, '#FF3B4A', '#C4122E', .4], [130, 1330, 380, '#FFC24A', '#E88A12', .1], [214, 1300, 300, '#FF5A9A', '#C4246A', -.15], [-10, 1400, 300, '#FF3B4A', '#C4122E', .2], [290, 1380, 260, '#FFF0D0', '#E8C88A', -.2]].forEach(([x, y, h, c1, c2, r], i) => { const e = eob((v - 12.2 - i * .04) / .3); tulip(ctx, x, lerp(2100, y, e), h, c1, c2, r + sw * (i % 2 ? 1 : -1) + Math.sin(t * 1.3 + i) * .02); });
  { const e = eob((v - 12.3) / .3); teaGlass(ctx, 900, lerp(2200, 1360, e), .9, t); }
  rosePetals(ctx, t, { n: 12, seed: 2, alpha: .9 });
  if (A.H) { const b = holdBell(); add(ctx, () => { ctx.globalAlpha = .18 * b; ctx.fillStyle = '#FFD890'; ctx.fillRect(0, 0, W, H); }); }
  if (tt < .3) { const k = clamp(tt / .22); slabs(ctx, 1 - k, ['#FFC24A', '#FF6B55', '#7C2C76', '#FFE49A', '#FFC24A'], -.4); }
  V.flash(ctx, v, 12.0, .18, '#FFF3C4', .85); V.flash(ctx, v, 12.39, .1, '#fff', .55);
}
A.scene({ name: 's4_series', start: 12.0, end: 16.11, draw(ctx, s) { drawTurkish(ctx, s.t); } });
})();
