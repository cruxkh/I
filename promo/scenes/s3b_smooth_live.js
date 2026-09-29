// S3b: live wall -> push-through -> silky fast & smooth hero -> dim to lone TV in the dark (global 20.64-23.90)
(() => {
const T0 = 20.64, TV = { x: 560, y: 250, w: 800, h: 450 };
const CW = 590, CH = 380;
const cellFinal = i => { const c = i % 3, r = (i / 3) | 0; return { x: 45 + c * 620, y: 90 + r * 410, w: CW, h: CH }; };
const cellTile = i => { const c = i % 3, r = (i / 3) | 0; return { x: c * 640, y: r * 540, w: 640, h: 540 }; };
const BADGE_T = [20.78, 21.22, 21.66, 21.0, 21.44, 21.88]; // pop time per cell, rhythmic sweep
const clampT = (a, b, x) => A.clamp((x - a) / (b - a));

// ---------- wall screens (drawn in local 590x380, origin top-left) ----------
const SCREENS = [
  // 0 news
  (c, w, h, t) => {
    c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, '#2f66e0'], [1, '#182468']]); c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; for (let k = 0; k < 4; k++) { A.ellipse(c, 150, 170, 60 + k * 30, 60 + k * 30); c.stroke(); }
    const bob = Math.sin(t * 3) * 3;
    A.ellipse(c, 300, 150 + bob, 110, 100); c.fillStyle = '#25203f'; c.fill();
    c.beginPath(); c.moveTo(150, 380); c.quadraticCurveTo(160, 250 + bob, 300, 240 + bob); c.quadraticCurveTo(440, 250 + bob, 450, 380); c.fillStyle = '#1b1740'; c.fill();
    A.ellipse(c, 300, 140 + bob, 50, 58); c.fillStyle = '#f2c39b'; c.fill(); A.ellipse(c, 300, 108 + bob, 54, 30); c.fillStyle = '#3a2418'; c.fill();
    c.beginPath(); c.moveTo(285, 245 + bob); c.lineTo(315, 245 + bob); c.lineTo(322, 320); c.lineTo(300, 340); c.lineTo(278, 320); c.closePath(); c.fillStyle = D.red; c.fill();
    c.fillStyle = D.red; c.fillRect(0, 300, w, 44); c.fillStyle = '#fff'; c.fillRect(0, 344, w, 36);
    A.text(c, 'חדשות', w - 26, 323, { font: '900 32px Rubik', fill: '#fff', align: 'right', dir: 'rtl' });
    c.fillStyle = '#c9ccd8'; for (let k = 0; k < 9; k++) { const x = ((k * 90 - t * 120) % 810 + 810) % 810 - 100; c.fillRect(x, 355, 60, 12); }
  },
  // 1 match
  (c, w, h, t) => {
    c.fillStyle = '#1f9b4a'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; c.fillRect(k * w / 8, 0, w / 8, h); }
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.strokeRect(24, 60, w - 48, h - 90); c.beginPath(); c.moveTo(w / 2, 60); c.lineTo(w / 2, h - 30); c.stroke(); A.ellipse(c, w / 2, 200, 60, 60); c.stroke();
    c.strokeRect(24, 130, 90, 140); c.strokeRect(w - 114, 130, 90, 140);
    for (let k = 0; k < 8; k++) { const px = 120 + k * 52 + Math.sin(t * 3 + k * 1.7) * 26 + (k % 2 ? 60 : 0), py = 110 + ((k * 37) % 190) + Math.cos(t * 2.4 + k) * 20; A.ellipse(c, px, py, 15, 20); c.fillStyle = k % 2 ? '#ff4f4f' : '#f4f6ff'; c.fill(); c.lineWidth = 3; c.strokeStyle = A.OUTLINE; c.stroke(); }
    const bx = w / 2 + Math.sin(t * 2.2) * 200, by = 210 - Math.abs(Math.sin(t * 5)) * 60; A.ellipse(c, bx, 236, 16, 5); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill(); A.ellipse(c, bx, by, 13, 13); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = A.OUTLINE; c.stroke();
    A.rrect(c, w / 2 - 80, 8, 160, 42, 10); c.fillStyle = '#12122b'; c.fill(); A.text(c, '2 : 1', w / 2, 30, { font: '800 30px Rubik', fill: D.gold });
  },
  // 2 concert
  (c, w, h, t) => {
    c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, '#2a0f52'], [1, '#100a2c']]); c.fillRect(0, 0, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) { const a = Math.sin(t * 1.6 + k * 1.3) * 0.55, x0 = 80 + k * 108; c.fillStyle = ['rgba(255,79,154,.28)', 'rgba(56,217,245,.26)', 'rgba(255,194,74,.28)'][k % 3]; c.beginPath(); c.moveTo(x0 - 8, 0); c.lineTo(x0 + 8, 0); c.lineTo(x0 + 8 + Math.sin(a) * 300 + 90, h); c.lineTo(x0 - 8 + Math.sin(a) * 300 - 90, h); c.fill(); }
    c.restore();
    c.fillStyle = '#1d1440'; c.fillRect(0, 280, w, 100);
    const sx = 295, jump = Math.abs(Math.sin(t * 5)) * 14;
    c.fillStyle = '#0c0820'; A.ellipse(c, sx, 150 - jump, 26, 30); c.fill(); c.beginPath(); c.moveTo(sx - 36, 290); c.quadraticCurveTo(sx - 30, 190 - jump, sx, 184 - jump); c.quadraticCurveTo(sx + 30, 190 - jump, sx + 36, 290); c.fill();
    c.strokeStyle = '#0c0820'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx + 26, 205 - jump); c.lineTo(sx + 52, 150 - jump - Math.sin(t * 6) * 10); c.stroke();
    for (let k = 0; k < 16; k++) { const x = k * 40 + 10, y = 340 + Math.sin(t * 5 + k) * 8; A.ellipse(c, x, y, 22, 26); c.fillStyle = '#0a061b'; c.fill(); }
    for (let k = 0; k < 14; k++) { const a = t * 2 + k * 2.4; A.glow(c, (k * 83 + 40) % w, 60 + (k * 47) % 200, 16 + 8 * Math.sin(a), 'rgba(255,240,180,.9)', 0.5 + 0.5 * Math.sin(a * 2)); }
  },
  // 3 weather
  (c, w, h, t) => {
    c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, '#56b8ff'], [1, '#c8eaff']]); c.fillRect(0, 0, w, h);
    c.save(); c.translate(150, 130); c.rotate(t * 0.5); for (let k = 0; k < 12; k++) { c.rotate(A.TAU / 12); c.fillStyle = 'rgba(255,214,90,.9)'; c.beginPath(); c.moveTo(70, -8); c.lineTo(112, 0); c.lineTo(70, 8); c.fill(); } c.restore();
    A.ellipse(c, 150, 130, 62, 62); c.fillStyle = '#ffd24a'; c.fill(); c.lineWidth = 5; c.strokeStyle = A.OUTLINE; c.stroke();
    const cloud = (x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.arc(0, 0, 40, 0, A.TAU); c.arc(46, -14, 50, 0, A.TAU); c.arc(96, 4, 38, 0, A.TAU); c.rect(0, 0, 96, 40); c.fillStyle = '#fff'; c.fill(); c.restore(); };
    cloud(((t * 40) % 800) - 160 + 180, 150, 1); cloud(((t * 26 + 300) % 800) - 160, 250, 0.8);
    c.fillStyle = 'rgba(30,60,140,.9)'; c.fillRect(0, 300, w, 80);
    A.text(c, '24°', w - 90, 110, { font: '900 88px Rubik', fill: '#fff', stroke: '#1a3a8f', lw: 10 });
    for (let k = 0; k < 5; k++) { A.text(c, ['☀', '⛅', '☀', '☁', '☀'][k], 70 + k * 112, 338, { font: '700 40px Rubik', fill: '#ffe08a' }); }
  },
  // 4 cooking
  (c, w, h, t) => {
    c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, '#ff9a4a'], [1, '#b8431f']]); c.fillRect(0, 0, w, h);
    c.fillStyle = '#7a2b14'; c.fillRect(0, 290, w, 90); c.fillStyle = '#5a1e0d'; c.fillRect(0, 290, w, 12);
    const ph = (t * 1.6) % 1, fy = 250 - Math.sin(ph * Math.PI) * 190, fr = ph * 6.28 * 2;
    // pan
    c.save(); c.translate(280, 268 + Math.sin(ph * Math.PI * 2) * -6); c.rotate(-0.06);
    A.rrect(c, 60, -8, 200, 16, 8); c.fillStyle = '#3a3346'; c.fill(); A.ellipse(c, 0, 0, 100, 22); c.fillStyle = '#4b4560'; c.fill(); c.lineWidth = 5; c.strokeStyle = A.OUTLINE; c.stroke(); c.restore();
    for (let k = 0; k < 3; k++) { const q = (ph + k * 0.12) % 1, yy = 250 - Math.sin(q * Math.PI) * (170 - k * 30); c.save(); c.translate(250 + k * 30, yy); c.rotate(fr + k); A.ellipse(c, 0, 0, 20, 14); c.fillStyle = ['#ffd24a', '#7ddc5b', '#ff5a4a'][k]; c.fill(); c.lineWidth = 4; c.strokeStyle = A.OUTLINE; c.stroke(); c.restore(); }
    for (let k = 0; k < 6; k++) { const a = (t * 2 + k * 0.17) % 1; A.glow(c, 210 + k * 22 + Math.sin(t * 9 + k) * 6, 300 - a * 40, 26, 'rgba(255,190,60,.8)', 1 - a); }
    // chef
    A.ellipse(c, 470, 150, 52, 56); c.fillStyle = '#f2c39b'; c.fill(); c.lineWidth = 5; c.strokeStyle = A.OUTLINE; c.stroke();
    c.beginPath(); c.arc(440, 96, 26, 0, A.TAU); c.arc(470, 80, 32, 0, A.TAU); c.arc(502, 96, 26, 0, A.TAU); c.rect(440, 96, 62, 30); c.fillStyle = '#fff'; c.fill();
    A.ellipse(c, 452, 150, 6, 7); c.fillStyle = A.OUTLINE; c.fill(); A.ellipse(c, 488, 150, 6, 7); c.fill(); c.beginPath(); c.arc(470, 172, 16, 0.1, Math.PI - 0.1); c.lineWidth = 4; c.strokeStyle = A.OUTLINE; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(425, 205, 90, 90);
  },
  // 5 game show wheel
  (c, w, h, t) => {
    c.fillStyle = A.linear(c, 0, 0, w, h, [[0, '#ff4f9a'], [1, '#6a2bd0']]); c.fillRect(0, 0, w, h);
    for (let k = 0; k < 14; k++) { const a = k * A.TAU / 14 + t * 0.4; c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(w / 2, 190); c.arc(w / 2, 190, 500, a, a + 0.2); c.fill(); }
    c.save(); c.translate(w / 2, 200); c.rotate(t * 2.4); const cols = [D.gold, D.cyan, D.red, '#fff', D.green, D.orange];
    for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 140, k * A.TAU / 6, (k + 1) * A.TAU / 6); c.closePath(); c.fillStyle = cols[k]; c.fill(); c.lineWidth = 5; c.strokeStyle = A.OUTLINE; c.stroke(); }
    A.ellipse(c, 0, 0, 24, 24); c.fillStyle = D.ink; c.fill(); c.restore();
    c.beginPath(); c.moveTo(w / 2 - 20, 30); c.lineTo(w / 2 + 20, 30); c.lineTo(w / 2, 78); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 5; c.strokeStyle = A.OUTLINE; c.stroke();
    for (let k = 0; k < 24; k++) { const x = (A.hash(k) * w + Math.sin(t * 2 + k) * 20), y = ((A.hash(k + 40) * 500 + t * 160) % 420) - 20; c.save(); c.translate(x, y); c.rotate(t * 3 + k); c.fillStyle = [D.gold, D.cyan, '#fff'][k % 3]; c.fillRect(-6, -3, 12, 6); c.restore(); }
  },
];

// ---------- wall ----------
function wall(ctx, t) {
  ctx.fillStyle = '#0a0824'; ctx.fillRect(0, 0, 1920, 1080);
  for (let k = 0; k < 30; k++) A.glow(ctx, A.hash(k) * 1920, A.hash(k + 9) * 1080, 160, k % 2 ? 'rgba(56,217,245,.12)' : 'rgba(255,79,154,.12)', 1);
  const ke = A.ease.out(clampT(T0, T0 + 0.3, t));
  for (let i = 0; i < 6; i++) {
    const a = cellTile(i), b = cellFinal(i);
    const r = { x: A.lerp(a.x, b.x, ke), y: A.lerp(a.y, b.y, ke), w: A.lerp(a.w, b.w, ke), h: A.lerp(a.h, b.h, ke) };
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, sc = Math.max(r.w / CW, r.h / CH);
    const rad = A.lerp(0, 30, ke);
    ctx.save();
    // shadow
    A.rrect(ctx, r.x + 8, r.y + 14, r.w, r.h, rad); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
    A.rrect(ctx, r.x, r.y, r.w, r.h, rad); ctx.clip();
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-CW / 2, -CH / 2);
    SCREENS[i](ctx, CW, CH, t + i * 0.37, i);
    // scanline sheen
    const sh = ((t * 0.5 + i * 0.17) % 1.6 - 0.3) * CW * 1.4; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(sh, 0); ctx.lineTo(sh + 90, 0); ctx.lineTo(sh - 40, CH); ctx.lineTo(sh - 130, CH); ctx.fill();
    const bt = t - BADGE_T[i];
    if (bt > 0 && bt < 0.18) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - bt / 0.18)})`; ctx.fillRect(0, 0, CW, CH); }
    ctx.restore();
    A.rrect(ctx, r.x, r.y, r.w, r.h, rad); ctx.lineWidth = 7; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
    if (bt > 0) { // pulsing red frame after pop
      const pu = 0.5 + 0.5 * Math.sin((t - BADGE_T[i]) * 4 * Math.PI);
      A.rrect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, rad + 3); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,74,61,${0.25 + 0.55 * pu * A.clamp(bt * 8)})`; ctx.stroke();
      const s = A.ease.outBack(A.clamp(bt / 0.28)) * (1 + 0.06 * Math.max(0, Math.sin(bt * 4 * Math.PI)) * A.clamp(bt * 4));
      const bx = r.x + 84, by = r.y + 44;
      A.glow(ctx, bx, by, 70 + 25 * pu, 'rgba(255,74,61,.75)', A.clamp(bt * 6) * (0.6 + 0.4 * pu));
      if (bt < 0.35) { ctx.beginPath(); ctx.arc(bx, by, 30 + bt * 300, 0, A.TAU); ctx.lineWidth = 6 * (1 - bt / 0.35); ctx.strokeStyle = `rgba(255,255,255,${1 - bt / 0.35})`; ctx.stroke(); }
      D.LIVE(ctx, bx, by, 1.05 * s, t);
    }
  }
}

// ---------- hero pieces ----------
function ribbons(ctx, t, amp, alpha) {
  const N = 7;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const base = 210 + i * 52 + (475 - (210 + i * 52)) * (1 - amp) , f = 0.0032 + i * 0.0004, sp = 5.5 + i * 0.9, ph = i * 1.7;
    const top = [], bot = [];
    for (let x = -40; x <= 1960; x += 32) {
      const th = (16 + 15 * (0.5 + 0.5 * Math.sin(x * 0.004 - t * 3 + i))) * amp + 2;
      const y = base + amp * (60 * Math.sin(x * f - t * sp + ph) + 26 * Math.sin(x * f * 2.3 - t * sp * 1.4 + ph * 2));
      top.push([x, y - th]); bot.push([x, y + th]);
    }
    ctx.beginPath(); top.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let k = bot.length - 1; k >= 0; k--) ctx.lineTo(bot[k][0], bot[k][1]); ctx.closePath();
    const off = (t * 700 * (0.8 + i * 0.1)) % 1920;
    const g = ctx.createLinearGradient(-off, 0, 1920 - off, 0);
    for (let k = 0; k <= 4; k++) g.addColorStop(k / 4, k % 2 ? 'rgba(56,217,245,.9)' : 'rgba(255,194,74,.9)');
    ctx.fillStyle = g; ctx.globalAlpha = 0.34 * alpha; ctx.fill();
    ctx.beginPath(); top.forEach((p, k) => { const y = (p[1] + bot[k][1]) / 2; k ? ctx.lineTo(p[0], y) : ctx.moveTo(p[0], y); });
    ctx.strokeStyle = i % 2 ? 'rgba(200,250,255,1)' : 'rgba(255,240,190,1)'; ctx.lineWidth = 3; ctx.globalAlpha = 0.85 * alpha; ctx.stroke();
  }
  ctx.restore();
}
function speedLines(ctx, t, alpha) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 34; k++) {
    const y = 60 + A.hash(k) * 800, len = 260 + A.hash(k + 3) * 620, sp = 1500 + A.hash(k + 7) * 2200, x = ((A.hash(k + 11) * 3400 + t * sp) % 3400) - 700;
    const g = ctx.createLinearGradient(x - len, 0, x, 0); const col = k % 3 === 0 ? '255,194,74' : k % 3 === 1 ? '56,217,245' : '255,255,255';
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${0.55 * alpha})`);
    ctx.fillStyle = g; ctx.fillRect(x - len, y, len, 2 + A.hash(k + 5) * 3);
  }
  ctx.restore();
}
function train(ctx, x, y, t) {
  // trail
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const tg = ctx.createLinearGradient(x - 1500, 0, x - 200, 0); tg.addColorStop(0, 'rgba(56,217,245,0)'); tg.addColorStop(1, 'rgba(56,217,245,.55)');
  ctx.fillStyle = tg; ctx.fillRect(x - 1500, y - 34, 1300, 68);
  const tg2 = ctx.createLinearGradient(x - 1000, 0, x - 200, 0); tg2.addColorStop(0, 'rgba(255,194,74,0)'); tg2.addColorStop(1, 'rgba(255,194,74,.7)');
  ctx.fillStyle = tg2; ctx.fillRect(x - 1000, y - 12, 800, 24); ctx.restore();
  // cars (nose at x)
  const cars = [[x - 380, 380, true], [x - 700, 310, false], [x - 1030, 310, false]];
  cars.forEach(([cx, cl, nose], i) => {
    ctx.beginPath();
    if (nose) { ctx.moveTo(cx, y - 48); ctx.lineTo(cx + cl - 150, y - 48); ctx.bezierCurveTo(cx + cl - 40, y - 46, cx + cl, y - 10, cx + cl, y + 22); ctx.lineTo(cx + cl - 10, y + 44); ctx.lineTo(cx, y + 44); }
    else { ctx.roundRect(cx, y - 48, cl, 92, 22); }
    ctx.closePath(); ctx.fillStyle = A.linear(ctx, 0, y - 48, 0, y + 44, [[0, '#fffaf0'], [0.55, '#ffe08a'], [1, '#ffb52e']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.OUTLINE; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = A.linear(ctx, cx, 0, cx + cl, 0, [[0, '#1a5fbf'], [1, '#38D9F5']]); ctx.fillRect(cx, y - 24, cl, 26);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 6; k++) ctx.fillRect(cx + 20 + k * (cl / 6.4), y - 20, cl / 6.4 - 30, 5);
    ctx.fillStyle = D.magenta; ctx.fillRect(cx, y + 14, cl, 9);
    ctx.restore();
  });
  // connectors
  ctx.fillStyle = A.OUTLINE; ctx.fillRect(x - 390, y + 8, 12, 14); ctx.fillRect(x - 720, y + 8, 22, 14);
  A.glow(ctx, x + 6, y + 6, 90, 'rgba(255,255,220,.9)', 0.8);
}
function ball(ctx, x, y, r, rot, sx, gray) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1 / Math.sqrt(sx));
  ctx.beginPath(); ctx.arc(0, 0, r, 0, A.TAU); ctx.fillStyle = gray ? '#b8b4cc' : A.radial(ctx, -r * 0.3, -r * 0.35, 4, r * 1.1, [[0, '#fff3c0'], [0.6, '#ffc24a'], [1, '#e08a10']]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.rotate(rot);
  for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.fillStyle = gray ? 'rgba(90,86,110,.6)' : (k === 1 ? D.cyan : D.magenta); ctx.fillRect(-r * 1.2, -r * 0.16, r * 2.4, r * 0.32); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, A.TAU); ctx.lineWidth = 6; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
  if (!gray) { ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.4, r * 0.18, 0, A.TAU); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill(); }
  ctx.restore();
}
function tvBody(ctx, bright, t, scale = 1, gl = 1) {
  const { x, y, w, h } = TV, cx = x + w / 2, cy = y + h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  if (bright > 0.02) A.glow(ctx, cx, cy, 700 * bright + 200, 'rgba(56,217,245,.5)', bright * gl);
  // stand
  ctx.fillStyle = '#211a52'; ctx.beginPath(); ctx.moveTo(cx - 50, y + h - 4); ctx.lineTo(cx + 50, y + h - 4); ctx.lineTo(cx + 74, y + h + 64); ctx.lineTo(cx - 74, y + h + 64); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
  A.rrect(ctx, cx - 190, y + h + 52, 380, 26, 13); ctx.fillStyle = '#2b2266'; ctx.fill(); ctx.stroke();
  A.rrect(ctx, x, y, w, h, 34); ctx.fillStyle = A.linear(ctx, 0, y, 0, y + h, [[0, '#3b3190'], [1, '#1b1550']]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
  const sx = x + 26, sy = y + 24, sw = w - 52, sh = h - 60;
  A.rrect(ctx, sx, sy, sw, sh, 18); ctx.fillStyle = '#05040f'; ctx.fill();
  if (bright > 0.01) {
    ctx.save(); A.rrect(ctx, sx, sy, sw, sh, 18); ctx.clip(); ctx.globalAlpha = bright;
    ctx.fillStyle = A.linear(ctx, sx, sy, sx + sw, sy + sh, [[0, '#123d7a'], [0.5, '#1d2a8f'], [1, '#4b1a80']]); ctx.fillRect(sx, sy, sw, sh);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let px = 0; px <= sw; px += 20) { const yy = sy + sh * (0.3 + k * 0.14) + Math.sin(px * 0.012 - t * 6 + k * 1.4) * 30; px ? ctx.lineTo(sx + px, yy) : ctx.moveTo(sx, yy); } ctx.lineWidth = 16; ctx.strokeStyle = k % 2 ? 'rgba(56,217,245,.8)' : 'rgba(255,194,74,.85)'; ctx.stroke(); }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(sx + 40, sy); ctx.lineTo(sx + 300, sy); ctx.lineTo(sx + 120, sy + sh); ctx.lineTo(sx, sy + sh); ctx.save(); A.rrect(ctx, sx, sy, sw, sh, 18); ctx.restore(); ctx.fill();
  ctx.restore();
}
function popText(ctx, txt, t, t0, x, y, size, fill, out) {
  const bt = t - t0; if (bt < 0) return;
  const s = A.ease.outBack(A.clamp(bt / 0.22)), ex = out ? A.ease.in(clampT(out, out + 0.2, t)) : 0;
  ctx.save(); ctx.translate(x, y - ex * 90); ctx.scale(s * (1 - ex * 0.3), s * (1 - ex * 0.3)); ctx.globalAlpha = 1 - ex;
  A.text(ctx, txt, 0, 0, { font: `900 ${size}px Rubik`, fill, stroke: A.OUTLINE, lw: size * 0.16, dir: 'rtl' }); ctx.restore();
}

// ---------- hero ----------
function hero(ctx, t) {
  const dim = A.smooth(23.5, 23.88, t), conv = A.smooth(23.2, 23.55, t);
  ctx.fillStyle = A.mixc('#1a1058', '#04030c', dim); ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = A.linear(ctx, 0, 0, 0, 1080, [[0, `rgba(43,27,107,${0.9 * (1 - dim)})`], [1, `rgba(14,11,46,${1 - dim})`]]); ctx.fillRect(0, 0, 1920, 1080);
  const live = 1 - dim;
  A.glow(ctx, 960, 480, 1100, 'rgba(56,217,245,.22)', live * (1 - conv * 0.5));
  speedLines(ctx, t, (1 - conv) * 1);
  // floor
  const fl = 1 - conv;
  ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = A.linear(ctx, 0, 795, 0, 1000, [[0, 'rgba(120,90,255,.45)'], [1, 'rgba(14,11,46,0)']]); ctx.fillRect(0, 795, 1920, 220);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 793, 1920, 3);
  // rail
  ctx.fillStyle = 'rgba(56,217,245,.9)'; ctx.fillRect(0, 468, 1920, 6); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(0, 464, 1920, 3);
  for (let k = 0; k < 40; k++) { const x = ((k * 70 + t * 2600) % 2800) - 300; ctx.fillStyle = 'rgba(56,217,245,.25)'; ctx.fillRect(x, 474, 30, 10); }
  ctx.restore();
  ribbons(ctx, t, 1 - conv * 0.85, live * (1 - conv * 0.4));
  // train
  if (t > 22.25 && t < 23.35) { const x = A.key(t, [[22.3, -60], [23.3, 3100]], 'lin'); train(ctx, x, 412, t); }
  // ball gag
  const gy = 738, r = 56;
  if (t > 22.28 && t < 23.3) {
    const q = Math.floor(t * 6) / 6, gx = 260 + 380 * clampT(22.3, 22.95, q), tw = 22.68;
    const hx = A.key(t, [[22.34, -140], [23.12, 2100]], 'inOut');
    // floor shadow
    if (t < tw + 0.02) {
      const fr = Math.floor(t * 15), fa = 0.55 + 0.35 * A.hash(fr * 3.1), jit = (A.hash(fr) - 0.5) * 14;
      ctx.save(); ctx.globalAlpha = fa * A.smooth(22.28, 22.4, t);
      ball(ctx, gx + 46 + jit, gy - 4, r, 0.5, 1, true); ctx.globalAlpha *= 0.6; ball(ctx, gx - 30 - jit, gy + 3, r, 0.2, 1, true); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.8 * (A.hash(fr + 7) > 0.35 ? 1 : 0.3);
      A.rrect(ctx, gx - 44, gy - 140, 88, 40, 10); ctx.fillStyle = '#4a4668'; ctx.fill(); A.text(ctx, 'LAG', gx, gy - 119, { font: '800 26px Rubik', fill: '#e0dcf4' }); ctx.restore();
    } else if (t < tw + 0.4) { // wiped: glitch squares blown away
      const u = (t - tw) / 0.4;
      for (let k = 0; k < 26; k++) { const a = A.hash(k) * A.TAU, d = u * (80 + A.hash(k + 3) * 300); ctx.fillStyle = `rgba(184,180,204,${1 - u})`; const sz = 14 * (1 - u * 0.6); ctx.fillRect(gx + 40 + Math.cos(a) * d + 300 * u * u - sz / 2 + 0, gy + Math.sin(a) * d * 0.7 - sz / 2, sz, sz); }
    }
    // wipe flash at overtake
    if (t >= tw - 0.03 && t < tw + 0.25) { const u = (t - tw + 0.03) / 0.28; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(hx - 500 * (u + 0.3), 0, hx, 0); g.addColorStop(0, 'rgba(56,217,245,0)'); g.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - u)})`); ctx.fillStyle = g; const L = 500 * (u + 0.3); ctx.beginPath(); ctx.moveTo(hx - L, gy); ctx.lineTo(hx, gy - 80); ctx.lineTo(hx, gy + 80); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (t > 22.34) {
      const v = (A.key(t + 0.01, [[22.34, -140], [23.12, 2100]], 'inOut') - hx) / 0.01 / 1000; // ~ px/ms proxy
      const speed = Math.abs(v) * 1000;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const len = Math.min(900, speed * 0.16); const tg = ctx.createLinearGradient(hx - len, 0, hx, 0); tg.addColorStop(0, 'rgba(255,194,74,0)'); tg.addColorStop(0.7, 'rgba(255,194,74,.5)'); tg.addColorStop(1, 'rgba(255,255,255,.75)');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(hx - len, gy); ctx.lineTo(hx, gy - r * 0.9); ctx.lineTo(hx, gy + r * 0.9); ctx.closePath(); ctx.fill();
      const tg2 = ctx.createLinearGradient(hx - len * 1.3, 0, hx, 0); tg2.addColorStop(0, 'rgba(56,217,245,0)'); tg2.addColorStop(1, 'rgba(56,217,245,.55)'); ctx.fillStyle = tg2; ctx.beginPath(); ctx.moveTo(hx - len * 1.3, gy); ctx.lineTo(hx - r * 0.3, gy - 16); ctx.lineTo(hx - r * 0.3, gy + 16); ctx.closePath(); ctx.fill(); ctx.restore();
      for (let k = 4; k >= 1; k--) { ctx.save(); ctx.globalAlpha = 0.16 * (5 - k) / 4; ball(ctx, hx - k * Math.min(70, speed * 0.02), gy, r, (hx - k * 30) / r, 1, false); ctx.restore(); }
      A.ellipse(ctx, hx, 800, r * 1.2, 10); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      ball(ctx, hx, gy, r, hx / r, 1 + Math.min(0.14, speed / 16000), false);
    }
  }
  // words
  popText(ctx, 'חוויית צפייה', t, 22.4, 960, 128, 92, D.goldHi, 23.15);
  popText(ctx, 'מהירה', t, 23.3, 1150, 130, 96, D.cyan, 23.62);
  popText(ctx, 'וחלקה', t, 23.42, 800, 130, 96, D.goldHi, 23.62);
  // TV arrival + dim
  if (t > 23.22) {
    const sc = A.ease.outBack(A.clamp((t - 23.22) / 0.3)) ;
    const bright = 1 - A.smooth(23.52, 23.88, t);
    tvBody(ctx, bright, t, Math.max(0.01, sc), 1);
  }
  // spotlight
  const sp = A.smooth(23.5, 23.88, t);
  if (sp > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, -20, 0, 830); g.addColorStop(0, `rgba(255,244,214,${0.5 * sp})`); g.addColorStop(1, `rgba(255,244,214,${0.08 * sp})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(870, -20); ctx.lineTo(1050, -20); ctx.lineTo(1330, 830); ctx.lineTo(590, 830); ctx.closePath(); ctx.fill();
    A.glow(ctx, 960, 830, 420, 'rgba(255,230,170,.35)', sp); ctx.restore();
    ctx.fillStyle = `rgba(4,3,12,${0.35 * sp})`; ctx.fillRect(0, 0, 1920, 1080);
  }
  // vignette
  ctx.fillStyle = A.radial(ctx, 960, 540, 500, 1200, [[0, 'rgba(0,0,0,0)'], [1, `rgba(4,2,20,${0.35 + 0.5 * dim})`]]); ctx.fillRect(0, 0, 1920, 1080);
}

A.scene({
  name: 's3b_smooth_live', start: 20.64, end: 23.9,
  draw(ctx, s) {
    const t = s.t;
    const pushT = 21.9, irisT = 22.12;
    if (t < irisT + 0.4 || t > 100) {
      const z = t < pushT ? 1 + 0.06 * clampT(T0, pushT, t) : 1.06 + 5.4 * A.ease.in(clampT(pushT, 22.35, t));
      ctx.save(); ctx.translate(960, 485); ctx.rotate(Math.sin(t * 1.3) * 0.006 + (t > pushT ? 0.05 * A.ease.in(clampT(pushT, 22.35, t)) : 0)); ctx.scale(z, z); ctx.translate(-960, -485);
      wall(ctx, t); ctx.restore();
      if (t > 21.95) { // radial rush lines
        const a = A.smooth(21.95, 22.15, t) * (1 - A.smooth(22.25, 22.4, t)); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 44; k++) { const ang = A.hash(k) * A.TAU, r0 = 200 + A.hash(k + 5) * 500 + (t - 21.95) * 900, r1 = r0 + 260 + A.hash(k + 9) * 400; ctx.strokeStyle = k % 2 ? `rgba(56,217,245,${0.7 * a})` : `rgba(255,224,138,${0.7 * a})`; ctx.lineWidth = 3 + A.hash(k + 2) * 4; ctx.beginPath(); ctx.moveTo(960 + Math.cos(ang) * r0, 485 + Math.sin(ang) * r0); ctx.lineTo(960 + Math.cos(ang) * r1, 485 + Math.sin(ang) * r1); ctx.stroke(); }
        ctx.restore();
      }
    }
    if (t >= irisT) {
      const u = clampT(irisT, 22.42, t), rad = 60 + 1500 * A.ease.in(u) * 0.55 + 1500 * u * u * 0.45;
      ctx.save();
      if (u < 1) { ctx.beginPath(); ctx.arc(960, 485, rad, 0, A.TAU); ctx.clip(); }
      hero(ctx, t);
      ctx.restore();
      if (u < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(960, 485, rad, 0, A.TAU); ctx.lineWidth = 26 * (1 - u); ctx.strokeStyle = 'rgba(255,240,190,.9)'; ctx.stroke(); ctx.restore(); }
    }
  }
});
})();
