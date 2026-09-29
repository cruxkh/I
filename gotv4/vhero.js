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
    shout: { e: .5, tilt: .75, brY: 12, brT: 1, mouth: 'D', open: 1.15, blush: .3, pupil: .9, vein: 1 },
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
      front.push([-130, -204, -160, -92, 104, .1, 20], [-62, -212, -70, -82, 110, .14, 21], [8, -214, 6, 14, 64, -.05, 22], [76, -210, 88, -80, 112, -.12, 23], [146, -190, 176, -84, 104, -.1, 24]);
      side.push([-186, -80, -208, 190, 84, .1, 30], [186, -80, 212, 180, 84, -.1, 31]);
    } else {
      // noa: smooth cap, side-swept bangs, long face-framing locks + high ponytail
      const c = [0, -40];
      
      front.push([-140, -204, -172, -70, 110, .12, 20], [-70, -212, -84, -84, 120, .1, 21], [0, -214, 24, 10, 70, -.1, 22], [80, -208, 100, -80, 120, -.14, 23], [150, -186, 186, -64, 108, -.12, 24]);
      side.push([-188, -90, -214, 370, 90, .08, 30], [188, -90, 220, 350, 90, -.08, 31]);
    }
    return { back, front, side };
  }
  function drawHairBack(g, S, C, st) {
    const { yaw, t, seed } = st, Rh = 215, hp = x => pxx(x, yaw, Rh);
    const sw = (i, L) => [A.noise1(t * 1.1 + i * 1.7 + seed) * .07 * L, A.noise1(t * .9 + i * 2.3 + seed * 3) * .04 * L - st.lift * .12 * L];
    // cap
    const cap = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; cap.push([hp(Math.cos(a) * (S === 'noa' ? 226 : 214)), (S === 'noa' ? -50 : -40) + Math.sin(a) * (S === 'noa' ? 222 : 205)]); }
    // ponytail first (behind everything)
    if (S === 'noa') {
      const wob = A.noise1(t * 1.2 + seed) * 46, wob2 = A.noise1(t * 1.6 + seed + 4) * 30 - st.lift * 60;
      const bx = hp(110) + 40, by = -210, tx = bx + 250 + wob * .6 - st.run * 640, ty = 820 + wob2 - st.run * 560 - st.lift * 200;
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
    g.save(); g.clip(p); g.strokeStyle = C.hairH; g.globalAlpha = .55; g.lineWidth = 22; g.lineCap = 'round';
    g.beginPath(); g.ellipse(hp(0) - 6, -60, 150, 176, 0, PI * 1.12, PI * 1.55); g.stroke();
    g.globalAlpha = .5; g.lineWidth = 8; g.beginPath(); g.ellipse(hp(0) - 6, -60, 150, 196, 0, PI * 1.14, PI * 1.4); g.stroke(); g.restore();
  }
  function drawHairFront(g, S, C, st) {
    const { yaw, t, seed } = st, Rh = 215, hp = x => pxx(x, yaw, Rh), def = hairDef(S);
    const sw = (i, L) => [A.noise1(t * 1.3 + i * 1.9 + seed) * .06 * L, A.noise1(t * 1.1 + i * 2.7 + seed * 2) * .03 * L - st.lift * .05 * L];
    const draw = (l, k) => {
      const [bx, by, tx, ty, w, b, i] = l, [sx, sy] = sw(i, Math.hypot(tx - bx, ty - by)), yb = yaw * 26;
      const far = (bx < 0) !== (yaw > 0.02) ? 1 : 0;   // side facing away from turn direction shrinks
      const wf = k === 'side' ? (bx > 0 ? Math.max(.25, 1 - yaw * .75) : 1 - yaw * .4) : 1;
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
      const [sx, sy] = sw(50, 200); const p = lockP(hp(-6) + yaw * 20, -232, hp(34) + sx + yaw * 20, -430 + sy, 46, -.32, .5);
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
    if (F.sparkle) { g.save(); g.globalAlpha = .6; g.fillStyle = rgr(g, 0, ir * .55, 2, ir * .75, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(0, ir * .55, ir * .75, 0, TAU); g.fill(); g.restore(); }
    // pupil
    g.beginPath(); g.ellipse(0, ir * .02, ir * .34 * p1, ir * .42 * p1, 0, 0, TAU); g.fillStyle = '#12071f'; g.fill();
    // highlights
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-ir * .3, -ir * .36, ir * .27, ir * .24, -.5, 0, TAU); g.fill();
    g.globalAlpha = .95; g.beginPath(); g.arc(ir * .36, ir * .44, ir * .1, 0, TAU); g.fill();
    g.globalAlpha = .7; g.beginPath(); g.arc(ir * .12, ir * .62, ir * .05, 0, TAU); g.fill(); g.globalAlpha = 1;
    if (F.sparkle) { star4(g, ir * .28, -ir * .1, ir * .34 * (.85 + .2 * Math.sin(t * 7 + side)), '#fff'); star4(g, -ir * .5, ir * .32, ir * .17, '#fff'); star4(g, ir * .55, ir * .5, ir * .12, '#fff'); }
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
  function drawHead(g, S, C, st, phase) {
    const { yaw, t } = st, F = st.F, R = 190;
    // ---- back hair
    if (phase !== 'front') drawHairBack(g, S, C, st);
    if (phase === 'back') return;
    // ---- neck
    const nk = blobP([[-50, 120], [50, 120], [56, 230], [78, 330], [-78, 330], [-56, 230]]);
    g.save(); g.translate(yaw * 14, 0); cel(g, nk, C.skin, C.skinS, 16, 10, 8);
    g.save(); g.clip(nk); g.fillStyle = C.skinD; g.globalAlpha = .55; g.beginPath(); g.ellipse(0, 150, 120, 84, 0, 0, TAU); g.fill(); g.restore(); g.restore();
    // ---- face outline (skin shrinks on the turned side; hair mass fills the side/back of the head)
    const fl = yaw > .02 ? Math.sin(yaw - 1.22) / -.94 : 1;
    const shrink = (x, y) => x < 0 ? x * lerp(fl, 1, A.smooth(90, 210, y)) : x;
    const fp = FACE_PTS.map(([x, y]) => [shrink(x, y) + (y > 60 ? yaw * 34 * (y - 60) / 170 : 0), y]);
    const nb = Math.max(0, yaw - .3) * 60; if (nb > 0) { fp.splice(3, 0, [190 + nb * .25, 4]); fp.splice(4, 0, [190 + nb, 62]); }
    const face = blobP(fp);
    // right ear (behind the face)
    { const sd = 1, vis = Math.max(.25, 1 - yaw * .9); if (yaw <= .9) { const ex = (R - 6) - yaw * 6; cel(g, blobP([[ex - 8, -18], [ex + 42 * vis, -10], [ex + 46 * vis, 50], [ex + 12, 82]]), C.skin, C.skinS, 6, 6, 7); } }
    if (yaw <= .02) { const ex = -(R - 6); cel(g, blobP([[ex + 8, -18], [ex - 42, -10], [ex - 46, 50], [ex - 12, 82]]), C.skin, C.skinS, 6, 6, 7); }
    cel(g, face, C.skin, C.skinS, 30, 22, 10, true, 'rgba(255,240,230,.9)', 10);
    if (yaw > .02) {
      const nz = S === 'noa', cxh = nz ? -50 : -40, rx = nz ? 226 : 214, ry = nz ? 222 : 205, outer = [], inner = [];
      for (let a = 4.62; a >= 2.2; a -= .2) outer.push([Math.cos(a) * rx, cxh + Math.sin(a) * ry]);
      [[-122, -168], [-180, -96], [-190, -6], [-172, 82], [-124, 140]].forEach(([x, y]) => inner.push([shrink(x, y), y]));
      const mp = blobP(outer.concat(inner.reverse()));
      cel(g, mp, C.hair, C.hairS, 34, 20, 10);
      g.save(); g.clip(mp); g.strokeStyle = C.hairD; g.globalAlpha = .55; g.lineWidth = iw(4); g.lineCap = 'round';
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-100 - i * 22, -150 + i * 10); g.quadraticCurveTo(-190 + i * 6, -40, -150 + i * 10 - yaw * 30, 100); g.stroke(); }
      g.strokeStyle = C.hairH; g.globalAlpha = .8; g.lineWidth = 12; g.beginPath(); g.moveTo(-90, -160); g.quadraticCurveTo(-180, -80, -190, 10); g.stroke(); g.restore();
      const ex = shrink(-186, 20) - 4; cel(g, blobP([[ex + 10, -14], [ex - 30, -8], [ex - 34, 52], [ex + 8, 78]]), C.skin, C.skinS, 6, 6, 7);
      g.save(); g.strokeStyle = C.skinD; g.lineWidth = iw(4); g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 6, 6); g.quadraticCurveTo(ex - 20, 20, ex - 8, 46); g.stroke(); g.restore();
    }
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

  // ---------------------------------------------------------------- body parts
  function capP(x0, y0, x1, y1, w) {
    const a = Math.atan2(y1 - y0, x1 - x0), p = new Path2D(), r = w / 2;
    p.arc(x0, y0, r, a + PI / 2, a + PI * 1.5); p.arc(x1, y1, r, a - PI / 2, a + PI / 2); p.closePath(); return p;
  }
  function pickElbow(ax, ay, bx, by, l1, l2, score) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1; const md = l1 + l2 - 2; if (d > md) { dx *= md / d; dy *= md / d; d = md; } if (d < 60) { d = 60; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / d, uy = dy / d, mx = ax + ux * a, my = ay + uy * a;
    const c1 = [mx - uy * h, my + ux * h], c2 = [mx + uy * h, my - ux * h], e = score(c1[0], c1[1]) >= score(c2[0], c2[1]) ? c1 : c2;
    return { e, h: [ax + dx, ay + dy] };
  }
  // limb: polyline of points, drawn with ink pass, base pass, shade pass, highlight
  function limb(g, pts, w, base, shade, hi, trim) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = (col, lw, ox = 0, oy = 0) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy)); g.stroke(); };
    stroke(INK, w + iw(15));
    stroke(base, w);
    if (shade) {   // shade strip on lower-right side
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx + ny * .7 < 0) { nx = -nx; ny = -ny; } g.strokeStyle = shade; g.lineWidth = w * .42; g.beginPath(); g.moveTo(x0 + nx * w * .29, y0 + ny * w * .29); g.lineTo(x1 + nx * w * .29, y1 + ny * w * .29); g.stroke(); }
    }
    if (hi) {
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx + ny * .7 > 0) { nx = -nx; ny = -ny; } g.strokeStyle = hi; g.globalAlpha = .55; g.lineWidth = w * .09; g.beginPath(); g.moveTo(x0 + nx * w * .3 + dx / l * 20, y0 + ny * w * .3 + dy / l * 20); g.lineTo(x1 + nx * w * .3 - dx / l * 20, y1 + ny * w * .3 - dy / l * 20); g.stroke(); g.globalAlpha = 1; }
    }
    if (trim) {  // cuff band near the last point
      const [x0, y0] = pts[pts.length - 2], [x1, y1] = pts[pts.length - 1], q = f => [lerp(x0, x1, f), lerp(y0, y1, f)], a = q(.6), b = q(.78);
      g.lineCap = 'butt'; g.strokeStyle = INK; g.lineWidth = w * 1.03 + iw(4); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = trim; g.lineWidth = w * 1.03; g.stroke(); g.lineCap = 'round';
    }
  }
  function hand(g, C, x, y, st, rot, sc) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    const cp = (x0, y0, x1, y1, w) => cel(g, capP(x0, y0, x1, y1, w), C.skin, C.skinS, 5, 5, 6);
    if (st === 'open') {
      [[-.5, 88], [-.17, 104], [.17, 100], [.5, 84]].forEach(([a, L]) => cp(Math.sin(a) * 30, -Math.cos(a) * 26, Math.sin(a * 1.1) * L, -Math.cos(a * 1.1) * L - 20, 30));
      cp(-40, 14, -84, -28, 32); cel(g, blobP([[-52, 0], [0, -34], [52, 0], [46, 56], [0, 70], [-46, 56]]), C.skin, C.skinS, 8, 8, 7);
    } else {
      cel(g, blobP([[-56, -34], [-20, -54], [24, -54], [58, -34], [62, 20], [40, 62], [-30, 62], [-58, 26]]), C.skin, C.skinS, 8, 8, 8);
      g.strokeStyle = INK; g.lineWidth = iw(5); g.lineCap = 'round'; g.beginPath(); for (let i = -1; i <= 1; i++) { g.moveTo(i * 34 + 6, -50); g.lineTo(i * 34 + 6, -6); } g.moveTo(-50, -6); g.lineTo(58, -6); g.stroke();
      cel(g, capP(-46, 24, 30, 30, 34), C.skin, C.skinS, 4, 6, 6);
      if (st === 'point') { cp(18, -40, 18, -150, 32); }
    }
    g.restore();
  }
  function goldRing(g, cx, cy, r, t, flip) {
    g.save(); g.translate(cx, cy);
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.arc(0, 0, r * .62, 0, TAU, true); g.fillStyle = lgr(g, -r, -r, r, r, [[0, '#FFF6C8'], [.4, '#FFC940'], [.7, '#F09A18'], [1, '#B96608']]); g.fill('evenodd');
    g.lineWidth = iw(6); g.strokeStyle = INK; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * .62, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, 0, r * .55, 0, TAU); g.fillStyle = '#0B1450'; g.fill();
    const fs = flip ? -1 : 1, tri = new Path2D(); tri.moveTo(-r * .2 * fs, -r * .3); tri.lineTo(r * .34 * fs, 0); tri.lineTo(-r * .2 * fs, r * .3); tri.closePath(); g.fillStyle = lgr(g, 0, -r * .3, 0, r * .3, [[0, '#FFF3C4'], [1, '#FFB52E']]); g.fill(tri); g.lineWidth = iw(4); g.lineJoin = 'round'; g.stroke(tri);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = iw(4); g.beginPath(); g.arc(0, 0, r * .8, PI * 1.05, PI * 1.45); g.stroke();
    g.restore();
  }
  function shoe(g, x, y, dir, C, O) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    const p = blobP([[-78, -80], [10, -96], [70, -56], [126, 0], [124, 40], [-70, 44], [-92, -10]]);
    cel(g, p, O.shoe, O.shoeS, 14, 12, 9);
    g.save(); g.clip(p); g.fillStyle = O.sole; g.fillRect(-120, 20, 260, 40); g.strokeStyle = INK; g.lineWidth = iw(5); g.beginPath(); g.moveTo(-100, 20); g.lineTo(140, 20); g.stroke(); g.fillStyle = O.acc; g.beginPath(); g.ellipse(50, -34, 44, 22, .25, 0, TAU); g.fill(); g.restore();
    g.restore();
  }
  const OUT = {
    kai: { jacket: '#27306A', jacketS: '#151B45', trim: '#3FB8FF', inner: '#F4F8FF', pants: '#2C3467', pantsS: '#191E48', shoe: '#FFFFFF', shoeS: '#C7D4F2', sole: '#3A4A8A', acc: '#FF8A1A', rim: '#63D6FF' },
    noa: { jacket: '#F5F8FF', jacketS: '#B7C6EE', trim: '#22308A', inner: '#22308A', pants: '#25338F', pantsS: '#141D60', skirt: '#22308A', skirtS: '#131B62', shoe: '#EAF2FF', shoeS: '#AFC2EE', sole: '#2F6BFF', acc: '#2F6BFF', rim: '#A9EBFF', scarf: '#2F6BFF', scarfS: '#1846C4', scarfH: '#8FBDFF' },
  };
  function drawTorso(g, S, C, st, O) {
    const { yaw, t } = st, wf = Math.cos(yaw * .55), kai = S === 'kai';
    const sh = kai ? 238 : 208, wa = kai ? 188 : 148, hm = kai ? 210 : 170;
    const P = [[-74, 236], [74, 236], [sh * wf, 320], [(sh - 14) * wf, 470], [wa * wf, 720], [hm * wf, 880], [-hm * wf, 880], [-wa * wf, 720], [-(sh - 14) * wf, 470], [-sh * wf, 320]];
    const body = blobP(P.map(([x, y], i) => [x + yaw * 20 * (y > 300 ? 1 : .3), y]));
    cel(g, body, O.jacket, O.jacketS, 44, 20, 10, true, O.rim, 16);
    g.save(); g.clip(body);
    const cx = yaw * 26;
    if (kai) {
      g.fillStyle = O.trim; g.fillRect(-300, 850, 600, 60); g.strokeStyle = INK; g.lineWidth = iw(5); g.beginPath(); g.moveTo(-300, 850); g.lineTo(300, 850); g.stroke();
      g.strokeStyle = INK; g.lineWidth = iw(6); g.beginPath(); g.moveTo(cx, 300); g.lineTo(cx, 860); g.stroke(); g.strokeStyle = O.trim; g.lineWidth = iw(3); g.globalAlpha = .7; g.beginPath(); g.moveTo(cx + 8, 300); g.lineTo(cx + 8, 860); g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = O.trim; g.lineWidth = iw(10); g.beginPath(); g.moveTo(-sh * wf * .98, 380); g.quadraticCurveTo(-sh * wf * .8, 600, -wa * wf * .85, 800); g.moveTo(sh * wf * .98, 380); g.quadraticCurveTo(sh * wf * .8, 600, wa * wf * .85, 800); g.stroke();
    } else {
      // navy vest panels + shirt
      const vest = blobP([[-74, 240], [-8, 250], [-24, 520], [-30, 890], [-190 * wf, 890], [-150 * wf, 700], [-170 * wf, 470], [-190 * wf, 330]]);
      g.fillStyle = '#F5F8FF'; g.fillRect(-300, 300, 600, 600);
      g.fillStyle = O.inner; g.fill(vest); g.save(); g.translate(2 * cx + 0, 0); g.scale(-1, 1); g.fill(vest); g.restore();
      g.strokeStyle = INK; g.lineWidth = iw(5); g.stroke(vest); g.save(); g.scale(-1, 1); g.stroke(vest); g.restore();
      g.fillStyle = '#FFC940'; [560, 660, 760].forEach(y => { g.beginPath(); g.arc(cx - 14, y, 14, 0, TAU); g.fill(); g.lineWidth = iw(4); g.stroke(); });
    }
    g.restore();
    if (kai) {
      goldRing(g, 88 * wf + yaw * 60, 560, 82, t, st.flip);
      // collar (standing, two flaps)
      [-1, 1].forEach(sd => { const cp = blobP([[sd * 60 + cx, 200], [sd * 104 + cx, 214], [sd * 128, 310], [sd * 30 + cx, 340], [sd * 40 + cx, 250]]); cel(g, cp, O.jacket, O.jacketS, 14, 10, 8, true, O.rim, 8); g.save(); g.clip(cp); g.strokeStyle = O.trim; g.lineWidth = iw(9); g.beginPath(); g.moveTo(sd * 104 + cx, 214); g.lineTo(sd * 128, 310); g.stroke(); g.restore(); });
    } else {
      // scarf wrap + tail
      const sc = st.run * -1;
      const wrap = blobP([[-130 + cx, 250], [-40 + cx, 236], [60 + cx, 240], [140 + cx, 262], [150, 320], [70 + cx, 372], [-30 + cx, 388], [-120 + cx, 360], [-148, 306]]);
      const flow = A.noise1(t * 1.4 + st.seed) * 26 + A.noise1(t * 3 + 9) * 10;
      const tx = 120 + cx + flow + st.run * -220 - st.lift * -60, ty = 900 - st.run * 320 - st.lift * 200;
      const tail = blobP([[60 + cx, 330], [150 + cx, 350], [tx + 90, ty - 220], [tx + 60, ty], [tx - 20, ty - 14], [tx + 4, ty - 220], [30 + cx, 380]]);
      cel(g, tail, O.scarf, O.scarfS, 26, 10, 9, true, O.scarfH, 10);
      g.save(); g.clip(tail); g.fillStyle = '#fff'; g.globalAlpha = .9; g.beginPath(); g.moveTo(tx - 30, ty - 130); g.lineTo(tx + 120, ty - 150); g.lineTo(tx + 120, ty - 110); g.lineTo(tx - 30, ty - 90); g.fill(); g.restore();
      cel(g, wrap, O.scarf, O.scarfS, 30, 22, 10, true, O.scarfH, 12);
      g.save(); g.clip(wrap); g.strokeStyle = O.scarfH; g.globalAlpha = .6; g.lineWidth = iw(5); g.lineCap = 'round'; g.beginPath(); g.moveTo(-100 + cx, 285); g.quadraticCurveTo(0, 330, 110 + cx, 292); g.stroke(); g.strokeStyle = INK; g.globalAlpha = .6; g.lineWidth = iw(4); g.beginPath(); g.moveTo(-110, 335); g.quadraticCurveTo(0, 372, 120, 330); g.stroke(); g.restore();
    }
  }

  // ---------------------------------------------------------------- poses (hand targets in body units, shoulders at (+-225,330))
  const FY = 1900;
  function poseData(name, t, who) {
    const sw = (f, p = 0) => Math.sin(t * f + p), ab = (f, p = 0) => Math.abs(Math.sin(t * f + p));
    const P = { L: { x: -290 + sw(1.7) * 6, y: 1110 + sw(2, 1) * 10, st: 'fist', sc: 1 }, R: { x: 290 + sw(1.7, 1) * 6, y: 1110 + sw(2, 2) * 10, st: 'fist', sc: 1 }, fl: { x: -175, y: 0 }, fr: { x: 175, y: 0 }, lean: sw(1.2) * .008, crouch: 0, hop: 0, headRot: sw(.9) * .02, headDx: 0, run: 0, lift: 0, aura: 0, shx: 0, kneeDir: 0, sy: 1 };
    switch (name) {
      case 'wow': P.L = { x: -310, y: 150 + sw(30) * 3, st: 'open', sc: 1, eh: [150, 330] }; P.R = { x: 310, y: 150 + sw(28) * 3, st: 'open', sc: 1, eh: [150, 330] }; P.lean = -.05; P.headRot = 0; P.shx = sw(50) * 2; P.fl.x = -150; P.fr.x = 150; break;
      case 'point': P.R = { x: 980, y: 120 + sw(6) * 8, st: 'point', sc: 1 }; P.L = { x: -235, y: 850, st: 'fist', sc: 1 }; P.lean = .04; P.headRot = .05; P.fl.x = -200; P.fr.x = 150; break;
      case 'cheer': P.hop = ab(6.5) * 80; P.L = { x: -480, y: -200 + sw(13) * 14, st: 'fist', sc: 1.05, eh: [230, 60] }; P.R = { x: 480, y: -200 + sw(13, 1) * 14, st: 'fist', sc: 1.05, eh: [230, 60] }; P.lean = sw(3.2) * .04; P.headRot = sw(3.2) * .05; P.fl.x = -190; P.fr.x = 190; break;
      case 'powerup': P.crouch = 110; P.L = { x: -440, y: 960 + sw(18) * 6, st: 'fist', sc: 1.1 }; P.R = { x: 440, y: 960 + sw(18, 2) * 6, st: 'fist', sc: 1.1 }; P.fl.x = -290; P.fr.x = 290; P.headRot = -.07; P.shx = sw(55) * 5; P.aura = 1; P.lift = 1; P.lean = 0; P.kneeDir = -1; break;
      case 'shout': P.crouch = 60; P.L = { x: -480, y: 760, st: 'fist', sc: 1.1 }; P.R = { x: 480, y: 760, st: 'fist', sc: 1.1 }; P.fl.x = -240; P.fr.x = 240; P.lean = -.07; P.headRot = -.11; P.shx = sw(40) * 3; P.lift = .5; break;
      case 'run': { const ph = t * 9.5, s1 = Math.sin(ph), s2 = Math.sin(ph + PI), c1 = Math.max(0, Math.cos(ph)), c2 = Math.max(0, Math.cos(ph + PI)); P.run = 1; P.lean = .2; P.crouch = 50; P.hop = -Math.abs(Math.sin(ph)) * 40 + 30; P.R = { x: 90 + s2 * 300, y: 760 - Math.max(0, s2) * 210, st: 'fist', sc: 1, eh: [-60, 330] }; P.L = { x: -90 + s1 * 300, y: 760 - Math.max(0, s1) * 210, st: 'fist', sc: 1, eh: [60, 330] }; P.fl = { x: s1 * 360 - 60, y: -c1 * 300 }; P.fr = { x: s2 * 360 + 60, y: -c2 * 300 }; P.kneeDir = 1; P.headRot = .04; P.lift = .3; break; }
      case 'shock': P.L = { x: -350, y: 330, st: 'open', sc: 1, eh: [150, 380] }; P.R = { x: 350, y: 330, st: 'open', sc: 1, eh: [150, 380] }; P.lean = -.1; P.headRot = -.04; P.shx = sw(52) * 4; P.sy = .985; P.fl.x = -120; P.fr.x = 120; P.crouch = 30; break;
      case 'fist': P.R = { x: 420, y: 330, st: 'fist', sc: 1.5, eh: [140, 460] }; P.L = { x: -300, y: 930, st: 'fist', sc: 1 }; P.lean = .05 + sw(4) * .008; P.headRot = .05; P.fl.x = -200; P.fr.x = 170; P.crouch = 40; break;
      case 'guard': P.L = { x: 200, y: 470, st: 'fist', sc: 1.05, eh: [-40, 300] }; P.R = { x: -200, y: 500, st: 'fist', sc: 1.05, eh: [-40, 300] }; P.crouch = 70; P.fl.x = -220; P.fr.x = 220; P.lean = .04; P.headRot = .03; P.shx = sw(30) * 2; break;
    }
    return P;
  }
  function drawBody(g, S, C, st, P, bust) {
    const O = OUT[S], { t, yaw } = st, kai = S === 'kai';
    const breathe = Math.sin(t * 2.1 + st.seed) * .012, hipY = 850 + P.crouch;
    const sx = 225 * Math.cos(yaw * .55) * (kai ? 1.02 : .9);
    g.save(); g.translate(P.shx, P.hop < 0 ? P.hop : -P.hop);
    // ---- legs
    if (!bust) {
      const skirt = S === 'noa', hipX = kai ? 110 : 92;
      const legs = [[-1, P.fl], [1, P.fr]].map(([sd, f]) => {
        const fx = sd * hipX + (f.x - sd * 175) + sd * 0 + (Math.abs(f.x) < 1 ? 0 : 0) * 0, ax = f.x, ay = FY + f.y - (P.hop > 0 ? 0 : 0);
        const kd = P.kneeDir === 1 ? (x => x) : P.kneeDir === -1 ? (x => -sd * x) : (x => sd * x);
        const r = pickElbow(sd * hipX * .8, hipY, ax, ay, 540, 540, (x, y) => P.kneeDir === 1 ? x : sd * x * 1 + 0);
        return { sd, hip: [sd * hipX * .8, hipY], knee: r.e, foot: r.h };
      });
      // back-to-front: draw shoes last
      legs.forEach(L => { limb(g, [L.hip, L.knee, L.foot], kai ? 176 : 132, kai ? O.pants : O.pants, kai ? O.pantsS : O.pantsS, null, null); });
      if (kai) legs.forEach(L => { g.save(); g.lineCap = 'round'; g.strokeStyle = O.trim; g.lineWidth = iw(8); g.beginPath(); const k = L.knee, f = L.foot; g.moveTo(k[0] + L.sd * 56 + 0, k[1] + 30); g.lineTo(f[0] + L.sd * 56 - 4, f[1] - 150); g.globalAlpha = .9; g.stroke(); g.restore(); });
      legs.forEach(L => { const dir = yaw > .1 ? 1 : L.sd; shoe(g, L.foot[0], L.foot[1] + 18, yaw > .1 ? 1 : (P.run ? 1 : L.sd * 1), C, O); });
      // skirt
      if (skirt) {
        const sk = blobP([[-152, hipY - 70], [152, hipY - 70], [232 * Math.cos(yaw * .4), hipY + 250], [-232 * Math.cos(yaw * .4), hipY + 250]]);
        const skp = polyP([[-160, hipY - 80], [160, hipY - 80], [246, hipY + 270 + Math.sin(t * 3) * 6 + P.hop * 0], [190, hipY + 300], [90, hipY + 270], [0, hipY + 305], [-90, hipY + 270], [-190, hipY + 300], [-246, hipY + 270]]);
        cel(g, skp, O.skirt, O.skirtS, 40, 12, 10, true, '#7FA0FF', 12);
        g.save(); g.clip(skp); g.strokeStyle = O.skirtS; g.lineWidth = iw(5); g.beginPath(); for (let i = -3; i <= 3; i++) { g.moveTo(i * 44, hipY - 60); g.lineTo(i * 62, hipY + 300); } g.stroke(); g.fillStyle = '#fff'; g.fillRect(-300, hipY + 232, 600, 20); g.restore();
      } else {
        // belt / waist hint for kai
        const belt = polyP([[-190, hipY - 40], [190, hipY - 40], [204, hipY + 20], [-204, hipY + 20]]);
        cel(g, belt, '#1B2050', null, 0, 0, 7);
      }
    }
    // ---- torso group (rotated by lean around the hip)
    g.save(); g.translate(0, P.crouch); g.translate(0, 850); g.rotate(P.lean); g.scale(1, P.sy * (1 + breathe)); g.translate(0, -850);
    const bodyPass = (front) => {
      // arms
      [[-1, P.L], [1, P.R]].forEach(([sd, H]) => {
        const shx = sd * sx, shy = 330, wr = kai ? 106 : 88;
        const eh = H.eh || [190, 380], hx = shx + sd * eh[0], hy = shy + eh[1];
        const r = pickElbow(shx, shy, H.x, H.y, 405, 395, (x, y) => -Math.hypot(x - hx, y - hy));
        const elb = r.e, hnd = r.h, ang = Math.atan2(hnd[1] - elb[1], hnd[0] - elb[0]) + PI / 2;
        limb(g, [[shx, shy], elb, hnd], wr, O.jacket, O.jacketS, O.rim, O.trim);
        if (kai) { g.save(); g.lineCap = 'round'; g.strokeStyle = O.trim; g.lineWidth = iw(7); g.globalAlpha = .9; const dx = elb[0] - shx, dy = elb[1] - shy, l = Math.hypot(dx, dy); g.beginPath(); g.moveTo(shx + dx * .1, shy + dy * .1); g.lineTo(shx + dx * .9, shy + dy * .9); g.stroke(); g.restore(); }
        hand(g, C, hnd[0], hnd[1], H.st, ang + (H.st === 'open' ? 0 : 0), H.sc * (kai ? 1.05 : .95));
      });
    };
    drawTorso(g, S, C, st, O);
    bodyPass();
    g.restore();
    g.restore();
  }

  // ---------------------------------------------------------------- aura
  function aura(g, cols, amt, t, seed, cy, W, Ht) {
    if (amt <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    const br = 1 + .06 * Math.sin(t * 9), base = cy + Ht * .5;
    g.save(); g.translate(0, cy); g.scale(1, Ht / (W * 2.2)); g.globalAlpha = .6 * amt; g.fillStyle = rgr(g, 0, 0, 20, W * 1.5 * br, [[0, cols[0]], [.4, cols[1]], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.arc(0, 0, W * 1.5 * br, 0, TAU); g.fill(); g.restore();
    g.save(); g.translate(0, base - 20); g.scale(1, .16); g.globalAlpha = .9 * amt; g.fillStyle = rgr(g, 0, 0, 10, W * 1.7, [[0, '#fff'], [.3, cols[0]], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.arc(0, 0, W * 1.7, 0, TAU); g.fill(); g.restore();
    const n = 15;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - .5, hh = Ht * (.32 + .3 * hash(i * 3 + seed)) * (.75 + .25 * Math.sin(t * 11 + i * 2.1)) * (1 - Math.abs(u) * .7);
      const bx = u * W * 1.7, by = base - 40, bw = W * .17 * (1 - Math.abs(u) * .5), sx = Math.sin(t * 6 + i) * 22, tip = by - hh;
      const p = new Path2D(); p.moveTo(bx - bw, by); p.quadraticCurveTo(bx - bw * .5 + sx, by - hh * .55, bx + u * 120 + sx * 1.5, tip); p.quadraticCurveTo(bx + bw * .5 + sx, by - hh * .5, bx + bw, by); p.closePath();
      g.globalAlpha = .4 * amt; g.fillStyle = cols[1]; g.fill(p);
      g.globalAlpha = .55 * amt; g.save(); g.translate(bx, by); g.scale(.5, .72); g.translate(-bx, -by); g.fillStyle = cols[0]; g.fill(p); g.restore();
    }
    for (let i = 0; i < 24; i++) {
      const sp = 1.1 + hash(i + seed) * 1.4, ph = (t * sp + hash(i * 7 + seed)) % 1, x = (hash(i * 3.3 + seed) - .5) * W * 2.6, y = base - ph * Ht * .95, L = 80 + 160 * hash(i * 5 + seed);
      g.globalAlpha = amt * (1 - ph) * .9; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = 6 + hash(i) * 7; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + L); g.stroke();
    }
    g.restore();
  }

  function headPass(g, S, C, st, P, phase) {
    const t = st.t, breathe = Math.sin(t * 2.1 + st.seed) * .012;
    g.save(); g.translate(P.shx, P.hop < 0 ? P.hop : -P.hop); g.translate(0, P.crouch); g.translate(0, 850); g.rotate(P.lean); g.scale(1, P.sy * (1 + breathe)); g.translate(0, -850);
    g.translate(P.headDx, Math.sin(t * 2.1 + st.seed + .6) * 5); g.translate(0, 250); g.rotate(P.headRot); g.translate(0, -250);
    drawHead(g, S, C, st, phase); g.restore();
  }

  // ---------------------------------------------------------------- VILLAIN: Lord Buffering
  const VFACE = {
    neutral: { e: .85, tilt: .55 }, angry: { e: .8, tilt: .85 }, smug: { e: .5, tilt: .35 }, happy: { arc: 1 }, joy: { arc: 1 }, sparkle: { arc: 1 },
    wow: { e: 1.15, tilt: -.1, pupil: .5 }, shock: { e: 1.15, tilt: -.15, pupil: .45 }, shout: { e: .55, tilt: 1 }, worried: { e: .95, tilt: -.5 },
  };
  const VPOSE = {
    idle: { L: [-330, 130], R: [330, 130] }, wow: { L: [-330, -90], R: [330, -90] }, point: { L: [-310, 150], R: [660, -20] }, cheer: { L: [-430, -330], R: [430, -330] },
    powerup: { L: [-400, -120], R: [400, -120] }, shout: { L: [-540, -60], R: [540, -60] }, run: { L: [-420, 90], R: [-330, -110] }, shock: { L: [-290, -300], R: [290, -300] },
    fist: { L: [-330, 140], R: [470, -110] }, guard: { L: [110, 70], R: [-110, 70], front: 1 },
  };
  function staticArm(g, sx, sy, hx, hy, t, seed, w, big) {
    const tick = Math.floor(t * 14), n = 8, pts = [];
    const dx = hx - sx, dy = hy - sy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) { const f = i / n, amp = Math.sin(f * PI) * 30 + 6, j = (hash(tick * 3.1 + i * 7.7 + seed) - .5) * 2 * amp, bow = Math.sin(f * PI) * 26 * (hx > 0 ? -1 : 1) * 0; pts.push([sx + dx * f + nx * (j + bow), sy + dy * f + ny * (j + bow)]); }
    g.lineJoin = 'round'; g.lineCap = 'round';
    const path = (ox, oy) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy)); };
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55; path(-9, 0); g.strokeStyle = '#FF2A5A'; g.lineWidth = w; g.stroke(); path(9, 0); g.strokeStyle = '#25E0FF'; g.stroke(); g.restore();
    path(0, 0); g.strokeStyle = '#05030C'; g.lineWidth = w + iw(16); g.stroke(); path(0, 0); g.strokeStyle = '#2A1656'; g.lineWidth = w; g.stroke(); path(-6, -8); g.strokeStyle = '#7A4AE0'; g.lineWidth = w * .18; g.globalAlpha = .8; g.stroke(); g.globalAlpha = 1;
    // static noise blocks
    const cols = ['#FFFFFF', '#7FEFFF', '#FF4FD8', '#0A0618', '#FF3A4A', '#B9A0FF'];
    for (let i = 0; i < 46; i++) { const f = hash(i * 1.9 + tick * .37 + seed) , k = Math.floor(f * n), q = (f * n) % 1, a = pts[Math.min(k, n)], b = pts[Math.min(k + 1, n)], x = lerp(a[0], b[0], q) + (hash(i * 3.3 + tick + seed) - .5) * w * 1.1, y = lerp(a[1], b[1], q) + (hash(i * 5.1 + tick * 1.3) - .5) * w * 1.1, z = 6 + hash(i + tick) * 16; g.fillStyle = cols[Math.floor(hash(i * 9.1 + tick * .77 + seed) * cols.length)]; g.fillRect(x, y, z * (1 + hash(i * 2.2) * 2), z); }
    // claw hand
    g.save(); g.translate(hx, hy); const a0 = Math.atan2(dy, dx); g.rotate(a0);
    for (let i = -2; i <= 2; i++) { const j = hash(i * 4.4 + tick * .9 + seed) * 16, p = new Path2D(); p.moveTo(10, i * 22); p.lineTo(90 + j + (i === 0 ? 20 : 0) * (big ? 1.5 : 1), i * 38 + (hash(i + tick) - .5) * 14); p.lineTo(10, i * 22 + 26); p.closePath(); g.fillStyle = '#2A1656'; g.fill(p); g.lineWidth = iw(7); g.strokeStyle = '#05030C'; g.stroke(p); g.fillStyle = '#7FEFFF'; g.globalAlpha = .8; g.beginPath(); g.moveTo(90 + j, i * 38); g.lineTo(60 + j * .5, i * 30 - 4); g.lineTo(62 + j * .5, i * 30 + 6); g.fill(); g.globalAlpha = 1; }
    g.beginPath(); g.roundRect(-46, -42, 86, 84, 16); g.fillStyle = '#2A1656'; g.fill(); g.lineWidth = iw(8); g.strokeStyle = '#05030C'; g.stroke();
    for (let i = 0; i < 9; i++) { g.fillStyle = cols[Math.floor(hash(i * 3 + tick * 1.3 + seed) * cols.length)]; g.fillRect(-40 + hash(i * 5 + tick) * 70, -36 + hash(i * 7 + tick * 2) * 70, 12, 9); }
    g.restore();
  }
  function drawBuffering(g, st, P, F, bust) {
    const { t, seed } = st, R = 250, tick = Math.floor(t * 12);
    const shk = st.shock, stutter = hash(tick * 2.3 + seed) > .92 ? (hash(tick + seed) - .5) * 30 : 0;
    const hov = Math.sin(t * 2.4) * 10;
    g.save(); g.translate(stutter + shk * (hash(tick * 5) - .5) * 24, hov + shk * (hash(tick * 3) - .5) * 20);
    const sc = 1 + (st.powerup ? .04 * Math.sin(t * 14) : 0) + st.shout * .05 * Math.sin(t * 22);
    g.scale(sc, sc);
    // ice crown (behind)
    [[-128, 96, 46], [-108, 140, 50], [-90, 190, 62], [-72, 146, 50], [-54, 100, 42]].forEach(([a, h, w], i) => {
      const ar = a * PI / 180, bx = Math.cos(ar) * R * .93, by = Math.sin(ar) * R * .93, tx = Math.cos(ar + (a + 90) * .0016) * (R + h), ty = Math.sin(ar) * (R + h) - 0;
      const p = polyP([[bx - w * .5 * Math.sin(ar) * -1 - w * .5, by + 6], [tx, ty], [bx + w * .5 + 0, by + 6]]);
      cel(g, p, '#7FE9FF', '#2B9AE0', -14, 10, 9, false); g.save(); g.clip(p); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(tx - w * .3, ty, w * .18, h); g.restore();
    });
    const arms = (front) => { const D = VPOSE[st.poseName] || VPOSE.idle; if (!!D.front !== front) return; const wob = (i) => Math.sin(t * 2.2 + i * 2) * 14; staticArm(g, -205, 40, D.L[0] + wob(0) + (st.run ? 0 : 0), D.L[1] + wob(1), t, seed + 1, 62); staticArm(g, 205, 40, D.R[0] + wob(2), D.R[1] + wob(3), t, seed + 2, 62, st.poseName === 'fist'); };
    arms(false);
    // orb
    const orb = new Path2D(); orb.ellipse(0, 0, R, R * .98, 0, 0, TAU);
    g.fillStyle = rgr(g, -90, -110, 10, R * 1.4, [[0, '#5B33A8'], [.3, '#28134A'], [.75, '#0C0620'], [1, '#04020A']]); g.fill(orb);
    g.save(); g.clip(orb);
    // rim lights: violet bottom-right, ice bottom-left
    g.lineWidth = 30; g.strokeStyle = '#B45CFF'; g.globalAlpha = .75; g.beginPath(); g.ellipse(-22, -22, R, R * .98, 0, -.3, 1.5); g.stroke();
    g.strokeStyle = '#66E4FF'; g.globalAlpha = .5; g.beginPath(); g.ellipse(24, -18, R, R * .98, 0, 1.75, 2.9); g.stroke(); g.globalAlpha = 1;
    // cracks
    const crk = (i) => { const a = (i / 7) * TAU + hash(i + 3) * .5 + .3, pts = [[Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02]]; let r = R * 1.02, ang = a + PI; const seg = 5 + Math.floor(hash(i) * 3); for (let k = 0; k < seg; k++) { r -= 30 + hash(i * 3 + k) * 34; ang += (hash(i * 7 + k) - .5) * .8; pts.push([Math.cos(a) * r + Math.cos(ang + 1.57) * (hash(i * 5 + k) - .5) * 60, Math.sin(a) * r + Math.sin(ang + 1.57) * (hash(i * 5 + k) - .5) * 60]); } return pts; };
    const glowK = .5 + .5 * (st.crackGlow || 0) + .15 * Math.sin(t * 5);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 7; i++) { if (st.shock === 0 && i > 4 + st.powerup * 2) continue; const c = crk(i); g.beginPath(); c.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = '#3FD4FF'; g.globalAlpha = .28 * glowK; g.lineWidth = 22; g.stroke(); g.globalAlpha = 1; g.strokeStyle = '#B8F6FF'; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
    // glitch slices
    for (let i = 0; i < 5; i++) { if (hash(tick * 1.7 + i * 9.1 + seed) > .38 + st.shock * -.3) continue; const y = -R + hash(tick + i * 3.3) * R * 2, h = 6 + hash(i + tick * 2) * 26, off = (hash(tick * 4 + i) - .5) * 60; g.fillStyle = ['rgba(37,224,255,.55)', 'rgba(255,42,90,.5)', 'rgba(255,255,255,.35)'][i % 3]; g.fillRect(-R + off, y, R * 2, h); }
    // scanlines
    g.globalAlpha = .1; g.fillStyle = '#000'; for (let y = -R; y < R; y += 10) g.fillRect(-R, y, R * 2, 4); g.globalAlpha = 1;
    g.restore();
    g.lineWidth = iw(13); g.strokeStyle = '#05030C'; g.stroke(orb);
    // gloss highlight
    g.save(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-120, -150, 78, 40, -.75, 0, TAU); g.fill(); g.globalAlpha = .55; g.beginPath(); g.ellipse(-170, -80, 12, 26, -.5, 0, TAU); g.fill(); g.globalAlpha = .28; g.fillStyle = '#B9A0FF'; g.beginPath(); g.ellipse(90, 190, 90, 26, .3, 0, TAU); g.fill(); g.restore();
    // ---- face: spinner
    const cx = 0, cy = 64, rr = 96, step = Math.floor(t / .85), mis = st.shock * 26;
    g.save(); g.beginPath(); g.arc(cx, cy, rr + 44, 0, TAU); g.fillStyle = 'rgba(4,2,16,.55)'; g.fill(); g.lineWidth = iw(5); g.strokeStyle = 'rgba(127,233,255,.5)'; g.stroke();
    g.globalCompositeOperation = 'lighter'; g.fillStyle = rgr(g, cx, cy, 10, rr + 60, [[0, 'rgba(90,209,255,.25)'], [1, 'rgba(90,209,255,0)']]); g.fillRect(cx - 200, cy - 200, 400, 400); g.globalCompositeOperation = 'source-over';
    const jit = st.shout * 12;
    for (let i = 0; i < 12; i++) {
      const rank = ((i - step) % 12 + 12) % 12, a = i / 12 * TAU - PI / 2, d = mis * hash(i * 3.7 + tick * .2), sz = 23 - rank * 1.25, al = 1 - rank * .075;
      const x = cx + Math.cos(a) * (rr + d) + (hash(tick + i) - .5) * jit, y = cy + Math.sin(a) * (rr + d) + (hash(tick * 2 + i) - .5) * jit;
      g.globalAlpha = al; g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fillStyle = rank < 2 ? '#FFFFFF' : '#BFEFFF'; g.fill(); g.lineWidth = iw(4); g.strokeStyle = '#0B2A5A'; g.stroke();
    }
    g.globalAlpha = 1;
    if (K.det || bust) { g.save(); if (st.flip) g.scale(-1, 1); g.font = '900 58px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; const gl = hash(tick * 1.3 + seed) > .85 ? 5 : 0; g.fillStyle = 'rgba(255,42,90,.7)'; g.fillText('99%', cx - 3 - gl, cy + 3); g.fillStyle = 'rgba(37,224,255,.7)'; g.fillText('99%', cx + 3 + gl, cy - 2); g.fillStyle = '#EAFBFF'; g.fillText('99%', cx, cy); g.restore(); }
    g.restore();
    // ---- eyes
    [-1, 1].forEach(sd => {
      const ex = sd * 112, ey = -78;
      g.save(); g.translate(ex, ey);
      g.globalCompositeOperation = 'lighter'; g.fillStyle = rgr(g, 0, 0, 6, 110, [[0, 'rgba(255,60,80,.75)'], [1, 'rgba(255,60,80,0)']]); g.fillRect(-120, -120, 240, 240); g.globalCompositeOperation = 'source-over';
      const hh = (hash(tick * 2.9 + sd + seed) > .93) ? 5 * sd : 0;
      if (F.arc) { g.lineCap = 'round'; g.strokeStyle = '#05030C'; g.lineWidth = iw(22); g.beginPath(); g.moveTo(-46, 18); g.quadraticCurveTo(0, -46, 46, 18); g.stroke(); g.strokeStyle = '#FF3A4A'; g.lineWidth = 12; g.stroke(); g.strokeStyle = '#FFD0C0'; g.lineWidth = 4; g.stroke(); }
      else {
        const sh = eyeShape(50, 58, Math.min(1.2, F.e) * (1 - st.blink * .9), F.tilt, sd, 0);
        g.fillStyle = rgr(g, 0, 4, 4, 62, [[0, '#FFF6E0'], [.3, '#FF8070'], [.75, '#FF2038'], [1, '#B00A28']]); g.fill(sh.path);
        g.save(); g.clip(sh.path); const ax = st.look.x * 14, ay = st.look.y * 8; g.beginPath(); g.ellipse(ax + hh, ay, 9 * (F.pupil ? F.pupil * 1.6 : 1), 40, 0, 0, TAU); g.fillStyle = '#26000C'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ax - 14, ay - 20, 8, 0, TAU); g.fill(); g.restore();
        g.lineJoin = 'round'; g.lineWidth = iw(9); g.strokeStyle = '#05030C'; g.stroke(sh.path);
      }
      // angry brow ridge
      const bt = F.arc ? -.2 : F.tilt; g.save(); g.rotate(-sd * bt * .5 * -1 * .7 * 1); g.beginPath(); g.moveTo(-58, -6); g.lineTo(58, -6 + sd * -1 * 0); g.lineTo(58, -20); g.lineTo(-58, -20); g.closePath(); g.restore();
      const by = -58 - (F.e > 1 ? 14 : 0), bp = polyP([[-sd * 62, by + bt * 34 + 14], [sd * 64, by - bt * 20 + 10], [sd * 64, by - bt * 20 - 12], [-sd * 62, by + bt * 34 - 14]]);
      cel(g, bp, '#1A0E36', '#0B0620', 6, 8, 8, true, '#B45CFF', 8);
      g.restore();
    });
    // little fangs / sparks hint under the spinner: cute-scary tiny fangs on the disc
    arms(true);
    g.restore();
  }

  // ---------------------------------------------------------------- main entry
  const ZOOM_NOTE = null;
  function flapOf(t, seed) { return clamp((.5 + .5 * Math.sin(t * 21 + seed)) * (.55 + .45 * Math.sin(t * 6.3 + seed * 2 + 1)) * 1.15); }
  V.hero = function (ctx, who, x, y, s = 1, o = {}) {
    const isV = who === 'buffering'; if (!isV && !CH[who]) return;
    const t = o.t || 0, seed = o.seed || 1, bust = !!o.bust;
    const u = o.t0 == null ? 9 : t - o.t0; if (u < 0) return;
    let pop = o.t0 == null ? 1 : spring(u), alpha = o.alpha ?? 1;
    if (o.tOut != null && t > o.tOut) { const w = (t - o.tOut) / .3; if (w >= 1) return; pop *= 1 - A.ease.inBack(clamp(w)); alpha *= 1 - A.smooth(.6, 1, w); }
    if (pop <= .001) return;
    const poseName = POSE_NAMES.includes(o.pose) ? o.pose : 'idle';
    let faceName = o.face || POSE_FACE[poseName]; if (isV && !o.face) faceName = ({ idle: 'angry', wow: 'shock', point: 'smug', cheer: 'happy', powerup: 'angry', shout: 'shout', run: 'angry', shock: 'shock', fist: 'angry', guard: 'smug' })[poseName];
    const yaw = isV ? 0 : (VIEW_YAW[o.view || 'front'] ?? 0);
    let look = o.look; if (look == null || look === 'cam') look = { x: -yaw * .9 + Math.sin(t * .7 + seed) * .06, y: Math.sin(t * .9 + seed) * .05 }; else look = { x: look.x || 0, y: look.y || 0 };
    const mouth = o.mouth != null ? o.mouth : (o.talk ? flapOf(t, seed) : 0);
    const st = { who, flip: !!o.flip, t, seed, yaw, look, blink: A.blink(t, seed), mouth, lift: 0, run: 0, poseName, shock: 0, powerup: 0, shout: 0, crackGlow: 0 };
    const k = bust ? s : s * (isV ? 1 : .32);
    K.iw = bust ? 1 : (isV ? 1.2 : Math.min(2.4, .5 / Math.max(.15, k) * 1)); K.iw = bust ? 1 : clamp(.42 / Math.max(.12, k), 1, 2.6); K.det = (bust || k > .5) ? 1 : 0;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
    const sxp = k * pop, syp = k * (pop + (pop - 1) * .3);
    if (isV) {
      const F = Object.assign({ e: .85, tilt: .5, pupil: 1 }, VFACE[faceName] || VFACE.angry);
      st.shock = poseName === 'shock' ? 1 : 0; st.powerup = poseName === 'powerup' ? 1 : 0; st.shout = poseName === 'shout' ? 1 : 0; st.crackGlow = st.powerup;
      const ay = bust ? 0 : -250 - 14;
      ctx.translate(0, ay * k); ctx.scale(sxp, syp);
      // glitch-in while popping
      const au = Math.max(o.aura || 0, st.powerup, st.shout * .8);
      if (!bust && o.shadow !== false) { ctx.save(); ctx.fillStyle = 'rgba(10,0,30,.35)'; ctx.beginPath(); ctx.ellipse(0, 250 + 60 + 20, 200 * (1 - Math.sin(t * 2.4) * .06), 26, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      aura(ctx, ['#FF6A7A', '#8A2CFF'], au, t, seed + 3, -60, 330, 1150);
      if (poseName === 'run') { ctx.rotate(.12); }
      drawBuffering(ctx, st, null, F, bust);
    } else {
      const C = CH[who], P = poseData(poseName, t, who), F = Object.assign({}, FACES[faceName] || FACES.neutral);
      st.F = F; st.lift = P.lift; st.run = P.run; st.smile = F.arc ? 0 : (F.blush > .6 ? .3 : 0);
      if (o.mouth != null || o.talk) { /* lip flap handled in drawMouth */ }
      ctx.scale(sxp, syp);
      if (!bust) ctx.translate(0, -FY);
      const au = Math.max(o.aura || 0, P.aura);
      if (!bust && o.shadow !== false) { ctx.save(); ctx.fillStyle = 'rgba(8,10,40,.32)'; const hj = Math.abs(P.hop) / 400; ctx.beginPath(); ctx.ellipse(0, FY + 16, 330 * (1 - hj), 46 * (1 - hj), 0, 0, TAU); ctx.fill(); ctx.restore(); }
      aura(ctx, who === 'kai' ? ['#FFF3C4', '#FFB020'] : ['#D8FFF8', '#6A5CFF'], au, t, seed, bust ? 250 : 800, bust ? 380 : 430, bust ? 1000 : 2200);
      headPass(ctx, who, C, st, P, 'back');
      drawBody(ctx, who, C, st, P, bust);
      headPass(ctx, who, C, st, P, 'front');
    }
    ctx.restore();
  };
  V.heroFaces = FACE_NAMES.slice(); V.heroPoses = POSE_NAMES.slice();
  V.heroInfo = who => ({ kai: { name: 'Kai', colors: { hair: '#35B0FF', eyes: '#FFA81C', gold: '#FFC940' } }, noa: { name: 'Noa', colors: { hair: '#5A34B8', eyes: '#22D8C4', scarf: '#2F6BFF' } }, buffering: { name: 'Lord Buffering', colors: { body: '#28134A', eyes: '#FF2038', ice: '#7FE9FF' } } })[who];
})();
