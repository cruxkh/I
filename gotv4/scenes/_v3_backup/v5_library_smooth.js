// GOTV v5: V5a weekly library calendar (15.81-18.81) + V5b live wall / silky smooth hero (20.64-23.90)
(() => {
const { C, hexA, eob, eo, eio, rr, lin, rad, glow, sparkle } = V;
const { clamp, lerp, inv, smooth, hash, rng, TAU } = A;
const CORAL = '#FF6B6B', TEAL = '#2EE6C5', SUN = '#FFC24A';
const addv = (ctx, f) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; f(); ctx.restore(); };

// =====================================================================================
// SCENE A: weekly release calendar
// =====================================================================================
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DCOL = [['#FFC24A', '#FF8A3D'], ['#FF7B6B', '#FF4F9A'], ['#2EE6C5', '#1AA6D8'], ['#FFD86B', '#FFA23A'], ['#FF8E6B', '#FF4F6A'], ['#5AD1FF', '#3D7BFF'], ['#B48CFF', '#FF6BB5']];
const PAL = [['#FF6B6B', '#FFB347'], ['#2EE6C5', '#1B6FD8'], ['#B48CFF', '#FF6BB5'], ['#FFD86B', '#FF7A3D'], ['#5AD1FF', '#7B5BFF'], ['#FF4F9A', '#FFC24A']];
const PITCH = 690, T0 = 16.0, DT = 1 / 3, PW = 172, PH = 262;

const BRANDS = ['netflix', 'disney', 'prime', 'appletv', 'hbo', 'paramount', 'hulu', 'discovery', 'netflix', 'disney'];
function brandBadge(g, w, name, seed) {
  const im = V.logoImg && V.logoImg(name); if (!im) return;
  const bw = name === 'hbo' ? 34 : 110, bh = name === 'hbo' ? 34 : 28;
  g.save(); g.translate(w / 2, 24); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8;
  rr(g, -bw / 2 - 8, -bh / 2 - 5, bw + 16, bh + 10, 9); g.fillStyle = ['appletv', 'disney', 'hbo', 'paramount'].includes(name) ? 'rgba(6,12,44,.88)' : 'rgba(255,255,255,.94)'; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
  const sc = Math.min(bw / im.width, bh / im.height); g.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc); g.restore();
}
function poster(g, x, y, w, h, seed) {
  const P = PAL[seed % PAL.length], k = seed % 6;
  g.save(); g.translate(x, y);
  rr(g, 0, 0, w, h, 16); g.fillStyle = lin(g, 0, 0, w * .7, h, [[0, P[0]], [1, P[1]]]); g.fill();
  g.save(); rr(g, 0, 0, w, h, 16); g.clip();
  g.fillStyle = 'rgba(255,255,255,.9)';
  if (k === 0) { g.beginPath(); g.arc(w * .62, h * .3, w * .2, 0, TAU); g.fill(); g.fillStyle = 'rgba(10,20,70,.55)'; g.beginPath(); g.moveTo(0, h * .72); g.lineTo(w * .35, h * .4); g.lineTo(w * .62, h * .66); g.lineTo(w * .82, h * .5); g.lineTo(w, h * .72); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
  else if (k === 1) { g.beginPath(); g.arc(w / 2, h * .38, w * .3, 0, TAU); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w * .42, h * .3); g.lineTo(w * .64, h * .38); g.lineTo(w * .42, h * .46); g.fill(); }
  else if (k === 2) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? w * .12 : w * .32; g.lineTo(w / 2 + Math.cos(a) * r, h * .36 + Math.sin(a) * r); } g.closePath(); g.fill(); }
  else if (k === 4) { g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(w * .68, h * .26, w * .13, 0, TAU); g.fill(); g.fillStyle = 'rgba(8,16,60,.6)'; for (let i = 0; i < 6; i++) { const bx = i * 28 - 4, bh2 = 50 + hash(seed * 3 + i) * 90; g.fillRect(bx, h * .74 - bh2, 24, bh2 + 4); g.fillStyle = 'rgba(255,230,140,.85)'; for (let q = 0; q < 4; q++) g.fillRect(bx + 5 + (q % 2) * 9, h * .74 - bh2 + 10 + Math.floor(q / 2) * 16, 5, 7); g.fillStyle = 'rgba(8,16,60,.6)'; } }
  else if (k === 5) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 6; for (let i = 1; i < 5; i++) { g.beginPath(); g.arc(w / 2, h * .4, i * w * .12, 0, TAU); g.stroke(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h * .4, w * .07, 0, TAU); g.fill(); }
  else { g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 44, h * .7); g.lineTo(i * 44 + 22, h * .7); g.lineTo(i * 44 + 22 + 90, 0); g.lineTo(i * 44 + 90, 0); g.fill(); } g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(w * .4, h * .34, w * .17, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(8,14,50,.55)'; g.fillRect(0, h * .74, w, h * .26);
  g.fillStyle = 'rgba(255,255,255,.92)'; rr(g, w * .14, h * .8, w * .72, 12, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, w * .14, h * .9, w * .46, 9, 5); g.fill();
  g.fillStyle = lin(g, 0, 0, w, h * .5, [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h * .5);
  if (seed % 3 !== 0) brandBadge(g, w, BRANDS[(seed * 5 + 3) % BRANDS.length], seed);
  g.restore();
  rr(g, .5, .5, w - 1, h - 1, 16); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.75)'; g.stroke();
  g.restore();
}
function badge(g, x, y, s, T) {
  g.save(); g.translate(x, y); g.rotate(-.2); g.scale(s, s);
  g.beginPath(); for (let i = 0; i < 24; i++) { const a = i * TAU / 24, r = i % 2 ? 44 : 55; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
  g.fillStyle = lin(g, 0, -55, 0, 55, [[0, '#FF8A7A'], [1, '#FF3D5A']]); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
  V.text(g, 'חדש!', 0, 3, 36, { fill: '#fff', shadow: false }); g.restore();
}
function drawCard(i, T, veil) {
  const cv = A.layer('v5a_card' + i, 700, 980, () => {}), g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 700, 980);
  g.save(); g.translate(40, 40);
  const tf = T0 + i * DT, [c1, c2] = DCOL[i], sp = [];
  rr(g, 0, 0, 620, 900, 46); g.fillStyle = lin(g, 0, 0, 0, 900, [[0, '#FFF8EA'], [1, '#FFDDB8']]); g.fill();
  g.save(); rr(g, 0, 0, 620, 900, 46); g.clip();
  g.fillStyle = lin(g, 0, 0, 620, 200, [[0, c1], [1, c2]]); g.fillRect(0, 0, 620, 200);
  g.fillStyle = lin(g, 0, 0, 0, 110, [[0, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 620, 110);
  V.text(g, DAYS[i], 310, 112, 116, { fill: '#fff', shadowCol: 'rgba(140,30,0,.4)', shadowBlur: 0, shadowY: 7 });
  g.setLineDash([14, 10]); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(24, 186); g.lineTo(596, 186); g.stroke(); g.setLineDash([]);
  for (let s = 0; s < 2; s++) {
    const ny = 215 + s * 330, by = ny + 263; // niche top, shelf line
    rr(g, 24, ny, 572, 290, 30); g.fillStyle = lin(g, 0, ny, 0, ny + 290, [[0, '#0D2B4E'], [1, '#0A1740']]); g.fill();
    let landed = 0;
    for (let k = 0; k < 3; k++) {
      const td = tf + .1 + (s * 3 + k) * .04, dt = T - td; if (dt >= 0) landed += clamp((dt - .2) * 10);
    }
    glow(g, 310, by, 300, SUN, .18 + .5 * landed / 3);
    for (let k = 0; k < 3; k++) {
      const td = tf + .1 + (s * 3 + k) * .04, dt = T - td; if (dt < 0) continue;
      const px = 38 + k * 194, seed = i * 6 + s * 3 + k + 1, ds = dt - .2; let yo = 0, sx = 1, sy = 1;
      if (dt < .2) { yo = -430 * (1 - (dt / .2) ** 2); sy = 1.1; sx = .95; }
      else { const q = Math.exp(-ds * 13) * Math.cos(ds * 36); sy = 1 - .26 * q; sx = 1 + .17 * q; }
      g.save(); g.beginPath(); g.rect(24, ny - 500, 572, 500 + 290); g.clip();
      g.translate(px + PW / 2, by); g.scale(sx, sy); g.translate(-PW / 2, -PH + yo / sy);
      poster(g, 0, 0, PW, PH, seed);
      if ((s === 0 && k === 0) || (s === 1 && k === 2)) { const bt = inv(td + .3, td + .5, T); if (bt > 0) badge(g, k === 2 ? 26 : PW - 20, 74, eob(bt) * 1, T); }
      g.restore();
      if (ds > 0 && ds < .4) { const cx = px + PW / 2; for (let n = 0; n < 5; n++) { const a = n / 5 * TAU + hash(seed + n) * 1.5, r = 40 + ds * 300 * (.6 + hash(n + seed)), al = 1 - ds / .4; sp.push([cx + Math.cos(a) * r, by - 20 + Math.sin(a) * r * .5, 16 + 14 * hash(seed * 3 + n), n % 2 ? '#FFF3C4' : TEAL, a, al]); } }
    }
    g.fillStyle = lin(g, 0, by, 0, by + 27, [[0, '#FFF3C4'], [.4, '#FFC24A'], [1, '#E48A12']]); rr(g, 24, by, 572, 27, 13); g.fill();
  }
  // moving gloss sheen
  const sh = ((T * 1.4 + i * .3) % 2.6 - .8) * 620;
  g.fillStyle = lin(g, sh - 120, 0, sh + 120, 300, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 620, 900);
  if (veil > 0) { g.fillStyle = `rgba(8,12,44,${veil})`; g.fillRect(0, 0, 620, 900); }
  g.restore();
  [150, 470].forEach(x => { g.fillStyle = lin(g, x - 14, 0, x + 14, 0, [[0, '#8892B0'], [.5, '#F4F7FF'], [1, '#7C86A8']]); rr(g, x - 14, -26, 28, 72, 14); g.fill(); g.fillStyle = 'rgba(10,15,50,.55)'; g.beginPath(); g.arc(x, 30, 8, 0, TAU); g.fill(); });
  sp.forEach(s => sparkle(g, s[0], s[1], s[2], s[3], s[4], s[5]));
  g.restore();
  return cv;
}
function farWall(ctx, camx, T, k) {
  ctx.save(); ctx.globalAlpha = .55;
  for (let r = 0; r < 5; r++) {
    const y = 190 + r * 330, off = -camx * PITCH * .3 - r * 90;
    ctx.fillStyle = 'rgba(255,214,120,.5)'; ctx.fillRect(0, y + 236, 1080, 5);
    for (let n = -1; n < 8; n++) { const x = ((n * 190 + off) % 1520 + 1520) % 1520 - 190, P = PAL[(r * 3 + n + 12) % 6]; ctx.fillStyle = hexA(P[n & 1], .42); rr(ctx, x, y + 20 + hash(r * 9 + n) * 10, 120, 216, 12); ctx.fill(); }
  }
  ctx.restore();
}
function shelfWorld(ctx, camx, z, cy, alpha, T) {
  ctx.save(); ctx.globalAlpha = alpha;
  const cw = 195 * z, c0 = Math.floor((camx * PITCH - 540 / z) / 195 - 1), c1 = Math.ceil((camx * PITCH + 540 / z) / 195 + 1);
  for (let row = -4; row <= 5; row++) for (let s = 0; s < 2; s++) {
    const wy = row * 1000 + s * 330 - 320, sy = cy + wy * z; if (sy < -300 || sy > 2200) continue;
    ctx.fillStyle = 'rgba(255,205,110,.85)'; ctx.fillRect(0, sy + 236 * z, 1080, Math.max(3, 24 * z));
    ctx.fillStyle = 'rgba(255,190,90,.12)'; ctx.fillRect(0, sy + 236 * z - 60 * z, 1080, 60 * z);
    for (let c = c0; c <= c1; c++) {
      const wx = c * 195; if (row === 0 && wx > -340 && wx < 6 * PITCH + 340) continue;
      const sx = 540 + (wx - camx * PITCH) * z, h = hash(row * 131 + c * 7 + s), P = PAL[Math.floor(h * 6)];
      const pop = clamp((alpha * 1.6 - Math.hypot(row * .5, (c - 15) * .05) * .1)); ctx.fillStyle = P[(c + row) & 1]; rr(ctx, sx, sy + 236 * z - PH * z, PW * z, PH * z * (.94 + .1 * h), 14 * z); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(sx, sy + 236 * z - PH * z, PW * z, PH * z * .18);
    }
  }
  ctx.restore();
}
function camC(T) {
  let c = 0; for (let i = 1; i <= 6; i++) c += A.ease.inOut(inv(T0 + (i - 1) * DT + .3, T0 + i * DT + .5, T));
  return lerp(c, 3, A.ease.inOut(inv(18.55, 18.85, T)));
}
const NEWN = [4, 7, 12, 9, 15, 6, 21], TOTAL = 74;
const CONF = ['#FFC24A', '#FF4F9A', '#2EE6C5', '#5AD1FF', '#FFF3C4', '#FF6B6B', '#B48CFF'];
function counterChip(ctx, T, pull) {
  // "+N חדשים" kinetic stamp, bottom of the card zone (y 1130), counts up on every day landing
  let n = 0, popT = -9, big = 0;
  for (let i = 0; i < 7; i++) { const tl = T0 + i * DT + .22; if (T >= tl) { popT = tl; n = i; } }
  if (popT < 0) return;
  const ft = 18.6; let val, tp;
  if (T < ft) { const q = A.ease.out(inv(popT, popT + .24, T)); val = Math.round(lerp(n ? NEWN[n - 1] : 0, NEWN[n], q)); tp = T - popT; }
  else { const q = A.ease.out(inv(ft, ft + .6, T)); val = Math.round(TOTAL * q); tp = T - ft; big = 1; }
  const sc = 1 + .32 * Math.exp(-tp * 9) * Math.cos(tp * 16), a = T < ft ? 1 : 1;
  const cy = big ? lerp(1130, 1090, eo(inv(ft, ft + .3, T))) : 1130, w = big ? 620 : 520;
  ctx.save(); ctx.translate(540, cy); ctx.rotate(-.05 + (big ? .05 : 0) + (n % 2 ? .02 : -.02)); ctx.scale(sc * (big ? 1.06 : 1), sc * (big ? 1.06 : 1));
  addv(ctx, () => glow(ctx, 0, 0, 420, big ? '#FFC24A' : DCOL[n][0], .55));
  ctx.shadowColor = 'rgba(0,0,30,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  rr(ctx, -w / 2, -66, w, 132, 66); ctx.fillStyle = lin(ctx, 0, -66, 0, 66, [[0, '#FFF3C4'], [.5, '#FFC24A'], [1, '#FF8A3D']]); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.save(); rr(ctx, -w / 2, -66, w, 132, 66); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-w / 2, -66, w, 52); ctx.restore();
  V.text(ctx, '+' + val, w / 2 - 34, 6, 104, { fill: '#5A2200', shadow: false, align: 'right', dir: 'ltr', weight: 900 });
  V.text(ctx, big ? 'חדשים' : 'חדשים', -w / 2 + 40, 8, 66, { fill: '#5A2200', shadow: false, align: 'left', dir: 'rtl', weight: 800 });
  ctx.restore();
}
function overlaysA(ctx, T, pull) {
  // light leaks (warm anamorphic bands sweeping on every landing)
  for (let i = 0; i < 7; i++) {
    const tl = T0 + i * DT + .2, q = (T - tl) / .7; if (q < 0 || q > 1) continue;
    addv(ctx, () => { ctx.save(); ctx.translate(540, 700); ctx.rotate(i % 2 ? .5 : -.5); const x = lerp(-1500, 1500, A.ease.out(q)); ctx.globalAlpha = .3 * (1 - q) * Math.sin(Math.PI * Math.min(1, q * 1.4 + .1));
      ctx.fillStyle = lin(ctx, x - 260, 0, x + 260, 0, [[0, 'rgba(255,90,60,0)'], [.35, DCOL[i][1]], [.5, '#FFF3C4'], [.7, DCOL[i][0]], [1, 'rgba(255,60,120,0)']]); ctx.fillRect(x - 260, -1500, 520, 3000); ctx.restore(); });
  }
  // confetti cannons
  for (let i = 0; i < 7; i++) {
    const tl = T0 + i * DT + .2, lu = T - tl; if (lu < 0 || lu > 1.3) continue;
    const dir = i % 2 ? 1 : -1, ox = dir > 0 ? 1080 - 20 : 20;
    for (let n = 0; n < 30; n++) {
      const r1 = hash(i * 50 + n), r2 = hash(i * 50 + n + 300), r3 = hash(i * 50 + n + 700);
      const vx = -dir * (300 + r1 * 900), vy = -(900 + r2 * 1200);
      const x = ox + vx * lu, y = 1050 + vy * lu + 2100 * lu * lu * .5, al = 1 - inv(.8, 1.3, lu);
      ctx.save(); ctx.translate(x, y); ctx.rotate(lu * (r3 - .5) * 20); ctx.scale(1, Math.cos(lu * 12 + r1 * 9)); ctx.globalAlpha = al; ctx.fillStyle = CONF[(n + i) % 7];
      if (n % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 8 + r2 * 6, 0, TAU); ctx.fill(); } else ctx.fillRect(-9 - r1 * 6, -5, 18 + r1 * 12, 10); ctx.restore();
    }
  }
  counterChip(ctx, T, pull);
}
function drawA(ctx, T) {
  const u = T - 15.81, pull = A.ease.inOut(inv(18.55, 18.85, T));
  const c = camC(T), z = lerp(1 + .05 * (1 - inv(15.8, 18.5, T)), .27, pull), cy = lerp(700 + Math.sin(T * 2) * 8, 760, pull);
  // bg
  A.layer('v5a_bg', 1080, 1920, g => { g.fillStyle = lin(g, 0, 0, 0, 1920, [[0, '#0E1A5C'], [.5, '#0B1450'], [1, '#070C30']]); g.fillRect(0, 0, 1080, 1920); }); ctx.drawImage(A._cache.get('v5a_bg'), 0, 0);
  glow(ctx, 160 + Math.sin(T * .8) * 90, 300, 950, CORAL, .42); glow(ctx, 940 + Math.cos(T * .7) * 90, 820, 950, TEAL, .34); glow(ctx, 540, 1550, 1000, SUN, .3);
  // camera: crash zoom into each landing + alternating dutch tilt + slow roll
  const li = clamp(Math.floor((T - T0 - .2) / DT), 0, 6), ldt = Math.max(0, T - (T0 + li * DT + .2)), on = T > T0 + .2 ? 1 : 0;
  const crash = on * Math.exp(-ldt * 9) * (1 - pull), dutch = on * (li % 2 ? 1 : -1) * (.06 * Math.exp(-ldt * 4.5) + .012) * (1 - pull);
  const sh = on * Math.exp(-ldt * 14) * (1 - pull);
  ctx.save(); ctx.translate(540 + A.noise1(T * 40) * 9 * sh, 700 + A.noise1(T * 40 + 9) * 9 * sh); ctx.rotate(dutch + .02 * Math.sin(T * 1.3) * (1 - pull)); ctx.scale(1 + .13 * crash, 1 + .13 * crash); ctx.translate(-540, -700);
  V.bokeh(ctx, T, { n: 26, cols: [SUN, CORAL, TEAL, '#FFF3C4'], seed: 11, alpha: 1.1 });
  farWall(ctx, c, T);
  const sw = smooth(18.35, 18.75, T); if (sw > 0) shelfWorld(ctx, c, z, cy, sw, T);
  // cards far to near
  const order = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => Math.abs(c - b) - Math.abs(c - a));
  const proj = i => { const o = c - i; return { X: 540 + o * PITCH * z, o }; };
  order.forEach(i => {
    const tf = T0 + i * DT; if (T < tf) return; const { X, o } = proj(i), ao = Math.abs(o);
    const sc = z * (1 - lerp(.07, 0, pull) * Math.min(ao, 2)); if (Math.abs(X - 540) > 540 + 480 * sc) return;
    const tp = inv(tf, tf + .3, T), rx = -1.45 * (1 - eob(tp)), Hc = 900 * sc;
    const cv = drawCard(i, T, Math.min(.5, ao * .17) * (1 - pull));
    const ry = -clamp(o * .3, -.8, .8) * (1 - pull), Yc = cy + (Hc / 2) * (Math.cos(rx) - 1);
    ctx.save(); ctx.globalAlpha = smooth(0, .12, tp);
    // glow behind card
    glow(ctx, X, Yc, 620 * sc, hexA(DCOL[i][0], 1), .3 * (1 - Math.min(1, ao)));
    V.card3d(ctx, cv, X, Yc, 700 * sc, 980 * sc, ry, rx, 1500, 6, 9);
    ctx.restore();
    // landing FX
    const tl = tf + .2, lu = T - tl;
    if (lu > 0 && lu < .45) {
      addv(ctx, () => { ctx.globalAlpha = (1 - lu / .45) * .8; ctx.strokeStyle = '#FFF3C4'; ctx.lineWidth = 8 * (1 - lu / .45) + 1; ctx.beginPath(); ctx.ellipse(X, Yc - Hc * .38, (200 + lu * 900) * sc, (40 + lu * 160) * sc, 0, 0, TAU); ctx.stroke(); });
      for (let n = 0; n < 9; n++) { const r = rng(i * 40 + n)(), rr2 = rng(i * 40 + n + 90)(); const px = X + (r - .5) * 500 * sc + (r - .5) * lu * 900 * sc, py = Yc - Hc * .4 + lu * 600 * sc * rr2 - 160 * sc * Math.sin(lu * 5) * (1 - rr2) + lu * lu * 800 * sc;
        ctx.save(); ctx.translate(px, py); ctx.rotate(lu * (r - .5) * 14); ctx.globalAlpha = 1 - lu / .45; ctx.fillStyle = n % 2 ? '#FFF6E0' : DCOL[i][0]; ctx.fillRect(-11 * sc * 2, -7 * sc * 2, 22 * sc * 2, 14 * sc * 2); ctx.restore(); }
    }
  });
  // today marker
  const m = clamp(Math.floor((T - T0) / DT), 0, 6);
  if (T > T0 + .12) {
    const hp = inv(T0 + m * DT + .1, T0 + m * DT + .3, T), a = proj(Math.max(0, m - 1)).X, b = proj(m).X;
    const mx = lerp(a, b, eob(hp)), my = lerp(700, 700, 0) - 450 * lerp(z, .27, 0) * (pull > 0 ? z : z) - 60 - 60 * Math.sin(Math.PI * clamp(hp)) * (1 - pull) + cy - 700;
    ctx.save(); ctx.translate(mx, Math.max(120, my)); const ms = lerp(1, .8, pull), sq = 1 + .1 * Math.sin(Math.PI * clamp(hp)); ctx.scale(ms / sq, ms * sq);
    glow(ctx, 0, 0, 200, SUN, .6);
    ctx.beginPath(); ctx.moveTo(-18, 30); ctx.lineTo(0, 62); ctx.lineTo(18, 30); ctx.fillStyle = '#FF8A3D'; ctx.fill();
    rr(ctx, -95, -34, 190, 68, 34); ctx.fillStyle = lin(ctx, 0, -34, 0, 34, [[0, '#FFF3C4'], [.5, '#FFC24A'], [1, '#FF8A3D']]); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
    V.text(ctx, 'היום', 0, 2, 44, { fill: '#5A2A00', shadow: false }); ctx.restore();
  }
  ctx.restore();
  // foreground bokeh (defocused, faster parallax)
  addv(ctx, () => { for (let n = 0; n < 6; n++) { const r = rng(n + 60), x = ((r() * 1500 - c * 260 * (1 + r()) - T * 20) % 1500 + 1500) % 1500 - 210, y = r() * 1700 + 100, s = 90 + r() * 120; ctx.globalAlpha = .13; ctx.fillStyle = rad(ctx, x, y, s * .5, s, [[0, hexA([SUN, CORAL, TEAL][n % 3], .9)], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); } });
  // opening light burst rays
  if (u < .5) addv(ctx, () => { const a = 1 - inv(0, .5, u); for (let n = 0; n < 16; n++) { const an = n * TAU / 16 + u * 1.2; ctx.save(); ctx.translate(540, 700); ctx.rotate(an); ctx.globalAlpha = .5 * a; ctx.fillStyle = lin(ctx, 0, 0, 1800, 0, [[0, '#FFF3C4'], [1, 'rgba(255,200,80,0)']]); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(1800, -70); ctx.lineTo(1800, 70); ctx.lineTo(0, 18); ctx.fill(); ctx.restore(); } glow(ctx, 540, 700, 900, '#FFF3C4', .8 * a); });
  // pull back: sweep of light + sparkles
  if (pull > 0 && pull < 1) V.flash(ctx, T, 18.62, .35, '#FFE9A8', .35);
  overlaysA(ctx, T, pull);
  const sw2 = inv(18.6, 19.1, T); if (sw2 > 0) { const r = rng(77); addv(ctx, () => { for (let n = 0; n < 40; n++) { const x = r() * 1080, y = 100 + r() * 1300, ph = (T * 1.7 + r() * 3) % 1, a = Math.sin(ph * Math.PI) * sw2; sparkle(ctx, x, y, 14 + r() * 22, n % 2 ? '#FFF3C4' : '#9FFFF0', T * 2 + n, a * .9); } }); }
}
A.scene({ name: 'v5a_library', start: 15.81, end: 19.11, draw(ctx, s) {
  const T = s.t, u = T - 15.81; ctx.save();
  if (u < .3) { ctx.beginPath(); ctx.arc(540, 700, 1400 * A.ease.out(u / .3) + 2, 0, TAU); ctx.clip(); }
  drawA(ctx, T); ctx.restore();
  if (u < .34) { const R = 1400 * A.ease.out(u / .3) + 2, k = 1 - inv(.2, .34, u); addv(ctx, () => { ctx.globalAlpha = k; ctx.lineWidth = 90 * (1 - u / .4); ctx.strokeStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(540, 700, R, 0, TAU); ctx.stroke(); ctx.lineWidth = 26; ctx.strokeStyle = '#fff'; ctx.stroke(); }); }
} });

// =====================================================================================
// SCENE B: live wall + silky smooth hero
// =====================================================================================
const NAVY = '#03050F';
// 12 real Israeli channels: [logo, top colour, bottom colour, light screen?]
const CH = [['kan11', '#2258E6', '#0A1B5E'], ['keshet12', '#26397F', '#0A1240'], ['reshet13', '#1A2C7A', '#050B2A'], ['ch14', '#5A1222', '#14060C'],
  ['i24', '#1465C0', '#061E48'], ['sport1', '#0B5A3C', '#03140F'], ['sport2', '#5E0E20', '#160308'], ['one', '#F7F9FF', '#C4D2F4', 1],
  ['sport3', '#5A4E08', '#161303'], ['sport4', '#08505A', '#031619'], ['sport5', '#1444D8', '#06165E'], ['ch9', '#F7F9FF', '#BCCDF3', 1]];
const LIVE_T = i => 20.75 + (i % 4) * .25;
function screenArt(g, W, H, i, T) {
  const [name, c1, c2, light] = CH[i], t = T * 1.2 + i * 1.7;
  g.fillStyle = lin(g, 0, 0, W * .5, H, [[0, c1], [1, c2]]); g.fillRect(0, 0, W, H);
  // animated backdrop: drifting light shafts + soft rings
  g.save(); g.globalCompositeOperation = light ? 'multiply' : 'lighter';
  for (let n = 0; n < 4; n++) { g.save(); g.translate(((t * 40 + n * 170) % (W + 240)) - 120, 0); g.rotate(.35); g.fillStyle = light ? 'rgba(120,150,230,.18)' : 'rgba(255,255,255,.07)'; g.fillRect(-30, -80, 60, H + 200); g.restore(); }
  g.restore();
  g.fillStyle = light ? 'rgba(90,120,210,.12)' : 'rgba(255,255,255,.06)'; g.beginPath(); g.arc(W * .5, H * .5, 120 + 12 * Math.sin(t * 2), 0, TAU); g.fill(); g.beginPath(); g.arc(W * .5, H * .5, 170 + 12 * Math.sin(t * 2 + 1), 0, TAU); g.fill();
  // equalizer bars along the bottom
  for (let n = 0; n < 24; n++) { const hh = 8 + 26 * (.5 + .5 * Math.sin(t * 5 + n * 1.3 + hash(n + i) * 6)); g.fillStyle = light ? 'rgba(30,60,160,.28)' : 'rgba(255,255,255,.16)'; g.fillRect(14 + n * 19, H - 20 - hh, 12, hh); }
  // logo (bounces in on the LIVE beat)
  const bt = T - LIVE_T(i), pop = bt > 0 ? 1 + .1 * Math.exp(-bt * 9) * Math.cos(bt * 20) : 1;
  const lw = name.startsWith('sport') && name !== 'sport5' ? 330 : name === 'one' ? 320 : 220, lh = name.startsWith('sport') && name !== 'sport5' ? 90 : name === 'one' ? 90 : 170;
  g.save(); g.translate(W / 2, H * .5 - 8); g.scale(pop, pop);
  if (!light && name !== 'reshet13') { g.globalCompositeOperation = 'lighter'; const gr = rad(g, 0, 0, 10, 190, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]); g.fillStyle = gr; g.fillRect(-200, -200, 400, 400); g.globalCompositeOperation = 'source-over'; }
  const dl = V.drawLogo(g, name, 0, 0, name === 'reshet13' ? 190 : lw, name === 'reshet13' ? 190 : lh, { shadow: false });
  if (dl && !light) { g.shadowColor = 'rgba(0,0,0,0)'; }
  g.restore();
  // program progress line
  g.fillStyle = light ? 'rgba(30,60,160,.25)' : 'rgba(255,255,255,.22)'; g.fillRect(14, H - 12, W - 48, 4); g.fillStyle = light ? '#E0102A' : '#FF4B5C'; g.fillRect(14, H - 12, (W - 48) * ((T * .04 + hash(i) ) % 1), 4);
}
function drawScreen(i, T) {
  const W = 470, H = 290, cv = A.layer('v5b_s' + i, W, H, () => {}), g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  rr(g, 0, 0, W, H, 26); g.fillStyle = lin(g, 0, 0, W, H, [[0, '#3A4270'], [.5, '#0A0F24'], [1, '#2A3157']]); g.fill();
  g.save(); rr(g, 10, 10, W - 20, H - 20, 18); g.clip(); g.translate(10, 10); screenArt(g, W - 20, H - 20, i, T);
  // glossy glass: diagonal sheen + moving glint
  g.fillStyle = lin(g, 0, 0, W, H, [[0, 'rgba(255,255,255,.34)'], [.42, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.08)']]); g.fillRect(0, 0, W, H);
  const gl = ((T * .9 + i * .21) % 2.4 - .7) * (W + 200); g.fillStyle = lin(g, gl - 60, 0, gl + 60, 90, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, W, H);
  g.restore();
  // LIVE badge popping on the beat
  const bt = T - LIVE_T(i);
  if (bt > 0) { const s = eob(bt / .16) * (1 + .05 * Math.sin(T * 9 + i)); g.save(); g.translate(82, 46); g.scale(s, s); glow(g, 0, 0, 100, '#FF2D3F', .6 * (.7 + .3 * Math.sin(T * 9 + i)) + .8 * Math.exp(-bt * 8)); rr(g, -60, -24, 120, 48, 24); g.fillStyle = lin(g, 0, -24, 0, 24, [[0, '#FF5566'], [1, '#D80C26']]); g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-34, 0, 8 * (.75 + .25 * Math.sin(T * 12)), 0, TAU); g.fill(); V.text(g, 'LIVE', 12, 2, 30, { fill: '#fff', shadow: false, dir: 'ltr' }); g.restore(); }
  const bf = bt > 0 ? Math.exp(-bt * 7) : 0;
  rr(g, 1.5, 1.5, W - 3, H - 3, 25); g.lineWidth = 3 + 3 * bf; g.strokeStyle = bf > .05 ? `rgba(255,${120 + 100 * (1 - bf) | 0},${130 + 100 * (1 - bf) | 0},${.55 + .45 * bf})` : 'rgba(255,255,255,.55)'; g.stroke();
  return cv;
}
function bgB(ctx, T, calm) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, '#0A0E36'], [.5, '#0B1450'], [1, '#04061A']]); ctx.fillRect(0, 0, 1080, 1920);
  glow(ctx, 200 + Math.sin(T * .9) * 120, 500, 900, '#FF2D5A', .3 * (1 - calm)); glow(ctx, 900, 1200 + Math.cos(T) * 100, 1000, C.blue, .45); glow(ctx, 540, 1700, 900, '#FF8A3D', .15 * (1 - calm));
}
function wall(ctx, T) {
  const u = T - 20.64, D = A.key(T, [[20.64, 3500], [21.6, 2750, "out"], [22.32, 1700, "in"]]), spin = -.62 + u * .66, F = 1500, R = 900, CY = 740 - 40 * smooth(21.5, 22.3, T);
  // beat punches (screen-space camera): every LIVE pop and every half-beat after
  let pb = 0; for (let n = 0; n < 4; n++) { const d = T - LIVE_T(n); if (d > 0) pb = Math.max(pb, Math.exp(-d * 10)); } for (let b = 21.5; b <= 22.0; b += .5) { const d = T - b; if (d > 0) pb = Math.max(pb, Math.exp(-d * 10)); }
  ctx.save(); ctx.translate(540, 700); ctx.rotate(.06 * Math.sin(u * 2.3) - .03 + (T < 22 ? 0 : .04 * (T - 22) * 4)); { const zz = 1 + .05 * pb + .9 * A.ease.in(inv(22.0, 22.3, T)); ctx.scale(zz, zz); } ctx.translate(-540, -700 + 30 * pb);
  bgB(ctx, T, 0); V.bokeh(ctx, T, { n: 20, seed: 4, alpha: .9 });
  // light rings tunnel
  addv(ctx, () => { for (let n = 0; n < 6; n++) { const p = ((T * .5 + n / 6) % 1); ctx.globalAlpha = .18 * (1 - p); ctx.strokeStyle = n % 2 ? C.sky : '#FF5566'; ctx.lineWidth = 6 + 40 * p; ctx.beginPath(); ctx.arc(540, 700, 80 + p * p * 1500, 0, TAU); ctx.stroke(); } });
  const items = [];
  for (let i = 0; i < 12; i++) { const col = i % 4 - 1.5, row = Math.floor(i / 4) - 1, th = spin + col * .56 + row * .04, cs = Math.cos(th), d = D - R * cs, k = F / d; items.push({ i, th, cs, d, k, x: 540 + R * Math.sin(th) * k, y: CY + (row * 335 + Math.sin(T * 2 + i) * 9) * k }); }
  items.sort((a, b) => b.d - a.d);
  items.forEach(o => {
    if (o.d < 120) return; const cv = drawScreen(o.i, T), bt = T - LIVE_T(o.i), bump = bt > 0 ? 1 + .12 * Math.exp(-bt * 9) * Math.cos(bt * 14) : 1, w = 470 * o.k * bump, h = 290 * o.k * bump; if (o.x < -w || o.x > 1080 + w || o.y < -h || o.y > 2000 + h) return;
    ctx.save(); const back = o.cs < 0; ctx.globalAlpha = (back ? .2 : 1) * smooth(20.6, 20.95, T);
    glow(ctx, o.x, o.y, 420 * o.k, bt > 0 ? '#FF3B5A' : C.blue, back ? .04 : .18 + (bt > 0 ? .25 * Math.exp(-bt * 6) : 0));
    // glossy floor reflection (mirrored, faded)
    if (!back && o.k > .45) { ctx.save(); ctx.globalAlpha *= .16; ctx.translate(0, o.y * 2 + h * 1.06); ctx.scale(1, -1); V.card3d(ctx, cv, o.x, o.y, w, h, -o.th, 0, 1400, 6, 4); ctx.restore(); }
    V.card3d(ctx, cv, o.x, o.y, w, h, -o.th, 0, 1400, 8, 6);
    ctx.restore();
  });
  ctx.restore();
}
function shatter(ctx, T) {
  const u = T - 20.64; if (u > .8) return; const IP = [540, 720], NA = 14, RR = [0, 160, 420, 800, 1500, 2700];
  const vert = (j, a) => { const an = (a + (hash(j * 31 + a) - .5) * .5) / NA * TAU, r = RR[j] * (1 + (j ? (hash(a * 7 + j) - .5) * .25 : 0)); return [IP[0] + Math.cos(an) * r, IP[1] + Math.sin(an) * r]; };
  for (let j = 0; j < 5; j++) for (let a = 0; a < NA; a++) {
    const pts = j === 0 ? [vert(0, 0), vert(1, a), vert(1, (a + 1) % NA)] : [vert(j, a), vert(j + 1, a), vert(j + 1, (a + 1) % NA), vert(j, (a + 1) % NA)];
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length, dx = cx - IP[0], dy = cy - IP[1], dist = Math.hypot(dx, dy) || 1, id = j * 20 + a;
    const tb = .05 + Math.min(dist, 1500) / 1500 * .12, s = Math.max(0, u - tb), sp = .7 + hash(id) * .8;
    const off = (900 * s + 3200 * s * s) * sp, sc = 1 + s * 2.2 * sp, alpha = 1 - smooth(.12, .5, s), rot = (hash(id + 3) - .5) * s * 7;
    if (alpha <= 0) continue;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx + dx / dist * off, cy + dy / dist * off + 1400 * s * s); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = lin(ctx, cx - 200, cy - 200, cx + 200, cy + 200, [[0, `rgba(${200 + hash(id) * 50},${240},255,.97)`], [1, `rgba(${120 + hash(id + 5) * 60},${200},255,.96)`]]); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke(); ctx.restore();
  }
  // cracks + impact
  const k = 1 - inv(.02, .3, u); if (k > 0) { addv(ctx, () => { glow(ctx, IP[0], IP[1], 900 * (1 + u), '#fff', k); glow(ctx, IP[0], IP[1], 400, C.sky, k * .8); }); }
  if (u < .05) { ctx.save(); ctx.strokeStyle = 'rgba(30,60,120,.6)'; ctx.lineWidth = 3; for (let a = 0; a < NA; a++) { ctx.beginPath(); for (let j = 0; j < 6; j++) { const p = vert(j, a); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); } ctx.restore(); }
}
// ---------------- hero ----------------
const TRAIN0 = 22.3, TRAIN1 = 23.35, BALL0 = 22.42, BALL1 = 23.32, LANE_T = 450, LANE_B = 960;
const xBall = T => A.key(T, [[BALL0, -160], [BALL1, 1330]], 'inOut');
const xGhost = T => { const q = Math.floor(T * 6) / 6; return 640 + (q - 22.4) * 200; };
let TOVER = 23; for (let T = 22.5; T < 23.3; T += .004) if (xBall(T) > xGhost(T)) { TOVER = T; break; }
function gridFloor(ctx, T) {
  const HY = 1050; addv(ctx, () => {
    ctx.lineWidth = 2.5; for (let n = -16; n <= 16; n++) { ctx.globalAlpha = .28; ctx.strokeStyle = n % 4 ? hexA(C.cyan, .8) : hexA(C.gold, .9); ctx.beginPath(); ctx.moveTo(540 + n * 60, HY); ctx.lineTo(540 + n * 620, 2300); ctx.stroke(); }
    for (let n = 0; n < 14; n++) { const p = ((n + T * 3.2) % 14) / 14, y = HY + Math.pow(p, 2.3) * 1250; ctx.globalAlpha = .1 + .4 * p; ctx.strokeStyle = hexA(C.cyan, .9); ctx.lineWidth = 1 + 5 * p; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }
    ctx.globalAlpha = .5; ctx.fillStyle = lin(ctx, 0, HY - 80, 0, HY + 200, [[0, 'rgba(0,0,0,0)'], [.4, hexA(C.cyan, .5)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, HY - 80, 1080, 280);
  });
}
function ribbons(ctx, T, k, zoom, spd = 1, al = 1, sd = 0) {
  addv(ctx, () => {
    for (let n = 0; n < 9; n++) {
      const y0 = 200 + n * 122 + sd * 20, amp = (55 + hash(n + sd) * 60) * (sd ? 1.5 : 1), ph = hash(n + 4 + sd) * 6, col = n % 2 ? C.cyan : C.gold, th = 20 + hash(n + 8) * 26, fl = T * (2.5 + hash(n) * 1.5) * spd;
      const top = [], bot = [];
      for (let x = -40; x <= 1120; x += 30) { const y = y0 + Math.sin(x * .006 - fl + ph) * amp + Math.sin(x * .013 - fl * 1.6) * amp * .3, w = th * (.6 + .4 * Math.sin(x * .004 + n)); top.push([x, y - w]); bot.push([x, y + w]); }
      ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
      const sx = ((T * 900 * (.6 + hash(n)) + n * 300) % 2600) - 700;
      ctx.globalAlpha = .55 * k * al; ctx.fillStyle = lin(ctx, sx - 900, 0, sx + 300, 0, [[0, hexA(col, 0)], [.7, hexA(col, .9)], [.92, '#fff'], [1, hexA(col, 0)]]); ctx.fill();
      ctx.globalAlpha = .18 * k * al; ctx.fillStyle = hexA(col, 1); ctx.fill();
    }
  });
}
function trainDraw(ctx, hx, y, T) {
  const L = 1250; ctx.save(); ctx.translate(hx, y);
  // trails
  addv(ctx, () => { for (let n = 0; n < 12; n++) { const yy = -70 + n * 13 + hash(n) * 8, len = 500 + hash(n + 2) * 900; ctx.globalAlpha = .55; ctx.fillStyle = lin(ctx, -L, 0, -L - len, 0, [[0, n % 2 ? hexA(C.cyan, .9) : hexA(C.gold, .9)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-L - len, yy, len + L * .95, 3 + hash(n + 7) * 3); } glow(ctx, -L * .5, 40, 800, C.cyan, .12); });
  // under glow + rail
  addv(ctx, () => { ctx.globalAlpha = .7; ctx.fillStyle = lin(ctx, 0, 60, 0, 130, [[0, hexA(C.cyan, .8)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-L - 600, 60, L + 1200, 70); });
  ctx.fillStyle = '#0A1030'; ctx.fillRect(-L - 700, 96, L + 1800, 9); ctx.fillStyle = lin(ctx, 0, 96, 0, 100, [[0, '#9FE8FF'], [1, '#2A4A88']]); ctx.fillRect(-L - 700, 94, L + 1800, 4);
  // body
  ctx.beginPath(); ctx.moveTo(-L, -68); ctx.lineTo(-260, -68); ctx.bezierCurveTo(-120, -68, -30, -44, 20, 14); ctx.bezierCurveTo(30, 28, 24, 46, -4, 58); ctx.lineTo(-L, 58); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, -68, 0, 58, [[0, '#FFFFFF'], [.55, '#D6E3FA'], [1, '#8FA6D6']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, -46, 0, -10, [[0, '#0B1A4A'], [1, '#1F3E86']]); for (let x = -L + 30; x < -110; x += 96) { rr(ctx, x, -46, 74, 34, 12); ctx.fill(); }
  ctx.fillStyle = lin(ctx, -L, 0, 0, 0, [[0, C.cyan], [.6, C.gold], [1, '#FFF3C4']]); ctx.fillRect(-L, 18, L, 11);
  ctx.fillStyle = 'rgba(10,20,60,.5)'; ctx.fillRect(-L, 44, L, 14); ctx.fillStyle = 'rgba(0,10,50,.25)'; for (let x = -L + 300; x < -100; x += 300) ctx.fillRect(x, -68, 4, 126);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-L, -62, L, 8); ctx.restore();
  addv(ctx, () => { glow(ctx, 12, 26, 220, '#FFF3C4', .9); glow(ctx, 100, 30, 400, C.gold, .35); });
  ctx.restore();
}
function ballDraw(ctx, x, y, r, rot, a = 1, tint) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = tint || rad(ctx, -r * .35, -r * .4, r * .1, r * 1.1, [[0, '#FFFFFF'], [.6, '#E6EEFF'], [1, '#8FA0CF']]); ctx.fill(); ctx.save(); ctx.clip(); ctx.rotate(rot);
  ctx.fillStyle = tint ? 'rgba(20,0,20,.5)' : '#101830'; for (let n = 0; n < 5; n++) { const an = n * TAU / 5; ctx.beginPath(); for (let m = 0; m < 5; m++) { const b = m * TAU / 5 + an; ctx.lineTo(Math.cos(an) * r * .72 + Math.cos(b) * r * .22, Math.sin(an) * r * .72 + Math.sin(b) * r * .22); } ctx.fill(); }
  ctx.beginPath(); for (let m = 0; m < 5; m++) { const b = m * TAU / 5 - Math.PI / 2; ctx.lineTo(Math.cos(b) * r * .3, Math.sin(b) * r * .3); } ctx.fill(); ctx.restore();
  if (!tint) { ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .42, r * .3, r * .16, -.6, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function hero(ctx, T, k) {
  const u = T - 22.3, ci = 1 - A.ease.out(inv(22.3, 22.8, T)), pz = T > TOVER ? Math.exp(-(T - TOVER) * 7) : 0;
  const zoom = 1 + u * .05 + .5 * ci * ci + .1 * pz, rot = -.09 * ci + .012 * Math.sin(u * 3) + .03 * pz * Math.sin((T - TOVER) * 25);
  const shx = pz * 14 * A.noise1(T * 60), shy = pz * 14 * A.noise1(T * 60 + 7);
  ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, '#04061A'], [.5, '#08123A'], [1, '#03050F']]); ctx.fillRect(0, 0, 1080, 1920);
  glow(ctx, 540, 700, 1000, '#1A3E9A', .35); glow(ctx, 300 + u * 300, 450, 700, C.gold, .15); glow(ctx, 800 - u * 200, 1000, 700, C.cyan, .16);
  ctx.save(); ctx.translate(540 + shx, 700 + shy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-540, -700);
  gridFloor(ctx, T);
  ribbons(ctx, T, k, zoom, 1.5, .5, 3); ribbons(ctx, T, k, zoom, 1, 1, 0);
  // speed dashes on floor lines
  addv(ctx, () => { for (let n = 0; n < 24; n++) { const y = 260 + hash(n) * 900, len = 200 + hash(n + 1) * 500, x = ((T * (1600 + hash(n + 2) * 1200) + hash(n + 3) * 3000) % 3200) - 600; ctx.globalAlpha = .5 * k; ctx.fillStyle = lin(ctx, x - len, 0, x, 0, [[0, 'rgba(255,255,255,0)'], [1, n % 2 ? hexA(C.cyan, .9) : hexA(C.gold, .9)]]); ctx.fillRect(x - len, y, len, 3); } });
  // train
  if (T > TRAIN0 - .05 && T < TRAIN1 + .5) { const p = inv(TRAIN0, TRAIN1, T), hx = lerp(-100, 2500, A.ease.inOut(p) * .6 + p * .4); ctx.save(); ctx.globalAlpha = k; trainDraw(ctx, hx, LANE_T, T); ctx.restore(); }
  // ball lane
  ctx.save(); ctx.globalAlpha = k;
  addv(ctx, () => { ctx.fillStyle = lin(ctx, 0, LANE_B + 80, 0, LANE_B + 190, [[0, hexA(C.gold, .55)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, LANE_B + 80, 1080, 110); });
  ctx.fillStyle = lin(ctx, 0, 0, 1080, 0, [[0, 'rgba(255,255,255,0)'], [.5, '#FFE9A8'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, LANE_B + 84, 1080, 4);
  if (T >= BALL0 - .05) {
    const bx = xBall(T), by = LANE_B, r = 125, rot = bx / r, gx = xGhost(T), gs = T < TOVER;
    // ghost
    if (gs) { const fl = Math.floor(T * 6) % 3 === 2 ? .35 : .8, jit = (hash(Math.floor(T * 6)) - .5) * 14;
      ctx.save(); ctx.translate(jit, 0); ctx.globalAlpha = fl * inv(BALL0 - .05, BALL0 + .1, T); ballDraw(ctx, gx + 6, by, r, Math.floor(T * 6) * .8, 1, '#8890B8'); ctx.globalCompositeOperation = 'lighter'; ballDraw(ctx, gx - 8, by, r, Math.floor(T * 6) * .8, .35, '#FF2D5A'); ballDraw(ctx, gx + 14, by, r, Math.floor(T * 6) * .8, .3, '#2EE6F5'); ctx.restore();
      ctx.save(); ctx.translate(gx, by - 150); rr(ctx, -64, -26, 128, 52, 26); ctx.fillStyle = '#E0102A'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); V.text(ctx, 'LAG', 0, 2, 32, { fill: '#fff', shadow: false, dir: 'ltr' }); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(94, 0, 16, T * 8, T * 8 + 4.2); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(160,170,220,.5)'; for (let n = 0; n < 6; n++) ctx.fillRect(gx - 90 + hash(n + Math.floor(T * 6)) * 180, by - 90 + hash(n + 5 + Math.floor(T * 6)) * 180, 14, 14);
    } else { const s = T - TOVER; const a = 1 - inv(0, .6, s);
      if (a > 0) { ctx.save(); const gx0 = xGhost(TOVER - .01), gy = by;
        for (let n = 0; n < 10; n++) { const an = n / 10 * TAU, vx = Math.cos(an) * 520 * (.6 + hash(n)), vy = Math.sin(an) * 520 * (.6 + hash(n)) - 300; ctx.save(); ctx.translate(gx0 + vx * s, gy + vy * s + 1800 * s * s); ctx.rotate(s * (hash(n) - .5) * 14); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 86, an - .3, an + .3); ctx.closePath(); ctx.fillStyle = '#A8B0D8'; ctx.fill(); ctx.strokeStyle = '#E0102A'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
        for (let n = 0; n < 14; n++) { const an = hash(n + 20) * TAU, sp = 400 + hash(n) * 700; ctx.globalAlpha = a; ctx.fillStyle = n % 2 ? '#FF2D5A' : '#2EE6F5'; ctx.fillRect(gx0 + Math.cos(an) * sp * s, gy + Math.sin(an) * sp * s + 900 * s * s, 16, 16); }
        ['L', 'A', 'G'].forEach((ch, n) => V.text(ctx, ch, gx0 - 30 + n * 32 + (n - 1) * 220 * s, gy - 150 + 1500 * s * s * (n + 1) * .5 - 200 * s, 44, { fill: '#FF3B4A', dir: 'ltr', shadow: false })); ctx.restore(); }
      addv(ctx, () => { ctx.strokeStyle = C.gold; ctx.globalAlpha = (1 - inv(0, .4, s)); ctx.lineWidth = 16 * (1 - inv(0, .4, s)) + 2; ctx.beginPath(); ctx.arc(xGhost(TOVER - .01), by, 60 + s * 900, 0, TAU); ctx.stroke(); glow(ctx, xGhost(TOVER - .01), by, 500 * (1 - inv(0, .4, s)), '#FFF3C4', .9 * (1 - inv(0, .4, s))); });
    }
    // ball trails + afterimages
    addv(ctx, () => { for (let n = 0; n < 9; n++) { const yy = by - 70 + n * 17; ctx.globalAlpha = .6; ctx.fillStyle = lin(ctx, bx, 0, bx - 700 - hash(n) * 300, 0, [[0, n % 2 ? hexA(C.cyan, .9) : hexA(C.gold, .9)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(bx - 1000, yy, 1000, 4); } glow(ctx, bx, by, 300, C.gold, .45); });
    for (let n = 5; n >= 1; n--) ballDraw(ctx, bx - n * 34, by, r * (1 - n * .02), (bx - n * 34) / r, .12);
    addv(ctx, () => { ballDraw(ctx, bx - 10, by, r, rot, .4, hexA('#FF2D5A', 1)); ballDraw(ctx, bx + 10, by, r, rot, .4, hexA('#2EE6F5', 1)); });
    ballDraw(ctx, bx, by, r, rot, 1);
    if (T > TOVER && T < TOVER + .6) { const q = (T - TOVER) / .6; addv(ctx, () => { for (let n = 0; n < 44; n++) { const an = n / 44 * TAU + hash(n) * .1, r0 = 160 + hash(n + 3) * 200 + q * 700, l = 260 + hash(n + 9) * 500; ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = n % 3 ? '#fff' : n % 2 ? C.gold : C.cyan; ctx.lineWidth = 2 + hash(n + 5) * 4; ctx.beginPath(); ctx.moveTo(bx + Math.cos(an) * r0, by + Math.sin(an) * r0); ctx.lineTo(bx + Math.cos(an) * (r0 + l * (1 - q * .4)), by + Math.sin(an) * (r0 + l * (1 - q * .4))); ctx.stroke(); } }); }
  }
  ctx.restore();
  ctx.restore();
  // kinetic words
  const w1 = T - 23.3, w2 = T - 23.42;
  if (w1 > 0) { const s = eob(w1 / .16); ctx.save(); ctx.translate(540, 650); ctx.scale(s, s); ctx.rotate(-.04); addv(ctx, () => glow(ctx, 0, 0, 400, C.gold, .5)); V.text(ctx, 'מהיר', 0, 0, 200, { grad: V.GOLD_GRAD, stroke: '#7A3B00', sw: 12, shadowBlur: 30 }); ctx.restore(); }
  if (w2 > 0) { const s = eob(w2 / .16); ctx.save(); ctx.translate(540, 830); ctx.scale(s, s); ctx.rotate(.03); addv(ctx, () => glow(ctx, 0, 0, 400, C.cyan, .5)); V.text(ctx, 'וחלק', 0, 0, 200, { grad: [[0, '#FFFFFF'], [.5, '#7FEFFF'], [1, '#1AA6D8']], stroke: '#0A3A6A', sw: 12, shadowBlur: 30 }); ctx.restore(); }
}
function voidFx(ctx, T) {
  const d = smooth(23.5, 23.9, T), c = smooth(23.55, 23.95, T); if (d <= 0) return;
  ctx.fillStyle = `rgba(3,5,15,${d * .985})`; ctx.fillRect(0, 0, 1080, 1920);
  const br = 1 + .03 * Math.sin(T * 3);
  addv(ctx, () => {
    ctx.globalAlpha = c * .5 * br; ctx.fillStyle = lin(ctx, 0, -50, 0, 1500, [[0, 'rgba(220,235,255,.85)'], [.6, 'rgba(120,170,255,.25)'], [1, 'rgba(60,100,200,0)']]);
    ctx.beginPath(); ctx.moveTo(470, -60); ctx.lineTo(610, -60); ctx.lineTo(880, 1500); ctx.lineTo(200, 1500); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = c * .4; ctx.fillStyle = rad(ctx, 540, 1500, 10, 420, [[0, 'rgba(180,210,255,.8)'], [1, 'rgba(0,0,0,0)']]); ctx.save(); ctx.translate(540, 1500); ctx.scale(1, .22); ctx.translate(-540, -1500); ctx.beginPath(); ctx.arc(540, 1500, 420, 0, TAU); ctx.fill(); ctx.restore();
    for (let n = 0; n < 26; n++) { const r = rng(n + 300), x = 450 + r() * 180 + (r() - .5) * 200 * (0), y = ((r() * 1500 + T * 20 * (r() + .3)) % 1500); ctx.globalAlpha = c * .5 * r(); ctx.fillStyle = '#CFE0FF'; ctx.beginPath(); ctx.arc(540 + (x - 540) * (.4 + y / 900) + Math.sin(T + n) * 10, y, 1.5 + r() * 2, 0, TAU); ctx.fill(); }
  });
}
A.scene({ name: 'v5b_live_smooth', start: 20.64, end: 24.2, draw(ctx, s) {
  const T = s.t;
  const hk = smooth(22.22, 22.38, T);
  if (T < 22.4) { wall(ctx, T); if (T < 21.5) shatter(ctx, T); }
  if (T >= 22.22) { ctx.save(); hero(ctx, T, 1); ctx.restore(); if (T < 22.5) { ctx.save(); ctx.globalAlpha = 1 - hk; ctx.restore(); } }
  if (T >= 22.2 && T < 22.38) { const a = T < 22.3 ? smooth(22.2, 22.3, T) : 1 - smooth(22.3, 22.38, T); ctx.save(); ctx.globalAlpha = a * .95; ctx.fillStyle = lin(ctx, 0, 0, 1080, 1920, [[0, '#FFFFFF'], [1, '#BDF3FF']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  voidFx(ctx, T);
} });
})();
