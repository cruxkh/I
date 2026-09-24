// ============================================================================
// scenes/s4_jam.js · VERSION 2 · 29.2 to 43.4 · "The jam" (GOTV overtakes the competitor queue)
// Inside the fibre: a bumper-to-bumper jam. BIT squeezes through, gets stuck in the competitor queue
// (ILVIP grumbles, EMBY buffers asleep), meets CATPACKET, "Sorry! GOTV doesn't wait in line!", BOOSTS over
// the whole queue and streaks into open fibre.
//
// Shots (global s):
//   A  29.20-30.10  white-gold flash-out, wide jam, snap-zoom onto BIT hopping above the crowd
//   B  30.10-32.30  tracking medium: BIT squeezes through ("Excuse me! Live goal coming through!"), pops 30.47 / 31.64
//   Q1 32.30-35.00  medium: BIT sandwiched in the queue under the sign; ILVIP complains
//   Q2 35.00-36.80  pan to EMBY asleep with a spinner ("Still... buffering..."); BIT pops out 36.5, BONK on the cat 36.8
//   C  36.80-39.60  low-angle hero shot of CATPACKET, BIT tiny at his feet looking up
//   D  39.60-41.45  BIT close-up: "Sorry! GOTV doesn't wait in line!", charging, crouch
//   E  41.45-42.70  BOOST up and over the whole queue toward camera, everyone looks up in shock, shades drop
//   F  42.70-43.40  reverse angle: open fibre, BIT streaks to the vanishing point, hard cut
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
  const BRANDS = ['ILVIP', 'EMBY', 'LAGTV', 'LOADING+'];
  const BRAND_MOOD = { ILVIP: 'grumpy', EMBY: 'sleepy', LAGTV: 'sleepy', 'LOADING+': 'grumpy' };
  const BRAND_COL = { ILVIP: '#7b4dff', EMBY: '#0f9e9a', LAGTV: '#7d7f95', 'LOADING+': '#2f63ff' };

  // ---------------------------------------------------------------- jam population (static)
  const PK = [];
  for (let r = 0; r < 34; r++) for (let li = 0; li < 5; li++) {
    const lane = LANES[li], seed = r * 7 + li * 3 + 11;
    const path = (li >= 2 && li <= 4) && r >= 7 && r <= 21; // lanes around Bit's run: aligned, no jitter
    if (li === 2 && r === 8) continue; // Catpacket's spot
    if (H(seed * 1.7) < 0.07 && !path && r > 2) continue; // occasional gap
    let X = lane + (path ? 0 : (H(seed * 3.1) - 0.5) * 0.12), Z = ROW(r) + (path ? 0 : (H(seed * 5.3) - 0.5) * 0.3) + (li % 2 ? 0.12 : 0);
    if (path && li === 2) X = 0.0;
    if (path && li === 3) X = 0.61;
    if (path && li === 4) X = 1.22;
    if (r === 9 && li === 3) X = 0.64;
    if (r === 9 && li === 4) X = 1.19;
    if (r === 7 && li === 3) continue; // gap: sightline to the wedge
    if (r === 8 && li === 3) X = 0.98;
    if (r === 8 && li === 4) X = 1.3;  // squeezed aside by the cat
    if (r === 8 && li === 1) X = -0.74;
    const m = H(seed * 9.9);
    let brand = null;
    if (li === 3 && r === 9) brand = 'ILVIP'; else if (li === 4 && r === 9) brand = 'EMBY';
    else if (li === 3 && r === 8) brand = 'LAGTV';
    else if (li === 4 && r === 14) brand = 'LAGTV'; else if (li === 2 && r === 17) brand = 'LAGTV';
    else if (li === 3 && r === 16) brand = 'LOADING+'; else if (li === 2 && r === 12) brand = 'EMBY';
    else if (r >= 1 && r <= 22 && !(path && r <= 10) && H(seed * 4.4) < 0.33) brand = BRANDS[1 + Math.floor(H(seed * 6.6) * 3) % 3];
    let prop = null;
    if (!brand && path && r >= 10) { const q = H(seed * 7.7); prop = q < 0.14 ? 'paper' : q < 0.26 ? 'watch' : null; }
    PK.push({ X, Z, seed, r, li, brand, prop, kind: KINDS[Math.floor(H(seed * 2.3) * 6) % 6], mood: prop ? 'bored' : m < 0.22 ? 'sleep' : m < 0.36 ? 'annoyed' : 'bored' });
  }
  // v7 chase set-pieces: the bonk/squeeze pair (row 28), the stuck pair (row 16), the snoozer he vaults (Z 15.8)
  const setPk = (li, r, o) => { const p = PK.find(q => q.li === li && q.r === r); if (p) Object.assign(p, o); else PK.push(Object.assign({ li, r, seed: r * 7 + li * 3 + 11, kind: 'video', mood: 'bored', prop: null, brand: null }, o)); };
  setPk(2, 28, { X: 0.08, Z: 23.0, brand: null, kind: 'video', mood: 'bored', prop: null });
  setPk(3, 28, { X: 0.54, Z: 23.0, brand: 'LAGTV', prop: null });
  setPk(2, 16, { X: 0.08, Z: 13.4, brand: null, kind: 'shop', prop: 'paper' });
  setPk(3, 16, { X: 0.54, Z: 13.4, brand: 'LOADING+', prop: null });
  PK.push({ X: 0.305, Z: 15.8, seed: 907, r: 98, li: 9, brand: null, kind: 'photo', mood: 'sleep', vault: true });
  const pk = (li, r) => PK.find(p => p.li === li && p.r === r);
  // honk pops (synced to the cue sheets)
  const HONKS = [
    [pk(4, 2), 29.59], [pk(0, 3), 29.95], [pk(4, 17), 30.36], [pk(2, 15), 30.86], [pk(4, 13), 31.2], [pk(4, 11), 31.72],
    [pk(2, 9), 36.6], [pk(2, 10), 36.3],
  ];
  const honkAmt = (p, t) => { let h = 0; for (const [q, t0] of HONKS) if (q === p) h = Math.max(h, smooth(t0 - 0.04, t0 + 0.05, t) * (1 - smooth(t0 + 0.24, t0 + 0.42, t))); return h; };

  // ---------------------------------------------------------------- Bit's run through the queue (shot B)
  const BZ = [[29.2, 15.0], [30.1, 15.0], [30.75, 12.75, 'in'], [31.0, 11.95, 'lin'], [31.3, 10.6, 'lin'], [31.6, 9.3, 'lin'], [31.95, 8.3, 'out'],
    [32.22, 7.84, 'out'], [36.2, 7.8], [36.44, 7.72, 'inOut'], [36.56, 7.4, 'out'], [36.78, 6.95, 'in'], [36.85, 6.92, 'out']];
  const bitZ = t => key(t, BZ);
  const bitX = t => key(t, [[30.72, 0.915], [31.0, 0.305, 'inOut'], [31.8, 0.305], [32.08, 0.915, 'inOut'], [36.45, 0.915], [36.78, 0.72, 'inOut']]);
  const bitY = t => key(t, [[31.28, 0], [31.45, 0.46, 'out'], [31.62, 0, 'in']]);
  const RUN = t => t >= 30.1 && t < 32.25;
  const POPS = [36.5];
  const pushing = t => (t > 36.2 && t < 36.5);
  const popK = t => { let k = 0; for (const p of POPS) k = Math.max(k, smooth(p - 0.02, p + 0.03, t) * (1 - smooth(p + 0.06, p + 0.3, t))); return k; };
  const QUEUE = t => t > 32.25 && t < 36.2; // Bit stuck in the competitor queue

  // projection
  let CAMX = 0; // lateral camera offset (world units); the tunnel stays centred (it is symmetric)
  const proj = (X, Y, Z, zc) => { const d = Z - zc; return [VX + (X - CAMX) * F / d, VY + (FL - Y) * F / d, d]; };

  // ---------------------------------------------------------------- helpers
  const clampCam = c => { const hw = 960 / c.zoom, hh = 540 / c.zoom; c.x = clamp(c.x, hw + 22 / c.zoom, 1920 - hw - 22 / c.zoom); c.y = clamp(c.y, hh + 22 / c.zoom, 1080 - hh - 22 / c.zoom); return c; };
  const fillBase = ctx => { ctx.fillStyle = '#070a24'; ctx.fillRect(-2000, -2000, 6000, 5000); };
  function drawPk(ctx, p, t, zc, o = {}) {
    const d = p.Z + (o.dz || 0) - zc; if (d < 0.32) return;
    const [x, y] = proj(p.X + (o.dx || 0), o.y || 0, p.Z + (o.dz || 0), zc);
    const sc = PKS / d, fog = clamp(1 - (d - 5) / 16) * clamp((d - (o.near || 0.32)) / 0.3);
    if (fog <= 0.02) return;
    // brake-light spill behind each car
    if (d > 1.2) A.glow(ctx, x, y - sc * 20, sc * 95, 'rgba(255,36,60,1)', 0.10 * fog * (0.8 + 0.2 * Math.sin(t * 3 + p.seed)));
    ctx.save(); ctx.globalAlpha = fog;
    if (p.brand) {
      const bo = { t, brand: p.brand, seed: p.seed, mood: o.bmood || BRAND_MOOD[p.brand], spinner: o.spinner ?? (p.brand === 'EMBY' || p.brand === 'LOADING+' ? 1 : 0),
        mouth: o.mouth ?? A.mouth(p.brand, t), spinnerEyes: o.spinnerEyes || 0, shadow: 0.6, look: o.look, rot: o.rot || 0, squash: o.squash || 0, glow: 0.45 + 0.3 * fog };
      drawBrand(ctx, x, y, sc, bo);
      ctx.restore(); return;
    }
    const honk = o.honk != null ? o.honk : honkAmt(p, t);
    const pm = p.prop === 'paper' && !(o.spike > 0.35) ? 'bored' : p.prop === 'watch' ? 'annoyed' : null;
    A.drawPacket(ctx, x, y, sc, { t, seed: p.seed, kind: p.kind, mood: o.mood || pm || p.mood, honk, look: o.look || (p.prop === 'paper' ? [0, 0.6] : p.prop === 'watch' ? [0.3, -0.7] : undefined), squash: o.squash || 0, rot: o.rot || 0, glow: 0.45 + 0.3 * fog });
    if (p.prop && d > 0.5) drawProp(ctx, p, x, y, sc, t, o.spike || 0);
    ctx.restore();
  }

  // commuter props: a newspaper (flies up when Bit blasts past) or an impatient wristwatch check
  function drawProp(ctx, p, x, y, sc, t, spike) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    if (p.prop === 'paper') {
      const up = spike, ph = H(p.seed) * 6;
      ctx.translate(0 + up * 30, -34 - up * 70); ctx.rotate(-0.08 + Math.sin(t * 1.3 + ph) * 0.03 + up * 0.9);
      ctx.beginPath(); ctx.moveTo(-42, -26); ctx.lineTo(42, -30); ctx.lineTo(44, 24); ctx.lineTo(-40, 28); ctx.closePath(); A.fillStroke(ctx, '#f1ecdc', 3);
      ctx.strokeStyle = 'rgba(40,30,60,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1, -28); ctx.lineTo(2, 26); ctx.stroke();
      A.text(ctx, 'חדשות', -20, -16, { font: '800 12px Rubik', fill: '#1a1330', dir: 'rtl' });
      A.text(ctx, '1-1', 22, -16, { font: '900 12px Rubik', fill: '#c02a3a' });
      ctx.fillStyle = 'rgba(40,30,60,0.35)';
      for (let i = 0; i < 4; i++) { ctx.fillRect(-36, -4 + i * 7, 30, 2.5); ctx.fillRect(8, -4 + i * 7, 30, 2.5); }
    } else if (p.prop === 'watch') {
      // raised stubby arm with a watch + a floating clock bubble "tick tick"
      const tap = Math.max(0, Math.sin(t * 9 + p.seed)) * 4;
      ctx.lineCap = 'round'; ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(34, -40); ctx.quadraticCurveTo(58, -58, 44, -80 - tap); ctx.stroke();
      ctx.strokeStyle = '#e9e2ff'; ctx.lineWidth = 8; ctx.stroke();
      A.ellipse(ctx, 47, -72 - tap, 9, 9); A.fillStroke(ctx, '#ffd84a', 3);
      ctx.save(); ctx.translate(-8, -150); A.ellipse(ctx, 0, 0, 20, 20); A.fillStroke(ctx, '#ffffff', 3);
      ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2.5; const a1 = t * 6 + p.seed, a2 = t * 0.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a1) * 14, Math.sin(a1) * 14); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a2) * 9, Math.sin(a2) * 9); ctx.stroke();
      A.text(ctx, 'tik', 30, -6, { font: '400 14px Bangers', fill: '#ffd84a', stroke: A.OUTLINE, lw: 3 });
      ctx.restore();
    }
    ctx.restore();
  }
  // competitor packet: props kit when it exists, otherwise a generic packet + brand tag
  function drawBrand(ctx, x, y, sc, o) {
    if (A.drawBrandPacket) { A.drawBrandPacket(ctx, x, y, sc * 0.9, Object.assign({ who: o.brand }, o)); return; }
    const mm = { grumpy: 'annoyed', sleepy: 'sleep', shock: 'shock', panting: 'bored' };
    A.drawPacket(ctx, x, y, sc, { t: o.t, seed: o.seed, kind: { ILVIP: 'video', EMBY: 'photo', LAGTV: 'update', 'LOADING+': 'meme' }[o.brand], mood: mm[o.mood] || 'bored', mouth: o.mouth, look: o.look, rot: o.rot, squash: o.squash, noZ: true, glow: o.glow });
    ctx.save(); ctx.translate(x, y - 104 * sc); ctx.scale(sc * 0.55, sc * 0.55);
    ctx.font = '900 24px Rubik'; const w = ctx.measureText(o.brand).width + 26;
    A.rrect(ctx, -w / 2, -17, w, 34, 10); A.fillStroke(ctx, BRAND_COL[o.brand], 4);
    A.text(ctx, o.brand, 0, 1, { font: '900 24px Rubik', fill: '#fff' });
    if (o.spinner > 0) {
      ctx.translate(w / 2 + 20, 0); ctx.globalAlpha *= o.spinner;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.floor(o.t * 8) * Math.PI / 4; ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.8 * i / 8})`; ctx.beginPath(); ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 3.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  // hanging queue sign (world item)
  const SIGN = { X: 0.9, Y: 0.74, Z: 8.45 };
  function drawSign(ctx, x, y, s, t, swing = 0, flicker = 0.5) {
    const sw = Math.sin(t * 1.3) * 0.03 + swing;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(200,210,255,0.6)'; ctx.lineWidth = Math.max(1, 3 * s);
    ctx.beginPath(); ctx.moveTo(-110 * s, -44 * s); ctx.lineTo(-90 * s, -900 * s); ctx.moveTo(110 * s, -44 * s); ctx.lineTo(90 * s, -900 * s); ctx.stroke();
    if (A.drawQueueSign) A.drawQueueSign(ctx, 0, 0, s, { t, ticket: 412, flicker });
    else {
      ctx.scale(s, s);
      A.rrect(ctx, -150, -46, 300, 92, 14); A.fillStroke(ctx, '#1b1540', 5);
      ctx.strokeStyle = 'rgba(255,190,70,0.8)'; ctx.lineWidth = 2; A.rrect(ctx, -140, -36, 280, 72, 10); ctx.stroke();
      A.text(ctx, 'ממתין בתור', 0, -10, { font: '800 34px Rubik', fill: '#ffbf4a', dir: 'rtl' });
      A.text(ctx, 'WAITING IN LINE · #0412', 0, 22, { font: '700 16px Rubik', fill: 'rgba(255,220,170,0.85)' });
      A.glow(ctx, 0, 0, 200, 'rgba(255,170,60,1)', 0.12);
    }
    ctx.restore();
  }

  // idle creep: lanes inch forward then brake (stop-and-go)
  const creep = (p, t) => -0.06 * smooth(0, 1, (Math.sin(t * 0.9 + p.li * 1.3) + 1) / 2);

  // ---------------------------------------------------------------- HUD: live delay counter
  function hud(ctx, t) {
    const a = smooth(29.4, 29.65, t);
    if (a <= 0) return;
    let v, col = '#ff3b4f';
    if (t < 47.7) v = 4.2 + Math.max(0, t - 29.65) * 0.72;
    else { const u = inv(47.7, 48.4, t); v = lerp(4.2 + (47.7 - 29.65) * 0.72, 1.3, ease.out(u)); col = A.mixc('#ff3b4f', '#5dff9a', smooth(0, 0.7, u)); }
    const shake = t > 46.5 && t < 47.3 ? (1 - inv(46.5, 47.3, t)) * 5 : 0;
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
    const jit = t > 41.5 && t < 47.7 ? A.noise1(t * 40) * 1.2 : 0;
    A.text(ctx, v.toFixed(1) + 's', 22 + jit, 70, { font: '900 40px Rubik', fill: col, align: 'left' });
    // mini buffer bar
    const bw = 170, fillp = t < 47.7 ? 0.15 + 0.05 * Math.sin(t * 2) : lerp(0.2, 1, smooth(47.7, 48.3, t));
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
      const d = p.Z - zc; if (d < (opt.near || 0.32) - 0.2 || d > 22) continue;
      items.push({ d, p });
    }
    if (opt.cat !== false) items.push({ d: CATZ - zc, cat: true });
    if (opt.bit) items.push({ d: opt.bit.Z - zc - 0.01, bit: true });
    if (opt.sign !== false) items.push({ d: SIGN.Z - zc, sign: true });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) {
      if (it.bit) { const b = opt.bit, [x, y, d] = proj(b.X, b.Y, b.Z, zc); if (d > 0.3) b.draw(ctx, x, y, BTS / d, d); continue; }
      if (it.sign) { const [x, y, d] = proj(SIGN.X, SIGN.Y + (opt.signDrop || 0), SIGN.Z, zc); if (d > 0.4) drawSign(ctx, x, y, 0.95 / d * (opt.signK || 1), t, opt.signSwing || 0, opt.signFlicker ?? 0.5); continue; }
      if (it.cat) {
        const [x, y, d] = proj(opt.catX ?? CATX, 0, CATZ, zc); if (d < Math.max(0.35, opt.near || 0)) continue;
        A.glow(ctx, x, y - 40 * CTS / d, 260 * CTS / d, 'rgba(255,36,60,1)', 0.12);
        A.drawCatPacket(ctx, x, y, CTS / d, Object.assign({ t }, opt.catO ? opt.catO(x, y, d) : {}));
        continue;
      }
      const p = it.p;
      let o = { dz: creep(p, t), near: opt.near };
      if (opt.pkO) o = Object.assign(o, opt.pkO(p, it.d));
      drawPk(ctx, p, t, zc, o);
    }
  }


  // ---------------------------------------------------------------- Bit's appearance in the jam (A/B/Q)
  function bitJamOpts(t) {
    const push = pushing(t), pk = popK(t), speaking = A.speaking('BIT', t);
    const vz = (bitZ(t + 0.03) - bitZ(t - 0.03)) / 0.06; // units/s (negative = toward camera)
    const o = { t, mood: push ? 'squeeze' : 'determined', shadow: 0.8, glow: 1.25 };
    if (push) { o.limbs = 'push'; o.squash = -0.16 - 0.06 * Math.sin(t * 30); }
    else if (Math.abs(vz) > 0.25) { o.limbs = 'run'; o.vel = [0, 0]; o.runRate = 3.4; o.phase = t * Math.PI * 2 * 3.4; }
    else o.limbs = 'stand';
    if (pk > 0) { o.squash = -0.28 * pk; o.hop = 14 * pk; o.sparkle = pk; }
    if (RUN(t)) { // the dash through the queue
      const vx = (bitX(t + 0.03) - bitX(t - 0.03)) / 0.06, vy = (bitY(t + 0.03) - bitY(t - 0.03)) / 0.06;
      o.limbs = 'run'; o.runRate = 4.4; o.phase = t * Math.PI * 2 * 4.4; o.vel = [vx * 700, 0]; o.rot = clamp(vx * 0.12, -0.3, 0.3);
      o.mood = 'determined'; o.glow = 1.5;
      if (t > 30.5 && t < 31.2) o.armR = [80, -150 + Math.sin(t * 18) * 6]; // "Live goal!" arm up
      if (bitY(t) > 0.01 || (t > 31.26 && t < 31.64)) { o.limbs = 'fly'; o.vel = [260, -vy * 900]; o.rot = -0.2 + (t - 31.28) * 0.9; o.squash = -0.12; }
      if (t > 31.6 && t < 31.72) { o.limbs = 'crouch'; o.squash = 0.25 * (1 - inv(31.6, 31.72, t)); } // landing
      if (t > 31.75 && t < 32.05) { o.armR = [78, -160 + Math.sin(t * 20) * 8]; o.armL = [-66, -100]; }
      if (t > 32.02) { const k = inv(32.02, 32.25, t); o.limbs = 'stand'; o.rot = -0.22 * Math.sin(k * Math.PI); o.squash = 0.18 * Math.sin(k * Math.PI); o.legL = [-34, -5]; o.legR = [30, -5]; } // skid
    }
    if (t > 32.15 && t < 32.35) { o.mood = 'panic'; o.look = [0, -0.2]; }
    if (QUEUE(t)) { // sandwiched between ILVIP and EMBY
      const sq = -0.2 + 0.03 * Math.sin(t * 3);
      o.limbs = 'stand'; o.squash = sq; o.armL = [-50, -70]; o.armR = [50, -70];
      if (t < 32.5) { o.mood = 'determined'; o.look = [0.2, -0.1]; }
      else if (t < 35.0) { // ILVIP scolds him (ILVIP is screen-left)
        o.mood = t < 33.9 ? 'panic' : 'neutral'; o.look = [-0.85, -0.05]; o.sweat = 1; o.browRaise = 4;
        if (t > 34.3) { o.armL = [-60, -110]; o.armR = [60, -110]; } // sheepish "okay okay" hands
      } else { // EMBY snoozes on the right; Bit's deadpan
        o.mood = 'neutral'; o.look = t < 35.9 ? [0.85, 0.0] : [0.0, 0.05]; o.lid = t > 35.5 ? 0.45 : 0.15;
      }
    }
    if (t >= 36.78) { // wedged against the cat
      const w = inv(36.78, 36.95, t);
      o.limbs = 'push'; o.mood = 'squeeze'; o.squash = -0.34 + 0.06 * Math.sin(w * 20) * (1 - w); o.sweat = 1; o.look = [-0.8, -0.4]; o.rot = -0.08;
    }
    o.look = o.look || (speaking ? [0.1, -0.1] : [A.wob(t, 3, 0.8) * 0.5, -0.1]);
    return o;
  }
  // neighbours get shoved while Bit squeezes past; queue brands act
  function shoveO(p, t) {
    const out = {};
    if (p.brand === 'ILVIP' && t > 32.25 && t < 36.4) {
      const talk = t > 32.35 && t < 35.0;
      const turned = t > 32.42, snap = t > 32.42 ? Math.exp(-(t - 32.42) * 9) * Math.sin((t - 32.42) * 30) : 0;
      Object.assign(out, { look: !turned ? [-0.9, -0.3] : talk ? [0.9, -0.05] : [0.3, 0.1], bmood: 'grumpy', rot: (talk ? 0.05 * Math.sin(t * 2.2) + 0.04 : 0) + snap * 0.12, squash: (talk ? -0.04 * Math.abs(Math.sin(t * 7)) : 0) - 0.08 * Math.abs(snap) });
    }
    if (p.brand === 'EMBY' && t > 32.25 && t < 36.4) Object.assign(out, { look: [-0.4, 0.3], bmood: 'sleepy', rot: -0.06 + 0.02 * Math.sin(t * 1.1), spinnerEyes: smooth(35.5, 35.7, t) });
    const bz = bitZ(t), bx = bitX(t);
    // ILVIP and EMBY close ranks as he arrives
    const close = smooth(31.6, 31.85, t) * (1 - smooth(36.25, 36.45, t));
    if (p.brand === 'ILVIP' && p.r === 9) out.dx = 0.07 * close;
    if (p.brand === 'EMBY' && p.r === 9) out.dx = -0.07 * close;
    if (RUN(t) && p.r !== 9) { // the queue reacts as he blasts past
      const dzp = p.Z - bz, side = Math.sign(bx - p.X) || 1;
      if (Math.abs(p.X - bx) < 0.95 && dzp > -0.6 && dzp < 3.2) {
        const pre = smooth(-0.6, -0.1, dzp), after = 1 - smooth(1.8, 3.2, dzp), k = pre * after;
        const spike = Math.exp(-Math.max(0, dzp) * 3) * pre;
        return Object.assign(out, {
          look: [side * 0.85, dzp > 0 ? 0.45 : -0.1], mood: spike > 0.35 ? 'shock' : 'annoyed', bmood: spike > 0.35 ? 'shock' : undefined,
          rot: -side * 0.22 * spike, y: 0.05 * spike, squash: -0.12 * spike, react: k, spike, dx: -side * 0.05 * spike,
        });
      }
      return out;
    }
    if (!(p.li === 3 || p.li === 4)) return out;
    const dz = Math.abs(p.Z - bz); if (dz > 0.45) return out;
    const k = (1 - dz / 0.45) * (pushing(t) || t > 36.78 ? 1 : QUEUE(t) ? 0.35 : 0.5);
    const side = Math.sign(p.X - bx) || 1;
    const wob = popK(t) * Math.sin(t * 40) * 0.4;
    return Object.assign({ dx: side * 0.1 * k, squash: 0.18 * k + wob * 0.12, mood: k > 0.3 ? 'annoyed' : undefined, look: [-side * 0.8, 0.2], rot: side * 0.06 * k }, out,
      out.squash != null ? { squash: out.squash + 0.1 * k } : {});
  }

  // ============================================================ SHOTS
  function shotB(ctx, t) {
    const bz = bitZ(t), bx = bitX(t);
    let zc, cam;
    const bump = t > 36.8 ? Math.exp(-(t - 36.8) * 14) : 0;
    if (t < 31.9) { // B: fast tracking run through the queue (v2 only)
      zc = bitZ(t - 0.09) - 1.4; CAMX = bitX(t - 0.1);
      const [bxs, bys] = proj(bx, 0, bz, zc);
      const lat = (bitX(t - 0.07) - bitX(t - 0.13)) / 0.06;
      const land = t > 31.6 ? Math.exp(-(t - 31.6) * 10) : 0;
      cam = { x: lerp(960, bxs, 0.8), y: bys - 175 - bitY(t) * 120, zoom: lerp(1.25, 1.34, smooth(31.8, 32.25, t)), rot: -lat * 0.05, shake: land * 1.2 + (t > 32.05 ? Math.exp(-(t - 32.05) * 8) * 0.6 : 0), t };
    } else if (t < 35.0) { // Q1 (v7: from the arrival cut at 31.95): push in on ILVIP's crown as he turns, then settle on the two-shot
      const pin = ease.inOut(inv(32.36, 32.8, t)), out = ease.inOut(inv(33.75, 34.55, t)), k = pin * (1 - out), arr = 1 - ease.out(inv(31.95, 32.3, t));
      zc = 6.9 + 0.05 * out; CAMX = 0.8;
      const [ix, iy] = proj(0.71, 0, ROW(9), zc), [bxs] = proj(bx, 0, bz, zc), [hx, hy] = proj(0.71, 0.26, ROW(9) + 0.12, zc);
      const two = { x: (ix + bxs) / 2 + 10, y: iy - 230, zoom: lerp(1.12, 1.18, out) };
      const tight = { x: hx + 25, y: hy + 110, zoom: 2.4 };
      cam = { x: lerp(two.x, tight.x, k), y: lerp(two.y, tight.y, k) + 40 * arr, zoom: lerp(two.zoom, tight.zoom, k) - 0.1 * arr, rot: -0.012 - 0.02 * k, shake: t > 32.2 && t < 32.5 ? 0.6 * (1 - inv(32.2, 32.5, t)) : 0, t };
    } else { // Q2: EMBY, then Bit pops out and tracks to the cat
      const u = inv(35.0, 36.2, t), w = smooth(36.2, 36.75, t);
      zc = lerp(lerp(6.92, 6.99, u), bitZ(t - 0.18) - 1.28, smooth(36.2, 36.45, t)) - 0.1 * w;
      CAMX = lerp(1.08, 0.55, w);
      const [ex, ey] = proj(1.19, 0, ROW(9), zc), [bxs, bys] = proj(bx, 0, bz, zc), cx = proj(0, 0, CATZ, zc)[0];
      cam = { x: lerp((ex + bxs) / 2 - 10, lerp(bxs, cx, 0.35), w), y: lerp(ey - 230, bys - 200, w), zoom: lerp(lerp(1.15, 1.2, u), 1.55, w), rot: 0.012 * (1 - w), shake: bump * 1.4, t };
    }
    clampCam(cam);
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.95, near: t > 31.9 && t < 36.3 ? 0.5 : undefined, sign: t >= 32.06, cat: t > 36.2, signK: 1.5,
      signDrop: (1 - ease.outBack(inv(32.06, 32.42, t))) * 1.6, signSwing: Math.exp(-Math.max(0, t - 32.35) * 2.5) * Math.sin(Math.max(0, t - 32.35) * 9) * 0.14,
      signFlicker: t > 32.3 && t < 32.75 ? 1 : 0.5,
      bit: { X: bx, Y: bitY(t), Z: bz, draw: (c, x, y, sc) => A.drawBit(c, x, y, sc, bitJamOpts(t)) },
      catO: () => ({ mood: 'bored', look: [0.6, 0.3], squash: -0.03 * bump }),
      pkO: p => shoveO(p, t),
    });
    // Bit's side-eye "..." at EMBY
    if (t > 35.95 && t < 36.2) {
      const [x, y, d] = proj(bx, 0.36, bz, zc), a = smooth(35.95, 36.0, t);
      ctx.save(); ctx.globalAlpha = a; A.text(ctx, '...', x + 10, y, { font: `900 ${Math.round(60 / d)}px Fredoka`, fill: '#fff', stroke: A.OUTLINE, lw: 5 }); ctx.restore();
    }
    // bonk impact star
    if (t > 36.78 && t < 36.96) {
      const [x, y] = proj(0.58, 0.2, CATZ - 0.1, zc), u = inv(36.78, 36.96, t);
      ctx.save(); ctx.translate(x, y); ctx.scale(0.6 + 0.6 * u, 0.6 + 0.6 * u); ctx.globalAlpha = 1 - u;
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 22 : 58, a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      A.fillStroke(ctx, '#fff3a0', 4); A.text(ctx, 'BONK', 0, 2, { font: '400 30px Bangers', fill: '#e8344e', stroke: A.OUTLINE, lw: 4 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ======================================================================================
  // v7 BACK VIEWS (everything faces the front of the queue; the chase cam sees their backs)
  // ======================================================================================
  const squircle = (a, b, n, N, taper, cx, cy) => {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      const X = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * a, Y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * b;
      pts.push([cx + X * (1 + taper * (Y / b)), cy + Y]);
    }
    return pts;
  };
  const limbLine = (ctx, x0, y0, x1, y1, w, col) => {
    ctx.lineCap = 'round'; ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = w + 7; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };
  // BIT from behind: the back of a golden envelope (flap + wax seal), pumping arms, kicking soles
  function drawBitBack(ctx, x, y, sc, o = {}) {
    const t = o.t || 0, ph = o.phase ?? t * Math.PI * 2 * 3.6, run = o.run ?? 1, hop = o.hop || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    if (!hop && !o.noShadow) { A.ellipse(ctx, 0, -2, 54, 10); ctx.fillStyle = 'rgba(5,5,25,0.4)'; ctx.fill(); }
    A.glow(ctx, 0, -70 - hop, 150, '#ffbe3a', 0.32 * (o.glow ?? 1));
    ctx.translate(0, -hop); ctx.rotate(o.rot || 0);
    const bob = -Math.abs(Math.sin(ph)) * 6 * run;
    const sq = o.squash || 0; ctx.scale(1 + sq * 0.7, 1 - sq);
    // legs (behind body): a kicked-back foot rises and shows its sole
    for (let i = 0; i < 2; i++) {
      const p = ph + i * Math.PI, s = i ? 1 : -1, lift = Math.max(0, -Math.cos(p)) * run;
      const fx = s * (15 + (o.stuck ? 10 : 0)), fy = -6 - lift * 26 + (o.legsUp ? -30 : 0);
      limbLine(ctx, s * 14, -26 + bob, fx, fy, 11, '#f5b030');
      ctx.save(); ctx.translate(fx, fy);
      if (lift > 0.25) { A.ellipse(ctx, 0, 2, 9, 12); A.fillStroke(ctx, '#f4f6ff', 3.5); A.ellipse(ctx, 0, -2, 4.5, 4); ctx.fillStyle = '#c9d2f0'; ctx.fill(); }
      else { A.ellipse(ctx, 0, 0, 13, 8.5); A.fillStroke(ctx, '#1f4fbf', 3.5); }
      ctx.restore();
    }
    // body
    const CY = -70 + bob, pts = squircle(56, 52, 3.1, 40, 0.07, 0, CY);
    A.blob(ctx, pts);
    ctx.fillStyle = A.radial(ctx, 10, CY - 10, 0, 80, [[0, '#ffe68c'], [0.55, '#ffc93c'], [1, '#e0801e']]); ctx.fill();
    ctx.save(); A.blob(ctx, pts); ctx.clip();
    ctx.fillStyle = 'rgba(200,110,20,0.35)'; A.ellipse(ctx, -30, CY + 30, 70, 50); ctx.fill();
    ctx.strokeStyle = 'rgba(168,247,255,0.8)'; ctx.lineWidth = 6; A.blob(ctx, pts); ctx.stroke();
    // envelope back: side seams + top flap with a wax seal
    ctx.strokeStyle = 'rgba(150,70,10,0.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-56, CY + 50); ctx.lineTo(0, CY + 6); ctx.lineTo(56, CY + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-58, CY - 48); ctx.quadraticCurveTo(-20, CY - 6, 0, CY + 2); ctx.quadraticCurveTo(20, CY - 6, 58, CY - 48); ctx.closePath();
    ctx.fillStyle = 'rgba(255,245,200,0.35)'; ctx.fill(); ctx.stroke();
    ctx.restore();
    A.blob(ctx, pts); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 4.5; ctx.stroke();
    A.ellipse(ctx, 0, CY + 2, 11, 11); A.fillStroke(ctx, '#1f4fbf', 3);
    ctx.fillStyle = '#ffd21f'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, CY + 2 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    // arms pumping (in front of the body edge)
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1, p = ph + i * Math.PI;
      const hx = o.stuck ? s * 84 : s * (58 + Math.sin(p) * 6), hy = o.stuck ? CY - 18 + A.noise1(t * 26 + i) * 3 : CY + 22 - Math.sin(p) * 22 * run;
      limbLine(ctx, s * 46, CY - 2, hx, hy, 10.5, '#ffc338');
      A.ellipse(ctx, hx, hy, 9.5, 9); A.fillStroke(ctx, '#fffaf0', 3.5);
    }
    // luggage tag flapping off his back-right
    const ta = 0.5 + Math.sin(t * 9) * 0.25 * run + (o.tagLift || 0);
    ctx.save(); ctx.translate(38, CY - 44); ctx.rotate(ta);
    ctx.strokeStyle = '#e0314f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
    A.rrect(ctx, -17, 16, 34, 22, 4); A.fillStroke(ctx, '#fff3d6', 3); ctx.fillStyle = '#1f4fbf'; ctx.fillRect(-17, 16, 34, 5);
    A.text(ctx, '#5401', 0, 29, { font: '800 9px Rubik', fill: '#1a1330' });
    ctx.restore();
    ctx.restore();
  }
  // generic / competitor packet from behind: tail lights, rear plate, brand accessory
  const pkGeom = seed => {
    const h1 = A.hash(seed * 3.17 + 0.5); const sw = [1, 1.14, 0.9][Math.floor(h1 * 3)], sh = [1, 0.9, 1.1][Math.floor(h1 * 3)];
    return { a: 44 * sw, b: 36 * sh, cy: -(36 * sh + 9) };
  };
  function drawPkBack(ctx, p, x, y, sc, t, o = {}) {
    const zoom = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) * sc;
    const res = zoom < 0.45 ? 0.5 : zoom < 0.9 ? 1 : zoom < 1.8 ? 2 : 3.5;
    const key = `s4pkb:${p.brand || p.kind}:${p.seed}:${p.prop || ''}:${p.mood === 'sleep' ? 1 : 0}:${res}`;
    const spr = A.layer(key, Math.ceil(200 * res), Math.ceil(190 * res), g => { g.scale(res, res); drawPkBackRaw(g, p, 100, 170, 1, 0, {}); });
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); const sq = o.squash || 0; ctx.scale(sc * (1 + sq * 0.7), sc * (1 - sq) * (1 + 0.012 * Math.sin(t * 3 + p.seed)));
    ctx.drawImage(spr, -100, -170, 200, 190);
    ctx.restore();
    if (p.mood === 'sleep' && !p.brand && zoom > 0.5) { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); for (let i = 0; i < 2; i++) { const u = ((t * 0.35 + i * 0.5 + H(p.seed)) % 1); ctx.globalAlpha *= Math.sin(u * Math.PI); A.text(ctx, 'z', 30 + u * 16, -90 - u * 28, { font: '700 14px Fredoka', fill: '#e8f6ff', stroke: A.OUTLINE, lw: 3 }); ctx.globalAlpha = 1; } ctx.restore(); }
  }
  function drawPkBackRaw(ctx, p, x, y, sc, t, o = {}) {
    const g = pkGeom(p.seed), a = p.brand ? 46 : g.a, b = p.brand ? 40 : g.b, cy = p.brand ? -49 : g.cy;
    const col = p.brand ? (A.BRAND_COLORS && A.BRAND_COLORS[p.brand]) || { c: BRAND_COL[p.brand], d: '#333' } : (A.PACKET_COLORS || {})[p.kind] || { c: '#999', d: '#555' };
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const br = Math.sin(t * 3 + p.seed);
    ctx.rotate(o.rot || 0); const sq = (o.squash || 0); ctx.scale(1 + sq * 0.7, (1 - sq) * (1 + 0.015 * br));
    A.ellipse(ctx, 0, -1, a * 0.95, 8); ctx.fillStyle = 'rgba(5,5,25,0.35)'; ctx.fill();
    [-1, 1].forEach(s => { A.ellipse(ctx, s * a * 0.45, -5, 13, 7); A.fillStroke(ctx, col.d, 3.2); });
    // accessories behind the body
    if (p.brand === 'LAGTV') { ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, cy - b); ctx.lineTo(-26, cy - b - 38); ctx.moveTo(6, cy - b); ctx.lineTo(28, cy - b - 34); ctx.stroke(); A.ellipse(ctx, -26, cy - b - 38, 5, 5); A.fillStroke(ctx, '#cfd3e6', 2.5); A.ellipse(ctx, 28, cy - b - 34, 5, 5); A.fillStroke(ctx, '#cfd3e6', 2.5); }
    const pts = squircle(a, b, 3, 36, 0.08, 0, cy);
    A.blob(ctx, pts); ctx.fillStyle = A.linear(ctx, 0, cy - b, 0, cy + b, [[0, col.c], [1, col.d]]); ctx.fill();
    ctx.save(); A.blob(ctx, pts); ctx.clip(); ctx.fillStyle = 'rgba(20,10,40,0.22)'; A.ellipse(ctx, a * 0.4, cy + b * 0.5, a, b * 0.8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-a * 0.7, cy - b * 0.65); ctx.quadraticCurveTo(0, cy - b * 0.95, a * 0.5, cy - b * 0.7); ctx.stroke(); ctx.restore();
    A.blob(ctx, pts); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3.6; ctx.stroke();
    // tail lights + plate
    const bl = 0.75 + 0.25 * Math.sin(t * 4 + p.seed);
    [-1, 1].forEach(s => { A.rrect(ctx, s * a * 0.62 - 7, cy + b * 0.3, 14, 9, 3); A.fillStroke(ctx, '#ff2a44', 2.2); A.glow(ctx, s * a * 0.62, cy + b * 0.35, 26, 'rgba(255,40,60,1)', 0.55 * bl); });
    const plate = p.brand || ('PKT ' + (100 + (p.seed * 37) % 900));
    ctx.font = '800 11px Rubik'; const pw = ctx.measureText(plate).width + 12;
    A.rrect(ctx, -pw / 2, cy + b * 0.28, pw, 14, 3); A.fillStroke(ctx, '#f3f1e6', 2);
    A.text(ctx, plate, 0, cy + b * 0.28 + 7.5, { font: '800 11px Rubik', fill: '#1a1330' });
    // top accessories
    if (p.brand === 'ILVIP') { ctx.beginPath(); ctx.moveTo(-18, cy - b + 4); ctx.lineTo(-20, cy - b - 16); ctx.lineTo(-9, cy - b - 6); ctx.lineTo(0, cy - b - 20); ctx.lineTo(9, cy - b - 6); ctx.lineTo(20, cy - b - 16); ctx.lineTo(18, cy - b + 4); ctx.closePath(); A.fillStroke(ctx, '#d8b34a', 3); }
    if (p.brand === 'EMBY') { ctx.beginPath(); ctx.moveTo(-a * 0.8, cy - b * 0.7); ctx.quadraticCurveTo(0, cy - b * 1.6, a * 0.9, cy - b * 0.9 + 14); ctx.quadraticCurveTo(a * 0.3, cy - b * 0.95, -a * 0.8, cy - b * 0.7); A.fillStroke(ctx, '#aeb4bf', 3); A.ellipse(ctx, a * 0.95, cy - b * 0.9 + 18, 8, 8); A.fillStroke(ctx, '#eef0f4', 2.5); }
    if (p.brand === 'LOADING+') { ctx.save(); ctx.translate(0, cy - b - 18); ctx.rotate(Math.floor(t * 1.5) * Math.PI * 0.5 + smooth(0.8, 1, (t * 1.5) % 1) * Math.PI * 0.5); ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(9, -12); ctx.lineTo(-9, 12); ctx.lineTo(9, 12); ctx.closePath(); A.fillStroke(ctx, '#f0e2b8', 2.5); ctx.restore(); }
    if (p.prop === 'paper') { ctx.save(); ctx.rotate(-0.05); [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * a * 0.92, cy - b * 0.55); ctx.lineTo(s * (a + 16), cy - b * 0.65); ctx.lineTo(s * (a + 14), cy + b * 0.05); ctx.lineTo(s * a * 0.92, cy); ctx.closePath(); A.fillStroke(ctx, '#f1ecdc', 2.5); }); ctx.restore(); }
    ctx.restore();
  }
  // Catpacket from behind (far ahead in the chase)
  function drawCatBack(ctx, x, y, sc, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const CY = -118, pts = squircle(136, 100, 2.7, 44, 0.12, 0, CY);
    [-1, 1].forEach(s => { ctx.save(); ctx.translate(s * 76, CY - 90); ctx.rotate(s * 0.05); ctx.beginPath(); ctx.moveTo(-40, 14); ctx.quadraticCurveTo(-18, -50, s * 6, -64); ctx.quadraticCurveTo(26, -36, 40, 10); ctx.closePath(); A.fillStroke(ctx, '#9b8cb3', 5); ctx.restore(); });
    A.blob(ctx, pts); ctx.fillStyle = A.linear(ctx, 0, CY - 100, 0, CY + 100, [[0, '#b7a9cb'], [1, '#7e6f99']]); ctx.fill();
    ctx.save(); A.blob(ctx, pts); ctx.clip(); ctx.strokeStyle = 'rgba(80,65,110,0.55)'; ctx.lineWidth = 12;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 44 - 16, CY - 104); ctx.quadraticCurveTo(i * 44, CY - 60, i * 44 + 10, CY - 40); ctx.stroke(); } ctx.restore();
    A.blob(ctx, pts); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 5; ctx.stroke();
    const a1 = Math.sin(t * 1.4) * 0.3;
    ctx.save(); ctx.translate(0, -40); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40 + a1 * 60, -40, 20 + a1 * 90, -150);
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 34; ctx.stroke(); ctx.strokeStyle = '#ab9cc0'; ctx.lineWidth = 26; ctx.stroke(); ctx.restore();
    ctx.restore();
  }
  // 2D turn: back (k<0.5) squashes to a sliver, the front pops out (k>0.5)
  function turnDraw(ctx, x, k, back, front) {
    const s = k < 0.5 ? 1 - 2 * k : 2 * k - 1;
    ctx.save(); ctx.translate(x, 0); ctx.scale(Math.max(0.04, s), 1); ctx.translate(-x, 0);
    if (k < 0.5) back(); else front();
    ctx.restore();
  }

  // ======================================================================================
  // v7 CHASE: Bit's run through the queue (own time base 29.2 to 36.95), reverse camera
  // ======================================================================================
  const RZ = t => key(t, [[29.2, 25.2], [30.15, 23.38, 'lin'], [30.32, 23.8, 'out'], [30.55, 23.62], [30.8, 23.14, 'inOut'], [31.26, 23.02],
    [31.34, 22.5, 'out'], [31.4, 22.3, 'lin'], [33.2, 16.75, 'lin'], [33.9, 14.95, 'out'], [34.3, 13.8, 'lin'], [35.02, 13.56, 'inOut'],
    [35.1, 13.02, 'out'], [36.5, 9.35, 'lin'], [36.95, 8.45, 'out']]);
  const RX = t => key(t, [[29.2, 0.305], [35.95, 0.305], [36.55, 0.915, 'inOut']]) + (t < 35.95 ? Math.sin(t * 5.3) * 0.03 : 0);
  const RY = t => key(t, [[33.3, 0], [33.58, 0.6, 'out'], [33.86, 0, 'in']]);
  const STUCK = t => (t > 30.72 && t < 31.3) || (t > 34.3 && t < 35.08);
  const RPOPS = [31.3, 35.08], BONK = 30.15;
  const rpop = t => { let k = 0; for (const p of RPOPS) k = Math.max(k, smooth(p - 0.02, p + 0.03, t) * (1 - smooth(p + 0.06, p + 0.3, t))); return k; };
  const CH_HONKS = [[3, 28, 30.2], [2, 28, 30.95], [2, 16, 34.62], [3, 16, 34.95], [4, 15, 35.45], [1, 13, 35.8], [4, 11, 36.3]];
  const projR = (X, Y, Z, zc) => { const d = zc - Z; return [VX - (X - CAMX) * F / d, VY + (FL - Y) * F / d, d]; };

  function chaseWorld(ctx, t, zc, opt) {
    A.drawDataTunnel(ctx, t, { z: -zc * 1.0 + 40, speed: 0.4, jam: 0.9 });
    const bz = RZ(t), bx = RX(t), items = [];
    for (const p of PK) { const d = zc - p.Z; if (d > 0.3 && d < 20) items.push({ d, p }); }
    items.push({ d: zc - CATZ, cat: true });
    items.push({ d: zc - bz - 0.01, bit: true });
    items.sort((a, b) => b.d - a.d);
    const close = smooth(36.55, 36.85, t);
    for (const it of items) {
      if (it.bit) { const [x, y, d] = projR(bx, RY(t), bz, zc); opt.bit(x, y, BTS / d, d); continue; }
      if (it.cat) { const [x, y, d] = projR(CATX, 0, CATZ, zc); if (d > 0.5) drawCatBack(ctx, x, y, CTS / d, t); continue; }
      const p = it.p;
      let dx = 0, sq = 0, rot = 0;
      if (p.brand === 'ILVIP' && p.r === 9) dx = 0.07 * close;
      if (p.brand === 'EMBY' && p.r === 9) dx = -0.07 * close;
      // shoves around Bit when he pushes / bonks
      const dz = Math.abs(p.Z - bz), side = Math.sign(p.X - bx) || 1;
      if (dz < 0.5 && Math.abs(p.X - bx) < 0.5) { const k = (1 - dz / 0.5) * (STUCK(t) ? 1 : 0.4); dx += side * 0.07 * k; sq += 0.16 * k + rpop(t) * Math.sin(t * 40) * 0.05; rot = side * 0.08 * k; }
      if (t > BONK && t < BONK + 0.5 && p.r === 28 && p.li <= 3) { const u = t - BONK; sq += Math.exp(-u * 10) * Math.sin(u * 40) * 0.12; }
      const d = zc - p.Z, [x, y] = projR(p.X + dx, 0, p.Z, zc), sc = PKS / d;
      const fog = clamp(1 - (d - 6) / 13) * clamp((d - 0.3) / 0.25);
      if (fog <= 0.02) continue;
      // turn around to see who's coming, turn back once he's past
      const ahead = bz - p.Z, near = Math.abs(p.X - bx) < 0.95;
      let k = Math.abs(p.X - bx) < 0.5 && H(p.seed * 1.9) < 0.75 ? smooth(1.5, 0.8, ahead) * (1 - smooth(0.05, -0.45, ahead)) : 0;
      if (p.vault) k = smooth(16.9, 16.5, bz) * (1 - smooth(15.3, 15.0, bz));
      if (p.brand === 'ILVIP' || p.brand === 'EMBY') k = 0;
      let honk = 0; for (const [li, r, t0] of CH_HONKS) if (p.li === li && p.r === r) honk = Math.max(honk, smooth(t0 - 0.04, t0 + 0.05, t) * (1 - smooth(t0 + 0.26, t0 + 0.45, t)));
      if (honk > 0) k = Math.max(k, 1);
      ctx.save(); ctx.globalAlpha = fog;
      if (d > 1.2 && d < 9) A.glow(ctx, x, y - sc * 30, sc * 80, 'rgba(255,36,60,1)', 0.12 * fog);
      if (k <= 0.001) drawPkBack(ctx, p, x, y, sc, t, { squash: sq, rot });
      else turnDraw(ctx, x, k, () => drawPkBack(ctx, p, x, y, sc, t, { squash: sq, rot }), () => {
        const shock = ahead < 0.9 && ahead > -0.4, look = [(bx - p.X) * -0.8, 0.35];
        if (p.brand) drawBrand(ctx, x, y, sc, { t, brand: p.brand, seed: p.seed, mood: shock ? 'shock' : 'grumpy', spinner: 0, mouth: honk * 0.8, look, rot, squash: sq, glow: 0.5 });
        else A.drawPacket(ctx, x, y, sc, { t, seed: p.seed, kind: p.kind, mood: shock ? 'shock' : 'annoyed', honk, look, rot, squash: sq, glow: 0.5 });
      });
      ctx.restore();
    }
  }
  function bitRunBack(ctx, x, y, sc, t) {
    const stuck = STUCK(t), pk = rpop(t), bonk = t > BONK ? Math.exp(-(t - BONK) * 7) : 0;
    const vx = (RX(t + 0.03) - RX(t - 0.03)) / 0.06;
    drawBitBack(ctx, x, y, sc, {
      t, run: stuck ? 0.25 : 1, stuck, phase: t * Math.PI * 2 * (stuck ? 7 : 3.8),
      squash: (stuck ? -0.22 + 0.04 * Math.sin(t * 30) : 0) - 0.25 * pk + 0.25 * bonk * Math.sin((t - BONK) * 30),
      rot: clamp(-vx * 0.25, -0.25, 0.25) + (bonk > 0.05 ? -0.15 * bonk : 0), hop: 16 * pk + (RY(t) > 0 ? RY(t) * 0 : 0), glow: 1.3,
      legsUp: RY(t) > 0.05,
    });
    if (pk > 0.05 || (bonk > 0.2 && t < BONK + 0.3)) { // pop / bonk sparkle
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = (1 - Math.max(pk, bonk)) * 90 * sc + 40 * sc; A.glow(ctx, x + Math.cos(a) * r, y - 80 * sc + Math.sin(a) * r * 0.7, 18 * sc, '#fff1b0', 0.8 * Math.max(pk, bonk)); }
      ctx.restore();
    }
  }
  function chaseShot(ctx, t, style) {
    const bz = RZ(t), bx = RX(t);
    const lag = style === 'low' ? 0.12 : 0.16;
    const zc = RZ(t - lag) + (style === 'low' ? 0.62 : 0.66);
    CAMX = RX(t - lag - 0.05) + (style === 'low' ? 0.16 : 0.06);
    const [bxs, bys] = projR(bx, 0, bz, zc);
    const bob = Math.sin(t * Math.PI * 2 * 3.8) * 5, lat = (RX(t - 0.1) - RX(t - 0.2)) / 0.1;
    const bonk = t > BONK ? Math.exp(-(t - BONK) * 9) : 0, pop = rpop(t);
    const end = smooth(36.55, 36.95, t);
    const cam = clampCam({ x: lerp(960, bxs, 0.6) + (style === 'low' ? 70 : 0), y: lerp(540, bys - 150, 0.75) + bob - end * 30,
      zoom: (style === 'low' ? 1.12 : 1.1) + end * 0.15, rot: lat * 0.08 + Math.sin(t * 3.8 * Math.PI) * 0.004, shake: bonk * 1.6 + pop * 0.8 + (STUCK(t) ? 0.25 : 0), t });
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    chaseWorld(ctx, t, zc, { bit: (x, y, sc) => bitRunBack(ctx, x, y, sc, t) });
    if (t > BONK && t < BONK + 0.22) { // BONK star on the LAGTV's back
      const [x, y] = projR(0.4, 0.2, 23.05, zc), u = inv(BONK, BONK + 0.22, t);
      ctx.save(); ctx.translate(x, y); ctx.scale(0.7 + 0.6 * u, 0.7 + 0.6 * u); ctx.globalAlpha = 1 - u;
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 22 : 56, a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      A.fillStroke(ctx, '#fff3a0', 4); A.text(ctx, 'BONK', 0, 2, { font: '400 30px Bangers', fill: '#e8344e', stroke: A.OUTLINE, lw: 4 }); ctx.restore();
    }
    ctx.restore();
    speedLines(ctx, t, 960, 470, STUCK(t) ? 0 : 0.35 + 0.25 * smooth(35.2, 36.3, t), 40);
  }

  // --- side tracking shot 31.4 to 33.2: parallax past the queue, hop over a LOADING+ that backs into his path
  const sideBg = () => A.layer('s4-side-bg', 1920, 1080, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#070a26'], [0.55, '#141046'], [0.8, '#2a0c30'], [1, '#12061a']]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const y = 80 + i * 62; g.strokeStyle = i % 3 ? 'rgba(41,240,255,0.10)' : 'rgba(255,63,164,0.14)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = A.linear(g, 0, 700, 0, 1080, [[0, 'rgba(255,40,70,0)'], [1, 'rgba(255,40,70,0.18)']]); g.fillRect(0, 700, w, 380);
  });
  const LWX = 150 + 6 * 300 + H(46) * 50;
  const SBX = t => key(t, [[31.4, 0], [32.3, LWX - 330, 'lin'], [32.7, LWX + 330, 'lin'], [33.2, LWX + 1130, 'lin']]);
  const SBY = t => key(t, [[32.3, 0], [32.5, 200, 'out'], [32.7, 0, 'in']]);
  function sideShot(ctx, t) {
    const bx = SBX(t), camx = SBX(t - 0.12) + 160, G = 770;
    ctx.drawImage(sideBg(), 0, 0);
    const scr = (wx, par) => 960 + (wx - camx) * par;
    // tunnel ribs (vertical light bands) at two depths
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [par, sp, col, wdt] of [[0.45, 380, '41,240,255', 10], [0.8, 560, '255,63,164', 18]]) {
      const off = ((camx * par) % sp + sp) % sp;
      for (let x = -off; x < 1920 + sp; x += sp) { ctx.fillStyle = A.linear(ctx, 0, 60, 0, 900, [[0, `rgba(${col},0)`], [0.5, `rgba(${col},0.22)`], [1, `rgba(${col},0.05)`]]); ctx.fillRect(x, 60, wdt, 840); A.glow(ctx, x + wdt / 2, 150 + (par * 100), 40, `rgba(${col},1)`, 0.3); }
    }
    ctx.restore();
    // floor strip + lane dashes
    ctx.fillStyle = A.linear(ctx, 0, G, 0, 1080, [[0, '#24123f'], [1, '#0c0618']]); ctx.fillRect(0, G - 6, 1920, 400);
    ctx.fillStyle = 'rgba(41,240,255,0.5)'; const doff = ((camx) % 160 + 160) % 160; for (let x = -doff; x < 1920; x += 160) ctx.fillRect(x, G + 110, 80, 6);
    ctx.fillStyle = 'rgba(255,63,164,0.6)'; ctx.fillRect(0, G - 6, 1920, 3);
    // far lane (small, parallax 0.6)
    for (let i = 0; i < 22; i++) {
      const wx = i * 230 + H(i) * 60, x = scr(wx, 0.6); if (x < -150 || x > 2070) continue;
      ctx.save(); ctx.globalAlpha = 0.75; A.glow(ctx, x - 30, G - 110, 40, 'rgba(255,40,60,1)', 0.25);
      if (H(i * 3) < 0.35) drawBrand(ctx, x, G - 75, 1.0, { t, brand: BRANDS[1 + (i % 3)], seed: 60 + i, mood: 'sleepy', mouth: 0, look: [0.8, 0], glow: 0.3 });
      else A.drawPacket(ctx, x, G - 75, 1.05, { t, seed: 60 + i, mood: H(i * 7) < 0.4 ? 'sleep' : 'bored', look: [0.8, 0], noZ: false });
      ctx.restore();
    }
    // main lane (the queue Bit runs along)
    for (let i = 0; i < 14; i++) {
      const wx = 150 + i * 300 + H(i + 40) * 50, x = scr(wx, 1); if (x < -250 || x > 2170) continue;
      const rel = bx - wx; // >0 once he's past
      const react = smooth(-260, -80, rel) * (1 - smooth(300, 700, rel));
      const spike = Math.exp(-Math.abs(rel) / 120);
      const brand = i === 6 ? 'LOADING+' : i % 4 === 1 ? 'LAGTV' : i % 5 === 3 ? 'EMBY' : null;
      const look = react > 0.1 ? [rel < 0 ? -1 : 1, -0.2] : [0.9, 0.05];
      const hk = (i === 3 || i === 8 || i === 11) ? smooth(150, 200, rel) * (1 - smooth(420, 520, rel)) : 0;
      let dx = 0, hop = 0;
      if (i === 6) continue; // LOADING+ is drawn stepping into Bit's lane below // LOADING+ backs into his path
      const y = G + 10, sc = 1.9;
      A.glow(ctx, x - 50, y - 60, 70, 'rgba(255,40,60,1)', 0.25);
      ctx.save(); ctx.translate(dx, 0);
      if (brand) drawBrand(ctx, x, y, sc, { t, brand, seed: 80 + i, mood: spike > 0.5 && react > 0.2 ? 'shock' : brand === 'LOADING+' ? 'grumpy' : 'sleepy', spinner: brand === 'LOADING+' ? 1 : 0, mouth: hk * 0.8, look, rot: -0.12 * spike * react });
      else {
        A.drawPacket(ctx, x, y, sc, { t, seed: 80 + i, kind: KINDS[i % 6], mood: spike > 0.5 && react > 0.2 ? 'shock' : react > 0.2 ? 'annoyed' : (i % 3 ? 'bored' : 'sleep'), honk: hk, look, rot: -0.12 * spike * react });
        if (i % 3 === 2) drawProp(ctx, { prop: 'paper', seed: 80 + i }, x, y, sc, t, spike * react);
        if (i === 4 || i === 10) drawProp(ctx, { prop: 'watch', seed: 80 + i }, x, y, sc, t, 0);
      }
      ctx.restore();
    }
    { // LOADING+ backs out of line right into Bit's path; he vaults it
      const k = smooth(31.85, 32.15, t), x = scr(LWX, 1), y = lerp(G + 10, G + 64, k), sc = lerp(1.9, 2.05, k);
      const rel = SBX(t) - LWX, shock = smooth(-200, -60, rel) * (1 - smooth(250, 450, rel));
      A.glow(ctx, x - 50, y - 60, 70, 'rgba(255,40,60,1)', 0.25);
      drawBrand(ctx, x, y, sc, { t, brand: 'LOADING+', seed: 86, mood: shock > 0.3 ? 'shock' : 'grumpy', spinner: 1, mouth: 0, look: shock > 0.3 ? [0, -1] : [0.9, 0], rot: -0.1 * shock, squash: -0.15 * shock });
    }
    // Bit (in the plane in front of the queue)
    const bxS = scr(bx, 1), hop = SBY(t);
    const pts = []; for (let i = 16; i >= 0; i--) { const tt = t - i * 0.02; pts.push([scr(SBX(tt), 1) - 40, G - 50 - SBY(tt)]); }
    A.drawBinaryTrail(ctx, pts, t, { width: 26, size: 16, alpha: 0.6 });
    const air = hop > 2;
    A.drawBit(ctx, bxS, G + 70 - hop, 1.9, { t, mood: 'determined', limbs: air ? 'fly' : 'run', runRate: 4.6, phase: t * Math.PI * 2 * 4.6, vel: air ? [1300, (SBY(t - 0.02) - SBY(t + 0.02)) * 25] : [1300, 0], shadow: air ? 0 : 1, glow: 1.4,
      armR: !air && t > 31.6 && t < 32.2 ? [84, -150 + Math.sin(t * 20) * 8] : undefined, squash: t > 32.68 && t < 32.8 ? 0.2 : 0 });
    // foreground out-of-focus commuters whipping past (parallax 1.7): soft dark shapes (cheap bokeh)
    for (let i = 0; i < 8; i++) { const wx = i * 420 + H(i + 9) * 100, x = scr(wx, 1.7); if (x < -400 || x > 2320) continue;
      const c = A.PACKET_COLORS[KINDS[i % 6]].d;
      ctx.fillStyle = A.radial(ctx, x, 1150, 60, 260, [[0, A.mixc(c, '#0a0618', 0.55)], [0.7, A.mixc(c, '#0a0618', 0.7)], [1, 'rgba(10,6,24,0)']]);
      A.ellipse(ctx, x, 1150, 250, 200); ctx.fill(); }
    // horizontal speed streaks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const y = 100 + H(i) * 900, len = 200 + H(i + 2) * 300, x = 1920 - ((t * (1800 + H(i + 5) * 1200) + H(i + 7) * 3000) % 2600);
      ctx.fillStyle = A.linear(ctx, x, 0, x + len, 0, [[0, 'rgba(255,230,170,0)'], [1, 'rgba(255,230,170,0.35)']]); ctx.fillRect(x, y, len, 2); }
    ctx.restore();
  }

  // --- front low-angle vault 33.2 to 33.9: over a snoozer, toward camera
  function vaultShot(ctx, t) {
    const zc = lerp(13.75, 14.05, inv(33.2, 33.9, t)), bz = RZ(t), bx = RX(t), by = RY(t);
    CAMX = 0.18;
    const [x0, y0] = proj(bx, by, bz, zc);
    const u = inv(33.2, 33.9, t);
    const cam = clampCam({ x: lerp(1010, x0, 0.4), y: lerp(610, y0 - 100, 0.35), zoom: lerp(1.35, 1.5, u), rot: -0.06 + 0.04 * u, shake: t > 33.86 ? Math.exp(-(t - 33.86) * 12) * 1.5 : 0, t });
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.9, cat: false, sign: false, near: 0.8,
      bit: { X: bx, Y: by, Z: bz, draw: (c, x, y, sc) => {
        const air = by > 0.02;
        const pts = []; for (let i = 14; i >= 0; i--) { const tt = t - i * 0.025; const [px, py, d] = proj(RX(tt), RY(tt) + 0.14, RZ(tt), zc); if (d > 0.3) pts.push([px, py]); }
        A.drawBinaryTrail(c, pts, t, { width: 30 * sc, size: Math.max(12, 16 * sc), alpha: 0.8 });
        A.drawBit(c, x, y, sc, { t, mood: air ? 'joy' : 'determined', joyEyes: 'open', limbs: air ? 'arms-up' : 'run', runRate: 4.4, phase: t * Math.PI * 2 * 4.4, glow: 1.6, shadow: air ? 0 : 1, squash: t > 33.84 ? 0.22 : air ? -0.12 : 0, vel: air ? [0, (RY(t - 0.02) - RY(t + 0.02)) * 1500] : [0, 0] });
      } },
      pkO: p => {
        if (p.vault) { const k = smooth(33.3, 33.45, t); return { mood: k > 0.3 ? 'shock' : 'sleep', look: [0.1, -1], squash: -0.2 * k * (1 - smooth(33.7, 33.9, t)) }; }
        const dz = Math.abs(p.Z - bz); if (dz < 1.6 && Math.abs(p.X - bx) < 1.0) return { mood: 'shock', look: [(bx - p.X) * 0.8, -0.6] };
        return {};
      },
    });
    ctx.restore();
    speedLines(ctx, t, 960, 470, 0.5, 40);
  }

  // --- v7 CAT: talks from inside the queue. C1 over-Bit's-shoulder (old 36.96-38.3), C2 two-shot (old 38.3-39.6)
  function shotC(ctx, t) {
    const catO = () => {
      const lookK = smooth(36.95, 37.3, t);
      return { mood: t > 38.35 && t < 39.3 ? 'grumpy' : 'bored', arms: t > 37.4 && t < 38.1 ? 'point' : 'crossed', look: [lerp(-0.4, 0.55, lookK), lerp(0, 0.55, lookK)],
        rot: 0.03 * Math.sin(t * 1.2), lid: t > 39.3 ? 0.12 : 0, browRaise: t > 38.95 && t < 39.35 ? 6 : 0 };
    };
    const around = p => { // neighbours rubberneck at the confrontation
      if (Math.abs(p.Z - CATZ) < 2.2) return { look: [clamp((0.3 - p.X) * 0.9, -1, 1), 0.1], mood: H(p.seed) < 0.5 ? 'bored' : 'annoyed' };
      return {};
    };
    if (t < 38.3) { // C1: over Bit's shoulder, cat at normal size in the crowd
      const u = inv(36.96, 38.3, t), zc = lerp(5.56, 5.64, ease.inOut(u));
      CAMX = 0.36;
      const BZC = 6.06, BXC = 0.64;
      const cam = clampCam({ x: lerp(1070, 1090, u), y: lerp(770, 750, ease.inOut(u)), zoom: lerp(1.18, 1.26, ease.inOut(u)), rot: 0.012, t });
      ctx.save(); fillBase(ctx); A.camera(ctx, cam);
      jamWorld(ctx, t, zc, {
        jam: 0.9, near: 0.75, sign: true,
        bit: { X: BXC, Y: 0.12, Z: BZC, draw: (c, x, y, sc) => drawBitBack(c, x, y, sc, { t, noShadow: true, run: 0, phase: 0, squash: 0.03 * Math.sin(t * 3), rot: -0.05 + (t > 37.4 && t < 38.1 ? -0.05 : 0), glow: 1.2, tagLift: -0.3 }) },
        catO, pkO: around,
      });
      ctx.restore();
    } else { // C2: two-shot, Bit looks up at the big guy
      const u = inv(38.3, 39.6, t), zc = lerp(5.05, 5.15, ease.inOut(u));
      CAMX = 0.3;
      const cam = clampCam({ x: lerp(975, 990, u), y: 555, zoom: lerp(1.66, 1.76, ease.inOut(u)), rot: -0.01, t });
      ctx.save(); fillBase(ctx); A.camera(ctx, cam);
      jamWorld(ctx, t, zc, {
        jam: 0.9, near: 0.75, sign: true,
        bit: { X: 0.72, Y: 0, Z: 6.92, draw: (c, x, y, sc) => A.drawBit(c, x, y, sc, { t, mood: t < 39.15 ? 'panic' : 'determined', look: [-0.75, -0.8], shadow: 1, mouth: 0, glow: 1.3, sweat: t < 39.1 ? 1 : 0, limbs: 'stand', squash: t > 39.3 ? 0.1 * smooth(39.3, 39.6, t) : 0.03 * Math.sin(t * 20), browL: t > 39.15 ? -4 : 0, browR: t > 39.15 ? -4 : 0 }) },
        catO, pkO: p => Object.assign(around(p), p.li === 4 && p.r === 8 ? { honk: smooth(39.34, 39.4, t) * (1 - smooth(39.55, 39.6, t)) } : {}),
      });
      ctx.restore();
    }
  }
  // --- shot D: Bit close-up, "Sorry! GOTV doesn't wait in line!"
  function shotD(ctx, t) {
    const u = inv(39.6, 41.45, t);
    const zoom = lerp(1.0, 1.14, ease.inOut(u)), sh = smooth(41.2, 41.45, t) * 0.6;
    ctx.save();
    ctx.drawImage(bokeh(), -190 - u * 80, -110 - u * 25);
    A.glow(ctx, -80, 560, 620, 'rgba(171,156,192,0.9)', 0.55);
    ctx.fillStyle = A.radial(ctx, -160, 600, 200, 560, [[0, 'rgba(120,105,150,0.85)'], [1, 'rgba(120,105,150,0)']]); ctx.fillRect(0, 0, 700, 1080);
    A.camera(ctx, { x: 960, y: 560, zoom, shake: sh, t });
    const charge = smooth(40.7, 41.45, t);
    A.glow(ctx, 960, 560, 520, '#ffc93c', 0.18 + 0.35 * charge);
    const crouch = smooth(41.25, 41.45, t);
    const sorry = t > 39.7 && t < 40.05, gotv = t >= 40.0 && t < 40.35;
    const o = {
      t, mood: 'determined', glow: 1.2 + 0.7 * charge, look: t < 39.72 ? [-0.5, -0.45] : [0.05, -0.05],
      limbs: crouch > 0.3 ? 'crouch' : 'stand', squash: 0.12 * crouch, browL: -3, browR: -3,
      boost: 0.18 * charge, sparkle: Math.max(charge, gotv ? 1 : 0), trail: 0, rot: -0.02 + 0.02 * Math.sin(t * 2),
    };
    if (sorry) { const s = ease.outBack(inv(39.7, 39.85, t)); Object.assign(o, { mood: 'cheeky', browL: 6, browR: 6, armL: [-86, -60 - 40 * s], armR: [86, -60 - 40 * s], rot: 0.06 * s, look: [0.2, -0.05] }); }
    else if (gotv) Object.assign(o, { mood: 'cheeky', armR: [22, -64], armL: [-64, -40], look: [0.1, -0.05] }); // hand on heart: that's me
    else if (t > 40.35 && t < 41.25) Object.assign(o, { mood: t < 40.9 ? 'cheeky' : 'determined', look: [0.05, -0.05] });
    A.drawBit(ctx, 960, 960 + crouch * 14, 5.4, o);
    ctx.restore();
    // "GOTV" brand pop beside him on the word
    const gp = smooth(39.98, 40.1, t) * (1 - smooth(40.75, 40.95, t));
    if (gp > 0) {
      const s = ease.outBack(clamp(inv(39.98, 40.16, t)));
      ctx.save(); ctx.translate(1470, 300); ctx.rotate(0.08); ctx.globalAlpha = gp;
      A.glow(ctx, 0, 0, 240, '#ffc93c', 0.5);
      if (A.drawGOTVBug) A.drawGOTVBug(ctx, 0, 0, 2.2 * s, { alpha: gp, t });
      else { ctx.scale(s, s); A.text(ctx, 'GOTV', 0, 0, { font: '900 110px Rubik', fill: '#ffd21f', stroke: '#1f4fbf', lw: 14 }); }
      ctx.restore();
    }
    if (charge > 0.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,150,${0.8 * charge})`; ctx.lineWidth = 3;
      const fr = Math.floor(t * 20);
      for (let i = 0; i < 5; i++) {
        const a = H(fr * 3 + i) * Math.PI * 2, r0 = 380 + H(fr + i * 7) * 60;
        ctx.beginPath(); let x = 960 + Math.cos(a) * r0, y = 600 + Math.sin(a) * r0 * 0.8; ctx.moveTo(x, y);
        for (let q = 0; q < 4; q++) { x += Math.cos(a) * 30 + (H(fr * 11 + i * 5 + q) - 0.5) * 50; y += Math.sin(a) * 30 + (H(fr * 13 + i + q) - 0.5) * 50; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- shot E: BOOST over the whole queue
  const E0 = 41.5, E1 = 42.7;
  function bitE(t) {
    if (t < E0) return { X: 0.72, Y: 0, Z: 6.92 };
    const u = inv(E0, E1, t);
    const Z = lerp(6.92, 0.1, Math.pow(u, 1.2));
    const Y = 1.0 * Math.sin(Math.min(1, u * 2.1) * Math.PI * 0.5) - 0.42 * smooth(0.45, 0.9, u);
    const X = lerp(0.72, 0.1, ease.inOut(u));
    return { X, Y: Math.max(0, Y), Z };
  }
  function shotE(ctx, t) {
    const zc = key(t, [[41.45, 5.05], [41.52, 5.1], [42.18, 1.7, 'inOut'], [42.7, 0.0, 'lin']]);
    CAMX = lerp(0.5, 0.05, smooth(41.5, 42.18, t));
    const launch = t >= E0;
    const b = bitE(t);
    const sh = launch ? Math.exp(-(t - E0) * 3) * 1.6 + 0.3 : 0;
    const [bx0, by0] = proj(b.X, b.Y, b.Z, zc);
    const cam = clampCam({ x: lerp(1080, 960 + (bx0 - 960) * 0.35, smooth(41.5, 42.0, t)), y: lerp(640, by0 + 60, smooth(41.52, 41.9, t) * 0.6), zoom: key(t, [[41.45, 1.3], [41.5, 1.34], [42.0, 1.08, 'out'], [42.7, 1.12]]), shake: sh, t });
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    const trail = [];
    if (launch) for (let i = 22; i >= 0; i--) { const tt = Math.max(E0, t - i * 0.025), p = bitE(tt); const [x, y, d] = proj(p.X, p.Y + 0.14, p.Z, zc); if (d > 0.3) trail.push([x, y]); }
    jamWorld(ctx, t, zc, {
      jam: 0.95, near: 0.6,
      bit: { X: b.X, Y: b.Y, Z: b.Z, draw: (c, x, y, sc) => {
        if (trail.length > 2) A.drawBinaryTrail(c, trail, t, { width: 30 * sc * 1.4, size: Math.max(12, 18 * sc), alpha: 0.95 });
        const pre = !launch, crouch = pre ? smooth(41.45, 41.5, t) : 0;
        const nx = bitE(t + 0.02), [x2, y2] = proj(nx.X, nx.Y, nx.Z, zc);
        const vel = launch ? [(x2 - x) / 0.02, (y2 - y) / 0.02] : [0, 0];
        const spd = Math.hypot(vel[0], vel[1]); if (spd > 2600) { vel[0] *= 2600 / spd; vel[1] *= 2600 / spd; }
        A.drawBit(c, x, y, sc, { t, mood: 'determined', glow: 1.8, shadow: pre ? 1 : 0, limbs: pre ? 'crouch' : 'fly', squash: pre ? 0.25 * crouch : 0, boost: launch ? 1 : 0.3 * crouch, vel });
      } },
      catO: () => {
        const s = smooth(41.62, 41.9, t);
        return { mood: t > 41.56 ? 'shock' : 'bored', shades: ease.outBounce(clamp(inv(41.62, 41.95, t))), look: [0.3, -0.9 * s + 0.2], squash: t > 41.52 && t < 41.7 ? -0.08 : 0, arms: t > 41.56 ? 'down' : 'crossed' };
      },
      pkO: p => {
        if (!launch) return shoveO(p, t);
        const delay = 0.06 + Math.abs(p.Z - CATZ) * 0.05 + H(p.seed) * 0.08;
        const k = smooth(E0 + delay, E0 + delay + 0.08, t);
        if (k <= 0) return {};
        const [px, py] = proj(p.X, 0.15, p.Z, zc), [qx, qy] = proj(b.X, b.Y, b.Z, zc);
        const dx = qx - px, dy = qy - py - 200, n = Math.hypot(dx, dy) || 1;
        const jump = Math.exp(-Math.max(0, t - E0 - delay) * 6) * Math.sin(Math.max(0, t - E0 - delay) * 20);
        return { mood: 'shock', bmood: 'shock', spinner: 0, look: [dx / n, dy / n], squash: -0.1 * k + 0.08 * jump, y: 0.02 * Math.max(0, jump) };
      },
    });
    ctx.restore();
    if (launch && t < 41.9) {
      const u = inv(E0, 41.9, t);
      const [px, py] = proj(0.72, 0, CATZ, 5.05);
      const sx = 960 + (px - cam.x) * cam.zoom, sy = 540 + (py - cam.y) * cam.zoom;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,220,130,${0.8 * (1 - u)})`; ctx.lineWidth = 10 * (1 - u) + 2;
      A.ellipse(ctx, sx, sy, 40 + u * 700, 12 + u * 160); ctx.stroke();
      ctx.fillStyle = `rgba(255,240,200,${0.2 * Math.max(0, 1 - u * 6)})`; ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    }
    speedLines(ctx, t, 960, 470, smooth(42.15, 42.7, t), 60);
    const pass = smooth(42.58, 42.7, t);
    if (pass > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,110,${0.75 * pass})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  // --- shot F: open fibre, streak to the vanishing point
  function shotF(ctx, t) {
    const u = inv(42.7, 43.4, t);
    const zc = 60 + ease.in(u) * 14 + u * 10;
    A.drawDataTunnel(ctx, t, { z: zc, speed: lerp(4, 9, u), jam: 0.3 * (1 - smooth(0, 0.25, u)) });
    speedLines(ctx, t, 960, 470, 1, 90);
    const dOf = uu => 0.6 * Math.exp(Math.pow(uu, 1.6) * Math.log(28));
    const d = dOf(u);
    const X = lerp(0.16, 0, u), Y = lerp(0.85, 0.62, ease.out(u));
    const x = VX + X * F / d, y = VY + (FL - Y) * F / d, sc = BTS / d;
    const trail = [];
    for (let i = 24; i >= 0; i--) { const uu = Math.max(0, u - i * 0.02), dd = dOf(uu), XX = lerp(0.16, 0, uu), YY = lerp(0.85, 0.62, ease.out(uu)); trail.push([VX + XX * F / dd, VY + (FL - YY) * F / dd + 60 * BTS / dd]); }
    trail.unshift([trail[0][0] + 80, 1180]);
    A.drawBinaryTrail(ctx, trail, t, { width: 40, size: 22 });
    const dirx = VX - x, diry = VY - y, n = Math.hypot(dirx, diry) || 1;
    A.glow(ctx, x, y - 60 * sc, 300 * sc + 60, '#ffc93c', 0.7);
    A.drawBit(ctx, x, y, sc, { t, mood: 'determined', glow: 2, boost: 1, limbs: 'fly', vel: [dirx / n * 2000, diry / n * 2000], trail: 1.3 });
    const st = smooth(0.55, 1, u);
    if (st > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, VX, VY, 60 + 240 * st, '#fff2c0', 0.9 * st);
      ctx.fillStyle = A.linear(ctx, VX - 900, 0, VX + 900, 0, [[0, 'rgba(255,230,160,0)'], [0.5, `rgba(255,250,230,${0.9 * st})`], [1, 'rgba(255,230,160,0)']]);
      ctx.fillRect(VX - 900, VY - 3 - 3 * st, 1800, 6 + 6 * st);
      ctx.restore();
    }
    const fl = 1 - smooth(42.7, 42.8, t);
    if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,250,255,${0.35 * fl})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  // old-base shots (written for the v2 timing) played 5.0 s later: lipsync follows via A._shift
  function oldDraw(ctx, tt) {
    if (tt < 36.96) shotB(ctx, tt);
    else if (tt < 39.6) shotC(ctx, tt);
    else if (tt < 41.45) shotD(ctx, tt);
    else if (tt < 42.7) shotE(ctx, tt);
    else shotF(ctx, tt);
  }
  A.scene({
    name: 's4_jam', start: 29.2, end: 48.4,
    draw(ctx, s) {
      const t = s.t;
      if (t < 31.4) chaseShot(ctx, t, 'low');
      else if (t < 33.2) sideShot(ctx, t);
      else if (t < 33.9) vaultShot(ctx, t);
      else if (t < 36.95) chaseShot(ctx, t, 'wide');
      else { const sh = A._shift; A._shift = sh + 5; try { oldDraw(ctx, t - 5); } finally { A._shift = sh; } }
      hud(ctx, t);
      // white-gold flash out of the GOTV LED dive
      const fa = 1 - ease.out(inv(29.2, 29.5, t));
      if (fa > 0) {
        ctx.save(); ctx.fillStyle = `rgba(255,248,222,${fa})`; ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 960, 470, 1200, 'rgba(255,201,60,1)', fa * 0.8); ctx.restore();
      }
    },
  });
})();
