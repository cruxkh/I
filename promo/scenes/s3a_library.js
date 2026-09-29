// S3a: the weekly release calendar wall -> endless library -> picked poster expands. Global 15.81 - 20.64 (+0.3 tail)
(() => {
  const S0 = 15.81, S1 = 20.64;
  const CREAM = '#FFF6E0', CORAL = '#FF6B5B', TEAL = '#1FB6A6', GOLD = D.gold, INK = A.OUTLINE, VIO = '#7C5CFF';
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const STRIP = [CORAL, GOLD, TEAL, VIO, CORAL, TEAL, GOLD];
  const DAY_T0 = 15.98, DAY_DT = 0.33;
  const colX = i => 2400 - i * 400, rowY = r => 430 + 300 * r;
  const PW = 184, PH = 252;
  const HERO = { x: colX(3) + 96, y: rowY(3) };
  const TC = 19.95; // click time
  const PAL = [['#FF8A5B', '#FFC24A', CREAM], ['#1FB6A6', '#38D9F5', CREAM], ['#7C5CFF', '#FF4F9A', '#FFE08A'], ['#FF6B5B', '#FF4F9A', CREAM],
    ['#3D7BFF', '#38D9F5', CREAM], ['#FFC24A', '#FF8A3D', '#2B1B6B'], ['#3DDC84', '#1FB6A6', CREAM], ['#5B3DD9', '#FF6B5B', '#FFC24A']];

  // ---------- helpers ----------
  function sparkle(ctx, x, y, r, rot, fill) {
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = rot + k * Math.PI / 4, rr = k % 2 ? r * 0.26 : r; ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  function poster(ctx, w, h, seed, lw = 6) {
    const pal = PAL[Math.floor(A.hash(seed) * PAL.length)], m = Math.floor(A.hash(seed + 3) * 6), R = Math.min(w, h) * 0.1;
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, R); ctx.clip();
    ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, pal[0]], [1, pal[1]]]); ctx.fillRect(-w / 2, -h / 2, w, h);
    const dark = A.mixc(pal[0], '#1a1330', 0.4);
    if (m === 0) {
      ctx.beginPath(); ctx.arc(w * 0.15, -h * 0.2, w * 0.2, 0, A.TAU); ctx.fillStyle = pal[2]; ctx.fill();
      A.blob(ctx, [[-w * .6, h * .15], [-w * .25, -h * .02], [w * .1, h * .12], [w * .6, h * .0], [w * .6, h * .6], [-w * .6, h * .6]]); ctx.fillStyle = dark; ctx.fill();
    } else if (m === 1) {
      ctx.beginPath(); ctx.arc(0, -h * 0.1, w * 0.3, 0, A.TAU); ctx.fillStyle = pal[2]; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w * .1, -h * .1 - w * .15); ctx.lineTo(w * .17, -h * .1); ctx.lineTo(-w * .1, -h * .1 + w * .15); ctx.closePath(); ctx.fillStyle = pal[0]; ctx.fill();
    } else if (m === 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      for (let k = -2; k < 3; k++) { ctx.beginPath(); ctx.moveTo(k * w * .4 - w * .1, -h / 2); ctx.lineTo(k * w * .4 + w * .1, -h / 2); ctx.lineTo(k * w * .4 + w * .1 + h * .5, h / 2); ctx.lineTo(k * w * .4 - w * .1 + h * .5, h / 2); ctx.fill(); }
      D.starburst(ctx, 0, -h * .12, w * .12, w * .3, 5, -Math.PI / 2, pal[2]);
    } else if (m === 3) {
      ctx.beginPath(); ctx.arc(w * .05, -h * .14, w * .27, 0, A.TAU); ctx.fillStyle = pal[2]; ctx.fill();
      ctx.beginPath(); ctx.arc(w * .17, -h * .2, w * .24, 0, A.TAU); ctx.fillStyle = A.mixc(pal[0], pal[1], 0.25); ctx.fill();
      sparkle(ctx, -w * .3, h * .02, w * .07, 0, pal[2]); sparkle(ctx, w * .3, -h * .34, w * .05, 0, pal[2]);
    } else if (m === 4) {
      ctx.beginPath(); ctx.arc(-w * .12, -h * .22, w * .16, 0, A.TAU); ctx.fillStyle = pal[2]; ctx.fill();
      ctx.lineWidth = w * .055; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = -w * .6; x <= w * .6; x += 8) { const y = h * (0.02 + k * 0.13) + Math.sin(x / w * 7 + k) * h * .03; x === -w * .6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.arc(w * .2, -h * .26, w * .13, 0, A.TAU); ctx.fillStyle = pal[2]; ctx.fill();
      A.path(ctx, [[-w * .7, h * .2], [-w * .2, -h * .12], [w * .25, h * .2]]); ctx.fillStyle = dark; ctx.fill();
      A.path(ctx, [[-w * .1, h * .2], [w * .3, -h * .05], [w * .7, h * .2]]); ctx.fillStyle = A.mixc(dark, pal[1], 0.3); ctx.fill();
    }
    ctx.fillStyle = A.linear(ctx, 0, h * 0.1, 0, h / 2, [[0, 'rgba(26,19,48,0)'], [1, 'rgba(26,19,48,0.6)']]); ctx.fillRect(-w / 2, h * 0.1, w, h * .4);
    A.rrect(ctx, -w * .34, h * .27, w * .68, h * .06, h * .03); ctx.fillStyle = 'rgba(255,246,224,0.92)'; ctx.fill();
    A.rrect(ctx, -w * .34, h * .37, w * .42, h * .04, h * .02); ctx.fillStyle = 'rgba(255,246,224,0.55)'; ctx.fill();
    ctx.restore();
    A.rrect(ctx, -w / 2, -h / 2, w, h, R); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function heroArt(ctx, w, h, t, lw) {
    const mn = Math.min(w, h), R = Math.min(w, h) * 0.1 * (w > h * 1.2 ? 0 : 1);
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, Math.min(R, mn * .1)); ctx.clip();
    ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#FFD46A'], [0.55, '#FF9A4D'], [1, '#FF5F7E']]); ctx.fillRect(-w / 2, -h / 2, w, h);
    const cy = -h * 0.06, rad = Math.max(w, h) * 1.3;
    ctx.save(); ctx.translate(0, cy); ctx.rotate(t * 0.5);
    for (let k = 0; k < 14; k++) { const a = k * A.TAU / 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rad, a, a + A.TAU / 28); ctx.closePath(); ctx.fillStyle = 'rgba(255,246,224,0.2)'; ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = A.radial(ctx, 0, cy, 0, mn * .7, [[0, 'rgba(255,246,224,0.7)'], [1, 'rgba(255,246,224,0)']]); ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.beginPath(); ctx.arc(0, cy, mn * .27, 0, A.TAU); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = lw * 1.2; ctx.strokeStyle = INK; ctx.stroke();
    const q = mn * .27;
    ctx.beginPath(); ctx.moveTo(-q * .3, cy - q * .5); ctx.lineTo(q * .55, cy); ctx.lineTo(-q * .3, cy + q * .5); ctx.closePath(); ctx.fillStyle = '#5B3DD9'; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.4, d = mn * (.42 + .05 * (k % 2)); sparkle(ctx, Math.cos(a) * d * (w > h ? 1.3 : 1), cy + Math.sin(a) * d, mn * (.05 + .02 * (k % 3)) * (0.7 + 0.3 * Math.sin(t * 8 + k)), 0, CREAM); }
    A.rrect(ctx, -w * .34, h * .33, w * .68, h * .06, h * .03); ctx.fillStyle = 'rgba(255,246,224,0.95)'; ctx.fill();
    A.rrect(ctx, -w * .34, h * .42, w * .42, h * .04, h * .02); ctx.fillStyle = 'rgba(255,246,224,0.6)'; ctx.fill();
    ctx.restore();
    A.rrect(ctx, -w / 2, -h / 2, w, h, Math.min(R, mn * .1)); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function badge(ctx, x, y, s, rot, big) {
    if (s <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    A.rrect(ctx, -46, -19, 92, 38, 19); ctx.fillStyle = CORAL; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    A.text(ctx, 'חדש!', 0, 2, { font: '800 25px Rubik', fill: CREAM, dir: 'rtl' });
    ctx.restore();
  }
  function card(ctx, i, t) {
    const t0 = DAY_T0 + DAY_DT * i, p = A.inv(t0, t0 + 0.42, t); if (p <= 0) return;
    const cx = colX(i), top = 96, w = 352, h = 160, sy = Math.max(0.001, A.ease.outBack(p));
    ctx.save(); ctx.translate(cx, top); ctx.scale(1 + 0.06 * (1 - p), sy); ctx.rotate((1 - p) * (i % 2 ? 0.05 : -0.05));
    A.rrect(ctx, -w / 2 + 6, 12, w, h, 26); ctx.fillStyle = 'rgba(10,5,40,0.3)'; ctx.fill();
    A.rrect(ctx, -w / 2, 0, w, h, 26); ctx.fillStyle = CREAM; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = STRIP[i]; ctx.fillRect(-w / 2, 0, w, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w / 2, 0, w, 10); ctx.restore();
    A.rrect(ctx, -w / 2, 0, w, h, 26); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 6, 44); ctx.lineTo(w / 2 - 6, 44); ctx.lineWidth = 5; ctx.stroke();
    for (const rx of [-80, 80]) { ctx.beginPath(); ctx.arc(rx, 4, 11, 0, A.TAU); ctx.fillStyle = '#3a2f6b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    A.text(ctx, DAYS[i], 0, 108, { font: '900 78px Rubik', fill: INK, dir: 'rtl' });
    ctx.restore();
  }
  function tearSheet(ctx, i, t) {
    const t0 = DAY_T0 + DAY_DT * i, cx = colX(i), top = 96, w = 352, h = 160;
        const q = A.inv(t0, t0 + 0.5, t);
    if (q > 0 && q < 1) {
      ctx.save(); ctx.globalAlpha = 1 - q * q; ctx.translate(cx + (i % 2 ? 1 : -1) * 150 * q, top + 40 + 380 * q * q); ctx.rotate((i % 2 ? 1 : -1) * 0.9 * q);
      A.rrect(ctx, -w / 2, 0, w, h, 26); ctx.fillStyle = '#F3E6C4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 20, 0); for (let k = 0; k < 14; k++) ctx.lineTo(-w / 2 + 20 + k * 22, (k % 2) * 8); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    }
  function burst(ctx, x, y, tt, seed, n) {
    if (tt < 0 || tt > 0.6) return; const p = tt / 0.6;
    ctx.save(); ctx.globalAlpha = 1 - p * p;
    const cols = [GOLD, CREAM, '#38D9F5', '#FF9AB8'];
    for (let k = 0; k < n; k++) {
      const a = A.hash(seed + k * 3.1) * A.TAU, d = (50 + A.hash(seed + k) * 90) * A.ease.out(p), r = (12 + A.hash(seed + k * 7) * 16) * (1 - p * 0.7);
      sparkle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d - 30 * p, r, p * 2, cols[k % 4]);
    }
    ctx.restore();
  }

  // ---------- layout ----------
  const posters = [];
  for (let i = -4; i <= 10; i++) for (let r = 0; r <= 6; r++) for (let k = 0; k < 2; k++) {
    const x = colX(i) + (k ? -96 : 96), y = rowY(r), isNew = i >= 0 && i <= 6 && r < 2, hero = i === 3 && r === 3 && k === 0;
    if (hero) continue;
    const P = { x, y, seed: (i + 7) * 13 + r * 5 + k * 3, i, r, k, isNew };
    if (isNew) { const t0 = DAY_T0 + DAY_DT * i, n = r * 2 + k; P.tl = t0 + 0.28 + n * 0.08; }
    else { const d = Math.hypot(x - 1200, (y - 1000) * 1.3) / 2600; P.rt = 18.72 + 0.5 * d; }
    posters.push(P);
  }
  const heroSeed = 5;

  // ---------- camera ----------
  const lg = Math.log;
  function cam(t) {
    const x = A.key(t, [[15.8, 2150], [18.6, 330, 'inOut'], [18.85, 330], [19.6, 1180, 'inOut'], [20.55, HERO.x, 'inOut']]);
    const y = A.key(t, [[15.8, 540], [18.85, 540], [19.6, 1000, 'inOut'], [20.55, HERO.y, 'inOut']]);
    let z = Math.exp(A.key(t, [[15.8, lg(1.0)], [18.6, lg(1.03), 'inOut'], [18.85, lg(1.03)], [19.6, lg(0.44), 'inOut'], [20.0, lg(0.56), 'inOut'], [20.6, lg(2.3), 'inOut']]));
    z *= 1 + 0.16 * (1 - A.ease.out(A.inv(S0, S0 + 0.32, t)));
    const rot = (0.009 * Math.sin(t * 1.4) + 0.02 * (1 - A.ease.out(A.inv(S0, S0 + 0.35, t)))) * (1 - A.smooth(18.85, 19.5, t));
    return { x, y, z, rot };
  }
  const toScr = (c, wx, wy) => ({ x: 960 + (wx - c.x) * c.z, y: 540 + (wy - c.y) * c.z });
  const applyCam = (ctx, c) => { ctx.translate(960, 540); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y); };
  const visible = (c, wx, wy, rad) => { const s = toScr(c, wx, wy), r = rad * c.z; return s.x > -r - 60 && s.x < 1980 + r && s.y > -r - 60 && s.y < 1140 + r; };

  // ---------- background ----------
  const base = A.layer('s3a_base', 1920, 1080, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#3E2C9A'], [0.6, '#2B1B6B'], [1, '#1B1550']]); g.fillRect(0, 0, w, h);
    g.fillStyle = A.radial(g, 960, 200, 0, 900, [[0, 'rgba(255,214,140,0.42)'], [1, 'rgba(255,214,140,0)']]); g.fillRect(0, 0, w, h);
    g.fillStyle = A.radial(g, 200, 1000, 0, 800, [[0, 'rgba(31,182,166,0.3)'], [1, 'rgba(31,182,166,0)']]); g.fillRect(0, 0, w, h);
    g.fillStyle = A.radial(g, 1750, 900, 0, 700, [[0, 'rgba(255,107,91,0.2)'], [1, 'rgba(255,107,91,0)']]); g.fillRect(0, 0, w, h);
  });
  function background(ctx, t, c) {
    ctx.drawImage(base, 0, 0);
    ctx.save(); A.camera(ctx, { x: c.x * 0.4 + 700, y: c.y * 0.4 + 300, zoom: Math.pow(c.z, 0.45) });
    ctx.beginPath();
    for (let gx = -1600; gx < 4600; gx += 230) for (let gy = -400; gy < 2600; gy += 330) ctx.roundRect(gx + (Math.floor(gy / 330) % 2) * 60, gy, 150, 210, 18);
    ctx.fillStyle = 'rgba(255,246,224,0.055)'; ctx.fill();
    ctx.restore();
    for (let k = 0; k < 16; k++) {
      const f = 0.25 + A.hash(k + 40) * 0.6, r = 50 + A.hash(k) * 110;
      const x = (((A.hash(k + 9) * 2400 - c.x * f * 0.35 + t * 8 * f) % 2400) + 2400) % 2400 - 240, y = (((A.hash(k + 20) * 1400 - c.y * f * 0.2 - t * 12 * f) % 1400) + 1400) % 1400 - 160;
      A.glow(ctx, x, y, r, ['#FFD98A', '#38D9F5', '#FF9AB8', '#FFF6E0'][k % 4], 0.13 + 0.06 * Math.sin(t * 1.5 + k));
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 28; k++) {
      const x = ((A.hash(k + 70) * 1980 + t * (10 + 20 * A.hash(k + 5))) % 1980) - 30, y = (((A.hash(k + 90) * 1160 - t * (20 + 30 * A.hash(k + 6))) % 1160) + 1160) % 1160 - 40;
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + k * 2);
      sparkle(ctx, x, y, 4 + 7 * A.hash(k) * tw, 0, `rgba(255,240,200,${0.25 + 0.4 * tw})`);
    }
    ctx.restore();
  }

  // ---------- main ----------
  function world(ctx, t, c, skipHero) {
    // beam + today marker position
    const u = (t - DAY_T0) / DAY_DT, fi = Math.floor(u), ff = u - fi;
    const idx = u < 0 ? 0 : Math.min(6, fi === 0 ? 0 : (fi - 1) + A.ease.outBack(Math.min(1, ff * 2.4)));
    const mx = colX(0) - 400 * idx, hop = u > 1 && fi < 7 ? Math.sin(Math.PI * Math.min(1, ff * 2.4)) * 26 : 0;
    const mA = A.inv(DAY_T0 - 0.1, DAY_T0 + 0.1, t) * (1 - A.smooth(18.5, 18.78, t));
    // lit shelves
    for (let r = 0; r <= 6; r++) {
      const lit = Math.max(r < 2 ? 0.45 * A.inv(DAY_T0, DAY_T0 + 0.6, t) : 0, A.smooth(18.85 + 0.07 * r, 19.5 + 0.07 * r, t));
      if (lit <= 0.01) continue;
      const y0 = rowY(r) - PH / 2 - 30, y1 = rowY(r) + PH / 2 + 30;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 * lit;
      ctx.fillStyle = A.linear(ctx, 0, y0, 0, y1, [[0, 'rgba(255,190,90,0)'], [0.7, 'rgba(255,190,90,1)'], [1, 'rgba(255,120,70,0)']]);
      ctx.fillRect(-2000, y0, 6400, y1 - y0); ctx.restore();
    }
    if (mA > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * mA;
      ctx.fillStyle = A.linear(ctx, 0, 60, 0, 930, [[0, 'rgba(255,224,150,0.5)'], [1, 'rgba(255,224,150,0)']]); ctx.fillRect(mx - 190, 60, 380, 870); ctx.restore();
    }
    // planks
    for (let i = -4; i <= 10; i++) for (let r = 0; r <= 6; r++) {
      const isNew = i >= 0 && i <= 6 && r < 2, x = colX(i), y = rowY(r) + PH / 2 + 4;
      let p = 1;
      if (isNew) p = A.ease.out(A.inv(DAY_T0 + DAY_DT * i + r * 0.1, DAY_T0 + DAY_DT * i + r * 0.1 + 0.25, t));
      else { const d = Math.hypot(x - 1200, (rowY(r) - 1000) * 1.3) / 2600; p = A.ease.out(A.inv(18.72 + 0.5 * d, 19.1 + 0.5 * d, t)); }
      if (p <= 0 || !visible(c, x, y, 220)) continue;
      const wdt = 400 * p, x0 = x + 200 - wdt;
      ctx.fillStyle = 'rgba(10,5,40,0.3)'; ctx.fillRect(x0, y + 24, wdt, 14);
      ctx.fillStyle = A.linear(ctx, 0, y, 0, y + 26, [[0, '#FFE08A'], [0.35, '#F2B04A'], [1, '#C77F2E']]); ctx.fillRect(x0, y, wdt, 26);
      ctx.fillStyle = A.OUTLINE; ctx.fillRect(x0, y - 3, wdt, 4); ctx.fillRect(x0, y + 24, wdt, 4);
    }
    // posters
    const sp = [];
    for (const P of posters) {
      let sx = 1, sy = 1, dy = 0, rot = 0, show = true;
      if (P.isNew) {
        const p = (t - (P.tl - 0.28)) / 0.28;
        if (p <= 0) continue;
        if (p < 1) { dy = -(1 - p * p) * 800; sy = 1 + 0.14 * p; sx = 1 - 0.05 * p; rot = (1 - p) * (P.k ? 0.15 : -0.15); }
        else { const tt = t - P.tl, q = Math.exp(-tt * 13) * Math.cos(tt * 38) * 0.17; sx = 1 + q; sy = 1 - q; if (tt < 0.6) sp.push(P); }
        P._badge = A.ease.outBack(A.inv(P.tl + 0.1, P.tl + 0.36, t));
      } else {
        const p = (t - P.rt) / 0.3; if (p <= 0) continue;
        const s = A.ease.outBack(Math.min(1, p)); sx = sy = s;
      }
      if (!visible(c, P.x, P.y + dy, 220)) continue;
      const lw = c.z < 0.7 ? 8 : 6;
      ctx.save(); ctx.translate(P.x, P.y + PH / 2 + dy); ctx.rotate(rot); ctx.scale(sx, sy); ctx.translate(0, -PH / 2);
      A.rrect(ctx, -PW / 2 + 7, -PH / 2 + 12, PW, PH, 18); ctx.fillStyle = 'rgba(10,5,40,0.28)'; ctx.fill();
      poster(ctx, PW, PH, P.seed, lw);
      ctx.restore();
    }
    for (const P of posters) if (P.isNew && P._badge > 0 && t > P.tl + 0.1 && visible(c, P.x, P.y, 200)) badge(ctx, P.x + 50, P.y - PH / 2 + 8, P._badge, 0.16);
    // cards
    for (let i = 0; i < 7; i++) if (visible(c, colX(i), 180, 400)) tearSheet(ctx, i, t);
    for (let i = 0; i < 7; i++) if (visible(c, colX(i), 180, 260)) card(ctx, i, t);
    // marker
    if (mA > 0) {
      const sc = A.ease.outBack(mA);
      ctx.save(); ctx.translate(mx, 52 - hop); ctx.scale(sc, sc);
      ctx.beginPath(); ctx.moveTo(-16, 20); ctx.lineTo(16, 20); ctx.lineTo(0, 40); ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      A.rrect(ctx, -62, -24, 124, 46, 23); ctx.fillStyle = A.linear(ctx, 0, -24, 0, 22, [[0, '#FFE08A'], [1, GOLD]]); ctx.fill(); ctx.stroke();
      A.text(ctx, 'היום', 0, 0, { font: '900 32px Rubik', fill: INK, dir: 'rtl' });
      ctx.restore();
      A.glow(ctx, mx, 60, 160, '#FFD98A', 0.35 * mA);
    }
    // sparkle bursts
    for (const P of sp) burst(ctx, P.x, P.y, t - P.tl, P.seed, 5);
    for (let i = 0; i < 7; i++) { const tt = t - (DAY_T0 + DAY_DT * i + 0.12); if (tt > 0 && tt < 0.6) burst(ctx, colX(i), 250, tt, i * 11 + 1, 7); }
    if (!skipHero) heroWorld(ctx, t, c);
  }
  function heroState(t) {
    const hb = t > 19.3 && t < TC ? 0.06 * Math.pow(Math.max(0, Math.sin((t - 19.3) * A.TAU / 0.36)), 3) : 0;
    let s = 1 + hb, rot = 0;
    if (t >= TC) { s = A.key(t, [[TC, 1], [TC + 0.08, 0.9, 'out'], [TC + 0.42, 1.34, 'outBack'], [S1, 1.4, 'out']]); rot = A.key(t, [[TC + 0.08, 0.05], [TC + 0.5, 0, 'outBack']]); }
    const appear = A.ease.outBack(A.inv(18.72, 19.05, t));
    return { s: s * appear, rot };
  }
  function heroWorld(ctx, t, c) {
    const hs = heroState(t); if (hs.s <= 0.001) return;
    const hx = HERO.x, hy = HERO.y, glowK = A.smooth(19.0, 19.5, t);
    const pulse = 0.75 + 0.25 * Math.sin(t * 14);
    A.glow(ctx, hx, hy, 520 * hs.s, '#FFC24A', 0.85 * glowK * pulse);
    A.glow(ctx, hx, hy, 300 * hs.s, '#FFF1C0', 0.6 * glowK);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(hs.rot); ctx.scale(hs.s, hs.s);
    if (glowK > 0) { // rotating light rays behind
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(t * 0.6);
      for (let k = 0; k < 12; k++) { const a = k * A.TAU / 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 620, a, a + 0.12); ctx.closePath(); ctx.fillStyle = `rgba(255,214,130,${0.16 * glowK})`; ctx.fill(); }
      ctx.restore();
    }
    A.rrect(ctx, -PW / 2 + 8, -PH / 2 + 16, PW, PH, 18); ctx.fillStyle = 'rgba(10,5,40,0.35)'; ctx.fill();
    heroArt(ctx, PW, PH, t, 7);
    const bs = A.ease.outBack(A.inv(19.55, 19.85, t)) * (1 + 0.5 * A.inv(TC, TC + 0.4, t));
    badge(ctx, PW / 2 - 34, -PH / 2 + 10, bs * 1.25, 0.16, true);
    // orbiting sparkles
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) { const a = t * 2 + k * 1.05, d = 150 + 20 * Math.sin(t * 3 + k); sparkle(ctx, Math.cos(a) * d, Math.sin(a) * d * 1.15, 12 + 8 * Math.sin(t * 9 + k * 2), t, `rgba(255,240,190,${0.8 * glowK})`); }
    ctx.restore();
    ctx.restore();
  }

  function cursor(ctx, t, c) {
    if (t < 19.3 || t > 20.32) return;
    const tgt = toScr(c, HERO.x, HERO.y), st = { x: 1560, y: 820 };
    const p = A.ease.inOut(A.inv(19.3, 19.93, t));
    let x = A.lerp(st.x, tgt.x + 6, p), y = A.lerp(st.y, tgt.y + 40, p) - Math.sin(p * Math.PI) * 90;
    const press = t >= 19.93 && t < 20.06 ? 0.82 : 1, appear = A.ease.outBack(A.inv(19.3, 19.48, t)), out = 1 - A.smooth(20.12, 20.32, t);
    ctx.save(); ctx.globalAlpha = out; ctx.translate(x, y); ctx.scale(appear * press * 1.35, appear * press * 1.35); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4, 50); ctx.lineTo(15, 39); ctx.lineTo(23, 58); ctx.lineTo(32, 54); ctx.lineTo(24, 36); ctx.lineTo(39, 36); ctx.closePath();
    ctx.fillStyle = 'rgba(10,5,40,0.3)'; ctx.fill();
    ctx.translate(-2, -4);
    ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4, 50); ctx.lineTo(15, 39); ctx.lineTo(23, 58); ctx.lineTo(32, 54); ctx.lineTo(24, 36); ctx.lineTo(39, 36); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    const q = A.inv(TC, TC + 0.3, t);
    if (q > 0 && q < 1) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, 14 + 110 * A.ease.out(q), 0, A.TAU); ctx.lineWidth = 12 * (1 - q); ctx.strokeStyle = `rgba(255,224,138,${1 - q})`; ctx.stroke(); ctx.restore();
    }
  }

  function draw(ctx, s) {
    const t = s.t, c = cam(t);
    // entry iris burst
    const ip = A.inv(S0, S0 + 0.27, t), ir = 1300 * A.ease.out(ip);
    ctx.save();
    if (ip < 1) { ctx.beginPath(); ctx.arc(960, 540, ir, 0, A.TAU); ctx.clip(); }
    ctx.save(); background(ctx, t, c); ctx.restore();
    ctx.save(); applyCam(ctx, c); world(ctx, t, c, true); ctx.restore();
    const dim = A.smooth(TC, 20.4, t) * 0.94;
    if (dim > 0) { ctx.fillStyle = `rgba(7,5,29,${dim})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (t < 20.5) { ctx.save(); applyCam(ctx, c); heroWorld(ctx, t, c); ctx.restore(); }
    cursor(ctx, t, c);
    if (t < 16.45) { // colourful tile wall bursting in, then shrinking away
      const cols = [CORAL, GOLD, TEAL, VIO, '#38D9F5', '#FF9AB8'];
      for (let gx = 0; gx < 9; gx++) for (let gy = 0; gy < 5; gy++) {
        const x = 120 + gx * 210, y = 100 + gy * 215, d = Math.hypot(x - 960, y - 540) / 1200;
        const a = A.ease.outBack(A.inv(S0 + 0.04 + d * 0.12, S0 + 0.2 + d * 0.12, t)), b = 1 - A.ease.in(A.inv(15.99 + d * 0.12, 16.2 + d * 0.12, t)), sc = a * b;
        if (sc <= 0.01) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate((1 - b) * (gx % 2 ? 0.6 : -0.6)); ctx.scale(sc, sc);
        A.rrect(ctx, -105, -105, 210, 210, 34); ctx.fillStyle = A.linear(ctx, 0, -105, 0, 105, [[0, cols[(gx + gy) % 6]], [1, A.mixc(cols[(gx + gy) % 6], '#2B1B6B', 0.35)]]); ctx.fill();
        ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
        sparkle(ctx, -30, -30, 26, 0, 'rgba(255,255,255,0.7)'); ctx.restore();
      }
    }
    // morph to full screen
    if (t >= 20.5) {
      const hs = heroState(20.5), c0 = cam(20.5), sc0 = c0.z * hs.s;
      const w0 = PW * sc0, h0 = PH * sc0, cx0 = toScr(c0, HERO.x, HERO.y);
      const p = A.ease.inOut(A.inv(20.5, 20.94, t));
      const w = A.lerp(w0, 1920, p), h = A.lerp(h0, 1080, p), cx = A.lerp(cx0.x, 960, p), cy = A.lerp(cx0.y, 540, p);
      A.glow(ctx, cx, cy, Math.max(w, h) * 0.8, '#FFC24A', 0.5 * (1 - p));
      ctx.save(); ctx.translate(cx, cy); heroArt(ctx, w, h, t, A.lerp(7 * sc0, 0, p)); ctx.restore();
    }
    ctx.restore();
    if (ip < 1) { // ring
      ctx.save(); ctx.beginPath(); ctx.arc(960, 540, ir, 0, A.TAU); ctx.lineWidth = 34 * (1 - ip * 0.7); ctx.strokeStyle = GOLD; ctx.stroke();
      ctx.lineWidth = 12 * (1 - ip * 0.7); ctx.strokeStyle = CREAM; ctx.stroke();
      const cols = [CORAL, TEAL, GOLD, VIO, '#38D9F5'];
      for (let k = 0; k < 20; k++) { const a = k * A.TAU / 20 + A.hash(k) * 0.3, d = ir + 30 + 260 * A.ease.out(ip) * (0.5 + A.hash(k + 4)); ctx.save(); ctx.translate(960 + Math.cos(a) * d, 540 + Math.sin(a) * d); ctx.rotate(a + ip * 3); ctx.globalAlpha = 1 - ip; A.rrect(ctx, -22, -22, 44, 44, 10); ctx.fillStyle = cols[k % 5]; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      ctx.restore();
    }
  }
  A.scene({ name: 's3a_library', start: S0, end: S1, draw });
})();
