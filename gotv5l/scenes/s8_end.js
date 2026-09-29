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
    const ts = CL.pop(t, 37.1, .3);
    if (ts) { const tj = CL.j(t, 6, 2), cx = 1500 + tj[0], cy = 430 + tj[1];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(ts, ts); ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(-220, 216); ctx.lineTo(-150, 216); ctx.lineTo(-180, 282); ctx.lineTo(-250, 282); ctx.closePath(); ctx.moveTo(220, 216); ctx.lineTo(150, 216); ctx.lineTo(180, 282); ctx.lineTo(250, 282); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(-364, -249, 728, 498, 46); ctx.fill(); ctx.restore();
      CL.tv(ctx, cx, cy, 700, 470, { scale: ts, draw: (g, sw, sh) => {
        // client: a BEAR on the TV that says "GO TV!" with synced lips (bear.js)
        g.fillStyle = '#FFE38A'; g.fillRect(0, 0, sw, sh); CL.halftone(g, 0, 0, sw, sh, '#F6C94A', 26, .5, { fade: 'radial' });
        g.save(); g.globalAlpha = .35; g.translate(sw / 2, sh * .55); g.rotate(t * .25); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.fillStyle = i % 2 ? '#fff' : '#FFD60A'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -sw); g.lineTo(60, -sw); g.fill(); } g.restore();
        const bp = CL.pop(t, 37.14, .35), bo = ease.in(clamp((t - 38.78) / .3)); if (bp && bo < 1) { g.save(); g.translate(sw / 2, sh * .54 + (1 - Math.min(1, bp)) * 80 + bo * sh * 1.1); g.rotate(bo * .5); g.scale(bp, bp); CL.bear(g, t, sh * .40); g.restore(); }
        priceTV(g, t, sw, sh);
      } });
      
    }

    // small parenthesised line on a paper tag
    const tg = CL.pop(t, 38.15, .3);
    if (tg) { const gj = CL.j(t, 8, 2); ctx.save(); ctx.translate(1500 + gj[0], 840 + gj[1]); ctx.rotate(-.015); ctx.scale(tg, tg);
      CL.scrap(ctx, 0, 0, 700, 100, { fill: C.white, seed: 9, rough: 4, shadow: 9 }); ctx.font = '700 42px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink;
      ctx.fillText('(התקנת אפליקציה על המסך החכם)', 0, 4); ctx.restore(); }

    confetti(ctx, t, 37.08, 46, 620, 400, 51);
  }



  // client v3: premium TV-commercial price reveal INSIDE the TV screen (voice T 43.5 = v 38.9)
  function priceTV(g, t, sw, sh) {
    const S0 = 38.9, T_IN = 38.78; if (t < T_IN) return;
    const E = ease, cl = clamp, PI = Math.PI;
    const K = priceTV._k || (priceTV._k = {});
    const cv = (name, w, h) => { let c = K[name]; if (!c) { c = K[name] = document.createElement('canvas'); } if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); return x; };
    const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
    const cx = sw / 2, D = Math.hypot(sw, sh) / 2;

    // ---------- iris-in transition from the bear screen ----------
    const ir = E.inOut(cl((t - T_IN) / .34)), R0 = ir * D * 1.02;
    g.save();
    if (ir < 1) { g.beginPath(); g.arc(cx, sh * .5, Math.max(1, R0), 0, TAU); g.clip(); }

    // ---------- background: deep blue, radial glow, slow light sweep, soft bokeh, vignette ----------
    let gr = g.createRadialGradient(cx, sh * .46, 0, cx, sh * .46, D * 1.05);
    gr.addColorStop(0, '#2F6BFF'); gr.addColorStop(.38, '#1841C9'); gr.addColorStop(.75, '#0B1E78'); gr.addColorStop(1, '#050E45');
    g.fillStyle = gr; g.fillRect(0, 0, sw, sh);
    for (let i = 0; i < 7; i++) {   // very soft out-of-focus lights
      const bx = sw * (.08 + .84 * hash(i * 3.3 + 1)) + Math.sin(t * .35 + i) * sw * .02, by = sh * (.1 + .8 * hash(i * 5.1 + 2)) + Math.cos(t * .3 + i * 2) * sh * .02, br = sh * (.07 + .1 * hash(i * 7.7));
      const bg = g.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, `rgba(140,190,255,${.10 + .06 * hash(i * 9.1)})`); bg.addColorStop(1, 'rgba(140,190,255,0)');
      g.fillStyle = bg; g.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    { // slow diagonal light sweep
      const ph = ((t - 38.6) / 3.2) % 1, sx = -sw * .6 + ph * sw * 2.2;
      g.save(); g.translate(sx, 0); g.rotate(-.35);
      const lg = g.createLinearGradient(-sw * .18, 0, sw * .18, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(200,225,255,.09)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.fillRect(-sw * .18, -sh, sw * .36, sh * 3); g.restore();
    }
    const vg = g.createRadialGradient(cx, sh * .48, sh * .35, cx, sh * .48, D * 1.1); vg.addColorStop(0, 'rgba(2,6,30,0)'); vg.addColorStop(1, 'rgba(2,6,30,.62)');
    g.fillStyle = vg; g.fillRect(0, 0, sw, sh);

    // ---------- layout ----------
    const LAND = 40.40, R_ST = 39.52, cyP = sh * .515;
    g.font = `800 100px Rubik`; const cw100 = g.measureText('0').width, sw100 = g.measureText('₪').width * .66;
    const S = Math.min(sh * .37, sw * .74 / ((3 * cw100 + 8 + sw100) / 100)), cw = cw100 * S / 100, gap = S * .07, wS = sw100 * S / 100;
    const totW = 3 * cw + gap + wS;
    g.font = `800 ${S}px Rubik`; const ascD = g.measureText('0').actualBoundingBoxAscent;
    g.font = `800 ${S * .66}px Rubik`; const ascS = g.measureText('₪').actualBoundingBoxAscent;
    const x0 = cx - totW / 2, colX = i => x0 + cw * (i + .5), shX = x0 + 3 * cw + gap + wS / 2;

    // warm glow behind the price (grows at landing)
    const land = cl((t - (LAND - .05)) / .25), flash = Math.exp(-Math.max(0, t - LAND) * 4) * land;
    const glowA = .12 + .2 * land + .35 * flash;
    if (t > R_ST - .1) { const gg = g.createRadialGradient(cx, cyP, 0, cx, cyP, sh * .62); gg.addColorStop(0, `rgba(255,205,90,${glowA})`); gg.addColorStop(.45, `rgba(255,170,40,${glowA * .35})`); gg.addColorStop(1, 'rgba(255,170,40,0)');
      g.globalAlpha = cl((t - R_ST + .1) / .3); g.fillStyle = gg; g.fillRect(0, 0, sw, sh); g.globalAlpha = 1; }

    // ---------- "וכל זה ב" + drawing gold line ----------
    { const a = E.out(cl((t - S0) / .45)), fs = sh * .088, y = sh * .15 + (1 - a) * sh * .05;
      if (a > 0) { g.save(); g.globalAlpha = a; g.font = `700 ${fs}px Rubik`; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.shadowColor = 'rgba(0,6,40,.55)'; g.shadowBlur = fs * .3; g.shadowOffsetY = fs * .08; g.fillStyle = '#FFFFFF'; g.fillText('וכל זה ב', cx, y); g.restore();
        const lw = E.inOut(cl((t - S0 - .12) / .5)), half = fs * 2.6 * lw, ly = sh * .15 + fs * .78;
        if (lw > 0) { const lg = g.createLinearGradient(cx - half, 0, cx + half, 0); lg.addColorStop(0, 'rgba(255,210,90,0)'); lg.addColorStop(.25, '#FFD45A'); lg.addColorStop(.5, '#FFF1B8'); lg.addColorStop(.75, '#FFD45A'); lg.addColorStop(1, 'rgba(255,210,90,0)');
          g.fillStyle = lg; g.fillRect(cx - half, ly - 1.2, half * 2, 2.4);
          g.save(); g.globalAlpha = lw; g.fillStyle = '#FFE38A'; for (const s of [-1, 1]) { g.save(); g.translate(cx + s * (half + 6), ly); g.rotate(PI / 4); g.fillRect(-2.6, -2.6, 5.2, 5.2); g.restore(); } g.restore(); } } }

    // ---------- gold glyph with extrusion + bevel highlight ----------
    const glyph = (c, ch, x, y, size, asc, sy) => {
      c.save(); c.translate(x, y); c.scale(1, sy); c.font = `800 ${size}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.direction = 'ltr';
      const by = asc / 2, d = Math.max(3, Math.round(size * .06));
      for (let k = d; k >= 1; k--) { c.fillStyle = mix([70, 38, 0], [168, 104, 0], 1 - k / d); c.fillText(ch, k * .35, by + k); }
      c.fillStyle = 'rgba(255,252,230,.95)'; c.fillText(ch, 0, by - Math.max(1.2, size * .014));
      const gd = c.createLinearGradient(0, by - asc, 0, by); gd.addColorStop(0, '#FFF7CF'); gd.addColorStop(.32, '#FFDB4D'); gd.addColorStop(.56, '#F2A700'); gd.addColorStop(.8, '#FFC21A'); gd.addColorStop(1, '#FFE27A');
      c.fillStyle = gd; c.fillText(ch, 0, by); c.restore();
    };

    // ---------- the price (odometer 000 -> 350, lands at 40.40) ----------
    const pIn = E.out(cl((t - (R_ST - .08)) / .35));
    if (pIn > 0) {
      const pw = Math.ceil(sw), ph = Math.ceil(S * 2), pcx = pw / 2, pcy = ph / 2, ox = cx - pw / 2, oy = cyP - ph / 2;
      const TG = [3, 5, 0], LT = [LAND - .14, LAND - .07, LAND], NR = [2, 3, 4], TH = .95, RD = S * 1.1;
      const pos = (i, tt) => { const u = cl((tt - R_ST) / (LT[i] - R_ST)); const e = 1 - Math.pow(1 - u, 3.2); return -10 * NR[i] + (TG[i] + 10 * NR[i]) * e; };
      const shut = 1 / 30 * .6; let dmax = 0; for (let i = 0; i < 3; i++) dmax = Math.max(dmax, Math.abs(pos(i, t + shut / 2) - pos(i, t - shut / 2)));
      const NS = Math.max(1, Math.min(12, Math.ceil(dmax * 3.5)));
      const P = cv('P', pw, ph);
      const drum = (c, tt) => { for (let i = 0; i < 3; i++) { const p = pos(i, tt), f = Math.floor(p);
        for (let n = f - 2; n <= f + 2; n++) { const o = n - p; if (Math.abs(o) > 1.5) continue; const an = o * TH, co = Math.cos(an); c.globalAlpha = Math.pow(Math.max(0, co), 1.3);
          glyph(c, String(((n % 10) + 10) % 10), colX(i) - ox, pcy + RD * Math.sin(an), S, ascD, Math.max(.05, co)); } }
        c.globalAlpha = 1; };
      if (NS === 1) drum(P, t);
      else { const Sm = cv('Sm', pw, ph); P.globalCompositeOperation = 'lighter';
        for (let j = 0; j < NS; j++) { Sm.globalCompositeOperation = 'source-over'; Sm.clearRect(0, 0, pw, ph); drum(Sm, t + (j / (NS - 1) - .5) * shut); P.globalAlpha = 1 / NS; P.drawImage(Sm.canvas, 0, 0); }
        P.globalAlpha = 1; P.globalCompositeOperation = 'source-over'; }
      // soft top/bottom window mask (slot-drum look)
      const mk = P.createLinearGradient(0, pcy - S * .64, 0, pcy + S * .68); mk.addColorStop(0, 'rgba(0,0,0,0)'); mk.addColorStop(.15, 'rgba(0,0,0,1)'); mk.addColorStop(.85, 'rgba(0,0,0,1)'); mk.addColorStop(1, 'rgba(0,0,0,0)');
      P.globalCompositeOperation = 'destination-in'; P.fillStyle = mk; P.fillRect(0, 0, pw, ph); P.globalCompositeOperation = 'source-over';
      // shekel sign lands with "שקל"
      const sIn = E.out(cl((t - (LAND - .1)) / .3));
      if (sIn > 0) { P.save(); P.globalAlpha = cl(sIn * 1.4); const sx = shX - ox + (1 - sIn) * S * .25, sy = pcy + ascD / 2 - ascS / 2; P.translate(sx, sy); P.scale(.75 + .25 * sIn, .75 + .25 * sIn); glyph(P, '₪', 0, 0, S * .66, ascS, 1); P.restore(); }
      // light shine sweeps across the numerals after landing, plus a softer second pass later
      const shine = (t0, dur, amp) => { const u = (t - t0) / dur; if (u <= 0 || u >= 1) return; const e = E.inOut(u), bx = pcx - totW * .75 + e * totW * 1.5, bw = totW * .16;
        P.save(); P.globalCompositeOperation = 'source-atop'; P.translate(bx, pcy); P.rotate(.38);
        const sg = P.createLinearGradient(-bw, 0, bw, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(255,255,245,${amp})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
        P.fillStyle = sg; P.fillRect(-bw, -ph, bw * 2, ph * 2); P.restore(); };
      shine(LAND + .02, .5, .95); shine(42.35, .7, .55);
      // composite with scale punch at landing + breathing idle
      const pu = cl((t - LAND) / .42), punch = pu > 0 && pu < 1 ? .05 * Math.sin(PI * pu) * (1 - pu * .3) : 0;
      const br = cl((t - LAND - .4) / .6) * .013 * Math.sin((t - LAND - .4) * 2.6);
      const sc = (.9 + .1 * pIn) * (1 + punch + br);
      g.save(); g.globalAlpha = cl(pIn * 1.3); g.translate(cx, cyP); g.scale(sc, sc);
      g.shadowColor = 'rgba(0,6,40,.7)'; g.shadowBlur = S * .16; g.shadowOffsetY = S * .07; g.drawImage(P.canvas, -pw / 2, -ph / 2); g.restore();

      // expanding light ring (once)
      const ru = (t - LAND) / .8;
      if (ru > 0 && ru < 1) { const e = E.out(ru), rr = sh * (.22 + .78 * e), al = Math.pow(1 - ru, 1.6);
        g.save(); g.translate(cx, cyP); g.scale(1.25, 1);
        g.strokeStyle = `rgba(255,236,170,${al * .9})`; g.lineWidth = 1 + 3.2 * (1 - ru); g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
        g.strokeStyle = `rgba(255,255,255,${al * .35})`; g.lineWidth = 8 * (1 - ru) + 1; g.beginPath(); g.arc(0, 0, rr * .94, 0, TAU); g.stroke(); g.restore(); }

      // premium sparkles around the price + occasional glints on the numerals
      const star = (x, y, r, a, rot = 0) => { if (r <= .3 || a <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a;
        const hg = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.3); hg.addColorStop(0, 'rgba(255,240,190,.55)'); hg.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = hg; g.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
        g.fillStyle = '#FFFBEA'; g.beginPath(); for (let q = 0; q < 4; q++) { const aa = q * PI / 2; g.lineTo(Math.cos(aa) * r, Math.sin(aa) * r); g.lineTo(Math.cos(aa + PI / 4) * r * .16, Math.sin(aa + PI / 4) * r * .16); } g.closePath(); g.fill(); g.restore(); };
      const spA = cl((t - LAND - .05) / .4);
      if (spA > 0) for (let i = 0; i < 16; i++) {
        const an = hash(i * 3.71 + 5) * TAU, rx = totW * (.52 + .2 * hash(i * 1.9)), ry = S * (.62 + .22 * hash(i * 2.3)), per = .9 + .9 * hash(i * 4.4), ph = hash(i * 6.2);
        const tw = Math.max(0, Math.sin(TAU * ((t - LAND) / per + ph))); const drift = (t - LAND) * sh * .015;
        star(cx + Math.cos(an) * rx, cyP + Math.sin(an) * ry - drift * (.5 + hash(i)), sh * (.018 + .02 * hash(i * 8.8)) * Math.pow(tw, 2), spA * Math.pow(tw, 1.5), t * .6 + i); }
      for (const [gt, gx, gy] of [[41.3, colX(0) - cw * .28, cyP - ascD * .48], [42.05, shX + wS * .3, cyP + ascD / 2 - ascS * .95], [42.95, colX(2) + cw * .3, cyP - ascD * .45], [43.45, colX(1) - cw * .1, cyP - ascD * .5]]) {
        const u = (t - gt) / .55; if (u > 0 && u < 1) { const s = Math.sin(PI * u); star(gx, gy, sh * .07 * s, s, u * 1.2); } }
    }

    // ---------- badges (RTL: first on the RIGHT, then on the LEFT) ----------
    const fb = sh * .07, bh = fb * 2.05, ir2 = bh * .3, pad = bh * .36, tg = fb * .5;
    g.font = `700 ${fb}px Rubik`; const L1 = 'תשלום חד פעמי', L2 = 'פעיל לשנה';
    const bwOf = s => pad + ir2 * 2 + tg + g.measureText(s).width + pad * 1.25;
    let bw1 = bwOf(L1), bw2 = bwOf(L2), bgap = sw * .035, fit = Math.min(1, sw * .9 / (bw1 + bw2 + bgap));
    const by0 = sh * .835, tot = (bw1 + bw2 + bgap) * fit;
    const badge = (txt, bcx, bw, t0, side) => {
      const u = E.out(cl((t - t0) / .5)); if (u <= 0) return; const a = cl((t - t0) / .3);
      g.save(); g.globalAlpha = a; g.translate(bcx + side * (1 - u) * sw * .04, by0 + (1 - u) * sh * .05); const s = (.9 + .1 * u) * fit; g.scale(s, s);
      const x = -bw / 2, y = -bh / 2, rr = bh / 2;
      g.save(); g.shadowColor = 'rgba(0,4,30,.6)'; g.shadowBlur = bh * .35; g.shadowOffsetY = bh * .1;
      const fg = g.createLinearGradient(0, y, 0, y + bh); fg.addColorStop(0, '#2A5CF0'); fg.addColorStop(1, '#0E2A96'); g.fillStyle = fg; g.beginPath(); g.roundRect(x, y, bw, bh, rr); g.fill(); g.restore();
      const sg = g.createLinearGradient(x, y, x + bw, y + bh); sg.addColorStop(0, '#FFE58A'); sg.addColorStop(.5, '#E9A800'); sg.addColorStop(1, '#FFD44D');
      g.strokeStyle = sg; g.lineWidth = Math.max(2, bh * .055); g.beginPath(); g.roundRect(x, y, bw, bh, rr); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.2; g.beginPath(); g.roundRect(x + bh * .1, y + bh * .1, bw - bh * .2, bh * .42, bh * .21); g.stroke();
      // check icon at the RTL start (right side)
      const icx = x + bw - pad - ir2; const ig = g.createLinearGradient(0, -ir2, 0, ir2); ig.addColorStop(0, '#FFF0A8'); ig.addColorStop(.55, '#FFC21A'); ig.addColorStop(1, '#E09A00');
      g.fillStyle = ig; g.beginPath(); g.arc(icx, 0, ir2, 0, TAU); g.fill();
      const ck = E.inOut(cl((t - t0 - .18) / .3));
      if (ck > 0) { const pts = [[-.42, .02], [-.12, .32], [.44, -.3]], l1 = Math.hypot(.3, .3), l2 = Math.hypot(.56, .62), L = (l1 + l2) * ck;
        g.strokeStyle = '#0E2A96'; g.lineWidth = ir2 * .26; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(icx + pts[0][0] * ir2, pts[0][1] * ir2);
        if (L <= l1) { const k = L / l1; g.lineTo(icx + (pts[0][0] + (pts[1][0] - pts[0][0]) * k) * ir2, (pts[0][1] + (pts[1][1] - pts[0][1]) * k) * ir2); }
        else { const k = (L - l1) / l2; g.lineTo(icx + pts[1][0] * ir2, pts[1][1] * ir2); g.lineTo(icx + (pts[1][0] + (pts[2][0] - pts[1][0]) * k) * ir2, (pts[1][1] + (pts[2][1] - pts[1][1]) * k) * ir2); }
        g.stroke(); }
      g.font = `700 ${fb}px Rubik`; g.direction = 'rtl'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF';
      g.fillText(txt, icx - ir2 - tg, fb * .04); g.restore();
    };
    badge(L1, cx + tot / 2 - bw1 * fit / 2, bw1, 40.76, 1);
    badge(L2, cx - tot / 2 + bw2 * fit / 2, bw2, 42.06, -1);

    g.restore();
    // gold rim on the iris edge during the wipe
    if (ir > 0 && ir < 1) { g.save(); g.strokeStyle = `rgba(255,214,90,${.9 * (1 - ir)})`; g.lineWidth = 5; g.beginPath(); g.arc(cx, sh * .5, R0, 0, TAU); g.stroke(); g.restore(); }
  }
  A.scene({ name: 's8_end', start: 36.7, end: 44.0, draw: (ctx, s) => {
    const t = s.t, p = inv(36.7, 37.05, t);
    if (p >= 1) { content(ctx, t); return; }
    const pp = ease.out(clamp(Q(p * 100, 24) / 100)), R = pp * 1250, ring = r => { ctx.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, rr = r * (1 + (hash(i * 1.3 + Q(t, 12) * .1) - .5) * .07); ctx.lineTo(960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr); } ctx.closePath(); };
    ctx.save(); ctx.fillStyle = 'rgba(40,20,0,.32)'; ring(R + 44); ctx.fill(); ctx.fillStyle = C.white; ring(R + 18); ctx.fill(); ring(R); ctx.clip(); content(ctx, t); ctx.restore();
  } });
})();
