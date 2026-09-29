// S2c "series genres" global 13.10-15.81 (+0.3 tail). Turkish / Korean / Anime / shatter into content wall.
(() => {
const O = A.OUTLINE, TAU = A.TAU;
const inv = A.inv, ease = A.ease;
const pulse = (t, hit, dur = 0.14) => (t < hit ? 0 : Math.pow(Math.max(0, 1 - (t - hit) / dur), 2));
const hash = A.hash;
const camT = (ctx, cx, cy, z, rot) => { ctx.translate(960, 540); ctx.rotate(rot || 0); ctx.scale(z, z); ctx.translate(-cx, -cy); };

// ---------- vector glyph strokes (hangul / katakana drawn as paths, no font dependency) ----------
const P = (...p) => ({ p }), C = (cx, cy, r) => ({ c: [cx, cy, r] }), Q = (...q) => ({ q });
const GL = {
  '사': [P([26, 14], [8, 72]), P([24, 38], [48, 74]), P([70, 4], [70, 96]), P([70, 48], [90, 48])],
  '랑': [P([8, 6], [44, 6], [44, 24], [8, 24], [8, 42], [44, 42]), P([68, 4], [68, 58]), P([68, 30], [90, 30]), C(50, 80, 15)],
  '안': [C(30, 26, 17), P([70, 4], [70, 60]), P([70, 30], [92, 30]), P([16, 74], [16, 92], [84, 92])],
  '녕': [P([10, 8], [10, 52], [40, 52]), P([62, 4], [62, 60]), P([62, 20], [86, 20]), P([62, 38], [86, 38]), C(50, 82, 14)],
  'ド': [P([38, 8], [38, 92]), P([38, 46], [78, 30]), P([70, 10], [78, 24]), P([84, 6], [92, 20])],
  'ン': [P([16, 24], [34, 42]), Q(14, 84, 62, 72, 92, 16)],
  '!': [P([50, 6], [50, 62]), C(50, 88, 2)],
};
function glyphPath(ctx, ch, x, y, sz) {
  const k = sz / 100;
  for (const g of GL[ch]) {
    if (g.p) { ctx.moveTo(x + g.p[0][0] * k, y + g.p[0][1] * k); for (let i = 1; i < g.p.length; i++) ctx.lineTo(x + g.p[i][0] * k, y + g.p[i][1] * k); }
    else if (g.c) { ctx.moveTo(x + (g.c[0] + g.c[2]) * k, y + g.c[1] * k); ctx.arc(x + g.c[0] * k, y + g.c[1] * k, g.c[2] * k, 0, TAU); }
    else { const q = g.q; ctx.moveTo(x + q[0] * k, y + q[1] * k); ctx.quadraticCurveTo(x + q[2] * k, y + q[3] * k, x + q[4] * k, y + q[5] * k); }
  }
}
// passes: [[lineWidth, colour], ...] drawn in order
function glyphs(ctx, str, x, y, sz, spacing, passes) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, col] of passes) {
    ctx.beginPath(); [...str].forEach((ch, i) => glyphPath(ctx, ch, x + i * spacing, y, sz));
    ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke();
  }
  ctx.restore();
}
function heart(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, s * 0.4);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.3, -s * 0.5, -s * 1.0, 0, -s * 0.4); ctx.bezierCurveTo(s * 0.5, -s * 1.0, s * 1.1, -s * 0.3, 0, s * 0.4); ctx.restore();
}
const sparkle = (ctx, x, y, r, fill = '#fff', rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); };

// ---------- ribbon title ----------
function ribbon(ctx, text, x, y, t, t0, o = {}) {
  const p = inv(t0, t0 + 0.16, t); if (p <= 0) return;
  const sc = ease.outBack(p) * (o.size || 1) * (1 + 0.06 * (o.pulse || 0));
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.font = `900 ${o.font || 100}px Rubik`; const w = ctx.measureText(text).width + 130, h = (o.font || 100) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; A.rrect(ctx, -w / 2 + 8, -h / 2 + 14, w, h, 30); ctx.fill();
  A.rrect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, o.c1 || '#F0284F'], [1, o.c2 || '#8E0F35']]); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.stroke();
  A.rrect(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 22); ctx.lineWidth = 4; ctx.strokeStyle = o.gold || '#FFC24A'; ctx.stroke();
  A.text(ctx, text, 0, 4, { font: `900 ${o.font || 100}px Rubik`, fill: o.fill || '#FFF6E0', stroke: O, lw: 14, dir: 'rtl' });
  ctx.restore();
}

// ============================================================================
// TURKISH
// ============================================================================
function mosque(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 5 / s; ctx.lineJoin = 'round';
  const minaret = mx => { // base at y=0 going up
    ctx.beginPath(); ctx.rect(mx - 10, -300, 20, 300); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(mx - 19, -215, 38, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx - 13, -300); ctx.lineTo(mx, -365); ctx.lineTo(mx + 13, -300); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(mx - 15, -312, 30, 12); ctx.fill(); ctx.stroke();
  };
  [-230, 230].forEach(minaret);
  ctx.beginPath(); ctx.rect(-190, -110, 380, 110); ctx.fill(); ctx.stroke();
  [-150, 150].forEach(sx => { ctx.beginPath(); ctx.ellipse(sx, -110, 58, 62, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  [-75, 75].forEach(sx => { ctx.beginPath(); ctx.ellipse(sx, -125, 60, 78, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  ctx.beginPath(); ctx.rect(-95, -175, 190, 65); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -175, 105, 120, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -295); ctx.lineTo(0, -335); ctx.lineTo(6, -295); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawTurkCityLayer(c) {
  // mosques left
  const g = A.linear(c, 0, 300, 0, 700, [[0, '#4E2058'], [1, '#B0476A']]);
  mosque(c, 330, 700, 1.15, g); mosque(c, 720, 700, 0.62, g); mosque(c, -30, 700, 0.7, g);
  // small houses on shore
  c.fillStyle = '#7A3562'; c.strokeStyle = O; c.lineWidth = 4;
  for (let i = 0; i < 12; i++) { const hx = 20 + i * 58, hh = 30 + hash(i * 3) * 30; c.beginPath(); c.rect(hx, 700 - hh, 52, hh); c.fill(); c.stroke(); }
  // bridge (right)
  const DK = '#331646';
  c.lineJoin = 'round';
  const deckY = 655;
  c.fillStyle = DK; c.strokeStyle = O; c.lineWidth = 5;
  c.beginPath(); c.rect(740, deckY, 1260, 18); c.fill(); c.stroke();
  [1010, 1610].forEach(tx => { // towers
    c.beginPath(); c.rect(tx - 20, 300, 16, deckY - 300 + 40); c.rect(tx + 4, 300, 16, deckY - 300 + 40); c.fill(); c.stroke();
    c.beginPath(); c.rect(tx - 26, 380, 52, 12); c.rect(tx - 26, 500, 52, 12); c.fill(); c.stroke();
    c.beginPath(); c.rect(tx - 30, 290, 60, 20); c.fill(); c.stroke();
  });
  c.strokeStyle = DK; c.lineWidth = 6;
  const cable = (x0, y0, x1, y1, sag) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); c.stroke(); };
  cable(1010, 305, 1610, 305, 260); cable(760, deckY, 1010, 305, 90); cable(1610, 305, 1960, deckY, 90);
  c.lineWidth = 3;
  for (let x = 800; x < 1960; x += 26) { // hangers
    let ty;
    if (x < 1010) { const u = (x - 760) / 250; ty = A.lerp(deckY, 305, u) + 90 * 2 * u * (1 - u) * 0.5 * 1; }
    else if (x < 1610) { const u = (x - 1010) / 600; ty = 305 + 260 * 2 * u * (1 - u); }
    else { const u = (x - 1610) / 350; ty = A.lerp(305, deckY, u) + 90 * 2 * u * (1 - u) * 0.5; }
    c.beginPath(); c.moveTo(x, ty); c.lineTo(x, deckY); c.stroke();
  }
  c.fillStyle = '#FFE08A'; for (let x = 760; x < 1960; x += 70) { c.beginPath(); c.arc(x, deckY + 9, 3.5, 0, TAU); c.fill(); }
}
function drawTurkSkyLayer(c) {
  c.fillStyle = A.linear(c, 0, 0, 0, 700, [[0, '#B23A78'], [0.3, '#FF7A4A'], [0.6, '#FFBE62'], [0.85, '#FFE7A8'], [1, '#FFF0C4']]); c.fillRect(0, 0, 1920, 700);
  // cloud streaks
  c.strokeStyle = 'rgba(122,40,90,0.55)'; c.lineCap = 'round';
  [[200, 130, 520], [700, 200, 380], [1300, 110, 500], [1500, 250, 360], [100, 300, 320]].forEach(([x, y, w], i) => { c.lineWidth = 22 - i * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); });
  c.strokeStyle = 'rgba(255,230,180,0.55)';
  [[350, 175, 420], [1350, 150, 380], [850, 245, 300]].forEach(([x, y, w]) => { c.lineWidth = 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); });
  A.ellipse(c, 1300, 520, 150, 150); c.fillStyle = A.radial(c, 1300, 520, 20, 150, [[0, '#FFFBE8'], [1, '#FFD46A']]); c.fill(); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
}
function teaGlass(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // saucer
  A.ellipse(ctx, 0, 4, 128, 26); A.fillStroke(ctx, '#F6C25A', 6);
  A.ellipse(ctx, 0, 2, 84, 15); A.fillStroke(ctx, '#C8203C', 4);
  const gp = () => { ctx.beginPath(); ctx.moveTo(-58, -200); ctx.bezierCurveTo(-60, -150, -42, -110, -40, -90); ctx.bezierCurveTo(-38, -60, -60, -40, -56, -6); ctx.lineTo(56, -6); ctx.bezierCurveTo(60, -40, 38, -60, 40, -90); ctx.bezierCurveTo(42, -110, 60, -150, 58, -200); ctx.closePath(); };
  gp(); ctx.fillStyle = 'rgba(255,240,220,0.28)'; ctx.fill();
  ctx.save(); gp(); ctx.clip(); ctx.fillStyle = A.linear(ctx, 0, -180, 0, 0, [[0, '#E8641F'], [0.6, '#B5341C'], [1, '#7A1A14']]); ctx.fillRect(-70, -172 + Math.sin(t * 5) * 1.5, 140, 200);
  ctx.fillStyle = 'rgba(255,200,120,0.55)'; ctx.fillRect(-70, -175 + Math.sin(t * 5) * 1.5, 140, 8); ctx.restore();
  gp(); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-50, -190); ctx.bezierCurveTo(-52, -150, -36, -112, -34, -92); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-58, -200); ctx.lineTo(58, -200); ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#FFE08A'; ctx.stroke();
  // spoon
  ctx.beginPath(); ctx.moveTo(30, -150); ctx.lineTo(110, -232); ctx.lineWidth = 9; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#FFE08A'; ctx.stroke();
  // steam
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const u = i / 14, yy = -215 - u * 130, xx = (k - 1) * 30 + Math.sin(u * 5 + t * 3 + k * 2) * (10 + u * 14); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.lineWidth = 9; ctx.strokeStyle = `rgba(255,255,255,${0.55 - 0.1 * k})`; ctx.stroke();
  }
  ctx.restore();
}
function tulip(ctx, x, y, s, h, sway, ph) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const sx = sway * 16;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sx * 0.3 + 6, -h * 0.5, sx, -h); ctx.lineWidth = 20; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 11; ctx.strokeStyle = '#3DAA4F'; ctx.stroke();
  // leaves
  [[-1, 0.5], [1, 0.4]].forEach(([d, k]) => { ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(d * 70, -h * k * 0.7, d * 45 + sway * 6, -h * k - 40); ctx.quadraticCurveTo(d * 12, -h * k * 0.5, 0, -4); ctx.closePath(); A.fillStroke(ctx, '#4CC45E', 6); });
  ctx.translate(sx, -h);
  ctx.beginPath(); ctx.moveTo(-36, -20); ctx.bezierCurveTo(-44, -60, -30, -85, -22, -100); ctx.lineTo(-8, -70); ctx.lineTo(0, -110); ctx.lineTo(8, -70); ctx.lineTo(22, -100); ctx.bezierCurveTo(30, -85, 44, -60, 36, -20); ctx.bezierCurveTo(24, 12, -24, 12, -36, -20); ctx.closePath();
  A.fillStroke(ctx, A.linear(ctx, 0, -110, 0, 10, [[0, '#FF5A4A'], [1, '#C2162B']]), 7);
  ctx.beginPath(); ctx.moveTo(-8, -70); ctx.quadraticCurveTo(0, -20, 0, 6); ctx.moveTo(8, -70); ctx.quadraticCurveTo(0, -20, 0, 6); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(120,10,30,0.7)'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-28, -30); ctx.quadraticCurveTo(-32, -60, -22, -84); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,220,200,0.6)'; ctx.stroke();
  ctx.restore();
}
function gull(ctx, x, y, s, t, ph) {
  const f = Math.sin(t * 11 + ph) * 16;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-46, -8 + f * 0.5); ctx.quadraticCurveTo(-24, -32 - f, 0, 0); ctx.quadraticCurveTo(24, -32 - f, 46, -8 + f * 0.5);
  ctx.lineWidth = 15; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
  A.ellipse(ctx, 0, 2, 11, 7); A.fillStroke(ctx, '#fff', 4);
  ctx.restore();
}
function ferry(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-90, -20); ctx.lineTo(90, -20); ctx.lineTo(70, 12); ctx.lineTo(-76, 12); ctx.closePath(); A.fillStroke(ctx, '#2C1440', 5);
  ctx.beginPath(); ctx.rect(-50, -50, 90, 30); A.fillStroke(ctx, '#4A2456', 5); ctx.beginPath(); ctx.rect(-8, -80, 22, 30); A.fillStroke(ctx, '#C8203C', 5);
  ctx.fillStyle = '#FFE08A'; for (let i = 0; i < 5; i++) ctx.fillRect(-42 + i * 17, -42, 9, 9);
  ctx.restore();
}
function turkBosphorus(ctx, t) {
  const lt = t - 13.10, z = 1.05 + 0.07 * inv(13.1, 13.7, t);
  ctx.save(); ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960 - lt * 10, -540 - lt * 4);
  ctx.drawImage(A.layer('tk_sky', 1920, 1080, c => drawTurkSkyLayer(c)), 0, 0);
  A.glow(ctx, 1300, 520, 620 + 40 * Math.sin(lt * 4), 'rgba(255,190,90,0.75)', 0.95);
  ctx.drawImage(A.layer('tk_city', 1920, 1080, c => drawTurkCityLayer(c)), 0, 0);
  // water
  ctx.fillStyle = A.linear(ctx, 0, 673, 0, 1100, [[0, '#F0708A'], [0.35, '#B9457A'], [1, '#2C1B5E']]); ctx.fillRect(-40, 673, 2000, 440);
  ctx.lineCap = 'round';
  for (let k = 0; k < 13; k++) {
    const yy = 690 + k * 17 + k * k * 0.6, w = 60 + k * 26 + Math.sin(lt * 5 + k) * 22;
    ctx.beginPath(); ctx.moveTo(1300 - w / 2 + Math.sin(lt * 3 + k * 1.7) * 14, yy); ctx.lineTo(1300 + w / 2 + Math.sin(lt * 3 + k * 1.7) * 14, yy);
    ctx.lineWidth = 6 + k * 0.6; ctx.strokeStyle = `rgba(255,224,138,${0.9 - k * 0.03})`; ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,200,230,0.35)'; ctx.lineWidth = 5;
  for (let i = 0; i < 26; i++) { const wx = hash(i) * 2000 + Math.sin(lt * 2 + i) * 20, wy = 700 + hash(i + 40) * 380, wl = 30 + hash(i + 9) * 60; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + wl, wy); ctx.stroke(); }
  ferry(ctx, 640 + lt * 60, 690, 0.8);
  // gulls
  gull(ctx, 260 + lt * 130, 230 - lt * 30, 1.2, lt, 0); gull(ctx, 470 + lt * 150, 300 - lt * 20, 0.9, lt, 2); gull(ctx, 120 + lt * 110, 380, 0.7, lt, 4); gull(ctx, 1500 - lt * 40, 170, 0.8, lt, 1);
  ctx.restore();
  // foreground (own parallax)
  ctx.save(); ctx.translate(960, 540); ctx.scale(z * 1.03, z * 1.03); ctx.translate(-960 - lt * 26, -540);
  const sw = Math.sin(lt * 3);
  tulip(ctx, 1490, 960, 1.05, 300, sw, 0); tulip(ctx, 1620, 990, 1.25, 380, Math.sin(lt * 3 + 1), 1); tulip(ctx, 1730, 950, 0.9, 260, Math.sin(lt * 3 + 2), 2);
  teaGlass(ctx, 360, 900, 1.25, lt);
  ctx.restore();
  A.glow(ctx, 960, 1100, 900, 'rgba(40,10,60,0.5)', 0.6);
}
function profile(ctx, o) {
  const { x, y, s, flip, skin, hair, dress, male, t, rot = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * (flip ? -1 : 1)); ctx.scale(flip ? -s : s, s);
  ctx.lineJoin = 'round';
  const face = [[-100, 320], [-95, 180], [-150, 60], [-160, -80], [-90, -190], [20, -200], [110, -150], [135, -90], [128, -40], [190, 30], [140, 55], [150, 80], [128, 95], [148, 115], [125, 140], [135, 190], [90, 230], [40, 240], [30, 320]];
  // back hair
  const hb = male ? [[115, -150], [60, -205], [-60, -222], [-150, -150], [-170, -20], [-120, 10], [-90, -80], [-30, -130], [40, -150]]
    : [[115, -150], [60, -215], [-60, -232], [-170, -150], [-205, 20], [-195, 200], [-165, 345], [-70, 345], [-90, 180], [-140, 60], [-120, -60], [-40, -130], [40, -150]];
  A.blob(ctx, hb); A.fillStroke(ctx, hair, 7);
  A.blob(ctx, face); A.fillStroke(ctx, skin, 7);
  // neck shadow
  ctx.save(); A.blob(ctx, face); ctx.clip(); ctx.fillStyle = 'rgba(120,40,30,0.22)'; ctx.fillRect(-120, 232, 260, 120); ctx.restore();
  // cheek blush
  A.ellipse(ctx, 70, 62, 42, 26); ctx.fillStyle = 'rgba(255,90,110,0.4)'; ctx.fill();
  // ear
  A.ellipse(ctx, -30, 30, 26, 38, 0.1); A.fillStroke(ctx, skin, 6);
  // clothes
  ctx.beginPath(); ctx.moveTo(-230, 450); ctx.bezierCurveTo(-230, 330, -110, 290, -20, 300); ctx.bezierCurveTo(60, 298, 150, 330, 170, 450); ctx.closePath(); A.fillStroke(ctx, dress, 7);
  if (male) { ctx.beginPath(); ctx.moveTo(-30, 300); ctx.lineTo(30, 400); ctx.lineTo(80, 320); ctx.closePath(); A.fillStroke(ctx, '#F4EFE6', 6); }
  else { ctx.beginPath(); ctx.moveTo(-60, 296); ctx.quadraticCurveTo(10, 370, 100, 320); ctx.lineWidth = 6; ctx.strokeStyle = O; ctx.stroke(); }
  // fringe
  const fr = male ? [[125, -140], [70, -195], [-40, -208], [-110, -150], [-40, -150], [40, -120], [98, -110]] : [[125, -140], [60, -200], [-40, -215], [-125, -150], [-60, -138], [20, -125], [95, -95]];
  A.blob(ctx, fr); A.fillStroke(ctx, hair, 6);
  ctx.beginPath(); ctx.moveTo(-60, -190); ctx.quadraticCurveTo(0, -205, 50, -185); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke();
  // eye
  const ex = 80, ey = -36;
  ctx.beginPath(); ctx.moveTo(ex - 30, ey + 3); ctx.quadraticCurveTo(ex, ey - 24, ex + 32, ey + 2); ctx.quadraticCurveTo(ex, ey + 20, ex - 30, ey + 3); ctx.closePath(); A.fillStroke(ctx, '#fff', 5);
  ctx.save(); ctx.clip(); A.ellipse(ctx, ex + 12, ey + 1, 15, 17); ctx.fillStyle = male ? '#5A3A22' : '#2E6F5A'; ctx.fill(); A.ellipse(ctx, ex + 15, ey + 1, 7, 8); ctx.fillStyle = '#0d0716'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 6, ey - 6, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 20, ey + 8, 3, 0, TAU); ctx.fill();
  if (!male) { ctx.fillStyle = 'rgba(120,230,255,0.35)'; ctx.fillRect(ex - 34, ey + 8, 70, 14); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(ex - 34, ey + 2); ctx.quadraticCurveTo(ex, ey - 28, ex + 36, ey); ctx.lineWidth = 9; ctx.strokeStyle = O; ctx.stroke();
  if (!male) { ctx.beginPath(); ctx.moveTo(ex + 32, ey - 2); ctx.lineTo(ex + 50, ey - 16); ctx.moveTo(ex + 22, ey - 10); ctx.lineTo(ex + 38, ey - 28); ctx.lineWidth = 5; ctx.stroke(); }
  // brow
  ctx.beginPath(); if (male) { ctx.moveTo(ex - 28, ey - 38); ctx.lineTo(ex + 40, ey - 22); } else { ctx.moveTo(ex - 30, ey - 26); ctx.quadraticCurveTo(ex, ey - 50, ex + 40, ey - 50); }
  ctx.lineWidth = male ? 14 : 9; ctx.lineCap = 'round'; ctx.strokeStyle = male ? '#1C1218' : hair; ctx.stroke();
  // nose detail + lips
  ctx.beginPath(); ctx.moveTo(150, 52); ctx.quadraticCurveTo(165, 56, 172, 44); ctx.lineWidth = 5; ctx.strokeStyle = O; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(150, 82); ctx.lineTo(128, 96); ctx.lineTo(148, 114); ctx.lineWidth = 12; ctx.strokeStyle = male ? '#B05040' : '#D0203C'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(126, 97); ctx.lineTo(96, 96); ctx.lineWidth = 5; ctx.strokeStyle = O; ctx.stroke();
  if (male) { A.blob(ctx, [[60, 150], [120, 150], [132, 180], [96, 225], [50, 232], [30, 200]]); ctx.fillStyle = 'rgba(30,18,24,0.28)'; ctx.fill(); }
  // tear
  if (o.tear) {
    const u = inv(13.66, 13.98, t), ty = -6 + 120 * ease.in(u), tx = 96 + 6 * u;
    ctx.beginPath(); ctx.moveTo(tx - 8, ey + 16); ctx.quadraticCurveTo(tx - 2, ty - 22, tx, ty - 24); ctx.strokeStyle = 'rgba(160,240,255,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx, ty - 26); ctx.bezierCurveTo(tx + 20, ty - 2, tx + 22, ty + 18, tx, ty + 20); ctx.bezierCurveTo(tx - 22, ty + 18, tx - 20, ty - 2, tx, ty - 26); ctx.closePath();
    A.fillStroke(ctx, A.linear(ctx, 0, ty - 26, 0, ty + 20, [[0, '#DFFAFF'], [1, '#4FC3F7']]), 5);
    ctx.beginPath(); ctx.ellipse(tx - 6, ty + 4, 4, 8, 0.3, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    if (t > 13.78) sparkle(ctx, tx + 24, ty - 16, 15 + 12 * Math.sin(t * 40), '#fff', t * 3);
    sparkle(ctx, ex + 8, ey - 8, 9 + 5 * Math.sin(t * 30), '#fff', 0);
  }
  ctx.restore();
}
function turkSoap(ctx, t) {
  const lt = t - 13.62, zb = 1.0 + 0.16 * inv(13.62, 13.99, t);
  const kick = 0.12 * (pulse(t, 13.62, 0.13) + pulse(t, 13.75, 0.13) + pulse(t, 13.88, 0.13));
  ctx.save(); ctx.fillStyle = A.radial(ctx, 960, 420, 50, 1250, [[0, '#B01A3E'], [0.5, '#5E0F2E'], [1, '#14040F']]); ctx.fillRect(0, 0, 1920, 1080);
  // soap rays
  ctx.save(); ctx.translate(960, 420); ctx.rotate(lt * 0.15); for (let i = 0; i < 18; i++) { ctx.rotate(TAU / 18); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -42); ctx.lineTo(1500, 42); ctx.closePath(); ctx.fillStyle = 'rgba(255,120,150,0.11)'; ctx.fill(); } ctx.restore();
  A.glow(ctx, 960, 400, 700, 'rgba(255,90,120,0.45)', 0.8);
  ctx.save(); camT(ctx, 960, 470, zb + kick, Math.sin(lt * 9) * 0.006 * (1 + pulse(t, 13.62, 0.2) * 4));
  // rose petals falling
  for (let i = 0; i < 14; i++) { const px = hash(i) * 1900 + Math.sin(lt * 3 + i) * 40, py = ((hash(i + 7) * 1400 + lt * (260 + hash(i + 3) * 200)) % 1300) - 150; ctx.save(); ctx.translate(px, py); ctx.rotate(lt * 3 + i); A.ellipse(ctx, 0, 0, 14, 8); A.fillStroke(ctx, '#E0264A', 3); ctx.restore(); }
  profile(ctx, { x: 690, y: 400, s: 1.02, flip: false, skin: '#F6BE98', hair: '#3A1A18', dress: '#7B1FA2', male: false, t, tear: true, rot: 0.05 });
  profile(ctx, { x: 1230, y: 410, s: 1.02, flip: true, skin: '#D99468', hair: '#1C1218', dress: '#1B2A4E', male: true, t, tear: false, rot: 0.05 });
  ctx.restore();
  // sting: white flash then red rays
  const fl = inv(13.62, 13.72, t);
  if (t < 13.66) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - inv(13.62, 13.66, t) * 0.7; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
  if (fl < 1) { ctx.save(); ctx.translate(960, 460); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + 0.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 250, Math.sin(a) * 250); ctx.lineTo(Math.cos(a - 0.04) * 1600, Math.sin(a - 0.04) * 1600); ctx.lineTo(Math.cos(a + 0.04) * 1600, Math.sin(a + 0.04) * 1600); ctx.closePath(); ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - fl)})`; ctx.fill(); } ctx.restore(); }
  // letterbox bars closing
  const bar = 70 * ease.out(inv(13.62, 13.72, t));
  ctx.fillStyle = '#0a0208'; ctx.fillRect(0, 0, 1920, bar); ctx.fillRect(0, 1080 - bar, 1920, bar);
  // vignette
  ctx.fillStyle = A.radial(ctx, 960, 540, 500, 1200, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]); ctx.fillRect(0, 0, 1920, 1080);
  ctx.restore();
}
function turkAll(ctx, t) {
  if (t < 13.62) turkBosphorus(ctx, t); else turkSoap(ctx, t);
  ribbon(ctx, 'סדרות תורכיות', 960, 800, t, 13.34, { pulse: pulse(t, 13.62, 0.12) + pulse(t, 13.75, 0.12) + pulse(t, 13.88, 0.12) });
}

// ============================================================================
// KOREAN
// ============================================================================
function drawKrBg(c) {
  c.fillStyle = A.linear(c, 0, 0, 0, 1080, [[0, '#120A3A'], [0.55, '#3A1D78'], [1, '#6A2C90']]); c.fillRect(0, 0, 1920, 1080);
  // far skyline
  c.fillStyle = '#231458'; c.strokeStyle = O; c.lineWidth = 4;
  for (let i = 0; i < 16; i++) { const bx = i * 130 - 20, bh = 260 + hash(i * 5) * 330; c.beginPath(); c.rect(bx, 830 - bh, 120, bh); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(255,225,150,0.7)';
  for (let i = 0; i < 16; i++) { const bx = i * 130 - 20, bh = 260 + hash(i * 5) * 330; for (let r = 0; r < 12; r++) for (let q = 0; q < 4; q++) if (hash(i * 100 + r * 7 + q) > 0.55) c.fillRect(bx + 12 + q * 27, 830 - bh + 20 + r * 36, 16, 20); }
  // mid buildings
  const mids = [[-40, 300, 420], [520, 250, 470], [1000, 340, 380], [1500, 320, 430]];
  mids.forEach(([mx, mw, mh], i) => { c.beginPath(); c.rect(mx, 850 - mh, mw, mh); c.fillStyle = ['#3A2078', '#2E1A6A', '#43248A', '#341C74'][i]; c.fill(); c.lineWidth = 6; c.strokeStyle = O; c.stroke(); });
  // ground
  c.fillStyle = A.linear(c, 0, 850, 0, 1080, [[0, '#2A1568'], [1, '#0E0730']]); c.fillRect(0, 850, 1920, 230); c.beginPath(); c.moveTo(0, 850); c.lineTo(1920, 850); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
}
function neonSign(ctx, x, y, w, h, str, col, t, seed, sz) {
  const fl = 0.86 + 0.14 * Math.sin(t * 17 + seed * 3) * (hash(Math.floor(t * 12) + seed) > 0.85 ? 0.3 : 1);
  ctx.save(); ctx.translate(x, y);
  A.glow(ctx, w / 2, h / 2, w * 1.1, col, 0.55 * fl);
  A.rrect(ctx, 0, 0, w, h, 24); ctx.fillStyle = '#150B3A'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke();
  A.rrect(ctx, 12, 12, w - 24, h - 24, 16); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.globalAlpha = fl; ctx.stroke(); ctx.globalAlpha = 1;
  glyphs(ctx, str, w / 2 - (str.length * sz * 1.08) / 2 + sz * 0.04, h / 2 - sz / 2, sz, sz * 1.08, [[sz * 0.28, col.replace(')', ',0.35)').replace('rgb(', 'rgba(')], [sz * 0.13, '#fff']]);
  ctx.restore();
}
function umbrella(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 300); ctx.lineWidth = 12; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#EFE6FF'; ctx.stroke();
  const W = 340, top = -120, bot = 120, n = 6;
  const canopy = () => { ctx.beginPath(); ctx.moveTo(-W, bot); ctx.bezierCurveTo(-W, top + 50, -140, top, 0, top); ctx.bezierCurveTo(140, top, W, top + 50, W, bot);
    for (let i = n; i > 0; i--) { const x1 = -W + (i - 1) * (2 * W / n) , xm = -W + (i - 0.5) * (2 * W / n); ctx.quadraticCurveTo(xm, bot + 50, x1, bot); } ctx.closePath(); };
  canopy(); ctx.fillStyle = A.linear(ctx, 0, top, 0, bot + 40, [[0, '#FFB0DC'], [1, '#FF7CC0']]); ctx.fill();
  ctx.save(); canopy(); ctx.clip();
  for (let i = 0; i < n; i += 2) { ctx.beginPath(); ctx.moveTo(0, top - 10); ctx.lineTo(-W + i * (2 * W / n), bot + 60); ctx.lineTo(-W + (i + 1) * (2 * W / n), bot + 60); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill(); }
  ctx.restore();
  canopy(); ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.stroke();
  ctx.lineWidth = 4; for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(-W + i * (2 * W / n), bot + 4); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, top - 6); ctx.lineTo(0, top - 30); ctx.lineWidth = 12; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#FFE08A'; ctx.stroke();
  ctx.restore();
}
function kidHead(ctx, x, y, r, skin, hair, hairKind, tilt, eyes) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  if (hairKind === 'bob') { A.blob(ctx, [[-r * 1.15, r * 0.9], [-r * 1.25, -r * 0.2], [-r * 0.6, -r * 1.25], [r * 0.6, -r * 1.25], [r * 1.25, -r * 0.2], [r * 1.15, r * 0.9], [0, r * 0.6]]); A.fillStroke(ctx, hair, 6); }
  A.ellipse(ctx, 0, 0, r, r * 1.05); A.fillStroke(ctx, skin, 6);
  A.blob(ctx, [[-r * 1.05, -r * 0.1], [-r * 0.8, -r * 1.05], [0, -r * 1.2], [r * 0.85, -r * 1.0], [r * 1.05, -r * 0.1], [r * 0.5, -r * 0.55], [-r * 0.2, -r * 0.4], [-r * 0.7, -r * 0.5]]); A.fillStroke(ctx, hair, 6);
  ctx.lineCap = 'round';
  if (eyes === 'wink') { ctx.beginPath(); ctx.arc(-r * 0.36, r * 0.05, r * 0.14, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = O; ctx.stroke(); ctx.beginPath(); ctx.arc(r * 0.36, r * 0.05, r * 0.15, 0, TAU); ctx.fillStyle = O; ctx.fill(); }
  else if (eyes === 'happy') { [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc(d * r * 0.36, r * 0.1, r * 0.15, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = O; ctx.stroke(); }); }
  else { [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc(d * r * 0.36, r * 0.05, r * 0.11, 0, TAU); ctx.fillStyle = O; ctx.fill(); }); }
  A.ellipse(ctx, -r * 0.62, r * 0.32, r * 0.2, r * 0.12); ctx.fillStyle = 'rgba(255,110,150,0.6)'; ctx.fill(); A.ellipse(ctx, r * 0.62, r * 0.32, r * 0.2, r * 0.12); ctx.fill();
  ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.17, 0.15, Math.PI - 0.15); ctx.lineWidth = 5; ctx.strokeStyle = O; ctx.stroke();
  ctx.restore();
}
function body(ctx, x, y, w, h, col, legCol) {
  ctx.beginPath(); ctx.moveTo(x - w * 0.5, y + h); ctx.bezierCurveTo(x - w * 0.6, y + 20, x - w * 0.4, y, x, y); ctx.bezierCurveTo(x + w * 0.4, y, x + w * 0.6, y + 20, x + w * 0.5, y + h); ctx.closePath(); A.fillStroke(ctx, col, 6);
  ctx.beginPath(); ctx.rect(x - w * 0.42, y + h, w * 0.36, 130); A.fillStroke(ctx, legCol, 6); ctx.beginPath(); ctx.rect(x + w * 0.06, y + h, w * 0.36, 130); A.fillStroke(ctx, legCol, 6);
}
// (korea is redefined below with full composition)
function koreaFull(ctx, t) {
  const lt = t - 14.0, z = 1.0 + 0.09 * inv(14.0, 14.6, t);
  ctx.save(); camT(ctx, 960 + lt * 10, 540, z, Math.sin(lt * 4) * 0.008);
  ctx.drawImage(A.layer('kr_bg', 1920, 1080, c => drawKrBg(c)), 0, 0);
  // sign glows on the street
  [[330, 'rgba(255,120,200,0.45)'], [1620, 'rgba(90,235,255,0.45)'], [1170, 'rgba(190,150,255,0.4)']].forEach(([gx, gc]) => A.glow(ctx, gx, 980, 420, gc, 0.9));
  neonSign(ctx, 210, 110, 240, 250, '사랑', 'rgb(255,120,200)', t, 1, 92);
  neonSign(ctx, 1500, 90, 240, 250, '안녕', 'rgb(90,235,255)', t, 2, 92);
  // latin cafe sign
  { const fl = 0.9 + 0.1 * Math.sin(t * 19); ctx.save(); ctx.translate(1000, 330); A.glow(ctx, 130, 45, 300, 'rgb(190,150,255)', 0.5 * fl); A.rrect(ctx, 0, 0, 260, 90, 20); ctx.fillStyle = '#150B3A'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke();
    A.text(ctx, 'CAFE', 130, 48, { font: '800 52px Rubik', fill: '#fff', stroke: 'rgba(190,150,255,0.6)', lw: 14 }); ctx.restore(); }
  // wet street reflection streaks
  ctx.save(); ctx.globalAlpha = 0.5; [[330, '#FF78C8'], [1620, '#5AEBFF'], [1130, '#BE96FF']].forEach(([gx, gc]) => { ctx.fillStyle = A.linear(ctx, 0, 860, 0, 1080, [[0, gc], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(gx - 90, 860, 180, 240); }); ctx.restore();
  // ripples
  ctx.lineWidth = 4; for (let i = 0; i < 7; i++) { const rp = ((t * 1.4 + i * 0.37) % 1), rx = 200 + hash(i) * 1500, ry = 900 + hash(i + 3) * 150; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - rp)})`; ctx.beginPath(); ctx.ellipse(rx, ry, 10 + rp * 60, 3 + rp * 14, 0, 0, TAU); ctx.stroke(); }
  // couple under umbrella
  const bob = Math.sin(lt * 5) * 3;
  ctx.save(); ctx.translate(0, bob);
  body(ctx, 725, 700, 110, 170, '#FFC2E0', '#3A3A6E'); body(ctx, 855, 705, 120, 170, '#5AD9E6', '#2B2B58');
  ctx.beginPath(); ctx.moveTo(700, 730); ctx.lineTo(900, 760); ctx.lineWidth = 0; ctx.stroke();
  umbrella(ctx, 790, 330, t);
  kidHead(ctx, 738, 640, 54, '#FFE0C8', '#1C1218', 'bob', 0.12, 'happy'); kidHead(ctx, 842, 646, 55, '#F6D2B4', '#241A2E', 'boy', -0.1, 'happy');
  // hands on handle
  A.ellipse(ctx, 790, 760, 20, 16); A.fillStroke(ctx, '#FFE0C8', 5);
  ctx.restore();
  // hearts rising from couple
  for (let i = 0; i < 9; i++) { const u = ((lt * 0.9 + i * 0.211) % 1), hx = 790 + Math.sin(u * 6 + i * 2) * 120 + (i - 4) * 30, hy = 260 - u * 260, hs = 18 + hash(i) * 22; ctx.globalAlpha = Math.min(1, u * 5) * (1 - u * 0.6); heart(ctx, hx, hy, hs, Math.sin(i + u * 4) * 0.4); A.fillStroke(ctx, i % 2 ? '#FF6FB5' : '#FFB0DC', 5); }
  ctx.globalAlpha = 1;
  // finger-heart character
  ctx.save(); const cx = 1480, cyb = 700; ctx.translate(0, Math.sin(lt * 6 + 1) * 3);
  body(ctx, cx, cyb, 190, 190, '#7FF3C9', '#3A3A6E');
  // long hair back
  A.blob(ctx, [[cx - 100, cyb + 90], [cx - 118, 480], [cx - 60, 385], [cx + 60, 385], [cx + 118, 480], [cx + 100, cyb + 90]]); A.fillStroke(ctx, '#B79CFF', 6);
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 60, cyb + 40); ctx.quadraticCurveTo(cx - 190, 640, 1400, 500); ctx.lineWidth = 50; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 36; ctx.strokeStyle = '#7FF3C9'; ctx.stroke();
  kidHead(ctx, cx, 520, 88, '#FFE3CC', '#B79CFF', 'bob', 0.05, 'wink');
  // hand + crossed fingers
  A.ellipse(ctx, 1400, 496, 32, 28); A.fillStroke(ctx, '#FFE3CC', 6);
  ctx.strokeStyle = O; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(1380, 480); ctx.lineTo(1414, 424); ctx.moveTo(1424, 484); ctx.lineTo(1388, 424); ctx.stroke();
  ctx.strokeStyle = '#FFE3CC'; ctx.lineWidth = 12; ctx.stroke();
  ctx.restore();
  // finger heart pops on beat
  const hp = ease.outBack(inv(14.08, 14.28, t)), hb = 1 + 0.12 * pulse(t, 14.3, 0.2) + 0.08 * pulse(t, 14.45, 0.2);
  if (hp > 0) { A.glow(ctx, 1401, 350, 300, 'rgb(255,100,190)', 0.9); heart(ctx, 1401, 350, 78 * hp * hb); A.fillStroke(ctx, A.linear(ctx, 0, 300, 0, 400, [[0, '#FF9DD2'], [1, '#FF3E9C']]), 8);
    heart(ctx, 1380, 335, 20 * hp); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    for (let i = 0; i < 5; i++) sparkle(ctx, 1401 + Math.cos(i * 1.3 + lt * 2) * 130, 350 + Math.sin(i * 1.3 + lt * 2) * 90, 14 + 8 * Math.sin(t * 20 + i * 2), '#fff', i); }
  ctx.restore();
  // rain (screen space)
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 150; i++) { const sp = 1500 + hash(i) * 900, rx = (hash(i + 5) * 2300 - 200 - t * 300 * 0.35 * 0 ), ry = ((hash(i + 11) * 1300 + t * sp) % 1300) - 100, ln = 50 + hash(i + 2) * 60; const px = rx + ry * 0.27; ctx.moveTo(px, ry); ctx.lineTo(px - ln * 0.27, ry - ln); }
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(200,240,255,0.55)'; ctx.stroke(); ctx.restore();
  // hard-cut flash at entry + pink pop
  if (t < 14.05) { ctx.fillStyle = `rgba(255,150,220,${0.8 * (1 - inv(14.0, 14.05, t))})`; ctx.fillRect(0, 0, 1920, 1080); }
  // small title pill
  const p = inv(14.03, 14.2, t);
  if (p > 0) { const sc = ease.outBack(p); ctx.save(); ctx.translate(960, 850); ctx.scale(sc, sc); ctx.font = '800 50px Rubik'; const w = ctx.measureText('סדרות קוריאניות').width + 90;
    A.rrect(ctx, -w / 2, -42, w, 84, 42); ctx.fillStyle = 'rgba(21,11,58,0.85)'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke(); A.rrect(ctx, -w / 2 + 7, -35, w - 14, 70, 35); ctx.lineWidth = 4; ctx.strokeStyle = '#FF8FD0'; ctx.stroke();
    A.text(ctx, 'סדרות קוריאניות', 0, 3, { font: '800 50px Rubik', fill: '#FFD9F0', dir: 'rtl' }); ctx.restore(); }
}

// ============================================================================
// ANIME
// ============================================================================
function speedLines(ctx, cx, cy, t, r0, col, n = 64, thick = 1) {
  ctx.fillStyle = col; const fr = Math.floor(t * 15);
  for (let i = 0; i < n; i++) { const a = i / n * TAU + hash(i + fr * 3) * 0.05, w = (0.012 + hash(i * 7 + fr) * 0.03) * thick, rr = r0 * (0.8 + hash(i + 50 + fr) * 0.8);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.lineTo(cx + Math.cos(a - w) * 1700, cy + Math.sin(a - w) * 1700); ctx.lineTo(cx + Math.cos(a + w) * 1700, cy + Math.sin(a + w) * 1700); ctx.closePath(); ctx.fill(); }
}
function petals(ctx, t, n, a = 1) {
  for (let i = 0; i < n; i++) { const sp = 300 + hash(i) * 500, px = ((hash(i + 3) * 2300 - t * sp * 0.9) % 2300 + 2300) % 2300 - 200, py = ((hash(i + 8) * 1200 + t * sp * 0.5) % 1300) - 100 + Math.sin(t * 5 + i) * 30;
    ctx.save(); ctx.translate(px, py); ctx.rotate(t * 4 + i * 2); ctx.scale(1, 0.6 + 0.4 * Math.sin(t * 7 + i)); const s = 14 + hash(i + 20) * 14;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s, -s * 0.8, s * 0.8, s * 0.8, 0, s); ctx.bezierCurveTo(-s * 0.8, s * 0.8, -s, -s * 0.8, 0, -s); ctx.closePath();
    ctx.fillStyle = hash(i + 4) > 0.5 ? '#FFB7D5' : '#FF8FBF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#A02460'; ctx.stroke(); ctx.restore(); }
}
function aura(ctx, cx, cy, r, t, col1, col2) {
  const fr = Math.floor(t * 20);
  [[1.0, col1, 0], [0.68, col2, 7]].forEach(([k, col, off]) => {
    ctx.beginPath(); const n = 16;
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i / (n * 2) - 0.5) * TAU * 0.98 + 0, tall = (0.7 + hash(i * 3 + fr + off) * 0.75) * (i % 2 ? 1 : 0.55), rr = r * k * (0.75 + tall * 0.7) * (1 + 0.25 * Math.max(0, -Math.sin(a + Math.PI / 2))); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr * 1.0, cy + Math.sin(a) * rr * 1.25); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); });
}
function hero(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.aura) { A.glow(ctx, 0, 60, 520, 'rgba(255,220,60,0.9)', 0.9); aura(ctx, 0, 80, 330, t, 'rgba(255,214,40,0.92)', 'rgba(255,255,220,0.95)'); }
  if (o.body) { // torso + arms
    const sh = Math.sin(t * 90) * 2;
    ctx.beginPath(); ctx.moveTo(-70, 110); ctx.lineTo(-250, 190); ctx.lineTo(-290, 560); ctx.lineTo(290, 560); ctx.lineTo(250, 190); ctx.lineTo(70, 110); ctx.closePath(); A.fillStroke(ctx, '#FF7A1A', 8);
    ctx.beginPath(); ctx.moveTo(-90, 110); ctx.lineTo(0, 300); ctx.lineTo(90, 110); ctx.lineTo(60, 100); ctx.lineTo(0, 190); ctx.lineTo(-60, 100); ctx.closePath(); A.fillStroke(ctx, '#1E2A78', 6);
    [-1, 1].forEach(d => { ctx.save(); ctx.translate(d * 300 + sh * d, 330); A.ellipse(ctx, 0, 0, 62, 62); A.fillStroke(ctx, '#FFDDBF', 8); ctx.beginPath(); ctx.moveTo(d * -20, -10); ctx.lineTo(d * 30, 10); ctx.moveTo(d * -20, 14); ctx.lineTo(d * 30, 26); ctx.lineWidth = 5; ctx.strokeStyle = O; ctx.stroke(); ctx.restore(); });
    ctx.beginPath(); ctx.rect(-40, 60, 80, 70); A.fillStroke(ctx, '#F5C9A0', 6);
  }
  // spikes
  const sp = [[-200, 300], [-160, 260], [-120, 340], [-80, 300], [-40, 360], [0, 320], [40, 380], [80, 300], [120, 350], [160, 270], [200, 320], [-235, 210], [235, 210]];
  sp.forEach(([ang, len], i) => { const a = (ang - 90 + (ang === 0 ? 0 : 0)) / 180 * Math.PI * 0.62 - Math.PI / 2 + 0; const b = 0.2, L = len * (1 + 0.05 * Math.sin(t * 30 + i)); const bx = Math.cos(a) * 120, by = Math.sin(a) * 125 - 10;
    ctx.beginPath(); ctx.moveTo(Math.cos(a - b) * 120, Math.sin(a - b) * 125 - 10); ctx.lineTo(Math.cos(a + 0.05) * L, Math.sin(a + 0.05) * L * 0.95 - 30); ctx.lineTo(Math.cos(a + b) * 120, Math.sin(a + b) * 125 - 10); ctx.closePath();
    A.fillStroke(ctx, i % 2 ? '#FFD52E' : '#FFC01A', 7); });
  // face
  A.blob(ctx, [[-118, -20], [-100, 80], [-40, 135], [0, 145], [40, 135], [100, 80], [118, -20], [95, -95], [0, -125], [-95, -95]]); A.fillStroke(ctx, '#FFDDBF', 8);
  A.ellipse(ctx, -122, 20, 16, 28); A.fillStroke(ctx, '#FFDDBF', 6); A.ellipse(ctx, 122, 20, 16, 28); A.fillStroke(ctx, '#FFDDBF', 6);
  // eyes
  [-1, 1].forEach(d => { ctx.save(); ctx.translate(d * 52, 12);
    A.ellipse(ctx, 0, 0, 40, 50); A.fillStroke(ctx, '#fff', 6);
    ctx.save(); A.ellipse(ctx, 0, 0, 40, 50); ctx.clip(); A.ellipse(ctx, d * 2, 4, 31, 44); ctx.fillStyle = A.linear(ctx, 0, -40, 0, 50, [[0, '#0B2A8A'], [0.35, '#1E6BFF'], [1, '#7FF0FF']]); ctx.fill();
    A.ellipse(ctx, d * 2, 2, 14, 21); ctx.fillStyle = '#0B0620'; ctx.fill(); ctx.restore();
    A.ellipse(ctx, -9, -16, 12, 15); ctx.fillStyle = '#fff'; ctx.fill(); A.ellipse(ctx, 12, 20, 6, 8); ctx.fill(); sparkle(ctx, 14, -22, 8 + 3 * Math.sin(t * 25), '#fff', 0);
    ctx.beginPath(); ctx.ellipse(0, 0, 41, 51, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.lineWidth = 12; ctx.strokeStyle = O; ctx.stroke(); ctx.restore(); });
  [-1, 1].forEach(d => { ctx.beginPath(); ctx.moveTo(d * 96, -62); ctx.lineTo(d * 20, -36); ctx.lineWidth = 15; ctx.strokeStyle = '#C88A0A'; ctx.stroke(); });
  // mouth shout
  ctx.beginPath(); ctx.moveTo(-34, 82); ctx.quadraticCurveTo(0, 72, 34, 82); ctx.quadraticCurveTo(30, 126, 0, 128); ctx.quadraticCurveTo(-30, 126, -34, 82); ctx.closePath(); A.fillStroke(ctx, '#8A0F2A', 6);
  ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-40, 78, 80, 16); ctx.fillStyle = '#FF7A9A'; A.ellipse(ctx, 0, 128, 24, 18); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-6, 58); ctx.lineTo(0, 62); ctx.lineWidth = 4; ctx.strokeStyle = O; ctx.stroke();
  // sweat + blush lines
  ctx.strokeStyle = 'rgba(255,60,90,0.6)'; ctx.lineWidth = 4; [-1, 1].forEach(d => { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(d * (78 + i * 12), 62); ctx.lineTo(d * (86 + i * 12), 78); ctx.stroke(); } });
  // bangs
  [[-70, -110, -35, 20, -10], [-15, -125, 20, 15, 5], [45, -118, 80, 10, 0]].forEach(([bx, by, tx, ty], i) => { ctx.beginPath(); ctx.moveTo(bx - 34, by); ctx.lineTo(tx + i * 6 - 10, ty + 20); ctx.lineTo(bx + 40, by); ctx.closePath(); A.fillStroke(ctx, '#FFD52E', 6); });
  ctx.beginPath(); ctx.moveTo(-110, -92); ctx.quadraticCurveTo(0, -150, 110, -92); ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.stroke();
  ctx.restore();
}
function animeShot1(ctx, t) {
  const lt = t - 14.6, p = inv(14.6, 14.8, t), z = 0.95 + 0.4 * p;
  ctx.fillStyle = A.radial(ctx, 960, 470, 0, 1300, [[0, '#FFFFFF'], [0.3, '#8BE3FF'], [1, '#3B5BFF']]); ctx.fillRect(0, 0, 1920, 1080);
  speedLines(ctx, 960, 470, t, 260, 'rgba(255,255,255,0.85)', 70);
  speedLines(ctx, 960, 470, t + 0.03, 420, 'rgba(20,30,140,0.45)', 40, 0.6);
  ctx.save(); ctx.translate(960 + Math.sin(t * 120) * 6, 500 + Math.cos(t * 140) * 5); ctx.scale(z, z); ctx.translate(-960, -500);
  hero(ctx, 960, 430, 1.0, t, { aura: true, body: true });
  ctx.restore();
  petals(ctx, t, 26);
  const lp = ease.outBack(inv(14.63, 14.74, t));
  if (lp > 0) { ctx.save(); ctx.translate(360, 830); ctx.rotate(-0.09); ctx.scale(lp, lp); ctx.font = '900 96px Rubik'; const w = ctx.measureText('אנימה').width + 90;
    ctx.fillStyle = O; ctx.fillRect(-w / 2 + 10, -66 + 10, w, 130); ctx.fillStyle = '#FFE23A'; ctx.fillRect(-w / 2, -66, w, 130); ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.strokeRect(-w / 2, -66, w, 130);
    A.text(ctx, 'אנימה', 0, 4, { font: '900 96px Rubik', fill: '#E0184F', stroke: '#fff', lw: 0, dir: 'rtl' }); ctx.restore(); }
}
function animeEyes(ctx, t) {
  const p = inv(14.8, 14.9, t);
  ctx.fillStyle = '#FFF7C8'; ctx.fillRect(0, 0, 1920, 1080); ctx.fillStyle = '#FF9BD0';
  speedLines(ctx, 960, 440, t, 300, 'rgba(255,90,150,0.6)', 80);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1920, 1080); ctx.clip();
  hero(ctx, 960 + Math.sin(t * 100) * 8, 450 - 10 + 0, 3.4 + 0.5 * p, t, {});
  ctx.restore();
  petals(ctx, t + 3, 14);
  // radial white streaks over
  speedLines(ctx, 960, 440, t + 0.7, 700, 'rgba(255,255,255,0.7)', 30, 0.5);
}
function animeImpact(ctx, t) {
  const inverted = t < 14.93;
  const bg = inverted ? '#000' : '#fff', fg = inverted ? '#fff' : '#000';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
  speedLines(ctx, 960, 470, t, 180, fg, 90, 1.4);
  if (inverted) return;
  const lt = t - 14.93, sc = 1 + 0.5 * ease.out(inv(14.93, 14.99, t)) * 0 + 0.12 * (1 - inv(14.93, 15.05, t));
  ctx.save(); ctx.translate(960 + Math.sin(t * 200) * 12, 470 + Math.cos(t * 230) * 10); ctx.rotate(-0.08); ctx.scale(sc * 1.05, sc * 1.05);
  D.starburst(ctx, 0, 0, 260, 520, 14, 0.2, '#FFE23A'); ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.stroke();
  glyphs(ctx, 'ドン', -330, -250, 330, 350, [[120, '#000'], [72, '#E0184F']]);
  glyphs(ctx, '!', 300, -250, 330, 350, [[120, '#000'], [72, '#E0184F']]);
  ctx.restore();
  // shockwave ring
  ctx.beginPath(); ctx.arc(960, 470, 200 + 900 * ease.out(inv(14.93, 15.05, t)), 0, TAU); ctx.lineWidth = 30 * (1 - inv(14.93, 15.05, t)); ctx.strokeStyle = '#000'; ctx.stroke();
}
function animeAll(ctx, t) {
  if (t < 14.633) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1920, 1080); }
  else if (t < 14.80) animeShot1(ctx, t);
  else if (t < 14.90) animeEyes(ctx, t);
  else animeImpact(ctx, t);
}

// ============================================================================
// CONTENT WALL
// ============================================================================
const PAL = [['#FF7A59', '#C2255C'], ['#3DDC97', '#0B7A6B'], ['#7C5CFF', '#2B1B8A'], ['#FFC24A', '#E8590C'], ['#38D9F5', '#1864AB'], ['#FF4F9A', '#7B1FA2'], ['#A9E34B', '#2B8A3E'], ['#FF6B6B', '#861B2D'], ['#74C0FC', '#5F3DC4'], ['#FFD43B', '#F08C00']];
const KINDS = ['ילדים', 'בישול', 'דוקו', 'ריאליטי', 'קומדיה', 'דרמה', 'ספורט', 'מוזיקה', 'חדשות', 'חלל', 'טבע', 'רומנטיקה'];
function motif(ctx, k, sd) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (k) {
    case 0: A.ellipse(ctx, -44, -46, 24, 24); A.fillStroke(ctx, '#A8642E', 6); A.ellipse(ctx, 44, -46, 24, 24); A.fillStroke(ctx, '#A8642E', 6); A.ellipse(ctx, 0, 0, 62, 58); A.fillStroke(ctx, '#C88040', 6); A.ellipse(ctx, 0, 18, 30, 22); A.fillStroke(ctx, '#F5D2A0', 5);
      A.ellipse(ctx, -22, -12, 7, 8); ctx.fillStyle = O; ctx.fill(); A.ellipse(ctx, 22, -12, 7, 8); ctx.fill(); A.ellipse(ctx, 0, 10, 9, 6); ctx.fill(); break;
    case 1: ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(60, -10); ctx.lineTo(50, 60); ctx.lineTo(-50, 60); ctx.closePath(); A.fillStroke(ctx, '#C9CED6', 6); ctx.beginPath(); ctx.rect(-70, -26, 140, 18); A.fillStroke(ctx, '#E9ECEF', 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 8; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 26, -40); ctx.quadraticCurveTo(i * 26 + 14, -60, i * 26, -80); ctx.stroke(); } break;
    case 2: A.ellipse(ctx, 0, 0, 66, 66); A.fillStroke(ctx, '#3D9BE9', 6); ctx.save(); A.ellipse(ctx, 0, 0, 66, 66); ctx.clip(); A.blob(ctx, [[-50, -20], [-20, -50], [10, -30], [0, 0], [-25, 20], [-40, 5]]); ctx.fillStyle = '#4CC45E'; ctx.fill(); A.blob(ctx, [[20, 10], [50, 0], [55, 35], [30, 55], [15, 35]]); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, 26, 66, 0, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); break;
    case 3: ctx.beginPath(); ctx.rect(-60, -34, 100, 68); A.fillStroke(ctx, '#495057', 6); ctx.beginPath(); ctx.moveTo(40, -14); ctx.lineTo(66, -30); ctx.lineTo(66, 30); ctx.lineTo(40, 14); ctx.closePath(); A.fillStroke(ctx, '#343A40', 6);
      A.ellipse(ctx, -10, 0, 22, 22); A.fillStroke(ctx, '#74C0FC', 5); A.ellipse(ctx, -44, -20, 6, 6); ctx.fillStyle = '#FF3B3B'; ctx.fill(); break;
    case 4: A.ellipse(ctx, 0, 0, 64, 64); A.fillStroke(ctx, '#FFD43B', 6); A.ellipse(ctx, -22, -14, 8, 11); ctx.fillStyle = O; ctx.fill(); A.ellipse(ctx, 22, -14, 8, 11); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-36, 8); ctx.quadraticCurveTo(0, 62, 36, 8); ctx.closePath(); A.fillStroke(ctx, '#8A1030', 5); ctx.save(); ctx.clip(); A.ellipse(ctx, 0, 40, 18, 14); ctx.fillStyle = '#FF6B8B'; ctx.fill(); ctx.restore(); break;
    case 5: A.blob(ctx, [[-56, -50], [56, -50], [60, 10], [30, 56], [0, 66], [-30, 56], [-60, 10]]); A.fillStroke(ctx, '#F8F9FA', 6);
      ctx.beginPath(); ctx.moveTo(-40, -14); ctx.quadraticCurveTo(-24, -28, -8, -12); ctx.moveTo(8, -12); ctx.quadraticCurveTo(24, -28, 40, -14); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, 34); ctx.quadraticCurveTo(0, 14, 26, 34); ctx.stroke(); break;
    case 6: A.ellipse(ctx, 0, 0, 62, 62); A.fillStroke(ctx, '#fff', 6); ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 24, Math.sin(a) * 24); } ctx.closePath(); ctx.fillStyle = O; ctx.fill();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); ctx.lineWidth = 5; ctx.stroke(); } break;
    case 7: ctx.beginPath(); ctx.moveTo(-30, -56); ctx.lineTo(44, -70); ctx.lineTo(44, 24); ctx.lineTo(-30, 38); ctx.closePath(); A.fillStroke(ctx, '#fff', 6); A.ellipse(ctx, -46, 40, 24, 18); A.fillStroke(ctx, '#fff', 6); A.ellipse(ctx, 28, 28, 24, 18); A.fillStroke(ctx, '#fff', 6); break;
    case 8: A.rrect(ctx, -24, -62, 48, 82, 24); A.fillStroke(ctx, '#CED4DA', 6); ctx.beginPath(); ctx.moveTo(-42, -6); ctx.quadraticCurveTo(-42, 44, 0, 44); ctx.quadraticCurveTo(42, 44, 42, -6); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(0, 66); ctx.moveTo(-24, 66); ctx.lineTo(24, 66); ctx.stroke(); break;
    case 9: A.ellipse(ctx, 0, 0, 44, 44); A.fillStroke(ctx, '#FFA94D', 6); ctx.beginPath(); ctx.ellipse(0, 0, 76, 20, -0.4, 0, TAU); ctx.lineWidth = 9; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#FFE8CC'; ctx.stroke(); sparkle(ctx, 50, -52, 16, '#fff', 0); sparkle(ctx, -58, 50, 10, '#fff', 0); break;
    case 10: ctx.beginPath(); ctx.moveTo(-70, 56); ctx.lineTo(-26, -30); ctx.lineTo(6, 22); ctx.lineTo(34, -12); ctx.lineTo(72, 56); ctx.closePath(); A.fillStroke(ctx, '#6C8F5A', 6); ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(-40, -6); ctx.lineTo(-24, -12); ctx.lineTo(-14, -2); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); A.ellipse(ctx, 42, -46, 18, 18); A.fillStroke(ctx, '#FFE066', 5); break;
    default: heart(ctx, 0, 0, 78); A.fillStroke(ctx, '#FF4F7B', 7); ctx.beginPath(); ctx.moveTo(-30, -26); ctx.quadraticCurveTo(-46, -30, -48, -8); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
  }
}
const TW = 224, TH = 320, PX = 240, PY = 340, COLS = 12, ROWS = 5;
function poster(i) {
  const row = Math.floor(i / COLS), kind = (i * 7 + row * 5) % 12, pal = PAL[(i * 3 + row * 7 + Math.floor(i / 5)) % PAL.length];
  return A.layer('s2c_poster' + i, TW * 1.5, TH * 1.5, c => {
    c.scale(1.5, 1.5); A.rrect(c, 4, 4, TW - 8, TH - 8, 24); c.fillStyle = A.linear(c, 0, 0, 0, TH, [[0, pal[0]], [1, pal[1]]]); c.fill();
    c.save(); A.rrect(c, 4, 4, TW - 8, TH - 8, 24); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.13)'; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(TW / 2, 130); c.lineTo(TW / 2 + Math.cos(k * 1.05 + i) * 400, 130 + Math.sin(k * 1.05 + i) * 400); c.lineTo(TW / 2 + Math.cos(k * 1.05 + i + 0.5) * 400, 130 + Math.sin(k * 1.05 + i + 0.5) * 400); c.closePath(); c.fill(); }
    A.glow(c, TW / 2, 130, 130, 'rgba(255,255,255,0.5)', 0.7);
    c.save(); c.translate(TW / 2, 132); c.scale(1.1, 1.1); motif(c, kind, i); c.restore();
    c.fillStyle = 'rgba(14,11,46,0.78)'; c.fillRect(0, TH - 84, TW, 84); c.restore();
    A.text(c, KINDS[kind], TW / 2, TH - 52, { font: '800 36px Rubik', fill: '#fff', dir: 'rtl' });
    c.fillStyle = 'rgba(255,255,255,0.5)'; A.rrect(c, TW / 2 - 40, TH - 26, 80, 8, 4); c.fill();
    A.rrect(c, 4, 4, TW - 8, TH - 8, 24); c.lineWidth = 7; c.strokeStyle = O; c.stroke();
  });
}
function wallBack(c) {
  const W = COLS * PX, H = ROWS * PY;
  c.fillStyle = '#5B3220'; A.rrect(c, -50, -50, W + 100, H + 100, 26); c.fill(); c.lineWidth = 10; c.strokeStyle = O; c.stroke();
  c.fillStyle = '#231448'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2E1B5E'; for (let i = 0; i < COLS; i++) if (i % 2) c.fillRect(i * PX, 0, PX, H);
  for (let r = 0; r < ROWS; r++) { c.fillStyle = '#9A5A30'; c.fillRect(0, r * PY + 322, W, 18); c.fillStyle = '#C0793E'; c.fillRect(0, r * PY + 322, W, 6); c.lineWidth = 4; c.strokeStyle = O; c.strokeRect(0, r * PY + 322, W, 18); }
}
function wallCam(t) {
  const zoom = A.key(t, [[15.05, 3.4], [15.2, 2.3, 'out'], [15.32, 1.75, 'out'], [15.42, 1.7], [15.81, 0.56, 'inOut'], [16.11, 5.5, 'in']]);
  const rot = A.key(t, [[15.05, 0.3], [15.2, -0.1, 'out'], [15.32, 0.07, 'out'], [15.42, 0.0, 'out'], [15.81, 0]]);
  const hits = [15.14, 15.28, 15.42];
  const k = hits.reduce((a, h) => a + 0.07 * pulse(t, h, 0.13), 0);
  return { zoom: zoom * (1 + k), rot: rot + (t > 15.14 && t < 15.42 ? Math.sin(t * 60) * 0.004 : 0) };
}
function wallDraw(ctx, t, camz, alpha = 1) {
  const W = COLS * PX, H = ROWS * PY;
  const cxw = W / 2 + A.key(t, [[15.05, 300], [15.42, 0]], 'out'), cyw = H / 2 + A.key(t, [[15.05, 200], [15.42, 60], [15.81, 0]], 'out') - (t > 15.81 ? 0 : 0);
  ctx.save(); ctx.globalAlpha = alpha; camT(ctx, cxw, cyw, camz.zoom, camz.rot);
  ctx.drawImage(A.layer('s2c_wallback', W + 100, H + 100, c => { c.translate(50, 50); wallBack(c); }), -50, -50);
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS, row = Math.floor(i / COLS), tx = col * PX + PX / 2, ty = row * PY + PY / 2;
    const dist = Math.hypot(tx - W / 2, ty - H / 2), p0 = 15.06 + dist / 1700 * 0.22;
    const p = ease.outBack(inv(p0, p0 + 0.14, t)); if (p <= 0.01) continue;
    const bounce = 1 + (t > 15.42 ? 0.05 * pulse(t, 15.42 + (col + row) * 0.012, 0.15) : 0);
    ctx.save(); ctx.translate(tx, ty); ctx.scale(p * bounce, p * bounce); ctx.rotate((1 - Math.min(1, p)) * (hash(i) - 0.5) * 1.2); ctx.drawImage(poster(i), -TW / 2, -TH / 2, TW, TH); ctx.restore();
  }
  // glint sweep
  const gp = inv(15.55, 15.8, t);
  if (gp > 0 && gp < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gx = -400 + gp * (W + 800); ctx.translate(gx, 0); ctx.transform(1, 0, -0.35, 1, 0, 0); ctx.fillStyle = A.linear(ctx, -120, 0, 120, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-120, -50, 240, H + 100); ctx.restore(); }
  ctx.restore();
}
function shards(ctx, t) {
  const t0 = 15.13; if (t >= 15.5) return;
  const frames = [[330, 470, -0.07, 'tk'], [960, 470, 0.0, 'kr'], [1590, 470, 0.07, 'an']];
  const FW = 560, FH = 315;
  const snaps = { tk: A.layer('s2c_snap_tk', 640, 360, c => { c.scale(1 / 3, 1 / 3); turkBosphorus(c, 13.5); ribbon(c, 'סדרות תורכיות', 960, 800, 13.6, 13.34); }),
    kr: A.layer('s2c_snap_kr', 640, 360, c => { c.scale(1 / 3, 1 / 3); koreaFull(c, 14.45); }),
    an: A.layer('s2c_snap_an', 640, 360, c => { c.scale(1 / 3, 1 / 3); animeShot1(c, 14.75); }) };
  frames.forEach(([fx, fy, fr, key], fi) => {
    const pin = ease.outBack(inv(15.05, 15.11, t)), sc = A.lerp(1.5, 1, pin);
    const pts = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
    if (t < t0) { // intact frame with cracks
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(fr); ctx.scale(sc, sc);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-FW / 2 + 12, -FH / 2 + 16, FW, FH); ctx.drawImage(snaps[key], -FW / 2, -FH / 2, FW, FH);
      ctx.lineWidth = 12; ctx.strokeStyle = O; ctx.strokeRect(-FW / 2, -FH / 2, FW, FH); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeRect(-FW / 2 + 6, -FH / 2 + 6, FW - 12, FH - 12);
      const cr = inv(15.09, 15.13, t); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath();
      pts.forEach(([px, py], i) => { const ex = px * FW / 2 * cr, ey = py * FH / 2 * cr; ctx.moveTo(0, 0); ctx.lineTo(ex * 0.4 + (hash(i + fi) - 0.5) * 30, ey * 0.4 + 10); ctx.lineTo(ex, ey); }); ctx.stroke();
      ctx.restore();
    } else {
      const tau = t - t0;
      pts.forEach(([ax, ay], i) => {
        const [bx, by] = pts[(i + 1) % 8], dl = hash(fi * 8 + i) * 0.04, tt = Math.max(0, tau - dl), sp = 1500 + hash(i + fi * 9) * 700;
        const lx = (ax + bx) * FW / 6, ly = (ay + by) * FH / 6; // centroid (local, ignoring center)
        const wx = fx + lx * 1.0, wy = fy + ly * 1.0, dx = wx - 960, dy = wy - 500, dn = Math.hypot(dx, dy) || 1, dir = [dx / dn + (hash(i * 3) - 0.5) * 0.8, dy / dn + (hash(i * 5) - 0.5) * 0.8 + 0.5 * tt];
        const off = sp * tt * (0.4 + tt), a = 1 - inv(0.18, 0.37, tau);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(fx + dir[0] * off, fy + dir[1] * off + 900 * tt * tt * 0.5); ctx.rotate(fr + (hash(i + 2) - 0.5) * 6 * tt); ctx.scale(1 + tt, 1 + tt);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax * FW / 2, ay * FH / 2); ctx.lineTo(bx * FW / 2, by * FH / 2); ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(snaps[key], -FW / 2, -FH / 2, FW, FH); ctx.restore();
        ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
      });
    }
  });
}
function wallScene(ctx, t) {
  // background: violet with rays
  ctx.fillStyle = A.radial(ctx, 960, 540, 100, 1300, [[0, '#4A2AA8'], [1, '#0E0B2E']]); ctx.fillRect(0, 0, 1920, 1080);
  const cz = wallCam(t);
  if (t < 16.11) {
    if (t > 15.81) { // zoom-through tail: ghost samples for radial blur
      const u = inv(15.81, 16.11, t);
      for (let k = 3; k >= 1; k--) { const tt = t - k * 0.012; wallDraw(ctx, tt, wallCam(tt), 0.35); }
    }
    wallDraw(ctx, t, cz, 1);
  }
  if (t > 15.81) {
    const u = inv(15.81, 16.11, t);
    ctx.save(); ctx.translate(960, 540); ctx.fillStyle = `rgba(255,255,255,${0.5 * u})`; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + hash(i) * 0.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 300, Math.sin(a) * 300); ctx.lineTo(Math.cos(a - 0.015) * 1600, Math.sin(a - 0.015) * 1600); ctx.lineTo(Math.cos(a + 0.015) * 1600, Math.sin(a + 0.015) * 1600); ctx.closePath(); ctx.fill(); } ctx.restore();
    ctx.fillStyle = `rgba(14,11,46,${ease.in(inv(15.95, 16.11, t))})`; ctx.fillRect(0, 0, 1920, 1080);
  }
  shards(ctx, t);
  // headline
  const tp = ease.outBack(inv(15.14, 15.3, t)) * (1 - ease.inBack(inv(15.55, 15.72, t)));
  if (tp > 0.01) {
    const bump = pulse(t, 15.28, 0.12) + pulse(t, 15.42, 0.14);
    ctx.save(); ctx.translate(960, 520 - ease.inBack(inv(15.55, 15.72, t)) * 300); ctx.scale(tp * (1 + 0.07 * bump), tp * (1 + 0.07 * bump)); ctx.rotate(-0.03);
    ctx.font = '900 150px Rubik'; const w = ctx.measureText('ועוד המון תוכן').width + 120;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; A.rrect(ctx, -w / 2 + 10, -104 + 14, w, 210, 40); ctx.fill();
    A.rrect(ctx, -w / 2, -104, w, 210, 40); ctx.fillStyle = A.linear(ctx, 0, -104, 0, 106, [[0, '#4A2AA8'], [1, '#1B1050']]); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = O; ctx.stroke();
    A.rrect(ctx, -w / 2 + 12, -92, w - 24, 186, 30); ctx.lineWidth = 5; ctx.strokeStyle = '#FFC24A'; ctx.stroke();
    A.text(ctx, 'ועוד המון תוכן', 0, 4, { font: '900 150px Rubik', fill: '#FFC24A', stroke: O, lw: 18, dir: 'rtl' });
    ctx.restore();
  }
  if (t >= 15.13 && t < 15.17) { ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - inv(15.13, 15.17, t))})`; ctx.fillRect(0, 0, 1920, 1080); }
}

// ============================================================================
// ENTRY WHIP + COMPOSE
// ============================================================================
function whipIn(ctx, t) {
  const p = inv(13.10, 13.40, t), off = (1 - ease.out(p)) * 2300, vel = (1 - p) * (1 - p);
  ctx.save();
  ctx.beginPath(); ctx.rect(Math.max(0, off), 0, 1920, 1080); ctx.clip();
  // ghosts
  if (off > 40) for (let k = 3; k >= 1; k--) { ctx.save(); ctx.globalAlpha = 0.28; ctx.translate(off + k * 60 * vel * 2, 0); turkAll(ctx, t); ctx.restore(); }
  ctx.translate(off, 0); turkAll(ctx, t);
  ctx.restore();
  if (off > 2) {
    ctx.save(); ctx.translate(off, 0);
    ctx.fillStyle = A.linear(ctx, -120, 0, 0, 0, [[0, 'rgba(255,190,90,0)'], [1, 'rgba(255,200,110,0.95)']]); ctx.fillRect(-120, 0, 120, 1080);
    ctx.fillStyle = '#FFE9A8'; ctx.fillRect(-10, 0, 10, 1080);
    ctx.fillStyle = 'rgba(255,240,200,0.6)'; for (let i = 0; i < 16; i++) { const y = hash(i) * 1080, w = 200 + hash(i + 4) * 600 * vel; ctx.fillRect(-w, y, w, 3 + hash(i + 8) * 6); }
    ctx.restore();
  }
}
A.scene({
  name: 's2c_series', start: 13.10, end: 16.11,
  draw(ctx, s) {
    const t = s.t;
    if (t < 13.40) whipIn(ctx, t);
    else if (t < 14.00) turkAll(ctx, t);
    else if (t < 15.05) { if (t < 14.60) koreaFull(ctx, t); else animeAll(ctx, t); }
    else wallScene(ctx, t);
  }
});
})();
