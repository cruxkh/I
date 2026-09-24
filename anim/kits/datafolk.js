// ============================================================================
// kits/datafolk.js — the citizens of the data world: BIT (hero), CATPACKET, generic packets, SHARK,
// and the binary light-trail. Pure functions of their options (deterministic, no state between frames).
//
// COMMON: every draw fn does save()/restore(). (x,y) = ground contact (bottom centre) unless noted.
//   o.t      global time (s) — breathing, blinks, cycles, secondary motion.       default 0
//   o.flip   mirror horizontally (text on tags/labels stays readable).           default false
//   o.look   [dx,dy] in -1..1 eye direction.                                     default mood/limb based
//   o.lw     outline width in LOCAL units (auto: ~4-6px on screen, grows gently with scale)
//
// ---------------------------------------------------------------------------------------------------
// A.drawBit(ctx, x, y, scale, o)          ~122 px tall at scale 1 (body 112 wide). Recommended scales:
//     wide shots 0.5-1, medium 1.4-2.2, close-ups 3-5.  A.bitCore(x,y,scale,o) -> [x,y] of his glowing core
//     (use it as the head of A.drawBinaryTrail).
//   o.mood     'determined'|'panic'|'cheeky'|'joy'|'exhausted'|'squeeze'|'neutral'   default 'determined'
//   o.limbs    'run'|'fly'|'flop'|'arms-up'  (+ extras 'stand'|'crouch'|'push')
//              default: exhausted->'flop', squeeze->'push', boost>0.3 or |vel|>900 ->'fly', |vel|>60 ->'run', else 'stand'
//   o.vel      [vx,vy] px/s on screen -> squash/stretch along motion, light-trail length, tag drag, lean.  [0,0]
//   o.boost    0..1 rocket flame (opposite to vel, or downward when still) + pulsing energy aura + sparks.  0
//   o.wink     0..1 closes one eye into a happy '^' with brow/smirk (o.winkEye 'L'|'R', default 'R').      0
//   o.glow     0..2 overall light: core brightness, halo, rim.                                           1
//   o.mouth    0..1 mouth open. default A.mouth('BIT', t)  (lip-sync). Mood adds a minimum (panic/joy/...).
//   o.look     [dx,dy] eye direction; features also shift for a 3/4-turn feel.
//   o.rot      extra rotation (rad, +clockwise; pivot at feet, or body centre when flying)                0
//   o.squash   extra squash (+ flatter/wider, - taller/narrower), pivot at feet                             0
//   o.stretch  multiplier on velocity stretch                                                              1
//   o.armL / o.armR  [x,y] override hand positions (local units, origin=feet, y up is negative)
//   o.legL / o.legR  [x,y] override foot positions
//   o.browRaise  extra brow height (local px, + up) both brows; o.browL/o.browR per brow                   0
//   o.lid       extra upper-lid closing 0..1 (sleepy/deadpan) added to mood lids                         0
//   o.pupil     pupil/iris size multiplier                                                              mood
//   o.blink     0..1 force blink amount (default natural A.blink(t, 5401))
//   o.phase     run/cycle phase override (rad); o.runRate Hz (default 2.6)
//   o.trail     trail length multiplier (0 = no light-trail)                                             1
//   o.trailColor css colour of the light trail                                                   '#ffc93c'
//   o.tagAng    extra luggage-tag angle (rad); o.tagSwing swing amount multiplier (default 1)
//   o.light     [lx,ly] direction TO the key light (for cel-shadow + rim)                          [0.6,-0.8]
//   o.rim       rim-light colour                                                                    '#a8f7ff'
//   o.shadow    0..1 ground contact shadow alpha (draws an ellipse at (x,y))                               0
//   o.sweat     0..1 override sweat drops; o.sparkle 0..1 override sparkles
//   o.hop       extra vertical lift (local px) of whole character                                           0
//
// A.drawPacket(ctx, x, y, scale, o)       generic commuter packet, ~90 px tall. Scales 0.4-2.5. Cheap: the
//   body is a cached sprite per kind/variant/resolution, only eyes/mouth/pops are drawn live.
//   o.kind   'mail'|'video'|'meme'|'update'|'shop'|'photo'                 default by seed
//   o.seed   integer — picks shape (wide/tall), accessory (headphones, beanie, tie, glasses), tone, phases
//   o.mood   'bored'|'annoyed'|'sleep'|'shock'                              default 'bored'
//   o.honk   0..1 angry "HONK!" pop + anger mark + shouting mouth (animate 0->1->0)                  0
//   o.mouth  0..1 extra mouth open;  o.look [dx,dy];  o.rot (rad);  o.squash;  o.glow 0..2 (0.7)
//   o.flip   mirrors look direction only;  o.noZ true hides the floating 'z' of sleepers
//
// A.drawCatPacket(ctx, x, y, scale, o)    huge grumpy lilac cat packet, ~265 px tall (ears incl.), 290 wide.
//   o.mood  'bored'|'grumpy'|'shock'   default 'bored'
//   o.mouth default A.mouth('CATPACKET', t);  o.look;  o.arms 'crossed'|'down'|'point' (thumb back over
//   shoulder, toward -x)   default 'crossed';  o.lid extra lid;  o.browRaise;  o.rot;  o.squash;  o.glow (1)
//   o.tail  tail sway multiplier (1);  o.shades  0..1 sunglasses slide DOWN onto the eyes (0 = pushed up)
//
// A.drawShark(ctx, x, y, scale, o)        (x,y) = BODY CENTRE. ~720 px long at scale 1, faces right.
//   o.bite  0..1 jaw open (0 closed, 1 wide open)       default hungry 0.15, dazed 0.3
//   o.mood  'hungry'|'dazed'                            default 'hungry'
//   o.swim  swim phase (rad), default t*2PI*1.3;  o.look [dx,dy];  o.flip (face left);  o.rot (rad)
//   o.bandaid true -> sticking plaster on the nose;  o.stars 0..1 dazed stars amount (default 1 when dazed)
//   A.sharkNose(x,y,scale,o) -> [x,y] nose tip on screen (bounce target), A.sharkJaw(...) -> mouth point.
//
// A.drawBinaryTrail(ctx, pts, t, o)        pts = [[x,y],...] from TAIL (oldest) to HEAD (at the character).
//   o.color '#ffc93c'  o.width 30 (ribbon width at head)  o.size 20 (digit px)  o.alpha 1  o.speed 90 (px/s the
//   digits drift toward the tail)  o.spacing size*0.95  o.rows 2  o.seed 0  o.core '#fff6d0'  o.digits true
// ============================================================================
(() => {
  const TAU = Math.PI * 2;
  const OL = () => A.OUTLINE;
  const frac = v => v - Math.floor(v);

  // ---------------------------------------------------------------- shared helpers
  function blobTo(ctx, pts) {
    const n = pts.length, P = i => pts[(i + n) % n];
    ctx.moveTo(P(0)[0], P(0)[1]);
    for (let i = 0; i < n; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  }
  const blob = (ctx, pts) => { ctx.beginPath(); blobTo(ctx, pts); };
  // squircle ("chubby cube") points; taper>0 makes the bottom wider
  function squircle(a, b, n, N, taper, cx, cy) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU, c = Math.cos(th), s = Math.sin(th);
      const X = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * a, Y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * b;
      pts.push([cx + X * (1 + taper * (Y / b)), cy + Y]);
    }
    return pts;
  }
  const shift = (pts, dx, dy) => pts.map(p => [p[0] + dx, p[1] + dy]);
  // fill the region inside `pts` but outside `pts` shifted by (dx,dy): a cel crescent
  function cel(ctx, pts, dx, dy, fill, alpha = 1) {
    ctx.save(); blob(ctx, pts); ctx.clip();
    ctx.beginPath(); ctx.rect(-4000, -4000, 8000, 8000); blobTo(ctx, shift(pts, dx, dy));
    ctx.globalAlpha *= alpha; ctx.fillStyle = fill; ctx.fill('evenodd'); ctx.restore();
  }
  const stroke = (ctx, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  const fill = (ctx, col) => { ctx.fillStyle = col; ctx.fill(); };
  const fs = (ctx, col, lw) => { fill(ctx, col); if (lw) stroke(ctx, OL(), lw); };
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); };
  const autoLW = (base, scale) => base * Math.pow(Math.max(scale, 0.05), -0.4);
  function star(ctx, x, y, r, pts = 5, inner = 0.45, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) { const rr = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / pts; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function sparkle(ctx, x, y, r, a = 1, col = '#fffbe0') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); fill(ctx, col);
    A.glow(ctx, x, y, r * 1.6, col, 0.5); ctx.restore();
  }
  function sweatDrop(ctx, x, y, r, lw, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, -r * 1.9);
    ctx.bezierCurveTo(r * 0.35, -r * 1.2, r, -r * 0.45, r, r * 0.1); ctx.arc(0, r * 0.1, r, 0, Math.PI);
    ctx.bezierCurveTo(-r, -r * 0.45, -r * 0.35, -r * 1.2, 0, -r * 1.9); ctx.closePath();
    fs(ctx, '#c9f6ff', lw); A.ellipse(ctx, -r * 0.35, -r * 0.05, r * 0.22, r * 0.38, 0.3); fill(ctx, '#ffffff'); ctx.restore();
  }
  // soccer ball (procedural — no emoji font needed)
  function ball(ctx, x, y, r, lw, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    circle(ctx, 0, 0, r); ctx.fillStyle = A.radial(ctx, -r * 0.35, -r * 0.4, 0, r * 1.3, [[0, '#ffffff'], [0.7, '#eef0f8'], [1, '#b9bfd6']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#1d1733';
    const pent = (cx, cy, rr, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + (i * TAU) / 5; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    pent(0, 0, r * 0.36, -Math.PI / 2);
    ctx.lineWidth = r * 0.07; ctx.strokeStyle = '#1d1733';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 5;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36); ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.stroke();
      pent(Math.cos(a + TAU / 10) * r * 0.98, Math.sin(a + TAU / 10) * r * 0.98, r * 0.36, a + TAU / 10);
    }
    ctx.restore();
    circle(ctx, 0, 0, r); if (lw) stroke(ctx, OL(), lw);
    ctx.restore();
  }

  // Big cartoon eye with whites, iris, pupil, highlights, upper & lower lids.
  // e: {lx,ly, cov(upper lid 0..1), tilt(+ inner lower), inner(+1 left eye, -1 right eye), low, pupil, iris, irisDark,
  //     pupilCol, lid, lw, slit, hi}
  function eye(ctx, ex, ey, rx, ry, e) {
    const lw = e.lw, cov = A.clamp(e.cov, 0, 1);
    ctx.save();
    A.ellipse(ctx, ex, ey, rx, ry);
    ctx.fillStyle = A.linear(ctx, 0, ey - ry, 0, ey + ry * 0.2, [[0, e.whiteTop || '#d9d2ec'], [0.55, '#ffffff'], [1, '#fffdf7']]);
    ctx.fill(); ctx.clip();
    const ri = rx * 0.7 * (e.pupil ?? 1);
    const ix = ex + (e.lx || 0) * rx * 0.42, iy = ey + (e.ly || 0) * ry * 0.4 + ry * 0.06;
    A.ellipse(ctx, ix, iy, ri, ri * 1.08);
    ctx.fillStyle = A.radial(ctx, ix, iy + ri * 0.45, 0, ri * 1.25, [[0, e.irisLight || e.iris], [0.55, e.iris], [1, e.irisDark]]); ctx.fill();
    if (e.slit) { A.ellipse(ctx, ix, iy, ri * 0.2 * e.slit, ri * 0.82); fill(ctx, e.pupilCol || '#0d0820'); }
    else { A.ellipse(ctx, ix, iy, ri * 0.56, ri * 0.6); fill(ctx, e.pupilCol || '#0d0820'); }
    // highlights
    const hs = (e.hi ?? 1) * (1 + (e.hiBoost || 0) * 0.3);
    A.ellipse(ctx, ix + ri * 0.36, iy - ri * 0.42, ri * 0.36 * hs, ri * 0.32 * hs, -0.4); fill(ctx, '#ffffff');
    circle(ctx, ix - ri * 0.38, iy + ri * 0.38, ri * 0.14 * hs); fill(ctx, 'rgba(255,255,255,0.9)');
    // upper lid
    if (cov > 0.005) {
      const k = Math.min(1, cov * 4), yl = ey - ry + cov * 2.05 * ry;
      const tY = (e.tilt || 0) * ry * 0.55 * k * (e.inner || 1);
      const yR = yl + tY, yL = yl - tY, sag = ry * 0.28 * (1 - cov * 0.6);
      ctx.beginPath(); ctx.moveTo(ex - rx - 3, ey - ry - 3); ctx.lineTo(ex + rx + 3, ey - ry - 3); ctx.lineTo(ex + rx + 3, yR);
      ctx.quadraticCurveTo(ex, (yR + yL) / 2 + sag, ex - rx - 3, yL); ctx.closePath();
      ctx.fillStyle = e.lid; ctx.fill();
      ctx.beginPath(); ctx.moveTo(ex + rx + 3, yR); ctx.quadraticCurveTo(ex, (yR + yL) / 2 + sag, ex - rx - 3, yL); stroke(ctx, OL(), lw * 1.15);
    }
    if ((e.low || 0) > 0.005) {
      const yb = ey + ry - e.low * 2 * ry;
      ctx.beginPath(); ctx.moveTo(ex - rx - 3, ey + ry + 3); ctx.lineTo(ex + rx + 3, ey + ry + 3); ctx.lineTo(ex + rx + 3, yb + ry * 0.15);
      ctx.quadraticCurveTo(ex, yb - ry * 0.28, ex - rx - 3, yb + ry * 0.15); ctx.closePath(); ctx.fillStyle = e.lid; ctx.fill();
      ctx.beginPath(); ctx.moveTo(ex + rx + 3, yb + ry * 0.15); ctx.quadraticCurveTo(ex, yb - ry * 0.28, ex - rx - 3, yb + ry * 0.15); stroke(ctx, OL(), lw * 0.6);
    }
    ctx.restore();
    A.ellipse(ctx, ex, ey, rx, ry); stroke(ctx, OL(), lw * 0.85);
    if (cov < 0.2) { ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.12, Math.PI * 1.88); stroke(ctx, OL(), lw * 1.35); }
  }
  // closed happy eye '^'
  function arcEye(ctx, ex, ey, rx, ry, lw, up = 1) {
    ctx.beginPath(); ctx.moveTo(ex - rx * 0.9, ey + ry * 0.25 * up); ctx.quadraticCurveTo(ex, ey - ry * 0.95 * up, ex + rx * 0.9, ey + ry * 0.25 * up);
    stroke(ctx, OL(), lw * 1.5);
  }
  // mouth: closed curve or open shape with teeth/tongue. curve + = smile. asym + raises the right corner.
  function mouthShape(ctx, mx, my, w, open, curve, asym, lw, P = {}) {
    const hw = w / 2;
    const yL = my - curve * 0.5 + asym * 0.5, yR = my - curve * 0.5 - asym * 0.5;
    if (open < 0.06) {
      if (P.grit) {
        const gh = 7 + P.grit * 3;
        A.rrect(ctx, mx - hw, my - gh / 2, w, gh, gh / 2); fill(ctx, '#ffffff');
        ctx.save(); ctx.clip(); ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(mx - hw + (w * i) / 4, my - gh); ctx.lineTo(mx - hw + (w * i) / 4, my + gh); }
        ctx.moveTo(mx - hw, my); ctx.lineTo(mx + hw, my); stroke(ctx, 'rgba(26,19,48,0.5)', lw * 0.45); ctx.restore();
        A.rrect(ctx, mx - hw, my - gh / 2, w, gh, gh / 2); stroke(ctx, OL(), lw * 0.9);
        return;
      }
      ctx.beginPath(); ctx.moveTo(mx - hw, yL);
      if (P.wavy) { ctx.bezierCurveTo(mx - hw * 0.4, my - 3, mx - hw * 0.1, my + 3, mx, my); ctx.bezierCurveTo(mx + hw * 0.1, my - 3, mx + hw * 0.4, my + 3, mx + hw, yR); }
      else ctx.quadraticCurveTo(mx + asym * 0.4, my + curve * 0.75, mx + hw, yR);
      stroke(ctx, OL(), lw * 1.05);
      if (curve > 3) { // dimples
        ctx.beginPath(); ctx.arc(mx - hw - 1.5, yL + 1, 3, Math.PI * 1.2, Math.PI * 1.9); stroke(ctx, OL(), lw * 0.6);
        ctx.beginPath(); ctx.arc(mx + hw + 1.5, yR + 1, 3, Math.PI * 1.1, Math.PI * 1.8); stroke(ctx, OL(), lw * 0.6);
      }
      return;
    }
    const h = 2 + open * (P.depth || 18), ww = hw * (1 - open * 0.18);
    const Lx = mx - ww, Rx = mx + ww, bot = my + h * 1.2 + Math.max(0, curve) * 0.25;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(Lx, yL); ctx.quadraticCurveTo(mx + asym * 0.3, my + curve * 0.3, Rx, yR);
      ctx.bezierCurveTo(Rx + ww * 0.1, yR + h * 0.8, mx + ww * 0.5, bot, mx, bot);
      ctx.bezierCurveTo(mx - ww * 0.5, bot, Lx - ww * 0.1, yL + h * 0.8, Lx, yL); ctx.closePath();
    };
    path(); fill(ctx, P.inside || '#4b0f2e');
    ctx.save(); ctx.clip();
    A.ellipse(ctx, mx + ww * 0.12, bot + h * 0.12, ww * 0.62, h * 0.55); fill(ctx, P.tongue || '#ff6f8e');
    if (open > 0.22 || P.teeth) {
      ctx.beginPath(); ctx.moveTo(Lx, yL); ctx.quadraticCurveTo(mx + asym * 0.3, my + curve * 0.3, Rx, yR); stroke(ctx, '#ffffff', Math.min(lw * 1.9, 3 + h * 0.3));
    }
    ctx.restore();
    path(); stroke(ctx, OL(), lw);
  }
  function brow(ctx, x0, y0, x1, y1, bend, lw, col) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - bend, x1, y1); stroke(ctx, col, lw);
  }
  function limb(ctx, x0, y0, cx, cy, x1, y1, w, col, lw) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1);
    stroke(ctx, OL(), w + lw * 2); stroke(ctx, col, w);
  }

  // ============================================================== BIT
  const BIT = A.BIT_COLORS = {
    gold: '#ffc93c', light: '#ffe68c', core: '#fffcea', edge: '#f2a12c', shade: '#e0801e', lid: '#f6b638',
    brow: '#4d1f08', iris: '#2f6fe0', irisLight: '#6fb4ff', irisDark: '#122a78', blush: '#ff6a7c',
    glove: '#fffaf0', shoe: '#1f4fbf', sole: '#f4f6ff', rim: '#a8f7ff', tagPaper: '#fff3d6', tagBand: '#1f4fbf', string: '#e0314f',
  };
  const BM = {
    determined: { cov: [0.2, 0.2], tilt: 0.7, low: [0.14, 0.14], bi: [-8, -8], bo: [3, 3], curve: 2, mw: 18, asym: 4, pupil: 1, eyeS: 1, minOpen: 0 },
    panic: { cov: [0, 0], tilt: 0, low: [0, 0], bi: [13, 13], bo: [4, 4], curve: -6, mw: 20, asym: 0, pupil: 0.6, eyeS: 1.12, minOpen: 0.34, tremble: 1.3, sweat: 1 },
    cheeky: { cov: [0.42, 0.34], tilt: -0.1, low: [0.22, 0.2], bi: [-3, 6], bo: [-2, 12], curve: 7, mw: 22, asym: 6, pupil: 1, eyeS: 1, minOpen: 0, sparkle: 0.6, look: [0.35, -0.1] },
    joy: { cov: [0, 0], tilt: 0, low: [0, 0], bi: [8, 8], bo: [5, 5], curve: 9, mw: 26, asym: 0, pupil: 1.05, eyeS: 1, minOpen: 0.32, arcs: 1, sparkle: 1 },
    exhausted: { cov: [0.58, 0.52], tilt: -0.4, low: [0.12, 0.12], bi: [6, 6], bo: [-6, -6], curve: -2, mw: 14, asym: 0, pupil: 0.95, eyeS: 0.96, minOpen: 0.14, pant: 1, sweat: 0.8, limbs: 'flop', look: [0, 0.5] },
    squeeze: { cov: [0.46, 0.62], tilt: 0.4, low: [0.3, 0.36], bi: [-7, -10], bo: [2, 2], curve: -4, mw: 22, asym: -2, pupil: 0.9, eyeS: 0.95, minOpen: 0, grit: 1, sweat: 1, squash: -0.13, limbs: 'push', tremble: 0.5 },
    neutral: { cov: [0.1, 0.1], tilt: 0, low: [0.05, 0.05], bi: [2, 2], bo: [2, 2], curve: 5, mw: 18, asym: 0, pupil: 1, eyeS: 1, minOpen: 0 },
  };
  const BA = 56, BB = 52, BCY = -70; // body half-width, half-height, centre y (local)
  A.bitCore = (x, y, scale = 1) => [x, y + (BCY + 8) * scale];

  function bitPose(limbs, t, o, M, sp, vx, vy) {
    const P = { bob: 0, hop: 0, sq: M.squash || 0, rot: 0, pivotY: 0, arms: null, legs: null, ph: 0, look: null };
    const br = Math.sin(t * TAU * 0.7 + 0.3), SH = BCY + 10;
    if (limbs === 'run') {
      const ph = (P.ph = o.phase ?? t * TAU * (o.runRate ?? 2.6));
      P.bob = -Math.abs(Math.sin(ph)) * 7 + 2;
      const amp = 12 + Math.min(sp, 800) / 90;
      P.legs = [0, 1].map(i => {
        const p = ph + i * Math.PI, lift = Math.max(0, Math.cos(p));
        return { hip: [i ? 13 : -13, -24 + P.bob], foot: [(i ? 5 : -5) + Math.sin(p) * amp, -5 - lift * 14], ang: Math.sin(p) * 0.4 - lift * 0.3 };
      });
      P.arms = [0, 1].map(i => {
        const p = ph + i * Math.PI, s = i ? 1 : -1;
        return { s: [s * 48, SH + P.bob], h: [s * 60 - Math.sin(p) * 18, SH + 24 + P.bob - Math.abs(Math.sin(p)) * 7], bend: 6 };
      });
      P.rot = A.clamp(vx / 2400, -0.18, 0.18) + 0.05;
      P.look = [0.6, 0];
    } else if (limbs === 'fly') {
      const fl = Math.sin(t * TAU * 3.1);
      P.rot = (sp > 30 ? A.clamp(Math.atan2(vy, Math.max(Math.abs(vx), 1)), -1.1, 1.1) * 0.75 : 0) + 0.1;
      P.pivotY = BCY;
      P.arms = [
        { s: [-48, SH + 2], h: [-72, SH + 22 + fl * 3], bend: 5 },
        { s: [46, SH - 6], h: [92, SH - 30 + fl * 2], bend: -4, fist: true },
      ];
      P.legs = [
        { hip: [-12, -24], foot: [-42, -10 + fl * 4], ang: -1.1 },
        { hip: [12, -24], foot: [-16, -2 - fl * 4], ang: -0.8 },
      ];
      P.look = [0.75, -0.05];
    } else if (limbs === 'flop') {
      P.bob = 9; P.sq += 0.08 + 0.025 * br;
      P.rot = A.wob(t, 5, 0.45) * 0.05 - 0.04;
      P.arms = [{ s: [-50, BCY + 22 + P.bob], h: [-80, -9], bend: -6 }, { s: [50, BCY + 22 + P.bob], h: [80, -9], bend: -6 }];
      P.legs = [{ hip: [-18, -20 + P.bob], foot: [-40, -8], ang: -1.25, sole: true }, { hip: [18, -20 + P.bob], foot: [40, -8], ang: 1.25, sole: true }];
    } else if (limbs === 'arms-up') {
      const hp = t * TAU * 1.7, s = Math.sin(hp);
      P.hop = Math.max(0, s) * 18; P.sq += Math.max(0, -s) * 0.1 - Math.max(0, s) * 0.06;
      P.arms = [0, 1].map(i => {
        const sd = i ? 1 : -1, w = Math.sin(t * TAU * 2.6 + i * 1.7);
        return { s: [sd * 46, SH - 2], h: [sd * (54 + w * 7), BCY - 84 + Math.cos(t * TAU * 2.6 + i) * 5], c: [sd * 84, BCY - 30], open: true };
      });
      P.legs = [{ hip: [-14, -24], foot: [-20 - P.hop * 0.15, -5 + P.hop * 0.25], ang: -0.15 }, { hip: [14, -24], foot: [20 + P.hop * 0.15, -5 + P.hop * 0.25], ang: 0.15 }];
    } else if (limbs === 'crouch') {
      P.bob = 7; P.sq += 0.2;
      P.arms = [{ s: [-48, SH + 10], h: [-76, SH + 36], bend: 4 }, { s: [48, SH + 10], h: [76, SH + 36], bend: 4 }];
      P.legs = [{ hip: [-16, -20], foot: [-32, -5], ang: -0.35 }, { hip: [16, -20], foot: [32, -5], ang: 0.35 }];
      P.look = [0.3, -0.5];
    } else if (limbs === 'push') {
      const tr = A.noise1(t * 26) * 1.6;
      P.arms = [{ s: [-48, SH], h: [-86, SH - 4 + tr], bend: 3, open: true }, { s: [48, SH], h: [86, SH - 4 - tr], bend: 3, open: true }];
      P.legs = [{ hip: [-15, -24], foot: [-28, -5], ang: -0.3 }, { hip: [15, -24], foot: [28, -5], ang: 0.3 }];
    } else { // stand
      P.arms = [{ s: [-48, SH + 2], h: [-64, SH + 32 + br * 1.5], bend: 4 }, { s: [48, SH + 2], h: [64, SH + 32 + br * 1.5], bend: 4 }];
      P.legs = [{ hip: [-15, -24], foot: [-19, -5], ang: -0.12 }, { hip: [15, -24], foot: [19, -5], ang: 0.12 }];
    }
    if (o.armL) P.arms[0].h = o.armL; if (o.armR) P.arms[1].h = o.armR;
    if (o.legL) P.legs[0].foot = o.legL; if (o.legR) P.legs[1].foot = o.legR;
    return P;
  }
  function glove(ctx, x, y, r, lw, open, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    if (open) { // mitten with thumb
      A.ellipse(ctx, r * 0.1, -r * 0.75, r * 0.42, r * 0.6, 0.5); fs(ctx, BIT.glove, lw * 0.8);
    }
    A.ellipse(ctx, 0, 0, r, r * 0.92); fs(ctx, BIT.glove, lw * 0.9);
    A.ellipse(ctx, -r * 0.3, -r * 0.3, r * 0.3, r * 0.2, -0.6); fill(ctx, '#ffffff');
    ctx.restore();
  }
  function shoe(ctx, x, y, ang, lw, sole) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    if (sole) { // sole facing the camera
      A.ellipse(ctx, 0, 0, 8.5, 11); fs(ctx, BIT.sole, lw * 0.9);
      A.ellipse(ctx, 0, -3, 4.5, 4); fill(ctx, '#c9d2f0'); A.ellipse(ctx, 0, 6, 4, 3); fill(ctx, '#c9d2f0');
    } else {
      A.ellipse(ctx, 3, 0, 13, 8.5); fs(ctx, BIT.shoe, lw * 0.9);
      ctx.save(); A.ellipse(ctx, 3, 0, 13, 8.5); ctx.clip();
      ctx.fillStyle = BIT.sole; ctx.fillRect(-12, 4, 30, 6);
      A.ellipse(ctx, 12, 1, 5, 6); fill(ctx, BIT.sole);
      A.ellipse(ctx, -2, -4, 5, 2, -0.2); fill(ctx, 'rgba(255,255,255,0.45)');
      ctx.restore(); A.ellipse(ctx, 3, 0, 13, 8.5); stroke(ctx, OL(), lw * 0.9);
    }
    ctx.restore();
  }
  function drawTag(ctx, px, py, ang, lw, flip) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3.5, 8, 0, 15); stroke(ctx, OL(), 4.2); stroke(ctx, BIT.string, 2.2);
    ctx.translate(0, 15); ctx.scale(flip, 1); ctx.rotate(0.04 * flip);
    const w = 48, h = 31;
    const shape = () => { ctx.beginPath(); ctx.moveTo(-w / 2 + 8, -3); ctx.lineTo(w / 2 - 8, -3); ctx.lineTo(w / 2, 5); ctx.lineTo(w / 2, h - 4); ctx.quadraticCurveTo(w / 2, h, w / 2 - 4, h); ctx.lineTo(-w / 2 + 4, h); ctx.quadraticCurveTo(-w / 2, h, -w / 2, h - 4); ctx.lineTo(-w / 2, 5); ctx.closePath(); };
    shape(); ctx.fillStyle = A.linear(ctx, 0, -3, 0, h, [[0, '#fffaf0'], [1, '#f3dcaa']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = BIT.tagBand; ctx.fillRect(-w, -4, w * 2, 7.5); ctx.fillStyle = 'rgba(160,110,40,0.18)'; ctx.fillRect(-w, h - 5, w * 2, 6); ctx.restore();
    shape(); stroke(ctx, OL(), lw * 0.7);
    circle(ctx, 0, 1.2, 2.6); fs(ctx, '#ffd968', lw * 0.45);
    A.text(ctx, '#5401', 0, 11.5, { font: '800 11px Rubik', fill: '#1a1330' });
    ball(ctx, -16.5, 22.5, 4.3, lw * 0.3);
    A.text(ctx, 'GOAL', 6, 23, { font: '900 10px Rubik', fill: '#e0314f' });
    ctx.restore();
  }

  A.drawBit = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t ?? 0;
    const mood = BM[o.mood] ? o.mood : 'determined', M = BM[mood];
    const flip = o.flip ? -1 : 1;
    const vel = o.vel || [0, 0], vx = vel[0] * flip, vy = vel[1], sp = Math.hypot(vx, vy);
    const boost = A.clamp(o.boost ?? 0, 0, 1), g = A.clamp(o.glow ?? 1, 0, 2);
    const limbs = o.limbs || M.limbs || (boost > 0.3 || sp > 900 ? 'fly' : sp > 60 ? 'run' : 'stand');
    const lw = o.lw ?? autoLW(4.2, scale);
    const P = bitPose(limbs, t, o, M, sp, vx, vy);
    const rot = P.rot + (o.rot || 0), hop = P.hop + (o.hop || 0);
    const bob = P.bob;
    const CY = BCY + bob;
    const br = Math.sin(t * TAU * 0.7 + 0.3);

    ctx.save();
    ctx.translate(x, y); ctx.scale(scale * flip, scale);

    if (o.shadow) { A.ellipse(ctx, 0, -1, 50 - hop * 0.4, 8); fill(ctx, `rgba(5,5,25,${0.35 * o.shadow})`); }

    // ---------- light trail (unrotated local frame) ----------
    const trailK = (o.trail ?? 1) * A.clamp((sp - 60) / 360);
    if (trailK > 0.01) {
      const L = (Math.min(sp * 0.32, 760) / scale + BA * 0.6) * (o.trail ?? 1);
      const tc = o.trailColor || '#ffc93c';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(0, BCY - hop); ctx.rotate(Math.atan2(-vy, -vx));
      ctx.globalAlpha = trailK * Math.min(1, 0.5 + g * 0.5);
      ctx.beginPath(); ctx.moveTo(0, -BB * 0.85); ctx.quadraticCurveTo(L * 0.3, -BB * 0.55, L, 0); ctx.quadraticCurveTo(L * 0.3, BB * 0.55, 0, BB * 0.85); ctx.closePath();
      ctx.fillStyle = A.linear(ctx, 0, 0, L, 0, [[0, A.hex(tc, 0.85)], [0.45, A.hex(tc, 0.42)], [1, A.hex(tc, 0)]]); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -BB * 0.3); ctx.quadraticCurveTo(L * 0.4, -BB * 0.15, L * 0.8, 0); ctx.quadraticCurveTo(L * 0.4, BB * 0.15, 0, BB * 0.3); ctx.closePath();
      ctx.fillStyle = A.linear(ctx, 0, 0, L * 0.8, 0, [[0, 'rgba(255,255,235,0.9)'], [1, 'rgba(255,240,200,0)']]); ctx.fill();
      for (let i = 0; i < 7; i++) { // streaks
        const u = frac(t * 2.6 + A.hash(i * 7.1)), yy = (A.hash(i * 3.3 + 1) - 0.5) * BB * 1.7, x0 = u * L * 0.7 + BA * 0.4, len = L * (0.18 + 0.25 * A.hash(i));
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + len, yy); stroke(ctx, `rgba(255,245,210,${0.6 * (1 - u)})`, 2.5);
      }
      ctx.restore();
    }
    // ---------- boost: aura + flame ----------
    if (boost > 0.01) {
      const dir = sp > 80 ? [-vx / sp, -vy / sp] : [0, 1];
      ctx.save(); ctx.translate(0, BCY - hop);
      A.glow(ctx, 0, 0, 95 + 70 * boost, '#ffd86a', 0.55 * boost);
      A.glow(ctx, 0, 0, 150 + 90 * boost, '#ff3fa4', 0.18 * boost);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const ph = frac(t * 2.4 + i / 3);
        A.ellipse(ctx, 0, 0, BA + 12 + ph * 60, BB + 12 + ph * 56); stroke(ctx, `rgba(255,226,130,${(1 - ph) * 0.55 * boost})`, 3.5 * (1 - ph) + 1);
      }
      ctx.restore();
      ctx.rotate(Math.atan2(dir[1], dir[0]));
      ctx.translate(BA * 0.72, 0);
      ctx.globalCompositeOperation = 'lighter';
      const layers = [['#ff3fa4', 1.0, 1.0, 0.7], ['#ff8a2a', 0.85, 0.72, 0.85], ['#ffe98a', 0.66, 0.5, 0.95], ['#ffffff', 0.44, 0.28, 1]];
      ctx.translate(BA * 0.2, 0);
      layers.forEach(([c, lk, wk, al], i) => {
        const Lf = (70 + 170 * boost) * lk * (0.85 + 0.2 * A.noise1(t * 18 + i * 3)), W = (24 + 20 * boost) * wk;
        ctx.beginPath(); ctx.moveTo(-10, -W); ctx.bezierCurveTo(Lf * 0.3, -W * 1.05, Lf * 0.7, -W * 0.4, Lf, A.noise1(t * 12 + i) * W * 0.25);
        ctx.bezierCurveTo(Lf * 0.7, W * 0.4, Lf * 0.3, W * 1.05, -10, W); ctx.closePath();
        ctx.globalAlpha = al * Math.min(1, boost * 1.6);
        ctx.fillStyle = A.linear(ctx, 0, 0, Lf, 0, [[0, A.hex(c, 1)], [0.55, A.hex(c, 0.75)], [1, A.hex(c, 0)]]); ctx.fill();
      });
      A.glow(ctx, 10, 0, 60 + 30 * boost, '#fff4c0', 0.8 * boost);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 12; i++) {
        const u = frac(t * 3.3 + A.hash(i * 5.7)), px = 20 + u * (120 + 160 * boost), py = (A.hash(i * 2.9) - 0.5) * 50 * (0.4 + u) + A.noise1(t * 5 + i) * 6;
        circle(ctx, px, py, 3.2 * (1 - u) + 0.5); fill(ctx, i % 3 ? '#ffe9a0' : '#ff8fd0');
      }
      ctx.restore();
    }
    // outer halo
    A.glow(ctx, 0, BCY - hop, 125 * (0.55 + 0.45 * g), '#ffbe3a', 0.34 * g + 0.15 * boost);

    // ---------- character frame ----------
    ctx.translate(0, -hop);
    ctx.translate(0, P.pivotY); ctx.rotate(rot); ctx.translate(0, -P.pivotY);
    const sqv = A.clamp((P.sq || 0) + (o.squash || 0), -0.45, 0.55);
    ctx.scale((1 + sqv * 0.75) * (1 - 0.012 * br), (1 - sqv) * (1 + 0.018 * br));
    const k = Math.min(sp / 4200, 0.26) * (o.stretch ?? 1) * (limbs === 'run' ? 0.5 : 1);
    if (k > 0.005) { const ang = Math.atan2(vy, vx) - rot; ctx.translate(0, BCY); ctx.rotate(ang); ctx.scale(1 + k, 1 / (1 + k)); ctx.rotate(-ang); ctx.translate(0, -BCY); }

    // ---------- limbs behind ----------
    const drawLeg = L => {
      const [hx, hy] = L.hip, [fx, fy] = L.foot;
      limb(ctx, hx, hy, (hx + fx) / 2 + 3, (hy + fy) / 2, fx, fy - 3, 10.5, '#f5b030', lw);
      shoe(ctx, fx, fy, L.ang || 0, lw, L.sole);
    };
    const drawArm = (Ar, i) => {
      const [sx, sy] = Ar.s, [hx, hy] = Ar.h;
      const c = Ar.c || [(sx + hx) / 2, (sy + hy) / 2 + (Ar.bend ?? 4)];
      limb(ctx, sx, sy, c[0], c[1], hx, hy, 10.5, '#ffc338', lw);
      glove(ctx, hx, hy, Ar.fist ? 8.5 : 9, lw, Ar.open, Math.atan2(hy - c[1], hx - c[0]) - Math.PI / 2 + (i ? 0.3 : -0.3));
    };
    P.legs.forEach(drawLeg);
    P.arms.forEach((Ar, i) => { if (!Ar.front) drawArm(Ar, i); });

    // ---------- body ----------
    const pts = squircle(BA, BB, 3.1, 40, 0.07, 0, CY);
    let L = o.light || [0.6, -0.8]; L = [L[0] * flip, L[1]];
    { const c = Math.cos(-rot), s = Math.sin(-rot); L = [L[0] * c - L[1] * s, L[0] * s + L[1] * c]; const n = Math.hypot(L[0], L[1]) || 1; L = [L[0] / n, L[1] / n]; }
    const hot = A.clamp(0.14 + 0.16 * g + 0.12 * boost, 0.05, 0.6);
    blob(ctx, pts);
    ctx.fillStyle = A.radial(ctx, -4, CY + 8, 0, BA * 1.3, [
      [0, A.mixc(BIT.gold, BIT.core, Math.min(1, g * 0.9 + boost * 0.3))], [hot, A.mixc(BIT.gold, BIT.light, Math.min(1, g))],
      [Math.min(0.92, hot + 0.36), BIT.gold], [1, BIT.edge]]);
    ctx.fill();
    cel(ctx, pts, L[0] * 11, L[1] * 11, BIT.shade, 0.5);
    cel(ctx, pts, -L[0] * 4, -L[1] * 4, o.rim || BIT.rim, 0.75 * Math.min(1, 0.4 + g * 0.6));
    // envelope flap
    const fy0 = CY - BB * 0.82, tipY = CY - BB * 0.55;
    ctx.save(); blob(ctx, pts); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-BA * 1.1, CY - BB * 1.2); ctx.lineTo(BA * 1.1, CY - BB * 1.2); ctx.lineTo(BA * 1.1, fy0 - 6);
    ctx.quadraticCurveTo(BA * 0.45, tipY - 6, 0, tipY); ctx.quadraticCurveTo(-BA * 0.45, tipY - 6, -BA * 1.1, fy0 - 6); ctx.closePath();
    ctx.fillStyle = A.linear(ctx, 0, CY - BB, 0, tipY, [[0, 'rgba(255,248,210,0.55)'], [1, 'rgba(255,236,160,0.15)']]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-BA * 1.1, fy0 - 6); ctx.quadraticCurveTo(-BA * 0.45, tipY - 6, 0, tipY); ctx.quadraticCurveTo(BA * 0.45, tipY - 6, BA * 1.1, fy0 - 6);
    ctx.save(); ctx.translate(0, 2.2); stroke(ctx, 'rgba(255,250,220,0.8)', lw * 0.5); ctx.restore();
    stroke(ctx, 'rgba(110,45,8,0.9)', lw * 0.7);
    // bottom fold hints
    ctx.beginPath(); ctx.moveTo(-BA * 0.95, CY + BB * 0.95); ctx.quadraticCurveTo(-BA * 0.8, CY + BB * 0.62, -BA * 0.62, CY + BB * 0.55);
    ctx.moveTo(BA * 0.95, CY + BB * 0.95); ctx.quadraticCurveTo(BA * 0.8, CY + BB * 0.62, BA * 0.62, CY + BB * 0.55); stroke(ctx, 'rgba(150,70,10,0.35)', lw * 0.45);
    ctx.restore();
    blob(ctx, pts); stroke(ctx, OL(), lw);
    // specular
    ctx.save(); ctx.globalAlpha = 0.85; A.ellipse(ctx, -BA * 0.6, CY - BB * 0.66, 11, 4.2, -0.55); fill(ctx, '#fffdf2');
    circle(ctx, -BA * 0.8, CY - BB * 0.36, 2.6); fill(ctx, '#fffdf2'); ctx.restore();
    // seal: soccer ball
    A.glow(ctx, 0, tipY - 2, 26, '#fff2b0', 0.5 * g);
    ball(ctx, 0, tipY - 1, 10, lw * 0.7, Math.sin(t * 1.3) * 0.2);

    // ---------- face ----------
    let look = o.look || P.look || M.look || [0, 0];
    const dart = A.wob(t, 3, 0.8) * 0.12 + (M.tremble ? A.noise1(t * 9) * 0.25 : 0);
    look = [A.clamp(look[0] + dart, -1, 1), A.clamp(look[1] + A.wob(t, 8, 0.6) * 0.08, -1, 1)];
    const fx = look[0] * 5 + (M.tremble ? A.noise1(t * 43) * M.tremble : 0), fy = CY + look[1] * 2.5 + (M.tremble ? A.noise1(t * 37 + 5) * M.tremble : 0);
    const m = A.clamp(o.mouth ?? A.mouth('BIT', t));
    const speak = m > 0.05;
    const wink = A.clamp(o.wink ?? 0), wEye = (o.winkEye || 'R') === 'L' ? 0 : 1;
    const blinkV = o.blink ?? A.blink(t, 5401);
    // blush
    ctx.save(); ctx.globalAlpha = 0.5 + (mood === 'joy' || mood === 'cheeky' ? 0.2 : 0);
    A.ellipse(ctx, fx - 35, fy + 17, 9, 5.5); fill(ctx, BIT.blush); A.ellipse(ctx, fx + 35, fy + 17, 9, 5.5); fill(ctx, BIT.blush); ctx.restore();
    const ERX = 15.5 * M.eyeS, ERY = 19 * M.eyeS, EX = 23, EY = fy + 2;
    const pupil = (o.pupil ?? 1) * M.pupil;
    const browCol = BIT.brow;
    [0, 1].forEach(i => {
      const sd = i ? 1 : -1, ex = fx + sd * EX, ey = EY;
      const wk = i === wEye ? wink : 0;
      const arcs = M.arcs && o.joyEyes !== 'open' ? 1 : 0;
      if ((arcs >= 1 && wk < 0.5) || wk > 0.6) {
        arcEye(ctx, ex, ey + 2, ERX, ERY * 0.8, lw, 1);
        if (wk > 0.6) { ctx.beginPath(); ctx.moveTo(ex + sd * ERX * 0.9, ey + 3); ctx.lineTo(ex + sd * (ERX + 6), ey - 2); stroke(ctx, OL(), lw); }
      } else {
        const jo = M.arcs ? 1 : 0;
        const cov = Math.max(A.clamp(M.cov[i] + (o.lid || 0) + wk * 0.9), blinkV);
        eye(ctx, ex, ey, ERX, ERY, {
          lx: look[0], ly: look[1], cov, tilt: M.tilt, inner: -sd, low: M.low[i] + jo * 0.3, pupil, hiBoost: jo, lid: BIT.lid,
          iris: BIT.iris, irisLight: BIT.irisLight, irisDark: BIT.irisDark, lw, hi: mood === 'panic' ? 0.7 : 1.05,
        });
      }
      // brows
      const raise = (o.browRaise || 0) + (i ? o.browR || 0 : o.browL || 0) + (speak ? m * 3 : 0) + (i !== wEye ? wink * 6 : -wink * 4);
      const bi = M.bi[i] + raise, bo = M.bo[i] + raise, by = ey - ERY - 7;
      brow(ctx, ex - sd * 11, by - bi, ex + sd * 12, by - bo, mood === 'panic' ? -2 : 3, lw * 1.45, browCol);
    });
    // mouth
    const mw = M.mw, my = fy + 27;
    let open = Math.max(m, M.minOpen || 0);
    if (M.pant && !speak) open = 0.18 + 0.1 * Math.abs(Math.sin(t * TAU * 1.6));
    const asym = M.asym + wink * 6 * (wEye ? 1 : -1);
    mouthShape(ctx, fx + asym * 0.3, my, mw, open, M.curve + wink * 4, asym, lw, { depth: 17, grit: M.grit && !speak ? 1 : 0, wavy: mood === 'exhausted' && open < 0.06 });

    // ---------- limbs in front ----------
    P.arms.forEach((Ar, i) => { if (Ar.front) drawArm(Ar, i); });

    // ---------- luggage tag ----------
    const rest = 0.62;
    const Dx = -vx * 0.55 + (limbs === 'run' ? Math.sin(P.ph * 2) * 70 : 0), Dy = 420 - vy * 0.55 + (limbs === 'arms-up' ? Math.cos(t * TAU * 1.7) * 200 : 0);
    let tagA = Math.atan2(-Dx, Dy) * 0.9 - rot + rest * (sp < 200 ? 1 - sp / 200 : 0) + (o.tagAng || 0);
    tagA += (A.wob(t, 11, 1.2) * 0.2 + Math.sin(t * 5.3) * 0.07) * (o.tagSwing ?? 1);
    const tpx = -BA * 0.9, tpy = CY - BB * 0.74;
    drawTag(ctx, tpx, tpy, tagA, lw, flip);
    circle(ctx, tpx, tpy, 3.2); fs(ctx, '#ffe07a', lw * 0.55);

    // ---------- FX ----------
    const sweat = o.sweat ?? M.sweat ?? 0;
    if (sweat > 0.02) {
      const u = frac(t * 1.1);
      ctx.save(); ctx.globalAlpha = sweat * (u < 0.8 ? 1 : (1 - u) * 5);
      sweatDrop(ctx, BA * 0.95 + u * 10, CY - BB * 0.55 + u * u * 26, 5.5, lw * 0.6, 0.4);
      const u2 = frac(t * 1.1 + 0.5);
      if (mood === 'panic' || mood === 'squeeze') { ctx.globalAlpha = sweat * (u2 < 0.8 ? 1 : (1 - u2) * 5); sweatDrop(ctx, -BA * 0.95 - u2 * 12, CY - BB * 0.5 + u2 * u2 * 24, 4.5, lw * 0.6, -0.4); }
      ctx.restore();
    }
    if (mood === 'squeeze') { // strain marks
      ctx.save(); ctx.globalAlpha = 0.8;
      for (let s = -1; s <= 1; s += 2) for (let j = 0; j < 3; j++) {
        const a = -0.6 + j * 0.6, r0 = BA + 14 + 3 * Math.sin(t * 20 + j);
        ctx.beginPath(); ctx.moveTo(s * (Math.cos(a) * r0), CY + Math.sin(a) * r0 * 0.8); ctx.lineTo(s * Math.cos(a) * (r0 + 11), CY + Math.sin(a) * (r0 + 11) * 0.8); stroke(ctx, '#fff3c4', lw * 0.8);
      }
      ctx.restore();
    }
    const spk = o.sparkle ?? M.sparkle ?? 0;
    if (spk > 0.02 || wink > 0.5) {
      const n = wink > 0.5 && !spk ? 1 : 4;
      for (let i = 0; i < n; i++) {
        const ph = frac(t * 0.9 + i / n), a = (wink > 0.5 && n === 1) ? -0.5 : -Math.PI / 2 + (i - 1.5) * 0.9;
        const r = BA + 22 + ph * 16, sz = 9 * Math.sin(ph * Math.PI);
        sparkle(ctx, (wink > 0.5 && n === 1 ? (wEye ? 1 : -1) : 1) * Math.cos(a) * r, CY + Math.sin(a) * r * 0.9, sz, Math.max(spk, wink));
      }
    }
    ctx.restore();
  };

  // ============================================================== generic packets
  const PK = {
    mail: { c: '#6fb7ff', d: '#2f74d0' }, video: { c: '#ff7f86', d: '#d0405a' }, meme: { c: '#b9e76c', d: '#6fa532' },
    update: { c: '#5ce6c9', d: '#16a58c' }, shop: { c: '#ffac52', d: '#dc6c22' }, photo: { c: '#d99cff', d: '#9656d6' },
  };
  const PK_KINDS = Object.keys(PK);
  const PK_SHAPES = [[1, 1], [1.14, 0.9], [0.9, 1.1]];
  A.PACKET_COLORS = PK;
  function packetGeom(seed) {
    const h1 = A.hash(seed * 3.17 + 0.5), h2 = A.hash(seed * 7.31 + 2.1), h3 = A.hash(seed * 1.93 + 4.7);
    const shp = Math.floor(h1 * 3), acc = Math.floor(h2 * 6) % 6, tone = Math.floor(h3 * 3);
    const [sw, sh] = PK_SHAPES[shp];
    const a = 44 * sw, b = 36 * sh, cy = -(b + 9);
    return { shp, acc, tone, a, b, cy };
  }
  function drawIcon(g, kind, r, lw) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const W = '#ffffff';
    if (kind === 'mail') {
      A.rrect(g, -r * 0.62, -r * 0.42, r * 1.24, r * 0.84, r * 0.12); fill(g, W);
      g.beginPath(); g.moveTo(-r * 0.58, -r * 0.36); g.lineTo(0, r * 0.08); g.lineTo(r * 0.58, -r * 0.36); stroke(g, '#2f74d0', r * 0.14);
    } else if (kind === 'video') {
      g.beginPath(); g.moveTo(-r * 0.3, -r * 0.5); g.lineTo(r * 0.55, 0); g.lineTo(-r * 0.3, r * 0.5); g.closePath(); fill(g, W);
    } else if (kind === 'meme') {
      circle(g, 0, 0, r * 0.62); fill(g, '#ffe14d');
      g.beginPath(); g.moveTo(-r * 0.36, -r * 0.12); g.lineTo(-r * 0.16, -r * 0.24); g.moveTo(r * 0.36, -r * 0.12); g.lineTo(r * 0.16, -r * 0.24); stroke(g, '#3a2a10', r * 0.12);
      g.beginPath(); g.moveTo(-r * 0.36, r * 0.04); g.quadraticCurveTo(0, r * 0.62, r * 0.36, r * 0.04); g.closePath(); fill(g, '#5a1a20');
      circle(g, -r * 0.6, -r * 0.02, r * 0.14); fill(g, '#7fd8ff'); circle(g, r * 0.6, -r * 0.02, r * 0.14); fill(g, '#7fd8ff');
    } else if (kind === 'update') {
      for (let s = 0; s < 2; s++) {
        g.save(); g.rotate(s * Math.PI);
        g.beginPath(); g.arc(0, 0, r * 0.48, Math.PI * 1.05, Math.PI * 1.8); stroke(g, W, r * 0.16);
        const a = Math.PI * 1.8, px = Math.cos(a) * r * 0.48, py = Math.sin(a) * r * 0.48;
        g.beginPath(); g.moveTo(px + r * 0.2, py - r * 0.05); g.lineTo(px - r * 0.06, py - r * 0.22); g.lineTo(px - r * 0.02, py + r * 0.18); g.closePath(); fill(g, W);
        g.restore();
      }
    } else if (kind === 'shop') {
      g.beginPath(); g.moveTo(-r * 0.62, -r * 0.45); g.lineTo(-r * 0.42, -r * 0.45); g.lineTo(-r * 0.25, r * 0.2); g.lineTo(r * 0.45, r * 0.2); g.lineTo(r * 0.58, -r * 0.28); g.lineTo(-r * 0.36, -r * 0.28); stroke(g, W, r * 0.14);
      circle(g, -r * 0.16, r * 0.42, r * 0.12); fill(g, W); circle(g, r * 0.36, r * 0.42, r * 0.12); fill(g, W);
    } else { // photo
      A.rrect(g, -r * 0.6, -r * 0.44, r * 1.2, r * 0.88, r * 0.14); fill(g, W);
      g.beginPath(); g.moveTo(-r * 0.5, r * 0.34); g.lineTo(-r * 0.15, -r * 0.1); g.lineTo(r * 0.08, r * 0.14); g.lineTo(r * 0.25, -r * 0.02); g.lineTo(r * 0.5, r * 0.34); g.closePath(); fill(g, '#9656d6');
      circle(g, r * 0.3, -r * 0.2, r * 0.1); fill(g, '#ffc93c');
    }
    g.restore();
  }
  function packetSprite(kind, seed, res) {
    const G = packetGeom(seed), key = `dfpk_${kind}_${G.shp}_${G.acc}_${G.tone}_${res}`;
    return A.layer(key, Math.ceil(150 * res), Math.ceil(140 * res), (g) => {
      g.scale(res, res); g.translate(75, 124);
      const K = PK[kind], lw = 3.6;
      const base = G.tone === 0 ? K.c : G.tone === 1 ? A.mixc(K.c, '#ffffff', 0.18) : A.mixc(K.c, K.d, 0.22);
      const { a, b, cy } = G;
      // feet
      A.ellipse(g, -a * 0.45, -4, 10, 5.5); fs(g, K.d, lw * 0.8); A.ellipse(g, a * 0.45, -4, 10, 5.5); fs(g, K.d, lw * 0.8);
      const pts = squircle(a, b, 3.0, 36, 0.06, 0, cy);
      blob(g, pts);
      g.fillStyle = A.radial(g, -a * 0.1, cy + b * 0.1, 0, a * 1.3, [[0, A.mixc(base, '#ffffff', 0.4)], [0.45, base], [1, A.mixc(base, K.d, 0.3)]]); g.fill();
      cel(g, pts, 7, -9, K.d, 0.3);
      cel(g, pts, -3, 3, '#c8fbff', 0.55);
      // flap
      g.save(); blob(g, pts); g.clip();
      const tipY = cy - b * 0.5;
      g.beginPath(); g.moveTo(-a * 1.1, cy - b * 0.86); g.quadraticCurveTo(-a * 0.45, tipY - 5, 0, tipY); g.quadraticCurveTo(a * 0.45, tipY - 5, a * 1.1, cy - b * 0.86);
      g.lineTo(a * 1.1, cy - b * 1.3); g.lineTo(-a * 1.1, cy - b * 1.3); g.closePath(); fill(g, 'rgba(255,255,255,0.22)');
      g.beginPath(); g.moveTo(-a * 1.1, cy - b * 0.86); g.quadraticCurveTo(-a * 0.45, tipY - 5, 0, tipY); g.quadraticCurveTo(a * 0.45, tipY - 5, a * 1.1, cy - b * 0.86); stroke(g, A.hex(K.d, 0.8), lw * 0.55);
      g.restore();
      blob(g, pts); stroke(g, OL(), lw);
      g.globalAlpha = 0.8; A.ellipse(g, -a * 0.6, cy - b * 0.62, 8, 3.2, -0.55); fill(g, '#ffffff'); g.globalAlpha = 1;
      // badge
      circle(g, 0, tipY - 1, 11); fs(g, K.d, lw * 0.75);
      g.save(); g.translate(0, tipY - 1); drawIcon(g, kind, 10.5, lw); g.restore();
      // cheeks
      g.globalAlpha = 0.35; A.ellipse(g, -a * 0.58, cy + b * 0.3, 6.5, 4); fill(g, '#ff5f7e'); A.ellipse(g, a * 0.58, cy + b * 0.3, 6.5, 4); fill(g, '#ff5f7e'); g.globalAlpha = 1;
      // accessories (1 headphones, 2 beanie, 3 tie, 4 glasses, 0/5 none)
      if (G.acc === 1) {
        g.beginPath(); g.ellipse(0, cy - b * 0.15, a * 1.02, b * 1.08, 0, Math.PI * 1.08, Math.PI * 1.92); stroke(g, OL(), 9); stroke(g, '#3a3f5c', 5.5);
        [-1, 1].forEach(s => { A.rrect(g, s * a * 0.98 - 7, cy - b * 0.28, 14, 22, 6); fs(g, '#ff4f8b', lw * 0.8); });
      } else if (G.acc === 2) {
        g.save(); g.translate(a * 0.18, cy - b * 0.92); g.rotate(0.18);
        g.beginPath(); g.moveTo(-a * 0.6, 4); g.bezierCurveTo(-a * 0.6, -26, a * 0.6, -26, a * 0.6, 4); g.closePath(); fs(g, '#ff5a5f', lw * 0.8);
        A.rrect(g, -a * 0.66, -2, a * 1.32, 10, 5); fs(g, '#fff2e8', lw * 0.8);
        circle(g, 0, -22, 7); fs(g, '#fff2e8', lw * 0.8); g.restore();
      } else if (G.acc === 3) {
        g.beginPath(); g.moveTo(-5, cy + b * 0.72); g.lineTo(5, cy + b * 0.72); g.lineTo(7, cy + b * 1.05); g.lineTo(0, cy + b * 1.18); g.lineTo(-7, cy + b * 1.05); g.closePath(); fs(g, '#e8344e', lw * 0.7);
      } else if (G.acc === 4) {
        [-1, 1].forEach(s => { circle(g, s * a * 0.34, cy + 1, 11.5); stroke(g, OL(), 3.4); });
        g.beginPath(); g.moveTo(-a * 0.34 + 11.5, cy); g.lineTo(a * 0.34 - 11.5, cy); stroke(g, OL(), 3);
      }
    });
  }
  // cached soft glow sprites per colour
  function glowSprite(col) {
    return A.layer('dfglow_' + col, 128, 128, g => { g.fillStyle = A.radial(g, 64, 64, 0, 64, [[0, A.hex(col, 0.9)], [0.35, A.hex(col, 0.35)], [1, A.hex(col, 0)]]); g.fillRect(0, 0, 128, 128); });
  }
  A.drawPacket = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t ?? 0, seed = o.seed ?? 0;
    const kind = PK[o.kind] ? o.kind : PK_KINDS[Math.floor(A.hash(seed * 5.5 + 3) * 6) % 6];
    const K = PK[kind], G = packetGeom(seed), { a, b, cy } = G;
    const honk = A.clamp(o.honk ?? 0);
    let mood = o.mood || 'bored';
    if (honk > 0.15) mood = 'annoyed';
    const res = scale <= 0.6 ? 1 : scale <= 1.2 ? 2 : scale <= 2.2 ? 3.2 : 5;
    const spr = packetSprite(kind, seed, res);
    const lw = 3.6, ph = A.hash(seed * 9.1) * TAU;
    const br = Math.sin(t * TAU * (mood === 'sleep' ? 0.35 : 0.5) + ph);
    const flip = o.flip ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    // glow
    const gl = o.glow ?? 0.7;
    if (gl > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = gl * 0.55; ctx.drawImage(glowSprite(K.c), -a * 1.9, cy - a * 1.9, a * 3.8, a * 3.8); ctx.restore(); }
    if (o.rot) ctx.rotate(o.rot);
    const sq = (o.squash || 0) + (mood === 'shock' ? -0.07 : 0) - honk * 0.08 + (mood === 'sleep' ? 0.03 : 0);
    ctx.scale((1 + sq * 0.7) * (1 - 0.01 * br), (1 - sq) * (1 + 0.022 * br));
    ctx.drawImage(spr, -75, -124, 150, 140);
    // live face
    const look = o.look ? [o.look[0] * flip, o.look[1]] : [A.wob(t, seed, 0.25) * 0.5 * flip, 0.1];
    const fx = look[0] * 3, ey = cy + 1, ex = a * 0.34;
    const bl = A.blink(t, seed + 3);
    for (let s = -1; s <= 1; s += 2) {
      const X = fx + s * ex;
      if (mood === 'sleep') { ctx.beginPath(); ctx.moveTo(X - 7, ey); ctx.quadraticCurveTo(X, ey + 6, X + 7, ey); stroke(ctx, OL(), lw); continue; }
      if (mood === 'shock') {
        A.ellipse(ctx, X, ey - 2, 10, 12); fs(ctx, '#ffffff', lw * 0.8);
        circle(ctx, X + look[0] * 2, ey - 1, 3.2); fill(ctx, '#140c24');
        brow(ctx, X - 6, ey - 20, X + 6, ey - 21, 2, lw * 1.1, OL());
        continue;
      }
      const cov = Math.max(mood === 'bored' ? 0.5 : 0.3, bl);
      ctx.save();
      const top = ey - 8 + cov * 16, tl = mood === 'annoyed' ? 5 * s : 0;
      ctx.beginPath(); ctx.moveTo(X - 12, top + tl); ctx.lineTo(X + 12, top - tl); ctx.lineTo(X + 12, ey + 14); ctx.lineTo(X - 12, ey + 14); ctx.closePath(); ctx.clip();
      A.ellipse(ctx, X + look[0] * 2, ey + look[1] * 1.5, 7.5, 9); fill(ctx, '#140c24');
      circle(ctx, X + look[0] * 2 + 2.4, ey - 3, 2.6); fill(ctx, '#ffffff'); circle(ctx, X + look[0] * 2 - 2.4, ey + 3.5, 1.2); fill(ctx, '#ffffff');
      ctx.restore();
      if (cov < 0.97) { ctx.beginPath(); ctx.moveTo(X - 8.5, top + tl * 0.7); ctx.lineTo(X + 8.5, top - tl * 0.7); stroke(ctx, OL(), lw * 0.9); }
      if (mood === 'annoyed') brow(ctx, X - 8 * s, ey - 16 + 1, X + 7 * s, ey - 12 + 1, 0, lw * 1.1, OL());
    }
    // mouth
    const my = cy + b * 0.45;
    const mo = Math.max(A.clamp(o.mouth || 0), honk * 0.85, mood === 'shock' ? 0.5 : 0, mood === 'sleep' ? 0.12 + 0.05 * br : 0);
    const curve = mood === 'annoyed' ? -4 : mood === 'bored' ? -1 : 0;
    mouthShape(ctx, fx, my, mood === 'shock' || mood === 'sleep' ? 7 : 11, mo, curve, 0, lw * 0.9, { depth: mood === 'shock' ? 9 : 10 });
    ctx.restore();
    // floating FX in unrotated frame
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (mood === 'sleep' && !o.noZ) {
      for (let i = 0; i < 2; i++) {
        const u = frac(t * 0.35 + i * 0.5 + A.hash(seed)), zz = 9 + u * 7;
        ctx.globalAlpha = Math.sin(u * Math.PI);
        A.text(ctx, 'z', a * 0.7 + u * 18 + Math.sin(u * 6) * 3, cy - b - u * 30, { font: `700 ${zz}px Fredoka`, fill: '#e8f6ff', stroke: OL(), lw: 3 });
      }
      ctx.globalAlpha = 1;
    }
    if (mood === 'shock') A.text(ctx, '!', a * 0.75, cy - b * 1.25, { font: '900 26px Fredoka', fill: '#fff15a', stroke: OL(), lw: 4 });
    if (honk > 0.01) {
      const s = A.ease.outBack(A.clamp(honk * 1.6)) * (1 + 0.05 * Math.sin(t * 40));
      ctx.save(); ctx.translate(a * 0.55 * flip, cy - b * 1.35); ctx.scale(s, s); ctx.rotate(-0.12 * flip);
      star(ctx, 0, 0, 30, 9, 0.66, t * 0.5); fs(ctx, '#ffe14d', lw);
      A.text(ctx, 'HONK!', 0, 1, { font: '400 17px Bangers', fill: '#e8344e', stroke: OL(), lw: 3 });
      ctx.restore();
      // anger vein
      ctx.save(); ctx.translate(-a * 0.6 * flip, cy - b * 0.72); ctx.scale(s * 0.9, s * 0.9);
      for (let q = 0; q < 4; q++) { ctx.save(); ctx.rotate(q * Math.PI / 2 + Math.PI / 4); ctx.beginPath(); ctx.moveTo(2.5, -5); ctx.quadraticCurveTo(4, 0, 9, -1); stroke(ctx, OL(), 6); stroke(ctx, '#ff3b5c', 3.2); ctx.restore(); }
      ctx.restore();
    }
    ctx.restore();
  };

  // ============================================================== CATPACKET
  const CAT = A.CAT_COLORS = { body: '#ab9cc0', light: '#d4c9e2', edge: '#8a7ba3', shade: '#6f6190', lid: '#9383ab', ear: '#f3a9c4', muzzle: '#ddd4e8', stripe: '#7e6f99', iris: '#c9e04a', irisLight: '#eef78a', irisDark: '#7c9a1f', brow: '#3b2d57', nose: '#f08fb2' };
  const CM = {
    bored: { cov: [0.54, 0.56], tilt: -0.08, low: [0.12, 0.12], bi: [0, 0], bo: [-1, -1], curve: -2, pupil: 1, eyeS: 1, ear: 0, minOpen: 0, slit: 1 },
    grumpy: { cov: [0.46, 0.46], tilt: 0.55, low: [0.16, 0.16], bi: [-10, -10], bo: [4, 4], curve: -7, pupil: 1, eyeS: 1, ear: 0.28, minOpen: 0, slit: 1 },
    shock: { cov: [0, 0], tilt: 0, low: [0, 0], bi: [14, 14], bo: [7, 7], curve: -3, pupil: 0.55, eyeS: 1.14, ear: -0.12, minOpen: 0.45, slit: 0 },
  };
  A.drawCatPacket = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t ?? 0, mood = CM[o.mood] ? o.mood : 'bored', M = CM[mood];
    const flip = o.flip ? -1 : 1, lw = o.lw ?? autoLW(5, scale), g = o.glow ?? 1;
    const CA = 136, CB = 100, CY = -118;
    const br = Math.sin(t * TAU / 3.4);
    const m = A.clamp(o.mouth ?? A.mouth('CATPACKET', t));
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale);
    A.glow(ctx, 0, CY, 260, '#b9a2ff', 0.2 * g);
    if (o.rot) ctx.rotate(o.rot);
    const sq = (o.squash || 0) + (mood === 'shock' ? -0.05 : 0);
    ctx.scale((1 + sq * 0.7) * (1 - 0.008 * br), (1 - sq) * (1 + 0.014 * br));
    // tail (behind)
    {
      const sw = (o.tail ?? 1), a1 = A.wob(t, 21, 0.35) * 0.35 * sw + Math.sin(t * 1.4) * 0.15 * sw;
      ctx.save(); ctx.translate(CA * 0.72, -40);
      const p1 = [60, -20], p2 = [90 + Math.sin(a1) * 20, -90], p3 = [70 + Math.sin(a1) * 60, -150 - Math.cos(a1) * 10];
      const bz = (u, i) => { const v = 1 - u; return v * v * v * 0 + 3 * v * v * u * p1[i] + 3 * v * u * u * p2[i] + u * u * u * p3[i]; };
      const N = 26, rad = u => 15 * (1 - u * 0.35) + (u > 0.85 ? (u - 0.85) * 20 : 0);
      for (let pass = 0; pass < 2; pass++) for (let q = 0; q <= N; q++) {
        const u = q / N; circle(ctx, bz(u, 0), bz(u, 1), rad(u) + (pass ? 0 : lw));
        fill(ctx, pass ? (u > 0.86 ? CAT.stripe : Math.floor(u * 7) % 2 ? CAT.body : A.mixc(CAT.body, CAT.stripe, 0.45)) : OL());
      }
      ctx.restore();
    }
    // ears (behind body)
    const earFlick = Math.pow(Math.max(0, Math.sin(t * 0.9 + 1)), 30) * 0.35;
    [-1, 1].forEach(s => {
      ctx.save(); ctx.translate(s * 76, CY - CB * 0.9); ctx.rotate(s * (M.ear + 0.05 + A.wob(t, s + 30, 0.3) * 0.04 + (s > 0 ? earFlick : 0)));
      ctx.beginPath(); ctx.moveTo(-40, 14); ctx.quadraticCurveTo(-18, -50, s * 6, -64); ctx.quadraticCurveTo(26, -36, 40, 10); ctx.closePath(); fs(ctx, CAT.body, lw);
      ctx.beginPath(); ctx.moveTo(-24, 6); ctx.quadraticCurveTo(-10, -34, s * 4, -46); ctx.quadraticCurveTo(16, -24, 24, 4); ctx.closePath(); fill(ctx, CAT.ear);
      ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-4, -30); ctx.moveTo(4, -6); ctx.lineTo(8, -26); stroke(ctx, 'rgba(255,255,255,0.8)', 2);
      ctx.restore();
    });
    // feet
    [-1, 1].forEach(s => { A.ellipse(ctx, s * 64, -8, 36, 16); fs(ctx, CAT.edge, lw); ctx.beginPath(); ctx.moveTo(s * 64 - 8, -2); ctx.lineTo(s * 64 - 8, -10); ctx.moveTo(s * 64 + 8, -2); ctx.lineTo(s * 64 + 8, -10); stroke(ctx, OL(), lw * 0.5); });
    // body
    const pts = squircle(CA, CB, 2.7, 44, 0.12, 0, CY);
    blob(ctx, pts);
    ctx.fillStyle = A.radial(ctx, -10, CY - 10, 0, CA * 1.25, [[0, CAT.light], [0.5, CAT.body], [1, CAT.edge]]); ctx.fill();
    cel(ctx, pts, 14, -14, CAT.shade, 0.45);
    cel(ctx, pts, -5, 5, '#b8f6ff', 0.6 * Math.min(1, g));
    // tabby stripes on forehead
    ctx.save(); blob(ctx, pts); ctx.clip();
    [-22, 0, 22].forEach((sx, i) => { ctx.beginPath(); ctx.moveTo(sx * 1.1, CY - CB - 4); ctx.quadraticCurveTo(sx * 0.9, CY - CB + 16, sx * 0.7, CY - CB + (i === 1 ? 34 : 26)); stroke(ctx, CAT.stripe, 9); });
    // side stripes
    [-1, 1].forEach(s => { for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.moveTo(s * (CA + 5), CY - 20 + j * 26); ctx.quadraticCurveTo(s * (CA - 18), CY - 16 + j * 26, s * (CA - 30), CY - 2 + j * 26); stroke(ctx, CAT.stripe, 8); } });
    ctx.restore();
    blob(ctx, pts); stroke(ctx, OL(), lw);
    ctx.save(); ctx.globalAlpha = 0.6; A.ellipse(ctx, -CA * 0.62, CY - CB * 0.66, 20, 7, -0.5); fill(ctx, '#ffffff'); ctx.restore();
    // sunglasses (pushed up)
    {
      const sh = A.clamp(o.shades ?? 0), sy = A.lerp(CY - CB * 0.92, CY - 38, sh) - (mood === 'shock' ? 14 + Math.abs(Math.sin(t * 9)) * 3 : 0);
      ctx.save(); ctx.translate(4, sy); ctx.rotate(-0.07 + (mood === 'shock' ? 0.12 : 0));
      const lr = A.lerp(1, 1.7, sh);
      ctx.beginPath(); ctx.moveTo(-40 * lr, 2); ctx.lineTo(-62, -4); ctx.moveTo(40 * lr, 2); ctx.lineTo(62, -4); stroke(ctx, OL(), 3.5);
      [-1, 1].forEach(s => {
        A.rrect(ctx, s * 19 * lr - 14 * lr, -8 * lr, 28 * lr, 17 * lr, 7 * lr);
        ctx.fillStyle = A.linear(ctx, 0, -8 * lr, 0, 9 * lr, [[0, '#3d2f66'], [1, '#120c24']]); ctx.fill(); stroke(ctx, OL(), lw * 0.8);
        ctx.beginPath(); ctx.moveTo(s * 19 * lr - 8 * lr, -4 * lr); ctx.lineTo(s * 19 * lr - 1 * lr, 4 * lr); stroke(ctx, 'rgba(160,240,255,0.8)', 2.5);
      });
      ctx.beginPath(); ctx.moveTo(-6 * lr, -2); ctx.quadraticCurveTo(0, -7, 6 * lr, -2); stroke(ctx, OL(), 3.5);
      ctx.restore();
    }
    // face
    let look = o.look || [A.wob(t, 40, 0.2) * 0.3, 0.15];
    look = [look[0] * flip, look[1]];
    const fx = look[0] * 6, EY = CY - 42 + look[1] * 3;
    // muzzle
    [-1, 1].forEach(s => { A.ellipse(ctx, fx + s * 15, CY - 12, 22, 16); fill(ctx, CAT.muzzle); });
    ctx.save(); ctx.globalAlpha = 0.35; A.ellipse(ctx, fx - 62, CY - 16, 14, 8); fill(ctx, '#ff8fb0'); A.ellipse(ctx, fx + 62, CY - 16, 14, 8); fill(ctx, '#ff8fb0'); ctx.restore();
    const bl = A.blink(t * 0.8, 77);
    [0, 1].forEach(i => {
      const sd = i ? 1 : -1, ex = fx + sd * 46, rx = 25 * M.eyeS, ry = 23 * M.eyeS;
      eye(ctx, ex, EY, rx, ry, {
        lx: look[0], ly: look[1], cov: Math.max(A.clamp(M.cov[i] + (o.lid || 0)), bl), tilt: M.tilt, inner: -sd, low: M.low[i], pupil: M.pupil,
        lid: CAT.lid, iris: CAT.iris, irisLight: CAT.irisLight, irisDark: CAT.irisDark, lw, slit: M.slit ? 1 : 0, hi: 0.8, whiteTop: '#c9c0dc',
      });
      if (mood !== 'shock') { ctx.beginPath(); ctx.moveTo(ex - rx * 0.7, EY + ry + 6); ctx.quadraticCurveTo(ex, EY + ry + 12, ex + rx * 0.7, EY + ry + 6); stroke(ctx, 'rgba(60,40,90,0.55)', lw * 0.6); }
      const raise = (o.browRaise || 0) + m * 4, by = EY - ry - 9;
      brow(ctx, ex - sd * 13, by - M.bi[i] - raise, ex + sd * 20, by - M.bo[i] - raise, 1, lw * 1.7, CAT.brow);
    });
    // nose + mouth
    const ny = CY - 16;
    ctx.beginPath(); ctx.moveTo(fx - 8, ny - 5); ctx.quadraticCurveTo(fx, ny - 8, fx + 8, ny - 5); ctx.quadraticCurveTo(fx + 2, ny + 4, fx, ny + 4); ctx.quadraticCurveTo(fx - 2, ny + 4, fx - 8, ny - 5); ctx.closePath(); fs(ctx, CAT.nose, lw * 0.7);
    const open = Math.max(m, M.minOpen);
    const drop = M.curve * 0.8;
    if (open > 0.05) {
      const h = 5 + open * 28, w = 22 + open * 6, top = ny + 10;
      const path = () => { ctx.beginPath(); ctx.moveTo(fx - w, top + (-drop) * 0.3); ctx.quadraticCurveTo(fx, top - 4, fx + w, top - drop * 0.3); ctx.bezierCurveTo(fx + w, top + h, fx + w * 0.5, top + h * 1.2, fx, top + h * 1.2); ctx.bezierCurveTo(fx - w * 0.5, top + h * 1.2, fx - w, top + h, fx - w, top - drop * 0.3); ctx.closePath(); };
      path(); fill(ctx, '#3d0f2c');
      ctx.save(); ctx.clip(); A.ellipse(ctx, fx + 3, top + h * 1.15, w * 0.6, h * 0.45); fill(ctx, '#f07aa0'); ctx.restore();
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(fx + s * w * 0.62, top - 1); ctx.lineTo(fx + s * w * 0.42, top - 1); ctx.lineTo(fx + s * w * 0.53, top + 7 + open * 4); ctx.closePath(); fs(ctx, '#ffffff', lw * 0.4); });
      path(); stroke(ctx, OL(), lw * 0.9);
    }
    // the 'w'
    ctx.beginPath(); ctx.moveTo(fx, ny + 4); ctx.lineTo(fx, ny + 9);
    ctx.moveTo(fx - 17, ny + 8 - drop); ctx.quadraticCurveTo(fx - 8, ny + 15, fx, ny + 9); ctx.quadraticCurveTo(fx + 8, ny + 15, fx + 17, ny + 8 - drop);
    stroke(ctx, OL(), lw * 0.85);
    // whiskers
    const tw = A.wob(t, 44, 0.8) * 0.04 + m * 0.05;
    [-1, 1].forEach(s => {
      for (let j = 0; j < 3; j++) {
        ctx.save(); ctx.translate(fx + s * 36, ny + 2 + j * 7); ctx.rotate(s * (-0.18 + j * 0.18 + tw));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 34, -4, s * 70, 4); stroke(ctx, 'rgba(40,28,70,0.75)', lw * 0.45); ctx.restore();
      }
    });
    // label sticker
    {
      ctx.save(); ctx.translate(-4, -40); ctx.rotate(-0.035);
      const w = 212, h = 34;
      A.rrect(ctx, -w / 2, -h / 2, w, h, 7); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#ffffff'], [1, '#e6e0f0']]); ctx.fill(); stroke(ctx, OL(), lw * 0.7);
      ctx.fillStyle = '#ff5a8a'; A.rrect(ctx, -w / 2 + 7, -h / 2 + 7, 20, 20, 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 14, -h / 2 + 11); ctx.lineTo(-w / 2 + 23, 0); ctx.lineTo(-w / 2 + 14, h / 2 - 11); ctx.closePath(); fill(ctx, '#ffffff');
      ctx.save(); ctx.scale(flip, 1);
      ctx.font = '700 16px Rubik'; const tw2 = ctx.measureText('cat_video_FINAL(3).mp4').width, maxW = w - 44;
      ctx.translate(flip > 0 ? 12 : -12, 1); if (tw2 > maxW) ctx.scale(maxW / tw2, 1);
      A.text(ctx, 'cat_video_FINAL(3).mp4', 0, 0, { font: '700 16px Rubik', fill: '#3a2d55' });
      ctx.restore();
      // peeling corner
      ctx.beginPath(); ctx.moveTo(w / 2 - 12, h / 2); ctx.lineTo(w / 2, h / 2 - 12); ctx.lineTo(w / 2 - 10, h / 2 - 10); ctx.closePath(); fs(ctx, '#cfc6de', lw * 0.5);
      ctx.restore();
    }
    // arms
    const arms = o.arms || 'crossed';
    const paw = (px, py, r, ang = 0) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang); circle(ctx, 0, 0, r); fs(ctx, CAT.light, lw * 0.9); ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.2); ctx.lineTo(-r * 0.3, r * 0.8); ctx.moveTo(r * 0.3, r * 0.2); ctx.lineTo(r * 0.3, r * 0.8); stroke(ctx, OL(), lw * 0.45); ctx.restore(); };
    if (arms === 'crossed') {
      const bo = br * 1.5;
      limb(ctx, -CA * 0.86, -92 + bo, -40, -62 + bo, 38, -76 + bo, 30, CAT.body, lw); paw(42, -77 + bo, 15, -1.2);
      limb(ctx, CA * 0.86, -86 + bo, 40, -54 + bo, -36, -70 + bo, 30, CAT.body, lw); paw(-40, -71 + bo, 15, 1.2);
    } else if (arms === 'point') {
      limb(ctx, CA * 0.88, -100, CA * 1.02, -70, CA * 0.95, -44, 28, CAT.body, lw); paw(CA * 0.95, -42, 15);
      const w = Math.sin(t * TAU * 1.2) * 5;
      limb(ctx, -CA * 0.85, -104, -CA * 1.12, -118, -CA * 1.3, -128 + w, 28, CAT.body, lw);
      ctx.save(); ctx.translate(-CA * 1.3, -128 + w); ctx.rotate(0.15);
      A.rrect(ctx, -34, -6, 28, 12, 6); fs(ctx, CAT.light, lw * 0.8); circle(ctx, 0, 0, 15); fs(ctx, CAT.light, lw * 0.9);
      ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(4, 8); stroke(ctx, OL(), lw * 0.45); ctx.restore();
    } else {
      limb(ctx, -CA * 0.88, -100, -CA * 1.02, -70, -CA * 0.95, -44, 28, CAT.body, lw); paw(-CA * 0.95, -42, 15);
      limb(ctx, CA * 0.88, -100, CA * 1.02, -70, CA * 0.95, -44, 28, CAT.body, lw); paw(CA * 0.95, -42, 15);
    }
    if (mood === 'shock') {
      for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + (j - 1) * 0.45; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 150, CY - CB - 50 + Math.sin(a) * 30 + 30); ctx.lineTo(Math.cos(a) * 175, CY - CB - 80 + Math.sin(a) * 30 + 30); stroke(ctx, '#fff15a', lw * 1.1); }
      sweatDrop(ctx, CA * 0.8, CY - 70, 9, lw * 0.6, 0.4);
    }
    if (mood === 'grumpy') { // grumble puff
      const u = frac(t * 0.6);
      ctx.save(); ctx.globalAlpha = 0.6 * Math.sin(u * Math.PI);
      [0, 1, 2].forEach(j => { circle(ctx, CA * 0.75 + u * 30 + j * 9, CY - CB * 0.9 - u * 40 - j * 5, 7 + j * 2 + u * 5); fs(ctx, '#e7e1f2', lw * 0.5); });
      ctx.restore();
    }
    ctx.restore();
  };

  // ============================================================== SHARK
  const SH = A.SHARK_COLORS = { back: '#5d7d9d', mid: '#86a3bd', belly: '#e3ecf1', fin: '#4f6d8c', shade: '#3f5876', mouth: '#5a1426', gum: '#d95878', tongue: '#ff7a95', teeth: '#fffbef', rim: '#9ff6ff' };
  const SHARK_BODY = [[345, -2], [322, -48], [258, -92], [155, -118], [35, -122], [-90, -104], [-190, -72], [-262, -40], [-305, -18], [-318, 0], [-305, 16], [-250, 34], [-160, 58], [-40, 82], [70, 88], [150, 72], [190, 44], [260, 24], [330, 14]];
  const SHARK_JAW = [[182, 40], [258, 32], [322, 28], [340, 38], [320, 62], [258, 78], [200, 76], [168, 60]];
  const HINGE = [180, 38];
  const rotAbout = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * co - dy * s, c[1] + dx * s + dy * co]; };
  A.sharkNose = (x, y, scale = 1, o = {}) => [x + (o.flip ? -1 : 1) * 345 * scale, y - 2 * scale];
  A.sharkJaw = (x, y, scale = 1, o = {}) => [x + (o.flip ? -1 : 1) * 300 * scale, y + 30 * scale];
  A.drawShark = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t ?? 0, mood = o.mood === 'dazed' ? 'dazed' : 'hungry';
    const bite = A.clamp(o.bite ?? (mood === 'dazed' ? 0.3 + 0.05 * Math.sin(t * 3) : 0.15));
    const sw = o.swim ?? t * TAU * 1.3;
    const lw = o.lw ?? autoLW(6, scale), flip = o.flip ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale); if (o.rot) ctx.rotate(o.rot);
    // undulation of rear
    const wave = X => X < -60 ? Math.sin(sw - (X + 60) * -0.01) * 9 * ((-60 - X) / 260) : 0;
    const body = SHARK_BODY.map(p => [p[0], p[1] + wave(p[0])]);
    const tailBase = [-312, wave(-312)], tailA = Math.sin(sw) * 0.3;
    // tail fin
    ctx.save(); ctx.translate(tailBase[0], tailBase[1]); ctx.rotate(tailA);
    const tail = [[12, -16], [-40, -62], [-96, -140], [-84, -66], [-58, -2], [-86, 80], [-104, 100], [-44, 50], [12, 16]];
    blob(ctx, tail); fs(ctx, SH.fin, lw);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-50, -30, -80, -100); stroke(ctx, 'rgba(26,19,48,0.35)', lw * 0.5);
    ctx.restore();
    // far pectoral fin
    ctx.save(); ctx.translate(90, 70); ctx.rotate(Math.sin(sw + 1) * 0.15 - 0.2);
    blob(ctx, [[0, 0], [-40, 60], [-66, 84], [-30, 30], [-20, 0]]); fs(ctx, SH.shade, lw * 0.9); ctx.restore();
    // dorsal fin
    ctx.save(); ctx.translate(-50, -106); ctx.rotate(Math.sin(sw - 0.8) * 0.05);
    ctx.beginPath(); ctx.moveTo(70, 10); ctx.bezierCurveTo(40, -30, 0, -90, -40, -118); ctx.bezierCurveTo(-30, -70, -40, -20, -80, 26); ctx.closePath(); fs(ctx, SH.fin, lw);
    ctx.beginPath(); ctx.moveTo(-32, -96); ctx.quadraticCurveTo(-26, -50, -50, 0); stroke(ctx, 'rgba(160,240,255,0.5)', lw * 0.6);
    ctx.restore();
    // small rear fins
    ctx.save(); ctx.translate(-232, -48 + wave(-232)); blob(ctx, [[14, 6], [-10, -36], [-20, -34], [-22, 8]]); fs(ctx, SH.fin, lw * 0.8); ctx.restore();
    ctx.save(); ctx.translate(-220, 40 + wave(-220)); blob(ctx, [[14, -6], [-12, 30], [-22, 26], [-22, -8]]); fs(ctx, SH.fin, lw * 0.8); ctx.restore();
    // jaw + mouth interior
    const ja = bite * 0.7, headUp = -bite * 0.26;
    const jaw = SHARK_JAW.map(p => rotAbout(p, HINGE, ja));
    ctx.beginPath(); ctx.moveTo(HINGE[0] - 8, HINGE[1] - 4);
    const upperLine = [[190, 44], [260, 24], [330, 14], [342, 4]].map(p => rotAbout(p, HINGE, headUp));
    upperLine.forEach(p => ctx.lineTo(p[0], p[1] + 6));
    ctx.lineTo(jaw[3][0], jaw[3][1]); ctx.lineTo(jaw[2][0], jaw[2][1]); ctx.lineTo(jaw[1][0], jaw[1][1]); ctx.closePath();
    ctx.fillStyle = A.radial(ctx, HINGE[0] + 40, HINGE[1], 0, 160, [[0, '#2a0614'], [1, SH.mouth]]); ctx.fill();
    // tongue
    const tg = rotAbout([270, 48], HINGE, ja);
    A.ellipse(ctx, tg[0], tg[1] - 6, 52, 13 + bite * 8, ja); fill(ctx, SH.tongue);
    blob(ctx, jaw);
    ctx.fillStyle = A.linear(ctx, 0, 30, 0, 90, [[0, SH.mid], [0.4, SH.belly], [1, '#c9d6de']]); ctx.fill(); stroke(ctx, OL(), lw);
    // lower teeth (in jaw frame)
    ctx.save(); ctx.translate(HINGE[0], HINGE[1]); ctx.rotate(ja); ctx.translate(-HINGE[0], -HINGE[1]);
    ctx.beginPath(); ctx.moveTo(190, 42); ctx.quadraticCurveTo(260, 30, 330, 30); stroke(ctx, SH.gum, 7);
    for (let i = 0; i < 5; i++) {
      const tx = 214 + i * 24, ty = 38 - i * 2, hh = 16 + A.hash(i + 40) * 8;
      ctx.beginPath(); ctx.moveTo(tx - 9, ty); ctx.lineTo(tx + (A.hash(i) - 0.5) * 5, ty - hh); ctx.lineTo(tx + 9, ty - 1); ctx.closePath(); fs(ctx, SH.teeth, lw * 0.55);
    }
    if (mood === 'dazed') { // lolling tongue
      ctx.beginPath(); ctx.moveTo(300, 34); ctx.bezierCurveTo(330, 40, 350 + Math.sin(t * 3) * 5, 70, 332, 92); ctx.bezierCurveTo(318, 104, 300, 80, 290, 40); ctx.closePath(); fs(ctx, SH.tongue, lw * 0.8);
      ctx.beginPath(); ctx.moveTo(310, 50); ctx.quadraticCurveTo(318, 70, 318, 86); stroke(ctx, 'rgba(160,30,60,0.5)', lw * 0.5);
    }
    ctx.restore();
    // body
    const hb = body.map(p => { const w = A.smooth(60, 190, p[0]); return w > 0 ? rotAbout(p, HINGE, headUp * w) : p; });
    ctx.save();
    blob(ctx, hb);
    ctx.fillStyle = A.linear(ctx, 0, -120, 0, 80, [[0, SH.back], [0.55, SH.mid], [1, SH.mid]]); ctx.fill();
    ctx.save(); blob(ctx, hb); ctx.clip();
    // countershaded belly with wavy boundary
    ctx.beginPath(); ctx.moveTo(360, -6);
    for (let X = 360; X >= -330; X -= 30) ctx.lineTo(X, 18 + 12 * Math.sin(X * 0.03) + (X > 150 ? (X - 150) * -0.12 : 0) - (X < -150 ? (X + 150) * -0.08 : 0) * -1);
    ctx.lineTo(-330, 200); ctx.lineTo(360, 200); ctx.closePath(); fill(ctx, SH.belly);
    // speckles
    for (let i = 0; i < 14; i++) { const X = -220 + A.hash(i * 3.3) * 420, Y = -100 + A.hash(i * 7.7) * 70 + Math.abs(X) * 0.08; circle(ctx, X, Y, 2.5 + A.hash(i) * 3); fill(ctx, 'rgba(40,60,90,0.25)'); }
    ctx.restore();
    cel(ctx, hb, 0, -16, SH.shade, 0.35);
    cel(ctx, hb, 0, 5, SH.rim, 0.55);
    blob(ctx, hb); stroke(ctx, OL(), lw);
    // gills
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(120 - i * 20, -44 + i * 2); ctx.quadraticCurveTo(108 - i * 20, -8, 118 - i * 20, 28); stroke(ctx, 'rgba(26,19,48,0.7)', lw * 0.7); }
    ctx.translate(HINGE[0], HINGE[1]); ctx.rotate(headUp); ctx.translate(-HINGE[0], -HINGE[1]);
    // nostril + snout highlight
    A.ellipse(ctx, 318, -30, 6, 3, 0.4); fill(ctx, OL());
    ctx.save(); ctx.globalAlpha = 0.5; A.ellipse(ctx, 240, -100, 50, 8, 0.25); fill(ctx, '#e8fbff'); ctx.restore();
    if (o.bandaid) { ctx.save(); ctx.translate(332, -22); ctx.rotate(0.9); A.rrect(ctx, -20, -8, 40, 16, 8); fs(ctx, '#f7c6a0', lw * 0.6); A.rrect(ctx, -7, -8, 14, 16, 3); fill(ctx, '#e8a67c'); ctx.restore(); }
    // upper teeth
    for (let i = 0; i < 6; i++) {
      if (i === 3) continue; // goofy gap
      const tx = 206 + i * 24, ty = 34 - i * 3.6, hh = 20 + A.hash(i + 11) * 10 + (i === 2 ? 8 : 0), ww = 10 + (i === 2 ? 3 : 0);
      ctx.beginPath(); ctx.moveTo(tx - ww, ty - 3); ctx.lineTo(tx + (A.hash(i + 3) - 0.5) * 6, ty + hh); ctx.lineTo(tx + ww, ty - 4); ctx.closePath(); fs(ctx, SH.teeth, lw * 0.55);
    }
    // mouth corner smirk
    ctx.beginPath(); ctx.moveTo(196, 44); ctx.quadraticCurveTo(178, 40, 176, 26); stroke(ctx, OL(), lw * 0.8);
    // eye
    const ex = 232, ey = -58;
    A.ellipse(ctx, ex, ey, 31, 34); fs(ctx, '#fffef6', lw * 0.9);
    if (mood === 'dazed') {
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(t * 7); ctx.beginPath();
      for (let a = 0; a < TAU * 3; a += 0.25) { const r = a * 1.45; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.05); }
      stroke(ctx, OL(), lw * 0.75); ctx.restore();
      ctx.beginPath(); ctx.moveTo(ex - 36, ey - 40); ctx.quadraticCurveTo(ex, ey - 56, ex + 34, ey - 36); stroke(ctx, SH.shade, lw * 1.4);
    } else {
      const lk = o.look || [0.7, 0.1];
      const px = ex + lk[0] * 13, py = ey + lk[1] * 12 + A.wob(t, 60, 1.5) * 1.5;
      circle(ctx, px, py, 12); fill(ctx, '#0d0820');
      circle(ctx, px + 4, py - 5, 4.2); fill(ctx, '#ffffff');
      // hungry brow
      ctx.beginPath(); ctx.moveTo(ex - 36, ey - 44); ctx.quadraticCurveTo(ex, ey - 44, ex + 38, ey - 22); stroke(ctx, OL(), lw * 2.2);
    }
    ctx.restore();
    // near pectoral fin
    ctx.save(); ctx.translate(120, 62); ctx.rotate(Math.sin(sw) * 0.22);
    blob(ctx, [[10, -4], [-30, 60], [-70, 96], [-50, 40], [-26, 0]]); fs(ctx, SH.fin, lw);
    ctx.restore();
    // drool / dazed stars
    if (mood === 'hungry' && bite < 0.5) {
      const u = frac(t * 0.5), d = 8 + u * 30;
      const cxp = rotAbout([214, 50], HINGE, ja);
      ctx.beginPath(); ctx.moveTo(cxp[0] - 4, cxp[1]); ctx.quadraticCurveTo(cxp[0] - 5, cxp[1] + d * 0.6, cxp[0], cxp[1] + d); ctx.quadraticCurveTo(cxp[0] + 5, cxp[1] + d * 0.6, cxp[0] + 4, cxp[1]); ctx.closePath();
      fs(ctx, 'rgba(210,245,255,0.85)', lw * 0.4);
    }
    const stars = o.stars ?? (mood === 'dazed' ? 1 : 0);
    if (stars > 0.01) {
      for (let i = 0; i < 4; i++) {
        const a = t * 4 + (i * TAU) / 4, sx = 200 + Math.cos(a) * 110, sy = -150 + Math.sin(a) * 26, sz = (13 + Math.sin(a) * 4) * stars;
        star(ctx, sx, sy, sz, 5, 0.46, a); fs(ctx, i % 2 ? '#ffe14d' : '#9ff6ff', lw * 0.6);
      }
    }
    ctx.restore();
  };

  // ============================================================== BINARY TRAIL
  A.drawBinaryTrail = (ctx, pts, t, o = {}) => {
    if (!pts || pts.length < 2) return;
    const col = o.color || '#ffc93c', W = o.width ?? 30, sz = o.size ?? 20, al = o.alpha ?? 1, spd = o.speed ?? 90;
    const spacing = o.spacing ?? sz * 0.95, rows = o.rows ?? 2, seed = o.seed ?? 0, core = o.core || '#fff6d0';
    const n = pts.length, cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const Ltot = cum[n - 1]; if (Ltot < 1) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const passes = [[1.9, 0.13, col], [1.0, 0.28, col], [0.28, 0.75, core]];
    for (const [wk, ak, c] of passes) {
      for (let i = 1; i < n; i++) {
        const u = cum[i] / Ltot;
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.globalAlpha = al * ak * Math.pow(u, 0.8); ctx.lineWidth = Math.max(0.5, W * wk * (0.2 + 0.8 * u)); ctx.strokeStyle = c; ctx.stroke();
      }
    }
    if (o.digits !== false) {
      const off = t * spd, base = Math.floor(off / spacing), fr = off / spacing - base;
      let seg = n - 1;
      for (let k = 0; ; k++) {
        const s = (k + fr) * spacing; if (s > Ltot) break;
        const id = k - base, target = Ltot - s;
        while (seg > 1 && cum[seg - 1] > target) seg--;
        const a0 = pts[seg - 1], a1 = pts[seg], segL = cum[seg] - cum[seg - 1] || 1, q = (target - cum[seg - 1]) / segL;
        const px = A.lerp(a0[0], a1[0], q), py = A.lerp(a0[1], a1[1], q);
        const nx = -(a1[1] - a0[1]) / segL, ny = (a1[0] - a0[0]) / segL;
        const u = target / Ltot;
        for (let r = 0; r < rows; r++) {
          const h = A.hash(id * 13.7 + r * 5.1 + seed * 3.3);
          const lat = ((r - (rows - 1) / 2) * sz * 0.85 + (h - 0.5) * sz * 0.35) * (0.35 + 0.65 * u);
          const ch = A.hash(id * 7.9 + r * 1.7 + seed + Math.floor(t * 6 + h * 4) * 0.37) > 0.5 ? '1' : '0';
          const f = sz * (0.5 + 0.5 * u), flick = 0.7 + 0.3 * Math.sin(t * 17 + id * 2.1 + r);
          ctx.globalAlpha = al * Math.pow(u, 0.9) * flick;
          ctx.font = `700 ${f.toFixed(1)}px Rubik`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = col; ctx.fillText(ch, px + nx * lat, py + ny * lat);
          ctx.globalAlpha *= 0.8; ctx.fillStyle = core; ctx.fillText(ch, px + nx * lat, py + ny * lat);
        }
      }
    }
    ctx.restore();
  };
})();
