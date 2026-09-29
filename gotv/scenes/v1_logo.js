// GOTV v1_logo: scene A (logo reveal, 3.05-5.0) + scene B (end card, 36.88-39.5)
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = V.C;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), eio = t => ease.inOut(clamp(t)), ein = t => ease.in(clamp(t));
  const add = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };

  // ---------- shared: static navy field
  const navy = () => A.layer('v1_navy', 1080, 1920, g => {
    g.fillStyle = V.lin(g, 0, 0, 0, 1920, [[0, '#0A1240'], [.45, '#0B1450'], [1, '#040614']]); g.fillRect(0, 0, 1080, 1920);
    V.glow(g, 540, 640, 900, C.blue, .5); V.glow(g, 540, 1500, 800, '#6B3BFF', .2);
  });
  // ---------- shared: kinetic letter pop text. t0 = start time, returns nothing
  function kinetic(ctx, str, cx, y, size, t, t0, o = {}) {
    ctx.save(); ctx.font = `${o.weight || 900} ${size}px Rubik`; ctx.direction = 'rtl'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const chars = [...str], ws = chars.map(c => c === ' ' ? size * .28 : ctx.measureText(c).width + size * .02);
    const total = ws.reduce((a, b) => a + b, 0), fit = Math.min(1, (o.maxW || 880) / total), st = o.stagger ?? .02, dur = o.dur ?? .34;
    let x = cx + total * fit / 2;
    chars.forEach((c, i) => {
      const w = ws[i] * fit, xc = x - w / 2; x -= w; if (c === ' ') return;
      const k = clamp((t - t0 - i * st) / dur); if (k <= 0) return;
      const sc = lerp(.2, 1, ease.outBack(k)) * fit, dy = (1 - ease.out(k)) * -70, rot = (hash(i * 3.3 + 1) - .5) * .5 * (1 - eo(k));
      ctx.save(); ctx.translate(xc, y + dy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 4) * (o.alpha ?? 1);
      ctx.shadowColor = 'rgba(0,10,50,.7)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; ctx.lineJoin = 'round';
      ctx.lineWidth = size * .12; ctx.strokeStyle = 'rgba(6,10,40,.85)'; ctx.strokeText(c, 0, 0); ctx.shadowColor = 'transparent';
      ctx.fillStyle = V.lin(ctx, 0, -size * .5, 0, size * .5, o.grad || [[0, '#FFFFFF'], [.42, '#FFF3C4'], [.7, '#FFC24A'], [1, '#E48A12']]); ctx.fillText(c, 0, 0);
      if (k < 1) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .8; ctx.fillStyle = '#fff'; ctx.fillText(c, 0, 0); }
      ctx.restore();
    });
    ctx.restore();
    return { total: total * fit, x0: cx - total * fit / 2 };
  }
  const twinkle = (ctx, x, y, r, t, ph, col = '#FFF6D0') => { const k = Math.max(0, Math.sin(t * 5 + ph * 9)); if (k > .02) V.sparkle(ctx, x, y, r * (.4 + .6 * k), col, .2 + ph, k); };
  // lens flare / anamorphic streak
  function streak(ctx, x, y, len, thick, col, a) {
    add(ctx, () => { ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1, thick / len);
      ctx.fillStyle = V.rad(ctx, 0, 0, 0, len, [[0, '#fff'], [.15, col], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.arc(0, 0, len, 0, A.TAU); ctx.fill(); });
  }
  function rays(ctx, x, y, n, r0, r1, col, a, seed, wob = 0) {
    add(ctx, () => { ctx.translate(x, y); for (let i = 0; i < n; i++) { const an = (i / n) * A.TAU + hash(i + seed) * .3 + wob, l = lerp(.6, 1, hash(i * 7 + seed)) * r1;
      ctx.save(); ctx.rotate(an); ctx.globalAlpha = a * (.4 + .6 * hash(i * 3 + seed)); ctx.fillStyle = V.lin(ctx, r0, 0, l, 0, [[0, col], [1, 'rgba(0,0,0,0)']]);
      ctx.beginPath(); ctx.moveTo(r0, -3); ctx.lineTo(l, 0); ctx.lineTo(r0, 3); ctx.fill(); ctx.restore(); } });
  }

  // ======================================================================= SCENE A
  const TILE_COLS = [['#FF5A66', '#B3122B'], ['#5AD1FF', '#1B5FE0'], ['#FFC24A', '#E0700A'], ['#3DDC84', '#0C8A55'], ['#B58BFF', '#5A2BD0'], ['#FF4F9A', '#B0125F'], ['#38D9F5', '#1C6FD0']];
  const ICONS = ['play', 'ball', 'star', 'heart', 'tv', 'bolt', 'note'];
  const CX = 540, CY = 700;
  function sceneA(ctx, s) {
    const t = s.t, tl = t - 3.05;
    // -- camera push + whip exit
    const push = 1 + .07 * ease.inOut(inv(3.9, 4.98, t)), wu = inv(4.95, 5.3, t), wx = -ein(wu) * 1700;
    ctx.save();
    ctx.translate(wx, 0); if (wu > 0) ctx.transform(1, 0, -.22 * ein(wu), 1, 0, 0);
    ctx.translate(540, 900); ctx.scale(push, push); ctx.translate(-540, -900);
    // -- background
    ctx.drawImage(navy(), 0, 0);
    const burst = inv(3.5, 3.75, t) * (1 - inv(3.8, 4.6, t) * .5);
    V.glow(ctx, CX, CY, 1000, C.blue, .35 + .35 * burst);
    V.bokeh(ctx, t, { seed: 8, alpha: .8, n: 22 });
    // swirl glow arms during vortex
    const vu = inv(3.05, 3.6, t);
    if (vu > 0 && vu < 1) add(ctx, () => { ctx.translate(CX, CY); ctx.rotate(vu * 5); for (let i = 0; i < 5; i++) { ctx.rotate(A.TAU / 5); ctx.globalAlpha = .18 * (1 - vu * .6); ctx.fillStyle = V.lin(ctx, 0, 0, 900 * (1 - vu * .7), 0, [[0, '#FFC24A'], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(300, -260, 900, -120); ctx.quadraticCurveTo(300, -100, 0, 40); ctx.fill(); } });
    // -- vortex tiles
    if (t < 3.66) {
      const N = 30;
      for (let i = 0; i < N; i++) {
        const d = hash(i * 1.7) * .1, u = inv(3.05 + d, 3.6, t); if (u >= 1) continue;
        const a0 = i * 2.39996, r0 = 380 + 620 * hash(i * 2.3 + 1), e = u * u * (1.5 - .5 * u), r = r0 * (1 - e) * (1 - e * .3);
        const ang = a0 + 4.4 * ease.in(u) + u * 1.5, x = CX + Math.cos(ang) * r, y = CY + Math.sin(ang) * r * .95;
        const sc = lerp(.5 + .6 * hash(i * 5.1), .04, Math.pow(u, 1.6)); ctx.save(); ctx.globalAlpha = clamp((1 - u) * 5) * .98;
        V.tile(ctx, x, y, sc, TILE_COLS[i % 7][0], TILE_COLS[i % 7][1], V.ICON[ICONS[i % 7]], { rot: ang * .6 + u * 5 }); ctx.restore();
        if (u > .05) add(ctx, () => { ctx.globalAlpha = .25 * (1 - u); ctx.strokeStyle = TILE_COLS[i % 7][0]; ctx.lineWidth = 8 * sc + 2; ctx.beginPath(); const pa = ang - .35; ctx.moveTo(CX + Math.cos(pa) * r * 1.08, CY + Math.sin(pa) * r * 1.08 * .95); ctx.lineTo(x, y); ctx.stroke(); });
      }
      // point of light
      const pl = inv(3.2, 3.6, t); if (pl > 0) { const rr = lerp(30, 220, pl * pl); V.glow(ctx, CX, CY, rr * 2, '#FFF3C4', .9 * pl); V.glow(ctx, CX, CY, rr * .7, '#fff', pl); }
    }
    // -- shockwave + flare at 3.6
    const ib = t - 3.6;
    if (ib > 0 && ib < 1) {
      const k = eo(ib / .7); add(ctx, () => { V.ring(ctx, CX, CY, 40 + k * 1100, 60 * (1 - k) + 4, '#FFF3C4', (1 - k) * .9); V.ring(ctx, CX, CY, 30 + eo(ib / .9) * 800, 30 * (1 - k) + 2, C.sky, (1 - eo(ib / .9)) * .7); });
      rays(ctx, CX, CY, 28, 60, 900 * eo(ib / .5) + 100, '#FFE9A8', (1 - clamp(ib / .7)) * .9, 4);
      streak(ctx, CX, CY, 1300, 46, '#FFD98A', (1 - clamp(ib / .9)) * .95); streak(ctx, CX, CY, 500, 260, '#5AD1FF', (1 - clamp(ib / .5)) * .5);
      V.glow(ctx, CX, CY, 700, '#fff', (1 - clamp(ib / .35)) * .85);
    }
    // -- light beams behind logo
    const bk = inv(3.6, 4.2, t); if (bk > 0) { V.beams(ctx, CX, CY + 60, t * 1.2, '#FFD98A', 7, 2200, 1.7, .12 * bk); V.beams(ctx, CX, CY + 60, t + 3, C.sky, 5, 2000, 1.3, .1 * bk); }
    // -- logo
    const p = inv(3.58, 4.12, t);
    if (p > 0) {
      const sc = lerp(.22, 1, eob(p)), rotY = lerp(-1.25, 0, eob(p)) + (p >= 1 ? Math.sin((t - 4.1) * 2.2) * .05 : 0), rotX = lerp(.55, 0, eo(p)) + (p >= 1 ? Math.sin((t - 4.1) * 1.7) * .02 : 0);
      const cyy = CY + lerp(90, 0, eob(p)), al = clamp(p * 10), W = 960 * sc, sh = inv(3.9, 4.45, t), shine = sh > 0 && sh < 1 ? ease.inOut(sh) : -1;
      const glowk = .55 + .45 * Math.sin(inv(3.6, 4.6, t) * Math.PI) + .2 * clamp(p * 3);
      V.logo(ctx, CX, cyy, W, { glow: glowk, alpha: al, art: false });
      const cv = V.logoFrame({ shine, extrude: lerp(1.0, 1, p) }), z = V.logoSize(W);
      ctx.save(); ctx.globalAlpha = al; V.card3d(ctx, cv, CX, cyy, z.dw, z.dh, rotY, rotX, 1500, 8, 4); ctx.restore();
      // sparkles on shine
      if (sh > 0 && sh < 1.15) for (let i = 0; i < 9; i++) { const sx = CX + (hash(i * 4.1) - .5) * 860, sy = CY + (hash(i * 6.7) - .5) * 260, st = 3.95 + (sx - CX) / 860 * .32 + .16, k = clamp(1 - Math.abs(t - st - .12) / .22); if (k > 0) V.sparkle(ctx, sx, sy, 30 + 50 * hash(i), '#fff', hash(i) * 2 + t * 2, k); }
      // ambient twinkles
      if (t > 4.1) for (let i = 0; i < 10; i++) twinkle(ctx, CX + (hash(i * 3.1 + 2) - .5) * 980, CY + (hash(i * 5.3) - .5) * 420, 20 + 20 * hash(i + 9), t, hash(i * 1.9), i % 3 ? '#FFF6D0' : '#BEE8FF');
    }
    // -- tagline
    if (t > 4.4) {
      const ty = 930, gl = inv(4.45, 4.9, t);
      add(ctx, () => { V.glow(ctx, CX, ty, 520, C.gold, .22 * clamp(gl * 2)); });
      const r = kinetic(ctx, 'הטלוויזיה של ישראל', CX, ty, 104, t, 4.42, { stagger: .018, dur: .32, maxW: 900 });
      // gold underline sweep
      const lu = ease.out(inv(4.62, 4.98, t)); if (lu > 0) { ctx.save(); const wd = r.total * .78 * lu; ctx.globalAlpha = clamp(lu * 3); ctx.fillStyle = V.lin(ctx, CX - wd / 2, 0, CX + wd / 2, 0, [[0, 'rgba(255,194,74,0)'], [.5, '#FFE9A8'], [1, 'rgba(255,194,74,0)']]); V.rr(ctx, CX - wd / 2, ty + 78, wd, 8, 4); ctx.fill(); ctx.restore(); }
    }
    ctx.restore();
    // -- exit whip streaks
    if (wu > 0) { add(ctx, () => { const rg = rng(11); for (let i = 0; i < 26; i++) { const y = rg() * 1920, L = 500 + rg() * 1300, x = lerp(1300, -300, ein(wu)) + rg() * 500; ctx.globalAlpha = (.25 + .5 * rg()) * Math.sin(Math.min(1, wu * 1.3) * Math.PI * .8 + .3); ctx.fillStyle = V.lin(ctx, x, 0, x + L, 0, [[0, 'rgba(255,220,140,0)'], [.2, i % 3 ? '#FFE9A8' : '#9FE0FF'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x, y, L, 3 + rg() * 10); } });
      ctx.save(); ctx.globalAlpha = .55 * Math.sin(wu * Math.PI); ctx.fillStyle = '#FFF3C4'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    // -- opening flash
    V.flash(ctx, t, 3.05, .3, '#FFF6DC', 1);
  }
  A.scene({ name: 'v1_logo_a', start: 3.05, end: 5.3, draw: sceneA });

  // ======================================================================= SCENE B (END CARD)
  const POSTER_HUES = [[350, 60], [215, 70], [42, 85], [280, 55], [160, 60], [12, 75], [195, 70], [320, 60], [250, 60]];
  const strip = () => A.layer('v1_strip', 2430, 340, g => {
    for (let i = 0; i < 9; i++) {
      const x = i * 270 + 15, [h, sat] = POSTER_HUES[i];
      g.save(); g.translate(x, 0); V.rr(g, 0, 0, 240, 340, 26); g.fillStyle = V.lin(g, 0, 0, 240, 340, [[0, `hsl(${h},${sat}%,55%)`], [1, `hsl(${(h + 40) % 360},${sat}%,22%)`]]); g.fill();
      g.clip(); g.fillStyle = V.rad(g, 120 + (i % 3 - 1) * 40, 130, 0, 150, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 240, 340);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 250, 240, 90); g.fillStyle = 'rgba(255,255,255,.5)'; V.rr(g, 24, 272, 140, 14, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; V.rr(g, 24, 298, 90, 10, 5); g.fill();
      g.fillStyle = V.lin(g, 0, 0, 240, 100, [[0, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.ellipse(120, 0, 200, 120, 0, 0, A.TAU); g.fill();
      g.restore();
    }
  });
  function ribbon(ctx, y, rot, dir, spd, t, a) {
    const S = strip(), off = ((t * spd * dir) % 2430 + 2430) % 2430;
    ctx.save(); ctx.translate(540, y); ctx.rotate(rot); ctx.globalAlpha = a;
    for (let k = -1; k < 3; k++) ctx.drawImage(S, -1215 + k * 2430 - off, -170);
    ctx.restore();
  }
  function sceneB(ctx, s) {
    const t = s.t, lt = t - 36.88;
    ctx.drawImage(navy(), 0, 0);
    // far ribbons (slow, tinted into navy)
    ribbon(ctx, 260, -.2, 1, 26, t, .3); ribbon(ctx, 1370, -.2, -1, 32, t, .3); ribbon(ctx, 1700, -.2, 1, 22, t, .22);
    ctx.save(); ctx.fillStyle = V.lin(ctx, 0, 0, 0, 1920, [[0, 'rgba(6,10,40,.55)'], [.3, 'rgba(8,16,80,.2)'], [.65, 'rgba(8,16,80,.3)'], [1, 'rgba(4,6,24,.65)']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
    const open = ease.out(inv(0, .7, lt)), breath = .5 + .5 * Math.sin(t * 2.1);
    V.glow(ctx, 540, 760, 1000, C.blue, .45 * open); V.glow(ctx, 540, 1000, 700, C.gold, .12 + .05 * breath);
    V.bokeh(ctx, t * .6, { seed: 14, alpha: 1, n: 26 });
    V.beams(ctx, 540, 760, t * .5, '#FFD98A', 6, 2200, 1.9, .1 * open); V.beams(ctx, 540, 760, t * .4 + 2, C.sky, 5, 2000, 1.5, .09 * open);
    // logo hero: punch-in from flash
    const p = inv(.02, .55, lt), drift = Math.sin(t * .9) * 6, sc = lerp(1.35, 1, eob(p)), al = clamp(p * 8);
    const shine1 = inv(37.35, 37.95, t), shine2 = inv(38.75, 39.3, t);
    const sh = shine1 > 0 && shine1 < 1 ? ease.inOut(shine1) : shine2 > 0 && shine2 < 1 ? ease.inOut(shine2) : -1;
    V.logo(ctx, 540, 760 + drift, 940 * sc, { glow: .6 + .3 * breath, alpha: al, shine: sh, reflect: .16 });
    // sparkles
    if (lt > .5) for (let i = 0; i < 14; i++) twinkle(ctx, 540 + (hash(i * 3.7 + 1) - .5) * 1000, 760 + (hash(i * 5.9) - .5) * 520, 18 + 22 * hash(i + 4), t + i * .37, hash(i * 2.3), i % 3 ? '#FFF6D0' : '#BEE8FF');
    if (sh > 0.1 && sh < .95) for (let i = 0; i < 5; i++) { const sx = 540 + (sh - .5) * 1000 + (hash(i * 8.1) - .5) * 260, sy = 700 + (hash(i * 2.6) - .5) * 300; V.sparkle(ctx, sx, sy, 40 + 30 * hash(i), '#fff', t * 3 + i, Math.sin(sh * Math.PI)); }
    // tagline
    const ty = 1010; if (t > 37.25) {
      add(ctx, () => V.glow(ctx, 540, ty, 560, C.gold, .2 * clamp((t - 37.25) * 2)));
      kinetic(ctx, 'הטלוויזיה של ישראל', 540, ty, 110, t, 37.28, { stagger: .022, dur: .36, maxW: 900 });
    }
    // glass pill
    const pk = eob(inv(37.75, 38.15, t)); if (pk > 0) {
      const pw = 860, ph = 104, py = 1145; ctx.save(); ctx.globalAlpha = clamp(pk * 3); ctx.translate(540, py); ctx.scale(lerp(.85, 1, pk), lerp(.85, 1, pk)); ctx.translate(-540, -py);
      V.glass(ctx, 540 - pw / 2, py - ph / 2, pw, ph, ph / 2, { tint: '#8FB4FF', alpha: .2, shadow: 30, shadowY: 12 });
      ctx.font = '600 44px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const str = '(התקנת אפליקציה על המסך החכם)', fitw = Math.min(1, (pw - 70) / ctx.measureText(str).width);
      ctx.translate(540, py + 2); ctx.scale(fitw, fitw); ctx.shadowColor = 'rgba(0,10,50,.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; ctx.fillStyle = '#F4F8FF'; ctx.fillText(str, 0, 0); ctx.restore();
    }
    // opening flash + shockwave
    V.flash(ctx, t, 36.88, .32, '#FFF3D0', 1);
    if (lt < .8) add(ctx, () => { const k = eo(lt / .8); V.ring(ctx, 540, 760, 60 + k * 1000, 50 * (1 - k) + 2, '#FFE9A8', (1 - k) * .8); });
  }
  A.scene({ name: 'v1_logo_b', start: 36.88, end: 39.5, draw: sceneB });
})();
