// S2b sports: montage 9.05-10.25, Sport 5 bumper 10.25-12.05, Charlton bumper 12.05-13.10, whip-out tail to 13.40
(() => {
const W = 1920, H = 1080, OL = A.OUTLINE, TAU = A.TAU, E = A.ease, inv = A.inv, cl = A.clamp;
const fmod = (a, b) => ((a % b) + b) % b;
const lp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const NAVY = '#06124a';

// ------------------------------------------------------------ athletes
const KIT = {
  yb: { shirt: '#FFD21F', short: '#1A47C8', sock: '#FFD21F', skin: '#F0B088', hair: '#2a1a12', shoe: '#ffffff' },
  red: { shirt: '#E8322B', short: '#ffffff', sock: '#E8322B', skin: '#B9774B', hair: '#1a1310', shoe: '#ffffff' },
  bball: { shirt: '#3D7BFF', short: '#2456d6', sock: '#ffffff', skin: '#7A4A2E', hair: '#120c0a', shoe: '#FFC24A' },
  tennis: { shirt: '#ffffff', short: '#1a1330', sock: '#ffffff', skin: '#F0B088', hair: '#7a4a1a', shoe: '#38D9F5' },
  box1: { shirt: '#F0B088', short: '#FFC24A', sock: '#ffffff', skin: '#F0B088', hair: '#2a1a12', shoe: '#E8322B', glove: '#E8322B' },
  box2: { shirt: '#B9774B', short: '#3D7BFF', sock: '#ffffff', skin: '#B9774B', hair: '#120c0a', shoe: '#3D7BFF', glove: '#3D7BFF' },
  mma1: { shirt: '#F0B088', short: '#FF6A00', sock: '#F0B088', skin: '#F0B088', hair: '#2a1a12', shoe: '#F0B088', glove: '#111111' },
  mma2: { shirt: '#8a5a3a', short: '#f2f2f2', sock: '#8a5a3a', skin: '#8a5a3a', hair: '#120c0a', shoe: '#8a5a3a', glove: '#f2f2f2' },
  run: { shirt: '#FF6A00', short: '#111111', sock: '#F0B088', skin: '#F0B088', hair: '#2a1a12', shoe: '#ffffff' },
};
// pose: head(2) neck(2) hip(2) arm1 elbow,hand arm2 elbow,hand leg1 knee,foot leg2 knee,foot (front limbs = 1)
const P = {
  kickA: [8, -232, 2, -175, 0, 0, 55, -150, 100, -185, -45, -135, -85, -100, -55, 70, -130, 45, 30, 95, 25, 195],
  kickB: [22, -228, 18, -172, 0, 0, -35, -135, -80, -160, 60, -140, 115, -125, 75, 25, 165, -25, 0, 95, -12, 195],
  jump: [-5, -225, 0, -172, 0, 0, -40, -200, -70, -270, 50, -190, 60, -260, 40, 80, 10, 140, -30, 80, -50, 130],
  dunkA: [15, -190, 10, -140, 0, 0, 45, -110, 80, -140, -30, -100, -40, -60, 45, 60, 10, 120, -20, 60, -45, 120],
  dunkB: [15, -225, 8, -175, 0, 0, 70, -255, 110, -350, -50, -200, -90, -250, 50, 80, -10, 140, -35, 85, -85, 120],
  serveA: [0, -230, -5, -178, 0, 0, -55, -190, -70, -250, 50, -230, 60, -300, 30, 90, 20, 190, -20, 90, -40, 190],
  serveB: [-10, -225, 0, -172, 0, 0, 30, -250, 45, -340, -40, -140, -70, -110, 10, 90, 0, 170, -50, 80, -90, 120],
  boxA: [30, -212, 20, -165, 0, 0, 40, -110, 85, -165, 50, -100, 90, -150, 40, 80, 80, 175, -50, 85, -90, 175],
  boxB: [45, -212, 35, -165, 0, 0, 100, -160, 235, -185, 40, -115, 80, -165, 45, 80, 90, 175, -55, 85, -100, 175],
  hurtA: [35, -215, 20, -165, 0, 0, 40, -110, 85, -160, 50, -100, 90, -150, 40, 80, 80, 175, -50, 85, -90, 175],
  hurtB: [-35, -210, -10, -165, 0, 0, -30, -120, -60, -170, 20, -110, -10, -150, 30, 90, 60, 180, -40, 90, -80, 170],
  runA: [35, -215, 25, -170, 0, 0, 75, -110, 50, -175, -55, -110, -100, -70, 100, -15, 70, 90, -40, 80, -140, 110],
  runB: [35, -215, 25, -170, 0, 0, -55, -110, -100, -70, 75, -110, 50, -175, -40, 80, -140, 110, 100, -15, 70, 90],
  slide: [-5, -190, 0, -140, 0, 0, 70, -170, 140, -230, -70, -170, -140, -235, 70, 20, 20, 110, 50, 45, -10, 115],
  dive: [30, -215, 20, -170, 0, 0, 80, -190, 150, -230, 60, -160, 130, -170, -30, 70, -90, 120, 20, 90, -50, 140],
};
function fig(ctx, x, y, s, pose, kit, o = {}) {
  const fl = o.flip ? -1 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * fl, s); if (o.rot) ctx.rotate(o.rot);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const [hx, hy, nx, ny, px, py, a1ex, a1ey, a1hx, a1hy, a2ex, a2ey, a2hx, a2hy, l1kx, l1ky, l1fx, l1fy, l2kx, l2ky, l2fx, l2fy] = pose;
  const seg = (x0, y0, x1, y1, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  const limb = (x0, y0, x1, y1, x2, y2, w1, c1, w2, c2) => {
    seg(x0, y0, x1, y1, w1 + 14, OL); seg(x1, y1, x2, y2, w2 + 14, OL);
    seg(x0, y0, x1, y1, w1, c1); seg(x1, y1, x2, y2, w2, c2);
  };
  const arm = (ex, ey, hx_, hy_) => {
    limb(nx, ny + 10, ex, ey, hx_, hy_, 32, kit.shirt, 27, kit.skin);
    ctx.beginPath(); ctx.arc(hx_, hy_, kit.glove ? 30 : 17, 0, TAU); A.fillStroke(ctx, kit.glove || kit.skin, 7);
  };
  const leg = (kx, ky, fx, fy) => {
    limb(px, py, kx, ky, fx, fy, 50, kit.short, 32, kit.sock);
    A.ellipse(ctx, fx + 14, fy + 4, 32, 17, 0); A.fillStroke(ctx, kit.shoe, 7);
  };
  arm(a2ex, a2ey, a2hx, a2hy);
  leg(l2kx, l2ky, l2fx, l2fy);
  seg(nx, ny, px, py, 98, OL); seg(nx, ny, px, py, 84, kit.shirt);
  seg(nx, ny + 45, px, py - 30, 84, kit.shirt);
  ctx.beginPath(); ctx.arc(px, py, 50, 0, TAU); A.fillStroke(ctx, kit.short, 7);
  leg(l1kx, l1ky, l1fx, l1fy);
  seg(hx * 0.4 + nx * 0.6, hy * 0.4 + ny * 0.6, nx, ny, 28, kit.skin);
  ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); A.fillStroke(ctx, kit.skin, 7);
  ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); ctx.clip(); ctx.fillStyle = kit.hair; ctx.fillRect(hx - 42, hy - 42, 84, 27); ctx.fillRect(hx - 42, hy - 42, 30, 70); ctx.restore();
  ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = OL; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 17, hy - 2, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(hx + 20, hy - 2, 4.5, 0, TAU); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(hx + 8, hy - 16); ctx.lineTo(hx + 28, hy - 12); ctx.stroke();
  if (o.shout) { ctx.beginPath(); ctx.ellipse(hx + 20, hy + 20, 14, 10 + 6 * o.shout, 0, 0, TAU); A.fillStroke(ctx, '#7a1020', 4); }
  else { ctx.beginPath(); ctx.moveTo(hx + 8, hy + 20); ctx.quadraticCurveTo(hx + 20, hy + 26, hx + 30, hy + 17); ctx.stroke(); }
  arm(a1ex, a1ey, a1hx, a1hy);
  ctx.restore();
}
function ball(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#1a1330';
  const pent = (cx, cy, rr, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  pent(0, 0, r * 0.38, -Math.PI / 2);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5 + TAU / 10; pent(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 0.34, a + Math.PI / 2 + 0.3); }
  ctx.strokeStyle = '#1a1330'; ctx.lineWidth = r * 0.07;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38); ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = Math.max(5, r * 0.12); ctx.strokeStyle = OL; ctx.stroke();
  ctx.restore();
}
// tapered streak between two points (trail)
function streak(ctx, x0, y0, x1, y1, w, col, a = 1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------ backgrounds / fx
function crowd(ctx, t, y0, y1, speed, seed, pal, n = 160) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const q = A.hash(i * 7.7 + seed + 3), x = fmod(A.hash(i * 3.1 + seed) * (W + 260) + t * speed * (0.4 + q), W + 260) - 130;
    const y = y0 + A.hash(i * 1.9 + seed) * (y1 - y0), c = pal[Math.floor(A.hash(i * 5.3 + seed) * pal.length)];
    ctx.globalAlpha = 0.3 + 0.45 * q; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, 26 + q * 50, 13 + q * 10, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function stadium(ctx, t, o) {
  const hz = o.hz;
  ctx.fillStyle = A.linear(ctx, 0, -100, 0, hz, [[0, o.c1], [1, o.c2]]); ctx.fillRect(-150, -150, W + 300, hz + 150);
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 460 + (o.lo || 0), y = 90;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.09; ctx.fillStyle = o.tint;
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.lineTo(x + 360 * (i % 2 ? 1 : -1) + 200, hz + 150); ctx.lineTo(x - 300 * (i % 2 ? 1 : -1) - 100, hz + 150); ctx.closePath(); ctx.fill(); ctx.restore();
    A.glow(ctx, x, y, 380, o.tint, 0.55); A.glow(ctx, x, y, 110, '#fff', 0.9);
  }
  ctx.fillStyle = 'rgba(8,4,30,.55)'; ctx.fillRect(-150, hz - 290, W + 300, 320);
  crowd(ctx, t, hz - 270, hz + 10, o.cs || 700, o.seed || 1, o.pal || ['#FFC24A', '#FF4F9A', '#38D9F5', '#fff', '#3D7BFF']);
  ctx.fillStyle = A.linear(ctx, 0, hz, 0, H + 100, [[0, o.f1], [1, o.f2]]); ctx.fillRect(-150, hz, W + 300, H - hz + 250);
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 5;
  for (let i = -9; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 150, hz); ctx.lineTo(960 + i * 620, H + 100); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let j = 0; j < 6; j++) { const y0 = hz + Math.pow(j / 6, 2) * (H - hz) * 1.2, y1 = hz + Math.pow((j + 0.5) / 6, 2) * (H - hz) * 1.2; ctx.fillRect(-150, y0, W + 300, y1 - y0); }
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-150, hz + 6); ctx.lineTo(W + 150, hz + 6); ctx.stroke();
}
function speedLines(ctx, cx, cy, t, col, n, r0, r1, seed, w = 10) {
  const f = Math.floor(t * 30 / 2); ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = A.hash(i * 2.3 + seed + f * 0.37) * TAU, len = (0.4 + 0.6 * A.hash(i * 4.1 + seed + f)) * (r1 - r0), r = r0 + A.hash(i * 9.1 + f + seed) * (r1 - r0) * 0.3;
    const c = Math.cos(a), s = Math.sin(a), R = r + len, px = -s * w / 2, py = c * w / 2;
    ctx.beginPath(); ctx.moveTo(cx + c * r, cy + s * r); ctx.lineTo(cx + c * R + px, cy + s * R + py); ctx.lineTo(cx + c * R - px, cy + s * R - py); ctx.closePath(); ctx.fill();
  }
}
function hlines(ctx, t, col, n, seed, y0 = 0, y1 = H, len = 900, spd = 6000) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const y = y0 + A.hash(i * 3.3 + seed) * (y1 - y0), L = len * (0.4 + A.hash(i * 5.1 + seed)), x = fmod(A.hash(i + seed) * 3000 - t * spd * (0.6 + A.hash(i * 7 + seed)), W + L + 200) - L;
    ctx.fillRect(x, y, L, 2 + A.hash(i * 9 + seed) * 6);
  }
}
const flash = (ctx, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); };
function impactFrame(ctx, x, y, col = '#111') {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  D.starburst(ctx, x, y, 110, 2400, 26, 0.2, col);
  ctx.beginPath(); ctx.arc(x, y, 150, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  D.starburst(ctx, x, y, 60, 190, 12, 0.5, '#FFC24A');
  ctx.restore();
}
function cam(ctx, fx, fy, z, rot, shake, t) {
  const sx = shake * A.noise1(t * 40) * 26, sy = shake * A.noise1(t * 40 + 50) * 20;
  ctx.translate(fx + sx, fy + sy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-fx, -fy);
}
function shock(ctx, x, y, age, col, maxr = 380) {
  if (age < 0 || age > 0.25) return;
  const p = age / 0.25; ctx.save(); ctx.globalAlpha = 1 - p; ctx.lineWidth = 34 * (1 - p) + 4; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, maxr * E.out(p), 0, TAU); ctx.stroke(); ctx.restore();
  A.glow(ctx, x, y, 260 * (1 - p) + 60, col, 0.9 * (1 - p));
}

// ------------------------------------------------------------ montage
const SH = [9.05, 9.35, 9.65, 9.95, 10.25], IMP = 0.22;
const IMPXY = [[985, 604], [855, 262], [700, 340], [1000, 462]];
const TL = [['כדורגל', '#2CC66A', '#0d6b34'], ['כדורסל', '#FF8A3D', '#c2410c'], ['טניס', '#38D9F5', '#0e7fa0'], ['אגרוף', '#FF4F9A', '#a3155c']];

function shotFoot(ctx, t, u) {
  stadium(ctx, t, { hz: 640, c1: '#1a0f4d', c2: '#6a1fa8', tint: '#FF4F9A', f1: '#1fa456', f2: '#0b5a2e', cs: 1100, seed: 2 });
  speedLines(ctx, 985, 604, t, 'rgba(255,255,255,.33)', 34, 280, 1300, 1);
  const k = A.smooth(0.05, 0.2, u), py = 640 + 6 * Math.sin(u * 30);
  // red defender leaps too late
  fig(ctx, 1380, 720 - 80 * E.out(inv(0.02, 0.22, u)), 1.15, lp(P.jump, P.jump, 0), KIT.red, { flip: true, rot: 0.12 });
  // swoosh arc of kicking leg
  if (u > 0.07 && u < 0.27) { ctx.save(); ctx.globalAlpha = 0.65 * (1 - inv(0.2, 0.27, u)); ctx.strokeStyle = '#fff'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(760, 640, 250, -0.5 - 0.9 * k, -0.05 + 0.1 * k); ctx.stroke(); ctx.restore(); }
  fig(ctx, 760, py, 1.2, lp(P.kickA, P.kickB, k), KIT.yb, { shout: 0.7 });
  // ball
  const p = u / IMP;
  if (u < IMP) ball(ctx, 985 - 30 * (1 - p), 604 - 340 * Math.pow(1 - p, 1.7), 32, p * 3);
  else { const dt = u - IMP, bx = 985 + dt * 6800, by = 604 - dt * 2600;
    streak(ctx, 985, 604, bx, by, 60, '#FFD21F', 0.95); streak(ctx, 985, 610, bx - 60, by + 30, 34, '#3D7BFF', 0.9); streak(ctx, 985, 598, bx - 40, by - 24, 20, '#fff', 0.9);
    ball(ctx, bx, by, 32, 4 + dt * 40); }
  shock(ctx, 985, 604, u - IMP, '#FFD21F');
}
function shotBall(ctx, t, u) {
  stadium(ctx, t, { hz: 690, c1: '#0f0a3a', c2: '#7a2a8a', tint: '#FFC24A', f1: '#d9822f', f2: '#8a4a1a', cs: 1300, seed: 5, lo: 100 });
  speedLines(ctx, 850, 280, t, 'rgba(255,240,200,.3)', 32, 300, 1300, 4);
  const bx = 850, by = 262, sh = u > IMP ? Math.exp(-(u - IMP) * 22) * Math.sin((u - IMP) * 150) : 0;
  // backboard
  ctx.save(); ctx.translate(935, 270); ctx.rotate(sh * 0.05); ctx.translate(-935, -270);
  A.rrect(ctx, 918, 92, 36, 290, 8); A.fillStroke(ctx, '#f2f6ff', 8);
  A.rrect(ctx, 923, 205, 26, 82, 4); ctx.fillStyle = '#E8322B'; ctx.fill();
  // net
  const stretch = u > 0.19 ? 55 * Math.sin(inv(0.19, 0.36, u) * Math.PI) : 0;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  for (let i = 0; i <= 8; i++) { const a = -62 + i * 15.5, b = -34 + i * 8.5; ctx.beginPath(); ctx.moveTo(bx + a, by + 6); ctx.lineTo(bx + b + (i - 4) * 0, by + 100 + stretch); ctx.stroke(); }
  for (let j = 1; j < 4; j++) { const y = by + 6 + j * 24 + stretch * j / 4, w = 62 - j * 8; ctx.beginPath(); ctx.moveTo(bx - w, y); ctx.lineTo(bx + w, y); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(bx, by, 64, 13, 0, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#FF6A2A'; ctx.stroke();
  ctx.restore();
  // player
  const k = A.smooth(0.04, 0.19, u), yo = -115 * E.out(inv(0, 0.2, u));
  for (let g = 1; g <= 3; g++) if (u < 0.22) streak(ctx, 700 + g * 10, 780 + yo + 20 * g, 700 + g * 10, 800 + 80 * g + yo, 20, 'rgba(255,255,255,.5)');
  fig(ctx, 700, 780 + yo, 1.25, lp(P.dunkA, P.dunkB, k), KIT.bball, { shout: 0.9, rot: -0.05 });
  const hy = 780 + yo - 350 * 1.25 - 28;
  const bY = u < 0.14 ? hy : hy + E.in(inv(0.14, 0.3, u)) * (by + 150 - hy);
  ball(ctx, 700 + 110 * 1.25 + 8 + (u > 0.14 ? (bx - 845) * inv(0.14, 0.22, u) : 0), Math.min(bY, by + 130), 34, u * 6);
  shock(ctx, bx, by, u - IMP, '#FFC24A', 320);
}
function tennisPose(u) {
  const k = A.smooth(0.03, 0.2, u), pose = lp(P.serveA, P.serveB, k);
  const dir = [lp([-0.35, 1], [0.2, -1], k)][0], L = Math.hypot(dir[0], dir[1]);
  return { pose, dx: dir[0] / L, dy: dir[1] / L, k };
}
function shotTennis(ctx, t, u) {
  stadium(ctx, t, { hz: 620, c1: '#06204a', c2: '#1a5aa8', tint: '#38D9F5', f1: '#2b6fd6', f2: '#123f8a', cs: 900, seed: 8, lo: -60 });
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(300, H); ctx.lineTo(760, 620); ctx.moveTo(1700, H); ctx.lineTo(1180, 620); ctx.moveTo(-100, 960); ctx.lineTo(2000, 960); ctx.stroke();
  speedLines(ctx, 700, 340, t, 'rgba(255,255,255,.3)', 32, 300, 1300, 7);
  const X = 640, Y = 760, s = 1.25, tp = tennisPose(u), yo = -35 * E.out(inv(0.05, 0.2, u));
  fig(ctx, X, Y + yo, s, tp.pose, KIT.tennis, { shout: 0.6 });
  const hx = X + s * tp.pose[8], hy = Y + yo + s * tp.pose[9], ex = hx + tp.dx * 40 * s, ey = hy + tp.dy * 40 * s;
  // racket (handle + head)
  const rx = hx + tp.dx * 105 * s, ry = hy + tp.dy * 105 * s, ang = Math.atan2(tp.dy, tp.dx);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex + tp.dx * 20, ey + tp.dy * 20); ctx.stroke();
  ctx.strokeStyle = '#FFC24A'; ctx.lineWidth = 10; ctx.stroke();
  A.ellipse(ctx, rx, ry, 62 * s, 44 * s, ang); ctx.lineWidth = 14; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#ff4a3d'; ctx.stroke();
  ctx.save(); A.ellipse(ctx, rx, ry, 58 * s, 40 * s, ang); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(rx + i * 10 * s, ry - 80 * s); ctx.lineTo(rx + i * 10 * s, ry + 80 * s); ctx.moveTo(rx - 80 * s, ry + i * 8 * s); ctx.lineTo(rx + 80 * s, ry + i * 8 * s); ctx.stroke(); } ctx.restore();
  ctx.restore();
  const B = tennisPose(0.3); const cx = X + s * (tp.pose[8] + 0), cyy = Y - 35 + s * tp.pose[9];
  const Cx = X + s * (B.pose[8] + B.dx * 128), Cy = Y - 35 + s * (B.pose[9] + B.dy * 128);
  const p = cl(u / IMP, 0, 1);
  if (u < IMP) ball(ctx, Cx - 30 * (1 - p), Cy - 300 * (1 - p * p), 24, u * 20);
  else { const dt = u - IMP, bx = Cx + dt * 7200, by = Cy + dt * 4600;
    streak(ctx, Cx, Cy, bx, by, 46, '#38D9F5', 0.95); streak(ctx, Cx, Cy + 8, bx - 50, by + 30, 22, '#fff', 0.9);
    ball(ctx, bx, by, 24, dt * 60); }
  IMPXY[2] = [Cx, Cy]; shock(ctx, Cx, Cy, u - IMP, '#ffffff', 300);
}
function fight(ctx, t, u, k1, k2, x1, x2, y) {
  const k = A.smooth(0.03, 0.2, u), hit = A.smooth(0.2, 0.26, u), recoil = E.out(inv(0.2, 0.3, u)) * 60;
  fig(ctx, x1 + 30 * E.out(inv(0, 0.2, u)), y, 1.25, lp(P.boxA, P.boxB, k), k1, { shout: 0.3 });
  fig(ctx, x2 + recoil, y, 1.25, lp(P.hurtA, P.hurtB, hit), k2, { flip: true, shout: hit });
  const hxw = x2 + recoil - 1.25 * (-35 * hit + 35 * (1 - hit)), hyw = y - 1.25 * 212;
  if (u > IMP) {
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.3, d = (u - IMP) * (900 + 500 * A.hash(i)), sx = hxw + Math.cos(a) * d, sy = hyw + Math.sin(a) * d - 100 * (u - IMP);
      ctx.fillStyle = '#9be7ff'; ctx.beginPath(); ctx.ellipse(sx, sy, 10, 16, a, 0, TAU); ctx.fill(); }
    const sc = E.outBack(inv(IMP, IMP + 0.06, u));
    ctx.save(); ctx.translate(hxw + 20, 250); ctx.rotate(-0.12); ctx.scale(sc, sc);
    A.text(ctx, 'POW!', 0, 0, { font: '130px Bangers', fill: '#FFD21F', stroke: OL, lw: 20 }); ctx.restore();
  }
  return [hxw, hyw];
}
function shotBox(ctx, t, u) {
  stadium(ctx, t, { hz: 700, c1: '#12082e', c2: '#3a1470', tint: '#FF4F9A', f1: '#28306e', f2: '#121540', cs: 500, seed: 11, lo: 30, pal: ['#FFC24A', '#FF4F9A', '#fff', '#ff6a3d'] });
  const cols = ['#E8322B', '#fff', '#3D7BFF'];
  for (let i = 0; i < 3; i++) { ctx.fillStyle = OL; ctx.fillRect(-150, 600 + i * 62 - 8, W + 300, 22); ctx.fillStyle = cols[i]; ctx.fillRect(-150, 600 + i * 62 - 3, W + 300, 12); }
  ctx.fillStyle = OL; ctx.fillRect(1650, 470, 50, 420); ctx.fillStyle = '#E8322B'; ctx.fillRect(1656, 470, 38, 420);
  speedLines(ctx, 1000, 462, t, 'rgba(255,255,255,.3)', 32, 300, 1300, 13);
  const [hx, hy] = fight(ctx, t, u, KIT.box1, KIT.box2, 700, 1080, 790);
  IMPXY[3] = [1000, 462]; shock(ctx, 1000, 462, u - IMP, '#FFD21F', 340);
}
const SHOTS = [shotFoot, shotBall, shotTennis, shotBox];
const FOCUS = [[985, 604], [855, 262], [700, 340], [1000, 462]];

function tiles(ctx, t, upto) {
  for (let i = 0; i <= upto; i++) {
    const age = t - (SH[i] + 0.04); if (age < 0) continue;
    const sc = E.outBack(inv(0, 0.16, age)), y = 78 + (i === upto ? 0 : 0);
    D.tile(ctx, 1153 + i * 208, y, 192, 84, TL[i][1], TL[i][2], TL[i][0], { r: 20, lw: 6, font: '800 38px Rubik', dir: 'rtl', scale: sc });
    ctx.save(); ctx.translate(1153 + i * 208 + 80 * sc, y - 30 * sc); ctx.fillStyle = `rgba(255,74,61,${0.6 + 0.4 * Math.sin(t * 20 + i)})`; ctx.beginPath(); ctx.arc(0, 0, 7 * sc, 0, TAU); ctx.fill(); ctx.restore();
  }
}
function montage(ctx, t) {
  const i = cl(Math.floor((t - 9.05 + 1e-6) / 0.3), 0, 3), u = t - SH[i], f = FOCUS[i];
  ctx.save();
  const post = u >= IMP ? Math.exp(-(u - IMP) * 30) : 0;
  cam(ctx, f[0], f[1], 1 + 0.14 * inv(0, 0.3, u) + 0.05 * post, [-0.016, 0.02, -0.014, 0.016][i] * (1 - inv(0, 0.3, u) * 0.6), post, t);
  SHOTS[i](ctx, t, u);
  ctx.restore();
  // vignette
  ctx.fillStyle = A.radial(ctx, 960, 540, 500, 1200, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(5,2,25,.55)']]); ctx.fillRect(0, 0, W, H);
  tiles(ctx, t, i);
  const tc = ['#FF4F9A', '#FFC24A', '#38D9F5', '#FF4A3D'][i];
  flash(ctx, tc, 0.85 * (1 - inv(0, 0.075, u)));
  if (u >= IMP && u < IMP + 0.066) impactFrame(ctx, IMPXY[i][0], IMPXY[i][1]);
}

// ------------------------------------------------------------ wipe (diagonal bands, moving left to right)
function wipe(ctx, t, tc, dur, cols) {
  const p = (t - (tc - dur / 2)) / dur; if (p <= 0 || p >= 1) return;
  const sh = 300, wd = [2900, 260, 100], ex = [0, 300, 620], e = E.inOut(p);
  for (let i = 0; i < 3; i++) {
    const lead = A.lerp(-100 + ex[i] * 0, W + wd[0] + 900, e) + (i ? 0 : 0) + ex[i] * (1 - Math.abs(e * 2 - 1));
    const lead2 = A.lerp(0, W + wd[0] + 300 + ex[2], e) + ex[i] - ex[i] * 0;
    const L = i === 0 ? lead2 - ex[2] : lead2, w = wd[i];
    ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(L, -10); ctx.lineTo(L - w, -10); ctx.lineTo(L - w - sh, H + 10); ctx.lineTo(L - sh, H + 10); ctx.closePath(); ctx.fill();
  }
}

// ------------------------------------------------------------ SPORT 5
function fitText(ctx, s, font0, maxW) { ctx.font = font0(100); const w = ctx.measureText(s).width; return Math.min(230, 100 * maxW / w); }
function logo5(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0);
  ctx.transform(1, 0, -0.14, 1, 0, 0);
  A.rrect(ctx, -446, -110, 920, 250, 36); ctx.fillStyle = '#1E6BFF'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = NAVY; ctx.stroke();
  A.rrect(ctx, -460, -125, 920, 250, 36); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#E8322B'; ctx.beginPath(); ctx.moveTo(-460, 80); ctx.quadraticCurveTo(0, 30, 460, 100); ctx.lineTo(460, 130); ctx.lineTo(-460, 130); ctx.fill();
  ctx.fillStyle = '#1E6BFF'; ctx.beginPath(); ctx.moveTo(-460, 105); ctx.quadraticCurveTo(0, 55, 460, 118); ctx.lineTo(460, 130); ctx.lineTo(-460, 130); ctx.fill();
  if (o.shine != null) { const sx = A.lerp(-700, 700, o.shine); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.moveTo(sx, -140); ctx.lineTo(sx + 90, -140); ctx.lineTo(sx - 40, 140); ctx.lineTo(sx - 130, 140); ctx.fill(); }
  ctx.restore();
  A.rrect(ctx, -460, -125, 920, 250, 36); ctx.lineWidth = 12; ctx.strokeStyle = NAVY; ctx.stroke();
  const fs = 190; ctx.font = `900 ${fs}px Rubik`;
  A.text(ctx, 'ספורט', 128, -22, { font: `900 ${fs}px Rubik`, fill: '#0B2A9A', dir: 'rtl' });
  ctx.beginPath(); ctx.arc(-326, 0, 132, 0, TAU); ctx.fillStyle = A.linear(ctx, 0, -130, 0, 130, [[0, '#ff5a4d'], [1, '#c2160f']]); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = NAVY; ctx.stroke();
  ctx.beginPath(); ctx.arc(-326, 0, 108, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
  A.text(ctx, '5', -326, 8, { font: '900 230px Rubik', fill: '#fff', stroke: NAVY, lw: 14 });
  ctx.restore();
}
function swoosh(ctx, col, y, th, ph, alpha = 1, xr = 2100) {
  ctx.save(); ctx.beginPath(); ctx.rect(-200, -200, xr + 200, H + 400); ctx.clip(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(-150, y + 280); ctx.quadraticCurveTo(900, y - 460 + ph, 2100, y - 200); ctx.quadraticCurveTo(900, y - 460 + ph + th, -150, y + 280);
  ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
function scoreboard(ctx, x, y, s, t, score, bump) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  A.rrect(ctx, -510, -52, 1020, 104, 30); ctx.fillStyle = 'rgba(6,18,74,.95)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
  D.LIVE(ctx, -420, 0, 0.85, t);
  ctx.beginPath(); ctx.arc(-320, 0, 20, 0, TAU); A.fillStroke(ctx, '#3D7BFF', 5);
  A.text(ctx, 'כחולים', -270, 2, { font: '800 40px Rubik', dir: 'rtl', align: 'left' });
  ctx.save(); ctx.scale(1 + bump * 0.3, 1 + bump * 0.3); A.rrect(ctx, -90, -36, 180, 72, 16); ctx.fillStyle = bump > 0.05 ? '#FFC24A' : '#111a55'; ctx.fill();
  A.text(ctx, score, 0, 3, { font: '900 58px Rubik', fill: bump > 0.05 ? '#0B1250' : '#FFC24A' }); ctx.restore();
  A.text(ctx, 'אדומים', 270, 2, { font: '800 40px Rubik', dir: 'rtl', align: 'right' });
  ctx.beginPath(); ctx.arc(320, 0, 20, 0, TAU); A.fillStroke(ctx, '#E8322B', 5);
  const sec = 78 * 60 + 41 + (t - 10.25); A.text(ctx, String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(Math.floor(sec % 60)).padStart(2, '0'), 425, 3, { font: '700 36px Rubik', fill: '#fff' });
  ctx.restore();
}
function sport5(ctx, t) {
  const u = t - 10.25;
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, H, [[0, '#0d38b8'], [1, '#050c4a']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) { const a = i * TAU / 18 + t * 0.2, w = 0.11; ctx.fillStyle = i % 2 ? 'rgba(90,150,255,.16)' : 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(960, 440); ctx.lineTo(960 + Math.cos(a - w) * 2200, 440 + Math.sin(a - w) * 2200); ctx.lineTo(960 + Math.cos(a + w) * 2200, 440 + Math.sin(a + w) * 2200); ctx.fill(); }
  ctx.restore();
  A.glow(ctx, 960, 440, 900, '#3D8BFF', 0.8);
  // ball position racing across
  const bx = A.key(u, [[0, -260], [0.2, 2250, 'lin']]), by = 470 + 22 * Math.sin(u * 30) - 40 * Math.sin(inv(0, 0.2, u) * Math.PI);
  const rev = u < 0.2 ? bx - 30 : 3000;
  const beat = t >= 11 ? Math.exp(-(t - 11) * 10) : 0, land = u > 0.18 ? Math.exp(-(u - 0.18) * 13) * Math.cos((u - 0.18) * 38) : 0;
  const bph = Math.sin(t * 2.2) * 26;
  swoosh(ctx, '#2f7bff', 760, 200, bph, 1);
  swoosh(ctx, '#ffffff', 800, 90, bph * 1.2, 0.95);
  swoosh(ctx, '#E8322B', 850, 60, bph * 1.4, 1);
  // sparkles
  for (let i = 0; i < 26; i++) { const x = A.hash(i * 3) * W, y = fmod(A.hash(i * 5) * H - t * (80 + 120 * A.hash(i * 7)), H), r = 3 + A.hash(i) * 6; ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * A.hash(i * 11 + Math.floor(t * 6))})`; ctx.fillRect(x - r, y - 1, r * 2, 2); ctx.fillRect(x - 1, y - r, 2, r * 2); }
  hlines(ctx, t, 'rgba(255,255,255,.18)', 14, 3, 0, 1080, 700, 3000);
  if (u < 0.24) {
    const R = 84; streak(ctx, bx, by, bx - 520, by + 10, R * 1.3, '#E8322B', 0.95); streak(ctx, bx, by - 30, bx - 640, by - 26, R * 0.8, '#ffffff', 0.95); streak(ctx, bx, by + 34, bx - 440, by + 46, R * 0.7, '#5aa0ff', 0.95);
  }
  // logo
  if (u > 0) {
    ctx.save();
    if (u < 0.2) { ctx.beginPath(); ctx.rect(0, 0, Math.max(0, rev), H); ctx.clip(); }
    const sc = 1 + 0.17 * land + beat * 0.05 + 0.008 * Math.sin(t * 6);
    const sk = (u > 0.4 && u < 0.62) ? inv(0.4, 0.62, u) : (t > 10.9 && t < 11.0 ? 0 : null);
    logo5(ctx, 960, 400 + Math.sin(t * 5) * 4, sc * 1.28, { rot: 0.012 * Math.sin(t * 3), shine: sk });
    ctx.restore();
  }
  if (u < 0.24) { ball(ctx, bx, by, 84, bx * 0.02); A.glow(ctx, bx, by, 300, '#fff', 0.6); }
  flash(ctx, '#ffffff', 0.7 * (1 - inv(0, 0.07, u - 0.18)) * (u > 0.18 ? 1 : 0));
}
function scoreOverlay(ctx, t) {
  if (t < 10.6 || t > 11.95) return;
  const k = E.outBack(inv(10.6, 10.8, t)), bump = t >= 11.5 ? Math.exp(-(t - 11.5) * 6) : 0;
  if (t >= 11) scoreboard(ctx, 1380, 84, 0.78, t, t >= 11.5 ? '2 : 1' : '1 : 1', bump); else scoreboard(ctx, 960, A.lerp(1000, 800, k), 0.95, t, t >= 11.5 ? '2 : 1' : '1 : 1', bump);
}
function stadiumGoal(ctx, t, h) { }
function goalNet(ctx, x0, y0, x1, y1, t, dt, hx, hy) {
  ctx.save(); ctx.fillStyle = 'rgba(10,20,60,.5)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3;
  const amp = dt > 0 ? 34 * Math.exp(-dt * 7) : 0;
  const dis = (x, y) => { const d = Math.hypot(x - hx, y - hy); return amp * Math.sin(d * 0.018 - dt * 32) * Math.exp(-d / 500); };
  for (let x = x0; x <= x1 + 1; x += 40) { ctx.beginPath(); for (let y = y0; y <= y1; y += 20) { const d = dis(x, y); ctx[y === y0 ? 'moveTo' : 'lineTo'](x + d, y + d * 0.6); } ctx.stroke(); }
  for (let y = y0; y <= y1 + 1; y += 40) { ctx.beginPath(); for (let x = x0; x <= x1; x += 20) { const d = dis(x, y); ctx[x === x0 ? 'moveTo' : 'lineTo'](x + d, y + d * 0.6); } ctx.stroke(); }
  ctx.restore();
}
function goalKick(ctx, t, g) { // 11.0-11.5
  const IMPT = 0.44, hit = g - IMPT;
  stadium(ctx, t, { hz: 600, c1: '#050c4a', c2: '#1b3fb0', tint: '#ffffff', f1: '#1fa456', f2: '#0b5a2e', cs: 1000, seed: 21, pal: ['#3D7BFF', '#E8322B', '#fff', '#FFD21F'] });
  speedLines(ctx, 1560, 420, t, 'rgba(255,255,255,.22)', 30, 350, 1300, 21);
  // goal
  goalNet(ctx, 1200, 330, 1740, 780, t, hit, 1560, 420);
  ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(1200, 790); ctx.lineTo(1200, 330); ctx.lineTo(1740, 330); ctx.lineTo(1740, 790); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 20; ctx.stroke();
  // goalkeeper dive (red)
  const dv = E.out(inv(0.2, 0.5, g));
  fig(ctx, A.lerp(1440, 1560, dv), A.lerp(660, 560, dv), 1.0, P.dive, KIT.red, { flip: true, rot: -0.9 * dv + 0.1, shout: 1 });
  // striker
  const run = E.out(inv(0, 0.25, g)), k = A.smooth(0.16, 0.26, g), sx = A.lerp(240, 520, run);
  fig(ctx, sx, 720, 1.25, lp(P.kickA, P.kickB, k), KIT.yb, { shout: 0.5 });
  const fx = sx + 1.25 * 165 + 20, fy = 720 - 1.25 * 25 - 10;
  if (g < 0.26) ball(ctx, sx + 1.25 * 165 + 40 - 20 * (1 - g / 0.26) + 90 * (1 - g / 0.26), 800 - 190 * Math.sin(g / 0.26 * 1.0) * 0 + 0 - (1 - g / 0.26) * 0 + (fy - 800) * E.in(g / 0.26), 30, g * 20);
  else { const q = inv(0.26, IMPT, g), bx = A.lerp(fx, 1560, q), by = A.lerp(fy, 420, q) - 110 * Math.sin(q * Math.PI), sz = 30 - 6 * q;
    streak(ctx, fx, fy, bx, by, 60, '#FFD21F', 0.95); streak(ctx, fx, fy + 6, bx - 70, by + 20, 34, '#3D7BFF', 0.95); streak(ctx, fx, fy - 6, bx - 30, by - 18, 18, '#fff', 0.95);
    if (g < IMPT + 0.02) ball(ctx, bx, by, sz, g * 50); }
  shock(ctx, fx, fy, g - 0.26, '#FFD21F', 260);
  if (hit > -0.05) A.glow(ctx, 1560, 420, 500 * Math.max(0, 1 - Math.abs(hit) * 6), '#fff', 0.8);
}
function confetti(ctx, t, t0) {
  const a = t - t0; if (a < 0) return;
  const cols = ['#FFD21F', '#3D7BFF', '#E8322B', '#fff', '#FF4F9A', '#38D9F5'];
  for (let i = 0; i < 90; i++) {
    const x = A.hash(i * 3.1) * W, v = 500 + A.hash(i * 5.7) * 700, y = -80 + a * v - A.hash(i) * 200 + (a < 0.12 ? 0 : 0), rot = a * (6 + A.hash(i * 2) * 10) + i;
    ctx.save(); ctx.translate(x + Math.sin(a * 8 + i) * 30, y); ctx.rotate(rot); ctx.fillStyle = cols[i % 6]; ctx.fillRect(-9, -5 * Math.abs(Math.cos(rot * 1.7)) - 1, 18, 10 * Math.abs(Math.cos(rot * 1.7)) + 2); ctx.restore();
  }
}
function celebrate(ctx, t, h) { // 11.5-11.95
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, H, [[0, '#2a1a8a'], [1, '#0b0f4a']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) { const a = i * TAU / 22 + t * 0.5; ctx.fillStyle = i % 2 ? 'rgba(255,210,60,.14)' : 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(960, 600); ctx.lineTo(960 + Math.cos(a - .08) * 2400, 600 + Math.sin(a - .08) * 2400); ctx.lineTo(960 + Math.cos(a + .08) * 2400, 600 + Math.sin(a + .08) * 2400); ctx.fill(); }
  ctx.restore();
  crowd(ctx, t, 420, 900, 1600, 31, ['#FFD21F', '#3D7BFF', '#E8322B', '#fff', '#FF4F9A'], 220);
  ctx.fillStyle = A.linear(ctx, 0, 820, 0, H, [[0, '#1fa456'], [1, '#0b5a2e']]); ctx.fillRect(-100, 800, W + 200, 400);
  for (let i = 0; i < 3; i++) fig(ctx, 420 + i * 520 + h * 180, 640, 0.6, lp(P.jump, P.jump, 0), i === 1 ? KIT.yb : KIT.yb, { alpha: 0.7, shout: 1 });
  A.glow(ctx, 960, 560, 900, '#FFC24A', 0.45);
  // GOAL text behind player
  const sc = 1 + 1.6 * Math.exp(-h * 22) + 0.03 * Math.sin(h * 30);
  ctx.save(); ctx.translate(960, 235); ctx.rotate(-0.06); ctx.scale(sc, sc);
  A.text(ctx, 'GOAL!', 14, 16, { font: '400 340px Bangers', fill: 'rgba(0,0,0,.4)', stroke: 'rgba(0,0,0,.4)', lw: 40 });
  A.text(ctx, 'GOAL!', 0, 0, { font: '400 340px Bangers', fill: '#FFD21F', stroke: OL, lw: 44 });
  A.text(ctx, 'GOAL!', 0, 0, { font: '400 340px Bangers', fill: A.linear(ctx, 0, -150, 0, 150, [[0, '#fff'], [0.5, '#FFE066'], [1, '#FFA51F']]), stroke: null });
  ctx.restore();
  const sl = E.out(inv(0, 0.4, h)), px = A.lerp(560, 1000, sl);
  for (let i = 0; i < 6; i++) { const q = inv(0, 0.4, h), dx = px - 130 - i * 60 * q, dy = 820 - 40 * Math.sin(i + h * 30) * q; ctx.fillStyle = `rgba(255,240,210,${0.5 * (1 - inv(0.1, 0.45, h))})`; ctx.beginPath(); ctx.arc(dx, dy, 50 + i * 12, 0, TAU); ctx.fill(); }
  fig(ctx, px, 700, 1.75, lp(P.slide, P.slide, 0), KIT.yb, { shout: 1, rot: -0.1 + 0.03 * Math.sin(h * 25) });
  confetti(ctx, t, 11.5);
}
function goalScene(ctx, t) {
  if (t < 11.5) {
    const g = t - 11;
    ctx.save(); cam(ctx, 1300, 500, 1 + 0.1 * inv(0, 0.5, g), 0.01, 0, t); goalKick(ctx, t, g); ctx.restore();
    if (g < 0.075) flash(ctx, '#ffffff', 1 - g / 0.075);
    if (g > 0.42 && g < 0.486) impactFrame(ctx, 1560, 420);
  } else {
    const h = t - 11.5;
    ctx.save(); cam(ctx, 960, 560, 1 + 0.08 * inv(0, 0.45, h), 0, Math.exp(-h * 15), t); celebrate(ctx, t, h); ctx.restore();
    flash(ctx, '#ffffff', 1 - h / 0.1);
  }
}

// ------------------------------------------------------------ CHARLTON
const OR = '#FF6A00', OR2 = '#FF9A2E';
function stripesBG(ctx, t, base, col, spd = 900, wd = 120, gap = 300) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = col;
  for (let i = -3; i < 12; i++) { const x = fmod(i * gap + t * spd, gap * 12) - gap * 3; ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x + wd, -20); ctx.lineTo(x + wd - 420, H + 20); ctx.lineTo(x - 420, H + 20); ctx.fill(); }
}
function stopwatch(ctx, x, y, r, ang, col, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  ctx.fillStyle = col; ctx.fillRect(-32, -r - 62, 64, 46); ctx.save(); ctx.rotate(0.75); ctx.fillRect(-20, -r - 52, 40, 40); ctx.restore();
  ctx.lineWidth = 36; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 8; for (let i = 0; i < 60; i++) { const a = i * TAU / 60, l = i % 5 ? 20 : 46; ctx.beginPath(); ctx.moveTo(Math.sin(a) * (r - 30), -Math.cos(a) * (r - 30)); ctx.lineTo(Math.sin(a) * (r - 30 - l), -Math.cos(a) * (r - 30 - l)); ctx.stroke(); }
  ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * 40, Math.cos(ang) * 40); ctx.lineTo(Math.sin(ang) * (r - 60), -Math.cos(ang) * (r - 60)); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); ctx.restore();
}
function charWord(ctx, cx, cy, sz, k, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.rotate(o.rot || 0); ctx.transform(1, 0, -0.2, 1, 0, 0);
  ctx.font = `900 ${sz}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round';
  ctx.letterSpacing = '4px'; const s = 'CHARLTON';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 34; ctx.strokeText(s, 22, 24);
  for (let i = 22; i >= 1; i--) { ctx.fillStyle = A.mixc('#B84000', OR, 1 - i / 22); ctx.strokeStyle = '#000'; ctx.lineWidth = 12; if (i % 3 === 0) ctx.strokeText(s, i, i * 1.05); ctx.fillText(s, i, i * 1.05); }
  ctx.lineWidth = 16; ctx.strokeStyle = '#000'; ctx.strokeText(s, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillText(s, 0, 0);
  ctx.save(); ctx.clip && 0; ctx.restore();
  ctx.restore();
}
function hebSlab(ctx, cx, cy, k, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.transform(1, 0, -0.2, 1, 0, 0);
  ctx.beginPath(); ctx.moveTo(-340, -84); ctx.lineTo(360, -84); ctx.lineTo(320, 84); ctx.lineTo(-380, 84); ctx.closePath();
  ctx.save(); ctx.translate(14, 14); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  ctx.fillStyle = A.linear(ctx, 0, -84, 0, 84, [[0, OR2], [1, OR]]); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.stroke();
  ctx.transform(1, 0, 0.2, 1, 0, 0);
  A.text(ctx, "צ'רלטון", 0, 6, { font: '900 132px Rubik', fill: '#0d0d0d', dir: 'rtl' });
  ctx.restore();
}
function charBug(ctx, t, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.transform(1, 0, -0.2, 1, 0, 0);
  ctx.beginPath(); ctx.moveTo(-250, -50); ctx.lineTo(250, -50); ctx.lineTo(230, 50); ctx.lineTo(-270, 50); ctx.closePath(); ctx.fillStyle = '#0d0d0d'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OR; ctx.stroke();
  A.text(ctx, 'CHARLTON', 0, 4, { font: '900 66px Rubik', fill: '#fff' }); ctx.restore();
}
function carShot(ctx, t, u) {
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, 700, [[0, '#0d0d0d'], [1, '#ff6a00']]); ctx.fillRect(-100, -100, W + 200, 800);
  A.glow(ctx, 1400, 560, 700, '#ffb347', 0.7);
  crowd(ctx, t, 430, 640, 3200, 41, ['#fff', '#FF9A2E', '#ffd21f', '#222'], 140);
  ctx.fillStyle = '#1b1b1f'; ctx.fillRect(-100, 640, W + 200, 300);
  for (let i = 0; i < 30; i++) { const x = fmod(i * 140 + t * 5200, W + 400) - 200; ctx.fillStyle = (i % 2) ? '#E8322B' : '#fff'; ctx.fillRect(1920 - x - 100, 640, 70, 26); }
  for (let i = 0; i < 9; i++) { const x = fmod(i * 300 + t * 4200, W + 600) - 300; ctx.fillStyle = '#ddd'; ctx.fillRect(1920 - x, 800, 170, 12); }
  hlines(ctx, t, 'rgba(255,255,255,.55)', 26, 5, 300, 900, 1000, 9000);
  const jy = 3 * Math.sin(t * 90), cx = 960 + 10 * Math.sin(u * 40), cy = 690 + jy;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1.25, 1.25); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0, 88, 330, 22, 0, 0, TAU); ctx.fill();
  const wheel = (wx, wr) => { ctx.beginPath(); ctx.arc(wx, 30, wr, 0, TAU); A.fillStroke(ctx, '#161616', 8); ctx.beginPath(); ctx.arc(wx, 30, wr * 0.55, 0, TAU); A.fillStroke(ctx, '#bbb', 5);
    ctx.save(); ctx.translate(wx, 30); ctx.rotate(t * 60); ctx.fillStyle = 'rgba(40,40,40,.7)'; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.fillRect(0, -6, wr * 0.55, 12); } ctx.restore(); };
  wheel(-175, 66); wheel(210, 58);
  ctx.beginPath(); [[-290, 25], [-285, -50], [-160, -66], [-95, -108], [-15, -108], [35, -62], [210, -44], [330, -12], [335, 24]].forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
  A.fillStroke(ctx, A.linear(ctx, 0, -110, 0, 30, [[0, '#ffa040'], [1, '#e85500']]), 9);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-100, -20); ctx.lineTo(120, -20); ctx.lineTo(100, -4); ctx.lineTo(-110, -4); ctx.fill();
  A.rrect(ctx, -320, -140, 120, 18, 4); A.fillStroke(ctx, '#111', 6); ctx.fillStyle = OL; ctx.fillRect(-260, -125, 12, 60);
  A.rrect(ctx, 270, 18, 100, 16, 4); A.fillStroke(ctx, '#111', 6);
  ctx.beginPath(); ctx.arc(-58, -110, 28, 0, TAU); A.fillStroke(ctx, '#FFD21F', 7);
  A.text(ctx, '7', -20, -38, { font: '900 40px Rubik', fill: '#111' });
  ctx.restore();
  for (let i = 0; i < 12; i++) { const a = A.hash(i + Math.floor(t * 30)); streak(ctx, cx - 400, cy + 80, cx - 400 - 300 - 300 * a, cy + 70 + 30 * (a - 0.5), 8, '#ffb347', 0.9); }
  // checkered flag top right
  ctx.save(); ctx.translate(1450, 130); for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { const w = 26 * Math.sin(t * 20 - c * 0.7) , px = c * 52 + 6 * c, py = r * 46 + w; ctx.fillStyle = (r + c) % 2 ? '#111' : '#fff'; ctx.fillRect(px, py, 52, 46); } ctx.restore();
}
function cageShot(ctx, t, u) {
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, H, [[0, '#0d0d0d'], [1, '#3a1a06']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  A.glow(ctx, 1000, 480, 900, '#ff7a1a', 0.6);
  ctx.strokeStyle = 'rgba(190,190,200,.55)'; ctx.lineWidth = 4;
  for (let i = -20; i < 40; i++) { ctx.beginPath(); ctx.moveTo(i * 90, 0); ctx.lineTo(i * 90 + 1100, H); ctx.moveTo(i * 90 + 1100, 0); ctx.lineTo(i * 90, H); ctx.stroke(); }
  ctx.fillStyle = A.linear(ctx, 0, 760, 0, H, [[0, '#26262c'], [1, '#0a0a0c']]); ctx.fillRect(-100, 790, W + 200, 400);
  speedLines(ctx, 1000, 462, t, 'rgba(255,170,60,.35)', 30, 300, 1300, 17);
  fight(ctx, t, u, KIT.mma1, KIT.mma2, 700, 1080, 790);
  shock(ctx, 1000, 462, u - IMP + 0.1, '#FF9A2E', 340);
}
function runShot(ctx, t, u) {
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, 640, [[0, '#0d0d0d'], [1, '#ff7a1a']]); ctx.fillRect(-100, -100, W + 200, 740);
  crowd(ctx, t, 400, 620, 2400, 51, ['#fff', '#FF9A2E', '#111'], 120);
  ctx.fillStyle = '#c4501a'; ctx.fillRect(-100, 640, W + 200, 600);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 7;
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 40, 640); ctx.lineTo(960 + i * 700, H + 50); ctx.stroke(); }
  hlines(ctx, t, 'rgba(255,255,255,.5)', 22, 9, 300, 900, 1000, 8000);
  const st = Math.floor(t * 13) % 2;
  fig(ctx, 960, 610 + 8 * Math.sin(t * 50), 1.35, st ? P.runA : P.runB, KIT.run, { shout: 0.8, rot: 0.1 });
  for (let i = 1; i < 4; i++) fig(ctx, 960 - i * 60, 610, 1.35, st ? P.runB : P.runA, KIT.run, { alpha: 0.12, rot: 0.1 });
  // timer
  const val = (12.7 - 12.70 + u) * 0; A.rrect(ctx, 130, 700, 380, 110, 20); ctx.fillStyle = '#0d0d0d'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OR; ctx.stroke();
  const cs = Math.floor(2500 + (t - 12.7) * 3000) % 10000; A.text(ctx, '9.' + String(cs % 100).padStart(2, '0'), 320, 758, { font: '900 84px Rubik', fill: OR2 });
}
function charlton(ctx, t) {
  const v = t - 12.05;
  const stripCol = v < 0.8 ? OR : '#FF7A10';
  stripesBG(ctx, t, '#0d0d0d', 'rgba(255,106,0,0.95)', 900, 130, 320);
  if (v < 0.35 || v >= 0.8) {
    // hero: stopwatch + wordmark
    const fin = v >= 0.8, w = fin ? v - 0.8 : v;
    A.glow(ctx, 960, 470, 900, '#ff8a2a', 0.5);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(W, 190); ctx.lineTo(W, 710); ctx.lineTo(0, 770); ctx.fill(); ctx.restore();
    stopwatch(ctx, 960, 480, 330, w * 22 + v * 3, '#FF6A00', 0.55);
    const k = fin ? 1 + 0.6 * Math.exp(-w * 26) : 1 + 0.55 * Math.exp(-w * 30);
    charWord(ctx, 960, 440, fin ? 292 : 280, k * (1 + 0.012 * Math.sin(t * 9)), { rot: -0.03 });
    const hk = E.outBack(inv(fin ? 0.02 : 0.08, fin ? 0.12 : 0.2, w));
    hebSlab(ctx, 980, 690, hk * (fin ? 1.05 : 1), {});
    speedLines(ctx, 960, 480, t, 'rgba(255,255,255,.28)', 26, 500, 1400, 61, 8);
  } else if (v < 0.5) { const u = v - 0.35; carShot(ctx, t, u); charBug(ctx, t, 330, 74, 0.55); }
  else if (v < 0.65) { const u = v - 0.5; cageShot(ctx, t, u); charBug(ctx, t, 330, 74, 0.55); }
  else { const u = v - 0.65; runShot(ctx, t, u); charBug(ctx, t, 330, 74, 0.55); }
  // per-cut flash
  [0, 0.35, 0.5, 0.65, 0.8].forEach((c, i) => flash(ctx, i === 4 ? '#ffffff' : '#FFB347', (i === 0 ? 0 : 0.8) * (1 - inv(0, 0.07, v - c)) * (v >= c ? 1 : 0)));
  if (v >= 0.58 && v < 0.646) impactFrame(ctx, 1000, 462, '#ff6a00');
}

// ------------------------------------------------------------ body + scene
function body(ctx, t) {
  if (t < 10.25) montage(ctx, t);
  else if (t < 12.05) { if (t < 11) sport5(ctx, t); else goalScene(ctx, t); if (t < 11) { } else { /* bug */ const k = E.outBack(inv(11, 11.15, t)); logo5(ctx, 250, 86, 0.26 * k); } scoreOverlay(ctx, t); if (t >= 12.05 - 0.0) { } }
  else charlton(ctx, t);
  wipe(ctx, t, 10.25, 0.2, ['#1E6BFF', '#ffffff', '#E8322B']);
  wipe(ctx, t, 12.05, 0.18, ['#0d0d0d', '#FF6A00', '#ffffff']);
}
A.scene({
  name: 's2b_sports', start: 9.05, end: 13.40,
  draw(ctx, s) {
    const t = s.t;
    let dx = 0, v = 0, edge = 0;
    if (t < 9.35) { const p = inv(9.05, 9.35, t); dx = W * (1 - E.out(p)); v = (1 - p) ; edge = 1; }
    else if (t > 13.10) { const p = inv(13.10, 13.40, t); dx = -W * E.in(p); v = p; edge = -1; }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.translate(dx, 0);
    body(ctx, t);
    if (edge) {
      const sp = Math.abs(edge > 0 ? (1 - E.out(inv(9.05, 9.35, t))) : 0) + v;
      ctx.save(); ctx.globalAlpha = 0.55 * Math.min(1, v * 1.5);
      for (let i = 0; i < 34; i++) { const y = A.hash(i * 3.7 + 1) * H, L = 500 + 1100 * A.hash(i * 5.1), x0 = edge > 0 ? -dx * 0 - L * 0.2 : 0; ctx.fillStyle = i % 3 ? '#fff' : '#FFC24A'; ctx.fillRect(edge > 0 ? 0 : W - L, y, L, 3 + 7 * A.hash(i * 9)); }
      ctx.restore();
      const ex = edge > 0 ? 0 : W - 80;
      ctx.fillStyle = A.linear(ctx, ex, 0, ex + 80, 0, edge > 0 ? [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']] : [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.95)']]);
      ctx.globalAlpha = Math.min(1, v * 2); ctx.fillRect(ex, 0, 80, H);
    }
    ctx.restore();
  },
});
})();
