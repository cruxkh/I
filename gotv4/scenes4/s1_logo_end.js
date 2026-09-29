// s1_logo_end: (1) LOGO REVEAL, anime henshin, v 3.00-4.97 (+tail to 5.27, hold 2 at v=4.80 for 1.3 s)   (2) END CARD, anime OP credit card, v 36.88-39.5
// Everything is a pure function of the VO clock v (s.t) and, during hold 2, of A.H.u. Ambient motion inside the hold is periodic with period PER (= hold length)
// so that the last frame of the hold equals the first one and the film continues seamlessly.
(() => {
  const { clamp, lerp, ease, hash, inv, smooth } = A, TAU = A.TAU, C = V.C;
  const eo = t => ease.out(clamp(t)), eob = t => ease.outBack(clamp(t)), eio = t => ease.inOut(clamp(t)), ein = t => ease.in(clamp(t));
  const INK = '#0b0724', PER = 1.3, GOLDG = [[0, '#FFF6CF'], [.45, '#FFC24A'], [1, '#E48A12']];
  const KF = 'IPAGothic, "Noto Sans CJK JP", "Noto Sans JP", sans-serif';
  const lg = (g, x0, y0, x1, y1, st) => V.lin(g, x0, y0, x1, y1, st);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

  // ---------------------------------------------------------------- shared anime helpers
  const halftone = () => A.layer('s1_ht', 1080, 1920, g => {
    g.fillStyle = '#fff'; const st = 24;
    for (let j = -1; j < 1920 / (st * .87) + 1; j++) for (let i = -1; i < 1080 / st + 1; i++) {
      const x = (i + (j & 1 ? .5 : 0)) * st, y = j * st * .87, k = clamp(Math.abs(x - 540) / 540 * .55 + y / 1920 * .75 - .12), r = st * .5 * k;
      if (r > .6) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    }
  });
  // radial focus / speed lines, redrawn "on twos" (12 fps) like real anime
  function rays(ctx, cx, cy, r0, r1, n, seed, tt, col, alpha, wid = .035) {
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = alpha; const step = Math.floor(tt * 12);
    for (let i = 0; i < n; i++) {
      const h1 = hash(seed + i * 1.7 + step * .37), h2 = hash(seed + i * 3.1 + step * .11), a = (i + h1 * .8) / n * TAU, w = wid * (.35 + h2), ri = r0 * (.75 + .6 * h1), ro = r1 * (.75 + .5 * h2);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri); ctx.lineTo(cx + Math.cos(a - w) * ro, cy + Math.sin(a - w) * ro); ctx.lineTo(cx + Math.cos(a + w) * ro, cy + Math.sin(a + w) * ro); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // alternating light wedges, rotating in a loop of one spacing per period
  function wedges(ctx, cx, cy, n, phase, len, col, alpha) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.rotate(phase * TAU / n); ctx.fillStyle = col; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, w = TAU / n * .26; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len); ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function petal(ctx, x, y, s, rot, a, col1 = '#FFD3E6', col2 = '#FF7DB6') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.bezierCurveTo(.95, -.95, 1.05, .45, .16, 1); ctx.lineTo(0, .78); ctx.lineTo(-.16, 1); ctx.bezierCurveTo(-1.05, .45, -.95, -.95, 0, -1);
    ctx.fillStyle = lg(ctx, -1, -1, 1, 1, [[0, col1], [1, col2]]); ctx.fill(); ctx.lineWidth = .12; ctx.strokeStyle = '#8A2A66'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -.6); ctx.quadraticCurveTo(.15, 0, 0, .6); ctx.lineWidth = .06; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(); ctx.restore();
  }
  function kata(ctx, str, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.sc || 1, o.sc || 1); ctx.globalAlpha = o.a ?? 1;
    ctx.font = `900 ${size}px ${KF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = size * .3; ctx.strokeStyle = o.ink || INK; ctx.strokeText(str, size * .05, size * .07);
    ctx.strokeText(str, 0, 0);
    ctx.lineWidth = size * .17; ctx.strokeStyle = o.edge || '#fff'; ctx.strokeText(str, 0, 0);
    ctx.fillStyle = o.fill || lg(ctx, 0, -size * .5, 0, size * .5, [[0, '#FFF6CF'], [.5, '#FFC24A'], [1, '#FF7A1A']]); ctx.fillText(str, 0, 0); ctx.restore();
  }
  const star4 = (ctx, x, y, r, col, a = 1, rot = 0) => V.sparkle(ctx, x, y, r, col, rot, a);
  const glint = (ctx, x, y, r, a = 1) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, x, y, r * 1.1, 'rgba(255,240,200,1)', .55 * a); ctx.restore(); star4(ctx, x, y, r, '#fff', a, 0); star4(ctx, x, y, r * .55, '#FFF3C4', a, Math.PI / 4); };

  // ---------------------------------------------------------------- logo layers: silhouette / ink outline / rim light (cel-shaded look around vlogo.js art)
  const LWs = 960, LHs = Math.round(960 * 440 / 1215);
  function buildLayers(ex, sil, ink, rim) {
    const g1 = sil.getContext('2d'), g2 = ink.getContext('2d'), g3 = rim.getContext('2d');
    for (const g of [g1, g2, g3]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, LWs, LHs); }
    g1.drawImage(V.logoFrame({ extrude: ex }), 0, 0, LWs, LHs); g1.globalCompositeOperation = 'source-in'; g1.fillStyle = '#fff'; g1.fillRect(0, 0, LWs, LHs); g1.globalCompositeOperation = 'source-over';
    for (const R of [10, 6]) for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; g2.drawImage(sil, Math.cos(a) * R, Math.sin(a) * R + 3); }
    g2.globalCompositeOperation = 'source-in'; g2.fillStyle = INK; g2.fillRect(0, 0, LWs, LHs); g2.globalCompositeOperation = 'source-over';
    g3.drawImage(sil, 0, 0); g3.globalCompositeOperation = 'destination-out'; g3.drawImage(sil, 6, 8); g3.drawImage(sil, 3, 4); g3.globalCompositeOperation = 'source-over';
  }
  function layers(ex) {
    if (ex >= .999) { const k = 's1_lay1'; const S = A.layer(k + 's', LWs, LHs, () => { }), I = A.layer(k + 'i', LWs, LHs, () => { }), R = A.layer(k + 'r', LWs, LHs, () => { });
      if (!S._done) { buildLayers(1, S, I, R); S._done = true; } return { sil: S, ink: I, rim: R }; }
    const S = A.layer('s1_layS', LWs, LHs, () => { }), I = A.layer('s1_layI', LWs, LHs, () => { }), R = A.layer('s1_layR', LWs, LHs, () => { });
    buildLayers(ex, S, I, R); return { sil: S, ink: I, rim: R };
  }
  // centre (x,y), nominal logo width w. o: ex, sc, rot, glow, shine, hot (white-hot silhouette 0..1), alpha, rimA, ghost
  function logoHero(ctx, x, y, w, o = {}) {
    const ex = o.ex ?? 1, L = layers(ex), { dw, dh } = V.logoSize(w), al = o.alpha ?? 1; if (al <= .002) return;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); const sc = o.sc ?? 1; ctx.scale(sc, sc); ctx.globalAlpha = al;
    if ((o.glow ?? 0) > 0) V.logo(ctx, 0, 0, w, { art: false, glow: o.glow });
    ctx.drawImage(L.ink, -dw / 2, -dh / 2, dw, dh);
    V.logo(ctx, 0, 0, w, { extrude: ex, shine: o.shine ?? -1, glow: 0 });
    ctx.globalAlpha = al * (o.rimA ?? .9); ctx.drawImage(L.rim, -dw / 2, -dh / 2, dw, dh);
    if ((o.hot ?? 0) > 0.01) { ctx.globalAlpha = al * clamp(o.hot); ctx.drawImage(L.sil, -dw / 2, -dh / 2, dw, dh); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * clamp(o.hot) * .6; ctx.drawImage(L.sil, -dw / 2, -dh / 2, dw, dh); }
    ctx.restore(); return L;
  }
  // Hebrew tagline on a manga caption ribbon. prog 0..1 = diagonal slash wipe from right to left
  function tagline(ctx, cx, y, prog, o = {}) {
    if (prog <= 0) return; const size0 = 100, txt = 'הטלוויזיה של ישראל';
    ctx.save(); ctx.font = `900 ${size0}px Rubik`; ctx.direction = 'rtl'; const tw = ctx.measureText(txt).width; ctx.restore();
    const size = size0 * Math.min(1, 760 / tw), bw = 860, bh = size * 1.55, e = eo(prog);
    ctx.save(); ctx.translate(cx, y); ctx.transform(1, 0, -.12, 1, 0, 0);
    // wipe clip (skewed rect growing from right)
    ctx.beginPath(); ctx.rect(bw / 2 - bw * e, -bh, bw * e + 1, bh * 2); ctx.clip();
    ctx.fillStyle = 'rgba(6,8,40,.86)'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = lg(ctx, -bw / 2, 0, bw / 2, 0, [[0, 'rgba(255,194,74,.0)'], [.1, '#FFC24A'], [.9, '#FFC24A'], [1, 'rgba(255,194,74,0)']]); ctx.fillRect(-bw / 2, -bh / 2, bw, 7); ctx.fillRect(-bw / 2, bh / 2 - 7, bw, 7);
    ctx.globalAlpha = .12; ctx.fillStyle = '#fff'; for (let yy = -bh / 2 + 10; yy < bh / 2; yy += 13) for (let xx = -bw / 2 + 12 + (((yy / 13) | 0) & 1) * 6; xx < -bw / 2 + bw * .16; xx += 13) { ctx.beginPath(); ctx.arc(xx, yy, 2.6 * (1 - (xx + bw / 2) / (bw * .16)), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.transform(1, 0, .12, 1, 0, 0);
    V.text(ctx, txt, 0, 3, size, { grad: GOLDG, stroke: INK, sw: size * .2, weight: 900, shadowBlur: 0, shadowY: 8, shadowCol: 'rgba(0,0,0,.5)' });
    ctx.restore();
    if (prog < 1) { const fx = cx + (bw / 2 - bw * e) * 1 - 20; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - prog * .5; ctx.fillStyle = lg(ctx, fx - 40, 0, fx + 40, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); ctx.translate(fx, y); ctx.transform(1, 0, -.12, 1, 0, 0); ctx.fillRect(-40, -bh / 2, 80, bh); ctx.restore(); }
  }
  // ring with ink edges, orbiting studs
  function haloRing(ctx, cx, cy, R, phase, a = 1, w = 14) {
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = w + 16; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = lg(ctx, cx, cy - R, cx, cy + R, [[0, '#FFF6CF'], [.5, '#FFC24A'], [1, '#E48A12']]); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(cx, cy, R - w * .25, 3.5, 5.0); ctx.stroke();
    // dashed inner ring (rotates one dash step per period => loops)
    ctx.setLineDash([26, 26]); ctx.lineDashOffset = -phase * 52; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(160,225,255,.85)'; ctx.beginPath(); ctx.arc(cx, cy, R - 34, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 12; i++) { const an = (i / 12 + phase / 12) * TAU; star4(ctx, cx + Math.cos(an) * (R + 30), cy + Math.sin(an) * (R + 30), 12 + 6 * (i % 2), i % 2 ? '#FFF3C4' : '#7fdcff', .95, an); }
    ctx.restore();
  }

  // ================================================================= 1) LOGO REVEAL
  const CX = 540, CY = 790, LW = 780, I0 = 107 / 30, F = 1 / 30;
  const TILE = [[C.blue, C.sky, 'play'], ['#FF3B4A', '#B0122E', 'play'], [C.green, '#0E8F52', 'ball'], [C.violet, '#4B23B8', 'bolt'], [C.magenta, '#B01463', 'heart'], [C.gold, C.goldLo, 'star'], [C.cyan, '#1287C9', 'tv'], ['#FF8A3D', '#D4380D', 'note']];
  const tileCv = i => A.layer('s1_tile' + i, 260, 260, g => { const t = TILE[i % TILE.length]; V.tile(g, 130, 130, 1, t[0], t[1], V.ICON[t[2]]); rr(g, 30, 30, 200, 200, 52); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); });

  function bgLogo(ctx, t, warm, charge) {
    ctx.fillStyle = lg(ctx, 0, 0, 0, 1920, [[0, '#0f0640'], [.42, '#2a1170'], [.75, A.mixc('#1a0d5a', '#8a2a86', warm)], [1, A.mixc('#070520', '#ff9a5e', warm * .55)]]); ctx.fillRect(0, 0, 1080, 1920);
    A.glow(ctx, CX, CY, 1000, 'rgba(110,140,255,1)', .35 + charge * .35); if (warm > 0) A.glow(ctx, CX, CY + 60, 820, 'rgba(255,196,110,1)', .55 * warm);
    ctx.save(); ctx.globalAlpha = .1 + .05 * warm; ctx.drawImage(halftone(), 0, 0); ctx.restore();
  }
  function impactFrame(ctx, fi, t) {
    const inv1 = fi !== 2; ctx.fillStyle = inv1 ? '#fff' : '#000'; ctx.fillRect(0, 0, 1080, 1920);
    rays(ctx, CX, CY, 120, 1700, fi === 3 ? 34 : 70, 7 + fi, t, inv1 ? '#000' : '#fff', 1, fi === 3 ? .02 : .05);
    const L = layers(.55), { dw, dh } = V.logoSize(LW), sc = fi === 3 ? 1.04 : 1.2;
    ctx.save(); ctx.translate(CX, CY); ctx.scale(sc, sc);
    if (fi === 2) ctx.drawImage(L.sil, -dw / 2, -dh / 2, dw, dh); else { ctx.drawImage(L.ink, -dw / 2, -dh / 2, dw, dh); }
    ctx.restore();
    if (fi === 1) kata(ctx, 'ドン', 640, 330, 300, { rot: -.16, sc: 1.15, fill: '#fff', edge: '#000', ink: '#000' });
    if (fi === 2) kata(ctx, 'ドン', 640, 330, 300, { rot: -.16, sc: 1.25, fill: '#000', edge: '#fff', ink: '#fff' });
    if (fi === 3) { ctx.save(); ctx.globalAlpha = .75; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  }

  A.scene({ name: 's1_logo', start: 3.0, end: 5.27, draw(ctx, s) {
    const t = s.t, H = A.H, hold = H && H.i === 2 ? H : null, u = hold ? hold.u : 0, dur = hold ? hold.dur : PER;
    const tau = t + u, ph = tau / PER, env = hold ? Math.pow(Math.sin(Math.PI * u / dur), 2) : 0, breathe = .5 + .5 * Math.sin(TAU * ph);
    const warm = smooth(3.6, 4.3, t), charge = smooth(3.05, 3.56, t);
    const fi = (t >= I0 - F / 2 && t < I0 + F / 2) ? 1 : (t >= I0 + F / 2 && t < I0 + 1.5 * F) ? 2 : (t >= I0 + 1.5 * F && t < I0 + 2.5 * F) ? 3 : 0;
    if (fi) { impactFrame(ctx, fi, t); return; }
    bgLogo(ctx, t, warm, charge);
    // ---- camera: shake before/after impact + tail whip
    const q = inv(4.86, 5.27, t), wq = q * q * q, tailSc = 1 + wq * .55;
    const sk = t < I0 ? charge * charge * .8 : Math.exp(-(t - I0) * 7) * 1.4, shx = A.noise1(t * 41) * 9 * sk, shy = A.noise1(t * 41 + 30) * 9 * sk;
    const zoom = (1 + .03 * smooth(4.4, 4.8, t) + .04 * env) * tailSc;
    ctx.save(); ctx.translate(540, 960); ctx.rotate(-q * q * .06); ctx.scale(zoom, zoom); ctx.translate(-540 + shx, -960 + shy - wq * 1500);

    // ---- pre-impact: spiralling tiles, charging core, inward focus lines
    if (t < I0 + 3 * F) {
      const chg = charge, orbR = lerp(14, 200, Math.pow(chg, 1.4)) * (1 + .06 * Math.sin(t * 60));
      rays(ctx, CX, CY, 260, 1500, 46, 3, t, 'rgba(255,255,255,1)', .22 * chg + .1, .018);
      for (let k = 0; k < 3; k++) { const rp = ((t - 3.05) / .5 + k / 3); if (rp < 0) continue; const f = rp % 1, r = lerp(760, 110, ein(f)); V.ring(ctx, CX, CY, r, 6 + 12 * f, `rgba(190,215,255,${.5 * (1 - f) * chg})`); }
      for (let i = 0; i < 20; i++) {
        const h1 = hash(i * 2.3 + 1), h2 = hash(i * 5.9 + 4), ta = 3.27 + .27 * hash(i * 3.3 + 2), pp = inv(2.98, ta, t); if (pp >= 1) continue;
        const a0 = i / 20 * TAU * 2.3 + h1 * 2, r0 = 640 + h2 * 620, spin = 4.6 * Math.pow(pp, 1.4);
        for (let g = 3; g >= 0; g--) {
          const pg = Math.max(0, pp - g * .035), rg = r0 * (1 - Math.pow(pg, 2)), an = a0 + 4.6 * Math.pow(pg, 1.4), k = (.55 + .55 * h2) * (1 - .72 * Math.pow(pg, 3)), x = CX + Math.cos(an) * rg, y = CY + Math.sin(an) * rg * .85;
          ctx.save(); ctx.globalAlpha = g ? .22 / g : 1; ctx.translate(x, y); ctx.rotate(an * 1.3 + i); ctx.scale(k, k); ctx.drawImage(tileCv(i), -130, -130); ctx.restore();
        }
      }
      // core orb (anime energy ball): white core, gold shell, ink ring
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, CX, CY, orbR * 3.2, 'rgba(120,150,255,1)', .8); A.glow(ctx, CX, CY, orbR * 1.8, 'rgba(255,200,110,1)', .9); ctx.restore();
      ctx.beginPath(); ctx.arc(CX, CY, orbR, 0, TAU); ctx.fillStyle = A.radial(ctx, CX, CY, 0, orbR, [[0, '#fff'], [.6, '#fff'], [1, '#FFE08A']]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      for (let i = 0; i < 4; i++) star4(ctx, CX + Math.cos(t * 9 + i * 1.6) * orbR * 1.5, CY + Math.sin(t * 7 + i * 1.6) * orbR * 1.5, 26, '#fff', chg);
    }

    // ---- post-impact: forged logo, light, halo, petals, tagline
    if (t >= I0 + 3 * F - .001) {
      const lp = t - (I0 + 3 * F), ex = eo(inv(3.72, 4.08, t)), hot = 1 - smooth(3.65, 3.9, t);
      const sc = A.key(t, [[3.65, .28], [3.78, 1.2, 'out'], [3.93, .95, 'inOut'], [4.06, 1.0, 'inOut']]) * (1 + .01 * (breathe - .5) * smooth(4.2, 4.5, t));
      const rot = -.15 * Math.exp(-lp * 8) * Math.cos(lp * 19);
      // rays of light + wedges
      const lightA = eo(inv(3.65, 3.95, t));
      rays(ctx, CX, CY, 300, 1700, 40, 21, t, 'rgba(255,240,190,1)', .35 * (1 - .6 * warm) * lightA, .022);
      wedges(ctx, CX, CY, 16, ph, 1700, 'rgba(255,225,150,1)', .16 * lightA * (.8 + .2 * breathe));
      // shock ring + halo ring
      const sr = inv(3.65, 4.0, t); if (sr > 0 && sr < 1) { V.ring(ctx, CX, CY, eo(sr) * 1000, 46 * (1 - sr) + 4, `rgba(255,255,255,${1 - sr})`); V.ring(ctx, CX, CY, eo(sr) * 800, 18 * (1 - sr), `rgba(255,214,120,${(1 - sr) * .9})`); }
      const hr = eo(inv(3.68, 4.12, t)); haloRing(ctx, CX, CY, lerp(40, 440, hr) * (1 + .008 * (breathe - .5) * 2), ph, hr);
      // burst petals -> hover
      for (let i = 0; i < 46; i++) {
        const an = hash(i * 1.9 + 3) * TAU, D = 480 + hash(i * 7.1) * 560, bp = eo(inv(3.66, 4.6, t)), d = lerp(60, D, bp), sw = Math.sin(TAU * (ph + hash(i))) * 14;
        petal(ctx, CX + Math.cos(an) * d + sw, CY + Math.sin(an) * d * .95 + Math.cos(TAU * (ph + hash(i + 9))) * 12, 11 + hash(i * 3.7) * 15, an * 2 + Math.sin(TAU * (ph + hash(i))) * .5 + lp * (1 - bp) * 6, clamp(lp * 8) * (.9 - .3 * hash(i + 5)));
      }
      // hero logo
      const shh = hold ? (u >= .13 * dur && u <= .8 * dur ? inv(.13 * dur, .8 * dur, u) : -1) : -1, sh1 = t > 4.06 && t < 4.42 ? inv(4.06, 4.42, t) : -1, sh = shh >= 0 ? shh : sh1;
      logoHero(ctx, CX, CY, LW, { ex, sc, rot, glow: (.45 + .5 * eo(inv(3.65, 4.1, t))) * (.9 + .12 * breathe), shine: sh, hot, alpha: clamp(lp * 20) });
      // tagline
      tagline(ctx, CX, 1030, inv(4.02, 4.34, t));
      // motes (gold dust), loop period PER
      for (let i = 0; i < 30; i++) {
        const lf = (ph * 1 + hash(i * 2.1)) % 1, x = 90 + hash(i * 4.3) * 900, y0 = 300 + hash(i * 6.7) * 900, y = y0 - lf * 240 * (.5 + hash(i)), a = Math.sin(lf * Math.PI) * clamp(inv(3.9, 4.4, t)) * .9;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = i % 3 ? '#FFE9A8' : '#9fe4ff'; ctx.beginPath(); ctx.arc(x + Math.sin(lf * TAU + i) * 20, y, 3 + 4 * hash(i * 9.1), 0, TAU); ctx.fill(); ctx.restore();
      }
      // sparkle glints: burst at the word "הנכון" (4.28) + ambient twinkles
      const gb = inv(4.26, 4.6, t);
      if (gb > 0 && gb < 1) for (let i = 0; i < 7; i++) { const x = CX + (hash(i * 3.3) - .5) * 800, y = CY + (hash(i * 5.1) - .5) * 300; glint(ctx, x, y, 90 * Math.sin(Math.PI * clamp(gb * 1.3 - i * .06)) + 4, 1); }
      const amb = smooth(4.4, 4.6, t);
      for (let i = 0; i < 6; i++) { const tw = Math.pow(Math.max(0, Math.sin(TAU * (ph * (1 + (i % 2)) + hash(i * 2.2)))), 6); if (tw > .01) glint(ctx, CX + (hash(i * 3.3 + 1) - .5) * 780, CY + (hash(i * 5.1 + 2) - .5) * 260, 26 + 60 * tw, tw * amb); }
      // katakana SFX
      const kp = inv(3.6, 4.4, t); if (kp > 0 && kp < 1) kata(ctx, 'ドン', 650 + A.noise1(t * 50) * 6 * (1 - kp), 330 + A.noise1(t * 50 + 4) * 6 * (1 - kp) - smooth(.6, 1, kp) * 80, 300, { rot: -.16, sc: lerp(2.4, 1, eob(kp * 5)), a: 1 - smooth(.62, 1, kp) });
      const kp2 = inv(4.0, 4.7, t); if (kp2 > 0 && kp2 < 1) kata(ctx, 'キラキラ', 330, 1180, 96, { rot: .1, sc: eob(kp2 * 4), a: 1 - smooth(.6, 1, kp2), fill: '#fff', edge: '#7fdcff' });
    }
    ctx.restore();
    // ---- opening white light hit (covers the host shot at once) + tail whip streaks
    const wa = t < 3.04 ? 1 : 1 - smooth(3.04, 3.24, t);
    if (wa > .002) { ctx.save(); ctx.globalAlpha = wa; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); if (t < 3.3) rays(ctx, CX, CY, 200, 1700, 50, 11, t, `rgba(160,190,255,1)`, wa * .8, .02); }
    if (q > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const n = 26; for (let i = 0; i < n; i++) { const x = hash(i * 3.7) * 1080, w = 6 + hash(i * 1.3) * 40; ctx.globalAlpha = q * .55; ctx.fillStyle = i % 3 ? '#cfe6ff' : '#FFE9A8'; ctx.fillRect(x, 0, w, 1920); } ctx.restore();
      const fl = smooth(.55, .95, q); if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    }
  } });

  // ================================================================= 2) END CARD
  const EX = 540, EY = 600, ELW = 740;
  const branchLayer = () => A.layer('s1_branch', 560, 620, g => {
    const draw = (x, y, an, len, w, d, sd) => {
      if (d === 0 || len < 8) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + sd; g.save(); g.translate(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, 9, 15, 0, 0, TAU); g.fillStyle = i % 2 ? '#FFC1DC' : '#FFE1EE'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#8A2A66'; g.stroke(); g.restore(); }
        g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fillStyle = '#FFD86B'; g.fill(); return; }
      const bend = (hash(sd + d * 3.3) - .5) * .9, x2 = x + Math.cos(an + bend * .5) * len, y2 = y + Math.sin(an + bend * .5) * len;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an) * len * .6, y + Math.sin(an) * len * .6 + 10, x2, y2); g.lineWidth = w; g.lineCap = 'round'; g.strokeStyle = '#1d0a3f'; g.stroke();
      draw(x2, y2, an + bend - .5, len * .72, w * .66, d - 1, sd + 1.7); draw(x2, y2, an + bend + .55, len * .68, w * .62, d - 1, sd + 4.1);
      if (d >= 3) draw(lerp(x, x2, .5), lerp(y, y2, .5), an + .9 * (hash(sd) > .5 ? 1 : -1), len * .5, w * .5, d - 2, sd + 8.3);
    };
    draw(-10, 30, .32, 250, 26, 5, 2.2);
  });
  function cornerBrackets(ctx, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#FFC24A'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [x, y, sx, sy] of [[96, 156, 1, 1], [984, 156, -1, 1], [96, 1494, 1, -1], [984, 1494, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * 70); ctx.lineTo(x, y); ctx.lineTo(x + sx * 70, y); ctx.stroke(); }
    ctx.restore();
  }
  function smartTV(ctx, x, y, w, lt, prog) {
    const h = w * .6, pop = eob(inv(.7, 1.05, lt)); if (pop <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop); ctx.rotate(.03 * (1 - pop));
    ctx.shadowColor = 'rgba(10,0,40,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 24;
    // stand
    ctx.beginPath(); ctx.moveTo(-40, h / 2 - 4); ctx.lineTo(40, h / 2 - 4); ctx.lineTo(70, h / 2 + 46); ctx.lineTo(-70, h / 2 + 46); ctx.closePath(); ctx.fillStyle = '#1a1f5c'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    rr(ctx, -w / 2, -h / 2, w, h, 26); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#3a4cc0'], [1, '#141a66']]); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
    rr(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 14); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#2a70ff'], [.6, '#0c2a9a'], [1, '#061455']]); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    ctx.save(); rr(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 14); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w * .05, -h / 2); ctx.lineTo(-w * .4, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill();
    ctx.globalAlpha = .12; ctx.drawImage(halftone(), -w / 2, -h / 2, w, h * 1.4); ctx.restore();
    // progress ring around the GOTV play mark, then a check
    const R = h * .36, done = prog >= 1;
    V.logoMark(ctx, 0, -4, h * .5, { glow: .5 });
    ctx.beginPath(); ctx.arc(0, -4, R, 0, TAU); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -4, R, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(prog)); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = '#FFC24A'; ctx.stroke();
    const cp = eob(inv(1.3, 1.55, lt));
    if (cp > 0) { ctx.save(); ctx.translate(w / 2 - 40, h / 2 - 40); ctx.scale(cp, cp); ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-5, 15); ctx.lineTo(19, -13); ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  function pillBar(ctx, cx, cy, w, h, lt) {
    const p = eob(inv(1.0, 1.32, lt)); if (p <= 0) return; const txt = '(התקנת אפליקציה על המסך החכם)';
    ctx.save(); ctx.translate(cx, cy + (1 - p) * 90); ctx.scale(lerp(.8, 1, p), lerp(.8, 1, p)); ctx.globalAlpha = clamp(p * 1.6);
    ctx.shadowColor = 'rgba(10,0,40,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(12,16,80,.86)'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.clip(); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, 0, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-w / 2, -h / 2, w, h / 2);
    const gs = inv(1.5, 2.1, lt); if (gs > 0 && gs < 1) { const gx = lerp(-w * .6, w * .6, gs); ctx.fillStyle = lg(ctx, gx - 80, 0, gx + 80, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.transform(1, 0, -.3, 1, 0, 0); ctx.fillRect(gx - 80, -h, 160, h * 2); }
    ctx.restore();
    rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.lineWidth = 6; ctx.strokeStyle = lg(ctx, -w / 2, 0, w / 2, 0, [[0, '#FFF3C4'], [.5, '#FFC24A'], [1, '#FFF3C4']]); ctx.stroke();
    rr(ctx, -w / 2 - 5, -h / 2 - 5, w + 10, h + 10, h / 2 + 5); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // install icon disc on the right (start of the RTL line)
    const ix = w / 2 - h / 2 - 4; ctx.beginPath(); ctx.arc(ix, 0, h * .34, 0, TAU); ctx.fillStyle = lg(ctx, 0, -h * .34, 0, h * .34, [[0, '#FFF3C4'], [1, '#FFA51A']]); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix, -h * .16); ctx.lineTo(ix, h * .1); ctx.moveTo(ix - h * .12, -h * .02); ctx.lineTo(ix, h * .11); ctx.lineTo(ix + h * .12, -h * .02); ctx.moveTo(ix - h * .14, h * .18); ctx.lineTo(ix + h * .14, h * .18); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    const avail = w - h * 1.15 - 40; ctx.font = '700 60px Rubik'; ctx.direction = 'rtl'; const tw = ctx.measureText(txt).width, fs = 60 * Math.min(1, avail / tw);
    V.text(ctx, txt, -h * .32, 3, fs, { weight: 700, fill: '#fff', shadowBlur: 0, shadowY: 4, shadowCol: 'rgba(0,0,0,.6)' });
    ctx.restore();
  }

  A.scene({ name: 's1_end', start: 36.88, end: 39.5, draw(ctx, s) {
    const t = s.t, lt = s.lt, ph = lt / PER;
    // ---- magic-hour sky (cached) + light
    const sky = A.layer('s1_end_sky', 1080, 1920, g => {
      g.fillStyle = lg(g, 0, 0, 0, 1920, [[0, '#0d0640'], [.32, '#2b1479'], [.58, '#7a2790'], [.76, '#e0468a'], [.88, '#ff9a5e'], [1, '#3a1466']]); g.fillRect(0, 0, 1080, 1920);
      // sun / moon disc glow behind the logo
      g.fillStyle = A.radial(g, EX, EY + 30, 0, 640, [[0, 'rgba(255,225,210,.55)'], [.5, 'rgba(255,150,190,.22)'], [1, 'rgba(255,150,190,0)']]); g.fillRect(0, 0, 1080, 1400);
      g.fillStyle = A.radial(g, 540, 1250, 0, 700, [[0, 'rgba(255,214,130,.6)'], [1, 'rgba(255,214,130,0)']]); g.fillRect(0, 700, 1080, 1220);
    });
    ctx.drawImage(sky, 0, 0);
    wedges(ctx, EX, EY, 18, ph, 1800, 'rgba(255,220,240,1)', .1);
    ctx.save(); ctx.globalAlpha = .13; ctx.drawImage(halftone(), 0, 0); ctx.restore();
    rays(ctx, EX, EY, 420, 1700, 40, 5, t, 'rgba(255,255,255,1)', .14 * eo(inv(0, .3, lt)), .02);
    // sakura branches in the corners
    { const b = branchLayer(), k = eo(inv(0, .5, lt)), sway = Math.sin(lt * 1.3) * .012;
      ctx.save(); ctx.translate(-20, -30); ctx.rotate(sway); ctx.globalAlpha = k; ctx.drawImage(b, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(1100, -30); ctx.scale(-1, 1); ctx.rotate(-sway); ctx.globalAlpha = k; ctx.drawImage(b, 0, 0); ctx.restore(); }
    // clouds of light on the horizon
    // ---- ring behind logo
    const rk = eo(inv(.05, .6, lt)); haloRing(ctx, EX, EY, lerp(120, 405, rk), ph, rk, 16);
    // ---- logo hero: forged again, fast
    const ex = eo(inv(.16, .5, lt)), hot = 1 - smooth(.1, .32, lt), sc = A.key(lt, [[.1, .3], [.24, 1.16, 'out'], [.38, .97, 'inOut'], [.5, 1, 'inOut']]) * (1 + .008 * Math.sin(TAU * ph));
    const shn = (lt > .6 && lt < 1.1) ? inv(.6, 1.1, lt) : (lt > 2.0 && lt < 2.5 ? inv(2.0, 2.5, lt) : -1);
    const shk = lt < .1 ? 0 : Math.exp(-(lt - .1) * 9) * 1.2;
    ctx.save(); ctx.translate(A.noise1(lt * 43) * 8 * shk, A.noise1(lt * 43 + 7) * 8 * shk);
    logoHero(ctx, EX, EY, ELW, { ex, sc, rot: -.12 * Math.exp(-Math.max(0, lt - .1) * 8) * Math.cos(Math.max(0, lt - .1) * 19), glow: .7 + .1 * Math.sin(TAU * ph), shine: shn, hot, alpha: clamp((lt - .1) * 20) });
    // shock ring
    const sr = inv(.1, .5, lt); if (sr > 0 && sr < 1) { V.ring(ctx, EX, EY, eo(sr) * 1000, 46 * (1 - sr) + 4, `rgba(255,255,255,${1 - sr})`); }
    // tagline
    tagline(ctx, EX, 850, inv(.5, .84, lt));
    // ---- Goty + smart TV + pill
    // ---- sakura falling (loop-safe: pure function of lt)
    for (let i = 0; i < 34; i++) {
      const sp = 90 + hash(i * 2.7) * 130, x0 = hash(i * 1.3) * 1300 - 100, y = ((hash(i * 4.1) * 1900 + lt * sp + 200) % 2200) - 200, x = x0 + Math.sin(lt * (.8 + hash(i)) + i) * 60 + lt * 40;
      const xx = ((x % 1300) + 1300) % 1300 - 110; petal(ctx, xx, y, 10 + hash(i * 8.3) * 14, i + lt * (1 + hash(i * 2)) * 2, .95);
    }
    V.mascot(ctx, 285, 1130, 1.3, { t: lt, t0: .7, pose: lt < 1.5 ? 'cheer' : 'point', look: 'cam', face: 'excited', talk: 0 });
    smartTV(ctx, 730, 1120, 400, lt, inv(.75, 1.3, lt));
    pillBar(ctx, EX, 1400, 880, 120, lt);
    // hero from vhero.js if the kit is ready
    if (window.V && V.hero && V.hero.DONE && typeof V.heroEnd === 'function') V.heroEnd(ctx, lt);
    for (let i = 0; i < 8; i++) { const tw = Math.pow(Math.max(0, Math.sin(TAU * (lt * .8 + hash(i * 2.2)))), 6) * clamp(inv(.5, .9, lt)); if (tw > .01) glint(ctx, EX + (hash(i * 3.3 + 1) - .5) * 800, EY + (hash(i * 5.1 + 2) - .5) * 300, 24 + 55 * tw, tw); }
    ctx.restore();
    cornerBrackets(ctx, eo(inv(.3, .7, lt)));
    // katakana pops
    const kp = inv(.1, .8, lt); if (kp > 0 && kp < 1) kata(ctx, 'パァァ', 700, 262, 150, { rot: -.12, sc: lerp(2.2, 1, eob(kp * 5)), a: 1 - smooth(.55, 1, kp) });
    // ---- entry: white light hit + speed lines cover the previous shot at once
    const fw = lt < .06 ? 1 : 1 - smooth(.06, .3, lt);
    if (fw > .002) { rays(ctx, EX, EY, 200, 1700, 54, 17, t, 'rgba(255,214,120,1)', fw * .9, .022); ctx.save(); ctx.globalAlpha = fw; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  } });
})();
