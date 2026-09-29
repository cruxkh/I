// GOTV mascot "Goty": glossy blue play-ring body, dark glass face with big eyes, gold play-triangle tuft, gold mitts + legs.
// V.mascot(ctx, x, y, s, o)  centre anchor (x,y), s=1 ~ 300px tall (from tuft to shoes).
// o = {t, t0, tOut, pose:'idle|wave|point|cheer|shock|laugh|wink|peek|thumbs|zap', look:'l'|'r'|'cam'|{x,y}, face:'happy|wow|smug|excited|worried',
//      flip, alpha, glow, talk (0..1 mouth flap), mouth (force openness), prop:'remote'|'none', shadow:false, seed, rot}
// Deterministic in t. Pop-in spring starts at t0 (omit t0 => already popped). Pop-out starts at tOut.
(() => {
  const { clamp, lerp, hash } = A, TAU = Math.PI * 2;
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rg = (g, x, y, r0, r1, st) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const spring = u => u <= 0 ? 0 : 1 - Math.exp(-u * 9) * Math.cos(u * 16);
  const RO = 118, RI = 90;
  const FACES = {
    happy:   { eyeK: 1, pupil: 1, lid: 0, lidA: 0, mouth: 'D', open: .55, brow: 0, browA: 0, browR: 0 },
    wow:     { eyeK: 1.2, pupil: .6, lid: 0, lidA: 0, mouth: 'O', open: .85, brow: -12, browA: 0, browR: 0 },
    smug:    { eyeK: 1, pupil: 1, lid: .34, lidA: -.16, mouth: 'smirk', open: 0, brow: -2, browA: 0, browR: 9 },
    excited: { eyeK: 1.1, pupil: 1.12, lid: 0, lidA: 0, mouth: 'D', open: .95, brow: -8, browA: 0, browR: 0 },
    worried: { eyeK: 1, pupil: .8, lid: .1, lidA: .3, mouth: 'wavy', open: 0, brow: -4, browA: .42, browR: 0 },
  };
  const POSE_FACE = { idle: 'happy', wave: 'happy', point: 'excited', cheer: 'excited', shock: 'wow', laugh: 'excited', wink: 'smug', peek: 'happy', thumbs: 'happy', zap: 'excited' };

  // ---------- gold parts ----------
  function tube(g, sx, sy, hx, hy) {
    const dx = hx - sx, dy = hy - sy, len = Math.hypot(dx, dy) || 1; let nx = -dy / len, ny = dx / len; const sg = Math.sign(sx) || 1;
    if (nx * sg + ny * .6 < 0) { nx = -nx; ny = -ny; }
    const cx = (sx + hx) / 2 + nx * len * .22, cy = (sy + hy) / 2 + ny * len * .22;
    g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx, cy, hx, hy);
    g.strokeStyle = '#A95B06'; g.lineWidth = 27; g.stroke(); g.strokeStyle = '#F5A81C'; g.lineWidth = 22; g.stroke();
    g.save(); g.translate(-2.5, -3); g.strokeStyle = 'rgba(255,246,200,.85)'; g.lineWidth = 6; g.stroke(); g.restore();
  }
  const goldFill = (g, x, y, r) => rg(g, x - r * .3, y - r * .4, r * .1, r * 1.3, [[0, '#FFF6CF'], [.35, '#FFCB55'], [.75, '#F0A020'], [1, '#C97709']]);
  function cap(g, x0, y0, x1, y1, w) {  // gold capsule (finger)
    g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = '#B86A08'; g.lineWidth = w + 5; g.stroke(); g.strokeStyle = '#FFC24A'; g.lineWidth = w; g.stroke();
    g.strokeStyle = 'rgba(255,248,210,.8)'; g.lineWidth = w * .3; g.beginPath(); g.moveTo(x0 - w * .18, y0 - w * .1); g.lineTo(x1 - w * .18, y1 - w * .1); g.stroke();
  }
  function hand(g, x, y, type, ang, sc = 1) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
    const disc = r => { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = goldFill(g, 0, 0, r); g.fill(); g.lineWidth = 3.5; g.strokeStyle = '#B4650A'; g.stroke(); };
    if (type === 'open') {
      [-.62, -.2, .2, .62].forEach((a, i) => { const L = i === 1 || i === 2 ? 34 : 29; cap(g, Math.sin(a) * 12, -Math.cos(a) * 12, Math.sin(a * 1.15) * L, -Math.cos(a * 1.15) * L - 6, 13); });
      cap(g, -14, 4, -30, -8, 13); disc(25);
    } else if (type === 'thumb') { cap(g, -3, -14, -3, -40, 16); disc(26); g.strokeStyle = 'rgba(160,80,0,.55)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(6, -2 + i * 9); g.lineTo(20, -2 + i * 9); g.stroke(); } }
    else if (type === 'point') { cap(g, 4, -10, 4, -50, 13); disc(26); g.strokeStyle = 'rgba(160,80,0,.55)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(8, 6 + i * 9); g.lineTo(21, 6 + i * 9); g.stroke(); } }
    else { disc(26); g.strokeStyle = 'rgba(160,80,0,.55)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-14, -12 + i * 9); g.lineTo(-2, -12 + i * 9); g.stroke(); } }
    g.restore();
  }
  function shoe(g, x, y, dir, sq = 1) {
    g.save(); g.translate(x, y); g.scale(dir, sq);
    g.beginPath(); g.ellipse(4, 2, 30, 15, 0, 0, TAU); g.fillStyle = '#0B1450'; g.fill();
    g.beginPath(); g.ellipse(4, -2, 29, 14, 0, 0, TAU); g.fillStyle = lg(g, 0, -16, 0, 12, [[0, '#FFFFFF'], [.55, '#DCE8FF'], [1, '#8FB0FF']]); g.fill();
    g.beginPath(); g.ellipse(14, -6, 10, 5, -.2, 0, TAU); g.fillStyle = '#2F6BFF'; g.fill();
    g.restore();
  }
  function playTri(g, cx, cy, sc, rot) {
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc); g.lineJoin = 'round';
    const P = (dx = 0, dy = 0) => { const q = new Path2D(); [[-26, -40], [46, 0], [-26, 40]].forEach(([x, y], i) => i ? q.lineTo(x + dx, y + dy) : q.moveTo(x + dx, y + dy)); q.closePath(); return q; };
    for (let i = 6; i >= 1; i--) { const q = P(i * .6, i * 1.0); g.fillStyle = g.strokeStyle = A.mixc('#D98410', '#6B3604', i / 6); g.lineWidth = 16; g.fill(q); g.stroke(q); }
    const q = P(); g.fillStyle = g.strokeStyle = lg(g, 0, -50, 0, 50, [[0, '#FFF6CF'], [.4, '#FFCB55'], [.55, '#F0A020'], [1, '#FFD067']]); g.lineWidth = 16; g.fill(q); g.stroke(q);
    g.save(); g.clip(q); g.lineWidth = 9; g.strokeStyle = lg(g, -30, -40, 40, 40, [[0, 'rgba(255,255,245,.95)'], [.5, 'rgba(255,220,120,0)'], [1, 'rgba(160,80,0,.6)']]); g.stroke(q);
    g.fillStyle = lg(g, 0, -44, 0, 0, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-40, -50, 100, 52); g.restore();
    g.restore();
  }
  function remote(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.scale(1.3, 1.3); g.beginPath(); g.roundRect(-15, -58, 30, 84, 12); g.fillStyle = lg(g, -15, 0, 15, 0, [[0, '#26307F'], [.5, '#141C6B'], [1, '#080E45']]); g.fill(); g.lineWidth = 3; g.strokeStyle = '#7FA8FF'; g.stroke();
    g.beginPath(); g.arc(0, -42, 5.5, 0, TAU); g.fillStyle = '#FF3B4A'; g.fill();
    g.beginPath(); g.arc(0, -22, 8, 0, TAU); g.fillStyle = '#FFC24A'; g.fill();
    g.fillStyle = '#5AD1FF'; g.fillRect(-9, -8, 8, 6); g.fillRect(1, -8, 8, 6);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(-11, -55, 5, 66, 3); g.fill();
    g.restore();
  }

  // ---------- face ----------
  function eye(g, cx, cy, rw, rh, lx, ly, close, F, side, open) {
    if (open === 'arc') { g.save(); g.lineCap = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.arc(cx, cy + rh * .35, rw * .8, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); g.restore(); return; }
    g.save(); g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, TAU); g.clip();
    g.fillStyle = rg(g, cx - rw * .2, cy - rh * .3, 2, rh * 1.3, [[0, '#FFFFFF'], [.7, '#EAF1FF'], [1, '#A9C2FF']]); g.fillRect(cx - rw, cy - rh, rw * 2, rh * 2);
    const ir = rw * .66 * F.pupil, ix = cx + lx * rw * .36, iy = cy + ly * rh * .3;
    g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fillStyle = rg(g, ix, iy + ir * .3, ir * .1, ir, [[0, '#7FE6FF'], [.5, '#2F7BFF'], [1, '#0A1E8A']]); g.fill();
    g.beginPath(); g.arc(ix, iy, ir * .48, 0, TAU); g.fillStyle = '#050B33'; g.fill();
    g.beginPath(); g.arc(ix - ir * .32, iy - ir * .36, ir * .3, 0, TAU); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.arc(ix + ir * .34, iy + ir * .34, ir * .13, 0, TAU); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill();
    if (F.eyeK > 1.08) { g.save(); g.translate(ix + ir * .05, iy - ir * .05); [[.55, .5], [-.5, .55]].forEach(([a, b], i) => { g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(a * ir * .5, b * ir * .5, ir * .07, 0, TAU); g.fill(); }); g.restore(); }
    // lid (blink + mood)
    const top = cy - rh + rh * 2 * close + F.lid * rh * 2;
    if (top > cy - rh + 1) {
      const a = F.lidA * side * rw;
      g.beginPath(); g.moveTo(cx - rw - 2, top - a); g.lineTo(cx + rw + 2, top + a); g.lineTo(cx + rw + 2, cy - rh - 4); g.lineTo(cx - rw - 2, cy - rh - 4); g.closePath();
      g.fillStyle = lg(g, 0, cy - rh, 0, top, [[0, '#2F86FF'], [1, '#1B45C8']]); g.fill();
      g.strokeStyle = 'rgba(5,10,50,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - rw - 2, top - a); g.lineTo(cx + rw + 2, top + a); g.stroke();
    }
    g.restore();
    g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, TAU); g.lineWidth = 2.5; g.strokeStyle = 'rgba(180,230,255,.7)'; g.stroke();
  }
  function mouth(g, type, open, t) {
    const fillM = () => { g.fillStyle = lg(g, 0, 0, 0, 70, [[0, '#7A0F35'], [1, '#C01E55']]); g.fill(); };
    if (type === 'D' || type === 'O') {
      g.save(); g.translate(0, 44); g.beginPath();
      if (type === 'D') { const w = 26 + open * 8, d = 6 + open * 46; g.moveTo(-w, 0); g.quadraticCurveTo(0, 7, w, 0); g.bezierCurveTo(w * .95, d, -w * .95, d, -w, 0); }
      else { g.ellipse(0, 6, 13 + open * 3, 11 + open * 14, 0, 0, TAU); }
      g.closePath(); fillM(); g.save(); g.clip();
      if (type === 'D') { g.fillStyle = '#fff'; g.fillRect(-40, -4, 80, 6 + Math.min(1, open * 2) * 6); if (open > .45) { g.beginPath(); g.ellipse(0, 12 + open * 46, 20, 10 + open * 8, 0, 0, TAU); g.fillStyle = '#FF6E96'; g.fill(); } }
      else { g.beginPath(); g.ellipse(0, 22 + open * 8, 10, 8, 0, 0, TAU); g.fillStyle = '#FF6E96'; g.fill(); }
      g.restore(); g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); g.restore();
    } else if (type === 'smirk') {
      g.save(); g.lineCap = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 6.5; g.beginPath(); g.moveTo(-22, 50); g.quadraticCurveTo(2, 60, 30, 36); g.stroke();
      g.beginPath(); g.moveTo(30, 36); g.lineTo(35, 30); g.stroke(); g.restore();
    } else {
      g.save(); g.lineCap = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 6.5; g.beginPath(); g.moveTo(-24, 56); g.bezierCurveTo(-16, 44, -8, 44, 0, 54); g.bezierCurveTo(8, 64, 16, 64, 24, 52); g.stroke(); g.restore();
    }
  }

  // ---------- pose targets ----------
  function pose(name, t) {
    const sw = (f, p = 0) => Math.sin(t * f + p);
    const P = { L: { x: -146, y: 76, type: 'fist', ang: 0 }, R: { x: 146, y: 76, type: 'fist', ang: 0 }, tilt: 0, hop: 0, sy: 1, shake: 0, eyes: null, remote: false, mouthOpen: null, extra: null };
    switch (name) {
      case 'wave': P.R = { x: 150, y: -64, type: 'open', ang: .3 + sw(13) * .45 }; P.L = { x: -140, y: 74, type: 'fist', ang: 0 }; P.tilt = -.05 + sw(6.5) * .025; break;
      case 'point': P.R = { x: 204, y: -6 + sw(9) * 3, type: 'point', ang: 1.32 }; P.L = { x: -112, y: 70, type: 'fist', ang: 0 }; P.tilt = .06; break;
      case 'cheer': { const h = Math.abs(sw(7)); P.hop = h * 34; P.L = { x: -142 + sw(12) * 6, y: -128 + sw(12) * 14, type: 'fist', ang: -.2 }; P.R = { x: 142 + sw(12, 1) * 6, y: -128 + sw(12, 1) * 14, type: 'fist', ang: .2 }; P.eyes = 'arc'; P.tilt = sw(3.5) * .05; break; }
      case 'shock': P.L = { x: -96 + sw(43) * 2.5, y: 10, type: 'open', ang: .5 }; P.R = { x: 96 + sw(41) * 2.5, y: 10, type: 'open', ang: -.5 }; P.sy = 1.08; P.shake = sw(37) * 2.2; break;
      case 'laugh': P.L = { x: -74, y: 80, type: 'fist', ang: 0 }; P.R = { x: 74, y: 80, type: 'fist', ang: 0 }; P.tilt = sw(21) * .045; P.hop = Math.abs(sw(11)) * 10; P.eyes = 'arc'; P.mouthOpen = .8 + sw(22) * .2; break;
      case 'wink': P.R = { x: 160, y: -6, type: 'point', ang: 1.42 }; P.L = { x: -112, y: 70, type: 'fist', ang: 0 }; P.tilt = -.08; P.eyes = 'wink'; break;
      case 'peek': P.L = { x: -96, y: 92, type: 'open', ang: .25 }; P.R = { x: 96, y: 92, type: 'open', ang: -.25 }; P.tilt = .04 * sw(2); P.sy = .96; break;
      case 'thumbs': P.R = { x: 154, y: -26 + sw(8) * 3, type: 'thumb', ang: .1 }; P.L = { x: -112, y: 70, type: 'fist', ang: 0 }; P.hop = Math.abs(sw(4)) * 8; break;
      case 'zap': P.R = { x: 172, y: -34, type: 'fist', ang: .75 }; P.L = { x: -132, y: -58 + sw(10) * 4, type: 'open', ang: -.3 }; P.remote = true; P.tilt = .05; break;
      default: P.R = { x: 146, y: 78 + sw(2.6) * 4, type: 'fist', ang: .2 }; P.L = { x: -148, y: 78 + sw(2.6, 1) * 4, type: 'open', ang: -.2 }; P.remote = true; P.tilt = sw(1.3) * .03;
    }
    return P;
  }

  V.mascot = function (ctx, x, y, s = 1, o = {}) {
    const t = o.t || 0, poseName = o.pose || 'idle', seed = o.seed || 1;
    const u = o.t0 == null ? 9 : t - o.t0; if (u < 0) return;
    let pop = o.t0 == null ? 1 : spring(u), alpha = o.alpha ?? 1;
    if (o.tOut != null && t > o.tOut) { const w = (t - o.tOut) / .3; if (w >= 1) return; pop *= 1 - A.ease.inBack(clamp(w)); alpha *= 1 - A.smooth(.6, 1, w); }
    if (pop <= 0.001) return;
    const P = pose(poseName, t), F0 = FACES[o.face || POSE_FACE[poseName]] || FACES.happy, F = Object.assign({}, F0);
    // idle bounce on the beat (120 bpm) with squash on landing
    const ph = (t * 2) % 1, bounce = Math.abs(Math.sin(ph * Math.PI)), land = ph < .12 ? (1 - ph / .12) : 0;
    const hop = P.hop + bounce * (poseName === 'cheer' || poseName === 'laugh' ? 4 : 9);
    const sqK = land * .07 - (bounce > .8 ? .02 : 0);
    const popSY = pop * (1 + .32 * (pop - 1)), popSX = pop * (1 - .32 * (pop - 1));
    const sx = popSX * (1 + sqK), sy = popSY * P.sy * (1 - sqK);
    // look
    let lk = { x: 0, y: .05 }; const L0 = o.look;
    if (L0 === 'l') lk = { x: -.85, y: .05 }; else if (L0 === 'r') lk = { x: .85, y: .05 }; else if (L0 && typeof L0 === 'object') lk = { x: L0.x, y: L0.y };
    else if (!L0 && poseName === 'point') lk = { x: .85, y: -.05 };
    const slot = Math.floor(t / .75 + seed * 3), fr = t / .75 + seed * 3 - slot, sacc = A.smooth(0, .12, fr);
    const sa = i => (hash(slot * 3.1 + i + seed) - .5) * 2, sp = i => (hash((slot - 1) * 3.1 + i + seed) - .5) * 2;
    lk = { x: clamp(lk.x + lerp(sp(1), sa(1), sacc) * .22, -1, 1), y: clamp(lk.y + lerp(sp(2), sa(2), sacc) * .2, -1, 1) };
    const blink = A.blink(t, seed);
    const talk = o.talk ? Math.abs(Math.sin(t * 15)) * .5 + Math.abs(Math.sin(t * 9.3)) * .4 : 0;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); if (o.rot) ctx.rotate(o.rot);
    // ground shadow (world)
    if (o.shadow !== false) { const k = 1 - clamp(hop / 90) * .35; ctx.save(); ctx.translate(0, 168); ctx.scale(k * pop, 1); ctx.globalAlpha *= .5 * (1 - clamp(hop / 120) * .5); ctx.fillStyle = rg(ctx, 0, 0, 2, 100, [[0, 'rgba(0,10,50,.85)'], [1, 'rgba(0,10,50,0)']]); ctx.beginPath(); ctx.ellipse(0, 0, 100, 17, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    if (o.glow) { A.glow(ctx, 0, -10, 260 * (o.glow > 0 ? 1 : 1), '#3D8BFF', .5 * Math.min(1, o.glow)); A.glow(ctx, 0, 0, 170, '#FFC24A', .18 * Math.min(1, o.glow)); }
    // body group: squash about the feet
    ctx.translate(0, 150); ctx.scale(sx, sy); ctx.translate(0, -150 - hop); ctx.translate(P.shake, 0);
    const legSway = poseName === 'cheer' ? Math.sin(t * 7) * 4 : 0;
    // legs
    if (poseName !== 'peek') for (const sd of [-1, 1]) {
      const lx = sd * 34, fy = 148 + hop * .5, fx = lx + sd * (2 + legSway * sd);
      ctx.beginPath(); ctx.moveTo(lx, 100); ctx.lineTo(fx, fy - 8); ctx.lineCap = 'round'; ctx.strokeStyle = '#A95B06'; ctx.lineWidth = 22; ctx.stroke(); ctx.strokeStyle = '#F5A81C'; ctx.lineWidth = 17; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,246,200,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx - 3, 100); ctx.lineTo(fx - 3, fy - 8); ctx.stroke();
      shoe(ctx, fx + sd * 2, fy, sd, 1 - hop * .004);
    }
    // body tilt
    ctx.save(); ctx.rotate(P.tilt + (poseName === 'peek' ? (o.flip ? -.1 : .1) : 0));
    // arms (behind ring)
    tube(ctx, -104, 26, P.L.x, P.L.y); tube(ctx, 104, 26, P.R.x, P.R.y);
    // ring extrusion
    const ringP = new Path2D(); ringP.arc(0, 0, RO, 0, TAU); ringP.moveTo(RI, 0); ringP.arc(0, 0, RI, 0, TAU, true);
    const sh = (dx, dy) => { const q = new Path2D(); q.addPath(ringP, new DOMMatrix().translate(dx, dy)); return q; };
    ctx.save(); ctx.shadowColor = 'rgba(0,10,60,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12; ctx.fillStyle = '#0A1A6E'; ctx.fill(sh(7, 12), 'evenodd'); ctx.restore();
    for (let i = 9; i >= 1; i--) { ctx.fillStyle = A.mixc('#2D86FF', '#08155E', i / 9); ctx.fill(sh(i * .85, i * 1.35), 'evenodd'); }
    // face plate (dark screen)
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, RI + 1, 0, TAU); ctx.clip();
    ctx.fillStyle = rg(ctx, 0, -14, 6, RI + 6, [[0, '#1A3CB8'], [.65, '#0B1C78'], [1, '#050B36']]); ctx.fillRect(-100, -100, 200, 200);
    // face contents (slight parallax by look)
    ctx.save(); ctx.translate(lk.x * 7, lk.y * 4);
    const ek = F.eyeK, rw = 27 * ek, rh = 35 * ek, ey = -10;
    const eo = P.eyes === 'arc' ? 'arc' : null;
    for (const sd of [-1, 1]) {
      const wnk = P.eyes === 'wink' && sd === 1;
      if (o.blinkOnly) {}
      const arc = eo || (wnk ? 'arc' : null);
      eye(ctx, sd * 34, ey, rw, rh, lk.x, lk.y, clamp(blink), F, sd, arc || 'std');
    }
    // brows
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(200,240,255,.95)'; ctx.lineWidth = 7;
    for (const sd of [-1, 1]) {
      const wnk = P.eyes === 'wink' && sd === 1; const lift = F.brow - (wnk ? 4 : 0) - (sd === 1 ? F.browR : 0) - (poseName === 'cheer' ? Math.sin(t * 12) * 3 : 0);
      ctx.save(); ctx.translate(sd * 34, ey - rh - 12 + lift); ctx.rotate(sd * -F.browA * -1 * .0 + (-sd) * F.browA * -1 * 0); ctx.rotate(sd * (-F.browA) + 0); ctx.beginPath(); ctx.moveTo(-15, 2); ctx.quadraticCurveTo(0, -5, 15, 2); ctx.stroke(); ctx.restore();
    }
    // cheeks
    for (const sd of [-1, 1]) { ctx.fillStyle = rg(ctx, sd * 62, 30, 1, 20, [[0, 'rgba(255,90,150,.5)'], [1, 'rgba(255,90,150,0)']]); ctx.fillRect(sd * 62 - 22, 8, 44, 44); }
    const open = o.mouth != null ? o.mouth : P.mouthOpen != null ? P.mouthOpen : Math.max(F.open, talk);
    const mt = (o.talk && F.mouth === 'smirk') ? 'D' : (poseName === 'laugh' || poseName === 'cheer' ? 'D' : F.mouth);
    mouth(ctx, mt, open, t);
    ctx.restore();
    // glass streak + inner top shadow
    ctx.fillStyle = lg(ctx, -70, -80, 30, 10, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.moveTo(-90, -30); ctx.lineTo(-30, -90); ctx.lineTo(10, -90); ctx.lineTo(-90, 10); ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(2,6,40,.55)'; ctx.beginPath(); ctx.arc(0, 0, RI + 6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.restore();
    // ring face
    ctx.fillStyle = lg(ctx, 0, -RO, 0, RO, [[0, '#C8F6FF'], [.22, '#63CFFF'], [.5, '#2F7BFF'], [.8, '#1533B4'], [1, '#33A0F5']]); ctx.fill(ringP, 'evenodd');
    ctx.save(); ctx.clip(ringP, 'evenodd');
    ctx.strokeStyle = 'rgba(8,30,140,.3)'; ctx.lineWidth = 30; ctx.stroke(ringP);
    ctx.strokeStyle = lg(ctx, -RO, -RO, RO, RO, [[0, 'rgba(240,255,255,.95)'], [.42, 'rgba(120,220,255,0)'], [.6, 'rgba(255,190,90,0)'], [1, 'rgba(255,200,110,.85)']]); ctx.lineWidth = 12; ctx.stroke(ringP);
    ctx.lineCap = 'round'; ctx.strokeStyle = lg(ctx, -100, -100, 40, -110, [[0, 'rgba(255,255,255,0)'], [.35, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 108, 190 * Math.PI / 180, 290 * Math.PI / 180); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,245,255,.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 107, 20 * Math.PI / 180, 78 * Math.PI / 180); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(190,250,255,.9)'; ctx.beginPath(); ctx.arc(0, 0, RI - .5, 0, TAU); ctx.stroke();
    // tuft: gold play triangle
    const tr = -.62 + Math.sin(t * 4.2) * .08 - P.tilt * 1.5 + (land * .18);
    playTri(ctx, 4 + P.tilt * 30, -RO - 18, .58, tr);
    // remote / bolts
    if (P.remote && o.prop !== 'none') {
      remote(ctx, P.R.x, P.R.y - 8, P.R.ang * (poseName === 'zap' ? 1 : .6));
      if (poseName === 'zap') {
        const a = P.R.ang, tx = P.R.x + Math.sin(a) * 60, ty = P.R.y - 8 - Math.cos(a) * 60, fl = Math.floor(t * 15);
        A.glow(ctx, tx, ty, 90, '#5AD1FF', .8);
        for (let k = 0; k < 3; k++) {
          ctx.save(); ctx.translate(tx, ty); ctx.rotate(a + (k - 1) * .45 + (hash(fl + k) - .5) * .3); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.beginPath(); let px = 0, py = 0; ctx.moveTo(0, 0); for (let i = 1; i <= 5; i++) { px = (hash(fl * 7 + k * 13 + i) - .5) * 30; py = -i * 24; ctx.lineTo(px, py); }
          ctx.strokeStyle = '#5AD1FF'; ctx.lineWidth = 12; ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
        }
      }
    }
    // hands in front
    const hs = poseName === 'wave' ? 1 + Math.sin(t * 13) * 0.02 : 1;
    hand(ctx, P.L.x, P.L.y, P.L.type, P.L.ang, hs); hand(ctx, P.R.x, P.R.y, P.R.type, P.R.ang, hs);
    // extras
    if (F === F && (poseName === 'shock' || (o.face || '') === 'worried')) { const k = (t * .8) % 1; ctx.save(); ctx.translate(74, -62 + k * 40); ctx.globalAlpha = 1 - k * .6; ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(13, 0, 0, 10); ctx.quadraticCurveTo(-13, 0, 0, -18); ctx.fillStyle = rg(ctx, -3, -2, 1, 14, [[0, '#fff'], [1, '#5AD1FF']]); ctx.fill(); ctx.restore(); }
    if (poseName === 'laugh') for (const sd of [-1, 1]) { const k = (t * 2.2 + (sd > 0 ? .4 : 0)) % 1; ctx.save(); ctx.translate(sd * (70 + k * 22), 6 + k * 34); ctx.globalAlpha = 1 - k * k; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(9, 0, 0, 7); ctx.quadraticCurveTo(-9, 0, 0, -12); ctx.fillStyle = '#9BE7FF'; ctx.fill(); ctx.restore(); }
    if (poseName === 'thumbs' || poseName === 'wink' || poseName === 'cheer') for (let i = 0; i < 3; i++) {
      const k = (t * 1.3 + i / 3) % 1, a = i * 2.2 + 1; V.sparkle(ctx, Math.cos(a) * 150 + (poseName === 'wink' ? 40 : 0), -80 + Math.sin(a) * 90 - k * 20, (1 - Math.abs(k * 2 - 1)) * 18 + 2, '#FFF3C4', k * 3, 1);
    }
    ctx.restore(); ctx.restore();
  };
  V.mascotPoses = ['idle', 'wave', 'point', 'cheer', 'shock', 'laugh', 'wink', 'peek', 'thumbs', 'zap'];
})();
