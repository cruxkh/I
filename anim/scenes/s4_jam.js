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
    const path = (li === 3 || li === 4) && r >= 7 && r <= 13; // rows beside Bit's path: aligned, no jitter
    if (li === 2 && r === 8) continue; // Catpacket's spot
    if (H(seed * 1.7) < 0.07 && !path && r > 2) continue; // occasional gap
    let X = lane + (path ? 0 : (H(seed * 3.1) - 0.5) * 0.12), Z = ROW(r) + (path ? 0 : (H(seed * 5.3) - 0.5) * 0.3) + (li % 2 ? 0.12 : 0);
    if (path && li === 3) X = 0.64;
    if (path && li === 4) X = 1.19;
    if (r === 7 && li === 3) continue; // gap: sightline to the wedge
    if (r === 8 && li === 3) X = 0.98;
    if (r === 8 && li === 4) X = 1.3;  // squeezed aside by the cat
    if (r === 8 && li === 1) X = -0.74;
    const m = H(seed * 9.9);
    let brand = null;
    if (li === 3 && r === 9) brand = 'ILVIP'; else if (li === 4 && r === 9) brand = 'EMBY';
    else if (li === 4 && r === 10) brand = 'LOADING+'; else if (li === 3 && r === 8) brand = 'LAGTV';
    else if (r >= 6 && r <= 22 && !path && H(seed * 4.4) < 0.3) brand = BRANDS[Math.floor(H(seed * 6.6) * 4) % 4];
    PK.push({ X, Z, seed, r, li, brand, kind: KINDS[Math.floor(H(seed * 2.3) * 6) % 6], mood: m < 0.18 ? 'sleep' : m < 0.36 ? 'annoyed' : 'bored' });
  }
  const pk = (li, r) => PK.find(p => p.li === li && p.r === r);
  // honk pops (synced to the cue sheets)
  const HONKS = [
    [pk(4, 2), 29.59], [pk(0, 3), 29.95], [pk(4, 11), 30.15], [pk(3, 10), 30.82], [pk(3, 11), 31.9],
    [pk(2, 9), 36.6], [pk(2, 10), 36.3],
  ];
  const honkAmt = (p, t) => { let h = 0; for (const [q, t0] of HONKS) if (q === p) h = Math.max(h, smooth(t0 - 0.04, t0 + 0.05, t) * (1 - smooth(t0 + 0.24, t0 + 0.42, t))); return h; };

  // ---------------------------------------------------------------- Bit's path through the jam (shot B)
  const BZ = [[29.2, 9.9], [30.1, 9.78], [30.42, 9.6, 'inOut'], [30.56, 9.12, 'out'], [31.28, 8.84, 'inOut'], [31.58, 8.72, 'inOut'],
    [31.72, 8.3, 'out'], [32.25, 7.84, 'inOut'], [36.2, 7.8], [36.44, 7.72, 'inOut'], [36.56, 7.4, 'out'], [36.78, 6.95, 'in'], [36.85, 6.92, 'out']];
  const bitZ = t => key(t, BZ);
  const bitX = t => key(t, [[36.45, 0.915], [36.78, 0.72, 'inOut']]);
  const POPS = [30.47, 31.64, 36.5];
  const pushing = t => (t > 30.1 && t < 30.47) || (t > 31.3 && t < 31.64) || (t > 36.2 && t < 36.5);
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
        mouth: o.mouth ?? A.mouth(p.brand, t), look: o.look, rot: o.rot || 0, squash: o.squash || 0, glow: 0.45 + 0.3 * fog };
      drawBrand(ctx, x, y, sc, bo);
      ctx.restore(); return;
    }
    const honk = o.honk != null ? o.honk : honkAmt(p, t);
    A.drawPacket(ctx, x, y, sc, { t, seed: p.seed, kind: p.kind, mood: o.mood || p.mood, honk, look: o.look, squash: o.squash || 0, rot: o.rot || 0, glow: 0.45 + 0.3 * fog });
    ctx.restore();
    if (d > 6) { // atmospheric haze veil
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
    }
  }

  // competitor packet: props kit when it exists, otherwise a generic packet + brand tag
  function drawBrand(ctx, x, y, sc, o) {
    if (A.drawBrandPacket) { A.drawBrandPacket(ctx, x, y, sc * 0.9, Object.assign({ who: o.brand }, o)); return; }
    const mm = { grumpy: 'annoyed', sleepy: 'sleep', shock: 'shock', panting: 'bored' };
    A.drawPacket(ctx, x, y, sc, { t: o.t, seed: o.seed, kind: 'video', mood: mm[o.mood] || 'bored', mouth: o.mouth, look: o.look, rot: o.rot, squash: o.squash, noZ: true, glow: o.glow });
    ctx.save(); ctx.translate(x, y - 128 * sc); ctx.scale(sc, sc);
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
  const SIGN = { X: 0.915, Y: 0.8, Z: 7.55 };
  function drawSign(ctx, x, y, s, t) {
    const sw = Math.sin(t * 1.3) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(200,210,255,0.6)'; ctx.lineWidth = Math.max(1, 3 * s);
    ctx.beginPath(); ctx.moveTo(-110 * s, -40 * s); ctx.lineTo(-90 * s, -900 * s); ctx.moveTo(110 * s, -40 * s); ctx.lineTo(90 * s, -900 * s); ctx.stroke();
    if (A.drawQueueSign) A.drawQueueSign(ctx, 0, 0, s, { t });
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
    const a = smooth(29.55, 29.8, t);
    if (a <= 0) return;
    let v, col = '#ff3b4f';
    if (t < 42.7) v = 4.2 + Math.max(0, t - 29.8) * 0.92;
    else { const u = inv(42.7, 43.4, t); v = lerp(4.2 + (42.7 - 29.8) * 0.92, 1.3, ease.out(u)); col = A.mixc('#ff3b4f', '#5dff9a', smooth(0, 0.7, u)); }
    const shake = t > 41.5 && t < 42.3 ? (1 - inv(41.5, 42.3, t)) * 5 : 0;
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
    const jit = t > 36.5 && t < 42.7 ? A.noise1(t * 40) * 1.2 : 0;
    A.text(ctx, v.toFixed(1) + 's', 22 + jit, 70, { font: '900 40px Rubik', fill: col, align: 'left' });
    // mini buffer bar
    const bw = 170, fillp = t < 42.7 ? 0.15 + 0.05 * Math.sin(t * 2) : lerp(0.2, 1, smooth(42.7, 43.3, t));
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
      if (it.sign) { const [x, y, d] = proj(SIGN.X, SIGN.Y, SIGN.Z, zc); if (d > 0.4) drawSign(ctx, x, y, 1.1 / d * (opt.signK || 1), t); continue; }
      if (it.cat) {
        const [x, y, d] = proj(opt.catX ?? CATX, 0, CATZ, zc); if (d < 0.35) continue;
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

