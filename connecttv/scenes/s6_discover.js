// s6_discover: v 17.10 to 22.6 (LANDSCAPE 1920x1080). Three mini-worlds joined by liquid transitions.
//  (1) football match  (lime/green/cyan)  17.40 משחקים / 17.80 בשידור / 18.34 חי
//  (2) cinema premiere (velvet red/gold)  18.78 הסדרות / 19.21 שאתם / 19.52 מחכים / 20.09 להן
//  (3) gift box discovery (yellow/pink)   20.42 והתוכן / 20.92 שתמיד / 21.29 כיף / 21.55 לגלות
// No holds inside this window: T = v + 3.5. Everything is a pure function of s.t (voice clock).
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, TAU = A.TAU, W = 1920, H = 1080;
  const eo = ease.out, eio = ease.inOut;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const land = (t, t0, dur = .3) => CL.pop(t, t0 - dur * .4, dur);       // pop that reaches 1.0 right on t0
  const mix = (a, b, k) => A.mixc(a, b, k);
  const KAL = ['#FF2E93', '#FFD23F', '#19C8FF', '#7CFF3A', '#FF8A1F', '#8B3DFF', '#ffffff'];
  const wobble = (t, t0, f = 26, d = 9) => { const u = t - t0; return u < 0 ? 0 : Math.exp(-u * d) * Math.cos(u * f); };

  // ------------------------------------------------------------------ shared FX
  function ray(ctx, cx, cy, t, n, len, col, alpha, spd = .35, wid = .5) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * spd); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, len, [[0, A.hex(col, alpha)], [1, A.hex(col, 0)]]);
    for (let i = 0; i < n; i++) { ctx.rotate(TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .08 * wid * 3); ctx.lineTo(len, len * .08 * wid * 3); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function confetti(ctx, t, t0, cx, cy, n, seed, o = {}) {
    const u = t - t0; if (u < 0) return; const life = o.life || 1.9; if (u > life) return; const rg = rng(seed * 31 + 7), sp = o.speed || 1, sc = o.scale || 1, ac = o.ang ?? -Math.PI / 2, spr = o.spread ?? 1.5;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = ac + (rg() - .5) * spr * 2, v = (500 + rg() * 1100) * sp, g = 1700, dr = Math.exp(-u * 1.2), sw = rg() * 6 + 3, ph = rg() * TAU, col = KAL[i % KAL.length], kind = i % 5;
      const x = cx + Math.cos(a) * v * (1 - dr) / 1.2 + Math.sin(u * sw + ph) * 26, y = cy + Math.sin(a) * v * (1 - dr) / 1.2 + .5 * g * u * u * .5 + 60 * u;
      const al = clamp((life - u) / (life * .3)); if (al <= 0) continue;
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.rotate(u * (rg() * 10 - 5) + ph); ctx.fillStyle = col;
      const flip = Math.cos(u * (6 + rg() * 8) + ph);
      if (kind === 0) { ctx.scale(1, flip); ctx.fillRect(-13 * sc, -7 * sc, 26 * sc, 14 * sc); }
      else if (kind === 1) { ctx.beginPath(); ctx.arc(0, 0, 8 * sc, 0, TAU); ctx.fill(); }
      else if (kind === 2) { ctx.scale(flip, 1); ctx.fillRect(-4 * sc, -18 * sc, 8 * sc, 36 * sc); }
      else if (kind === 3) { CL.spark(ctx, 0, 0, 16 * sc * (.6 + .4 * Math.abs(flip)), 0, col); }
      else { ctx.scale(1, flip); ctx.beginPath(); ctx.moveTo(0, -12 * sc); ctx.lineTo(12 * sc, 9 * sc); ctx.lineTo(-12 * sc, 9 * sc); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }
  function sparkBurst(ctx, t, t0, cx, cy, R, n, seed, life = .7) {
    const u = t - t0; if (u < 0 || u > life) return; const rg = rng(seed * 17 + 3), k = u / life;
    for (let i = 0; i < n; i++) { const a = rg() * TAU, r = R * (.35 + rg() * .65) * eo(k), s = (14 + rg() * 26) * (1 - k) * (.6 + .4 * Math.sin(u * 30 + i)); CL.spark(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, s, u * 3 + i, KAL[i % KAL.length]); }
  }
  function splashAt(ctx, x, y, R, t, t0, seed, cols, life = .7, flat = 1) {
    const u = t - t0; if (u < 0 || u > life) return; const p = eo(clamp(u / (life * .5))), al = 1 - ease.in(clamp((u - life * .35) / (life * .65)));
    ctx.save(); ctx.translate(x, y); ctx.scale(1, flat); ctx.globalAlpha = al; CL.splash(ctx, 0, 0, R, p, seed, cols); ctx.restore();
  }
  // transition: bands (leading colours) then the new content clipped by the same moving edge
  function transition(ctx, p, cols, shape, content) {
    if (p <= 0) return; if (p >= 1) { content(); return; }
    const N = cols.length, d = .085, E = k => eio(clamp(p * (1 + N * d) - k * d));
    for (let k = 0; k < N; k++) { shape(ctx, E(k), k, p); ctx.fillStyle = cols[k]; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke(); }
    ctx.save(); shape(ctx, E(N), N, p); ctx.clip(); content(); ctx.restore();
  }
  const shapeUp = (ctx, e, k, p) => {   // liquid wave rising from the bottom
    const amp = 46, yb = H + amp * 2 - e * (H + amp * 4); ctx.beginPath(); ctx.moveTo(-10, H + 20); ctx.lineTo(-10, yb);
    for (let x = 0; x <= W + 20; x += 24) ctx.lineTo(x, yb + Math.sin(x * .0085 + k * 1.7 + p * 9) * amp + Math.sin(x * .021 + p * 13 + k) * amp * .4);
    ctx.lineTo(W + 10, H + 20); ctx.closePath();
  };
  const IRIS = [960, 470];
  const shapeIris = (ctx, e, k, p) => {
    const R = e * 1800; ctx.beginPath(); const n = 56;
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = R * (1 + .07 * Math.sin(a * 5 + k * 2 + p * 11) + .04 * Math.sin(a * 9 - p * 7)); const x = IRIS[0] + Math.cos(a) * r, y = IRIS[1] + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
  };

  // ------------------------------------------------------------------ WORLD 1: football
  const HOR = 668;                                         // horizon / goal line / ad boards bottom
  const GOAL = { x0: 1270, x1: 1630, top: 340, gy: 672 };   // front frame
  const IMP = [1450, 500];                                  // net impact point
  const L1 = [380, 738], L2 = [880, 748], L3 = [925, 740];
  const ballAt = t => {   // -> {x,y,s,gy,rot} screen position of the ball centre
    let x, y, s = 1, gy = 800;
    if (t < 17.40) { const p = clamp(inv(17.06, 17.40, t)); x = lerp(-180, L1[0], p); y = lerp(-140, L1[1], p * p); s = lerp(1.35, 1, p); gy = y + 60; }
    else if (t < 17.80) { const p = (t - 17.40) / .40; x = lerp(L1[0], L2[0], p); gy = lerp(L1[1], L2[1], p) + 56; y = gy - 56 - 4 * 330 * p * (1 - p); }
    else if (t < 18.03) { const p = (t - 17.80) / .23; x = lerp(L2[0], L3[0], p); gy = lerp(L2[1], L3[1], p) + 56; y = gy - 56 - 4 * 46 * p * (1 - p); }
    else if (t < 18.34) { const p = (t - 18.03) / .31; x = lerp(L3[0], IMP[0], p); y = lerp(L3[1], IMP[1], p) - 4 * 70 * p * (1 - p); s = lerp(1, .74, eo(p)); gy = lerp(L3[1] + 56, 690, p); }
    else { const u = t - 18.34; x = IMP[0] - 10 * (1 - Math.exp(-u * 4)) + Math.sin(u * 9) * 6 * Math.exp(-u * 3); y = IMP[1] + 100 * (1 - Math.exp(-u * 3.2)) + wobble(t, 18.34, 20, 5) * 14; s = .74; gy = 690; }
    return { x, y, s, gy };
  };
  function pentagon(ctx, x, y, r, rot) { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU - Math.PI / 2; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  function drawBall(ctx, x, y, r, rot, sqx = 1, sqy = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sqx, sqy);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = A.radial(ctx, -r * .32, -r * .36, r * .1, r * 1.15, [[0, '#ffffff'], [.55, '#eef0ff'], [1, '#7f8ad0']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.rotate(rot); ctx.fillStyle = '#141a66'; ctx.strokeStyle = '#141a66'; ctx.lineWidth = r * .05;
    pentagon(ctx, 0, 0, r * .34, 0); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2 + .0; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .34, Math.sin(a) * r * .34); ctx.lineTo(Math.cos(a) * r * .72, Math.sin(a) * r * .72); ctx.stroke(); pentagon(ctx, Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, r * .32, a + Math.PI / 5 * 0); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = r * .07; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(-r * .34, -r * .42, r * .22, r * .11, -.7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  const pm = (u, d) => { const y = HOR + 412 * Math.pow(d, 1.25), hw = 1150 + (y - HOR) * 2.2; return [960 + u * hw, y]; };
  function pitchLayer() {
    return CL.layer('s6_pitch', W, H, g => {
      const gr = g.createLinearGradient(0, HOR, 0, H); gr.addColorStop(0, '#0d7a4f'); gr.addColorStop(1, '#16b874'); g.fillStyle = gr; g.fillRect(0, HOR, W, H - HOR);
      const n = 9; for (let i = 0; i < n; i += 2) { const y0 = HOR + 412 * Math.pow(i / n, 1.4), y1 = HOR + 412 * Math.pow((i + 1) / n, 1.4); g.fillStyle = 'rgba(0,40,30,.18)'; g.fillRect(0, y0, W, y1 - y0); }
      const sh = g.createLinearGradient(0, HOR, 0, HOR + 90); sh.addColorStop(0, 'rgba(3,10,50,.55)'); sh.addColorStop(1, 'rgba(3,10,50,0)'); g.fillStyle = sh; g.fillRect(0, HOR, W, 90);
    });
  }
  function standsLayer() {
    return CL.layer('s6_stands', W, H, g => {
      const gr = g.createLinearGradient(0, 100, 0, HOR); gr.addColorStop(0, '#0a1046'); gr.addColorStop(1, '#1d2189'); g.fillStyle = gr; g.fillRect(0, 100, W, HOR - 100);
      for (let r = 0; r < 14; r++) { const y = 160 + r * 38; g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(0, y, W, 3); }
      const rg = rng(5); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + (.05 + rg() * .08) + ')'; g.beginPath(); g.arc(rg() * W, 130 + rg() * (HOR - 160), 1.5 + rg() * 2, 0, TAU); g.fill(); }
      // ad boards
      const segs = 8, sw = W / segs, cols = [C.pink, C.blue, C.orange, C.purple, C.cyan, C.pink, C.green, C.blue];
      for (let i = 0; i < segs; i++) { g.fillStyle = cols[i]; g.fillRect(i * sw, HOR - 54, sw - 4, 54); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(i * sw, HOR - 54, sw - 4, 16); g.font = '900 30px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillStyle = '#fff'; g.fillText('ConnectTV', i * sw + sw / 2, HOR - 22); }
    });
  }
  function neon(ctx, pts, p, col = '#fff') {
    if (p <= 0) return; let tot = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
    let rem = tot * clamp(p), path = [pts[0]]; for (let i = 0; i < seg.length && rem > 0; i++) { const k = Math.min(1, rem / seg[i]); path.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]); rem -= seg[i]; }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter';
    [[18, .16, col], [9, .35, col], [4, .95, '#ffffff']].forEach(([w, a, c]) => { ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); path.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
    ctx.restore();
  }
  const arcPts = (cx, cy, rx, ry, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  function pitchLines(ctx, t) {
    const pulse = .8 + .2 * Math.sin(t * 5);
    const lines = [
      [[-140, HOR + 8], [W + 140, HOR + 8]],
      [[560, HOR + 8], [-60, H]], [[1360, HOR + 8], [2100, H]],
      [[1160, HOR + 8], [1020, 822], [1880, 822], [1740, HOR + 8]],
      [[1270, HOR + 8], [1210, 730], [1690, 730], [1630, HOR + 8]],
      arcPts(640, 905, 430, 92, 0, TAU, 70),
      [[640, 813], [640, 997]],
    ];
    lines.forEach((pts, i) => neon(ctx, pts, ease.out(P(t, 17.14 + i * .028, 17.46 + i * .028)), i % 2 ? '#7CFF3A' : '#19C8FF'));
    // penalty spot
    const k = P(t, 17.3, 17.5); if (k > 0) { ctx.save(); ctx.globalAlpha = k * pulse; CL.spark(ctx, 1450, 780, 22, 0, '#fff'); ctx.restore(); }
  }
  function floodlights(ctx, t) {
    [[150, 118], [1770, 118]].forEach(([x, y], k) => {
      A.glow(ctx, x, y, 330, '#bfe9ff', .55); ctx.save(); ctx.fillStyle = '#20286f'; ctx.fillRect(x - 12, y, 24, 240);
      ctx.fillStyle = '#eafcff'; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { ctx.beginPath(); ctx.arc(x - 54 + c * 36, y - 20 + r * 34, 13, 0, TAU); ctx.fill(); } ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.linear(ctx, x, y, x + (k ? -420 : 420), y + 560, [[0, 'rgba(190,235,255,.20)'], [1, 'rgba(190,235,255,0)']]); ctx.beginPath(); ctx.moveTo(x - 30, y + 10); ctx.lineTo(x + 30, y + 10); ctx.lineTo(x + (k ? -640 : 640) + 200, y + 700); ctx.lineTo(x + (k ? -640 : 640) - 260, y + 700); ctx.closePath(); ctx.fill(); ctx.restore();
    });
  }
  const SHIRTS = [C.blue, C.pink, C.orange, C.cyan, C.purple, C.lime, C.yellow];
  function crowd(ctx, t) {
    const goalK = P(t, 18.34, 18.62);
    for (let r = 0; r < 5; r++) {
      const fy = 300 + r * 82, sc = .78 + r * .09, n = 22;
      for (let i = 0; i < n; i++) {
        const seed = r * 40 + i, x = i * 92 + (r % 2) * 46 - 20 + A.noise1(t * .8 + seed) * 4, delay = hash(seed * 1.7) * .1;
        const k = clamp((t - 18.34 - delay) / .12) * (1 - 0 * goalK), cheer = t >= 18.34 + delay ? 1 : 0;
        const jump = cheer * Math.abs(Math.sin((t - 18.34 - delay) * 8 + hash(seed) * 2)) * 34 * sc * clamp((t - 18.34 - delay) / .1);
        const y = fy - jump + Math.sin(t * 2 + seed) * 2, col = mix(SHIRTS[seed % SHIRTS.length], '#0b1250', .42), armUp = k;
        ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.strokeStyle = col; ctx.lineWidth = 15; ctx.lineCap = 'round';
        [-1, 1].forEach(sd => { const a = lerp(2.5 * 0 + .5, 2.75, armUp) + Math.sin(t * 13 + seed * 2 + sd) * .3 * armUp; ctx.beginPath(); ctx.moveTo(sd * 20, -46); ctx.lineTo(sd * (20 + Math.sin(a) * 42), -46 - Math.cos(a) * 42 * (armUp > .5 ? 1 : -.6)); ctx.stroke(); });
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-26, -62, 52, 72, 18); ctx.fill();
        ctx.fillStyle = mix('#f0b591', '#0b1250', .4); ctx.beginPath(); ctx.arc(0, -84, 20, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
  }
  function goalNet(ctx, t) {
    const m = t < 18.34 ? 0 : clamp((t - 18.34) / .05) * (.45 * Math.exp(-(t - 18.34) * 3.2) * (1 + .6 * Math.cos((t - 18.34) * 26))) + 0;
    const bx0 = 1305, bx1 = 1595, by0 = 372, by1 = 650;
    const D = (x, y) => { const dx = IMP[0] - x, dy = IMP[1] - y, r2 = dx * dx + dy * dy, k = m * Math.exp(-r2 / 26000); return [x + dx * k, y + dy * k]; };
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(10,16,70,.45)'; ctx.fillRect(GOAL.x0, GOAL.top, GOAL.x1 - GOAL.x0, GOAL.gy - GOAL.top);
    for (let i = 0; i <= 14; i++) { const x = lerp(bx0, bx1, i / 14); ctx.beginPath(); for (let j = 0; j <= 10; j++) { const [px, py] = D(x, lerp(by0, by1, j / 10)); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    for (let j = 0; j <= 10; j++) { const y = lerp(by0, by1, j / 10); ctx.beginPath(); for (let i = 0; i <= 14; i++) { const [px, py] = D(lerp(bx0, bx1, i / 14), y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    ctx.globalAlpha = .5; [[GOAL.x0, GOAL.top, bx0, by0], [GOAL.x1, GOAL.top, bx1, by0], [GOAL.x0, GOAL.gy, bx0, by1], [GOAL.x1, GOAL.gy, bx1, by1]].forEach(q => { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); });
    ctx.restore();
  }
  function goalFrame(ctx, t) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const flash = P(t, 18.34, 18.5); const col = flash > 0 && flash < 1 ? '#fff6a0' : '#ffffff';
    [[9, 'rgba(25,200,255,.35)', 26], [1, col, 15]].forEach(([_, c, w]) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(GOAL.x0, GOAL.gy); ctx.lineTo(GOAL.x0, GOAL.top); ctx.lineTo(GOAL.x1, GOAL.top); ctx.lineTo(GOAL.x1, GOAL.gy); ctx.stroke(); });
    ctx.restore();
  }
  function player(ctx, t) {
    const tIn = 17.58, tPlant = 18.0; if (t < tIn - .05) return;
    const run = clamp(inv(tIn, tPlant, t)), px = lerp(-260, 800, eo(run)), baseY = 792, hipY = baseY - 196, plant = clamp(inv(17.9, 18.0, t)), ph = t * 21;
    let hx = px, sway = Math.sin(ph) * (1 - plant);
    const hip = [hx, hipY + Math.abs(Math.sin(ph)) * 8 * (1 - plant)];
    // legs
    const runFoot = (s) => [hx + Math.sin(ph + s) * 78, baseY - Math.max(0, Math.cos(ph + s)) * 58];
    const kick = (() => { const k = [[17.92, 752, 790], [17.985, 712, 720], [18.03, 862, 764], [18.10, 960, 616], [18.20, 900, 700], [18.34, 806, 786]]; if (t <= k[0][0]) return null; for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const u = eio(inv(k[i - 1][0], k[i][0], t)); return [lerp(k[i - 1][1], k[i][1], u), lerp(k[i - 1][2], k[i][2], u)]; } return [k[k.length - 1][1], k[k.length - 1][2]]; })();
    const fA = (() => { const r = runFoot(0), s = [hx + 4, baseY]; return [lerp(r[0], s[0], plant), lerp(r[1], s[1], plant)]; })();
    const rb = runFoot(Math.PI); const fB = kick ? [lerp(rb[0], kick[0], clamp((t - 17.92) / .05)), lerp(rb[1], kick[1], clamp((t - 17.92) / .05))] : rb;
    const knee = (h, f, l1, l2, sg) => { const dx = f[0] - h[0], dy = f[1] - h[1]; let d = Math.hypot(dx, dy); const dd = Math.min(d, l1 + l2 - .5), a = Math.acos(clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1)), b = Math.atan2(dy, dx) - sg * a; return [h[0] + Math.cos(b) * l1, h[1] + Math.sin(b) * l1]; };
    const kA = knee(hip, fA, 100, 96, -1), kB = knee(hip, fB, 100, 96, -1);
    ctx.save(); ctx.fillStyle = 'rgba(0,30,20,.35)'; ctx.beginPath(); ctx.ellipse(px + 10, baseY + 12, 120, 20, 0, 0, TAU); ctx.fill();
    const leg = (kn, ft, shade) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#f0b08a'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(kn[0], kn[1]); ctx.lineTo(ft[0], ft[1]); ctx.stroke(); ctx.strokeStyle = shade; ctx.lineWidth = 38; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(lerp(hip[0], kn[0], .55), lerp(hip[1], kn[1], .55)); ctx.stroke();
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 36; ctx.beginPath(); ctx.moveTo(lerp(kn[0], ft[0], .45), lerp(kn[1], ft[1], .45)); ctx.lineTo(ft[0], ft[1]); ctx.stroke(); ctx.fillStyle = '#12185a'; ctx.beginPath(); ctx.ellipse(ft[0] + 16, ft[1] + 6, 30, 15, 0, 0, TAU); ctx.fill(); };
    leg(kA, fA, '#1d3fd6'); leg(kB, fB, '#1d3fd6');
    // torso (leans forward while running, straightens at the plant)
    const lean = .32 * (1 - plant) + .08 + (kick && t > 18.0 ? .10 * Math.sin(inv(18.0, 18.2, t) * Math.PI) : 0);
    ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(lean);
    ctx.fillStyle = C.pink; ctx.beginPath(); ctx.roundRect(-42, -150, 84, 160, 30); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-12, -108, 12, 44, .1, 0, TAU); ctx.fill();
    ctx.font = '900 56px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.direction = 'ltr'; ctx.fillText('9', 0, -60);
    ctx.strokeStyle = '#f0b08a'; ctx.lineWidth = 22; ctx.lineCap = 'round'; const sw2 = Math.sin(ph) * (1 - plant) * .9 + (kick ? -.7 * plant : 0);
    [[-1, 1], [1, -1]].forEach(([s, m]) => { ctx.beginPath(); ctx.moveTo(0, -128); ctx.lineTo(Math.sin(sw2 * m + .3) * 60, -128 + Math.cos(sw2 * m + .3) * 54 + 20); ctx.stroke(); });
    ctx.fillStyle = '#f0b08a'; ctx.beginPath(); ctx.arc(10, -190, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.arc(6, -202, 34, Math.PI * .95, Math.PI * 2.05); ctx.fill();
    ctx.restore(); ctx.restore();
  }
  function liveBadge(ctx, x, y, sc, t) {
    if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    CL.gel(ctx, 0, 0, 360, 128, { fill: C.red, dark: '#9e0a2a', shadow: 14, r: 64 });
    const pu = 1 + .22 * Math.sin(t * 7); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-116, 0, 22 * pu, 0, TAU); ctx.fill();
    ctx.globalAlpha = .5 * (1 - (t * 1.6 % 1)); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-116, 0, 22 + 46 * ((t * 1.6) % 1), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = '900 82px Rubik'; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(80,0,20,.55)'; ctx.strokeText('LIVE', 34, 4); ctx.fillStyle = '#fff'; ctx.fillText('LIVE', 34, 4);
    ctx.restore();
  }
  function scoreboard(ctx, t, sc) {
    if (sc <= 0) return; const goal = t >= 18.34, bump = goal ? 1 + .55 * Math.exp(-(t - 18.34) * 7) * Math.cos((t - 18.34) * 22) : 1, glowK = goal ? Math.exp(-(t - 18.34) * 3) : 0;
    ctx.save(); ctx.translate(960, 104); ctx.scale(sc, sc);
    CL.gel(ctx, 0, 0, 940, 150, { fill: '#17207f', dark: '#070b3a', rim: goal && glowK > .1 ? '#ffe36a' : 'rgba(255,255,255,.7)', shadow: 14, r: 44, gloss: true });
    // teams
    [[-1, C.blue, 'האריות'], [1, C.orange, 'הנמרים']].forEach(([s, col, nm]) => {
      ctx.save(); ctx.translate(s * 372, 0); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-12, -16, 18, 9, -.6, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.stroke(); ctx.restore();
      A.text(ctx, nm, s * 232, 4, { font: '900 52px Rubik', fill: '#fff', dir: 'rtl' });
    });
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '900 96px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.save(); ctx.translate(-92, 6); ctx.scale(bump, bump); ctx.fillStyle = goal ? '#ffe36a' : '#fff'; ctx.fillText(goal ? '1' : '0', 0, 0); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillText(':', 0, -4); ctx.fillText('0', 92, 6);
    ctx.restore();
  }
  function liveBar(ctx, t, k) {
    if (k <= 0) return; const x0 = 420, x1 = 1500, y = 222, hh = 22; ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(2,6,40,.65)'; ctx.beginPath(); ctx.roundRect(x0 - 8, y - hh / 2 - 8, x1 - x0 + 16, hh + 16, 22); ctx.fill();
    const prog = .32 + .05 * (t - 17.8) + .015 * Math.sin(t * 2), xe = lerp(x0, x1, prog);   // never stops
    const g = A.linear(ctx, x0, 0, xe, 0, [[0, '#19D68B'], [1, '#7CFF3A']]); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, y - hh / 2, xe - x0, hh, hh / 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y - hh / 2, xe - x0, hh, hh / 2); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const px = x0 + ((t * .55 + i / 3) % 1) * (xe - x0); ctx.fillStyle = A.radial(ctx, px, y, 0, 90, [[0, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(px - 90, y - 40, 180, 80); }
    ctx.restore(); A.glow(ctx, xe, y, 46 + 8 * Math.sin(t * 9), '#7CFF3A', .9); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xe, y, 11, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function clockChip(ctx, t, sc) {
    if (sc <= 0) return; const secs = 78 * 60 + 12 + (t - 17.8) * 1, m = Math.floor(secs / 60), s = Math.floor(secs % 60), fr = secs % 1;
    ctx.save(); ctx.translate(1630, 104); ctx.scale(sc, sc); CL.gel(ctx, 0, 0, 250, 104, { fill: '#0e1a6b', dark: '#050826', shadow: 10, r: 40, rim: 'rgba(255,255,255,.6)' });
    A.text(ctx, m + ':' + String(s).padStart(2, '0'), 0, 4, { font: '900 66px Rubik', fill: '#7CFF3A', dir: 'ltr' }); ctx.globalAlpha = .55 + .45 * Math.sin(t * 6); ctx.fillStyle = '#7CFF3A'; ctx.beginPath(); ctx.arc(-98, -30, 6, 0, TAU); ctx.fill(); ctx.restore();
  }
  function world1(ctx, t) {
    CL.bg(ctx, t, { tint: [C.green, C.cyan, C.blue], base: '#0a2a66' });
    ctx.drawImage(standsLayer(), 0, 0); floodlights(ctx, t); crowd(ctx, t);
    ctx.drawImage(pitchLayer(), 0, 0); pitchLines(ctx, t);
    // LIVE screen elements
    const sb = land(t, 17.80, .34), lv = P(t, 17.60, 17.80); // CUE 17.80 live-badge-slam + scoreboard
    goalNet(ctx, t);
    // ball trail + ball
    const st = 17.06, b = ballAt(t);
    if (t >= st && t < 18.6) {
      for (let k = 14; k >= 1; k--) { const tt = t - k * .017; if (tt < st) continue; const q = ballAt(tt), fade = 1 - k / 15; if (tt > 18.34) continue; const sp = Math.hypot(q.x - b.x, q.y - b.y); if (sp < 8) continue; ctx.globalAlpha = .9 * fade; CL.drop(ctx, q.x, q.y + 8, 40 * q.s * fade + 6, CL.CAND[(k + 3) % 8], t, k); } ctx.globalAlpha = 1;
      // ground shadow
      const hgt = clamp((b.gy - b.y - 56) / 300); ctx.fillStyle = 'rgba(0,30,20,' + (.4 - .2 * hgt) + ')'; ctx.beginPath(); ctx.ellipse(b.x, b.gy + 6, 60 * b.s * (1 - .3 * hgt), 14 * b.s, 0, 0, TAU); ctx.fill();
      let sqx = 1, sqy = 1; [17.40, 17.80].forEach(t0 => { const w = wobble(t, t0, 34, 13) * .34; if (t >= t0 && t < t0 + .3) { sqy = 1 - w; sqx = 1 + w * .8; } });
      const vel = Math.hypot(ballAt(t + .01).x - b.x, ballAt(t + .01).y - b.y) / .01; const stretch = clamp(vel / 5000, 0, .22);
      drawBall(ctx, b.x, b.y, 58 * b.s, t * 14, sqx * (1 + stretch), sqy * (1 - stretch * .6));
    }
    goalFrame(ctx, t);
    player(ctx, t);
    // impacts: CUE 17.40 ball-landing splash on the pitch, CUE 17.80 second bounce, CUE 18.34 GOAL burst
    splashAt(ctx, L1[0], L1[1] + 60, 330, t, 17.40, 4, [C.lime, C.cyan, C.yellow, C.green, C.pink], .75, .5);
    splashAt(ctx, L2[0], L2[1] + 60, 240, t, 17.80, 9, [C.pink, C.orange, C.yellow, C.cyan], .6, .5);
    if (t >= 17.36) CL.ring(ctx, L1[0], L1[1] + 56, 260, P(t, 17.40, 17.9), '#fff', 14);
    if (t >= 17.80) CL.ring(ctx, L2[0], L2[1] + 56, 200, P(t, 17.80, 18.2), C.yellow, 12);
    // broadcast graphics
    { const q = P(t, 17.58, 17.80); if (q > 0) { const sc = t < 17.80 ? lerp(3.2, 1, ease.in(q)) : 1 + .16 * wobble(t, 17.80, 28, 10); ctx.save(); ctx.globalAlpha = clamp(q * 5); liveBadge(ctx, 290, 110, sc, t); ctx.restore(); } }
    scoreboard(ctx, t, sb); clockChip(ctx, t, land(t, 17.86, .3)); liveBar(ctx, t, P(t, 17.84, 18.0));
    // GOAL!
    if (t >= 18.34) {
      const u = t - 18.34; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.exp(-u * 9) * .8; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ray(ctx, IMP[0], IMP[1], t, 14, 900, C.yellow, .5 * Math.exp(-u * 3));
      splashAt(ctx, IMP[0], IMP[1], 520, t, 18.34, 21, null, .9);
      [0, .07].forEach((d, i) => CL.ring(ctx, IMP[0], IMP[1], 620 - i * 160, P(t, 18.34 + d, 18.34 + d + .5), i ? C.yellow : '#fff', 26));
      sparkBurst(ctx, t, 18.34, IMP[0], IMP[1], 560, 26, 3, .8);
      const s = CL.spring(t, 18.30, .55) * (1 - ease.in(P(t, 18.56, 18.7)));
      if (s > 0) CL.title(ctx, 'GOAL!', 700, 400, { size: 330, dir: 'ltr', fill: ['#fff7a0', '#ff8a1f'], rot: -.07, scale: s, alpha: 1 });
    }
  }

  // ------------------------------------------------------------------ WORLD 2: cinema premiere
  function curtainTex() {
    return CL.layer('s6_curt', 1000, H, g => {
      const nf = 7, fw = 1000 / nf;
      for (let i = 0; i < nf; i++) { const gr = g.createLinearGradient(i * fw, 0, (i + 1) * fw, 0); gr.addColorStop(0, '#5d0620'); gr.addColorStop(.30, '#e0243f'); gr.addColorStop(.5, '#ff5a6c'); gr.addColorStop(.72, '#c11433'); gr.addColorStop(1, '#4a0418'); g.fillStyle = gr; g.fillRect(i * fw, 0, fw + 1, H); }
      const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,.35)'); v.addColorStop(.35, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,0,20,.45)'); g.fillStyle = v; g.fillRect(0, 0, 1000, H);
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < nf; i++) g.fillRect(i * fw + fw * .48, 0, 10, H);
    });
  }
  function valanceTex() {
    return CL.layer('s6_val', W, 260, g => {
      const nf = 14, fw = W / nf; for (let i = 0; i < nf; i++) { const gr = g.createLinearGradient(i * fw, 0, (i + 1) * fw, 0); gr.addColorStop(0, '#5d0620'); gr.addColorStop(.5, '#ff4a5e'); gr.addColorStop(1, '#4a0418'); g.fillStyle = gr; g.fillRect(i * fw, 0, fw + 1, 150); }
      const sc = 6; const r = W / sc / 2; for (let i = 0; i < sc; i++) { const cx = (i + .5) * W / sc; g.fillStyle = '#c11433'; g.beginPath(); g.arc(cx, 110, r * .95, 0, Math.PI); g.fill(); g.lineWidth = 12; g.strokeStyle = '#ffd23f'; g.beginPath(); g.arc(cx, 110, r * .95, 0, Math.PI); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(cx, 110 + r * .95, 20, 0, TAU); g.fill(); g.fillRect(cx - 4, 110 + r * .95, 8, 34); }
      g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, 14); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, 0, W, 5);
    });
  }
  function curtainHalf(ctx, side, edge, t, amp, ph, jx) {
    if (edge <= 4) return; const tex = curtainTex();
    ctx.save(); if (side > 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.beginPath(); ctx.moveTo(-30, 0); for (let y = 0; y <= H; y += 27) ctx.lineTo(edge + Math.sin(y * .012 + ph) * amp + Math.sin(y * .03 + ph * 1.7) * amp * .4, y); ctx.lineTo(-30, H); ctx.closePath(); ctx.clip();
    ctx.drawImage(tex, 0, 0, 1000, H, -40 + jx, 0, Math.max(60, edge + 90), H);
    ctx.fillStyle = A.linear(ctx, edge - 70, 0, edge + 10, 0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.4)']]); ctx.fillRect(edge - 70, 0, 100, H);
    ctx.restore();
  }
  function marquee(ctx, t, sc) {
    if (sc <= 0) return; ctx.save(); ctx.translate(960, 232); ctx.scale(sc, sc);
    CL.gel(ctx, 0, 0, 640, 118, { fill: '#2b0a4f', dark: '#12042a', rim: '#ffd23f', rimW: 8, shadow: 12, r: 30 });
    for (let i = 0; i < 24; i++) { const x = -300 + i * 26.1, on = (Math.floor(t * 9) + i) % 3 === 0; [-1, 1].forEach(sd => { ctx.fillStyle = on ? '#fff6a0' : '#b8891a'; ctx.beginPath(); ctx.arc(x, sd * 48, 6.5, 0, TAU); ctx.fill(); if (on) A.glow(ctx, x, sd * 48, 22, '#ffd23f', .8); }); }
    CL.title(ctx, 'בכורה', 0, 4, { size: 92, fill: ['#fff7c0', '#ffb300'] }); ctx.restore();
  }
  function countdown(ctx, t) {
    const T3 = 18.78, T2 = 19.21, T1 = 19.52, TE = 20.09; if (t < T3 - .3 || t > TE + .3) return;
    const cx = 960, cy = 560; let ringK = land(t, T3, .34); const ex = P(t, TE, TE + .18); ringK *= 1 + .5 * eo(ex); const ga = 1 - ex; if (ga <= 0) return;
    ctx.save(); ctx.globalAlpha = ga; ctx.translate(cx, cy); ctx.scale(ringK, ringK);
    const beat = t > T1 ? 1 + .045 * Math.sin((t - T1) * 22) * P(t, T1, T1 + .1) + .015 * P(t, T1, TE) : 1;
    ctx.scale(beat, beat);
    ctx.fillStyle = 'rgba(2,4,30,.5)'; ctx.beginPath(); ctx.arc(10, 16, 262, 0, TAU); ctx.fill();
    ctx.fillStyle = A.radial(ctx, -60, -80, 20, 280, [[0, '#4a1fb8'], [1, '#12083f']]); ctx.beginPath(); ctx.arc(0, 0, 258, 0, TAU); ctx.fill();
    // film-leader sweep
    const seg = t < T2 ? [T3, T2, 3] : t < T1 ? [T2, T1, 2] : [T1, TE, 1]; const sweep = clamp((t - seg[0]) / (seg[1] - seg[0]));
    ctx.fillStyle = 'rgba(255,214,80,.20)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 240, -Math.PI / 2, -Math.PI / 2 + TAU * sweep); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,80,.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-258, 0); ctx.lineTo(258, 0); ctx.moveTo(0, -258); ctx.lineTo(0, 258); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 178, 0, TAU); ctx.stroke();
    ctx.lineWidth = 18; ctx.strokeStyle = A.linear(ctx, 0, -258, 0, 258, [[0, '#fff3a0'], [1, '#ff9a1f']]); ctx.beginPath(); ctx.arc(0, 0, 258, 0, TAU); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(0, 0, 240, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
    // digits: each pops on its word, previous one flies off
    [[3, T3], [2, T2], [1, T1]].forEach(([n, tn], i) => {
      const nxt = i < 2 ? [T2, T1][i] : TE, u = t - tn; if (u < -.2 || t > nxt + .16) return; const pp = land(t, tn, .32), out = P(t, nxt - .02, nxt + .14), shk = t > T1 && n === 1 ? Math.sin(t * 70) * 3 * P(t, T1, TE) : 0;
      ctx.save(); ctx.translate(shk, 8); ctx.scale(pp * (1 + .9 * eo(out)), pp * (1 + .9 * eo(out))); ctx.globalAlpha = 1 - out; CL.title(ctx, String(n), 0, 0, { size: 400, dir: 'ltr', fill: ['#fff7c0', '#ffb300'] }); ctx.restore();
    });
    ctx.restore();
    // impact rings on each count: CUE 18.78 countdown-3 + curtain-slam, CUE 19.21 countdown-2, CUE 19.52 countdown-1
    [T3, T2, T1].forEach((tn, i) => { CL.ring(ctx, cx, cy, 520, P(t, tn, tn + .5), i === 2 ? C.pink : C.yellow, 20); sparkBurst(ctx, t, tn, cx, cy, 380, 12, i + 30, .6); });
  }
  function spotlights(ctx, t, k) {
    if (k <= 0) return; const fast = P(t, 19.52, 20.09), sw = Math.sin(t * (2.2 + fast * 7)) * (.09 + fast * .08), fl = t > 19.52 ? .8 + .2 * Math.sin(t * 47) : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * fl;
    [[240, 1], [1680, -1]].forEach(([x, s]) => { const ang = Math.atan2(560 + 0, 960 - x) + sw * s; const len = 1300; ctx.save(); ctx.translate(x, -30); ctx.rotate(ang - Math.PI / 2 + Math.PI / 2 * 0); ctx.rotate(Math.PI / 2 - Math.PI / 2 + 0); ctx.rotate(-Math.PI / 2 + Math.PI / 2);
      ctx.restore();
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, w1 = 34, w2 = 250; ctx.fillStyle = A.linear(ctx, x, -30, x + dx * len, -30 + dy * len, [[0, 'rgba(255,240,190,.55)'], [1, 'rgba(255,240,190,.05)']]); ctx.beginPath(); ctx.moveTo(x + nx * w1, -30 + ny * w1); ctx.lineTo(x + dx * len + nx * w2, -30 + dy * len + ny * w2); ctx.lineTo(x + dx * len - nx * w2, -30 + dy * len - ny * w2); ctx.lineTo(x - nx * w1, -30 - ny * w1); ctx.closePath(); ctx.fill(); });
    A.glow(ctx, 960, 560, 560, '#ffe9a0', .5 * k); ctx.restore();
  }
  function popcornPuff(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); [[-.5, .2, .8], [.5, .15, .85], [0, -.5, .9], [-.2, .55, .7], [.55, -.35, .6]].forEach(([dx, dy, k]) => { ctx.fillStyle = '#fff3d0'; ctx.beginPath(); ctx.arc(dx * r, dy * r, r * k * .62, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(r * .1, r * .1, r * .22, 0, TAU); ctx.fill(); ctx.restore();
  }
  function bucket(ctx, t, sc) {
    if (sc <= 0) return; const bx = 330, by = 830, kick = wobble(t, 19.52, 30, 6) * .04; ctx.save(); ctx.translate(bx, by); ctx.rotate(-.05 + kick); ctx.scale(sc, sc);
    // popcorn pile
    for (let i = 0; i < 16; i++) { const a = hash(i * 2.1) * TAU, rr = hash(i * 3.3) * 88; popcornPuff(ctx, Math.cos(a) * rr * .9, -300 + Math.sin(a) * 30 - Math.abs(Math.cos(a)) * 18 - hash(i) * 20 + Math.sin(t * 4 + i) * 2, 46, i); }
    ctx.beginPath(); ctx.moveTo(-135, -290); ctx.lineTo(135, -290); ctx.lineTo(102, 0); ctx.lineTo(-102, 0); ctx.closePath(); ctx.save(); ctx.clip();
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff3b4e'; ctx.fillRect(-140 + i * 35, -300, 36, 310); }
    ctx.fillStyle = A.linear(ctx, -135, 0, 135, 0, [[0, 'rgba(0,0,40,.35)'], [.35, 'rgba(255,255,255,.22)'], [.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,40,.4)']]); ctx.fillRect(-140, -300, 280, 310); ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-135, -290); ctx.lineTo(135, -290); ctx.lineTo(102, 0); ctx.lineTo(-102, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(-150, -308, 300, 30, 14); ctx.fill(); ctx.stroke();
    ctx.restore();
    // popping kernels
    const rate = .075, j0 = Math.floor((t - 19.21) / rate);
    for (let j = 0; j < 12; j++) { const b = j0 - j; if (b < 0) continue; const tb = 19.21 + b * rate, u = t - tb; if (u < 0 || u > .95) continue; const hs = hash(b * 1.7 + 3);
      const vx = (hs - .5) * 520, vy = -900 - hash(b * 5.1) * 500, x = bx + vx * u * .55 + (hs - .5) * 20, y = by - 330 + vy * u + 1900 * u * u * .5; ctx.save(); ctx.globalAlpha = clamp((.95 - u) / .25); popcornPuff(ctx, x, y, 34 + hash(b) * 14, u * (hs * 20 - 10)); ctx.restore(); }
  }
  function wallClock(ctx, t, sc) {
    if (sc <= 0) return; const cx = 1560, cy = 640, R = 150; ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
    const sh = t > 19.52 ? wobble(t, 19.52, 28, 5) * .06 : 0; ctx.rotate(sh);
    CL.gel(ctx, 0, 0, R * 2, R * 2, { fill: '#ffffff', dark: '#cdd3ff', r: R, rim: '#ffd23f', rimW: 12, shadow: 14 });
    ctx.fillStyle = C.ink; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.save(); ctx.rotate(a); ctx.fillRect(-4, -R + 20, 8, i % 3 ? 16 : 30); ctx.restore(); }
    const step = TAU / 12, k = Math.max(0, (t - 19.52) / .12), kk = Math.floor(k), fr = k - kk, ang = (kk + (t < 19.52 ? 0 : ease.outBack(clamp(fr * 2.2)))) * step;
    ctx.save(); ctx.rotate(ang); ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -R + 34); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.rotate(-1.1 + ang * .08); ctx.strokeStyle = C.ink; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R * .5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function openCurtains(ctx, t) {
    // edge positions (x reached by each half)
    const closing = P(t, 18.50, 18.78); let edge = 975 * ease.in(closing) ** 1;
    if (t >= 18.78) edge = 975 - 26 * Math.exp(-(t - 18.78) * 9) * Math.cos((t - 18.78) * 26) + 0;
    const pinch = P(t, 20.00, 20.09), opening = P(t, 20.09, 20.40);
    if (t >= 20.0) edge = t < 20.09 ? 975 - 34 * eio(pinch) : lerp(941, -40, eo(opening));
    return edge;
  }
  function stageBg(ctx, t) {
    const u = t - 20.09; ctx.fillStyle = A.radial(ctx, 960, 480, 60, 1200, [[0, '#5b2bd0'], [.55, '#1f1070'], [1, '#080a30']]); ctx.fillRect(0, 0, W, H);
    ray(ctx, 960, 480, t, 18, 1400, '#ffd23f', .28, .3); ray(ctx, 960, 480, -t * 1.2, 12, 1200, '#ff2e93', .22, .3);
    CL.twinkle(ctx, t, 0, 0, W, 900, 30, 4);
  }
  // 12 designed series posters (no faces): art drawn once into layers
  const POSTERS = [
    { t: 'NOVA', a: ['#0b1250', '#8b3dff'], art(g, w, h) { const rg = rng(2); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (.3 + rg() * .6) + ')'; g.beginPath(); g.arc(rg() * w, rg() * h * .7, .8 + rg() * 2, 0, TAU); g.fill(); } g.fillStyle = A.radial(g, w * .4, h * .3, 5, 100, [[0, '#a5f0ff'], [1, '#1b6bff']]); g.beginPath(); g.arc(w * .5, h * .38, 86, 0, TAU); g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 12; g.beginPath(); g.ellipse(w * .5, h * .38, 150, 34, -.4, 0, TAU); g.stroke(); g.fillStyle = '#ff2e93'; g.beginPath(); g.arc(w * .82, h * .18, 20, 0, TAU); g.fill(); } },
    { t: 'LOVE', a: ['#ff2e93', '#ff8a1f'], art(g, w, h) { const heart = (x, y, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + s * .35); g.bezierCurveTo(x - s * 1.1, y - s * .3, x - s * .5, y - s * 1.1, x, y - s * .45); g.bezierCurveTo(x + s * .5, y - s * 1.1, x + s * 1.1, y - s * .3, x, y + s * .35); g.fill(); }; heart(w * .5, h * .42, 130, '#fff'); heart(w * .5, h * .42, 96, '#ff2e93'); heart(w * .2, h * .18, 30, 'rgba(255,255,255,.8)'); heart(w * .82, h * .25, 22, 'rgba(255,255,255,.7)'); } },
    { t: 'HUNT', a: ['#3a0010', '#050826'], art(g, w, h) { g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(w * .55, h * .3, 74, 0, TAU); g.fill(); g.fillStyle = '#1a0a20'; for (let i = 0; i < 6; i++) { const x = i * 55 - 10; g.beginPath(); g.moveTo(x, h * .72); g.lineTo(x + 40, h * .32 + (i % 2) * 40); g.lineTo(x + 80, h * .72); g.fill(); } g.fillStyle = '#ff3b4e'; g.beginPath(); g.ellipse(w * .55, h * .3, 22, 9, 0, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.ellipse(w * .55, h * .3, 6, 9, 0, 0, TAU); g.fill(); } },
    { t: 'HAHA', a: ['#19c8ff', '#2f6bff'], art(g, w, h) { g.fillStyle = A.radial(g, w * .45, h * .3, 5, 110, [[0, '#fff7a0'], [1, '#ffb300']]); g.beginPath(); g.arc(w * .5, h * .4, 100, 0, TAU); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1a1330'; g.stroke(); g.fillStyle = '#1a1330'; g.beginPath(); g.ellipse(w * .5 - 34, h * .4 - 24, 10, 16, 0, 0, TAU); g.ellipse(w * .5 + 34, h * .4 - 24, 10, 16, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(w * .5, h * .4 + 6, 56, .15, Math.PI - .15); g.lineWidth = 10; g.stroke(); } },
    { t: 'BLAST', a: ['#ff8a1f', '#ff3b4e'], art(g, w, h) { g.fillStyle = '#ffd23f'; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 70 : 150; g.lineTo(w * .5 + Math.cos(a) * r, h * .4 + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 40 : 84; g.lineTo(w * .5 + Math.cos(a) * r, h * .4 + Math.sin(a) * r); } g.closePath(); g.fill(); } },
    { t: 'RAIN', a: ['#0b1250', '#2f6bff'], art(g, w, h) { g.fillStyle = '#ff2e93'; g.beginPath(); g.arc(w * .5, h * .42, 120, Math.PI, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(w * .5, h * .42, 40, Math.PI, TAU); g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * .5, h * .42); g.lineTo(w * .5, h * .66); g.arc(w * .5 - 20, h * .66, 20, 0, Math.PI); g.stroke(); g.strokeStyle = 'rgba(180,230,255,.8)'; g.lineWidth = 4; const rg = rng(6); for (let i = 0; i < 20; i++) { const x = rg() * w, y = rg() * h * .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 26); g.stroke(); } } },
    { t: 'REALM', a: ['#19d68b', '#19c8ff'], art(g, w, h) { g.fillStyle = '#0b1250'; g.fillRect(w * .2, h * .35, w * .6, h * .32); [.2, .5, .8].forEach((x, i) => { const ww = i === 1 ? 62 : 46; g.fillRect(w * x - ww / 2, h * (i === 1 ? .2 : .27), ww, h * .45); g.beginPath(); g.moveTo(w * x - ww / 2 - 6, h * (i === 1 ? .2 : .27)); g.lineTo(w * x, h * (i === 1 ? .08 : .17)); g.lineTo(w * x + ww / 2 + 6, h * (i === 1 ? .2 : .27)); g.fill(); }); g.fillStyle = '#ffd23f'; g.fillRect(w * .5 - 8, h * .42, 16, 30); g.beginPath(); g.arc(w * .82, h * .12, 24, 0, TAU); g.fillStyle = '#fff'; g.fill(); } },
    { t: 'NOIR', a: ['#b3122e', '#1a0a20'], art(g, w, h) { g.fillStyle = 'rgba(255,220,150,.35)'; for (let i = 0; i < 7; i++) { g.save(); g.translate(0, i * 42); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -40); g.lineTo(w, -20); g.lineTo(0, 22); g.fill(); g.restore(); } g.fillStyle = '#0a0518'; g.beginPath(); g.ellipse(w * .5, h * .42, 116, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.roundRect(w * .5 - 62, h * .22, 124, 90, 30); g.fill(); g.fillStyle = '#ff3b4e'; g.fillRect(w * .5 - 62, h * .36, 124, 16); } },
    { t: 'PEAK', a: ['#8b3dff', '#ff8a1f'], art(g, w, h) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * .6, h * .3, 60, 0, TAU); g.fill(); [['#1a1f7a', .1, .5, .3], ['#2b2fa0', .55, .62, .45], ['#0b1250', .3, .55, .4]].forEach(([c, x, ht, wd]) => { g.fillStyle = c; g.beginPath(); g.moveTo(w * (x - wd / 2 * .0) - 30, h * .68); g.lineTo(w * (x + wd / 2), h * (.68 - ht * .6)); g.lineTo(w * (x + wd) + 30, h * .68); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w * (x + wd / 2) - 22, h * (.68 - ht * .6) + 34); g.lineTo(w * (x + wd / 2), h * (.68 - ht * .6)); g.lineTo(w * (x + wd / 2) + 22, h * (.68 - ht * .6) + 34); g.fill(); }); } },
    { t: 'SPARK', a: ['#2f0a80', '#19c8ff'], art(g, w, h) { g.fillStyle = '#fff36a'; g.beginPath(); g.moveTo(w * .58, h * .08); g.lineTo(w * .28, h * .46); g.lineTo(w * .48, h * .46); g.lineTo(w * .38, h * .74); g.lineTo(w * .76, h * .34); g.lineTo(w * .55, h * .34); g.lineTo(w * .7, h * .08); g.closePath(); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke(); } },
    { t: 'WAVE', a: ['#19c8ff', '#0b1250'], art(g, w, h) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w * .5, h * .28, 50, 0, TAU); g.fill(); [['#2f6bff', .46], ['#19c8ff', .54], ['#7cffe9', .62]].forEach(([c, y], i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * y); for (let x = 0; x <= w; x += 12) g.lineTo(x, h * y + Math.sin(x * .05 + i * 2) * 18); g.lineTo(w, h); g.fill(); }); } },
    { t: 'GLOW', a: ['#ff8a1f', '#8b3dff'], art(g, w, h) { const rg = rng(11); for (let i = 0; i < 9; i++) { g.fillStyle = A.hex(CL.CAND[i % 8], .9); g.beginPath(); g.arc(w * (.2 + rg() * .6), h * (.12 + rg() * .5), 20 + rg() * 42, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,255,255,.9)'; CL.spark(g, w * .5, h * .34, 60, 0, '#fff'); } },
  ];
  function posterImg(i) {
    const p = POSTERS[i], S = 1.5;
    return CL.layer('s6_poster' + i, 270 * S, 360 * S, g => {
      g.scale(S, S); g.beginPath(); g.roundRect(0, 0, 270, 360, 26); g.clip(); const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, p.a[0]); gr.addColorStop(1, p.a[1]); g.fillStyle = gr; g.fillRect(0, 0, 270, 360);
      p.art(g, 270, 300); const bg = g.createLinearGradient(0, 270, 0, 360); bg.addColorStop(0, 'rgba(5,8,38,0)'); bg.addColorStop(1, 'rgba(5,8,38,.85)'); g.fillStyle = bg; g.fillRect(0, 250, 270, 110);
      g.font = '84px Bangers'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.lineJoin = 'round'; g.lineWidth = 14; g.strokeStyle = '#050826'; g.strokeText(p.t, 135, 318); g.fillStyle = A.linear(g, 0, 285, 0, 350, [[0, '#ffffff'], [1, '#ffd23f']]); g.fillText(p.t, 135, 318);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(270, 0); g.lineTo(0, 150); g.closePath(); g.fill();
      g.restore(); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.roundRect(3, 3, 264, 354, 24); g.stroke();
    });
  }
  function posterWall(ctx, t) {
    const t0 = 20.09; if (t < t0 - .02) return; const cols = 6, pw = 270, ph = 360, gx = 30, gy = 22;
    for (let i = 0; i < 12; i++) {
      const c = i % cols, r = Math.floor(i / cols), x = 960 + (c - 2.5) * (pw + gx), y = 240 + r * (ph + gy) + (r ? 4 : 0) - 0, d = Math.hypot(c - 2.5, (r - .5) * 1.4), st = t0 + d * .028;
      const s = CL.pop(t, st - .02, .34); if (s <= 0) continue; const px = lerp(960, x, Math.min(1.08, s)), py = lerp(480, y, Math.min(1.08, s)), rot = (hash(i * 3.1) - .5) * .12 * (1 - Math.min(1, s)) + Math.sin(t * 1.5 + i) * .012 + (hash(i * 7.7) - .5) * .05;
      const bob = Math.sin(t * 2 + i * 1.3) * 5 * clamp(s); ctx.save(); ctx.translate(px, py + bob); ctx.rotate(rot); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.beginPath(); ctx.roundRect(-pw / 2 + 8, -ph / 2 + 16, pw, ph, 26); ctx.fill(); ctx.drawImage(posterImg(i), -pw / 2, -ph / 2, pw, ph); ctx.restore();
    }
  }
  function world2(ctx, t) {
    const open = t >= 20.09 - .02; const edge = openCurtains(ctx, t);
    if (open) { stageBg(ctx, t); posterWall(ctx, t); }
    else { CL.bg(ctx, t, { tint: [C.purple, C.pink, C.red], base: '#2a0a4a' }); }
    // curtains
    const ph = t * 3, amp = t < 18.78 ? 30 * (1 - closingK(t)) + 12 : 8, trem = t > 19.52 && t < 20.09 ? Math.sin(t * 73) * (2 + 12 * Math.pow(P(t, 19.52, 20.09), 2)) : 0;
    const sway = t >= 18.78 && t < 19.52 ? Math.sin((t - 18.78) * 20) * 5 * Math.exp(-(t - 18.78) * 3) : 0;
    curtainHalf(ctx, -1, edge, t, amp, ph, trem + sway); curtainHalf(ctx, 1, edge, t, amp, ph + 2, -trem - sway);
    // seam light when closed
    if (t >= 18.6 && t < 20.09) { const k = P(t, 18.6, 18.8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.linear(ctx, 940, 0, 980, 0, [[0, 'rgba(255,220,150,0)'], [.5, 'rgba(255,220,150,' + .35 * k + ')'], [1, 'rgba(255,220,150,0)']]); ctx.fillRect(940, 0, 40, H); ctx.restore(); }
    // curtain slam flash: CUE 18.78 curtain-slam + countdown 3
    if (t >= 18.78 && t < 18.95) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.exp(-(t - 18.78) * 18) * .55; ctx.fillStyle = '#ffe9a0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (t < 20.09) spotlights(ctx, t, land(t, 18.78, .3));
    // valance + marquee slide out when the curtains open
    const up = ease.in(P(t, 20.12, 20.4)) * 300; ctx.save(); ctx.translate(0, -up); ctx.drawImage(valanceTex(), 0, 0); ctx.restore();
    marquee(ctx, t, land(t, 18.78, .34) * (1 - ease.in(P(t, 20.09, 20.3))));
    countdown(ctx, t);
    bucket(ctx, t, land(t, 19.21, .34) * (1 - ease.in(P(t, 20.09, 20.26))));    // CUE 19.21 popcorn-bucket-pop
    wallClock(ctx, t, land(t, 19.52, .34) * (1 - ease.in(P(t, 20.09, 20.26))));   // CUE 19.52 clock-tick-start
    if (t >= 20.09) {   // CUE 20.09 curtains-fly-open + poster-wall-burst
      const u = t - 20.09; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.exp(-u * 10) * .9; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
      confetti(ctx, t, 20.09, 960, 480, 90, 51, { spread: Math.PI, ang: -Math.PI / 2, speed: 1.15, life: 1.4 });
      sparkBurst(ctx, t, 20.09, 960, 480, 800, 34, 8, .9); CL.ring(ctx, 960, 480, 1000, P(t, 20.09, 20.6), '#fff', 30);
    }
  }
  function closingK(t) { return P(t, 18.50, 18.78); }

  // ------------------------------------------------------------------ WORLD 3: gift box + discovery tiles
  const BOX = { x: 960, base: 760 };
  const TILE = { w: 540, h: 350, gx: 30, gy: 30 };
  const tileC = i => { const order = [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1]], [c, r] = order[i]; return [960 + (c - 1) * (TILE.w + TILE.gx), 236 + r * (TILE.h + TILE.gy)]; };
  const THUMBS = [
    { a: ['#ffd23f', '#ff8a1f'], art(g, w, h) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h * .32, 74, 70, 0, 0, Math.PI); g.fill(); g.fillStyle = '#ffb300'; g.beginPath(); g.moveTo(w / 2 - 90, h * .12); g.lineTo(w / 2 + 90, h * .12); g.lineTo(w / 2 + 62, h * .5); g.lineTo(w / 2 - 62, h * .5); g.closePath(); g.fill(); g.fillStyle = '#fff36a'; g.fillRect(w / 2 - 18, h * .5, 36, 60); g.fillRect(w / 2 - 70, h * .72, 140, 26); g.lineWidth = 10; g.strokeStyle = '#ffb300'; g.beginPath(); g.arc(w / 2 - 96, h * .22, 34, Math.PI * .5, Math.PI * 1.5); g.arc(w / 2 + 96, h * .22, 34, Math.PI * 1.5, Math.PI * .5); g.stroke(); }, t: 'CHAMPS' },
    { a: ['#1a1f7a', '#19c8ff'], art(g, w, h) { const rg = rng(3); for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(255,255,255,' + (.3 + rg() * .6) + ')'; g.beginPath(); g.arc(rg() * w, rg() * h, .8 + rg() * 2.2, 0, TAU); g.fill(); } g.save(); g.translate(w / 2, h * .45); g.rotate(.7); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 44, 110, 0, 0, TAU); g.fill(); g.fillStyle = '#ff2e93'; g.beginPath(); g.moveTo(-44, 40); g.lineTo(-84, 96); g.lineTo(-30, 84); g.fill(); g.beginPath(); g.moveTo(44, 40); g.lineTo(84, 96); g.lineTo(30, 84); g.fill(); g.fillStyle = '#19c8ff'; g.beginPath(); g.arc(0, -20, 22, 0, TAU); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-26, 104); g.quadraticCurveTo(0, 210, 26, 104); g.fill(); g.restore(); }, t: 'ROCKET' },
    { a: ['#ff2e93', '#8b3dff'], art(g, w, h) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2 - 50, h * .55, 46, 34, -.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(w / 2 + 92, h * .48, 46, 34, -.4, 0, TAU); g.fill(); g.fillRect(w / 2 - 20, h * .16, 14, h * .42); g.fillRect(w / 2 + 122, h * .1, 14, h * .42); g.beginPath(); g.moveTo(w / 2 - 20, h * .16); g.lineTo(w / 2 + 136, h * .1); g.lineTo(w / 2 + 136, h * .22); g.lineTo(w / 2 - 20, h * .28); g.fill(); g.fillStyle = C.yellow; CL.spark(g, w * .16, h * .3, 34, 0, C.yellow); CL.spark(g, w * .86, h * .74, 26, 0, C.cyan); }, t: 'MUSIC' },
    { a: ['#19d68b', '#0b6b7a'], art(g, w, h) { g.fillStyle = '#e7ecff'; g.beginPath(); g.roundRect(w / 2 - 150, h * .22, 300, h * .34, 70); g.fill(); g.fillStyle = '#1a1f7a'; g.fillRect(w / 2 - 100, h * .32, 20, 60); g.fillRect(w / 2 - 120, h * .32 + 20, 60, 20); g.fillStyle = '#ff2e93'; g.beginPath(); g.arc(w / 2 + 90, h * .34, 17, 0, TAU); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(w / 2 + 128, h * .44, 17, 0, TAU); g.fill(); g.fillStyle = '#19c8ff'; g.beginPath(); g.arc(w / 2 + 90, h * .54 - 8, 17, 0, TAU); g.fill(); g.fillStyle = '#7cff3a'; g.beginPath(); g.arc(w / 2 + 52, h * .44, 17, 0, TAU); g.fill(); }, t: 'PLAY' },
    { a: ['#7cff3a', '#19a35f'], art(g, w, h) { g.fillStyle = '#0b1250'; g.fillRect(w / 2 - 130, h * .3, 260, h * .38); g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.save(); g.translate(w / 2 - 130 + i * 44, h * .14); g.rotate(.5); g.fillRect(0, 0, 30, 46); g.restore(); if (i % 2) { g.fillStyle = '#0b1250'; g.save(); g.translate(w / 2 - 130 + i * 44, h * .14); g.rotate(.5); g.fillRect(0, 0, 30, 46); g.restore(); g.fillStyle = '#fff'; } } g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(w / 2 - 20, h * .38); g.lineTo(w / 2 + 44, h * .49); g.lineTo(w / 2 - 20, h * .6); g.fill(); }, t: 'ACTION' },
    { a: ['#ff8a1f', '#ff2e93'], art(g, w, h) { g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h * .42, 96, 0, TAU); g.fill(); g.save(); g.beginPath(); g.arc(w / 2, h * .42, 96, 0, TAU); g.clip(); g.fillStyle = '#141a66'; pentagon(g, w / 2, h * .42, 34, 0); g.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; pentagon(g, w / 2 + Math.cos(a) * 96, h * .42 + Math.sin(a) * 96, 30, a); g.fill(); g.lineWidth = 5; g.strokeStyle = '#141a66'; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 34, h * .42 + Math.sin(a) * 34); g.lineTo(w / 2 + Math.cos(a) * 74, h * .42 + Math.sin(a) * 74); g.stroke(); } g.restore(); g.lineWidth = 8; g.strokeStyle = C.ink; g.beginPath(); g.arc(w / 2, h * .42, 96, 0, TAU); g.stroke(); }, t: 'GOAL' },
  ];
  function thumbImg(i) {
    const p = THUMBS[i], S = 1.25, w = TILE.w, h = TILE.h;
    return CL.layer('s6_thumb' + i, w * S, h * S, g => {
      g.scale(S, S); g.beginPath(); g.roundRect(0, 0, w, h, 40); g.clip(); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, p.a[0]); gr.addColorStop(1, p.a[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      p.art(g, w, h); const bg = g.createLinearGradient(0, h - 90, 0, h); bg.addColorStop(0, 'rgba(5,8,38,0)'); bg.addColorStop(1, 'rgba(5,8,38,.85)'); g.fillStyle = bg; g.fillRect(0, h - 100, w, 100);
      g.font = '76px Bangers'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#050826'; g.strokeText(p.t, w / 2, h - 44); g.fillStyle = '#fff'; g.fillText(p.t, w / 2, h - 44);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(0, h * .55); g.closePath(); g.fill();
      g.restore(); g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.roundRect(3.5, 3.5, w - 7, h - 7, 37); g.stroke();
    });
  }
  function giftBox(ctx, x, yb, o) {
    const { sx = 1, sy = 1, rot = 0, lidOff = null, glow = 0, bowSpin = 0, bowS = 1 } = o;
    ctx.save(); ctx.translate(x, yb); ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.ellipse(10, 6, 290, 32, 0, 0, TAU); ctx.fill();
    if (glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.linear(ctx, 0, -330, 0, -1100, [[0, A.hex('#fff2a0', .9 * glow)], [1, A.hex('#ffd23f', 0)]]); ctx.beginPath(); ctx.moveTo(-200, -320); ctx.lineTo(200, -320); ctx.lineTo(420, -1100); ctx.lineTo(-420, -1100); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // body
    CL.gel(ctx, 0, -150, 450, 300, { fill: '#ff4fa8', dark: '#a80f5a', r: 34, shadow: 0, rim: 'rgba(255,255,255,.85)' });
    ctx.fillStyle = A.linear(ctx, -50, 0, 50, 0, [[0, '#0fa0d8'], [.4, '#4be0ff'], [1, '#0a80c0']]); ctx.fillRect(-50, -300, 100, 300); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-28, -300, 12, 300);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-50, -300); ctx.lineTo(-50, 0); ctx.moveTo(50, -300); ctx.lineTo(50, 0); ctx.stroke();
    // inside (visible when lid is off)
    if (lidOff) { ctx.fillStyle = A.linear(ctx, 0, -308, 0, -270, [[0, '#fffbe0'], [1, '#ffb300']]); ctx.beginPath(); ctx.roundRect(-215, -312, 430, 44, 16); ctx.fill(); A.glow(ctx, 0, -300, 320, '#fff2a0', .9 * glow); }
    // lid
    const L = lidOff || { x: 0, y: 0, r: 0 }; ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(L.r);
    CL.gel(ctx, 0, -338, 500, 108, { fill: '#ff67b8', dark: '#c21a72', r: 30, shadow: 0, rim: 'rgba(255,255,255,.85)' });
    ctx.fillStyle = A.linear(ctx, -50, 0, 50, 0, [[0, '#0fa0d8'], [.4, '#4be0ff'], [1, '#0a80c0']]); ctx.fillRect(-50, -392, 100, 108); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-28, -392, 12, 108);
    ctx.save(); ctx.translate(0, -400); ctx.rotate(bowSpin); ctx.scale(bowS, bowS);
    [-1, 1].forEach(s => { ctx.save(); ctx.rotate(s * .55); ctx.translate(s * 82, -20); ctx.beginPath(); ctx.ellipse(0, 0, 92, 62, 0, 0, TAU); ctx.fillStyle = A.radial(ctx, -20, -20, 10, 100, [[0, '#a8f2ff'], [1, '#0a90d0']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke(); ctx.fillStyle = 'rgba(5,40,120,.35)'; ctx.beginPath(); ctx.ellipse(s * 10, 4, 46, 28, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.fillStyle = A.radial(ctx, -8, -8, 4, 40, [[0, '#a8f2ff'], [1, '#0a90d0']]); ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); ctx.restore();
    ctx.restore(); ctx.restore();
  }
  function hue(t) { return t; }
  function world3bg(ctx, t) {
    CL.bg(ctx, t, { tint: [C.yellow, C.orange, C.pink], base: '#241070' });
    ray(ctx, 960, 470, t, 16, 1300, '#ffd23f', .2 + .1 * P(t, 21.29, 21.4), .25); CL.twinkle(ctx, t, 0, 0, W, 900, 26, 9);
  }
  function catmull(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return [0, 1].map(k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)); }
  function spotPos(t) {
    const R0 = 21.55, dt = .1, pts = [[960, 440]].concat(Array.from({ length: 6 }, (_, i) => tileC(i)), [[960, 520]]);   // pts[i+1] = tile i
    const u = (t - (R0 - dt)) / dt, i = Math.floor(clamp(u, 0, 6.999)), f = clamp(u, 0, 6.999) - i;
    return catmull(pts[Math.max(0, i - 1)], pts[i], pts[Math.min(7, i + 1)], pts[Math.min(7, i + 2)], f);
  }
  function tiles(ctx, t) {
    const R0 = 21.55, dt = .1; if (t < 21.28) return;
    const spot = spotPos(t), spotR = 300 + 260 * P(t, R0 + 5 * dt, R0 + 6 * dt), dimA = .66 * (1 - P(t, R0 + 5.3 * dt, R0 + 6.6 * dt));
    const state = i => { const rt = R0 + i * dt, fs = rt - .17; const tt = i * .02 + 21.30, pp = CL.pop(t, tt, .3); let flip = 0; if (t >= fs) flip = (t - fs) / .17; return { pp, flip, rt }; };
    const drawTile = (i, revealedPass) => {
      const [cx, cy] = tileC(i), s = state(i); if (s.pp <= 0) return; const rev = s.flip > .42, isRevPass = rev; if (isRevPass !== revealedPass) return;
      const px = lerp(BOX.x, cx, Math.min(s.pp, 1.05)), py = lerp(BOX.base - 330, cy, Math.min(s.pp, 1.05)), scl = s.pp; const fl = s.flip; let fx = 1, faceUp = false;
      if (fl > 0) { if (fl < .42) fx = Math.cos(fl / .42 * Math.PI / 2); else { faceUp = true; const u2 = clamp((fl - .42) / .58); fx = Math.min(1.14, ease.outBack(u2) * 1.0); fx = Math.max(.02, fx); } }
      const bob = Math.sin(t * 3 + i) * 4 * clamp(s.pp);
      ctx.save(); ctx.translate(px, py + bob); ctx.rotate((1 - Math.min(1, s.pp)) * (i % 2 ? .6 : -.6)); ctx.scale(scl * fx, scl * (1 + (fx > 1 ? (fx - 1) * .5 : 0)));
      ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.beginPath(); ctx.roundRect(-TILE.w / 2 + 8, -TILE.h / 2 + 16, TILE.w, TILE.h, 40); ctx.fill();
      if (faceUp) ctx.drawImage(thumbImg(i), -TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h);
      else { CL.gel(ctx, 0, 0, TILE.w, TILE.h, { fill: '#5a2fd0', dark: '#1b0e6a', r: 40, shadow: 0, rim: 'rgba(255,255,255,.75)' }); A.text(ctx, '?', 0, 12, { font: '900 250px Rubik', fill: '#fff', stroke: '#2a0a8a', lw: 26 }); }
      ctx.restore();
    };
    for (let i = 0; i < 6; i++) drawTile(i, false);
    if (dimA > 0) { ctx.save(); ctx.fillStyle = A.radial(ctx, spot[0], spot[1], spotR * .55, spotR * 1.3, [[0, 'rgba(6,4,40,0)'], [1, A.hex('#06042a', dimA)]]); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    for (let i = 0; i < 6; i++) drawTile(i, true);
    // spotlight cone + glow
    const sa = clamp(P(t, 21.34, 21.5) * (1 - P(t, R0 + 5.3 * dt, R0 + 7 * dt)));
    if (sa > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.linear(ctx, spot[0], -40, spot[0], spot[1], [[0, 'rgba(255,245,200,.35)'], [1, 'rgba(255,245,200,.08)']]); ctx.globalAlpha = sa; ctx.beginPath(); ctx.moveTo(spot[0] - 40, -40); ctx.lineTo(spot[0] + 40, -40); ctx.lineTo(spot[0] + 300, spot[1] + 140); ctx.lineTo(spot[0] - 300, spot[1] + 140); ctx.closePath(); ctx.fill(); A.glow(ctx, spot[0], spot[1], spotR, '#fff6c0', .32 * sa); ctx.restore(); }
    // reveal bursts (CUE per tile below)
    for (let i = 0; i < 6; i++) { const rt = R0 + i * dt; sparkBurst(ctx, t, rt, tileC(i)[0], tileC(i)[1], 240, 10, 60 + i, .55); if (t >= rt && t < rt + .3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.exp(-(t - rt) * 14) * .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(tileC(i)[0] - TILE.w / 2, tileC(i)[1] - TILE.h / 2, TILE.w, TILE.h, 40); ctx.fill(); ctx.restore(); } }
  }
  function world3fg(ctx, t) {
    // the box: falls in, lands on 20.42, jumps on 20.92, shakes, pops open on 21.29
    const fall = P(t, 20.20, 20.42), boxY = t < 20.42 ? BOX.base - 1100 * (1 - fall * fall) : BOX.base;
    let sx = 1, sy = 1, rot = 0, off = 0, lidOff = null, glow = 0, bowSpin = 0, bowS = 1;
    if (t >= 20.42) { const w = wobble(t, 20.42, 22, 8); sy = 1 - .26 * w; sx = 1 + .2 * w; }
    if (t >= 20.92) { const u = t - 20.92; const hop = Math.max(0, Math.sin(clamp(u / .34) * Math.PI)) * 70; off = -hop; const lw = wobble(t, 21.26, 22, 8); if (u > .34) { sy *= 1 - .12 * wobble(t, 20.92 + .34, 22, 9); } bowSpin = eo(clamp(u / .45)) * TAU; bowS = 1 + .3 * Math.sin(clamp(u / .4) * Math.PI); }
    const shakeK = P(t, 21.05, 21.29), sh = Math.sin(t * 64) * 16 * shakeK * shakeK; rot += Math.sin(t * 55) * .05 * shakeK * shakeK; if (t < 21.29) glow = shakeK * .5;
    if (t >= 21.29) { const u = t - 21.29; lidOff = { x: 40 * u * 9, y: -1500 * u + 3300 * u * u, r: u * 9 }; glow = Math.exp(-u * 1.3) * 1; sy *= 1 + .22 * wobble(t, 21.29, 26, 8) * -1; sx *= 1 - .12 * wobble(t, 21.29, 26, 8) * -1; }
    const boxA = t < 21.29 ? 1 : 1 - ease.in(P(t, 21.5, 21.75)), boxOff = t < 21.29 ? 0 : 120 * ease.in(P(t, 21.45, 21.8));
    if (t >= 20.2 && boxA > 0) { ctx.save(); ctx.globalAlpha = boxA; giftBox(ctx, BOX.x + sh, boxY + off + boxOff, { sx, sy, rot, lidOff, glow, bowSpin, bowS }); ctx.restore(); }
    // CUE 20.42 chest-slam (box lands) / iris flood
    if (t >= 20.42) { splashAt(ctx, BOX.x, BOX.base + 16, 520, t, 20.42, 40, [C.pink, C.yellow, C.orange, C.cyan, C.purple], .8, .35); CL.ring(ctx, BOX.x, BOX.base, 700, P(t, 20.42, 20.9), '#fff', 26); sparkBurst(ctx, t, 20.42, BOX.x, BOX.base - 200, 500, 20, 41, .8); }
    // CUE 20.92 bow-pop + hop
    if (t >= 20.92) { CL.ring(ctx, BOX.x, BOX.base - 400, 300, P(t, 20.92, 21.3), C.cyan, 18); sparkBurst(ctx, t, 20.92, BOX.x, BOX.base - 420, 280, 14, 42, .7); }
    // CUE 21.29 box-pop-open (confetti, sparkles, splashes, light)
    if (t >= 21.29) {
      const u = t - 21.29; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.exp(-u * 8) * .85; ctx.fillStyle = '#fff6c0'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ray(ctx, BOX.x, BOX.base - 320, t * 1.5, 20, 1300, '#fff2a0', .55 * Math.exp(-u * 2.2), .5);
      splashAt(ctx, BOX.x, BOX.base - 320, 620, t, 21.29, 44, null, .9); CL.ring(ctx, BOX.x, BOX.base - 320, 900, P(t, 21.29, 21.8), '#fff', 30); CL.ring(ctx, BOX.x, BOX.base - 320, 700, P(t, 21.34, 21.8), C.pink, 20);
      confetti(ctx, t, 21.29, BOX.x, BOX.base - 320, 150, 61, { spread: 1.1, speed: 1.35, life: 2.0, scale: 1.2 }); confetti(ctx, t, 21.31, BOX.x, BOX.base - 320, 70, 62, { spread: .5, ang: -Math.PI * .8, speed: 1.2, life: 1.8 }); confetti(ctx, t, 21.31, BOX.x, BOX.base - 320, 70, 63, { spread: .5, ang: -Math.PI * .2, speed: 1.2, life: 1.8 });
      sparkBurst(ctx, t, 21.29, BOX.x, BOX.base - 320, 700, 40, 43, .9);
    }
    tiles(ctx, t);
    // CUE 21.55 first tile reveal (spotlight lands), then reveals every 0.1 s: 21.65 21.75 21.85 21.95 22.05
    if (t > 21.9) confetti(ctx, t, 22.05, 960, 470, 60, 71, { spread: 1.4, speed: 1.0, life: 1.3 });
  }

  // ------------------------------------------------------------------ scene
  A.scene({
    name: 's6_discover', start: 17.10, end: 22.6,
    draw(ctx, s) {
      const t = s.t;
      // camera shake on the big hits: 17.40 ball, 17.80 badge, 18.34 goal, 18.78 curtain, 20.09 open, 20.42 chest, 21.29 pop
      const hits = [[17.40, 8], [17.80, 12], [18.34, 22], [18.78, 16], [20.09, 14], [20.42, 24], [21.29, 26]];
      let sx = 0, sy = 0; hits.forEach(([t0, a]) => { const q = CL.shake(t, t0, .45, a); sx += q[0]; sy += q[1]; });
      const mag = Math.hypot(sx, sy); ctx.save(); ctx.translate(960 + sx, 540 + sy); const zs = 1 + Math.min(.06, mag * .0035); ctx.scale(zs, zs); ctx.translate(-960, -540);
      // WORLD 1 (entry: lime/green/cyan liquid wave, CUE 17.10 wave-in)
      if (t < 18.9) transition(ctx, P(t, 17.10, 17.48), [C.cyan, C.lime, C.green], shapeUp, () => world1(ctx, t));
      // WORLD 2 (entry: velvet curtains slam shut on 18.78)
      if (t >= 18.48 && t < 20.95) world2(ctx, t);
      // goal confetti keeps falling in front of the curtain
      confetti(ctx, t, 18.34, IMP[0], IMP[1], 130, 5, { spread: 1.7, speed: 1.1, life: 1.9, scale: 1.1 });
      // WORLD 3 (entry: candy iris flood from the box landing, CUE 20.42)
      if (t >= 20.40) { transition(ctx, P(t, 20.40, 20.88), [C.pink, C.orange, C.yellow], shapeIris, () => world3bg(ctx, t)); }
      if (t >= 20.15) world3fg(ctx, t);
      ctx.restore();
    },
  });
})();
