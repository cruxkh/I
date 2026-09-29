// GOTV v2 shared kit (1080x1920 vertical). Palette, glass panels, glossy tiles, fake-3D card warp, bokeh, light beams, text.
const V = (() => {
  const { clamp, lerp, ease, hash, rng, inv } = A;
  const C = {
    navy: '#060A1E', deep: '#0B1450', indigo: '#141C6B', blue: '#2F6BFF', sky: '#5AD1FF', cyan: '#38D9F5',
    gold: '#FFC24A', goldHi: '#FFE9A8', goldLo: '#E48A12', magenta: '#FF4F9A', red: '#FF3B4A', green: '#3DDC84', violet: '#8A5BFF',
    ink: '#0A0A1C', cream: '#FFF6E0',
  };
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), eio = t => ease.inOut(clamp(t)), ein = t => ease.in(clamp(t));
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rad = (ctx, x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  // additive soft light
  const glow = (ctx, x, y, r, col, a = 1) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, col], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
  // glassmorphism panel: translucent gradient, bright rim, inner top highlight, soft shadow
  function glass(ctx, x, y, w, h, r = 40, o = {}) {
    const tint = o.tint || '#7FA8FF', a = o.alpha ?? 0.22;
    ctx.save(); ctx.shadowColor = 'rgba(0,10,40,.55)'; ctx.shadowBlur = o.shadow ?? 50; ctx.shadowOffsetY = o.shadowY ?? 22;
    rr(ctx, x, y, w, h, r); ctx.fillStyle = lin(ctx, x, y, x + w * .3, y + h, [[0, hexA(tint, a + .14)], [1, hexA(tint, a * .55)]]); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = lin(ctx, x, y, x, y + h * .5, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x, y, w, h * .5);
    ctx.restore();
    rr(ctx, x + .5, y + .5, w - 1, h - 1, r); ctx.lineWidth = o.border ?? 3; ctx.strokeStyle = lin(ctx, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,255,255,.15)'], [1, 'rgba(255,255,255,.55)']]); ctx.stroke();
  }
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // glossy squircle "app tile": colour gradient, top gloss, inner shadow, rim
  function tile(ctx, x, y, s, c1, c2, iconFn, o = {}) {
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,20,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    rr(ctx, -100, -100, 200, 200, 52); ctx.fillStyle = lin(ctx, -100, -100, 100, 100, [[0, c1], [1, c2]]); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, -100, -100, 200, 200, 52); ctx.clip(); ctx.fillStyle = lin(ctx, 0, -100, 0, 20, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(0, -84, 132, 88, 0, 0, A.TAU); ctx.fill(); ctx.restore();
    rr(ctx, -99, -99, 198, 198, 51); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
    if (iconFn) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; iconFn(ctx); }
    ctx.restore();
  }
  const ICON = {
    play: c => { c.beginPath(); c.moveTo(-26, -40); c.lineTo(44, 0); c.lineTo(-26, 40); c.closePath(); c.fill(); },
    ball: c => { c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 44, 0, A.TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * A.TAU / 5; c.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); } c.closePath(); c.fill(); },
    star: c => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 20 : 48; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); },
    heart: c => { c.beginPath(); c.moveTo(0, 42); c.bezierCurveTo(-64, -6, -30, -50, 0, -18); c.bezierCurveTo(30, -50, 64, -6, 0, 42); c.fill(); },
    tv: c => { rr(c, -46, -34, 92, 60, 10); c.lineWidth = 8; c.stroke(); c.fillRect(-20, 34, 40, 8); },
    bolt: c => { c.beginPath(); c.moveTo(10, -50); c.lineTo(-28, 6); c.lineTo(-2, 6); c.lineTo(-12, 50); c.lineTo(30, -8); c.lineTo(4, -8); c.closePath(); c.fill(); },
    note: c => { c.beginPath(); c.arc(-14, 28, 18, 0, A.TAU); c.fill(); c.fillRect(2, -44, 10, 72); c.beginPath(); c.moveTo(12, -44); c.quadraticCurveTo(44, -34, 40, -6); c.lineTo(12, -18); c.fill(); },
  };
  // ---- fake 3D: draw an image/canvas as a perspective-projected card (rotY about vertical axis, rotX about horizontal axis)
  function card3d(ctx, src, cx, cy, w, h, rotY = 0, rotX = 0, fov = 1400, cellsX = 10, cellsY = 14, sw = src.width, sh = src.height) {
    const pts = (u, v) => { let x = (u - .5) * w, y = (v - .5) * h, z = 0;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY), z1 = -x * Math.sin(rotY) + z * Math.cos(rotY); x = x1; z = z1;
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX), z2 = y * Math.sin(rotX) + z * Math.cos(rotX); y = y1; z = z2;
      const k = fov / (fov + z); return [cx + x * k, cy + y * k]; };
    for (let j = 0; j < cellsY; j++) for (let i = 0; i < cellsX; i++) {
      const u0 = i / cellsX, u1 = (i + 1) / cellsX, v0 = j / cellsY, v1 = (j + 1) / cellsY;
      const P = [pts(u0, v0), pts(u1, v0), pts(u1, v1), pts(u0, v1)], S = [[u0 * sw, v0 * sh], [u1 * sw, v0 * sh], [u1 * sw, v1 * sh], [u0 * sw, v1 * sh]];
      tri(ctx, src, [P[0], P[1], P[2]], [S[0], S[1], S[2]]); tri(ctx, src, [P[0], P[2], P[3]], [S[0], S[2], S[3]]);
    }
  }
  function tri(ctx, src, p, s) {
    const [[x0, y0], [x1, y1], [x2, y2]] = p, [[u0, v0], [u1, v1], [u2, v2]] = s;
    const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3, e = 0.6; // slight expansion hides seams
    const ex = (x, y) => [x + Math.sign(x - cx) * e, y + Math.sign(y - cy) * e];
    const a = ex(x0, y0), b = ex(x1, y1), c = ex(x2, y2);
    ctx.save(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.clip();
    const d = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0); if (Math.abs(d) < 1e-6) { ctx.restore(); return; }
    const m11 = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / d, m12 = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / d;
    const m21 = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / d, m22 = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / d;
    ctx.transform(m11, m12, m21, m22, x0 - m11 * u0 - m21 * v0, y0 - m12 * u0 - m22 * v0); ctx.drawImage(src, 0, 0); ctx.restore();
  }
  // ---- backgrounds
  function bokeh(ctx, t, o = {}) {
    const n = o.n ?? 28, r = rng(o.seed ?? 5), cols = o.cols || [C.blue, C.sky, C.gold, C.magenta, C.violet];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const s = 30 + r() * 120, x = (r() * 1200 + Math.sin(t * .4 + i) * 50 + 1080 * 3) % 1200 - 60, y = ((r() * 2100 - t * (18 + r() * 40)) % 2100 + 2100) % 2100 - 90, a = (.05 + .12 * r()) * (o.alpha ?? 1);
      ctx.globalAlpha = a; ctx.fillStyle = rad(ctx, x, y, s * .2, s, [[0, cols[i % cols.length]], [.8, hexA(cols[i % cols.length], .35)], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.arc(x, y, s, 0, A.TAU); ctx.fill(); }
    ctx.restore();
  }
  function beams(ctx, x, y, t, col, n = 5, len = 2400, spread = 1.2, a = .12) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y);
    for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + (i / (n - 1) - .5) * spread + Math.sin(t * .6 + i * 1.7) * .08, wd = .05 + .03 * Math.sin(t + i);
      ctx.save(); ctx.rotate(an + Math.PI / 2); ctx.globalAlpha = a * (.6 + .4 * Math.sin(t * 1.3 + i)); ctx.fillStyle = lin(ctx, 0, 0, 0, -len, [[0, col], [1, 'rgba(0,0,0,0)']]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len * wd, -len); ctx.lineTo(len * wd, -len); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function bgDeep(ctx, t, o = {}) {   // cinematic navy field with drifting blue/gold light pools
    ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, o.top || '#0A1240'], [.5, o.mid || '#0B1450'], [1, o.bot || '#050818']]); ctx.fillRect(0, 0, 1080, 1920);
    glow(ctx, 540 + Math.sin(t * .5) * 260, 520 + Math.cos(t * .4) * 200, 900, o.a || C.blue, .42); glow(ctx, 540 + Math.cos(t * .45) * 300, 1450 + Math.sin(t * .3) * 200, 900, o.b || C.gold, .2);
    bokeh(ctx, t, { seed: o.seed || 3, alpha: o.bokeh ?? 1 });
  }
  // gradient text (fill top->bottom) with stroke + glow
  function text(ctx, s, x, y, size, o = {}) {
    ctx.save(); ctx.font = `${o.weight || 900} ${size}px ${o.font || 'Rubik'}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.lineJoin = 'round';
    if (o.shadow !== false) { ctx.shadowColor = o.shadowCol || 'rgba(0,10,40,.6)'; ctx.shadowBlur = o.shadowBlur ?? 30; ctx.shadowOffsetY = o.shadowY ?? 14; }
    if (o.stroke) { ctx.lineWidth = o.sw ?? size * .14; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = o.grad ? lin(ctx, 0, y - size * .5, 0, y + size * .5, o.grad) : (o.fill || '#fff'); ctx.fillText(s, x, y); ctx.restore();
  }
  const GOLD_GRAD = [[0, '#FFF3C4'], [.45, '#FFC24A'], [1, '#E48A12']], WHITE_GRAD = [[0, '#FFFFFF'], [1, '#C9D8FF']];
  const sparkle = (ctx, x, y, r, col = '#fff', rot = 0, a = 1) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, r2 = i % 2 ? r * .2 : r; ctx.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); } ctx.closePath(); ctx.fill(); ctx.restore(); };
  const flash = (ctx, t, t0, d, col = '#fff', peak = 1) => { const u = (t - t0) / d; if (u < 0 || u > 1) return; ctx.save(); ctx.globalAlpha = peak * (1 - u) * (1 - u); ctx.fillStyle = col; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); };
  const ring = (ctx, x, y, r, w, col, a = 1) => { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); ctx.stroke(); ctx.restore(); };
  return { C, eob, eo, eio, ein, rr, lin, rad, glow, glass, tile, ICON, card3d, bokeh, beams, bgDeep, text, GOLD_GRAD, WHITE_GRAD, sparkle, flash, ring, hexA };
})();
