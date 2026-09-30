// CL: "LIQUID POP" kit for the ConnectTV film. Global `CL`. Every function is a pure function of time.
// Look: deep navy night, candy-liquid splashes (pink, orange, lime, cyan, purple), glossy gel cards with a white
// highlight, lightning bolts, sparkles. All motion smooth at 30 fps (springs, overshoot, flowing drift). Matches the logo.
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const W = 1920, H = 1080;
  const CL = (window.CL = {});
  CL.W = W; CL.H = H;
  CL.C = { ink: '#050826', navy0: '#070B2E', navy: '#0B1250', indigo: '#1A1F7A', pink: '#FF2E93', orange: '#FF8A1F', yellow: '#FFD23F', lime: '#7CFF3A', green: '#19D68B', cyan: '#19C8FF', blue: '#2F6BFF', purple: '#8B3DFF', white: '#FFFFFF', cream: '#FFF6E6', red: '#FF3B4E' };
  const C = CL.C; CL.CAND = [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.purple, C.green, C.blue];   // candy cycle

  // ---------- time helpers (smooth)
  CL.qs = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;          // discrete step: ONLY for random seeds (sparks/flicker)
  CL.q = t => t;
  CL.j = (t, seed = 0, amp = 3) => { const a = amp * .55; return [A.noise1(t * 1.3 + seed * 7.7) * a, A.noise1(t * 1.1 + seed * 2.9 + 40) * a, A.noise1(t * .9 + seed * 4.1 + 90) * a * .003]; };   // [dx, dy, rot]
  CL.pop = (t, t0, dur = .3) => { const u = (t - t0) / dur; if (u <= 0) return 0; if (u >= 1) return 1; return Math.max(.001, ease.outBack(u)); };      // 0 -> overshoot -> 1
  CL.spring = (t, t0, dur = .7) => { const u = (t - t0) / dur; if (u <= 0) return 0; if (u >= 1) return 1; return Math.max(0, ease.outElastic(u)); };
  CL.smoothPop = (t, t0, dur = .35) => ease.outBack(clamp((t - t0) / dur));
  CL.shake = (t, t0, dur = .5, amp = 14) => { const u = t - t0; if (u < 0 || u > dur) return [0, 0]; const k = Math.exp(-u * 6 / dur) * amp; return [Math.sin(u * 91) * k, Math.cos(u * 77) * k]; };
  CL.layer = (key, w, h, draw) => A.layer(key, w, h, draw);
  CL.noCap = [[999, 999]]; CL.capY = 905;

  // ---------- logos (real brand logos as transparent PNGs) + ConnectTV brand assets
  const FILES = { netflix: 'netflix.png', disney: 'disney-plus.png', appletv: 'apple-tv-plus.png', prime: 'amazon-prime-video.png', hbo: 'hbo-max.png', hulu: 'hulu.png', paramount: 'paramount-plus.png',
    sport5: '5sport-il.png', sport5live: '5live-il.png', sport5plus: '5plus-il.png', sport5gold: '5gold-il.png', sport5stars: '5stars-il.png', sport5_4k: '5sport4k-il.png', hotzone: 'hot-zone-il.png',
    sport1: 'sport1-il.png', sport2: 'sport2-il.png', sport3: 'sport3-il.png', sport4: 'sport4-il.png', one: 'one-il.png', one2: 'one2-il.png',
    kan11: 'kan11-il.png', keshet12: 'keshet12-il.png', reshet13: 'reshet13-il.png', ch14: 'channel14-il.png', ch9: 'channel9-il.png', i24: 'i24-news-il.png', yes: 'yes-israel-il.png', yesbrand: 'yes-brand.png', hotbrand: 'hot-brand.png', hot: 'hot3-il.png',
    ctv_icon: 'connecttv_icon.png', ctv_text: 'connecttv_text.png' };   // ctv_icon 700x613 (TV + splash + bolt, transparent), ctv_text 700x128 ("ConnectTV" wordmark, cream, transparent)
  const IMGS = {}; CL.logoNames = Object.keys(FILES);
  CL.logosReady = Promise.all(Object.entries(FILES).map(([k, f]) => new Promise(res => { const im = new Image(); im.onload = () => { IMGS[k] = im; res(); }; im.onerror = () => res(); im.src = 'assets/logos/' + f; })));
  CL.logoImg = k => IMGS[k] || null;
  const silCache = new Map();
  CL.silhouette = (img, color = '#fff') => { const k = (img.__id || (img.__id = 'i' + img.src.length + img.width + img.src.slice(-14))) + color; let s = silCache.get(k); if (s) return s; s = document.createElement('canvas'); s.width = img.width; s.height = img.height; const g = s.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, s.width, s.height); silCache.set(k, s); return s; };
  // the ConnectTV logo. mode 'icon' | 'text' | 'full' (icon above wordmark). Drawn centred at (cx,cy) with width w. o {rot, alpha}
  CL.brand = (ctx, cx, cy, w, mode = 'full', o = {}) => {
    const I = IMGS.ctv_icon, T = IMGS.ctv_text; if (!I || !T) return; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.globalAlpha *= o.alpha ?? 1;
    if (mode === 'icon') { const s = w / I.width; ctx.drawImage(I, -w / 2, -I.height * s / 2, w, I.height * s); }
    else if (mode === 'text') { const s = w / T.width; ctx.drawImage(T, -w / 2, -T.height * s / 2, w, T.height * s); }
    else { const s = w / 700, hI = I.height * s, hT = T.height * s, tot = hI + hT * .9; ctx.drawImage(I, -w / 2, -tot / 2, w, hI); ctx.drawImage(T, -w / 2, -tot / 2 + hI - hT * .1, w, hT); }
    ctx.restore();
  };

  // ---------- backgrounds
  // CL.bg(ctx, t, o): navy night with slow drifting candy colour clouds + fine dot grid + vignette. o {tint:[c1,c2,c3], base:'#..', speed}
  CL.bg = (ctx, t, o = {}) => {
    const base = o.base || C.navy, tint = o.tint || [C.purple, C.pink, C.cyan], sp = o.speed ?? .25;
    const st = CL.layer('bg_' + base, W, H, (g) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.navy0); gr.addColorStop(.5, base); gr.addColorStop(1, C.navy0); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 20; y < H; y += 44) for (let x = 20 + ((y / 44) % 2) * 22; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2.2, 0, A.TAU); g.fill(); } });
    ctx.drawImage(st, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    tint.forEach((col, i) => { const x = W * (.5 + .42 * Math.sin(t * sp * (.7 + i * .23) + i * 2.1)), y = H * (.5 + .38 * Math.cos(t * sp * (.6 + i * .19) + i * 1.3)), r = 760 + 120 * Math.sin(t * .5 + i); ctx.fillStyle = A.radial(ctx, x, y, 0, r, [[0, A.hex(col, .30)], [1, A.hex(col, 0)]]); ctx.fillRect(x - r, y - r, r * 2, r * 2); });
    ctx.restore();
  };
  CL.vignette = (ctx, a = .55) => { const v = CL.layer('vig' + a, W, H, g => { const gr = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .62); gr.addColorStop(0, 'rgba(3,5,24,0)'); gr.addColorStop(1, `rgba(3,5,24,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); ctx.drawImage(v, 0, 0); };

  // ---------- liquid: splash burst. p 0..1 expansion (use CL.spring for a bouncy burst). cols default candy. Returns nothing.
  CL.splash = (ctx, cx, cy, R, p, seed = 1, cols) => {
    if (p <= 0) return; cols = cols || CL.CAND; const rg = rng(seed * 13 + 5), N = 11 + Math.floor(rg() * 5);
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < N; i++) {
      const a = i / N * A.TAU + rg() * .35, len = R * (.55 + rg() * .55) * p, wid = R * (.10 + rg() * .10) * Math.min(1, p * 1.3), col = cols[i % cols.length], wob = Math.sin(a * 3 + seed) * .06;
      ctx.save(); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(R * .12, -wid * .5); ctx.quadraticCurveTo(len * .55, -wid * (1.1 + wob), len, 0); ctx.quadraticCurveTo(len * .55, wid * (1.1 - wob), R * .12, wid * .5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(len * .5, -wid * .28, len * .17, wid * .12, 0, 0, A.TAU); ctx.fill();
      const dr = wid * (.55 + rg() * .5); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(len * (1.08 + rg() * .18), (rg() - .5) * wid, dr * Math.min(1, p * 1.5), 0, A.TAU); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = cols[seed % cols.length]; ctx.beginPath(); ctx.arc(0, 0, R * .32 * p, 0, A.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-R * .09 * p, -R * .12 * p, R * .1 * p, R * .05 * p, -.6, 0, A.TAU); ctx.fill();
    ctx.restore();
  };
  // a single glossy liquid drop / blob at (x,y) radius r, colour col (jelly wobble via t)
  CL.drop = (ctx, x, y, r, col, t = 0, seed = 0) => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * A.TAU; pts.push([x + Math.cos(a) * r * (1 + .12 * Math.sin(t * 2.4 + i * 1.7 + seed)), y + Math.sin(a) * r * (1 + .12 * Math.cos(t * 2.1 + i * 1.3 + seed))]); }
    ctx.save(); A.blob(ctx, pts); ctx.fillStyle = A.radial(ctx, x - r * .3, y - r * .35, r * .1, r * 1.2, [[0, '#ffffff'], [.18, col], [1, A.mixc('#050826', col.startsWith('#') ? col : '#ff2e93', .55)]]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x - r * .32, y - r * .4, r * .22, r * .11, -.7, 0, A.TAU); ctx.fill(); ctx.restore();
  };
  // expanding shockwave ring. p 0..1
  CL.ring = (ctx, x, y, r, p, col = '#fff', lw = 16) => { if (p <= 0 || p >= 1) return; ctx.save(); ctx.globalAlpha *= 1 - p; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - p * .7); ctx.beginPath(); ctx.arc(x, y, r * ease.out(p), 0, A.TAU); ctx.stroke(); ctx.restore(); };

  // ---------- lightning bolt from (x0,y0) to (x1,y1). p 0..1 draws it on; seed = shape. o {col, lw, glow}
  CL.bolt = (ctx, x0, y0, x1, y1, p, seed = 1, o = {}) => {
    if (p <= 0) return; const rg = rng(seed * 7 + 3), n = 9, pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let i = 1; i < n; i++) { const k = i / n, j = (rg() - .5) * L * .16; pts.push([x0 + dx * k + nx * j, y0 + dy * k + ny * j]); } pts.push([x1, y1]);
    const m = Math.max(2, Math.floor(pts.length * clamp(p)) + 1), lw = o.lw || 14, col = o.col || C.cyan;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter';
    [[lw * 3.2, .18, col], [lw * 1.8, .35, col], [lw, .9, '#ffffff']].forEach(([w, a, c]) => { ctx.globalAlpha = a * (o.alpha ?? 1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.slice(0, m).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
    ctx.restore();
  };
  // 4-point sparkle
  CL.spark = (ctx, x, y, s, rot = 0, col = '#fff') => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .12, -s * .12, s, 0); ctx.quadraticCurveTo(s * .12, s * .12, 0, s); ctx.quadraticCurveTo(-s * .12, s * .12, -s, 0); ctx.quadraticCurveTo(-s * .12, -s * .12, 0, -s); ctx.fill(); ctx.restore(); };
  // n twinkling sparkles inside a rect (deterministic)
  CL.twinkle = (ctx, t, x, y, w, h, n = 14, seed = 1, cols) => { cols = cols || ['#fff', C.cyan, C.yellow, C.pink]; for (let i = 0; i < n; i++) { const k = .5 + .5 * Math.sin(t * (1.6 + hash(i + seed) * 2.2) + i * 3.1); CL.spark(ctx, x + hash(i * 3.3 + seed) * w, y + hash(i * 5.1 + seed) * h, (8 + hash(i + 9) * 22) * k, t * .4 + i, cols[i % cols.length]); } };

  // ---------- gel UI: glossy rounded panel. o {fill, rot, scale, alpha, shadow, rim, gloss}
  CL.gel = (ctx, cx, cy, w, h, o = {}) => {
    const r = o.r ?? Math.min(w, h) * .26, col = o.fill || C.white, dark = o.dark || A.mixc(col, '#0b1250', .28);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    const sh = o.shadow ?? 16; if (sh) { ctx.fillStyle = 'rgba(2,4,30,.42)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 4, -h / 2 + sh * .8, w, h, r); ctx.fill(); }
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, col], [.55, col], [1, dark]]); ctx.fill();
    ctx.lineWidth = o.rimW ?? 5; ctx.strokeStyle = o.rim || 'rgba(255,255,255,.8)'; ctx.stroke();
    if (o.gloss !== false) { ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.clip(); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, 0, [[0, 'rgba(255,255,255,.62)'], [1, 'rgba(255,255,255,.05)']]); ctx.beginPath(); ctx.ellipse(0, -h * .28, w * .47, h * .3, 0, 0, A.TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
  };
  // real logo on a white gel card. o {rot, scale, alpha, fill, pad, shadow}
  CL.logoCard = (ctx, k, cx, cy, w, h, o = {}) => {
    const im = IMGS[k]; ctx.save(); CL.gel(ctx, cx, cy, w, h, { fill: o.fill || '#ffffff', dark: o.dark || '#cfd6ff', rot: o.rot, scale: o.scale, alpha: o.alpha, shadow: o.shadow, r: o.r, rim: o.rim });
    if (im) { ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1; const p = o.pad ?? .16, s = Math.min(w * (1 - p * 2) / im.width, h * (1 - p * 2) / im.height); ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); }
    ctx.restore();
  };
  // logo with a bright rim/outline sticker glow (for logos that are white or light, on dark bg): draws colour silhouette behind
  CL.logoGlow = (ctx, k, cx, cy, w, h, o = {}) => { const im = IMGS[k]; if (!im) return; const s = Math.min(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.globalAlpha *= o.alpha ?? 1; ctx.globalCompositeOperation = 'lighter'; const sil = CL.silhouette(im, o.col || C.cyan); for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU; ctx.globalAlpha *= .12; ctx.drawImage(sil, -dw / 2 + Math.cos(a) * 10, -dh / 2 + Math.sin(a) * 10, dw, dh); ctx.globalAlpha = (o.alpha ?? 1); } ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh); ctx.restore(); };

  // ---------- typography: glossy candy title. o {size, fill:[top,bottom], outline, rot, scale, font, dir, shadowCol}
  CL.title = (ctx, s, cx, cy, o = {}) => {
    const size = o.size || 150; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = o.font || `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    const sh = size * .07, f = o.fill || ['#ffffff', '#ffd23f'];
    ctx.strokeStyle = o.shadowCol || 'rgba(2,4,30,.5)'; ctx.lineWidth = size * .26; ctx.strokeText(s, sh * .6, sh * 1.6);
    ctx.strokeStyle = o.outline || C.ink; ctx.lineWidth = size * .2; ctx.strokeText(s, 0, 0);
    ctx.fillStyle = A.linear(ctx, 0, -size * .5, 0, size * .55, [[0, f[0]], [.46, f[0]], [.5, A.mixc(f[0], f[1], .55)], [1, f[1]]]); ctx.fillText(s, 0, 0);
    ctx.restore();
  };
  // caption / label chip: gel pill with text. o {size, fill, ink, rot, scale, dir, font, pad}
  CL.chip = (ctx, s, cx, cy, o = {}) => {
    const size = o.size || 96, font = o.font || `900 ${size}px Rubik`; ctx.save(); ctx.font = font; ctx.direction = o.dir || 'rtl'; const tw = ctx.measureText(s).width, pad = o.pad ?? size * .3, w = tw + pad * 2, h = size * 1.28; ctx.restore();
    CL.gel(ctx, cx, cy, w, h, { fill: o.fill || '#ffffff', dark: o.dark, rot: o.rot, scale: o.scale, alpha: o.alpha, shadow: o.shadow ?? 10, r: h * .5, rim: o.rim });
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.fillStyle = o.ink || C.ink; ctx.fillText(s, 0, size * .04); ctx.restore(); return { w, h };
  };

  // ---------- the TV from the logo: glossy blue bezel, antennas with balls, screen. draw(ctx, sw, sh) paints screen content (clipped, origin at screen centre).
  // o {rot, scale, body:'#2F6BFF', chin, antenna:true, glare:true}
  CL.tv = (ctx, cx, cy, w, h, draw, o = {}) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.antenna !== false) { ctx.strokeStyle = '#8a7bff'; ctx.lineWidth = w * .028; ctx.lineCap = 'round'; const aw = Math.sin((o.t || 0) * 3) * w * .012; [[-.14, -.18], [.1, .2]].forEach(([a, b], i) => { ctx.beginPath(); ctx.moveTo(w * (i ? .02 : -.02), -h / 2 + 4); ctx.lineTo(w * a * (i ? 2.2 : 1.6) + aw, -h / 2 - h * (i ? .3 : .36)); ctx.stroke(); ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(w * a * (i ? 2.2 : 1.6) + aw, -h / 2 - h * (i ? .3 : .36), w * .04, 0, A.TAU); ctx.fill(); }); }
    const r = Math.min(w, h) * .18; ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, -h / 2 + 22, w, h, r); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fillStyle = A.linear(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, '#4aa8ff'], [.5, o.body || C.blue], [1, '#4a1fb8']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
    const m = w * .07, sw = w - m * 2, sh = h - m * 2 - (o.chin ?? 0); ctx.save(); ctx.translate(0, -(o.chin ?? 0) / 2); ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, sh, r * .6); ctx.clip(); ctx.fillStyle = '#0a1450'; ctx.fillRect(-sw / 2, -sh / 2, sw, sh); if (draw) draw(ctx, sw, sh);
    if (o.glare !== false) { ctx.fillStyle = A.linear(ctx, -sw / 2, -sh / 2, sw / 2, sh / 2, [[0, 'rgba(255,255,255,.22)'], [.4, 'rgba(255,255,255,.04)'], [.41, 'rgba(255,255,255,0)']]); ctx.fillRect(-sw / 2, -sh / 2, sw, sh); } ctx.restore(); ctx.restore();
  };
  // cover-fit an image into a w x h box centred at origin (for screens)
  CL.fit = (ctx, img, w, h) => { if (!img) return; const s = Math.max(w / img.width, h / img.height); ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); };
  // liquid wipe transition: candy waves sweep across the frame. p 0..1. dir 'up'|'down'|'left'|'right'. Returns nothing; draws coloured wave bands (cover) - draw the NEW scene under, wipe on top, or use as reveal mask by clipping in scene code.
  CL.wave = (ctx, p, o = {}) => { if (p <= 0 || p >= 1) return; const cols = o.cols || [C.pink, C.orange, C.purple, C.cyan], N = cols.length; ctx.save(); const vert = (o.dir || 'up') === 'up' || o.dir === 'down';
    for (let i = 0; i < N; i++) { const pp = clamp(p * 1.35 - i * .12), e = ease.inOut(pp), edge = (vert ? H : W) * (1 - e) * 1.25 - 200, amp = 70; ctx.fillStyle = cols[i]; ctx.beginPath();
      if (vert) { const yb = o.dir === 'down' ? H - edge : edge; ctx.moveTo(0, o.dir === 'down' ? 0 : H); for (let x = 0; x <= W + 30; x += 30) ctx.lineTo(x, yb + Math.sin(x * .012 + i * 2 + p * 7) * amp); ctx.lineTo(W, o.dir === 'down' ? 0 : H); } else { const xb = o.dir === 'right' ? W - edge : edge; ctx.moveTo(o.dir === 'right' ? 0 : W, 0); for (let y = 0; y <= H + 30; y += 30) ctx.lineTo(xb + Math.sin(y * .012 + i * 2 + p * 7) * amp, y); ctx.lineTo(o.dir === 'right' ? 0 : W, H); }
      ctx.closePath(); ctx.fill(); } ctx.restore(); };
})();
