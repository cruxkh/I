// S4 LIBRARY: paper wall calendar, a day page tears off per day, new poster + NEW stamp; then gift box bursts from the shelf, big paper eye.
// CUE 15.79 והכי  |  CUE 16.72 day 1 (ראשון)  |  CUE 18.16 day 7 (שבת)  |  CUE 18.8 shelf  |  CUE 19.54 box opens  |  CUE 19.77 חדש stamp  |  CUE 20.05 eye
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, W = 1080, H = 1920, TAU = Math.PI * 2;
  const T0 = 15.6, T1 = 20.9;
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAY0 = 16.72, DSTEP = 0.24, EXIT = 18.62;
  const dayT = k => DAY0 + DSTEP * k;
  const S = (t, f = 12) => CL.q(t, f);

  // ---------- posters (origin at centre, clipped by scrap)
  const logo = (g, k, cx, cy, w, h) => { const im = CL.logoImg(k); if (!im) return; const s = Math.min(w / im.width, h / im.height); g.drawImage(im, cx - im.width * s / 2, cy - im.height * s / 2, im.width * s, im.height * s); };
  const POST = [
    (g, w, h) => { g.fillStyle = C.ink; g.fillRect(-w / 2, -h / 2, w, h); CL.halftone(g, -w / 2, -h / 2, w, h, '#3a3a3a', 22, .5, { fade: 't' }); logo(g, 'netflix', 0, -h * .16, w * .86, 90); g.fillStyle = C.red; g.beginPath(); g.moveTo(-40, h * .05); g.lineTo(50, h * .2); g.lineTo(-40, h * .35); g.closePath(); g.fill(); g.lineWidth = 7; g.strokeStyle = '#fff'; g.stroke(); },
    (g, w, h) => { g.fillStyle = C.yellow; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = C.orange; g.beginPath(); g.arc(30, -h * .12, w * .27, 0, TAU); g.fill(); g.lineWidth = 7; g.strokeStyle = C.ink; g.stroke(); g.fillStyle = C.blue; g.beginPath(); g.moveTo(-w / 2, h / 2); g.lineTo(-w * .2, h * .02); g.lineTo(w * .1, h / 2); g.fill(); g.stroke(); g.fillStyle = C.green; g.beginPath(); g.moveTo(-w * .1, h / 2); g.lineTo(w * .28, -h * .05); g.lineTo(w / 2 + 10, h / 2); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-w * .25, -h * .32, 42, 20, 0, 0, TAU); g.fill(); g.stroke(); },
    (g, w, h) => { g.fillStyle = C.blue; g.fillRect(-w / 2, -h / 2, w, h); CL.halftone(g, -w / 2, -h / 2, w, h, '#4f7bff', 22, .3, { fade: 'b' }); logo(g, 'disney', 0, -h * .1, w * .92, 130); CL.star(g, -w * .28, h * .26, 34, 8, { lw: 6 }); CL.star(g, w * .2, h * .3, 24, 8, { lw: 6, fill: C.pink }); CL.star(g, w * .32, h * .12, 16, 8, { lw: 5, fill: '#fff' }); },
    (g, w, h) => { g.fillStyle = C.green; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(-w * .4, -h * .38, w * .8, h * .76); g.beginPath(); g.moveTo(-w * .4, 0); g.lineTo(w * .4, 0); g.stroke(); g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.fill(); g.lineWidth = 8; g.strokeStyle = C.ink; g.stroke(); g.fillStyle = C.ink; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - 1.57; g.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); } g.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - 1.57; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a) * 68, Math.sin(a) * 68); g.stroke(); } },
    (g, w, h) => { g.fillStyle = '#1c1c22'; g.fillRect(-w / 2, -h / 2, w, h); CL.halftone(g, -w / 2, -h / 2, w, h, '#33333d', 22, .8, { fade: 'l' }); logo(g, 'appletv', 0, -h * .08, w * .84, 120); g.fillStyle = C.yellow; g.beginPath(); g.arc(0, h * .28, 34, 0, TAU); g.fill(); g.fillStyle = C.pink; g.beginPath(); g.arc(-74, h * .3, 22, 0, TAU); g.fill(); g.fillStyle = C.green; g.beginPath(); g.arc(72, h * .3, 22, 0, TAU); g.fill(); },
    (g, w, h) => { g.fillStyle = C.pink; g.fillRect(-w / 2, -h / 2, w, h); CL.halftone(g, -w / 2, -h / 2, w, h, '#ff9fcb', 20, .5, { fade: 'r' }); g.fillStyle = C.red; g.beginPath(); g.moveTo(0, h * .26); g.bezierCurveTo(-w * .62, -h * .06, -w * .3, -h * .34, 0, -h * .1); g.bezierCurveTo(w * .3, -h * .34, w * .62, -h * .06, 0, h * .26); g.fill(); g.lineWidth = 8; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.stroke(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.fillStyle = '#fff'; g.beginPath(); g.arc(-w * .28 + Math.cos(a) * 20, -h * .32 + Math.sin(a) * 20, 14, 0, TAU); g.fill(); } g.fillStyle = C.yellow; g.beginPath(); g.arc(-w * .28, -h * .32, 11, 0, TAU); g.fill(); g.font = '900 60px Bangers'; g.textAlign = 'center'; g.direction = 'ltr'; g.fillStyle = C.ink; g.fillText('K-DRAMA', 0, h * .4); },
    (g, w, h) => { g.fillStyle = C.orange; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = C.navy; g.beginPath(); g.arc(0, 0, w * .5, 0, TAU); g.fill(); CL.star(g, -w * .2, -h * .18, 22, 8, { lw: 4, fill: '#fff' }); CL.star(g, w * .26, h * .2, 18, 8, { lw: 4, fill: C.yellow }); g.fillStyle = C.yellow; g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.fill(); g.lineWidth = 8; g.strokeStyle = C.ink; g.stroke(); g.beginPath(); g.ellipse(0, 0, 105, 26, -.4, 0, TAU); g.lineWidth = 10; g.strokeStyle = C.pink; g.stroke(); g.fillStyle = C.ink; g.beginPath(); g.arc(-18, -8, 8, 0, TAU); g.arc(20, -8, 8, 0, TAU); g.fill(); },
    (g, w, h) => { g.fillStyle = C.yellow; g.fillRect(-w / 2, -h / 2, w, h); CL.halftone(g, -w / 2, -h / 2, w, h, '#f0b800', 22, .5, { fade: 't' }); g.fillStyle = C.ink; g.fillRect(-w * .36, -h * .1, w * .72, h * .36); g.save(); g.translate(-w * .36, -h * .1); g.rotate(-.28); g.fillRect(0, -h * .1, w * .72, h * .1); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) g.fillRect(i * w * .15 + 6, -h * .1, w * .07, h * .1); g.restore(); g.fillStyle = '#fff'; g.font = '900 44px Rubik'; g.textAlign = 'center'; g.direction = 'ltr'; g.fillText('NEW', 0, h * .13); },
  ];
  const poster = (ctx, i, cx, cy, w, h, o = {}) => CL.scrap(ctx, cx, cy, w, h, { seed: o.seed ?? i + 4, rot: o.rot || 0, scale: o.scale, rough: 3, shadow: o.shadow ?? 10, fill: '#fff', draw: (g, ww, hh) => POST[i](g, ww, hh) });

  // ---------- stamps
  const stamp = (ctx, txt, cx, cy, t, t0, o = {}) => {
    const u = t - t0; if (u < 0) return; const k = Math.floor(u * 24), sc = [2.3, 1.35, 1.0, 1.08, 1][Math.min(k, 4)] * (o.size || 1), rot = (o.rot ?? -.2), sh = CL.shake(t, t0 + .08, .3, 9);
    ctx.save(); ctx.translate(cx + sh[0], cy + sh[1]); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.beginPath(); ctx.roundRect(-72 + 6, -34 + 8, 144, 68, 12); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.roundRect(-72, -34, 144, 68, 12); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-62, -25, 124, 50, 8); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.roundRect(-72, -34, 144, 68, 12); ctx.stroke();
    ctx.font = '900 52px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 3); ctx.restore();
  };

  // ---------- calendar geometry
  const COLX = [915, 665, 415, 165], ROWY = [640, 1015], CW = 225, CHH = 320;
  const cellPos = k => k < 4 ? [COLX[k], ROWY[0]] : [COLX[k - 4], ROWY[1]];

  const dayPage = (ctx, k, cx, cy, p, t) => {   // blank tear-off page for day k; p = tear progress 0..1
    const seed = k + 20, jt = CL.j(t, seed, 1.5);
    ctx.save(); ctx.translate(cx + jt[0], cy + jt[1]);
    if (p > 0) { ctx.translate(-CW * .5 * 0 + p * 60, -CHH / 2 + 4); ctx.rotate(p * (k % 2 ? .6 : -.6)); ctx.translate(0, CHH / 2 - 4); ctx.translate(0, -p * 140); ctx.scale(1, 1 - p * .35); }
    CL.scrap(ctx, 0, 0, CW, CHH, { fill: C.white, seed, rough: 3, shadow: p > 0 ? 18 : 8, border: 0, draw: (g, w, h) => {
      g.fillStyle = C.red; g.fillRect(-w / 2, -h / 2, w, 84);
      g.fillStyle = '#fff'; g.font = '900 46px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.fillText(DAYS[k], 0, -h / 2 + 46);
      g.fillStyle = C.ink; g.font = '900 150px Rubik'; g.direction = 'ltr'; g.fillText(String(k + 1), 0, 44);
      g.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < 4; i++) g.fillRect(-w * .36, h / 2 - 60 + i * 12, w * .72, 3);
    } });
    ctx.restore();
  };

  const qmark = (ctx, cx, cy, t) => {
    const jt = CL.j(t, 55, 2);
    ctx.save(); ctx.translate(cx + jt[0], cy + jt[1]); ctx.rotate(.05);
    CL.scrap(ctx, 0, 0, CW, CHH, { fill: '#fbe9a8', seed: 41, rough: 3, border: 0, shadow: 8 });
    ctx.setLineDash([16, 12]); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.strokeRect(-CW / 2 + 16, -CHH / 2 + 16, CW - 32, CHH - 32); ctx.setLineDash([]);
    ctx.font = '900 190px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = C.orange; ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeText('?', 0, 10); ctx.fillText('?', 0, 10);
    ctx.restore();
  };

  // ---------- calendar sheet
  const drawCalendar = (ctx, t) => {
    // nail + sheet
    const sheet = { x: 540, y: 800, w: 1000, h: 900 };
    // shadow & sheet
    CL.scrap(ctx, 540, 800 + 0, 1000, 950, { fill: C.cream, seed: 71, rough: 5, shadow: 16, draw: (g, w, h) => { CL.halftone(g, -w / 2, -h / 2, w, h, 'rgba(31,79,255,.1)', 30, .5, { fade: 'b' }); } });
    // red header band
    ctx.save(); CL.tornPath(ctx, 540 - 500, 800 - 475, 1000, 950, { seed: 71, rough: 5 }); ctx.clip();
    ctx.fillStyle = C.red; ctx.fillRect(40, 325, 1000, 130); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(40, 445, 1000, 10);
    ctx.restore();
    // header text: הספרייה (from 16.72) + השבוע later
    const s1 = CL.pop(t, DAY0 - .04, .25);
    if (s1 > 0) { ctx.save(); ctx.translate(790, 392); ctx.scale(s1, s1); ctx.font = '900 92px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillStyle = '#fff'; ctx.fillText('הספרייה', 0, 4); ctx.restore(); }
    const s2 = CL.pop(t, 17.61 - .04, .25);
    if (s2 > 0) { ctx.save(); ctx.translate(310, 392); ctx.scale(s2, s2); CL.blob(ctx, 0, 0, 330, 96, { fill: C.yellow, rot: -.03 }); ctx.font = '900 70px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillStyle = C.ink; ctx.fillText('כל השבוע', 0, 4); ctx.restore(); }
    // binder rings
    for (let i = 0; i < 9; i++) { const x = 120 + i * 105; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(x - 9, 300, 18, 56, 9); ctx.fill(); ctx.fillStyle = '#d7d7dc'; ctx.beginPath(); ctx.roundRect(x - 5, 302, 6, 50, 3); ctx.fill(); }
    // cells
    for (let k = 0; k < 7; k++) {
      const [cx, cy] = cellPos(k), tk = dayT(k), tear = clamp((t - (tk - .15)) / .15), tq = Math.floor(tear * 3) / 3 + (tear >= 1 ? 0 : 0);
      const pp = tear >= 1 ? 1 : tq;
      if (t >= tk - .001) {   // poster underneath (placed at tk)
        const sc = CL.pop(t, tk, .3), jt = CL.j(t, k + 30, 2), rot = (hash(k * 3.7) - .5) * .12 + jt[2];
        poster(ctx, k, cx + jt[0], cy + jt[1], CW, CHH, { rot, scale: sc, seed: k + 4 });
        if (t >= tk + .05) CL.tape(ctx, cx + jt[0] + (k % 2 ? 60 : -60), cy - CHH / 2 - 4, (k % 2 ? .35 : -.35), 96, 34);
        stamp(ctx, 'חדש', cx - 30, cy + CHH / 2 - 26, t, tk + .1, { rot: k % 2 ? .18 : -.22, size: .85 });
      }
      if (t < tk + .001 || pp < 1) { if (pp < 1 || t < tk) dayPage(ctx, k, cx, cy, t < tk - .15 ? 0 : pp, t); }
      if (pp >= 1 && t < tk + .3) { /* flown page fully gone */ }
    }
    // ? cell
    const [qx, qy] = cellPos(7 - 0 + 0 + 0 - 0); void qx; void qy;
    const qs = CL.pop(t, DAY0 + DSTEP * 6, .3);
    ctx.save(); ctx.translate(COLX[3], ROWY[1]); if (qs > 0) ctx.scale(qs, qs); ctx.translate(-COLX[3], -ROWY[1]); qmark(ctx, COLX[3], ROWY[1], t); ctx.restore();
    // marker circle scanning: hops cell to cell
    const cur = Math.floor((t - DAY0 + .02) / DSTEP);
    if (cur >= 0 && cur < 7) { const [cx, cy] = cellPos(cur), jt = CL.j(t, cur + 60, 3); CL.circle(ctx, cx + jt[0], cy + jt[1], 152, 202, 1, { color: C.blue, lw: 11, seed: cur + Math.floor(t * 12) % 3 }); }
    // marker arrow sweeping right-to-left under the grid
    const ap = clamp((t - DAY0) / (DSTEP * 6.5)); if (ap > 0) CL.arrow(ctx, 985, 1228, 95, 1236, ap, { color: C.ink, lw: 12, bend: 24 });
  };

  // ---------- library shelf
  const COVERS = [C.red, C.blue, C.yellow, C.green, C.pink, C.orange, C.navy, '#8a5cf6'];
  const drawShelf = (ctx, t, rise) => {
    ctx.save(); ctx.translate(0, (1 - rise) * 1500);
    const x0 = 55, x1 = 1025, rows = [330, 610, 890];
    CL.scrap(ctx, 540, 610, 990, 900, { fill: '#a97b4f', seed: 81, rough: 5, shadow: 16, draw: (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 14; i++) g.fillRect(-w / 2, -h / 2 + i * 66 + 10, w, 6); } });
    rows.forEach((ry, ri) => {
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x0 + 20, ry - 6, x1 - x0 - 40, 10 * 0); // placeholder none
      ctx.fillStyle = '#e8d3ae'; CL.tornPath(ctx, x0 + 24, ry - 250, x1 - x0 - 48, 250, { seed: 90 + ri, rough: 2 }); ctx.fill();
      const r = rng(ri * 17 + 3); let x = x0 + 34, i = 0;
      while (x < x1 - 60) {
        const w = 62 + r() * 28, h = 170 + r() * 64, col = COVERS[Math.floor(r() * COVERS.length)], jt = CL.j(t, ri * 20 + i, 1.2), tilt = (r() - .5) * .05;
        ctx.save(); ctx.translate(x + w / 2 + jt[0], ry - 6 + jt[1]); ctx.rotate(tilt); ctx.fillStyle = col; ctx.fillRect(-w / 2, -h, w, h); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.strokeRect(-w / 2, -h, w, h);
        ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 + 8, -h + 24, w - 16, 26); ctx.fillStyle = C.ink; ctx.fillRect(-w / 2 + 14, -h + 34, w - 28, 6); if (r() > .5) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, -h * .45, 12, 0, TAU); ctx.fill(); } ctx.restore();
        x += w + 8; i++;
      }
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x0 + 10, ry, x1 - x0 - 20, 22); ctx.fillStyle = '#7a5230'; ctx.fillRect(x0 + 10, ry, x1 - x0 - 20, 8);
    });
    ctx.restore();
  };

  // ---------- gift box
  const BX = 540, BY = 1105;
  const drawBox = (ctx, t) => {
    const tOpen = 19.54, bt = t < tOpen ? clamp((t - 18.95) / (tOpen - 18.95)) : 0, amp = t < tOpen ? 3 + bt * 12 : 0, jt = CL.j(t, 99, amp, 24);
    const popS = t < 18.95 ? 0 : (t < tOpen ? 1 : 1 + Math.max(0, .18 - (t - tOpen) * 1.2)), open = t >= tOpen;
    const bs = t < 18.95 ? CL.pop(t, 18.8, .3) : popS; if (bs <= 0) return;
    ctx.save(); ctx.translate(BX + jt[0], BY + jt[1]); ctx.scale(bs, bs * (open ? 1 : 1 + Math.sin(t * 60) * .01 * bt));
    // body
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.fillRect(-210 + 14, -140 + 20, 420, 300);
    if (open) { ctx.fillStyle = C.ink; ctx.fillRect(-190, -150, 380, 40); }   // dark mouth
    ctx.fillStyle = C.red; ctx.fillRect(-210, -140, 420, 300); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.strokeRect(-210, -140, 420, 300);
    CL.halftone(ctx, -210, -140, 420, 300, '#ff7a70', 26, .5, { fade: 'b' });
    ctx.fillStyle = C.yellow; ctx.fillRect(-42, -140, 84, 300); ctx.strokeRect(-42, -140, 84, 300);
    ctx.restore();
  };
  const drawLid = (ctx, t) => {
    const tOpen = 19.54; if (t < 18.8) return;
    const bt = clamp((t - 18.95) / (tOpen - 18.95)), jt = CL.j(t, 98, t < tOpen ? 3 + bt * 12 : 0, 24);
    let x = BX + jt[0], y = BY - 140 - 40 + jt[1], rot = 0, sc = t < 18.95 ? CL.pop(t, 18.8, .3) : 1;
    if (t >= tOpen) { const u = S(t - tOpen, 12), a = Math.min(u, 1.2); x = BX - 40 - a * 300 + u * 40; y = BY - 180 - Math.sin(clamp(u / .8) * Math.PI) * 500 * .55 - a * 420 + a * a * 180 * 1.4; rot = -u * 4.5; sc = 1; if (t > tOpen + 1) return; }
    else if (t >= tOpen - .12) { y -= 8; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.fillRect(-235 + 12, -45 + 16, 470, 90);
    ctx.fillStyle = '#ff5a4d'; ctx.fillRect(-235, -45, 470, 90); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.strokeRect(-235, -45, 470, 90);
    ctx.fillStyle = C.yellow; ctx.fillRect(-42, -45, 84, 90); ctx.strokeRect(-42, -45, 84, 90);
    // bow
    ctx.fillStyle = C.yellow; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 62, -78, 66, 36, s * -.5, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, -60, 24, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  // ---------- burst posters
  const BURST = [ // [poster idx, target x, y, rot, size, delay]
    [0, 150, 1010, -.3, .85, 0], [2, 930, 1000, .28, .85, .03], [1, 130, 320, -.2, .95, .06], [3, 950, 330, .22, .95, .09],
    [4, 150, 690, .16, .9, .12], [5, 940, 680, -.18, .9, .05], [6, 300, 235, -.1, .8, .1], [7, 780, 245, .12, .8, .08]];
  const drawBurst = (ctx, t) => {
    const tb = 19.54;
    BURST.forEach(([pi, tx, ty, rot, sz, dl], i) => {
      const u = (t - tb - dl) / .32; if (u < 0) return; const p = ease.out(clamp(Math.floor(u * 5) / 5)), arc = Math.sin(p * Math.PI) * 140;
      const jt = CL.j(t, i + 120, 3), x = lerp(BX, tx, p), y = lerp(BY - 150, ty, p) - arc, s = lerp(.3, 1, p) * sz * (u > 1 ? 1 + Math.max(0, .1 - (u - 1) * .3) : 1);
      poster(ctx, pi, x + jt[0], y + jt[1], 200, 270, { rot: rot * p + jt[2], scale: s, seed: pi + 4 });
      if (u > 1) { CL.tape(ctx, x + jt[0], y - 135 * sz - 2, rot + .3, 90, 32); stamp(ctx, 'חדש', x + (tx < 540 ? 55 : -55), y + 120 * sz, t, tb + dl + .32 + .05, { rot: tx < 540 ? -.2 : .2, size: .7 }); }
    });
  };

  // ---------- eye
  const drawEye = (ctx, t) => {
    const t0 = 20.05; if (t < t0) return; const u = t - t0, ex = 540, ey = 730, ew = 720, eh = 420;
    const pop = CL.pop(t, t0, .3), jt = CL.j(t, 200, 2.5);
    const open = clamp(Math.floor(inv(0, .2, u) * 4) / 4);
    ctx.save(); ctx.translate(ex + jt[0], ey + jt[1]); ctx.rotate(-.03 + jt[2]); ctx.scale(pop, pop);
    // paper backing (torn white outline) and shadow
    const almond = (s, o = 0) => { ctx.beginPath(); ctx.moveTo(-ew / 2 * s, o); ctx.bezierCurveTo(-ew * .22 * s, -eh * .62 * s * open + o, ew * .22 * s, -eh * .62 * s * open + o, ew / 2 * s, o); ctx.bezierCurveTo(ew * .22 * s, eh * .62 * s * open + o, -ew * .22 * s, eh * .62 * s * open + o, -ew / 2 * s, o); ctx.closePath(); };
    ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.save(); ctx.translate(14, 22); almond(1.08); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; almond(1.08); ctx.fill();
    ctx.fillStyle = '#fffdf6'; almond(1); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); almond(1); ctx.clip();
    // look direction (stepped)
    const seq = [[-1, -.5], [-1, -.5], [1, -.5], [1, .55], [-1, .55], [0, 0], [0, 0]], k = Math.min(seq.length - 1, Math.floor(Math.max(0, u - .22) * 7)), [lx, ly] = u < .22 ? [0, 0] : seq[k];
    const px = lx * 150, py = ly * 60;
    // white paper cracks
    ctx.strokeStyle = 'rgba(200,60,60,.35)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = -2.7 + i * .55; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 330, Math.sin(a) * 120); ctx.lineTo(Math.cos(a) * 270, Math.sin(a) * 95); ctx.stroke(); }
    // iris
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(px, py, 150, 0, TAU); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, 148, 0, TAU); ctx.clip(); CL.halftone(ctx, px - 150, py - 150, 300, 300, '#6f92ff', 22, .5, { fade: 'radial', k: 1 }); ctx.restore();
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 12; ctx.setLineDash([26, 20]); ctx.beginPath(); ctx.arc(px, py, 116, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(px, py, 70, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(px - 42, py - 44, 30, 30); ctx.fillRect(px + 14, py + 6, 14, 14);
    ctx.restore();
    // upper lid line + lashes (marker)
    almond(1); ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.stroke();
    if (open > .5) { ctx.lineWidth = 14; ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const tt = (i + .7) / 8.4, x = lerp(-ew * .42, ew * .42, tt), yy = -eh * .5 * open * Math.sin(tt * Math.PI) * .98 - 6, an = -1.57 + (tt - .5) * 1.3; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + Math.cos(an) * 70, yy + Math.sin(an) * 70); ctx.stroke(); } }
    // eyebrow scrap
    ctx.restore();
    if (u < .4) CL.sparks(ctx, ex, ey, 300, 420, 14, t, { color: C.ink, lw: 9 });
  };

  // ---------- entry transition: torn cream sheet rises from the bottom
  const tearEdge = (ctx, y, seed, dir = 1) => { const r = rng(seed), n = 30; ctx.moveTo(-20, H + 20); ctx.lineTo(-20, y + 20); for (let i = 0; i <= n; i++) ctx.lineTo(i / n * (W + 40) - 20, y + (r() - .5) * 46 + (i % 2 ? 12 : -12)); ctx.lineTo(W + 20, H + 20); ctx.closePath(); };

  A.scene({ name: 's4_library', start: T0, end: T1, draw: (ctx, s) => {
    const t = s.t, ph = t >= EXIT;
    const wipe = clamp((t - T0) / .28), wq = Math.floor(wipe * 4) / 4, cover = t < T0 + .28;
    ctx.save();
    if (cover) {   // white torn margin strip then clip
      const y = lerp(H + 60, -40, ease.out(wq >= 1 ? 1 : wq + .0)), r = ctx.save();
      ctx.fillStyle = C.white; ctx.beginPath(); tearEdge(ctx, y - 22, 5); ctx.fill();
      ctx.beginPath(); tearEdge(ctx, y, 6); ctx.clip();
    }
    CL.paper(ctx, ph ? 'kraft' : 'cream', ph ? {} : { dots: 'rgba(255,214,10,.5)', dotSize: 44, dotFade: 't', dotAlpha: .5 });
    if (!ph) {
      // "והכי חשוב" headline chips
      const a = CL.pop(t, 15.79 - .04, .3), b = CL.pop(t, 16.10 - .04, .3), jt = CL.j(t, 3, 3);
      const hy = 190 + (t > DAY0 - .1 ? 0 : 0);
      if (a > 0) CL.chip(ctx, 'והכי', 720 + jt[0], hy + jt[1], { size: 130, rot: -.06, scale: a, seed: 3, fill: C.white });
      if (b > 0) { CL.chip(ctx, 'חשוב', 335 - jt[0], hy + 6 - jt[1], { size: 150, rot: .05, scale: b, seed: 8, fill: C.yellow }); CL.underline(ctx, 120, 560, hy + 105, clamp((t - 16.15) / .2), { color: C.red, lw: 14, seed: 4 }); }
      drawCalendar(ctx, t);
    } else {
      drawShelf(ctx, t, ease.out(clamp(Math.floor(inv(EXIT, EXIT + .3, t) * 4) / 4)));
      // calendar flies off the wall
      const fu = S(t - EXIT, 12);
      if (fu < .34) { ctx.save(); const p = ease.in(clamp(fu / .34)); ctx.translate(540, 300); ctx.rotate(-p * .5); ctx.translate(-540 - p * 200, -300 - p * 1500); drawCalendar(ctx, t); ctx.restore(); }
      // shelf sign
      const sg = CL.pop(t, 18.8 - .04, .3);
      if (sg > 0) CL.chip(ctx, 'הספרייה', 540, 170, { size: 110, rot: -.03, scale: sg, seed: 12, fill: C.yellow });
      drawBox(ctx, t); drawLid(ctx, t); drawBurst(ctx, t);
      // giant חדש stamp CUE 19.77
      if (t >= 19.77 - .03) { const u = t - (19.77 - .03), sc = [2.6, 1.4, 1.0, 1.1, 1][Math.min(4, Math.floor(u * 24))]; const sh = CL.shake(t, 19.77, .4, 16); ctx.save(); ctx.translate(540 + sh[0], 350 + sh[1]); ctx.rotate(-.07); ctx.scale(sc, sc); CL.title(ctx, 'חדש!', 0, 0, { size: 260, fill: C.red, rot: 0 }); ctx.restore(); }
      drawEye(ctx, t);
    }
    ctx.restore();
    if (cover) ctx.restore();
  } });
})();
