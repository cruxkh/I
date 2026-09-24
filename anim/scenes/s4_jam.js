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


  // ---------------------------------------------------------------- Bit's appearance in the jam (A/B/Q)
  function bitJamOpts(t) {
    const push = pushing(t), pk = popK(t), speaking = A.speaking('BIT', t);
    const vz = (bitZ(t + 0.03) - bitZ(t - 0.03)) / 0.06; // units/s (negative = toward camera)
    const o = { t, mood: push ? 'squeeze' : 'determined', shadow: 0.8, glow: 1.25 };
    if (push) { o.limbs = 'push'; o.squash = -0.16 - 0.06 * Math.sin(t * 30); }
    else if (Math.abs(vz) > 0.25) { o.limbs = 'run'; o.vel = [0, 0]; o.runRate = 3.4; o.phase = t * Math.PI * 2 * 3.4; }
    else o.limbs = 'stand';
    if (pk > 0) { o.squash = -0.28 * pk; o.hop = 14 * pk; o.sparkle = pk; }
    if (!push && !(pk > 0) && t > 30.55 && t < 31.25) { o.limbs = 'run'; o.armR = [80, -150]; } // "Live goal!" arm up
    if (t > 31.72 && t < 32.3) { o.armR = [78, -160 + Math.sin(t * 20) * 8]; o.armL = [-66, -100]; }
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
      Object.assign(out, { look: talk ? [0.9, -0.05] : [0.3, 0.1], bmood: 'grumpy', rot: talk ? 0.05 * Math.sin(t * 2.2) + 0.04 : 0, squash: talk ? -0.04 * Math.abs(Math.sin(t * 7)) : 0 });
    }
    if (p.brand === 'EMBY' && t > 32.25 && t < 36.4) Object.assign(out, { look: [-0.4, 0.3], bmood: 'sleepy', rot: -0.06 + 0.02 * Math.sin(t * 1.1) });
    const bz = bitZ(t), bx = bitX(t);
    if (!(p.li === 3 || p.li === 4)) return out;
    const dz = Math.abs(p.Z - bz); if (dz > 0.45) return out;
    const k = (1 - dz / 0.45) * (pushing(t) || t > 36.78 ? 1 : QUEUE(t) ? 0.35 : 0.5);
    const side = Math.sign(p.X - bx) || 1;
    const wob = popK(t) * Math.sin(t * 40) * 0.4;
    return Object.assign({ dx: side * 0.1 * k, squash: 0.18 * k + wob * 0.12, mood: k > 0.3 ? 'annoyed' : undefined, look: [-side * 0.8, 0.2], rot: side * 0.06 * k }, out,
      out.squash != null ? { squash: out.squash + 0.1 * k } : {});
  }

  // ============================================================ SHOTS
  function shotA(ctx, t) {
    const k = t - 8.2; // authored against the v1 21.0 start
    const zc = key(k, [[21.0, -0.6], [21.45, -0.2, 'out'], [21.9, 6.3, 'inOut']]);
    CAMX = 0.9 * smooth(21.2, 21.85, k);
    const bz = bitZ(t), bx = bitX(t);
    const [bxs, bys] = proj(bx, 0, bz, zc);
    const zk = ease.out(inv(21.5, 21.72, k));
    const cam = { x: lerp(960, bxs, zk), y: lerp(540, bys - 50, zk), zoom: key(k, [[21.0, 1.35], [21.4, 1.03, 'out'], [21.5, 1.03], [21.72, 2.9, 'out'], [21.9, 3.1, 'lin']]), rot: 0, t };
    clampCam(cam);
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.95, catX: -0.62,
      bit: { X: bx, Y: 0, Z: bz, draw: (c, x, y, sc) => { A.glow(c, x, y - 70 * sc, 260 * sc, '#ffc93c', 0.5 + 0.3 * Math.sin(t * 6)); const hp = Math.max(0, Math.sin((k - 21.3) * Math.PI * 3.2)) * smooth(21.25, 21.4, k); A.drawBit(c, x, y, sc, Object.assign(bitJamOpts(t), { glow: 1.6, hop: hp * 55, limbs: 'arms-up', mood: 'determined', squash: hp < 0.1 ? 0.12 : -0.08 })); } },
      catO: () => ({ mood: 'bored' }),
      pkO: p => shoveO(p, t),
    });
    ctx.restore();
    const ping = inv(21.66, 21.9, k);
    if (ping > 0 && ping < 1) {
      const [sx, sy] = [960 + (bxs - cam.x) * cam.zoom, 540 + (bys - 25 - cam.y) * cam.zoom];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,220,120,${0.7 * (1 - ping)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy, 70 + ping * 220, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    speedLines(ctx, t, 960, 470, Math.sin(inv(21.48, 21.75, k) * Math.PI) * 0.9, 40);
  }

  // B + Q1 + Q2: the squeeze and the competitor queue (one geography, three setups)
  function shotB(ctx, t) {
    const bz = bitZ(t), bx = bitX(t);
    let zc, cam;
    const bump = t > 36.8 ? Math.exp(-(t - 36.8) * 14) : 0;
    if (t < 32.3) { // B: tracking behind the squeeze
      zc = bitZ(t - 0.18) - 1.28; CAMX = 0.9;
      const [bxs, bys] = proj(bx, 0, bz, zc);
      cam = { x: lerp(960, bxs, 0.75) - 40, y: bys - 190, zoom: 1.3, t };
    } else if (t < 35.0) { // Q1: ILVIP two-shot, slow push
      const u = inv(32.3, 35.0, t);
      zc = lerp(6.42, 6.58, ease.inOut(u)); CAMX = 0.8;
      const [ix, iy] = proj(0.64, 0, ROW(9), zc), [bxs] = proj(bx, 0, bz, zc);
      cam = { x: (ix + bxs) / 2 + 10, y: iy - 170, zoom: lerp(1.42, 1.52, ease.inOut(u)), rot: -0.012, t };
    } else { // Q2: EMBY, then Bit pops out and tracks to the cat
      const u = inv(35.0, 36.2, t), w = smooth(36.2, 36.75, t);
      zc = lerp(6.52, bitZ(t - 0.18) - 1.28, smooth(36.2, 36.4, t)) - 0.1 * w;
      CAMX = lerp(1.08, 0.55, w);
      const [ex, ey] = proj(1.19, 0, ROW(9), zc), [bxs, bys] = proj(bx, 0, bz, zc), cx = proj(0, 0, CATZ, zc)[0];
      cam = { x: lerp((ex + bxs) / 2 - 10, lerp(bxs, cx, 0.35), w), y: lerp(ey - 170, bys - 200, w), zoom: lerp(lerp(1.5, 1.58, u), 1.55, w), rot: 0.012 * (1 - w), shake: bump * 1.4, t };
    }
    clampCam(cam);
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    jamWorld(ctx, t, zc, {
      jam: 0.95,
      bit: { X: bx, Y: 0, Z: bz, draw: (c, x, y, sc) => A.drawBit(c, x, y, sc, bitJamOpts(t)) },
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

  // --- shot C: low-angle Catpacket (authored at v1 times, k = t - 11.8)
  function shotC(ctx, t) {
    const k = t - 11.8, lt = k - 25.0;
    const cam = {
      x: key(k, [[25.0, 1330], [25.15, 1310], [25.85, 960, 'inOut'], [27.95, 930]]),
      y: key(k, [[25.0, 860], [25.15, 850], [25.85, 548, 'inOut'], [27.95, 530]]),
      zoom: key(k, [[25.0, 1.9], [25.15, 1.85], [25.85, 1.02, 'inOut'], [27.95, 1.1]]),
      rot: key(k, [[25.0, 0.0], [25.85, -0.05, 'inOut']]), t,
    };
    ctx.save(); fillBase(ctx); A.camera(ctx, cam);
    ctx.save(); ctx.translate(900, 860); ctx.scale(1.95, 1.95); ctx.translate(-960, -470);
    A.drawDataTunnel(ctx, t, { z: 30 + t * 0.15, speed: 0.1, jam: 0.85 });
    ctx.restore();
    // background queue at the horizon (competitors among them)
    for (let i = 0; i < 9; i++) {
      const x = 900 + (i - 4) * 150 + (H(i) - 0.5) * 40, y = 905 + H(i * 3) * 14, sc = 0.4 + H(i * 5) * 0.1;
      if (Math.abs(x - 880) < 260) continue;
      A.glow(ctx, x, y - 20, 70, 'rgba(255,40,60,1)', 0.18);
      ctx.save(); ctx.globalAlpha = 0.8;
      const hk = i === 7 ? smooth(39.36, 39.42, t) : 0;
      if (i === 1 || i === 6) drawBrand(ctx, x, y, sc, { t, brand: i === 1 ? 'LAGTV' : 'LOADING+', seed: 40 + i, mood: 'sleepy', spinner: i === 6 ? 1 : 0, mouth: 0, look: [0.6 * Math.sign(880 - x), -0.2], glow: 0.5 });
      else A.drawPacket(ctx, x, y, sc, { t, seed: 40 + i, mood: i % 3 ? 'bored' : 'sleep', honk: hk, look: [0.6 * Math.sign(880 - x), -0.2] });
      ctx.restore();
    }
    const lookK = smooth(25.35, 25.9, k);
    const catMood = k > 26.62 && k < 27.45 ? 'grumpy' : 'bored';
    const arms = k > 25.62 && k < 26.3 ? 'point' : 'crossed';
    const armPop = Math.max(0, 1 - Math.abs(k - 25.62) / 0.12, k > 26.3 && k < 26.45 ? 1 - (k - 26.3) / 0.15 : 0);
    A.glow(ctx, 880, 560, 700, '#ff3fa4', 0.12);
    A.drawCatPacket(ctx, 900, 1010, 3.35, {
      t, mood: catMood, arms,
      look: [lerp(-0.55, 0.62, lookK), lerp(-0.1, 0.55, lookK)],
      rot: lerp(-0.02, 0.05, smooth(25.6, 26.2, k)) - 0.02 * smooth(27.2, 27.8, k),
      lid: k > 27.4 ? 0.12 : 0, browRaise: k > 27.1 && k < 27.6 ? 6 : 0,
      squash: 0.04 * armPop,
    });
    const recoil = Math.exp(-lt * 5) * Math.sin(lt * 18);
    const bmood = k < 26.7 ? 'panic' : k < 27.35 ? 'neutral' : 'determined';
    A.drawBit(ctx, 1580 + recoil * 12, 975, 0.72, {
      t, mood: bmood, shadow: 1, mouth: 0, glow: 1.3, look: [-0.75, -0.85],
      limbs: 'stand', squash: 0.05 * Math.sin(t * 22) * (k < 26.7 ? 1 : 0) + (k > 27.5 ? 0.1 * smooth(27.5, 27.8, k) : 0),
      sweat: k < 27.2 ? 1 : 0, browL: k > 27.35 ? -4 : 0, browR: k > 27.35 ? -4 : 0,
    });
    ctx.fillStyle = A.radial(ctx, 40, 1180, 60, 420, [[0, 'rgba(40,20,50,0.95)'], [0.6, 'rgba(60,25,60,0.7)'], [1, 'rgba(40,20,50,0)']]); ctx.fillRect(-400, 700, 900, 800);
    ctx.fillStyle = A.radial(ctx, 1900, 1200, 60, 380, [[0, 'rgba(20,40,60,0.95)'], [0.6, 'rgba(25,50,70,0.7)'], [1, 'rgba(20,40,60,0)']]); ctx.fillRect(1450, 750, 900, 800);
    ctx.restore();
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

  A.scene({
    name: 's4_jam', start: 29.2, end: 43.4,
    draw(ctx, s) {
      const t = s.t;
      if (t < 30.1) shotA(ctx, t);
      else if (t < 36.8) shotB(ctx, t);
      else if (t < 39.6) shotC(ctx, t);
      else if (t < 41.45) shotD(ctx, t);
      else if (t < 42.7) shotE(ctx, t);
      else shotF(ctx, t);
      hud(ctx, t);
      // white-gold flash out of the GOTV LED dive
      const fa = 1 - ease.out(inv(29.2, 29.6, t));
      if (fa > 0) {
        ctx.save(); ctx.fillStyle = `rgba(255,248,222,${fa})`; ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, 960, 470, 1200, 'rgba(255,201,60,1)', fa * 0.8); ctx.restore();
      }
    },
  });
})();
