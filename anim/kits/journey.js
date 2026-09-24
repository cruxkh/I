// ============================================================================
// kits/journey.js — "journey" backgrounds: Tel Aviv night panorama, stadium close,
// data tunnel (inside the fibre), ocean floor + undersea cable, route map inset, packet stream.
// All functions are pure functions of t (deterministic). Static art is cached (A.layer / tiles).
// ============================================================================
(() => {
  const { clamp, lerp } = A;
  const OUT = A.OUTLINE;
  const TAU = Math.PI * 2;
  // good-quality seeded PRNG (mulberry32)
  const mul = seed => { let a = (Math.floor(seed * 2654435761) >>> 0) ^ 0x9e3779b9; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const H = A.hash;
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
  const hexA = A.hex;

  // ---------------------------------------------------------------------------
  // Tiled multi-resolution cache for a static world-space layer.
  // draw(g, x0, y0, x1, y1) paints world coords (the tile rect is given for culling).
  // ---------------------------------------------------------------------------
  const LEVELS = [0.5, 1, 1.6, 2.6];
  function tileLayer(ctx, key, cam, bounds, draw) {
    const z = cam.zoom;
    let lv = LEVELS[LEVELS.length - 1];
    for (const l of LEVELS) if (l >= z * 0.97) { lv = l; break; }
    const T = Math.round(1024 / lv), P = Math.ceil(4 / lv);
    const vx0 = Math.max(bounds[0], cam.x - 980 / z), vx1 = Math.min(bounds[2], cam.x + 980 / z);
    const vy0 = Math.max(bounds[1], cam.y - 560 / z), vy1 = Math.min(bounds[3], cam.y + 560 / z);
    if (vx1 <= vx0 || vy1 <= vy0) return;
    ctx.save(); A.camera(ctx, cam);
    const e = 0.6 / z;
    for (let ty = Math.floor(vy0 / T); ty <= Math.floor(vy1 / T); ty++) {
      for (let tx = Math.floor(vx0 / T); tx <= Math.floor(vx1 / T); tx++) {
        const wx = tx * T, wy = ty * T, S = Math.ceil((T + 2 * P) * lv);
        const c = A.layer(`${key}@${lv}:${tx},${ty}`, S, S, g => {
          g.scale(lv, lv); g.translate(-(wx - P), -(wy - P));
          draw(g, wx - P, wy - P, wx + T + P, wy + T + P);
        });
        ctx.drawImage(c, P * lv, P * lv, T * lv, T * lv, wx - e, wy - e, T + 2 * e, T + 2 * e);
      }
    }
    ctx.restore();
  }
  const hit = (b, x0, y0, x1, y1) => !(b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1);

  // parallax camera for a layer with depth factor f (1 = main world plane)
  const CAM0 = { x: 1920, y: 1080, zoom: 0.5 };
  const lcam = (cam, f) => ({
    x: CAM0.x + (cam.x - CAM0.x) * f, y: CAM0.y + (cam.y - CAM0.y) * f,
    zoom: CAM0.zoom * Math.pow(cam.zoom / CAM0.zoom, f), rot: (cam.rot || 0) * f, shake: cam.shake || 0, t: cam.t || 0,
  });
  const toScreen = (cam, x, y) => [960 + (x - cam.x) * cam.zoom, 540 + (y - cam.y) * cam.zoom];
  const quad = (g, a, b, c, d) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); };
  const bil = (a, b, c, d, u, v) => { // a=TL b=TR(far) c=BR(far) d=BL ; u across, v down
    const x0 = lerp(a[0], d[0], v), y0 = lerp(a[1], d[1], v), x1 = lerp(b[0], c[0], v), y1 = lerp(b[1], c[1], v);
    return [lerp(x0, x1, u), lerp(y0, y1, u)];
  };

  // ===========================================================================
  //                              TEL AVIV PANORAMA
  // ===========================================================================
  const HZ = 1150;                    // sea horizon (world y)
  const VP = [2640, 1150];            // one-point perspective vanishing point (south, along the coast)
  const COAST = [[2600, 1153], [2530, 1190], [2440, 1252], [2330, 1340], [2200, 1460], [2060, 1605], [1920, 1770], [1795, 1940], [1700, 2100], [1660, 2200], [1640, 2300]];
  function coastX(y) {
    if (y <= COAST[0][1]) return COAST[0][0];
    for (let i = 1; i < COAST.length; i++) if (y <= COAST[i][1]) { const [x0, y0] = COAST[i - 1], [x1, y1] = COAST[i]; return lerp(x0, x1, (y - y0) / (y1 - y0)); }
    return COAST[COAST.length - 1][0];
  }
  const kY = y => clamp((y - HZ) / 1000, 0.015, 1.3);
  const beachW = y => 6 + 110 * kY(y);
  const promW = y => 3 + 62 * kY(y);
  const promIn = y => coastX(y) - beachW(y) - promW(y);  // inner (city side) edge of the promenade
  const toVP = (p, f) => [lerp(p[0], VP[0], f), lerp(p[1], VP[1], f)];

  const STAD = { x: 545, y: 1725, W: 285, D: 110 };
  const IPTV = { x0: 1045, x1: 1290, yb: 1915, top: 1545, dep: 0.075 };
  const MAST = { x: 1238, yb: 1518, top: 850 };
  A.TLV = {
    W: 3840, H: 2160, horizonY: HZ, vanishing: { x: VP[0], y: VP[1] },
    stadium: { x: STAD.x, y: STAD.y - 30, rx: STAD.W * 1.6, ry: STAD.D * 1.6 },
    pitch: { x: STAD.x, y: STAD.y },
    mast: { x: MAST.x, y: MAST.yb }, mastTop: { x: MAST.x, y: MAST.top - 14 },
    building: { x: (IPTV.x0 + IPTV.x1) / 2, y: IPTV.yb, top: IPTV.top },
    sign: { x: 1112, y: 1452 }, iptvSign: { x: 1167, y: 1597 },
    seaHorizon: { y: HZ, x0: 2600, x1: 3840 },
    moon: { x: 3230, y: 330 },
    azrieli: { x: 1570, y: 470 },
    jaffa: { x: 2690, y: 1110 },
    coast: COAST.map(p => ({ x: p[0], y: p[1] })),
    // a good broadcast launch path (world coords, main plane): mast top → up and out over the sea
    launchPath: [[MAST.x, MAST.top - 14], [1450, 760], [1900, 740], [2450, 830], [2950, 980], [3450, 1150], [4200, 1330]],
    cams: {
      wide: { x: 1920, y: 1080, zoom: 0.5 },
      stadium: { x: 555, y: 1675, zoom: 2.2 },
      mast: { x: 1230, y: 1140, zoom: 1.5 },
      mastTop: { x: 1300, y: 1000, zoom: 2.2 },
      azrieli: { x: 1600, y: 900, zoom: 1.2 },
      sea: { x: 2900, y: 1250, zoom: 1.0 },
      seaWide: { x: 2700, y: 1150, zoom: 0.7 },
    },
  };

  // ---------------- palette ----------------
  const TA = {
    skyTop: '#090b2a', sky1: '#1b1f4a', sky2: '#3a276a', sky3: '#8a3a7c', hor: '#d8577a', horHot: '#ff9a8a',
    far: '#2f2458', farHaze: '#6a2f6c',
    wallF: '#1f1742', wallS: '#35367a', roof: '#2a2358', midF: '#241c4c', midS: '#3b3c80',
    win: ['#ffcf73', '#ffe4a6', '#ffb35c', '#fff2cf', '#bfe3ff', '#ffd98c'],
    sea0: '#3d2f70', sea1: '#1d2d62', sea2: '#0e2a55', sea3: '#06163a',
    flood: '#ffe9a8', yellow: '#ffd21f', blue: '#1f4fbf',
  };

  // ---------------- box building with one-point perspective ----------------
  // front face faces the camera (north), right face faces the sea (west), roof visible when below the horizon.
  function pbox(g, x, yb, w, h, dep, o) {
    const TL = [x, yb - h], TR = [x + w, yb - h], BR = [x + w, yb], BL = [x, yb];
    const TR2 = toVP(TR, dep), BR2 = toVP(BR, dep), TL2 = toVP(TL, dep);
    const lw = o.lw || 0;
    // roof
    if (TL[1] > VP[1] - 2) { quad(g, TL, TR, TR2, TL2); g.fillStyle = o.roof; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.lineJoin = 'round'; g.stroke(); } }
    // side face
    quad(g, TR, TR2, BR2, BR);
    g.fillStyle = o.side; g.fill();
    if (o.sideWin) o.sideWin(TR, TR2, BR2, BR);
    if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(); }
    // front face
    g.fillStyle = o.front; g.fillRect(x, yb - h, w, h);
    if (o.frontWin) o.frontWin(x, yb - h, w, h);
    if (o.uplight) { g.fillStyle = A.linear(g, 0, yb, 0, yb - Math.min(h, o.uplight[1]), [[0, o.uplight[0]], [1, 'rgba(0,0,0,0)']]); g.fillRect(x, yb - h, w, h); }
    if (o.rim) { g.fillStyle = o.rim; g.fillRect(x + w - Math.max(0.6, w * 0.035), yb - h, Math.max(0.6, w * 0.035), h); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = OUT; g.strokeRect(x, yb - h, w, h); }
    return { TL, TR, BR, BL, TR2, BR2, TL2 };
  }
  // window grid on the front face
  function winGrid(g, x, y, w, h, fh, cw, r, lit, o = {}) {
    const rows = Math.max(1, Math.floor(h / fh) - 1), cols = Math.max(1, Math.floor(w / cw));
    const ww = cw * (o.ww || 0.55), wh = fh * (o.wh || 0.5), ox = (w - cols * cw) / 2 + (cw - ww) / 2;
    const off = o.off || 'rgba(10,6,30,0.55)';
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const px = x + ox + j * cw, py = y + fh * 0.7 + i * fh;
      if (py + wh > y + h - fh * 0.3) continue;
      const on = r() < lit;
      g.fillStyle = on ? pick(r, TA.win) : off;
      if (on) g.globalAlpha = 0.55 + r() * 0.45;
      g.fillRect(px, py, ww, wh); g.globalAlpha = 1;
    }
  }
  // window grid on a perspective (side) face
  function winSide(g, TR, TR2, BR2, BR, fh, cols, r, lit, o = {}) {
    const hgt = BR[1] - TR[1], rows = Math.max(1, Math.floor(hgt / fh) - 1);
    const off = o.off || 'rgba(120,130,220,0.18)';
    for (let i = 0; i < rows; i++) {
      const v0 = (0.7 + i) / (rows + 0.6), v1 = v0 + 0.5 / (rows + 0.6);
      for (let j = 0; j < cols; j++) {
        const u0 = (j + 0.2) / cols, u1 = (j + 0.8) / cols;
        const on = r() < lit;
        const a = bil(TR, TR2, BR2, BR, u0, v0), b = bil(TR, TR2, BR2, BR, u1, v0), c = bil(TR, TR2, BR2, BR, u1, v1), d = bil(TR, TR2, BR2, BR, u0, v1);
        quad(g, a, b, c, d); g.fillStyle = on ? pick(r, TA.win) : off; if (on) g.globalAlpha = 0.6 + r() * 0.4; g.fill(); g.globalAlpha = 1;
      }
      if (o.balcony) { const a = bil(TR, TR2, BR2, BR, 0, v1 + 0.08 / rows), b = bil(TR, TR2, BR2, BR, 1, v1 + 0.08 / rows); g.strokeStyle = o.balcony; g.lineWidth = Math.max(0.5, fh * 0.12); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
  }

  // ---------------- palm tree ----------------
  function palm(g, x, y, s, seed, col = '#120b28', rim = 'rgba(150,160,255,0.55)') {
    const r = mul(seed); const h = 230 * s * (0.8 + r() * 0.4), lean = (r() - 0.5) * 60 * s;
    const tx = x + lean, ty = y - h;
    g.save(); g.lineCap = 'round';
    // trunk
    g.strokeStyle = col; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * 0.1, y - h * 0.5, tx, ty); g.stroke();
    g.strokeStyle = rim; g.lineWidth = 2.2 * s; g.beginPath(); g.moveTo(x + 3 * s, y); g.quadraticCurveTo(x + lean * 0.1 + 3 * s, y - h * 0.5, tx + 2.5 * s, ty + 4 * s); g.stroke();
    // trunk rings
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.2 * s;
    for (let i = 1; i < 14; i++) { const q = i / 14, px = lerp(x, tx, q * q * 0.2 + q * 0.8) , py = lerp(y, ty, q); g.beginPath(); g.moveTo(px - 4.5 * s, py); g.lineTo(px + 4.5 * s, py - 1.5 * s); g.stroke(); }
    // fronds
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 3.3 + (r() - 0.5) * 0.25, L = (70 + r() * 40) * s, droop = 0.6 + r() * 0.5;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * droop * 0.55;
      const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.5 - L * 0.12;
      // leaflet fan (feathered frond)
      g.fillStyle = col; g.beginPath(); g.moveTo(tx, ty);
      g.quadraticCurveTo(mx, my - 7 * s, ex, ey); g.quadraticCurveTo(mx + 2 * s, my + 9 * s, tx, ty + 3 * s); g.fill();
      g.strokeStyle = col; g.lineWidth = 1.3 * s;
      for (let k = 2; k < 9; k++) {
        const q = k / 9, px = (1 - q) * (1 - q) * tx + 2 * (1 - q) * q * mx + q * q * ex, py = (1 - q) * (1 - q) * ty + 2 * (1 - q) * q * my + q * q * ey;
        const nl = (1 - q * 0.7) * 16 * s;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.9) * nl * 0.5, py + nl * 0.9); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.2) * nl * 0.5, py + nl * 0.75); g.stroke();
      }
      if (Math.cos(a) > 0) { g.strokeStyle = rim; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(tx, ty - 1 * s); g.quadraticCurveTo(mx, my - 7 * s, ex, ey); g.stroke(); }
    }
    g.fillStyle = '#2a1a30'; A.ellipse(g, tx, ty + 3 * s, 6 * s, 5 * s); g.fill();
    g.restore();
  }

  // ======================= SKY LAYER (f = 0.15) =======================
  const STARS = (() => { const r = mul(77), a = []; for (let i = 0; i < 700; i++) { const y = Math.pow(r(), 1.5) * 1100 - 150; a.push([r() * 4600 - 380, y, r(), r()]); } return a; })();
  function moonCanvas() {
    return A.layer('tlv-moon', 360, 360, (g, w, h) => {
      const R = 150, cx = 180, cy = 180;
      g.fillStyle = A.radial(g, cx - 30, cy - 30, 10, R * 1.05, [[0, '#fffaf0'], [0.6, '#f7ecd4'], [1, '#e2cfb2']]);
      A.ellipse(g, cx, cy, R, R); g.fill();
      g.save(); g.clip();
      const r = mul(5);
      for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.85, rr = 6 + r() * 26; g.fillStyle = `rgba(170,150,150,${0.10 + r() * 0.16})`; A.ellipse(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr, rr * 0.9); g.fill(); }
      // maria
      [[-40, -30, 55, 40], [30, 20, 45, 34], [-10, 60, 36, 26]].forEach(([x, y, a, b]) => { g.fillStyle = 'rgba(170,150,165,0.22)'; A.ellipse(g, cx + x, cy + y, a, b, 0.4); g.fill(); });
      // terminator shade (lower-left) — cel shading
      g.fillStyle = A.radial(g, cx + 60, cy - 60, R * 0.9, R * 2.1, [[0, 'rgba(90,70,130,0)'], [1, 'rgba(90,70,130,0.55)']]); g.fillRect(0, 0, w, h);
      g.restore();
    });
  }
  function cloudCanvas(i) {
    return A.layer('tlv-cloud' + i, 1000, 170, (g, w, h) => {
      const r = mul(300 + i);
      for (let k = 0; k < 70; k++) {
        const x = 60 + r() * (w - 120), y = h * 0.55 + (r() - 0.5) * h * 0.35 * Math.sin(Math.PI * x / w), rx = 40 + r() * 110, ry = 7 + r() * 16;
        const lit = r();
        g.fillStyle = A.radial(g, x, y, 0, rx, [[0, lit > 0.5 ? 'rgba(255,150,170,0.18)' : 'rgba(150,120,210,0.16)'], [1, 'rgba(0,0,0,0)']]);
        g.save(); g.translate(x, y); g.scale(1, ry / rx); g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.restore(); g.fill();
      }
      // bright under-edge
      for (let k = 0; k < 24; k++) { const x = 80 + r() * (w - 160), y = h * 0.62 + r() * 8; g.fillStyle = 'rgba(255,170,160,0.10)'; A.ellipse(g, x, y, 60 + r() * 80, 3 + r() * 3); g.fill(); }
    });
  }
  const CLOUDS = [[2350, 560, 1.6, 0.9], [700, 330, 1.3, 0.55], [3050, 820, 1.4, 0.8], [1350, 930, 2.0, 0.85], [3500, 250, 1.1, 0.45], [150, 760, 1.5, 0.75]];

  function drawSky(ctx, t, cam) {
    const z = cam.zoom, hy = 540 + (HZ - cam.y) * z, top = hy - HZ * z;
    ctx.fillStyle = A.linear(ctx, 0, top, 0, hy + 10 * z, [[0, TA.skyTop], [0.3, TA.sky1], [0.62, TA.sky2], [0.86, TA.sky3], [0.965, TA.hor], [1, TA.horHot]]);
    ctx.fillRect(0, 0, 1920, 1080);
    const sc = lcam(cam, 0.15);
    ctx.save(); A.camera(ctx, sc);
    const zz = sc.zoom, vx0 = sc.x - 1000 / zz, vx1 = sc.x + 1000 / zz, vy0 = sc.y - 580 / zz, vy1 = sc.y + 580 / zz;
    // stars
    for (let i = 0; i < STARS.length; i++) {
      const [x, y, m, ph] = STARS[i];
      if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      const fade = clamp(1 - (y - 500) / 600), tw = 0.55 + 0.45 * Math.sin(t * (1.5 + ph * 3) + ph * 40);
      const a = fade * tw * (0.35 + m * 0.65), s = (0.8 + m * m * 2.4) / zz;
      ctx.fillStyle = m > 0.9 ? `rgba(255,236,210,${a})` : `rgba(215,225,255,${a})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (m > 0.955) { ctx.globalAlpha = a * 0.6; ctx.fillRect(x - s * 3, y - s * 0.15, s * 6, s * 0.3); ctx.fillRect(x - s * 0.15, y - s * 3, s * 0.3, s * 6); ctx.globalAlpha = 1; }
    }
    // clouds (drift slowly)
    for (const [x, y, s, a] of CLOUDS) {
      const c = cloudCanvas(CLOUDS.indexOf(CLOUDS.find(q => q[0] === x)));
      const dx = x + t * 6 * s;
      ctx.globalAlpha = a; ctx.drawImage(c, dx - 500 * s, y - 85 * s * 0.8, 1000 * s, 170 * s * 0.8); ctx.globalAlpha = 1;
    }
    // moon
    const M = A.TLV.moon;
    A.glow(ctx, M.x, M.y, 520, 'rgba(160,140,255,0.22)');
    A.glow(ctx, M.x, M.y, 190, 'rgba(255,240,215,0.35)');
    ctx.drawImage(moonCanvas(), M.x - 72, M.y - 72, 144, 144);
    ctx.restore();
    return sc;
  }

  // ======================= FAR LAYER (f = 0.55) =======================
  const FAR = (() => {
    const r = mul(11), b = [];
    let x = -900;
    while (x < 2330) {
      const w = 30 + r() * 70, tall = r() < 0.12;
      const h = (tall ? 120 + r() * 170 : 25 + r() * 75) * (x > 2150 ? 0.5 : 1);
      b.push({ x, w, h, yb: HZ + 22 + r() * 30, seed: r() * 1e4, tall });
      x += w * (0.55 + r() * 0.5);
    }
    // second (front) row, slightly lower base
    x = -900; while (x < 2300) { const w = 40 + r() * 80; b.push({ x, w, h: 20 + r() * 70, yb: HZ + 70 + r() * 20, seed: r() * 1e4 }); x += w * (0.7 + r() * 0.5); }
    return b;
  })();
  function drawFarTile(g, x0, y0, x1, y1) {
    // distant hills (Samaria ridge) to the east
    g.fillStyle = '#2a2154';
    g.beginPath(); g.moveTo(-1000, HZ + 60);
    for (let x = -1000; x <= 2500; x += 40) g.lineTo(x, HZ - 40 - 28 * A.noise1(x / 420) - 18 * A.noise1(x / 130 + 7) + clamp((x - 1800) / 700) * 50);
    g.lineTo(2500, HZ + 60); g.closePath(); g.fill();
    for (const q of FAR) {
      if (!hit([q.x - 5, q.yb - q.h - 10, q.x + q.w + 5, q.yb + 400], x0, y0, x1, y1)) continue;
      const r = mul(q.seed);
      g.fillStyle = A.linear(g, 0, q.yb - q.h, 0, q.yb, [[0, '#322a62'], [1, '#4b2c68']]);
      g.fillRect(q.x, q.yb - q.h, q.w, q.h + 400);
      g.fillStyle = 'rgba(140,150,255,0.10)'; g.fillRect(q.x + q.w * 0.8, q.yb - q.h, q.w * 0.2, q.h);
      // tiny window dots
      const n = Math.floor(q.w * q.h / 90);
      for (let i = 0; i < n; i++) { if (r() > 0.45) continue; g.fillStyle = pick(r, TA.win); g.globalAlpha = 0.35 + r() * 0.4; g.fillRect(q.x + 3 + r() * (q.w - 6), q.yb - q.h + 4 + r() * (q.h - 6), 2.2, 1.6); }
      g.globalAlpha = 1;
      if (q.tall) { g.strokeStyle = '#322a62'; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x + q.w / 2, q.yb - q.h); g.lineTo(q.x + q.w / 2, q.yb - q.h - 22); g.stroke(); }
    }
  }
  const FAR_LIGHTS = FAR.filter(q => q.tall).map(q => [q.x + q.w / 2, q.yb - q.h - 22, q.seed]);

  // ======================= MID LAYER (f = 0.85): Azrieli + city =======================
  const AZ = { round: { cx: 1475, top: 430, r: 80 }, tri: { cx: 1665, top: 468, w: 188 }, sq: { cx: 1848, top: 540, w: 162 }, base: 1335 };
  const MID = (() => {
    const r = mul(21), b = [];
    // three rows back->front
    [[1238, 1.0, 0.95], [1300, 0.9, 1.0], [1370, 0.75, 1.0]].forEach(([yb0, hs, dens], row) => {
      let x = -900;
      while (x < 2600) {
        const yb = yb0 + r() * 25, lim = coastX(yb) - beachW(yb) - promW(yb) - 30;
        const w = 50 + r() * 110;
        if (x + w > lim) break;
        const tall = r() < (row === 0 ? 0.22 : 0.08);
        let h = (tall ? 220 + r() * 230 : 60 + r() * 130) * hs;
        // keep the Azrieli towers clear in the back rows
        if (x + w > 1370 && x < 1950 && row < 2) h = Math.min(h, 60 + r() * 40);
        // keep the mast region calm
        if (x + w > 1150 && x < 1330) h = Math.min(h, 100);
        b.push({ x, yb, w, h, dep: 0.05 + r() * 0.05, seed: r() * 1e4, tall, row });
        x += w + 4 + r() * 30;
      }
    });
    return b.sort((a, c) => a.yb - c.yb);
  })();
  function drawRoundTower(g) {
    const { cx, top, r } = AZ.round, yb = AZ.base, h = yb - top;
    // body: cylinder shading dark-left -> moonlit-right
    g.fillStyle = A.linear(g, cx - r, 0, cx + r, 0, [[0, '#15123a'], [0.35, '#221f55'], [0.72, '#3d3f86'], [0.9, '#6567b4'], [1, '#9ea2e6']]);
    g.fillRect(cx - r, top, 2 * r, h);
    // floor bands + window cells (foreshortened toward the edges)
    const rr = mul(801);
    for (let y = top + 22; y < yb - 10; y += 11) {
      for (let a = -1.35; a < 1.35; a += 0.13) {
        const xa = cx + Math.sin(a) * r, xb = cx + Math.sin(a + 0.1) * r;
        const on = rr() < 0.36;
        g.fillStyle = on ? pick(rr, TA.win) : 'rgba(150,160,255,0.12)';
        g.globalAlpha = on ? (0.45 + rr() * 0.5) * (0.5 + 0.5 * Math.cos(a)) : 1;
        g.fillRect(xa, y, Math.max(0.6, xb - xa - 0.6), 5.5);
      }
    }
    g.globalAlpha = 1;
    // vertical mullions
    g.strokeStyle = 'rgba(10,8,30,0.35)'; g.lineWidth = 1;
    for (let a = -1.4; a < 1.4; a += 0.13) { const x = cx + Math.sin(a) * r; g.beginPath(); g.moveTo(x, top + 18); g.lineTo(x, yb); g.stroke(); }
    // crown (the round tower's signature helipad disc)
    g.fillStyle = '#1b1845'; A.ellipse(g, cx, top + 6, r * 1.05, 9); g.fill();
    g.fillStyle = A.linear(g, cx - r, 0, cx + r, 0, [[0, '#1a1744'], [0.8, '#5a5ca8'], [1, '#a8acef']]); g.fillRect(cx - r * 1.05, top - 2, r * 2.1, 10);
    g.fillStyle = '#2d2b66'; A.ellipse(g, cx, top - 2, r * 1.05, 8); g.fill();
    g.fillStyle = 'rgba(255,220,160,0.5)'; A.ellipse(g, cx, top - 2, r * 0.55, 3.2); g.fill();
    g.strokeStyle = '#1a1540'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 20, top - 4); g.lineTo(cx + 20, top - 48); g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = OUT; g.strokeRect(cx - r, top + 4, 2 * r, h);
  }
  function drawTriTower(g) {
    const { cx, top, w } = AZ.tri, yb = AZ.base, e = cx + w * 0.12; // front vertical edge
    const L = cx - w / 2, R = cx + w / 2;
    // top plane (slanted triangle roof)
    g.fillStyle = '#34347a'; A.path(g, [[L, top + 10], [e, top + 2], [R, top + 12], [cx + w * 0.1, top - 6]]); g.fill();
    // left face (shadow)
    g.fillStyle = A.linear(g, L, 0, e, 0, [[0, '#15123a'], [1, '#27245c']]);
    A.path(g, [[L, top + 10], [e, top + 2], [e, yb], [L, yb]]); g.fill();
    // right face (moonlit)
    g.fillStyle = A.linear(g, e, 0, R, 0, [[0, '#4a4c96'], [1, '#6b6fc0']]);
    A.path(g, [[e, top + 2], [R, top + 12], [R, yb], [e, yb]]); g.fill();
    const r = mul(802);
    for (let y = top + 24; y < yb - 10; y += 11) {
      for (let x = L + 4; x < e - 6; x += 9) { const on = r() < 0.33; g.fillStyle = on ? pick(r, TA.win) : 'rgba(120,130,230,0.10)'; g.globalAlpha = on ? 0.4 + r() * 0.5 : 1; g.fillRect(x, y, 6, 5.5); }
      for (let x = e + 4; x < R - 5; x += 8) { const on = r() < 0.3; g.fillStyle = on ? pick(r, TA.win) : 'rgba(200,210,255,0.16)'; g.globalAlpha = on ? 0.5 + r() * 0.5 : 1; g.fillRect(x, y, 5.5, 5.5); }
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(190,200,255,0.8)'; g.fillRect(e - 0.8, top + 2, 1.8, yb - top);
    g.lineWidth = 1.6; g.strokeStyle = OUT; A.path(g, [[L, top + 10], [cx + w * 0.1, top - 6], [R, top + 12], [R, yb], [L, yb]]); g.stroke();
    g.strokeStyle = '#1a1540'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + w * 0.1, top - 6); g.lineTo(cx + w * 0.1, top - 40); g.stroke();
  }
  function drawSqTower(g) {
    const { cx, top, w } = AZ.sq, yb = AZ.base, e = cx - w * 0.18, L = cx - w / 2, R = cx + w / 2;
    g.fillStyle = '#353679'; A.path(g, [[L, top + 8], [e, top + 14], [R, top + 6], [cx + w * 0.05, top]]); g.fill();
    g.fillStyle = A.linear(g, L, 0, e, 0, [[0, '#17143c'], [1, '#262358']]); A.path(g, [[L, top + 8], [e, top + 14], [e, yb], [L, yb]]); g.fill();
    g.fillStyle = A.linear(g, e, 0, R, 0, [[0, '#4c4f9a'], [1, '#5f63b2']]); A.path(g, [[e, top + 14], [R, top + 6], [R, yb], [e, yb]]); g.fill();
    const r = mul(803);
    for (let y = top + 26; y < yb - 10; y += 11) {
      for (let x = L + 3; x < e - 5; x += 8) { const on = r() < 0.3; g.fillStyle = on ? pick(r, TA.win) : 'rgba(120,130,230,0.1)'; g.globalAlpha = on ? 0.4 + r() * 0.5 : 1; g.fillRect(x, y, 5, 5.5); }
      for (let x = e + 4; x < R - 5; x += 9) { const on = r() < 0.34; g.fillStyle = on ? pick(r, TA.win) : 'rgba(200,210,255,0.15)'; g.globalAlpha = on ? 0.5 + r() * 0.5 : 1; g.fillRect(x, y, 6, 5.5); }
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(190,200,255,0.75)'; g.fillRect(e - 0.8, top + 14, 1.6, yb - top);
    g.lineWidth = 1.6; g.strokeStyle = OUT; A.path(g, [[L, top + 8], [cx + w * 0.05, top], [R, top + 6], [R, yb], [L, yb]]); g.stroke();
  }
  function drawMidTile(g, x0, y0, x1, y1) {
    // city ground fill (covers anything below)
    g.fillStyle = '#1a1438'; g.beginPath(); g.moveTo(-1000, 1300);
    for (let y = 1300; y <= 2200; y += 50) g.lineTo(coastX(y) - beachW(y) - promW(y) - 20, y);
    g.lineTo(-1000, 2200); g.closePath(); g.fill();
    const draws = [];
    for (const q of MID) draws.push([q.yb, () => {
      if (!hit([q.x - 5, q.yb - q.h - 30, q.x + q.w + 120, q.yb + 5], x0, y0, x1, y1)) return;
      const r = mul(q.seed);
      pbox(g, q.x, q.yb, q.w, q.h, q.dep, {
        front: q.row === 0 ? '#2a2257' : q.row === 1 ? '#221b4b' : '#1d1742', side: q.row === 0 ? '#44468a' : '#3a3b7e', roof: '#2d2860', lw: 1.2,
        frontWin: (x, y, w, h) => winGrid(g, x, y, w, h, 11, 9, r, q.tall ? 0.4 : 0.3),
        sideWin: (a, b, c, d) => winSide(g, a, b, c, d, 11, Math.max(2, Math.round(q.dep * 60)), r, 0.3),
        uplight: ['rgba(255,150,90,0.18)', 90], rim: 'rgba(170,175,255,0.5)',
      });
      if (q.tall) { g.strokeStyle = '#1b1540'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(q.x + q.w * 0.5, q.yb - q.h); g.lineTo(q.x + q.w * 0.5, q.yb - q.h - 26); g.stroke(); }
      else if (r() < 0.5) { g.fillStyle = '#2d2860'; g.fillRect(q.x + q.w * 0.2, q.yb - q.h - 8, q.w * 0.25, 8); }
    }]);
    draws.push([1236, () => {
      if (!hit([1370, 380, 1960, 1340], x0, y0, x1, y1)) return;
      // podium (mall) + the three towers
      g.fillStyle = '#211a4c'; g.fillRect(1370, 1270, 580, 70);
      g.fillStyle = 'rgba(255,200,120,0.35)'; for (let x = 1380; x < 1940; x += 14) g.fillRect(x, 1290, 9, 5);
      drawSqTower(g); drawTriTower(g); drawRoundTower(g);
    }]);
    draws.sort((a, b) => a[0] - b[0]).forEach(d => d[1]());
    // bake atmospheric depth into the mid layer (only onto painted pixels)
    g.save(); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = A.linear(g, 0, 700, 0, 1500, [[0, 'rgba(30,18,72,0.38)'], [0.6, 'rgba(66,30,98,0.42)'], [1, 'rgba(110,45,110,0.5)']]);
    g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore();
  }

  // ======================= NEAR LAYER (f = 1): coast, hotels, city, stadium, IPTV =======================
  const HOTELS = (() => {
    const r = mul(31), a = []; let yb = 1905;
    const names = ['HOTEL', 'מלון', 'SEA VIEW', 'מלון הים', 'BEACH', 'HOTEL', 'PLAZA', 'מלון'];
    let i = 0;
    while (yb > 1172) {
      const k = kY(yb), xR = promIn(yb) - 6 * k;
      const w = k * (150 + r() * 120), h = k * (300 + r() * 420), dep = 0.07 + r() * 0.05;
      a.push({ x: xR - w, yb, w, h, dep, k, seed: r() * 1e4, name: r() < 0.5 ? names[i % names.length] : null, hue: r() });
      i++;
      // next hotel sits behind this one
      yb = lerp(yb, VP[1], dep) - (6 + r() * 20) * k;
    }
    return a;
  })();
  const LAMPS = (() => { const a = []; let y = 2180; while (y > 1175) { const k = kY(y); a.push([coastX(y) - beachW(y) - promW(y) * 0.25, y, k]); y -= 150 * k + 4; } return a; })();
  const PALMS = (() => { const a = []; let y = 2140, i = 0; while (y > 1190) { const k = kY(y); a.push([coastX(y) - beachW(y) - promW(y) * 0.72, y, k, 900 + i++]); y -= 230 * k + 6; } return a; })();

  // near-city blocks (bottom-left), excluding the stadium & IPTV building footprints.
  // Mixed styles: Bauhaus "White City" blocks with rounded balcony bands, grids, ribbon windows, dark blocks.
  const TREES = [], SLAMPS = [];
  const CITY = (() => {
    const r = mul(41), a = [];
    let yb = 1455;
    while (yb < 2320) {
      const k = kY(yb);
      let x = -120 + r() * 60;
      const lim = promIn(yb) - 40 * k - 10;
      while (x < lim) {
        const w = (60 + r() * 120) * (0.5 + k * 0.6), h = (30 + r() * 110) * (0.4 + k * 0.7);
        const cx = x + w / 2;
        const inStad = Math.pow((cx - STAD.x) / (STAD.W * 1.95), 2) + Math.pow((yb - STAD.y - 10) / (STAD.D * 2.15), 2) < 1;
        const inTV = cx > IPTV.x0 - 70 && cx < IPTV.x1 + 60 && yb > IPTV.top - 20 && yb < IPTV.yb + 90;
        const inHotel = x + w > lim - 10;
        const sv = r();
        const style = sv < 0.38 ? 'bauhaus' : sv < 0.62 ? 'grid' : sv < 0.82 ? 'bands' : 'dark';
        if (!inStad && !inTV && !inHotel) a.push({ x, yb, w, h, dep: 0.03 + r() * 0.03, seed: r() * 1e4, solar: r() < 0.75, style });
        const gap = (6 + r() * 24) * (0.5 + k);
        if (!inStad && !inTV && !inHotel && gap > 12 * (0.5 + k)) {
          if (r() < 0.7) TREES.push([x + w + gap / 2, yb + 4 * k, (0.5 + k * 0.7) * (0.8 + r() * 0.5), r() * 1e4]);
          else SLAMPS.push([x + w + gap / 2, yb + 2 * k, 0.5 + k * 0.7]);
        }
        x += w + gap;
      }
      yb += (55 + r() * 30) * (0.5 + k * 0.8);
    }
    return a;
  })();
  function cityFront(g, q, x, y, w, h, k, r) {
    const s = 0.5 + k * 0.6, fh = 15 * s;
    if (q.style === 'bauhaus') {
      const rows = Math.floor(h / fh);
      for (let i = 0; i < rows; i++) {
        const fy = y + i * fh + fh * 0.25;
        // window strip
        for (let x2 = x + 3 * s; x2 < x + w - 8 * s; x2 += 11 * s) { const on = r() < 0.4; g.fillStyle = on ? pick(r, TA.win) : 'rgba(20,14,50,0.55)'; g.globalAlpha = on ? 0.55 + r() * 0.45 : 1; g.fillRect(x2, fy, 8 * s, fh * 0.42); }
        g.globalAlpha = 1;
        // rounded balcony band
        g.fillStyle = '#8c88c4'; A.rrect(g, x - 1 * s, fy + fh * 0.5, w * (0.55 + (i % 2) * 0.2) + 5 * s, fh * 0.26, [0, fh * 0.13, fh * 0.13, 0]); g.fill();
        g.fillStyle = 'rgba(30,20,60,0.35)'; g.fillRect(x, fy + fh * 0.76, w * (0.55 + (i % 2) * 0.2), fh * 0.08);
      }
    } else if (q.style === 'bands') {
      for (let fy = y + fh * 0.6; fy < y + h - fh * 0.6; fy += fh) {
        g.fillStyle = 'rgba(15,10,45,0.8)'; g.fillRect(x + 3 * s, fy, w - 6 * s, fh * 0.45);
        let x2 = x + 3 * s; while (x2 < x + w - 6 * s) { const L = (8 + r() * 26) * s; if (r() < 0.45) { g.fillStyle = pick(r, TA.win); g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(x2, fy, Math.min(L, x + w - 3 * s - x2), fh * 0.45); g.globalAlpha = 1; } x2 += L; }
      }
    } else winGrid(g, x, y, w, h, fh, 13 * s, r, q.style === 'dark' ? 0.12 : 0.38);
  }
  function tree(g, x, y, s, seed) {
    const r = mul(seed);
    g.strokeStyle = OUT; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 14 * s); g.stroke();
    const pts = [];
    for (let i = 0; i < 5; i++) pts.push([x + (r() - 0.5) * 26 * s, y - 20 * s - r() * 14 * s, (9 + r() * 7) * s]);
    pts.forEach(([px, py, rr]) => { g.fillStyle = '#16263f'; A.ellipse(g, px, py, rr, rr * 0.85); g.fill(); });
    pts.forEach(([px, py, rr]) => { g.fillStyle = 'rgba(90,150,150,0.45)'; A.ellipse(g, px + rr * 0.25, py - rr * 0.3, rr * 0.6, rr * 0.45); g.fill(); });
    pts.forEach(([px, py, rr]) => { g.fillStyle = 'rgba(255,170,90,0.22)'; A.ellipse(g, px, py + rr * 0.45, rr * 0.8, rr * 0.35); g.fill(); });
  }

  // stadium geometry: superellipse loops in ground coords
  function sLoop(th, sc, hgt) {
    const c = Math.cos(th), s = Math.sin(th), n = 5;
    const rr = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
    const u = c * rr * sc, v = s * rr * sc * 0.97;
    return [STAD.x + u * STAD.W * (1 + v * 0.07), STAD.y + v * STAD.D - hgt];
  }
  const ST = { in: 1.07, out: 1.52, hs: 70, roofIn: 1.41, roofH: 86 };
  const CROWD_PAL = [TA.yellow, TA.yellow, TA.yellow, '#ffe36b', '#f2c200', TA.blue, '#2c62d9', '#ffffff', '#1b1a3a', '#ffd21f', '#e9b200'];
  function stadPerson(r, sect) { if (sect === 'away') return pick(r, ['#d9342b', '#ff5a4a', '#ffffff', '#b8201a']); return pick(r, CROWD_PAL); }
  function sectAt(th) { const d = ((th % TAU) + TAU) % TAU; return d > 3.55 && d < 3.95 ? 'away' : 'home'; }

  function drawStadium(g, x0, y0, x1, y1) {
    const N = 160;
    // ground shadow / plaza
    g.fillStyle = '#1a1336'; A.ellipse(g, STAD.x, STAD.y + 18, STAD.W * 1.95, STAD.D * 2.05); g.fill();
    g.fillStyle = '#241c44'; A.ellipse(g, STAD.x, STAD.y + 14, STAD.W * 1.8, STAD.D * 1.9); g.fill();
    // pitch
    const P = (u, v) => [STAD.x + u * STAD.W * (1 + v * 0.07), STAD.y + v * STAD.D];
    g.fillStyle = '#1e6a38'; A.blob(g, Array.from({ length: 40 }, (_, i) => sLoop(i / 40 * TAU, ST.in, 0))); g.fill();
    for (let i = 0; i < 14; i++) {
      const u0 = -0.97 + i * (1.94 / 14), u1 = u0 + 1.94 / 14;
      quad(g, P(u0, -0.94), P(u1, -0.94), P(u1, 0.94), P(u0, 0.94));
      g.fillStyle = i % 2 ? '#2f9a48' : '#39ab53'; g.fill();
    }
    g.strokeStyle = 'rgba(245,255,240,0.85)'; g.lineWidth = 1.6;
    quad(g, P(-0.92, -0.86), P(0.92, -0.86), P(0.92, 0.86), P(-0.92, 0.86)); g.stroke();
    g.beginPath(); g.moveTo(...P(0, -0.86)); g.lineTo(...P(0, 0.86)); g.stroke();
    A.ellipse(g, STAD.x, STAD.y, STAD.W * 0.17, STAD.D * 0.3); g.stroke();
    [[-1, 1], [1, -1]].forEach(([sd]) => { const a = sd * 0.92, b = sd * 0.68; quad(g, P(a, -0.5), P(b, -0.5), P(b, 0.5), P(a, 0.5)); g.stroke(); const c = sd * 0.84; quad(g, P(a, -0.22), P(c, -0.22), P(c, 0.22), P(a, 0.22)); g.stroke(); });
    // pitch sheen (floodlit centre)
    g.fillStyle = A.radial(g, STAD.x, STAD.y, 10, STAD.W * 1.05, [[0, 'rgba(255,255,210,0.22)'], [1, 'rgba(255,255,210,0)']]);
    g.save(); g.scale(1, STAD.D / STAD.W * 1.3); g.fillRect(STAD.x - STAD.W * 1.1, (STAD.y - STAD.D * 1.1) * STAD.W / STAD.D / 1.3, STAD.W * 2.2, STAD.D * 2.2 * STAD.W / STAD.D / 1.3); g.restore();
    // stands: segments far->near
    const segs = [];
    for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU; segs.push([Math.sin((a0 + a1) / 2), a0, a1]); }
    segs.sort((a, b) => a[0] - b[0]);
    const r = mul(51);
    for (const [sv, a0, a1] of segs) {
      const i0 = sLoop(a0, ST.in, 3), i1 = sLoop(a1, ST.in, 3), o0 = sLoop(a0, ST.out, ST.hs), o1 = sLoop(a1, ST.out, ST.hs);
      quad(g, i0, i1, o1, o0);
      g.fillStyle = sv < 0.2 ? '#2a2352' : '#1c1638'; g.fill();
      if (sv < 0.35) {
        // seated crowd rows (far & side stands face us)
        const rows = 20, am = (a0 + a1) / 2, sect = sectAt(am);
        const aisle = Math.floor(am / TAU * N) % 10 === 0;
        for (let k = 0; k < rows; k++) {
          const s0 = (k + 0.5) / rows;
          const light = 1 - s0 * 0.35;
          const cols = 3;
          for (let j = 0; j < cols; j++) {
            if (aisle && j === 1) continue;
            const u = (j + 0.5) / cols, a = lerp(a0, a1, u);
            const pi = sLoop(a, ST.in, 3), po = sLoop(a, ST.out, ST.hs);
            const px = lerp(pi[0], po[0], s0) + (r() - 0.5) * 1.2, py = lerp(pi[1], po[1], s0);
            if (r() < 0.06) continue;
            g.fillStyle = stadPerson(r, sect); g.globalAlpha = light;
            g.fillRect(px - 1.7, py - 1.2, 3.4, 2.8);
            g.fillStyle = r() < 0.5 ? '#c98f65' : '#6b4630'; g.fillRect(px - 0.9, py - 2.8, 1.8, 1.7);
          }
        }
        g.globalAlpha = 1;
      }
    }
    // far roof ring (canopy over the top rows) — back half
    const roof = (half) => {
      for (const [sv, a0, a1] of segs) {
        if ((half < 0) !== (sv < 0)) continue;
        const a = sLoop(a0, ST.roofIn, ST.roofH), b = sLoop(a1, ST.roofIn, ST.roofH), c = sLoop(a1, ST.out + 0.05, ST.roofH + 4), d = sLoop(a0, ST.out + 0.05, ST.roofH + 4);
        quad(g, a, b, c, d); g.fillStyle = sv < 0 ? '#c9c4e6' : '#8f8ab8'; g.fill();
        g.strokeStyle = 'rgba(40,30,80,0.35)'; g.lineWidth = 0.6; g.stroke();
      }
    };
    roof(-1);
    // outer facade on the near half (ribbed wall with LED ribbon)
    for (const [sv, a0, a1] of segs) {
      if (sv < -0.05) continue;
      const g0 = sLoop(a0, ST.out + 0.05, 0), g1 = sLoop(a1, ST.out + 0.05, 0), t0 = sLoop(a0, ST.out + 0.05, ST.roofH + 4), t1 = sLoop(a1, ST.out + 0.05, ST.roofH + 4);
      quad(g, t0, t1, g1, g0);
      const lit = 0.5 + 0.5 * Math.cos(a0 - 0.4);
      g.fillStyle = A.mixc('#1d1640', '#3b3574', lit * 0.8); g.fill();
      // rib
      g.strokeStyle = 'rgba(210,205,255,0.35)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(t0[0], t0[1] + 6); g.lineTo(g0[0], g0[1] - 4); g.stroke();
      // LED ribbon (Maccabi yellow / blue)
      const m0 = bil(t0, t1, g1, g0, 0, 0.32), m1 = bil(t0, t1, g1, g0, 1, 0.32), n1 = bil(t0, t1, g1, g0, 1, 0.42), n0 = bil(t0, t1, g1, g0, 0, 0.42);
      quad(g, m0, m1, n1, n0); g.fillStyle = TA.yellow; g.fill();
      const q0 = bil(t0, t1, g1, g0, 0, 0.42), q1 = bil(t0, t1, g1, g0, 1, 0.42), w1 = bil(t0, t1, g1, g0, 1, 0.5), w0 = bil(t0, t1, g1, g0, 0, 0.5);
      quad(g, q0, q1, w1, w0); g.fillStyle = '#2f64e0'; g.fill();
      // entrance glows at ground
      if (Math.floor(a0 / TAU * N) % 12 === 0) { const e0 = bil(t0, t1, g1, g0, 0, 0.8), e1 = bil(t0, t1, g1, g0, 1, 1); g.fillStyle = 'rgba(255,210,140,0.9)'; g.fillRect(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]); }
    }
    roof(1);
    // outline of the whole bowl
    g.strokeStyle = OUT; g.lineWidth = 2.2;
    A.blob(g, Array.from({ length: 48 }, (_, i) => sLoop(i / 48 * TAU, ST.out + 0.05, ST.roofH + 4))); g.stroke();
    // floodlight pylons
    for (const f of FLOODS) drawPylon(g, f);
  }
  const FLOODS = [0.62, Math.PI - 0.62, Math.PI + 0.62, TAU - 0.62].map(a => {
    const b = sLoop(a, 1.7, 0); const h = Math.sin(a) > 0 ? 215 : 150;
    return { a, x: b[0], y: b[1], h, top: [b[0], b[1] - h] };
  }).sort((p, q) => p.y - q.y);
  function drawPylon(g, f) {
    const [x, y] = [f.x, f.y], tp = f.top;
    g.strokeStyle = OUT; g.lineWidth = 7; g.beginPath(); g.moveTo(x, y); g.lineTo(tp[0], tp[1] + 10); g.stroke();
    g.strokeStyle = '#6d6a9e'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, y); g.lineTo(tp[0], tp[1] + 10); g.stroke();
    g.strokeStyle = 'rgba(200,200,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 1.2, y); g.lineTo(tp[0] + 1.2, tp[1] + 10); g.stroke();
    // light bank facing the pitch
    const dir = Math.sign(STAD.x - x) || 1;
    g.save(); g.translate(tp[0], tp[1]); g.rotate(dir * 0.12);
    g.fillStyle = '#28234d'; g.fillRect(-26, -16, 52, 30); g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(-26, -16, 52, 30);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { g.fillStyle = '#fff7d6'; g.fillRect(-23 + j * 7, -13 + i * 7, 5, 5); }
    g.restore();
  }

  function drawIPTV(g) {
    const { x0, x1, yb, top, dep } = IPTV, w = x1 - x0, h = yb - top;
    const r = mul(61);
    const b = pbox(g, x0, yb, w, h, dep, {
      front: '#1e1946', side: '#34357c', roof: '#302b62', lw: 2.4,
      frontWin: (x, y, ww, hh) => {
        // server floors: cyan glass bands
        for (let i = 0; i < 6; i++) {
          const fy = y + 70 + i * 48;
          g.fillStyle = A.linear(g, x, 0, x + ww, 0, [[0, 'rgba(41,240,255,0.25)'], [0.5, 'rgba(120,250,255,0.55)'], [1, 'rgba(41,240,255,0.25)']]);
          g.fillRect(x + 12, fy, ww - 24, 26);
          g.fillStyle = 'rgba(10,20,50,0.7)'; for (let j = 0; j < 14; j++) g.fillRect(x + 16 + j * ((ww - 32) / 14), fy + 2, 4, 22);
        }
      },
      sideWin: (a, bb, c, d) => winSide(g, a, bb, c, d, 48, 3, r, 0.8),
      rim: 'rgba(180,190,255,0.7)',
    });
    // roof parapet, dishes, AC
    g.fillStyle = '#3a3572'; g.fillRect(x0, top - 6, w, 7); g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(x0, top - 6, w, 7);
    [[1175, 1536, 12], [1200, 1531, 9]].forEach(([dx, dy, s]) => {
      g.fillStyle = '#d6d3f0'; A.ellipse(g, dx, dy, s, s * 0.75, -0.5); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = '#7d78a8'; g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx + s * 0.4, dy + s * 0.9); g.stroke();
    });
    // sign board frame (text drawn live)
    const sx0 = 1046, sx1 = 1180, sy0 = 1418, sy1 = 1482;
    g.strokeStyle = '#231c48'; g.lineWidth = 3; [[sx0 + 14, sy1], [sx1 - 14, sy1]].forEach(([px, py]) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px, 1542); g.stroke(); });
    g.fillStyle = '#120d2a'; A.rrect(g, sx0, sy0, sx1 - sx0, sy1 - sy0, 5); g.fill(); g.lineWidth = 2.5; g.strokeStyle = OUT; g.stroke();
    // mast (lattice tower, red/white bands)
    const { x, top: mt } = MAST, mb = MAST.yb;
    const hw = yy => lerp(18, 4, (mb - yy) / (mb - mt));
    for (let y = mb; y > mt; y -= 32) {
      const a = hw(y), c = hw(y - 32), band = Math.floor((mb - y) / 64) % 2;
      g.strokeStyle = band ? '#e2dcf2' : '#c83b4e'; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(x - a, y); g.lineTo(x - c, y - 32); g.moveTo(x + a, y); g.lineTo(x + c, y - 32); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = band ? 'rgba(226,220,242,0.8)' : 'rgba(200,59,78,0.8)';
      g.beginPath(); g.moveTo(x - a, y); g.lineTo(x + c, y - 32); g.moveTo(x + a, y); g.lineTo(x - c, y - 32); g.moveTo(x - c, y - 32); g.lineTo(x + c, y - 32); g.stroke();
    }
    // antenna panels
    for (let i = 0; i < 3; i++) { const yy = mt + 40 + i * 28; g.fillStyle = '#e8e4f8'; g.fillRect(x - 12, yy, 6, 18); g.fillRect(x + 6, yy, 6, 18); g.strokeStyle = OUT; g.lineWidth = 1.2; g.strokeRect(x - 12, yy, 6, 18); g.strokeRect(x + 6, yy, 6, 18); }
    g.strokeStyle = '#e2dcf2'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, mt); g.lineTo(x, mt - 14); g.stroke();
    // guy wires
    g.strokeStyle = 'rgba(200,200,255,0.25)'; g.lineWidth = 0.8;
    [[x0 + 6, top - 4], [x1 - 4, top - 2]].forEach(([gx, gy]) => { g.beginPath(); g.moveTo(gx, gy); g.lineTo(x, mt + 120); g.moveTo(gx, gy); g.lineTo(x, mt + 260); g.stroke(); });
    return b;
  }

  function drawJaffa(g) {
    // headland at the far end of the coast, warm old-city lights
    const r = mul(71);
    g.fillStyle = '#2a1f4c';
    A.blob(g, [[2470, 1172], [2520, 1140], [2590, 1118], [2660, 1098], [2730, 1092], [2800, 1106], [2860, 1130], [2920, 1158], [2960, 1172], [2700, 1182]]); g.fill();
    // houses stacked on the hill
    for (let i = 0; i < 70; i++) {
      const x = 2490 + r() * 440, base = 1170, crest = 1175 - 78 * Math.exp(-Math.pow((x - 2740) / 150, 2));
      const y = lerp(crest, base, Math.pow(r(), 0.7)), w = 6 + r() * 12, h = 5 + r() * 9;
      g.fillStyle = r() < 0.5 ? '#6e4a62' : '#5a3d5e'; g.fillRect(x, y - h, w, h);
      g.fillStyle = 'rgba(255,190,120,0.55)'; g.fillRect(x, y - h, w, 1.2);
      if (r() < 0.6) { g.fillStyle = pick(r, ['#ffcf73', '#ffb35c', '#ffe4a6']); g.fillRect(x + w * 0.3, y - h * 0.6, 2, 2); }
    }
    // St Peter's bell tower (top of the hill)
    g.fillStyle = '#7c5670'; g.fillRect(2728, 1060, 12, 34); g.fillStyle = '#8f6a82'; A.path(g, [[2726, 1060], [2734, 1046], [2742, 1060]]); g.fill();
    g.fillStyle = '#ffd98c'; g.fillRect(2731, 1068, 5, 7);
    // clock tower (lower, by the old port)
    g.fillStyle = '#8a6178'; g.fillRect(2552, 1112, 12, 50); g.fillStyle = '#9c7390'; g.fillRect(2549, 1108, 18, 6);
    g.fillStyle = '#fff1c4'; A.ellipse(g, 2558, 1122, 3.6, 3.6); g.fill();
    g.fillStyle = '#9c7390'; A.path(g, [[2550, 1108], [2558, 1098], [2566, 1108]]); g.fill();
    // little lighthouse
    g.fillStyle = '#c9b8d8'; g.fillRect(2842, 1110, 6, 20);
    // minaret
    g.fillStyle = '#8a6178'; g.fillRect(2618, 1100, 6, 40); g.beginPath(); g.arc(2621, 1100, 4, Math.PI, 0); g.fill();
    // palms
    palm(g, 2608, 1145, 0.12, 5); palm(g, 2780, 1120, 0.1, 6); palm(g, 2680, 1128, 0.11, 7);
  }

  function drawNearTile(g, x0, y0, x1, y1) {
    // beach + promenade strips along the coast
    const strip = (fx, fill) => {
      g.beginPath(); let first = true;
      for (let y = 1154; y <= 2320; y += 16) { const x = fx[0](y); first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; }
      for (let y = 2320; y >= 1154; y -= 16) g.lineTo(fx[1](y), y);
      g.closePath(); g.fillStyle = fill; g.fill();
    };
    if (x1 > 1300 && y0 < 2330) {
      strip([y => promIn(y) - 400 * kY(y), y => promIn(y)], '#1b1538');
      strip([y => promIn(y), y => coastX(y) - beachW(y)], A.linear(g, 1500, 0, 2300, 0, [[0, '#4a3553'], [1, '#3a2b52']]));
      strip([y => coastX(y) - beachW(y), y => coastX(y) + 2], A.linear(g, 0, 1150, 0, 2200, [[0, '#6b4f6a'], [1, '#8a6468']]));
      // wet sand band
      strip([y => coastX(y) - 8 * kY(y) - 1, y => coastX(y) + 2], 'rgba(40,40,90,0.55)');
      // promenade paving lines
      g.strokeStyle = 'rgba(255,200,150,0.12)'; g.lineWidth = 1;
      for (let y = 1200; y < 2300; y += 22 * kY(y) + 3) { const a = promIn(y), b = coastX(y) - beachW(y); g.beginPath(); g.moveTo(a, y); g.lineTo(b, y + 2); g.stroke(); }
      // lifeguard huts on stilts (iconic)
      [[1940, 0.72], [2230, 1.5]].forEach(([yy, dx]) => {
        const k = kY(yy), x = coastX(yy) - beachW(yy) * 0.45;
        if (!hit([x - 60 * k, yy - 110 * k, x + 60 * k, yy + 5], x0, y0, x1, y1)) return;
        g.strokeStyle = OUT; g.lineWidth = 3 * k; g.beginPath(); g.moveTo(x - 25 * k, yy); g.lineTo(x - 22 * k, yy - 60 * k); g.moveTo(x + 25 * k, yy); g.lineTo(x + 22 * k, yy - 60 * k); g.stroke();
        g.fillStyle = '#e8d9c8'; g.fillRect(x - 36 * k, yy - 100 * k, 72 * k, 42 * k); g.lineWidth = 2.5 * k; g.strokeRect(x - 36 * k, yy - 100 * k, 72 * k, 42 * k);
        g.fillStyle = '#2b5fd1'; g.fillRect(x - 36 * k, yy - 100 * k, 72 * k, 8 * k);
        g.fillStyle = '#ffd98c'; g.fillRect(x - 24 * k, yy - 86 * k, 48 * k, 16 * k);
        g.fillStyle = '#c83b4e'; A.path(g, [[x - 44 * k, yy - 100 * k], [x, yy - 126 * k], [x + 44 * k, yy - 100 * k]]); g.fill(); g.stroke();
      });
    }
    // Jaffa (far)
    if (hit([2440, 1030, 2980, 1190], x0, y0, x1, y1)) drawJaffa(g);
    // depth-sorted items: hotels, city blocks, palms, lamps, stadium, IPTV
    const items = [];
    for (const q of HOTELS) items.push([q.yb, () => {
      if (!hit([q.x - 5, q.yb - q.h - 60 * q.k, q.x + q.w + 300 * q.k, q.yb + 5], x0, y0, x1, y1)) return;
      const r = mul(q.seed), k = q.k;
      const warm = q.hue < 0.5;
      const bx = pbox(g, q.x, q.yb, q.w, q.h, q.dep, {
        front: warm ? '#2a1f4e' : '#221c4a', side: warm ? '#4b4288' : '#3d4290', roof: '#352f6a', lw: Math.max(0.8, 2.6 * k),
        frontWin: (x, y, w, h) => winGrid(g, x, y, w, h, 20 * k, 17 * k, r, 0.42),
        sideWin: (a, b, c, d) => winSide(g, a, b, c, d, 20 * k, Math.max(3, Math.round(q.dep * 110)), r, 0.5, { balcony: 'rgba(220,225,255,0.35)' }),
        uplight: ['rgba(255,160,90,0.3)', 150 * k], rim: 'rgba(190,195,255,0.55)',
      });
      if (q.name && k > 0.12) {
        const tx = q.x + q.w / 2, ty = q.yb - q.h - 14 * k;
        g.fillStyle = OUT; g.fillRect(tx - 1 * k, ty, 2 * k, 14 * k);
        A.text(g, q.name, tx, ty, { font: `700 ${Math.round(24 * k)}px Rubik`, fill: q.hue > 0.7 ? '#9ff0ff' : '#ffd9a0', dir: /[א-ת]/.test(q.name) ? 'rtl' : 'ltr' });
      }
    }]);
    for (const q of CITY) items.push([q.yb, () => {
      if (!hit([q.x - 5, q.yb - q.h - 40, q.x + q.w + 80, q.yb + 5], x0, y0, x1, y1)) return;
      const r = mul(q.seed), k = kY(q.yb), bh = q.style === 'bauhaus';
      const b = pbox(g, q.x, q.yb, q.w, q.h, q.dep, {
        front: bh ? pick(r, ['#4a4680', '#524c86', '#46427a']) : pick(r, ['#231b4a', '#2a2050', '#1f1944', '#2b1f48']),
        side: bh ? pick(r, ['#6d6bb2', '#7672b8']) : pick(r, ['#3c3a80', '#443f86', '#383a7c']),
        roof: bh ? '#5a5594' : pick(r, ['#3a3470', '#433b78', '#352f68']), lw: Math.max(0.8, 2.2 * k),
        frontWin: (x, y, w, h) => cityFront(g, q, x, y, w, h, k, r),
        sideWin: (a, bb, c, d) => winSide(g, a, bb, c, d, 15 * (0.5 + k * 0.6), 2, r, 0.35),
        uplight: ['rgba(255,150,80,0.32)', 70], rim: 'rgba(190,195,255,0.55)',
      });
      // rooftop: solar water heaters (dud shemesh) + tanks
      if (q.solar && b.TL[1] > VP[1]) {
        const n = 1 + Math.floor(r() * 3), s = 0.5 + k * 0.6;
        for (let i = 0; i < n; i++) {
          const u = 0.15 + r() * 0.6, v = 0.3 + r() * 0.4;
          const p = bil(b.TL, b.TL2, [lerp(b.TR2[0], b.TR[0], 0), b.TR2[1]], b.TR, v, u);
          const px = lerp(b.TL[0], b.TR[0], u), py = lerp(b.TL[1], b.TL2[1], v);
          g.fillStyle = '#1e2a66'; A.path(g, [[px - 7 * s, py], [px + 7 * s, py], [px + 5 * s, py - 6 * s], [px - 9 * s, py - 6 * s]]); g.fill();
          g.strokeStyle = 'rgba(150,190,255,0.5)'; g.lineWidth = 0.7 * s; g.stroke();
          g.fillStyle = '#b8b3d8'; A.rrect(g, px - 8 * s, py - 10 * s, 13 * s, 4 * s, 2 * s); g.fill(); g.strokeStyle = OUT; g.lineWidth = 0.8 * s; g.stroke();
        }
      }
    }]);
    for (const [x, y, s2, sd] of TREES) items.push([y, () => { if (hit([x - 40 * s2, y - 50 * s2, x + 40 * s2, y + 5], x0, y0, x1, y1)) tree(g, x, y, s2, sd); }]);
    for (const [x, y, s2] of SLAMPS) items.push([y, () => {
      if (!hit([x - 60 * s2, y - 60 * s2, x + 60 * s2, y + 30 * s2], x0, y0, x1, y1)) return;
      g.fillStyle = A.radial(g, x, y, 0, 50 * s2, [[0, 'rgba(255,170,80,0.45)'], [1, 'rgba(255,150,70,0)']]); g.fillRect(x - 50 * s2, y - 50 * s2, 100 * s2, 100 * s2);
      g.strokeStyle = OUT; g.lineWidth = 2 * s2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 30 * s2); g.stroke();
      g.fillStyle = '#ffd08a'; A.ellipse(g, x, y - 31 * s2, 3 * s2, 2.2 * s2); g.fill();
    }]);
    for (const [x, y, k, seed] of PALMS) items.push([y + 0.5, () => { if (hit([x - 150 * k, y - 320 * k, x + 150 * k, y + 5], x0, y0, x1, y1)) palm(g, x, y, k * 1.05, seed); }]);
    for (const [x, y, k] of LAMPS) items.push([y + 0.3, () => {
      if (!hit([x - 30 * k, y - 110 * k, x + 30 * k, y + 5], x0, y0, x1, y1)) return;
      g.strokeStyle = OUT; g.lineWidth = 3.4 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 80 * k); g.stroke();
      g.strokeStyle = '#6b6394'; g.lineWidth = 1.6 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 80 * k); g.stroke();
      g.fillStyle = '#fff1c4'; A.ellipse(g, x, y - 84 * k, 5 * k, 4 * k); g.fill();
    }]);
    items.push([STAD.y + STAD.D * 1.6, () => { if (hit([STAD.x - STAD.W * 2, STAD.y - STAD.D * 2 - 330, STAD.x + STAD.W * 2, STAD.y + STAD.D * 2.2], x0, y0, x1, y1)) drawStadium(g, x0, y0, x1, y1); }]);
    items.push([IPTV.yb, () => { if (hit([IPTV.x0 - 30, MAST.top - 30, IPTV.x1 + 60, IPTV.yb + 5], x0, y0, x1, y1)) drawIPTV(g); }]);
    // street-lamp pools on the near city streets (static glows)
    items.sort((a, b) => a[0] - b[0]).forEach(d => d[1]());
    // foreground palms at the bottom (big, framing)
    [[1450, 2230, 1.25, 991], [1580, 2260, 1.5, 992]].forEach(([x, y, s, sd]) => { if (hit([x - 250 * s, y - 330 * s, x + 250 * s, y], x0, y0, x1, y1)) palm(g, x, y, s, sd, '#0d0820', 'rgba(170,160,255,0.45)'); });
  }

  // ------------------------- live elements -------------------------
  function drawSea(ctx, t, cam) {
    const z = cam.zoom;
    ctx.save(); A.camera(ctx, cam);
    // clip to the sea (right of the coast, below horizon)
    ctx.beginPath(); ctx.moveTo(COAST[0][0] - 400, HZ);
    ctx.lineTo(5000, HZ); ctx.lineTo(5000, 2600); ctx.lineTo(COAST[COAST.length - 1][0], 2600);
    for (let i = COAST.length - 1; i >= 0; i--) ctx.lineTo(COAST[i][0], COAST[i][1]);
    ctx.lineTo(COAST[0][0] - 400, HZ + 3);
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = A.linear(ctx, 0, HZ, 0, 2200, [[0, TA.sea0], [0.08, TA.sea1], [0.35, TA.sea2], [1, TA.sea3]]);
    ctx.fillRect(1400, HZ - 2, 3700, 1300);
    // horizon haze line
    ctx.fillStyle = A.linear(ctx, 0, HZ - 2, 0, HZ + 40, [[0, 'rgba(255,140,170,0.55)'], [1, 'rgba(255,140,170,0)']]); ctx.fillRect(1400, HZ - 2, 3700, 42);
    // moon glint path (under the moon's screen position)
    const sc = lcam(cam, 0.15), ms = toScreen(sc, A.TLV.moon.x, A.TLV.moon.y);
    const gx = cam.x + (ms[0] - 960) / z;
    ctx.globalCompositeOperation = 'lighter';
    const vy0 = cam.y - 560 / z, vy1 = cam.y + 560 / z, vx0 = cam.x - 980 / z, vx1 = cam.x + 980 / z;
    for (let i = 0; i < 200; i++) {
      const d = Math.pow(i / 200, 1.7) * 1050, y = HZ + 3 + d;
      if (y < vy0 || y > vy1) continue;
      const k = kY(y), spread = 30 + d * 0.22;
      const nx = A.noise2(i * 0.37, t * 1.6) * spread, w = (8 + H(i) * 30) * (0.3 + k * 1.3) * (0.6 + 0.4 * Math.sin(t * 3 + i));
      const a = clamp(1 - Math.abs(nx) / spread) * (0.25 + 0.55 * H(i + 7)) * (0.6 + 0.4 * Math.sin(t * 4.3 + i * 1.7));
      ctx.fillStyle = `rgba(255,236,205,${a})`;
      ctx.fillRect(gx + nx - w / 2, y, w, Math.max(1.2, 3.2 * k));
    }
    A.glow(ctx, gx, HZ + 60, 260, 'rgba(255,220,200,0.18)');
    ctx.globalCompositeOperation = 'source-over';
    // perspective waves
    for (let row = 0; row < 46; row++) {
      const q = row / 46, y = HZ + 6 + Math.pow(q, 2.1) * 1050, k = kY(y);
      if (y < vy0 - 20 || y > vy1 + 20) continue;
      const spacing = 55 + 420 * k, drift = (t * (8 + 30 * k) + row * 97) % spacing;
      const cx0 = Math.max(coastX(y) + 10, vx0 - spacing);
      ctx.lineWidth = Math.max(1 / z, 2.6 * k); ctx.lineCap = 'round';
      for (let x = Math.floor(cx0 / spacing) * spacing - spacing + drift; x < vx1 + spacing; x += spacing) {
        if (x < coastX(y) + 6) continue;
        const hsh = H(Math.floor(x / spacing) * 7.1 + row * 13.3), len = (0.25 + hsh * 0.45) * spacing, bob = Math.sin(t * 1.4 + hsh * 20) * 3 * k;
        ctx.strokeStyle = hsh > 0.5 ? `rgba(150,170,255,${0.18 + 0.12 * k})` : `rgba(30,20,70,${0.35})`;
        ctx.beginPath(); ctx.moveTo(x, y + bob); ctx.quadraticCurveTo(x + len / 2, y + bob - 5 * k, x + len, y + bob); ctx.stroke();
      }
    }
    // reflections of shore lights (vertical shimmering columns)
    ctx.globalCompositeOperation = 'lighter';
    const refl = (x, y, len, col, a, seed) => {
      if (x < vx0 - 40 || x > vx1 + 40 || y > vy1 || y + len < vy0) return;
      const k = kY(y);
      for (let j = 0; j < 9; j++) {
        const yy = y + (j / 9) * len, wig = Math.sin(t * 3 + j * 1.3 + seed) * 4 * (0.3 + k);
        ctx.fillStyle = col; ctx.globalAlpha = a * (1 - j / 9) * (0.6 + 0.4 * Math.sin(t * 5 + j + seed));
        ctx.fillRect(x + wig - 3 * (0.3 + k), yy, 6 * (0.3 + k), len / 12);
      }
      ctx.globalAlpha = 1;
    };
    for (let i = 0; i < 16; i++) refl(2500 + i * 26 + H(i) * 14, 1170, 60 + H(i + 3) * 40, i % 3 ? '#ffc070' : '#ffe0a0', 0.55, i);
    for (const [x, y, k] of LAMPS) refl(coastX(y + 30 * k) + 10 * k, y + 30 * k, 180 * k + 20, '#ffbf6a', 0.35, x);
    ctx.globalCompositeOperation = 'source-over';
    // surf foam along the coast
    for (let pass = 0; pass < 2; pass++) {
      const wash = pass === 0 ? 0 : (0.5 + 0.5 * Math.sin(t * 0.9)) * 1;
      ctx.beginPath();
      for (let y = 1156; y < 2300; y += 10) { const k = kY(y); const x = coastX(y) + (4 + 16 * wash) * k + A.noise2(y * 0.02, t * 0.6 + pass * 5) * 4 * k; y === 1156 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = pass === 0 ? 'rgba(220,230,255,0.55)' : 'rgba(200,215,255,0.25)'; ctx.lineWidth = pass === 0 ? 2.2 : 1.6; ctx.setLineDash(pass ? [14, 22] : [40, 10]); ctx.lineDashOffset = -t * 20; ctx.stroke(); ctx.setLineDash([]);
    }
    // boats with lights
    [[3000, 1200, 0.07, 0], [3560, 1172, 0.03, 1], [2250 + 900, 1420, 0.3, 2]].forEach(([bx, by, k, i]) => {
      const x = bx + Math.sin(t * 0.2 + i) * 20, y = by + Math.sin(t * 1.3 + i) * 2 * k;
      ctx.fillStyle = '#140e2c'; A.path(ctx, [[x - 60 * k, y], [x + 60 * k, y], [x + 45 * k, y + 16 * k], [x - 50 * k, y + 16 * k]]); ctx.fill();
      ctx.fillRect(x - 10 * k, y - 26 * k, 26 * k, 26 * k);
      A.glow(ctx, x, y - 10 * k, 60 * k + 12, 'rgba(255,210,140,0.8)');
      ctx.fillStyle = '#ffe2a0'; ctx.fillRect(x - 6 * k, y - 18 * k, 5 * k + 1, 5 * k + 1);
      refl(x, y + 16 * k, 120 * k + 20, '#ffcf80', 0.4, i * 3);
    });
    ctx.restore();
  }

  function drawHaze(ctx, cam, a, off, col) {
    const hy = 540 + (HZ - cam.y) * cam.zoom;
    ctx.fillStyle = A.linear(ctx, 0, hy - (off + 260) * cam.zoom, 0, hy + 60 * cam.zoom, [[0, 'rgba(0,0,0,0)'], [0.8, col], [1, col]]);
    ctx.globalAlpha = a; ctx.fillRect(0, Math.max(0, hy - (off + 260) * cam.zoom), 1920, (off + 330) * cam.zoom); ctx.globalAlpha = 1;
  }

  // crowd flicker samples (live) — precomputed seat positions on the visible stands
  const SEATS = (() => {
    const r = mul(99), a = [];
    for (let i = 0; i < 700; i++) {
      const th = Math.PI + r() * Math.PI * 1.25 - 0.12 * Math.PI, s = r();
      if (Math.sin(th) > 0.3) continue;
      const pi = sLoop(th, ST.in, 3), po = sLoop(th, ST.out, ST.hs);
      a.push([lerp(pi[0], po[0], s), lerp(pi[1], po[1], s), r(), r()]);
    }
    return a;
  })();
  function drawStadiumLive(ctx, t, cam, o) {
    const z = cam.zoom, roar = o.roar != null ? o.roar : 0.5;
    ctx.save(); A.camera(ctx, cam);
    ctx.globalCompositeOperation = 'lighter';
    // light dome / haze over the bowl
    ctx.save(); ctx.translate(STAD.x, STAD.y - 60); ctx.scale(1, 0.62);
    ctx.fillStyle = A.radial(ctx, 0, 0, 0, STAD.W * 2.1, [[0, 'rgba(255,240,190,0.30)'], [0.45, 'rgba(255,220,170,0.12)'], [1, 'rgba(255,200,160,0)']]);
    ctx.fillRect(-STAD.W * 2.2, -STAD.W * 2.2, STAD.W * 4.4, STAD.W * 4.4); ctx.restore();
    // crowd flicker (scarves / phone screens)
    const fr = Math.floor(t * 12);
    for (let i = 0; i < SEATS.length; i++) {
      const [x, y, h1, h2] = SEATS[i], v = H(i * 3.1 + fr * 0.71);
      if (v < 0.55 - roar * 0.25) continue;
      ctx.fillStyle = h1 < 0.72 ? 'rgba(255,215,40,0.55)' : h1 < 0.92 ? 'rgba(80,130,255,0.6)' : 'rgba(255,255,255,0.6)';
      ctx.fillRect(x - 1.6, y - 1.4 - roar * 1.5 * Math.abs(Math.sin(t * 9 + h2 * 20)), 3.2, 2.2);
    }
    // camera flashes
    for (let i = 0; i < 26; i++) {
      const slot = Math.floor(t * 7 + H(i) * 10), s = SEATS[Math.floor(H(slot * 17.3 + i * 91.7) * SEATS.length)];
      const ph = (t * 7 + H(i) * 10) % 1; if (!s || ph > 0.35 || H(slot + i * 3) > 0.55 + roar * 0.3) continue;
      const a = 1 - ph / 0.35;
      A.glow(ctx, s[0], s[1] - 2, 9 + 8 / z, `rgba(255,255,255,${0.9 * a})`);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(s[0] - 4 * a, s[1] - 2.4, 8 * a, 0.8); ctx.fillRect(s[0] - 0.4, s[1] - 6 * a, 0.8, 8 * a);
    }
    // floodlights: beams + bloom
    for (const f of FLOODS) {
      const [lx, ly] = f.top, fl = 0.95 + 0.05 * Math.sin(t * 31 + f.a * 9);
      ctx.fillStyle = A.linear(ctx, lx, ly, STAD.x, STAD.y, [[0, 'rgba(255,240,190,0.16)'], [1, 'rgba(255,240,190,0)']]);
      ctx.beginPath(); ctx.moveTo(lx - 22, ly); ctx.lineTo(lx + 22, ly); ctx.lineTo(STAD.x + (lx - STAD.x) * 0.1 + 150, STAD.y + 30); ctx.lineTo(STAD.x + (lx - STAD.x) * 0.1 - 150, STAD.y + 30); ctx.closePath(); ctx.fill();
      A.glow(ctx, lx, ly, 150, `rgba(255,235,170,${0.5 * fl})`);
      A.glow(ctx, lx, ly, 55, `rgba(255,250,225,${0.9 * fl})`);
      ctx.fillStyle = 'rgba(255,255,240,0.9)'; ctx.fillRect(lx - 60, ly - 0.8, 120, 1.6); ctx.fillRect(lx - 0.8, ly - 40, 1.6, 80);
    }
    ctx.globalCompositeOperation = 'source-over';
    // tiny players on the pitch (visible when zoomed)
    if (z > 1.1) {
      const P = (u, v) => [STAD.x + u * STAD.W * (1 + v * 0.07), STAD.y + v * STAD.D];
      const bu = 0.35 * Math.sin(t * 0.7) + 0.25, bv = 0.3 * Math.sin(t * 1.1);
      for (let i = 0; i < 22; i++) {
        const team = i < 11, hu = (H(i) * 1.6 - 0.8) * 0.9, hv = (H(i + 40) * 1.6 - 0.8);
        const u = lerp(hu, bu, 0.35) + A.wob(t, i, 0.5) * 0.08, v = lerp(hv, bv, 0.3) + A.wob(t, i + 50, 0.5) * 0.1;
        const [x, y] = P(u, v);
        ctx.fillStyle = 'rgba(0,30,0,0.35)'; A.ellipse(ctx, x + 1.5, y + 0.8, 3, 1.1); ctx.fill();
        ctx.fillStyle = team ? TA.yellow : '#e0322c'; ctx.fillRect(x - 1.5, y - 5, 3, 3.6);
        ctx.fillStyle = team ? TA.blue : '#fff'; ctx.fillRect(x - 1.5, y - 1.8, 3, 1.8);
        ctx.fillStyle = '#6b4630'; ctx.fillRect(x - 0.9, y - 6.6, 1.8, 1.8);
      }
      const [bx, by] = P(bu, bv); ctx.fillStyle = '#fff'; A.ellipse(ctx, bx, by - 1.5, 1.3, 1.3); ctx.fill();
    }
    ctx.restore();
  }

  function drawTLVLive(ctx, t, cam, o) {
    ctx.save(); A.camera(ctx, cam);
    const z = cam.zoom;
    ctx.globalCompositeOperation = 'lighter';
    // promenade lamp glows
    for (const [x, y, k] of LAMPS) {
      A.glow(ctx, x, y - 84 * k, 70 * k + 6, 'rgba(255,190,110,0.55)');
      A.glow(ctx, x, y - 84 * k, 18 * k + 2, 'rgba(255,240,200,0.9)');
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.35); A.glow(ctx, 0, 0, 110 * k + 4, 'rgba(255,170,90,0.28)'); ctx.restore();
    }
    // warm city glow around near-city streets
    A.glow(ctx, 1150, 1900, 700, 'rgba(255,140,80,0.10)');
    // Azrieli crowns (mid layer; approximate in main plane)
    ctx.restore();
    const mc = lcam(cam, 0.85);
    ctx.save(); A.camera(ctx, mc); ctx.globalCompositeOperation = 'lighter';
    const blink = (x, y, ph, r = 1) => { const b = Math.pow(Math.max(0, Math.sin(t * 2.6 + ph)), 6); A.glow(ctx, x, y, 22 * r, `rgba(255,50,60,${0.25 + 0.75 * b})`); ctx.fillStyle = `rgba(255,120,120,${0.5 + 0.5 * b})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); };
    blink(AZ.round.cx + 20, AZ.round.top - 48, 0); blink(AZ.tri.cx + AZ.tri.w * 0.1, AZ.tri.top - 40, 1.3); blink(AZ.sq.cx - 10, AZ.sq.top - 2, 2.1);
    A.glow(ctx, AZ.round.cx, AZ.round.top - 2, 120, 'rgba(160,170,255,0.18)');
    for (const q of MID) if (q.tall) blink(q.x + q.w * 0.5, q.yb - q.h - 26, q.seed, 0.8);
    ctx.restore();
    const fc = lcam(cam, 0.55);
    ctx.save(); A.camera(ctx, fc); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, s] of FAR_LIGHTS) blink(x, y, s, 0.7);
    ctx.restore();
    ctx.save(); A.camera(ctx, cam); ctx.globalCompositeOperation = 'lighter';
    // Jaffa twinkle + clock face glow
    A.glow(ctx, 2558, 1122, 16, 'rgba(255,240,200,0.8)');
    A.glow(ctx, 2700, 1130, 240, 'rgba(255,170,90,0.14)');
    for (let i = 0; i < 12; i++) { const x = 2500 + H(i) * 420, y = 1100 + H(i + 5) * 65, a = 0.4 + 0.6 * Math.max(0, Math.sin(t * (1 + H(i + 9) * 2) + i)); A.glow(ctx, x, y, 7, `rgba(255,210,140,${a * 0.8})`); }
    // IPTV: mast lights, beacon, server LEDs
    const mt = MAST.top;
    for (let i = 0; i < 4; i++) { const y = lerp(MAST.yb - 60, mt, i / 3); const b = Math.pow(Math.max(0, Math.sin(t * 3 + i * 0.6)), 4); A.glow(ctx, MAST.x, y, 26, `rgba(255,40,60,${0.3 + 0.7 * b})`); }
    const bc = 0.6 + 0.4 * Math.sin(t * 6);
    A.glow(ctx, MAST.x, mt - 14, 70, `rgba(255,60,90,${0.5 * bc})`);
    A.glow(ctx, MAST.x, mt - 14, 16, `rgba(255,220,230,${bc})`);
    // broadcast pulses (concentric rings from the mast top)
    const bi = o.broadcast != null ? o.broadcast : 0.6;
    if (bi > 0) {
      ctx.lineWidth = 3 / Math.max(1, z * 0.7);
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.8 + i / 4) % 1, rr = 20 + ph * 320;
        ctx.strokeStyle = `rgba(90,240,255,${(1 - ph) * 0.55 * bi})`;
        ctx.beginPath(); ctx.arc(MAST.x, mt - 14, rr, -Math.PI * 0.95, -Math.PI * 0.05); ctx.stroke();
      }
    }
    // server rack LEDs
    for (let i = 0; i < 6; i++) for (let j = 0; j < 14; j++) {
      const on = H(i * 31 + j * 7 + Math.floor(t * 8 + H(i + j) * 8)) > 0.55; if (!on) continue;
      const x = IPTV.x0 + 16 + j * ((IPTV.x1 - IPTV.x0 - 32) / 14) + 1, y = IPTV.top + 72 + i * 48 + (j % 3) * 7;
      ctx.fillStyle = j % 4 ? 'rgba(80,255,200,0.9)' : 'rgba(255,90,160,0.9)'; ctx.fillRect(x, y, 2, 1.6);
    }
    A.glow(ctx, (IPTV.x0 + IPTV.x1) / 2, IPTV.top + 190, 240, 'rgba(41,240,255,0.10)');
    // neon signs
    const fl = H(Math.floor(t * 14)) > 0.06 ? 1 : 0.35; // occasional neon flicker
    A.glow(ctx, 1113, 1450, 130, `rgba(255,50,110,${0.35 * fl})`);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.shadowColor = 'rgba(255,60,120,0.95)'; ctx.shadowBlur = 14 * z;
    A.text(ctx, 'שידור חי', 1108, 1451, { font: '44px Secular', fill: fl > 0.5 ? '#ffe3ee' : '#ff9ab8', stroke: '#ff2f7d', lw: 3.2, dir: 'rtl' });
    ctx.shadowBlur = 0;
    // "LIVE" dot
    const dot = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(255,40,70,${0.5 + 0.5 * dot})`; A.ellipse(ctx, 1165, 1450, 6, 6); ctx.fill();
    ctx.shadowColor = 'rgba(41,240,255,0.95)'; ctx.shadowBlur = 12 * z;
    A.text(ctx, 'IPTV · ISRAEL', A.TLV.iptvSign.x, A.TLV.iptvSign.y, { font: '800 29px Rubik', fill: '#e6feff', stroke: '#1fd8ff', lw: 2.4 });
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, A.TLV.iptvSign.x, A.TLV.iptvSign.y, 150, 'rgba(41,240,255,0.22)');
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  A.drawTelAviv = (ctx, t, o = {}) => {
    const cam = Object.assign({}, CAM0, o.cam || {}); cam.t = t;
    ctx.save();
    drawSky(ctx, t, cam);
    tileLayer(ctx, 'tlv-far', lcam(cam, 0.55), [-1100, 850, 2600, 1700], drawFarTile);
    drawHaze(ctx, cam, 0.75, 80, 'rgba(150,60,120,0.55)');
    drawSea(ctx, t, cam);
    tileLayer(ctx, 'tlv-mid', lcam(cam, 0.85), [-1100, 350, 2700, 2250], drawMidTile);
    drawHaze(ctx, cam, 0.35, -20, 'rgba(120,60,140,0.5)');
    tileLayer(ctx, 'tlv-near', cam, [-300, 950, 3100, 2400], drawNearTile);
    drawStadiumLive(ctx, t, cam, o);
    drawTLVLive(ctx, t, cam, o);
    ctx.restore();
  };

  // ===========================================================================
  //                              STADIUM CLOSE
  // ===========================================================================
  // Camera sits in the home stand looking across the floodlit pitch at the packed far stand.
  const SC = { standTop: 96, standBot: 478, board: 482, pitch: 516 };
  const SC_ROWS = 30;
  const scRowY = i => lerp(SC.standTop + 14, SC.standBot - 6, Math.pow(i / (SC_ROWS - 1), 1.08)); // i=0 back/top row
  const scRowS = i => lerp(0.62, 1.0, i / (SC_ROWS - 1));
  function crowdTexture(variant) {
    return A.layer('sc-crowd-' + variant, 1920, 400, (g, w, h) => {
      const r = mul(variant === 'up' ? 4242 : 4242), r2 = mul(variant === 'up' ? 77 : 78);
      const oy = SC.standTop - 10; // texture y offset (texture y = world y - oy)
      g.translate(0, -oy);
      // stand concrete + seats
      g.fillStyle = A.linear(g, 0, SC.standTop, 0, SC.standBot, [[0, '#1a1438'], [1, '#2b2358']]);
      g.fillRect(0, SC.standTop - 10, w, SC.standBot - SC.standTop + 20);
      for (let i = 0; i < SC_ROWS; i++) { g.fillStyle = i % 2 ? 'rgba(255,210,31,0.10)' : 'rgba(31,79,191,0.12)'; g.fillRect(0, scRowY(i) - 4, w, 3); }
      for (let i = 0; i < SC_ROWS; i++) {
        const y = scRowY(i), s = scRowS(i), step = 14.5 * s;
        for (let x = -10 + (i % 2) * step * 0.5; x < w + 10; x += step * (0.92 + r() * 0.16)) {
          // gangways
          const gw = (x + 40) % 320; if (gw < 16 * s) { r(); r(); r(); continue; }
          if (r() < 0.035) { r(); r(); continue; }
          const away = x > 1520 && x < 1780 && i > 6;
          const pv = r();
          let shirt = away ? pick(r, ['#d9342b', '#b8201a', '#ffffff']) : pv < 0.62 ? pick(r, ['#ffd21f', '#ffcb0a', '#f5c400', '#ffe04d']) : pv < 0.84 ? pick(r, ['#1f4fbf', '#2a5fd6']) : pick(r, ['#ffffff', '#1d1b3a', '#e8e4ff']);
          const skin = pick(r, ['#c98f65', '#e0b08a', '#8a5a3c', '#f1c9a5']);
          const hair = pick(r, ['#1d1330', '#3a2418', '#6b4a2a', '#1d1330', '#c9c3d8']);
          const jx = (r2() - 0.5) * 3 * s, jy = (r2() - 0.5) * 2 * s;
          const px = x + jx, py = y + jy;
          const light = 0.72 + 0.28 * (i / SC_ROWS);
          g.globalAlpha = 1;
          // body
          g.fillStyle = A.mixc(shirt.length === 7 ? shirt : '#ffd21f', '#120c2a', 1 - light);
          A.rrect(g, px - 6 * s, py - 9 * s, 12 * s, 13 * s, 4 * s); g.fill();
          // arms / scarves
          const up = variant === 'up' ? r2() < 0.72 : r2() < 0.12;
          if (up) {
            const scarf = r2() < 0.45;
            g.strokeStyle = skin; g.lineWidth = 2.2 * s; g.lineCap = 'round';
            const spread = 3 + r2() * 4;
            g.beginPath(); g.moveTo(px - 4 * s, py - 7 * s); g.lineTo(px - spread * s, py - 22 * s); g.moveTo(px + 4 * s, py - 7 * s); g.lineTo(px + spread * s, py - 22 * s); g.stroke();
            if (scarf) {
              const sw = spread * 2 * s + 6 * s;
              for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#1f4fbf' : '#ffd21f'; g.fillRect(px - sw / 2 + k * sw / 5, py - 25 * s, sw / 5 + 0.3, 4.5 * s); }
            }
          }
          // head
          g.fillStyle = A.mixc(skin, '#120c2a', (1 - light) * 0.8); A.ellipse(g, px, py - 12 * s, 4.2 * s, 4.6 * s); g.fill();
          g.fillStyle = hair; A.ellipse(g, px, py - 14 * s, 4.2 * s, 2.6 * s); g.fill();
          // rim light from floodlights (upper left & right)
          g.fillStyle = 'rgba(255,240,200,0.35)'; g.fillRect(px + 2.6 * s, py - 15 * s, 1.2 * s, 5 * s);
        }
      }
      // gangway stairs (lighter)
      for (let x = -40; x < w + 320; x += 320) { g.fillStyle = 'rgba(160,150,210,0.18)'; A.path(g, [[x - 2, SC.standTop], [x + 10, SC.standTop], [x + 13, SC.standBot], [x - 5, SC.standBot]]); g.fill(); }
      // tier balcony front (mid-stand ribbon)
      const by = scRowY(11) + 8;
      g.fillStyle = '#16102e'; g.fillRect(0, by, w, 16);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, by, w, 2);
    });
  }
  function scFlag(ctx, x, y, t, s, colA, colB, seed, roar) {
    // pole + waving flag (live)
    const L = 120 * s, Hh = 70 * s, sway = Math.sin(t * 2 + seed) * 0.12 + roar * Math.sin(t * 5 + seed) * 0.12;
    const px = x + Math.sin(sway) * 150 * s, py = y - Math.cos(sway) * 150 * s;
    ctx.strokeStyle = OUT; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke();
    ctx.strokeStyle = '#cfc8e8'; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke();
    const N = 12, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, wv = Math.sin(u * 5 - t * (6 + roar * 4) + seed) * 10 * s * u;
      top.push([px + u * L, py + wv + u * 8 * s]); bot.push([px + u * L * 0.97, py + Hh + wv * 1.1 + u * 10 * s]);
    }
    for (let band = 0; band < 3; band++) {
      ctx.beginPath();
      const va = band / 3, vb = (band + 1) / 3;
      for (let i = 0; i <= N; i++) { const a = top[i], b = bot[i]; const x2 = lerp(a[0], b[0], va), y2 = lerp(a[1], b[1], va); i ? ctx.lineTo(x2, y2) : ctx.moveTo(x2, y2); }
      for (let i = N; i >= 0; i--) { const a = top[i], b = bot[i]; ctx.lineTo(lerp(a[0], b[0], vb), lerp(a[1], b[1], vb)); }
      ctx.closePath(); ctx.fillStyle = band === 1 ? colB : colA; ctx.fill();
    }
    // shading folds
    for (let i = 1; i < N; i++) { const sh = Math.cos((i / N) * 5 - t * (6 + roar * 4) + seed); if (sh > 0.3) continue; ctx.strokeStyle = `rgba(20,10,50,${0.25 * -sh + 0.05})`; ctx.lineWidth = L / N; ctx.beginPath(); ctx.moveTo(top[i][0], top[i][1]); ctx.lineTo(bot[i][0], bot[i][1]); ctx.stroke(); }
    ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3 * s; ctx.stroke();
  }
  function scStatic() {
    return A.layer('sc-static', 1920, 1080, (g, w, h) => {
      // night sky slit between roofs
      g.fillStyle = A.linear(g, 0, 0, 0, 120, [[0, '#0d0f33'], [1, '#2d2360']]); g.fillRect(0, 0, w, 130);
      // far roof canopy with light row
      g.fillStyle = '#2a2452'; g.fillRect(0, 58, w, 40);
      g.fillStyle = '#3d3670'; g.fillRect(0, 88, w, 10);
      g.strokeStyle = 'rgba(160,150,220,0.35)'; g.lineWidth = 2; for (let x = 0; x < w; x += 60) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 30, 96); g.lineTo(x + 60, 60); g.stroke(); }
      for (let x = 20; x < w; x += 48) { g.fillStyle = '#fff6d8'; g.fillRect(x, 92, 10, 4); }
      // pitch
      const vx = 960, vy = -900;
      g.fillStyle = '#23843e'; g.fillRect(0, SC.pitch, w, h - SC.pitch);
      const px = (xb, y) => vx + (xb - vx) * (y - vy) / (h - vy);
      for (let i = -14; i < 14; i++) {
        const xa = 960 + i * 190, xb = xa + 190;
        A.path(g, [[px(xa, SC.pitch), SC.pitch], [px(xb, SC.pitch), SC.pitch], [xb, h], [xa, h]]);
        g.fillStyle = (i + 20) % 2 ? '#2f9a48' : '#38a852'; g.fill();
      }
      // lines
      g.strokeStyle = 'rgba(250,255,245,0.9)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, SC.pitch + 26); g.lineTo(w, SC.pitch + 26); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(px(960, SC.pitch + 26), SC.pitch + 26); g.lineTo(960, h); g.stroke();
      g.lineWidth = 6; A.ellipse(g, 960, 860, 420, 150); g.stroke();
      g.fillStyle = '#fff'; A.ellipse(g, 960, 860, 9, 4); g.fill();
      // mowing sheen + floodlit hot spots
      g.fillStyle = A.radial(g, 960, 720, 50, 1100, [[0, 'rgba(255,255,210,0.18)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, SC.pitch, w, h);
      g.fillStyle = A.linear(g, 0, SC.pitch, 0, h, [[0, 'rgba(10,30,20,0.35)'], [0.25, 'rgba(0,0,0,0)'], [1, 'rgba(8,20,30,0.25)']]); g.fillRect(0, SC.pitch, w, h);
      // player shadows? no — keep the pitch clean for the scene
      // ad-board frame
      g.fillStyle = '#0c0820'; g.fillRect(0, SC.board, w, SC.pitch - SC.board + 4);
      g.strokeStyle = OUT; g.lineWidth = 3; g.beginPath(); g.moveTo(0, SC.pitch + 3); g.lineTo(w, SC.pitch + 3); g.stroke();
    });
  }
  function scFan(ctx, x, y, s, t, roar, seed, flip) {
    // foreground fan silhouette (back view), rim-lit by floodlights
    const r = mul(seed), jump = roar * Math.abs(Math.sin(t * 7.5 + seed)) * 40 * s, yy = y - jump;
    const shirt = r() < 0.6 ? '#b99210' : '#16357f';
    ctx.save(); ctx.translate(x, yy); if (flip) ctx.scale(-1, 1);
    const sleeve = A.mixc(shirt, '#0d0820', 0.55);
    const arm = (sd, ph) => {
      const up = clamp(0.35 + roar * 0.8 + 0.25 * Math.sin(t * 6 + ph));
      const sh = [sd * 72 * s, -150 * s];
      const a1 = -Math.PI / 2 + sd * lerp(1.1, 0.35, up), el = [sh[0] + Math.cos(a1) * 95 * s, sh[1] + Math.sin(a1) * 95 * s];
      const a2 = a1 - sd * lerp(0.9, 0.15, up), hd = [el[0] + Math.cos(a2) * 85 * s, el[1] + Math.sin(a2) * 85 * s];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = OUT; ctx.lineWidth = 40 * s; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(el[0], el[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke();
      ctx.strokeStyle = sleeve; ctx.lineWidth = 30 * s; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,236,180,0.55)'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(el[0] + 12 * s, el[1]); ctx.lineTo(hd[0] + 12 * s, hd[1]); ctx.stroke();
      ctx.fillStyle = '#5a3a2c'; A.ellipse(ctx, hd[0], hd[1], 21 * s, 23 * s); A.fillStroke(ctx, '#5a3a2c', 6 * s);
    };
    arm(-1, seed); arm(1, seed * 2 + 1);
    ctx.fillStyle = A.mixc(shirt, '#0d0820', 0.5); A.blob(ctx, [[-110 * s, 40 * s], [-95 * s, -120 * s], [-50 * s, -175 * s], [50 * s, -175 * s], [95 * s, -120 * s], [110 * s, 40 * s]]); A.fillStroke(ctx, null, 7 * s);
    ctx.fill();
    ctx.fillStyle = '#1a1030'; A.ellipse(ctx, 0, -225 * s, 50 * s, 58 * s); A.fillStroke(ctx, '#1a1030', 7 * s);
    // rim light
    ctx.strokeStyle = 'rgba(255,236,180,0.8)'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.arc(0, -225 * s, 46 * s, -1.4, -0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60 * s, -168 * s); ctx.quadraticCurveTo(98 * s, -120 * s, 104 * s, 0); ctx.stroke();
    // scarf around the neck
    ctx.fillStyle = '#ffd21f'; A.rrect(ctx, -55 * s, -182 * s, 110 * s, 22 * s, 10 * s); A.fillStroke(ctx, '#ffd21f', 5 * s);
    ctx.fillStyle = TA.blue; ctx.fillRect(-20 * s, -182 * s, 18 * s, 22 * s); ctx.fillRect(22 * s, -182 * s, 18 * s, 22 * s);
    ctx.restore();
  }
  A.drawStadiumClose = (ctx, t, o = {}) => {
    const roar = clamp(o.roar != null ? o.roar : 0.3);
    ctx.save();
    ctx.drawImage(scStatic(), 0, 0);
    // far stand crowd: base texture in horizontal bands, each band bouncing with the roar
    const base = crowdTexture('sit'), up = crowdTexture('up'), oy = SC.standTop - 10;
    ctx.drawImage(base, 0, oy);
    const bands = 10, cols = 8, bw = 1920 / cols;
    for (let b = 0; b < bands; b++) {
      const y0 = (b / bands) * 400, bh = 400 / bands + 1;
      for (let c = 0; c < cols; c++) {
        const ph = H(b * 13 + c * 7) * TAU, jump = -roar * Math.max(0, Math.sin(t * (7 + H(c) * 2) + ph)) * (3 + 4 * b / bands) - A.wob(t, b * 9 + c, 1.5) * 0.8;
        ctx.drawImage(base, c * bw, y0, bw, bh, c * bw, oy + y0 + jump, bw, bh);
        const ua = clamp(roar * 1.1 - 0.1 + 0.35 * Math.sin(t * 3 + ph));
        if (ua > 0.02) { ctx.globalAlpha = ua; ctx.drawImage(up, c * bw, y0, bw, bh, c * bw, oy + y0 + jump, bw, bh); ctx.globalAlpha = 1; }
      }
    }
    ctx.fillStyle = A.linear(ctx, 0, SC.standTop - 4, 0, SC.standTop + 90, [[0, 'rgba(12,8,30,0.75)'], [1, 'rgba(12,8,30,0)']]); ctx.fillRect(0, SC.standTop - 4, 1920, 94);
    // mid-tier LED ribbon (animated chase)
    const by = scRowY(11) + 8;
    for (let x = 0; x < 1920; x += 24) { const on = (Math.floor(x / 24) + Math.floor(t * 10)) % 6 < 3; ctx.fillStyle = on ? '#ffd21f' : '#1f4fbf'; ctx.fillRect(x + 2, by + 4, 20, 8); }
    // big banner hanging from the tier front
    ctx.save(); ctx.translate(960, by + 14);
    const wv = x => Math.sin(x * 0.01 + t * 1.5) * 3;
    ctx.beginPath(); ctx.moveTo(-250, 0); for (let x = -250; x <= 250; x += 20) ctx.lineTo(x, wv(x)); for (let x = 250; x >= -250; x -= 20) ctx.lineTo(x, 70 + wv(x) * 1.5); ctx.closePath();
    ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = TA.blue; ctx.fillRect(-250, 8, 500, 5); ctx.fillRect(-250, 57, 500, 5);
    A.text(ctx, 'מכבי · MACCABI', 0, 36, { font: '44px Secular', fill: TA.blue, dir: 'rtl' });
    ctx.restore();
    // flags in the stand
    [[140, 330, 0.9, 0], [470, 240, 0.72, 1], [600, 440, 0.95, 2], [1290, 440, 0.95, 3], [1440, 235, 0.7, 4], [1720, 350, 0.9, 5]].forEach(([x, y, s, i]) =>
      scFlag(ctx, x, y - roar * Math.abs(Math.sin(t * 7 + i)) * 6, t, s, i % 2 ? TA.blue : TA.yellow, i % 2 ? TA.yellow : TA.blue, i * 1.7, roar));
    // LED ad boards (scrolling)
    ctx.save(); ctx.beginPath(); ctx.rect(0, SC.board + 3, 1920, SC.pitch - SC.board - 3); ctx.clip();
    ctx.fillStyle = A.linear(ctx, 0, SC.board, 0, SC.pitch, [[0, '#0b1f5a'], [1, '#07123a']]); ctx.fillRect(0, SC.board, 1920, 40);
    const msgs = [['IPTV · ISRAEL', '#29f0ff', 'ltr'], ['שידור חי', '#ff4f8b', 'rtl'], ['⚽ 89\'', '#ffd21f', 'ltr'], ['מכבי תל אביב', '#ffd21f', 'rtl'], ['LIVE', '#ff4f8b', 'ltr']];
    const seg = 380, off = (t * 90) % (seg * msgs.length);
    for (let i = -1; i < 7; i++) {
      const k = ((i % msgs.length) + msgs.length) % msgs.length, x = i * seg - off + seg * 0.5;
      const [m, c, d] = msgs[k];
      A.text(ctx, m, x, SC.board + 18, { font: '700 26px Rubik', fill: c, dir: d });
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = SC.board; y < SC.pitch; y += 3) ctx.fillRect(0, y, 1920, 1);
    ctx.restore();
    // floodlights + beams + haze (additive)
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = A.linear(ctx, 0, 60, 0, 520, [[0, 'rgba(255,235,190,0.10)'], [1, 'rgba(255,235,190,0)']]); ctx.fillRect(0, 60, 1920, 460);
    const lights = [[150, 40], [1770, 40]];
    for (const [lx, ly] of lights) {
      ctx.fillStyle = A.linear(ctx, lx, ly, 960, 800, [[0, 'rgba(255,240,200,0.20)'], [1, 'rgba(255,240,200,0)']]);
      ctx.beginPath(); ctx.moveTo(lx - 60, ly); ctx.lineTo(lx + 60, ly); ctx.lineTo(960 + (lx - 960) * 0.1 + 500, 1080); ctx.lineTo(960 + (lx - 960) * 0.1 - 500, 1080); ctx.closePath(); ctx.fill();
      A.glow(ctx, lx, ly, 380, 'rgba(255,230,170,0.45)');
      A.glow(ctx, lx, ly, 120, 'rgba(255,250,230,0.95)');
      ctx.fillStyle = 'rgba(255,255,245,0.55)'; ctx.fillRect(lx - 260, ly - 2, 520, 4);
      ctx.fillStyle = 'rgba(255,255,245,0.35)'; ctx.fillRect(lx - 2, ly - 90, 4, 180);
    }
    // camera flashes in the crowd
    const nF = 10 + Math.round(roar * 26);
    for (let i = 0; i < nF; i++) {
      const slot = Math.floor(t * 6 + H(i) * 7), ph = (t * 6 + H(i) * 7) % 1;
      if (ph > 0.3) continue;
      const x = H(slot * 3.7 + i * 11.1) * 1920, y = lerp(SC.standTop + 20, SC.standBot - 20, H(slot * 5.3 + i * 2.9));
      const a = 1 - ph / 0.3;
      A.glow(ctx, x, y, 34, `rgba(255,255,255,${0.85 * a})`);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x - 14 * a, y - 1, 28 * a, 2); ctx.fillRect(x - 1, y - 10 * a, 2, 20 * a);
    }
    // phone-light / flicker sparkle
    const fr = Math.floor(t * 12);
    for (let i = 0; i < 90; i++) {
      if (H(i * 7.7 + fr * 0.37) > 0.35 + roar * 0.3) continue;
      const x = H(i * 1.3) * 1920, y = lerp(SC.standTop + 10, SC.standBot - 10, H(i * 2.1));
      ctx.fillStyle = H(i) < 0.7 ? 'rgba(255,220,80,0.5)' : 'rgba(120,170,255,0.55)'; ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalCompositeOperation = 'source-over';
    // near roof of our own stand (top band) — dark truss framing the top
    ctx.fillStyle = '#0d0922'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1920, 0); ctx.lineTo(1920, 34); ctx.quadraticCurveTo(960, 58, 0, 34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 34); ctx.quadraticCurveTo(960, 58, 1920, 34); ctx.stroke();
    // foreground fans (lower corners) — keep the middle clear
    const fans = [[70, 1180, 1.25, 1, false], [300, 1230, 1.1, 2, true], [1650, 1210, 1.15, 3, false], [1880, 1170, 1.3, 4, true]];
    fans.forEach(([x, y, s, sd, fl]) => scFan(ctx, x, y, s, t, roar, sd, fl));
    // pitch-level haze & depth grading
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = A.linear(ctx, 0, 440, 0, 620, [[0, 'rgba(255,240,200,0)'], [0.5, 'rgba(255,240,200,0.07)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(0, 440, 1920, 180);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  // ===========================================================================
  //                              DATA TUNNEL
  // ===========================================================================
  const DT = { vx: 960, vy: 470, F: 620, floor: 0.62, rx: 1.75, ry: 1.12 };
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const WALL0 = Math.asin(0.62 / 1.12), WALLS = Math.PI + 2 * Math.asin(0.62 / 1.12);
  const TRACES = (() => { const r = mul(606), a = []; for (let i = 0; i < 46; i++) { const th = Math.asin(0.62 / 1.12) - (0.05 + r() * 0.9) * (Math.PI + 2 * Math.asin(0.62 / 1.12)); a.push({ th, z0: r() * 30, len: 2 + r() * 6, jog: (r() - 0.5) * 0.18, hue: r() < 0.6 ? 0 : 1, sp: 0.6 + r() }); } return a; })();
  function dtProj(th, rad, z, zCam) { // point on tunnel wall at angle th (0 = right, -PI/2 = top)
    const d = z - zCam; if (d < 0.05) return null;
    const x = Math.cos(th) * DT.rx * rad, y = Math.max(Math.sin(th) * DT.ry * rad, -9);
    const yy = Math.min(y, DT.floor);
    return [DT.vx + x * DT.F / d, DT.vy + yy * DT.F / d];
  }
  function dtBack() {
    return A.layer('dt-back', 1920, 1080, (g, w, h) => {
      g.fillStyle = A.radial(g, DT.vx, DT.vy, 0, 1300, [[0, '#1a2a6e'], [0.25, '#0f1848'], [0.6, '#0a0f2e'], [1, '#05071a']]); g.fillRect(0, 0, w, h);
      // faint hex grid in the far wall texture
      g.strokeStyle = 'rgba(41,240,255,0.05)'; g.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; g.beginPath(); g.moveTo(DT.vx, DT.vy); g.lineTo(DT.vx + Math.cos(a) * 2400, DT.vy + Math.sin(a) * 1500); g.stroke(); }
    });
  }
  A.drawDataTunnel = (ctx, t, o = {}) => {
    const speed = o.speed != null ? o.speed : 1, zc = o.z != null ? o.z : t * 4 * speed, jam = clamp(o.jam || 0), hs = o.hue || 0;
    const cyan = 186 + hs, mag = 322 + hs, red = 356;
    const H1 = lerp(cyan, red + 360 * (cyan > 270 ? 1 : 0) - 360, jam * 0.85), H2 = lerp(mag, red + 360, jam * 0.7) % 360;
    ctx.save();
    ctx.drawImage(dtBack(), 0, 0);
    if (jam > 0) { ctx.fillStyle = `rgba(90,0,20,${jam * 0.35})`; ctx.fillRect(0, 0, 1920, 1080); }
    ctx.globalCompositeOperation = 'lighter';
    // light at the end of the tunnel
    A.glow(ctx, DT.vx, DT.vy, 420, hsl(H1, 90, 60, 0.30 - jam * 0.1));
    A.glow(ctx, DT.vx, DT.vy, 120, hsl(H1, 100, 85, 0.55 - jam * 0.2));
    // rings rushing toward camera
    const SP = 1.6, first = Math.floor(zc / SP) + 1;
    for (let i = first + 34; i >= first; i--) {
      const z = i * SP, d = z - zc; if (d < 0.25) continue;
      const sc = DT.F / d, fog = clamp(1 - d / 56), near = clamp(1 - (d - 0.3) / 3);
      const alt = i % 3 === 0;
      const hue = alt ? H2 : H1, a = fog * fog * (alt ? 0.9 : 0.55) * (1 - near * 0.4);
      const rx = DT.rx * sc, ry = DT.ry * sc, fy = DT.vy + DT.floor * sc;
      // wall panels between this ring and the next (dim light tiles)
      if (d < 26 && d > 0.6) {
        const d2 = d + SP * 0.92;
        for (let k = 0; k < 28; k++) {
          const hv = H(i * 17.3 + k * 3.1); if (hv > 0.3) continue;
          const u0 = k / 28 + 0.004, u1 = (k + 1) / 28 - 0.004, th0 = WALL0 - u0 * WALLS, th1 = WALL0 - u1 * WALLS;
          const P = (th, dd) => { const y = Math.min(Math.sin(th) * DT.ry, DT.floor); return [DT.vx + Math.cos(th) * DT.rx * DT.F / dd, DT.vy + y * DT.F / dd]; };
          quad(ctx, P(th0, d), P(th1, d), P(th1, d2), P(th0, d2));
          const pa = hv < 0.06 ? 0.22 : 0.07;
          ctx.fillStyle = hsl(hv < 0.15 ? H2 : H1, 90, 55, pa * fog * (0.7 + 0.3 * Math.sin(t * 2 + i + k))); ctx.fill();
        }
      }
      // floor tiles
      if (d < 24 && d > 0.5) {
        const d2 = d + SP * 0.9;
        for (let c = -4; c < 4; c++) {
          const hv = H(i * 7.7 + c * 13.1); if (hv > 0.2) continue;
          const u0 = c * 0.4 + 0.02, u1 = u0 + 0.36, F = DT.F, fl = DT.floor;
          quad(ctx, [DT.vx + u0 * F / d, DT.vy + fl * F / d], [DT.vx + u1 * F / d, DT.vy + fl * F / d], [DT.vx + u1 * F / d2, DT.vy + fl * F / d2], [DT.vx + u0 * F / d2, DT.vy + fl * F / d2]);
          ctx.fillStyle = hsl(hv < 0.05 ? H2 : H1, 90, 55, (hv < 0.05 ? 0.2 : 0.09) * fog); ctx.fill();
        }
      }
      // ring arc (above floor) — clipped at the floor line
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1920, fy); ctx.clip();
      if (alt) {
        // structural rib: solid dark band with an outline and a glowing inner light strip
        ctx.globalCompositeOperation = 'source-over';
        const bw = Math.max(2, sc * 0.16);
        ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = bw + Math.max(1, sc * 0.02); A.ellipse(ctx, DT.vx, DT.vy, rx + bw / 2, ry + bw / 2); ctx.stroke();
        ctx.strokeStyle = hsl(236, 42, lerp(9, 27, fog), 1); ctx.lineWidth = bw; ctx.stroke();
        ctx.strokeStyle = hsl(236, 50, lerp(14, 40, fog), 1); ctx.lineWidth = bw * 0.22; A.ellipse(ctx, DT.vx, DT.vy, rx + bw * 0.25, ry + bw * 0.25); ctx.stroke();
        ctx.strokeStyle = hsl(hue, 90, 60, 0.35 * fog); ctx.lineWidth = Math.max(1, bw * 0.12); A.ellipse(ctx, DT.vx, DT.vy, rx + bw * 0.8, ry + bw * 0.8); ctx.stroke();
        // bolts / status lights on the rib
        for (let k = 0; k < 14; k++) { const th = WALL0 - (k + 0.5) / 14 * WALLS; const bx = DT.vx + Math.cos(th) * (rx + bw / 2), by = DT.vy + Math.sin(th) * (ry + bw / 2); if (by > fy) continue; ctx.fillStyle = hsl(H(i + k) < 0.3 ? H2 : H1, 100, 75, fog); ctx.fillRect(bx - bw * 0.06, by - bw * 0.06, bw * 0.12, bw * 0.12); }
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.strokeStyle = hsl(hue, 100, 62, a * 0.35); ctx.lineWidth = Math.max(1, sc * 0.09);
      A.ellipse(ctx, DT.vx, DT.vy, rx, ry); ctx.stroke();
      ctx.strokeStyle = hsl(hue, 100, 80, a); ctx.lineWidth = Math.max(0.6, sc * 0.018);
      A.ellipse(ctx, DT.vx, DT.vy, rx, ry); ctx.stroke();
      // ring segment ticks (data blocks)
      if (d < 22) {
        for (let k = 0; k < 24; k++) {
          const a0 = Math.PI + k / 24 * Math.PI * 1.0 - 0.02; if (H(i * 31 + k) < 0.55) continue;
          ctx.strokeStyle = hsl(H(i + k) < 0.5 ? H1 : H2, 100, 70, a * 0.9); ctx.lineWidth = Math.max(1, sc * 0.03);
          ctx.beginPath(); ctx.ellipse(DT.vx, DT.vy, rx * 0.985, ry * 0.985, 0, a0, a0 + 0.07); ctx.stroke();
        }
      }
      ctx.restore();
      // floor cross-strip
      const xw = Math.sqrt(Math.max(0, 1 - Math.pow(DT.floor / DT.ry, 2))) * rx;
      ctx.fillStyle = hsl(hue, 100, 65, a * 0.5); ctx.fillRect(DT.vx - xw, fy - Math.max(0.5, sc * 0.006), xw * 2, Math.max(1, sc * 0.012));
      // brake-light pairs on the floor edges during the jam
      if (jam > 0.05 && d < 30 && i % 2 === 0) {
        const bl = jam * fog * (0.6 + 0.4 * Math.sin(t * 4 + i));
        A.glow(ctx, DT.vx - xw * 0.92, fy - sc * 0.02, sc * 0.08 + 4, `rgba(255,40,50,${bl})`);
        A.glow(ctx, DT.vx + xw * 0.92, fy - sc * 0.02, sc * 0.08 + 4, `rgba(255,40,50,${bl})`);
      }
    }
    // longitudinal rails along the wall
    for (let k = 0; k <= 12; k++) {
      const th = WALL0 - (k / 12) * WALLS, y = Math.min(Math.sin(th) * DT.ry, DT.floor), x = Math.cos(th) * DT.rx;
      const dn = 0.35, a = [DT.vx + x * DT.F / dn, DT.vy + y * DT.F / dn];
      ctx.strokeStyle = hsl(k % 3 ? H1 : H2, 100, 65, 0.10); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(DT.vx + x * DT.F / 60, DT.vy + y * DT.F / 60); ctx.lineTo(a[0], a[1]); ctx.stroke();
    }
    // wet-floor reflection of the light at the end of the tunnel
    ctx.save(); ctx.translate(DT.vx, DT.vy + 240); ctx.scale(0.22, 1);
    A.glow(ctx, 0, 0, 300, hsl(H1, 100, 65, 0.22)); ctx.restore();
    // floor: lane lines converging to the vanishing point
    const fyN = 1080, dN = DT.floor * DT.F / (fyN - DT.vy);
    for (const lx of [-1.3, -0.45, 0.45, 1.3]) {
      const edge = Math.abs(lx) > 1;
      ctx.strokeStyle = hsl(edge ? H2 : H1, 100, 70, edge ? 0.45 : 0.18); ctx.lineWidth = edge ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(DT.vx, DT.vy); ctx.lineTo(DT.vx + lx * DT.F / dN, fyN); ctx.stroke();
      if (!edge) { // dashed lane markings moving toward camera
        for (let k = 0; k < 18; k++) {
          const z = (Math.floor(zc / 2) + k) * 2 + 1, d0 = z - zc, d1 = d0 + 0.8; if (d0 < 0.3) continue;
          const f = clamp(1 - d0 / 36);
          ctx.strokeStyle = hsl(H1, 100, 75, 0.55 * f); ctx.lineWidth = Math.max(1, DT.F / d0 * 0.02);
          ctx.beginPath(); ctx.moveTo(DT.vx + lx * DT.F / d0, DT.vy + DT.floor * DT.F / d0); ctx.lineTo(DT.vx + lx * DT.F / d1, DT.vy + DT.floor * DT.F / d1); ctx.stroke();
        }
      }
    }
    // circuit traces on the walls with travelling pulses
    for (const tr of TRACES) {
      const zz = tr.z0 + Math.floor((zc - tr.z0) / 34 + 1) * 34; // recycle
      for (const zs of [zz, zz + 34]) {
        const pa = dtProj(tr.th, 0.97, zs, zc), pb = dtProj(tr.th, 0.97, zs + tr.len, zc), pc = dtProj(tr.th + tr.jog, 0.97, zs + tr.len, zc), pd = dtProj(tr.th + tr.jog, 0.97, zs + tr.len * 1.6, zc);
        if (!pa || !pb || !pc || !pd) continue;
        const f = clamp(1 - (zs - zc) / 40);
        ctx.strokeStyle = hsl(tr.hue ? H2 : H1, 100, 65, 0.32 * f); ctx.lineWidth = Math.max(1, 3 * f * f);
        ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.lineTo(pc[0], pc[1]); ctx.lineTo(pd[0], pd[1]); ctx.stroke();
        ctx.fillStyle = hsl(tr.hue ? H2 : H1, 100, 80, 0.8 * f); ctx.beginPath(); ctx.arc(pd[0], pd[1], Math.max(1.5, 5 * f), 0, TAU); ctx.fill();
        // pulse
        const u = (t * tr.sp * (0.3 + speed)) % 1, pp = [lerp(pd[0], pa[0], u), lerp(pd[1], pa[1], u)];
        A.glow(ctx, pp[0], pp[1], 10 + 16 * f, hsl(tr.hue ? H2 : H1, 100, 75, 0.8 * f));
      }
    }
    // speed streaks
    const nS = Math.round(40 + speed * 70);
    for (let i = 0; i < nS; i++) {
      const th = H(i * 3.3) * TAU, rad = 0.35 + H(i * 1.7) * 0.6, per = 12;
      const z = ((H(i * 9.1) * per - zc * (0.9 + H(i) * 0.4)) % per + per) % per + 0.4;
      const len = 0.25 + speed * 1.6;
      const x = Math.cos(th) * DT.rx * rad, y = Math.sin(th) * DT.ry * rad;
      if (y > DT.floor * 0.95) continue;
      const a = [DT.vx + x * DT.F / (z + len), DT.vy + y * DT.F / (z + len)], b = [DT.vx + x * DT.F / z, DT.vy + y * DT.F / z];
      // keep the character band calm: dim streaks crossing the middle
      const mid = Math.abs(b[1] - 700) < 200 && Math.abs(b[0] - 960) < 700 ? 0.35 : 1;
      const f = clamp(1 - z / per) * mid;
      ctx.strokeStyle = hsl(H(i) < 0.6 ? H1 : H2, 100, 78, 0.55 * f); ctx.lineWidth = 1 + 2.5 * f;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // floating binary motes
    ctx.font = '600 18px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 26; i++) {
      const z = ((H(i * 4.1) * 20 - zc * 0.5) % 20 + 20) % 20 + 1.5, th = H(i * 2.2) * TAU, rad = 0.55 + H(i * 5.5) * 0.35;
      const x = Math.cos(th) * DT.rx * rad, y = Math.min(Math.sin(th) * DT.ry * rad, DT.floor * 0.8);
      const sx = DT.vx + x * DT.F / z, sy = DT.vy + y * DT.F / z, f = clamp(1 - z / 21);
      ctx.fillStyle = hsl(H1, 100, 80, 0.5 * f); ctx.font = `600 ${Math.round(8 + 60 / z)}px Rubik`; ctx.fillText(H(i + Math.floor(t * 2)) < 0.5 ? '0' : '1', sx, sy);
    }
    ctx.globalCompositeOperation = 'source-over';
    // floor sheen + depth vignette so the middle band stays readable
    ctx.fillStyle = A.linear(ctx, 0, DT.vy, 0, 1080, [[0, 'rgba(10,15,46,0)'], [0.45, hsl(H1, 80, 20, 0.25)], [1, 'rgba(5,7,26,0.55)']]); ctx.fillRect(0, DT.vy + 5, 1920, 1080 - DT.vy);
    ctx.fillStyle = A.radial(ctx, 960, 700, 200, 1100, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(5,4,20,0.45)']]); ctx.fillRect(0, 0, 1920, 1080);
    if (jam > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.6 + 0.4 * Math.sin(t * 3.2);
      ctx.fillStyle = A.linear(ctx, 0, 700, 0, 1080, [[0, 'rgba(255,30,50,0)'], [1, `rgba(255,30,60,${0.22 * jam * pulse})`]]); ctx.fillRect(0, 700, 1920, 380);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // ===========================================================================
  //                              OCEAN FLOOR
  // ===========================================================================
  const OC = { cableY: 760, strip: 2400 };
  A.oceanCablePath = (x, o = {}) => {
    const cy = o.cableY != null ? o.cableY : OC.cableY, s = (o.scroll || 0) + x;
    return cy + 22 * Math.sin(s * 0.0021 + 0.7) + 10 * Math.sin(s * 0.0057 + 1.3);
  };
  // tileable strip helper: draws shapes at x and x±strip so the strip wraps seamlessly
  function wrapStrip(key, hgt, draw) { return A.layer(key, OC.strip, hgt, (g, w, h) => { for (const dx of [-w, 0, w]) { g.save(); g.translate(dx, 0); draw(g, w, h); g.restore(); } }); }
  function drawStrip(ctx, c, scroll, y, alpha = 1) {
    const W = OC.strip, off = ((scroll % W) + W) % W;
    ctx.globalAlpha = alpha;
    for (let x = -off; x < 1920; x += W) ctx.drawImage(c, x, y);
    ctx.globalAlpha = 1;
  }
  const ocFar = () => wrapStrip('oc-far', 600, (g, w, h) => {
    // distant ridges (hazy silhouettes)
    const r = mul(900);
    for (let layer = 0; layer < 2; layer++) {
      g.fillStyle = layer ? '#083447' : '#0a3c50';
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 20) g.lineTo(x, 330 + layer * 90 - 120 * (0.5 + 0.5 * Math.sin(x / w * TAU * 2 + layer)) * (0.6 + 0.4 * Math.sin(x / w * TAU * 5 + 1)) - 30 * A.noise1(x / 60 + layer * 9));
      g.lineTo(w, h); g.closePath(); g.fill();
    }
    // spires / arches
    for (let i = 0; i < 7; i++) { const x = r() * w, hh = 120 + r() * 160; g.fillStyle = '#0b3a4e'; A.path(g, [[x - 30, h], [x - 8, h - hh], [x + 6, h - hh - 10], [x + 30, h]]); g.fill(); }
  });
  const ocMid = () => wrapStrip('oc-mid', 520, (g, w, h) => {
    const r = mul(901);
    // sea-floor mound
    g.fillStyle = A.linear(g, 0, 150, 0, h, [[0, '#0c4658'], [1, '#062a3a']]);
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, 250 - 60 * Math.sin(x / w * TAU * 3 + 0.5) - 25 * A.noise1(x / 90 + 3));
    g.lineTo(w, h); g.closePath(); g.fill();
    // rocks with cel shading + outline
    for (let i = 0; i < 9; i++) {
      const x = r() * w, y = 270 + r() * 90, s = 50 + r() * 90, pts = [];
      for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.4), y + Math.sin(a) * s * (0.5 + r() * 0.3)]); }
      A.blob(g, pts); g.fillStyle = '#0d4a5e'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(2,20,33,0.8)'; g.stroke();
      g.save(); A.blob(g, pts); g.clip(); g.fillStyle = 'rgba(80,200,210,0.18)'; A.ellipse(g, x + s * 0.3, y - s * 0.45, s * 0.7, s * 0.3); g.fill(); g.fillStyle = 'rgba(2,15,30,0.35)'; A.ellipse(g, x - s * 0.5, y + s * 0.1, s * 0.7, s * 0.5); g.fill(); g.restore();
      // coral fans
      if (r() < 0.6) { g.strokeStyle = pick(r, ['#b0507a', '#8a5fc0', '#c77a5a']); g.lineWidth = 2.5; const cx = x + (r() - 0.5) * s, cy = y - s * 0.4; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.25; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 25, cx + Math.cos(a) * 34, cy + Math.sin(a) * 42); g.stroke(); } }
    }
  });
  const ocSand = () => wrapStrip('oc-sand', 420, (g, w, h) => {
    const r = mul(902);
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#0f5566'], [0.25, '#0a3f52'], [1, '#03182a']]);
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 12) g.lineTo(x, 40 - 18 * Math.sin(x / w * TAU * 4) - 8 * A.noise1(x / 40));
    g.lineTo(w, h); g.closePath(); g.fill();
    // ripples
    g.strokeStyle = 'rgba(120,220,220,0.10)'; g.lineWidth = 2;
    for (let i = 0; i < 260; i++) { const x = r() * w, y = 60 + Math.pow(r(), 0.7) * (h - 60), L = 20 + r() * 50 * (y / h + 0.3); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y - 4, x + L, y); g.stroke(); }
    // pebbles & shells
    for (let i = 0; i < 90; i++) { const x = r() * w, y = 70 + r() * (h - 80), s = 3 + r() * 8 * (y / h + 0.4); g.fillStyle = pick(r, ['#0d3446', '#145566', '#0b2a3a']); A.ellipse(g, x, y, s, s * 0.6); g.fill(); g.fillStyle = 'rgba(160,240,240,0.15)'; A.ellipse(g, x - s * 0.2, y - s * 0.25, s * 0.5, s * 0.25); g.fill(); }
  });
  const ocShafts = () => A.layer('oc-shafts', 960, 540, (g, w, h) => {
    const r = mul(903);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = r() * w * 1.2 - w * 0.1, wd = 20 + r() * 70, sk = 120 + r() * 120;
      g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, `rgba(120,230,230,${0.10 + r() * 0.10})`], [1, 'rgba(120,230,230,0)']]);
      A.path(g, [[x, 0], [x + wd, 0], [x + wd + sk + wd, h], [x + sk - wd * 0.5, h]]); g.fill();
    }
    g.filter = 'blur(6px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none';
  });
  function kelp(ctx, x, yb, hgt, t, seed, col, rim, s = 1) {
    const segs = 12, pts = [];
    for (let i = 0; i <= segs; i++) { const u = i / segs; pts.push([x + Math.sin(t * 0.9 + seed + u * 2.5) * 30 * u * s + Math.sin(seed * 3 + u * 4) * 12 * s, yb - u * hgt]); }
    ctx.lineCap = 'round';
    ctx.strokeStyle = col; ctx.lineWidth = 9 * s; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // leaves
    for (let i = 1; i < segs; i++) {
      const [px, py] = pts[i], sd = i % 2 ? 1 : -1, L = (38 - i * 1.6) * s, sw = Math.sin(t * 1.3 + seed + i) * 0.3;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + sd * L * 0.6, py - L * 0.6 + sw * 10, px + sd * L, py - L * 0.2 + sw * 20);
      ctx.quadraticCurveTo(px + sd * L * 0.4, py + 4 * s, px, py + 6 * s); ctx.fill();
      if (rim && sd > 0) { ctx.strokeStyle = rim; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + sd * L * 0.6, py - L * 0.6 + sw * 10, px + sd * L, py - L * 0.2 + sw * 20); ctx.stroke(); }
    }
    // gas bladders
    for (let i = 3; i < segs; i += 3) { ctx.fillStyle = col; A.ellipse(ctx, pts[i][0] + 4 * s, pts[i][1], 5 * s, 5 * s); ctx.fill(); }
  }
  function fishSchool(ctx, cx, cy, t, n, seed, s, col) {
    for (let i = 0; i < n; i++) {
      const a = H(seed + i) * TAU, rr = 40 + H(seed + i * 3) * 90;
      const x = cx + Math.cos(a + t * 0.35) * rr * 1.6, y = cy + Math.sin(a + t * 0.35) * rr * 0.5 + Math.sin(t * 2 + i) * 4;
      const dir = -Math.sin(a + t * 0.35) >= 0 ? 1 : -1, wig = Math.sin(t * 12 + i) * 0.25;
      ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(0, -5, -8, 0); ctx.quadraticCurveTo(0, 5, 10, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-14, -4 + wig * 8); ctx.lineTo(-14, 4 + wig * 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  A.drawOceanFloor = (ctx, t, o = {}) => {
    const sc = o.scroll || 0, tint = o.depthTint || 0;
    const cw = o.cableW || 56;
    ctx.save();
    // water column
    ctx.fillStyle = A.linear(ctx, 0, 0, 0, 1080, [[0, '#0e5a6c'], [0.25, '#0b4a5c'], [0.6, '#063247'], [1, '#021421']]); ctx.fillRect(0, 0, 1920, 1080);
    // surface shimmer at the top
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const x = ((H(i) * 2400 - sc * 0.1 + t * 20 * (H(i + 1) - 0.5)) % 2400 + 2400) % 2400 - 240; ctx.fillStyle = `rgba(160,255,250,${0.05 + 0.05 * Math.sin(t * 2 + i)})`; A.ellipse(ctx, x, 20 + H(i + 2) * 30, 90 + H(i) * 120, 10); ctx.fill(); }
    // god rays (swaying)
    const sh = ocShafts();
    for (let k = 0; k < 2; k++) {
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 0.7 + k * 2);
      const ox = ((-sc * 0.15 + k * 900 + Math.sin(t * 0.3 + k) * 40) % 1920 + 1920) % 1920;
      ctx.drawImage(sh, ox - 1920, 0, 1920, 1080); ctx.drawImage(sh, ox, 0, 1920, 1080);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // far ridges + fish schools
    drawStrip(ctx, ocFar(), sc * 0.2, 260, 0.8);
    ctx.fillStyle = A.linear(ctx, 0, 250, 0, 700, [[0, 'rgba(11,74,92,0)'], [0.5, 'rgba(11,74,92,0.35)'], [1, 'rgba(11,74,92,0.45)']]); ctx.fillRect(0, 250, 1920, 450);
    fishSchool(ctx, ((1400 - sc * 0.25 - t * 30) % 2600 + 2600) % 2600 - 300, 330, t, 34, 7, 0.9, 'rgba(6,40,58,0.8)');
    fishSchool(ctx, ((400 - sc * 0.3 - t * 22) % 2600 + 2600) % 2600 - 300, 470, t, 26, 19, 0.7, 'rgba(8,48,66,0.7)');
    // mid floor + rocks
    drawStrip(ctx, ocMid(), sc * 0.5, 430);
    // mid kelp forest
    for (let i = 0; i < 9; i++) { const x = ((H(i * 5) * 2600 - sc * 0.5) % 2600 + 2600) % 2600 - 300; kelp(ctx, x, 720 + H(i) * 30, 260 + H(i + 9) * 220, t, i * 1.3, '#0b4658', 'rgba(90,220,210,0.25)', 0.8); }
    // haze between mid and near
    ctx.fillStyle = A.linear(ctx, 0, 500, 0, 820, [[0, 'rgba(8,60,78,0)'], [1, 'rgba(8,60,78,0.4)']]); ctx.fillRect(0, 500, 1920, 320);
    // sand bed (near) — sits under the cable
    const cy0 = A.oceanCablePath(960, o);
    drawStrip(ctx, ocSand(), sc, (o.cableY != null ? o.cableY : OC.cableY) + 4);
    // --- the cable ---
    const P = []; for (let x = -40; x <= 1960; x += 20) P.push([x, A.oceanCablePath(x, o)]);
    const line = (off) => { ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y + off) : ctx.moveTo(x, y + off)); };
    // contact shadow
    ctx.fillStyle = 'rgba(1,10,20,0.45)'; line(cw * 0.45); ctx.lineWidth = cw * 0.5; ctx.strokeStyle = 'rgba(1,10,20,0.4)'; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    line(0); ctx.strokeStyle = 'rgba(41,240,255,0.10)'; ctx.lineWidth = cw * 3.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(41,240,255,0.14)'; ctx.lineWidth = cw * 1.8; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // glass tube body
    line(0); ctx.lineCap = 'butt';
    ctx.strokeStyle = OUT; ctx.lineWidth = cw + 6; ctx.stroke();
    ctx.strokeStyle = 'rgba(20,90,110,0.92)'; ctx.lineWidth = cw; ctx.stroke();
    line(-cw * 0.12); ctx.strokeStyle = 'rgba(60,170,190,0.45)'; ctx.lineWidth = cw * 0.55; ctx.stroke();
    // inner fibres
    ctx.globalCompositeOperation = 'lighter';
    [[-0.18, '#29f0ff', 0.55], [0, '#9ffcff', 0.75], [0.16, '#ff3fa4', 0.4], [0.3, '#29f0ff', 0.35]].forEach(([dy, c, a]) => { line(dy * cw); ctx.strokeStyle = hexA(c, a); ctx.lineWidth = Math.max(1.5, cw * 0.05); ctx.stroke(); });
    // ambient data pulses racing inside (left -> right)
    for (let i = 0; i < 7; i++) {
      const x = ((H(i) * 1920 + t * (500 + H(i + 3) * 400)) % 2200) - 140, y = A.oceanCablePath(x, o);
      ctx.fillStyle = A.linear(ctx, x - 90, 0, x, 0, [[0, 'rgba(41,240,255,0)'], [1, 'rgba(160,255,255,0.7)']]); ctx.fillRect(x - 90, y - 3, 90, 6);
      A.glow(ctx, x, y, 18, 'rgba(180,255,255,0.8)');
    }
    ctx.globalCompositeOperation = 'source-over';
    // specular highlight + lower rim
    line(-cw * 0.32); ctx.strokeStyle = 'rgba(220,255,255,0.75)'; ctx.lineWidth = Math.max(2, cw * 0.07); ctx.stroke();
    line(cw * 0.36); ctx.strokeStyle = 'rgba(41,240,255,0.5)'; ctx.lineWidth = Math.max(1.5, cw * 0.04); ctx.stroke();
    // armour clamps / repeaters every 520 world px
    for (let k = Math.floor(sc / 520) - 1; k < (sc + 2100) / 520; k++) {
      const x = k * 520 - sc + 130, y = A.oceanCablePath(x, o); if (x < -80 || x > 2000) continue;
      const big = k % 4 === 0, w2 = big ? 70 : 18;
      ctx.fillStyle = big ? '#1b5c6e' : '#23677a'; A.rrect(ctx, x - w2 / 2, y - cw * 0.62, w2, cw * 1.24, 8); A.fillStroke(ctx, null, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(160,255,255,0.35)'; ctx.fillRect(x - w2 / 2 + 3, y - cw * 0.55, w2 - 6, 4);
      if (big) { const bl = 0.5 + 0.5 * Math.sin(t * 4 + k); A.glow(ctx, x, y - cw * 0.35, 24, `rgba(255,63,164,${0.5 * bl})`); ctx.fillStyle = `rgba(255,120,200,${0.6 + 0.4 * bl})`; A.ellipse(ctx, x, y - cw * 0.35, 4, 4); ctx.fill(); }
    }
    // sand drifts partly burying the cable in places
    for (let k = Math.floor(sc / 380) - 1; k < (sc + 2100) / 380; k++) {
      if (H(k * 7.7) < 0.6) continue;
      const x = k * 380 - sc + 60 + H(k) * 200, y = A.oceanCablePath(x, o) + cw * 0.3, L = 60 + H(k + 1) * 80;
      ctx.fillStyle = '#0c4a5c'; ctx.beginPath(); ctx.moveTo(x - L, y + cw * 0.3); ctx.quadraticCurveTo(x, y - cw * 0.05, x + L, y + cw * 0.3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,220,220,0.2)'; ctx.lineWidth = 2; ctx.stroke();
    }
    // bioluminescent plankton + marine snow
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const par = 0.4 + H(i * 1.9) * 0.9, x = ((H(i) * 2400 - sc * par + Math.sin(t * 0.5 + i) * 20) % 2400 + 2400) % 2400 - 240;
      const y = 120 + H(i * 3.3) * 820 + Math.sin(t * 0.8 + i * 2) * 14, pul = 0.5 + 0.5 * Math.sin(t * (1.5 + H(i) * 2) + i);
      const c = H(i * 5) < 0.6 ? '41,240,255' : '170,120,255';
      A.glow(ctx, x, y, 6 + 10 * par * pul, `rgba(${c},${0.35 + 0.4 * pul})`);
    }
    for (let i = 0; i < 140; i++) {
      const par = 0.3 + H(i * 2.7) * 1.1, x = ((H(i * 1.1) * 2200 - sc * par + Math.sin(t * 0.6 + i) * 10) % 2200 + 2200) % 2200 - 140;
      const y = ((H(i * 4.4) * 1150 + t * (8 + 14 * par)) % 1150) - 40, s = 1 + par * 1.6;
      ctx.fillStyle = `rgba(200,240,255,${0.18 + 0.2 * par})`; ctx.fillRect(x, y, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
    // foreground kelp & rocks (fast parallax), kept to the frame edges
    for (let i = 0; i < 5; i++) {
      const x = ((H(i * 13) * 3200 - sc * 1.35) % 3200 + 3200) % 3200 - 400;
      kelp(ctx, x, 1120, 420 + H(i + 4) * 250, t, i * 2.1 + 5, '#021d2b', 'rgba(41,240,255,0.35)', 1.3);
      ctx.fillStyle = '#031824'; A.blob(ctx, [[x - 160, 1100], [x - 120, 1010], [x - 20, 975], [x + 90, 1000], [x + 170, 1100]]); A.fillStroke(ctx, '#031824', 5);
      ctx.strokeStyle = 'rgba(41,240,255,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 20, 980); ctx.quadraticCurveTo(x + 60, 985, x + 88, 1004); ctx.stroke();
    }
    // depth tint & vignette
    if (tint) { ctx.fillStyle = `rgba(2,20,33,${tint})`; ctx.fillRect(0, 0, 1920, 1080); }
    ctx.fillStyle = A.radial(ctx, 960, 620, 300, 1200, [[0, 'rgba(2,20,33,0)'], [1, 'rgba(2,12,24,0.55)']]); ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  };

  // ===========================================================================
  //                              ROUTE MAP INSET
  // ===========================================================================
  const LAND = {
    europe: [[5, 62], [8, 57.5], [8.6, 55], [8.5, 53.6], [7, 53.5], [4.5, 52.5], [3.5, 51.4], [1.6, 50.9], [1.5, 50.1], [0, 49.5], [-1.3, 49.7], [-1.6, 48.7], [-4.7, 48.4], [-4.2, 47.8], [-2.2, 47.2], [-1.2, 46.2], [-1.2, 44.5], [-1.8, 43.4], [-4, 43.5], [-7.7, 43.8], [-9.3, 43], [-8.9, 41.6], [-8.8, 40], [-9.5, 38.8], [-8.8, 38.4], [-8.9, 37], [-7.4, 37.2], [-6.3, 36.8], [-5.6, 36], [-4.5, 36.7], [-2.1, 36.7], [-0.7, 37.6], [0.2, 38.8], [-0.3, 39.5], [0.9, 41], [3.2, 41.9], [3.1, 43.1], [4.6, 43.4], [6, 43.1], [7.5, 43.8], [8.8, 44.4], [10.2, 43.9], [10.5, 42.9], [12.3, 41.7], [14, 40.8], [15.7, 40], [16, 38.8], [15.7, 38], [16.1, 37.9], [17.1, 39], [17, 39.5], [18.5, 40.1], [18, 40.6], [16, 41.4], [13.6, 43.5], [12.3, 44.8], [12.4, 45.4], [13.7, 45.6], [14.5, 45.3], [15, 44.3], [17.5, 42.8], [19.4, 41.8], [19.4, 40.4], [20.3, 39.4], [21.1, 38.3], [21.7, 36.8], [22.8, 36.5], [23.2, 37.9], [22.8, 38.3], [24, 38.3], [22.9, 40.6], [23.7, 40.2], [24.4, 40.9], [26, 40.8], [26.2, 39.5], [26.8, 38.5], [27.3, 37.1], [28.3, 36.7], [29.6, 36.2], [30.6, 36.8], [32, 36.5], [34.6, 36.8], [36.2, 36.6], [35.8, 35.8], [35.9, 34.9], [35.5, 34], [35.1, 33.1], [34.9, 32.4], [34.5, 31.6], [33.5, 31.1], [32.3, 31.2], [31, 31.6], [29.8, 31], [28.5, 31], [25.2, 31.6], [23.2, 32.2], [22, 32.9], [20.1, 32.1], [19.9, 31], [18.5, 30.4], [15.6, 31.6], [15, 32.3], [13, 32.9], [11.5, 33.1], [10.2, 33.8], [11.1, 35.2], [10.4, 36.6], [11, 37.1], [9.8, 37.3], [8.6, 36.9], [5.5, 36.8], [3, 36.8], [0.6, 35.9], [-1.9, 35.1], [-2.9, 35.3], [-5.3, 35.9], [-6, 35.8], [-6.8, 34], [-8.5, 33.3], [-9.6, 31], [-9.8, 29.9], [-12, 28], [-13.2, 27], [-15, 24.5], [-17, 21], [-17, 10], [50, 10], [50, 62]],
    gb: [[-5, 58.6], [-3, 58.6], [-1.8, 57.5], [-2, 55.8], [-1.3, 54.6], [0.1, 53.5], [1.7, 52.7], [1.4, 51.2], [-1, 50.7], [-3.5, 50.3], [-5.7, 50], [-4.2, 51.5], [-5.1, 51.8], [-4.2, 53.2], [-3, 53.4], [-3.3, 54.6], [-5, 54.8], [-5.6, 56.3], [-6.2, 57.5]],
    ie: [[-6, 55.2], [-6, 53.9], [-6.1, 52.2], [-7, 52.1], [-9.5, 51.6], [-10, 52.2], [-9.2, 53.2], [-10, 54.2], [-8.3, 55.2]],
    sicily: [[12.4, 38.1], [13.3, 38.2], [15.6, 38.3], [15.1, 37.3], [15.1, 36.7], [14.3, 37], [12.6, 37.6]],
    sardinia: [[8.4, 41.1], [9.7, 41], [9.6, 39.2], [9, 39], [8.4, 39.1], [8.2, 40.3]],
    corsica: [[9.4, 43], [9.6, 42.1], [9.2, 41.4], [8.6, 41.9], [8.6, 42.6]],
    crete: [[23.5, 35.6], [26.3, 35.3], [26, 35], [24.1, 35], [23.5, 35.3]],
    cyprus: [[32.3, 35.1], [34, 35.6], [34.6, 35.7], [33.9, 35.2], [34, 34.6], [32.4, 34.7]],
    mallorca: [[2.4, 39.6], [3.4, 39.8], [3.2, 39.3], [2.6, 39.5]],
    namerica: [[-120, 70], [-120, 20], [-97.5, 25.5], [-97.2, 27.8], [-94, 29.6], [-90, 29.2], [-89.2, 30.3], [-85.5, 30], [-84, 30], [-82.7, 28], [-81.2, 25.4], [-80.4, 25.2], [-80.1, 26.8], [-80.6, 28.5], [-81.4, 30.7], [-81.2, 31.8], [-79.2, 33.2], [-77.9, 34], [-76.5, 34.7], [-75.5, 35.3], [-75.9, 36.9], [-76.1, 38], [-75.2, 38.7], [-74.9, 39.4], [-74, 40.5], [-72, 41], [-70.7, 41.5], [-70, 41.7], [-70.6, 42.7], [-70.2, 43.7], [-68, 44.4], [-66.9, 44.8], [-64.8, 45.3], [-66, 44], [-65.5, 43.5], [-63.5, 44.5], [-61, 45.2], [-60, 46], [-60.6, 47], [-61.5, 45.9], [-63.5, 46.1], [-64.8, 47.8], [-64.2, 48.8], [-66, 49.2], [-69, 48.2], [-71.2, 46.9], [-69.5, 48.4], [-66.5, 50.2], [-60, 50.2], [-57, 51.5], [-55.8, 52.5], [-56, 53.6], [-58, 54.2], [-60, 55.4], [-61.5, 56.5], [-62.5, 58.5], [-64.5, 60.3], [-70, 62], [-78, 62], [-80, 70]],
    newfoundland: [[-59.3, 47.6], [-55.5, 46.7], [-52.8, 46.7], [-52.6, 47.6], [-53.5, 49.3], [-55.5, 49.9], [-55.4, 51.6], [-57, 51.4], [-58.6, 49.3]],
  };
  const WATER = {
    black: [[28, 41.2], [29, 41.2], [31.3, 41.1], [33.5, 42], [35, 42], [36.5, 41.3], [38.3, 40.9], [41.5, 41.5], [41.6, 42.5], [40, 43.5], [38, 44.4], [37, 45.2], [35.5, 45.1], [33.5, 44.5], [32.5, 45.4], [33.6, 46], [31.7, 46.6], [30.2, 45.8], [29.6, 45.2], [28.6, 44], [28, 42.5]],
    superior: [[-92.1, 46.7], [-89.5, 47.9], [-88.3, 48.9], [-86.5, 48.7], [-84.7, 47.8], [-84.6, 46.5], [-86.5, 46.4], [-88, 46.9], [-90.5, 46.6]],
    michigan: [[-87.8, 41.7], [-86.8, 41.8], [-86.3, 43.4], [-86.2, 44.9], [-85.1, 45.7], [-85.4, 46], [-86.8, 45.8], [-87.7, 44.7], [-87.9, 42.8]],
    huron: [[-84.7, 45.8], [-83.4, 45.2], [-82.5, 43.1], [-81.7, 43.4], [-81.7, 44.6], [-80.1, 44.5], [-80.7, 45.3], [-81.5, 46.1], [-84.1, 46.3]],
    erie: [[-83.4, 41.7], [-81.7, 41.5], [-80.2, 42], [-78.9, 42.8], [-79.8, 42.8], [-81.3, 42.6], [-83, 42.1]],
    ontario: [[-79.8, 43.3], [-79.2, 43.5], [-77.5, 43.9], [-76.3, 44.2], [-76.2, 43.5], [-77.6, 43.3], [-79.2, 43.2]],
    caspianish: [],
  };
  const PINS = [
    { id: 'TLV', en: 'Tel Aviv', he: 'תל אביב', ll: [34.78, 32.08], p: 0 },
    { id: 'MRS', en: 'Marseille', he: 'מרסיי', ll: [5.37, 43.3], p: 0 },
    { id: 'GIB', en: 'Gibraltar', he: 'גיברלטר', ll: [-5.35, 36.14], p: 0 },
    { id: 'HFX', en: 'Halifax', he: 'הליפקס', ll: [-63.57, 44.65], p: 0 },
    { id: 'YYZ', en: 'Toronto', he: 'טורונטו', ll: [-79.38, 43.65], p: 0 },
  ];
  const ROUTE_LL = [[34.78, 32.08], [33.2, 32.9], [28, 34.1], [21, 35.3], [15.5, 36.4], [11.8, 37.7], [8.3, 39.6], [6.4, 41.9], [5.37, 43.3], [3.9, 41.6], [1.6, 39.2], [-1.2, 37.1], [-3.4, 36.2], [-5.35, 36.14], [-8, 35.9], [-14, 37.8], [-24, 40.5], [-36, 43.2], [-48, 44.4], [-56, 44.3], [-63.57, 44.65], [-67.5, 44.2], [-71.5, 44.6], [-75.2, 44.1], [-79.38, 43.65]];
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  function mapProj(w, h) {
    const L0 = -92, L1 = 40, B0 = merc(24.5), B1 = merc(57);
    const s = Math.min(w / (L1 - L0), h / (B1 - B0));
    const ox = (w - (L1 - L0) * s) / 2, oy = (h - (B1 - B0) * s) / 2;
    return ([lon, lat]) => [ox + (lon - L0) * s, oy + (B1 - merc(lat)) * s];
  }
  function smoothPts(pts, n = 8) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function mapBase(w, h) {
    w = Math.round(w); h = Math.round(h);
    return A.layer(`map-base-${w}x${h}`, w * 2, h * 2, (g) => {
      g.scale(2, 2);
      const pr = mapProj(w, h);
      g.fillStyle = A.linear(g, 0, 0, w, h, [[0, '#0a2346'], [1, '#07183a']]); g.fillRect(0, 0, w, h);
      // graticule
      g.strokeStyle = 'rgba(120,200,255,0.10)'; g.lineWidth = 1;
      for (let lon = -90; lon <= 40; lon += 10) { const a = pr([lon, 20]), b = pr([lon, 60]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      for (let lat = 25; lat <= 55; lat += 5) { const a = pr([-100, lat]), b = pr([50, lat]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      const poly = (pts) => { g.beginPath(); pts.forEach((p, i) => { const q = pr(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
      // coast glow (drawn under the land)
      g.save(); g.shadowColor = 'rgba(41,240,255,0.55)'; g.shadowBlur = 10;
      for (const k in LAND) { poly(LAND[k]); g.fillStyle = '#17385a'; g.fill(); }
      g.restore();
      for (const k in LAND) { poly(LAND[k]); g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#23466b'], [1, '#1b3a5c']]); g.fill(); g.strokeStyle = 'rgba(140,230,255,0.75)'; g.lineWidth = 1.3; g.stroke(); }
      for (const k in WATER) { if (!WATER[k].length) continue; poly(WATER[k]); g.fillStyle = '#0c2a50'; g.fill(); g.strokeStyle = 'rgba(140,230,255,0.6)'; g.lineWidth = 1; g.stroke(); }
      // St Lawrence river
      g.strokeStyle = '#0c2a50'; g.lineWidth = 2.2; g.beginPath(); [[-76.3, 44.2], [-75, 45], [-73.5, 45.5], [-71.2, 46.8], [-69.5, 48], [-67, 49.3]].forEach((p, i) => { const q = pr(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
      // land texture: halftone dots
      g.save(); for (const k in LAND) poly(LAND[k]); g.clip();
      g.fillStyle = 'rgba(160,220,255,0.10)'; for (let y = 0; y < h; y += 7) for (let x = (y / 7 % 2) * 3.5; x < w; x += 7) g.fillRect(x, y, 1.4, 1.4);
      g.restore();
      // ocean labels
      A.text(g, 'ATLANTIC OCEAN · האוקיינוס האטלנטי', pr([-38, 33])[0], pr([-38, 33])[1], { font: `italic 500 ${Math.round(h * 0.035)}px Rubik`, fill: 'rgba(140,210,255,0.45)' });
      A.text(g, 'הים התיכון', pr([18, 34.2])[0], pr([18, 34.2])[1], { font: `500 ${Math.round(h * 0.03)}px Rubik`, fill: 'rgba(140,210,255,0.45)', dir: 'rtl' });
      // compass rose
      const cx = w * 0.07, cy = h * 0.8, R = h * 0.07;
      g.strokeStyle = 'rgba(140,210,255,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(255,210,31,0.8)'; A.path(g, [[cx, cy - R * 1.3], [cx + R * 0.22, cy], [cx, cy + R * 0.3], [cx - R * 0.22, cy]]); g.fill();
      A.text(g, 'N', cx, cy - R * 1.6, { font: `700 ${Math.round(R * 0.6)}px Rubik`, fill: 'rgba(200,230,255,0.8)' });
    });
  }
  A.drawRouteMap = (ctx, x, y, w, h, t, o = {}) => {
    const p = clamp(o.p != null ? o.p : 0), km = o.km != null ? o.km : Math.round(p * 11000);
    const pr = mapProj(w, h), s = h / 300;
    ctx.save(); ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    // frame (glass panel)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24 * s; ctx.shadowOffsetY = 8 * s;
    A.rrect(ctx, -8 * s, -8 * s, w + 16 * s, h + 16 * s, 18 * s); ctx.fillStyle = 'rgba(8,16,40,0.85)'; ctx.fill(); ctx.restore();
    ctx.save(); A.rrect(ctx, 0, 0, w, h, 12 * s); ctx.clip();
    ctx.drawImage(mapBase(w, h), 0, 0, Math.round(w), Math.round(h));
    // route
    const pts = smoothPts(ROUTE_LL.map(pr), 8);
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1], at = d => { let i = 1; while (i < L.length - 1 && L[i] < d) i++; const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; };
    const stroke = (d0, d1) => { ctx.beginPath(); let started = false; for (let i = 0; i < pts.length; i++) { if (L[i] < d0 || L[i] > d1) continue; started ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); started = true; } const e = at(d1); ctx.lineTo(e[0], e[1]); };
    ctx.setLineDash([6 * s, 6 * s]); ctx.lineDashOffset = -t * 20 * s; stroke(0, tot); ctx.strokeStyle = 'rgba(41,240,255,0.45)'; ctx.lineWidth = 2 * s; ctx.stroke(); ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'lighter';
    stroke(0, p * tot); ctx.strokeStyle = 'rgba(41,240,255,0.35)'; ctx.lineWidth = 9 * s; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(190,255,255,0.95)'; ctx.lineWidth = 3 * s; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // pins
    const pinD = PINS.map(pn => { const q = pr(pn.ll); let best = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1]); if (d < bd) { bd = d; best = L[i]; } } return best / tot; });
    PINS.forEach((pn, i) => {
      const [px, py] = pr(pn.ll), reached = p >= pinD[i] - 0.002;
      const pulse = reached ? (t * 1.2 + i * 0.3) % 1 : 0;
      if (reached) { ctx.strokeStyle = `rgba(255,210,31,${1 - pulse})`; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(px, py, 4 * s + pulse * 16 * s, 0, TAU); ctx.stroke(); }
      // drop pin
      ctx.save(); ctx.translate(px, py);
      ctx.fillStyle = reached ? '#ffd21f' : '#8fb8e8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-7 * s, -9 * s, -7 * s, -18 * s, 0, -18 * s); ctx.bezierCurveTo(7 * s, -18 * s, 7 * s, -9 * s, 0, 0); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.8 * s; ctx.stroke();
      ctx.fillStyle = OUT; A.ellipse(ctx, 0, -12.5 * s, 2.4 * s, 2.4 * s); ctx.fill();
      ctx.restore();
      // labels (Hebrew above, English below) — placed to avoid the route
      const below = pn.id === 'GIB' || pn.id === 'TLV', dx = pn.id === 'TLV' ? -4 * s : pn.id === 'YYZ' ? -6 * s : 0, ly = below ? py + 14 * s : py - 34 * s;
      const col = reached ? '#ffe98a' : '#cfe4ff';
      A.text(ctx, pn.he, px + dx, ly, { font: `700 ${Math.round(13 * s)}px Rubik`, fill: col, stroke: 'rgba(5,10,30,0.85)', lw: 4 * s, dir: 'rtl' });
      A.text(ctx, pn.en.toUpperCase(), px + dx, ly + 13 * s, { font: `600 ${Math.round(9.5 * s)}px Rubik`, fill: 'rgba(200,225,255,0.85)', stroke: 'rgba(5,10,30,0.85)', lw: 3 * s });
    });
    // progress dot (gold, glowing)
    const [dx, dy] = at(p * tot);
    A.glow(ctx, dx, dy, 30 * s, 'rgba(255,201,60,0.7)');
    A.glow(ctx, dx, dy, 12 * s, 'rgba(255,245,200,0.95)');
    ctx.fillStyle = '#ffc93c'; A.ellipse(ctx, dx, dy, 5 * s, 5 * s); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6 * s; ctx.stroke();
    ctx.restore();
    // header + km counter
    ctx.fillStyle = 'rgba(8,16,40,0.8)'; A.rrect(ctx, 10 * s, 10 * s, 150 * s, 26 * s, 13 * s); ctx.fill();
    ctx.fillStyle = '#ff3fa4'; A.ellipse(ctx, 25 * s, 23 * s, 4 * s, 4 * s); ctx.fill();
    A.text(ctx, 'ROUTE · מסלול', 88 * s, 23.5 * s, { font: `700 ${Math.round(12 * s)}px Rubik`, fill: '#bff6ff' });
    const kmS = Math.round(km).toLocaleString('en-US');
    ctx.fillStyle = 'rgba(8,16,40,0.85)'; A.rrect(ctx, w - 170 * s, h - 46 * s, 160 * s, 36 * s, 10 * s); ctx.fill(); ctx.strokeStyle = 'rgba(255,210,31,0.6)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    A.text(ctx, kmS, w - 60 * s, h - 27 * s, { font: `800 ${Math.round(22 * s)}px Rubik`, fill: '#ffd21f', align: 'right' });
    A.text(ctx, 'KM · ק״מ', w - 55 * s, h - 27 * s, { font: `600 ${Math.round(10 * s)}px Rubik`, fill: '#ffe98a', align: 'left' });
    A.rrect(ctx, 0, 0, w, h, 12 * s); ctx.strokeStyle = 'rgba(120,220,255,0.55)'; ctx.lineWidth = 2 * s; ctx.stroke();
    ctx.restore();
  };

  // ===========================================================================
  //                              PACKET STREAM
  // ===========================================================================
  // o: count, speed (path fractions/s), size, spread (px across path), head (0..1 how far the stream has reached),
  //    colors [..], alpha, seed, trail (0..1)
  A.drawPacketStream = (ctx, pts, t, o = {}) => {
    if (!pts || pts.length < 2) return;
    const n = o.count || 40, sp = o.speed || 0.35, size = o.size || 14, spread = o.spread != null ? o.spread : 26, head = o.head != null ? clamp(o.head) : 1;
    const cols = o.colors || ['#29f0ff', '#ffc93c', '#ff3fa4', '#9ff5d0', '#ffffff'], seed = o.seed || 0, trail = o.trail != null ? o.trail : 1;
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1];
    const at = u => { const d = clamp(u) * tot; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i]; const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), dx / ln, dy / ln]; };
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.globalCompositeOperation = 'lighter';
    // faint carrier beam
    ctx.beginPath(); for (let d = 0; d <= head * tot; d += 12) { const [x, y] = at(d / tot); d ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = 'rgba(41,240,255,0.10)'; ctx.lineWidth = spread * 1.6; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(160,255,255,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    const base = ctx.globalAlpha;
    for (let i = 0; i < n; i++) {
      const r1 = H(seed * 13 + i * 1.37), r2 = H(seed * 7 + i * 2.71), r3 = H(seed + i * 5.13);
      const u = ((t * sp * (0.75 + r1 * 0.5) + r2) % 1);
      if (u > head) continue;
      const [x, y, tx, ty] = at(u);
      const off = (r3 - 0.5) * spread + Math.sin(t * 3 + i) * spread * 0.12, px = x - ty * off, py = y + tx * off;
      const fade = clamp(u / 0.05) * clamp((head - u) / 0.04 + 0.3) * (u > 0.93 ? (1 - u) / 0.07 : 1);
      const sz = size * (0.6 + r1 * 0.6), c = cols[i % cols.length];
      ctx.globalAlpha = base * fade;
      if (trail > 0) { const tl = sz * 4 * trail; ctx.strokeStyle = hexA(c.length === 7 ? c : '#29f0ff', 0.45); ctx.lineWidth = sz * 0.45; ctx.beginPath(); ctx.moveTo(px - tx * tl, py - ty * tl); ctx.lineTo(px, py); ctx.stroke(); }
      A.glow(ctx, px, py, sz * 1.8, hexA(c.length === 7 ? c : '#29f0ff', 0.55));
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(ty, tx));
      ctx.globalCompositeOperation = 'source-over';
      A.rrect(ctx, -sz / 2, -sz * 0.4, sz, sz * 0.8, sz * 0.22); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = Math.max(1, sz * 0.12); ctx.strokeStyle = OUT; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-sz * 0.3, -sz * 0.25, sz * 0.25, sz * 0.12);
      ctx.restore(); ctx.globalCompositeOperation = 'lighter';
    }
    ctx.restore();
  };
})();
