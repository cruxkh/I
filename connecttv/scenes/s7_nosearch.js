// s7_nosearch: "לא צריך לחפש" / "לא צריך לעבור בין שירותים"   (voice clock v, window 21.95 to 25.35)
// Beats: hot wipe in -> NO slam (22.36) -> search wall + hunting magnifier (22.66) -> red X + shatter (23.18) ->
// relief -> pink NO slam (23.55) -> logo tiles ping-pong between phone and TV (23.92, dizzy 24.22) ->
// bolt X (24.43) -> liquid wave sweeps everything away -> one calm glowing TV (24.8).
(() => {
  const { clamp, lerp, inv, ease, hash, TAU } = A;
  const C = CL.C, W = CL.W, H = CL.H, CX = 960, CY = 410, CAND = CL.CAND;
  const INK = C.ink;
  const cl = clamp;
  const hexMix = (a, b, k) => { const p = s => parseInt(s.slice(1), 16), x = p(a), y = p(b), c = s => Math.round(lerp((x >> s) & 255, (y >> s) & 255, k)); return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1); };
  const sm = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // ---------------------------------------------------------------- background mood (tint keyframes)
  const TINTS = [
    [0, [C.pink, C.purple, C.blue]],
    [22.30, [C.red, C.pink, C.orange]],
    [22.75, [C.pink, C.purple, C.orange]],
    [23.20, [C.red, C.pink, C.purple]],
    [23.42, [C.cyan, C.green, C.blue]],
    [23.62, [C.purple, C.pink, C.blue]],
    [24.30, [C.pink, C.purple, C.orange]],
    [24.60, [C.red, C.purple, C.pink]],
    [24.80, [C.cyan, C.blue, C.purple]],
  ];
  const tintAt = t => { let i = 0; while (i < TINTS.length - 1 && t >= TINTS[i + 1][0]) i++; if (i >= TINTS.length - 1) return TINTS[TINTS.length - 1][1]; const [t0, a] = TINTS[i], [t1, b] = TINTS[i + 1], k = sm(t0, t1, t); return a.map((c, j) => hexMix(c, b[j], k)); };

  // ---------------------------------------------------------------- impacts (cue times) for shake / glow / flash
  const IMPACTS = [[22.36, 20, C.red], [23.12, 8, C.red], [23.18, 16, C.red], [23.30, 14, C.cyan], [23.55, 18, C.pink], [24.38, 8, C.red], [24.43, 18, C.red]];
  const shakeAt = t => { let x = 0, y = 0; for (const [t0, a] of IMPACTS) { const s = CL.shake(t, t0, .42, a); x += s[0]; y += s[1]; } return [x, y]; };

  // ---------------------------------------------------------------- the candy NO sign (circle + slash)
  function noSign(ctx, cx, cy, R, o = {}) {
    const col = o.col || C.red, hi = o.hi || '#FF8F9B', lo = o.lo || '#A80E28';
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scale ?? 1); ctx.globalAlpha *= o.alpha ?? 1;
    const ring = R * .78, lw = R * .28, ol = R * .055, len = 2 * (ring + lw * .18), wd = lw * .98;
    const slash = (fillFn) => { ctx.save(); ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.roundRect(-len / 2, -wd / 2, len, wd, wd / 2); fillFn(); ctx.restore(); };
    // soft drop shadow
    ctx.save(); ctx.translate(R * .05, R * .12); ctx.strokeStyle = 'rgba(2,4,30,.45)'; ctx.lineWidth = lw + ol * 2; ctx.beginPath(); ctx.arc(0, 0, ring, 0, TAU); ctx.stroke(); slash(() => { ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.fill(); ctx.lineWidth = ol * 2; ctx.strokeStyle = 'rgba(2,4,30,.45)'; ctx.stroke(); }); ctx.restore();
    // faint tinted disc
    ctx.fillStyle = A.hex(col, .16); ctx.beginPath(); ctx.arc(0, 0, ring, 0, TAU); ctx.fill();
    // ring
    ctx.lineWidth = lw + ol * 2; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, ring, 0, TAU); ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = A.linear(ctx, 0, -ring - lw / 2, 0, ring + lw / 2, [[0, hi], [.32, col], [1, lo]]); ctx.beginPath(); ctx.arc(0, 0, ring, 0, TAU); ctx.stroke();
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = lw * .17; ctx.beginPath(); ctx.arc(0, 0, ring + lw * .2, Math.PI * 1.06, Math.PI * 1.55); ctx.stroke();
    ctx.lineWidth = lw * .1; ctx.beginPath(); ctx.arc(0, 0, ring - lw * .26, Math.PI * .06, Math.PI * .36); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();
    // slash
    slash(() => { ctx.lineWidth = ol * 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = A.linear(ctx, 0, -wd / 2, 0, wd / 2, [[0, hi], [.34, col], [1, lo]]); ctx.fill(); });
    slash(() => { ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.roundRect(-len / 2 + wd * .5, -wd / 2 + wd * .12, len * .55, wd * .16, wd * .08); ctx.fill(); ctx.beginPath(); ctx.arc(len / 2 - wd * .55, -wd * .1, wd * .07, 0, TAU); ctx.fill(); });
    ctx.restore();
  }

  // cartoon impact burst behind a slam: splash + rings + speed lines. t0 = landing time
  function impactFx(ctx, t, t0, x, y, R, cols, seed) {
    const dt = t - t0; if (dt < -.001 || dt > .8) return;
    const p = ease.out(cl(dt / .38)), fade = 1 - sm(.3, .62, dt);
    if (fade > 0) { ctx.save(); ctx.globalAlpha *= fade; CL.splash(ctx, x, y, R * (.95 + .35 * p), p, seed, cols); ctx.restore(); }
    CL.ring(ctx, x, y, R * 1.25, dt / .5, '#ffffff', 26); CL.ring(ctx, x, y, R * 1.7, (dt - .07) / .55, cols[0], 16);
    if (dt < .28) { const k = dt / .28; ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.globalAlpha *= 1 - k; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + hash(seed + i) * .2, r0 = R * (1.05 + .3 * ease.out(k)), r1 = r0 + R * (.22 + .3 * hash(i + seed * 3)) * (1 - k * .5); ctx.lineWidth = 10 * (1 - k * .6); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); } ctx.restore(); }
  }
  // generic droplet burst (drag + gravity, shrink out)
  function burst(ctx, t, t0, x, y, n, cols, sp, seed, life, r0, g = 1500) {
    const dt = t - t0; if (dt < 0 || dt > life + .05) return;
    for (let i = 0; i < n; i++) {
      const a = hash(seed * 7 + i * 3.3) * TAU, v = sp * (.45 + hash(seed + i * 1.9) * .75), dist = v / 4 * (1 - Math.exp(-4 * dt)), px = x + Math.cos(a) * dist, py = y + Math.sin(a) * dist + g * dt * dt;
      const r = r0 * (.55 + hash(seed + i * 5.5) * .9) * (1 - ease.in(cl(dt / life))); if (r > 1.5) CL.drop(ctx, px, py, r, cols[i % cols.length], t, i + seed);
    }
  }

  // ---------------------------------------------------------------- search wall: question marks + thumbnails
  const QCOL = [C.pink, C.cyan, C.yellow, C.lime, C.orange, C.purple, C.blue, C.green];
  const qSprite = ci => CL.layer('s7q' + ci, 320, 360, g => { CL.title(g, '?', 160, 190, { size: 270, dir: 'ltr', fill: [hexMix(QCOL[ci], '#ffffff', .62), QCOL[ci]] }); });
  const QI = [], TI = [];
  for (let i = 0; i < 18; i++) { const c = i % 6, r = Math.floor(i / 6); QI.push({ x: cl((c + .5) * 320 + (r % 2 ? 90 : -60) + (hash(i * 3.1) - .5) * 100, 110, 1810), y: 165 + r * 240 + (hash(i * 5.3) - .5) * 70, k: .78 + hash(i * 7.9) * .6, ci: i % 8, ph: hash(i * 1.7) * TAU, tin: 22.60 + hash(i * 1.37) * .34, tout: 23.28 + hash(i * 2.31 + 5) * .15 }); }
  for (let i = 0; i < 16; i++) { const c = i % 8, r = Math.floor(i / 8); TI.push({ x: cl((c + .5) * 240 + (hash(i * 4.4) - .5) * 90, 120, 1800), y: 260 + r * 300 + (c % 2) * 90 - 40 + (hash(i * 9.1) - .5) * 80, k: .85 + hash(i * 3.3) * .5, a: CAND[i % 8], b: CAND[(i + 3) % 8], ph: hash(i * 2.9) * TAU, tin: 22.62 + hash(i * .77 + 2) * .32, tout: 23.30 + hash(i * 1.93 + 8) * .14 });
  }
  function outScale(t, tout) { const u = (t - tout) / .17; if (u <= 0) return 1; if (u >= 1) return 0; return Math.max(0, 1 - ease.inBack(u)); }
  function thumb(ctx, x, y, k, rot, a, b) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.roundRect(-72, -44, 150, 104, 18); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-75, -52, 150, 104, 18); ctx.fillStyle = A.linear(ctx, -75, -52, 75, 52, [[0, a], [1, b]]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0, -34, 66, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(20, -2); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.roundRect(-58, 30, 70, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(-58, 40, 40, 6, 3); ctx.fill();
    ctx.restore();
  }
  function world(ctx, t) {
    for (let i = 0; i < TI.length; i++) { const q = TI[i]; const s = CL.pop(t, q.tin, .26) * outScale(t, q.tout); if (s <= .01) continue; thumb(ctx, q.x + 34 * Math.sin(t * (1.2 + hash(i) * .8) + q.ph), q.y + 30 * Math.cos(t * (1.0 + hash(i + 4) * .8) + q.ph * 2) - 20 * (t - 22.6), q.k * s, .3 * Math.sin(t * 1.7 + q.ph), q.a, q.b); }
    for (let i = 0; i < QI.length; i++) {
      const q = QI[i]; const s = CL.pop(t, q.tin, .26) * outScale(t, q.tout); if (s <= .01) continue;
      const x = q.x + 30 * Math.sin(t * (1.3 + hash(i + 2) * .7) + q.ph), y = q.y + 26 * Math.cos(t * (1.1 + hash(i + 7) * .7) + q.ph * 2) - 20 * (t - 22.6), k = q.k * s;
      ctx.save(); ctx.translate(x, y); ctx.rotate(.28 * Math.sin(t * 1.9 + q.ph)); ctx.drawImage(qSprite(q.ci), -160 * k, -190 * k, 320 * k, 360 * k); ctx.restore();
    }
  }
  // vanish pops (rings + drops) for the search wall
  function worldPops(ctx, t) {
    for (const q of QI.concat(TI)) { const dt = t - (q.tout + .1); if (dt < 0 || dt > .5) continue; const x = q.x, y = q.y - 20 * (q.tout - 22.6); CL.ring(ctx, x, y, 130 * (q.k), dt / .4, '#ffffff', 12); burst(ctx, t, q.tout + .1, x, y, 4, [q.ci != null ? QCOL[q.ci] : q.a, '#ffffff'], 380, q.tout * 3, .4, 12, 600); }
  }

  // ---------------------------------------------------------------- the giant magnifier
  function magnifier(ctx, cx, cy, R, rot, lensFn, crack, tt) {
    const lw = R * .2, ol = R * .05;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    // shadow
    ctx.save(); ctx.translate(R * .06, R * .14); ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.arc(0, 0, R + lw / 2, 0, TAU); ctx.fill(); ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.roundRect(R * .9, -R * .18, R * 1.4, R * .36, R * .18); ctx.fill(); ctx.restore();
    // handle
    ctx.save(); ctx.rotate(Math.PI / 4); const hx = R * .88, hl = R * 1.45, hw = R * .38;
    ctx.beginPath(); ctx.roundRect(hx, -hw / 2, hl, hw, hw / 2); ctx.lineWidth = ol * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = A.linear(ctx, 0, -hw / 2, 0, hw / 2, [[0, '#FF8AC8'], [.35, C.pink], [1, '#8A0F5B']]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.roundRect(hx + hw * .5, -hw / 2 + hw * .14, hl - hw * 1.1, hw * .16, hw * .08); ctx.fill();
    ctx.beginPath(); ctx.roundRect(hx - R * .04, -hw * .68, R * .22, hw * 1.36, R * .1); ctx.lineWidth = ol * 1.6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = A.linear(ctx, 0, -hw * .68, 0, hw * .68, [[0, '#FFF3A8'], [.4, C.yellow], [1, '#D9780F']]); ctx.fill();
    ctx.restore();
    // glass
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - lw * .4, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(14,22,100,.5)'; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.save(); ctx.rotate(-rot); ctx.scale(1.55, 1.55); ctx.translate(-cx, -cy); lensFn(); ctx.restore();
    ctx.fillStyle = 'rgba(160,235,255,.16)'; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.fillStyle = A.linear(ctx, -R, -R, R, R, [[0, 'rgba(255,255,255,.34)'], [.32, 'rgba(255,255,255,.06)'], [.33, 'rgba(255,255,255,0)'], [.7, 'rgba(255,255,255,0)'], [.8, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
    if (crack > 0) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hash(i) * .5, L = R * (.8 + hash(i * 2 + 1) * .5) * ease.out(crack); ctx.beginPath(); ctx.moveTo(0, 0); let px = 0, py = 0; for (let j = 1; j <= 5; j++) { const r = L * j / 5, aa = a + (hash(i * 7 + j) - .5) * .35; px = Math.cos(aa) * r; py = Math.sin(aa) * r; ctx.lineTo(px, py); } ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(5,8,38,.6)'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); } }
    ctx.restore();
    // rim
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.lineWidth = lw + ol * 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = A.linear(ctx, -R * .7, -R, R * .7, R, [[0, '#FFF3A8'], [.3, C.yellow], [.7, C.orange], [1, '#C4570A']]); ctx.stroke();
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = lw * .2; ctx.beginPath(); ctx.arc(0, 0, R + lw * .18, Math.PI * 1.08, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R - lw * .4, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
    // glass glint
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-R * .42, -R * .5, R * .2, R * .07, -.8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // straight candy bars for the X over the magnifier
  function candyBar(ctx, cx, cy, ang, len, wd, off, sc, alpha) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(off, 0); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.beginPath(); ctx.roundRect(-len / 2 + 6, -wd / 2 + 16, len, wd, wd / 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-len / 2, -wd / 2, len, wd, wd / 2); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = A.linear(ctx, 0, -wd / 2, 0, wd / 2, [[0, '#FF9AA5'], [.32, C.red], [1, '#A80E28']]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(-len / 2 + wd * .5, -wd / 2 + wd * .13, len - wd, wd * .16, wd * .08); ctx.fill();
    ctx.restore();
  }
  function xOverLens(ctx, t) {
    if (t < 23.02 || t >= 23.40) return; const cx = CX, cy = CY, v = inv(23.30, 23.39, t), sc = 1 + .3 * v, al = 1 - v;
    [[Math.PI / 4, 23.12, -1], [-Math.PI / 4, 23.18, 1]].forEach(([ang, t0, d]) => {
      const u = cl((t - (t0 - .09)) / .09), off = (1 - u * u) * 1700 * d, dt = Math.max(0, t - t0), b = 1 + .1 * Math.exp(-dt * 10) * Math.cos(dt * 40);
      candyBar(ctx, cx, cy, ang, 900, 104, off, sc * b, al * cl(u * 6));
    });
  }
  // shards of glass + drops when the lens shatters
  function shatter(ctx, t, cx, cy, R) {
    const t0 = 23.26, dt = t - t0; if (dt < 0 || dt > .9) return;
    const p = ease.out(cl(dt / .32)), fade = 1 - sm(.24, .5, dt);
    if (fade > 0) { ctx.save(); ctx.globalAlpha *= fade; CL.splash(ctx, cx, cy, R * 1.35, p, 4, [C.cyan, C.blue, '#ffffff', C.cyan, C.purple]); ctx.restore(); }
    CL.ring(ctx, cx, cy, R * 1.6, dt / .5, C.cyan, 22); CL.ring(ctx, cx, cy, R * 2.1, (dt - .06) / .55, '#ffffff', 14);
    for (let i = 0; i < 12; i++) {
      const a = hash(i * 3.7 + 1) * TAU, v = 2200 + hash(i * 2.2) * 2000, dist = v / 4.5 * (1 - Math.exp(-4.5 * dt)), x = cx + Math.cos(a) * dist, y = cy + Math.sin(a) * dist + 1500 * dt * dt, s = (34 + hash(i * 5.3) * 46) * (1 - ease.in(cl(dt / .6)));
      if (s < 2) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(dt * (6 + hash(i) * 12) * (i % 2 ? 1 : -1) + i); ctx.beginPath(); ctx.moveTo(-s, s * .6); ctx.lineTo(s * .2, -s); ctx.lineTo(s, s * .5); ctx.closePath(); ctx.fillStyle = A.linear(ctx, -s, -s, s, s, [[0, 'rgba(255,255,255,.95)'], [.5, 'rgba(120,225,255,.85)'], [1, 'rgba(40,120,255,.85)']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    }
    burst(ctx, t, t0, cx, cy, 40, [C.cyan, C.blue, '#ffffff', C.cyan, C.yellow, C.pink], 4200, 11, .62, 38, 1800);
    burst(ctx, t, t0 + .02, cx + 140, cy + 190, 12, [C.pink, C.purple, C.orange], 2800, 23, .55, 32, 1800);   // handle pieces
  }
  // red X bursts into drops after the shatter
  function xPop(ctx, t) {
    const t0 = 23.30; if (t < t0 || t > 23.9) return;
    for (let s = 0; s < 2; s++) for (let k = -3; k <= 3; k++) { const a = s ? -Math.PI / 4 : Math.PI / 4, d = k * 115; burst(ctx, t, t0 + .02 + Math.abs(k) * .01, CX + Math.cos(a) * d, CY + Math.sin(a) * d, 3, [C.red, C.pink, C.orange], 900, s * 10 + k + 40, .4, 24, 1200); }
  }

  // ---------------------------------------------------------------- devices, tiles, arrows
  const PH = [430, 470], TVP = [1490, 440], PA = [430, 450], PB = [1490, 430], TSC = 1.25;
  const TILES = [
    { k: 'netflix', ts: 23.92, off: 0 }, { k: 'disney', ts: 23.97, off: Math.PI }, { k: 'prime', ts: 24.02, off: 0 }, { k: 'hbo', ts: 24.07, off: Math.PI }, { k: 'appletv', ts: 24.12, off: 0 },
    { k: 'hulu', ts: 24.22, off: Math.PI }, { k: 'paramount', ts: 24.27, off: 0 }, { k: 'netflix', ts: 24.32, off: Math.PI },
  ];
  function Th(t) {
    const a = 23.92, b = 24.22, c = 24.43, w0 = TAU / .70, w1 = TAU / .38;
    let th = w0 * (Math.max(a, Math.min(t, b)) - a);
    if (t > b) th += w1 * (Math.min(t, c) - b);
    if (t > c) { const tau = .05; th += w1 * tau * (1 - Math.exp(-(t - c) / tau)); }
    return th;
  }
  function tileStates(t) {
    const out = []; let bl = 0, br = 0; const T0 = Th(t), dx = PB[0] - PA[0], dy = PB[1] - PA[1], L = Math.hypot(dx, dy), px = -dy / L, py = dx / L, sp0 = Th(24.22);
    TILES.forEach((tl, i) => {
      const sc = CL.pop(t, tl.ts - .14, .22); if (sc <= 0.01) return;
      const th = T0 - Th(tl.ts) + tl.off, u = .5 - .5 * Math.cos(th), sg = Math.sin(th) >= 0 ? 1 : -1, arc = 140 + 50 * hash(i * 3.1);
      const bow = Math.sin(Math.PI * u) * arc * sg;
      const x = PA[0] + dx * u + px * bow, y = PA[1] + dy * u + py * bow, z = 1 + .34 * Math.sin(Math.PI * u), spin = .4 * Math.max(0, T0 - sp0) * (i % 2 ? 1 : -1);
      const rot = .35 * Math.sin(th * .5 + i * 1.3) + spin;
      const d = Math.min(u, 1 - u), g = cl(1 - d / .1); if (u < .5) bl += g; else br += g;
      out.push({ k: tl.k, x, y, s: sc * z, rot, z, u });
    });
    return { tiles: out, bl: Math.min(1, bl), br: Math.min(1, br) };
  }
  const TSTYLE = {
    netflix: { w: 280, h: 158, fill: '#ffffff', dark: '#cfd6ff', pad: .18 }, prime: { w: 280, h: 158, fill: '#ffffff', dark: '#cfd6ff', pad: .16 },
    disney: { w: 280, h: 168, fill: '#3E68FF', dark: '#1a2aa8', pad: .14 }, appletv: { w: 280, h: 158, fill: '#2B2C36', dark: '#050508', pad: .2 },
    hulu: { w: 280, h: 158, fill: '#0F1B3D', dark: '#050a22', pad: .2 }, paramount: { w: 280, h: 168, fill: '#ffffff', dark: '#cfd6ff', pad: .12 },
  };
  function tile(ctx, tl) {
    if (tl.k === 'hbo') {
      const im = CL.logoImg('hbo'), S = 176; ctx.save(); ctx.translate(tl.x, tl.y); ctx.rotate(tl.rot); ctx.scale(tl.s * TSC, tl.s * TSC);
      ctx.fillStyle = 'rgba(2,4,30,.42)'; ctx.beginPath(); ctx.roundRect(-S / 2 + 4, -S / 2 + 14, S, S, 40); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(-S / 2, -S / 2, S, S, 40); ctx.clip(); ctx.fillStyle = '#5b2ad0'; ctx.fillRect(-S / 2, -S / 2, S, S); if (im) ctx.drawImage(im, -S / 2, -S / 2, S, S); ctx.fillStyle = A.linear(ctx, 0, -S / 2, 0, 0, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(0, -S * .3, S * .46, S * .26, 0, 0, TAU); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.roundRect(-S / 2, -S / 2, S, S, 40); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); ctx.restore(); return;
    }
    const st = TSTYLE[tl.k]; CL.logoCard(ctx, tl.k, tl.x, tl.y, st.w, st.h, { rot: tl.rot, scale: tl.s * TSC, fill: st.fill, dark: st.dark, pad: st.pad });
  }
  function swoosh(ctx, p0, c, p1, col, off, alpha, lw = 30) {
    if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(c[0], c[1], p1[0], p1[1]); };
    ctx.setLineDash([64, 62]); ctx.lineDashOffset = -off;
    path(); ctx.lineWidth = lw + 14; ctx.strokeStyle = INK; ctx.stroke(); path(); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); path(); ctx.lineWidth = lw * .26; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke(); ctx.setLineDash([]);
    const a = Math.atan2(p1[1] - c[1], p1[0] - c[0]); ctx.save(); ctx.translate(p1[0], p1[1]); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(lw * .9, 0); ctx.lineTo(-lw * .6, -lw * .95); ctx.lineTo(-lw * .6, lw * .95); ctx.closePath(); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    ctx.restore();
  }
  function screenFill(g, sw, sh, t, flash, seed) {
    g.fillStyle = A.linear(g, 0, -sh / 2, 0, sh / 2, [[0, '#1b2a9a'], [1, '#0a1450']]); g.fillRect(-sw / 2, -sh / 2, sw, sh);
    const cols = 3, rows = 3, cw = sw / cols, ch = sh / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.fillStyle = A.hex(CAND[(r * 3 + c + seed) % 8], .55); g.beginPath(); g.roundRect(-sw / 2 + c * cw + cw * .12, -sh / 2 + r * ch + ch * .12, cw * .76, ch * .76, cw * .12); g.fill(); }
    if (flash > 0) { g.fillStyle = A.hex(CAND[(Math.floor(t * 9) + seed) % 8], .75 * flash); g.fillRect(-sw / 2, -sh / 2, sw, sh); g.fillStyle = `rgba(255,255,255,${.5 * flash})`; g.fillRect(-sw / 2, -sh / 2, sw, sh); }
  }
  function phone(ctx, t, sc, bump, jit) {
    if (sc <= .01) return; ctx.save(); ctx.translate(PH[0] + jit, PH[1]); ctx.rotate(-.07 + .02 * Math.sin(t * 3) + jit * .004); ctx.scale(sc * (1 + .08 * bump), sc * (1 - .06 * bump));
    CL.gel(ctx, 0, 0, 310, 540, { fill: '#8B3DFF', dark: '#2c1290', r: 60, rim: 'rgba(255,255,255,.85)' });
    ctx.save(); ctx.beginPath(); ctx.roundRect(-130, -232, 260, 464, 40); ctx.clip(); ctx.save(); ctx.translate(0, 0); screenFill(ctx, 260, 464, t, bump, 0); ctx.restore();
    ctx.fillStyle = A.linear(ctx, -130, -232, 130, 232, [[0, 'rgba(255,255,255,.2)'], [.4, 'rgba(255,255,255,.04)'], [.41, 'rgba(255,255,255,0)']]); ctx.fillRect(-130, -232, 260, 464); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-40, -256, 80, 16, 8); ctx.fill();
    ctx.restore();
  }
  function tvDev(ctx, t, sc, bump, jit) {
    if (sc <= .01) return; CL.tv(ctx, TVP[0] + jit, TVP[1], 540, 370, (g, sw, sh) => screenFill(g, sw, sh, t, bump, 3), { rot: .04 + jit * .004, scale: sc * (1 + .07 * bump), t, chin: 0 });
  }

  // ---------------------------------------------------------------- final X made of two lightning bolts
  function boltPts(x0, y0, x1, y1, seed, j) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, ks = [[0, 0], [j, 1], [j + .07, -1], [1, 0]];
    return ks.map(([f, s], i) => { const j = (i === 0 || i === ks.length - 1) ? 0 : 62 * s; return [x0 + dx * f + nx * j, y0 + dy * f + ny * j]; });
  }
  function partial(pts, f) {
    let tot = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
    let rem = tot * cl(f); const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const l = seg[i - 1]; if (rem >= l) { out.push(pts[i]); rem -= l; } else { const k = rem / l; out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; } }
    return out;
  }
  function boltX(ctx, t, alpha) {
    const pieces = [[[380, 30, 1540, 800], 24.36, 5], [[1540, 30, 380, 800], 24.43, 9]];   // second stroke lands on the word
    pieces.forEach(([[x0, y0, x1, y1], t0, seed]) => {
      const f = cl((t - (t0 - .1)) / .08); if (f <= 0) return; const pts = partial(boltPts(x0, y0, x1, y1, seed, seed > 6 ? .62 : .3), f), dt = t - t0, hot = dt < .08 ? 1 - Math.max(0, dt) / .08 : 0, fl = .85 + .15 * hash(CL.qs(t, 24) * 3 + seed);
      const stroke = (lw, col, a, comp) => { ctx.save(); ctx.globalAlpha *= a * alpha; if (comp) ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'miter'; ctx.miterLimit = 6; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.restore(); };
      stroke(250, C.red, .16 * fl, true);
      ctx.save(); ctx.translate(8, 18); stroke(150, 'rgba(2,4,30,.45)', 1); ctx.restore();
      stroke(146, INK, 1); stroke(112, hexMix(C.red, '#ffffff', hot * .8), 1); stroke(64, hexMix('#FF7A88', '#ffffff', hot), .9); stroke(22, '#ffffff', .95 * fl);
    });
  }

  // ---------------------------------------------------------------- calm end state: one glowing ConnectTV TV
  function calm(ctx, t) {
    CL.bg(ctx, t, { tint: [C.cyan, C.blue, C.purple], speed: .2 });
    const cx = CX, cy = CY + 10, br = .5 + .5 * Math.sin(t * 2.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.rotate(t * .25); for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.fillStyle = i % 2 ? 'rgba(25,200,255,.10)' : 'rgba(139,61,255,.10)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-160, -1600); ctx.lineTo(160, -1600); ctx.fill(); } ctx.restore();
    A.glow(ctx, cx, cy, 900 + 40 * br, C.cyan, .5 + .12 * br); A.glow(ctx, cx, cy + 40, 640, C.purple, .55);
    const pop = CL.pop(t, 24.56, .27), sc = pop * (1 + .012 * Math.sin(t * 2.2));   // lands 24.80 (overshoot 24.72)
    // CUE 24.80 calm-tv-resolve
    CL.ring(ctx, cx, cy, 520, (t - 24.78) / .9, '#ffffff', 20); CL.ring(ctx, cx, cy, 800, (t - 24.86) / 1.0, C.cyan, 12);
    CL.brand(ctx, cx, cy + 10 * Math.sin(t * 2.6), 760 * sc, 'icon');
    CL.twinkle(ctx, t, 100, 40, 1720, 780, 24, 3, ['#ffffff', C.cyan, C.yellow, C.pink]);
    const s = cl((t - 24.80) / .3); if (s > 0) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .8, r = 560 + 30 * Math.sin(t * 2 + i); CL.spark(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .55, 26 * s * (.6 + .4 * Math.sin(t * 5 + i)), t * 2 + i, i % 2 ? '#fff' : C.yellow); }
  }

  // ---------------------------------------------------------------- stamp state helpers
  function stampSlam(t, t0, dur, big, ox = 0, oy = 0) {
    if (t < t0 - dur) return null; if (t < t0) { const u = (t - (t0 - dur)) / dur; return { sc: 1 + big * (1 - u * u), al: cl(u * 5), rot: -.5 * (1 - u), dx: ox * (1 - u * u), dy: oy * (1 - u * u) }; }
    const dt = t - t0; return { sc: 1 + Math.exp(-dt * 8) * Math.sin(dt * 30) * .1, al: 1, rot: 0, dx: 0, dy: 0 };
  }

  // ---------------------------------------------------------------- main composition of the "chaos" state
  function chaos(ctx, t, push) {
    const tint = tintAt(t); CL.bg(ctx, t, { tint, speed: .35 });
    // impact glows (unshaken, additive)
    IMPACTS.forEach(([t0, , col]) => { const dt = t - t0; if (dt >= 0 && dt < .5) A.glow(ctx, CX, CY, 1300, col, .55 * Math.exp(-dt * 8)); });
    const rel = sm(23.30, 23.38, t) * (1 - sm(23.52, 23.62, t));
    if (rel > 0) { A.glow(ctx, CX, CY, 1200, C.cyan, .45 * rel); A.glow(ctx, CX, CY, 700, C.lime, .25 * rel); }
    const sh = shakeAt(t), dz = sm(24.22, 24.4, t);
    ctx.save(); ctx.translate(sh[0], sh[1]);
    if (push > 0) { ctx.translate(CX + push * 900, 700); ctx.rotate(push * .16); ctx.translate(-CX, -700); }
    const wob = .028 * Math.sin(t * 23) * dz * (1 - push); if (wob) { ctx.translate(CX, 440); ctx.rotate(wob); ctx.translate(-CX, -440); }

    // ---- NO #1 : slam + recede as ghost behind the search wall
    // CUE 22.36 no-slam-1 (giant red NO drops in, shockwave)
    const s1 = stampSlam(t, 22.36, .22, 2.4);
    if (t >= 22.34 && t < 23.3) impactFx(ctx, t, 22.36, CX, CY, 330, [C.red, C.pink, C.orange, C.yellow], 3);
    if (s1) { const r = sm(22.64, 22.9, t), o = sm(23.18, 23.28, t); noSign(ctx, CX, CY, 335, { scale: s1.sc * (1 + .12 * r + .3 * o), alpha: s1.al * lerp(1, .22, r) * (1 - o), rot: s1.rot - .04 * r }); }

    // ---- search wall + magnifier
    // CUE 22.66 search-wall-magnifier-pop (chaotic wall of question marks + hunting magnifier)
    if (t > 22.5 && t < 23.7) {
      world(ctx, t);
      const u = t - 22.66, hunt = [CX + 560 * Math.sin(u * 10 + .6) + 90 * Math.sin(u * 23), CY - 10 + 130 * Math.sin(u * 14.5) + 30 * Math.sin(u * 31)], k = ease.inOut(inv(22.98, 23.12, t)), e = ease.out(inv(22.54, 22.80, t));
      let mx = lerp(CX, hunt[0], e), my = lerp(CY, hunt[1], e); mx = lerp(mx, CX, k); my = lerp(my, CY, k);
      const rot = .38 * Math.sin(u * 11) * (1 - k) * e, wb = 1 + .05 * Math.sin(u * 19) * (1 - k), pop = CL.pop(t, 22.52, .2);
      const gasp = 1 - .05 * Math.exp(-Math.max(0, t - 23.18) * 12) * 1 + .1 * Math.sin(inv(23.05, 23.12, t) * Math.PI) * 0;
      if (t < 23.26 && pop > 0) magnifier(ctx, mx, my, 235 * pop * wb * gasp, rot, () => world(ctx, t), cl((t - 23.18) / .07) > 0 && t >= 23.18 ? cl((t - 23.18) / .07) : 0, t);
      worldPops(ctx, t);
    }
    // CUE 23.18 x-slam-on-magnifier (giant red X crosses the magnifier, cracks the glass)
    if (t >= 23.02 && t < 23.6) impactFx(ctx, t, 23.18, CX, CY, 260, [C.red, C.orange, C.pink], 6);
    xOverLens(ctx, t);
    // CUE 23.30 magnifier-shatter (lens bursts into liquid drops + glass shards, question marks pop and vanish 23.34 to 23.56)
    shatter(ctx, t, CX, CY, 235); xPop(ctx, t);
    // relief beat 23.40 to 23.55: calm sparkles
    if (rel > 0) { ctx.save(); ctx.globalAlpha *= rel; CL.twinkle(ctx, t * 1.2, 100, 40, 1720, 780, 30, 7, ['#ffffff', C.cyan, C.lime, C.yellow]); ctx.restore(); }

    // ---- NO #2 : pink slam at the top; devices pop; tiles ping-pong
    // CUE 23.55 no-slam-2 (pink NO stamp, top, tilted)
    const s2 = stampSlam(t, 23.55, .09, 1.5, 420, -260);
    if (t >= 23.5 && t < 25) impactFx(ctx, t, 23.55, CX, CY - 10, 290, [C.pink, C.purple, C.orange], 8);
    // CUE 23.69 devices-pop (phone + TV appear)
    const dv1 = CL.pop(t, 23.50, .26), dv2 = CL.pop(t, 23.58, .26), ts = t > 23.5 ? tileStates(t) : { tiles: [], bl: 0, br: 0 };
    if (t > 23.5) {
      const arA = CL.pop(t, 23.7, .25), fast = sm(24.22, 24.3, t), off = t * 90 + Th(t) * 30;
      swoosh(ctx, [580, 330], [960, 20], [1290, 260], C.cyan, off, arA);
      swoosh(ctx, [1330, 640], [960, 900], [590, 620], C.pink, -off, arA);
      if (fast > 0) { swoosh(ctx, [600, 430], [960, 300], [1290, 400], C.yellow, off * 1.3, fast, 26); swoosh(ctx, [1330, 500], [960, 610], [610, 510], C.lime, -off * 1.3, fast, 26); }
      const jit = dz * 8 * Math.sin(t * 40);
      phone(ctx, t, dv1, ts.bl, jit); tvDev(ctx, t, dv2, ts.br, -jit);
      // CUE 23.92 tiles-start (Netflix, Disney+, Prime, HBO, Apple TV ping-pong between phone and TV) ; CUE 24.22 tiles-faster-dizzy (more tiles, spin)
      ts.tiles.forEach(tl => tile(ctx, tl));
      if (dz > 0 && push < .5) { for (let i = 0; i < 8; i++) { const a = t * 7 + i / 8 * TAU, r = 760 + 30 * Math.sin(t * 9 + i); CL.spark(ctx, CX + Math.cos(a) * r, 430 + Math.sin(a) * r * .5, 28 * dz, t * 3 + i, i % 2 ? C.yellow : '#fff'); } }
    }
    if (s2) { const br = 1 + .02 * Math.sin(t * 8); noSign(ctx, CX + s2.dx, CY - 10 + s2.dy, 290, { scale: s2.sc * br, alpha: s2.al * lerp(1, .3, sm(23.72, 23.95, t)), rot: .14 + s2.rot, col: C.pink, hi: '#FFA6D4', lo: '#A00E62' }); }
    // CUE 24.43 x-cross-out (two red lightning bolts cross out everything)
    if (t >= 24.26) { impactFx(ctx, t, 24.43, CX, 420, 420, [C.red, C.orange, C.pink], 12); boltX(ctx, t, 1); }
    ctx.restore();
    // white impact flashes
    for (const [t0] of [[22.36], [23.18], [23.55], [24.43]]) { const dt = t - t0; if (dt >= 0 && dt < .09) { ctx.fillStyle = `rgba(255,255,255,${.5 * (1 - dt / .09)})`; ctx.fillRect(0, 0, W, H); } }
  }

  // ---------------------------------------------------------------- liquid wipe helpers (edge sweeps across the frame)
  const wob = (y, ph) => 90 * Math.sin(y * .0075 + ph * 6) + 40 * Math.sin(y * .017 - ph * 9);
  function edgePath(ctx, E, dir, off, ph) {
    ctx.beginPath();
    if (dir > 0) { ctx.moveTo(-60, -40); for (let y = -40; y <= H + 40; y += 24) ctx.lineTo(E - off + wob(y, ph), y); ctx.lineTo(-60, H + 40); }
    else { ctx.moveTo(W + 60, -40); for (let y = -40; y <= H + 40; y += 24) ctx.lineTo(W - (E - off + wob(y, ph)), y); ctx.lineTo(W + 60, H + 40); }
    ctx.closePath();
  }
  function fringes(ctx, E, dir, cols, ph) {
    const offs = [0, 80, 160, 240];
    cols.forEach((c, i) => { edgePath(ctx, E, dir, offs[i], ph); ctx.fillStyle = c; ctx.fill(); ctx.save(); ctx.clip(); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.translate(dir > 0 ? -10 : 10, 0); edgePath(ctx, E, dir, offs[i], ph); ctx.stroke(); ctx.restore(); });
    for (let j = 0; j < 14; j++) { const y = hash(j * 2.7 + ph) * H, x = E + 50 + hash(j * 5.1) * 160, r = 16 + hash(j * 7.3) * 34, X = dir > 0 ? x + wob(y, ph) : W - (x + wob(y, ph)); CL.drop(ctx, X, y, r, cols[j % cols.length], j, j); }
  }
  const INNER = 330;

  A.scene({
    name: 's7_nosearch', start: 21.95, end: 25.35,
    draw(ctx, s) {
      const t = s.t;
      if (t < 22.19) {   // CUE 22.05 hot-wipe-in (red/orange/pink liquid wave covers s6, right to left)
        const u = cl((t - 21.97) / .22), E = lerp(-120, 2440, 1 - Math.pow(1 - u, 2.0));
        if (u <= 0) return;
        fringes(ctx, E, -1, [C.yellow, C.orange, C.pink, C.red], 1.3);
        ctx.save(); edgePath(ctx, E, -1, INNER, 1.3); ctx.clip(); chaos(ctx, t, 0); ctx.restore();
        return;
      }
      if (t < 24.56) { chaos(ctx, t, 0); return; }
      if (t < 24.90) {   // CUE 24.56 liquid-wave-sweep (tiles swept away, calm TV revealed, lands 24.80)
        const u = cl((t - 24.56) / .32), e = ease.inOut(u), E = lerp(-60, 2440, e), push = ease.in(cl((t - 24.5) / .36));
        chaos(ctx, t, push);
        fringes(ctx, E, 1, [C.cyan, C.blue, C.purple, C.pink], 2.1);
        ctx.save(); edgePath(ctx, E, 1, INNER, 2.1); ctx.clip(); calm(ctx, t); ctx.restore();
        return;
      }
      calm(ctx, t);
    },
  });
})();
