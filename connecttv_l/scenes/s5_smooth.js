// s5_smooth: LIVE + FAST + SMOOTH, then suspense and the held breath before the stamp. Window 20.5 to 25.9
(() => {
  const { clamp, lerp, inv, ease, hash } = A, C = CL.C, W = 1920, H = 1080, TAU = Math.PI * 2;
  const P = (t, t0, d = .3) => CL.pop(t, t0, d);
  const step = (t, fps = 24) => CL.q(t, fps);

  // torn wipe: draws fn() clipped to the revealed region. dir 'l' (edge moves right to left), 'r', 'b' (bottom to top)
  function wipe(ctx, t, t0, t1, dir, fn, strip) {
    const p = inv(t0, t1, t);
    if (p >= 1) return fn();
    if (p <= 0) return;
    const e0 = ease.inOut(Math.floor(p * 8) / 8 + .125 * (p > 0 ? 1 : 0)), span = (dir === 'b' ? H : W) + 120, pts = [];
    const e = dir === 'l' ? W + 60 - span * e0 : dir === 'r' ? -60 + span * e0 : H + 60 - span * e0;
    const n = dir === 'b' ? 40 : 30, len = dir === 'b' ? W : H;
    for (let i = 0; i <= n; i++) { const o = len * i / n, j = (hash(i * 3.3 + 1) - .5) * 44; pts.push(dir === 'b' ? [o, e + j] : [e + j, o]); }
    const far = dir === 'l' ? W + 200 : dir === 'r' ? -200 : H + 200;
    const path = () => { ctx.beginPath(); if (dir === 'b') { ctx.moveTo(-100, far); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(W + 100, far); } else { ctx.moveTo(far, -100); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(far, H + 100); } ctx.closePath(); };
    ctx.save(); path(); ctx.clip(); fn(); ctx.restore();
    ctx.save(); ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.translate(dir === 'b' ? 0 : 8, dir === 'b' ? 10 : 0); ctx.strokeStyle = 'rgba(40,20,0,.3)'; ctx.lineWidth = 26; ctx.stroke(); ctx.translate(dir === 'b' ? 0 : -8, dir === 'b' ? -10 : 0);
    ctx.strokeStyle = C.white; ctx.lineWidth = 26; ctx.stroke(); ctx.strokeStyle = strip || C.red; ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
  }

  // ---------- props
  function airplane(ctx, x, y, rot, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = C.ink;
    const poly = (pts, f) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); ctx.stroke(); };
    ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.moveTo(150 + 10, 12); ctx.lineTo(-120 + 10, -70 + 12); ctx.lineTo(-70 + 10, 12 + 12); ctx.lineTo(-120 + 10, 90 + 12); ctx.closePath(); ctx.fill();
    poly([[150, 0], [-120, -80], [-60, 0]], C.white); poly([[150, 0], [-120, 80], [-60, 0]], '#E4DAC3'); poly([[150, 0], [-60, 0], [-95, 22]], C.blue);
    ctx.restore();
  }
  function rocket(ctx, x, y, rot, sc, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink;
    const poly = (pts, f) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); ctx.stroke(); };
    const fl = 1 + (Math.floor(t * 24) % 2) * .35;
    poly([[-140, 0], [-250 * fl, -40], [-215 * fl, -12], [-330 * fl, 0], [-215 * fl, 12], [-250 * fl, 40]], C.orange);
    poly([[-100, -60], [-190, -130], [-30, -70]], C.yellow); poly([[-100, 60], [-190, 130], [-30, 70]], C.yellow);
    ctx.beginPath(); ctx.roundRect(-150, -68, 260, 136, 60); ctx.fillStyle = C.white; ctx.fill(); ctx.stroke();
    poly([[70, -66], [200, 0], [70, 66]], C.red); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(-20, 0, 34, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function cloud(ctx, x, y, r) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(40,20,0,.25)'; [[0, 0, 1], [.9, .2, .8], [-.9, .25, .75], [.4, -.5, .7]].forEach(c => { ctx.beginPath(); ctx.arc(c[0] * r + 8, c[1] * r + 12, c[2] * r, 0, TAU); ctx.fill(); }); ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    [[0, 0, 1], [.9, .2, .8], [-.9, .25, .75], [.4, -.5, .7]].forEach(c => { ctx.beginPath(); ctx.arc(c[0] * r, c[1] * r, c[2] * r, 0, TAU); ctx.stroke(); }); [[0, 0, 1], [.9, .2, .8], [-.9, .25, .75], [.4, -.5, .7]].forEach(c => { ctx.beginPath(); ctx.arc(c[0] * r, c[1] * r, c[2] * r - 2, 0, TAU); ctx.fill(); }); ctx.restore(); }
  function boat(ctx, x, y, rot, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = C.ink;
    const poly = (pts, f) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); ctx.stroke(); };
    ctx.fillStyle = C.ink; ctx.fillRect(-4, -190, 8, 190);
    poly([[10, -190], [130, -20], [10, -20]], C.white); poly([[-14, -150], [-90, -20], [-14, -20]], C.yellow);
    poly([[-140, -10], [140, -10], [95, 60], [-95, 60]], C.red);
    ctx.restore();
  }
  function chequer(ctx, x0, x1, y, h, off) { const sz = h / 2; ctx.save(); ctx.beginPath(); ctx.rect(x0, y - h / 2, x1 - x0, h); ctx.clip(); ctx.fillStyle = C.white; ctx.fillRect(x0, y - h / 2, x1 - x0, h); ctx.fillStyle = C.ink;
    for (let i = -2; i < (x1 - x0) / sz + 2; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) ctx.fillRect(x0 + i * sz + (off % (sz * 2)), y - h / 2 + j * sz, sz, sz); ctx.restore(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.strokeRect(x0, y - h / 2, x1 - x0, h); }

  // ---------- phase 1: LIVE
  function phase1(ctx, t) {
    CL.paper(ctx, 'kraft', { dots: C.yellow, dotSize: 44, dotFade: 'radial', dotAlpha: .3 });
    let k = P(t, 20.68); if (k) CL.chip(ctx, 'יש לכם גם', 1450, 120, { size: 84, rot: -.05, seed: 3, scale: k });
    k = P(t, 21.08); if (k) CL.chip(ctx, 'שידורים', 1490, 270, { size: 130, rot: .04, seed: 5, fill: C.yellow, scale: k });
    k = P(t, 21.49); if (k) CL.chip(ctx, 'חיים', 1350, 425, { size: 130, rot: -.06, seed: 8, fill: C.white, scale: k });
    // TV with a live match
    k = P(t, 20.85); const jb = CL.j(t, 2, 2);
    if (k) CL.tv(ctx, 800 + jb[0], 470 + jb[1], 900, 600, { rot: -.025, scale: k, chin: 0, draw: (g, w, h) => {
      g.fillStyle = '#2BA85E'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.05)'; g.fillRect(i * w / 6, 0, w / 6, h); }
      g.strokeStyle = C.white; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, h - 92); g.beginPath(); g.moveTo(w / 2, 24); g.lineTo(w / 2, h - 68); g.stroke(); g.beginPath(); g.arc(w / 2, (h - 44) / 2, 70, 0, TAU); g.stroke();
      g.strokeRect(24, h * .3, 110, h * .28); g.strokeRect(w - 134, h * .3, 110, h * .28);
      const q = CL.q(t, 12), bx = w / 2 + Math.sin(q * 3.1) * w * .32, by = (h - 44) / 2 + Math.sin(q * 5.3) * h * .22;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(bx + 8, by + 22, 22, 9, 0, 0, TAU); g.fill(); g.fillStyle = C.white; g.beginPath(); g.arc(bx, by, 24, 0, TAU); g.fill(); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke(); g.fillStyle = C.ink; g.beginPath(); g.arc(bx, by, 9, 0, TAU); g.fill();
      [[.28, .45, C.blue], [.42, .3, C.yellow], [.62, .62, C.yellow], [.74, .38, C.blue]].forEach((pl, i) => { const px = pl[0] * w + Math.sin(q * 2 + i) * 30, py = pl[1] * (h - 60) + Math.cos(q * 2.7 + i) * 18; g.fillStyle = pl[2]; g.beginPath(); g.arc(px, py, 20, 0, TAU); g.fill(); g.lineWidth = 5; g.stroke(); });
      g.fillStyle = C.ink; g.fillRect(0, h - 44, w, 44); g.fillStyle = C.red; g.fillRect(0, h - 44, w * (.15 + .8 * inv(20.9, 22.1, t)), 44);
    } });
    // LIVE tag
    k = P(t, 21.49); if (k) { const blink = Math.floor(t * 2.4) % 2, jj = CL.j(t, 9, 2), r = -.07;
      CL.blob(ctx, 1480 + jj[0], 640 + jj[1], 520, 190, { fill: C.red, rot: r, lw: 10 }); ctx.save(); ctx.translate(1480 + jj[0], 640 + jj[1]); ctx.rotate(r); ctx.scale(k, k);
      ctx.fillStyle = blink ? C.white : C.yellow; ctx.beginPath(); ctx.arc(-170, 0, 34, 0, TAU); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.font = '900 140px Bangers, Rubik'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeText('LIVE', -110, 6); ctx.fillText('LIVE', -110, 6); ctx.restore();
      CL.underline(ctx, 1200, 1740, 780, inv(21.6, 21.85, t), { color: C.ink, seed: 4, lw: 12 }); }
    // paper airplane flying through
    const ap = inv(21.72, 22.16, t);
    if (ap > 0 && ap < 1) { const q = Math.floor(ap * 9) / 9, x = lerp(-200, 2100, q * q * .4 + q * .6), y = lerp(1000, 60, q) + Math.sin(q * 5) * 90;
      ctx.save(); ctx.setLineDash([26, 26]); ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 9; i++) { const u = Math.min(i / 9, q); const xx = lerp(-200, 2100, u * u * .4 + u * .6), yy = lerp(1000, 60, u) + Math.sin(u * 5) * 90; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore();
      airplane(ctx, x, y, -.9 + Math.cos(q * 5) * .25, 1.5); }
  }

  // ---------- phase 2: FAST
  function phase2(ctx, t) {
    CL.paper(ctx, 'yellow', { dots: C.blue, dotSize: 38, dotFade: 'b', dotAlpha: .22 });
    let k = P(t, 22.22); if (k) CL.chip(ctx, 'חוויית צפייה', 1450, 190, { size: 110, rot: .03, seed: 11, scale: k });
    // speedometer
    const cx = 800, cy = 450, R = 320; k = P(t, 22.3);
    if (k) { const jj = CL.j(t, 3, 2), sh = CL.shake(t, 22.72, .6, 12);
      ctx.save(); ctx.translate(cx + jj[0] + sh[0], cy + jj[1] + sh[1]); ctx.scale(k, k); ctx.rotate(-.03);
      ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.arc(14, 20, R + 20, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, 0, R + 24, 0, TAU); ctx.fill(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, R + 4, 0, TAU); ctx.fill(); ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(0, 0, R - 18, 0, TAU); ctx.fill();
      const a0 = Math.PI * .8, a1 = Math.PI * 2.2, cols = [C.green, C.yellow, C.orange, C.red];
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, R - 70, lerp(a0, a1, i / 4) + .01, lerp(a0, a1, (i + 1) / 4) - .01); ctx.lineWidth = 60; ctx.lineCap = 'butt'; ctx.strokeStyle = cols[i]; ctx.stroke(); }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (let i = 0; i <= 14; i++) { const a = lerp(a0, a1, i / 14), r0 = R - 118, r1 = R - (i % 2 ? 140 : 160); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
      ctx.font = '900 64px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink; ctx.direction = 'ltr'; ctx.fillText('0', Math.cos(a0) * (R - 200), Math.sin(a0) * (R - 200)); ctx.fillText('MAX', 0, 130);
      // needle: idle shiver, then whips to max on 'מהירה'
      const tq = step(t, 24), w = inv(22.72, 22.9, tq); let v = tq < 22.72 ? .04 + .02 * Math.sin(tq * 40) * inv(22.3, 22.7, tq) + .1 * inv(22.4, 22.72, tq) : lerp(.14, 1.0, ease.outBack(w) > 1 ? 1 + (ease.outBack(w) - 1) * .5 : ease.outBack(w));
      if (tq > 22.95) v = 1 + Math.sin(tq * 90) * .012; const an = lerp(a0, a1, clamp(v, 0, 1.04));
      ctx.save(); ctx.rotate(an); ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.moveTo(-40, -18 + 12); ctx.lineTo(R - 60, 12); ctx.lineTo(-40, 18 + 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(-40, -20); ctx.lineTo(R - 50, 0); ctx.lineTo(-40, 20); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
      ctx.restore();
      if (t > 22.72 && t < 23.2) CL.sparks(ctx, cx + Math.cos(lerp(a0, a1, 1)) * 250, cy + Math.sin(a1) * 250, 60, 150, 9, t, { color: C.ink, lw: 10 });
    }
    // checkered ribbon
    k = P(t, 22.4); if (k) { ctx.save(); ctx.translate(960, 850); ctx.rotate(-.02); ctx.scale(k, 1); ctx.translate(-960, -850); chequer(ctx, -30, 1950, 850, 80, Math.floor(t * 12) * 18); ctx.restore(); }
    // MEHIRA
    k = P(t, 22.72); if (k) CL.title(ctx, 'מהירה', 1400, 520, { size: 250, fill: C.red, rot: -.05, scale: k });
    // rocket zoom
    const rp = inv(22.66, 23.06, t);
    if (rp > 0 && rp < 1) { const q = Math.floor(rp * 10) / 10, x = lerp(-380, 2400, q), y = lerp(330, 200, q);
      for (let i = 1; i < 6; i++) { const u = q - i * .09; if (u > 0) cloud(ctx, lerp(-380, 2400, u), lerp(330, 200, u) + Math.sin(i * 2) * 20, 46 - i * 3); }
      rocket(ctx, x, y, -.04, 1.4, t); }
  }

  // ---------- phase 3: SMOOTH (continuous motion on purpose, no boil)
  const wave = (x, t, i) => Math.sin(x * .006 + t * (1.1 + i * .25) + i * 1.7) * (34 - i * 4) + Math.sin(x * .0023 - t * .7 + i) * 26;
  function phase3(ctx, t) {
    CL.paper(ctx, 'cream', { dots: C.blue, dotSize: 40, dotFade: 't', dotAlpha: .16 });
    let k = P(t, 23.14); if (k) CL.title(ctx, 'חלקה', 1400, 290, { size: 270, fill: C.blue, rot: .04, scale: k, outer: C.white });
    const u = inv(23.3, 23.6, t); if (u > 0) CL.underline(ctx, 1130, 1670, 450, u, { color: C.red, seed: 6, lw: 14 });
    // silky ribbon
    const ru = ease.out(inv(23.14, 23.6, t));
    if (ru > 0) { ctx.save(); ctx.lineCap = 'round'; const n = 60; for (const pass of [[0, C.ink, 62, 12], [0, C.yellow, 44, 0], [-8, '#FFF08A', 14, 0]]) { ctx.beginPath(); for (let i = 0; i <= n * ru; i++) { const x = -40 + i / n * 2000; const y = 110 + Math.sin(x * .005 + t * 2) * 40 + Math.sin(x * .002 - t) * 30 + pass[0]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = pass[1]; ctx.lineWidth = pass[2]; ctx.stroke(); } ctx.restore(); }
    // river bands
    const rk = ease.out(inv(23.16, 23.5, t)), cols = ['#5D86FF', '#3A63F0', C.blue, '#1636C8', '#0F2A9C'];
    for (let i = 0; i < 5; i++) { const y0 = lerp(H, 560 + i * 90, rk); ctx.save(); ctx.fillStyle = 'rgba(0,20,80,.25)'; ctx.beginPath(); ctx.moveTo(-10, H); for (let x = -10; x <= W + 10; x += 20) ctx.lineTo(x, y0 + wave(x, t, i) + 12); ctx.lineTo(W + 10, H); ctx.fill();
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(-10, H); for (let x = -10; x <= W + 10; x += 20) ctx.lineTo(x, y0 + wave(x, t, i)); ctx.lineTo(W + 10, H); ctx.fill();
      ctx.strokeStyle = i === 0 ? C.ink : 'rgba(255,255,255,.55)'; ctx.lineWidth = i === 0 ? 8 : 5; ctx.beginPath(); for (let x = -10; x <= W + 10; x += 20) x < -5 ? ctx.moveTo(x, y0 + wave(x, t, i)) : ctx.lineTo(x, y0 + wave(x, t, i)); ctx.stroke(); ctx.restore(); }
    // boat gliding
    const bx = lerp(-160, 2080, inv(23.2, 24.1, t)), by = 560 + wave(bx, t, 0) - 6, sl = (wave(bx + 10, t, 0) - wave(bx - 10, t, 0)) / 20;
    if (rk > .8) boat(ctx, bx, by, Math.atan(sl) * .9, 1.2);
    // progress bar with play head that never stops
    k = P(t, 23.3, .35); if (k) { const y = 810, x0 = 560, x1 = 1760, ph = inv(23.3, 24.0, t); ctx.save(); ctx.translate(1160, y); ctx.scale(k, k); ctx.translate(-1160, -y);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(x0 + 8, y - 24 + 12, x1 - x0, 48, 24); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(x0, y - 24, x1 - x0, 48, 24); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
      const px = lerp(x0 + 20, x1 - 20, ph); ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(x0 + 6, y - 18, px - x0, 36, 18); ctx.fill();
      ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(px, y, 46, 0, TAU); ctx.fill(); ctx.lineWidth = 8; ctx.stroke(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(px - 12, y - 20); ctx.lineTo(px + 22, y); ctx.lineTo(px - 12, y + 20); ctx.fill(); ctx.restore(); }
  }

  // ---------- phase 4: suspense
  function inkBg(ctx, t) {
    CL.paper(ctx, 'ink');
    // spotlight made of halftone dots (no gradient)
    const g = ease.out(inv(24.01, 25.1, t)); CL.halftone(ctx, 530, 40, 1200, 800, C.yellow, 36, .5, { alpha: .22 * (0.4 + g * .6), fade: 'radial' });
  }
  function question(ctx, t) {
    // '?' grows, drumroll shake
    const g = inv(24.01, 25.2, t), q = Math.floor(g * 14) / 14, size = lerp(100, 800, ease.in(q) * .55 + q * .45), tq = step(t, 24), amp = lerp(1, 16, g * g);
    if (t < 24.01 || t >= 25.2) return;
    // marker circles building tension (on 'הדבר' 'שאנחנו' 'הכי' 'גאים')
    const rings = [[24.01, 200], [24.27, 250], [24.56, 300], [24.82, 350]];
    rings.forEach(([t0, r], i) => { const p = inv(t0, t0 + .16, t); if (p > 0) { const jj = CL.j(t, 20 + i, 4); CL.circle(ctx, 1130 + jj[0], 430 + jj[1], r * 1.0, r * 1.12, p, { color: i % 2 ? C.yellow : C.red, lw: 14, seed: 3 + i }); } });
    // small ? scraps popping on beats
    [[24.28, 640, 170, -.3], [24.57, 1630, 700, .35], [24.82, 640, 700, .25], [25.06, 1650, 190, -.25]].forEach(([t0, x, y, r], i) => { const k = P(t, t0, .25); if (k) CL.chip(ctx, '?', x, y, { size: 120, rot: r, seed: 30 + i, fill: i % 2 ? C.yellow : C.white, dir: 'ltr', scale: k * (1 + .04 * Math.sin(tq * 20 + i)) }); });
    ctx.save(); ctx.translate(1130 + Math.sin(tq * 91) * amp, 430 + Math.cos(tq * 77) * amp); CL.title(ctx, '?', 0, 0, { size, fill: C.yellow, rot: Math.sin(tq * 13) * .04, dir: 'ltr', font: `900 ${size}px Bangers, Rubik` }); ctx.restore();
    if (g > .5) CL.sparks(ctx, 1130, 430, size * .36, size * .5, 12, t, { color: C.white, lw: 9 });
  }
  // curtain panels. gap = half opening (0 = closed). pulses drive the drumroll
  function curtains(ctx, t) {
    let gap;
    if (t < 23.6) return;
    if (t < 23.97) gap = lerp(980, 0, ease.in(Math.floor(inv(23.6, 23.97, t) * 7) / 7));
    else if (t < 24.01) gap = 0;
    else if (t < 25.2) { const g = inv(24.01, 25.2, t), tq = step(t, 24); gap = lerp(260, 520, g) + Math.sin(TAU * (1.6 * (tq - 24.01) + 2.2 * (tq - 24.01) * (tq - 24.01))) * lerp(20, 70, g); if (t < 24.14) gap = lerp(0, 260, ease.out(inv(24.01, 24.14, t))); }
    else gap = lerp(520, 800, ease.out(clamp((t - 25.2) / .12)));
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(1130, 0); ctx.scale(sd, 1);   // draw the right panel, mirrored for the left
      const x0 = gap, x1 = 1000; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0 - 16, 0, x1 - x0 + 16, H);
      ctx.fillStyle = C.red; ctx.fillRect(x0, 0, x1 - x0, H);
      const fw = 64; for (let x = x0; x < x1; x += fw) { const i = Math.round((x - x0) / fw); ctx.fillStyle = i % 2 ? '#D42418' : '#FF5346'; ctx.fillRect(x, 0, Math.min(fw, x1 - x), H); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + fw - 8, 0, 8, H); }
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(x0, 0); for (let y = 0; y <= H + 60; y += 60) ctx.lineTo(x0 - 8 + (y / 60 % 2 ? 22 : 0) + Math.sin(y * .02) * 6, y); ctx.lineTo(x0 + 14, H + 60); ctx.lineTo(x0 + 14, 0); ctx.closePath(); ctx.globalAlpha = 0; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke();
      ctx.fillStyle = C.yellow; for (let y = 90; y < H; y += 200) { ctx.beginPath(); ctx.arc(x0 + 34, y, 16, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, 26);
  }

  // ---------- phase 5: the held breath, a raised blank stamp
  function heldStamp(ctx, t) {
    const up = ease.out(inv(25.2, 25.32, t)), by = lerp(800, 0, up), tq = step(t, 12), jj = CL.j(t, 77, 1.2);
    // target paper with dashed mark
    CL.scrap(ctx, 1130, 740 + by * .1, 800, 250, { fill: C.cream, seed: 21, rot: -.03 });
    ctx.save(); ctx.translate(1130, 740 + by * .1); ctx.rotate(-.03); ctx.setLineDash([26, 18]); ctx.lineWidth = 8; ctx.strokeStyle = C.red; ctx.lineCap = 'round'; ctx.strokeRect(-260, -80, 520, 160); ctx.setLineDash([]);
    ctx.lineWidth = 8; ctx.strokeStyle = C.ink; [[-300, -105, 1, 1], [300, -105, -1, 1], [-300, 105, 1, -1], [300, 105, -1, -1]].forEach(([x, y, a, b]) => { ctx.beginPath(); ctx.moveTo(x, y + b * 50); ctx.lineTo(x, y); ctx.lineTo(x + a * 50, y); ctx.stroke(); }); ctx.restore();
    // stamp, raised in the air with hard shadow on the paper
    const sx = 1130 + jj[0], sy = 400 + jj[1] + by, hover = 0;
    ctx.fillStyle = 'rgba(40,20,0,.32)'; ctx.beginPath(); ctx.roundRect(1130 - 250 + 40, 740 - 50 + by * .1, 500, 110, 26); ctx.fill();
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.045); ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = C.ink;
    ctx.fillStyle = 'rgba(40,20,0,.35)'; ctx.beginPath(); ctx.roundRect(-270 + 22, 185 + 30, 540, 96, 22); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-270, 170, 540, 96, 22); ctx.fill(); ctx.stroke();   // rubber face
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-270, 100, 540, 92, 20); ctx.fill(); ctx.stroke();   // plate
    ctx.fillStyle = '#C98B4A'; ctx.beginPath(); ctx.roundRect(-70, -60, 140, 170, 18); ctx.fill(); ctx.stroke();  // neck
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-64, -54, 40, 158);
    ctx.fillStyle = '#E2A560'; ctx.beginPath(); ctx.arc(0, -150, 130, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(-40, -190, 40, 0, TAU); ctx.fill();
    ctx.restore();
    // small tension ticks near the stamp: tiny, silent
    if (up >= 1) { ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.globalAlpha = .9; [[-1, 1], [1, 1]].forEach(([d]) => { for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(1130 + d * (330 + i * 34), 330 + i * 60 + jj[1]); ctx.lineTo(1130 + d * (370 + i * 34), 300 + i * 60 + jj[1]); ctx.stroke(); } }); ctx.restore(); }
  }

  A.scene({ name: 's5_smooth', start: 20.5, end: 25.9, draw(ctx, s) {
    const t = s.t;
    const body = () => {
      phase1(ctx, t);
      if (t >= 22.05) wipe(ctx, t, 22.05, 22.22, 'b', () => phase2(ctx, t), C.blue);
      if (t >= 23.02) wipe(ctx, t, 23.02, 23.18, 'r', () => phase3(ctx, t), C.yellow);
      if (t >= 23.97) { inkBg(ctx, t); question(ctx, t); if (t >= 25.2) heldStamp(ctx, t); }
      curtains(ctx, t);
    };
    if (t < 20.76) wipe(ctx, t, 20.5, 20.74, 'l', body, C.yellow); else body();
  } });
})();
