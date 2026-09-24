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
    logoBox: { cx: 960, cy: 440, w: 1120, h: 330 },     // the wordmark / client logo image is fitted into this box
    logoImage: 'assets/gotv_logo.png',                    // if this file exists it replaces the synthesized wordmark
    wordLeft: 'G', wordRight: 'TV',                        // wordmark = wordLeft + [ring "O"] + wordRight
    tagHe: 'הטלוויזיה מהבית. בכל מקום.',
    tagEn: 'Live TV from Israel. Anywhere.',
    filmTitle: 'PACKET FROM HOME · חבילה מהבית',
    tagHeY: 738, tagEnY: 812, filmTitleY: 138,
    navy: '#0d1033', yellow: '#ffd21f', blue: '#1f4fbf',
  };
  const logoImg = new Image(); logoImg.src = CARD.logoImage;
  const haveImg = () => logoImg.complete && logoImg.naturalWidth > 0;

  A.noSubs = t => t > 57.2;

  const { clamp, lerp, inv, smooth, ease, hash, key } = A;
  const LR = A.LR;
  const T_CUT_ROOM = 46.93, T_CARD = 57.2;

  // ================================================================== small helpers
  const env = (t, a, b, c, d) => Math.min(smooth(a, b, t), 1 - smooth(c, d, t)); // attack a..b, release c..d
  const decay = (t, t0, k) => (t < t0 ? 0 : Math.exp(-(t - t0) * k));
  const spring = (t, t0, k = 7, w = 16) => (t < t0 ? 0 : Math.exp(-(t - t0) * k) * Math.cos((t - t0) * w));
  const hop = (t, a, b) => { const u = inv(a, b, t); return u > 0 && u < 1 ? 4 * u * (1 - u) : 0; };

  // ================================================================== SHOT 1: TV close-up
  function shotTV(ctx, t) {
    const tv = LR.tv, cx = tv.x + tv.w / 2, cy = tv.y + tv.h / 2;
    const punch = spring(t, 46.4, 9, 20) * 0.12 + (t > 46.4 ? 0.06 * smooth(46.4, 46.9, t) : 0);
    const zoom = lerp(4.46, 4.62, ease.out(inv(46.0, 46.93, t))) + punch;
    const shake = decay(t, 46.4, 7) * 1.1 + decay(t, 46.06, 12) * 0.5;
    ctx.save();
    A.camera(ctx, { x: cx, y: cy + 4, zoom, shake, t });
    const unfrozen = t >= 46.07;
    const pop = smooth(46.0, 46.07, t);
    if (!unfrozen) A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'freeze', freezeGlitch: 0, spinner: 1 - pop, bufferPct: 100 });
    else A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'goal' });
    ctx.restore();
    // unfreeze pop: bright ring from the spinner centre + a scanline snap
    if (t >= 46.03 && t < 46.35) {
      const u = inv(46.03, 46.35, t);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(200,255,240,${0.8 * (1 - u)})`; ctx.lineWidth = 30 * (1 - u) + 2;
      A.ellipse(ctx, 960, 540, 60 + ease.out(u) * 900, 60 + ease.out(u) * 900); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - u)})`; ctx.fillRect(0, 540 - 300 * (1 - u), 1920, 600 * (1 - u));
      ctx.restore();
    }
    // radial speed lines on the net hit (comic accent, 3 frames)
    if (t >= 46.4 && t < 46.56) {
      const u = inv(46.4, 46.56, t);
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
    const wf = 1 - smooth(46.0, 46.22, t);
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
    if (t < 47.6) return;
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
    const rainA = smooth(47.75, 48.2, t) * (1 - smooth(52.0, 53.6, t));
    if (rainA > 0) {
      for (let i = 0; i < 120; i++) {
        const h = k => hash(i * 3.71 + 900 + k);
        const t0 = 47.7 + h(1) * 1.4, tau = t - t0; if (tau < 0) continue;
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
    const t0 = 47.62; if (t < t0) return;
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
  function lampAngle(t) { return 0.05 * (spring(t, 47.66, 2.4, 10) + 0.55 * spring(t, 48.4, 2.8, 11)); }
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
    if (t < 47.25) { // frozen disbelief, hands on head, jaw dropped
      Object.assign(o, { mood: 'neutral', gesture: 'headHands', jaw: 0.55, mouth: 0.45, browRaise: 0.9, lid: 0, look: [0.9, -0.35], idle: 0.15, lean: -0.08 * smooth(46.9, 47.25, t), scarfWave: 0, happy: 0 });
    } else if (t < 47.6) { // anticipation squat
      const k = ease.inOut(inv(47.25, 47.58, t));
      Object.assign(o, { mood: 'joy', moodFrom: 'neutral', moodK: k, gesture: 'fists', gestureFrom: 'headHands', gestureK: k, squash: 0.2 * k, lean: 0.25 * k, look: [0.8, -0.2], mouth: lerp(0.45, 0.2, k), browRaise: -0.3 * k, scarfWave: 0.2 });
    } else if (t < 48.38) { // LEAP
      const u = inv(47.6, 48.38, t), air = 1.55 * 4 * u * (1 - u);
      Object.assign(o, { pose: 'jump', air, gesture: 'armsUp', gestureFrom: 'fists', gestureK: smooth(0, 0.25, u), scarfWave: 1, mouth: 0.85, look: [0.4, -0.6],
        squash: u < 0.12 ? -0.16 * (1 - u / 0.12) : u > 0.9 ? -0.06 : 0, vel: [0, lerp(-1400, 1400, u)], lean: -0.15 });
      x = lerp(790, 800, u);
    } else if (t < 48.8) { // land (squash + overshoot) and roar "Gooool!"
      const sq = 0.24 * spring(t, 48.38, 9, 22);
      Object.assign(o, { squash: sq, lean: -0.25 * smooth(48.38, 48.6, t), look: [0.3, -0.7], scarfWave: 1, headTilt: -6, vel: [0, 300 * decay(t, 48.38, 6)] });
      x = 800;
    } else if (t < 49.12) { // turn & point at Noa
      const k = ease.outBack(inv(48.8, 49.0, t));
      Object.assign(o, { gesture: 'point', gestureFrom: 'armsUp', gestureK: clamp(k), lean: lerp(-0.25, 0.3, clamp(k)), look: [1, 0.25], scarfWave: 0.7, browRaise: 0.3 });
      x = 800;
    } else if (t < 50.0) { // happy hops toward her
      const h1 = hop(t, 49.14, 49.55), h2 = hop(t, 49.58, 49.98);
      const air = Math.max(h1, h2) * 0.5;
      Object.assign(o, { pose: air > 0.01 ? 'jump' : 'stand', air, gesture: 'armsUp', gestureFrom: 'point', gestureK: smooth(49.1, 49.3, t), look: [1, 0.3], lean: 0.2, scarfWave: 1, squash: (air < 0.01 ? 0.1 : -0.04), vel: [500, 0] });
      x = lerp(800, 900, ease.inOut(inv(49.14, 49.98, t)));
    } else { // scoop & hug
      const k = ease.inOut(inv(50.0, 50.45, t));
      x = 900 + 20 * k;
      const rock = Math.sin((t - 50.45) * 4.2) * smooth(50.4, 50.7, t) * (1 - smooth(51.1, 51.5, t));
      Object.assign(o, { gesture: 'none', mood: 'joy', happy: 1, lean: lerp(0.35, 0.05, smooth(50.15, 50.5, t)) + rock * 0.1, headTilt: 8 * k + rock * 4,
        handL: [lerp(40, 150, k), lerp(-250, -270, k)], handR: [lerp(90, 190, k), lerp(-300, -330, k)], handShapeL: 'open', handShapeR: 'open', armRBehind: true,
        look: [1, 0.1], scarfWave: 0.4 * (1 - smooth(51, 52, t)), mouth: t < 50.5 ? 0.3 : undefined });
      if (t > 51.2) { // listening, then puzzled look at the router
        const p = smooth(52.35, 52.8, t);
        Object.assign(o, { mood: 'neutral', moodFrom: 'joy', moodK: smooth(51.4, 51.9, t), happy: lerp(0.6, 0, p), look: [lerp(0.7, 0.8, p), lerp(0.0, 0.85, p)],
          browAngle: 0.7 * p, browL: 0.6 * p, browR: -0.25 * p, headTilt: lerp(6, 14, p), lean: lerp(0.05, 0.12, p), smile: lerp(0.5, -0.2, p) });
      }
    }
    return { x, y, o };
  }

  function noaState(t) {
    const o = { t, flip: true, pose: 'stand', mood: 'joy', gesture: 'cheer' };
    let x = 1395, y = 900;
    if (t < 47.66) {
      Object.assign(o, { flip: false, pose: 'crouch', mood: 'focused', moodFrom: 'focused', gesture: 'reach', gestureFrom: 'reach', reachTo: [150, -60], look: [0.1, -1], mouth: 0.25 * smooth(46.95, 47.2, t) });
      x = 1360;
    } else if (t < 48.7) { // springs up and cheers
      const u = inv(47.66, 47.85, t);
      Object.assign(o, { squash: u < 1 ? -0.12 * (1 - u) : 0.08 * spring(t, 47.85, 8, 20), look: [0.6, -0.3], mouth: 0.6, bounce: 1 });
      y = 900 - 40 * hop(t, 47.66, 47.95) - 28 * hop(t, 48.05, 48.4);
      x = 1360;
    } else if (t < 50.0) { // hops toward Saba
      const h1 = hop(t, 48.75, 49.15), h2 = hop(t, 49.2, 49.6);
      y = 900 - 36 * Math.max(h1, h2);
      x = lerp(1360, 1175, ease.inOut(inv(48.75, 49.6, t)));
      Object.assign(o, { look: [0.8, -0.1], mouth: 0.35, bounce: 1, vel: [-500, 0], gesture: 'cheer' });
      if (t > 49.6) Object.assign(o, { gesture: 'none', gestureFrom: 'cheer', gestureK: smooth(49.6, 49.95, t), mood: 'joy', squash: 0.06 * spring(t, 49.6, 8, 18) });
    } else { // scooped up into the hug
      const k = ease.inOut(inv(50.05, 50.5, t));
      x = lerp(1175, 1080, k); y = lerp(900, 745, k) + 12 * Math.sin((t - 50.45) * 4.2) * smooth(50.4, 50.7, t) * (1 - smooth(51.1, 51.5, t));
      Object.assign(o, { hug: k, gesture: 'none', mood: 'joy', look: [0.9, 0], bounce: 0.6 });
      if (t > 51.2) { // talks: pulls back a little, then glances at the router
        const q = smooth(51.25, 51.6, t), r = smooth(52.2, 52.6, t);
        Object.assign(o, { hug: lerp(1, 0.55, q), mood: 'proud', moodFrom: 'joy', moodK: q, look: [lerp(0.8, -0.9, r), lerp(0, 0.8, r)], headTilt: lerp(0, -6, r) });
      }
    }
    return { x, y, o };
  }

  // ================================================================== SHOT 2+3: living room (master -> two-shot -> router macro)
  function roomCam(t) {
    if (t < 51.2) {
      const x = key(t, [[46.93, 985], [47.6, 995], [50.0, 1000], [51.2, 1020]]);
      const y = key(t, [[46.93, 560], [47.6, 565], [48.0, 545, 'out'], [51.2, 540]]);
      const zoom = key(t, [[46.93, 1.19], [47.58, 1.24, 'inOut'], [47.75, 1.17, 'out'], [50.0, 1.2], [51.2, 1.25]]);
      return { x, y, zoom };
    }
    // two-shot in the hug, then follow their gaze to the router
    const tw = { x: 1020, y: 505, zoom: 2.05 }, rt = { x: 1458, y: 800, zoom: 6.4 };
    const drift = inv(51.2, 53.3, t);
    const a = { x: tw.x + 10 * drift, y: tw.y, zoom: tw.zoom + 0.08 * drift };
    if (t < 53.3) return a;
    const p = ease.inOut(inv(53.3, 54.25, t));
    const lz = Math.exp(lerp(Math.log(a.zoom), Math.log(rt.zoom), p));
    // keep the path on a gentle curve: centre moves in screen space proportionally to zoom change
    const q = (1 / a.zoom - 1 / lz) / (1 / a.zoom - 1 / rt.zoom);
    const cam = { x: lerp(a.x, rt.x, q), y: lerp(a.y, rt.y, q), zoom: lz };
    if (t > 54.25) { const d = inv(54.25, 57.2, t); cam.zoom = rt.zoom * (1 + 0.1 * ease.out(d)); cam.x = rt.x - 8 * d; cam.y = rt.y + 4 * d; }
    return cam;
  }

  function shotRoom(ctx, t) {
    const cam = roomCam(t);
    const shake = decay(t, 47.6, 3.2) * 1.4 + decay(t, 48.38, 6) * 0.7;
    const flash = Math.max(decay(t, 47.6, 3.5) * (t >= 47.6 ? 1 : 0), decay(t, 46.93, 8) * 0.35);
    const macro = t > 53.3;
    ctx.save();
    A.camera(ctx, { ...cam, shake, t });
    A.drawLivingRoom(ctx, t, { tvGlow: { color: t < 48 ? '#bfffd8' : '#ffe9a0', intensity: 1.3 + 0.5 * decay(t, 46.93, 3) }, lamp: 0 });
    lampRock(ctx, t, (1 + 0.4 * decay(t, 47.6, 3)) * (0.95 + 0.05 * A.noise1(t * 2.3)));
    if (flash > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(flash) * 0.6;
      ctx.fillStyle = A.radial(ctx, 960, 480, 0, 1300, [[0, '#fff6e0'], [1, '#ffcf80']]); ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
    const tv = LR.tv;
    A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, { state: 'goal' });
    const ledC = A.mixc('#7ff6ff', '#7dffa8', smooth(56.9, 57.2, t));
    const bitOut = t > 54.38;
    A.drawRouter(ctx, LR.router.x, LR.router.y, LR.router.s, { t, activity: macro ? 0.35 : 0.7, ledGlow: bitFlare(t), ledColor: ledC, shake: key(t, [[54.3, 0], [54.4, 1.2], [54.7, 0]]) });
    if (!macro || t < 53.9) {
      A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'back');
      A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'front');
      const S = sabaState(t), N = noaState(t);
      const hugging = t >= 50.0;
      if (hugging) { A.drawSaba(ctx, S.x, S.y, 0.95, S.o); A.drawNoa(ctx, N.x, N.y, 0.95, N.o); }
      else { A.drawNoa(ctx, N.x, N.y, 0.95, N.o); A.drawSaba(ctx, S.x, S.y, 0.95, S.o); }
      drawSnacks(ctx, t);
    }
    if (bitOut) drawTinyBit(ctx, t);
    ctx.restore();
    if (!macro || t < 54.0) {
      drawConfetti(ctx, t, [[680, 330, -1, 47.62], [930, 330, 1, 47.64]]);
    }
    if (macro) macroGrade(ctx, t);
    // cut punch: brief white-hot flash on the leap
    if (t >= 47.6 && t < 47.7) { ctx.fillStyle = `rgba(255,248,225,${0.35 * (1 - inv(47.6, 47.7, t))})`; ctx.fillRect(0, 0, 1920, 1080); }
  }

  // ------------------------------------------------------------------ macro: tiny Bit at the router
  const LED = A.routerLED(LR.router.x, LR.router.y, LR.router.s);
  function bitFlare(t) { return key(t, [[54.2, 0], [54.38, 1.6, 'in'], [54.6, 0.2, 'out'], [56.9, 0.2], [57.0, 0.8], [57.2, 0]]); }
  function drawTinyBit(ctx, t) {
    const bs = 0.27; // world scale (screen ~1.8 at the macro zoom)
    const land = [LED[0] - 6, LR.router.y + 3];
    let x, y, o = { t, mood: 'exhausted', limbs: 'flop', shadow: 0.6, glow: 0.8, trail: 0, light: [-0.4, -0.8], rim: '#a8f7ff' };
    let sc = bs;
    if (t < 54.52) { // squeezes out of the LED and drops
      const u = inv(54.38, 54.52, t);
      x = lerp(LED[0], land[0], u); y = lerp(LED[1] + 14, land[1], u * u);
      sc = bs * lerp(0.35, 1, ease.outBack(clamp(u * 1.4)));
      Object.assign(o, { mood: 'panic', limbs: 'fly', vel: [0, 900], rot: -0.3 * (1 - u), glow: 1.4 });
    } else {
      x = land[0]; y = land[1];
      const tau = t - 54.52;
      const pant = Math.sin(t * 9) * 0.03 * (t < 56.9 ? 1 : 0.3);
      Object.assign(o, { squash: 0.25 * spring(t, 54.52, 8, 20) + pant });
      if (t > 55.5 && t < 56.9) o.rot = -0.08 * Math.sin((t - 55.5) * 2.2); // lifts his head a bit to deliver the line
      if (t >= 56.9) { // wink, sparkle ... happy conk-out
        const w = smooth(56.9, 56.98, t) * (1 - smooth(57.05, 57.12, t));
        Object.assign(o, { mood: t < 57.05 ? 'cheeky' : 'joy', limbs: 'flop', wink: w, sparkle: 1, mouth: t < 57.05 ? 0.1 : 0, glow: lerp(0.9, 2, smooth(57.0, 57.2, t)), lid: t > 57.05 ? 1 : 0 });
      }
      void tau;
    }
    A.drawBit(ctx, x, y, sc, o);
    if (t >= 56.9 && t < 57.3) { // sparkle glint by the wink
      const u = inv(56.9, 57.2, t), s = Math.sin(u * Math.PI);
      star(ctx, x + 40 * bs * 1.1, y - 118 * bs, 28 * s * bs * 1.3 + 0.01, '#ffffff');
    }
  }
  function star(ctx, x, y, r, c) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.18 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); A.glow(ctx, x, y, r * 1.6, c, 0.6); ctx.restore();
  }
  function macroGrade(ctx, t) {
    const k = smooth(53.6, 54.3, t);
    // shallow depth-of-field feel: darken the frame edges, warm/cool bokeh
    ctx.save();
    ctx.globalAlpha = 0.55 * k;
    ctx.fillStyle = A.radial(ctx, 960, 560, 300, 1150, [[0, 'rgba(8,4,20,0)'], [1, 'rgba(8,4,20,0.9)']]); ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
    if (k > 0) {
      for (let i = 0; i < 9; i++) {
        const x = hash(i + 40) * 1920, y = hash(i + 50) * 420 + 20, r = 50 + hash(i + 60) * 70;
        A.glow(ctx, x + Math.sin(t * 0.3 + i) * 12, y, r, i % 3 ? '#ffb45e' : '#9ff5d0', 0.12 * k);
      }
    }
    // Bit's burst whiteout -> end card
    const w = smooth(57.02, 57.2, t);
    if (w > 0) {
      const b = A.bitCore ? A.bitCore(0, 0, 1) : [0, 0]; void b;
      const g = ctx.createRadialGradient(960, 720, 0, 960, 720, 200 + w * 1600);
      g.addColorStop(0, `rgba(255,255,245,${w})`); g.addColorStop(0.5, `rgba(255,236,170,${w * 0.9})`); g.addColorStop(1, `rgba(255,220,120,${w * w})`);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    }
  }

  // ================================================================== END CARD
  let GL = null; // wordmark geometry, built once fonts are live
  function glyph(ch, F) {
    const pad = Math.round(F * 0.35), cw = Math.round(F * 1.1 + pad * 2), chh = Math.round(F * 1.2 + pad * 2);
    const m = document.createElement('canvas').getContext('2d'); m.font = `900 ${F}px Rubik`;
    const adv = m.measureText(ch).width;
    const bx = pad, by = pad + F * 0.95; // baseline origin inside the canvas
    const depth = Math.round(F * 0.07), skew = -0.14;
    const art = A.layer(`s7:g:${ch}:${F}`, cw, chh, g => {
      g.setTransform(1, 0, skew, 1, -skew * by, 0);
      g.font = `900 ${F}px Rubik`; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      // extrusion (3D bevel depth)
      g.lineWidth = F * 0.075; g.strokeStyle = '#060818';
      for (let d = depth; d >= 1; d -= 1) { g.strokeText(ch, bx + d * 0.45, by + d); }
      for (let d = depth; d >= 1; d -= 1) { g.fillStyle = A.mixc('#081446', '#1f4fbf', 1 - d / depth); g.fillText(ch, bx + d * 0.45, by + d); }
      g.lineWidth = F * 0.075; g.strokeStyle = '#060818'; g.strokeText(ch, bx, by);
      g.lineWidth = F * 0.036; g.strokeStyle = '#2f63e0'; g.strokeText(ch, bx, by);
      g.fillStyle = A.linear(g, 0, by - F * 0.75, 0, by, [[0, '#fff7c2'], [0.34, '#ffe04a'], [0.55, '#ffd21f'], [1, '#f39a00']]);
      g.fillText(ch, bx, by);
      // bevel: bright top-left lip, warm bottom-right inner shade (masked offsets)
      const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = chh; const q = tmp.getContext('2d');
      q.setTransform(1, 0, skew, 1, -skew * by, 0); q.font = g.font; q.textBaseline = 'alphabetic';
      q.fillStyle = '#fff'; q.fillText(ch, bx, by); q.globalCompositeOperation = 'destination-out'; q.fillText(ch, bx + F * 0.012, by + F * 0.022);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.9; g.drawImage(tmp, 0, 0);
      q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, cw, chh);
      q.setTransform(1, 0, skew, 1, -skew * by, 0);
      q.fillStyle = '#c05a00'; q.fillText(ch, bx, by); q.globalCompositeOperation = 'destination-out'; q.fillText(ch, bx - F * 0.014, by - F * 0.024);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.55; g.drawImage(tmp, 0, 0); g.globalAlpha = 1;
    });
    const glow = A.layer(`s7:gg:${ch}:${F}`, cw, chh, g => { g.filter = `blur(${Math.round(F * 0.08)}px)`; g.drawImage(art, 0, 0); });
    return { ch, art, glow, adv, bx, by, cw, chh };
  }
  function buildLogo() {
    const B = CARD.logoBox;
    let F = 400;
    const m = document.createElement('canvas').getContext('2d');
    const widthAt = F => { m.font = `900 ${F}px Rubik`; return m.measureText(CARD.wordLeft).width + m.measureText(CARD.wordRight).width + F * 0.86 + F * 0.02; };
    F = Math.floor(Math.min(B.w / (widthAt(100) / 100), B.h / 0.92));
    const L = [...CARD.wordLeft].map(c => glyph(c, F)), R = [...CARD.wordRight].map(c => glyph(c, F));
    const ringD = F * 0.8, gap = F * 0.03;
    const total = L.reduce((s, g) => s + g.adv, 0) + R.reduce((s, g) => s + g.adv, 0) + ringD + gap * 2;
    const base = B.cy + F * 0.35; // baseline so that cap-height is centred in the box
    let x = B.cx - total / 2;
    const place = [];
    for (const g of L) { place.push({ g, x, side: -1 }); x += g.adv * 0.97; }
    x += gap;
    const ring = { cx: x + ringD / 2 - F * 0.03, cy: base - F * 0.355, r: ringD / 2 - F * 0.02, w: F * 0.2 };
    x += ringD + gap;
    for (const g of R) { place.push({ g, x, side: 1 }); x += g.adv * 0.97; }
    const V = place[place.length - 1];
    return { F, base, place, ring, vNotch: [V.x + V.g.adv * 0.47 - 0.14 * -F * 0.7, base - F * 0.66] };
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
    const u = inv(57.12, 57.3, t);
    if (u <= 0 || u >= 1.2) return;
    const a0 = -Math.PI * 0.62;
    const start = [R.cx + Math.cos(a0) * R.r, R.cy + Math.sin(a0) * R.r];
    const P = s => { // bezier from Bit's spot to the ring start, then the ring arc
      if (s < 0.45) {
        const q = s / 0.45, p0 = [960, 1150], p1 = [300, 700], p2 = [start[0] - 260, start[1] - 260], p3 = start;
        const mt = 1 - q; return [mt * mt * mt * p0[0] + 3 * mt * mt * q * p1[0] + 3 * mt * q * q * p2[0] + q * q * q * p3[0], mt * mt * mt * p0[1] + 3 * mt * mt * q * p1[1] + 3 * mt * q * q * p2[1] + q * q * q * p3[1]];
      }
      const a = a0 + ((s - 0.45) / 0.55) * A.TAU;
      return [R.cx + Math.cos(a) * R.r + (-0.14) * (Math.sin(a) * R.r), R.cy + Math.sin(a) * R.r];
    };
    const head = ease.inOut(clamp(u)), tail = Math.max(0, head - 0.3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [w, c, a] of [[60, '#ffb020', 0.25], [26, '#ffe070', 0.6], [9, '#ffffff', 1]]) {
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
      const y = ((h(2) * H + (t - 57) * vy) % H) - 60;
      const x = h(3) * 1920 + Math.sin(t * (0.8 + h(4)) + h(5) * 6) * 30;
      ctx.globalAlpha = 0.55 * (0.5 + h(6) * 0.5);
      confettiPiece(ctx, x, y, 3.5 + h(7) * 4, t * (1 + h(8) * 3), Math.cos(t * (2 + h(9) * 4) + h(10) * 6), CONF_COLS[i % CONF_COLS.length]);
    }
    ctx.globalAlpha = 1;
    // slam burst sparks
    const tau = t - 57.3;
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
    const slam = t >= 57.3;
    const shake = decay(t, 57.3, 7) * 1.2;
    ctx.drawImage(cardBG(), 0, 0);
    // breathing light behind the logo
    const pulse = 1 + 0.06 * Math.sin((t - 57.3) * 2.4);
    A.glow(ctx, B.cx, B.cy, 820 * pulse, '#2a5bff', 0.28 * smooth(57.2, 57.5, t));
    A.glow(ctx, B.cx, B.cy + 20, 560, '#ffd21f', (0.16 + 0.5 * decay(t, 57.3, 3)) * smooth(57.25, 57.32, t));
    cardParticles(ctx, t, img ? { cx: B.cx, cy: B.cy, r: B.h * 0.4 } : R);

    ctx.save();
    A.camera(ctx, { x: 960, y: 540, zoom: 1 + 0.035 * decay(t, 57.3, 4) + 0.012 * inv(57.3, 60, t), shake, t });
    // Bit peeks from behind the logo (drawn first = behind)
    drawPeekBit(ctx, t, img);
    if (img) drawImageLogo(ctx, t);
    else drawWordmark(ctx, t);
    ctx.restore();

    // shockwave ring on the slam
    if (t > 57.3 && t < 57.9) {
      const u = inv(57.3, 57.9, t), cx = img ? B.cx : R.cx, cy = img ? B.cy : R.cy;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,230,140,${0.7 * (1 - u)})`; ctx.lineWidth = 26 * (1 - u) + 1;
      A.ellipse(ctx, cx, cy, 120 + ease.out(u) * 1100, 120 + ease.out(u) * 1100); ctx.stroke();
      ctx.restore();
    }
    drawTaglines(ctx, t);
    // white-out from Bit's burst settles into the card; slam flash
    const wf = Math.max(1 - smooth(57.2, 57.36, t), slam ? 0.55 * decay(t, 57.3, 9) : 0);
    if (wf > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,244,210,${wf})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); }
  }

  const logoBuf = () => A.layer('s7:logobuf', 1920, 1080, () => {});
  function drawWordmark(ctx, t) {
    const R = GL.ring;
    const prog = inv(57.2, 57.3, t) >= 1 ? 1 : clamp((ease.inOut(inv(57.12, 57.3, t)) - 0.45) / 0.55);
    // glow halo (bloom) under the letters
    const out = smooth(57.3, 57.3001, t);
    const letterK = g => { // letters burst out of the ring sideways, overshoot, settle
      const u = inv(57.3, 57.58, t); const e = ease.outBack(u);
      return { dx: (1 - e) * (R.cx - (g.x + g.g.adv / 2)), s: lerp(0.4, 1, clamp(e * 1.0)) };
    };
    const float = Math.sin((t - 57.3) * 1.8) * 4 * smooth(57.6, 58, t);
    ctx.save(); ctx.translate(0, float);
    if (out > 0) {
      // bloom
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.6 * decay(t, 57.3, 2.5);
      for (const p of GL.place) { const k = letterK(p); ctx.save(); ctx.translate(p.x + k.dx + p.g.adv / 2, GL.base); ctx.scale(k.s, k.s); ctx.drawImage(p.g.glow, -p.g.adv / 2 - p.g.bx, -p.g.by); ctx.restore(); }
      ctx.restore();
      for (const p of GL.place) {
        const k = letterK(p);
        ctx.save(); ctx.translate(p.x + k.dx + p.g.adv / 2, GL.base); ctx.scale(k.s, k.s); ctx.globalAlpha = clamp(inv(57.3, 57.36, t));
        ctx.drawImage(p.g.art, -p.g.adv / 2 - p.g.bx, -p.g.by); ctx.restore();
      }
    }
    // ring on top (letters emerge from behind it)
    const ringPop = 1 + 0.18 * spring(t, 57.3, 6, 14);
    ctx.save(); ctx.translate(R.cx, R.cy); ctx.scale(ringPop, ringPop); ctx.translate(-R.cx, -R.cy);
    A.glow(ctx, R.cx, R.cy, R.r * 2.2, '#ffd21f', 0.3 * smooth(57.25, 57.3, t));
    drawRing(ctx, R, prog, t);
    playIcon(ctx, R, ease.outBack(inv(57.32, 57.6, t)), t);
    // orbiting glint (Bit's light living in the ring)
    if (prog >= 1) {
      const a = -Math.PI * 0.62 + (t - 57.3) * 2.2;
      const gx = R.cx + Math.cos(a) * R.r - 0.14 * Math.sin(a) * R.r, gy = R.cy + Math.sin(a) * R.r;
      A.glow(ctx, gx, gy, R.w * 1.6, '#fff6c8', 0.7); star(ctx, gx, gy, R.w * 0.5, '#ffffff');
    }
    ctx.restore();
    streak(ctx, t, R);
    ctx.restore();
    // shine sweep across the whole wordmark (masked to letters via buffer)
    const su = inv(58.05, 58.7, t);
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
    const u = inv(57.3, 57.6, t), e = ease.outBack(u);
    const sc = t < 57.3 ? 0 : lerp(0.6, 1, e) * (1 + 0.012 * Math.sin((t - 57.3) * 1.8) * smooth(57.6, 58, t));
    const R = { cx: B.cx, cy: B.cy, r: Math.min(w, h) * 0.4, w: 20 };
    streak(ctx, t, R);
    if (sc <= 0) return;
    ctx.save(); ctx.translate(B.cx, B.cy); ctx.scale(sc, sc);
    A.glow(ctx, 0, 0, Math.max(w, h) * 0.7, '#ffd21f', 0.25 + 0.5 * decay(t, 57.3, 3));
    ctx.drawImage(logoImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawPeekBit(ctx, t, img) {
    if (t < 58.15) return;
    const B = CARD.logoBox;
    const at = img ? [B.cx + B.w * 0.36, B.cy - B.h * 0.32] : GL.vNotch;
    const u = ease.outBack(inv(58.15, 58.45, t));
    const lift = lerp(0, 1, u);
    const bs = 0.95;
    const y = at[1] + (1 - lift) * 120 * bs + 40 * bs;
    const w = smooth(58.45, 58.55, t) * (1 - smooth(58.95, 59.08, t));
    A.drawBit(ctx, at[0], y, bs, { t, mood: 'cheeky', limbs: 'stand', wink: w, trail: 0, glow: 1.2, look: [-0.3, 0.2], armR: [58, -72], sparkle: w, rot: 0.06 * Math.sin((t - 58.3) * 3) });
    if (t > 58.45 && t < 58.85) { const s = Math.sin(inv(58.45, 58.85, t) * Math.PI); star(ctx, at[0] + 60, y - 120, 30 * s + 0.01, '#fff6c8'); }
  }

  function drawTaglines(ctx, t) {
    const he = ease.out(inv(57.7, 57.95, t)), en = ease.out(inv(57.8, 58.05, t)), ti = ease.out(inv(57.85, 58.1, t));
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
      ctx.font = '500 34px Rubik';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd21f';
      ctx.fillText(CARD.tagEn, 960, y);
      const w = ctx.measureText(CARD.tagEn).width / 2 + 34;
      ctx.fillStyle = 'rgba(255,210,31,0.7)';
      for (const s of [-1, 1]) { ctx.fillRect(960 + s * w - (s < 0 ? 70 : 0), y - 1.5, 70 * en, 3); }
      ctx.restore();
    }
    if (ti > 0) {
      ctx.save(); ctx.globalAlpha = ti * 0.85;
      ctx.font = '500 28px Rubik'; if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#c9d3ff';
      ctx.fillText(CARD.filmTitle, 960, CARD.filmTitleY - (1 - ti) * 14);
      ctx.restore();
    }
  }

  // ================================================================== register
  A.scene({
    name: 's7_goal', start: 46.0, end: 60.0,
    draw(ctx, s) {
      const t = s.t;
      if (t < T_CUT_ROOM) shotTV(ctx, t);
      else if (t < T_CARD) shotRoom(ctx, t);
      else endCard(ctx, t);
    },
  });
})();
