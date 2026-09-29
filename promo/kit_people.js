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
  yoni: { sc: 1.0, hf: 1.14, skin: '#e2a877', skinSh: '#c78a5e', hair: '#241a1e', hairHi: '#4a3a44', sw: 47, hw: 27, torso: 156, neck: 10, legs: 178, arm: [96, 92],
          top: '#ffc24a', topSh: '#e39a25', pants: '#34426f', pantsSh: '#26315a', shoe: '#8a5a3a', sole: '#f1e7d6', sleeve: 0.62, sleeveW: 33, armW: 27, legW: 37, seed: 3, shortsFrac: 1 },
  maya: { sc: 0.95, hf: 1.12, skin: '#efb98f', skinSh: '#d79a71', hair: '#2b1a1c', hairHi: '#5b3a40', sw: 39, hw: 27, torso: 146, neck: 10, legs: 174, arm: [92, 88],
          top: '#1fb6a6', topSh: '#12877c', pants: '#4b3f73', pantsSh: '#372e58', shoe: '#f4efe6', sole: '#d4cabb', sleeve: 2.0, sleeveW: 27, armW: 24, legW: 33, seed: 7, shortsFrac: 1 },
  tom:  { sc: 0.72, hf: 1.36, skin: '#f0bd93', skinSh: '#d99c73', hair: '#4a2a1a', hairHi: '#7a4a2c', sw: 46, hw: 26, torso: 140, neck: 8, legs: 170, arm: [96, 92],
          top: '#2f6df0', topSh: '#1f4bb8', pants: '#f4f4f8', pantsSh: '#cfd2e0', shoe: '#ff5a4a', sole: '#fff', sleeve: 0.95, sleeveW: 44, armW: 28, legW: 40, seed: 11, shortsFrac: 0.44 },
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
      const kx = sd * (hw + 6), ky = 26, ax = sd * (hw + 10), ay = 26 + c.legs * .5;
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
    const tx = sh[0] + tg[0] * reach, ty = sh[1] + tg[1] * reach;
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
  ctx.restore();
  const T = (p) => [x + (flip ? -1 : 1) * p[0] * sc, y + p[1] * sc];
  return { head: T(headPos), handR: T(arms.R), handL: T(arms.L), scale: sc };
};

// ------------------------------------------------------------------ sofa
const SEATH = 122;
P.SEATH = SEATH;
P.sofaSeat = (x, y, s = 1, i = 1) => ({ x: x + (i - 1) * 285 * s, y: y - SEATH * s });
function sofaCols(o) { const c = o.color || '#c4553f'; return { c, hi: A.mixc(c, '#ffffff', .18), sh: A.mixc(c, '#1a0a30', .38), dk: A.mixc(c, '#1a0a30', .55) }; }
P.sofaBack = function (ctx, x, y, s = 1, o = {}) {
  const k = sofaCols(o); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,4,26,.4)'; A.ellipse(ctx, 0, 6, 560, 30); ctx.fill();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sd * 440 - 16, -26, 32, 30, 6); A.fillStroke(ctx, '#5a3a2a', 5); }
  // back frame
  ctx.beginPath(); ctx.roundRect(-478, -348, 956, 300, 46); A.fillStroke(ctx, A.linear(ctx, 0, -348, 0, -50, [[0, k.hi], [1, k.c]]), 7);
  // base
  ctx.beginPath(); ctx.roundRect(-500, -110, 1000, 96, 26); A.fillStroke(ctx, A.linear(ctx, 0, -110, 0, -14, [[0, k.c], [1, k.sh]]), 7);
  // back cushions
  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * 285; ctx.beginPath(); ctx.roundRect(cx - 138, -318, 276, 190, 40);
    A.fillStroke(ctx, A.linear(ctx, cx, -318, cx, -128, [[0, k.hi], [.6, k.c], [1, k.sh]]), 6);
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 80, -250); ctx.quadraticCurveTo(cx, -232, cx + 80, -250); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, -236, 7, 0, A.TAU); ctx.fillStyle = k.dk; ctx.fill();
  }
  // seat cushions
  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * 285; ctx.beginPath(); ctx.roundRect(cx - 140, -SEATH - 6, 280, 78, 30);
    A.fillStroke(ctx, A.linear(ctx, cx, -SEATH, cx, -60, [[0, k.hi], [.5, k.c], [1, k.sh]]), 6);
  }
  ctx.restore();
};
P.sofaFront = function (ctx, x, y, s = 1, o = {}) {
  const k = sofaCols(o); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.roundRect(sd * 452 - 62, -252, 124, 240, 42);
    A.fillStroke(ctx, A.linear(ctx, sd * 452 - 62, 0, sd * 452 + 62, 0, sd < 0 ? [[0, k.hi], [1, k.c]] : [[0, k.c], [1, k.sh]]), 7);
    ctx.beginPath(); ctx.roundRect(sd * 452 - 62, -262, 124, 64, 32); A.fillStroke(ctx, A.linear(ctx, 0, -262, 0, -198, [[0, k.hi], [1, k.c]]), 6);
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sd * 452 - 30, -180); ctx.lineTo(sd * 452 - 30, -30); ctx.stroke();
  }
  ctx.restore();
};
P.sofa = function (ctx, x, y, s = 1, o = {}) { P.sofaBack(ctx, x, y, s, o); P.sofaFront(ctx, x, y, s, o); };

// ------------------------------------------------------------------ TV + devices
P.TV = { x: 1040, y: 205, w: 780, h: 439 };
function screenIn(ctx, x, y, w, h, r, draw, o) {
  ctx.save(); ctx.translate(x, y); A.rrect(ctx, 0, 0, w, h, r); ctx.clip();
  ctx.fillStyle = '#05030f'; ctx.fillRect(0, 0, w, h);
  if (draw && o.on !== false) { try { draw(ctx, w, h); } catch (e) { console.error(e); } }
  // gloss + vignette
  if (o.gloss !== false) {
    ctx.fillStyle = A.linear(ctx, 0, 0, w * .6, h, [[0, 'rgba(255,255,255,.10)'], [.35, 'rgba(255,255,255,.03)'], [.36, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * .72, 0); ctx.lineTo(w * .3, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = A.radial(ctx, w / 2, h / 2, Math.min(w, h) * .5, Math.max(w, h) * .75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,30,.28)']]); ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
P.tv = function (ctx, drawScreen, o = {}) {
  const T = P.TV, b = 18, x = T.x, y = T.y, w = T.w, h = T.h, spill = o.spill || '#7fb2ff', sa = o.spillAlpha == null ? .38 : o.spillAlpha;
  if (sa > 0 && o.on !== false) { // light spill on wall + floor
    A.glow(ctx, x + w / 2, y + h / 2, 760, spill, sa * .55);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = sa * .5;
    ctx.fillStyle = A.linear(ctx, 0, y + h, 0, y + h + 330, [[0, spill], [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath(); ctx.moveTo(x, y + h + 20); ctx.lineTo(x + w, y + h + 20); ctx.lineTo(x + w + 260, y + h + 420); ctx.lineTo(x - 260, y + h + 420); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // stand
  ctx.beginPath(); ctx.moveTo(x + w / 2 - 44, y + h + b - 4); ctx.lineTo(x + w / 2 + 44, y + h + b - 4); ctx.lineTo(x + w / 2 + 96, y + h + b + 34); ctx.lineTo(x + w / 2 - 96, y + h + b + 34); ctx.closePath(); A.fillStroke(ctx, A.linear(ctx, 0, y + h, 0, y + h + 50, [[0, '#2b2740'], [1, '#161226']]), 6);
  // bezel
  ctx.beginPath(); ctx.roundRect(x - b, y - b, w + b * 2, h + b * 2 + 6, 20); A.fillStroke(ctx, A.linear(ctx, x, y - b, x, y + h + b, [[0, '#3a3552'], [1, '#15112a']]), 7);
  ctx.beginPath(); ctx.arc(x + w / 2, y + h + b - 3, 3, 0, A.TAU); ctx.fillStyle = o.on === false ? '#f33' : '#4ff09a'; ctx.fill();
  screenIn(ctx, x, y, w, h, 6, drawScreen, o);
  if (o.on !== false && sa > 0) A.glow(ctx, x + w / 2, y + h / 2, 520, spill, sa * .12);
};
P.phone = function (ctx, x, y, s, rot, drawScreen, o = {}) {
  const w = 160, h = 320; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
  if (o.spill !== false && o.on !== false) A.glow(ctx, 0, 0, 260, o.spill || '#8fc0ff', .22);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28); A.fillStroke(ctx, A.linear(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, '#3c3858'], [1, '#14102a']]), 6);
  screenIn(ctx, -w / 2 + 9, -h / 2 + 12, w - 18, h - 24, 20, drawScreen, o);
  ctx.beginPath(); ctx.roundRect(-22, -h / 2 + 17, 44, 10, 5); ctx.fillStyle = '#05030f'; ctx.fill(); ctx.restore();
  return { w: w - 18, h: h - 24 };
};
P.tablet = function (ctx, x, y, s, rot, drawScreen, o = {}) {
  const w = 400, h = 288; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
  if (o.spill !== false && o.on !== false) A.glow(ctx, 0, 0, 380, o.spill || '#8fc0ff', .2);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); A.fillStroke(ctx, A.linear(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, '#3c3858'], [1, '#14102a']]), 6);
  screenIn(ctx, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 10, drawScreen, o); ctx.restore();
};
P.laptop = function (ctx, x, y, s, drawScreen, o = {}) { // (x,y) = bottom centre of base
  const w = 460, h = 290; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (o.spill !== false && o.on !== false) A.glow(ctx, 0, -h / 2, 420, o.spill || '#8fc0ff', .22);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h - 20, w, h, 16); A.fillStroke(ctx, A.linear(ctx, 0, -h, 0, 0, [[0, '#3a3656'], [1, '#1b1730']]), 6);
  screenIn(ctx, -w / 2 + 14, -h - 6, w - 28, h - 28, 6, drawScreen, o);
  ctx.beginPath(); ctx.moveTo(-w / 2 - 30, 0); ctx.lineTo(w / 2 + 30, 0); ctx.lineTo(w / 2 + 10, -22); ctx.lineTo(-w / 2 - 10, -22); ctx.closePath(); A.fillStroke(ctx, A.linear(ctx, 0, -22, 0, 0, [[0, '#cfd0e2'], [1, '#8a88a8']]), 5);
  ctx.beginPath(); ctx.roundRect(-40, -22, 80, 8, 4); ctx.fillStyle = '#6d6a8a'; ctx.fill(); ctx.restore();
};
P.remote = function (ctx, x, y, s = 1, rot = 0, o = {}) { // (x,y) centre; long axis vertical, IR tip up
  const t = o.t || 0; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.roundRect(-13, -42, 26, 84, 10); A.fillStroke(ctx, A.linear(ctx, -13, 0, 13, 0, [[0, '#4a4668'], [1, '#1c1832']]), 4.5);
  ctx.beginPath(); ctx.arc(0, -28, 5.5, 0, A.TAU); ctx.fillStyle = '#ff4a5a'; ctx.fill();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(-5 + j * 10, -10 + i * 12, 3.3, 0, A.TAU); ctx.fillStyle = (i + j) % 3 == 0 ? '#38d9f5' : '#9a95c0'; ctx.fill(); }
  ctx.beginPath(); ctx.roundRect(-6, 27, 12, 8, 4); ctx.fillStyle = '#ffc24a'; ctx.fill();
  if (o.ir) { const a = .5 + .5 * Math.sin(t * 30); A.glow(ctx, 0, -46, 30, '#ff8a8a', a); }
  ctx.restore();
};
P.popcorn = function (ctx, x, y, s = 1, t = 0) { // (x,y) = bottom centre
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const puff = (px, py, r, i) => { ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.26 + i, rr = r * .6; ctx.moveTo(px + Math.cos(a) * rr + r * .5, py + Math.sin(a) * rr); ctx.arc(px + Math.cos(a) * rr, py + Math.sin(a) * rr, r * .55, 0, A.TAU); } A.fillStroke(ctx, '#fff3cf', 3.5); ctx.fillStyle = '#ffd86a'; ctx.beginPath(); ctx.arc(px + r * .25, py + r * .3, r * .22, 0, A.TAU); ctx.fill(); };
  const rn = A.rng(21); for (let i = 0; i < 14; i++) puff((rn() - .5) * 100, -140 - rn() * 30 + Math.abs(i - 7) * 2, 16 + rn() * 5, i);
  ctx.beginPath(); ctx.moveTo(-58, -132); ctx.lineTo(58, -132); ctx.lineTo(44, 0); ctx.lineTo(-44, 0); ctx.closePath(); ctx.save(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  ctx.fillStyle = '#ff3d4d'; for (let i = -3; i < 4; i += 2) { ctx.beginPath(); ctx.moveTo(i * 16 - 8, -140); ctx.lineTo(i * 16 + 8, -140); ctx.lineTo(i * 12 + 6, 4); ctx.lineTo(i * 12 - 6, 4); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(0, -140, 80, 150); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-58, -132); ctx.lineTo(58, -132); ctx.lineTo(44, 0); ctx.lineTo(-44, 0); ctx.closePath(); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-64, -142, 128, 16, 8); A.fillStroke(ctx, '#ff3d4d', 5);
  // popping kernels
  for (let i = 0; i < 4; i++) { const ph = ((t * 1.3 + i * .27) % 1), a = -Math.PI / 2 + (A.hash(i + 3) - .5) * 1.3, v = 120 + A.hash(i) * 60; if (ph < .9) { const px = Math.cos(a) * v * ph * 1.2, py = -150 + Math.sin(a) * v * ph * 2 + 300 * ph * ph; ctx.save(); ctx.translate(px, py); ctx.rotate(ph * 9); puff(0, 0, 9, i); ctx.restore(); } }
  ctx.restore();
};
P.cushion = function (ctx, x, y, s = 1, rot = 0, o = {}) {
  const c = o.color || '#ffc24a', c2 = o.color2 || A.mixc(c, '#1a0a30', .3), w = o.w || 150; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); const h = w / 2;
  A.blob(ctx, [[-h, -h + 8], [0, -h + 2], [h, -h + 8], [h - 4, 0], [h, h - 8], [0, h - 2], [-h, h - 8], [-h + 4, 0]]);
  A.fillStroke(ctx, A.radial(ctx, -h * .3, -h * .3, 4, h * 1.5, [[0, A.mixc(c, '#fff', .2)], [1, c2]]), 6);
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 6; for (let i = -3; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 26 - h, -h); ctx.lineTo(i * 26 + h, h); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-h + 10, -h + 10); ctx.lineTo(-6, -6); ctx.moveTo(h - 10, -h + 10); ctx.lineTo(6, -6); ctx.moveTo(-h + 10, h - 10); ctx.lineTo(-6, 6); ctx.moveTo(h - 10, h - 10); ctx.lineTo(6, 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, A.TAU); ctx.fillStyle = c2; ctx.fill(); ctx.restore();
};
P.blanket = function (ctx, x, y, s = 1, o = {}) { // draped plaid, (x,y)=centre
  const w = o.w || 420, h = o.h || 140, t = o.t || 0, c = o.color || '#ff4f9a', c2 = o.color2 || '#ffe08a'; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  const wav = (i) => Math.sin(i * 1.3 + t * 1.2) * 3;
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 10); for (let i = 0; i <= 8; i++) ctx.lineTo(-w / 2 + w * i / 8, -h / 2 + wav(i) + (i % 2 ? 6 : 0));
  ctx.lineTo(w / 2, h / 2 - 6); for (let i = 8; i >= 0; i--) ctx.quadraticCurveTo(-w / 2 + w * (i + .5) / 8, h / 2 + 14 + wav(i + 3), -w / 2 + w * i / 8, h / 2 - 2 + wav(i + 1)); ctx.closePath();
  ctx.save(); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, c], [1, A.mixc(c, '#1a0a30', .3)]]); ctx.fill(); ctx.clip();
  ctx.fillStyle = 'rgba(255,224,138,.5)'; for (let i = -6; i < 8; i++) ctx.fillRect(i * 44 - 5, -h, 10, h * 2);
  ctx.fillStyle = 'rgba(26,19,48,.25)'; for (let j = -3; j < 4; j++) ctx.fillRect(-w, j * 40 - 4, w * 2, 8);
  ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-w * .2, -h / 2); ctx.quadraticCurveTo(-w * .1, 0, -w * .25, h / 2); ctx.moveTo(w * .25, -h / 2); ctx.quadraticCurveTo(w * .35, 0, w * .2, h / 2); ctx.stroke(); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
};

// ------------------------------------------------------------------ room
function skylineLayer() {
  return A.layer('ppl_sky', 440, 470, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#0b0a3a'], [.55, '#3a2a7e'], [.85, '#8a4a9c'], [1, '#e07a8a']]); g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; const r = A.rng(4); for (let i = 0; i < 34; i++) { g.globalAlpha = .3 + r() * .6; g.fillRect(r() * w, r() * h * .5, 2, 2); } g.globalAlpha = 1;
    // sea band
    g.fillStyle = A.linear(g, 0, h * .8, 0, h, [[0, '#4a2a8e'], [1, '#1a1150']]); g.fillRect(0, h * .84, w, h * .16);
    const bl = (x, bw, bh, c) => { g.fillStyle = c; g.fillRect(x, h * .84 - bh, bw, bh + 2); };
    const rr = A.rng(9); let x = -10; while (x < w) { const bw = 30 + rr() * 34, bh = 60 + rr() * 90; bl(x, bw, bh, '#2b1f66'); x += bw + 2; }
    x = 5; while (x < w) { const bw = 26 + rr() * 30, bh = 40 + rr() * 110; bl(x, bw, bh, '#1c1450'); x += bw + 6; }
    // azrieli-like towers: round, triangle, square
    g.fillStyle = '#160f44'; g.beginPath(); g.roundRect(250, h * .84 - 250, 52, 250, [26, 26, 0, 0]); g.fill();
    g.beginPath(); g.moveTo(312, h * .84); g.lineTo(312, h * .84 - 236); g.lineTo(364, h * .84); g.fill();
    g.fillRect(372, h * .84 - 258, 50, 258); g.fillStyle = '#231a5e'; g.fillRect(376, h * .84 - 258, 6, 258);
    g.fillStyle = '#ffe9a6'; const rw = A.rng(12); for (let i = 0; i < 110; i++) { const px = rw() * w, py = h * .84 - 12 - rw() * 240; g.globalAlpha = .35 + rw() * .55; g.fillRect(px, py, 4, 5); } g.globalAlpha = 1;
  });
}
function roomStatic(w, h) {
  return A.layer('ppl_room', 1920, 1080, (g) => {
    // wall
    g.fillStyle = A.linear(g, 0, 0, 0, 720, [[0, '#2a1b5e'], [.6, '#4a2f7e'], [1, '#6e4586']]); g.fillRect(0, 0, 1920, 720);
    g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 24; i++) g.fillRect(i * 84 + 20, 0, 34, 700);
    // picture rail / moulding
    g.fillStyle = '#1e1450'; g.fillRect(0, 0, 1920, 22); g.fillStyle = '#5a3a86'; g.fillRect(0, 22, 1920, 5);
    // baseboard
    g.fillStyle = '#f0e2cf'; g.fillRect(0, 676, 1920, 34); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 704, 1920, 6); g.strokeStyle = A.OUTLINE; g.lineWidth = 5; g.strokeRect(-4, 676, 1930, 34);
    // floor
    g.fillStyle = A.linear(g, 0, 710, 0, 1080, [[0, '#9a5e40'], [1, '#4e2a33']]); g.fillRect(0, 710, 1920, 370);
    const r = A.rng(31); g.strokeStyle = 'rgba(30,10,30,.25)'; g.lineWidth = 3; for (let y = 745; y < 1080; y += 36 + (y - 710) * .08) { g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); let x = r() * 200; const rowh = 36 + (y - 710) * .08; while (x < 1920) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + rowh); g.stroke(); x += 240 + r() * 220; } }
    // rug
    const rug = (rx, ry, c) => { g.beginPath(); g.ellipse(930, 940, rx, ry, 0, 0, A.TAU); g.fillStyle = c; g.fill(); };
    rug(1000, 175, '#1a1150'); rug(960, 152, '#ff4f9a'); rug(900, 128, '#fff1d6'); rug(800, 104, '#1fb6a6'); rug(690, 78, '#ffc24a'); rug(560, 52, '#2b1b6b');
    g.strokeStyle = A.OUTLINE; g.lineWidth = 6; g.beginPath(); g.ellipse(930, 940, 1000, 175, 0, 0, A.TAU); g.stroke();
    // window
    const wx = 190, wy = 100, ww = 440, wh = 480;
    g.fillStyle = '#f2e3cc'; g.beginPath(); g.roundRect(wx - 22, wy - 22, ww + 44, wh + 44, 14); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 7; g.stroke();
    g.drawImage(skylineLayer(), wx, wy, ww, wh);
    g.fillStyle = '#f2e3cc'; g.fillRect(wx + ww / 2 - 8, wy, 16, wh); g.fillRect(wx, wy + wh * .42, ww, 14); g.strokeStyle = A.OUTLINE; g.lineWidth = 5; g.strokeRect(wx + ww / 2 - 8, wy, 16, wh); g.strokeRect(wx, wy + wh * .42, ww, 14);
    g.fillStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + 170, wy); g.lineTo(wx + 30, wy + wh); g.lineTo(wx, wy + wh); g.fill();
    g.fillStyle = '#e8dcc6'; g.fillRect(wx - 34, wy + wh + 22, ww + 68, 16); g.strokeRect(wx - 34, wy + wh + 22, ww + 68, 16);
    // curtains
    for (const sd of [-1, 1]) {
      const cx = sd < 0 ? wx - 70 : wx + ww + 70; g.beginPath(); g.moveTo(cx - 60, 0); g.lineTo(cx + 60, 0); g.bezierCurveTo(cx + 90, 300, cx + 40 * sd, 480, cx + 70 * sd, 640); g.lineTo(cx - 70 * sd, 640); g.bezierCurveTo(cx - 60 * sd, 480, cx - 50, 300, cx - 60, 0);
      g.fillStyle = A.linear(g, cx - 60, 0, cx + 60, 0, [[0, '#a83a86'], [.5, '#d0559e'], [1, '#8a2a70']]); g.fill(); g.lineWidth = 6; g.strokeStyle = A.OUTLINE; g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 4; for (let i = -1; i < 2; i++) { g.beginPath(); g.moveTo(cx + i * 26, 30); g.quadraticCurveTo(cx + i * 30 + sd * 10, 320, cx + i * 24 + sd * 20, 620); g.stroke(); }
    }
    g.fillStyle = '#3a2a1a'; g.fillRect(wx - 180, 40, ww + 360, 12); g.strokeStyle = A.OUTLINE; g.lineWidth = 4; g.strokeRect(wx - 180, 40, ww + 360, 12);
    // wall shelves + frames (mid wall)
    const shelf = (sx, sy, sw) => { g.fillStyle = '#c98a55'; g.beginPath(); g.roundRect(sx, sy, sw, 16, 5); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 5; g.stroke(); };
    const books = (sx, sy, n, seed) => { const rb = A.rng(seed); let x = sx; const cs = ['#ff4f9a', '#38d9f5', '#ffc24a', '#3d7bff', '#ff8a3d', '#3ddc84']; for (let i = 0; i < n; i++) { const bw = 16 + rb() * 12, bh = 50 + rb() * 34; g.fillStyle = cs[Math.floor(rb() * cs.length)]; g.fillRect(x, sy - bh, bw, bh); g.strokeStyle = A.OUTLINE; g.lineWidth = 4; g.strokeRect(x, sy - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 3, sy - bh + 8, bw - 6, 4); x += bw + 2; } };
    shelf(720, 250, 290); books(732, 250, 8, 5); g.fillStyle = '#fff1d6'; g.beginPath(); g.roundRect(860, 190, 40, 60, 6); g.fill(); g.lineWidth = 4; g.strokeStyle = A.OUTLINE; g.stroke();
    // pot on shelf
    g.beginPath(); g.moveTo(935, 250); g.lineTo(995, 250); g.lineTo(985, 208); g.lineTo(945, 208); g.closePath(); A.fillStroke(g, '#ff8a3d', 4);
    shelf(720, 400, 290); books(830, 400, 6, 8);
    // little framed pic + trophy on shelf 2
    g.beginPath(); g.roundRect(736, 342, 62, 58, 5); A.fillStroke(g, '#ffc24a', 4); g.fillStyle = '#38d9f5'; g.fillRect(744, 350, 46, 42); g.fillStyle = '#ff4f9a'; g.beginPath(); g.arc(767, 366, 10, 0, A.TAU); g.fill();
    for (const [x, y, w, h, c] of [[730, 90, 110, 140, '#ffc24a'], [860, 110, 96, 96, '#38d9f5']]) { g.beginPath(); g.roundRect(x, y, w, h, 8); g.fillStyle = '#f2e3cc'; g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 6; g.stroke(); g.fillStyle = c; g.fillRect(x + 12, y + 12, w - 24, h - 24); g.strokeRect(x + 12, y + 12, w - 24, h - 24); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x + 12, y + h * .7); g.lineTo(x + w * .45, y + 30); g.lineTo(x + w - 12, y + h * .8); g.lineTo(x + w - 12, y + h - 12); g.lineTo(x + 12, y + h - 12); g.fill(); }
    // console under TV
    g.fillStyle = '#5a3a2a'; g.beginPath(); g.roundRect(1000, 700, 860, 108, 12); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#7a4c36'; g.fillRect(1006, 706, 848, 24); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 4; for (const x of [1284, 1430, 1576]) { g.beginPath(); g.moveTo(x, 736); g.lineTo(x, 802); g.stroke(); }
    g.fillStyle = '#ffc24a'; for (const x of [1280, 1436, 1572, 1720]) { g.beginPath(); g.arc(x, 760, 6, 0, A.TAU); g.fill(); }
    for (const x of [1030, 1810]) { g.fillStyle = '#3a2418'; g.fillRect(x, 806, 18, 30); g.strokeRect(x, 806, 18, 30); }
    // speaker + potted plant on console
    g.beginPath(); g.roundRect(1030, 610, 60, 90, 8); A.fillStroke(g, '#2b2740', 5); g.beginPath(); g.arc(1060, 664, 18, 0, A.TAU); A.fillStroke(g, '#4a4668', 4); g.beginPath(); g.arc(1060, 632, 6, 0, A.TAU); A.fillStroke(g, '#4a4668', 3);
    // big corner plant (monstera) right
    const potx = 1858, poty = 820; g.beginPath(); g.moveTo(potx - 44, poty - 110); g.lineTo(potx + 44, poty - 110); g.lineTo(potx + 32, poty + 40); g.lineTo(potx - 32, poty + 40); g.closePath(); A.fillStroke(g, A.linear(g, potx - 40, 0, potx + 40, 0, [[0, '#e07a4a'], [1, '#a04a30']]), 6);
    const leaf = (lx, ly, len, ang, c) => { g.save(); g.translate(lx, ly); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .3, -len * .34, len * .8, -len * .3, len, 0); g.bezierCurveTo(len * .8, len * .3, len * .3, len * .34, 0, 0); A.fillStroke(g, c, 5); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .95, 0); g.stroke(); g.restore(); };
    const rp = A.rng(77); for (let i = 0; i < 9; i++) leaf(potx - 8 + (rp() - .5) * 30, poty - 108, 150 + rp() * 90, -Math.PI / 2 + (i - 4) * .34 + (rp() - .5) * .2, i % 2 ? '#2fae6a' : '#3ddc84');
    // floor lamp left
    g.strokeStyle = A.OUTLINE; g.lineWidth = 6; g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(70, 706, 46, 12, 0, 0, A.TAU); g.fill(); g.stroke(); g.fillStyle = '#c9a25a'; g.fillRect(64, 330, 12, 380); g.strokeRect(64, 330, 12, 380);
    g.beginPath(); g.moveTo(22, 330); g.lineTo(118, 330); g.lineTo(98, 240); g.lineTo(42, 240); g.closePath(); A.fillStroke(g, A.linear(g, 0, 240, 0, 330, [[0, '#ffe6a8'], [1, '#ffc24a']]), 6);
  });
}
P.room = function (ctx, t = 0, o = {}) {
  ctx.drawImage(roomStatic(), 0, 0);
  // window life: twinkles + blinking lit windows
  const wx = 190, wy = 100;
  for (let i = 0; i < 7; i++) { const a = .5 + .5 * Math.sin(t * (2 + i * .7) + i * 2.1); const sx = wx + 30 + A.hash(i + 40) * 380, sy = wy + 20 + A.hash(i + 50) * 170; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.translate(sx, sy); ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(1.5, -1.5); ctx.lineTo(6, 0); ctx.lineTo(1.5, 1.5); ctx.lineTo(0, 6); ctx.lineTo(-1.5, 1.5); ctx.lineTo(-6, 0); ctx.lineTo(-1.5, -1.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  { const a = .5 + .5 * Math.sin(t * 3.1); ctx.fillStyle = `rgba(255,60,60,${.3 + a * .7})`; ctx.beginPath(); ctx.arc(wx + 276, wy + 154, 3.5, 0, A.TAU); ctx.fill(); A.glow(ctx, wx + 276, wy + 154, 16, '#ff3030', a * .6); }
  // moon glow
  A.glow(ctx, wx + 350, wy + 70, 90, '#cfd8ff', .5); ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(wx + 350, wy + 70, 22, 0, A.TAU); ctx.fill(); ctx.fillStyle = '#e3d8b8'; ctx.beginPath(); ctx.arc(wx + 343, wy + 64, 5, 0, A.TAU); ctx.fill();
  // lamp glow (warm, gentle flicker)
  const fl = 1 + A.noise1(t * 3.1) * .05;
  A.glow(ctx, 70, 290, 520, '#ffb04a', .55 * fl); A.glow(ctx, 70, 300, 160, '#ffe08a', .5 * fl);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .12 * fl; ctx.fillStyle = A.linear(ctx, 0, 330, 0, 700, [[0, '#ffb04a'], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.moveTo(22, 330); ctx.lineTo(118, 330); ctx.lineTo(360, 710); ctx.lineTo(-200, 710); ctx.fill(); ctx.restore();
  // vignette
  ctx.fillStyle = A.radial(ctx, 960, 520, 500, 1200, [[0, 'rgba(10,5,40,0)'], [1, 'rgba(10,5,40,.5)']]); ctx.fillRect(0, 0, 1920, 1080);
  if (o.dim) { ctx.fillStyle = `rgba(8,4,28,${o.dim})`; ctx.fillRect(0, 0, 1920, 1080); }
  o.tvRect = P.TV; return P.TV;
};
P.roomSmall = function (ctx, t = 0, o = {}) {
  const c = A.layer('ppl_roomsmall', 1920, 1080, (g) => {
    g.fillStyle = A.linear(g, 0, 0, 0, 720, [[0, '#2a1b5e'], [1, '#6e4586']]); g.fillRect(0, 0, 1920, 720);
    g.fillStyle = '#f0e2cf'; g.fillRect(0, 676, 1920, 34); g.fillStyle = A.linear(g, 0, 710, 0, 1080, [[0, '#9a5e40'], [1, '#4e2a33']]); g.fillRect(0, 710, 1920, 370);
    g.drawImage(skylineLayer(), 190, 100, 440, 480); g.strokeStyle = A.OUTLINE; g.lineWidth = 8; g.strokeRect(190, 100, 440, 480);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(400, 100, 12, 480); g.fillRect(190, 300, 440, 12);
  });
  ctx.drawImage(c, 0, 0); A.glow(ctx, 70, 290, 520, '#ffb04a', .4);
  ctx.fillStyle = A.radial(ctx, 960, 520, 500, 1200, [[0, 'rgba(10,5,40,0)'], [1, 'rgba(10,5,40,.5)']]); ctx.fillRect(0, 0, 1920, 1080);
  if (o.dim) { ctx.fillStyle = `rgba(8,4,28,${o.dim})`; ctx.fillRect(0, 0, 1920, 1080); }
  return P.TV;
};
})();
