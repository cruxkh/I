// V3 SPORTS  global 9.05-13.10 (register end 13.40)
// 9.05-10.25 montage (4 x 0.3s: football volley, basketball dunk, tennis serve, boxing), 10.25-12.05 "Sport 5" bumper, 12.05-13.10 CHARLTON bumper, 13.10-13.40 whip-out.
(() => {
const W = 1080, H = 1920, TAU = Math.PI * 2;
const { clamp: cl, lerp, inv, ease: E, hash, rng } = A;
const eo = k => E.out(cl(k)), eob = k => E.outBack(cl(k)), eio = k => E.inOut(cl(k)), ein = k => E.in(cl(k));
const LIN = V.lin, RAD = V.rad, glow = V.glow;
const ring = (c, x, y, r, w, col, a) => { if (r > 0 && a > 0) V.ring(c, x, y, r, w, col, a); };
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

// ================================================================ MONTAGE SHOTS (k = seconds since the beat start, 0..0.3)
// slow-mo time warp around the impact instant ti
const warp = (k, ti) => k < ti - .06 ? k : k < ti + .06 ? ti - .06 + (k - ti + .06) * .28 : ti - .06 + .034 + (k - ti - .06) * 1.35;
function cam(ctx, k, o) {
  const z = lerp(o.z0 ?? 1.04, o.z1 ?? 1.24, eo(k / .3)) * (1 + (o.pop || 0) * Math.exp(-Math.max(0, k - o.ti) * 18) * (k > o.ti ? 1 : 0));
  const sh = k > o.ti ? (o.shake ?? 1) * Math.exp(-(k - o.ti) * 10) : 0, R = rng(Math.floor(k * 60) + 3);
  ctx.translate(540 + (R() - .5) * 26 * sh, 940 + (R() - .5) * 26 * sh); ctx.rotate((o.rot0 ?? 0) + ((o.rot1 ?? 0) - (o.rot0 ?? 0)) * k / .3); ctx.scale(z, z); ctx.translate(-(o.cx ?? 540), -(o.cy ?? 940));
}
function crowdDots(g, y0, y1, n, seed, cols) {
  const R = rng(seed); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x = R() * W, y = lerp(y0, y1, R()), r = 3 + R() * 9; g.globalAlpha = .18 + R() * .35; g.fillStyle = cols[Math.floor(R() * cols.length)]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  g.restore();
}
const bgFootball = () => A.layer('bgFb', W, H, g => {
  g.fillStyle = LIN(g, 0, 0, 0, 900, [[0, '#02050f'], [.42, '#0b1c55'], [1, '#17337f']]); g.fillRect(0, 0, W, 900);
  g.fillStyle = '#050a1e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 330); g.lineTo(0, 470); g.fill();   // roof
  crowdDots(g, 520, 860, 900, 11, ['#FFD21F', '#3D7BFF', '#E5322D', '#fff', '#5AD1FF']);
  g.fillStyle = LIN(g, 0, 470, 0, 880, [[0, 'rgba(4,8,30,.9)'], [1, 'rgba(4,8,30,.1)']]); g.fillRect(0, 470, W, 410);
  const ads = ['#E5322D', '#fff', '#3D7BFF', '#FFD21F', '#1a1a2e', '#3D7BFF']; for (let i = 0; i < 12; i++) { g.fillStyle = ads[i % 6]; g.globalAlpha = .9; g.fillRect(i * 96, 862, 94, 40); g.fillStyle = '#0a0f26'; g.globalAlpha = .7; g.fillRect(i * 96 + 12, 876, 60, 8); } g.globalAlpha = 1;
  // pitch
  g.fillStyle = LIN(g, 0, 900, 0, H, [[0, '#0E5F31'], [.5, '#0F8043'], [1, '#0A4A28']]); g.fillRect(0, 900, W, H - 900);
  const vp = 540, y0 = 900; for (let i = -8; i < 9; i++) { if (i % 2) continue; g.fillStyle = 'rgba(255,255,255,.055)'; g.beginPath(); g.moveTo(vp + i * 30, y0); g.lineTo(vp + (i + 1) * 30, y0); g.lineTo(vp + (i + 1) * 300, H); g.lineTo(vp + i * 300, H); g.fill(); }
  for (let j = 0; j < 8; j++) { const y = 900 + Math.pow(j / 8, 2) * 1020; g.fillStyle = j % 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.035)'; g.fillRect(0, y, W, 1020 * (Math.pow((j + 1) / 8, 2) - Math.pow(j / 8, 2))); }
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(-40, 1330); g.lineTo(1120, 1130); g.lineTo(1120, 1150); g.lineTo(-40, 1355); g.fill();
});
function shotFootball(ctx, k, t) {
  const ti = .17, kw = warp(k, ti);
  ctx.save(); cam(ctx, k, { z0: 1.02, z1: 1.22, cx: 500, cy: 760, ti, shake: 1.4, rot0: -.03, rot1: .02, pop: .04 });
  ctx.drawImage(bgFootball(), 0, 0);
  // floodlights + flares
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y] of [[190, 200], [880, 170]]) { lightBank(ctx, x, y, 170, 120, '#fff', .95); }
  ctx.restore();
  V.beams(ctx, 190, 220, t, 'rgba(160,200,255,1)', 4, 1900, .5, .10); V.beams(ctx, 880, 190, t, 'rgba(160,200,255,1)', 4, 1900, .5, .10);
  // ground glow
  glow(ctx, 470, 1090, 520, '#5AD1FF', .18);
  // red defender (background, dimmed)
  const dp = mixArr(POSE.defA, POSE.defB, eo(kw / .25));
  ctx.save(); ctx.globalAlpha = 1; figure(ctx, dp, KIT.red, 830, 930 - 12 * Math.sin(kw * 10), 1.35, -1, { dim: true, rim1: '#7FB6FF', rim2: '#FF8A5A', stripe: 'rgba(255,255,255,.35)' }); ctx.restore();
  // striker
  const m = eio(kw / ti), pB = mixArr(POSE.volA, POSE.volB, m), pose = kw > ti ? mixArr(POSE.volB, POSE.volC, eo((kw - ti) / .1)) : pB;
  const jump = -60 * Math.sin(cl(kw / .27) * Math.PI) - 18, FX = 400, FY = 900 + jump;
  // motion streak behind striker
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .28; ctx.fillStyle = LIN(ctx, FX - 380, 0, FX, 0, [[0, 'rgba(90,209,255,0)'], [1, 'rgba(90,209,255,1)']]); ctx.fillRect(FX - 380, FY - 380, 380, 520); ctx.restore();
  figure(ctx, pose, KIT.yb, FX, FY, 2.0, 1, { band: '#1743C9', stripe: '#1743C9' });
  // ball
  const s = 2.0, C = [FX + 175 * s, FY - 112 * s];
  let bx, by, br = 33;
  if (k < ti) { const u = ein(k / ti); bx = lerp(C[0] + 210, C[0], u); by = lerp(C[1] - 330, C[1], u); }
  else { const u = (k - ti) / (.3 - ti), d = 2300 * ein(u * .9 + .1) - 230; bx = C[0] + d * .62; by = C[1] - d * .78 + 60 * u; br = 33 * (1 - .45 * u); trail(ctx, C[0] + 20, C[1] - 20, bx, by, 60 * (1 - .4 * u), '#8fd0ff', .95); }
  ball(ctx, bx, by, br, k * 40);
  burst(ctx, C[0] + 6, C[1] - 4, (k - ti) / .13, '#FFE18A', 560, 18, 4);
  ctx.restore();
  // grass / sparks
  return;
}

// ---- basketball
const bgArena = () => A.layer('bgBb', W, H, g => {
  g.fillStyle = LIN(g, 0, 0, 0, 1000, [[0, '#0a0620'], [.55, '#1c1150'], [1, '#2a1a70']]); g.fillRect(0, 0, W, 1000);
  crowdDots(g, 380, 940, 1100, 21, ['#fff', '#FF9A3D', '#8A5BFF', '#5AD1FF', '#FF4F9A']);
  g.fillStyle = LIN(g, 0, 300, 0, 960, [[0, 'rgba(10,6,32,.95)'], [1, 'rgba(10,6,32,.2)']]); g.fillRect(0, 300, W, 660);
  g.fillStyle = LIN(g, 0, 950, 0, H, [[0, '#8a4a1c'], [.35, '#B8722C'], [1, '#5a2e10']]); g.fillRect(0, 950, W, H - 950);
  for (let i = 0; i < 26; i++) { g.strokeStyle = 'rgba(60,25,5,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(540 + (i - 13) * 20, 950); g.lineTo(540 + (i - 13) * 190, H); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 10; g.beginPath(); g.ellipse(300, 1290, 620, 130, 0, Math.PI, TAU); g.stroke();
  g.fillStyle = LIN(g, 0, 950, 0, 1250, [[0, 'rgba(255,220,160,.5)'], [1, 'rgba(255,220,160,0)']]); g.fillRect(0, 950, W, 300);
});
function shotDunk(ctx, k, t) {
  const ti = .15, kw = warp(k, ti);
  ctx.save(); cam(ctx, k, { z0: 1.03, z1: 1.2, cx: 560, cy: 640, ti, shake: 1.5, rot0: .025, rot1: -.02, pop: .05 });
  ctx.drawImage(bgArena(), 0, 0);
  for (let i = 0; i < 3; i++) V.beams(ctx, 200 + i * 340, 40, t + i, i === 1 ? 'rgba(255,180,90,1)' : 'rgba(150,170,255,1)', 3, 1500, .35, .14);
  const R = rng(9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const x = R() * W, y = 400 + R() * 500, ph = R() * 4; const a = Math.max(0, Math.sin(t * 22 + ph * 9)); if (a > .8) { ctx.globalAlpha = a; ctx.fillStyle = '#fff'; V.sparkle(ctx, x, y, 26 + R() * 20, '#fff', 0, .9); } } ctx.restore();
  // hoop (rim shake after impact)
  const sh = kw > ti ? Math.sin((kw - ti) * 130) * 9 * Math.exp(-(kw - ti) * 9) : 0, HX = 668, HY = 322;
  ctx.save(); ctx.translate(sh * .4, sh);
  ctx.fillStyle = LIN(ctx, 750, 100, 1010, 440, [[0, 'rgba(230,242,255,.9)'], [1, 'rgba(160,190,240,.55)']]); ctx.beginPath(); ctx.moveTo(760, 90); ctx.lineTo(1010, 60); ctx.lineTo(1010, 400); ctx.lineTo(760, 430); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = '#FF6A1A'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(810, 250); ctx.lineTo(960, 236); ctx.lineTo(960, 350); ctx.lineTo(810, 366); ctx.closePath(); ctx.stroke();
  // net
  const swish = kw > ti ? Math.exp(-(kw - ti) * 6) * Math.sin((kw - ti) * 70) : 0;
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4;
  for (let i = 0; i <= 8; i++) { const u = i / 8; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const v = j / 6, xx = HX + (u - .5) * lerp(180, 90, v) + swish * 26 * v, yy = HY + 8 + v * 150 + (kw > ti ? Math.sin(v * 3) * 4 : 0); if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
  for (let j = 1; j <= 6; j++) { const v = j / 6; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, xx = HX + (u - .5) * lerp(180, 90, v) + swish * 26 * v, yy = HY + 8 + v * 150 + (j % 2 ? 10 * (i % 2 ? 1 : -1) * .4 : 0); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
  ctx.strokeStyle = '#FF5A1F'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(HX, HY, 100, 20, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(HX, HY - 3, 100, 20, 0, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
  ctx.restore();
  // player
  const m = eio(kw / ti), pose = mixArr(POSE.dunkA, POSE.dunkB, m), FX = 430, FY = 930 - 70 * Math.sin(cl(kw / .3) * Math.PI * .9) + 10, s = 1.9;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .22; ctx.fillStyle = LIN(ctx, 0, FY - 700, 0, FY + 300, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,190,110,1)']]); ctx.fillRect(FX - 200, FY - 700, 360, 1000); ctx.restore();
  figure(ctx, pose, KIT.bb, FX, FY, s, 1, { band: '#fff', stripe: '#fff', rim1: '#9FD4FF', rim2: '#FFB05A', lightX: -1 });
  // ball
  const hx = FX + pose[8] * s, hy = FY + pose[9] * s;
  let bx = hx + 26, by = hy - 36, sc = 1;
  if (k > ti) { const u = eo((k - ti) / .1); bx = lerp(hx + 26, HX + swish * 8, u); by = lerp(hy - 36, HY + 62, u); }
  ctx.save(); ctx.translate(bx, by); ctx.rotate(k * 12); ctx.fillStyle = RAD(ctx, -14, -16, 3, 50, [[0, '#FFA24A'], [.7, '#E2611A'], [1, '#93340C']]); ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2b1206'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.moveTo(-48, 0); ctx.lineTo(48, 0); ctx.moveTo(0, -48); ctx.lineTo(0, 48); ctx.moveTo(-34, -34); ctx.quadraticCurveTo(-12, 0, -34, 34); ctx.moveTo(34, -34); ctx.quadraticCurveTo(12, 0, 34, 34); ctx.stroke(); ctx.restore();
  burst(ctx, HX, HY + 10, (k - ti) / .14, '#FFC78A', 520, 16, 8);
  ring(ctx, HX, HY, 60 + (k - ti) * 2200, 8, 'rgba(255,255,255,.8)', k > ti ? Math.max(0, 1 - (k - ti) / .12) : 0);
  ctx.restore();
}

// ---- tennis
const bgTennis = () => A.layer('bgTn', W, H, g => {
  g.fillStyle = LIN(g, 0, 0, 0, 800, [[0, '#010512'], [.5, '#0a1a4c'], [1, '#193d92']]); g.fillRect(0, 0, W, 800);
  crowdDots(g, 430, 780, 800, 33, ['#fff', '#5AD1FF', '#3D7BFF', '#FFD21F']);
  g.fillStyle = LIN(g, 0, 400, 0, 800, [[0, 'rgba(2,6,24,.9)'], [1, 'rgba(2,6,24,0)']]); g.fillRect(0, 400, W, 400);
  g.fillStyle = LIN(g, 0, 780, 0, H, [[0, '#1A5BD1'], [.4, '#1B4CC0'], [1, '#0E2C80']]); g.fillRect(0, 780, W, H - 780);
  g.fillStyle = '#12996a'; g.fillRect(0, 780, W, 24);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 9; g.beginPath(); g.moveTo(-200, H); g.lineTo(420, 830); g.moveTo(1280, H); g.lineTo(660, 830); g.moveTo(-400, 1250); g.lineTo(1480, 1250); g.moveTo(540, 830); g.lineTo(540, H); g.moveTo(400, 830); g.lineTo(680, 830); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 40; i++) g.fillRect(200 + i * 20, 806, 12, 24);   // net
  g.fillStyle = LIN(g, 0, 800, 0, 1300, [[0, 'rgba(160,210,255,.4)'], [1, 'rgba(160,210,255,0)']]); g.fillRect(0, 800, W, 500);
});
function shotTennis(ctx, k, t) {
  const ti = .16, kw = warp(k, ti);
  ctx.save(); cam(ctx, k, { z0: 1.02, z1: 1.24, cx: 570, cy: 620, ti, shake: 1.1, rot0: -.02, rot1: .03, pop: .05 });
  ctx.drawImage(bgTennis(), 0, 0);
  for (const [x, y] of [[170, 190], [910, 150]]) lightBank(ctx, x, y, 170, 120, '#fff', .95);
  V.beams(ctx, 170, 210, t, 'rgba(170,205,255,1)', 4, 1800, .5, .10); V.beams(ctx, 910, 170, t, 'rgba(170,205,255,1)', 4, 1800, .5, .10);
  const m = eio(kw / ti), pose = mixArr(POSE.serA, POSE.serB, m), FX = 470, FY = 1010 - 24 * Math.sin(cl(kw / .3) * Math.PI), s = 1.9;
  glow(ctx, FX, 1140, 380, '#7FC0FF', .22);
  figure(ctx, pose, KIT.tn, FX, FY, s, 1, { band: '#38D9F5', stripe: '#38D9F5', rim1: '#9FE0FF', rim2: '#FFC080' });
  // racket (hand of arm1 = pose[8],[9]; elbow = [6],[7])
  const ex = FX + pose[6] * s, ey = FY + pose[7] * s, hx = FX + pose[8] * s, hy = FY + pose[9] * s;
  const an = Math.atan2(hy - ey, hx - ex), ux = Math.cos(an), uy = Math.sin(an), hc = [hx + ux * 130, hy + uy * 130];
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = '#151a33'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(hx - ux * 20, hy - uy * 20); ctx.lineTo(hx + ux * 62, hy + uy * 62); ctx.stroke();
  ctx.translate(hc[0], hc[1]); ctx.rotate(an + Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 68, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 10, -60 * Math.sqrt(1 - Math.pow(i / 5, 2))); ctx.lineTo(i * 10, 60 * Math.sqrt(1 - Math.pow(i / 5, 2))); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-46 * Math.sqrt(1 - Math.pow(i / 5.6, 2)), i * 12); ctx.lineTo(46 * Math.sqrt(1 - Math.pow(i / 5.6, 2)), i * 12); ctx.stroke(); }
  ctx.strokeStyle = LIN(ctx, -50, -70, 50, 70, [[0, '#FF4F5A'], [1, '#B01426']]); ctx.lineWidth = 13; ctx.beginPath(); ctx.ellipse(0, 0, 50, 68, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 50, 68, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  ctx.restore();
  // ball: toss -> contact -> smashed away
  const CB = [hc[0] + 18, hc[1] - 14];
  let bx, by, br = 20;
  if (k < ti) { const u = eo(k / ti); bx = lerp(FX + 60, CB[0], u); by = lerp(FY - 600, CB[1] + 12, ein(k / ti) * .6 + u * .4); by = lerp(FY - 480, CB[1], u); }
  else { const u = (k - ti) / (.3 - ti), d = 2100 * ein(u * .85 + .15) - 260; bx = CB[0] + d * .38; by = CB[1] + d * .92; br = 20 + 12 * u; trail(ctx, CB[0], CB[1], bx, by, 46, '#d8ff6a', .95); }
  ctx.save(); ctx.translate(bx, by); ctx.fillStyle = RAD(ctx, -br * .3, -br * .3, br * .1, br * 1.1, [[0, '#F4FF9C'], [.6, '#C7E62A'], [1, '#7C9410']]); ctx.beginPath(); ctx.arc(0, 0, br, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = br * .16; ctx.beginPath(); ctx.arc(-br * 1.05, 0, br * .95, -.7, .7); ctx.stroke(); ctx.restore();
  burst(ctx, CB[0], CB[1], (k - ti) / .13, '#E6FF8A', 520, 18, 6);
  // court dust / chalk
  if (k > ti) { const R = rng(14); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const a = R() * TAU, d = (k - ti) * (500 + R() * 900); ctx.globalAlpha = Math.max(0, 1 - (k - ti) / .14) * .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(CB[0] + Math.cos(a) * d, CB[1] + Math.sin(a) * d, 3 + R() * 5, 0, TAU); ctx.fill(); } ctx.restore(); }
  ctx.restore();
}

// ---- boxing
const bgRing = () => A.layer('bgBx', W, H, g => {
  g.fillStyle = LIN(g, 0, 0, 0, H, [[0, '#050308'], [.5, '#1a0a1e'], [1, '#0a0508']]); g.fillRect(0, 0, W, H);
  crowdDots(g, 380, 900, 500, 41, ['#FF6A3A', '#FFB86B', '#8A5BFF', '#fff']);
  g.fillStyle = LIN(g, 0, 300, 0, 950, [[0, 'rgba(5,3,8,.95)'], [1, 'rgba(5,3,8,.4)']]); g.fillRect(0, 300, W, 650);
  g.fillStyle = LIN(g, 0, 950, 0, H, [[0, '#2a3b7a'], [1, '#101a44']]); g.fillRect(0, 950, W, H - 950);   // canvas mat
  g.fillStyle = LIN(g, 0, 950, 0, 1200, [[0, 'rgba(255,180,120,.4)'], [1, 'rgba(255,180,120,0)']]); g.fillRect(0, 950, W, 250);
  // ropes
  const ropes = ['#E5322D', '#F4F7FF', '#E5322D'];
  for (let i = 0; i < 3; i++) { g.strokeStyle = ropes[i]; g.lineWidth = 16; g.beginPath(); g.moveTo(-60, 560 + i * 130); g.quadraticCurveTo(540, 545 + i * 128, 1140, 560 + i * 130); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-60, 553 + i * 130); g.quadraticCurveTo(540, 538 + i * 128, 1140, 553 + i * 130); g.stroke(); }
  g.fillStyle = '#1a1030'; g.fillRect(70, 470, 46, 500); g.fillRect(964, 470, 46, 500);
  g.fillStyle = '#E5322D'; g.fillRect(70, 520, 46, 90); g.fillRect(964, 520, 46, 90);
});
function shotBox(ctx, k, t) {
  const ti = .15, kw = warp(k, ti);
  ctx.save(); cam(ctx, k, { z0: 1.03, z1: 1.26, cx: 620, cy: 640, ti, shake: 2.2, rot0: .03, rot1: -.015, pop: .07 });
  ctx.drawImage(bgRing(), 0, 0);
  V.beams(ctx, 540, 0, t, 'rgba(255,200,150,1)', 3, 1500, .5, .18); glow(ctx, 540, 520, 700, '#FF8A4A', .16);
  // haze
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .1; for (let i = 0; i < 6; i++) { glow(ctx, 200 + i * 160 + Math.sin(t * 2 + i) * 40, 850 + Math.cos(t + i) * 60, 300, '#ffb98a', 1); } ctx.restore();
  const s = 1.9, m = eio(kw / ti);
  const dPose = kw > ti ? mixArr(POSE.bxDa, POSE.bxDb, eo((kw - ti) / .1)) : POSE.bxDa;
  const dx = kw > ti ? 26 * eo((kw - ti) / .2) : 0;
  figure(ctx, dPose, KIT.bx2, 655 + dx, 935, s, -1, { glove: true, dim: true, rim1: '#FFB07A', rim2: '#7FB6FF', band: '#3D7BFF', sock: false });
  const aPose = mixArr(POSE.bxA, POSE.bxB, m);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3; ctx.fillStyle = LIN(ctx, 330 - 300, 0, 330, 0, [[0, 'rgba(255,120,60,0)'], [1, 'rgba(255,120,60,1)']]); ctx.fillRect(30, 500, 320, 500); ctx.restore();
  figure(ctx, aPose, KIT.bx1, 330 + 40 * m, 935, s, 1, { glove: true, rim1: '#FFB07A', rim2: '#7FB6FF', sock: false });
  // impact
  const IX = 720 + dx * .5, IY = 590;
  burst(ctx, IX, IY, (k - ti) / .15, '#FFC078', 640, 22, 12);
  if (k > ti) { const R = rng(31), u = (k - ti); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 22; i++) { const a = -.6 + R() * 1.6 + (R() < .5 ? 0 : 0), d = u * (800 + R() * 1400); ctx.globalAlpha = Math.max(0, 1 - u / .14); ctx.fillStyle = '#cfeaff'; ctx.beginPath(); ctx.ellipse(IX + Math.cos(a) * d, IY - 30 + Math.sin(a) * d * .8 + u * u * 4000, 7, 12, a, 0, TAU); ctx.fill(); } ctx.restore(); }
  ring(ctx, IX, IY, 40 + (k - ti) * 3600, 20, 'rgba(255,230,190,.9)', k > ti ? Math.max(0, 1 - (k - ti) / .1) : 0);
  ctx.restore();
}

// ================================================================ MONTAGE controller
const WORDS = [['ספורט', 'rtl', 250], ['SPORT', 'ltr', 218], ['ספורט', 'rtl', 250], ['SPORT', 'ltr', 218]];
const WCOL = [[[0, '#FFF3C4'], [.5, '#FFC24A'], [1, '#E48A12']], [[0, '#FFFFFF'], [.5, '#BFE3FF'], [1, '#5AA8FF']], [[0, '#F4FFB0'], [.5, '#B8F03A'], [1, '#4FA80F']], [[0, '#FFFFFF'], [.5, '#FFB37A'], [1, '#FF4A2A']]];
const WSTK = ['#3A1A00', '#06124a', '#0b3a10', '#4a0a08'];
function montage(ctx, t) {
  const B = LT.b; let i = B.findIndex((b, j) => j < 4 && t >= b && t < B[j + 1]); if (i < 0) return;
  const k = t - B[i], fn = [shotFootball, shotDunk, shotTennis, shotBox][i];
  fn(ctx, k, t);
  // cinematic grade: vignette + bottom shade for word legibility
  ctx.save(); ctx.fillStyle = LIN(ctx, 0, 1000, 0, 1240, [[0, 'rgba(2,4,20,0)'], [1, 'rgba(2,4,20,.6)']]); ctx.fillRect(0, 1000, W, 300); ctx.restore();
  speedLines(ctx, 540, 800, t, 34, i === 3 ? '#ffd2a8' : '#cfe4ff', 380, 1300, .32, 6);
  const [txt, dir, size] = WORDS[i];
  slam(ctx, txt, 540, 1042, size, k - .03, { dir, grad: WCOL[i], stroke: WSTK[i], glowCol: 'rgba(0,0,0,.55)', rot: i % 2 ? .05 : -.05, sw: .17, back: 'rgba(255,255,255,.9)' });
  // cut flash + chroma kick on the first frames of each beat
  V.flash(ctx, t, B[i], .07, '#ffffff', i === 0 ? .0 : .9);
  if (k < .09) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k / .09) * .5; ctx.fillStyle = 'rgba(255,60,90,1)'; ctx.fillRect(0, 0, 14, H); ctx.fillStyle = 'rgba(60,170,255,1)'; ctx.fillRect(W - 14, 0, 14, H); ctx.restore(); }
}

// ================================================================ SPORT 5 BUMPER
const C5 = { blue: '#1E5BFF', navy: '#071A6B', red: '#FF2D3D', white: '#FFFFFF', sky: '#6CC8FF' };
function ribbon(ctx, cx, cy, rx, ry, rot, a0, a1, wMax, fill) {   // tapered orbit swoosh
  const N = 40, out = [], inn = [];
  for (let i = 0; i <= N; i++) { const u = i / N, an = lerp(a0, a1, u), w = wMax * Math.sin(u * Math.PI) ** .8, ca = Math.cos(an), sa = Math.sin(an); out.push([ca * (rx + w / 2), sa * (ry + w / 2)]); inn.push([ca * (rx - w / 2), sa * (ry - w / 2)]); }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath(); out.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) ctx.lineTo(inn[i][0], inn[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}
function badge(ctx, cx, cy, R, o = {}) {
  const sw = o.shine ?? 0; ctx.save(); ctx.translate(cx, cy); ctx.scale(R / 100, R / 100);
  glow(ctx, 0, 0, 200, '#3D7BFF', .5);
  // orbit swooshes behind
  ribbon(ctx, 0, 0, 132, 44, -.5, Math.PI * 1.02, Math.PI * 2.02, 26, LIN(ctx, -140, 0, 140, 0, [[0, '#FF2D3D'], [1, '#FF7A85']]));
  ctx.save(); ctx.shadowColor = 'rgba(0,10,80,.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = LIN(ctx, -100, -100, 100, 100, [[0, '#FFFFFF'], [.5, '#C9D6F5'], [1, '#8EA3D8']]); ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = RAD(ctx, -30, -50, 10, 110, [[0, '#3E80FF'], [.55, '#1743D6'], [1, '#0A1F86']]); ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.clip();
  // inner swooshes: white + red sweep
  ctx.fillStyle = LIN(ctx, -90, 60, 90, -40, [[0, '#FFFFFF'], [1, '#B8D2FF']]); ctx.beginPath(); ctx.moveTo(-100, 34); ctx.bezierCurveTo(-40, 76, 46, 40, 100, -34); ctx.bezierCurveTo(50, 8, -40, 28, -100, 34); ctx.fill();
  ctx.fillStyle = LIN(ctx, -90, 60, 90, -40, [[0, '#FF2D3D'], [1, '#FF6470']]); ctx.beginPath(); ctx.moveTo(-100, 58); ctx.bezierCurveTo(-30, 104, 60, 64, 100, -6); ctx.bezierCurveTo(56, 40, -40, 70, -100, 58); ctx.fill();
  // stadium light streaks
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18; ctx.fillStyle = '#9FD4FF'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-90 + i * 40, -90); ctx.lineTo(-60 + i * 40, -90); ctx.lineTo(-20 + i * 60, 90); ctx.lineTo(-40 + i * 60, 90); ctx.fill(); }
  ctx.restore();
  // numeral 5
  ctx.save(); ctx.transform(1, 0, -.16, 1, 0, 0); ctx.font = '900 150px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,10,90,.7)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.strokeStyle = '#0A1F86'; ctx.lineWidth = 16; ctx.strokeText('5', 4, -12); ctx.shadowColor = 'transparent';
  ctx.fillStyle = LIN(ctx, 0, -70, 0, 50, [[0, '#FFFFFF'], [1, '#CFE0FF']]); ctx.fillText('5', 4, -12); ctx.restore();
  // gloss
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.clip(); ctx.fillStyle = LIN(ctx, 0, -90, 0, 10, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(0, -52, 82, 46, 0, 0, TAU); ctx.fill();
  if (sw > 0 && sw < 1) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = LIN(ctx, -120 + sw * 260, -100, -60 + sw * 260, 100, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-100, -100, 200, 200); }
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.stroke();
  // front orbit swoosh (white) over badge
  ribbon(ctx, 0, 0, 132, 44, -.5, Math.PI * .02, Math.PI * 1.02, 22, LIN(ctx, -140, 0, 140, 0, [[0, '#FFFFFF'], [1, '#9FD0FF']]));
  ctx.restore();
}
function wordmark5(ctx, x, y, size, k) {   // "ספורט 5"
  if (k < 0) return; const sc = k < .16 ? eob(k / .16) : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,10,80,.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.strokeStyle = '#08195f'; ctx.lineWidth = size * .2; ctx.strokeText('ספורט 5', 0, 0); ctx.shadowColor = 'transparent';
  ctx.fillStyle = LIN(ctx, 0, -size * .5, 0, size * .5, [[0, '#FFFFFF'], [.55, '#EAF1FF'], [1, '#9FC2FF']]); ctx.fillText('ספורט 5', 0, 0);
  // red underline swoosh
  ctx.fillStyle = LIN(ctx, -size * 1.6, 0, size * 1.6, 0, [[0, 'rgba(255,45,61,0)'], [.2, '#FF2D3D'], [.8, '#FF2D3D'], [1, 'rgba(255,45,61,0)']]);
  ctx.beginPath(); ctx.moveTo(-size * 1.7, size * .68); ctx.quadraticCurveTo(0, size * .5, size * 1.7, size * .7); ctx.quadraticCurveTo(0, size * .82, -size * 1.7, size * .68); ctx.fill();
  ctx.restore();
}
function confetti(ctx, k, orig, n, seed, cols, spd = 1300, life = 1.6) {
  if (k < 0) return; const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const o = orig[i % orig.length], an = o[2] + (R() - .5) * o[3], v = spd * (.3 + R() * .8), ph = R() * TAU, sz = 12 + R() * 16, col = cols[Math.floor(R() * cols.length)], tau = k * (.8 + R() * .5);
    const drag = (1 - Math.exp(-3.2 * tau)) / 3.2, x = o[0] + Math.cos(an) * v * drag + Math.sin(tau * 7 + ph) * 26 * tau, y = o[1] + Math.sin(an) * v * drag + 520 * tau * tau * .55 + 80 * tau;
    const al = 1 - cl((k - life * .6) / (life * .4)); if (al <= 0) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ph + tau * 9); ctx.scale(1, Math.abs(Math.cos(tau * 11 + ph)) * .9 + .1); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); ctx.restore();
  }
}
function net(ctx, k, imp, S) {   // goal + net with ripple. imp=[x,y] on back plane. k = seconds since impact (<0 none)
  const FR = { x0: 120, x1: 960, y0: 780, y1: 1170 }, BK = { x0: 250, x1: 830, y0: 830, y1: 1140 };
  const nx = 16, ny = 9, pts = [];
  const disp = (x, y) => { if (k < 0) return [0, 0]; const dx = x - imp[0], dy = y - imp[1], d = Math.hypot(dx, dy), a = Math.exp(-k * 3.6) * Math.exp(-d / 420) * 46 * (k < .02 ? k / .02 : 1), ph = Math.sin(d * .045 - k * 46) * a; return [dx / (d + 40) * ph * .5, ph + a * .8 * Math.exp(-d / 160)]; };
  for (let j = 0; j <= ny; j++) { pts[j] = []; for (let i = 0; i <= nx; i++) { const x = lerp(BK.x0, BK.x1, i / nx), y = lerp(BK.y0, BK.y1, j / ny), d = disp(x, y); pts[j][i] = [x + d[0], y + d[1]]; } }
  ctx.save();
  ctx.fillStyle = 'rgba(0,10,60,.5)'; ctx.fillRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0);
  ctx.strokeStyle = 'rgba(210,230,255,.55)'; ctx.lineWidth = 2.5;
  // side/roof net (front frame corners to back corners)
  const conn = (i, j, fx, fy) => { ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(pts[j][i][0], pts[j][i][1]); ctx.stroke(); };
  for (let j = 0; j <= ny; j += 1) { conn(0, j, FR.x0, lerp(FR.y0, FR.y1, j / ny)); conn(nx, j, FR.x1, lerp(FR.y0, FR.y1, j / ny)); }
  for (let i = 0; i <= nx; i += 1) conn(i, 0, lerp(FR.x0, FR.x1, i / nx), FR.y0);
  ctx.strokeStyle = 'rgba(235,245,255,.9)'; ctx.lineWidth = 3;
  for (let j = 0; j <= ny; j++) { ctx.beginPath(); pts[j].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
  for (let i = 0; i <= nx; i++) { ctx.beginPath(); for (let j = 0; j <= ny; j++) j ? ctx.lineTo(pts[j][i][0], pts[j][i][1]) : ctx.moveTo(pts[j][i][0], pts[j][i][1]); ctx.stroke(); }
  // frame
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(120,190,255,.9)'; ctx.shadowBlur = 24;
  ctx.strokeStyle = LIN(ctx, 0, FR.y0, 0, FR.y1, [[0, '#FFFFFF'], [1, '#C8D8F8']]); ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(FR.x0, FR.y1); ctx.lineTo(FR.x0, FR.y0); ctx.lineTo(FR.x1, FR.y0); ctx.lineTo(FR.x1, FR.y1); ctx.stroke();
  ctx.restore();
}
function scoreboard(ctx, x, y, kIn, kGoal) {
  if (kIn < 0) return; const slide = eob(kIn / .3), ox = (1 - slide) * -1200, a = cl(kIn / .1);
  ctx.save(); ctx.translate(540 + ox, y); ctx.globalAlpha = a;
  const w = 940, h = 132;
  ctx.shadowColor = 'rgba(0,10,60,.7)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = LIN(ctx, 0, -h / 2, 0, h / 2, [[0, '#101C58'], [1, '#050C33']]); V.rr(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(160,200,255,.7)'; ctx.lineWidth = 3; V.rr(ctx, -w / 2, -h / 2, w, h, 30); ctx.stroke();
  // team blocks
  ctx.save(); V.rr(ctx, -w / 2, -h / 2, w, h, 30); ctx.clip();
  ctx.fillStyle = LIN(ctx, 0, -h / 2, 0, h / 2, [[0, '#FFE04A'], [1, '#F0B000']]); ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-90, -h / 2); ctx.lineTo(-130, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill();
  ctx.fillStyle = LIN(ctx, 0, -h / 2, 0, h / 2, [[0, '#FF5A5F'], [1, '#D01A28']]); ctx.beginPath(); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(90, -h / 2); ctx.lineTo(130, h / 2); ctx.lineTo(w / 2, h / 2); ctx.fill();
  ctx.fillStyle = LIN(ctx, 0, -h / 2, 0, 0, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-w / 2, -h / 2, w, h / 2); ctx.restore();
  ctx.font = '900 54px Rubik'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.direction = 'ltr';
  ctx.fillStyle = '#1743C9'; ctx.fillText('YEL', -w / 2 + 130, 4); ctx.fillStyle = '#fff'; ctx.fillText('RED', w / 2 - 130, 4);
  // score
  const g = kGoal >= 0 ? 2 : 1, pop = kGoal >= 0 ? 1 + .5 * Math.exp(-kGoal * 9) * Math.cos(kGoal * 30) : 1;
  ctx.font = '900 96px Rubik'; ctx.fillStyle = '#fff';
  ctx.save(); ctx.translate(-56, 4); ctx.scale(pop, pop); if (kGoal >= 0) { ctx.shadowColor = '#FFE04A'; ctx.shadowBlur = 30; ctx.fillStyle = '#FFE9A0'; } ctx.fillText(String(g), 0, 0); ctx.restore();
  ctx.fillStyle = '#7FB0FF'; ctx.fillText(':', 0, -4); ctx.fillStyle = '#fff'; ctx.fillText('1', 56, 4);
  // clock + live
  ctx.font = '800 30px Rubik'; ctx.fillStyle = '#8FD0FF'; ctx.fillText(kGoal >= 0 ? "90'" : "89'", 0, h / 2 + 28 * 0 + 46);
  ctx.fillStyle = '#FF2D3D'; ctx.beginPath(); ctx.arc(-44, -h / 2 - 22, 8 * (.8 + .2 * Math.sin(kIn * 20)), 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('LIVE', -28, -h / 2 - 20);
  ctx.restore();
}
function sport5(ctx, t) {
  const k = t - LT.s5, HERO = eio((k - .78) / .3);
  // background
  ctx.fillStyle = RAD(ctx, 540, 640, 60, 1500, [[0, '#2358FF'], [.35, '#0B2BB0'], [1, '#040B3A']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(540, lerp(600, 380, HERO));
  for (let i = 0; i < 14; i++) { const an = i * TAU / 14 + t * .25; ctx.rotate(0); ctx.save(); ctx.rotate(an); ctx.fillStyle = LIN(ctx, 0, 0, 0, -1900, [[0, 'rgba(140,190,255,.30)'], [1, 'rgba(140,190,255,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, -1900); ctx.lineTo(70, -1900); ctx.fill(); ctx.restore(); }
  ctx.restore();
  // diagonal energy bands
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(-.42);
  const bands = [['#FF2D3D', 1000, 90, .30], ['#FFFFFF', 1120, 42, .22], ['#2F6BFF', 1220, 130, .35]];
  bands.forEach(([c, y, hh, a], i) => { const off = fmod(t * (900 + i * 300) + i * 500, 2600) - 700; ctx.globalAlpha = a; ctx.fillStyle = LIN(ctx, off - 900, 0, off + 300, 0, [[0, 'rgba(0,0,0,0)'], [.7, c], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(off - 900, y - hh / 2 - 500 + i * 60, 1200, hh); });
  ctx.restore();
  V.bokeh(ctx, t, { seed: 12, alpha: .8, cols: ['#6CC8FF', '#FFFFFF', '#FF5A64', '#3D7BFF'] });
  V.flash(ctx, t, LT.s5, .1, '#CFE4FF', 1);
  // ---- racing ball reveal (0.02 .. 0.30)
  const rk = inv(.02, .3, k);
  if (k < .34) {
    const P0 = [-160, 1420], P1 = [120, 520], P2 = [980, 1000], P3 = [540, 590], u = ein(rk * .75 + .25 * rk), bez = (u, a, b, c, d) => Math.pow(1 - u, 3) * a + 3 * Math.pow(1 - u, 2) * u * b + 3 * (1 - u) * u * u * c + u * u * u * d;
    const pos = u2 => [bez(u2, P0[0], P1[0], P2[0], P3[0]), bez(u2, P0[1], P1[1], P2[1], P3[1])];
    const cols = [['#FF2D3D', 26], ['#FFFFFF', 18], ['#2F6BFF', 30]];
    cols.forEach(([c, wdt], ci) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c; ctx.lineCap = 'round'; const n = 26; for (let i = 0; i < n; i++) { const a = u * (i / n) * .0 + Math.max(0, u - .55 * (1 - i / n) * Math.min(1, u * 2.2)), b = Math.max(0, u - .55 * (1 - (i + 1) / n) * Math.min(1, u * 2.2)); if (b <= a) continue; const p = pos(a), q = pos(b); ctx.globalAlpha = (i / n) * .95 * (1 - cl((k - .3) / .06)); ctx.lineWidth = wdt * (i / n) * (1 + .3 * Math.sin(k * 60 + ci)); ctx.beginPath(); ctx.moveTo(p[0] + (ci - 1) * 14, p[1] + (ci - 1) * 8); ctx.lineTo(q[0] + (ci - 1) * 14, q[1] + (ci - 1) * 8); ctx.stroke(); } ctx.restore(); });
    const bp = pos(u); if (u < 1) { ball(ctx, bp[0], bp[1], 46 + 30 * u, k * 60); glow(ctx, bp[0], bp[1], 200, '#9FD4FF', .5); }
  }
  // badge pop @ .30
  const bk = k - .30;
  if (bk >= 0) {
    const pos = lerp(1, 0, HERO), cy = lerp(600, 350, HERO), R = lerp(300, 168, HERO) * (bk < .3 ? eob(bk / .3) : 1);
    ctx.save(); ctx.translate(540, cy); ctx.rotate((1 - eo(bk / .4)) * -.35); ctx.translate(-540, -cy);
    badge(ctx, 540, cy, R, { shine: cl((bk - .12) / .35) }); ctx.restore(); void pos;
    ring(ctx, 540, cy, 200 + bk * 2400, 16, 'rgba(255,255,255,.9)', Math.max(0, 1 - bk / .16));
    ring(ctx, 540, cy, 120 + bk * 1600, 30, 'rgba(255,45,61,.8)', Math.max(0, 1 - bk / .2));
    wordmark5(ctx, 540, lerp(1000, 610, HERO), lerp(210, 130, HERO), k - .40);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const R2 = rng(i + 30), ax = 540 + (R2() - .5) * 700, ay = cy + (R2() - .5) * 500, kk = (k * 2 + i * .37) % 1; V.sparkle(ctx, ax, ay, 26 * Math.sin(kk * Math.PI), '#fff', kk * 2, .9 * (bk > .1 ? 1 : 0)); } ctx.restore();
  }
  // scoreboard + goal
  const kS = k - .86, kI = k - 1.14, IMP = [560, 990];
  const ny = eo((k - .85) / .3);
  if (k > .82) { ctx.save(); ctx.globalAlpha = ny; ctx.translate(0, (1 - ny) * 400); net(ctx, kI, IMP); ctx.restore(); }
  scoreboard(ctx, 0, 740, kS, kI);
  // ball into net
  if (k > .95 && k < 1.32) {
    const u = cl((k - .95) / .19), e = ein(u * .9 + .1), sx = 1240, sy = 1500, pos = [lerp(sx, IMP[0], e), lerp(sy, IMP[1] + 30, e) - Math.sin(u * Math.PI) * 220];
    const prev = [lerp(sx, IMP[0], ein(cl(u - .16) * .9 + .1)), lerp(sy, IMP[1] + 30, ein(cl(u - .16) * .9 + .1)) - Math.sin(cl(u - .16) * Math.PI) * 220];
    if (k < 1.14) { trail(ctx, prev[0], prev[1], pos[0], pos[1], 70, '#8fd0ff', 1); ball(ctx, pos[0], pos[1], lerp(64, 42, u), k * 50); }
    else { const dd = k - 1.14; ball(ctx, IMP[0] + dd * 60, IMP[1] + 30 + Math.min(dd * 260, 40) + 60 * dd * dd * 8, 42, k * 20); }
  }
  if (kI >= 0) {
    burst(ctx, IMP[0], IMP[1], kI / .22, '#BFE0FF', 700, 20, 22); V.flash(ctx, t, LT.s5 + 1.14, .16, '#ffffff', .9);
    // GOAL slam
    slam(ctx, 'GOAL', 540, 1000, 330, kI - .0, { dir: 'ltr', grad: [[0, '#FFFFFF'], [.5, '#FFF3C4'], [1, '#FFC24A']], stroke: '#E01E2E', sw: .2, back: '#071A6B', rot: -.07, glowCol: 'rgba(255,45,61,.6)', weight: 900, font: 'Rubik' });
  }
  confetti(ctx, kI, [[60, 1500, -1.15, .7], [1020, 1500, -2.0, .7], [540, 1240, -1.57, 1.2]], 130, 5, ['#2F6BFF', '#FFFFFF', '#FF2D3D', '#FFC24A', '#6CC8FF'], 1700, 1.5);
  // exit flash into Charlton
  V.flash(ctx, t, 11.96, .09, '#FF8A1F', .9);
}

// ================================================================ CHARLTON BUMPER
const CH = { or: '#FF6A00', or2: '#FF9A2E', bk: '#0A0A0C' };
function fit(ctx, txt, font, maxW, size0) { ctx.save(); ctx.font = font.replace('%', size0); ctx.direction = 'rtl'; const w = ctx.measureText(txt).width; ctx.restore(); return Math.min(size0, size0 * maxW / w); }
function stripes(ctx, t, col, a = 1, ang = -.5, wd = 86, spd = 600, bg = null) {
  ctx.save(); if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
  ctx.translate(540, 960); ctx.rotate(ang); ctx.fillStyle = col; ctx.globalAlpha = a; const off = fmod(t * spd, wd * 2);
  for (let i = -30; i < 30; i++) ctx.fillRect(-1600, i * wd * 2 - off, 3200, wd);
  ctx.restore();
}
function stopwatch(ctx, cx, cy, R, k) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#FF6A00'; V.rr(ctx, -22, -R - 46, 44, 40, 8); ctx.fill(); V.rr(ctx, -36, -R - 70, 72, 30, 10); ctx.fill();
  ctx.save(); ctx.rotate(.75); V.rr(ctx, -16, -R - 40, 32, 36, 8); ctx.fill(); ctx.restore();
  ctx.shadowColor = 'rgba(255,106,0,.8)'; ctx.shadowBlur = 60; ctx.fillStyle = LIN(ctx, -R, -R, R, R, [[0, '#FFB060'], [.5, '#FF6A00'], [1, '#B33A00']]); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#0A0A0C'; ctx.beginPath(); ctx.arc(0, 0, R * .86, 0, TAU); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i * TAU / 60, L = i % 5 ? R * .06 : R * .14; ctx.strokeStyle = i % 5 ? 'rgba(255,255,255,.55)' : '#fff'; ctx.lineWidth = i % 5 ? 4 : 8; ctx.beginPath(); ctx.moveTo(Math.sin(a) * (R * .8), -Math.cos(a) * R * .8); ctx.lineTo(Math.sin(a) * (R * .8 - L), -Math.cos(a) * (R * .8 - L)); ctx.stroke(); }
  const sw = k * 26; ctx.fillStyle = 'rgba(255,106,0,.85)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * .74, -Math.PI / 2, -Math.PI / 2 + (sw % TAU)); ctx.fill();
  ctx.save(); ctx.rotate(sw); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, R * .16); ctx.lineTo(0, -R * .76); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#FF6A00'; ctx.beginPath(); ctx.arc(0, 0, R * .09, 0, TAU); ctx.fill();
  ctx.font = `900 ${R * .32}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = '#fff'; ctx.fillText('0' + (Math.floor(k * 90) % 10) + ':' + (10 + Math.floor(k * 333) % 90), 0, R * .42);
  ctx.restore();
}
function raceCar(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(0, 78, 380, 22, 0, 0, TAU); ctx.fill();
  const body = new Path2D('M-350 38 C-352 -8 -280 -18 -190 -28 C-130 -80 -40 -108 40 -108 C130 -108 190 -62 232 -30 C322 -20 352 8 352 40 L332 66 L-330 66 Z');
  ctx.fillStyle = LIN(ctx, 0, -110, 0, 70, [[0, '#FFB060'], [.45, '#FF6A00'], [1, '#B33A00']]); ctx.fill(body);
  ctx.fillStyle = '#0A0A0C'; ctx.beginPath(); ctx.moveTo(-150, -32); ctx.bezierCurveTo(-100, -76, -20, -96, 40, -96); ctx.bezierCurveTo(110, -96, 160, -60, 190, -32); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-120, -36); ctx.bezierCurveTo(-90, -68, -30, -84, 10, -88); ctx.lineTo(-20, -36); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-200, 10, 400, 10); ctx.fillStyle = '#0A0A0C'; ctx.fillRect(-60, -32, 8, 90);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.stroke(body);
  ctx.fillStyle = '#0A0A0C'; ctx.beginPath(); ctx.moveTo(-350, -20); ctx.lineTo(-380, -60); ctx.lineTo(-300, -60); ctx.lineTo(-300, -20); ctx.fill(); ctx.fillStyle = CH.or; ctx.fillRect(-392, -70, 110, 12);
  for (const wx of [-210, 210]) { ctx.save(); ctx.translate(wx, 62); ctx.fillStyle = '#0A0A0C'; ctx.beginPath(); ctx.arc(0, 0, 64, 0, TAU); ctx.fill(); ctx.strokeStyle = CH.or; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.stroke(); ctx.rotate(t * 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -42); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}
function glove(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const g1 = LIN(ctx, -200, -200, 200, 200, [[0, '#FF9A2E'], [.5, '#FF6A00'], [1, '#A83400']]);
  ctx.shadowColor = 'rgba(255,106,0,.7)'; ctx.shadowBlur = 60;
  ctx.fillStyle = '#1a1a1e'; V.rr(ctx, -130, 120, 260, 190, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff'; ctx.fillRect(-130, 176, 260, 14);
  ctx.fillStyle = g1; ctx.beginPath(); ctx.moveTo(-170, 140); ctx.bezierCurveTo(-230, -60, -190, -230, 0, -240); ctx.bezierCurveTo(190, -230, 230, -60, 170, 140); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-150, 20, 70, 100, .3, 0, TAU); ctx.fillStyle = LIN(ctx, -220, -80, -80, 120, [[0, '#FFAA55'], [1, '#C24A00']]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-70, -40); ctx.quadraticCurveTo(0, 20, 90, -30); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(40, -150, 90, 40, -.3, 0, TAU); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#0A0A0C'; ctx.beginPath(); ctx.moveTo(-170, 140); ctx.bezierCurveTo(-230, -60, -190, -230, 0, -240); ctx.bezierCurveTo(190, -230, 230, -60, 170, 140); ctx.stroke();
  ctx.restore();
}
function chLockup(ctx, k, o = {}) {
  const sc = k < .1 ? lerp(2.4, 1, eo(k / .1)) : 1 + .05 * Math.exp(-(k - .1) * 12) * Math.sin((k - .1) * 50);
  ctx.save(); ctx.translate(540, 900); ctx.scale(sc, sc);
  const size = fit(ctx, 'CHARLTON', '900 %px Rubik', 960, 188);
  ctx.transform(1, 0, -.2, 1, 0, 0); ctx.font = `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const mode = o.mode || 0;
  for (let i = 18; i >= 1; i--) { ctx.fillStyle = i % 6 < 3 ? '#C24A00' : '#8A3200'; ctx.fillText('CHARLTON', i * 1.3, i * 1.3); }
  ctx.strokeStyle = '#0A0A0C'; ctx.lineWidth = size * .09; ctx.strokeText('CHARLTON', 0, 0);
  ctx.fillStyle = mode === 1 ? '#00E5FF' : mode === 2 ? '#FF2D6A' : LIN(ctx, 0, -size * .5, 0, size * .5, [[0, '#FFFFFF'], [.55, '#FFF0DC'], [1, '#FFB060']]); ctx.fillText('CHARLTON', 0, 0);
  ctx.restore();
  // Hebrew chip
  ctx.save(); ctx.translate(540, 1075); const ck = cl((k - .08) / .12), cs = eob(ck); ctx.scale(cs, cs); ctx.transform(1, 0, -.2, 1, 0, 0);
  ctx.fillStyle = mode === 1 ? '#00E5FF' : mode === 2 ? '#FF2D6A' : CH.or; ctx.shadowColor = 'rgba(255,106,0,.8)'; ctx.shadowBlur = 40; V.rr(ctx, -300, -84, 600, 168, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#0A0A0C'; ctx.font = '900 140px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText("צ'רלטון", 0, 6);
  ctx.restore();
}
function charlton(ctx, t) {
  const k = t - LT.ch;
  ctx.fillStyle = CH.bk; ctx.fillRect(0, 0, W, H);
  if (k < .27) {   // A: orange slab + Hebrew slam
    stripes(ctx, t, '#E85A00', 1, -.5, 90, 500, CH.or);
    const wp = eo(k / .1); ctx.save(); ctx.fillStyle = CH.bk; ctx.translate(0, 0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * (1 - wp) + 0, 0); ctx.lineTo(W * (1 - wp) - 300, H); ctx.lineTo(0, H); ctx.fill(); ctx.restore();
    const size = fit(ctx, "צ'רלטון", '900 %px Rubik', 960, 270);
    slam(ctx, "צ'רלטון", 540, 900, size, k - .02, { dir: 'rtl', fill: CH.bk, stroke: '#fff', sw: .09, shadow: false, rot: -.05, back: '#000' });
    V.flash(ctx, t, LT.ch, .08, '#fff', .9);
    speedLines(ctx, 540, 900, t, 30, '#fff', 400, 1400, .3, 8);
  } else if (k < .63) {   // B: three quick cuts
    const q = Math.min(2, Math.floor((k - .27) / .12)), kq = (k - .27) - q * .12;
    stripes(ctx, t, 'rgba(255,106,0,.22)', 1, -.5, 90, 900, CH.bk);
    ctx.save(); ctx.translate((A.hash(q + 4) - .5) * 14 * Math.exp(-kq * 12), 0);
    speedLines(ctx, 540, 860, t, 40, CH.or2, 260, 1300, .5, 8);
    if (q === 0) { stopwatch(ctx, 540, 830, 330 * lerp(.75, 1.08, eo(kq / .12)), k * 1.4); }
    else if (q === 1) { const cx = lerp(1500, -300, eo(kq / .12)); for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx + 180 + i * 60, 820 + (i % 4) * 30 - 40, 420 + hash(i) * 400, 8); } raceCar(ctx, cx, 860, 1.5, t); }
    else { glove(ctx, 540, 860, lerp(.5, 1.55, ein(kq / .12)) * 1.4, -.4); burst(ctx, 540, 820, kq / .12, '#FF9A2E', 700, 18, 5); }
    ctx.restore();
    ctx.fillStyle = CH.or; ctx.fillRect(0, 150, W, 14); ctx.fillRect(0, 1160, W, 14);
    V.flash(ctx, t, LT.ch + .27 + q * .12, .05, '#FFE0C0', .8);
    ctx.save(); ctx.font = '900 60px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.direction = 'ltr'; ctx.transform(1, 0, -.2, 1, 0, 0); ctx.fillText('CHARLTON', 540 + 90, 240); ctx.restore();
  } else {   // C: lockup + glitch out
    const kk = k - .63;
    stripes(ctx, t, 'rgba(255,106,0,.28)', 1, -.5, 90, 300, CH.bk);
    ctx.fillStyle = CH.or; ctx.beginPath(); ctx.moveTo(0, 540); ctx.lineTo(W, 380); ctx.lineTo(W, 420); ctx.lineTo(0, 580); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 1180); ctx.lineTo(W, 1020); ctx.lineTo(W, 1060); ctx.lineTo(0, 1220); ctx.fill();
    glow(ctx, 540, 900, 800, '#FF6A00', .35 * Math.exp(-kk * 4) + .12);
    const gl = kk > .34 ? Math.min(1, (kk - .34) / .1) : 0;
    if (gl > 0) {
      const R = rng(Math.floor(t * 30) + 2);
      for (let i = 0; i < 6; i++) { const y0 = R() * 700 + 500, hh = 40 + R() * 140, dx = (R() - .5) * 220 * gl; ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, hh); ctx.clip(); ctx.translate(dx, 0); chLockup(ctx, kk, { mode: 1 + (i % 2) }); ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.translate(-16 * gl, 0); chLockup(ctx, kk, { mode: 1 }); ctx.translate(32 * gl, 0); chLockup(ctx, kk, { mode: 2 }); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1920); ctx.clip(); const y1 = R() * 1000 + 300; ctx.globalAlpha = .9; ctx.fillStyle = '#fff'; ctx.fillRect(0, y1, W, 5); ctx.restore();
    } else chLockup(ctx, kk);
    burst(ctx, 540, 900, kk / .2, '#FF9A2E', 760, 24, 3);
    V.flash(ctx, t, LT.ch + .63, .1, '#fff', 1);
    if (kk < .3) speedLines(ctx, 540, 900, t, 26, '#FFB060', 400, 1400, .35 * (1 - kk / .3), 8);
  }
}

// ================================================================ MAIN
A.scene({
  name: 'v3_sports', start: 9.05, end: 13.40,
  draw(ctx, s) {
    const t = s.t;
    let dx = 0, edge = 0;
    if (t < LT.cov) { const u = inv(LT.ent, LT.cov, t); dx = W * Math.pow(1 - u, 3.2); edge = 1; }
    if (t >= LT.end) { const u = inv(LT.end, LT.out, t); dx = -W * ein(u) * 1.02; edge = -1; }
    ctx.save(); ctx.translate(dx, 0);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.fillStyle = '#04060f'; ctx.fillRect(0, 0, W, H);
    if (t < LT.s5) montage(ctx, t); else if (t < LT.ch) sport5(ctx, t); else charlton(ctx, t);
    ctx.restore();
    if (edge === 1 && dx > 2) { ctx.save(); ctx.translate(dx, 0); whipBand(ctx, 0, -1, 1); ctx.restore(); }
    if (edge === -1) { ctx.save(); ctx.translate(dx + W, 0); whipBand(ctx, 0, 1, 1); ctx.restore(); }
  }
});
A.V3 = { flare, burst, ball, trail, slam, speedLines, figure, POSE, KIT, whipBand, lightBank, feet };
})();
