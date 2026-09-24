// ============================================================================
// S5 · "11,000 km" · global 30.5 – 41.5
// Undersea cable race: Bit as a blazing pulse inside the transparent cable, route-map inset,
// the shark gag (lunge, CHOMP, boing-zap, dazed), cheeky wink, the climb to the Toronto shore.
//
// SHOTS
//  1  30.50-32.10  WIDE establishing: calm abyss, Bit streaks in from the left inside the cable, lights the seabed.
//                  Map inset slides in (ding 30.8 TLV), km rolling.
//  2  32.10-33.95  TRACKING close alongside Bit inside the glass tube. Map dings MRS 32.3, GIB 32.95.
//                  "Marseille... the Atlantic... whoa, shark!" eyes pop at 33.6 (shark silhouette ahead).
//  3  33.95-35.60  REVEAL: the shark hovering over the cable, eyeing the incoming glow. Nom-nom, anticipation.
//  4  35.60-36.00  LUNGE (smear) -> 36.0 CHOMP (impact frame, sparks, shake).
//  5  36.00-37.50  36.2 Bit bounces off the pinched glass at the shark's nose -> ZAP (x-ray), shark dazed, drifts off.
//  6  37.50-38.60  CLOSE: Bit looks back, wink: "Nice try, fishy!" (dazed shark behind).
//  7  38.60-39.75  WIDE racing across the Atlantic, map back, HFX ding 39.3, light rising.
//  8  39.75-41.50  SPLIT-LEVEL crane up: cable climbs the lake slope, surface breaks, Toronto skyline + snow,
//                  YYZ arrive ding 40.5 (shore swell crest), 41.3 light-streak transition.
// ============================================================================
(() => {
  const { clamp, lerp, key, inv, smooth, hash: H } = A;
  const E = A.ease, TAU = Math.PI * 2;
  const GOLD = '#ffc93c';

  // ---------------------------------------------------------------- timing
  const T = {
    start: 30.5, end: 41.5,
    s2: 32.1, s3: 33.95, lunge: 35.6, chomp: 36.0, bounce: 36.2, s6: 37.5, s7: 38.6, s8: 39.75, streak: 41.3,
    dings: { TLV: 30.8, MRS: 32.3, GIB: 32.95, HFX: 39.3, YYZ: 40.5 },
  };
  // route progress (pin fractions measured on the kit's route: MRS .2733, GIB .3929, HFX .8720, YYZ 1)
  const mapP = t => key(t, [[30.8, 0], [32.3, 0.2745, 'inOut'], [32.95, 0.3941, 'inOut'], [34.0, 0.46, 'out'], [39.3, 0.8732, 'inOut'], [40.5, 1.0, 'inOut']]);
  const mapKm = t => Math.round(mapP(t) * 11000);

  // ---------------------------------------------------------------- helpers
  const glowE = (ctx, x, y, rx, ry, color, alpha = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); A.glow(ctx, 0, 0, rx, color, alpha); ctx.restore();
  };
  // screen point of a shark-local point (matches drawShark's transform: translate, scale(flip*s, s), rotate)
  const sharkPt = (x, y, sc, o, lx, ly) => {
    const r = o.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return [x + (o.flip ? -1 : 1) * sc * (lx * c - ly * s), y + sc * (lx * s + ly * c)];
  };
  // reusable offscreen buffer (cleared each use)
  const buf = () => A.layer('s5-buf', 1920, 1080, () => {});
  // Bit feet y from body centre y
  const feetY = (cy, sc) => cy + 70 * sc;

  // closed-form spark burst: returns nothing, draws streaks
  function sparks(ctx, x, y, age, n, seed, o = {}) {
    if (age < 0 || age > (o.life || 0.7)) return;
    const life = o.life || 0.7, spd = o.speed || 900, grav = o.grav ?? 900;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (o.dir ?? -Math.PI / 2) + (H(seed + i * 1.7) - 0.5) * (o.spread ?? TAU), v = spd * (0.35 + H(seed + i * 3.1) * 0.8);
      const li = life * (0.5 + 0.5 * H(seed + i * 5.3)); if (age > li) continue;
      const k = age / li, dragT = age * (1 - 0.45 * k);
      const px = x + Math.cos(a) * v * dragT, py = y + Math.sin(a) * v * dragT + grav * age * age;
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v + 2 * grav * age, L = 0.028;
      ctx.strokeStyle = i % 3 === 0 ? `rgba(160,250,255,${1 - k})` : `rgba(255,${220 - 60 * k | 0},120,${1 - k})`;
      ctx.lineWidth = (o.w || 4) * (1 - k * 0.7);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - vx * L, py - vy * L); ctx.stroke();
    }
    A.glow(ctx, x, y, (o.flash || 160) * Math.max(0, 1 - age / 0.18), 'rgba(255,250,220,0.9)');
    ctx.restore();
  }
  // jagged lightning bolt (deterministic per seed & frame)
  function bolt(ctx, x0, y0, x1, y1, seed, w = 5, col = '#bff8ff') {
    const n = 9, pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let i = 1; i < n; i++) { const u = i / n, j = (H(seed + i * 7.7) - 0.5) * L * 0.22; pts.push([x0 + dx * u + nx * j, y0 + dy * u + ny * j]); }
    pts.push([x1, y1]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    for (const [lw, c] of [[w * 4, 'rgba(41,240,255,0.25)'], [w * 2, 'rgba(120,240,255,0.6)'], [w, col]]) {
      ctx.strokeStyle = c; ctx.lineWidth = lw; A.path(ctx, pts, false); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- map overlay
  const MAPW = 500, MAPH = 280, MAPX = 1390, MAPY = 36;
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  const mapProj = ([lon, lat]) => {
    const L0 = -92, L1 = 40, B0 = merc(24.5), B1 = merc(57), s = Math.min(MAPW / (L1 - L0), MAPH / (B1 - B0));
    return [(MAPW - (L1 - L0) * s) / 2 + (lon - L0) * s, (MAPH - (B1 - B0) * s) / 2 + (B1 - merc(lat)) * s];
  };
  const PIN_LL = { TLV: [34.78, 32.08], MRS: [5.37, 43.3], GIB: [-5.35, 36.14], HFX: [-63.57, 44.65], YYZ: [-79.38, 43.65] };
  function mapOverlay(ctx, t) {
    // slide in / out
    let off = 0, a = 1;
    if (t < T.s3) off = (1 - E.outBack(inv(30.52, 30.8, t))) * 620;
    else if (t < T.s7) return;
    else if (t < 40.8) off = (1 - E.outBack(inv(T.s7, T.s7 + 0.28, t))) * 620;
    else { off = E.in(inv(40.8, 41.1, t)) * 620; }
    if (off > 610) return;
    // ding pop
    let pop = 0;
    for (const k in T.dings) { const d = t - T.dings[k]; if (d >= 0 && d < 0.35) pop = Math.max(pop, Math.sin(d / 0.35 * Math.PI) * (1 - d / 0.35)); }
    const sc = 1 + 0.035 * pop;
    ctx.save();
    ctx.translate(MAPX + off + MAPW / 2, MAPY + MAPH / 2); ctx.scale(sc, sc); ctx.rotate(off * 0.0004); ctx.translate(-MAPW / 2, -MAPH / 2);
    ctx.globalAlpha = a;
    A.drawRouteMap(ctx, 0, 0, MAPW, MAPH, t, { p: mapP(t), km: mapKm(t) });
    // ding bursts on the pins
    ctx.globalCompositeOperation = 'lighter';
    for (const k in T.dings) {
      const d = t - T.dings[k]; if (d < 0 || d > 0.6) continue;
      const [px, py] = mapProj(PIN_LL[k]), u = d / 0.6;
      A.glow(ctx, px, py - 10, 70 * (1 - u) + 10, 'rgba(255,230,120,0.9)', 1 - u);
      ctx.strokeStyle = `rgba(255,220,90,${1 - u})`; ctx.lineWidth = 3 * (1 - u) + 1;
      ctx.beginPath(); ctx.arc(px, py - 10, 8 + u * 46, 0, TAU); ctx.stroke();
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2, r0 = 14 + u * 30, r1 = r0 + 12 * (1 - u); ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * r0, py - 10 + Math.sin(an) * r0); ctx.lineTo(px + Math.cos(an) * r1, py - 10 + Math.sin(an) * r1); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- shared: Bit inside a wide-shot cable
  // draws the gold wake along the cable, the light pool on the seabed, reacting plankton, Bit, and glass over him.
  function bitInCable(ctx, t, o, bx, sc, bo = {}) {
    const cw = o.cableW || 56, cy = A.oceanCablePath(bx, o), vx = bo.vx ?? 2200;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // light washing the seabed + water
    A.glow(ctx, bx, cy, 620 * (bo.light ?? 1), 'rgba(255,190,70,0.30)');
    glowE(ctx, bx - 40, cy + cw * 0.9, 520, 90, 'rgba(255,200,90,0.55)', bo.light ?? 1);
    A.glow(ctx, bx, cy, 170, 'rgba(255,230,150,0.9)');
    // wake: lit cable behind him
    const wake = bo.wake ?? 900, P = [];
    for (let x = bx - wake; x <= bx; x += 16) P.push([x, A.oceanCablePath(x, o)]);
    if (P.length > 1) {
      ctx.lineCap = 'round';
      const g1 = A.linear(ctx, bx - wake, 0, bx, 0, [[0, 'rgba(255,190,60,0)'], [0.7, 'rgba(255,190,60,0.35)'], [1, 'rgba(255,230,140,0.85)']]);
      ctx.strokeStyle = g1; ctx.lineWidth = cw * 0.8; A.path(ctx, P, false); ctx.stroke();
      const g2 = A.linear(ctx, bx - wake * 0.6, 0, bx, 0, [[0, 'rgba(255,255,230,0)'], [1, 'rgba(255,255,230,0.95)']]);
      ctx.strokeStyle = g2; ctx.lineWidth = cw * 0.18; ctx.stroke();
    }
    ctx.restore();
    // binary trail inside the cable
    if (bo.digits !== false) {
      const tp = []; for (let i = 0; i < 18; i++) { const x = bx - 60 * sc / 0.5 - (17 - i) * 26 * (sc / 0.5); tp.push([x, A.oceanCablePath(x, o) + Math.sin(i * 0.9 + t * 9) * 3]); }
      A.drawBinaryTrail(ctx, tp, t, { width: cw * 0.55, size: Math.max(9, cw * 0.3), alpha: 0.85, rows: 1, speed: 300 });
    }
    // Bit
    const ang = Math.atan2(A.oceanCablePath(bx + 10, o) - A.oceanCablePath(bx - 10, o), 20);
    A.drawBit(ctx, bx, feetY(cy, sc), sc, Object.assign({ t, mood: 'joy', limbs: 'fly', vel: [vx, 0], glow: 2, rot: ang, trail: 0.7, mouth: 0 }, bo.bit || {}));
    // glass over him (sells "inside the tube")
    ctx.save();
    const gx0 = bx - 90 * sc / 0.5, gx1 = bx + 90 * sc / 0.5, Q = []; for (let x = gx0; x <= gx1; x += 12) Q.push([x, A.oceanCablePath(x, o)]);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = A.linear(ctx, gx0, 0, gx1, 0, [[0, 'rgba(60,180,200,0)'], [0.5, 'rgba(60,180,200,0.22)'], [1, 'rgba(60,180,200,0)']]);
    ctx.lineWidth = cw; A.path(ctx, Q, false); ctx.stroke();
    ctx.translate(0, -cw * 0.32);
    ctx.strokeStyle = A.linear(ctx, gx0, 0, gx1, 0, [[0, 'rgba(230,255,255,0)'], [0.5, 'rgba(230,255,255,0.8)'], [1, 'rgba(230,255,255,0)']]);
    ctx.lineWidth = Math.max(2, cw * 0.07); A.path(ctx, Q, false); ctx.stroke();
    ctx.restore();
  }
  // plankton that flare as the light passes (screen space)
  function flarePlankton(ctx, t, bx, by, scroll, n = 46, seed = 3) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const par = 0.6 + H(seed + i * 1.3) * 0.7;
      const x = ((H(seed + i * 2.1) * 2200 - scroll * par) % 2200 + 2200) % 2200 - 140;
      const y = 300 + H(seed + i * 4.7) * 700 + Math.sin(t * 0.9 + i) * 10;
      const dx = x - bx, dy = y - by, d = Math.hypot(dx * (dx < 0 ? 0.45 : 1.4), dy * 1.3);
      const f = Math.exp(-d / 260);
      if (f < 0.03) continue;
      const c = H(seed + i * 9) < 0.55 ? '255,220,120' : H(seed + i * 9) < 0.8 ? '120,255,240' : '200,150,255';
      A.glow(ctx, x, y, 8 + 20 * f, `rgba(${c},${0.9 * f})`);
      ctx.fillStyle = `rgba(255,255,240,${f})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- close tube (tracking shots 2 & 6)
  const sandStrip = () => A.layer('s5-sand', 2400, 360, (g, w, h) => {
    const r = A.rng(77);
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#0f5566'], [0.3, '#0a3f52'], [1, '#03182a']]); g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,220,220,0.12)'; g.lineWidth = 3;
    for (let i = 0; i < 180; i++) { const x = r() * w, y = 20 + Math.pow(r(), 0.8) * (h - 20), L = 40 + r() * 120; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y - 7, x + L, y); g.stroke(); }
    for (let i = 0; i < 70; i++) { const x = r() * w, y = 30 + r() * (h - 30), s = 5 + r() * 14 * (y / h + 0.3); g.fillStyle = ['#0d3446', '#145566', '#0b2a3a'][i % 3]; A.ellipse(g, x, y, s, s * 0.55); g.fill(); g.fillStyle = 'rgba(160,240,240,0.14)'; A.ellipse(g, x - s * 0.2, y - s * 0.25, s * 0.5, s * 0.22); g.fill(); }
  });
  function tubeClose(ctx, t, o) {
    const cy = o.cy, R = o.R, sc = o.scroll; // sc: px of tube travelled
    // --- background ocean (no kit cable: pushed off-frame) ---
    ctx.save(); ctx.translate(960, 420); ctx.scale(1.2, 1.2); ctx.translate(-960, -420);
    A.drawOceanFloor(ctx, t, { scroll: o.bgScroll, cableY: 1700, depthTint: 0.1 });
    ctx.restore();
    if (o.behind) o.behind(ctx);
    // murk
    ctx.fillStyle = 'rgba(3,26,40,0.38)'; ctx.fillRect(0, 0, 1920, 1080);
    // sand bed the tube lies on (fast parallax, triple-drawn for motion blur)
    const sy = cy + R * 0.55, ss = sandStrip(), W = 2400;
    for (let k = 0; k < 3; k++) {
      const off = (((sc * 1.05 + k * 26) % W) + W) % W;
      ctx.globalAlpha = k ? 0.3 : 1;
      for (let x = -off; x < 1920; x += W) ctx.drawImage(ss, x, sy, W, 1080 - sy + 4);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = A.linear(ctx, 0, sy, 0, 1080, [[0, 'rgba(2,20,33,0.0)'], [1, 'rgba(2,12,24,0.6)']]); ctx.fillRect(0, sy, 1920, 1080 - sy);
    // contact shadow of the tube on sand
    ctx.fillStyle = A.linear(ctx, 0, cy + R * 0.6, 0, cy + R * 1.35, [[0, 'rgba(1,8,16,0.75)'], [1, 'rgba(1,8,16,0)']]); ctx.fillRect(0, cy + R * 0.6, 1920, R * 0.75);
    // water speed streaks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const y = 40 + H(i * 3.3) * 980, sp = 1.2 + H(i) * 1.6, L = 120 + H(i * 5) * 260;
      const x = 2100 - (((sc * sp * 0.6 + H(i * 7) * 3000) % 2600) + 2600) % 2600;
      ctx.fillStyle = A.linear(ctx, x, 0, x + L, 0, [[0, 'rgba(170,240,255,0.22)'], [1, 'rgba(170,240,255,0)']]); ctx.fillRect(x, y, L, 2);
    }
    ctx.restore();
    // --- tube back wall ---
    ctx.fillStyle = A.linear(ctx, 0, cy - R, 0, cy + R, [[0, 'rgba(60,190,210,0.20)'], [0.5, 'rgba(25,120,145,0.30)'], [1, 'rgba(8,60,80,0.55)']]); ctx.fillRect(0, cy - R, 1920, 2 * R);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // inner fibres (dashed, rushing past)
    const fib = [[-0.62, '#29f0ff', 0.35, 3], [-0.35, '#9ffcff', 0.45, 4], [-0.1, '#29f0ff', 0.3, 3], [0.18, '#ff3fa4', 0.35, 3], [0.42, '#29f0ff', 0.3, 4], [0.66, '#9ffcff', 0.25, 3]];
    fib.forEach(([dy, c, a, w], i) => {
      ctx.strokeStyle = A.hex(c, a * 0.5); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, cy + dy * R); ctx.lineTo(1920, cy + dy * R); ctx.stroke();
      ctx.setLineDash([120 + i * 30, 90 + i * 40]); ctx.lineDashOffset = sc * (1 + i * 0.05);
      ctx.strokeStyle = A.hex(c, a + 0.2); ctx.lineWidth = w + 1; ctx.stroke(); ctx.setLineDash([]);
    });
    // data pulses rushing backward (relative)
    for (let i = 0; i < 9; i++) {
      const lane = fib[i % fib.length][0], y = cy + lane * R, x = 2200 - (((sc * (0.5 + H(i) * 0.6) + H(i * 9) * 3000) % 2600) + 2600) % 2600;
      ctx.fillStyle = A.linear(ctx, x, 0, x + 260, 0, [[0, 'rgba(200,255,255,0.9)'], [1, 'rgba(41,240,255,0)']]); ctx.fillRect(x, y - 3, 260, 6);
      A.glow(ctx, x, y, 26, 'rgba(200,255,255,0.8)');
    }
    ctx.restore();
    // --- Bit (and anything inside the tube) ---
    if (o.inside) o.inside(ctx);
    // --- front glass ---
    ctx.save();
    // clamps / repeater rings passing in front (motion smeared)
    (o.clamps || []).forEach((tc, k) => {
      const x = o.anchorX + (tc - t) * o.clampSpeed; if (x < -400 || x > 2120) return;
      const w2 = 110, big = k % 2 === 0;
      ctx.fillStyle = A.linear(ctx, x - w2 / 2, 0, x + w2 / 2 + 180, 0, [[0, 'rgba(30,100,120,0.95)'], [0.35, 'rgba(30,100,120,0.9)'], [1, 'rgba(30,100,120,0)']]);
      ctx.fillRect(x - w2 / 2, cy - R * 1.12, w2 + 180, R * 2.24);
      A.rrect(ctx, x - w2 / 2, cy - R * 1.12, w2, R * 2.24, 18); ctx.fillStyle = '#1b5c6e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
      ctx.fillStyle = 'rgba(160,255,255,0.35)'; ctx.fillRect(x - w2 / 2 + 8, cy - R * 1.05, 10, R * 2.1);
      ctx.fillStyle = 'rgba(2,20,33,0.35)'; ctx.fillRect(x + w2 / 2 - 26, cy - R * 1.05, 18, R * 2.1);
      if (big) { const bl = 0.5 + 0.5 * Math.sin(t * 6 + k); A.glow(ctx, x, cy - R * 0.8, 60, `rgba(255,63,164,${0.7 * bl})`); ctx.fillStyle = '#ff9ad6'; A.ellipse(ctx, x, cy - R * 0.8, 8, 8); ctx.fill(); }
    });
    // glass sheen
    ctx.fillStyle = A.linear(ctx, 0, cy - R, 0, cy + R, [[0, 'rgba(200,255,255,0.20)'], [0.12, 'rgba(200,255,255,0.06)'], [0.2, 'rgba(200,255,255,0)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(41,240,255,0.14)']]); ctx.fillRect(0, cy - R, 1920, 2 * R);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(230,255,255,0.55)'; ctx.fillRect(0, cy - R * 0.84, 1920, 5);
    ctx.fillStyle = 'rgba(230,255,255,0.18)'; ctx.fillRect(0, cy - R * 0.76, 1920, 16);
    // travelling glints on the glass
    for (let i = 0; i < 5; i++) { const x = 2100 - (((sc * 0.9 + i * 520) % 2600) + 2600) % 2600; ctx.fillStyle = A.linear(ctx, x, 0, x + 340, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x, cy - R * 0.86, 340, 9); }
    ctx.globalCompositeOperation = 'source-over';
    // tube outline edges
    ctx.lineWidth = 9; ctx.strokeStyle = A.OUTLINE;
    ctx.beginPath(); ctx.moveTo(0, cy - R); ctx.lineTo(1920, cy - R); ctx.moveTo(0, cy + R); ctx.lineTo(1920, cy + R); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,250,255,0.8)';
    ctx.beginPath(); ctx.moveTo(0, cy - R + 6); ctx.lineTo(1920, cy - R + 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(41,240,255,0.55)'; ctx.beginPath(); ctx.moveTo(0, cy + R - 6); ctx.lineTo(1920, cy + R - 6); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- shark shot geometry (shots 3-5)
  const SH_O = { scroll: 5200, cableY: 800, cableW: 92 };
  const XB = 900;                                   // bite point on the cable (screen x)
  const cableAt = x => A.oceanCablePath(x, SH_O);
  const SHK = 0.9;                                  // shark scale
  const BITE_ROT = 0.42;                           // shark rotation while biting (nose down, facing left)
  // shark pose over time
  function sharkPose(t) {
    const o = { flip: true, rot: 0, bite: 0.15, mood: 'hungry', t };
    let x, y;
    // biting position: jaw point (local 300,30) on the cable at XB
    const jb = sharkPt(0, 0, SHK, { flip: true, rot: BITE_ROT }, 300, 34), bx = XB - jb[0], by = cableAt(XB) - jb[1] - 6;
    const hx = 1330, hy = 420; // hover
    const bob = Math.sin(t * 1.7) * 10;
    if (t < 35.15) {
      // glide in from the right, settle, eye the cable
      x = key(t, [[33.95, 1560], [34.9, hx, 'out']]); y = hy + bob;
      o.rot = key(t, [[33.95, -0.05], [34.9, 0.1]]) + Math.sin(t * 1.7 + 1) * 0.02;
      // nom-nom anticipation chomps
      o.bite = 0.15 + 0.35 * Math.max(0, Math.sin(inv(34.6, 35.1, t) * Math.PI * 2)) * (t > 34.6 ? 1 : 0);
    } else if (t < T.lunge) {
      // anticipation: coil back & up, jaw opens
      const u = E.inOut(inv(35.15, T.lunge, t));
      x = hx + 90 * u; y = hy - 70 * u + bob * (1 - u);
      o.rot = lerp(0.1, -0.3, u); o.bite = lerp(0.15, 1, u);
    } else if (t < T.chomp) {
      const u = E.in(inv(T.lunge, T.chomp, t));
      x = lerp(hx + 90, bx, u); y = lerp(hy - 70, by, u);
      o.rot = lerp(-0.3, BITE_ROT, E.inOut(inv(T.lunge, T.chomp, t)));
      o.bite = t < 35.9 ? 1 : lerp(1, 0, inv(35.9, T.chomp, t));
    } else if (t < 36.3) {
      // clamped on the cable, shudders
      x = bx + Math.sin(t * 90) * 3; y = by; o.rot = BITE_ROT; o.bite = 0;
      if (t > T.bounce) { o.bite = 0.25 * inv(T.bounce, 36.3, t); }
    } else {
      // dazed: released, drifts up-right, lolling
      const u = t - 36.3;
      x = bx + 260 * E.out(clamp(u / 1.4)) + 40 * u; y = by - 320 * E.out(clamp(u / 1.6)) - 20 * u;
      o.rot = BITE_ROT - 0.55 * E.out(clamp(u / 0.9)) + Math.sin(t * 2.2) * 0.1;
      o.mood = 'dazed'; o.bite = 0.35 + 0.05 * Math.sin(t * 3);
    }
    return { x, y, o };
  }
  // Bit x in the shark shot
  function sharkBitX(t) {
    if (t < T.bounce) return key(t, [[34.95, -140], [T.bounce, XB - 58, 'lin']]);
    if (t < 36.75) return XB - 58 - 150 * E.out(inv(T.bounce, 36.5, t));
    return key(t, [[36.75, XB - 208], [37.5, 2150, 'in']]);
  }

  function shotShark(ctx, t) {
    const lt = t - T.s3;
    // camera: slow push on the shark, then a reframe for the chomp, shake on impact
    let cz = key(t, [[33.95, 1.0], [35.5, 1.1, 'inOut'], [35.62, 1.02, 'out'], [35.98, 1.02], [36.02, 1.24, 'out'], [36.6, 1.2], [37.5, 1.04, 'inOut']]);
    let cx = key(t, [[33.95, 1080], [35.5, 1170, 'inOut'], [35.62, 1000, 'out'], [35.98, 980], [36.02, 930, 'out'], [36.6, 960], [37.5, 1060, 'inOut']]);
    let cyc = key(t, [[33.95, 560], [35.5, 520], [35.62, 590, 'out'], [35.98, 600], [36.02, 630, 'out'], [36.6, 600], [37.5, 540, 'inOut']]);
    const shake = Math.max(0, 1 - (t - T.chomp) / 0.45) * (t >= T.chomp ? 2.2 : 0) + Math.max(0, 1 - (t - T.bounce) / 0.4) * (t >= T.bounce ? 1.6 : 0);
    ctx.save();
    A.camera(ctx, { x: cx, y: cyc, zoom: cz, shake, t });
    A.drawOceanFloor(ctx, t, Object.assign({ depthTint: 0.12 }, SH_O));
    const P = sharkPose(t);
    const bx = sharkBitX(t), bcy = cableAt(bx);
    const bitVis = bx > -200 && bx < 2100;
    // incoming glow on the left before Bit enters
    if (t < 35.2) { const k = inv(34.2, 35.1, t); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowE(ctx, -40, cableAt(0), 520 * k + 1, 260 * k + 1, 'rgba(255,190,70,0.5)', k); ctx.restore(); }
    // shark rim light from Bit
    const shIntensity = bitVis ? Math.exp(-Math.abs(bx - P.x) / 700) : 0;
    // --- shark behind cable while hovering; over the cable while biting (jaws around it) ---
    const drawSharkNow = () => {
      // lunge smear ghosts
      if (t >= T.lunge && t < T.chomp + 0.05) {
        const A0 = sharkPose(T.lunge - 0.001), A1 = sharkPose(T.chomp - 0.001), dx = A1.x - A0.x, dy = A1.y - A0.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        const k = 1 - inv(T.chomp - 0.1, T.chomp + 0.05, t);
        for (let i = 0; i < 16; i++) {
          const off = (H(i * 3.7) - 0.5) * 420, back = 120 + H(i * 1.9) * 380, len = 160 + H(i * 5.1) * 320;
          const cx0 = P.x - ux * back - uy * off, cy0 = P.y - uy * back + ux * off;
          ctx.strokeStyle = `rgba(200,250,255,${0.35 * k})`; ctx.lineWidth = 2 + H(i) * 4;
          ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 - ux * len, cy0 - uy * len); ctx.stroke();
        }
        ctx.restore();
      }
      if (t >= T.lunge && t < T.chomp) {
        for (let g = 3; g >= 1; g--) {
          const P2 = sharkPose(t - g * 0.035);
          ctx.save(); ctx.globalAlpha = 0.18 / g; A.drawShark(ctx, P2.x, P2.y, SHK, P2.o); ctx.restore();
        }
      }
      A.drawShark(ctx, P.x, P.y, SHK, P.o);
      if (shIntensity > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const n = sharkPt(P.x, P.y, SHK, P.o, 250, 20); A.glow(ctx, n[0], n[1], 320, 'rgba(255,190,80,0.35)', shIntensity); ctx.restore(); }
    };
    const biting = t >= 35.93 && t < 36.36;
    if (!biting) drawSharkNow();
    // Bit in the cable
    if (bitVis) {
      let bo = { mood: 'determined', vx: 1400, light: 0.9, wake: 700 };
      const bb = { mood: 'determined', look: [1, 0], mouth: 0 };
      if (t >= T.bounce && t < 36.75) {
        const u = inv(T.bounce, 36.75, t);
        bb.mood = 'panic'; bb.squash = t < 36.28 ? 0.35 * (1 - inv(T.bounce, 36.28, t)) : 0; bb.rot = -Math.sin(u * Math.PI) * 0.9; bb.vel = [-600 * (1 - u), 0]; bb.limbs = 'fly';
        bb.look = [Math.sin(t * 40) * 0.8, Math.cos(t * 37) * 0.5];
        bo.vx = -500 * (1 - u); bo.digits = false;
      } else if (t >= 36.75) { bb.mood = 'determined'; bb.look = [1, 0]; bo.vx = 2000; }
      bo.bit = bb;
      bitInCable(ctx, t, SH_O, bx, 0.62, bo);
    }
    if (biting) {
      drawSharkNow();
      // pinch: the cable glass squeezed under the teeth
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, XB, cableAt(XB), 90, 'rgba(160,250,255,0.6)');
      ctx.restore();
    }
    // CHOMP sparks
    sparks(ctx, XB - 10, cableAt(XB) - 10, t - T.chomp, 34, 11, { speed: 1100, flash: 260 });
    sparks(ctx, XB - 50, cableAt(XB) - 20, t - T.bounce, 26, 29, { speed: 800, flash: 180, grav: 400 });
    // ZAP on the nose
    if (t >= T.bounce && t < 36.42) {
      const nose = sharkPt(P.x, P.y, SHK, P.o, 345, -2), fr = Math.floor(t * 30);
      const from = [XB - 60, cableAt(XB) - 20];
      for (let k = 0; k < 3; k++) bolt(ctx, from[0], from[1], nose[0] + (H(fr + k) - 0.5) * 60, nose[1] + (H(fr + k + 4) - 0.5) * 60, fr * 13 + k * 5, 5 - k);
      const eye = sharkPt(P.x, P.y, SHK, P.o, 150, -40), fin = sharkPt(P.x, P.y, SHK, P.o, -90, -200), tail = sharkPt(P.x, P.y, SHK, P.o, -330, 0);
      bolt(ctx, nose[0], nose[1], eye[0], eye[1], fr * 7 + 1, 4);
      bolt(ctx, eye[0], eye[1], fin[0], fin[1], fr * 7 + 2, 3);
      bolt(ctx, eye[0], eye[1], tail[0], tail[1], fr * 7 + 3, 3);
    }
    ctx.restore();
    // X-RAY flicker frames on the zap (alternating), drawn in screen space via buffer
    const zf = Math.floor((t - T.bounce) * 30);
    if (t >= T.bounce && zf < 7 && zf % 2 === 0) xray(ctx, t, P, { x: cx, y: cyc, zoom: cz, shake, t });
    // IMPACT FRAME on the chomp (2 frames)
    const cf = Math.round((t - T.chomp) * 30);
    if (cf === 0 || cf === 1) impactFrame(ctx, t, cf, [960 + (XB - cx) * cz, 540 + (cableAt(XB) - cyc) * cz]);
    // dazed stars ring is drawn by the kit; add a little "zzt" smoke puff
    if (t > 36.3 && t < 37.5) {
      ctx.save(); A.camera(ctx, { x: cx, y: cyc, zoom: cz, t });
      for (let i = 0; i < 6; i++) {
        const u = clamp((t - 36.3 - i * 0.08) / 0.9); if (u <= 0 || u >= 1) continue;
        const n = sharkPt(P.x, P.y, SHK, P.o, 330, -40);
        ctx.fillStyle = `rgba(40,70,90,${0.5 * (1 - u)})`; A.ellipse(ctx, n[0] + (H(i) - 0.5) * 60, n[1] - u * 120, 16 + u * 40, 16 + u * 40); ctx.fill();
      }
      ctx.restore();
    }
  }
  function xray(ctx, t, P, cam) {
    const b = buf(), g = b.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1920, 1080);
    g.save(); A.camera(g, cam); A.drawShark(g, P.x, P.y, SHK, Object.assign({}, P.o, { bite: 0.6, mood: 'hungry' })); g.restore();
    // tint silhouette electric blue
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#0e3f8a'; g.fillRect(0, 0, 1920, 1080);
    // skeleton
    g.save(); A.camera(g, cam); g.translate(P.x, P.y); g.scale(-SHK, SHK); g.rotate(P.o.rot);
    g.strokeStyle = '#eaffff'; g.fillStyle = '#eaffff'; g.lineCap = 'round'; g.lineWidth = 14;
    g.beginPath(); g.moveTo(-300, 0); g.quadraticCurveTo(-60, -40, 170, -20); g.stroke(); // spine
    for (let i = 0; i < 9; i++) { const x = -250 + i * 45, yc = -12 - Math.sin((i / 9) * Math.PI) * 14; g.lineWidth = 9; g.beginPath(); g.moveTo(x, yc - 40 - i * 3); g.quadraticCurveTo(x + 14, yc, x, yc + 50 + i * 2); g.stroke(); }
    // skull
    g.beginPath(); g.ellipse(250, -40, 90, 62, -0.1, 0, TAU); g.fill();
    g.fillStyle = '#0e3f8a'; g.beginPath(); g.ellipse(250, -55, 26, 26, 0, 0, TAU); g.fill();
    g.fillStyle = '#eaffff'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(190 + i * 20, 12); g.lineTo(200 + i * 20, 40); g.lineTo(210 + i * 20, 12); g.fill(); }
    g.lineWidth = 16; g.beginPath(); g.moveTo(-300, 0); g.lineTo(-380, -100); g.moveTo(-300, 0); g.lineTo(-380, 90); g.stroke();
    g.restore();
    g.globalCompositeOperation = 'source-over';
    ctx.save();
    // electric flash on the whole frame
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(80,200,255,0.18)'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(b, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(b, 0, 0);
    ctx.restore();
  }
  function impactFrame(ctx, t, k, [ix, iy]) {
    ctx.save();
    // posterised inversion
    if (k === 0) { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1920, 1080); }
    else { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,245,220,0.35)'; ctx.fillRect(0, 0, 1920, 1080); }
    ctx.globalCompositeOperation = 'source-over';
    if (k === 0) { ctx.fillStyle = 'rgba(10,8,30,0.25)'; ctx.fillRect(0, 0, 1920, 1080); }
    // burst rays
    ctx.fillStyle = k === 0 ? '#1a1330' : 'rgba(26,19,48,0.6)';
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * TAU + H(i) * 0.2, r0 = 160 + H(i + 3) * 120, r1 = 1500, w = 0.035 + H(i + 5) * 0.03;
      ctx.beginPath(); ctx.moveTo(ix + Math.cos(a - w) * r0, iy + Math.sin(a - w) * r0); ctx.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1); ctx.lineTo(ix + Math.cos(a + w) * r0, iy + Math.sin(a + w) * r0); ctx.fill();
    }
    // "CHOMP!" comic word
    ctx.translate(ix + 60, iy - 330); ctx.rotate(-0.12); const sc = k === 0 ? 1.08 : 1; ctx.scale(sc, sc);
    A.text(ctx, 'CHOMP!', 0, 0, { font: '130px Bangers', fill: k === 0 ? '#1a1330' : '#ffd21f', stroke: k === 0 ? '#ffffff' : '#1a1330', lw: 18 });
    ctx.restore();
  }

  // ---------------------------------------------------------------- shot 1 · wide establishing
  function shotWide(ctx, t) {
    const scroll = key(t, [[30.5, 0], [30.9, 120, 'in'], [32.1, 1900, 'lin']]);
    const o = { scroll, cableY: 780, cableW: 62, depthTint: 0 };
    // gentle crane down + settle after the hard cut
    const z = key(t, [[30.5, 1.1], [31.4, 1.0, 'out']]), cy = key(t, [[30.5, 470], [31.4, 540, 'out']]);
    ctx.save();
    A.camera(ctx, { x: 960, y: cy, zoom: z, t });
    A.drawOceanFloor(ctx, t, o);
    const bx = key(t, [[30.5, -380], [30.58, -380], [31.4, 1120, 'out'], [32.1, 1300, 'inOut']]);
    const bcy = A.oceanCablePath(bx, o);
    flarePlankton(ctx, t, bx, bcy, scroll);
    const vx = t < 31.4 ? 2600 : 1600;
    bitInCable(ctx, t, o, bx, 0.44, { vx, wake: 1300, bit: { mood: 'joy', joyEyes: 'open', mouth: 0 } });
    ctx.restore();
    // cut-in flash (continuity from the tunnel streak)
    const f = 1 - inv(30.5, 30.6, t);
    if (f > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,160,${0.18 * f})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  // ---------------------------------------------------------------- shot 2 · tracking close ("Marseille... whoa, shark!")
  function shotTrack(ctx, t) {
    const lt = t - T.s2;
    const pop = t >= 33.6 ? E.outElastic(clamp((t - 33.6) / 0.5)) : 0;
    const punch = t >= 33.6 ? 1 + 0.12 * E.out(clamp((t - 33.6) / 0.1)) : 1;
    const bxS = key(t, [[32.1, 640], [33.2, 780, 'inOut'], [33.55, 760], [33.7, 700, 'out'], [33.95, 690]]);
    const byS = 520 + Math.sin(t * 5.2) * 8;
    ctx.save();
    ctx.translate(bxS, byS); ctx.scale(punch, punch); ctx.translate(-bxS, -byS);
    const scroll = lt * 2800;
    tubeClose(ctx, t, {
      cy: 540, R: 190, scroll, bgScroll: 6000 + lt * 900, anchorX: bxS, clampSpeed: 2800, clamps: [31.95, 32.62, 33.12, 34.2],
      behind: g => {
        // the shark silhouette ahead in the murk
        if (t > 33.1) {
          const u = inv(33.1, 33.95, t);
          g.save(); g.globalAlpha = 0.75 * smooth(33.1, 33.4, t);
          A.drawShark(g, lerp(1400, 1080, E.out(u)), 215 + Math.sin(t * 1.5) * 8, 0.4, { t, flip: true, mood: 'hungry', bite: 0.2 + 0.3 * smooth(33.5, 33.7, t), look: [-1, 0.6], rot: 0.12 });
          g.restore();
        }
      },
      inside: g => {
        const bo = { t, limbs: 'fly', vel: [1300, 0], glow: 1.6, trail: 0.9 };
        if (t < 32.25) { bo.mood = 'joy'; bo.joyEyes = 'open'; bo.look = [0.8, 0]; }
        else if (t < 32.8) { bo.mood = 'joy'; bo.joyEyes = 'open'; bo.look = [0.55, -0.85]; }
        else if (t < 33.3) { bo.mood = 'joy'; bo.joyEyes = 'open'; bo.look = [-0.2, 0.6]; }
        else if (t < 33.58) { bo.mood = 'neutral'; bo.look = [1, -0.35]; bo.browRaise = 8; }
        else { bo.mood = 'panic'; bo.look = [1, -0.4]; bo.browRaise = 10 + 8 * pop; bo.pupil = 0.55 + 0.25 * (1 - pop); bo.squash = -0.18 * (1 - clamp((t - 33.6) / 0.35)); bo.vel = [700, 0]; }
        // glow of Bit lighting the tube
        g.save(); g.globalCompositeOperation = 'lighter';
        A.glow(g, bxS, byS, 620, 'rgba(255,190,70,0.35)'); A.glow(g, bxS, byS, 240, 'rgba(255,230,150,0.6)');
        g.restore();
        const tp = []; for (let i = 0; i < 16; i++) tp.push([bxS - 90 - (15 - i) * 44, byS + Math.sin(i * 0.7 + t * 7) * 10]);
        A.drawBinaryTrail(g, tp, t, { width: 70, size: 30, speed: 500, alpha: 0.9 });
        A.drawBit(g, bxS, feetY(byS, 1.75), 1.75, bo);
      },
    });
    ctx.restore();
    // "!" pop on shark
    if (t > 33.6) {
      const u = E.outBack(clamp((t - 33.6) / 0.18));
      ctx.save(); ctx.translate(bxS + 150, byS - 230); ctx.rotate(0.15); ctx.scale(u, u);
      A.text(ctx, '!', 0, 0, { font: '150px Bangers', fill: '#ffd21f', stroke: '#1a1330', lw: 14 });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- shot 6 · wink close
  function shotWink(ctx, t) {
    const lt = t - T.s6;
    const bxS = key(t, [[37.5, 1240], [38.6, 1180]]), byS = 520 + Math.sin(t * 5.2) * 8;
    tubeClose(ctx, t, {
      cy: 540, R: 190, scroll: 9000 + lt * 2600, bgScroll: 9000 + lt * 700, anchorX: bxS, clampSpeed: 2600, clamps: [37.62, 38.75],
      behind: g => {
        // dazed shark tumbling away behind, lit faintly
        const u = lt;
        A.drawShark(g, 460 - u * 160, 300 - u * 40, 0.5, { t, flip: false, mood: 'dazed', rot: 0.5 + Math.sin(t * 2) * 0.1 - u * 0.2, bandaid: false });
        g.fillStyle = 'rgba(3,26,40,0.25)'; g.fillRect(0, 0, 1000, 700);
      },
      inside: g => {
        const wink = smooth(38.12, 38.22, t) * (1 - smooth(38.5, 38.6, t));
        const turn = E.outBack(inv(37.52, 37.75, t));
        const bo = { t, limbs: 'fly', vel: [1200, 0], glow: 1.6, trail: 0.9, mood: 'cheeky', look: [lerp(0.6, -1, turn), -0.05], wink, winkEye: 'R', rot: -0.08 * turn };
        g.save(); g.globalCompositeOperation = 'lighter';
        A.glow(g, bxS, byS, 620, 'rgba(255,190,70,0.35)'); A.glow(g, bxS, byS, 240, 'rgba(255,230,150,0.6)');
        g.restore();
        const tp = []; for (let i = 0; i < 16; i++) tp.push([bxS - 90 - (15 - i) * 44, byS + Math.sin(i * 0.7 + t * 7) * 10]);
        A.drawBinaryTrail(g, tp, t, { width: 70, size: 30, speed: 500, alpha: 0.9 });
        A.drawBit(g, bxS, feetY(byS, 1.75), 1.75, bo);
        // wink sparkle
        if (t > 38.18 && t < 38.7) {
          const u = inv(38.18, 38.7, t), sx = bxS - 40, sy = byS - 140;
          g.save(); g.translate(sx, sy); g.rotate(u * 2); g.scale(Math.sin(u * Math.PI) * 1.2, Math.sin(u * Math.PI) * 1.2);
          g.fillStyle = '#fffbe0'; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 8 : 34, a = i / 8 * TAU; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
          A.glow(g, 0, 0, 60, 'rgba(255,240,180,0.8)');
          g.restore();
        }
      },
    });
  }

  // ---------------------------------------------------------------- shot 7 · atlantic crossing (wide, racing, light rising)
  function shotCross(ctx, t) {
    const lt = t - T.s7;
    const scroll = 20000 + lt * 3200;
    const o = { scroll, cableY: 800, cableW: 58, depthTint: 0 };
    const tilt = -0.07 * E.inOut(inv(38.6, 39.75, t));
    ctx.save();
    ctx.translate(960, 540); ctx.rotate(tilt); ctx.scale(1.12, 1.12); ctx.translate(-960, -540 - 30 * inv(38.6, 39.75, t));
    A.drawOceanFloor(ctx, t, o);
    const bx = key(t, [[38.6, 700], [39.75, 1150]]);
    flarePlankton(ctx, t, bx, A.oceanCablePath(bx, o), scroll, 46, 9);
    bitInCable(ctx, t, o, bx, 0.42, { vx: 3200, wake: 1300, bit: { mood: 'joy', joyEyes: 'open', mouth: 0 } });
    ctx.restore();
    // light from above grows
    const k = inv(38.6, 39.75, t);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = A.linear(ctx, 0, 0, 0, 700, [[0, `rgba(120,230,255,${0.22 * k})`], [1, 'rgba(120,230,255,0)']]); ctx.fillRect(0, 0, 1920, 700);
    ctx.restore();
  }

  // ---------------------------------------------------------------- shot 8 · split-level shore, Toronto
  const skyline = () => A.layer('s5-skyline', 1920, 520, (g, w, h) => {
    // sky
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#0b1030'], [0.55, '#1a2350'], [1, '#3a3f78']]); g.fillRect(0, 0, w, h);
    const r = A.rng(41);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.5})`; g.fillRect(r() * w, r() * h * 0.55, 2, 2); }
    // city glow
    g.fillStyle = A.radial(g, 1250, h, 0, 900, [[0, 'rgba(255,171,74,0.35)'], [1, 'rgba(255,171,74,0)']]); g.fillRect(0, 0, w, h);
    // far skyline blocks
    const base = h - 60;
    const bld = (x, bw, bh, col, lit) => {
      g.fillStyle = col; g.fillRect(x, base - bh, bw, bh + 60);
      if (lit) for (let yy = base - bh + 10; yy < base - 6; yy += 14) for (let xx = x + 6; xx < x + bw - 6; xx += 12) if (r() < 0.42) { g.fillStyle = r() < 0.8 ? 'rgba(255,200,110,0.85)' : 'rgba(200,230,255,0.8)'; g.fillRect(xx, yy, 5, 7); }
    };
    for (let i = 0; i < 26; i++) { const x = 760 + i * 44 + r() * 20, bw = 34 + r() * 40, bh = 60 + r() * 160; bld(x, bw, bh, '#232a55', false); }
    for (let i = 0; i < 20; i++) { const x = 800 + i * 52 + r() * 20, bw = 40 + r() * 36, bh = 40 + r() * 230 * (1 - Math.abs(i - 9) / 14); bld(x, bw, bh, '#161b3d', true); }
    // CN Tower
    const cx = 1180;
    g.fillStyle = '#12173a';
    g.beginPath(); g.moveTo(cx - 22, base); g.lineTo(cx - 7, base - 300); g.lineTo(cx + 7, base - 300); g.lineTo(cx + 22, base); g.fill();
    g.fillRect(cx - 4, base - 440, 8, 150);
    g.beginPath(); g.ellipse(cx, base - 300, 30, 14, 0, 0, TAU); g.fill();
    g.fillRect(cx - 26, base - 312, 52, 14);
    g.beginPath(); g.ellipse(cx, base - 372, 12, 7, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,220,150,0.9)'; g.fillRect(cx - 24, base - 306, 48, 3);
    g.fillStyle = 'rgba(160,120,255,0.7)'; g.fillRect(cx - 6, base - 250, 12, 250);
    // snowy shore
    g.fillStyle = '#dfe9ff';
    g.beginPath(); g.moveTo(0, h); g.lineTo(0, base + 20);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, base + 22 - 10 * Math.sin(x / 130) - (x > 1500 ? (x - 1500) * 0.12 : 0));
    g.lineTo(w, h); g.fill();
    g.fillStyle = 'rgba(120,140,200,0.5)'; g.fillRect(0, base + 38, w, 30);
    // pines on the shore, snow-capped
    for (let i = 0; i < 18; i++) {
      const x = 40 + i * 40 + r() * 30, s = 0.6 + r() * 0.6, yb = base + 24;
      g.fillStyle = '#0c1a2a'; g.beginPath(); g.moveTo(x, yb - 90 * s); g.lineTo(x - 22 * s, yb); g.lineTo(x + 22 * s, yb); g.fill();
      g.fillStyle = '#e8f0ff'; g.beginPath(); g.moveTo(x, yb - 90 * s); g.lineTo(x - 8 * s, yb - 58 * s); g.lineTo(x + 8 * s, yb - 58 * s); g.fill();
    }
  });
  function shotShore(ctx, t) {
    const lt = t - T.s8;
    // waterline comes down into frame as the camera cranes up (crest at 40.5)
    const wl = key(t, [[39.75, -120], [40.5, 330, 'out'], [41.5, 380]]);
    const o = { scroll: 32000 + lt * 1400, cableY: 1700, depthTint: 0 };
    // --- underwater part ---
    ctx.save();
    ctx.translate(0, wl + 60);
    A.drawOceanFloor(ctx, t, o);
    ctx.restore();
    // brighter shallows
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = A.linear(ctx, 0, wl, 0, 1080, [[0, 'rgba(120,230,255,0.22)'], [0.4, 'rgba(60,160,190,0.06)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, Math.max(0, wl), 1920, 1080);
    ctx.restore();
    ctx.fillStyle = A.linear(ctx, 0, wl + 200, 0, 1080, [[0, 'rgba(2,20,33,0)'], [1, 'rgba(2,14,26,0.6)']]); ctx.fillRect(0, wl + 200, 1920, 1080);
    // rising lake-bed slope with the cable climbing it
    const slope = x => lerp(1060, wl + 150, E.inOut(clamp(x / 2000)));
    ctx.fillStyle = A.linear(ctx, 0, wl + 100, 0, 1080, [[0, '#1c6a78'], [0.3, '#0f4a5c'], [1, '#04202e']]);
    ctx.beginPath(); ctx.moveTo(0, 1080); for (let x = 0; x <= 1920; x += 20) ctx.lineTo(x, slope(x) + 8 * Math.sin(x / 70)); ctx.lineTo(1920, 1080); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,240,240,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= 1920; x += 20) ctx.lineTo(x, slope(x) + 8 * Math.sin(x / 70)); ctx.stroke();
    // rocks on the slope
    for (let i = 0; i < 7; i++) { const x = ((i * 290 + 80 - lt * 60) % 2100 + 2100) % 2100 - 90, y = slope(x) + 30; ctx.fillStyle = '#0a3446'; A.blob(ctx, [[x - 60, y + 40], [x - 40, y - 10], [x + 10, y - 26], [x + 60, y + 40]]); A.fillStroke(ctx, '#0a3446', 3, 'rgba(2,20,33,0.8)'); }
    // cable
    const cab = x => slope(x) - 26;
    const CP = []; for (let x = -40; x <= 1960; x += 20) CP.push([x, cab(x)]);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(41,240,255,0.14)'; ctx.lineWidth = 150; A.path(ctx, CP, false); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 62; A.path(ctx, CP, false); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,90,110,0.95)'; ctx.lineWidth = 56; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(160,255,255,0.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    // Bit racing up the cable
    const u = key(t, [[39.75, 0.12], [40.5, 0.5, 'lin'], [41.3, 0.9, 'in']]), bx = u * 1920, bcy = cab(bx);
    const ang = Math.atan2(cab(bx + 10) - cab(bx - 10), 20);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, bx, bcy, 560, 'rgba(255,190,70,0.35)'); A.glow(ctx, bx, bcy, 160, 'rgba(255,240,170,0.9)');
    const W = []; for (let x = bx - 1000; x <= bx; x += 20) W.push([x, cab(x)]);
    ctx.strokeStyle = A.linear(ctx, bx - 1000, 0, bx, 0, [[0, 'rgba(255,190,60,0)'], [1, 'rgba(255,230,140,0.9)']]); ctx.lineWidth = 40; ctx.lineCap = 'round'; A.path(ctx, W, false); ctx.stroke();
    ctx.restore();
    A.drawBit(ctx, bx, feetY(bcy, 0.4), 0.4, { t, mood: 'joy', joyEyes: 'open', limbs: 'fly', vel: [2600, 2600 * Math.tan(ang)], rot: ang, glow: 2, mouth: 0 });
    flarePlankton(ctx, t, bx, bcy, o.scroll, 40, 21);
    // --- surface + above water ---
    if (wl > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 1920, wl); ctx.clip();
      ctx.drawImage(skyline(), 0, wl - 520 + 70);
      // CN Tower beacon + city twinkle
      const blink = (Math.floor(t * 1.4) % 2) ? 1 : 0.3;
      A.glow(ctx, 1180, wl - 520 + 70 + 460 - 440, 26, `rgba(255,60,60,${blink})`);
      A.drawSnow && A.drawSnow(ctx, t, { rect: { x: 0, y: 0, w: 1920, h: wl }, density: 1.1, seed: 5 });
      ctx.restore();
    }
    // the water surface line (seen at the split)
    const sw = x => wl + 6 * Math.sin(x / 90 + t * 2.4) + 4 * Math.sin(x / 37 - t * 3.1);
    ctx.save();
    ctx.fillStyle = 'rgba(160,230,255,0.25)'; ctx.beginPath(); ctx.moveTo(0, wl + 40); for (let x = 0; x <= 1920; x += 16) ctx.lineTo(x, sw(x)); ctx.lineTo(1920, wl + 40); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(220,255,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = 0; x <= 1920; x += 16) ctx.lineTo(x, sw(x)); ctx.stroke();
    // city light columns refracting down into the water
    for (let i = 0; i < 16; i++) {
      const x = 780 + i * 62 + Math.sin(t * 2 + i) * 6, L = 160 + H(i) * 200;
      ctx.fillStyle = A.linear(ctx, 0, wl, 0, wl + L, [[0, `rgba(255,190,110,${0.35 + 0.2 * Math.sin(t * 3 + i)})`], [1, 'rgba(255,190,110,0)']]);
      ctx.fillRect(x, wl + 4, 6 + H(i + 3) * 10, L);
    }
    ctx.restore();
    // streak transition 41.3 -> 41.5
    if (t > T.streak - 0.08) {
      const k = inv(T.streak - 0.08, 41.5, t);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.translate(bx, bcy); ctx.rotate(ang - 0.25);
      const L = 3000 * E.out(k), Wd = 20 + 700 * E.in(k);
      ctx.fillStyle = A.linear(ctx, -L * 0.5, 0, L, 0, [[0, 'rgba(255,200,80,0)'], [0.4, 'rgba(255,230,150,0.9)'], [1, 'rgba(255,255,255,1)']]);
      ctx.beginPath(); ctx.ellipse(L * 0.25, 0, L * 0.75 + 1, Wd, 0, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = `rgba(255,248,225,${E.in(k) * 0.95})`; ctx.fillRect(0, 0, 1920, 1080);
    }
  }

  // ---------------------------------------------------------------- scene
  A.scene({
    name: 's5_ocean', start: T.start, end: T.end,
    draw(ctx, s) {
      const t = s.t;
      if (t < T.s2) shotWide(ctx, t);
      else if (t < T.s3) shotTrack(ctx, t);
      else if (t < T.s6) shotShark(ctx, t);
      else if (t < T.s7) shotWink(ctx, t);
      else if (t < T.s8) shotCross(ctx, t);
      else shotShore(ctx, t);
      mapOverlay(ctx, t);
    },
  });
})();
