// ============================================================================
// kits/family.js — SABA MOSHE & NOA character rigs.
//
//   A.drawSaba(ctx, x, y, scale, o)   standing height ≈ 560 px @ scale 1
//   A.drawNoa (ctx, x, y, scale, o)   standing height ≈ 400 px @ scale 1 (top of hair puff)
//   A.SABA_COLORS, A.NOA_COLORS       palettes
//   A.SABA_GESTURES, A.NOA_GESTURES   arm presets {L:[sh,el], R:[sh,el]} (for custom blends)
//
// Characters face screen-RIGHT in a gentle 3/4 view by default. `o.flip` mirrors (face left).
// "L" = the near arm/leg (screen-left when unflipped), "R" = the far one (on the facing side).
// All coordinates below are in unscaled character units relative to the anchor (x,y); +x = facing dir.
//
// ANCHOR (x,y): ground contact point.
//   Saba 'stand' / 'jump' : between the feet on the floor (jump: the floor under him).
//   Saba 'sit'  / 'rise'  : SEAT contact point (butt on cushion). Feet rest o.floor (150) below it.
//                            'rise' at o.rise=1 == standing with feet at (x, y+o.floor).
//   Noa  'stand'/'crouch' : between the feet.   Noa 'sit': seat contact (feet dangle o.floor=100 below;
//                            o.sitStyle:'floor' = cross-legged on the floor, anchor = floor).
//
// COMMON OPTIONS (all optional)
//   t            global time (breathing, blinks, secondary motion). Default 0.
//   pose, mood, gesture   see bible. Unknown values fall back to defaults.
//   mouth        0..1 lip-sync openness. Default A.mouth('SABA'|'NOA', t).
//   look [dx,dy] eye direction -1..1 (also nudges head turn/tilt).
//   flip         mirror horizontally (face left).
//   moodFrom, moodK        blend face/body from moodFrom (k=0) to mood (k=1).
//   gestureFrom, gestureK  blend arm pose from gestureFrom (k=0) to gesture (k=1).
//   armL, armR   [shoulderDeg, elbowDeg] override. shoulder: 0 = hanging down, 90 = straight out
//                sideways (away from body; for R this is forward), 180 = straight up, negative =
//                swings across the front of the body. elbow: forearm angle = shoulder + elbow
//                (negative folds the forearm across the body, positive continues outward/up).
//   handL, handR [x,y] IK target for the wrist (anchor-local units) — overrides armL/armR.
//   handShapeL/R 'relax'|'open'|'fist'|'point'|'grip'
//   headTilt     degrees (+ = clockwise / toward facing side).   turn  -1..1 face 3/4 turn (default 0.25)
//   browRaise    -1..1 add to brows (both).    browAngle -1..1 add (+ = inner ends up / worried).
//   browL, browR extra per-brow raise.        lid 0..1 extra upper-lid closure.  happy 0..1 cheek squint.
//   smile        -1..1 override mouth curve.   jaw 0..1 extra jaw drop.
//   lean         -1..1 torso lean (+ = toward facing side / forward).
//   squash       -0.5..0.5 squash(+)/stretch(-) about the anchor.
//   shoulders    px shoulder raise (shrug/tension).
//   breath       breathing amplitude multiplier (default 1).   idle 0..1 idle sway/eye-darts (default 1).
//   tremble      0..1 nervous shake (horror sets it).
//   light [lx,ly] screen direction TOWARD the key light (default upper-left [-0.6,-0.8]).
//   rimColor     rim light colour (default warm lamp '#ffd7a0'), rimA 0..1 rim strength (default 0.55).
//   lw           outline width in screen px (default ~5 at scale 1, clamped 2.5..7).
//   shadow       true/false contact shadow on the floor (default: true for stand/jump/crouch).
//   vel [vx,vy]  apparent velocity px/s → scarf/curls/drawstrings trail opposite to motion.
//
// SABA-ONLY:  rise 0..1 (pose 'rise'), air 0..1 (pose 'jump' height, default 1 ≈ 110 px),
//   floor (seat→floor px, 150), scarfWave 0..1, armrestX (122) / armrestY (48 above seat) for 'grip',
//   glint 0..1 force a glasses glint sweep.
// NOA-ONLY:   hug 0..1 (arms wrap forward/up round Saba's neck, eyes close happily),
//   reachTo [x,y] target for 'reach' (default: floor level ~125 px in front when crouched),
//   sitStyle 'hang'|'floor', floor (seat→feet, 100), bounce 0..1 extra curl bounce,
//   mugTilt 0..1 (lift mug to lips), steam 0..1 (default 1).
// ============================================================================
(() => {
  const O = A.OUTLINE, D = Math.PI / 180;
  const lerp = A.lerp, clamp = A.clamp;

  const SC = (A.SABA_COLORS = {
    skin: '#c98f65', skinSh: '#a1674c', skinHi: '#e3ad84', nose: '#c97a5e', blush: '#e0705c', lip: '#9c4a45',
    hair: '#f6f3ec', hairSh: '#c4c1d2',
    cardigan: '#8b5634', cardiganSh: '#633822', trim: '#a9713f', trimSh: '#7c4f2b', button: '#e8d3a8',
    shirt: '#f3eee4', shirtSh: '#cbc3cc', trousers: '#7e818e', trousersSh: '#5a5c6e', belt: '#3b2a23',
    sock: '#eee8dc', sockSh: '#c4bfc7', sandal: '#704427', sandalSh: '#4a2b18',
    scarfY: '#ffd21f', scarfYSh: '#d9a10c', scarfB: '#1f4fbf', scarfBSh: '#163a8e',
    glasses: '#1d1519', lens: 'rgba(200,230,255,0.13)', iris: '#4a2e1c', white: '#fbf7ef',
    mouth: '#5b1c26', tongue: '#df717b', teeth: '#fbf6ea',
  });
  const NC = (A.NOA_COLORS = {
    skin: '#d9a57c', skinSh: '#b77e5d', skinHi: '#f0c29a', blush: '#f08a7c', freckle: '#a4633f', lip: '#b8584f',
    hair: '#3d2418', hairSh: '#26130b', hairHi: '#71483a',
    scrunchie: '#ffc928', scrunchieSh: '#d7960f',
    hoodie: '#2aa198', hoodieSh: '#1b716f', trim: '#3dc2b5', trimSh: '#228a84', string: '#f2f0ea',
    jeans: '#3f60a0', jeansSh: '#2a4274', jeansHi: '#6286c8',
    sock: '#f7d3de', sockSh: '#d8a2b6', sockDot: '#fff6f9',
    iris: '#5a3420', white: '#fdfaf4', pin: '#1f4fbf', pinBg: '#ffffff',
    mug: '#f5efe4', mugSh: '#cfc4bd', mugBand: '#e2574c', cocoa: '#6b3a22',
    mouth: '#5b1c26', tongue: '#e8818a', teeth: '#fffaf0',
  });

  // ---------------------------------------------------------------- helpers
  const mixCache = new Map();
  const mix = (a, b, k) => {
    const key = a + b + k.toFixed(2); let v = mixCache.get(key);
    if (!v) { v = A.mixc(a, b, k); if (mixCache.size > 4000) mixCache.clear(); mixCache.set(key, v); }
    return v;
  };
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const lerpArr = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  const mixObj = (a, b, k) => { const r = {}; for (const key in b) r[key] = typeof b[key] === 'number' ? lerp(a[key] ?? b[key], b[key], k) : (k < 0.5 ? a[key] ?? b[key] : b[key]); return r; };
  // light vector expressed in a rotated / mirrored child frame
  const RR = (R, ang, my = 1, mx = 1) => { const l = rot(R.L, -ang); return Object.assign({}, R, { L: [l[0] * mx, l[1] * my] }); };

  // ellipse as its own subpath (no connecting line)
  const E = (ctx, x, y, rx, ry, r = 0) => { ctx.moveTo(x + Math.cos(r) * rx, y + Math.sin(r) * rx); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), r, 0, A.TAU); };
  const C = (ctx, x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, Math.abs(r), 0, A.TAU); };
  // smooth closed blob (Catmull-Rom) WITHOUT beginPath
  const blob = (ctx, pts) => {
    const n = pts.length, P = i => pts[(i + n) % n];
    ctx.moveTo(P(0)[0], P(0)[1]);
    for (let i = 0; i < n; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  };
  // tapered tube through points with radii (rounded joints + caps)
  // capsule (tapered) between two points
  const cap2 = (ctx, p0, p1, r0, r1) => {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 0.001;
    const a = Math.atan2(dy, dx), dr = clamp((r0 - r1) / l, -0.95, 0.95), ang = Math.acos(-dr);
    ctx.moveTo(p0[0] + Math.cos(a + ang) * r0, p0[1] + Math.sin(a + ang) * r0);
    ctx.arc(p0[0], p0[1], r0, a + ang, a - ang + A.TAU, false);
    ctx.arc(p1[0], p1[1], r1, a - ang, a + ang, false);
    ctx.closePath();
  };
  // tapered limb through points = union of capsules (outline via stroke-then-fill in part())
  const tube = (ctx, P, Rr) => { for (let i = 0; i < P.length - 1; i++) cap2(ctx, P[i], P[i + 1], Rr[i], Rr[i + 1]); };

  // A shaded, outlined part. build(ctx) adds subpaths (no beginPath). Union-safe outline (stroke then fill).
  // Cel shadow = part minus itself shifted toward light by d; rim = thin crescent on the light side.
  function part(ctx, R, build, fill, sh, o) {
    o = o || {};
    const lw = o.lw != null ? o.lw : R.lw;
    ctx.beginPath(); build(ctx);
    if (lw > 0) { ctx.lineWidth = lw * 2; ctx.strokeStyle = O; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
    ctx.fillStyle = fill; ctx.fill();
    const rimA = o.rim === false ? 0 : R.rimA * (o.rimK ?? 1);
    if (!sh && rimA <= 0.01) return;
    const L = R.L, d = o.d ?? 12, r = o.r ?? 4.5;
    ctx.save(); ctx.clip();
    if (sh) {
      ctx.fillStyle = sh; ctx.fillRect(-3000, -3000, 6000, 6000);
      ctx.beginPath(); ctx.translate(L[0] * d, L[1] * d); build(ctx); ctx.translate(-L[0] * d, -L[1] * d); ctx.clip();
    }
    if (rimA > 0.01) {
      ctx.fillStyle = mix(fill, R.rimC, rimA); ctx.fillRect(-3000, -3000, 6000, 6000);
      ctx.beginPath(); ctx.translate(-L[0] * r, -L[1] * r); build(ctx); ctx.translate(L[0] * r, L[1] * r);
      ctx.fillStyle = fill; ctx.fill();
    } else { ctx.fillStyle = fill; ctx.fillRect(-3000, -3000, 6000, 6000); }
    ctx.restore();
  }
  const strokeLine = (ctx, w, col = O) => { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };

  // ---------------------------------------------------------------- 2-bone IK
  // returns [shoulderDeg, elbowDeg] in the arm convention for side s (-1 near/left, +1 far/right)
  function ik(sh, target, l1, l2, s, down = 0) {
    let dx = target[0] - sh[0], dy = target[1] - sh[1];
    let dist = Math.hypot(dx, dy); const dd = clamp(dist, Math.abs(l1 - l2) + 1, l1 + l2 - 0.5);
    const phi = Math.atan2(dy, dx), cA = clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1), a = Math.acos(cA);
    let best = null;
    for (const sg of [1, -1]) {
      const ang = phi + sg * a, ex = sh[0] + Math.cos(ang) * l1, ey = sh[1] + Math.sin(ang) * l1;
      const score = s * (ex - sh[0]) * (1 - down) + (0.6 + down * 3) * (ey - sh[1]);
      if (!best || score > best.score) best = { score, ex, ey };
    }
    const tx = sh[0] + Math.cos(phi) * dd, ty = sh[1] + Math.sin(phi) * dd;
    const a1 = Math.atan2(s * (best.ex - sh[0]), best.ey - sh[1]) / D;
    const a2 = Math.atan2(s * (tx - best.ex), ty - best.ey) / D;
    let el = a2 - a1; while (el > 180) el -= 360; while (el < -180) el += 360;
    return [a1, el];
  }
  // arm joints from angles
  function armPts(sh, a1, el, l1, l2, s) {
    const d1 = [s * Math.sin(a1 * D), Math.cos(a1 * D)], a2 = a1 + el, d2 = [s * Math.sin(a2 * D), Math.cos(a2 * D)];
    const e = [sh[0] + d1[0] * l1, sh[1] + d1[1] * l1], w = [e[0] + d2[0] * l2, e[1] + d2[1] * l2];
    return { e, w, dir: Math.atan2(d2[1], d2[0]) };
  }

  // ---------------------------------------------------------------- hands
  // drawn in wrist frame: +x along forearm, thumb toward +y (caller mirrors with scale(1,-1))
  function hand(ctx, R, kind, sz, skin, skinSh) {
    const cap = (c, x0, y0, x1, y1, r0, r1) => tube(c, [[x0, y0], [x1, y1]], [r0, r1 ?? r0]);
    const lw = R.lw * 0.85;
    if (kind === 'open') {
      part(ctx, R, c => {
        E(c, sz * 0.72, 0, sz * 0.72, sz * 0.7);
        const fy = [-0.52, -0.18, 0.16, 0.48], fa = [-0.38, -0.12, 0.1, 0.32], fl = [0.62, 0.78, 0.74, 0.6];
        for (let i = 0; i < 4; i++) cap(c, sz * 1.1, fy[i] * sz, sz * 1.1 + Math.cos(fa[i]) * fl[i] * sz, fy[i] * sz + Math.sin(fa[i]) * fl[i] * sz, sz * 0.2, sz * 0.18);
        cap(c, sz * 0.55, sz * 0.5, sz * 0.9, sz * 1.05, sz * 0.22, sz * 0.19);
      }, skin, skinSh, { d: sz * 0.25, lw });
      ctx.beginPath(); ctx.moveTo(sz * 0.55, -sz * 0.1); ctx.quadraticCurveTo(sz * 0.8, sz * 0.15, sz * 0.62, sz * 0.38); strokeLine(ctx, lw * 0.5, mix(skinSh, '#1a1330', 0.4));
    } else if (kind === 'fist' || kind === 'point' || kind === 'grip') {
      part(ctx, R, c => {
        E(c, sz * 0.72, 0, sz * 0.8, sz * 0.74);
        const ky = [-0.5, -0.17, 0.16, 0.48];
        for (let i = 0; i < 4; i++) if (!(kind === 'point' && i === 3)) C(c, sz * 1.35, ky[i] * sz * 0.92, sz * 0.26);
        if (kind === 'point') cap(c, sz * 1.25, sz * 0.46, sz * 2.25, sz * 0.36, sz * 0.2, sz * 0.18);
      }, skin, skinSh, { d: sz * 0.25, lw });
      // finger creases
      ctx.beginPath();
      for (const y of [-0.33, 0, 0.32]) { if (kind === 'point' && y > 0.3) continue; ctx.moveTo(sz * 1.18, y * sz); ctx.lineTo(sz * 1.5, y * sz * 0.95); }
      strokeLine(ctx, lw * 0.5, mix(skinSh, '#1a1330', 0.45));
      // thumb wrapped across
      part(ctx, R, c => cap(c, sz * 0.55, sz * 0.62, sz * 1.18, sz * 0.2, sz * 0.24, sz * 0.2), skin, skinSh, { d: sz * 0.18, lw });
    } else { // relax (mitten-like, slightly curled)
      part(ctx, R, c => {
        E(c, sz * 0.72, 0, sz * 0.74, sz * 0.72);
        E(c, sz * 1.35, -sz * 0.06, sz * 0.52, sz * 0.62, 0.15);
        cap(c, sz * 0.6, sz * 0.52, sz * 1.05, sz * 0.8, sz * 0.22, sz * 0.18);
      }, skin, skinSh, { d: sz * 0.25, lw });
      ctx.beginPath();
      ctx.moveTo(sz * 1.2, -sz * 0.3); ctx.lineTo(sz * 1.55, -sz * 0.36);
      ctx.moveTo(sz * 1.22, sz * 0.02); ctx.lineTo(sz * 1.6, sz * 0.0);
      strokeLine(ctx, lw * 0.5, mix(skinSh, '#1a1330', 0.45));
    }
  }
  function drawHand(ctx, R, w, dir, kind, sz, s, skin, skinSh) {
    ctx.save(); ctx.translate(w[0], w[1]); ctx.rotate(dir); ctx.scale(1, s);
    hand(ctx, RR(R, dir, s), kind, sz, skin, skinSh);
    ctx.restore();
  }

  // ---------------------------------------------------------------- eyes
  // Eye opening as a lens between an upper and lower lid curve. F: {rx, ry, close, happy, slant (inner-corner up +),
  // look, irisR, pupilR, iris, white, inner (+1 if inner corner is at +x)}
  function eye(ctx, R, ex, ey, F) {
    const rx = F.rx, ry = F.ry, hp = clamp(F.happy, 0, 1), cl = clamp(Math.max(F.close, (hp - 0.55) * 1.6), 0, 1);
    const inY = -F.slant * ry * 0.35, outY = F.slant * ry * 0.12 + hp * ry * 0.1;
    const Lx = ex - rx, Rx = ex + rx;
    const Ly = ey + (F.inner > 0 ? outY : inY), Ry = ey + (F.inner > 0 ? inY : outY);
    const cy = (Ly + Ry) / 2;
    let top = cy - ry * 1.33 * (1 - cl) + cl * ry * 0.3 - (F.wide || 0) * ry * 0.3;
    let bot = cy + ry * 1.33 * (1 - hp * 1.45) + (F.wide || 0) * ry * 0.15;
    if (bot < top + 1) bot = top + 1;
    const k = 0.62;
    const lens = c => { c.moveTo(Lx, Ly); c.bezierCurveTo(ex - rx * k, top, ex + rx * k, top, Rx, Ry); c.bezierCurveTo(ex + rx * k, bot, ex - rx * k, bot, Lx, Ly); c.closePath(); };
    const openH = (bot - top) * 0.75;
    if (openH > 2.5) {
      ctx.save(); ctx.beginPath(); lens(ctx); ctx.fillStyle = F.white; ctx.fill(); ctx.clip();
      const ix = ex + F.look[0] * rx * 0.45, iy = ey + F.look[1] * ry * 0.35 + ry * 0.05, ir = F.irisR;
      ctx.beginPath(); C(ctx, ix, iy, ir); ctx.fillStyle = F.iris; ctx.fill();
      ctx.fillStyle = A.radial(ctx, ix, iy + ir * 0.4, 0, ir, [[0, 'rgba(255,220,170,0.45)'], [1, 'rgba(255,220,170,0)']]); ctx.fill();
      ctx.lineWidth = ir * 0.18; ctx.strokeStyle = 'rgba(20,10,20,0.55)'; ctx.stroke();
      ctx.beginPath(); C(ctx, ix, iy, F.pupilR); ctx.fillStyle = '#120a10'; ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); E(ctx, ix - ir * 0.38, iy - ir * 0.42, ir * 0.34, ir * 0.3, -0.5); ctx.fill();
      ctx.beginPath(); C(ctx, ix + ir * 0.38, iy + ir * 0.34, ir * 0.14); ctx.fill();
      // lid shadow
      ctx.beginPath(); ctx.moveTo(Lx - 4, Ly - 30); ctx.lineTo(Rx + 4, Ry - 30); ctx.lineTo(Rx + 4, Ry);
      ctx.bezierCurveTo(ex + rx * k, top + ry * 0.5, ex - rx * k, top + ry * 0.5, Lx - 4, Ly); ctx.closePath();
      ctx.fillStyle = 'rgba(80,50,90,0.22)'; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(Lx, Ly); ctx.bezierCurveTo(ex + rx * k * 0 - rx * k, bot, ex + rx * k, bot, Rx, Ry); strokeLine(ctx, R.lw * 0.55);
    }
    ctx.beginPath(); ctx.moveTo(Lx - 1, Ly); ctx.bezierCurveTo(ex - rx * k, top, ex + rx * k, top, Rx + 1, Ry); strokeLine(ctx, R.lw * (F.lashW || 1.05));
    return { top, bot, Lx, Rx, Ly, Ry };
  }

  // ---------------------------------------------------------------- mouth
  // M: {w, h, smile, round, asym, teeth, tongue, gritted}
  function mouth(ctx, R, cx, cy, M, P) {
    const w = M.w * (1 - M.round * 0.3), hw = w / 2, h = M.h, sm = M.smile;
    const lY = cy - sm * M.w * 0.17 + M.asym * M.w * 0.08 + M.round * h * 0.1, rY = cy - sm * M.w * 0.17 - M.asym * M.w * 0.14 + M.round * h * 0.1;
    const Lp = [cx - hw, lY], Rp = [cx + hw, rY], my = (lY + rY) / 2;
    if (h < 2.2) {
      ctx.beginPath(); ctx.moveTo(Lp[0], Lp[1]);
      ctx.quadraticCurveTo(cx - M.asym * hw * 0.3, my + sm * M.w * 0.3 + h, Rp[0], Rp[1]);
      strokeLine(ctx, R.lw * 0.85);
      // corners
      ctx.beginPath();
      if (sm > 0.2) { ctx.moveTo(Lp[0] - 3, Lp[1] - 4 * sm); ctx.quadraticCurveTo(Lp[0] - 1, Lp[1] + 2, Lp[0] + 3, Lp[1] + 2); ctx.moveTo(Rp[0] + 3, Rp[1] - 4 * sm); ctx.quadraticCurveTo(Rp[0] + 1, Rp[1] + 2, Rp[0] - 3, Rp[1] + 2); }
      strokeLine(ctx, R.lw * 0.5);
      if (M.tongue > 0.05) {
        ctx.save(); ctx.translate(cx + hw * 0.55, my + 1); ctx.rotate(0.35);
        part(ctx, R, c => E(c, 0, 3 * M.tongue, 4.5, 4.5 * M.tongue + 1), P.tongue, mix(P.tongue, '#6a1f3a', 0.35), { lw: R.lw * 0.6, d: 3, rim: false });
        ctx.restore();
      }
      return;
    }
    const k = lerp(0.62, 1.0, M.round);
    const upPeak = my - h * (0.28 - 0.18 * Math.max(0, sm)) - M.round * h * 0.3;
    const loPeak = my + h * (0.72 + 0.25 * Math.max(0, sm)) - M.round * h * 0.05;
    const upC = my + (upPeak - my) * 1.33, loC = my + (loPeak - my) * 1.33;
    const path = c => { c.moveTo(Lp[0], Lp[1]); c.bezierCurveTo(cx - hw * k, upC, cx + hw * k, upC, Rp[0], Rp[1]); c.bezierCurveTo(cx + hw * k, loC, cx - hw * k, loC, Lp[0], Lp[1]); c.closePath(); };
    ctx.save(); ctx.beginPath(); path(ctx); ctx.fillStyle = P.mouth; ctx.fill(); ctx.clip();
    // tongue
    ctx.beginPath(); E(ctx, cx + hw * 0.12, loPeak + h * 0.12, hw * 0.62, h * 0.42); ctx.fillStyle = P.tongue; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + hw * 0.12, loPeak - h * 0.25); ctx.lineTo(cx + hw * 0.12, loPeak); strokeLine(ctx, 1.5, 'rgba(120,30,50,0.5)');
    // teeth
    const th = Math.min(h * 0.28, M.w * 0.13) * (M.teeth ?? 1);
    if (th > 0.5) { ctx.beginPath(); E(ctx, cx, upPeak - 2, hw * 0.78, th + 2); ctx.fillStyle = P.teeth; ctx.fill(); }
    if (M.gritted) {
      ctx.fillStyle = P.teeth; ctx.fillRect(cx - hw, upPeak - 5, w, (loPeak - upPeak) + 10);
      ctx.beginPath(); ctx.moveTo(cx - hw, my + h * 0.22); ctx.lineTo(cx + hw, my + h * 0.22);
      for (let i = -2; i <= 2; i++) { ctx.moveTo(cx + i * hw * 0.34, upPeak); ctx.lineTo(cx + i * hw * 0.34, loPeak); }
      strokeLine(ctx, 1.6, 'rgba(90,70,90,0.6)');
    }
    ctx.restore();
    ctx.beginPath(); path(ctx); strokeLine(ctx, R.lw * 0.85);
    // lower lip hint
    ctx.beginPath(); ctx.moveTo(cx - hw * 0.35, loPeak + 5); ctx.quadraticCurveTo(cx, loPeak + 8, cx + hw * 0.35, loPeak + 5);
    strokeLine(ctx, R.lw * 0.45, 'rgba(90,40,50,0.45)');
  }

  // lip-sync shape variation: turns a scalar openness into changing visemes
  function lipShape(m, t, seed) {
    const v = A.noise1(t * 5.7 + seed), v2 = A.noise1(t * 3.1 + seed * 3);
    const round = clamp(Math.max(0, v) * 1.1 * m, 0, 0.8);
    const wide = clamp(-v2, 0, 1) * m;
    return { round, wide };
  }

  // ============================================================================
  // SABA
  // ============================================================================
  const SABA_MOODS = {
    neutral: { brow: 0.05, browAng: 0.2, close: 0.2, happy: 0.12, smile: 0.25, mOpen: 0, round: 0, pupil: 1, lean: 0, shoulders: 0, tremble: 0, wrinkle: 0.25, wide: 0, gritted: 0, blush: 0.2 },
    eager: { brow: 0.6, browAng: -0.1, close: 0.0, happy: 0.1, smile: 0.6, mOpen: 0.14, round: 0, pupil: 1.05, lean: 0.2, shoulders: 3, tremble: 0.1, wrinkle: 0.65, wide: 0.1, gritted: 0, blush: 0.35 },
    tense: { brow: -0.6, browAng: -0.85, close: 0.3, happy: 0.0, smile: -0.4, mOpen: 0.1, round: 0, pupil: 0.8, lean: 0.25, shoulders: 10, tremble: 0.35, wrinkle: 0.1, wide: 0, gritted: 1, blush: 0.3 },
    horror: { brow: 1, browAng: 1, close: 0, happy: 0, smile: -0.7, mOpen: 0.5, round: 0.85, pupil: 0.55, lean: -0.1, shoulders: 14, tremble: 1, wrinkle: 1, wide: 0.9, gritted: 0, blush: 0 },
    joy: { brow: 0.8, browAng: 0.3, close: 0.0, happy: 0.9, smile: 1, mOpen: 0.55, round: 0, pupil: 1.1, lean: -0.05, shoulders: -2, tremble: 0, wrinkle: 0.7, wide: 0, gritted: 0, blush: 0.75 },
  };
  // arm presets [shoulderDeg, elbowDeg]; hand shapes
  const SG = (A.SABA_GESTURES = {
    none: { L: [22, -12], R: [18, -8], hL: 'relax', hR: 'relax' },
    noneSit: { L: [18, -62], R: [14, -58], hL: 'relax', hR: 'relax' },
    fists: { L: [32, -128], R: [28, -125], tL: [-46, -112], tR: [48, -118], hL: 'fist', hR: 'fist' },
    point: { L: [22, -40], R: [100, 6], hL: 'relax', hR: 'point' },
    headHands: { L: [152, 78], R: [150, 80], tL: [-62, -200], tR: [70, -200], wL: 8, wR: 8, down: 1, front: true, hL: 'open', hR: 'open' },
    armsUp: { L: [160, 12], R: [158, 14], hL: 'open', hR: 'open' },
    grip: { L: [30, -18], R: [30, -18], hL: 'grip', hR: 'grip' },
  });

  const SABA = { l1: 82, l2: 76, shX: 72, shY: -160, handSz: 24 };

  function sabaLegs(pose, rise, air, floor) {
    const sit = {
      P: [0, -floor - 26],
      L: [[-40, -floor - 22], [-56, -floor + 8], [-62, -20]],
      R: [[40, -floor - 22], [58, -floor + 6], [68, -20]],
    };
    const st = {
      P: [0, -182],
      L: [[-40, -176], [-44, -96], [-46, -22]],
      R: [[42, -176], [48, -96], [52, -22]],
    };
    if (pose === 'sit') return sit;
    if (pose === 'stand') return st;
    if (pose === 'rise') {
      const e = A.ease.inOut(clamp(rise)), lift = Math.sin(Math.PI * clamp(rise)) * 0;
      const m = (a, b) => lerp2(a, b, e);
      return { P: add(m(sit.P, st.P), [0, lift]), L: sit.L.map((p, i) => m(p, st.L[i])), R: sit.R.map((p, i) => m(p, st.R[i])) };
    }
    // jump: airborne, knees tucked froggy
    const h = air * 110, tk = clamp(air);
    const Py = -182 - h;
    return {
      P: [0, Py],
      L: [[-40, Py + 6], lerp2([-44, Py + 86], [-74, Py + 62], tk), lerp2([-46, Py + 160], [-48, Py + 124], tk)],
      R: [[42, Py + 6], lerp2([48, Py + 86], [78, Py + 62], tk), lerp2([52, Py + 160], [54, Py + 124], tk)],
    };
  }

  function sabaFoot(ctx, R, ank, s, tipDown) {
    const fx = ank[0] + 8 + s * 4, fy = ank[1] + 12;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(tipDown * 0.6 * 1);
    // sole
    part(ctx, R, c => { c.moveTo(-30, 6); c.bezierCurveTo(-32, 18, 36, 20, 38, 8); c.bezierCurveTo(40, 2, -28, -2, -30, 6); c.closePath(); }, SC.sandal, SC.sandalSh, { d: 5 });
    // sock foot
    part(ctx, R, c => { c.moveTo(-26, 6); c.bezierCurveTo(-30, -16, 10, -20, 30, -4); c.bezierCurveTo(40, 4, 34, 10, 28, 10); c.lineTo(-22, 10); c.closePath(); }, SC.sock, SC.sockSh, { d: 6 });
    // straps
    part(ctx, R, c => { c.moveTo(4, -14); c.lineTo(14, -12); c.lineTo(20, 9); c.lineTo(9, 9); c.closePath(); c.moveTo(-22, -6); c.lineTo(-12, -9); c.lineTo(-10, 9); c.lineTo(-20, 9); c.closePath(); }, SC.sandal, SC.sandalSh, { d: 3, lw: R.lw * 0.7 });
    ctx.restore();
  }

  function sabaHead(ctx, R, F, t) {
    const fx = F.turn * 26, tn = F.turn;
    const jaw = F.jaw * 16;
    // far side tuft & ear (behind head)
    const tuft = (c, sx, ox) => {
      const pts = [[-78, -26, 15], [-88, -8, 17], [-86, 12, 15], [-76, 28, 11], [-66, -40, 11], [-92, 2, 10]];
      for (const [x, y, r] of pts) C(c, ox + sx * (-x) * -1 * 1, y, r);
    };
    const farX = 70 - tn * 12, nearX = -70 + tn * 14;
    part(ctx, R, c => { for (const [x, y, r] of [[10, -30, 15], [18, -12, 16], [18, 6, 13], [0, -44, 11], [22, -28, 10]]) C(c, farX + x, y, r); }, SC.hair, SC.hairSh, { d: 7 });
    part(ctx, R, c => E(c, farX + 4, 6, 13, 22, 0.15), SC.skin, SC.skinSh, { d: 6 });
    // head
    const hp = [[0, -84], [44, -76], [72, -46], [80, -6], [76, 30], [62 + fx * 0.2, 58 + jaw * 0.5], [36 + fx * 0.4, 80 + jaw], [fx * 0.4, 88 + jaw], [-38 + fx * 0.3, 80 + jaw], [-64 + fx * 0.1, 56 + jaw * 0.5], [-76, 28], [-80, -8], [-72, -48], [-44, -76]];
    part(ctx, R, c => blob(c, hp), SC.skin, SC.skinSh, { d: 16, r: 5 });
    // crown shine
    ctx.save(); ctx.globalAlpha = 0.45; ctx.beginPath(); E(ctx, -18 + R.L[0] * 20, -58, 26, 11, -0.35); ctx.fillStyle = SC.skinHi; ctx.fill();
    ctx.globalAlpha = 0.8; ctx.beginPath(); E(ctx, -28 + R.L[0] * 20, -63, 8, 3.5, -0.4); ctx.fillStyle = '#fff4e0'; ctx.fill(); ctx.restore();
    // forehead wrinkles
    if (F.wrinkle > 0.05) {
      ctx.save(); ctx.globalAlpha = clamp(F.wrinkle) * 0.75; ctx.beginPath();
      const wy = -48 - F.brow * 6;
      for (let i = 0; i < 3; i++) { const y = wy - i * 9, w = 34 - i * 4; ctx.moveTo(fx - w, y + 3 + F.browAng * 3); ctx.quadraticCurveTo(fx, y - 4 - F.browAng * 4, fx + w, y + 3 + F.browAng * 3); }
      strokeLine(ctx, R.lw * 0.5, SC.skinSh); ctx.restore();
    }
    // near tuft (above/behind the ear), then ear on top
    part(ctx, R, c => { for (const [x, y, r] of [[-10, -30, 15], [-20, -14, 16], [-22, 4, 13], [0, -44, 11], [-24, -30, 10], [-14, 18, 9]]) C(c, nearX + x, y, r); }, SC.hair, SC.hairSh, { d: 7 });
    ctx.beginPath(); ctx.moveTo(nearX - 26, -24); ctx.quadraticCurveTo(nearX - 18, -14, nearX - 24, -2); ctx.moveTo(nearX - 12, -40); ctx.quadraticCurveTo(nearX - 6, -32, nearX - 10, -22);
    strokeLine(ctx, R.lw * 0.45, SC.hairSh);
    part(ctx, R, c => E(c, nearX - 2, 12, 13, 21, -0.12), SC.skin, SC.skinSh, { d: 6 });
    ctx.beginPath(); ctx.moveTo(nearX, 0); ctx.quadraticCurveTo(nearX - 10, 12, nearX, 24); strokeLine(ctx, R.lw * 0.5, SC.skinSh);

    // cheeks blush
    const bl = F.blush;
    if (bl > 0.02) {
      ctx.save(); ctx.globalAlpha = bl * 0.45;
      ctx.fillStyle = A.radial(ctx, fx - 46, 26, 0, 22, [[0, SC.blush], [1, 'rgba(224,112,92,0)']]); ctx.fillRect(fx - 70, 0, 48, 50);
      ctx.fillStyle = A.radial(ctx, fx + 46, 26, 0, 20, [[0, SC.blush], [1, 'rgba(224,112,92,0)']]); ctx.fillRect(fx + 22, 0, 48, 50);
      ctx.restore();
    }
    // eyes (behind glasses)
    const eyL = [fx - 30, -2], eyR = [fx + 29, -2];
    const farK = 1 - Math.max(0, tn) * 0.25, nearK = 1 - Math.max(0, -tn) * 0.25;
    const eF = (k, inner) => ({ rx: 13.5 * k, ry: 15, close: F.close, happy: F.happy, slant: F.browAng * 0.6, look: F.look, irisR: 9 * F.pupilIris, pupilR: 5 * F.pupil, iris: SC.iris, white: SC.white, inner, wide: F.wide, lashW: 1.0 });
    // happy cheeks push (smile folds under eyes)
    eye(ctx, R, eyL[0], eyL[1], eF(nearK, 1));
    eye(ctx, R, eyR[0], eyR[1], eF(farK, -1));
    // old-man lid creases / bags
    ctx.beginPath();
    for (const [ex, k] of [[eyL[0], nearK], [eyR[0], farK]]) { ctx.moveTo(ex - 10 * k, 17 - F.happy * 3); ctx.quadraticCurveTo(ex, 21 - F.happy * 4, ex + 10 * k, 17 - F.happy * 3); }
    strokeLine(ctx, R.lw * 0.4, SC.skinSh);
    if (F.happy > 0.4) { // crow's feet
      ctx.save(); ctx.globalAlpha = (F.happy - 0.4) * 1.6; ctx.beginPath();
      ctx.moveTo(eyL[0] - 30, -6); ctx.lineTo(eyL[0] - 38, -10); ctx.moveTo(eyL[0] - 30, 2); ctx.lineTo(eyL[0] - 39, 3);
      ctx.moveTo(eyR[0] + 29 * farK, -6); ctx.lineTo(eyR[0] + 37 * farK, -10); ctx.moveTo(eyR[0] + 29 * farK, 2); ctx.lineTo(eyR[0] + 38 * farK, 3);
      strokeLine(ctx, R.lw * 0.45, SC.skinSh); ctx.restore();
    }
    // glasses
    const gw = 28, gh = 22, gr = 12;
    const lensP = (c, ex, k) => { c.roundRect(ex - gw * k, -2 - gh, gw * 2 * k, gh * 2, gr); };
    ctx.beginPath(); lensP(ctx, eyL[0], nearK); lensP(ctx, eyR[0], farK); ctx.fillStyle = SC.lens; ctx.fill();
    // glint sweep
    const gph = ((t + 1.3) % 4.7) / 0.55, glint = Math.max(F.glint || 0, gph < 1 ? 1 : 0), gp = F.glint ? (t * 1.6) % 1 : gph;
    ctx.save(); ctx.beginPath(); lensP(ctx, eyL[0], nearK); lensP(ctx, eyR[0], farK); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(eyL[0] - 20, -20); ctx.lineTo(eyL[0] - 8, -22); ctx.lineTo(eyL[0] - 22, 6); ctx.lineTo(eyL[0] - 27, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(eyR[0] - 16 * farK, -20); ctx.lineTo(eyR[0] - 8 * farK, -22); ctx.lineTo(eyR[0] - 20 * farK, 0); ctx.closePath(); ctx.fill();
    if (glint > 0 && gp <= 1) {
      const gx = lerp(-80, 80, gp) + fx;
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(gx - 8, -30); ctx.lineTo(gx + 8, -30); ctx.lineTo(gx - 10, 26); ctx.lineTo(gx - 26, 26); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(gx + 14, -30); ctx.lineTo(gx + 19, -30); ctx.lineTo(gx + 1, 26); ctx.lineTo(gx - 4, 26); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); lensP(ctx, eyL[0], nearK); lensP(ctx, eyR[0], farK);
    ctx.lineWidth = R.lw * 1.6 + 2; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = R.lw * 1.0; ctx.strokeStyle = SC.glasses; ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(160,140,170,0.55)';
    ctx.beginPath(); ctx.arc(eyL[0] - (gw - gr) * nearK, -2 - gh + gr, gr - 1, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    // bridge + near temple
    ctx.beginPath(); ctx.moveTo(eyL[0] + gw * nearK, -8); ctx.quadraticCurveTo(fx, -16, eyR[0] - gw * farK, -8);
    ctx.moveTo(eyL[0] - gw * nearK, -10); ctx.lineTo(nearX + 6, -4);
    ctx.lineWidth = R.lw * 1.3 + 2; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = R.lw * 0.9; ctx.strokeStyle = SC.glasses; ctx.stroke();

    // nose (big, bulbous)
    const nx = fx * 1.35 + 3, ny = 16;
    part(ctx, R, c => { c.moveTo(nx - 7, ny - 22); c.bezierCurveTo(nx - 12, ny - 10, nx - 30, ny - 2, nx - 26, ny + 12); c.bezierCurveTo(nx - 22, ny + 26, nx + 22, ny + 28, nx + 28, ny + 12); c.bezierCurveTo(nx + 32, ny - 2, nx + 12, ny - 10, nx + 7, ny - 22); c.closePath(); }, SC.nose, SC.skinSh, { d: 8 });
    ctx.save(); ctx.globalAlpha = 0.55; ctx.beginPath(); E(ctx, nx - 6, ny + 0, 7, 5, -0.4); ctx.fillStyle = SC.skinHi; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(nx - 13, ny + 12); ctx.quadraticCurveTo(nx - 8, ny + 15, nx - 4, ny + 12); ctx.moveTo(nx + 6, ny + 12); ctx.quadraticCurveTo(nx + 11, ny + 15, nx + 15, ny + 11);
    strokeLine(ctx, R.lw * 0.5, mix(SC.skinSh, O, 0.4));
    // nasolabial folds
    ctx.save(); ctx.globalAlpha = 0.6 + F.smile * 0.3; ctx.beginPath();
    ctx.moveTo(nx - 28, ny + 2); ctx.quadraticCurveTo(nx - 44 - F.smile * 4, ny + 26, nx - 40 - F.smile * 2, ny + 46 + jaw * 0.3);
    ctx.moveTo(nx + 28, ny + 2); ctx.quadraticCurveTo(nx + 42 + F.smile * 4, ny + 26, nx + 38 + F.smile * 2, ny + 46 + jaw * 0.3);
    strokeLine(ctx, R.lw * 0.5, SC.skinSh); ctx.restore();

    // mouth (under moustache)
    const mx = nx - 1, myy = 67 + jaw * 0.55 - F.smile * 2;
    mouth(ctx, R, mx, myy, { w: 46 * F.mouthW, h: F.mouthH, smile: F.smile, round: F.round, asym: 0, teeth: 1, gritted: F.gritted, tongue: 0 }, SC);
    // chin
    ctx.beginPath(); ctx.moveTo(fx * 0.5 - 12, 80 + jaw); ctx.quadraticCurveTo(fx * 0.5, 84 + jaw, fx * 0.5 + 12, 80 + jaw);
    strokeLine(ctx, R.lw * 0.45, SC.skinSh);

    // moustache — bushy two-lobed cloud, tips follow the smile
    const mu = 45 - F.mouthH * 0.12, tip = -F.smile * 7 + F.round * 3;
    part(ctx, R, c => {
      const pts = [[0, 0, 13], [-12, 2, 13], [12, 2, 13], [-24, 6, 12], [24, 6, 12], [-35, 11 + tip * 0.6, 10], [35, 11 + tip * 0.6, 10], [-43, 17 + tip, 7.5], [43, 17 + tip, 7.5]];
      for (const [x, y, r] of pts) C(c, nx + x, mu + y, r);
    }, SC.hair, SC.hairSh, { d: 6, r: 3 });
    ctx.beginPath();
    for (const x of [-26, -14, -3, 8, 19, 30]) { ctx.moveTo(nx + x, mu + 2); ctx.quadraticCurveTo(nx + x * 1.1 + 1, mu + 9, nx + x * 1.15, mu + 15); }
    strokeLine(ctx, R.lw * 0.35, SC.hairSh);

    // EYEBROWS — huge, white, bushy; Saba's main acting tool
    const brow = (ex, side, k, extra) => {
      // side: -1 = brow on left of face; inner end is toward face centre
      const raise = (F.brow + extra) * 15, ang = F.browAng;
      const inX = ex - side * 8 * k, outX = ex + side * 42 * k;
      const inY = -34 - raise - ang * 12, outY = -36 - raise * 0.8 + ang * 6;
      const midY = (inY + outY) / 2 - 9 - raise * 0.25 + ang * 2;
      const P = (u) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, cc = u * u; return [a * inX + b * lerp(inX, outX, 0.5) + cc * outX, a * inY + b * (2 * midY - (inY + outY) / 2) + cc * outY]; };
      part(ctx, R, c => {
        for (let i = 0; i <= 6; i++) { const u = i / 6, p = P(u), r = (13 - u * 5) * (0.9 + 0.1 * k); C(c, p[0], p[1] - u * 2, r); }
        // flyaway tufts at the outer end and inner end
        const po = P(1);
        E(c, po[0] + side * 10, po[1] - 8 - ang * 3, 11, 5.5, side * (-0.5 - ang * 0.3));
        E(c, po[0] + side * 12, po[1] + 1, 10, 4.5, side * 0.15);
        const pi = P(0);
        E(c, pi[0] - side * 2, pi[1] - 9 - ang * 4, 5, 8, side * 0.4);
      }, SC.hair, SC.hairSh, { d: 6, r: 3 });
      ctx.beginPath();
      for (let i = 1; i < 6; i++) { const p = P(i / 6); ctx.moveTo(p[0] - side * 4, p[1] + 4); ctx.lineTo(p[0] + side * 5, p[1] - 5); }
      strokeLine(ctx, R.lw * 0.35, SC.hairSh);
    };
    brow(eyL[0], -1, nearK, F.browL);
    brow(eyR[0], 1, farK, F.browR);
  }

  function sabaScarf(ctx, R, t, o, lean, air, wave, vel) {
    // wrap around neck
    const wrap = [[-64, -190], [-46, -214], [-6, -224], [40, -218], [70, -196], [56, -174], [16, -164], [-32, -168]];
    part(ctx, R, c => blob(c, wrap), SC.scarfY, SC.scarfYSh, { d: 10 });
    ctx.save(); ctx.beginPath(); blob(ctx, wrap); ctx.clip();
    ctx.fillStyle = SC.scarfB;
    for (const x of [-44, -14, 16, 46]) { ctx.beginPath(); ctx.moveTo(x - 7, -240); ctx.quadraticCurveTo(x - 4 + x * 0.05, -196, x - 7 + x * 0.1, -150); ctx.lineTo(x + 7 + x * 0.1, -150); ctx.quadraticCurveTo(x + 10 + x * 0.05, -196, x + 7, -240); ctx.fill(); }
    ctx.globalAlpha = 0.35; ctx.fillStyle = SC.scarfBSh; ctx.beginPath(); ctx.moveTo(-70, -178); ctx.quadraticCurveTo(0, -150, 70, -186); ctx.lineTo(70, -150); ctx.lineTo(-70, -150); ctx.fill();
    ctx.restore();
    ctx.beginPath(); blob(ctx, wrap); strokeLine(ctx, R.lw);
    // two hanging ends from the knot (near side)
    const g = -lean; // gravity in torso frame
    const ends = [{ x: -30, y: -176, len: 7, ph: 0 }, { x: -6, y: -172, len: 6, ph: 1.7 }];
    for (const en of ends) {
      const pts = [[en.x, en.y]]; let ang = Math.PI / 2 + g * 0.9 + (en.ph ? 0.12 : -0.05);
      for (let i = 0; i < en.len; i++) {
        const k = i / en.len;
        const flutter = (0.05 + wave * 0.5) * Math.sin(t * (4 + wave * 5) - i * 0.9 + en.ph) * (0.4 + k);
        const lift = -air * (0.6 + k * 1.2) * (en.ph ? 1 : -0.8) - (vel[0] * 0.0015) * k - vel[1] * 0.001 * k * (en.ph ? 1 : -1);
        ang += flutter * 0.5 + lift * 0.18 + wave * 0.18 * Math.sin(t * 3 + en.ph) * k;
        const p = pts[pts.length - 1]; pts.push([p[0] + Math.cos(ang) * 17, p[1] + Math.sin(ang) * 17]);
      }
      const n = pts.length, left = [], right = [];
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const hw = 15 - i * 0.3; left.push([pts[i][0] - dy / l * hw, pts[i][1] + dx / l * hw]); right.push([pts[i][0] + dy / l * hw, pts[i][1] - dx / l * hw]);
      }
      const build = c => { c.moveTo(left[0][0], left[0][1]); for (let i = 1; i < n; i++) c.lineTo(left[i][0], left[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]); c.closePath(); };
      // tassels first (under the end)
      const L0 = left[n - 1], R0 = right[n - 1], tipA = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const u = j / 4, bx = lerp(L0[0], R0[0], u), by = lerp(L0[1], R0[1], u), a2 = tipA + Math.sin(t * 5 + j + en.ph) * (0.15 + wave * 0.4);
        ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + Math.cos(tipA) * 8, by + Math.sin(tipA) * 8, bx + Math.cos(a2) * 18, by + Math.sin(a2) * 18);
      }
      ctx.lineWidth = 7 + R.lw; ctx.strokeStyle = O; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = en.ph ? SC.scarfB : SC.scarfY; ctx.stroke();
      part(ctx, R, build, SC.scarfY, SC.scarfYSh, { d: 6 });
      ctx.save(); ctx.beginPath(); build(ctx); ctx.clip(); ctx.fillStyle = SC.scarfB;
      for (let i = 1; i < n - 1; i += 2) { ctx.beginPath(); ctx.moveTo(left[i][0], left[i][1]); ctx.lineTo(right[i][0], right[i][1]); ctx.lineTo(lerp(right[i][0], right[i + 1][0], 0.55), lerp(right[i][1], right[i + 1][1], 0.55)); ctx.lineTo(lerp(left[i][0], left[i + 1][0], 0.55), lerp(left[i][1], left[i + 1][1], 0.55)); ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); build(ctx); strokeLine(ctx, R.lw);
    }
    // knot
    part(ctx, R, c => E(c, -20, -178, 17, 13, 0.3), SC.scarfY, SC.scarfYSh, { d: 6 });
    ctx.save(); ctx.beginPath(); E(ctx, -20, -178, 17, 13, 0.3); ctx.clip(); ctx.fillStyle = SC.scarfB; ctx.fillRect(-26, -196, 11, 40); ctx.restore();
  }

  function sabaTorso(ctx, R, br) {
    const T = [[-66, -186], [-24, -198], [28, -198], [70, -186], [94, -156], [110, -112], [120, -62], [112, -22], [86, 4], [36, 14], [-24, 14], [-76, 4], [-102, -24], [-108, -70], [-100, -122], [-86, -164]];
    const Tb = T.map(([x, y]) => [x * (1 + br * 0.012 * (y > -120 ? 1 : 0.3)), y * (1 + br * 0.01)]);
    part(ctx, R, c => blob(c, Tb), SC.cardigan, SC.cardiganSh, { d: 18, r: 6 });
    ctx.save(); ctx.beginPath(); blob(ctx, Tb); ctx.clip();
    // knit ribs
    ctx.beginPath();
    for (let x = -100; x <= 110; x += 13) { ctx.moveTo(x, -205); ctx.quadraticCurveTo(x * 1.12, -100, x * 0.92, 15); }
    strokeLine(ctx, 1.6, 'rgba(60,30,15,0.22)');
    // undershirt over the belly
    const S = [[-20, -198], [34, -198], [50, -150], [70, -95], [76, -45], [60, -12], [14, -4], [-24, -14], [-38, -60], [-34, -130]];
    const Sb = S.map(([x, y]) => [x * (1 + br * 0.015), y * (1 + br * 0.01)]);
    part(ctx, R, c => blob(c, Sb), SC.shirt, SC.shirtSh, { d: 14, lw: 0, rimK: 0.6 });
    // belly roundness shade
    ctx.fillStyle = A.radial(ctx, 28 + R.L[0] * 14, -80 + R.L[1] * 14, 10, 90, [[0, 'rgba(255,255,255,0.18)'], [0.7, 'rgba(255,255,255,0)'], [1, 'rgba(60,40,80,0.10)']]);
    ctx.beginPath(); blob(ctx, Sb); ctx.fill();
    // belt + trousers bottom
    ctx.fillStyle = SC.trousers; ctx.fillRect(-120, -4, 240, 30);
    ctx.fillStyle = SC.belt; ctx.fillRect(-120, -12, 240, 11);
    ctx.fillStyle = '#c9a45a'; ctx.fillRect(16, -13, 12, 13);
    ctx.restore();
    // cardigan front edges (trim) + buttons
    ctx.beginPath(); ctx.moveTo(Sb[9][0], Sb[9][1]); ctx.bezierCurveTo(-42, -100, -34, -40, -26, -12);
    ctx.lineWidth = 12 + R.lw * 2; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = SC.trim; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Sb[2][0], Sb[2][1]); ctx.bezierCurveTo(66, -120, 80, -70, 64, -12);
    ctx.lineWidth = 10 + R.lw * 2; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = SC.trim; ctx.stroke();
    for (const [x, y] of [[-46, -130], [-46, -88], [-40, -46]]) part(ctx, R, c => C(c, x, y, 5.5), SC.button, '#b99a6a', { d: 2, lw: R.lw * 0.6 });
    // pockets
    ctx.beginPath(); ctx.moveTo(-86, -52); ctx.lineTo(-52, -50); ctx.moveTo(84, -50); ctx.lineTo(100, -52);
    strokeLine(ctx, R.lw * 0.7, SC.trimSh);
    ctx.beginPath(); blob(ctx, Tb); strokeLine(ctx, R.lw);
    // hem band
    ctx.save(); ctx.beginPath(); blob(ctx, Tb); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-100, -12); ctx.quadraticCurveTo(-60, 4, -30, -4); ctx.moveTo(62, -2); ctx.quadraticCurveTo(90, 0, 110, -20);
    strokeLine(ctx, 3, SC.trimSh); ctx.restore();
  }

  // stage: 0 = whole arm, 1 = sleeve only, 2 = hand + cuff only
  function sabaArm(ctx, R, s, arm, sleeveCol, handKind, stage = 0) {
    const { sh, e, w, dir } = arm;
    if (stage !== 2) {
    part(ctx, R, c => tube(c, [sh, e, w], [23, 21, 18]), sleeveCol, SC.cardiganSh, { d: 10 });
    // elbow crease
    ctx.save(); ctx.beginPath(); tube(ctx, [sh, e, w], [23, 21, 18]); ctx.clip();
    ctx.beginPath(); ctx.moveTo(e[0] + (sh[0] - e[0]) * 0.18, e[1] + (sh[1] - e[1]) * 0.18); ctx.quadraticCurveTo(e[0], e[1], e[0] + (w[0] - e[0]) * 0.18, e[1] + (w[1] - e[1]) * 0.18);
    strokeLine(ctx, 2.2, 'rgba(50,25,10,0.45)'); ctx.restore();
    }
    if (stage === 1) return;
    const hd = dir - s * (arm.wrist || 0) * D;
    drawHand(ctx, R, [w[0] + Math.cos(dir) * 4, w[1] + Math.sin(dir) * 4], hd, handKind, SABA.handSz, s, SC.skin, SC.skinSh);
    // cuff
    ctx.save(); ctx.translate(w[0], w[1]); ctx.rotate(dir);
    part(ctx, RR(R, dir), c => c.roundRect(-8, -19, 14, 38, 6), SC.trim, SC.trimSh, { d: 5 });
    ctx.restore();
  }

  A.drawSaba = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t || 0;
    const pose = ['sit', 'rise', 'stand', 'jump'].includes(o.pose) ? o.pose : 'sit';
    const moodK = o.moodFrom ? clamp(o.moodK ?? 1) : 1;
    const M = o.moodFrom ? mixObj(SABA_MOODS[o.moodFrom] || SABA_MOODS.neutral, SABA_MOODS[o.mood] || SABA_MOODS.neutral, moodK) : (SABA_MOODS[o.mood] || SABA_MOODS.neutral);
    const floor = o.floor ?? 150, rise = o.rise ?? (pose === 'rise' ? 0.5 : 0), air = pose === 'jump' ? (o.air ?? 1) : 0;
    const flip = o.flip ? -1 : 1;
    const idle = o.idle ?? 1, breath = o.breath ?? 1;
    const vel = o.vel || [0, 0];
    const lwPx = o.lw ?? clamp(5 * scale, 2.5, 7);
    const lightS = o.light || [-0.6, -0.8], ll = Math.hypot(lightS[0], lightS[1]) || 1;
    const R = { lw: lwPx / scale, L: [lightS[0] / ll * flip, lightS[1] / ll], rimC: o.rimColor || '#ffd7a0', rimA: o.rimA ?? 0.55 };

    const br = Math.sin(t * A.TAU / 3.6) * breath;
    const tremble = (o.tremble ?? M.tremble) * 1;
    const tr = (sd, f = 19) => tremble * A.noise1(t * f + sd);
    const m = clamp(o.mouth ?? A.mouth('SABA', t));
    const lip = lipShape(m, t, 11);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * flip, scale);
    const sq = (o.squash ?? 0) + (pose === 'jump' ? -0.06 * Math.sin(Math.PI * clamp(air)) : 0);
    ctx.scale(1 + sq * 0.5, 1 - sq);
    if (pose === 'sit' || pose === 'rise') ctx.translate(0, floor);

    // contact shadow
    const wantShadow = o.shadow ?? (pose === 'stand' || pose === 'jump' || (pose === 'rise' && rise > 0.6));
    if (wantShadow) {
      const k = 1 - clamp(air) * 0.45;
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 120 * k, [[0, 'rgba(20,10,30,0.35)'], [1, 'rgba(20,10,30,0)']]);
      ctx.save(); ctx.scale(1, 0.18); ctx.beginPath(); C(ctx, 0, 0, 125 * k); ctx.fill(); ctx.restore();
    }

    // ------------- skeleton
    const legs = sabaLegs(pose, rise, air, floor);
    let leanDeg = ((o.lean ?? 0) + M.lean) * 22 + (pose === 'rise' ? Math.sin(Math.PI * clamp(rise)) * 16 : 0) + idle * A.wob(t, 3, 0.35) * 1.2;
    const lean = leanDeg * D;
    const P = add(legs.P, [tr(1) * 1.5, -br * 1.2]);
    const shoulders = (o.shoulders ?? M.shoulders);

    // arm angles
    const gName = pose === 'jump' && !o.gesture ? 'armsUp' : (o.gesture || 'none');
    const gKey = g => (g === 'none' && (pose === 'sit' || (pose === 'rise' && rise < 0.5))) ? 'noneSit' : g;
    const shL = [-SABA.shX, SABA.shY - shoulders - br * 1.5], shR = [SABA.shX - 4, SABA.shY - shoulders - br * 1.5];
    const gArms = g => ({ L: g.tL ? ik(shL, g.tL, SABA.l1, SABA.l2, -1, g.down || 0) : g.L, R: g.tR ? ik(shR, g.tR, SABA.l1, SABA.l2, 1, g.down || 0) : g.R });
    let G = SG[gKey(gName)] || SG.none, GA = gArms(G);
    let armL = GA.L.slice(), armR = GA.R.slice(), hL = G.hL, hR = G.hR;
    if (o.gestureFrom) {
      const G0 = SG[gKey(o.gestureFrom)] || SG.none, G0A = gArms(G0), k = A.ease.inOut(clamp(o.gestureK ?? 1));
      armL = lerpArr(G0A.L, GA.L, k); armR = lerpArr(G0A.R, GA.R, k); if (k < 0.5) { hL = G0.hL; hR = G0.hR; }
    }
    // torso-frame helpers
    const toTorso = p => { const v = rot([p[0] - P[0], p[1] - P[1]], -lean); return v; };
    // grip: IK to armrests
    if (gName === 'grip' && !o.handL && !o.handR && (pose === 'sit' || pose === 'rise')) {
      const ax = o.armrestX ?? 122, ay = -floor - (o.armrestY ?? 48);
      const gk = o.gestureFrom ? A.ease.inOut(clamp(o.gestureK ?? 1)) : 1;
      armL = lerpArr(armL, ik(shL, toTorso([-ax, ay]), SABA.l1, SABA.l2, -1), gk);
      armR = lerpArr(armR, ik(shR, toTorso([ax + 6, ay]), SABA.l1, SABA.l2, 1), gk);
    }
    if (o.armL) armL = o.armL; if (o.armR) armR = o.armR;
    if (o.handL) armL = ik(shL, toTorso(o.handL), SABA.l1, SABA.l2, -1);
    if (o.handR) armR = ik(shR, toTorso(o.handR), SABA.l1, SABA.l2, 1);
    hL = o.handShapeL || hL; hR = o.handShapeR || hR;
    let wrL = G.wL || 0, wrR = G.wR || 0;
    if (o.gestureFrom) { const G0 = SG[gKey(o.gestureFrom)] || SG.none, k = A.ease.inOut(clamp(o.gestureK ?? 1)); wrL = lerp(G0.wL || 0, wrL, k); wrR = lerp(G0.wR || 0, wrR, k); }
    wrL = o.wristL ?? wrL; wrR = o.wristR ?? wrR;
    // idle/tremble on arms
    armL = [armL[0] + tr(5, 17) * 3 + idle * A.wob(t, 7, 0.4) * 1.5, armL[1] + tr(6, 21) * 4];
    armR = [armR[0] + tr(8, 17) * 3 + idle * A.wob(t, 9, 0.4) * 1.5, armR[1] + tr(9, 21) * 4];
    const aL = armPts(shL, armL[0], armL[1], SABA.l1, SABA.l2, -1); aL.sh = shL; aL.wrist = wrL;
    const aR = armPts(shR, armR[0], armR[1], SABA.l1, SABA.l2, 1); aR.sh = shR; aR.wrist = wrR;
    const rBehind = o.armRBehind ?? (!(G.front && (o.gestureK ?? 1) > 0.5) && aR.w[0] > SABA.shX * 0.7 && aR.w[1] > SABA.shY - 60);

    // ------------- draw: far arm behind
    const torsoFrame = () => { ctx.translate(P[0], P[1]); ctx.rotate(lean); };
    const Rt = RR(R, lean);
    if (rBehind) { ctx.save(); torsoFrame(); sabaArm(ctx, Rt, 1, aR, mix(SC.cardigan, SC.cardiganSh, 0.35), hR); ctx.restore(); }

    // legs
    for (const [side, L] of [[1, legs.R], [-1, legs.L]]) {
      const tipDown = pose === 'jump' ? clamp(air) : 0;
      sabaFoot(ctx, R, L[2], side, tipDown);
      part(ctx, R, c => tube(c, [L[0], L[1], L[2]], [33, 29, 24]), SC.trousers, SC.trousersSh, { d: 12 });
      // trouser crease/knee
      ctx.beginPath(); ctx.moveTo(L[1][0] - 10, L[1][1] - 4); ctx.quadraticCurveTo(L[1][0], L[1][1] + 4, L[1][0] + 10, L[1][1] - 2);
      strokeLine(ctx, R.lw * 0.5, SC.trousersSh);
    }

    // torso
    ctx.save(); torsoFrame();
    sabaTorso(ctx, Rt, br);
    // seated: knees come toward camera, in front of the belly's lower edge
    const kneeFront = pose === 'sit' || (pose === 'rise' && rise < 0.3) ? 1 : 0;
    if (kneeFront > 0.01) {
      ctx.restore(); ctx.save();
      for (const L of [legs.R, legs.L]) {
        const k0 = lerp2(L[0], L[1], lerp(0.95, 0.45, kneeFront));
        part(ctx, R, c => cap2(c, k0, L[1], 31, 30), SC.trousers, SC.trousersSh, { d: 12 });
        ctx.beginPath(); ctx.moveTo(L[1][0] - 14, L[1][1] + 6); ctx.quadraticCurveTo(L[1][0], L[1][1] + 14, L[1][0] + 14, L[1][1] + 6);
        strokeLine(ctx, R.lw * 0.5, SC.trousersSh);
      }
      ctx.restore(); ctx.save(); torsoFrame();
    }
    sabaScarf(ctx, Rt, t, o, lean, air, clamp((o.scarfWave ?? 0) + air * 0.6), vel);
    // head
    const turn = clamp((o.turn ?? 0.25) + (o.look ? o.look[0] * 0.12 : 0), -1, 1);
    const tilt = ((o.headTilt ?? 0) + (o.look ? o.look[1] * 4 : 0) + idle * A.wob(t, 13, 0.3) * 2.5 + tr(12, 23) * 2 - (pose === 'jump' ? 6 * air : 0)) * D;
    const headP = [8 + turn * 6 + tr(14) * 1.2, -266 - br * 1.6 - shoulders * 0.4];
    ctx.save(); ctx.translate(headP[0], headP[1] + 70); ctx.rotate(tilt); ctx.scale(1.08, 1.08); ctx.translate(0, -70);
    // eye darts
    const dart = idle * 0.18;
    const dph = Math.floor(t * 0.9 + 0.3);
    const look = [clamp((o.look ? o.look[0] : 0) + dart * (A.hash(dph * 3.1) - 0.5), -1, 1), clamp((o.look ? o.look[1] : 0) + dart * 0.6 * (A.hash(dph * 7.7) - 0.5), -1, 1)];
    const blink = A.blink(t, 5);
    const F = {
      turn, look, jaw: clamp((o.jaw ?? 0) + m * 0.8 + M.mOpen * 0.5),
      brow: M.brow + (o.browRaise ?? 0) + m * 0.25 * Math.max(0, A.noise1(t * 2.3)), browAng: clamp(M.browAng + (o.browAngle ?? 0), -1.2, 1.2),
      browL: o.browL ?? 0, browR: o.browR ?? 0,
      close: clamp(Math.max(blink, M.close + (o.lid ?? 0))), happy: clamp((o.happy ?? M.happy) * (1 - blink * 0)),
      wide: M.wide, pupil: M.pupil, pupilIris: 0.9 + M.pupil * 0.1, smile: o.smile ?? M.smile, round: clamp(M.round * (m > 0.05 || M.mOpen > 0 ? 1 : 0) + lip.round * (1 - M.round)),
      mouthW: 1 + lip.wide * 0.25 - lip.round * 0.2 + M.smile * 0.1,
      mouthH: clamp(M.mOpen + m * (1 - M.mOpen * 0.5)) * 36,
      gritted: M.gritted > 0.5 && m < 0.35 ? 1 : 0, wrinkle: M.wrinkle + Math.max(0, (o.browRaise ?? 0)) * 0.5,
      blush: M.blush, glint: o.glint || 0,
    };
    if (F.gritted) F.mouthH = Math.max(F.mouthH, 12);
    // raised arms: sleeves go behind the head, hands stay in front (keeps the face readable)
    const upL = aL.w[1] < -230, upR = !rBehind && aR.w[1] < -230;
    ctx.restore();
    if (upL) sabaArm(ctx, Rt, -1, aL, SC.cardigan, hL, 1);
    if (upR) sabaArm(ctx, Rt, 1, aR, SC.cardigan, hR, 1);
    ctx.save(); ctx.translate(headP[0], headP[1] + 70); ctx.rotate(tilt); ctx.scale(1.08, 1.08); ctx.translate(0, -70);
    sabaHead(ctx, RR(Rt, tilt), F, t);
    ctx.restore();
    // front arms
    sabaArm(ctx, Rt, -1, aL, SC.cardigan, hL, upL ? 2 : 0);
    if (!rBehind) sabaArm(ctx, Rt, 1, aR, SC.cardigan, hR, upR ? 2 : 0);
    ctx.restore();

    ctx.restore();
  };

  // ============================================================================
  // NOA
  // ============================================================================
  const NOA_MOODS = {
    neutral: { brow: 0, browAng: 0.1, browAsym: 0, close: 0.12, happy: 0.1, smile: 0.2, mOpen: 0, asym: 0, pupil: 1, tilt: 0, blush: 0.35, tongue: 0, lean: 0 },
    amused: { brow: 0.1, browAng: -0.15, browAsym: 0.8, close: 0.38, happy: 0.3, smile: 0.5, mOpen: 0, asym: 0.75, pupil: 1, tilt: -6, blush: 0.4, tongue: 0, lean: -0.05 },
    focused: { brow: -0.35, browAng: -0.55, browAsym: 0, close: 0.25, happy: 0, smile: -0.05, mOpen: 0, asym: -0.2, pupil: 0.85, tilt: 5, blush: 0.25, tongue: 1, lean: 0.15 },
    joy: { brow: 0.7, browAng: 0.25, browAsym: 0, close: 0, happy: 0.85, smile: 1, mOpen: 0.55, asym: 0, pupil: 1.1, tilt: -3, blush: 0.8, tongue: 0, lean: -0.05 },
    proud: { brow: 0.35, browAng: 0.05, browAsym: 0.2, close: 0.55, happy: 0.45, smile: 0.75, mOpen: 0, asym: 0.35, pupil: 1, tilt: -9, blush: 0.6, tongue: 0, lean: -0.12 },
  };
  const NG = (A.NOA_GESTURES = {
    none: { L: [14, -10], R: [12, -6], hL: 'relax', hR: 'relax' },
    mug: { L: [22, -120], R: [22, -118], hL: 'relax', hR: 'relax' },
    reach: { L: [-72, -8], R: [78, 6], hL: 'open', hR: 'open' },
    shrug: { L: [16, 78], R: [14, 74], hL: 'open', hR: 'open' },
    cheer: { L: [142, 8], R: [140, 10], hL: 'fist', hR: 'fist' },
    hug: { L: [-128, 35], R: [118, 40], hL: 'relax', hR: 'relax' },
  });
  const NOA = { l1: 54, l2: 50, shX: 42, shY: -106, handSz: 15 };

  function noaLegs(pose, o) {
    const floor = o.floor ?? 100;
    if (pose === 'sit') {
      if (o.sitStyle === 'floor') return { P: [0, -24], L: [[-22, -20], [-64, -18], [18, -8]], R: [[22, -20], [66, -16], [-14, -4]], cross: true };
      return { P: [0, -floor - 20], L: [[-22, -floor - 16], [-26, -floor + 4], [-28, -14]], R: [[22, -floor - 16], [28, -floor + 2], [32, -14]] };
    }
    if (pose === 'crouch') return { P: [-16, -56], L: [[-28, -50], [30, -84], [4, -14]], R: [[-4, -52], [50, -78], [30, -14]] };
    return { P: [0, -128], L: [[-22, -124], [-24, -66], [-26, -14]], R: [[22, -124], [26, -66], [30, -14]] };
  }

  function noaFoot(ctx, R, ank, s, rotA = 0) {
    ctx.save(); ctx.translate(ank[0] + 6 + s * 2, ank[1] + 6); ctx.rotate(rotA);
    const b = c => { c.moveTo(-15, -8); c.bezierCurveTo(-20, 10, 0, 12, 22, 10); c.bezierCurveTo(32, 8, 30, -6, 18, -8); c.bezierCurveTo(8, -14, -8, -16, -15, -8); c.closePath(); };
    part(ctx, R, b, NC.sock, NC.sockSh, { d: 5 });
    ctx.save(); ctx.beginPath(); b(ctx); ctx.clip(); ctx.fillStyle = NC.sockDot;
    for (const [dx, dy] of [[-6, -4], [6, 2], [16, -2], [-10, 6], [2, -8], [22, 5]]) { ctx.beginPath(); C(ctx, dx, dy, 2.2); ctx.fill(); }
    ctx.restore();
    // fuzzy cuff
    part(ctx, R, c => { for (let i = 0; i < 5; i++) C(c, -12 + i * 6, -12, 5.5); }, NC.sock, NC.sockSh, { d: 3, lw: R.lw * 0.8 });
    ctx.restore();
  }

  function noaHair(ctx, R, layer, t, F, bounce) {
    const fx = F.turn * 18;
    const bY = bounce * Math.sin(t * 9) * 4 + Math.sin(t * A.TAU / 3) * 1.2;
    const wob = (i, a = 1.6) => A.wob(t, i, 0.7) * a + bounce * Math.sin(t * 9 - i * 0.7) * 2.5;
    if (layer === 'back') {
      // big puff (behind the head, on top)
      const cx = fx * 0.3 - 4, cy = -96 + bY * 0.8;
      part(ctx, R, c => {
        for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU, r = 25 + A.hash(i * 3.3) * 6; C(c, cx + Math.cos(a) * 56 + wob(i), cy + Math.sin(a) * 32 + wob(i + 20) - (Math.sin(a) < 0 ? 4 : 0), r); }
        E(c, cx, cy, 58, 34);
      }, NC.hair, NC.hairSh, { d: 12, r: 4 });
      // curl highlights
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * A.TAU + 0.3, rr = 20 + A.hash(i * 7.1) * 22, px = cx + Math.cos(a) * rr * 1.4 + wob(i) * 0.5, py = cy + Math.sin(a) * rr * 0.75 - 4;
        ctx.moveTo(px - 6, py + 2); ctx.arc(px, py, 6, Math.PI, Math.PI * 1.8);
      }
      strokeLine(ctx, 2.4, NC.hairHi);
      // back side hair behind the face (volume at sides)
      part(ctx, R, c => { for (const [x, y, r] of [[-60, -10, 20], [-66, 14, 17], [60, -12, 19], [64, 12, 16], [-50, -40, 20], [52, -42, 20]]) C(c, x + fx * 0.2 + wob(x) * 0.6, y + wob(y) * 0.5, r); }, NC.hairSh, null, { rim: false });
      return;
    }
    if (layer === 'front') {
      // hair cap / hairline with curly silhouette
      part(ctx, R, c => {
        c.moveTo(-64, 0); c.bezierCurveTo(-70, -60, -30, -72, fx, -70); c.bezierCurveTo(30, -72, 70, -60, 64, 0);
        c.quadraticCurveTo(56, -22, 44, -30); c.quadraticCurveTo(34, -22, 24 + fx * 0.5, -36); c.quadraticCurveTo(12 + fx, -26, fx - 2, -40);
        c.quadraticCurveTo(-12 + fx, -26, -24 + fx * 0.5, -38); c.quadraticCurveTo(-34, -24, -46, -30); c.quadraticCurveTo(-56, -22, -64, 0); c.closePath();
        for (const [x, y, r] of [[-56, -34, 13], [-40, -52, 14], [-18, -62, 14], [6, -64, 14], [30, -58, 14], [50, -42, 13], [-62, -14, 10], [62, -16, 10]]) C(c, x + fx * 0.4, y + wob(x, 0.8), r);
        // bangs curls
        C(c, fx - 20 + wob(1, 1), -38 + wob(2, 1), 11); C(c, fx + 6 + wob(3, 1), -44 + wob(4, 1), 10); C(c, fx + 28 + wob(5, 1), -36, 9);
      }, NC.hair, NC.hairSh, { d: 8, r: 3.5 });
      ctx.beginPath();
      for (const [x, y] of [[-40, -48], [-14, -56], [12, -58], [36, -48], [fx - 20, -38], [fx + 6, -44]]) { ctx.moveTo(x - 5 + fx * 0.4, y + 3); ctx.arc(x + fx * 0.4, y, 5.5, Math.PI * 0.9, Math.PI * 1.9); }
      strokeLine(ctx, 2.2, NC.hairHi);
      // scrunchie at puff base
      const sx = fx * 0.3 - 2, sy = -66 + bY * 0.5;
      part(ctx, R, c => { E(c, sx, sy + 3, 34, 8); for (let i = 0; i < 5; i++) { const qx = -28 + i * 14; E(c, sx + qx, sy + qx * qx / 150 - 1, 9.5, 10.5, qx * 0.012 + 0.2); } }, NC.scrunchie, NC.scrunchieSh, { d: 5, lw: R.lw * 0.85 });
      ctx.beginPath(); for (let i = 0; i < 4; i++) { const q = -21 + i * 14, qx = sx + q, qy = sy + q * q / 150; ctx.moveTo(qx - 2, qy - 8); ctx.quadraticCurveTo(qx + 3, qy, qx - 1, qy + 8); } strokeLine(ctx, 1.8, NC.scrunchieSh);
      // side ringlets
      for (const sd of [-1, 1]) {
        const bx = sd * 62 + fx * 0.25;
        part(ctx, R, c => { C(c, bx + wob(sd * 5) * 0.8, 8 + wob(sd * 6) * 0.5, 11); C(c, bx - sd * 2 + wob(sd * 7), 26 + wob(sd * 8), 9.5); C(c, bx + sd * 1 + wob(sd * 9) * 1.3, 42 + wob(sd * 10) * 1.2, 7.5); }, NC.hair, NC.hairSh, { d: 5 });
        ctx.beginPath(); ctx.moveTo(bx - 4, 6); ctx.arc(bx + wob(sd * 5) * 0.8, 8, 5, Math.PI, Math.PI * 1.9); strokeLine(ctx, 2, NC.hairHi);
      }
    }
  }

  function noaHead(ctx, R, F, t, bounce) {
    const fx = F.turn * 18, tn = F.turn, jaw = F.jaw * 12;
    noaHair(ctx, R, 'back', t, F, bounce);
    // far ear
    part(ctx, R, c => E(c, 58 - tn * 8, 6, 9, 13), NC.skin, NC.skinSh, { d: 4 });
    const hp = [[0, -62], [44, -52], [62, -20], [63, 12], [52 + fx * 0.1, 40 + jaw * 0.5], [28 + fx * 0.3, 58 + jaw], [fx * 0.35, 63 + jaw], [-28 + fx * 0.3, 58 + jaw], [-52 + fx * 0.1, 40 + jaw * 0.5], [-63, 12], [-62, -20], [-44, -52]];
    part(ctx, R, c => blob(c, hp), NC.skin, NC.skinSh, { d: 13, r: 4.5 });
    // near ear
    part(ctx, R, c => E(c, -58 + tn * 10, 8, 9, 13, -0.1), NC.skin, NC.skinSh, { d: 4 });
    // blush
    ctx.save(); ctx.globalAlpha = F.blush * 0.55;
    for (const bx of [fx - 36, fx + 36]) { ctx.fillStyle = A.radial(ctx, bx, 22, 0, 16, [[0, NC.blush], [1, 'rgba(240,138,124,0)']]); ctx.fillRect(bx - 18, 4, 36, 36); }
    ctx.restore();
    // freckles
    ctx.fillStyle = NC.freckle; ctx.globalAlpha = 0.75;
    for (const [dx, dy, r] of [[-40, 14, 1.8], [-33, 20, 1.6], [-44, 22, 1.5], [-28, 13, 1.4], [40, 14, 1.8], [33, 20, 1.6], [44, 22, 1.4], [28, 13, 1.4], [-8, 12, 1.2], [8, 11, 1.2], [0, 9, 1.1]]) { ctx.beginPath(); C(ctx, fx + dx * (dx * tn > 0 ? 1 - tn * 0.2 : 1), dy, r); ctx.fill(); }
    ctx.globalAlpha = 1;
    // eyes
    const farK = 1 - Math.max(0, tn) * 0.22, nearK = 1 - Math.max(0, -tn) * 0.22;
    const eyL = [fx - 24, 0], eyR = [fx + 23, 0];
    const eF = (k, inner) => ({ rx: 14.5 * k, ry: 17, close: F.close, happy: F.happy, slant: F.browAng * 0.7, look: F.look, irisR: 11.5 * (0.93 + 0.07 * F.pupil), pupilR: 6 * F.pupil, iris: NC.iris, white: NC.white, inner, wide: F.wide || 0, lashW: 1.25 });
    const e1 = eye(ctx, R, eyL[0], eyL[1], eF(nearK, 1));
    const e2 = eye(ctx, R, eyR[0], eyR[1], eF(farK, -1));
    // lashes at outer corners
    ctx.beginPath();
    ctx.moveTo(e1.Lx + 1, e1.Ly - 1); ctx.lineTo(e1.Lx - 6, e1.Ly - 6 + F.close * 4); ctx.moveTo(e1.Lx + 4, e1.Ly - 5 + F.close * 3); ctx.lineTo(e1.Lx - 2, e1.Ly - 11 + F.close * 6);
    ctx.moveTo(e2.Rx - 1, e2.Ry - 1); ctx.lineTo(e2.Rx + 6, e2.Ry - 6 + F.close * 4); ctx.moveTo(e2.Rx - 4, e2.Ry - 5 + F.close * 3); ctx.lineTo(e2.Rx + 2, e2.Ry - 11 + F.close * 6);
    strokeLine(ctx, R.lw * 0.7);
    // brows
    const brow = (ex, side, k, extra) => {
      const raise = (F.brow + extra) * 9, ang = F.browAng;
      const inX = ex - side * 5 * k, outX = ex + side * 17 * k, inY = -26 - raise - ang * 6, outY = -26 - raise * 0.7 + ang * 3, mY = Math.min(inY, outY) - 4;
      ctx.beginPath(); ctx.moveTo(inX, inY + 2); ctx.quadraticCurveTo((inX + outX) / 2, mY - 1, outX, outY); ctx.quadraticCurveTo((inX + outX) / 2, mY + 5, inX, inY + 6); ctx.closePath();
      ctx.lineWidth = R.lw * 0.7; ctx.strokeStyle = NC.hairSh; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = NC.hair; ctx.fill();
    };
    brow(eyL[0], -1, nearK, F.browL + F.browAsym * 0.9);
    brow(eyR[0], 1, farK, F.browR - F.browAsym * 0.2);
    // nose
    const nx = fx * 1.3 + 2;
    ctx.beginPath(); ctx.moveTo(nx - 3, 12); ctx.quadraticCurveTo(nx + 6, 20, nx - 1, 23); strokeLine(ctx, R.lw * 0.6, mix(NC.skinSh, O, 0.45));
    ctx.save(); ctx.globalAlpha = 0.6; ctx.beginPath(); C(ctx, nx - 3, 14, 3); ctx.fillStyle = NC.skinHi; ctx.fill(); ctx.restore();
    // mouth
    mouth(ctx, R, nx - 1, 37 + jaw * 0.45, { w: 30 * F.mouthW, h: F.mouthH, smile: F.smile, round: F.round, asym: F.asym, teeth: 1, tongue: F.tongue }, NC);
    // front hair
    noaHair(ctx, R, 'front', t, F, bounce);
  }

  function noaTorso(ctx, R, br, t, sway, vel) {
    const T = [[-44, -112], [-20, -122], [20, -122], [46, -112], [56, -84], [58, -34], [63, 8], [44, 20], [0, 22], [-44, 20], [-62, 8], [-58, -34], [-54, -84]];
    const Tb = T.map(([x, y]) => [x * (1 + br * 0.01), y * (1 + br * 0.012)]);
    part(ctx, R, c => blob(c, Tb), NC.hoodie, NC.hoodieSh, { d: 14, r: 5 });
    ctx.save(); ctx.beginPath(); blob(ctx, Tb); ctx.clip();
    // hem rib
    ctx.fillStyle = NC.trim; ctx.beginPath(); ctx.moveTo(-70, 6); ctx.quadraticCurveTo(0, 16, 70, 4); ctx.lineTo(70, 40); ctx.lineTo(-70, 40); ctx.fill();
    ctx.beginPath(); for (let x = -60; x <= 60; x += 7) { ctx.moveTo(x, 10 + Math.abs(x) * -0.02); ctx.lineTo(x, 24); } strokeLine(ctx, 1.4, NC.trimSh);
    ctx.beginPath(); ctx.moveTo(-70, 6); ctx.quadraticCurveTo(0, 16, 70, 4); strokeLine(ctx, R.lw * 0.7);
    // kangaroo pocket
    ctx.beginPath(); ctx.moveTo(-34, 4); ctx.lineTo(-40, -22); ctx.quadraticCurveTo(-28, -40, -10, -40); ctx.lineTo(14, -40); ctx.quadraticCurveTo(34, -40, 44, -22); ctx.lineTo(40, 4);
    strokeLine(ctx, R.lw * 0.7, NC.hoodieSh);
    ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-35, -20); ctx.quadraticCurveTo(-26, -34, -10, -35); ctx.lineTo(14, -35); ctx.quadraticCurveTo(30, -35, 39, -20); ctx.lineTo(35, 0);
    strokeLine(ctx, 1.3, NC.trim); ctx.setLineDash([]);
    // center fold
    ctx.beginPath(); ctx.moveTo(4, -100); ctx.quadraticCurveTo(0, -70, 6, -44); strokeLine(ctx, 1.6, 'rgba(20,60,60,0.35)');
    ctx.restore();
    ctx.beginPath(); blob(ctx, Tb); strokeLine(ctx, R.lw);
    // hood roll around the neck
    const hood = [[-48, -112], [-34, -128], [0, -134], [34, -128], [50, -112], [30, -100], [0, -104], [-30, -100]];
    part(ctx, R, c => blob(c, hood), NC.hoodie, NC.hoodieSh, { d: 6 });
    ctx.beginPath(); ctx.moveTo(-26, -106); ctx.quadraticCurveTo(0, -116, 28, -106); strokeLine(ctx, R.lw * 0.8, NC.hoodieSh);
    // drawstrings
    for (const [sx, ph] of [[-10, 0], [10, 1.4]]) {
      const sw = sway * 5 + Math.sin(t * 2.3 + ph) * 1.5 - vel[0] * 0.01;
      ctx.beginPath(); ctx.moveTo(sx, -104); ctx.quadraticCurveTo(sx + sw * 0.4, -86, sx + sw, -66);
      ctx.lineWidth = 3.4 + R.lw * 1.4; ctx.strokeStyle = O; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 3.4; ctx.strokeStyle = NC.string; ctx.stroke();
      part(ctx, R, c => c.roundRect(sx + sw - 3, -68, 6, 10, 2), '#d8d2c8', null, { lw: R.lw * 0.6, rim: false });
    }
    // pin (Star of David on blue/white)
    const px = -26, py = -80;
    part(ctx, R, c => C(c, px, py, 8.5), NC.pinBg, '#cfd6e6', { d: 3, lw: R.lw * 0.6 });
    ctx.beginPath();
    for (const r0 of [0, Math.PI]) { for (let i = 0; i < 3; i++) { const a = r0 - Math.PI / 2 + i * A.TAU / 3; const X = px + Math.cos(a) * 5.4, Y = py + Math.sin(a) * 5.4; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); }
    strokeLine(ctx, 1.5, NC.pin);
  }

  function noaArm(ctx, R, s, arm, col, handKind) {
    const { sh, e, w, dir } = arm;
    drawHand(ctx, R, [w[0] + Math.cos(dir) * 3, w[1] + Math.sin(dir) * 3], dir, handKind, NOA.handSz, s, NC.skin, NC.skinSh);
    part(ctx, R, c => tube(c, [sh, e, w], [17, 16, 15]), col, NC.hoodieSh, { d: 8 });
    ctx.save(); ctx.translate(w[0], w[1]); ctx.rotate(dir);
    part(ctx, RR(R, dir), c => c.roundRect(-9, -16, 13, 32, 6), NC.trim, NC.trimSh, { d: 4 });
    ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(-6, i * 8); ctx.lineTo(2, i * 8); } strokeLine(ctx, 1.2, NC.trimSh);
    ctx.restore();
  }

  function mug(ctx, R, x, y, t, steam, tilt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-tilt * 0.5);
    // handle
    part(ctx, R, c => { c.moveTo(16, -18); c.bezierCurveTo(34, -20, 34, 6, 16, 4); c.lineTo(16, -3); c.bezierCurveTo(26, -2, 26, -12, 16, -11); c.closePath(); }, NC.mug, NC.mugSh, { d: 3 });
    const body = c => { c.moveTo(-18, -24); c.lineTo(18, -24); c.lineTo(16, 10); c.quadraticCurveTo(0, 16, -16, 10); c.closePath(); };
    part(ctx, R, body, NC.mug, NC.mugSh, { d: 7 });
    ctx.save(); ctx.beginPath(); body(ctx); ctx.clip(); ctx.fillStyle = NC.mugBand; ctx.fillRect(-20, -12, 40, 7);
    // tiny heart
    ctx.fillStyle = NC.mugBand; ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-6, 1, -4, -3, 0, -1); ctx.bezierCurveTo(4, -3, 6, 1, 0, 6); ctx.fill();
    ctx.restore();
    part(ctx, R, c => E(c, 0, -24, 18, 5), NC.cocoa, null, { lw: R.lw * 0.8, rim: false });
    ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); E(ctx, -4, -25, 8, 2); ctx.fillStyle = '#a8674a'; ctx.fill(); ctx.restore();
    // steam
    if (steam > 0) {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.6 + i / 3) % 1, a = Math.sin(ph * Math.PI) * 0.55 * steam;
        ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 - ph * 2;
        const bx = -8 + i * 8, by = -32 - ph * 34;
        ctx.beginPath(); ctx.moveTo(bx, by + 14);
        ctx.bezierCurveTo(bx + 7 * Math.sin(t * 3 + i), by + 8, bx - 7 * Math.sin(t * 3 + i + 1), by + 2, bx + 3 * Math.sin(t * 2 + i), by - 10);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  A.drawNoa = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t || 0;
    const pose = ['sit', 'stand', 'crouch'].includes(o.pose) ? o.pose : 'stand';
    const M = o.moodFrom ? mixObj(NOA_MOODS[o.moodFrom] || NOA_MOODS.neutral, NOA_MOODS[o.mood] || NOA_MOODS.neutral, clamp(o.moodK ?? 1)) : (NOA_MOODS[o.mood] || NOA_MOODS.neutral);
    const hug = clamp(o.hug ?? 0);
    const flip = o.flip ? -1 : 1, idle = o.idle ?? 1, breath = o.breath ?? 1, vel = o.vel || [0, 0];
    const lwPx = o.lw ?? clamp(5 * scale, 2.5, 7);
    const lightS = o.light || [-0.6, -0.8], ll = Math.hypot(lightS[0], lightS[1]) || 1;
    const R = { lw: lwPx / scale, L: [lightS[0] / ll * flip, lightS[1] / ll], rimC: o.rimColor || '#ffd7a0', rimA: o.rimA ?? 0.55 };
    const br = Math.sin(t * A.TAU / 3.0) * breath;
    const m = clamp(o.mouth ?? A.mouth('NOA', t));
    const lip = lipShape(m, t, 29);
    const gName = o.gesture || 'none';
    const bounce = clamp((o.bounce ?? 0) + (gName === 'cheer' ? 0.8 : 0) + (o.mood === 'joy' ? 0.35 : 0) + hug * 0.3);

    ctx.save();
    ctx.translate(x, y); ctx.scale(scale * flip, scale);
    const sq = o.squash ?? 0; ctx.scale(1 + sq * 0.5, 1 - sq);
    const legs = noaLegs(pose, o);
    if (pose === 'sit' && o.sitStyle !== 'floor') ctx.translate(0, o.floor ?? 100);
    if (o.shadow ?? (pose !== 'sit' || o.sitStyle === 'floor')) {
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 80, [[0, 'rgba(20,10,30,0.33)'], [1, 'rgba(20,10,30,0)']]);
      ctx.save(); ctx.scale(1, 0.2); ctx.beginPath(); C(ctx, pose === 'crouch' ? 10 : 0, 0, 85); ctx.fill(); ctx.restore();
    }
    const cheerBob = gName === 'cheer' ? Math.abs(Math.sin(t * 7)) * -8 : 0;
    const P = add(legs.P, [0, -br * 0.8 + cheerBob]);
    const leanDeg = ((o.lean ?? 0) + M.lean) * 22 + (pose === 'crouch' ? 24 : 0) + idle * A.wob(t, 31, 0.33) * 1.2 + hug * -4;
    const lean = leanDeg * D;
    const Rt = RR(R, lean);
    const shoulders = (o.shoulders ?? 0) + (gName === 'shrug' ? 9 : 0);

    // arms
    const G = NG[gName] || NG.none;
    let armL = G.L.slice(), armR = G.R.slice(), hL = G.hL, hR = G.hR;
    if (o.gestureFrom) {
      const G0 = NG[o.gestureFrom] || NG.none, k = A.ease.inOut(clamp(o.gestureK ?? 1));
      armL = lerpArr(G0.L, G.L, k); armR = lerpArr(G0.R, G.R, k); if (k < 0.5) { hL = G0.hL; hR = G0.hR; }
    }
    const toTorso = p => rot([p[0] - P[0], p[1] - P[1]], -lean);
    const shL = [-NOA.shX, NOA.shY - shoulders - br], shR = [NOA.shX - 3, NOA.shY - shoulders - br];
    if (gName === 'reach' && !o.handL && !o.handR) {
      const tg = o.reachTo || (pose === 'crouch' ? [128, -24] : pose === 'sit' ? [120, -(o.floor ?? 100) - 90] : [135, -200]);
      const k = o.gestureFrom ? A.ease.inOut(clamp(o.gestureK ?? 1)) : 1;
      const wig = Math.sin(t * 6) * 3;
      armL = lerpArr(armL, ik(shL, toTorso([tg[0] - 8, tg[1] + 2 + wig]), NOA.l1, NOA.l2, -1), k);
      armR = lerpArr(armR, ik(shR, toTorso([tg[0] + 14, tg[1] - 4 - wig]), NOA.l1, NOA.l2, 1), k);
    }
    if (hug > 0) {
      const H = NG.hug; armL = lerpArr(armL, H.L, A.ease.inOut(hug)); armR = lerpArr(armR, H.R, A.ease.inOut(hug));
      if (hug > 0.5) { hL = 'relax'; hR = 'relax'; }
    }
    if (o.armL) armL = o.armL; if (o.armR) armR = o.armR;
    if (o.handL) armL = ik(shL, toTorso(o.handL), NOA.l1, NOA.l2, -1);
    if (o.handR) armR = ik(shR, toTorso(o.handR), NOA.l1, NOA.l2, 1);
    hL = o.handShapeL || hL; hR = o.handShapeR || hR;
    if (gName === 'cheer') { const pm = Math.sin(t * 7) * 8; armL = [armL[0] + pm, armL[1]]; armR = [armR[0] - pm, armR[1]]; }
    armL = [armL[0] + idle * A.wob(t, 41, 0.4) * 1.5, armL[1]]; armR = [armR[0] + idle * A.wob(t, 43, 0.4) * 1.5, armR[1]];
    const aL = armPts(shL, armL[0], armL[1], NOA.l1, NOA.l2, -1); aL.sh = shL;
    const aR = armPts(shR, armR[0], armR[1], NOA.l1, NOA.l2, 1); aR.sh = shR;
    const rBehind = o.armRBehind ?? (hug > 0.3 || (aR.w[0] > NOA.shX * 0.6 && aR.w[1] > NOA.shY - 40));
    const torsoFrame = () => { ctx.translate(P[0], P[1]); ctx.rotate(lean); };

    if (rBehind) { ctx.save(); torsoFrame(); noaArm(ctx, Rt, 1, aR, mix(NC.hoodie, NC.hoodieSh, 0.35), hR); ctx.restore(); }

    // legs (crouch: drawn after the torso so the knees come forward)
    const legOrder = legs.cross ? [[-1, legs.L], [1, legs.R]] : [[1, legs.R], [-1, legs.L]];
    const drawLegs = () => { for (const [side, L] of legOrder) {
      noaFoot(ctx, R, L[2], side, legs.cross ? side * 0.3 : pose === 'crouch' ? 0.05 : 0);
      part(ctx, R, c => tube(c, [L[0], L[1], L[2]], [19, 16, 13]), NC.jeans, NC.jeansSh, { d: 9 });
      // rolled cuff
      const dx = L[2][0] - L[1][0], dy = L[2][1] - L[1][1], a = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(L[2][0] - Math.cos(a) * 4, L[2][1] - Math.sin(a) * 4); ctx.rotate(a);
      part(ctx, RR(R, a), c => c.roundRect(-6, -15, 11, 30, 4), NC.jeansHi, NC.jeans, { d: 3, lw: R.lw * 0.8 });
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(L[1][0] - 7, L[1][1] - 3); ctx.quadraticCurveTo(L[1][0], L[1][1] + 3, L[1][0] + 7, L[1][1] - 2); strokeLine(ctx, 1.6, NC.jeansSh);
    } };
    if (pose !== 'crouch') drawLegs();

    ctx.save(); torsoFrame();
    noaTorso(ctx, Rt, br, t, Math.sin(lean) + A.wob(t, 51, 0.5) * 0.3, vel);
    if (pose === 'crouch') { ctx.restore(); drawLegs(); ctx.save(); torsoFrame(); }
    // head
    const turn = clamp((o.turn ?? 0.25) + (o.look ? o.look[0] * 0.12 : 0), -1, 1);
    const tilt = ((o.headTilt ?? 0) + M.tilt + (o.look ? o.look[1] * 5 : 0) + idle * A.wob(t, 57, 0.3) * 2.5 + hug * 10 - (pose === 'crouch' ? 12 : 0)) * D;
    ctx.save(); ctx.translate(4 + turn * 4, -124 - br * 1.2); ctx.rotate(tilt); ctx.translate(0, -58);
    const dph = Math.floor(t * 1.1 + 0.7), dart = idle * 0.2;
    const look = [clamp((o.look ? o.look[0] : 0) + dart * (A.hash(dph * 5.3) - 0.5), -1, 1), clamp((o.look ? o.look[1] : 0) + dart * 0.6 * (A.hash(dph * 2.9) - 0.5), -1, 1)];
    const blink = A.blink(t, 17);
    const smile = o.smile ?? lerp(M.smile, 1, hug);
    const F = {
      turn, look, jaw: clamp((o.jaw ?? 0) + m * 0.8 + M.mOpen * 0.4),
      brow: M.brow + (o.browRaise ?? 0) + hug * 0.4, browAng: M.browAng + (o.browAngle ?? 0) + hug * 0.2, browAsym: M.browAsym * (1 - hug), browL: o.browL ?? 0, browR: o.browR ?? 0,
      close: clamp(Math.max(blink, lerp(M.close + (o.lid ?? 0), 0.15, hug))), happy: clamp(lerp(o.happy ?? M.happy, 1, hug)),
      pupil: M.pupil, smile, round: lip.round, asym: M.asym * (1 - hug),
      mouthW: 1 + lip.wide * 0.25 - lip.round * 0.2, mouthH: clamp(lerp(M.mOpen, 0.35, hug) + m * (1 - M.mOpen * 0.5)) * 26,
      tongue: M.tongue * (m < 0.05 ? 1 : 0), blush: lerp(M.blush, 0.9, hug),
    };
    noaHead(ctx, RR(Rt, tilt), F, t, bounce);
    ctx.restore();
    // front arms (+ mug)
    if (gName === 'mug' && hug < 0.5) {
      const mugTilt = clamp(o.mugTilt ?? 0);
      const mp = lerp2([(aL.w[0] + aR.w[0]) / 2 + 4, (aL.w[1] + aR.w[1]) / 2 - 6], [20, -170], mugTilt);
      if (!rBehind) noaArm(ctx, Rt, 1, aR, NC.hoodie, hR);
      mug(ctx, Rt, mp[0], mp[1], t, o.steam ?? 1, mugTilt);
      noaArm(ctx, Rt, -1, aL, NC.hoodie, hL);
    } else {
      noaArm(ctx, Rt, -1, aL, NC.hoodie, hL);
      if (!rBehind) noaArm(ctx, Rt, 1, aR, NC.hoodie, hR);
    }
    ctx.restore();
    ctx.restore();
  };
})();
