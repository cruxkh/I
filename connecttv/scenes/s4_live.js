// s4_live: "וכל השידורים החיים מישראל"  (voice window 11.0 to 13.3)
// The Bollywood HOLD (`ind`, v=11.03) sits at the very start of this scene. The hold freezes the voice clock, so the entry
// wipe is driven by a "virtual voice clock" tv: during the hold's last ~0.11 s tv runs up to 11.03 (using the output clock A.T),
// so the wipe lands exactly when the hold releases and the badge slams on the word "וכל" (11.05).
// Beats: 11.05 LIVE badge slam | 11.15..11.63 channel wall pops in 4 syllable beats | 11.78 heartbeat + giant ring
//        12.16 blue-white Israel constellation + rising splash | 12.7..13.3 held idle sparkle beat.
(() => {
  const { clamp, lerp, inv, ease, hash } = A, C = CL.C, W = 1920, H = 1080, CX = 960, TAU = A.TAU;
  const G = (d, m, s) => Math.exp(-.5 * ((d - m) / s) ** 2);
  const mixHex = (a, b, k) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), c = sh => Math.round(lerp((p >> sh) & 255, (q >> sh) & 255, k)); return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const T_LIVE = 11.05, T_HEART = 11.78, T_ISR = 12.16, HOLD_V = 11.03;
  const BLUE = '#8fd0ff', ICE = '#eaf6ff';
  const WAVE_V = 8000;            // px/s speed of the entry wipe band (top to bottom)
  const WALL_CY = 500, MAP_CY = 520;

  // ---------------------------------------------------------------- channel tiles
  // wall = [cx, cy, w, h] (11.15..12.16), fl = flank position (12.16+), lg = logo box fractions of the tile
  const FW = 330, FH = 240;
  // wall = 4 columns x 2 rows; the columns pop from right to left, one per syllable (RTL reading order)
  const TILES = [
    { k: 'ch14', fill: '#ffffff', dark: '#d5dcff', wall: [1650, 350, 420, 280], fl: [1695, 370], lg: [.8, .8], t0: 11.15, city: [35.53, 32.79], spin: .10 },
    { k: 'kan11', fill: '#2F6BFF', dark: '#1a2fb0', wall: [1650, 660, 420, 280], fl: [1695, 630], lg: [.78, .8], t0: 11.18, city: [35.02, 30.35], spin: -.10, sh: 1 },
    { k: 'ch9', fill: '#ffffff', dark: '#d5dcff', wall: [1190, 350, 420, 280], fl: [1345, 370], lg: [.8, .8], t0: 11.30, city: [35.21, 31.77], spin: -.09 },
    { k: 'reshet13', fill: '#ffffff', dark: '#d5dcff', wall: [1190, 660, 420, 280], fl: [1345, 630], lg: [.8, .76], t0: 11.33, city: [35.42, 31.50], spin: .09, rc: 1 },
    { k: 'keshet12', fill: '#ffffff', dark: '#d5dcff', wall: [730, 350, 420, 280], fl: [575, 370], lg: [.8, .78], t0: 11.45, city: [34.78, 32.08], spin: .08 },
    { k: 'i24', fill: '#8B3DFF', dark: '#4a1fb8', wall: [730, 660, 420, 280], fl: [575, 630], lg: [.8, .8], t0: 11.48, city: [34.79, 31.25], spin: -.08, sh: 1 },
    { k: 'yesbrand', fill: '#FF8A1F', dark: '#c25400', wall: [270, 350, 420, 280], fl: [225, 370], lg: [.76, .8], t0: 11.60, city: [34.99, 32.82], spin: .10, sh: 1 },
    { k: 'hotbrand', fill: '#FF3B4E', dark: '#b3001b', wall: [270, 660, 420, 280], fl: [225, 630], lg: [.72, .78], t0: 11.63, city: [34.85, 30.62], spin: -.10, sh: 1 },
  ];

  // ---------------------------------------------------------------- Israel outline (lon, lat), constellation nodes
  const OUT = [[35.10, 33.09], [35.30, 33.08], [35.45, 33.10], [35.58, 33.27], [35.80, 33.32], [35.84, 33.10], [35.85, 32.90], [35.78, 32.75], [35.62, 32.68], [35.56, 32.40], [35.55, 32.10], [35.55, 31.85], [35.47, 31.75], [35.42, 31.35], [35.38, 31.05], [35.20, 30.75], [35.15, 30.30], [35.00, 30.00], [34.93, 29.55], [34.89, 29.49], [34.78, 29.95], [34.62, 30.45], [34.45, 30.85], [34.27, 31.22], [34.37, 31.32], [34.49, 31.47], [34.56, 31.60], [34.64, 31.80], [34.75, 32.05], [34.80, 32.20], [34.87, 32.45], [34.93, 32.68], [34.98, 32.82], [35.07, 32.93]];
  const MS = 175, P = (lon, lat) => [CX + (lon - 35.06) * .84 * MS, MAP_CY - (lat - 31.405) * MS];
  const OPX = OUT.map(([a, b]) => P(a, b));
  const PL = OPX.reduce((s, p, i) => { const q = OPX[(i + 1) % OPX.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
  const CITY_LINKS = [[[35.53, 32.79], [34.99, 32.82]], [[34.99, 32.82], [34.78, 32.08]], [[34.78, 32.08], [35.21, 31.77]], [[35.21, 31.77], [34.79, 31.25]], [[35.21, 31.77], [35.42, 31.50]], [[34.79, 31.25], [34.85, 30.62]], [[34.85, 30.62], [35.02, 30.35]], [[35.53, 32.79], [35.72, 33.05]], [[35.42, 31.50], [35.02, 30.35]]];
  const EXTRA_NODES = [[35.72, 33.05], [34.86, 32.33], [34.95, 29.55], [35.30, 32.70]];
  const TEL_AVIV = [34.78, 32.08];

  // ---------------------------------------------------------------- beats (ECG + rings)
  const BEATS = [{ t: 11.28, a: .4 }, { t: 11.53, a: .45 }, { t: 11.78, a: 1.7 }, { t: 12.03, a: 1.3 }, { t: 12.20, a: .8 }, { t: 12.56, a: .55 }, { t: 12.94, a: .55 }, { t: 13.3, a: .5 }];
  const PULSES = [11.05, 11.28, 11.53, 11.78, 12.03, 12.16, 12.56, 12.94, 13.3];
  const pulse = tv => { let k = 0; for (const b of PULSES) if (tv >= b) k = Math.max(k, Math.exp(-(tv - b) * 9)); return k; };
  const RINGS = [
    { t: 11.05, c: [CX, 430], R: 1200, dur: .6, col: '#FF6A7E', lw: 34, amp: 0 },
    { t: 11.78, c: [CX, WALL_CY], R: 1500, dur: .75, col: '#FF3B4E', lw: 64, amp: .085 },
    { t: 12.03, c: [CX, WALL_CY], R: 1200, dur: .65, col: '#FF2E93', lw: 44, amp: .05 },
    { t: 12.16, c: [CX, MAP_CY], R: 1700, dur: .9, col: BLUE, lw: 52, amp: .05 },
    { t: 12.62, c: [CX, MAP_CY], R: 1000, dur: .8, col: '#bfe4ff', lw: 22, amp: 0 },
    { t: 13.0, c: [CX, MAP_CY], R: 1000, dur: .8, col: '#bfe4ff', lw: 22, amp: 0 },
  ];
  const ecgShape = d => .12 * G(d, -.06, .03) - .12 * G(d, 0, .012) + G(d, .04, .014) - .3 * G(d, .08, .016) + .28 * G(d, .2, .05);
  const ecg = tt => { let v = 0; for (const b of BEATS) { const d = tt - b.t; if (d > -.15 && d < .5) v += b.a * ecgShape(d); } return v; };

  let OFFC = null;
  const getOff = () => { if (!OFFC) { OFFC = document.createElement('canvas'); OFFC.width = W; OFFC.height = H; } OFFC.width = W; return OFFC; };
  const scan = () => CL.layer('s4_scan', 8, 8, g => { g.fillStyle = 'rgba(5,8,38,.05)'; g.fillRect(0, 0, 8, 2); });

  // ---------------------------------------------------------------- LIVE badge (origin = centre, 700 x 250 at scale 1)
  function liveBadge(g, tv, sc, dotK) {
    g.save(); g.scale(sc, sc);
    const w = 700, h = 250, r = 125, pl = pulse(tv);
    // broadcast signal arcs (left and right), sweeping outward in sequence
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const ph = (tv * 1.7 + k / 3) % 1, rr = 385 + ph * 240, al = Math.pow(1 - ph, 1.4);
      [[-.5, .5], [Math.PI - .5, Math.PI + .5]].forEach(([a0, a1]) => {
        g.strokeStyle = '#FF5A6E'; g.globalAlpha = al * .45; g.lineWidth = 34 * (1 - ph * .5); g.beginPath(); g.arc(0, 0, rr, a0, a1); g.stroke();
        g.strokeStyle = '#fff'; g.globalAlpha = al * .9; g.lineWidth = 12 * (1 - ph * .5); g.beginPath(); g.arc(0, 0, rr, a0, a1); g.stroke();
      });
    }
    g.restore();
    g.fillStyle = 'rgba(2,4,30,.45)'; g.beginPath(); g.roundRect(-w / 2 + 6, -h / 2 + 20, w, h, r); g.fill();
    g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.fillStyle = A.linear(g, 0, -h / 2, 0, h / 2, [[0, '#FF6A6A'], [.5, '#FF2A3F'], [1, '#B3001B']]); g.fill();
    g.lineWidth = 9; g.strokeStyle = '#fff'; g.stroke();
    g.save(); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.clip(); g.fillStyle = A.linear(g, 0, -h / 2, 0, 0, [[0, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,.04)']]); g.beginPath(); g.ellipse(0, -h * .27, w * .46, h * .3, 0, 0, TAU); g.fill(); g.restore();
    // pulsing dot
    g.save(); g.translate(-245, 0); g.fillStyle = A.radial(g, 0, 0, 0, 120, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); g.globalAlpha = .5 + .5 * pl; g.beginPath(); g.arc(0, 0, 120 * (.8 + .3 * pl), 0, TAU); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 46 * (1 + .12 * pl), 0, TAU); g.fill(); g.restore();
    // text
    g.font = '900 172px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.letterSpacing = '4px'; g.lineJoin = 'round';
    g.strokeStyle = '#7a0012'; g.lineWidth = 22; g.strokeText('LIVE', 60, 10); g.fillStyle = '#fff'; g.fillText('LIVE', 60, 10); g.letterSpacing = '0px';
    g.restore();
  }

  function livePill(g, x, y, s, tv, i) {
    g.save(); g.translate(x, y); g.scale(s, s); const p = .5 + .5 * Math.sin(tv * 7 + i * 1.9);
    g.fillStyle = 'rgba(2,4,30,.35)'; g.beginPath(); g.roundRect(2, 5, 94, 36, 18); g.fill();
    g.fillStyle = '#FF2A3F'; g.beginPath(); g.roundRect(0, 0, 94, 36, 18); g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(20, 18, 6.5 + 2.2 * p, 0, TAU); g.fill();
    g.font = '900 19px Rubik'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.letterSpacing = '1px'; g.fillText('LIVE', 34, 19.5); g.letterSpacing = '0px'; g.restore();
  }

  // ---------------------------------------------------------------- tiles
  function tileState(tl, i, tv) {
    const wp = CL.pop(tv, tl.t0 - .09, .32);
    const q = clamp((tv - (12.12 + i * .028)) / .46), e = ease.outBack(q), eb = ease.inOut(q);
    const [wx, wy, ww, wh] = tl.wall, [fx, fy] = tl.fl;
    let x = lerp(wx, fx, e), y = lerp(wy, fy, e) - Math.sin(q * Math.PI) * 60, w = lerp(ww, FW, eb), h = lerp(wh, FH, eb);
    const arr = ease.out(inv(12.55, 12.8, tv)); y += Math.sin(tv * 2.3 + i * 1.3) * 6 * arr; x += Math.sin(tv * 1.7 + i * 2.1) * 3 * arr;
    let bump = 0; const d = Math.hypot(x - CX, y - WALL_CY);
    for (const r of RINGS) { if (!r.amp) continue; const u = (tv - r.t) / r.dur; if (u > 0 && u < 1) bump += r.amp * G(d, r.R * ease.out(u), 130) * (1 - u); }
    const rot = (1 - Math.min(1, wp)) * (i % 2 ? -.4 : .4) + Math.sin(q * Math.PI) * tl.spin;
    return { x, y, w, h, sc: wp * (1 + bump), rot, wp, q };
  }
  function drawTile(g, tl, i, tv, st) {
    const { x, y, w, h, sc, rot } = st, isk = ease.inOut(inv(12.16, 12.5, tv)), r = Math.min(w, h) * .26;
    if (isk > 0) A.glow(g, x, y, Math.max(w, h) * .8, '#19C8FF', .32 * isk);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    CL.gel(g, 0, 0, w, h, { fill: tl.fill, dark: tl.dark, rim: isk > 0 ? A.mixc('#ffffff', '#cfeaff', isk) : 'rgba(255,255,255,.85)', rimW: 6, shadow: 18, r });
    g.save(); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.clip();
    // candy screen flicker + sweeping scan band + scanlines
    const hue = (tv * 110 + i * 47) % 360, fl = Math.max(0, A.noise1(tv * 6 + i * 11));
    g.fillStyle = `hsla(${hue},100%,62%,${.05 + .18 * fl})`; g.fillRect(-w / 2, -h / 2, w, h);
    const by = ((tv * .85 + i * .31) % 1.5 - .25) * h - h / 2, hue2 = (hue + 90) % 360;
    g.fillStyle = A.linear(g, 0, by - 46, 0, by + 46, [[0, `hsla(${hue2},100%,65%,0)`], [.5, `hsla(${hue2},100%,72%,.30)`], [1, `hsla(${hue2},100%,65%,0)`]]); g.fillRect(-w / 2, by - 46, w, 92);
    g.fillStyle = g.createPattern(scan(), 'repeat'); g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
    const im = CL.logoImg(tl.k);
    if (im) {
      const s = Math.min(tl.lg[0] * w / im.width, tl.lg[1] * h / im.height), dw = im.width * s, dh = im.height * s, ly = h * .05;
      if (tl.sh) { g.globalAlpha = .38; g.drawImage(CL.silhouette(im, '#050826'), -dw / 2, -dh / 2 + ly + 7, dw, dh); g.globalAlpha = 1; }
      if (tl.rc) { g.save(); g.beginPath(); g.roundRect(-dw / 2, -dh / 2 + ly, dw, dh, dw * .12); g.clip(); g.drawImage(im, -dw / 2, -dh / 2 + ly, dw, dh); g.restore(); }
      else g.drawImage(im, -dw / 2, -dh / 2 + ly, dw, dh);
    }
    livePill(g, -w / 2 + r * .55, -h / 2 + 16, w > 400 ? 1 : .86, tv, i);
    g.restore();
  }

  // ---------------------------------------------------------------- map
  const NODE_TW = (g, x, y, tv, i, s) => { const k = .55 + .45 * Math.sin(tv * 3 + i * 2.3); A.glow(g, x, y, 46 * s, '#7fd0ff', .5 * k); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 7 * s, 0, TAU); g.fill(); CL.spark(g, x, y, (20 + 12 * k) * s, tv * .5 + i, '#fff'); };
  function drawMap(g, tv, states) {
    const pm = clamp((tv - T_ISR) / .42); if (pm <= 0) return;
    A.glow(g, CX, MAP_CY, 560, '#4aa8ff', .5 * ease.out(pm)); A.glow(g, CX, MAP_CY, 300, '#ffffff', .22 * ease.out(pm));
    const sc = .86 + .14 * CL.pop(tv, T_ISR - .03, .5);
    g.save(); g.translate(CX, MAP_CY); g.scale(sc, sc); g.translate(-CX, -MAP_CY);
    const path = () => { g.beginPath(); OPX.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    path(); g.save(); g.globalAlpha = ease.inOut(inv(.2, 1, pm)) * .8; g.fillStyle = A.linear(g, 0, 185, 0, 860, [[0, '#ffffff'], [.4, '#9fd4ff'], [1, '#2F6BFF']]); g.fill(); g.restore();
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash([PL * pm, PL * 2]);
    path(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = '#19C8FF'; g.globalAlpha = .13; g.lineWidth = 40; g.stroke(); g.globalAlpha = .22; g.lineWidth = 20; g.stroke();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = .95; g.strokeStyle = '#fff'; g.lineWidth = 7; g.stroke();
    g.restore();
    if (pm >= 1) { g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.globalCompositeOperation = 'lighter'; g.setLineDash([PL * .06, PL * .94]); g.lineDashOffset = -tv * PL * .3; path(); g.strokeStyle = '#9fe0ff'; g.lineWidth = 22; g.globalAlpha = .5; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 9; g.globalAlpha = 1; g.stroke(); g.restore(); }
    // constellation links + nodes
    const cal = ease.inOut(inv(.35, 1, pm));
    g.save(); g.strokeStyle = 'rgba(220,240,255,.7)'; g.lineWidth = 3; g.globalAlpha = cal * .8;
    CITY_LINKS.forEach(([a, b]) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); });
    g.restore();
    g.save(); g.globalAlpha = cal;
    OPX.forEach((p, i) => { if (i % 3 === 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fill(); } });
    let ni = 0; const seen = new Set();
    [...CITY_LINKS.flat(), ...EXTRA_NODES].forEach(c => { const key = c.join(','); if (seen.has(key)) return; seen.add(key); const p = P(c[0], c[1]); NODE_TW(g, p[0], p[1], tv, ni++, .75); });
    // red LIVE dot on Tel Aviv
    const ta = P(TEL_AVIV_0(), TEL_AVIV_1()), pl = pulse(tv), bl = .5 + .5 * Math.sin(tv * 7);
    g.fillStyle = A.radial(g, ta[0], ta[1], 0, 60, [[0, 'rgba(255,59,78,.75)'], [1, 'rgba(255,59,78,0)']]); g.beginPath(); g.arc(ta[0], ta[1], 60 * (.8 + .3 * bl + .2 * pl), 0, TAU); g.fill();
    g.fillStyle = '#FF2A3F'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(ta[0], ta[1], 12 + 2.5 * pl, 0, TAU); g.fill(); g.stroke();
    g.restore();
    g.restore();
    // feed lines from tiles to their city
    const la = ease.out(inv(12.42, 12.75, tv));
    if (la > 0) states.forEach((st, i) => {
      const tl = TILES[i], right = tl.fl[0] > CX, x0 = tl.fl[0] + (right ? -FW / 2 : FW / 2) * ease.inOut(st.q), y0 = st.y, c = P(tl.city[0], tl.city[1]);
      const cx = (x0 + c[0]) / 2, cy = (y0 + c[1]) / 2 + (i % 2 ? 34 : -34);
      g.save(); g.globalAlpha = la * .85; g.strokeStyle = 'rgba(200,232,255,.85)'; g.lineWidth = 3.5; g.setLineDash([12, 10]); g.lineDashOffset = -tv * 60; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, c[0], c[1]); g.stroke(); g.setLineDash([]);
      const u = (tv * .55 + i * .137) % 1, mx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * c[0], my = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * c[1];
      A.glow(g, mx, my, 34, '#7fd0ff', .9); g.fillStyle = '#fff'; g.beginPath(); g.arc(mx, my, 7.5, 0, TAU); g.fill(); g.restore();
    });
  }
  const TEL_AVIV_0 = () => TEL_AVIV[0], TEL_AVIV_1 = () => TEL_AVIV[1];

  // ---------------------------------------------------------------- liquid rise (blue/white splash)
  function liquid(g, tv) {
    const k = ease.out(inv(12.06, 12.62, tv)); if (k <= 0) return;
    const y0 = lerp(H + 60, 855, k) + Math.sin(tv * 2.4) * 6 * k;
    [['#2F6BFF', .6, 46, 0], ['#19C8FF', .55, 22, 1.7], [ICE, 1, 0, 3.1]].forEach(([col, al, off, ph], li) => {
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W + 12; x += 12) g.lineTo(x, y0 + off + Math.sin(x * .008 + tv * 2.1 + ph) * 24 * (.6 + .4 * k) + Math.sin(x * .021 - tv * 3.3 + ph * 2) * 9); g.lineTo(W, H); g.closePath();
      g.fillStyle = li < 2 ? A.linear(g, 0, y0, 0, H, [[0, A.hex(col, al)], [1, A.hex(col, al * .5)]]) : A.linear(g, 0, y0, 0, y0 + 220, [[0, A.hex('#ffffff', .92)], [.1, A.hex('#a9d6ff', .55)], [1, A.hex('#3a6bff', .45)]]); g.fill();
    });
    for (let i = 0; i < 16; i++) { const bx = hash(i * 3.7) * W, by = y0 + 40 + ((hash(i) * 200 - tv * (30 + hash(i + 3) * 40)) % 200 + 200) % 200; g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(bx + Math.sin(tv * 2 + i) * 10, by, 6 + hash(i + 8) * 10, 0, TAU); g.fill(); }
  }

  // ---------------------------------------------------------------- header: LIVE badge + ECG monitor
  function ecgStrip(g, tv) {
    const x0 = 470, x1 = 1876, yb = 112, y0 = 36, hh = 152, al = ease.out(inv(11.25, 11.45, tv)); if (al <= 0) return;
    const isk = ease.inOut(inv(12.16, 12.4, tv)), lc = mixHex('#FF3B4E', '#9fe0ff', isk);
    g.save(); g.globalAlpha = al;
    g.fillStyle = 'rgba(5,8,38,.55)'; g.beginPath(); g.roundRect(x0 - 12, y0, x1 - x0 + 24, hh, 44); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.25)'; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; for (let x = x0 + 20; x < x1; x += 60) { g.beginPath(); g.moveTo(x, y0 + 14); g.lineTo(x, y0 + hh - 14); g.stroke(); } for (let y = y0 + 20; y < y0 + hh - 10; y += 28) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    const SPD = 680, pts = []; for (let x = x0; x <= x1; x += 3) pts.push([x, yb - ecg(tv - (x1 - x) / SPD) * 46]);
    g.save(); g.beginPath(); g.roundRect(x0 - 12, 6, x1 - x0 + 24, 200, 44); g.clip(); g.lineJoin = 'round'; g.lineCap = 'round';
    const draw = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = lc; g.globalAlpha = al * .3; g.lineWidth = 24; draw(); g.globalAlpha = al * .8; g.lineWidth = 11; draw();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = al; g.strokeStyle = '#fff'; g.lineWidth = 5; draw();
    const hy = pts[pts.length - 1][1]; A.glow(g, x1, hy, 46, lc, .9); g.fillStyle = '#fff'; g.beginPath(); g.arc(x1, hy, 10, 0, TAU); g.fill();
    g.restore(); g.restore();
  }

  // ---------------------------------------------------------------- everything inside the scene (drawn to ctx or to an offscreen during the entry wipe)
  function content(g, tv) {
    g.save();
    const shk = CL.shake(tv, T_LIVE, .38, 15);
    if (tv > T_LIVE && tv < T_LIVE + .4) { g.translate(W / 2 + shk[0], H / 2 + shk[1]); g.scale(1.03, 1.03); g.translate(-W / 2, -H / 2); }
    const bl = ease.inOut(inv(T_ISR, T_ISR + .5, tv));
    CL.bg(g, tv, { tint: [mixHex(C.red, C.cyan, bl), mixHex(C.purple, C.blue, bl), mixHex(C.pink, '#9fd4ff', bl * .8)] });
    CL.vignette(g, .5);
    // heartbeat glow pulses on the whole stage
    [[T_HEART, '#FF3B4E', .5], [12.03, '#FF2E93', .35], [T_ISR, '#8fd0ff', .55]].forEach(([t, col, a]) => { if (tv > t) A.glow(g, CX, WALL_CY, 1300, col, a * Math.exp(-(tv - t) * 6)); });
    g.save(); g.globalAlpha = .06; g.fillStyle = '#fff'; const ry = ((tv * .35) % 1.3 - .15) * H; g.fillRect(0, ry, W, 90); g.restore();
    liquid(g, tv);
    // rising blue/white splash: glossy drops fly up from the rising liquid (parabolic arcs)
    for (let i = 0; i < 22; i++) {
      const t0 = 12.12 + hash(i * 1.7) * .16, u = tv - t0; if (u <= 0 || u > 1.05) continue;
      const x0 = 180 + hash(i * 3.3 + 1) * 1560, vx = (hash(i + 7) - .5) * 160, vy = 620 + hash(i * 5.1) * 620, y = 880 - vy * u + 1500 * u * u, r = 16 + hash(i * 2.9) * 30 * (1 - u * .35);
      if (y > H + 40) continue; g.save(); g.globalAlpha = Math.min(1, (1.05 - u) * 4); CL.drop(g, x0 + vx * u, y, r, ['#ffffff', '#8fd0ff', '#19C8FF', '#2F6BFF'][i % 4], tv, i); g.restore();
    }
    // tile states, pop splashes
    const states = TILES.map((tl, i) => tileState(tl, i, tv));
    drawMap(g, tv, states);
    TILES.forEach((tl, i) => {
      const st = states[i]; if (st.wp <= .002) return;
      const u = (tv - tl.t0) / .5;
      if (u > 0 && u < 1) { g.save(); g.globalAlpha = (1 - u) * (1 - u); CL.splash(g, st.x, st.y, tl.wall[3] * .62 + 70, ease.out(u), i + 3, CL.CAND); g.restore(); }
    });
    TILES.forEach((tl, i) => { if (states[i].wp > .002) drawTile(g, tl, i, tv, states[i]); });
    TILES.forEach((tl, i) => { const u = (tv - tl.t0) / .45; if (u > 0 && u < 1) { const st = states[i]; CL.spark(g, st.x + st.w / 2 - 20, st.y - st.h / 2 + 10, 44 * Math.sin(u * Math.PI), tv * 3, '#fff'); CL.spark(g, st.x - st.w / 2 + 30, st.y + st.h / 2 - 14, 30 * Math.sin(u * Math.PI), -tv * 2, C.yellow); } });
    // idle twinkles (voice pause)
    const twk = ease.inOut(inv(12.4, 12.9, tv)); if (twk > 0) { g.save(); g.globalAlpha = twk; CL.twinkle(g, tv, 60, 200, 1800, 620, 40, 5, ['#ffffff', '#9fd4ff', C.cyan, '#ffffff', C.yellow]); g.restore(); }
    // rings (giant live beat ring etc.)
    RINGS.forEach(r => {
      const u = (tv - r.t) / r.dur; if (u <= 0 || u >= 1) return; const rr = r.R * ease.out(u), a = Math.pow(1 - u, 1.3), lw = r.lw * (1 - u * .7) + 4;
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = r.col; g.globalAlpha = a * .85; g.lineWidth = lw; g.beginPath(); g.arc(r.c[0], r.c[1], rr, 0, TAU); g.stroke();
      g.strokeStyle = '#fff'; g.globalAlpha = a * .8; g.lineWidth = lw * .3; g.stroke(); g.restore();
    });
    // header: ECG monitor + LIVE badge (big slam, then it shrinks to the header)
    ecgStrip(g, tv);
    const hb = ease.outBack(clamp((tv - 11.17) / .42)), bx = lerp(CX, 250, hb), by = lerp(430, 112, hb), bs = lerp(1.5, .5, hb);
    const k = clamp((tv - 10.93) / .12), u0 = Math.max(0, tv - T_LIVE), squash = 1 - .14 * Math.exp(-u0 * 14) * Math.cos(u0 * 36) * (tv > T_LIVE ? 1 : 0);
    const slam = lerp(2.0, 1, ease.out(k)) * squash;
    g.save(); g.translate(bx, by); liveBadge(g, tv, bs * slam * (1 + .06 * pulse(tv)), 0); g.restore();
    // entry bolts + glow
    const bp = clamp((tv - 11.0) / .05), ba = tv < 11.08 ? 1 : 1 - inv(11.08, 11.17, tv);
    if (bp > 0 && ba > 0) { CL.bolt(g, 330, -40, 700, 300, bp, 4, { col: '#FF5A6E', lw: 16, alpha: ba }); CL.bolt(g, 1590, -40, 1220, 300, bp, 9, { col: '#FF5A6E', lw: 16, alpha: ba }); }
    // held beat: sparkle burst + sheen (voice pause 12.7 to 13.08)
    const bu = (tv - 12.72) / .8;
    if (bu > 0 && bu < 1) for (let j = 0; j < 18; j++) { const an = j / 18 * TAU + hash(j) * .3, rr = lerp(80, 300 + hash(j + 4) * 260, ease.out(bu)); CL.spark(g, CX + Math.cos(an) * rr * 1.9, MAP_CY + Math.sin(an) * rr * .95, (16 + hash(j * 2) * 24) * Math.sin(Math.min(1, bu * 1.15) * Math.PI), tv * 2 + j, j % 3 ? '#fff' : '#9fe0ff'); }
    const sh = (tv - 12.66) / .42;
    if (sh > 0 && sh < 1) { const sx = lerp(-400, W + 300, ease.inOut(sh)); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .33 * Math.sin(sh * Math.PI); g.fillStyle = A.linear(g, sx - 120, 0, sx + 120, 0, [[0, 'rgba(255,255,255,0)'], [.5, '#cfe9ff'], [1, 'rgba(255,255,255,0)']]); g.translate(CX, 540); g.rotate(.35); g.translate(-CX, -540); g.fillRect(sx - 120, -700, 240, H + 1400); g.restore(); }
    // blue-white flash on "מישראל"
    if (tv > T_ISR && tv < T_ISR + .16) { g.save(); g.globalAlpha = .45 * Math.pow(1 - (tv - T_ISR) / .16, 2); g.fillStyle = ICE; g.fillRect(0, 0, W, H); g.restore(); }
    g.restore();
  }

  // ---------------------------------------------------------------- entry wipe: candy liquid band pours down (top to bottom), glitch + white flash on the word
  function entry(ctx, tv) {
    const off = getOff(), og = off.getContext('2d'); content(og, tv);
    const yT = 620 + (tv - T_LIVE) * WAVE_V, OFFS = [0, 26, 120, 210, 290, 380];
    const drip = (x, f) => f * (120 * Math.pow(Math.max(0, Math.sin(x * .014 + 1.1)), 8) + 70 * Math.pow(Math.max(0, Math.sin(x * .025 + 4)), 10));
    const edge = (j, x) => yT + OFFS[j] + Math.sin(x * .008 + tv * 20 + j * 1.9) * (10 + 5 * j) + Math.sin(x * .021 - tv * 27 + j) * 7 + (j === 5 ? drip(x, 1) : j === 4 ? drip(x, .5) : 0);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, -10); for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, edge(0, x)); ctx.lineTo(W, -10); ctx.closePath(); ctx.clip();
    ctx.drawImage(off, 0, 0);
    // glitch slices (a few frames around the word start)
    const ga = tv < 11.0 ? 0 : 1 - inv(11.03, 11.17, tv);
    if (ga > 0) {
      const q = Math.floor(tv * 30 + 1e-6);
      for (let i = 0; i < 9; i++) { const sy = hash(q * 7 + i * 3.3) * H, shh = 10 + hash(q * 3 + i * 1.7) * 44, dx = (hash(q * 5 + i * 2.1) - .5) * 220 * ga; ctx.drawImage(off, 0, sy, W, shh, dx, sy, W, shh); }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { ctx.globalAlpha = .55 * ga; ctx.fillStyle = i % 2 ? '#19C8FF' : '#FF2E93'; ctx.fillRect(0, hash(q * 9 + i * 4.4) * H, W, 4 + hash(q + i) * 9); }
    }
    ctx.restore();
    // candy stripes
    const cols = ['#ffffff', '#FF3B4E', C.pink, C.orange, C.yellow];
    for (let j = 0; j < 5; j++) {
      ctx.beginPath(); for (let x = 0; x <= W + 12; x += 12) x ? ctx.lineTo(x, edge(j, x)) : ctx.moveTo(x, edge(j, x));
      for (let x = W + 12; x >= 0; x -= 12) ctx.lineTo(x, edge(j + 1, x)); ctx.closePath(); ctx.fillStyle = cols[j]; ctx.fill();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); for (let x = 0; x <= W + 12; x += 12) x ? ctx.lineTo(x, edge(2, x) + 12) : ctx.moveTo(x, edge(2, x) + 12); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 10; i++) { const x = hash(i * 3.1 + 1) * W, y = edge(5, x) + 20 + hash(i) * 110; if (y < H + 40) CL.drop(ctx, x, y, 14 + hash(i + 5) * 26, CL.CAND[i % 8], tv, i); }
    // white flash on "וכל"
    const fa = tv < T_LIVE ? .75 * inv(10.99, T_LIVE, tv) : .75 * Math.pow(1 - inv(T_LIVE, 11.2, tv), 2);
    if (fa > 0) { ctx.save(); ctx.globalAlpha = fa; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  A.scene({
    name: 's4_live', start: 10.9, end: 13.3,
    draw(ctx, s) {
      const hd = TLF.holdAt(A.T), inHold = hd && hd.k === 'ind';
      if (!inHold && s.t < HOLD_V) return;                                   // the s3 Bollywood poster owns the screen until the hold ends
      const tv = inHold ? HOLD_V + hd.age - hd.d : s.t;                        // virtual voice clock (runs into the last 0.11 s of the hold)
      if (tv < 10.9) return;
      // CUE 11.03 wipe-whoosh (band starts 0.13 s before the hold releases; output T = 14.40)
      // CUE 11.05 live-slam (white flash + glitch + bolts + LIVE badge impact on "וכל")
      if (620 + (tv - T_LIVE) * WAVE_V > H + 90) content(ctx, tv); else entry(ctx, tv);
      // CUE 11.15 tile-pop-1 (Channel 14 + Kan 11 on "ה" of השידורים)
      // CUE 11.30 tile-pop-2 (Channel 9 + Reshet 13)
      // CUE 11.45 tile-pop-3 (Keshet 12 + i24)
      // CUE 11.60 tile-pop-4 (yes + HOT)
      // CUE 11.78 heartbeat-lub (giant red beat ring + ECG spike on "החיים")
      // CUE 12.03 heartbeat-dub (second beat ring)
      // CUE 12.16 israel-blue-white-riser-hit (flash + rising splash + constellation draws on "מישראל")
      // CUE 12.72 sparkle-ding (held idle beat: sparkle burst + sheen sweep in the voice pause)
    },
  });
})();
