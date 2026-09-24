// ============================================================================
// S6 · "Last mile" · 41.5–46.0
//   SH1 41.50–43.47  STREET oner: light streak erupts from the snow at the pole base, Bit rockets up the pole
//                    (low dutch angle), pops over the crossarm, anticipation crouch on the insulator, ZIPS along the
//                    service wire (snow puffs knocked off, energised wire, binary trail) — camera pulls back for the
//                    street + CN Tower reveal, then pushes into the warm window.        "Last mile… last meter…"
//   SH2 43.47–44.42  MACRO behind the TV cabinet: Bit bursts out of the wall jack, races along a giant CAT6 cable,
//                    hurdles a lost Bamba puff, dust bunnies blown, a 10-agorot coin glints, leaps up-frame.
//   SH3 44.42–45.35  ROUTER hero shot (giant from Bit's scale): lands on the shelf, anticipation crouch, "Delivered!"
//                    dive → 44.9 IMPACT (2 impact frames), shake, sparks, shockwave, all LEDs flare gold, bloom→white.
//   SH4 45.35–46.00  White settles onto the TV close-up: frozen picture, spinner 99% → gold pulse → 100%.
// ============================================================================
(() => {
  const cl = A.clamp, L = A.lerp, H = A.hash, TAU = Math.PI * 2, PI = Math.PI;
  const GOLD = '#ffc93c';

  // ---------------------------------------------------------------- helpers
  // Hermite spline over keys [[t,[v...]],...] with finite-difference tangents (smooth, no stops at keys)
  function spline(t, ks) {
    const n = ks.length;
    if (t <= ks[0][0]) return ks[0][1].slice();
    if (t >= ks[n - 1][0]) return ks[n - 1][1].slice();
    let i = 0; while (t > ks[i + 1][0]) i++;
    const [t0, v0] = ks[i], [t1, v1] = ks[i + 1], h = t1 - t0, u = (t - t0) / h;
    const tan = j => { if (j <= 0 || j >= n - 1) return ks[j][1].map(() => 0); const a = ks[j - 1], b = ks[j + 1]; return a[1].map((x, k) => (b[1][k] - x) / (b[0] - a[0])); };
    const m0 = tan(i), m1 = tan(i + 1), u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return v0.map((x, k) => h00 * x + h10 * h * m0[k] + h01 * v1[k] + h11 * h * m1[k]);
  }
  const dot = () => A.layer('s6:dot', 64, 64, g => { g.fillStyle = A.radial(g, 32, 32, 0, 32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.85)'], [0.75, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 64, 64); });
  const additive = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  // invert a monotonic function f on [a,b] for value v
  const invert = (f, v, a, b) => { let lo = a, hi = b; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (f(m) < v) lo = m; else hi = m; } return (lo + hi) / 2; };

  // Closed-form particle burst (snow / dust / sparks). Each particle: ballistic with drag.
  function burst(ctx, x0, y0, t0, t, o) {
    const age = t - t0; if (age < 0 || age > (o.life || 1.2) * 1.4) return;
    const n = o.n || 14, spr = dot(), g = o.g ?? 900, drag = o.drag ?? 3;
    ctx.save(); if (o.add) ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) {
      const s = (o.seed || 0) * 13.7 + k * 1.91;
      const life = (o.life || 1.2) * (0.55 + 0.6 * H(s + 0.7)); if (age > life) continue;
      const a = (o.dir ?? -PI / 2) + (H(s + 0.1) - 0.5) * (o.spread ?? 2.2);
      const sp = (o.speed || 400) * (0.3 + 0.9 * H(s + 0.3));
      const d = (1 - Math.exp(-drag * age)) / drag;
      const x = x0 + Math.cos(a) * sp * d + (o.wind || 0) * age + (H(s + 5) - 0.5) * (o.jit || 0);
      const y = y0 + Math.sin(a) * sp * d + 0.5 * g * age * age * 0.5;
      const f = 1 - age / life, r = (o.size || 6) * (0.5 + H(s + 0.9)) * (o.grow ? 1 + age * o.grow : 1);
      if (o.streak) {
        const vx = Math.cos(a) * sp * Math.exp(-drag * age), vy = Math.sin(a) * sp * Math.exp(-drag * age) + g * age * 0.5;
        ctx.strokeStyle = o.color || '#fff'; ctx.globalAlpha = cl(f * 1.3) * (o.alpha ?? 1); ctx.lineWidth = r * 0.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * o.streak, y - vy * o.streak); ctx.stroke();
      } else {
        ctx.globalAlpha = cl(f * 1.5) * (o.alpha ?? 1);
        ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
      }
    }
    ctx.restore();
  }
  // soft cloud puff (growing, fading)
  function puff(ctx, x, y, t0, t, r0, col = '235,242,255', a0 = 0.7, life = 0.7) {
    const age = t - t0; if (age < 0 || age > life) return;
    const p = age / life, r = r0 * (0.5 + 1.4 * A.ease.out(p));
    ctx.save(); ctx.globalAlpha = a0 * (1 - p) * (1 - p);
    ctx.fillStyle = A.radial(ctx, x, y - p * r0 * 0.3, 0, r, [[0, `rgba(${col},0.9)`], [0.5, `rgba(${col},0.4)`], [1, `rgba(${col},0)`]]);
    ctx.fillRect(x - r, y - r - p * r0 * 0.3, r * 2, r * 2); ctx.restore();
  }
  // radial speed-lines (screen space)
  function speedLines(ctx, cx, cy, t, a, n = 46, col = '255,255,255', r0 = 380) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const s = i * 3.3 + Math.floor(t * 30) * 0.37, ang = H(i * 1.7) * TAU + (H(s) - 0.5) * 0.05;
      const rr = r0 + H(s + 1) * 260, len = 300 + H(s + 2) * 700, w = 1.5 + H(s + 3) * 5;
      const c = Math.cos(ang), sn = Math.sin(ang);
      ctx.globalAlpha = a * (0.25 + 0.6 * H(s + 4));
      ctx.fillStyle = `rgb(${col})`;
      ctx.beginPath(); ctx.moveTo(cx + c * rr - sn * w, cy + sn * rr + c * w); ctx.lineTo(cx + c * (rr + len), cy + sn * (rr + len)); ctx.lineTo(cx + c * rr + sn * w, cy + sn * rr - c * w); ctx.fill();
    }
    ctx.restore();
  }
  // horizontal speed streaks across screen
  function streaks(ctx, t, a, col = '255,230,170', n = 22, dir = -1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const y = 60 + H(i * 2.3) * 900, sp = 2600 + H(i + 3) * 3000, len = 200 + H(i + 5) * 500;
      const x = ((H(i + 7) * 3000 + dir * t * sp) % 3000 + 3000) % 3000 - 500;
      ctx.globalAlpha = a * (0.15 + 0.35 * H(i + 9));
      ctx.fillStyle = A.linear(ctx, x, 0, x + len, 0, [[0, `rgba(${col},0)`], [0.7, `rgba(${col},1)`], [1, `rgba(${col},0)`]]);
      ctx.fillRect(x, y, len, 1.5 + H(i + 11) * 3);
    }
    ctx.restore();
  }
  function whiteOut(ctx, a, col = '255,255,255') { if (a <= 0) return; ctx.save(); ctx.fillStyle = `rgba(${col},${cl(a)})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }

  // ======================================================================================================
  // SH1 · STREET
  // ======================================================================================================
  const S = A.STREET || { wire: [[612, 214], [1728, 353]], attach: [1728, 353], window: { cx: 1788, cy: 427 } };
  const WIRE = S.wire, ATT = S.attach, WPT = [S.window.cx, S.window.cy];
  const T_CL1 = 42.10, T_HOP = 42.25, T_LAUNCH = 42.40, T_WIRE1 = 43.24, T_WIN = 43.47;
  const uWire = t => { const p = A.inv(T_LAUNCH, T_WIRE1, t); return p * p * (3 - 2 * p) * 0.35 + p * p * 0.2 + p * 0.45; };
  const wireAt = u => {
    const f = cl(u) * (WIRE.length - 1), i = Math.min(WIRE.length - 2, Math.floor(f)), k = f - i, a = WIRE[i], b = WIRE[i + 1];
    return [L(a[0], b[0], k), L(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  // Bit's world position on the street set (feet), rotation and scale
  function streetPos(t) {
    if (t < T_CL1) {
      const p = A.inv(41.5, T_CL1, t), e = 1 - Math.pow(1 - p, 2.1);
      return { x: 492 + Math.sin(p * 11) * 2, y: L(1260, 250, e), rot: 0, sc: 0.62, ph: 'climb' };
    }
    if (t < T_HOP) {
      const p = A.inv(T_CL1, T_HOP, t);
      return { x: L(492, 612, A.ease.inOut(p)), y: L(250, 212, p) - Math.sin(p * PI) * 95, rot: 0.3 * Math.sin(p * PI), sc: 0.62, ph: 'hop' };
    }
    if (t < T_LAUNCH) return { x: 612, y: 212, rot: 0, sc: 0.62, ph: 'crouch' };
    if (t < T_WIRE1) {
      const u = uWire(t), w = wireAt(u);
      return { x: w[0], y: w[1] - 2, rot: w[2] * 0.8, sc: L(0.6, 0.46, u), ph: 'wire', u };
    }
    const p = A.inv(T_WIRE1, T_WIN, t), e = A.ease.in(p);
    return { x: L(ATT[0], WPT[0], e), y: L(ATT[1], WPT[1] + 20, e) - Math.sin(p * PI) * 26, rot: 0.2, sc: L(0.46, 0.24, p), ph: 'window' };
  }
  const streetCam = t => spline(t, [
    [41.50, [530, 930, 2.25, -0.085]],
    [41.80, [512, 700, 2.0, -0.06]],
    [42.10, [528, 360, 1.78, -0.015]],
    [42.30, [600, 300, 1.62, 0.0]],
    [42.52, [760, 300, 1.45, 0.01]],
    [42.90, [1140, 350, 1.3, 0.02]],
    [43.18, [1560, 380, 1.95, 0.01]],
    [43.47, [1782, 415, 4.6, 0.0]],
  ]);
  // snow-puff emission times along the wire (precomputed, deterministic)
  const WIRE_PUFFS = [];
  for (let i = 1; i < 30; i++) {
    const u = i / 30; if (H(i * 3.7) <= 0.25) continue; // matches the kit's snow-on-wire gaps
    WIRE_PUFFS.push({ u, t0: invert(uWire, u, T_LAUNCH, T_WIRE1), p: wireAt(u), i });
  }
  const T_DRIFT = invert(t => -streetPos(t).y, -990, 41.5, T_CL1); // Bit bursts through the snow drift
  const T_TRANS = invert(t => -streetPos(t).y, -300, 41.5, T_CL1); // passes the transformer can

  function drawStreet(ctx, t, f) {
    const c = streetCam(t);
    const cam = { x: c[0], y: c[1], zoom: c[2] };
    const launchKick = Math.exp(-Math.max(0, t - T_LAUNCH) * 9) * (t > T_LAUNCH ? 1 : 0);
    const shake = 0.25 * launchKick + 0.12 * A.smooth(42.45, 42.6, t) * (1 - A.smooth(43.1, 43.3, t)) + 0.5 * Math.exp(-Math.max(0, t - 41.5) * 8);
    ctx.save();
    // dutch rotation around screen centre (the kit applies its own camera; we rotate the whole frame)
    ctx.translate(960, 540); ctx.rotate(c[3]); ctx.scale(1.02, 1.02); ctx.translate(-960, -540);
    ctx.translate(shake * A.noise1(t * 23) * 10, shake * A.noise1(t * 23 + 50) * 10);
    A.drawTorontoStreet(ctx, t, { cam, snow: 1.1, wind: 0.5, windowGlow: 1 + A.smooth(43.0, 43.45, t) * 2 });
    ctx.save(); A.camera(ctx, cam);
    // building continuation past the near corner (keeps the camera free near the window)
    ctx.fillStyle = A.linear(ctx, 1988, 0, 2300, 0, [[0, '#3a1f2a'], [1, '#2a1520']]); ctx.fillRect(1988, -600, 900, 2200);
    ctx.fillStyle = '#1e141c'; ctx.fillRect(1990, -600, 14, 2200); // drain pipe
    ctx.fillStyle = 'rgba(230,238,255,0.5)'; ctx.fillRect(1990, -600, 4, 2200);

    const b = streetPos(t);
    // ---- wire: strip the snow + energise behind Bit
    if (t > T_LAUNCH) {
      const ub = b.ph === 'wire' ? b.u : 1;
      const pts = WIRE.filter((p, i) => i / (WIRE.length - 1) <= ub + 1e-6);
      const hp = wireAt(ub); pts.push([hp[0], hp[1]]);
      if (pts.length > 1) {
        ctx.save(); ctx.translate(0, -1.6); ctx.strokeStyle = '#0c0c1a'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; A.path(ctx, pts, false); ctx.stroke(); ctx.restore();
        additive(ctx, () => {
          for (let i = 1; i < pts.length; i++) {
            const u = Math.min(ub, (i) / (WIRE.length - 1)), ti = invert(uWire, u, T_LAUNCH, T_WIRE1), age = Math.max(0, t - ti);
            const a = Math.exp(-age * 3.2); if (a < 0.02) continue;
            ctx.strokeStyle = `rgba(255,201,60,${0.35 * a})`; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
            ctx.strokeStyle = `rgba(255,240,190,${0.9 * a})`; ctx.lineWidth = 3; ctx.stroke();
          }
        });
      }
    }
    // ---- snow bursts
    const spr = dot();
    burst(ctx, 492, 990, T_DRIFT, t, { n: 46, speed: 900, spread: 2.4, size: 9, life: 1.1, g: 700, seed: 1, drag: 2.5 });
    puff(ctx, 492, 985, T_DRIFT, t, 190, '235,242,255', 0.9, 0.9);
    burst(ctx, 520, 298, T_TRANS, t, { n: 14, speed: 260, spread: 2.6, size: 5, life: 1.0, g: 600, seed: 2, dir: -PI / 2 + 0.4 });
    burst(ctx, 540, 205, T_CL1 + 0.04, t, { n: 22, speed: 330, spread: 2.2, size: 5.5, life: 1.1, g: 600, seed: 3 });
    puff(ctx, 545, 203, T_CL1 + 0.04, t, 60, '235,242,255', 0.7, 0.6);
    burst(ctx, 612, 206, T_LAUNCH, t, { n: 18, speed: 380, spread: 1.6, size: 5, life: 0.9, g: 700, seed: 4, dir: -PI * 0.75 });
    puff(ctx, 606, 206, T_LAUNCH, t, 55, '255,236,190', 0.8, 0.5);
    for (const w of WIRE_PUFFS) {
      burst(ctx, w.p[0], w.p[1] - 3, w.t0, t, { n: 9, speed: 210, spread: 2.4, size: 4.2, life: 1.2, g: 520, seed: 10 + w.i, wind: 60, jit: 12 });
      puff(ctx, w.p[0], w.p[1] - 4, w.t0, t, 34, '235,242,255', 0.55, 0.7);
      // a clump that falls straight down to the street
      const age = t - w.t0;
      if (age > 0 && age < 1.6 && H(w.i * 5.1) > 0.45) {
        const y = w.p[1] + 260 * age * age + 30 * age, x = w.p[0] + 30 * age;
        ctx.save(); ctx.globalAlpha = 0.85 * (1 - age / 1.6); ctx.drawImage(spr, x - 7, y - 7, 14, 14); ctx.restore();
      }
    }
    // ---- light trail (history of the path), glow, Bit
    const pts = [];
    const N = 26, span = t < T_CL1 ? 0.16 : 0.24;
    for (let k = N; k >= 0; k--) {
      const tk = Math.max(41.46, t - span * k / N), q = streetPos(tk), cc = A.bitCore(q.x, q.y, q.sc);
      pts.push([cc[0], cc[1]]);
    }
    const inWin = A.smooth(43.36, T_WIN, t);
    if (b.ph !== 'crouch' || t - T_HOP < 0.02) A.drawBinaryTrail(ctx, pts, t, { width: 58 * b.sc, size: 26 * b.sc, alpha: 1 - inWin * 0.6, speed: 60 });
    // glow pooled around Bit — lights up pole, wire, snow
    const core = A.bitCore(b.x, b.y, b.sc);
    const pulse = 1 + 0.1 * Math.sin(t * 20);
    A.glow(ctx, core[0], core[1], 260 * b.sc * 2 * pulse, GOLD, 0.45);
    A.glow(ctx, core[0], core[1], 90 * b.sc * 2, '#fff2c0', 0.55);
    // warm reflection on the snow drift while he is low
    if (t < 41.9) additive(ctx, () => {
      const a = A.smooth(41.5, 41.56, t) * (1 - A.smooth(41.6, 41.9, t));
      ctx.globalAlpha = 0.6 * a; ctx.translate(492, 995); ctx.scale(1, 0.25);
      ctx.fillStyle = A.radial(ctx, 0, 0, 0, 380, [[0, GOLD], [1, 'rgba(255,201,60,0)']]); ctx.fillRect(-380, -380, 760, 760);
    });
    // Bit
    const d = 1 / 60, qa = streetPos(t - d), qb = streetPos(t + d);
    const vel = [(qb.x - qa.x) / (2 * d) * cam.zoom, (qb.y - qa.y) / (2 * d) * cam.zoom];
    const o = { t, mood: 'determined', glow: 1.5, light: [0.6, -0.4], rim: '#ffcf8a', trail: 0, look: [1, 0] };
    if (b.ph === 'climb') { o.limbs = 'fly'; o.vel = [vel[0], Math.max(-2600, vel[1])]; o.look = [0.3, -1]; o.boost = 0.5 * (1 - A.inv(41.5, T_CL1, t)); }
    else if (b.ph === 'hop') { o.limbs = 'arms-up'; o.vel = [vel[0] * 0.5, vel[1] * 0.5]; o.rot = b.rot; o.mood = 'joy'; o.look = [1, 0.3]; }
    else if (b.ph === 'crouch') {
      const p = A.inv(T_HOP, T_LAUNCH, t);
      o.limbs = 'crouch'; o.squash = 0.08 + 0.16 * A.ease.out(p); o.rot = -0.08 * p; o.look = [1, 0.25]; o.browRaise = -4;
      o.boost = 0.3 * p;
    } else if (b.ph === 'wire') {
      o.limbs = 'crouch'; o.vel = [vel[0] * 0.8, vel[1] * 0.8]; o.rot = b.rot - 0.12; o.look = [1, 0.15]; o.tagSwing = 2;
      o.armL = [-62, -95]; o.armR = [58, -110];
      if (t > 42.9) o.mood = 'joy';
    } else { o.limbs = 'fly'; o.vel = vel; o.rot = 0.3; o.mood = 'joy'; }
    // grinding sparks off the wire under his feet
    if (t > T_LAUNCH) for (let j = 0; j < 42; j++) {
      const tj = T_LAUNCH + j * 0.02; if (tj > Math.min(t, T_WIRE1)) break; if (t - tj > 0.4) continue;
      const q = streetPos(tj);
      burst(ctx, q.x - 6, q.y + 2, tj, t, { n: 4, speed: 520, dir: -PI + 0.45 + q.rot, spread: 1.1, size: 5, life: 0.35, g: 1400, seed: 200 + j, add: true, streak: 0.022, color: '#ffe08a', drag: 2 });
    }
    A.drawBit(ctx, b.x, b.y, b.sc, o);
    // launch flash
    if (t > T_LAUNCH && t < T_LAUNCH + 0.25) A.glow(ctx, 612, 190, 160, '#fff4c8', 0.9 * (1 - (t - T_LAUNCH) / 0.25));
    ctx.restore();
    ctx.restore();

    // screen-space accents
    // opening: light streak hand-off from S5 + white burst
    if (t < 41.75) {
      const a = 1 - A.smooth(41.5, 41.72, t);
      additive(ctx, () => {
        ctx.globalAlpha = a; const sx = 980 + (492 - 530) * 2.25;
        ctx.fillStyle = A.linear(ctx, sx - 90, 0, sx + 90, 0, [[0, 'rgba(255,201,60,0)'], [0.5, 'rgba(255,248,220,1)'], [1, 'rgba(255,201,60,0)']]);
        ctx.fillRect(sx - 90, -50, 180, 1200);
      });
      whiteOut(ctx, 0.85 * Math.pow(1 - A.smooth(41.5, 41.62, t), 2), '255,246,225');
    }
    // climb speed lines
    if (t < T_CL1) speedLines(ctx, 960, 200, t, 0.22 * (1 - A.inv(41.6, T_CL1, t)), 30, '255,240,210', 520);
    // into the window: warm bloom swallows the frame
    if (t > 43.2) {
      const a = A.smooth(43.28, T_WIN, t);
      A.glow(ctx, 960, 540, 300 + 1400 * a, '#ffb45e', 0.9 * a);
      whiteOut(ctx, Math.pow(a, 2.2) * 0.95, '255,236,200');
    }
  }

  // ======================================================================================================
  // SH2 · MACRO BEHIND THE TV CABINET
  // ======================================================================================================
  const M0 = T_WIN, M1 = 44.42;
  const WALLF = 0.62, FGF = 1.55;       // parallax factors (floor/cable = 1)
  const JACK = [900, 540];              // wall-jack (wall layer world coords)
  const cableY = x => 846 + 14 * Math.sin(x * 0.0042) + 8 * Math.sin(x * 0.011 + 1.3);
  const CAB_R = 28;                     // cable radius
  const BAMBA_X = 2080;
  // Bit on the macro set (floor-layer world). returns feet, rot, phase
  function macroPos(t) {
    if (t < 43.60) { const p = A.inv(M0, 43.60, t); return { ph: 'eject', p }; }
    if (t < 43.84) { const p = A.inv(43.60, 43.84, t), x = L(1180, 1720, p); return { ph: 'run', x, y: cableY(x) - CAB_R + 2, p }; }
    if (t < 44.03) { const p = A.inv(43.84, 44.03, t), x = L(1720, 2460, p); return { ph: 'jump', x, y: L(cableY(1720), cableY(2460), p) - CAB_R - Math.sin(p * PI) * 300, p }; }
    if (t < 44.30) { const p = A.inv(44.03, 44.30, t), x = L(2460, 3120, p); return { ph: 'run', x, y: cableY(x) - CAB_R + 2, p }; }
    const p = A.inv(44.30, M1, t), x = L(3120, 3520, p); return { ph: 'leap', x, y: cableY(3120) - CAB_R - p * 560 + p * p * 60, p };
  }
  const macroCam = t => spline(t, [[M0, [1020, 640, 1.5]], [43.62, [1330, 700, 1.36]], [43.95, [2200, 660, 1.3]], [44.3, [3150, 700, 1.36]], [M1, [3450, 560, 1.45]]]);
  const TIME_AT = x => (x < 1720 ? L(43.60, 43.84, A.inv(1180, 1720, x)) : x < 2460 ? L(43.84, 44.03, A.inv(1720, 2460, x)) : L(44.03, 44.30, A.inv(2460, 3120, x)));

  const wallLayer = () => A.layer('s6:wall', 3400, 1100, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#2a1624'], [0.55, '#3a2030'], [1, '#26141e']]); g.fillRect(0, 0, w, h);
    // subtle wallpaper stripes
    for (let x = 0; x < w; x += 46) { g.fillStyle = 'rgba(255,200,220,0.035)'; g.fillRect(x, 0, 18, h); }
    // dust / scuff texture
    const r = A.rng(7); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(20,8,18,${0.08 + r() * 0.12})`; g.fillRect(r() * w, r() * 700, 2 + r() * 6, 1 + r() * 3); }
    // baseboard
    g.fillStyle = A.linear(g, 0, 700, 0, 790, [[0, '#c9b7ad'], [0.12, '#e6d8cc'], [0.2, '#a89488'], [1, '#6e5c58']]); g.fillRect(0, 700, w, 90);
    g.fillStyle = 'rgba(70,56,60,0.9)'; g.fillRect(0, 700, w, 3);
    g.fillStyle = 'rgba(120,110,120,0.55)'; for (let i = 0; i < 120; i++) { g.beginPath(); g.arc(r() * w, 703 + r() * 4, 1 + r() * 3, 0, TAU); g.fill(); } // dust on the top
    // ethernet wall jack plate
    const [jx, jy] = JACK;
    g.save(); g.translate(jx, jy);
    g.fillStyle = 'rgba(0,0,0,0.35)'; A.rrect(g, -70, -100, 150, 214, 14); g.fill();
    g.fillStyle = A.linear(g, -80, 0, 80, 0, [[0, '#f0e8dc'], [1, '#bdb2a6']]); A.rrect(g, -80, -110, 150, 214, 14); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2a2830'; A.rrect(g, -34, -40, 58, 48, 6); g.fill(); g.fillStyle = '#111018'; g.fillRect(-26, -30, 42, 30);
    g.fillStyle = '#c8a040'; for (let i = 0; i < 8; i++) g.fillRect(-22 + i * 4.6, -30, 2.4, 7);
    g.fillStyle = '#8a8078'; A.ellipse(g, -5, -85, 7, 7); g.fill(); A.ellipse(g, -5, 80, 7, 7); g.fill();
    A.text(g, 'LAN', -5, 40, { font: '700 20px Rubik', fill: '#8a7e74' });
    g.restore();
    // power outlet with a fat plug + cord
    g.save(); g.translate(2300, 540);
    g.fillStyle = A.linear(g, -80, 0, 80, 0, [[0, '#efe6da'], [1, '#b8ada0']]); A.rrect(g, -75, -120, 150, 230, 14); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 4; g.stroke();
    for (const oy of [-55, 45]) { g.fillStyle = '#d8cfc2'; A.rrect(g, -42, oy - 34, 84, 68, 20); g.fill(); g.fillStyle = '#1a1820'; g.fillRect(-20, oy - 16, 7, 24); g.fillRect(13, oy - 16, 7, 24); A.ellipse(g, 0, oy + 18, 7, 8); g.fill(); }
    g.fillStyle = '#23222a'; A.rrect(g, -48, 8, 96, 84, 14); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-40, 14, 80, 8);
    g.strokeStyle = '#1a1920'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 90); g.bezierCurveTo(10, 200, -80, 240, -120, 330); g.stroke();
    g.restore();
    // cobweb in the corner
    g.strokeStyle = 'rgba(220,220,240,0.18)'; g.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(1500, 140); g.lineTo(1500 + Math.cos(i * 0.24 + 0.1) * 300, 140 + Math.sin(i * 0.24 + 0.1) * 300); g.stroke(); }
    for (let k = 1; k < 5; k++) { g.beginPath(); for (let i = 0; i < 7; i++) { const a = i * 0.24 + 0.1, rr = k * 60 + Math.sin(i * 3 + k) * 6; const x = 1500 + Math.cos(a) * rr, y = 140 + Math.sin(a) * rr; i ? g.quadraticCurveTo(1500 + Math.cos(a - 0.12) * (rr - 10), 140 + Math.sin(a - 0.12) * (rr - 10), x, y) : g.moveTo(x, y); } g.stroke(); }
  });
  const bambaSprite = () => A.layer('s6:bamba', 640, 300, g => {
    g.scale(2, 2); g.translate(160, 80);
    const N = 26, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N * 2 - 1, cx = u * 112, cy = -16 * (1 - u * u);
      const nx = 32 * u / 112, ny = -1, nl = Math.hypot(nx, ny);
      const r = 36 * Math.sqrt(Math.max(0.03, 1 - Math.pow(Math.abs(u), 5))) * (1 + 0.08 * Math.sin(u * 9)) + (H(i * 3.1) - 0.5) * 3;
      top.push([cx + nx / nl * r, cy + ny / nl * r]); bot.unshift([cx - nx / nl * r * 0.9, cy - ny / nl * r * 0.9]);
    }
    const P = () => A.blob(g, top.concat(bot));
    g.fillStyle = 'rgba(20,10,5,0.35)'; A.ellipse(g, 6, 44, 130, 14); g.fill();
    P(); g.fillStyle = A.linear(g, 0, -56, 0, 34, [[0, '#ffe9a8'], [0.3, '#f8c65e'], [0.7, '#e59c3c'], [1, '#a8662a']]); g.fill();
    g.save(); P(); g.clip();
    const r = A.rng(31);
    // soft toasted patches + tiny puffed bumps (curved ridges across the puff)
    for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(200,120,40,${0.08 + r() * 0.12})`; A.ellipse(g, (r() - 0.5) * 230, (r() - 0.7) * 60, 10 + r() * 20, 6 + r() * 10, r() * 3); g.fill(); }
    g.strokeStyle = 'rgba(170,100,30,0.35)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 20; i++) { const u = (i + 0.5 + (r() - 0.5) * 0.4) / 20 * 2 - 1, x = u * 112, y = -16 * (1 - u * u); g.beginPath(); g.ellipse(x, y, 5 + r() * 3, 34, u * 0.3, -PI * 0.5, PI * 0.5); g.stroke(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,245,200,${0.25 + r() * 0.3})`; A.ellipse(g, (r() - 0.5) * 220, (r() - 0.8) * 50, 2 + r() * 3, 1.5 + r() * 2); g.fill(); }
    g.fillStyle = 'rgba(255,252,225,0.6)'; g.beginPath(); g.moveTo(-92, -30); g.quadraticCurveTo(0, -60, 92, -30); g.quadraticCurveTo(0, -46, -92, -30); g.fill();
    g.restore();
    P(); g.strokeStyle = A.OUTLINE; g.lineWidth = 4; g.lineJoin = 'round'; g.stroke();
  });
  const dustSprite = seed => A.layer('s6:dust' + seed, 360, 300, g => {
    const r = A.rng(seed * 17 + 3); g.translate(180, 170);
    g.fillStyle = 'rgba(70,64,80,0.9)'; A.blob(g, Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU, rr = 80 + r() * 30; return [Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.85]; })); g.fill();
    g.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const a = r() * TAU, r0 = r() * 90, len = 20 + r() * 60, c = 110 + r() * 90 | 0;
      const x0 = Math.cos(a) * r0 * 1.2, y0 = Math.sin(a) * r0 * 0.85;
      g.strokeStyle = `rgba(${c},${c - 6},${c + 14},${0.25 + r() * 0.4})`; g.lineWidth = 0.8 + r() * 1.6;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a + 0.6) * len * 0.6, y0 + Math.sin(a + 0.6) * len * 0.6, x0 + Math.cos(a + (r() - 0.5)) * len, y0 + Math.sin(a + (r() - 0.5)) * len); g.stroke();
    }
    // a stray curly hair
    g.strokeStyle = 'rgba(40,20,20,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-40, 10); for (let i = 0; i < 30; i++) g.lineTo(-40 + i * 3 + Math.cos(i * 0.9) * 8, 10 + Math.sin(i * 0.9) * 8 - i * 1.5); g.stroke();
  });
  const fgDust = seed => A.layer('s6:fgdust' + seed, 400, 340, g => { g.filter = 'blur(5px) brightness(0.28)'; g.drawImage(dustSprite(seed), 20, 20); });
  const coinSprite = () => A.layer('s6:coin', 300, 140, g => {
    g.translate(150, 70);
    g.fillStyle = '#7a5410'; A.ellipse(g, 0, 8, 120, 44); g.fill();
    g.fillStyle = A.linear(g, -120, 0, 120, 0, [[0, '#c8902a'], [0.45, '#ffe07a'], [1, '#b07a1c']]); A.ellipse(g, 0, 0, 120, 44); g.fill(); g.strokeStyle = A.OUTLINE; g.lineWidth = 3; g.stroke();
    g.strokeStyle = 'rgba(120,80,10,0.6)'; g.lineWidth = 3; A.ellipse(g, 0, 0, 100, 36); g.stroke();
    g.save(); g.scale(1, 0.37);
    A.text(g, '10', -30, -20, { font: '800 64px Rubik', fill: '#9a6a14' });
    // menorah
    g.strokeStyle = '#9a6a14'; g.lineWidth = 5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(40 + i * 9, 40); g.lineTo(40 + i * 9, -30 + Math.abs(i) * 4); g.stroke(); }
    g.beginPath(); g.moveTo(10, 40); g.lineTo(70, 40); g.stroke();
    A.text(g, 'אגורות', -20, 60, { font: '700 36px Rubik', fill: '#9a6a14', dir: 'rtl' });
    g.restore();
  });

  function drawMacro(ctx, t, f) {
    const c = macroCam(t), z = c[2];
    const shake = 0.35 * Math.exp(-Math.max(0, t - M0) * 7) + 0.1;
    const sx = shake * A.noise1(t * 21) * 8, sy = shake * A.noise1(t * 21 + 40) * 8;
    const lay = (fct, fn) => { ctx.save(); ctx.translate(960 + sx * fct, 540 + sy * fct); ctx.scale(z, z); ctx.translate(-(960 + (c[0] - 960) * fct), -(540 + (c[1] - 540) * fct)); fn(); ctx.restore(); };
    const toScr = (x, y, fct) => [960 + sx * fct + (x - (960 + (c[0] - 960) * fct)) * z, 540 + sy * fct + (y - (540 + (c[1] - 540) * fct)) * z];
    const b = macroPos(t);
    // Bit screen/world position (eject phase = from jack to landing, in screen space)
    let bx, by, bScr;
    const land = [1180, cableY(1180) - CAB_R + 2];
    if (b.ph === 'eject') {
      const j = toScr(JACK[0] - 5, JACK[1] - 10, WALLF), l = toScr(land[0], land[1], 1), p = b.p;
      bScr = [L(j[0], l[0], p), L(j[1], l[1], p) - Math.sin(p * PI) * 170];
    }
    // ---- wall
    lay(WALLF, () => {
      ctx.drawImage(wallLayer(), 0, 0);
      // jack flash
      const jf = Math.exp(-Math.max(0, t - M0) * 8);
      A.glow(ctx, JACK[0] - 5, JACK[1] - 15, 260, GOLD, 0.9 * jf); A.glow(ctx, JACK[0] - 5, JACK[1] - 15, 90, '#ffffff', jf);
    });
    // ambient: TV light leaking over the top, lamp light from the left gap
    additive(ctx, () => {
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, 500, [[0, 'rgba(90,240,200,0.28)'], [1, 'rgba(90,240,200,0)']]); ctx.fillRect(0, 0, 1920, 500);
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const x0 = ((i * 700 - (c[0] - 1000) * 0.8) % 2800 + 2800) % 2800 - 400;
        ctx.fillStyle = A.linear(ctx, x0, 150, x0 + 300, 1080, [[0, 'rgba(255,170,90,0.0)'], [0.4, 'rgba(255,170,90,0.16)'], [1, 'rgba(255,170,90,0)']]);
        ctx.beginPath(); ctx.moveTo(x0, 150); ctx.lineTo(x0 + 120, 150); ctx.lineTo(x0 + 460, 1080); ctx.lineTo(x0 + 200, 1080); ctx.fill();
      }
    });
    // ---- floor (perspective planks)
    lay(1, () => {
      const x0 = c[0] - 960 / z - 200, x1 = c[0] + 960 / z + 200;
      ctx.fillStyle = A.linear(ctx, 0, 760, 0, 1300, [[0, '#3a2418'], [0.3, '#5a3a24'], [1, '#6e4a2c']]); ctx.fillRect(x0, 760, x1 - x0, 700);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x0, 760, x1 - x0, 26); // contact shadow under the baseboard
      // board rows
      for (let k = 0; k < 6; k++) { const y = 800 + k * k * 22 + k * 30; ctx.fillStyle = 'rgba(20,10,5,0.5)'; ctx.fillRect(x0, y, x1 - x0, 2 + k * 0.6); }
    });
    // perspective seams (parallax gradient 0.7 → 1.35 from top to bottom)
    ctx.save(); ctx.strokeStyle = 'rgba(20,10,5,0.55)'; ctx.lineWidth = 2.5;
    for (let s = -2; s < 16; s++) {
      const wx = s * 380 + 200;
      const a = toScr(wx, 770, 0.8), bb = toScr(wx, 1100, 1.35);
      if (Math.max(a[0], bb[0]) < -100 || Math.min(a[0], bb[0]) > 2020) continue;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bb[0], bb[1]); ctx.stroke();
    }
    ctx.restore();
    // dust on floor
    lay(1, () => {
      const r = A.rng(5); ctx.fillStyle = 'rgba(190,180,200,0.35)';
      for (let i = 0; i < 160; i++) { const x = r() * 4200, y = 790 + Math.pow(r(), 1.5) * 300; ctx.fillRect(x, y, 2 + r() * 5, 1.5 + r() * 2); }
    });
    // ---- props behind the cable
    lay(1, () => {
      // dust bunny 1 (blown when Bit passes)
      const dx = 1520, tp = TIME_AT(dx), age = Math.max(0, t - tp);
      const blow = t > tp ? 1 - Math.exp(-age * 4) : 0;
      ctx.save(); ctx.translate(dx + blow * 90, 800 - blow * 30 + blow * blow * 20); ctx.rotate(blow * 0.8); ctx.drawImage(dustSprite(1), -180, -170, 360, 300); ctx.restore();
      burst(ctx, dx, 780, tp, t, { n: 26, speed: 380, spread: 2.2, size: 7, life: 1.4, g: 80, seed: 21, dir: -PI / 2 + 0.6, drag: 2, alpha: 0.55 });
      // coin, glinting
      ctx.drawImage(coinSprite(), 2650 - 150, 900 - 70);
      const tc = TIME_AT(2650), ga = Math.exp(-Math.abs(t - tc) * 6);
      additive(ctx, () => { A.glow(ctx, 2620, 890, 160, '#ffe08a', 0.6 * ga); });
      if (ga > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(2600, 880); ctx.rotate(t * 2); ctx.fillStyle = `rgba(255,250,220,${ga})`; for (let k = 0; k < 4; k++) { ctx.rotate(PI / 2); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(70 * ga, 0); ctx.lineTo(0, 4); ctx.fill(); } ctx.restore(); }
      // cabinet leg (turned wood foot)
      for (const lx of [1560, 3700]) {
        ctx.fillStyle = A.linear(ctx, lx - 50, 0, lx + 50, 0, [[0, '#2a160e'], [0.4, '#6a4028'], [1, '#1e0e08']]);
        A.blob(ctx, [[lx - 40, 250], [lx + 40, 250], [lx + 46, 460], [lx + 30, 640], [lx + 52, 760], [lx + 30, 800], [lx - 30, 800], [lx - 52, 760], [lx - 30, 640], [lx - 46, 420]]);
        A.fillStroke(ctx, null, 0); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 4; ctx.stroke();
      }
    });
    // ---- cable (drop from jack + long run)
    {
      const j = toScr(JACK[0] - 5, JACK[1] + 5, WALLF);
      const pts = []; const xs0 = c[0] - 960 / z - 100, xs1 = Math.min(3200, c[0] + 960 / z + 100);
      const st = toScr(900, cableY(900), 1);
      // drop from jack to floor (screen space bezier)
      ctx.save(); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(j[0], j[1]); ctx.bezierCurveTo(j[0], j[1] + 160 * z, st[0] - 200 * z, st[1], st[0], st[1]);
      for (let x = Math.max(900, xs0); x <= xs1; x += 24) { const p = toScr(x, cableY(x), 1); ctx.lineTo(p[0], p[1]); }
      // end: rises up toward the shelf/router (off right)
      const e0 = toScr(3200, cableY(3200), 1), e1 = toScr(3600, 200, 1);
      ctx.bezierCurveTo(e0[0] + 200 * z, e0[1], e1[0] - 80 * z, e1[1] + 300 * z, e1[0], e1[1]);
      ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = (CAB_R * 2 + 8) * z; ctx.stroke();
      ctx.strokeStyle = '#8fa6d8'; ctx.lineWidth = CAB_R * 2 * z; ctx.stroke();
      ctx.save(); ctx.translate(0, -8 * z); ctx.strokeStyle = '#c4d4f6'; ctx.lineWidth = CAB_R * 0.9 * z; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(0, -15 * z); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4 * z; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(0, 14 * z); ctx.strokeStyle = 'rgba(30,40,90,0.45)'; ctx.lineWidth = CAB_R * 0.7 * z; ctx.stroke(); ctx.restore();
      ctx.restore();
      // printed jacket text
      for (let k = 0; k < 9; k++) {
        const x = 1000 + k * 300; if (x < xs0 || x > xs1) continue;
        const p = toScr(x, cableY(x) + 4, 1), p2 = toScr(x + 10, cableY(x + 10) + 4, 1);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(p2[1] - p[1], p2[0] - p[0])); ctx.scale(z, z);
        A.text(ctx, 'CAT6 · UTP · 24AWG', 0, 0, { font: '700 17px Rubik', fill: 'rgba(40,50,100,0.55)' });
        ctx.restore();
      }
      // energised section behind Bit
      if (b.ph !== 'eject') additive(ctx, () => {
        for (let x = Math.max(900, xs0); x < Math.min(b.x, xs1); x += 24) {
          const age = Math.max(0, t - TIME_AT(x)), a = Math.exp(-age * 3.5); if (a < 0.03) continue;
          const p = toScr(x, cableY(x) - CAB_R + 4, 1), q = toScr(x + 24, cableY(x + 24) - CAB_R + 4, 1);
          ctx.strokeStyle = `rgba(255,220,120,${0.8 * a})`; ctx.lineWidth = 5 * z; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          ctx.strokeStyle = `rgba(255,201,60,${0.18 * a})`; ctx.lineWidth = 40 * z; ctx.stroke();
        }
      });
    }
    // ---- Bamba puff on the cable (hurdled; kicked into a tumble)
    lay(1, () => {
      const tp = 43.93, age = Math.max(0, t - tp);
      const hop = t > tp ? 150 * Math.exp(-age * 3) * Math.abs(Math.sin(age * 9)) : 0;
      const rot = t > tp ? -0.9 * (1 - Math.exp(-age * 5)) + 0.12 * Math.exp(-age * 4) * Math.sin(age * 20) : 0;
      const bxx = BAMBA_X + (t > tp ? 140 * (1 - Math.exp(-age * 3)) : 0);
      const wob = 1 + 0.06 * Math.exp(-age * 6) * Math.sin(age * 40) * (t > tp ? 1 : 0);
      ctx.save(); ctx.translate(bxx, cableY(BAMBA_X) - CAB_R - 30 - hop); ctx.rotate(rot); ctx.scale(wob, 2 - wob);
      ctx.scale(1.3, 1.3); ctx.drawImage(bambaSprite(), -160, -80, 320, 150); ctx.restore();
      // crumbs knocked off
      burst(ctx, BAMBA_X, cableY(BAMBA_X) - 70, tp, t, { n: 16, speed: 420, spread: 2.4, size: 5, life: 1.1, g: 1500, seed: 33, drag: 1.5, alpha: 0.9 });
    });
    // ---- Bit
    let core;
    {
      const sc = 1.15;
      if (b.ph === 'eject') {
        const [x, y] = bScr, d = 1 / 60;
        ctx.save(); A.drawBinaryTrail(ctx, [toScr(JACK[0], JACK[1], WALLF), [x, y - 70]], t, { width: 60, size: 30, alpha: 0.9 });
        A.glow(ctx, x, y - 70, 420, GOLD, 0.5);
        A.drawBit(ctx, x, y, sc * z * (0.55 + 0.45 * A.ease.out(b.p)), { t, mood: 'determined', limbs: 'fly', vel: [2400, -1200 + 2600 * b.p], glow: 1.6, trail: 0, rot: 0.3 });
        ctx.restore();
        core = [x, y - 70];
      } else {
        const pts = [];
        for (let k = 22; k >= 0; k--) { const tk = t - 0.2 * k / 22; if (tk < 43.6) continue; const q = macroPos(tk); const cc = A.bitCore(q.x, q.y, sc); pts.push(toScr(cc[0], cc[1], 1)); }
        if (pts.length > 1) A.drawBinaryTrail(ctx, pts, t, { width: 64 * z, size: 30 * z, speed: 80 });
        const cc = A.bitCore(b.x, b.y, sc); core = toScr(cc[0], cc[1], 1);
        A.glow(ctx, core[0], core[1], 520 * z, GOLD, 0.5);
        A.glow(ctx, core[0], core[1], 160 * z, '#fff2c0', 0.45);
        const qa = macroPos(t - 1 / 60), qb = macroPos(t + 1 / 60);
        const vel = [(qb.x - qa.x) * 30 * z, (qb.y - qa.y) * 30 * z];
        const p = toScr(b.x, b.y, 1);
        const o = { t, mood: 'determined', glow: 1.5, trail: 0, vel, look: [1, 0], light: [0.2, -1], rim: '#9ff5d0' };
        if (b.ph === 'run') { o.limbs = 'run'; o.runRate = 6.5; }
        if (b.ph === 'jump') { o.limbs = 'arms-up'; o.mood = 'joy'; o.rot = -0.25 + 0.5 * b.p; o.look = [0.5, 0.8]; }
        if (b.ph === 'leap') { o.limbs = 'fly'; o.look = [0.6, -1]; o.boost = 0.6; }
        A.drawBit(ctx, p[0], p[1], sc * z, o);
      }
    }
    // Bit's light on the whole set (additive warm key that travels with him)
    additive(ctx, () => { ctx.globalAlpha = 0.35; ctx.fillStyle = A.radial(ctx, core[0], core[1], 0, 900, [[0, 'rgba(255,190,80,0.6)'], [0.5, 'rgba(255,160,60,0.15)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, 1920, 1080); });
    // ---- floating dust motes (lit by Bit), multiple depths
    {
      const spr = dot();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 70; i++) {
        const fct = 0.7 + H(i * 1.3) * 1.1, wx = H(i * 2.1) * 4400, wy = 120 + H(i * 3.7) * 760 + Math.sin(t * 0.8 + i) * 20;
        const p = toScr(wx + Math.sin(t * 0.6 + i * 2) * 30, wy, fct);
        if (p[0] < -40 || p[0] > 1960) continue;
        const dd = Math.hypot(p[0] - core[0], p[1] - core[1]), lit = Math.exp(-dd / 420);
        const r = (2 + H(i * 4.4) * 5) * fct;
        ctx.globalAlpha = 0.15 + 0.85 * lit; ctx.drawImage(spr, p[0] - r, p[1] - r, r * 2, r * 2);
      }
      ctx.restore();
    }
    // ---- cabinet underside (ceiling) + foreground silhouettes
    lay(1.12, () => {
      const x0 = c[0] - 1400, x1 = c[0] + 1400;
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, 350, [[0, '#120a0c'], [0.85, '#24140f'], [1, '#3a2418']]); ctx.fillRect(x0, -400, x1 - x0, 750);
      ctx.fillStyle = 'rgba(255,190,120,0.3)'; ctx.fillRect(x0, 346, x1 - x0, 4);
      for (let k = 0; k < 30; k++) { const x = Math.floor(x0 / 260) * 260 + k * 260; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, 200, 3, 146); }
    });
    lay(FGF, () => {
      // big out-of-focus dust bunny + cable loop in front
      for (const [fx, fy, sz, sd] of [[2900, 1140, 2.4, 2], [1250, 1180, 1.8, 3]]) {
        const tp = TIME_AT(fx - 250), age = Math.max(0, t - tp), blow = t > tp ? 1 - Math.exp(-age * 3) : 0;
        ctx.save(); ctx.translate(fx + blow * 160, fy - blow * 50); ctx.rotate(blow * 0.5); ctx.scale(sz, sz);
        ctx.drawImage(fgDust(sd), -200, -190, 400, 340); ctx.restore();
      }

    });
    // speed streaks & vignette darkening
    streaks(ctx, t, 0.5 * (b.ph === 'run' || b.ph === 'jump' ? 1 : 0.4));
    ctx.save(); ctx.fillStyle = A.radial(ctx, core[0], core[1], 300, 1300, [[0, 'rgba(10,4,12,0)'], [1, 'rgba(10,4,12,0.55)']]); ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    // entry flash from the window push
    whiteOut(ctx, Math.pow(1 - A.smooth(M0, M0 + 0.14, t), 2) * 0.95, '255,236,200');
  }

  // ======================================================================================================
  // SH3 · ROUTER HERO SHOT
  // ======================================================================================================
  const R0 = M1, R1 = 45.35, T_IMP = 44.9;
  const RT = { x: 1250, y: 900, s: 3.3 };
  const LED = A.routerLED ? A.routerLED(RT.x, RT.y, RT.s) : [1032, 768];
  const T_LAND = 44.52, T_JUMP = 44.66;
  function routerBitPos(t) {
    if (t < T_LAND) { const p = A.inv(R0, T_LAND, t); return { ph: 'up', x: L(230, 470, p), y: L(1250, 900, p) - Math.sin(p * PI * 0.9) * 180, p }; }
    if (t < T_JUMP) { const p = A.inv(T_LAND, T_JUMP, t); return { ph: 'crouch', x: 470, y: 900, p }; }
    const p = A.inv(T_JUMP, T_IMP, t), e = p;
    // arc to the LED (feet target so that his core lands on the LED); shrinks as he's sucked in
    const sc = p > 0.7 ? 1.25 * L(1, 0.3, A.ease.in((p - 0.7) / 0.3)) : 1.25;
    const tx = LED[0], ty = LED[1] + 62 * sc;
    return { ph: 'dive', x: L(470, tx, e), y: L(900, ty, e) - Math.sin(p * PI) * 560 * (1 - p), p, sc };
  }
  const shelfLayer = () => A.layer('s6:shelf', 2400, 1400, (g, w, h) => {
    g.translate(240, 160);
    // back panel
    g.fillStyle = A.linear(g, 0, -160, 0, 900, [[0, '#1a0f14'], [0.6, '#2c1a1c'], [1, '#3a2220']]); g.fillRect(-240, -160, w, 1060);
    const r = A.rng(12);
    for (let i = 0; i < 60; i++) { const y = r() * 900 - 150; g.strokeStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(-240, y); g.bezierCurveTo(500, y + (r() - 0.5) * 30, 1200, y + (r() - 0.5) * 30, 2200, y + (r() - 0.5) * 20); g.stroke(); }
    // shelf underside above (top band)
    g.fillStyle = A.linear(g, 0, -160, 0, 70, [[0, '#0e080a'], [1, '#2a1812']]); g.fillRect(-240, -160, w, 230);
    g.fillStyle = 'rgba(160,250,220,0.35)'; g.fillRect(-240, 66, w, 4);
    // side panel (left) in perspective
    g.fillStyle = A.linear(g, -240, 0, 240, 0, [[0, '#4a2c22'], [1, '#2a1812']]); A.path(g, [[-240, -160], [120, 70], [120, 900], [-240, 1300]]); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(120, 70); g.lineTo(120, 900); g.stroke();
    // cable holes & cables at the back
    g.fillStyle = '#0a0608'; A.ellipse(g, 1650, 520, 70, 60); g.fill();
    g.strokeStyle = '#141018'; g.lineCap = 'round'; g.lineWidth = 26;
    g.beginPath(); g.moveTo(1650, 520); g.bezierCurveTo(1700, 700, 1900, 760, 2150, 860); g.stroke();
    g.lineWidth = 18; g.strokeStyle = '#1e1a24'; g.beginPath(); g.moveTo(1640, 540); g.bezierCurveTo(1560, 700, 1650, 820, 1580, 900); g.stroke();
    // shelf top surface
    g.fillStyle = A.linear(g, 0, 900, 0, 1240, [[0, '#6a4228'], [0.2, '#7e5030'], [1, '#4a2c1a']]); g.fillRect(-240, 900, w, 340);
    for (let i = 0; i < 40; i++) { const y = 905 + Math.pow(r(), 1.4) * 330; g.strokeStyle = `rgba(40,20,10,${0.15 + r() * 0.25})`; g.lineWidth = 1 + r() * 2.5; g.beginPath(); g.moveTo(-240, y); g.bezierCurveTo(600, y + (r() - 0.5) * 16, 1400, y + (r() - 0.5) * 16, 2200, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-240, 898, w, 10);
    // dust fuzz on the shelf
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(200,190,210,${0.12 + r() * 0.2})`; g.fillRect(r() * w - 240, 915 + r() * 300, 2 + r() * 6, 1 + r() * 2); }
    // front lip (lit by room)
    g.fillStyle = A.linear(g, 0, 1170, 0, 1240, [[0, '#9a6a40'], [0.3, '#c4905a'], [1, '#3a2014']]); g.fillRect(-240, 1170, w, 70);
  });
  function drawRouterShot(ctx, t, f) {
    const k = t - T_IMP, post = k >= 0;
    const imp = post ? Math.exp(-k * 6) : 0;
    const c = spline(t, [[R0, [860, 640, 1.0, 0.03]], [T_JUMP, [900, 650, 1.06, 0.0]], [T_IMP, [1010, 720, 1.42, -0.04]], [T_IMP + 0.12, [1020, 700, 1.2, 0.03]], [R1, [1030, 700, 1.3, 0.0]]]);
    const shake = post ? 2.2 * Math.exp(-k * 5) : 0.06;
    const cam = { x: c[0], y: c[1], zoom: c[2], rot: c[3], shake, t };
    ctx.save(); A.camera(ctx, cam);
    ctx.drawImage(shelfLayer(), -240 - 240, -160 - 160 + 0, 2400, 1400);
    // light ambience: TV spill from above (cyan), lamp from left
    additive(ctx, () => {
      ctx.fillStyle = A.linear(ctx, 0, 60, 0, 600, [[0, 'rgba(120,250,210,0.25)'], [1, 'rgba(120,250,210,0)']]); ctx.fillRect(-300, 60, 2600, 540);
      ctx.fillStyle = A.linear(ctx, -300, 0, 800, 0, [[0, 'rgba(255,170,90,0.28)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(-300, -200, 1100, 1500);
    });
    // cable arriving from below-left, over the shelf lip, into the router's back
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(150, 1400); ctx.bezierCurveTo(260, 1120, 360, 930, 700, 915); ctx.bezierCurveTo(1000, 905, 1150, 900, 1300, 860);
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 50; ctx.stroke(); ctx.strokeStyle = '#8fa6d8'; ctx.lineWidth = 42; ctx.stroke();
    ctx.save(); ctx.translate(0, -7); ctx.strokeStyle = '#c4d4f6'; ctx.lineWidth = 16; ctx.stroke(); ctx.restore();
    ctx.restore();
    // energised cable (Bit came along it)
    additive(ctx, () => { ctx.globalAlpha = 0.5 * (1 - A.smooth(R0, T_IMP, t)) + 0.6 * imp; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(150, 1400); ctx.bezierCurveTo(260, 1120, 360, 930, 700, 890); ctx.stroke(); });

    // router with jolt (squash & stretch around its feet)
    const jol = post ? Math.exp(-k * 7) * Math.sin(k * 38) : 0;
    const anticip = A.smooth(T_JUMP + 0.12, T_IMP, t) * (post ? 0 : 1); // router "flinches" as Bit comes in
    ctx.save(); ctx.translate(RT.x, RT.y); ctx.scale(1 + 0.07 * jol - 0.015 * anticip, 1 - 0.09 * jol + 0.02 * anticip); ctx.rotate(post ? 0.04 * Math.exp(-k * 6) * Math.sin(k * 30) : 0); ctx.translate(-RT.x, -RT.y);
    const ledGlow = post ? 3 * (0.7 + 0.3 * Math.exp(-k * 4)) + 0.3 * Math.sin(k * 40) * imp : A.smooth(T_JUMP, T_IMP, t) * 1.4 + 0.3;
    A.drawRouter(ctx, RT.x, RT.y, RT.s, { t, activity: post ? 1 : 0.55, ledGlow, shake: post ? 1.5 * Math.exp(-k * 5) : 0, ledColor: post ? '#ffd36a' : '#7ff6ff' });
    // all small LEDs flare after impact
    if (post) additive(ctx, () => {
      for (const lx of [-40, -18, 4, 26, 48, 70]) {
        const q = [RT.x + lx * RT.s, RT.y - 41 * RT.s];
        A.glow(ctx, q[0], q[1], 60 + 60 * imp, lx % 44 === 4 ? '#58c8ff' : '#9fffb0', 0.5 + 0.5 * imp);
      }
    });
    ctx.restore();

    // Bit
    if (!post) {
      const b = routerBitPos(t), sc = 1.25;
      const d = 1 / 60, qa = routerBitPos(t - d), qb = routerBitPos(t + d), vel = [(qb.x - qa.x) * 30 * c[2], (qb.y - qa.y) * 30 * c[2]];
      // trail
      const pts = [];
      for (let i = 20; i >= 0; i--) { const tk = t - 0.18 * i / 20; if (tk < R0) continue; const q = routerBitPos(tk); if (q.ph === 'crouch' && b.ph === 'crouch') continue; const cc = A.bitCore(q.x, q.y, sc); pts.push(cc); }
      if (pts.length > 1) A.drawBinaryTrail(ctx, pts, t, { width: 70, size: 32 });
      const core = A.bitCore(b.x, b.y, sc);
      A.glow(ctx, core[0], core[1], 480, GOLD, 0.45);
      const o = { t, glow: 1.6, trail: 0, vel, light: [-0.7, -0.6], rim: '#9ff5d0', shadow: b.ph === 'crouch' ? 0.8 : 0 };
      let S2 = sc;
      if (b.ph === 'up') { o.limbs = 'fly'; o.mood = 'determined'; o.look = [1, -0.2]; }
      else if (b.ph === 'crouch') {
        const p = b.p;
        o.limbs = p < 0.15 ? 'stand' : 'crouch'; o.mood = 'determined'; o.look = [1, -0.35];
        o.squash = p < 0.15 ? 0.35 * (1 - p / 0.15) : 0.1 + 0.32 * A.ease.out((p - 0.15) / 0.85); // land-squash → anticipation
        o.rot = -0.22 * A.smooth(0.15, 1, p); o.browRaise = -5; o.boost = 0.5 * p;
      } else {
        const p = b.p;
        o.limbs = 'fly'; o.mood = 'joy'; o.look = [1, 0.4]; o.stretch = 1.2;
        o.rot = L(-0.5, 0.9, p);
        S2 = b.sc;
      }
      A.drawBit(ctx, b.x, b.y, S2, o);
      // anticipation energy gather
      if (b.ph === 'crouch') additive(ctx, () => {
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 3, rr = 180 * (1 - ((t * 3 + i * 0.1) % 1)); ctx.fillStyle = `rgba(255,220,120,${0.6 * b.p})`; A.ellipse(ctx, core[0] + Math.cos(a) * rr, core[1] + Math.sin(a) * rr, 4, 4); ctx.fill(); }
      });
      // LED "suck" lines just before impact
      if (b.ph === 'dive' && b.p > 0.6) {
        const a = A.inv(0.6, 1, b.p);
        additive(ctx, () => { ctx.strokeStyle = `rgba(200,255,255,${0.7 * a})`; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + 0.3, r0 = 50 + 200 * (1 - a), r1 = r0 + 90; ctx.beginPath(); ctx.moveTo(LED[0] + Math.cos(an) * r0, LED[1] + Math.sin(an) * r0); ctx.lineTo(LED[0] + Math.cos(an) * r1, LED[1] + Math.sin(an) * r1); ctx.stroke(); } });
      }
    } else {
      // IMPACT: shockwave rings, sparks, light rays, dust shaken off the router top
      additive(ctx, () => {
        for (const [dl, sp, w, col] of [[0, 2600, 18, '255,240,190'], [0.05, 1700, 8, '160,250,255']]) {
          const kk = k - dl; if (kk < 0) continue;
          const r = sp * kk * (1 - kk * 0.6), a = Math.exp(-kk * 5);
          ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = w * (1 + kk * 3); A.ellipse(ctx, LED[0], LED[1], r, r * 0.8); ctx.stroke();
        }
        // god rays out of the LED
        ctx.save(); ctx.translate(LED[0], LED[1]); ctx.rotate(k * 0.4);
        for (let i = 0; i < 14; i++) {
          const an = i / 14 * TAU + H(i) * 0.3, len = (900 + H(i + 3) * 900) * (0.4 + 0.6 * A.ease.out(cl(k / 0.2))), wd = 18 + H(i + 5) * 40;
          ctx.save(); ctx.rotate(an); ctx.globalAlpha = (0.25 + 0.3 * H(i + 7)) * (0.6 + 0.4 * imp);
          ctx.fillStyle = A.linear(ctx, 0, 0, len, 0, [[0, 'rgba(255,240,190,1)'], [1, 'rgba(255,201,60,0)']]);
          ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(len, -wd); ctx.lineTo(len, wd); ctx.lineTo(0, 4); ctx.fill(); ctx.restore();
        }
        ctx.restore();
      });
      burst(ctx, LED[0], LED[1], T_IMP, t, { n: 70, speed: 1900, spread: TAU, size: 9, life: 0.8, g: 1800, seed: 77, drag: 2.2, add: true, streak: 0.035, color: '#ffe08a', dir: -PI / 2 });
      burst(ctx, LED[0], LED[1], T_IMP, t, { n: 40, speed: 1300, spread: TAU, size: 7, life: 0.7, g: 1400, seed: 91, drag: 2.5, add: true, streak: 0.03, color: '#a8f7ff', dir: -PI / 2 });
      burst(ctx, RT.x, RT.y - 98 * RT.s, T_IMP + 0.02, t, { n: 30, speed: 300, spread: 2.8, size: 6, life: 1.2, g: 900, seed: 5, alpha: 0.6, jit: 500 });
      A.glow(ctx, LED[0], LED[1], 500 + 300 * imp, '#fff2c0', 0.8 * (0.5 + 0.5 * imp));
      // bloom takes over → white
      const bl = A.smooth(45.08, R1, t);
      A.glow(ctx, LED[0], LED[1], 400 + 2400 * bl, '#fff6dc', bl);
    }
    ctx.restore();
    // screen-space: impact speed lines + white
    if (post) {
      const L2 = [960 + (LED[0] - c[0]) * c[2], 540 + (LED[1] - c[1]) * c[2]];
      speedLines(ctx, L2[0], L2[1], t, 0.9 * Math.exp(-k * 5), 60, '255,245,215', 260);
      whiteOut(ctx, Math.pow(A.smooth(45.12, R1, t), 1.5), '255,250,238');
    } else if (t > T_JUMP) {
      const L2 = [960 + (LED[0] - c[0]) * c[2], 540 + (LED[1] - c[1]) * c[2]];
      speedLines(ctx, L2[0], L2[1], t, 0.35 * A.smooth(T_JUMP, T_IMP, t), 40, '200,250,255', 420);
    }
    // cut in from the macro shot: quick flash
    whiteOut(ctx, 0.6 * Math.pow(1 - A.smooth(R0, R0 + 0.08, t), 2), '255,236,200');

    // IMPACT FRAMES (2 frames): #1 white paper + black ink rays, #2 inverted image
    if (f === Math.round(T_IMP * 30)) {
      ctx.save(); ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, 1920, 1080);
      const L2 = [960 + (LED[0] - c[0]) * c[2], 540 + (LED[1] - c[1]) * c[2]];
      ctx.fillStyle = A.OUTLINE;
      for (let i = 0; i < 48; i++) { const an = i / 48 * TAU + H(i) * 0.1, r0 = 90 + H(i + 1) * 160, w = 6 + H(i + 2) * 22; ctx.beginPath(); ctx.moveTo(L2[0] + Math.cos(an) * r0, L2[1] + Math.sin(an) * r0); ctx.lineTo(L2[0] + Math.cos(an - w / 1400) * 2400, L2[1] + Math.sin(an - w / 1400) * 2400); ctx.lineTo(L2[0] + Math.cos(an + w / 1400) * 2400, L2[1] + Math.sin(an + w / 1400) * 2400); ctx.fill(); }
      A.ellipse(ctx, L2[0], L2[1], 70, 70); ctx.fill();
      ctx.fillStyle = '#fffaf0'; A.ellipse(ctx, L2[0], L2[1], 40, 40); ctx.fill();
      ctx.restore();
    } else if (f === Math.round(T_IMP * 30) + 1) {
      ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
  }

  // ======================================================================================================
  // SH4 · TV CLOSE-UP (hand-off to S7)
  // ======================================================================================================
  function drawTVShot(ctx, t, f) {
    const tv = A.LR ? A.LR.tv : { x: 1255, y: 350, w: 440, h: 248 };
    const p = A.inv(R1, 46.0, t);
    const zoom = L(3.55, 4.42, A.ease.out(p));
    const cx = tv.x + tv.w / 2, cy = tv.y + tv.h / 2;
    const pct = t < 45.74 ? 99 : 100;
    ctx.save(); A.camera(ctx, { x: cx, y: cy + (1 - A.ease.out(p)) * 14, zoom });
    A.drawLivingRoom(ctx, t, { tvGlow: 0.6 });
    A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'freeze', matchT: 1.5, freezeGlitch: 0.55, spinner: 1, bufferPct: pct });
    // the data arriving: gold wave sweeping up the screen, then the spinner lights gold
    const sc = Math.max(tv.w / 1920, tv.h / 1080), ox = tv.x + (tv.w - 1920 * sc) / 2, oy = tv.y + (tv.h - 1080 * sc) / 2;
    const sp = [ox + 960 * sc, oy + 520 * sc];
    ctx.save(); ctx.beginPath(); ctx.rect(tv.x, tv.y, tv.w, tv.h); ctx.clip();
    additive(ctx, () => {
      const w = A.inv(45.5, 45.78, t);
      if (w > 0 && w < 1) {
        const y = L(tv.y + tv.h + 40, tv.y - 40, A.ease.inOut(w));
        ctx.fillStyle = A.linear(ctx, 0, y - 50, 0, y + 50, [[0, 'rgba(255,201,60,0)'], [0.5, 'rgba(255,225,140,0.75)'], [1, 'rgba(255,201,60,0)']]);
        ctx.fillRect(tv.x, y - 50, tv.w, 100);
      }
      const g = A.smooth(45.7, 45.8, t);
      if (g > 0) {
        ctx.save(); ctx.translate(sp[0], sp[1]); ctx.scale(sc, sc);
        ctx.strokeStyle = `rgba(255,201,60,${0.9 * g})`; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(0, 0, 84, 0, TAU); ctx.stroke();
        ctx.restore();
        A.glow(ctx, sp[0], sp[1], 90 * (1 + 0.3 * g), GOLD, 0.7 * g);
      }
    });
    ctx.restore();
    ctx.restore();
    // white from the router flash settles; slight rise again toward the S7 unfreeze flash
    whiteOut(ctx, Math.pow(1 - A.smooth(R1, 45.72, t), 1.6), '255,250,238');
    whiteOut(ctx, 0.3 * A.smooth(45.84, 46.0, t), '255,248,230');
  }

  A.scene({
    name: 's6_lastmile', start: 41.5, end: 46.0,
    draw(ctx, s) {
      const t = s.t, f = s.f;
      ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, 1920, 1080);
      if (t < T_WIN) drawStreet(ctx, t, f);
      else if (t < M1) drawMacro(ctx, t, f);
      else if (t < R1) drawRouterShot(ctx, t, f);
      else drawTVShot(ctx, t, f);
    },
  });
})();
