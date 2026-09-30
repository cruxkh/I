// HOST: "Connie", the ConnectTV mascot. A glossy candy TV character drawn in code (blue gel bezel with white rim light, two antennas with pink balls,
// cute screen face, tiny arms/hands, stubby legs, jelly squash and stretch, soft glow). Landscape 1920x1080.
//   window.CONNIE.draw(ctx, x, y, size, pose, t)   x,y = centre of the TV body, size = total height in px (antennas to feet), t = idle clock (seconds)
//   window.HOST = { async prepare(t), overlay(ctx, t) }  overlay draws the timed appearances (APPS) in the side margins.
// Everything is a pure function of the OUTPUT clock T (A.T, keeps running in holds), word times are converted with TLF.TofV.
(() => {
  const { clamp, lerp, ease, hash, TAU } = A, C = CL.C, PI = Math.PI, W = 1920, H = 1080, INK = '#050826';
  const sin = Math.sin, cos = Math.cos;

  // ------------------------------------------------------------------ pose defaults
  const DEF = {
    sx: 1, sy: 1, rot: 0, skew: 0, legs: true, air: 0, walk: 0, shadow: 0, glow: .55,
    look: [0, 0], blink: null, eyes: 'open', lid: 0, lidY: 0, brow: 0, wink: null,
    mouth: null,               // null = talk along the narration; else {open:0..1, smile:-1..1, shape:'d'|'o'|'flat', wob}
    armL: null, armR: null,    // {a (rad, screen space), L (length factor), bend, hand:'open|fist|point|thumb|wave|palm|remote|mic|mega|none', front:bool, spin}
    ant: 0, antUp: 0, blush: 1, tear: 0, sweat: 0, sparks: 0, hat: null, press: 0, talk: 0, live: 0,
  };
  const mirror = s => s && ({ ...s, a: PI - s.a, bend: -(s.bend || 0) });
  const REST_R = { a: 1.2, L: .9, bend: -.3, hand: 'open' };

  // ------------------------------------------------------------------ small drawing helpers (unit space: body 200x156 centred on 0,0; feet at y=128)
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function capsule(g, x0, y0, x1, y1, w) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.lineCap = 'round'; g.stroke(); }
  function gloss(g, x, y, r, col, inkw = 4) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = A.radial(g, x - r * .3, y - r * .35, r * .1, r * 1.15, [[0, '#fff'], [.28, col], [1, A.mixc(col, '#4a1fb8', .55)]]); g.fill();
    g.lineWidth = inkw; g.strokeStyle = INK; g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(x - r * .32, y - r * .4, r * .26, r * .13, -.7, 0, TAU); g.fill();
  }
  function talkEnv(t) {
    for (const w of WORDS) if (t >= w.t0 - .02 && t <= w.t1 + .05) { const env = Math.sqrt(sin(PI * clamp((t - w.t0 + .02) / (w.t1 - w.t0 + .07)))), osc = .5 + .5 * sin((t - w.t0) * TAU * 3.6); return clamp(env * (.22 + .62 * osc)); }
    return 0;
  }
  let TALK = 0;   // narration envelope of the current frame (set by HOST.overlay)

  // ------------------------------------------------------------------ hands & props (drawn in a frame at the hand, x axis = arm direction)
  function hand(g, x, y, a, spec, t, p) {
    const kind = spec.hand || 'open';
    g.save(); g.translate(x, y); g.rotate(a);
    const glove = (r = 20) => { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = A.radial(g, -6, -7, 2, r * 1.2, [[0, '#ffffff'], [.6, '#f3f6ff'], [1, '#b9c6ff']]); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); };
    const finger = (ang, len, w = 12) => { g.save(); g.rotate(ang); rr(g, 8, -w / 2, len, w, w / 2); g.fillStyle = '#f3f6ff'; g.fill(); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); g.restore(); };
    if (kind === 'remote') {
      rr(g, -8, -15, 92, 30, 10); g.fillStyle = A.linear(g, 0, -15, 0, 15, [[0, '#3a4a9a'], [1, '#141a55']]); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      [[C.pink, 24], [C.lime, 42], [C.cyan, 60]].forEach(([c, px], i) => { g.beginPath(); g.arc(px, 0, 6.5 + (p.press && i === 0 ? 1.5 : 0), 0, TAU); g.fillStyle = p.press > 0 && i === 0 ? '#fff' : c; g.fill(); });
      g.beginPath(); g.arc(84, 0, 7, 0, TAU); g.fillStyle = A.hex(C.yellow, .6 + .4 * p.press); g.fill(); glove(19);
    } else if (kind === 'mic') {
      rr(g, -4, -8, 58, 16, 8); g.fillStyle = '#c9d0ee'; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); gloss(g, 66, 0, 21, C.pink, 5);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(66, 0, 8, 0, TAU); g.fill(); glove(19);
    } else if (kind === 'mega') {
      g.beginPath(); g.moveTo(6, -11); g.lineTo(88, -40); g.lineTo(88, 40); g.lineTo(6, 11); g.closePath(); g.fillStyle = A.linear(g, 0, -40, 0, 40, [[0, '#ff5a6a'], [1, '#b3001b']]); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.ellipse(88, 0, 11, 40, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.stroke(); glove(19);
    } else if (kind === 'point') { finger(0, 42, 14); glove(20); }
    else if (kind === 'thumb') { glove(21); g.save(); g.rotate(-a + (spec.tilt ?? -.1)); rr(g, -7, -42, 14, 34, 7); g.fillStyle = '#f3f6ff'; g.fill(); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); g.restore(); }
    else if (kind === 'wave' || kind === 'palm') { const sp = kind === 'wave' ? .3 : .17; glove(21); [-1.5, -.5, .5, 1.5].forEach(k => finger(k * sp, 27 - Math.abs(k) * 2.5, 11)); }
    else if (kind === 'fist') { glove(21); g.strokeStyle = 'rgba(80,100,200,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, -12); g.lineTo(6, 12); g.stroke(); }
    else if (kind !== 'none') glove(20);
    g.restore();
  }
  function arm(g, side, spec, t, p) {
    const Sx = side * 92, Sy = 14, len = 68 * (spec.L ?? 1), a = spec.a + (spec.spin ? sin(t * spec.spin) * (spec.amp ?? .3) : 0), dx = cos(a), dy = sin(a);
    const Hx = Sx + dx * len, Hy = Sy + dy * len, bend = (spec.bend ?? 0) * len * .5, cx = (Sx + Hx) / 2 - dy * bend, cy = (Sy + Hy) / 2 + dx * bend;
    g.lineCap = 'round'; g.beginPath(); g.moveTo(Sx, Sy); g.quadraticCurveTo(cx, cy, Hx, Hy); g.strokeStyle = INK; g.lineWidth = 27; g.stroke();
    g.strokeStyle = A.mixc('#4a7dff', '#7a4dff', .35); g.lineWidth = 17; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(Sx, Sy - 4); g.quadraticCurveTo(cx, cy - 4, Hx, Hy - 4); g.stroke();
    hand(g, Hx, Hy, a, spec, t, p);
  }

  // ------------------------------------------------------------------ face
  const SCR = '#0e1d6a';
  function eye(g, cx, cy, side, p, t, bl) {
    const type = p.eyes === 'wink' ? ((p.wink === 'L' ? -1 : 1) === side ? 'happy' : 'open') : p.eyes;
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (type === 'happy') { g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.arc(cx, cy + 14, 21, PI * 1.13, PI * 1.87); g.stroke(); return; }
    if (type === 'closed') { g.strokeStyle = '#fff'; g.lineWidth = 11; g.beginPath(); g.arc(cx, cy - 8, 21, PI * .13, PI * .87); g.stroke(); return; }
    const wide = type === 'wide' || type === 'star', rx = wide ? 27 : 24, ry = (wide ? 36 : 30) * (1 - .93 * clamp(bl));
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fillStyle = A.linear(g, 0, cy - ry, 0, cy + ry, [[0, '#ffffff'], [1, '#cfe6ff']]); g.fill();
    g.clip();
    if (type === 'star') {
      g.save(); g.translate(cx + p.look[0] * 4, cy + p.look[1] * 4); g.rotate(t * 1.4); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, an = i / 10 * TAU - PI / 2; g.lineTo(cos(an) * r, sin(an) * r); } g.closePath(); g.fillStyle = A.linear(g, 0, -22, 0, 22, [[0, '#ffd23f'], [1, '#ff2e93']]); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.restore();
    } else {
      const ix = cx + p.look[0] * (rx - 14), iy = cy + p.look[1] * (ry - 12) * .8, pr = type === 'wide' ? .7 : 1;
      g.beginPath(); g.ellipse(ix, iy, 15 * pr, 19 * pr, 0, 0, TAU); g.fillStyle = A.radial(g, ix, iy + 4, 2, 22, [[0, '#1a3fd0'], [.7, '#19a8ff'], [1, '#7fe3ff']]); g.fill();
      g.beginPath(); g.ellipse(ix, iy, 8 * pr, 10.5 * pr, 0, 0, TAU); g.fillStyle = '#060b33'; g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - 5.5, iy - 8, 5.6 * pr + .6, 0, TAU); g.fill(); g.beginPath(); g.arc(ix + 6, iy + 6, 2.6, 0, TAU); g.fill();
    }
    // eyelid (lid slant: +1 sad, -1 angry) + lidY coverage
    const cov = p.lidY, sl = p.lid;
    if (cov > 0 || sl) { const yIn = cy - ry + ry * 2 * clamp(cov - sl * .3), yOut = cy - ry + ry * 2 * clamp(cov + sl * .3), xin = cx - side * (rx + 4), xout = cx + side * (rx + 4);
      g.beginPath(); g.moveTo(xin, cy - ry - 8); g.lineTo(xout, cy - ry - 8); g.lineTo(xout, yOut); g.lineTo(xin, yIn); g.closePath(); g.fillStyle = '#2b5ee8'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(xin, yIn); g.lineTo(xout, yOut); g.stroke(); }
    g.restore();
  }
  function brows(g, p) {
    const by = -56 - p.brow * 9; g.strokeStyle = 'rgba(235,245,255,.95)'; g.lineWidth = 8; g.lineCap = 'round';
    [-1, 1].forEach(s => { const cx = s * 38, inn = by - p.lid * 9, out = by + p.lid * 9; g.beginPath(); g.moveTo(cx - s * 19, inn); g.quadraticCurveTo(cx, Math.min(inn, out) - 3, cx + s * 19, out); g.stroke(); });
  }
  function mouth(g, p, t, talk) {
    let m = p.mouth || { open: talk, smile: .7, shape: 'd' }; const o = clamp(m.open + (m.wob ? sin(t * 26) * m.wob : 0)), sm = m.smile ?? .6, cy = 36, w = 22 + (m.wide ?? 1) * 14;
    g.save(); g.translate(0, cy); g.lineJoin = 'round'; g.lineCap = 'round';
    if (m.shape === 'o') { g.beginPath(); g.ellipse(0, 4, 13 + o * 8, 10 + o * 22, 0, 0, TAU); g.fillStyle = '#1a0836'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = C.pink; g.beginPath(); g.ellipse(0, 4 + o * 14, 8 + o * 3, 5 + o * 6, 0, 0, TAU); g.fill(); }
    else if (o < .06) { g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); const cy2 = -sm * 9; g.moveTo(-w * .8, cy2); g.quadraticCurveTo(0, cy2 + 8 + sm * 18, w * .8, cy2); g.stroke(); }
    else {
      const cyc = -sm * 6, d = 6 + o * 32, tp = m.shape === 'flat' ? 0 : 5;
      const path = () => { g.beginPath(); g.moveTo(-w, cyc); g.quadraticCurveTo(0, cyc + tp + (sm < 0 ? -12 : 0), w, cyc); g.quadraticCurveTo(w * .9, cyc + d * 1.25, 0, cyc + d * 1.25); g.quadraticCurveTo(-w * .9, cyc + d * 1.25, -w, cyc); g.closePath(); };
      path(); g.fillStyle = '#1a0836'; g.fill(); g.save(); path(); g.clip(); g.fillStyle = A.linear(g, 0, cyc + d * .5, 0, cyc + d * 1.25, [[0, '#ff5aa5'], [1, '#c2185b']]); g.beginPath(); g.ellipse(0, cyc + d * 1.15, w * .62, d * .5, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.fillRect(-w * .8, cyc - 4, w * 1.6, 8 + Math.min(9, d * .25)); g.restore(); path(); g.lineWidth = 5.5; g.strokeStyle = '#fff'; g.stroke();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ the character
  function connie(g, x, y, size, pose, t) {
    const p = { ...DEF, ...pose }, s = size / 310, bl = p.blink != null ? p.blink : A.blink(t, 3), pv = p.legs ? 128 : 78, amb = t * 2.6;
    if (!p.look) p.look = [0, 0];
    g.save(); g.translate(x, y); g.scale(s, s);
    if (p.glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = A.radial(g, 0, 10, 40, 300, [[0, A.hex('#3f7dff', .42 * p.glow)], [.55, A.hex('#8b3dff', .16 * p.glow)], [1, 'rgba(0,0,0,0)']]); g.fillRect(-320, -300, 640, 640); g.restore(); }
    if (p.shadow > 0) { g.fillStyle = `rgba(2,4,30,${.4 * p.shadow})`; g.beginPath(); g.ellipse(0, pv + 6, 92 * p.shadow ** .3, 14, 0, 0, TAU); g.fill(); }
    g.rotate(p.rot); g.translate(0, pv); g.transform(1, 0, p.skew, 1, 0, 0); g.scale(p.sx * (1 + .01 * sin(t * 3.1)), p.sy * (1 + .014 * sin(t * 3.1 + 1))); g.translate(0, -pv);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // legs
    if (p.legs) [-1, 1].forEach((sd, i) => {
      const lift = Math.max(0, sin(p.walk + i * PI)) * 16 * (p.walk ? 1 : 0), fy = 122 - p.air * 22 - lift, fx = sd * (38 + p.air * 12);
      g.strokeStyle = INK; g.lineWidth = 30; capsule(g, sd * 36, 70, fx, fy - 6, 30); g.strokeStyle = '#3552d8'; capsule(g, sd * 36, 70, fx, fy - 6, 20);
      g.beginPath(); g.ellipse(fx + sd * 5, fy + 2, 27, 15, 0, 0, TAU); g.fillStyle = A.linear(g, 0, fy - 12, 0, fy + 16, [[0, '#fff'], [1, '#c9d3ff']]); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.ellipse(fx + sd * 17, fy + 3, 11, 10, 0, -1.4, 1.4); g.fillStyle = C.pink; g.fill();
    });
    // candy paint splash behind the bezel (logo splash), jelly wobble
    [[-108, 52, 17, C.pink, .6], [112, 60, 16, C.orange, 1.4], [-92, 86, 12, C.cyan, 2.3], [96, 92, 13, C.lime, 3.1], [-118, 10, 10, C.yellow, 4.2], [120, -14, 9, C.purple, 5.2]].forEach(([bx, by, r, col, ph]) => { const k = 1 + .1 * sin(t * 2.4 + ph); g.beginPath(); g.ellipse(bx, by, r * k, r * .8 / k, ph, 0, TAU); g.fillStyle = col; g.fill(); g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(bx - r * .3, by - r * .3, r * .28, r * .14, -.6, 0, TAU); g.fill(); });
    // antennas
    const sw = sin(amb) * .5 + p.ant, up = p.antUp;
    [[-1, -30, 0], [1, 26, 1.7]].forEach(([sd, bx, ph], i) => {
      const tx = bx + sd * (34 - up * 6) + (sw + sin(amb * 1.2 + ph) * .3) * 14, ty = -76 - (62 + up * 24), mx = bx + sd * 6 + sw * 6 + sin(amb + ph) * 4, my = -76 - 30;
      g.beginPath(); g.moveTo(bx, -70); g.quadraticCurveTo(mx, my, tx, ty); g.strokeStyle = INK; g.lineWidth = 15; g.stroke(); g.strokeStyle = '#9b8cff'; g.lineWidth = 8; g.stroke();
      gloss(g, tx, ty, 15 + up * 2, i ? '#ff6fb8' : C.pink, 4.5);
    });
    // back arms
    const aL = p.armL || mirror(REST_R), aR = p.armR || REST_R;
    if (!aL.front) arm(g, -1, aL, t, p); if (!aR.front) arm(g, 1, aR, t, p);
    // body
    const bw = 200, bh = 156, br = 50;
    rr(g, -bw / 2, -bh / 2, bw, bh, br); g.strokeStyle = INK; g.lineWidth = 17; g.stroke();
    g.fillStyle = A.linear(g, -bw / 2, -bh / 2, bw / 2, bh / 2, [[0, '#5ab4ff'], [.5, C.blue], [1, '#4a1fb8']]); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5.5; g.stroke();
    g.save(); rr(g, -bw / 2, -bh / 2, bw, bh, br); g.clip(); g.fillStyle = A.linear(g, 0, bh / 2 - 34, 0, bh / 2, [[0, 'rgba(25,200,255,0)'], [1, 'rgba(25,200,255,.5)']]); g.fillRect(-bw / 2, bh / 2 - 34, bw, 34); g.restore();
    // screen
    const sw2 = 170, sh2 = 126; rr(g, -sw2 / 2, -sh2 / 2 - 2, sw2, sh2, 36); g.fillStyle = A.radial(g, 0, 0, 10, 110, [[0, '#1d3fb5'], [1, SCR]]); g.fill(); g.strokeStyle = 'rgba(5,8,38,.85)'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(160,215,255,.55)'; g.lineWidth = 2.5; rr(g, -sw2 / 2 + 4, -sh2 / 2 + 2, sw2 - 8, sh2 - 8, 32); g.stroke();
    g.save(); rr(g, -sw2 / 2, -sh2 / 2 - 2, sw2, sh2, 36); g.clip(); g.translate(0, -2);
    // face
    const look = p.look; eye(g, -38, -12, -1, p, t, bl); eye(g, 38, -12, 1, p, t, bl); brows(g, p);
    if (p.blush) { g.fillStyle = 'rgba(255,90,160,.5)'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 66, 22, 15, 8, 0, 0, TAU); g.fill(); }); }
    mouth(g, p, t, TALK);
    if (p.tear > 0) [-1, 1].forEach(sd => { for (let i = 0; i < 6; i++) { const ph = (t * 1.7 + i / 6 + (sd > 0 ? .3 : 0)) % 1, ty = -12 + 26 + ph * 72, tx = sd * (38 + ph * 14), r = 7 * (1 - ph * .5) * p.tear; if (r < .5) continue; g.fillStyle = `rgba(170,230,255,${1 - ph * .6})`; g.beginPath(); g.moveTo(tx, ty - r * 1.8); g.quadraticCurveTo(tx + r, ty, tx, ty + r); g.quadraticCurveTo(tx - r, ty, tx, ty - r * 1.8); g.fill(); } g.strokeStyle = 'rgba(170,230,255,.4)'; g.lineWidth = 6; g.beginPath(); g.moveTo(sd * 38, 14); g.quadraticCurveTo(sd * 46, 40, sd * 50, 62); g.stroke(); });
    // screen glare
    g.fillStyle = A.linear(g, -sw2 / 2, -sh2 / 2, sw2 / 2, sh2 / 2, [[0, 'rgba(255,255,255,.26)'], [.34, 'rgba(255,255,255,.05)'], [.35, 'rgba(255,255,255,0)']]); g.fillRect(-sw2 / 2, -sh2 / 2 - 4, sw2, sh2 + 6);
    g.restore();
    // body gloss
    g.save(); rr(g, -bw / 2, -bh / 2, bw, bh, br); g.clip(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-52, -bh / 2 + 7, 44, 6, -.1, 0, TAU); g.fill(); g.restore();
    if (p.sweat > 0) { const sy2 = -52 + sin(t * 4) * 3 + (1 - p.sweat) * 14; g.fillStyle = '#bfeaff'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(96, sy2 - 16); g.quadraticCurveTo(114, sy2 + 8, 96, sy2 + 12); g.quadraticCurveTo(78, sy2 + 8, 96, sy2 - 16); g.fill(); g.stroke(); }
    if (p.hat === 'beret') { g.save(); g.translate(-6, -84); g.rotate(-.16); g.beginPath(); g.ellipse(0, 0, 66, 21, 0, 0, TAU); g.fillStyle = A.linear(g, 0, -20, 0, 20, [[0, '#ff4d6d'], [1, '#a1123a']]); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.ellipse(-2, -20, 8, 6, 0, 0, TAU); g.fillStyle = '#a1123a'; g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-22, -6, 18, 5, -.2, 0, TAU); g.fill(); g.restore(); }
    // front arms
    if (aL.front) arm(g, -1, aL, t, p); if (aR.front) arm(g, 1, aR, t, p);
    if (p.sparks > 0) for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + t * 1.2, r = 150 + 16 * sin(t * 3 + i * 2), k = .5 + .5 * sin(t * 5 + i * 1.7); CL.spark(g, cos(an) * r, -20 + sin(an) * r * .85, (10 + 10 * (i % 2)) * k * p.sparks, t + i, ['#fff', C.yellow, C.cyan, C.pink, C.lime][i]); }
    g.restore();
  }
  window.CONNIE = { draw: (ctx, x, y, size, pose = {}, t = 0) => connie(ctx, x, y, size, pose, t), DEF, mirror, REST_R };

  // ------------------------------------------------------------------ motion helpers
  const q = d => d < 0 ? 0 : Math.exp(-d * 6.5) * cos(d * 22);                 // damped jelly factor after an impact
  const bounceH = (tt, t0, dur, h) => { const u = (tt - t0) / dur; return u > 0 && u < 1 ? h * 4 * u * (1 - u) : 0; };   // hop height (px, up)
  function hops(tt, t0, dur, h, n) { let up = 0, sqz = 0; for (let i = 0; i < n; i++) { up += bounceH(tt, t0 + i * dur, dur, h); sqz += q(tt - (t0 + (i + 1) * dur)) * (i < n - 1 || tt > t0 + n * dur ? 1 : 0); if (tt > t0 + i * dur && tt < t0 + (i + 1) * dur) { sqz -= .35 * sin(PI * (tt - t0 - i * dur) / dur); } } return { up, sqz }; }
  const aim = (x, y, side, tx, ty) => Math.atan2(ty - (y + 14 * .7), tx - (x + side * 92 * .7));
  const lookAt = (x, y, tx, ty) => [clamp((tx - x) / 420, -1, 1), clamp((ty - y) / 300, -1, 1)];
  const TAUX = TAU;
  // candy confetti burst in screen space
  function confetti(g, cx, cy, u, n = 34, spread = 520) {
    if (u <= 0 || u > 1.6) return; g.save();
    for (let i = 0; i < n; i++) { const an = -PI / 2 + (hash(i * 3.1) - .5) * 2.6, v = spread * (.45 + hash(i * 7.7) * .75), x = cx + cos(an) * v * u * .6, y = cy + sin(an) * v * u * .9 + 620 * u * u * .5, al = clamp(1.6 - u) * clamp(u * 10);
      g.globalAlpha = al; g.save(); g.translate(x, y); g.rotate(u * (4 + hash(i) * 8) + i); g.fillStyle = CL.CAND[i % 8]; g.fillRect(-9, -5, 18, 10); g.restore(); }
    g.restore();
  }

  // ------------------------------------------------------------------ APPEARANCES. t0 = word start (voice clock); everything else in output seconds relative to the word.
  // from/home/to = body centre; inDur = flight time (lands ON t0); stay = seconds after t0 before leaving; out = exit time.
  const CX = 960, CY = 520;
  const LH = [190, 700], RH = [1730, 700];   // resting spots in the margins
  const APPS = [
    { id: 'peek', t0: .12, inDur: .3, stay: 1.5, out: .3, size: 360, from: [-220, 760], home: [75, 690], to: [-260, 760],   // CUE 0.12 peek-in ; CUE 0.74 gasp
      pose(tt, x, y) { const g = tt > .62 ? 1 : 0, d = tt - .62, k = clamp(d / .1), hp = bounceH(tt, .6, .34, 70);
        if (!g) return { rot: .3, look: [1, -.15], brow: .3, glow: .5, legs: false, mouth: { open: .05, smile: .6 }, eyes: 'open', armL: null, armR: { a: 3.2, L: .55, hand: 'open', bend: .3 } };
        return { rot: lerp(.3, -.06, ease.outBack(k)), dx: 120 * ease.outBack(k), dy: -hp, sy: 1 + .12 * sin(PI * clamp(d / .3)) - .18 * q(d - .34), sx: 1 - .06 * sin(PI * clamp(d / .3)) + .12 * q(d - .34), legs: true, air: hp > 1 ? 1 : 0, look: [1, -.2], eyes: 'wide', brow: 1, lidY: 0, antUp: 1, mouth: { open: .9, shape: 'o', smile: 0 }, sweat: clamp(d * 3), armL: { a: PI + 1.4, L: .85, hand: 'open', front: true, bend: .2 }, armR: { a: -1.4, L: .85, hand: 'open', front: true, bend: -.2 } }; } },
    { id: 'wow', t0: 2.33, inDur: .3, stay: .95, out: .28, size: 400, from: [2160, 800], home: [1735, 690], to: [2160, 700],   // CUE 2.33 wow
      pose(tt) { const h = hops(tt, .18, .3, 60, 2); return { dy: -h.up, sy: 1 - .2 * h.sqz, sx: 1 + .14 * h.sqz, air: h.up > 2 ? 1 : 0, eyes: 'star', mouth: { open: .9, smile: 1 }, sparks: clamp(tt * 3), armL: { a: PI + 1.15 + sin(tt * 12) * .1, L: 1, hand: 'fist', bend: .3 }, armR: { a: -1.15 + sin(tt * 12 + 1) * .1, L: 1, hand: 'fist', bend: -.3 }, glow: .8 }; } },
    { id: 'netflix', t0: 4.34, inDur: .34, stay: 1.05, out: .28, size: 420, from: [-260, 850], home: [200, 690], to: [-260, 760],   // CUE 4.34 cheer
      pose(tt) { const h = hops(tt, .12, .38, 90, 2); return { dy: -h.up, sy: 1 - .22 * h.sqz, sx: 1 + .16 * h.sqz, air: h.up > 2 ? 1 : 0, eyes: 'happy', mouth: { open: .85, smile: 1 }, armL: { a: PI + 1.05 + sin(tt * 14) * .25, L: 1.05, hand: 'fist', bend: .3 }, armR: { a: -1.05 + sin(tt * 14 + 2) * .25, L: 1.05, hand: 'fist', bend: -.3 }, glow: .8, shadow: h.up < 2 ? 1 : .5 }; },
      fx(g, x, y, tt) { confetti(g, x, y - 120, tt - .1, 30); } },
    { id: 'disney', t0: 5.99, inDur: .3, stay: .85, out: .26, size: 400, from: [2160, 800], home: [1725, 690], to: [2160, 760],   // CUE 5.99 point
      pose(tt, x, y) { const pt = ease.outBack(clamp((tt - .05) / .28)); return { look: lookAt(x, y, CX, 380), eyes: 'open', mouth: { open: .5 + .3 * sin(tt * 14), smile: 1 }, brow: .4, armL: { a: lerp(2.6, aim(x, y, -1, 1300, 330), pt) + sin(tt * 9) * .03, L: lerp(.9, 1.25, pt), hand: 'point', bend: .12 }, armR: { a: 1.25, L: .9, hand: 'fist', bend: -.3 }, dy: -bounceH(tt, .0, .3, 24), shadow: 1, rot: -.05 * pt }; } },
    { id: 'charlton', t0: 8.32, inDur: .3, stay: 1.75, out: .28, size: 370, from: [-260, 800], home: [205, 650], to: [-260, 760],   // CUE 8.32 excited ; hold cin: director with megaphone (beret)
      pose(tt, x, y) { const hold = tt > .53, sh = hold ? 0 : sin(tt * 55) * .03 * clamp(tt * 4) * (tt > 0 ? 1 : 0);
        if (!hold) return { rot: sh, dx: sh * 120, eyes: 'wide', mouth: { open: .8, smile: 1 }, sparks: 1, armL: { a: PI + 1.0 + sin(tt * 40) * .1, L: .8, hand: 'fist', bend: .3, front: true }, armR: { a: -1.0 + sin(tt * 40) * .1, L: .8, hand: 'fist', bend: -.3, front: true }, glow: .9 };
        const hh = tt - .53, mg = clamp(hh / .3); return { hat: 'beret', eyes: 'open', brow: .4, look: [1, -.1], mouth: { open: .55 + .35 * sin(hh * 9), smile: .5 }, glow: .7, rot: .05 * sin(hh * 2), armR: { a: lerp(1.2, -.5, ease.outBack(mg)), L: 1.1, hand: 'mega', bend: -.2, front: true }, armL: { a: PI - .8, L: .85, hand: 'fist', bend: .3 }, dy: -4 * sin(hh * 3) }; } },
    { id: 'turk', t0: 9.27, inDur: .3, stay: 1.6, out: .2, size: 340, from: [2160, 800], home: [1800, 690], to: [2160, 760],   // CUE 9.27 gasp then sob in the hold
      pose(tt) { const hold = tt > .71, d = tt - .71;
        if (!hold) return { eyes: 'wide', brow: 1, mouth: { open: .9, shape: 'o', smile: 0 }, antUp: 1, armL: { a: PI + 1.45, L: .7, hand: 'open', front: true, bend: .2 }, armR: { a: -1.45, L: .7, hand: 'open', front: true, bend: -.2 }, look: [-1, .2], glow: .5 };
        const sob = sin(d * 16); return { eyes: 'open', lid: 1, lidY: .25, brow: -.3, look: [0, .6], tear: 1, mouth: { open: .5 + .2 * sin(d * 8), shape: 'd', smile: -.8, wob: .05 }, dy: sob * 5, sy: 1 - .03 * sob, rot: .04 * sin(d * 5), antUp: -.5, glow: .35, armL: { a: PI + 1.7, L: .6, hand: 'open', front: true, bend: .2 }, armR: { a: -1.7, L: .6, hand: 'open', front: true, bend: -.2 } }; } },
    { id: 'bolly', t0: 10.39, inDur: .3, stay: 1.72, out: .22, size: 370, from: [-260, 800], home: [205, 650], to: [-260, 760],   // CUE 10.39 dance (hold ind)
      pose(tt) { const ph = tt * TAU * 1.8, b = Math.abs(sin(ph)); return { dx: sin(ph) * 22, dy: -b * 34, rot: sin(ph) * .13, sy: 1 + .06 * cos(ph * 2), sx: 1 - .04 * cos(ph * 2), air: b > .3 ? 1 : 0, walk: tt * 10, eyes: 'happy', mouth: { open: .7, smile: 1 }, sparks: 1, glow: .95, armL: { a: PI + 1.05 + sin(ph) * .5, L: 1.1, hand: 'wave', bend: .3, spin: 0 }, armR: { a: .5 + cos(ph) * .3, L: .9, hand: 'fist', bend: -.3 }, skew: sin(ph) * .05 }; } },
    { id: 'israel', t0: 12.16, inDur: .3, stay: .95, out: .26, size: 390, from: [2160, 820], home: [1735, 700], to: [2160, 760],   // CUE 12.16 live mic
      pose(tt, x, y) { return { look: lookAt(x, y, CX, 460), eyes: 'open', mouth: null, armL: { a: PI + .5 + sin(tt * 5) * .05, L: 1.1, hand: 'mic', bend: .3, front: true }, armR: { a: 1.2, L: .9, hand: 'open', bend: -.3 }, dy: -bounceH(tt, .0, .3, 26), shadow: 1, rot: -.04 }; } },
    { id: 'vortex', t0: 13.82, pre: .42, inDur: .3, stay: .12, out: .55, size: 380, from: [-260, 780], home: [240, 700], to: [960, 470],   // CUE 13.82 connie sucked into the vortex TV
      pose(tt, x, y) { const e = clamp((tt - .12) / .55), sp = ease.in(e); return { eyes: 'wide', mouth: { open: .8, shape: 'o', smile: 0 }, look: [1, -.4], rot: tt > .12 ? sp * 9 : .12, sx: 1 - .6 * sp, sy: 1 + .3 * sp, antUp: 1, ant: -1, legs: true, air: 1, armL: { a: PI + .3, L: 1, hand: 'open', bend: .2 }, armR: { a: -.3, L: 1, hand: 'open', bend: -.2 }, alpha: 1 - clamp((tt - .45) / .2) }; },
      spiral: true },
    { id: 'thumb', t0: 14.87, inDur: .3, stay: .42, out: .26, size: 400, from: [-260, 820], home: [150, 690], to: [-260, 760],   // CUE 14.87 thumbs up
      pose(tt, x, y) { const w = tt > .4 ? 1 : 0; return { eyes: w ? 'wink' : 'open', wink: 'R', look: lookAt(x, y, CX, 500), mouth: { open: .55, smile: 1 }, armR: { a: -1.15 + clamp(tt * 5) * .4, L: 1.1, hand: 'thumb', tilt: -.1, bend: -.35, front: true }, armL: { a: PI - 1.25, L: .9, hand: 'fist', bend: .3 }, dy: -bounceH(tt, .0, .3, 40), rot: .05, shadow: 1, sparks: clamp((tt - .25) * 3) }; } },
    { id: 'update', t0: 15.86, inDur: .3, stay: 1.15, out: .26, size: 360, from: [-260, 830], home: [205, 705], to: [-260, 760],   // CUE 15.86 spin ; bounces on 16.33 16.75
      pose(tt) { const sp = ease.inOut(clamp((tt - .02) / .55)); const h = hops(tt, .0, .3, 80, 1), h2 = bounceH(tt, .47, .28, 46), h3 = bounceH(tt, .89, .28, 46); return { rot: sp * TAU, dy: -(h.up + h2 + h3), air: 1, eyes: 'happy', mouth: { open: .8, smile: 1 }, armL: { a: PI + .9 + sin(tt * 9) * .2, L: 1, hand: 'open', bend: .3 }, armR: { a: -.9 - sin(tt * 9) * .2, L: 1, hand: 'open', bend: -.3 }, glow: .8, sparks: 1 }; } },
    { id: 'goal', t0: 18.34, inDur: .3, stay: .8, out: .22, size: 440, from: [2160, 820], home: [1730, 680], to: [2160, 760],   // CUE 18.34 goal cheer
      pose(tt) { const h = hops(tt, .08, .36, 110, 2); return { dy: -h.up, sy: 1 - .22 * h.sqz, sx: 1 + .16 * h.sqz, air: h.up > 2 ? 1 : 0, eyes: 'happy', mouth: { open: 1, smile: 1 }, armL: { a: PI + 1.1 + sin(tt * 16) * .3, L: 1.1, hand: 'fist', bend: .3 }, armR: { a: -1.1 + sin(tt * 16 + 2) * .3, L: 1.1, hand: 'fist', bend: -.3 }, glow: .9, shadow: h.up < 2 ? 1 : .4 }; },
      fx(g, x, y, tt) { confetti(g, x, y - 140, tt - .12, 40, 620); } },
    { id: 'waiting', t0: 19.52, inDur: .25, stay: .95, out: .26, size: 350, from: [-260, 850], home: [190, 715], to: [-260, 780],   // CUE 19.52 impatient wait
      pose(tt, x, y) { const tap = Math.max(0, sin(tt * 14)); return { eyes: 'open', lidY: .3, brow: -.2, look: [1, -.5 + .3 * sin(tt * 3)], mouth: { open: 0, smile: -.1 }, armL: { a: .2, L: .8, hand: 'fist', bend: .5, front: true }, armR: { a: PI - .2, L: .8, hand: 'fist', bend: -.5, front: true }, walk: tt * 14, rot: .02 * sin(tt * 3), dy: -tap * 5, sweat: clamp(tt * 2) }; } },
    { id: 'discover', t0: 21.55, inDur: .3, stay: 1.1, out: .26, size: 380, from: [2160, 820], home: [1720, 700], to: [2160, 760],   // CUE 21.55 discover clap
      pose(tt, x, y) { const c = .5 + .5 * sin(tt * 20), h = hops(tt, .1, .3, 50, 2); return { dy: -h.up, sy: 1 - .16 * h.sqz, sx: 1 + .12 * h.sqz, air: h.up > 2 ? 1 : 0, eyes: 'star', mouth: { open: .8, smile: 1 }, sparks: 1, glow: .85, armL: { a: PI - .35 - c * .35, L: .75, hand: 'open', bend: .2, front: true }, armR: { a: .35 + c * .35, L: .75, hand: 'open', bend: -.2, front: true } }; } },
    { id: 'nosearch', t0: 23.18, inDur: .3, stay: 1.15, out: .26, size: 400, from: [-260, 830], home: [210, 690], to: [-260, 760],   // CUE 23.18 head shake no
      pose(tt, x, y) { const sh = sin(tt * 26) * .17 * Math.exp(-Math.max(0, tt - .05) * 1.1) * clamp((tt + .05) * 8); return { rot: sh, dx: sh * 60, eyes: 'closed', lid: -1, brow: -.6, mouth: { open: .25, smile: -.3, shape: 'flat' }, armR: { a: -.15 + sin(tt * 26) * .1, L: 1, hand: 'palm', bend: -.3, front: true }, armL: { a: PI - 1.1, L: .9, hand: 'fist', bend: .3 }, shadow: 1, sweat: clamp((tt - .3) * 2) }; } },
    { id: 'remote', t0: 26.05, inDur: .32, stay: 1.05, out: .26, size: 420, from: [2160, 850], home: [1725, 690], to: [2160, 760],   // CUE 26.05 remote press
      pose(tt, x, y) { const pr = tt > .0 && tt < .2 ? 1 - tt / .2 : 0, h = bounceH(tt, .95, .3, 40); return { look: lookAt(x, y, CX, 380), eyes: 'open', mouth: { open: .5, smile: 1 }, brow: .3, press: pr, dy: -h, sy: 1 - .1 * q(tt), sx: 1 + .07 * q(tt), armL: { a: aim(x, y, -1, 1250, 350) - .02 + .1 * pr, L: 1.0, hand: 'remote', bend: .15, front: true }, armR: { a: 1.25, L: .9, hand: 'fist', bend: -.3 }, shadow: 1, sparks: pr }; },
      fx(g, x, y, tt) { if (tt > 0 && tt < .55) { const u = tt / .55; CL.ring(g, x - 190, y - 60, 120, u, '#fff', 12); CL.ring(g, x - 190, y - 60, 180, clamp(u * 1.2 - .1), C.yellow, 8); } } },
    { id: 'finale', t0: 27.6, inDur: .3, stay: 99, out: .3, size: 340, from: [-200, 1010], home: [175, 885], to: [-200, 1010],   // CUE 27.6 finale wave (end card, bottom-left corner)
      pose(tt, x, y) { const w = tt > 1.6 ? 1 : 0; return { look: lookAt(x, y, CX, 470), eyes: tt > 1.9 && tt < 2.6 ? 'wink' : 'open', wink: 'R', mouth: { open: .35 + .15 * sin(tt * 4), smile: 1 }, armR: { a: -1.1 + sin(tt * 10) * .35, L: 1.1, hand: 'wave', bend: -.2 }, armL: { a: PI - 1.1, L: .9, hand: 'fist', bend: .3 }, dy: -bounceH(tt, .0, .4, 40) - Math.max(0, sin(tt * 3.1)) * 6, shadow: 1, glow: .7, sparks: .6 }; } },
  ];
  // convert to output-clock windows
  APPS.forEach(a => { a.T0 = TLF.TofV(a.t0); a.pre = a.pre || a.inDur; a.ts = a.T0 - a.pre; a.te = a.T0 + a.stay + a.out; });

  // position of an appearance at output time T (base track, before jelly extras)
  function track(a, T) {
    const tt = T - a.T0, ei = clamp((tt + a.pre) / a.pre), eo = clamp((tt - a.stay) / a.out), ent = ease.outBack(ei), ex = a.spiral ? eo * eo * (3 - 2 * eo) : ease.inBack(eo);
    let x = lerp(a.from[0], a.home[0], ent), y = lerp(a.from[1], a.home[1], ent) - (a.spiral ? 0 : 45 * sin(PI * ei));
    if (a.spiral && eo > 0) { const r = (1 - ex), an = ex * 5; x = lerp(a.home[0], a.to[0], ex) + sin(an) * 120 * r; y = lerp(a.home[1], a.to[1], ex) - (1 - cos(an)) * 60 * r; }
    else if (eo > 0) { x = lerp(a.home[0], a.to[0], ex); y = lerp(a.home[1], a.to[1], ex); }
    return [x, y, ei, eo];
  }
  // the compositor pushes the camera in during the genre holds (zoom about a focus point). Connie is camera-locked: we undo that zoom so she keeps her screen position and size.
  const PRE = { cin: 8.32, tur: 9.27, ind: 10.39 };
  function cam(T, t) {
    const hd = TLF.holdAt(T); let k = 0, key = null;
    if (hd) { key = hd.k; k = ease.inOut(clamp((hd.d - hd.age) / .3)); }
    else for (const h of TLF.HOLDS) { const p = PRE[h.k]; if (t >= p && t < h.v) { key = h.k; k = ease.inOut(clamp((t - p) / Math.max(.2, h.v - p))); } }
    if (!key || k <= 0 || !CL.HOLDFOC[key]) return null; const [fx, fy, zm] = CL.HOLDFOC[key]; return { z: lerp(1, zm, k), fx: lerp(W / 2, fx, k), fy: lerp(H / 2, fy, k) };
  }
  window.HOST = {
    APPS, track,
    async prepare(t) { },
    overlay(ctx, t) {
      const T = (typeof A.T === 'number') ? A.T : t; TALK = talkEnv(t); const cm = cam(T, t);
      for (const a of APPS) {
        if (T < a.ts || T > a.te) continue;
        const tt = T - a.T0, [x0, y0, ei, eo] = track(a, T), [xp, yp] = track(a, T - .04), vx = (x0 - xp) / .04, vy = (y0 - yp) / .04;
        let x = x0, y = y0;
        let ps = a.pose(tt, x, y) || {}; const dx = ps.dx || 0, dy = ps.dy || 0, al = ps.alpha ?? 1;
        // flight stretch / landing jelly / exit stretch
        const fl = (ei < 1 ? Math.sin(PI * ei) : 0) + eo * .8, lq = q(tt) * (tt > 0 && tt < 1.2 ? 1 : 0);
        const sx = (ps.sx ?? 1) * (1 - .1 * fl + .16 * lq), sy = (ps.sy ?? 1) * (1 + .16 * fl - .22 * lq);
        const look = ps.look || lookAt(x, y, CX, 500), idle = [A.noise1(T * .9 + a.T0) * .18, A.noise1(T * .7 + 7 + a.T0) * .12];
        const pose = { ...ps, sx, sy, rot: (ps.rot || 0) + clamp(vx / 9000, -.14, .14) + clamp(vy / 24000, -.05, .05), skew: (ps.skew || 0) - clamp(vx / 14000, -.14, .14), ant: (ps.ant || 0) - clamp(vx / 2400, -1, 1), look: [clamp(look[0] + idle[0], -1, 1), clamp(look[1] + idle[1], -1, 1)] };
        ctx.save(); ctx.globalAlpha *= al; if (cm) { ctx.translate(cm.fx - W / 2 / cm.z, cm.fy - H / 2 / cm.z); ctx.scale(1 / cm.z, 1 / cm.z); }
        connie(ctx, x + dx, y + dy, a.size * (ps.scale || 1), pose, T + a.T0);
        if (a.fx) a.fx(ctx, x + dx, y + dy, tt);
        ctx.restore();
      }
    },
  };
})();
