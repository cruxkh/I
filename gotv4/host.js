// HOST layer: real stock-footage man, cut out with a person matte, lit with brand rim lights, over a cinematic navy set with glass stickers.
// Shots (director): m1 0-2.0, m2 2.0-3.05 (hook) | m5 18.81-20.64 (reaction) | m6 23.9-25.5 (suspense) | m7-m10 30.12-36.88 (finale)
(() => {
  const W = 1080, H = 1920;
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), eio = t => ease.inOut(clamp(t));
  const C = V.C;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const TC = mk(W, H), RC = mk(W, H), tctx = TC.getContext('2d'), rctx = RC.getContext('2d');
  const ITEMS = Object.entries(HPLAN).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.t0 - b.t0);
  const FULLS = ITEMS.filter(i => i.mode === 'full'), CAMEOS = ITEMS.filter(i => i.mode === 'cameo');
  const GROUP = id => id.startsWith('h10') ? 'm10' : id.startsWith('h1') ? 'm1' : id.startsWith('h2') ? 'm1' : id.startsWith('h3') ? 'm1' : id.startsWith('h4') ? 'm1' : id.startsWith('h5') ? 'm5' : id.startsWith('h6') ? 'm6' : id.startsWith('h7') ? 'm7' : id.startsWith('h8') ? 'm8' : id.startsWith('h9') ? 'm9' : id;
  const GSTART = { m1: 0, m5: 18.81, m6: 23.9, m7: 30.12, m8: 32.04, m9: 33.42, m10: 35.19 };
  const PIV = [0.49 * W, 0.35 * H]; const HFPS = 23.976;   // new host footage: 720x1280 @ 23.976 fps, per-frame head anchors (window.HANCH[f] = [px, py, k])
  const cache = new Map(), load = src => { if (cache.has(src)) return cache.get(src); const p = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); cache.set(src, p); if (cache.size > 90) cache.delete(cache.keys().next().value); return p; };
  let curs = [];   // active items with their decoded frames
  const active = t => ITEMS.filter(i => t >= i.t0 && t < i.t1 + (i.id === 'h10b' ? 0.3 : 0));
  async function prepare(t) {
    curs = [];
    for (const it of active(t)) {
      const idx = it.src + Math.floor(clamp(t - it.t0, 0, it.t1 - it.t0 - 1e-4) * HFPS * it.rate + 1e-6), nm = String(Math.min(idx, 1292)).padStart(4, '0');
      const [im, mk2] = await Promise.all([load(`yt2/src/f${nm}.jpg`), load(`yt2/mask_rgba/f${nm}.png`)]);
      if (im && mk2) curs.push({ it, im, mk: mk2, an: (window.HANCH && HANCH[Math.min(idx, 1292)]) || [0.5, 0.25, 1] });
    }
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
  // cut(): builds the cut-out into TC/RC using layout (face anchor cx,cy; zoom z; rot deg; flip)
  function cut(c, t, o) {
    const it = c.it, u = clamp((t - it.t0) / (it.t1 - it.t0)), e = eio(u), beat = 1 + .012 * Math.pow(Math.max(0, 1 - ((t % .5) / .5) * 3), 2);
    const cu = t - it.t0, shk = it.mode === 'full' ? Math.exp(-cu * 14) * 16 : 0;
    const z = lerp(it.z0, it.z1, e) * beat * (o.zoomK || 1), rot = lerp(it.rot0, it.rot1, e) * Math.PI / 180, dx = (o.dx || 0) + Math.sin(cu * 60) * shk, dy = (o.dy || 0) + Math.cos(cu * 53) * shk;
    const fx = it.flip ? -1 : 1;
    const an = c.an || [0.5, 0.25, 1], zk = z * an[2], px = an[0] * W, py = an[1] * H;
    const xf = cx => { cx.setTransform(1, 0, 0, 1, 0, 0); cx.translate(it.cx + dx, it.cy + dy); cx.rotate(rot); cx.scale(zk * fx, zk); cx.translate(-px, -py); };
    tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, W, H); tctx.globalCompositeOperation = 'source-over';
    tctx.save(); xf(tctx); if (window.ANIMEFX && ANIMEFX.hostAnime) ANIMEFX.gradeHost(tctx, c.im, W, H); else { tctx.filter = 'contrast(1.14) saturate(1.5) brightness(1.08)'; tctx.drawImage(c.im, 0, 0, W, H); } tctx.restore();
    tctx.save(); tctx.globalCompositeOperation = 'destination-in'; xf(tctx); tctx.drawImage(c.mk, 0, 0, W, H); tctx.restore();
    rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.clearRect(0, 0, W, H); rctx.globalCompositeOperation = 'source-over'; rctx.drawImage(TC, 0, 0); rctx.globalCompositeOperation = 'source-in'; rctx.fillStyle = '#fff'; rctx.fillRect(0, 0, W, H); rctx.globalCompositeOperation = 'source-over';
    for (const k in tintCache) delete tintCache[k];
  }
  const HALO = document.createElement('canvas'); HALO.width = 270; HALO.height = 480; const hx = HALO.getContext('2d');
  function paintCut(ctx, halo = 1, outline = false) {
    // soft halo from a 1/4-res tinted silhouette (cheap blur)
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, 270, 480); hx.globalCompositeOperation = 'source-over'; hx.filter = 'blur(5px)'; hx.drawImage(TINT('#38B6FF'), -3, 0, 270, 480); hx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * halo; ctx.drawImage(HALO, 0, 0, W, H); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(0,10,50,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 20; ctx.drawImage(TC, 0, 0); ctx.restore();
    if (outline) { const R = 10; for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; ctx.drawImage(RC, Math.cos(a) * R, Math.sin(a) * R); } }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .9; ctx.drawImage(TINT('#38B6FF'), -5, -2); ctx.drawImage(TINT('#FFC24A'), 6, 3); ctx.restore();
    ctx.drawImage(TC, 0, 0);
  }
  function drawHost(ctx, t, c, extra = {}) { cut(c, t, extra); paintCut(ctx, extra.halo ?? 1, false); return true; }
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
    if (k === 'm1') {                       // tornado of glass apps: far ones small+blurred, near ones big
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
      if (t >= 2.0) qbubble(ctx, 830, 460, eob((t - 2.1) / .3) * 1.5, .12, '#FF6EC7');
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
  function scene(it) {
    const g = GROUP(it.id), pseudo = { k: g, t0: GSTART[g] ?? it.t0, t1: it.t1 };
    A.scene({
      name: 'host_' + it.id, start: it.t0, end: it.t1 + (it.id === 'h10b' ? 0.3 : 0), shift: 0,
      draw(ctx, st) {
        const t = st.t, dark = g === 'm6' ? clamp((t - 23.9) / 1.0) * .5 : 0;
        set(ctx, t, dark, g >= 'm7' || g === 'm5' ? 1 : 0);
        if (g === 'm6') V.beams(ctx, 540, -40, t, '#FFFFFF', 3, 1900, .5, .18 * eio(clamp((t - 23.9) / .8)));
        const c = curs.find(q => q.it === it); if (c) drawHost(ctx, t, c, { halo: g === 'm6' ? .5 : 1 });
        stickers(ctx, t, pseudo);
        if (g === 'm6') { if (t > 25.15) { const r = rng(Math.floor(t * 30)); for (let i = 0; i < 9; i++) { const y = r() * H | 0, h = 30 + r() * 140 | 0, dx = (r() - .5) * 160; ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h); } } if (t > 25.32) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#777'; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
        if (st.lt < 0.12 && it.t0 > 0.1 && !['h6'].includes(it.id)) V.flash(ctx, t, it.t0, .12, '#fff', .55);   // jump-cut flash
      },
    });
  }
  FULLS.forEach(scene);
  A.scene({ name: 'blackhold', start: 25.5, end: 25.61, shift: 0, draw(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); } });
  // ---- cameo overlay: the host pops in from the frame edges over the animation scenes
  function overlay(ctx, t) {
    for (const c of curs) {
      const it = c.it; if (it.mode !== 'cameo') continue;
      const ein = eob((t - it.t0) / .26), eout = ein_(clamp((t - (it.t1 - .22)) / .22)), e = Math.min(ein, 1 - eout);
      const off = it.dist * (1 - e), dx = it.dir === 'l' ? -off : it.dir === 'r' ? off : 0, dy = it.dir === 't' ? -off : it.dir === 'b' ? off : 0;
      const sq = 1 + .05 * Math.sin(clamp((t - it.t0) / .3) * Math.PI * 2);
      ctx.save();
      // glow disc + entry burst
      const gx = it.cx + dx, gy = it.cy + dy; V.glow(ctx, gx, gy, 420, '#FFC24A', .5 * e); V.glow(ctx, gx, gy, 320, '#2F6BFF', .35 * e);
      const q = (t - it.t0) / .4; if (q > 0 && q < 1) { V.ring(ctx, it.cx, it.cy, 100 + q * 330, 14 * (1 - q), '#fff', .9 * (1 - q)); for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU + .3; V.sparkle(ctx, it.cx + Math.cos(a) * (140 + q * 260), it.cy + Math.sin(a) * (140 + q * 260), 26 * (1 - q), '#fff', a); } }
      cut(c, t, { dx, dy, zoomK: sq }); paintCut(ctx, .7, true);
      // speed streaks trailing the entry direction
      if (e < .98 && ein < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * (1 - e); for (let i = 0; i < 6; i++) { const yy = it.cy + (i - 2.5) * 70, len = 260 + 120 * hash(i); ctx.fillStyle = '#fff'; if (it.dir === 'l' || it.dir === 'r') ctx.fillRect(it.dir === 'l' ? gx - len - 200 : gx + 200, yy, len, 6); } ctx.restore(); }
      ctx.restore();
    }
  }
  const ein_ = t => ease.in(clamp(t));
  if (window.ANIMEFX) ANIMEFX.hostOpts = { levels: 7, sat: 1.1, ink: .75, dots: .55, blur: 1.1 };
  window.HOST = { prepare, overlay, ITEMS };
})();
