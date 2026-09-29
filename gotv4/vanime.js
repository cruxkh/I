// ============================================================================
// vanime.js : shared ANIME toolkit. Global `V.anime` (extends V from vkit.js). All helpers are PURE functions of time.
// Canvas 1080x1920, ctx-based. No Math.random (uses A.hash / A.rng). Cheap: static art cached with A.layer.
//
//  V.anime.speedLines(ctx, cx, cy, t, {n=64, inner=260, outer=1500, color='#fff', thickness=14, alpha=.5, seed=1, fps=12, jitter=.6, taper=true})
//        radial manga speed/focus lines (flicker in 12fps steps). thickness = half width in px at the outer end.
//  V.anime.halftone(ctx, x, y, w, h, {size=16, angle=45deg(rad .785), color='#000', alpha=.3, gradient:'radial'|'linear'|'none',
//        inset=.35 (radial: clear radius 0..1), dir=[0,1] (linear direction, dots grow along it), gmin=0,gmax=1, key})
//        true screen-tone (dot radius follows the gradient). Cached via A.layer.
//  V.anime.impact(ctx, T, t0, {dur=.1, frames=3, mode:'invert'|'lines', cx, cy}) -> bool active. Black/white inversion frames:
//        k0 = inverted hi-contrast picture, k1 = hard B/W posterised, k2 = black with white radial burst. mode 'lines' does not read the
//        canvas (pure black/white burst frames) . Call it AFTER everything you want inverted.
//  V.anime.kana(ctx, text, x, y, size, {rot=0, color=['#fff','#FFC24A'], outline='#0a0614', t, t0, dur=.9, shake=1, alpha=1, slam=1, shadow='#0a0614', slant=.14})
//        big manga SFX text drawn from vector strokes (chars: ド ゴ ズ バ パ ン キ ラ ッ ァ ー ！ ト コ ス ハ ア ク ホ ロ ウ オ ゛ ゜). Slams in (scale 2.2->1 in .1s), shakes, fades at t0+dur.
//        Returns true while visible. Without t/t0 it draws statically. V.anime.kanaWidth(text,size).
//  V.anime.sakura(ctx, t, {n=16, wind=1, alpha=.85, seed=1, size=1, area:[x,y,w,h]}) drifting cherry petals (loop forever).
//  V.anime.glint(ctx, x, y, r, t, {rot=0, color='#fff', life:true}) 4-point star glint; t = 0..1 life (grow then shrink); pass life:false for a static twinkle.
//  V.anime.sweat(ctx, x, y, s, t)   sweat drop sliding down (t 0..1 life)
//  V.anime.anger(ctx, x, y, s, t)   red 4-arc vein-pop mark (t 0..1 life, pulses)
//  V.anime.exclaim(ctx, x, y, s, t, {kind:'!'|'?'|'!?', rot, color}) manga reaction mark (t 0..1 life, pop + wobble)
//  V.anime.shine(ctx, x, y, s, t, {rot, color}) cheek/blush hatch lines (3 diagonal strokes) with pulse
//  V.anime.sparkleEyes(ctx, x, y, r, t, {color}) big anime eye highlight: disc + 2 highlights + twinkling star
//  V.anime.panel(ctx, t, t0, dir, {dur=.26, width=250, lean=.3, color='#05060f', gutter='#fff', accent='#FFC24A', alpha=.94}) -> coverage 0..1
//        diagonal manga panel-slam wipe: an ink slab with white gutters sweeps across; the cut is at t0+dur/2. Never covers > ~1/4 of frame.
//  V.anime.cel(ctx, drawFn, {ink='#1a1330', width=5, w=1080, h=1920, key, sat=1.25, con=1.1, x=0, y=0}) draws drawFn(c2d) to an offscreen layer, adds
//        an ink outline (8-dir silhouette offset) and draws it. Cheap for characters up to ~600x900.
//  V.anime.title(ctx, text, x, y, size, {dir='rtl', slant=.16, colors=[GOLD], ink='#0a0f3a', edge='#fff', off=['#FF3E9A','#25D0FF'], t, t0}) OP-style title card text.
//  V.anime.bloomHalo(ctx, x, y, r, t, {color='#FFD98A', alpha=.6, rings=2}) glowing halo disc + rings, breathing with t.
//  V.anime.flashLines(ctx, cx, cy, t, o) shortcut: soft short focus lines (speedLines with lower alpha, larger inner radius).
//  V.anime.rays(ctx, x, y, t, {n=9, len=2000, color='#FFE9A8', alpha=.2, spin=.05}) light-ray fan (godrays).
//  V.anime.SFX = palette for tasteful SFX colours.
// ============================================================================
(() => {
  const { clamp, lerp, hash, rng, ease } = A;
  const TAU = Math.PI * 2, W = 1080, H = 1920;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const V_ = (typeof V !== 'undefined') ? V : (window.V = {});
  const eob = t => ease.outBack(clamp(t));

  // ------------------------------------------------------------ speed lines
  function speedLines(ctx, cx, cy, t, o = {}) {
    const n = o.n ?? 64, inner = o.inner ?? 260, outer = o.outer ?? 1500, th = o.thickness ?? 14, seed = o.seed ?? 1, fps = o.fps ?? 12, jit = o.jitter ?? .6;
    const step = Math.floor(t * fps), taper = o.taper !== false;
    ctx.save(); ctx.globalAlpha = o.alpha ?? .5; ctx.fillStyle = o.color || '#fff'; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 3.17 + seed * 11.3 + step * .731), h2 = hash(i * 5.91 + seed * 7.7 + step * 1.37), h3 = hash(i * 1.7 + seed * 3.3);
      if (h1 < .18) continue;
      const a = (i + (h3 - .5) * jit * 1.2) / n * TAU + (h2 - .5) * .02;
      const r0 = inner * (.9 + .5 * h2), r1 = outer * (.7 + .3 * h1), hw = th * (.35 + h3 * .9);
      const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      if (taper) { ctx.moveTo(cx + ca * r0, cy + sa * r0); ctx.lineTo(cx + ca * r1 + px * hw, cy + sa * r1 + py * hw); ctx.lineTo(cx + ca * r1 - px * hw, cy + sa * r1 - py * hw); }
      else { const hw2 = hw * .3; ctx.moveTo(cx + ca * r0 + px * hw2, cy + sa * r0 + py * hw2); ctx.lineTo(cx + ca * r1 + px * hw, cy + sa * r1 + py * hw); ctx.lineTo(cx + ca * r1 - px * hw, cy + sa * r1 - py * hw); ctx.lineTo(cx + ca * r0 - px * hw2, cy + sa * r0 - py * hw2); }
      ctx.closePath();
    }
    ctx.fill(); ctx.restore();
  }
  const flashLines = (ctx, cx, cy, t, o = {}) => speedLines(ctx, cx, cy, t, Object.assign({ n: 48, inner: 420, outer: 1600, thickness: 9, alpha: .28 }, o));
  function rays(ctx, x, y, t, o = {}) {
    const n = o.n ?? 9, len = o.len ?? 2000; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(t * (o.spin ?? .05));
    for (let i = 0; i < n; i++) { const a = i / n * TAU, w = .05 + .04 * hash(i + 3), k = .5 + .5 * Math.sin(t * 1.3 + i * 1.9); ctx.globalAlpha = (o.alpha ?? .2) * (.4 + .6 * k); ctx.fillStyle = o.color || '#FFE9A8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len); ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len); ctx.fill(); }
    ctx.restore();
  }

  // ------------------------------------------------------------ halftone
  function halftone(ctx, x, y, w, h, o = {}) {
    const size = o.size ?? 16, ang = o.angle ?? .785, col = o.color || '#000', grad = o.gradient || 'none', inset = o.inset ?? .35, dir = o.dir || [0, 1], gmin = o.gmin ?? 0, gmax = o.gmax ?? 1;
    const key = `ht|${w}|${h}|${size}|${ang.toFixed(3)}|${col}|${grad}|${inset}|${dir}|${gmin}|${gmax}|${o.key || ''}`;
    const layer = A.layer(key, w, h, (c, w, h) => {
      c.fillStyle = col; const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.hypot(w, h) / 2, cx = w / 2, cy = h / 2, maxd = Math.hypot(cx, cy);
      const dl = Math.hypot(dir[0], dir[1]) || 1, dx = dir[0] / dl, dy = dir[1] / dl;
      c.beginPath();
      for (let gy = -R; gy <= R; gy += size) for (let gx = -R; gx <= R; gx += size) {
        const px = cx + gx * ca - gy * sa + (Math.round(gy / size) % 2 ? 0 : 0), py = cy + gx * sa + gy * ca;
        if (px < -size || py < -size || px > w + size || py > h + size) continue;
        let g = 1;
        if (grad === 'radial') g = sm(inset, 1, Math.hypot(px - cx, py - cy) / maxd);
        else if (grad === 'linear') g = clamp(((px - cx) * dx + (py - cy) * dy) / (Math.abs(w * dx) + Math.abs(h * dy)) + .5);
        g = lerp(gmin, gmax, g);
        const r = size * .5 * 1.12 * Math.sqrt(clamp(g)); if (r < .7) continue;
        c.moveTo(px + r, py); c.arc(px, py, r, 0, TAU);
      }
      c.fill();
    });
    ctx.save(); ctx.globalAlpha = o.alpha ?? .3; ctx.drawImage(layer, x, y); ctx.restore();
  }

  // ------------------------------------------------------------ impact frames
  const SM = mk(540, 960), SMx = SM.getContext('2d');
  function impact(ctx, T, t0, o = {}) {
    const fps = 30, frames = o.frames ?? 3, u = T - t0; if (u < -1e-4) return false;
    const k = Math.floor(u * fps + 1e-3); if (k < 0 || k >= frames) return false;
    const cx = o.cx ?? 540, cy = o.cy ?? 860, mode = o.mode || 'invert';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    const hasPic = mode === 'invert';
    if (hasPic && k < 2) {
      SMx.setTransform(1, 0, 0, 1, 0, 0); SMx.globalAlpha = 1; SMx.globalCompositeOperation = 'source-over';
      SMx.filter = k === 0 ? 'grayscale(1) contrast(2.2) brightness(1.05) invert(1)' : 'grayscale(1) contrast(5) brightness(1.15)';
      SMx.drawImage(ctx.canvas, 0, 0, 540, 960); SMx.filter = 'none';
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(SM, 0, 0, W, H);
      if (k === 1) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalCompositeOperation = k === 0 ? 'difference' : 'source-over'; speedLines(ctx, cx, cy, 0, { n: 52, inner: 330, outer: 1700, thickness: 16, alpha: k === 0 ? .55 : .85, color: '#fff', seed: 5 + k, fps: 1 });
    } else {
      // pure graphic frames: alternate black/white bursts
      const flip = (k + (hasPic ? 0 : 1)) % 2;
      ctx.fillStyle = flip ? '#fff' : '#000'; ctx.fillRect(0, 0, W, H);
      speedLines(ctx, cx, cy, 0, { n: 70, inner: 240, outer: 1800, thickness: 22, alpha: 1, color: flip ? '#000' : '#fff', seed: 9 + k, fps: 1 });
      ctx.fillStyle = V_.anime ? (flip ? '#000' : '#fff') : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 120 + 30 * k, 0, TAU); ctx.globalAlpha = .0; ctx.fill();
    }
    ctx.restore(); return true;
  }

  // ------------------------------------------------------------ katakana glyphs (vector strokes on 0..100 box, y down)
  // each glyph: s = array of polylines; d = 'd' dakuten | 'p' handakuten; sc = scale (small kana); adv = advance (fraction of size)
  const G = {
    'ト': { s: [[[36, 6], [36, 94]], [[36, 42], [80, 62]]] },
    'ド': { s: [[[30, 10], [30, 94]], [[30, 44], [72, 64]]], d: 1 },
    'ン': { s: [[[18, 22], [34, 40]], [[14, 78], [46, 70], [70, 50], [88, 18]]] },
    'コ': { s: [[[20, 24], [80, 24], [80, 82], [20, 82]]] },
    'ゴ': { s: [[[14, 26], [72, 26], [72, 82], [14, 82]]], d: 1 },
    'キ': { s: [[[18, 38], [82, 24]], [[16, 62], [84, 48]], [[40, 6], [60, 94]]] },
    'ラ': { s: [[[30, 14], [72, 14]], [[16, 40], [84, 40], [76, 66], [36, 90]]] },
    'ス': { s: [[[18, 22], [80, 22], [58, 52], [22, 88]], [[46, 54], [86, 90]]] },
    'ズ': { s: [[[12, 24], [66, 24], [46, 52], [14, 88]], [[38, 54], [72, 90]]], d: 1 },
    'ハ': { s: [[[46, 24], [16, 88]], [[58, 30], [86, 88]]] },
    'バ': { s: [[[38, 24], [10, 88]], [[50, 30], [76, 88]]], d: 1 },
    'パ': { s: [[[38, 24], [10, 88]], [[50, 30], [76, 88]]], p: 1 },
    'ッ': { s: [[[14, 26], [26, 46]], [[40, 20], [52, 42]], [[86, 20], [66, 72]]], sc: .62, adv: .62 },
    'ァ': { s: [[[18, 26], [82, 26], [66, 60], [30, 90]], [[46, 44], [24, 88]]], sc: .62, adv: .66 },
    'ア': { s: [[[16, 24], [84, 24], [66, 58], [28, 90]], [[46, 44], [24, 88]]] },
    'ー': { s: [[[8, 52], [92, 52]]], adv: 1 },
    'ク': { s: [[[52, 8], [26, 44], [12, 56]], [[36, 30], [86, 30], [78, 62], [40, 92]]] },
    'ウ': { s: [[[50, 6], [50, 24]], [[16, 32], [84, 32], [80, 66], [46, 92]], [[22, 32], [22, 50]]] },
    'オ': { s: [[[14, 34], [86, 34]], [[54, 8], [54, 78], [40, 90]], [[50, 42], [16, 82]]] },
    'ロ': { s: [[[18, 22], [82, 22], [82, 84], [18, 84], [18, 22]]] },
    'ホ': { s: [[[12, 34], [88, 34]], [[50, 8], [50, 92]], [[46, 46], [14, 82]], [[54, 46], [86, 82]]] },
    '！': { s: [], bang: 1, adv: .6 },
    '゛': { s: [], d: 1, adv: .3 }, '゜': { s: [], p: 1, adv: .3 },
  };
  const adv = g => (g.adv ?? 1.02);
  const kanaWidth = (text, size) => { let w = 0; for (const ch of text) { const g = G[ch]; if (g) w += adv(g) * size; } return w; };
  function strokeGlyph(c, g, x, y, size, lw) {
    const sc = (g.sc || 1) * size / 100, ox = x + (g.sc ? (adv(g) * size - 100 * sc) / 2 : 0), oy = y + (g.sc ? size - 100 * sc - size * .02 : 0);
    c.lineWidth = lw; c.beginPath();
    for (const pl of g.s) { c.moveTo(ox + pl[0][0] * sc, oy + pl[0][1] * sc); for (let i = 1; i < pl.length; i++) c.lineTo(ox + pl[i][0] * sc, oy + pl[i][1] * sc); }
    if (g.d) { c.moveTo(ox + 74 * sc, oy + 8 * sc); c.lineTo(ox + 80 * sc, oy + 24 * sc); c.moveTo(ox + 88 * sc, oy + 4 * sc); c.lineTo(ox + 95 * sc, oy + 20 * sc); }
    if (g.bang) { c.moveTo(x + size * .24, y + size * .04); c.lineTo(x + size * .3, y + size * .64); c.moveTo(x + size * .28, y + size * .9); c.lineTo(x + size * .28, y + size * .92); }
    c.stroke();
    if (g.p) { c.beginPath(); c.arc(ox + 87 * sc, oy + 15 * sc, 11 * sc, 0, TAU); c.stroke(); }
  }
  function kana(ctx, text, x, y, size, o = {}) {
    let u = 0, alpha = o.alpha ?? 1, sc = 1, shk = 0;
    if (o.t0 !== undefined) {
      u = o.t - o.t0; const dur = o.dur ?? .9; if (u < 0 || u > dur) return false;
      const slam = o.slam ?? 1; sc = slam ? lerp(2.2, 1, ease.out(clamp(u / .1))) + .05 * Math.sin(clamp((u - .1) / .25) * Math.PI) : eob(u / .15);
      shk = (o.shake ?? 1) * Math.exp(-u * 11); alpha *= 1 - sm(dur - .25, dur, u);
      if (u < .03) alpha *= u / .03 * .6 + .4;
    }
    const w = kanaWidth(text, size), lw = size * .13, ol = size * .06, colr = o.color || ['#FFFFFF', '#FFC24A'], ink = o.outline || '#0a0614';
    const rot = (o.rot || 0) + shk * .05 * Math.sin(u * 90);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + shk * 14 * Math.sin(u * 120), y + shk * 12 * Math.cos(u * 100)); ctx.rotate(rot); ctx.scale(sc, sc); ctx.transform(1, 0, -(o.slant ?? .14), 1, 0, 0);
    ctx.translate(-w / 2, -size / 2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pass = (col, wid, dx, dy) => { ctx.strokeStyle = col; let px = 0; for (const ch of text) { const g = G[ch]; if (!g) continue; strokeGlyph(ctx, g, px + dx, dy, size, wid); px += adv(g) * size; } };
    pass(o.shadow || 'rgba(0,0,0,.55)', lw + ol * 2.2, size * .07, size * .09);
    pass(ink, lw + ol * 2, 0, 0);
    if (typeof colr !== 'string') pass('#fff', lw + ol * .7, 0, 0);
    if (typeof colr === 'string') pass(colr, lw, 0, 0);
    else { const gr = ctx.createLinearGradient(0, 0, 0, size); gr.addColorStop(0, colr[0]); gr.addColorStop(.55, colr[0]); gr.addColorStop(1, colr[1]); ctx.strokeStyle = gr; let px = 0; for (const ch of text) { const g = G[ch]; if (!g) continue; strokeGlyph(ctx, g, px, 0, size, lw); px += adv(g) * size; } }
    ctx.restore(); return true;
  }

  // ------------------------------------------------------------ sakura
  function petal(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * .95, -s * .75, s * .85, s * .55, s * .12, s); ctx.lineTo(0, s * .78); ctx.lineTo(-s * .12, s); ctx.bezierCurveTo(-s * .85, s * .55, -s * .95, -s * .75, 0, -s); ctx.closePath(); }
  function sakura(ctx, t, o = {}) {
    const n = o.n ?? 16, wind = o.wind ?? 1, seed = o.seed ?? 1, ar = o.area || [0, 0, W, H], sz = o.size ?? 1;
    ctx.save(); ctx.globalAlpha = o.alpha ?? .85;
    for (let i = 0; i < n; i++) {
      const per = 7 + hash(i + seed * 5) * 6, ph = (t / per + hash(i * 2.3 + seed)) % 1, sway = Math.sin(t * (.9 + hash(i) * .8) + i * 1.7);
      const x = ar[0] + ((hash(i * 7.1 + seed * 3) * ar[2] + ph * (280 + 200 * hash(i + 9)) * wind + sway * 60) % ar[2] + ar[2]) % ar[2], y = ar[1] - 40 + ph * (ar[3] + 80);
      const s = (9 + hash(i * 1.3) * 10) * sz, rot = t * (.6 + hash(i + 4)) + i, fl = Math.cos(t * (1.5 + hash(i + 2)) + i);
      const fade = sm(0, .06, ph) * (1 - sm(.94, 1, ph));
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .35 + .65 * Math.abs(fl)); ctx.globalAlpha *= fade;
      petal(ctx, s); ctx.fillStyle = fl > 0 ? '#FFC4D8' : '#FF9FC2'; ctx.fill(); ctx.lineWidth = Math.max(1.2, s * .1); ctx.strokeStyle = 'rgba(190,70,120,.55)'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ glints & marks
  function glint(ctx, x, y, r, t, o = {}) {
    let k = 1; if (o.life !== false) { if (t < 0 || t > 1) return; k = Math.sin(t * Math.PI); k = k * k * (3 - 2 * k); } else k = .6 + .4 * Math.sin(t * 6);
    const rr = r * k; if (rr < .5) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr * .55); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr * .55, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = o.color || '#fff'; ctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, a2 = a + Math.PI / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a2) * rr * .16, Math.sin(a2) * rr * .16); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function sweat(ctx, x, y, s, t) {
    if (t < 0 || t > 1) return; const p = eob(t / .25), a = 1 - sm(.75, 1, t), dy = t * s * .5; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + dy); ctx.scale(s * p, s * p);
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.bezierCurveTo(14, -30, 40, -6, 40, 22); ctx.bezierCurveTo(40, 50, 20, 64, 0, 64); ctx.bezierCurveTo(-20, 64, -40, 50, -40, 22); ctx.bezierCurveTo(-40, -6, -14, -30, 0, -60); ctx.closePath();
    const g = ctx.createLinearGradient(0, -60, 0, 64); g.addColorStop(0, '#DFF6FF'); g.addColorStop(1, '#5AB8FF'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#1a2a63'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-16, 24, 7, 15, .3, 0, TAU); ctx.fill(); ctx.restore();
  }
  function anger(ctx, x, y, s, t) {
    if (t < 0 || t > 1) return; const p = eob(t / .2) * (1 + .1 * Math.sin(t * 34)), a = 1 - sm(.8, 1, t); ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s * p, s * p); ctx.rotate(.1); ctx.lineCap = 'round';
    for (const [w, col] of [[34, '#3a0612'], [18, '#FF3040']]) { ctx.lineWidth = w; ctx.strokeStyle = col; for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { ctx.beginPath(); const cx = sx * 62, cy = sy * 62, a0 = Math.atan2(-cy, -cx); ctx.arc(cx, cy, 50, a0 - .85, a0 + .85); ctx.stroke(); } }
    ctx.restore();
  }
  function exclaim(ctx, x, y, s, t, o = {}) {
    if (t < 0 || t > 1) return; const p = eob(t / .18), a = 1 - sm(.8, 1, t), kind = o.kind || '!'; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate((o.rot ?? -.15) + .06 * Math.sin(t * 30)); ctx.scale(s * p, s * p);
    ctx.font = '900 130px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round';
    ctx.lineWidth = 34; ctx.strokeStyle = '#0a0614'; ctx.strokeText(kind, 0, 0); ctx.lineWidth = 16; ctx.strokeStyle = '#fff'; ctx.strokeText(kind, 0, 0);
    const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, o.color || '#FF4A5A'); g.addColorStop(1, '#C0102A'); ctx.fillStyle = g; ctx.fillText(kind, 0, 0); ctx.restore();
  }
  function shine(ctx, x, y, s, t, o = {}) {
    const a = .55 + .45 * Math.sin(t * 8); ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s); ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (const [k, col, w] of [[0, '#0a0614', 12], [1, o.color || '#FF6E9C', 6]]) { ctx.strokeStyle = col; ctx.lineWidth = w; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(i * 26, 0); ctx.lineTo(i * 26 + 16, 46); ctx.stroke(); } }
    ctx.restore();
  }
  function sparkleEyes(ctx, x, y, r, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = o.color || '#2a1a5e'; ctx.fill(); ctx.lineWidth = r * .1; ctx.strokeStyle = '#0a0614'; ctx.stroke();
    ctx.clip(); const gr = ctx.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(120,200,255,.55)'); ctx.fillStyle = gr; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .32, r * .3, r * .26, -.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(r * .32, r * .3, r * .13, 0, TAU); ctx.fill(); ctx.restore();
    glint(ctx, x + r * .2, y - r * .1, r * (.9 + .25 * Math.sin(t * 9)), t, { life: false, rot: t * .8 });
  }

  // ------------------------------------------------------------ panel slam wipe
  function panel(ctx, t, t0, dir = 1, o = {}) {
    const dur = o.dur ?? .26, u = (t - t0) / dur; if (u <= 0 || u >= 1) return 0;
    const bw = o.width ?? 250, lean = (o.lean ?? .3) * (dir >= 0 ? 1 : -1), reach = 900 + bw;
    const e = ease.inOut(u) * .55 + u * .45, c = lerp(-reach, reach, dir >= 0 ? e : 1 - e);
    ctx.save(); ctx.globalAlpha = o.alpha ?? .94; ctx.translate(540, 960); ctx.rotate(lean);
    ctx.fillStyle = o.color || '#05060f'; ctx.fillRect(c - bw / 2, -2200, bw, 4400);
    // hatch speed lines inside slab
    ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let i = 0; i < 9; i++) { const yy = -1800 + i * 430 + (hash(i + 1) * 90), off = (hash(i + 7) - .5) * bw * .6; ctx.fillRect(c + off - 2, yy, 4, 260); }
    ctx.globalAlpha = 1; ctx.fillStyle = o.gutter || '#fff'; ctx.fillRect(c - bw / 2 - 16, -2200, 16, 4400); ctx.fillRect(c + bw / 2, -2200, 16, 4400);
    ctx.fillStyle = o.accent || '#FFC24A'; ctx.fillRect(c - bw / 2 - 30, -2200, 6, 4400);
    ctx.restore();
    return clamp(bw * 2000 / (W * H) * Math.sin(u * Math.PI));
  }

  // ------------------------------------------------------------ cel helper
  function cel(ctx, drawFn, o = {}) {
    const w = o.w ?? W, h = o.h ?? H, key = 'cel' + (o.key || ''), cv = (cel._c = cel._c || {})[key] || (cel._c[key] = mk(w, h)), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.filter = 'none'; c.globalCompositeOperation = 'source-over'; drawFn(c);
    const sil = (cel._s = cel._s || {})[key] || (cel._s[key] = mk(w, h)), s = sil.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, w, h); s.drawImage(cv, 0, 0);
    s.globalCompositeOperation = 'source-in'; s.fillStyle = o.ink || '#1a1330'; s.fillRect(0, 0, w, h); s.globalCompositeOperation = 'source-over';
    const R = o.width ?? 5; ctx.save(); const x = o.x || 0, y = o.y || 0;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.drawImage(sil, x + Math.cos(a) * R, y + Math.sin(a) * R); }
    ctx.filter = `saturate(${o.sat ?? 1.25}) contrast(${o.con ?? 1.1})`; ctx.drawImage(cv, x, y); ctx.restore();
  }

  // ------------------------------------------------------------ title card
  function title(ctx, text, x, y, size, o = {}) {
    let k = 1, a = 1; if (o.t0 !== undefined) { const u = o.t - o.t0; if (u < 0) return; k = eob(u / .25); a = clamp(u / .05); }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(k, k); ctx.transform(1, 0, -(o.slant ?? .16), 1, 0, 0);
    ctx.font = `900 ${size}px ${o.font || 'Rubik'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    const off = o.off || ['#FF3E9A', '#25D0FF'], d = size * .06;
    ctx.fillStyle = off[0]; ctx.fillText(text, d * 1.4, d * 1.6); ctx.fillStyle = off[1]; ctx.fillText(text, -d * 1.2, d * 1.0);
    ctx.lineWidth = size * .26; ctx.strokeStyle = o.ink || '#0a0f3a'; ctx.strokeText(text, 0, 0);
    ctx.lineWidth = size * .15; ctx.strokeStyle = o.edge || '#fff'; ctx.strokeText(text, 0, 0);
    const cols = o.colors || [[0, '#FFF3C4'], [.45, '#FFC24A'], [1, '#E48A12']], g = ctx.createLinearGradient(0, -size * .5, 0, size * .5); cols.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  function bloomHalo(ctx, x, y, r, t, o = {}) {
    const br = 1 + .05 * Math.sin(t * 3); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = o.alpha ?? .6;
    const g = ctx.createRadialGradient(x, y, r * .2, x, y, r * br); g.addColorStop(0, 'rgba(255,240,200,.0)'); g.addColorStop(.7, o.color || '#FFD98A'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    ctx.globalAlpha = (o.alpha ?? .6) * .9; ctx.strokeStyle = o.color || '#FFE9A8'; for (let i = 0; i < (o.rings ?? 2); i++) { ctx.lineWidth = 6 - i * 2; ctx.beginPath(); ctx.arc(x, y, r * (.72 + i * .14) * br, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  V_.anime = { speedLines, flashLines, rays, halftone, impact, kana, kanaWidth, sakura, glint, sweat, anger, exclaim, shine, sparkleEyes, panel, cel, title, bloomHalo, GLYPHS: G, SFX: { gold: ['#FFFFFF', '#FFC24A'], hot: ['#FFF3C4', '#FF4A5A'], ice: ['#FFFFFF', '#5AD1FF'], pink: ['#FFFFFF', '#FF6EC7'] } };
})();
