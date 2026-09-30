// s5_allinone: "הכול במקום אחד / הכול נגיש / והכול מתעדכן לאורך השבוע"  (voice clock v = 12.85 .. 17.55; T = v + 3.5 here, no holds inside)
// 1) liquid wipe covers s4 -> 13.08 burst of a chaotic logo+poster swarm -> 13.40 orbit -> 13.82 vortex sucks all into ONE glossy TV (splash, shockwave, jelly)
// 2) 14.43 button pops, thumb comes in, 14.87 TAP: the candy screen splits open into a menu of big tiles
// 3) 15.36 TV shrinks into a rainbow arc of 7 day bubbles, one lights per beat 15.86..16.75, the last one throws a rainbow splash
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, TAU = A.TAU, PI = Math.PI, W = 1920, H = 1080;   // LANDSCAPE 16:9; captions occupy y > ~830

  // ---------------------------------------------------------------- timings (voice clock)
  const T_WIPE = 12.85, T_BURST = 13.08, T_ORBIT = 13.40, T_IMPACT = 13.82;
  const T_BTN = 14.43, T_TAP = 14.87;
  const T_CAL = 15.36, T_DAY0 = 15.86, T_SAT = 16.75;
  const DAY_T = Array.from({ length: 7 }, (_, i) => T_DAY0 + i * (T_SAT - T_DAY0) / 6);   // 15.86 ... 16.75 evenly spaced
  // day pops land exactly on these beats (evenly spaced, 0.1483 s apart); bubble i pops (bump peaks) at DAY_T[i]:
  // CUE 15.86 day1
  // CUE 16.01 day2
  // CUE 16.16 day3
  // CUE 16.31 day4
  // CUE 16.45 day5
  // CUE 16.60 day6
  // CUE 16.75 day7 (Saturday, rainbow splash)
  const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const DCOL = [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.blue, C.purple];
  const RAIN = [C.red, C.orange, C.yellow, C.lime, C.cyan, C.blue, C.purple];
  const TV = { x: 960, y: 490, w: 770, h: 520 };
  const TV_B = { x: 600, y: 492, s: 1.0 };               // TV slides left when the button appears
  const AC = { x: 960, y: 705, rx: 700, ry: 275 };         // day-bubble arch (half ellipse)
  const MINI = { x: 960, y: 690, s: .5 };                 // TV inside the arch
  const BTN = { x: 1440, y: 450, s: 1.2 };                 // the one glossy button (right of the TV)
  const ptAt = a => [AC.x + AC.rx * Math.cos(a), AC.y - AC.ry * Math.sin(a)];
  const DAYPOS = (() => { const N = 600, L = [0]; let prev = ptAt(0); for (let i = 1; i <= N; i++) { const q = ptAt(PI * i / N); L.push(L[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1])); prev = q; }
    return Array.from({ length: 7 }, (_, d) => { const target = L[N] * d / 6; let i = 0; while (i < N && L[i + 1] < target) i++; const f = (target - L[i]) / Math.max(1e-6, L[i + 1] - L[i]); return ptAt(PI * (i + f) / N); }); })();   // evenly spaced along the arch
  const dayPos = i => DAYPOS[i];   // i=0 (א) right end ... i=6 (ש) left end (RTL reading)
  const bump = (t, t0) => { const a = t0 - .09; if (t < a) return 0; if (t < t0) return ease.out((t - a) / .09); return Math.exp(-(t - t0) * 8) * Math.cos((t - t0) * 24); };   // lands on t0, then jelly settle

  // ---------------------------------------------------------------- small drawing helpers
  const starPath = (ctx, r, n = 5, inner = .46) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * inner : r; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
  const fitLogo = (ctx, k, x, y, bw, bh, alpha = 1) => { const im = CL.logoImg(k); if (!im) return; const s = Math.min(bw / im.width, bh / im.height); ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(im, x - im.width * s / 2, y - im.height * s / 2, im.width * s, im.height * s); ctx.restore(); };
  const gloss = (ctx, x, y, rx, ry, rot = -.6, a = .7) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };

  // designed poster cards (no real images): emblem + title bars on a glossy gradient
  const POSTERS = {
    turk: ['#FF3B4E', '#6d0022'], india: ['#FFB300', '#FF2E93'], action: ['#19C8FF', '#4a1fb8'], sport: ['#7CFF3A', '#0a8a4a'],
    movie: ['#8B3DFF', '#2F6BFF'], kids: ['#FFD23F', '#FF8A1F'], live: ['#FF3B4E', '#8a0f3c'], moon: ['#2F6BFF', '#FF2E93'],
  };
  function emblem(ctx, kind, w, h) {
    ctx.save(); ctx.translate(0, -h * .1); const u = w * .5; ctx.lineJoin = 'round';
    if (kind === 'turk') {   // glossy heart + tear
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, u * .75); ctx.bezierCurveTo(-u * 1.25, -u * .05, -u * .55, -u * .95, 0, -u * .35); ctx.bezierCurveTo(u * .55, -u * .95, u * 1.25, -u * .05, 0, u * .75); ctx.fill(); ctx.stroke();
      gloss(ctx, -u * .38, -u * .3, u * .2, u * .1, -.7, .9); ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.moveTo(u * .62, u * .5); ctx.quadraticCurveTo(u * .9, u * .95, u * .62, u * 1.1); ctx.quadraticCurveTo(u * .34, u * .95, u * .62, u * .5); ctx.fill(); ctx.stroke();
    } else if (kind === 'india') {   // marigold mandala
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * TAU / 8); ctx.fillStyle = i % 2 ? '#fff' : C.yellow; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -u * .62, u * .24, u * .42, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(0, 0, u * .34, 0, TAU); ctx.fill(); ctx.stroke(); gloss(ctx, -u * .1, -u * .12, u * .12, u * .06);
    } else if (kind === 'action') {
      ctx.fillStyle = C.yellow; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(u * .3, -u * 1.05); ctx.lineTo(-u * .6, u * .1); ctx.lineTo(-u * .05, u * .1); ctx.lineTo(-u * .35, u * 1.05); ctx.lineTo(u * .65, -u * .25); ctx.lineTo(u * .05, -u * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === 'sport') {   // ball
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, u * .78, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.save(); ctx.scale(.36, .36); ctx.translate(0, 0); starPath(ctx, u * 1.15, 5, .8); ctx.fill(); ctx.restore(); ctx.lineWidth = 5; for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * u * .3, Math.sin(a) * u * .3); ctx.lineTo(Math.cos(a) * u * .78, Math.sin(a) * u * .78); ctx.stroke(); } gloss(ctx, -u * .35, -u * .4, u * .2, u * .1);
    } else if (kind === 'movie') {   // play button
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, u * .8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(-u * .25, -u * .42); ctx.lineTo(u * .5, 0); ctx.lineTo(-u * .25, u * .42); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === 'kids') {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; starPath(ctx, u * .95, 5, .48); ctx.fill(); ctx.stroke(); gloss(ctx, -u * .2, -u * .35, u * .14, u * .07, -.8);
    } else if (kind === 'live') {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-u * .82, -u * .32, u * 1.64, u * .64, u * .32); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(-u * .5, 0, u * .15, 0, TAU); ctx.fill();
      ctx.font = `900 ${u * .42}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillStyle = C.red; ctx.fillText('LIVE', u * .18, u * .03);
    } else {   // moon
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, u * .78, 0, TAU); ctx.arc(u * .36, -u * .2, u * .66, 0, TAU, true); ctx.fill('evenodd'); ctx.stroke();
      ctx.fillStyle = C.yellow; ctx.save(); ctx.translate(u * .45, -u * .2); starPath(ctx, u * .22, 4, .3); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.roundRect(-w * .3, h * .3, w * .6, h * .05, h * .025); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(-w * .2, h * .385, w * .4, h * .04, h * .02); ctx.fill();
  }
  function poster(ctx, kind, cx, cy, w, h, o = {}) {
    const [c1, c2] = POSTERS[kind]; ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); if (o.scale != null) ctx.scale(o.scale, o.scale); ctx.globalAlpha *= o.alpha ?? 1;
    CL.gel(ctx, 0, 0, w, h, { fill: c1, dark: c2, r: w * .13, shadow: 14 }); emblem(ctx, kind, w, h); ctx.restore();
  }

  // ---------------------------------------------------------------- the swarm
  // [type, name, w, h, extra]
  const SPEC = [
    ['l', 'netflix', 350, 170, { fill: '#fff' }], ['l', 'disney', 330, 180, { fill: '#123fd0', dark: '#0a1f7a', pad: .12 }], ['l', 'sport5', 230, 260, { fill: '#e8143c', dark: '#8a0a2a', pad: .12 }],
    ['p', 'turk', 200, 290], ['l', 'kan11', 320, 150, { fill: '#1a86ff', dark: '#0e4bb5', pad: .12 }], ['l', 'keshet12', 230, 240, { fill: '#fff' }],
    ['p', 'india', 200, 290], ['l', 'yesbrand', 270, 160, { fill: '#8B3DFF', dark: '#4a1fb8', pad: .16 }], ['l', 'hotbrand', 210, 220, { fill: '#ff2e4a', dark: '#a80d2a', pad: .14 }],
    ['p', 'sport', 190, 280], ['l', 'prime', 330, 150, { fill: '#fff' }], ['p', 'action', 200, 290], ['l', 'reshet13', 220, 220, { fill: '#fff', pad: .1 }],
    ['l', 'sport1', 330, 150, { fill: '#0b1250', dark: '#070b2e', pad: .12 }], ['p', 'live', 190, 280], ['l', 'i24', 310, 180, { fill: '#0fa7e0', dark: '#0b6ea8', pad: .12 }],
    ['p', 'movie', 200, 290], ['l', 'ch14', 210, 210, { fill: '#fff', pad: .1 }], ['p', 'moon', 190, 280], ['l', 'appletv', 320, 150, { fill: '#2b2f52', dark: '#12142e', pad: .14 }],
    ['l', 'hbo', 210, 210, { fill: '#fff', pad: .1 }], ['p', 'kids', 190, 280],
  ];
  const OC = { x: 960, y: 480 };   // swarm / vortex centre
  const ITEMS = SPEC.map((s, i) => {
    const g = i * 2.399963, rad = .3 + .7 * Math.sqrt((i + .6) / SPEC.length), bx = OC.x + Math.cos(g) * rad * 850, by = OC.y + Math.sin(g) * rad * 340;
    return { type: s[0], name: s[1], w: s[2] * .95, h: s[3] * .95, ex: s[4] || {}, bx, by, s: .78 + hash(i * 3.1) * .3, rot: (hash(i * 7.7) - .5) * .5, dly: hash(i * 1.9) * .07,
      ax: 40 + hash(i * 5.3) * 55, ay: 40 + hash(i * 2.7) * 55, f1: 1.6 + hash(i * 9.1) * 1.8, f2: 2.2 + hash(i * 4.4) * 1.8, p1: hash(i) * TAU, p2: hash(i + 50) * TAU, ta: T_IMPACT - .05 * hash(i * 6.6), z: hash(i * 8.8) };
  }).sort((a, b) => a.z - b.z);
  const chaosPos = (it, t) => [it.bx + it.ax * Math.sin(t * it.f1 + it.p1) + 26 * Math.sin(t * it.f2 * 1.7 + it.p2), it.by + it.ay * Math.sin(t * it.f2 + it.p2) + 26 * Math.sin(t * it.f1 * 1.6 + it.p1)];
  function itemPose(it, t) {   // -> {x,y,rot,sc,alpha} or null
    const L = clamp((t - T_BURST - it.dly) / .3); if (L <= 0) return null;
    let [x, y] = chaosPos(it, t), rot = it.rot + .12 * Math.sin(t * it.f1 + it.p2), sc = it.s * (.5 + .5 * ease.outBack(L)) * (1 + .04 * Math.sin(t * 4 + it.p1));
    x = lerp(OC.x, x, ease.outBack(L)); y = lerp(OC.y, y, ease.outBack(L)); if (L < 1) sc *= ease.out(L);
    if (t >= T_ORBIT) {
      const u = (t - T_ORBIT) / (it.ta - T_ORBIT); if (u >= 1) return null;
      const [x0, y0] = chaosPos(it, T_ORBIT), dx = x0 - OC.x, dy = y0 - OC.y, R0 = Math.hypot(dx, dy), th0 = Math.atan2(dy, dx);
      const spin = 1.4 * TAU * Math.pow(u, 1.7), R = R0 * (1 - Math.pow(u, 2.3)), [cx, cy] = chaosPos(it, t), [c0x, c0y] = chaosPos(it, T_ORBIT);
      x = OC.x + Math.cos(th0 + spin) * R + (cx - c0x) * (1 - u); y = OC.y + Math.sin(th0 + spin) * R + (cy - c0y) * (1 - u);
      rot += spin * .9; sc = it.s * (1 - .9 * Math.pow(u, 2.6)) * (1 + .04 * Math.sin(t * 4 + it.p1));
    }
    return { x, y, rot, sc };
  }
  function drawItem(ctx, it, p) {
    if (it.type === 'l') CL.logoCard(ctx, it.name, p.x, p.y, it.w, it.h, { rot: p.rot, scale: p.sc, fill: it.ex.fill, dark: it.ex.dark, pad: it.ex.pad });
    else poster(ctx, it.name, p.x, p.y, it.w, it.h, { rot: p.rot, scale: p.sc });
  }

  // liquid vortex: candy spiral arms. k 0..1 growth
  function vortex(ctx, cx, cy, Rmax, rot, k, arms = 6) {
    if (k <= 0) return; ctx.save(); ctx.translate(cx, cy);
    for (let a = 0; a < arms; a++) {
      const col = CL.CAND[a % CL.CAND.length], L = [], R = [], N = 34, base = rot + a * TAU / arms;
      for (let i = 0; i <= N; i++) { const s = i / N, r = Rmax * k * Math.pow(s, .85) + 8, ang = base - s * 2.9 * k, hw = (10 + 62 * Math.sin(Math.min(1, s * 1.15) * PI * .62) * (1 - s * .35)) * k, nx = Math.cos(ang + PI / 2), ny = Math.sin(ang + PI / 2), px = Math.cos(ang) * r, py = Math.sin(ang) * r; L.push([px + nx * hw, py + ny * hw]); R.push([px - nx * hw, py - ny * hw]); }
      ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); for (let i = 3; i < N - 2; i++) { const p = L[i], q = R[i], x = lerp(p[0], q[0], .3), y = lerp(p[1], q[1], .3); i > 3 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 8 * k; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- TV screens
  function screenVortex(ctx, sw, sh, t) {
    const k = ease.out(clamp((t - T_ORBIT) / .35)), fl = ease.in(clamp((t - T_ORBIT) / (T_IMPACT - T_ORBIT)));
    ctx.fillStyle = '#070b2e'; ctx.fillRect(-sw / 2, -sh / 2, sw, sh); vortex(ctx, 0, 0, sw * .7, 6 + (t - T_ORBIT) * (10 + fl * 16), k, 6);
    A.glow(ctx, 0, 0, sw * .5, '#ffffff', .15 + .75 * fl); A.glow(ctx, 0, 0, sw * .7, C.cyan, .3 * fl);
  }
  function screenCandy(ctx, sw, sh, t) {
    ctx.fillStyle = A.linear(ctx, -sw / 2, -sh / 2, sw / 2, sh / 2, [[0, '#FF2E93'], [.5, '#8B3DFF'], [1, '#19C8FF']]); ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    A.glow(ctx, -sw * .25 + Math.sin(t * 1.4) * 60, -sh * .2, sw * .5, C.yellow, .38); A.glow(ctx, sw * .3, sh * .2 + Math.cos(t * 1.2) * 50, sw * .55, C.cyan, .45);
    for (let j = 0; j < 3; j++) { ctx.fillStyle = ['rgba(255,255,255,.16)', 'rgba(255,210,63,.22)', 'rgba(25,200,255,.3)'][j]; ctx.beginPath(); ctx.moveTo(-sw / 2, sh / 2); for (let x = -sw / 2; x <= sw / 2 + 20; x += 20) ctx.lineTo(x, sh * (.28 + j * .1) + Math.sin(x * .011 + t * (2 + j) + j * 2) * 34); ctx.lineTo(sw / 2, sh / 2); ctx.closePath(); ctx.fill(); }
    ctx.save(); ctx.translate(0, -6 + Math.sin(t * 3) * 6); ctx.fillStyle = 'rgba(2,4,30,.35)'; ctx.beginPath(); ctx.arc(8, 14, sh * .27, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, sh * .27, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(-sh * .08, -sh * .14); ctx.lineTo(sh * .16, 0); ctx.lineTo(-sh * .08, sh * .14); ctx.closePath(); ctx.lineJoin = 'round'; ctx.fill(); ctx.lineWidth = 8; ctx.stroke(); gloss(ctx, -sh * .1, -sh * .15, sh * .07, sh * .035); ctx.restore();
    CL.twinkle(ctx, t, -sw / 2, -sh / 2, sw, sh, 8, 3);
  }
  const MENU = [
    { k: 'netflix', c: C.red, pill: 1 }, { k: 'disney', c: C.blue }, { k: 'sport5', c: C.green },
    { k: 'kan11', c: C.cyan }, { k: 'keshet12', c: C.yellow, pill: 1 }, { k: 'yesbrand', c: C.purple },
    { k: 'hotbrand', c: C.orange }, { k: 'prime', c: C.pink, pill: 1 }, { k: 'i24', c: '#2F6BFF' } ];
  const MRANK = [5, 1, 4, 6, 0, 2, 7, 3, 8];    // pop order (centre first)
  const FLIPS = [4, 0, 8, 2, 6, 1, 7, 3, 5];    // tile flipped by day i
  // menu of 3x3 tiles. mode 'open': pop from T_TAP; mode 'week': static + flips per day
  function screenMenu(ctx, sw, sh, t, mode) {
    ctx.fillStyle = A.linear(ctx, 0, -sh / 2, 0, sh / 2, [[0, '#101a6e'], [1, '#070b2e']]); ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    const g = sw * .022, tw = (sw * .95 - 2 * g) / 3, th = (sh * .95 - 2 * g) / 3;
    MENU.forEach((m, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = (1 - col) * (tw + g), y = (row - 1) * (th + g);
      let sc = 1, sx = 1, back = -1;
      if (mode === 'open') sc = CL.pop(t, T_TAP - .05 + MRANK[i] * .028, .26); else { const d = FLIPS.indexOf(i); if (d >= 0 && d < 7) { const f = (t - (DAY_T[d] - .12)) / .24; if (f > 0 && f < 1) sx = Math.max(.03, Math.abs(Math.cos(f * PI))); back = f > .5 ? d : -1; if (f >= 1) back = d; } }
      if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc * sx, sc);
      if (back >= 0) { const bc = DCOL[back]; CL.gel(ctx, 0, 0, tw, th, { fill: bc, dark: A.mixc(bc, '#4a1fb8', .55), r: th * .28, shadow: 6, rimW: 4 }); ctx.save(); ctx.translate(-tw * .18, 0); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; starPath(ctx, th * .34, 5, .48); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.font = `900 ${th * .26}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = th * .08; ctx.strokeText('NEW', tw * .2, th * .02); ctx.fillStyle = '#fff'; ctx.fillText('NEW', tw * .2, th * .02); }
      else { CL.gel(ctx, 0, 0, tw, th, { fill: m.c, dark: A.mixc(m.c, '#2a1a8a', .5), r: th * .28, shadow: 6, rimW: 4 });
        if (m.pill) { CL.gel(ctx, 0, 0, tw * .8, th * .64, { fill: '#fff', dark: '#dfe4ff', r: th * .2, shadow: 0, gloss: false, rimW: 0 }); fitLogo(ctx, m.k, 0, 0, tw * .62, th * .44); } else fitLogo(ctx, m.k, 0, 0, tw * .66, th * .56); }
      ctx.restore();
    });
  }
  function drawTVScreen(ctx, sw, sh, t) {
    if (t < T_IMPACT) return screenVortex(ctx, sw, sh, t);
    if (t < T_TAP - .02) return screenCandy(ctx, sw, sh, t);
    if (t < T_CAL + .2) screenMenu(ctx, sw, sh, t, 'open'); else screenMenu(ctx, sw, sh, t, 'week');
    const o = ease.out(clamp((t - (T_TAP - .01)) / .34));
    if (o < 1) for (const sd of [-1, 1]) {   // candy doors split open
      ctx.save(); ctx.translate(sd * o * sw * .5, 0); ctx.beginPath(); ctx.rect(sd < 0 ? -sw / 2 : 0, -sh / 2, sw / 2, sh); ctx.clip(); screenCandy(ctx, sw, sh, t); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(sd < 0 ? -6 : 0, -sh / 2, 6, sh); ctx.restore();
    }
    if (t >= T_TAP - .01) { const f = Math.exp(-(t - T_TAP) * 14); if (f > .02) { ctx.fillStyle = `rgba(255,255,255,${.5 * f})`; ctx.fillRect(-sw / 2, -sh / 2, sw, sh); } }
  }
  function tvPose(t) {
    let x = TV.x, y = TV.y, s = 1, rot = 0, sx = 1, sy = 1;
    if (t < T_IMPACT) { s = .25 + .75 * ease.outBack(clamp((t - 13.28) / .42)); rot = Math.sin(t * 38) * .012 * ease.in(inv(T_ORBIT, T_IMPACT, t)); }
    else { const u = t - T_IMPACT, k = Math.exp(-u * 4.4) * Math.sin(u * 27); sx = 1 + .2 * k; sy = 1 - .2 * k; s += .09 * Math.exp(-u * 6) * Math.cos(u * 21); }
    const u2 = t - T_TAP; if (u2 > 0) s *= 1 + .07 * Math.exp(-u2 * 9) * Math.cos(u2 * 30);
    if (t >= T_TAP - .08 && t < T_TAP) s *= 1 - .03 * ease.out(inv(T_TAP - .08, T_TAP, t));
    rot += Math.sin(t * 1.5) * .009; y += Math.sin(t * 2.2) * 7 * (1 - clamp((t - T_CAL) / .3) * .5);
    const pb = ease.inOut(clamp((t - 14.1) / .32));   // slide left to make room for the button
    x = lerp(x, TV_B.x, pb); y = lerp(y, TV_B.y, pb); s *= lerp(1, TV_B.s, pb);
    const p = CL.pop(t, T_CAL - .08, .5);   // shrink into the arch (springy)
    x = lerp(x, MINI.x, p); y = lerp(y, MINI.y, p); s = lerp(s, MINI.s, p) * (1);
    const u3 = t - T_SAT; if (u3 > 0) s *= 1 + .1 * Math.exp(-u3 * 8) * Math.cos(u3 * 24);
    return { x, y, s, rot, sx, sy };
  }

  // ---------------------------------------------------------------- button + thumb
  function button(ctx, x, y, sc, press, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const pulse = t < T_TAP ? .5 + .5 * Math.sin(t * 12) : 0; if (t < T_TAP) { ctx.strokeStyle = C.yellow; ctx.globalAlpha *= .8 * (1 - pulse * .5); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 150 + pulse * 26, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(2,4,30,.45)'; ctx.beginPath(); ctx.ellipse(6, 20, 150, 138, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = A.linear(ctx, 0, -130, 0, 130, [[0, '#3a4fe0'], [1, '#0a1050']]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 138, 0, TAU); ctx.fill(); ctx.stroke();
    const depth = 24 * (1 - press), r = 108; ctx.fillStyle = '#9a0f5a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.translate(0, -depth + 4); ctx.fillStyle = A.radial(ctx, -r * .3, -r * .4, r * .1, r * 1.2, [[0, '#ffb3dc'], [.25, '#FF2E93'], [1, '#c2126e']]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    gloss(ctx, -r * .32, -r * .5, r * .42, r * .18, -.5, .7); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-r * .27, -r * .42); ctx.lineTo(r * .48, 0); ctx.lineTo(-r * .27, r * .42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function thumb(ctx, x, y, rot, sc) {   // tip of the thumb at (x,y), body extends along +y (rotated)
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); const w = 190;
    ctx.fillStyle = 'rgba(2,4,30,.35)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 22, 40, w, 900, w / 2); ctx.fill();
    const body = () => { ctx.beginPath(); ctx.moveTo(-w / 2, 900); ctx.lineTo(-w / 2, w / 2); ctx.arc(0, w / 2, w / 2, PI, 0); ctx.lineTo(w / 2 * 1.1, 900); ctx.closePath(); };
    body(); ctx.fillStyle = A.linear(ctx, -w / 2, 0, w / 2, 0, [[0, '#ffdcc4'], [.45, '#ffc59c'], [1, '#e98f68']]); ctx.fill(); ctx.lineWidth = 11; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-w * .34, w * .11, w * .68, w * .62, [w * .3, w * .3, w * .14, w * .14]); ctx.fillStyle = '#fff2ec'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#d99a80'; ctx.stroke();
    gloss(ctx, -w * .12, w * .27, w * .13, w * .06, -1.1, .9);
    ctx.strokeStyle = 'rgba(140,60,30,.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-w * .3, 330 + i * 26); ctx.quadraticCurveTo(0, 350 + i * 26, w * .3, 330 + i * 26); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- day bubbles, rainbow
  function dayBubble(ctx, i, t) {
    const [x, y] = dayPos(i), t0 = DAY_T[i], tin = T_CAL + i * .05, pin = CL.pop(t, tin, .32); if (pin <= 0) return;
    const lit = t >= t0 - .03, b = bump(t, t0), wave = t > T_SAT ? .12 * Math.max(0, bump(t, T_SAT + (6 - i) * .045 + .05)) * (i < 6 ? 1 : 0) : 0, r = 86;
    const sc = pin * (1 + .34 * b + wave) * (1 + (lit ? .015 * Math.sin(t * 3 + i) : 0)), col = DCOL[i], by = y + (lit ? Math.sin(t * 2.6 + i * .9) * 4 : 0);
    if (lit) { A.glow(ctx, x, by, r * 2.6 * sc, col, .55 * (.7 + .3 * Math.max(0, b))); }
    ctx.save(); ctx.translate(x, by); ctx.scale(sc, sc); CL.drop(ctx, 0, 0, r, lit ? col : '#4350c0', t, i); ctx.restore();
    ctx.save(); ctx.translate(x, by + 4); ctx.scale(sc, sc); ctx.font = '900 104px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.lineJoin = 'round';
    if (lit) { ctx.strokeStyle = C.ink; ctx.lineWidth = 16; ctx.strokeText(DAYS[i], 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(DAYS[i], 0, 0); } else { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(DAYS[i], 0, 0); } ctx.restore();
    if (lit) {
      const u = (t - t0) / .5;   // little sparkle burst + ring on the new pop
      if (u >= 0 && u < 1) { CL.ring(ctx, x, by, r * 2.6, u, '#fff', 14); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + hash(i * 3 + k) * .8, d = r * (1.15 + 1.3 * ease.out(u)) * (.8 + .4 * hash(k + i)); CL.spark(ctx, x + Math.cos(a) * d, by + Math.sin(a) * d, (26 + hash(k * 3 + i) * 18) * (1 - u) * (1 + .3 * (k % 2)), a + u * 3, k % 2 ? '#fff' : (k % 4 === 0 ? C.yellow : col)); } }
      const nb = CL.pop(t, t0 + .02, .26); if (nb > 0) { ctx.save(); ctx.translate(x + r * .78, by - r * .92); ctx.rotate(.22); ctx.scale(nb * sc, nb * sc); CL.chip(ctx, 'NEW', 0, 0, { size: 30, dir: 'ltr', fill: C.red, ink: '#fff', pad: 14, shadow: 4 }); ctx.restore(); }
    }
  }
  function rainbow(ctx, t) {
    const track = ease.out(clamp((t - T_CAL) / .45));   // dim track that draws on with the bubbles (from the right end, RTL)
    if (track > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx, AC.ry, 0, 2 * PI, 2 * PI - track * PI, true); ctx.stroke(); ctx.restore(); }
    const q = ease.out(clamp((t - T_SAT) / .5)); if (q <= 0) return;
    ctx.save(); ctx.lineCap = 'butt'; for (let i = 0; i < 7; i++) { const o = -66 + i * 22; ctx.strokeStyle = RAIN[i]; ctx.lineWidth = 23; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx + o, AC.ry + o, 0, PI, PI + q * PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx + 84, AC.ry + 84, 0, PI, PI + q * PI); ctx.stroke(); ctx.restore();
  }

  // ---------------------------------------------------------------- transitions / atmosphere
  function wipe(ctx, t, content) {   // candy liquid sweeps right -> left (RTL) and the new scene shows behind its crest
    const p = clamp((t - T_WIPE) / .36); if (p <= 0) return; if (p >= 1) return content();
    const e = ease.inOut(p), edge = y => W * (1.12 - e * 1.32) + Math.sin(y * .012 + p * 8) * 80 + Math.sin(y * .031 - p * 5) * 28;
    const bands = [[C.cyan, 200], [C.purple, 135], [C.orange, 80], [C.pink, 32]];
    const poly = off => { ctx.beginPath(); ctx.moveTo(W + 60, -10); for (let y = -10; y <= H + 30; y += 24) ctx.lineTo(edge(y) - off, y); ctx.lineTo(W + 60, H + 30); ctx.closePath(); };
    bands.forEach(([col, off]) => { ctx.fillStyle = col; poly(off); ctx.fill(); });
    ctx.save(); poly(0); ctx.clip(); content(); ctx.restore();
    for (let i = 0; i < 9; i++) { const y = hash(i * 4.1) * H, x = edge(y) - 200 - hash(i) * 260 * e; CL.drop(ctx, x, y, 14 + hash(i * 2.2) * 22, CL.CAND[i % 8], t, i); }   // drops flying off the crest
  }
  function bgDrops(ctx, t) {
    ctx.save(); ctx.globalAlpha = .55; for (let i = 0; i < 12; i++) { const x = hash(i * 3.3) * W, y = H - ((t * (30 + hash(i) * 40) + hash(i * 7) * H) % (H + 100)) + 50, r = 8 + hash(i * 5) * 18; CL.drop(ctx, x + Math.sin(t + i) * 18, y, r, CL.CAND[i % 8], t, i); } ctx.restore();
  }
  function candyDrops(ctx, t, x0, y0, t0, n, seed, R, life = 1.1) {   // flying drops with gravity
    const u = t - t0; if (u < 0 || u > life) return; const rg = rng(seed);
    for (let i = 0; i < n; i++) { const a = rg() * TAU, sp = R * (.6 + rg() * .9), r = 10 + rg() * 20, x = x0 + Math.cos(a) * sp * ease.out(clamp(u / .7)), y = y0 + Math.sin(a) * sp * ease.out(clamp(u / .7)) + 900 * u * u * .5 * .5; ctx.save(); ctx.globalAlpha = clamp((life - u) / .3); CL.drop(ctx, x, y, r * (1 - .3 * u / life), CL.CAND[i % 8], t, i); ctx.restore(); }
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's5_allinone', start: 12.8, end: 17.55, draw(ctx, s) {
    const t = s.t;
    // CUE 12.85 whoosh-liquid-wipe (covers s4)
    wipe(ctx, t, () => content(ctx, t));
    // full-screen flashes drawn above the wipe
    const fl = t >= T_IMPACT ? Math.exp(-(t - T_IMPACT) * 20) : 0; if (fl > .02) { ctx.fillStyle = `rgba(255,255,255,${.8 * fl})`; ctx.fillRect(0, 0, W, H); }
  } });

  function content(ctx, t) {
    // camera shake on the impacts
    const sh1 = CL.shake(t, T_IMPACT, .45, 20), sh2 = CL.shake(t, T_TAP, .3, 12), sh3 = CL.shake(t, T_SAT, .4, 14);
    ctx.save(); ctx.translate(sh1[0] + sh2[0] + sh3[0], sh1[1] + sh2[1] + sh3[1]);
    CL.bg(ctx, t, { tint: [C.purple, C.pink, C.cyan] }); bgDrops(ctx, t);
    // phase colour push
    const ph = t < T_TAP ? [C.pink, .35] : (t < T_CAL ? [C.cyan, .35] : [t >= T_SAT ? C.orange : C.purple, .3]); A.glow(ctx, 960, 470, 1200, ph[0], ph[1] * ease.out(clamp((t - T_BURST) / .5)));

    // ---- 1. the swarm, the vortex and the ONE TV
    const pose = tvPose(t);
    // anticipation: a candy blob swells in the centre and bursts on 13.08
    if (t < T_BURST + .06) { const k = ease.in(inv(12.9, T_BURST, t)); if (k > 0) CL.drop(ctx, OC.x, OC.y, 30 + 150 * k, C.pink, t * 3, 2); }
    // CUE 13.08 all-burst (everything pops out of a splash)
    const sp0 = CL.spring(t, T_BURST - .02, .5); if (sp0 > 0 && t < T_ORBIT) { ctx.save(); ctx.globalAlpha = 1 - ease.in(inv(13.14, 13.36, t)); CL.splash(ctx, OC.x, OC.y, 520, sp0, 4); ctx.restore(); for (let k = 0; k < 3; k++) CL.ring(ctx, OC.x, OC.y, 900 + k * 150, (t - T_BURST - k * .05) / .5, [C.white, C.yellow, C.pink][k], 22); }
    // CUE 13.40 orbit-start (swirl riser)
    const vk = t < T_IMPACT ? ease.out(clamp((t - T_ORBIT) / .3)) : 1 - ease.in(clamp((t - T_IMPACT) / .16));
    if (vk > .01) { ctx.save(); ctx.globalAlpha = .95; vortex(ctx, TV.x, TV.y, 900, 5 + (t - T_ORBIT) * (9 + 15 * ease.in(inv(T_ORBIT, T_IMPACT, t))), vk, 6); ctx.restore(); }
    // CUE 13.82 vortex-impact (big splash + shockwave + TV jelly)
    const sp = CL.spring(t, T_IMPACT, .7); if (sp > 0 && t < T_CAL + .6) { const fade = 1 - ease.in(inv(T_CAL - .1, T_CAL + .45, t)); ctx.save(); ctx.globalAlpha = fade; CL.splash(ctx, pose.x, pose.y, lerp(720, 330, ease.inOut(inv(T_CAL - .1, T_CAL + .4, t))), sp * (1 + .015 * Math.sin(t * 5)), 7); ctx.restore(); }
    // TV (also inside the arc later); its own bolt link during the tap
    if (t >= 13.28) {
      ctx.save(); ctx.translate(pose.x, pose.y + TV.h / 2 * pose.s); ctx.scale(pose.sx, pose.sy); ctx.translate(-pose.x, -pose.y - TV.h / 2 * pose.s);
      CL.tv(ctx, pose.x, pose.y, TV.w, TV.h, (c, sw, sh) => drawTVScreen(c, sw, sh, t), { scale: pose.s, rot: pose.rot, t }); ctx.restore();
    }
    if (t >= T_IMPACT) { for (let k = 0; k < 3; k++) CL.ring(ctx, TV.x, TV.y, 1000 + k * 160, (t - T_IMPACT - k * .07) / .6, [C.white, C.cyan, C.pink][k], 26 - k * 5); candyDrops(ctx, t, TV.x, TV.y, T_IMPACT, 18, 21, 800, 1.2); }
    // swarm items
    if (t < T_IMPACT + .02) for (const it of ITEMS) { const p = itemPose(it, t); if (p) drawItem(ctx, it, p); }
    if (t < T_ORBIT + .2 && t > T_BURST - .05) { /* sparkles in the chaos */ CL.twinkle(ctx, t, 80, 60, 1760, 740, 22, 5); }

    // ---- 2. accessible: button (right of the TV), thumb, tap
    const bIn = CL.pop(t, T_BTN - .06, .34), bOut = 1 - ease.in(clamp((t - 15.15) / .2)), bs = bIn * bOut, BX = BTN.x, BY = BTN.y;
    if (bs > .01) {
      const press = clamp((t - (T_TAP - .025)) / .03) * (1 - clamp((t - 14.99) / .16));   // CUE 14.87 tap-click
      // CUE 14.43 button-pop (thumb enters)
      if (t >= T_TAP - .1 && t < T_TAP + .3) { const ub = clamp((t - T_TAP) / .25); CL.bolt(ctx, BX - 150, BY - 6, TV.x + 0 + (pose.x - TV.x) + 250, pose.y, clamp((t - T_TAP + .02) / .05), 3, { col: C.cyan, lw: 22, alpha: 1 - ub }); }
      button(ctx, BX, BY, bs * BTN.s, press, t);
      const dir = [Math.sin(.45), Math.cos(.45)], hit = [BX + 50, BY + 40], off = d => [hit[0] + dir[0] * d, hit[1] + dir[1] * d];
      if (t > T_BTN - .05 && t < 15.35) {
        const pp = A.key(t, [[T_BTN - .03, off(1000)], [T_BTN + .29, off(190), 'out'], [T_TAP, off(0), 'in'], [T_TAP + .07, off(-18), 'out'], [15.0, off(-18)], [15.3, off(1000), 'inOut']]);
        const ts = 1.15 * (t > T_TAP ? 1 - .05 * Math.exp(-(t - T_TAP) * 10) : 1);
        thumb(ctx, pp[0], pp[1], -.45, ts);
      }
      if (t >= T_TAP) { const u = (t - T_TAP) / .55; CL.ring(ctx, BX, BY, 380, u, '#fff', 24); CL.ring(ctx, BX, BY, 620, u - .1, C.cyan, 16); CL.ring(ctx, pose.x, pose.y, 1000, (t - T_TAP) / .5, C.cyan, 24); candyDrops(ctx, t, BX, BY, T_TAP, 12, 33, 380, 1.0);
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .3, d = 200 + 300 * ease.out(clamp((t - T_TAP) / .5)) * (.7 + hash(k) * .5), uu = (t - T_TAP) / .6; if (uu < 1) CL.spark(ctx, BX + Math.cos(a) * d, BY + Math.sin(a) * d, 40 * (1 - uu), k, k % 2 ? '#fff' : C.yellow); } }
    }

    // ---- 3. updated all week: arc of 7 day bubbles + rainbow + counter
    if (t >= T_CAL - .05) {
      rainbow(ctx, t);
      // CUE 15.36 calendar-in (bubbles pop in right to left)
      let n = 0; DAY_T.forEach(d => { if (t >= d - .03) n++; });
      // CUE 16.75 day7 rainbow-splash (Saturday): splash behind the bubbles, sparks in front
      const [sx, sy] = dayPos(6);
      if (t >= T_SAT) { const spr = CL.spring(t, T_SAT - .02, .7); ctx.save(); ctx.globalAlpha = 1 - ease.in(inv(17.1, 17.5, t)); CL.splash(ctx, sx, sy, 470, spr, 11, RAIN); ctx.restore(); for (let k = 0; k < 7; k++) CL.ring(ctx, sx, sy, 700 + k * 110, (t - T_SAT - k * .045) / .6, RAIN[k], 22); candyDrops(ctx, t, sx, sy, T_SAT, 24, 41, 900, 1.3); }
      for (let i = 0; i < 7; i++) dayBubble(ctx, i, t);
      if (t >= T_SAT) { const uu = (t - T_SAT) / .8; if (uu < 1) for (let k = 0; k < 12; k++) { const a = -PI / 2 + (hash(k * 2.2) - .3) * 1.6, d = 200 + 900 * ease.out(uu) * (.5 + hash(k)); CL.spark(ctx, sx + Math.cos(a) * d, sy + Math.sin(a) * d, 40 * (1 - uu) * (.6 + hash(k * 9)), k, RAIN[k % 7]); } }
      if (n > 0) { const d = DAY_T[n - 1], b = bump(t, d), sc = 1 + .3 * b; CL.title(ctx, `${n}/7`, 960, 150, { size: 200, dir: 'ltr', fill: ['#ffffff', DCOL[n - 1]], scale: CL.pop(t, DAY_T[0] - .05, .3) * sc, rot: -.04 + .03 * Math.sin(t * 2) }); }
    }
    ctx.restore();
  }
})();
