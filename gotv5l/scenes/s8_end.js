// s8 END CARD (36.7 to 40.0), silent. Paper-craft GOTV logo, tagline strip, smart TV installing the app. Compositor fades to black at 39.75+.
(() => {
  const { clamp, inv, ease, hash, TAU } = A;
  const C = CL.C, W = CL.W, H = CL.H;
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
    ctx.save(); ctx.translate(620, 400); ctx.rotate(Q(t, 8) * .04); ctx.fillStyle = 'rgba(255,214,10,.38)';
    for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1700, i * TAU / 24, (i + 1) * TAU / 24); ctx.closePath(); ctx.fill(); } ctx.restore();

    const j = CL.j(t, 1, 3);
    // blue torn panel + logo
    const ps = CL.pop(t, 36.98, .3);
    if (ps) { CL.scrap(ctx, 620 + j[0], 400 + j[1], 1060, 520, { fill: C.blue, seed: 21, rot: .02, scale: ps, draw: (g, w, h) => CL.halftone(g, -w / 2, -h / 2, w, h, '#5B82FF', 32, .5, { fade: 'radial' }) });
      if (ps === 1 || t > 37.2) { CL.tape(ctx, 130, 170, -.5, 170, 50); CL.tape(ctx, 1110, 630, -.45, 170, 50); } }
    const ls = CL.pop(t, 37.08, .32);        // CUE 37.08 logo slam
    if (ls) { const sk = CL.shake(t, 37.08, .4, 12); CL.title(ctx, 'GOTV', 620 + j[0] + sk[0], 395 + j[1] + sk[1], { size: 330, dir: 'ltr', rot: -.05 + j[2], scale: ls }); }
    const s1 = CL.pop(t, 37.25, .3), sj = CL.j(t, 3, 3);
    if (s1) { CL.star(ctx, 70 + sj[0], 110 + sj[1], 78 * s1, 10, { fill: C.red, rot: .3 }); CL.star(ctx, 1170 - sj[0], 700 + sj[1], 70 * s1, 8, { fill: C.pink, rot: -.2 }); CL.star(ctx, 1150 + sj[1], 120, 50 * s1, 8, { fill: C.orange, rot: .1 }); }

    // tagline strip
    const cs = CL.pop(t, 37.45, .3);
    if (cs) { const cj = CL.j(t, 4, 2); ctx.save(); ctx.translate(620 + cj[0], 800 + cj[1]);
      const d = CL.chip(ctx, 'הטלוויזיה של ישראל', 0, 0, { size: 100, fill: C.yellow, rot: .025, scale: cs, seed: 5 });
      CL.underline(ctx, -d.w / 2 + 40, d.w / 2 - 40, 96, inv(37.8, 38.05, t), { color: C.red, lw: 13, seed: 3 }); ctx.restore(); }

    // smart TV with install animation
    const ts = CL.pop(t, 37.65, .3);
    if (ts) { const tj = CL.j(t, 6, 2), cx = 1520 + tj[0], cy = 430 + tj[1];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(ts, ts); ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(-220, 216); ctx.lineTo(-150, 216); ctx.lineTo(-180, 282); ctx.lineTo(-250, 282); ctx.closePath(); ctx.moveTo(220, 216); ctx.lineTo(150, 216); ctx.lineTo(180, 282); ctx.lineTo(250, 282); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-364, -249, 728, 498, 46); ctx.fill(); ctx.restore();
      CL.tv(ctx, cx, cy, 700, 470, { scale: ts, draw: (g, sw, sh) => {
        g.fillStyle = C.cream; g.fillRect(0, 0, sw, sh); CL.halftone(g, 0, 0, sw, sh, '#E5D9BC', 24, .5, {});
        const ip = CL.pop(t, 37.95, .3) || .01;
        g.save(); g.translate(sw / 2, sh / 2 - 34); g.scale(ip, ip); g.fillStyle = 'rgba(40,20,0,.3)'; g.beginPath(); g.roundRect(-84 + 8, -84 + 12, 168, 168, 40); g.fill();
        g.fillStyle = C.blue; g.strokeStyle = C.ink; g.lineWidth = 9; g.beginPath(); g.roundRect(-84, -84, 168, 168, 40); g.fill(); g.stroke();
        const bob = t > 38.0 && t < 38.85 ? Math.sin(Q(t) * 14) * 5 : 0; g.translate(0, bob);
        g.strokeStyle = C.ink; g.lineWidth = 34; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(0, -46); g.lineTo(0, 24); g.moveTo(-36, -12); g.lineTo(0, 30); g.lineTo(36, -12); g.stroke();
        g.strokeStyle = C.yellow; g.lineWidth = 20; g.beginPath(); g.moveTo(0, -46); g.lineTo(0, 24); g.moveTo(-36, -12); g.lineTo(0, 30); g.lineTo(36, -12); g.stroke();
        g.translate(0, -bob); g.strokeStyle = C.white; g.lineWidth = 12; g.beginPath(); g.moveTo(-50, 56); g.lineTo(50, 56); g.stroke(); g.restore();
        const pr = ease.out(inv(38.05, 38.85, Q(t, 12))); g.fillStyle = C.white; g.strokeStyle = C.ink; g.lineWidth = 7; g.beginPath(); g.roundRect(sw / 2 - 190, sh - 78, 380, 34, 17); g.fill(); g.stroke();
        if (pr > 0) { g.fillStyle = C.green; g.beginPath(); g.roundRect(sw / 2 - 190, sh - 78, 380 * pr, 34, 17); g.fill(); g.stroke(); }
        const ck = CL.pop(t, 38.9, .3); if (ck) { g.save(); g.translate(sw / 2 + 96, sh / 2 - 100); g.scale(ck, ck); g.fillStyle = C.green; g.strokeStyle = C.ink; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.fill(); g.stroke();
          g.strokeStyle = C.white; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-20, 2); g.lineTo(-6, 16); g.lineTo(22, -14); g.stroke(); g.restore(); }
      } });
      if (t > 38.9 && t < 39.3) CL.sparks(ctx, cx, cy - 20, 320, 400, 14, t, { color: C.ink, lw: 9 });
    }

    // small parenthesised line on a paper tag
    const tg = CL.pop(t, 38.15, .3);
    if (tg) { const gj = CL.j(t, 8, 2); ctx.save(); ctx.translate(1520 + gj[0], 820 + gj[1]); ctx.rotate(-.015); ctx.scale(tg, tg);
      CL.scrap(ctx, 0, 0, 820, 110, { fill: C.white, seed: 9, rough: 4, shadow: 9 }); ctx.font = '700 48px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink;
      ctx.fillText('(התקנת אפליקציה על המסך החכם)', 0, 4); ctx.restore(); }

    confetti(ctx, t, 37.08, 46, 620, 400, 51);
    confetti(ctx, t, 38.9, 34, 1520, 430, 61, 1.8, 900);
  }

  A.scene({ name: 's8_end', start: 36.7, end: 40.0, draw: (ctx, s) => {
    const t = s.t, p = inv(36.7, 37.05, t);
    if (p >= 1) { content(ctx, t); return; }
    const pp = ease.out(clamp(Q(p * 100, 24) / 100)), R = pp * 1250, ring = r => { ctx.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = r * (1 + (hash(i * 1.3 + Q(t, 12) * .1) - .5) * .07); ctx.lineTo(960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr); } ctx.closePath(); };
    ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.32)'; ring(R + 44); ctx.fill(); ctx.fillStyle = C.white; ring(R + 18); ctx.fill(); ring(R); ctx.clip(); content(ctx, t); ctx.restore();
  } });
})();
