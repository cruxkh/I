// s8 END CARD (36.7 to 40.0), silent. Paper-craft GOTV logo, tagline strip, smart TV installing the app. Compositor fades to black at 39.75+.
(() => {
  const { clamp, inv, ease, hash, TAU } = A;
  const C = CL.C, W = 1080, H = 1920;
  const Q = (t, f = 12) => CL.q(t, f);

  function confetti(ctx, t, t0, n, cx, cy, seed, dur = 1.9, spd = 1200) {
    const u = Q(t) - t0; if (u < 0 || u > dur) return; const cols = [C.yellow, C.blue, C.red, C.pink, C.green, C.orange, C.white];
    for (let i = 0; i < n; i++) {
      const a = hash(seed + i * 1.7) * TAU, v = (.35 + hash(seed + i * 3.1) * .65) * spd, k = (1 - Math.exp(-u * 3.5)) / 3.5;
      const x = cx + Math.cos(a) * v * k, y = cy + Math.sin(a) * v * k + 520 * u * u, s = 18 + hash(seed + i * 5.3) * 24, r = hash(seed + i) * TAU + u * 5 * (hash(seed + i * 9) - .5), kd = i % 3;
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      for (const [ox, oy, col] of [[5, 7, 'rgba(40,20,0,.28)'], [0, 0, cols[i % cols.length]]]) { ctx.fillStyle = col; ctx.beginPath();
        if (kd === 0) ctx.rect(-s * .8 + ox, -s * .5 + oy, s * 1.6, s); else if (kd === 1) { ctx.moveTo(ox, -s * .7 + oy); ctx.lineTo(s * .7 + ox, s * .6 + oy); ctx.lineTo(-s * .7 + ox, s * .6 + oy); ctx.closePath(); } else ctx.arc(ox, oy, s * .5, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  function content(ctx, t) {
    ctx.drawImage(CL.layer('s8bg', W, H, g => CL.paper(g, 'kraft')), 0, 0);
    // yellow paper rays behind the logo (stepped rotation)
    ctx.save(); ctx.translate(540, 560); ctx.rotate(Q(t, 8) * .04); ctx.fillStyle = 'rgba(255,214,10,.38)';
    for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1700, i * TAU / 24, (i + 1) * TAU / 24); ctx.closePath(); ctx.fill(); } ctx.restore();

    const j = CL.j(t, 1, 3);
    // blue torn panel + logo
    const ps = CL.pop(t, 36.98, .3);
    if (ps) { CL.scrap(ctx, 540 + j[0], 560 + j[1], 990, 520, { fill: C.blue, seed: 21, rot: .02, scale: ps, draw: (g, w, h) => CL.halftone(g, -w / 2, -h / 2, w, h, '#5B82FF', 32, .5, { fade: 'radial' }) });
      if (ps === 1 || t > 37.2) { CL.tape(ctx, 120, 330, -.5, 170, 50); CL.tape(ctx, 960, 800, -.45, 170, 50); } }
    const ls = CL.pop(t, 37.08, .32);        // CUE 37.08 logo slam
    if (ls) { const sk = CL.shake(t, 37.08, .4, 12); CL.title(ctx, 'GOTV', 540 + j[0] + sk[0], 555 + j[1] + sk[1], { size: 310, dir: 'ltr', rot: -.05 + j[2], scale: ls }); }
    const s1 = CL.pop(t, 37.25, .3), sj = CL.j(t, 3, 3);
    if (s1) { CL.star(ctx, 105 + sj[0], 270 + sj[1], 78 * s1, 10, { fill: C.red, rot: .3 }); CL.star(ctx, 985 - sj[0], 900 + sj[1], 70 * s1, 8, { fill: C.pink, rot: -.2 }); CL.star(ctx, 960 + sj[1], 250, 50 * s1, 8, { fill: C.orange, rot: .1 }); }

    // tagline strip
    const cs = CL.pop(t, 37.45, .3);
    if (cs) { const cj = CL.j(t, 4, 2); ctx.save(); ctx.translate(540 + cj[0], 940 + cj[1]);
      const d = CL.chip(ctx, 'הטלוויזיה של ישראל', 0, 0, { size: 100, fill: C.yellow, rot: .025, scale: cs, seed: 5 });
      CL.underline(ctx, -d.w / 2 + 40, d.w / 2 - 40, 96, inv(37.8, 38.05, t), { color: C.red, lw: 13, seed: 3 }); ctx.restore(); }

    // smart TV with install animation
    const ts = CL.pop(t, 37.1, .3);
    if (ts) { const tj = CL.j(t, 6, 2), cx = 540 + tj[0], cy = 1330 + tj[1];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(ts, ts); ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(-190, 196); ctx.lineTo(-120, 196); ctx.lineTo(-150, 262); ctx.lineTo(-220, 262); ctx.closePath(); ctx.moveTo(190, 196); ctx.lineTo(120, 196); ctx.lineTo(150, 262); ctx.lineTo(220, 262); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-330, -224, 660, 448, 46); ctx.fill(); ctx.restore();
      CL.tv(ctx, cx, cy, 620, 420, { scale: ts, draw: (g, sw, sh) => {
        // client: a BEAR on the TV that says "GO TV!" with synced lips (bear.js)
        g.fillStyle = '#FFE38A'; g.fillRect(0, 0, sw, sh); CL.halftone(g, 0, 0, sw, sh, '#F6C94A', 26, .5, { fade: 'radial' });
        g.save(); g.globalAlpha = .35; g.translate(sw / 2, sh * .55); g.rotate(t * .25); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.fillStyle = i % 2 ? '#fff' : '#FFD60A'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -sw); g.lineTo(60, -sw); g.fill(); } g.restore();
        const bp = CL.pop(t, 37.14, .35), bo = ease.in(clamp((t - 38.78) / .3)); if (bp && bo < 1) { g.save(); g.translate(sw / 2, sh * .54 + (1 - Math.min(1, bp)) * 80 + bo * sh * 1.1); g.rotate(bo * .5); g.scale(bp, bp); CL.bear(g, t, sh * .40); g.restore(); }
        priceTV(g, t, sw, sh);
      } });
      
    }

    // small parenthesised line on a paper tag
    const tg = CL.pop(t, 38.15, .3);
    if (tg) { const gj = CL.j(t, 8, 2); ctx.save(); ctx.translate(540 + gj[0], 1690 + gj[1]); ctx.rotate(-.015); ctx.scale(tg, tg);
      CL.scrap(ctx, 0, 0, 820, 110, { fill: C.white, seed: 9, rough: 4, shadow: 9 }); ctx.font = '700 48px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink;
      ctx.fillText('(התקנת אפליקציה על המסך החכם)', 0, 4); ctx.restore(); }

    confetti(ctx, t, 37.08, 46, 540, 560, 51);
  }



  // client v2: the price announcement plays INSIDE the TV screen, replacing the bear (voice T 43.5 = v 38.9)
  function priceTV(g, t, sw, sh) {
    const S0 = 38.9; if (t < S0 - 0.12) return;
    const k = ease.out(clamp((t - (S0 - 0.12)) / .22));
    g.save(); g.globalAlpha = k; g.fillStyle = C.blue; g.fillRect(0, 0, sw, sh); CL.halftone(g, 0, 0, sw, sh, '#3D6BFF', 22, .5, { fade: 'radial' });
    g.translate(sw / 2, sh / 2); g.rotate(t * .5); for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillStyle = i % 2 ? 'rgba(255,255,255,.10)' : 'rgba(255,214,10,.16)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-70, -sw); g.lineTo(70, -sw); g.fill(); } g.restore();
    const R = sh * .34, cx = sw / 2, cy = sh * .52;
    const a0 = CL.pop(t, S0 + 0.02, .22); if (a0) CL.chip(g, 'וכל זה ב', cx, sh * .1, { size: sh * .085, rot: -.04, scale: a0, fill: C.white, seed: 71 });
    const pb = CL.pop(t, S0 + 0.62, .35);
    if (pb) { const sk = CL.shake(t, S0 + 0.62, .45, sh * .025), rot = Math.sin(t * 1.3) * .03; g.save(); g.translate(cx + sk[0], cy + sk[1]); g.scale(pb, pb);
      CL.star(g, 6, 10, R, 18, { fill: 'rgba(0,0,40,.35)', lw: .01, rot }); CL.star(g, 0, 0, R, 18, { fill: C.yellow, lw: sh * .018, rot }); CL.star(g, 0, 0, R * .8, 18, { fill: '#FFE66B', lw: .01, rot: rot + .1 });
      CL.title(g, '350', -R * .16, -R * .02, { size: R * .5, dir: 'ltr', fill: C.red, rot: -.06 }); CL.title(g, '₪', R * .55, -R * .07, { size: R * .36, dir: 'ltr', fill: C.red, rot: -.06, font: `bold ${Math.round(R * .36)}px 'DejaVu Sans'` });
      g.restore(); if (t < S0 + 1.0) CL.sparks(g, cx, cy, R * 1.02, R * 1.3, 14, t, { color: C.white, lw: sh * .014 }); }
    const c1 = CL.pop(t, S0 + 1.86, .25); if (c1) CL.chip(g, 'תשלום חד פעמי', sw * .3, sh * .89, { size: sh * .085, rot: .04, scale: c1, fill: C.white, seed: 72 });
    const c2 = CL.pop(t, S0 + 3.16, .25); if (c2) CL.chip(g, 'פעיל לשנה', sw * .72, sh * .89, { size: sh * .085, rot: -.05, scale: c2, fill: C.yellow, seed: 73 });
  }
  A.scene({ name: 's8_end', start: 36.7, end: 44.0, draw: (ctx, s) => {
    const t = s.t, p = inv(36.7, 37.05, t);
    if (p >= 1) { content(ctx, t); return; }
    const pp = ease.out(clamp(Q(p * 100, 24) / 100)), R = pp * 1450, ring = r => { ctx.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = r * (1 + (hash(i * 1.3 + Q(t, 12) * .1) - .5) * .07); ctx.lineTo(540 + Math.cos(a) * rr, 960 + Math.sin(a) * rr); } ctx.closePath(); };
    ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.32)'; ring(R + 44); ctx.fill(); ctx.fillStyle = C.white; ring(R + 18); ctx.fill(); ring(R); ctx.clip(); content(ctx, t); ctx.restore();
  } });
})();
