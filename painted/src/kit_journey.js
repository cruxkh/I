// kit_journey.js: the journey sets, hand-painted (watercolour fills, ink, glow). All pure functions of t.
// Every function paints in SCREEN space unless it says otherwise; wrap it in your own camBegin/camEnd for pushes.
//
// PERF NOTE (p5.brush on soft-gl): a watercolour `fill` on a long sliver narrower than ~12 px can take MINUTES;
// thin things here are wash, inkLine or glow only.
//
// ── fibreTunnel(t, o) ── inside the internet: glowing fibre tunnel in one-point perspective (whole frame).
//    o.speed  1     how fast the light rings / fibre streaks rush past (0 = parked, 3 = boost)
//    o.z      t*speed*1.4   travel distance (override for exact control; rings are 1 unit apart)
//    o.jam    0..1  red brake-light mood: rings and streaks go red/amber, streaks slow, red warning lamps blink
//    o.boost  0..1  extra: long white-gold speed streaks, brighter vanishing point (the 56.5 BOOST / 57.7 open fibre)
//    o.vp     [960, 430]  vanishing point (screen). Also exported as TUNNEL.vp.
//    Perspective (for staging packets): a floor point at lateral X (px measured at depth 1) and depth d (>0) is
//      tunnelAt(X, d, o) -> [x, y, s]  with x = vp.x + X/d, y = vp.y + 560/d, s = 1/d (scale for a sprite whose size
//      is right at depth 1, i.e. standing at y≈990). Floor spans X in ±420, lanes centred at X = -280, 0, +280
//      (TUNNEL.lanes). Ring radius at depth d is 700/d, centred on vp. The middle lane is kept calm and dim so a queue
//      of packets reads on it; the light show lives on the walls and ceiling.
//
// ── ocean(t, o) ── deep sea (whole frame): painted light shafts, marine snow, far rocks, kelp, jellyfish, sandy floor
//    and the glowing translucent undersea cable lying on it.
//    o.scroll 0     world x offset in px (camera travelling right = increase it). Parallax: shafts .1, far rocks .25,
//                   jellies .4/.7, kelp .6, floor + cable 1.
//    o.glowX  null  screen x of Bit's pulse inside the cable: the cable core flares gold around it
//    o.city   0..1  arrival: warm Toronto lights shimmer through the surface above (68.4)
//    o.dark   0..1  deeper/darker grade (default .2)
//    o.jelly  true  draw the jellyfish
//    cableY(x, o) -> screen y of the cable centre line at screen x (same o.scroll). Cable thickness ≈ 34 px.
//    cablePt(x, o) -> [x, y, angle] (angle of the cable there, radians)
// ── routeMap(x, y, w, h, t, o) ── small painted map inset, (x, y) = top-left, w×h (≈ 560×280 suits 1080p).
//    Mediterranean → Gibraltar → Atlantic → St Lawrence → Great Lakes; pins TLV / Marseille / Gibraltar / Halifax /
//    Toronto with Hebrew + English labels (Rubik). Route painted up to the progress dot.
//    o.p     0..1   progress dot along the route (pins light up as they are passed). Pin stops: ROUTE_STOPS
//                   = { tlv:0, marseille:.29, gibraltar:.40, halifax:.84, toronto:1 }
//    o.km    number km counter (default round(o.p * 10400)); o.labels (default true); o.alpha 0..1 fade in
// ── torontoStreet(t, o) ── snowy Toronto street at night (whole frame, WORLD coords ≈ -500..2500 × 0..1080).
//    Row houses, our brick apartment with a warm lit window (the target), utility pole + wire, two sodium lamps,
//    falling snow, CN Tower + skyline far back (parallax).
//    o.cam    {x:960, y:540, zoom:1, rot:0}  camera on the world; far layers move less (parallax)
//    o.keepCam false  leave the camera open when done so you can draw Bit in world coords (then call camEnd())
//    o.snow   1     snowfall density;  o.wind  .25  sideways drift
//    o.window 1     warmth of our window (0 = dark)
//    STREET = { pole:{x, base, top}, wireA, wireB, window:{x,y,w,h}, lamps:[...] } (world coords)
//    streetPath(k) -> [x, y, ang]  k 0..1 : pole base (k=0) → up the pole (k≈.5) → along the sagging wire →
//                   into our window (k=1). streetPathK = { poleTop, windowSill } (k at those milestones).
// ── gotvLogo(x, y, s, t, o) ── painted GOTV wordmark, centred on (x, y); s = 1 is ≈ 820 px wide, 230 px tall.
//    Chunky yellow letters with a blue outline and blue extrusion; the O is a ring with a play triangle.
//    o.pop    0..1  slam-in (1 = settled; default 1): letters fall in huge from the camera, staggered G-O-T-V,
//                   squash on impact, overshoot and settle; a light burst on impact
//    o.small  false TV corner bug: thinner lines, no extrusion, no burst (use s ≈ .12–.2)
//    o.alpha  1     (bug only) washOp fade;  o.glow 1 light behind the logo;  o.tilt −.04 jaunty angle
//
// LOOPS.kit_journey: model sheet. Loop time 100..124 (offset past the subtitle track): 100 tunnel, 106 ocean + map,
// 112 street, 118 logo. e.g. --sheet=101,103.4,104.6 --loop=kit_journey
(() => {
  // ---------- small private helpers ----------
  const P = (x, y) => [x, y];
  const polyLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  function alongPoly(pts, k) {
    const L = polyLen(pts); let want = clamp(k) * L;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (want <= l || i === pts.length - 1) { const u = l ? clamp(want / l) : 0; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
      want -= l;
    }
    return [...pts[0], 0];
  }
  const full = (col, op = 255) => paint(rectPts(-80, -80, W + 160, H + 160), { wash: col, washOp: op, ink: null });

  // =====================================================================================================
  // FIBRE TUNNEL
  // =====================================================================================================
  const TUNNEL = { vp: [960, 430], floorH: 560, ringR: 700, halfW: 420, lanes: [-280, 0, 280] };
  const tunnelAt = (X, d, o = {}) => { const [vx, vy] = o.vp || TUNNEL.vp; d = Math.max(.05, d); return [vx + X / d, vy + TUNNEL.floorH / d, 1 / d]; };
  const PHI = Math.asin(TUNNEL.floorH / TUNNEL.ringR);          // ring meets the floor at angles PHI and PI-PHI (y down)
  const ringPts = (vx, vy, r, n = 26, inset = 1) => {
    const out = [], a0 = Math.PI - PHI, a1 = 2 * Math.PI + PHI;
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([vx + Math.cos(a) * r * inset, vy + Math.sin(a) * r * inset]); }
    return out;
  };

  function fibreTunnel(t, o = {}) {
    const speed = o.speed ?? 1, jam = clamp(o.jam || 0), boost = clamp(o.boost || 0);
    const [vx, vy] = o.vp || TUNNEL.vp, z = o.z ?? t * speed * 1.4;
    const CYAN = mixCol('#5FD8E8', '#F0674E', jam), MAG = mixCol('#E46AC0', '#F2A03A', jam), NAVY = mixCol('#161B4A', '#2A1433', jam * .6);

    boilSeed('tun-bg');
    full(NAVY);
    // wall pigment: big soft blooms, deeper at the edges
    paint(ellPts(vx, vy + 40, 1100, 760, 30, 20), { fill: mixCol('#2C2F7A', '#4A1E3C', jam), fillOp: 120, bleed: .3, tex: .6, ink: null });
    paint(ellPts(vx - 520, vy - 260, 620, 420, 24, 14), { fill: mixCol('#3B2A7E', '#5A2436', jam), fillOp: 90, bleed: .3, tex: .7, ink: null });
    paint(ellPts(vx + 560, vy - 180, 560, 400, 24, 14), { fill: mixCol('#1F4E7A', '#4E2A2A', jam), fillOp: 90, bleed: .3, tex: .7, ink: null });
    paint(ellPts(vx, vy, 520, 330, 26, 10), { fill: mixCol('#3F5FB0', '#7A3040', jam), fillOp: 90, bleed: .25, tex: .5, ink: null });

    // floor: a flat strip converging on the vanishing point
    boilSeed('tun-floor');
    const far = 60, near = .38;
    const fl = [[vx - TUNNEL.halfW / far, vy + TUNNEL.floorH / far], [vx + TUNNEL.halfW / far, vy + TUNNEL.floorH / far],
                [vx + TUNNEL.halfW / near, vy + TUNNEL.floorH / near], [vx - TUNNEL.halfW / near, vy + TUNNEL.floorH / near]];
    paint(fl, { wash: mixCol('#1C2458', '#2C1830', jam), fill: mixCol('#2A3A7A', '#5A2230', jam), fillOp: 110, bleed: .12, tex: .7, ink: null });
    // soft centre sheen down the middle lane (dim, so packets read)
    paint([[vx - 3, vy + 12], [vx + 3, vy + 12], [vx + 150 / near, vy + TUNNEL.floorH / near], [vx - 150 / near, vy + TUNNEL.floorH / near]],
      { fill: mixCol('#35508E', '#6A3040', jam), fillOp: 70, bleed: .25, tex: .5, ink: null });

    // the light at the end
    glow(vx, vy, 360 + 140 * boost, mixCol('#8FE6F0', '#FF8A5C', jam), .75 + .25 * boost);
    glow(vx, vy, 120 + 60 * boost, '#FFF3D6', .9);

    // rushing light rings (far → near)
    const fz = frac(z), NR = 9;
    for (let k = NR; k >= 0; k--) {
      const d = (k + 1 - fz) * .9 + .25;              // .25 .. 9.3
      if (d < .3) continue;
      const r = TUNNEL.ringR / d, fadeN = clamp((d - .3) / .35), fadeF = clamp(1 - (d - 4) / 5.5), a = fadeN * fadeF;
      if (a < .03) continue;
      const idx = Math.floor(z) - k, col = (idx & 1) ? CYAN : MAG;
      boilSeed('ring' + idx);
      // band fill only in the safe range: a fill far bigger than the canvas (d < .65) or thinner than ~12 px (d > 2.8)
      // makes p5.brush take minutes. Near rings are carried by the ink line + glows instead.
      if (d > .65 && d < 2.8) { const hw = 17 / d; paint(ringPts(vx, vy, r - hw, 16).concat(ringPts(vx, vy, r + hw, 16).reverse()), { fill: col, fillOp: Math.round(150 * a), bleed: .15, tex: .5, ink: null }); }
      else if (d <= .65) inkLine(ringPts(vx, vy, r, 22), 6 * a, col, 'dry', .5);
      inkLine(ringPts(vx, vy, r, 22, .995), clamp(1.4 / d, .3, 2.6), mixCol(col, '#FFF6E0', .55), 'inkfine', .5);
      // lamps on the ring: shoulders and crown
      if (d < 5.5) for (const ang of [-Math.PI / 2, -Math.PI * .15, -Math.PI * .85, PHI - .12, Math.PI - PHI + .12]) {
        glow(vx + Math.cos(ang) * r, vy + Math.sin(ang) * r, 70 / d, col, a * .9);
      }
      // jam: red warning lamps blink on the ring crown
      if (jam > .05 && d < 5) { const bl = .5 + .5 * Math.sin(t * 7 + idx * 1.7); glow(vx, vy - r, 120 / d, '#FF3A2E', jam * bl); }
    }

    // fibre streaks along walls and ceiling: radial light lines rushing outward
    const NS = 22, streakSpeed = speed * (1 - .7 * jam) + boost * 2.5;
    for (let i = 0; i < NS; i++) {
      const ang = lerp(Math.PI - PHI + .08, 2 * Math.PI + PHI - .08, hash(i * 3.1 + 5));
      const ph = frac(hash(i * 7.7) + t * .45 * streakSpeed * (.7 + .6 * hash(i + 40)));
      const d0 = lerp(7, .45, easeIn(ph)), len = (.25 + 1.4 * streakSpeed * .25) * (1 + hash(i + 9)), d1 = d0 + len;
      const r0 = TUNNEL.ringR * .96 / d0, r1 = TUNNEL.ringR * .96 / d1;
      const a = clamp(ph * 3) * clamp((1 - ph) * 6);
      if (a < .05) continue;
      const col = i % 3 === 0 ? '#FFF1C8' : i % 2 ? CYAN : MAG;
      boilSeed('streak' + i);
      const pts = [[vx + Math.cos(ang) * r1, vy + Math.sin(ang) * r1], [vx + Math.cos(ang) * r0, vy + Math.sin(ang) * r0]];
      inkLine(pts, clamp(.8 / d0, .3, 2.2), mixCol(col, '#FFF6E0', .4), 'inkfine', 0);
      glow(pts[1][0], pts[1][1], 40 / d0, col, a);
    }

    // floor lane dashes, rushing toward us
    const lanesZ = z * 1.0;
    for (const X of [-140, 140]) for (let k = 0; k < 9; k++) {
      const d = (k + 1 - frac(lanesZ)) * .8 + .2, d2 = d + .28;
      if (d < .35 || d > 7) continue;
      boilSeed('dash' + X + '_' + (Math.floor(lanesZ) - k));
      const w = 9, q = [[vx + (X - w) / d2, vy + 560 / d2], [vx + (X + w) / d2, vy + 560 / d2], [vx + (X + w) / d, vy + 560 / d], [vx + (X - w) / d, vy + 560 / d]];
      paint(q, { wash: mixCol('#6FB6D8', '#E86A50', jam), washOp: 200 * clamp(1 - (d - 3) / 4), ink: null });
    }
    // floor edge light strips
    boilSeed('tun-edges');
    for (const s of [-1, 1]) {
      const a = [vx + s * TUNNEL.halfW / 30, vy + TUNNEL.floorH / 30], b = [vx + s * TUNNEL.halfW / .42, vy + TUNNEL.floorH / .42];
      inkLine([a, b], 1.6, mixCol('#8FE6F0', '#FF7A5A', jam), 'ink', 0);
      glow(lerp(a[0], b[0], .55), lerp(a[1], b[1], .55), 120, CYAN, .35);
    }
    // jam: brake-light pools on the floor (red, blinking in a stop-go ripple)
    if (jam > .05) for (let i = 0; i < 7; i++) {
      const d = 1.1 + i * .75, [x, y] = tunnelAt((i % 2 ? -1 : 1) * 230, d, o), bl = .55 + .45 * Math.sin(t * 5 - i * .9);
      glow(x, y, 110 / d, '#FF3A2E', jam * bl * .8);
    }
    // boost: long gold speed lines from the vanishing point
    if (boost > .02) for (let i = 0; i < 16; i++) {
      boilSeed('boost' + i);
      const ang = hash(i * 13.3) * TAU, ph = frac(hash(i * 2.9) + t * 2.2), r0 = lerp(80, 1200, easeIn(ph)), r1 = r0 * (1.5 + ph);
      inkLine([[vx + Math.cos(ang) * r0, vy + Math.sin(ang) * r0], [vx + Math.cos(ang) * r1, vy + Math.sin(ang) * r1]], 1.2 + ph * 2, '#FFE9A8', 'inkfine', 0);
    }
    boilSeed('tun-done');
  }

  // =====================================================================================================
  // OCEAN
  // =====================================================================================================
  const cableY = (x, o = {}) => { const wx = x + (o.scroll || 0); return 800 + 16 * Math.sin(wx / 360) + 7 * Math.sin(wx / 137 + 1.3); };
  const cablePt = (x, o = {}) => { const y = cableY(x, o), y2 = cableY(x + 4, o); return [x, y, Math.atan2(y2 - y, 4)]; };

  function jellyfish(x, y, s, t, seed) {
    boilSeed('jelly' + seed);
    const pul = Math.sin(t * 2.2 + seed * 3), bw = 46 * s * (1 + .08 * pul), bh = 38 * s * (1 - .1 * pul);
    glow(x, y, 120 * s, '#E9A6E8', .55);
    for (let i = 0; i < 4; i++) {
      const x0 = x + (i - 1.5) * bw * .45, pts = [];
      for (let k = 0; k <= 5; k++) pts.push([x0 + Math.sin(t * 2 + k * .9 + i + seed) * 8 * s * k / 5, y + k * 22 * s]);
      inkLine(pts, .6, '#F1C2EA', 'inkfine', .6);
    }
    const bell = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; bell.push([x + Math.cos(a) * bw, y + Math.sin(a) * bh]); }
    for (let i = 0; i <= 6; i++) bell.push([x + bw - i / 6 * bw * 2, y + (i % 2 ? 7 : 1) * s]);
    paint(bell, { wash: '#E7A8E4', washOp: 120, fill: '#F6D7F2', fillOp: 80, bleed: .1, tex: .4, ink: '#6A3A78', sw: .7 });
    glow(x, y - bh * .4, 40 * s, '#FFE6FA', .8);
  }

  function ocean(t, o = {}) {
    const sc = o.scroll || 0, dark = o.dark ?? .2, city = clamp(o.city || 0);
    const deep = mixCol('#14406A', '#0B2445', dark), top = mixCol('#3F9DB2', '#276E8E', dark);
    boilSeed('sea-bg');
    full(deep);
    paint(rectPts(-100, -100, W + 200, 520, 30), { fill: top, fillOp: 150, bleed: .3, tex: .5, ink: null });
    paint(ellPts(W * .55, 60, W * .7, 260, 30, 20), { fill: mixCol('#7FD0D6', '#4FA8BC', dark), fillOp: 90, bleed: .3, tex: .6, ink: null });
    paint(rectPts(-100, 640, W + 200, 540, 30), { fill: mixCol('#0E2A4E', '#081a33', dark), fillOp: 140, bleed: .3, tex: .6, ink: null });
    // surface ripple band
    boilSeed('sea-surface');
    const sp = []; for (let i = 0; i <= 16; i++) sp.push([i / 16 * (W + 200) - 100, 38 + 10 * Math.sin(i * 1.3 + t * 1.6 - sc * .002)]);
    sp.push([W + 100, -100], [-100, -100]);
    paint(sp, { fill: mixCol('#B8ECE8', '#FFD89A', city * .7), fillOp: 90, bleed: .2, tex: .5, ink: null });
    // arrival: city lights refracted through the surface
    if (city > .01) for (let i = 0; i < 12; i++) {
      const x = 100 + i * 150 + 40 * hash(i * 5), wv = Math.sin(t * 2.3 + i * 1.7);
      glow(x + wv * 12, 30 + 12 * hash(i + 3), 90 + 50 * hash(i + 8), i % 3 ? '#FFC766' : '#FF9E5A', city * (.6 + .3 * wv));
    }
    // light shafts (parallax .1)
    for (let i = 0; i < 5; i++) {
      boilSeed('shaft' + i);
      const x0 = ((i * 430 + 180 - sc * .1) % (W + 600) + W + 600) % (W + 600) - 300, sw = 26 * Math.sin(t * .35 + i * 2);
      const w0 = 60 + 50 * hash(i), w1 = 240 + 160 * hash(i + 7), lean = 260;
      paint([[x0 - w0, -40], [x0 + w0, -40], [x0 + lean + w1 + sw, 900], [x0 + lean - w1 + sw, 900]],
        { fill: '#CFF3EE', fillOp: 34 + 16 * Math.sin(t * .8 + i * 1.3), bleed: .3, tex: .3, border: .1, ink: null });
      glow(x0, 20, 150, '#CFF3EE', .35);
    }
    // far rocks (parallax .25): one stepped silhouette
    boilSeed('sea-far');
    const fr = [], f1 = .25, s1 = sc * f1, step = 110;
    for (let gx = Math.floor((s1 - 200) / step); gx * step < s1 + W + 200; gx++) fr.push([gx * step - s1, 610 + 90 * hash(gx * 1.37) + 40 * Math.sin(gx * .7)]);
    fr.push([W + 200, 1180], [-200, 1180]);
    paint(fr, { wash: mixCol('#1E4F72', '#12344F', dark), fill: '#2A6A86', fillOp: 70, bleed: .15, tex: .6, ink: null, curv: .6 });
    // far jellyfish
    if (o.jelly !== false) {
      const jx = ((1300 - sc * .4 + t * 8) % (W + 400) + W + 400) % (W + 400) - 200;
      jellyfish(jx, 300 + 24 * Math.sin(t * .7), .75, t, 1);
    }
    // kelp (parallax .6)
    const f2 = .6, s2 = sc * f2;
    for (let gx = Math.floor((s2 - 300) / 380); gx * 380 < s2 + W + 300; gx++) {
      if (hash(gx * 3.3) < .25) continue;
      const bx = gx * 380 + 140 * hash(gx) - s2, h = 280 + 220 * hash(gx + 11);
      for (let j = 0; j < 2; j++) {
        boilSeed('kelp' + gx + '_' + j);
        const x0 = bx + j * 36, pts = [];
        for (let k = 0; k <= 6; k++) { const q = k / 6; pts.push([x0 + Math.sin(t * .9 + q * 2.6 + gx + j) * 34 * q, 830 - q * (h - j * 60)]); }
        paint(ribbon(pts, 24, 7), { wash: j ? '#2F7A5A' : '#3D8C5E', ink: '#173A3A', sw: .7 });
      }
    }
    // near jellyfish
    if (o.jelly !== false) {
      const jx = ((400 - sc * .7 + t * 14) % (W + 500) + W + 500) % (W + 500) - 250;
      jellyfish(jx, 470 + 30 * Math.sin(t * .9 + 2), 1.15, t, 2);
    }
    // marine snow
    for (let i = 0; i < 40; i++) {
      const f = .3 + .7 * hash(i + 60), x = ((hash(i) * (W + 200) - sc * f + Math.sin(t * .6 + i) * 20) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = ((hash(i + 20) * 1000 + t * (12 + 20 * hash(i + 40))) % 1000) - 20;
      glow(x, y, 5 + 7 * f, '#E8F6F0', .35 + .4 * f);
    }
    // sea floor (parallax 1): sand bank just under the cable
    boilSeed('sea-floor');
    const fl = [];
    for (let x = -120; x <= W + 120; x += 80) fl.push([x, cableY(x, o) + 22 + 14 * Math.sin((x + sc) / 90)]);
    fl.push([W + 120, H + 100], [-120, H + 100]);
    paint(fl, { wash: mixCol('#3E6A78', '#2C4E5E', dark), fill: '#8FA89A', fillOp: 70, bleed: .12, tex: .8, ink: null, curv: .5 });
    paint(rectPts(-100, 930, W + 200, 260, 20), { fill: '#1D3A4E', fillOp: 110, bleed: .3, tex: .6, ink: null });
    // rocks on the floor
    for (let gx = Math.floor((sc - 300) / 520); gx * 520 < sc + W + 300; gx++) {
      if (hash(gx * 5.1 + 2) < .35) continue;
      boilSeed('rock' + gx);
      const rx = gx * 520 + 260 * hash(gx + 4) - sc, rr = 50 + 50 * hash(gx + 8), ry = cableY(rx, o) + 60 + rr * .3;
      paint(ellPts(rx, ry, rr * 1.4, rr, 12, rr * .12), { wash: '#355566', fill: '#6B8A92', fillOp: 80, bleed: .1, tex: .7, ink: '#1B2E3E', sw: .7 });
    }
    // the cable
    boilSeed('cable');
    const cp = []; for (let x = -60; x <= W + 60; x += 60) cp.push([x, cableY(x, o)]);
    paint(ribbon(cp, 38, 38), { wash: '#1F3446', washOp: 170, fill: '#7FD3DA', fillOp: 70, bleed: .06, tex: .4, ink: '#10202E', sw: .9 });
    inkLine(cp.map(([x, y]) => [x, y - 2]), 1.3, '#BFF6F2', 'inkfine', .5);
    for (let x = -30; x <= W + 30; x += 110) { const [, y] = cablePt(x, o); glow(x, y, 50, '#6FE6EE', .45); }
    // clamps every 300 world px (they show the travel)
    for (let gx = Math.floor(sc / 300); gx * 300 < sc + W + 100; gx++) {
      const x = gx * 300 - sc, [, y, a] = cablePt(x, o);
      boilSeed('clamp' + gx);
      push(); translate(x, y); rotate(a);
      paint(rrPts(-9, -24, 18, 48, 6), { wash: '#2B3C4A', fill: '#56707A', fillOp: 90, ink: '#10202E', sw: .7 });
      pop();
    }
    if (o.glowX != null) { const [gx, gy] = cablePt(o.glowX, o); glow(gx, gy, 260, '#FFC24A', .9); glow(gx, gy, 90, '#FFF3C8', 1); }
    boilSeed('sea-done');
  }

  // =====================================================================================================
  // ROUTE MAP
  // =====================================================================================================
  const LL = { lon0: -84, lon1: 40, lat0: 57, lat1: 27 };
  const ROUTE_LL = [[34.8, 32.1], [28, 33.8], [20, 35], [12, 37.6], [8, 40.5], [5.4, 43.3], [3, 40.5], [-1, 37], [-5.4, 36.0],
    [-15, 37.5], [-30, 40.5], [-47, 43.5], [-63.6, 44.6], [-68, 46.5], [-71.2, 46.8], [-75, 45.3], [-79.4, 43.7]];
  const PINS = [['tlv', 'תל אביב', 'TLV', 0], ['marseille', 'מרסיי', 'Marseille', 5], ['gibraltar', 'גיברלטר', 'Gibraltar', 8],
    ['halifax', 'הליפקס', 'Halifax', 12], ['toronto', 'טורונטו', 'Toronto', 16]];
  const EUROPE = [[-10, 57], [-9.5, 43], [-8.8, 37], [-6, 36.2], [-2, 36.8], [0.3, 39], [3.2, 42], [5.4, 43.1], [8.5, 44.2], [12.3, 44.2],
    [12.8, 42], [15.6, 40], [16, 38], [18.5, 40.2], [16, 42], [13.6, 45.5], [19.5, 41.8], [21, 38], [23.4, 36.6], [26, 40.2],
    [29, 41], [36, 36.6], [36.5, 34], [36, 32.5], [40, 32], [40, 57]];
  const AFRICA = [[-18, 27], [-13, 27.5], [-9.8, 31.5], [-6, 35.8], [1, 36.5], [10, 37.3], [11, 33.5], [15, 32.2], [20, 30.6],
    [23, 32.6], [29.5, 31], [34.2, 31.3], [35, 27]];
  const AMERICA = [[-84, 57], [-60, 57], [-55.5, 52], [-60, 47], [-53, 47.5], [-60.5, 45.8], [-66, 43.7], [-70.5, 41.8], [-74, 40.6],
    [-76, 37.5], [-75.6, 35.2], [-81, 31], [-81.5, 27], [-84, 27]];
  const LAKES = [[-83.5, 45.9], [-82, 45.2], [-79.8, 44.2], [-77, 43.4], [-76.2, 44.1], [-78.5, 43.2], [-79.4, 43.9], [-80.6, 42.3],
    [-82.5, 42], [-82.4, 43.5], [-83.5, 44.5]];
  const ROUTE_STOPS = {};

  function routeMap(x, y, w, h, t, o = {}) {
    const p = clamp(o.p ?? 0), A = o.alpha ?? 1; if (A <= 0.01) return;
    const mp = ([lo, la]) => [x + 18 + (lo - LL.lon0) / (LL.lon1 - LL.lon0) * (w - 36), y + 18 + (la - LL.lat0) / (LL.lat1 - LL.lat0) * (h - 36)];
    const clip = pts => pts.map(q => [clamp(q[0], x + 10, x + w - 10), clamp(q[1], y + 10, y + h - 10)]);
    boilSeed('map-card');
    // card: parchment sea with a painted border
    paint(rrPts(x + 8, y + 10, w, h, 22), { wash: '#0C1638', washOp: 110 * A, ink: null });
    paint(rrPts(x, y, w, h, 22, 1.5), { wash: '#BFE0E4', washOp: 255 * A, fill: '#8EC3E6', fillOp: Math.round(110 * A), bleed: .15, tex: .6, ink: '#27304F', sw: 1.2 });
    boilSeed('map-land');
    for (const [poly, col] of [[AMERICA, '#9CC47E'], [EUROPE, '#D8C07A'], [AFRICA, '#E2B16A']])
      paint(clip(poly.map(mp)), { wash: col, washOp: 255 * A, ink: '#4A4A3A', sw: .6, curv: .4 });
    paint(LAKES.map(mp), { wash: '#8EC3E6', washOp: 255 * A, ink: '#3A5A7A', sw: .5, curv: .5 });
    // route: faint whole route, then the travelled part bright
    const R = ROUTE_LL.map(mp), cum = [0];
    for (let i = 1; i < R.length; i++) cum.push(cum[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
    const L = cum[cum.length - 1];
    if (!ROUTE_STOPS.tlv) for (const pin of PINS) ROUTE_STOPS[pin[0]] = +(cum[pin[3]] / L).toFixed(3);
    boilSeed('map-route');
    for (let i = 0; i < 26; i++) { // dashed full route
      const a = alongPoly(R, i / 26), b = alongPoly(R, i / 26 + .45 / 26);
      inkLine([[a[0], a[1]], [b[0], b[1]]], .6, '#3D4F7A', 'inkfine', 0);
    }
    const done = [R[0]]; for (let i = 1; i < R.length && cum[i] < p * L; i++) done.push(R[i]);
    const head = alongPoly(R, p); done.push([head[0], head[1]]);
    if (done.length > 1 && p > .005) inkLine(done, 1.8, '#E8AA38', 'ink', .4);
    // pins
    const fs = Math.max(11, Math.round(h * .062));
    for (const [id, he, en, ri] of PINS) {
      const [px, py] = R[ri], k = ROUTE_STOPS[id], lit = p >= k - .002;
      boilSeed('pin' + id);
      const r = h * .028 * (1 + .35 * spring(p * 10, k * 10, 4, 12) * (lit ? 1 : 0));
      paint(ellPts(px, py, r, r, 10), { wash: lit ? '#E8504A' : '#F3EBDC', washOp: 255 * A, ink: '#2B2233', sw: .6 });
      if (o.labels !== false) {
        const up = id === 'gibraltar' || id === 'halifax' ? 1 : -1, dx = id === 'tlv' ? -w * .015 : id === 'toronto' ? w * .03 : 0;
        const lx = px + dx, ly = py + up * h * .085;
        letter(he, lx, ly - (up < 0 ? fs * .55 : 0), fs, lit ? '#2B2233' : '#4E5870', { font: `700 ${fs}px Rubik`, ink: false, alpha: A });
        letter(en, lx, ly + (up < 0 ? fs * .45 : fs), fs * .8, lit ? '#8A3A2E' : '#5E6A80', { font: `500 ${Math.round(fs * .8)}px Rubik`, ink: false, alpha: A });
      }
    }
    // the travelling dot (Bit)
    boilSeed('map-dot');
    glow(head[0], head[1], h * .16, '#FFC24A', A);
    paint(ellPts(head[0], head[1], h * .026, h * .026, 10), { wash: '#FFE07A', washOp: 255 * A, ink: '#8A5A10', sw: .6 });
    // km counter
    const km = o.km ?? Math.round(p * 10400);
    boilSeed('map-km');
    paint(rrPts(x + w - w * .3, y + h - h * .19, w * .27, h * .14, h * .05), { wash: '#1C2458', washOp: 230 * A, ink: null });
    letter(km.toLocaleString('en-US') + ' km', x + w - w * .165, y + h - h * .12, fs, '#FFE07A', { font: `700 ${Math.round(fs * 1.1)}px Rubik`, ink: false, alpha: A });
  }

  // =====================================================================================================
  // TORONTO STREET
  // =====================================================================================================
  const STREET = {
    ground: 905,
    pole: { x: 760, base: 915, top: 250 },
    wireA: [772, 282], wireB: [1296, 452],
    window: { x: 1300, y: 400, w: 190, h: 170 },
    apt: { x: 1150, y: 170, w: 520, h: 740 },
    lamps: [[240, 905], [2060, 905]],
  };
  const wireAt = u => { const [ax, ay] = STREET.wireA, [bx, by] = STREET.wireB; return [lerp(ax, bx, u), lerp(ay, by, u) + 95 * 4 * u * (1 - u)]; };
  const STREET_PATH = (() => {
    const p = [[STREET.pole.x, STREET.pole.base - 20], [STREET.pole.x, STREET.wireA[1] - 12]];
    for (let i = 0; i <= 16; i++) { const q = wireAt(i / 16); p.push([q[0], q[1] - 12]); }
    p.push([STREET.window.x + 50, STREET.window.y + STREET.window.h - 40], [STREET.window.x + 110, STREET.window.y + STREET.window.h * .55]);
    return p;
  })();
  const streetPath = k => alongPoly(STREET_PATH, k);
  const streetPathK = (() => { const L = polyLen(STREET_PATH), l1 = polyLen(STREET_PATH.slice(0, 2)), l2 = polyLen(STREET_PATH.slice(0, 19)); return { poleTop: l1 / L, windowSill: l2 / L }; })();

  function rowHouse(x, w, h, col, seed, t, lit) {
    const g = STREET.ground, top = g - h;
    boilSeed('house' + seed);
    // body + gable as one shape
    paint([[x, g], [x, top + w * .25], [x + w / 2, top - w * .18], [x + w, top + w * .25], [x + w, g]],
      { wash: col, fill: mixCol(col, '#1A1D44', .5), fillOp: 80, bleed: .08, tex: .6, ink: '#1B1A33', sw: .9 });
    // snow on the gable
    paint([[x - 14, top + w * .25 + 4], [x + w / 2, top - w * .18 - 12], [x + w + 14, top + w * .25 + 4], [x + w * .8, top + w * .1 + 6], [x + w / 2, top - w * .18 + 10], [x + w * .2, top + w * .1 + 8]],
      { wash: '#DDE3F4', fill: '#AEB8E0', fillOp: 70, bleed: .05, tex: .4, ink: '#1B1A33', sw: .6 });
    // windows: attic round, two floors
    const wins = [[x + w / 2 - w * .1, top + w * .05, w * .2, w * .16], [x + w * .15, top + h * .38, w * .28, h * .2], [x + w * .57, top + h * .38, w * .28, h * .2], [x + w * .15, top + h * .7, w * .28, h * .2]];
    wins.forEach(([wx, wy, ww, wh], i) => {
      const on = lit && hash(seed * 7 + i) > .45;
      paint(rectPts(wx, wy, ww, wh, 1.5), { wash: on ? '#F2B45A' : '#2E3668', ink: '#1B1A33', sw: .6 });
      if (on) glow(wx + ww / 2, wy + wh / 2, ww * 1.3, '#FFB35A', .55);
    });
    // door + snowy step
    paint(rectPts(x + w * .6, g - h * .25, w * .24, h * .25, 1), { wash: mixCol(col, '#2B2233', .5), ink: '#1B1A33', sw: .6 });
  }

  function torontoStreet(t, o = {}) {
    const cam = { x: 960, y: 540, zoom: 1, rot: 0, ...(o.cam || {}) }, snowK = o.snow ?? 1, wind = o.wind ?? .25, winK = o.window ?? 1;
    camBegin(cam.x, cam.y, cam.zoom, cam.rot);
    const layer = (f, fn) => { push(); translate((cam.x - 960) * (1 - f), (cam.y - 540) * (1 - f)); fn(); pop(); };
    // sky
    boilSeed('st-sky');
    paint(rectPts(-900, -700, 3800, 2600), { wash: '#1E2352', ink: null });
    // (fills stay under ~2300 px: bigger ones make p5.brush crawl on soft-gl)
    for (const cx of [300, 1600]) paint(ellPts(cx, 800, 1100, 420, 26, 20), { fill: '#6A4A7A', fillOp: 100, bleed: .3, tex: .6, ink: null });
    paint(ellPts(400, 60, 900, 260, 24, 20), { fill: '#2F3C7A', fillOp: 90, bleed: .3, tex: .6, ink: null });
    // CN tower + skyline, far back
    layer(.12, () => {
      boilSeed('st-cn');
      const cx = 990, bot = 700;   // in the sky gap between the pole and our building
      paint([[cx - 34, bot], [cx - 9, 330], [cx - 5, 150], [cx + 5, 150], [cx + 9, 330], [cx + 34, bot]], { wash: '#3A3F76', ink: null });
      paint(ellPts(cx, 345, 44, 20, 16), { wash: '#434A86', ink: '#2A2C58', sw: .5 });
      paint(ellPts(cx, 270, 16, 8, 12), { wash: '#434A86', ink: null });
      inkLine([[cx, 150], [cx, 40]], .7, '#3A3F76', 'inkfine', 0);
      for (let i = -2; i <= 2; i++) glow(cx + i * 14, 346, 16, '#9FD6FF', .6);
      glow(cx, 42, 30, '#FF4A3A', .5 + .5 * Math.sin(t * 3));
    });
    layer(.3, () => {
      boilSeed('st-skyline');
      const sk = [[-800, 760]]; let sx = -800;
      for (let i = 0; sx < 2800; i++) { const bw = 70 + 90 * hash(i * 2.1), bh = 80 + 170 * hash(i * 1.3 + 4); sk.push([sx, 700 - bh], [sx + bw, 700 - bh]); sx += bw; }
      sk.push([2800, 760]);
      paint(sk, { wash: '#2C3066', ink: null });
      for (let i = 0; i < 26; i++) glow(-400 + hash(i * 3.7) * 2800, 560 + hash(i * 5.3) * 130, 8, '#FFC878', .7);
    });
    // row houses (left), our brick apartment, one more house (right)
    rowHouse(-440, 300, 470, '#6A5A8A', 1, t, true);
    rowHouse(-120, 300, 500, '#5A6A9A', 2, t, true);
    rowHouse(200, 290, 450, '#7A5F7E', 3, t, true);
    rowHouse(1730, 300, 480, '#5F6E96', 4, t, true);
    rowHouse(2050, 300, 440, '#6E5A86', 5, t, true);
    // apartment
    const A = STREET.apt, Wn = STREET.window;
    boilSeed('st-apt');
    paint(rectPts(A.x, A.y, A.w, A.h, 2), { wash: '#8E4A3E', fill: '#B0604A', fillOp: 90, bleed: .08, tex: .8, ink: '#1B1A33', sw: 1,
      hatch: { d: 22, a: 0, o: { rand: .2 }, b: 'HB', c: '#5E2E2E', w: .8 } });
    paint(rectPts(A.x - 16, A.y - 26, A.w + 32, 34, 2), { wash: '#6A3A36', ink: '#1B1A33', sw: .8 });
    paint(rectPts(A.x - 22, A.y - 42, A.w + 44, 20, 3), { wash: '#DDE3F4', ink: '#1B1A33', sw: .5 });
    const aw = [[A.x + 40, A.y + 50], [A.x + 150, A.y + 50], [A.x + 360, A.y + 50], [A.x + 40, A.y + 230], [A.x + 360, A.y + 230], [A.x + 40, A.y + 440], [A.x + 360, A.y + 440]];
    aw.forEach(([wx, wy], i) => {
      boilSeed('aw' + i); const on = hash(i * 9.1) > .6;
      paint(rectPts(wx, wy, 110, 130, 1.5), { wash: on ? '#E8A452' : '#2A3264', ink: '#1B1A33', sw: .7 });
      paint(rectPts(wx - 8, wy + 128, 126, 12, 2), { wash: '#DDE3F4', ink: null });
      if (on) glow(wx + 55, wy + 65, 110, '#FFB35A', .5);
    });
    // our window (big, warm): glow, pane, curtains, frame
    boilSeed('st-win');
    glow(Wn.x + Wn.w / 2, Wn.y + Wn.h / 2, 420 * winK, '#FFB24A', .75 * winK);
    paint(rectPts(Wn.x, Wn.y, Wn.w, Wn.h, 1.5), { wash: mixCol('#2A3264', '#FFCB6A', winK), fill: '#FFE8A8', fillOp: 90 * winK, bleed: .1, tex: .4, ink: '#1B1A33', sw: 1 });
    paint([[Wn.x + 4, Wn.y + 4], [Wn.x + 44, Wn.y + 4], [Wn.x + 30, Wn.y + Wn.h * .6], [Wn.x + 4, Wn.y + Wn.h - 4]], { wash: '#C2574A', ink: '#1B1A33', sw: .5 });
    paint([[Wn.x + Wn.w - 4, Wn.y + 4], [Wn.x + Wn.w - 44, Wn.y + 4], [Wn.x + Wn.w - 30, Wn.y + Wn.h * .6], [Wn.x + Wn.w - 4, Wn.y + Wn.h - 4]], { wash: '#C2574A', ink: '#1B1A33', sw: .5 });
    inkLine([[Wn.x + Wn.w / 2, Wn.y], [Wn.x + Wn.w / 2, Wn.y + Wn.h]], 1, '#3A2A2A', 'ink', 0);
    inkLine([[Wn.x, Wn.y + Wn.h * .45], [Wn.x + Wn.w, Wn.y + Wn.h * .45]], 1, '#3A2A2A', 'ink', 0);
    glow(Wn.x + Wn.w / 2, Wn.y + Wn.h / 2, 130 * winK, '#FFF0C0', .8 * winK);
    paint(rectPts(Wn.x - 12, Wn.y + Wn.h - 2, Wn.w + 24, 16, 2), { wash: '#DDE3F4', ink: '#1B1A33', sw: .5 });
    // door of the apartment
    paint(rrPts(A.x + 200, A.y + A.h - 180, 110, 180, 40), { wash: '#3A2E4E', ink: '#1B1A33', sw: .8 });
    glow(A.x + 255, A.y + A.h - 200, 60, '#FFC766', .7);

    // ground: sidewalk + road + snowbanks
    boilSeed('st-ground');
    paint(rectPts(-900, STREET.ground - 10, 3800, 90, 4), { wash: '#C3C9E8', ink: null });
    paint(rectPts(-900, STREET.ground + 70, 3800, 500, 4), { wash: '#43487A', ink: null });
    for (const cx of [100, 1300, 2300]) paint(ellPts(cx, STREET.ground + 190, 700, 90, 20, 8), { fill: '#6A6F9E', fillOp: 80, bleed: .2, tex: .7, ink: null });
    paint(rectPts(-900, STREET.ground + 110, 3800, 20, 2), { wash: '#6A6F9E', washOp: 160, ink: null });
    // street lamps (sodium)
    STREET.lamps.forEach(([lx, ly], i) => {
      boilSeed('lamp' + i);
      paint([[lx - 180, ly + 150], [lx + 180, ly + 150], [lx + 14, ly - 560], [lx - 14, ly - 560]], { fill: '#FFB347', fillOp: 40, bleed: .3, tex: .3, border: .1, ink: null });
      paint(ellPts(lx, ly + 40, 260, 50, 20, 6), { fill: '#FFC878', fillOp: 90, bleed: .2, tex: .4, ink: null });
      paint([[lx - 7, ly], [lx - 5, ly - 560], [lx + 5, ly - 560], [lx + 7, ly]], { wash: '#2A2C48', ink: '#141428', sw: .6 });
      paint([[lx - 5, ly - 560], [lx + 60, ly - 590], [lx + 90, ly - 585], [lx + 90, ly - 575], [lx + 60, ly - 575], [lx + 5, ly - 545]], { wash: '#2A2C48', ink: '#141428', sw: .6 });
      glow(lx + 80, ly - 570, 260, '#FFA640', .9);
      glow(lx + 80, ly - 570, 60, '#FFE2A0', 1);
    });
    // utility pole + crossarm + insulators, the wire into our window
    boilSeed('st-pole');
    const Pl = STREET.pole;
    paint([[Pl.x - 13, Pl.base], [Pl.x - 9, Pl.top], [Pl.x + 9, Pl.top], [Pl.x + 13, Pl.base]], { wash: '#5A4032', ink: '#1B1A33', sw: .9 });
    paint(rectPts(Pl.x - 90, Pl.top + 22, 180, 14, 1), { wash: '#5A4032', ink: '#1B1A33', sw: .8 });
    for (const dx of [-70, 70]) paint(rrPts(Pl.x + dx - 5, Pl.top + 8, 10, 16, 4), { wash: '#6FA8A0', ink: '#1B1A33', sw: .5 });
    paint(rectPts(Pl.x - 16, Pl.top - 8, 32, 12, 2), { wash: '#DDE3F4', ink: null });
    boilSeed('st-wire');
    const wp = []; for (let i = 0; i <= 14; i++) wp.push(wireAt(i / 14));
    inkLine(wp, 1.1, '#1B1A33', 'ink', .5);
    const wp2 = []; for (let i = 0; i <= 10; i++) { const u = i / 10, a = [Pl.x - 70, Pl.top + 12]; wp2.push([lerp(a[0], -600, u), lerp(a[1], 330, u) + 70 * 4 * u * (1 - u)]); }
    inkLine(wp2, .9, '#1B1A33', 'ink', .5);
    // snowbanks in front
    boilSeed('st-banks');
    paint([[-900, 1100], [-900, 960], [-500, 935], [-200, 955], [60, 940], [380, 962], [380, 1100]], { wash: '#C9D0EE', fill: '#9AA2D2', fillOp: 70, bleed: .1, tex: .5, ink: '#2A2C58', sw: .6, curv: .5 });
    paint([[1500, 1100], [1500, 965], [1800, 942], [2100, 958], [2900, 945], [2900, 1100]], { wash: '#C9D0EE', fill: '#9AA2D2', fillOp: 70, bleed: .1, tex: .5, ink: '#2A2C58', sw: .6, curv: .5 });
    // falling snow (soft light flakes + a few painted near flakes)
    const n = Math.round(90 * snowK);
    for (let i = 0; i < n; i++) {
      const f = .3 + .7 * hash(i + 3), sp = 40 + 70 * f, span = 1300;
      const y = ((hash(i * 1.9) * span + t * sp) % span) - 120 + cam.y - 540;
      const x = ((hash(i * 7.3) * 3200 + t * sp * wind + Math.sin(t * 1.3 + i) * 18) % 3200) - 700 + (cam.x - 960) * (1 - f);
      glow(x, y, 4 + 6 * f, '#EEF0FF', .5 + .4 * f);
    }
    for (let i = 0; i < Math.round(12 * snowK); i++) {
      boilSeed('flake' + i);
      const sp = 150, span = 1300, y = ((hash(i * 4.1) * span + t * sp) % span) - 120 + cam.y - 540;
      const x = ((hash(i * 5.7) * 2600 + t * sp * wind * 1.4) % 2600) - 340 + (cam.x - 960) * .3;
      paint(ellPts(x, y, 6, 6, 7, 1.2), { wash: '#F2F4FF', ink: null });
    }
    boilSeed('st-done');
    if (!o.keepCam) camEnd();
  }

  // =====================================================================================================
  // GOTV LOGO
  // =====================================================================================================
  const Y1 = '#FFD23F', Y2 = '#F6A91E', BL = '#1F3F9E', BLD = '#142A6E';
  // glyph outlines in logo units: cap height 200, baseline y = 100 (centred on 0)
  function glyphG() {
    const R = 102, r = 52, p = [];
    for (let i = 0; i <= 20; i++) { const a = -.72 - i / 20 * (TAU - .72); p.push([Math.cos(a) * R, Math.sin(a) * R]); }
    const y0 = 2, y1 = 38, ia = Math.atan2(y1, Math.sqrt(Math.max(0, r * r - y1 * y1)));
    p.push([R, y0], [6, y0], [6, y1]);
    for (let i = 0; i <= 16; i++) { const a = lerp(ia, TAU - .72, i / 16); p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return p;
  }
  const glyphT = () => [[-80, -100], [80, -100], [80, -54], [24, -54], [24, 100], [-24, 100], [-24, -54], [-80, -54]];
  const glyphV = () => [[-92, -100], [-40, -100], [0, 38], [40, -100], [92, -100], [28, 100], [-28, 100]];

  function gotvLogo(x, y, s, t, o = {}) {
    const pk = o.pop ?? 1, small = !!o.small, tilt = o.tilt ?? -.04, al = o.alpha ?? 1, gl = o.glow ?? 1;
    const swOut = small ? clamp(s * 5, .35, 1) : clamp(s * 2.6, .6, 3);
    // letter layout (logo units): G, O, T, V
    const L = [['G', -300, 0], ['O', -80, 1], ['T', 128, 2], ['V', 300, 3]];
    if (!small && gl > 0) { glow(x, y, 600 * s * clamp(pk * 1.3), '#6FA0FF', .6 * gl); glow(x, y, 260 * s * clamp(pk * 1.3), '#FFE7A0', .35 * gl); }
    for (const [ch, lx, i] of L) {
      // slam: each letter drops in huge (scale 3 → 1), staggered, then squashes and springs
      const k0 = i * .12, q = clamp((pk - k0) / .45);
      if (q <= 0) continue;
      const land = .62, fall = q < land ? easeIn(q / land) : 1, after = q < land ? 0 : (q - land) / (1 - land);
      const sc = lerp(3.2, 1, fall), alpha = clamp(q / .2);
      const sq = q < land ? -.12 * fall : .28 * Math.exp(-after * 5) * Math.cos(after * 14);   // + squash (wide & short)
      const bob = small ? 0 : Math.sin(t * 2.2 + i * 1.3) * 3;
      boilSeed('logo' + ch + (small ? 's' : ''));
      push(); translate(x + lx * s, y + (bob + 100 - 100 * (1 - sq)) * s); rotate(tilt + (i % 2 ? .035 : -.03) + (1 - fall) * (i - 1.5) * .15);
      scale(s * sc * (1 + sq * .6), s * sc * (1 - sq));
      const wop = 255 * alpha * al, ink = { ink: BL, sw: swOut / (s * sc) };
      if (ch === 'O') {
        const R = 108;
        if (!small) paint(ellPts(10, 12, R, R, 30), { wash: BLD, washOp: wop, ink: null });
        paint(ellPts(0, 0, R, R, 30, .5), { wash: Y1, washOp: wop, ...(small ? {} : { fill: Y2, fillOp: Math.round(90 * alpha * al), bleed: .06, tex: .5 }), ...ink });
        paint(ellPts(0, 0, R * .56, R * .56, 24, .5), { wash: '#2F63E0', washOp: wop, ...(small ? {} : { fill: BL, fillOp: Math.round(110 * alpha * al), bleed: .08, tex: .5 }), ...ink });
        paint([[-R * .18, -R * .3], [R * .34, 0], [-R * .18, R * .3]], { wash: '#FFF3C8', washOp: wop, ...ink, curv: .15 });
        if (!small) inkLine(ellPts(-4, -4, R * .8, R * .8, 12).slice(6, 10), 1.4 / (s * sc), '#FFF6D8', 'inkfine', .6);
      } else {
        const g = ch === 'G' ? glyphG() : ch === 'T' ? glyphT() : glyphV();
        if (!small) paint(g.map(([a, b]) => [a + 10, b + 12]), { wash: BLD, washOp: wop, ink: null });
        paint(g, { wash: Y1, washOp: wop, ...(small ? {} : { fill: Y2, fillOp: Math.round(90 * alpha * al), bleed: .06, tex: .5 }), ...ink });
        if (!small) { // a cream highlight stroke along the top-left of each letter
          const hl = ch === 'G' ? ellPts(0, 0, 82, 82, 16).slice(9, 13) : ch === 'T' ? [[-66, -86], [60, -86]] : [[-80, -86], [-44, -86]];
          inkLine(hl, 1.2 / (s * sc), '#FFF6D8', 'inkfine', .6);
        }
      }
      pop();
      // impact burst
      if (!small && q >= land && after < .5) {
        const b = after / .5;
        glow(x + lx * s, y + 100 * s, 260 * s * (1 + b), '#FFE7A0', (1 - b) * .9);
        for (let j = 0; j < 5; j++) {
          boilSeed('spark' + ch + j);
          const ang = Math.PI + .3 + j / 4 * (Math.PI - .6), r0 = 130 * s + 160 * s * easeOut(b), r1 = r0 + 60 * s * (1 - b);
          inkLine([[x + lx * s + Math.cos(ang) * r0, y + 90 * s + Math.sin(ang) * r0 * .6], [x + lx * s + Math.cos(ang) * r1, y + 90 * s + Math.sin(ang) * r1 * .6]], 1.4, '#FFE07A', 'ink', 0);
        }
      }
    }
    boilSeed('logo-done');
  }

  // =====================================================================================================
  // model sheet
  // =====================================================================================================
  LOOPS.kit_journey = T0 => {
    const t = T0 >= 100 ? T0 - 100 : T0;
    if (t < 6) {   // tunnel: cruise → jam → boost
      fibreTunnel(t, { speed: kf(t, [[0, 1], [2, 1], [2.6, .3], [4.2, .3], [4.6, 3]]), jam: kf(t, [[1.8, 0], [2.6, 1], [4.2, 1], [4.6, 0]]), boost: kf(t, [[4.3, 0], [4.8, 1]]) });
      // stand-in queue markers so the staging reads on the sheet
      for (let i = 0; i < 6; i++) { const [x, y, s] = tunnelAt(TUNNEL.lanes[1] + (i % 2 ? 40 : -30), 1.1 + i * .7); boilSeed('stand' + i); paint(rrPts(x - 60 * s, y - 110 * s, 120 * s, 110 * s, 18 * s), { wash: '#B7A2C4', ink: PAL.ink, sw: .8 }); }
    } else if (t < 12) {   // ocean + map
      const u = t - 6;
      ocean(t, { scroll: u * 420, glowX: 760, city: seg(u, 4.5, 5.8) });
      routeMap(1300, 60, 560, 280, t, { p: seg(u, 0, 5.8) });
    } else if (t < 18) {   // street: wide, then push up the path
      const u = t - 12, k = seg(u, 1.5, 5.5), [px, py] = streetPath(k);
      const cam = { x: lerp(960, px, ease(seg(u, 0, 2)) * .8), y: lerp(540, py, ease(seg(u, 0, 2)) * .7), zoom: lerp(1, 1.5, ease(seg(u, 0, 2))) };
      torontoStreet(t, { cam, keepCam: true });
      boilSeed('bit-stand'); glow(px, py, 90, '#FFC24A', 1); paint(ellPts(px, py, 16, 16, 12), { wash: '#FFE07A', ink: PAL.ink, sw: .7 });
      camEnd();
    } else {   // logo slam, then settled with a TV bug
      const u = t - 18;
      boilSeed('card-bg'); full('#1C2458');
      paint(ellPts(960, 480, 1000, 520, 30, 20), { fill: '#2F3C7A', fillOp: 120, bleed: .3, tex: .6, ink: null });
      gotvLogo(960, 430, 1, t, { pop: seg(u, .3, 1.5) });
      boilSeed('tv'); paint(rrPts(1460, 760, 400, 240, 18), { wash: '#3A6A5A', ink: PAL.ink, sw: 1 });
      gotvLogo(1790, 800, .16, t, { small: true });
    }
  };
  LOOPS.kit_journey.len = 124;

  Object.assign(window, { fibreTunnel, tunnelAt, TUNNEL, ocean, cableY, cablePt, routeMap, ROUTE_STOPS, torontoStreet, STREET, streetPath, streetPathK, gotvLogo });
})();
