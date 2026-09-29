// GOTV anime cast: V.hero(ctx, who, x, y, s, o)  who = 'kai' | 'noa' | 'buffering' | 'zoom'
// Cel-shaded Canvas2D vector characters (ink outlines, two-tone shading, rim light, glossy eyes). Deterministic in o.t.
//  o = {t, t0 (pop-in), tOut, pose, face, view:'front'|'three'|'side', look:{x,y}|'cam', flip, aura:0..1, mouth:0..1 | talk:true,
//       alpha, seed, bust:true (anchor = head centre, s=1 -> head ~500px tall), rot, shadow:false}
//  Full body: anchor (x,y) = feet centre, s=1 -> ~700 px tall (villain: orb 500px, anchor = orb bottom).
//  V.heroFaces / V.heroPoses list valid names.  V.heroInfo(who) -> {name, colors}
(() => {
  const { clamp, lerp, hash } = A, TAU = Math.PI * 2, PI = Math.PI;
  const INK = '#160e2c';
  const K = { iw: 1, det: 1 };                 // ink-width scale and detail level (set per draw)
  const iw = w => w * K.iw;
  const spring = u => u <= 0 ? 0 : 1 - Math.exp(-u * 9) * Math.cos(u * 16);
  const lgr = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rgr = (g, x, y, r0, r1, st) => { const q = g.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };

  // ---------------------------------------------------------------- path helpers
  function blobP(pts, close = true) {
    const n = pts.length, p = new Path2D(), P = i => pts[close ? (i + n) % n : clamp(i, 0, n - 1)];
    p.moveTo(P(0)[0], P(0)[1]);
    for (let i = 0; i < (close ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
    if (close) p.closePath(); return p;
  }
  function polyP(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; }
  // tapered lock: base (bx,by) -> tip (tx,ty), width w at base, bend = curvature (fraction of length)
  function lockP(bx, by, tx, ty, w, bend = .1, bulge = .5) {
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const mx = (bx + tx) / 2 + nx * bend * len, my = (by + ty) / 2 + ny * bend * len, p = new Path2D();
    p.moveTo(bx - nx * w / 2, by - ny * w / 2); p.quadraticCurveTo(mx - nx * w * bulge, my - ny * w * bulge, tx, ty);
    p.quadraticCurveTo(mx + nx * w * bulge, my + ny * w * bulge, bx + nx * w / 2, by + ny * w / 2); p.closePath(); return p;
  }
  // cel shading: base fill + shade crescent (light from top-left, sx/sy = shade offset) + ink
  function cel(g, p, base, shade, sx, sy, lw, rim, rimCol, rimW) {
    g.save(); g.fillStyle = base; g.fill(p);
    if (shade) { g.clip(p); g.fillStyle = shade; g.fillRect(-4000, -4000, 8000, 8000); g.translate(-sx, -sy); g.fillStyle = base; g.fill(p); }
    g.restore();
    if (rim) { g.save(); g.clip(p); const w = rimW || 14, l = Math.hypot(sx, sy) || 1; g.translate(-sx / l * w / 2, -sy / l * w / 2); g.lineWidth = w; g.strokeStyle = rimCol; g.stroke(p); g.restore(); }
    if (lw) { g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = iw(lw); g.strokeStyle = INK; g.stroke(p); }
  }
  // sphere projection of a horizontal coordinate (yaw>0: face turned to screen right)
  const px = (x, yaw, R = 190) => R * Math.sin(Math.asin(clamp(x / R, -1, 1)) + yaw);
  const psx = (x, yaw, R = 190) => { const th = Math.asin(clamp(x / R, -.98, .98)); return Math.max(.14, Math.cos(th + yaw) / Math.cos(th)); };
  const pxx = (x, yaw, R) => { const a = Math.abs(x); if (a <= R) return px(x, yaw, R); const s = Math.sign(x), e = a - R; return px(s * R, yaw, R) + s * e * Math.max(.4, Math.cos(yaw)); };

  // ---------------------------------------------------------------- character definitions
  const CH = {
    kai: {
      skin: '#FFDDC2', skinS: '#F2A98F', skinD: '#D67E6F', hair: '#35B0FF', hairS: '#1673E0', hairD: '#0E45A8', hairH: '#C8F3FF', brow: '#0E45A8',
      iris: ['#FFF0A0', '#FFA81C', '#E25400'], irisRim: '#7A2400', cheek: '#FF7E8C',
    },
    noa: {
      skin: '#FFE3D0', skinS: '#F4B0A0', skinD: '#D98A85', hair: '#5A34B8', hairS: '#33187E', hairD: '#1C0C4E', hairH: '#B9A0FF', brow: '#2A1470',
      iris: ['#B8FFF4', '#22D8C4', '#087E96'], irisRim: '#04424F', cheek: '#FF8AA0',
    },
  };
  const FACES = {
    neutral: { e: .95, tilt: 0, brY: 0, brT: 0, mouth: 'smile', open: 0, blush: .4, pupil: 1 },
    happy: { e: 1, tilt: -.05, brY: -8, brT: -.1, mouth: 'D', open: .5, blush: .7, pupil: 1.02 },
    wow: { e: 1.18, tilt: 0, brY: -36, brT: -.3, mouth: 'O', open: .8, blush: .25, pupil: .62, ek: 1.08 },
    shout: { e: .5, tilt: .75, brY: 12, brT: 1, mouth: 'D', open: 1.55, blush: .3, pupil: .9, vein: 1 },
    smug: { e: .6, tilt: .25, brY: -4, brT: .25, mouth: 'smirk', open: 0, blush: .3, pupil: 1 },
    sparkle: { e: 1.1, tilt: 0, brY: -22, brT: -.15, mouth: 'D', open: .75, blush: 1, pupil: 1.12, sparkle: 1 },
    worried: { e: .95, tilt: -.35, brY: -6, brT: -.9, mouth: 'wavy', open: 0, blush: .2, pupil: .85, sweat: 1 },
    angry: { e: .72, tilt: .8, brY: 8, brT: 1, mouth: 'grit', open: 0, blush: 0, pupil: .85, anger: 1 },
    joy: { e: 1, tilt: 0, brY: -14, brT: -.1, mouth: 'D', open: .95, blush: 1, arc: 1, pupil: 1 },
  };
  const FACE_NAMES = ['neutral', 'happy', 'wow', 'shout', 'smug', 'sparkle', 'worried', 'angry'];
  const POSE_NAMES = ['idle', 'wow', 'point', 'cheer', 'powerup', 'shout', 'run', 'shock', 'fist', 'guard'];
  const POSE_FACE = { idle: 'neutral', wow: 'wow', point: 'happy', cheer: 'joy', powerup: 'shout', shout: 'shout', run: 'happy', shock: 'wow', fist: 'happy', guard: 'angry' };
  const VIEW_YAW = { front: 0, three: .48, side: .98 };

  // ---------------------------------------------------------------- hair
  // lock: [bx,by,tx,ty,w,bend]; returns {back:[], front:[], side:[]}
  function hairDef(who) {
    const back = [], front = [], side = [];
    if (who === 'kai') {
      const c = [0, -40], r0 = 165;
      [[196, 330, 150, .12], [172, 420, 170, .08], [148, 500, 185, .05], [122, 470, 175, -.04], [98, 545, 170, -.08], [72, 480, 175, .06], [48, 470, 180, -.06], [22, 380, 165, -.1], [-4, 300, 140, -.12]]
        .forEach(([a, R, w, b], i) => { const ar = a * PI / 180, ta = (a + (a > 90 ? 9 : -9)) * PI / 180; back.push([c[0] + Math.cos(ar) * r0, c[1] - Math.sin(ar) * r0, c[0] + Math.cos(ta) * R, c[1] - Math.sin(ta) * R, w, b, i]); });
      front.push([-118, -196, -150, -8, 118, .1, 20], [-50, -205, -84, 46, 128, .12, 21], [20, -205, 16, -34, 118, -.05, 22], [92, -200, 138, -22, 132, -.1, 23], [150, -170, 190, -64, 110, -.1, 24]);
      side.push([-176, -60, -206, 196, 104, .1, 30], [176, -60, 210, 186, 104, -.1, 31]);
    } else {
      // noa: smooth cap, side-swept bangs, long face-framing locks + high ponytail
      const c = [0, -40];
      [[190, 260, 190, .05], [150, 300, 200, .03], [110, 320, 200, 0], [70, 300, 200, -.03], [30, 270, 190, -.05]].forEach(([a, R, w, b], i) => { const ar = a * PI / 180; back.push([c[0] + Math.cos(ar) * 170, c[1] - Math.sin(ar) * 170, c[0] + Math.cos(ar) * R, c[1] - Math.sin(ar) * R, w, b, i]); });
      front.push([-140, -200, -178, 20, 130, .12, 20], [-70, -212, -82, 60, 138, .1, 21], [0, -212, 40, -10, 130, -.1, 22], [80, -206, 130, 40, 140, -.14, 23], [150, -176, 200, -30, 120, -.12, 24]);
      side.push([-176, -70, -214, 370, 112, .08, 30], [176, -70, 218, 350, 112, -.08, 31]);
    }
    return { back, front, side };
  }
  function drawHairBack(g, S, C, st) {
    const { yaw, t, seed } = st, Rh = 215, hp = x => pxx(x, yaw, Rh);
    const sw = (i, L) => [A.noise1(t * 1.1 + i * 1.7 + seed) * .07 * L, A.noise1(t * .9 + i * 2.3 + seed * 3) * .04 * L - st.lift * .12 * L];
    // cap
    const cap = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; cap.push([hp(Math.cos(a) * 214), -40 + Math.sin(a) * 205]); }
    // ponytail first (behind everything)
    if (S === 'noa') {
      const wob = A.noise1(t * 1.2 + seed) * 46, wob2 = A.noise1(t * 1.6 + seed + 4) * 30 - st.lift * 60;
      const bx = hp(110) + 40, by = -210, tx = bx + 250 + wob * .6 + st.run * 90, ty = 820 + wob2 - st.run * 300 - st.lift * 200;
      const pts = [[bx - 20, by], [bx + 105, by - 30], [bx + 235 + wob * .3, by + 220 + wob2 * .2], [bx + 290 + wob * .7, 330], [tx + 30, ty - 250], [tx, ty], [tx - 90, ty - 220], [bx + 120, 330], [bx + 70, by + 240], [bx - 15, by + 120]];
      st._pony = { bx, by, tx, ty };
      const p = blobP(pts); cel(g, p, C.hair, C.hairS, 40, 10, 10);
      g.save(); g.clip(p); g.strokeStyle = C.hairH; g.globalAlpha = .55; g.lineWidth = 14; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx + 30, by + 20); g.bezierCurveTo(bx + 110, by + 120, bx + 150 + wob * .3, 250, bx + 140 + wob * .6, 520); g.stroke(); g.restore();
      g.save(); g.strokeStyle = C.hairD; g.globalAlpha = .7; g.lineWidth = iw(4); g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(bx + 60 + i * 30, by + 60); g.bezierCurveTo(bx + 120 + i * 40, 200, bx + 200 + i * 20 + wob * .4, 380, lerp(bx + 150, tx, .7) + i * 14, lerp(400, ty, .8)); g.stroke(); } g.restore();
    }
    hairDef(S).back.forEach(([bx, by, tx, ty, w, b, i]) => {
      const [sx, sy] = sw(i, Math.hypot(tx - bx, ty - by));
      const p = lockP(hp(bx), by, hp(tx) + sx, ty + sy, w, b); cel(g, p, C.hair, C.hairS, 36, 14, 10);
    });
    const p = blobP(cap); cel(g, p, C.hair, C.hairS, 40, 30, 11);
    // glossy angel ring
    g.save(); g.clip(p); g.strokeStyle = C.hairH; g.globalAlpha = .9; g.lineWidth = 34; g.lineCap = 'round';
    g.beginPath(); g.ellipse(hp(0) - 6, -60, hp(150) - hp(0) + 150, 168, 0, PI * 1.08, PI * 1.62); g.stroke();
    g.globalAlpha = .5; g.lineWidth = 12; g.beginPath(); g.ellipse(hp(0) - 6, -60, hp(150) - hp(0) + 150, 190, 0, PI * 1.12, PI * 1.5); g.stroke(); g.restore();
  }
  function drawHairFront(g, S, C, st) {
    const { yaw, t, seed } = st, Rh = 215, hp = x => pxx(x, yaw, Rh), def = hairDef(S);
    const sw = (i, L) => [A.noise1(t * 1.3 + i * 1.9 + seed) * .06 * L, A.noise1(t * 1.1 + i * 2.7 + seed * 2) * .03 * L - st.lift * .05 * L];
    const draw = (l, k) => {
      const [bx, by, tx, ty, w, b, i] = l, [sx, sy] = sw(i, Math.hypot(tx - bx, ty - by)), yb = yaw * 26;
      const far = (bx < 0) !== (yaw > 0.02) ? 1 : 0;   // side facing away from turn direction shrinks
      const wf = k === 'side' ? (bx > 0 ? Math.max(.25, 1 - yaw * .75) : 1 + yaw * .2) : 1;
      const p = lockP(hp(bx) + yb * (k === 'side' ? 0 : 1), by, hp(tx) + sx + yb * (k === 'side' ? 0 : 1), ty + sy, w * wf, b);
      cel(g, p, C.hair, C.hairS, 30, 14, 9);
      // highlight strand + ink strand (detail)
      g.save(); g.clip(p); g.strokeStyle = C.hairH; g.globalAlpha = .8; g.lineCap = 'round'; g.lineWidth = w * .1;
      const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, o1 = -w * .2;
      g.beginPath(); g.moveTo(hp(bx) + nx * o1 + yb, by + ny * o1 + L * .08 * 0 + 20); g.quadraticCurveTo((hp(bx) + hp(tx)) / 2 + nx * (o1 + b * L) + yb, (by + ty) / 2 + ny * (o1 + b * L), hp(tx) + sx + nx * o1 * .1 + yb, ty + sy - L * .25 * 0 - 14); g.stroke();
      if (K.det) { g.strokeStyle = C.hairD; g.globalAlpha = .55; g.lineWidth = iw(3.5); for (const q of [.12, .3]) { g.beginPath(); g.moveTo(hp(bx) + nx * w * q + yb, by + ny * w * q + 30); g.quadraticCurveTo((hp(bx) + hp(tx)) / 2 + nx * (w * q + b * L * .9) + yb, (by + ty) / 2 + ny * (w * q + b * L), hp(tx) + sx + yb, ty + sy - 6); g.stroke(); } }
      g.restore();
    };
    def.front.forEach(l => draw(l, 'front'));
    def.side.forEach(l => draw(l, 'side'));
    if (S === 'kai') {  // ahoge: curled tuft
      const [sx, sy] = sw(50, 200); const p = lockP(hp(-6) + yaw * 20, -228, hp(30) + sx + yaw * 20, -520 + sy, 62, -.35, .5);
      cel(g, p, C.hair, C.hairS, 20, 8, 9);
    }
  }

  // ---------------------------------------------------------------- eyes / brows / mouth
  function eyeShape(rw, rh, e, tilt, side, smileLid) {
    const pts = [], n = 22, rhT = rh * e, rhB = rh * (.42 + .14 * Math.min(1, e)) * (1 - smileLid * .55);
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
      let x = rw * c, y = s < 0 ? -rhT * Math.pow(-s, .82) : rhB * Math.pow(s, 1.1);
      if (s < 0) { const inner = -side * c; y += tilt * 34 * inner - tilt * 8 * (1 - inner); }
      pts.push([x, y]);
    }
    return { pts, path: blobP(pts), n };
  }
  function star4(g, x, y, r, col) {
    g.save(); g.translate(x, y); g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * PI / 2, a2 = a + PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a2) * r * .2, Math.sin(a2) * r * .2); }
    g.closePath(); g.fill(); g.restore();
  }
  function drawEye(g, C, st, F, side, X, Y, sxs, eOpen) {
    const rw = 66, rh = 84, t = st.t, look = st.look;
    g.save(); g.translate(X, Y); g.scale(sxs, 1);
    const ek = (F.ek || 1) * (F.e >= 1.1 ? 1 : 1), e = eOpen;
    if (F.arc) {                                   // happy closed arc ^ ^
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-rw * .95, 26); g.quadraticCurveTo(0, -78, rw * .95, 26); g.lineWidth = iw(17); g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.moveTo(side * rw * .9, 20); g.lineTo(side * (rw + 26), 2); g.lineWidth = iw(11); g.stroke();
      g.beginPath(); g.moveTo(-rw * .55, 40); g.quadraticCurveTo(0, 18, rw * .55, 40); g.lineWidth = iw(5); g.strokeStyle = C.skinD; g.stroke();
      g.restore(); return;
    }
    if (e < .13) {                                 // blink: closed lid curve
      g.lineCap = 'round'; g.beginPath(); g.moveTo(-rw, 8); g.quadraticCurveTo(0, 36, rw, 8); g.lineWidth = iw(15); g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.moveTo(side * rw * .9, 10); g.lineTo(side * (rw + 24), -4); g.lineWidth = iw(10); g.stroke();
      g.restore(); return;
    }
    const sh = eyeShape(rw, rh, e * ek, F.tilt, side, st.smile);
    // sclera
    g.save(); g.clip(sh.path);
    g.fillStyle = lgr(g, 0, -rh, 0, rh * .5, [[0, '#C8BCE6'], [.32, '#FFFFFF'], [1, '#EEF2FF']]); g.fillRect(-rw - 4, -rh - 4, rw * 2 + 8, rh * 2 + 8);
    // iris
    const p1 = F.pupil, irx = rw * .84 * (p1 > 1 ? 1.06 : 1), iry = rh * .98 * (p1 > 1 ? 1.03 : 1), ix = look.x * rw * .3, iy = look.y * rh * .2 + rh * .08;
    g.save(); g.translate(ix, iy); g.scale(irx / iry, 1);
    const ir = iry;
    g.beginPath(); g.arc(0, 0, ir, 0, TAU); g.fillStyle = rgr(g, 0, ir * .35, ir * .05, ir * 1.05, [[0, C.iris[0]], [.42, C.iris[1]], [.86, C.iris[2]], [1, C.irisRim]]); g.fill();
    if (K.det) {
      g.save(); g.clip(new Path2D(`M0 0 m${-ir} 0 a${ir} ${ir} 0 1 0 ${ir * 2} 0 a${ir} ${ir} 0 1 0 ${-ir * 2} 0`)); g.strokeStyle = C.iris[0]; g.globalAlpha = .28; g.lineWidth = 3;
      for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * ir * .34, Math.sin(a) * ir * .34); g.lineTo(Math.cos(a) * ir * .95, Math.sin(a) * ir * .95); g.stroke(); }
      g.restore();
    }
    g.fillStyle = lgr(g, 0, -ir, 0, ir * .3, [[0, 'rgba(25,8,55,.78)'], [1, 'rgba(25,8,55,0)']]); g.beginPath(); g.arc(0, 0, ir, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, 0, ir - 2, 0, TAU); g.lineWidth = iw(5); g.strokeStyle = C.irisRim; g.globalAlpha = .8; g.stroke(); g.globalAlpha = 1;
    // pupil
    g.beginPath(); g.ellipse(0, ir * .02, ir * .34 * p1, ir * .42 * p1, 0, 0, TAU); g.fillStyle = '#12071f'; g.fill();
    // highlights
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-ir * .3, -ir * .36, ir * .27, ir * .24, -.5, 0, TAU); g.fill();
    g.globalAlpha = .95; g.beginPath(); g.arc(ir * .36, ir * .44, ir * .1, 0, TAU); g.fill();
    g.globalAlpha = .7; g.beginPath(); g.arc(ir * .12, ir * .62, ir * .05, 0, TAU); g.fill(); g.globalAlpha = 1;
    if (F.sparkle) { star4(g, ir * .28, -ir * .1, ir * .34 * (.85 + .2 * Math.sin(t * 7 + side)), '#fff'); star4(g, -ir * .5, ir * .32, ir * .17, '#fff'); star4(g, ir * .55, ir * .5, ir * .12, '#fff'); g.globalAlpha = .5; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, ir * .56, 0, TAU); g.fill(); g.globalAlpha = 1; }
    g.restore();
    // upper lid shadow on eye
    g.fillStyle = lgr(g, 0, -rh, 0, -rh + 40, [[0, 'rgba(60,20,90,.5)'], [1, 'rgba(60,20,90,0)']]); g.fillRect(-rw, -rh, rw * 2, 44);
    g.restore();
    // lashes
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
    const top = sh.pts.filter((p, i) => i > sh.n / 2), bot = sh.pts.filter((p, i) => i <= sh.n / 2);
    const topPts = []; for (let i = sh.n / 2; i <= sh.n; i++) topPts.push(sh.pts[i % sh.n]);
    g.beginPath(); topPts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = iw(15); g.stroke();
    // thick outer flick
    const ox = side * rw, oy = topPts[side > 0 ? topPts.length - 1 : 0][1];
    g.beginPath(); g.moveTo(ox - side * 26, oy - 22); g.quadraticCurveTo(ox + side * 4, oy - 14, ox + side * 34, oy - 30 + F.tilt * -6); g.quadraticCurveTo(ox + side * 12, oy + 2, ox - side * 8, oy + 12); g.closePath(); g.fillStyle = INK; g.fill(); g.lineWidth = iw(6); g.stroke();
    // inner corner tick and lower lash
    g.beginPath(); g.moveTo(-side * rw + 4, oy + 6); g.lineTo(-side * (rw + 8), oy + 12); g.lineWidth = iw(5); g.stroke();
    g.beginPath(); for (let i = 0; i <= sh.n / 2; i++) { const p = sh.pts[i]; if (side > 0 ? p[0] > -rw * .2 : p[0] < rw * .2) (g.lineTo(p[0], p[1] + 2)); else g.moveTo(p[0], p[1] + 2); } g.lineWidth = iw(4.5); g.globalAlpha = .9; g.stroke(); g.globalAlpha = 1;
    if (K.det) { g.strokeStyle = C.skinD; g.globalAlpha = .75; g.lineWidth = iw(4.5); g.beginPath(); g.moveTo(-rw * .85, -rh * e * .78 - 6 + F.tilt * side * -6); g.quadraticCurveTo(0, -rh * e * 1.28 - 14 + F.tilt * 12, rw * .95, -rh * e * .78 - 4 + F.tilt * -20); g.stroke(); g.globalAlpha = 1; }
    g.restore();
  }
  function drawBrow(g, C, st, F, side, X, Y, sxs) {
    const inner = -side * 62, outer = side * 80, ty = F.brT;
    const yi = Y + F.brY + ty * 30 + 12, yo = Y + F.brY - ty * 14 - 4, mid = Math.min(yi, yo) - 22 - (F.brA ?? 1) * 6;
    g.save(); g.translate(X, 0); g.scale(sxs, 1);
    const p = new Path2D(); p.moveTo(inner, yi - 12); p.quadraticCurveTo(0, mid - 14, outer, yo - 4); p.quadraticCurveTo(0, mid + 14, inner, yi + 12); p.closePath();
    g.fillStyle = C.brow; g.fill(p); g.lineWidth = iw(3.5); g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(p); g.restore();
  }
  function drawMouth(g, C, st, F, X, Y, sxs) {
    let type = F.mouth, open = F.open;
    const m = st.mouth;
    if (m > .06) { if (['smile', 'smirk', 'wavy'].includes(type)) { type = 'D'; open = m * .85; } else if (type === 'grit') { type = 'D'; open = .3 + m * .6; } else if (type === 'D') open = Math.max(.15, open * (.35 + m * .9) * (F.open > 1 ? 1 : 1) * (F.open > 1 ? 1 : 1)); else if (type === 'O') open = .5 + m * .5; }
    g.save(); g.translate(X, Y); g.scale(sxs, 1); g.lineCap = 'round'; g.lineJoin = 'round';
    if (type === 'smile') {
      g.beginPath(); g.moveTo(-28, -4); g.quadraticCurveTo(0, 16, 28, -4); g.lineWidth = iw(7); g.strokeStyle = INK; g.stroke();
    } else if (type === 'D') {
      const w = 32 + open * 20, d = 12 + open * 62, mp = new Path2D();
      mp.moveTo(-w, 0); mp.quadraticCurveTo(0, -6 - open * 4, w, 0); mp.bezierCurveTo(w * .96, d * 1.05, -w * .96, d * 1.05, -w, 0); mp.closePath();
      g.fillStyle = lgr(g, 0, 0, 0, d, [[0, '#5A0C2E'], [1, '#B01848']]); g.fill(mp); g.save(); g.clip(mp);
      g.fillStyle = '#fff'; g.fillRect(-w, -4, w * 2, 12 + Math.min(1, open) * 10); g.strokeStyle = 'rgba(120,120,160,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w, 8 + Math.min(1, open) * 10); g.lineTo(w, 8 + Math.min(1, open) * 10); g.stroke();
      if (open > .3) { g.beginPath(); g.ellipse(0, d * .86, w * .7, d * .34, 0, 0, TAU); g.fillStyle = '#FF7A9E'; g.fill(); }
      g.restore(); g.lineWidth = iw(7); g.strokeStyle = INK; g.stroke(mp);
    } else if (type === 'O') {
      const rx = 22 + open * 10, ry = 26 + open * 30, mp = new Path2D(); mp.ellipse(0, ry * .5, rx, ry, 0, 0, TAU);
      g.fillStyle = '#6A0F36'; g.fill(mp); g.save(); g.clip(mp); g.beginPath(); g.ellipse(0, ry * 1.15, rx * .8, ry * .45, 0, 0, TAU); g.fillStyle = '#FF7A9E'; g.fill(); g.restore(); g.lineWidth = iw(7); g.strokeStyle = INK; g.stroke(mp);
    } else if (type === 'smirk') {
      g.beginPath(); g.moveTo(-24, 8); g.quadraticCurveTo(4, 22, 36, -8); g.lineWidth = iw(7); g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.moveTo(36, -8); g.lineTo(44, -18); g.lineWidth = iw(5); g.stroke();
    } else if (type === 'wavy') {
      g.beginPath(); g.moveTo(-30, 10); g.bezierCurveTo(-20, -6, -10, -6, 0, 6); g.bezierCurveTo(10, 18, 20, 18, 30, 4); g.lineWidth = iw(7); g.strokeStyle = INK; g.stroke();
    } else if (type === 'grit') {
      const mp = new Path2D(); mp.roundRect(-52, -14, 104, 46, 14); g.fillStyle = '#fff'; g.fill(mp); g.save(); g.clip(mp); g.strokeStyle = INK; g.lineWidth = iw(4); g.beginPath(); for (let i = -3; i <= 3; i++) { g.moveTo(i * 15, -14); g.lineTo(i * 15, 32); } g.moveTo(-52, 9); g.lineTo(52, 9); g.stroke(); g.restore(); g.lineWidth = iw(7); g.stroke(mp);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- head
  const FACE_PTS = [[0, -186], [122, -168], [180, -96], [190, -6], [172, 82], [124, 158], [58, 216], [0, 232], [-58, 216], [-124, 158], [-172, 82], [-190, -6], [-180, -96], [-122, -168]];
  function drawHead(g, S, C, st) {
    const { yaw, t } = st, F = st.F, R = 190;
    // ---- back hair
    drawHairBack(g, S, C, st);
    // ---- neck
    const nk = polyP([[-56, 130], [56, 130], [64, 330], [-64, 330]]);
    g.save(); g.translate(yaw * 14, 0); cel(g, nk, C.skin, C.skinS, 16, 10, 8);
    g.save(); g.clip(nk); g.fillStyle = C.skinD; g.globalAlpha = .55; g.beginPath(); g.ellipse(0, 190, 140, 82, 0, 0, TAU); g.fill(); g.restore(); g.restore();
    // ---- face outline
    const fp = FACE_PTS.map(([x, y]) => [x + (y > 60 ? yaw * 34 * (y - 60) / 170 : 0), y]);
    const nb = Math.max(0, yaw - .3) * 60; if (nb > 0) { fp.splice(3, 0, [190 + nb * .25, 4]); fp.splice(4, 0, [190 + nb, 62]); }
    const face = blobP(fp);
    // ears
    [-1, 1].forEach(sd => { const vis = sd > 0 ? Math.max(.25, 1 - yaw * .9) : 1 + yaw * .1; if (sd > 0 && yaw > .9) return; const ex = sd * (R - 6) + (sd < 0 ? yaw * 5 : -yaw * 6); const ep = blobP([[ex - sd * 8, -18], [ex + sd * 42 * vis, -10], [ex + sd * 46 * vis, 50], [ex + sd * 12, 82]]); cel(g, ep, C.skin, C.skinS, 6, 6, 7); });
    cel(g, face, C.skin, C.skinS, 30, 22, 10, true, 'rgba(255,240,230,.9)', 10);
    // ---- face features (clipped to face)
    g.save(); g.clip(face);
    // hair shadow on forehead
    g.save(); g.translate(yaw * 26, 0); g.globalAlpha = .9; g.fillStyle = C.skinS; hairDef(S).front.forEach(([bx, by, tx, ty, w, b]) => { g.save(); g.translate(0, 42); g.fill(lockP(pxx(bx, yaw, 215), by, pxx(tx, yaw, 215), ty, w, b)); g.restore(); }); g.restore();
    // jaw / chin shade + blush
    if (F.blush > 0) [-1, 1].forEach(sd => {
      const bx = px(sd * 112, yaw), bs = psx(sd * 112, yaw); if (Math.abs(bs) < .16) return;
      g.save(); g.translate(bx, 106); g.scale(bs, 1); g.globalAlpha = F.blush * (.55 + .12 * Math.sin(t * 2)); g.fillStyle = rgr(g, 0, 0, 4, 50, [[0, C.cheek], [1, 'rgba(255,120,140,0)']]); g.beginPath(); g.ellipse(0, 0, 52, 32, 0, 0, TAU); g.fill();
      g.globalAlpha = F.blush * .9; g.strokeStyle = C.cheek; g.lineCap = 'round'; g.lineWidth = iw(4); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 17 - 8, -8); g.lineTo(i * 17 + 4, 12); g.stroke(); } g.restore();
    });
    // nose
    { const nx = px(0, yaw), ns = psx(0, yaw); g.save(); g.translate(nx + yaw * 8, 112); g.lineCap = 'round'; g.strokeStyle = C.skinD; g.lineWidth = iw(6); g.beginPath(); g.moveTo(-6 * ns, 0); g.quadraticCurveTo(0, 12, 10 * ns + yaw * 8, 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-4 * ns, -12, 4, 0, TAU); g.fill(); g.restore(); }
    // eyes + brows
    const blink = st.blink, e0 = F.e * (1 - blink);
    [-1, 1].forEach(sd => {
      const bx = px(sd * 92, yaw), bs = psx(sd * 92, yaw);
      drawEye(g, C, st, F, sd, bx, 26, bs, e0);
      drawBrow(g, C, st, F, sd, bx, -66, bs);
    });
    drawMouth(g, C, st, F, px(0, yaw) + yaw * 10, 168, Math.max(.55, psx(0, yaw)));
    if (F.vein) { g.save(); g.strokeStyle = '#E0506A'; g.lineWidth = iw(5); g.lineCap = 'round'; g.beginPath(); g.moveTo(px(60, yaw), -120); g.lineTo(px(78, yaw), -104); g.moveTo(px(90, yaw), -120); g.lineTo(px(70, yaw), -98); g.stroke(); g.restore(); }
    g.restore();
    // ---- front hair
    drawHairFront(g, S, C, st);
    // ---- manga marks
    if (F.sweat) { const k = (t * .8) % 1; g.save(); g.translate(px(150, yaw) + 24, -70 + k * 90); g.globalAlpha = 1 - k * .6; const dp = new Path2D(); dp.moveTo(0, -38); dp.bezierCurveTo(10, -18, 26, -2, 26, 16); dp.bezierCurveTo(26, 34, 12, 42, 0, 42); dp.bezierCurveTo(-12, 42, -26, 34, -26, 16); dp.bezierCurveTo(-26, -2, -10, -18, 0, -38); g.fillStyle = lgr(g, 0, -38, 0, 42, [[0, '#E4F8FF'], [1, '#63BCFF']]); g.fill(dp); g.lineWidth = iw(6); g.strokeStyle = INK; g.stroke(dp); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-9, 14, 5, 11, .3, 0, TAU); g.fill(); g.restore(); }
    if (F.anger) { const k = .75 + .25 * Math.sin(t * 12); g.save(); g.translate(px(-150, yaw) - 30, -200); g.scale(k * 1.1, k * 1.1); g.lineCap = 'round'; [[32, '#2a0410'], [16, '#FF3040']].forEach(([w, col]) => { g.lineWidth = w; g.strokeStyle = col; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => { g.beginPath(); const cx = a * 40, cy = b * 40, a0 = Math.atan2(-cy, -cx); g.arc(cx, cy, 30, a0 - .85, a0 + .85); g.stroke(); }); }); g.restore(); }
  }
