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
