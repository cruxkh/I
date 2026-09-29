// BEAR presenter inside the end-card TV: says "GO TV!" with lips synced to the audio.
// Viseme keys are measured on the actual "GO TV" clip (energy + zero-crossing analysis) and placed at v = 37.25
// (the clip starts at T 43.45 in master_v7 = T 41.85 in master_v7t = voice clock 37.25).
// Drawing: everything is authored in head-radius units (g.scale(R, R)); the fur / shading of head, ears and the
// jersey body are cached bitmaps (CL.layer), the face (eyes, brows, muzzle, nose, mouth) is drawn live every frame.
(() => {
  const { clamp, lerp, ease } = A, C = CL.C, TAU = Math.PI * 2;
  const V0 = 37.25;
  // [t, open, width, teeth, fv(lower lip under teeth), round]
  const K = [
    [-9, .0, .62, 0, 0, 0], [0.00, .0, .62, 0, 0, 0],
    [0.05, .30, .55, 0, 0, .2],   // G
    [0.14, .78, .50, 0, 0, .7],   // O (open round)
    [0.34, .62, .44, 0, 0, .85],  // o
    [0.44, .34, .34, 0, 0, 1],    // u (rounding)
    [0.50, .06, .55, 0, 0, .2],   // pause
    [0.54, .14, .80, 1, 0, 0],    // T (teeth, wide)
    [0.62, .40, .96, 1, 0, 0],    // ii
    [0.82, .32, .92, 1, 0, 0],
    [0.86, .10, .78, 1, 1, 0],    // V (lower lip under upper teeth)
    [0.92, .46, 1.0, 1, 0, 0],    // ii!
    [1.12, .30, .94, 1, 0, 0],
    [1.26, .05, .80, 0, 0, 0],    // smile, closed
    [99, .05, .80, 0, 0, 0]];
  function vis(t) {
    const u = t - V0; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= u) i++;
    const a = K[i], b = K[i + 1], k = ease.inOut(clamp((u - a[0]) / Math.max(.001, b[0] - a[0])));
    return a.map((x, j) => j === 0 ? u : lerp(x, b[j], k));
  }

  // ---------- palette ----------
  const INK = C.ink, WHITE = C.white;
  const FUR = { hi: '#D08A4A', base: '#AE6630', mid: '#95532A', lo: '#6F3A1C', deep: '#4E2610', rim: '#FFD27A' };
  const MZ = { hi: '#FBE6C4', base: '#F0CD9C', lo: '#D9A874', lip: '#C98B62' };
  const EAR = { hi: '#F7B8A2', lo: '#D9806C' };
  const JER = { hi: '#4D78FF', base: '#1F4FFF', lo: '#1437B8', deep: '#0B1F5C' };
  const OUT = .052, IN = .034, BORDER = .06;           // outer ink, inner ink, white die-cut border (head units)

  // ---------- fur silhouettes (unit space) ----------
  // generic contour with swept tufts: pt(θ) gives the smooth base contour, zones insert pointed fur tufts
  function furPath(pt, zones, th0) {
    const p = new Path2D(), N = 260, d = TAU / N, zs = zones.map(z => { let a0 = z[0], a1 = z[1]; while (a0 < th0) { a0 += TAU; a1 += TAU; } return { a0, a1, n: z[2], len: z[3], sw: z[4] }; }).sort((a, b) => a.a0 - b.a0);
    const nrm = th => { const a = pt(th - 1e-3), b = pt(th + 1e-3), tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty); return [ty / l, -tx / l, tx / l, ty / l]; };
    let th = th0, zi = 0; const s = pt(th); p.moveTo(s[0], s[1]);
    while (th < th0 + TAU - 1e-9) {
      const z = zs[zi];
      if (z && th + d > z.a0) {
        const q = pt(z.a0); p.lineTo(q[0], q[1]);
        for (let i = 0; i < z.n; i++) {
          const a = z.a0 + (z.a1 - z.a0) * i / z.n, b = z.a0 + (z.a1 - z.a0) * (i + 1) / z.n, m = (a + b) / 2;
          const L = Array.isArray(z.len) ? z.len[i] : z.len * (.8 + .4 * Math.sin(i * 2.3 + 1)), [nx, ny, tx, ty] = nrm(m), pm = pt(m), pb = pt(b), pa = pt(a);
          const tip = [pm[0] + nx * L + tx * L * z.sw, pm[1] + ny * L + ty * L * z.sw];
          const ca = [lerp(pa[0], tip[0], .45) + nx * L * .5, lerp(pa[1], tip[1], .45) + ny * L * .5], cb = [lerp(tip[0], pb[0], .55) - nx * L * .12, lerp(tip[1], pb[1], .55) - ny * L * .12];
          p.quadraticCurveTo(ca[0], ca[1], tip[0], tip[1]); p.quadraticCurveTo(cb[0], cb[1], pb[0], pb[1]);
        }
        th = z.a1; zi++; continue;
      }
      th = Math.min(th + d, th0 + TAU); const q = pt(th); p.lineTo(q[0], q[1]);
    }
    p.closePath(); return p;
  }
  const headPt = th => { const c = Math.cos(th), s = Math.sin(th); return [c * (1 + .075 * Math.max(0, s) - .05 * Math.max(0, -s) * Math.abs(c)), s * (s < 0 ? .86 : .8)]; };
  const HEAD = furPath(headPt, [
    [.12, .74, 3, [.09, .11, .075], .55],                       // right cheek fluff (sweeps down)
    [Math.PI - .74, Math.PI - .12, 3, [.075, .11, .09], -.55],  // left cheek fluff
    [-Math.PI / 2 - .34, -Math.PI / 2 + .2, 2, [.12, .2], -1.1], // crown tuft
  ], Math.PI / 2);
  const EARC = [[-.7, -.64], [.7, -.64]], ER = .3;
  const EARS = EARC.map(([cx, cy], k) => furPath(th => [cx + Math.cos(th) * ER, cy + Math.sin(th) * ER * .96],
    k ? [[-1.25, -.75, 1, [.055], .6]] : [[-2.4, -1.9, 1, [.055], -.6]], Math.PI / 2));
  const BODY = (() => { const p = new Path2D(); p.moveTo(-1.55, 1.9); p.bezierCurveTo(-1.5, 1.12, -1.1, .84, -.58, .74); p.quadraticCurveTo(0, .66, .58, .74); p.bezierCurveTo(1.1, .84, 1.5, 1.12, 1.55, 1.9); p.closePath(); return p; })();
  const COLLAR = (() => { const p = new Path2D(); p.moveTo(-.66, .7); p.quadraticCurveTo(0, 1.2, .66, .7); return p; })();

  const ring = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const rgrad = (g, x0, y0, r0, x1, y1, r1, stops) => { const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const lgrad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const hsh = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };

  // fur texture: short tapered strokes following the local fur direction
  function furMarks(g, pts, col, w) {
    g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = w;
    for (const [x, y, a, l] of pts) { const c = Math.cos(a), s = Math.sin(a); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + c * l * .5 - s * l * .15, y + s * l * .5 + c * l * .15, x + c * l, y + s * l); g.stroke(); }
  }
  // ---------- cached layers ----------
  function drawEarsHead(g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    EARS.forEach((ep, k) => {
      const s = k ? 1 : -1, [cx, cy] = EARC[k];
      g.fillStyle = rgrad(g, cx - .12, cy - .14, .02, cx, cy, .42, [[0, FUR.hi], [.55, FUR.base], [1, FUR.lo]]); g.fill(ep);
      g.save(); g.clip(ep);
      // contact shadow of the head on the ear + shadow side
      g.fillStyle = 'rgba(70,30,8,.28)'; ring(g, cx + s * .09, cy + .1, ER * 1.05, ER, 0); g.rect(cx - 1, cy - 1, 2, 2); g.fill('evenodd');
      g.lineWidth = .16; g.strokeStyle = 'rgba(60,25,6,.35)'; g.stroke(HEAD);
      // inner ear
      const ix = cx - s * .01, iy = cy + .02;
      g.fillStyle = FUR.lo; ring(g, ix, iy + .012, .175, .165); g.fill();
      g.fillStyle = rgrad(g, ix - .04, iy - .06, .01, ix, iy, .18, [[0, EAR.hi], [1, EAR.lo]]); ring(g, ix, iy + .02, .155, .145); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; ring(g, ix - .05, iy - .05, .05, .028, -.6); g.fill();
      furMarks(g, [[ix - .04, iy + .15, -1.9, .1], [ix + .01, iy + .16, -1.5, .12], [ix + .06, iy + .15, -1.15, .09]], FUR.hi, .022);
      g.restore();
      g.lineWidth = OUT; g.strokeStyle = INK; g.stroke(ep);
    });
    // head base
    g.fillStyle = rgrad(g, -.34, -.5, .05, -.1, -.1, 1.25, [[0, FUR.hi], [.45, FUR.base], [1, FUR.mid]]); g.fill(HEAD);
    g.save(); g.clip(HEAD);
    // cel shadow (light from upper left): everything outside the lit disc
    g.fillStyle = 'rgba(92,40,12,.32)'; ring(g, -.16, -.2, 1.02, .98); g.rect(-2, -2, 4, 4); g.fill('evenodd');
    g.fillStyle = 'rgba(92,40,12,.22)'; ring(g, -.08, -.32, 1.02, 1.0); g.rect(-2, -2, 4, 4); g.fill('evenodd');
    // forehead key light
    g.fillStyle = 'rgba(255,214,160,.22)'; ring(g, -.12, -.12, .86, .72); ring(g, -.02, .02, .86, .74); g.fill('evenodd');
    g.fillStyle = 'rgba(255,232,195,.35)'; ring(g, -.5, -.5, .1, .04, -.75); g.fill();
    // warm rim light on the right edge (reflected yellow backdrop)
    g.lineWidth = .1; g.strokeStyle = lgrad(g, .45, 0, 1.08, 0, [[0, 'rgba(255,210,120,0)'], [.75, 'rgba(255,205,110,.55)'], [1, 'rgba(255,225,150,.95)']]); g.stroke(HEAD);
    // fur texture: crown chevrons, cheek & temple strokes (shadow tone + light tone)
    const dark = [], lite = [];
    for (const [a0, n] of [[-2.55, 3], [-.75, 3], [2.55, 2], [.55, 2], [-2.05, 2], [-1.1, 2]]) for (let i = 0; i < n; i++) {
      const a = a0 + (i - (n - 1) / 2) * .075, [x, y] = headPt(a), k = .9 - (i % 2) * .025, d = Math.atan2(y, x) + Math.PI;
      dark.push([x * k, y * k, d + (x > 0 ? .25 : -.25), .06 + (i === 1 ? .03 : 0)]);
    }
    for (const [x, y, a, l] of [[-.1, -.66, -1.25, .07], [0, -.7, -1.57, .09], [.1, -.66, -1.9, .07]]) dark.push([x, y, a, l]);
    furMarks(g, dark, 'rgba(90,40,12,.45)', .02);
    for (const [x, y, a, l] of [[-.66, -.3, -2.2, .08], [-.6, -.37, -2.1, .06]]) lite.push([x, y, a, l]);
    furMarks(g, lite, 'rgba(255,220,170,.5)', .018);
    // blush with a tiny sticker shine
    for (const s of [-1, 1]) {
      g.fillStyle = rgrad(g, s * .6, .2, 0, s * .6, .2, .17, [[0, 'rgba(255,96,120,.55)'], [.6, 'rgba(255,96,120,.28)'], [1, 'rgba(255,96,120,0)']]); ring(g, s * .6, .2, .19, .14); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; ring(g, s * .6 - .05, .16, .026, .016, -.4); g.fill(); ring(g, s * .6 - .01, .145, .01, .01); g.fill();
    }
    g.restore();
    g.lineWidth = OUT; g.strokeStyle = INK; g.stroke(HEAD);
  }
  function drawBody(g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = lgrad(g, -1.2, .7, 1.2, 1.4, [[0, JER.hi], [.45, JER.base], [1, JER.lo]]); g.fill(BODY);
    g.save(); g.clip(BODY);
    g.fillStyle = 'rgba(8,20,80,.35)'; ring(g, -.25, 1.3, 1.25, .7); g.rect(-3, -1, 6, 4); g.fill('evenodd');
    // raglan piping to the shoulders
    for (const s of [-1, 1]) { g.lineWidth = .075; g.strokeStyle = INK; g.beginPath(); g.moveTo(s * .5, .86); g.quadraticCurveTo(s * 1.0, .9, s * 1.35, 1.35); g.stroke(); g.lineWidth = .045; g.strokeStyle = C.yellow; g.stroke(); }
    // fabric sheen
    g.fillStyle = 'rgba(255,255,255,.18)'; ring(g, -.95, 1.02, .3, .09, -.6); g.fill();
    g.fillStyle = 'rgba(0,0,40,.35)'; g.lineWidth = .16; g.strokeStyle = 'rgba(0,0,40,.35)'; g.stroke(COLLAR);
    // collar (yellow ribbed band with blue inner trim)
    g.lineWidth = .17; g.strokeStyle = INK; g.stroke(COLLAR);
    g.lineWidth = .125; g.strokeStyle = lgrad(g, -.6, .7, .6, 1, [[0, '#FFE45C'], [.5, C.yellow], [1, '#E5B800']]); g.stroke(COLLAR);
    g.lineWidth = .025; g.strokeStyle = JER.base; g.stroke(COLLAR);
    g.restore();
    g.lineWidth = OUT; g.strokeStyle = INK; g.stroke(BODY);
  }
  const S = 2;   // cache supersampling
  const cached = (key, R, x0, y0, w, h, fn) => CL.layer(key + Math.round(R * 10), Math.ceil(w * R * S), Math.ceil(h * R * S), c => { c.scale(R * S, R * S); c.translate(-x0, -y0); fn(c); });

  // ---------- live face ----------
  const env = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
  function blinkAt(t) {   // deterministic blinks: one after "TV!", then every ~3.3 s
    const u = t - V0; let b = 0;
    for (const c of [-1.6, 1.42]) b = Math.max(b, lid(u - c));
    const p = ((u - 1.42) % 3.3 + 3.3) % 3.3; if (u > 2.5) b = Math.max(b, lid(p - 1.9));
    return b;
  }
  function lid(x) { if (x < -.07 || x > .15) return 0; return x < 0 ? 1 - (x / -.07) ** 2 : 1 - ease.inOut(x / .15); }

  function eye(g, s, t, blink, squint, gx, gy, browUp) {
    const ex = s * .345, ey = -.17, rx = .185, ry = .225, closed = clamp((blink - .55) / .4);
    g.save(); g.translate(ex, ey); g.rotate(s * .07);
    const eyeP = new Path2D(); eyeP.ellipse(0, 0, rx, ry, 0, 0, TAU);
    // drop shadow on the fur
    g.fillStyle = `rgba(60,24,6,${.35 * (1 - closed)})`; g.save(); g.translate(.016, .026); g.fill(eyeP); g.restore();
    g.fillStyle = lgrad(g, 0, -ry, 0, ry, [[0, '#C7CEE0'], [.4, '#FFFFFF'], [1, '#F1EEE8']]); g.fill(eyeP);
    g.save(); g.clip(eyeP);
    // iris & pupil
    const ix = gx * .03 - s * .018, iy = .03 + gy * .02, IR = .145;
    g.fillStyle = rgrad(g, ix, iy + .06, .01, ix, iy, IR, [[0, '#F2B55C'], [.42, '#B06A2C'], [.82, '#5C2E10'], [1, '#26120A']]); ring(g, ix, iy, IR, IR * 1.05); g.fill();
    g.fillStyle = 'rgba(255,205,130,.4)'; g.beginPath(); g.ellipse(ix, iy, IR * .82, IR * .86, 0, .3, Math.PI - .3); g.ellipse(ix, iy + .012, IR * .62, IR * .6, 0, Math.PI - .45, .45, true); g.fill();
    g.fillStyle = '#0B0503'; ring(g, ix, iy + .004, IR * .5, IR * .54); g.fill();
    g.lineWidth = .012; g.strokeStyle = 'rgba(30,12,2,.85)'; ring(g, ix, iy, IR, IR * 1.05); g.stroke();
    // specular highlights (light from upper left): big soft-edged key + small fill + tiny sparkle
    g.fillStyle = 'rgba(255,255,255,.55)'; ring(g, ix - .05, iy - .055, .062, .066, -.35); g.fill();
    g.fillStyle = '#fff'; ring(g, ix - .05, iy - .055, .047, .052, -.35); g.fill();
    ring(g, ix + .06, iy + .05, .022, .022); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; ring(g, ix + .03, iy - .085, .01, .01); g.fill();
    // upper lid (fur coloured) with its soft shadow on the eyeball
    const cover = Math.max(.04, blink), ly = -ry + (2 * ry + .06) * cover, bow = .09 * (1 - blink * .7);
    const lidEdge = (dy = 0, mv) => { g[mv ? 'moveTo' : 'lineTo'](-rx - .05, ly - bow * .4 + dy); g.quadraticCurveTo(0, ly + bow + dy, rx + .05, ly - bow * .4 + dy); };
    g.fillStyle = 'rgba(70,40,80,.2)'; g.beginPath(); g.moveTo(-rx - .05, -ry - .1); lidEdge(.035); g.lineTo(rx + .05, -ry - .1); g.fill();
    g.fillStyle = lgrad(g, 0, -ry, 0, ly + bow, [[0, FUR.mid], [1, FUR.hi]]); g.beginPath(); g.moveTo(-rx - .05, -ry - .1); lidEdge(); g.lineTo(rx + .05, -ry - .1); g.fill();
    g.lineWidth = .045 * (1 - closed); g.strokeStyle = INK; g.beginPath(); lidEdge(0, 1); if (blink > .02) g.stroke();
    // happy lower lid (cheeks push up when smiling)
    if (squint > .001) { const lo = ry - squint * 2 * ry; g.fillStyle = FUR.base; g.beginPath(); g.moveTo(-rx - .05, ry + .1); g.lineTo(-rx - .05, lo + .07); g.quadraticCurveTo(0, lo - .06, rx + .05, lo + .07); g.lineTo(rx + .05, ry + .1); g.fill(); g.lineWidth = .028; g.strokeStyle = INK; g.beginPath(); g.moveTo(-rx - .05, lo + .07); g.quadraticCurveTo(0, lo - .06, rx + .05, lo + .07); g.stroke(); }
    g.restore();
    // outline: heavier upper lash line, lighter lower line; fades into a closed-eye arc
    g.strokeStyle = INK; g.globalAlpha = 1 - closed;
    g.lineWidth = IN * .85; g.stroke(eyeP);
    g.lineWidth = .05; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI + .25, TAU - .25); g.stroke();
    g.globalAlpha = closed;
    if (closed > 0) { g.lineWidth = .05; g.beginPath(); g.moveTo(-rx * .95, ry * .12); g.quadraticCurveTo(0, ry * .62, rx * .95, ry * .12); g.stroke(); g.lineWidth = .04; g.beginPath(); g.moveTo(s * rx * .93, ry * .16); g.lineTo(s * (rx + .06), ry * .02); g.stroke(); }
    g.globalAlpha = 1;
    g.restore();
    // brow: soft tapered tuft, inner end lifts when talking
    g.save(); g.translate(s * .32, -.53 - browUp); g.rotate(s * (-.1 - browUp * 1.4));
    g.fillStyle = lgrad(g, 0, -.05, 0, .05, [[0, '#6A3517'], [1, '#3A1A08']]);
    g.beginPath(); g.moveTo(-s * .135, .025); g.bezierCurveTo(-s * .11, -.055, s * .08, -.075, s * .145, -.005); g.bezierCurveTo(s * .08, -.022, -s * .06, -.012, -s * .135, .025); g.fill();
    g.restore();
  }

  function muzzlePath(jd) {
    const p = new Path2D(); p.moveTo(0, .085);
    p.bezierCurveTo(.2, .03, .45, .1, .48, .32); p.bezierCurveTo(.51, .54 + jd * .5, .3, .72 + jd, 0, .73 + jd);
    p.bezierCurveTo(-.3, .72 + jd, -.51, .54 + jd * .5, -.48, .32); p.bezierCurveTo(-.45, .1, -.2, .03, 0, .085); p.closePath(); return p;
  }

  function mouth(g, op, wd, th, fv, rd, jd) {
    const my = .445 + jd * .35, h = .45 * Math.max(op, .26 * fv), w = .37 * wd * (1 - .36 * rd) + .015;
    const cu = .035 * (1 - rd), sag = .065 * (1 - rd) * (1 - .4 * clamp(op * 2));
    const yu = -h * (.36 + .12 * rd) + sag, yl = h * (.64 - .12 * rd) + sag;
    const ku = lerp(.62, 1, rd), kl = lerp(.78, 1, rd), k3 = 4 / 3;
    const upper = (p, dy = 0) => { p.moveTo(-w, -cu + dy); p.bezierCurveTo(-w * ku, yu * k3 + dy, w * ku, yu * k3 + dy, w, -cu + dy); };
    g.save(); g.translate(0, my);
    const open = new Path2D(); upper(open); open.bezierCurveTo(w * kl, yl * k3, -w * kl, yl * k3, -w, -cu); open.closePath();
    // puckered lip band (stronger when rounding) and lower-lip volume
    const lipT = .028 + .045 * rd;
    g.fillStyle = MZ.lip; g.save(); g.translate(0, (yu + yl) / 2); g.scale(1 + lipT / Math.max(w, .05), 1 + lipT * 1.2 / Math.max((yl - yu) / 2, .04)); g.translate(0, -(yu + yl) / 2); g.globalAlpha = clamp(op * 3) * (.35 + .65 * rd); g.fill(open); g.restore();
    if (op > .02) {
      g.fillStyle = lgrad(g, 0, yu, 0, yl, [[0, '#2A080C'], [1, '#6E1B26']]); g.fill(open);
      g.save(); g.clip(open);
      // tongue
      const ty = yl - .015 - th * .03;
      g.fillStyle = rgrad(g, 0, ty - .03, .01, 0, ty, w * .8, [[0, '#FF8FA0'], [.7, '#E8566F'], [1, '#B63650']]); ring(g, 0, ty + .03, w * .78, Math.max(.07, h * .42)); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; ring(g, -w * .25, ty - .01, w * .18, .018, -.2); g.fill();
      g.lineWidth = .012; g.strokeStyle = 'rgba(140,30,50,.6)'; g.beginPath(); g.moveTo(0, ty - .01); g.lineTo(0, ty + .05); g.stroke();
      // upper teeth band following the upper lip, retracts behind the lip when not needed
      const tH = .022 + .062 * th;
      const teeth = new Path2D(); teeth.moveTo(-w - .1, -.6); teeth.lineTo(-w - .1, -cu + tH); teeth.lineTo(-w, -cu + tH); teeth.bezierCurveTo(-w * ku, yu * k3 + tH, w * ku, yu * k3 + tH, w, -cu + tH); teeth.lineTo(w + .1, -cu + tH); teeth.lineTo(w + .1, -.6); teeth.closePath();
      g.fillStyle = lgrad(g, 0, yu, 0, yu + tH + .05, [[0, '#FFFFFF'], [.75, '#FBF6EA'], [1, '#D9D2C2']]); g.fill(teeth);
      g.lineWidth = .01; g.strokeStyle = 'rgba(150,130,110,.55)'; g.beginPath(); g.moveTo(0, yu - .02); g.lineTo(0, yu + tH + .01); g.stroke();
      g.restore();
    }
    // outline of the opening (a smile line when closed)
    g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = IN * (1.05 - .15 * clamp(op * 4)); g.strokeStyle = INK; g.stroke(open);
    // lower lip tucked under the upper teeth (V)
    if (fv > .01) {
      g.save(); g.globalAlpha = clamp(fv * 1.6);
      const lt = yu + .022 + .062 * th + (1 - fv) * .05, c = (lt + .25 * cu) / .75, lip = new Path2D();
      lip.moveTo(-w * 1.02, -cu + .005); lip.bezierCurveTo(-w * .55, c, w * .55, c, w * 1.02, -cu + .005); lip.bezierCurveTo(w * .85, yl * k3 + .09, -w * .85, yl * k3 + .09, -w * 1.02, -cu + .005); lip.closePath();
      g.fillStyle = lgrad(g, 0, lt, 0, yl + .08, [[0, '#F0A08A'], [1, '#C9745A']]); g.fill(lip);
      g.fillStyle = 'rgba(255,255,255,.5)'; ring(g, -w * .15, lt + .03, w * .22, .013); g.fill();
      g.lineWidth = .026; g.strokeStyle = INK; g.beginPath(); g.moveTo(-w * 1.02, -cu + .005); g.bezierCurveTo(-w * .55, c, w * .55, c, w * 1.02, -cu + .005); g.stroke();
            g.restore();
    }
    // lower lip crease & highlight
    g.lineWidth = .018; g.strokeStyle = `rgba(120,60,25,${.4 * (1 - clamp(fv * 2))})`; g.beginPath(); g.moveTo(-w * .45, yl + .05 + .02 * (1 - op)); g.quadraticCurveTo(0, yl + .085, w * .45, yl + .05 + .02 * (1 - op)); g.stroke();
    // smile corners (dimples) fade in as the mouth closes
    const dm = clamp(1 - op * 5) * (1 - rd);
    if (dm > .01) { g.globalAlpha = dm; g.lineWidth = .026; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * (w - .02), -cu - .035); g.quadraticCurveTo(s * (w + .03), -cu - .005, s * (w + .015), -cu + .035); g.stroke(); } g.globalAlpha = 1; }
    g.restore();
    return my + yu;   // top of the upper lip (for the philtrum)
  }

  // draw the bear centred at (0,0), head radius R
  CL.bear = (g, t, R) => {
    const [u, op, wd, th, fv, rd] = vis(t);
    const talk = clamp((u + .15) / .2) * (1 - clamp((u - 1.3) / .35));
    const breath = Math.sin(t * 2.4), jd = op * .1;
    const tilt = -.025 + .03 * Math.sin(t * 1.25) * (1 - talk) + talk * (-.05 * env(u, .22, .2) + .06 * env(u, .72, .16) - .045 * env(u, 1.0, .15)) + .04 * env(u, 1.45, .3);
    const hy = -.012 * breath - .04 * env(u, .2, .18) + .025 * env(u, .86, .08) - .03 * env(u, .98, .15) - .015 * op;
    const browUp = talk * (.035 + .045 * env(u, .2, .2) + .05 * env(u, .95, .22)) + .02 * env(u, 1.5, .3);
    const blink = blinkAt(t), squint = .2 * clamp((u - 1.15) / .25) * (1 - clamp((u - 2.6) / .4)) * (1 - blink);
    const gx = A.noise1(t * .8 + 3) * .5, gy = A.noise1(t * .7 + 11) * .35;

    g.save(); g.scale(R, R); g.lineJoin = 'round'; g.lineCap = 'round';
    const headT = () => { g.translate(0, hy); g.translate(0, .72); g.rotate(tilt); g.scale(1 - .012 * op, 1 + .02 * op); g.translate(0, -.72); };
    // body transform (breathing)
    const bodyT = () => { g.translate(0, 1.2); g.scale(1 + .006 * breath, 1 + .012 * breath); g.translate(0, -1.2); };
    // 1) soft drop shadow + white die-cut sticker border for the whole silhouette
    for (const pass of [0, 1]) {
      const col = pass ? WHITE : 'rgba(40,20,0,.26)', lw = OUT + BORDER * 2, off = pass ? 0 : .06;
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = lw;
      g.save(); g.translate(off * .6, off); bodyT(); g.fill(BODY); g.stroke(BODY); g.restore();
      g.save(); g.translate(off * .6, off); headT(); for (const p of [...EARS, HEAD]) { g.fill(p); g.stroke(p); } g.restore();
    }
    // 2) jersey body
    g.save(); bodyT(); g.drawImage(cached('bearBody', R, -1.6, .6, 3.2, 1.35, drawBody), -1.6, .6, 3.2, 1.35); g.restore();
    // head shadow on the jersey
    g.save(); bodyT(); g.clip(BODY); g.translate(.03, .07); headT(); g.fillStyle = 'rgba(5,15,60,.35)'; g.fill(HEAD); g.restore();
    // 3) head (ears + fur, cached)
    g.save(); headT();
    g.drawImage(cached('bearHead', R, -1.1, -1.08, 2.2, 1.98, drawEarsHead), -1.1, -1.08, 2.2, 1.98);
    // 4) face
    const mz = muzzlePath(jd);
    g.fillStyle = 'rgba(80,34,8,.3)'; g.save(); g.translate(.02, .035); g.fill(mz); g.restore();
    g.fillStyle = lgrad(g, 0, .06, 0, .75 + jd, [[0, MZ.hi], [.55, MZ.base], [1, MZ.lo]]); g.fill(mz);
    g.save(); g.clip(mz);
    g.fillStyle = 'rgba(190,120,70,.25)'; ring(g, .04, .12, .52, .6); g.rect(-1, -1, 2, 3); g.fill('evenodd');
    g.fillStyle = 'rgba(255,255,255,.35)'; ring(g, -.24, .22, .12, .06, -.5); g.fill();
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(120,60,25,.35)'; ring(g, s * (.2 + i * .065), .3 + (i % 2) * .05 - i * .01, .011, .011); g.fill(); }   // whisker dots
    g.restore();
    g.lineWidth = IN; g.strokeStyle = INK; g.stroke(mz);
    // mouth + philtrum + nose
    const lipTop = mouth(g, op, wd, th, fv, rd, jd);
    g.lineWidth = .03; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, .2); g.quadraticCurveTo(.004, (.2 + lipTop) / 2, 0, lipTop + .005); g.stroke();
    const nose = new Path2D(); nose.moveTo(0, .06); nose.bezierCurveTo(.11, .05, .175, .075, .17, .115); nose.bezierCurveTo(.165, .16, .07, .215, 0, .22); nose.bezierCurveTo(-.07, .215, -.165, .16, -.17, .115); nose.bezierCurveTo(-.175, .075, -.11, .05, 0, .06); nose.closePath();
    g.fillStyle = 'rgba(80,34,8,.3)'; g.save(); g.translate(.012, .025); g.fill(nose); g.restore();
    g.fillStyle = rgrad(g, -.05, .09, .005, 0, .12, .2, [[0, '#7A5140'], [.35, '#3A2217'], [1, '#120806']]); g.fill(nose);
    g.save(); g.clip(nose); g.lineWidth = .025; g.strokeStyle = 'rgba(255,190,140,.35)'; g.beginPath(); g.moveTo(-.1, .19); g.quadraticCurveTo(0, .235, .1, .19); g.stroke(); g.restore();
    g.lineWidth = IN * .9; g.strokeStyle = INK; g.stroke(nose);
    g.fillStyle = 'rgba(255,255,255,.85)'; ring(g, -.055, .095, .055, .024, -.18); g.fill(); ring(g, .075, .1, .014, .012); g.fill();
    // eyes + brows
    for (const s of [-1, 1]) eye(g, s, t, blink, squint, gx, gy, browUp);
    g.restore();
    g.restore();
  };
})();
