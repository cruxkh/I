// ============================================================================
// kits/props.js · v2 SHARED PROPS: backgammon (shesh-besh), competitor brand packets, TV bugs, switch overlay,
// queue sign. Pure functions of their options (deterministic, no Math.random / Date, no state between frames).
// Every draw fn does save()/restore(). Static parts are cached with A.layer at a resolution picked from the
// on-screen scale (current ctx transform included), so they stay crisp under camera zoom.
// On-screen text follows the bible text rule: no em/en dashes anywhere.
//
// ---------------------------------------------------------------------------------------------------
// A.drawBackgammon(ctx, x, y, s, o)      (x,y) = bottom centre (table contact).  s = scale.
//   o.mode     'case'  closed wooden case (walnut, mother-of-pearl marquetry star, brass latches, leather handle),
//                      ~180 px wide, ~155 px tall incl. handle at s=1.
//              'board' open board lying on a table, 3/4 top-down, ~420 px wide, ~170 px tall at s=1.   default 'board'
//   o.t        time (s): tiny idle life (dice settle wobble, checker gloss).                                         0
//   --- case only ---
//   o.anchor   'bottom' (x,y = bottom centre) | 'handle' (x,y = handle grip; use for carrying: pass the hand pos)  'bottom'
//   o.rot      rotation (rad) about the anchor (swing it when carried)                                                0
//   o.shadow   0..1 soft contact shadow under the case                                                                0
//   --- board only ---
//   o.dice     0..1 roll animation: 0 = dice not on the board yet, (0,1) = thrown in from the near-right edge,
//              tumbling + bouncing, 1 = landed. undefined = dice resting on the board.                         undefined
//   o.diceVals [a,b] values shown when landed (1..6)                                                          [4, 2]
//   o.move     0..1 one checker hops (arc + squash on landing) from point o.from to point o.to.
//              0/undefined = still on o.from, 1 = sitting on o.to.                                                   0
//   o.from / o.to  point numbers 1..24 (1-6 near-right, 7-12 near-left, 13-18 far-left, 19-24 far-right)   13 / 9
//   o.position {light:{point:count,...}, dark:{...}} override the mid-game layout (15 checkers each by default)
//   o.shadow   0..1 contact shadow under the board                                                                    1
//   A.backgammonPoint(x, y, s, point, i) -> [sx, sy] screen position of the i-th checker slot on a point (for hands).
//
// A.drawBrandPacket(ctx, x, y, scale, o)   competitor packet, ~100 px tall at 1 (bottom centre = feet). Same family
//   look as A.drawPacket (chubby envelope cube, outline, cel shade, glow, eyes, lipsync) but dull and desaturated so
//   gold Bit pops next to them, with stubby arms and a paper brand tag on the belly (plain type, no logos).
//   o.brand    'ILVIP' (dusty mauve, tarnished paper crown) | 'EMBY' (sage, droopy nightcap)
//              | 'LAGTV' (slate, rabbit-ear antenna) | 'LOADING+' (beige, hourglass)                            'ILVIP'
//   o.who      speaker id for lipsync                                                                    o.brand
//   o.mood     'grumpy' (hands on hips, lids + angry brows, frown) | 'sleepy' (heavy lids, bags, slow yawns, z's)
//              | 'shock' (white eyes, arms up, '!') | 'panting' (leans, tongue out, sweat, fast breathing)   'grumpy'
//   o.t        time (s)                                                                                           0
//   o.mouth    0..1 mouth open. default A.mouth(o.who || brand, t). Mood adds a minimum (shock/panting/sleepy).
//   o.yawn     0..1 sleepy yawn override (default: automatic slow yawns for 'sleepy', 0 otherwise)
//   o.spinner  0..1 loading spinner bubble floating over its head (pops in with the value)                         0
//   o.spinnerEyes 0..1 its pupils turn into little spinning loading rings ("still... buffering")                   0
//   o.sign     0..1 held picket sign 'ממתין בתור' (rises in with overshoot as it goes 0 -> 1)                       0
//   o.look     [dx,dy] -1..1 eye direction (default: mood based idle drift)
//   o.flip     face left: mirrors look, lean and which hand holds the sign (tag text always stays readable)   false
//   o.vel      [vx,vy] px/s -> lean + stretch                                                                [0,0]
//   o.rot      extra rotation (rad, pivot at the feet)          o.squash  extra squash (+ flatter)                   0
//   o.hop      lift the whole packet (local px)                 o.shadow  0..1 ground contact shadow                 0
//   o.glow     0..2 dull body glow                                                                              0.3
//   o.blink    0..1 force blink                                 o.sweat   0..1 override sweat drops
//   o.noZ      true hides the sleepy z's                        o.arms    'hips'|'hang'|'up'|'knees' override
//   A.BRAND_COLORS[brand] = {c, d, ink} body colours for scene use (dust puffs, trails...).
//
// A.drawGOTVBug(ctx, x, y, s, o)          GOTV channel bug, same design as the end card wordmark (yellow italic
//   extruded letters, blue outline, the O is a gold ring with a blue disc and play triangle). (x,y) = centre,
//   ~150 x 48 px at s=1.  o.alpha (1),  o.t + o.shine (0..1 sweep of a light glint across it, default none),
//   o.live true adds a small red 'LIVE' pill under it.
//
// A.drawOldProviderBug(ctx, x, y, s, o)   dull grey generic channel bug 'הספק הישן' with a tired little TV icon.
//   (x,y) = centre, ~170 x 46 px at s=1.  o.alpha (0.85).
//
// A.drawSwitchOverlay(ctx, x, y, w, h, t, o)   TV UI overlay clipped to the screen rect (x,y = top-left, like
//   A.drawTVScreen). o.p 0..1:  0-0.1 screen dims, 0.04-0.16 card pops in ('עובר ל-GOTV...' + mini GOTV bug),
//   0.14-0.78 progress bar fills (smooth, never stalls), 0.8+ big gold check '✓ GOTV פעיל' with gold burst + flash.
//   o.alpha (1) fades the whole overlay (use it to clear the screen afterwards).
//
// A.drawQueueSign(ctx, x, y, s, o)        fluorescent bureaucratic lightbox 'ממתין בתור · WAITING IN LINE' with a red
//   LED ticket counter. (x,y) = CENTRE of the board, ~320 x 104 px at s=1; eyelets at (±110, -44)*s for the
//   scene's own ropes/chains.  o.t,  o.ticket (number shown, default 347),  o.flicker 0..1 fluorescent flicker (0.5),
//   o.hang px of short chains drawn above the eyelets (0 = none),  o.alpha (1).
// ============================================================================
(() => {
  const TAU = Math.PI * 2;
  const OL = () => A.OUTLINE;
  const frac = v => v - Math.floor(v);
  const clamp = A.clamp;

  // ---------------------------------------------------------------- helpers
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
  function cel(ctx, pts, dx, dy, fillc, alpha = 1) {
    ctx.save(); blob(ctx, pts); ctx.clip();
    ctx.beginPath(); ctx.rect(-4000, -4000, 8000, 8000); blobTo(ctx, shift(pts, dx, dy));
    ctx.globalAlpha *= alpha; ctx.fillStyle = fillc; ctx.fill('evenodd'); ctx.restore();
  }
  const stroke = (ctx, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  const fill = (ctx, col) => { ctx.fillStyle = col; ctx.fill(); };
  const fs = (ctx, col, lw) => { fill(ctx, col); if (lw) stroke(ctx, OL(), lw); };
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); };
  const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  // effective on-screen scale including the current transform (camera zoom)
  const eff = (ctx, s) => { const m = ctx.getTransform(); return Math.abs(s) * Math.hypot(m.a, m.b); };
  const resOf = k => (k <= 0.6 ? 1 : k <= 1.2 ? 2 : k <= 2.2 ? 3 : k <= 3.6 ? 4.5 : 6);
  function star(ctx, x, y, r, n = 5, inner = 0.45, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / n; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function sparkle(ctx, x, y, r, a = 1, col = '#fffbe0') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); fill(ctx, col);
    ctx.restore();
  }
  function sweatDrop(ctx, x, y, r, lw, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, -r * 1.9);
    ctx.bezierCurveTo(r * 0.35, -r * 1.2, r, -r * 0.45, r, r * 0.1); ctx.arc(0, r * 0.1, r, 0, Math.PI);
    ctx.bezierCurveTo(-r, -r * 0.45, -r * 0.35, -r * 1.2, 0, -r * 1.9); ctx.closePath();
    fs(ctx, '#c9f6ff', lw); A.ellipse(ctx, -r * 0.35, -r * 0.05, r * 0.22, r * 0.38, 0.3); fill(ctx, '#ffffff'); ctx.restore();
  }
  function mouthShape(ctx, mx, my, w, open, curve, asym, lw, P = {}) {
    const hw = w / 2;
    const yL = my - curve * 0.5 + asym * 0.5, yR = my - curve * 0.5 - asym * 0.5;
    if (open < 0.06) {
      ctx.beginPath(); ctx.moveTo(mx - hw, yL);
      if (P.wavy) { ctx.bezierCurveTo(mx - hw * 0.4, my - 2.5, mx - hw * 0.1, my + 2.5, mx, my); ctx.bezierCurveTo(mx + hw * 0.1, my - 2.5, mx + hw * 0.4, my + 2.5, mx + hw, yR); }
      else ctx.quadraticCurveTo(mx + asym * 0.4, my + curve * 0.75, mx + hw, yR);
      stroke(ctx, OL(), lw * 1.05);
      return;
    }
    const h = 2 + open * (P.depth || 18), ww = hw * (1 - open * 0.18);
    const Lx = mx - ww, Rx = mx + ww, bot = my + h * 1.2 + Math.max(0, curve) * 0.25;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(Lx, yL); ctx.quadraticCurveTo(mx + asym * 0.3, my + curve * 0.3, Rx, yR);
      ctx.bezierCurveTo(Rx + ww * 0.1, yR + h * 0.8, mx + ww * 0.5, bot, mx, bot);
      ctx.bezierCurveTo(mx - ww * 0.5, bot, Lx - ww * 0.1, yL + h * 0.8, Lx, yL); ctx.closePath();
    };
    path(); fill(ctx, P.inside || '#3e1a2c');
    ctx.save(); ctx.clip();
    A.ellipse(ctx, mx + ww * 0.12, bot + h * 0.12, ww * 0.62, h * 0.55); fill(ctx, P.tongue || '#e5788c');
    if (open > 0.22) { ctx.beginPath(); ctx.moveTo(Lx, yL); ctx.quadraticCurveTo(mx + asym * 0.3, my + curve * 0.3, Rx, yR); stroke(ctx, '#f4f1ea', Math.min(lw * 1.7, 2.5 + h * 0.25)); }
    ctx.restore();
    path(); stroke(ctx, OL(), lw);
  }
  function brow(ctx, x0, y0, x1, y1, bend, lw, col) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - bend, x1, y1); stroke(ctx, col, lw);
  }
  function glowSprite(col) {
    return A.layer('prglow_' + col, 128, 128, g => { g.fillStyle = A.radial(g, 64, 64, 0, 64, [[0, A.hex(col, 0.8)], [0.4, A.hex(col, 0.28)], [1, A.hex(col, 0)]]); g.fillRect(0, 0, 128, 128); });
  }
  // loading spinner: 8 dots, classic stepped rotation
  function spinnerDots(ctx, x, y, r, t, col = '255,255,255', dotR = r * 0.24) {
    const step = Math.floor(t * 10);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + step * TAU / 8 - Math.PI / 2, k = ((i + 1) / 8);
      circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, dotR * (0.55 + 0.45 * k));
      ctx.fillStyle = `rgba(${col},${0.15 + 0.85 * k * k})`; ctx.fill();
    }
  }
  // wood grain streaks into a rect (deterministic)
  function grain(g, x0, y0, w, h, col, n, seed, vertical = false, alpha = 0.18) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.strokeStyle = col; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r = A.rng(seed * 31 + i * 7 + 1); const pos = r(), th = 0.4 + r() * 1.3, ph = r() * 10, amp = 1 + r() * 3.5;
      g.globalAlpha = alpha * (0.4 + r() * 0.8); g.lineWidth = th; g.beginPath();
      const L = vertical ? h : w, Wd = vertical ? w : h;
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, off = Math.sin(u * 7 + ph) * amp + A.noise1(u * 5 + ph * 3) * amp * 1.2;
        const px = vertical ? x0 + pos * Wd + off : x0 + u * L, py = vertical ? y0 + u * L : y0 + pos * Wd + off;
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.stroke();
    }
    g.restore();
  }
  const PEARL = (g, x0, y0, x1, y1) => A.linear(g, x0, y0, x1, y1, [[0, '#fbf6ea'], [0.35, '#e9f3ef'], [0.65, '#f6e6ee'], [1, '#fdf8ec']]);
  // mother-of-pearl diamond chain band between two points (straight), band thickness th
  function pearlBand(g, x0, y0, x1, y1, th, step = 9) {
    const L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = '#23130c'; g.fillRect(0, -th / 2, L, th);
    const n = Math.max(1, Math.floor(L / step)), sp = L / n;
    g.fillStyle = PEARL(g, 0, -th, L, th);
    for (let i = 0; i < n; i++) { const cx = sp * (i + 0.5); poly(g, [[cx - sp * 0.42, 0], [cx, -th * 0.38], [cx + sp * 0.42, 0], [cx, th * 0.38]]); g.fill(); }
    g.fillStyle = '#b8894a'; g.fillRect(0, -th / 2, L, 0.7); g.fillRect(0, th / 2 - 0.7, L, 0.7);
    g.restore();
  }

  // ============================================================== BACKGAMMON
  const BG = { W: 420, D: 300, T: 15, HS: 150, FW: 17, BAR: 22 };
  const PW = (BG.W / 2 - BG.FW - BG.BAR / 2) / 6; // point width ~30.3
  const CR = PW * 0.45;                            // checker radius
  const PL = 116;                                   // point length
  const VIN = BG.D / 2 - BG.FW;                     // inner half-depth (133)
  const bproj = (u, v, z = 0) => { const p = (v + BG.D / 2) / BG.D, sc = 0.8 + 0.2 * p; return [u * sc, -BG.T - (1 - p) * BG.HS - z * 0.87 * sc, sc]; };
  function pointU(p) {
    const inR = BG.W / 2 - BG.FW, inL = BG.BAR / 2;
    if (p <= 6) return inR - PW * (p - 1 + 0.5);
    if (p <= 12) return -inL - PW * (p - 7 + 0.5);
    if (p <= 18) return -inR + PW * (p - 13 + 0.5);
    return inL + PW * (p - 19 + 0.5);
  }
  function slotUV(p, i, n) {
    const sp = n > 1 ? Math.min(CR * 2 * 0.98, (PL + 12 - CR * 2) / (n - 1)) : 0, near = p <= 12;
    return [pointU(p), near ? VIN - CR - 1 - i * sp : -VIN + CR + 1 + i * sp];
  }
  const BG_POS = { light: { 6: 4, 8: 3, 13: 4, 5: 2, 24: 1, 11: 1 }, dark: { 1: 1, 12: 4, 17: 3, 19: 4, 20: 2, 3: 1 } };

  function boardTexture(res) {
    return A.layer('pr_bgtex_' + res, Math.ceil(BG.W * res), Math.ceil(BG.D * res), g => {
      g.scale(res, res); g.translate(BG.W / 2, BG.D / 2);
      const W2 = BG.W / 2, D2 = BG.D / 2, FW = BG.FW, B2 = BG.BAR / 2;
      // frame walnut
      g.fillStyle = A.linear(g, -W2, -D2, W2, D2, [[0, '#6e3a1d'], [0.5, '#8a4c26'], [1, '#62321a']]); g.fillRect(-W2, -D2, BG.W, BG.D);
      grain(g, -W2, -D2, BG.W, BG.D, '#3a1a0a', 70, 3, false, 0.22);
      // fields (light olive wood)
      for (const sgn of [-1, 1]) {
        const x0 = sgn < 0 ? -W2 + FW : B2, w = W2 - FW - B2;
        g.fillStyle = A.linear(g, x0, -D2, x0 + w, D2, [[0, '#dcb277'], [0.5, '#e6c28b'], [1, '#cf9f62']]); g.fillRect(x0, -VIN, w, VIN * 2);
        grain(g, x0, -VIN, w, VIN * 2, '#9b6a35', 40, 11 + sgn, true, 0.2);
        // points
        for (let k = 0; k < 6; k++) {
          const cx = x0 + PW * (k + 0.5);
          for (const row of [-1, 1]) {
            const dark = (k + (row > 0 ? 0 : 1) + (sgn > 0 ? 0 : 0)) % 2 === 0;
            const base = row * VIN, tip = row * (VIN - PL);
            poly(g, [[cx - PW / 2 + 1, base], [cx + PW / 2 - 1, base], [cx, tip]]);
            g.fillStyle = dark ? A.linear(g, 0, base, 0, tip, [[0, '#4a2112'], [1, '#6b3219']]) : A.linear(g, 0, base, 0, tip, [[0, '#f4e6c6'], [1, '#e7d2a6']]);
            g.fill();
            g.lineWidth = 1.1; g.strokeStyle = dark ? 'rgba(246,230,200,0.55)' : 'rgba(90,45,20,0.55)'; g.stroke();
            // inlaid small pearl dot near the base
            circle(g, cx, base - row * 7, 1.8); g.fillStyle = dark ? '#f6ecd7' : '#6b3219'; g.fill();
          }
        }
        // inner bevel shadow along the frame
        g.save(); g.beginPath(); g.rect(x0, -VIN, w, VIN * 2); g.clip();
        g.fillStyle = A.linear(g, 0, -VIN, 0, -VIN + 12, [[0, 'rgba(40,15,5,0.45)'], [1, 'rgba(40,15,5,0)']]); g.fillRect(x0, -VIN, w, 12);
        g.fillStyle = A.linear(g, x0, 0, x0 + 9, 0, [[0, 'rgba(40,15,5,0.35)'], [1, 'rgba(40,15,5,0)']]); g.fillRect(x0, -VIN, 9, VIN * 2);
        g.fillStyle = A.linear(g, x0 + w, 0, x0 + w - 9, 0, [[0, 'rgba(40,15,5,0.3)'], [1, 'rgba(40,15,5,0)']]); g.fillRect(x0 + w - 9, -VIN, 9, VIN * 2);
        g.restore();
        g.strokeStyle = '#2a1208'; g.lineWidth = 1.4; g.strokeRect(x0, -VIN, w, VIN * 2);
      }
      // centre bar / hinge
      g.fillStyle = A.linear(g, -B2, 0, B2, 0, [[0, '#4f2612'], [0.5, '#7a3f1f'], [1, '#4a220f']]); g.fillRect(-B2, -D2, BG.BAR, BG.D);
      g.strokeStyle = '#1e0c05'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -D2); g.lineTo(0, D2); g.stroke();
      for (const hv of [-D2 + 42, D2 - 42]) {
        A.rrect(g, -7, hv - 15, 14, 30, 3); g.fillStyle = A.linear(g, -7, 0, 7, 0, [[0, '#9c7630'], [0.5, '#f0cf73'], [1, '#a57d34']]); g.fill();
        g.strokeStyle = '#4a320c'; g.lineWidth = 1; g.stroke();
        g.beginPath(); g.moveTo(0, hv - 15); g.lineTo(0, hv + 15); g.stroke();
        for (const d of [-9, 0, 9]) { circle(g, -3.5, hv + d, 1); g.fillStyle = '#5a3d10'; g.fill(); circle(g, 3.5, hv + d, 1); g.fill(); }
      }
      // mother-of-pearl inlay bands around the frame (each half)
      const inset = 7;
      for (const sgn of [-1, 1]) {
        const xa = sgn < 0 ? -W2 + inset : B2 + 3, xb = sgn < 0 ? -B2 - 3 : W2 - inset;
        pearlBand(g, xa, -D2 + inset, xb, -D2 + inset, 5.5);
        pearlBand(g, xa, D2 - inset, xb, D2 - inset, 5.5);
      }
      pearlBand(g, -W2 + inset, -D2 + inset + 3, -W2 + inset, D2 - inset - 3, 5.5);
      pearlBand(g, W2 - inset, -D2 + inset + 3, W2 - inset, D2 - inset - 3, 5.5);
      // little corner rosettes
      for (const [cx, cy] of [[-W2 + inset, -D2 + inset], [W2 - inset, -D2 + inset], [-W2 + inset, D2 - inset], [W2 - inset, D2 - inset]]) {
        star(g, cx, cy, 5.5, 4, 0.45, 0); g.fillStyle = '#f6efe0'; g.fill(); g.strokeStyle = '#3a1a0a'; g.lineWidth = 0.8; g.stroke();
      }
      // frame edge highlight/shadow
      g.strokeStyle = 'rgba(255,220,170,0.35)'; g.lineWidth = 1.5; g.strokeRect(-W2 + 1.5, -D2 + 1.5, BG.W - 3, BG.D - 3);
    });
  }
  // projected board (top surface strips + front face + shadow), cached. Unit space origin = (x,y) bottom centre.
  const BL = { ox: 250, oy: 200, w: 500, h: 236 };
  function boardLayer(res) {
    return A.layer('pr_bgboard_' + res, Math.ceil(BL.w * res), Math.ceil(BL.h * res), g => {
      g.scale(res, res); g.translate(BL.ox, BL.oy);
      const tex = boardTexture(Math.min(res * 1.25, 6)), tr = tex.width / BG.W;
      // front face (thickness)
      const nearY = -BG.T, W2 = BG.W / 2;
      A.rrect(g, -W2, nearY - 2, BG.W, BG.T + 2, [0, 0, 5, 5]);
      g.fillStyle = A.linear(g, 0, nearY, 0, 0, [[0, '#7a4020'], [0.5, '#5c2d15'], [1, '#3e1d0c']]); g.fill();
      grain(g, -W2, nearY, BG.W, BG.T, '#2a1006', 10, 21, false, 0.25);
      pearlBand(g, -W2 + 10, nearY + BG.T * 0.52, -BG.BAR / 2 - 4, nearY + BG.T * 0.52, 4.5, 8);
      pearlBand(g, BG.BAR / 2 + 4, nearY + BG.T * 0.52, W2 - 10, nearY + BG.T * 0.52, 4.5, 8);
      // brass clasp plates on the front edge by the hinge
      A.rrect(g, -6, nearY + 1, 12, BG.T - 3, 2); g.fillStyle = A.linear(g, -6, 0, 6, 0, [[0, '#9c7630'], [0.5, '#f3d57c'], [1, '#9c7630']]); g.fill();
      A.rrect(g, -W2, nearY - 2, BG.W, BG.T + 2, [0, 0, 5, 5]); stroke(g, OL(), 2.6);
      // top surface strips
      const N = 110;
      for (let j = 0; j < N; j++) {
        const v0 = -BG.D / 2 + (j * BG.D) / N, v1 = v0 + BG.D / N;
        const [, y0] = bproj(0, v0), [, y1, sc] = bproj(0, (v0 + v1) / 2);
        const [, y2] = bproj(0, v1);
        g.drawImage(tex, 0, (j * BG.D / N) * tr, tex.width, (BG.D / N) * tr + 0.5, -W2 * sc, y0, BG.W * sc, y2 - y0 + 0.45);
      }
      // outline of top surface
      const c = [bproj(-W2, -BG.D / 2), bproj(W2, -BG.D / 2), bproj(W2, BG.D / 2), bproj(-W2, BG.D / 2)];
      poly(g, c.map(p => [p[0], p[1]])); stroke(g, OL(), 2.8);
      // near-edge highlight
      g.beginPath(); g.moveTo(c[3][0] + 4, c[3][1] + 0.5); g.lineTo(c[2][0] - 4, c[2][1] + 0.5); stroke(g, 'rgba(255,225,180,0.55)', 1.2);
      // soft light falloff on the far half (depth)
      poly(g, c.map(p => [p[0], p[1]])); g.fillStyle = A.linear(g, 0, c[0][1], 0, c[3][1], [[0, 'rgba(30,10,20,0.22)'], [0.5, 'rgba(30,10,20,0)'], [1, 'rgba(255,230,190,0.05)']]); g.fill();
    });
  }
  function shadowLayer() {
    return A.layer('pr_bgshadow', 256, 64, g => { g.fillStyle = A.radial(g, 128, 32, 0, 128, [[0, 'rgba(20,8,4,0.55)'], [0.6, 'rgba(20,8,4,0.3)'], [1, 'rgba(20,8,4,0)']]); g.setTransform(1, 0, 0, 0.25, 0, 24); g.fillRect(0, -100, 256, 256); });
  }
  const CK = {
    light: { top0: '#fffaf0', top1: '#eadbb8', side: '#c7ad7d', sideD: '#9c8156', ring: 'rgba(150,115,60,0.55)' },
    dark: { top0: '#6a4330', top1: '#2e1a11', side: '#26140c', sideD: '#140904', ring: 'rgba(255,220,180,0.28)' },
  };
  function drawChecker(ctx, u, v, z, col, sq = 0) {
    const [X, Y, sc] = bproj(u, v, z);
    const C = CK[col], rx = CR * sc * (1 + sq * 0.5), ry = CR * sc * 0.5 * (1 + sq * 0.5), hh = 6.2 * sc * (1 - sq);
    ctx.beginPath(); ctx.moveTo(X + rx, Y - hh); ctx.lineTo(X + rx, Y); ctx.ellipse(X, Y, rx, ry, 0, 0, Math.PI); ctx.lineTo(X - rx, Y - hh); ctx.closePath();
    ctx.fillStyle = A.linear(ctx, X - rx, 0, X + rx, 0, [[0, C.side], [0.35, C.side], [1, C.sideD]]); ctx.fill();
    stroke(ctx, OL(), 1.6);
    A.ellipse(ctx, X, Y - hh, rx, ry);
    ctx.fillStyle = A.radial(ctx, X - rx * 0.3, Y - hh - ry * 0.4, 0, rx * 1.2, [[0, C.top0], [1, C.top1]]); ctx.fill();
    stroke(ctx, OL(), 1.6);
    A.ellipse(ctx, X, Y - hh, rx * 0.62, ry * 0.62); stroke(ctx, C.ring, 1.1);
    A.ellipse(ctx, X - rx * 0.32, Y - hh - ry * 0.35, rx * 0.22, ry * 0.18, -0.2); fill(ctx, col === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,220,190,0.35)');
  }
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function drawDie(ctx, u, v, z, yaw, val, sq = 0) {
    const d = 20, hd = d / 2, H = d * (1 - sq);
    const corner = k => { const a = yaw + Math.PI / 4 + k * Math.PI / 2; return [u + Math.cos(a) * hd * 1.414, v + Math.sin(a) * hd * 1.414 * 1.0]; };
    const cs = [0, 1, 2, 3].map(corner);
    const top = cs.map(c => bproj(c[0], c[1], z + H)), bot = cs.map(c => bproj(c[0], c[1], z));
    // shadow
    const [sx, sy, ssc] = bproj(u, v, 0);
    A.ellipse(ctx, sx + 3, sy + 1, d * 0.85 * ssc, d * 0.42 * ssc); fill(ctx, `rgba(40,15,5,${0.35 * clamp(1 - z / 70)})`);
    // visible side faces: outward normal pointing toward the viewer (+v)
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4, mv = (cs[k][1] + cs[k2][1]) / 2 - v;
      if (mv <= 0.01) continue;
      const mu = (cs[k][0] + cs[k2][0]) / 2 - u, shade = 0.62 + 0.25 * clamp(mu / hd * 0.5 + 0.5);
      poly(ctx, [top[k], top[k2], bot[k2], bot[k]].map(p => [p[0], p[1]]));
      ctx.fillStyle = A.mixc('#b9a98e', '#f5eedf', shade - 0.5); ctx.fill(); stroke(ctx, OL(), 1.7);
    }
    poly(ctx, top.map(p => [p[0], p[1]])); ctx.fillStyle = '#fffbf0'; ctx.fill(); stroke(ctx, OL(), 1.7);
    // pips
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    for (const [a, b] of PIPS[val] || PIPS[1]) {
      const pu = u + (a * ca - b * sa) * d * 0.27, pv = v + (a * sa + b * ca) * d * 0.27;
      const [px, py, psc] = bproj(pu, pv, z + H);
      A.ellipse(ctx, px, py, 2.1 * psc * (val === 1 ? 1.45 : 1), 1.1 * psc * (val === 1 ? 1.45 : 1)); fill(ctx, val === 1 ? '#c0283c' : '#1c1320');
    }
  }
  A.backgammonPoint = (x, y, s, point, i = 0) => { const [u, v] = slotUV(point, i, i + 1); const [X, Y] = bproj(u, v, 0); return [x + X * s, y + (Y - 5) * s]; };

  // ---- closed case
  const CASE = { W: 180, H: 118, TOP: 12, GRIP: 36 };
  function caseLayer(res) {
    return A.layer('pr_bgcase_' + res, Math.ceil(220 * res), Math.ceil(200 * res), g => {
      g.scale(res, res); g.translate(110, 180);
      const { W, H, TOP } = CASE, W2 = W / 2, lw = 3.4;
      // handle (behind the top band ends)
      g.beginPath(); g.moveTo(-26, -H - TOP + 2); g.bezierCurveTo(-28, -H - TOP - 30, 28, -H - TOP - 30, 26, -H - TOP + 2);
      stroke(g, OL(), 11); stroke(g, '#4a2616', 6.5); g.beginPath(); g.moveTo(-18, -H - TOP - 17); g.quadraticCurveTo(0, -H - TOP - 26, 18, -H - TOP - 17); stroke(g, 'rgba(255,200,150,0.35)', 1.6);
      for (const sx of [-26, 26]) { A.rrect(g, sx - 6, -H - TOP - 3, 12, 8, 2); g.fillStyle = '#d8b25a'; g.fill(); stroke(g, OL(), 2); }
      // top band (visible depth)
      poly(g, [[-W2, -H], [W2, -H], [W2 - 5, -H - TOP], [-W2 + 5, -H - TOP]]);
      g.fillStyle = A.linear(g, 0, -H - TOP, 0, -H, [[0, '#a8683a'], [1, '#7c4322']]); g.fill();
      grain(g, -W2, -H - TOP, W, TOP, '#3a1a0a', 6, 41, false, 0.25);
      g.beginPath(); g.moveTo(-W2 + 3, -H - TOP / 2); g.lineTo(W2 - 3, -H - TOP / 2); stroke(g, '#2a1208', 1.4);
      poly(g, [[-W2, -H], [W2, -H], [W2 - 5, -H - TOP], [-W2 + 5, -H - TOP]]); stroke(g, OL(), lw);
      // latches
      for (const sx of [-54, 54]) {
        A.rrect(g, sx - 7, -H - TOP + 1, 14, 13, 2); g.fillStyle = A.linear(g, sx - 7, 0, sx + 7, 0, [[0, '#9c7630'], [0.5, '#f5d77e'], [1, '#9c7630']]); g.fill(); stroke(g, OL(), 2);
        circle(g, sx, -H - TOP + 8, 1.6); fill(g, '#5a3d10');
      }
      // front face
      A.rrect(g, -W2, -H, W, H, [2, 2, 8, 8]);
      g.fillStyle = A.linear(g, -W2, -H, W2, 0, [[0, '#8e4f27'], [0.55, '#7a401e'], [1, '#5a2c14']]); g.fill();
      grain(g, -W2, -H, W, H, '#351606', 34, 43, false, 0.2);
      // marquetry panel
      const px = -W2 + 11, py = -H + 11, pw = W - 22, ph = H - 22;
      g.fillStyle = '#23130c'; g.fillRect(px, py, pw, ph);
      // zigzag triangle border (pearl / ebony)
      const bw = 7;
      const tri = (x0, y0, x1, y1, n, out) => {
        const L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0), sp = L / n;
        g.save(); g.translate(x0, y0); g.rotate(ang); g.fillStyle = PEARL(g, 0, 0, L, bw);
        for (let i = 0; i < n; i++) { poly(g, [[i * sp + 0.6, 0.6], [(i + 1) * sp - 0.6, 0.6], [(i + 0.5) * sp, bw - 0.8]]); g.fill(); }
        g.restore();
      };
      tri(px, py, px + pw, py, 16); tri(px + pw, py + ph, px, py + ph, 16);
      tri(px + pw, py, px + pw, py + ph, 9); tri(px, py + ph, px, py, 9);
      // inner panel (lighter burl)
      const ix = px + bw + 2, iy = py + bw + 2, iw = pw - 2 * bw - 4, ih = ph - 2 * bw - 4;
      g.fillStyle = A.radial(g, 0, iy + ih / 2, 0, iw * 0.6, [[0, '#b77a45'], [1, '#8a4c24']]); g.fillRect(ix, iy, iw, ih);
      grain(g, ix, iy, iw, ih, '#5a2a10', 20, 47, false, 0.22);
      g.strokeStyle = '#f2e7d2'; g.lineWidth = 1.2; g.strokeRect(ix + 1.5, iy + 1.5, iw - 3, ih - 3);
      // central 8-point star rosette
      const cx = 0, cy = iy + ih / 2, R = 25;
      g.save(); g.translate(cx, cy);
      for (const a of [0, Math.PI / 4]) { g.save(); g.rotate(a); g.fillStyle = PEARL(g, -R, -R, R, R); g.fillRect(-R * 0.7, -R * 0.7, R * 1.4, R * 1.4); g.strokeStyle = '#23130c'; g.lineWidth = 1.2; g.strokeRect(-R * 0.7, -R * 0.7, R * 1.4, R * 1.4); g.restore(); }
      star(g, 0, 0, R * 0.58, 8, 0.62, 0); g.fillStyle = '#23130c'; g.fill();
      star(g, 0, 0, R * 0.42, 8, 0.6, Math.PI / 8); g.fillStyle = '#c98c4a'; g.fill();
      circle(g, 0, 0, R * 0.14); g.fillStyle = PEARL(g, -4, -4, 4, 4); g.fill(); g.strokeStyle = '#23130c'; g.lineWidth = 0.9; g.stroke();
      g.restore();
      // flanking diamonds + corner triangles
      for (const sx of [-1, 1]) {
        for (let k = 0; k < 3; k++) { const dx = sx * (R + 10 + k * 12), s2 = 5 - k; poly(g, [[dx - s2, cy], [dx, cy - s2 * 1.3], [dx + s2, cy], [dx, cy + s2 * 1.3]]); g.fillStyle = PEARL(g, dx - 5, cy - 5, dx + 5, cy + 5); g.fill(); g.strokeStyle = '#23130c'; g.lineWidth = 0.8; g.stroke(); }
        for (const sy of [-1, 1]) {
          const ex = sx > 0 ? ix + iw - 3 : ix + 3, ey = sy > 0 ? iy + ih - 3 : iy + 3;
          poly(g, [[ex, ey], [ex - sx * 16, ey], [ex, ey - sy * 12]]); g.fillStyle = PEARL(g, ex - 8, ey - 8, ex + 8, ey + 8); g.fill(); g.strokeStyle = '#23130c'; g.lineWidth = 0.8; g.stroke();
        }
      }
      // gloss + edge shading
      A.rrect(g, -W2, -H, W, H, [2, 2, 8, 8]);
      g.fillStyle = A.linear(g, -W2, -H, -W2 + 60, -H + 80, [[0, 'rgba(255,230,200,0.22)'], [1, 'rgba(255,230,200,0)']]); g.fill();
      g.fillStyle = A.linear(g, 0, -20, 0, 0, [[0, 'rgba(20,5,0,0)'], [1, 'rgba(20,5,0,0.3)']]); g.fill();
      // brass corner protectors
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const ex = sx * W2, ey = sy > 0 ? 0 : -H;
        g.beginPath(); g.moveTo(ex, ey - sy * 0); g.lineTo(ex - sx * 14, ey); g.lineTo(ex - sx * 14, ey - sy * 4); g.lineTo(ex - sx * 4, ey - sy * 4); g.lineTo(ex - sx * 4, ey - sy * 14); g.lineTo(ex, ey - sy * 14); g.closePath();
        g.fillStyle = A.linear(g, ex - 10, ey - 10, ex + 10, ey + 10, [[0, '#a17a32'], [0.5, '#f0cf73'], [1, '#8a6424']]); g.fill(); stroke(g, OL(), 1.4);
      }
      A.rrect(g, -W2, -H, W, H, [2, 2, 8, 8]); stroke(g, OL(), lw);
    });
  }

  A.drawBackgammon = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t ?? 0, mode = o.mode === 'case' ? 'case' : 'board';
    ctx.save(); ctx.translate(x, y);
    if (mode === 'case') {
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(s, s);
      if (o.anchor === 'handle') ctx.translate(0, CASE.H + CASE.TOP + CASE.GRIP - 14);
      if (o.shadow) { ctx.save(); ctx.globalAlpha = clamp(o.shadow); ctx.drawImage(shadowLayer(), -110, -8, 220, 16); ctx.restore(); }
      const res = resOf(eff(ctx, 1));
      ctx.drawImage(caseLayer(res), -110, -180, 220, 200);
      ctx.restore(); return;
    }
    ctx.scale(s, s);
    const res = resOf(eff(ctx, 1));
    if (o.shadow ?? 1) { ctx.save(); ctx.globalAlpha = clamp(o.shadow ?? 1); ctx.drawImage(shadowLayer(), -250, -18, 500, 34); ctx.restore(); }
    ctx.drawImage(boardLayer(res), -BL.ox, -BL.oy, BL.w, BL.h);
    // ---- checkers
    const pos = o.position || BG_POS, from = o.from ?? 13, to = o.to ?? 9, mv = clamp(o.move ?? 0);
    const counts = { light: Object.assign({}, pos.light), dark: Object.assign({}, pos.dark) };
    const moverCol = counts.light[from] ? 'light' : counts.dark[from] ? 'dark' : null;
    let moving = null;
    if (moverCol && mv > 0) {
      const nf = counts[moverCol][from], nt = counts[moverCol][to] || 0;
      const [u0, v0] = slotUV(from, nf - 1, nf), [u1, v1] = slotUV(to, nt, nt + 1);
      counts[moverCol][from] = nf - 1;
      if (mv >= 1) counts[moverCol][to] = nt + 1;
      else {
        const e = A.ease.inOut(clamp(mv / 0.88)), land = A.smooth(0.84, 0.9, mv) * (1 - A.smooth(0.9, 1, mv));
        moving = { u: A.lerp(u0, u1, e), v: A.lerp(v0, v1, e), z: Math.sin(Math.PI * clamp(mv / 0.88)) * 46 + A.smooth(0, 0.12, mv) * 4 * (1 - A.smooth(0.7, 0.88, mv)), sq: land * 0.35 - Math.sin(Math.PI * clamp(mv / 0.88)) * 0.08 };
      }
    }
    const list = [];
    for (const col of ['light', 'dark']) for (const p in counts[col]) { const n = counts[col][p]; for (let i = 0; i < n; i++) { const [u, v] = slotUV(+p, i, n); list.push([u, v, col]); } }
    list.sort((a, b) => a[1] - b[1]);
    for (const [u, v, col] of list) drawChecker(ctx, u, v, 0, col);
    // ---- dice
    const dvals = o.diceVals || [4, 2], dk = o.dice;
    if (dk === undefined || dk > 0) {
      const q = dk === undefined ? 1 : clamp(dk);
      const dice = [[96, 12, 0.35, 0], [132, -10, -0.25, 1]].map(([uf, vf, yf, i]) => {
        const qq = clamp((q - i * 0.06) / (1 - i * 0.06 + 1e-6));
        const e = A.ease.out(qq), u = A.lerp(255 + i * 10, uf, e), v = A.lerp(175 - i * 20, vf, e);
        const z = 58 * Math.pow(1 - qq, 1.6) * Math.abs(Math.cos(qq * Math.PI * 2.55));
        const yaw = yf + Math.pow(1 - qq, 2) * (9 + i * 3) + (dk === undefined ? A.wob(t, i + 3, 0.2) * 0.0 : 0);
        const tumble = qq < 0.86 ? 1 + Math.floor(A.hash(i * 13 + Math.floor(qq * 15)) * 6) : dvals[i];
        const land = qq > 0.9 && qq < 1 ? Math.sin((qq - 0.9) / 0.1 * Math.PI) * 0.12 : 0;
        return { u, v, z, yaw, val: tumble, sq: land };
      });
      dice.sort((a, b) => a.v - b.v);
      for (const D of dice) drawDie(ctx, D.u, D.v, D.z, D.yaw, D.val, D.sq);
    }
    if (moving) {
      const [sx, sy, ssc] = bproj(moving.u, moving.v, 0);
      A.ellipse(ctx, sx + 2, sy, CR * ssc * (1 - moving.z / 140), CR * 0.5 * ssc * (1 - moving.z / 140)); fill(ctx, `rgba(40,15,5,${0.35 * (1 - moving.z / 80)})`);
      drawChecker(ctx, moving.u, moving.v, moving.z, moverCol, moving.sq);
    }
    ctx.restore();
  };

  // ============================================================== BRAND PACKETS
  const BR = A.BRAND_COLORS = {
    ILVIP: { c: '#a591a6', d: '#6a576f', ink: '#4a3650', sw: 0.96, sh: 1.08 },
    EMBY: { c: '#91a088', d: '#5a6a52', ink: '#3b4a35', sw: 1.1, sh: 0.92 },
    LAGTV: { c: '#8a96ab', d: '#56617a', ink: '#353f58', sw: 1.0, sh: 1.0 },
    'LOADING+': { c: '#afa38b', d: '#746953', ink: '#51472f', sw: 1.14, sh: 0.95 },
  };
  const brandGeom = brand => { const K = BR[brand]; const a = 46 * K.sw, b = 40 * K.sh; return { a, b, cy: -(b + 9) }; };
  function brandTag(g, brand, K, cy, a, b, lw) {
    const ty = cy + b * 0.6, halfW = a * Math.cbrt(1 - Math.pow(0.78, 3)) * 0.98;
    const w = Math.min(halfW * 2, 84), h = 21;
    g.save(); g.translate(0, ty); g.rotate(-0.035);
    const shape = () => A.rrect(g, -w / 2, -h / 2, w, h, 4);
    shape(); g.fillStyle = A.linear(g, 0, -h / 2, 0, h / 2, [[0, '#f6f2e8'], [1, '#e2dac8']]); g.fill();
    g.save(); shape(); g.clip();
    g.fillStyle = K.d; g.fillRect(-w / 2, -h / 2, 10, h);
    g.fillStyle = 'rgba(120,100,70,0.12)'; g.fillRect(-w / 2, h / 2 - 4, w, 4);
    g.restore();
    circle(g, -w / 2 + 5, 0, 2); g.fillStyle = '#f6f2e8'; g.fill(); g.lineWidth = 1; g.strokeStyle = OL(); g.stroke();
    shape(); stroke(g, OL(), lw * 0.7);
    g.font = '900 17px Rubik'; const tw = g.measureText(brand).width, room = w - 17;
    const fsz = Math.min(17, 17 * room / tw);
    g.font = `900 ${fsz}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a2236';
    g.fillText(brand, 5, 1);
    g.restore();
  }
  function brandAcc(g, brand, K, a, b, cy, lw) {
    const top = cy - b;
    if (brand === 'ILVIP') { // tarnished paper crown, a bit bent
      g.save(); g.translate(a * 0.28, top + 4); g.rotate(0.22);
      g.beginPath(); g.moveTo(-17, 2); g.lineTo(-18, -14); g.lineTo(-9, -6); g.lineTo(-1, -19); g.lineTo(7, -6); g.lineTo(14, -12); g.quadraticCurveTo(16, -6, 18, -4); g.lineTo(17, 2); g.closePath();
      g.fillStyle = A.linear(g, 0, -18, 0, 2, [[0, '#cdbb86'], [1, '#9c8a5a']]); g.fill(); stroke(g, OL(), lw * 0.75);
      circle(g, -1, -19, 2.6); fs(g, '#b9a2a8', lw * 0.5); circle(g, -18, -14, 2.2); fs(g, '#b9a2a8', lw * 0.5);
      g.beginPath(); g.moveTo(-15, -2); g.lineTo(15, -2); stroke(g, 'rgba(90,70,40,0.5)', 1.2);
      g.restore();
    } else if (brand === 'EMBY') { // droopy striped nightcap
      g.save(); g.translate(-a * 0.08, top + 6);
      const path = () => { g.beginPath(); g.moveTo(-a * 0.62, 2); g.bezierCurveTo(-a * 0.5, -30, a * 0.35, -36, a * 0.9, -10); g.quadraticCurveTo(a * 1.05, 4, a * 1.02, 14); g.quadraticCurveTo(a * 0.7, -8, a * 0.52, 2); g.closePath(); };
      path(); g.fillStyle = '#8193a8'; g.fill();
      g.save(); path(); g.clip(); g.strokeStyle = '#b8c3cf'; g.lineWidth = 5;
      for (let i = -3; i < 7; i++) { g.beginPath(); g.moveTo(-a + i * 13, 10); g.lineTo(-a + i * 13 + 22, -40); g.stroke(); }
      g.restore(); path(); stroke(g, OL(), lw * 0.8);
      A.rrect(g, -a * 0.68, -3, a * 1.28, 9, 4.5); fs(g, '#dfe3e6', lw * 0.7);
      circle(g, a * 1.03, 16, 6); fs(g, '#dfe3e6', lw * 0.7);
      g.restore();
    } else if (brand === 'LAGTV') { // old rabbit-ear antenna
      g.save(); g.translate(a * 0.05, top + 3);
      g.beginPath(); g.moveTo(-2, -6); g.lineTo(-22, -34); stroke(g, OL(), 4.6); stroke(g, '#b9bec8', 2.2);
      g.beginPath(); g.moveTo(2, -6); g.quadraticCurveTo(14, -22, 26, -26); stroke(g, OL(), 4.6); stroke(g, '#b9bec8', 2.2); // bent ear
      circle(g, -22, -34, 3.2); fs(g, '#d9dce2', lw * 0.5); circle(g, 26, -26, 3.2); fs(g, '#d9dce2', lw * 0.5);
      g.beginPath(); g.ellipse(0, 0, 11, 8, 0, Math.PI, 0); g.closePath(); fs(g, '#4a4f5c', lw * 0.7);
      A.rrect(g, 14, -28, 8, 5, 1); fs(g, '#cfc3a0', 1.2); // tape on the bent ear
      g.restore();
    } else { // LOADING+ : hourglass perched on the head
      g.save(); g.translate(-a * 0.32, top + 1); g.rotate(-0.25);
      A.rrect(g, -10, -30, 20, 4.5, 2); fs(g, '#8a6a44', lw * 0.6); A.rrect(g, -10, -3, 20, 4.5, 2); fs(g, '#8a6a44', lw * 0.6);
      g.beginPath(); g.moveTo(-7, -26); g.lineTo(7, -26); g.quadraticCurveTo(7, -18, 1.2, -14.5); g.quadraticCurveTo(7, -11, 7, -3); g.lineTo(-7, -3); g.quadraticCurveTo(-7, -11, -1.2, -14.5); g.quadraticCurveTo(-7, -18, -7, -26); g.closePath();
      g.fillStyle = 'rgba(220,235,240,0.7)'; g.fill();
      g.save(); g.clip(); g.fillStyle = '#d9b46a'; g.fillRect(-8, -24, 16, 5); g.beginPath(); g.moveTo(-7, -3); g.quadraticCurveTo(0, -12, 7, -3); g.fill(); g.restore();
      g.beginPath(); g.moveTo(-7, -26); g.lineTo(7, -26); g.quadraticCurveTo(7, -18, 1.2, -14.5); g.quadraticCurveTo(7, -11, 7, -3); g.lineTo(-7, -3); g.quadraticCurveTo(-7, -11, -1.2, -14.5); g.quadraticCurveTo(-7, -18, -7, -26); g.closePath(); stroke(g, OL(), lw * 0.6);
      g.restore();
    }
  }
  function brandSprite(brand, res) {
    return A.layer(`pr_bp_${brand}_${res}`, Math.ceil(190 * res), Math.ceil(180 * res), g => {
      g.scale(res, res); g.translate(95, 150);
      const K = BR[brand], { a, b, cy } = brandGeom(brand), lw = 3.6;
      A.ellipse(g, -a * 0.45, -4, 10, 5.5); fs(g, K.d, lw * 0.8); A.ellipse(g, a * 0.45, -4, 10, 5.5); fs(g, K.d, lw * 0.8);
      const pts = squircle(a, b, 3.0, 36, 0.07, 0, cy);
      blob(g, pts);
      g.fillStyle = A.radial(g, -a * 0.15, cy - b * 0.1, 0, a * 1.35, [[0, A.mixc(K.c, '#ffffff', 0.28)], [0.5, K.c], [1, A.mixc(K.c, K.d, 0.35)]]); g.fill();
      cel(g, pts, 7, -9, K.d, 0.35);
      cel(g, pts, -3, 3, '#dfe6ee', 0.3);
      // envelope flap
      g.save(); blob(g, pts); g.clip();
      const tipY = cy - b * 0.55;
      const flap = () => { g.moveTo(-a * 1.1, cy - b * 0.9); g.quadraticCurveTo(-a * 0.45, tipY - 5, 0, tipY); g.quadraticCurveTo(a * 0.45, tipY - 5, a * 1.1, cy - b * 0.9); };
      g.beginPath(); flap(); g.lineTo(a * 1.1, cy - b * 1.3); g.lineTo(-a * 1.1, cy - b * 1.3); g.closePath(); fill(g, 'rgba(255,255,255,0.14)');
      g.beginPath(); flap(); stroke(g, A.hex(K.d, 0.75), lw * 0.55);
      // dusty speckles (these packets have been waiting a while)
      for (let i = 0; i < 14; i++) { const r = A.rng(i * 5 + brand.length * 17); circle(g, (r() - 0.5) * a * 1.7, cy + (r() - 0.5) * b * 1.7, 0.7 + r() * 1.1); fill(g, `rgba(60,50,40,${0.12 + r() * 0.12})`); }
      g.restore();
      blob(g, pts); stroke(g, OL(), lw);
      g.globalAlpha = 0.55; A.ellipse(g, -a * 0.6, cy - b * 0.62, 7, 2.8, -0.55); fill(g, '#ffffff'); g.globalAlpha = 1;
      // little grey wax seal at the flap tip
      circle(g, 0, tipY, 5); fs(g, K.d, lw * 0.55);
      // muted cheeks
      g.globalAlpha = 0.22; A.ellipse(g, -a * 0.6, cy + b * 0.12, 6, 3.6); fill(g, '#d0707e'); A.ellipse(g, a * 0.6, cy + b * 0.12, 6, 3.6); fill(g, '#d0707e'); g.globalAlpha = 1;
      brandTag(g, brand, K, cy, a, b, lw);
      brandAcc(g, brand, K, a, b, cy, lw);
    });
  }
  const BMOOD = {
    grumpy: { cov: 0.44, tilt: 1, brow: 'angry', curve: -5, min: 0, arms: 'hips', br: 0.5, look: [-0.35, 0.05] },
    sleepy: { cov: 0.66, tilt: -0.7, brow: 'droop', curve: -1, min: 0.05, arms: 'hang', br: 0.28, look: [0, 0.5], bags: 1 },
    shock: { cov: 0, tilt: 0, brow: 'up', curve: 0, min: 0.5, arms: 'up', br: 0.9, look: [0, -0.2] },
    panting: { cov: 0.36, tilt: -0.6, brow: 'worry', curve: 0, min: 0.38, arms: 'knees', br: 2.4, look: [0.1, 0.45] },
  };
  function limb(ctx, x0, y0, cx, cy, x1, y1, w, col, lw) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1);
    stroke(ctx, OL(), w + lw * 2); stroke(ctx, col, w);
  }
  function mitt(ctx, x, y, r, col, lw) { circle(ctx, x, y, r); fs(ctx, col, lw * 0.8); A.ellipse(ctx, x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.22, -0.4); fill(ctx, 'rgba(255,255,255,0.35)'); }

  A.drawBrandPacket = (ctx, x, y, scale = 1, o = {}) => {
    const t = o.t ?? 0, brand = BR[o.brand] ? o.brand : 'ILVIP', K = BR[brand];
    const mood = BMOOD[o.mood] ? o.mood : 'grumpy', M = BMOOD[mood];
    const { a, b, cy } = brandGeom(brand);
    const f = o.flip ? -1 : 1, seed = brand.charCodeAt(0) + brand.length * 7;
    const lw = 3.6, ph = A.hash(seed) * TAU;
    const br = Math.sin(t * TAU * M.br + ph);
    const vel = o.vel || [0, 0], sp = Math.hypot(vel[0], vel[1]);
    const lean = clamp(vel[0] / 1400, -1, 1) * 0.2 + (mood === 'panting' ? 0.09 * f : 0) + (mood === 'sleepy' ? 0.04 * Math.sin(t * 0.6 + ph) : 0);
    const spin = clamp(o.spinner ?? 0), sign = clamp(o.sign ?? 0), spinEyes = clamp(o.spinnerEyes ?? 0);
    const res = resOf(eff(ctx, scale));
    const spr = brandSprite(brand, res);
    const shockHop = mood === 'shock' ? 0 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (o.shadow) { A.ellipse(ctx, 0, -1, a * 1.05 - (o.hop || 0) * 0.3, 7); fill(ctx, `rgba(5,5,25,${0.35 * o.shadow})`); }
    const gl = o.glow ?? 0.3;
    if (gl > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(gl * 0.5); ctx.drawImage(glowSprite(K.c), -a * 1.9, cy - a * 1.9, a * 3.8, a * 3.8); ctx.restore(); }
    ctx.translate(0, -(o.hop || 0) - shockHop);
    ctx.rotate((o.rot || 0) + lean);
    const st = clamp(sp / 1600) * 0.14;
    const sq = (o.squash || 0) + (mood === 'shock' ? -0.07 : 0) + (mood === 'sleepy' ? 0.035 : 0) - st;
    const bAmp = mood === 'panting' ? 0.05 : 0.022;
    ctx.scale((1 + sq * 0.7) * (1 - bAmp * 0.45 * br), (1 - sq) * (1 + bAmp * br));

    // ---- arms (behind the body)
    const arms = o.arms || M.arms;
    const signE = A.ease.outBack(sign);
    const armCol = A.mixc(K.c, K.d, 0.25), mittCol = A.mixc(K.c, '#ffffff', 0.35);
    const hands = [];
    for (const s of [-1, 1]) {
      const sx = s * a * 0.9, sy = cy + 8;
      let hx, hy, ex, ey;
      const holdsSign = sign > 0.01 && s === f;
      if (holdsSign) { hx = s * a * 1.28; hy = cy - 2 + (1 - signE) * 26; ex = s * a * 1.35; ey = cy + 14; }
      else if (arms === 'hips') { hx = s * a * 0.98; hy = cy + 26; ex = s * a * 1.42; ey = cy + 12; }
      else if (arms === 'up') { const w = Math.sin(t * 18 + s) * 3; hx = s * a * 1.42 + w; hy = cy - b * 1.05; ex = s * a * 1.38; ey = cy - 4; }
      else if (arms === 'knees') { hx = s * a * 0.95; hy = -9 + br * 1.5; ex = s * a * 1.3; ey = cy + 26; }
      else { const sw = Math.sin(t * 1.1 + s * 1.3 + ph) * 3; hx = s * a * 1.12 + sw; hy = cy + b * 0.9; ex = s * a * 1.12; ey = cy + 20; }
      limb(ctx, sx, sy, ex, ey, hx, hy, 7, armCol, lw * 0.8);
      hands.push([hx, hy, holdsSign]);
    }
    for (const [hx, hy, hs] of hands) if (!hs) mitt(ctx, hx, hy, 6.5, mittCol, lw);

    ctx.drawImage(spr, -95, -150, 190, 180);

    // ---- face (live)
    const baseLook = o.look ? [o.look[0] * f, o.look[1]] : [M.look[0] * f + A.wob(t, seed, 0.3) * 0.35, M.look[1] + A.wob(t, seed + 4, 0.2) * 0.15];
    const look = baseLook, fx = look[0] * 3, ey = cy - 11, ex = a * 0.33;
    const bl = o.blink ?? A.blink(t, seed + 3);
    const slowBlink = mood === 'sleepy' ? Math.pow(Math.max(0, Math.sin(t * 0.9 + ph)), 6) : 0;
    const eyeInk = '#1d1628';
    for (const s of [-1, 1]) {
      const X = fx + s * ex;
      if (mood === 'shock' || spinEyes > 0.5) {
        const rx = mood === 'shock' ? 9.5 : 8.5, ry = mood === 'shock' ? 11.5 : 9.5;
        A.ellipse(ctx, X, ey - 1, rx, ry); fs(ctx, '#fbfaf6', lw * 0.8);
        if (spinEyes > 0.5) { spinnerDots(ctx, X, ey - 1, 5.2, t + (s > 0 ? 0.05 : 0), '40,30,55', 1.6); }
        else { circle(ctx, X + look[0] * 2.5, ey + look[1] * 2, 3); fill(ctx, eyeInk); circle(ctx, X + look[0] * 2.5 + 1, ey + look[1] * 2 - 1, 0.9); fill(ctx, '#fff'); }
        if (mood !== 'shock') { const cov = Math.max(M.cov * 0.7, bl); ctx.beginPath(); ctx.moveTo(X - rx, ey - 1 - ry + cov * ry * 1.6); ctx.lineTo(X + rx, ey - 1 - ry + cov * ry * 1.6); stroke(ctx, OL(), lw * 0.8); }
      } else {
        const cov = clamp(Math.max(M.cov + slowBlink * 0.4, bl));
        const top = ey - 9 + cov * 18, tl = 5 * s * M.tilt;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(X - 12, top + tl); ctx.lineTo(X + 12, top - tl); ctx.lineTo(X + 12, ey + 14); ctx.lineTo(X - 12, ey + 14); ctx.closePath(); ctx.clip();
        A.ellipse(ctx, X + look[0] * 2, ey + look[1] * 1.5, 7, 8.6); fill(ctx, eyeInk);
        circle(ctx, X + look[0] * 2 + 2.3, ey - 3, 2.3); fill(ctx, 'rgba(255,255,255,0.85)'); circle(ctx, X + look[0] * 2 - 2.3, ey + 3.4, 1.1); fill(ctx, 'rgba(255,255,255,0.8)');
        ctx.restore();
        if (cov < 0.97) { ctx.beginPath(); ctx.moveTo(X - 9, top + tl * 0.72); ctx.lineTo(X + 9, top - tl * 0.72); stroke(ctx, OL(), lw * 0.95); }
        else { ctx.beginPath(); ctx.moveTo(X - 7, ey + 1); ctx.quadraticCurveTo(X, ey + 5, X + 7, ey + 1); stroke(ctx, OL(), lw * 0.9); }
        if (M.bags) { ctx.beginPath(); ctx.moveTo(X - 7, ey + 10); ctx.quadraticCurveTo(X, ey + 14, X + 7, ey + 10); stroke(ctx, A.hex(K.ink, 0.55), lw * 0.55); }
      }
      // brows: inner end toward the face centre
      const xi = X - s * 8, xo = X + s * 8;
      const bc = K.ink, blw = lw * 1.15;
      if (M.brow === 'angry') brow(ctx, xo, ey - 20, xi, ey - 13, -1, blw, bc);
      else if (M.brow === 'droop') brow(ctx, xo, ey - 13, xi, ey - 17, 1, blw, bc);
      else if (M.brow === 'worry') brow(ctx, xo, ey - 15, xi, ey - 21, 1, blw, bc);
      else brow(ctx, xo, ey - 24, xi, ey - 25, 3, blw, bc);
    }
    // mouth
    const my = cy + 6;
    const lip = clamp(o.mouth ?? A.mouth(o.who || brand, t));
    let yawn = o.yawn ?? (mood === 'sleepy' ? (() => { const u = frac(t / 7.3 + A.hash(seed + 1)); return u < 0.22 ? Math.sin(u / 0.22 * Math.PI) : 0; })() : 0);
    const moodOpen = mood === 'panting' ? 0.32 + 0.3 * (0.5 + 0.5 * br) : mood === 'shock' ? 0.55 : M.min;
    const mo = Math.max(lip, moodOpen, yawn * 0.95);
    const mw = mood === 'shock' ? 9 : mood === 'sleepy' ? 9 + yawn * 3 : 12;
    mouthShape(ctx, fx * 1.1, my, mw, mo, lip > 0.1 ? M.curve * 0.4 : M.curve, mood === 'grumpy' ? -2 * f : 0, lw * 0.9, { depth: mood === 'shock' ? 10 : 11, wavy: mood === 'grumpy' });
    if (mood === 'panting') { // tongue out
      const tx = fx * 1.1 + 2 * f, tyy = my + 3 + mo * 10;
      ctx.beginPath(); ctx.moveTo(tx - 4.5, tyy - 3); ctx.quadraticCurveTo(tx - 5, tyy + 6 + br, tx, tyy + 7 + br); ctx.quadraticCurveTo(tx + 5, tyy + 6 + br, tx + 4.5, tyy - 3); ctx.closePath();
      fs(ctx, '#e5788c', lw * 0.6); ctx.beginPath(); ctx.moveTo(tx, tyy - 1); ctx.lineTo(tx, tyy + 3); stroke(ctx, 'rgba(120,30,50,0.5)', 1);
    }

    // ---- held sign
    if (sign > 0.01) {
      const [hx, hy] = hands.find(h => h[2]);
      const wob = Math.sin(t * 2.3 + ph) * 0.05 + (1 - signE) * 0.3 * f;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(wob);
      ctx.globalAlpha *= clamp(sign * 4);
      const stickTop = -b - 30, bw = 84, bh = 32;
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, stickTop); stroke(ctx, OL(), 6.5); stroke(ctx, '#b48a58', 3.5);
      ctx.save(); ctx.translate(0, stickTop - bh / 2 + 4); ctx.rotate(-0.04 * f);
      A.rrect(ctx, -bw / 2, -bh / 2, bw, bh, 3);
      ctx.fillStyle = A.linear(ctx, 0, -bh / 2, 0, bh / 2, [[0, '#e9d7ae'], [1, '#d4bd8d']]); ctx.fill(); stroke(ctx, OL(), lw * 0.8);
      ctx.beginPath(); ctx.moveTo(-bw / 2 + 6, bh / 2 - 5); ctx.lineTo(bw / 2 - 30, bh / 2 - 6); stroke(ctx, 'rgba(120,90,50,0.25)', 1.2);
      A.text(ctx, 'ממתין בתור', 0, 1, { font: '800 17px Rubik', fill: '#3a2a3e', dir: 'rtl' });
      ctx.restore();
      mitt(ctx, 0, 0, 6.5, mittCol, lw);
      ctx.restore();
    }
    ctx.restore();

    // ---- floating FX (unrotated)
    ctx.save(); ctx.translate(x, y - (o.hop || 0) * scale); ctx.scale(scale, scale);
    const headY = cy - b;
    if (spin > 0.01) {
      const k = A.ease.outBack(clamp(spin * 1.2));
      const sx = -a * 0.05 * f, sy = headY - 34 + Math.sin(t * 2 + ph) * 2;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k); ctx.globalAlpha *= clamp(spin * 3);
      circle(ctx, 0, 0, 17); ctx.fillStyle = 'rgba(28,24,48,0.72)'; ctx.fill(); stroke(ctx, 'rgba(210,215,230,0.5)', 1.5);
      spinnerDots(ctx, 0, 0, 10, t, '235,238,245', 2.6);
      ctx.restore();
    }
    if (mood === 'sleepy' && !o.noZ) {
      for (let i = 0; i < 2; i++) {
        const u = frac(t * 0.3 + i * 0.5 + A.hash(seed)), zz = 9 + u * 8;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
        A.text(ctx, 'z', f * (a * 0.75 + u * 18 + Math.sin(u * 6) * 3), cy - b * 0.9 - u * 30, { font: `700 ${zz}px Fredoka`, fill: '#e3e8f0', stroke: OL(), lw: 3 });
      }
      ctx.globalAlpha = 1;
    }
    if (mood === 'shock') {
      A.text(ctx, '!', f * a * 0.95, headY - 8, { font: '900 28px Fredoka', fill: '#fff4a8', stroke: OL(), lw: 4 });
      for (let i = 0; i < 3; i++) { const an = -Math.PI / 2 + (i - 1) * 0.5 - f * 0.1; const r0 = b + 14, r1 = b + 24; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r0 * 0.9, cy + Math.sin(an) * r0); ctx.lineTo(Math.cos(an) * r1 * 0.9, cy + Math.sin(an) * r1); stroke(ctx, OL(), 3); }
    }
    const sweat = o.sweat ?? (mood === 'panting' ? 1 : 0);
    if (sweat > 0.02) {
      for (let i = 0; i < 2; i++) {
        const u = frac(t * 0.9 + i * 0.5 + A.hash(seed + 7));
        ctx.globalAlpha = sweat * Math.sin(u * Math.PI);
        sweatDrop(ctx, (i ? -1 : 1) * f * (a * 0.95 + u * 8), cy - b * 0.55 + u * 18, 3.4, 1.8, (i ? 0.3 : -0.3) * f);
      }
      ctx.globalAlpha = 1;
    }
    if (mood === 'panting') { // breath puffs in rhythm
      const u = frac(t * M.br + ph / TAU);
      if (u < 0.55) {
        const k = u / 0.55;
        ctx.globalAlpha = 0.55 * Math.sin(k * Math.PI);
        for (let j = 0; j < 3; j++) { circle(ctx, f * (a * 0.35 + k * 22 + j * 5), cy + 10 - k * 6 - j * 2, 3 + k * 4 - j); fill(ctx, '#eef2f8'); }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  };

  // ============================================================== TV BUGS
  function gPath(g, F, bx, by) {
    const W = F * 0.2, capH = F * 0.735, r = (capH - W) / 2, cx = bx + r + W / 2, cy = by - capH / 2;
    g.beginPath();
    g.arc(cx, cy, r, -0.29 * Math.PI, -2 * Math.PI + 0.02, true);
    g.lineTo(cx + r, cy + r * 0.05);
    g.lineTo(cx + r * 0.02, cy + r * 0.05);
    return W;
  }
  function gotvArt(res) {
    return A.layer('pr_gotv_' + res, Math.ceil(240 * res), Math.ceil(100 * res), g => {
      g.scale(res, res);
      const F = 52, by = 70, skew = -0.14, depth = 4;
      g.font = `900 ${F}px Rubik`;
      const advG = F * 0.755, tW = g.measureText('T').width, vW = g.measureText('V').width;
      const ringD = F * 0.8, gapL = F * 0.1, gapR = F * 0.03;
      const total = advG + gapL + ringD + gapR + tW * 0.97 + vW;
      const x0 = 120 - total / 2 + 4;
      const xG = x0, ring = { cx: x0 + advG + gapL + ringD / 2 - F * 0.03, cy: by - F * 0.355, r: ringD / 2 - F * 0.02, w: F * 0.2 };
      const xT = x0 + advG + gapL + ringD + gapR, xV = xT + tW * 0.97;
      const SK = () => g.transform(1, 0, skew, 1, -skew * by, 0);
      // shape(mode): 'fill' uses fillStyle; 'line' strokes with extra width lw
      const shape = (mode, dx, dy, lw = 0) => {
        g.save(); SK();
        const col = mode === 'fill' ? g.fillStyle : g.strokeStyle;
        const Wg = gPath(g, F, xG + dx, by + dy); g.lineCap = 'butt'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = Wg + lw; g.stroke();
        g.beginPath(); g.arc(ring.cx + dx, ring.cy + dy, ring.r, 0, TAU); g.lineWidth = ring.w + lw; g.stroke();
        g.lineWidth = lw; g.lineJoin = 'round';
        if (mode === 'fill') { g.fillStyle = col; g.fillText('T', xT + dx, by + dy); g.fillText('V', xV + dx, by + dy); }
        else { g.strokeText('T', xT + dx, by + dy); g.strokeText('V', xV + dx, by + dy); }
        g.restore();
      };
      g.textBaseline = 'alphabetic';
      // soft dark drop shadow for legibility on busy footage
      g.save(); g.shadowColor = 'rgba(0,0,10,0.75)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.strokeStyle = '#060818'; shape('line', 0, 0, F * 0.075); g.restore();
      // extrusion
      g.strokeStyle = '#060818'; for (let d = depth; d >= 1; d--) shape('line', d * 0.45, d, F * 0.075);
      for (let d = depth; d >= 1; d--) { g.fillStyle = A.mixc('#081446', '#1f4fbf', 1 - d / depth); shape('fill', d * 0.45, d); }
      g.strokeStyle = '#060818'; shape('line', 0, 0, F * 0.075);
      g.strokeStyle = '#2f63e0'; shape('line', 0, 0, F * 0.036);
      g.fillStyle = A.linear(g, 0, by - F * 0.75, 0, by, [[0, '#fff7c2'], [0.34, '#ffe04a'], [0.55, '#ffd21f'], [1, '#f39a00']]); shape('fill', 0, 0);
      // top gloss line
      g.save(); g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.beginPath(); g.rect(0, by - F * 0.76, 240, F * 0.14); g.clip(); g.globalAlpha = 0.35; shape('fill', 0, 0); g.restore();
      // ring inner disc + play triangle
      g.save(); SK();
      const ri = ring.r - ring.w / 2;
      circle(g, ring.cx, ring.cy, ri); g.fillStyle = A.radial(g, ring.cx - ri * 0.3, ring.cy - ri * 0.3, 0, ri * 1.2, [[0, '#3f7dff'], [0.6, '#1f4fbf'], [1, '#0b1f6e']]); g.fill();
      g.lineWidth = F * 0.03; g.strokeStyle = '#060818'; g.stroke();
      const pr = ri * 0.58;
      g.beginPath(); g.moveTo(ring.cx - pr * 0.5, ring.cy - pr * 0.85); g.lineTo(ring.cx + pr, ring.cy); g.lineTo(ring.cx - pr * 0.5, ring.cy + pr * 0.85); g.closePath();
      g.fillStyle = A.linear(g, 0, ring.cy - pr, 0, ring.cy + pr, [[0, '#fffbe0'], [1, '#ffd21f']]); g.fill(); g.lineWidth = F * 0.025; g.lineJoin = 'round'; g.strokeStyle = '#060818'; g.stroke();
      g.restore();
    });
  }
  A.drawGOTVBug = (ctx, x, y, s = 1, o = {}) => {
    const al = clamp(o.alpha ?? 1); if (al <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= al;
    const res = resOf(eff(ctx, 1));
    ctx.drawImage(gotvArt(res), -120, -52, 240, 100);
    if (o.shine != null && o.shine > 0 && o.shine < 1) {
      const sx = -110 + o.shine * 220;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.transform(1, 0, -0.35, 1, 0, 0);
      ctx.fillStyle = A.linear(ctx, sx - 18, 0, sx + 18, 0, [[0, 'rgba(255,255,230,0)'], [0.5, 'rgba(255,255,230,0.55)'], [1, 'rgba(255,255,230,0)']]);
      ctx.fillRect(sx - 18, -34, 36, 56); ctx.restore();
    }
    if (o.live) {
      A.rrect(ctx, -26, 26, 52, 17, 8.5); fill(ctx, '#e0283e'); stroke(ctx, 'rgba(6,8,24,0.8)', 1.5);
      circle(ctx, -15, 34.5, 3.2); fill(ctx, `rgba(255,255,255,${0.55 + 0.45 * Math.abs(Math.sin((o.t || 0) * 3))})`);
      A.text(ctx, 'LIVE', 5, 35.5, { font: '800 12px Rubik', fill: '#ffffff' });
    }
    ctx.restore();
  };
  function oldArt(res) {
    return A.layer('pr_oldbug_' + res, Math.ceil(200 * res), Math.ceil(64 * res), g => {
      g.scale(res, res); g.translate(100, 32);
      A.rrect(g, -86, -23, 172, 46, 10); g.fillStyle = 'rgba(58,60,68,0.62)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(190,192,200,0.35)'; g.stroke();
      // tired little TV icon (right side, Hebrew reads from the right)
      g.save(); g.translate(60, 2);
      g.strokeStyle = '#9da0a8'; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-3, -9); g.lineTo(-9, -17); g.moveTo(2, -9); g.lineTo(9, -15); g.stroke();
      A.rrect(g, -14, -9, 28, 20, 4); g.fillStyle = '#4c4f58'; g.fill(); g.stroke();
      g.fillStyle = '#7d8089'; A.rrect(g, -10, -5.5, 20, 13, 2); g.fill();
      g.strokeStyle = '#4c4f58'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-2, 0); g.moveTo(2, 0); g.lineTo(6, 0); g.stroke(); // sleepy eyes
      g.restore();
      g.font = '500 23px Rubik'; g.direction = 'rtl'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#b4b7bf';
      g.fillText('הספק הישן', 40, 2);
    });
  }
  A.drawOldProviderBug = (ctx, x, y, s = 1, o = {}) => {
    const al = clamp(o.alpha ?? 0.85); if (al <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= al;
    ctx.drawImage(oldArt(resOf(eff(ctx, 1))), -100, -32, 200, 64);
    ctx.restore();
  };

  // ============================================================== SWITCH OVERLAY
  A.drawSwitchOverlay = (ctx, x, y, w, h, t, o = {}) => {
    const p = clamp(o.p ?? 0), al = clamp(o.alpha ?? 1);
    if (p <= 0 || al <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= al;
    const u = Math.min(w / 440, h / 248), cx = x + w / 2, cy = y + h / 2;
    const dim = A.smooth(0, 0.1, p), done = A.smooth(0.8, 0.86, p);
    ctx.fillStyle = `rgba(6,8,30,${0.74 * dim})`; ctx.fillRect(x, y, w, h);
    // faint blue scan sweep while switching
    if (p < 0.82) { const sy = y + frac(t * 0.8) * h; ctx.fillStyle = A.linear(ctx, 0, sy - 30 * u, 0, sy, [[0, 'rgba(80,140,255,0)'], [1, 'rgba(80,140,255,0.12)']]); ctx.fillRect(x, sy - 30 * u, w, 30 * u); }
    // gold burst behind the card
    if (done > 0) {
      ctx.save(); ctx.translate(cx, cy); ctx.globalCompositeOperation = 'lighter';
      const rot = t * 0.4, R = Math.hypot(w, h) * 0.7;
      for (let i = 0; i < 16; i++) {
        const a0 = rot + (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a0 + TAU / 40); ctx.closePath();
        ctx.fillStyle = `rgba(255,200,60,${0.16 * done})`; ctx.fill();
      }
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 180 * u, [[0, `rgba(255,220,110,${0.55 * done})`], [1, 'rgba(255,200,60,0)']]); ctx.fillRect(-w, -h, 2 * w, 2 * h);
      ctx.restore();
    }
    // card
    const pop = A.ease.outBack(A.inv(0.04, 0.16, p)), bump = 1 + 0.08 * Math.sin(Math.PI * A.inv(0.8, 0.9, p));
    const cw = 290 * u, ch = 132 * u;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop * bump, pop * bump);
    A.rrect(ctx, -cw / 2, -ch / 2, cw, ch, 18 * u);
    ctx.fillStyle = A.linear(ctx, 0, -ch / 2, 0, ch / 2, [[0, '#1b2466'], [1, '#0b1034']]); ctx.fill();
    ctx.lineWidth = 3 * u; ctx.strokeStyle = A.mixc('#6f7fd8', '#ffd21f', 0.35 + 0.65 * done); ctx.stroke();
    A.rrect(ctx, -cw / 2 + 5 * u, -ch / 2 + 5 * u, cw - 10 * u, ch * 0.4, 14 * u); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    const a1 = 1 - done;
    if (a1 > 0) {
      ctx.save(); ctx.globalAlpha *= a1;
      A.drawGOTVBug(ctx, 0, -32 * u, 0.62 * u, {});
      A.text(ctx, 'עובר ל-GOTV...', 0, 12 * u, { font: `700 ${25 * u}px Rubik`, fill: '#ffffff', dir: 'rtl' });
      const bw = 230 * u, bh = 14 * u, by = 40 * u;
      A.rrect(ctx, -bw / 2, by, bw, bh, bh / 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); ctx.lineWidth = 1.5 * u; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
      const prog = A.ease.inOut(A.inv(0.14, 0.78, p)), fw = Math.max(bh, bw * prog);
      if (prog > 0) {
        ctx.save(); A.rrect(ctx, -bw / 2, by, fw, bh, bh / 2); ctx.clip();
        ctx.fillStyle = A.linear(ctx, 0, by, 0, by + bh, [[0, '#fff1a0'], [0.5, '#ffd21f'], [1, '#f39a00']]); ctx.fillRect(-bw / 2, by, fw, bh);
        for (let i = 0; i < 12; i++) { const sx = -bw / 2 + ((i * 22 + t * 60 * u / u * u) % (bw + 40 * u)) - 20 * u; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, by + bh); ctx.lineTo(sx + 8 * u, by); ctx.lineTo(sx + 14 * u, by); ctx.lineTo(sx + 6 * u, by + bh); ctx.fill(); }
        ctx.restore();
        A.glow(ctx, -bw / 2 + fw, by + bh / 2, 22 * u, '#ffe680', 0.8);
      }
    }
    if (done > 0) {
      ctx.save(); ctx.globalAlpha *= done;
      const ck = A.ease.outBack(A.inv(0.8, 0.9, p)), R = 30 * u;
      ctx.save(); ctx.translate(0, -22 * u); ctx.scale(ck, ck);
      circle(ctx, 0, 0, R); ctx.fillStyle = A.radial(ctx, -R * 0.3, -R * 0.3, 0, R * 1.2, [[0, '#fff3a0'], [0.6, '#ffd21f'], [1, '#e88f00']]); ctx.fill();
      ctx.lineWidth = 3 * u; ctx.strokeStyle = '#060818'; ctx.stroke();
      const dl = A.inv(0.82, 0.92, p);
      ctx.beginPath(); ctx.moveTo(-R * 0.45, 0); ctx.lineTo(-R * 0.1, R * 0.35); ctx.lineTo(R * 0.5, -R * 0.35);
      ctx.setLineDash([R * 2, R * 2]); ctx.lineDashOffset = R * 2 * (1 - dl);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 7 * u; ctx.strokeStyle = '#0d1033'; ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      A.text(ctx, 'GOTV פעיל', 0, 36 * u, { font: `900 ${30 * u}px Rubik`, fill: '#ffd21f', stroke: '#060818', lw: 5 * u, dir: 'rtl' });
      ctx.restore();
    }
    ctx.restore();
    // sparkles + flash
    if (done > 0) {
      for (let i = 0; i < 12; i++) {
        const k = A.inv(0.8, 1, p), a = (i / 12) * TAU + A.hash(i) * 0.4, r = (60 + 140 * A.ease.out(k) * (0.6 + 0.4 * A.hash(i + 3))) * u;
        sparkle(ctx, cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.8, (7 + 6 * A.hash(i + 5)) * u * (1 - k * 0.7), 1 - k * 0.6, '#fff1a8');
      }
      const fl = A.inv(0.8, 0.82, p) * (1 - A.inv(0.82, 0.9, p));
      if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,245,210,${0.6 * fl})`; ctx.fillRect(x, y, w, h); ctx.restore(); }
    }
    ctx.restore();
  };

  // ============================================================== QUEUE SIGN
  function queueArt(res) {
    return A.layer('pr_queue_' + res, Math.ceil(360 * res), Math.ceil(140 * res), g => {
      g.scale(res, res); g.translate(180, 70);
      const W = 320, H = 104;
      // metal frame
      A.rrect(g, -W / 2, -H / 2, W, H, 12); g.fillStyle = A.linear(g, 0, -H / 2, 0, H / 2, [[0, '#5d6470'], [0.5, '#3c424d'], [1, '#2a2f38']]); g.fill();
      g.lineWidth = 4; g.strokeStyle = OL(); g.stroke();
      // light box face (sickly fluorescent)
      const fx0 = -W / 2 + 9, fy0 = -H / 2 + 9, fw = W - 18 - 96, fh = H - 18;
      A.rrect(g, fx0, fy0, fw, fh, 7); g.fillStyle = A.linear(g, 0, fy0, 0, fy0 + fh, [[0, '#eef5ea'], [0.5, '#dde9d9'], [1, '#c7d6c5']]); g.fill();
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(20,30,20,0.4)'; g.stroke();
      // a dead bug silhouette in the corner of the lightbox (bureaucratic realism)
      g.fillStyle = 'rgba(40,50,40,0.25)'; A.ellipse(g, fx0 + 14, fy0 + fh - 12, 3, 1.8, 0.4); g.fill();
      g.font = '800 38px Rubik'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#29323d';
      g.fillText('ממתין בתור', fx0 + fw / 2, fy0 + 30);
      g.direction = 'ltr'; g.font = '700 15px Rubik'; if ('letterSpacing' in g) g.letterSpacing = '3px'; g.fillStyle = '#4a5663';
      g.fillText('WAITING IN LINE', fx0 + fw / 2 + 1.5, fy0 + 62); if ('letterSpacing' in g) g.letterSpacing = '0px';
      // LED panel
      const lx = W / 2 - 9 - 90, ly = -H / 2 + 9, lw = 90, lh = H - 18;
      A.rrect(g, lx, ly, lw, lh, 7); g.fillStyle = '#120d12'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.15)'; g.stroke();
      g.font = '600 13px Rubik'; g.direction = 'rtl'; g.fillStyle = '#a58b8b'; g.fillText('מספר בתור', lx + lw / 2, ly + 15);
      // screws
      for (const [sx, sy] of [[-W / 2 + 5, -H / 2 + 5], [W / 2 - 5, -H / 2 + 5], [-W / 2 + 5, H / 2 - 5], [W / 2 - 5, H / 2 - 5]]) { circle(g, sx, sy, 2.2); g.fillStyle = '#9aa1ab'; g.fill(); }
      // eyelets
      for (const sx of [-110, 110]) { circle(g, sx, -H / 2 + 8, 5); g.lineWidth = 2.6; g.strokeStyle = '#b8bec8'; g.stroke(); g.lineWidth = 1; g.strokeStyle = OL(); g.stroke(); }
    });
  }
  A.drawQueueSign = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t ?? 0, al = clamp(o.alpha ?? 1); if (al <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= al;
    if (o.hang) { for (const sx of [-110, 110]) { for (let k = 0; k < Math.ceil(o.hang / 9); k++) { A.ellipse(ctx, sx, -44 - 5 - k * 9, 2.4, 5, 0); stroke(ctx, '#8d939d', 2); } } }
    const flick = clamp(o.flicker ?? 0.5);
    const n = A.noise1(t * 9.3), hardOff = flick > 0 && A.hash(Math.floor(t * 12) + 5) < 0.06 * flick;
    const lum = hardOff ? 0.35 : 1 - flick * 0.12 * (0.5 + 0.5 * n);
    // glow behind lightbox
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.28 * lum;
    ctx.drawImage(glowSprite('#cfe8d8'), -230, -120, 460, 240); ctx.restore();
    ctx.drawImage(queueArt(resOf(eff(ctx, 1))), -180, -70, 360, 140);
    if (lum < 1) { A.rrect(ctx, -151, -43, 320 - 18 - 96, 86, 7); fill(ctx, `rgba(20,30,40,${(1 - lum) * 0.6})`); }
    // LED digits
    const num = String(Math.max(0, Math.floor(o.ticket ?? 347))).padStart(4, '0');
    const lx = 160 - 9 - 45, ly = 12;
    ctx.font = '700 34px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,60,50,0.12)'; ctx.fillText('8888', lx, ly);
    ctx.save(); ctx.shadowColor = 'rgba(255,50,40,0.9)'; ctx.shadowBlur = 8 * Math.min(2, eff(ctx, 1));
    ctx.fillStyle = '#ff4a3d'; ctx.fillText(num, lx, ly); ctx.restore();
    ctx.restore();
  };
})();
