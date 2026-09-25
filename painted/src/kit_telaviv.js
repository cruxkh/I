// kit_telaviv.js: the Tel Aviv night sets for C1 (drone over the city, the stadium, the Maccabi home stand, the mast).
// Picture-book watercolour: backgrounds are soft wash/fill shapes with no outline, light is glow(), figures get flat
// wash + thin boiling ink. Every function is a pure function of t. All functions are globals (window.*).
//
// ---------------------------------------------------------------------------------------------------------------------
// WORLD (tlvCity) : a flat painted map, world px, y down, north = up. Depth is faked in 2D: every building is its
//   footprint plus a roof shifted by a "lean" that grows with the camera zoom and the distance from the camera centre
//   (drone parallax), so when the camera descends (zoom grows) the tall things shift/lean more. Landmarks:
//     sea            x < TLV_W.coast(y) (≈ 640 + .1·(y-1500)), beach 110 px wide, promenade with lamps after it
//     city grid      blocks 300 × 240 from x ≈ 820 to 4300, y -500 to 3500 (streets 46 wide, warm lamp pools)
//     stadium        centre TLV_W.stadium = [2350, 2150], bowl 1120 × 840 at s = 1 (drawn by stadium())
//     Azrieli        TLV_W.azrieli = [3450, 1060]: round, triangle and square towers (heights 560 / 520 / 470)
//     moon glints    on the sea, placed relative to the camera (a real specular glint follows the viewer)
//
// tlvCity(t, cam, o)  paints the WHOLE frame (background included) and handles camBegin/camEnd itself.
//     cam  {cx, cy, zoom, rot, tilt}: camera centre (world), zoom, roll; tilt (default .7) = how much the drone looks
//          forward (north): roofs shift up by h·tilt so south facades show. Use tlvDroneCam(k) for the standard path.
//     o.cars (1)     0..1 amount of moving car-light dabs     o.lamps (1) street-light strength
//     o.stadium (true) draw the stadium inside the city          o.stadiumO {} extra options passed to stadium()
//     o.after(cam)   callback run inside the camera, after everything (to add your own props in world coords)
//
// tlvDroneCam(k, o)   standard drone path, k 0..1: 0 = high over the coast (whole city, sea, Azrieli, stadium small),
//     .5 = mid descent over the rooftops (zoom .75), 1 = over the stadium (zoom 1.45, bowl ~80% of the frame); for a
//     closer pass call tlvCity with {cx: TLV_W.stadium[0], cy: TLV_W.stadium[1] + 20, zoom: 2..2.6}. Returns {cx, cy, zoom, tilt}.
//     Eased and log-zoomed; add your own drift/shake to the result. o.end = [x, y, zoom] overrides the final key.
//
// stadium(t, o)       the floodlit bowl, drawn in the CURRENT space (inside a camera or not), centred at (o.x, o.y).
//     o.x, o.y (960, 560)  o.s (1: bowl 1120 × 840 px)   o.lights (1) floodlight strength 0..1
//     o.players (true)     22 tiny painted players (yellow/blue Maccabi vs red), ball passing; o.attack 0..1 pushes
//                          Maccabi forward toward the right goal (the home end is the RIGHT stand)
//     o.bg (false)         paint a night background first (standalone use)   o.roar 0..1 home-end crowd shimmer
//     returns { home: [x, y] } the centre of the home (Maccabi) stand in the current space
//
// ultras(t, o)        the MACCABI TEL AVIV home stand at a low oblique angle, full frame (paints everything, screen px).
//     o.pan (0)   0..1 drone travel along the stand (layers slide with parallax: roof .3, far bands .35–.58, tifo .68, lower
//                 tier .8–.95, flags .9, front row 1.25 × 1000 px)
//     o.roar (.5) 0..1 energy: jump height, arms up, wave speed, flag speed, flare/smoke amount, drum hits
//     o.zoom (1)  push-in about the frame centre;  o.dy (0) vertical camera offset (+ = look lower)
//     o.flares (true) yellow flare smoke;  o.tifo (true) banner `מכבי תל אביב`;  o.flags (true) giant flags
//     Layout: roof + lights y < 130, upper tier bands 130–420, tifo on the balcony 420–600, lower tier 580–800,
//     front-row fans (big, heads ≈ y 700) and 2 drummers, front wall y > 930.
//
// mast(t, o)          broadcast building + lattice mast at night, full frame in world = screen px (wrap it in your own
//     camBegin for whips/tilts). Signs `שידור חי` (red neon) and `IPTV · ISRAEL`, red aviation lights blinking.
//     o.broadcast (0) 0..1 rings pulsing out of the mast top   o.bg (true) sky, moon, sea horizon, skyline
//     o.x (0) shifts the whole set horizontally.  returns { top: [x, y] } (mast tip; same as MAST_TOP when o.x = 0)
//
// packetStream(pts, t, o)  glowing little data packets (envelopes) flying along a path (world/current space).
//     pts   path points [[x, y], ...] (smoothed with through())
//     o.t0 (0) launch time; o.n (10) packets; o.gap (.12 s) between launches; o.speed (900 px/s); o.size (16)
//     o.spread (14) px sideways scatter; o.col ('#BFE9FF'); o.gold (-1) index of the gold GOTV packet (Bit) and
//     o.glint (t of the gold glint sparkle, default launch+.6); o.loop (false) packets re-launch forever.
//
// PERF (soft-gl): p5.brush `fill` costs ~1–8 s per shape here, so this kit uses NO fills: watercolour comes from layered
//   translucent washes, darker pooled rims (wet()), jittered edges and a static pigment texture (mottle()). Lights are
//   queued and flushed in batches (glowQ/glowFlush), because every core glow() call flushes the brush.
// LOOPS.kit_telaviv (len 10): 0–3.6 drone descent, 3.6–5 stadium low pass, 5–7.8 ultras pass with roar, 7.8–10 mast
//     + broadcast + packet launch.
// ---------------------------------------------------------------------------------------------------------------------
(() => {
  const C = {
    ink: PAL.ink, ground: '#2A3150', street: '#4B416B', streetLt: '#5E4F78', tree: '#2E5550', treeLt: '#3F6E5E',
    wall: '#5E5382', wallDk: '#4A4170', win: '#FFD27A', lamp: '#FFB65A',
    sea: '#1D3C6C', seaDk: '#152B55', seaLt: '#3C6B9E', foam: '#C7DBEA', sand: '#B59B7C', sandDk: '#8C7867',
    moon: '#FFF1CC', sky: '#1C2050', skyLo: '#35306A', yellow: '#F4C63F', yellowDk: '#D99E1E', blue: '#2F5CB8',
    blueDk: '#203F88', red: '#D9514B', redDk: '#A53A3A', grass: '#4C9A58', grassLt: '#62AE63', grassDk: '#3A7847',
    concrete: '#8A82A8', concreteDk: '#5D5580', cream: '#FFF3DE', glass: '#7684B8', glassLt: '#AEB9E3'
  };
  const ROOFS = ['#F0E4D0', '#EBCDB6', '#E6C6CB', '#D8CFE6', '#D2E2D4', '#F2E9DA', '#E9D5C0'];
  const SKIN = ['#EDBB95', '#C98E66', '#93603F', '#F3CDAE', '#B47C57', '#DDA57C'];
  const HAIR = ['#3A2A24', '#5A3A26', '#1F1B22', '#8A5A33', '#2E2530'];

  // ---------------------------------------------------------------- helpers
  function hull(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  const mv = (P, dx, dy) => P.map(([x, y]) => [x + dx, y + dy]);
  // point + distance sampling along a polyline
  function pathAt(P, d) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l || i === P.length - 1) { const k = l ? clamp(d / l) : 0; return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], a: Math.atan2(b[1] - a[1], b[0] - a[0]), end: d > l && i === P.length - 1 }; }
      d -= l;
    }
    return { p: P[0], a: 0, end: true };
  }
  const pathLen = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; };
  function davidStar(cx, cy, r, rot = 0) {
    const tri = a0 => [0, 1, 2].map(i => [cx + Math.cos(a0 + i * TAU / 3 + rot) * r, cy + Math.sin(a0 + i * TAU / 3 + rot) * r]);
    return [tri(-Math.PI / 2), tri(Math.PI / 2)];
  }
  const skyBg = (top, bot) => {
    paint(rectPts(-80, -80, W + 160, H + 160), { wash: top, ink: null });
    for (let i = 0; i < 4; i++) { const y0 = H * (.3 + i * .14); paint([[-80, y0 + 30 * Math.sin(i * 2)], [W / 2, y0 - 20], [W + 80, y0 + 25 * Math.cos(i)], [W + 80, H + 80], [-80, H + 80]], { wash: bot, washOp: 55, ink: null }); }
  };

  // ---------------------------------------------------------------- batched light
  // core glow() flushes p5.brush on every call, and on soft-gl each flush with shapes pending is slow. Queue lights and
  // flush them in one go (same look: same texture, same additive blend). Flush under the SAME transform they were queued in.
  const GQ = [];
  const glowQ = (x, y, r, col, a = 1) => { if (a > 0 && r >= 1) GQ.push([x, y, r, col, a]); };
  function glowFlush() {
    if (!GQ.length) return;
    flushBrush(); push(); blendMode(ADD);
    for (const [x, y, r, col, a] of GQ) { const c = color(col), rr = r * (1 + jit(.03)); tint(red(c), green(c), blue(c), 150 * clamp(a)); image(glowTex, x - rr, y - rr, 2 * rr, 2 * rr); }
    noTint(); blendMode(BLEND); pop(); GQ.length = 0;
  }
  // pigment mottling: a static watercolour texture (granulation + soft darker/lighter blooms), made once, laid over a
  // painted layer with MULTIPLY (darks) and ADD (blooms). Cheap on soft-gl, and it breaks every flat wash like real pigment.
  let WT = null;
  function washTex() {
    if (WT) return WT;
    const n = 768, mk = () => { const g = createGraphics(n, n); g.pixelDensity(1); return g; }, D = mk(), L = mk(), rnd = lcg(29);
    const dc = D.drawingContext, lc = L.drawingContext;
    dc.fillStyle = '#FFFFFF'; dc.fillRect(0, 0, n, n); lc.fillStyle = '#000000'; lc.fillRect(0, 0, n, n);
    const blob = (c, x, y, r, rgba) => { for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, rgba(1)); g.addColorStop(.7, rgba(.55)); g.addColorStop(.92, rgba(.9)); g.addColorStop(1, rgba(0)); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); } };
    for (let i = 0; i < 38; i++) { const a = .05 + .09 * rnd(); blob(dc, rnd() * n, rnd() * n, 40 + rnd() * 170, k => `rgba(${90 + rnd() * 0 | 0},70,120,${a * k})`); }
    for (let i = 0; i < 26; i++) { const a = .05 + .07 * rnd(); blob(lc, rnd() * n, rnd() * n, 30 + rnd() * 130, k => `rgba(255,236,210,${a * k})`); }
    const id = dc.getImageData(0, 0, n, n), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (rnd() < .35) { const v = rnd() * 26; d[i] -= v; d[i + 1] -= v * 1.1; d[i + 2] -= v * .7; } }
    dc.putImageData(id, 0, 0);
    return (WT = { D, L, n });
  }
  // lay the texture over [x0, y0, x1, y1] (current space), tile size ts, strength k (0..1)
  function mottle(x0, y0, x1, y1, ts = 900, k = 1) {
    const T = washTex(); flushBrush(); push();
    const tile = (img, mode, a) => { blendMode(mode); tint(255, 255 * a); for (let x = Math.floor(x0 / ts) * ts; x < x1; x += ts) for (let y = Math.floor(y0 / ts) * ts; y < y1; y += ts) image(img, x, y, ts + 1, ts + 1); };
    tile(T.D, MULTIPLY, k); tile(T.L, ADD, .3 * k);
    noTint(); blendMode(BLEND); pop();
  }
  // watercolour-ish shape without an expensive fill: a darker pooled rim, the body inset, a lighter bloom inside
  function wet(P, col, o = {}) {
    let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
    const ins = (k, dx = 0, dy = 0) => P.map(([x, y]) => [lerp(x, cx, k) + dx, lerp(y, cy, k) + dy]);
    paint(P, { wash: o.rim || mixCol(col, '#2A2350', .28), ink: o.ink ?? null, sw: o.sw });
    paint(ins(o.k ?? .07), { wash: col, ink: null });
    if (o.bloom !== false) paint(ins(o.kb ?? .38, o.bx ?? 0, o.by ?? 0), { wash: o.bloomCol || '#FFF6EA', washOp: o.bloomOp ?? 60, ink: null });
  }
  const wobble = (P, id, a) => P.map(([x, y], i) => [x + (hash(id * 3.7 + i * 1.3) - .5) * a, y + (hash(id * 5.1 + i * 2.9) - .5) * a]);

  // ---------------------------------------------------------------- the city (static layout, derived from hash only)
  const coast = y => 640 + .1 * (y - 1500) + 34 * Math.sin(y * .0037 + 1) + 14 * Math.sin(y * .011);
  const STAD = [2350, 2150], AZR = [3450, 1060];
  const BX = 300, BY = 240, ST = 50, GX0 = 820, GY0 = -500, NI = 12, NJ = 17;
  const BLD = [], TREES = [];
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) {
    const bx = GX0 + i * BX + ST / 2, by = GY0 + j * BY + ST / 2, bw = BX - ST, bd = BY - ST, cx = bx + bw / 2, cy = by + bd / 2;
    if (bx < coast(cy) + 175) continue;
    if (((cx - STAD[0]) / 720) ** 2 + ((cy - STAD[1]) / 560) ** 2 < 1) continue;
    const id = i * 31 + j * 7;
    if (Math.hypot(cx - AZR[0], cy - AZR[1]) < 230) continue;
    const east = clamp((cx - 2600) / 1200), roofOf = k => ROOFS[Math.floor(hash(k) * ROOFS.length)];
    const add = (x, y, w, d, h, k, extra = {}) => { const roof = roofOf(k + .7); BLD.push({ x, y, w, d, h, roof, wall: mixCol(roof, '#2E2860', .5 + .14 * hash(k + .8)), r: hash(k + .9) < .4 ? 16 + hash(k) * 12 : 0, solar: hash(k + 1.3) < .7, id: k, ...extra }); };
    if (hash(id + 5.1) < .07 + .25 * east) { // one modern tower block
      const w = 120 + hash(id + 1) * 70, d = 100 + hash(id + 2) * 40;
      add(cx - w / 2, cy - d / 2 - 10, w, d, 160 + hash(id + 3) * 180, id * 4, { roof: '#BFC3DD', wall: '#5A6192', r: 0, solar: false, tall: true });
      TREES.push([cx + 70, cy + 70, 26]);
      continue;
    }
    const ty = hash(id + .2);
    if (ty < .62) { // two Bauhaus blocks side by side, a garden strip in front
      for (let a = 0; a < 2; a++) {
        const k = id * 4 + a, w = bw / 2 - 10 - hash(k + .2) * 18, d = bd - 34 - hash(k + .3) * 36;
        add(bx + a * (bw / 2 + 6) + hash(k + .4) * 8, by + 4 + hash(k + .5) * 8, w, d, 32 + hash(k + .6) * 38, k);
      }
      if (hash(id + .3) < .7) TREES.push([bx + bw * (.25 + .5 * hash(id + .7)), by + bd - 14, 22 + hash(id) * 12]);
    } else { // one long building + courtyard trees
      const k = id * 4 + 2, w = bw - 16 - hash(k + .2) * 40, d = bd * (.5 + .2 * hash(k + .3));
      add(bx + 8, by + 6, w, d, 30 + hash(k + .6) * 44, k);
      TREES.push([bx + bw * .3, by + bd - 30, 30 + hash(id + 1) * 10], [bx + bw * .72, by + bd - 24, 24 + hash(id + 2) * 10]);
    }
  }
  BLD.sort((p, q) => (p.y + p.d) - (q.y + q.d));
  const AZT = [ // Azrieli: round (NW), triangle (E), square (S)
    { kind: 'round', x: AZR[0] - 140, y: AZR[1] - 50, s: 86, h: 900 },
    { kind: 'tri', x: AZR[0] + 120, y: AZR[1] - 20, s: 104, h: 840 },
    { kind: 'sq', x: AZR[0] - 10, y: AZR[1] + 140, s: 78, h: 760 }];
  const footOf = z => z.kind === 'round' ? ellPts(z.x, z.y, z.s, z.s * .8, 18)
    : z.kind === 'tri' ? [[z.x, z.y - z.s], [z.x + z.s * .9, z.y + z.s * .55], [z.x - z.s * .9, z.y + z.s * .55]]
    : [[z.x - z.s, z.y - z.s * .8], [z.x + z.s, z.y - z.s * .8], [z.x + z.s, z.y + z.s * .8], [z.x - z.s, z.y + z.s * .8]];
  window.TLV_W = { coast, stadium: STAD, azrieli: AZR, grid: { x0: GX0, y0: GY0, bx: BX, by: BY, street: ST, ni: NI, nj: NJ } };

  // drone lean of a point at height h (world px) under cam
  const lean = (x, y, h, cam) => {
    const k = Math.min(.4, h * cam.zoom / 1500);
    return [(x - cam.cx) * k * .6, (y - cam.cy) * k * .4 - h * (cam.tilt ?? .7)];
  };

  function tlvDroneCam(k, o = {}) {
    const end = o.end || [STAD[0], STAD[1] + 60, 1.45];
    const keys = [[0, [1750, 1250, Math.log(.4)]], [.45, [2050, 1650, Math.log(.75)]], [1, [end[0], end[1], Math.log(end[2])]]];
    const v = kf(clamp(k), keys, ease);
    return { cx: v[0], cy: v[1], zoom: Math.exp(v[2]), tilt: .7 };
  }

  function tlvCity(t, cam = tlvDroneCam(0), o = {}) {
    cam = { rot: 0, tilt: .7, ...cam };
    const z = cam.zoom, hw = W / 2 / z * 1.15 + 120, hh = H / 2 / z * 1.15 + 120;
    const vx0 = cam.cx - hw, vx1 = cam.cx + hw, vy0 = cam.cy - hh, vy1 = cam.cy + hh;
    const inView = (x, y, m = 0) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
    boilSeed('tlv-bg'); paint(rectPts(-80, -80, W + 160, H + 160), { wash: C.ground, ink: null });
    camBegin(cam.cx, cam.cy, z, cam.rot);
    const lw = 1 / Math.max(.5, z);
    // --- ground mottling (big soft washes: the city floor is never one flat colour)
    boilSeed('tlv-mottle');
    for (let i = 0; i < 9; i++) {
      const mx = 900 + hash(i * 3.1) * 3300, my = -300 + hash(i * 4.7) * 3600, r = 500 + 400 * hash(i);
      if (!inView(mx, my, r)) continue;
      paint(ellPts(mx, my, r, r * .7, 14, 30), { wash: ['#3A3563', '#2D3D5A', '#40365E'][i % 3], washOp: 120, ink: null });
    }
    // --- sea, beach, promenade (coast sampled over the view)
    const ys = []; for (let y = Math.floor(vy0 / 160) * 160 - 160; y <= vy1 + 320; y += 160) ys.push(y);
    const cmin = Math.min(...ys.map(coast)), far = vx0 - 400, Y0 = ys[0], Y1 = ys[ys.length - 1];
    if (vx0 < cmin + 300) {
      boilSeed('tlv-sea');
      paint([[far, Y0], ...ys.map(y => [coast(y), y]), [far, Y1]], { wash: C.sea, ink: null });
      // layered translucent swathes: deep water far out, lighter shallows at the shore
      for (let q = 0; q < 3; q++) paint([[far, Y0], ...ys.map(y => [coast(y) - 260 - q * 260 - 70 * Math.sin(y * .003 + q * 2), y]), [far, Y1]], { wash: C.seaDk, washOp: 70, ink: null });
      paint([...ys.map(y => [coast(y) + 4, y]), ...ys.slice().reverse().map(y => [coast(y) - 120 - 40 * Math.sin(y * .008), y])], { wash: C.seaLt, washOp: 110, ink: null });
      paint([...ys.map(y => [coast(y) + 4, y]), ...ys.slice().reverse().map(y => [coast(y) - 45 - 15 * Math.sin(y * .02), y])], { wash: '#6FA0C8', washOp: 90, ink: null });
      // long lazy swell strokes
      for (let i = 0; i < 14; i++) {
        const y = Math.floor(vy0 / 150) * 150 + i * 150 + ((t * 10) % 150), row = Math.round((y - (t * 10) % 150) / 150);
        const xx = coast(y) - 150 - hash(row * 3.1) * 700;
        if (y > vy1 || xx < vx0 - 200) continue;
        inkLine([[xx - 160, y + 6], [xx - 60, y - 4], [xx + 60, y + 3], [xx + 140, y - 2]], 1.1 * lw, '#4F7DAE', 'dry', .6);
      }
      inkLine(ys.map(y => [coast(y) - 10 + 6 * Math.sin(y * .02 + t * 1.2), y]), 1.5 * lw, C.foam, 'dry', .5);
      // moon glint: a column of broken light dashes on a pale pool, following the viewer
      const gx = Math.min(cam.cx - 350 / z, coast(cam.cy) - 380), gy = cam.cy - 150 / z;
      boilSeed('tlv-glint');
      paint(ellPts(gx, gy, 230 / z, 380 / z, 16, 20 / z), { wash: '#6E8FC4', washOp: 70, ink: null });
      for (let i = 0; i < 18; i++) {
        const y = gy + (i - 9) * 40 / z, w = (30 + 60 * hash(i + .3)) / z * (1 - Math.abs(i - 9) / 11), tw = .5 + .5 * Math.sin(t * 5 + i * 2.1);
        if (tw < .2) continue;
        paint(rrPts(gx + (hash(i * 1.7) - .5) * 120 / z - w / 2, y, w, 6 / z, 3 / z), { wash: C.moon, washOp: 140 + 110 * tw, ink: null });
      }
      glowQ(gx, gy, 420 / z, '#8FA8D8', .5);
    }
    boilSeed('tlv-beach');
    paint(ys.map(y => [coast(y), y]).concat(ys.map(y => [coast(y) + 112, y]).reverse()), { wash: C.sand, ink: null });
    paint(ys.map(y => [coast(y) + 50 + 20 * Math.sin(y * .01), y]).concat(ys.map(y => [coast(y) + 112, y]).reverse()), { wash: '#C9B08C', washOp: 120, ink: null });
    paint(ys.map(y => [coast(y) + 118, y]).concat(ys.map(y => [coast(y) + 162, y]).reverse()), { wash: C.streetLt, ink: null });
    // --- streets
    boilSeed('tlv-streets');
    for (let i = 0; i <= NI; i++) {
      const x = GX0 + i * BX; if (x < vx0 - 60 || x > vx1 + 60) continue;
      const ya = Math.max(vy0, GY0), yb = Math.min(vy1, GY0 + NJ * BY); if (yb <= ya) continue;
      paint(rectPts(x - ST / 2, ya, ST, yb - ya, 3), { wash: C.street, ink: null });
    }
    for (let j = 0; j <= NJ; j++) {
      const y = GY0 + j * BY; if (y < vy0 - 60 || y > vy1 + 60) continue;
      const xa = Math.max(vx0, coast(y) + 150), xb = vx1; if (xb <= xa) continue;
      paint(rectPts(xa, y - ST / 2, xb - xa, ST, 3), { wash: C.street, ink: null });
    }
    // trees in the gardens
    boilSeed('tlv-trees');
    for (const [x, y, r] of TREES) if (inView(x, y, r)) {
      paint(ellPts(x + r * .2, y + r * .25, r, r * .7, 10, 3), { wash: '#1E2A40', washOp: 150, ink: null });
      paint(ellPts(x, y, r, r * .85, 11, r * .12), { wash: C.tree, ink: null });
      paint(ellPts(x - r * .25, y - r * .25, r * .5, r * .4, 8, 2), { wash: C.treeLt, ink: null });
    }
    // --- light pools at the crossings + promenade lamps (soft, big, warm)
    const la = o.lamps ?? 1;
    for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
      const x = GX0 + i * BX, y = GY0 + j * BY;
      if (x < coast(y) + 150 || !inView(x, y, 120)) continue;
      if (((x - STAD[0]) / 640) ** 2 + ((y - STAD[1]) / 480) ** 2 < 1) continue;
      glowQ(x, y, 110 + 30 * hash(i * 9 + j), C.lamp, .5 * la);
      glowQ(x, y, 24, '#FFE3A8', .7 * la);
    }
    for (let y = Math.floor(vy0 / 120) * 120; y < vy1; y += 120) glowQ(coast(y) + 140, y, 60, '#FFC978', .7 * la);
    glowFlush();
    // --- stadium
    if (o.stadium !== false && inView(STAD[0], STAD[1], 700)) stadium(t, { x: STAD[0], y: STAD[1], s: 1, zoom: z, ...(o.stadiumO || {}) });
    // --- buildings (sorted south-most last)
    for (const b of BLD) {
      if (!inView(b.x + b.w / 2, b.y + b.d / 2, 260)) continue;
      boilSeed('b' + b.id);
      const L = lean(b.x + b.w / 2, b.y + b.d / 2, b.h, cam);
      const foot = wobble(b.r ? rrPts(b.x, b.y, b.w, b.d, b.r) : rectPts(b.x, b.y, b.w, b.d), b.id, 5), top = mv(foot, L[0], L[1]);
      paint(hull(foot.concat(top)), { wash: mixCol(b.wall, '#1E1A45', .35), ink: null });
      // the south facade (faces the drone): warmer, with rows of windows
      const fy = b.y + b.d, F = [[b.x + (b.r ? b.r * .5 : 0), fy], [b.x + b.w - (b.r ? b.r * .5 : 0), fy], [b.x + b.w + L[0], fy + L[1]], [b.x + L[0], fy + L[1]]];
      if (L[1] < -4) paint(F, { wash: b.wall, ink: null });
      const floors = Math.max(1, Math.round(b.h / (b.tall ? 26 : 17))), cols = b.tall ? 5 : Math.max(2, Math.round(b.w / 34));
      if (L[1] < -10) for (let f = 0; f < floors; f++) {
        const v = (f + .35) / floors, wh = Math.min(10, -L[1] / floors * .45);
        if (!b.tall && hash(b.id * 3 + f) < .3) { // a balcony strip across the floor (Bauhaus ribbon)
          const y = fy + L[1] * v; paint([[b.x + L[0] * v + 4, y + 2], [b.x + b.w + L[0] * v - 4, y + 2], [b.x + b.w + L[0] * v - 4, y + 2 + wh * .5], [b.x + L[0] * v + 4, y + 2 + wh * .5]], { wash: mixCol(b.roof, b.wall, .4), ink: null });
        }
        for (let c = 0; c < cols; c++) {
          const hh = hash(b.id * 13 + f * 5 + c * 1.7); if (hh < .45) continue;
          const u = (c + .5) / cols, ww = b.w / cols * .42, x = b.x + b.w * u + L[0] * v, y = fy + L[1] * v;
          paint(rrPts(x - ww / 2, y - wh, ww, wh, 1.5), { wash: hh > .85 ? '#FFF0C8' : C.win, ink: null });
        }
      }
      wet(top, b.roof, { k: 3 / Math.min(b.w, b.d), kb: .45, bx: -b.w * .08, by: -b.d * .1, bloomOp: 70 });
      if (z > .5) {
        if (b.tall) paint(rectPts(b.x + L[0] + b.w * .3, b.y + L[1] + b.d * .3, b.w * .4, b.d * .35), { wash: '#8C92B8', ink: null });
        else if (b.solar) { // solar water heaters: tilted blue panels + white tanks
          const n = b.w > 110 ? 2 : 1;
          for (let q = 0; q < n; q++) {
            const sx = b.x + L[0] + b.w * (.12 + .45 * q + .15 * hash(b.id + 2.2 + q)), sy = b.y + L[1] + b.d * (.3 + .3 * hash(b.id + 3.3 + q));
            paint([[sx, sy], [sx + 26, sy], [sx + 31, sy + 16], [sx + 5, sy + 16]], { wash: '#3B5A9A', ink: '#26305A', sw: .35 / z });
            paint(rrPts(sx + 2, sy - 9, 26, 8, 4), { wash: '#F4EFE8', ink: '#6A6488', sw: .35 / z });
          }
        }
      }
    }
    // --- moving car lights along the streets
    const cars = Math.round(44 * (o.cars ?? 1));
    for (let i = 0; i < cars; i++) {
      const vert = hash(i * 2.3) < .5, line = Math.floor(hash(i * 5.7) * (vert ? NI : NJ)) + 1, dir = hash(i * 1.9) < .5 ? 1 : -1;
      const sp = 70 + 60 * hash(i * 3.3), span = vert ? NJ * BY : NI * BX, s = frac(hash(i) + dir * t * sp / span) * span;
      const x = vert ? GX0 + line * BX + dir * 11 : GX0 + s, y = vert ? GY0 + s : GY0 + line * BY + dir * 11;
      if (x < coast(y) + 170 || !inView(x, y, 30)) continue;
      if (((x - STAD[0]) / 600) ** 2 + ((y - STAD[1]) / 450) ** 2 < 1) continue;
      glowQ(x, y, 30, dir > 0 ? '#FFF0C8' : '#FF6A5A', .9);
      glowQ(x, y, 8, '#FFFFFF', .9);
    }
    glowFlush();
    mottle(vx0, vy0, vx1, vy1, 1100, .9);
    // --- Azrieli towers (the key shapes: ink outline)
    for (const tw of AZT) {
      const L = lean(tw.x, tw.y, tw.h, cam), foot = footOf(tw), top = mv(foot, L[0], L[1]);
      const all = foot.concat(top); if (!all.some(([x, y]) => inView(x, y, 40))) continue;
      boilSeed('az' + tw.kind);
      paint(hull(all), { wash: C.glass, ink: C.ink, sw: .8 * lw });
      const east = foot.filter(p => p[0] >= tw.x - 2);
      paint(hull(east.concat(mv(east, L[0], L[1]))), { wash: C.glassLt, washOp: 140, ink: null });
      for (let k = 1; k < 14; k++) {
        const f = k / 14, cx = tw.x + L[0] * f, cy = tw.y + tw.s * .6 + L[1] * f;
        inkLine([[cx - tw.s * .7, cy], [cx + tw.s * .5, cy + 1]], .7 * lw, hash(k + tw.h) < .6 ? C.win : '#9FA8D6', 'inkfine', 0);
      }
      paint(top, { wash: '#D5DBF2', ink: C.ink, sw: .7 * lw });
      glowQ(tw.x + L[0], tw.y + L[1], 50 / Math.sqrt(z), '#FF4A3A', .5 + .5 * Math.sin(t * 4 + tw.h));
    }
    glowFlush();
    if (o.after) o.after(cam);
    camEnd();
  }

  // ---------------------------------------------------------------- stadium
  const HOME = [[-.9, 0, 'gk'], [-.55, -.55], [-.6, -.18], [-.6, .2], [-.55, .58], [-.15, -.45], [-.2, 0], [-.12, .45], [.3, -.5], [.38, 0], [.28, .5]];
  function stadium(t, o = {}) {
    const x = o.x ?? 960, y = o.y ?? 560, s = o.s ?? 1, li = o.lights ?? 1, zm = (o.zoom ?? 1) * s, lw = 1 / Math.max(.6, zm);
    if (o.bg) { boilSeed('st-bg'); skyBg(C.sky, C.skyLo); }
    push(); translate(x, y); scale(s);
    boilSeed('st-bowl');
    // outer wall (seen from the south), rim with ink (key shape), stands in tiers
    paint(ellPts(0, 60, 560, 420, 40, 3), { wash: C.concreteDk, ink: C.ink, sw: 1.1 * lw });
    for (let k = 0; k < 7; k++) paint(rectPts(-470 + k * 150, 380 + 20 * Math.sin(k), 16, 50), { wash: '#FFD890', washOp: 180, ink: null }); // entrance lights
    wet(ellPts(0, 0, 560, 420, 40, 3), C.concrete, { ink: C.ink, sw: 1.1 * lw, bloom: false });
    paint(ellPts(0, 6, 520, 385, 40, 3), { wash: '#56497C', ink: null });
    paint(ellPts(0, 6, 470, 345, 40, 3), { wash: '#65578F', ink: null });
    paint(ellPts(-60, -40, 380, 250, 20, 20), { wash: '#7A6BA4', washOp: 70, ink: null });
    // crowd: a stable scatter of colour dabs on the side stands (the ends are painted as blocks below)
    boilSeed('st-crowd');
    for (let i = 0; i < 190; i++) {
      const a = hash(i * 1.37) * TAU, rr = .8 + .19 * hash(i * 2.71);
      if (Math.abs(Math.cos(a)) > .8) continue;
      const cx = Math.cos(a) * 515 * rr, cy = 6 + Math.sin(a) * 380 * rr, hh = hash(i * 5.3);
      paint(ellPts(cx, cy, 8, 6, 6, 1), { wash: hh < .4 ? C.yellow : hh < .65 ? C.blue : hh < .85 ? '#E9DCE8' : C.red, washOp: 210, ink: null });
    }
    // home end (right): yellow crowd with blue stripes; away end (left): a red corner
    const wedge = (a0, a1, r0, r1, col, op = 255) => {
      const P = []; for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10); P.push([Math.cos(a) * 515 * r1, 6 + Math.sin(a) * 380 * r1]); }
      for (let i = 10; i >= 0; i--) { const a = lerp(a0, a1, i / 10); P.push([Math.cos(a) * 515 * r0, 6 + Math.sin(a) * 380 * r0]); }
      paint(P, { wash: col, washOp: op, ink: null });
    };
    const sh = (o.roar ?? .4) * (.5 + .5 * Math.sin(t * 9));
    wedge(-.62, .62, .78, .99, mixCol(C.yellow, C.cream, .15 * sh));
    wedge(-.55, .55, .8, .97, C.yellowDk, 90);
    wedge(-.5, .5, .83, .86, C.blue); wedge(-.5, .5, .92, .95, C.blue);
    wedge(Math.PI - .32, Math.PI + .32, .8, .98, C.red);
    // pitch surround + striped pitch + a lighter bloom where the lights meet
    paint(rrPts(-420, -262, 840, 536, 150, 3), { wash: C.grassDk, ink: null });
    const px0 = -345, py0 = -210, pw = 690, ph = 420;
    for (let i = 0; i < 12; i++) paint(rectPts(px0 + pw * i / 12, py0, pw / 12 + 1, ph, 1.5), { wash: i % 2 ? C.grass : C.grassLt, ink: null });
    paint(ellPts(-40, -30, 300, 170, 18, 20), { wash: '#9AD28A', washOp: 60, ink: null });
    paint(ellPts(120, 60, 200, 110, 14, 16), { wash: '#DDF2B8', washOp: 40, ink: null });
    // light cones from the four floodlights
    const towers = [[-590, -420], [590, -420], [-590, 470], [590, 470]];
    boilSeed('st-cones');
    for (const [tx, ty] of towers) {
      const hx = tx * .96, hy = ty - 150;
      paint([[hx - 30, hy], [hx + 30, hy], [tx * .25 + 140, ty * .12 + 70], [tx * .25 - 140, ty * .12 - 70]], { wash: '#FFF4D2', washOp: 34 * li, ink: null });
    }
    // markings
    boilSeed('st-lines');
    const lc = '#F4F1E6', ls = .9 * lw;
    inkLine([[px0 + 12, py0 + 12], [px0 + pw - 12, py0 + 12], [px0 + pw - 12, py0 + ph - 12], [px0 + 12, py0 + ph - 12], [px0 + 12, py0 + 12]], ls, lc, 'inkfine', 0);
    inkLine([[0, py0 + 12], [0, py0 + ph - 12]], ls, lc, 'inkfine', 0);
    inkLine(ellPts(0, 0, 58, 58, 20).concat([[58, 0]]), ls, lc, 'inkfine', .5);
    for (const sd of [-1, 1]) {
      const gx = sd * (pw / 2 - 12);
      inkLine([[gx, -105], [gx - sd * 100, -105], [gx - sd * 100, 105], [gx, 105]], ls, lc, 'inkfine', 0);
      inkLine([[gx, -45], [gx - sd * 36, -45], [gx - sd * 36, 45], [gx, 45]], ls, lc, 'inkfine', 0);
      paint(rectPts(gx + sd * 2 - (sd > 0 ? 0 : 14), -26, 14, 52), { wash: '#E9E6F0', washOp: 200, ink: C.concreteDk, sw: .5 * lw });
    }
    glowQ(0, 0, 560, '#FFF3CF', .5 * li);
    glowFlush();
    // players
    if (o.players !== false) {
      const att = o.attack ?? .3, pl = [];
      for (let i = 0; i < 11; i++) {
        const [fx, fy, gk] = HOME[i], ph = hash(i * 3.1) * TAU;
        pl.push({ x: (fx + (gk ? 0 : att * .45)) * 310 + 26 * Math.sin(t * .9 + ph), y: fy * 185 + 20 * Math.sin(t * .7 + ph * 1.3), home: true, i });
        pl.push({ x: -((fx - (gk ? 0 : att * .25)) * 310) + 22 * Math.sin(t * .8 + ph + 2), y: -fy * 180 + 22 * Math.cos(t * .6 + ph), home: false, i });
      }
      // ball: passed between Maccabi players (closed form: pass k goes from player a(k) to a(k+1))
      const PS = 1.15, k = Math.floor(t / PS), f = frac(t / PS), who = n => 5 + Math.floor(hash(n * 7.7) * 6);
      const pa = pl.find(p => p.home && p.i === who(k)), pb = pl.find(p => p.home && p.i === who(k + 1));
      const bp = arcPt([pa.x + 8, pa.y + 4], [pb.x + 8, pb.y + 4], 30, ease(f));
      pl.sort((a, b) => a.y - b.y);
      boilSeed('st-players');
      for (const p of pl) {
        const run = Math.sin(t * 12 + p.i), shirt = p.home ? C.yellow : C.red, shorts = p.home ? C.blue : '#F1EBE4';
        paint(ellPts(p.x + 5, p.y + 2, 10, 4, 8), { wash: '#2C4A30', washOp: 120, ink: null });
        inkLine([[p.x - 2, p.y - 6], [p.x - 3 - 3 * run, p.y + 1]], .9 * lw, C.cream, 'inkfine', 0);
        inkLine([[p.x + 2, p.y - 6], [p.x + 3 + 3 * run, p.y + 1]], .9 * lw, C.cream, 'inkfine', 0);
        paint(ellPts(p.x, p.y - 8, 5, 3.4, 8), { wash: shorts, ink: null });
        paint(ellPts(p.x, p.y - 15, 6.2, 7.2, 10), { wash: shirt, ink: C.ink, sw: .5 * lw });
        paint(ellPts(p.x, p.y - 25, 4, 4, 8), { wash: SKIN[p.i % SKIN.length], ink: C.ink, sw: .45 * lw });
      }
      paint(ellPts(bp[0], bp[1] - 4, 3.6, 3.6, 8), { wash: C.cream, ink: C.ink, sw: .35 * lw });
      glowQ(bp[0], bp[1] - 4, 20, '#FFFFFF', .6);
    }
    // floodlight towers (poles + lamp heads) and their light
    boilSeed('st-towers');
    for (const [tx, ty] of towers) {
      const hx = tx * .96, hy = ty - 150;
      inkLine([[tx, ty], [hx, hy + 14]], 2.4 * lw, '#3E3760', 'ink', 0);
      paint(rrPts(hx - 36, hy - 17, 72, 32, 6), { wash: '#FFF6DC', ink: '#3E3760', sw: .9 * lw });
      glowQ(hx, hy, 230, '#FFE9B0', li); glowQ(hx, hy, 70, '#FFFFFF', li);
    }
    glowFlush();
    pop();
    return { home: [x + 450 * s, y + 6 * s] };
  }

  // ---------------------------------------------------------------- ultras: the Maccabi home stand
  const BANDS = [ // y (top of heads), head r, depth (0 far .. 1 near), parallax factor
    { y: 150, r: 13, d: 0, f: .35 }, { y: 215, r: 15, d: .15, f: .42 }, { y: 290, r: 17, d: .3, f: .5 }, { y: 370, r: 19, d: .42, f: .58 },
    { y: 600, r: 24, d: .62, f: .8 }, { y: 690, r: 28, d: .78, f: .95 }];
  function crowdBand(bd, t, roar, pan, key) {
    const { y, r, d, f } = bd, off = -pan * 1000 * f, sp = r * 2.05, x0 = -200 - off, n = Math.ceil((W + 400) / sp) + 2;
    const fade = k => mixCol(k, '#2A2C62', .5 * (1 - d));
    const k0 = Math.floor(x0 / sp);
    // sections of alternating colour (yellow / blue / yellow-with-blue shirts)
    const secW = 9, cols = [C.yellow, C.blue, C.yellow, C.yellowDk, C.blue];
    const bot = y + r * 5.5;
    const headY = (k) => {
      const ph = hash(k * 1.3 + d * 17);
      const jumpA = r * (.25 + 1.9 * roar) * (.6 + .4 * ph);
      const w = Math.sin(t * (4 + 5 * roar) - k * .38 + ph * 1.5);
      return y - Math.max(0, w) * jumpA + r * .2 * Math.sin(t * 2 + k);
    };
    boilSeed(key);
    // dark mass behind the band (bodies in shadow)
    paint(rectPts(-60, y + r * .6, W + 120, bot - y), { wash: fade('#20264F'), ink: null });
    const s0 = Math.floor(k0 / secW);
    for (let s = s0; s * secW < k0 + n; s++) {
      const P = [], ka = s * secW, kb = ka + secW;
      for (let k = ka; k <= kb; k++) {
        const hx = k * sp + off + (hash(k * 2.7) - .5) * r * .5, hy = headY(k), rr = r * (.85 + .3 * hash(k + d));
        P.push([hx - sp / 2, hy + rr * 1.5]);
        for (let q = 0; q <= 4; q++) { const a = Math.PI + q / 4 * Math.PI; P.push([hx + Math.cos(a) * rr, hy + Math.sin(a) * rr * 1.05]); }
      }
      P.push([kb * sp + off + sp / 2, bot], [ka * sp + off - sp / 2, bot]);
      const col = cols[((s % cols.length) + cols.length) % cols.length];
      paint(P, { wash: fade(col), ink: null });
      paint([[ka * sp + off - sp / 2, y + r * 2.4], [(ka + kb) / 2 * sp + off, y + r * (2 + hash(s) * .8)], [kb * sp + off + sp / 2, y + r * 2.6], [kb * sp + off + sp / 2, bot], [ka * sp + off - sp / 2, bot]], { wash: fade(mixCol(col, '#1E2250', .55)), washOp: 150, ink: null });
    }
    // faces + raised arms/scarves on the nearer bands
    if (d > .25) {
      boilSeed(key + 'f');
      for (let k = k0; k < k0 + n; k++) {
        const hx = k * sp + off + (hash(k * 2.7) - .5) * r * .5, hy = headY(k);
        if (hx < -40 || hx > W + 40) continue;
        paint(ellPts(hx, hy + r * .15, r * .52, r * .5, 7), { wash: fade(SKIN[Math.floor(hash(k * 3.9) * SKIN.length)]), washOp: 230, ink: null });
        if (hash(k * 5.3 + d) < .25 + .5 * roar) { // arm(s) up
          const side = hash(k * 1.1) < .5 ? -1 : 1, sw = Math.sin(t * 7 + k) * .25;
          inkLine([[hx + side * r * .8, hy + r * .6], [hx + side * r * (1.1 + sw), hy - r * 1.6]], r * .09, fade(SKIN[((k % 6) + 6) % 6]), 'ink', 0);
        }
      }
      // a few scarves stretched overhead
      for (let k = k0; k < k0 + n; k += 7) {
        if (hash(k * 9.1 + d) > .35 + .4 * roar) continue;
        const hx = k * sp + off, hy = headY(k) - r * 2.2 - r * .3 * Math.sin(t * 6 + k), w = r * 4;
        const P = [[hx - w / 2, hy], [hx + w / 2, hy - r * .2], [hx + w / 2, hy + r * .6], [hx - w / 2, hy + r * .8]];
        paint(P, { wash: fade(k % 2 ? C.yellow : C.blue), ink: fade(C.ink), sw: r * .025 });
        inkLine([[hx - w / 6, hy - r * .05], [hx - w / 6, hy + r * .75]], r * .06, fade(k % 2 ? C.blue : C.yellow), 'ink', 0);
        inkLine([[hx + w / 6, hy - r * .12], [hx + w / 6, hy + r * .68]], r * .06, fade(k % 2 ? C.blue : C.yellow), 'ink', 0);
      }
    }
  }

  // a big front-row fan, waist at (x, y), scale s (head r = 36 s)
  function fan(x, y, s, t, i, roar, o = {}) {
    const ph = hash(i * 4.7), bp = bpOf(t) + ph * .3;
    const hop = Math.max(0, Math.sin(frac(bp) * Math.PI)) * (6 + 70 * roar) * s * (roar > .25 ? 1 : .15);
    const land = Math.exp(-frac(bp) * 9) * roar;
    const sq = .06 * land;
    const yy = y - hop, jersey = o.jersey || (i % 3 === 1 ? C.blue : C.yellow), trim = jersey === C.blue ? C.yellow : C.blue;
    const skin = SKIN[i % SKIN.length], hair = HAIR[i % HAIR.length], sw = 1.2 * s;
    const sx = 1 + sq, sy = 1 - sq;
    const P = (px, py) => [x + px * s * sx, yy + py * s * sy];
    boilSeed('fan' + i);
    // arms (behind the torso when down, drawn first)
    const shoulder = side => P(side * 58, -140);
    const pose = o.pose || ['up', 'pump', 'scarf', 'clap', 'up', 'pump', 'scarf'][i % 7];
    const armPts = side => {
      const sh = shoulder(side), beatK = pulse(t + ph * .2, 5);
      let a1, a2; // angles (screen) of upper arm and forearm, from straight up = -PI/2
      const up = lerp(.25, 1, roar);
      if (pose === 'up') { a1 = -Math.PI / 2 + side * (.55 - .15 * Math.sin(t * 6 + i)) ; a2 = a1 + side * .15; a1 = lerp(side > 0 ? .9 : Math.PI - .9, a1, up); a2 = lerp(side > 0 ? 1.4 : Math.PI - 1.4, a2, up); }
      else if (pose === 'pump') { if (side > 0) { a1 = -Math.PI / 2 + .35 - .3 * beatK * up; a2 = a1 - .5 + .9 * beatK; } else { a1 = Math.PI - .9; a2 = Math.PI - 1.6; } }
      else if (pose === 'scarf') { if (side < 0) { a1 = -Math.PI / 2 - .35; a2 = a1 - .1; } else { a1 = .8; a2 = -.5; } }
      else { const c = .5 + .5 * Math.sin(bpOf(t) * TAU); a1 = side > 0 ? -.3 - .4 * up : Math.PI + .3 + .4 * up; a2 = side > 0 ? Math.PI - .4 - .5 * c : .4 + .5 * c; }
      const L1 = 62 * s, L2 = 58 * s, el = [sh[0] + Math.cos(a1) * L1, sh[1] + Math.sin(a1) * L1], hd = [el[0] + Math.cos(a2) * L2, el[1] + Math.sin(a2) * L2];
      return [sh, el, hd];
    };
    const arms = [-1, 1].map(armPts);
    const drawArm = (A) => {
      paint(ribbon(A, 30 * s, 22 * s), { wash: jersey, ink: C.ink, sw });
      paint(ellPts(A[2][0], A[2][1], 13 * s, 13 * s, 10), { wash: skin, ink: C.ink, sw: sw * .8 });
    };
    // torso
    const torso = [P(-68, -150), P(-40, -162), P(40, -162), P(68, -150), P(72, -60), P(64, 20), P(-64, 20), P(-72, -60)];
    for (const A of arms) if (A[2][1] > A[0][1] + 20 * s) drawArm(A);
    paint(torso, { wash: jersey, ink: C.ink, sw, curv: .3 });
    paint([P(-24, -160), P(0, -128), P(24, -160)], { wash: trim, ink: C.ink, sw: sw * .7 });
    if (jersey === C.yellow) paint(starPts(...P(-30, -100), 11 * s, .5, 6, 0), { wash: C.blue, ink: null });
    else inkLine([P(-68, -95), P(68, -95)], 3 * s, C.yellow, 'ink', 0);
    for (const A of arms) if (!(A[2][1] > A[0][1] + 20 * s)) drawArm(A);
    // head
    const hc = P(0, -200), hr = 36 * s, tilt = .1 * Math.sin(t * 3 + i);
    paint(ellPts(hc[0], hc[1], hr, hr * 1.08, 16), { wash: skin, ink: C.ink, sw });
    const hs = i % 4;
    if (hs === 0) paint([[hc[0] - hr, hc[1] - hr * .1], [hc[0] - hr * .9, hc[1] - hr * .8], [hc[0], hc[1] - hr * 1.2], [hc[0] + hr * .9, hc[1] - hr * .8], [hc[0] + hr, hc[1] - hr * .1], [hc[0] + hr * .5, hc[1] - hr * .55], [hc[0] - hr * .5, hc[1] - hr * .55]], { wash: hair, ink: C.ink, sw: sw * .7, curv: .4 });
    else if (hs === 1) { // yellow cap
      paint([[hc[0] - hr * 1.02, hc[1] - hr * .25], [hc[0] - hr * .8, hc[1] - hr * .95], [hc[0] + hr * .8, hc[1] - hr * .95], [hc[0] + hr * 1.02, hc[1] - hr * .25]], { wash: C.yellow, ink: C.ink, sw: sw * .8, curv: .5 });
      paint([[hc[0] + hr * .3, hc[1] - hr * .35], [hc[0] + hr * 1.5, hc[1] - hr * .3], [hc[0] + hr * .9, hc[1] - hr * .15]], { wash: C.blue, ink: C.ink, sw: sw * .7 });
    } else if (hs === 2) for (let q = 0; q < 6; q++) paint(ellPts(hc[0] + (q - 2.5) * hr * .36, hc[1] - hr * (.85 + .15 * Math.sin(q * 2)), hr * .3, hr * .3, 8), { wash: hair, ink: null });
    else { // blue beanie with pom
      paint([[hc[0] - hr * 1.02, hc[1] - hr * .2], [hc[0] - hr * .75, hc[1] - hr * 1.05], [hc[0] + hr * .75, hc[1] - hr * 1.05], [hc[0] + hr * 1.02, hc[1] - hr * .2]], { wash: C.blue, ink: C.ink, sw: sw * .8, curv: .5 });
      paint(ellPts(hc[0], hc[1] - hr * 1.15, hr * .25, hr * .25, 8), { wash: C.yellow, ink: C.ink, sw: sw * .6 });
    }
    // face: eyes, brows, singing mouth, face-paint stripes
    const sing = .35 + .65 * Math.abs(Math.sin(t * 5.5 + i * 1.3)) * (.4 + .6 * roar), ex = hr * .36, ey = hc[1] - hr * .1;
    if (roar > .6 && i % 2) for (const sd of [-1, 1]) inkLine([[hc[0] + sd * ex - hr * .16, ey + 2 * s], [hc[0] + sd * ex, ey - 5 * s], [hc[0] + sd * ex + hr * .16, ey + 2 * s]], 1.6 * s, C.ink, 'ink', .5);
    else for (const sd of [-1, 1]) paint(ellPts(hc[0] + sd * ex, ey, 4 * s, 5.5 * s, 8), { wash: C.ink, ink: null });
    for (const sd of [-1, 1]) inkLine([[hc[0] + sd * ex - hr * .2, ey - hr * .3 - sing * 4 * s], [hc[0] + sd * ex + hr * .18, ey - hr * .36 - sing * 5 * s]], 1.8 * s, hair, 'ink', 0);
    if (i % 3 === 0) { paint(rectPts(hc[0] - hr * .75, hc[1] + hr * .05, hr * .3, hr * .12), { wash: C.yellow, ink: null }); paint(rectPts(hc[0] - hr * .75, hc[1] + hr * .17, hr * .3, hr * .12), { wash: C.blue, ink: null }); }
    paint(ellPts(hc[0], hc[1] + hr * .45, hr * (.26 + .06 * sing), hr * (.1 + .3 * sing), 12), { wash: '#6B2A33', ink: C.ink, sw: sw * .7 });
    paint(ellPts(hc[0], hc[1] + hr * (.45 + .2 * sing), hr * .14, hr * .07 * sing + 1, 8), { wash: '#E0707A', ink: null });
    // twirling scarf: held in the raised hand, a striped ribbon sweeping round on the beat
    if (pose === 'scarf') {
      const hd = arms[0][2], a = t * 9 + i, R = 70 * s, P2 = [];
      for (let q = 0; q <= 8; q++) { const aa = a - q * .32; P2.push([hd[0] + Math.cos(aa) * R * (q / 8) * 1.3, hd[1] + Math.sin(aa) * R * .45 * (q / 8) - 8 * s]); }
      paint(ribbon(P2, 20 * s, 16 * s), { wash: C.yellow, ink: C.ink, sw: sw * .8 });
      inkLine(P2.filter((_, q) => q % 2 === 0), 4 * s, C.blue, 'ink', .6);
    }
    return { hand: arms[1][2], handL: arms[0][2], top: [hc[0], hc[1] - hr] };
  }

  function flag(px, py, w, h, t, sp, style, key, poleLen) {
    // map (u, v) on the cloth to a point: sine wave travelling out from the pole
    const M = (u, v) => [px + u * w * (1 - .05 * Math.sin(t * sp)), py + v * h + Math.sin(u * 3.2 - t * sp) * h * .22 * u + u * h * .1];
    boilSeed(key);
    inkLine([[px, py - 10], [px, py + poleLen]], 3.2, '#5A4A3A', 'ink', 0);
    const band = (v0, v1, col) => { const P = []; for (let q = 0; q <= 10; q++) P.push(M(q / 10, v0)); for (let q = 10; q >= 0; q--) P.push(M(q / 10, v1)); paint(P, { wash: col, ink: null }); };
    if (style === 'yellow') { band(0, 1, C.yellow); band(.1, .22, C.blue); band(.78, .9, C.blue); }
    else { band(0, 1, C.blue); band(.12, .24, C.yellow); band(.76, .88, C.yellow); }
    const outline = []; for (let q = 0; q <= 10; q++) outline.push(M(q / 10, 0)); for (let q = 10; q >= 0; q--) outline.push(M(q / 10, 1));
    paint(outline, { ink: C.ink, sw: 1.1 });
    // star of David in the middle, drawn through the wave
    const [cx, cy] = M(.5, .5), r = h * .22;
    for (const tri of davidStar(0, 0, r)) {
      const P = tri.map(([dx, dy]) => { const q = M(.5 + dx / w, .5 + dy / h); return q; });
      inkLine(P.concat([P[0]]), 2.4, style === 'yellow' ? C.blueDk : C.yellow, 'ink', 0);
    }
    return [cx, cy];
  }

  function smokeCloud(x, y, t, amt, key, col = '#F7D56A') {
    boilSeed(key);
    const puffs = [];
    for (let i = 0; i < 7; i++) {
      const age = frac(t * .22 + i / 7), r = (50 + 150 * age) * (.6 + .4 * amt);
      puffs.push([x + 170 * age * (1 + hash(i) * .6) + 30 * Math.sin(t + i), y - 300 * age - 20 * hash(i + 2), r, age]);
    }
    for (const [cx, cy, r, age] of puffs) paint(ellPts(cx, cy, r, r * .78, 16, r * .06), { wash: col, washOp: 70 * amt * (1 - age * .85), ink: null });
    for (const [cx, cy, r, age] of puffs) glowQ(cx, cy, r * 1.4, '#FFB84A', .35 * amt * (1 - age));
    glowQ(x, y, 130 * amt, '#FF8A2A', amt);
    glowQ(x, y, 40, '#FFF0B0', amt);
    glowFlush();
  }

  function ultras(t, o = {}) {
    const pan = o.pan ?? 0, roar = clamp(o.roar ?? .5), zoom = o.zoom ?? 1, dy = o.dy ?? 0;
    boilSeed('ul-bg'); paint(rectPts(-80, -80, W + 160, H + 160), { wash: '#1D2152', ink: null });
    push(); translate(W / 2, H / 2); scale(zoom); translate(-W / 2, -H / 2 - dy);
    // roof underside + floodlights
    const roofOff = -pan * 1000 * .3;
    boilSeed('ul-roof');
    paint([[-100, -100], [W + 100, -100], [W + 100, 70], [-100, 110]], { wash: '#2A2750', ink: null });
    inkLine([[-100, 112], [W + 100, 72]], 2, '#6D6399', 'ink', 0);
    for (let k = -2; k < 9; k++) { const lx = 120 + k * 380 + roofOff % 380; glowQ(lx, 96 - lx * .02, 170, '#FFF1C8', .7); glowQ(lx, 96 - lx * .02, 36, '#FFFFFF', .9); }
    glowFlush();
    // upper tier
    for (let b = 0; b < 4; b++) crowdBand(BANDS[b], t, roar * (.7 + .1 * b), pan, 'ul-band' + b);
    // flare in the upper tier (right)
    const fx1 = 1500 - pan * 1000 * .55;
    if (o.flares !== false) smokeCloud(fx1, 380, t, .5 + .5 * roar, 'ul-smoke1');
    // balcony front + tifo
    const tOff = -pan * 1000 * .68;
    boilSeed('ul-balcony');
    paint([[-100, 440], [W + 100, 430], [W + 100, 600], [-100, 610]], { wash: '#2B3470', ink: null, hatch: { d: 16, a: .1, o: { rand: .5 }, b: 'HB', c: '#1B2250', w: 1 } });
    inkLine([[-100, 442], [W + 100, 432]], 2.2, C.yellow, 'ink', 0);
    if (o.tifo !== false) {
      const tx = 420 + tOff, tw = 1180, ty = 452, th = 150;
      const Q = [];
      for (let q = 0; q <= 12; q++) Q.push([tx + tw * q / 12, ty + 3 * Math.sin(q * 1.3 + t * 2)]);
      for (let q = 12; q >= 0; q--) Q.push([tx + tw * q / 12, ty + th + 8 * Math.sin(q * .9 + t * 2.4)]);
      boilSeed('ul-tifo');
      paint(Q, { wash: C.yellow, ink: C.ink, sw: 1.2 });
      inkLine([[tx + 14, ty + 14], [tx + tw - 14, ty + 12]], 5, C.blue, 'ink', 0);
      inkLine([[tx + 14, ty + th - 10], [tx + tw - 14, ty + th - 8]], 5, C.blue, 'ink', 0);
      for (const sx of [tx + 100, tx + tw - 100]) for (const tri of davidStar(sx, ty + th / 2, 44)) inkLine(tri.concat([tri[0]]), 4.5, C.blueDk, 'ink', 0);
      letter('מכבי תל אביב', tx + tw / 2, ty + th / 2 + 4, 100, C.blueDk, { font: '900 104px Rubik', ink: false, rot: .01 * Math.sin(t * 2) });
      flushLetters();
    }
    // lower tier
    for (let b = 4; b < 6; b++) crowdBand(BANDS[b], t, roar, pan, 'ul-band' + b);
    const fx2 = 260 - pan * 1000 * .85;
    if (o.flares !== false) smokeCloud(fx2, 700, t + 2, .45 + .55 * roar, 'ul-smoke2', '#FBE08A');
    mottle(-100, -100, W + 100, H + 100, 1000, .8);
    // giant flags on poles, waved from the lower tier
    if (o.flags !== false) {
      const sp = 3 + 5 * roar, fOff = -pan * 1000 * .9;
      const sway = a => .2 * Math.sin(t * (1.5 + roar) + a);
      flag(150 + fOff + 60 * sway(0), 250, 420, 260, t, sp, 'yellow', 'ul-flag1', 520);
      flag(1560 + fOff + 60 * sway(2), 230, 400, 250, t + .7, sp, 'blue', 'ul-flag2', 540);
      flag(2700 + fOff + 60 * sway(4), 250, 420, 260, t + 1.3, sp, 'yellow', 'ul-flag3', 520);
    }
    // front row: big fans and two drummers
    const fOff2 = -pan * 1000 * 1.25, sF = 1.25;
    for (let i = 0; i < 12; i++) {
      const x = -60 + i * 300 + fOff2 + (hash(i * 3.3) - .5) * 60;
      if (x < -250 || x > W + 250) continue;
      if (i === 3 || i === 8) { drummer(x, 990, sF, t, i, roar); continue; }
      fan(x, 1000 + 20 * hash(i), sF * (.95 + .1 * hash(i + 1)), t, i, roar);
    }
    glowFlush();
    // front wall
    boilSeed('ul-wall');
    paint([[-100, 950], [W + 100, 940], [W + 100, H + 100], [-100, H + 100]], { wash: C.blueDk, ink: C.ink, sw: 1.4 });
    inkLine([[-100, 962], [W + 100, 952]], 7, C.yellow, 'ink', 0);
    pop();
  }

  function drummer(x, y, s, t, i, roar) {
    const f = fan(x, y, s, t, i, roar * .35, { pose: 'clap', jersey: C.blue });
    // big bass drum in front of the belly, sticks hit on the beat
    const hit = pulse(t, 7), dx = x, dy = y - 70 * s;
    boilSeed('drum' + i);
    paint(rrPts(dx - 95 * s, dy - 70 * s, 190 * s, 150 * s, 20 * s), { wash: '#F3EEE4', ink: C.ink, sw: 1.3 * s });
    paint(rrPts(dx - 100 * s, dy - 78 * s, 200 * s, 22 * s, 8 * s), { wash: C.yellow, ink: C.ink, sw: 1.1 * s });
    paint(rrPts(dx - 100 * s, dy + 64 * s, 200 * s, 22 * s, 8 * s), { wash: C.yellow, ink: C.ink, sw: 1.1 * s });
    for (let q = 0; q < 5; q++) inkLine([[dx - 90 * s + q * 45 * s, dy - 56 * s], [dx - 68 * s + q * 45 * s, dy + 64 * s]], 1.2 * s, C.blue, 'ink', 0);
    paint(starPts(dx, dy + 4 * s, 26 * s, .55, 6, 0), { wash: C.blue, ink: null });
    // sticks from the hands down to the skin
    for (const [h, sd] of [[f.hand, 1], [f.handL, -1]]) {
      const tip = [dx + sd * 30 * s, dy - 60 * s - (1 - hit) * 70 * s * (sd > 0 ? 1 : .4)];
      inkLine([h, tip], 3 * s, '#8A6440', 'ink', 0);
    }
    if (hit > .5) glowQ(dx, dy - 60 * s, 60 * s, '#FFE6A0', (hit - .5) * roar);
  }

  // ---------------------------------------------------------------- mast
  const MX = 960, MB = 720, MT = 110;
  window.MAST_TOP = [MX, MT - 70];
  function mast(t, o = {}) {
    const ox = o.x ?? 0, bc = clamp(o.broadcast ?? 0), X = MX + ox;
    if (o.bg !== false) {
      boilSeed('m-sky');
      skyBg(C.sky, '#3D3777');
      glowQ(360 + ox * .3, 200, 260, '#9FB2E0', .6);
      paint(ellPts(360 + ox * .3, 200, 58, 58, 20), { wash: C.moon, ink: null });
      paint(ellPts(380 + ox * .3, 188, 50, 52, 18), { wash: '#F1E3BD', washOp: 120, ink: null });
      for (let i = 0; i < 26; i++) { const sx = hash(i * 3.3) * W, sy = hash(i * 7.1) * 560, tw = .5 + .5 * Math.sin(t * 3 + i); if (tw > .3) paint(starPts(sx + ox * .2, sy, 3 + 4 * hash(i) * tw, .35, 4), { wash: C.cream, ink: null }); }
      // sea horizon on the right + city skyline band
      boilSeed('m-far');
      paint([[1250 + ox * .5, 800], [W + 100, 790], [W + 100, H + 100], [1250 + ox * .5, H + 100]], { wash: C.sea, ink: null });
      for (let i = 0; i < 7; i++) inkLine([[1350 + i * 90 + ox * .5, 830 + i * 30], [1420 + i * 90 + ox * .5, 830 + i * 30]], .8, C.seaLt, 'dry', 0);
      glowQ(1600 + ox * .5, 820, 200, '#7F95C8', .4);
      const P = [[-100, H + 100], [-100, 820]];
      for (let i = 0; i < 16; i++) { const bx = -100 + i * 95 + ox * .5, hh = 40 + 110 * hash(i * 1.9); P.push([bx, 820 - hh], [bx + 80, 820 - hh]); }
      P.push([1420 + ox * .5, 830], [1420 + ox * .5, H + 100]);
      glowFlush();
      paint(P, { wash: '#2C2A5C', ink: null });
      for (let i = 0; i < 30; i++) glowQ(-60 + hash(i * 4.4) * 1450 + ox * .5, 730 + hash(i * 2.2) * 120, 14, C.win, .7);
    }
    // the building (bottom left-centre)
    boilSeed('m-bld');
    const bx = X - 420, bw = 820, by = 700;
    paint(rectPts(bx - 30, by + 60, bw + 60, 500), { wash: '#524877', ink: C.ink, sw: 1.2 });
    paint(rectPts(bx, by, bw, 70), { wash: '#6A5F92', ink: C.ink, sw: 1.2 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
      const lit = hash(r * 13 + c * 3.1) < .6, wx = bx + 10 + c * 92, wy = by + 190 + r * 90;
      paint(rrPts(wx, wy, 58, 48, 6), { wash: lit ? C.win : '#3C3462', ink: null });
      if (lit) glowQ(wx + 29, wy + 24, 60, '#FFC870', .35);
    }
    glowFlush();
    // sign IPTV · ISRAEL on the fascia, red neon שידור חי on the roof
    letter('IPTV · ISRAEL', X - 10, by + 35, 40, C.cream, { font: '700 44px Rubik', ink: false });
    const nx = X + 250, ny = by - 45, flick = Math.sin(t * 23) > -.92 ? 1 : .4;
    paint(rrPts(nx - 150, ny - 42, 300, 84, 12), { wash: '#2A1D3A', ink: C.ink, sw: 1.3 });
    inkLine([[nx - 110, ny + 42], [nx - 110, ny + 60]], 2, C.ink, 'ink', 0); inkLine([[nx + 110, ny + 42], [nx + 110, ny + 60]], 2, C.ink, 'ink', 0);
    glowQ(nx, ny, 200, '#FF3A3A', .8 * flick); glowQ(nx, ny, 90, '#FF7060', .6 * flick);
    letter('שידור חי', nx, ny + 2, 56, '#FFD9D2', { font: '900 58px Rubik', ink: false, stroke: '#FF3B3B' });
    letter('●', nx + 118, ny + 2, 24, '#FF4A4A', { font: '900 24px Rubik', ink: false, alpha: .5 + .5 * Math.sin(t * 6) });
    glowFlush();
    // dishes on the roof
    boilSeed('m-dish');
    for (const [dx, sc] of [[X - 330, 1], [X - 200, .75]]) {
      inkLine([[dx, by], [dx + 6 * sc, by - 40 * sc]], 3, C.ink, 'ink', 0);
      paint(ellPts(dx + 10 * sc, by - 62 * sc, 44 * sc, 28 * sc, 16, 0, -.6), { wash: '#DCD6E6', ink: C.ink, sw: 1.1 });
      inkLine([[dx + 10 * sc, by - 62 * sc], [dx + 44 * sc, by - 96 * sc]], 1.6, C.ink, 'ink', 0);
    }
    mottle(-100, -100, W + 100, H + 100, 1000, .8);
    // lattice mast
    boilSeed('m-mast');
    const lg = (sd, y) => X + sd * lerp(95, 12, (MB - y) / (MB - MT));
    const mc = '#D9D2E6';
    inkLine([[lg(-1, MB), MB], [lg(-1, MT), MT]], 3.2, mc, 'ink', 0);
    inkLine([[lg(1, MB), MB], [lg(1, MT), MT]], 3.2, mc, 'ink', 0);
    const zz = [];
    for (let k = 0; k <= 12; k++) {
      const y = MB - (MB - MT) * k / 12;
      inkLine([[lg(-1, y), y], [lg(1, y), y]], 1.6, mc, 'inkfine', 0);
      zz.push([lg(k % 2 ? 1 : -1, y), y]);
    }
    inkLine(zz, 1.3, mc, 'inkfine', 0);
    inkLine(zz.map(([x, y]) => [2 * X - x, y]), 1.3, '#A99FC4', 'inkfine', 0);
    inkLine([[X, MT], [X, MT - 70]], 2.4, mc, 'ink', 0);
    // broadcast rings from the tip
    const top = [X, MT - 70];
    if (bc > 0) {
      glowQ(top[0], top[1], 160 + 60 * pulse(t, 4), '#8FE3FF', bc * .8);
      boilSeed('m-rings');
      for (let k = 0; k < 4; k++) {
        const age = frac(t * 1.4 + k / 4), r = 40 + age * 420, A = [];
        for (let q = 0; q <= 14; q++) { const a = -Math.PI * .92 + q / 14 * Math.PI * .84; A.push([top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r * .7]); }
        inkLine(A, (3 - 2 * age) * bc, mixCol('#BFF2FF', C.sky, age), 'ink', .5);
      }
    }
    // aviation lights
    for (const [lx, ly] of [[top[0], top[1]], [lg(-1, 330), 330], [lg(1, 330), 330], [lg(-1, 560), 560], [lg(1, 560), 560]]) {
      const on = .5 + .5 * Math.sin(t * 3.5 + ly * .01);
      paint(ellPts(lx, ly, 6, 6, 8), { wash: '#FF5A4A', ink: null });
      glowQ(lx, ly, 70, '#FF3A2A', .4 + .6 * on);
    }
    glowFlush();
    return { top };
  }

  // ---------------------------------------------------------------- packets
  function packetStream(pts, t, o = {}) {
    const n = o.n ?? 10, gap = o.gap ?? .12, sp = o.speed ?? 900, size = o.size ?? 16, spread = o.spread ?? 14, t0 = o.t0 ?? 0;
    const P = through(pts, 8), L = pathLen(P), col = o.col || '#BFE9FF', K = [];
    for (let i = 0; i < n; i++) {
      let age = t - (t0 + i * gap);
      if (o.loop) { const per = L / sp + gap * n; age = ((age % per) + per) % per; }
      if (age < 0) continue;
      const d = age * sp * (.9 + .2 * hash(i * 2.9)); if (d > L) continue;
      const { p, a } = pathAt(P, d), nx = -Math.sin(a), ny = Math.cos(a), off = (hash(i * 5.1) - .5) * 2 * spread + 4 * Math.sin(t * 8 + i);
      const gold = i === o.gold;
      K.push({ i, x: p[0] + nx * off, y: p[1] + ny * off, a, gold, s: size * (gold ? 1.35 : 1) * (.85 + .3 * hash(i)), c: gold ? '#FFD34A' : col });
    }
    boilSeed('pk-tails');
    for (const { x, y, a, s, c, gold } of K) {
      const tl = s * 4, tx = x - Math.cos(a) * tl, ty = y - Math.sin(a) * tl;
      paint(ribbon([[tx, ty], [(x + tx) / 2, (y + ty) / 2], [x, y]], 1, s * .7), { wash: c, washOp: 110, ink: null });
      glowQ(x, y, s * 3, gold ? '#FFC23A' : '#7FD8FF', .9);
    }
    glowFlush();
    for (const { i, x, y, a, s, gold } of K) {
      boilSeed('pk' + i);
      push(); translate(x, y); rotate(a * .25);
      paint(rrPts(-s * .75, -s * .5, s * 1.5, s, s * .18), { wash: gold ? '#FFE07A' : '#E6F7FF', ink: C.ink, sw: .6 });
      inkLine([[-s * .7, -s * .45], [0, s * .1], [s * .7, -s * .45]], .5, C.ink, 'inkfine', 0);
      pop();
      if (gold) {
        const g = o.glint ?? t0 + i * gap + .6, k = t - g;
        if (k > 0 && k < .6) {
          const pop_ = backOut(k / .25) * (1 - seg(k, .35, .6));
          glowQ(x, y, s * 6 * pop_, '#FFF2B0', 1);
          paint(starPts(x + s * .4, y - s * .4, s * 2.2 * pop_, .18, 4, t * 2), { wash: '#FFF7D6', ink: null });
        }
      }
    }
    glowFlush();
  }

  // ---------------------------------------------------------------- model sheet over time
  LOOPS.kit_telaviv = t => {
    if (t < 3.6) {
      const k = seg(t, 0, 3.6), cam = tlvDroneCam(k);
      tlvCity(t, { ...cam, cx: cam.cx + 20 * Math.sin(t * .7) }, { stadiumO: { attack: .4 } });
    } else if (t < 5) {
      const k = seg(t, 3.6, 5);
      tlvCity(t, { cx: STAD[0] + lerp(40, -40, k), cy: STAD[1] + 20, zoom: lerp(2.0, 2.4, ease(k)) }, { stadiumO: { attack: .4 + .3 * k, roar: .5 } });
    } else if (t < 7.8) {
      const k = seg(t, 5, 7.8);
      ultras(t, { pan: ease(k), roar: kf(t, [[5, .25], [5.6, .35], [6.2, 1]]), zoom: 1 + .04 * k });
    } else {
      const k = seg(t, 7.8, 10);
      camBegin(960, lerp(620, 540, ease(k)), 1 + .05 * k);
      const m = mast(t, { broadcast: seg(t, 8.2, 8.6) });
      packetStream([m.top, [1250, 150], [1650, 300], [2300, 420]], t, { t0: 8.6, n: 12, gold: 7 });
      camEnd();
    }
  };
  LOOPS.kit_telaviv.len = 10;

  Object.assign(window, { tlvCity, tlvDroneCam, stadium, ultras, mast, packetStream });
})();
