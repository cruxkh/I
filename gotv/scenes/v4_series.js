// ============================================================================
// V4  SERIES / K-DRAMA / ANIME / "AND SO MUCH MORE"   (global 13.10 - 15.81, tail to 16.11)
//   13.10 whip-in (from right)  Turkish: Bosphorus golden hour -> soap-opera close-up + Hebrew title
//   14.00 Korean neon rainy Seoul     14.60 Anime punch     15.05 shatter -> poster tunnel -> wall reveal -> zoom-through
// Pure function of t. Everything static is cached with A.layer.
// ============================================================================
(() => {
const { clamp, lerp, ease, hash, rng } = A;
const C = V.C, W = 1080, H = 1920, TAU = Math.PI * 2;
const eo = x => ease.out(clamp(x)), eio = x => ease.inOut(clamp(x)), eob = x => ease.outBack(clamp(x)), ein = x => ease.in(clamp(x));
const lin = V.lin, rad = V.rad;
const S0 = 13.10, T_KOR = 14.00, T_ANI = 14.60, T_MORE = 15.05, T_LIB = 15.81, T_END = 16.11;
const T_SOAP = 13.62;
const add = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const kick = (t, t0, k = 16) => (t < t0 ? 0 : Math.exp(-(t - t0) * k));   // decaying hit envelope
const FONT = 'Rubik, "Secular One", sans-serif';

// fit-to-width text metric
function fitSize(ctx, s, size, maxW, weight = 900) { ctx.save(); ctx.font = `${weight} ${size}px ${FONT}`; ctx.direction = 'rtl'; const w = ctx.measureText(s).width; ctx.restore(); return w > maxW ? size * maxW / w : size; }

// =====================================================================================================
// A) TURKISH
// =====================================================================================================
const SUNX = 700, SUNY = 835, HOR = 905;

function skyLayer() {
  return A.layer('v4_sky', W, H, g => {
    g.fillStyle = lin(g, 0, 0, 0, HOR + 40, [[0, '#1f1250'], [.22, '#5a2478'], [.45, '#c4466e'], [.68, '#ff8a48'], [.88, '#ffc36a'], [1, '#ffe2a0']]); g.fillRect(0, 0, W, H);
    const r = rng(11);
    // soft streaky clouds lit from below
    for (let i = 0; i < 26; i++) {
      const x = r() * 1300 - 100, y = 200 + r() * 620, w = 160 + r() * 380, h = 10 + r() * 26, a = .14 + r() * .22, col = r() < .5 ? '255,150,120' : '255,205,130';
      g.save(); g.translate(x, y); g.rotate(-.05 + r() * .08); g.scale(w / 100, h / 100);
      g.fillStyle = rad(g, 0, 0, 0, 100, [[0, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]); g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.fill(); g.restore();
    }
    for (let i = 0; i < 9; i++) { const x = r() * 1000, y = 320 + r() * 420; g.fillStyle = `rgba(90,30,110,${.18 + r() * .2})`; g.beginPath(); g.ellipse(x, y, 150 + r() * 200, 8 + r() * 12, -.03, 0, TAU); g.fill(); }
    // sun
    V.glow(g, SUNX, SUNY, 900, 'rgba(255,170,90,.75)', .9); V.glow(g, SUNX, SUNY, 420, 'rgba(255,240,190,.9)', 1);
    g.fillStyle = rad(g, SUNX, SUNY, 0, 118, [[0, '#fffbe8'], [.7, '#ffe9a8'], [1, '#ffcf7a']]); g.beginPath(); g.arc(SUNX, SUNY, 118, 0, TAU); g.fill();
  });
}
function houses(g, y0, seed, colTop, colBot, hMin, hMax, x0 = -20, x1 = 1100, wMin = 24, wMax = 70) {
  const r = rng(seed); let x = x0;
  while (x < x1) {
    const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin);
    g.fillStyle = lin(g, 0, y0 - h, 0, y0, [[0, colTop], [1, colBot]]); g.fillRect(x, y0 - h, w + 1, h + 4);
    if (r() < .55) { g.beginPath(); g.moveTo(x - 2, y0 - h); g.lineTo(x + w / 2, y0 - h - 10 - r() * 16); g.lineTo(x + w + 2, y0 - h); g.closePath(); g.fill(); }
    x += w - 2;
  }
}
// silhouette mosque with dome, semi domes, minarets  (fill = base col)
function mosque(g, cx, base, s, col, rim) {
  const fillG = lin(g, 0, base - 420 * s, 0, base, [[0, col[0]], [1, col[1]]]);
  g.fillStyle = fillG;
  const dome = (x, y, r) => { g.beginPath(); g.moveTo(x - r, y); g.bezierCurveTo(x - r, y - r * 1.15, x + r, y - r * 1.15, x + r, y); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x - r * .12, y - r * .96); g.lineTo(x, y - r * 1.5); g.lineTo(x + r * .12, y - r * .96); g.fill(); };
  g.fillRect(cx - 190 * s, base - 120 * s, 380 * s, 125 * s);
  dome(cx - 135 * s, base - 120 * s, 62 * s); dome(cx + 135 * s, base - 120 * s, 62 * s);
  g.fillRect(cx - 130 * s, base - 180 * s, 260 * s, 62 * s);
  dome(cx, base - 178 * s, 118 * s);
  dome(cx - 72 * s, base - 165 * s, 46 * s); dome(cx + 72 * s, base - 165 * s, 46 * s);
  // minarets
  [[-235, 330], [235, 330], [-330, 250], [330, 250]].forEach(([dx, hh]) => {
    const x = cx + dx * s, h = hh * s;
    g.fillRect(x - 9 * s, base - h, 18 * s, h + 6); g.fillRect(x - 15 * s, base - h * .78, 30 * s, 8 * s); g.fillRect(x - 15 * s, base - h * .62, 30 * s, 8 * s);
    g.beginPath(); g.moveTo(x - 13 * s, base - h); g.lineTo(x, base - h - 62 * s); g.lineTo(x + 13 * s, base - h); g.closePath(); g.fill();
    g.fillRect(x - 1.5, base - h - 84 * s, 3, 24 * s);
  });
  // warm sun rim on the sun-facing edges
  g.save(); g.strokeStyle = rim; g.lineWidth = 3.5; g.globalAlpha = .8;
  g.beginPath(); g.arc(cx, base - 178 * s, 118 * s, -Math.PI * .5, -Math.PI * .05); g.stroke();
  g.beginPath(); g.arc(cx + 135 * s, base - 120 * s, 62 * s, -Math.PI * .55, -Math.PI * .05); g.stroke();
  [-235, 235, -330, 330].forEach((dx, i) => { const x = cx + dx * s; g.beginPath(); g.moveTo(x + 9 * s, base - [330, 330, 250, 250][i] * s); g.lineTo(x + 9 * s, base); g.stroke(); });
  g.restore();
}
function farLayer() {
  return A.layer('v4_far', W, H, g => {
    houses(g, HOR + 6, 21, '#9a4a86', '#d0688a', 30, 90, -20, 1100, 20, 60);
    houses(g, HOR + 4, 22, '#7d3a80', '#b25a86', 24, 70, -20, 1100, 30, 80);
    const r = rng(23);
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,225,150,.55)'; g.fillRect(r() * 1080, HOR - 10 - r() * 60, 3, 4); }
    // haze on far city
    g.fillStyle = lin(g, 0, HOR - 120, 0, HOR + 6, [[0, 'rgba(255,170,100,0)'], [1, 'rgba(255,190,120,.35)']]); g.fillRect(0, HOR - 120, W, 130);
  });
}
function bridgeLayer() {
  return A.layer('v4_bridge', W, H, g => {
    const col = '#4a2160', deck = 866, tw = [250, 800], top = 470;
    g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
    g.lineWidth = 12; g.beginPath(); g.moveTo(-20, deck); g.lineTo(1100, deck); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(-20, deck + 10); g.lineTo(1100, deck + 10); g.stroke();
    tw.forEach(x => {
      g.lineWidth = 20; g.beginPath(); g.moveTo(x - 24, top); g.lineTo(x - 24, deck + 40); g.moveTo(x + 24, top); g.lineTo(x + 24, deck + 40); g.stroke();
      g.lineWidth = 12; [top + 30, top + 130, top + 240].forEach(y => { g.beginPath(); g.moveTo(x - 24, y); g.lineTo(x + 24, y); g.stroke(); });
      V.glow(g, x, top - 6, 40, 'rgba(255,90,70,.9)', .9);
    });
    // cables: side spans + main span (parabola)
    g.lineWidth = 4;
    const cab = (xa, ya, xb, yb, sag) => { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(xa, xb, u), y = lerp(ya, yb, u) + sag * 4 * u * (1 - u); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    [-24, 24].forEach(o => { cab(tw[0] + o, top + 6, tw[1] - o, top + 6, 250); cab(-20, deck - 30, tw[0] + o, top + 6, 60); cab(tw[1] + o, top + 6, 1100, deck - 30, 60); });
    g.lineWidth = 1.6;
    for (let x = -10; x < 1100; x += 20) {
      let y;
      if (x > tw[0] && x < tw[1]) { const u = (x - tw[0]) / (tw[1] - tw[0]); y = top + 6 + 250 * 4 * u * (1 - u); }
      else if (x <= tw[0]) { const u = (x + 20) / (tw[0] + 20); y = lerp(deck - 30, top + 6, u) + 60 * 4 * u * (1 - u); }
      else { const u = (x - tw[1]) / (1100 - tw[1]); y = lerp(top + 6, deck - 30, u) + 60 * 4 * u * (1 - u); }
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, deck); g.stroke();
    }
    // deck lights
    for (let x = 0; x < 1080; x += 36) V.glow(g, x, deck - 8, 14, 'rgba(255,200,120,.9)', .8);
  });
}
function midLayer() {
  return A.layer('v4_mid', W, H, g => {
    houses(g, HOR + 12, 31, '#5a2c66', '#3a1a4e', 40, 140, -20, 1100, 30, 90);
    mosque(g, 210, HOR + 14, 1.05, ['#7a3a80', '#2b1440'], 'rgba(255,200,120,.95)');
    mosque(g, 1000, HOR + 14, .75, ['#54286a', '#2b1440'], 'rgba(255,190,110,.9)');
    // dense hillside houses near, with a few lit windows
    houses(g, HOR + 22, 33, '#2e1645', '#1d0d33', 20, 60, -20, 1100, 26, 70);
    const r = rng(37);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${190 + r() * 50 | 0},110,${.5 + r() * .4})`; g.fillRect(r() * 1080, HOR - 20 + r() * 30, 4, 5); }
    g.fillStyle = '#1a0b2c'; g.fillRect(0, HOR + 14, W, 30);
  });
}
function waterBase() {
  return A.layer('v4_water', W, H, g => {
    g.fillStyle = lin(g, 0, HOR, 0, H, [[0, '#ffb066'], [.05, '#e5708a'], [.22, '#8a3f8e'], [.55, '#3a2270'], [1, '#160f3a']]); g.fillRect(0, HOR, W, H - HOR);
    const r = rng(41);
    for (let i = 0; i < 90; i++) { const y = HOR + 6 + Math.pow(r(), 1.7) * 900, w = 40 + r() * 220 * (1 + (y - HOR) / 500); g.fillStyle = `rgba(255,${170 + r() * 60 | 0},${110 + r() * 60 | 0},${.05 + r() * .08})`; g.fillRect(r() * 1200 - 60, y, w, 1.5 + r() * 3); }
    // sun reflection column
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = lin(g, 0, HOR, 0, HOR + 700, [[0, 'rgba(255,230,160,.85)'], [1, 'rgba(255,150,90,0)']]);
    g.beginPath(); g.moveTo(SUNX - 90, HOR); g.lineTo(SUNX + 90, HOR); g.lineTo(SUNX + 340, HOR + 720); g.lineTo(SUNX - 340, HOR + 720); g.closePath(); g.fill(); g.restore();
  });
}
// composite of silhouettes (used for mirrored reflection)
function silhouettes() {
  return A.layer('v4_sil', W, H, g => { g.drawImage(farLayer(), 0, 0); g.drawImage(bridgeLayer(), 0, 0); g.drawImage(midLayer(), 0, 0); });
}
function ferry(ctx, x, y, s, t, seed = 0) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2.2 + seed) * 3 * s); ctx.rotate(Math.sin(t * 1.6 + seed) * .012); ctx.scale(-s, s);   // faces left
  const body = lin(ctx, 0, -170, 0, 0, [[0, '#ffe9d8'], [.55, '#f1b4b0'], [1, '#c56f92']]);
  // hull
  ctx.fillStyle = lin(ctx, 0, -45, 0, 8, [[0, '#3a2148'], [1, '#170d26']]); ctx.beginPath(); ctx.moveTo(-205, -40); ctx.lineTo(215, -46); ctx.lineTo(190, 6); ctx.lineTo(-170, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d63a3a'; ctx.fillRect(-200, -44, 412, 7);
  // decks
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-190, -98, 380, 54, 8); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-140, -142, 270, 46, 8); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-40, -180, 110, 40, 8); ctx.fill();
  // windows (warm lit)
  for (let i = 0; i < 13; i++) { ctx.fillStyle = '#ffce6b'; ctx.fillRect(-176 + i * 28.5, -88, 17, 20); }
  for (let i = 0; i < 9; i++) { ctx.fillStyle = '#ffd98a'; ctx.fillRect(-126 + i * 29, -132, 17, 18); }
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff0c0'; ctx.fillRect(-32 + i * 26, -170, 16, 16); }
  // rails + chimney
  ctx.strokeStyle = 'rgba(80,40,90,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-190, -102); ctx.lineTo(190, -102); ctx.moveTo(-140, -146); ctx.lineTo(130, -146); ctx.stroke();
  ctx.fillStyle = '#f6dcc8'; ctx.fillRect(-90, -235, 34, 62); ctx.fillStyle = '#d63a3a'; ctx.fillRect(-90, -212, 34, 14); ctx.fillStyle = '#1e1230'; ctx.fillRect(-92, -244, 38, 12);
  ctx.fillStyle = '#1e1230'; ctx.fillRect(20, -206, 4, 30);
  // sun rim
  ctx.strokeStyle = 'rgba(255,220,150,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-190, -98); ctx.lineTo(190, -98); ctx.stroke();
  ctx.restore();
  // smoke drifting back (to the right since ferry goes left)
  for (let i = 0; i < 9; i++) { const k = ((t * .8 + i / 9 + seed) % 1), px = x + (60 * s) + k * 260 * s, py = y - 235 * s - k * 90 * s, r = (16 + k * 46) * s; ctx.fillStyle = `rgba(255,205,190,${.34 * (1 - k)})`; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); }
}
function gull(ctx, x, y, s, flap, tone) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const f = Math.sin(flap) * 26;
  ctx.strokeStyle = tone; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-80, -f * .3 + 10); ctx.quadraticCurveTo(-42, -f - 22, 0, 0); ctx.quadraticCurveTo(42, -f - 22, 80, -f * .3 + 10); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-80, -f * .3 + 10); ctx.quadraticCurveTo(-46, -f * .6 - 4, 0, 6); ctx.quadraticCurveTo(46, -f * .6 - 4, 80, -f * .3 + 10); ctx.stroke();
  ctx.fillStyle = tone; ctx.beginPath(); ctx.ellipse(0, 4, 16, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(14, 0, 6, 0, TAU); ctx.fill();
  ctx.restore();
}
function tulipFlower(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const petal = (a, sc, c1, c2) => { g.save(); g.rotate(a); g.scale(sc, 1); g.fillStyle = lin(g, 0, -170, 0, 0, [[0, c1], [1, c2]]); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-58, -22, -66, -128, 0, -172); g.bezierCurveTo(66, -128, 58, -22, 0, 0); g.fill(); g.restore(); };
  petal(-.42, .92, '#ff5e4a', '#a4102a'); petal(.42, .92, '#ff5e4a', '#a4102a'); petal(0, 1, '#ff7a5a', '#c31534');
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(-20, -30); g.bezierCurveTo(-34, -80, -20, -130, -6, -150); g.bezierCurveTo(-8, -110, -6, -60, -20, -30); g.fill();
  g.strokeStyle = 'rgba(255,215,140,.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(36, -44); g.bezierCurveTo(56, -80, 38, -130, 4, -166); g.stroke();
  g.restore();
}
function fgTulips() {
  return A.layer('v4_tulips', W, H, g => {
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const q = tmp.getContext('2d');
    const stem = (x0, y0, x1, y1, w) => { q.strokeStyle = lin(q, x0, y0, x1, y1, [[0, '#9ad35a'], [1, '#1f6b2f']]); q.lineWidth = w; q.lineCap = 'round'; q.beginPath(); q.moveTo(x0, y0); q.quadraticCurveTo((x0 + x1) / 2 - 30, (y0 + y1) / 2, x1, y1); q.stroke(); };
    // leaves
    q.fillStyle = lin(q, 0, 1000, 0, 1920, [[0, '#7cc44a'], [1, '#1b5a2a']]);
    [[120, 1600, -.5], [330, 1500, .6], [40, 1450, -.2]].forEach(([x, y, r]) => { q.save(); q.translate(x, y); q.rotate(r); q.beginPath(); q.moveTo(0, 0); q.bezierCurveTo(-40, -200, -20, -420, 30, -560); q.bezierCurveTo(80, -360, 60, -160, 0, 0); q.fill(); q.restore(); });
    stem(160, 1980, 130, 1010, 22); stem(300, 1990, 320, 1060, 20); stem(30, 1990, 50, 1150, 18);
    tulipFlower(q, 130, 1030, 1.55, -.08); tulipFlower(q, 322, 1082, 1.15, .18); tulipFlower(q, 50, 1170, 1.0, -.2);
    g.save(); g.filter = 'blur(2.5px)'; g.drawImage(tmp, 0, 0); g.restore();
  });
}
function teaGlass(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // saucer
  ctx.fillStyle = 'rgba(30,10,30,.45)'; ctx.beginPath(); ctx.ellipse(0, 22, 175, 30, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 0, 0, 30, [[0, '#fff6e8'], [1, '#d9a878']]); ctx.beginPath(); ctx.ellipse(0, 8, 160, 27, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 8, 160, 27, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#d08a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 6, 112, 17, 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.arc(Math.cos(a) * 136, 8 + Math.sin(a) * 22, 2.6, 0, TAU); ctx.fill(); }
  // spoon
  ctx.strokeStyle = '#f0d9a8'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(80, 12); ctx.lineTo(178, -14); ctx.stroke();
  // glass body
  const gp = () => { ctx.beginPath(); ctx.moveTo(-68, -240); ctx.bezierCurveTo(-64, -195, -44, -160, -44, -120); ctx.bezierCurveTo(-44, -74, -60, -34, -58, 0); ctx.lineTo(58, 0); ctx.bezierCurveTo(60, -34, 44, -74, 44, -120); ctx.bezierCurveTo(44, -160, 64, -195, 68, -240); ctx.closePath(); };
  gp(); ctx.fillStyle = 'rgba(255,225,190,.18)'; ctx.fill();
  ctx.save(); gp(); ctx.clip();
  ctx.fillStyle = lin(ctx, -68, 0, 68, 0, [[0, '#7a1c10'], [.35, '#e0591c'], [.62, '#ffab3a'], [1, '#a5310f']]); ctx.fillRect(-80, -212, 160, 230);
  ctx.fillStyle = lin(ctx, 0, -212, 0, -160, [[0, 'rgba(255,220,130,.85)'], [1, 'rgba(255,180,60,0)']]); ctx.fillRect(-80, -212, 160, 52);
  // light glow through tea
  V.glow(ctx, 20, -110, 90, 'rgba(255,190,90,.7)', .8);
  ctx.restore();
  // rim highlights
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-54, -210); ctx.bezierCurveTo(-44, -170, -32, -140, -32, -110); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(48, -200); ctx.bezierCurveTo(40, -160, 34, -130, 34, -104); ctx.stroke();
  gp(); ctx.strokeStyle = 'rgba(255,240,220,.55)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#f0b850'; ctx.fillRect(-69, -244, 138, 6);
  ctx.fillStyle = 'rgba(255,210,120,.9)'; ctx.beginPath(); ctx.ellipse(0, -240, 68, 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffe6a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -240, 68, 11, 0, 0, TAU); ctx.stroke();
  // steam
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(255,236,214,${.32 - i * .05})`; ctx.lineWidth = 14 - i * 3; ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k <= 24; k++) { const v = k / 24, xx = (i - 1) * 32 + Math.sin(v * 7 + t * 3 + i * 2) * (14 + v * 26), yy = -250 - v * 230; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBos(ctx, t) {
  const u = t - S0, p = clamp(u / .55);
  const zz = 1 + .11 * eo(p) + .015 * u;
  const cam = (k, ox = 0, oy = 0) => { ctx.translate(SUNX * .6 + 540 * .4 + ox, HOR + oy); ctx.scale(k, k); ctx.translate(-(SUNX * .6 + 540 * .4), -HOR); };
  const L = (img, k, ox = 0) => { ctx.save(); cam(k, ox); ctx.drawImage(img, 0, 0); ctx.restore(); };
  L(skyLayer(), 1 + (zz - 1) * .25);
  // god rays
  add(ctx, () => { ctx.save(); cam(1 + (zz - 1) * .25); V.beams(ctx, SUNX, SUNY, t * .8, 'rgba(255,215,140,1)', 9, 1500, 3.2, .11); ctx.restore(); });
  L(farLayer(), 1 + (zz - 1) * .45);
  L(bridgeLayer(), 1 + (zz - 1) * .6);
  // far ferry
  ctx.save(); cam(1 + (zz - 1) * .7); ferry(ctx, 420 + u * -14, HOR + 30, .32, t, 3); ctx.restore();
  L(midLayer(), 1 + (zz - 1) * .85);
  // water + reflection
  ctx.save(); cam(zz);
  ctx.drawImage(waterBase(), 0, 0);
  const sil = silhouettes(), n = 46, hh = 22;
  ctx.globalAlpha = .34;
  for (let i = 0; i < n; i++) {
    const y = HOR + 12 + i * hh * .95, sy = HOR + 12 - (i * hh * .95) * .9 * 1; if (sy < HOR - 460) break;
    const wob = Math.sin(i * .9 + t * 3.2) * (3 + i * .35);
    ctx.globalAlpha = .38 * (1 - i / n);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, hh); ctx.clip(); ctx.translate(wob, 0); ctx.transform(1, 0, 0, -1, 0, 2 * (HOR + 12)); ctx.drawImage(sil, 0, 0); ctx.restore();
  }
  ctx.globalAlpha = 1;
  // glitter
  add(ctx, () => {
    for (let i = 0; i < 170; i++) {
      const d = Math.pow(hash(i * 3.1), 1.5), y = HOR + 8 + d * 780, spread = 70 + d * 420, x = SUNX + (hash(i * 7.7) - .5) * 2 * spread, tw = .5 + .5 * Math.sin(t * (6 + hash(i) * 8) + i * 9);
      ctx.globalAlpha = tw * (1 - d * .8) * .9; ctx.fillStyle = '#ffe9b0'; ctx.fillRect(x, y, 10 + d * 60, 1.5 + d * 3);
    }
  });
  // ferry (mid), bobbing, with wake
  const fx = lerp(700, 430, clamp(u / .9)) , fy = 1040;
  ctx.save(); ctx.globalAlpha = .28; ctx.translate(0, 2 * (fy + 6)); ctx.scale(1, -1); ferry(ctx, fx, fy, 1, t, 1); ctx.restore();
  ferry(ctx, fx, fy, 1, t, 1);
  ctx.strokeStyle = 'rgba(255,240,230,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { ctx.globalAlpha = .55 - i * .08; ctx.beginPath(); ctx.moveTo(fx + 180 + i * 6, fy + 4 + i * 5); ctx.lineTo(fx + 420 + i * 60, fy + 12 + i * 12); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.restore();
  // gulls (dark silhouettes with warm rim)
  const gulls = [[-200, 420, .9, 190, 0], [-420, 330, .6, 150, 2], [-100, 610, .5, 120, 4], [1500, 480, 1.2, -170, 6], [1300, 700, .7, -130, 8], [-300, 250, 1.6, 260, 10]];
  gulls.forEach(([x0, y0, s, v, sd]) => { const x = x0 + v * u * 1.2 + (v > 0 ? 400 : -300) * 0 + 300 * (v > 0 ? 1 : -1) * 0, y = y0 + Math.sin(t * 1.3 + sd) * 16 - u * 20; gull(ctx, x + (v > 0 ? 300 : -300) * 0 + 0, y, s * (v < 0 ? -1 : 1) * 1 * (Math.abs(s) > 1.4 ? 1 : 1), t * 11 + sd, s > 1.4 ? 'rgba(45,20,60,.85)' : '#3a1d4d'); });
  // foreground: tulips (blurred, big parallax) + tea glass
  ctx.save(); ctx.translate(-40 * (1 - eo(p)) + 20 * u, 0); ctx.scale(1 + (zz - 1) * 1.3, 1 + (zz - 1) * 1.3); ctx.drawImage(fgTulips(), 0, -1920 * (zz - 1) * 1.3 * .4); ctx.restore();
  teaGlass(ctx, 850, 1150 + (zz - 1) * 200, 1.05 * (1 + (zz - 1) * .8), t);
  // warm grade + gold dust
  add(ctx, () => { const r = rng(5); for (let i = 0; i < 26; i++) { const x = (r() * 1200 + t * 20 * (r() + .2)) % 1200 - 60, y = (r() * 1900 - t * 40 * (r() + .3) + 3800) % 1900, s = 2 + r() * 4; ctx.globalAlpha = .5 * (.5 + .5 * Math.sin(t * 5 + i)); ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); } });
  // lens flare from sun
  add(ctx, () => { const fx2 = 540 + (SUNX - 540) * -.55, fy2 = 960 + (SUNY - 960) * -.55; V.glow(ctx, fx2, fy2, 140, 'rgba(255,170,90,.6)', .5); V.glow(ctx, 540 - (SUNX - 540) * .8, 960 - (SUNY - 960) * .8, 80, 'rgba(255,120,160,.6)', .5); });
  // vignette
  ctx.fillStyle = rad(ctx, 540, 900, 500, 1250, [[0, 'rgba(20,4,30,0)'], [1, 'rgba(20,4,30,.62)']]); ctx.fillRect(0, 0, W, H);
}
// ---------- soap-opera close-up ----------
// profile faces, local coords: eye level y=0, nose points +x
const FACE = [[20, -172], [42, -140], [50, -90], [48, -40], [36, -12], [50, 20], [82, 58], [112, 88], [114, 100], [86, 108], [62, 112], [66, 128], [70, 142], [56, 156], [64, 170], [60, 190], [48, 204], [58, 222], [46, 238], [10, 246],
  [-40, 232], [-70, 250], [-66, 400], [-190, 400], [-176, 250], [-262, 130], [-312, -10], [-300, -140], [-200, -250], [-70, -250], [-10, -215]];
const FRONT = FACE.slice(0, 20);
function profile(g, o) {   // o: {skin:[back,mid,front], rim, hair:'w'|'m', lips, wet}
  g.save();
  g.beginPath(); A.blob(g, FACE, true);
  g.fillStyle = lin(g, -300, 0, 120, 0, [[0, o.skin[0]], [.5, o.skin[1]], [1, o.skin[2]]]); g.fill();
  g.save(); g.clip();
  // shadow under jaw + neck + cheek modelling
  g.fillStyle = lin(g, 0, 200, 0, 330, [[0, 'rgba(30,5,15,.75)'], [1, 'rgba(30,5,15,0)']]); g.fillRect(-300, 200, 400, 200);
  V.glow(g, 20, 70, 130, o.blush, .55);
  g.fillStyle = lin(g, -300, 0, 60, 0, [[0, 'rgba(30,5,20,.55)'], [.6, 'rgba(30,5,20,0)']]); g.fillRect(-320, -260, 420, 700);
  g.restore();
  // rim light along front edge
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); A.blob(g, FRONT, false); g.strokeStyle = o.rim; g.lineWidth = 16; g.globalAlpha = .28; g.stroke(); g.lineWidth = 7; g.globalAlpha = .6; g.stroke(); g.lineWidth = 2.5; g.globalAlpha = 1; g.strokeStyle = '#fff6e0'; g.stroke();
  g.restore();
  // lips
  g.beginPath(); A.blob(g, [[62, 126], [72, 136], [72, 146], [58, 155], [66, 170], [58, 182], [46, 168], [42, 148], [46, 132]], true);
  g.fillStyle = o.lips; g.fill(); g.strokeStyle = 'rgba(60,5,20,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(42, 152); g.quadraticCurveTo(52, 158, 60, 155); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(62, 132, 6, 3, .4, 0, TAU); g.fill();
  // nostril
  g.fillStyle = 'rgba(60,15,25,.65)'; g.beginPath(); g.ellipse(88, 100, 9, 4.5, .35, 0, TAU); g.fill();
  // ear
  g.fillStyle = lin(g, -130, 0, -80, 0, [[0, o.skin[0]], [1, o.skin[1]]]); g.beginPath(); g.ellipse(-108, 30, 27, 52, .12, 0, TAU); g.fill(); g.strokeStyle = 'rgba(60,15,25,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(-104, 30, 14, 34, .12, 0, TAU); g.stroke();
  // brow
  g.strokeStyle = o.brow; g.lineCap = 'round'; g.lineWidth = 12; g.beginPath(); g.moveTo(22, -40); g.quadraticCurveTo(56, -58, 80, -40); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(52, -50); g.quadraticCurveTo(66, -54, 82, -42); g.stroke();
  g.restore();
}
function eye(g, wet, lash) {
  g.save(); g.translate(56, -4);
  g.beginPath(); g.moveTo(-26, 2); g.quadraticCurveTo(-4, -18, 24, -5); g.quadraticCurveTo(4, 12, -26, 2); g.closePath(); g.fillStyle = '#fff2ea'; g.fill();
  g.save(); g.clip(); g.fillStyle = rad(g, 10, -2, 1, 14, [[0, '#0e0605'], [.45, '#3b1a0e'], [1, '#160a06']]); g.beginPath(); g.ellipse(11, -3, 11.5, 14, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(15, -8, 3.6, 0, TAU); g.fill(); g.beginPath(); g.arc(7, 1, 1.8, 0, TAU); g.fill();
  if (wet) { g.fillStyle = `rgba(140,210,255,${.5 * wet})`; g.fillRect(-30, 3, 60, 10); g.fillStyle = `rgba(255,255,255,${.9 * wet})`; g.beginPath(); g.ellipse(0, 6, 22, 3, 0, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = '#120608'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26, 2); g.quadraticCurveTo(-4, -18, 24, -5); g.stroke();
  g.lineWidth = 2.6; g.beginPath(); g.moveTo(-26, 2); g.quadraticCurveTo(4, 12, 24, -3); g.stroke();
  if (lash) { g.lineWidth = 3.4; [[16, -8, 40, -22], [22, -5, 46, -12], [8, -12, 28, -30], [-4, -14, 8, -34]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c - 4, d + 8, c, d); g.stroke(); }); }
  g.restore();
}
function hairWoman(g) {
  const pts = [[34, -186], [-30, -278], [-190, -300], [-340, -200], [-392, 0], [-396, 210], [-340, 420], [-230, 440], [-214, 300], [-196, 150], [-170, 50], [-120, -50], [-30, -104], [16, -138]];
  g.save(); g.beginPath(); A.blob(g, pts, true);
  g.fillStyle = lin(g, -400, -300, 60, 300, [[0, '#0d0508'], [.5, '#2a0d12'], [1, '#160608']]); g.fill();
  g.clip();
  g.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const y0 = -280 + i * 32; g.strokeStyle = `rgba(255,${170 + i * 3},${110 + i * 4},${.13 + .11 * hash(i)})`; g.lineWidth = 2 + hash(i + 3) * 4; g.beginPath(); g.moveTo(-40 - i * 8, y0); g.bezierCurveTo(-200 - i * 4, y0 - 30, -330 + i * 6, y0 + 20, -370 + i * 4, y0 + 220 + i * 4); g.stroke(); }
  g.fillStyle = lin(g, 0, -300, 0, -100, [[0, 'rgba(255,190,130,.35)'], [1, 'rgba(255,190,130,0)']]); g.fillRect(-400, -300, 460, 240);
  g.restore();
}
function hairMan(g) {
  const pts = [[44, -146], [18, -246], [-100, -294], [-250, -264], [-322, -140], [-334, 10], [-300, 40], [-262, -50], [-170, -106], [-60, -122], [12, -108]];
  g.save(); g.beginPath(); A.blob(g, pts, true); g.fillStyle = lin(g, -300, -300, 60, -60, [[0, '#0a0c14'], [1, '#1c2030']]); g.fill(); g.clip();
  g.lineCap = 'round'; for (let i = 0; i < 20; i++) { g.strokeStyle = `rgba(150,190,255,${.08 + .12 * hash(i + 5)})`; g.lineWidth = 2 + hash(i) * 3; g.beginPath(); g.moveTo(30 - i * 4, -200 + i * 3); g.quadraticCurveTo(-100 - i * 8, -290 + i * 5, -300 + i * 4, -200 + i * 6); g.stroke(); }
  g.restore();
  // stubble
  g.save(); g.beginPath(); A.blob(g, FACE, true); g.clip(); const r = rng(9); g.fillStyle = 'rgba(15,10,20,.32)'; for (let i = 0; i < 260; i++) { const x = -90 + r() * 150, y = 120 + r() * 140; g.fillRect(x, y, 2, 2); } g.restore();
}
function soapBackground() {
  return A.layer('v4_soapbg', W, H, g => {
    g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#14030c'], [.5, '#4a0918'], [1, '#12030a']]); g.fillRect(0, 0, W, H);
    V.glow(g, 540, 700, 900, 'rgba(230,50,70,.75)', 1); V.glow(g, 540, 640, 480, 'rgba(255,190,110,.55)', 1);
    // draped curtain folds
    for (let i = 0; i < 14; i++) { const x = i * 84 - 20; g.fillStyle = i % 2 ? 'rgba(120,10,30,.25)' : 'rgba(10,0,5,.25)'; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 30, 500, x - 30, 1200, x + 20, 1920); g.lineTo(x + 84, 1920); g.bezierCurveTo(x + 50, 1200, x + 110, 500, x + 84, 0); g.fill(); }
    // spotlight cone
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lin(g, 0, 0, 0, 1100, [[0, 'rgba(255,200,140,.22)'], [1, 'rgba(255,200,140,0)']]); g.beginPath(); g.moveTo(400, 0); g.lineTo(680, 0); g.lineTo(1000, 1100); g.lineTo(80, 1100); g.closePath(); g.fill(); g.restore();
  });
}
function soapChars() {
  // both heads + shoulders, cached (eyes/tear animated separately)
  return A.layer('v4_soapfaces', W, H, g => {
    const SC = 1.0;
    const draw = (cx, cy, mirror, o) => {
      g.save(); g.translate(cx, cy); g.scale(mirror ? -SC : SC, SC);
      // body first
      g.fillStyle = o.body; g.beginPath(); g.moveTo(-320, 430); g.bezierCurveTo(-300, 340, -140, 300, -60, 290); g.lineTo(60, 300); g.bezierCurveTo(180, 320, 260, 400, 300, 560); g.lineTo(-330, 560); g.closePath(); g.fill();
      g.fillStyle = o.collar; g.beginPath(); g.moveTo(-70, 292); g.lineTo(-10, 400); g.lineTo(70, 300); g.lineTo(20, 270); g.closePath(); g.fill();
      if (o.hairFirst) o.hairFn(g);
      profile(g, o);
      eye(g, 0, o.lash);
      if (!o.hairFirst) o.hairFn(g);
      g.restore();
    };
    draw(290, 700, false, { skin: ['#5a2a2a', '#c98a72', '#f0b090'], rim: '#ffd39a', blush: 'rgba(255,90,100,.6)', lips: '#a80c2c', brow: '#1a0a0a', lash: true, hairFn: hairWoman, hairFirst: false, body: lin(g, 0, 0, 0, 1, [[0, '#7a0c26'], [1, '#3a0614']]), collar: '#a41232' });
    draw(790, 720, true, { skin: ['#3a2530', '#a87a70', '#dcaa92'], rim: '#9fd0ff', blush: 'rgba(200,90,80,.35)', lips: '#a8564c', brow: '#0c0a10', lash: false, hairFn: hairMan, hairFirst: false, body: '#10141f', collar: '#f2ecf0' });
    // bottom fade
    g.fillStyle = lin(g, 0, 1000, 0, 1300, [[0, 'rgba(10,2,6,0)'], [1, 'rgba(10,2,6,.95)']]); g.fillRect(0, 1000, W, 400);
  });
}
function drawSoap(ctx, t) {
  const u = t - T_SOAP;
  const b1 = kick(t, 13.72, 20), b2 = kick(t, 13.84, 22), b3 = kick(t, 13.945, 22);
  const beat = Math.max(b1, b2 * .8, b3 * .95);
  const punch = 1.32 - .32 * eo(u / .18);
  const z = punch * (1 + .03 * u / .38 + .07 * beat);
  ctx.save(); ctx.translate(540, 700); ctx.scale(z, z); ctx.translate(-540, -700);
  ctx.drawImage(soapBackground(), 0, 0);
  // drifting embers
  add(ctx, () => { const r = rng(2); for (let i = 0; i < 40; i++) { const x = r() * 1080, y = (r() * 1900 - t * 90 * (r() + .3) + 3800) % 1900, s = 2 + r() * 5; ctx.globalAlpha = .6 * (.5 + .5 * Math.sin(t * 6 + i)); ctx.fillStyle = '#ffb877'; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); } });
  // faces slide together (whip-close) then push a hair closer
  const sl = eo(u / .2), dx = 90 * (1 - sl) - 22 * Math.min(1, u / .38);
  ctx.save(); ctx.translate(-dx, 0); ctx.globalAlpha = 1; ctx.drawImage(soapChars(), 0, 0, 540 + 1, 1920, 0, 0, 541, 1920); ctx.restore();
  ctx.save(); ctx.translate(dx, 0); ctx.drawImage(soapChars(), 540, 0, 540, 1920, 540, 0, 540, 1920); ctx.restore();
  // animated: tear on woman (eye at world ~ (300+56*1.18, 640-4*1.18)), wet shine
  const SC = 1.0, wx = 290 - dx, wy = 700;
  const ex = wx + 56 * SC + 4, ey = wy - 4 * SC;
  const wet = eo(u / .15);
  add(ctx, () => { V.glow(ctx, ex, ey + 6, 60, 'rgba(160,220,255,.6)', .6 * wet); });
  const tp = A.smooth(.10, .36, u);
  const tx = (v) => wx + (46 - 34 * v) * SC, ty = (v) => wy + (14 + 190 * v) * SC;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(190,230,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); for (let k = 1; k <= 20; k++) { const v = tp * k / 20; ctx.lineTo(tx(v), ty(v)); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.2; ctx.stroke();
  const dxp = tx(tp), dyp = ty(tp);
  ctx.fillStyle = rad(ctx, dxp - 3, dyp - 4, 1, 16, [[0, '#ffffff'], [.5, 'rgba(180,225,255,.9)'], [1, 'rgba(120,180,240,.7)']]);
  ctx.beginPath(); ctx.moveTo(dxp, dyp - 22); ctx.bezierCurveTo(dxp + 15, dyp - 2, dxp + 14, dyp + 14, dxp, dyp + 15); ctx.bezierCurveTo(dxp - 14, dyp + 14, dxp - 15, dyp - 2, dxp, dyp - 22); ctx.fill();
  V.glow(ctx, dxp, dyp, 46, 'rgba(180,230,255,.9)', .8 * (u > .1 ? 1 : 0));
  ctx.restore();
  // heartbeat vignette + red pulse
  ctx.restore();
  ctx.fillStyle = rad(ctx, 540, 760, 380, 1150, [[0, 'rgba(0,0,0,0)'], [1, `rgba(10,0,4,${.6 - .15 * beat})`]]); ctx.fillRect(0, 0, W, H);
  add(ctx, () => { ctx.fillStyle = `rgba(255,50,70,${.20 * beat})`; ctx.fillRect(0, 0, W, H); });
  // falling rose petals (foreground, blurred)
  for (let i = 0; i < 8; i++) { const x = (hash(i * 3) * 1300 + t * 60 * (.3 + hash(i))) % 1300 - 110, y = (hash(i * 5) * 2000 + t * 240 * (.6 + hash(i + 1))) % 2100 - 100, s = 22 + hash(i + 9) * 34, a = t * 3 + i; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(1, .6 + .4 * Math.sin(a * 1.7)); ctx.fillStyle = lin(ctx, 0, -s, 0, s, [[0, '#ff4a5e'], [1, '#8d0a22']]); ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s, -s * .3, s * .7, s, 0, s); ctx.bezierCurveTo(-s * .7, s, -s, -s * .3, 0, -s); ctx.fill(); ctx.restore(); }
}
// ---------- ornamental title (Turkish) ----------
function ornFrame(ctx, cx, cy, w, h, a) {
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = a;
  const x = w / 2, y = h / 2, c = 34;
  const path = () => { ctx.beginPath(); ctx.moveTo(-x + c, -y); ctx.lineTo(-40, -y); ctx.quadraticCurveTo(0, -y - 44, 40, -y); ctx.lineTo(x - c, -y); ctx.quadraticCurveTo(x, -y, x, -y + c); ctx.lineTo(x, y - c); ctx.quadraticCurveTo(x, y, x - c, y); ctx.lineTo(40, y); ctx.quadraticCurveTo(0, y + 44, -40, y); ctx.lineTo(-x + c, y); ctx.quadraticCurveTo(-x, y, -x, y - c); ctx.lineTo(-x, -y + c); ctx.quadraticCurveTo(-x, -y, -x + c, -y); ctx.closePath(); };
  path(); ctx.fillStyle = 'rgba(60,4,22,.78)'; ctx.fill();
  ctx.save(); path(); ctx.clip(); ctx.fillStyle = lin(ctx, 0, -y, 0, y, [[0, 'rgba(255,255,255,.16)'], [.5, 'rgba(255,255,255,0)']]); ctx.fillRect(-x, -y, w, h); ctx.restore();
  const gold = lin(ctx, -x, -y, x, y, [[0, '#FFF3C4'], [.4, '#FFC24A'], [.7, '#E48A12'], [1, '#FFE08A']]);
  path(); ctx.strokeStyle = gold; ctx.lineWidth = 7; ctx.shadowColor = 'rgba(255,190,80,.8)'; ctx.shadowBlur = 24; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.save(); ctx.scale(1 - 26 / w, 1 - 26 / h); path(); ctx.restore(); ctx.strokeStyle = 'rgba(255,215,130,.85)'; ctx.lineWidth = 2.5; ctx.save(); ctx.scale(1 - 26 / w, 1 - 26 / h); path(); ctx.stroke(); ctx.restore();
  // corner arabesque curls + diamonds
  ctx.strokeStyle = gold; ctx.fillStyle = gold; ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { ctx.save(); ctx.translate(sx * (x - 14), sy * (y - 14)); ctx.scale(sx, sy);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-4, 40, 24, 62, 46, 48); ctx.bezierCurveTo(30, 44, 22, 30, 30, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(40, -4, 62, 24, 48, 46); ctx.stroke();
    ctx.beginPath(); ctx.arc(16, 16, 5, 0, TAU); ctx.fill(); ctx.restore(); });
  [[-1], [1]].forEach(([s]) => { ctx.save(); ctx.translate(s * (x - 4), 0); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore(); });
  // top crest: tulip
  ctx.save(); ctx.translate(0, -y - 22); ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-24, 6, -22, -22, 0, -30); ctx.bezierCurveTo(22, -22, 24, 6, 0, 12); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  ctx.restore();
}
function ornTitle(ctx, t, str, t0, cy, frameFn) {
  const u = t - t0; if (u < 0) return;
  const s = .55 + .45 * eob(u / .2), a = clamp(u / .06);
  const fs = fitSize(ctx, str, 128, 780);
  ctx.save(); ctx.translate(540, cy); ctx.scale(s, s); ctx.translate(-540, -cy);
  frameFn(ctx, 540, cy, 900, fs * 1.55, a);
  ctx.globalAlpha = a;
  V.text(ctx, str, 540, cy + 6, fs, { grad: V.GOLD_GRAD, stroke: '#5a0a1a', shadowCol: 'rgba(40,0,10,.8)' });
  // gold shine sweep
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = lerp(-200, 1300, clamp((u - .08) / .35)); ctx.fillStyle = lin(ctx, sx - 80, 0, sx + 80, 0, [[0, 'rgba(255,240,200,0)'], [.5, 'rgba(255,240,200,.55)'], [1, 'rgba(255,240,200,0)']]); ctx.beginPath(); ctx.rect(90, cy - fs, 900, fs * 2); ctx.clip(); ctx.fillRect(0, cy - fs, W, fs * 2); ctx.restore();
  ctx.restore();
}
function segTurk(ctx, t) {
  if (t < T_SOAP) drawBos(ctx, t); else drawSoap(ctx, t);
  const beat = Math.max(kick(t, 13.72, 20), kick(t, 13.84, 22) * .8, kick(t, 13.945, 22) * .95);
  ctx.save(); ctx.translate(540, 300); const sc = 1 + .045 * beat; ctx.scale(sc, sc); ctx.translate(-540, -300);
  ornTitle(ctx, t, 'סדרות תורכיות', 13.30, 300, ornFrame);
  ctx.restore();
  // sting flash into the close-up
  V.flash(ctx, t, T_SOAP, .22, '#fff2d8', .95);
  V.flash(ctx, t, 13.72, .1, '#ff8a70', .25);
}
//@@PART_C
// =====================================================================================================
// B) KOREAN  neon rainy Seoul night
// =====================================================================================================
const PINK = '#ff5fb0', CYAN = '#4fe6ff', VIO = '#9b6bff', STREET = 1010;
// hangul as vector strokes in a 0..1 cell.  {p:[[x,y]...]} polyline, {c:[cx,cy,r]} circle
const HG = {
  '사': [{ p: [[.30, .28], [.06, .74]] }, { p: [[.24, .48], [.44, .74]] }, { p: [[.74, .04], [.74, .96]] }, { p: [[.74, .46], [.96, .46]] }],
  '랑': [{ p: [[.08, .06], [.46, .06], [.46, .22], [.08, .22], [.08, .38], [.46, .38]] }, { p: [[.76, .02], [.76, .56]] }, { p: [[.76, .27], [.97, .27]] }, { c: [.5, .79, .16] }],
  '안': [{ c: [.28, .24, .17] }, { p: [[.76, .02], [.76, .56]] }, { p: [[.76, .27], [.97, .27]] }, { p: [[.2, .66], [.2, .94], [.84, .94]] }],
  '녕': [{ p: [[.12, .08], [.12, .42], [.46, .42]] }, { p: [[.76, .02], [.76, .58]] }, { p: [[.76, .2], [.97, .2]] }, { p: [[.76, .38], [.97, .38]] }, { c: [.5, .8, .15] }],
};
function hangulPath(g, ch, x, y, w, h) {
  g.beginPath();
  HG[ch].forEach(s => {
    if (s.c) { g.moveTo(x + (s.c[0] + s.c[2]) * w, y + s.c[1] * h); g.ellipse(x + s.c[0] * w, y + s.c[1] * h, s.c[2] * w, s.c[2] * h, 0, 0, TAU); }
    else s.p.forEach(([px, py], i) => i ? g.lineTo(x + px * w, y + py * h) : g.moveTo(x + px * w, y + py * h));
  });
}
function neonText(g, str, x, y, cw, ch, col, a = 1, gap = 1.1) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  [...str].forEach((c, i) => {
    const px = x + i * cw * gap;
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = col; g.globalAlpha = .10 * a; g.lineWidth = cw * .26; hangulPath(g, c, px, y, cw, ch); g.stroke();
    g.globalAlpha = .28 * a; g.lineWidth = cw * .13; g.stroke();
    g.globalAlpha = .9 * a; g.lineWidth = cw * .06; g.stroke();
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#fff'; g.globalAlpha = a; g.lineWidth = cw * .022; g.stroke();
  });
  g.restore();
}
function seoulCity() {
  return A.layer('v4_seoul', W, H, g => {
    g.fillStyle = lin(g, 0, 0, 0, STREET, [[0, '#07051c'], [.55, '#1a0d45'], [.85, '#3a1466'], [1, '#5a1c78']]); g.fillRect(0, 0, W, H);
    V.glow(g, 540, 940, 700, 'rgba(255,90,190,.5)', 1); V.glow(g, 200, 700, 500, 'rgba(70,200,255,.32)', 1);
    const r = rng(77);
    // far towers
    for (let i = 0; i < 16; i++) { const x = i * 70 - 20, h = 250 + r() * 520, w = 60 + r() * 30; g.fillStyle = lin(g, 0, STREET - h, 0, STREET, [[0, '#1a1050'], [1, '#2a1560']]); g.fillRect(x, STREET - h, w, h); for (let k = 0; k < 40; k++) { if (r() < .5) { g.fillStyle = r() < .5 ? 'rgba(255,120,200,.6)' : 'rgba(110,220,255,.55)'; g.fillRect(x + 6 + (r() * (w - 14)) | 0, STREET - h + 10 + r() * (h - 20), 5, 7); } } }
    // near buildings with lit window grids
    [[-30, 330, 260], [250, 200, 380], [520, 240, 300], [780, 350, 430]].forEach(([x, w, h], i) => {
      g.fillStyle = lin(g, 0, STREET - h, 0, STREET, [[0, '#120a34'], [1, '#0a0620']]); g.fillRect(x, STREET - h, w, h);
      g.strokeStyle = i % 2 ? 'rgba(255,95,176,.55)' : 'rgba(79,230,255,.5)'; g.lineWidth = 3; g.strokeRect(x, STREET - h, w, h);
      for (let yy = STREET - h + 30; yy < STREET - 30; yy += 34) for (let xx = x + 16; xx < x + w - 24; xx += 30) if (r() < .45) { g.fillStyle = r() < .5 ? 'rgba(255,190,230,.75)' : r() < .5 ? 'rgba(160,240,255,.7)' : 'rgba(255,235,170,.7)'; g.fillRect(xx, yy, 16, 20); }
    });
    // sign boards (frames) behind neon text
    g.fillStyle = 'rgba(10,4,30,.9)'; A.rrect(g, 20, 400, 610, 300, 26); g.fill(); g.strokeStyle = 'rgba(255,95,176,.9)'; g.lineWidth = 6; g.stroke();
    g.fillStyle = 'rgba(10,4,30,.9)'; A.rrect(g, 660, 430, 380, 210, 22); g.fill(); g.strokeStyle = 'rgba(79,230,255,.9)'; g.lineWidth = 6; g.stroke();
    // small vertical signs
    [[70, 720, PINK, '랑'], [960, 700, VIO, '사']].forEach(([x, y, c, ch]) => { g.fillStyle = 'rgba(10,4,30,.95)'; A.rrect(g, x - 34, y - 8, 90, 130, 12); g.fill(); g.strokeStyle = c; g.lineWidth = 4; g.stroke(); });
    // street
    g.fillStyle = lin(g, 0, STREET, 0, H, [[0, '#1c0f3f'], [.3, '#0e0824'], [1, '#05030f']]); g.fillRect(0, STREET, W, H - STREET);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, STREET, W, 3);
  });
}
function seoulSigns(g, t, a = 1) {
  const fl = k => .78 + .22 * Math.sin(t * 31 + k * 5) * (hash(Math.floor(t * 14) + k) > .82 ? 1.6 : .25);
  neonText(g, '사랑', 62, 448, 250, 200, PINK, fl(1), 1.03);
  neonText(g, '안녕', 690, 470, 158, 150, CYAN, fl(2), 1.04);
  neonText(g, '랑', 82, 734, 50, 90, PINK, fl(3), 1); neonText(g, '사', 972, 714, 50, 90, VIO, fl(4), 1);
}
function umbrella(ctx, cx, cy, t) {
  const rx = 320, ry = 130;
  ctx.save(); ctx.translate(cx, cy);
  // pole
  ctx.strokeStyle = '#2a1a4a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -ry); ctx.lineTo(0, 150); ctx.stroke();
  // canopy
  const scallop = () => { ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.ellipse(0, 0, rx, ry, 0, Math.PI, TAU); for (let i = 5; i >= 0; i--) { const x0 = -rx + (i + 1) * rx * 2 / 6, x1 = x0 - rx * 2 / 6; ctx.quadraticCurveTo((x0 + x1) / 2, 34, x1, 0); } ctx.closePath(); };
  scallop(); ctx.fillStyle = lin(ctx, -rx, -ry, rx, ry, [[0, 'rgba(255,140,205,.85)'], [.5, 'rgba(160,110,255,.8)'], [1, 'rgba(80,190,255,.85)']]); ctx.fill();
  ctx.save(); scallop(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; for (let i = 0; i <= 6; i++) { const x1 = -rx + i * rx * 2 / 6; ctx.beginPath(); ctx.moveTo(0, -ry); ctx.quadraticCurveTo(x1 * .7, -ry * .3, x1, 4); ctx.stroke(); }
  ctx.fillStyle = lin(ctx, 0, -ry, 0, 0, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(-80, -70, 170, 44, -.15, 0, TAU); ctx.fill();
  ctx.restore();
  scallop(); ctx.strokeStyle = 'rgba(255,240,250,.9)'; ctx.lineWidth = 4; ctx.shadowColor = PINK; ctx.shadowBlur = 24; ctx.stroke(); ctx.shadowBlur = 0;
  // rain splashes on canopy
  ctx.strokeStyle = 'rgba(220,240,255,.8)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 16; i++) { const k = (t * 4 + hash(i)) % 1, x = (hash(i * 5) - .5) * rx * 1.5, y = -ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * .96; ctx.globalAlpha = (1 - k); ctx.beginPath(); ctx.arc(x, y, 3 + k * 14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.restore();
}
function couple(ctx, t, mirror) {
  ctx.save(); ctx.translate(540, 0);
  const rim = lin(ctx, -140, 0, 140, 0, [[0, 'rgba(255,110,190,.95)'], [.5, 'rgba(255,255,255,.2)'], [1, 'rgba(90,220,255,.95)']]);
  const sway = Math.sin(t * 2.2) * 2;
  const body = (x0, x1, top, w, col, headR, hx, hy, hair, ponytail) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, 1200); ctx.bezierCurveTo(x0 - 6, top + 90, x0 + 4, top + 10, x0 + 40, top); ctx.lineTo(x1 - 40, top); ctx.bezierCurveTo(x1 - 4, top + 10, x1 + 6, top + 90, x1, 1200); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(hx - 15, top - 22, 30, 32);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(hx, hy, headR, 0, TAU); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.stroke();
    if (ponytail) { ctx.beginPath(); ctx.moveTo(hx - headR * .6, hy - headR * .6); ctx.bezierCurveTo(hx - headR * 2.2, hy - headR * .4, hx - headR * 2.0, hy + headR * 2.2, hx - headR * .8, hy + headR * 2.4); ctx.bezierCurveTo(hx - headR * 1.2, hy + headR * 1.0, hx - headR * 1.2, hy, hx - headR * .4, hy + headR * .3); ctx.fill(); ctx.stroke(); }
    V.glow(ctx, hx + 8, hy - headR * .6, headR * 1.4, 'rgba(255,255,255,.35)', .5);
  };
  body(-160, -20, 980, 140, lin(ctx, 0, 980, 0, 1200, [[0, '#f3a8d8'], [1, '#6a4a9a']]), 42, -92 + sway * .3, 928, '#1a0d2a', true);
  body(-10, 150, 950, 160, lin(ctx, 0, 950, 0, 1200, [[0, '#2a3a7a'], [1, '#0d1030']]), 46, 62 + sway * .3, 902, '#0b0a18', false);
  // arm to pole
  ctx.strokeStyle = '#1c2456'; ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(30, 1000); ctx.quadraticCurveTo(10, 940, 0, 890); ctx.stroke();
  ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#e9b59c'; ctx.beginPath(); ctx.arc(0, 884, 16, 0, TAU); ctx.fill();
  ctx.restore();
}
function fingerHeart(ctx, x, y, t0, t) {
  const u = t - t0; if (u < 0) return;
  const pop = ease.outElastic(clamp(u / .42)), s = pop;
  ctx.save(); ctx.translate(x, y);
  // hand (rises in)
  const hy = (1 - eo(u / .16)) * 160;
  ctx.save(); ctx.translate(0, hy);
  const sk = lin(ctx, -50, -80, 60, 80, [[0, '#ffdcc8'], [1, '#e7a58c']]);
  ctx.fillStyle = sk; ctx.strokeStyle = 'rgba(120,50,60,.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 80, 66, 84, .1, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineCap = 'round';
  const cap = (x0, y0, x1, y1, w) => { ctx.strokeStyle = 'rgba(110,40,50,.5)'; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = sk; ctx.lineWidth = w; ctx.stroke(); };
  cap(-10, 40, 40, -74, 34); cap(26, 60, -14, -70, 32);  // index + thumb crossing
  ctx.fillStyle = '#ff9fc4'; ctx.beginPath(); ctx.ellipse(41, -78, 12, 15, .4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-14, -74, 12, 15, -.3, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(200,120,110,.55)'; ctx.beginPath(); ctx.ellipse(-30 + i * 24, 40, 12, 20, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  // big glossy heart
  ctx.translate(-4, -140 + hy * .4); ctx.scale(s * 1.9, s * 1.9);
  ctx.rotate(Math.sin(u * 8) * .06 * (1 - clamp(u / .6)));
  const hp = () => { ctx.beginPath(); ctx.moveTo(0, 46); ctx.bezierCurveTo(-78, -6, -38, -62, 0, -22); ctx.bezierCurveTo(38, -62, 78, -6, 0, 46); ctx.closePath(); };
  V.glow(ctx, 0, 0, 120, 'rgba(255,80,170,.9)', .9);
  hp(); ctx.fillStyle = lin(ctx, 0, -50, 0, 50, [[0, '#ff9ad0'], [.5, '#ff3f9c'], [1, '#c0106a']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(-30, -26, 15, 7, -.7, 0, TAU); ctx.fill();
  ctx.restore();
  // shockwave ring + tiny hearts + sparkles
  const k = clamp(u / .5);
  ctx.save(); ctx.translate(x, y - 140); V.ring(ctx, 0, 0, 30 + k * 260, 10 * (1 - k) + 1, 'rgba(255,170,220,.9)', 1 - k);
  add(ctx, () => { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .3, d = 60 + eo(k) * (150 + hash(i) * 90); const sz = (10 + hash(i + 4) * 14) * (1 - k * .7); ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 2 ? '#ffb2d8' : '#9ff0ff'; if (i % 3 === 0) V.sparkle(ctx, Math.cos(a) * d, Math.sin(a) * d, sz * 1.4, '#fff', a); else { ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.scale(sz / 46, sz / 46); ctx.beginPath(); ctx.moveTo(0, 46); ctx.bezierCurveTo(-78, -6, -38, -62, 0, -22); ctx.bezierCurveTo(38, -62, 78, -6, 0, 46); ctx.fill(); ctx.restore(); } } });
  ctx.restore();
}
function neonTitle(ctx, t, str, t0, cy, col1, col2) {
  const u = t - t0; if (u < 0) return;
  const fl = u < .16 ? (hash(Math.floor(u * 60)) > .35 ? 1 : .25) : 1;
  const s = 1 + .08 * (1 - eo(u / .18));
  const fs = fitSize(ctx, str, 122, 860);
  ctx.save(); ctx.translate(540, cy); ctx.scale(s, s); ctx.globalAlpha = clamp(u / .05) * fl;
  ctx.fillStyle = 'rgba(10,4,34,.72)'; A.rrect(ctx, -470, -fs * .85, 940, fs * 1.7, 40); ctx.fill();
  ctx.strokeStyle = col2; ctx.lineWidth = 6; ctx.shadowColor = col2; ctx.shadowBlur = 34; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = `900 ${fs}px ${FONT}`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = col1; ctx.shadowBlur = 40; ctx.lineWidth = fs * .1; ctx.strokeStyle = col1; ctx.strokeText(str, 0, 6); ctx.shadowBlur = 14; ctx.strokeText(str, 0, 6); ctx.shadowBlur = 0;
  ctx.fillStyle = lin(ctx, 0, -fs * .5, 0, fs * .5, [[0, '#ffffff'], [1, '#ffd6f0']]); ctx.fillText(str, 0, 6);
  ctx.restore();
}
function segKor(ctx, t) {
  const u = t - T_KOR;
  const z = 1 + .05 * eo(u / .6);
  ctx.save(); ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-540, -900);
  ctx.drawImage(seoulCity(), 0, 0);
  seoulSigns(ctx, t);
  // sign reflections on wet street: mirrored city + neon, ripple strips
  const city = A.layer('v4_seoulref', W, 1010, g => { g.drawImage(seoulCity(), 0, 0, W, 1010, 0, 0, W, 1010); seoulSigns(g, 14.2); });
  for (let i = 0; i < 40; i++) {
    const y = STREET + i * 20, wob = Math.sin(i * .8 + t * 4) * (2 + i * .5);
    ctx.save(); ctx.globalAlpha = .5 * (1 - i / 40) ** 1.3; ctx.beginPath(); ctx.rect(0, y, W, 20); ctx.clip(); ctx.translate(wob, 0); ctx.transform(1, 0, 0, -1, 0, 2 * STREET); ctx.drawImage(city, 0, 0); ctx.restore();
  }
  // wet sheen streaks
  add(ctx, () => { for (let i = 0; i < 30; i++) { const x = hash(i * 2.2) * 1080, y = STREET + 20 + hash(i * 5) * 700, w = 40 + hash(i) * 200; ctx.globalAlpha = .1 + .1 * Math.sin(t * 5 + i); ctx.fillStyle = i % 2 ? PINK : CYAN; ctx.fillRect(x, y, w, 2); } });
  ctx.restore();
  // couple + reflection
  const cyc = 900;
  ctx.save(); ctx.globalAlpha = .28; ctx.translate(0, 2 * 1190); ctx.scale(1, -1); couple(ctx, t); ctx.restore();
  couple(ctx, t); umbrella(ctx, 540, cyc, t);
  // pink/cyan bokeh, depth layers
  add(ctx, () => { for (let i = 0; i < 26; i++) { const near = i > 16, r = (near ? 70 : 34) + hash(i * 3) * (near ? 90 : 50), x = (hash(i) * 1300 - 110 + Math.sin(t * .7 + i) * (near ? 40 : 14) + (near ? -u * 120 : u * 30)), y = 300 + hash(i * 9) * 1200 + Math.cos(t * .6 + i) * 20; ctx.globalAlpha = near ? .16 : .24; ctx.fillStyle = rad(ctx, x, y, r * .3, r, [[0, i % 3 === 0 ? 'rgba(90,230,255,.9)' : 'rgba(255,110,190,.9)'], [.85, 'rgba(255,110,190,.25)'], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } });
  // rain
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 170; i++) {
    const sp = 2400 + hash(i) * 1400, x0 = hash(i * 1.7) * 1300 - 100, y = ((hash(i * 4.1) * 2200 + t * sp) % 2200) - 150, l = 70 + hash(i + 1) * 90, near = hash(i + 7) > .8;
    ctx.strokeStyle = `rgba(210,230,255,${near ? .42 : .22})`; ctx.lineWidth = near ? 3 : 1.6; ctx.beginPath(); ctx.moveTo(x0 - y * .1, y); ctx.lineTo(x0 - y * .1 - l * .1, y + l); ctx.stroke();
  }
  ctx.restore();
  // ground splash rings
  for (let i = 0; i < 14; i++) { const k = (t * 2.2 + hash(i)) % 1, x = hash(i * 3) * 1080, y = STREET + 60 + hash(i * 6) * 800; ctx.strokeStyle = `rgba(220,240,255,${.5 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 8 + k * 46, 3 + k * 14, 0, 0, TAU); ctx.stroke(); }
  fingerHeart(ctx, 905, 950, 14.20, t);
  neonTitle(ctx, t, 'סדרות קוריאניות', 14.04, 300, PINK, CYAN);
  // vignette
  ctx.fillStyle = rad(ctx, 540, 900, 520, 1300, [[0, 'rgba(5,2,20,0)'], [1, 'rgba(5,2,20,.6)']]); ctx.fillRect(0, 0, W, H);
  V.flash(ctx, t, 14.20, .12, '#ffb0e0', .3);
}
//@@PART_D

//@@REGISTER
A.scene({ name: 'v4_series', start: S0, end: T_LIB, draw(ctx, s) {
  const t = s.t;
  let seg = segTurk;
  const wipe = t >= T_KOR && t < T_KOR + .14 ? (t - T_KOR) / .14 : -1;
  if (typeof segKor !== 'undefined' && t >= T_KOR) seg = segKor;
  if (typeof segAni !== 'undefined' && t >= T_ANI) seg = segAni;
  if (typeof segMore !== 'undefined' && t >= T_MORE) seg = segMore;
  const run = (c, tt) => {
    if (wipe >= 0) {
      segTurk(c, tt);
      const e = lerp(1350, -350, eo(wipe));
      c.save(); c.beginPath(); c.moveTo(e + 170, 0); c.lineTo(W + 10, 0); c.lineTo(W + 10, H); c.lineTo(e - 170, H); c.closePath(); c.clip(); seg(c, tt); c.restore();
      add(c, () => { c.fillStyle = 'rgba(255,120,200,.85)'; c.beginPath(); c.moveTo(e + 170, 0); c.lineTo(e + 215, 0); c.lineTo(e - 125, H); c.lineTo(e - 170, H); c.fill(); c.fillStyle = 'rgba(120,235,255,.9)'; c.beginPath(); c.moveTo(e + 150, 0); c.lineTo(e + 165, 0); c.lineTo(e - 185, H); c.lineTo(e - 190, H); c.fill(); });
    } else seg(c, tt);
  };
  // whip-in from the right
  const wu = clamp((t - S0) / .30);
  if (wu < 1) {
    const p = eo(wu), dx = (1 - p) * 1180;
    ctx.save(); ctx.beginPath(); ctx.rect(dx, 0, W, H); ctx.clip();
    ctx.transform(1, 0, -(1 - p) * .18, 1, dx + (1 - p) * 90, 0);
    run(ctx, t); ctx.restore();
    // leading edge light streak + speed lines
    add(ctx, () => { const g = lin(ctx, dx - 160, 0, dx + 20, 0, [[0, 'rgba(255,200,120,0)'], [1, `rgba(255,220,160,${.75 * (1 - p)})`]]); ctx.fillStyle = g; ctx.fillRect(dx - 160, 0, 180, H);
      for (let i = 0; i < 22; i++) { const y = hash(i * 3.3) * H, l = 200 + hash(i) * 500; ctx.fillStyle = `rgba(255,230,190,${.3 * (1 - p)})`; ctx.fillRect(dx - l * .3, y, l, 3 + hash(i + 2) * 6); } });
  } else run(ctx, t);
} });
})();
