// s2_sports: "כל ערוצי הספורט כולל צ'רלטון"  (v 6.5 to 9.3, HOLD `cin` at v=8.85)
// 6.50 liquid wipe covers s1 | 6.78 כל: stadium light rig ignites | 6.95 ערוצי: Sport 1..4 cards fly in as a column, 7.47 Sport 5 hero slams
// 7.58 הספורט: ball/trophy splash burst + crowd | 8.03 כולל: build-up (sweeping spotlights, drumroll, implosion)
// 8.32 צ'רלטון: CHARLTON wordmark SLAMS (shockwave + lightning), camera pushes in (main.js), hold = cinema trailer moment
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, W = 1920, H = 1080, TAU = A.TAU;
  const land = (t, t0, d = .36) => CL.pop(t, t0 - .37 * d, d);   // overshoot pop that CROSSES 1.0 exactly at t0 (impact on the word)
  const sm = (a, b, x) => A.smooth(a, b, x);
  const FX = 960, FY = 450;   // focus point of the wordmark (also HOLDFOC.cin)

  // ---------------------------------------------------------------- entry wipe (candy liquid rising on a diagonal)
  const WIPE_COLS = [C.lime, C.cyan, C.blue];
  const WT0 = 6.50, WDUR = .27;
  function front(p, i) { const pp = clamp((p - i * .15) / .55), e = ease.inOut(pp); return { e, base: lerp(-700, W + 700, e), ph: i * 2 + p * 7 }; }
  function frontPath(ctx, f) {   // region to the LEFT of a wobbly diagonal edge sweeping right
    const amp = 90 * Math.sin(Math.PI * clamp(f.e)); ctx.beginPath(); ctx.moveTo(-60, -40);
    for (let y = -40; y <= H + 40; y += 30) ctx.lineTo(f.base + (y - 540) * .3 + Math.sin(y * .014 + f.ph) * amp, y);
    ctx.lineTo(-60, H + 40); ctx.closePath();
  }

  // ---------------------------------------------------------------- stadium light rig
  const LAMPS = [90, 270, 450, 630, 810, 990], BCOL = ['#e6f7ff', C.pink, '#fff1c2', C.cyan, C.pink, '#e6f7ff'];
  const LON = i => 6.78 + i * .035;   // CUE 6.78 lights-on flash (lamps ignite left to right, 6.78 .. 6.95)
  function sweepPh(t) { const b = clamp((t - 8.03) / .29); return t * 1.1 + 9 * Math.pow(b, 2.2); }
  function beams(ctx, t, aim, pow) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    LAMPS.forEach((lx, i) => {
      const on = clamp((t - LON(i)) / .08); if (on <= 0) return;
      const ph = sweepPh(t) + i * 1.15, ly = 120;
      const tx = lerp(540 + (lx - 540) * .3 + Math.sin(ph) * 400, 540 + (lx - 540) * .06, aim), ty = lerp(1250, FY, aim);
      const dx = tx - lx, dy = ty - ly, L = Math.hypot(dx, dy), th = Math.atan2(-dx, dy), hw = lerp(150, 120, aim);
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(th);
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, L * 1.1, [[0, A.hex(BCOL[i], .55 * on * pow)], [.5, A.hex(BCOL[i], .16 * on * pow)], [1, A.hex(BCOL[i], 0)]]);
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(hw, L * 1.1); ctx.lineTo(-hw, L * 1.1); ctx.closePath(); ctx.fill(); ctx.restore();
    });
    ctx.restore();
  }
  function rig(ctx, t, pow) {   // truss bar + lamp heads with blooming lenses
    const lit = clamp((t - 6.78) / .2); ctx.save();
    ctx.fillStyle = '#0a0f45'; ctx.beginPath(); ctx.roundRect(20, 92, W - 40, 20, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke();
    LAMPS.forEach((lx, i) => {
      const on = clamp((t - LON(i)) / .08); ctx.save(); ctx.translate(lx, 128);
      ctx.fillStyle = '#131a66'; ctx.beginPath(); ctx.roundRect(-46, -16, 92, 60, 18); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = A.mixc('#1a2270', '#ffffff', on); ctx.beginPath(); ctx.arc(0, 22, 30, 0, TAU); ctx.fill();
      if (on > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 22, 0, 150 * on * pow, [[0, 'rgba(255,255,255,.95)'], [.25, A.hex(BCOL[i], .5)], [1, A.hex(BCOL[i], 0)]]); ctx.fillRect(-160, -130, 320, 320); }
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- crowd silhouettes
  function crowd(ctx, t, T, drop) {
    const rows = [{ y: 1470, n: 10, s: 1, col: '#0b1150', dl: 0 }, { y: 1560, n: 8, s: 1.25, col: '#050826', dl: .05 }];
    rows.forEach((r, ri) => {
      for (let i = 0; i < r.n; i++) {
        const seed = ri * 20 + i, x = (i + .5) * W / r.n + (hash(seed) - .5) * 40, rise = 1 - CL.pop(t, 7.58 + r.dl + hash(seed + 3) * .1 - .05, .45); if (rise >= 1) continue;
        const bob = Math.sin(T * (3 + hash(seed) * 2) + seed) * 7 * (1 - rise), y = r.y + rise * 340 + bob + drop, s = r.s * (.92 + hash(seed + 1) * .2), arms = hash(seed + 5) > .35, wv = Math.sin(T * 5 + seed * 1.7);
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        ctx.fillStyle = r.col; ctx.strokeStyle = r.col; ctx.lineCap = 'round';
        if (arms) { ctx.lineWidth = 26; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * 52, 105); ctx.lineTo(sd * (78 + wv * 12 * sd), 30 - 40 - Math.abs(wv) * 8); ctx.stroke(); ctx.beginPath(); ctx.arc(sd * (78 + wv * 12 * sd), -20 - Math.abs(wv) * 8, 17, 0, TAU); ctx.fill(); }); }
        ctx.beginPath(); ctx.ellipse(0, 190, 96, 130, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 45, 40, 0, TAU); ctx.fill();
        ctx.strokeStyle = ri ? 'rgba(255,80,170,.55)' : 'rgba(25,200,255,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 45, 40, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 190, 96, 130, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.restore();
        const q = CL.qs(T, 9); if (hash(q * 3.1 + seed * 1.7) > .93) CL.spark(ctx, x + (hash(q + seed) - .5) * 60, y + 20, 26 + hash(q + seed * 2) * 26, T, '#fff');   // camera flashes
      }
    });
  }

  // ---------------------------------------------------------------- sport icons (drawn in code)
  function pent(g, cx, cy, R, rot) { g.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.closePath(); g.fill(); }
  function soccer(ctx, r) {
    ctx.save(); ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.arc(8, 14, r, 0, TAU); ctx.fill();
    ctx.fillStyle = A.radial(ctx, -r * .3, -r * .35, r * .1, r * 1.15, [[0, '#ffffff'], [.6, '#e3e8ff'], [1, '#8792cc']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#0b1250'; pent(ctx, 0, 0, r * .36, 0);
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; pent(ctx, Math.cos(a) * r * .98, Math.sin(a) * r * .98, r * .34, a + Math.PI / 2 + Math.PI); ctx.strokeStyle = '#0b1250'; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); ctx.lineTo(Math.cos(a) * r * .66, Math.sin(a) * r * .66); ctx.stroke(); }
    ctx.restore(); ctx.lineWidth = r * .07; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .5, r * .26, r * .12, -.7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function basket(ctx, r) {
    ctx.save(); ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.arc(8, 14, r, 0, TAU); ctx.fill();
    ctx.fillStyle = A.radial(ctx, -r * .3, -r * .35, r * .1, r * 1.15, [[0, '#ffc27a'], [.35, '#ff8a1f'], [1, '#b13d00']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = C.ink; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * .95, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.25, 0, r * .95, Math.PI - 1, Math.PI + 1); ctx.stroke(); ctx.restore();
    ctx.lineWidth = r * .07; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .5, r * .24, r * .11, -.7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function trophy(ctx, s) {
    ctx.save(); ctx.scale(s / 100, s / 100); const gold = A.linear(ctx, -60, 0, 60, 0, [[0, '#ffe98a'], [.45, '#ffb21e'], [1, '#c96a00']]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = C.ink; ctx.lineWidth = 22; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(sd * 58, -52, 30, sd < 0 ? Math.PI * .5 : -Math.PI * .5, sd < 0 ? Math.PI * 1.5 : Math.PI * .5, sd > 0); ctx.stroke(); });
    ctx.strokeStyle = gold; ctx.lineWidth = 10; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(sd * 58, -52, 30, sd < 0 ? Math.PI * .5 : -Math.PI * .5, sd < 0 ? Math.PI * 1.5 : Math.PI * .5, sd > 0); ctx.stroke(); });
    const body = () => { ctx.beginPath(); ctx.moveTo(-58, -100); ctx.lineTo(58, -100); ctx.bezierCurveTo(58, -10, 38, 30, 14, 42); ctx.lineTo(14, 66); ctx.lineTo(-14, 66); ctx.lineTo(-14, 42); ctx.bezierCurveTo(-38, 30, -58, -10, -58, -100); ctx.closePath(); };
    body(); ctx.fillStyle = gold; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-50, 86, 100, 30, 10); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-30, 64, 60, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-32, -50, 9, 40, .1, 0, TAU); ctx.fill();
    ctx.restore(); CL.spark(ctx, 0, -30 * s / 100, s * .2, 0, '#fff');
  }

  // ---------------------------------------------------------------- CHARLTON wordmark (glossy gold + candy, built once)
  const HEB = "צ'רלטון", LAT = 'CHARLTON', WMW = 1000, WMH = 720, CX = 500, CY = 360, HY = 262, LY = 470, HW = 720, LW = 700;
  let WM = null, MASK = null, SC = null;
  function hebPath(g, kind, lw) { g.save(); g.font = '900 200px Rubik'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; const k = HW / g.measureText(HEB).width; g.translate(CX, HY); g.scale(k, k * 1.3); if (kind === 'stroke') { g.lineWidth = lw; g.strokeText(HEB, 0, 0); } else g.fillText(HEB, 0, 0); g.restore(); }
  function latPath(g, kind, lw) {
    g.save(); g.font = '900 200px Rubik'; g.direction = 'ltr'; g.textAlign = 'left'; g.textBaseline = 'middle'; const ws = [...LAT].map(c => g.measureText(c).width), tr = 30, tot = ws.reduce((a, b) => a + b, 0) + tr * (ws.length - 1), k = LW / tot;
    g.translate(CX - LW / 2, LY); g.scale(k, k * 1.25); let x = 0; [...LAT].forEach((c, i) => { if (kind === 'stroke') { g.lineWidth = lw; g.strokeText(c, x, 0); } else g.fillText(c, x, 0); x += ws[i] + tr; }); g.restore();
  }
  function faceGrad(g, sy) { return A.linear(g, 0, -105 * sy, 0, 105 * sy, [[0, '#fffbe8'], [.22, '#ffe777'], [.46, '#ffad1f'], [.5, '#c95500'], [.58, '#ff9a1a'], [1, '#ffe27a']]); }
  function buildWM() {
    WM = CL.layer('s2_wm', WMW, WMH, g => {
      g.lineJoin = 'round'; g.lineCap = 'round'; g.miterLimit = 2;
      const lines = [[hebPath, HY, 1.3, 34, 30], [latPath, LY, 1.25, 30, 20]];
      // dark outline + purple/orange extrusion
      lines.forEach(([path, y, sy, EX, ex]) => {
        g.strokeStyle = '#050826'; for (let i = EX; i >= 0; i -= 2) { g.save(); g.translate(0, i); path(g, 'stroke', 46); g.restore(); }
        for (let i = EX; i >= 1; i--) { g.save(); g.translate(0, i); g.strokeStyle = A.mixc('#c24a00', '#3a0f78', i / EX); path(g, 'stroke', 34); g.restore(); }
      });
      // gold bevel rim + face with gloss (face painted on a scratch canvas so gloss only lands on glyph pixels)
      const sc = document.createElement('canvas'); sc.width = WMW; sc.height = WMH; const s = sc.getContext('2d'); s.lineJoin = 'round';
      lines.forEach(([path, y, sy]) => {
        g.save(); g.translate(0, 0); g.strokeStyle = A.linear(g, 0, y - 120, 0, y + 120, [[0, '#fff4b8'], [.5, '#ff9d1a'], [1, '#8a3200']]); path(g, 'stroke', 26); g.restore();
        s.save(); s.fillStyle = A.linear(s, 0, y - 105 * sy, 0, y + 105 * sy, [[0, '#fffbe8'], [.22, '#ffe777'], [.46, '#ffad1f'], [.5, '#c95500'], [.58, '#ff9a1a'], [1, '#ffe27a']]); path(s, 'fill');
        s.globalCompositeOperation = 'source-atop';
        s.fillStyle = A.linear(s, 0, y - 105 * sy, 0, y, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,.06)']]); s.fillRect(0, y - 110 * sy, WMW, 110 * sy);
        s.fillStyle = A.linear(s, 0, y + 20, 0, y + 105 * sy, [[0, 'rgba(255,46,147,0)'], [1, 'rgba(255,46,147,.35)']]); s.fillRect(0, y + 20, WMW, 90 * sy);
        s.strokeStyle = 'rgba(255,255,255,.75)'; path(s, 'stroke', 5); s.restore();
      });
      g.drawImage(sc, 0, 0);
      // gold rule with diamond under the Latin line
      const ly = 590; g.fillStyle = A.linear(g, 150, 0, 850, 0, [[0, 'rgba(255,214,90,0)'], [.2, '#ffd86a'], [.8, '#ffd86a'], [1, 'rgba(255,214,90,0)']]); g.fillRect(150, ly - 3, 700, 6);
      g.fillStyle = '#fff1a8'; g.save(); g.translate(CX, ly); g.rotate(Math.PI / 4); g.fillRect(-13, -13, 26, 26); g.strokeStyle = '#050826'; g.lineWidth = 4; g.strokeRect(-13, -13, 26, 26); g.restore();
    });
    MASK = CL.layer('s2_wm_mask', WMW, WMH, g => { g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round'; hebPath(g, 'fill'); latPath(g, 'fill'); hebPath(g, 'stroke', 8); latPath(g, 'stroke', 8); });
    SC = document.createElement('canvas'); SC.width = WMW; SC.height = WMH;
  }
  const GLINTS = [[150, 150], [350, 138], [580, 150], [800, 140], [870, 200], [140, 430], [430, 405], [700, 410], [860, 470]];

  // ---------------------------------------------------------------- the scene
  const TILES = [
    { k: 'sport1', cx: 275, cy: 235, t0: 6.95, col: '#00f786', from: [-620, 200], r0: -.6 },   // CUE 6.95 sport1-pop
    { k: 'sport2', cx: 805, cy: 235, t0: 7.08, col: '#ff2a52', from: [1700, 400], r0: .6 },    // CUE 7.08 sport2-pop
    { k: 'sport3', cx: 275, cy: 1240, t0: 7.21, col: '#ffe600', from: [-620, 1500], r0: .6 }, // CUE 7.21 sport3-pop
    { k: 'sport4', cx: 805, cy: 1240, t0: 7.34, col: '#00fff4', from: [1700, 1300], r0: -.6 }, // CUE 7.34 sport4-pop
  ];
  const ICONS = [   // CUE 7.58 ball-trophy-burst
    { kind: 'soccer', x: 165, y: 1085, r: 110, sp: 5, ph: 0 }, { kind: 'trophy', x: 925, y: 1075, r: 190, sp: 0, ph: 1.3 },
    { kind: 'basket', x: 905, y: 400, r: 84, sp: -6, ph: 2.1 }, { kind: 'soccer', x: 150, y: 405, r: 72, sp: -4, ph: 3.2 },
  ];

  function tileDraw(ctx, k, w, h, col, alpha) {
    const im = CL.logoImg(k); ctx.save(); ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, w * .75, [[0, A.hex(col, .28)], [1, A.hex(col, 0)]]); ctx.fillRect(-w, -w * .6, w * 2, w * 1.2); ctx.globalCompositeOperation = 'source-over';
    CL.gel(ctx, 0, 0, w, h, { fill: '#1d2c96', dark: '#070b3a', rim: col, rimW: 6, shadow: 14, r: h * .3 });
    if (im) { const s = Math.min(w * .86 / im.width, h * .82 / im.height), dw = im.width * s, dh = im.height * s; ctx.globalAlpha *= .4; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(CL.silhouette(im, col), -dw * .54, -dh * .54, dw * 1.08, dh * 1.08); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha /= .4; ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh); }
    ctx.restore();
  }

  A.scene({ name: 's2_sports', start: 6.5, end: 9.3, draw(ctx, s) {
    const t = s.t, T = A.T; if (!WM) buildWM(); CL.HOLDFOC.cin = [FX, FY, 1.3];
    const wp = (t - WT0) / WDUR, wiping = wp < 1; if (wp <= 0) return;
    if (wiping) {   // entry wipe: candy bands ahead of the reveal edge
      WIPE_COLS.forEach((col, i) => { const f = front(wp, i); frontPath(ctx, f); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8; ctx.stroke(); });
      frontPath(ctx, front(wp, 3)); ctx.save(); ctx.clip();
    }
    const ie = ease.in(clamp((t - 8.14) / .16)), lit = sm(6.78, 6.9, t), post = t >= 8.32;   // ie = implosion 0..1 (8.14 -> 8.30)
    CL.bg(ctx, T, { tint: [C.blue, C.purple, C.cyan] });
    ctx.fillStyle = `rgba(3,5,24,${.82 * (1 - lit)})`; ctx.fillRect(0, 0, W, H);
    CL.twinkle(ctx, T, 0, 200, W, 1000, 14, 5, ['#fff', C.cyan, C.yellow]);

    // ---- light rig + beams
    const aim = Math.max(ie * .9, sm(8.32, 8.55, t)); beams(ctx, t, aim, 1); rig(ctx, t, 1);
    if (t >= 6.78 && t < 7.05) { ctx.fillStyle = `rgba(255,255,255,${.85 * Math.exp(-(t - 6.78) * 11)})`; ctx.fillRect(0, 0, W, H); }   // the flash (CUE 6.78 light-flash)

    if (ie < 1) {
      // ---- ball/trophy burst (behind logos)
      if (t >= 7.5) {
        const p = CL.spring(t, 7.58 - .08, .75);   // CUE 7.58 ball-burst (splash + rings)
        ctx.save(); ctx.translate(lerp(540, 540, ie), lerp(720, FY, ie)); ctx.scale(1 - ie * .95, 1 - ie * .95); ctx.globalAlpha = .95; CL.splash(ctx, 0, 0, 600, p, 6, [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.purple]); ctx.restore();
      }
      // ---- tiles: column (big, readable) then they spring to the corners when Sport 5 slams
      const m = clamp((t - 7.47) / .34), me = ease.outBack(m), sh = CL.shake(t, 7.47, .4, 12);
      TILES.forEach((d, i) => {
        const pf = land(t, d.t0, .34); if (pf <= 0.002) return;
        const colx = 540, coly = 330 + i * 240, cxp = lerp(colx, d.cx, me), cyp = lerp(coly, d.cy, me), w = lerp(800, 490, me), h = lerp(210, 140, me);
        const px = lerp(d.from[0], cxp, pf), py = lerp(d.from[1], cyp, pf), idle = Math.sin(T * 2 + i * 1.7) * 5, rot = (1 - pf) * d.r0 + lerp(0, (i % 2 ? .03 : -.03), me) + Math.sin(T * 1.6 + i) * .008;
        const vib = ie <= 0 && t > 8.03 ? Math.min(1, (t - 8.03) / .11) * 9 : 0, vx = vib * Math.sin(T * 90 + i * 2), vy = vib * Math.cos(T * 83 + i);
        ctx.save(); ctx.translate(lerp(px + sh[0] * (m > 0 ? 1 : 0) + vx, 540, ie), lerp(py + idle + vy, FY, ie)); ctx.rotate(rot + ie * (i % 2 ? 1.6 : -1.6)); const sc = (1 + (1 - pf) * .35) * (1 - ie * .96); ctx.scale(sc, sc);
        tileDraw(ctx, d.k, w, h, d.col, clamp(pf * 5)); ctx.restore();
        const u = (t - d.t0) / .5; if (u > 0 && u < 1) { CL.ring(ctx, d.cx, d.cy, 250, u, d.col, 20); if (m === 0) CL.ring(ctx, px, py, 250, u, d.col, 20); for (let q = 0; q < 3; q++) CL.spark(ctx, d.cx + (hash(i * 7 + q) - .5) * 460 * ease.out(u), d.cy + (hash(i * 3 + q) - .5) * 200 * ease.out(u), 34 * (1 - u), t * 3 + q, '#fff'); }
      });
      // ---- Sport 5 hero
      { const pf = land(t, 7.47, .36);   // CUE 7.47 sport5-hero-slam
        if (pf > .002) {
          const idle = Math.sin(T * 2.2) * 8, vib = t > 8.03 ? Math.min(1, (t - 8.03) / .11) * 10 : 0, im = CL.logoImg('sport5');
          ctx.save(); ctx.translate(lerp(540 + vib * Math.sin(T * 95), 540, ie), lerp(720 + idle + vib * Math.cos(T * 88), FY, ie)); ctx.rotate((1 - pf) * -.4 + Math.sin(T * 1.5) * .012 + ie * 2); const sc = lerp(3.4, 1, pf) * (1 - ie * .96); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(pf * 5);
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, 620, [[0, 'rgba(90,150,255,.55)'], [1, 'rgba(90,150,255,0)']]); ctx.fillRect(-640, -640, 1280, 1280); ctx.globalCompositeOperation = 'source-over';
          CL.gel(ctx, 0, 0, 620, 760, { fill: '#2F6BFF', dark: '#1a1f7a', rim: '#ffffff', rimW: 8, shadow: 22, r: 120 });
          if (im) { const s2 = Math.min(620 * .76 / im.width, 760 * .76 / im.height), dw = im.width * s2, dh = im.height * s2; ctx.drawImage(im, -dw / 2, -dh / 2 + 6, dw, dh); }
          ctx.restore();
          const u = (t - 7.47) / .55; CL.ring(ctx, 540, 720, 560, u, '#ffffff', 36); CL.ring(ctx, 540, 720, 560, u - .12, C.cyan, 24);
        } }
      // ---- icons
      ICONS.forEach((d, i) => {
        const p0 = clamp((t - 7.58) / .6), pp = ease.outBack(p0), sc = CL.pop(t, 7.58, .4) * (1 - ie * .96); if (sc <= .002) return;
        const x = lerp(540, d.x, pp), y = lerp(720, d.y, pp) + Math.sin(T * 2.3 + d.ph) * 10 - Math.sin(p0 * Math.PI) * 60;
        ctx.save(); ctx.translate(lerp(x, 540, ie), lerp(y, FY, ie)); ctx.rotate((1 - p0) * d.sp * 1.4 + Math.sin(T * 1.7 + d.ph) * .08 + ie * 3); ctx.scale(sc, sc);
        if (d.kind === 'soccer') soccer(ctx, d.r); else if (d.kind === 'basket') basket(ctx, d.r); else trophy(ctx, d.r); ctx.restore();
      });
      const u2 = (t - 7.58) / .5; CL.ring(ctx, 540, 720, 900, u2, C.pink, 30);
      // ---- crowd
      crowd(ctx, t, T, ie * 420);
    }

    // ---- build-up: drumroll strobes + charging rings (CUE 8.03 buildup-start ... rolls into the slam)
    if (t >= 8.03 && t < 8.32) {
      const HITS = [8.03, 8.09, 8.15, 8.20, 8.24, 8.27, 8.29, 8.31];   // CUE 8.03 drumroll (snare hits accelerate)
      HITS.forEach((h, i) => { const u = t - h; if (u >= 0 && u < .09) { ctx.fillStyle = `rgba(255,255,255,${(.16 + i * .02) * (1 - u / .09)})`; ctx.fillRect(0, 0, W, H); } });
      [8.05, 8.13, 8.2].forEach((h, i) => { const u = (t - h) / .16; if (u > 0 && u < 1) { ctx.save(); ctx.strokeStyle = ['#ffd23f', C.pink, C.cyan][i]; ctx.globalAlpha = u; ctx.lineWidth = 16 * u + 4; ctx.beginPath(); ctx.arc(FX, FY, 900 * (1 - ease.out(u)) + 30, 0, TAU); ctx.stroke(); ctx.restore(); } });
      const dk = sm(8.16, 8.31, t) * .93; ctx.fillStyle = `rgba(2,3,18,${dk})`; ctx.fillRect(0, 0, W, H);
      const g = sm(8.18, 8.32, t); if (g > 0) { A.glow(ctx, FX, FY, 60 + 300 * g, '#ffffff', g); A.glow(ctx, FX, FY, 500 * g, '#ffb21e', .6 * g); }
    }

    // ---- CHARLTON
    if (t >= 8.18) {   // CUE 8.32 charlton-slam (impact + shockwave + lightning; the narrator turns trailer-voice, hold starts 8.85)
      const u = Math.max(0, t - 8.32), on = clamp((t - 8.18) / .05);
      // backdrop: warm glow, rotating god rays (idle life on the output clock), candy splash
      ctx.save(); ctx.globalAlpha = on; A.glow(ctx, FX, FY, 760, '#ff8a1f', .5); A.glow(ctx, FX, FY, 600, C.pink, .32);
      ctx.translate(FX, FY); ctx.rotate(T * .1); ctx.globalCompositeOperation = 'lighter'; const RN = 16;
      for (let i = 0; i < RN; i++) { ctx.save(); ctx.rotate(i / RN * TAU); ctx.fillStyle = A.linear(ctx, 0, 0, 0, -1300, [[0, 'rgba(255,225,150,.30)'], [1, 'rgba(255,225,150,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-56, -1300); ctx.lineTo(56, -1300); ctx.fill(); ctx.restore(); }
      ctx.restore();
      const sp = CL.spring(t, 8.32 - .05, .65); ctx.save(); ctx.globalAlpha = .95; CL.splash(ctx, FX, FY, 500 * (1 + .015 * Math.sin(T * 2.4)), sp, 3, [C.pink, C.orange, C.yellow, C.purple, C.cyan, C.lime]); ctx.restore();
      ctx.save(); ctx.fillStyle = A.radial(ctx, FX, FY, 0, 520, [[0, 'rgba(3,5,24,.62)'], [1, 'rgba(3,5,24,0)']]); ctx.globalAlpha = on; ctx.fillRect(FX - 540, FY - 540, 1080, 1080); ctx.restore();
      // the wordmark
      const pop = land(t, 8.32, .30), sc = lerp(2.8, 1, pop) * (1 + .012 * Math.sin(T * 2.6)), shk = CL.shake(t, 8.32, .55, 18);
      ctx.save(); ctx.translate(FX + shk[0], FY + shk[1]); ctx.rotate((1 - pop) * .05 + .004 * Math.sin(T * 1.7)); ctx.scale(sc, sc); ctx.globalAlpha = on;
      ctx.drawImage(WM, -CX, -CY);
      const cyc = (T % 2.3) / .9;
      if (cyc < 1 && t > 8.4) {   // gold shine sweep across both lines (idle life)
        const sx = SC.getContext('2d'); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, WMW, WMH);
        const bx = lerp(-160, 1160, ease.inOut(cyc)); sx.save(); sx.translate(bx, CY); sx.rotate(.35); sx.fillStyle = A.linear(sx, -80, 0, 80, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); sx.fillRect(-80, -700, 160, 1400); sx.restore();
        sx.globalCompositeOperation = 'destination-in'; sx.drawImage(MASK, 0, 0); sx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SC, -CX, -CY); ctx.globalCompositeOperation = 'source-over';
      }
      GLINTS.forEach(([gx, gy], i) => { const k = Math.pow(Math.max(0, Math.sin(T * 2.8 + i * 1.9)), 6); if (k > .02) CL.spark(ctx, gx - CX, gy - CY, 12 + 44 * k, T + i, '#fff'); });
      ctx.restore();
      // anamorphic flare streak
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fk = (1 - ease.out(clamp(u / .5))) * .6 + .38 + .1 * Math.sin(T * 3); ctx.globalAlpha = fk * on;
      ctx.fillStyle = A.radial(ctx, FX, FY + 95, 0, 620, [[0, 'rgba(255,240,200,.85)'], [.3, 'rgba(255,190,90,.35)'], [1, 'rgba(255,190,90,0)']]); ctx.save(); ctx.translate(FX, FY + 95); ctx.scale(1, .022); ctx.translate(-FX, -(FY + 95)); ctx.fillRect(FX - 640, FY + 95 - 640, 1280, 1280); ctx.restore(); ctx.restore();
      // shockwave rings + impact flash
      [0, .07, .15].forEach((d, i) => CL.ring(ctx, FX, FY, 1100, (u - d) / .6, ['#ffffff', C.yellow, C.pink][i], 46 - i * 10));
      if (u < .3) { ctx.fillStyle = `rgba(255,250,235,${.92 * Math.exp(-u * 14)})`; ctx.fillRect(0, 0, W, H); }
      // lightning: slam bolts, then idle crackle (output clock) between the letters
      if (u < .4) { const p = ease.out(clamp(u / .07)), a = 1 - u / .4; [[130, 430, 300, 790, 3], [950, 430, 790, 800, 4], [540, 400, 470, 720, 5], [90, 1040, 330, 960, 6], [990, 1050, 750, 980, 7]].forEach(([x0, y0, x1, y1, sd]) => CL.bolt(ctx, x0, y0, x1, y1, p, sd, { col: sd % 2 ? C.cyan : C.pink, lw: 15, alpha: a })); }
      const bq = Math.floor(T / .8), bph = T - bq * .8; if (bph < .13 && t > 8.5) { const a = 1 - bph / .13, sd = bq % 5, sx = 150 + hash(bq) * 780; CL.bolt(ctx, sx, 430, 200 + hash(bq + 3) * 680, 560 + hash(bq + 5) * 480, 1, 20 + sd, { col: bq % 2 ? C.cyan : '#ffd98a', lw: 10, alpha: a }); }
      // drifting embers / sparkles (output clock)
      for (let i = 0; i < 22; i++) { const sp2 = 40 + hash(i) * 70, x = (hash(i * 3.3) * 1.2 - .1) * W + Math.sin(T * .9 + i) * 30, y = 1500 - ((T * sp2 + hash(i * 7) * 1300) % 1300), k = .5 + .5 * Math.sin(T * 4 + i * 2); CL.spark(ctx, x, y, (5 + hash(i + 2) * 12) * (0.4 + k), T * 2 + i, i % 3 ? '#ffd98a' : '#ffffff'); }
    }
    if (wiping) ctx.restore();
  } });
})();
