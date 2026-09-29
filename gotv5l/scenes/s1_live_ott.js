// S1: LIVE + STREAMERS (4.8 to 9.4). Israeli live TV collage, then Netflix / Disney+ / Apple TV logo slaps.
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const C = CL.C, W = 1080, H = 1920;
  const tq = t => CL.q(t + 1 / 24, 12);                       // stepped clock, half frame early so pops land on the word

  // ---- torn-edge reveal region. mode 'up' (sheet from the bottom) or 'left' (sheet from the left)
  const edgePath = (ctx, mode, pos, seed) => {
    ctx.beginPath();
    if (mode === 'up') {
      ctx.moveTo(-60, H + 60);
      for (let x = -60; x <= W + 60; x += 30) ctx.lineTo(x, pos + (hash(Math.floor(x / 30) + seed) - .5) * 40);
      ctx.lineTo(W + 60, H + 60);
    } else {
      ctx.moveTo(-60, -60);
      for (let y = -60; y <= H + 60; y += 30) ctx.lineTo(pos + (hash(Math.floor(y / 30) + seed) - .5) * 40, y);
      ctx.lineTo(-60, H + 60);
    }
    ctx.closePath();
  };
  // draws strip + shadow, then clips to the region. caller must ctx.save() before
  const revealClip = (ctx, mode, pos, seed) => {
    const d = mode === 'up' ? -1 : 1;
    ctx.fillStyle = 'rgba(40,20,0,.3)'; edgePath(ctx, mode, pos + d * 30, seed + 9); ctx.fill();
    ctx.fillStyle = C.white; edgePath(ctx, mode, pos + d * 14, seed + 3); ctx.fill();
    edgePath(ctx, mode, pos, seed); ctx.clip();
  };

  // ---- Israel outline (lon,lat) -> paper map
  const ISR = [[35.1, 33.09], [35.4, 33.27], [35.63, 33.25], [35.85, 32.95], [35.55, 32.4], [35.55, 31.75], [35.45, 31.5], [35.4, 31.2], [35.15, 30.6], [35.0, 30.0], [34.9, 29.5], [34.7, 29.55], [34.4, 30.6], [34.27, 31.25], [34.55, 31.6], [34.75, 32.05], [34.95, 32.5], [35.0, 32.8]];
  const mapPath = (ctx, k, ox = 0, oy = 0) => { ctx.beginPath(); ISR.forEach(([lo, la], i) => { const x = (lo - 35.0) * k + ox, y = (33.4 - la) * k + oy - 1.95 * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
  const drawMap = (ctx, cx, cy, k, rot, t) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,10,60,.35)'; mapPath(ctx, k, 16, 20); ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 34; mapPath(ctx, k); ctx.stroke();
    ctx.fillStyle = C.cream; mapPath(ctx, k); ctx.fill();
    ctx.save(); mapPath(ctx, k); ctx.clip(); CL.halftone(ctx, -400, -700, 800, 1400, C.kraftDk, 26, .5, { alpha: .35, fade: 'b' }); ctx.restore();
    ctx.restore();
  };

  // ---- Israeli flag paper scrap
  const flag = (ctx, cx, cy, w, rot, seed) => {
    const h = w * .7;
    CL.scrap(ctx, cx, cy, w, h, { fill: C.white, rot, seed, draw: (g, ww, hh) => {
      g.fillStyle = C.blue; g.fillRect(-ww / 2, -hh / 2 + hh * .1, ww, hh * .13); g.fillRect(-ww / 2, hh / 2 - hh * .23, ww, hh * .13);
      g.strokeStyle = C.blue; g.lineWidth = hh * .045; g.lineJoin = 'miter'; const R = hh * .19;
      for (const s of [1, -1]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 * s + i * A.TAU / 3; g.lineTo(Math.cos(a) * R, Math.sin(a) * R); } g.closePath(); g.stroke(); }
    } });
    CL.tape(ctx, cx - w * .3, cy - h * .52, -.3 + rot, 120, 40);
  };

  // ---- logo cards. spec: key, crop [sx,sy,sw,sh] optional
  const logoDraw = (ctx, key, lw, crop) => {
    const im = CL.logoImg(key); if (!im) return { w: lw, h: lw * .4 };
    const [sx, sy, sw, sh] = crop || [0, 0, im.width, im.height], lh = lw * sh / sw;
    ctx.drawImage(im, sx, sy, sw, sh, -lw / 2, -lh / 2, lw, lh); return { w: lw, h: lh };
  };
  const logoLh = (key, lw, crop) => { const im = CL.logoImg(key); if (!im) return lw * .4; const [, , sw, sh] = crop || [0, 0, im.width, im.height]; return lw * sh / sw; };
  const card = (ctx, key, cx, cy, lw, o = {}) => {
    const lh = logoLh(key, lw, o.crop), pw = o.padx ?? 46, ph = o.pady ?? 40, w = lw + pw * 2, h = lh + ph * 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.rot || 0); ctx.scale(o.scale ?? 1, o.scaleY ?? o.scale ?? 1); ctx.globalAlpha *= o.alpha ?? 1;
    CL.scrap(ctx, 0, 0, w, h, { fill: o.bg || C.white, seed: o.seed || 3, shadow: o.shadow ?? 12 });
    logoDraw(ctx, key, lw, o.crop);
    if (o.tape !== false && !o.noTape) { CL.tape(ctx, -w * .34, -h / 2 - 2, -.35, 120, 40); CL.tape(ctx, w * .36, h / 2 + 2, -.3, 110, 38); }
    ctx.restore(); return { w, h };
  };

  // ---- fly in: returns {x,y,rot,s} or null before t0
  const fly = (t, t0, dur, fx, fy, tx, ty, r0, r1) => {
    const q = tq(t); if (q < t0 - 1e-6) return null; const u = clamp((q - t0) / dur), e = ease.outBack(u);
    const j = CL.j(t, t0 * 9, 5);
    const settle = u >= 1;
    return { x: lerp(fx, tx, e) + (settle ? j[0] * .5 : 0), y: lerp(fy, ty, e) + (settle ? j[1] * .5 : 0), rot: lerp(r0, r1, e) + (settle ? j[2] * 1.5 : 0), u };
  };

  // ---- TV screen content: paper pitch with a bouncing ball
  const screen = (t) => (g, sw, sh) => {
    g.fillStyle = '#2FA35F'; g.fillRect(0, 0, sw, sh);
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#2A9A58' : '#36AE68'; g.fillRect(0, i * sh / 7, sw, sh / 7); }
    g.strokeStyle = C.white; g.lineWidth = 8; g.strokeRect(24, 24, sw - 48, sh - 48); g.beginPath(); g.moveTo(sw / 2, 24); g.lineTo(sw / 2, sh - 24); g.stroke();
    g.beginPath(); g.arc(sw / 2, sh / 2, 90, 0, A.TAU); g.stroke();
    const q = CL.q(t, 12), bx = sw / 2 + Math.sin(q * 3.1) * sw * .3, by = sh * .62 - Math.abs(Math.sin(q * 5.3)) * sh * .38;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(bx + 10, sh * .8 + 6, 44, 12, 0, 0, A.TAU); g.fill();
    g.fillStyle = C.white; g.beginPath(); g.arc(bx, by, 40, 0, A.TAU); g.fill(); g.lineWidth = 7; g.strokeStyle = C.ink; g.stroke();
    g.fillStyle = C.ink; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * A.TAU + q; g.lineTo(bx + Math.cos(a) * 18, by + Math.sin(a) * 18); } g.fill();
    // scoreboard chip
    g.fillStyle = C.ink; g.fillRect(sw - 250, 42, 210, 62); g.fillStyle = C.yellow; g.font = '900 44px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText('2 : 1', sw - 145, 75);
  };

  const CH = [
    { key: 'kan11', t0: 5.16, x: 235, y: 335, r: -.09, lw: 340, bg: '#0B1F5C', from: [-300, 300] },
    { key: 'keshet12', t0: 5.32, x: 835, y: 345, r: .08, lw: 250, bg: C.white, from: [1400, 250] },
    { key: 'reshet13', t0: 5.5, x: 165, y: 1140, r: .07, lw: 260, bg: C.white, crop: [107, 99, 298, 319], from: [-300, 1500] },
    { key: 'ch14', t0: 5.68, x: 905, y: 1130, r: -.07, lw: 280, bg: C.cream, from: [1400, 1500] },
    { key: 'i24', t0: 5.88, x: 540, y: 1290, r: .03, lw: 340, bg: C.ink, from: [540, 2200] },
  ];

  // ---------------------------------------------------------------- phase A: LIVE
  const drawA = (ctx, t) => {
    CL.paper(ctx, 'blue', { dots: C.yellow, dotSize: 36, dotAlpha: .22, dotFade: 'b' });
    // map behind
    const mp = CL.pop(tq(t), 4.95, .3);
    if (false && mp) { const j = CL.j(t, 1, 4); drawMap(ctx, 400 + j[0], 830 + j[1], 300 * mp, -.08 + j[2], t); }
    // flag on 'בישראל'
    const f = fly(t, 5.86, .24, 540, -300, 540, 215, -.5, .04);
    if (f) flag(ctx, f.x, f.y, 400, f.rot, 4);
    // TV drop
    const tv = fly(t, 5.0, .3, 540, -600, 540, 830, .12, -.025);
    if (tv) {
      ctx.save(); ctx.translate(tv.x, tv.y); ctx.rotate(tv.rot);
      // antenna
      ctx.strokeStyle = C.ink; ctx.lineWidth = 14; ctx.lineCap = 'round';
      const wob = Math.sin(CL.q(t, 12) * 2) * 4;
      ctx.beginPath(); ctx.moveTo(-40, -290); ctx.lineTo(-170 + wob, -430); ctx.moveTo(40, -290); ctx.lineTo(150 - wob, -440); ctx.stroke();
      ctx.fillStyle = C.red; for (const p of [[-170 + wob, -430], [150 - wob, -440]]) { ctx.beginPath(); ctx.arc(p[0], p[1], 18, 0, A.TAU); ctx.fill(); ctx.stroke(); }
      CL.tv(ctx, 0, 0, 740, 580, { body: C.orange, draw: screen(t), chin: 46 });
      // knobs
      ctx.fillStyle = C.yellow; ctx.lineWidth = 6; for (const x of [250, 300]) { ctx.beginPath(); ctx.arc(x, 250, 20, 0, A.TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      // LIVE tag: slaps on 5.06, blinks at 12 fps (3 frame period)
      const lt = tq(t);
      if (lt >= 5.05) {
        const sc = CL.pop(lt, 5.05, .3) || 1, on = Math.floor(lt * 12 / 3) % 2 === 0, j = CL.j(t, 5, 3);
        ctx.save(); ctx.translate(255 + j[0], 555 + j[1]); ctx.rotate(-.1 + j[2]); ctx.scale(sc, sc);
        CL.scrap(ctx, 0, 0, 290, 118, { fill: on ? C.red : '#B3160E', seed: 8, rough: 4 });
        ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(-92, 0, on ? 20 : 8, 0, A.TAU); ctx.fill();
        ctx.font = '900 76px Rubik'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText('LIVE', 30, 5);
        CL.tape(ctx, 110, -62, .5, 100, 36);
        ctx.restore();
      }
    }
    // channel cards flying in on the words
    for (const c of CH) {
      const p = fly(t, c.t0, .26, c.from[0], c.from[1], c.x, c.y, c.r - .6, c.r);
      if (!p) continue;
      card(ctx, c.key, p.x, p.y, c.lw, { rot: p.rot, bg: c.bg, crop: c.crop, seed: c.t0 * 7, shadow: p.u >= 1 ? 12 : 30 });
      if (p.u >= 1 && tq(t) - c.t0 < .5) CL.sparks(ctx, p.x, p.y, 240, 300, 8, t, { lw: 7, color: C.yellow });
    }
    // marker: circle around the LIVE tag after it lands, arrow to screen
    if (t > 5.4) CL.arrow(ctx, 120, 760, 190, 640, inv(5.4, 5.65, t), { color: C.yellow, lw: 10, bend: -40 });
  };

  // ---------------------------------------------------------------- phase B/C
  const bgB = ctx => CL.paper(ctx, 'red', { dots: C.ink, dotSize: 40, dotAlpha: .13, dotFade: 'radial' });

  const NFX_T = 7.02;
  const drawNetflix = (ctx, t) => {
    const q = tq(t); if (q < NFX_T - 1e-6) return;
    const k = Math.floor((t + 1 / 60 - (NFX_T - 1 / 30)) * 30);              // 30 fps frames since slap start
    const S = [2.6, 1.7, 1.0, .93, 1.05, 1.0][clamp(k, 0, 5)];
    const jn = CL.j(t, 21, 5);
    const moveU = inv(8.02, 8.22, q), E = ease.inOut(Math.floor(moveU * 3) / 3);          // stepped 3-frame slide up
    const cx = lerp(540, 540, E), cy = lerp(800, 250, E), scl = lerp(1, .58, E), rot = lerp(-.05, -.06, E);
    const sh = k < 2 ? 40 : 12;
    ctx.save(); ctx.translate(CL.shake(t, NFX_T + .03, .5, 20)[0], CL.shake(t, NFX_T + .03, .5, 20)[1]);
    ctx.translate(cx + (k > 5 ? jn[0] * .5 : 0), cy + (k > 5 ? jn[1] * .5 : 0)); ctx.rotate(rot + (k > 5 ? jn[2] : 0)); ctx.scale(S * scl, S * scl);
    // red under-scrap (the red paper scrap the logo is slapped on), black card on top so the red logo reads
    CL.scrap(ctx, 6, 8, 1010, 560, { fill: C.red, seed: 31, rot: .04, shadow: sh, rough: 8 });
    CL.scrap(ctx, 0, 0, 900, 400, { fill: C.ink, seed: 33, rot: -.03, shadow: 0, border: 1, rough: 5 });
    ctx.save(); ctx.rotate(-.03); logoDraw(ctx, 'netflix', 760); ctx.restore();
    // paper fold: bottom-right corner curls up after slap
    const fp = inv(7.5, 7.75, q);
    if (fp > 0) {
      const f = 70 + 60 * ease.out(fp);
      ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.beginPath(); ctx.moveTo(505 - f + 8, 280 + 10); ctx.lineTo(505 + 8, 280 - f + 10); ctx.lineTo(505 - f * .55 + 8, 280 - f * .55 + 10); ctx.fill();
      ctx.fillStyle = C.cream; ctx.beginPath(); ctx.moveTo(505 - f, 280); ctx.lineTo(505, 280 - f); ctx.lineTo(505 - f * .05, 280); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d8ccb0'; ctx.lineWidth = 3; ctx.stroke();
    }
    // tape strips: rip off at 7.85
    const tr = inv(7.85, 8.02, q);
    if (tr < 1) {
      ctx.save(); ctx.translate(-380, -230 - tr * 40); ctx.rotate(-.5 - tr * 1.6); ctx.globalAlpha = 1 - tr; CL.tape(ctx, 0, 0, 0, 200, 56); ctx.restore();
      ctx.save(); ctx.translate(390, -220 - tr * 60); ctx.rotate(.5 + tr * 1.3); ctx.globalAlpha = 1 - tr; CL.tape(ctx, 0, 0, 0, 200, 56); ctx.restore();
    }
    ctx.restore();
    // stamp-thump ring + dust
    if (q >= NFX_T && q < NFX_T + .35 && !(moveU > 0)) {
      const u = (q - NFX_T) / .35; ctx.save(); ctx.globalAlpha = 1 - u * .6;
      CL.sparks(ctx, 540, 800, 520 + u * 120, 640 + u * 240, 16, t, { color: C.ink, lw: 12 });
      CL.sparks(ctx, 540, 800, 500 + u * 100, 600 + u * 200, 12, t + .05, { color: C.yellow, lw: 8 }); ctx.restore();
    }
  };

  const confetti = (ctx, t, t0, cx, cy, n, seed) => {
    const q = CL.q(t, 12); if (q < t0 - 1e-6) return; const u = q - t0, r = rng(seed);
    const cols = [C.yellow, C.white, C.pink, C.orange, C.green];
    for (let i = 0; i < n; i++) {
      const a = r() * A.TAU, sp = 300 + r() * 900, R = 16 + r() * 22, rot0 = r() * 6, spin = (r() - .5) * 14, col = cols[i % cols.length], kind = i % 3;
      const drag = 1 - Math.exp(-u * 2.6);
      const x = cx + Math.cos(a) * sp * drag * .75, y = cy + Math.sin(a) * sp * drag * .75 + 520 * u * u;
      if (y > H + 60 || x < -60 || x > W + 60) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot0 + spin * u);
      if (kind === 0) CL.star(ctx, 0, 0, R, 5, { fill: col, lw: 4 });
      else { ctx.fillStyle = 'rgba(40,20,0,.28)'; ctx.fillRect(-R * .6 + 4, -R * .35 + 5, R * 1.2, R * .7); ctx.fillStyle = col; ctx.fillRect(-R * .6, -R * .35, R * 1.2, R * .7); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeRect(-R * .6, -R * .35, R * 1.2, R * .7); }
      ctx.restore();
    }
  };

  const DIS_T = 8.16, APL_T = 8.4;
  const drawDisney = (ctx, t) => {
    const q = tq(t); if (q < DIS_T - 1e-6) return;
    const p = fly(t, DIS_T, .24, 1600, 640, 540, 700, .5, .03);
    const j = CL.j(t, 40, 5), landed = p.u >= 1, k = Math.floor((q - DIS_T) * 12);
    const bump = [1.06, 1.12, .96, 1.03][clamp(k - 3, 0, 3)] || 1;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); const sc = landed ? (k < 7 ? bump : 1) : 1; ctx.scale(sc, sc);
    CL.scrap(ctx, 0, 0, 960, 520, { fill: C.blue, seed: 41, shadow: landed ? 12 : 34, rough: 8 });
    ctx.save(); CL.tornPath(ctx, -480, -260, 960, 520, { seed: 41, rough: 8 }); ctx.clip(); CL.halftone(ctx, -480, -260, 960, 520, '#5B84FF', 34, .5, { alpha: .6, fade: 'l' }); ctx.restore();
    ctx.save(); ctx.translate(0, 8); logoDraw(ctx, 'disney', 740); ctx.restore();
    // paper fold: top-left corner turns over
    const fp = inv(8.6, 8.85, q); if (fp > 0) { const f = 60 + 70 * ease.out(fp); ctx.fillStyle = 'rgba(0,0,40,.3)'; ctx.beginPath(); ctx.moveTo(-480 + f + 8, -260 + 10); ctx.lineTo(-480 + 8, -260 + f + 10); ctx.lineTo(-480 + f * .55 + 8, -260 + f * .55 + 10); ctx.fill(); ctx.fillStyle = C.cream; ctx.beginPath(); ctx.moveTo(-480 + f, -260); ctx.lineTo(-480, -260 + f); ctx.lineTo(-480 + f * .05, -260); ctx.closePath(); ctx.fill(); }
    CL.tape(ctx, -360, -262, -.3, 130, 42); CL.tape(ctx, 380, 262, -.35, 130, 42);
    ctx.restore();
    if (landed) confetti(ctx, t, DIS_T + .2, 540, 700, 34, 77);
    if (landed && q < DIS_T + .55) CL.sparks(ctx, 540, 700, 500, 620, 14, t, { color: C.yellow, lw: 9 });
  };

  const drawApple = (ctx, t) => {
    const q = tq(t); if (q < APL_T - 1e-6) return;
    const u = clamp((q - APL_T) / .3), flipX = Math.abs(Math.cos((1 - ease.outBack(u)) * Math.PI / 2 * 1.0)); // card flips up from the bottom
    const rise = lerp(420, 0, ease.out(u)), landed = u >= 1, j = CL.j(t, 50, 5), back = u < .34;
    ctx.save(); ctx.translate(540 + (landed ? j[0] * .5 : 0), 1170 + rise + (landed ? j[1] * .5 : 0)); ctx.rotate(lerp(.5, -.045, ease.out(u)) + (landed ? j[2] : 0));
    ctx.scale(Math.max(.05, flipX), 1);
    // white scrap, and a black paper patch on it (white logo needs dark ground)
    CL.scrap(ctx, 0, 0, 940, 420, { fill: C.white, seed: 51, shadow: landed ? 12 : 30, rough: 7, border: 0 });
    if (back) { ctx.fillStyle = '#e8dcc0'; CL.tornPath(ctx, -470, -210, 940, 420, { seed: 51, rough: 7 }); ctx.fill(); }
    else {
      CL.scrap(ctx, 0, 6, 800, 300, { fill: C.ink, seed: 53, rot: .02, shadow: 0, border: 0, rough: 5 });
      ctx.save(); ctx.rotate(.02); logoDraw(ctx, 'appletv', 620); ctx.restore();
      CL.tape(ctx, -400, -200, -.4, 130, 42); CL.tape(ctx, 410, 200, -.3, 130, 42);
    }
    ctx.restore();
    if (landed && q < APL_T + .5) CL.sparks(ctx, 540, 1170, 470, 560, 12, t, { color: C.white, lw: 8 });
  };

  A.scene({ name: 's1_live_ott', start: 4.8, end: 9.4, draw: (ctx, s) => {
    const t = s.t, q = tq(t);
    // entry: sheet of paper slides up from the bottom with a torn edge (4.8 to 5.05)
    const ew = inv(4.8, 5.03, q), entering = q < 5.05;
    ctx.save();
    if (entering) revealClip(ctx, 'up', lerp(H + 60, -60, ease.out(Math.floor(ew * 6) / 6)), 11);
    // phase A / B switch: red paper wipes in from the left (6.55 to 6.85)
    if (q < 6.86) drawA(ctx, t);
    if (q >= 6.55) {
      const wp = inv(6.55, 6.82, q);
      ctx.save();
      if (wp < 1) revealClip(ctx, 'left', lerp(-60, W + 60, ease.inOut(Math.floor(wp * 5) / 5)), 23);
      bgB(ctx);
      ctx.restore();
    }
    drawNetflix(ctx, t);
    drawDisney(ctx, t);
    drawApple(ctx, t);
    ctx.restore();
  } });
})();
// CUE 5.00 tv-drop  CUE 5.05 live-tag  CUE 5.16 cards fly in (5.16 5.32 5.5 5.68 5.88)  CUE 6.55 red wipe
// CUE 7.02 stamp netflix  CUE 8.16 disney slap + confetti  CUE 8.40 appletv flip
