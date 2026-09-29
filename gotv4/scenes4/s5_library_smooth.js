// GOTV v4 ANIME LEGEND: scene 5a (weekly library board) + scene 5b (live wall + speed and smoothness).
// Clock: s.t = VO clock v (frozen in holds; A.H = {u, dur} then). Pure function of t.
(() => {
  const { clamp, lerp, ease, hash, rng, inv } = A;
  const C = V.C, INK = '#0A0A1C', NAVY = '#0A1240';
  const eo = t => ease.out(clamp(t)), eob = t => ease.outBack(clamp(t)), eio = t => ease.inOut(clamp(t)), ein = t => ease.in(clamp(t));
  const JP = '"Unifont JP","Noto Sans CJK JP","Yu Gothic",sans-serif';
  const GOLD = V.GOLD_GRAD;
  const lin = V.lin, rad = V.rad;

  // ---------------- shared anime helpers ----------------
  const halftone = () => A.layer('s5_ht', 1080, 1920, (g) => {
    for (let y = 0; y < 1920; y += 32) for (let x = (y / 32 % 2) * 16; x < 1080; x += 32) {
      const dx = (x - 540) / 540, dy = (y - 960) / 960, d = Math.min(1, Math.sqrt(dx * dx * .8 + dy * dy * .6));
      const r = 1 + 11 * Math.pow(d, 1.6); g.fillStyle = 'rgba(80,150,255,.30)'; g.beginPath(); g.arc(x, y, r, 0, A.TAU); g.fill();
    }
  });
  function speedLines(ctx, cx, cy, t, o = {}) {
    const n = o.n ?? 64, r0 = o.r0 ?? 320, r1 = o.r1 ?? 1700, k = Math.floor(t * (o.fps ?? 15));
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = o.col || '#fff'; ctx.globalAlpha = o.a ?? .3;
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 3.1 + k * 7.7 + (o.seed || 0)), h2 = hash(i * 5.3 + k * 2.1 + (o.seed || 0)), an = (i / n) * A.TAU + (h1 - .5) * .09;
      const ra = r0 * (.8 + h2 * .9), rb = ra + (r1 - r0) * (.35 + h1 * .65), w = (o.w ?? .012) * (.5 + h2);
      ctx.beginPath(); ctx.moveTo(Math.cos(an - w) * rb, Math.sin(an - w) * rb); ctx.lineTo(Math.cos(an + w) * rb, Math.sin(an + w) * rb); ctx.lineTo(Math.cos(an) * ra, Math.sin(an) * ra); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function petals(ctx, t, n = 16, seed = 1, a = .8) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const h = k => hash(i * 7.13 + seed * 31 + k);
      const x = ((h(1) * 1300 - t * (60 + h(2) * 70) + 3000) % 1300) - 100 + Math.sin(t * 1.3 + i) * 40;
      const y = ((h(3) * 2100 + t * (90 + h(4) * 90)) % 2100) - 100, s = 9 + h(5) * 12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + h(6) * 2) + i); ctx.scale(1, .6 + .4 * Math.sin(t * 3 + i)); ctx.globalAlpha = a * (.5 + .5 * h(7));
      ctx.fillStyle = i % 3 ? '#FFB7D5' : '#FFE1EE'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s, -s * .7, s * .8, s * .8, 0, s); ctx.bezierCurveTo(-s * .8, s * .8, -s, -s * .7, 0, -s); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  // ink-outlined gradient text with pop/rotation
  function inkText(ctx, s, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.sc != null) ctx.scale(o.sc, o.scy ?? o.sc); ctx.globalAlpha *= o.alpha ?? 1;
    V.text(ctx, s, 0, 0, size, { grad: o.grad === undefined ? GOLD : o.grad, fill: o.fill, stroke: INK, sw: size * (o.sw ?? .17), shadow: false, weight: o.weight || 900, font: o.font, dir: o.dir || 'rtl', align: o.align });
    ctx.restore();
  }
  const slamSc = (u, from = 2.4) => u < 0 ? 0 : lerp(from, 1, eob(u / 0.22));
  function impact(ctx, t, t0, fr = 2) { if (t >= t0 && t < t0 + fr / 30) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); } }
  function kana(ctx, s, x, y, size, rot, col, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.font = `900 ${size}px ${JP}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = size * .2; ctx.strokeStyle = INK; ctx.strokeText(s, 0, 0); ctx.lineWidth = size * .09; ctx.strokeStyle = '#fff'; ctx.strokeText(s, 0, 0); ctx.fillStyle = col; ctx.fillText(s, 0, 0); ctx.restore();
  }
  const star = (ctx, x, y, r, r2, n, rot = 0) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r2 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };
  const twinkle = (ctx, x, y, r, t, seed, col = '#fff') => { const p = .5 + .5 * Math.sin(t * 6 + seed * 3); V.sparkle(ctx, x, y, r * (.4 + .6 * p), col, Math.PI / 8, .5 + .5 * p); };

  // ============================================================================
  //                       SCENE A : THE WEEKLY LIBRARY
  // ============================================================================
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const HT = [16.70, 17.12, 17.37, 17.58, 17.74, 17.95, 18.15];
  const DCOL = ['#FF4F9A', '#FF8A3D', '#FFC24A', '#3DDC84', '#38D9F5', '#2F6BFF', '#8A5BFF'];
  const CNT = [12, 9, 14, 11, 8, 16, 10];
  const BLOGOS = ['netflix', 'disney', 'prime', 'appletv', 'hbo', 'hulu', 'paramount', 'discovery', 'espn'];
  const PAL = [['#FF4F9A', '#5B2BFF', '#FFE9A8'], ['#FF8A3D', '#B0143C', '#FFF3C4'], ['#38D9F5', '#2F3BFF', '#FFFFFF'], ['#3DDC84', '#0B6E7A', '#FFF3C4'], ['#FFC24A', '#E4462A', '#FFFFFF'], ['#8A5BFF', '#141C6B', '#5AD1FF'], ['#FF4F9A', '#FF8A3D', '#FFFFFF'], ['#5AD1FF', '#8A5BFF', '#FFE9A8']];
  const RW = 980, RH = 102, PITCH = 114, BY = 372, PW = 68, PH = 88;

  function poster(seed) {
    return A.layer('s5_poster' + seed, 136, 176, (g) => {
      g.scale(2, 2);
      const r = rng(seed * 13 + 5), P = PAL[seed % PAL.length], w = 68, h = 88;
      g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 7); g.clip();
      g.fillStyle = lin(g, 0, 0, w * .4, h, [[0, P[0]], [1, P[1]]]); g.fillRect(0, 0, w, h);
      const type = seed % 4;
      if (type === 0) { // hero + sun
        g.fillStyle = P[2]; g.beginPath(); g.arc(w * .5, h * .42, 20, 0, A.TAU); g.fill();
        g.fillStyle = '#12082e'; g.beginPath(); g.arc(w * .5, h * .56, 8, 0, A.TAU); g.fill(); g.beginPath(); g.moveTo(w * .22, h); g.quadraticCurveTo(w * .5, h * .5, w * .78, h); g.fill();
        g.strokeStyle = P[2]; g.lineWidth = 1.5; g.stroke();
      } else if (type === 1) { // neon skyline
        g.fillStyle = P[2]; g.globalAlpha = .9; g.beginPath(); g.arc(w * .7, h * .28, 11, 0, A.TAU); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#12082e'; for (let i = 0; i < 7; i++) { const bw = 8 + r() * 6, bh = 20 + r() * 34; g.fillRect(i * 10 - 2, h - bh, bw, bh); }
        g.fillStyle = P[2]; for (let i = 0; i < 14; i++) g.fillRect(r() * w, h - r() * 40 - 4, 2, 2);
      } else if (type === 2) { // two faces
        g.fillStyle = '#12082e'; g.beginPath(); g.arc(w * .34, h * .46, 12, 0, A.TAU); g.fill(); g.beginPath(); g.arc(w * .66, h * .5, 12, 0, A.TAU); g.fill();
        g.fillStyle = P[2]; g.beginPath(); g.moveTo(w * .5, h * .34); g.bezierCurveTo(w * .34, h * .16, w * .2, h * .3, w * .5, h * .42); g.bezierCurveTo(w * .8, h * .3, w * .66, h * .16, w * .5, h * .34); g.fill();
        g.fillRect(0, h * .72, w, h * .3);
      } else { // starburst
        g.fillStyle = P[2]; g.globalAlpha = .9; star(g, w * .5, h * .42, 26, 9, 9, .3); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#12082e'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * .35, h * .62); g.lineTo(w * .65, h * .7); g.lineTo(w, h); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .55, 0); g.lineTo(0, h * .5); g.fill();  // gloss
      g.fillStyle = 'rgba(8,4,30,.75)'; g.fillRect(0, h - 15, w, 15); g.fillStyle = '#fff'; g.globalAlpha = .9; g.fillRect(8, h - 10, 26 + r() * 20, 3); g.globalAlpha = .5; g.fillRect(8, h - 5, 16, 2);
      g.restore(); g.lineWidth = 2.6; g.strokeStyle = INK; g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, 7); g.stroke();
    });
  }

  function drawRow(ctx, i, v, k) {
    const u = v - HT[i], col = DCOL[i], dir = i % 2 ? -1 : 1;
    // slot (ghost) state
    if (u < 0) {
      const pa = clamp((v - 16.72) / .18);
      ctx.save(); ctx.globalAlpha = .55 * pa; ctx.setLineDash([16, 10]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(160,200,255,.6)'; A.rrect(ctx, 0, 0, RW, RH, 16); ctx.fillStyle = 'rgba(10,20,80,.5)'; ctx.fill(); ctx.stroke(); ctx.restore();
      return;
    }
    const xo = dir * 300 * (1 - eo(u / .17)), al = clamp(u / .05);
    ctx.save(); ctx.translate(xo, 0); ctx.globalAlpha = al;
    // strip body
    ctx.save(); ctx.shadowColor = 'rgba(0,0,30,.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; A.rrect(ctx, 0, 0, RW, RH, 16); ctx.fillStyle = lin(ctx, 0, 0, RW, 0, [[0, '#0E1C78'], [1, '#1B2FB0']]); ctx.fill(); ctx.restore();
    ctx.save(); A.rrect(ctx, 0, 0, RW, RH, 16); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, 0, RW, 30);
    ctx.fillStyle = V.hexA(col, .16); for (let x = 12; x < RW; x += 22) { ctx.beginPath(); ctx.arc(x, RH - 10 + (x / 22 % 2) * 8, 4, 0, A.TAU); ctx.fill(); }
    // white burst flash at hit
    if (u < .22) { ctx.fillStyle = `rgba(255,255,255,${.85 * (1 - u / .22)})`; ctx.fillRect(0, 0, RW, RH); }
    ctx.restore();
    A.rrect(ctx, 0, 0, RW, RH, 16); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); A.rrect(ctx, 3, 3, RW - 6, RH - 6, 14); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    // day label parallelogram (right)
    ctx.save(); ctx.beginPath(); ctx.moveTo(RW - 205, 0); ctx.lineTo(RW, 0); ctx.lineTo(RW, RH); ctx.lineTo(RW - 235, RH); ctx.closePath();
    const ds = 1 + .12 * Math.max(0, 1 - u / .3) * Math.sin(u * 40);
    ctx.fillStyle = lin(ctx, 0, 0, 0, RH, [[0, V.hexA(col, 1)], [1, A.mixc(col, '#000000', .35)]]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(RW - 235, 0, 235, 32);
    ctx.restore();
    inkText(ctx, DAYS[i], RW - 100, RH / 2 + 2, DAYS[i].length > 4 ? 52 : 60, { grad: [[0, '#fff'], [1, '#fff']], sw: .2, sc: ds });
    // posters
    for (let p = 0; p < 7; p++) {
      const pu = (u - .05 - p * .035) / .2; if (pu <= 0) continue;
      const sc = eob(pu), px = RW - 238 - 34 - p * (PW + 8), bob = k ? Math.sin(v * 5 + p + i) * 3 * k : 0;
      ctx.save(); ctx.translate(px, RH / 2 + bob); ctx.scale(sc, sc);
      ctx.shadowColor = 'rgba(0,0,30,.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; ctx.drawImage(poster(i * 7 + p), -PW / 2, -PH / 2, PW, PH); ctx.shadowColor = 'transparent';
      // logo badge
      const lg = BLOGOS[(i * 3 + p * 2) % BLOGOS.length];
      ctx.translate(-PW / 2 + 22, PH / 2 - 8); A.rrect(ctx, -22, -11, 44, 22, 8); ctx.fillStyle = 'rgba(10,18,64,.94)'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#fff'; ctx.stroke();
      V.drawLogo(ctx, lg, 0, 0, 36, 15, { shadow: false });
      ctx.restore();
    }
    // NEW counter (left)
    const cu = u - .1, n = Math.round(CNT[i] * eo(cu / .4));
    ctx.save(); ctx.translate(112, RH / 2);
    ctx.fillStyle = '#FF3B4A'; star(ctx, 0, 0, 74, 52, 14, .1 + u * .0); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.scale(.8, .55); ctx.fillStyle = 'rgba(255,255,255,.28)'; star(ctx, 0, -20, 74, 60, 14, .1); ctx.restore();
    if (cu > 0) { const sc = slamSc(cu, 1.8); ctx.save(); ctx.rotate(-.1); ctx.scale(sc, sc);
      inkText(ctx, 'חדש!', 0, -16, 40, { grad: [[0, '#fff'], [1, '#FFF3C4']], sw: .2 }); inkText(ctx, '+' + n, 0, 23, 42, { grad: GOLD, sw: .2, font: 'Rubik', dir: 'ltr' }); ctx.restore(); }
    ctx.restore();
    // shine sweep during hold
    if (k) {
      const H = A.H, ph = ((H.u / H.dur) * 1.6 - .3 + i * .08); ctx.save(); A.rrect(ctx, 0, 0, RW, RH, 16); ctx.clip(); ctx.globalAlpha = .5 * k; ctx.fillStyle = lin(ctx, ph * RW - 120, 0, ph * RW + 120, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.moveTo(ph * RW - 60, 0); ctx.lineTo(ph * RW + 120, 0); ctx.lineTo(ph * RW + 60, RH); ctx.lineTo(ph * RW - 120, RH); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // hit burst lines behind (drawn after, additive, short)
    if (u < .3) { ctx.save(); ctx.globalAlpha = 1 - u / .3; speedLines(ctx, RW / 2, RH / 2, v, { n: 26, r0: 200, r1: 700, a: .5, w: .02, col: col, seed: i * 9, fps: 30 }); ctx.restore(); }
  }

  function sceneA(ctx, s) {
    const v = s.t, lt = v - 15.81, H = A.H, k = H ? Math.sin(Math.PI * H.u / H.dur) : 0, hu = H ? H.u : 0;
    const tt = v + hu * .4;
    const drawWorld = () => {
      // BACKGROUND
      ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, '#101C78'], [.45, NAVY], [1, '#060A26']]); ctx.fillRect(0, 0, 1080, 1920);
      V.glow(ctx, 540, 760, 1000, '#2F6BFF', .5); V.glow(ctx, 900, 200, 600, '#FF4F9A', .25); V.glow(ctx, 140, 1500, 700, '#FFC24A', .22);
      ctx.drawImage(halftone(), 0, 0);
      speedLines(ctx, 540, 770, tt, { n: 70, r0: 480, r1: 1800, a: .12 + .05 * k, col: '#9FD0FF' });
      petals(ctx, tt, 18, 3, .85);
      // giant faint katakana
      ctx.save(); ctx.globalAlpha = .1; kana(ctx, 'ドドドド', 540, 1400, 260, -.06, '#fff'); ctx.restore();
      // camera on board
      const focus = clamp((v - 16.7) / .1) * (1 - eio(inv(18.3, 18.62, v)));
      let ay = 758; for (let i = 0; i < 7; i++) if (v >= HT[i] - .02) ay = BY + i * PITCH + RH / 2;
      const camY = lerp(760, lerp(760, ay, .55), focus), zoom = lerp(1, 1.1, focus) + .012 * k * Math.sin(H ? H.u * 3 : 0);
      ctx.save(); A.camera(ctx, { x: 540, y: camY, zoom, rot: lerp(0, -.02, focus), shake: 0, t: v });
      // board: slanted manga panel
      const bu = v - 16.70, bs = bu < 0 ? 0 : eob(bu / .2);
      if (bu >= -.05) {
        ctx.save(); ctx.translate(540, BY + 3 * PITCH + RH / 2); ctx.rotate(-.038); ctx.scale(bs, bs); ctx.translate(-540, -(BY + 3 * PITCH + RH / 2));
        // panel plate
        ctx.save(); A.rrect(ctx, 30, BY - 28, 1020, 6 * PITCH + RH + 56, 28); ctx.fillStyle = 'rgba(6,10,50,.78)'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke(); A.rrect(ctx, 38, BY - 20, 1004, 6 * PITCH + RH + 40, 22); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
        for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(50, BY + i * PITCH); drawRow(ctx, i, v, k); ctx.restore(); }
        ctx.restore();
      }
      // HEADER
      const hu1 = v - 16.70;
      if (hu1 >= 0) {
        const mw = (str, sz) => { ctx.save(); ctx.font = `900 ${sz}px Rubik`; ctx.direction = 'rtl'; const w = ctx.measureText(str).width; ctx.restore(); return w; };
        // line 1: הספרייה מתעדכנת (words hit 16.70 / 17.12)
        const sz1 = 84, w1 = mw('הספרייה', sz1), w2 = mw('מתעדכנת', sz1), gap = 30, tot = w1 + w2 + gap, xr = 540 + tot / 2;
        const u1 = v - 16.70, u2 = v - 17.12;
        inkText(ctx, 'הספרייה', xr - w1 / 2, 196, sz1, { sc: slamSc(u1, 2), grad: [[0, '#fff'], [1, '#C9D8FF']], rot: -.02 });
        if (u2 > -.01) inkText(ctx, 'מתעדכנת', xr - w1 - gap - w2 / 2, 196, sz1, { sc: slamSc(u2, 2), grad: GOLD, rot: -.02 });
        // line 2: לאורך כל השבוע
        const sz2 = 108, ws = ['לאורך', 'כל', 'השבוע'].map(w => mw(w, sz2)), g2 = 28, t2 = ws[0] + ws[1] + ws[2] + g2 * 2, x2 = 540 + t2 / 2;
        const T2 = [17.58, 17.95, 18.15]; let cx = x2;
        ['לאורך', 'כל', 'השבוע'].forEach((w, j) => { const uu = v - T2[j], c = cx - ws[j] / 2; cx -= ws[j] + g2; if (uu >= 0) inkText(ctx, w, c, 296, sz2, { sc: slamSc(uu, 2.2), rot: -.02, grad: j === 2 ? [[0, '#fff'], [.5, '#FFF3C4'], [1, '#FFC24A']] : GOLD }); });
      }
      ctx.restore();
      // ドン hits
      const dk = [[16.10, 'ドン', 300, 830, -.2], [16.70, 'ズバッ', 170, 520, .15], [18.15, 'ドン', 850, 1130, .12]];
      dk.forEach(([tt0, txt, x, y, r]) => { const uu = v - tt0; if (uu >= 0 && uu < .38) kana(ctx, txt, x, y, 118 * slamSc(uu, 1.6), r, '#FFD84A', 1 - inv(.22, .38, uu)); });
      // sparkles on hits
      HT.forEach((h0, i) => { const uu = v - h0; if (uu >= 0 && uu < .5) { const a = 1 - uu / .5, y = 60 + BY + i * PITCH; for (let q = 0; q < 4; q++) V.sparkle(ctx, 540 + (hash(i * 4 + q) - .5) * 900, y + (hash(i + q * 9) - .5) * 90 - uu * 40, 26 + hash(q + i) * 26, q % 2 ? '#fff' : '#FFE9A8', uu * 3 + q, a); } });
      // "והכי חשוב" opener (over iris)
      if (v < 16.72) {
        const ua = v - 15.80, ub = v - 16.09, fo = 1 - ein(inv(16.60, 16.72, v));
        ctx.save(); ctx.globalAlpha = fo;
        speedLines(ctx, 540, 820, v, { n: 60, r0: 200, r1: 1500, a: .5, col: '#fff', fps: 30 });
        inkText(ctx, 'והכי', 780, 760, 190, { sc: slamSc(ua, 2.4), rot: -.06 });
        if (ub >= 0) inkText(ctx, 'חשוב', 350, 940, 210, { sc: slamSc(ub, 2.4), rot: .05, grad: [[0, '#fff'], [.5, '#FFF3C4'], [1, '#FFC24A']] });
        if (ub >= 0 && ub < .5) { ctx.save(); ctx.translate(900, 900); ctx.rotate(.3); const sc = slamSc(ub, 2); ctx.scale(sc, sc); inkText(ctx, '!', 0, 0, 200, { grad: [[0, '#FF6B7A'], [1, '#FF3B4A']] }); ctx.restore(); }
        ctx.restore();
      }
      // hold ambient sparkles
      if (k) for (let q = 0; q < 10; q++) twinkle(ctx, 80 + hash(q * 2) * 920, 400 + hash(q * 3 + 1) * 780, 34, v + hu * .5, q);
    };
    // ENTRY: iris from the navy radial-streak end of previous scene
    if (lt < .34) {
      ctx.fillStyle = NAVY; ctx.fillRect(0, 0, 1080, 1920);
      const fade = 1 - eio(lt / .25); ctx.save(); ctx.globalAlpha = fade; speedLines(ctx, 540, 960, lt, { n: 90, r0: 150, r1: 1600, a: .6, col: '#B8DAFF', fps: 30, w: .016 }); ctx.restore();
      const R = 1350 * eo(lt / .30);
      ctx.save(); ctx.beginPath(); ctx.arc(540, 900, R, 0, A.TAU); ctx.clip(); drawWorld(); ctx.restore();
      if (R < 1300) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 60; ctx.strokeStyle = 'rgba(190,225,255,.8)'; ctx.beginPath(); ctx.arc(540, 900, R, 0, A.TAU); ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
    } else drawWorld();
    impact(ctx, v, 16.70, 2); impact(ctx, v, 18.15, 2);
    V.flash(ctx, v, 16.06, .12, '#fff', .5);
  }
  A.scene({ name: 's5a_library', start: 15.81, end: 19.11, draw: sceneA });

  // ============================================================================
  //                       SCENE B : LIVE WALL + SPEED AND SMOOTHNESS
  // ============================================================================
  const CH = ['kan11', 'keshet12', 'reshet13', 'ch14', 'i24', 'sport5', 'sport1', 'sport2', 'sport3', 'sport4', 'one', 'ch9'];
  const SW = 280, SH = 176, FOV = 1500, WCY = 640;
  const scr = (name, on) => A.layer('s5_scr_' + name + on, 360, 226, (g) => {
    g.beginPath(); g.roundRect(0, 0, 360, 226, 22); g.clip();
    if (!on) {
      g.fillStyle = lin(g, 0, 0, 0, 226, [[0, '#111a55'], [1, '#050a2a']]); g.fillRect(0, 0, 360, 226);
      const r = rng(name.length * 7 + 3); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,190,255,${.05 + r() * .18})`; g.fillRect(r() * 360, r() * 226, 10 + r() * 30, 2); }
    } else {
      g.fillStyle = lin(g, 0, 0, 360, 226, [[0, '#2A55FF'], [1, '#0B1450']]); g.fillRect(0, 0, 360, 226);
      g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < 226; y += 6) g.fillRect(0, y, 360, 2);
      const dk = ['kan11','i24','sport5'].includes(name); g.beginPath(); g.roundRect(28, 28, 304, 170, 18); g.fillStyle = dk ? 'rgba(12,20,70,.97)' : 'rgba(244,248,255,.96)'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
      const im = V.logoImg(name); if (im) { const sc = Math.min(250 / im.width, 120 / im.height); g.drawImage(im, 180 - im.width * sc / 2, 113 - im.height * sc / 2, im.width * sc, im.height * sc); }
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(200, 0); g.lineTo(0, 120); g.fill();
    }
    g.restore && 0;
  });
  const cardPt = (cx, cy, w, h, ry, rx, fov, u, v) => {
    let x = (u - .5) * w, y = (v - .5) * h, z = 0; const x1 = x * Math.cos(ry), z1 = -x * Math.sin(ry); x = x1; z = z1;
    const y1 = y * Math.cos(rx) - z * Math.sin(rx), z2 = y * Math.sin(rx) + z * Math.cos(rx); y = y1; z = z2; const k = fov / (fov + z); return [cx + x * k, cy + y * k];
  };

  function wall(ctx, v, opt) {
    const { yaw, sc, rotX, dolly } = opt, order = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) order.push({ r, c, id: r * 3 + c });
    const items = order.map(o => {
      const X0 = (o.c - 1) * 320, Y0 = (o.r - 1.5) * 206, Z0 = -Math.abs(o.c - 1) * 120 + (o.r - 1.5) * 0;
      const X = X0 * Math.cos(yaw) + Z0 * Math.sin(yaw), Z = -X0 * Math.sin(yaw) + Z0 * Math.cos(yaw) + dolly, k = FOV / (FOV + Z);
      return { ...o, cx: 540 + X * k * sc, cy: WCY + Y0 * k * sc, k, ry: -(o.c - 1) * .3 + yaw, Z };
    }).sort((a, b) => b.Z - a.Z);
    for (const it of items) {
      const d = Math.hypot(it.c - 1, it.r - 1.5), pu = (v - (20.78 + d * .045)) / .26; if (pu <= 0) continue;
      const s = eob(pu) * it.k * sc, w = SW * s, h = SH * s, on = v >= 21.06 + it.id * .006 ? 1 : 0, ry = it.ry + (1 - eo(pu)) * 1.2;
      const glow = on ? 1 : 0.3;
      V.glow(ctx, it.cx, it.cy, 260 * s, on ? '#38D9F5' : '#2F6BFF', .25 * glow * clamp(pu));
      V.card3d(ctx, scr(CH[it.id], on), it.cx, it.cy, w, h, ry, rotX, FOV, 5, 4);
      const P = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, vv]) => cardPt(it.cx, it.cy, w, h, ry, rotX, FOV, u, vv));
      ctx.save(); ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,230,255,.8)'; ctx.stroke();
      // power-on flash
      const fu = (v - (21.06 + it.id * .006)) / .18; if (fu > 0 && fu < 1) { ctx.globalAlpha = (1 - fu) * .9; ctx.fillStyle = '#fff'; ctx.fill(); }
      ctx.restore();
      // LIVE badge
      const lu = (v - (21.47 + d * .012)) / .2;
      if (lu > 0) { const bp = cardPt(it.cx, it.cy, w, h, ry, rotX, FOV, .2, .13), bs = eob(lu) * s * 1.05; ctx.save(); ctx.translate(bp[0], bp[1]); ctx.rotate(-.06); ctx.scale(bs, bs);
        A.rrect(ctx, -46, -16, 92, 32, 10); ctx.fillStyle = '#FF2B3D'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); A.rrect(ctx, -42, -13, 84, 12, 6); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-26, 0, 6 + 2 * Math.sin(v * 9 + it.id), 0, A.TAU); ctx.fill(); A.text(ctx, 'LIVE', 12, 1, { font: '900 22px Rubik', fill: '#fff' }); ctx.restore(); }
    }
  }

  function ribbons(ctx, v, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cols = ['#38D9F5', '#FFFFFF', '#FFC24A', '#5AD1FF', '#8A5BFF', '#FF4F9A'];
    for (let r = 0; r < 6; r++) {
      const y0 = 470 + r * 96, amp = 60 + r * 8, ph = v * (2 + r * .3) + r * 1.4, wd = 26 - r * 2, pu = clamp((v - (22.25 + r * .03)) / .3);
      ctx.beginPath();
      for (let x = 1080 + 60; x >= -60 - (0); x -= 24) { const xn = 1 - (x + 60) / 1200; if (xn > pu) continue; const y = y0 + Math.sin(x * .006 + ph) * amp + Math.sin(x * .015 - ph * 1.3) * 16; x === 1140 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = V.hexA(cols[r], .16 * a); ctx.lineWidth = wd * 2.6; ctx.stroke(); ctx.strokeStyle = V.hexA(cols[r], .55 * a); ctx.lineWidth = wd; ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${.6 * a})`; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.restore();
  }

  function train(ctx, x) { // nose at x pointing left, length 1900
    const y = 590, L = 1900, h = 112;
    ctx.save(); ctx.translate(x, y);
    // trail streaks
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const yy = -70 + i * 18 + hash(i) * 6, ln = 700 + hash(i + 3) * 900; ctx.fillStyle = lin(ctx, 0, 0, ln + 100, 0, [[0, 'rgba(160,220,255,.7)'], [1, 'rgba(160,220,255,0)']]); ctx.fillRect(L, yy - 4, ln, 5 + hash(i) * 4); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.moveTo(0, h * .62); ctx.bezierCurveTo(0, h * .1, 110, -h * .55, 380, -h * .58); ctx.lineTo(L, -h * .58); ctx.lineTo(L, h * .62); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, -h * .6, 0, h * .65, [[0, '#FFFFFF'], [.55, '#DCE8FF'], [1, '#8FA8E8']]); ctx.fill(); ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#2F6BFF'; ctx.fillRect(0, h * .18, L, 22); ctx.fillStyle = '#FFC24A'; ctx.fillRect(0, h * .18 + 24, L, 6);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, -h * .5, L, 8); ctx.restore();
    // windows
    for (let i = 0; i < 26; i++) { const wx = 250 + i * 64; if (wx > L - 60) break; A.rrect(ctx, wx, -h * .32, 46, 42, 12); ctx.fillStyle = lin(ctx, 0, -h * .3, 0, h * .1, [[0, '#0B1450'], [1, '#2F6BFF']]); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(wx + 6, -h * .3 + 4, 12, 4); }
    // cockpit window
    ctx.beginPath(); ctx.moveTo(60, -h * .05); ctx.bezierCurveTo(90, -h * .38, 150, -h * .48, 210, -h * .48); ctx.lineTo(200, -h * .06); ctx.closePath(); ctx.fillStyle = '#0B1450'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(120,200,255,.6)'; ctx.beginPath(); ctx.moveTo(100, -h * .3); ctx.lineTo(150, -h * .42); ctx.lineTo(160, -h * .3); ctx.fill();
    // headlight
    V.glow(ctx, 6, h * .32, 150, '#FFF3C4', 1); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, h * .36, 10, 0, A.TAU); ctx.fill();
    ctx.restore();
    // rail
    ctx.save(); ctx.strokeStyle = 'rgba(200,230,255,.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, y + h * .8); ctx.lineTo(1080, y + h * .8); ctx.stroke(); ctx.restore();
  }

  function ghost(ctx, v) {
    // stuttering LAG ghost, position stepped at 6 fps
    const q = Math.floor(v * 6) / 6, x = lerp(880, 610, clamp((q - 22.9) / .7)) + (hash(Math.floor(v * 6)) - .5) * 26, y = 860 + (hash(Math.floor(v * 6) + 9) - .5) * 30;
    const dead = clamp((v - 23.34) / .16);
    const draw = (dx, dy, col, a) => {
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.globalAlpha = a * (1 - dead * .7);
      ctx.beginPath(); ctx.moveTo(-70, 70); ctx.lineTo(-70, -10); ctx.bezierCurveTo(-70, -100, 70, -100, 70, -10); ctx.lineTo(70, 70);
      for (let i = 0; i < 4; i++) { const xx = 70 - (i + 1) * 35; ctx.quadraticCurveTo(70 - (i + .5) * 35, i % 2 ? 50 : 96, xx, 70); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    };
    draw(-14, 4, '#FF3B4A', .5); draw(14, -3, '#38D9F5', .5);
    draw(0, 0, '#B9BEDA', 1);
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - dead * .7;
    // eyes (spiral / x)
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; [-28, 28].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex - 13, -34); ctx.lineTo(ex + 13, -10); ctx.moveTo(ex + 13, -34); ctx.lineTo(ex - 13, -10); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-24, 24); for (let i = 0; i < 6; i++) ctx.lineTo(-24 + i * 10 + 5, 24 + (i % 2 ? -8 : 8)); ctx.stroke();
    // buffering spinner above, jerky
    const sa = Math.floor(v * 5) * 1.1; ctx.translate(0, -140); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, A.TAU); ctx.stroke(); ctx.strokeStyle = '#FF3B4A'; ctx.beginPath(); ctx.arc(0, 0, 34, sa, sa + 1.6); ctx.stroke();
    ctx.restore();
    inkText(ctx, 'LAG', x + 20, y + 130, 64, { grad: [[0, '#FF6B7A'], [1, '#FF3B4A']], dir: 'ltr', rot: (hash(Math.floor(v * 8)) - .5) * .2, alpha: 1 - dead * .8, font: 'Rubik' });
    // glitch blocks
    const r = rng(Math.floor(v * 10) + 4); ctx.save(); ctx.globalAlpha = .8 * (1 - dead); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#38D9F5' : '#FF3B4A'; ctx.fillRect(x - 120 + r() * 240, y - 90 + r() * 200, 20 + r() * 50, 5 + r() * 8); } ctx.restore();
    if (dead > 0) { ctx.save(); ctx.globalAlpha = dead; ctx.translate(x + 92, y - 60); ctx.fillStyle = '#7FD8FF'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(22, 0, 18, 22, 0, 22); ctx.bezierCurveTo(-18, 22, -22, 0, 0, -30); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }

  function ball(ctx, v) {
    const pos = tt => { const u = clamp((tt - 23.12) / .46), e = ease.inOut(u); return [lerp(1260, -260, e), 860 - Math.sin(u * Math.PI) * 130 + (1 - u) * -20]; };
    const [bx, by] = pos(v); if (v < 23.12 || bx < -200) return;
    // silky trail
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [w, a, col] of [[70, .18, '#5AD1FF'], [34, .5, '#38D9F5'], [10, .95, '#fff']]) { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const p = pos(v - i * .014); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.lineWidth = w; ctx.strokeStyle = V.hexA(col, a); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-(v - 23.12) * 26);
    ctx.shadowColor = 'rgba(56,217,245,.9)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.fillStyle = lin(ctx, -40, -50, 40, 50, [[0, '#fff'], [1, '#B9C8F5']]); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip(); ctx.fillStyle = '#12082e'; star(ctx, 0, 0, 24, 24, 5, -Math.PI / 2); ctx.fill(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * A.TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); star(ctx, Math.cos(a) * 62, Math.sin(a) * 62, 22, 22, 5, a); ctx.fill(); } ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 62, 0, A.TAU); ctx.stroke(); ctx.restore();
    V.sparkle(ctx, bx - 20, by - 30, 20, '#fff', v * 4, .9);
  }

  function sceneB(ctx, s) {
    const v = s.t, lt = v - 20.64;
    const dim = eio(inv(23.44, 23.86, v));   // 0..1 into the void
    const drawWorld = () => {
      // BG: night navy-blue with cyan glow
      const phase2 = eio(inv(21.95, 22.25, v));
      ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, A.mixc('#0C1A70', '#0A2A9E', phase2)], [.5, NAVY], [1, '#050818']]); ctx.fillRect(0, 0, 1080, 1920);
      V.glow(ctx, 540, 640, 1000, '#2F6BFF', .45); V.glow(ctx, 900, 1500, 700, '#38D9F5', .2 + .15 * phase2); V.glow(ctx, 100, 300, 600, '#8A5BFF', .25);
      ctx.drawImage(halftone(), 0, 0);
      speedLines(ctx, 540, 640, v, { n: 60, r0: 420, r1: 1800, a: .1 + .18 * ein(inv(22.6, 22.75, v)), col: '#9FD0FF' });
      petals(ctx, v, 12, 8, .7);
      // ---- PART 1: LIVE WALL 20.64-22.2
      const wOut = eio(inv(21.90, 22.20, v));
      if (v < 22.25) {
        ctx.save(); ctx.globalAlpha = 1 - wOut * .95;
        const dolly = -wOut * 900, sc = 1 + wOut * .6, yaw = .16 * Math.sin((v - 20.64) * 1.5) + .1 - wOut * .4, rotX = .06 * Math.sin(v * 1.7);
        ctx.translate(540, WCY); ctx.rotate(-wOut * .25); ctx.translate(-540, -WCY);
        wall(ctx, v, { yaw, sc, rotX, dolly }); ctx.restore();
        // kicker: יש לכם גם
        const kw = [['יש', 20.68, 800], ['לכם', 20.83, 590], ['גם', 21.04, 390]];
        ctx.save(); ctx.globalAlpha = 1 - wOut;
        kw.forEach(([w, t0, x]) => { const uu = v - t0; if (uu >= 0) inkText(ctx, w, x - 80, 172, 92, { sc: slamSc(uu, 2), rot: -.03, grad: [[0, '#fff'], [1, '#C9D8FF']] }); });
        const u1 = v - 21.06, u2 = v - 21.47;
        if (u1 >= 0) inkText(ctx, 'שידורים', 750, 1105, 130, { sc: slamSc(u1, 2.3), rot: -.04 });
        if (u2 >= 0) { inkText(ctx, 'חיים', 300, 1105, 130, { sc: slamSc(u2, 2.3), rot: -.04, grad: [[0, '#fff'], [.4, '#FF8A96'], [1, '#FF3B4A']] });
          ctx.save(); ctx.translate(120, 1030); ctx.scale(eob(u2 / .2), eob(u2 / .2)); ctx.fillStyle = '#FF2B3D'; ctx.beginPath(); ctx.arc(0, 0, 22 + 3 * Math.sin(v * 10), 0, A.TAU); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
        ctx.restore();
        // power-on hit lines
        [[21.06, '#fff', 0], [21.47, '#FF6B7A', 1]].forEach(([t0, col]) => { const uu = v - t0; if (uu >= 0 && uu < .3) { ctx.save(); ctx.globalAlpha = 1 - uu / .3; speedLines(ctx, 540, 640, v, { n: 50, r0: 300, r1: 1500, a: .5, col, fps: 30 }); ctx.restore(); } });
        const dk = [[21.06, 'ドン', 900, 330, .2], [21.47, 'パァァ', 180, 420, -.15]];
        dk.forEach(([t0, txt, x, y, r]) => { const uu = v - t0; if (uu >= 0 && uu < .38) kana(ctx, txt, x, y, 110 * slamSc(uu, 1.5), r, '#FFD84A', 1 - inv(.22, .38, uu)); });
      }
      // ---- PART 2: speed & smooth 22.0-23.5
      if (v >= 22.1) {
        const fo = 1 - ein(inv(23.36, 23.6, v));
        ctx.save(); ctx.globalAlpha = fo;
        ribbons(ctx, v, 1);
        // kicker חוויית צפייה
        const uA = v - 22.21, uB = v - 22.39;
        if (uA >= 0) inkText(ctx, 'חוויית', 720, 215, 118, { sc: slamSc(uA, 2), rot: -.03, grad: [[0, '#fff'], [1, '#C9D8FF']] });
        if (uB >= 0) inkText(ctx, 'צפייה', 330, 215, 118, { sc: slamSc(uB, 2), rot: -.03 });
        // train (מהירה)
        const tx = 1140 - (v - 22.70) * 3800;
        if (v >= 22.68 && tx > -2000) train(ctx, tx);
        const uM = v - 22.71;
        if (uM >= 0) inkText(ctx, 'מהירה', 540, 1040, 150, { sc: slamSc(uM, 2.2), rot: .03, grad: [[0, '#fff'], [.5, '#FFF3C4'], [1, '#FFC24A']] });
        if (uM >= 0 && uM < .4) kana(ctx, 'ゴォォ', 250, 420, 110 * slamSc(uM, 1.5), -.12, '#FFD84A', 1 - inv(.25, .4, uM));
        // ghost + ball (וחלקה)
        if (v >= 22.88) { ctx.save(); ctx.globalAlpha = clamp((v - 22.88) / .1); ghost(ctx, v); ctx.restore(); }
        ball(ctx, v);
        const uS = v - 23.14;
        if (uS >= 0) { inkText(ctx, 'וחלקה', 540, 1160, 150, { sc: slamSc(uS, 2.2), rot: -.03, grad: [[0, '#fff'], [.5, '#B6F3FF'], [1, '#38D9F5']] });
          const sh = clamp((v - 23.2) / .4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lin(ctx, 540 - 380 + sh * 760 - 80, 0, 540 - 380 + sh * 760 + 80, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(120, 1090, 800, 140); ctx.restore(); }
        if (uS >= 0 && uS < .4) kana(ctx, 'スーッ', 850, 420, 110 * slamSc(uS, 1.5), .12, '#8EF2FF', 1 - inv(.25, .4, uS));
        [[22.71, '#fff'], [23.14, '#B6F3FF']].forEach(([t0, col]) => { const uu = v - t0; if (uu >= 0 && uu < .25) { ctx.save(); ctx.globalAlpha = 1 - uu / .25; speedLines(ctx, 540, 800, v, { n: 50, r0: 350, r1: 1500, a: .45, col, fps: 30 }); ctx.restore(); } });
        ctx.restore();
      }
      // ---- VOID: 23.44-23.9+
      if (dim > 0) {
        ctx.save(); ctx.globalAlpha = dim; ctx.fillStyle = '#03050F'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
        // spotlight cone
        const ca = eio(inv(23.5, 23.9, v)), sway = Math.sin(v * 1.4) * 6;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ca;
        ctx.beginPath(); ctx.moveTo(540 - 40, -40); ctx.lineTo(540 + 40, -40); ctx.lineTo(540 + 470 + sway, 1500); ctx.lineTo(540 - 470 + sway, 1500); ctx.closePath();
        ctx.fillStyle = lin(ctx, 0, 0, 0, 1500, [[0, 'rgba(190,215,255,.34)'], [.6, 'rgba(120,160,255,.14)'], [1, 'rgba(90,130,255,.04)']]); ctx.fill();
        ctx.fillStyle = rad(ctx, 540 + sway, 1500, 0, 520, [[0, 'rgba(170,200,255,.35)'], [1, 'rgba(0,0,0,0)']]); ctx.save(); ctx.translate(540 + sway, 1500); ctx.scale(1, .28); ctx.translate(-540 - sway, -1500); ctx.fillRect(0, 900, 1080, 1200); ctx.restore();
        // dust motes
        for (let i = 0; i < 24; i++) { const x = 540 + (hash(i) - .5) * 700 * (0.3 + s.lt * 0 + (i * 60 % 100) / 100), y = ((hash(i + 40) * 1500 - v * (14 + hash(i + 7) * 30)) % 1500 + 1500) % 1500; ctx.globalAlpha = ca * (.15 + .35 * hash(i + 2)); ctx.fillStyle = '#dbe8ff'; ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i + 5) * 2.5, 0, A.TAU); ctx.fill(); }
        ctx.restore();
      }
    };
    // ENTRY: diagonal slab wipe covers the host reaction shot within 0.3 s
    if (lt < .32) {
      ctx.save(); ctx.beginPath();
      const bands = 7;
      for (let i = 0; i < bands; i++) {
        const p = eo((v - (20.64 + i * .03)) / .13), y0 = i * 290 - 60, h = 380, sl = 200, from = i % 2 ? -1 : 1;
        // edge x position: from right (from=1) sweeps to left
        if (p <= 0) continue;
        if (from === 1) { const xe = 1080 + sl - p * (1080 + 2 * sl); ctx.moveTo(1180, y0); ctx.lineTo(xe + sl, y0); ctx.lineTo(xe, y0 + h); ctx.lineTo(1180, y0 + h); ctx.closePath(); }
        else { const xe = -sl + p * (1080 + 2 * sl); ctx.moveTo(-100, y0); ctx.lineTo(xe, y0); ctx.lineTo(xe - sl, y0 + h); ctx.lineTo(-100, y0 + h); ctx.closePath(); }
      }
      ctx.clip(); drawWorld(); ctx.restore();
      // white leading edges
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < bands; i++) { const p = eo((v - (20.64 + i * .03)) / .13); if (p <= 0 || p >= 1) continue; const y0 = i * 290 - 60, h = 380, sl = 200, from = i % 2 ? -1 : 1, xe = from === 1 ? 1080 + sl - p * (1080 + 2 * sl) : -sl + p * (1080 + 2 * sl);
        ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.beginPath(); if (from === 1) { ctx.moveTo(xe + sl, y0); ctx.lineTo(xe, y0 + h); } else { ctx.moveTo(xe, y0); ctx.lineTo(xe - sl, y0 + h); } ctx.stroke(); }
      ctx.restore();
    } else drawWorld();
    impact(ctx, v, 21.06, 2);
    V.flash(ctx, v, 22.70, .1, '#fff', .35);
  }
  A.scene({ name: 's5b_smooth', start: 20.64, end: 24.20, draw: sceneB });
})();
