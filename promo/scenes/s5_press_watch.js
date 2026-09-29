// S5 finale: "פשוט לוחצים, וצופים" (global 30.12-36.88). Remote close-up -> cosy room -> content ring -> LIVE screens -> push-in -> end line.
(() => {
  const T0 = 30.12, T_END = 36.88;
  const SKIN = '#F0B48A', SKIN_D = '#D48F66';
  const OL = () => A.OUTLINE;
  const clamp = A.clamp, inv = A.inv, ease = A.ease;
  const TVC = { x: 960, y: 335 }, TVW = 720, TVH = 400;   // TV screen centre + size (world)
  const RING = { x: 960, y: 690, rx: 830, ry: 150 };

  // ---------- small helpers ----------
  function sparkle(ctx, x, y, r, rot, fill, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }
  function ring(ctx, x, y, r, lw, col, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); ctx.restore(); }
  function flash(ctx, a, col = '255,255,255') { if (a > 0.003) { ctx.fillStyle = `rgba(${col},${clamp(a)})`; ctx.fillRect(0, 0, 1920, 1080); } }

  // ============================================================
  // 1. REMOTE CLOSE-UP  (screen space)
  // ============================================================
  const OKX = 930, OKY = 555;
  function bokehBg(ctx, t) {
    ctx.fillStyle = A.linear(ctx, 0, 0, 0, 1080, [[0, '#2a1140'], [0.6, '#5a2648'], [1, '#3a1a3a']]); ctx.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 16; i++) {
      const h = A.hash(i + 40), h2 = A.hash(i + 90), r = 70 + h * 130;
      const x = ((h2 * 2200 + t * (12 + h * 20) * (i % 2 ? 1 : -1)) % 2200 + 2200) % 2200 - 140, y = 80 + A.hash(i + 7) * 900 + Math.sin(t * 0.6 + i) * 18;
      const col = i % 3 === 0 ? '#FFC24A' : i % 3 === 1 ? '#FF8A3D' : '#FF4F9A';
      A.glow(ctx, x, y, r, col, 0.22 + 0.12 * A.hash(i + 3));
    }
    // warm lamp glow top-left
    A.glow(ctx, 260, 160, 700, '#FF9A4A', 0.35);
    // blurred sofa shape silhouette bottom
    ctx.fillStyle = 'rgba(30,12,40,0.55)'; A.rrect(ctx, -100, 830, 2200, 400, 120); ctx.fill();
  }
  function remote(ctx, t, press, glowK) {
    // local frame: origin = OK button centre, rotated
    ctx.save(); ctx.translate(OKX, OKY); ctx.rotate(-0.2);
    // shadow
    ctx.save(); ctx.translate(26, 34); A.rrect(ctx, -320, -540, 640, 1900, 130); ctx.fillStyle = 'rgba(10,4,20,0.5)'; ctx.fill(); ctx.restore();
    // body
    A.rrect(ctx, -320, -540, 640, 1900, 130);
    ctx.fillStyle = A.linear(ctx, -320, 0, 320, 0, [[0, '#3a2c66'], [0.5, '#2a1f4e'], [1, '#1a1338']]); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = OL(); ctx.stroke();
    // rim highlight
    ctx.save(); A.rrect(ctx, -304, -524, 608, 1868, 118); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(190,170,255,0.35)'; ctx.stroke(); ctx.restore();
    // power + top buttons
    const btn = (x, y, r, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); A.fillStroke(ctx, c, 6); ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.55, Math.PI, Math.PI * 1.8); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke(); };
    btn(-200, -440, 48, '#FF4A5D'); btn(-70, -440, 40, '#4a3a86'); btn(60, -440, 40, '#4a3a86'); btn(190, -440, 40, '#4a3a86');
    // D-pad ring
    ctx.beginPath(); ctx.arc(0, 0, 285, 0, A.TAU); A.fillStroke(ctx, A.radial(ctx, -60, -60, 30, 300, [[0, '#4f3f92'], [1, '#2b2058']]), 7);
    ctx.beginPath(); ctx.arc(0, 0, 200, 0, A.TAU); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,50,0.6)'; ctx.stroke();
    // arrows
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(k * Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -232); ctx.lineTo(-30, -204); ctx.lineTo(30, -204); ctx.closePath(); ctx.fillStyle = '#a89bf0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OL(); ctx.stroke(); ctx.restore();
    }
    // lower rows
    btn(-190, 400, 44, '#4a3a86'); btn(0, 400, 44, '#4a3a86'); btn(190, 400, 44, '#4a3a86');
    for (const sx of [-1, 1]) { A.rrect(ctx, sx * 150 - 55, 520, 110, 250, 50); A.fillStroke(ctx, '#3b2e73', 6); ctx.beginPath(); ctx.moveTo(sx * 150 - 30, 645); ctx.lineTo(sx * 150 + 30, 645); ctx.lineWidth = 5; ctx.strokeStyle = OL(); ctx.stroke(); }
    btn(0, 600, 50, '#FFC24A'); btn(0, 740, 42, '#38D9F5');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) btn(-170 + c * 170, 900 + r * 120, 34, '#4a3a86');
    // OK button
    const ps = 1 - 0.09 * press;
    ctx.save(); ctx.scale(ps, ps);
    ctx.beginPath(); ctx.arc(0, 0, 135, 0, A.TAU);
    ctx.fillStyle = A.radial(ctx, -30, -40, 10, 150, [[0, A.mixc('#FFE9A8', '#FFFFFF', glowK)], [0.6, A.mixc('#FFC24A', '#FFE9A8', glowK)], [1, A.mixc('#E8892A', '#FFC24A', glowK)]]); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = OL(); ctx.stroke();
    A.text(ctx, 'OK', 0, 6, { font: '900 96px Rubik', fill: '#3a1d08' });
    ctx.restore();
    ctx.restore();
  }
  function thumb(ctx, u, press) {
    // thumb tip lands on OK; arrives from bottom right. u = approach (0 far .. 1 hover) ; press 0..1
    const ang = 0.95;  // direction from tip toward base (radians, 0=+x, positive = down)
    const far = (1 - u) * 1500, hover = 1 - press;
    const lift = (1 - press) * 55;                 // pulled up (larger visually) when hovering
    ctx.save();
    ctx.translate(OKX - 8 + Math.cos(ang) * far, OKY + 10 + Math.sin(ang) * far);
    // soft shadow onto remote
    ctx.save(); ctx.translate(-30 - lift * 0.8, 30 + lift * 0.9); ctx.rotate(ang);
    A.rrect(ctx, 0, -110, 1500, 220, [110, 30, 30, 110]); ctx.fillStyle = `rgba(10,4,20,${0.25 + 0.15 * press})`; ctx.fill(); ctx.restore();
    ctx.rotate(ang); const sc = 1 + lift / 500; ctx.scale(sc, sc);
    // thumb body
    ctx.beginPath(); ctx.moveTo(60, -104);
    ctx.bezierCurveTo(-60, -104, -110, -60, -105, 10);
    ctx.bezierCurveTo(-100, 90, -30, 118, 60, 118);
    ctx.lineTo(1500, 145); ctx.lineTo(1500, -130); ctx.closePath();
    ctx.fillStyle = A.linear(ctx, 0, -110, 0, 120, [[0, '#F8C3A0'], [0.55, SKIN], [1, SKIN_D]]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OL(); ctx.lineJoin = 'round'; ctx.stroke();
    // nail
    ctx.beginPath(); ctx.moveTo(-30, -62); ctx.bezierCurveTo(-90, -60, -92, 50, -30, 64); ctx.lineTo(150, 58); ctx.bezierCurveTo(190, 20, 190, -25, 150, -66); ctx.closePath();
    ctx.fillStyle = A.linear(ctx, -50, -60, 150, 60, [[0, '#FFE1D2'], [1, '#F6B9A4']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(26,19,48,0.7)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, -40); ctx.quadraticCurveTo(60, -30, 90, -38); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.stroke();
    // knuckle creases
    for (const x of [420, 470]) { ctx.beginPath(); ctx.moveTo(x, -85 + (x - 420) * 0.1); ctx.quadraticCurveTo(x + 20, 0, x, 90); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(120,60,40,0.5)'; ctx.stroke(); }
    ctx.restore();
  }
  function remoteScene(ctx, t) {
    const lt = t - T0;
    const tPress = 30.72, tRel = 30.90;
    const pr = ease.out(inv(tPress - 0.05, tPress + 0.03, t)) * (1 - ease.out(inv(tRel, tRel + 0.12, t)));
    const glowK = clamp(inv(tPress - 0.02, tPress + 0.05, t) * (1 - inv(tRel + 0.1, tRel + 0.5, t) * 0.5));
    // thumb approach: slides in 30.20-30.56, pulls back a hair (anticipation) then presses
    let u = ease.out(inv(30.16, 30.56, t)) - 0.06 * ease.inOut(inv(30.56, 30.66, t)) * (1 - inv(tPress - 0.05, tPress, t));
    u = t > tRel + 0.02 ? 1 - 0.0 * 0 : u;
    // camera: push in on button, slight rotation
    const z = A.key(t, [[T0, 1.0], [30.72, 1.12, 'out'], [31.10, 1.42, 'in']]);
    ctx.save();
    ctx.translate(960, 540); ctx.rotate(-0.02 + 0.03 * ease.out(inv(T0, 30.7, t))); ctx.scale(z, z); ctx.translate(-OKX * 0.9 - 96, -OKY * 0.95 - 27);
    bokehBg(ctx, t);
    remote(ctx, t, pr, glowK);
    // ripples + glow at press
    const tp = t - tPress;
    if (tp > 0) {
      for (let i = 0; i < 3; i++) { const q = inv(i * 0.09, 0.6 + i * 0.09, tp); if (q > 0 && q < 1) ring(ctx, OKX, OKY, 130 + ease.out(q) * (520 + i * 90), 16 * (1 - q) + 2, i === 1 ? '#38D9F5' : '#FFE08A', (1 - q) * 0.9); }
      A.glow(ctx, OKX, OKY, 520 * (0.6 + Math.min(tp * 1.5, 1) * 0.6), '#FFC24A', 0.85 * clamp(1 - tp / 1.2) + 0.15);
      for (let i = 0; i < 10; i++) { const a = i / 10 * A.TAU + 0.3, q = ease.out(inv(0, 0.4, tp)); if (q > 0 && q < 1) sparkle(ctx, OKX + Math.cos(a) * (170 + q * 260), OKY + Math.sin(a) * (170 + q * 260), 26 * (1 - q * 0.6), a, '#FFF3B8', 1 - q); }
    }
    thumb(ctx, u, pr);
    ctx.restore();
    // "click" flash-through at cut 31.02-31.10
    flash(ctx, ease.in(inv(31.0, 31.1, t)), '255,244,210');
  }

  // ============================================================
  // 2. TV screen contents (local coords, centred, clipped by caller)
  // ============================================================
  function drawMatch(ctx, w, h, t, seed = 0) {
    const k = w / 720, cyc = 2.4, c = ((t + seed * 0.7) % cyc + cyc) % cyc, cn = Math.floor((t + seed * 0.7) / cyc);
    ctx.save(); ctx.scale(k, k); const W = 720, H = h / k;
    ctx.translate(0, 0);
    // stadium sky / crowd band
    ctx.fillStyle = A.linear(ctx, 0, -H / 2, 0, -H * 0.05, [[0, '#1a1550'], [1, '#3a2a86']]); ctx.fillRect(-W / 2, -H / 2, W, H);
    const cr = c > 1.0 ? inv(1.0, 1.15, c) : 0;
    for (let i = 0; i < 26; i++) {
      const cx = -W / 2 + 14 + i * (W / 25.5), cy = -H * 0.28 + (i % 3) * 22, b = cr ? Math.abs(Math.sin(c * 9 + i)) * 26 * cr : 0;
      ctx.beginPath(); ctx.arc(cx, cy - b, 15, 0, A.TAU); ctx.fillStyle = ['#FF4F9A', '#FFC24A', '#38D9F5', '#fff', '#ff8a3d'][i % 5]; ctx.fill();
      ctx.fillRect(cx - 13, cy - b + 8, 26, 42);
    }
    // pitch
    const py = -H * 0.08;
    ctx.fillStyle = A.linear(ctx, 0, py, 0, H / 2, [[0, '#2b9a4a'], [1, '#1c7433']]); ctx.fillRect(-W / 2, py, W, H / 2 - py);
    for (let i = 0; i < 8; i++) { if (i % 2) continue; ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(-W / 2 + i * 90 - 60, H / 2); ctx.lineTo(-W / 2 + i * 90 + 40, py); ctx.lineTo(-W / 2 + i * 90 + 130, py); ctx.lineTo(-W / 2 + i * 90 + 30, H / 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-W / 2, py + 4); ctx.lineTo(W / 2, py + 4); ctx.stroke();
    // goal
    const gx = W * 0.18, gy = py - 6, gw = 250, gh = 130;
    const bulge = c > 1.0 ? Math.sin(inv(1.0, 1.5, c) * Math.PI) * 18 : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(gx - gw / 2, gy - gh, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(gx - gw / 2 + i * gw / 10, gy - gh); ctx.lineTo(gx - gw / 2 + i * gw / 10 + bulge * 0.3, gy); ctx.stroke(); }
    for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(gx - gw / 2, gy - gh + i * gh / 5); ctx.lineTo(gx + gw / 2, gy - gh + i * gh / 5 + bulge * 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.strokeRect(gx - gw / 2, gy - gh, gw, gh);
    // players
    const pl = (x, y, col, s = 1, run = 0) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, -78, 15, 0, A.TAU); ctx.fillStyle = '#e8b08a'; ctx.fill(); A.rrect(ctx, -17, -64, 34, 44, 10); ctx.fillStyle = col; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-14 + Math.sin(run) * 8, -20, 11, 26); ctx.fillRect(3 - Math.sin(run) * 8, -20, 11, 26); ctx.restore(); };
    pl(-W * 0.2 + c * 30, H * 0.22, '#FFC24A', 1.6, c * 14); pl(-W * 0.02 + Math.sin(c * 2) * 30, H * 0.16, '#FF4A3D', 1.3, c * 12); pl(gx - 90, py + 40, '#38D9F5', 1.2, 0);
    // ball
    const bp = inv(0.05, 1.0, c);
    if (c < 1.02) {
      const bx = A.lerp(-W * 0.22, gx + 10, ease.out(bp)), by = A.lerp(H * 0.3, gy - gh * 0.45, ease.out(bp)) - Math.sin(bp * Math.PI) * 70, br = 26 - bp * 12;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, A.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1a1330'; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + br * 0.15, by, br * 0.4, 0, A.TAU); ctx.fillStyle = '#1a1330'; ctx.fill();
    }
    if (c > 1.0) {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - inv(1.0, 1.25, c))})`; ctx.fillRect(-W / 2, -H / 2, W, H);
      const q = ease.outBack(inv(1.02, 1.3, c)), fade = 1 - inv(2.1, 2.4, c);
      ctx.save(); ctx.translate(-W * 0.14, -H * 0.02); ctx.scale(q, q); ctx.rotate(-0.08); A.text(ctx, 'GOAL!', 0, 0, { font: '900 120px Rubik', fill: '#FFE08A', stroke: '#1a1330', lw: 16 }); ctx.restore();
      void fade; void cn;
    }
    // scoreboard
    A.rrect(ctx, -W / 2 + 18, -H / 2 + 16, 190, 44, 10); ctx.fillStyle = 'rgba(10,6,30,0.85)'; ctx.fill();
    A.text(ctx, c > 1.0 ? '1  :  0' : '0  :  0', -W / 2 + 113, -H / 2 + 39, { font: '800 30px Rubik', fill: '#FFE08A' });
    ctx.restore();
  }
  function drawNews(ctx, w, h, t, seed = 0) {
    const k = w / 720; ctx.save(); ctx.scale(k, k); const W = 720, H = h / k;
    ctx.fillStyle = A.linear(ctx, 0, -H / 2, 0, H / 2, [[0, '#1c4fbf'], [1, '#12277a']]); ctx.fillRect(-W / 2, -H / 2, W, H);
    // studio panels
    for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.03 * ((i + Math.floor(t * 2)) % 2)})`; ctx.fillRect(-W / 2 + i * 150 - 20, -H / 2, 100, H); }
    // map globe
    ctx.beginPath(); ctx.arc(W * 0.24, -H * 0.12, 110, 0, A.TAU); ctx.fillStyle = 'rgba(56,217,245,0.28)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(W * 0.24, -H * 0.12, 110 * Math.abs(Math.cos(i * 0.9 + t * 0.6)), 110, 0, 0, A.TAU); ctx.stroke(); }
    // anchor
    const ax = -W * 0.16, ay = H * 0.22;
    ctx.beginPath(); ctx.ellipse(ax, ay + 60, 130, 90, 0, Math.PI, 0); ctx.fillStyle = '#2b2b5a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax - 22, ay - 20); ctx.lineTo(ax, ay + 60); ctx.lineTo(ax + 22, ay - 20); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ax, ay - 70 + Math.sin(t * 5 + seed) * 2, 56, 0, A.TAU); ctx.fillStyle = '#F0B48A'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#1a1330'; ctx.stroke();
    ctx.beginPath(); ctx.arc(ax, ay - 92, 58, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = '#3a2418'; ctx.fill();
    ctx.fillStyle = '#1a1330'; ctx.beginPath(); ctx.arc(ax - 18, ay - 68, 5, 0, A.TAU); ctx.arc(ax + 18, ay - 68, 5, 0, A.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax, ay - 46, 14, 5 + Math.abs(Math.sin(t * 9 + seed)) * 6, 0, 0, A.TAU); ctx.fill();
    // lower third
    A.rrect(ctx, -W / 2 + 24, H / 2 - 122, W - 48, 62, 8); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#FF4A3D'; ctx.fillRect(-W / 2 + 24, H / 2 - 122, 150, 62);
    A.text(ctx, 'חדשות', -W / 2 + 99, H / 2 - 90, { font: '800 34px Rubik', fill: '#fff', dir: 'rtl' });
    ctx.fillStyle = '#1a1330'; for (let i = 0; i < 4; i++) ctx.fillRect(-W / 2 + 200 + i * 116, H / 2 - 100, 96, 18);
    // ticker
    ctx.fillStyle = '#0f1a4d'; ctx.fillRect(-W / 2, H / 2 - 46, W, 46);
    ctx.fillStyle = '#FFC24A'; for (let i = 0; i < 8; i++) { const x = ((i * 130 - t * 160) % 1040 + 1040) % 1040 - W / 2 - 60; ctx.fillRect(x, H / 2 - 32, 90, 16); }
    ctx.restore();
  }

  // ============================================================
  // 3. ROOM (static layer + dynamic lights)
  // ============================================================
  function roomLayer() {
    return A.layer('s5room', 1920, 1080, (g) => {
      // wall
      g.fillStyle = A.linear(g, 0, 0, 0, 760, [[0, '#4a2466'], [1, '#8a4460']]); g.fillRect(0, 0, 1920, 760);
      g.fillStyle = 'rgba(255,220,200,0.05)'; for (let x = 0; x < 1920; x += 90) g.fillRect(x, 0, 44, 760);
      // wainscot
      g.fillStyle = '#5a2e52'; g.fillRect(0, 640, 1920, 130); g.fillStyle = 'rgba(255,200,160,0.18)'; g.fillRect(0, 640, 1920, 8);
      for (let x = 60; x < 1920; x += 240) { A.rrect(g, x, 668, 190, 80, 8); g.strokeStyle = 'rgba(20,8,30,0.45)'; g.lineWidth = 5; g.stroke(); }
      // floor
      g.fillStyle = A.linear(g, 0, 770, 0, 1080, [[0, '#7a4630'], [1, '#3c1f26']]); g.fillRect(0, 770, 1920, 310);
      g.strokeStyle = 'rgba(20,8,20,0.35)'; g.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const y = 780 + i * i * 4.6 + i * 10; g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); }
      g.fillStyle = 'rgba(20,8,20,0.5)'; g.fillRect(0, 764, 1920, 8);
      // rug
      g.beginPath(); g.ellipse(960, 930, 780, 130, 0, 0, A.TAU); g.fillStyle = '#1FB6A6'; g.fill(); g.lineWidth = 7; g.strokeStyle = A.OUTLINE; g.stroke();
      g.beginPath(); g.ellipse(960, 930, 660, 100, 0, 0, A.TAU); g.strokeStyle = '#FFC24A'; g.lineWidth = 8; g.stroke();
      g.beginPath(); g.ellipse(960, 930, 520, 74, 0, 0, A.TAU); g.strokeStyle = '#FF4F9A'; g.lineWidth = 6; g.stroke();
      // bookshelf left
      A.rrect(g, 70, 130, 330, 590, 14); A.fillStroke(g, '#5b3320', 7);
      for (let r = 0; r < 4; r++) {
        const y = 150 + r * 142; g.fillStyle = '#2b150f'; g.fillRect(84, y, 302, 122);
        let x = 92; const rn = A.rng(r + 11);
        while (x < 372) { const bw = 20 + rn() * 26, bh = 70 + rn() * 44; g.fillStyle = ['#FF4F9A', '#38D9F5', '#FFC24A', '#3D7BFF', '#FF8A3D', '#3DDC84'][Math.floor(rn() * 6)]; g.fillRect(x, y + 122 - bh, bw, bh); g.lineWidth = 3; g.strokeStyle = A.OUTLINE; g.strokeRect(x, y + 122 - bh, bw, bh); x += bw + 3; }
        g.fillStyle = '#5b3320'; g.fillRect(84, y + 122, 302, 20);
      }
      // frames right
      const fr = (x, y, w, h, c1, c2) => { A.rrect(g, x, y, w, h, 8); A.fillStroke(g, '#FFC24A', 8); A.rrect(g, x + 14, y + 14, w - 28, h - 28, 4); g.fillStyle = A.linear(g, x, y, x + w, y + h, [[0, c1], [1, c2]]); g.fill(); };
      fr(1470, 150, 170, 210, '#38D9F5', '#3D7BFF'); fr(1670, 210, 190, 150, '#FF8A3D', '#FF4F9A'); fr(1550, 400, 150, 150, '#3DDC84', '#1FB6A6');
      g.beginPath(); g.arc(1560, 260, 30, 0, A.TAU); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill();
      // plant
      g.beginPath(); g.moveTo(1740, 660); g.lineTo(1860, 660); g.lineTo(1840, 780); g.lineTo(1760, 780); g.closePath(); A.fillStroke(g, '#FF8A3D', 7);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; g.save(); g.translate(1800, 660); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, -110, 34, 110, 0, 0, A.TAU); A.fillStroke(g, i % 2 ? '#3DDC84' : '#22a85f', 6); g.restore(); }
      // floor lamp left
      g.fillStyle = '#2b150f'; g.fillRect(468, 300, 12, 470); g.beginPath(); g.ellipse(474, 770, 60, 14, 0, 0, A.TAU); g.fill();
      g.beginPath(); g.moveTo(420, 300); g.lineTo(528, 300); g.lineTo(508, 210); g.lineTo(440, 210); g.closePath(); A.fillStroke(g, '#FFD98A', 7);
      // TV console
      A.rrect(g, 560, 585, 800, 92, 18); A.fillStroke(g, '#6a3a24', 8); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(580, 595, 760, 8);
      g.fillStyle = '#2b150f'; g.fillRect(600, 690, 30, 80); g.fillRect(1290, 690, 30, 80);
      // TV stand neck
      g.fillStyle = '#20182e'; g.fillRect(900, 530, 120, 60);
    });
  }
  function tvFrame(ctx, on) {
    ctx.save(); A.rrect(ctx, TVC.x - TVW / 2 - 26, TVC.y - TVH / 2 - 26, TVW + 52, TVH + 52, 26); A.fillStroke(ctx, '#171126', 9);
    ctx.restore();
  }
  function sofaPlaceholder(ctx) {
    // sofa back + seat + arms
    ctx.save();
    A.rrect(ctx, 400, 640, 1120, 300, 60); A.fillStroke(ctx, '#C7473E', 8);
    A.rrect(ctx, 360, 720, 170, 250, 60); A.fillStroke(ctx, '#A9362F', 8);
    A.rrect(ctx, 1390, 720, 170, 250, 60); A.fillStroke(ctx, '#A9362F', 8);
    A.rrect(ctx, 500, 800, 920, 170, 40); A.fillStroke(ctx, '#D95B4F', 8);
    ctx.restore();
  }
  const CAST = [{ x: 720, c: '#FFC24A', n: 'YONI' }, { x: 960, c: '#FF4F9A', n: 'MAYA' }, { x: 1200, c: '#38D9F5', n: 'TOM' }];
  function peoplePlaceholder(ctx, t, cheer) {
    CAST.forEach((p, i) => {
      const bob = Math.sin(t * (6 + i) + i) * (6 + 22 * cheer) + cheer * -12;
      const lean = 0.06 * Math.sin(t * 3 + i);
      ctx.save(); ctx.translate(p.x, 800 + bob); ctx.rotate(lean);
      A.rrect(ctx, -70, -150, 140, 190, 40); A.fillStroke(ctx, p.c, 7);
      ctx.beginPath(); ctx.arc(0, -220, 80, 0, A.TAU); A.fillStroke(ctx, SKIN, 7);
      ctx.beginPath(); ctx.ellipse(0, -195, 32, 20 + 20 * cheer, 0, 0, Math.PI); A.fillStroke(ctx, '#7a1f2b', 5);
      ctx.restore();
    });
  }

  // ============================================================
  // 4. Posters / LIVE tiles orbit
  // ============================================================
  const POSTERS = [
    ['#FF4F9A', '#7a1c6b', 'heart', 'דרמה'], ['#38D9F5', '#1b4fbf', 'rocket', 'מדע'], ['#FFC24A', '#c25a12', 'star', 'קומדיה'], ['#3DDC84', '#127a52', 'ball', 'ספורט'],
    ['#8a5cff', '#3a1b8a', 'moon', 'מתח'], ['#FF8A3D', '#a3261f', 'flame', 'אקשן'], ['#ff6ec7', '#5b2bd1', 'mask', 'אנימה'], ['#1FB6A6', '#123f7a', 'wave', 'דוקו'],
    ['#FFE08A', '#ff7a3d', 'sun', 'ילדים'], ['#5aa0ff', '#3a1b8a', 'crown', 'סדרות'],
  ];
  function icon(ctx, kind, s) {
    ctx.save(); ctx.scale(s, s); ctx.lineWidth = 7; ctx.strokeStyle = OL(); ctx.lineJoin = 'round';
    if (kind === 'heart') { ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-90, -20, -50, -80, 0, -34); ctx.bezierCurveTo(50, -80, 90, -20, 0, 40); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
    else if (kind === 'star') { D.starburst(ctx, 0, 0, 30, 70, 5, -Math.PI / 2, '#fff'); ctx.stroke(); }
    else if (kind === 'rocket') { ctx.beginPath(); ctx.moveTo(0, -80); ctx.bezierCurveTo(40, -40, 40, 30, 22, 60); ctx.lineTo(-22, 60); ctx.bezierCurveTo(-40, 30, -40, -40, 0, -80); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 14, 0, A.TAU); ctx.fillStyle = '#38D9F5'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-22, 60); ctx.lineTo(0, 100); ctx.lineTo(22, 60); ctx.fillStyle = '#FFC24A'; ctx.fill(); ctx.stroke(); }
    else if (kind === 'ball') { ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); D.starburst(ctx, 0, 0, 14, 26, 5, -Math.PI / 2, '#1a1330'); }
    else if (kind === 'moon') { ctx.beginPath(); ctx.arc(0, 0, 62, 0.5, Math.PI * 2 - 0.5); ctx.bezierCurveTo(20, -40, 20, 40, 55, 34); ctx.fillStyle = '#FFE08A'; ctx.fill(); ctx.stroke(); }
    else if (kind === 'flame') { ctx.beginPath(); ctx.moveTo(0, -90); ctx.bezierCurveTo(60, -30, 70, 20, 40, 60); ctx.bezierCurveTo(20, 84, -20, 84, -40, 60); ctx.bezierCurveTo(-70, 20, -50, -30, 0, -90); ctx.fillStyle = '#FFC24A'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 40, 20, 26, 0, 0, A.TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
    else if (kind === 'mask') { ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1330'; ctx.beginPath(); ctx.ellipse(-24, -8, 10, 16, 0, 0, A.TAU); ctx.ellipse(24, -8, 10, 16, 0, 0, A.TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, 18, 26, 0.2, Math.PI - 0.2); ctx.lineWidth = 7; ctx.stroke(); }
    else if (kind === 'wave') { ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-50, 0); ctx.bezierCurveTo(-25, -40, -10, 40, 10, 0); ctx.bezierCurveTo(28, -34, 40, 30, 52, 0); ctx.strokeStyle = '#1FB6A6'; ctx.lineWidth = 12; ctx.stroke(); }
    else if (kind === 'sun') { D.starburst(ctx, 0, 0, 44, 78, 12, 0, '#fff'); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 40, 0, A.TAU); ctx.fillStyle = '#FFE08A'; ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-64, 40); ctx.lineTo(-64, -20); ctx.lineTo(-32, 10); ctx.lineTo(0, -50); ctx.lineTo(32, 10); ctx.lineTo(64, -20); ctx.lineTo(64, 40); ctx.closePath(); ctx.fillStyle = '#FFE08A'; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function poster(ctx, p, w, h) {
    A.rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, p[0]], [1, p[1]]]); ctx.fill();
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w * 0.1, -h / 2); ctx.lineTo(-w * 0.35, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill();
    ctx.translate(0, -h * 0.06); icon(ctx, p[2], w / 190); ctx.restore();
    ctx.fillStyle = 'rgba(15,8,35,0.55)'; ctx.fillRect(-w / 2 + 4, h / 2 - 66, w - 8, 58);
    A.text(ctx, p[3], 0, h / 2 - 36, { font: '800 34px Rubik', fill: '#fff', dir: 'rtl' });
    A.rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.lineWidth = 7; ctx.strokeStyle = OL(); ctx.stroke();
  }
  function liveTile(ctx, i, w, h, t, popK) {
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.clip();
    if (i % 2 === 0) drawMatch(ctx, w, h, t, i); else drawNews(ctx, w, h, t, i);
    ctx.restore();
    A.rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.lineWidth = 7; ctx.strokeStyle = OL(); ctx.stroke();
    if (popK > 0) D.LIVE(ctx, -w / 2 + 62, -h / 2 + 30, 0.8 * ease.outBack(popK), t);
  }
  const NP = 10;
  function tileState(i, t) {
    // returns {x,y,s,z,alpha,flip(0 poster..1 live),popK,rot} or null
    const ts = 32.04 + i * 0.055, q0 = inv(ts, ts + 0.62, t);
    if (q0 <= 0) return null;
    const ret = 34.95 + i * 0.03, qr = inv(ret, ret + 0.42, t);
    if (qr >= 1) return null;
    const om = 1.25 + 0.15 * ease.inOut(inv(32.04, 34, t)) - 0.4 * ease.in(inv(34.6, 35.0, t));
    const a = i / NP * A.TAU + 0.6 + (t - 32.04) * om;
    const ox = RING.x + Math.cos(a) * RING.rx, oy = RING.y + Math.sin(a) * RING.ry * (1 + 0.05 * Math.sin(t * 2 + i));
    const dep = (Math.sin(a) + 1) / 2;         // 0 back .. 1 front
    const sc = 0.62 + dep * 0.62;
    const e = ease.out(q0), sp = 1 - Math.pow(1 - q0, 3);
    let x = A.lerp(TVC.x, ox, e), y = A.lerp(TVC.y, oy, e) - Math.sin(q0 * Math.PI) * 120 * (i % 2 ? 1 : -0.3);
    let s = A.lerp(0.12, sc, ease.outBack(q0));
    // return to TV
    if (qr > 0) { const r = ease.in(qr); x = A.lerp(x, TVC.x, r); y = A.lerp(y, TVC.y, r); s *= 1 - r * 0.9; }
    const fs = 33.42 + i * 0.07, fl = ease.inOut(inv(fs, fs + 0.34, t));
    return { x, y, s, dep, flip: fl, popK: inv(fs + 0.3, fs + 0.5, t), rot: Math.sin(a * 2 + i) * 0.12 * (1 - fl), a, sp, alpha: 1 };
  }
  function drawTile(ctx, i, st, t) {
    ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.rot + Math.cos(st.a) * 0.08); ctx.scale(st.s, st.s);
    // perspective yaw: tiles turn along the ring
    const yaw = Math.cos(st.a) * 0.34; ctx.transform(Math.cos(yaw) * 0 + 1 * (1 - Math.abs(Math.sin(yaw)) * 0.25), Math.sin(yaw) * 0.12, 0, 1, 0, 0);
    // shadow glow
    A.glow(ctx, 0, 0, 240, st.flip > 0.5 ? '#FF4A3D' : '#38D9F5', 0.2 + 0.1 * st.dep);
    const fx = Math.abs(Math.cos(st.flip * Math.PI));
    const w = A.lerp(200, 340, st.flip), h = A.lerp(280, 192, st.flip);
    ctx.scale(Math.max(fx, 0.02), 1 + (1 - fx) * 0.06);
    if (st.flip < 0.5) poster(ctx, POSTERS[i % POSTERS.length], w, h); else liveTile(ctx, i, w, h, t, st.popK);
    ctx.restore();
  }
  function drawTiles(ctx, t, front) {
    const list = [];
    for (let i = 0; i < NP; i++) { const st = tileState(i, t); if (st) list.push([i, st]); }
    list.sort((a, b) => a[1].dep - b[1].dep);
    for (const [i, st] of list) { const isFront = st.dep > 0.5 && st.sp > 0.6; if (isFront === front) drawTile(ctx, i, st, t); }
  }

  // ============================================================
  // 5. Room scene
  // ============================================================
  function tvScreen(ctx, t) {
    ctx.save();
    ctx.translate(TVC.x, TVC.y);
    A.rrect(ctx, -TVW / 2, -TVH / 2, TVW, TVH, 10); ctx.clip();
    // power-on: from a bright line to full
    const on = inv(31.1, 31.3, t);
    ctx.fillStyle = '#05030c'; ctx.fillRect(-TVW / 2, -TVH / 2, TVW, TVH);
    ctx.save(); const hh = A.lerp(6, TVH, ease.out(on)); ctx.beginPath(); ctx.rect(-TVW / 2, -hh / 2, TVW, hh); ctx.clip();
    // content over time: goal replay (31.1-34.6), crowd/celebrate
    if (t < 35.2) drawMatch(ctx, TVW, TVH, t - 31.1);
    else drawMatch(ctx, TVW, TVH, t - 31.1 + 1.0);
    ctx.restore();
    // glass shine
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(-TVW / 2, -TVH / 2); ctx.lineTo(-TVW / 6, -TVH / 2); ctx.lineTo(-TVW / 2 - 110, TVH / 2); ctx.lineTo(-TVW / 2, TVH / 2); ctx.fill();
    ctx.restore();
  }
  function tvGlow(ctx, t) {
    const on = ease.out(inv(31.1, 31.6, t));
    const gc = A.hash(Math.floor(t * 6)) * 0;   // reserved for flicker
    const pulse = 0.85 + 0.15 * Math.sin(t * 17) + gc;
    A.glow(ctx, TVC.x, TVC.y + 60, 1250, '#7fd8ff', 0.5 * on * pulse);
    A.glow(ctx, TVC.x, TVC.y + 300, 900, '#c9ffd0', 0.22 * on);
    // warm lamp
    A.glow(ctx, 474, 250, 480, '#ffc070', 0.5);
    A.glow(ctx, 474, 700, 300, '#ffb060', 0.18);
  }
  function roomScene(ctx, t, cam) {
    ctx.save();
    const c = cam(t);
    A.camera(ctx, { x: c.x, y: c.y, zoom: c.zoom, rot: c.rot, shake: c.shake, t });
    ctx.drawImage(roomLayer(), 0, 0);
    tvFrame(ctx); tvScreen(ctx, t);
    // TV light spill upon wall (additive)
    tvGlow(ctx, t);
    drawTiles(ctx, t, false);
    // sofa + people
    const cheer = clamp(0.35 + inv(31.5, 32.5, t) * 0.25 + inv(36.1, 36.3, t) * 0.4);
    sofaPlaceholder(ctx);
    peoplePlaceholder(ctx, t, cheer);
    drawTiles(ctx, t, true);
    // darkness (room dim before TV lit + vignette around light)
    const dim = 0.72 * (1 - ease.out(inv(31.1, 31.7, t)));
    if (dim > 0.01) { ctx.fillStyle = `rgba(8,4,30,${dim})`; ctx.fillRect(-400, -300, 2800, 1700); }
    ctx.restore();
  }
  function camFn(t) {
    let zoom = A.key(t, [[31.10, 1.22, 'out'], [32.04, 1.0], [35.19, 1.05, 'inOut'], [36.17, 1.6, 'inOut'], [36.88, 1.68, 'lin']]);
    let x = A.key(t, [[31.10, 940], [32.04, 960], [35.19, 970, 'inOut'], [36.17, 960, 'inOut']]);
    let y = A.key(t, [[31.10, 520], [32.04, 540], [35.19, 530, 'inOut'], [36.17, 470, 'inOut']]);
    const rot = 0.012 * Math.sin(t * 0.9) + A.key(t, [[35.19, 0], [35.7, -0.02, 'inOut'], [36.17, 0, 'inOut']]);
    const shake = 0.7 * Math.exp(-Math.max(0, t - 36.44) * 12) * (t > 36.44 ? 1 : 0) + 0.25 * Math.exp(-Math.max(0, t - 31.1) * 8) * (t > 31.1 ? 1 : 0);
    return { x, y, zoom, rot, shake };
  }

  // ============================================================
  // 6. Spinner ghost, thumbs-up, end text
  // ============================================================
  function spinner(ctx, x, y, s, a, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s.x, s.y); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.fillStyle = 'rgba(20,14,40,0.75)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OL(); ctx.stroke();
    for (let i = 0; i < 10; i++) { const ang = i / 10 * A.TAU + t * 9; ctx.beginPath(); ctx.arc(Math.cos(ang) * 38, Math.sin(ang) * 38, 8 - i * 0.5, 0, A.TAU); ctx.fillStyle = `rgba(255,255,255,${0.95 - i * 0.09})`; ctx.fill(); }
    ctx.restore();
  }
  function thumbsUp(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = OL();
    // sleeve
    A.rrect(ctx, -90, 120, 200, 130, 30); A.fillStroke(ctx, '#38D9F5', 9);
    // fist
    A.rrect(ctx, -120, -40, 250, 200, 70); A.fillStroke(ctx, SKIN, 9);
    // thumb up
    A.rrect(ctx, -110, -190, 90, 210, 45); A.fillStroke(ctx, SKIN, 9);
    ctx.beginPath(); ctx.ellipse(-78, -150, 16, 24, 0.1, 0, A.TAU); ctx.fillStyle = '#FFE1D2'; ctx.fill();
    // finger lines
    ctx.lineWidth = 7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30, 0 + i * 48); ctx.lineTo(120, 0 + i * 48); ctx.stroke(); }
    ctx.restore();
  }
  function endLayer(ctx, t) {
    const t0 = 36.2;
    if (t < t0 - 0.12) return;
    // golden hero light
    const gl = ease.out(inv(t0 - 0.08, t0 + 0.3, t));
    ctx.fillStyle = `rgba(18,8,40,${0.5 * gl})`; ctx.fillRect(0, 0, 1920, 1080);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(960, 440); ctx.rotate((t - t0) * 0.35); ctx.globalAlpha = 0.22 * gl;
    for (let i = 0; i < 14; i++) { ctx.rotate(A.TAU / 14); ctx.fillStyle = A.linear(ctx, 0, 0, 1300, 0, [[0, 'rgba(255,214,110,0.9)'], [1, 'rgba(255,214,110,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1300, -60); ctx.lineTo(1300, 60); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    A.glow(ctx, 960, 450, 1000, '#FFC24A', 0.55 * gl);
    A.glow(ctx, 960, 450, 520, '#fff4c0', 0.35 * gl);
    // white flash on pop
    flash(ctx, 0.75 * Math.exp(-Math.max(0, t - t0) * 14) * (t >= t0 ? 1 : 0), '255,244,200');
    const lines = [['כל התוכן.', 0, 400], ['בלי תקיעות.', 0.11, 570]];
    lines.forEach(([s, d, y], i) => {
      const q = inv(t0 + d, t0 + d + 0.32, t); if (q <= 0) return;
      const sc = A.lerp(0.4, 1, ease.outBack(q)) * (1 + 0.03 * inv(t0, 36.9, t)), rot = (1 - ease.out(q)) * (i ? 0.06 : -0.06);
      ctx.save(); ctx.translate(960, y + (1 - ease.out(q)) * 40); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = clamp(q * 3);
      const font = '900 ' + (i ? 190 : 200) + 'px Rubik';
      A.text(ctx, s, 6, 14, { font, fill: 'rgba(10,4,30,0.55)', stroke: 'rgba(10,4,30,0.55)', lw: 30, dir: 'rtl' });
      A.text(ctx, s, 0, 0, { font, fill: '#1a1330', stroke: '#1a1330', lw: 34, dir: 'rtl' });
      ctx.font = font; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = A.linear(ctx, 0, -100, 0, 100, [[0, '#FFF6C8'], [0.45, '#FFD24A'], [1, '#FF9A2A']]); ctx.fillText(s, 0, 0);
      // shine sweep
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; const sx = A.lerp(-500, 500, inv(t0 + d + 0.15, t0 + d + 0.6, t));
      ctx.fillStyle = A.linear(ctx, sx - 80, 0, sx + 80, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.85)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sx - 80, -140, 160, 280); ctx.restore();
      ctx.restore();
    });
    // sparkles
    for (let i = 0; i < 14; i++) {
      const st = t0 + 0.02 + A.hash(i + 5) * 0.25, q = inv(st, st + 0.42, t); if (q <= 0 || q >= 1) continue;
      const x = 960 + (A.hash(i + 30) - 0.5) * 1150, y = 330 + A.hash(i + 60) * 340;
      sparkle(ctx, x, y, 22 + A.hash(i) * 34, q * 2, '#fff8d0', Math.sin(q * Math.PI));
    }
    // hero sparkle at text centre on pop
    const hq = inv(t0, t0 + 0.35, t); if (hq > 0 && hq < 1) sparkle(ctx, 1330, 330, 130 * Math.sin(hq * Math.PI), hq * 3, '#fff', 1);
  }
  function gag(ctx, t) {
    // spinner ghost tries to appear at the TV corner (world -> screen via camera); drawn in world space
  }

  // ============================================================
  // MAIN
  // ============================================================
  function worldOverlay(ctx, t, cam) {
    // spinner + thumbs-up in world space next to TV top-right corner
    const c = cam(t);
    ctx.save(); A.camera(ctx, { x: c.x, y: c.y, zoom: c.zoom, rot: c.rot, shake: c.shake, t });
    const sx = TVC.x + TVW / 2 + 10, sy = TVC.y - TVH / 2 + 10;
    const ap = inv(36.22, 36.38, t), sq = inv(36.44, 36.5, t);
    if (ap > 0 && t < 36.7) {
      const squash = sq > 0 ? { x: 1 + 0.9 * ease.out(sq), y: 0.12 } : { x: 0.6 + 0.4 * ease.outBack(ap), y: 0.6 + 0.4 * ease.outBack(ap) };
      const fade = 1 - inv(36.55, 36.68, t);
      spinner(ctx, sx + 20, sy + (sq > 0 ? 40 : 0), squash, ap * fade, t);
    }
    ctx.restore();
  }
  function screenGag(ctx, t) {
    // giant thumbs-up slams in from lower right
    const q = inv(36.3, 36.44, t); if (q <= 0) return;
    const hold = 1 - inv(36.62, 36.75, t);
    const e = ease.in(q);
    const x = A.lerp(2100, 1400, ease.out(inv(36.3, 36.44, t))), y = A.lerp(1250, 470, ease.out(q));
    const pop = 1 + 0.12 * Math.sin(inv(36.44, 36.6, t) * Math.PI);
    ctx.save(); ctx.globalAlpha = hold; void e;
    thumbsUp(ctx, x, y, 1.5 * pop, -0.25 + 0.2 * ease.outBack(inv(36.44, 36.6, t)));
    ctx.restore();
    const ip = inv(36.44, 36.75, t);
    if (ip > 0 && ip < 1) {
      ring(ctx, 1400, 470, 60 + ip * 300, 14 * (1 - ip), '#fff', 1 - ip);
      for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; sparkle(ctx, 1400 + Math.cos(a) * (120 + ip * 260), 470 + Math.sin(a) * (120 + ip * 260), 30 * (1 - ip), a, '#FFE08A', 1 - ip); }
    }
  }

  A.scene({
    name: 's5_press_watch', start: T0, end: T_END + 0.3,
    draw(ctx, s) {
      const t = s.t;
      const wp = inv(T0, 30.42, t);
      const whip = 1 - ease.out(wp);   // 1 -> 0
      const drawAll = (c) => {
        if (t < 31.1) remoteScene(c, t); else { roomScene(c, t, camFn); worldOverlay(c, t, camFn); }
      };
      // fully opaque base so the whip covers everything
      ctx.fillStyle = '#2a1140'; ctx.fillRect(0, 0, 1920, 1080);
      if (whip > 0.002) {
        const off = -whip * 2200;
        // motion-blur ghosts trailing behind (to the left of leading edge)
        for (let k = 3; k >= 0; k--) {
          ctx.save(); ctx.globalAlpha = k === 0 ? 1 : 0.22; ctx.translate(off - k * whip * 140, 0);
          if (k) { ctx.filter = 'none'; }
          drawAll(ctx); ctx.restore();
        }
        // streaks
        ctx.save(); ctx.globalAlpha = whip * 0.5; for (let i = 0; i < 14; i++) { const y = A.hash(i * 3) * 1080, h = 6 + A.hash(i) * 26; ctx.fillStyle = i % 2 ? '#FFE08A' : '#fff'; ctx.fillRect(0, y, 1920, h * 0.5); } ctx.restore();
      } else drawAll(ctx);
      // end layer + gag in screen space
      if (t >= 31.1) { screenGag(ctx, t); endLayer(ctx, t); }
    },
  });
})();
