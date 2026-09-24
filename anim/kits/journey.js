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
      mast: { x: 1215, y: 1170, zoom: 1.6 },
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
    g.fillStyle = A.linear(g, 0, 700, 0, 1500, [[0, 'rgba(34,22,80,0.30)'], [0.6, 'rgba(70,32,100,0.34)'], [1, 'rgba(110,45,110,0.45)']]);
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
    const b = sLoop(a, 1.95, 0); const h = 250 + (Math.sin(a) > 0 ? 40 : -20);
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

  //@@REST@@
})();
