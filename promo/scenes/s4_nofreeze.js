// S4 "no freezing": global 23.90-30.12 (+0.30 tail whip). The emotional/comedic peak.
// Dark stage + TV -> penalty -> spinner freeze -> SLAM "אין תקיעות" -> "נקודה." -> smooth slow-mo goal -> whip out.
(() => {
  const OUT = A.OUTLINE, TAU = A.TAU, PI = Math.PI;
  const { key, inv, smooth, lerp, clamp, ease } = A;
  const T = { start: 23.9, spin: 24.9, frz: 25.32, blk: 25.5, imp: 25.61, dot: 26.55, out: 27.2, kick: 28.15, hit: 28.5, goal: 29.28, end: 30.12, tail: 30.42 };
  const G = 375, G5 = G - 5;                 // striker ground line / ankle line (screen coords)
  const TVX = 560, TVY = 250, TVW = 800, TVH = 450;
  const GOLD = '#FFC24A', GOLDHI = '#FFE08A', ICE = '#9FE9FF', ICE2 = '#D8F8FF';
  const H = A.hash;
  const sm = A.smooth;

  // ---------------------------------------------------------------- offscreen buffers (redrawn every frame, not state)
  const bufs = {};
  const buf = (name, w, h) => {
    let b = bufs[name];
    if (!b) { b = bufs[name] = document.createElement('canvas'); b.width = w; b.height = h; }
    const g = b.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.clearRect(0, 0, w, h);
    return [b, g];
  };

  // ---------------------------------------------------------------- stands (cached at 2x)
  function stands() {
    return A.layer('s4_stands', 2400, 1400, (g) => {
      g.scale(2, 2); g.translate(200, 125);
      g.fillStyle = A.linear(g, 0, -125, 0, 300, [[0, '#060820'], [1, '#1c2250']]); g.fillRect(-200, -125, 1200, 700);
      const shirts = ['#FFD21F', '#FFD21F', '#2255DD', '#2255DD', '#e63946', '#ffffff', '#3a3f7a', '#FFD21F', '#2255DD', '#ff8a3d'];
      const skins = ['#e2a26f', '#c98a5a', '#f1c39a', '#8d5a3a', '#a86d45'];
      const rowsUp = (y0, y1, dy, sp, hr, dark) => {
        let r = 0;
        for (let y = y0; y < y1; y += dy, r++) {
          for (let x = -210; x < 1010; x += sp) {
            const k = r * 977 + x * 0.37, jx = (H(k) - 0.5) * sp * 0.6, jy = (H(k + 5) - 0.5) * 2;
            const px = x + jx, py = y + jy;
            g.fillStyle = A.mixc(shirts[Math.floor(H(k + 9) * shirts.length)], '#0a0c26', dark);
            g.beginPath(); g.roundRect(px - hr * 1.15, py + hr * 0.6, hr * 2.3, hr * 2.3, hr * 0.6); g.fill();
            g.fillStyle = A.mixc(skins[Math.floor(H(k + 3) * skins.length)], '#0a0c26', dark);
            g.beginPath(); g.arc(px, py, hr, 0, TAU); g.fill();
          }
        }
      };
      rowsUp(-120, 118, 10.5, 8.5, 2.8, 0.55);
      g.fillStyle = A.linear(g, 0, -125, 0, 130, [[0, 'rgba(4,6,24,.85)'], [1, 'rgba(4,6,24,0)']]); g.fillRect(-200, -125, 1200, 255);
      // concourse band with tiny windows
      g.fillStyle = '#080a22'; g.fillRect(-200, 124, 1200, 20);
      for (let x = -190; x < 1000; x += 26) { g.fillStyle = H(x) > 0.5 ? 'rgba(255,220,140,.5)' : 'rgba(120,200,255,.35)'; g.fillRect(x, 130, 10, 6); }
      rowsUp(150, 290, 13, 11, 3.9, 0.22);
      g.fillStyle = A.linear(g, 0, 140, 0, 292, [[0, 'rgba(5,8,30,.35)'], [1, 'rgba(5,8,30,0)']]); g.fillRect(-200, 140, 1200, 152);
      // rail + ad boards
      g.fillStyle = '#8fa0c8'; g.fillRect(-200, 289, 1200, 4);
      g.fillStyle = '#0d0f2e'; g.fillRect(-200, 293, 1200, 27);
      const cols = [['#38D9F5', '#1b7fc4'], ['#FF4F9A', '#a01f66'], ['#FFC24A', '#c9820f'], ['#3DDC84', '#127a45']];
      for (let i = 0, x = -200; x < 1000; i++, x += 96) {
        const c = cols[i % 4]; g.fillStyle = A.linear(g, 0, 294, 0, 318, [[0, c[0]], [1, c[1]]]);
        g.fillRect(x + 2, 295, 92, 23);
        g.fillStyle = 'rgba(255,255,255,.75)';
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 14 + k * 20, 316); g.lineTo(x + 24 + k * 20, 297); g.lineTo(x + 30 + k * 20, 297); g.lineTo(x + 20 + k * 20, 316); g.closePath(); g.fill(); }
      }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-200, 318, 1200, 4);
    });
  }

  // ---------------------------------------------------------------- pitch
  function pitch(ctx) {
    ctx.fillStyle = A.linear(ctx, 0, 318, 0, 575, [[0, '#17683a'], [1, '#2ea04f']]); ctx.fillRect(-200, 318, 1200, 260);
    let y = 318, i = 0, h = 9;
    while (y < 575) { if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,.055)'; ctx.fillRect(-200, y, 1200, h); } y += h; h *= 1.16; i++; }
    // lines
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-200, 337); ctx.lineTo(1000, 337); ctx.stroke();                  // goal line
    ctx.beginPath(); ctx.moveTo(492, 337); ctx.lineTo(372, 575); ctx.stroke();                     // box side
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(318, 372, 118, 38, 0, 0.25 * PI, 0.75 * PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-200, 452); ctx.lineTo(1000, 452); ctx.stroke();                   // 18 yd line (side of stage)
    // penalty spot (under ball)
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(318, 377, 10, 3.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = A.linear(ctx, 0, 318, 0, 340, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-200, 318, 1200, 24);
  }

  // ---------------------------------------------------------------- lights & crowd
  function lights(ctx, ct, t) {
    const flick = 0.85 + 0.15 * A.noise1(ct * 40) * clamp((ct - 24.2) / 1.0);
    const boost = t > T.goal ? 0.6 + 0.4 * Math.abs(Math.sin(t * 16)) : 0;
    const pts = [[-110, 14], [40, 24], [230, 8], [570, 8], [760, 24], [910, 14]];
    ctx.save();
    for (const [x, y] of pts) {
      ctx.globalCompositeOperation = 'lighter';
      // beam cone
      ctx.fillStyle = A.linear(ctx, x, y, x, y + 300, [[0, `rgba(255,245,210,${0.10 * flick + 0.05 * boost})`], [1, 'rgba(255,245,210,0)']]);
      ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 90, y + 300); ctx.lineTo(x - 90, y + 300); ctx.closePath(); ctx.fill();
      A.glow(ctx, x, y, 90 + boost * 40, `rgba(255,244,205,${0.85 * flick})`, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#eef4ff';
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { ctx.fillRect(x - 12 + a * 8, y - 5 + b * 8, 6, 6); }
    }
    ctx.restore();
  }

  function crowdAnim(ctx, t, ct) {
    const cel = clamp((t - T.goal) / 0.3);
    const shirts = ['#FFD21F', '#2255DD', '#e63946', '#ffffff', '#FFD21F', '#2255DD'];
    for (let i = 0; i < 120; i++) {
      const x = -180 + H(i) * 1160, y0 = 168 + H(i + 40) * 112;
      const amp = cel * (5 + H(i + 7) * 8) * Math.abs(Math.sin(t * (7 + H(i + 3) * 3) + i)) + (1 - cel) * 0.7 * Math.sin(ct * 2 + i);
      const y = y0 - amp, hr = 4.6 + (y0 - 168) / 112 * 1.5;
      const col = shirts[i % shirts.length];
      if (cel > 0.05) {
        ctx.strokeStyle = '#d9a070'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        const w = Math.sin(t * 11 + i) * 3;
        ctx.beginPath(); ctx.moveTo(x - hr * 0.8, y + hr * 1.5); ctx.lineTo(x - hr * 1.5 + w, y - hr * 1.8); ctx.moveTo(x + hr * 0.8, y + hr * 1.5); ctx.lineTo(x + hr * 1.5 - w, y - hr * 1.8); ctx.stroke();
      }
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - hr * 1.15, y + hr * 0.6, hr * 2.3, hr * 2.6, hr * 0.6); ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(10,8,40,.8)'; ctx.stroke();
      ctx.fillStyle = '#e2a26f'; ctx.beginPath(); ctx.arc(x, y, hr, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // flags (wave)
    for (let i = 0; i < 9; i++) {
      const x = -140 + i * 128 + H(i) * 30, y = 190 + H(i + 5) * 60, w = 46, h = 28;
      const cl = i % 2 ? ['#FFD21F', '#2255DD'] : ['#2255DD', '#FFD21F'];
      const raise = 1 + cel * 0.35;
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 60); ctx.lineTo(x, y - 40 * raise); ctx.stroke();
      const top = y - 40 * raise;
      for (let s = 0; s < 8; s++) {
        const a = s / 8, b = (s + 1) / 8;
        const wa = Math.sin(ct * 6 + i + a * 5 + cel * t * 4) * 4, wb = Math.sin(ct * 6 + i + b * 5 + cel * t * 4) * 4;
        ctx.fillStyle = s % 2 ? cl[0] : cl[1];
        ctx.beginPath(); ctx.moveTo(x + a * w, top + wa); ctx.lineTo(x + b * w, top + wb); ctx.lineTo(x + b * w, top + wb + h); ctx.lineTo(x + a * w, top + wa + h); ctx.closePath(); ctx.fill();
      }
    }
    // goal celebration flares in the stands
    if (t > T.goal) {
      const k = clamp((t - T.goal) / 0.5);
      for (let i = 0; i < 6; i++) {
        const x = -60 + i * 190 + H(i) * 40, y = 200 + H(i + 1) * 50;
        A.glow(ctx, x, y, 90 * k, i % 2 ? 'rgba(255,60,60,.85)' : 'rgba(255,150,40,.8)', 0.8);
        A.glow(ctx, x, y - 30 * k, 40 * k, 'rgba(255,255,255,.8)', 0.7);
      }
    }
  }

  // ---------------------------------------------------------------- figures
  const chain = (ctx, pts, w, col, ow = 3) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]));
    ctx.lineWidth = w + ow; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
  };
  // 2-bone IK, knee chosen at larger x (forward)
  function ik(hx, hy, tx, ty, l1, l2) {
    let dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy); d = Math.min(d, l1 + l2 - 0.05); d = Math.max(d, 8);
    const a = Math.atan2(dy, dx), ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), an = Math.acos(ca);
    const k1 = [hx + Math.cos(a + an) * l1, hy + Math.sin(a + an) * l1], k2 = [hx + Math.cos(a - an) * l1, hy + Math.sin(a - an) * l1];
    return k1[0] > k2[0] ? k1 : k2;
  }

  const KIT = { y: '#FFD21F', yd: '#E0AA00', b: '#2255DD', bd: '#173aa0', skin: '#E2A26F', skinD: '#C98550' };

  function boot(ctx, x, y, ang, dark) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(6, 3, 11.5, 5.5, 0, 0, TAU); A.fillStroke(ctx, dark ? '#16121f' : '#22202e', 2.6);
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(-3, 6.5, 18, 2.2);
    ctx.restore();
  }
  function leg(ctx, hip, foot, near) {
    const knee = ik(hip[0], hip[1], foot[0], foot[1], 34, 34);
    const sh = near ? KIT.b : KIT.bd, so = near ? KIT.y : KIT.yd;
    chain(ctx, [knee, foot], 10.5, so);
    ctx.lineCap = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = near ? KIT.b : KIT.bd;
    chain(ctx, [hip, knee], 16, sh);
    const aS = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]);
    const air = clamp((G5 - foot[1]) / 8);
    boot(ctx, foot[0], foot[1] + 1, lerp(0, (aS - PI / 2) * 0.9, air), !near);
    return knee;
  }
  function arm(ctx, sh, a1, a2, near) {
    const L1 = 22, L2 = 21;
    const el = [sh[0] + Math.sin(a1) * L1, sh[1] + Math.cos(a1) * L1];
    const ha = [el[0] + Math.sin(a1 + a2) * L2, el[1] + Math.cos(a1 + a2) * L2];
    chain(ctx, [sh, el], 11, near ? KIT.y : KIT.yd);
    chain(ctx, [el, ha], 8, near ? KIT.skin : KIT.skinD);
    ctx.beginPath(); ctx.arc(ha[0], ha[1], 4.8, 0, TAU); A.fillStroke(ctx, near ? KIT.skin : KIT.skinD, 2.4);
  }

  function ballPos(t) {
    if (t < T.kick) return [318, 366, 9];
    if (t <= T.goal) {
      const u = clamp((t - T.kick) / (T.goal - T.kick)), e = 1 - Math.pow(1 - u, 1.3);
      return [lerp(318, 748, e), lerp(366, 236, e) - 30 * Math.sin(PI * e) * (1 - 0.35 * e), lerp(9, 6.2, e)];
    }
    const k = t - T.goal;
    return [748 + 9 * (1 - Math.exp(-k * 6)) - 12 * (1 - Math.exp(-k * 2.5)), Math.min(322, 236 + 0.5 * 260 * k * k), 6.2];
  }

  function strikerPose(t, ct) {
    const idle = Math.sin(ct * 2.2), pre = t < 27.5 ? 1 : 0;
    let hx = key(t, [[27.5, 248], [27.8, 268], [28.03, 297], [28.15, 299], [28.6, 322, 'out'], [29.28, 342]]);
    if (t > 29.28) hx = 342 + (t - 29.28) * 78;
    hx += idle * 1.2 * pre;
    const lift1 = 14 * Math.sin(PI * inv(27.6, 27.82, t)), lift2 = 18 * Math.sin(PI * inv(27.8, 28.03, t)), lift3 = 16 * Math.sin(PI * inv(28.6, 28.95, t));
    let K = key(t, [[27.55, [258, G5]], [27.82, [286, G5]], [27.92, [286, G5]], [28.04, [hx - 36, G5 - 32]], [28.15, [303, G5 - 4, 'in']], [28.34, [372, G5 - 76, 'out']], [28.72, [350, G5 - 30]], [28.95, [352, G5]]]);
    let Pf = key(t, [[27.5, [240, G5 - 2]], [27.8, [240, G5 - 2]], [28.03, [294, G5 - 3]], [28.6, [294, G5 - 3]], [28.95, [330, G5 - 2]]]);
    K = [K[0], K[1] - (t < 27.85 ? lift1 : 0)]; Pf = [Pf[0], Pf[1] - lift2 - lift3];
    let hy = G5 - 60 + Math.sin(ct * 2.6) * 0.8 * pre;
    if (t > 27.55 && t < 28.03) hy += 2.6 * Math.sin((t - 27.55) * TAU / 0.24);
    hy -= 7 * Math.sin(PI * inv(28.3, 28.62, t));
    let lean = key(t, [[27.5, 0.12], [28.03, 0.28], [28.15, 0.1, 'out'], [28.5, -0.12], [29.0, 0.05], [29.3, -0.15], [29.7, 0.1]]);
    let nA = key(t, [[27.5, [0.15, 0.35]], [27.8, [-0.5, 0.3]], [28.03, [0.7, 0.5]], [28.15, [0.9, 0.5]], [28.6, [0.5, 0.4]], [29.28, [0.4, 0.4]]]);
    let fA = key(t, [[27.5, [0.1, 0.3]], [27.8, [0.7, 0.4]], [28.03, [-0.4, 0.4]], [28.15, [-0.9, 0.4]], [28.6, [-0.3, 0.4]], [29.28, [0.2, 0.3]]]);
    if (t > 29.28) {
      const c = clamp((t - 29.28) / 0.18), w1 = Math.sin(t * 12) * 0.28, w2 = Math.sin(t * 12 + 2) * 0.28;
      nA = [lerp(nA[0], 2.75 + w1, c), lerp(nA[1], 0.35, c)]; fA = [lerp(fA[0], 2.6 + w2, c), lerp(fA[1], 0.35, c)];
      // jump then run
      const j = inv(29.3, 29.78, t); hy -= 30 * Math.sin(PI * clamp(j));
      const ph = t * 8;
      const tuck = Math.sin(PI * clamp(j));
      K = [hx + 16 + Math.cos(ph) * 20, G5 - 14 * tuck - Math.max(0, Math.sin(ph)) * 14 * (1 - tuck)];
      Pf = [hx - 14 - Math.cos(ph) * 20, G5 - 22 * tuck - Math.max(0, -Math.sin(ph)) * 14 * (1 - tuck)];
    }
    const tilt = t < 28.3 ? 0.22 : -0.1;
    return { hx, hy, lean, K, P: Pf, nA, fA, tilt };
  }

  function striker(ctx, t, ct) {
    const S = strikerPose(t, ct);
    const hip = [S.hx, S.hy];
    const sh = [hip[0] + Math.sin(S.lean) * 44, hip[1] - Math.cos(S.lean) * 44];
    ctx.save();
    const gy = G + 3;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(S.hx + 8 + (S.hy < G5 - 62 ? 0 : 0), gy, 46 - (G5 - 60 - S.hy) * 0.6, 7, 0, 0, TAU); ctx.fill();
    // far limbs
    leg(ctx, hip, S.P, false);
    arm(ctx, sh, S.fA[0], S.fA[1], false);
    // shorts + torso
    chain(ctx, [hip, [hip[0] + 2, hip[1] + 13]], 24, KIT.b);
    chain(ctx, [[hip[0], hip[1] - 2], sh], 28, KIT.y);
    // jersey stripe + badge
    ctx.save(); ctx.lineCap = 'butt';
    const mid = [lerp(hip[0], sh[0], 0.55), lerp(hip[1], sh[1], 0.55)], perp = [Math.cos(S.lean), Math.sin(S.lean)];
    ctx.strokeStyle = KIT.b; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mid[0] - perp[0] * 13, mid[1] - perp[1] * 13); ctx.lineTo(mid[0] + perp[0] * 13, mid[1] + perp[1] * 13); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(sh[0] + 5, sh[1] + 12, 4.5, 0, TAU); A.fillStroke(ctx, KIT.b, 2);
    // near leg + arm
    leg(ctx, hip, S.K, true);
    arm(ctx, sh, S.nA[0], S.nA[1], true);
    // head
    const ha = S.lean + S.tilt, hc = [sh[0] + Math.sin(ha) * 21 + 3, sh[1] - Math.cos(ha) * 21];
    ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(S.tilt * 0.6 + S.lean * 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); A.fillStroke(ctx, KIT.skin, 3);
    ctx.beginPath(); ctx.arc(0, -1, 14.6, PI * 0.92, PI * 1.98); ctx.lineTo(4, -4); ctx.lineTo(-8, 0); ctx.closePath(); A.fillStroke(ctx, '#2a1a12', 2.5);
    ctx.beginPath(); ctx.arc(-4, 3, 3.2, 0, TAU); A.fillStroke(ctx, KIT.skinD, 1.6);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(6.2, 0.5, 3, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1330'; ctx.beginPath(); ctx.arc(7.2, 1, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3.5, -5); ctx.lineTo(10, -4 + (t > T.goal ? -2 : 1)); ctx.stroke();
    ctx.strokeStyle = '#8a3b2a'; ctx.lineWidth = 1.8; ctx.beginPath();
    if (t > T.goal) { ctx.arc(7, 6, 4.2, 0.1, PI - 0.1); } else { ctx.moveTo(4, 8); ctx.lineTo(10, 8); }
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // front-facing figure (keeper / distant players). o: {rot, dive(0..1), armsUp(0..1), mouth}
  function front(ctx, x, y, s, kit, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
    const dive = o.dive || 0, up = Math.max(o.armsUp || 0, dive);
    const spread = 9 + dive * 7 + (o.spread || 0);
    // legs
    for (const sg of [-1, 1]) {
      const kx = sg * (spread * 0.75 + 2), fx = sg * spread + (dive ? sg * dive * 6 : 0), fy = 32 - dive * (sg > 0 ? 8 : 2);
      chain(ctx, [[sg * 6, 0], [kx, 16 - dive * 3]], 12, kit.short, 2.6);
      chain(ctx, [[kx, 16 - dive * 3], [fx, fy]], 8.5, kit.sock, 2.6);
      ctx.beginPath(); ctx.ellipse(fx + sg * 2, fy + 3, 7, 4, 0, 0, TAU); A.fillStroke(ctx, '#1b1726', 2.2);
    }
    ctx.beginPath(); ctx.roundRect(-11, -34, 22, 36, 8); A.fillStroke(ctx, kit.shirt, 3);
    ctx.fillStyle = kit.trim; ctx.fillRect(-11, -20, 22, 5);
    // arms
    for (const sg of [-1, 1]) {
      const a1 = lerp(sg * 0.95 + (o.sway || 0) * sg, sg * 2.95, up), a2 = lerp(-sg * 0.9, 0, up);
      const sx = sg * 12, sy = -29;
      const el = [sx + Math.sin(a1) * 15, sy + Math.cos(a1) * 15], ha = [el[0] + Math.sin(a1 + a2) * 15, el[1] + Math.cos(a1 + a2) * 15];
      chain(ctx, [[sx, sy], el], 8.5, kit.shirt, 2.6);
      chain(ctx, [el, ha], 7, kit.skin || '#e2a26f', 2.6);
      ctx.beginPath(); ctx.arc(ha[0], ha[1], kit.glove ? 6.2 : 4, 0, TAU); A.fillStroke(ctx, kit.glove || kit.skin || '#e2a26f', 2.2);
    }
    // head
    ctx.beginPath(); ctx.arc(0, -44, 10.5, 0, TAU); A.fillStroke(ctx, kit.skin || '#e2a26f', 2.8);
    ctx.beginPath(); ctx.arc(0, -46, 11, PI * 1.02, PI * 1.98); A.fillStroke(ctx, kit.hair || '#2a1a12', 2.2);
    ctx.fillStyle = '#1a1330'; ctx.beginPath(); ctx.arc(-4, -43.5, 1.5, 0, TAU); ctx.arc(4, -43.5, 1.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 1.6;
    if (o.mouth) { ctx.beginPath(); ctx.ellipse(0, -38.5, 3.2, 2.6 + o.mouth * 1.5, 0, 0, TAU); ctx.fillStyle = '#4a1010'; ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-3, -38.5); ctx.lineTo(3, -38.5); ctx.stroke(); }
    ctx.restore();
  }
  const KEEPER = { shirt: '#E63946', trim: '#ffffff', short: '#5a0f1c', sock: '#E63946', glove: '#f4ffb0', skin: '#c98550', hair: '#111' };
  const RED = { shirt: '#E63946', trim: '#ffffff', short: '#ffffff', sock: '#E63946', skin: '#d9a070', hair: '#2a1a12' };
  const YEL = { shirt: '#FFD21F', trim: '#2255DD', short: '#2255DD', sock: '#FFD21F', skin: '#e2a26f', hair: '#3a2416' };

  function keeper(ctx, t, ct) {
    const dv = ease.inOut(inv(28.32, 29.15, t)), land = ease.in(inv(29.15, 29.55, t));
    const sway = Math.sin(ct * 3.3) * 6 * (1 - dv), hop = Math.abs(Math.sin(ct * 6.6)) * 2.2 * (1 - dv);
    let x = 655 + sway + dv * 30, y = 293 - hop - dv * 20;
    let rot = dv * 1.07;
    if (t > 29.15) { x += land * 6; y += land * 46; rot += land * 0.4; }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x - dv * 20 + land * 24, 340, 30 + land * 14, 5, 0, 0, TAU); ctx.fill();
    front(ctx, x, y, 1, KEEPER, { rot, dive: dv, sway: Math.sin(ct * 3.3 + 1) * 0.14, mouth: dv * 0.9 + (t > T.goal ? 0.6 : 0), spread: 3 * (1 - dv) });
    ctx.restore();
  }

  function bgPlayers(ctx, t, ct) {
    const cel = clamp((t - T.goal) / 0.2);
    const list = [[428, 350, YEL, 0.5], [470, 344, RED, 0.46], [505, 352, YEL, 0.5], [540, 348, RED, 0.47], [598, 344, RED, 0.45], [700, 348, YEL, 0.5], [360, 348, YEL, 0.5]];
    list.forEach(([x, y, k, s], i) => {
      const j = cel * Math.abs(Math.sin(t * 8 + i)) * 12;
      const cx = x + (t > T.goal ? Math.sin(t * 3 + i) * 4 : 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, y + 26 * s * 1.5, 16 * s * 1.6, 3, 0, 0, TAU); ctx.fill();
      // red players slump / yellow cheer
      const isY = k === YEL; const arms = isY ? cel : 0;
      front(ctx, cx, y - j, s * 1.05, k, { armsUp: arms, mouth: isY && cel ? 0.8 : 0, sway: Math.sin(ct * 2 + i) * 0.1 });
    });
  }

  // ---------------------------------------------------------------- goal + net
  function goalNet(ctx, t) {
    const x0 = 540, x1 = 770, y0 = 217, yb = 337, bx0 = 556, bx1 = 754, by0 = 227, byb = 332;
    const hx = 748, hy = 236, dt = t - T.goal;
    const rip = (x, y) => {
      if (dt < 0) return [x, y];
      const d = Math.hypot(x - hx, y - hy) + 1, amp = 16 * Math.exp(-dt * 2.4) * Math.exp(-d / 150), s = amp * Math.sin(d * 0.085 - dt * 21);
      return [x + (x - hx) / d * s * 0.7 - amp * 0.35, y + (y - hy) / d * s * 0.7 + amp * 0.25];
    };
    ctx.save();
    // dark interior
    ctx.fillStyle = 'rgba(8,12,30,.55)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, yb); ctx.lineTo(x0, yb); ctx.closePath(); ctx.fill();
    // back plane grid (rippled)
    ctx.strokeStyle = 'rgba(235,240,255,.55)'; ctx.lineWidth = 0.9;
    const nx = 14, ny = 8;
    for (let j = 0; j <= ny; j++) { ctx.beginPath(); for (let i = 0; i <= nx * 2; i++) { const p = rip(lerp(bx0, bx1, i / (nx * 2)), lerp(by0, byb, j / ny)); ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]); } ctx.stroke(); }
    for (let i = 0; i <= nx; i++) { ctx.beginPath(); for (let j = 0; j <= ny * 2; j++) { const p = rip(lerp(bx0, bx1, i / nx), lerp(by0, byb, j / (ny * 2))); ctx[j ? 'lineTo' : 'moveTo'](p[0], p[1]); } ctx.stroke(); }
    // side/top nets
    ctx.strokeStyle = 'rgba(235,240,255,.35)';
    for (let i = 0; i <= 8; i++) { const a = i / 8; ctx.beginPath(); const p1 = rip(lerp(x0, x1, a), y0), p2 = rip(lerp(bx0, bx1, a), by0); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
    for (let j = 0; j <= 5; j++) { const a = j / 5; for (const [fx, bx] of [[x0, bx0], [x1, bx1]]) { const p1 = rip(fx, lerp(y0, yb, a)), p2 = rip(bx, lerp(by0, byb, a)); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); } }
    ctx.restore();
  }
  function goalFrame(ctx, t) {
    const x0 = 540, x1 = 770, y0 = 217, yb = 337;
    const sh = t > T.goal ? Math.exp(-(t - T.goal) * 7) * Math.sin((t - T.goal) * 60) * 1.2 : 0;
    chain(ctx, [[x0, yb], [x0, y0 + sh], [x1, y0 + sh], [x1, yb]], 6.5, '#f4f6ff', 3.4);
  }

  // ---------------------------------------------------------------- ball, trail
  function ballDraw(ctx, t) {
    const [bx, by, r] = ballPos(t), spin = t < T.kick ? 0.4 : (t - T.kick) * 13;
    ctx.save(); ctx.translate(bx, by);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; if (t < T.goal) { ctx.beginPath(); ctx.ellipse(0, G - by + 3 + (t < T.kick ? 0 : 6), r * 1.1, r * 0.3, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = A.radial(ctx, -r * 0.3, -r * 0.35, 0, r * 1.2, [[0, '#ffffff'], [1, '#c9cfe6']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.rotate(spin); ctx.fillStyle = '#1d1a2e';
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4); } ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - PI / 2 + PI / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, r * 0.36, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = Math.max(1.8, r * 0.22); ctx.strokeStyle = OUT; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function trail(ctx, t) {
    if (t < T.kick + 0.01) return;
    const fade = 1 - inv(T.goal, T.goal + 0.35, t);
    if (fade <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const N = 26;
    for (let k = N; k >= 1; k--) {
      const tt = t - k * 0.011; if (tt < T.kick) continue;
      const [x, y, r] = ballPos(tt), a = Math.pow(1 - k / (N + 1), 1.6) * fade;
      ctx.fillStyle = `rgba(255,214,120,${0.30 * a})`; ctx.beginPath(); ctx.arc(x, y, r * (1.25 - k / N * 0.6) + 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.35 * a})`; ctx.beginPath(); ctx.arc(x, y, r * (0.8 - k / N * 0.5), 0, TAU); ctx.fill();
      if (k % 5 === 0) { ctx.fillStyle = `rgba(80,220,255,${0.22 * a})`; ctx.beginPath(); ctx.arc(x + (H(k) - 0.5) * 8, y + (H(k + 3) - 0.5) * 8, r * 1.9, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- spinner (circle of dots) + ice
  function spinner(ctx, x, y, R, alpha, rot, ice, glitchy) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(6,8,30,${0.45 * (1 - ice * 0.3)})`; ctx.beginPath(); ctx.arc(0, 0, R * 1.55, 0, TAU); ctx.fill();
    if (ice > 0) {
      const g = A.radial(ctx, 0, 0, R * 0.2, R * 1.6 * ice + 1, [[0, 'rgba(220,250,255,.22)'], [0.7, 'rgba(150,230,255,.3)'], [1, 'rgba(220,250,255,.75)']]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.6 * ice, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(230,252,255,${0.9 * ice})`; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(255,255,255,${0.7 * ice})`;
      for (let i = 0; i < 6; i++) { const a = i * PI / 3 + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3); ctx.lineTo(Math.cos(a) * R * 1.5 * ice, Math.sin(a) * R * 1.5 * ice); ctx.stroke(); }
    }
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = rot - i * TAU / n, f = 1 - i / n;
      const dx = Math.cos(a) * R, dy = Math.sin(a) * R, r = R * (0.1 + 0.17 * f);
      ctx.fillStyle = A.mixc('#ffffff', ICE, ice); ctx.globalAlpha = alpha * (0.25 + 0.75 * f);
      ctx.beginPath(); ctx.arc(dx + (glitchy ? (H(i + Math.floor(rot * 5)) - 0.5) * 3 : 0), dy, r, 0, TAU); ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(20,16,60,.75)'; ctx.stroke();
    }
    ctx.restore();
  }

  // shatter shards: world-space (drawn in outer camera space, unclipped). origin ox,oy (world)
  function shatterShards(ctx, ox, oy, tau, seed, R, count, big) {
    if (tau < 0) return;
    for (let i = 0; i < count; i++) {
      const h = (k) => H(seed + i * 13 + k);
      const ang = h(1) * TAU, rad0 = Math.sqrt(h(2)) * R, sp = (big ? 260 : 170) + h(3) * (big ? 640 : 320), vz = 0.6 + h(4) * (big ? 3.4 : 1.6);
      const life = 0.55 + h(5) * 0.6; if (tau > life) continue;
      const k = tau / life, d = ease.out(clamp(tau / 0.9)) * sp * 0.55;
      const x = ox + Math.cos(ang) * (rad0 + d), y = oy + Math.sin(ang) * (rad0 + d) + 420 * tau * tau * (big ? 1 : 0.6);
      const sc = 1 + vz * tau * 1.6, rot = h(6) * TAU + (h(7) - 0.5) * 14 * tau;
      const sz = (big ? 6 : 3.5) + h(8) * (big ? 22 : 9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = 1 - Math.pow(k, 3);
      const n = 3 + Math.floor(h(9) * 2); ctx.beginPath();
      for (let p = 0; p < n; p++) { const a = p * TAU / n + h(10 + p) * 0.6, r = sz * (0.55 + h(20 + p) * 0.7); ctx[p ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r * 0.8); }
      ctx.closePath(); ctx.fillStyle = A.linear(ctx, -sz, -sz, sz, sz, [[0, '#FFFFFF'], [0.5, ICE], [1, '#5fc3ee']]); ctx.fill();
      ctx.lineWidth = 2 / sc + 1.2; ctx.strokeStyle = 'rgba(20,30,90,.85)'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-sz * 0.3, -sz * 0.25); ctx.lineTo(sz * 0.15, -sz * 0.45); ctx.stroke();
      ctx.restore();
    }
  }

  function cracks(ctx, ox, oy, tau, fadeA) {
    if (tau < 0 || fadeA <= 0) return;
    const g = ease.out(clamp(tau / 0.32));
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [w, col, a] of [[9, 'rgba(120,220,255,.35)', 1], [3.4, 'rgba(255,255,255,.95)', 1]]) {
      ctx.lineWidth = w; ctx.strokeStyle = col; ctx.globalAlpha = fadeA * a;
      for (let i = 0; i < 15; i++) {
        let ang = i * TAU / 15 + H(i) * 0.3, x = ox, y = oy; const total = (260 + H(i + 7) * 620) * g;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0, l = 0; l < total; s++) {
          const seg = 26 + H(i * 9 + s) * 42; ang += (H(i * 5 + s + 3) - 0.5) * 0.75; l += seg;
          x += Math.cos(ang) * seg; y += Math.sin(ang) * seg; ctx.lineTo(x, y);
          if (H(i * 7 + s + 1) > 0.7 && l < total * 0.8) { // branch
            const bx = x, by = y, ba = ang + (H(s + i) > 0.5 ? 0.9 : -0.9); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ba) * seg * 1.3, by + Math.sin(ba) * seg * 1.3); ctx.moveTo(bx, by);
          }
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- confetti
  function confetti(ctx, t) {
    if (t < T.goal) return;
    const cols = [GOLD, '#38D9F5', '#FF4F9A', '#ffffff', '#FFD21F', '#3D7BFF', '#3DDC84'];
    for (let i = 0; i < 230; i++) {
      const ts = T.goal + 0.02 + H(i) * 0.3, tau = (t - ts) * 0.85; if (tau < 0) continue;
      const x0 = -120 + H(i + 1) * 1040, y0 = 130 + H(i + 2) * 150;
      const vx = (H(i + 3) - 0.5) * 300, vy = -(200 + H(i + 4) * 330);
      const x = x0 + vx * tau + Math.sin(tau * 5 + i) * 10 * tau, y = y0 + vy * tau + 0.5 * 360 * tau * tau;
      if (y > 620) continue;
      const sz = 3.4 + H(i + 5) * 5, rot = H(i + 6) * TAU + tau * (6 + H(i + 7) * 9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, Math.cos(tau * (9 + H(i + 8) * 8) + i));
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-sz, -sz * 0.55, sz * 2, sz * 1.1); ctx.restore();
    }
    for (let i = 0; i < 16; i++) {
      const ts = T.goal + 0.05 + H(i + 300) * 0.25, tau = (t - ts) * 0.8; if (tau < 0) continue;
      const x0 = -100 + H(i + 301) * 1000, y0 = 250, vx = (H(i + 302) - 0.5) * 120, vy = -(320 + H(i + 303) * 220);
      ctx.strokeStyle = cols[i % 5]; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (let s = 0; s < 10; s++) { const tt = tau - s * 0.02; if (tt < 0) break; const x = x0 + vx * tt + Math.sin(tt * 9 + i + s * 0.8) * 9, y = y0 + vy * tt + 0.5 * 360 * tt * tt; ctx[s ? 'lineTo' : 'moveTo'](x, y); }
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- the picture on the TV
  // cam: inner camera {x,y,z,rot}. fx: {ghostA...}
  function drawMatch(ctx, t, ct, cam) {
    ctx.save();
    ctx.translate(400, 225); ctx.scale(cam.z, cam.z); ctx.rotate(cam.rot || 0); ctx.translate(-cam.x, -cam.y);
    ctx.drawImage(stands(), -200, -125, 1200, 700);
    lights(ctx, ct, t);
    crowdAnim(ctx, t, ct);
    pitch(ctx);
    bgPlayers(ctx, t, ct);
    goalNet(ctx, t);
    goalFrame(ctx, t);
    keeper(ctx, t, ct);
    striker(ctx, t, ct);
    trail(ctx, t);
    ballDraw(ctx, t);
    // spinner ghost (28.30 - 28.50) smashed by ball
    if (t >= 28.28 && t < T.hit) {
      const [gx, gy] = ballPos(T.hit), a = sm(28.28, 28.44, t), j = Math.floor(t * 30);
      const R = 20 + (1 - a) * 6;
      spinner(ctx, gx + (H(j) - 0.5) * 2, gy - 6 + (H(j + 1) - 0.5) * 2, R, a * 0.92, t * 9, 0.2, true);
    }
    if (t >= T.hit) {
      const [gx, gy] = ballPos(T.hit), tau = t - T.hit;
      if (tau < 0.7) {
        for (let i = 0; i < 34; i++) {
          const h = k => H(900 + i * 7 + k), a = h(1) * TAU, sp = 60 + h(2) * 220, life = 0.3 + h(3) * 0.4; if (tau > life) continue;
          const x = gx + Math.cos(a) * sp * tau * 1.4 + 200 * tau * (0.5 + h(5)), y = gy - 6 + Math.sin(a) * sp * tau * 1.2 + 140 * tau * tau, sz = 1.8 + h(4) * 4.2;
          ctx.save(); ctx.translate(x, y); ctx.rotate(h(6) * 6 + tau * 12); ctx.globalAlpha = 1 - tau / life;
          ctx.beginPath(); ctx.moveTo(-sz, sz * 0.6); ctx.lineTo(sz, 0); ctx.lineTo(-sz * 0.2, -sz); ctx.closePath();
          ctx.fillStyle = i % 3 ? ICE2 : '#fff'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(20,30,90,.8)'; ctx.stroke(); ctx.restore();
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(200,245,255,${0.9 * (1 - tau / 0.25)})`; if (tau < 0.25) { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gx, gy - 6, 12 + tau * 200, 0, TAU); ctx.stroke(); A.glow(ctx, gx, gy - 6, 50, 'rgba(160,240,255,.9)', 1 - tau / 0.25); }
        ctx.restore();
      }
    }
    confetti(ctx, t);
    // goal burst rays
    if (t >= T.goal && t < T.goal + 0.9) {
      const k = (t - T.goal) / 0.9;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(748, 240); ctx.rotate(t * 0.8);
      for (let i = 0; i < 16; i++) { ctx.rotate(TAU / 16); ctx.fillStyle = `rgba(255,236,160,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600 * (0.3 + k), -12 * (1 - k) - 3); ctx.lineTo(600 * (0.3 + k), 12 * (1 - k) + 3); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- inner camera (inside the TV picture)
  function innerCam(t) {
    const shake = (t > T.kick - 0.02 ? 1.6 * Math.exp(-(t - T.kick) * 9) : 0) + (t > T.goal ? 5 * Math.exp(-(t - T.goal) * 6) : 0);
    return {
      x: key(t, [[27.2, 400], [27.65, 336, 'out'], [28.0, 322], [28.15, 332], [28.9, 610, 'inOut'], [29.28, 694, 'out'], [29.42, 694], [29.78, 400, 'inOut']]) + shake * A.noise1(t * 40),
      y: key(t, [[27.2, 225], [27.65, 292, 'out'], [28.15, 300], [28.9, 274, 'inOut'], [29.28, 252, 'out'], [29.42, 252], [29.78, 225, 'inOut']]) + shake * A.noise1(t * 40 + 20),
      z: key(t, [[27.2, 1.0], [27.65, 1.5, 'out'], [28.12, 1.78, 'inOut'], [28.45, 1.6], [29.28, 1.88, 'inOut'], [29.42, 1.94], [29.78, 1.0, 'inOut']]),
      rot: key(t, [[27.2, 0], [27.7, 0.0], [28.15, -0.02, 'inOut'], [29.28, 0.018, 'inOut'], [29.78, 0, 'inOut']]) + shake * 0.004 * A.noise1(t * 31),
    };
  }

  // ---------------------------------------------------------------- stage: void, spotlight, TV
  function drawVoid(ctx, t, ct, camx) {
    ctx.fillStyle = '#0A0724'; ctx.fillRect(-3200, -2400, 5700, 4800);
    ctx.fillStyle = A.radial(ctx, 960, 470, 60, 1250, [[0, 'rgba(60,40,150,.55)'], [0.45, 'rgba(30,20,90,.4)'], [1, 'rgba(10,7,36,0)']]); ctx.fillRect(-500, -600, 2900, 2200);
    ctx.fillStyle = A.linear(ctx, 0, 730, 0, 1400, [[0, 'rgba(24,16,70,.9)'], [1, 'rgba(6,4,22,.95)']]); ctx.fillRect(-3200, 730, 5700, 900);
    ctx.fillStyle = 'rgba(120,100,220,.18)'; ctx.fillRect(-3200, 729, 5700, 2);
  }
  function spotlight(ctx, t, ct) {
    const fl = 0.85 + 0.15 * A.noise1(ct * 45) * clamp((ct - 24.2) / 1.0) + (t > T.goal && t < T.end + 0.3 ? 0.15 : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = A.linear(ctx, 0, -300, 0, 800, [[0, `rgba(255,240,200,${0.42 * fl})`], [0.6, `rgba(255,235,190,${0.18 * fl})`], [1, `rgba(255,230,170,${0.10 * fl})`]]);
    ctx.fillStyle = g; for (const w of [0, 45, 90]) { ctx.globalAlpha = w ? 0.35 : 0.7; ctx.beginPath(); ctx.moveTo(910 - w * 0.2, -300); ctx.lineTo(1010 + w * 0.2, -300); ctx.lineTo(1500 + w, 800); ctx.lineTo(420 - w, 800); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.fillStyle = A.radial(ctx, 960, 800, 20, 560, [[0, `rgba(255,236,190,${0.4 * fl})`], [1, 'rgba(255,236,190,0)']]);
    ctx.save(); ctx.translate(960, 800); ctx.scale(1, 0.16); ctx.translate(-960, -800); ctx.fillRect(400, 230, 1120, 1120); ctx.restore();
    // motes
    for (let i = 0; i < 80; i++) {
      const sp = 6 + H(i + 2) * 16, x = -200 + H(i) * 2320 + Math.sin(ct * 0.5 + i) * 22, y = 1250 - ((H(i + 1) * 1500 + ct * sp) % 1500);
      const inCone = Math.abs(x - 960) < 100 + (y + 300) * 0.34, r = 1.4 + H(i + 3) * 3;
      const a = (inCone ? 0.85 : 0.22) * (0.5 + 0.5 * Math.sin(ct * 2 + i * 3));
      ctx.fillStyle = `rgba(255,236,190,${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function glitchParams(t) {
    if (t < 25.0 || t >= T.blk) return { pix: 0, band: 0, rgb: 0 };
    const f = Math.floor(t * 30);
    if (t < 25.2) return H(f) > 0.62 ? { pix: 0, band: 16, rgb: 5 } : { pix: 0, band: 0, rgb: 0 };
    if (t < T.frz) { const k = inv(25.2, T.frz, t); return { pix: H(f + 1) > 0.35 ? 6 + k * 18 : 0, band: 30 * k + 10, rgb: 6 + 8 * k }; }
    if (t < 25.46) { const k = inv(T.frz, 25.46, t); return { pix: lerp(22, 0, ease.out(k)) * (H(f + 4) > 0.15 ? 1 : 0.4), band: (1 - k) * 22, rgb: (1 - k) * 8 }; }
    return { pix: 0, band: 0, rgb: 0 };
  }

  function drawTV(ctx, t, ct) {
    const ix = t > T.out - 0.05 ? innerCam(t) : { x: 400, y: 225, z: 1, rot: 0 };
    // bezel
    const vib = clamp((t - 24.2) / 1.3) * (t < T.blk ? 1 : 0) * 3.2;
    ctx.save();
    ctx.translate(A.noise1(t * 63) * vib, A.noise1(t * 63 + 9) * vib * 0.8);
    // glow from screen
    A.glow(ctx, 960, 480, 720, 'rgba(120,150,255,.28)', 1);
    // stand
    ctx.beginPath(); ctx.moveTo(900, 720); ctx.lineTo(1020, 720); ctx.lineTo(1050, 790); ctx.lineTo(870, 790); ctx.closePath(); A.fillStroke(ctx, '#1b1544', 6);
    ctx.beginPath(); ctx.ellipse(960, 796, 210, 24, 0, 0, TAU); A.fillStroke(ctx, '#251b5c', 6);
    A.rrect(ctx, 528, 218, 864, 514, 34); ctx.fillStyle = A.linear(ctx, 0, 218, 0, 732, [[0, '#2c2470'], [0.5, '#1a1448'], [1, '#100b32']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OUT; ctx.stroke();
    A.rrect(ctx, 536, 226, 848, 498, 28); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(160,140,255,.35)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(960, 712, 4.5, 0, TAU); ctx.fillStyle = t < T.imp ? '#ff3d4d' : '#3DDC84'; ctx.fill();
    // screen
    const g = glitchParams(t);
    ctx.save(); ctx.translate(TVX, TVY); A.rrect(ctx, 0, 0, TVW, TVH, 8); ctx.clip();
    if (g.pix > 1.5 || g.band > 1 || g.rgb > 1) {
      const S = 1.6, [sc, sg] = buf('scr', 1280, 720);
      sg.setTransform(S, 0, 0, S, 0, 0); drawMatchWithSpinner(sg, t, ct, ix);
      const f = Math.floor(t * 30);
      if (g.pix > 1.5) {
        const [pc, pg] = buf('pix', Math.ceil(800 / g.pix), Math.ceil(450 / g.pix));
        pg.drawImage(sc, 0, 0, pc.width, pc.height); ctx.imageSmoothingEnabled = false; ctx.drawImage(pc, 0, 0, pc.width * g.pix, pc.height * g.pix); ctx.imageSmoothingEnabled = true;
      } else ctx.drawImage(sc, 0, 0, 800, 450);
      if (g.rgb > 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28;
        ctx.drawImage(sc, g.rgb, 0, 800, 450); ctx.drawImage(sc, -g.rgb, 0, 800, 450); ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,60,120,.0)'; ctx.restore();
      }
      if (g.band > 1) {
        for (let b = 0; b < 6; b++) {
          const by = H(f * 3 + b) * 420, bh = 8 + H(f * 3 + b + 20) * 46, ox = (H(f * 3 + b + 40) - 0.5) * 2 * g.band * 2.2;
          if (H(f + b * 7) > 0.35) ctx.drawImage(sc, 0, by * S, 1280, bh * S, ox, by, 800, bh);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < 450; y += 4) ctx.fillRect(0, y, 800, 1.4);
    } else drawMatchWithSpinner(ctx, t, ct, ix);
    // freeze tint + gloss
    const ice = sm(T.frz, T.blk, t) * (t < T.out ? 1 : 0);
    if (ice > 0) { ctx.fillStyle = `rgba(120,200,255,${0.16 * ice})`; ctx.fillRect(0, 0, 800, 450); }
    if (t < T.out - 0.1) {
      ctx.fillStyle = A.linear(ctx, 0, 0, 800, 450, [[0, 'rgba(255,255,255,.10)'], [0.35, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, 800, 450);
      ctx.fillStyle = A.radial(ctx, 400, 225, 260, 520, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,10,.5)']]); ctx.fillRect(0, 0, 800, 450);
    }
    // "goal" text (screen-fixed)
    if (t > T.goal + 0.08 && t < T.end + 0.3) {
      const k = t - (T.goal + 0.08), sc = ease.outBack(clamp(k / 0.28)) * (1 - 0.4 * inv(29.85, 30.1, t)) , rot = -0.06 + Math.sin(t * 9) * 0.01, a = 1 - inv(29.95, 30.12, t);
      ctx.save(); ctx.translate(400, 132); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = a; ctx.font = '900 118px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 8; i > 0; i--) { ctx.fillStyle = '#7a3a00'; ctx.fillText('גול!', -i * 0.9, i * 1.2); }
      ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.strokeText('גול!', 0, 0);
      ctx.fillStyle = A.linear(ctx, 0, -55, 0, 55, [[0, '#fff3b8'], [1, GOLD]]); ctx.fillText('גול!', 0, 0); ctx.restore();
    }
    // goal flash
    if (t >= T.goal && t < T.goal + 0.35) { ctx.fillStyle = `rgba(255,252,230,${0.5 * Math.pow(1 - (t - T.goal) / 0.35, 2)})`; ctx.fillRect(0, 0, 800, 450); }
    ctx.restore(); // screen clip
    ctx.restore();
  }

  function spinnerState(t) {
    if (t < 24.95 || t >= T.imp) return null;
    const a = sm(24.95, 25.28, t), R = key(t, [[24.95, 12], [25.32, 30, 'out'], [25.5, 32]]);
    const rot = Math.min(t, T.blk) * 8.5, ice = t > T.frz ? sm(T.frz + 0.02, T.blk, t) : 0;
    return { a, R, rot, ice };
  }
  function drawMatchWithSpinner(ctx, t, ct, ix) {
    const frozenClock = ct;
    drawMatch(ctx, t, frozenClock, ix);
    const sp = spinnerState(t);
    if (sp) {
      ctx.save(); ctx.translate(400, 225); ctx.scale(ix.z, ix.z); ctx.translate(-ix.x, -ix.y);
      spinner(ctx, 318, 349, sp.R, sp.a, sp.rot, sp.ice, t > 25.2 && t < T.frz + 0.12);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- living room (whip destination)
  function livingRoom(ctx, ox, t) {
    ctx.save(); ctx.translate(ox, 0);
    ctx.fillStyle = A.linear(ctx, 0, -200, 0, 760, [[0, '#7a3a55'], [0.5, '#e67f5a'], [1, '#ffb877']]); ctx.fillRect(-900, -600, 1800, 1360);
    ctx.fillStyle = A.linear(ctx, 0, 740, 0, 1300, [[0, '#8a4b2c'], [1, '#4a2416']]); ctx.fillRect(-900, 740, 1800, 700);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-900, 736, 1800, 8);
    // window
    A.rrect(ctx, -520, 90, 360, 420, 14); ctx.fillStyle = A.linear(ctx, 0, 90, 0, 510, [[0, '#2b1b6b'], [1, '#ff9a6a']]); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#6b3a24'; ctx.stroke();
    ctx.fillStyle = '#6b3a24'; ctx.fillRect(-344, 90, 8, 420); ctx.fillRect(-520, 296, 360, 8);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(255,230,150,.85)'; ctx.fillRect(-500 + H(i) * 320, 400 + H(i + 4) * 90, 5, 8); }
    // sofa
    A.rrect(ctx, -300, 560, 620, 200, 40); A.fillStroke(ctx, '#c0407a', 7); A.rrect(ctx, -350, 610, 120, 150, 30); A.fillStroke(ctx, '#a83068', 7); A.rrect(ctx, 250, 610, 120, 150, 30); A.fillStroke(ctx, '#a83068', 7);
    A.rrect(ctx, -240, 660, 480, 110, 26); A.fillStroke(ctx, '#e0508f', 7);
    ctx.beginPath(); ctx.arc(-120, 640, 46, 0, TAU); A.fillStroke(ctx, GOLD, 6); ctx.beginPath(); ctx.arc(130, 646, 42, 0, TAU); A.fillStroke(ctx, '#38D9F5', 6);
    // lamp
    ctx.fillStyle = '#4a2416'; ctx.fillRect(470, 380, 10, 380); ctx.beginPath(); ctx.moveTo(430, 380); ctx.lineTo(520, 380); ctx.lineTo(500, 300); ctx.lineTo(450, 300); ctx.closePath(); A.fillStroke(ctx, '#ffd98a', 5);
    A.glow(ctx, 475, 340, 420, 'rgba(255,190,90,.7)', 1);
    // frames
    for (const [x, y, w, h, c] of [[520, 120, 130, 100, '#ffc24a'], [670, 150, 90, 130, '#38d9f5'], [-30, 130, 150, 110, '#ff4f9a']]) { A.rrect(ctx, x, y, w, h, 8); A.fillStroke(ctx, c, 6); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- text slams (screen space)
  function shockRing(ctx, cx, cy, tau, maxR, col, lw) {
    if (tau < 0 || tau > 0.6) return;
    const k = ease.out(tau / 0.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - k) + 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, maxR * k, maxR * k * 0.82, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function slamText(ctx, s, cx, cy, font, sc, rot, fill1, fill2, ext) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = font; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let i = ext; i > 0; i--) { ctx.fillStyle = A.mixc('#7a3200', '#2a0f60', i / ext * 0.6); ctx.fillText(s, -i * 0.7, i * 1.5); }
    ctx.lineWidth = 34; ctx.strokeStyle = OUT; ctx.strokeText(s, 0, 0);
    ctx.fillStyle = A.linear(ctx, 0, -130, 0, 130, [[0, fill1], [1, fill2]]); ctx.fillText(s, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.strokeText(s, -3, -4);
    ctx.restore();
  }

  function slamLayer(ctx, t, shakeX, shakeY) {
    if (t < T.imp || t > T.out + 0.5) return;
    const tau1 = t - T.imp, tau2 = t - T.dot;
    // dim backdrop + rays
    const dim = 0.55 * sm(T.imp, T.imp + 0.1, t) * (1 - sm(T.out - 0.05, T.out + 0.2, t));
    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.fillStyle = `rgba(8,4,30,${dim})`; ctx.fillRect(-50, -50, 2020, 1180);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(960, 470); ctx.rotate(t * 0.25);
    const ra = 0.11 * sm(T.imp, T.imp + 0.15, t) * (1 - sm(T.out - 0.05, T.out + 0.15, t));
    for (let i = 0; i < 18; i++) { ctx.rotate(TAU / 18); ctx.fillStyle = `rgba(255,205,90,${ra})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -70); ctx.lineTo(1500, 70); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // exit (anticipation squash then blow past camera)
    const ant = sm(27.0, 27.18, t), ex = ease.in(inv(T.out, T.out + 0.22, t));
    const exitSc = 1 - 0.07 * ant + ex * 2.4, exitA = 1 - inv(T.out + 0.05, T.out + 0.25, t);
    // MAIN "אין תקיעות"
    const c1 = ease.outBack(clamp(tau1 / 0.22));
    let sc1 = tau1 < 0.22 ? lerp(3.4, 1, c1) : 1 + 0.03 * Math.sin(tau1 * 10) * Math.exp(-tau1 * 3);
    if (tau2 > 0 && tau2 < 0.3) sc1 *= 1 + 0.045 * Math.exp(-tau2 * 12) * Math.cos(tau2 * 30);
    ctx.save(); ctx.globalAlpha = exitA * Math.min(1, tau1 / 0.03);
    const jx = (tau1 < 0.6 ? A.noise1(t * 50) * 5 * Math.exp(-tau1 * 5) : 0), rot1 = -0.035 + (tau1 < 0.3 ? 0.04 * (1 - tau1 / 0.3) : 0);
    ctx.font = '900 400px Rubik'; ctx.direction = 'rtl'; const w1 = ctx.measureText('אין תקיעות').width, fit = Math.min(1, 1560 / w1);
    const my = 390 - 30 * (tau2 > 0 ? 0.5 : 0);
    slamText(ctx, 'אין תקיעות', 960 + jx, my, '900 400px Rubik', sc1 * fit * exitSc, rot1, GOLDHI, '#FFAA14', 16);
    ctx.restore();
    // "נקודה" + big dot
    if (tau2 >= 0) {
      const c2 = tau2 < 0.2 ? lerp(4.2, 1, ease.out(tau2 / 0.2)) : 1 + 0.03 * Math.sin(tau2 * 12) * Math.exp(-tau2 * 3);
      const dotSq = tau2 < 0.2 ? 1 : 1 + 0.08 * Math.exp(-(tau2 - 0.2) * 12) * Math.cos((tau2 - 0.2) * 34);
      ctx.save(); ctx.globalAlpha = exitA * Math.min(1, tau2 / 0.03);
      ctx.font = '900 230px Rubik'; ctx.direction = 'rtl'; const w2 = ctx.measureText('נקודה').width;
      const ty = 700, wx = 960 + 80;
      slamText(ctx, 'נקודה', wx, ty, '900 230px Rubik', c2 * exitSc, 0.03, '#ffffff', '#b9f3ff', 12);
      // dot at the left end
      const dx = wx - w2 / 2 - 128 * exitSc, dy = ty + 42, dr = 46;
      ctx.save(); ctx.translate(dx, dy); ctx.scale(c2 * exitSc * (2 - dotSq) , c2 * exitSc * dotSq);
      ctx.beginPath(); ctx.arc(0, 0, dr, 0, TAU); ctx.fillStyle = A.radial(ctx, -14, -16, 4, dr, [[0, '#FFF3B8'], [1, GOLD]]); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = OUT; ctx.stroke(); ctx.restore();
      ctx.restore();
      shockRing(ctx, dx, dy, tau2, 900, 'rgba(255,214,110,1)', 34);
      shockRing(ctx, dx, dy, tau2 - 0.08, 600, 'rgba(255,255,255,1)', 14);
    }
    // rings on impact
    shockRing(ctx, 960, 420, tau1, 1300, 'rgba(255,220,120,1)', 46);
    shockRing(ctx, 960, 420, tau1 - 0.07, 1000, 'rgba(160,235,255,1)', 22);
    shockRing(ctx, 960, 420, tau1 - 0.14, 760, 'rgba(255,255,255,1)', 12);
    ctx.restore();
  }

  // ---------------------------------------------------------------- outer camera
  function outerCam(t) {
    let zoom = key(t, [[23.9, 1.0], [25.5, 1.2, 'in'], [T.imp, 1.2], [25.66, 1.4, 'out'], [26.25, 1.23, 'out'], [T.dot, 1.23], [T.dot + 0.06, 1.34, 'out'], [27.05, 1.22, 'inOut'], [27.2, 1.2, 'inOut'], [27.42, 1.9, 'in'], [27.62, 2.4, 'out'], [29.75, 2.4], [30.12, 1.05, 'inOut']]);
    // slow creeping drift behind the whole thing
    zoom += (t < T.blk ? 0.006 * Math.sin(t * 5) : 0);
    const cx = key(t, [[29.98, 960], [30.42, 3050, 'inOut']]);
    const cy = 540 + (475 - 540) * clamp((zoom - 1) / 1.4);
    const rot = key(t, [[23.9, 0], [25.5, 0.004], [27.2, 0], [27.4, -0.05, 'inOut'], [27.62, 0, 'out']]) + (t < T.blk ? 0.003 * Math.sin(t * 3) : 0);
    const sa = 22 * (t >= T.imp ? Math.exp(-(t - T.imp) * 8) : 0) + 16 * (t >= T.dot ? Math.exp(-(t - T.dot) * 9) : 0) + (t > T.kick && t < T.kick + 0.12 ? 3 : 0) + 9 * (t >= T.goal ? Math.exp(-(t - T.goal) * 7) : 0);
    return { x: cx, y: cy, zoom, rot, sx: A.noise1(t * 47) * sa, sy: A.noise1(t * 47 + 31) * sa, srot: A.noise1(t * 31) * sa * 0.0006 };
  }

  function drawWorld(ctx, t) {
    const ct = t < T.out ? Math.min(t, T.frz) : T.frz + (t - T.out);
    const c = outerCam(t);
    const frozenBW = t >= T.blk && t < T.imp;
    ctx.save();
    ctx.translate(960 + c.sx, 540 + c.sy); ctx.rotate(c.rot + c.srot); ctx.scale(c.zoom, c.zoom); ctx.translate(-c.x, -c.y);
    drawVoid(ctx, t, ct, c.x);
    if (c.x > 1500) livingRoom(ctx, 3050, t);
    if (c.x < 2400) {
      spotlight(ctx, t, ct);
      drawTV(ctx, t, ct);
      // shatter / cracks / shards in world space over the TV
      const ox = TVX + 318, oy = TVY + 349, tau = t - T.imp;
      if (t >= T.imp && t < T.out + 0.2) {
        ctx.save(); A.rrect(ctx, TVX, TVY, TVW, TVH, 8); ctx.clip();
        cracks(ctx, ox, oy, tau, 1 - inv(26.5, 27.05, t)); ctx.restore();
        shatterShards(ctx, ox, oy, tau, 100, 48, 60, false);
        shatterShards(ctx, ox, oy, tau * 0.9, 500, 30, 22, true);
      }
      // confetti bursting out of TV in the zoom out
      if (t > 29.85) {
        const k = t - 29.85;
        for (let i = 0; i < 90; i++) {
          const x0 = 700 + H(i) * 520, y0 = 300 + H(i + 1) * 300, vx = (H(i + 2) - 0.5) * 900, vy = -(300 + H(i + 3) * 600);
          const x = x0 + vx * k, y = y0 + vy * k + 0.5 * 700 * k * k, sz = 5 + H(i + 4) * 7;
          ctx.save(); ctx.translate(x, y); ctx.rotate(H(i + 5) * 6 + k * 9); ctx.scale(1, Math.cos(k * 14 + i));
          ctx.fillStyle = [GOLD, '#38D9F5', '#FF4F9A', '#fff', '#FFD21F'][i % 5]; ctx.fillRect(-sz, -sz * 0.5, sz * 2, sz); ctx.restore();
        }
      }
    }
    ctx.restore();
    // screen-space: slam layer, flashes
    const shx = c.sx * 0.6, shy = c.sy * 0.6;
    slamLayer(ctx, t, shx, shy);
    if (t >= T.imp && t < T.imp + 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.9 * Math.pow(1 - (t - T.imp) / 0.25, 2.2)})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (t >= T.dot && t < T.dot + 0.16) { ctx.fillStyle = `rgba(255,236,170,${0.4 * (1 - (t - T.dot) / 0.16)})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (t >= 28.5 && t < 28.6) { ctx.fillStyle = `rgba(200,245,255,${0.22 * (1 - (t - 28.5) / 0.1)})`; ctx.fillRect(0, 0, 1920, 1080); }
    if (t >= T.goal && t < T.goal + 0.3) { ctx.fillStyle = `rgba(255,250,225,${0.3 * Math.pow(1 - (t - T.goal) / 0.3, 2)})`; ctx.fillRect(0, 0, 1920, 1080); }
    // whip streaks
    return c;
  }

  // ---------------------------------------------------------------- frame composition (blurs, freeze frame)
  function draw(ctx, s) {
    const t = s.t;
    // suspense drum vignette pulse (beats every 0.25 s, growing)
    if (t >= T.blk && t < T.imp) {
      if (t < T.blk + 1 / 30) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080); return; }
      const [b, g] = buf('main', 1920, 1080); drawWorld(g, T.blk - 0.001);
      ctx.save(); ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.05)'; ctx.drawImage(b, 0, 0); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, 1920, 1080);
      return;
    }
    const whipIn = t > T.out && t < 27.7;
    const whipOut = t > 29.98;
    if (whipIn || whipOut) {
      const [b, g] = buf('main', 1920, 1080); const c = drawWorld(g, t);
      let n = 12;
      if (whipIn) {
        const k = Math.sin(PI * inv(T.out, 27.7, Math.min(t, 27.7))) , st = Math.pow(k, 0.8) * 0.16;
        ctx.drawImage(b, 0, 0);
        for (let i = 1; i < n; i++) {
          const z = 1 + st * i / n; ctx.globalAlpha = 1 / (i + 1); ctx.save(); ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540); ctx.drawImage(b, 0, 0); ctx.restore();
        }
        ctx.globalAlpha = 1;
        // streak lines
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(960, 540);
        for (let i = 0; i < 40; i++) { const a = H(i + 40) * TAU, r0 = 350 + H(i + 41) * 500, len = 140 + H(i + 42) * 500 * k; ctx.strokeStyle = `rgba(255,236,190,${0.38 * k})`; ctx.lineWidth = 2 + H(i + 43) * 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len)); ctx.stroke(); }
        ctx.restore();
      } else {
        const c0 = outerCam(t - 0.02), c1 = outerCam(t + 0.02), spd = Math.abs(c1.x - c0.x) / 0.04 * c.zoom / 30;
        const L = clamp(spd * 0.6, 0, 420);
        ctx.drawImage(b, 0, 0);
        for (let i = 1; i < n; i++) { ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(b, -L * i / n * 0.5 - L * 0.5 * 0 + L * (i % 2 ? -1 : 1) * i / n * 0.5, 0); }
        ctx.globalAlpha = 1;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) { const y = H(i + 70) * 1000 + 40, len = 200 + H(i + 71) * 900 * clamp(L / 300); ctx.fillStyle = `rgba(255,236,190,${0.3 * clamp(L / 200)})`; ctx.fillRect(H(i + 72) * 1920 - len / 2, y, len, 2 + H(i + 73) * 4); }
        ctx.restore();
      }
      return;
    }
    drawWorld(ctx, t);
  }

  A.scene({ name: 's4_nofreeze', start: T.start, end: T.tail, draw });
})();
