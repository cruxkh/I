// s8_pick_end (LANDSCAPE 1920x1080): "פשוט בוחרים מה לראות" / "ומתחילים לצפות" + END CARD
// v 24.95 .. 30.6.  Words: 25.08 פשוט / 25.43 בוחרים / 25.91 מה / 26.05 לראות / 26.30 ומתחילים / 26.94 לצפות (ends 27.43)
// Beats: wipe-in (24.95) -> candy tile row glides in (25.08) -> finger hovers, tiles bounce (25.43) -> TAP (26.05)
//        -> tile bursts to full screen + play pulses (26.30) -> full-screen playback bursts open (26.94)
//        -> iris close onto navy -> LOGO SLAM (27.60) -> calm resolved hold until 30.6.
(() => {
  const { clamp, lerp, inv, ease, hash } = A; const C = CL.C, TAU = A.TAU;
  const W = 1920, H = 1080, CX = 960;
  const S0 = 24.95, SE = 30.7;
  const T_WIPE1 = 25.34, T_TAP = 26.05, T_BURST = 26.30, T_PLAY = 26.94, T_IRIS = 27.42, SLAM = 27.60, T_TAG = 28.10;
  const sm = (a, b, x) => A.smooth(a, b, x);
  const kick = (t, t0, amp = 1, f = 20, d = 7) => (t < t0 ? 0 : amp * Math.sin((t - t0) * f) * Math.exp(-(t - t0) * d));
  const pulse = (t, a, b) => (t < a || t > b ? 0 : Math.sin((t - a) / (b - a) * Math.PI));

  // ---------------------------------------------------------------- liquid helpers
  function blobPts(cx, cy, R, seed, wob, ph) {
    const N = 30, pts = [];
    for (let j = 0; j < N; j++) { const a = j / N * TAU, n = A.noise2(Math.cos(a) * 1.4 + seed * 3.1, Math.sin(a) * 1.4 + ph); pts.push([cx + Math.cos(a) * R * (1 + wob * n), cy + Math.sin(a) * R * (1 + wob * n)]); }
    return pts;
  }
  // circular liquid reveal: lead colour bands (outer, earliest) then the content clipped in the innermost blob
  function reveal(ctx, t, cx, cy, t0, dur, R0, R1, seed, cols, inner) {
    const n = cols.length, pl = clamp((t - t0) / dur), Rm = lerp(R0, R1, ease.out(pl)), bw = 28 + 70 * ease.out(pl);
    if (t < t0) return;
    for (let i = 0; i <= n; i++) {
      const R = Rm - i * bw; if (R < 3) continue;
      const wob = .05 + .17 * (1 - pl), pts = blobPts(cx, cy, R, seed + i, wob, t * 2.2 + i);
      if (i < n) { A.blob(ctx, pts); ctx.fillStyle = cols[i]; ctx.fill(); }
      else {
        ctx.save(); A.blob(ctx, pts); ctx.clip(); inner(); ctx.restore();
        A.blob(ctx, pts); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
      }
    }
    // flying droplets off the lead edge
    if (pl > 0 && pl < 1) for (let j = 0; j < 14; j++) { const a = hash(j * 5.3 + seed) * TAU, r = Rm * (1.05 + .12 * hash(j + seed)); CL.drop(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, (10 + 22 * hash(j * 2 + seed)) * (1 - pl), cols[j % cols.length], t, j); }
  }
  // right-to-left liquid wipe covering the previous scene; the new scene is clipped to the innermost edge
  function wipeIn(ctx, t, inner) {
    const p = (t - S0) / (T_WIPE1 - S0);
    if (p <= 0) return; if (p >= 1) { inner(); return; }
    const cols = [C.cyan, C.purple, C.pink, C.orange], n = cols.length, lagT = .085;
    const edge = (i) => { const q = clamp((p - i * lagT) / (1 - n * lagT)), x0 = lerp(W + 260, -320, ease.inOut(q)); return x0; };
    const pathFor = (i) => { const x0 = edge(i); ctx.beginPath(); for (let y = -20; y <= H + 40; y += 20) { const x = x0 + Math.sin(y * .011 + i * 1.7 + p * 8) * 70 + Math.sin(y * .027 - p * 6 + i) * 26; y <= -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineTo(W + 400, H + 40); ctx.lineTo(W + 400, -20); ctx.closePath(); };
    for (let i = 0; i < n; i++) { pathFor(i); ctx.fillStyle = cols[i]; ctx.fill(); }
    ctx.save(); pathFor(n); ctx.clip(); inner(); ctx.restore();
    pathFor(n); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
    for (let j = 0; j < 9; j++) { const y = hash(j * 3.7) * H, x = edge(0) - 40 - hash(j) * 160 + Math.sin(y * .011 + p * 8) * 70; CL.drop(ctx, x, y, 12 + 22 * hash(j + 4), cols[j % 4], t, j); }
  }

  // ---------------------------------------------------------------- tiles (a row of 4 big candy tiles)
  const TW = 410, TH = 600, TY = 440;
  const TILES = [
    { id: 'movie', label: 'סרטים', x: 1575, c: ['#FF6DB6', '#C2137A'], t0: 25.00, hv: 25.55 },
    { id: 'series', label: 'סדרות', x: 1165, c: ['#FFC93F', '#F0620F'], t0: 25.05, hv: 25.79 },
    { id: 'sport', label: 'כדורגל', x: 755, c: ['#9BFF55', '#12B571'], t0: 25.10, hv: 25.97 },
    { id: 'live', label: 'שידור חי', x: 345, c: ['#3DD8FF', '#3A4CF0'], t0: 25.15, hv: 99 },
  ];
  const CHOSEN = 2;
  function pent(g, x, y, r, rot) { g.beginPath(); for (let k = 0; k < 5; k++) { const a = rot + k / 5 * TAU - Math.PI / 2; k ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
  function ball(g, r, spin) {
    g.save(); g.rotate(spin); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = A.radial(g, -r * .3, -r * .35, r * .1, r * 1.1, [[0, '#fff'], [.6, '#f1f3ff'], [1, '#aeb6e6']]); g.fill();
    g.save(); g.clip(); g.fillStyle = C.ink; pent(g, 0, 0, r * .36, 0); g.fill();
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; g.strokeStyle = 'rgba(5,8,38,.55)'; g.lineWidth = r * .045; g.beginPath(); g.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); g.lineTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); g.stroke(); pent(g, Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, r * .34, a + Math.PI / 2 + Math.PI / 5); g.fill(); }
    g.restore(); g.lineWidth = r * .06; g.strokeStyle = C.ink; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.restore();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-r * .38, -r * .5, r * .26, r * .12, -.7, 0, TAU); g.fill();
  }
  function icon(g, id, t) {
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    if (id === 'movie') {   // clapperboard
      g.fillStyle = C.ink; g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.roundRect(-140, -40, 280, 190, 22); g.fill(); g.stroke();
      g.fillStyle = C.yellow; g.beginPath(); g.moveTo(-30, 22); g.lineTo(-30, 100); g.lineTo(44, 61); g.closePath(); g.fill();
      g.save(); g.translate(-140, -48); g.rotate(-.24 + .06 * Math.sin(t * 3)); g.beginPath(); g.roundRect(0, -64, 280, 64, 16); g.fillStyle = C.ink; g.fill(); g.save(); g.clip();
      g.fillStyle = '#fff'; for (let k = 0; k < 7; k++) { const x = k * 56 - 10; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 28, 0); g.lineTo(x + 52, -64); g.lineTo(x + 24, -64); g.closePath(); g.fill(); } g.restore();
      g.beginPath(); g.roundRect(0, -64, 280, 64, 16); g.stroke(); g.restore();
    } else if (id === 'series') {   // stack of episode cards with play
      for (let k = 2; k >= 1; k--) { g.fillStyle = `rgba(255,255,255,${.28 + .22 * (2 - k)})`; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 8; g.beginPath(); g.roundRect(-140 + k * 16, -105 - k * 34, 280 - k * 32, 190, 26); g.fill(); g.stroke(); }
      g.fillStyle = C.ink; g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.roundRect(-150, -60, 300, 210, 28); g.fill(); g.stroke();
      g.fillStyle = C.pink; g.beginPath(); g.moveTo(-34, -6); g.lineTo(-34, 96); g.lineTo(58, 45); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(-115, 118, 230, 12, 6); g.fill(); g.fillStyle = C.yellow; g.beginPath(); g.roundRect(-115, 118, 230 * (.35 + .1 * Math.sin(t * 1.2)), 12, 6); g.fill();
    } else if (id === 'sport') { g.translate(0, 45); ball(g, 150, t * .9); }
    else {   // live: broadcast waves + LIVE pill
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 30, 40, 0, TAU); g.fill();
      for (let k = 1; k <= 3; k++) { const a = .3 + .7 * (.5 + .5 * Math.sin(t * 5 - k * 1.1)); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 20; const r = 40 + k * 44; g.beginPath(); g.arc(0, 30, r, -.85, .85); g.stroke(); g.beginPath(); g.arc(0, 30, r, Math.PI - .85, Math.PI + .85); g.stroke(); }
      g.fillStyle = C.red; g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.roundRect(-92, 120, 184, 62, 31); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.font = '900 42px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText('LIVE', 0, 153);
    }
    g.restore();
  }
  // one tile at pose {x,y,rot,sc,alpha,glow}
  function tileDraw(ctx, i, P, t) {
    const T = TILES[i]; ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.rot); ctx.scale(P.sx ?? P.sc, P.sy ?? P.sc); ctx.globalAlpha *= P.alpha ?? 1;
    if (P.glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 100, 520, [[0, A.hex(T.c[0], .55 * P.glow)], [1, A.hex(T.c[0], 0)]]); ctx.fillRect(-560, -560, 1120, 1120); ctx.restore(); }
    CL.gel(ctx, 0, 0, TW, TH, { fill: T.c[0], dark: T.c[1], r: 84, rim: P.glow > .3 ? '#fff' : 'rgba(255,255,255,.9)', rimW: 8, shadow: 30 });
    ctx.save(); ctx.beginPath(); ctx.roundRect(-TW / 2, -TH / 2, TW, TH, 84); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.16)'; [[-150, 230, 120], [170, -230, 90], [190, 250, 60], [-170, -240, 50]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); });
    ctx.restore();
    ctx.save(); ctx.translate(0, -68); ctx.scale(1.12, 1.12); icon(ctx, T.id, t); ctx.restore();
    ctx.save(); ctx.font = '900 100px Rubik'; ctx.direction = 'rtl'; const tw = ctx.measureText(T.label).width; ctx.restore();
    CL.title(ctx, T.label, 0, 218, { size: 100, scale: Math.min(1, 320 / tw), fill: ['#ffffff', '#ffe9a8'], dir: 'rtl' });
    ctx.restore();
  }
  // ---------------------------------------------------------------- the finger
  const fk = [[25.20, [2050, 1400]], [25.56, [1600, 560], 'out'], [25.64, [1585, 540]], [25.80, [1170, 560]], [25.88, [1160, 545]], [25.98, [772, 526]], [26.05, [756, 462], 'in'], [26.13, [756, 494], 'out'], [26.60, [1050, 1500], 'in']];
  const fingerAt = t => A.key(t, fk, 'inOut');
  function finger(ctx, x, y, press, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.42); const sc = 1 - .07 * press; ctx.scale(sc, sc); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
    const skin = A.linear(ctx, -70, 0, 70, 0, [[0, '#FFE6D0'], [1, '#F5AB80']]), skin2 = A.linear(ctx, 0, 300, 260, 300, [[0, '#F7B48A'], [1, '#E99870']]);
    ctx.fillStyle = 'rgba(2,4,30,.32)'; ctx.beginPath(); ctx.roundRect(-52, 40, 128, 760, 64); ctx.fill();   // soft shadow
    const shape = (fn, fill) => { ctx.beginPath(); fn(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke(); };
    shape(() => ctx.roundRect(-150, 500, 360, 420, 120), skin2);                       // palm
    [340, 440, 540].forEach((yy, k) => shape(() => ctx.roundRect(40, yy - 50, 230 - k * 10, 100, 50), skin2));   // curled fingers
    shape(() => ctx.roundRect(-64, 0, 128, 700, 64), skin);                            // index finger
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.roundRect(-38, 24, 76, 92, 36); ctx.fill();          // nail
    ctx.fillStyle = 'rgba(255,120,150,.25)'; ctx.beginPath(); ctx.roundRect(-38, 70, 76, 46, 30); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(-44, 150, 16, 220, 8); ctx.fill();          // gloss
    ctx.strokeStyle = 'rgba(160,80,50,.45)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; [300, 330].forEach(yy => { ctx.beginPath(); ctx.moveTo(-30, yy); ctx.quadraticCurveTo(0, yy + 12, 30, yy); ctx.stroke(); });
    ctx.restore();
  }

  // ---------------------------------------------------------------- background life
  function bgLife(ctx, t, k = 1) {
    ctx.save(); ctx.globalAlpha = .9 * k;
    CL.twinkle(ctx, t, 0, 0, W, H, 26, 5, ['#fff', C.cyan, C.yellow, C.pink]);
    for (let i = 0; i < 12; i++) { const r = 12 + hash(i * 2.1) * 30, x = hash(i * 7.3) * W, y = ((hash(i * 4.4) * H - t * (20 + hash(i) * 40)) % (H + 100) + H + 100) % (H + 100) - 50; ctx.globalAlpha = .55 * k; CL.drop(ctx, x + Math.sin(t * .8 + i) * 30, y, r, CL.CAND[i % 8], t, i); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- PHASE 1: tile row, finger, tap
  function tilesLayer(ctx, t) {
    const tip = fingerAt(t), pressK = sm(25.94, 26.05, t) * (1 - sm(26.05, 26.2, t));
    const cxr = TILES[CHOSEN].x;
    // draw non-chosen first, chosen last
    [0, 1, 3, CHOSEN].forEach(i => {
      const T = TILES[i], u = clamp((t - T.t0) / .62), eb = ease.outBack(u);
      let x = T.x + (1 - eb) * 1300, y = TY + Math.sin(t * 1.6 + i * 1.9) * 8 * Math.min(1, u * 2), rot = (1 - eb) * (-.42 + .16 * i) + .014 * Math.sin(t * 1.3 + i), sc = 1, alpha = 1, glow = 0;
      const bounce = kick(t, 25.43 + i * .05, .08) + kick(t, T.hv, .07, 22, 6);
      const hv = t > 25.4 && t < 26.05 ? 1 - sm(120, 340, Math.hypot(tip[0] - x, (tip[1] - y) * .7)) : 0;
      sc += bounce + .05 * hv; glow = hv * .8; rot += .02 * hv * Math.sin(t * 12);
      if (t >= 26.05 - .001) {
        if (i === CHOSEN) {
          const p = ease.inOut(inv(26.09, T_BURST, t)); x = lerp(x, CX, p); y = lerp(y, 460, p);
          sc = 1 + .32 * p + .12 * Math.sin(Math.min(1, (t - 26.05) / .26) * Math.PI) - .1 * pulse(t, 26.05, 26.12) ; rot *= 1 - p; glow = 1;
          if (t > T_BURST + .08) alpha = 1 - sm(T_BURST + .08, T_BURST + .2, t);
        } else {
          const u2 = clamp((t - 26.08) / .34), dir = Math.sign(T.x - cxr);
          x += dir * 1500 * ease.in(u2); y -= 120 * u2; rot += dir * .7 * u2; sc *= 1 - .45 * u2; alpha = 1 - u2; if (u2 >= 1) return;
        }
      }
      tileDraw(ctx, i, { x, y, rot, sc, alpha, glow }, t);
    });
    // finger
    if (t > 25.2 && t < 26.6) {
      // tap FX under the finger
      finger(ctx, tip[0], tip[1], pressK, 1);
    }
    // tap FX: impact flash, ripple rings, tiny splash
    if (t >= T_TAP) {
      const u = t - T_TAP, tx = 756, ty = 452;
      A.glow(ctx, tx, ty, 420, '#ffffff', (1 - clamp(u / .16)) * .9);
      CL.ring(ctx, tx, ty, 360, clamp(u / .5), '#ffffff', 22); CL.ring(ctx, tx, ty, 520, clamp((u - .06) / .5), C.yellow, 18); CL.ring(ctx, tx, ty, 700, clamp((u - .12) / .5), C.cyan, 14);
      if (u < .4) { ctx.save(); ctx.globalAlpha = 1 - sm(.1, .4, u); CL.splash(ctx, tx, ty, 150, CL.spring(t, T_TAP, .4), 7, [C.yellow, '#fff', C.cyan, C.pink]); ctx.restore(); }
    }
  }

  // ---------------------------------------------------------------- PHASE 2: expanded tile screen (green) + play button
  function expanded(ctx, t) {
    const g = A.linear(ctx, 0, 0, 0, H, [[0, '#B6FF5A'], [.45, '#3DE07A'], [1, '#0E8F63']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(CX, 460); ctx.rotate(t * .25); for (let k = 0; k < 18; k++) { ctx.rotate(TAU / 18); ctx.fillStyle = k % 2 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,0)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-170, -1500); ctx.lineTo(170, -1500); ctx.fill(); } ctx.restore();
    ctx.save(); ctx.globalAlpha = .16; ctx.translate(320, 620); ctx.rotate(t * .3); ball(ctx, 420, 0); ctx.restore();
    ctx.save(); ctx.globalAlpha = .16; ctx.translate(1620, 300); ctx.rotate(-t * .25); ball(ctx, 300, 0); ctx.restore();
    CL.twinkle(ctx, t, 0, 0, W, H, 24, 11, ['#fff', C.yellow, '#fff', C.cyan]);
    // pulsing play button (beats on "ומתחילים")
    const k = 1 + kick(t, 26.34, .18, 18, 6) + kick(t, 26.56, .12, 18, 6) + kick(t, 26.76, .12, 18, 6) + .03 * Math.sin(t * 5);
    const born = CL.pop(t, T_BURST + .06, .3), burst = t > T_PLAY - .02 ? 1 + 1.6 * ease.in(inv(T_PLAY - .02, T_PLAY + .1, t)) : 1;
    if (born > 0) {
      ctx.save(); ctx.translate(CX, 460); ctx.scale(k * born * burst, k * born * burst); ctx.globalAlpha *= 1 - sm(T_PLAY, T_PLAY + .12, t);
      [[26.34, 0], [26.56, 1], [26.76, 2]].forEach(([tt]) => { const p = clamp((t - tt) / .55); if (p > 0 && p < 1) { ctx.save(); ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = '#fff'; ctx.lineWidth = 14 * (1 - p * .6); ctx.beginPath(); ctx.arc(0, 0, 200 + 260 * ease.out(p), 0, TAU); ctx.stroke(); ctx.restore(); } });
      ctx.fillStyle = 'rgba(2,40,30,.35)'; ctx.beginPath(); ctx.arc(10, 22, 210, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 210, 0, TAU); ctx.fillStyle = A.linear(ctx, 0, -210, 0, 210, [[0, '#ffffff'], [.6, '#ffffff'], [1, '#c6d0ff']]); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-50, -130, 110, 40, -.35, 0, TAU); ctx.fill();
      ctx.fillStyle = C.pink; ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-66, -104); ctx.lineTo(-66, 104); ctx.lineTo(112, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(-50, -80); ctx.lineTo(-50, -20); ctx.lineTo(0, -50); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- PHASE 3: full-screen playback (a match)
  function person(g, x, y, s, col, ph, face) {
    g.save(); g.translate(x, y); g.scale(s * face, s); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = C.ink; g.lineWidth = 8;
    const sw = Math.sin(ph) * 26; g.fillStyle = '#FFD8B8';
    [[-16, sw], [16, -sw]].forEach(([lx, d]) => { g.fillStyle = '#F5F7FF'; g.beginPath(); g.roundRect(lx - 11 + d * .4, 40, 24, 70, 12); g.fill(); g.stroke(); g.fillStyle = C.ink; g.beginPath(); g.ellipse(lx + 8 + d * .5, 114, 22, 11, 0, 0, TAU); g.fill(); });
    g.fillStyle = col; g.beginPath(); g.roundRect(-34, -50, 68, 100, 26); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.roundRect(-24, -44, 16, 60, 8); g.fill();
    g.fillStyle = '#FFD8B8'; g.beginPath(); g.arc(4, -84, 30, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 16; g.beginPath(); g.moveTo(30, -30); g.lineTo(60, -50 + Math.sin(ph + 1) * 18); g.stroke();
    g.restore();
  }
  function match(ctx, t) {
    const tt = t - T_PLAY, hz = 330, GT = 27.20;
    // sky + stands
    ctx.fillStyle = A.linear(ctx, 0, 0, 0, hz, [[0, '#050826'], [1, '#3A1B9A']]); ctx.fillRect(0, 0, W, hz + 4);
    ctx.fillStyle = '#12185E'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(W, 120); ctx.lineTo(W, hz + 4); ctx.lineTo(0, hz + 4); ctx.fill();
    for (let r = 0; r < 4; r++) for (let i = 0; i < 90; i++) { const x = (i + .5) * (W / 90) + (r % 2) * 10, y = 180 + r * 40 + hash(i * 3 + r) * 12 - 20 + (r * 6), on = .5 + .5 * Math.sin(t * (3 + hash(i + r) * 4) + i * 1.7 + r); ctx.fillStyle = CL.CAND[(i * 3 + r) % 8]; ctx.globalAlpha = .35 + .5 * on * (.4 + goalK(t)); ctx.beginPath(); ctx.arc(x, y, 8 + r * 2, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    // floodlights
    [[120, 70], [W - 120, 70], [560, 60], [W - 560, 60]].forEach(([x, y], i) => { A.glow(ctx, x, y, 520, i < 2 ? '#fff6c8' : '#bfe8ff', .55 + .25 * Math.sin(t * 9 + i * 2)); CL.spark(ctx, x, y, 90 + 30 * Math.sin(t * 7 + i), t * .6, '#fff'); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; [[120, 1], [W - 120, -1]].forEach(([x, d]) => { ctx.fillStyle = A.linear(ctx, x, 70, x + d * 700, 800, [[0, 'rgba(255,246,200,.28)'], [1, 'rgba(255,246,200,0)']]); ctx.beginPath(); ctx.moveTo(x - 30, 70); ctx.lineTo(x + 30, 70); ctx.lineTo(x + d * 1100, 900); ctx.lineTo(x + d * 300, 900); ctx.fill(); }); ctx.restore();
    // pitch: perspective stripes
    ctx.fillStyle = '#0E7A4E'; ctx.fillRect(0, hz, W, H - hz);
    const N = 9, off = (tt * .8) % 2, yOf = d => hz + (H + 500 - hz) * Math.pow(Math.max(0, d), 1.8);
    for (let k = -2; k < N; k++) { const d0 = (k + off) / N, d1 = (k + 1 + off) / N; if (d1 <= 0 || d0 >= 1) continue; const y0 = yOf(clamp(d0)), y1 = yOf(clamp(d1)); ctx.fillStyle = ((k % 2) + 2) % 2 ? '#22E08A' : '#16BC78'; ctx.fillRect(0, y0, W, y1 - y0 + 1); }
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(520, hz); ctx.lineTo(-1300, H); ctx.moveTo(W - 520, hz); ctx.lineTo(W + 1300, H); ctx.moveTo(520, hz); ctx.lineTo(W - 520, hz); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(CX, hz + 130, 300, 46, 0, 0, TAU); ctx.stroke();
    // goal + net
    const gx = CX, gy = hz + 18, gw = 300, gh = 120, bulge = kick(t, GT, 22, 24, 6);
    ctx.save(); ctx.fillStyle = 'rgba(2,10,40,.55)'; ctx.fillRect(gx - gw / 2, gy - gh, gw, gh); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; for (let i = 1; i < 12; i++) { ctx.beginPath(); ctx.moveTo(gx - gw / 2 + i * gw / 12 + bulge, gy - gh); ctx.lineTo(gx - gw / 2 + i * gw / 12 - bulge, gy); ctx.stroke(); } for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(gx - gw / 2, gy - gh + i * gh / 6 + bulge); ctx.lineTo(gx + gw / 2, gy - gh + i * gh / 6 - bulge); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(gx - gw / 2, gy); ctx.lineTo(gx - gw / 2, gy - gh); ctx.lineTo(gx + gw / 2, gy - gh); ctx.lineTo(gx + gw / 2, gy); ctx.stroke(); ctx.restore();
    // players
    person(ctx, gx + 40 + Math.sin(t * 6) * 20, gy + 8, .55, C.orange, t * 12, -1);
    person(ctx, 640 + tt * 120, 640, .95, C.pink, t * 15, 1); person(ctx, 1500 - tt * 140, 720, 1.1, C.cyan, t * 14 + 1, -1); person(ctx, 1240, 560, .75, C.pink, t * 13 + 2, -1); person(ctx, 420, 520, .7, C.cyan, t * 13 + 4, 1);
    // ball: shot from the foreground into the top corner of the goal
    const b0 = .06, b1 = GT - T_PLAY;
    if (tt > b0 && tt < b1 + .02) {
      const u = clamp((tt - b0) / (b1 - b0)), e = ease.inOut(u) * .35 + u * .65;
      for (let k = 6; k >= 0; k--) { const uu = clamp(u - k * .05), ee = ease.inOut(uu) * .35 + uu * .65, x = lerp(1250, gx + 40, ee), y = lerp(900, gy - 60, ee) - 210 * Math.sin(uu * Math.PI), r = lerp(58, 15, ee); ctx.save(); ctx.globalAlpha = .12 * (1 - k / 7) * 2; ctx.translate(x, y); ball(ctx, r, 0); ctx.restore(); }
      const x = lerp(1250, gx + 40, e), y = lerp(900, gy - 60, e) - 210 * Math.sin(u * Math.PI), r = lerp(58, 15, e); ctx.save(); ctx.translate(x, y); ball(ctx, r, t * 20); ctx.restore();
    }
    // GOAL burst
    if (t >= GT) {
      const u = t - GT; ctx.save(); ctx.globalAlpha = .7 * (1 - sm(.03, .2, u)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - sm(.1, .32, u); CL.splash(ctx, gx, gy - 60, 640, CL.spring(t, GT, .45), 3, [C.yellow, C.pink, C.cyan, C.lime, C.orange]); ctx.restore();
      const gs = CL.pop(t, GT + .02, .22); if (gs > 0) CL.title(ctx, 'גול!', CX, 560, { size: 330, scale: gs, rot: -.05, fill: ['#ffffff', '#FFD23F'], dir: 'rtl' });
    }
    // HUD: LIVE badge + score
    const lb = CL.pop(t, T_PLAY + .1, .25); if (lb > 0) { ctx.save(); ctx.translate(150, 74); ctx.scale(lb, lb); ctx.fillStyle = C.red; ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-96, -34, 192, 68, 34); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-54, 0, 12 + 3 * Math.sin(t * 9), 0, TAU); ctx.fill(); ctx.font = '900 40px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText('LIVE', 18, 3); ctx.restore(); }
    const sc = CL.pop(t, T_PLAY + .15, .25); if (sc > 0) CL.chip(ctx, t >= GT ? '1 : 0' : '0 : 0', CX + 620, 74, { size: 56, dir: 'ltr', fill: t >= GT ? C.yellow : '#fff', scale: sc * (1 + kick(t, GT, .25, 20, 7)) });
  }
  const goalK = t => Math.max(0, 1 - (t - 27.20) / .4) * (t >= 27.2 ? 1 : 0);

  // ---------------------------------------------------------------- PHASE 1..3 composer
  function pickPhase(ctx, t) {
    CL.bg(ctx, t, { tint: [C.blue, C.purple, C.pink], speed: .3 });
    bgLife(ctx, t);
    ctx.save();
    const sh1 = CL.shake(t, T_TAP, .3, 9), sh2 = CL.shake(t, T_PLAY, .5, 20), sh3 = CL.shake(t, 27.2, .35, 12);
    ctx.translate(sh1[0] + sh2[0] + sh3[0], sh1[1] + sh2[1] + sh3[1]);
    if (t >= T_PLAY) { ctx.translate(CX, H / 2); ctx.scale(1.05 + .05 * inv(T_PLAY, T_IRIS, t), 1.05 + .05 * inv(T_PLAY, T_IRIS, t)); ctx.translate(-CX, -H / 2); }
    if (t < 26.75) tilesLayer(ctx, t);
    if (t >= T_BURST) {
      if (t < 27.3) reveal(ctx, t, CX, 460, T_BURST, .46, 300, 1450, 4, ['#FFD23F', '#FF8A1F', '#FF2E93'], () => expanded(ctx, t));
      if (t >= T_PLAY) {
        reveal(ctx, t, CX, 470, T_PLAY, .38, 0, 1500, 9, [C.cyan, C.purple, C.pink], () => match(ctx, t));
        const u = t - T_PLAY;   // burst: splash, shockwaves, bolts, sparkles, flash
        // CUE 26.94 playback-burst
        ctx.save(); ctx.beginPath(); ctx.rect(-200, -200, W + 400, H + 400); ctx.arc(CX, 470, 300, 0, TAU, true); ctx.clip('evenodd'); ctx.globalAlpha = 1 - sm(.04, .3, u); CL.splash(ctx, CX, 470, 700, CL.spring(t, T_PLAY, .5), 5); ctx.restore();
        CL.ring(ctx, CX, 470, 1100, clamp(u / .55), '#fff', 26); CL.ring(ctx, CX, 470, 800, clamp((u - .08) / .55), C.yellow, 18);
        CL.bolt(ctx, 1500, -60, CX + 40, 460, inv(0, .07, u), 11, { col: C.cyan, lw: 16, alpha: 1 - sm(.12, .4, u) });
        CL.bolt(ctx, 300, 1120, CX - 40, 500, inv(.03, .1, u), 12, { col: C.pink, lw: 14, alpha: 1 - sm(.15, .42, u) });
        for (let i = 0; i < 18; i++) { const a = hash(i * 3.3) * TAU, d = 220 + (650 + 500 * hash(i)) * ease.out(clamp(u / .7)); if (u > 0 && u < .8) CL.spark(ctx, CX + Math.cos(a) * d, 470 + Math.sin(a) * d * .8, (20 + 36 * hash(i + 2)) * (1 - u / .8), u * 6 + i, ['#fff', C.yellow, C.cyan, C.pink][i % 4]); }
        ctx.save(); ctx.globalAlpha = .75 * (1 - clamp(u / .14)); ctx.fillStyle = '#fff'; ctx.fillRect(-40, -40, W + 80, H + 80); ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- END CARD
  const off = document.createElement('canvas'); off.width = 1100; off.height = 1000; const ox = off.getContext('2d');
  const BW = 712, BCY = 455;
  function brandSheen(ctx, cx, cy, sheen) {
    ox.clearRect(0, 0, 1100, 1000); CL.brand(ox, 550, 500, BW, 'full');
    if (sheen > 0 && sheen < 1) { ox.save(); ox.globalCompositeOperation = 'source-atop'; const x = lerp(-300, 1400, ease.inOut(sheen)); ox.fillStyle = A.linear(ox, x - 90, 200, x + 90, 800, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]); ox.fillRect(0, 0, 1100, 1000); ox.restore(); }
    ctx.drawImage(off, cx - 550, cy - 500);
  }
  function endCard(ctx, t) {
    const u = t - SLAM, cy0 = BCY;
    CL.bg(ctx, t, { tint: [C.purple, C.pink, C.cyan], speed: .32 });
    const k = ease.out(inv(0, .5, u));
    // god rays + glow
    if (u > -.05) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.translate(CX, 470); ctx.rotate(t * .07 + u * .3 * Math.exp(-u * 2));
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 1500, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); for (let i = 0; i < 16; i++) { ctx.rotate(TAU / 16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90 - 20 * Math.sin(t * .6 + i), -1600); ctx.lineTo(90 + 20 * Math.sin(t * .6 + i), -1600); ctx.fill(); } ctx.restore();
      const gl = .5 + .12 * Math.sin(t * 1.6); [[C.pink, -230, 40], [C.cyan, 250, 20], [C.purple, 0, -60]].forEach(([c, dx, dy], i) => A.glow(ctx, CX + dx * (1 + .05 * Math.sin(t + i)), 470 + dy, 760, c, gl * k * (i ? .8 : 1)));
    }
    // liquid waves at the bottom
    if (u > .1) { const wk = ease.out(inv(.1, 1.0, u)); [['rgba(139,61,255,.6)', 1000, 0], ['rgba(255,46,147,.55)', 1030, 1.7], ['rgba(25,200,255,.6)', 1058, 3.1]].forEach(([col, by, ph]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H + 10); for (let x = 0; x <= W + 30; x += 30) ctx.lineTo(x, by + (1 - wk) * 160 + Math.sin(x * .006 + t * .9 + ph) * 22 + Math.sin(x * .013 - t * 1.3 + ph) * 9); ctx.lineTo(W, H + 10); ctx.fill(); }); }
    // floating drops (calm life)
    { const dk = sm(SLAM + .3, SLAM + 1.5, t); if (dk > 0) for (let i = 0; i < 18; i++) { const sp = 18 + hash(i * 1.7) * 30, x = hash(i * 9.1) * W + Math.sin(t * .7 + i) * 26, y = ((hash(i * 3.3) * H * 1.2 - t * sp) % (H + 120) + H + 120) % (H + 120) - 60, r = 9 + hash(i * 5.5) * 30; ctx.save(); ctx.globalAlpha = .7 * dk; CL.drop(ctx, x, y, r, CL.CAND[i % 8], t, i); ctx.restore(); } }
    // iris close of the playback onto the navy end world
    if (t < SLAM) {
      const p = inv(T_IRIS, SLAM, t), R = 1300 * (1 - ease.out(p)); const z = 1.10 + .30 * ease.out(p);
      if (R > 2) { ctx.save(); ctx.beginPath(); ctx.arc(CX, H / 2, R, 0, TAU); ctx.clip(); ctx.translate(CX, H / 2); ctx.scale(z, z); ctx.translate(-CX, -H / 2); match(ctx, t); ctx.restore();
        ctx.save(); ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(CX, H / 2, R, 0, TAU); ctx.stroke(); ctx.lineWidth = 60; ctx.globalAlpha = .35; ctx.strokeStyle = C.cyan; ctx.stroke(); ctx.restore(); }
      // CUE 27.42 iris-suck
      A.glow(ctx, CX, 470, 100 + 900 * ease.in(p), '#ffffff', ease.in(p) * .9);
    }
    // ---- the big splash behind the logo + shockwaves  (CUE 27.60 logo-slam)
    if (u >= 0) {
      const sa = lerp(1, .32, sm(.05, 1.4, u));
      ctx.save(); ctx.globalAlpha = sa; CL.splash(ctx, CX, 450, 860, CL.spring(u, 0, .62), 2); ctx.restore();
      ctx.save(); ctx.globalAlpha = sa * .9; CL.splash(ctx, CX, 460, 560, CL.spring(u, .07, .55), 6, [C.cyan, C.yellow, C.pink, C.lime, C.purple]); ctx.restore();
      CL.ring(ctx, CX, 460, 1300, clamp(u / .7), '#fff', 34); CL.ring(ctx, CX, 460, 1000, clamp((u - .08) / .7), C.pink, 26); CL.ring(ctx, CX, 460, 780, clamp((u - .18) / .7), C.cyan, 20);
    }
    // ---- LOGO: slams down from big to 1.0 landing exactly on SLAM, squash rebound, then float + breathe
    {
      const pre = inv(SLAM - .10, SLAM, t); let sx, sy, al = 1;
      if (t < SLAM) { al = clamp((t - (SLAM - .10)) / .04); sx = sy = lerp(2.4, 1, ease.in(pre)); }
      else { const kk = kick(t, SLAM, .13, 22, 5.5); sx = 1 + kk; sy = 1 - kk * 1.15; }
      if (t >= SLAM - .10) {
        const fu = Math.max(0, u), fl = sm(0, .6, fu), dy = Math.sin(fu * 1.7) * 14 * fl, rot = Math.sin(fu * 1.15) * .014 * fl, br = 1 + .012 * Math.sin(fu * 2.1) * fl;
        const per = 2.6, sp = ((fu - .45) % per + per) % per / per; // gentle sheen sweep, first one right after the slam
        ctx.save(); ctx.globalAlpha = al; ctx.translate(CX, cy0 + dy); ctx.rotate(rot); ctx.scale(sx * br, sy * br); brandSheen(ctx, 0, 0, fu > .3 ? sp / .3 : 9); ctx.restore();
      }
    }
    // ---- tagline (pops ~0.5 s later)  CUE 28.10 tagline-pop
    if (t >= T_TAG - .02) {
      const p = CL.pop(t, T_TAG - .02, .36), fu = t - T_TAG, dy = Math.sin(fu * 1.9 + 1) * 6;
      ctx.save(); ctx.translate(CX, 935 + dy); ctx.scale(p, p);
      const cw = { size: 64, fill: '#ffffff', dark: '#bfc9ff', ink: C.ink, dir: 'rtl' };
      const r = CL.chip(ctx, 'העולם של הבידור נפתח בפניכם', 0, 0, cw);
      // sheen across the pill
      const sp = ((fu - .3) % 3.2 + 3.2) % 3.2 / 3.2; if (sp < .35) { const q = sp / .35; ctx.save(); ctx.beginPath(); ctx.roundRect(-r.w / 2, -r.h / 2, r.w, r.h, r.h / 2); ctx.clip(); const x = lerp(-r.w * .7, r.w * .7, ease.inOut(q)); ctx.fillStyle = A.linear(ctx, x - 60, -r.h, x + 60, r.h, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,214,120,.8)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); ctx.restore(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(1 - fu / .5) * .9; CL.ring(ctx, CX, 935, 520, clamp(fu / .5), C.yellow, 12); ctx.restore();
      for (let i = 0; i < 8; i++) if (fu > 0 && fu < .8) { const a = i / 8 * TAU + .3, d = 60 + 380 * ease.out(clamp(fu / .8)); CL.spark(ctx, CX + Math.cos(a) * d * 1.5, 935 + Math.sin(a) * d * .35, 20 * (1 - fu / .8), fu * 5, [C.yellow, '#fff', C.pink, C.cyan][i % 4]); }
    }
    // ---- bolt strike (converging on the TV, in step with the logo's own neon bolt)
    if (t > SLAM - .1 && u < .5) {
      const p = inv(SLAM - .1, SLAM - .02, t), al = t < SLAM ? 1 : (1 - sm(.05, .5, u)) * (.75 + .25 * hash(Math.floor(u * 40)));
      const sd = t < SLAM ? 21 : 21 + (Math.floor(u * 24) % 3);
      CL.bolt(ctx, 1500, -80, 900, 470, p, sd, { col: C.cyan, lw: 22, alpha: al });
      CL.bolt(ctx, 1050, -60, 920, 480, inv(SLAM - .08, SLAM - .01, t), 33, { col: C.pink, lw: 14, alpha: al });
      CL.bolt(ctx, 300, -60, 870, 500, inv(SLAM - .07, SLAM, t), 45, { col: C.yellow, lw: 12, alpha: al * .9 });
    }
    // ---- sparkle rain + calm drifting sparkles
    if (u > 0) {
      for (let i = 0; i < 60; i++) { const t0 = SLAM + hash(i * 3.1) * .8, du = t - t0; if (du < 0) continue; const x = hash(i * 7.7) * W + du * (hash(i) - .5) * 80, y = -60 + du * (520 + hash(i * 2) * 620); if (y > H + 60) continue; CL.spark(ctx, x, y, 10 + hash(i * 5) * 24, du * 3 + i, ['#fff', C.yellow, C.cyan, C.pink][i % 4]); }
      const ik = sm(.5, 1.5, u);
      for (let i = 0; i < 34; i++) { const sp = 16 + hash(i * 1.3) * 40, x = hash(i * 8.3) * W + Math.sin(t * .6 + i * 2) * 40, y = ((hash(i * 2.9) * H * 1.3 + t * sp * .6) % (H + 80) + H + 80) % (H + 80) - 40, tw = .5 + .5 * Math.sin(t * (1.4 + hash(i) * 2.4) + i * 3); ctx.save(); ctx.globalAlpha = ik * (.35 + .65 * tw); CL.spark(ctx, x, y, 8 + hash(i * 6) * 24 * tw, t * .5 + i, ['#fff', C.yellow, C.cyan, C.pink, '#fff'][i % 5]); ctx.restore(); }
    }
    // ---- slam flash
    if (u >= 0 && u < .3) { ctx.save(); ctx.globalAlpha = .9 * (1 - u / .3); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    CL.vignette(ctx, .4);
  }

  A.scene({
    name: 's8_pick_end', start: S0, end: SE,
    draw(ctx, s) {
      const t = s.t;
      // CUE 24.95 wipe-whoosh (liquid wipe covers s7, right to left)
      // CUE 25.08 tiles-glide-in (row of candy tiles: movie, series, football, live)
      // CUE 25.43 tiles-bounce (finger enters, hover pops)
      // CUE 26.05 tap-impact (ripple on the football tile)
      // CUE 26.30 tile-burst-fullscreen (liquid burst, play button pulses)
      // CUE 27.20 goal-burst
      // CUE 27.60 logo-slam
      // CUE 28.10 tagline-pop
      if (t < T_IRIS) wipeIn(ctx, t, () => pickPhase(ctx, t)); else endCard(ctx, t);
    }
  });
})();
