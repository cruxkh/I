// s6 NO FREEZING. PERIOD.  25.4 to 30.5  (climax)
(() => {
  const { clamp, lerp, inv, ease, hash, rng, TAU } = A, C = CL.C, W = CL.W, H = CL.H, CX = W / 2, CY = H / 2;
  const SK = ['#FF3B30', '#FFD60A', '#1F4FFF', '#2BC48A', '#FF7AB8', '#FF8A1F', '#FFFDF6'];

  // ---------- helpers
  // region beyond an edge with torn jagged border. side: 'top' (y<pos), 'bottom' (y>pos), 'right' (x>pos)
  function region(ctx, side, pos, seed) {
    const r = rng(seed * 17 + 5), pts = [], n = 44, vert = side === 'right' || side === 'left';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) pts.push(vert ? [pos + (r() - .5) * 36, -20 + (H + 40) * i / n] : [-20 + (W + 40) * i / n, pos + (r() - .5) * 36]);
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (side === 'right') { ctx.lineTo(W + 60, H + 20); ctx.lineTo(W + 60, -20); } else if (side === 'left') { ctx.lineTo(-60, H + 20); ctx.lineTo(-60, -20); }
    else if (side === 'top') { ctx.lineTo(W + 20, -60); ctx.lineTo(-20, -60); } else { ctx.lineTo(W + 20, H + 60); ctx.lineTo(-20, H + 60); }
    ctx.closePath();
  }
  function wipe(ctx, side, pos, seed, fn) {
    const at = (d) => pos + (side === 'top' || side === 'left' ? d : -d);
    ctx.save();
    ctx.fillStyle = 'rgba(40,20,0,.28)'; region(ctx, side, at(30), seed + 1); ctx.fill();
    ctx.fillStyle = C.white; region(ctx, side, at(16), seed + 2); ctx.fill();
    region(ctx, side, pos, seed); ctx.clip(); fn(); ctx.restore();
  }
  function bits(ctx, t, t0, cx, cy, n, seed, o = {}) {
    const u = t - t0, dur = o.dur || 1.1; if (u < 0 || u > dur) return; const q = Math.floor(u * 24) / 24;
    for (let i = 0; i < n; i++) {
      const a = (o.a0 ?? 0) + hash(seed + i) * (o.spread ?? TAU), sp = (o.sp || 700) * (.45 + hash(seed + i * 3) * .8), sz = 26 + hash(seed + i * 5) * 46;
      const x = cx + Math.cos(a) * sp * q * (1 - q * .35), y = cy + Math.sin(a) * sp * q * (1 - q * .35) + (o.g ?? 1100) * q * q, rot = hash(seed + i * 7) * 6.28 + q * (hash(seed + i * 9) - .5) * 14;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = clamp((dur - u) / .25);
      ctx.fillStyle = C.white; CL.tornPath(ctx, -sz / 2 - 5, -sz * .35 - 5, sz + 10, sz * .7 + 10, { seed: i + 1, rough: 4 }); ctx.fill();
      ctx.fillStyle = o.cols ? o.cols[i % o.cols.length] : SK[i % SK.length]; CL.tornPath(ctx, -sz / 2, -sz * .35, sz, sz * .7, { seed: i + 3, rough: 4 }); ctx.fill(); ctx.restore();
    }
  }
  // ---------- stamp
  function stampLayer(txt, size, maxW, col, seed) {
    const m = document.createElement('canvas').getContext('2d'); m.font = '900 100px Rubik'; m.direction = 'rtl'; const r100 = m.measureText(txt).width / 100;
    size = Math.min(size, maxW / (r100 + .75)); const tw = r100 * size, w = tw + size * .75, h = size * 1.5, LW = Math.ceil(w + 40), LH = Math.ceil(h + 40);
    const cv = CL.layer('s6stamp:' + txt + size, LW, LH, (g) => {
      g.translate(LW / 2, LH / 2); g.strokeStyle = col; g.fillStyle = col; g.lineJoin = 'round';
      g.lineWidth = size * .07; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 22); g.stroke();
      g.lineWidth = size * .025; g.beginPath(); g.roundRect(-w / 2 + size * .11, -h / 2 + size * .11, w - size * .22, h - size * .22, 12); g.stroke();
      g.font = `900 ${size}px Rubik`; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, size * .06);
      g.globalCompositeOperation = 'destination-out'; const rr = rng(seed);
      for (let i = 0; i < 900; i++) { g.globalAlpha = .55 + rr() * .45; g.beginPath(); g.arc((rr() - .5) * LW, (rr() - .5) * LH, .8 + rr() * rr() * 5.5, 0, TAU); g.fill(); }
      g.globalAlpha = 1; g.lineWidth = 3; g.strokeStyle = '#000'; for (let i = 0; i < 14; i++) { const x = (rr() - .5) * LW, y = (rr() - .5) * LH, a = rr() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 60, y + Math.sin(a) * 18); g.stroke(); }
    });
    return { cv, w, h, LW, LH };
  }
  function block(ctx, w, h, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = C.kraftDk; ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(-w * .2, -h / 2 - 120, w * .4, 140, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.kraft; ctx.beginPath(); ctx.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-w / 2 + 10, h / 2 - 34, w - 20, 16); ctx.restore();
  }
  function slam(ctx, t, t0, cx, cy, S, rot, o = {}) {
    const k = o.k || 1, lead = .1;
    if (t < t0 - lead) return;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    if (t < t0) { const p = (t - (t0 - lead)) / lead, sc = lerp(2.5, 1.06, p * p) * k; ctx.save(); ctx.translate(0, -30 * (1 - p)); ctx.scale(sc, sc); ctx.fillStyle = 'rgba(40,20,0,' + (.35 - .25 * p) + ')'; ctx.fillRect(-S.w / 2 + 80 * (1 - p), -S.h / 2 + 120 * (1 - p) + 10, S.w, S.h); block(ctx, S.w, S.h); ctx.restore(); ctx.restore(); return; }
    const u = t - t0, sc = (u < .04 ? 1.09 : u < .09 ? .97 : 1) * k;
    ctx.save(); ctx.scale(sc, sc); ctx.drawImage(S.cv, -S.LW / 2, -S.LH / 2); ctx.restore();
    if (u < .3) { const p = clamp((u - .05) / .25); ctx.save(); ctx.translate(0, -p * 260); const s2 = (1.06 + p * 1.4) * k; ctx.scale(s2, s2); block(ctx, S.w, S.h, 1 - p); ctx.restore(); }
    ctx.restore();
  }
  // ---------- period dot
  function dot(ctx, t, t0, cx, cy, R) {
    if (t < t0 - .1) return; const u = t - t0, lead = .1; let sc = 1, oy = 0;
    if (u < 0) { const p = (u + lead) / lead; sc = lerp(3.2, 1.05, p * p); oy = -60 * (1 - p); } else sc = u < .04 ? 1.14 : u < .09 ? .95 : 1;
    ctx.save(); ctx.translate(cx, cy + oy); ctx.scale(sc, sc);
    const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; pts.push([Math.cos(a) * R * (1 + (hash(i * 1.7 + 3) - .5) * .09), Math.sin(a) * R * (1 + (hash(i * 2.3 + 8) - .5) * .09)]); }
    const path = (dx, dy) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + dx, p[1] + dy) : ctx.moveTo(p[0] + dx, p[1] + dy)); ctx.closePath(); };
    ctx.fillStyle = 'rgba(40,20,0,.35)'; path(26, 34); ctx.fill();
    ctx.fillStyle = C.white; ctx.lineJoin = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = C.white; path(0, 0); ctx.stroke();
    ctx.fillStyle = C.ink; path(0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, R * (.35 + i * .13), -2.6 + i * .3, -1.8 + i * .3); ctx.stroke(); }
    ctx.restore();
    if (u >= 0 && u < .5) CL.sparks(ctx, cx, cy, R * 1.25, R * 1.25 + 130 * Math.min(1, u * 5), 16, t, { color: C.ink, lw: 12 });
  }

  // ---------- TV 1 (buffering)
  const tvc = document.createElement('canvas'); tvc.width = 1100; tvc.height = 820;
  const TVC = [550, 410];
  function antenna(g, w, h, col = C.ink, len = 120) { g.save(); g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.fillStyle = col; [[-1, -.12], [1, .12]].forEach(([s]) => { g.beginPath(); g.moveTo(s * 20, -h / 2 + 6); g.lineTo(s * 130, -h / 2 - len); g.stroke(); g.beginPath(); g.arc(s * 130, -h / 2 - len - 4, 12, 0, TAU); g.fill(); }); g.restore(); }
  function wheel(g, cx, cy, R, ang) {
    for (let i = 0; i < 10; i++) {
      const a = ang + i / 10 * TAU, lead = (10 - i) / 10; g.save(); g.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.rotate(a);
      g.fillStyle = i === 0 ? C.yellow : `rgba(255,253,246,${.25 + .7 * lead * lead})`; g.beginPath(); g.roundRect(-30, -17, 60, 34, 14); g.fill(); g.lineWidth = 4; g.strokeStyle = C.ink; if (i === 0) g.stroke(); g.restore();
    }
  }
  function drawTV1(t, p) {
    const g = tvc.getContext('2d'); tvc.width = 1100; g.translate(TVC[0], TVC[1]);
    const w = 860, h = 620; antenna(g, w, h);
    CL.tv(g, 0, 0, w, h, { body: C.cream, draw: (c, sw, sh) => {
      c.fillStyle = '#0d1230'; c.fillRect(0, 0, sw, sh); CL.halftone(c, 0, 0, sw, sh, '#1F4FFF', 26, .5, { alpha: .25, fade: 'radial' });
      const ang = t < 27.41 ? (.9 - Math.floor((27.41 - t) * 24) / 24 * 30 * (.4 + (27.41 - t) * 3)) : .9;   // spins, decelerates, then FREEZES on "להיתקע"
      wheel(c, sw / 2, sh / 2 - 30, 118, ang);
      c.font = '900 64px Rubik'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillStyle = C.cream; c.fillText('99%', sw / 2, sh - 100);
    } });
    // X
    const xp = inv(27.5, 27.72, t); if (xp > 0) { CL.cross(g, 0, -10, 240, xp, { color: C.red, lw: 46 }); }
  }
  function tornLine(y0, y1, x0, x1, seed) { const r = rng(seed), pts = [], n = 16; for (let i = 0; i <= n; i++) { const k = i / n; pts.push([lerp(x0, x1, k) + (i % 2 ? 22 : -22) * (.5 + r()), lerp(y0, y1, k)]); } return pts; }
  function tv1(ctx, t) {
    const p = CL.pop(t, 27.19, .3); if (p <= 0 && t < 27.19) return; const j = CL.j(t, 5, 2.5), cx = CX + j[0], cy = 450 + j[1], rot = -.035 + j[2];
    drawTV1(t, p); const ts = 27.8;
    if (t < ts) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(p * 1.15, p * 1.15); ctx.drawImage(tvc, -TVC[0], -TVC[1]); ctx.restore(); return; }
    const u = t - ts, line = tornLine(-30, 820, 640, 470, 4);
    [-1, 1].forEach(sd => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      const fall = u * u * 2600, sh = u * 260 * sd; ctx.translate((sh + sd * 6) * 1.6, fall); ctx.rotate(sd * (u * 1.8) * (1 + u));
      ctx.translate(-TVC[0], -TVC[1]);
      ctx.beginPath(); line.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      if (sd < 0) { ctx.lineTo(-100, 820); ctx.lineTo(-100, -30); } else { ctx.lineTo(1300, 820); ctx.lineTo(1300, -30); } ctx.closePath();
      ctx.save(); ctx.clip(); ctx.drawImage(tvc, 0, 0);
      ctx.beginPath(); line.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = C.white; ctx.lineWidth = 34; ctx.lineJoin = 'miter'; ctx.stroke(); ctx.restore(); ctx.restore();
    });
  }

  // ---------- football TV
  const FX = CX, FY = 430, FW = 1300, FH = 700;
  function player(g, x, y, col, ph, face = 1, big = 1) {
    g.save(); g.translate(x, y); g.scale(big * face, big);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(4, 22, 28, 12, 0, 0, TAU); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.ellipse(-8, 18 + Math.sin(ph) * 9, 9, 6, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-8, 18 - Math.sin(ph) * 9 + 6, 9, 6, 0, 0, TAU); g.fill();
    g.lineJoin = 'round'; g.beginPath(); g.ellipse(0, 0, 22, 27, 0, 0, TAU); g.lineWidth = 12; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
    g.beginPath(); g.arc(4, -22, 15, 0, TAU); g.lineWidth = 10; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#F2B48C'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.ink; g.stroke();
    g.restore();
  }
  function ballAt(g, x, y, r, spin) {
    g.save(); g.translate(x, y); g.rotate(spin); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.lineWidth = 10; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.ink; g.stroke();
    g.fillStyle = C.ink; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.lineTo(Math.cos(a) * r * .45, Math.sin(a) * r * .45); } g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .3; g.beginPath(); g.arc(Math.cos(a) * r * .82, Math.sin(a) * r * .82, r * .16, 0, TAU); g.fill(); }
    g.restore();
  }
  function pitch(c, sw, sh, t) {
    for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#1d9159' : '#22a366'; c.fillRect(i * sw / 10, 0, sw / 10 + 1, sh); }
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 6; c.strokeRect(34, 34, sw - 68, sh - 68 - 30); c.beginPath(); c.moveTo(sw / 2, 34); c.lineTo(sw / 2, sh - 64); c.stroke(); c.beginPath(); c.arc(sw / 2, (sh - 30) / 2, 80, 0, TAU); c.stroke();
    c.strokeRect(sw - 190, 130, 156, 290); c.strokeRect(34, 130, 156, 290);
    // goal + net
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(sw - 92, 232, 58, 136); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(sw - 92, 232 + i * 17); c.lineTo(sw - 34, 232 + i * 17); c.stroke(); } for (let i = 0; i <= 3; i++) { c.beginPath(); c.moveTo(sw - 92 + i * 19, 232); c.lineTo(sw - 92 + i * 19, 368); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 12; c.strokeRect(sw - 92, 232, 58, 136);
  }
  function game(c, sw, sh, t) {
    pitch(c, sw, sh, t);
    const K = sw / 900, sp = clamp((t - 28.1) / .75), sx = lerp(130, 540, sp * (2 - sp) * .5 + sp * .5) * K, sy = 300 + 40 * Math.sin((t - 28.1) * 4) * (1 - sp * .3), kick = 28.85, land = 29.25, run = t * 11;
    // defenders + mates
    player(c, K * (400 + 110 * Math.sin(t * 1.9)), 190 + 45 * Math.sin(t * 2.6), C.blue, run, -1, 1.15); player(c, K * (470 + 90 * Math.sin(t * 1.4 + 1)), 430 + 30 * Math.sin(t * 2.1), C.blue, run + 1, -1, 1.15);
    player(c, K * (250 + 60 * Math.sin(t * 1.7)), 440 + 35 * Math.sin(t * 2.2), C.yellow, run + 2, 1, 1.15); player(c, K * (620 + 80 * Math.sin(t * 1.2)), 130 + 30 * Math.sin(t * 2.0), C.yellow, run + 3, 1, 1.15);
    // goalkeeper dives at the last moment
    const dv = ease.out(clamp((t - 29.0) / .28)); player(c, sw - 96, 300 + 26 * Math.sin(t * 3.1) - dv * 100, C.orange, run * .5, -1, 1.2 + dv * .1);
    const sxp = t < kick ? sx : sx + Math.min(60, (t - kick) * 120) * K;
    player(c, sxp, sy, C.yellow, run + 5, 1, 1.35);
    let bx, by, br = 25, hgt = 0;
    if (t < kick) { bx = sx + 44 + 10 * Math.sin(t * 15); by = sy + 16; }
    else if (t < land) { const u = (t - kick) / (land - kick), x0 = sx + 44 + 10 * Math.sin(kick * 15), y0 = sy + 16; bx = lerp(x0, sw - 62, u); by = lerp(y0, 352, u); hgt = Math.sin(u * Math.PI) * 70; }
    else { const k = t - land; bx = sw - 62 + 12 * (1 - Math.exp(-k * 5)); by = 352 + 14 * (1 - Math.exp(-k * 4)) + Math.sin(k * 9) * 3; }
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(bx + 6, by + 14, br * (1 - hgt / 300), br * .45, 0, 0, TAU); c.fill();
    ballAt(c, bx, by - hgt, br + hgt * .12, t * 9);
    // HUD
    c.save(); c.translate(150, 62); c.fillStyle = C.ink; c.beginPath(); c.roundRect(-118, -34, 236, 68, 14); c.fill(); c.font = '900 40px Rubik'; c.direction = 'ltr'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.yellow; c.fillText('MTA ' + (t >= land ? 1 : 0) + ' : 0', 0, 3); c.restore();
    const blink = Math.floor(t * 2) % 2 ? .55 : 1; c.fillStyle = C.red; c.beginPath(); c.roundRect(sw - 170, 30, 140, 56, 12); c.fill(); c.fillStyle = '#fff'; c.font = '900 34px Rubik'; c.textAlign = 'center'; c.fillText('LIVE', sw - 86, 60); c.fillStyle = `rgba(255,255,255,${blink})`; c.beginPath(); c.arc(sw - 146, 58, 8, 0, TAU); c.fill();
    // ticker never stops
    c.fillStyle = C.ink; c.fillRect(0, sh - 58, sw, 58); c.font = '800 30px Rubik'; c.textAlign = 'left'; c.fillStyle = C.yellow; const tx = -(t * 260) % 620; for (let i = 0; i < 3; i++) c.fillText('GOTV LIVE  *  NO FREEZE  *  GOTV LIVE  *', tx + i * 620, sh - 28);
  }
  function football(ctx, t) {
    const p = CL.pop(t, 28.08, .3); if (p <= 0) return; const j = CL.j(t, 9, 2), rot = .025 + j[2];
    const lift = ease.inOut(inv(29.55, 29.85, t));
    ctx.save(); ctx.translate(lerp(FX, 560, lift) + j[0], lerp(FY, 400, lift) + j[1]); ctx.rotate(rot * (1 - lift)); const sc = p * lerp(.96, .58, lift); ctx.scale(sc, sc);
    antenna(ctx, FW, FH, C.ink, 60);
    CL.tv(ctx, 0, 0, FW, FH, { body: C.yellow, draw: (c, sw, sh) => game(c, sw, sh, t) });
    ctx.restore();
  }
  function crowd(ctx, t) {
    const t0 = 29.25; if (t < t0) return; const sink = ease.in(inv(29.55, 29.75, t)) * 320;
    for (let i = 0; i < 16; i++) {
      const tt = t - t0 - i * .015; if (tt < 0) continue; const x = 60 + i * 120 + (i % 2) * 8, q = CL.q(t, 12), jump = Math.abs(Math.sin(q * 9 + i * 1.7)) * 50, rise = (1 - ease.out(clamp(tt / .16))) * 260;
      const y = 815 - jump + rise + sink, col = SK[(i * 2) % 6], arm = Math.sin(q * 11 + i) * .4;
      ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i + 3) - .5) * .2 + arm * .1);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 16; ctx.lineCap = 'round'; [[-1, 1], [1, -1]].forEach(([s]) => { ctx.beginPath(); ctx.moveTo(s * 34, 6); ctx.lineTo(s * (56 + arm * 30), -96 - arm * 20); ctx.stroke(); ctx.fillStyle = '#F2B48C'; ctx.beginPath(); ctx.arc(s * (56 + arm * 30), -104 - arm * 20, 15, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 16; });
      CL.scrap(ctx, 0, 40, 104, 120, { fill: col, seed: i + 1, shadow: 8, rough: 4 });
      ctx.beginPath(); ctx.arc(0, -34, 36, 0, TAU); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#F2B48C'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-12, -38, 4.5, 0, TAU); ctx.arc(12, -38, 4.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -20, 12, 9 + Math.abs(arm) * 8, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  // ---------- finger + button
  function fingerShapes(g) {
    g.beginPath(); g.roundRect(-60, 0, 120, 430, 60);
    g.roundRect(-150, 330, 300, 300, 80); g.roundRect(120, 380, 90, 170, 45);
  }
  function finger(ctx, x, y, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.save(); ctx.translate(26, 36); fingerShapes(ctx); ctx.fill(); ctx.restore();
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 34; fingerShapes(ctx); ctx.stroke(); ctx.fillStyle = C.white; ctx.fill();
    ctx.fillStyle = '#F5B98E'; ctx.strokeStyle = C.ink; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(-150, 330, 300, 300, 80); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(120, 380, 90, 170, 45); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-60, 0, 120, 430, 60); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFE2C8'; ctx.beginPath(); ctx.roundRect(-34, 22, 68, 70, 30); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.lineWidth = 7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-142, 470 + i * 46); ctx.lineTo(-30 - i * 6, 470 + i * 46); ctx.stroke(); }
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.roundRect(-140, 600, 280, 700, 20); ctx.fill(); ctx.lineWidth = 8; ctx.stroke();
    ctx.restore();
  }
  function pressBeat(ctx, t) {
    const t0 = 29.6; if (t < t0) return; const bp = CL.pop(t, t0, .3), j = CL.j(t, 12, 3);
    ctx.save(); ctx.translate(1420 + j[0], 720 + j[1]); ctx.scale(bp, bp); ctx.rotate(-.03);
    CL.blob(ctx, 0, 0, 640, 230, { fill: C.red, lw: 10 }); ctx.font = '900 110px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-40, -56); ctx.lineTo(60, 0); ctx.lineTo(-40, 56); ctx.closePath(); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 8; ctx.stroke();
    ctx.restore();
    const u = inv(29.66, 30.3, t), fy = lerp(-560, 500, ease.inOut(u)) - Math.sin(u * Math.PI) * 0; const jj = CL.j(t, 3, 2);
    if (t > 29.66) finger(ctx, 1440 + jj[0], fy + jj[1], .03);
  }

  A.scene({ name: 's6_nofreeze', start: 25.4, end: 30.5, draw: (ctx, s) => {
    if (CL.noCap && !CL.noCap.some(q => q[0] === 25.6)) CL.noCap.push([25.6, 27.3]);   // main.js resets CL.noCap after scenes load, so register lazily
    const t = s.t; let sx = 0, sy = 0;
    [[25.64, .45, 22], [25.82, .5, 30], [26.52, .7, 40], [29.25, .6, 24]].forEach(([a, d, m]) => { const k = CL.shake(t, a, d, m); sx += k[0]; sy += k[1]; });
    ctx.translate(CX + sx, CY + sy); ctx.scale(1.035, 1.035); ctx.translate(-CX, -CY);

    const partA = () => {
      const flash = t >= 26.52;
      if (!flash) { CL.paper(ctx, 'cream'); }
      else { CL.paper(ctx, 'yellow'); if (t < 26.6) { ctx.fillStyle = 'rgba(255,250,200,.85)'; ctx.fillRect(-50, -50, W + 100, H + 100); } }
      // halftone bursts
      [[25.64, 1520, 400, C.red, .28], [25.82, 580, 400, C.red, .3]].forEach(([a, x, y, col, al]) => { const u = t - a; if (u >= 0 && !flash) CL.halftone(ctx, x - 1000, y - 1000, 2000, 2000, col, 34 + Math.min(u, 1) * 12, .5, { fade: 'radial', alpha: al * (u < .6 ? 1 : .8) }); });
      if (flash) { const u = t - 26.52; CL.halftone(ctx, CX - 1300, 880 - 1300, 2600, 2600, C.orange, 36 + Math.min(u, 1) * 16, .5, { fade: 'radial', alpha: .5 }); CL.halftone(ctx, CX - 1100, 400 - 1100, 2200, 2200, C.red, 40, .5, { fade: 'radial', alpha: .16 }); }
      const S1 = stampLayer('אין', 380, 600, C.red, 11), S2 = stampLayer('תקיעות', 330, 1020, C.red, 23);
      // CUE 25.64 stamp
      slam(ctx, t, 25.64, 1520, 400, S1, -.07);
      // CUE 25.82 stamp2
      slam(ctx, t, 25.82, 580, 400, S2, .04);
      bits(ctx, t, 25.64, 1520, 400, 26, 1, { sp: 1300, g: 1300 }); bits(ctx, t, 25.82, 580, 400, 26, 40, { sp: 1300, g: 1300 });
      // CUE 26.52 period dot + yellow flash
      dot(ctx, t, 26.52, CX, 880, 150); bits(ctx, t, 26.52, CX, 880, 30, 90, { sp: 1300, g: 900, cols: [C.ink, C.red, C.white, C.blue, C.orange] });
    };
    const partB1 = () => {
      CL.paper(ctx, 'cream'); CL.halftone(ctx, 0, 0, W, H, C.blue, 34, .5, { alpha: .14, fade: 't' });
      tv1(ctx, t);
      bits(ctx, t, 27.8, CX, 450, 26, 300, { sp: 800, g: 1500, cols: [C.cream, C.red, C.kraft, C.white] });
    };
    const partB2 = () => {
      CL.paper(ctx, 'blue'); CL.halftone(ctx, 0, 0, W, H, C.yellow, 36, .5, { alpha: .18, fade: 'b' });
      if (t >= 29.25) { const u = t - 29.25; CL.halftone(ctx, CX - 1300, 430 - 1300, 2600, 2600, C.yellow, 30 + Math.min(u, 1) * 20, .5, { fade: 'radial', alpha: .5 }); }
      if (t < 29.25) { const tg = CL.pop(t, 28.2, .3); if (tg > 0) { ctx.save(); ctx.translate(230, 190); ctx.rotate(-.08); ctx.scale(tg, tg); CL.chip(ctx, 'LIVE', 0, 0, { size: 110, dir: 'ltr', fill: C.red, ink: C.white, seed: 4 }); ctx.restore(); } }
      football(ctx, t); crowd(ctx, t);
      // CUE 29.25 goal
      if (t >= 29.25 && t < 29.75) { const p = CL.pop(t, 29.27, .3); ctx.save(); ctx.translate(CX, 95); ctx.rotate(-.04); ctx.scale(p, p); CL.title(ctx, 'גוווול!', 0, 0, { size: 190, fill: C.red }); ctx.restore(); }
      bits(ctx, t, 29.25, 1460, 440, 34, 500, { sp: 1500, g: 1000 }); bits(ctx, t, 29.27, CX, 800, 36, 700, { a0: -3.5, spread: 3.8, sp: 1500, g: 1200 });
      pressBeat(ctx, t);
    };
    if (t < 25.62) { wipe(ctx, 'left', lerp(-60, W + 100, ease.out(inv(25.4, 25.6, t))), 3, () => CL.paper(ctx, 'cream')); }
    else if (t < 27.32) { partA(); if (t >= 27.12) wipe(ctx, 'right', lerp(W + 100, -80, ease.inOut(inv(27.12, 27.3, t))), 6, partB1); }
    else if (t < 28.22) { partB1(); if (t >= 28.0) wipe(ctx, 'bottom', lerp(H + 100, -80, ease.inOut(inv(28.0, 28.2, t))), 8, partB2); }
    else partB2();
  } });
})();
