// ============================================================================
// scenes/s4_jam.js · 21.0 – 30.5 · "The jam"
// Inside the fibre: a bumper-to-bumper jam of packets. BIT squeezes through, gets wedged against
// CATPACKET ("Get in line, kid."), "Not today!", BOOSTS over the jam and streaks into open fibre.
//
// Shots (global s):
//   A 21.00–21.90  flash-out, wide jam from the front of the queue, crash-dolly toward BIT deep inside
//   B 21.90–25.00  tracking medium on BIT squeezing between packets (pops 22.18 / 23.28 / 24.30), wedge 24.85
//   C 25.00–27.95  low-angle hero shot of CATPACKET, BIT tiny at his feet looking up
//   D 27.95–28.50  BIT close-up, "Not today!", charging
//   E 28.50–29.85  crouch → BOOST up and over the jam toward camera, shocked packets, shades drop
//   F 29.85–30.50  reverse angle: open fibre, BIT streaks to the vanishing point → hard cut
//
// World: same projection as A.drawDataTunnel (vanishing point (960,470), F=620, floor 0.62 below the eye).
// Traffic flows toward the camera (-Z): packets face us. Camera z = zc.
// ============================================================================
(() => {
  const { clamp, lerp, inv, smooth, key, ease, hash: H } = A;
  const VX = 960, VY = 470, F = 620, FL = 0.62;
  const PKS = 0.30 * F / 90;    // packet scale * d   (packets ~0.30 units tall)
  const BTS = 0.27 * F / 122;   // Bit
  const CTS = 0.86 * F / 265;   // Catpacket
  const LANES = [-1.22, -0.61, 0, 0.61, 1.22];
  const ROW = r => 0.6 + 0.8 * r;
  const CATZ = ROW(8), CATX = 0.0;
  const KINDS = ['mail', 'video', 'meme', 'update', 'shop', 'photo'];

  // ---------------------------------------------------------------- jam population (static)
  const PK = [];
  for (let r = 0; r < 34; r++) for (let li = 0; li < 5; li++) {
    const lane = LANES[li], seed = r * 7 + li * 3 + 11;
    const path = (li === 2 || li === 3) && r >= 7 && r <= 13; // rows beside Bit's path: aligned, no jitter
    if (li === 2 && r === 8) continue; // Catpacket's spot
    if (H(seed * 1.7) < 0.07 && !path && r > 2) continue; // occasional gap
    let X = lane + (path ? 0 : (H(seed * 3.1) - 0.5) * 0.12), Z = ROW(r) + (path ? 0 : (H(seed * 5.3) - 0.5) * 0.3) + (li % 2 ? 0.12 : 0);
    if (path && li === 2) X = 0.03;
    if (path && li === 3) X = 0.57;
    if (r === 8 && li === 3) X = 1.0;  // squeezed aside by the cat
    if (r === 8 && li === 1) X = -0.74;
    if (r === 7 && li === 3) X = 0.66;
    const m = H(seed * 9.9);
    PK.push({ X, Z, seed, r, li, kind: KINDS[Math.floor(H(seed * 2.3) * 6) % 6], mood: m < 0.18 ? 'sleep' : m < 0.36 ? 'annoyed' : 'bored' });
  }
  const pk = (li, r) => PK.find(p => p.li === li && p.r === r);
  // honk pops (synced to the cue sheets)
  const HONKS = [
    [pk(4, 2), 21.39], [pk(0, 3), 21.75], [pk(1, 10), 22.62], [pk(1, 9), 24.19], [pk(1, 9), 24.50], [pk(4, 9), 24.74],
    [pk(3, 11), 21.95], [pk(0, 12), 23.62],
  ];
  const honkAmt = (p, t) => { let h = 0; for (const [q, t0] of HONKS) if (q === p) h = Math.max(h, smooth(t0 - 0.04, t0 + 0.05, t) * (1 - smooth(t0 + 0.24, t0 + 0.42, t))); return h; };

  // ---------------------------------------------------------------- Bit's path through the jam (shot B)
  const BZ = [[21.0, 9.9], [21.9, 9.78], [22.14, 9.6, 'inOut'], [22.3, 9.12, 'out'], [22.92, 8.84, 'inOut'], [23.24, 8.72, 'inOut'],
    [23.4, 8.3, 'out'], [23.98, 8.02, 'inOut'], [24.26, 7.92, 'inOut'], [24.42, 7.5, 'out'], [24.82, 6.95, 'in'], [24.9, 6.92, 'out']];
  const bitZ = t => key(t, BZ);
  const bitX = t => key(t, [[24.0, 0.3], [24.5, 0.78, 'inOut'], [24.84, 0.7, 'inOut']]);
  const POPS = [22.18, 23.28, 24.3];
  const pushing = t => (t > 21.9 && t < 22.18) || (t > 22.95 && t < 23.28) || (t > 24.05 && t < 24.3);
  const popK = t => { let k = 0; for (const p of POPS) k = Math.max(k, smooth(p - 0.02, p + 0.03, t) * (1 - smooth(p + 0.06, p + 0.3, t))); return k; };

  // projection
  const proj = (X, Y, Z, zc) => { const d = Z - zc; return [VX + X * F / d, VY + (FL - Y) * F / d, d]; };

  // ---------------------------------------------------------------- helpers
  const clampCam = c => { const hw = 960 / c.zoom, hh = 540 / c.zoom; c.x = clamp(c.x, hw + 22 / c.zoom, 1920 - hw - 22 / c.zoom); c.y = clamp(c.y, hh + 22 / c.zoom, 1080 - hh - 22 / c.zoom); return c; };
  const fillBase = ctx => { ctx.fillStyle = '#070a24'; ctx.fillRect(-2000, -2000, 6000, 5000); };
  function drawPk(ctx, p, t, zc, o = {}) {
    const d = p.Z + (o.dz || 0) - zc; if (d < 0.32) return;
    const [x, y] = proj(p.X + (o.dx || 0), o.y || 0, p.Z + (o.dz || 0), zc);
    const sc = PKS / d, fog = clamp(1 - (d - 5) / 16);
    if (fog <= 0.02) return;
    // brake-light spill behind each car
    if (d > 1.2) A.glow(ctx, x, y - sc * 20, sc * 95, 'rgba(255,36,60,1)', 0.10 * fog * (0.8 + 0.2 * Math.sin(t * 3 + p.seed)));
    ctx.save(); ctx.globalAlpha = fog;
    const honk = o.honk != null ? o.honk : honkAmt(p, t);
    A.drawPacket(ctx, x, y, sc, { t, seed: p.seed, kind: p.kind, mood: o.mood || p.mood, honk, look: o.look, squash: o.squash || 0, rot: o.rot || 0, glow: 0.45 + 0.3 * fog });
    ctx.restore();
    if (d > 6) { // atmospheric haze veil
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
    }
  }

  // idle creep: lanes inch forward then brake (stop-and-go)
  const creep = (p, t) => -0.06 * smooth(0, 1, (Math.sin(t * 0.9 + p.li * 1.3) + 1) / 2);

  // ---------------------------------------------------------------- HUD: live delay counter
  function hud(ctx, t) {
    const a = smooth(21.35, 21.6, t);
    if (a <= 0) return;
    let v, col = '#ff3b4f';
    if (t < 29.85) v = 4.2 + Math.max(0, t - 21.6) * 0.92;
    else { const u = inv(29.85, 30.5, t); v = lerp(4.2 + (29.85 - 21.6) * 0.92, 1.3, ease.out(u)); col = A.mixc('#ff3b4f', '#5dff9a', smooth(0, 0.7, u)); }
    const shake = t > 28.6 && t < 29.4 ? (1 - inv(28.6, 29.4, t)) * 5 : 0;
    const x = 64 + A.noise1(t * 30) * shake, y = 58 + A.noise1(t * 30 + 7) * shake;
    const slide = (1 - ease.outBack(a)) * -40;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + slide);
    ctx.fillStyle = 'rgba(8,6,26,0.72)'; A.rrect(ctx, 0, 0, 330, 96, 18); ctx.fill();
    ctx.strokeStyle = A.hex('#ff3b4f', 0.55); ctx.lineWidth = 2.5; ctx.stroke();
    const blink = Math.sin(t * 7) > -0.2 ? 1 : 0.25;
    A.glow(ctx, 30, 30, 26, 'rgba(255,40,60,1)', 0.5 * blink);
    ctx.fillStyle = `rgba(255,59,79,${blink})`; ctx.beginPath(); ctx.arc(30, 30, 8, 0, Math.PI * 2); ctx.fill();
    A.text(ctx, 'LIVE DELAY', 50, 31, { font: '800 22px Rubik', fill: '#ffd5da', align: 'left' });
    A.text(ctx, 'עיכוב בשידור', 312, 31, { font: '600 19px Rubik', fill: 'rgba(255,213,218,0.7)', align: 'right', dir: 'rtl' });
    const jit = t > 24.2 && t < 29.85 ? A.noise1(t * 40) * 1.2 : 0;
    A.text(ctx, v.toFixed(1) + 's', 22 + jit, 70, { font: '900 40px Rubik', fill: col, align: 'left' });
    // mini buffer bar
    const bw = 170, fillp = t < 29.85 ? 0.15 + 0.05 * Math.sin(t * 2) : lerp(0.2, 1, smooth(29.85, 30.4, t));
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; A.rrect(ctx, 140, 62, bw, 12, 6); ctx.fill();
    ctx.fillStyle = col; A.rrect(ctx, 140, 62, bw * fillp, 12, 6); ctx.fill();
    ctx.restore();
  }

  // Bokeh background for the close-up (cached)
  const bokeh = () => A.layer('s4-bokeh', 2300, 1300, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#0a0d30'], [0.55, '#140c34'], [1, '#2a0a24']]); g.fillRect(0, 0, w, h);
    g.fillStyle = A.radial(g, w * 0.62, h * 0.38, 0, 900, [[0, 'rgba(41,240,255,0.22)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h);
    const r = A.rng(77);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = h * 0.25 + r() * h * 0.75, rad = 20 + r() * 70, c = r();
      const col = c < 0.55 ? '255,40,70' : c < 0.8 ? '41,240,255' : c < 0.92 ? '255,63,164' : '255,201,60';
      const al = 0.12 + r() * 0.22;
      g.fillStyle = A.radial(g, x, y, rad * 0.55, rad, [[0, `rgba(${col},${al})`], [0.85, `rgba(${col},${al * 0.8})`], [1, `rgba(${col},0)`]]);
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  });

  // radial speed lines (additive)
  function speedLines(ctx, t, cx, cy, amt, n = 70) {
    if (amt <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a = H(i * 3.7) * Math.PI * 2, sp = 2.2 + H(i * 1.3) * 2;
      const u = ((t * sp + H(i * 7.1)) % 1);
      const r0 = 140 + u * 1300, r1 = r0 + 120 + 380 * u * amt;
      const col = H(i) < 0.5 ? '160,250,255' : H(i) < 0.8 ? '255,120,200' : '255,230,150';
      ctx.strokeStyle = `rgba(${col},${0.55 * amt * Math.sin(u * Math.PI)})`; ctx.lineWidth = 1.5 + 4 * u * amt;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.75); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.75); ctx.stroke();
    }
    ctx.restore();
  }

  // ============================================================ JAM WORLD (shots A, B, E)
  // bit: {X,Y,Z, draw(ctx,x,y,sc)} inserted into the depth sort.
  function jamWorld(ctx, t, zc, opt) {
    A.drawDataTunnel(ctx, t, { z: zc + t * 0.15, speed: 0.12, jam: opt.jam ?? 0.9 });
    const items = [];
    const bz = opt.bit ? opt.bit.Z : 99;
    for (const p of PK) {
      const d = p.Z - zc; if (d < 0.32 || d > 22) continue;
      items.push({ d, p });
    }
    if (opt.cat !== false) items.push({ d: CATZ - zc, cat: true });
    if (opt.bit) items.push({ d: opt.bit.Z - zc - 0.01, bit: true });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) {
      if (it.bit) { const b = opt.bit, [x, y, d] = proj(b.X, b.Y, b.Z, zc); if (d > 0.3) b.draw(ctx, x, y, BTS / d, d); continue; }
      if (it.cat) {
        const [x, y, d] = proj(CATX, 0, CATZ, zc); if (d < 0.35) continue;
        A.glow(ctx, x, y - 40 * CTS / d, 260 * CTS / d, 'rgba(255,36,60,1)', 0.12);
        A.drawCatPacket(ctx, x, y, CTS / d, Object.assign({ t }, opt.catO ? opt.catO(x, y, d) : {}));
        continue;
      }
      const p = it.p;
      let o = { dz: creep(p, t) };
      if (opt.pkO) o = Object.assign(o, opt.pkO(p, it.d));
      drawPk(ctx, p, t, zc, o);
    }
  }

  // ---------------------------------------------------------------- Bit's appearance in the jam (A/B)
  function bitJamOpts(t) {
    const push = pushing(t), pk = popK(t), speaking = A.speaking('BIT', t);
    const vz = (bitZ(t + 0.03) - bitZ(t - 0.03)) / 0.06; // units/s (negative = toward camera)
    const o = { t, mood: push ? 'squeeze' : 'determined', shadow: 0.8, glow: 1.25 };
    if (push) { o.limbs = 'push'; o.squash = -0.16 - 0.06 * Math.sin(t * 30); }
    else if (Math.abs(vz) > 0.25) { o.limbs = 'run'; o.vel = [0, 0]; o.runRate = 3.4; o.phase = t * Math.PI * 2 * 3.4; }
    else o.limbs = 'stand';
    if (pk > 0) { o.squash = -0.28 * pk; o.hop = 14 * pk; o.sparkle = pk; }
    if (!push && !(pk > 0) && t > 22.3 && t < 23.0) { o.limbs = 'run'; o.armR = [80, -150]; } // "Live goal!" arm up
    if (t > 23.4 && t < 23.95) { o.armR = [78, -160 + Math.sin(t * 20) * 8]; o.armL = [-66, -100]; }
    if (t >= 24.82) { // wedged against the cat
      const w = inv(24.82, 25.0, t);
      o.limbs = 'push'; o.mood = 'squeeze'; o.squash = -0.34 + 0.06 * Math.sin(w * 20) * (1 - w); o.sweat = 1; o.look = [-0.8, -0.4]; o.rot = -0.08;
    }
    o.look = o.look || (speaking ? [0.1, -0.1] : [A.wob(t, 3, 0.8) * 0.5, -0.1]);
    return o;
  }
  // neighbours get shoved while Bit squeezes past
  function shoveO(p, t) {
    const bz = bitZ(t), bx = bitX(t);
    if (!(p.li === 2 || p.li === 3 || (p.li === 1 && p.r === 8))) return {};
    const dz = Math.abs(p.Z - bz); if (dz > 0.45) return {};
    const k = (1 - dz / 0.45) * (pushing(t) || t > 24.8 ? 1 : 0.5);
    const side = Math.sign(p.X - bx) || 1;
    const wob = popK(t) * Math.sin(t * 40) * 0.4;
    return { dx: side * 0.1 * k, squash: 0.18 * k + wob * 0.12, mood: k > 0.3 ? 'annoyed' : undefined, look: [-side * 0.8, 0.2], rot: side * 0.06 * k };
  }

  // ============================================================ SHOTS
  function shotA(ctx, t) {
    const zc = key(t, [[21.0, -0.6], [21.45, -0.2, 'out'], [21.9, 5.7, 'in']]);
    const bz = bitZ(t), bx = bitX(t);
    const [bxs, bys] = proj(bx, 0, bz, zc);
    const zk = ease.in(inv(21.45, 21.9, t));
    const cam = { x: lerp(960, bxs, zk * 0.7), y: lerp(540, bys - 60, zk * 0.7), zoom: key(t, [[21.0, 1.35], [21.4, 1.03, 'out'], [21.9, 1.5, 'in']]), rot: 0, t };
    clampCam(cam);
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.95,
      bit: { X: bx, Y: 0, Z: bz, draw: (c, x, y, sc) => { A.glow(c, x, y - 70 * sc, 260 * sc, '#ffc93c', 0.5 + 0.3 * Math.sin(t * 6)); A.drawBit(c, x, y, sc, Object.assign(bitJamOpts(t), { glow: 1.6 })); } },
      catO: () => ({ mood: 'bored' }),
      pkO: p => shoveO(p, t),
    });
    ctx.restore();
    // "find Bit" spotlight ping
    const ping = inv(21.5, 21.9, t);
    if (ping > 0 && ping < 1) {
      const [sx, sy] = [960 + (bxs - cam.x) * cam.zoom, 540 + (bys - 60 - cam.y) * cam.zoom];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,220,120,${0.7 * (1 - ping)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy + 20, 40 + ping * 160, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    speedLines(ctx, t, 960, 470, ease.in(inv(21.55, 21.9, t)) * 0.8, 40);
  }

  function shotB(ctx, t) {
    const bz = bitZ(t), bx = bitX(t);
    const zc = bitZ(t - 0.18) - 1.28 - 0.1 * smooth(24.25, 24.8, t);
    const [bxs, bys] = proj(bx, 0, bz, zc);
    const bump = t > 24.83 ? Math.exp(-(t - 24.83) * 14) : 0;
    const wk = smooth(24.25, 24.8, t);
    const cam = clampCam({ x: lerp(lerp(960, bxs, 0.75) - 40, lerp(bxs, proj(0, 0, CATZ, zc)[0], 0.35), wk), y: lerp(bys - 190, bys - 200, wk), zoom: lerp(1.3, 1.55, wk), rot: 0, shake: bump * 1.4, t });
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.95,
      bit: { X: bx, Y: 0, Z: bz, draw: (c, x, y, sc) => A.drawBit(c, x, y, sc, bitJamOpts(t)) },
      catO: (x, y, d) => ({ mood: 'bored', look: [0.6, 0.3], squash: t > 24.83 ? -0.03 * bump : 0 }),
      pkO: p => shoveO(p, t),
    });
    // bonk impact star
    if (t > 24.82 && t < 25.0) {
      const [x, y] = proj(0.58, 0.2, CATZ - 0.1, zc), u = inv(24.82, 25.0, t);
      ctx.save(); ctx.translate(x, y); ctx.scale(0.6 + 0.6 * u, 0.6 + 0.6 * u); ctx.globalAlpha = 1 - u;
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 22 : 58, a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      A.fillStroke(ctx, '#fff3a0', 4); A.text(ctx, 'BONK', 0, 2, { font: '400 30px Bangers', fill: '#e8344e', stroke: A.OUTLINE, lw: 4 });
      ctx.restore();
    }
    ctx.restore();
  }

  // --- shot C: low-angle Catpacket
  function shotC(ctx, t) {
    const lt = t - 25.0;
    const cam = {
      x: key(t, [[25.0, 1330], [25.15, 1310], [25.85, 960, 'inOut'], [27.95, 930]]),
      y: key(t, [[25.0, 860], [25.15, 850], [25.85, 548, 'inOut'], [27.95, 530]]),
      zoom: key(t, [[25.0, 1.9], [25.15, 1.85], [25.85, 1.02, 'inOut'], [27.95, 1.1]]),
      rot: key(t, [[25.0, 0.0], [25.85, -0.05, 'inOut']]), t,
    };
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    // tunnel: horizon dropped low behind the cat (looking up)
    ctx.save(); ctx.translate(900, 860); ctx.scale(1.95, 1.95); ctx.translate(-960, -470);
    A.drawDataTunnel(ctx, t, { z: 30 + t * 0.15, speed: 0.1, jam: 0.85 });
    ctx.restore();
    // background queue at the horizon
    for (let i = 0; i < 9; i++) {
      const x = 900 + (i - 4) * 150 + (H(i) - 0.5) * 40, y = 905 + H(i * 3) * 14, sc = 0.4 + H(i * 5) * 0.1;
      if (Math.abs(x - 880) < 260) continue;
      A.glow(ctx, x, y - 20, 70, 'rgba(255,40,60,1)', 0.18);
      ctx.save(); ctx.globalAlpha = 0.8;
      const hk = i === 7 ? smooth(27.8, 27.86, t) : 0;
      A.drawPacket(ctx, x, y, sc, { t, seed: 40 + i, mood: i % 3 ? 'bored' : 'sleep', honk: hk, look: [0.6 * Math.sign(880 - x), -0.2] });
      ctx.restore();
    }
    // Catpacket, huge
    const lookK = smooth(25.35, 25.9, t);
    const catMood = t > 26.62 && t < 27.45 ? 'grumpy' : 'bored';
    const arms = t > 25.62 && t < 26.3 ? 'point' : 'crossed';
    const armPop = Math.max(0, 1 - Math.abs(t - 25.62) / 0.12, t > 26.3 && t < 26.45 ? 1 - (t - 26.3) / 0.15 : 0);
    A.glow(ctx, 880, 560, 700, '#ff3fa4', 0.12);
    A.drawCatPacket(ctx, 900, 1010, 3.35, {
      t, mood: catMood, arms,
      look: [lerp(-0.55, 0.62, lookK), lerp(-0.1, 0.55, lookK)],
      rot: lerp(-0.02, 0.05, smooth(25.6, 26.2, t)) - 0.02 * smooth(27.2, 27.8, t),
      lid: t > 27.4 ? 0.12 : 0, browRaise: t > 27.1 && t < 27.6 ? 6 : 0,
      squash: 0.04 * armPop,
    });
    // Bit, tiny, looking up
    const recoil = Math.exp(-lt * 5) * Math.sin(lt * 18);
    const bmood = t < 26.7 ? 'panic' : t < 27.35 ? 'neutral' : 'determined';
    A.drawBit(ctx, 1580 + recoil * 12, 975, 0.72, {
      t, mood: bmood, shadow: 1, mouth: 0, glow: 1.3, look: [-0.75, -0.85],
      limbs: 'stand', squash: 0.05 * Math.sin(t * 22) * (t < 26.7 ? 1 : 0) + (t > 27.6 ? 0.1 * smooth(27.6, 27.95, t) : 0),
      sweat: t < 27.2 ? 1 : 0, browL: t > 27.35 ? -4 : 0, browR: t > 27.35 ? -4 : 0,
    });
    // out-of-focus foreground silhouettes framing the low angle
    ctx.fillStyle = A.radial(ctx, 40, 1180, 60, 420, [[0, 'rgba(40,20,50,0.95)'], [0.6, 'rgba(60,25,60,0.7)'], [1, 'rgba(40,20,50,0)']]); ctx.fillRect(-400, 700, 900, 800);
    ctx.fillStyle = A.radial(ctx, 1900, 1200, 60, 380, [[0, 'rgba(20,40,60,0.95)'], [0.6, 'rgba(25,50,70,0.7)'], [1, 'rgba(20,40,60,0)']]); ctx.fillRect(1450, 750, 900, 800);
    ctx.restore();
    ctx.restore();
  }

  // --- shot D: Bit close-up
  function shotD(ctx, t) {
    const u = inv(27.95, 28.5, t);
    const zoom = lerp(1.0, 1.12, ease.inOut(u)), sh = smooth(28.3, 28.5, t) * 0.6;
    ctx.save();
    const b = bokeh();
    ctx.drawImage(b, -190 - u * 60, -110 - u * 20);
    // cat's lilac bulk out of focus (screen left)
    A.glow(ctx, -80, 560, 620, 'rgba(171,156,192,0.9)', 0.55);
    ctx.fillStyle = A.radial(ctx, -160, 600, 200, 560, [[0, 'rgba(120,105,150,0.85)'], [1, 'rgba(120,105,150,0)']]); ctx.fillRect(0, 0, 700, 1080);
    A.camera(ctx, { x: 960, y: 560, zoom, shake: sh, t });
    const charge = smooth(28.0, 28.5, t);
    A.glow(ctx, 960, 560, 520, '#ffc93c', 0.18 + 0.35 * charge);
    const crouch = smooth(28.3, 28.5, t);
    A.drawBit(ctx, 960, 1010 + crouch * 30, 5.6, {
      t, mood: 'determined', glow: 1.2 + 0.7 * charge, look: t < 28.02 ? [-0.5, -0.45] : [0.05, -0.05],
      limbs: crouch > 0.3 ? 'crouch' : 'stand', squash: 0.12 * crouch, browL: -3, browR: -3,
      boost: 0.18 * charge, sparkle: charge, trail: 0, rot: -0.02 + 0.02 * Math.sin(t * 2),
    });
    ctx.restore();
    // electric crackle sparks around him
    if (charge > 0.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,150,${0.8 * charge})`; ctx.lineWidth = 3;
      const fr = Math.floor(t * 20);
      for (let i = 0; i < 5; i++) {
        const a = H(fr * 3 + i) * Math.PI * 2, r0 = 380 + H(fr + i * 7) * 60;
        ctx.beginPath(); let x = 960 + Math.cos(a) * r0, y = 600 + Math.sin(a) * r0 * 0.8; ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += Math.cos(a) * 30 + (H(fr * 11 + i * 5 + k) - 0.5) * 50; y += Math.sin(a) * 30 + (H(fr * 13 + i + k) - 0.5) * 50; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- shot E: BOOST over the jam
  const E0 = 28.6, E1 = 29.85;
  function bitE(t) { // world position of Bit during the boost
    if (t < E0) return { X: 0.7, Y: 0, Z: 6.92 };
    const u = inv(E0, E1, t);
    const Z = lerp(6.92, 0.1, Math.pow(u, 1.2));
    const Y = 1.0 * Math.sin(Math.min(1, u * 2.1) * Math.PI * 0.5) - 0.42 * smooth(0.45, 0.9, u);
    const X = lerp(0.7, 0.1, ease.inOut(u));
    return { X, Y: Math.max(0, Y), Z };
  }
  function shotE(ctx, t) {
    const zc = key(t, [[28.5, 5.05], [28.62, 5.1], [29.3, 1.7, 'inOut'], [29.85, 0.0, 'lin']]);
    const launch = t >= E0;
    const b = bitE(t);
    const sh = launch ? Math.exp(-(t - E0) * 3) * 1.6 + 0.3 : 0;
    const [bx0, by0] = proj(b.X, b.Y, b.Z, zc);
    const cam = clampCam({ x: lerp(1080, 960 + (bx0 - 960) * 0.35, smooth(28.6, 29.1, t)), y: lerp(640, by0 + 60, smooth(28.62, 29.0, t) * 0.6), zoom: key(t, [[28.5, 1.3], [28.6, 1.34], [29.1, 1.08, 'out'], [29.85, 1.12]]), shake: sh, t });
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    // trail history (pure: re-evaluate the path at earlier times)
    const trail = [];
    if (launch) for (let i = 22; i >= 0; i--) { const tt = Math.max(E0, t - i * 0.025), p = bitE(tt); const [x, y, d] = proj(p.X, p.Y + 0.14, p.Z, zc); if (d > 0.3) trail.push([x, y]); }
    jamWorld(ctx, t, zc, {
      jam: 0.95,
      bit: { X: b.X, Y: b.Y, Z: b.Z, draw: (c, x, y, sc, d) => {
        if (trail.length > 2) A.drawBinaryTrail(c, trail, t, { width: 30 * sc * 1.4, size: Math.max(12, 18 * sc), alpha: 0.95 });
        const pre = !launch, crouch = pre ? smooth(28.5, 28.6, t) : 0;
        const nx = bitE(t + 0.02), [x2, y2] = proj(nx.X, nx.Y, nx.Z, zc);
        const vel = launch ? [(x2 - x) / 0.02, (y2 - y) / 0.02] : [0, 0];
        const spd = Math.hypot(vel[0], vel[1]); if (spd > 2600) { vel[0] *= 2600 / spd; vel[1] *= 2600 / spd; }
        A.drawBit(c, x, y, sc, { t, mood: 'determined', glow: 1.8, shadow: pre ? 1 : 0, limbs: pre ? 'crouch' : 'fly', squash: pre ? 0.25 * crouch : 0, boost: launch ? 1 : 0.3 * crouch, vel, mouth: A.mouth('BIT', t) });
      } },
      catO: () => {
        const s = smooth(28.72, 29.0, t);
        return { mood: t > 28.66 ? 'shock' : 'bored', shades: ease.outBounce(clamp(inv(28.72, 29.05, t))), look: [0.3, -0.9 * s + 0.2], squash: t > 28.62 && t < 28.8 ? -0.08 : 0, arms: t > 28.66 ? 'down' : 'crossed' };
      },
      pkO: (p, d) => {
        if (!launch) return shoveO(p, t);
        const delay = 0.06 + Math.abs(p.Z - CATZ) * 0.05 + H(p.seed) * 0.08;
        const k = smooth(E0 + delay, E0 + delay + 0.08, t);
        if (k <= 0) return {};
        const [px, py] = proj(p.X, 0.15, p.Z, zc), [qx, qy] = proj(b.X, b.Y, b.Z, zc);
        const dx = qx - px, dy = qy - py - 200, n = Math.hypot(dx, dy) || 1;
        const jump = Math.exp(-Math.max(0, t - E0 - delay) * 6) * Math.sin(Math.max(0, t - E0 - delay) * 20);
        return { mood: 'shock', look: [dx / n, dy / n], squash: -0.1 * k + 0.08 * jump, y: 0.02 * Math.max(0, jump) };
      },
    });
    ctx.restore();
    // launch shockwave ring + flash
    if (launch && t < 29.0) {
      const u = inv(E0, 29.0, t);
      const [sx, sy] = [960 + (proj(0.52, 0, CATZ, 4.5)[0] - cam.x) * cam.zoom, 540 + (proj(0.52, 0, CATZ, 4.5)[1] - cam.y) * cam.zoom];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,220,130,${0.8 * (1 - u)})`; ctx.lineWidth = 10 * (1 - u) + 2;
      A.ellipse(ctx, sx, sy, 40 + u * 700, 12 + u * 160); ctx.stroke();
      ctx.fillStyle = `rgba(255,240,200,${0.3 * Math.max(0, 1 - u * 6)})`; ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    }
    speedLines(ctx, t, 960, 470, smooth(29.3, 29.85, t), 60);
    // Bit zooms past the lens: gold flash
    const pass = smooth(29.72, 29.85, t);
    if (pass > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,110,${0.75 * pass})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  // --- shot F: open fibre, streak to the vanishing point
  function shotF(ctx, t) {
    const u = inv(29.85, 30.5, t);
    const zc = 60 + ease.in(u) * 14 + u * 10;
    A.drawDataTunnel(ctx, t, { z: zc, speed: lerp(4, 9, u), jam: 0.3 * (1 - smooth(0, 0.25, u)) });
    speedLines(ctx, t, 960, 470, 1, 90);
    // Bit: from over the camera into the distance
    const dOf = uu => 0.6 * Math.exp(Math.pow(uu, 1.6) * Math.log(28));
    const d = dOf(u);
    const X = lerp(0.16, 0, u), Y = lerp(0.85, 0.62, ease.out(u));
    const x = VX + X * F / d, y = VY + (FL - Y) * F / d, sc = BTS / d;
    const trail = [];
    for (let i = 24; i >= 0; i--) { const uu = Math.max(0, u - i * 0.02), dd = dOf(uu), XX = lerp(0.16, 0, uu), YY = lerp(0.85, 0.62, ease.out(uu)); trail.push([VX + XX * F / dd, VY + (FL - YY) * F / dd + 60 * BTS / dd]); }
    trail.unshift([trail[0][0] + 80, 1180]);
    A.drawBinaryTrail(ctx, trail, t, { width: 40, size: 22 });
    const [x2, y2] = [VX, VY];
    const dirx = x2 - x, diry = y2 - y, n = Math.hypot(dirx, diry) || 1;
    A.glow(ctx, x, y - 60 * sc, 300 * sc + 60, '#ffc93c', 0.7);
    A.drawBit(ctx, x, y, sc, { t, mood: 'determined', glow: 2, boost: 1, limbs: 'fly', vel: [dirx / n * 2000, diry / n * 2000], trail: 1.3 });
    // star-streak at the vanishing point as he disappears
    const st = smooth(0.55, 1, u);
    if (st > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, VX, VY, 60 + 240 * st, '#fff2c0', 0.9 * st);
      ctx.fillStyle = A.linear(ctx, VX - 900, 0, VX + 900, 0, [[0, 'rgba(255,230,160,0)'], [0.5, `rgba(255,250,230,${0.9 * st})`], [1, 'rgba(255,230,160,0)']]);
      ctx.fillRect(VX - 900, VY - 3 - 3 * st, 1800, 6 + 6 * st);
      ctx.restore();
    }
    // open-fibre release: first frames still flashed from the pass
    const fl = 1 - smooth(29.85, 29.95, t);
    if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,250,255,${0.35 * fl})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  A.scene({
    name: 's4_jam', start: 21.0, end: 30.5,
    draw(ctx, s) {
      const t = s.t;
      if (t < 21.9) shotA(ctx, t);
      else if (t < 25.0) shotB(ctx, t);
      else if (t < 27.95) shotC(ctx, t);
      else if (t < 28.5) shotD(ctx, t);
      else if (t < 29.85) shotE(ctx, t);
      else shotF(ctx, t);
      hud(ctx, t);
      // flash out of the LED dive (white-cyan)
      const fa = 1 - ease.out(inv(21.0, 21.4, t));
      if (fa > 0) {
        ctx.save(); ctx.fillStyle = `rgba(225,255,255,${fa})`; ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 960, 470, 1200, 'rgba(41,240,255,1)', fa * 0.8); ctx.restore();
      }
    },
  });
})();
