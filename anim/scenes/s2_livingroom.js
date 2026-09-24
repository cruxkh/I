// ============================================================================
// S2 · "Buffering" · global 6.2–21.0 · Toronto living room.
// Shots (global t):
//   A 6.20–7.45  exterior: snowy street, push-in on our lit window, frost dissolve inside   (caption טורונטו · 15:47)
//   B 7.00–10.30 interior: open close on Saba ("Noa!"), pull back to the master, gentle drift
//   C 10.30–12.55 two-shot, Noa: "Saba, breathe. It's just football."   (sip, smug)
//   D 12.55–13.75 Saba MCU: "Just football?"  (indignant, at Noa)
//   E 13.75–14.20 medium: Saba launches out of the chair, "Go, go..."
//   F 14.20–14.95 TV insert full screen: striker breaks away... 14.5 FREEZE, glitch, spinner
//   G 14.95–17.30 Saba frozen mid-rise, 15.2 snap zoom to his face, spinner in his glasses, headHands
//   H 17.30–21.00 master → Noa hops off the pouf, sock-slides, crouches at the router → push into LED → white-cyan flash
// Everything is a pure function of t.
// ============================================================================
(() => {
  const LR = A.LR, E = A.ease, K = A.key, cl = A.clamp, lerp = A.lerp, inv = A.inv, sm = A.smooth, D = Math.PI / 180;
  const FREEZE = 14.5;
  const SAB = { x: LR.chair.x, y: LR.chair.y, s: 0.95 };
  const NOA_S = 0.95;
  const ROUTER = LR.router;
  const LED = A.routerLED(ROUTER.x, ROUTER.y, ROUTER.s);

  // ------------------------------------------------------------ helpers
  // gesture sequence: [[tStart, gesture, blendDur], ...] -> {gesture, gestureFrom, gestureK}
  function gseq(t, seq) {
    let i = 0; while (i + 1 < seq.length && t >= seq[i + 1][0]) i++;
    const [t0, g, d] = seq[i];
    if (i === 0 || !d) return { gesture: g };
    const k = cl((t - t0) / d);
    return k >= 1 ? { gesture: g } : { gesture: g, gestureFrom: seq[i - 1][1], gestureK: k };
  }
  function mseq(t, seq) {
    let i = 0; while (i + 1 < seq.length && t >= seq[i + 1][0]) i++;
    const [t0, m, d] = seq[i];
    if (i === 0 || !d) return { mood: m };
    const k = cl((t - t0) / d);
    return k >= 1 ? { mood: m } : { mood: m, moodFrom: seq[i - 1][1], moodK: E.inOut(k) };
  }
  // log-space zoom interpolation between keyframes
  const zkey = (t, ks) => Math.exp(K(t, ks.map(k => [k[0], Math.log(k[1]), k[2]])));

  // TV state (pure function of t)
  function tvState(t) {
    if (t < FREEZE) return { state: 'live' };
    const ft = t - FREEZE;
    const glitch = Math.max(0.3, 1 - ft / 0.7) + (ft > 2.2 && ft < 2.45 ? 0.35 : 0) + (ft > 4.1 && ft < 4.3 ? 0.3 : 0);
    // buffer creeps... and stalls
    const pct = Math.floor(K(t, [[14.65, 0], [15.4, 11, 'out'], [16.2, 23, 'out'], [16.9, 31, 'out'], [17.5, 36, 'out'], [18.6, 37, 'out'], [19.6, 38, 'out']]));
    return { state: 'freeze', freezeGlitch: Math.min(1, glitch), spinner: sm(14.62, 14.85, t), bufferPct: pct };
  }
  function tvLight(t) {
    if (t < FREEZE) {
      const f = 0.95 + 0.22 * A.noise1(t * 5.3) + 0.1 * A.noise1(t * 13.1 + 4);
      const warm = 0.5 + 0.5 * A.noise1(t * 0.9 + 2);
      return { color: A.mixc('#9ff5d0', '#d6f7a8', warm * 0.5), intensity: f * (t > 13.8 ? 1.15 : 1) };
    }
    const ft = t - FREEZE, burst = Math.exp(-ft * 7) * 1.6;
    return { color: A.mixc('#e8f4ff', '#aeb8d4', cl(ft / 0.4)), intensity: 0.62 + burst };
  }
  // cool/desaturate grade after the freeze (screen space)
  function grade(ctx, t, amt) {
    if (amt <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.42 * amt; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28 * amt; ctx.fillStyle = '#9fb0d8'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  }

  // ------------------------------------------------------------ SABA acting
  function sabaO(t) {
    const o = { t };
    // pose / rise
    const rise = t < 13.84 ? 0
      : t < 17.55 ? K(t, [[13.84, 0], [14.2, 0.62, 'out'], [14.45, 0.9, 'out'], [15.2, 0.9], [15.45, 0.97, 'out']])
        : K(t, [[17.55, 0.97], [17.72, 1.0, 'out'], [18.2, 0, 'in']]);
    o.pose = rise > 0.001 ? 'rise' : 'sit'; o.rise = rise;
    // squash accents: anticipation before the rise, landing back in the chair
    o.squash = 0.06 * Math.sin(Math.PI * inv(13.7, 13.9, t)) + 0.1 * Math.exp(-(t - 18.2) * 9) * (t > 18.2 ? Math.cos((t - 18.2) * 24) : 0);
    Object.assign(o, mseq(t, [[0, 'eager'], [9.3, 'tense', 0.35], [12.2, 'eager', 0.4], [15.08, 'horror', 0.3]]));
    Object.assign(o, gseq(t, [[0, 'grip'], [7.12, 'point', 0.32], [8.5, 'fists', 0.25], [9.3, 'grip', 0.3], [12.72, 'point', 0.3], [13.72, 'fists', 0.18], [15.62, 'headHands', 0.34], [18.9, 'none', 0.5]]));
    // eye-lines: TV at right & level, Noa right & below
    const TV = [0.95, -0.12], NOA = [0.55, 0.62], UP = [0.35, -0.95], RT = [0.9, 0.55];
    const lk = (a) => a;
    let look = K(t, [[6.85, TV], [6.98, NOA, 'out'], [7.55, NOA], [7.75, TV, 'out'], [11.85, TV], [12.05, NOA, 'out'], [13.7, NOA], [13.8, TV, 'out'],
      [16.75, TV], [16.95, UP, 'out'], [17.4, UP], [17.6, RT, 'out'], [18.4, RT], [18.6, [0.9, 0.7]]]);
    // quick eye dart during "one one" (to Noa and back: sharing the moment)
    if (t > 8.9 && t < 9.25) look = K(t, [[8.9, TV], [8.97, NOA], [9.18, NOA], [9.25, TV]]);
    o.look = lk(look);
    // head: turn toward Noa = a bit more toward camera + tilt down
    const toNoa = K(t, [[6.85, 0], [7.0, 1, 'out'], [7.55, 1], [7.8, 0], [12.1, 0], [12.3, 1, 'out'], [13.7, 1], [13.78, 0, 'out']]);
    o.headTilt = toNoa * 7 + (t > 12.9 && t < 13.5 ? Math.sin((t - 12.9) * 16) * 3 * (1 - inv(12.9, 13.5, t)) : 0);
    o.turn = 0.25 - toNoa * 0.1;
    // "no, no, no" head shakes
    if (t > 15.45 && t < 17.2) {
      const k = sm(15.45, 15.6, t) * (1 - sm(16.95, 17.2, t));
      o.headTilt += Math.sin((t - 15.45) * 19) * 7 * k;
      o.turn += Math.sin((t - 15.45) * 19 + 0.6) * 0.18 * k;
    }
    // lean
    o.lean = K(t, [[6.2, 0.28], [9.3, 0.3], [9.6, 0.48, 'out'], [12.2, 0.44], [12.55, -0.08, 'outBack'], [13.7, -0.05], [13.9, 0.25, 'out'], [15.2, 0.25], [15.5, -0.12, 'out'], [17.3, -0.05]]);
    // brows: indignation on "Just football?", disbelief
    o.browRaise = K(t, [[12.1, 0], [12.45, 0.55, 'outBack'], [13.6, 0.45], [13.8, 0]]);
    o.scarfWave = K(t, [[13.8, 0], [14.1, 0.9], [14.5, 0.7], [14.6, 0]]);
    o.vel = [0, t > 13.84 && t < 14.45 ? -500 : 0];
    // THE FREEZE: he freezes too, mouth still open on "go!"
    if (t >= 14.9 && t < 15.12) { o.idle = 0; o.breath = 0; o.jaw = 0.5; o.mouth = 0; o.tremble = 0; }
    if (t >= 15.08 && t < 15.3) o.jaw = 0.5 * (1 - inv(15.08, 15.3, t));
    // collapse back into the chair
    if (t > 17.55) { o.tremble = K(t, [[17.55, 1], [18.2, 0.3]]); }
    // TV rim light (right side)
    const L = tvLight(t);
    o.rimColor = L.color; o.light = [0.95, -0.35]; o.rimA = cl(0.35 + 0.35 * L.intensity, 0, 0.9);
    return o;
  }

  // ------------------------------------------------------------ NOA acting
  function noaState(t) {
    const o = { t };
    let x = LR.sofa.x, y = LR.sofa.y;
    if (t < 17.47) {
      o.pose = 'sit'; o.flip = true;
      Object.assign(o, mseq(t, [[0, 'amused'], [14.55, 'neutral', 0.25], [16.95, 'focused', 0.3]]));
      o.gesture = 'mug';
      // flip frame: +x = toward Saba (left). TV is behind her right shoulder.
      const SABA = [0.75, -0.35], TV = [-0.85, -0.25], ROLL = [0.1, -0.95], ROUT = [-0.75, 0.75];
      o.look = K(t, [[6.2, TV], [6.95, TV], [7.1, SABA, 'out'], [7.55, SABA], [7.7, ROLL, 'out'], [8.05, ROLL], [8.25, SABA], [9.8, SABA], [10.0, TV], [10.4, TV], [10.55, SABA, 'out'],
        [13.75, SABA], [13.9, TV, 'out'], [15.15, TV], [15.3, SABA, 'out'], [16.55, SABA], [16.7, ROUT, 'out'], [17.3, ROUT]]);
      o.turn = K(t, [[6.9, -0.35], [7.1, 0.25, 'out'], [9.8, 0.25], [10.05, -0.3], [10.4, -0.3], [10.6, 0.25, 'out'], [13.75, 0.25], [13.9, -0.35, 'out'], [15.15, -0.35], [15.3, 0.25, 'out'], [16.55, 0.25], [16.75, -0.2]]);
      o.mugTilt = K(t, [[8.6, 0], [8.95, 1, 'out'], [9.35, 1], [9.7, 0], [12.4, 0], [12.62, 0.85, 'out'], [12.8, 0.8], [13.2, 0.1]]);
      o.lid = K(t, [[8.8, 0], [9.0, 0.25], [9.35, 0.25], [9.6, 0]]);
      o.browRaise = K(t, [[12.65, 0], [12.8, 0.6, 'outBack'], [13.4, 0.3], [13.8, 0], [14.5, 0], [14.6, 0.5, 'outBack'], [15.0, 0.15], [16.9, 0.1], [17.05, 0.6, 'outBack'], [17.35, 0.4]]);
      o.browAngle = K(t, [[14.9, 0], [15.3, 0.55], [16.6, 0.55], [16.9, -0.1]]);
      o.shoulders = K(t, [[11.55, 0], [11.8, 7, 'outBack'], [12.3, 5], [12.5, 0]]);
      o.headTilt = K(t, [[11.55, 0], [11.8, -6, 'out'], [12.35, -5], [12.6, 0]]);
      // anticipation before the hop
      o.squash = 0.12 * sm(17.2, 17.44, t);
    } else if (t < 17.8) {
      // hop off the pouf toward the TV cabinet
      const p = inv(17.47, 17.8, t), e = E.inOut(p);
      o.pose = 'stand'; o.flip = false; o.mood = 'focused'; o.gesture = 'none';
      x = lerp(1100, 1270, e); y = lerp(LR.sofa.y + 95, 905, p) - Math.sin(Math.PI * p) * 70;
      o.squash = -0.14 * Math.sin(Math.PI * p);
      o.vel = [520, (p < 0.5 ? -1 : 1) * 400];
      o.armL = [60 + 50 * Math.sin(Math.PI * p), 10]; o.armR = [55 + 45 * Math.sin(Math.PI * p), 10];
      o.look = [-0.8, -0.1]; o.turn = -0.25; // looking back at Saba: "Hold on, Saba."
    } else if (t < 18.2) {
      // sock slide
      const p = inv(17.8, 18.2, t);
      o.pose = 'stand'; o.flip = false; o.mood = 'focused'; o.gesture = 'none';
      x = lerp(1270, 1580, E.out(p)); y = 905;
      o.squash = 0.2 * Math.exp(-p * 9) * Math.cos(p * 18);
      o.lean = -0.35 * Math.sin(Math.PI * Math.min(1, p * 1.2));
      o.vel = [700 * (1 - p), 0];
      o.armL = [80, 12]; o.armR = [72, 18]; o.handShapeL = 'open'; o.handShapeR = 'open';
      o.look = t < 18.1 ? [-0.9, -0.2] : [0.6, 0.3]; o.turn = t < 18.1 ? -0.3 : 0.25;
    } else {
      // crouch at the router, facing left
      x = 1580; y = 905;
      o.pose = 'crouch'; o.flip = true; o.mood = 'focused';
      o.squash = 0.16 * Math.exp(-(t - 18.2) * 10) * Math.cos((t - 18.2) * 22);
      Object.assign(o, gseq(t, [[0, 'none'], [18.3, 'reach', 0.35]]));
      // hands to the top/back of the router (not covering the LED)
      const lx = (x - 1508) / NOA_S, ly = (792 - y) / NOA_S;
      const fid = t > 19.0 ? Math.sin((t - 19.0) * 11) * 5 * (1 - sm(19.6, 19.72, t)) : 0;
      const press = K(t, [[19.5, 0], [19.66, 1, 'in'], [19.74, 1], [19.9, 0.3]]);
      o.reachTo = [lx + fid, ly + press * 8];
      o.look = K(t, [[18.2, [0.7, -0.4]], [18.55, [0.7, -0.4]], [18.7, [0.6, 0.55], 'out'], [19.7, [0.6, 0.55]], [19.8, [0.1, 0.35]]]);
      o.turn = K(t, [[18.5, 0.1], [18.7, 0.25]]);
      o.browRaise = K(t, [[19.66, 0], [19.78, 0.7, 'outBack'], [20.2, 0.5]]);
    }
    return { x, y, o };
  }

  // mug left on the pouf after Noa hops off
  function mugSprite(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = A.OUTLINE;
    ctx.beginPath(); ctx.moveTo(16, -18); ctx.bezierCurveTo(34, -20, 34, 6, 16, 4); ctx.lineTo(16, -3); ctx.bezierCurveTo(26, -2, 26, -12, 16, -11); ctx.closePath();
    ctx.fillStyle = '#f5efe4'; ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-18, -24); ctx.lineTo(18, -24); ctx.lineTo(16, 10); ctx.quadraticCurveTo(0, 16, -16, 10); ctx.closePath();
    ctx.stroke(); ctx.fillStyle = '#f5efe4'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#e2574c'; ctx.fillRect(-20, -12, 40, 7); ctx.fillStyle = 'rgba(160,140,150,0.45)'; ctx.fillRect(4, -30, 20, 50); ctx.restore();
    A.ellipse(ctx, 0, -24, 18, 5); ctx.fillStyle = '#6b3a22'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      const bx = -8 + i * 8, by = -32 - ph * 34; ctx.beginPath(); ctx.moveTo(bx, by + 14); ctx.quadraticCurveTo(bx + 6 * Math.sin(t * 3 + i), by + 4, bx, by - 8); ctx.stroke();
    }
    ctx.restore();
  }

  // spinner reflection in Saba's glasses: replicate the rig's head transform (see kits/family.js drawSaba)
  function glassesReflection(ctx, o, t, amt) {
    if (amt <= 0) return;
    const idle = o.idle ?? 1, breath = o.breath ?? 1;
    const MOOD = { eager: [0.15, 4, 0], tense: [0.05, 10, 0.25], horror: [-0.1, 14, 1] }; // [lean, shoulders, tremble]
    const mv = (i) => { const b = MOOD[o.mood][i]; return o.moodFrom ? lerp(MOOD[o.moodFrom][i], b, o.moodK) : b; };
    const tremble = o.tremble ?? mv(2), shoulders = o.shoulders ?? mv(1);
    const tr = (sd, f = 19) => tremble * A.noise1(t * f + sd);
    const br = Math.sin(t * A.TAU / 3.6) * breath;
    const rise = o.rise || 0, e = E.inOut(cl(rise));
    const Py = lerp(-176, -182, e);
    const leanDeg = ((o.lean ?? 0) + mv(0)) * 22 + (o.pose === 'rise' ? Math.sin(Math.PI * cl(rise)) * 16 : 0) + idle * A.wob(t, 3, 0.35) * 1.2;
    const turn = cl((o.turn ?? 0.25) + (o.look ? o.look[0] * 0.12 : 0), -1, 1);
    const tilt = ((o.headTilt ?? 0) + (o.look ? o.look[1] * 4 : 0) + idle * A.wob(t, 13, 0.3) * 2.5 + tr(12, 23) * 2) * D;
    const headP = [8 + turn * 6 + tr(14) * 1.2, -266 - br * 1.6 - shoulders * 0.4];
    const sq = o.squash ?? 0;
    ctx.save();
    ctx.translate(SAB.x, SAB.y); ctx.scale(SAB.s, SAB.s); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(0, 150);
    ctx.translate(tr(1) * 1.5, Py - br * 1.2); ctx.rotate(leanDeg * D);
    ctx.translate(headP[0], headP[1] + 70); ctx.rotate(tilt); ctx.scale(1.08, 1.08); ctx.translate(0, -70);
    const fx = turn * 26, farK = 1 - Math.max(0, turn) * 0.25, nearK = 1 - Math.max(0, -turn) * 0.25;
    const lens = [[fx - 30, nearK], [fx + 29, farK]];
    ctx.beginPath(); for (const [ex, k] of lens) ctx.roundRect(ex - 28 * k + 2, -2 - 22 + 2, 56 * k - 4, 40, 10); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (const [ex, k] of lens) {
      ctx.save(); ctx.translate(ex + 3 * k, -3); ctx.scale(k, 1); ctx.transform(1, 0, -0.18, 1, 0, 0);
      ctx.globalAlpha = 0.55 * amt; ctx.fillStyle = '#5d6c96'; ctx.fillRect(-19, -12, 38, 23);
      ctx.globalAlpha = 0.9 * amt;
      const n = 12, rot = Math.floor(t * 12) / 12 * A.TAU;
      for (let i = 0; i < n; i++) {
        const a = rot + i / n * A.TAU, f = i / n;
        ctx.fillStyle = `rgba(255,255,255,${(0.1 + 0.9 * f) * amt})`;
        ctx.save(); ctx.rotate(a); ctx.fillRect(3.2, -0.9, 3.6, 1.8); ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ the room with everyone in it (world coords)
  function room(ctx, t, opt = {}) {
    const L = tvLight(t);
    A.drawLivingRoom(ctx, t, { tvGlow: { color: L.color, intensity: L.intensity * (opt.glowK ?? 1) } });
    // TV + router live on the cabinet (behind the characters in depth)
    const tv = LR.tv, ts = tvState(t);
    A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, ts);
    const tR = t < FREEZE ? t : t < 19.72 ? FREEZE + (t - FREEZE) * 0.3 : t - 19.72 + FREEZE + (19.72 - FREEZE) * 0.3;
    const on = t >= 19.72;
    A.drawRouter(ctx, ROUTER.x, ROUTER.y, ROUTER.s, {
      t: tR, activity: t < FREEZE ? 0.65 : on ? 1 : 0.08,
      ledColor: t < FREEZE + 0.15 ? '#7ff6ff' : on ? '#7ff6ff' : '#ffa23a',
      ledGlow: on ? K(t, [[19.72, 0.6], [19.8, 0.9, 'out'], [20.3, 2.0], [20.8, 3]]) : 0,
      shake: on ? 0.8 * Math.exp(-(t - 19.72) * 5) : 0,
    });
    // Saba in the armchair
    const so = sabaO(t);
    A.drawArmchair(ctx, SAB.x, SAB.y, 1, 'back');
    A.drawSaba(ctx, SAB.x, SAB.y, SAB.s, so);
    A.drawArmchair(ctx, SAB.x, SAB.y, 1, 'front');
    if (opt.reflect) glassesReflection(ctx, so, t, opt.reflect);
    // Noa
    const n = noaState(t);
    if (t >= 17.47) mugSprite(ctx, 1072, 792, 0.72, t);
    A.drawNoa(ctx, n.x, n.y, NOA_S, n.o);
    // TV light spill on the characters (after them)
    A.glow(ctx, tv.x + tv.w * 0.4, tv.y + tv.h * 0.6, 900, L.color, 0.09 * L.intensity);
  }

  // ------------------------------------------------------------ exterior + frost
  const frost = () => A.layer('s2:frost', 960, 540, (g, w, h) => {
    const id = g.createImageData(w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x - w / 2) / (w / 2), v = (y - h / 2) / (h / 2), r = Math.sqrt(u * u * 0.8 + v * v);
      const n = A.fbm(x / 60, y / 60, 4) * 0.5 + 0.5, fine = A.noise2(x / 6, y / 6) * 0.5 + 0.5;
      const a = cl((r - 0.35) * 1.3 + (n - 0.5) * 0.9) * (0.75 + 0.25 * fine);
      const i = (y * w + x) * 4; d[i] = 225 + 30 * fine; d[i + 1] = 238 + 17 * fine; d[i + 2] = 255; d[i + 3] = cl(a) * 235;
    }
    g.putImageData(id, 0, 0);
    // fern crystals
    const r = A.rng(7); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineCap = 'round';
    for (let k = 0; k < 26; k++) {
      const edge = r() * 4 | 0; let x = edge === 0 ? 0 : edge === 1 ? w : r() * w, y = edge === 2 ? 0 : edge === 3 ? h : r() * h;
      let a = Math.atan2(h / 2 - y, w / 2 - x) + (r() - 0.5) * 0.9, len = 40 + r() * 90;
      const branch = (x, y, a, len, dep) => {
        if (dep > 3 || len < 6) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        g.lineWidth = Math.max(0.6, 2.2 - dep * 0.6); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
        for (let j = 1; j <= 3; j++) { const q = j / 4, bx = x + (x2 - x) * q, by = y + (y2 - y) * q; branch(bx, by, a + 0.9, len * 0.35, dep + 1); branch(bx, by, a - 0.9, len * 0.35, dep + 1); }
        branch(x2, y2, a + (r() - 0.5) * 0.5, len * 0.6, dep + 1);
      };
      branch(x, y, a, len, 0);
    }
  });

  function exterior(ctx, t) {
    const W = A.STREET.window;
    const p = inv(6.2, 7.45, t);
    const e = E.in(p);
    const cam = { x: lerp(1420, W.cx, E.inOut(p)), y: lerp(470, W.cy, E.inOut(p)), zoom: 1.35 * Math.pow(5.5 / 1.35, e) };
    A.drawTorontoStreet(ctx, t, { cam, windowGlow: 1.2 });
    // warm window bloom that grows as we approach
    ctx.save(); A.camera(ctx, cam);
    A.glow(ctx, W.cx, W.cy, 90 + 40 * e, '#ffcf8a', 0.35 + 0.4 * e);
    ctx.restore();
  }

  function caption(ctx, t) {
    const a = sm(6.45, 6.85, t) * (1 - sm(8.9, 9.4, t));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const x = 78, y = 86, dx = (1 - E.out(sm(6.45, 7.1, t))) * -16;
    ctx.fillStyle = 'rgba(12,8,28,0.35)'; A.rrect(ctx, x - 22 + dx, y - 30, 300, 60, 14); ctx.fill();
    ctx.fillStyle = '#ffd21f'; ctx.fillRect(x - 22 + dx, y - 30, 5, 60);
    A.text(ctx, 'טורונטו · 15:47', x + dx, y + 1, { font: '700 34px Rubik', fill: '#fff8e6', align: 'left', dir: 'rtl', stroke: 'rgba(15,10,35,0.6)', lw: 5 });
    ctx.restore();
  }

  // ------------------------------------------------------------ camera per shot (interior shots)
  function interiorCam(t) {
    if (t < 10.3) { // B: close on Saba -> pull back to master -> drift
      return {
        x: K(t, [[7.0, 745], [7.55, 740], [8.7, 960], [10.3, 950]]),
        y: K(t, [[7.0, 470], [7.55, 475], [8.7, 540], [10.3, 530]]),
        zoom: zkey(t, [[7.0, 1.85], [7.55, 1.7], [8.7, 1.0], [10.3, 1.06]]),
      };
    }
    if (t < 12.55) return { x: K(t, [[10.3, 905], [12.55, 925]]), y: K(t, [[10.3, 545], [12.55, 540]]), zoom: K(t, [[10.3, 1.55], [12.55, 1.66]], 'lin') };
    if (t < 13.75) return { x: K(t, [[12.55, 770], [13.75, 760]]), y: 468, zoom: K(t, [[12.55, 2.15], [13.75, 2.35]], 'lin') };
    if (t < 14.2) return { x: K(t, [[13.75, 860], [14.2, 850]]), y: K(t, [[13.75, 575], [14.2, 520]], 'out'), zoom: K(t, [[13.75, 1.35], [14.2, 1.5]], 'out') };
    if (t < 17.3) return {
      x: K(t, [[14.95, 760], [15.2, 760], [15.42, 722, 'out'], [17.3, 716]]),
      y: K(t, [[14.95, 560], [15.2, 560], [15.42, 438, 'out'], [17.3, 430]]),
      zoom: zkey(t, [[14.95, 1.42], [15.2, 1.45], [15.42, 2.55, 'out'], [17.3, 2.85, 'lin']]),
    };
    // H
    const base = {
      x: K(t, [[17.3, 960], [17.65, 975], [18.55, 1455], [19.8, 1462]]),
      y: K(t, [[17.3, 540], [17.65, 545], [18.55, 705], [19.8, 735]]),
      zoom: zkey(t, [[17.3, 1.0], [17.65, 1.02], [18.55, 1.85], [19.8, 2.1, 'lin']]),
    };
    if (t >= 19.8) {
      const p = inv(19.8, 20.3, t), q = inv(20.3, 21.0, t);
      base.x = lerp(base.x, LED[0], E.inOut(Math.min(1, p * 1.4)));
      base.y = lerp(base.y, LED[1], E.inOut(Math.min(1, p * 1.4)));
      base.zoom = 2.1 * Math.pow(7 / 2.1, E.in(p)) * Math.pow(60 / 7, E.in(q));
    }
    return base;
  }

  // full-screen TV insert
  function tvInsert(ctx, t) {
    const push = K(t, [[14.2, 1.0], [14.5, 1.06, 'lin'], [14.56, 1.1, 'out'], [14.95, 1.12, 'lin']]);
    const jx = t >= FREEZE && t < 14.62 ? A.noise1(t * 60) * 14 : 0;
    ctx.save();
    ctx.translate(960 + jx, 540); ctx.scale(push, push); ctx.translate(-960, -540);
    A.drawTVScreen(ctx, 0, 0, 1920, 1080, t, tvState(t));
    ctx.restore();
    // screen texture: scanlines + glare + bezel edges
    ctx.save();
    ctx.drawImage(A.layer('s2:scan', 1920, 1080, (g, w, h) => {
      g.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2);
      g.fillStyle = A.linear(g, 0, 0, w, h, [[0, 'rgba(255,255,255,0.10)'], [0.3, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.66, 'rgba(255,255,255,0.05)'], [0.7, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, h);
      g.fillStyle = A.radial(g, w / 2, h / 2, h * 0.55, h * 1.1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]); g.fillRect(0, 0, w, h);
    }), 0, 0);
    // freeze hit: white frame + chroma split bars
    if (t >= FREEZE && t < FREEZE + 0.12) { ctx.globalAlpha = 1 - (t - FREEZE) / 0.12; ctx.fillStyle = '#e8fbff'; ctx.fillRect(0, 0, 1920, 1080); }
    ctx.restore();
  }

  // ------------------------------------------------------------ dive overlay (screen space)
  function diveFX(ctx, t) {
    if (t < 19.72) return;
    const p = inv(19.8, 20.3, t), q = inv(20.3, 21.0, t);
    const c = [960, 540];
    // bloom
    const bl = sm(19.72, 20.9, t);
    A.glow(ctx, c[0], c[1], 120 + 900 * bl * bl, '#7ff6ff', 0.25 + 0.6 * bl);
    A.glow(ctx, c[0], c[1], 40 + 500 * q, '#ffffff', 0.3 + 0.7 * q);
    // radial speed lines (whoosh)
    const sl = sm(20.1, 20.45, t) * (1 - sm(20.85, 21.0, t));
    if (sl > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const r = A.rng(5);
      for (let i = 0; i < 90; i++) {
        const a = r() * A.TAU, sp = 0.6 + r() * 1.4, ph = (r() + (t - 20.1) * sp * 2.4) % 1;
        const r0 = 80 + ph * ph * 1300, len = 60 + ph * 420 * (0.5 + q);
        ctx.strokeStyle = r() < 0.3 ? `rgba(255,230,160,${0.5 * sl})` : `rgba(160,250,255,${0.55 * sl})`;
        ctx.lineWidth = 1.5 + ph * 5 * r();
        ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0); ctx.lineTo(c[0] + Math.cos(a) * (r0 + len), c[1] + Math.sin(a) * (r0 + len)); ctx.stroke();
      }
      // concentric light rings rushing outward (foreshadow the fibre tunnel)
      for (let k = 0; k < 6; k++) {
        const ph = ((t - 20.2) * 2.2 + k / 6) % 1; if (ph < 0) continue;
        ctx.strokeStyle = `rgba(120,245,255,${0.35 * sl * (1 - ph)})`; ctx.lineWidth = 3 + ph * 20;
        A.ellipse(ctx, c[0], c[1], 40 + ph * ph * 1400, 40 + ph * ph * 1400); ctx.stroke();
      }
      ctx.restore();
    }
    // white-cyan flash
    const f = sm(20.62, 20.95, t);
    if (f > 0) {
      ctx.save(); ctx.globalAlpha = f;
      ctx.fillStyle = A.radial(ctx, 960, 540, 0, 1200, [[0, '#ffffff'], [0.5, '#e6ffff'], [1, '#aef8ff']]); ctx.fillRect(0, 0, 1920, 1080);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ scene
  A.scene({
    name: 's2_livingroom', start: 6.2, end: 21.0,
    draw(ctx, s) {
      const t = s.t;
      // --- A: exterior + frost dissolve
      const inA = t < 7.45;
      if (inA) exterior(ctx, t);
      const inside = sm(7.02, 7.42, t);
      if (!(t >= 14.2 && t < 14.95) && inside > 0) {
        ctx.save(); ctx.globalAlpha = inside;
        ctx.save(); A.camera(ctx, interiorCam(Math.max(t, 7.0)));
        const rz = interiorCam(Math.max(t, 7.0)).zoom;
        room(ctx, t, { reflect: t > 14.9 && t < 17.3 ? sm(15.0, 15.4, t) : 0 });
        ctx.restore();
        ctx.restore();
        if (t >= FREEZE) grade(ctx, t, sm(14.5, 14.9, t) * (1 - 0.4 * sm(19.72, 20.3, t)));
      }
      if (t >= 14.2 && t < 14.95) { tvInsert(ctx, t); if (t >= FREEZE) grade(ctx, t, 0.35 * sm(14.5, 14.8, t)); }
      // frost over the glass as we pass through
      const fa = sm(6.75, 7.12, t) * (1 - sm(7.2, 7.62, t));
      if (fa > 0) {
        const sc = 1 + 0.9 * sm(7.15, 7.62, t);
        ctx.save(); ctx.globalAlpha = fa; ctx.translate(960, 540); ctx.scale(sc, sc);
        ctx.drawImage(frost(), -960, -540, 1920, 1080);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fa * 0.5;
        ctx.fillStyle = A.radial(ctx, 0, 0, 0, 900, [[0, 'rgba(255,190,110,0.6)'], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(-960, -540, 1920, 1080);
        ctx.restore();
      }
      // opening: flash out of S1's streak
      const f0 = 1 - sm(6.2, 6.5, t);
      if (f0 > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f0;
        ctx.fillStyle = '#dff8ff'; ctx.fillRect(0, 0, 1920, 1080);
        ctx.fillStyle = A.linear(ctx, 0, 480, 0, 600, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 480, 1920, 120);
        ctx.restore();
      }
      caption(ctx, t);
      diveFX(ctx, t);
    },
  });
})();
