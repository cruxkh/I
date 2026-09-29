// CL: PAPER COLLAGE / STOP-MOTION kit for the GOTV v5 film. Global `CL`. Everything is a pure function of time.
// Look: kraft + cream paper, torn edges, tape, white die-cut sticker outlines, marker scribbles, halftone dots,
// and "boiling" 12 fps jitter on decorations (stop-motion feel). No blur, no glow, no gradients-on-everything.
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const W = 1080, H = 1920;
  const CL = (window.CL = {});
  CL.W = W; CL.H = H;
  // palette: kraft paper world + Maccabi Tel Aviv yellow/blue + tomato accent
  CL.C = { kraft: '#D9C3A0', kraftDk: '#BFA37A', cream: '#F4ECD8', white: '#FFFDF6', ink: '#141414', yellow: '#FFD60A', blue: '#1F4FFF', navy: '#0B1F5C', red: '#FF3B30', pink: '#FF7AB8', green: '#2BC48A', orange: '#FF8A1F' };
  const C = CL.C;

  // ---------- stop-motion helpers
  CL.STEP = 12;                                            // decoration frame rate
  CL.q = (t, fps = CL.STEP) => Math.floor(t * fps + 1e-6) / fps;   // quantised time
  CL.j = (t, seed = 0, amp = 3, fps = CL.STEP) => { const k = Math.floor(t * fps + 1e-6); return [(hash(k * 3.1 + seed * 7.7) - .5) * 2 * amp, (hash(k * 5.3 + seed * 2.9 + 40) - .5) * 2 * amp, (hash(k * 1.7 + seed * 4.1 + 90) - .5) * 2 * amp * .004]; };   // [dx, dy, rot(rad)]
  // stepped pop-in: 0 -> 1.18 -> 0.94 -> 1 in ~4 stop-motion frames after t0
  CL.pop = (t, t0, dur = .3) => { const u = (t - t0) / dur; if (u <= 0) return 0; if (u >= 1) return 1; const k = Math.floor(u * 4); return [0.45, 1.16, .93, 1.03][k]; };
  CL.smoothPop = (t, t0, dur = .35) => ease.outBack(clamp((t - t0) / dur));
  CL.shake = (t, t0, dur = .5, amp = 14) => { const u = t - t0; if (u < 0 || u > dur) return [0, 0]; const k = Math.exp(-u * 6 / dur) * amp, q = CL.q(t, 24); return [Math.sin(q * 91) * k, Math.cos(q * 77) * k]; };

  // ---------- caches
  const cache = new Map();
  CL.layer = (key, w, h, draw) => { let c = cache.get(key); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); cache.set(key, c); } return c; };

  // ---------- paper backgrounds: kind = 'kraft' | 'cream' | 'yellow' | 'blue' | 'ink' | 'red' | 'grid'
  const PAPER = { kraft: [C.kraft, C.kraftDk], cream: [C.cream, '#E5D9BC'], yellow: [C.yellow, '#F0B800'], blue: [C.blue, '#1636C8'], ink: ['#1c1c22', '#0d0d12'], red: [C.red, '#D42418'], grid: [C.cream, '#CFC3A6'] };
  CL.paper = (ctx, kind = 'kraft', o = {}) => {
    const key = 'paper:' + kind, [a, b] = PAPER[kind] || PAPER.kraft;
    const cv = CL.layer(key, W, H, (g) => {
      g.fillStyle = a; g.fillRect(0, 0, W, H); const r = rng(kind.length * 31 + 7);
      for (let i = 0; i < 2600; i++) { g.globalAlpha = .05 + r() * .08; g.fillStyle = r() > .5 ? b : '#fff'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }        // speckle
      g.globalAlpha = .10; g.strokeStyle = b; g.lineWidth = 1; for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, l = 12 + r() * 40, an = r() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l * .3); g.stroke(); }   // fibres
      g.globalAlpha = 1;
      if (kind === 'grid') { g.strokeStyle = 'rgba(30,60,140,.16)'; g.lineWidth = 2; for (let x = 0; x <= W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
      const v = g.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,0,.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    });
    ctx.drawImage(cv, 0, 0);
    if (o.dots) CL.halftone(ctx, 0, 0, W, H, o.dots, o.dotSize || 26, .5, { alpha: o.dotAlpha ?? .16, fade: o.dotFade || 'none' });
  };

  // ---------- torn / rough shapes
  // rough polygon around rect with jagged, slightly wavy edges. Returns nothing; leaves a path on ctx.
  CL.tornPath = (ctx, x, y, w, h, o = {}) => {
    const r = rng((o.seed || 1) * 13 + 3), step = o.step || 26, amp = o.rough ?? 6, pts = [];
    const edge = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([lerp(x0, x1, t) + (r() - .5) * amp * 2, lerp(y0, y1, t) + (r() - .5) * amp * 2]); } };
    edge(x, y, x + w, y, Math.max(2, Math.round(w / step))); edge(x + w, y, x + w, y + h, Math.max(2, Math.round(h / step)));
    edge(x + w, y + h, x, y + h, Math.max(2, Math.round(w / step))); edge(x, y + h, x, y, Math.max(2, Math.round(h / step)));
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  };
  // paper scrap: torn rect with white torn margin, hard shadow. o {fill, seed, rot, shadow, border}
  CL.scrap = (ctx, cx, cy, w, h, o = {}) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale) ctx.scale(o.scale, o.scale);
    const sh = o.shadow ?? 12; if (sh) { ctx.fillStyle = 'rgba(40,20,0,.28)'; CL.tornPath(ctx, -w / 2 + sh * .7, -h / 2 + sh, w, h, { seed: o.seed, rough: o.rough }); ctx.fill(); }
    if (o.border !== 0) { ctx.fillStyle = C.white; CL.tornPath(ctx, -w / 2 - 8, -h / 2 - 8, w + 16, h + 16, { seed: (o.seed || 1) + 5, rough: o.rough ?? 6 }); ctx.fill(); }
    ctx.fillStyle = o.fill || C.cream; CL.tornPath(ctx, -w / 2, -h / 2, w, h, { seed: o.seed, rough: o.rough }); ctx.fill();
    if (o.draw) { ctx.save(); CL.tornPath(ctx, -w / 2, -h / 2, w, h, { seed: o.seed, rough: o.rough }); ctx.clip(); o.draw(ctx, w, h); ctx.restore(); }
    ctx.restore();
  };
  CL.tape = (ctx, cx, cy, rot = -.2, w = 150, h = 46, col = 'rgba(255,240,150,.82)') => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); const z = 5;
    ctx.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 6; i++) ctx.lineTo(-w / 2 + (i % 2 ? -z : z), -h / 2 + h * i / 6); ctx.lineTo(w / 2, h / 2);
    for (let i = 6; i >= 0; i--) ctx.lineTo(w / 2 + (i % 2 ? z : -z), -h / 2 + h * i / 6); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .25; ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 + 10, -h / 2 + 8, w - 20, 5); ctx.restore();
  };

  // ---------- die-cut sticker outline of any drawable (image/canvas): white border + shadow
  const silCache = new Map();
  CL.silhouette = (img, color = '#ffffff') => {
    const k = (img.__id || (img.__id = 'i' + Math.random().toString(36).slice(2))) + color; let s = silCache.get(k); if (s) return s;
    s = document.createElement('canvas'); s.width = img.width; s.height = img.height; const g = s.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, s.width, s.height); silCache.set(k, s); return s;
  };
  // draw image at centre (cx,cy) fitted to w x h with sticker border. o {rot, border, color, shadow, alpha, flip}
  CL.sticker = (ctx, img, cx, cy, w, h, o = {}) => {
    if (!img) return; const s = Math.min(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s, B = o.border ?? 12;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.flip) ctx.scale(-1, 1); ctx.globalAlpha *= o.alpha ?? 1;
    const sil = CL.silhouette(img, o.color || '#ffffff'), sh = o.shadow ?? 14;
    if (sh) { ctx.globalAlpha *= .3; const dark = CL.silhouette(img, '#3a2200'); for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU; ctx.drawImage(dark, -dw / 2 + Math.cos(a) * B + sh * .6, -dh / 2 + Math.sin(a) * B + sh, dw, dh); } ctx.globalAlpha = (o.alpha ?? 1); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * A.TAU; ctx.drawImage(sil, -dw / 2 + Math.cos(a) * B, -dh / 2 + Math.sin(a) * B, dw, dh); }
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh); ctx.restore(); return { w: dw, h: dh };
  };

  // ---------- real logos (transparent PNGs from the public tv-logos collection)
  const FILES = { netflix: 'netflix.png', disney: 'disney-plus.png', appletv: 'apple-tv-plus.png', prime: 'amazon-prime-video.png', hbo: 'hbo-max.png', hulu: 'hulu.png', paramount: 'paramount-plus.png',
    sport5: '5sport-il.png', sport5live: '5live-il.png', sport5plus: '5plus-il.png', sport5gold: '5gold-il.png', sport5stars: '5stars-il.png', sport5_4k: '5sport4k-il.png', hotzone: 'hot-zone-il.png',
    sport1: 'sport1-il.png', sport2: 'sport2-il.png', sport3: 'sport3-il.png', sport4: 'sport4-il.png', one: 'one-il.png', one2: 'one2-il.png',
    kan11: 'kan11-il.png', keshet12: 'keshet12-il.png', reshet13: 'reshet13-il.png', ch14: 'channel14-il.png', ch9: 'channel9-il.png', i24: 'i24-news-il.png', yes: 'yes-israel-il.png', yesbrand: 'yes-brand.png', hotbrand: 'hot-brand.png', hot: 'hot3-il.png' };
  const IMGS = {}; CL.logoNames = Object.keys(FILES);
  CL.logosReady = Promise.all(Object.entries(FILES).map(([k, f]) => new Promise(res => { const im = new Image(); im.onload = () => { IMGS[k] = im; res(); }; im.onerror = () => res(); im.src = 'assets/logos/' + f; })));
  CL.logoImg = k => IMGS[k] || null;
  // logo on a taped paper card. o {rot, fill, scale, tape, seed, pad}
  CL.logoCard = (ctx, k, cx, cy, w, h, o = {}) => {
    const im = IMGS[k]; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scale ?? 1); ctx.globalAlpha *= o.alpha ?? 1;
    CL.scrap(ctx, 0, 0, w, h, { fill: o.fill || C.white, seed: o.seed || 3, shadow: o.shadow ?? 12 });
    if (im) { const p = o.pad ?? .16, s = Math.min(w * (1 - p * 2) / im.width, h * (1 - p * 2) / im.height); ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); }
    if (o.tape !== false) CL.tape(ctx, -w * .32, -h / 2 - 2, -.35, 120, 40);
    ctx.restore();
  };

  // ---------- marker scribbles (progress p 0..1 draws them on). All use a wobbly hand-drawn path.
  const marker = (ctx, pts, p, col, lw) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const n = Math.max(2, Math.floor(pts.length * clamp(p))); ctx.beginPath(); pts.slice(0, n).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.restore(); };
  CL.underline = (ctx, x0, x1, y, p = 1, o = {}) => { const r = rng((o.seed || 1) * 7 + 1), n = 26, pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(x0, x1, t), y + Math.sin(t * 6 + (o.seed || 1)) * 5 + (r() - .5) * 4 + (i % 2 ? 4 : -4) * (o.zig ? 1 : 0)]); } marker(ctx, pts, p, o.color || C.red, o.lw || 12); };
  CL.circle = (ctx, cx, cy, rx, ry, p = 1, o = {}) => { const r = rng((o.seed || 1) * 5 + 2), n = 48, pts = []; for (let i = 0; i <= n; i++) { const a = -1.2 + i / n * 6.9, k = 1 + i / n * .06; pts.push([cx + Math.cos(a) * rx * k + (r() - .5) * 5, cy + Math.sin(a) * ry * k + (r() - .5) * 5]); } marker(ctx, pts, p, o.color || C.red, o.lw || 10); };
  CL.arrow = (ctx, x0, y0, x1, y1, p = 1, o = {}) => { const bend = o.bend ?? 60, mx = (x0 + x1) / 2 - (y1 - y0) / 400 * bend, my = (y0 + y1) / 2 + (x1 - x0) / 400 * bend, pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * mx + t * t * x1, u * u * y0 + 2 * u * t * my + t * t * y1]); } marker(ctx, pts, p, o.color || C.ink, o.lw || 9);
    if (p > .95) { const an = Math.atan2(y1 - pts[20][1], x1 - pts[20][0]), L = 42; marker(ctx, [[x1 + Math.cos(an + 2.6) * L, y1 + Math.sin(an + 2.6) * L], [x1, y1], [x1 + Math.cos(an - 2.6) * L, y1 + Math.sin(an - 2.6) * L]], 1, o.color || C.ink, o.lw || 9); } };
  CL.cross = (ctx, cx, cy, s, p = 1, o = {}) => { marker(ctx, [[cx - s, cy - s], [cx + s, cy + s]], clamp(p * 2), o.color || C.red, o.lw || 22); if (p > .5) marker(ctx, [[cx + s, cy - s], [cx - s, cy + s]], clamp(p * 2 - 1), o.color || C.red, o.lw || 22); };
  CL.star = (ctx, cx, cy, R, spikes = 12, o = {}) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.beginPath(); for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * A.TAU, r = i % 2 ? R * .68 : R; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = o.fill || C.yellow; ctx.fill(); ctx.lineWidth = o.lw ?? 8; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); };
  CL.sparks = (ctx, cx, cy, r0, r1, n, t, o = {}) => { const q = CL.q(t, 12); ctx.save(); ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = o.lw || 8; ctx.lineCap = 'round'; for (let i = 0; i < n; i++) { const a = i / n * A.TAU + hash(q + i) * .15, k = .7 + hash(q * 3 + i) * .5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1 * k, cy + Math.sin(a) * r1 * k); ctx.stroke(); } ctx.restore(); };

  // ---------- halftone dots. fade: 'none' | 'l' | 'r' | 't' | 'b' | 'radial'
  CL.halftone = (ctx, x, y, w, h, color, size = 24, ang = .5, o = {}) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= o.alpha ?? 1; ctx.fillStyle = color; const cs = Math.cos(ang), sn = Math.sin(ang), R = Math.hypot(w, h);
    for (let i = -R / size; i < R / size; i++) for (let j = -R / size; j < R / size; j++) {
      const u = i * size, v = j * size, px = x + w / 2 + u * cs - v * sn, py = y + h / 2 + u * sn + v * cs; if (px < x - size || px > x + w + size || py < y - size || py > y + h + size) continue;
      let k = 1; const fx = (px - x) / w, fy = (py - y) / h; if (o.fade === 'l') k = 1 - fx; else if (o.fade === 'r') k = fx; else if (o.fade === 't') k = 1 - fy; else if (o.fade === 'b') k = fy; else if (o.fade === 'radial') k = 1 - Math.hypot(fx - .5, fy - .5) * 2;
      k = clamp(k); if (k < .05) continue; ctx.beginPath(); ctx.arc(px, py, size * .5 * k * (o.k ?? .8), 0, A.TAU); ctx.fill();
    } ctx.restore();
  };

  // ---------- lettering
  // cut-out word chip (ransom-note): paper strip + heavy Hebrew/English text. o {font,size,fill,ink,rot,seed,dir,pad}
  CL.chip = (ctx, s, cx, cy, o = {}) => {
    const size = o.size || 96, font = o.font || `900 ${size}px Rubik`; ctx.save(); ctx.font = font; ctx.direction = o.dir || 'rtl'; const tw = ctx.measureText(s).width, pad = o.pad ?? size * .3, w = tw + pad * 2, h = size * 1.3;
    ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale) ctx.scale(o.scale, o.scale);
    CL.scrap(ctx, 0, 0, w, h, { fill: o.fill || C.white, seed: o.seed || 2, rough: o.rough ?? 4, shadow: o.shadow ?? 9, border: o.border });
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.fillStyle = o.ink || C.ink; ctx.fillText(s, 0, size * .04); ctx.restore(); return { w, h };
  };
  // big sticker text: thick ink outline + white outer die-cut + hard shadow, no blur. o {size, fill, rot, font}
  CL.title = (ctx, s, cx, cy, o = {}) => {
    const size = o.size || 150; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale) ctx.scale(o.scale, o.scale); ctx.font = o.font || `900 ${size}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    const sh = o.shadow ?? size * .07; ctx.fillStyle = 'rgba(40,20,0,.35)'; ctx.strokeStyle = 'rgba(40,20,0,.35)'; ctx.lineWidth = size * .3; ctx.strokeText(s, sh, sh * 1.3); ctx.fillText(s, sh, sh * 1.3);
    ctx.strokeStyle = o.outer || '#fff'; ctx.lineWidth = size * .3; ctx.strokeText(s, 0, 0);
    ctx.strokeStyle = C.ink; ctx.lineWidth = size * .14; ctx.strokeText(s, 0, 0); ctx.fillStyle = o.fill || C.yellow; ctx.fillText(s, 0, 0); ctx.restore();
  };
  // rounded / rough-cornered "sticker" blob button. o {fill, rot}
  CL.blob = (ctx, cx, cy, w, h, o = {}) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, -h / 2 + 12, w, h, h * .3); ctx.fill(); ctx.fillStyle = o.fill || C.yellow; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * .3); ctx.fill(); ctx.lineWidth = o.lw ?? 8; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore(); };
  // smartphone/TV frames drawn as paper craft: TV set with screen area. draw(ctx, sw, sh) paints the screen content (clipped).
  CL.tv = (ctx, cx, cy, w, h, o = {}) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale) ctx.scale(o.scale, o.scale);
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 14, -h / 2 + 20, w, h, 34); ctx.fill();
    ctx.fillStyle = o.body || C.ink; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 34); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    const m = w * .05, sw = w - m * 2, sh = h - m * 2 - (o.chin ?? 0); ctx.fillStyle = '#0a0a12'; ctx.beginPath(); ctx.roundRect(-sw / 2, -h / 2 + m, sw, sh, 20); ctx.fill();
    if (o.draw) { ctx.save(); ctx.beginPath(); ctx.roundRect(-sw / 2, -h / 2 + m, sw, sh, 20); ctx.clip(); ctx.translate(-sw / 2, -h / 2 + m); o.draw(ctx, sw, sh); ctx.restore(); }
    ctx.restore();
  };
})();
