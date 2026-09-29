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
        const bp = CL.pop(t, 37.14, .35); if (bp) { g.save(); g.translate(sw / 2, sh * .54 + (1 - Math.min(1, bp)) * 80); g.scale(bp, bp); CL.bear(g, t, sh * .40); g.restore(); }
      } });
      
    }

    // small parenthesised line on a paper tag
    const tg = CL.pop(t, 38.15, .3);
    if (tg) { const gj = CL.j(t, 8, 2); ctx.save(); ctx.translate(540 + gj[0], 1690 + gj[1]); ctx.rotate(-.015); ctx.scale(tg, tg);
      CL.scrap(ctx, 0, 0, 820, 110, { fill: C.white, seed: 9, rough: 4, shadow: 9 }); ctx.font = '700 48px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink;
      ctx.fillText('(התקנת אפליקציה על המסך החכם)', 0, 4); ctx.restore(); }

    confetti(ctx, t, 37.08, 46, 540, 560, 51);
    confetti(ctx, t, 38.9, 34, 540, 1320, 61, 1.8, 900);
  }


  // client add-on: the radio-style fast disclaimer after "GO TV!" (voice T 43.5 = v 38.9): "וכל זה ב 350₪ תשלום חד פעמי, פעיל לשנה"
  function priceSpot(ctx, t) {
    const S0 = 38.9; if (t < S0 - 0.3) return;
    const W = CL.W, H = CL.H, port = H > W, k = clamp((t - (S0 - 0.3)) / .3);
    ctx.save(); ctx.fillStyle = `rgba(16,10,4,${.5 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    const cx = W / 2, cy = port ? H * .47 : H * .5, R = Math.min(W, H) * (port ? .44 : .36);
    // ON AIR + fast-forward badge (radio feel)
    const oa = CL.pop(t, S0 - 0.25, .25);
    if (oa) { const oy = port ? cy - R - 150 : 70, ox = port ? cx : cx; ctx.save(); ctx.translate(ox, oy); ctx.scale(oa, oa); ctx.rotate(-.04);
      CL.blob(ctx, -140, 0, 300, 110, { fill: C.red }); A.text(ctx, 'ON AIR', -120, 6, { font: '400 76px Bangers', fill: C.white, stroke: C.ink, lw: 12, dir: 'ltr' });
      ctx.fillStyle = Math.floor(t * 4) % 2 ? '#fff' : '#FFD60A'; ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-250, 0, 16, 0, TAU); ctx.fill(); ctx.stroke();
      for (let i = 1; i <= 3; i++) { ctx.strokeStyle = `rgba(255,255,255,${.9 - i * .2 + .2 * Math.sin(t * 9 - i)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(-250, 0, 16 + i * 22, -.7, .7); ctx.stroke(); ctx.beginPath(); ctx.arc(-250, 0, 16 + i * 22, Math.PI - .7, Math.PI + .7); ctx.stroke(); }
      CL.blob(ctx, 150, 0, 220, 110, { fill: C.yellow }); ctx.fillStyle = C.ink; for (const dx of [95, 150]) { ctx.beginPath(); ctx.moveTo(dx - 26, -30); ctx.lineTo(dx + 22, 0); ctx.lineTo(dx - 26, 30); ctx.closePath(); ctx.fill(); }
      A.text(ctx, 'x2', 222, 6, { font: '400 60px Bangers', fill: C.ink, dir: 'ltr' }); ctx.restore(); }
    // "וכל זה ב"
    const a0 = CL.pop(t, S0 + 0.02, .22); if (a0) CL.chip(ctx, 'וכל זה ב', port ? cx : cx - R * 1.35, port ? cy - R - 20 : cy - R * .35, { size: port ? 64 : 56, rot: -.05, scale: a0, fill: C.white, seed: 71 });
    // price burst
    const pb = CL.pop(t, S0 + 0.42, .35);
    if (pb) { const sk = CL.shake(t, S0 + 0.42, .4, 14), rot = Math.sin(t * 1.3) * .03; ctx.save(); ctx.translate(cx + sk[0], cy + sk[1]); ctx.scale(pb, pb);
      CL.star(ctx, 8, 14, R, 18, { fill: 'rgba(40,20,0,.35)', lw: .01, rot }); CL.star(ctx, 0, 0, R, 18, { fill: C.yellow, lw: 12, rot });
      CL.star(ctx, 0, 0, R * .8, 18, { fill: '#FFE66B', lw: .01, rot: rot + .1 });
      CL.title(ctx, '350', -R * .14, -R * .05, { size: R * .5, dir: 'ltr', fill: C.red, rot: -.06 }); CL.title(ctx, '₪', R * .55, -R * .1, { size: R * .36, dir: 'ltr', fill: C.red, rot: -.06, font: `bold ${Math.round(R * .36)}px 'DejaVu Sans'` }); ctx.restore();
      if (t < S0 + 0.8) CL.sparks(ctx, cx, cy, R * 1.05, R * 1.35, 16, t, { color: C.white, lw: 10 }); }
    const c1 = CL.pop(t, S0 + 1.45, .25); if (c1) CL.chip(ctx, 'תשלום חד פעמי', cx, cy + R * .72, { size: port ? 80 : 64, rot: .03, scale: c1, fill: C.blue, ink: C.white, seed: 72 });
    const c2 = CL.pop(t, S0 + 2.42, .25); if (c2) CL.chip(ctx, 'פעיל לשנה', cx, cy + R * .72 + (port ? 132 : 100), { size: port ? 78 : 64, rot: -.04, scale: c2, fill: C.white, seed: 73 });
  }
  A.scene({ name: 's8_end', start: 36.7, end: 43.0, draw: (ctx, s) => {
    const t = s.t, p = inv(36.7, 37.05, t);
    if (p >= 1) { content(ctx, t); priceSpot(ctx, t); return; }
    const pp = ease.out(clamp(Q(p * 100, 24) / 100)), R = pp * 1450, ring = r => { ctx.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = r * (1 + (hash(i * 1.3 + Q(t, 12) * .1) - .5) * .07); ctx.lineTo(540 + Math.cos(a) * rr, 960 + Math.sin(a) * rr); } ctx.closePath(); };
    ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.32)'; ring(R + 44); ctx.fill(); ctx.fillStyle = C.white; ring(R + 18); ctx.fill(); ring(R); ctx.clip(); content(ctx, t); ctx.restore();
    priceSpot(ctx, s.t);
  } });
})();
