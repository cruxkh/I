// V2 (v4 ANIME LEGEND): LIVE ISRAEL wall (4.97-6.55 + hold3) -> NETFLIX curtain-drop (6.99) -> DISNEY+ comet magic night (8.17)
// Clock = VO clock v. Ambient hold motion uses A.H.u only (looping, zero at start/end of the hold).
(() => {
  const { clamp, lerp, ease, hash, rng, inv, TAU } = A;
  const W = 1080, HH = 1920, INK = '#120a24';
  const CJK = '"IPAGothic","WenQuanYi Zen Hei",Rubik,sans-serif';
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t)), ein = t => ease.in(clamp(t)), eio = t => ease.inOut(clamp(t));
  const T0 = 4.97, TEND = 9.32;
  const amb = () => { const H = A.H; return H ? { on: true, u: H.u, ph: H.u / H.dur, env: Math.sin(Math.PI * H.u / H.dur), s: Math.sin(TAU * H.u / H.dur), c: 1 - Math.cos(TAU * H.u / H.dur) } : { on: false, u: 0, ph: 0, env: 0, s: 0, c: 0 }; };
  const scr = {};
  const scratch = (w, h, k) => { let c = scr[k]; if (!c) c = scr[k] = document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); return [c, g]; };

  // ---------- helpers
  function ink(ctx, s, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.sc) ctx.scale(o.sc, o.sc); if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
    ctx.font = `${o.w || 900} ${size}px ${o.font || CJK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.direction = o.dir || 'ltr';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.lineWidth = size * (o.ow || .24); ctx.strokeStyle = o.out || INK; ctx.strokeText(s, 0, 0);
    if (o.col2) { ctx.lineWidth = size * .1; ctx.strokeStyle = o.col2; ctx.strokeText(s, size * .03, size * .04); }
    ctx.fillStyle = o.grad ? V.lin(ctx, 0, -size * .5, 0, size * .5, o.grad) : (o.fill || '#fff'); ctx.fillText(s, 0, 0); ctx.restore();
  }
  function speed(ctx, cx, cy, seed, n, r0, r1, col, a, t, wid = 1) {
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = a; const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const an = r() * TAU + Math.sin(t * 31 + i * 3) * .003, w = (.006 + r() * .022) * wid, ra = r0 * (.85 + .3 * r()), rb = r1 * (.75 + .5 * r());
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * ra, cy + Math.sin(an) * ra); ctx.lineTo(cx + Math.cos(an - w) * rb, cy + Math.sin(an - w) * rb); ctx.lineTo(cx + Math.cos(an + w) * rb, cy + Math.sin(an + w) * rb); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  const halftone = (w, h, step, k) => A.layer('ht' + k, w, h, (g) => { g.fillStyle = '#fff'; for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const xx = x + ((y / step) & 1) * step / 2, f = 1 - y / h; const r = step * .5 * f * f * (.6 + .4 * Math.sin(x * .011)); if (r > .4) { g.beginPath(); g.arc(xx, y, r, 0, TAU); g.fill(); } } });
  function star4(ctx, x, y, r, col, rot = 0, a = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * .16 : r; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  function wipeClip(ctx, edge, slant, dirRight) { // region revealed = right of edge (dirRight false) or left of edge (true)
    ctx.beginPath();
    if (!dirRight) { ctx.moveTo(edge + slant, -10); ctx.lineTo(W + 400, -10); ctx.lineTo(W + 400, HH + 10); ctx.lineTo(edge - slant, HH + 10); }
    else { ctx.moveTo(-400, -10); ctx.lineTo(edge + slant, -10); ctx.lineTo(edge - slant, HH + 10); ctx.lineTo(-400, HH + 10); }
    ctx.closePath(); ctx.clip();
  }
  function wipeBand(ctx, edge, slant, cols) {
    ctx.save(); for (let i = 0; i < cols.length; i++) { const o = i * 34; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(edge + slant + o, -10); ctx.lineTo(edge + slant + o + 30, -10); ctx.lineTo(edge - slant + o + 30, HH + 10); ctx.lineTo(edge - slant + o, HH + 10); ctx.closePath(); ctx.fill(); } ctx.restore();
  }
  // logo with cel-glow + shine sweep (clipped to the logo alpha)
  function heroLogo(ctx, name, cx, cy, w, o = {}) {
    const im = V.logoImg(name); if (!im) return null;
    const h = w * im.height / im.width, cw = Math.ceil(w), ch = Math.ceil(h), [c, g] = scratch(cw, ch, 'logo');
    g.drawImage(im, 0, 0, cw, ch);
    if (o.shine != null && o.shine > -.4 && o.shine < 1.4) {
      g.globalCompositeOperation = 'source-atop'; const x0 = -ch * .6 + o.shine * (cw + ch * 1.2), gr = g.createLinearGradient(x0 - 60, 0, x0 + 60, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${o.shineA ?? .9})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.save(); g.transform(1, 0, -.35, 1, ch * .17, 0); g.fillRect(x0 - 60, 0, 120, ch); g.restore();
    }
    ctx.save(); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); const sc = o.sc ?? 1; ctx.scale(sc * (o.sx ?? 1), sc * (o.sy ?? 1)); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur ?? 50; }
    ctx.drawImage(c, -cw / 2, -ch / 2); ctx.restore(); return { w: cw, h: ch };
  }

  // ---------- flag
  function flag(ctx, x, y, w, h, t) {
    const n = 16, sw = w / n; ctx.save();
    for (let i = 0; i < n; i++) {
      const d = Math.sin(t * 5 - i * .55) * 9 * (i / n + .15), dx = x + i * sw;
      ctx.save(); ctx.beginPath(); ctx.rect(dx, y + d, sw + 1, h); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(dx, y + d, sw + 1, h);
      ctx.fillStyle = '#1f52c9'; ctx.fillRect(dx, y + d + h * .1, sw + 1, h * .13); ctx.fillRect(dx, y + d + h * .77, sw + 1, h * .13);
      const sh = .06 * Math.cos(t * 5 - i * .55); ctx.fillStyle = sh > 0 ? `rgba(255,255,255,${sh * 2})` : `rgba(10,20,80,${-sh * 3})`; ctx.fillRect(dx, y + d, sw + 1, h); ctx.restore();
    }
    // star of david (follows wave at centre)
    const cxs = x + w / 2, dd = Math.sin(t * 5 - (n / 2) * .55) * 9 * .65, r = h * .21; ctx.strokeStyle = '#1f52c9'; ctx.lineWidth = h * .035; ctx.lineJoin = 'miter';
    for (const s of [1, -1]) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = s * (-Math.PI / 2) + i * TAU / 3; ctx.lineTo(cxs + Math.cos(an) * r, y + h / 2 + dd + Math.sin(an) * r); } ctx.closePath(); ctx.stroke(); }
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h); ctx.restore();
  }

  // ---------- BLOCK A: Tel Aviv blue hour + channel wall
  const skyA = () => A.layer('skyA', W, HH, (g) => {
    g.fillStyle = V.lin(g, 0, 0, 0, 1040, [[0, '#120a48'], [.3, '#3a1f86'], [.58, '#b8409a'], [.8, '#ff7a80'], [1, '#ffc07a']]); g.fillRect(0, 0, W, HH);
    const r = rng(11);
    for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * 560, s = 1 + r() * 2.6; g.globalAlpha = .4 + r() * .6; g.fillStyle = '#fff'; g.fillRect(x, y, s, s); }
    g.globalAlpha = 1;
    // cel clouds (flat two-tone with rim)
    const cloud = (x, y, s, c1, c2) => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = c1; g.beginPath(); g.ellipse(0, 0, 200, 40, 0, 0, TAU); g.ellipse(-90, -18, 90, 38, 0, 0, TAU); g.ellipse(50, -30, 110, 46, 0, 0, TAU); g.fill(); g.fillStyle = c2; g.beginPath(); g.ellipse(10, 18, 180, 22, 0, 0, TAU); g.fill(); g.restore(); };
    cloud(250, 560, 1.4, '#ff8fb0', '#c2479f'); cloud(820, 470, 1.1, '#ffb28f', '#e0607f'); cloud(560, 700, 1.7, '#ff9aa0', '#cf4c93'); cloud(120, 820, 1.0, '#ffd08a', '#ff8a7a'); cloud(930, 760, 1.2, '#ffc08e', '#ec6b86');
    // sun glow horizon
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = V.rad(g, 540, 1010, 0, 700, [[0, 'rgba(255,190,110,.75)'], [1, 'rgba(255,120,120,0)']]); g.fillRect(0, 300, W, 800); g.restore();
    // sea
    g.fillStyle = V.lin(g, 0, 1010, 0, HH, [[0, '#ff8a86'], [.06, '#6a3aa8'], [.25, '#1d2f8c'], [1, '#080d34']]); g.fillRect(0, 1010, W, HH - 1010);
    g.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 60; i++) { const y = 1030 + i * i * .22 + i * 6, w = 60 + r() * 240; g.fillRect(r() * W, y, w, 3 + i * .07); }
    // skyline (dark cel silhouettes with rim light)
    const bld = (x, w, h, col) => { g.fillStyle = col; g.fillRect(x, 1010 - h, w, h + 6); g.fillStyle = 'rgba(255,150,130,.55)'; g.fillRect(x + w - 5, 1010 - h, 5, h); g.fillStyle = 'rgba(255,220,130,.9)'; for (let yy = 1010 - h + 16; yy < 990; yy += 22) for (let xx = x + 8; xx < x + w - 14; xx += 18) if (r() < .22) g.fillRect(xx, yy, 8, 10); };
    for (let x = -20; x < W + 20; x += 40 + r() * 26) bld(x, 40 + r() * 50, 90 + r() * 240, '#170f3f');
    // Azrieli: round, square, triangle
    const rx = 320, sx = 540, tx = 770;
    g.fillStyle = '#0c0730'; g.beginPath(); g.roundRect(rx - 95, 1010 - 640, 190, 650, [95, 95, 0, 0]); g.fill(); g.fillStyle = 'rgba(255,150,130,.65)'; g.beginPath(); g.roundRect(rx + 62, 1010 - 640, 33, 650, [0, 95, 0, 0]); g.fill();
    g.fillRect(sx - 80, 1010 - 570, 160, 580); g.fillStyle = '#0c0730'; g.fillRect(sx - 80, 1010 - 570, 160, 580); g.fillStyle = 'rgba(255,150,130,.65)'; g.fillRect(sx + 52, 1010 - 570, 28, 580);
    g.fillStyle = '#0c0730'; g.beginPath(); g.moveTo(tx - 100, 1016); g.lineTo(tx - 100, 1010 - 500); g.lineTo(tx + 100, 1010 - 430); g.lineTo(tx + 100, 1016); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,150,130,.6)'; g.beginPath(); g.moveTo(tx + 70, 1010 - 442); g.lineTo(tx + 100, 1010 - 430); g.lineTo(tx + 100, 1016); g.lineTo(tx + 70, 1016); g.fill();
    const wins = (x0, x1, top) => { for (let yy = top + 22; yy < 1000; yy += 26) { g.fillStyle = r() < .82 ? 'rgba(255,224,150,.95)' : 'rgba(90,60,150,.8)'; for (let xx = x0 + 10; xx < x1 - 10; xx += 20) { if (r() < .8) g.fillRect(xx, yy, 12, 8); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, yy + 12, x1 - x0, 3); } };
    wins(rx - 88, rx + 60, 1010 - 620); wins(sx - 72, sx + 50, 1010 - 550); wins(tx - 92, tx + 68, 1010 - 440);
    g.fillStyle = '#0c0730'; g.fillRect(tx + 60, 1010 - 560, 6, 130); g.fillRect(sx - 3, 1010 - 640, 6, 70);
    // ink lines
    g.strokeStyle = 'rgba(8,4,30,.9)'; g.lineWidth = 4; g.strokeRect(sx - 80, 1010 - 570, 160, 580);
    // reflections
    g.save(); g.globalAlpha = .35; g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 46; i++) { g.fillStyle = i % 3 ? '#ffd68a' : '#ff8a9a'; g.fillRect(200 + r() * 700, 1030 + r() * 300, 6 + r() * 10, 20 + r() * 60); } g.restore();
    g.fillStyle = '#0a0632'; g.fillRect(0, 1004, W, 8);
  });
  const PL = [
    { k: 'kan11', dark: 1, x: 780, y: 470, t: 5.12, r: .04 }, { k: 'keshet12', x: 300, y: 470, t: 5.21, r: -.035 }, { k: 'reshet13', x: 780, y: 750, t: 5.30, r: -.03 },
    { k: 'ch14', x: 300, y: 750, t: 5.59, r: .04 }, { k: 'ch9', x: 780, y: 1030, t: 5.68, r: .035 }, { k: 'i24', dark: 1, x: 300, y: 1030, t: 5.82, r: -.04 },
  ];
  function plate(ctx, p, i, t, am) {
    const age = t - p.t; if (age < 0) return;
    const pop = eob(age / .3), sc = pop * (1 + .08 * Math.exp(-age * 12) * Math.sin(age * 40)), w = 440, h = 250;
    const bob = am.on ? Math.sin(TAU * am.ph + i * 1.1) * 7 : 0, sh = am.on ? clamp((am.ph * 1.5 - i * .1 - .05) / .5) : clamp((age - .1) / .45);
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.rotate(p.r * (2 - pop) + (am.on ? Math.sin(TAU * am.ph + i) * .006 : 0)); ctx.scale(sc, sc);
    // burst rays
    if (age < .35) speed(ctx, 0, 0, 40 + i, 22, 150, 330 + age * 500, '#fff', .55 * (1 - age / .35), t, 1.2);
    ctx.fillStyle = 'rgba(10,4,40,.62)'; A.rrect(ctx, -w / 2 + 16, -h / 2 + 18, w, h, 40); ctx.fill();
    A.rrect(ctx, -w / 2, -h / 2, w, h, 40); ctx.fillStyle = p.dark ? V.lin(ctx, 0, -h / 2, 0, h / 2, [[0, '#2b2f86'], [1, '#0c0f3a']]) : V.lin(ctx, 0, -h / 2, 0, h / 2, [[0, '#ffffff'], [1, '#d6e0ff']]); ctx.fill();
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, 40); ctx.clip();
    // gloss band + screentone corner
    ctx.fillStyle = `rgba(255,255,255,${p.dark ? .16 : .55})`; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w * .05, -h / 2); ctx.lineTo(-w * .3, h * .05); ctx.lineTo(-w / 2, h * .12); ctx.fill();
    ctx.fillStyle = p.dark ? 'rgba(90,209,255,.28)' : 'rgba(47,107,255,.18)'; for (let yy = h / 2 - 60; yy < h / 2; yy += 9) for (let xx = w / 2 - 150 + ((yy / 9) & 1) * 4.5; xx < w / 2; xx += 9) { ctx.beginPath(); ctx.arc(xx, yy, 2.2 * (1 - (h / 2 - yy) / 60) + .5, 0, TAU); ctx.fill(); }
    if (sh > 0 && sh < 1) { const x0 = lerp(-w * .7, w * .7, sh); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x0 - 30, -h / 2); ctx.lineTo(x0 + 30, -h / 2); ctx.lineTo(x0 - 30 - 80, h / 2); ctx.lineTo(x0 - 90 - 30, h / 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    A.rrect(ctx, -w / 2, -h / 2, w, h, 40); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); A.rrect(ctx, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 32); ctx.lineWidth = 3; ctx.strokeStyle = p.dark ? 'rgba(90,209,255,.8)' : 'rgba(255,255,255,.9)'; ctx.stroke();
    const sq = p.k === 'reshet13' || p.k === 'ch14';
    V.drawLogo(ctx, p.k, 0, 4, sq ? 190 : w * .72, sq ? 190 : h * .64, { shadow: false });
    // LIVE badge
    ctx.save(); ctx.translate(-w / 2 + 84, -h / 2 + 4); ctx.rotate(-.06); const pulse = .5 + .5 * Math.sin((am.on ? am.ph * TAU * 2 : t * 6) + i);
    A.rrect(ctx, -62, -25, 124, 50, 25); ctx.fillStyle = V.lin(ctx, 0, -25, 0, 25, [[0, '#ff5a64'], [1, '#d10f2a']]); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${.6 + .4 * pulse})`; ctx.beginPath(); ctx.arc(-34, 0, 9 + pulse * 2, 0, TAU); ctx.fill(); ink(ctx, 'LIVE', 14, 2, 30, { font: 'Rubik', ow: 0, out: 'rgba(0,0,0,0)', w: 900 });
    ctx.restore(); ctx.restore();
  }
  function blockA(ctx, t, am) {
    const z = 1.12 - .07 * eo(inv(T0, 5.7, t)) + am.env * .014, dut = -.035 * (1 - eo(inv(T0, 5.5, t)));
    ctx.save(); ctx.translate(540, 900); ctx.rotate(dut); ctx.scale(z, z); ctx.translate(-540 - am.env * 10, -900);
    ctx.drawImage(skyA(), 0, 0);
    // sea sparkles
    const tt = am.on ? am.ph * TAU : t; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const x = 120 + hash(i) * 840, y = 1040 + hash(i + 9) * 240, a = Math.max(0, Math.sin(tt * (am.on ? 1 : 3) + i * 2.3)); star4(ctx, x, y, 14 + a * 12, '#ffe6a8', 0, a * .8); } ctx.restore();
    flag(ctx, 812, 610, 210, 145, t); ctx.fillStyle = '#eee'; ctx.fillRect(806, 606, 9, 410); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(806, 606, 9, 410);
    ctx.restore();
    // wall dimming + speed lines
    const dim = eio(inv(5.05, 5.8, t)); ctx.save(); ctx.globalAlpha = .5 * dim; ctx.fillStyle = '#0a0430'; ctx.fillRect(0, 0, W, HH); ctx.globalAlpha = .22 * dim; ctx.drawImage(halftone(W, HH, 22, 'A'), 0, 0); ctx.restore();
    speed(ctx, 540, 760, 3, 46, 420, 1300, '#fff', .16 * dim, t + am.u, 1.4);
    for (let i = 0; i < 6; i++) plate(ctx, PL[i], i, t, am);
    // LIVE banner (hit on "כל", 4.97)
    const ba = t - T0; { const pop = eob(ba / .26); if (ba >= 0) {
      ctx.save(); ctx.translate(540, 232); ctx.rotate(-.03); ctx.scale(pop, pop);
      A.rrect(ctx, -300, -62, 600, 124, 26); ctx.fillStyle = 'rgba(10,4,40,.65)'; ctx.save(); ctx.translate(12, 14); ctx.fill(); ctx.restore();
      A.rrect(ctx, -300, -62, 600, 124, 26); ctx.fillStyle = V.lin(ctx, 0, -62, 0, 62, [[0, '#ff5a64'], [1, '#c70f30']]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      const pl = .5 + .5 * Math.sin(am.on ? am.ph * TAU * 3 : t * 8); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-232, 0, 22 + pl * 4, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ink(ctx, 'LIVE', -66, 4, 104, { font: 'Rubik', ow: .14, out: '#5a0618', fill: '#fff' });
      const fp = eob((t - 5.83) / .3); ctx.save(); ctx.translate(196, 0); ctx.scale(.62 * (t < 5.83 ? .8 : fp * (1 + .1 * Math.exp(-(t - 5.83) * 10))), .62 * (t < 5.83 ? .8 : fp)); flag(ctx, -105, -72, 210, 144, t); ctx.restore();
      ctx.restore(); if (ba < .3) speed(ctx, 540, 232, 5, 26, 100, 400 + ba * 900, '#fff', .6 * (1 - ba / .3), t); } }
    if (t >= 5.83 && t < 6.2) { const a = t - 5.83; ctx.save(); ctx.globalCompositeOperation = 'lighter'; V.ring(ctx, 296, 1030, 100 + a * 900, 20 * (1 - a / .37), '#ffe6a8', 1 - a / .37); V.ring(ctx, 540, 232, 200 + a * 800, 14 * (1 - a / .37), '#fff', .8 * (1 - a / .37)); ctx.restore(); }
    // sakura petals
    for (let i = 0; i < 14; i++) { const sp = 40 + hash(i) * 60, x = (hash(i + 3) * 1300 - (t - T0) * sp * .5 + (am.on ? am.s * 30 : 0) + 1400) % 1300 - 110, y = (hash(i + 7) * 2000 + (t - T0) * sp * .7 + (am.on ? am.env * 40 : 0)) % 2000 - 60; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.4 + i + (am.on ? am.s : 0)); ctx.fillStyle = i % 2 ? '#ffb7d0' : '#ff8fb8'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }

  // ---------- curtains (A->B transition and the Netflix reveal)
  function curtains(ctx, t) {
    const gap = t < 6.68 ? 560 : t < 6.99 ? lerp(560, 0, eio(inv(6.68, 6.90, t))) : lerp(0, 700, eo(inv(6.99, 7.13, t)));
    if (gap >= 690) return; const wob = t > 6.99 ? Math.sin(t * 20) * 6 * Math.exp(-(t - 6.99) * 6) : 0;
    for (const side of [-1, 1]) {
      ctx.save(); if (side < 0) { ctx.beginPath(); ctx.rect(-300, 0, 540 + 300 - gap + wob, HH); } else { ctx.beginPath(); ctx.rect(540 + gap - wob, 0, 540 + 300 - gap, HH); } ctx.clip();
      const x0 = side < 0 ? -20 : 560, x1 = side < 0 ? 560 : 1100; // folds
      ctx.fillStyle = '#8a0a22'; ctx.fillRect(-300, 0, 1700, HH);
      for (let x = -300; x < 1400; x += 54) { const sh = Math.sin(x * .13 + (side < 0 ? 0 : 2)), gx = x + (side < 0 ? -gap * .18 : gap * .18); ctx.fillStyle = sh > 0 ? 'rgba(255,90,100,.30)' : 'rgba(30,0,20,.38)'; ctx.fillRect(gx, 0, 27, HH); ctx.fillStyle = 'rgba(255,190,150,.18)'; ctx.fillRect(gx + 22, 0, 5, HH); }
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.drawImage(halftone(W, HH, 26, 'C'), 0, 0);
      ctx.restore();
      const ex = side < 0 ? 540 - gap + wob : 540 + gap - wob; ctx.save(); ctx.fillStyle = V.lin(ctx, ex - 14, 0, ex + 14, 0, [[0, '#ffe9a8'], [.5, '#ffc24a'], [1, '#c8801a']]); ctx.fillRect(ex - 14 * (side > 0 ? 0 : 1), 0, 14, HH); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex, HH); ctx.stroke(); ctx.restore();
    }
    // slit of light between the curtains
    if (t >= 6.9 && t < 6.99) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${(t - 6.9) / .09})`; ctx.fillRect(536, 0, 8, HH); ctx.restore(); }
    if (t >= 6.7 && t < 7.0) { ink(ctx, 'ゴゴゴ', 540, 380, 130 + Math.sin(t * 60) * 4, { rot: -.06, fill: '#ffd84a', out: INK, col2: '#ff3b4a', alpha: clamp((t - 6.7) / .08) * (t > 6.95 ? .5 : 1) }); }
  }

  // ---------- BLOCK B: NETFLIX
  const posterCols = [['#ff3b4a', '#5a0a2a'], ['#5aa0ff', '#141a6b'], ['#ffc24a', '#7a2a0a'], ['#b06bff', '#231060'], ['#3ddc84', '#08403a'], ['#ff6fb0', '#4a0a4a']];
  function poster(ctx, i, w, h) {
    const [c1, c2] = posterCols[i % 6]; A.rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.fillStyle = V.lin(ctx, 0, -h / 2, 0, h / 2, [[0, c1], [1, c2]]); ctx.fill();
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(w * .15, -h * .18, w * .28, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; const k = i % 4;
    if (k === 0) { ctx.beginPath(); ctx.arc(0, -h * .05, w * .17, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, h * .32, w * .38, h * .22, 0, Math.PI, TAU); ctx.fill(); }
    else if (k === 1) { ctx.beginPath(); ctx.moveTo(-w / 2, h * .4); ctx.lineTo(-w * .15, -h * .05); ctx.lineTo(w * .05, h * .2); ctx.lineTo(w * .28, -h * .15); ctx.lineTo(w / 2, h * .4); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill(); }
    else if (k === 2) { for (let b = 0; b < 5; b++) ctx.fillRect(-w * .4 + b * w * .17, h * .3 - (b % 3 + 1) * h * .12, w * .13, (b % 3 + 1) * h * .12 + h * .2); }
    else { V.ICON.heart && (ctx.save(), ctx.translate(0, h * .05), ctx.scale(w / 210, w / 210), ctx.fillStyle = INK, V.ICON.heart(ctx), ctx.restore()); }
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-w * .34, h * .36, w * .68, 7); ctx.fillRect(-w * .22, h * .43, w * .44, 5);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; for (let yy = h * .1; yy < h / 2; yy += 9) for (let xx = -w / 2 + ((yy / 9) & 1) * 4.5; xx < w / 2; xx += 9) { ctx.beginPath(); ctx.arc(xx, yy, 1.8, 0, TAU); ctx.fill(); }
    ctx.restore(); A.rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); A.rrect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 11); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
  }
  function blockB(ctx, t, am) {
    const ha = t - 6.99, shake = ha > 0 ? 22 * Math.exp(-ha * 9) : 0;
    ctx.save(); ctx.translate(A.noise1(t * 60) * shake, A.noise1(t * 60 + 40) * shake);
    ctx.fillStyle = V.rad(ctx, 540, 640, 60, 1300, [[0, '#4a1440'], [.45, '#1b0a3a'], [1, '#05020f']]); ctx.fillRect(-40, -40, W + 80, HH + 80);
    ctx.save(); ctx.globalAlpha = .16; ctx.drawImage(halftone(W, HH, 24, 'B'), 0, 0); ctx.restore();
    // spotlight cones
    const sw = am.on ? am.s * .04 : 0; for (const sx of [120, 960]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35 * clamp(ha / .15 + .4); ctx.fillStyle = V.lin(ctx, sx, -50, 540, 650, [[0, 'rgba(255,240,220,.9)'], [1, 'rgba(255,60,80,0)']]); ctx.beginPath(); ctx.moveTo(sx - 30, -50); ctx.lineTo(sx + 30, -50); ctx.lineTo(540 + 330 + sw * 200, 700); ctx.lineTo(540 - 330 + sw * 200, 700); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // floor glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.fillStyle = V.rad(ctx, 540, 980, 0, 520, [[0, 'rgba(255,50,70,.55)'], [1, 'rgba(255,50,70,0)']]); ctx.fillRect(0, 700, W, 600); ctx.restore();
    const breathe = am.on ? am.c * .5 : 0; V.glow(ctx, 540, 640, 620 + breathe * 60, '#ff2a3a', clamp(ha / .1) * (.55 + breathe * .12));
    // poster cascade
    for (let i = 0; i < 12; i++) {
      const top = i < 6, j = i % 6, x = 100 + j * 176 + (top ? 0 : 60) * (j % 2 ? 1 : -1) * .5, y1 = top ? 290 : 1000 + (j % 2 ? 26 : 0), t0 = 7.06 + j * .028 + (top ? 0 : .012), age = t - t0;
      if (age < 0) continue; const drop = top ? -420 : 520, k = eob(age / .3), y = lerp(y1 + drop, y1, k) + (am.on ? Math.sin(TAU * am.ph + i) * 9 : 0), r = (hash(i * 3) - .5) * .5 * (1 - eo(age / .5) * .55);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); poster(ctx, i, 160 + (j % 2) * 14, 236 + (j % 2) * 16); ctx.restore();
    }
    // speed lines from impact
    if (ha >= 0) speed(ctx, 540, 640, 9, 60, 260, 1400, '#fff', .55 * Math.exp(-ha * 4) + .06, t, 1.5);
    // NETFLIX slam
    if (ha >= 0) {
      const k = Math.exp(-ha * 14), sc = 1 + .45 * k + .05 * Math.sin(ha * 30) * Math.exp(-ha * 6), sh = am.on ? am.ph * 1.5 - .25 : clamp((ha - .15) / .45);
      heroLogo(ctx, 'netflix', 540, 640, 900, { sc, sx: 1 - .1 * k, sy: 1 + .12 * k, glow: 'rgba(255,60,70,.9)', glowBlur: 60 + 30 * k + breathe * 30, shine: sh > 0 && sh < 1.3 ? sh : null });
      if (ha < .5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; V.ring(ctx, 540, 640, 60 + ha * 1600, 28 * (1 - ha / .5), '#fff', 1 - ha / .5); V.ring(ctx, 540, 640, 40 + ha * 1100, 16 * (1 - ha / .5), '#ff5a64', 1 - ha / .5); ctx.restore(); }
      // kira glints on the logo
      const gt = am.on ? am.ph : (t - 7.1) * .9; for (let i = 0; i < 5; i++) { const ph = (gt + i * .21) % 1, a = Math.sin(ph * Math.PI); if (a > .02 && (am.on || t > 7.1)) star4(ctx, 130 + hash(i + 21) * 820, 570 + hash(i + 4) * 150, 30 + a * 34, '#fff', .2, a); }
      // DON
      const da = ha; if (da < .7) ink(ctx, 'ドン', 850, 260, 230, { rot: -.16, sc: eob(da / .12) * (1 + .1 * Math.exp(-da * 8)), fill: '#fff', out: INK, col2: '#ff3b4a', ow: .22, alpha: 1 - ein((da - .35) / .35), grad: [[0, '#fff'], [.5, '#ffd84a'], [1, '#ff7a1a']] });
    }
    // impact frame: inversion
    if (ha >= 0 && ha < .04) { ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(-50, -50, W + 100, HH + 100); ctx.fillStyle = '#000'; speed(ctx, 540, 640, 12, 70, 130, 1500, '#000', 1, 0, 2.2); ctx.restore(); heroLogo(ctx, 'netflix', 540, 640, 1100, { glow: 'rgba(0,0,0,.9)', glowBlur: 30 }); }
    ctx.restore();
  }

  // ---------- BLOCK C: DISNEY+
  const skyC = () => A.layer('skyC', W, HH, (g) => {
    g.fillStyle = V.lin(g, 0, 0, 0, 1180, [[0, '#070a30'], [.35, '#231560'], [.65, '#7a2c96'], [.88, '#e2508f'], [1, '#ffab74']]); g.fillRect(0, 0, W, HH);
    const r = rng(23); for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * 900, s = .8 + r() * 2.4; g.globalAlpha = .35 + r() * .65; g.fillStyle = '#fff'; g.fillRect(x, y, s, s); } g.globalAlpha = 1;
    // moon (cel)
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(880, 930, 92, 0, TAU); g.fill(); g.fillStyle = '#e9d9a8'; g.beginPath(); g.arc(905, 950, 70, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(880, 930, 92, 0, TAU); g.stroke();
    // far hills
    g.fillStyle = '#2a1466'; g.beginPath(); g.moveTo(0, 1140); for (let x = 0; x <= W; x += 60) g.lineTo(x, 1090 - Math.sin(x * .009) * 40 - Math.sin(x * .03) * 12); g.lineTo(W, 1250); g.lineTo(0, 1250); g.fill();
    // castle silhouette (centred), cel: dark body, rim light from the right
    const castle = (col, rim) => {
      const tower = (cx, w, h, roof, flagp) => { g.fillStyle = col; g.fillRect(cx - w / 2, 1180 - h, w, h + 20); g.beginPath(); g.moveTo(cx - w / 2 - 12, 1180 - h + 2); g.lineTo(cx, 1180 - h - roof); g.lineTo(cx + w / 2 + 12, 1180 - h + 2); g.closePath(); g.fill(); g.fillStyle = rim; g.fillRect(cx + w / 2 - 7, 1180 - h, 7, h); g.beginPath(); g.moveTo(cx + 2, 1180 - h - roof + 8); g.lineTo(cx + w / 2 + 12, 1180 - h + 2); g.lineTo(cx + w / 2, 1180 - h + 2); g.closePath(); g.fill(); if (flagp) { g.fillStyle = col; g.fillRect(cx - 2, 1180 - h - roof - 46, 4, 46); g.beginPath(); g.moveTo(cx + 2, 1180 - h - roof - 46); g.lineTo(cx + 40, 1180 - h - roof - 34); g.lineTo(cx + 2, 1180 - h - roof - 22); g.fill(); } };
      g.fillStyle = col; g.fillRect(250, 1010, 580, 190);
      tower(540, 90, 330, 190, 1); tower(430, 64, 250, 140, 0); tower(650, 64, 250, 140, 0); tower(340, 76, 160, 120, 1); tower(740, 76, 160, 120, 1); tower(250, 56, 100, 90, 0); tower(830, 56, 100, 90, 0);
      g.fillStyle = col; g.beginPath(); g.moveTo(420, 1180); g.lineTo(420, 1090); g.arc(540, 1090, 120, Math.PI, 0); g.lineTo(660, 1180); g.fill();
    };
    castle('#0a0526', 'rgba(255,150,170,.7)');
    // lit windows
    const r2 = rng(5); g.fillStyle = '#ffe08a'; for (let i = 0; i < 26; i++) { const x = 270 + r2() * 540, y = 1030 + r2() * 130; g.fillRect(x, y, 8, 14); }
    g.fillStyle = '#ffe08a'; for (const [x, y] of [[540, 880], [540, 940], [430, 960], [650, 960], [340, 1070], [740, 1070]]) { g.beginPath(); g.roundRect(x - 6, y - 12, 12, 24, [6, 6, 0, 0]); g.fill(); }
    // foreground hill + reflection lake
    g.fillStyle = '#0e0836'; g.beginPath(); g.moveTo(0, 1200); for (let x = 0; x <= W; x += 40) g.lineTo(x, 1170 + Math.sin(x * .012 + 1) * 24); g.lineTo(W, 1300); g.lineTo(0, 1300); g.fill();
    g.fillStyle = V.lin(g, 0, 1230, 0, HH, [[0, '#3a1d80'], [1, '#08061e']]); g.fillRect(0, 1230, W, HH - 1230);
  });
  function cometPos(a) { const e = ein(a) * .85 + a * .15; return [lerp(-140, 570, e), lerp(-120, 520, e * e * .6 + e * .4)]; }
  function blockC(ctx, t, am) {
    const ha = t - 8.17, tt = am.on ? am.ph * TAU : t * 2, zc = 1.10 - .08 * eo(inv(7.69, 8.6, t)) + am.env * .012;
    ctx.save(); ctx.translate(540, 700); ctx.scale(zc, zc); ctx.translate(-540 - am.env * 8, -700);
    ctx.drawImage(skyC(), 0, 0);
    // aurora ribbons
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let b = 0; b < 3; b++) { ctx.fillStyle = ['rgba(60,220,200,.10)', 'rgba(140,90,255,.12)', 'rgba(255,100,190,.09)'][b]; ctx.beginPath(); ctx.moveTo(0, 260 + b * 130); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 260 + b * 130 + Math.sin(x * .006 + b * 2 + t * .8) * 50); ctx.lineTo(W, 360 + b * 130); for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, 380 + b * 130 + Math.sin(x * .007 + b + t * .6) * 40); ctx.closePath(); ctx.fill(); } ctx.restore();
    // twinkles
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 34; i++) { const a = Math.max(0, Math.sin(tt * (am.on ? 1 : 1) * (1 + i % 3) + i * 1.7)); if (a > .1) star4(ctx, hash(i + 40) * W, 60 + hash(i + 80) * 850, 12 + a * 18, i % 3 ? '#fff' : '#ffe08a', .3, a * .9); } ctx.restore();
    // castle glow
    V.glow(ctx, 540, 900, 500, '#ff8ab0', .18 + (t > 8.17 ? .2 * Math.exp(-ha * 2) : 0));
    // shooting stars
    for (const [ts, y0, x0] of [[7.86, 140, 980], [7.96, 360, 1080], [8.04, 80, 760], [8.44, 240, 1050], [8.56, 90, 900]]) { const a = (t - ts) / .3; if (a < 0 || a > 1) continue; const x = x0 - a * 900, y = y0 + a * 340; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = V.lin(ctx, x, y, x + 240, y - 90, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(120,200,255,0)']]); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 240, y - 90); ctx.stroke(); star4(ctx, x, y, 24, '#fff', 0, 1); ctx.restore(); }
    // comet (7.84 -> 8.17)
    const ca = inv(7.84, 8.17, t);
    if (t >= 7.84 && t < 8.19) {
      const [hx, hy] = cometPos(ca); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 26; k++) { const a2 = Math.max(0, ca - k * .022), [px, py] = cometPos(a2), w = (1 - k / 26) * 44 + 4; ctx.fillStyle = `rgba(${k < 6 ? '255,250,220' : '120,210,255'},${(1 - k / 26) * .6})`; ctx.beginPath(); ctx.arc(px, py, w, 0, TAU); ctx.fill(); }
      V.glow(ctx, hx, hy, 220, '#9ad8ff', 1); V.glow(ctx, hx, hy, 90, '#fff', 1); star4(ctx, hx, hy, 90, '#fff', t * 4, 1); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.restore();
    }
    ctx.restore();
    // impact flash + logo
    if (ha >= 0) {
      const k = Math.exp(-ha * 12), sc = 1 + .5 * k + .04 * Math.sin(ha * 26) * Math.exp(-ha * 5), sh = am.on ? am.ph * 1.5 - .25 : clamp((ha - .25) / .55);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.save(); ctx.translate(540, 560); ctx.rotate(t * .25); const rays = 16; for (let i = 0; i < rays; i++) { ctx.rotate(TAU / rays); ctx.fillStyle = V.lin(ctx, 0, 0, 900, 0, [[0, 'rgba(255,240,200,.13)'], [1, 'rgba(255,240,200,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -40 - 14 * Math.sin(i * 2.1)); ctx.lineTo(900, 40 + 14 * Math.sin(i * 2.1)); ctx.fill(); } ctx.restore(); ctx.restore();
      V.glow(ctx, 540, 560, 640 + (am.on ? am.c * 24 : 0), '#5a7fe0', .5 * Math.exp(-ha * 5) + .12);
      heroLogo(ctx, 'disney', 540, 560, 800, { sc, glow: 'rgba(160,210,255,.95)', glowBlur: 46 + 40 * k + (am.on ? am.c * 14 : 0), shine: sh > 0 && sh < 1.3 ? sh : null, shineA: .95 });
      if (ha < .6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; V.ring(ctx, 540, 540, 40 + ha * 1700, 26 * (1 - ha / .6), '#fff', 1 - ha / .6); V.ring(ctx, 540, 540, 20 + ha * 1200, 16 * (1 - ha / .6), '#9ad8ff', 1 - ha / .6); ctx.restore();
        for (let i = 0; i < 30; i++) { const an = hash(i) * TAU, d = (80 + hash(i + 50) * 520) * eo(ha / .6), a = 1 - ha / .6; star4(ctx, 540 + Math.cos(an) * d, 540 + Math.sin(an) * d * .8, 10 + hash(i + 9) * 24 * a, i % 2 ? '#fff' : '#ffe08a', an, a); } }
      // sparkle field around the logo
      const gt = am.on ? am.ph : (t - 8.3) * .8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const ph = (gt + i * .083) % 1, a = Math.sin(ph * Math.PI); if (a > .02 && (am.on || t > 8.3)) star4(ctx, 110 + hash(i + 61) * 860, 330 + hash(i + 71) * 460, 20 + a * 34, i % 2 ? '#fff' : '#ffe6a0', .2, a); } ctx.restore();
      // PLUS flare on "פלוס" (8.55, visual 8.52) -> plus glyph sits at right end of the logo
      const pa = t - 8.52, px = 540 + .415 * 800, py = 560 + .1 * 434;
      if (pa >= 0 && pa < .7) { const a = Math.exp(-pa * 4.5), pop = eob(pa / .1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; V.glow(ctx, px, py, 260 * pop, '#fff', .9 * a); star4(ctx, px, py, 360 * pop * (.4 + a * .6), '#fff', 0, a); star4(ctx, px, py, 220 * pop, '#9ad8ff', Math.PI / 4, a); V.ring(ctx, px, py, 30 + pa * 700, 12 * a, '#fff', a); ctx.restore(); }
      // katakana
      if (ha < .8) ink(ctx, 'パァァ', 210, 236, 190, { rot: -.12, sc: eob(ha / .12), alpha: 1 - ein((ha - .4) / .4), grad: [[0, '#fff'], [.5, '#ffe08a'], [1, '#ff9ad0']], col2: '#7a3cff', ow: .22 });
      if (t > 8.57 && t < 9.0 && !am.on) ink(ctx, 'キラキラ', 850, 340, 120, { rot: .1, sc: eob((t - 8.57) / .12), alpha: 1 - ein((t - 8.72) / .28), grad: [[0, '#fff'], [1, '#ffd84a']], col2: '#ff5ab0' });
    }
    // sakura
    for (let i = 0; i < 12; i++) { const sp = 50 + hash(i) * 60, x = (hash(i + 3) * 1300 - (t - 7.69) * sp * .6 + (am.on ? am.s * 30 : 0) + 1400) % 1300 - 110, y = (hash(i + 7) * 2000 + (t - 7.69) * sp + (am.on ? am.env * 40 : 0)) % 2000 - 60; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.4 + i + (am.on ? am.s : 0)); ctx.fillStyle = i % 2 ? '#ffd2e6' : '#ff9cc4'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 6.5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    if (t >= 8.15 && t < 8.22) { ctx.save(); ctx.globalAlpha = .9 * (1 - (t - 8.15) / .07); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, HH); ctx.restore(); }
    if (t >= 8.17 && t < 8.2) { ctx.save(); ctx.globalAlpha = .0; ctx.restore(); }
  }

  A.scene({
    name: 's2_live_ott', start: T0, end: TEND, draw(ctx, s) {
      const t = s.t, am = amb();
      // A
      if (t < 6.91) {
        ctx.save();
        if (t < 5.2) { const p = eo(inv(T0, 5.2, t)), edge = lerp(940, -320, p); wipeClip(ctx, edge, 150, false); blockA(ctx, t, am); ctx.restore(); wipeBand(ctx, edge, 150, ['#fff', '#ffc24a', '#ff4f9a']); }
        else { blockA(ctx, t, am); ctx.restore(); }
      }
      // B
      if (t >= 6.9 && t < 7.96) blockB(ctx, t, am);
      // C
      if (t >= 7.69) {
        ctx.save();
        if (t < 7.95) { const p = eio(inv(7.69, 7.95, t)), edge = lerp(-260, 1350, p); wipeClip(ctx, edge, 160, true); blockC(ctx, t, am); ctx.restore(); wipeBand(ctx, edge, 160, ['#ff3b4a', '#fff', '#5aa0ff']); }
        else { blockC(ctx, t, am); ctx.restore(); }
      }
      if (t < 7.3) curtains(ctx, t);
    },
  });
})();
