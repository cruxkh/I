// s2_sports: "כל ערוצי הספורט כולל צ'רלטון"  (v 6.5 to 9.3, HOLD `cin` at v=8.85)   LANDSCAPE 1920x1080
// 6.50 liquid wipe covers s1 | 6.78 כל: stadium light rig ignites | 6.95 ערוצי: Sport 1..4 cards fly in as a 2x2 strip, 7.47 Sport 5 hero slams
// 7.58 הספורט: ball/trophy splash burst + crowd | 8.03 כולל: build-up (sweeping spotlights, drumroll, implosion)
// 8.32 צ'רלטון: CHARLTON wordmark SLAMS (shockwave + lightning), camera pushes in (main.js), hold = cinema trailer moment
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, W = 1920, H = 1080, TAU = A.TAU;
  const land = (t, t0, d = .36) => CL.pop(t, t0 - .37 * d, d);   // overshoot pop that CROSSES 1.0 exactly at t0 (impact on the word)
  const sm = (a, b, x) => A.smooth(a, b, x);
  const FX = 960, FY = 450;   // focus point of the wordmark (also HOLDFOC.cin): above the caption band at zoom 1, screen centre at 1.3x

  // ---------------------------------------------------------------- entry wipe (candy liquid sweeping left to right on a diagonal)
  const WIPE_COLS = [C.lime, C.cyan, C.blue];
  const WT0 = 6.50, WDUR = .27;
  function front(p, i) { const pp = clamp((p - i * .15) / .55), e = ease.inOut(pp); return { e, base: lerp(-700, W + 700, e), ph: i * 2 + p * 7 }; }
  function frontPath(ctx, f) {   // region to the LEFT of a wobbly diagonal edge sweeping right
    const amp = 90 * Math.sin(Math.PI * clamp(f.e)); ctx.beginPath(); ctx.moveTo(-60, -40);
    for (let y = -40; y <= H + 40; y += 30) ctx.lineTo(f.base + (y - 540) * .3 + Math.sin(y * .014 + f.ph) * amp, y);
    ctx.lineTo(-60, H + 40); ctx.closePath();
  }

  // ---------------------------------------------------------------- stadium light rig
  const LAMPS = [120, 360, 600, 840, 1080, 1320, 1560, 1800], BCOL = ['#e6f7ff', C.pink, '#fff1c2', C.cyan, '#e6f7ff', C.pink, '#fff1c2', C.cyan];
  const LON = i => 6.78 + i * .024;   // CUE 6.78 lights-on flash (lamps ignite left to right, 6.78 .. 6.95)
  function sweepPh(t) { const b = clamp((t - 8.03) / .29); return t * 1.1 + 9 * Math.pow(b, 2.2); }
  function beams(ctx, t, aim, pow) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    LAMPS.forEach((lx, i) => {
      const on = clamp((t - LON(i)) / .08); if (on <= 0) return;
      const ph = sweepPh(t) + i * 1.15, ly = 84;
      const tx = lerp(960 + (lx - 960) * .45 + Math.sin(ph) * 520, 960 + (lx - 960) * .08, aim), ty = lerp(820, FY, aim);
      const dx = tx - lx, dy = ty - ly, L = Math.hypot(dx, dy), th = Math.atan2(-dx, dy), hw = lerp(190, 150, aim);
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(th);
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, L * 1.15, [[0, A.hex(BCOL[i], .55 * on * pow)], [.5, A.hex(BCOL[i], .16 * on * pow)], [1, A.hex(BCOL[i], 0)]]);
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(hw, L * 1.15); ctx.lineTo(-hw, L * 1.15); ctx.closePath(); ctx.fill(); ctx.restore();
    });
    ctx.restore();
  }
  function rig(ctx, t, pow) {   // truss bar + lamp heads with blooming lenses
    ctx.save();
    ctx.fillStyle = '#0a0f45'; ctx.beginPath(); ctx.roundRect(20, 30, W - 40, 18, 9); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke();
    LAMPS.forEach((lx, i) => {
      const on = clamp((t - LON(i)) / .08); ctx.save(); ctx.translate(lx, 58);
      ctx.fillStyle = '#131a66'; ctx.beginPath(); ctx.roundRect(-46, -8, 92, 50, 16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = A.mixc('#1a2270', '#ffffff', on); ctx.beginPath(); ctx.arc(0, 26, 24, 0, TAU); ctx.fill();
      if (on > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 26, 0, 170 * on * pow, [[0, 'rgba(255,255,255,.95)'], [.25, A.hex(BCOL[i], .5)], [1, A.hex(BCOL[i], 0)]]); ctx.fillRect(-180, -150, 360, 360); }
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- crowd silhouettes (bottom, behind the caption band)
  function crowd(ctx, t, T, drop) {
    const rows = [{ y: 905, n: 19, s: .8, col: '#0b1150', dl: 0 }, { y: 990, n: 14, s: 1.05, col: '#050826', dl: .05 }];
    rows.forEach((r, ri) => {
      for (let i = 0; i < r.n; i++) {
        const seed = ri * 20 + i, x = (i + .5) * W / r.n + (hash(seed) - .5) * 50, rise = 1 - CL.pop(t, 7.58 + r.dl + hash(seed + 3) * .1 - .05, .45); if (rise >= 1) continue;
        const bob = Math.sin(T * (3 + hash(seed) * 2) + seed) * 6 * (1 - rise), y = r.y + rise * 300 + bob + drop, s = r.s * (.92 + hash(seed + 1) * .2), arms = hash(seed + 5) > .35, wv = Math.sin(T * 5 + seed * 1.7);
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        ctx.fillStyle = r.col; ctx.strokeStyle = r.col; ctx.lineCap = 'round';
        if (arms) { ctx.lineWidth = 26; [-1, 1].forEach(sd => { const hx = sd * (78 + wv * 12 * sd), hy = -60 - Math.abs(wv) * 8; ctx.beginPath(); ctx.moveTo(sd * 52, 105); ctx.lineTo(hx, hy + 30); ctx.stroke(); ctx.beginPath(); ctx.arc(hx, hy + 20, 17, 0, TAU); ctx.fill(); }); }
        ctx.beginPath(); ctx.ellipse(0, 190, 96, 130, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 45, 40, 0, TAU); ctx.fill();
        ctx.strokeStyle = ri ? 'rgba(255,80,170,.55)' : 'rgba(25,200,255,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 45, 40, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 190, 96, 130, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.restore();
        const q = CL.qs(T, 9); if (hash(q * 3.1 + seed * 1.7) > .93) CL.spark(ctx, x + (hash(q + seed) - .5) * 60, y + 10, 22 + hash(q + seed * 2) * 24, T, '#fff');   // camera flashes
      }
    });
  }

  // ---------------------------------------------------------------- sport icons (drawn in code)
  function pent(g, cx, cy, R, rot) { g.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.closePath(); g.fill(); }
  function soccer(ctx, r) {
    ctx.save(); ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.arc(8, 14, r, 0, TAU); ctx.fill();
    ctx.fillStyle = A.radial(ctx, -r * .3, -r * .35, r * .1, r * 1.15, [[0, '#ffffff'], [.6, '#e3e8ff'], [1, '#8792cc']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.fillStyle = '#0b1250'; pent(ctx, 0, 0, r * .36, 0);
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; pent(ctx, Math.cos(a) * r * .98, Math.sin(a) * r * .98, r * .34, a + Math.PI / 2 + Math.PI); ctx.strokeStyle = '#0b1250'; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); ctx.lineTo(Math.cos(a) * r * .66, Math.sin(a) * r * .66); ctx.stroke(); }
    ctx.restore(); ctx.lineWidth = r * .07; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .5, r * .26, r * .12, -.7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function basket(ctx, r) {
    ctx.save(); ctx.fillStyle = 'rgba(2,4,30,.4)'; ctx.beginPath(); ctx.arc(8, 14, r, 0, TAU); ctx.fill();
    ctx.fillStyle = A.radial(ctx, -r * .3, -r * .35, r * .1, r * 1.15, [[0, '#ffc27a'], [.35, '#ff8a1f'], [1, '#b13d00']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.strokeStyle = C.ink; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * .95, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.25, 0, r * .95, Math.PI - 1, Math.PI + 1); ctx.stroke(); ctx.restore();
    ctx.lineWidth = r * .07; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .5, r * .24, r * .11, -.7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function trophy(ctx, s) {
    ctx.save(); ctx.scale(s / 100, s / 100); const gold = A.linear(ctx, -60, 0, 60, 0, [[0, '#ffe98a'], [.45, '#ffb21e'], [1, '#c96a00']]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = C.ink; ctx.lineWidth = 22; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(sd * 58, -52, 30, sd < 0 ? Math.PI * .5 : -Math.PI * .5, sd < 0 ? Math.PI * 1.5 : Math.PI * .5, sd > 0); ctx.stroke(); });
    ctx.strokeStyle = gold; ctx.lineWidth = 10; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(sd * 58, -52, 30, sd < 0 ? Math.PI * .5 : -Math.PI * .5, sd < 0 ? Math.PI * 1.5 : Math.PI * .5, sd > 0); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-58, -100); ctx.lineTo(58, -100); ctx.bezierCurveTo(58, -10, 38, 30, 14, 42); ctx.lineTo(14, 66); ctx.lineTo(-14, 66); ctx.lineTo(-14, 42); ctx.bezierCurveTo(-38, 30, -58, -10, -58, -100); ctx.closePath();
    ctx.fillStyle = gold; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-50, 86, 100, 30, 10); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-30, 64, 60, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-32, -50, 9, 40, .1, 0, TAU); ctx.fill();
    ctx.restore(); CL.spark(ctx, 0, -30 * s / 100, s * .2, 0, '#fff');
  }

  // ---------------------------------------------------------------- CHARLTON wordmark (glossy gold + candy, built once)
  const HEB = "צ'רלטון", LAT = 'CHARLTON', WMW = 1300, WMH = 560, CX = 650, CY = 256, HY = 170, LY = 385, HW = 980, LW = 1000, HSY = .92, LSY = 1.0, WK = .94;
  let WM = null, MASK = null, SC = null;
  function hebPath(g, kind, lw, su) { g.save(); g.font = '900 200px Rubik'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; const k = HW / g.measureText(HEB).width; g.translate(CX, HY); g.scale(k, k * HSY); if (su) su(g); if (kind === 'stroke') { g.lineWidth = lw; g.strokeText(HEB, 0, 0); } else if (kind === 'fill') g.fillText(HEB, 0, 0); g.restore(); }
  function latPath(g, kind, lw, su) {
    g.save(); g.font = '900 200px Rubik'; g.direction = 'ltr'; g.textAlign = 'left'; g.textBaseline = 'middle'; const ws = [...LAT].map(c => g.measureText(c).width), tr = 34, tot = ws.reduce((a, b) => a + b, 0) + tr * (ws.length - 1), k = LW / tot;
    g.translate(CX - LW / 2, LY); g.scale(k, k * LSY); if (su) su(g); let x = 0; [...LAT].forEach((c, i) => { if (kind === 'stroke') { g.lineWidth = lw; g.strokeText(c, x, 0); } else if (kind === 'fill') g.fillText(c, x, 0); x += ws[i] + tr; }); g.restore();
  }
  function buildWM() {
    WM = CL.layer('s2_wm', WMW, WMH, g => {
      g.lineJoin = 'round'; g.lineCap = 'round'; g.miterLimit = 2;
      const lines = [[hebPath, HY, HSY, 34, 40], [latPath, LY, LSY, 30, 26]];
      // dark outline + purple/orange extrusion
      lines.forEach(([path, y, sy, EX, lw]) => {
        g.strokeStyle = '#050826'; for (let i = EX; i >= 0; i -= 2) { g.save(); g.translate(0, i); path(g, 'stroke', lw * 1.35); g.restore(); }
        for (let i = EX; i >= 1; i--) { g.save(); g.translate(0, i); g.strokeStyle = A.mixc('#c24a00', '#3a0f78', i / EX); path(g, 'stroke', lw); g.restore(); }
      });
      // gold bevel rim + face with gloss (face painted on a scratch canvas so gloss only lands on glyph pixels)
      const sc = document.createElement('canvas'); sc.width = WMW; sc.height = WMH; const s = sc.getContext('2d'); s.lineJoin = 'round';
      lines.forEach(([path, y, sy, EX, lw]) => {
        const hh = y === HY ? 88 : 95;   // local (font-space) half height for the vertical gradients
        path(g, 'stroke', lw * .75, q => { q.strokeStyle = A.linear(q, 0, -hh, 0, hh, [[0, '#fff4b8'], [.5, '#ff9d1a'], [1, '#8a3200']]); });
        path(s, 'fill', 0, q => { q.fillStyle = A.linear(q, 0, -hh, 0, hh, [[0, '#fff3a8'], [.25, '#ffd21f'], [.47, '#ff9a0a'], [.5, '#b84400'], [.6, '#ff8a10'], [1, '#ffd23f']]); });
        s.save(); s.globalCompositeOperation = 'source-atop';
        path(s, 'custom', 0, q => { q.fillStyle = A.linear(q, 0, -hh, 0, 0, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); q.fillRect(-1200, -hh, 2400, hh); q.fillStyle = A.linear(q, 0, hh * .2, 0, hh, [[0, 'rgba(255,46,147,0)'], [1, 'rgba(255,46,147,.22)']]); q.fillRect(-1200, hh * .2, 2400, hh * .8); });
        path(s, 'stroke', 5, q => { q.strokeStyle = 'rgba(255,255,255,.75)'; });
        s.restore();
      });
      g.drawImage(sc, 0, 0);
      // gold rules with diamond under the Latin line
      const ly = 505; g.fillStyle = A.linear(g, 100, 0, 1200, 0, [[0, 'rgba(255,214,90,0)'], [.2, '#ffd86a'], [.8, '#ffd86a'], [1, 'rgba(255,214,90,0)']]); g.fillRect(100, ly - 3, 1100, 6);
      g.fillStyle = '#fff1a8'; g.save(); g.translate(CX, ly); g.rotate(Math.PI / 4); g.fillRect(-14, -14, 28, 28); g.strokeStyle = '#050826'; g.lineWidth = 4; g.strokeRect(-14, -14, 28, 28); g.restore();
    });
    MASK = CL.layer('s2_wm_mask', WMW, WMH, g => { g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round'; hebPath(g, 'fill'); latPath(g, 'fill'); hebPath(g, 'stroke', 8); latPath(g, 'stroke', 8); });
    SC = document.createElement('canvas'); SC.width = WMW; SC.height = WMH;
  }
  const GLINTS = [[CX - 430, HY - 90], [CX - 90, HY - 110], [CX + 280, HY - 95], [CX + 470, HY - 20], [CX - 480, LY - 30], [CX - 130, LY - 45], [CX + 250, LY - 50], [CX + 500, LY + 10]];

  // ---------------------------------------------------------------- the scene
  const TILES = [   // 2x2 strip (grid) that springs to two side columns when Sport 5 slams
    { k: 'sport1', gx: 550, gy: 250, sx: 300, sy: 290, t0: 6.95, col: '#00f786', from: [-700, 250], r0: -.6 },   // CUE 6.95 sport1-pop
    { k: 'sport2', gx: 1370, gy: 250, sx: 1620, sy: 290, t0: 7.08, col: '#ff2a52', from: [2620, 250], r0: .6 },   // CUE 7.08 sport2-pop
    { k: 'sport3', gx: 550, gy: 490, sx: 300, sy: 570, t0: 7.21, col: '#ffe600', from: [-700, 490], r0: .6 },   // CUE 7.21 sport3-pop
    { k: 'sport4', gx: 1370, gy: 490, sx: 1620, sy: 570, t0: 7.34, col: '#00fff4', from: [2620, 490], r0: -.6 }, // CUE 7.34 sport4-pop
  ];
  const ICONS = [   // CUE 7.58 ball-trophy-burst
    { kind: 'soccer', x: 700, y: 705, r: 84, sp: 5, ph: 0 }, { kind: 'trophy', x: 1250, y: 690, r: 150, sp: 0, ph: 1.3 },
    { kind: 'basket', x: 640, y: 165, r: 66, sp: -6, ph: 2.1 }, { kind: 'soccer', x: 1290, y: 160, r: 56, sp: -4, ph: 3.2 },
  ];

  function tileDraw(ctx, k, w, h, col, alpha) {
    const im = CL.logoImg(k); ctx.save(); ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, w * .75, [[0, A.hex(col, .28)], [1, A.hex(col, 0)]]); ctx.fillRect(-w, -w * .6, w * 2, w * 1.2); ctx.globalCompositeOperation = 'source-over';
    CL.gel(ctx, 0, 0, w, h, { fill: '#1d2c96', dark: '#070b3a', rim: col, rimW: 6, shadow: 14, r: h * .3 });
    if (im) { const s = Math.min(w * .86 / im.width, h * .82 / im.height), dw = im.width * s, dh = im.height * s; ctx.globalAlpha *= .22; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(CL.silhouette(im, col), -dw * .52, -dh * .52, dw * 1.04, dh * 1.04); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha /= .22; ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh); }
    ctx.restore();
  }

  A.scene({ name: 's2_sports', start: 6.5, end: 9.3, draw(ctx, s) {
    const t = s.t, T = A.T; if (!WM) buildWM(); CL.HOLDFOC.cin = [FX, FY, 1.3];
    const wp = (t - WT0) / WDUR, wiping = wp < 1; if (wp <= 0) return;
    if (wiping) {   // entry wipe: candy bands ahead of the reveal edge
      WIPE_COLS.forEach((col, i) => { const f = front(wp, i); frontPath(ctx, f); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8; ctx.stroke(); });
      frontPath(ctx, front(wp, 3)); ctx.save(); ctx.clip();
    }
    const ie = ease.in(clamp((t - 8.14) / .16)), lit = sm(6.78, 6.9, t);   // ie = implosion 0..1 (8.14 -> 8.30)
    CL.bg(ctx, T, { tint: [C.blue, C.purple, C.cyan] });
    ctx.fillStyle = `rgba(3,5,24,${.82 * (1 - lit)})`; ctx.fillRect(0, 0, W, H);
    CL.twinkle(ctx, T, 0, 100, W, 700, 16, 5, ['#fff', C.cyan, C.yellow]);

    // ---- light rig + beams
    const aim = Math.max(ie * .9, sm(8.32, 8.55, t)); beams(ctx, t, aim, 1); rig(ctx, t, 1);
    if (t >= 6.78 && t < 7.05) { ctx.fillStyle = `rgba(255,255,255,${.85 * Math.exp(-(t - 6.78) * 18)})`; ctx.fillRect(0, 0, W, H); }   // the flash (CUE 6.78 light-flash)

    if (ie < 1) {
      // ---- ball/trophy burst (behind logos)
      if (t >= 7.5) {
        const p = CL.spring(t, 7.58 - .08, .75);   // CUE 7.58 ball-burst (splash + rings)
        ctx.save(); ctx.translate(lerp(960, FX, ie), lerp(440, FY, ie)); ctx.scale(1 - ie * .95, 1 - ie * .95); ctx.globalAlpha = .95; CL.splash(ctx, 0, 0, 760, p, 6, [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.purple]); ctx.restore();
      }
      // ---- tiles: 2x2 (big, readable) then they spring to the side columns when Sport 5 slams
      const m = clamp((t - 7.47) / .34), me = ease.outBack(m), sh = CL.shake(t, 7.47, .4, 12);
      TILES.forEach((d, i) => {
        const pf = land(t, d.t0, .34); if (pf <= 0.002) return;
        const cxp = lerp(d.gx, d.sx, me), cyp = lerp(d.gy, d.sy, me), w = lerp(780, 500, me), h = lerp(205, 150, me);
        const px = lerp(d.from[0], cxp, pf), py = lerp(d.from[1], cyp, pf), idle = Math.sin(T * 2 + i * 1.7) * 5, rot = (1 - pf) * d.r0 + lerp(0, (i % 2 ? .03 : -.03), me) + Math.sin(T * 1.6 + i) * .008;
        const vib = ie <= 0 && t > 8.03 ? Math.min(1, (t - 8.03) / .11) * 9 : 0, vx = vib * Math.sin(T * 90 + i * 2), vy = vib * Math.cos(T * 83 + i);
        ctx.save(); ctx.translate(lerp(px + sh[0] * (m > 0 ? 1 : 0) + vx, FX, ie), lerp(py + idle + vy, FY, ie)); ctx.rotate(rot + ie * (i % 2 ? 1.6 : -1.6)); const sc = (1 + (1 - pf) * .35) * (1 - ie * .96); ctx.scale(sc, sc);
        tileDraw(ctx, d.k, w, h, d.col, clamp(pf * 5)); ctx.restore();
        const u = (t - d.t0) / .5; if (u > 0 && u < 1) { CL.ring(ctx, d.gx, d.gy, 300, u, d.col, 20); for (let q = 0; q < 3; q++) CL.spark(ctx, d.gx + (hash(i * 7 + q) - .5) * 700 * ease.out(u), d.gy + (hash(i * 3 + q) - .5) * 240 * ease.out(u), 34 * (1 - u), t * 3 + q, '#fff'); }
      });
      // ---- Sport 5 hero
      { const pf = land(t, 7.47, .36);   // CUE 7.47 sport5-hero-slam
        if (pf > .002) {
          const idle = Math.sin(T * 2.2) * 7, vib = t > 8.03 ? Math.min(1, (t - 8.03) / .11) * 10 : 0, im = CL.logoImg('sport5');
          ctx.save(); ctx.translate(lerp(960 + vib * Math.sin(T * 95), FX, ie), lerp(440 + idle + vib * Math.cos(T * 88), FY, ie)); ctx.rotate((1 - pf) * -.4 + Math.sin(T * 1.5) * .012 + ie * 2); const sc = lerp(3.4, 1, pf) * (1 - ie * .96); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(pf * 5);
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, 560, [[0, 'rgba(90,150,255,.55)'], [1, 'rgba(90,150,255,0)']]); ctx.fillRect(-580, -580, 1160, 1160); ctx.globalCompositeOperation = 'source-over';
          CL.gel(ctx, 0, 0, 500, 610, { fill: '#2F6BFF', dark: '#1a1f7a', rim: '#ffffff', rimW: 8, shadow: 20, r: 100 });
          if (im) { const s2 = Math.min(500 * .76 / im.width, 610 * .78 / im.height), dw = im.width * s2, dh = im.height * s2; ctx.drawImage(im, -dw / 2, -dh / 2 + 6, dw, dh); }
          ctx.restore();
          const u = (t - 7.47) / .55; CL.ring(ctx, 960, 440, 800, u, '#ffffff', 36); CL.ring(ctx, 960, 440, 800, u - .12, C.cyan, 24);
        } }
      // ---- icons
      ICONS.forEach((d, i) => {
        const p0 = clamp((t - 7.58) / .6), pp = ease.outBack(p0), sc = CL.pop(t, 7.58, .4) * (1 - ie * .96); if (sc <= .002) return;
        const x = lerp(960, d.x, pp), y = lerp(440, d.y, pp) + Math.sin(T * 2.3 + d.ph) * 9 - Math.sin(p0 * Math.PI) * 50;
        ctx.save(); ctx.translate(lerp(x, FX, ie), lerp(y, FY, ie)); ctx.rotate((1 - p0) * d.sp * 1.4 + Math.sin(T * 1.7 + d.ph) * .08 + ie * 3); ctx.scale(sc, sc);
        if (d.kind === 'soccer') soccer(ctx, d.r); else if (d.kind === 'basket') basket(ctx, d.r); else trophy(ctx, d.r); ctx.restore();
      });
      const u2 = (t - 7.58) / .5; CL.ring(ctx, 960, 440, 1100, u2, C.pink, 30);
      // ---- crowd
      crowd(ctx, t, T, ie * 300);
    }

    // ---- build-up: drumroll strobes + charging rings (CUE 8.03 buildup-start ... rolls into the slam)
    if (t >= 8.03 && t < 8.32) {
      const HITS = [8.03, 8.09, 8.15, 8.20, 8.24, 8.27, 8.29, 8.31];   // CUE 8.03 drumroll (snare hits accelerate)
      HITS.forEach((h, i) => { const u = t - h; if (u >= 0 && u < .09) { ctx.fillStyle = `rgba(255,255,255,${(.16 + i * .02) * (1 - u / .09)})`; ctx.fillRect(0, 0, W, H); } });
      [8.05, 8.13, 8.2].forEach((h, i) => { const u = (t - h) / .16; if (u > 0 && u < 1) { ctx.save(); ctx.strokeStyle = ['#ffd23f', C.pink, C.cyan][i]; ctx.globalAlpha = u; ctx.lineWidth = 16 * u + 4; ctx.beginPath(); ctx.arc(FX, FY, 1100 * (1 - ease.out(u)) + 30, 0, TAU); ctx.stroke(); ctx.restore(); } });
      const dk = sm(8.16, 8.31, t) * .93; ctx.fillStyle = `rgba(2,3,18,${dk})`; ctx.fillRect(0, 0, W, H);
      const g = sm(8.18, 8.32, t); if (g > 0) { A.glow(ctx, FX, FY, 60 + 300 * g, '#ffffff', g); A.glow(ctx, FX, FY, 600 * g, '#ffb21e', .6 * g); }
    }

    // ---- CHARLTON
    if (t >= 8.23) {   // CUE 8.32 charlton-slam (impact + shockwave + lightning; the narrator turns trailer-voice, hold starts 8.85)
      const u = Math.max(0, t - 8.32), on = clamp((t - 8.24) / .03);
      // backdrop: warm glow, rotating god rays (idle life on the output clock), candy splash
      ctx.save(); ctx.globalAlpha = on; A.glow(ctx, FX, FY, 980, '#ff8a1f', .5); A.glow(ctx, FX, FY, 760, C.pink, .32);
      ctx.translate(FX, FY); ctx.rotate(T * .1); ctx.globalCompositeOperation = 'lighter'; const RN = 18;
      for (let i = 0; i < RN; i++) { ctx.save(); ctx.rotate(i / RN * TAU); ctx.fillStyle = A.linear(ctx, 0, 0, 0, -1500, [[0, 'rgba(255,225,150,.30)'], [1, 'rgba(255,225,150,0)']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -1500); ctx.lineTo(60, -1500); ctx.fill(); ctx.restore(); }
      ctx.restore();
      const sp = CL.spring(t, 8.32 - .05, .65); ctx.save(); ctx.globalAlpha = .95; CL.splash(ctx, FX, FY, 560 * (1 + .015 * Math.sin(T * 2.4)), sp, 3, [C.pink, C.orange, C.yellow, C.purple, C.cyan, C.lime]); ctx.restore();
      ctx.save(); ctx.translate(FX, FY); ctx.scale(1.7, 1); ctx.fillStyle = A.radial(ctx, 0, 0, 0, 420, [[0, 'rgba(3,5,24,.78)'], [.6, 'rgba(3,5,24,.5)'], [1, 'rgba(3,5,24,0)']]); ctx.globalAlpha = on; ctx.fillRect(-430, -430, 860, 860); ctx.restore();
      // the wordmark
      const pop = land(t, 8.32, .22), sc = lerp(3.0, 1, pop) * (1 + .012 * Math.sin(T * 2.6)), shk = CL.shake(t, 8.32, .55, 18);
      ctx.save(); ctx.translate(FX + shk[0], FY + shk[1]); ctx.rotate((1 - pop) * .05 + .004 * Math.sin(T * 1.7)); ctx.scale(sc * WK, sc * WK); ctx.globalAlpha = on;
      ctx.drawImage(WM, -CX, -CY);
      const cyc = (T % 2.3) / .9;
      if (cyc < 1 && t > 8.4) {   // gold shine sweep across both lines (idle life)
        const sx = SC.getContext('2d'); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, WMW, WMH);
        const bx = lerp(-160, WMW + 160, ease.inOut(cyc)); sx.save(); sx.translate(bx, CY); sx.rotate(.35); sx.fillStyle = A.linear(sx, -90, 0, 90, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); sx.fillRect(-90, -700, 180, 1400); sx.restore();
        sx.globalCompositeOperation = 'destination-in'; sx.drawImage(MASK, 0, 0); sx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SC, -CX, -CY); ctx.globalCompositeOperation = 'source-over';
      }
      GLINTS.forEach(([gx, gy], i) => { const k = Math.pow(Math.max(0, Math.sin(T * 2.8 + i * 1.9)), 6); if (k > .02) CL.spark(ctx, gx - CX, gy - CY, 12 + 46 * k, T + i, '#fff'); });
      ctx.restore();
      // anamorphic flare streak (full width)
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fk = (1 - ease.out(clamp(u / .5))) * .6 + .38 + .1 * Math.sin(T * 3); ctx.globalAlpha = fk * on; const fy = FY + 70;
      ctx.fillStyle = A.radial(ctx, FX, fy, 0, 900, [[0, 'rgba(255,240,200,.85)'], [.3, 'rgba(255,190,90,.35)'], [1, 'rgba(255,190,90,0)']]); ctx.save(); ctx.translate(FX, fy); ctx.scale(1, .02); ctx.translate(-FX, -fy); ctx.fillRect(FX - 950, fy - 950, 1900, 1900); ctx.restore(); ctx.restore();
      // shockwave rings + impact flash
      [0, .07, .15].forEach((d, i) => CL.ring(ctx, FX, FY, 1500, (u - d) / .6, ['#ffffff', C.yellow, C.pink][i], 46 - i * 10));
      if (t >= 8.32 && u < .3) { ctx.fillStyle = `rgba(255,250,235,${.92 * Math.exp(-u * 14)})`; ctx.fillRect(0, 0, W, H); }
      // lightning: slam bolts, then idle crackle (output clock) around the letters
      if (t >= 8.32 && u < .4) { const p = ease.out(clamp(u / .07)), a = 1 - u / .4; [[240, 180, 520, 400, 3], [1690, 190, 1420, 410, 4], [960, 160, 900, 330, 5], [200, 720, 500, 560, 6], [1730, 700, 1430, 570, 7]].forEach(([x0, y0, x1, y1, sd]) => CL.bolt(ctx, x0, y0, x1, y1, p, sd, { col: sd % 2 ? C.cyan : C.pink, lw: 15, alpha: a })); }
      const bq = Math.floor(T / .8), bph = T - bq * .8; if (bph < .13 && t > 8.5) { const a = 1 - bph / .13, sd = bq % 5, sx0 = 400 + hash(bq) * 1120; CL.bolt(ctx, sx0, 170, 420 + hash(bq + 3) * 1080, 330 + hash(bq + 5) * 250, 1, 20 + sd, { col: bq % 2 ? C.cyan : '#ffd98a', lw: 10, alpha: a }); }
      // drifting embers / sparkles (output clock)
      for (let i = 0; i < 26; i++) { const sp2 = 40 + hash(i) * 70, x = (hash(i * 3.3) * 1.2 - .1) * W + Math.sin(T * .9 + i) * 30, y = 1000 - ((T * sp2 + hash(i * 7) * 900) % 900), k = .5 + .5 * Math.sin(T * 4 + i * 2); CL.spark(ctx, x, y, (5 + hash(i + 2) * 12) * (0.4 + k), T * 2 + i, i % 3 ? '#ffd98a' : '#ffffff'); }
    }
    if (wiping) ctx.restore();
  } });
})();
