// YouTube-Shorts style edit: 1080x1920 @30. Talking-head cutout (stock clip) + word-pop captions + 2D motion-graphics b-roll cards.
(() => {
  const W = 1080, H = 1920, FPS = 30;
  const cv = document.getElementById('v'), ctx = cv.getContext('2d');
  const sc = document.getElementById('c');
  A.post = null; // no baked subtitles inside the b-roll: captions are drawn here
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const TC = mk(W, H), SC = mk(W, H), tiny = mk(108, 192), fx = mk(W, H);
  const tctx = TC.getContext('2d'), sctx = SC.getContext('2d'), tinyx = tiny.getContext('2d'), fxx = fx.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), eio = t => ease.inOut(clamp(t));
  const GOLD = '#FFC24A', YEL = '#FFD84A', INK = '#1a1330';
  const ANIM = [[5.0, 18.81], [20.64, 23.9], [25.61, 30.12]];
  const animAt = t => ANIM.find(([a, b]) => t >= a && t < b);
  const SHOTS = Object.entries(PLAN).map(([k, v]) => ({ k, ...v })).sort((a, b) => a.t0 - b.t0);
  const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1);
  // punch-in design per shot: zoom0->zoom1, rot0->rot1 (deg), dx0->dx1
  const CAM = {
    m1: [1.10, 1.26, 0, 0, 0, 0], m2: [1.62, 1.72, -3, -3, 0, -14], m3: [1.02, 1.10, 0, 0, 0, 0], m4: [1.25, 2.05, 0, 2, 0, 0],
    m5: [1.42, 1.52, 2.5, 1.5, 0, 0], m6: [1.12, 1.78, 0, 0, 0, 0], m7: [1.30, 1.42, -2, -2.5, 0, 0], m8: [1.68, 1.78, 3, 3, 0, 0],
    m9: [1.18, 1.32, 0, 0, 0, 0], m10: [1.45, 1.68, 0, 0, 0, 0],
  };
  const PIV = [0.49 * W, 0.35 * H], FACE_AT = [540, 640];
  const imgCache = new Map();
  const load = src => { if (imgCache.has(src)) return imgCache.get(src); const p = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); imgCache.set(src, p); if (imgCache.size > 40) imgCache.delete(imgCache.keys().next().value); return p; };

  // ------------------------------------------------------------ background
  function bg(t, dark = 0) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#171055'); g.addColorStop(0.55, '#2B1B6B'); g.addColorStop(1, '#0E0B2E');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const pulse = 0.5 + 0.5 * Math.cos((t % 0.5) / 0.5 * Math.PI * 2 - Math.PI);
    const blobs = [['#FF4F9A', 0.30], ['#38D9F5', 0.24], ['#FFC24A', 0.28], ['#7A4DFF', 0.3]];
    blobs.forEach(([c, a], i) => {
      const x = W * (0.5 + 0.42 * Math.sin(t * 0.5 + i * 1.7)), y = H * (0.5 + 0.38 * Math.cos(t * 0.37 + i * 2.3)), r = 620 + 60 * pulse;
      A.glow(ctx, x, y, r, c, a * (1 - dark));
    });
    // diagonal moving stripes
    ctx.save(); ctx.globalAlpha = 0.06 * (1 - dark); ctx.fillStyle = '#fff'; ctx.translate(W / 2, H / 2); ctx.rotate(-0.5);
    for (let i = -10; i < 10; i++) { const x = ((i * 240 + t * 70) % 2400) - 1200; ctx.fillRect(x, -1600, 70, 3200); }
    ctx.restore();
    // floating dust/tiles
    const r = rng(7);
    for (let i = 0; i < 26; i++) {
      const s = 10 + r() * 26, x = (r() * W + Math.sin(t * 0.6 + i) * 40 + W * 2) % W, y = ((r() * H - t * (30 + r() * 60)) % H + H) % H;
      ctx.save(); ctx.globalAlpha = (0.10 + 0.12 * r()) * (1 - dark); ctx.translate(x, y); ctx.rotate(t * 0.3 + i);
      ctx.fillStyle = ['#FFC24A', '#38D9F5', '#FF4F9A', '#fff'][i % 4]; A.rrect(ctx, -s / 2, -s / 2, s, s, s * 0.25); ctx.fill(); ctx.restore();
    }
    if (dark) { ctx.fillStyle = `rgba(6,4,20,${dark * 0.85})`; ctx.fillRect(0, 0, W, H); }
  }

  // ------------------------------------------------------------ stickers
  const sparkle = (x, y, r, col = '#fff', rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  const ICONS = {
    play: (c, s) => { c.beginPath(); c.moveTo(-s * .25, -s * .32); c.lineTo(s * .38, 0); c.lineTo(-s * .25, s * .32); c.closePath(); c.fill(); },
    ball: (c, s) => { c.beginPath(); c.arc(0, 0, s * .3, 0, A.TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = s * .05; c.stroke(); c.beginPath(); c.arc(0, 0, s * .12, 0, A.TAU); c.fillStyle = INK; c.fill(); },
    star: (c, s) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .14 : s * .34; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); },
    heart: (c, s) => { c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s * .5, -s * .05, -s * .2, -s * .4, 0, -s * .12); c.bezierCurveTo(s * .2, -s * .4, s * .5, -s * .05, 0, s * .3); c.fill(); },
    tv: (c, s) => { A.rrect(c, -s * .32, -s * .24, s * .64, s * .42, s * .06); c.fill(); c.fillRect(-s * .14, s * .2, s * .28, s * .06); },
  };
  const TILE_COLS = [['#FF4A3D', '#8B1420'], ['#4DA3FF', '#1B3FA0'], ['#3DDC84', '#127A48'], ['#FFC24A', '#C4761A'], ['#FF4F9A', '#8A1B5A'], ['#B07CFF', '#5A2BB0'], ['#38D9F5', '#13698A']];
  function tile(x, y, s, rot, k, icon = 'play') {
    const [c1, c2] = TILE_COLS[k % TILE_COLS.length];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    D.tile(ctx, 0, 0, 170, 170, c1, c2, '', { r: 36, lw: 8 }); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ICONS[icon](ctx, 170); ctx.restore();
  }
  const qmark = (x, y, s, rot, col = GOLD) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, 0, 70, 0, A.TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke(); A.text(ctx, '?', 0, 6, { font: '900 110px Rubik', fill: INK }); ctx.restore(); };
  function spinner(x, y, r, t, col = '#fff', a = 1) { ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; for (let i = 0; i < 10; i++) { const an = i / 10 * A.TAU + t * 6; ctx.fillStyle = col; ctx.globalAlpha = a * (0.25 + 0.75 * (((i / 10 - t * 1.2) % 1) + 1) % 1); ctx.beginPath(); ctx.arc(Math.cos(an) * r, Math.sin(an) * r, r * 0.13, 0, A.TAU); ctx.fill(); } ctx.restore(); }
  const ring = (x, y, r, w, col, a) => { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); ctx.stroke(); ctx.restore(); };
  const confetti = (t, t0, x, y, n, spread, seed = 1) => { const u = t - t0; if (u < 0 || u > 1.6) return; const r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * A.TAU, v = 250 + r() * spread, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 700 * u * u * 0.5; ctx.save(); ctx.translate(px, py); ctx.rotate(r() * 6 + u * 8 * (r() - .5)); ctx.globalAlpha = 1 - u / 1.6; ctx.fillStyle = ['#FFC24A', '#38D9F5', '#FF4F9A', '#fff', '#3DDC84'][i % 5]; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); } };
  const flash = (t, t0, d, col = '#fff', peak = 1) => { const u = (t - t0) / d; if (u < 0 || u > 1) return; ctx.save(); ctx.globalAlpha = peak * (1 - u) * (1 - u); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  const rays = (x, y, t, col, a, n = 14) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.25); ctx.globalAlpha = a; ctx.fillStyle = col; for (let i = 0; i < n; i++) { ctx.rotate(A.TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -90); ctx.lineTo(1600, 90); ctx.closePath(); ctx.fill(); } ctx.restore(); };

  // ------------------------------------------------------------ man cutout
  async function drawMan(t, shot) {
    const cam = CAM[shot.k], u = (t - shot.t0) / (shot.t1 - shot.t0);
    const e = shot.k === 'm4' ? ease.in(u) : eio(u);
    const beat = 1 + 0.012 * Math.pow(Math.max(0, 1 - ((t % 0.5) / 0.5) * 3), 2);
    const cutU = t - shot.t0, shk = Math.exp(-cutU * 14) * 14;
    const z = lerp(cam[0], cam[1], e) * beat, rot = lerp(cam[2], cam[3], e) * Math.PI / 180, dx = lerp(cam[4], cam[5], e) + Math.sin(cutU * 60) * shk, dy = Math.cos(cutU * 53) * shk;
    const idx = shot.src + Math.floor((t - shot.t0) * 25 + 1e-6), nm = String(idx).padStart(4, '0');
    const [im, mk] = await Promise.all([load(`yt/src/f${nm}.jpg`), load(`yt/mask_rgba/f${nm}.png`)]);
    if (!im || !mk) return null;
    const xf = c => { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(FACE_AT[0] + dx, FACE_AT[1] + dy); c.rotate(rot); c.scale(z, z); c.translate(-PIV[0], -PIV[1]); };
    tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, W, H); tctx.globalCompositeOperation = 'source-over';
    tctx.save(); xf(tctx); tctx.filter = 'contrast(1.12) saturate(1.45) brightness(1.1)'; tctx.drawImage(im, 0, 0, W, H); tctx.restore();
    tctx.save(); tctx.globalCompositeOperation = 'destination-in'; xf(tctx); tctx.filter = 'blur(1.2px)'; tctx.drawImage(mk, 0, 0, W, H); tctx.restore();
    // white sticker outline
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, W, H); sctx.filter = 'brightness(0) invert(1)';
    const R = 9 + 2 * z; for (let i = 0; i < 16; i++) { const a = i / 16 * A.TAU; sctx.drawImage(TC, Math.cos(a) * R, Math.sin(a) * R); } sctx.filter = 'none';
    return { z, rot };
  }

  // ------------------------------------------------------------ captions
  const EMPH = { 'מנטפליקס': '#FF4A5E', 'מדיסני': '#5FB0FF', 'הספורט': '#3DDC84', 'ספורט': '#3DDC84', 'חיים': '#FF6B6B', 'השידורים': '#FF6B6B', 'שידורים': '#FF6B6B', 'תקיעות': GOLD, 'נקודה': GOLD, 'אנימה': '#FF7AD9', 'תורכיות': '#FFB347', 'קוריאניות': '#7DF2E6', 'חדש': '#7DF2E6', 'וצ\'רלטון': '#FF9A3D' };
  const chunks = (() => {
    const out = []; let cur = [];
    const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach((w, i) => {
      if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 17)) flush();
      cur.push(w);
      if (/[,?]$/.test(w.w)) flush();
    });
    flush(); return out;
  })();
  chunks.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; });
  function captions(t, yBase) {
    const ci = chunks.findIndex(c => t >= c.t0 - 0.02 && t < c.t1 + 0.08);
    if (ci < 0) return;
    const c = chunks[ci], age = t - c.t0;
    const big = c.some(w => /^(תקיעות|נקודה)/.test(w.w));
    const size = big ? 170 : 104;
    ctx.save(); ctx.direction = 'rtl'; ctx.font = `900 ${size}px Rubik`;
    const words = c.map(w => w.w.replace(/[,?]/g, '')); const gap = size * 0.4;
    const widths = words.map(s => ctx.measureText(s).width); let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    let fit = Math.min(1, 960 / total); total *= fit;
    const pop = eob(age / 0.22), sc0 = lerp(0.55, 1, pop), tilt = (hash(ci * 3.1) - 0.5) * 0.06 * (1 - eo(age / 0.3));
    ctx.translate(540, yBase); ctx.rotate(tilt); ctx.scale(sc0 * fit, sc0 * fit);
    const tot = total / fit; let x = tot / 2;   // RTL: first word at the right
    words.forEach((s, i) => {
      const w = c[i], wpx = widths[i], cx = x - wpx / 2, active = t >= w.t0 && t < w.t1 + 0.02, done = t >= w.t1;
      const wp = active ? 1 + 0.16 * Math.sin(clamp((t - w.t0) / 0.14) * Math.PI) : 1;
      const col = EMPH[s.replace(/^ו/, '') ] || EMPH[s] || (active ? YEL : '#fff');
      const fillc = big ? GOLD : (active || done) ? (EMPH[s] ? EMPH[s] : active ? YEL : '#fff') : '#fff';
      ctx.save(); ctx.translate(cx, 0); ctx.scale(wp, wp); ctx.font = `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.17; ctx.strokeStyle = INK; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; ctx.strokeText(s, 0, 0); ctx.shadowColor = 'transparent';
      ctx.fillStyle = active ? (EMPH[s] || YEL) : (EMPH[s] || '#fff'); if (!active && !EMPH[s] && !done) ctx.fillStyle = '#fff'; ctx.fillText(s, 0, 0); ctx.restore();
      x -= wpx + gap;
    });
    ctx.restore();
    // english gloss (house style): small line, words light up yellow
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (L) {
      ctx.save(); ctx.direction = 'ltr'; ctx.font = '600 34px Rubik';
      let tw = L.words.reduce((s, w) => s + ctx.measureText(w.w + ' ').width, 0); const y = yBase + (big ? 150 : 110), gs = Math.min(1, 980 / (tw + 52)); ctx.translate(540, y); ctx.scale(gs, gs); ctx.translate(-540, -y);
      ctx.fillStyle = 'rgba(12,8,28,0.55)'; A.rrect(ctx, 540 - tw / 2 - 26, y - 30, tw + 52, 60, 30); ctx.fill();
      let xx = 540 - tw / 2; for (const w of L.words) { A.text(ctx, w.w, xx, y + 2, { font: '600 34px Rubik', align: 'left', fill: t >= w.t ? YEL : 'rgba(255,255,255,.6)' }); xx += ctx.measureText(w.w + ' ').width; }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ b-roll card
  function card(t, f, span) {
    const [a, b] = span, u = t - a;
    A.renderFrame(f);
    // blurred fill from the scene itself
    tinyx.drawImage(sc, 656, 0, 608, 1080, 0, 0, 108, 192);
    ctx.save(); ctx.filter = 'brightness(.6) saturate(1.3)'; ctx.imageSmoothingQuality = 'high'; ctx.globalAlpha = 0.9; ctx.drawImage(tiny, 0, 0, W, H); ctx.restore();
    const isS4 = a > 25;
    const entry = eob(u / 0.32), exit = 1 - eio((t - (b - 0.18)) / 0.18);
    const s = lerp(0.35, 1, entry) * (isS4 ? 1.0 : 1);
    const cw = isS4 ? 1080 : 1000, ch = cw * 9 / 16, cy = isS4 ? 900 : 800;
    ctx.save(); ctx.translate(540, cy); ctx.rotate(lerp(-0.22, 0, entry) + Math.sin(t * 1.3) * 0.006); ctx.scale(s * (0.96 + 0.04 * exit), s * (0.96 + 0.04 * exit));
    if (isS4) { const k = Math.exp(-(t - 25.61) * 5); ctx.translate(Math.sin(t * 70) * 12 * k, Math.cos(t * 63) * 10 * k); }
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
    ctx.fillStyle = '#fff'; A.rrect(ctx, -cw / 2 - 12, -ch / 2 - 12, cw + 24, ch + 24, isS4 ? 8 : 44); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); A.rrect(ctx, -cw / 2, -ch / 2, cw, ch, isS4 ? 4 : 34); ctx.clip(); ctx.drawImage(sc, -cw / 2, -ch / 2, cw, ch); ctx.restore();
    ctx.restore();
    return { cy, ch };
  }
  function header(t, a) {   // top sticker while the host is off screen
    const u = t - a, p = eob(u / 0.4), bob = Math.sin(t * 3) * 6;
    ctx.save(); ctx.translate(540, 250 + bob); ctx.scale(lerp(0.2, 1, p), lerp(0.2, 1, p)); ctx.rotate(-0.03);
    ctx.font = '900 84px Rubik'; ctx.direction = 'rtl'; const txt = 'כל התוכן במקום אחד', w = ctx.measureText(txt).width + 90;
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = A.linear(ctx, 0, -70, 0, 70, [[0, '#FFE08A'], [1, '#FFAA1D']]); A.rrect(ctx, -w / 2, -70, w, 140, 70); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke(); A.text(ctx, txt, 0, 4, { font: '900 84px Rubik', fill: INK, dir: 'rtl' });
    ctx.restore();
  }

  // ------------------------------------------------------------ per-shot stickers
  function stickers(t, shot) {
    const k = shot.k, u = t - shot.t0;
    if (k === 'm1' || k === 'm2') {           // tornado of apps around the head
      const n = 12, freeze = t >= 2.0;
      for (let i = 0; i < n; i++) {
        const ph = freeze ? 2.0 * 1.1 + i : t * 1.1 + i, a = ph * 2.1 + i * 0.52, rad = 330 + 110 * Math.sin(i * 1.7 + (freeze ? 2.0 : t) * 1.4) + (freeze ? Math.sin(t * 4 + i) * 8 : 0);
        const x = 540 + Math.cos(a) * rad, y = 640 + Math.sin(a) * rad * 0.55 - 40, s = 0.55 + 0.25 * hash(i + 3), p = eob((t - 0.05 * i) / 0.3);
        tile(x, y, s * p, Math.sin(a) * 0.5, i, ['play', 'ball', 'star', 'heart', 'tv', 'play'][i % 6]);
        if (i % 4 === 0) spinner(x, y + 40 * s, 24 * s * p, t, '#fff', p * 0.9);
      }
      qmark(190, 470, eob((t - 0.25) / 0.3) * 1.0, -0.2); qmark(890, 560, eob((t - 0.75) / 0.3) * 1.15, 0.25, '#38D9F5'); qmark(300, 900, eob((t - 1.35) / 0.3) * 0.9, 0.15, '#FF4F9A');
      if (k === 'm2') qmark(830, 470, eob((t - 2.1) / 0.3) * 1.5, 0.12, '#FF4F9A');
    }
    if (k === 'm3' || k === 'm4') {
      const b = clamp((t - 3.05) / 0.55);
      if (t < 3.6) for (let i = 0; i < 12; i++) { const a = i * 2.1 + 0.5, rad = lerp(400, 0, eio(b)), x = 540 + Math.cos(a + b * 5) * rad, y = 640 + Math.sin(a + b * 5) * rad * 0.55; tile(x, y, 0.7 * (1 - b), a, i, 'play'); }
      flash(t, 3.05, 0.35, '#FFF4D8', 0.95);
      confetti(t, 3.1, 540, 700, 60, 700, 3);
      for (let i = 0; i < 7; i++) sparkle(180 + hash(i) * 720, 380 + hash(i + 9) * 700, 24 + 30 * hash(i + 4) * Math.abs(Math.sin(t * 5 + i)), '#fff', t * 2 + i);
    }
    if (k === 'm5') {
      const p = eob(u / 0.35); ctx.save(); ctx.translate(830, 430); ctx.rotate(0.2); ctx.scale(p * (1 + 0.06 * Math.sin(t * 9)), p * (1 + 0.06 * Math.sin(t * 9)));
      D.starburst(ctx, 0, 0, 150, 200, 14, t * 0.6, '#FF4F9A'); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); A.text(ctx, 'חדש!', 0, 6, { font: '900 100px Rubik', fill: '#fff', stroke: INK, lw: 14, dir: 'rtl' }); ctx.restore();
      for (let i = 0; i < 6; i++) { const p2 = eob((t - shot.t0 - 0.12 * i) / 0.3), x = 130 + (i % 3) * 400 + (i > 2 ? 60 : 0), y = i < 3 ? 1010 : 1160; tile(x, y, 0.6 * p2, (i - 2.5) * 0.09, i + 2, ['play', 'star', 'heart', 'ball', 'tv', 'play'][i]); }
      for (let i = 0; i < 6; i++) sparkle(150 + hash(i + 20) * 780, 350 + hash(i + 30) * 800, 26 * Math.abs(Math.sin(t * 6 + i)), '#fff', t);
    }
    if (k === 'm6') {   // suspense: heartbeat vignette + a spinner that creeps in
      const hb = Math.pow(Math.max(0, Math.sin(t * 7.5)), 6), gr = ctx.createRadialGradient(540, 960, 500, 540, 960, 1150);
      gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(1, `rgba(255,40,60,${0.10 + 0.32 * hb * clamp((t - 23.9) / 1.2)})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      const p = clamp((t - 24.85) / 0.5); if (p > 0) spinner(880, 1100, 60 * eo(p), t * 0.7, '#fff', p);
    }
    if (k === 'm7') {   // the OK button press
      const p = eob((t - 30.6) / 0.25), press = 1 - 0.15 * Math.exp(-Math.pow((t - 30.72) * 14, 2));
      ctx.save(); ctx.translate(540, 1210); ctx.scale(p * press, p * press);
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; ctx.beginPath(); ctx.arc(0, 0, 150, 0, A.TAU); ctx.fillStyle = A.radial(ctx, -30, -40, 20, 170, [[0, '#FFE08A'], [1, '#FFA51A']]); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
      ctx.shadowColor = 'transparent'; A.text(ctx, 'OK', 0, 8, { font: '900 110px Rubik', fill: INK }); ctx.restore();
      for (let i = 0; i < 3; i++) { const q = (t - 30.72 - i * 0.12) / 0.7; if (q > 0 && q < 1) ring(540, 1210, 150 + q * 380, 14 * (1 - q), '#FFE08A', 1 - q); }
      flash(t, 30.72, 0.25, '#fff', 0.4);
    }
    if (k === 'm8') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU + t * 0.9, x = 540 + Math.cos(a) * 430, y = 700 + Math.sin(a) * 250, p = eob((t - 32.04 - i * 0.07) / 0.3); tile(x, y, 0.7 * p, Math.sin(a) * 0.4, i, ['play', 'ball', 'star', 'heart', 'tv', 'play', 'ball', 'star'][i]); }
      confetti(t, 32.1, 540, 640, 30, 500, 9);
    }
    if (k === 'm9') {
      [[33.55, 190, 470, -0.14], [33.95, 890, 520, 0.12], [34.4, 200, 980, 0.1]].forEach(([t0, x, y, r], i) => { const p = eob((t - t0) / 0.3); if (p > 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(p * 1.7, p * 1.7); D.LIVE(ctx, 0, 0, 1, t); ctx.restore(); ring(x, y, 150 * eo((t - t0) / 0.5), 8, '#FF4A3D', 1 - clamp((t - t0) / 0.5)); } });
      for (let i = 0; i < 6; i++) sparkle(120 + hash(i + 50) * 840, 360 + hash(i + 60) * 900, 30 * Math.abs(Math.sin(t * 6 + i)), '#fff', t);
    }
    if (k === 'm10') {
      const sp = clamp((t - 35.9) / 0.25) * (t < 36.3 ? 1 : 0); if (sp > 0) spinner(880, 1010, 86, t, '#fff', sp);
      if (t >= 36.3) { const q = (t - 36.3) / 0.6; ring(880, 1010, 60 + q * 330, 16 * (1 - clamp(q)), '#FF4A3D', 1 - clamp(q)); if (q < 1) { const r = rng(4); for (let i = 0; i < 26; i++) { const a = r() * A.TAU, v = 200 + r() * 600; sparkle(880 + Math.cos(a) * v * q, 1010 + Math.sin(a) * v * q, 16 * (1 - q), '#fff', i); } } }
      flash(t, 36.2, 0.3, '#FFF4D8', 0.8);
      for (let i = 0; i < 8; i++) sparkle(100 + hash(i + 70) * 880, 300 + hash(i + 80) * 900, 34 * Math.abs(Math.sin(t * 7 + i)), '#fff', t);
    }
  }
  function endText(t) {
    if (t < 36.2) return;
    const a = eob((t - 36.2) / 0.3), b = eob((t - 36.55) / 0.3);
    const line = (txt, y, sz, col, p) => { if (p <= 0) return; ctx.save(); ctx.translate(540, y); ctx.scale(p, p); ctx.rotate((1 - p) * 0.15); ctx.lineJoin = 'round'; ctx.lineWidth = sz * 0.2; ctx.strokeStyle = INK; ctx.font = `900 ${sz}px Rubik`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.strokeText(txt, 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore(); };
    line('כל התוכן.', 1370, 168, '#fff', a); line('בלי תקיעות.', 1560, 190, GOLD, b);
  }

  // ------------------------------------------------------------ transitions & glitch
  function whipFlash(t) { flash(t, 4.98, 0.35, '#fff', 0.9); flash(t, 18.78, 0.25, '#fff', 0.7); flash(t, 20.62, 0.25, '#fff', 0.6); flash(t, 23.88, 0.25, '#000', 0.7); flash(t, 25.61, 0.45, '#fff', 1.0); flash(t, 30.1, 0.3, '#fff', 0.8); }
  function shockwave(t) { const q = (t - 25.61) / 0.7; if (q > 0 && q < 1) { ring(540, 900, q * 900, 40 * (1 - q), '#fff', 1 - q); ring(540, 900, q * 620, 20 * (1 - q), GOLD, 1 - q); } }
  function glitch(t) {
    if (t < 25.15 || t > 25.5) return; const r = rng(Math.floor(t * 30)); fxx.clearRect(0, 0, W, H); fxx.drawImage(cv, 0, 0);
    ctx.save(); for (let i = 0; i < 9; i++) { const y = r() * H, h = 30 + r() * 140, dx = (r() - .5) * 140; ctx.drawImage(fx, 0, y, W, h, dx, y, W, h); } ctx.globalAlpha = 0.25; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fx, 8, 0); ctx.restore();
    if (t > 25.32) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#888'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // ------------------------------------------------------------ frame
  async function draw(f) {
    const t = f / FPS;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    if (t >= 25.5 && t < 25.61) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
    const span = animAt(t), shot = shotAt(t);
    if (span) {
      bg(t, 0); if (span[0] < 25) rays(540, 800, t, '#FFE08A', 0.07);
      const c = card(t, f, span); if (span[0] < 25) header(t, span[0]); else if (t > 26.6) header(t, 26.6);
      captions(t, span[0] > 25 ? 1440 : 1400);
      shockwave(t);
    } else if (shot) {
      const dark = shot.k === 'm6' ? clamp((t - 23.9) / 1.0) * 0.55 : 0; bg(t, dark);
      if (shot.k === 'm3' || shot.k === 'm4') rays(540, 700, t, '#FFE08A', 0.16 * eo((t - 3.1) / 0.4)); if (shot.k === 'm10') rays(540, 800, t, '#FFE08A', 0.2 * eo((t - 36.2) / 0.3));
      const man = await drawMan(t, shot);
      if (man) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.drawImage(SC, 0, 0); ctx.restore(); ctx.drawImage(TC, 0, 0); }
      stickers(t, shot);
      if (t < 36.2) captions(t, 1450);
      endText(t);
    }
    whipFlash(t); glitch(t);
    // top progress bar + vignette + fade
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0, 0, W, 10); ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W * clamp(t / 36.9), 10);
    const fb = Math.max(1 - inv(0, 0.25, t), inv(36.65, 37.0, t)); if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
  }
  window.YT = { draw, W, H, FPS, chunks };
  window.ytReady = document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '900 20px Rubik', '20px Bangers'].map(f => document.fonts.load(f, 'אבג abc'))));
})();
