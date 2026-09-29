// V3 SPORTS  global 9.05-13.10 (register end 13.40)
// 9.05-10.25 montage (4 x 0.3s: football volley, basketball dunk, tennis serve, boxing), 10.25-12.05 "Sport 5" bumper, 12.05-13.10 CHARLTON bumper, 13.10-13.40 whip-out.
(() => {
const W = 1080, H = 1920, TAU = Math.PI * 2;
const { clamp: cl, lerp, inv, ease: E, hash, rng } = A;
const eo = k => E.out(cl(k)), eob = k => E.outBack(cl(k)), eio = k => E.inOut(cl(k)), ein = k => E.in(cl(k));
const LIN = V.lin, RAD = V.rad, glow = V.glow;
const fmod = (a, b) => ((a % b) + b) % b;
const mixArr = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const TMP = {};
const tmp = (k, w, h) => { let c = TMP[k]; if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; TMP[k] = c; } return c; };
const LT = { ent: 9.05, cov: 9.35, b: [9.05, 9.35, 9.65, 9.95, 10.25], s5: 10.25, ch: 12.05, end: 13.10, out: 13.40 };

// ---------------------------------------------------------------- generic FX helpers
function flare(ctx, x, y, s, col = '#9CC8FF', a = 1, ghosts = true) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, s * 1.8, col, .55 * a); glow(ctx, x, y, s * .55, '#fff', .9 * a);
  ctx.globalAlpha = a; ctx.fillStyle = LIN(ctx, x - s * 4, y, x + s * 4, y, [[0, 'rgba(0,0,0,0)'], [.5, col], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x - s * 4, y - s * .05, s * 8, s * .1);
  ctx.fillStyle = LIN(ctx, x, y - s * 1.6, x, y + s * 1.6, [[0, 'rgba(0,0,0,0)'], [.5, '#fff'], [1, 'rgba(0,0,0,0)']]); ctx.globalAlpha = a * .5; ctx.fillRect(x - s * .03, y - s * 1.6, s * .06, s * 3.2);
  if (ghosts) for (let i = 0; i < 4; i++) { const k = .35 + i * .3, gx = lerp(x, 540, k), gy = lerp(y, 960, k), r = s * (.16 + .1 * hash(i + 3)); ctx.globalAlpha = a * .22; ctx.fillStyle = i % 2 ? '#FFB86B' : col; ctx.beginPath(); for (let j = 0; j < 6; j++) ctx.lineTo(gx + Math.cos(j * TAU / 6) * r, gy + Math.sin(j * TAU / 6) * r); ctx.fill(); }
  ctx.restore();
}
function lightBank(ctx, x, y, w, h, col = '#fff', a = 1) {   // grid of lamps
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#0a0f26'; V.rr(ctx, -w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 10); ctx.fill();
  const cols = 4, rows = 3;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const px = -w / 2 + (i + .5) * w / cols, py = -h / 2 + (j + .5) * h / rows; ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(px, py, Math.min(w / cols, h / rows) * .36, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function speedLines(ctx, cx, cy, t, n, col, r0, r1, a = .6, w = 5) {
  const R = rng(Math.floor(t * 15) + 7); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) { const an = R() * TAU, ra = r0 + R() * (r1 - r0) * .5, rb = ra + (r1 - r0) * (.3 + R() * .5), ww = w * (.4 + R()) / 2 / 1;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * ra, cy + Math.sin(an) * ra); ctx.lineTo(cx + Math.cos(an + ww / ra * 6) * rb, cy + Math.sin(an + ww / ra * 6) * rb); ctx.lineTo(cx + Math.cos(an - ww / ra * 6) * rb, cy + Math.sin(an - ww / ra * 6) * rb); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function burst(ctx, x, y, k, col, r = 500, n = 16, seed = 1) {   // impact flash star, k 0..1
  if (k < 0 || k > 1) return; const R = rng(seed), o = 1 - k;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y);
  glow(ctx, 0, 0, r * (.5 + k * .8), col, .9 * o); glow(ctx, 0, 0, r * .3 * (1 + k), '#fff', o);
  for (let i = 0; i < n; i++) { const an = R() * TAU, L = r * (.5 + R()) * eo(k * 1.6 + .1), w = .07 + R() * .07; ctx.globalAlpha = o; ctx.fillStyle = i % 2 ? '#fff' : col; ctx.beginPath(); ctx.moveTo(Math.cos(an) * L * .12, Math.sin(an) * L * .12); ctx.lineTo(Math.cos(an - w) * L * .3, Math.sin(an - w) * L * .3); ctx.lineTo(Math.cos(an) * L, Math.sin(an) * L); ctx.lineTo(Math.cos(an + w) * L * .3, Math.sin(an + w) * L * .3); ctx.fill(); }
  ctx.globalAlpha = o; ctx.lineWidth = 16 * o + 2; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * .9 * eo(k), 0, TAU); ctx.stroke();
  ctx.restore();
}
function ball(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = r * .5;
  ctx.fillStyle = RAD(ctx, -r * .35, -r * .4, r * .1, r * 1.1, [[0, '#fff'], [.6, '#E6EBF5'], [1, '#8FA0C0']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.fillStyle = '#141a33';
  const pent = (px, py, pr, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5; ctx.lineTo(px + Math.cos(a) * pr, py + Math.sin(a) * pr); } ctx.closePath(); ctx.fill(); };
  pent(0, 0, r * .36, -Math.PI / 2);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5 + TAU / 10; pent(Math.cos(a) * r * .95, Math.sin(a) * r * .95, r * .34, a + Math.PI / 2 + .3 * 0); }
  ctx.strokeStyle = 'rgba(20,26,51,.55)'; ctx.lineWidth = r * .05; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); ctx.lineTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = RAD(ctx, -r * .4, -r * .45, 0, r * .5, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function trail(ctx, x0, y0, x1, y1, w, col, a = 1) {   // tapered glowing trail from tail (x0,y0) to head (x1,y1)
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = LIN(ctx, x0, y0, x1, y1, [[0, 'rgba(0,0,0,0)'], [.7, col], [1, '#fff']]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.closePath(); ctx.fill(); ctx.restore();
}
// kinetic word slam: pops in with overshoot, jitters, outlined. k = seconds since slam start
function slam(ctx, txt, x, y, size, k, o = {}) {
  if (k < 0) return; const lifeOut = o.life ?? 9;
  const sc = k < .1 ? lerp(3, 1, ein(1 - (1 - k / .1))) * 1 : 1 + .06 * Math.exp(-(k - .1) * 14) * Math.sin((k - .1) * 60), a = k < .04 ? k / .04 : 1;
  const sc2 = k < .11 ? lerp(2.6, 1, eo(k / .11)) : sc;
  ctx.save(); ctx.translate(x + (o.dx || 0), y); ctx.rotate(o.rot ?? -.06); ctx.scale(sc2, sc2); ctx.globalAlpha = a * (o.alpha ?? 1); ctx.font = `${o.weight || 900} ${size}px ${o.font || 'Rubik'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (o.shadow !== false) { ctx.shadowColor = o.glowCol || 'rgba(0,0,0,.6)'; ctx.shadowBlur = o.glowBlur ?? 40; ctx.shadowOffsetY = 12; }
  if (o.back) { ctx.strokeStyle = o.back; ctx.lineWidth = size * .3; ctx.strokeText(txt, size * .05, size * .05); }
  ctx.strokeStyle = o.stroke || '#0A1240'; ctx.lineWidth = size * (o.sw ?? .16); ctx.strokeText(txt, 0, 0); ctx.shadowColor = 'transparent';
  ctx.fillStyle = o.grad ? LIN(ctx, 0, -size * .5, 0, size * .5, o.grad) : (o.fill || '#fff'); ctx.fillText(txt, 0, 0);
  ctx.restore();
}
function whipBand(ctx, x, dir, a = 1) {   // vertical streak band at a whip's leading edge
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  ctx.fillStyle = LIN(ctx, x, 0, x - dir * 220, 0, [[0, 'rgba(255,255,255,.95)'], [.15, 'rgba(120,190,255,.5)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(Math.min(x, x - dir * 220), 0, 220, H);
  const R = rng(4); ctx.fillStyle = '#cfe6ff';
  for (let i = 0; i < 26; i++) { const y = R() * H, l = 200 + R() * 500; ctx.globalAlpha = a * (.25 + R() * .4); ctx.fillRect(x - (dir > 0 ? l : 0), y, l, 3 + R() * 5); }
  ctx.restore();
}

// ---------------------------------------------------------------- athletes: layered, rim lit 2.5D figures
// pose = 22 numbers: head(2) neck(2) hip(2) arm1 elbow,hand (4) arm2 (4) leg1 knee,foot (4) leg2 (4)  (arm1/leg1 = near side)
const KIT = {
  yb: { shirt: '#FFD21F', shirt2: '#E9A800', short: '#1743C9', sock: '#FFD21F', skin: '#E8A57C', hair: '#20120c', shoe: '#F4F7FF', glove: '#fff' },
  red: { shirt: '#E5322D', shirt2: '#A81616', short: '#F4F4F8', sock: '#E5322D', skin: '#B5764A', hair: '#140e0b', shoe: '#F4F7FF', glove: '#fff' },
  bb: { shirt: '#3D7BFF', shirt2: '#1C46C8', short: '#2249C9', sock: '#F4F7FF', skin: '#7A4A2E', hair: '#120c0a', shoe: '#FFC24A', glove: '#fff' },
  tn: { shirt: '#F4F7FF', shirt2: '#B7C4E8', short: '#1a2352', sock: '#F4F7FF', skin: '#E8A57C', hair: '#8a5a1a', shoe: '#38D9F5', glove: '#fff' },
  bx1: { shirt: '#E8A57C', shirt2: '#E8A57C', short: '#FFC24A', sock: '#F4F7FF', skin: '#E8A57C', hair: '#20120c', shoe: '#E5322D', glove: '#E5322D' },
  bx2: { shirt: '#9A6440', shirt2: '#9A6440', short: '#3D7BFF', sock: '#F4F7FF', skin: '#9A6440', hair: '#0c0806', shoe: '#3D7BFF', glove: '#3D7BFF' },
};
const POSE = {
  volA: [-10, -238, -4, -180, 0, 0, 55, -150, 105, -178, -55, -140, -100, -105, -30, 85, -105, 45, 15, 95, 8, 200],
  volB: [-42, -226, -26, -172, 0, 0, 62, -150, 118, -128, -72, -170, -122, -214, 82, -38, 165, -104, -8, 96, -28, 188],
  volC: [-52, -222, -30, -170, 0, 0, 60, -152, 120, -120, -76, -176, -128, -226, 96, -60, 190, -138, -8, 96, -30, 186],
  defA: [30, -224, 20, -170, 0, 0, 55, -118, 96, -150, -50, -135, -92, -165, 75, 60, 130, 150, -45, 95, -100, 160],
  defB: [40, -215, 30, -165, 0, 0, 62, -112, 110, -128, -44, -132, -80, -100, 82, 62, 150, 132, -46, 92, -112, 150],
  dunkA: [12, -236, 6, -178, 0, 0, 32, -252, 52, -330, -46, -172, -86, -222, 62, 72, 22, 152, 34, 88, -22, 150],
  dunkB: [20, -232, 14, -176, 0, 0, 46, -268, 96, -350, -52, -170, -100, -140, 46, 82, -6, 168, 10, 92, -56, 142],
  serA: [0, -238, 0, -180, 0, 0, -40, -150, -76, -226, 32, -238, 38, -322, 25, 90, 10, 195, -15, 95, -34, 190],
  serB: [26, -246, 16, -186, 0, 0, 36, -268, 58, -352, -30, -150, -6, -108, 22, 86, 12, 190, -28, 90, -70, 166],
  bxA: [-10, -226, -5, -172, 0, 0, 34, -120, 74, -176, 30, -110, 62, -168, 50, 90, 75, 195, -30, 95, -70, 195],
  bxB: [34, -220, 30, -170, 0, 0, 112, -158, 195, -172, 52, -114, 84, -164, 66, 86, 102, 190, -25, 95, -92, 190],
  bxDa: [-8, -226, -4, -172, 0, 0, 34, -120, 74, -176, 30, -110, 62, -168, 50, 90, 75, 195, -30, 95, -70, 195],
  bxDb: [-52, -206, -28, -166, 0, 0, -30, -138, -74, -100, -46, -112, -84, -70, 40, 96, 60, 195, -34, 92, -76, 186],
};
const TRAIT = { ARM: [27, 20, 17], LEG: [46, 34, 23] };
// tapered limb segment, only part [f0,f1] of the a->b span
function limb(c, a, b, w0, w1, f0, f1, col) {
  const p = f => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], A0 = p(f0), B0 = p(f1), wa = lerp(w0, w1, f0), wb = lerp(w0, w1, f1);
  const dx = B0[0] - A0[0], dy = B0[1] - A0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  c.fillStyle = col; c.beginPath(); c.moveTo(A0[0] + nx * wa / 2, A0[1] + ny * wa / 2); c.lineTo(B0[0] + nx * wb / 2, B0[1] + ny * wb / 2); c.lineTo(B0[0] - nx * wb / 2, B0[1] - ny * wb / 2); c.lineTo(A0[0] - nx * wa / 2, A0[1] - ny * wa / 2); c.closePath(); c.fill();
  c.beginPath(); c.arc(A0[0], A0[1], wa / 2, 0, TAU); c.fill(); c.beginPath(); c.arc(B0[0], B0[1], wb / 2, 0, TAU); c.fill();
}
function bodyParts(c, P, K, flat, o) {
  const F = col => flat ? '#fff' : col, pt = i => [P[i * 2], P[i * 2 + 1]];
  const hd = pt(0), nk = pt(1), hp = pt(2), e1 = pt(3), h1 = pt(4), e2 = pt(5), h2 = pt(6), k1 = pt(7), f1 = pt(8), k2 = pt(9), f2 = pt(10);
  const sh = [lerp(nk[0], hp[0], .1), lerp(nk[1], hp[1], .1)];
  const arm = (e, h, sleeve) => {
    limb(c, sh, e, 28, 21, 0, 1, F(sleeve ? K.shirt : K.skin)); limb(c, e, h, 20, 15, 0, 1, F(K.skin));
    if (o.glove) { c.fillStyle = F(K.glove); c.beginPath(); c.arc(h[0] + (h[0] - e[0]) * .12, h[1] + (h[1] - e[1]) * .12, 30, 0, TAU); c.fill(); limb(c, e, h, 27, 26, .62, 1, F(K.glove)); }
  };
  const leg = (k, f) => {
    limb(c, hp, k, 50, 34, 0, 1, F(K.short)); limb(c, hp, k, 50, 34, .55, 1, F(K.skin)); limb(c, k, f, 30, 20, 0, 1, F(K.skin));
    if (o.sock !== false) limb(c, k, f, 30, 20, .45, .9, F(K.sock));
    const d = [f[0] - k[0], f[1] - k[1]], l = Math.hypot(d[0], d[1]) || 1, ax = f[0] + d[0] / l * 4, ay = f[1] + d[1] / l * 4, dir = [-d[1] / l, d[0] / l], sd = dir[0] >= 0 ? 1 : -1;
    limb(c, [ax, ay], [ax + dir[0] * sd * 46, ay + dir[1] * sd * 46], 24, 17, 0, 1, F(K.shoe));
  };
  // far side
  arm(e2, h2, true); leg(k2, f2);
  if (!flat && o.dim) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(4,8,30,.5)'; c.fillRect(-700, -1000, 1400, 1400); c.globalCompositeOperation = 'source-over'; }
  // torso
  limb(c, nk, hp, 64, 48, 0, 1, F(K.shirt)); limb(c, nk, hp, 64, 48, .55, 1, F(K.shirt2));
  if (o.stripe && !flat) { c.fillStyle = o.stripe; c.beginPath(); c.moveTo(nk[0] - 30, nk[1] + 40); c.lineTo(nk[0] + 30, nk[1] + 28); c.lineTo(nk[0] + 30, nk[1] + 48); c.lineTo(nk[0] - 30, nk[1] + 60); c.fill(); }
  limb(c, nk, [lerp(nk[0], hd[0], 1), lerp(nk[1], hd[1], 1)], 22, 20, 0, 1, F(K.skin));
  // head
  c.fillStyle = F(K.skin); c.beginPath(); c.ellipse(hd[0], hd[1], 27, 32, 0, 0, TAU); c.fill();
  c.fillStyle = F(K.hair); c.beginPath(); c.ellipse(hd[0] - 4, hd[1] - 9, 29, 26, -.15, Math.PI * .95, TAU * 1.02); c.fill();
  if (o.band) { c.fillStyle = F(o.band); c.fillRect(hd[0] - 28, hd[1] - 12, 56, 8); }
  leg(k1, f1); arm(e1, h1, true);
}
// draw a figure at (x,y) (hip position), scale s, flip = -1 mirrors; rim lights from key (world dir) cool, and warm from the other side
function figure(ctx, P, K, x, y, s, flip = 1, o = {}) {
  const CW = 1400, CH = 1500, OX = 700, OY = 1000;
  const tc = tmp('fig', CW, CH), sc = tmp('sil', CW, CH), rc = tmp('rim', CW, CH), g = tc.getContext('2d'), gs = sc.getContext('2d'), gr = rc.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.globalCompositeOperation = 'source-over'; g.setTransform(s, 0, 0, s, OX, OY); bodyParts(g, P, K, false, o);
  gs.setTransform(1, 0, 0, 1, 0, 0); gs.clearRect(0, 0, CW, CH); gs.setTransform(s, 0, 0, s, OX, OY); bodyParts(gs, P, K, true, o);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
  // form shading: darker on the side away from the key light
  const ld = (o.lightX ?? 1) * flip;
  g.fillStyle = LIN(g, OX - ld * 190 * s, 0, OX + ld * 190 * s, 0, [[0, 'rgba(2,6,28,.62)'], [.55, 'rgba(2,6,28,0)'], [1, 'rgba(255,255,255,.10)']]); g.fillRect(0, 0, CW, CH);
  g.fillStyle = LIN(g, 0, OY - 300 * s, 0, OY + 200 * s, [[0, 'rgba(255,255,255,.10)'], [.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,20,.25)']]); g.fillRect(0, 0, CW, CH);
  const rim = (dx, dy, col, a) => {
    gr.setTransform(1, 0, 0, 1, 0, 0); gr.globalCompositeOperation = 'source-over'; gr.clearRect(0, 0, CW, CH); gr.drawImage(sc, 0, 0);
    gr.globalCompositeOperation = 'destination-out'; gr.drawImage(sc, dx * flip, dy);
    gr.globalCompositeOperation = 'source-in'; gr.fillStyle = col; gr.fillRect(0, 0, CW, CH);
    g.globalAlpha = a; g.drawImage(rc, 0, 0); g.globalAlpha = 1;
  };
  rim(-9 * s / 2, 9 * s / 2, o.rim1 || '#9FD4FF', 1); rim(8 * s / 2, 5 * s / 2, o.rim2 || '#FFB05A', .9);
  ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1); ctx.drawImage(tc, -OX, -OY); ctx.restore();
}
const feet = (P, s, y) => y + Math.max(P[15], P[21]) * s;

A.V3 = { flare, burst, ball, trail, slam, speedLines, figure, POSE, KIT, whipBand, lightBank };
})();
