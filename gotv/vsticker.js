// GOTV sticker pack (creator overlays). V.sticker(ctx, name, x, y, s, o), V.stickerNames.
// o = {t (global time), t0 (pop-in start; omit = fully shown), rot (radians), tOut (pop-out start), alpha, text, color, count, from, seed, outline:false}
// s=1 -> sticker roughly 300 px. White sticker outline + drop shadow, snappy per-sticker pop-in driven by (t - t0). Deterministic.
// text stickers: wow boom pow zap (o.text, Hebrew or Latin), notif/comment (o.text), live (o.text), stamp (o.text), like (o.count, o.from).
(() => {
  const { clamp, lerp, hash, ease } = A, TAU = Math.PI * 2;
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rg = (g, x, y, r0, r1, st) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const NAVY = '#0B1450', INK = '#1a1330';
  const heb = s => /[֐-׿]/.test(s || '');
  const spr = (u, k = 11, w = 20) => u <= 0 ? 0 : 1 - Math.exp(-k * u) * Math.cos(w * u);
  const eo = x => ease.out(clamp(x)), eob = x => ease.outBack(clamp(x));
  const gloss = (g, w, h, r = 0) => { g.save(); g.fillStyle = lg(g, 0, -h, 0, 0, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.ellipse(0, -h * .55, w, h * .55, 0, 0, TAU); g.fill(); g.restore(); };
  // text with fit: Hebrew -> Rubik 900 (rtl), Latin -> Bangers
  function fit(g, str, size, maxW, fam) {
    const H = heb(str); const f = px => `${H ? 900 : 400} ${px}px ${H ? 'Rubik' : (fam || 'Bangers')}`;
    g.font = f(size); g.direction = H ? 'rtl' : 'ltr'; const w = g.measureText(str).width; const k = Math.min(1, maxW / Math.max(1, w)); g.font = f(size * k); return size * k;
  }
  function label(g, str, x, y, size, o = {}) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const px = fit(g, str, size, o.maxW || 240, o.fam); if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = y = 0; }
    g.lineWidth = o.sw ?? px * .17; g.strokeStyle = o.stroke || NAVY; g.strokeText(str, x, y + (o.dy || 0));
    if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x, y + px * .07); }
    g.fillStyle = o.grad ? lg(g, 0, y - px * .5, 0, y + px * .5, o.grad) : (o.fill || '#fff'); g.fillText(str, x, y);
    g.restore();
  }
  // tapered marker stroke from polyline
  function marker(g, pts, W, col, edge) {
    const n = pts.length; if (n < 2) return; const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const f = i / (n - 1), w = W * Math.min(1, .28 + f * 6, .28 + (1 - f) * 2.2) / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = n - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
    g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = edge || 'rgba(60,20,0,.55)'; g.stroke(); g.fillStyle = col; g.fill();
  }
  const bez = (p0, p1, p2, p3, t) => { const m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]; };
  const wob = (i, sd, a) => (A.noise1(i * .35 + sd * 7.7) * a);
  const burstPath = (g, n, r1, r2, sd, jit = .18, rot = 0) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r1 * (1 + (hash(i + sd) - .5) * jit) : r2 * (1 + (hash(i * 3 + sd) - .5) * jit * 1.4); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); };
  const starPath = (g, n, r1, r2, rot = -Math.PI / 2) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r1 : r2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); };
  const sparkle4 = (g, x, y, r, col, rot = 0, a = 1) => { g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(r * .12, -r * .12, r, 0); g.quadraticCurveTo(r * .12, r * .12, 0, r); g.quadraticCurveTo(-r * .12, r * .12, -r, 0); g.quadraticCurveTo(-r * .12, -r * .12, 0, -r); g.fill(); g.restore(); };
  const heartPath = (g, s = 1) => { g.beginPath(); g.moveTo(0, 62 * s); g.bezierCurveTo(-120 * s, -6 * s, -62 * s, -100 * s, 0, -42 * s); g.bezierCurveTo(62 * s, -100 * s, 120 * s, -6 * s, 0, 62 * s); g.closePath(); };
  const halftone = (g, R, col) => { g.save(); g.fillStyle = col; for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) { const x = i * 16 + (j % 2) * 8, y = j * 14, d = Math.hypot(x, y - 10); const r = clamp((d - 30) / 120) * 4.6 * clamp((x * .6 + y * .8 + 60) / 140); if (r > .6 && Math.hypot(x, y) < R) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } } g.restore(); };

  // ----------------------------------------------------------------- sticker art (local coords, ~ +-140)
  const S = {};
  // hand-drawn curved arrow that draws itself
  S.arrow = (g, u, o) => {
    const p = ease.inOut(clamp(u / .55)), P = [[-125, 95], [-110, -55], [30, -105], [115, -35]], pts = [], N = 40, sd = 3;
    for (let i = 0; i <= Math.round(N * p); i++) { const q = bez(P[0], P[1], P[2], P[3], i / N); pts.push([q[0] + wob(i, sd, 3), q[1] + wob(i, sd + 4, 3)]); }
    const col = o.color || '#FFC24A'; marker(g, pts, 20, col);
    const hp = eo((u - .5) / .18);
    if (hp > 0) {
      const e = bez(P[0], P[1], P[2], P[3], 1), b = bez(P[0], P[1], P[2], P[3], .93), an = Math.atan2(e[1] - b[1], e[0] - b[0]);
      for (const sd2 of [-1, 1]) { const a2 = an + Math.PI + sd2 * .55, L = 62 * hp; marker(g, [[e[0] + 2, e[1] + 2], [e[0] + 2 + Math.cos(a2) * L * .5, e[1] + 2 + Math.sin(a2) * L * .5], [e[0] + 2 + Math.cos(a2) * L, e[1] + 2 + Math.sin(a2) * L]], 19, col); }
    }
  };
  S.circle = (g, u, o) => {
    const p = ease.inOut(clamp(u / .6)), pts = [], N = 70, T1 = TAU * 1.13, col = o.color || '#FF3B4A';
    g.save(); g.rotate(-.18);
    for (let i = 0; i <= Math.round(N * p); i++) { const th = -2.3 + T1 * i / N, k = 1 + .07 * (i / N) + wob(i, 5, .03); pts.push([Math.cos(th) * 128 * k, Math.sin(th) * 98 * k]); }
    marker(g, pts, 17, col, 'rgba(90,0,10,.5)'); g.restore();
  };
  S.underline = (g, u, o) => {
    const col = o.color || '#FFC24A';
    const line = (p, off, wd, sd) => { const pts = [], N = 34; for (let i = 0; i <= Math.round(N * p); i++) { const f = i / N, q = bez([-135, 20 + off], [-40, -10 + off], [60, 30 + off], [138, -22 + off], f); pts.push([q[0], q[1] + wob(i, sd, 2)]); } marker(g, pts, wd, col); };
    line(ease.out(clamp(u / .32)), 0, 26, 1); line(ease.out(clamp((u - .12) / .3)), 44, 17, 2);
  };
  // comic bursts
  const BURST = {
    wow: { c1: '#FFF3C4', c2: '#FFC24A', c3: '#E48A12', t: 'WOW!', tg: [[0, '#FFFFFF'], [1, '#BFE2FF']], st: '#1743C9', n: 13, ha: 'rgba(255,255,255,.35)' },
    boom: { c1: '#FFD36B', c2: '#FF6A2B', c3: '#C4152A', t: 'BOOM!', tg: [[0, '#FFF6B0'], [1, '#FFC24A']], st: '#5A0A12', n: 11, ha: 'rgba(255,240,140,.4)' },
    pow: { c1: '#FFB0D6', c2: '#FF4F9A', c3: '#B0136A', t: 'POW!', tg: [[0, '#FFFFFF'], [1, '#FFE0F0']], st: '#5A0F55', n: 12, ha: 'rgba(255,255,255,.4)' },
    zap: { c1: '#B8F1FF', c2: '#38B6FF', c3: '#1743C9', t: 'ZAP!', tg: [[0, '#FFF6B0'], [1, '#FFC24A']], st: '#0B1450', n: 9, ha: 'rgba(255,255,255,.35)' },
  };
  Object.keys(BURST).forEach(k => {
    S[k] = (g, u, o) => {
      const B = BURST[k], sd = k.length * 11; g.save(); g.rotate(k === 'boom' ? .06 : -.04);
      g.save(); g.rotate(.13); burstPath(g, B.n, 112, 150, sd + 1); g.fillStyle = B.c3; g.fill(); g.restore();
      burstPath(g, B.n, 108, 144, sd); g.fillStyle = rg(g, -25, -35, 8, 170, [[0, B.c1], [.55, B.c2], [1, B.c3]]); g.fill(); g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = B.st; g.stroke();
      g.save(); burstPath(g, B.n, 108, 144, sd); g.clip(); halftone(g, 160, B.ha); g.restore();
      if (k === 'zap') { g.save(); g.translate(-96, -80); g.rotate(-.2); g.beginPath(); [[8, -34], [-18, 4], [-2, 4], [-10, 34], [22, -8], [4, -8]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = '#FFE066'; g.fill(); g.lineWidth = 4; g.strokeStyle = NAVY; g.stroke(); g.restore(); }
      const str = o.text || B.t; label(g, str, 0, 4, 92, { grad: B.tg, stroke: B.st, maxW: 208, rot: -.1, shadow: 'rgba(0,0,0,.25)' });
      g.restore();
    };
  });
  // fire
  S.fire = (g, u, o) => {
    const fl = (a, b) => A.noise1(u * 9 + a) * b;
    const flame = (sc, c1, c2, c3, dy, ph) => {
      g.save(); g.translate(0, dy); g.scale(sc, sc * (1 + fl(ph, .04)));
      const sw = fl(ph + 3, 16), sw2 = fl(ph + 9, 10);
      g.beginPath(); g.moveTo(0, 118); g.bezierCurveTo(-98, 118, -108, 30, -56, -20); g.bezierCurveTo(-64, 6, -38, -14, -26, -66); g.bezierCurveTo(-14, -104, 18 + sw2, -110, 8 + sw, -150);
      g.bezierCurveTo(70, -104, 112, -24, 98, 42); g.bezierCurveTo(90, 96, 56, 118, 0, 118); g.closePath();
      g.fillStyle = lg(g, 0, -140, 0, 120, [[0, c1], [.5, c2], [1, c3]]); g.fill(); g.restore();
    };
    flame(1, '#FFB02B', '#FF5A1F', '#D4142B', 0, 0); g.save(); g.lineWidth = 5; g.strokeStyle = '#7A0A18'; g.lineJoin = 'round'; g.beginPath(); g.restore();
    flame(.7, '#FFF07A', '#FFB520', '#FF6A1F', 32, 5); flame(.4, '#FFFFFF', '#FFF3B0', '#FFD25A', 60, 11);
    for (let i = 0; i < 5; i++) { const k = (u * 1.1 + i * .21) % 1; sparkle4(g, Math.sin(i * 2.7) * 70 + wob(k * 5, i, 10), 70 - k * 200, 10 * (1 - k) + 2, '#FFE066', k * 4, 1 - k); }
  };
  S.eyes = (g, u, o) => {
    const slot = Math.floor(u * 2.4), f = u * 2.4 - slot, e = eo(f * 4), tgt = i => [(hash(i * 3 + 1) - .5) * 2, (hash(i * 3 + 2) - .5) * 1.4];
    const a = tgt(slot - 1), b = tgt(slot), lx = lerp(a[0], b[0], e), ly = lerp(a[1], b[1], e), bl = (u % 2.6) < .14 ? Math.sin((u % 2.6) / .14 * Math.PI) : 0;
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * 58, 0); g.rotate(sd * .09); g.beginPath(); g.ellipse(0, 0, 54, 74, 0, 0, TAU); g.fillStyle = lg(g, 0, -74, 0, 74, [[0, '#FFFFFF'], [1, '#D6E4FF']]); g.fill(); g.lineWidth = 7; g.strokeStyle = NAVY; g.stroke();
      const px = lx * 22, py = ly * 26 + 6; g.beginPath(); g.ellipse(px, py, 28, 32, 0, 0, TAU); g.fillStyle = rg(g, px, py + 8, 3, 34, [[0, '#7FE6FF'], [.55, '#2F7BFF'], [1, '#0A1E8A']]); g.fill(); g.beginPath(); g.ellipse(px, py, 14, 17, 0, 0, TAU); g.fillStyle = '#050B33'; g.fill();
      g.beginPath(); g.arc(px - 8, py - 11, 7, 0, TAU); g.fillStyle = '#fff'; g.fill();
      if (bl) { g.beginPath(); g.ellipse(0, -74 + 74 * bl, 56, 74 * bl + 2, 0, Math.PI, TAU); g.rect(-56, -78, 112, 0); g.fillStyle = '#5AB2FF'; g.save(); g.beginPath(); g.ellipse(0, 0, 54, 74, 0, 0, TAU); g.clip(); g.fillRect(-60, -80, 120, 150 * bl); g.restore(); }
      g.restore();
    }
  };
  S.heart = (g, u, o) => {
    const bt = 1 + .07 * Math.max(0, Math.sin(u * 9)) * Math.exp(-u * .0);
    g.save(); g.scale(bt, bt); heartPath(g); g.fillStyle = lg(g, -60, -90, 60, 80, [[0, '#FF8FB6'], [.45, '#FF3D78'], [1, '#C4104F']]); g.fill(); g.lineWidth = 6; g.strokeStyle = '#8E0B3C'; g.lineJoin = 'round'; g.stroke();
    g.save(); heartPath(g); g.clip(); g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(-30, -66, 64, 30, -.35, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(-58, -46, 10, 18, .7, 0, TAU); g.fill(); g.restore();
    for (let i = 0; i < 3; i++) { const k = (u * .9 + i / 3) % 1; g.save(); g.globalAlpha = 1 - k; g.translate(50 + i * 22 - 30, -60 - k * 80); g.rotate(.3 * i - .3); heartPath(g, .13 + .05 * i); g.fillStyle = '#FF5C8A'; g.fill(); g.restore(); }
  };
  S.thumbsup = (g, u, o) => {
    g.save(); g.rotate(-.12 + Math.sin(u * 5) * .03);
    g.beginPath(); g.roundRect(-118, 4, 62, 112, 16); g.fillStyle = lg(g, -118, 0, -56, 0, [[0, '#63CFFF'], [.5, '#2F6BFF'], [1, '#1533B4']]); g.fill(); g.lineWidth = 5; g.strokeStyle = NAVY; g.stroke();
    const hand = new Path2D(); hand.roundRect(-58, 4, 168, 112, 34); hand.roundRect(-46, -98, 52, 120, 26);
    g.fillStyle = lg(g, -40, -90, 100, 110, [[0, '#FFF0B0'], [.35, '#FFC24A'], [1, '#E48A12']]); g.fill(hand); g.lineWidth = 6; g.strokeStyle = '#8A4A05'; g.lineJoin = 'round'; g.stroke(hand);
    g.strokeStyle = 'rgba(140,70,0,.6)'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(70, 26 + i * 27); g.lineTo(104 - i * 3, 26 + i * 27); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.roundRect(-36, -86, 14, 70, 7); g.fill(); g.beginPath(); g.roundRect(-40, 14, 90, 12, 6); g.fill();
    g.restore(); for (let i = 0; i < 3; i++) { const a = -1.9 + i * .5, r = 128 + Math.sin(u * 12 + i) * 6; g.save(); g.strokeStyle = '#FFF3C4'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(Math.cos(a) * r - 20, Math.sin(a) * r - 40); g.lineTo(Math.cos(a) * (r + 24) - 20, Math.sin(a) * (r + 24) - 40); g.stroke(); g.restore(); }
  };
  S.star = (g, u, o) => {
    g.save(); g.rotate(Math.sin(u * 3) * .12); g.lineJoin = 'round';
    starPath(g, 5, 56, 124); g.lineWidth = 34; g.strokeStyle = '#E48A12'; g.stroke(); g.fillStyle = '#E48A12'; g.fill();
    starPath(g, 5, 56, 124); g.lineWidth = 30; g.strokeStyle = lg(g, 0, -120, 0, 110, [[0, '#FFF6CF'], [.5, '#FFC24A'], [1, '#F0A020']]); g.stroke(); g.fillStyle = lg(g, -40, -120, 40, 110, [[0, '#FFF6CF'], [.45, '#FFC94F'], [1, '#F0A020']]); g.fill();
    g.save(); starPath(g, 5, 56, 124); g.clip(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-20, -70, 70, 34, -.5, 0, TAU); g.fill(); g.restore(); g.restore();
    for (let i = 0; i < 3; i++) sparkle4(g, [-110, 110, 96][i], [-70, -40, 90][i], 16 + 8 * Math.sin(u * 8 + i * 2), '#fff', 0, 1);
  };
  // faces
  function faceBase(g, tint) {
    g.beginPath(); g.arc(0, 0, 104, 0, TAU); g.fillStyle = rg(g, -30, -40, 8, 130, tint || [[0, '#FFF3A0'], [.5, '#FFD34A'], [1, '#F0A020']]); g.fill(); g.lineWidth = 6; g.strokeStyle = '#B4650A'; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-10, -78, 70, 26, 0, 0, TAU); g.fill(); g.restore();
  }
  const DK = '#3B1E00';
  S.lol = (g, u, o) => {
    g.save(); g.translate(Math.sin(u * 46) * 2.5, Math.sin(u * 37) * 2); g.rotate(Math.sin(u * 23) * .05); faceBase(g);
    g.lineCap = 'round'; g.strokeStyle = DK; g.lineWidth = 9; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 62 - 26, -14); g.lineTo(sd * 62 + 26 * 0, -34 + 0); g.lineTo(sd * 62 + 26, -14); g.stroke(); }
    g.beginPath(); g.moveTo(-58, 18); g.quadraticCurveTo(0, 22, 58, 18); g.bezierCurveTo(52, 86, -52, 86, -58, 18); g.closePath(); g.fillStyle = '#7A0F35'; g.fill(); g.lineWidth = 7; g.stroke();
    g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-60, 16, 120, 20); g.fillStyle = '#FF6E96'; g.beginPath(); g.ellipse(0, 82, 30, 22, 0, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,90,140,.4)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 76, 10, 20, 12, 0, 0, TAU); g.fill(); }
    g.restore();
    for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const k = (u * 2 + i * .5 + (sd > 0 ? .25 : 0)) % 1; g.save(); g.translate(sd * (100 + k * 34 + i * 10), -20 + k * 46 - i * 10); g.globalAlpha = 1 - k * k; g.rotate(sd * -.5); g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(12, 2, 0, 10); g.quadraticCurveTo(-12, 2, 0, -16); g.fillStyle = '#7FE0FF'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1E7FD0'; g.stroke(); g.restore(); }
  };
  S.shock = (g, u, o) => {
    g.save(); g.translate(Math.sin(u * 50) * 2, 0); faceBase(g, [[0, '#FFF3B8'], [.5, '#FFD34A'], [1, '#F0A020']]);
    g.strokeStyle = DK; g.lineCap = 'round'; g.lineWidth = 8; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 30, -58); g.quadraticCurveTo(sd * 52, -72 - 4, sd * 74, -56); g.stroke(); }
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 40, -20, 27, 33, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 6; g.stroke(); g.beginPath(); g.arc(sd * 40, -20, 8, 0, TAU); g.fillStyle = DK; g.fill(); }
    g.beginPath(); g.ellipse(0, 52, 22, 30, 0, 0, TAU); g.fillStyle = '#7A0F35'; g.fill(); g.lineWidth = 7; g.stroke();
    g.fillStyle = 'rgba(80,160,255,.55)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 74, 22, 16, 10, 0, 0, TAU); g.fill(); }
    g.restore();
    const k = (u * 1.2) % 1; g.save(); g.translate(86, -60 + k * 30); g.globalAlpha = 1 - k; g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(13, 0, 0, 10); g.quadraticCurveTo(-13, 0, 0, -18); g.fillStyle = '#9BE7FF'; g.fill(); g.restore();
    for (const sd of [-1, 1]) { g.save(); g.translate(sd * 110, 54); g.rotate(sd * .3); g.beginPath(); g.ellipse(0, 0, 26, 34, 0, 0, TAU); g.fillStyle = lg(g, -20, -30, 20, 30, [[0, '#FFF0B0'], [1, '#F0A020']]); g.fill(); g.lineWidth = 5; g.strokeStyle = '#8A4A05'; g.stroke(); g.restore(); }
  };
  S.cool = (g, u, o) => {
    g.save(); g.rotate(Math.sin(u * 4) * .05); faceBase(g);
    g.save(); g.beginPath(); g.moveTo(-104, -28); g.lineTo(104, -28); g.lineTo(96, -12); g.lineTo(-96, -12); g.closePath(); g.fillStyle = '#111'; g.fill(); g.restore();
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 8, -34); g.lineTo(sd * 92, -34); g.bezierCurveTo(sd * 96, 24, sd * 66, 34, sd * 50, 28); g.bezierCurveTo(sd * 22, 24, sd * 10, 4, sd * 8, -34); g.closePath(); g.fillStyle = lg(g, 0, -34, 0, 30, [[0, '#2a2f4a'], [.5, '#0b0d1c'], [1, '#050510']]); g.fill(); g.lineWidth = 5; g.strokeStyle = '#000'; g.stroke(); }
    g.save(); g.beginPath(); g.rect(-110, -40, 220, 80); g.clip(); const gx = -160 + ((u * .7) % 1.4) * 260; g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(gx, -40); g.lineTo(gx + 26, -40); g.lineTo(gx - 20, 40); g.lineTo(gx - 46, 40); g.fill(); g.restore();
    g.strokeStyle = DK; g.lineCap = 'round'; g.lineWidth = 8; g.beginPath(); g.moveTo(-40, 60); g.quadraticCurveTo(10, 84, 52, 46); g.stroke(); g.restore();
    sparkle4(g, 60 + 0, -28, 14 + Math.sin(u * 9) * 5, '#fff', 0, 1);
  };
  S.mindblown = (g, u, o) => {
    g.save(); g.translate(0, 62); g.scale(.78, .78); faceBase(g);
    g.strokeStyle = DK; g.lineCap = 'round'; g.lineWidth = 8; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 40, -12, 25, 30, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 6; g.stroke(); g.beginPath(); g.arc(sd * 40 + Math.sin(u * 20) * 2, -18, 8, 0, TAU); g.fillStyle = DK; g.fill(); g.lineWidth = 8; g.beginPath(); g.moveTo(sd * 22, -56); g.quadraticCurveTo(sd * 44, -66, sd * 66, -52); g.stroke(); }
    g.beginPath(); g.ellipse(0, 54, 20, 26, 0, 0, TAU); g.fillStyle = '#7A0F35'; g.fill(); g.lineWidth = 7; g.stroke(); g.restore();
    const ex = spr(u * 1.8, 9, 16), cy = -62;
    g.save(); g.translate(0, cy); g.rotate(u * .6); burstPath(g, 9, 44 * ex, 78 * ex, 5, .3); g.fillStyle = lg(g, 0, -80, 0, 80, [[0, '#FFF3B0'], [.5, '#FFB520'], [1, '#FF4A1F']]); g.fill(); g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = '#8A1A10'; g.stroke();
    g.beginPath(); g.arc(0, 0, 26 * ex, 0, TAU); g.fillStyle = '#FFFBE0'; g.fill(); g.restore();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i - 4.5) * .34 + (hash(i) - .5) * .18, k = ((u * .9 + hash(i + 7)) % 1), d = 84 + k * (70 + hash(i + 4) * 50), r = (12 + hash(i + 2) * 12) * (1 - k * .7);
      g.save(); g.globalAlpha = Math.min(1, ex) * (1 - k * k); g.translate(Math.cos(a) * d, cy + Math.sin(a) * d * .9); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = ['#FF3B4A', '#FF8A1F', '#FFC24A', '#FFE066'][i % 4]; g.fill(); g.lineWidth = 3.5; g.strokeStyle = 'rgba(100,20,10,.6)'; g.stroke(); g.restore();
    }
    for (let i = 0; i < 3; i++) sparkle4(g, [-92, 94, 0][i], [-100, -84, -150][i], 14 + 6 * Math.sin(u * 9 + i), '#fff', 0, 1);
  };
  S.clap = (g, u, o) => {
    const c = (u * 4.5) % 1, gap = 46 * Math.abs(Math.cos(c * Math.PI)) * (u < 5 ? 1 : 1), hit = gap < 10;
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * (gap + 12), 10); g.rotate(-sd * (.5 - gap * .004)); g.scale(sd, 1);
      g.beginPath(); g.roundRect(-14, -86, 66, 156, 30); g.fillStyle = lg(g, 0, -86, 60, 70, [[0, '#FFF0B0'], [.4, '#FFC24A'], [1, '#E48A12']]); g.fill(); g.lineWidth = 6; g.strokeStyle = '#8A4A05'; g.stroke();
      g.strokeStyle = 'rgba(140,70,0,.5)'; g.lineWidth = 4; g.lineCap = 'round'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-14 + i * 16.5, -80); g.lineTo(-14 + i * 16.5, -34); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.roundRect(-2, -70, 10, 100, 5); g.fill(); g.restore();
    }
    const h2 = hit ? 1 : Math.max(0, .6 - c * 1.5);
    g.strokeStyle = '#FFF3C4'; g.lineCap = 'round'; g.lineWidth = 8; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .5, r0 = 118, r1 = 118 + 40 * Math.max(.2, h2 + .3); g.globalAlpha = Math.min(1, .3 + h2); g.beginPath(); g.moveTo(Math.cos(a) * r0, -40 + Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, -40 + Math.sin(a) * r1); g.stroke(); } g.globalAlpha = 1;
  };
  S.check = (g, u, o) => {
    g.beginPath(); g.arc(0, 0, 106, 0, TAU); g.fillStyle = lg(g, 0, -106, 0, 106, [[0, '#7CFFB4'], [.5, '#2FD27A'], [1, '#12915A']]); g.fill(); g.lineWidth = 8; g.strokeStyle = '#0B6B3F'; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(0, -74, 80, 30, 0, 0, TAU); g.fill(); g.restore();
    const p = eo((u - .12) / .3), pts = [[-52, 4], [-16, 42], [56, -38]]; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
    const l1 = clamp(p * 2), l2 = clamp(p * 2 - 1); g.lineTo(lerp(pts[0][0], pts[1][0], l1), lerp(pts[0][1], pts[1][1], l1)); if (l2 > 0) g.lineTo(lerp(pts[1][0], pts[2][0], l2), lerp(pts[1][1], pts[2][1], l2));
    g.strokeStyle = 'rgba(0,80,40,.5)'; g.lineWidth = 32; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 24; g.stroke();
    const r = eo((u - .1) / .5); if (r > 0 && r < 1) { g.globalAlpha = 1 - r; g.beginPath(); g.arc(0, 0, 106 + r * 34, 0, TAU); g.lineWidth = 8; g.strokeStyle = '#7CFFB4'; g.stroke(); g.globalAlpha = 1; }
  };
  S.cross = (g, u, o) => {
    g.save(); g.translate(Math.sin(u * 60) * 5 * Math.exp(-u * 6), 0);
    g.beginPath(); g.arc(0, 0, 106, 0, TAU); g.fillStyle = lg(g, 0, -106, 0, 106, [[0, '#FF9AA2'], [.45, '#FF3B4A'], [1, '#B0122A']]); g.fill(); g.lineWidth = 8; g.strokeStyle = '#7A0B1A'; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(0, -74, 80, 30, 0, 0, TAU); g.fill(); g.restore();
    const p1 = eo((u - .08) / .16), p2 = eo((u - .2) / .16); g.lineCap = 'round'; const seg = (a, b, p) => { if (p <= 0) return; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); g.strokeStyle = 'rgba(90,0,10,.5)'; g.lineWidth = 32; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 24; g.stroke(); };
    seg([-42, -42], [42, 42], p1); seg([42, -42], [-42, 42], p2); g.restore();
  };
  S.hundred = (g, u, o) => {
    g.save(); g.rotate(-.14); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 150px Rubik'; g.direction = 'ltr'; g.lineJoin = 'round';
    g.transform(1, 0, -.12, 1, 0, 0);
    g.lineWidth = 26; g.strokeStyle = '#7A0B1A'; g.strokeText('100', 0, -10); g.fillStyle = lg(g, 0, -90, 0, 70, [[0, '#FF8A92'], [.5, '#FF2D42'], [1, '#C4102B']]); g.fillText('100', 0, -10);
    g.save(); g.beginPath(); g.rect(-140, -100, 280, 44); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillText('100', 0, -10); g.restore();
    g.restore();
    const line = (p, off, wd) => { const pts = []; for (let i = 0; i <= 20 * p; i++) { const f = i / 20; pts.push([lerp(-108, 110, f), lerp(off + 6, off - 6, f)]); } marker(g, pts, wd, '#FF2D42', 'rgba(90,0,10,.6)'); };
    line(eo((u - .2) / .18), 82, 14); line(eo((u - .3) / .18), 112, 12);
  };
  // UI-ish stickers
  const tileGOTV = (g, x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.roundRect(-50, -50, 100, 100, 26); g.fillStyle = lg(g, -50, -50, 50, 50, [[0, '#63CFFF'], [.5, '#2F6BFF'], [1, '#1533B4']]); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke(); g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(0, -46, 66, 44, 0, 0, TAU); g.fill(); g.restore(); g.beginPath(); [[-12, -22], [24, 0], [-12, 22]].forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.fillStyle = lg(g, 0, -22, 0, 22, [[0, '#FFF3C4'], [1, '#FFA91C']]); g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#FFC24A'; g.stroke(); g.fill(); g.restore(); };
  const ftxt = (g, str, x, y, px, col, w = 800, align, maxW) => { g.save(); const H = heb(str); g.font = `${w} ${px}px Rubik`; g.direction = H ? 'rtl' : 'ltr'; if (maxW) { const m = g.measureText(str).width; if (m > maxW) g.font = `${w} ${px * maxW / m}px Rubik`; } g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(str, x, y); g.restore(); };
  S.notif = (g, u, o) => {
    const str = o.text || 'שידור חי התחיל!', H = heb(str), W = 336, Hh = 108;
    g.save(); g.beginPath(); g.roundRect(-W / 2, -Hh / 2, W, Hh, 30); g.fillStyle = lg(g, 0, -Hh / 2, 0, Hh / 2, [[0, '#FFFFFF'], [1, '#E4ECFF']]); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(120,150,230,.7)'; g.stroke();
    const ix = H ? W / 2 - 56 : -W / 2 + 56; tileGOTV(g, ix, 0, .72);
    const tx = H ? ix - 46 : ix + 46, al = H ? 'right' : 'left';
    ftxt(g, 'GOTV', tx, -26, 22, '#0B1450', 900, al); ftxt(g, o.sub || (H ? 'עכשיו' : 'now'), H ? -W / 2 + 28 : W / 2 - 28, -26, 18, '#7A86B8', 600, H ? 'left' : 'right');
    ftxt(g, str, tx, 14, 24, '#1a1f45', 700, al, 190); g.restore();
    const bp = spr((u - .35) / 1.2 * 1.5, 9, 22); g.save(); g.translate(H ? -W / 2 + 4 : W / 2 - 4, -Hh / 2 + 4); g.scale(bp, bp); g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fillStyle = '#FF3B4A'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); ftxt(g, '1', 0, 1, 24, '#fff', 900); g.restore();
  };
  S.comment = (g, u, o) => {
    const str = o.text || 'האפליקציה הכי טובה!', H = heb(str), W = 330, Hh = 128;
    g.save(); g.beginPath(); g.roundRect(-W / 2, -Hh / 2 - 6, W, Hh, 32); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.moveTo(-W / 2 + 40, Hh / 2 - 8); g.lineTo(-W / 2 + 28, Hh / 2 + 22); g.lineTo(-W / 2 + 76, Hh / 2 - 8); g.closePath(); g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(120,150,230,.6)'; g.beginPath(); g.roundRect(-W / 2, -Hh / 2 - 6, W, Hh, 32); g.stroke();
    const ax = H ? W / 2 - 50 : -W / 2 + 50, ay = -Hh / 2 + 42;
    g.beginPath(); g.arc(ax, ay, 30, 0, TAU); g.fillStyle = lg(g, ax - 30, ay - 30, ax + 30, ay + 30, [[0, '#FF8FB6'], [1, '#8A5BFF']]); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ax, ay - 6, 9, 0, TAU); g.fill(); g.beginPath(); g.ellipse(ax, ay + 20, 17, 11, 0, Math.PI, TAU); g.fill();
    const tx = H ? ax - 42 : ax + 42, al = H ? 'right' : 'left';
    ftxt(g, o.name || '@gotv_fan', tx, ay - 12, 20, '#2F6BFF', 800, al); ftxt(g, str, tx, ay + 22, 26, '#141A40', 700, al, 230);
    g.save(); g.translate(H ? -W / 2 + 40 : W / 2 - 40, Hh / 2 - 34); const hb = 1 + .2 * Math.max(0, Math.sin((u - .5) * 10)) * (u > .5 ? 1 : 0); g.scale(hb * .2, hb * .2); heartPath(g); g.fillStyle = '#FF3D78'; g.fill(); g.restore();
    g.restore();
  };
  S.like = (g, u, o) => {
    const from = o.from ?? 0, to = o.count ?? 12400, p = eo((u - .15) / 1.8), v = Math.round(lerp(from, to, p));
    const txt = v >= 10000 ? (v / 1000).toFixed(1) + 'K' : v >= 1000 ? (v / 1000).toFixed(1) + 'K' : String(v);
    const tick = Math.floor(p * 26), fr = (p * 26) % 1, beat = p > 0 && p < 1 ? Math.max(0, 1 - fr * 4) : 0;
    g.save(); g.beginPath(); g.roundRect(-130, -52, 260, 104, 52); g.fillStyle = lg(g, 0, -52, 0, 52, [[0, '#FFFFFF'], [1, '#E4ECFF']]); g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(120,150,230,.6)'; g.stroke();
    g.beginPath(); g.arc(-78, 0, 40, 0, TAU); g.fillStyle = lg(g, 0, -40, 0, 40, [[0, '#FF6E9C'], [1, '#D01050']]); g.fill();
    g.save(); g.translate(-78, 4); const hs = (.34 + .09 * beat); g.scale(hs, hs); heartPath(g); g.fillStyle = '#fff'; g.fill(); g.restore();
    g.font = '900 60px Rubik'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillStyle = '#0B1450'; g.fillText(txt, -26, 4 - beat * 3);
    g.restore();
    for (let i = 0; i < 4; i++) { const k = (p * 6 + i * .25) % 1; if (p > 0 && p < 1) { g.save(); g.globalAlpha = 1 - k; g.translate(-78 + Math.sin(i * 3.1) * 40 * k, -50 - k * 70); heartPath(g, .12); g.fillStyle = '#FF5C8A'; g.fill(); g.restore(); } }
  };
  S.live = (g, u, o) => {
    const str = o.text || 'LIVE', pl = .5 + .5 * Math.sin(u * 7);
    g.save(); g.beginPath(); g.roundRect(-100, -44, 200, 88, 24); g.fillStyle = lg(g, 0, -44, 0, 44, [[0, '#FF6A76'], [.5, '#FF2436'], [1, '#C4102B']]); g.fill(); g.lineWidth = 5; g.strokeStyle = '#7A0B1A'; g.stroke();
    g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(0, -46, 110, 34, 0, 0, TAU); g.fill(); g.restore();
    g.beginPath(); g.arc(-70, 0, 12 + pl * 3, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.globalAlpha = .4 * (1 - pl); g.beginPath(); g.arc(-70, 0, 15 + pl * 16, 0, TAU); g.fill(); g.globalAlpha = 1;
    const H = heb(str); g.font = `900 ${H ? 46 : 50}px Rubik`; g.direction = H ? 'rtl' : 'ltr'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(str, 18, 3); g.restore();
  };
  S.cursor = (g, u, o) => {
    const mv = ease.inOut(clamp(u / .55)), cx = lerp(-100, 0, mv), cy = lerp(-110, 0, mv), dn = u > .6 && u < .78 ? 1 : 0;
    const rp = (u - .62) / .7; if (rp > 0 && rp < 1) for (let i = 0; i < 2; i++) { const q = clamp(rp - i * .18); if (q <= 0) continue; g.save(); g.globalAlpha = (1 - q) * .9; g.beginPath(); g.arc(0, 0, 14 + q * 100, 0, TAU); g.lineWidth = 10 * (1 - q) + 2; g.strokeStyle = i ? '#FFC24A' : '#5AD1FF'; g.stroke(); g.restore(); }
    g.save(); g.translate(cx, cy); const sc = dn ? .86 : 1; g.scale(sc * 2.1, sc * 2.1); g.beginPath(); [[0, 0], [0, 54], [13, 42], [23, 64], [33, 60], [23, 39], [40, 39]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#0B1450'; g.stroke(); g.fillStyle = '#fff'; g.fill(); g.restore();
  };
  S.wave = (g, u, o) => {
    const N = 9, cols = ['#FFC24A', '#FF9A3C', '#FF4F9A', '#B24FE0', '#8A5BFF', '#2F6BFF', '#3A9BFF', '#5AD1FF', '#38D9F5'];
    for (let i = 0; i < N; i++) {
      const env = Math.sin((i + .5) / N * Math.PI), h = 34 + env * 120 * (.45 + .55 * Math.abs(Math.sin(u * 7 + i * 1.3) * Math.cos(u * 4.1 + i * .7)));
      g.beginPath(); g.roundRect(-140 + i * 31 + 2, -h / 2, 24, h, 12); g.fillStyle = lg(g, 0, -h / 2, 0, h / 2, [[0, '#fff'], [.25, cols[i]], [1, cols[i]]]); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(11,20,80,.55)'; g.stroke();
    }
  };
  S.sparkles = (g, u, o) => {
    const P = [[-60, -40, 64, 0], [70, -70, 44, .12], [80, 50, 56, .2], [-90, 60, 38, .28], [0, 10, 30, .34], [-10, -110, 26, .1], [8, 100, 26, .24]], cols = ['#fff', '#FFE066', '#5AD1FF', '#FF9AC8', '#fff', '#FFC24A', '#fff'];
    P.forEach(([x, y, r, d], i) => { const p = spr((u - d) * 2.6, 9, 18), tw = 1 + .22 * Math.sin(u * 8 + i * 2); sparkle4(g, x, y, r * p * tw, cols[i], Math.sin(u * 3 + i) * .2); });
  };
  S.speedlines = (g, u, o) => {
    const r0 = lerp(70, 118, eo(u / .3)), n = 44, rot = u * .25; g.save(); g.rotate(rot);
    for (let i = 0; i < n; i++) { const a = i / n * TAU, L = 90 + hash(i + 3) * 120 + (i % 2) * 40, r1 = r0 + L * (.7 + .3 * eo(u / .25)), w = .035 + hash(i) * .03; g.beginPath(); g.moveTo(Math.cos(a - w) * r1, Math.sin(a - w) * r1); g.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a + w) * r1, Math.sin(a + w) * r1); g.closePath(); g.fillStyle = i % 5 === 0 ? '#FFC24A' : '#fff'; g.globalAlpha = .9; g.fill(); }
    g.restore(); g.globalAlpha = 1;
  };
  S.stamp = (g, u, o) => {
    const str = o.text || 'APPROVED', col = o.color || '#E5233B', H = heb(str);
    g.save(); g.rotate(-.05);
    g.beginPath(); g.roundRect(-140, -62, 280, 124, 18); g.fillStyle = 'rgba(255,246,224,.96)'; g.fill();
    g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = 9; g.beginPath(); g.roundRect(-140, -62, 280, 124, 18); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.roundRect(-127, -49, 254, 98, 11); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.direction = H ? 'rtl' : 'ltr'; let px = H ? 76 : 72; g.font = `${H ? 900 : 400} ${px}px ${H ? 'Rubik' : 'Bangers'}`; const m = g.measureText(str).width; if (m > 230) { px *= 230 / m; g.font = `${H ? 900 : 400} ${px}px ${H ? 'Rubik' : 'Bangers'}`; } g.fillText(str, 0, 4);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 70; i++) { g.globalAlpha = .5 + hash(i) * .5; g.beginPath(); g.arc((hash(i * 2 + 1) - .5) * 300, (hash(i * 3 + 2) - .5) * 140, 1 + hash(i + 9) * 3.5, 0, TAU); g.fill(); }
    g.restore();
    const rp = (u - .1) / .4; if (rp > 0 && rp < 1) { g.globalAlpha = (1 - rp) * .7; g.strokeStyle = '#fff'; g.lineWidth = 8 * (1 - rp) + 1; g.beginPath(); g.roundRect(-140 - rp * 40, -62 - rp * 40, 280 + rp * 80, 124 + rp * 80, 18 + rp * 30); g.stroke(); g.globalAlpha = 1; }
  };

  // ----------------------------------------------------------------- animation profiles: u -> {sc, sx, sy, rot, dx, dy, a}
  const bounceOut = ease.outBounce;
  const AN = {
    pop: u => ({ sc: spr(u, 11, 20), rot: Math.exp(-u * 7) * Math.sin(u * 26) * .16 }),
    slam: u => { const p = u < .09 ? 2.8 - 1.8 * ease.in(u / .09) : 1, e = u > .09 ? Math.exp(-(u - .09) * 13) * Math.cos((u - .09) * 34) * .22 : 0; return { sc: p, sx: 1 + e, sy: 1 - e, dx: u > .09 ? (hash(Math.floor(u * 60)) - .5) * 16 * Math.exp(-(u - .09) * 16) : 0, dy: u > .09 ? (hash(Math.floor(u * 60) + 5) - .5) * 12 * Math.exp(-(u - .09) * 16) : 0, a: clamp(u / .04) }; },
    spin: u => ({ sc: spr(u, 10, 18), rot: -(1 - eo(u / .55)) * TAU * .8 }),
    drop: u => ({ sc: 1, dy: -330 * (1 - bounceOut(clamp(u / .6))), a: clamp(u / .05), sy: 1 + (u > .35 && u < .45 ? -.08 : 0) }),
    slide: u => ({ sc: 1, dy: -250 * (1 - eob(u / .5)), a: clamp(u / .08) }),
    elastic: u => ({ sc: ease.outElastic(clamp(u / .8)) }),
    draw: u => ({ sc: 1, a: clamp(u / .05) }),
    stretch: u => { const p = spr(u, 10, 18); return { sc: p, sx: 1 - .22 * (p - 1), sy: 1 + .22 * (p - 1) }; },
    zoom: u => ({ sc: .4 + .6 * spr(u, 8, 14) }),
  };
  const ANIM = { arrow: 'draw', circle: 'draw', underline: 'draw', wow: 'slam', boom: 'slam', pow: 'stretch', zap: 'spin', fire: 'stretch', eyes: 'pop', heart: 'elastic', thumbsup: 'pop', star: 'spin', lol: 'pop', shock: 'stretch', cool: 'drop', mindblown: 'pop', clap: 'pop', check: 'pop', cross: 'slam', hundred: 'slam', notif: 'slide', comment: 'pop', like: 'pop', live: 'slide', cursor: 'zoom', wave: 'stretch', sparkles: 'zoom', speedlines: 'zoom', stamp: 'slam' };
  const EXT = { wow: 235, boom: 235, pow: 235, zap: 235, speedlines: 330, notif: 200, comment: 200, mindblown: 230, underline: 190 };
  const NOFLOAT = { arrow: 1, circle: 1, underline: 1, speedlines: 1, stamp: 1, cursor: 1, notif: 1 };
  const NOOUT = { speedlines: 1 };

  // pooled offscreen canvases
  const pool = [];
  const getCv = (i, n) => { let c = pool[i]; if (!c) c = pool[i] = document.createElement('canvas'); if (c.width !== n || c.height !== n) { c.width = n; c.height = n; } else c.getContext('2d').clearRect(0, 0, n, n); return c; };

  V.stickerNames = Object.keys(S);
  V.sticker = function (ctx, name, x, y, s = 1, o = {}) {
    const def = S[name]; if (!def) return;
    const t = o.t || 0, u = o.t0 == null ? 9 : t - o.t0; if (u < 0) return;
    const an = (AN[ANIM[name]] || AN.pop)(o.t0 == null ? 9 : u); let sc = an.sc ?? 1, alpha = (o.alpha ?? 1) * (an.a ?? 1), rot = (o.rot || 0) + (an.rot || 0), dx = an.dx || 0, dy = an.dy || 0;
    if (o.tOut != null && t > o.tOut) { const w = (t - o.tOut) / .26; if (w >= 1) return; if (!NOOUT[name]) sc *= 1 - ease.inBack(clamp(w)); else alpha *= 1 - w; alpha *= 1 - A.smooth(.6, 1, w); }
    if (sc <= .002 || alpha <= .002) return;
    if (!NOFLOAT[name] && o.t0 != null && u > .5) { dy += Math.sin(t * 2.6 + (o.seed || 0) * 3) * 4; rot += Math.sin(t * 1.7 + (o.seed || 0)) * .015; }
    const ext = EXT[name] || 200, k = clamp(s * Math.min(1.4, sc + .2) * 1, .5, 2.4), n = Math.ceil(ext * 2 * k);
    const ca = getCv(0, n), ga = ca.getContext('2d'); ga.setTransform(k, 0, 0, k, ext * k, ext * k);
    const uu = o.t0 == null ? (o.freeze ?? 3.3 + (o.seed || 0)) : u; def(ga, uu, o); ga.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.translate(x + dx * s, y + dy * s); ctx.rotate(rot); ctx.scale(s * sc * (an.sx || 1), s * sc * (an.sy || 1)); ctx.globalAlpha *= alpha;
    if (o.outline === false || name === 'speedlines') { ctx.shadowColor = 'rgba(0,10,40,.35)'; ctx.shadowBlur = 14 * s; ctx.shadowOffsetY = 8 * s; ctx.drawImage(ca, -ext, -ext, ext * 2, ext * 2); }
    else {
      const cb = getCv(1, n), gb = cb.getContext('2d'); gb.drawImage(ca, 0, 0); gb.globalCompositeOperation = 'source-in'; gb.fillStyle = '#fff'; gb.fillRect(0, 0, n, n); gb.globalCompositeOperation = 'source-over';
      const ow = 9, E = ext * 2;
      ctx.save(); ctx.shadowColor = 'rgba(0,10,50,.55)'; ctx.shadowBlur = 20 * s * Math.max(sc, .3); ctx.shadowOffsetY = 12 * s * sc; ctx.drawImage(cb, -ext + ow * .5, -ext + ow * .5, E, E); ctx.drawImage(cb, -ext - ow * .5, -ext - ow * .5, E, E); ctx.restore();
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.drawImage(cb, -ext + Math.cos(a) * ow, -ext + Math.sin(a) * ow, E, E); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; ctx.drawImage(cb, -ext + Math.cos(a) * ow * .55, -ext + Math.sin(a) * ow * .55, E, E); }
      ctx.drawImage(ca, -ext, -ext, E, E);
    }
    ctx.restore();
  };
})();
