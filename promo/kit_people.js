// ============================================================================
// kit_people.js — global PPL. Israeli family cast (YONI dad, MAYA mom, TOM boy) + living room + props.
// Everything is a pure function of t. Characters face the camera (front view, 3/4 features via look).
// See the API summary at the bottom of the file.
// ============================================================================
(function () {
const OL = A.OUTLINE, cl = A.clamp, lerp = A.lerp;
const P = (window.PPL = {});

// ------------------------------------------------------------------ cast data
const CH = {
  yoni: { sc: 1.0, hf: 1.0, skin: '#e2a877', skinSh: '#c78a5e', hair: '#241a1e', hairHi: '#4a3a44', sw: 47, hw: 27, torso: 142, neck: 12, legs: 200, arm: [96, 92],
          top: '#ffc24a', topSh: '#e39a25', pants: '#34426f', pantsSh: '#26315a', shoe: '#8a5a3a', sole: '#f1e7d6', sleeve: 0.62, sleeveW: 33, armW: 23, legW: 37, seed: 3, shortsFrac: 1 },
  maya: { sc: 0.95, hf: 0.98, skin: '#efb98f', skinSh: '#d79a71', hair: '#2b1a1c', hairHi: '#5b3a40', sw: 39, hw: 27, torso: 134, neck: 13, legs: 196, arm: [92, 88],
          top: '#1fb6a6', topSh: '#12877c', pants: '#4b3f73', pantsSh: '#372e58', shoe: '#f4efe6', sole: '#d4cabb', sleeve: 2.0, sleeveW: 27, armW: 21, legW: 33, seed: 7, shortsFrac: 1 },
  tom:  { sc: 0.68, hf: 1.24, skin: '#f0bd93', skinSh: '#d99c73', hair: '#4a2a1a', hairHi: '#7a4a2c', sw: 46, hw: 26, torso: 138, neck: 10, legs: 196, arm: [96, 92],
          top: '#2f6df0', topSh: '#1f4bb8', pants: '#f4f4f8', pantsSh: '#cfd2e0', shoe: '#ff5a4a', sole: '#fff', sleeve: 0.95, sleeveW: 44, armW: 25, legW: 40, seed: 11, shortsFrac: 0.44 },
};
P.CAST = CH;

// ------------------------------------------------------------------ faces (all numeric so they blend)
const FK = ['bly', 'bla', 'bry', 'bra', 'eo', 'es', 'ps', 'mw', 'mc', 'mo', 'msk', 'teeth', 'sweat', 'blush'];
const F = (o) => FK.map(k => o[k] || 0);
const FACES = {
  neutral:  F({ eo: 1, ps: 1, mw: 13, mc: 4, blush: .25 }),
  bored:    F({ bly: 3, bla: -.05, bry: 3, bra: .05, eo: .5, ps: .9, mw: 11, mc: -1.5, blush: 0 }),
  confused: F({ bly: -9, bla: -.15, bry: 3, bra: .28, eo: 1.05, ps: .9, mw: 9, mc: -2.5, mo: 2, msk: 4 }),
  wow:      F({ bly: -11, bry: -11, eo: 1.3, ps: .7, mw: 10, mc: 0, mo: 24, blush: .2 }),
  joy:      F({ bly: -5, bry: -5, es: 1, ps: 1, eo: 1, mw: 20, mc: 11, mo: 18, teeth: 1, blush: .6 }),
  smirk:    F({ bly: -1, bla: -.08, bry: -7, bra: .12, eo: .78, ps: 1, mw: 13, mc: 1, msk: 10, blush: .15 }),
  worried:  F({ bly: -7, bla: -.42, bry: -7, bra: .42, eo: 1.1, ps: .85, mw: 11, mc: -5, mo: 3, sweat: 1 }),
};
P.FACES = Object.keys(FACES);

// ------------------------------------------------------------------ poses
// hand targets are relative to own shoulder, in unscaled units (adult reach ~185). x is mirrored for the left arm.
// R = screen-right arm, L = screen-left arm.
function poseParams(name, seated, t, ph) {
  const s = Math.sin, b = { tl: 0, sink: 0, hy: 0, hx: 0, hd: 0, sh: 0, bob: 0, R: [26, 172, 'fist', 0], L: [-26, 172, 'fist', 0], face: 'neutral', mo: 0 };
  const rest = seated ? [[60, 128], [-60, 128]] : [[26, 172], [-26, 172]];
  b.R = [rest[0][0], rest[0][1], 'fist', 0]; b.L = [rest[1][0], rest[1][1], 'fist', 0];
  switch (name) {
    case 'remote': b.R = [150 + s(t * 3) * 2, seated ? -6 : -20, 'remote', 0]; b.tl = .04; b.face = 'smirk'; b.hd = .05; break;
    case 'slump': b.tl = -.07; b.sink = 24; b.hy = 16; b.hd = .16; b.hx = -6; b.sh = -6; b.face = 'bored';
      b.R = [50, seated ? 116 : 150, 'fist', 0]; b.L = [-50, seated ? 116 : 150, 'fist', 0]; break;
    case 'scratch': b.hd = .08; b.face = 'confused'; b.R = [24 + s(t * 15) * 13, -122 + s(t * 15 + 1.6) * 5, 'open', 0]; break;
    case 'shrug': b.sh = 18; b.hd = .13; b.hy = 6; b.face = 'confused'; b.R = [104, 58, 'open', 0]; b.L = [-104, 58, 'open', 0]; break;
    case 'cheer': { const p = s(t * 11); b.sink = -4; b.face = 'joy'; b.bob = -Math.abs(s(t * 5.5)) * (seated ? 9 : 18); b.R = [52 + s(t * 11) * 6, -172 + p * 16, 'open', 0]; b.L = [-52 - s(t * 11 + 1) * 6, -172 - p * 16, 'open', 0]; b.hd = s(t * 5.5) * .05; break; }
    case 'point': b.R = [158, -62, 'point', 0]; b.face = 'smirk'; b.tl = .05; break;
    case 'thumbs': b.R = [82, -34, 'thumb', 0]; b.face = 'joy'; b.hd = -.06; break;
    case 'lean': b.tl = .34; b.sink = 8; b.hx = 8; b.hy = -6; b.face = 'wow'; b.R = [88, seated ? 122 : 150, 'fist', 0]; b.L = [-70, seated ? 122 : 150, 'fist', 0]; break;
    case 'laugh': b.face = 'joy'; b.hd = -.2 + s(t * 11) * .035; b.tl = -.07 + s(t * 11) * .03; b.bob = -Math.abs(s(t * 12)) * 5; b.hy = -4;
      b.R = [30, 108 + s(t * 22) * 4, 'open', 0]; b.L = [-42, 100 + s(t * 22) * 4, 'open', 0]; b.mo = 12 + 12 * Math.abs(s(t * 13)); break;
    case 'facepalm': b.hd = .12; b.hy = 14; b.sink = 8; b.face = 'worried'; b.R = [8, -80, 'flat', 0]; b.tl = .04; break;
    default: break;
  }
  return b;
}
P.POSES = ['idle', 'remote', 'slump', 'scratch', 'shrug', 'cheer', 'point', 'thumbs', 'lean', 'laugh', 'facepalm'];

function blendPose(a, b, k) {
  const o = {};
  for (const key of ['tl', 'sink', 'hy', 'hx', 'hd', 'sh', 'bob', 'mo']) o[key] = lerp(a[key], b[key], k);
  for (const arm of ['R', 'L']) o[arm] = [lerp(a[arm][0], b[arm][0], k), lerp(a[arm][1], b[arm][1], k), k < .5 ? a[arm][2] : b[arm][2], 0];
  o.face = k < .5 ? a.face : b.face; o.faceFrom = a.face; o.faceTo = b.face; o.faceK = k;
  return o;
}

// ------------------------------------------------------------------ small drawing helpers
function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }
// thick outlined limb polyline (outline pass then colour pass)
function limb(ctx, pts, w, col, ol = 6) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  poly(ctx, pts); ctx.lineWidth = w + ol * 2; ctx.strokeStyle = OL; ctx.stroke();
  poly(ctx, pts); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}
function alongPath(pts, d) { // sub-polyline of length d
  const out = [pts[0]]; let rem = d;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
    if (rem <= L) { out.push([x0 + (x1 - x0) * rem / L, y0 + (y1 - y0) * rem / L]); return out; }
    out.push(pts[i]); rem -= L;
  }
  return out;
}
function ik(sx, sy, tx, ty, l1, l2, side) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const maxd = (l1 + l2) * .995, mind = Math.abs(l1 - l2) + 10;
  const dd = Math.min(Math.max(d, mind), maxd), base = Math.atan2(dy, dx);
  const a = Math.acos(cl((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1));
  let best = null, bs = -1e9;
  for (const an of [base + a, base - a]) { const ex = sx + Math.cos(an) * l1, ey = sy + Math.sin(an) * l1; const sc = (ex - sx) * side + (ey - sy) * .7; if (sc > bs) { bs = sc; best = [ex, ey]; } }
  return { e: best, h: [sx + Math.cos(base) * dd, sy + Math.sin(base) * dd] };
}
const shade = (ctx, x, y, r, c = 'rgba(30,10,40,.16)') => { ctx.fillStyle = c; A.ellipse(ctx, x, y, r, r * .45); ctx.fill(); };

// ------------------------------------------------------------------ hands
function drawHand(ctx, c, kind, hx, hy, fa, side, t) {
  ctx.save(); ctx.translate(hx, hy);
  const skin = c.skin, r = 15;
  const fist = (rr = r) => { A.ellipse(ctx, 0, 0, rr, rr * .95); A.fillStroke(ctx, A.radial(ctx, -4, -4, 2, rr + 4, [[0, A.mixc(skin, '#ffffff', .18)], [1, skin]]), 5); };
  if (kind === 'remote') {
    ctx.save(); ctx.rotate(fa); ctx.translate(-14, 0); ctx.rotate(-Math.PI / 2); P.remote(ctx, 0, -6, 1, 0, { t, hand: true }); ctx.restore();
    ctx.save(); ctx.rotate(fa); fist(15); ctx.restore(); // fist over the remote grip
  } else if (kind === 'point') {
    ctx.save(); ctx.rotate(fa);
    ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(40, -3); ctx.lineWidth = 17; ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(40, -3); ctx.lineWidth = 8; ctx.strokeStyle = skin; ctx.stroke();
    fist(16); ctx.restore();
  } else if (kind === 'thumb') {
    fist(15);
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3 * side, -34); ctx.lineWidth = 19; ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3 * side, -34); ctx.lineWidth = 9; ctx.strokeStyle = skin; ctx.stroke();
    A.ellipse(ctx, 0, 0, 14, 13); ctx.fillStyle = skin; ctx.fill();
    ctx.strokeStyle = c.skinSh; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(8, 1); ctx.moveTo(-8, 8); ctx.lineTo(8, 8); ctx.stroke();
  } else if (kind === 'open' || kind === 'flat') {
    const big = kind === 'flat' ? 1.5 : 1, ang = kind === 'flat' ? -Math.PI / 2 : fa;
    ctx.rotate(ang); ctx.scale(big, big);
    for (let i = 0; i < 4; i++) { const a = (i - 1.5) * .34; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(30 - Math.abs(i - 1.5) * 4, 0); ctx.lineWidth = 12; ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = skin; ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.rotate(-.9 * side); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.lineWidth = 12; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = skin; ctx.stroke(); ctx.restore();
    A.ellipse(ctx, 4, 0, 16, 15); A.fillStroke(ctx, skin, 5);
  } else fist(r);
  ctx.restore();
}

// ------------------------------------------------------------------ hair / head
function curls(ctx, list, col, hi) { // list of [x,y,r]
  for (const [x, y, r] of list) { ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); ctx.lineWidth = 12; ctx.strokeStyle = OL; ctx.stroke(); }
  for (const [x, y, r] of list) { ctx.beginPath(); ctx.arc(x, y, r, 0, A.TAU); ctx.fillStyle = col; ctx.fill(); }
  ctx.strokeStyle = hi; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [x, y, r] of list) { ctx.beginPath(); ctx.arc(x, y, r * .55, Math.PI * 1.05, Math.PI * 1.65); ctx.stroke(); }
}

function drawFace(ctx, c, f, st, t, who) {
  const R = 46, [bly, bla, bry, bra, eo0, es, ps, mw, mc0, mo0, msk, teeth, sweat, blush] = f;
  const blink = A.blink(t, c.seed) * (1 - es);
  const eo = Math.max(0.04, eo0 * (1 - blink)), lx = st.lx, ly = st.ly;
  const fx = lx * 7, fy = ly * 3;         // features slide
  // cheeks
  if (blush > .01) for (const sd of [-1, 1]) { ctx.fillStyle = `rgba(255,90,110,${.32 * blush})`; A.ellipse(ctx, fx * .7 + sd * 29, 15 + fy, 9, 6); ctx.fill(); }
  const ey = -1 + fy, ex = 17;
  // eyes
  for (const sd of [-1, 1]) {
    const cx = fx + sd * ex, w = 10.5, h = 12.5 * Math.min(eo, 1.3);
    if (es < .98) {
      ctx.save(); ctx.globalAlpha = 1 - es * .9;
      A.ellipse(ctx, cx, ey, w, h); A.fillStroke(ctx, '#fff', 3.6);
      ctx.save(); A.ellipse(ctx, cx, ey, w, h); ctx.clip();
      const pr = 6.2 * ps, px = cx + lx * 4.6, py = ey + ly * 4.4 + (eo < .9 ? 2 : 0);
      ctx.fillStyle = who === 'tom' ? '#4a2a10' : '#2a1c16'; ctx.beginPath(); ctx.arc(px, py, pr, 0, A.TAU); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px, py, pr * .55, 0, A.TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - pr * .35, py - pr * .4, pr * .32, 0, A.TAU); ctx.fill();
      if (eo0 < .95) { // heavy lid
        ctx.fillStyle = A.mixc(c.skin, c.skinSh, .35); ctx.fillRect(cx - w - 2, ey - h - 2, w * 2 + 4, (h * 2) * (1 - eo / Math.max(eo0, .01) * 0 - Math.min(eo, 1)) + 4);
        ctx.fillStyle = OL; ctx.fillRect(cx - w - 2, ey - h + (h * 2) * (1 - Math.min(eo, 1)) + 1, w * 2 + 4, 3);
      }
      ctx.restore(); ctx.restore();
    }
    if (es > .02) { ctx.save(); ctx.globalAlpha = es; ctx.beginPath(); ctx.arc(cx, ey + 6, 10, Math.PI * 1.12, Math.PI * 1.88); ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
  }
  // brows
  const browW = who === 'tom' ? 5.5 : who === 'yoni' ? 6.5 : 4.5;
  for (const sd of [-1, 1]) {
    const y = -20 + fy + (sd < 0 ? bly : bry) - (eo0 > 1.1 ? 2 : 0), a = sd < 0 ? bla : bra;
    ctx.save(); ctx.translate(fx + sd * ex, y); ctx.rotate(a * (sd < 0 ? 1 : 1));
    ctx.beginPath(); ctx.moveTo(-10, 1.5); ctx.quadraticCurveTo(0, -3.5, 10, 1.5); ctx.lineWidth = browW; ctx.strokeStyle = who === 'maya' ? '#2b1a1c' : c.hair; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  }
  // nose
  ctx.beginPath(); ctx.moveTo(fx * 1.5 - 3, 9 + fy); ctx.quadraticCurveTo(fx * 1.5 + 2, 14 + fy, fx * 1.5 + 6, 10 + fy);
  ctx.lineWidth = 3.4; ctx.strokeStyle = A.mixc(c.skinSh, OL, .35); ctx.lineCap = 'round'; ctx.stroke();
  // mouth
  const my = 27 + fy * .6, mxc = fx * 1.1, mo = Math.max(mo0, st.mo || 0), mc = mc0;
  const L = [mxc - mw, my - mc * .5], Rr = [mxc + mw, my - mc * .5 - msk * .5];
  if (mo > 1.5) {
    ctx.beginPath(); ctx.moveTo(L[0], L[1]);
    ctx.quadraticCurveTo(mxc, my - mc * .9 - 3, Rr[0], Rr[1]);
    ctx.quadraticCurveTo(mxc + mw * .5, my + mo * .9 + 3, mxc, my + mo + 2);
    ctx.quadraticCurveTo(mxc - mw * .6, my + mo * .9 + 3, L[0], L[1]);
    ctx.save(); ctx.fillStyle = '#5a1526'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#ff7a8a'; A.ellipse(ctx, mxc, my + mo + 4, mw * .7, mo * .5); ctx.fill();
    if (teeth > .5) {
      ctx.fillStyle = '#fff'; ctx.fillRect(mxc - mw - 2, my - mc - 8, mw * 2 + 4, 10 + Math.min(mo * .18, 5));
      ctx.fillStyle = '#5a1526';
      if (who === 'tom') ctx.fillRect(mxc - 9, my - mc - 9, 8, 11 + Math.min(mo * .18, 5)); // missing front tooth
      else { ctx.fillRect(mxc - .7, my - mc - 8, 1.4, 12); }
    }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(L[0], L[1]);
    ctx.quadraticCurveTo(mxc, my - mc * .9 - 3, Rr[0], Rr[1]);
    ctx.quadraticCurveTo(mxc + mw * .5, my + mo * .9 + 3, mxc, my + mo + 2);
    ctx.quadraticCurveTo(mxc - mw * .6, my + mo * .9 + 3, L[0], L[1]);
    ctx.lineWidth = 4; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(mxc, my + mc * 1.1 + Math.max(0, mo), Rr[0], Rr[1]);
    ctx.lineWidth = 4.2; ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.stroke();
    if (msk > 4) { ctx.beginPath(); ctx.arc(Rr[0] + 1.5, Rr[1] - 2, 3, .3, 2.2); ctx.lineWidth = 2.6; ctx.stroke(); }
  }
  if (sweat > .05) { // sweat drop
    const sx = 40, sy = -22 + ((t * 40) % 20) * .25;
    ctx.save(); ctx.globalAlpha = Math.min(1, sweat); ctx.beginPath(); ctx.moveTo(sx, sy - 9); ctx.quadraticCurveTo(sx + 8, sy + 3, sx, sy + 8); ctx.quadraticCurveTo(sx - 8, sy + 3, sx, sy - 9);
    A.fillStroke(ctx, '#8fe4ff', 3); ctx.restore();
  }
}

function headShape(ctx, R) {
  A.blob(ctx, [[0, -R * 1.0], [R * .82, -R * .62], [R * .96, R * .1], [R * .7, R * .72], [0, R * 1.03], [-R * .7, R * .72], [-R * .96, R * .1], [-R * .82, -R * .62]]);
}

function drawHead(ctx, c, who, st, t, pass) {
  const R = 46;
  const f = st.faceArr;
  if (pass === 'back') {
    if (who === 'maya') { // volume of hair behind head
      A.blob(ctx, [[0, -R * 1.22], [R * 1.08, -R * .9], [R * 1.3, R * .1], [R * 1.28, R * 1.3], [R * .7, R * 2.0], [-R * .2, R * 1.7], [-R * .9, R * 2.05], [-R * 1.32, R * 1.3], [-R * 1.3, R * .1], [-R * 1.06, -R * .9]]);
      A.fillStroke(ctx, A.linear(ctx, 0, -R, 0, R * 2, [[0, c.hair], [1, '#4a2a2e']]), 6);
    }
    if (who === 'tom') curls(ctx, [[-R * 1.0, -R * .3, 14], [R * 1.0, -R * .3, 14], [-R * .9, R * .1, 12], [R * .9, R * .1, 12]], c.hair, c.hairHi);
    return;
  }
  if (pass === 'tail') { // maya side pony over left shoulder (screen left)
    if (who !== 'maya') return;
    const sw = Math.sin(t * 1.6) * 2.5 + (st.tail || 0);
    A.blob(ctx, [[-R * 1.0, R * .45], [-R * 1.2, R * .9], [-R * 1.35 + sw, R * 1.7], [-R * 1.15 + sw * 1.4, R * 2.4], [-R * .8 + sw * 1.5, R * 2.6], [-R * .78 + sw, R * 1.9], [-R * .78, R * 1.1], [-R * .78, R * .5]]);
    A.fillStroke(ctx, A.linear(ctx, 0, R * .5, 0, R * 2.6, [[0, c.hair], [1, '#4a2a2e']]), 6);
    ctx.strokeStyle = c.hairHi; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 1.05, R * 1.0); ctx.quadraticCurveTo(-R * 1.15 + sw, R * 1.7, -R * 1.0 + sw, R * 2.3); ctx.stroke();
    return;
  }
  // ---- head (skin) + ears
  for (const sd of [-1, 1]) { A.ellipse(ctx, sd * R * .97, 6, 8, 11); A.fillStroke(ctx, c.skin, 5); A.ellipse(ctx, sd * R * .98, 7, 3.4, 5.5); ctx.fillStyle = c.skinSh; ctx.fill(); }
  headShape(ctx, R); A.fillStroke(ctx, A.radial(ctx, -R * .25, -R * .35, 4, R * 1.25, [[0, A.mixc(c.skin, '#ffffff', .2)], [.55, c.skin], [1, c.skinSh]]), 6);
  if (who === 'yoni') { // stubble
    ctx.save(); headShape(ctx, R); ctx.clip();
    ctx.fillStyle = A.linear(ctx, 0, R * .1, 0, R * 1.05, [[0, 'rgba(50,30,30,0)'], [.5, 'rgba(50,30,30,.26)'], [1, 'rgba(50,30,30,.36)']]);
    ctx.beginPath(); ctx.moveTo(-R * 1.1, -R * .05); ctx.quadraticCurveTo(-R * .6, R * .45, -R * .32, R * .48); ctx.quadraticCurveTo(0, R * .38, R * .32, R * .48); ctx.quadraticCurveTo(R * .6, R * .45, R * 1.1, -R * .05); ctx.lineTo(R * 1.1, R * 1.2); ctx.lineTo(-R * 1.1, R * 1.2); ctx.fill();
    ctx.fillStyle = 'rgba(40,25,25,.5)'; const rn = A.rng(5);
    for (let i = 0; i < 46; i++) { const x = (rn() - .5) * R * 1.6, y = R * .35 + rn() * R * .65; if (Math.abs(x) < R * .8) ctx.fillRect(x, y, 1.8, 1.8); }
    ctx.restore();
    headShape(ctx, R); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke();
  }
  if (who === 'tom') { ctx.fillStyle = 'rgba(190,100,60,.5)'; for (const [x, y] of [[-24, 10], [-19, 14], [-27, 15], [24, 10], [19, 14], [27, 15], [-3, 8], [5, 7]]) { ctx.beginPath(); ctx.arc(x + st.lx * 5, y, 1.7, 0, A.TAU); ctx.fill(); } }
  drawFace(ctx, c, f, st, t, who);
  // ---- glasses (yoni)
  if (who === 'yoni') {
    const fx = st.lx * 7, fy = st.ly * 3, gy = -1 + fy;
    ctx.lineWidth = 4.5; ctx.strokeStyle = '#3b2a3a';
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.arc(fx + sd * 17, gy, 17, 0, A.TAU); ctx.fillStyle = 'rgba(190,230,255,.16)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx + sd * 17, gy, 12.5, Math.PI * 1.15, Math.PI * 1.55); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke(); ctx.lineWidth = 4.5; ctx.strokeStyle = '#3b2a3a';
      ctx.beginPath(); ctx.moveTo(fx + sd * 33, gy - 3); ctx.lineTo(sd * (R * .96), gy - 4); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(fx - 1, gy - 3); ctx.quadraticCurveTo(fx, gy - 7, fx + 1, gy - 3); ctx.stroke();
  }
  // ---- front hair
  if (who === 'yoni') {
    A.blob(ctx, [[-R * 1.0, R * .02], [-R * 1.06, -R * .55], [-R * .62, -R * 1.12], [0, -R * 1.22], [R * .68, -R * 1.1], [R * 1.06, -R * .55], [R * 1.0, R * .02], [R * .82, -R * .34], [R * .5, -R * .58], [R * .05, -R * .66], [-R * .4, -R * .62], [-R * .8, -R * .34]]);
    A.fillStroke(ctx, A.linear(ctx, 0, -R * 1.2, 0, -R * .3, [[0, '#3a2b30'], [1, c.hair]]), 6);
    ctx.strokeStyle = c.hairHi; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * .5, -R * 1.02); ctx.quadraticCurveTo(-R * .1, -R * 1.12, R * .3, -R * 1.02); ctx.stroke();
  } else if (who === 'maya') {
    // side-swept fringe + face-framing waves
    A.blob(ctx, [[-R * 1.02, R * .55], [-R * 1.1, -R * .3], [-R * .8, -R * 1.02], [0, -R * 1.2], [R * .8, -R * 1.02], [R * 1.1, -R * .3], [R * 1.05, R * .7], [R * .92, R * .1], [R * .8, -R * .4], [R * .25, -R * .78], [-R * .25, -R * .7], [-R * .62, -R * .3], [-R * .82, R * .1], [-R * .86, R * .5]]);
    A.fillStroke(ctx, A.linear(ctx, -R, -R, R, R * .5, [[0, '#3a2528'], [1, c.hair]]), 6);
    ctx.strokeStyle = c.hairHi; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * .1, -R * 1.1); ctx.quadraticCurveTo(R * .5, -R * .95, R * .85, -R * .3); ctx.stroke();
    // scrunchie at the ponytail root (screen left)
    ctx.save(); ctx.translate(-R * .98, R * .6); ctx.rotate(-.5);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.05) * 8, Math.sin(i * 1.05) * 8, 7.5, 0, A.TAU); A.fillStroke(ctx, i % 2 ? '#ff6f91' : '#ff4f7f', 3.5); }
    ctx.restore();
  } else {
    const cu = [[-R * .78, -R * .55, 15], [-R * .4, -R * .92, 16], [0, -R * 1.08, 17], [R * .42, -R * .92, 16], [R * .8, -R * .55, 15], [-R * .2, -R * .78, 13], [R * .22, -R * .8, 13], [-R * .62, -R * .78, 12], [R * .62, -R * .78, 12], [R * .92, -R * .18, 11], [-R * .92, -R * .18, 11], [-R * .5, -R * .58, 10], [R * .1, -R * .62, 10], [R * .5, -R * .55, 10]];
    curls(ctx, cu, c.hair, c.hairHi);
  }
}

// ------------------------------------------------------------------ torso
function torsoPath(ctx, c, TL, who) {
  const sw = c.sw, bel = who === 'yoni' ? 1.06 : who === 'maya' ? .86 : 1;
  const w2 = who === 'tom' ? 1.0 : 1;
  A.blob(ctx, [[-sw * .32, -TL - 2], [-sw * .82, -TL + 4], [-sw * 1.0, -TL + 22], [-sw * .98 * w2, -TL * .62], [-sw * .96 * bel, -TL * .3], [-sw * .9 * (who === 'maya' ? .95 : 1), 4], [0, 12], [sw * .9 * (who === 'maya' ? .95 : 1), 4], [sw * .96 * bel, -TL * .3], [sw * .98 * w2, -TL * .62], [sw * 1.0, -TL + 22], [sw * .82, -TL + 4], [sw * .32, -TL - 2], [0, -TL + 4]]);
}
function drawTorso(ctx, c, who, TL, t) {
  const sw = c.sw;
  torsoPath(ctx, c, TL, who);
  A.fillStroke(ctx, A.linear(ctx, -sw, -TL, sw * .6, 10, [[0, A.mixc(c.top, '#ffffff', .16)], [.5, c.top], [1, c.topSh]]), 6);
  ctx.save(); torsoPath(ctx, c, TL, who); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-sw * .5, -TL * .3); ctx.quadraticCurveTo(-sw * .2, -TL * .22, -sw * .05, -TL * .05); ctx.moveTo(sw * .4, -TL * .5); ctx.quadraticCurveTo(sw * .55, -TL * .3, sw * .5, -TL * .08); ctx.stroke();
  if (who === 'maya') {
    // cream top + cardigan opening
    ctx.beginPath(); ctx.moveTo(-sw * .34, -TL - 4); ctx.lineTo(sw * .34, -TL - 4); ctx.quadraticCurveTo(sw * .3, -TL * .5, sw * .18, 20); ctx.lineTo(-sw * .18, 20); ctx.quadraticCurveTo(-sw * .3, -TL * .5, -sw * .34, -TL - 4);
    ctx.fillStyle = '#fff1d6'; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = '#12877c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-sw * .48, -TL * .95); ctx.lineTo(-sw * .32, -TL * .1); ctx.moveTo(sw * .48, -TL * .95); ctx.lineTo(sw * .32, -TL * .1); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -TL * .58 + i * TL * .22, 3.4, 0, A.TAU); ctx.fillStyle = '#ffd36a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-sw * .34, -TL - 4); ctx.lineTo(0, -TL + 20); ctx.lineTo(sw * .34, -TL - 4); ctx.lineWidth = 4.5; ctx.strokeStyle = OL; ctx.stroke();
  } else if (who === 'yoni') {
    ctx.beginPath(); ctx.ellipse(0, -TL + 2, sw * .34, 14, 0, 0, Math.PI); ctx.fillStyle = c.topSh; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = OL; ctx.stroke();
    // small chest star emblem
    D.starburst(ctx, -sw * .42, -TL * .58, 6, 12, 5, -Math.PI / 2, 'rgba(255,255,255,.75)');
    ctx.fillStyle = '#5a3d18'; ctx.fillRect(-sw, 0, sw * 2, 5);
  } else { // tom jersey
    ctx.fillStyle = '#fff'; ctx.fillRect(-sw, -TL * .42, sw * 2, 9); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-sw, -TL * .42 + 9, sw * 2, 5);
    ctx.beginPath(); ctx.moveTo(-sw * .3, -TL - 4); ctx.lineTo(0, -TL + 24); ctx.lineTo(sw * .3, -TL - 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.stroke();
    A.text(ctx, '9', 0, -TL * .68, { font: '900 52px Rubik', fill: '#fff', stroke: OL, lw: 6 });
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-sw, -6, sw * 2, 14);
  }
  ctx.restore();
  torsoPath(ctx, c, TL, who); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke();
}

// ------------------------------------------------------------------ legs
function drawLegs(ctx, c, who, seated, t, ph, bob) {
  const hw = c.hw, sd2 = [-1, 1];
  const shoe = (x, y, sd, tap) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tap);
    ctx.beginPath(); ctx.moveTo(-15 * 1, -12); ctx.lineTo(15, -12); ctx.quadraticCurveTo(38 * (seated ? 1 : 1) * 1, -8, 40, 8); ctx.lineTo(-40, 8); ctx.quadraticCurveTo(-38, -8, -15, -12);
    ctx.save(); ctx.scale(1, 1); ctx.restore();
    A.fillStroke(ctx, A.linear(ctx, 0, -12, 0, 8, [[0, A.mixc(c.shoe, '#fff', .15)], [1, c.shoe]]), 5.5);
    ctx.beginPath(); ctx.roundRect(-40, 4, 80, 9, 4); A.fillStroke(ctx, c.sole, 4.5);
    ctx.restore();
  };
  for (const sd of sd2) {
    let pts, ankle;
    if (seated) {
      const kx = sd * (hw + 6), ky = 26, ax = sd * (hw + 10), ay = 26 + c.legs * .47;
      pts = [[sd * hw * .7, -10], [kx, ky], [ax, ay]]; ankle = [ax, ay];
    } else {
      const ax = sd * (hw + 6), ay = -14; pts = [[sd * hw * .8, -c.legs], [sd * (hw + 2), -c.legs * .5], [ax, ay]]; ankle = [ax, ay];
    }
    const full = c.shortsFrac >= 1;
    limb(ctx, pts, c.legW, full ? c.pants : c.skin, 6);
    if (!full) { // skin legs + socks + shorts
      const sockPts = alongPath([pts[2], pts[1], pts[0]], 46).reverse();
      limb(ctx, sockPts, c.legW - 8, '#2f6df0', 5);
      const total = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) + Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
      const sh = alongPath(pts, total * c.shortsFrac); limb(ctx, sh, c.legW + 10, c.pants, 6);
    } else { // knee highlight
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 6; poly(ctx, [[pts[0][0] - sd * 5, pts[0][1] + 4], [pts[1][0] - sd * 5, pts[1][1]]]); ctx.stroke();
    }
    shoe(ankle[0] + sd * 4, ankle[1] + 8, sd, seated ? Math.sin(t * 3 + ph + sd) * .03 * (sd > 0 ? 1 : 0) : 0);
  }
}

// ------------------------------------------------------------------ the person
function look2(look, flip, tvSide) {
  let x = 0, y = 0;
  if (look === 'l') x = -1; else if (look === 'r') x = 1; else if (look === 'tv') { x = .9 * tvSide; y = -.05; }
  else if (look && typeof look === 'object') { x = look.x || 0; y = look.y || 0; }
  return [flip ? -x : x, y];
}

P.person = function (ctx, who, x, y, s = 1, o = {}) {
  who = (who || 'yoni').toLowerCase(); const c = CH[who] || CH.yoni;
  const t = o.t || 0, seated = !!o.seated, flip = !!o.flip, ph = c.seed;
  let pk = o.pk == null ? 1 : o.pk; if (pk <= 0) return null;
  const popS = pk < 1 ? A.ease.outBack(cl(pk)) : 1;
  // pose
  let pp;
  if (o.blend) {
    const a = poseParams(o.blend.from || 'idle', seated, t, ph), b = poseParams(o.blend.to || 'idle', seated, t, ph);
    pp = blendPose(a, b, cl(o.blend.k, 0, 1));
  } else pp = blendPose(poseParams(o.pose || 'idle', seated, t, ph), poseParams(o.pose || 'idle', seated, t, ph), 0);
  if (!o.blend) { pp.faceFrom = pp.faceTo = pp.face; pp.faceK = 0; }
  // face blend
  let fa, fb, fk;
  if (o.faceBlend) { fa = o.faceBlend.from; fb = o.faceBlend.to; fk = o.faceBlend.k; }
  else if (o.face) { fa = fb = o.face; fk = 0; }
  else { fa = pp.faceFrom; fb = pp.faceTo; fk = pp.faceK; }
  const A1 = FACES[fa] || FACES.neutral, B1 = FACES[fb] || FACES.neutral;
  const faceArr = A1.map((v, i) => lerp(v, B1[i], cl(fk, 0, 1)));
  // idle life
  const br = Math.sin(t * 2.3 + ph) * .5 + .5, sway = A.noise1(t * .55 + ph) * .012, hs = A.noise1(t * .8 + ph * 3);
  const [lx0, ly0] = look2(o.look || 'tv', flip, o.tvSide == null ? 1 : o.tvSide);
  // eyes wander subtly (saccades)
  const st = { lx: cl(lx0 + A.noise1(t * .9 + ph) * .07, -1, 1), ly: cl(ly0 + A.noise1(t * 1.1 + ph + 4) * .05, -1, 1), faceArr, mo: pp.mo, tail: A.noise1(t * 1.2 + ph) * 3 };
  const sc = c.sc * s * popS;
  ctx.save();
  ctx.translate(x, y); ctx.scale(flip ? -sc : sc, sc);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const bob = pp.bob + Math.sin(t * 2.3 + ph) * 1.2;
  const seatY = 0, pelvis = seated ? [0, -2 + bob * .6] : [0, -c.legs + bob];
  const TL = c.torso * (1 + br * .014) - pp.sink;
  if (!seated && o.shadow !== false) { ctx.fillStyle = 'rgba(10,5,30,.32)'; A.ellipse(ctx, 0, 4, 70 - Math.min(0, pp.bob) * -.3, 15); ctx.fill(); }
  // legs (feet stay planted when standing; pelvis moves)
  ctx.save(); if (seated) ctx.translate(0, bob * .3);
  if (!seated) { ctx.translate(0, 0); }
  drawLegs(ctx, c, who, seated, t, ph, bob); ctx.restore();
  // body
  const tl = pp.tl + sway; const cs = Math.cos(tl), sn = Math.sin(tl);
  const rot = (px, py) => [pelvis[0] + px * cs - py * sn, pelvis[1] + px * sn + py * cs];
  ctx.save(); ctx.translate(pelvis[0], pelvis[1]);
  if (who === 'maya') { // back hair sits behind torso: draw at head pos later via transform below
  }
  // head anchor
  const headR = 46 * c.hf, neckTop = TL + c.neck;
  const headPos = rot(pp.hx, -(neckTop + headR * .82) + pp.hy - pp.sh * .2 + Math.sin(t * 2.3 + ph) * -.8);
  const hd = pp.hd + hs * .025 + tl * .5;
  const drawHeadPass = (pass) => { ctx.save(); ctx.translate(headPos[0], headPos[1]); ctx.rotate(hd); ctx.scale(c.hf, c.hf); drawHead(ctx, c, who, st, t, pass); ctx.restore(); };
  ctx.restore();
  drawHeadPass('back');
  // neck
  ctx.save(); const nk = rot(0, -TL + 4); limb(ctx, [[nk[0], nk[1]], [headPos[0] * .7 + nk[0] * .3, headPos[1] + 26 * c.hf]], 22 * (who === 'yoni' ? 1.1 : 1), c.skinSh, 5); ctx.restore();
  ctx.save(); ctx.translate(pelvis[0], pelvis[1]); ctx.rotate(tl); ctx.scale(1, 1);
  drawTorso(ctx, c, who, TL, t); ctx.restore();
  drawHeadPass('tail'); drawHeadPass('head');
  // arms
  const arms = {};
  for (const arm of ['L', 'R']) {
    const sd = arm === 'R' ? 1 : -1, tg = pp[arm];
    const sh = rot(sd * (c.sw - 6), -TL + 20 - pp.sh);
    const reach = (c.arm[0] + c.arm[1]) / 185;
    const tx = sh[0] + (arm === 'L' ? -1 : 1) * Math.abs(tg[0]) * (tg[0] * sd < 0 ? -1 : 1) * 1 * (arm === 'L' ? 1 : 1) * 0 + tg[0] * reach, ty = sh[1] + tg[1] * reach;
    const r = ik(sh[0], sh[1], tx, ty, c.arm[0], c.arm[1], sd);
    const pts = [sh, r.e, r.h];
    limb(ctx, pts, c.armW, c.skin, 6);
    const sl = c.sleeve >= 1.5 ? c.arm[0] + c.arm[1] - 6 : c.arm[0] * c.sleeve;
    const spts = alongPath(pts, sl);
    limb(ctx, spts, c.sleeveW, c.top, 6);
    if (who === 'maya') { const cp = alongPath(pts, sl).slice(-2); limb(ctx, [cp[0], cp[1]], c.sleeveW - 2, c.top, 6); ctx.save(); const e = cp[1], d = Math.atan2(e[1] - cp[0][1], e[0] - cp[0][0]); ctx.translate(e[0], e[1]); ctx.rotate(d); ctx.beginPath(); ctx.roundRect(-8, -c.sleeveW / 2 - 1, 12, c.sleeveW + 2, 5); A.fillStroke(ctx, '#fff1d6', 4.5); ctx.restore(); }
    if (who === 'tom') { const e = spts[spts.length - 1], p0 = spts[spts.length - 2]; const d = Math.atan2(e[1] - p0[1], e[0] - p0[0]); ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(d); ctx.fillStyle = '#fff'; ctx.fillRect(-12, -c.sleeveW / 2 + 1, 8, c.sleeveW - 2); ctx.restore(); }
    const fa = Math.atan2(r.h[1] - r.e[1], r.h[0] - r.e[0]);
    let hand = tg[2]; if (who === 'maya' && arm === 'L') { // scrunchie on wrist
      ctx.save(); const w0 = [r.h[0] - Math.cos(fa) * 10, r.h[1] - Math.sin(fa) * 10]; ctx.translate(w0[0], w0[1]); ctx.rotate(fa); ctx.beginPath(); ctx.roundRect(-4, -c.armW / 2 - 3, 9, c.armW + 6, 4); A.fillStroke(ctx, '#ff8ab0', 3.5); ctx.restore(); }
    drawHand(ctx, c, hand, r.h[0], r.h[1], fa, sd, t);
    arms[arm] = r.h;
  }
  drawHeadPass('frontfx');
  ctx.restore();
  const T = (p) => [x + (flip ? -1 : 1) * p[0] * sc, y + p[1] * sc];
  return { head: T(headPos), handR: T(arms.R), handL: T(arms.L), scale: sc };
};

