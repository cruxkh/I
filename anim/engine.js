// ============================================================================
// PACKET FROM HOME — core engine. Global namespace `A`.
// Deterministic: every frame is a pure function of time t (seconds). No Date, no Math.random.
// ============================================================================
const A = (window.A = {});
A.W = 1920; A.H = 1080; A.FPS = 30; A.DUR = 60;
A.scenes = [];
A.debug = false;

// ---------- math ----------
A.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
A.lerp = (a, b, t) => a + (b - a) * t;
A.inv = (a, b, x) => A.clamp((x - a) / (b - a)); // 0..1 progress of x through [a,b]
A.smooth = (a, b, x) => { const t = A.inv(a, b, x); return t * t * (3 - 2 * t); };
A.TAU = Math.PI * 2;
A.ease = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
};
// keyframes: A.key(t, [[t0, v0], [t1, v1, easeName?], ...]) — v may be number or array of numbers.
A.key = (t, ks, defEase = 'inOut') => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1], [t1, v1, e] = ks[i];
      const p = A.ease[e || defEase]((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => A.lerp(a, v1[j], p)) : A.lerp(v0, v1, p);
    }
  }
  return ks[ks.length - 1][1];
};
// seeded hash random: A.hash(n) -> [0,1)
A.hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
A.rng = seed => { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
// smooth value noise
A.noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return A.lerp(A.hash(i), A.hash(i + 1), u) * 2 - 1; };
A.noise2 = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const h = (a, b) => A.hash(a * 57.0 + b * 113.0);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return A.lerp(A.lerp(h(ix, iy), h(ix + 1, iy), ux), A.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy) * 2 - 1;
};
A.fbm = (x, y, o = 4) => { let v = 0, a = 0.5; for (let i = 0; i < o; i++) { v += a * A.noise2(x, y); x *= 2; y *= 2; a *= 0.5; } return v; };
// organic wobble for "alive" motion: A.wob(t, seed, freq) in [-1,1]
A.wob = (t, seed = 0, freq = 1) => A.noise1(t * freq + seed * 17.3);

// ---------- color ----------
A.hex = (h, a = 1) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
A.mixc = (h1, h2, t) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = s => Math.round(A.lerp((a >> s) & 255, (b >> s) & 255, t)); return `rgb(${c(16)},${c(8)},${c(0)})`; };

// ---------- characters helpers ----------
// mouth openness 0..1 for a speaker at time t (from generated lipsync @30fps)
A.mouth = (who, t) => {
  const L = A.LIPSYNC && A.LIPSYNC[who]; if (!L) return 0;
  const f = t * A.FPS, i = Math.floor(f), k = f - i;
  return A.lerp(L[i] || 0, L[i + 1] || 0, k);
};
A.speaking = (who, t) => (A.LINES || []).some(l => l.who === who && t >= l.t && t <= l.end);
// eyelid closure 0..1 (1 = closed): natural blinks every ~2.5-5s, seed per character
A.blink = (t, seed = 0) => {
  const period = 3.2 + A.hash(seed) * 1.8; const ph = (t + A.hash(seed + 9) * period) % period;
  const b = ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0; return b;
};

// ---------- drawing helpers ----------
A.OUTLINE = '#1a1330';
A.path = (ctx, pts, close = true) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (close) ctx.closePath(); };
// smooth closed blob through points (Catmull-Rom -> bezier)
A.blob = (ctx, pts, close = true) => {
  const n = pts.length; ctx.beginPath();
  const P = i => pts[close ? (i + n) % n : A.clamp(i, 0, n - 1)];
  ctx.moveTo(P(0)[0], P(0)[1]);
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (close) ctx.closePath();
};
A.rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
A.ellipse = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, A.TAU); };
A.fillStroke = (ctx, fill, lw = 5, stroke = A.OUTLINE) => { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } };
A.radial = (ctx, x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
A.linear = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
// additive glow blob
A.glow = (ctx, x, y, r, color, alpha = 1) => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
  ctx.fillStyle = A.radial(ctx, x, y, 0, r, [[0, color], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
};
A.text = (ctx, s, x, y, { font = '700 48px Rubik', fill = '#fff', stroke = null, lw = 8, align = 'center', base = 'middle', dir = 'ltr' } = {}) => {
  ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.textBaseline = base; ctx.direction = dir;
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
};

// ---------- cached layers (use for anything static: backgrounds, textures) ----------
A._cache = new Map();
A.layer = (key, w, h, draw) => {
  let c = A._cache.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); A._cache.set(key, c); }
  return c;
};

// ---------- camera ----------
// A.camera(ctx, {x, y, zoom, rot, shake, t}) — (x,y) = world point shown at screen centre. Call inside save/restore.
A.camera = (ctx, { x = 960, y = 540, zoom = 1, rot = 0, shake = 0, t = 0 } = {}) => {
  const sx = shake * (A.noise1(t * 23) * 14), sy = shake * (A.noise1(t * 23 + 50) * 14);
  ctx.translate(960 + sx, 540 + sy); ctx.rotate(rot + shake * A.noise1(t * 17 + 9) * 0.012); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
};

// ---------- scenes ----------
// A.scene({name, start, end, draw(ctx, s)}) where s = {t, lt, p, dur, f}
// Scenes may overlap by a few frames for transitions; later-registered scene draws on top. A scene can
// implement its own transition by reading s.lt/s.p. Engine never crossfades automatically.
A.scene = def => A.scenes.push(def);

A.renderFrame = f => {
  const t = f / A.FPS, cv = document.getElementById('c'), ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, A.W, A.H);
  for (const s of A.scenes) {
    if (t >= s.start && t < s.end) {
      ctx.save();
      try { s.draw(ctx, { t, lt: t - s.start, p: (t - s.start) / (s.end - s.start), dur: s.end - s.start, f }); }
      catch (e) { console.error(s.name, e); ctx.restore(); ctx.save(); A.text(ctx, 'ERR ' + s.name + ': ' + e.message, 960, 540, { font: '28px monospace', fill: '#f44' }); }
      ctx.restore();
    }
  }
  if (A.post) { ctx.save(); A.post(ctx, t, f); ctx.restore(); }
  if (A.debug) A.text(ctx, `f${f}  t=${t.toFixed(2)}`, 20, 30, { font: '24px monospace', align: 'left', fill: '#0f0' });
};
