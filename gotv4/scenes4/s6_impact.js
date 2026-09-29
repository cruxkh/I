// s6_impact: V6 IMPACT (v 25.61-30.12). LORD BUFFERING is shattered by the gold slam "אין תקיעות." then the anime penalty kick.
// Clock: s.t = v (VO clock). Holds: hold 14 at v=26.53 (0.5 s), hold 15 at v=30.0 (1.0 s): ambient motion is periodic (integer cycles) so the last hold frame == the resume frame.
(() => {
'use strict';
const { clamp, lerp, ease, hash, rng, inv, smooth, TAU } = A;
const S0 = 25.61, TS = 26.045, TD = 26.535, T_STRIKE = 28.05, T_SMASH = 28.80, T_GOAL = 29.28;
const INK = '#120a24';
const JP = '"IPAGothic","IPAPGothic",sans-serif';
const eo = t => ease.out(clamp(t)), ei = t => ease.in(clamp(t)), eio = t => ease.inOut(clamp(t)), eob = t => ease.outBack(clamp(t));
const K = (t, ks, e) => A.key(t, ks, e || 'inOut');
const GOLD = [[0, '#FFF3C4'], [.45, '#FFC24A'], [1, '#E48A12']];
let HU = 0, HOLD = false, ENV = 0, MONO = 0;
const mc = c => MONO === 1 ? '#000' : MONO === 2 ? '#fff' : c;
const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
const rg = (g, x, y, r0, r1, st) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
const scratch = {};
const getScratch = (k, w, h) => { let c = scratch[k]; if (!c) { c = scratch[k] = document.createElement('canvas'); c.width = w; c.height = h; } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h); return c; };

// ---------------------------------------------------------------- shared anime helpers
const halftoneL = () => A.layer('s6ht', 1080, 1920, g => {
  g.fillStyle = '#000'; const sp = 30;
  for (let y = 0; y < 1950; y += sp) for (let x = 0; x < 1110; x += sp) { const px = x + (((y / sp) | 0) % 2 ? sp / 2 : 0), d = Math.hypot((px - 540) / 540, (y - 960) / 960), r = clamp((d - .5) * 1.9, 0, 1) * sp * .62; if (r > .7) { g.beginPath(); g.arc(px, y, r, 0, TAU); g.fill(); } }
});
function halftone(ctx, a) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(halftoneL(), 0, 0); ctx.restore(); }
function speedLines(ctx, cx, cy, v, o = {}) {
  const n = o.n || 70, rr = rng(Math.floor(v * (o.fps || 15)) * 7 + (o.seed || 1));
  ctx.save(); ctx.fillStyle = o.col || '#fff'; ctx.globalAlpha = o.alpha ?? .6;
  for (let i = 0; i < n; i++) {
    const a = rr() * TAU, w = (.004 + rr() * .02) * (o.wmul || 1), rin = (o.r0 || 260) * (1 + rr() * .5), rout = rin + (o.len || 1400) * (.4 + rr() * .6);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - w) * rout, cy + Math.sin(a - w) * rout); ctx.lineTo(cx + Math.cos(a + w) * rout, cy + Math.sin(a + w) * rout); ctx.lineTo(cx + Math.cos(a) * rin, cy + Math.sin(a) * rin); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function kana(ctx, s, x, y, size, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.sx || 1, o.sy || 1); ctx.globalAlpha = o.alpha ?? 1;
  ctx.font = `900 ${size}px ${JP}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * .36; ctx.strokeStyle = o.out || INK; ctx.strokeText(s, 0, 0);
  ctx.lineWidth = size * .2; ctx.strokeStyle = o.rim || '#fff'; ctx.strokeText(s, 0, 0);
  ctx.lineWidth = size * .07; ctx.strokeStyle = o.f1 || '#ff3b30'; ctx.strokeText(s, 0, 0);
  ctx.fillStyle = lg(ctx, 0, -size * .5, 0, size * .5, [[0, o.f0 || '#fff36b'], [1, o.f1 || '#ff3b30']]); ctx.fillText(s, 0, 0);
  ctx.restore();
}
function kanaHit(ctx, v, t0, s, x, y, size, o = {}) {   // pop-in katakana that lives dur seconds
  const tau = v - t0, dur = o.dur || .8; if (tau < 0 || tau > dur) return;
  const sc = tau < .07 ? lerp(2.4, 1, eo(tau / .07)) : 1 + .05 * Math.sin(tau * 22) * Math.exp(-(tau - .07) * 5);
  const al = tau > dur - .15 ? (dur - tau) / .15 : 1;
  kana(ctx, s, x + A.noise1(v * 60 + x) * (tau < .25 ? 8 : 1), y, size * sc, Object.assign({}, o, { alpha: al }));
}
function sparks(ctx, x, y, tau, o) {
  const n = o.n || 40; ctx.save(); ctx.globalCompositeOperation = o.add === false ? 'source-over' : 'lighter';
  for (let i = 0; i < n; i++) {
    const a = (o.a0 ?? 0) + hash(o.seed + i * 3.1) * (o.arc ?? TAU), sp = o.speed * (.25 + hash(o.seed + i * 7.7)), life = (o.life || .8) * (.5 + hash(o.seed + i * 1.3) * .6);
    if (tau < 0 || tau > life) continue;
    const f = tau, d = sp * (1 - Math.exp(-f * 3.2)) / 3.2, d0 = sp * (1 - Math.exp(-Math.max(0, f - .03) * 3.2)) / 3.2, gy = (o.grav || 0) * f * f * .5, gy0 = (o.grav || 0) * Math.max(0, f - .03) ** 2 * .5;
    ctx.strokeStyle = o.cols ? o.cols[i % o.cols.length] : (o.col || '#ffe08a'); ctx.globalAlpha = 1 - f / life; ctx.lineWidth = (o.size || 6) * (1 - f / life) + 1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0 + gy0); ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d + gy); ctx.stroke();
  }
  ctx.restore();
}
function shock(ctx, x, y, tau, o) {
  const dur = o.dur || .5; if (tau < 0 || tau > dur) return; const u = tau / dur, r = o.r * (1 - Math.pow(1 - u, 3)), a = 1 - u;
  ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = (o.w || 40) * a + 3; ctx.strokeStyle = o.col || '#fff';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * (o.sq || 1), 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = Math.max(2, (o.w || 40) * a * .3); ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
}
const shakeAmp = (v, hits) => { let s = 0; for (const [t, a, k] of hits) if (v >= t) s += a * Math.exp(-(v - t) * (k || 9)); return s; };
const petals = (ctx, v, n, seed, alpha = 1) => {
  ctx.save(); for (let i = 0; i < n; i++) { const sp = 90 + hash(seed + i) * 120, x = (hash(seed + i * 2) * 1400 - 160 + v * sp * .7 + Math.sin(v * 1.7 + i) * 60) % 1300, y = ((hash(seed + i * 3) * 2100 + v * sp * .9) % 2100) - 100, r = 8 + hash(seed + i * 5) * 12;
    ctx.globalAlpha = alpha * .85; ctx.fillStyle = i % 3 ? '#ffb7d5' : '#ffe1ee'; ctx.save(); ctx.translate(x - 100, y); ctx.rotate(v * 2 + i); ctx.scale(1, .55 + .45 * Math.sin(v * 3 + i)); ctx.beginPath(); ctx.ellipse(0, 0, r, r * .55, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
};

// ---------------------------------------------------------------- gold 3D text (cached)
function goldCanvas(key, str, tw, maxSize, depth = 30) {
  return A.layer(key, 1240, 620, g => {
    g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.font = '900 100px Rubik';
    const m = g.measureText(str).width, size = Math.min(maxSize, 100 * tw / m); g.font = `900 ${size}px Rubik`;
    const cx = 620, cy = 300;
    for (let i = depth; i >= 0; i -= 2) { g.lineWidth = size * .17; g.strokeStyle = '#1a0d2e'; g.strokeText(str, cx + i * .5, cy + i * 1.0); }
    for (let i = depth; i >= 1; i--) { g.fillStyle = A.mixc('#7a3f04', '#d98510', 1 - i / depth); g.fillText(str, cx + i * .5, cy + i * 1.0); }
    g.fillStyle = lg(g, 0, cy - size * .42, 0, cy + size * .42, GOLD); g.fillText(str, cx, cy);
    g.save(); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lg(g, cx - 400, cy - size, cx + 100, cy + size * .3, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.55)'], [.6, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 1240, 620);
    g.restore();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,250,225,.85)'; g.strokeText(str, cx, cy);
  });
}
const TXT_AIN = () => goldCanvas('s6g_ain', 'אין', 540, 330);
const TXT_TK = () => goldCanvas('s6g_tk', 'תקיעות', 940, 300);
function slamText(ctx, cv, x, y, t0, v, o = {}) {
  const tau = v - t0; if (tau < 0) return;
  const sc = (tau < .09 ? lerp(3.6, .9, ei(tau / .09)) : 1 - .1 * Math.exp(-(tau - .09) * 14) * Math.cos((tau - .09) * 38)) * (o.sc || 1);
  ctx.save(); ctx.translate(x, y + (o.dy || 0)); ctx.rotate((o.rot0 || -.06) * Math.exp(-tau * 9) + (o.rot || 0)); ctx.scale(sc, sc);
  ctx.drawImage(cv, -620, -300);
  if (o.glint != null) {   // glint sweep clipped to the text alpha
    const sc2 = getScratch('glint', 1240, 620), g = sc2.getContext('2d'); g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-atop';
    const gx = lerp(-300, 1500, o.glint); g.fillStyle = lg(g, gx - 120, 0, gx + 120, 200, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 1240, 620);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35; ctx.drawImage(sc2, -620, -300);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- LORD BUFFERING (villain)
const FZ = 0.35 - 1.04;   // frozen spinner angle after the stutter
function villainArt(g, ang, crack, eye) {
  g.clearRect(0, 0, 1000, 1000);
  const cx = 500, cy = 500;
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, cx, cy, 120, 495, [[0, 'rgba(120,220,255,.55)'], [.6, 'rgba(60,140,255,.22)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, 1000, 1000); g.restore();
  // ice spikes
  g.lineJoin = 'round';
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * TAU + (hash(i) - .5) * .12, top = Math.max(0, -Math.sin(a)), len = 350 + hash(i + 5) * 110 + top * 100, wd = .085 + hash(i + 9) * .05;
    const p0 = [cx + Math.cos(a - wd) * 280, cy + Math.sin(a - wd) * 280], p2 = [cx + Math.cos(a + wd) * 280, cy + Math.sin(a + wd) * 280], tip = [cx + Math.cos(a + (hash(i + 2) - .5) * .12) * len, cy + Math.sin(a + (hash(i + 2) - .5) * .12) * len];
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(tip[0], tip[1]); g.lineTo(p2[0], p2[1]); g.closePath();
    g.fillStyle = lg(g, cx, cy, tip[0], tip[1], [[0, '#2f6fc0'], [.6, '#8fd6ff'], [1, '#f0fdff']]); g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(tip[0], tip[1]); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
  }
  // spinner segments
  const N = 12, r0 = 210, r1 = 308, w = TAU / N * .66;
  for (let i = 0; i < N; i++) {
    const a0 = ang + i * TAU / N, b = 1 - i / N * .8;
    g.beginPath(); g.arc(cx, cy, r1, a0, a0 + w); g.arc(cx, cy, r0, a0 + w * .92, a0 + w * .08, true); g.closePath();
    g.fillStyle = lg(g, cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1, cx + Math.cos(a0 + w) * r0, cy + Math.sin(a0 + w) * r0, [[0, A.mixc('#3a78d0', '#f4feff', b)], [1, A.mixc('#1c4a99', '#9fdcff', b)]]); g.fill();
    g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(cx, cy, r1 - 12, a0 + w * .12, a0 + w * .8); g.lineWidth = 6; g.strokeStyle = `rgba(255,255,255,${.35 + .6 * b})`; g.stroke();
  }
  // face disc
  g.beginPath(); g.arc(cx, cy, 202, 0, TAU); g.fillStyle = rg(g, cx - 30, cy - 50, 20, 210, [[0, '#4a3596'], [.5, '#1b0f45'], [1, '#07030f']]); g.fill();
  g.lineWidth = 13; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.arc(cx, cy, 190, 0, TAU); g.lineWidth = 7; g.strokeStyle = '#9be7ff'; g.stroke();
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, l = 22 + hash(i + 40) * 26; g.beginPath(); g.moveTo(cx + Math.cos(a - .05) * 190, cy + Math.sin(a - .05) * 190); g.lineTo(cx + Math.cos(a) * (190 - l), cy + Math.sin(a) * (190 - l)); g.lineTo(cx + Math.cos(a + .05) * 190, cy + Math.sin(a + .05) * 190); g.fillStyle = 'rgba(200,245,255,.85)'; g.fill(); }
  // 99%
  g.save(); g.font = '900 44px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(126,231,255,.75)'; g.fillText('99%', cx, cy - 138); g.restore();
  // eyes
  for (const sg of [-1, 1]) {
    const ex = cx + sg * 84, ey = cy - 26;
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg(g, ex, ey + 6, 5, 110, [[0, `rgba(255,60,90,${.6 * eye})`], [1, 'rgba(255,0,60,0)']]); g.fillRect(ex - 120, ey - 110, 240, 240); g.restore();
    g.beginPath(); g.moveTo(ex + sg * 66, ey - 30); g.lineTo(ex - sg * 58, ey + 18); g.quadraticCurveTo(ex + sg * 4, ey + 72, ex + sg * 66, ey - 30); g.closePath();
    g.fillStyle = rg(g, ex, ey + 8, 3, 70, [[0, '#ffffff'], [.25, '#ffd6dc'], [.55, '#ff2a4a'], [1, '#6a0018']]); g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.ellipse(ex - sg * 8, ey + 10, 8, 26, 0, 0, TAU); g.fillStyle = '#12000a'; g.fill();
    g.beginPath(); g.moveTo(ex + sg * 84, ey - 66); g.lineTo(ex - sg * 74, ey - 6); g.lineTo(ex - sg * 74, ey - 34); g.lineTo(ex + sg * 90, ey - 92); g.closePath(); g.fillStyle = '#0b0620'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#8ee6ff'; g.stroke();
  }
  // mouth
  const yt = x => cy + 64 + 44 * (1 - Math.pow((x - cx) / 118, 2));
  g.beginPath(); for (let x = -118; x <= 118; x += 6) g.lineTo(cx + x, yt(cx + x)); for (let x = 118; x >= -118; x -= 6) g.lineTo(cx + x, yt(cx + x) + 12 + 66 * (1 - Math.pow(x / 118, 2))); g.closePath(); g.fillStyle = '#1c0033'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  for (let k = -5; k <= 5; k++) { const x = cx + k * 21, y = yt(x), h = 26 + hash(k + 60) * 10; g.beginPath(); g.moveTo(x - 11, y); g.lineTo(x + 11, y); g.lineTo(x, y + h); g.closePath(); g.fillStyle = '#eafcff'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  // cracks
  if (crack > 0) {
    const rr = rng(21);
    for (let c = 0; c < 9; c++) {
      let a = -.4 + c / 9 * TAU + rr() * .3, x = cx + 14, y = cy - 96, pts = [[x, y]]; const L = 300 + rr() * 200;
      for (let d = 0; d < L; d += 34) { a += (rr() - .5) * .7; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); }
      const n = Math.max(1, Math.floor(pts.length * clamp(crack * 1.15 - c * .03)));
      for (const [lw, col] of [[10, INK], [4, '#eaffff']]) { g.beginPath(); pts.slice(0, n + 1).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }
    }
  }
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = lg(g, cx - 320, cy - 320, cx + 320, cy + 320, [[0, 'rgba(140,230,255,.2)'], [.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,40,.5)']]); g.fillRect(0, 0, 1000, 1000); g.restore();
}
const villFrozen = () => A.layer('s6vf', 1000, 1000, g => villainArt(g, FZ, 1, 1));
const villTint = (k, col, comp) => A.layer('s6vt' + k, 1000, 1000, g => { g.drawImage(villFrozen(), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 1000, 1000); });
function clipHalf(poly, px, py, nx, ny) {
  const A_ = [], B_ = [], n = poly.length;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n], da = (a[0] - px) * nx + (a[1] - py) * ny, db = (b[0] - px) * nx + (b[1] - py) * ny; if (da >= 0) A_.push(a); else B_.push(a); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db), q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; A_.push(q); B_.push(q); } }
  return [A_, B_];
}
const areaOf = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
let _SH = null;
function shardSet() {
  if (_SH) return _SH;
  let polys = [Array.from({ length: 36 }, (_, i) => [500 + Math.cos(i / 36 * TAU) * 500, 500 + Math.sin(i / 36 * TAU) * 500])]; const rr = rng(77);
  for (let c = 0; c < 12; c++) {
    const px = 500 + (rr() - .5) * 400, py = 490 + (rr() - .5) * 400, an = rr() * Math.PI, nx = Math.cos(an), ny = Math.sin(an), next = [];
    for (const p of polys) { const [a, b] = clipHalf(p, px, py, nx, ny); if (a.length >= 3 && b.length >= 3 && areaOf(a) > 500 && areaOf(b) > 500) next.push(a, b); else next.push(p); } polys = next;
  }
  _SH = polys.map((p, i) => { let cx = 0, cy = 0; p.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= p.length; cy /= p.length; const dx = cx - 500, dy = cy - 500, d = Math.hypot(dx, dy) + 1;
    return { p, cx, cy, ux: dx / d, uy: dy / d, sp: 900 / (1 + d / 220) + 250 + hash(i + 3) * 300, zv: .5 * hash(i + 9) + (d < 170 ? .3 : 0), rv: (hash(i + 5) - .5) * 9, front: false }; });
  return _SH;
}
const VS = 1.22, VCX = 540, VCY = 450;
function drawShards(ctx, v, front) {
  const tau = v - TS; if (tau < 0) return; const img = villFrozen(), fl = clamp(1 - tau / .12);
  for (const s of shardSet()) {
    if (s.front !== front) continue;
    const f = 1 - Math.exp(-tau * 2.4), dx = s.ux * s.sp * f / 2.4 + A.noise1(tau * 3 + s.cx) * 4 * ENV, dy = s.uy * s.sp * f / 2.4 + 560 * tau * tau + Math.sin(HU * TAU + s.cx) * 8 * ENV, sc = 1 + s.zv * Math.min(tau, 1.2) * 1.1, al = clamp((1.0 - tau) * 5) * .9;
    if (al <= 0) continue;
    ctx.save(); ctx.globalAlpha = al; ctx.translate(VCX + (s.cx - 500 + dx) * VS, VCY + (s.cy - 500 + dy) * VS); ctx.scale(VS * sc, VS * sc); ctx.rotate(s.rv * tau); ctx.translate(-s.cx, -s.cy);
    ctx.beginPath(); s.p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(img, 0, 0);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .8})`; ctx.fillRect(0, 0, 1000, 1000); } ctx.restore();
    ctx.lineJoin = 'round'; ctx.lineWidth = 6 / (VS * sc); ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2.4 / (VS * sc); ctx.strokeStyle = 'rgba(210,250,255,.9)'; ctx.stroke(); ctx.restore();
  }
}
const scratchV = () => getScratch('vill', 1000, 1000);
function drawVillain(ctx, v) {
  const lt = v - S0, steps = Math.min(2, Math.floor(Math.max(0, lt) * 7)), ang = .35 - .52 * steps, crack = inv(25.72, 26.03, v);
  const g = scratchV().getContext('2d'); villainArt(g, ang, crack, .7 + .3 * Math.sin(v * 30));
  const lunge = lt < .3 ? lerp(1.5, 1, eo(lt / .3)) : 1 + .012 * Math.sin(v * 7), trem = v > 25.8 && v < TS ? (A.noise1(v * 90) * 6 * (v - 25.8) / .24) : 0;
  ctx.save(); ctx.translate(VCX + trem, VCY + (v > 25.8 && v < TS ? A.noise1(v * 90 + 5) * 5 : 0)); ctx.scale(VS * lunge, VS * lunge);
  const gl = (lt < .2 || (v > 25.86 && v < 25.9) || (v > 25.98 && v < 26.01)) ? 1 : 0;   // glitch bursts
  const img = scratch.vill; ctx.translate(-500, -500);
  if (gl) {
    const rr = rng(Math.floor(v * 30) + 3);
    for (let i = 0; i < 9; i++) { const y0 = i * 111, off = (rr() - .5) * 90; ctx.drawImage(img, 0, y0, 1000, 112, off, y0, 1000, 112); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(villTint('r', '#ff2244'), -16, 0); ctx.drawImage(villTint('c', '#22e6ff'), 16, 0); ctx.restore();
  } else ctx.drawImage(img, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------- backgrounds (slam phase)
const bgIce = () => A.layer('s6bgice', 1080, 1920, g => {
  g.fillStyle = lg(g, 0, 0, 0, 1920, [[0, '#02040c'], [.45, '#0a1a3c'], [1, '#02070f']]); g.fillRect(0, 0, 1080, 1920);
  g.fillStyle = rg(g, 540, 520, 40, 900, [[0, 'rgba(70,170,255,.6)'], [.5, 'rgba(30,90,200,.25)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, 1080, 1920);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const x = 100 + i * 150 + hash(i) * 60; g.fillStyle = lg(g, x, 0, x, 1500, [[0, 'rgba(120,220,255,.16)'], [1, 'rgba(120,220,255,0)']]); g.beginPath(); g.moveTo(x - 20, 0); g.lineTo(x + 20, 0); g.lineTo(x + 120 + (i - 3) * 30, 1500); g.lineTo(x - 90 + (i - 3) * 30, 1500); g.fill(); }
  g.restore();
  for (let i = 0; i < 16; i++) { const x = i * 72 + hash(i + 3) * 40, l = 90 + hash(i + 7) * 220; g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x + 30, 0); g.lineTo(x + (hash(i) - .5) * 20, l); g.closePath(); g.fillStyle = '#0d2a5a'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#7fd3ff'; g.stroke(); }
  for (let i = 0; i < 12; i++) { const x = i * 100 + hash(i + 33) * 60, l = 80 + hash(i + 37) * 160; g.beginPath(); g.moveTo(x - 36, 1920); g.lineTo(x + 36, 1920); g.lineTo(x, 1920 - l); g.closePath(); g.fillStyle = '#0a2450'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#7fd3ff'; g.stroke(); }
});
function bgGold(ctx, v, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = lg(ctx, 0, 0, 0, 1920, [[0, '#0B1450'], [.5, '#1d2a9a'], [1, '#060a30']]); ctx.fillRect(0, 0, 1080, 1920);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, 540, 760, 30, 1000, [[0, 'rgba(255,190,70,.95)'], [.4, 'rgba(255,140,30,.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, 1080, 1920);
  ctx.translate(540, 760); ctx.rotate(v * .12);
  for (let i = 0; i < 18; i++) { ctx.rotate(TAU / 18); ctx.fillStyle = 'rgba(255,225,140,.16)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1900); ctx.lineTo(90, -1900); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- SLAM phase 25.61 - 27.30
function drawDot(ctx, x, y, r, sq = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq);
  for (let i = 26; i >= 0; i -= 2) { ctx.beginPath(); ctx.arc(i * .5, i * 1.0, r + 8, 0, TAU); ctx.fillStyle = i ? A.mixc('#7a3f04', '#d98510', 1 - i / 26) : '#000'; ctx.fill(); if (i === 26) { ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); } }
  ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, TAU); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = rg(ctx, -r * .35, -r * .4, r * .05, r * 1.1, [[0, '#FFF8D8'], [.3, '#FFC24A'], [.75, '#E48A12'], [1, '#9c5204']]); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-r * .3, -r * .48, r * .34, r * .16, -.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r - 6, .3, 1.8); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(120,50,0,.5)'; ctx.stroke();
  ctx.restore();
}
function drawSlam(ctx, v) {
  const lt = v - S0;
  // impact frames (villain reveal)
  if (lt < .04 || lt < .075) {
    const white = lt < .04; ctx.fillStyle = white ? '#fff' : '#000'; ctx.fillRect(0, 0, 1080, 1920);
    speedLines(ctx, 540, 520, v, { col: white ? '#000' : '#fff', alpha: .95, n: 110, r0: 200, len: 1800, fps: 30, wmul: 1.4 });
    ctx.save(); ctx.translate(VCX, VCY); ctx.scale(VS * 1.25, VS * 1.25); ctx.translate(-500, -500); ctx.drawImage(villTint(white ? 'k' : 'w', white ? '#000' : '#fff'), 0, 0); ctx.restore();
    kana(ctx, 'ドン!!', 300, 300, 300, { rot: -.2, out: white ? '#fff' : '#000', rim: white ? '#000' : '#fff', f0: white ? '#000' : '#fff', f1: white ? '#000' : '#fff' });
    return;
  }
  const shk = shakeAmp(v, [[S0, 26, 8], [TS, 30, 7], [TD, 46, 7]]);
  ctx.save(); ctx.translate(A.noise1(v * 47) * shk, A.noise1(v * 47 + 31) * shk); ctx.rotate(A.noise1(v * 31 + 9) * shk * .0005);
  const sway = HOLD ? Math.sin(HU * TAU) : 0; ctx.translate(540, 700); ctx.scale(1 + .012 * sway, 1 + .012 * sway); ctx.translate(-540, -700);
  // background
  ctx.drawImage(bgIce(), 0, 0);
  A.glow(ctx, 540, 500, 760, '#ff1f55', .16 + .08 * Math.sin(v * 12));
  const gb = smooth(TS - .02, TS + .18, v); if (gb > 0) bgGold(ctx, v, gb);
  halftone(ctx, .5 - .25 * gb);
  if (v < TS) { speedLines(ctx, 540, 440, v, { alpha: .14, n: 46, r0: 480, len: 900, col: '#9be7ff' }); drawVillain(ctx, v); }
  drawShards(ctx, v, false);
  // label
  if (v < TS + .1) {
    const la = clamp(inv(S0 + .1, S0 + .2, v)) * (1 - clamp(inv(TS - .02, TS + .08, v)));
    ctx.save(); ctx.globalAlpha = la; ctx.translate(540, 175); const wob = A.noise1(v * 40) * (v < S0 + .3 ? 6 : 0); ctx.translate(wob, 0);
    ctx.fillStyle = 'rgba(10,0,20,.85)'; ctx.beginPath(); ctx.moveTo(-330, -46); ctx.lineTo(340, -46); ctx.lineTo(310, 46); ctx.lineTo(-360, 46); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ff2a55'; ctx.stroke();
    ctx.font = '900 56px Rubik'; ctx.letterSpacing = '6px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#eaffff'; ctx.shadowColor = '#00d0ff'; ctx.shadowBlur = 18; ctx.fillText('LORD BUFFERING', 0, 3); ctx.restore();
  }
  // text group + recoil at the dot
  const rec = eo((v - TD) / .12);
  const gdy = -250 * rec, gsc = 1 - .12 * rec;
  const gl = HOLD ? HU : null;
  ctx.save(); ctx.translate(540, 900); ctx.scale(gsc, gsc); ctx.translate(-540, -900);
  slamText(ctx, TXT_AIN(), 540, 800, 25.655, v, { dy: gdy, glint: gl });
  slamText(ctx, TXT_TK(), 540, 1040, TS, v, { dy: gdy, glint: gl != null ? (HU + .25) % 1 : null, rot0: .05 });
  ctx.restore();
  drawShards(ctx, v, true);
  // fx of slam 1 (ain)
  const y1 = 800;
  shock(ctx, 540, y1, v - 25.655, { r: 720, w: 60, sq: .55, col: '#9be7ff', dur: .5 });
  shock(ctx, 540, y1, v - 25.68, { r: 420, w: 30, sq: .55, col: '#fff', dur: .4 });
  if (v - 25.655 < .35) speedLines(ctx, 540, y1, v, { col: '#fff', alpha: .28 * (1 - (v - 25.655) / .35), n: 40, r0: 200, len: 900 });
  sparks(ctx, 540, y1, v - 25.655, { n: 50, seed: 3, speed: 900, life: .7, size: 7, cols: ['#fff', '#9be7ff', '#ffe08a'] });
  // slam 2 (takiot) + shatter
  shock(ctx, 540, 1040 + gdy, v - TS, { r: 900, w: 80, sq: .5, col: '#ffd45a', dur: .55 });
  shock(ctx, 540, 500, v - TS, { r: 800, w: 50, sq: 1, col: '#fff', dur: .45 });
  if (v - TS < .3) { ctx.save(); ctx.globalAlpha = .9 * (1 - (v - TS) / .3); speedLines(ctx, 540, 700, v, { col: '#fff7d0', alpha: .4, n: 50, r0: 180, len: 1500 }); ctx.restore(); }
  sparks(ctx, 540, 700, v - TS, { n: 90, seed: 12, speed: 1300, life: .9, size: 8, grav: 700, cols: ['#fff', '#bfeeff', '#ffd45a', '#9be7ff'] });
  if (v - TS >= 0 && v - TS < .09) { ctx.fillStyle = `rgba(255,255,255,${.85 * (1 - (v - TS) / .09)})`; ctx.fillRect(0, 0, 1080, 1920); }
  kanaHit(ctx, v, S0 + .05, 'ドン!!', 250, 1090, 230, { rot: -.2, dur: .6 });
  kanaHit(ctx, v, TS + .0, 'パリーン!', 770, 1080, 180, { rot: .15, dur: .8, f0: '#e8fbff', f1: '#2aa4ff' });
  // ambient in hold 14: floating ice motes + gold sparkles (fade in/out)
  if (HOLD) { const r = rng(5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const x = r() * 1080, y = (r() * 1700 + 150 - HU * 120 * (.4 + r())) , a = ENV * (.4 + .6 * r()); V.sparkle(ctx, x, y, 6 + r() * 12, i % 2 ? '#fff4c8' : '#bfeeff', HU * 3 + i, a); } ctx.restore(); }
  // dot "נקודה"
  const td = v - TD;
  if (td >= 0) {
    if (td < .066) { const w2 = td < .033; ctx.fillStyle = w2 ? '#fff' : '#000'; ctx.fillRect(0, 0, 1080, 1920); speedLines(ctx, 540, 1050, v, { col: w2 ? '#000' : '#fff', alpha: 1, n: 120, r0: 130, len: 1900, fps: 30, wmul: 1.5 });
      ctx.save(); ctx.translate(540, 1050); ctx.scale(1.5, 1.5); ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fillStyle = w2 ? '#000' : '#fff'; ctx.fill(); ctx.restore();
      kana(ctx, 'ドォォン!!', 540, 300, 240, { rot: -.08, out: w2 ? '#fff' : '#000', rim: w2 ? '#000' : '#fff', f0: w2 ? '#000' : '#fff', f1: w2 ? '#000' : '#fff' }); ctx.restore(); return; }
    const sc = td < .1 ? lerp(5.5, .82, ei(td / .1)) : 1 - .18 * Math.exp(-(td - .1) * 11) * Math.cos((td - .1) * 34), bob = Math.sin(v * 5) * 5;
    shock(ctx, 540, 1050, td, { r: 1000, w: 90, sq: .5, col: '#ffd45a', dur: .7 }); shock(ctx, 540, 1050, td - .05, { r: 600, w: 40, sq: .5, col: '#fff', dur: .5 });
    if (td < .4) speedLines(ctx, 540, 1050, v, { col: '#fff3c0', alpha: .6 * (1 - td / .4), n: 70, r0: 150, len: 1400 });
    A.glow(ctx, 540, 1050, 520, '#ffb02e', .55);
    drawDot(ctx, 540, 1050 + bob, 105 * sc, 1 + .08 * Math.exp(-td * 8) * Math.sin(td * 50));
    sparks(ctx, 540, 1050, td, { n: 70, seed: 41, speed: 1300, life: .9, size: 8, grav: 900, cols: ['#fff', '#ffd45a', '#ffb02e'] });
    kanaHit(ctx, v, TD + .06, 'ドォォン!!', 780, 330, 200, { rot: .12, dur: .9 });
    petals(ctx, v - TD, 22, 4, clamp(td * 3));
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 3D world (penalty)
let CAM = null; const PY = 760;
function setCam(p, t, f) {
  const fx = t[0] - p[0], fy = t[1] - p[1], fz = t[2] - p[2], fl = Math.hypot(fx, fy, fz) || 1, F = [fx / fl, fy / fl, fz / fl], rl = Math.hypot(F[2], F[0]) || 1, R = [F[2] / rl, 0, -F[0] / rl];
  const U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]]; CAM = { p, F, R, U, f };
}
const toCam = w => { const d0 = w[0] - CAM.p[0], d1 = w[1] - CAM.p[1], d2 = w[2] - CAM.p[2]; return [d0 * CAM.R[0] + d1 * CAM.R[1] + d2 * CAM.R[2], d0 * CAM.U[0] + d1 * CAM.U[1] + d2 * CAM.U[2], d0 * CAM.F[0] + d1 * CAM.F[1] + d2 * CAM.F[2]]; };
const pjf = w => { const c = toCam(w), z = Math.max(c[2], .35), k = CAM.f / z; return { x: 540 + c[0] * k, y: PY - c[1] * k, z: c[2], k }; };
const pj = w => { const c = toCam(w); if (c[2] < .12) return null; const k = CAM.f / c[2]; return { x: 540 + c[0] * k, y: PY - c[1] * k, z: c[2], k }; };
function projPoly(ws) {
  const cs = ws.map(toCam), out = [], n = cs.length;
  for (let i = 0; i < n; i++) { const a = cs[i], b = cs[(i + 1) % n], ai = a[2] >= .15, bi = b[2] >= .15; if (ai) out.push(a); if (ai !== bi) { const t = (.15 - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, .15]); } }
  return out.map(c => [540 + c[0] * CAM.f / c[2], PY - c[1] * CAM.f / c[2]]);
}
function fillW(ctx, ws, col) { const p = projPoly(ws); if (p.length < 3) return; ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
function triTex(ctx, src, p, s, rect) {
  const [[x0, y0], [x1, y1], [x2, y2]] = p, [[u0, v0], [u1, v1], [u2, v2]] = s, cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3, e = .7, ex = (x, y) => [x + Math.sign(x - cx) * e, y + Math.sign(y - cy) * e];
  const a = ex(x0, y0), b = ex(x1, y1), c = ex(x2, y2), d = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0); if (Math.abs(d) < 1e-6) return;
  ctx.save(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.clip();
  const m11 = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / d, m12 = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / d, m21 = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / d, m22 = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / d;
  ctx.transform(m11, m12, m21, m22, x0 - m11 * u0 - m21 * v0, y0 - m12 * u0 - m22 * v0); ctx.drawImage(src, rect[0], rect[1], rect[2], rect[3], rect[0], rect[1], rect[2], rect[3]); ctx.restore();
}
// textured world quad, corners TL,TR,BR,BL
function quadTex(ctx, img, C4, nx, ny, sub) {
  const sw = sub ? sub[2] : img.width, sh = sub ? sub[3] : img.height, ox = sub ? sub[0] : 0, oy = sub ? sub[1] : 0;
  const P = (u, v) => { const a = [lerp(C4[0][0], C4[1][0], u), lerp(C4[0][1], C4[1][1], u), lerp(C4[0][2], C4[1][2], u)], b = [lerp(C4[3][0], C4[2][0], u), lerp(C4[3][1], C4[2][1], u), lerp(C4[3][2], C4[2][2], u)]; return pj([lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)]); };
  const grid = []; for (let j = 0; j <= ny; j++) { grid[j] = []; for (let i = 0; i <= nx; i++) grid[j][i] = P(i / nx, j / ny); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i]; if (!a || !b || !c || !d) continue;
    const u0 = ox + i / nx * sw, u1 = ox + (i + 1) / nx * sw, v0 = oy + j / ny * sh, v1 = oy + (j + 1) / ny * sh, rect = [u0 - 1, v0 - 1, u1 - u0 + 2, v1 - v0 + 2];
    triTex(ctx, img, [[a.x, a.y], [b.x, b.y], [c.x, c.y]], [[u0, v0], [u1, v0], [u1, v1]], rect); triTex(ctx, img, [[a.x, a.y], [c.x, c.y], [d.x, d.y]], [[u0, v0], [u1, v1], [u0, v1]], rect);
  }
}
// ---- textures
const personCols = ['#ffd21f', '#ffe25a', '#1c47e0', '#ffd21f', '#2a5cff', '#f4f6ff', '#ffc21a'];
function crowdPos(i, W2, rows) { return null; }
const crowdTex = () => A.layer('s6crowd', 2048, 700, g => {
  g.fillStyle = lg(g, 0, 0, 0, 700, [[0, '#0d0a24'], [1, '#2a1740']]); g.fillRect(0, 0, 2048, 700);
  for (let row = 0; row < 28; row++) {
    const y = 60 + row * 23;
    for (let x = -10 + (row % 2) * 13, i = 0; x < 2060; x += 26, i++) {
      const s = row * 977 + i, zone = Math.floor(x / 260), red = zone === 6 && hash(s) > .25, blueBlock = (zone % 2 === 0 && hash(s + 1) > .3);
      const col = red ? '#e8222e' : blueBlock ? (hash(s + 2) > .2 ? '#2a5cff' : '#ffd21f') : personCols[Math.floor(hash(s + 3) * personCols.length)];
      const jy = (hash(s + 4) - .5) * 5, dark = 1 - row / 28 * .35;
      g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(x, y + 16 + jy, 12, 6, 0, 0, TAU); g.fill();
      g.beginPath(); g.roundRect(x - 10, y + jy, 20, 22, 6); g.fillStyle = col; g.fill(); g.lineWidth = 2.4; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.arc(x, y - 6 + jy, 7.5, 0, TAU); g.fillStyle = ['#f0b48a', '#c98a5c', '#e8a77a', '#8d5a3a'][Math.floor(hash(s + 5) * 4)]; g.fill(); g.stroke();
      g.beginPath(); g.arc(x, y - 9 + jy, 7.5, Math.PI, TAU); g.fillStyle = ['#221510', '#4a3020', '#b8892a', '#111'][Math.floor(hash(s + 6) * 4)]; g.fill();
      g.fillStyle = `rgba(10,5,40,${.45 * (1 - dark) * 2})`; g.fillRect(x - 12, y - 16 + jy, 24, 40);
    }
  }
  // tifo banner mosaic
  g.save(); g.globalAlpha = .93; g.fillStyle = '#ffd21f'; g.fillRect(720, 260, 560, 210); g.fillStyle = '#1c47e0'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(720 + i * 70, 260); g.lineTo(720 + i * 70 + 35, 260); g.lineTo(720 + i * 70 + 35 - 40, 470); g.lineTo(720 + i * 70 - 40, 470); g.fill(); }
  g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(720, 260, 560, 210); g.restore();
  g.font = '900 120px Rubik'; g.textAlign = 'center'; g.direction = 'rtl'; g.textBaseline = 'middle'; g.lineWidth = 16; g.lineJoin = 'round'; g.strokeStyle = INK; g.strokeText('GOTV', 1000, 365); g.fillStyle = '#fff'; g.fillText('GOTV', 1000, 365);
  // haze at top
  g.fillStyle = lg(g, 0, 0, 0, 200, [[0, 'rgba(255,140,80,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, 2048, 200);
});
const crowdArms = () => A.layer('s6crowdA', 2048, 700, g => {
  for (let row = 0; row < 28; row++) {
    const y = 60 + row * 23;
    for (let x = -10 + (row % 2) * 13, i = 0; x < 2060; x += 26, i++) {
      const s = row * 977 + i; if (hash(s + 9) < .3) continue;
      g.lineCap = 'round'; for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x + sg * 8, y + 6); g.lineTo(x + sg * (12 + hash(s + 10) * 4), y - 24 - hash(s + 11) * 8); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 3.4; g.strokeStyle = '#e8a77a'; g.stroke(); }
      if (hash(s + 12) > .78) { g.beginPath(); g.roundRect(x - 14, y - 42, 28, 12, 3); g.fillStyle = personCols[Math.floor(hash(s + 13) * 7)]; g.fill(); g.lineWidth = 2.5; g.strokeStyle = INK; g.stroke(); }
    }
  }
});
const boardTex = () => A.layer('s6boards', 2400, 100, g => {
  const names = ['gotv', 'sport5', 'gotv', 'sport5live', 'gotv', 'sport5', 'gotv', 'sport5plus'];
  for (let i = 0; i < 8; i++) {
    const x = i * 300, isG = names[i] === 'gotv';
    g.fillStyle = isG ? lg(g, x, 0, x + 300, 100, [[0, '#0B1450'], [1, '#2F6BFF']]) : lg(g, x, 0, x, 100, [[0, '#ffffff'], [1, '#dfe6ff']]); g.fillRect(x, 0, 300, 100);
    g.fillStyle = '#FFC24A'; g.fillRect(x, 0, 300, 8); g.fillRect(x, 92, 300, 8);
    if (isG) V.logo(g, x + 150, 52, 230, { glow: 0, shine: -1 }); else V.drawLogo(g, names[i], x + 150, 52, 250, 70, { shadow: false });
    g.fillStyle = INK; g.fillRect(x, 0, 4, 100);
  }
});
// ---- pitch & stadium
function drawWorld(ctx, v, excite) {
  const c = CAM, hz = pj([c.p[0] + c.F[0] * 3000, 0, c.p[2] + c.F[2] * 3000]);
  const hy = hz ? hz.y : (c.F[1] < 0 ? -2000 : 4000);
  ctx.fillStyle = lg(ctx, 0, hy - 1500, 0, hy + 20, [[0, '#1a0f48'], [.55, '#8a3a86'], [.85, '#ff9a55'], [1, '#ffd08a']]); ctx.fillRect(-300, -1500, 1680, 4400);
  ctx.fillStyle = '#12703a'; ctx.fillRect(-300, Math.max(hy, -1500), 1680, 4400);
}
// dedicated: proper ordering of stand corners handled below
function drawStands(ctx, v, excite) {
  const bob = Math.sin(v * 9) * excite;
  const TL = [-46, 17, 25], TR = [46, 17, 25], BR = [46, 0.6, 25], BL = [-46, 0.6, 25];
  quadTex(ctx, crowdTex(), [TL, TR, BR, BL], 18, 6);
  if (excite > 0.02) { ctx.save(); ctx.globalAlpha = clamp(excite); quadTex(ctx, crowdArms(), [[-46, 17 + bob * .5, 25], [46, 17 + bob * .5, 25], BR, BL], 18, 6); ctx.restore(); }
  // side stands
  quadTex(ctx, crowdTex(), [[-40, 14, 25], [-40, 14, -30], [-40, .6, -30], [-40, .6, 25]], 8, 4, [0, 0, 1400, 700]);
  quadTex(ctx, crowdTex(), [[40, 14, -30], [40, 14, 25], [40, .6, 25], [40, .6, -30]], 8, 4, [600, 0, 1400, 700]);
  // ad boards
  quadTex(ctx, boardTex(), [[-24, 1.05, 16], [24, 1.05, 16], [24, 0, 16], [-24, 0, 16]], 16, 1);
}
function drawPitch(ctx, v) {
  for (let k = -12; k < 6; k++) { const z0 = k * 5.5, z1 = z0 + 5.5; fillW(ctx, [[-44, 0, z0], [44, 0, z0], [44, 0, z1], [-44, 0, z1]], k & 1 ? '#1f9d4b' : '#279e4e'); }
  const line = (x0, z0, x1, z1, w = .13) => { const dz = z1 - z0, dx = x1 - x0, L = Math.hypot(dx, dz), nx = -dz / L * w / 2, nz = dx / L * w / 2; fillW(ctx, [[x0 + nx, 0.01, z0 + nz], [x1 + nx, .01, z1 + nz], [x1 - nx, .01, z1 - nz], [x0 - nx, .01, z0 - nz]], 'rgba(255,255,255,.92)'); };
  line(-44, 11, 44, 11); line(-20.16, -5.5, 20.16, -5.5); line(-20.16, -5.5, -20.16, 11); line(20.16, -5.5, 20.16, 11); line(-9.16, 5.5, 9.16, 5.5); line(-9.16, 5.5, -9.16, 11); line(9.16, 5.5, 9.16, 11);
  let pz = null; for (let a = -.9; a <= .9; a += .09) { const x = Math.sin(a) * 9.15, z = -Math.cos(a) * 9.15 * -1 * -1; const zz = Math.cos(a) * -9.15; if (pz && zz < -5.5 + 0) line(pz[0], pz[1], x, zz, .13); pz = [x, zz]; }
  const sp = []; for (let i = 0; i < 12; i++) sp.push([Math.cos(i / 12 * TAU) * .17, .012, Math.sin(i / 12 * TAU) * .17]); fillW(ctx, sp, '#fff');
}
// ---- goal & net
function netRip(x, y, tau, hx, hy) { if (tau < 0) return 0; const d = Math.hypot(x - hx, y - hy); return (.85 * Math.exp(-tau * 1.6) + .3 * Math.exp(-tau * 3) * Math.cos(d * 4.4 - tau * 24)) * Math.exp(-d * .5); }
function drawNet(ctx, tau, mode) {
  const X = 3.66, Hh = 2.44, Z0 = 11, D = 2.2, hx = 2.85, hy = 2.05, nx = 22, ny = 9;
  const pt = (x, y, z, back) => pj([x, y, z + (back ? netRip(x, y, tau, hx, hy) : 0)]);
  ctx.save(); ctx.lineWidth = tau > 0 ? 2.6 : 2; ctx.strokeStyle = `rgba(255,255,255,${tau > 0 ? .78 : .5})`;
  const poly = pts => { ctx.beginPath(); let st = false; for (const p of pts) { if (!p) { st = false; continue; } if (!st) { ctx.moveTo(p.x, p.y); st = true; } else ctx.lineTo(p.x, p.y); } ctx.stroke(); };
  if (mode === 'back') {
    for (let i = 0; i <= nx; i++) { const x = -X + i / nx * 2 * X; poly(Array.from({ length: ny + 1 }, (_, j) => pt(x, j / ny * Hh, Z0 + D, true))); }
    for (let j = 0; j <= ny; j++) { const y = j / ny * Hh; poly(Array.from({ length: nx + 1 }, (_, i) => pt(-X + i / nx * 2 * X, y, Z0 + D, true))); }
    for (const sx of [-X, X]) { for (let i = 0; i <= 5; i++) { const z = Z0 + i / 5 * D; poly(Array.from({ length: ny + 1 }, (_, j) => pt(sx, j / ny * Hh, z, true))); } for (let j = 0; j <= ny; j += 1) poly(Array.from({ length: 6 }, (_, i) => pt(sx, j / ny * Hh, Z0 + i / 5 * D, true))); }
    for (let i = 0; i <= 8; i++) { const x = -X + i / 8 * 2 * X; poly(Array.from({ length: 6 }, (_, k) => pt(x, Hh, Z0 + k / 5 * D, true))); }
    for (let k = 0; k <= 5; k++) poly(Array.from({ length: nx + 1 }, (_, i) => pt(-X + i / nx * 2 * X, Hh, Z0 + k / 5 * D, true)));
  } else {
    const pl = (a, b, w) => { const A2 = pj(a), B2 = pj(b); if (!A2 || !B2) return; const wa = w * A2.k, wb = w * B2.k; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(wa, wb) + 8; ctx.beginPath(); ctx.moveTo(A2.x, A2.y); ctx.lineTo(B2.x, B2.y); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(wa, wb); ctx.stroke(); ctx.strokeStyle = 'rgba(170,190,255,.9)'; ctx.lineWidth = Math.max(2, Math.max(wa, wb) * .25); ctx.beginPath(); ctx.moveTo(A2.x + wa * .22, A2.y); ctx.lineTo(B2.x + wb * .22, B2.y); ctx.stroke(); };
    pl([-X, 0, Z0 + D], [-X, 0, Z0], .11); pl([X, 0, Z0 + D], [X, 0, Z0], .11);
    pl([-X, 0, Z0], [-X, Hh, Z0], .13); pl([X, 0, Z0], [X, Hh, Z0], .13); pl([-X - .06, Hh, Z0], [X + .06, Hh, Z0], .13);
    pl([-X, Hh, Z0], [-X, .0, Z0 + D], .05); pl([X, Hh, Z0], [X, 0, Z0 + D], .05);
  }
  ctx.restore();
}
// ---- floodlights + flares
function drawLights(ctx, v) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, z] of [[-34, 27], [-12, 27], [12, 27], [34, 27]]) { const p = pj([x, 21, z]); if (!p) continue; const r = 3200 / p.z; const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gg.addColorStop(0, 'rgba(255,255,240,.95)'); gg.addColorStop(.15, 'rgba(255,230,180,.55)'); gg.addColorStop(1, 'rgba(255,180,120,0)'); ctx.fillStyle = gg; ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
    ctx.strokeStyle = 'rgba(255,255,230,.35)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + .2; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(a) * r * 1.4, p.y - Math.sin(a) * r * 1.4); ctx.lineTo(p.x + Math.cos(a) * r * 1.4, p.y + Math.sin(a) * r * 1.4); ctx.stroke(); } }
  ctx.restore();
}
function drawFlares(ctx, v, amt) {
  if (amt < .02) return; ctx.save();
  for (let i = 0; i < 9; i++) { const x = -30 + i * 7.5 + hash(i) * 3, p = pj([x, 3 + hash(i + 4) * 3, 24]); if (!p) continue; const col = i % 3 ? '#ff2a2a' : '#ff8a1a', r = 1600 / p.z;
    ctx.globalCompositeOperation = 'source-over'; for (let k = 0; k < 4; k++) { ctx.globalAlpha = .13 * amt; ctx.fillStyle = i % 3 ? '#a01818' : '#b04a10'; ctx.beginPath(); ctx.arc(p.x + Math.sin(v * 2 + k + i) * 30, p.y - k * r * .5 - (v * 40 + i * 20) % 60, r * (.5 + k * .25), 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * .9); gg.addColorStop(0, '#fff'); gg.addColorStop(.25, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r); }
  ctx.restore();
}

// ---------------------------------------------------------------- figures (3D skeleton, cel-shaded)
const LEN = { th: .46, sh: .46, to: .56, ua: .30, fa: .30 };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
function xf(p, P) {
  let [x, y, z] = p;
  if (P.tilt) { const c = Math.cos(P.tilt), s = Math.sin(P.tilt); [x, y] = [x * c - y * s, x * s + y * c]; }
  if (P.pitch) { const c = Math.cos(P.pitch), s = Math.sin(P.pitch); [y, z] = [y * c - z * s, y * s + z * c]; }
  y += P.hipY; { const c = Math.cos(P.yaw), s = Math.sin(P.yaw); [x, z] = [x * c + z * s, -x * s + z * c]; }
  return [x + P.x, y + P.y0, z + P.z];
}
function fk(P) {
  const J = {}; const legs = [];
  for (const sg of [-1, 1]) {
    const L = sg < 0 ? P.legL : P.legR, ab = L.ab || 0, hip = [sg * .1, 0, 0];
    const d1 = [sg * Math.sin(ab), -Math.cos(ab) * Math.cos(L.a), Math.cos(ab) * Math.sin(L.a)], knee = add(hip, mul(d1, LEN.th)), s = L.a - L.k;
    const d2 = [sg * Math.sin(ab), -Math.cos(ab) * Math.cos(s), Math.cos(ab) * Math.sin(s)], ankle = add(knee, mul(d2, LEN.sh)), fs = s + (L.f || 0), toe = add(ankle, [0, Math.sin(fs) * .25 - .03, Math.cos(fs) * .25]);
    legs.push({ hip, knee, ankle, toe });
  }
  if (P.hipY == null) { let low = 9; for (const l of legs) low = Math.min(low, l.ankle[1] - .07, l.knee[1] - .1, l.toe[1] - .02); P.hipYv = -low; } else P.hipYv = P.hipY;
  const Q = Object.assign({}, P, { hipY: P.hipYv });
  const W = p => xf(p, Q);
  J.hipL = W(legs[0].hip); J.hipR = W(legs[1].hip); J.hipC = W([0, 0, 0]);
  J.kneeL = W(legs[0].knee); J.kneeR = W(legs[1].knee); J.ankL = W(legs[0].ankle); J.ankR = W(legs[1].ankle); J.toeL = W(legs[0].toe); J.toeR = W(legs[1].toe);
  const lean = P.lean || 0, neck = [0, LEN.to * Math.cos(lean), LEN.to * Math.sin(lean)];
  J.neck = W(neck); J.shL = W(add(neck, [-.2, -.04, 0])); J.shR = W(add(neck, [.2, -.04, 0]));
  const arm = (sg, Ar, sh) => { const ab = Ar.ab || 0, a = Ar.a + lean, d1 = [sg * Math.sin(ab), -Math.cos(ab) * Math.cos(a), Math.cos(ab) * Math.sin(a)], el = add(sh, mul(d1, LEN.ua)), fs = a + (Ar.e || 0), d2 = [sg * Math.sin(ab), -Math.cos(ab) * Math.cos(fs), Math.cos(ab) * Math.sin(fs)]; return [W(el), W(add(el, mul(d2, LEN.fa)))]; };
  const sL = add(neck, [-.2, -.04, 0]), sR = add(neck, [.2, -.04, 0]);
  [J.elL, J.haL] = arm(-1, P.armL, sL); [J.elR, J.haR] = arm(1, P.armR, sR);
  const ht = lean + (P.headT || 0); J.head = W(add(neck, [0, .21 * Math.cos(ht), .21 * Math.sin(ht)]));
  J.yaw = P.yaw + (P.headYaw || 0);
  return J;
}
function shadeCol(c) { return c; }
function cap(ctx, a, b, wa, wb, col, o = {}) {
  const ra = wa * a.k / 2, rb = wb * b.k / 2; let dx = b.x - a.x, dy = b.y - a.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const nx = -dy, ny = dx, an = Math.atan2(ny, nx);
  const path = () => { ctx.beginPath(); ctx.moveTo(a.x + nx * ra, a.y + ny * ra); ctx.lineTo(b.x + nx * rb, b.y + ny * rb); ctx.arc(b.x, b.y, rb, an, an - Math.PI, true); ctx.lineTo(a.x - nx * ra, a.y - ny * ra); ctx.arc(a.x, a.y, ra, an + Math.PI, an, true); ctx.closePath(); };
  const ink = Math.max(2.5, (ra + rb) * .13 + (o.ink || 0));
  path(); ctx.lineJoin = 'round'; ctx.lineWidth = ink * 2; ctx.strokeStyle = mc(INK); ctx.stroke(); ctx.fillStyle = mc(col); ctx.fill();
  if (MONO) return;
  ctx.save(); path(); ctx.clip();
  const s = (nx * -.55 + ny * -.83) > 0 ? 1 : -1, sh = [-s * nx, -s * ny], big = Math.max(ra, rb) * 3;
  ctx.fillStyle = 'rgba(25,10,70,.36)'; ctx.beginPath(); ctx.moveTo(a.x + sh[0] * ra * .12, a.y + sh[1] * ra * .12); ctx.lineTo(b.x + sh[0] * rb * .12, b.y + sh[1] * rb * .12); ctx.lineTo(b.x + sh[0] * big, b.y + sh[1] * big); ctx.lineTo(a.x + sh[0] * big, a.y + sh[1] * big); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,244,205,.8)'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.6, Math.min(ra, rb) * .3); const lx = -sh[0], ly = -sh[1];
  ctx.beginPath(); ctx.moveTo(a.x + lx * ra * .78, a.y + ly * ra * .78); ctx.lineTo(b.x + lx * rb * .78, b.y + ly * rb * .78); ctx.stroke(); ctx.restore();
}
const lerp2 = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), k: lerp(a.k, b.k, t), z: lerp(a.z, b.z, t) });
function figure(ctx, P, kit, camPos) {
  const J = fk(P), pp = {}; for (const k in J) if (Array.isArray(J[k])) pp[k] = pjf(J[k]); if (pp.hipC.z < .2 && pp.head.z < .2) return;
  const items = [], push = (z, fn) => items.push({ z, fn });
  for (const sd of ['L', 'R']) {
    const hip = pp['hip' + sd], kn = pp['knee' + sd], an = pp['ank' + sd], toe = pp['toe' + sd], mid = lerp2(hip, kn, .58);
    push((hip.z + kn.z) / 2, () => { cap(ctx, hip, mid, .2, .17, kit.shorts); cap(ctx, mid, kn, .16, .13, kit.skin); });
    push((kn.z + an.z) / 2, () => { cap(ctx, kn, an, .125, .1, kit.sock); });
    push((an.z + toe.z) / 2 + .01, () => { cap(ctx, an, toe, .1, .085, kit.boot); if (!MONO) { const mm = lerp2(an, toe, .55); cap(ctx, mm, toe, .04, .04, kit.boot2, { ink: -1 }); } });
  }
  push((pp.shL.z + pp.shR.z + pp.hipL.z + pp.hipR.z) / 4, () => torso(ctx, J, pp, kit, camPos, P));
  push(pp.hipC.z, () => { const h = pp.hipC, r = .16 * h.k; ctx.beginPath(); ctx.ellipse(h.x, h.y, r, r * .8, 0, 0, TAU); ctx.fillStyle = mc(kit.shorts); ctx.fill(); ctx.lineWidth = Math.max(2.5, r * .16); ctx.strokeStyle = mc(INK); ctx.stroke(); });
  for (const sd of ['L', 'R']) {
    const sh = pp['sh' + sd], el = pp['el' + sd], ha = pp['ha' + sd], mid = lerp2(sh, el, .5);
    push((sh.z + el.z) / 2, () => { cap(ctx, sh, mid, .12, .105, kit.shirt); cap(ctx, mid, el, .105, .09, kit.skin); });
    push((el.z + ha.z) / 2 + .01, () => { cap(ctx, el, ha, .09, .075, kit.skin); const r = (kit.glove ? .1 : .06) * ha.k; ctx.beginPath(); ctx.arc(ha.x, ha.y, r, 0, TAU); ctx.fillStyle = mc(kit.glove || kit.skin); ctx.fill(); ctx.lineWidth = Math.max(2.5, r * .2); ctx.strokeStyle = mc(INK); ctx.stroke(); if (kit.glove && !MONO) { ctx.beginPath(); ctx.arc(ha.x, ha.y, r * .62, .3, 2.2); ctx.lineWidth = r * .28; ctx.strokeStyle = kit.glove2; ctx.stroke(); } });
  }
  push(pp.head.z - .05, () => head(ctx, J, pp, kit, camPos, P));
  items.sort((a, b) => b.z - a.z); items.forEach(it => it.fn());
}
function torso(ctx, J, pp, kit, camPos, P) {
  const sl = pp.shL, sr = pp.shR, hl = pp.hipL, hr = pp.hipR, nk = pp.neck;
  const sw = Math.hypot(sl.x - sr.x, sl.y - sr.y), tl = Math.hypot((sl.x + sr.x) / 2 - (hl.x + hr.x) / 2, (sl.y + sr.y) / 2 - (hl.y + hr.y) / 2), minW = tl * .28;
  // widen when edge on
  const mx = (sl.x + sr.x) / 2, my = (sl.y + sr.y) / 2, hx = (hl.x + hr.x) / 2, hy = (hl.y + hr.y) / 2, ax = mx - hx, ay = my - hy, al = Math.hypot(ax, ay) || 1, px = -ay / al, py = ax / al;
  const wS = Math.max(sw, minW * 1.2) / 2, wH = Math.max(Math.hypot(hl.x - hr.x, hl.y - hr.y), minW) / 2 * 1.08;
  const dirx = (sr.x - sl.x) >= 0 ? 1 : -1;
  const S1 = [mx - px * wS * (px * (sr.x - sl.x) + py * (sr.y - sl.y) >= 0 ? 1 : -1) * -1, 0];
  const pts = [[mx + px * wS, my + py * wS], [mx - px * wS, my - py * wS], [hx - px * wH, hy - py * wH], [hx + px * wH, hy + py * wH]];
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(nk.x, nk.y - .02 * nk.k, pts[1][0], pts[1][1]); ctx.quadraticCurveTo((pts[1][0] + pts[2][0]) / 2 - px * wS * .12, (pts[1][1] + pts[2][1]) / 2 - py * wS * .12, pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.quadraticCurveTo((pts[0][0] + pts[3][0]) / 2 + px * wS * .12, (pts[0][1] + pts[3][1]) / 2 + py * wS * .12, pts[0][0], pts[0][1]); ctx.closePath(); };
  path(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, wS * .1); ctx.strokeStyle = mc(INK); ctx.stroke(); ctx.fillStyle = mc(kit.shirt); ctx.fill();
  if (MONO) return;
  ctx.save(); path(); ctx.clip();
  const s = (px * -.55 + py * -.83) > 0 ? 1 : -1;
  ctx.fillStyle = 'rgba(25,10,70,.34)'; ctx.beginPath(); ctx.moveTo(mx - s * px * wS * .15, my - s * py * wS * .15); ctx.lineTo(hx - s * px * wH * .15, hy - s * py * wH * .15); ctx.lineTo(hx - s * px * wH * 2, hy - s * py * wH * 2); ctx.lineTo(mx - s * px * wS * 2, my - s * py * wS * 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,244,205,.8)'; ctx.lineWidth = Math.max(1.6, wS * .1); ctx.beginPath(); ctx.moveTo(mx + s * px * wS * .85, my + s * py * wS * .85); ctx.lineTo(hx + s * px * wH * .85, hy + s * py * wH * .85); ctx.stroke();
  // trim stripe
  ctx.strokeStyle = kit.trim; ctx.lineWidth = wS * .16; ctx.beginPath(); ctx.moveTo(mx - ax * .5 * 0 - px * wS * .1, my - py * wS * .1 - ay * .0); ctx.moveTo(lerp(hx, mx, .78) - px * wS, lerp(hy, my, .78) - py * wS); ctx.lineTo(lerp(hx, mx, .78) + px * wS, lerp(hy, my, .78) + py * wS); ctx.stroke();
  // number when the back faces the camera
  const yaw = P.yaw, toCamx = camPos[0] - J.hipC[0], toCamz = camPos[2] - J.hipC[2], fx = Math.sin(yaw), fz = Math.cos(yaw), facing = (fx * toCamx + fz * toCamz) / (Math.hypot(toCamx, toCamz) || 1);
  if (kit.num && facing < -.35 && wS > 6) { ctx.save(); ctx.translate(lerp(hx, mx, .55), lerp(hy, my, .55)); ctx.rotate(Math.atan2(ay, ax) + Math.PI / 2 + Math.PI); ctx.rotate(Math.PI); ctx.font = `900 ${wS * 1.05}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = wS * .14; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(kit.num, 0, 0); ctx.fillStyle = kit.trim; ctx.fillText(kit.num, 0, 0); ctx.restore(); }
  ctx.restore();
}
function head(ctx, J, pp, kit, camPos, P) {
  const h = pp.head, r = .118 * h.k, yaw = J.yaw, tx = camPos[0] - J.head[0], tz = camPos[2] - J.head[2], tl = Math.hypot(tx, tz) || 1;
  const cs = (Math.sin(yaw) * tx + Math.cos(yaw) * tz) / tl, sn = (Math.cos(yaw) * tx - Math.sin(yaw) * tz) / tl;   // cs>0 face toward camera, sn = lateral
  const rot = P.headRot || 0;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(rot);
  ctx.beginPath(); ctx.ellipse(0, 0, r * .92, r * 1.05, 0, 0, TAU); ctx.fillStyle = mc(kit.skin); ctx.fill(); ctx.lineWidth = Math.max(3, r * .14); ctx.strokeStyle = mc(INK); ctx.stroke();
  if (!MONO) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r * .92, r * 1.05, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(25,10,70,.3)'; ctx.fillRect(r * .15, -r * 2, r * 3, r * 4); ctx.restore();
    if (cs > .05) {
      const fxx = -sn * r * .55;
      ctx.fillStyle = INK; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fxx + sg * r * .33 * Math.abs(cs), r * .05, r * .09, r * .15, 0, 0, TAU); ctx.fill(); }
      if (P.mouth) { ctx.beginPath(); ctx.ellipse(fxx, r * .5, r * .22 * Math.abs(cs), r * .2 * P.mouth, 0, 0, TAU); ctx.fillStyle = '#4a0a18'; ctx.fill(); ctx.lineWidth = r * .07; ctx.stroke(); }
      ctx.lineWidth = r * .09; ctx.strokeStyle = INK; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fxx + sg * r * .5 * Math.abs(cs), -r * .28 - (P.angry ? sg * r * .05 : 0)); ctx.lineTo(fxx + sg * r * .16 * Math.abs(cs), -r * .18 + (P.angry ? sg * r * .1 : 0)); ctx.stroke(); }
    }
  }
  // hair cap
  ctx.beginPath(); ctx.ellipse(0, -r * .12, r * .98, r * (cs > .1 ? .74 : 1.06), 0, Math.PI, TAU); if (cs <= .1) { ctx.ellipse(0, -r * .1, r * .96, r * 1.03, 0, 0, TAU); }
  ctx.fillStyle = mc(kit.hair); ctx.fill(); ctx.lineWidth = Math.max(3, r * .12); ctx.strokeStyle = mc(INK); ctx.stroke();
  if (!MONO) { ctx.strokeStyle = 'rgba(255,240,200,.55)'; ctx.lineWidth = r * .09; ctx.beginPath(); ctx.arc(0, -r * .1, r * .8, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); }
  ctx.restore();
}
const KIT_STRIKER = { shirt: '#FFD21F', shorts: '#1c3fd8', sock: '#FFD21F', boot: '#161226', boot2: '#3dffb0', skin: '#e8a77a', hair: '#2a1a12', trim: '#1c3fd8', num: '10' };
const KIT_KEEPER = { shirt: '#e8202e', shorts: '#15121f', sock: '#e8202e', boot: '#161226', boot2: '#ffd21f', skin: '#d69466', hair: '#d9b24a', trim: '#ffffff', glove: '#f4f6ff', glove2: '#3dd684', num: '1' };

// ---- poses
const ARM0 = { a: 0, e: 0, ab: .12 }, LEG0 = { a: 0, k: 0, ab: .08 };
function strikerPose(v) {
  const P = { x: 0, z: 0, yaw: 0, y0: 0, lean: .06, headT: 0, tilt: 0, pitch: 0, hipY: null, legL: Object.assign({}, LEG0), legR: Object.assign({}, LEG0), armL: Object.assign({}, ARM0), armR: Object.assign({}, ARM0) };
  const idle = v < 27.5;
  const pos = K(v, [[27.14, [-1.0, -3.4]], [27.5, [-1.0, -3.4]], [28.0, [-.34, -.3]], [28.3, [-.34, -.2]]], 'lin');
  P.x = pos[0]; P.z = pos[1]; P.yaw = K(v, [[27.5, .34], [28.0, .55], [29.0, .55], [29.3, 1.0]], 'inOut');
  if (v < 27.5) { const b = Math.sin(v * 5); P.lean = .07 + .02 * b; P.headT = .03 * b; P.armL = { a: -.2, e: 1.2, ab: .55 }; P.armR = { a: -.2, e: 1.2, ab: .55 }; P.legL.ab = .16; P.legR.ab = .16; }
  else if (v < 28.0) {
    const ph = (v - 27.5) * 5.4 * Math.PI, sw = .85;
    P.lean = .28; P.legL = { a: Math.sin(ph) * sw, k: Math.max(0, -Math.sin(ph)) * 1.4 + .15, ab: .05 }; P.legR = { a: -Math.sin(ph) * sw, k: Math.max(0, Math.sin(ph)) * 1.4 + .15, ab: .05 };
    P.armL = { a: -Math.sin(ph) * .8, e: .9, ab: .1 }; P.armR = { a: Math.sin(ph) * .8, e: .9, ab: .1 };
  } else if (v < 29.0) {
    // kick
    const ra = K(v, [[27.96, .5], [28.0, -1.0], [28.03, -1.2], [28.05, .38], [28.12, .95], [28.3, 1.2], [28.9, .3]], 'inOut'), rk = K(v, [[27.96, 1.2], [28.0, 1.9], [28.03, 2.15], [28.05, .18], [28.12, .1], [28.3, .3], [28.9, .7]], 'inOut');
    P.legR = { a: ra, k: rk, ab: .04, f: K(v, [[28.03, -.2], [28.05, -.5], [28.2, -.2]], 'inOut') };
    P.legL = { a: .12, k: .32, ab: .1 }; P.lean = K(v, [[28.0, .3], [28.05, .18], [28.3, .12], [29.0, .08]]);
    P.armL = { a: .2, e: .4, ab: 1.25 }; P.armR = { a: -.5, e: .8, ab: .5 };
    const hop = v > 28.12 && v < 28.6 ? Math.sin(inv(28.12, 28.6, v) * Math.PI) * .12 : 0; P.y0 = hop; P.headT = -.05;
  } else {
    // celebration run and knee slide
    const run = K(v, [[29.0, [-.34, -.2]], [29.95, [-1.4, 7.6]], [30.4, [-1.9, 8.4]]], 'lin'), u = inv(29.0, 29.95, v);
    const p2 = K(v, [[29.0, [-.34, -.2]], [29.95, [-1.4, 7.6]]], 'inOut'); P.x = p2[0]; P.z = p2[1];
    if (v > 29.95) { const s = K(v, [[29.95, 0], [30.45, 1]], 'out'); P.x = lerp(-1.4, -1.9, s); P.z = lerp(7.6, 8.4, s); }
    P.yaw = K(v, [[29.0, .5], [29.05, -.1], [29.6, -.1], [29.95, 2.1], [30.4, 2.19]], 'inOut');
    if (v < 29.95) { const ph = (v - 29.0) * 5.8 * Math.PI, sw = 1.0; P.lean = .35; P.legL = { a: Math.sin(ph) * sw, k: Math.max(0, -Math.sin(ph)) * 1.6 + .2, ab: .05 }; P.legR = { a: -Math.sin(ph) * sw, k: Math.max(0, Math.sin(ph)) * 1.6 + .2, ab: .05 }; P.armL = { a: -Math.sin(ph) * .5, e: 1.6, ab: .3 + u * .4 }; P.armR = { a: Math.sin(ph) * .5, e: 1.6, ab: .3 + u * .4 }; P.mouth = .9; }
    else {
      const s = eo(inv(29.95, 30.2, v)), ex = HOLD ? Math.sin(HU * TAU * 2) : 0;
      P.lean = lerp(.3, -.32, s); P.headT = lerp(0, -.5, s); P.legL = { a: 0, k: lerp(.4, 1.7, s), ab: .1 }; P.legR = { a: .15, k: lerp(.4, 1.9, s), ab: .1 };
      P.armL = { a: 0, e: 0, ab: lerp(.4, 2.2, s) + .05 * ex }; P.armR = { a: 0, e: 0, ab: lerp(.4, 2.2, s) - .05 * ex }; P.mouth = 1; P.headRot = -.1 * s;
    }
    P.angry = false;
  }
  return P;
}
function keeperPose(v, ex) {
  const P = { x: 0, z: 11.05, yaw: Math.PI, y0: 0, lean: .3, headT: -.2, tilt: 0, pitch: 0, hipY: null, legL: { a: .55, k: 1.0, ab: .35 }, legR: { a: .55, k: 1.0, ab: .35 }, armL: { a: .2, e: .9, ab: 1.0 }, armR: { a: .2, e: .9, ab: 1.0 } };
  const b = Math.sin(v * 9) * .06; P.legL.k += b; P.legR.k -= b; P.armL.ab += b; P.armR.ab -= b;
  if (v > 28.28) {
    const u = inv(28.28, 29.0, v), dv = eo(u);
    P.x = -2.15 * eo(inv(28.28, 29.1, v)); P.tilt = -1.55 * eo(inv(28.28, 28.85, v)); P.hipY = lerp(.85, .7, u);
    const air = Math.sin(clamp(inv(28.28, 29.15, v)) * Math.PI); P.y0 = 0.35 * air; P.hipY = .5 + .3 * (1 - eo(inv(28.28, 28.6, v)));
    P.legL = { a: lerp(.55, .25, dv), k: lerp(1, .2, dv), ab: .2 }; P.legR = { a: lerp(.55, -.1, dv), k: lerp(1, .5, dv), ab: .2 };
    P.armL = { a: 0, e: 0, ab: lerp(1.0, 3.0, dv) }; P.armR = { a: 0, e: 0, ab: lerp(1.0, 3.0, dv) }; P.lean = lerp(.3, 0, dv); P.headT = 0;
  }
  if (v > 29.28) { const u = inv(29.28, 29.7, v); P.y0 = lerp(.2, 0, u); P.hipY = lerp(.5, .3, u); P.armL = { a: 0, e: 0, ab: lerp(3.0, 2.4, u) }; P.armR = { a: 0, e: 0, ab: lerp(3.0, 2.6, u) }; }
  return P;
}
// ---- ball
const ICO = (() => { const f = (1 + Math.sqrt(5)) / 2, a = []; for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { a.push([0, s1, s2 * f], [s1, s2 * f, 0], [s2 * f, 0, s1]); } return a.map(p => { const l = Math.hypot(...p); return p.map(x => x / l); }); })();
function ballPos(v) {
  if (v < T_STRIKE) return [0, .11, 0];
  if (v <= T_GOAL) {
    const w = K(v, [[T_STRIKE, 0], [28.3, .34], [28.55, .5], [T_SMASH, .6], [T_GOAL, 1]], 'lin');
    return [2.85 * Math.pow(w, 1.15), .11 + 1.94 * w + 1.3 * Math.sin(Math.PI * w) * (1 - .3 * w), 11 * w];
  }
  const tau = v - T_GOAL; return [2.85 + .25 * tau, Math.max(.11, 2.05 - 4.4 * tau * tau), 11 + 1.15 * (1 - Math.exp(-tau * 5)) + Math.min(tau, .9) * .15];
}
function drawBall(ctx, v, opt = {}) {
  const b = ballPos(v), p = pj(b); if (!p) return; const r = .11 * p.k * (opt.sc || 1);
  const spin = v < T_STRIKE ? 0 : (v - T_STRIKE) * 7, sq = opt.sq || 0;
  ctx.save(); ctx.translate(p.x, p.y);
  if (opt.dir) ctx.rotate(opt.dir); ctx.scale(1 + sq * .35, 1 - sq * .3); if (opt.dir) ctx.rotate(-opt.dir);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = MONO === 2 ? '#000' : rg(ctx, -r * .3, -r * .35, r * .1, r * 1.1, [[0, '#ffffff'], [.7, '#e6ecff'], [1, '#9fb0e0']]); ctx.fill();
  ctx.save(); ctx.clip();
  const ca = Math.cos(spin), sa = Math.sin(spin);
  for (const q of ICO) { let x = q[0] * ca + q[2] * sa, z = -q[0] * sa + q[2] * ca, y = q[1]; const y2 = y * Math.cos(.5) - z * Math.sin(.5), z2 = y * Math.sin(.5) + z * Math.cos(.5); if (z2 < .02) continue; const px = x * r, py = y2 * r, ang = Math.atan2(py, px), d = Math.hypot(px, py); ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0, 0, r * .33 * z2 + 1, r * .33, 0, 0, TAU); ctx.fillStyle = MONO === 2 ? '#fff' : '#1a1430'; ctx.fill(); ctx.restore(); }
  if (!MONO) { ctx.fillStyle = 'rgba(25,10,80,.32)'; ctx.beginPath(); ctx.arc(r * .55, r * .55, r * 1.15, 0, TAU); ctx.arc(0, 0, r * 1.02, 0, TAU, true); ctx.fill(); }
  ctx.restore();
  ctx.lineWidth = Math.max(3, r * .11); ctx.strokeStyle = MONO === 2 ? '#fff' : INK; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  if (!MONO) { ctx.beginPath(); ctx.arc(0, 0, r * .86, Math.PI * 1.05, Math.PI * 1.45); ctx.lineWidth = r * .09; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke(); }
  ctx.restore();
}
function ballTrail(ctx, v, cols) {
  if (v < T_STRIKE + .01 || v > T_GOAL + .08) return; const pts = [];
  for (let i = 0; i <= 16; i++) { const tt = Math.max(T_STRIKE, v - i * .022), p = pj(ballPos(tt)); if (!p) return; pts.push(p); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 15; i >= 0; i--) { const a = 1 - i / 16, w = pts[i].k * .11 * 1.7 * a; ctx.strokeStyle = i % 2 ? cols[0] : cols[1]; ctx.globalAlpha = a * .65; ctx.lineWidth = Math.max(2, w); ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke(); }
  ctx.restore();
}
function ghostSpinner(ctx, x, y, R, v, al, frozen) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = al; const N = 12, ang = frozen ? .3 : v * 6;
  for (let i = 0; i < N; i++) { const a0 = ang + i * TAU / N, w = TAU / N * .62, b = 1 - i / N * .8; ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + w); ctx.arc(0, 0, R * .72, a0 + w * .9, a0 + w * .1, true); ctx.closePath(); ctx.fillStyle = A.mixc('#4a86d8', '#f4feff', b); ctx.globalAlpha = al * (.45 + .5 * b); ctx.fill(); ctx.lineWidth = Math.max(3, R * .03); ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.globalAlpha = al; ctx.globalCompositeOperation = 'lighter';
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * R * .22, -R * .12); ctx.lineTo(sg * R * .5, -R * .3); ctx.lineTo(sg * R * .42, -R * .06); ctx.closePath(); ctx.fillStyle = '#ff2a55'; ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- camera schedule
function camAt(v) {
  const B = ballPos(v), out = {};
  const shotA = { p: K(v, [[27.14, [1.0, .6, -10.0]], [27.54, [.3, .7, -8.6]]], 'out'), t: K(v, [[27.14, [-.3, 1.0, 5]], [27.54, [-.4, 1.0, 4.4]]], 'out'), f: K(v, [[27.14, 1000], [27.54, 1250]], 'out'), roll: K(v, [[27.14, .13], [27.54, .05]], 'out') };
  const shotB = { p: K(v, [[27.5, [2.2, .3, -.9]], [27.98, [1.6, .25, -.2]], [28.05, [1.35, .2, -.1]]], 'in'), t: K(v, [[27.5, [0, .4, -1.5]], [27.98, [0, .25, -.4]], [28.05, [0, .18, -.05]]], 'in'), f: K(v, [[27.5, 1100], [27.98, 1500], [28.05, 2200]], 'in'), roll: K(v, [[27.5, -.06], [28.05, -.16]], 'in') };
  const off = K(v, [[28.05, [1.35, .09, -.1]], [28.14, [.95, .32, -1.5]], [28.5, [-1.25, .55, -2.3]], [28.85, [-1.6, .38, -1.5]], [29.5, [-1.6, .38, -1.5]]], 'inOut');
  const shotC = { p: add(B, off), t: add(B, [0, .12, .25]), f: K(v, [[28.05, 2200], [28.16, 1250], [28.6, 1500], [28.85, 1800]], 'inOut'), roll: K(v, [[28.05, -.16], [28.2, .08], [28.7, -.12], [28.85, .05]], 'inOut') };
  const shotD = { p: K(v, [[28.8, [-8.6, 1.5, 3.2]], [29.6, [-8.0, 1.4, 4.4]]], 'out'), t: [1.0, 1.3, 11.0], f: K(v, [[28.8, 950], [29.6, 1150]], 'out'), roll: K(v, [[28.8, -.08], [29.6, -.02]], 'out') };
  const shotE = { p: K(v, [[29.5, [4.8, .7, 2.4]], [30.5, [4.0, .75, 4.4]]], 'inOut'), t: K(v, [[29.5, [-1.0, 1.1, 6.6]], [30.5, [-1.8, 1.0, 8.4]]], 'inOut'), f: K(v, [[29.5, 850], [30.5, 1050]], 'inOut'), roll: K(v, [[29.5, .09], [30.5, .03]], 'inOut') };
  const blend = (a, b, w) => ({ p: [0, 1, 2].map(i => lerp(a.p[i], b.p[i], w)), t: [0, 1, 2].map(i => lerp(a.t[i], b.t[i], w)), f: lerp(a.f, b.f, w), roll: lerp(a.roll, b.roll, w) });
  let c;
  if (v < 27.5) c = shotA; else if (v < 28.05) c = shotB; else if (v < 28.8) c = shotC;
  else if (v < 29.5) c = blend(shotC, shotD, smooth(28.8, 28.97, v)); else c = blend(shotD, shotE, smooth(29.5, 29.62, v));
  if (v >= 28.8 && v < 29.5) c = blend(shotC, shotD, smooth(28.8, 28.97, v));
  if (v >= 29.5) c = blend(shotD, shotE, smooth(29.5, 29.62, v));
  if (HOLD && v > 29.9) { const s = Math.sin(HU * TAU); c = { p: [c.p[0] + .35 * s, c.p[1] + .04 * s, c.p[2] + .1 * s], t: [c.t[0] + .2 * s, c.t[1], c.t[2]], f: c.f * (1 + .015 * s), roll: c.roll + .012 * s }; }
  return c;
}

// ---------------------------------------------------------------- overlays
function animeEye(ctx, cx, cy, s, o) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // skin band
  ctx.fillStyle = lg(ctx, 0, -230, 0, 230, [[0, o.skin0 || '#f7c9a2'], [1, o.skin1 || '#e0a074']]); ctx.beginPath(); ctx.roundRect(-460, -210, 920, 420, 60); ctx.fill();
  ctx.fillStyle = 'rgba(120,60,60,.28)'; ctx.beginPath(); ctx.ellipse(0, -160, 330, 70, 0, 0, TAU); ctx.fill();
  const sc = () => { ctx.beginPath(); ctx.moveTo(-260, 14); ctx.bezierCurveTo(-140, -150, 150, -150, 270, -8); ctx.bezierCurveTo(200, 110, -110, 130, -260, 14); ctx.closePath(); };
  sc(); ctx.fillStyle = '#f6f9ff'; ctx.fill(); ctx.save(); sc(); ctx.clip();
  const lx = (o.look || 0) * 40, ly = (o.lookY || 0) * 20;
  ctx.beginPath(); ctx.arc(lx, ly, 112, 0, TAU); ctx.fillStyle = rg(ctx, lx, ly + 30, 10, 115, [[0, o.iris1 || '#9fe6ff'], [.55, o.iris0 || '#2a6cff'], [1, '#0a1240']]); ctx.fill();
  ctx.beginPath(); ctx.arc(lx, ly, 52 * (o.pupil || 1), 0, TAU); ctx.fillStyle = '#05030c'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(lx - 40, ly - 44, 34, 26, -.4, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.arc(lx + 46, ly + 42, 14, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(lx + 8, ly + 66, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(ctx, 0, -150, 0, -30, [[0, 'rgba(20,10,40,.6)'], [1, 'rgba(20,10,40,0)']]); ctx.fillRect(-300, -160, 600, 140);
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-270, 18); ctx.bezierCurveTo(-140, -160, 150, -160, 275, -12); ctx.lineTo(330, -52); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-250, 26); ctx.bezierCurveTo(-110, 134, 200, 110, 268, -2); ctx.stroke();
  // brow
  ctx.fillStyle = o.hair || '#2a1a12'; ctx.beginPath(); ctx.moveTo(-300, -170 + (o.brow || 0)); ctx.quadraticCurveTo(0, -250 - (o.brow || 0) * .3, 320, -150 - (o.brow || 0)); ctx.lineTo(320, -190 - (o.brow || 0)); ctx.quadraticCurveTo(0, -300, -300, -215 + (o.brow || 0)); ctx.closePath(); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  if (o.sweat) { const sy = 200 + o.sweat * 100; ctx.save(); ctx.translate(360, sy - 200); ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(38, 0, 0, 34); ctx.quadraticCurveTo(-38, 0, 0, -46); ctx.fillStyle = '#9fe6ff'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(-10, -4, 8, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function panelPoly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
function eyePanels(ctx, v) {
  const gut = 14;
  const A0 = 27.54, B0 = 27.70, out = 27.955;
  const po = smooth(out, 27.99, v);
  const pa = [[0, 0], [1080, 0], [1080, 560], [0, 660]], pb = [[0, 690], [1080, 590], [1080, 1960], [0, 1960]];
  const shake = A.noise1(v * 60) * 5;
  // panel A: striker
  const ta = v - A0;
  if (ta >= 0) {
    const sl = (1 - eo(ta / .09)) * -1300 + po * -1300, sk = ta < .3 ? shake : 0;
    ctx.save(); ctx.translate(sl + sk, po * -160); panelPoly(ctx, pa); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, 0, 0, 660, [[0, '#ffd45a'], [1, '#ff9a2a']]); ctx.fillRect(0, 0, 1080, 700); speedLines(ctx, 540, 320, v, { col: '#fff', alpha: .9, n: 60, r0: 250, len: 900, fps: 12 }); halftone(ctx, .35);
    animeEye(ctx, 540, 330, 1.02, { look: .3 + Math.sin(v * 3) * .05, pupil: .75 + .1 * Math.sin(v * 9), sweat: clamp(ta * 2), brow: 12, iris0: '#2a6cff', iris1: '#9fe6ff' });
    ctx.restore(); ctx.save(); ctx.translate(sl, po * -160); panelPoly(ctx, pa); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    kanaHit(ctx, v, A0 + .04, 'ドクン', 170, 480, 120, { rot: -.15, dur: .42, f0: '#fff', f1: '#2a6cff' });
  }
  const tb = v - B0;
  if (tb >= 0) {
    const sl = (1 - eo(tb / .09)) * 1300 + po * 1300, sk = tb < .3 ? shake : 0;
    ctx.save(); ctx.translate(sl + sk, po * 60); panelPoly(ctx, pb); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, 590, 0, 1250, [[0, '#ff5a5a'], [1, '#a0101e']]); ctx.fillRect(0, 560, 1080, 700); speedLines(ctx, 540, 900, v, { col: '#fff', alpha: .8, n: 60, r0: 250, len: 900, fps: 12, seed: 5 }); halftone(ctx, .4);
    animeEye(ctx, 540, 910, 1.0, { look: -.4 + Math.sin(v * 4) * .06, pupil: .7, brow: 18, iris0: '#b8320a', iris1: '#ffd27a', skin0: '#e2a97a', skin1: '#c98a5c', hair: '#c9a03a', flip: true });
    ctx.restore(); ctx.save(); ctx.translate(sl, po * 60); panelPoly(ctx, pb); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    kanaHit(ctx, v, B0 + .04, 'ドクン', 900, 1060, 120, { rot: .15, dur: .45, f0: '#fff', f1: '#e8202e' });
  }
}
function hudBug(ctx, v, goal) {
  const a = eo((v - 27.2) / .2); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(lerp(300, 0, eo((v - 27.2) / .25)), 0);
  // sport5 broadcast bug top-right
  ctx.fillStyle = 'rgba(8,14,40,.82)'; ctx.beginPath(); ctx.roundRect(768, 158, 262, 96, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
  V.drawLogo(ctx, 'sport5', 895, 200, 170, 62, { shadow: false });
  ctx.fillStyle = '#e8202e'; ctx.beginPath(); ctx.roundRect(830, 232, 130, 30, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 20px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('שידור חי', 895, 248);
  ctx.globalAlpha = a * (.6 + .4 * Math.sin(v * 8)); ctx.beginPath(); ctx.arc(842, 247, 5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
  // scoreboard top-left
  ctx.save(); ctx.globalAlpha = a; ctx.translate(lerp(-300, 0, eo((v - 27.2) / .25)), 0);
  const pop = v > T_GOAL ? 1 + .25 * Math.exp(-(v - T_GOAL) * 7) * Math.cos((v - T_GOAL) * 26) : 1;
  ctx.fillStyle = 'rgba(8,14,40,.85)'; ctx.beginPath(); ctx.roundRect(50, 158, 300, 96, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = v > T_GOAL ? '#FFC24A' : 'rgba(255,255,255,.5)'; ctx.stroke();
  ctx.fillStyle = '#FFD21F'; ctx.fillRect(66, 178, 10, 56); ctx.fillStyle = '#e8202e'; ctx.fillRect(324, 178, 10, 56);
  ctx.save(); ctx.translate(200, 206); ctx.scale(pop, pop); ctx.font = '900 62px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = v > T_GOAL ? '#FFC24A' : '#fff'; ctx.fillText(v > T_GOAL ? '1 : 0' : '0 : 0', 0, 0); ctx.restore();
  ctx.restore();
}
const confettiCols = ['#FFD21F', '#2a5cff', '#ffffff', '#FFC24A', '#e8202e', '#5AD1FF'];
function confetti(ctx, v, t0, n, seed, ambient) {
  const tau0 = v - t0; if (tau0 < 0) return;
  for (let i = 0; i < n; i++) {
    const st = hash(seed + i * 1.7) * .9, tau = tau0 - st; if (tau < 0) continue;
    const x0 = 60 + hash(seed + i * 2.3) * 960, vx = (hash(seed + i * 3.1) - .5) * 500, vy = -(700 + hash(seed + i * 4.7) * 900), g = 900;
    let x = x0 + vx * tau + Math.sin(tau * 5 + i) * 30, y = 1250 + vy * tau + .5 * g * tau * tau; if (tau > 1.3) y += (tau - 1.3) * 160; if (y > 1250 + 700 || y < -100) continue;
    const c = Math.cos(tau * (8 + hash(seed + i) * 8) + i);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tau * 4 + i); ctx.globalAlpha = ambient ? ENV : 1; ctx.fillStyle = confettiCols[i % confettiCols.length]; ctx.fillRect(-9, -5 * Math.abs(c) - 1, 18, 10 * Math.abs(c) + 2); ctx.restore();
  }
}

// ---------------------------------------------------------------- PENALTY phase
function drawPenalty(ctx, v) {
  const cam = camAt(v); setCam(cam.p, cam.t, cam.f);
  const exc = K(v, [[27.14, .0], [28.05, .15], [28.8, .4], [29.28, 1]], 'inOut');
  const shk = shakeAmp(v, [[T_STRIKE, 34, 9], [T_SMASH, 30, 9], [T_GOAL, 38, 7]]) + (v > 27.14 && v < 27.5 ? 2 : 0);
  const mono = (v >= T_STRIKE && v < T_STRIKE + .066) ? (v < T_STRIKE + .033 ? 1 : 2) : (v >= T_SMASH && v < T_SMASH + .066) ? (v < T_SMASH + .033 ? 1 : 2) : 0;
  ctx.save(); ctx.translate(540, PY); ctx.rotate(cam.roll + A.noise1(v * 31 + 9) * shk * .0007); ctx.translate(-540 + A.noise1(v * 47) * shk, -PY + A.noise1(v * 47 + 31) * shk); ctx.scale(1.14, 1.14); ctx.translate(-540 * .14 / 1.14 * 0, 0);
  const striker = strikerPose(v), keeper = keeperPose(v, exc);
  if (mono) {
    MONO = mono; ctx.fillStyle = mono === 1 ? '#fff' : '#000'; ctx.fillRect(-300, -800, 1700, 3400);
    const shadow = pj([0, 0, 0]);
    figure(ctx, striker, KIT_STRIKER, cam.p); if (v >= T_SMASH) figure(ctx, keeper, KIT_KEEPER, cam.p);
    drawBall(ctx, v, { sq: v < T_SMASH ? .8 : 0 });
    MONO = 0;
    const bp = pj(ballPos(v)); const cx = bp ? bp.x : 540, cy = bp ? bp.y : PY;
    speedLines(ctx, cx, cy, v, { col: mono === 1 ? '#000' : '#fff', alpha: 1, n: 130, r0: 90, len: 1800, fps: 30, wmul: 1.5 });
    if (v >= T_SMASH) { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = mono === 1 ? '#000' : '#fff'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80); ctx.lineTo(cx + Math.cos(a + .1) * 380, cy + Math.sin(a + .1) * 380); ctx.lineTo(cx + Math.cos(a - .1) * 380, cy + Math.sin(a - .1) * 380); ctx.fill(); } }
    ctx.restore();
    return;
  }
  drawWorld(ctx, v, exc); drawStands(ctx, v, exc); drawLights(ctx, v); drawPitch(ctx, v);
  const net = v - T_GOAL;
  drawNet(ctx, net, 'back');
  // ground shadows
  for (const [P, r] of [[striker, .45], [keeper, .5]]) { const g = pj([P.x, 0, P.z]); if (g) { ctx.fillStyle = 'rgba(0,20,10,.35)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, r * g.k, r * g.k * .28, 0, 0, TAU); ctx.fill(); } }
  { const g = pj([ballPos(v)[0], 0, ballPos(v)[2]]); if (g) { ctx.fillStyle = 'rgba(0,20,10,.4)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, .14 * g.k, .14 * g.k * .3, 0, 0, TAU); ctx.fill(); } }
  // depth order: far first
  const fig = [[striker, KIT_STRIKER, striker.z], [keeper, KIT_KEEPER, keeper.z]].sort((a, b) => toCam([a[0].x, 0, a[0].z])[2] < toCam([b[0].x, 0, b[0].z])[2] ? 1 : -1);
  const ballZ = toCam(ballPos(v))[2];
  let ballDone = false;
  for (const f of fig) { const fz = toCam([f[0].x, 0, f[0].z])[2]; if (!ballDone && ballZ > fz) { ballTrail(ctx, v, ['#ffe08a', '#ffffff']); drawBallFull(ctx, v); ballDone = true; } figure(ctx, f[0], f[1], cam.p); }
  drawNet(ctx, net, 'front');
  if (!ballDone) { ballTrail(ctx, v, ['#ffe08a', '#ffffff']); drawBallFull(ctx, v); }
  drawFlares(ctx, v, K(v, [[28.9, 0], [29.3, 1]], 'inOut'));
  ctx.restore();
  // screen fx
  const bp = pj(ballPos(v)); let bpp = null;
  if (bp) { const m = ctx.getTransform(); }
  if (v >= T_STRIKE + .066 && v < T_GOAL) { const w = K(v, [[T_STRIKE, 0], [T_GOAL, 1]], 'lin'); speedLines(ctx, 540, 720, v, { col: '#fff', alpha: .25 + .25 * Math.sin(w * Math.PI), n: 46, r0: 420, len: 900, fps: 12 }); }
  // desaturate blue under ghost
  const gh = smooth(28.45, 28.55, v) * (1 - smooth(T_SMASH, T_SMASH + .04, v));
  if (gh > 0) { ctx.save(); ctx.globalAlpha = .35 * gh; ctx.fillStyle = '#5ac8ff'; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  halftone(ctx, .3);
  // ---- katakana
  kanaHit(ctx, v, 27.2, 'ゴゴゴゴ', 200, 1130, 110, { rot: -.1, dur: .34, f0: '#ffe08a', f1: '#e8202e' });
  kanaHit(ctx, v, T_STRIKE - .01, 'ズバッ!!', 760, 420, 280, { rot: .18, dur: .4 });
  kanaHit(ctx, v, 28.16, 'シュゥゥゥ', 250, 1060, 150, { rot: -.15, dur: .65, f0: '#e8fbff', f1: '#2aa4ff' });
  kanaHit(ctx, v, T_SMASH - .01, 'パリィィン!!', 700, 360, 190, { rot: .14, dur: .42, f0: '#e8fbff', f1: '#2aa4ff' });
  kanaHit(ctx, v, T_GOAL - .01, 'ゴォォォル!!', 330, 1010, 150, { rot: -.12, dur: .5 });
  if (v > 29.75) kanaHit(ctx, v, 29.75, 'ワァァァ!!', 800, 1110, 105, { rot: .1, dur: 2.2, f0: '#fff', f1: '#ff6a2a' });
  if (v >= T_STRIKE && v < T_STRIKE + .3) speedLines(ctx, 700, 720, v, { col: '#fff', alpha: .5 * (1 - (v - T_STRIKE) / .3), n: 60, r0: 120, len: 1400 });
  shock(ctx, 540, 720, v - T_STRIKE, { r: 800, w: 60, sq: .8, col: '#fff', dur: .4 });
  shock(ctx, 540, 720, v - T_SMASH, { r: 900, w: 70, sq: .8, col: '#9be7ff', dur: .5 });
  sparks(ctx, 540, 720, v - T_SMASH, { n: 60, seed: 77, speed: 1200, life: .8, size: 7, cols: ['#fff', '#9be7ff', '#bfeeff'] });
  // goal eruption
  if (v >= T_GOAL) {
    const tg = v - T_GOAL;
    if (tg < .033) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); }
    shock(ctx, 700, 700, tg, { r: 1200, w: 120, sq: 1, col: '#ffd45a', dur: .7 });
    if (tg < .5) speedLines(ctx, 700, 700, v, { col: '#fff3c0', alpha: .6 * (1 - tg / .5), n: 80, r0: 150, len: 1500 });
    sparks(ctx, 700, 700, tg, { n: 100, seed: 91, speed: 1500, life: 1.1, size: 8, grav: 600, cols: ['#fff', '#ffd45a', '#FFD21F', '#2a5cff'] });
    confetti(ctx, v, T_GOAL, 220, 7, false); confetti(ctx, v, T_GOAL + .3, 120, 19, false);
    if (HOLD) confetti(ctx, 29.4 + HU * 0, 29.28, 0, 1, true);
    const gt = TXT_GOAL(); slamText(ctx, gt, 540, 380, T_GOAL, v, { glint: HOLD ? HU : null });
    petals(ctx, v - T_GOAL, 18, 9, clamp(tg * 2) * .8);
  }
  if (HOLD && v > 29.9) { const r = rng(17); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 30; i++) { const x = r() * 1080, y = 200 + r() * 1000 + HU * 100 * (r() - .5) * 2; V.sparkle(ctx, x, y, 8 + r() * 14, i % 2 ? '#fff4c8' : '#ffffff', HU * 4 + i, ENV * (.3 + .5 * r())); } ctx.restore(); }
  hudBug(ctx, v);
  eyePanels(ctx, v);
  if (v > 29.5 && v < 29.55) { ctx.fillStyle = `rgba(255,255,255,${.8 * (1 - (v - 29.5) / .05)})`; ctx.fillRect(0, 0, 1080, 1920); }
}
const TXT_GOAL = () => goldCanvas('s6g_goal', 'גוווול!', 820, 300, 26);
function drawBallFull(ctx, v) {
  const sq = v >= T_STRIKE && v < T_STRIKE + .08 ? 1 : 0, bp = pj(ballPos(v));
  let dir = 0; if (bp) { const p2 = pj(ballPos(v + .03)); if (p2) dir = Math.atan2(p2.y - bp.y, p2.x - bp.x); }
  const gA = smooth(28.42, 28.55, v) * (1 - smooth(T_SMASH, T_SMASH + .03, v));
  if (bp && gA > 0) { const R = .5 * bp.k; ghostSpinner(ctx, bp.x, bp.y, R, v, gA * (.75 + .25 * Math.sin(v * 50)), v > 28.6); if (v > 28.55) { ctx.save(); ctx.globalAlpha = gA * .8; ctx.strokeStyle = '#d8f8ff'; ctx.lineWidth = 6; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3; ctx.beginPath(); ctx.moveTo(bp.x + Math.cos(a) * .11 * bp.k, bp.y + Math.sin(a) * .11 * bp.k); ctx.lineTo(bp.x + Math.cos(a) * .2 * bp.k * (.9 + hash(i) * .5), bp.y + Math.sin(a) * .2 * bp.k * (.9 + hash(i) * .5)); ctx.stroke(); } ctx.restore(); } }
  drawBall(ctx, v, { sq, dir });
  // ring burst after smash
  if (bp && v >= T_SMASH + .066 && v < T_SMASH + .8) { const tau = v - T_SMASH - .066; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, d = .5 * bp.k * (1 + tau * 3.2), x = bp.x + Math.cos(a) * d, y = bp.y + Math.sin(a) * d + 300 * tau * tau; ctx.save(); ctx.translate(x, y); ctx.rotate(a + tau * 6); ctx.globalAlpha = clamp(1 - tau / .7); ctx.beginPath(); ctx.moveTo(-.12 * bp.k, -.05 * bp.k); ctx.lineTo(.12 * bp.k, 0); ctx.lineTo(-.1 * bp.k, .06 * bp.k); ctx.closePath(); ctx.fillStyle = '#cfefff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); } }
}

// ---------------------------------------------------------------- scene registration
A.scene({
  name: 's6_impact', start: 25.61, end: 30.42,
  draw(ctx, s) {
    const v = s.t; const hh = A.H;
    HOLD = !!(hh && (Math.abs(hh.v - 26.53) < .03 || Math.abs(hh.v - 30.0) < .03)); HU = HOLD ? hh.u / hh.dur : 0; ENV = HOLD ? Math.sin(Math.PI * HU) : 0; MONO = 0;
    if (v < 27.3) {
      drawSlam(ctx, v);
      if (v > 27.14) { const w = (v - 27.14) / .12, edge = lerp(-350, 1450, eo(w)); if (w < 1) { ctx.save(); ctx.beginPath(); ctx.moveTo(-400, 0); ctx.lineTo(edge + 260, 0); ctx.lineTo(edge - 260, 1920); ctx.lineTo(-400, 1920); ctx.closePath(); ctx.clip(); drawPenalty(ctx, v); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,180,.95)'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(edge + 260, 0); ctx.lineTo(edge - 260, 1920); ctx.stroke(); ctx.restore(); } else drawPenalty(ctx, v); }
    } else drawPenalty(ctx, v);
  }
});
})();
