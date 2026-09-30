// s5_allinone: "הכול במקום אחד / הכול נגיש / והכול מתעדכן לאורך השבוע"  (voice clock v = 12.85 .. 17.55; T = v + 3.5 here, no holds inside)
// 1) liquid wipe covers s4 -> 13.08 burst of a chaotic logo+poster swarm -> 13.435 orbit -> 13.82 vortex sucks all into ONE glossy TV (splash, shockwave, jelly)
// 2) 14.43 button pops, thumb comes in, 14.89 TAP: the candy screen splits open into a menu of big tiles
// 3) 15.36 TV shrinks into a rainbow arc of 7 day bubbles, one lights per beat 15.98..16.855, the last one throws a rainbow splash
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, TAU = A.TAU, PI = Math.PI, W = 1920, H = 1080;   // LANDSCAPE 16:9; captions occupy y > ~830

  // ---------------------------------------------------------------- timings (voice clock)
  const T_WIPE = 12.85, T_BURST = 13.08, T_SOFT = 13.25, T_ORBIT = 13.435, T_IMPACT = 13.815;   // T_SOFT: swarm starts to orbit + vortex builds (0.56 s of anticipation), T_ORBIT: word במקום
  const T_BTN = 14.43, T_TAP = 14.89;
  const T_CAL = 15.36, T_DAY0 = 15.98, T_SAT = 16.855;
  const DAY_T = Array.from({ length: 7 }, (_, i) => T_DAY0 + i * (T_SAT - T_DAY0) / 6);   // 15.98 ... 16.855 evenly spaced
  // day pops land exactly on these beats (evenly spaced, 0.1458 s apart, מתעדכן 15.98 to השבוע 16.855); bubble i pops (bump peaks) at DAY_T[i]:
  // CUE 15.98 day1
  // CUE 16.126 day2
  // CUE 16.271 day3
  // CUE 16.417 day4
  // CUE 16.563 day5
  // CUE 16.709 day6
  // CUE 16.855 day7 (Saturday, rainbow splash)
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
  const bump = (t, t0) => { const a = t0 - .13; if (t < a) return 0; if (t < t0) return ease.inOut((t - a) / .13); return Math.exp(-(t - t0) * 4.2) * Math.cos((t - t0) * 14); };   // lands on t0, then jelly settle

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
    return { type: s[0], name: s[1], w: s[2] * .95, h: s[3] * .95, ex: s[4] || {}, bx, by, s: .78 + hash(i * 3.1) * .3, rot: (hash(i * 7.7) - .5) * .5, dly: hash(i * 1.9) * .06,
      ax: 40 + hash(i * 5.3) * 55, ay: 40 + hash(i * 2.7) * 55, f1: 1.6 + hash(i * 9.1) * 1.8, f2: 2.2 + hash(i * 4.4) * 1.8, p1: hash(i) * TAU, p2: hash(i + 50) * TAU, ta: T_IMPACT - .12 * hash(i * 6.6), z: hash(i * 8.8) };
  }).sort((a, b) => a.z - b.z);
  const chaosPos = (it, t) => [it.bx + it.ax * Math.sin(t * it.f1 + it.p1) + 26 * Math.sin(t * it.f2 * 1.7 + it.p2), it.by + it.ay * Math.sin(t * it.f2 + it.p2) + 26 * Math.sin(t * it.f1 * 1.6 + it.p1)];
  function itemPose(it, t) {   // polar motion around the vortex centre: burst out, swirl in slowly, spiral into the TV exactly at the impact
    const L = clamp((t - T_BURST - it.dly) / .32); if (L <= 0 || t >= it.ta) return null;
    const Lr = ease.outBack(L), dx = it.bx - OC.x, dy = it.by - OC.y, R0 = Math.hypot(dx, dy), th0 = Math.atan2(dy, dx);
    const P = inv(T_SOFT, it.ta, t), u = inv(T_SOFT + .05, it.ta, t), [cx, cy] = chaosPos(it, t);
    const spin = 1.7 * TAU * P * P, R = R0 * Lr * (1 - Math.pow(u, 1.9)), w = (1 - ease.inOut(P)) * Math.min(1, L * 2);   // floating wobble fades as the swirl takes over
    const x = OC.x + Math.cos(th0 + spin) * R + (cx - it.bx) * w, y = OC.y + Math.sin(th0 + spin) * R + (cy - it.by) * w;
    const rot = it.rot + .12 * Math.sin(t * it.f1 + it.p2) * (1 - P) + spin * .8, sc = it.s * (.45 + .55 * Lr) * Math.min(1, ease.out(L) * 1.2) * (1 - .93 * Math.pow(u, 2.2)) * (1 + .04 * Math.sin(t * 4 + it.p1) * (1 - u));
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
    const k = ease.inOut(clamp((t - T_SOFT) / .5)), fl = ease.in(clamp((t - T_SOFT) / (T_IMPACT - T_SOFT)));
    ctx.fillStyle = '#070b2e'; ctx.fillRect(-sw / 2, -sh / 2, sw, sh); vortex(ctx, 0, 0, sw * .7, 6 + (t - T_SOFT) * 6 + Math.pow(t - T_SOFT, 2) * 14, k, 6);
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
      if (mode === 'open') sc = CL.pop(t, T_TAP + .05 + MRANK[i] * .045, .5); else { const d = FLIPS.indexOf(i); if (d >= 0 && d < 7) { const f = (t - (DAY_T[d] - .12)) / .24; if (f > 0 && f < 1) sx = Math.max(.03, Math.abs(Math.cos(f * PI))); back = f > .5 ? d : -1; if (f >= 1) back = d; } }
      if (sc <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(sc * sx, sc);
      if (back >= 0) { const bc = DCOL[back]; CL.gel(ctx, 0, 0, tw, th, { fill: bc, dark: A.mixc(bc, '#4a1fb8', .55), r: th * .28, shadow: 6, rimW: 4 }); ctx.save(); ctx.translate(-tw * .18, 0); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; starPath(ctx, th * .34, 5, .48); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.font = `900 ${th * .26}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = th * .08; ctx.strokeText('NEW', tw * .2, th * .02); ctx.fillStyle = '#fff'; ctx.fillText('NEW', tw * .2, th * .02); }
      else { CL.gel(ctx, 0, 0, tw, th, { fill: m.c, dark: A.mixc(m.c, '#2a1a8a', .5), r: th * .28, shadow: 6, rimW: 4 });
        if (m.pill) { CL.gel(ctx, 0, 0, tw * .8, th * .64, { fill: '#fff', dark: '#dfe4ff', r: th * .2, shadow: 0, gloss: false, rimW: 0 }); fitLogo(ctx, m.k, 0, 0, tw * .62, th * .44); } else fitLogo(ctx, m.k, 0, 0, tw * .66, th * .56); }
      ctx.restore();
    });
  }
  function drawTVScreen(ctx, sw, sh, t) {
    if (t < T_IMPACT) return screenVortex(ctx, sw, sh, t);
    if (t < T_TAP - .02) { screenCandy(ctx, sw, sh, t); const x = 1 - ease.inOut(clamp((t - T_IMPACT) / .3)); if (x > 0) { ctx.save(); ctx.globalAlpha = x; screenVortex(ctx, sw, sh, Math.min(t, T_IMPACT)); ctx.restore(); } return; }
    if (t < T_CAL + .6) screenMenu(ctx, sw, sh, t, 'open'); else screenMenu(ctx, sw, sh, t, 'week');
    const o = ease.inOut(clamp((t - (T_TAP - .02)) / .62));
    if (o < 1) for (const sd of [-1, 1]) {   // candy doors split open
      ctx.save(); ctx.translate(sd * o * sw * .5, 0); ctx.beginPath(); ctx.rect(sd < 0 ? -sw / 2 : 0, -sh / 2, sw / 2, sh); ctx.clip(); screenCandy(ctx, sw, sh, t); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(sd < 0 ? -6 : 0, -sh / 2, 6, sh); ctx.restore();
    }
    { const f = 1 - (t - T_TAP) / .066; if (f > 0 && t >= T_TAP) { ctx.fillStyle = `rgba(255,255,255,${.45 * f})`; ctx.fillRect(-sw / 2, -sh / 2, sw, sh); } }   // 2-frame glint
  }
  function tvPose(t) {
    let x = TV.x, y = TV.y, s = 1, rot = 0, sx = 1, sy = 1;
    if (t < T_IMPACT) { s = .25 + .75 * ease.outBack(clamp((t - 13.18) / .62)); rot = Math.sin(t * 30) * .012 * ease.in(inv(T_SOFT, T_IMPACT, t)); }
    else { const u = t - T_IMPACT, k = Math.exp(-u * 2.5) * Math.sin(u * 15); sx = 1 + .22 * k; sy = 1 - .22 * k; s += .09 * Math.exp(-u * 3.2) * Math.cos(u * 11); }
    const u2 = t - T_TAP; if (u2 > 0) s *= 1 + .07 * Math.exp(-u2 * 5) * Math.cos(u2 * 15);
    if (t >= T_TAP - .12 && t < T_TAP) s *= 1 - .03 * ease.inOut(inv(T_TAP - .12, T_TAP, t));
    rot += Math.sin(t * 1.5) * .009; y += Math.sin(t * 2.2) * 7;
    const pb = ease.inOut(clamp((t - 14.03) / .4));   // slide left to make room for the button
    x = lerp(x, TV_B.x, pb); y = lerp(y, TV_B.y, pb); s *= lerp(1, TV_B.s, pb);
    const p = ease.inOut(clamp((t - 15.4) / .8));   // glide + shrink into the arch while the bubbles pop in around it
    x = lerp(x, MINI.x, p); y = lerp(y, MINI.y, p); s = lerp(s, MINI.s, p);
    const u3 = t - T_SAT; if (u3 > 0) s *= 1 + .1 * Math.exp(-u3 * 3.5) * Math.cos(u3 * 13);
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
    const [x, y] = dayPos(i), t0 = DAY_T[i], tin = T_CAL + .04 + i * .06, pin = CL.pop(t, tin, .5); if (pin <= 0) return;
    const lp = ease.inOut(clamp((t - (t0 - .12)) / .12)), lit = lp > 0, b = bump(t, t0), r = 86;
    const wave = t > T_SAT ? .1 * bump(t, T_SAT + (6 - i) * .06 + .05) * (i < 6 ? 1 : 0) : 0;
    const sc = pin * (1 + .3 * b + wave) * (1 + (lit ? .015 * Math.sin(t * 3 + i) : 0)), col = DCOL[i], by = y + (lit ? Math.sin(t * 2.6 + i * .9) * 4 * lp : 0);
    if (lit) A.glow(ctx, x, by, r * 2.6 * sc, col, .55 * lp * (.75 + .25 * Math.max(0, b)));
    ctx.save(); ctx.translate(x, by); ctx.scale(sc, sc); CL.drop(ctx, 0, 0, r, '#4350c0', t, i); if (lit) { ctx.globalAlpha = lp; CL.drop(ctx, 0, 0, r, col, t, i); } ctx.restore();
    ctx.save(); ctx.translate(x, by + 4); ctx.scale(sc, sc); ctx.font = '900 104px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(DAYS[i], 0, 0); if (lit) { ctx.globalAlpha = lp; ctx.strokeStyle = C.ink; ctx.lineWidth = 16; ctx.strokeText(DAYS[i], 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(DAYS[i], 0, 0); } ctx.restore();
    if (lit) {
      const u = (t - t0) / .85;   // sparkle burst + ring on the new pop (settles slowly)
      if (u >= 0 && u < 1) { CL.ring(ctx, x, by, r * 2.6, u, '#fff', 14); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + hash(i * 3 + k) * .8, d = r * (1.15 + 1.3 * ease.out(u)) * (.8 + .4 * hash(k + i)); CL.spark(ctx, x + Math.cos(a) * d, by + Math.sin(a) * d, (26 + hash(k * 3 + i) * 18) * (1 - u) * (1 + .3 * (k % 2)), a + u * 2, k % 2 ? '#fff' : (k % 4 === 0 ? C.yellow : col)); } }
      const nb = CL.pop(t, t0 + .02, .42); if (nb > 0) { ctx.save(); ctx.translate(x + r * .78, by - r * .92); ctx.rotate(.22); ctx.scale(nb * sc, nb * sc); CL.chip(ctx, 'NEW', 0, 0, { size: 30, dir: 'ltr', fill: C.red, ink: '#fff', pad: 14, shadow: 4 }); ctx.restore(); }
    }
  }
  function rainbow(ctx, t) {
    const track = ease.out(clamp((t - T_CAL) / .7));   // dim track that draws on with the bubbles (from the right end, RTL)
    if (track > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx, AC.ry, 0, 2 * PI, 2 * PI - track * PI, true); ctx.stroke(); ctx.restore(); }
    const q = ease.inOut(clamp((t - T_SAT) / 1.0)); if (q <= 0) return;
    ctx.save(); ctx.lineCap = 'butt'; for (let i = 0; i < 7; i++) { const o = -66 + i * 22; ctx.strokeStyle = RAIN[i]; ctx.lineWidth = 23; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx + o, AC.ry + o, 0, PI, PI + q * PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(AC.x, AC.y, AC.rx + 84, AC.ry + 84, 0, PI, PI + q * PI); ctx.stroke(); ctx.restore();
  }

  // ---------------------------------------------------------------- transitions / atmosphere
  function wipe(ctx, t, content) {   // candy liquid sweeps right -> left (RTL) and the new scene shows behind its crest
    const p = clamp((t - T_WIPE) / .4); if (p <= 0) return; if (p >= 1) return content();
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
    for (let i = 0; i < n; i++) { const a = rg() * TAU, sp = R * (.6 + rg() * .9), r = 10 + rg() * 20, x = x0 + Math.cos(a) * sp * ease.out(clamp(u / 1.1)), y = y0 + Math.sin(a) * sp * ease.out(clamp(u / 1.1)) + 300 * u * u; ctx.save(); ctx.globalAlpha = clamp((life - u) / .6); CL.drop(ctx, x, y, r * (1 - .3 * u / life), CL.CAND[i % 8], t, i); ctx.restore(); }
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's5_allinone', start: 12.8, end: 17.55, draw(ctx, s) {
    const t = s.t;
    // CUE 12.85 whoosh-liquid-wipe (covers s4)
    wipe(ctx, t, () => content(ctx, t));
    // full-screen flashes drawn above the wipe
    const fl = t >= T_IMPACT ? 1 - (t - T_IMPACT) / .066 : 0; if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${.7 * fl})`; ctx.fillRect(0, 0, W, H); }   // 2-frame flash
  } });

  function content(ctx, t) {
    // camera shake on the impacts
    const sh1 = CL.shake(t, T_IMPACT, .7, 12), sh2 = CL.shake(t, T_TAP, .5, 6), sh3 = CL.shake(t, T_SAT, .6, 8);
    ctx.save(); ctx.translate(sh1[0] + sh2[0] + sh3[0], sh1[1] + sh2[1] + sh3[1]);
    CL.bg(ctx, t, { tint: [C.purple, C.pink, C.cyan] }); bgDrops(ctx, t);
    // phase colour push
    const ph = t < T_TAP ? [C.pink, .35] : (t < T_CAL ? [C.cyan, .35] : [t >= T_SAT ? C.orange : C.purple, .3]); A.glow(ctx, 960, 470, 1200, ph[0], ph[1] * ease.out(clamp((t - T_BURST) / .5)));

    // ---- 1. the swarm, the vortex and the ONE TV
    const pose = tvPose(t);
    // anticipation: a candy blob swells in the centre and bursts on 13.08
    if (t < T_BURST + .06) { const k = ease.in(inv(12.9, T_BURST, t)); if (k > 0) CL.drop(ctx, OC.x, OC.y, 30 + 150 * k, C.pink, t * 3, 2); }
    // CUE 13.08 all-burst (everything pops out of a splash)
    const sp0 = CL.spring(t, T_BURST - .02, .8); if (sp0 > 0 && t < 13.65) { ctx.save(); ctx.globalAlpha = 1 - ease.inOut(inv(13.2, 13.65, t)); CL.splash(ctx, OC.x, OC.y, 520, sp0, 4); ctx.restore(); CL.ring(ctx, OC.x, OC.y, 1000, (t - T_BURST) / .9, C.white, 22); }
    // CUE 13.435 orbit-start (swirl riser)
    const vk = t < T_IMPACT ? ease.inOut(clamp((t - T_SOFT) / .55)) : 1 - ease.inOut(clamp((t - T_IMPACT) / .45));
    if (vk > .01) { ctx.save(); ctx.globalAlpha = .95; vortex(ctx, TV.x, TV.y, 900, 5 + (t - T_SOFT) * 5 + Math.pow(Math.max(0, t - T_SOFT), 2) * 12, vk, 6); ctx.restore(); }
    // CUE 13.82 vortex-impact (big splash + shockwave + TV jelly)
    const sp = CL.spring(t, T_IMPACT, 1.2); if (sp > 0 && t < 16.3) { const fade = 1 - ease.inOut(inv(15.5, 16.3, t)); ctx.save(); ctx.globalAlpha = fade; CL.splash(ctx, pose.x, pose.y, lerp(720, 330, ease.inOut(inv(15.4, 16.2, t))), sp * (1 + .015 * Math.sin(t * 3)), 7); ctx.restore(); }
    // TV (also inside the arc later); its own bolt link during the tap
    if (t >= 13.15) {
      ctx.save(); ctx.translate(pose.x, pose.y + TV.h / 2 * pose.s); ctx.scale(pose.sx, pose.sy); ctx.translate(-pose.x, -pose.y - TV.h / 2 * pose.s);
      CL.tv(ctx, pose.x, pose.y, TV.w, TV.h, (c, sw, sh) => drawTVScreen(c, sw, sh, t), { scale: pose.s, rot: pose.rot, t }); ctx.restore();
    }
    if (t >= T_IMPACT) { for (let k = 0; k < 2; k++) CL.ring(ctx, TV.x, TV.y, 1100 + k * 200, (t - T_IMPACT - k * .16) / 1.2, [C.white, C.cyan][k], 26 - k * 6); candyDrops(ctx, t, TV.x, TV.y, T_IMPACT, 14, 21, 800, 2.0); }
    // swarm items
    if (t < T_IMPACT + .02) for (const it of ITEMS) { const p = itemPose(it, t); if (p) drawItem(ctx, it, p); }
    if (t < 13.7 && t > T_BURST - .05) { ctx.save(); ctx.globalAlpha = ease.inOut(clamp((t - T_BURST) / .2)) * (1 - ease.inOut(inv(13.35, 13.7, t))); CL.twinkle(ctx, t, 80, 60, 1760, 740, 22, 5); ctx.restore(); }

    // ---- 2. accessible: button (right of the TV), thumb, tap
    const bIn = CL.pop(t, T_BTN - .06, .34), bOut = 1 - ease.inOut(clamp((t - 15.1) / .45)), bs = bIn * bOut, BX = BTN.x, BY = BTN.y;
    if (bs > .01) {
      const press = clamp((t - (T_TAP - .025)) / .03) * (1 - ease.inOut(clamp((t - (T_TAP + .14)) / .3)));   // CUE 14.89 tap-click
      // CUE 14.43 button-pop (thumb enters)
      if (t >= T_TAP - .1 && t < T_TAP + .5) { const ub = ease.inOut(clamp((t - T_TAP) / .4)); CL.bolt(ctx, BX - 150, BY - 6, TV.x + 0 + (pose.x - TV.x) + 250, pose.y, clamp((t - T_TAP + .02) / .05), 3, { col: C.cyan, lw: 22, alpha: 1 - ub }); }
      button(ctx, BX, BY, bs * BTN.s, press, t);
      const dir = [Math.sin(.45), Math.cos(.45)], hit = [BX + 50, BY + 40], off = d => [hit[0] + dir[0] * d, hit[1] + dir[1] * d];
      if (t > T_BTN - .05 && t < 15.55) {
        const pp = A.key(t, [[T_BTN - .03, off(1000)], [T_BTN + .3, off(150), 'out'], [T_TAP, off(0), 'inOut'], [T_TAP + .12, off(-18), 'out'], [15.05, off(-18)], [15.5, off(1000), 'inOut']]);
        const ts = 1.15 * (t > T_TAP ? 1 - .05 * Math.exp(-(t - T_TAP) * 6) : 1);
        thumb(ctx, pp[0], pp[1], -.45, ts);
      }
      if (t >= T_TAP) { const u = (t - T_TAP) / .9; CL.ring(ctx, BX, BY, 460, u, '#fff', 24); CL.ring(ctx, pose.x, pose.y, 1000, (t - T_TAP) / .9, C.cyan, 24); candyDrops(ctx, t, BX, BY, T_TAP, 9, 33, 380, 1.6);
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .3, d = 200 + 300 * ease.out(clamp((t - T_TAP) / .9)) * (.7 + hash(k) * .5), uu = (t - T_TAP) / 1.0; if (uu < 1) CL.spark(ctx, BX + Math.cos(a) * d, BY + Math.sin(a) * d, 40 * (1 - uu), k, k % 2 ? '#fff' : C.yellow); } }
    }

    // ---- 3. updated all week: arc of 7 day bubbles + rainbow + counter
    if (t >= T_CAL - .05 && t >= 15.3) {
      rainbow(ctx, t);
      // CUE 15.36 calendar-in (bubbles pop in right to left)
      let n = 0; DAY_T.forEach(d => { if (t >= d - .03) n++; });
      // CUE 16.855 day7 rainbow-splash (Saturday): splash behind the bubbles, sparks in front
      const [sx, sy] = dayPos(6);
      if (t >= T_SAT) { const spr = CL.spring(t, T_SAT - .02, 1.2); ctx.save(); ctx.globalAlpha = 1 - ease.inOut(inv(17.2, 17.55, t)); CL.splash(ctx, sx, sy, 470, spr, 11, RAIN); ctx.restore(); for (let k = 0; k < 7; k++) CL.ring(ctx, sx, sy, 700 + k * 110, (t - T_SAT - k * .06) / 1.0, RAIN[k], 22); candyDrops(ctx, t, sx, sy, T_SAT, 18, 41, 900, 2.0); }
      for (let i = 0; i < 7; i++) dayBubble(ctx, i, t);
      if (t >= T_SAT) { const uu = (t - T_SAT) / 1.2; if (uu < 1) for (let k = 0; k < 10; k++) { const a = -PI / 2 + (hash(k * 2.2) - .3) * 1.6, d = 200 + 900 * ease.out(uu) * (.5 + hash(k)); CL.spark(ctx, sx + Math.cos(a) * d, sy + Math.sin(a) * d, 40 * (1 - uu) * (.6 + hash(k * 9)), k, RAIN[k % 7]); } }
      if (n > 0) { const d = DAY_T[n - 1], b = bump(t, d), sc = 1 + .3 * b; CL.title(ctx, `${n}/7`, 960, 150, { size: 200, dir: 'ltr', fill: ['#ffffff', DCOL[n - 1]], scale: CL.pop(t, DAY_T[0] - .05, .3) * sc, rot: -.04 + .03 * Math.sin(t * 2) }); }
    }
    ctx.restore();
  }
})();
