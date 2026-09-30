// s1_streamers: "סרטים וסדרות מנטפליקס" / "תכנים מדיסני פלוס"   window v = 3.25 .. 7.0
// Story: liquid wipe covers s0 -> clapper + film strips + popcorn burst (סרטים) -> episode cards fan (וסדרות)
//        -> NETFLIX slam (red) -> flip to blue/purple magic (תכנים) -> DISNEY+ logo bursts out of a portal (מדיסני)
//        -> giant candy plus pops (פלוס).
(() => {
  const { clamp, lerp, ease, hash } = A, C = CL.C, W = 1920, H = 1080, TAU = tAU, CX = 960;   // LANDSCAPE 1920x1080; hero centre (960,400), caption band y>820
  const P = (t, a, b) => clamp((t - a) / (b - a)), eo = ease.out, eio = ease.inOut;
  const RED = '#E50914', REDH = '#FF3B4E';
  const CENTER_Y = 400;

  // ---------------------------------------------------------------- helpers
  const star = (g, x, y, R, r, n = 5, rot = -Math.PI / 2) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r : R; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  const heart = (g, x, y, r) => { g.beginPath(); g.moveTo(x, y + r * .9); g.bezierCurveTo(x - r * 1.6, y - r * .1, x - r * .7, y - r * 1.2, x, y - r * .4); g.bezierCurveTo(x + r * .7, y - r * 1.2, x + r * 1.6, y - r * .1, x, y + r * .9); g.closePath(); };
  const tri = (g, x, y, r) => { g.beginPath(); g.moveTo(x - r * .6, y - r); g.lineTo(x + r, y); g.lineTo(x - r * .6, y + r); g.closePath(); };
  const kick = (t, t0, k = 10, f = 34) => { const u = t - t0; return u < 0 ? 0 : Math.exp(-u * k) * Math.cos(u * f); };   // damped wobble after an impact

  // drifting candy drops in the background (liquid feel)
  function drops(ctx, t, cols, seed) {
    for (let i = 0; i < 12; i++) {
      const x = W * (.05 + .9 * hash(i * 1.7 + seed)) + A.noise1(t * .35 + i * 3 + seed) * 70, y = 90 + 700 * hash(i * 2.9 + seed + 4) + A.noise1(t * .3 + i * 5 + seed) * 70;
      CL.drop(ctx, x, y, 20 + 30 * hash(i + seed * 3), cols[i % cols.length], t, i);
    }
  }

  // ---------------------------------------------------------------- entry: liquid front rising, covers s0
  const RIB = [['#FF2E93', 0], ['#FF8A1F', 70], ['#8B3DFF', 140]], SCENE_OFF = 210;
  const frontX = t => lerp(W + 300, -360, eio(P(t, 3.25, 3.50)));   // liquid front sweeps right to left (Hebrew reading direction)
  const edge = (y, t, off, ph) => frontX(t) + off + Math.sin(y * .011 + t * 9 + ph) * 44 + Math.sin(y * .027 - t * 6 + ph * 2) * 24;
  function frontPath(ctx, t, off, ph) { ctx.beginPath(); ctx.moveTo(W + 80, -20); for (let y = -20; y <= H + 20; y += 20) ctx.lineTo(edge(y, t, off, ph), y); ctx.lineTo(W + 80, H + 20); ctx.closePath(); }
  function wipeRibbons(ctx, t) {
    RIB.forEach(([col, off], i) => { ctx.fillStyle = col; frontPath(ctx, t, off, i * 1.3); ctx.fill(); });
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 8; ctx.beginPath(); for (let y = -20; y <= H + 20; y += 20) { const x = edge(y, t, 0, 0) + 14; y < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore();
    for (let i = 0; i < 14; i++) { const y = (i + .5) / 14 * H + (hash(i) - .5) * 40, x = edge(y, t, 0, 0) - (30 + 190 * hash(i + 3)) * (.5 + .5 * Math.sin(t * 6 + i * 2)); CL.drop(ctx, x, y, 14 + 20 * hash(i + 7), ['#FF2E93', '#FF8A1F', '#FFD23F', '#19C8FF'][i % 4], t, i); }
  }

  // ---------------------------------------------------------------- film strips (scrolling)
  function strip(ctx, t, cx, cy, len, ang, sp, slide, alpha, seed) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(slide, 0); ctx.globalAlpha *= alpha; const h = 230, pitch = 200, off = ((t * sp) % pitch + pitch) % pitch, base = Math.floor(t * sp / pitch);
    ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.beginPath(); ctx.roundRect(-len / 2 + 6, -h / 2 + 18, len, h, 20); ctx.fill();
    ctx.fillStyle = '#0a0f3a'; ctx.beginPath(); ctx.roundRect(-len / 2, -h / 2, len, h, 20); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-len / 2, -h / 2, len, h, 20); ctx.clip();
    for (let k = -1; k <= len / pitch + 1; k++) {
      const x = -len / 2 + k * pitch + off, id = k - base + seed * 3, col = CL.CAND[((id % 8) + 8) % 8];
      const gx = x + 15, gy = -70; ctx.fillStyle = A.linear(ctx, 0, gy, 0, gy + 140, [[0, col], [1, A.mixc(col, '#0b1250', .45)]]); ctx.beginPath(); ctx.roundRect(gx, gy, 170, 140, 16); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(gx + 85, gy + 28, 78, 24, 0, 0, TAU); ctx.fill();
      if (((id % 3) + 3) % 3 === 0) { ctx.fillStyle = 'rgba(255,255,255,.9)'; tri(ctx, gx + 92, gy + 74, 30); ctx.fill(); } else { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(gx + 120, gy + 52, 20, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(5,8,38,.3)'; ctx.beginPath(); ctx.moveTo(gx, gy + 140); ctx.lineTo(gx + 70, gy + 80); ctx.lineTo(gx + 120, gy + 118); ctx.lineTo(gx + 170, gy + 90); ctx.lineTo(gx + 170, gy + 140); ctx.fill(); }
    }
    ctx.fillStyle = '#FFF6E6'; for (let k = -1; k <= len / 50 + 1; k++) { const x = -len / 2 + k * 50 + off % 50; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.roundRect(x, sd * (h / 2 - 22) - 12, 28, 24, 6); ctx.fill(); }); }
    ctx.restore(); ctx.restore();
  }

  // ---------------------------------------------------------------- clapperboard
  function stripes(g, w, h, shift) { g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 16); g.clip(); g.fillStyle = '#FFF6E6'; g.fillRect(0, 0, w, h); const sw = 84; for (let x = -h + shift; x < w + h; x += sw * 2) { g.fillStyle = '#0a0f3a'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + sw, h); g.lineTo(x + sw + h * .55, 0); g.lineTo(x + h * .55, 0); g.closePath(); g.fill(); } g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h); g.restore(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, w, h, 16); g.stroke(); }
  const clapImg = () => CL.layer('s1_clapbody', 660, 520, g => {
    g.translate(330, 260); CL.gel(g, 0, 60, 560, 320, { fill: '#2B36C9', dark: '#0d1160', r: 36, shadow: 18, rim: 'rgba(255,255,255,.9)' });
    g.save(); g.translate(-280, -100); stripes(g, 560, 78, 84); g.restore();       // fixed lower stick
    g.fillStyle = A.linear(g, 0, -30, 0, 130, [[0, '#FF7AC8'], [1, C.pink]]); g.beginPath(); tri(g, 0, 40, 70); g.fill(); g.lineWidth = 12; g.strokeStyle = '#0a0f3a'; g.lineJoin = 'round'; g.stroke(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-16, 14, 14, 28, .5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; [[-230, 170, 190], [70, 170, 140]].forEach(([x, y, w]) => { g.beginPath(); g.roundRect(x, y, w, 20, 10); g.fill(); });
    [[C.yellow, 200], [C.lime, 230], [C.cyan, 260]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.arc(x - 60, -40, 15, 0, TAU); g.fill(); });
  });
  function clapper(ctx, cx, cy, sc, rot, arm) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.drawImage(clapImg(), -330, -260);
    ctx.translate(-280, -100); ctx.rotate(-arm); ctx.translate(0, -84); stripes(ctx, 560, 78, 0); ctx.restore();
  }
  const armAngle = t => t < 3.41 ? .62 * (1 - ease.in(P(t, 3.29, 3.41))) : .13 * Math.exp(-(t - 3.41) * 11) * Math.abs(Math.sin((t - 3.41) * 36));

  // ---------------------------------------------------------------- popcorn
  function puff(ctx, x, y, r) { ctx.fillStyle = A.radial(ctx, x - r * .3, y - r * .35, r * .1, r * 1.15, [[0, '#ffffff'], [.35, '#FFF1C4'], [1, '#FFB93B']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function popcorn(ctx, x, y, s, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); [[-.55, .15, .8], [.5, .1, .85], [0, .25, .8], [-.2, -.5, .85], [.35, -.5, .7]].forEach(([a, b, r]) => puff(ctx, a * s, b * s, r * s * .62)); ctx.fillStyle = '#E8862A'; ctx.beginPath(); ctx.arc(s * .1, s * .35, s * .11, 0, TAU); ctx.fill(); ctx.restore(); }
  function popBurst(ctx, t, x0, y0, tb) {
    for (let i = 0; i < 30; i++) {
      const u = t - tb - hash(i * 3.1) * .04; if (u <= 0) continue; const an = -Math.PI / 2 + (hash(i * 1.9 + 2) - .5) * 3.0, sp = 900 + hash(i * 4.3) * 1300, g = 2600;
      const x = x0 + Math.cos(an) * sp * u, y = y0 + Math.sin(an) * sp * u + .5 * g * u * u; if (y > 850 || u > 1.6) continue;
      ctx.save(); ctx.globalAlpha *= clamp((850 - y) / 100); popcorn(ctx, x, y, 30 + hash(i * 7) * 26, u * (hash(i) - .5) * 14); ctx.restore();
    }
  }

  // ---------------------------------------------------------------- episode cards (fan)
  const CARD_COL = [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.purple];
  const cardImg = i => CL.layer('s1card' + i, 380, 520, g => {
    const col = CARD_COL[i]; g.translate(190, 260); CL.gel(g, 0, 0, 320, 450, { fill: col, r: 46, shadow: 16 });
    g.fillStyle = 'rgba(255,255,255,.32)'; g.beginPath(); g.roundRect(-130, -190, 260, 230, 26); g.fill();
    g.save(); g.beginPath(); g.roundRect(-130, -190, 260, 230, 26); g.clip(); g.fillStyle = 'rgba(5,8,38,.28)'; g.beginPath(); g.moveTo(-130, 40); g.lineTo(-40, -50); g.lineTo(20, 0); g.lineTo(80, -70); g.lineTo(130, -20); g.lineTo(130, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(70, -140, 28, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(0, -75, 46, 0, TAU); g.fill(); g.fillStyle = A.mixc(col, '#0b1250', .35); tri(g, 4, -75, 24); g.fill();
    g.fillStyle = 'rgba(5,8,38,.6)'; g.beginPath(); g.roundRect(-130, 74, 200, 24, 12); g.fill(); g.fillStyle = 'rgba(5,8,38,.3)'; g.beginPath(); g.roundRect(-130, 114, 130, 18, 9); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(28, 150, 102, 50, 25); g.fill(); g.fillStyle = A.mixc(col, '#0b1250', .5); g.font = '900 34px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText('E' + (i + 1), 79, 177);
  });
  function fan(ctx, t) {
    const n = 6, order = [0, 5, 1, 4, 2, 3], blast = eo(P(t, 4.36, 5.1));
    order.forEach(i => {
      const t0 = 3.90 + i * .012, sp = CL.spring(t, t0, .8), pp = CL.pop(t, t0 - .02, .18); if (pp <= 0) return; const tgt = (i - (n - 1) / 2) * .27;
      const ang = tgt * sp + tgt * 1.6 * blast + A.noise1(t * .8 + i) * .012, dist = (60 + 440 * sp) * (1 + 2.6 * blast * blast);
      ctx.save(); ctx.globalAlpha *= 1 - blast; ctx.translate(CX, 1000); ctx.rotate(ang); ctx.translate(0, -dist); ctx.rotate(blast * (i - 2.5) * .6); ctx.scale(pp * 1.05, pp * 1.05); ctx.drawImage(cardImg(i), -190, -260); ctx.restore();
    });
  }

  // ---------------------------------------------------------------- world 1 (Netflix side)
  function plate1(ctx, t) {   // NETFLIX plate: real logo on white gel, slams on 4.36
    const pre = P(t, 4.06, 4.36), post = t - 4.36, flip = P(t, 5.35, 5.68);
    if (t < 4.06) return; let sc = lerp(2.6, 1, Math.pow(pre, 2.2)); const wob = post > 0 ? .13 * kick(t, 4.36, 6, 32) : 0;
    let sx = sc * (1 + wob), sy = sc * (1 - wob), rot = post > 0 ? .05 * Math.exp(-post * 6) * Math.sin(post * 26) : -.2 * (1 - Math.pow(pre, 2.2));
    let x = CX, y = CENTER_Y + (post > 0 ? 8 * Math.sin(t * 2.2) : 0); const al = clamp((t - 4.06) / .14);
    if (flip > 0) { const f = eio(flip); sx *= Math.max(.001, Math.cos(f * 1.5)); sy *= 1 - .25 * f; x -= 300 * f; rot -= .5 * f; }
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
    A.glow(ctx, 0, 0, 900, RED, .55 * clamp(post / .1));
    CL.logoCard(ctx, 'netflix', 0, 0, 1200, 400, { pad: .07, r: 84, rim: 'rgba(255,255,255,.95)', dark: '#f0c9cf' });   // logo ~1000 px wide on a 1200x400 plate
    ctx.restore();
  }
  function world1(ctx, t) {
    CL.bg(ctx, t, { tint: [C.pink, C.purple, C.orange] });
    const rk = t >= 4.36 ? (.35 + .65 * Math.exp(-(t - 4.36) * 3.5)) * (1 - P(t, 5.4, 5.7)) : 0; if (rk > 0) A.glow(ctx, CX, CENTER_Y, 1300, RED, .6 * rk);
    if (t > 3.98 && t < 4.36) A.glow(ctx, CX, CENTER_Y, 500 + 800 * ease.in(P(t, 3.98, 4.36)), RED, .7 * ease.in(P(t, 3.98, 4.36)));   // lead-in: red energy builds behind the cards
    drops(ctx, t, [C.pink, C.orange, C.yellow, C.cyan], 1);
    // CUE 3.41 clapper-slam + popcorn-burst (film strips whoosh in)
    const stA = 1 - .68 * P(t, 4.36, 5.1);
    strip(ctx, t, CX, 800, 2500, -.13, 380, 2300 * (1 - eo(P(t, 3.34, 3.7))), .95 * stA, 0);
    strip(ctx, t, CX, 130, 2500, .10, -300, -2300 * (1 - eo(P(t, 3.38, 3.74))), .95 * stA, 1);
    // CUE 3.95 episode-cards-fan
    fan(ctx, t);
    // CUE 4.36 netflix-slam (red splash, shockwave, shake, flash, bolts)
    if (t >= 4.36) { ctx.save(); ctx.globalAlpha *= 1 - P(t, 5.4, 5.7); CL.splash(ctx, CX, CENTER_Y, 800, CL.spring(t, 4.36, .9), 7, [RED, '#FF7A1F', C.pink, REDH, '#B3001B']); ctx.restore(); }
    if (t >= 3.41) CL.splash(ctx, CX, 330, 560, CL.spring(t, 3.41, .5) * (1 - P(t, 3.62, 3.9)), 5, [C.yellow, C.orange, C.pink, '#FFF6E6', C.cyan]);   // candy splash behind the clapper
    // clapper: slams shut on 3.41, then parks top-left, blasted away by the Netflix slam
    { const pop = CL.pop(t, 3.20, .2), park = eio(P(t, 3.85, 4.12)), bl = eo(P(t, 4.36, 5.0));
      const x = lerp(CX, 230, park) - 1100 * bl, y = lerp(400, 185, park) - 300 * bl, sc = lerp(1.2, .42, park) * pop * (1 + .05 * kick(t, 3.41, 8, 40)), rot = lerp(-.07, -.22, park) - 3 * bl;
      if (pop > 0 && bl < 1) clapper(ctx, x, y, sc, rot, armAngle(t)); }
    // popcorn splash on the clap
    if (t >= 3.41) { CL.ring(ctx, CX, 300, 700, P(t, 3.41, 3.85), '#fff', 22); popBurst(ctx, t, CX, 300, 3.41); }
    plate1(ctx, t);
    if (t >= 4.36) { CL.ring(ctx, CX, CENTER_Y, 1200, P(t, 4.36, 5.2), '#fff', 34); CL.ring(ctx, CX, CENTER_Y, 1500, P(t, 4.40, 5.3), REDH, 48);
      const fb = (t < 4.8 ? 1 : .55 + .25 * Math.sin(t * 26)) * (1 - P(t, 5.4, 5.6));   // bolts stay lit (flicker on the global clock) through the hold [[80, 60, 380, 260, 3], [1840, 80, 1540, 260, 5], [80, 760, 400, 560, 9], [1840, 740, 1520, 560, 12]].forEach(([a, b, c2, d, sd]) => CL.bolt(ctx, a, b, c2, d, P(t, 4.34, 4.46), sd, { col: REDH, lw: 12, alpha: fb }));
      ctx.save(); ctx.globalAlpha *= P(t, 4.52, 4.8) * (1 - P(t, 5.4, 5.6)); CL.twinkle(ctx, t, 60, 60, 1800, 760, 22, 3, ['#fff', REDH, C.yellow, C.pink]); ctx.restore(); }
    if (t < 3.6) CL.twinkle(ctx, t, 100, 100, 1700, 700, 12, 5, ['#fff', C.yellow, C.pink]);
  }

  // ---------------------------------------------------------------- world 2 (Disney side: blue/purple magic)
  const POST = [['#3E8BFF', 0], ['#19C8FF', 1], ['#8B3DFF', 2], ['#FF2E93', 3], ['#7A6BFF', 4]];
  const posterImg = i => CL.layer('s1post' + i, 250, 340, g => {
    const [col, em] = POST[i]; g.translate(125, 170); CL.gel(g, 0, 0, 200, 290, { fill: col, r: 34, shadow: 12 });
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.roundRect(-78, -118, 156, 150, 20); g.fill(); g.fillStyle = '#fff';
    if (em === 0 || em === 4) { star(g, 0, -42, 56, 24); g.fill(); } else if (em === 1) { heart(g, 0, -42, 40); g.fill(); } else if (em === 2) { tri(g, 6, -42, 38); g.fill(); } else { CL.spark(g, 0, -42, 62, 0, '#fff'); }
    g.fillStyle = 'rgba(5,8,38,.5)'; g.beginPath(); g.roundRect(-78, 56, 130, 18, 9); g.fill(); g.fillStyle = 'rgba(5,8,38,.28)'; g.beginPath(); g.roundRect(-78, 88, 90, 14, 7); g.fill();
  });
  // Disney plate glides from centre (960) to the left (700) on 6.2..6.6 to make room for the big plus on the right
  const LOGO_W = 840, PLATE_Y = 400, PLUS_X = 1560, PLUS_Y = 400, PLATE_W = 1040, PLATE_H = 560;
  const plx = t => lerp(960, 700, eio(P(t, 6.2, 6.62)));
  const logoPt = (ix, iy, x) => { const s = LOGO_W / 512; return [x + (ix - 256) * s, PLATE_Y + (iy - 139) * s]; };
  const arcPt = (u, x) => logoPt(110 + 360 * u, lerp(78, 132, u) - 100 * Math.sin(Math.PI * u), x);

  function plusShape(ctx, size) {
    const a = size * .36, r = a * .42; const path = () => { ctx.beginPath(); ctx.roundRect(-a / 2, -size / 2, a, size, r); ctx.roundRect(-size / 2, -a / 2, size, a, r); };
    ctx.lineJoin = 'round'; path(); ctx.strokeStyle = 'rgba(2,4,30,.45)'; ctx.lineWidth = 46; ctx.save(); ctx.translate(8, 16); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = C.ink; ctx.lineWidth = 36; ctx.stroke();
    path(); ctx.fillStyle = A.linear(ctx, 0, -size / 2, 0, size / 2, [[0, '#FFB0E0'], [.3, '#FF4DA6'], [.62, C.pink], [1, C.purple]]); ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-a * .12, -size * .27, a * .16, size * .17, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-size * .28, -a * .18, size * .13, a * .1, 0, 0, TAU); ctx.fill(); ctx.restore();
  }

  function plate2(ctx, t) {
    const sc0 = CL.pop(t, 5.84, .32); if (sc0 <= 0) return; const im = CL.logoImg('disney'); const bump = 1 + .05 * kick(t, 6.54, 11, 36) + .03 * kick(t, 6.06, 12, 38);
    ctx.save(); ctx.translate(plx(t), PLATE_Y + 8 * Math.sin(t * 2.3)); ctx.rotate(.012 * Math.sin(t * 1.6) + (t > 6.06 ? .03 * Math.exp(-(t - 6.06) * 8) * Math.sin((t - 6.06) * 30) : 0)); ctx.scale(sc0 * bump, sc0 * bump);
    const hw = PLATE_W / 2, hh = PLATE_H / 2;
    A.glow(ctx, 0, 0, 800, '#4FA8FF', .6);
    CL.gel(ctx, 0, 0, PLATE_W, PLATE_H, { fill: '#2447D8', dark: '#0A0B55', r: 100, shadow: 22, gloss: false, rim: 'rgba(200,238,255,.95)', rimW: 8 });
    ctx.save(); ctx.beginPath(); ctx.roundRect(-hw, -hh, PLATE_W, PLATE_H, 100); ctx.clip(); ctx.fillStyle = A.radial(ctx, 0, 40, 40, 600, [[0, 'rgba(120,200,255,.32)'], [1, 'rgba(120,200,255,0)']]); ctx.fillRect(-hw, -hh, PLATE_W, PLATE_H); CL.twinkle(ctx, t, -hw + 10, -hh + 10, PLATE_W - 20, PLATE_H - 20, 12, 21, ['#fff', C.cyan, '#B9A8FF']); ctx.restore();
    if (im) { const w = LOGO_W, h = w * im.height / im.width; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(CL.silhouette(im, '#7fe9ff'), -w / 2 * 1.035, -h / 2 * 1.035, w * 1.035, h * 1.035); ctx.restore(); ctx.drawImage(im, -w / 2, -h / 2, w, h); }
    ctx.restore();
  }

  function world2(ctx, t) {
    const k = P(t, 5.36, 5.80); if (k <= 0) return; const R = lerp(0, 2150, eo(k)), icx = CX, icy = CENTER_Y;
    const ipath = () => { ctx.beginPath(); for (let i = 0; i <= 56; i++) { const a = i / 56 * TAU, rr = R * (1 + .06 * Math.sin(a * 6 + t * 7) + .03 * Math.sin(a * 11 - t * 5)); i ? ctx.lineTo(icx + Math.cos(a) * rr, icy + Math.sin(a) * rr) : ctx.moveTo(icx + Math.cos(a) * rr, icy + Math.sin(a) * rr); } ctx.closePath(); };
    if (k < 1) { ipath(); ctx.strokeStyle = C.purple; ctx.lineWidth = 100; ctx.stroke(); ipath(); ctx.strokeStyle = C.cyan; ctx.lineWidth = 52; ctx.stroke(); ipath(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 14; ctx.stroke(); }
    ctx.save(); ipath(); ctx.clip();
    CL.bg(ctx, t, { base: '#171077', tint: [C.blue, C.purple, C.cyan], speed: .3 });
    CL.twinkle(ctx, t, 40, 40, 1840, 800, 30, 8, ['#fff', C.cyan, '#B9A8FF', C.yellow]);
    drops(ctx, t, [C.blue, C.cyan, C.purple, '#7A6BFF'], 6);
    // CUE 5.35 flip-to-blue "תכנים": mini content posters burst out and spiral into a magic portal
    const q = P(t, 5.5, 6.06), qe = ease.in(q);
    if (t < 6.06) {
      const pg = .25 + .75 * P(t, 5.3, 6.06); A.glow(ctx, icx, icy, 220 + 560 * qe + 80 * pg, '#8FC3FF', .35 + .6 * qe);
      ctx.save(); ctx.translate(icx, icy); ctx.rotate(t * 1.4); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = `rgba(160,210,255,${.22 * qe})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -1200); ctx.lineTo(30, -1200); ctx.fill(); } ctx.restore();
      for (let i = 0; i < 7; i++) {
        const t0 = 5.40 + i * .03, sp = CL.spring(t, t0, .75), pp = CL.pop(t, t0 - .02, .2); if (pp <= 0) continue;
        const a = i / 7 * TAU + t * 1.3 + qe * 5, r = (i % 2 ? 640 : 500) * sp * (1 - qe) + 10, s2 = pp * (1 - .85 * qe) * 1.15;
        ctx.save(); ctx.translate(icx + Math.cos(a) * r, icy + Math.sin(a) * r * .55); ctx.rotate(Math.sin(t * 3 + i) * .18 + qe * 4); ctx.scale(s2, s2); ctx.drawImage(posterImg(i % 5), -125, -170); ctx.restore();
      }
      CL.ring(ctx, icx, icy, 1000, P(t, 5.40, 6.0), C.cyan, 20);
    }
    // CUE 6.06 disney-logo-burst (blue splash, sparkle arc, shockwave, flash)
    const px0 = plx(t);
    if (t >= 6.06) { ctx.save(); ctx.globalAlpha *= 1 - P(t, 6.5, 7.0); CL.splash(ctx, CX, PLATE_Y, 820, CL.spring(t, 6.06, 1.0), 11, [C.blue, C.cyan, C.purple, '#A8C8FF', '#7A6BFF']); ctx.restore(); }
    // CUE 6.54 plus-splash (behind)
    if (t >= 6.54) { ctx.save(); ctx.globalAlpha *= 1 - P(t, 6.8, 7.0) * .5; CL.splash(ctx, PLUS_X, PLUS_Y, 520, CL.spring(t, 6.54, .8), 12, [C.pink, C.purple, C.cyan, '#FFB0E0', C.blue]); ctx.restore(); }
    plate2(ctx, t);
    if (t >= 6.04) {   // sparkle arc following the logo's own arc
      const uh = eo(P(t, 6.0, 6.6)), fade = 1 - P(t, 6.62, 7.0);
      for (let i = 0; i < 18; i++) { const u = uh - i * .026; if (u < 0 || u > 1.001) continue; const [x, y] = arcPt(u, px0), s0 = (50 - i * 2.4) * (.6 + .4 * Math.sin(t * 20 + i)); CL.spark(ctx, x, y - 6, Math.max(6, s0) * fade, t * 3 + i, i % 3 ? '#fff' : (i % 2 ? '#9FE8FF' : '#C8B6FF')); }
      if (uh > 0) { const [x, y] = arcPt(Math.min(1, uh), px0); A.glow(ctx, x, y, 140, '#9FE8FF', .9 * fade); }
      CL.ring(ctx, CX, PLATE_Y, 1250, P(t, 6.06, 6.9), '#9FE8FF', 34); CL.ring(ctx, CX, PLATE_Y, 900, P(t, 6.09, 6.75), '#fff', 22);
    }
    // CUE 6.54 plus-pop: giant glowing candy "+" lands on "פלוס"
    // lead-in 6.14..6.40: a glowing spark leaves the logo's own "+" and flies to the right, then swells into the candy plus
    if (t > 6.14 && t < 6.5) { const e = eio(P(t, 6.14, 6.40)), [ox, oy] = logoPt(470, 190, px0), x = lerp(ox, PLUS_X, e), y = lerp(oy, PLUS_Y, e) - 120 * Math.sin(Math.PI * e), al = 1 - P(t, 6.40, 6.5);
      for (let i = 0; i < 9; i++) { const e2 = Math.max(0, e - i * .035), x2 = lerp(ox, PLUS_X, e2), y2 = lerp(oy, PLUS_Y, e2) - 120 * Math.sin(Math.PI * e2); CL.spark(ctx, x2, y2, (40 - i * 3.5) * al, t * 5 + i, i % 2 ? '#fff' : C.pink); }
      A.glow(ctx, x, y, 90 + 140 * e, C.pink, .9 * al); }
    { const pp = CL.pop(t, 6.36, .30);
      if (pp > 0) { const rot = .05 - .6 * (1 - CL.spring(t, 6.36, .7)), sc = pp * (1 + .06 * kick(t, 6.54, 10, 40)), by = PLUS_Y + 6 * Math.sin(t * 3);
        A.glow(ctx, PLUS_X, by, 520, C.pink, Math.min(1, pp) * (.55 + .15 * Math.sin(t * 9))); A.glow(ctx, PLUS_X, by, 380, C.purple, Math.min(1, pp) * .5);
        ctx.save(); ctx.translate(PLUS_X, by); ctx.rotate(rot); ctx.scale(sc, sc); plusShape(ctx, 400); ctx.restore(); } }
    if (t >= 6.54) {
      CL.ring(ctx, PLUS_X, PLUS_Y, 900, P(t, 6.54, 7.3), '#fff', 16); CL.ring(ctx, PLUS_X, PLUS_Y, 700, P(t, 6.57, 7.2), C.pink, 44);
      const [px, py] = logoPt(470, 190, px0), pk = P(t, 6.54, 7.2);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, d = eo(pk) * (150 + 90 * hash(i)); CL.spark(ctx, px + Math.cos(a) * d, py + Math.sin(a) * d, 24 * (1 - pk) * (.6 + hash(i + 2)), t * 4 + i, i % 2 ? '#fff' : C.yellow); }
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + hash(i) * .5, d = eo(pk) * (260 + 260 * hash(i + 5)); CL.spark(ctx, PLUS_X + Math.cos(a) * d, PLUS_Y + Math.sin(a) * d * .8, 38 * (1 - pk * .8) * (.5 + hash(i + 8)), t * 3 + i, ['#fff', C.cyan, C.yellow, C.pink][i % 4]); }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's1_streamers', start: 3.25, end: 7.0, draw(ctx, s) {
    const t = s.t, wp = P(t, 3.25, 3.50);
    // CUE 3.25 liquid-wipe (whoosh: candy waves sweep in and cover s0)
    if (wp < 1) wipeRibbons(ctx, t);
    ctx.save();
    if (wp < 1) { frontPath(ctx, t, SCENE_OFF, 0); ctx.clip(); }
    // camera: punch + shake on every impact
    const sh = [CL.shake(t, 3.41, .45, 9), CL.shake(t, 4.36, .8, 26), CL.shake(t, 6.06, .55, 12), CL.shake(t, 6.54, .5, 14)];
    const sx = sh.reduce((a, v) => a + v[0], 0), sy = sh.reduce((a, v) => a + v[1], 0);
    const z = 1.06 + (t > 4.36 ? .05 * Math.exp(-(t - 4.36) * 4.5) : 0) + (t > 6.06 ? .03 * Math.exp(-(t - 6.06) * 5) : 0) + (t > 6.54 ? .03 * Math.exp(-(t - 6.54) * 5) : 0);
    ctx.translate(CX + sx, 540 + sy); ctx.scale(z, z); ctx.translate(-CX, -540);
    if (t < 5.95) world1(ctx, t);
    world2(ctx, t);
    ctx.restore();
    // impact flashes
    const fl = Math.max(t >= 4.36 ? .3 * (1 - P(t, 4.36, 4.43)) : 0, t >= 6.06 ? .25 * (1 - P(t, 6.06, 6.13)) : 0, t >= 6.54 ? .2 * (1 - P(t, 6.54, 6.61)) : 0, t >= 3.41 ? .2 * (1 - P(t, 3.41, 3.48)) : 0);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  } });
})();
