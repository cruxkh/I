// HOST layer: real stock-footage man, cut out with a person matte, lit with brand rim lights, over a cinematic navy set with glass stickers.
// Shots (director): m1 0-2.0, m2 2.0-3.05 (hook) | m5 18.81-20.64 (reaction) | m6 23.9-25.5 (suspense) | m7-m10 30.12-36.88 (finale)
(() => {
  const W = 1080, H = 1920;
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), eio = t => ease.inOut(clamp(t));
  const C = V.C;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const TC = mk(W, H), RC = mk(W, H), tctx = TC.getContext('2d'), rctx = RC.getContext('2d');
  const SHOTS = Object.entries(PLAN).map(([k, v]) => ({ k, ...v })).filter(s => !['m3', 'm4'].includes(s.k)).sort((a, b) => a.t0 - b.t0);
  const CAM = { m1: [1.16, 1.34, 0, 0, 0, 0], m2: [1.72, 1.82, -3, -3, 0, -18], m5: [1.5, 1.6, 2.5, 1.5, 0, 0], m6: [1.2, 1.85, 0, 0, 0, 0], m7: [1.4, 1.52, -2, -2.5, 0, 0], m8: [1.78, 1.9, 3, 3, 0, 0], m9: [1.25, 1.4, 0, 0, 0, 0], m10: [1.55, 1.8, 0, 0, 0, 0] };
  const PIV = [0.49 * W, 0.35 * H], FACE_AT = [540, 690];
  const cache = new Map(), load = src => { if (cache.has(src)) return cache.get(src); const p = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); cache.set(src, p); if (cache.size > 60) cache.delete(cache.keys().next().value); return p; };
  let cur = null;
  const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1 + (s.k === 'm10' ? 0.3 : 0));
  async function prepare(t) {
    const s = shotAt(t); cur = null; if (!s) return;
    const idx = s.src + Math.floor(clamp(t, s.t0, s.t1 - 1e-4) * 25 - s.t0 * 25 + 1e-6), nm = String(idx).padStart(4, '0');
    const [im, mk2] = await Promise.all([load(`yt/src/f${nm}.jpg`), load(`yt/mask_rgba/f${nm}.png`)]);
    cur = im && mk2 ? { im, mk: mk2, shot: s } : null;
  }

  // ------------------------------------------------ set (background)
  function set(ctx, t, dark = 0, hue = 0) {
    V.bgDeep(ctx, t, { seed: 4, bokeh: 1 - dark * .6 });
    V.beams(ctx, 540, -60, t, hue ? '#FFC24A' : '#5AD1FF', 5, 2400, 1.0, .13 * (1 - dark));
    // floor glow pool
    V.glow(ctx, 540, 1260, 700, '#2F6BFF', .28 * (1 - dark)); V.glow(ctx, 540, 1180, 420, '#FFC24A', .12 * (1 - dark));
    if (dark) { ctx.fillStyle = `rgba(3,5,18,${dark * .8})`; ctx.fillRect(0, 0, W, H); }
  }
  // ------------------------------------------------ host cutout with rim light
  function drawHost(ctx, t, s, extra = {}) {
    if (!cur || cur.shot !== s) return null;
    const cam = CAM[s.k], u = (t - s.t0) / (s.t1 - s.t0), e = eio(u), beat = 1 + .012 * Math.pow(Math.max(0, 1 - ((t % .5) / .5) * 3), 2);
    const cu = t - s.t0, shk = Math.exp(-cu * 14) * 16;
    const z = lerp(cam[0], cam[1], e) * beat * (extra.zoomK || 1), rot = lerp(cam[2], cam[3], e) * Math.PI / 180, dx = lerp(cam[4], cam[5], e) + Math.sin(cu * 60) * shk, dy = Math.cos(cu * 53) * shk + (extra.dy || 0);
    const xf = c => { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(FACE_AT[0] + dx, FACE_AT[1] + dy); c.rotate(rot); c.scale(z, z); c.translate(-PIV[0], -PIV[1]); };
    tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, W, H); tctx.globalCompositeOperation = 'source-over';
    tctx.save(); xf(tctx); tctx.filter = 'contrast(1.14) saturate(1.5) brightness(1.08)'; tctx.drawImage(cur.im, 0, 0, W, H); tctx.restore();
    tctx.save(); tctx.globalCompositeOperation = 'destination-in'; xf(tctx); tctx.filter = 'blur(1.2px)'; tctx.drawImage(cur.mk, 0, 0, W, H); tctx.restore();
    // silhouette (colourised) for rim lights + halo
    rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.clearRect(0, 0, W, H); rctx.globalCompositeOperation = 'source-over'; rctx.drawImage(TC, 0, 0); rctx.globalCompositeOperation = 'source-in'; rctx.fillStyle = '#fff'; rctx.fillRect(0, 0, W, H); rctx.globalCompositeOperation = 'source-over';
    const tint = (col, dxx, dyy, a, blur = 0) => { const c2 = mk(1, 1); ctx.save(); ctx.globalAlpha = a; if (blur) ctx.filter = `blur(${blur}px)`; ctx.drawImage(TINT(col), dxx, dyy); ctx.restore(); };
    const hl = extra.halo ?? 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .34 * hl; ctx.filter = 'blur(30px)'; ctx.drawImage(TINT('#5AA8FF'), -10, 0); ctx.globalAlpha = .26 * hl; ctx.drawImage(TINT('#FFC24A'), 14, 6); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(0,10,50,.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26; ctx.drawImage(TC, 0, 0); ctx.restore();
    // crisp rim: shifted coloured silhouettes clipped to the outside edge of the body
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .9; ctx.drawImage(TINT('#38B6FF'), -5, -2); ctx.globalAlpha = .9; ctx.drawImage(TINT('#FFC24A'), 6, 3); ctx.restore();
    ctx.drawImage(TC, 0, 0);
    return { z, rot };
  }
  const tintCache = {};
  function TINT(col) {
    const c = tintCache[col] || (tintCache[col] = mk(W, H)), x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); x.drawImage(RC, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    return c;
  }
  // ------------------------------------------------ stickers
  const TILES = [['#FF5A66', '#A3122B', 'play'], ['#5AA8FF', '#1B3FA0', 'tv'], ['#4BE59A', '#0F7A48', 'ball'], ['#FFC24A', '#C4761A', 'star'], ['#FF6EC7', '#8A1B6A', 'heart'], ['#B08CFF', '#4A2BB0', 'bolt'], ['#5AD1FF', '#136A96', 'note']];
  function glassTile(ctx, x, y, s, k, rot = 0, a = 1, blur = 0) {
    const [c1, c2, ic] = TILES[k % TILES.length]; ctx.save(); ctx.globalAlpha = a; if (blur) ctx.filter = `blur(${blur}px)`; V.tile(ctx, x, y, s, c1, c2, V.ICON[ic], { rot }); ctx.restore();
  }
  function spinner(ctx, x, y, r, t, col = '#fff', a = 1) { ctx.save(); ctx.translate(x, y); for (let i = 0; i < 12; i++) { const an = i / 12 * A.TAU + t * 5; ctx.globalAlpha = a * (.2 + .8 * (((i / 12 - t * 1.1) % 1) + 1) % 1); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(Math.cos(an) * r, Math.sin(an) * r, r * .12, 0, A.TAU); ctx.fill(); } ctx.restore(); }
  function qbubble(ctx, x, y, s, rot, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); V.glass(ctx, -80, -80, 160, 160, 80, { tint: col, alpha: .35, shadow: 30 }); V.text(ctx, '?', 0, 6, 120, { dir: 'ltr', grad: V.WHITE_GRAD, shadow: false }); ctx.restore(); }
  const confetti = (ctx, t, t0, x, y, n, spread, seed = 1) => { const u = t - t0; if (u < 0 || u > 1.8) return; const r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * A.TAU, v = 260 + r() * spread, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 900 * u * u * .5; ctx.save(); ctx.translate(px, py); ctx.rotate(r() * 6 + u * 9 * (r() - .5)); ctx.globalAlpha = 1 - u / 1.8; ctx.fillStyle = ['#FFC24A', '#5AD1FF', '#FF6EC7', '#fff', '#4BE59A'][i % 5]; ctx.fillRect(-10, -6, 20, 12); ctx.restore(); } };

  function stickers(ctx, t, s) {
    const k = s.k, u = t - s.t0;
    if (k === 'm1' || k === 'm2') {                       // tornado of glass apps: far ones small+blurred, near ones big
      const freeze = t >= 2.0, tt = freeze ? 2.0 : t, pull = k === 'm2' ? clamp((t - 2.75) / .3) : 0;
      for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 9; i++) {
        const id = i + layer * 9, ph = tt * 1.1 + id, a = ph * 2.05 + id * .55, rad = (layer ? 250 : 380) + 110 * Math.sin(id * 1.7 + tt * 1.3) + (freeze ? Math.sin(t * 5 + id) * 9 : 0);
        const depth = layer ? 1 : .55, x0 = 540 + Math.cos(a) * rad * 1.05, y0 = 690 + Math.sin(a) * rad * .6, x = lerp(x0, 540, pull), y = lerp(y0, 640, pull);
        const sz = (layer ? .95 : .55) * (.85 + .3 * hash(id)) * (1 - pull * .8), p = eob((t - .04 * id) / .35);
        const front = Math.sin(a) > 0; if ((layer === 1) !== front && layer === 1) continue;
        glassTile(ctx, x, y, sz * p, id, Math.sin(a) * .5, layer ? 1 : .8, layer ? 0 : 5);
        if (id % 4 === 0 && layer) spinner(ctx, x, y + 34 * sz, 28 * sz * p, t, '#fff', .9 * p);
      }
      qbubble(ctx, 170, 470, eob((t - .25) / .3), -.2, '#FFC24A'); qbubble(ctx, 900, 560, eob((t - .75) / .3) * 1.15, .25, '#5AD1FF'); qbubble(ctx, 260, 980, eob((t - 1.35) / .3) * .9, .15, '#FF6EC7');
      if (k === 'm2') qbubble(ctx, 830, 460, eob((t - 2.1) / .3) * 1.5, .12, '#FF6EC7');
    }
    if (k === 'm5') {
      const p = eob(u / .35), pulse = 1 + .06 * Math.sin(t * 9);
      ctx.save(); ctx.translate(830, 470); ctx.rotate(.2); ctx.scale(p * pulse, p * pulse); V.glow(ctx, 0, 0, 300, '#FF4F9A', .6);
      ctx.beginPath(); for (let i = 0; i < 28; i++) { const a = i * Math.PI / 14 + t * .5, r = i % 2 ? 150 : 205; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = V.lin(ctx, 0, -200, 0, 200, [[0, '#FF8AC7'], [1, '#E0207F']]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
      V.text(ctx, 'חדש!', 0, 6, 110, { grad: V.WHITE_GRAD, stroke: '#7A0F45' }); ctx.restore();
      for (let i = 0; i < 6; i++) { const p2 = eob((t - s.t0 - .12 * i) / .32); glassTile(ctx, 130 + (i % 3) * 400 + (i > 2 ? 70 : 0), i < 3 ? 1060 : 1180, .62 * p2, i + 2, (i - 2.5) * .09); }
      for (let i = 0; i < 8; i++) V.sparkle(ctx, 120 + hash(i + 20) * 840, 330 + hash(i + 30) * 800, 30 * Math.abs(Math.sin(t * 6 + i)), '#fff', t);
    }
    if (k === 'm6') {
      const hb = Math.pow(Math.max(0, Math.sin(t * 7.5)), 6), g = ctx.createRadialGradient(540, 960, 480, 540, 960, 1300);
      g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${.1 + .34 * hb * clamp((t - 23.9) / 1.2)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const p = clamp((t - 24.85) / .5); if (p > 0) spinner(ctx, 880, 1180, 66 * eo(p), t * .7, '#fff', p);
    }
    if (k === 'm7') {
      const p = eob((t - 30.6) / .25), press = 1 - .15 * Math.exp(-Math.pow((t - 30.72) * 14, 2));
      ctx.save(); ctx.translate(540, 1190); ctx.scale(p * press, p * press); ctx.shadowColor = 'rgba(0,0,30,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, A.TAU); ctx.fillStyle = V.rad(ctx, -30, -50, 10, 180, [[0, '#FFF0B8'], [.6, '#FFC24A'], [1, '#D98010']]); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
      V.text(ctx, 'OK', 0, 8, 112, { dir: 'ltr', fill: '#101440', shadow: false }); ctx.restore();
      for (let i = 0; i < 3; i++) { const q = (t - 30.72 - i * .12) / .7; if (q > 0 && q < 1) V.ring(ctx, 540, 1190, 150 + q * 420, 16 * (1 - q), '#FFE9A8', 1 - q); }
      V.flash(ctx, t, 30.72, .25, '#fff', .4);
    }
    if (k === 'm8') {
      for (let i = 0; i < 9; i++) { const a = i / 9 * A.TAU + t * .9, x = 540 + Math.cos(a) * 460, y = 740 + Math.sin(a) * 270, p = eob((t - 32.04 - i * .06) / .3), far = Math.sin(a) < 0; glassTile(ctx, x, y, (far ? .55 : .85) * p, i, Math.sin(a) * .4, far ? .8 : 1, far ? 4 : 0); }
      confetti(ctx, t, 32.1, 540, 700, 34, 520, 9);
    }
    if (k === 'm9') {
      [[33.55, 180, 480, -.14], [33.95, 900, 540, .12], [34.4, 200, 1000, .1]].forEach(([t0, x, y, r]) => { const p = eob((t - t0) / .3); if (p > 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(p * 1.8, p * 1.8); V.glow(ctx, 0, 0, 160, '#FF3B4A', .5); V.glass(ctx, -80, -30, 160, 60, 30, { tint: '#FF3B4A', alpha: .55, shadow: 20 }); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-46, 0, 9, 0, A.TAU); ctx.fill(); V.text(ctx, 'LIVE', 14, 3, 34, { dir: 'ltr', fill: '#fff', shadow: false }); ctx.restore(); V.ring(ctx, x, y, 170 * eo((t - t0) / .5), 8, '#FF3B4A', 1 - clamp((t - t0) / .5)); } });
      for (let i = 0; i < 8; i++) V.sparkle(ctx, 100 + hash(i + 50) * 880, 330 + hash(i + 60) * 900, 32 * Math.abs(Math.sin(t * 6 + i)), '#fff', t);
    }
    if (k === 'm10') {
      const sp = clamp((t - 35.9) / .25) * (t < 36.3 ? 1 : 0); if (sp > 0) spinner(ctx, 880, 1040, 90, t, '#fff', sp);
      if (t >= 36.3) { const q = (t - 36.3) / .6; V.ring(ctx, 880, 1040, 60 + q * 340, 16 * (1 - clamp(q)), '#FF3B4A', 1 - clamp(q)); if (q < 1) { const r = rng(4); for (let i = 0; i < 30; i++) { const a = r() * A.TAU, v = 200 + r() * 600; V.sparkle(ctx, 880 + Math.cos(a) * v * q, 1040 + Math.sin(a) * v * q, 18 * (1 - q), '#fff', i); } } }
      V.flash(ctx, t, 36.2, .3, '#FFF4D8', .8);
      for (let i = 0; i < 10; i++) V.sparkle(ctx, 90 + hash(i + 70) * 900, 300 + hash(i + 80) * 900, 36 * Math.abs(Math.sin(t * 7 + i)), '#fff', t);
    }
  }
  function scene(s) {
    A.scene({
      name: 'host_' + s.k, start: s.t0, end: s.t1 + (s.k === 'm10' ? 0.3 : 0), shift: 0,
      draw(ctx, st) {
        const t = st.t, dark = s.k === 'm6' ? clamp((t - 23.9) / 1.0) * .5 : 0;
        set(ctx, t, dark, s.k >= 'm7' || s.k === 'm5' ? 1 : 0);
        if (s.k === 'm6') V.beams(ctx, 540, -40, t, '#FFFFFF', 3, 1900, .5, .18 * eio(clamp((t - 23.9) / .8)));
        drawHost(ctx, t, s, { halo: s.k === 'm6' ? .5 : 1 }); stickers(ctx, t, s);
        if (s.k === 'm6') { if (t > 25.15) { const r = rng(Math.floor(t * 30)); const im = ctx.getImageData(0, 0, W, H); ctx.putImageData(im, 0, 0); for (let i = 0; i < 9; i++) { const y = r() * H | 0, h = 30 + r() * 140 | 0, dx = (r() - .5) * 160; ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h); } } if (t > 25.32) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#777'; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
      },
    });
  }
  SHOTS.forEach(scene);
  A.scene({ name: 'blackhold', start: 25.5, end: 25.61, shift: 0, draw(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); } });
  window.HOST = { prepare, SHOTS };
})();
