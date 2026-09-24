// ============================================================================
// S7 · scenes/s7_goal.js · 46.0 – 60.0 · "Goal!" + tag with tiny Bit + GOTV end card
//
//  46.00  TV close-up: spinner pops away, picture unfreezes (continues S6's white impact flash)
//  46.40  ball hits the net (kit: matchT 1.9), impact punch
//  46.93  CUT master living room: Saba frozen in disbelief, Noa crouched at the router looks up
//  47.25  anticipation squat ... 47.60 LEAP: confetti, Bamba + popcorn explode, flash, shake, lamp rocks
//  48.30  SABA "Gooool! Noa, you are a genius!" (points at Noa on "Noa", hops over, scoops her up 50.0)
//  51.20  CUT two-shot in the hug. NOA "Thank the little packet, Saba." (looks to router, Saba puzzled)
//  53.30  camera follows their gaze: push down into the router (macro)
//  54.50  tiny Bit flops out of the LED port. BIT "Next time... send the goal earlier."  56.9 wink, conk-out
//  57.05  Bit's glow bursts -> light streak draws the "O" -> 57.30 GOTV SLAM
//  57.70  Hebrew tagline, English line, film title.  58.40 Bit peeks from the V and winks.  (engine fades 59.2)
// ============================================================================
(() => {
  // ------------------------------------------------------------------ END CARD CONSTANTS (edit here)
  const CARD = {
    logoBox: { cx: 960, cy: 385, w: 1080, h: 318 },     // the wordmark / client logo image is fitted into this box
    logoImage: 'assets/gotv_logo.png',                    // if this file exists it replaces the synthesized wordmark
    wordLeft: 'G', wordRight: 'TV',                        // wordmark = wordLeft + [ring "O"] + wordRight
    tagHe: 'הטלוויזיה של ישראל',
    tagEn: '(התקנת אפליקציה על המסך החכם)',
    filmTitle: 'PACKET FROM HOME · חבילה מהבית',
    tagHeY: 836, tagEnY: 906, filmTitleY: 104,
    bit: { x: 960, y: 760, s: 1.3 },                      // Bit stands between the logo and the taglines (feet point)
    navy: '#0d1033', yellow: '#ffd21f', blue: '#1f4fbf',
  };
  const logoImg = new Image(); logoImg.src = CARD.logoImage;
  const haveImg = () => logoImg.complete && logoImg.naturalWidth > 0;

  A.noSubs = t => t > 77.7;

  const { clamp, lerp, inv, smooth, ease, hash, key } = A;
  const LR = A.LR;
  const T_CUT_ROOM = 59.83, T_PAYOFF = 68.85, T_MACRO = 72.4, T_CARD = 77.62;

  // ================================================================== small helpers
  const env = (t, a, b, c, d) => Math.min(smooth(a, b, t), 1 - smooth(c, d, t)); // attack a..b, release c..d
  const decay = (t, t0, k) => (t < t0 ? 0 : Math.exp(-(t - t0) * k));
  const spring = (t, t0, k = 7, w = 16) => (t < t0 ? 0 : Math.exp(-(t - t0) * k) * Math.cos((t - t0) * w));
  const hop = (t, a, b) => { const u = inv(a, b, t); return u > 0 && u < 1 ? 4 * u * (1 - u) : 0; };

  // ================================================================== SHOT 1: TV close-up
  function shotTV(ctx, t) {
    const tv = LR.tv, cx = tv.x + tv.w / 2, cy = tv.y + tv.h / 2;
    const punch = spring(t, 59.3, 9, 20) * 0.12 + (t > 59.3 ? 0.06 * smooth(59.3, 59.8, t) : 0);
    const zoom = lerp(4.46, 4.62, ease.out(inv(58.9, 59.83, t))) + punch;
    const shake = decay(t, 59.3, 7) * 1.1 + decay(t, 58.96, 12) * 0.5;
    ctx.save();
    A.camera(ctx, { x: cx, y: cy + 4, zoom, shake, t });
    const unfrozen = t >= 58.97;
    const pop = smooth(58.9, 58.97, t);
    if (!unfrozen) A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'freeze', freezeGlitch: 0, spinner: 1 - pop, bufferPct: 100 });
    else A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'goal', matchT: matchT(t) });
    tvOverlay(ctx, t, { bugPop: smooth(58.95, 59.15, t) });
    ctx.restore();
    // unfreeze pop: bright ring from the spinner centre + a scanline snap
    if (t >= 58.93 && t < 59.25) {
      const u = inv(58.93, 59.25, t);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(200,255,240,${0.8 * (1 - u)})`; ctx.lineWidth = 30 * (1 - u) + 2;
      A.ellipse(ctx, 960, 540, 60 + ease.out(u) * 900, 60 + ease.out(u) * 900); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - u)})`; ctx.fillRect(0, 540 - 300 * (1 - u), 1920, 600 * (1 - u));
      ctx.restore();
    }
    // radial speed lines on the net hit (comic accent, 3 frames)
    if (t >= 59.3 && t < 59.46) {
      const u = inv(59.3, 59.46, t);
      ctx.save(); ctx.globalAlpha = 0.55 * (1 - u); ctx.fillStyle = '#fff';
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * A.TAU + hash(i) * 0.1, r0 = 520 + hash(i + 3) * 220, r1 = 1300;
        const w = 0.012 + hash(i + 7) * 0.01;
        ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r0, 540 + Math.sin(a) * r0);
        ctx.lineTo(960 + Math.cos(a + w) * r1, 540 + Math.sin(a + w) * r1); ctx.lineTo(960 + Math.cos(a - w) * r1, 540 + Math.sin(a - w) * r1); ctx.fill();
      }
      ctx.restore();
    }
    // S6 hands over on a white impact flash: let it settle
    const wf = 1 - smooth(58.9, 59.12, t);
    if (wf > 0) { ctx.fillStyle = `rgba(255,252,240,${wf * 0.85})`; ctx.fillRect(0, 0, 1920, 1080); }
  }

  // ================================================================== CELEBRATION PARTICLES (closed form)
  // confetti: burst from Saba's hands at the leap + a gentle rain from above
  const CONF_COLS = ['#ffd21f', '#ffe266', '#1f4fbf', '#3f78ff', '#ffffff', '#ffd21f', '#1f4fbf'];
  function confettiPiece(ctx, x, y, s, rot, flipK, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, flipK);
    ctx.fillStyle = col; ctx.fillRect(-s, -s * 0.55, s * 2, s * 1.1);
    ctx.restore();
  }
  function drawConfetti(ctx, t, burstPts) {
    if (t < 60.5) return;
    // bursts
    const N = 90;
    for (let b = 0; b < burstPts.length; b++) {
      const [bx, by, dir, t0] = burstPts[b];
      const tau = t - t0; if (tau < 0) continue;
      for (let i = 0; i < N; i++) {
        const h = k => hash(i * 7.13 + b * 131 + k);
        const ang = -Math.PI / 2 + dir * 0.35 + (h(1) - 0.5) * 2.1;
        const sp = 700 + h(2) * 1300, k = 2.2 + h(3) * 1.6, vt = 90 + h(4) * 80; // drag, terminal fall speed
        const e = (1 - Math.exp(-k * tau)) / k;
        let x = bx + Math.cos(ang) * sp * e + Math.sin(tau * (2 + h(5) * 3) + h(6) * 6) * 26 * clamp(tau);
        let y = by + Math.sin(ang) * sp * e + vt * (tau - e);
        if (y > 1150 || tau > 5.5) continue;
        const s = 5 + h(8) * 6;
        const a = clamp(1 - (tau - 4.5));
        ctx.globalAlpha = a;
        confettiPiece(ctx, x, y, s, tau * (4 + h(9) * 8) * (h(10) > 0.5 ? 1 : -1), Math.cos(tau * (6 + h(11) * 8) + h(12) * 6), CONF_COLS[i % CONF_COLS.length]);
      }
    }
    // rain from the ceiling (starts as the burst peaks, thins out after the hug)
    const rainA = smooth(60.65, 61.1, t) * (1 - smooth(66.0, 67.4, t));
    if (rainA > 0) {
      for (let i = 0; i < 120; i++) {
        const h = k => hash(i * 3.71 + 900 + k);
        const t0 = 60.6 + h(1) * 1.4, tau = t - t0; if (tau < 0) continue;
        const vy = 110 + h(2) * 90;
        const y = -20 + tau * vy; if (y > 1100) continue;
        const x = 150 + h(3) * 1700 + Math.sin(tau * (1.5 + h(4) * 2) + h(5) * 6) * 40 + tau * 12;
        ctx.globalAlpha = rainA;
        confettiPiece(ctx, x, y, 5 + h(6) * 5, tau * (3 + h(7) * 5), Math.cos(tau * (5 + h(8) * 6)), CONF_COLS[i % CONF_COLS.length]);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Bamba puffs + popcorn: explode from the side table (the leap shakes the floor) with a floor bounce
  function bambaShape(ctx, s, seed) {
    ctx.fillStyle = '#e8a53a'; ctx.strokeStyle = '#7a4518'; ctx.lineWidth = 1.6;
    A.rrect(ctx, -s * 1.6, -s * 0.62, s * 3.2, s * 1.24, s * 0.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6c667'; A.rrect(ctx, -s * 1.2, -s * 0.5, s * 2.2, s * 0.35, s * 0.2); ctx.fill();
    ctx.fillStyle = '#b86d22'; for (let k = 0; k < 3; k++) { A.ellipse(ctx, -s * 0.9 + k * s * 0.9 + hash(seed + k) * 3, s * 0.15, s * 0.14, s * 0.1); ctx.fill(); }
  }
  function popcornShape(ctx, s, seed) {
    ctx.fillStyle = '#fff6df'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + seed, r = s * (0.55 + hash(seed + k) * 0.25); ctx.moveTo(Math.cos(a) * s * 0.5 + r, Math.sin(a) * s * 0.5); ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, r, 0, A.TAU); }
    ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#f3c25a'; A.ellipse(ctx, s * 0.1, s * 0.15, s * 0.28, s * 0.22); ctx.fill();
  }
  function drawSnacks(ctx, t) {
    const t0 = 60.52; if (t < t0) return;
    const src = [LR.bamba.x, LR.bamba.y - 30];
    for (let i = 0; i < 46; i++) {
      const h = k => hash(i * 5.31 + 77 + k);
      const tau = t - t0 - h(0) * 0.12; if (tau < 0) continue;
      const vx = (h(1) - 0.45) * 900, vy = -(700 + h(2) * 900), g = 2300;
      const floor = 900 + h(3) * 90;
      // first flight
      const tl = (-vy + Math.sqrt(vy * vy + 2 * g * (floor - src[1]))) / g;
      let x, y, rot;
      if (tau < tl) { x = src[0] + vx * tau; y = src[1] + vy * tau + 0.5 * g * tau * tau; rot = tau * (h(4) - 0.5) * 18; }
      else {
        const vb = (g * tl + vy) * 0.32, tb = tau - tl, t2 = 2 * vb / g;
        const xl = src[0] + vx * tl; rot = tl * (h(4) - 0.5) * 18;
        if (tb < t2) { x = xl + vx * 0.4 * tb; y = floor - vb * tb + 0.5 * g * tb * tb; rot += tb * 6 * (h(4) - 0.5); }
        else { x = xl + vx * 0.4 * t2; y = floor; rot += t2 * 6 * (h(4) - 0.5); }
      }
      const s = (h(5) > 0.45 ? 9 : 11) * (0.85 + h(6) * 0.4);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      if (h(5) > 0.45) bambaShape(ctx, s, i); else popcornShape(ctx, s, i);
      ctx.restore();
    }
  }

  // ================================================================== LAMP ROCK (the floor lamp wobbles after the landing)
  // The lamp lives in the kit's cached room layer; we re-draw its region rotated about the base, after patching the
  // wall behind it with wallpaper from exactly two pattern periods (144 px) to the side.
  // The kit's lamp is baked into the cached room layer: patch it away with wallpaper from exactly one vertical
  // pattern period (168 px) / two horizontal periods (144 px) away, then redraw the lamp (same vector design) rotated.
  function lampAngle(t) { return 0.05 * (spring(t, 60.56, 2.4, 10) + 0.55 * spring(t, 61.3, 2.8, 11)); }
  function feather(ctx, src, sx, sy, dx, dy, w, h, r) {
    const buf = A.layer('s7:lampbuf', 260, 460, () => {}), g = buf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 260, 460);
    g.drawImage(src, sx * r, sy * r, w * r, h * r, 0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = A.linear(g, 0, 0, w, 0, [[0, 'rgba(0,0,0,0)'], [0.18, '#000'], [0.82, '#000'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h);
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [0.12, '#000'], [0.88, '#000'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h);
    ctx.drawImage(buf, 0, 0, w, h, dx, dy, w, h);
  }
  function drawLampArt(g) { // replica of the kit lamp (pole + shade), local coords with x = 600
    const x = 600, O = A.OUTLINE;
    const line = (x0, y0, x1, y1, c, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
    g.fillStyle = A.linear(g, x - 5, 0, x + 5, 0, [[0, '#ffe7a8'], [0.4, '#c89a48'], [1, '#5e3e14']]); g.fillRect(x - 4, 330, 8, 455);
    g.strokeStyle = O; g.lineWidth = 2; g.strokeRect(x - 4, 330, 8, 455);
    for (const yy of [460, 620]) { g.fillStyle = '#d6a850'; A.ellipse(g, x, yy, 8, 4); g.fill(); g.stroke(); }
    line(x + 30, 336, x + 30, 380, '#c89a48', 1.5); g.fillStyle = '#c89a48'; A.ellipse(g, x + 30, 382, 3, 4); g.fill();
    const top = 250, bot = 336;
    const shade = () => { g.beginPath(); g.moveTo(x - 52, top); g.lineTo(x + 52, top); g.lineTo(x + 76, bot); g.quadraticCurveTo(x, bot + 10, x - 76, bot); g.closePath(); };
    shade(); g.fillStyle = A.linear(g, x - 76, 0, x + 76, 0, [[0, '#ffcf88'], [0.45, '#fff0c8'], [1, '#e89a58']]); g.fill();
    g.save(); shade(); g.clip();
    for (let i = -8; i <= 8; i++) line(x + i * 6.5, top, x + i * 9.5, bot + 8, 'rgba(180,100,40,0.18)', 2);
    g.fillStyle = A.linear(g, 0, top, 0, bot, [[0, 'rgba(160,80,30,0.25)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(255,255,220,0.5)']]); g.fillRect(x - 80, top, 160, bot - top + 12);
    g.restore();
    shade(); g.strokeStyle = O; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#b8662e'; A.ellipse(g, x, top, 52, 5); g.fill(); g.stroke();
    g.fillStyle = '#fff8dc'; A.ellipse(g, x, bot + 1, 72, 8); g.fill();
    for (let i = -18; i <= 18; i++) { const xx = x + i * 4, yy = bot + 4 + Math.sqrt(Math.max(0, 1 - (i / 19) ** 2)) * 5; line(xx, yy, xx, yy + 9, '#c9763a', 1.6); }
  }
  // returns the rotation used (0 = untouched); draws patch + rotated lamp + its glow
  function lampRock(ctx, t, li) {
    const a = lampAngle(t);
    const m = ctx.getTransform(), r = Math.hypot(m.a, m.b) > 1.15 ? 2 : 1;
    const room = A._cache.get('home:room@' + r) || A._cache.get('home:room@' + (3 - r));
    const px = 600, py = 788;
    if (Math.abs(a) > 0.0015 && room) {
      const rr = room.width / 1920;
      feather(ctx, room, 505, 236 + 168, 505, 236, 190, 180, rr);    // shade band
      feather(ctx, room, 580 + 144, 400, 580, 400, 40, 380, rr);      // pole
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.translate(-px, -py); drawLampArt(ctx); ctx.restore();
    }
    const sx = px + Math.sin(a) * (py - 300), sy = 300;
    A.glow(ctx, sx, sy, 230, '#ffb45e', 0.42 * li);
    A.glow(ctx, px + Math.sin(a) * (py - 330), 330, 90, '#fff2c8', 0.5 * li);
    return a;
  }

  // ================================================================== CHARACTERS
  function sabaState(t) {
    const o = { t, pose: 'stand', mood: 'joy', gesture: 'armsUp', scarfWave: 0.5 };
    let x = 790, y = 905;
    if (t < 60.15) { // frozen disbelief, hands on head, jaw dropped
      Object.assign(o, { mood: 'neutral', gesture: 'headHands', jaw: 0.55, mouth: 0.45, browRaise: 0.9, lid: 0, look: [0.9, -0.35], idle: 0.15, lean: -0.08 * smooth(59.8, 60.15, t), scarfWave: 0, happy: 0 });
    } else if (t < 60.5) { // anticipation squat
      const k = ease.inOut(inv(60.15, 60.48, t));
      Object.assign(o, { mood: 'joy', moodFrom: 'neutral', moodK: k, gesture: 'fists', gestureFrom: 'headHands', gestureK: k, squash: 0.2 * k, lean: 0.25 * k, look: [0.8, -0.2], mouth: lerp(0.45, 0.2, k), browRaise: -0.3 * k, scarfWave: 0.2 });
    } else if (t < 61.28) { // LEAP
      const u = inv(60.5, 61.28, t), air = 1.55 * 4 * u * (1 - u);
      Object.assign(o, { pose: 'jump', air, gesture: 'armsUp', gestureFrom: 'fists', gestureK: smooth(0, 0.25, u), scarfWave: 1, mouth: 0.85, look: [0.4, -0.6],
        squash: u < 0.12 ? -0.16 * (1 - u / 0.12) : u > 0.9 ? -0.06 : 0, vel: [0, lerp(-1400, 1400, u)], lean: -0.15 });
      x = lerp(790, 800, u);
    } else if (t < 61.7) { // land (squash + overshoot) and roar "Gooool!"
      const sq = 0.24 * spring(t, 61.28, 9, 22);
      Object.assign(o, { squash: sq, lean: -0.25 * smooth(61.28, 61.5, t), look: [0.3, -0.7], scarfWave: 1, headTilt: -6, vel: [0, 300 * decay(t, 61.28, 6)] });
      x = 800;
    } else if (t < 62.02) { // turn & point at Noa
      const k = ease.outBack(inv(61.7, 61.9, t));
      Object.assign(o, { gesture: 'point', gestureFrom: 'armsUp', gestureK: clamp(k), lean: lerp(-0.25, 0.3, clamp(k)), look: [1, 0.25], scarfWave: 0.7, browRaise: 0.3 });
      x = 800;
    } else if (t < 62.9) { // happy hops toward her
      const h1 = hop(t, 62.04, 62.45), h2 = hop(t, 62.48, 62.88);
      const air = Math.max(h1, h2) * 0.5;
      Object.assign(o, { pose: air > 0.01 ? 'jump' : 'stand', air, gesture: 'armsUp', gestureFrom: 'point', gestureK: smooth(62, 62.2, t), look: [1, 0.3], lean: 0.2, scarfWave: 1, squash: (air < 0.01 ? 0.1 : -0.04), vel: [500, 0] });
      x = lerp(800, 900, ease.inOut(inv(62.04, 62.88, t)));
    } else { // scoop & hug
      const k = ease.inOut(inv(62.9, 63.35, t));
      x = 900 + 20 * k;
      const rock = Math.sin((t - 63.35) * 4.2) * smooth(63.3, 63.6, t) * (1 - smooth(64, 64.4, t));
      Object.assign(o, { gesture: 'none', mood: 'joy', happy: 1, lean: lerp(0.35, 0.05, smooth(63.05, 63.4, t)) + rock * 0.1, headTilt: -5 * k + rock * 4,
        handL: [lerp(40, 150, k), lerp(-250, -270, k)], handR: [lerp(90, 190, k), lerp(-300, -330, k)], handShapeL: 'open', handShapeR: 'open', armRBehind: true,
        look: [1, 0.1], scarfWave: 0.4 * (1 - smooth(63.9, 64.9, t)), mouth: t < 63.4 ? 0.3 : undefined });
      if (t > 64.1) { // listens to Noa (glances at the TV on "GOTV"), then: "And now... backgammon! Come, let's play!"
        const gl = env(t, 64.6, 64.85, 65.4, 65.7), nod = Math.sin((t - 65.9) * 9) * env(t, 65.9, 66.0, 66.4, 66.6);
        Object.assign(o, { mood: 'joy', happy: 0.5, look: [lerp(0.8, 0.6, gl), lerp(0.05, -0.35, gl)], browRaise: 0.4 * gl, headTilt: -3 + nod * 4, lean: 0.05 + nod * 0.04, smile: 0.7 });
        if (t > 66.8) { // lets go: finger up "And now..." -> arms up "backgammon!" -> beckons "Come, let's play!"
          delete o.handL; delete o.handR; delete o.armRBehind;
          const up = smooth(66.85, 67.1, t), burst = smooth(67.55, 67.72, t), come = smooth(68.3, 68.5, t);
          Object.assign(o, { gesture: t > 68.3 ? 'point' : t > 67.55 ? 'armsUp' : 'point', gestureFrom: t > 68.3 ? 'armsUp' : t > 67.55 ? 'point' : 'none',
            gestureK: t > 68.3 ? come : t > 67.55 ? burst : up, mood: 'joy', happy: burst * 0.6,
            browL: 0.7 * up * (1 - burst), browR: -0.2 * up * (1 - burst), smile: 0.8, look: [0.9, 0.05], headTilt: -4 + 6 * burst * (1 - come),
            lean: lerp(0.05, -0.12, burst) + 0.2 * come, squash: 0.08 * spring(t, 67.6, 7, 18), scarfWave: 0.6 * burst });
        }
      }
    }
    return { x, y, o };
  }

  function noaState(t) {
    const o = { t, flip: true, pose: 'stand', mood: 'joy', gesture: 'cheer' };
    let x = 1395, y = 900;
    if (t < 60.56) {
      Object.assign(o, { flip: false, pose: 'crouch', mood: 'focused', moodFrom: 'focused', gesture: 'reach', gestureFrom: 'reach', reachTo: [150, -60], look: [0.1, -1], mouth: 0.25 * smooth(59.85, 60.1, t) });
      x = 1360;
    } else if (t < 61.6) { // springs up and cheers
      const u = inv(60.56, 60.75, t);
      Object.assign(o, { squash: u < 1 ? -0.12 * (1 - u) : 0.08 * spring(t, 60.75, 8, 20), look: [0.6, -0.3], mouth: 0.6, bounce: 1 });
      y = 900 - 40 * hop(t, 60.56, 60.85) - 28 * hop(t, 60.95, 61.3);
      x = 1360;
    } else if (t < 62.9) { // hops toward Saba
      const h1 = hop(t, 61.65, 62.05), h2 = hop(t, 62.1, 62.5);
      y = 900 - 36 * Math.max(h1, h2);
      x = lerp(1360, 1175, ease.inOut(inv(61.65, 62.5, t)));
      Object.assign(o, { look: [0.8, -0.1], mouth: 0.35, bounce: 1, vel: [-500, 0], gesture: 'cheer' });
      if (t > 62.5) Object.assign(o, { gesture: 'none', gestureFrom: 'cheer', gestureK: smooth(62.5, 62.85, t), mood: 'joy', squash: 0.06 * spring(t, 62.5, 8, 18) });
    } else { // scooped up into the hug
      const k = ease.inOut(inv(62.95, 63.4, t));
      x = lerp(1175, 1125, k); y = lerp(900, 805, k) + 12 * Math.sin((t - 63.35) * 4.2) * smooth(63.3, 63.6, t) * (1 - smooth(64, 64.4, t));
      Object.assign(o, { hug: k, gesture: 'none', mood: 'joy', look: [0.9, 0], bounce: 0.6 });
      if (t > 64.1) { // "Thank GOTV, Saba. No more freezing!" (glances back at the TV on GOTV, then a cocky little shrug)
        const q = smooth(64.15, 64.5, t), tvL = env(t, 64.65, 64.85, 65.15, 65.4), sh = env(t, 65.45, 65.65, 66.5, 66.8);
        Object.assign(o, { hug: lerp(1, 0.25, q) * (1 - sh), mood: 'proud', moodFrom: 'joy', moodK: q, look: [lerp(0.8, -0.8, tvL), lerp(0, -0.2, tvL)], headTilt: lerp(0, -8, tvL),
          gesture: sh > 0 ? 'shrug' : 'none', gestureFrom: 'none', gestureK: sh });
        if (t > 67.5) { // "backgammon!" -> delighted
          const k = smooth(67.62, 67.85, t);
          Object.assign(o, { hug: 0, mood: 'joy', moodFrom: 'proud', moodK: k, gesture: 'cheer', gestureFrom: 'none', gestureK: k, look: [0.9, -0.1], bounce: 1, mouth: 0.45 * k,
            squash: 0.07 * spring(t, 67.75, 8, 18) });
          y = 805 - 22 * hop(t, 67.8, 68.15) - 16 * hop(t, 68.6, 68.9);
        }
      }
    }
    return { x, y, o };
  }

  // ================================================================== TV helpers (GOTV channel bug over the broadcast)
  const matchT = t => 1.5 + (t - 58.9); // ball in the net at matchT 1.9 = 59.3
  const GOLD_LED = '#ffcf4a';
  // Draws inside the TV screen rect in broadcast (1920x1080) coords: covers the kit's old channel bug with the GOTV bug,
  // and optionally the payoff badge `LIVE · 4K · ללא תקיעות`.
  function tvOverlay(ctx, t, o = {}) {
    const tv = LR.tv, sc = Math.max(tv.w / 1920, tv.h / 1080);
    ctx.save();
    ctx.beginPath(); ctx.rect(tv.x, tv.y, tv.w, tv.h); ctx.clip();
    ctx.translate(tv.x + (tv.w - 1920 * sc) / 2, tv.y + (tv.h - 1080 * sc) / 2); ctx.scale(sc, sc);
    ctx.fillStyle = A.linear(ctx, 0, 36, 0, 120, [[0, '#1b2466'], [1, '#0b1034']]); A.rrect(ctx, 1534, 34, 312, 88, 18); ctx.fill();
    if (o.badge) { ctx.fillStyle = '#1a2a6e'; ctx.globalAlpha = clamp(o.badge); A.rrect(ctx, 1552, 112, 264, 58, 26); ctx.fill(); ctx.globalAlpha = 1; } // hide the kit's small LIVE pill
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
    const pop = o.bugPop ?? 1, k = 0.6 + 0.4 * ease.outBack(clamp(pop));
    ctx.save(); ctx.translate(1686, 90); ctx.scale(k, k); ctx.globalAlpha = clamp(pop * 3);
    if (A.drawGOTVBug) A.drawGOTVBug(ctx, 0, 0, 1.55, { alpha: 1, t });
    else { // fallback mini wordmark
      A.text(ctx, 'G', -86, 2, { font: '900 60px Rubik', fill: '#ffd21f', stroke: '#1f4fbf', lw: 8 });
      ctx.lineWidth = 11; ctx.strokeStyle = '#1f4fbf'; A.ellipse(ctx, -34, 2, 22, 22); ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffd21f'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-40, -9); ctx.lineTo(-24, 2); ctx.lineTo(-40, 13); ctx.fill();
      A.text(ctx, 'TV', 36, 2, { font: '900 60px Rubik', fill: '#ffd21f', stroke: '#1f4fbf', lw: 8 });
    }
    ctx.restore();
    if (o.live) { // restart after the goal: repaint the scorebug score 2-1 and a later clock
      ctx.fillStyle = '#060a22'; A.rrect(ctx, 62, 52, 150, 62, 9); ctx.fill();
      A.text(ctx, `89:${String(52 + Math.floor(o.live + 6)).padStart(2, '0')}`, 137, 85, { font: '800 38px Rubik', fill: '#fff' });
      ctx.fillStyle = '#f4f4f4'; A.rrect(ctx, 408, 50, 150, 66, 8); ctx.fill();
      A.text(ctx, '2-1', 483, 85, { font: '900 44px Rubik', fill: '#0b1034' });
    }
    if (o.badge) { // payoff: LIVE · 4K · ללא תקיעות (replaces the kit's LIVE pill)
      const a = clamp(o.badge);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(1800, 196); ctx.scale(1.5, 1.5); ctx.translate(0, 0);
      ctx.font = '900 30px Rubik'; const w1 = ctx.measureText('LIVE · 4K ·').width; ctx.font = '700 30px Rubik'; const w2 = ctx.measureText('ללא תקיעות').width;
      const W = w1 + w2 + 84;
      ctx.fillStyle = '#d61f2a'; A.rrect(ctx, -W, -30, W, 60, 30); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 5)})`; A.ellipse(ctx, -W + 30, 0, 10, 10); ctx.fill();
      A.text(ctx, 'LIVE · 4K ·', -W + 52, 1, { font: '900 30px Rubik', fill: '#fff', align: 'left' });
      A.text(ctx, 'ללא תקיעות', -W + 52 + w1 + 12, 1, { font: '700 30px Rubik', fill: '#ffe066', align: 'left' });
      ctx.restore();
    }
    ctx.restore();
  }
  function drawTVSet(ctx, t, o = {}) {
    const tv = LR.tv;
    if (o.live) A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'live', matchT: o.live });
    else A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'goal', matchT: o.matchT ?? matchT(t) });
    tvOverlay(ctx, t, o);
  }

  // ================================================================== SHOT 2: living room (master -> two-shot)
  function roomCam(t) {
    if (t < 64.1) {
      const x = key(t, [[59.83, 985], [60.5, 995], [62.9, 1000], [64.1, 1020]]);
      const y = key(t, [[59.83, 560], [60.5, 565], [60.9, 545, 'out'], [64.1, 540]]);
      const zoom = key(t, [[59.83, 1.19], [60.48, 1.24, 'inOut'], [60.65, 1.17, 'out'], [62.9, 1.2], [64.1, 1.25]]);
      return { x, y, zoom };
    }
    // two-shot in the hug; a small push-back as Saba bursts out with "backgammon!"
    const d = inv(64.1, 67.5, t), b = ease.inOut(inv(67.55, 68.3, t));
    return { x: 1025 + 10 * d - 10 * b, y: 505 + 25 * b, zoom: 2.05 + 0.08 * d - 0.28 * b };
  }

  // after the switch the set-top box on the cabinet says GOTV (kit bakes "IPTV" into the room layer)
  function stbLabel(ctx) {
    const x = LR.cabinet.x + 196 + 36, y = LR.cabinet.y + 56;
    ctx.save(); ctx.fillStyle = '#081a22'; ctx.fillRect(x, y, 60, 12);
    A.text(ctx, 'GOTV', x + 30, y + 6.5, { font: '800 10px Rubik', fill: '#ffd21f' });
    A.glow(ctx, x + 30, y + 6, 22, '#ffd21f', 0.18); ctx.restore();
  }
  function roomBase(ctx, t, o = {}) {
    const flash = o.flash || 0;
    A.drawLivingRoom(ctx, t, { tvGlow: { color: t < 61 ? '#bfffd8' : '#ffe9a0', intensity: o.tvGlow ?? 1.3 }, lamp: 0 });
    stbLabel(ctx);
    lampRock(ctx, t, (o.lamp ?? 1) * (0.95 + 0.05 * A.noise1(t * 2.3)));
    if (flash > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(flash) * 0.6;
      ctx.fillStyle = A.radial(ctx, 960, 480, 0, 1300, [[0, '#fff6e0'], [1, '#ffcf80']]); ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
  }

  function shotRoom(ctx, t) {
    const cam = roomCam(t);
    const shake = decay(t, 60.5, 3.2) * 1.4 + decay(t, 61.28, 6) * 0.7 + decay(t, 67.62, 6) * 0.3;
    const flash = Math.max(decay(t, 60.5, 3.5) * (t >= 60.5 ? 1 : 0), decay(t, 59.83, 8) * 0.35);
    ctx.save();
    A.camera(ctx, { ...cam, shake, t });
    roomBase(ctx, t, { flash, tvGlow: 1.3 + 0.5 * decay(t, 59.83, 3), lamp: 1 + 0.4 * decay(t, 60.5, 3) });
    drawTVSet(ctx, t);
    A.drawRouter(ctx, LR.router.x, LR.router.y, LR.router.s, { t, activity: 0.7, ledColor: GOLD_LED });
    A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'back');
    A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'front');
    const S = sabaState(t), N = noaState(t);
    if (t >= 62.9) { A.drawSaba(ctx, S.x, S.y, 0.95, S.o); A.drawNoa(ctx, N.x, N.y, 0.95, N.o); }
    else { A.drawNoa(ctx, N.x, N.y, 0.95, N.o); A.drawSaba(ctx, S.x, S.y, 0.95, S.o); }
    drawSnacks(ctx, t);
    ctx.restore();
    drawConfetti(ctx, t, [[680, 330, -1, 60.52], [930, 330, 1, 60.54]]);
    if (t >= 67.62) drawConfetti2(ctx, t);
    if (t >= 60.5 && t < 60.6) { ctx.fillStyle = `rgba(255,248,225,${0.35 * (1 - inv(60.5, 60.6, t))})`; ctx.fillRect(0, 0, 1920, 1080); }
    // cut to the payoff on a quick warm dip
    const dip = smooth(68.7, 68.85, t);
    if (dip > 0) { ctx.fillStyle = `rgba(255,236,200,${dip * 0.5})`; ctx.fillRect(0, 0, 1920, 1080); }
  }
  // a second little confetti puff on "backgammon!" (from the ceiling edge, few pieces)
  function drawConfetti2(ctx, t) {
    const tau0 = t - 67.62;
    for (let i = 0; i < 40; i++) {
      const h = k => hash(i * 6.1 + 1500 + k);
      const tau = tau0 - h(0) * 0.2; if (tau < 0) continue;
      const x = 200 + h(1) * 1500 + Math.sin(tau * (2 + h(2) * 2) + h(3) * 6) * 30, y = -20 + tau * (140 + h(4) * 100);
      if (y > 1100) continue;
      ctx.globalAlpha = 0.9;
      confettiPiece(ctx, x, y, 7 + h(5) * 6, tau * (4 + h(6) * 6), Math.cos(tau * (6 + h(7) * 6)), CONF_COLS[i % CONF_COLS.length]);
    }
    ctx.globalAlpha = 1;
  }

  // ================================================================== SHOT 3: PAYOFF, backgammon at the side table
  const BOARD = { x: 935, y: 712, s: 0.56 };
  function fallbackBoard(ctx, x, y, s, o) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const W = 420, H = 150;
    ctx.fillStyle = '#5a3218'; A.rrect(ctx, -W / 2, -H - 14, W, H + 14, 12); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#e9cf9a'; A.rrect(ctx, -W / 2 + 14, -H, W / 2 - 22, H - 16, 6); ctx.fill(); A.rrect(ctx, 8, -H, W / 2 - 22, H - 16, 6); ctx.fill();
    for (let i = 0; i < 12; i++) {
      const bx = (i < 6 ? -W / 2 + 18 : 12) + (i % 6) * 30, c = i % 2 ? '#b8322a' : '#23324f';
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx, -H); ctx.lineTo(bx + 26, -H); ctx.lineTo(bx + 13, -H + 58); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, -16); ctx.lineTo(bx + 26, -16); ctx.lineTo(bx + 13, -74); ctx.fill();
    }
    const d = o.dice ?? 1;
    for (let k = 0; k < 2; k++) {
      const u = clamp(d), dx = lerp(-160, 60 + k * 40, ease.out(u)), dy = -60 - Math.abs(Math.sin(u * 9)) * 60 * (1 - u);
      ctx.save(); ctx.translate(dx, dy); ctx.rotate((1 - u) * 8 + k);
      ctx.fillStyle = '#fff'; A.rrect(ctx, -14, -14, 28, 28, 6); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#111'; for (const [px, py] of [[-7, -7], [7, -7], [-7, 0], [7, 0], [-7, 7], [7, 7]]) { A.ellipse(ctx, px, py, 2.8, 2.8); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }
  function fallbackCase(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7a4424'; A.rrect(ctx, -90, -70, 180, 70, 10); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#e9cf9a'; A.rrect(ctx, -70, -55, 140, 40, 6); ctx.fill();
    ctx.fillStyle = '#5a3218'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-66 + i * 23, -55); ctx.lineTo(-54 + i * 23, -30); ctx.lineTo(-42 + i * 23, -55); ctx.fill(); }
    ctx.fillStyle = '#d6a850'; for (const dx of [-40, 40]) { ctx.fillRect(dx - 7, -74, 14, 10); }
    ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -70, 16, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }
  function shotPayoff(ctx, t) {
    const lt = t - 68.85;
    const cam = { x: 1100, y: 575, zoom: 1.5 + 0.016 * lt };
    ctx.save();
    A.camera(ctx, { ...cam, t, shake: 0.25 * decay(t, 70.62, 8) });
    roomBase(ctx, t, { tvGlow: 1.2 });
    drawTVSet(ctx, t, { badge: smooth(69.0, 69.35, t), live: -6 + (t - 68.85) });
    A.drawRouter(ctx, LR.router.x, LR.router.y, LR.router.s, { t, activity: 0.5, ledColor: GOLD_LED });
    // Saba in his armchair, turned to the table and to Noa
    const land = smooth(70.55, 70.65, t), laugh = env(t, 70.6, 70.75, 72.0, 72.35);
    const lm = 0.35 + 0.4 * Math.abs(Math.sin(t * 13));
    A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'back');
    const shakeDice = env(t, 69.55, 69.65, 69.95, 70.02);
    const throwK = smooth(69.98, 70.12, t) * (1 - smooth(70.5, 70.9, t));
    const sO = { t, pose: 'sit', mood: 'joy', gesture: 'none', look: laugh > 0.3 ? [0.8, -0.3] : [0.9, 0.35], lean: 0.25 - 0.3 * laugh, headTilt: -10 * laugh,
      handR: [lerp(150, 235, throwK) + 6 * Math.sin(t * 40) * shakeDice, lerp(-240, -150, throwK) + 10 * Math.sin(t * 37) * shakeDice], handShapeR: throwK > 0.5 ? 'open' : 'fist',
      mouth: laugh > 0.05 ? lm * laugh : 0.12, happy: 0.4 + 0.6 * laugh, browRaise: 0.3 * laugh, scarfWave: 0.3 * laugh };
    if (t < 69.55) Object.assign(sO, { handR: undefined, gesture: 'point', gestureFrom: 'none', gestureK: smooth(68.85, 69.1, t), mouth: undefined, look: [0.9, 0.4], lean: 0.2, happy: 0.4 });
    if (t > 71.45) Object.assign(sO, { gesture: 'point', handR: undefined, look: [0.9, 0.2] }); // "hey!" teasing finger at her move
    A.drawSaba(ctx, LR.chair.x, LR.chair.y, 0.95, sO);
    A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'front');
    // the case: latches pop at 69.0, lid swings open, board lands flat with a thunk at 69.95; then dice + checker move
    const lid = ease.inOut(inv(69.25, 69.95, t)), thunk = spring(t, 69.95, 10, 26);
    if (t < 69.95) {
      const co = { t, mode: 'case' };
      ctx.save(); ctx.translate(BOARD.x, BOARD.y); ctx.scale(1 + 0.04 * lid + 0.05 * spring(t, 69.0, 12, 30), 1 - 0.55 * lid); ctx.translate(-BOARD.x, -BOARD.y);
      if (A.drawBackgammon) A.drawBackgammon(ctx, BOARD.x, BOARD.y, BOARD.s * 1.2, co); else fallbackCase(ctx, BOARD.x, BOARD.y, BOARD.s * 1.2);
      ctx.restore();
      if (t > 69.0 && t < 69.3) for (const dx of [-30, 30]) star(ctx, BOARD.x + dx, BOARD.y - 38, 16 * Math.sin(inv(69.0, 69.3, t) * Math.PI) + 0.01, '#ffe7a0');
      if (lid > 0.4) { // the board unfolding
        ctx.save(); ctx.globalAlpha = smooth(0.4, 0.9, lid); ctx.translate(BOARD.x, BOARD.y); ctx.scale(lerp(0.6, 1, lid), lerp(0.3, 1, lid)); ctx.translate(-BOARD.x, -BOARD.y);
        const bo0 = { t, mode: 'board', dice: 0, diceVals: [6, 6], move: 0 };
        if (A.drawBackgammon) A.drawBackgammon(ctx, BOARD.x, BOARD.y, BOARD.s, bo0); else fallbackBoard(ctx, BOARD.x, BOARD.y, BOARD.s, bo0);
        ctx.restore();
      }
    } else {
      const bo = { t, mode: 'board', dice: inv(70.0, 70.6, t), diceVals: [6, 6], move: inv(71.05, 71.42, t) };
      ctx.save(); ctx.translate(BOARD.x, BOARD.y); ctx.scale(1 + 0.03 * thunk, 1 - 0.06 * thunk); ctx.translate(-BOARD.x, -BOARD.y);
      if (A.drawBackgammon) A.drawBackgammon(ctx, BOARD.x, BOARD.y, BOARD.s, bo); else fallbackBoard(ctx, BOARD.x, BOARD.y, BOARD.s, bo);
      ctx.restore();
      if (t < 70.3) { // dust puff from the thunk
        const u = inv(69.95, 70.3, t);
        for (let i = 0; i < 10; i++) { const a = Math.PI + (i / 9) * Math.PI, r = 30 + 80 * ease.out(u); ctx.globalAlpha = 0.35 * (1 - u); ctx.fillStyle = '#f3e3c8'; A.ellipse(ctx, BOARD.x + Math.cos(a) * r * 1.4, BOARD.y - 6 + Math.sin(a) * r * 0.25, 10 + 10 * u, 6 + 6 * u); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    }
    // "double six!" pop
    if (t > 70.6 && t < 71.4) {
      const u = inv(70.6, 71.4, t), k = ease.outBack(clamp(u * 3));
      ctx.save(); ctx.globalAlpha = 1 - smooth(1.1, 1.4, t - 70);
      ctx.translate(BOARD.x, BOARD.y - 120 - 30 * u); ctx.scale(k, k); ctx.rotate(-0.06);
      A.text(ctx, 'שש-שש!', 0, 0, { font: '900 44px Rubik', fill: '#ffd21f', stroke: A.OUTLINE, lw: 9, dir: 'rtl' });
      ctx.restore();
      for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU, r = 60 + 90 * ease.out(u); star(ctx, BOARD.x + Math.cos(a) * r, BOARD.y - 40 + Math.sin(a) * r * 0.5, 14 * (1 - u) + 0.01, '#ffe680'); }
    }
    // Noa on the pouf, cross-table, laughing, then moves a checker
    const reach = Math.max(env(t, 70.9, 71.05, 71.5, 71.7), env(t, 68.9, 69.0, 69.85, 70.0));
    A.drawNoa(ctx, LR.sofa.x, LR.sofa.y, 0.95, { t, pose: 'sit', flip: true, mood: 'joy', gesture: reach > 0 ? 'reach' : laugh > 0.4 ? 'cheer' : 'none', gestureFrom: 'none', gestureK: Math.max(reach, laugh > 0.4 ? smooth(70.6, 70.8, t) * (1 - smooth(71.0, 71.2, t)) : 0),
      reachTo: t < 70.2 ? [175, -70] : [165, -40], look: reach > 0 ? [0.8, 0.8] : laugh > 0.3 ? [0.8, -0.1] : [0.7, 0.5], mouth: laugh > 0.05 ? (0.3 + 0.4 * Math.abs(Math.sin(t * 11 + 1))) * laugh : 0.1, bounce: laugh, happy: laugh });
    ctx.restore();
  }

  // ================================================================== SHOT 4: router close-up, the competitors arrive late
  const LED = A.routerLED(LR.router.x, LR.router.y, LR.router.s);
  const MCAM = { x: 1478, y: 796, zoom: 5.4 };
  const CABLE = [[1680, 836], [1600, 834], [1545, 828], [1530, 812]]; // world pts: from off-screen right along the shelf into the router's side
  function cablePt(u) { // along CABLE polyline by fraction
    const segs = []; let L = 0;
    for (let i = 0; i < CABLE.length - 1; i++) { const l = Math.hypot(CABLE[i + 1][0] - CABLE[i][0], CABLE[i + 1][1] - CABLE[i][1]); segs.push(l); L += l; }
    let d = clamp(u) * L;
    for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [lerp(CABLE[i][0], CABLE[i + 1][0], k), lerp(CABLE[i][1], CABLE[i + 1][1], k)]; } d -= segs[i]; }
    return CABLE[CABLE.length - 1];
  }
  function drawCable(ctx) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(1700, 838); ctx.bezierCurveTo(1600, 838, 1560, 834, 1532, 812);
    ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#3a3a46'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function brandPacket(ctx, x, y, s, o) {
    if (A.drawBrandPacket) return A.drawBrandPacket(ctx, x, y, s, o);
    const mood = { panting: 'annoyed', grumpy: 'annoyed', sleepy: 'sleep', shock: 'shock' }[o.mood] || 'bored';
    A.drawPacket(ctx, x, y, s * 1.1, { t: o.t, kind: o.brand === 'EMBY' ? 'video' : 'update', seed: o.brand === 'EMBY' ? 3 : 7, mood, mouth: o.mouth ?? A.mouth(o.who || o.brand, o.t), look: o.look, rot: o.rot, noZ: true });
    ctx.save(); ctx.translate(x, y - 108 * s); ctx.rotate(-0.1);
    ctx.fillStyle = '#eee'; A.rrect(ctx, -34 * s, -12 * s, 68 * s, 24 * s, 5 * s); ctx.fill(); ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 2 * s; ctx.stroke();
    A.text(ctx, o.brand, 0, 0, { font: `800 ${15 * s}px Rubik`, fill: '#333' });
    ctx.restore();
  }
  function drawPackets(ctx, t) {
    const s = 0.3;
    // ILVIP: stumbles in along the cable, stops, pants; "Did... did we miss the goal?"; deflates on "GOTV got here first."
    if (t > 72.55) {
      const u = ease.out(inv(72.55, 73.05, t)), p = cablePt(u * 0.85);
      const bob = Math.abs(Math.sin(t * 16)) * 4 * (1 - smooth(72.95, 73.1, t));
      const x = p[0] - 18 * u, y = Math.max(p[1], 826) + 2 - bob;
      const deflate = smooth(75.7, 76.1, t);
      const mood = t < 73.0 ? 'panting' : t < 74.55 ? (t > 73.9 ? 'shock' : 'panting') : t < 75.7 ? 'shock' : 'grumpy';
      brandPacket(ctx, x, y, s, { t, brand: 'ILVIP', who: 'ILVIP', mood, flip: true, look: t < 74.6 ? [-0.9, -0.2] : [-0.9, 0.1], vel: [t < 73.05 ? -300 : 0, 0],
        rot: -0.05 * Math.sin(t * 7) * (1 - smooth(73, 73.3, t)) + 0.1 * deflate, squash: 0.12 * deflate + 0.05 * Math.sin(t * 9) * (t < 74.5 ? 1 : 0.3) });
    }
    // EMBY: arrives later, spinner still turning, flops over
    if (t > 73.5) {
      const u = ease.out(inv(73.5, 74.25, t)), p = cablePt(u * 0.52);
      const flop = ease.outBounce(inv(74.25, 74.6, t));
      brandPacket(ctx, p[0] + 14, Math.max(p[1], 828) + 4, s * 0.95, { t, brand: 'EMBY', who: 'EMBY', mood: t < 74.25 ? 'panting' : 'sleepy', spinner: 1, flip: true,
        rot: 0.35 * flop, look: [-0.8, 0.3], vel: [t < 74.25 ? -200 : 0, 0], mouth: 0.25 * Math.abs(Math.sin(t * 8)) * (1 - flop) });
    }
  }
  function drawRouterBit(ctx, t) {
    const bs = 0.27, x = LED[0] - 10, y = LR.router.y + 3;
    const o = { t, mood: 'exhausted', limbs: 'flop', shadow: 0.6, glow: 0.85, trail: 0, light: [-0.4, -0.8], rim: '#ffe7a0' };
    const pant = Math.sin(t * 9) * 0.03;
    o.squash = pant + 0.22 * spring(t, 72.48, 8, 20);
    o.hop = 10 * hop(t, 72.4, 72.48);
    // notices the late arrivals, lifts his head
    const turn = smooth(72.7, 73.0, t);
    o.look = [lerp(0, 0.9, turn), lerp(0.5, 0.1, turn)];
    if (t > 74.7) { // "Sorry, guys..." (sympathetic) -> "GOTV got here first." (proud)
      const pr = smooth(75.55, 75.8, t);
      Object.assign(o, { mood: pr > 0.5 ? 'cheeky' : 'exhausted', rot: -0.1 * pr - 0.05 * Math.sin((t - 74.7) * 2), look: [0.9, 0], browRaise: 3 * (1 - pr), squash: pant * (1 - pr) });
    }
    if (t >= 77.3) { // wink, sparkle ... happy conk-out -> glow burst
      const w = smooth(77.34, 77.4, t) * (1 - smooth(77.5, 77.54, t));
      Object.assign(o, { mood: t < 77.5 ? 'cheeky' : 'joy', wink: w, sparkle: 1, mouth: t < 77.5 ? 0.1 : 0, glow: lerp(0.9, 2, smooth(77.45, 77.6, t)), lid: t > 77.5 ? 1 : 0, look: [0.3, 0] });
    }
    A.drawBit(ctx, x, y, bs, o);
    if (t >= 77.34 && t < 77.6) { const s = Math.sin(inv(77.34, 77.58, t) * Math.PI); star(ctx, x + 44 * bs, y - 118 * bs, 34 * s * bs + 0.01, '#ffffff'); }
  }
  function shotMacro(ctx, t) {
    const d = inv(72.4, 77.8, t);
    const cam = { x: MCAM.x - 6 * d, y: MCAM.y + 3 * d, zoom: MCAM.zoom * (1 + 0.1 * ease.inOut(d)) };
    ctx.save();
    A.camera(ctx, { ...cam, t });
    A.drawLivingRoom(ctx, t, { tvGlow: 1.2, lamp: 1, snow: false });
    stbLabel(ctx);
    drawCable(ctx);
    A.drawRouter(ctx, LR.router.x, LR.router.y, LR.router.s, { t, activity: 0.3, ledColor: GOLD_LED, ledGlow: key(t, [[77.3, 0.15], [77.42, 0.8], [77.6, 0]]) });
    drawRouterBit(ctx, t);
    drawPackets(ctx, t);
    ctx.restore();
    macroGrade(ctx, t);
    const cut = 1 - smooth(72.4, 72.5, t); // soft in from the payoff
    if (cut > 0) { ctx.fillStyle = `rgba(255,236,200,${cut * 0.5})`; ctx.fillRect(0, 0, 1920, 1080); }
  }
  function star(ctx, x, y, r, c) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.18 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); A.glow(ctx, x, y, r * 1.6, c, 0.6); ctx.restore();
  }
  function macroGrade(ctx, t) {
    // shallow depth-of-field feel: darken the frame edges, warm/cool bokeh
    ctx.save(); ctx.globalAlpha = 0.55;
    ctx.fillStyle = A.radial(ctx, 960, 560, 300, 1150, [[0, 'rgba(8,4,20,0)'], [1, 'rgba(8,4,20,0.9)']]); ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const x = hash(i + 40) * 1920, y = hash(i + 50) * 420 + 20, r = 50 + hash(i + 60) * 70;
      A.glow(ctx, x + Math.sin(t * 0.3 + i) * 12, y, r, i % 3 ? '#ffb45e' : '#9ff5d0', 0.12);
    }
    // Bit's burst whiteout -> end card
    const w = smooth(77.5, 77.62, t);
    if (w > 0) {
      const g = ctx.createRadialGradient(840, 700, 0, 840, 700, 200 + w * 1600);
      g.addColorStop(0, `rgba(255,255,245,${w})`); g.addColorStop(0.5, `rgba(255,236,170,${w * 0.9})`); g.addColorStop(1, `rgba(255,220,120,${w * w})`);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
  }

  // ================================================================== END CARD
  let GL = null; // wordmark geometry, built once fonts are live
  // Geometric "G" (built from the same stroke language as the ring): big bowl, strong horizontal bar + spur,
  // so it can never read as a "C" even at thumbnail size.
  function gPath(g, F, bx, by) {
    const W = F * 0.2, capH = F * 0.735, r = (capH - W) / 2, cx = bx + r + W / 2, cy = by - capH / 2;
    g.beginPath();
    g.arc(cx, cy, r, -0.29 * Math.PI, -2 * Math.PI + 0.02, true); // top-right terminal, round the left, back up to 3 o'clock
    g.lineTo(cx + r, cy + r * 0.05);
    g.lineTo(cx + r * 0.02, cy + r * 0.05);                         // the bar
    return W;
  }
  function glyph(ch, F) {
    const pad = Math.round(F * 0.35), cw = Math.round(F * 1.1 + pad * 2), chh = Math.round(F * 1.2 + pad * 2);
    const m = document.createElement('canvas').getContext('2d'); m.font = `900 ${F}px Rubik`;
    const isG = ch === 'G';
    const adv = isG ? F * 0.735 + F * 0.02 : m.measureText(ch).width;
    const bx = pad, by = pad + F * 0.95; // baseline origin inside the canvas
    const depth = Math.round(F * 0.07), skew = -0.14;
    // shape ops: fill / outline, for text glyphs or the geometric G
    const FILL = (g, x, y) => { if (!isG) return g.fillText(ch, x, y); g.save(); const W = gPath(g, F, x, y); g.lineWidth = W; g.lineCap = 'butt'; g.lineJoin = 'miter'; g.strokeStyle = g.fillStyle; g.stroke(); g.restore(); };
    const LINE = (g, x, y) => { if (!isG) return g.strokeText(ch, x, y); g.save(); const W = gPath(g, F, x, y); g.lineWidth = W + g.lineWidth; g.lineCap = 'butt'; g.lineJoin = 'round'; g.stroke(); g.restore(); };
    const art = A.layer(`s7:g:${ch}:${F}`, cw, chh, g => {
      g.setTransform(1, 0, skew, 1, -skew * by, 0);
      g.font = `900 ${F}px Rubik`; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.lineWidth = F * 0.075; g.strokeStyle = '#060818';
      for (let d = depth; d >= 1; d -= 1) LINE(g, bx + d * 0.45, by + d);
      for (let d = depth; d >= 1; d -= 1) { g.fillStyle = A.mixc('#081446', '#1f4fbf', 1 - d / depth); FILL(g, bx + d * 0.45, by + d); }
      g.lineWidth = F * 0.075; g.strokeStyle = '#060818'; LINE(g, bx, by);
      g.lineWidth = F * 0.036; g.strokeStyle = '#2f63e0'; LINE(g, bx, by);
      g.fillStyle = A.linear(g, 0, by - F * 0.75, 0, by, [[0, '#fff7c2'], [0.34, '#ffe04a'], [0.55, '#ffd21f'], [1, '#f39a00']]);
      FILL(g, bx, by);
      const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = chh; const q = tmp.getContext('2d');
      q.setTransform(1, 0, skew, 1, -skew * by, 0); q.font = g.font; q.textBaseline = 'alphabetic';
      q.fillStyle = '#fff'; FILL(q, bx, by); q.globalCompositeOperation = 'destination-out'; FILL(q, bx + F * 0.012, by + F * 0.022);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.9; g.drawImage(tmp, 0, 0);
      q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, cw, chh);
      q.setTransform(1, 0, skew, 1, -skew * by, 0);
      q.fillStyle = '#c05a00'; FILL(q, bx, by); q.globalCompositeOperation = 'destination-out'; FILL(q, bx - F * 0.014, by - F * 0.024);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.55; g.drawImage(tmp, 0, 0); g.globalAlpha = 1;
    });
    const glow = A.layer(`s7:gg:${ch}:${F}`, cw, chh, g => { g.filter = `blur(${Math.round(F * 0.08)}px)`; g.drawImage(art, 0, 0); });
    return { ch, art, glow, adv, bx, by, cw, chh };
  }
  function buildLogo() {
    const B = CARD.logoBox;
    let F = 400;
    const m = document.createElement('canvas').getContext('2d');
    const widthAt = F => { m.font = `900 ${F}px Rubik`; return [...CARD.wordLeft].reduce((w, c) => w + (c === 'G' ? F * 0.755 : m.measureText(c).width), 0) + m.measureText(CARD.wordRight).width + F * 0.86 + F * 0.16; };
    F = Math.floor(Math.min(B.w / (widthAt(100) / 100), B.h / 0.92));
    const L = [...CARD.wordLeft].map(c => glyph(c, F)), R = [...CARD.wordRight].map(c => glyph(c, F));
    const ringD = F * 0.8, gap = F * 0.07, gapL = F * 0.14, gapR = F * 0.035;
    const total = L.reduce((s, g) => s + g.adv, 0) + R.reduce((s, g) => s + g.adv, 0) + ringD + gap * 2;
    const base = B.cy + F * 0.35; // baseline so that cap-height is centred in the box
    let x = B.cx - total / 2;
    const place = [];
    for (const g of L) { place.push({ g, x, side: -1 }); x += g.adv * 0.97; }
    x += gapL;
    const ring = { cx: x + ringD / 2 - F * 0.03, cy: base - F * 0.355, r: ringD / 2 - F * 0.02, w: F * 0.2 };
    x += ringD + gapR;
    for (const g of R) { place.push({ g, x, side: 1 }); x += g.adv * 0.97; }
    const V = place[place.length - 1];
    return { F, base, place, ring, vNotch: [V.x + V.g.adv * 0.5 + F * 0.12, base - F * 0.64] };
  }

  const cardBG = () => A.layer('s7:cardbg', 1920, 1080, g => {
    g.fillStyle = CARD.navy; g.fillRect(0, 0, 1920, 1080);
    g.fillStyle = A.radial(g, 960, 470, 0, 1100, [[0, '#26307e'], [0.35, '#171d57'], [1, 'rgba(13,16,51,0)']]); g.fillRect(0, 0, 1920, 1080);
    // stadium-like light fans from the top corners
    for (const [sx, dir] of [[-100, 1], [2020, -1]]) {
      for (let i = 0; i < 5; i++) {
        const a = (dir > 0 ? 0.45 : Math.PI - 0.45) + dir * i * 0.1, L = 1700;
        g.fillStyle = A.linear(g, sx, -80, sx + Math.cos(a) * L, -80 + Math.sin(a) * L, [[0, 'rgba(160,190,255,0.10)'], [1, 'rgba(160,190,255,0)']]);
        g.beginPath(); g.moveTo(sx, -80); g.lineTo(sx + Math.cos(a - 0.025) * L, -80 + Math.sin(a - 0.025) * L); g.lineTo(sx + Math.cos(a + 0.025) * L, -80 + Math.sin(a + 0.025) * L); g.fill();
      }
    }
    // faint pitch lines perspective floor at the bottom
    g.save(); g.globalAlpha = 0.07; g.strokeStyle = '#9fb6ff'; g.lineWidth = 2;
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(960 + i * 40, 900); g.lineTo(960 + i * 260, 1080); g.stroke(); }
    for (let j = 0; j < 5; j++) { const y = 900 + j * j * 9 + j * 12; g.beginPath(); g.moveTo(0, y); g.lineTo(1920, y); g.stroke(); }
    g.restore();
    g.fillStyle = A.linear(g, 0, 860, 0, 1080, [[0, 'rgba(13,16,51,0)'], [1, 'rgba(5,6,24,0.8)']]); g.fillRect(0, 860, 1920, 220);
  });

  function drawRing(ctx, R, prog, t) {
    // prog 0..1 = how much of the ring has been drawn by the light streak
    const a0 = -Math.PI * 0.62, a1 = a0 + A.TAU * clamp(prog);
    const skew = -0.14;
    ctx.save();
    ctx.translate(R.cx, R.cy); ctx.transform(1, 0, skew, 1, 0, 0);
    const arc = (r, off = [0, 0]) => { ctx.beginPath(); ctx.arc(off[0], off[1], r, a0, a1); };
    const full = prog >= 1;
    ctx.lineCap = full ? 'butt' : 'round';
    // inner disc
    if (full) {
      ctx.fillStyle = A.radial(ctx, -R.r * 0.25, -R.r * 0.3, 0, R.r * 1.1, [[0, '#3a6cf0'], [0.55, '#1f4fbf'], [1, '#0a1a5c']]);
      A.ellipse(ctx, 0, 0, R.r, R.r); ctx.fill();
    }
    const depth = Math.round(R.w * 0.35);
    ctx.lineWidth = R.w + R.w * 0.38; ctx.strokeStyle = '#060818';
    for (let d = depth; d >= 0; d -= 3) { arc(R.r, [d * 0.45, d]); ctx.stroke(); }
    for (let d = depth; d >= 1; d -= 1) { ctx.lineWidth = R.w; ctx.strokeStyle = A.mixc('#081446', '#1f4fbf', 1 - d / depth); arc(R.r, [d * 0.45, d]); ctx.stroke(); }
    ctx.lineWidth = R.w + R.w * 0.36; ctx.strokeStyle = '#060818'; arc(R.r); ctx.stroke();
    ctx.lineWidth = R.w + R.w * 0.18; ctx.strokeStyle = '#2f63e0'; arc(R.r); ctx.stroke();
    ctx.lineWidth = R.w; ctx.strokeStyle = A.linear(ctx, 0, -R.r - R.w, 0, R.r + R.w, [[0, '#fff7c2'], [0.3, '#ffe04a'], [0.6, '#ffd21f'], [1, '#f39a00']]); arc(R.r); ctx.stroke();
    // bevel lip
    ctx.lineWidth = R.w * 0.14; ctx.strokeStyle = 'rgba(255,255,240,0.75)';
    ctx.beginPath(); ctx.arc(-R.w * 0.03, -R.w * 0.06, R.r + R.w * 0.36, Math.max(a0, Math.PI * 1.02), Math.min(a1, Math.PI * 1.62)); ctx.stroke();
    ctx.restore();
  }

  function playIcon(ctx, R, k, t) {
    if (k <= 0) return;
    const s = R.r * 0.52 * k;
    ctx.save(); ctx.translate(R.cx + R.r * 0.07, R.cy); ctx.transform(1, 0, -0.14, 1, 0, 0);
    const tri = () => { ctx.beginPath(); ctx.moveTo(-s * 0.62, -s * 0.8); ctx.quadraticCurveTo(-s * 0.72, -s * 0.9, -s * 0.5, -s * 0.84); ctx.lineTo(s * 0.86, -s * 0.08); ctx.quadraticCurveTo(s * 1.0, 0, s * 0.86, s * 0.08); ctx.lineTo(-s * 0.5, s * 0.84); ctx.quadraticCurveTo(-s * 0.72, s * 0.9, -s * 0.62, s * 0.8); ctx.closePath(); };
    ctx.save(); ctx.translate(s * 0.05, s * 0.09); tri(); ctx.fillStyle = 'rgba(4,8,40,0.55)'; ctx.fill(); ctx.restore();
    tri(); ctx.fillStyle = A.linear(ctx, 0, -s, 0, s, [[0, '#ffffff'], [0.6, '#fff3b8'], [1, '#ffd21f']]); ctx.fill();
    ctx.lineWidth = s * 0.06; ctx.strokeStyle = '#060818'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // light streak from Bit (bottom centre) sweeping up into the ring start point
  function streak(ctx, t, R) {
    const u = inv(77.6, 77.8, t);
    if (u <= 0 || u >= 1.2) return;
    const a0 = -Math.PI * 0.62;
    const start = [R.cx + Math.cos(a0) * R.r, R.cy + Math.sin(a0) * R.r];
    const P = s => { // bezier from Bit's spot to the ring start, then the ring arc
      if (s < 0.45) {
        const q = s / 0.45, p0 = [880, 1000], p1 = [260, 820], p2 = [start[0] - 260, start[1] - 260], p3 = start;
        const mt = 1 - q; return [mt * mt * mt * p0[0] + 3 * mt * mt * q * p1[0] + 3 * mt * q * q * p2[0] + q * q * q * p3[0], mt * mt * mt * p0[1] + 3 * mt * mt * q * p1[1] + 3 * mt * q * q * p2[1] + q * q * q * p3[1]];
      }
      const a = a0 + ((s - 0.45) / 0.55) * A.TAU;
      return [R.cx + Math.cos(a) * R.r + (-0.14) * (Math.sin(a) * R.r), R.cy + Math.sin(a) * R.r];
    };
    const head = ease.inOut(clamp(u)), tail = Math.max(0, head - 0.3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [w, c, a] of [[80.5, '#ffb020', 0.25], [26, '#ffe070', 0.6], [9, '#ffffff', 1]]) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const s = lerp(tail, head, i / 40), p = P(s); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = w; ctx.stroke();
    }
    const hp = P(head); ctx.globalAlpha = 1;
    A.glow(ctx, hp[0], hp[1], 160, '#fff2b0', 0.9); A.glow(ctx, hp[0], hp[1], 50, '#ffffff', 1);
    ctx.restore();
    return head;
  }

  function cardParticles(ctx, t, R) {
    // drifting snow + slow confetti
    A.drawSnow(ctx, t, { count: 70, depth: [0.05, 0.6], size: 0.8, alpha: 0.55, wind: 0.2, speed: 0.5, seed: 21 });
    for (let i = 0; i < 38; i++) {
      const h = k => hash(i * 9.7 + 300 + k);
      const vy = 40 + h(1) * 50, H = 1200;
      const y = ((h(2) * H + (t - 77.5) * vy) % H) - 60;
      const x = h(3) * 1920 + Math.sin(t * (0.8 + h(4)) + h(5) * 6) * 30;
      ctx.globalAlpha = 0.55 * (0.5 + h(6) * 0.5);
      confettiPiece(ctx, x, y, 3.5 + h(7) * 4, t * (1 + h(8) * 3), Math.cos(t * (2 + h(9) * 4) + h(10) * 6), CONF_COLS[i % CONF_COLS.length]);
    }
    ctx.globalAlpha = 1;
    // slam burst sparks
    const tau = t - 77.8;
    if (tau > 0 && tau < 1.6) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const h = k => hash(i * 4.3 + 700 + k);
        const a = h(1) * A.TAU, sp = 900 + h(2) * 1500, k = 3 + h(3) * 2, e = (1 - Math.exp(-k * tau)) / k;
        const x = R.cx + Math.cos(a) * (R.r + sp * e), y = R.cy + Math.sin(a) * (R.r + sp * e) + 60 * tau * tau;
        const al = (1 - tau / 1.6) * (0.6 + h(4) * 0.4);
        ctx.globalAlpha = al; ctx.fillStyle = i % 3 ? '#ffe070' : '#8fb0ff';
        const r = 3 + h(5) * 4; A.ellipse(ctx, x, y, r, r); ctx.fill();
      }
      ctx.restore();
    }
  }

  function endCard(ctx, t) {
    if (!GL) GL = buildLogo();
    const R = GL.ring, B = CARD.logoBox, img = haveImg();
    const slam = t >= 77.8;
    const shake = decay(t, 77.8, 7) * 1.2;
    // TV-style ending: crash-zoom into Bit's wink (79.8 - 80.4), then hold
    const cz = crashZoom(t);
    ctx.save();
    if (cz.zoom > 1.0001) A.camera(ctx, cz);
    ctx.drawImage(cardBG(), 0, 0);
    // breathing light behind the logo
    const pulse = 1 + 0.06 * Math.sin((t - 77.8) * 2.4);
    A.glow(ctx, B.cx, B.cy, 820 * pulse, '#2a5bff', 0.28 * smooth(77.7, 78, t));
    A.glow(ctx, B.cx, B.cy + 20, 560, '#ffd21f', (0.16 + 0.5 * decay(t, 77.8, 3)) * smooth(77.75, 77.82, t));
    cardParticles(ctx, t, img ? { cx: B.cx, cy: B.cy, r: B.h * 0.4 } : R);

    ctx.save();
    A.camera(ctx, { x: 960, y: 540, zoom: 1 + 0.035 * decay(t, 77.8, 4) + 0.012 * inv(77.8, 80.5, t), shake, t });
    if (img) drawImageLogo(ctx, t);
    else drawWordmark(ctx, t);
    ctx.restore();

    // shockwave ring on the slam
    if (t > 77.8 && t < 78.4) {
      const u = inv(77.8, 78.4, t), cx = img ? B.cx : R.cx, cy = img ? B.cy : R.cy;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,230,140,${0.7 * (1 - u)})`; ctx.lineWidth = 26 * (1 - u) + 1;
      A.ellipse(ctx, cx, cy, 120 + ease.out(u) * 1100, 120 + ease.out(u) * 1100); ctx.stroke();
      ctx.restore();
    }
    drawTaglines(ctx, t);
    drawCardBit(ctx, t);
    ctx.restore();
    crashFX(ctx, t);
    // white-out from Bit's burst settles into the card; slam flash
    const wf = Math.max(0.9 * (1 - smooth(77.62, 77.7, t)), slam ? 0.55 * decay(t, 77.8, 9) : 0);
    if (wf > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,244,210,${wf})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  const logoBuf = () => A.layer('s7:logobuf', 1920, 1080, () => {});
  function drawWordmark(ctx, t) {
    const R = GL.ring;
    const prog = inv(77.7, 77.8, t) >= 1 ? 1 : clamp((ease.inOut(inv(77.6, 77.8, t)) - 0.45) / 0.55);
    // glow halo (bloom) under the letters
    const out = smooth(77.8, 77.8, t);
    const letterK = g => { // letters burst out of the ring sideways, overshoot, settle
      const u = inv(77.8, 78.08, t); const e = ease.outBack(u);
      return { dx: (1 - e) * (R.cx - (g.x + g.g.adv / 2)), s: lerp(0.4, 1, clamp(e * 1.0)) };
    };
    const float = Math.sin((t - 77.8) * 1.8) * 4 * smooth(78.1, 78.5, t);
    ctx.save(); ctx.translate(0, float);
    if (out > 0) {
      // bloom
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.6 * decay(t, 77.8, 2.5);
      for (const p of GL.place) { const k = letterK(p); ctx.save(); ctx.translate(p.x + k.dx + p.g.adv / 2, GL.base); ctx.scale(k.s, k.s); ctx.drawImage(p.g.glow, -p.g.adv / 2 - p.g.bx, -p.g.by); ctx.restore(); }
      ctx.restore();
      for (const p of GL.place) {
        const k = letterK(p);
        ctx.save(); ctx.translate(p.x + k.dx + p.g.adv / 2, GL.base); ctx.scale(k.s, k.s); ctx.globalAlpha = clamp(inv(77.8, 77.86, t));
        ctx.drawImage(p.g.art, -p.g.adv / 2 - p.g.bx, -p.g.by); ctx.restore();
      }
    }
    // ring on top (letters emerge from behind it)
    const ringPop = 1 + 0.18 * spring(t, 77.8, 6, 14);
    ctx.save(); ctx.translate(R.cx, R.cy); ctx.scale(ringPop, ringPop); ctx.translate(-R.cx, -R.cy);
    A.glow(ctx, R.cx, R.cy, R.r * 2.2, '#ffd21f', 0.18 * smooth(77.75, 77.8, t));
    drawRing(ctx, R, prog, t);
    playIcon(ctx, R, ease.outBack(inv(77.82, 78.1, t)), t);
    // orbiting glint (Bit's light living in the ring)
    if (prog >= 1) {
      const a = -Math.PI * 0.62 + (t - 77.8) * 2.2;
      const gx = R.cx + Math.cos(a) * R.r - 0.14 * Math.sin(a) * R.r, gy = R.cy + Math.sin(a) * R.r;
      A.glow(ctx, gx, gy, R.w * 1.1, '#fff6c8', 0.35); star(ctx, gx, gy, R.w * 0.32, '#ffffff');
    }
    ctx.restore();
    streak(ctx, t, R);
    ctx.restore();
    // shine sweep across the whole wordmark (masked to letters via buffer)
    const su = inv(78.55, 79.2, t);
    if (su > 0 && su < 1) {
      const buf = logoBuf(), g = buf.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1920, 1080);
      g.translate(0, float);
      for (const p of GL.place) g.drawImage(p.g.art, p.x - p.g.bx, GL.base - p.g.by);
      g.lineWidth = R.w; g.strokeStyle = '#fff'; g.beginPath(); g.ellipse(R.cx, R.cy, R.r, R.r, 0, 0, A.TAU); g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-in';
      const x = lerp(300, 1700, ease.inOut(su));
      g.fillStyle = A.linear(g, x - 160, 0, x + 160, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
      g.save(); g.translate(x, 540); g.transform(1, 0, -0.5, 1, 0, 0); g.translate(-x, -540); g.fillRect(0, 0, 1920, 1080); g.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8; ctx.drawImage(buf, 0, 0); ctx.restore();
    }
  }

  function drawImageLogo(ctx, t) {
    const B = CARD.logoBox, iw = logoImg.naturalWidth, ih = logoImg.naturalHeight;
    const s = Math.min(B.w / iw, B.h / ih), w = iw * s, h = ih * s;
    const u = inv(77.8, 78.1, t), e = ease.outBack(u);
    const sc = t < 77.8 ? 0 : lerp(0.6, 1, e) * (1 + 0.012 * Math.sin((t - 77.8) * 1.8) * smooth(78.1, 78.5, t));
    const R = { cx: B.cx, cy: B.cy, r: Math.min(w, h) * 0.4, w: 20 };
    streak(ctx, t, R);
    if (sc <= 0) return;
    ctx.save(); ctx.translate(B.cx, B.cy); ctx.scale(sc, sc);
    A.glow(ctx, 0, 0, Math.max(w, h) * 0.7, '#ffd21f', 0.25 + 0.5 * decay(t, 77.8, 3));
    ctx.drawImage(logoImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // Bit on the card: pops up between the logo and the taglines (~78.6), idles, winks (~79.6), crash-zoom onto the wink
  const BIT_FACE = () => [CARD.bit.x + 18 * CARD.bit.s, CARD.bit.y - 64 * CARD.bit.s]; // his face / winking eye area
  function crashZoom(t) {
    const k = ease.in(inv(79.8, 80.12, t)), settle = spring(t, 80.12, 7, 16);
    const zoom = t < 79.8 ? 1 : lerp(1, 5.2, k) - 0.35 * settle * (t > 80.12 ? 1 : 0) + 0.12 * smooth(80.12, 81, t);
    const f = BIT_FACE(), q = t < 79.8 ? 0 : clamp((1 - 1 / zoom) / (1 - 1 / 5.2)); // keep the face drifting to centre as we punch in
    return { x: lerp(960, f[0], q), y: lerp(540, f[1], q), zoom, t, shake: 0.6 * decay(t, 80.12, 9) * (t > 80.12 ? 1 : 0) };
  }
  function crashFX(ctx, t) {
    if (t > 79.8 && t < 80.2) { // speed lines rushing out
      const u = inv(79.8, 80.2, t);
      ctx.save(); ctx.globalAlpha = 0.5 * Math.sin(u * Math.PI); ctx.fillStyle = '#fff6d8';
      for (let i = 0; i < 54; i++) {
        const a = (i / 54) * A.TAU + hash(i + 3) * 0.1, r0 = 360 + hash(i + 5) * 260 - 200 * u, r1 = 1400, w = 0.01 + hash(i + 9) * 0.012;
        ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r0, 540 + Math.sin(a) * r0);
        ctx.lineTo(960 + Math.cos(a + w) * r1, 540 + Math.sin(a + w) * r1); ctx.lineTo(960 + Math.cos(a - w) * r1, 540 + Math.sin(a - w) * r1); ctx.fill();
      }
      ctx.restore();
    }
    const fl = decay(t, 80.12, 10) * (t > 80.12 ? 0.45 : 0);
    if (fl > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${fl})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }
  function drawCardBit(ctx, t) {
    if (t < 78.55) return;
    const { x, y: y0, s: bs } = CARD.bit;
    const u = inv(78.55, 78.9, t), pop = ease.outBack(u);
    const y = y0 + (1 - clamp(pop)) * 60 - 26 * hop(t, 78.55, 78.9) - 6 * Math.abs(Math.sin((t - 78.9) * 3.2)) * smooth(78.9, 79.1, t) * (1 - smooth(79.5, 79.6, t));
    const sc = bs * lerp(0.3, 1, clamp(pop * 1.05));
    A.glow(ctx, x, y - 60 * bs, 170 * bs, '#ffd21f', 0.3 * clamp(u * 2));
    const w = smooth(79.55, 79.68, t);
    A.drawBit(ctx, x, y, sc, { t, mouth: 0, mood: t < 79.5 ? 'joy' : 'cheeky', joyEyes: 'open', limbs: t < 79.5 ? 'arms-up' : 'stand', wink: w, winkEye: 'R', trail: 0, glow: 1.25,
      look: [0, 0.05], sparkle: w, squash: 0.18 * spring(t, 78.9, 9, 22), shadow: 0,
      armR: t >= 79.5 ? [58, -86 - 6 * Math.sin((t - 79.5) * 14)] : undefined });
    if (t > 79.6 && t < 81) { // wink glint next to the winking eye
      const q = inv(79.6, 79.9, t), s = Math.sin(clamp(q) * Math.PI * 0.5 + (q >= 1 ? 0 : 0)) * (0.8 + 0.2 * Math.sin(t * 9));
      star(ctx, x + 52 * bs, y - 104 * bs, 26 * s + 0.01, '#fff6c8');
    }
  }

  function drawTaglines(ctx, t) {
    const he = ease.out(inv(78.02, 78.25, t)), en = ease.out(inv(78.1, 78.32, t)), ti = ease.out(inv(78.16, 78.38, t));
    if (he > 0) {
      ctx.save(); ctx.globalAlpha = he;
      const y = CARD.tagHeY + (1 - he) * 26;
      A.glow(ctx, 960, y, 420, '#2a5bff', 0.18 * he);
      A.text(ctx, CARD.tagHe, 960, y, { font: '700 64px Rubik', fill: '#ffffff', stroke: 'rgba(6,8,24,0.85)', lw: 8, dir: 'rtl' });
      ctx.restore();
    }
    if (en > 0) {
      ctx.save(); ctx.globalAlpha = en;
      const y = CARD.tagEnY + (1 - en) * 20;
      ctx.font = '500 40px Rubik'; ctx.direction = 'rtl';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd21f';
      ctx.fillText(CARD.tagEn, 960, y);
      const w = ctx.measureText(CARD.tagEn).width / 2 + 34;
      ctx.fillStyle = 'rgba(255,210,31,0.7)';
      for (const s of [-1, 1]) { ctx.fillRect(960 + s * w - (s < 0 ? 70 : 0), y - 1.5, 70 * en, 3); }
      ctx.restore();
    }
    if (ti > 0) {
      ctx.save(); ctx.globalAlpha = ti * 0.85; ctx.direction = 'ltr';
      const [enT, heT] = CARD.filmTitle.split(' · ');
      const y = CARD.filmTitleY - (1 - ti) * 14;
      ctx.font = '500 28px Rubik'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#c9d3ff';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
      const we = ctx.measureText(enT).width;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
      ctx.font = '500 30px Rubik'; const wh = ctx.measureText(heT || '').width;
      const gap = 44, x0 = 960 - (we + gap + wh) / 2;
      ctx.font = '500 28px Rubik'; if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
      ctx.textAlign = 'left'; ctx.fillText(enT, x0, y);
      ctx.fillStyle = '#ffd21f'; A.ellipse(ctx, x0 + we + gap / 2 - 2, y, 4, 4); ctx.fill();
      if (heT) { ctx.fillStyle = '#c9d3ff'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1px'; ctx.font = '500 30px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillText(heT, x0 + we + gap + wh, y); }
      ctx.restore();
    }
  }

  // ================================================================== register
  A.scene({
    name: 's7_goal', start: 58.9, end: 81.0, shift: 0,
    draw(ctx, s) {
      const t = s.t;
      if (t < T_CUT_ROOM) shotTV(ctx, t);
      else if (t < T_PAYOFF) shotRoom(ctx, t);
      else if (t < T_MACRO) shotPayoff(ctx, t);
      else if (t < T_CARD) shotMacro(ctx, t);
      else endCard(ctx, t);
    },
  });
})();
