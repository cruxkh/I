// ============================================================================
// kits/home.js — "home" locations: Saba's Toronto living room, the armchair, the TV (+ football broadcast),
// the router, the snowy Toronto street, and a reusable deterministic snowfall.
// Everything is a pure function of t. Static art is cached with A.layer at 1x, and at 2x when the current
// transform zooms in (>1.15), so close-ups (up to 3x) stay crisp. Animated parts are drawn live as vectors.
// ============================================================================
(() => {
  'use strict';
  const O = A.OUTLINE, TAU = Math.PI * 2, L = A.lerp, cl = A.clamp, hh = A.hash;

  // ---------------------------------------------------------------- helpers
  const zoomOf = ctx => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
  const resFor = ctx => (zoomOf(ctx) > 1.15 ? 2 : 1);
  // hi-res cached layer: logical size w×h, rendered at r×
  const hl = (key, w, h, r, draw) => A.layer(`home:${key}@${r}`, Math.ceil(w * r), Math.ceil(h * r), g => { g.scale(r, r); draw(g, w, h); });

  // cel shading: P() builds a path. Rim toward the light (lx,ly), shade crescent away from it, then outline.
  function cel(g, P, base, shade, rim, o = {}) {
    const lx = o.lx ?? -0.55, ly = o.ly ?? -0.83, d = o.d ?? 10, r = o.r ?? 3, lw = o.lw ?? 4;
    g.save(); P(); g.clip();
    if (rim) { g.fillStyle = rim; g.fill(); g.translate(-lx * r, -ly * r); P(); g.clip(); }
    g.fillStyle = shade; g.fill();
    g.translate(lx * (d + (rim ? r : 0)), ly * (d + (rim ? r : 0))); P(); g.fillStyle = base; g.fill();
    g.restore();
    if (lw) { P(); g.lineWidth = lw; g.strokeStyle = o.stroke || O; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  }
  const poly = (g, pts) => A.path(g, pts, true);
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const line = (g, x0, y0, x1, y1, c, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = c; g.lineWidth = w; g.stroke(); };

  // soft round sprite (used for snow & sparkles)
  const dot = () => A.layer('home:dot', 64, 64, g => { g.fillStyle = A.radial(g, 32, 32, 0, 32, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.9)'], [0.7, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 64, 64); });
  const hard = () => A.layer('home:hdot', 32, 32, g => { g.fillStyle = A.radial(g, 16, 16, 0, 16, [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 32, 32); });

  // ======================================================================================================
  // SNOW
  // ======================================================================================================
  // A.drawSnow(ctx, t, o): o.rect {x,y,w,h} (default full frame), o.density (1), o.wind (px/s drift factor, 0.35),
  // o.depth: number 0..1 (single depth band) or [d0,d1] (0 far/tiny .. 1 near/big, default [0,1]),
  // o.count override, o.size (flake scale, 1), o.alpha (1), o.speed (1), o.seed (0), o.color (tint, default snow white-blue)
  A.drawSnow = (ctx, t, o = {}) => {
    const R = o.rect || { x: 0, y: 0, w: 1920, h: 1080 };
    const dep = o.depth == null ? [0, 1] : Array.isArray(o.depth) ? o.depth : [Math.max(0, o.depth - 0.15), Math.min(1, o.depth + 0.15)];
    const n = Math.round(o.count ?? (260 * (o.density ?? 1) * Math.max(0.15, (R.w * R.h) / (1920 * 1080))));
    const wind = o.wind ?? 0.35, sz = o.size ?? 1, al = o.alpha ?? 1, sp = o.speed ?? 1, seed = o.seed ?? 0;
    const spr = dot();
    ctx.save();
    if (o.color) { /* tint via globalAlpha only; flakes are near-white */ }
    for (let i = 0; i < n; i++) {
      const k = i * 1.618 + seed * 31.7;
      const d = L(dep[0], dep[1], hh(k + 0.3));
      const size = L(1.6, 13, d * d) * sz;
      const vy = L(38, 170, d) * sp;
      const H = R.h + size * 4, Wd = R.w + 80;
      let y = (hh(k + 5.1) * H + t * vy) % H;
      const sway = Math.sin(t * L(0.8, 1.7, hh(k + 2.2)) + hh(k + 9) * 6.28) * L(3, 26, d);
      let x = (hh(k + 7.7) * Wd + t * vy * wind + sway) % Wd; if (x < 0) x += Wd;
      x = R.x + x - 40; y = R.y + y - size * 2;
      const a = al * L(0.45, 0.85, d) * (d > 0.85 ? 0.75 : 1);
      ctx.globalAlpha = a;
      const s2 = size * (d > 0.8 ? 1.6 : 1.1);
      ctx.drawImage(spr, x - s2, y - s2, s2 * 2, s2 * 2);
    }
    ctx.restore();
  };

  // ======================================================================================================
  // CN TOWER (shared by the window view and the street)
  // ======================================================================================================
  // x = centre, yb = y where the drawing starts at the bottom (can be hidden by skyline), Hh = full height to antenna tip.
  function cnTower(g, x, yb, Hh, o = {}) {
    const top = yb - Hh, lit = o.lit || '#a9b0e8', sh = o.shade || '#3b3f78', lw = o.lw ?? 0;
    const Y = f => yb - Hh * f; // f: fraction of height
    g.save();
    // shaft (Y-shaped legs merge; visually a tapering column)
    g.beginPath();
    g.moveTo(x - Hh * 0.045, yb); g.lineTo(x - Hh * 0.016, Y(0.58)); g.lineTo(x + Hh * 0.016, Y(0.58)); g.lineTo(x + Hh * 0.045, yb); g.closePath();
    g.fillStyle = A.linear(g, x - Hh * 0.045, 0, x + Hh * 0.045, 0, [[0, sh], [0.35, sh], [0.55, lit], [1, sh]]); g.fill();
    // light strips on the shaft
    g.globalAlpha = 0.55; g.fillStyle = o.strip || '#c7a8ff';
    g.beginPath(); g.moveTo(x - Hh * 0.006, yb); g.lineTo(x - Hh * 0.003, Y(0.58)); g.lineTo(x + Hh * 0.003, Y(0.58)); g.lineTo(x + Hh * 0.006, yb); g.fill();
    g.globalAlpha = 1;
    // upper shaft
    g.fillStyle = A.linear(g, x - Hh * 0.012, 0, x + Hh * 0.012, 0, [[0, sh], [0.6, lit], [1, sh]]);
    g.beginPath(); g.moveTo(x - Hh * 0.014, Y(0.6)); g.lineTo(x - Hh * 0.009, Y(0.8)); g.lineTo(x + Hh * 0.009, Y(0.8)); g.lineTo(x + Hh * 0.014, Y(0.6)); g.fill();
    // main pod
    const pw = Hh * 0.075, py = Y(0.615);
    g.fillStyle = sh; A.ellipse(g, x, py + Hh * 0.012, pw * 0.9, Hh * 0.012); g.fill();
    g.fillStyle = A.linear(g, x - pw, 0, x + pw, 0, [[0, sh], [0.55, lit], [1, sh]]);
    g.beginPath(); g.moveTo(x - pw, py); g.quadraticCurveTo(x - pw * 0.9, py - Hh * 0.03, x, py - Hh * 0.036); g.quadraticCurveTo(x + pw * 0.9, py - Hh * 0.03, x + pw, py);
    g.quadraticCurveTo(x, py + Hh * 0.02, x - pw, py); g.fill();
    // pod window ring
    g.fillStyle = o.win || '#ffe6a8'; g.globalAlpha = 0.9;
    g.beginPath(); g.ellipse(x, py - Hh * 0.004, pw * 0.92, Hh * 0.0045, 0, 0, TAU); g.fill();
    g.globalAlpha = 1;
    // skypod
    g.fillStyle = A.linear(g, x - Hh * 0.018, 0, x + Hh * 0.018, 0, [[0, sh], [0.6, lit], [1, sh]]);
    A.rrect(g, x - Hh * 0.017, Y(0.815), Hh * 0.034, Hh * 0.02, Hh * 0.008); g.fill();
    g.fillStyle = o.win || '#ffe6a8'; g.fillRect(x - Hh * 0.015, Y(0.806), Hh * 0.03, Hh * 0.003);
    // antenna
    g.fillStyle = sh; g.beginPath(); g.moveTo(x - Hh * 0.006, Y(0.81)); g.lineTo(x - Hh * 0.0015, top); g.lineTo(x + Hh * 0.0015, top); g.lineTo(x + Hh * 0.006, Y(0.81)); g.fill();
    g.fillStyle = lit; g.fillRect(x - Hh * 0.0012, Y(0.98), Hh * 0.0024, Hh * 0.17);
    g.restore();
  }
  // live bits of the tower: beacon + pod glow
  function cnTowerLive(ctx, x, yb, Hh, t, a = 1) {
    const top = yb - Hh, blink = (Math.sin(t * 3.1) > 0.55) ? 1 : 0.25;
    A.glow(ctx, x, top + 2, Hh * 0.03, '#ff4a3a', 0.9 * blink * a);
    A.glow(ctx, x, yb - Hh * 0.612, Hh * 0.11, '#ffd9a0', 0.22 * a);
    A.glow(ctx, x, yb - Hh * 0.3, Hh * 0.12, '#b58cff', 0.12 * a);
  }

  // ======================================================================================================
  // LIVING ROOM
  // ======================================================================================================
  const WIN = { x: 90, y: 95, w: 390, h: 500 };
  const PANES = [[90, 95, 188, 198], [292, 95, 188, 198], [90, 307, 188, 288], [292, 307, 188, 288]];
  const VP = [960, 430];
  A.LR = {
    chair: { x: 700, y: 760 },           // Saba seat contact (drawArmchair(ctx, 700, 760, 1, layer))
    sofa: { x: 1100, y: 790 },           // Noa: seat contact on top of the leather pouf
    tv: { x: 1255, y: 350, w: 440, h: 248 }, // TV SCREEN rect (16:9); pass to drawTV — bezel/stand drawn around it
    router: { x: 1475, y: 824, s: 0.42 },  // bottom centre on the TV-cabinet lower shelf, scale for the wide shot
    window: { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h },
    lamp: { x: 600, y: 292 },            // lamp-shade centre (key light)
    floorY: 880,                         // typical standing/foot line for characters in the master
    wallBase: 735,                       // where back wall meets floor
    cabinet: { x: 1190, y: 648, w: 570, h: 200 },
    sideTable: { x: 932, y: 700 },       // table top centre: Bamba bag + teapot + tea glass
    bamba: { x: 902, y: 700 }, teapot: { x: 952, y: 700 },
    photo: { x: 880, y: 165, w: 210, h: 150 }, hamsa: { x: 1168, y: 238 }, pennant: { x: 1330, y: 160 },
    noaCrouch: { x: 1395, y: 900 },      // suggested spot for Noa crouching at the router
  };

  // floor mapping for rug: u 0..1 left→right, v 0..1 back→front
  function rugP(u, v) {
    const yb = 794, yf = 988, ib = 1 / (yb - VP[1]), ifr = 1 / (yf - VP[1]);
    const y = VP[1] + 1 / L(ib, ifr, v); const xf = L(240, 1660, u);
    return [VP[0] + (xf - VP[0]) * (y - VP[1]) / (yf - VP[1]), y];
  }
  const rugPoly = (g, uv, c) => { g.beginPath(); uv.forEach(([u, v], i) => { const p = rugP(u, v); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fillStyle = c; g.fill(); };
  const rugDiamond = (g, cu, cv, ru, rv, c) => rugPoly(g, [[cu, cv - rv], [cu + ru, cv], [cu, cv + rv], [cu - ru, cv]], c);

  function drawWall(g) {
    g.fillStyle = A.linear(g, 0, 0, 0, 740, [[0, '#3b2132'], [0.45, '#643a4b'], [1, '#77475a']]);
    g.fillRect(0, 0, 1920, 740);
    // damask wallpaper: soft stripes + motifs
    for (let x = -12; x < 1940; x += 72) { rect(g, x, 40, 30, 575, 'rgba(255,214,190,0.045)'); rect(g, x + 30, 40, 2, 575, 'rgba(35,8,25,0.08)'); }
    g.fillStyle = 'rgba(255,220,196,0.075)';
    for (let row = 0, y = 92; y < 600; y += 84, row++) for (let x = (row % 2 ? 36 : 0) + 3; x < 1940; x += 72) {
      g.save(); g.translate(x, y);
      for (let k = 0; k < 4; k++) { g.rotate(TAU / 4); A.ellipse(g, 0, -7, 3.2, 7); g.fill(); }
      A.ellipse(g, 0, -20, 1.8, 3.5); g.fill(); A.ellipse(g, 0, 20, 1.8, 3.5); g.fill();
      g.restore();
    }
    // ceiling & crown moulding
    rect(g, 0, 0, 1920, 30, '#24121d');
    g.fillStyle = A.linear(g, 0, 30, 0, 54, [[0, '#a2735f'], [0.3, '#7b4f47'], [1, '#4a2a33']]); g.fillRect(0, 30, 1920, 24);
    rect(g, 0, 30, 1920, 2, 'rgba(255,210,170,0.35)');
    g.fillStyle = A.linear(g, 0, 54, 0, 110, [[0, 'rgba(20,5,15,0.45)'], [1, 'rgba(20,5,15,0)']]); g.fillRect(0, 54, 1920, 56);
    // wainscot
    g.fillStyle = A.linear(g, 0, 612, 0, 735, [[0, '#55303b'], [1, '#3e2230']]); g.fillRect(0, 612, 1920, 123);
    for (let x = 16; x < 1920; x += 196) {
      rect(g, x, 628, 176, 2, 'rgba(15,4,10,0.5)'); rect(g, x, 628, 2, 78, 'rgba(15,4,10,0.5)');
      rect(g, x, 704, 176, 2, 'rgba(255,200,170,0.13)'); rect(g, x + 174, 628, 2, 78, 'rgba(255,200,170,0.13)');
    }
    g.fillStyle = A.linear(g, 0, 600, 0, 618, [[0, '#d6a582'], [0.4, '#a2715b'], [1, '#5a3240']]); g.fillRect(0, 600, 1920, 16);
    g.fillStyle = A.linear(g, 0, 708, 0, 737, [[0, '#6e4650'], [0.15, '#4a2a34'], [1, '#2a141d']]); g.fillRect(0, 708, 1920, 29);
    rect(g, 0, 708, 1920, 2, 'rgba(255,205,170,0.28)');
  }

  function drawFloor(g) {
    g.fillStyle = A.linear(g, 0, 735, 0, 1080, [[0, '#6e4029'], [0.5, '#5b331f'], [1, '#2f1a12']]);
    g.fillRect(0, 735, 1920, 345);
    // planks converging to the vanishing point
    const yb = 735, k = (1080 - VP[1]) / (yb - VP[1]);
    const xs = []; for (let xb = -1600; xb < 3600; xb += 58) xs.push(xb);
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1];
      const pa = [VP[0] + (a - VP[0]) * k, 1080], pb = [VP[0] + (b - VP[0]) * k, 1080];
      if (Math.max(a, b, pa[0], pb[0]) < -50 || Math.min(a, b, pa[0], pb[0]) > 1970) continue;
      const v = hh(i * 3.7);
      g.fillStyle = v > 0.5 ? `rgba(255,190,130,${(v - 0.5) * 0.12})` : `rgba(20,6,0,${(0.5 - v) * 0.2})`;
      poly(g, [[a, yb], [b, yb], pb, pa]); g.fill();
      line(g, a, yb, pa[0], pa[1], 'rgba(28,12,6,0.55)', 1.6);
      // staggered joints
      for (let j = 0; j < 7; j++) {
        const f = (j + hh(i * 1.3 + j) * 0.9) / 7, y = L(yb, 1080, f * f);
        const s = (y - VP[1]) / (yb - VP[1]);
        line(g, VP[0] + (a - VP[0]) * s, y, VP[0] + (b - VP[0]) * s, y, 'rgba(28,12,6,0.4)', 1.4);
      }
    }
    // contact shadow along the wall
    g.fillStyle = A.linear(g, 0, 735, 0, 770, [[0, 'rgba(15,5,5,0.55)'], [1, 'rgba(15,5,5,0)']]); g.fillRect(0, 735, 1920, 35);
    // lamp reflection streak in the varnish
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = A.radial(g, 600, 800, 0, 180, [[0, 'rgba(255,170,90,0.22)'], [1, 'rgba(255,170,90,0)']]);
    g.setTransform(g.getTransform().scale(1, 1)); g.save(); g.translate(600, 800); g.scale(0.5, 1.6); g.translate(-600, -800); g.fillRect(400, 600, 400, 400); g.restore();
    g.restore();
  }

  function drawRug(g) {
    g.save();
    // soft shadow under rug edge
    rugPoly(g, [[-0.005, -0.01], [1.005, -0.01], [1.01, 1.02], [-0.01, 1.02]], 'rgba(20,6,6,0.4)');
    rugPoly(g, [[0, 0], [1, 0], [1, 1], [0, 1]], '#8a2b33');
    // outer border
    rugPoly(g, [[0, 0], [1, 0], [1, 0.1], [0, 0.1]], '#262a55');
    rugPoly(g, [[0, 0.9], [1, 0.9], [1, 1], [0, 1]], '#262a55');
    rugPoly(g, [[0, 0], [0.055, 0], [0.055, 1], [0, 1]], '#262a55');
    rugPoly(g, [[0.945, 0], [1, 0], [1, 1], [0.945, 1]], '#262a55');
    // zigzag border motif
    for (let i = 0; i < 26; i++) {
      const u0 = 0.06 + i * 0.034; rugPoly(g, [[u0, 0.085], [u0 + 0.017, 0.02], [u0 + 0.034, 0.085]], '#e2cda1');
      rugPoly(g, [[u0, 0.915], [u0 + 0.017, 0.98], [u0 + 0.034, 0.915]], '#e2cda1');
    }
    for (let i = 0; i < 8; i++) {
      const v0 = 0.11 + i * 0.1; rugPoly(g, [[0.008, v0], [0.045, v0 + 0.05], [0.008, v0 + 0.1]], '#d59a3c');
      rugPoly(g, [[0.992, v0], [0.955, v0 + 0.05], [0.992, v0 + 0.1]], '#d59a3c');
    }
    // cream pinstripe
    const pin = (u0, v0, u1, v1) => { rugPoly(g, [[u0, v0], [u1, v0], [u1, v0 + 0.008], [u0, v0 + 0.008]], '#e8d3a8'); };
    pin(0.055, 0.1, 0.945, 0); pin(0.055, 0.892, 0.945, 0);
    // medallions
    rugDiamond(g, 0.5, 0.5, 0.2, 0.34, '#e8d3a8'); rugDiamond(g, 0.5, 0.5, 0.185, 0.31, '#262a55');
    rugDiamond(g, 0.5, 0.5, 0.13, 0.22, '#b84a3a'); rugDiamond(g, 0.5, 0.5, 0.07, 0.12, '#e8b448'); rugDiamond(g, 0.5, 0.5, 0.03, 0.05, '#262a55');
    for (const cu of [0.17, 0.83]) { rugDiamond(g, cu, 0.5, 0.085, 0.24, '#d59a3c'); rugDiamond(g, cu, 0.5, 0.05, 0.14, '#6d1f28'); rugDiamond(g, cu, 0.5, 0.02, 0.05, '#e8d3a8'); }
    for (let i = 0; i < 10; i++) for (const v of [0.2, 0.8]) { const u = 0.12 + i * 0.085; if (Math.abs(u - 0.5) < 0.2 && Math.abs(v - 0.5) < 0.2) continue; rugDiamond(g, u, v, 0.012, 0.03, '#e8d3a8'); }
    // fringe
    g.strokeStyle = '#d9c49a'; g.lineWidth = 2;
    for (let i = 0; i <= 60; i++) { const u = i / 60; const a = rugP(u, 1), b = rugP(u + (hh(i) - 0.5) * 0.004, 1.035); line(g, a[0], a[1], b[0], b[1], 'rgba(225,205,160,0.8)', 2.2); }
    for (let i = 0; i <= 60; i++) { const u = i / 60; const a = rugP(u, 0), b = rugP(u, -0.03); line(g, a[0], a[1], b[0], b[1], 'rgba(200,180,140,0.6)', 1.6); }
    // pile texture / wear
    const tr = A.rng(77);
    for (let i = 0; i < 900; i++) { const p = rugP(tr(), tr()); g.fillStyle = tr() > 0.5 ? 'rgba(255,230,200,0.06)' : 'rgba(0,0,0,0.08)'; g.fillRect(p[0], p[1], 3, 1.5); }
    g.restore();
  }

  // ---- window: exterior (behind the glass)
  function drawExterior(g) {
    const { x, y, w, h } = WIN;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = A.linear(g, 0, y, 0, y + h, [[0, '#0d1236'], [0.35, '#1f2660'], [0.62, '#4d4a86'], [0.78, '#9a6d8e'], [1, '#2a2350']]);
    g.fillRect(x, y, w, h);
    // snow clouds lit from below by the city
    for (let i = 0; i < 9; i++) { const cx = x + hh(i) * w, cy = y + 30 + hh(i + 4) * 180, r = 60 + hh(i + 8) * 70; g.fillStyle = A.radial(g, cx, cy, 0, r, [[0, 'rgba(120,110,170,0.22)'], [1, 'rgba(120,110,170,0)']]); g.beginPath(); g.ellipse(cx, cy, r * 1.6, r * 0.55, 0, 0, TAU); g.fill(); }
    // far skyline
    const sky = A.rng(12);
    let bx = x - 10;
    while (bx < x + w + 10) { const bw = 14 + sky() * 30, bh = 30 + sky() * 110; g.fillStyle = '#39386e'; g.fillRect(bx, y + 440 - bh, bw, bh + 80);
      for (let wy = y + 446 - bh; wy < y + 440; wy += 7) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) if (sky() > 0.72) { g.fillStyle = sky() > 0.3 ? 'rgba(255,214,140,0.75)' : 'rgba(170,210,255,0.7)'; g.fillRect(wx, wy, 2, 3); }
      bx += bw + 2; }
    // CN tower
    cnTower(g, x + 292, y + 470, 400, { lit: '#9c9fd8', shade: '#3a3a74' });
    // haze band
    g.fillStyle = A.linear(g, 0, y + 330, 0, y + 460, [[0, 'rgba(160,120,170,0)'], [1, 'rgba(170,120,160,0.45)']]); g.fillRect(x, y + 330, w, 130);
    // mid buildings (darker, closer)
    bx = x - 20; const r2 = A.rng(5);
    while (bx < x + w + 10) { const bw = 40 + r2() * 60, bh = 20 + r2() * 60; g.fillStyle = '#1d1c46'; g.fillRect(bx, y + 470 - bh, bw, bh + 60);
      for (let wy = y + 478 - bh; wy < y + 500; wy += 11) for (let wx = bx + 5; wx < bx + bw - 6; wx += 10) if (r2() > 0.6) { g.fillStyle = 'rgba(255,190,110,0.85)'; g.fillRect(wx, wy, 4, 6); }
      g.fillStyle = '#dfe8ff'; g.fillRect(bx - 2, y + 468 - bh, bw + 4, 4);
      bx += bw + 6; }
    // close snowy rooftop across the street
    g.fillStyle = '#131232'; poly(g, [[x, y + 520], [x + 120, y + 505], [x + 250, y + 512], [x + w, y + 498], [x + w, y + h], [x, y + h]]); g.fill();
    g.fillStyle = '#d4def8'; poly(g, [[x, y + 516], [x + 120, y + 501], [x + 250, y + 508], [x + w, y + 494], [x + w, y + 504], [x + 250, y + 518], [x + 120, y + 511], [x, y + 526]]); g.fill();
    // chimney + water tank
    rect(g, x + 60, y + 470, 26, 45, '#1b1a3e'); rect(g, x + 56, y + 466, 34, 7, '#e2e9ff');
    g.fillStyle = '#1b1a3e'; A.ellipse(g, x + 330, y + 470, 26, 8); g.fill(); g.fillRect(x + 304, y + 470, 52, 30); rect(g, x + 304, y + 462, 52, 6, '#e2e9ff');
    // snow heaped on outside sill of the lower panes
    for (const px of [90, 292]) { g.fillStyle = '#eef3ff'; A.blob(g, [[px, y + h], [px + 20, y + h - 18], [px + 70, y + h - 24], [px + 130, y + h - 16], [px + 188, y + h - 26], [px + 188, y + h + 10], [px, y + h + 10]]); g.fill();
      g.fillStyle = 'rgba(120,140,210,0.5)'; g.fillRect(px, y + h - 4, 188, 4); }
    g.restore();
  }

  function drawWindowFrame(g) {
    const { x, y, w, h } = WIN;
    // cold light spill on wall around window
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = A.radial(g, x + w / 2, y + h / 2, 150, 420, [[0, 'rgba(90,120,200,0.18)'], [1, 'rgba(90,120,200,0)']]); g.fillRect(x - 300, y - 200, w + 600, h + 400);
    g.restore();
    // outer casing
    const cas = '#e3d3bf', cs = '#8f7872';
    g.fillStyle = cas; g.fillRect(x - 26, y - 26, w + 52, h + 30);
    g.fillStyle = A.linear(g, x - 26, 0, x + w + 26, 0, [[0, '#b3a09a'], [0.08, cas], [0.92, '#b9a39a'], [1, cs]]); g.fillRect(x - 26, y - 26, w + 52, h + 30);
    rect(g, x - 26, y - 26, w + 52, 4, 'rgba(255,240,220,0.6)');
    g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(x - 26, y - 26, w + 52, h + 30);
    // inner reveal (depth)
    g.fillStyle = '#7e6c79'; g.fillRect(x - 8, y - 8, w + 16, h + 8);
    // hole (drawn later by exterior; we paint it here so frame overlaps properly)
    drawExterior(g);
    // mullions
    const mul = (mx, my, mw, mh) => { g.fillStyle = A.linear(g, mx, my, mx + mw, my + mh, [[0, '#f0e4d2'], [1, '#a8938a']]); g.fillRect(mx, my, mw, mh); g.strokeStyle = 'rgba(26,19,48,0.8)'; g.lineWidth = 2; g.strokeRect(mx, my, mw, mh); };
    mul(278, y, 14, h); mul(x, 293, w, 14);
    g.strokeStyle = 'rgba(26,19,48,0.9)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
    // sill (interior)
    g.fillStyle = A.linear(g, 0, y + h, 0, y + h + 30, [[0, '#f3e6d4'], [0.35, '#d7c3ae'], [1, '#7d6560']]);
    poly(g, [[x - 40, y + h + 2], [x + w + 40, y + h + 2], [x + w + 46, y + h + 22], [x - 46, y + h + 22]]); g.fill();
    rect(g, x - 46, y + h + 22, w + 92, 9, '#6c5358');
    g.strokeStyle = O; g.lineWidth = 3; poly(g, [[x - 40, y + h + 2], [x + w + 40, y + h + 2], [x + w + 46, y + h + 22], [x + w + 46, y + h + 31], [x - 46, y + h + 31], [x - 46, y + h + 22]]); g.stroke();
  }

  function drawRadiator(g) {
    const x0 = 118, x1 = 452, y0 = 648, y1 = 726;
    g.save();
    rect(g, x0, y1 - 2, x1 - x0, 6, 'rgba(10,4,6,0.5)');
    for (let x = x0; x < x1; x += 19) {
      g.fillStyle = A.linear(g, x, 0, x + 16, 0, [[0, '#d9cdb8'], [0.4, '#f1e6d2'], [1, '#8f8278']]);
      A.rrect(g, x, y0, 16, y1 - y0, 7); g.fill(); g.strokeStyle = 'rgba(26,19,48,0.7)'; g.lineWidth = 1.5; g.stroke();
    }
    rect(g, x0 - 4, y0 + 8, x1 - x0 + 8, 6, '#b8aa98'); rect(g, x0 - 4, y1 - 16, x1 - x0 + 8, 6, '#9d8f82');
    // valve knob
    g.fillStyle = '#b9412f'; A.ellipse(g, x1 + 14, y1 - 22, 9, 9); g.fill(); g.stroke();
    rect(g, x1, y1 - 24, 12, 5, '#8a8078');
    // wool socks drying on the radiator (Saba's)
    const sock = (sx, c1, c2, flip) => {
      g.save(); g.translate(sx, y0 - 2); g.scale(flip, 1);
      A.blob(g, [[-10, -4], [12, -4], [12, 30], [14, 44], [26, 50], [26, 62], [2, 62], [-6, 54], [-10, 30]]);
      A.fillStroke(g, c1, 2.5);
      g.fillStyle = c2; g.fillRect(-10, 6, 22, 5); g.fillRect(-10, 16, 22, 5);
      g.restore();
    };
    sock(200, '#c9c0b0', '#2d4f9e', 1); sock(236, '#c9c0b0', '#2d4f9e', 1);
    g.restore();
  }

  function drawPhoto(g) {
    const { x, y, w, h } = A.LR.photo;
    g.save();
    g.fillStyle = 'rgba(10,3,8,0.45)'; g.fillRect(x + 8, y + 10, w, h);
    // frame
    g.fillStyle = A.linear(g, x, y, x + w, y + h, [[0, '#d8a95c'], [0.5, '#8a5a2a'], [1, '#5e3a1c']]); g.fillRect(x, y, w, h);
    g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(x, y, w, h);
    rect(g, x + 10, y + 10, w - 20, h - 20, '#efe3cc');
    const px = x + 22, py = y + 20, pw = w - 44, ph = h - 40;
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    g.fillStyle = A.linear(g, 0, py, 0, py + ph * 0.55, [[0, '#f07a5a'], [0.6, '#ffb36a'], [1, '#ffe0a0']]); g.fillRect(px, py, pw, ph);
    g.fillStyle = '#fff1c2'; A.ellipse(g, px + pw * 0.66, py + ph * 0.52, 13, 13); g.fill();
    // hotels skyline
    g.fillStyle = '#b75a6a'; [[4, 14, 8], [14, 22, 7], [24, 10, 9], [36, 18, 6]].forEach(([bx, bh, bw]) => g.fillRect(px + bx, py + ph * 0.55 - bh, bw, bh));
    g.fillStyle = A.linear(g, 0, py + ph * 0.55, 0, py + ph * 0.78, [[0, '#2e7db0'], [1, '#48c0c8']]); g.fillRect(px, py + ph * 0.55, pw, ph * 0.25);
    g.fillStyle = 'rgba(255,240,190,0.8)'; for (let i = 0; i < 6; i++) g.fillRect(px + pw * 0.58 + (i % 3) * 8, py + ph * 0.58 + i * 3, 12 - i, 1.5);
    rect(g, px, py + ph * 0.78, pw, 3, '#f7fbff');
    g.fillStyle = '#f2cf92'; g.fillRect(px, py + ph * 0.8, pw, ph * 0.3);
    // lifeguard hut on stilts
    g.strokeStyle = '#6a3d24'; g.lineWidth = 2; line(g, px + 118, py + ph * 0.62, px + 114, py + ph * 0.9, '#6a3d24', 2); line(g, px + 136, py + ph * 0.62, px + 140, py + ph * 0.9, '#6a3d24', 2);
    rect(g, px + 110, py + ph * 0.45, 34, 18, '#f4f0e8'); rect(g, px + 108, py + ph * 0.42, 38, 5, '#d9463a'); line(g, px + 146, py + ph * 0.42, px + 146, py + ph * 0.25, '#333', 1.5); rect(g, px + 146, py + ph * 0.25, 9, 6, '#d9463a');
    // umbrellas
    [[22, '#ffd21f'], [60, '#1f4fbf'], [88, '#e84a5f']].forEach(([ux, c]) => { line(g, px + ux, py + ph * 0.8, px + ux, py + ph * 0.95, '#555', 1.5); g.fillStyle = c; g.beginPath(); g.arc(px + ux, py + ph * 0.8, 11, Math.PI, 0); g.fill(); });
    // palm
    line(g, px + 10, py + ph, px + 16, py + ph * 0.35, '#5a3a22', 3);
    g.fillStyle = '#2f5a2a'; for (let i = 0; i < 6; i++) { g.save(); g.translate(px + 16, py + ph * 0.35); g.rotate(-2.6 + i * 0.95); A.ellipse(g, 12, 0, 13, 3.5); g.fill(); g.restore(); }
    g.restore();
    // glass sheen
    g.fillStyle = A.linear(g, px, py, px + pw, py + ph, [[0, 'rgba(255,255,255,0.18)'], [0.35, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.05)']]); g.fillRect(px, py, pw, ph);
    // brass plaque
    rect(g, x + w / 2 - 34, y + h - 17, 68, 13, '#c89a48');
    A.text(g, 'תל אביב', x + w / 2, y + h - 10, { font: '700 10px Rubik', fill: '#3a2410', dir: 'rtl' });
    // hanging wire
    g.strokeStyle = 'rgba(30,15,20,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 40, y + 2); g.lineTo(x + w / 2, y - 26); g.lineTo(x + w - 40, y + 2); g.stroke();
    g.fillStyle = '#c89a48'; A.ellipse(g, x + w / 2, y - 26, 3, 3); g.fill();
    g.restore();
  }

  function drawHamsa(g) {
    const { x, y } = A.LR.hamsa, s = 40;
    g.save(); g.translate(x, y);
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.5; line(g, 0, -s * 1.7, -12, -s * 1.05, '#8a6a3a', 1.5); line(g, 0, -s * 1.7, 12, -s * 1.05, '#8a6a3a', 1.5);
    g.fillStyle = '#c89a48'; A.ellipse(g, 0, -s * 1.7, 3, 3); g.fill();
    g.fillStyle = 'rgba(10,3,8,0.35)'; g.save(); g.translate(5, 7);
    const shapes = (gg, grow) => {
      const e = grow;
      gg.beginPath(); gg.ellipse(0, s * 0.2, s * 0.62 + e, s * 0.7 + e, 0, 0, TAU);
      gg.roundRect(-s * 0.46 - e, -s * 1.02 - e, s * 0.28 + 2 * e, s * 1.1 + 2 * e, s * 0.14 + e);
      gg.roundRect(-s * 0.14 - e, -s * 1.15 - e, s * 0.28 + 2 * e, s * 1.2 + 2 * e, s * 0.14 + e);
      gg.roundRect(s * 0.18 - e, -s * 1.02 - e, s * 0.28 + 2 * e, s * 1.1 + 2 * e, s * 0.14 + e);
    };
    const thumbs = (gg, e) => { for (const sd of [-1, 1]) { gg.save(); gg.translate(sd * s * 0.58, -s * 0.05); gg.rotate(sd * -0.35); gg.beginPath(); gg.roundRect(-s * 0.14 - e, -s * 0.62 - e, s * 0.28 + 2 * e, s * 0.8 + 2 * e, s * 0.14 + e); gg.fill(); gg.restore(); } };
    shapes(g, 0); g.fill(); thumbs(g, 0); g.restore();
    g.fillStyle = O; shapes(g, 3); g.fill(); thumbs(g, 3);
    g.fillStyle = '#e9c35e'; shapes(g, 0.5); g.fill(); thumbs(g, 0.5);
    g.fillStyle = '#2f63c9'; shapes(g, -3); g.fill(); thumbs(g, -3);
    // light on left
    g.save(); g.globalAlpha = 0.35; g.fillStyle = '#9fc2ff'; g.beginPath(); g.ellipse(-s * 0.2, 0, s * 0.3, s * 0.6, 0.2, 0, TAU); g.fill(); g.restore();
    // eye
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-s * 0.4, s * 0.2); g.quadraticCurveTo(0, -s * 0.15, s * 0.4, s * 0.2); g.quadraticCurveTo(0, s * 0.55, -s * 0.4, s * 0.2); g.fill();
    g.strokeStyle = O; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1c9fd6'; A.ellipse(g, 0, s * 0.2, s * 0.15, s * 0.15); g.fill(); g.fillStyle = '#0c1430'; A.ellipse(g, 0, s * 0.2, s * 0.07, s * 0.07); g.fill();
    g.fillStyle = '#fff'; A.ellipse(g, s * 0.05, s * 0.15, s * 0.03, s * 0.03); g.fill();
    // gold dots
    g.fillStyle = '#ffd98a'; for (let i = 0; i < 12; i++) { const a = Math.PI * (0.1 + i / 11 * 0.8); A.ellipse(g, Math.cos(a) * s * 0.48, s * 0.25 + Math.sin(a) * s * 0.5, 2, 2); g.fill(); }
    for (const fx of [-0.32, 0, 0.32]) { A.ellipse(g, fx * s, -s * 0.72, 2, 2); g.fill(); }
    g.restore();
  }

  function drawPennant(g) {
    const { x, y } = A.LR.pennant;
    g.save(); g.translate(x, y); g.rotate(0.05);
    // nail + string
    line(g, -6, -18, 0, 4, 'rgba(40,20,20,0.8)', 1.5); line(g, -6, -18, 0, 96, 'rgba(40,20,20,0.0)', 1);
    g.fillStyle = '#d0b070'; A.ellipse(g, -6, -18, 3, 3); g.fill();
    // shadow
    g.fillStyle = 'rgba(10,3,8,0.4)'; poly(g, [[8, 10], [300, 60], [8, 110]]); g.fill();
    // body with slight wave
    const P = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(100, 8, 200, 38, 290, 52); g.bezierCurveTo(200, 62, 100, 88, 0, 100); g.closePath(); };
    P(); g.fillStyle = '#1f4fbf'; g.fill();
    g.save(); P(); g.clip();
    g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(100, 8, 200, 38, 290, 52); g.lineTo(290, 58); g.bezierCurveTo(200, 46, 100, 18, 0, 12); g.fill();
    g.beginPath(); g.moveTo(0, 100); g.bezierCurveTo(100, 88, 200, 62, 290, 52); g.lineTo(290, 46); g.bezierCurveTo(200, 56, 100, 80, 0, 88); g.fill();
    g.fillStyle = 'rgba(0,0,20,0.25)'; g.fillRect(150, 0, 160, 110);
    g.restore();
    P(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    // felt left band + star emblem
    g.fillStyle = '#ffd21f'; g.fillRect(0, 0, 18, 100); g.strokeRect(0, 0, 18, 100);
    g.save(); g.translate(46, 50); g.strokeStyle = '#ffd21f'; g.lineWidth = 3.5;
    for (const r of [0, Math.PI]) { g.beginPath(); for (let k = 0; k < 3; k++) { const a = r + k * TAU / 3 - Math.PI / 2; g[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 17, Math.sin(a) * 17); } g.closePath(); g.stroke(); }
    g.restore();
    A.text(g, 'MACCABI', 150, 44, { font: '800 30px Rubik', fill: '#ffd21f', stroke: '#0f2a70', lw: 4 });
    A.text(g, 'מכבי תל אביב', 142, 70, { font: '700 16px Rubik', fill: '#fff4c2', dir: 'rtl' });
    // tassels
    for (let i = 0; i < 7; i++) { line(g, 0, 8 + i * 14, -14, 12 + i * 14, i % 2 ? '#1f4fbf' : '#ffd21f', 4); }
    g.restore();
  }

  function drawBookshelf(g) {
    const x0 = 1772, x1 = 1960, y0 = 70, y1 = 846;
    g.save();
    g.fillStyle = 'rgba(10,3,8,0.45)'; g.fillRect(x0 - 16, y0 + 6, 20, y1 - y0);
    g.fillStyle = '#2a1712'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const shelves = [70, 196, 328, 460, 592, 724, 846];
    const rng = A.rng(41);
    for (let s = 0; s < shelves.length - 1; s++) {
      const top = shelves[s] + 14, bot = shelves[s + 1];
      g.fillStyle = A.linear(g, 0, top, 0, bot, [[0, '#120806'], [1, '#2d1a14']]); g.fillRect(x0 + 16, top, x1 - x0, bot - top);
      let bx = x0 + 22;
      const special = s;
      while (bx < x1) {
        if (special === 1 && bx > 1800 && bx < 1830) { // trophy
          g.fillStyle = A.linear(g, bx, 0, bx + 34, 0, [[0, '#8a6420'], [0.4, '#ffe08a'], [1, '#9a7020']]);
          g.beginPath(); g.moveTo(bx, bot - 70); g.lineTo(bx + 34, bot - 70); g.quadraticCurveTo(bx + 30, bot - 40, bx + 20, bot - 34); g.lineTo(bx + 20, bot - 16); g.lineTo(bx + 28, bot - 10); g.lineTo(bx + 28, bot); g.lineTo(bx + 6, bot); g.lineTo(bx + 6, bot - 10); g.lineTo(bx + 14, bot - 16); g.lineTo(bx + 14, bot - 34); g.quadraticCurveTo(bx + 4, bot - 40, bx, bot - 70); g.fill();
          g.strokeStyle = O; g.lineWidth = 2; g.stroke(); bx += 44; continue;
        }
        if (special === 3 && bx > 1790 && bx < 1820) { // football
          g.fillStyle = '#f4f4f4'; A.ellipse(g, bx + 24, bot - 25, 24, 24); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke();
          g.fillStyle = '#222'; for (const [dx, dy] of [[0, 0], [-13, -9], [12, -10], [-10, 12], [12, 11]]) { A.ellipse(g, bx + 24 + dx, bot - 25 + dy, 5, 5); g.fill(); }
          bx += 54; continue;
        }
        const bw = 12 + rng() * 16, bh = (bot - top) * (0.6 + rng() * 0.32);
        const cols = ['#7d2b2b', '#2c4a6e', '#3d5a3a', '#8a6a2a', '#5a2f5e', '#b88a4a', '#2f2f44', '#9a4a2a', '#e0d4b0'];
        const c = cols[Math.floor(rng() * cols.length)];
        const lean = rng() > 0.9 ? 0.15 : 0;
        g.save(); g.translate(bx, bot); g.rotate(lean);
        g.fillStyle = c; g.fillRect(0, -bh, bw, bh);
        g.fillStyle = 'rgba(255,230,190,0.18)'; g.fillRect(1, -bh, 2, bh);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(bw - 3, -bh, 3, bh);
        g.fillStyle = 'rgba(255,215,120,0.6)'; g.fillRect(2, -bh + 10, bw - 4, 2); g.fillRect(2, -bh + 16 + rng() * 20, bw - 4, 2);
        g.strokeStyle = 'rgba(20,10,20,0.7)'; g.lineWidth = 1.2; g.strokeRect(0, -bh, bw, bh);
        g.restore();
        bx += bw + (lean ? 6 : 1);
      }
    }
    // shelf boards
    for (const sy of shelves) { g.fillStyle = A.linear(g, 0, sy, 0, sy + 14, [[0, '#9a6440'], [0.3, '#6b4028'], [1, '#3f2418']]); g.fillRect(x0, sy, x1 - x0, 14); }
    // side panel
    g.fillStyle = A.linear(g, x0, 0, x0 + 18, 0, [[0, '#a06a44'], [1, '#5a3420']]); g.fillRect(x0, y0 - 6, 18, y1 - y0 + 12);
    g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(x0, y0 - 6, 18, y1 - y0 + 12);
    // menorah on top
    g.save(); g.translate(1860, 70);
    g.strokeStyle = '#d8a84a'; g.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(i * 8, -12, i * 8, -40 + Math.abs(i) * 0); g.stroke(); }
    line(g, 0, -12, 0, 0, '#d8a84a', 4); rect(g, -12, -3, 24, 4, '#d8a84a');
    g.restore();
    // trailing pothos from the top
    g.save();
    const leaf = (lx, ly, r, a) => { g.save(); g.translate(lx, ly); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r, -r * 0.8, r * 1.6, 0); g.quadraticCurveTo(r, r * 0.8, 0, 0); g.fillStyle = '#3d7a3a'; g.fill(); g.strokeStyle = '#1c3a20'; g.lineWidth = 1.5; g.stroke(); g.restore(); };
    g.fillStyle = '#b35a35'; A.rrect(g, 1790, 36, 44, 34, 6); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = '#2d5a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(1800, 50); g.bezierCurveTo(1780, 120, 1800, 200, 1782, 300); g.stroke();
    for (let i = 0; i < 9; i++) { const yy = 60 + i * 28; leaf(1800 - Math.sin(i) * 12, yy, 9 + (i % 3) * 2, (i % 2 ? 0.6 : 2.4)); }
    for (let i = 0; i < 5; i++) leaf(1812 + i * 5, 36 - (i % 2) * 6, 10, -1.2 - i * 0.4);
    g.restore();
    g.restore();
  }

  function drawCabinet(g) {
    const { x, y, w, h } = A.LR.cabinet;
    g.save();
    // floor shadow
    g.fillStyle = A.radial(g, x + w / 2, y + h + 6, 0, w * 0.62, [[0, 'rgba(10,3,3,0.6)'], [1, 'rgba(10,3,3,0)']]);
    g.save(); g.translate(x + w / 2, y + h + 6); g.scale(1, 0.12); g.translate(-(x + w / 2), -(y + h + 6)); g.fillRect(x - 80, y + h - 400, w + 160, 800); g.restore();
    // legs
    for (const lx of [x + 24, x + w - 36]) { g.fillStyle = '#3d2216'; poly(g, [[lx, y + h - 20], [lx + 14, y + h - 20], [lx + 10, y + h + 20], [lx + 5, y + h + 20]]); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke(); }
    // body
    g.fillStyle = A.linear(g, 0, y, 0, y + h, [[0, '#8a5634'], [1, '#5c341f']]); g.fillRect(x + 4, y + 8, w - 8, h - 16);
    g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(x + 4, y + 8, w - 8, h - 16);
    // top slab
    g.fillStyle = A.linear(g, 0, y - 8, 0, y + 10, [[0, '#c48a5a'], [0.4, '#8f5a36'], [1, '#5a3420']]); g.fillRect(x - 10, y - 8, w + 20, 18);
    g.strokeRect(x - 10, y - 8, w + 20, 18);
    // doors with slatted mid-century fronts
    const door = (dx, dw) => {
      g.fillStyle = A.linear(g, dx, 0, dx + dw, 0, [[0, '#9a6440'], [1, '#6f4128']]); g.fillRect(dx, y + 20, dw, h - 40);
      for (let sx = dx + 8; sx < dx + dw - 4; sx += 10) { rect(g, sx, y + 28, 2, h - 56, 'rgba(30,12,5,0.35)'); rect(g, sx + 2, y + 28, 1, h - 56, 'rgba(255,210,160,0.15)'); }
      g.strokeStyle = 'rgba(26,19,48,0.8)'; g.lineWidth = 2; g.strokeRect(dx, y + 20, dw, h - 40);
    };
    door(x + 16, 168); door(x + w - 184, 168);
    for (const kx of [x + 176, x + w - 176]) { g.fillStyle = '#e0b35a'; A.ellipse(g, kx, y + h / 2, 5, 5); g.fill(); g.strokeStyle = O; g.lineWidth = 1.5; g.stroke(); }
    // middle compartments
    const mx = x + 196, mw = w - 392;
    const cav = (cy, ch) => { g.fillStyle = A.linear(g, 0, cy, 0, cy + ch, [[0, '#0e0605'], [0.7, '#23130d'], [1, '#2e1a12']]); g.fillRect(mx, cy, mw, ch); g.strokeStyle = O; g.lineWidth = 2.5; g.strokeRect(mx, cy, mw, ch);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(mx, cy, mw, 8); };
    cav(y + 20, 58); cav(y + 88, h - 108);
    rect(g, mx - 2, y + 78, mw + 4, 10, '#7a4a2e');
    // set-top box on upper shelf
    g.fillStyle = A.linear(g, 0, y + 50, 0, y + 76, [[0, '#3a3a48'], [1, '#15151d']]); A.rrect(g, mx + 22, y + 48, mw - 44, 28, 4); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#081a22'; g.fillRect(mx + 36, y + 56, 60, 12);
    A.text(g, 'IPTV', mx + 66, y + 62.5, { font: '700 10px Rubik', fill: '#5fe8ff' });
    g.fillStyle = '#48ff8a'; A.ellipse(g, mx + mw - 40, y + 62, 2.5, 2.5); g.fill();
    // cable from set-top box to router shelf
    g.strokeStyle = '#161218'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx + mw - 26, y + 76); g.bezierCurveTo(mx + mw - 10, y + 100, mx + mw - 14, y + 150, mx + mw - 40, y + 176); g.stroke();
    g.restore();
  }

  function drawFlagCup(g) {
    const x = 1737, y = 640;
    g.save();
    // stick
    line(g, x + 2, y - 14, x + 8, y - 112, '#8a6a4a', 3);
    // flag
    g.save(); g.translate(x + 8, y - 112); g.rotate(0.06);
    const fw = 62, fh = 44;
    g.fillStyle = '#fbfbff'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(fw * 0.35, -4, fw * 0.65, 4, fw, 0); g.lineTo(fw, fh); g.bezierCurveTo(fw * 0.65, fh + 4, fw * 0.35, fh - 4, 0, fh); g.closePath(); g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(160,170,210,0.35)'; g.fillRect(fw * 0.55, -6, fw, fh + 12);
    g.fillStyle = '#1d44b8'; g.fillRect(0, 5, fw, 6); g.fillRect(0, fh - 11, fw, 6);
    g.restore();
    g.strokeStyle = O; g.lineWidth = 2; g.stroke();
    g.strokeStyle = '#1d44b8'; g.lineWidth = 2.2;
    for (const r of [0, Math.PI]) { g.beginPath(); for (let k = 0; k < 3; k++) { const a = r + k * TAU / 3 - Math.PI / 2; g[k ? 'lineTo' : 'moveTo'](fw / 2 + Math.cos(a) * 9, fh / 2 + Math.sin(a) * 9); } g.closePath(); g.stroke(); }
    g.restore();
    // mug (Maccabi colours)
    g.fillStyle = A.linear(g, x - 16, 0, x + 18, 0, [[0, '#ffe46a'], [0.6, '#ffd21f'], [1, '#b8920e']]);
    A.rrect(g, x - 16, y - 38, 34, 38, 5); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
    rect(g, x - 16, y - 26, 34, 8, '#1f4fbf');
    g.beginPath(); g.arc(x + 20, y - 20, 9, -1.3, 1.3); g.strokeStyle = O; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#ffd21f'; g.lineWidth = 2.5; g.stroke();
    // remote + small frame on the left of the TV
    g.fillStyle = '#1b1b24'; A.rrect(g, 1200, y - 10, 36, 9, 4); g.fill();
    g.fillStyle = '#c9a060'; g.fillRect(1208, y - 60, 30, 48); g.strokeStyle = O; g.lineWidth = 2; g.strokeRect(1208, y - 60, 30, 48);
    g.fillStyle = A.linear(g, 0, y - 55, 0, y - 18, [[0, '#8fb8e0'], [1, '#e0b080']]); g.fillRect(1212, y - 56, 22, 40);
    g.fillStyle = '#6a3a2a'; A.ellipse(g, 1223, y - 32, 6, 8); g.fill(); A.ellipse(g, 1223, y - 44, 4, 4); g.fill();
    g.restore();
  }

  function drawSideTable(g) {
    const { x, y } = A.LR.sideTable;
    g.save();
    // shadow on floor
    g.fillStyle = 'rgba(15,4,4,0.45)'; A.ellipse(g, x + 8, 806, 64, 10); g.fill();
    // tripod legs
    for (const [dx, ex] of [[-30, -48], [30, 48], [0, 6]]) { g.fillStyle = '#4a2a1a'; poly(g, [[x + dx - 4, y + 10], [x + dx + 4, y + 10], [x + ex + 2, 806], [x + ex - 2, 806]]); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke(); }
    // top
    g.fillStyle = '#4a2a1a'; A.ellipse(g, x, y + 7, 66, 17); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    g.fillStyle = A.linear(g, x - 66, 0, x + 66, 0, [[0, '#d09a64'], [0.5, '#a36a3e'], [1, '#6f4128']]); A.ellipse(g, x, y, 66, 16); g.fill(); g.stroke();
    // crochet doily
    g.fillStyle = 'rgba(250,240,220,0.9)'; g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = 40 + (i % 2) * 4; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.24); } g.fill();
    g.strokeStyle = 'rgba(180,160,130,0.8)'; g.lineWidth = 1; A.ellipse(g, x, y, 26, 6); g.stroke(); A.ellipse(g, x, y, 14, 3.5); g.stroke();
    // puffs spilled
    g.fillStyle = '#e8b25a'; for (let i = 0; i < 6; i++) { A.ellipse(g, x - 44 + i * 9 + (i % 2) * 3, y + 6 - (i % 3) * 2, 4, 2.4, i); g.fill(); }
    // Bamba bag
    const bx = A.LR.bamba.x, by = y + 4;
    g.save(); g.translate(bx, by); g.rotate(-0.08);
    const bag = () => { g.beginPath(); g.moveTo(-22, 0); g.lineTo(-24, -52); for (let i = 0; i <= 8; i++) g.lineTo(-24 + i * 6, -56 + (i % 2) * 4); g.lineTo(24, -52); g.lineTo(22, 0); g.quadraticCurveTo(0, 4, -22, 0); g.closePath(); };
    cel(g, bag, '#ffc21a', '#e07a10', '#fff0a0', { lw: 2.5, d: 7, r: 2, lx: -0.8, ly: -0.5 });
    g.save(); bag(); g.clip();
    rect(g, -30, -58, 60, 12, '#d6232a');
    g.fillStyle = '#e5362f'; A.ellipse(g, 0, -26, 18, 11); g.fill();
    A.text(g, 'במבה', 0, -26, { font: '900 14px Rubik', fill: '#fff', dir: 'rtl' });
    // baby icon
    g.fillStyle = '#ffe2b8'; A.ellipse(g, 12, -12, 7, 7); g.fill(); g.fillStyle = '#6a3a1a'; g.fillRect(9, -13, 1.6, 1.6); g.fillRect(14, -13, 1.6, 1.6);
    g.restore(); g.restore();
    // teapot (brass Middle-Eastern style) with nana
    const tx = A.LR.teapot.x, ty = y + 2;
    g.save(); g.translate(tx, ty);
    // spout
    g.beginPath(); g.moveTo(10, -14); g.quadraticCurveTo(26, -18, 32, -38); g.lineTo(36, -38); g.quadraticCurveTo(30, -10, 14, -6); g.closePath(); A.fillStroke(g, '#b88a3a', 2.5);
    // handle
    g.beginPath(); g.arc(-18, -22, 11, 1.8, 4.6, true); g.strokeStyle = O; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#8a6020'; g.lineWidth = 3; g.stroke();
    const pot = () => { g.beginPath(); g.moveTo(-16, 0); g.bezierCurveTo(-26, -8, -24, -30, -10, -36); g.lineTo(10, -36); g.bezierCurveTo(24, -30, 26, -8, 16, 0); g.closePath(); };
    cel(g, pot, '#d9a948', '#8a5a1e', '#fff0b0', { lw: 2.5, d: 8, r: 2.5, lx: -0.8, ly: -0.5 });
    g.fillStyle = '#c0902e'; A.rrect(g, -11, -44, 22, 9, 3); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#e8c060'; A.ellipse(g, 0, -47, 4, 3); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,230,0.8)'; A.ellipse(g, -10, -22, 3, 7, 0.3); g.fill();
    // mint sprig poking out of the lid
    g.fillStyle = '#4c9a44'; for (const [lx, ly, a] of [[-4, -50, -0.6], [3, -54, 0.4], [-1, -58, -0.1]]) { g.save(); g.translate(lx, ly); g.rotate(a); A.ellipse(g, 0, 0, 3.5, 6); g.fill(); g.restore(); }
    g.restore();
    // tea glass
    const gx = x + 50, gy = y + 8;
    g.fillStyle = 'rgba(200,120,40,0.85)'; poly(g, [[gx - 8, gy - 22], [gx + 8, gy - 22], [gx + 6, gy], [gx - 6, gy]]); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; poly(g, [[gx - 9, gy - 30], [gx + 9, gy - 30], [gx + 8, gy - 22], [gx - 8, gy - 22]]); g.fill();
    g.strokeStyle = 'rgba(40,20,20,0.8)'; g.lineWidth = 1.5; poly(g, [[gx - 9, gy - 30], [gx + 9, gy - 30], [gx + 6, gy], [gx - 6, gy]]); g.stroke();
    g.fillStyle = '#4c9a44'; A.ellipse(g, gx + 3, gy - 30, 3, 5, 0.5); g.fill();
    g.restore();
  }

  function drawLamp(g) {
    const { x } = A.LR.lamp;
    g.save();
    g.fillStyle = 'rgba(15,4,4,0.45)'; A.ellipse(g, x + 6, 796, 52, 10); g.fill();
    // base
    g.fillStyle = A.linear(g, x - 40, 0, x + 40, 0, [[0, '#fff0b0'], [0.3, '#c89a48'], [1, '#6a4a1a']]); A.ellipse(g, x, 790, 40, 10); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
    // pole
    g.fillStyle = A.linear(g, x - 5, 0, x + 5, 0, [[0, '#ffe7a8'], [0.4, '#c89a48'], [1, '#5e3e14']]); g.fillRect(x - 4, 330, 8, 460);
    g.strokeStyle = O; g.lineWidth = 2; g.strokeRect(x - 4, 330, 8, 460);
    for (const yy of [460, 620]) { g.fillStyle = '#d6a850'; A.ellipse(g, x, yy, 8, 4); g.fill(); g.stroke(); }
    // pull chain
    line(g, x + 30, 336, x + 30, 380, '#c89a48', 1.5); g.fillStyle = '#c89a48'; A.ellipse(g, x + 30, 382, 3, 4); g.fill();
    // shade (glowing fabric)
    const top = 250, bot = 336;
    const shade = () => { g.beginPath(); g.moveTo(x - 52, top); g.lineTo(x + 52, top); g.lineTo(x + 76, bot); g.quadraticCurveTo(x, bot + 10, x - 76, bot); g.closePath(); };
    shade(); g.fillStyle = A.linear(g, x - 76, 0, x + 76, 0, [[0, '#ffcf88'], [0.45, '#fff0c8'], [1, '#e89a58']]); g.fill();
    g.save(); shade(); g.clip();
    for (let i = -8; i <= 8; i++) line(g, x + i * 6.5, top, x + i * 9.5, bot + 8, 'rgba(180,100,40,0.18)', 2);
    g.fillStyle = A.linear(g, 0, top, 0, bot, [[0, 'rgba(160,80,30,0.25)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(255,255,220,0.5)']]); g.fillRect(x - 80, top, 160, bot - top + 12);
    g.restore();
    shade(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    // trims
    g.fillStyle = '#b8662e'; A.ellipse(g, x, top, 52, 5); g.fill(); g.stroke();
    // bottom opening glow
    g.fillStyle = '#fff8dc'; A.ellipse(g, x, bot + 1, 72, 8); g.fill();
    // fringe
    for (let i = -18; i <= 18; i++) { const xx = x + i * 4, yy = bot + 4 + Math.sqrt(Math.max(0, 1 - (i / 19) ** 2)) * 5; line(g, xx, yy, xx, yy + 9, '#c9763a', 1.6); }
    g.restore();
  }

  function drawPouf(g) {
    const { x, y } = A.LR.sofa;
    g.save();
    g.fillStyle = 'rgba(15,4,4,0.5)'; A.ellipse(g, x + 8, y + 82, 112, 18); g.fill();
    const body = () => { g.beginPath(); g.moveTo(x - 94, y + 4); g.bezierCurveTo(x - 112, y + 30, x - 108, y + 66, x - 88, y + 80); g.quadraticCurveTo(x, y + 100, x + 88, y + 80); g.bezierCurveTo(x + 108, y + 66, x + 112, y + 30, x + 94, y + 4); g.closePath(); };
    cel(g, body, '#a8592c', '#6a3016', '#f0a060', { lx: -0.9, ly: -0.3, d: 22, r: 4, lw: 3.5 });
    // stitched embroidery arches
    g.save(); body(); g.clip();
    g.strokeStyle = '#f0c070'; g.lineWidth = 2; g.setLineDash([5, 4]);
    for (let i = -4; i <= 4; i++) { const cx = x + i * 26; g.beginPath(); g.moveTo(cx - 12, y + 88); g.lineTo(cx - 12, y + 44); g.quadraticCurveTo(cx, y + 26, cx + 12, y + 44); g.lineTo(cx + 12, y + 88); g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = '#e05a2a'; for (let i = -4; i <= 4; i++) { A.ellipse(g, x + i * 26, y + 58, 4, 5); g.fill(); }
    g.restore();
    // top cushion
    g.fillStyle = A.radial(g, x - 20, y - 4, 4, 110, [[0, '#d98a4e'], [1, '#8a4420']]); A.ellipse(g, x, y + 4, 96, 22); g.fill(); g.strokeStyle = O; g.lineWidth = 3.5; g.stroke();
    g.strokeStyle = 'rgba(255,200,130,0.6)'; g.lineWidth = 2; g.setLineDash([4, 4]); A.ellipse(g, x, y + 4, 70, 14); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#6a3016'; A.ellipse(g, x, y + 4, 8, 3); g.fill();
    g.restore();
  }

  function drawBigPlant(g) {
    const px = 64, py = 800;
    g.save();
    g.fillStyle = 'rgba(15,4,4,0.5)'; A.ellipse(g, px + 10, py + 6, 70, 12); g.fill();
    // leaves (monstera-ish), back to front
    const leaf = (x0, y0, len, ang, wid, col, sh) => {
      g.save(); g.translate(x0, y0); g.rotate(ang);
      line(g, 0, 0, len * 0.55, 0, '#2a4a22', 3);
      g.translate(len * 0.55, 0);
      const P = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.2, -wid, len * 0.7, -wid * 0.9, len * 0.6, 0); g.bezierCurveTo(len * 0.7, wid * 0.9, len * 0.2, wid, 0, 0); g.closePath(); };
      cel(g, P, col, sh, '#b8d890', { lx: 0.8, ly: -0.6, d: 8, r: 2, lw: 2.5, stroke: '#12240f' });
      // splits
      g.strokeStyle = sh; g.lineWidth = 3;
      for (let k = 1; k < 4; k++) { const tx = len * 0.14 * k; line(g, tx, -wid * 0.3, tx + len * 0.06, -wid * 0.85, 'rgba(40,20,20,0.9)', 2); line(g, tx, wid * 0.3, tx + len * 0.06, wid * 0.85, 'rgba(40,20,20,0.9)', 2); }
      line(g, 0, 0, len * 0.55, 0, 'rgba(210,240,170,0.5)', 1.5);
      g.restore();
    };
    const leaves = [[-2.2, 200, 50], [-1.3, 250, 56], [-1.9, 180, 44], [-0.9, 190, 50], [-2.6, 150, 40], [-1.6, 280, 60], [-0.6, 150, 40], [-1.15, 120, 38]];
    leaves.forEach(([a, len, wid], i) => leaf(px + (i % 3 - 1) * 8, py - 70, len, a, wid, i % 2 ? '#3f7a36' : '#356b30', '#1f4520'));
    // pot
    const pot = () => { g.beginPath(); g.moveTo(px - 56, py - 76); g.lineTo(px + 56, py - 76); g.lineTo(px + 44, py); g.lineTo(px - 44, py); g.closePath(); };
    cel(g, pot, '#c0643a', '#7a3418', '#ffb080', { lx: 0.9, ly: -0.4, d: 14, r: 3, lw: 3 });
    g.fillStyle = '#d87a4a'; g.fillRect(px - 60, py - 84, 120, 14); g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(px - 60, py - 84, 120, 14);
    // painted pattern
    g.strokeStyle = '#f0d0a0'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 9; i++) { g.lineTo(px - 48 + i * 12, py - 44 + (i % 2) * 12); } g.stroke();
    g.restore();
  }

  function drawCurtains(g) {
    const rodY = 58;
    g.save();
    // rod
    g.fillStyle = A.linear(g, 0, rodY - 5, 0, rodY + 5, [[0, '#ffe6a0'], [0.5, '#b8862e'], [1, '#6a4a14']]); g.fillRect(10, rodY - 4, 560, 8);
    for (const fx of [12, 568]) { g.fillStyle = '#d8a848'; A.ellipse(g, fx, rodY, 10, 10); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke(); }
    const curtain = (pts, tie, lightSide) => {
      const P = () => A.blob(g, pts);
      // folds via repeating gradient
      const xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      const n = 7; for (let i = 0; i <= n; i++) { const f = i / n; gr.addColorStop(f, i % 2 ? '#7e4a18' : '#c9923e'); }
      P(); g.fillStyle = gr; g.fill();
      g.save(); P(); g.clip();
      g.fillStyle = A.linear(g, x0, 0, x1, 0, lightSide > 0 ? [[0, 'rgba(40,10,30,0.55)'], [1, 'rgba(255,170,80,0.15)']] : [[0, 'rgba(120,150,230,0.12)'], [1, 'rgba(40,10,30,0.5)']]); g.fillRect(x0, 0, x1 - x0, 800);
      g.fillStyle = A.linear(g, 0, 60, 0, 740, [[0, 'rgba(30,5,20,0.45)'], [0.3, 'rgba(0,0,0,0)'], [1, 'rgba(20,5,10,0.4)']]); g.fillRect(x0, 0, x1 - x0, 800);
      g.restore();
      P(); g.strokeStyle = O; g.lineWidth = 3.5; g.stroke();
      // tie-back
      g.fillStyle = '#e0b04a'; A.rrect(g, tie[0] - 34, tie[1] - 7, 68, 14, 7); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#e0b04a'; A.ellipse(g, tie[0] + 30 * lightSide, tie[1] + 18, 6, 14); g.fill(); g.stroke();
    };
    curtain([[18, rodY + 2], [132, rodY + 2], [118, 250], [96, 430], [124, 600], [134, 738], [10, 738], [4, 600], [34, 430], [8, 250]], [64, 430], -1);
    curtain([[438, rodY + 2], [556, rodY + 2], [566, 250], [548, 430], [572, 600], [574, 738], [446, 738], [462, 600], [488, 430], [454, 250]], [516, 430], 1);
    // valance
    const val = () => { g.beginPath(); g.moveTo(8, rodY - 6); g.lineTo(574, rodY - 6); g.lineTo(574, rodY + 34); for (let i = 8; i >= 0; i--) { const xx = 8 + i * (566 / 8); g.quadraticCurveTo(xx + 566 / 16, rodY + 60, xx, rodY + 34); } g.closePath(); };
    val(); g.fillStyle = A.linear(g, 0, rodY, 0, rodY + 60, [[0, '#9a6424'], [1, '#c9923e']]); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(40,10,30,0.3)'; g.fillRect(8, rodY - 6, 566, 10);
    g.restore();
  }

  function drawSillProps(g) {
    const sy = WIN.y + WIN.h + 4;
    g.save();
    // cactus in a small terracotta pot
    const pot = (x, w, h) => { g.fillStyle = '#c0643a'; poly(g, [[x - w / 2, sy - h], [x + w / 2, sy - h], [x + w / 2 - 5, sy], [x - w / 2 + 5, sy]]); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke(); rect(g, x - w / 2 - 3, sy - h - 6, w + 6, 8, '#d87a4a'); g.strokeRect(x - w / 2 - 3, sy - h - 6, w + 6, 8); };
    const cx = 160;
    g.fillStyle = '#3f7a3a'; A.rrect(g, cx - 10, sy - 78, 20, 60, 10); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
    A.rrect(g, cx + 6, sy - 60, 16, 12, 6); g.fill(); g.stroke(); A.rrect(g, cx + 14, sy - 74, 10, 24, 5); g.fill(); g.stroke();
    g.fillStyle = 'rgba(200,240,170,0.5)'; g.fillRect(cx - 7, sy - 72, 3, 44);
    g.fillStyle = '#ff6a8a'; A.ellipse(g, cx, sy - 80, 5, 4); g.fill();
    pot(cx, 36, 26);
    // mint (nana) pot
    const mx = 404;
    for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (hh(i) - 0.5) * 2.2, r = 18 + hh(i + 3) * 26; g.save(); g.translate(mx + Math.cos(a) * r * 0.8, sy - 34 + Math.sin(a) * r); g.rotate(a + Math.PI / 2); g.fillStyle = i % 2 ? '#4c9a44' : '#3a8036'; A.ellipse(g, 0, 0, 5, 9); g.fill(); g.strokeStyle = '#1c3a18'; g.lineWidth = 1.2; g.stroke(); g.restore(); }
    pot(mx, 40, 28);
    A.text(g, 'נענע', mx, sy - 14, { font: '700 10px Rubik', fill: '#fff2d0', dir: 'rtl' });
    g.restore();
  }

  function drawFrost(g) {
    g.save();
    for (const [x, y, w, h] of PANES) {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
        g.fillStyle = A.radial(g, cx, cy, 0, 90, [[0, 'rgba(225,235,255,0.6)'], [0.4, 'rgba(210,225,255,0.22)'], [1, 'rgba(210,225,255,0)']]); g.fillRect(cx - 90, cy - 90, 180, 180);
      }
      // frost crystals
      const r = A.rng(Math.floor(x + y));
      g.strokeStyle = 'rgba(235,242,255,0.5)'; g.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const corner = [[x, y + h], [x + w, y + h], [x, y], [x + w, y]][i % 4];
        const a = r() * TAU, len = 8 + r() * 22; const sx = corner[0] + (r() - 0.5) * 50, sy = corner[1] + (r() - 0.5) * 50;
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        for (let k = 1; k < 3; k++) { const px = sx + Math.cos(a) * len * k / 3, py = sy + Math.sin(a) * len * k / 3; g.moveTo(px, py); g.lineTo(px + Math.cos(a + 0.7) * 6, py + Math.sin(a + 0.7) * 6); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 0.7) * 6, py + Math.sin(a - 0.7) * 6); }
        g.stroke();
      }
      // glass sheen + lamp reflection
      g.fillStyle = A.linear(g, x, y, x + w, y + h, [[0, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,0.05)'], [0.5, 'rgba(255,255,255,0.10)'], [0.56, 'rgba(255,255,255,0.03)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(x, y, w, h);
      g.restore();
    }
    g.fillStyle = A.radial(g, 420, 330, 0, 60, [[0, 'rgba(255,200,130,0.28)'], [1, 'rgba(255,200,130,0)']]); g.fillRect(360, 270, 120, 120);
    g.restore();
  }

  function roomStatic(g) {
    drawWall(g);
    drawWindowFrame(g);
    drawRadiator(g);
    drawPhoto(g);
    drawHamsa(g);
    drawPennant(g);
    drawBookshelf(g);
    drawFloor(g);
    // cold window light on the floor (with mullion shadows)
    g.save(); g.globalCompositeOperation = 'lighter';
    const wl = (a, b, c, d, al) => { g.fillStyle = `rgba(110,140,230,${al})`; poly(g, [a, b, c, d]); g.fill(); };
    wl([150, 752], [300, 752], [420, 860], [230, 860], 0.07); wl([318, 752], [470, 752], [630, 860], [440, 860], 0.07);
    g.restore();
    drawRug(g);
    drawCabinet(g);
    drawFlagCup(g);
    drawLamp(g);
    drawSideTable(g);
    drawPouf(g);
    // global lighting: lamp key (warm) vs cool dark falloff; windows excluded
    g.save();
    g.beginPath(); g.rect(0, 0, 1920, 1080); for (const [x, y, w, h] of PANES) g.rect(x, y, w, h); g.clip('evenodd');
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = A.radial(g, 600, 330, 60, 1500, [[0, '#ffffff'], [0.3, '#f4e2d8'], [0.62, '#a896ae'], [1, '#4c4670']]); g.fillRect(0, 0, 1920, 1080);
    g.fillStyle = A.linear(g, 0, 860, 0, 1080, [[0, '#ffffff'], [1, '#6a5a78']]); g.fillRect(0, 860, 1920, 220);
    g.fillStyle = A.linear(g, 0, 0, 0, 140, [[0, '#7a6a90'], [1, '#ffffff']]); g.fillRect(0, 0, 1920, 140);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = A.radial(g, 600, 300, 0, 760, [[0, 'rgba(255,160,80,0.34)'], [0.4, 'rgba(255,140,70,0.12)'], [1, 'rgba(255,140,70,0)']]); g.fillRect(0, 0, 1500, 1080);
    // light pool under the lamp on the floor
    g.save(); g.translate(640, 820); g.scale(1, 0.3); g.fillStyle = A.radial(g, 0, 0, 0, 420, [[0, 'rgba(255,170,90,0.22)'], [1, 'rgba(255,170,90,0)']]); g.fillRect(-420, -420, 840, 840); g.restore();
    g.restore();
  }

  function winFront(g) {
    drawCurtains(g);
    drawSillProps(g);
    drawFrost(g);
    drawBigPlant(g);
    // match room lighting on these front props (source-atop keeps it on painted pixels only)
    g.save(); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = A.linear(g, 0, 0, 0, 820, [[0, 'rgba(40,20,60,0.35)'], [0.3, 'rgba(40,20,60,0.05)'], [0.8, 'rgba(40,20,60,0.1)'], [1, 'rgba(30,15,40,0.4)']]); g.fillRect(0, 0, 600, 820);
    g.restore();
  }

  function parseGlow(v) {
    if (v == null) return { c: '#9ff5d0', a: 1 };
    if (typeof v === 'number') return { c: '#9ff5d0', a: v };
    if (typeof v === 'string') return { c: v, a: 1 };
    return { c: v.color || '#9ff5d0', a: v.intensity ?? v.a ?? 1 };
  }

  // A.drawLivingRoom(ctx, t, o): o.tvGlow (number | colour | {color,intensity}), o.flash 0..1, o.lamp (0..1.5 lamp intensity),
  // o.snow (true), o.steam (true)
  A.drawLivingRoom = (ctx, t, o = {}) => {
    const r = resFor(ctx);
    const room = hl('room', 1920, 1080, r, roomStatic);
    const wf = hl('winfront', 600, 820, r, winFront);
    ctx.save();
    ctx.drawImage(room, 0, 0, 1920, 1080);
    // live exterior details: CN tower beacon, snow
    ctx.save(); ctx.beginPath(); for (const [x, y, w, h] of PANES) ctx.rect(x, y, w, h); ctx.clip();
    cnTowerLive(ctx, WIN.x + 292, WIN.y + 470, 400, t, 0.9);
    if (o.snow !== false) {
      A.drawSnow(ctx, t, { rect: WIN, count: 70, depth: [0, 0.35], size: 0.8, wind: 0.5, seed: 3 });
      A.drawSnow(ctx, t, { rect: WIN, count: 26, depth: [0.5, 0.8], size: 0.8, wind: 0.5, seed: 4, alpha: 0.9 });
    }
    ctx.restore();
    ctx.drawImage(wf, 0, 0, 600, 820);
    // lamp: breathing warm glow
    const li = (o.lamp ?? 1) * (0.95 + 0.05 * A.noise1(t * 2.3));
    A.glow(ctx, 600, 300, 230, '#ffb45e', 0.42 * li);
    A.glow(ctx, 600, 330, 90, '#fff2c8', 0.5 * li);
    // TV light spill
    const tg = parseGlow(o.tvGlow), tv = A.LR.tv;
    if (tg.a > 0) {
      const fl = 0.9 + 0.1 * A.noise1(t * 7);
      A.glow(ctx, tv.x + tv.w / 2, tv.y + tv.h / 2, 520, tg.c, 0.2 * tg.a * fl);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12 * tg.a * fl;
      ctx.translate(tv.x + tv.w / 2, 870); ctx.scale(1, 0.18); ctx.fillStyle = A.radial(ctx, 0, 0, 0, 500, [[0, tg.c], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-500, -500, 1000, 1000);
      ctx.restore();
      // cool rim on cabinet top
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * tg.a; ctx.fillStyle = tg.c; ctx.fillRect(1180, 640, 590, 2); ctx.restore();
    }
    // teapot steam
    if (o.steam !== false) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.45 + i / 7) % 1, x0 = A.LR.teapot.x + 35, y0 = A.LR.teapot.y - 40;
        const x = x0 + Math.sin(t * 1.3 + i * 2.1) * 8 * ph + ph * 10, y = y0 - ph * 90;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.16;
        ctx.fillStyle = A.radial(ctx, x, y, 0, 8 + ph * 18, [[0, '#fff6e8'], [1, 'rgba(255,246,232,0)']]);
        ctx.fillRect(x - 30, y - 30, 60, 60);
      }
      ctx.restore();
    }
    if (o.flash) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = cl(o.flash) * 0.6;
      ctx.fillStyle = A.radial(ctx, 960, 480, 0, 1300, [[0, '#fff6e0'], [1, '#ffcf80']]); ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    }
    ctx.restore();
  };

  // ======================================================================================================
  // ARMCHAIR — wing-back teal velvet, three-quarter view facing right (toward the TV).
  // (x,y) = seat contact; seat ≈ 250 px wide at s = 1. layer 'back' (before Saba) / 'front' (after Saba).
  // ======================================================================================================
  const CH = { base: '#2f6f6c', shade: '#1a4046', rim: '#e8b27a', top: '#4a9486', dark: '#122c33', leg: '#3a2216' };
  A.drawArmchair = (ctx, x, y, s = 1, layer = 'back') => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx, lw = 4;
    if (layer === 'back') {
      // floor shadow
      g.fillStyle = A.radial(g, 0, 118, 0, 230, [[0, 'rgba(12,4,6,0.6)'], [1, 'rgba(12,4,6,0)']]);
      g.save(); g.translate(0, 118); g.scale(1, 0.22); g.fillRect(-240, -240, 480, 480); g.restore();
      // back legs
      for (const [lx, ly] of [[-170, 124], [168, 88]]) { g.fillStyle = CH.leg; poly(g, [[lx - 7, ly - 30], [lx + 7, ly - 30], [lx + 4, ly], [lx - 4, ly]]); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke(); }
      // front face of seat base (behind legs of the sitter)
      const baseF = () => { g.beginPath(); g.moveTo(40, 30); g.lineTo(178, -18); g.quadraticCurveTo(186, 20, 180, 60); g.lineTo(50, 112); g.quadraticCurveTo(38, 70, 40, 30); g.closePath(); };
      cel(g, baseF, '#285e5c', CH.dark, null, { lx: -0.6, ly: -0.8, d: 14, lw });
      // skirt welt + pleats
      g.strokeStyle = 'rgba(160,220,200,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(48, 80); g.lineTo(180, 32); g.stroke();
      // backrest (wing back)
      const back = () => A.blob(g, [[-205, 30], [-222, -120], [-210, -240], [-176, -300], [-120, -338], [-66, -346], [-34, -322], [-30, -250], [-44, -150], [-40, -40], [-60, 20]]);
      cel(g, back, CH.base, CH.shade, CH.rim, { lx: -0.7, ly: -0.7, d: 16, r: 5, lw });
      // inner cushion face
      const face = () => A.blob(g, [[-176, 10], [-190, -120], [-176, -240], [-140, -296], [-92, -318], [-60, -300], [-58, -220], [-66, -120], [-62, -10], [-110, 16]]);
      g.save(); face(); g.fillStyle = A.linear(g, -190, -300, -60, 0, [[0, '#3f8a80'], [0.5, '#2f6f6c'], [1, '#1d4a4c']]); g.fill();
      g.clip();
      // tufting: diamond creases + buttons
      g.strokeStyle = 'rgba(10,30,34,0.45)'; g.lineWidth = 2.5;
      for (let i = -6; i <= 6; i++) { line(g, -200 + i * 40, -330, -60 + i * 40, 30, 'rgba(10,30,34,0.4)', 2); line(g, -60 + i * 40, -330, -200 + i * 40, 30, 'rgba(10,30,34,0.4)', 2); }
      for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
        const bx = -170 + c * 36 + (r % 2) * 18 + r * 4, by = -270 + r * 48; if (bx > -60) continue;
        g.fillStyle = '#16363a'; A.ellipse(g, bx, by, 4.5, 4); g.fill(); g.fillStyle = 'rgba(170,230,210,0.5)'; A.ellipse(g, bx - 1, by - 1.5, 1.8, 1.5); g.fill();
      }
      g.fillStyle = A.linear(g, -60, 0, -180, 0, [[0, 'rgba(8,20,24,0.5)'], [1, 'rgba(8,20,24,0)']]); g.fillRect(-200, -340, 150, 380);
      g.restore();
      face(); g.strokeStyle = 'rgba(26,19,48,0.6)'; g.lineWidth = 2.5; g.stroke();
      // lace doily on top of the backrest (antimacassar)
      g.save();
      g.beginPath(); g.moveTo(-178, -300); g.quadraticCurveTo(-120, -352, -62, -344);
      for (let i = 0; i <= 9; i++) { const f = i / 9; const px = L(-62, -178, f), py = L(-300, -262, f) + Math.sin(f * Math.PI) * 18; g.quadraticCurveTo(px + 6, py + 12, px, py); }
      g.closePath(); g.fillStyle = 'rgba(248,240,225,0.95)'; g.fill(); g.strokeStyle = 'rgba(120,100,90,0.8)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(160,130,110,0.45)'; for (let i = 0; i < 12; i++) { A.ellipse(g, -160 + i * 8.5, -300 + Math.sin(i / 11 * Math.PI) * 14 - i * 1.5 + 6, 2.2, 2.2); g.fill(); }
      g.restore();
      // far arm (inner face toward the seat + roll on top)
      const farArm = () => A.blob(g, [[-60, -120], [60, -108], [150, -98], [186, -84], [190, -40], [176, -10], [60, -30], [-50, -52]]);
      cel(g, farArm, '#2a6563', CH.dark, null, { lx: -0.5, ly: -0.86, d: 14, lw });
      const farRoll = () => A.blob(g, [[-62, -126], [60, -118], [160, -104], [196, -94], [196, -72], [150, -82], [60, -96], [-58, -106]]);
      cel(g, farRoll, CH.top, CH.base, '#9fd8c0', { lx: -0.3, ly: -0.95, d: 6, r: 2.5, lw: 3 });
      g.fillStyle = '#2a6563'; A.ellipse(g, 188, -62, 16, 34, -0.15); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(160,220,200,0.45)'; g.lineWidth = 2; A.ellipse(g, 188, -62, 8, 20, -0.15); g.stroke();
      // crochet blanket draped over the far arm (granny squares)
      g.save();
      const bl = () => { g.beginPath(); g.moveTo(40, -122); g.lineTo(120, -110); g.quadraticCurveTo(130, -60, 122, -24); g.lineTo(96, -20); g.lineTo(82, -8); g.lineTo(64, -30); g.lineTo(44, -28); g.quadraticCurveTo(48, -80, 40, -122); g.closePath(); };
      bl(); g.fillStyle = '#e8d6b4'; g.fill(); g.clip();
      const sq = ['#d8563a', '#e8b42a', '#3a7ab8', '#6a9a4a', '#b8487a'];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) { const cx = 42 + i * 18, cy = -122 + j * 18; g.fillStyle = sq[(i * 3 + j) % 5]; g.fillRect(cx + 3, cy + 3, 12, 12); g.fillStyle = '#f4ead2'; g.fillRect(cx + 6, cy + 6, 6, 6); }
      g.fillStyle = 'rgba(20,10,20,0.25)'; g.fillRect(90, -130, 50, 120);
      g.restore(); bl(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
      // seat cushion
      const seat = () => A.blob(g, [[-172, 14], [-80, -46], [60, -48], [170, -28], [186, -8], [80, 40], [40, 56], [-120, 34]]);
      cel(g, seat, '#3a807a', '#224e50', '#bfe6d0', { lx: -0.4, ly: -0.9, d: 10, r: 3, lw });
      // cushion front welt (thickness)
      const welt = () => { g.beginPath(); g.moveTo(40, 56); g.lineTo(186, -8); g.lineTo(184, 16); g.lineTo(44, 80); g.closePath(); };
      cel(g, welt, '#2a6563', CH.dark, null, { d: 6, lw: 3 });
      g.strokeStyle = 'rgba(190,240,220,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(44, 58); g.lineTo(184, -6); g.stroke();
    } else {
      // near arm: outer side face + rolled top + scroll front, then front legs
      const side = () => { g.beginPath(); g.moveTo(-214, -40); g.bezierCurveTo(-120, -44, -20, -30, 58, -14); g.lineTo(62, 118); g.bezierCurveTo(-30, 106, -120, 96, -206, 92); g.closePath(); };
      cel(g, side, '#2c6866', CH.dark, CH.rim, { lx: -0.9, ly: -0.3, d: 18, r: 5, lw });
      // piping & skirt pleats along the bottom
      g.save(); side(); g.clip();
      g.strokeStyle = 'rgba(160,220,200,0.35)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-210, 60); g.bezierCurveTo(-120, 64, -30, 74, 60, 86); g.stroke();
      for (let i = 0; i < 9; i++) { const px = -190 + i * 28; line(g, px, 64 + i * 2.6, px + 1, 110, 'rgba(8,24,28,0.35)', 2); }
      g.fillStyle = A.linear(g, 0, -40, 0, 118, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(8,20,24,0.45)']]); g.fillRect(-220, -50, 290, 180);
      g.restore();
      const roll = () => { g.beginPath(); g.moveTo(-218, -58); g.bezierCurveTo(-120, -64, -20, -52, 60, -36); g.quadraticCurveTo(76, -22, 60, -8); g.bezierCurveTo(-20, -24, -120, -34, -214, -30); g.quadraticCurveTo(-228, -44, -218, -58); g.closePath(); };
      cel(g, roll, CH.top, CH.base, '#ffd2a0', { lx: -0.5, ly: -0.86, d: 7, r: 3, lw });
      // scroll front of the near arm
      const scroll = () => A.blob(g, [[44, -36], [80, -44], [96, -10], [92, 60], [82, 112], [58, 120], [48, 60], [46, -10]]);
      cel(g, scroll, '#2f6f6c', CH.dark, '#a8e2cc', { lx: -0.3, ly: -0.95, d: 10, r: 3, lw });
      g.strokeStyle = 'rgba(170,230,210,0.55)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(72, -18, 12, 14, 0, Math.PI * 0.9, Math.PI * 2.6); g.stroke();
      g.strokeStyle = 'rgba(8,24,28,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(72, 0); g.quadraticCurveTo(66, 60, 70, 110); g.stroke();
      // front legs
      for (const [lx, ly] of [[-196, 128], [66, 150]]) { g.fillStyle = CH.leg; poly(g, [[lx - 8, ly - 32], [lx + 8, ly - 32], [lx + 4, ly], [lx - 4, ly]]); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c89a48'; g.fillRect(lx - 4.5, ly - 6, 9, 5); }
    }
    ctx.restore();
  };

  // ======================================================================================================
  // TV BROADCAST — Maccabi Tel Aviv (yellow) vs Hapoel (red). Designed in a 1920×1080 reference space.
  // ======================================================================================================
  const KIT = {
    mac: { shirt: '#ffd21f', shade: '#d49a0a', shorts: '#1f4fbf', socks: '#ffd21f', hair: '#2a1a12' },
    hap: { shirt: '#e3262e', shade: '#9a1219', shorts: '#f4f4f4', socks: '#e3262e', hair: '#1a1210' },
    gk: { shirt: '#3ee07a', shade: '#1a9a48', shorts: '#1b1b24', socks: '#3ee07a', hair: '#3a2210' },
  };
  const SKIN = ['#c98f65', '#8a5a3a', '#e0b08a', '#6a4028', '#d9a57c'];

  // player tracks: [mt, [X, Z]] keyframes (X along pitch toward the right goal at 52.5, Z across 0..68)
  const TR = {
    S: [[-9, [6, 30]], [-1.3, [15, 28]], [-0.4, [19.5, 27]], [0, [22.5, 27.5]], [1.35, [36.2, 30.4]], [1.5, [36.9, 30.6]], [1.9, [37.8, 30.9]], [2.3, [39.5, 29]], [5, [49, 9]]],
    m1: [[-9, [-6, 42]], [-4.5, [-2, 44]], [-2.8, [3, 42]], [0, [16, 44]], [1.5, [30, 42]], [2.2, [36, 38]], [5, [47, 12]]],
    m2: [[-9, [2, 18]], [-6, [5, 16]], [-1.3, [9, 16]], [0, [17, 14]], [1.5, [29, 17]], [2.2, [34, 18]], [5, [46, 8]]],
    m3: [[-9, [10, 50]], [-5, [12, 52]], [-1.3, [11, 47]], [0, [14, 48]], [2, [22, 50]], [5, [38, 20]]],
    m4: [[-9, [-14, 30]], [0, [-6, 32]], [5, [8, 30]]],
    d1: [[-9, [14, 34]], [-1.3, [18, 32]], [0, [19, 32.5]], [1.35, [31.5, 33.5]], [1.6, [33.5, 33.5]], [2.2, [37.5, 33]], [5, [40, 32]]],
    d2: [[-9, [24, 40]], [0, [38, 38]], [1.3, [38.5, 33]], [1.55, [38.9, 31.8]], [2.2, [39.2, 31.4]], [5, [40, 33]]],
    d3: [[-9, [20, 18]], [0, [30, 16]], [1.5, [36, 22]], [2.2, [38, 24]], [5, [41, 26]]],
    d4: [[-9, [8, 44]], [-3, [12, 42]], [0, [18, 40]], [1.5, [26, 40]], [5, [30, 38]]],
    d5: [[-9, [4, 24]], [-2, [8, 22]], [0, [12, 22]], [5, [20, 24]]],
    gk: [[-9, [51.3, 34]], [0, [50.5, 33.4]], [1.4, [48.6, 32.6]], [1.55, [48.6, 32.8]], [5, [48.6, 32.8]]],
  };
  const pos = (id, mt) => A.key(mt, TR[id], 'inOut');
  const PL = [['S', 'mac', 9], ['m1', 'mac', 7], ['m2', 'mac', 10], ['m3', 'mac', 8], ['m4', 'mac', 6], ['d1', 'hap', 4], ['d2', 'hap', 5], ['d3', 'hap', 3], ['d4', 'hap', 8], ['d5', 'hap', 6], ['gk', 'gk', 1]];
  // passing sequence before the breakaway
  const PASS = [[-9.5, 'm4', 'm1'], [-7.8, 'm1', 'm2'], [-6.2, 'm2', 'm3'], [-4.6, 'm3', 'm1'], [-3.0, 'm1', 'm2'], [-1.5, 'm2', 'S']];
  const GOALT = 1.9, STRIKE = 1.5;
  const NET = [53.2, 1.95, 36.6];

  function ballPos(mt) {
    if (mt < STRIKE) {
      // who has it / is it travelling
      for (let i = PASS.length - 1; i >= 0; i--) {
        const [t0, a, b] = PASS[i];
        if (mt >= t0) {
          const dur = 0.9;
          if (mt < t0 + dur) { const p = (mt - t0) / dur, pa = pos(a, t0), pb = pos(b, t0 + dur); const e = A.ease.out(p); return [L(pa[0] + 0.6, pb[0] - 0.4, e), Math.sin(p * Math.PI) * (i === PASS.length - 1 ? 2.2 : 0.3) + 0.11, L(pa[1], pb[1], e)]; }
          const who = b, pp = pos(who, mt), pv = pos(who, mt + 0.1);
          const dx = pv[0] - pp[0], dz = pv[1] - pp[1], sp = Math.hypot(dx, dz) * 10;
          const lead = who === 'S' ? 0.9 + 0.35 * Math.abs(Math.sin(mt * 5)) : 0.6;
          const n = Math.max(0.01, Math.hypot(dx, dz));
          return [pp[0] + (sp > 0.5 ? dx / n : 1) * lead, 0.11, pp[1] + (sp > 0.5 ? dz / n : 0) * lead];
        }
      }
      const p = pos('m4', mt); return [p[0] + 0.6, 0.11, p[1]];
    }
    const s = pos('S', STRIKE); const b0 = [s[0] + 0.9, 0.11, s[1] + 0.1];
    if (mt < GOALT) { const p = (mt - STRIKE) / (GOALT - STRIKE); return [L(b0[0], NET[0], p), L(b0[1], NET[1], p) + Math.sin(p * Math.PI) * 0.8, L(b0[2], NET[2], p) + Math.sin(p * Math.PI) * 0.6]; }
    const q = mt - GOALT;
    const bx = NET[0] + 0.9 * A.ease.out(cl(q / 0.18)), by = Math.max(0.11, NET[1] - 9.8 * Math.max(0, q - 0.15) ** 2 * 0.5);
    const bounce = by <= 0.11 ? Math.abs(Math.sin((q - 0.75) * 9)) * Math.exp(-(q - 0.75) * 3) * 0.4 : 0;
    return [bx, by + bounce, NET[2] + 0.2 * cl(q / 0.3)];
  }

  function makeCam(mt, goalZoom) {
    // broadcast camera on the halfway gantry, panning to follow the play
    const T = A.key(mt, [[-9, [8, 30]], [-1.5, [17, 30]], [0, [29, 30]], [1.4, [42.5, 32]], [2.2, [45, 33]], [3.5, [46, 27]], [6, [47, 20]]], 'inOut');
    const fov = A.key(mt, [[-9, 54], [0, 40], [1.4, 31], [2.0, 30], [3, 26 - goalZoom * 2]], 'inOut');
    const C = { x: 0, y: 24, z: -40 };
    const dx = T[0] - C.x, dz = T[1] - C.z, yaw = Math.atan2(dx, dz), dist = Math.hypot(dx, dz), tilt = Math.atan2(C.y, dist);
    const F = 1920 * dist / fov, cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    return {
      F, P(X, Y, Z) { const ax = X - C.x, ay = Y - C.y, az = Z - C.z; const x1 = ax * cy - az * sy, z1 = ax * sy + az * cy; const y2 = ay * ct + z1 * st, z2 = -ay * st + z1 * ct; return [960 + F * x1 / z2, 600 - F * y2 / z2, z2]; },
    };
  }

  function drawPlayer(g, sx, sy, k, kit, o) {
    const u = k * 0.1 * 1.35; // 0.1 m units, exaggerated for readability
    g.save(); g.translate(sx, sy);
    g.fillStyle = 'rgba(10,40,10,0.35)'; A.ellipse(g, 0, 0, 5.5 * u, 1.3 * u); g.fill();
    if (o.lie) { g.translate(0, -1.5 * u); g.rotate(o.face > 0 ? -1.45 : 1.45); g.translate(0, 0); }
    if (o.dive) { const d = o.dive; g.translate(o.face * d * 6 * u, -d * 9 * u * (1 - Math.max(0, d - 0.7) * 2)); g.rotate(-o.face * d * 1.35); }
    g.scale(o.face || 1, 1);
    const run = o.run || 0, ph = o.ph || 0, sw = Math.sin(ph);
    const hipY = -9 * u, lw = Math.max(1, u * 0.45);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const limb = (x0, y0, a1, l1, a2, l2, c1, c2, w, foot) => {
      const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      g.strokeStyle = O; g.lineWidth = w + lw * 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = c1; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = c2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      if (foot) { g.fillStyle = '#16161c'; A.ellipse(g, x2 + 0.7 * u, y2, 1.3 * u, 0.7 * u); g.fill(); }
    };
    // legs
    let aF = sw * 0.85 * run, kF = run * (0.25 + 0.9 * Math.max(0, Math.sin(ph + 1.8)));
    let aB = -sw * 0.85 * run, kB = run * (0.25 + 0.9 * Math.max(0, Math.sin(ph + 1.8 + Math.PI)));
    if (o.kick != null) { const kk = o.kick; aF = L(-1.1, 1.5, A.ease.inOut(kk)); kF = L(1.6, 0.05, cl(kk * 1.6)); aB = -0.15; kB = 0.1; }
    if (o.celebrate) { aF = 0.4; aB = -0.5; kF = 0.3; kB = 0.6; }
    limb(-0.6 * u, hipY, aB, 4.6 * u, aB - kB, 4.6 * u, kit.shade, kit.socks, 1.7 * u, true);
    limb(0.6 * u, hipY, aF, 4.6 * u, aF - kF, 4.6 * u, kit.shade === KIT.hap.shade ? '#e8e8e8' : kit.shorts, kit.socks, 1.7 * u, true);
    // torso
    g.save(); g.translate(0, hipY); g.rotate(o.kick != null ? -0.25 : (o.lean ?? run * 0.22));
    // back arm
    const armA = o.arms ? -2.7 : o.kick != null ? -1.6 : -sw * 0.9 * run - 0.1;
    limb(0, -5.8 * u, -armA - (o.arms ? 0.3 : 0), 2.8 * u, -armA * 1.1 - 0.4, 2.8 * u, kit.shade, SKIN[o.skin], 1.3 * u, false);
    g.fillStyle = kit.shorts; A.rrect(g, -2.6 * u, -1.4 * u, 5.2 * u, 3 * u, 0.8 * u); g.fill(); g.strokeStyle = O; g.lineWidth = lw; g.stroke();
    g.fillStyle = kit.shirt; A.rrect(g, -2.5 * u, -7.2 * u, 5 * u, 6.4 * u, 1.6 * u); g.fill(); g.stroke();
    g.fillStyle = kit.shade; g.fillRect(-2.5 * u, -7 * u, 1.3 * u, 6 * u);
    if (o.num && u > 1.4) A.text(g, String(o.num), 0.2 * u, -4.2 * u, { font: `800 ${3.2 * u}px Rubik`, fill: kit === KIT.mac ? '#1f4fbf' : '#fff' });
    // head
    g.fillStyle = SKIN[o.skin]; A.ellipse(g, 0.3 * u, -9.4 * u, 1.9 * u, 2 * u); g.fill(); g.stroke();
    g.fillStyle = kit.hair; g.beginPath(); g.ellipse(0.1 * u, -10.2 * u, 1.95 * u, 1.3 * u, 0, Math.PI * 1.05, Math.PI * 2.05); g.fill();
    // front arm
    limb(0, -5.8 * u, armA, 2.8 * u, armA * 1.1 + (o.arms ? 0 : 0.5), 2.8 * u, kit.shirt, SKIN[o.skin], 1.3 * u, false);
    g.restore();
    g.restore();
  }

  // crowd: fans on a raked stand, drawn in batches by colour
  const FANC = ['#ffd21f', '#ffd21f', '#1f4fbf', '#ffd21f', '#f4f4f4', '#1f4fbf', '#2a2a3a', '#ffe36a', '#1a3a9a', '#ffd21f'];
  function drawCrowd(g, cam, tt, excite) {
    const W = 1920;
    // stand structure (far side + behind the goal)
    const quad = (ps, c) => { g.beginPath(); ps.forEach((p, i) => { const s = cam.P(...p); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath(); g.fillStyle = c; g.fill(); };
    quad([[-70, 0, 70], [80, 0, 70], [80, 40, 110], [-70, 40, 110]], '#191633');
    quad([[57, 0, -20], [57, 0, 88], [95, 40, 88], [95, 40, -20]], '#15122c');
    const batches = FANC.map(() => []), heads = [], arms = [];
    const add = (X, Y, Z, i) => {
      const p = cam.P(X, Y, Z); if (p[2] < 2 || p[0] < -30 || p[0] > W + 30 || p[1] < -40 || p[1] > 700) return;
      const k = cam.F / p[2], ci = Math.floor(hh(i * 1.7) * FANC.length);
      const red = X < -30 && Z > 60 || (X > 57 && Z < 5);
      const jump = excite * Math.max(0, Math.sin(tt * (7 + hh(i) * 3) + hh(i + 4) * 6)) * 0.6 + (1 - excite) * Math.max(0, Math.sin(tt * 2 + hh(i) * 20)) * 0.06;
      const w = 0.55 * k, h = 0.75 * k, y = p[1] - jump * k;
      (red ? batches[6] : batches[ci]).push([p[0] - w / 2, y - h, w, h]);
      if (red) batches[6][batches[6].length - 1].red = 1;
      heads.push([p[0] - w * 0.35, y - h - w * 0.62, w * 0.7, w * 0.62]);
      if (excite > 0.3 && hh(i + 2) > 0.4) arms.push([p[0] - w * 0.6, y - h - w * 1.2, w * 0.2, w * 0.9, ci], [p[0] + w * 0.4, y - h - w * 1.2, w * 0.2, w * 0.9, ci]);
    };
    let i = 0;
    for (let r = 0; r < 26; r++) { const Y = 0.9 + r * 0.95, Z = 71 + r * 1.05; for (let X = -62; X < 58; X += 0.95) add(X + (r % 2) * 0.45, Y, Z, i++); }
    for (let r = 0; r < 24; r++) { const Y = 0.9 + r * 0.95, X = 58.5 + r * 1.05; for (let Z = -10; Z < 86; Z += 0.95) add(X, Y, Z + (r % 2) * 0.45, i++); }
    const reds = [];
    batches.forEach((b, ci) => { g.beginPath(); let any = 0; for (const f of b) { if (f.red) { reds.push(f); continue; } g.rect(f[0], f[1], f[2], f[3]); any = 1; } if (any) { g.fillStyle = FANC[ci]; g.fill(); } });
    g.beginPath(); for (const f of reds) g.rect(f[0], f[1], f[2], f[3]); g.fillStyle = '#c8202a'; g.fill();
    g.beginPath(); for (const f of heads) g.rect(f[0], f[1], f[2], f[3]); g.fillStyle = '#b07a58'; g.fill();
    if (arms.length) { g.beginPath(); for (const f of arms) g.rect(f[0], f[1], f[2], f[3]); g.fillStyle = '#ffd21f'; g.fill(); }
    // shade toward the back/top of the stand (roof shadow)
    const top = cam.P(0, 26, 98)[1];
    g.fillStyle = A.linear(g, 0, top - 60, 0, top + 200, [[0, 'rgba(8,6,20,0.85)'], [1, 'rgba(8,6,20,0)']]); g.fillRect(0, -10, W, top + 210);
    // big waving flags
    for (let f = 0; f < 5; f++) {
      const X = -30 + f * 19, base = cam.P(X, 6 + (f % 2) * 4, 76 + (f % 2) * 4); if (base[2] < 2 || base[0] < -300 || base[0] > W + 300) continue;
      const k = cam.F / base[2], fw = 5 * k, fh = 3.2 * k, wv = tt * 5 + f;
      g.save(); g.translate(base[0], base[1] - (excite * Math.abs(Math.sin(tt * 6 + f))) * k * 0.8);
      line(g, 0, 0, 0, -fh * 1.4, '#ddd', Math.max(1, k * 0.12));
      g.beginPath(); g.moveTo(0, -fh * 1.4);
      for (let j = 1; j <= 8; j++) { const q = j / 8; g.lineTo(q * fw, -fh * 1.4 + Math.sin(wv + q * 4) * k * 0.35 * q); }
      for (let j = 8; j >= 0; j--) { const q = j / 8; g.lineTo(q * fw, -fh * 0.4 + Math.sin(wv + q * 4) * k * 0.35 * q); }
      g.closePath(); g.fillStyle = f % 2 ? '#1f4fbf' : '#ffd21f'; g.fill();
      g.strokeStyle = f % 2 ? '#ffd21f' : '#1f4fbf'; g.lineWidth = Math.max(1, k * 0.35); g.beginPath(); g.moveTo(0, -fh * 0.9); for (let j = 1; j <= 8; j++) { const q = j / 8; g.lineTo(q * fw, -fh * 0.9 + Math.sin(wv + q * 4) * k * 0.35 * q); } g.stroke();
      g.restore();
    }
    // camera flashes when excited
    if (excite > 0.05) for (let j = 0; j < 40; j++) { const on = hh(j * 3.3 + Math.floor(tt * 12)) > 0.8; if (!on) continue; const x = hh(j) * W, y = 40 + hh(j + 1) * (top + 150); A.glow(g, x, y, 22, '#ffffff', 0.8 * excite); }
  }

  function drawBoards(g, cam, tt, goalFlash) {
    const texts = ['IPTV·IL', 'במבה', 'מכבי', 'TORONTO ♥ TLV', 'שידור חי', 'IPTV·IL', 'פלאפל', 'GO MACCABI'];
    const cols = [['#0d1b5e', '#ffd21f'], ['#ffcc00', '#d6232a'], ['#1f4fbf', '#fff'], ['#111', '#5fe8ff'], ['#c8202a', '#fff'], ['#0d1b5e', '#ffd21f'], ['#2a7a3a', '#fff'], ['#ffd21f', '#1f4fbf']];
    const board = (a, b, c, i) => { // a=bottom-left, b=bottom-right, c=top-left (world)
      const pa = cam.P(...a), pb = cam.P(...b), pc = cam.P(...c); if (pa[2] < 2 || pb[2] < 2) return;
      if (Math.max(pa[0], pb[0]) < -50 || Math.min(pa[0], pb[0]) > 1970) return;
      const pd = cam.P(b[0] + c[0] - a[0], b[1] + c[1] - a[1], b[2] + c[2] - a[2]);
      const k = (i + Math.floor(tt * 0.4)) % texts.length, [bg, fg] = goalFlash > 0 ? (Math.floor(tt * 8) % 2 ? ['#ffd21f', '#1f4fbf'] : ['#1f4fbf', '#ffd21f']) : cols[k];
      g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.lineTo(pd[0], pd[1]); g.lineTo(pc[0], pc[1]); g.closePath(); g.fillStyle = bg; g.fill();
      g.save(); g.clip();
      // affine map text box (0..1 x 0..1) to board
      g.transform((pb[0] - pa[0]), (pb[1] - pa[1]), (pc[0] - pa[0]), (pc[1] - pa[1]), pa[0], pa[1]);
      g.scale(1 / 100, 1 / 20);
      A.text(g, goalFlash > 0 ? 'גול! GOAL!' : texts[k], 50, -10, { font: '900 15px Rubik', fill: fg, dir: /[֐-׿]/.test(texts[k]) || goalFlash > 0 ? 'rtl' : 'ltr' });
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(pc[0], pc[1]); g.lineTo(pd[0], pd[1]); g.lineTo(pd[0], pd[1] + 2); g.lineTo(pc[0], pc[1] + 2); g.fill();
    };
    for (let i = 0; i < 16; i++) { const X = -64 + i * 8; board([X, 0, 69.5], [X + 8, 0, 69.5], [X, 1.0, 69.5], i); }
    for (let i = 0; i < 12; i++) { const Z = -8 + i * 8; board([56.5, 0, Z + 8], [56.5, 0, Z], [56.5, 1.0, Z + 8], i + 3); }
  }

  function drawPitch(g, cam) {
    const W = 1920;
    // grass base
    g.fillStyle = '#358a34'; g.fillRect(0, 0, W, 1080);
    // mowing stripes (bands across the pitch length)
    for (let i = 0; i < 24; i++) {
      if (i % 2) continue;
      const X0 = -60 + i * 5, X1 = X0 + 5; const ps = [[X0, 0, -6], [X1, 0, -6], [X1, 0, 70], [X0, 0, 70]].map(p => cam.P(...p));
      if (ps.some(p => p[2] < 1)) continue;
      g.beginPath(); ps.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = '#44a142'; g.fill();
    }
    // grass texture shimmer + depth haze toward the far side
    const far = cam.P(30, 0, 70)[1], near = cam.P(30, 0, 0)[1];
    g.fillStyle = A.linear(g, 0, far, 0, Math.min(1080, near), [[0, 'rgba(160,200,140,0.18)'], [1, 'rgba(0,30,0,0.12)']]); g.fillRect(0, far, W, 1080 - far);
    // lines
    const LN = (pts) => { let first = true; g.beginPath(); for (const p of pts) { const s = cam.P(p[0], 0, p[1]); if (s[2] < 1) { first = true; continue; } first ? g.moveTo(s[0], s[1]) : g.lineTo(s[0], s[1]); first = false; } g.stroke(); };
    const arc = (cx, cz, r, a0, a1, n = 40) => { const out = []; for (let i = 0; i <= n; i++) { const a = L(a0, a1, i / n); out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return out; };
    g.strokeStyle = 'rgba(245,250,240,0.88)'; g.lineWidth = Math.max(1.5, cam.F / 90 * 0.12); g.lineCap = 'round';
    LN([[-52.5, 0], [52.5, 0]]); LN([[-52.5, 68], [52.5, 68]]); LN([[52.5, 0], [52.5, 68]]); LN([[0, 0], [0, 68]]);
    LN(arc(0, 34, 9.15, 0, TAU, 60));
    LN([[52.5, 13.84], [36, 13.84], [36, 54.16], [52.5, 54.16]]);
    LN([[52.5, 24.84], [47, 24.84], [47, 43.16], [52.5, 43.16]]);
    LN(arc(41.5, 34, 9.15, Math.PI * 0.705, Math.PI * 1.295, 24));
    const spot = cam.P(41.5, 0, 34); g.fillStyle = 'rgba(245,250,240,0.9)'; A.ellipse(g, spot[0], spot[1], cam.F / spot[2] * 0.2, cam.F / spot[2] * 0.08); g.fill();
    // corner flags
    for (const Z of [0, 68]) { const a = cam.P(52.5, 0, Z), b = cam.P(52.5, 1.5, Z); if (a[2] < 1) continue; line(g, a[0], a[1], b[0], b[1], '#f4f4f4', Math.max(1, cam.F / a[2] * 0.06)); g.fillStyle = '#ffd21f'; g.beginPath(); g.moveTo(b[0], b[1]); const c = cam.P(52.5, 1.3, Z - 0.6); g.lineTo(c[0], c[1]); const d = cam.P(52.5, 1.1, Z); g.lineTo(d[0], d[1]); g.fill(); }
  }

  function drawGoal(g, cam, mt, part) {
    // part: 'back' (net) or 'front' (posts)
    const Z0 = 30.34, Z1 = 37.66, X0 = 52.5, Hh = 2.44;
    const bulge = (Y, Z) => { if (mt < GOALT) return 0; const q = mt - GOALT; const d2 = ((Z - NET[2]) ** 2 + (Y - NET[1]) ** 2); return Math.exp(-d2 / 1.4) * Math.sin(q * 16) * Math.exp(-q * 3) * 0.9 + Math.exp(-d2 / 1.4) * 0.5 * Math.exp(-q * 1.5) * (q < 0.25 ? q / 0.25 : 1); };
    const back = (Y, Z) => [X0 + 2 - Y * 0.35 + bulge(Y, Z), Y, Z];
    const P = (p) => cam.P(p[0], p[1], p[2]);
    if (part === 'back') {
      g.strokeStyle = 'rgba(240,245,255,0.55)'; g.lineWidth = Math.max(0.7, cam.F / 90 * 0.035);
      g.beginPath();
      for (let Z = Z0; Z <= Z1 + 0.01; Z += 0.33) { let s = P(back(0, Z)); g.moveTo(s[0], s[1]); for (let Y = 0.2; Y <= Hh + 0.01; Y += 0.2) { s = P(back(Y, Z)); g.lineTo(s[0], s[1]); } const t2 = P([X0, Hh, Z]); g.lineTo(t2[0], t2[1]); }
      for (let Y = 0; Y <= Hh + 0.01; Y += 0.25) { let s = P(back(Y, Z0)); g.moveTo(s[0], s[1]); for (let Z = Z0 + 0.3; Z <= Z1 + 0.01; Z += 0.3) { s = P(back(Y, Z)); g.lineTo(s[0], s[1]); } }
      // side nets
      for (const Z of [Z0, Z1]) for (let Y = 0; Y <= Hh; Y += 0.25) { const a = P([X0, Y, Z]), b = P(back(Y, Z)); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      for (let Z = Z0; Z <= Z1 + 0.01; Z += 0.33) { const a = P([X0, Hh, Z]), b = P(back(Hh, Z)); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.stroke();
      // shadow of the goal on the grass
      g.fillStyle = 'rgba(0,30,0,0.25)'; g.beginPath(); [[X0, 0, Z0], [X0 + 2, 0, Z0], [X0 + 2, 0, Z1], [X0, 0, Z1]].forEach((p, i) => { const s = P(p); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.fill();
    } else {
      const a = P([X0, 0, Z0]), b = P([X0, Hh, Z0]), c = P([X0, Hh, Z1]), d = P([X0, 0, Z1]);
      const w = Math.max(2, cam.F / a[2] * 0.14);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(20,20,30,0.6)'; g.lineWidth = w + 2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.stroke();
      g.strokeStyle = '#fbfbff'; g.lineWidth = w; g.stroke();
    }
  }

  function drawBall(g, cam, bp, mt) {
    const s = cam.P(bp[0], bp[1], bp[2]), sh = cam.P(bp[0], 0, bp[2]); if (s[2] < 1) return;
    const k = cam.F / s[2], r = Math.max(3, 0.11 * k * 1.9);
    g.fillStyle = 'rgba(0,25,0,0.4)'; A.ellipse(g, sh[0], sh[1], r * 1.1, r * 0.4); g.fill();
    // motion streak for the shot
    if (mt > STRIKE && mt < GOALT + 0.05) {
      const pb = ballPos(mt - 0.06), q = cam.P(pb[0], pb[1], pb[2]);
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,230,0.6)'; g.lineCap = 'round'; g.lineWidth = r * 1.6; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(s[0], s[1]); g.stroke(); g.restore();
    }
    g.fillStyle = '#fbfbfb'; A.ellipse(g, s[0], s[1], r, r); g.fill(); g.strokeStyle = O; g.lineWidth = Math.max(1, r * 0.2); g.stroke();
    g.fillStyle = '#222'; const rot = mt * 12; for (let i = 0; i < 3; i++) { const a = rot + i * 2.1; A.ellipse(g, s[0] + Math.cos(a) * r * 0.5, s[1] + Math.sin(a) * r * 0.5, r * 0.28, r * 0.28); g.fill(); }
  }

  const pad2 = n => String(n).padStart(2, '0');
  function drawOverlays(g, mt, tt, state, o) {
    const scored = state === 'goal' && mt > GOALT + 0.7;
    const flash = state === 'goal' ? cl(1 - (mt - GOALT - 0.7) / 0.6) * (mt > GOALT + 0.7 ? 1 : 0) : 0;
    // scorebug: reads (RTL) מכבי 1–1 הפועל 89:xx
    g.save(); g.translate(56, 46);
    g.fillStyle = 'rgba(0,0,0,0.35)'; A.rrect(g, 6, 8, 676, 74, 12); g.fill();
    g.fillStyle = A.linear(g, 0, 0, 0, 74, [[0, '#1b2466'], [1, '#0b1034']]); A.rrect(g, 0, 0, 676, 74, 12); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke();
    // clock box (left)
    g.fillStyle = '#060a22'; A.rrect(g, 6, 6, 150, 62, 9); g.fill();
    const secs = Math.max(0, Math.min(59, Math.floor(23 + mt)));
    A.text(g, `89:${pad2(secs)}`, 81, 39, { font: '800 38px Rubik', fill: '#fff' });
    // Hapoel (left of score in RTL reading order)
    g.fillStyle = '#e3262e'; g.fillRect(168, 6, 12, 62);
    A.text(g, 'הפועל', 262, 39, { font: '800 40px Rubik', fill: '#fff', dir: 'rtl' });
    // score
    g.fillStyle = flash > 0 ? A.mixc('#ffd21f', '#f4f4f4', 1 - flash) : '#f4f4f4'; A.rrect(g, 352, 4, 150, 66, 8); g.fill();
    A.text(g, scored ? '2–1' : '1–1', 427, 39, { font: '900 44px Rubik', fill: '#0b1034' });
    // Maccabi
    A.text(g, 'מכבי', 590, 39, { font: '800 40px Rubik', fill: '#fff', dir: 'rtl' });
    g.fillStyle = '#ffd21f'; g.fillRect(658, 6, 12, 62);
    g.restore();
    if (flash > 0) A.glow(g, 483, 85, 180, '#ffd21f', flash * 0.7);
    // channel bug + LIVE badge (top right)
    g.save(); g.fillStyle = 'rgba(6,10,34,0.55)'; A.rrect(g, 1540, 40, 300, 76, 16); g.fill();
    g.globalAlpha = 0.92;
    A.text(g, 'IPTV', 1700, 78, { font: '900 52px Rubik', fill: '#fff', stroke: 'rgba(0,0,0,0.35)', lw: 6, align: 'right' });
    g.fillStyle = '#ffd21f'; A.ellipse(g, 1718, 78, 8, 8); g.fill();
    A.text(g, 'IL', 1734, 78, { font: '900 52px Rubik', fill: '#5fb8ff', stroke: 'rgba(0,0,0,0.35)', lw: 6, align: 'left' });
    g.restore();
    g.save(); g.translate(1560, 118);
    g.fillStyle = '#d61f2a'; A.rrect(g, 0, 0, 250, 48, 24); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.stroke();
    const pulse = 0.5 + 0.5 * Math.sin(tt * 5);
    g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * pulse})`; A.ellipse(g, 26, 24, 9, 9); g.fill();
    A.text(g, 'LIVE', 78, 25, { font: '900 26px Rubik', fill: '#fff' });
    A.text(g, 'שידור חי', 180, 25, { font: '700 26px Rubik', fill: '#fff', dir: 'rtl' });
    g.restore();
  }

  function drawGoalGraphic(g, mt, tt) {
    const q = mt - (GOALT + 0.3); if (q < 0) return;
    const up = A.ease.inOut(cl((q - 2.2) / 0.6));
    const sIn = A.ease.outBack(cl(q / 0.35)), pulse = 1 + Math.sin(q * 7) * 0.025 * cl(q - 0.35);
    // rays
    g.save(); g.translate(960, 520); g.rotate(q * 0.4);
    g.globalAlpha = cl(q / 0.2) * 0.4 * (1 - up * 0.75);
    for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? 'rgba(255,210,31,0.6)' : 'rgba(31,79,191,0.55)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1400, i / 20 * TAU, (i + 1) / 20 * TAU); g.closePath(); g.fill(); }
    g.restore();
    // confetti (closed-form)
    for (let i = 0; i < 90; i++) {
      const t0 = hh(i) * 0.4, qq = q - t0; if (qq < 0) continue;
      const x = hh(i + 1) * 1920 + Math.sin(qq * 3 + i) * 40, y = -40 + qq * (260 + hh(i + 2) * 240), r = qq * (4 + hh(i + 3) * 6) + i;
      if (y > 1120) continue;
      g.save(); g.translate(x, y); g.rotate(r); g.scale(1, Math.cos(r * 1.3));
      g.fillStyle = i % 3 === 0 ? '#1f4fbf' : i % 3 === 1 ? '#ffd21f' : '#ffffff'; g.fillRect(-9, -5, 18, 10); g.restore();
    }
    g.save(); g.translate(960, L(500, 330, up)); g.scale(sIn * pulse * L(1, 0.62, up), sIn * pulse * L(1, 0.62, up)); g.rotate(-0.05);
    A.text(g, 'גול!', 0, -150, { font: '900 210px Rubik', fill: '#ffffff', stroke: '#0b1a6a', lw: 26, dir: 'rtl' });
    g.fillStyle = A.linear(g, 0, 0, 0, 300, [[0, '#fff27a'], [0.5, '#ffd21f'], [1, '#e89a0a']]);
    g.save(); g.font = '400 300px Bangers'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = '#0b1a6a'; g.strokeText('GOAL!', 0, 110);
    g.lineWidth = 14; g.strokeStyle = '#1f4fbf'; g.strokeText('GOAL!', 0, 110);
    g.fillStyle = A.linear(g, 0, -20, 0, 240, [[0, '#fff58a'], [0.55, '#ffd21f'], [1, '#f0a010']]); g.fillText('GOAL!', 0, 110);
    g.restore();
    g.restore();
  }

  // glitch helpers (macroblocks sampled from what's already on the canvas)
  let SCR = null, SMALL = null;
  function glitch(ctx, amt, seed, Wr, Hr) {
    const m = ctx.getTransform(), cv = ctx.canvas;
    const x0 = m.e, y0 = m.f, sx = m.a, sy = m.d;
    const dw = Math.max(2, Math.ceil(Wr * sx)), dh = Math.max(2, Math.ceil(Hr * sy));
    if (!SCR) { SCR = document.createElement('canvas'); SMALL = document.createElement('canvas'); }
    if (SCR.width !== dw || SCR.height !== dh) { SCR.width = dw; SCR.height = dh; }
    const sg = SCR.getContext('2d'); sg.clearRect(0, 0, dw, dh);
    sg.drawImage(cv, x0, y0, dw, dh, 0, 0, dw, dh);
    const cw = Math.max(2, Math.round(Wr / 48)), ch = Math.max(2, Math.round(Hr / 48));
    SMALL.width = cw; SMALL.height = ch; SMALL.getContext('2d').drawImage(SCR, 0, 0, cw, ch);
    const r = A.rng(seed * 7 + 3), bs = 48;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const n = Math.round(6 + amt * 30);
    for (let i = 0; i < n; i++) {
      const bw = bs * (1 + Math.floor(r() * 6)), bh = bs * (1 + Math.floor(r() * 3));
      const bx = Math.floor(r() * (Wr / bs)) * bs, by = Math.floor(r() * (Hr / bs)) * bs;
      const kind = r();
      if (kind < 0.45) { // displaced copy
        const ox = (r() - 0.5) * bs * 4, oy = (r() - 0.3) * bs * 2;
        ctx.drawImage(SCR, (bx + ox) * sx, (by + oy) * sy, bw * sx, bh * sy, bx, by, bw, bh);
      } else if (kind < 0.8) { // blocky low-res
        ctx.drawImage(SMALL, bx / Wr * cw, by / Hr * ch, bw / Wr * cw, bh / Hr * ch, bx, by, bw, bh);
      } else { // smear: stretch a 1-row slice downwards
        ctx.drawImage(SCR, bx * sx, by * sy, bw * sx, Math.max(1, 2 * sy), bx, by, bw, bh * 1.5);
      }
      if (r() < 0.4) { ctx.globalAlpha = 0.3 * amt; ctx.fillStyle = r() < 0.5 ? '#ff2a9a' : '#2aff8a'; ctx.fillRect(bx, by, bs, bs); ctx.globalAlpha = 1; }
    }
    // macroblock grid shimmer
    ctx.globalAlpha = 0.08 * amt; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 0; x < Wr; x += bs) { ctx.moveTo(x, 0); ctx.lineTo(x, Hr); } for (let y = 0; y < Hr; y += bs) { ctx.moveTo(0, y); ctx.lineTo(Wr, y); } ctx.stroke();
    ctx.restore();
  }

  function drawSpinner(g, t, vis, pct) {
    if (vis <= 0) return;
    g.save(); g.globalAlpha = cl(vis);
    g.fillStyle = 'rgba(4,6,20,0.38)'; g.fillRect(0, 0, 1920, 1080);
    g.translate(960, 520);
    g.fillStyle = 'rgba(0,0,0,0.35)'; A.ellipse(g, 0, 0, 150, 150); g.fill();
    const n = 12, rot = Math.floor(t * 12) / 12 * TAU;
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * TAU, f = i / n;
      g.fillStyle = `rgba(255,255,255,${0.12 + 0.88 * f})`;
      g.save(); g.rotate(a); A.rrect(g, 58, -11, 52, 22, 11); g.fill(); g.restore();
    }
    if (pct != null) {
      A.text(g, `${Math.round(pct)}%`, 0, 2, { font: '800 44px Rubik', fill: '#fff' });
      A.text(g, 'טוען...', 0, 200, { font: '700 46px Rubik', fill: '#fff', stroke: 'rgba(0,0,0,0.5)', lw: 6, dir: 'rtl' });
    }
    g.restore();
  }

  function drawBroadcast(g, tt, mt, state, o) {
    const goalZoom = state === 'goal' ? cl((mt - GOALT) / 1.5) : 0;
    const cam = makeCam(mt, goalZoom);
    const excite = state === 'goal' ? A.smooth(GOALT, GOALT + 0.35, mt) : A.smooth(-0.5, 1.4, mt) * 0.18;
    drawPitch(g, cam);
    drawCrowd(g, cam, tt, excite);
    drawBoards(g, cam, tt, state === 'goal' && mt > GOALT ? 1 : 0);
    drawGoal(g, cam, mt, 'back');
    // players & ball sorted by depth
    const items = [];
    const bp = ballPos(mt);
    items.push({ z: cam.P(bp[0], 0, bp[2])[2], draw: () => drawBall(g, cam, bp, mt) });
    PL.forEach(([id, team, num], i) => {
      const p = pos(id, mt), p2 = pos(id, mt + 0.08), s = cam.P(p[0], 0, p[1]), s2 = cam.P(p2[0], 0, p2[1]);
      if (s[2] < 1 || s[0] < -200 || s[0] > 2120) return;
      const spd = Math.hypot(p2[0] - p[0], p2[1] - p[1]) / 0.08;
      const face = s2[0] - s[0] > 0.3 ? 1 : s2[0] - s[0] < -0.3 ? -1 : (id === 'gk' ? -1 : 1);
      const o2 = { run: cl(spd / 6), ph: mt * 12 + i * 1.7, face, skin: i % SKIN.length, num };
      if (id === 'S') { if (mt > 1.3 && mt < 1.75) { o2.kick = cl((mt - 1.3) / 0.35); o2.face = 1; } if (state === 'goal' && mt > 2.3) { o2.arms = 1; } }
      if (id === 'gk') { o2.face = 1; if (mt > STRIKE) { const d = cl((mt - STRIKE) / 0.4); o2.dive = A.ease.out(d); if (mt > 2.4) { o2.dive = 0; o2.lie = 1; } } }
      if (state === 'goal' && team === 'mac' && mt > 2.6) o2.arms = 1;
      items.push({ z: s[2], draw: () => drawPlayer(g, s[0], s[1], cam.F / s[2], KIT[team], o2) });
    });
    items.sort((a, b) => b.z - a.z).forEach(it => it.draw());
    drawGoal(g, cam, mt, 'front');
    // broadcast grade: slight vignette & top haze from floodlights
    g.fillStyle = A.radial(g, 960, 540, 500, 1200, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,20,0.35)']]); g.fillRect(0, 0, 1920, 1080);
    A.glow(g, 200, -60, 500, '#fff6d8', 0.25); A.glow(g, 1720, -60, 500, '#fff6d8', 0.25);
    drawOverlays(g, mt, tt, state, o);
    if (state === 'goal') drawGoalGraphic(g, mt, tt);
  }

  // A.drawTVScreen(ctx, x, y, w, h, t, o) — o.state 'live'|'freeze'|'goal'; o.matchT (default: live t-13, freeze 1.5,
  // goal 1.5+(t-46)); o.freezeGlitch 0..1; o.spinner 0..1; o.bufferPct; o.freezeT (crowd time frozen, default 14.5)
  A.drawTVScreen = (ctx, x, y, w, h, t, o = {}) => {
    const state = o.state || 'live';
    let mt = o.matchT;
    if (mt == null) mt = state === 'live' ? t - 13 : state === 'freeze' ? STRIKE : STRIKE + (t - 46);
    const tt = state === 'freeze' ? (o.freezeT ?? 14.5) : t;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x, y);
    const sc = Math.max(w / 1920, h / 1080);
    ctx.translate((w - 1920 * sc) / 2, (h - 1080 * sc) / 2); ctx.scale(sc, sc);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080);
    drawBroadcast(ctx, tt, mt, state, o);
    if (state === 'freeze') {
      const gl = o.freezeGlitch ?? 0.6;
      if (gl > 0) glitch(ctx, gl, Math.floor(t * 2.5), 1920, 1080);
      ctx.fillStyle = 'rgba(30,30,50,0.12)'; ctx.fillRect(0, 0, 1920, 1080);
      drawSpinner(ctx, t, o.spinner ?? 1, o.bufferPct);
    }
    ctx.restore();
  };

  // A.drawTV(ctx, x, y, w, h, t, o) — (x,y,w,h) = SCREEN rect; bezel + stand drawn around/below it.
  // o.stand (px, default 0.09*w), o.glare (0..1), o.off (true = dark screen) + all drawTVScreen options.
  A.drawTV = (ctx, x, y, w, h, t, o = {}) => {
    const b = w * 0.028, st = o.stand ?? w * 0.09;
    ctx.save();
    // stand
    const sx = x + w / 2;
    ctx.fillStyle = '#1b1a22'; poly(ctx, [[sx - w * 0.05, y + h + b - 2], [sx + w * 0.05, y + h + b - 2], [sx + w * 0.035, y + h + b + st * 0.8], [sx - w * 0.035, y + h + b + st * 0.8]]); ctx.fill();
    ctx.fillStyle = A.linear(ctx, 0, y + h + b + st * 0.75, 0, y + h + b + st, [[0, '#3a3944'], [1, '#101016']]);
    A.rrect(ctx, sx - w * 0.2, y + h + b + st * 0.75, w * 0.4, st * 0.25, st * 0.1); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = Math.max(1.5, w * 0.005); ctx.stroke();
    // bezel
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; A.rrect(ctx, x - b + w * 0.012, y - b + w * 0.015, w + 2 * b, h + 2 * b, b * 0.8); ctx.fill();
    ctx.fillStyle = A.linear(ctx, 0, y - b, 0, y + h + b, [[0, '#34333e'], [0.1, '#18171e'], [1, '#0c0b10']]);
    A.rrect(ctx, x - b, y - b, w + 2 * b, h + 2 * b, b * 0.8); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = Math.max(2, w * 0.007); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,180,0.18)'; ctx.fillRect(x - b * 0.6, y - b * 0.8, w + b * 1.2, Math.max(1, b * 0.12));
    // brand + power led
    ctx.fillStyle = 'rgba(200,200,215,0.5)'; ctx.fillRect(sx - w * 0.03, y + h + b * 0.45, w * 0.06, Math.max(1, b * 0.14));
    A.glow(ctx, x + w + b * 0.5, y + h + b * 0.5, b * 0.8, '#ff4040', 0.6);
    // screen
    if (o.off) { ctx.fillStyle = '#0a0c10'; ctx.fillRect(x, y, w, h); }
    else A.drawTVScreen(ctx, x, y, w, h, t, o);
    // inner shadow + glare
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = w * 0.01; ctx.strokeRect(x, y, w, h);
    const gl = o.glare ?? 1;
    if (gl > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = A.linear(ctx, x, y, x + w, y + h, [[0, `rgba(255,255,255,${0.10 * gl})`], [0.32, 'rgba(255,255,255,0.0)'], [0.55, 'rgba(255,255,255,0)'], [0.6, `rgba(255,255,255,${0.05 * gl})`], [0.66, 'rgba(255,255,255,0)']]);
      ctx.fillRect(x, y, w, h);
      // warm lamp reflection top-left
      ctx.fillStyle = A.radial(ctx, x + w * 0.08, y + h * 0.12, 0, w * 0.18, [[0, `rgba(255,190,120,${0.12 * gl})`], [1, 'rgba(255,190,120,0)']]); ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    ctx.restore();
  };

  // ======================================================================================================
  // ROUTER — cute boxy router, ~220 px wide at s = 1; (x,y) = bottom centre.
  // ======================================================================================================
  const RLED = [-66, -40]; // main LED offset at s=1 (front face)
  A.routerLED = (x, y, s = 1) => { const r = [x + RLED[0] * s, y + RLED[1] * s]; r.x = r[0]; r.y = r[1]; return r; };
  A.drawRouter = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t ?? 0, act = o.activity ?? 0.5, glowA = o.ledGlow ?? 0, shake = o.shake ?? 0;
    const ledC = o.ledColor || '#7ff6ff';
    ctx.save();
    const jx = shake * A.noise1(t * 31) * 5, jy = shake * A.noise1(t * 29 + 7) * 3;
    ctx.translate(x + jx * s, y + jy * s); ctx.scale(s, s); ctx.rotate(shake * A.noise1(t * 23 + 3) * 0.03);
    const g = ctx;
    // shadow
    g.fillStyle = A.radial(g, 0, 0, 0, 140, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]); g.save(); g.scale(1, 0.14); g.fillRect(-140, -140, 280, 280); g.restore();
    // antennae (behind body), with secondary sway
    const ants = [[-78, -0.42, 100], [0, 0.02, 108], [78, 0.44, 100]];
    ants.forEach(([ax, a0, len], i) => {
      const sway = Math.sin(t * 1.7 + i * 1.9) * 0.03 + shake * Math.sin(t * 26 + i * 2) * 0.22;
      g.save(); g.translate(ax, -78); g.rotate(a0 + sway);
      g.fillStyle = '#26262e'; A.rrect(g, -9, -8, 18, 16, 5); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
      const P = () => A.rrect(g, -7, -len, 14, len - 4, 7);
      cel(g, P, '#3a3a46', '#1d1d26', '#9aa0c8', { lx: -0.9, ly: -0.2, d: 5, r: 2, lw: 3.5 });
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-4, -len + 10, 2, len - 24);
      g.restore();
    });
    // body: top face + front face
    const top = () => { g.beginPath(); g.moveTo(-104, -80); g.quadraticCurveTo(-104, -96, -88, -98); g.lineTo(88, -98); g.quadraticCurveTo(104, -96, 104, -80); g.lineTo(110, -74); g.lineTo(-110, -74); g.closePath(); };
    cel(g, top, '#f4efe6', '#cfc6c0', '#ffffff', { lx: -0.6, ly: -0.8, d: 6, r: 2, lw: 4 });
    // vents
    g.strokeStyle = 'rgba(80,70,90,0.45)'; g.lineWidth = 3; for (let i = -6; i <= 6; i++) line(g, i * 12 - 4, -93, i * 12 + 4, -80, 'rgba(90,80,100,0.45)', 3);
    const front = () => A.rrect(g, -112, -76, 224, 66, 16);
    cel(g, front, '#ebe4da', '#b9aeb0', '#fff9f0', { lx: -0.7, ly: -0.7, d: 12, r: 3, lw: 4.5 });
    // glossy black LED strip
    g.fillStyle = A.linear(g, 0, -58, 0, -24, [[0, '#2a2a34'], [1, '#0e0e14']]); A.rrect(g, -96, -58, 192, 34, 12); g.fill(); g.strokeStyle = O; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.15)'; A.rrect(g, -90, -56, 180, 6, 3); g.fill();
    // logo + wifi sticker
    A.text(g, 'NetBox', 70, -16.5, { font: '700 11px Rubik', fill: '#8a8290' });
    // LEDs: main (dive target), then small ones
    const leds = [[-40, '#58ff8a'], [-18, '#58c8ff'], [4, '#58ff8a'], [26, '#58ff8a'], [48, '#ffc04a'], [70, '#58ff8a']];
    leds.forEach(([lx, c], i) => {
      const on = hh(i * 9.1 + Math.floor(t * (10 + i * 2))) > act * 0.6 ? 1 : 0.2;
      g.fillStyle = c; g.globalAlpha = 0.25 + 0.75 * on; A.ellipse(g, lx, -41, 4.2, 4.2); g.fill();
      g.globalAlpha = 1;
      if (on > 0.5) A.glow(g, lx, -41, 12, c, 0.45);
    });
    // main LED with bezel ring + globe icon
    g.fillStyle = '#1a1a22'; A.ellipse(g, RLED[0], RLED[1], 13, 13); g.fill(); g.strokeStyle = '#6a6a78'; g.lineWidth = 2; g.stroke();
    const mainOn = 0.75 + 0.25 * Math.sin(t * 6) * (1 - cl(glowA));
    g.fillStyle = ledC; g.globalAlpha = mainOn; A.ellipse(g, RLED[0], RLED[1], 8.5, 8.5); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#ffffff'; A.ellipse(g, RLED[0] - 2, RLED[1] - 2.5, 3, 2.5); g.fill();
    g.strokeStyle = 'rgba(10,40,60,0.5)'; g.lineWidth = 1.2; A.ellipse(g, RLED[0], RLED[1], 5.5, 5.5); g.stroke(); line(g, RLED[0] - 5.5, RLED[1], RLED[0] + 5.5, RLED[1], 'rgba(10,40,60,0.5)', 1.2); A.ellipse(g, RLED[0], RLED[1], 2.5, 5.5); g.stroke();
    A.glow(g, RLED[0], RLED[1], 26 + glowA * 30, ledC, 0.55 + glowA * 0.2);
    if (glowA > 0) {
      A.glow(g, RLED[0], RLED[1], 60 + glowA * 90, ledC, Math.min(1, glowA * 0.45));
      A.glow(g, RLED[0], RLED[1], 18 + glowA * 14, '#ffffff', Math.min(1, glowA * 0.5));
      // star flare
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(RLED[0], RLED[1]); g.rotate(t * 0.3);
      const fl = Math.min(1.5, glowA) / 1.5;
      for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4 * (k % 2 ? 1 : 1)); g.fillStyle = A.linear(g, -120 * fl * glowA, 0, 120 * fl * glowA, 0, [[0, 'rgba(160,250,255,0)'], [0.5, `rgba(220,255,255,${0.7 * fl})`], [1, 'rgba(160,250,255,0)']]); g.fillRect(-120 * fl * glowA, -1.5 - (k % 2 ? 0 : 1), 240 * fl * glowA, k % 2 ? 2 : 4); }
      g.restore();
    }
    // feet
    for (const fx of [-86, 86]) { g.fillStyle = '#2a2a30'; A.rrect(g, fx - 12, -12, 24, 12, 4); g.fill(); }
    ctx.restore();
  };

  // ======================================================================================================
  // TORONTO STREET (night, snow) — parallax layers: sky (0.05), city (0.3), set (1.0)
  // World coords of the 'set' layer = screen coords at cam {x:960,y:540,zoom:1}; same as A.camera(ctx, cam).
  // ======================================================================================================
  const MARGIN = 220;
  // perspective quad mapping: Q = {n0:[x,y] near-bottom, n1 near-top, f0 far-bottom, f1 far-top}, zr = far/near depth ratio
  const pq = (Q, u, v, zr) => {
    const wn = (1 - u), wf = u / zr, s = wn + wf;
    const nx = L(Q.n0[0], Q.n1[0], v), ny = L(Q.n0[1], Q.n1[1], v), fx = L(Q.f0[0], Q.f1[0], v), fy = L(Q.f0[1], Q.f1[1], v);
    return [(nx * wn + fx * wf) / s, (ny * wn + fy * wf) / s];
  };
  const pqPoly = (g, Q, zr, uvs) => { g.beginPath(); uvs.forEach(([u, v], i) => { const p = pq(Q, u, v, zr); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); };

  const BLD = { n0: [1990, 1010], n1: [1990, -60], f0: [1360, 712], f1: [1360, 214] }, BZR = 2.3; // our apartment building (right)
  const ROW = { n0: [-160, 900], n1: [-160, 120], f0: [1060, 660], f1: [1060, 530] }, RZR = 3.2; // row houses (left)
  const WPT = pq(BLD, 0.52, 0.55, BZR); // our window centre
  const INS = [612, 214], ATT = (() => { const p = pq(BLD, 0.62, 0.64, BZR); return [p[0], p[1]]; })();
  const wirePts = (a, b, sag, n = 24) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push([L(a[0], b[0], u), L(a[1], b[1], u) + sag * 4 * u * (1 - u)]); } return out; };
  const STREETPATH = (() => {
    const pts = [[492, 1120], [492, 900], [492, 600], [492, 330], [492, 236], [540, 222], [INS[0], INS[1] - 4]];
    wirePts([INS[0], INS[1] - 4], [ATT[0], ATT[1] - 4], 70, 30).slice(1).forEach(p => pts.push(p));
    pts.push([WPT[0] - 10, WPT[1] - 4], [WPT[0] + 6, WPT[1] + 6]);
    return pts;
  })();
  const pathLen = (() => { let s = 0; const acc = [0]; for (let i = 1; i < STREETPATH.length; i++) { s += Math.hypot(STREETPATH[i][0] - STREETPATH[i - 1][0], STREETPATH[i][1] - STREETPATH[i - 1][1]); acc.push(s); } return acc; })();
  A.STREET = {
    poleBase: [492, 1080], poleTop: [492, 150], crossarm: [[360, 214], [620, 214]], insulator: INS,
    wireStart: INS, wireEnd: ATT, attach: ATT,
    window: (() => { const a = pq(BLD, 0.46, 0.49, BZR), b = pq(BLD, 0.58, 0.61, BZR); return { x: a[0], y: b[1], w: b[0] - a[0], h: a[1] - b[1], cx: WPT[0], cy: WPT[1] }; })(),
    entry: [WPT[0] + 6, WPT[1] + 6],
    path: STREETPATH,                                  // polyline: bottom of frame → up the pole → wire → window
    wire: wirePts(INS, ATT, 70, 30),
    // A.STREET.at(p) → [x, y, angle] at arclength fraction p (0..1) of the path
    at: p => {
      const total = pathLen[pathLen.length - 1], d = cl(p) * total;
      let i = 1; while (i < pathLen.length - 1 && pathLen[i] < d) i++;
      const f = (d - pathLen[i - 1]) / Math.max(1e-6, pathLen[i] - pathLen[i - 1]), a = STREETPATH[i - 1], b = STREETPATH[i];
      return [L(a[0], b[0], f), L(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])];
    },
    pathLength: pathLen[pathLen.length - 1],
    lamps: [[660, 400], [300, 520], [805, 570], [960, 615]],
    cnTower: [1185, 70],
  };

  function streetSky(g) {
    const M = MARGIN, W = 1920 + 2 * M, H = 1080 + 2 * M;
    g.fillStyle = A.linear(g, 0, 0, 0, H, [[0, '#070a24'], [0.3, '#121a44'], [0.55, '#2a2a5a'], [0.68, '#5a4270'], [0.78, '#8a5a6a'], [1, '#2a2340']]); g.fillRect(0, 0, W, H);
    // low clouds lit orange from the city
    for (let i = 0; i < 26; i++) { const cx = hh(i * 2.1) * W, cy = M + 40 + hh(i * 3.3) * 420, r = 90 + hh(i + 11) * 170;
      g.fillStyle = A.radial(g, cx, cy, 0, r, [[0, `rgba(${cy > M + 300 ? '150,100,120' : '70,70,130'},0.3)`], [1, 'rgba(60,60,120,0)']]); g.save(); g.translate(cx, cy); g.scale(2.2, 0.5); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore(); }
  }
  function streetCity(g) {
    const M = MARGIN;
    g.save(); g.translate(M, M);
    // far downtown skyline around the CN tower
    const r = A.rng(99);
    for (let x = 700; x < 1720;) { const w = 18 + r() * 46, h = 30 + r() * 150 * (1 - Math.abs(x - 1180) / 700); g.fillStyle = '#2c2c5c'; g.fillRect(x, 640 - h, w, h + 40);
      for (let wy = 646 - h; wy < 640; wy += 8) for (let wx = x + 3; wx < x + w - 3; wx += 6) if (r() > 0.7) { g.fillStyle = r() > 0.4 ? 'rgba(255,210,150,0.6)' : 'rgba(170,210,255,0.55)'; g.fillRect(wx, wy, 2.5, 3.5); }
      x += w + 3; }
    cnTower(g, 1185, 650, 580, { lit: '#9da2dc', shade: '#34366c' });
    g.fillStyle = A.linear(g, 0, 480, 0, 700, [[0, 'rgba(140,100,140,0)'], [1, 'rgba(150,105,140,0.55)']]); g.fillRect(600, 480, 1300, 220);
    g.restore();
  }

  function house(g, u0, u1, style) {
    const Q = ROW, zr = RZR;
    // facade
    const cols = ['#5a3a48', '#3e4a66', '#6a4a3a', '#4a3a5a', '#5a4a3a'];
    pqPoly(g, Q, zr, [[u0, 0], [u1, 0], [u1, 0.72], [u0, 0.72]]);
    g.fillStyle = cols[style % cols.length]; g.fill(); g.strokeStyle = 'rgba(10,8,25,0.8)'; g.lineWidth = 2; g.stroke();
    // brick hint
    // gable roof (Toronto bay-and-gable)
    const mid = (u0 + u1) / 2;
    const a = pq(Q, u0 - 0.004, 0.72, zr), b = pq(Q, u1 + 0.004, 0.72, zr), pk = pq(Q, mid, 1.02, zr);
    g.fillStyle = '#2a2240'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(pk[0], pk[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill(); g.stroke();
    // snow on roof edges
    g.strokeStyle = '#e4ecff'; g.lineWidth = Math.max(2, (b[1] - pk[1]) * 0.12); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1] - 2); g.lineTo(pk[0], pk[1] - 2); g.lineTo(b[0], b[1] - 2); g.stroke();
    // gable window
    const gw = pq(Q, mid - 0.012, 0.8, zr), gw2 = pq(Q, mid + 0.012, 0.9, zr);
    const warm = hh(style * 3.1) > 0.4;
    g.fillStyle = warm ? '#ffcf7a' : '#1a2044'; g.fillRect(gw[0], gw2[1], gw2[0] - gw[0], gw[1] - gw2[1]);
    // bay window (ground + first floor)
    const bu0 = u0 + (u1 - u0) * 0.12, bu1 = u0 + (u1 - u0) * 0.55;
    for (const [v0, v1, lit] of [[0.1, 0.32, hh(style + 1) > 0.35], [0.42, 0.62, hh(style + 2) > 0.5]]) {
      pqPoly(g, Q, zr, [[bu0, v0], [bu1, v0], [bu1, v1], [bu0, v1]]); g.fillStyle = lit ? '#ffc46a' : '#171c3e'; g.fill(); g.strokeStyle = '#e8e0d0'; g.lineWidth = 2; g.stroke();
      const m1 = pq(Q, (bu0 + bu1) / 2, v0, zr), m2 = pq(Q, (bu0 + bu1) / 2, v1, zr); line(g, m1[0], m1[1], m2[0], m2[1], '#e8e0d0', 2);
      if (lit) { const c = pq(Q, (bu0 + bu1) / 2, (v0 + v1) / 2, zr); A.glow(g, c[0], c[1], (m1[1] - m2[1]) * 1.4, '#ffb45e', 0.35); }
      // snow on sill
      const s0 = pq(Q, bu0, v0, zr), s1 = pq(Q, bu1, v0, zr); line(g, s0[0], s0[1], s1[0], s1[1], '#e4ecff', 3);
    }
    // door + porch
    const du0 = u0 + (u1 - u0) * 0.66, du1 = u0 + (u1 - u0) * 0.86;
    pqPoly(g, Q, zr, [[du0, 0], [du1, 0], [du1, 0.3], [du0, 0.3]]); g.fillStyle = ['#6a1f2a', '#1f3a5a', '#2a4a2a'][style % 3]; g.fill(); g.stroke();
    const pl = pq(Q, du0 - 0.01, 0.34, zr), pr = pq(Q, du1 + 0.01, 0.34, zr); line(g, pl[0], pl[1], pr[0], pr[1], '#e4ecff', 4);
    const lamp = pq(Q, du1 + 0.006, 0.26, zr); A.glow(g, lamp[0], lamp[1], 30, '#ffcf8a', 0.6);
  }

  function streetSet(g) {
    const M = MARGIN;
    g.save(); g.translate(M, M);
    // ground: snow-covered street & sidewalks
    g.fillStyle = A.linear(g, 0, 640, 0, 1080, [[0, '#7a80b0'], [0.3, '#8e94c4'], [1, '#c8d0f0']]);
    poly(g, [[-M, 640], [1920 + M, 640], [1920 + M, 1080 + M], [-M, 1080 + M]]); g.fill();
    // road (slushy, darker) converging to VP
    g.fillStyle = A.linear(g, 0, 650, 0, 1080, [[0, '#5a5a86'], [1, '#6e709e']]);
    poly(g, [[1100, 652], [1190, 652], [1560, 1080 + M], [140, 1080 + M]]); g.fill();
    // tire tracks
    g.strokeStyle = 'rgba(40,36,70,0.5)';
    for (const [x0, x1, w] of [[1125, 420, 10], [1138, 620, 12], [1155, 960, 12], [1168, 1170, 10]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x0, 655); g.quadraticCurveTo((x0 + x1) / 2 + 20, 860, x1, 1080 + M); g.stroke(); }
    // snowbanks at the curbs
    g.fillStyle = '#d6def8';
    A.blob(g, [[1098, 650], [900, 700], [600, 790], [300, 880], [60, 960], [-M, 1000], [-M, 1060], [100, 1010], [340, 930], [640, 830], [940, 720], [1104, 660]]); g.fill();
    A.blob(g, [[1192, 650], [1300, 700], [1500, 820], [1700, 950], [1920 + M, 1040], [1920 + M, 1100], [1700, 1000], [1480, 860], [1290, 720], [1186, 660]]); g.fill();
    // row houses on the left
    for (let i = 0; i < 9; i++) { const u0 = i / 9 * 0.98, u1 = (i + 1) / 9 * 0.98 - 0.004; house(g, u0, u1, i); }
    // parked car under a snow blanket (left curb)
    g.save(); g.translate(740, 790);
    g.fillStyle = 'rgba(20,20,50,0.4)'; A.ellipse(g, 0, 44, 190, 18); g.fill();
    A.blob(g, [[-190, 34], [-186, -10], [-120, -26], [-70, -78], [60, -84], [110, -34], [180, -20], [196, 30], [150, 44], [-150, 44]]);
    A.fillStroke(g, '#2a3a6a', 4);
    A.blob(g, [[-186, -6], [-118, -30], [-72, -86], [60, -92], [112, -40], [186, -26], [194, -4], [100, -12], [40, -30], [-80, -24], [-150, -2]]); A.fillStroke(g, '#e8eeff', 3);
    g.fillStyle = '#1a1a34'; A.ellipse(g, -110, 40, 30, 30); g.fill(); A.ellipse(g, 110, 40, 30, 30); g.fill();
    g.fillStyle = '#ff5a3a'; g.fillRect(-194, 0, 10, 10); A.glow(g, -189, 5, 22, '#ff3a2a', 0.5);
    g.fillStyle = 'rgba(160,190,255,0.35)'; poly(g, [[-60, -60], [40, -64], [80, -32], [-70, -30]]); g.fill();
    g.restore();
    // our apartment building (right) — brick, 4 storeys
    pqPoly(g, BLD, BZR, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    g.fillStyle = A.linear(g, 1360, 0, 1920, 0, [[0, '#4a2a34'], [1, '#6a3a3a']]); g.fill();
    g.save(); pqPoly(g, BLD, BZR, [[0, 0], [1, 0], [1, 1], [0, 1]]); g.clip();
    // brick courses
    for (let v = 0; v < 1; v += 0.02) { g.beginPath(); for (let u = 0; u <= 1.001; u += 0.1) { const p = pq(BLD, u, v, BZR); u ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.strokeStyle = 'rgba(20,8,20,0.22)'; g.lineWidth = 1.2; g.stroke(); }
    // storeys + windows
    for (let fl = 0; fl < 4; fl++) {
      const v0 = 0.08 + fl * 0.24, v1 = v0 + 0.12;
      for (let c = 0; c < 4; c++) {
        const u0 = 0.06 + c * 0.24, u1 = u0 + 0.12;
        const ours = fl === 2 && c === 2;
        const lit = ours || hh(fl * 7 + c * 3) > 0.72;
        pqPoly(g, BLD, BZR, [[u0 - 0.01, v0 - 0.02], [u1 + 0.01, v0 - 0.02], [u1 + 0.01, v1 + 0.02], [u0 - 0.01, v1 + 0.02]]); g.fillStyle = '#c9b8a0'; g.fill();
        pqPoly(g, BLD, BZR, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
        g.fillStyle = ours ? A.linear(g, 0, pq(BLD, u0, v1, BZR)[1], 0, pq(BLD, u0, v0, BZR)[1], [[0, '#ffcf80'], [1, '#ff9a4a']]) : lit ? '#9a6a5a' : A.linear(g, 0, pq(BLD, u0, v1, BZR)[1], 0, pq(BLD, u0, v0, BZR)[1], [[0, '#2a3060'], [1, '#141836']]); g.fill();
        g.strokeStyle = 'rgba(15,8,25,0.9)'; g.lineWidth = 2.5; g.stroke();
        if (ours) {
          // silhouette of the lamp & curtains inside
          const a = pq(BLD, u0, v0, BZR), b = pq(BLD, u1, v1, BZR), w = b[0] - a[0], h = a[1] - b[1];
          g.fillStyle = '#b0703a'; g.fillRect(a[0], b[1], w * 0.16, h); g.fillRect(b[0] - w * 0.16, b[1], w * 0.16, h);
          g.fillStyle = '#6a3a2a'; poly(g, [[a[0] + w * 0.3, b[1] + h * 0.35], [a[0] + w * 0.42, b[1] + h * 0.35], [a[0] + w * 0.46, b[1] + h * 0.5], [a[0] + w * 0.26, b[1] + h * 0.5]]); g.fill();
          g.fillRect(a[0] + w * 0.355, b[1] + h * 0.5, 2, h * 0.5);
          // tiny Israeli flag sticker + hamsa in the window
          g.fillStyle = '#fff'; g.fillRect(a[0] + w * 0.62, b[1] + h * 0.18, w * 0.16, h * 0.14);
          g.fillStyle = '#1d44b8'; g.fillRect(a[0] + w * 0.62, b[1] + h * 0.195, w * 0.16, h * 0.02); g.fillRect(a[0] + w * 0.62, b[1] + h * 0.295, w * 0.16, h * 0.02);
          line(g, a[0] + w * 0.5, b[1] + h * 0.12, a[0] + w * 0.5, b[1] + h * 0.44, 'rgba(0,0,0,0)', 1);
          // snow on the ledge
          g.fillStyle = '#eef3ff'; A.blob(g, [[a[0] - 6, a[1] + 8], [a[0] + w * 0.3, a[1] - 3], [a[0] + w * 0.7, a[1] - 2], [b[0] + 6, a[1] + 6]]); g.fill();
        } else {
          const a = pq(BLD, u0, v0, BZR), b = pq(BLD, u1, v1, BZR);
          line(g, (a[0] + b[0]) / 2, a[1], (a[0] + b[0]) / 2, b[1], 'rgba(200,190,170,0.8)', 2);
          g.fillStyle = '#e4ecff'; g.fillRect(a[0] - 4, a[1] + 2, b[0] - a[0] + 8, 5);
        }
      }
      // cornice line per storey
      const c0 = pq(BLD, 0, v0 - 0.05, BZR), c1 = pq(BLD, 1, v0 - 0.05, BZR); line(g, c0[0], c0[1], c1[0], c1[1], 'rgba(20,8,20,0.35)', 3);
    }
    // entrance canopy at ground floor
    g.restore();
    // roof parapet with snow
    const r0 = pq(BLD, 0, 1, BZR), r1 = pq(BLD, 1, 1, BZR);
    g.strokeStyle = '#eef3ff'; g.lineWidth = 12; g.beginPath(); g.moveTo(r1[0], r1[1]); g.lineTo(r0[0], r0[1]); g.stroke();
    // building edge (corner) outline
    const e0 = pq(BLD, 1, 0, BZR), e1 = pq(BLD, 1, 1, BZR); line(g, e0[0], e0[1], e1[0], e1[1], O, 4);
    // service bracket & meter where the wire attaches
    g.fillStyle = '#3a3a48'; g.fillRect(ATT[0] - 6, ATT[1] - 6, 16, 12); g.strokeStyle = O; g.lineWidth = 2; g.strokeRect(ATT[0] - 6, ATT[1] - 6, 16, 12);
    line(g, ATT[0] + 4, ATT[1] + 6, WPT[0] - 30, WPT[1] + 2, '#1a1a24', 3);
    // left sidewalk street lamps (sodium) — posts; glow is live
    for (const [lx, ly, s] of [[300, 520, 0.8], [805, 570, 0.5], [960, 615, 0.32]]) {
      const base = ly + 330 * s;
      line(g, lx, base, lx, ly, '#1d1d30', 10 * s); line(g, lx, ly, lx + 50 * s, ly - 10 * s, '#1d1d30', 7 * s);
      g.fillStyle = '#2a2a3a'; A.ellipse(g, lx + 58 * s, ly - 8 * s, 18 * s, 7 * s); g.fill();
      g.fillStyle = '#ffd08a'; A.ellipse(g, lx + 58 * s, ly - 4 * s, 12 * s, 4 * s); g.fill();
    }
    // wires going off the pole
    g.lineCap = 'round';
    for (const [a, b, sag, w] of [[[364, 214], [-M, 300], 40, 3], [[400, 212], [-M, 250], 35, 2.5], [[364, 214], [1110, 560], 30, 2], [[500, 212], [1130, 555], 25, 2], [[620, 214], [1990, 60], 40, 2.5]]) {
      const pts = wirePts(a, b, sag, 20); g.strokeStyle = '#0c0c1a'; g.lineWidth = w; A.path(g, pts, false); g.stroke();
    }
    // the service drop (Bit's wire), with snow on top
    const wp = wirePts(INS, ATT, 70, 30);
    g.strokeStyle = '#0c0c1a'; g.lineWidth = 4; A.path(g, wp, false); g.stroke();
    g.strokeStyle = 'rgba(235,242,255,0.9)'; g.lineWidth = 2; g.save(); g.translate(0, -2.5); A.path(g, wp.filter((p, i) => hh(i * 3.7) > 0.25), false); g.stroke(); g.restore();
    // utility pole (foreground)
    const px = 492;
    g.fillStyle = A.linear(g, px - 20, 0, px + 20, 0, [[0, '#2a1a18'], [0.35, '#6a4a3a'], [0.6, '#4a3228'], [1, '#1a0e0e']]);
    poly(g, [[px - 22, 1080 + M], [px + 22, 1080 + M], [px + 14, 150], [px - 14, 150]]); g.fill(); g.strokeStyle = O; g.lineWidth = 4; g.stroke();
    // wood grain
    for (let i = 0; i < 12; i++) { const y0 = 200 + hh(i) * 850; line(g, px - 6 + hh(i + 2) * 12, y0, px - 6 + hh(i + 2) * 12, y0 + 40 + hh(i + 3) * 80, 'rgba(20,10,10,0.45)', 1.5); }
    // snow stuck on the windward side
    g.fillStyle = 'rgba(230,238,255,0.8)'; poly(g, [[px - 22, 1080], [px - 15, 1080], [px - 8, 150], [px - 14, 150]]); g.fill();
    // crossarm
    g.fillStyle = '#4a3228'; g.fillRect(356, 206, 272, 16); g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(356, 206, 272, 16);
    rect(g, 356, 203, 272, 4, '#eef3ff');
    line(g, 400, 222, px - 10, 280, '#3a2a22', 5); line(g, 584, 222, px + 10, 280, '#3a2a22', 5);
    for (const ix of [364, 400, 584, 620]) { g.fillStyle = '#6ab0a0'; A.rrect(g, ix - 6, 196, 12, 12, 3); g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke(); }
    // transformer can
    g.fillStyle = A.linear(g, px + 18, 0, px + 70, 0, [[0, '#5a6070'], [0.4, '#9aa0b0'], [1, '#3a4050']]); A.rrect(g, px + 16, 300, 54, 86, 8); g.fill(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    rect(g, px + 14, 296, 58, 6, '#eef3ff');
    // cobra-head street light on the pole
    g.strokeStyle = '#2a2a36'; g.lineWidth = 8; g.beginPath(); g.moveTo(px + 10, 430); g.quadraticCurveTo(px + 90, 395, px + 150, 400); g.stroke();
    g.fillStyle = '#3a3a48'; A.blob(g, [[px + 140, 392], [px + 200, 390], [px + 214, 402], [px + 190, 412], [px + 142, 410]]); A.fillStroke(g, '#3a3a48', 3);
    g.fillStyle = '#ffe0a0'; A.ellipse(g, px + 176, 410, 26, 5); g.fill();
    rect(g, px + 140, 386, 70, 5, '#eef3ff');
    // sign on the pole (Toronto street name blade)
    g.fillStyle = '#1b3a8a'; g.fillRect(px - 64, 560, 128, 26); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(px - 62, 562, 124, 22);
    A.text(g, 'BATHURST ST', px, 573, { font: '700 14px Rubik', fill: '#fff' });
    // foreground snow drift at the pole base
    g.fillStyle = '#e8eeff'; A.blob(g, [[-M, 1010], [200, 990], [420, 1000], [492, 985], [620, 1010], [900, 1040], [900, 1080 + M], [-M, 1080 + M]]); g.fill();
    g.fillStyle = 'rgba(120,130,200,0.25)'; A.blob(g, [[-M, 1040], [300, 1030], [700, 1050], [900, 1080 + M], [-M, 1080 + M]]); g.fill();
    g.restore();
  }

  // A.drawTorontoStreet(ctx, t, o): o.cam {x,y,zoom} (parallax), o.snow (1 density), o.wind, o.windowGlow (1)
  A.drawTorontoStreet = (ctx, t, o = {}) => {
    const cam = o.cam || { x: 960, y: 540, zoom: 1 };
    const z0 = zoomOf(ctx) * (cam.zoom || 1), r = z0 > 1.15 ? 2 : 1;
    const W = 1920 + 2 * MARGIN, H = 1080 + 2 * MARGIN;
    const layerDraw = (img, f, live) => {
      ctx.save();
      const zf = 1 + ((cam.zoom || 1) - 1) * f, cx = 960 + (cam.x - 960) * f, cy = 540 + (cam.y - 540) * f;
      ctx.translate(960, 540); ctx.scale(zf, zf); ctx.translate(-cx, -cy);
      if (img) ctx.drawImage(img, -MARGIN, -MARGIN, W, H);
      if (live) live();
      ctx.restore();
    };
    layerDraw(hl('st_sky', W, H, 1, streetSky), 0.05);
    layerDraw(hl('st_city', W, H, r, streetCity), 0.3, () => cnTowerLive(ctx, 1185, 650, 580, t, 1));
    layerDraw(null, 0.6, () => A.drawSnow(ctx, t, { depth: [0, 0.3], count: 160, wind: o.wind ?? 0.4, seed: 11, rect: { x: -200, y: -200, w: 2320, h: 1480 } }));
    layerDraw(hl('st_set', W, H, r, streetSet), 1, () => {
      // sodium lamp glows
      for (const [lx, ly, s] of [[300, 520, 0.8], [805, 570, 0.5], [960, 615, 0.32]]) {
        const f = 0.93 + 0.07 * A.noise1(t * 3 + lx);
        A.glow(ctx, lx + 58 * s, ly - 2 * s, 170 * s, '#ffab4a', 0.55 * f);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * f; ctx.translate(lx + 58 * s, ly + 330 * s); ctx.scale(1, 0.25);
        ctx.fillStyle = A.radial(ctx, 0, 0, 0, 300 * s, [[0, '#ffab4a'], [1, 'rgba(255,171,74,0)']]); ctx.fillRect(-300 * s, -300 * s, 600 * s, 600 * s); ctx.restore();
      }
      const px = 492, f2 = 0.95 + 0.05 * A.noise1(t * 4);
      A.glow(ctx, px + 176, 414, 230, '#ffab4a', 0.6 * f2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.32 * f2; ctx.translate(px + 190, 1000); ctx.scale(1, 0.22);
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 480, [[0, '#ffab4a'], [1, 'rgba(255,171,74,0)']]); ctx.fillRect(-480, -480, 960, 960); ctx.restore();
      // light cone from the cobra head
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.09 * f2;
      ctx.fillStyle = A.linear(ctx, 0, 410, 0, 1000, [[0, '#ffc070'], [1, 'rgba(255,192,112,0)']]); poly(ctx, [[px + 150, 412], [px + 200, 412], [px + 460, 1020], [px - 60, 1020]]); ctx.fill(); ctx.restore();
      // our window: warm + TV flicker
      const wg = o.windowGlow ?? 1, W0 = A.STREET.window;
      A.glow(ctx, W0.cx, W0.cy, 150, '#ffb45e', 0.5 * wg);
      A.glow(ctx, W0.cx + 10, W0.cy, 60, '#9ff5d0', (0.15 + 0.12 * A.noise1(t * 9)) * wg);
      // chimney smoke from the row houses
      ctx.save();
      for (let c = 0; c < 3; c++) { const base = pq(ROW, 0.2 + c * 0.22, 1.02, RZR); for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6 + c * 0.3) % 1; const x = base[0] + ph * 60 + Math.sin(t + i) * 6, y = base[1] - ph * 140; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.18; ctx.fillStyle = A.radial(ctx, x, y, 0, 20 + ph * 40, [[0, '#b8b8d8'], [1, 'rgba(184,184,216,0)']]); ctx.fillRect(x - 60, y - 60, 120, 120); } }
      ctx.restore();
    });
    // foreground snow (screen space, near)
    A.drawSnow(ctx, t, { depth: [0.35, 0.8], count: Math.round(120 * (o.snow ?? 1)), wind: o.wind ?? 0.4, seed: 12 });
    A.drawSnow(ctx, t, { depth: [0.9, 1], count: Math.round(14 * (o.snow ?? 1)), wind: o.wind ?? 0.4, seed: 13, alpha: 0.7 });
  };
})();
