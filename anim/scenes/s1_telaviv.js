// ============================================================================
// S1 · "The broadcast" · global 0.0 - 6.2
// Tel Aviv night crane -> stadium close ("ooh") -> whip-pan up to the IPTV mast -> packets launch over the sea
// -> streak/flash into S2 (snowy Toronto).
// Deterministic: pure function of t. Uses kits/journey.js (drawTelAviv, drawStadiumClose, drawPacketStream)
// and kits/datafolk.js (drawBit, tiny foreshadowing cameo).
// ============================================================================
(() => {
  const { clamp, lerp, key, inv, smooth, ease, hash: H } = A;
  const T = A.TLV;

  // scratch buffer for smear / motion-blur compositing (redrawn every frame, no state carried)
  let BUF = null;
  const buf = () => { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = 1920; BUF.height = 1080; } return BUF; };

  // ---------------------------------------------------------------- camera script (world coords)
  // shot A: crane down + push toward the stadium
  const camA = t => {
    const x = key(t, [[0, 2050], [2.2, 1380, 'inOut'], [2.62, 720, 'in']]);
    const y = key(t, [[0, 900], [2.2, 1420, 'inOut'], [2.62, 1640, 'in']]);
    const zoom = key(t, [[0, 0.56], [2.2, 0.9, 'inOut'], [2.62, 1.9, 'in']]);
    return { x, y, zoom, rot: key(t, [[0, -0.012], [2.6, 0.004]]) };
  };
  // stream head along the launch path (fast burst, then a steady cruise out over the sea)
  const headAt = t => { const p = inv(5.0, 6.2, t); return 0.62 * (1 - Math.pow(1 - p, 1.6)); };
  // shots B2 + C share one world camera: aerial over the stadium -> WHIP up to the IPTV mast -> follow the packets
  const whipE = p => (p < 0.5 ? 8 * p * p * p * p : 1 - 8 * Math.pow(1 - p, 4));
  const MASTCAM = { x: 1225, y: 1230, zoom: 0.98 };
  const camC = t => {
    const d = ease.inOut(inv(3.75, 4.5, t));
    let x = lerp(470, 590, d), y = lerp(1735, 1675, d), lz = Math.log(lerp(2.45, 2.12, d)), rot = lerp(0.03, 0.004, d);
    y += Math.sin(Math.PI * inv(4.3, 4.5, t)) * 14; // tiny anticipation dip before the whip
    const w = whipE(inv(4.47, 4.98, t));
    x = lerp(x, MASTCAM.x, w); y = lerp(y, MASTCAM.y, w); lz = lerp(lz, Math.log(MASTCAM.zoom), w);
    rot = lerp(rot, -0.004, w) + Math.sin(Math.PI * w) * 0.05;
    let zoom = Math.exp(lz);
    const f = ease.inOut(inv(4.98, 5.9, t));
    if (f > 0) {
      const [hx, hy] = pathAt(headAt(t));
      const z2 = lerp(0.98, 0.9, f);
      x = lerp(x, hx - 380 / z2, f); y = lerp(y, Math.max(hy + 190 / z2, 1000), f); zoom = z2;
    }
    return { x, y, zoom, rot: rot + 0.01 * ease.inOut(inv(5.2, 6.2, t)) };
  };
  const toScreen = (c, x, y) => {
    const dx = (x - c.x) * c.zoom, dy = (y - c.y) * c.zoom, r = c.rot || 0;
    return [960 + dx * Math.cos(r) - dy * Math.sin(r), 540 + dx * Math.sin(r) + dy * Math.cos(r)];
  };

  // launch path helpers
  const LP = T.launchPath;
  const LL = [0]; for (let i = 1; i < LP.length; i++) LL.push(LL[i - 1] + Math.hypot(LP[i][0] - LP[i - 1][0], LP[i][1] - LP[i - 1][1]));
  const LTOT = LL[LL.length - 1];
  const pathAt = u => {
    const d = clamp(u) * LTOT; let i = 1; while (i < LL.length - 1 && LL[i] < d) i++;
    const k = (d - LL[i - 1]) / (LL[i] - LL[i - 1] || 1), a = LP[i - 1], b = LP[i];
    const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1;
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), dx / ln, dy / ln];
  };

  // ---------------------------------------------------------------- pieces
  function caption(ctx, t) {
    const a = Math.min(smooth(0.55, 1.05, t), 1 - smooth(2.05, 2.5, t));
    if (a <= 0) return;
    const slide = (1 - ease.out(inv(0.55, 1.3, t))) * 14;
    ctx.save(); ctx.globalAlpha = a;
    // thin accent rule + text (RTL, top-left)
    ctx.fillStyle = 'rgba(255,210,31,0.9)'; ctx.fillRect(84, 78, 4, 58);
    A.text(ctx, 'תל אביב · 22:47', 104 + slide, 108, { font: '600 46px Rubik', fill: '#fff6e0', align: 'left', dir: 'rtl', stroke: 'rgba(10,6,30,0.55)', lw: 6 });
    A.text(ctx, 'TEL AVIV · ISRAEL', 106 + slide * 1.6, 152, { font: '500 20px Rubik', fill: 'rgba(255,230,200,0.75)', align: 'left' });
    ctx.restore();
  }

  function plane(ctx, t, c) {
    // an airliner high over the sea, gliding right->left, with nav lights and strobe
    const px = lerp(2750, 2050, t / 2.6), py = lerp(560, 520, t / 2.6);
    // light parallax (sky layer ~0.35)
    const f = 0.35, z = 0.5 * Math.pow(c.zoom / 0.5, f);
    const sx = 960 + (px - (1920 + (c.x - 1920) * f)) * z, sy = 540 + (py - (1080 + (c.y - 1080) * f)) * z;
    if (sx < -50 || sx > 1970 || sy < -50 || sy > 1130) return;
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(20,14,50,0.85)';
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 2.2, -0.05, 0, A.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(4, -1); ctx.lineTo(2, 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(13, -6); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
    const strobe = ((t * 1.25) % 1) < 0.06 ? 1 : 0, bcn = Math.pow(Math.max(0, Math.sin(t * 5.5)), 8);
    A.glow(ctx, 12, -5, 14, `rgba(255,70,70,${0.35 + 0.65 * bcn})`);
    A.glow(ctx, 0, 4, 10, 'rgba(120,255,160,0.7)');
    if (strobe) { A.glow(ctx, -12, 0, 40, 'rgba(255,255,255,0.95)'); A.glow(ctx, 3, 6, 30, 'rgba(255,255,255,0.8)'); }
    ctx.restore();
  }

  // foreground palm fronds hanging into the top-right of frame (we're on a rooftop); they rise away as we crane down
  function frond(ctx, len, sway, rim) {
    ctx.save(); ctx.rotate(sway);
    const spine = u => [len * u, len * (0.55 * u * u - 0.28 * u)];
    ctx.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = spine(i / 20); i ? ctx.lineTo(x, y - 7 * (1 - i / 20)) : ctx.moveTo(x, y - 7); }
    for (let i = 20; i >= 0; i--) { const [x, y] = spine(i / 20); ctx.lineTo(x, y + 7 * (1 - i / 20)); } ctx.fill();
    for (let i = 1; i < 26; i++) {
      const u = i / 26, [x, y] = spine(u), l = len * 0.3 * Math.sin(Math.PI * (0.15 + u * 0.8)) * (1 - u * 0.35);
      for (const sd of [-1, 1]) {
        const ex = x + l * 0.42 + sd * 0.0, ey = y + sd * l * 0.95 + l * 0.35;
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x + l * 0.1, y + sd * l * 0.5, ex, ey); ctx.quadraticCurveTo(x + l * 0.3, y + sd * l * 0.45, x + 10, y); ctx.fill();
        if (rim && sd < 0) { ctx.save(); ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l * 0.1, y + sd * l * 0.5, ex, ey); ctx.stroke(); ctx.restore(); }
      }
    }
    ctx.restore();
  }
  function foreground(ctx, t) {
    const k = ease.inOut(inv(0, 1.9, t));
    const dy = -k * 900, dx = k * 220;
    if (dy < -880) return;
    ctx.save(); ctx.translate(1920 + 80 + dx, -120 + dy);
    ctx.fillStyle = '#08051a';
    const sw = A.wob(t, 3, 0.6) * 0.035;
    const rim = 'rgba(255,150,170,0.35)';
    [[2.0, 820, 0], [2.45, 760, 1.2], [1.65, 700, 2.1], [2.85, 640, 3.3], [1.35, 560, 4.4]].forEach(([ang, len, ph]) => {
      ctx.save(); ctx.rotate(ang); ctx.scale(1, ang > 1.7 && ang < 2.5 ? -1 : -1); frond(ctx, len, sw + A.wob(t, ph, 0.9) * 0.02, rim); ctx.restore();
    });
    ctx.fillStyle = '#08051a'; A.ellipse(ctx, 0, 0, 70, 70); ctx.fill();
    ctx.restore();
  }

  // tiny match on the pitch of the stadium close-up (centre area is kept clear by the kit)
  function pitchAction(ctx, t) {
    // perspective of the pitch: horizon far away; y 560..900 usable
    const P = (u, v) => { const y = lerp(560, 900, v), s = lerp(0.55, 1.1, v); return [960 + u * 900 * lerp(0.9, 1.15, v), y, s]; };
    const lt = t - 2.6;
    // attacker with the ball runs left -> right diagonally toward the camera-right goal
    const au = lerp(-0.55, 0.28, ease.inOut(clamp(lt / 2.1))), av = lerp(0.3, 0.55, clamp(lt / 2.1));
    const players = [];
    players.push({ u: au, v: av, team: 0, run: 1, ph: 0 });
    for (let i = 0; i < 7; i++) {
      const team = i < 3 ? 0 : 1;
      const bu = (H(i + 3) - 0.5) * 1.5, bv = 0.1 + H(i + 11) * 0.7;
      const chase = team ? 0.55 : 0.35;
      const u = lerp(bu, au + (team ? 0.05 + H(i) * 0.12 : -0.2 - H(i) * 0.2), chase * clamp(lt / 1.5)) + A.wob(t, i, 0.7) * 0.03;
      const v = lerp(bv, av + (H(i + 5) - 0.5) * 0.35, chase * 0.6);
      players.push({ u, v, team, run: 1, ph: i * 1.7 });
    }
    players.sort((a, b) => a.v - b.v);
    for (const p of players) {
      const [x, y, s] = P(p.u, p.v);
      const run = Math.sin(t * 13 + p.ph), bob = Math.abs(run) * 3 * s;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(10,40,20,0.35)'; A.ellipse(ctx, 6, 2, 22, 5); ctx.fill();
      ctx.translate(0, -bob);
      // legs
      ctx.strokeStyle = '#1a1330'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(-3 + run * 9, -2); ctx.moveTo(3, -30); ctx.lineTo(3 - run * 9, -2); ctx.stroke();
      ctx.strokeStyle = p.team ? '#fff' : '#1f4fbf'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(-3 + run * 5, -18); ctx.moveTo(3, -30); ctx.lineTo(3 - run * 5, -18); ctx.stroke();
      // body
      ctx.fillStyle = p.team ? '#e0322c' : '#ffd21f'; A.rrect(ctx, -10, -58, 20, 30, 7); A.fillStroke(ctx, ctx.fillStyle, 3);
      ctx.fillStyle = '#b9794f'; A.ellipse(ctx, 0, -66, 7.5, 8); A.fillStroke(ctx, '#b9794f', 3);
      ctx.fillStyle = '#1a1330'; A.ellipse(ctx, 0, -70, 7.5, 4); ctx.fill();
      ctx.restore();
    }
    // ball at the attacker's feet
    const [bx, by, bs] = P(au + 0.035 + Math.sin(t * 6.5) * 0.008, av + 0.02);
    ctx.fillStyle = '#fff'; A.ellipse(ctx, bx, by - 5 * bs, 6 * bs, 6 * bs); A.fillStroke(ctx, '#fff', 2);
  }

  // anamorphic floodlight flares + floating light dust in the stadium close-up
  function stadiumFlares(ctx, t, roar) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [lx, ly, ph] of [[150, 40, 0], [1770, 40, 1.7]]) {
      const fl = 0.85 + 0.15 * Math.sin(t * 23 + ph);
      ctx.fillStyle = A.linear(ctx, lx - 900, 0, lx + 900, 0, [[0, 'rgba(90,150,255,0)'], [0.5, `rgba(170,210,255,${0.55 * fl})`], [1, 'rgba(90,150,255,0)']]);
      ctx.fillRect(lx - 900, ly - 3, 1800, 6);
      ctx.fillStyle = A.linear(ctx, lx - 500, 0, lx + 500, 0, [[0, 'rgba(255,240,200,0)'], [0.5, `rgba(255,250,235,${0.8 * fl})`], [1, 'rgba(255,240,200,0)']]);
      ctx.fillRect(lx - 500, ly - 1.2, 1000, 2.4);
      // ghost orbs along the flare axis toward frame centre
      for (let i = 1; i <= 3; i++) { const gx = lerp(lx, 960, 0.35 * i + 0.1), gy = lerp(ly, 700, 0.35 * i + 0.1); A.glow(ctx, gx, gy, 30 + i * 16, `rgba(140,190,255,${0.10 - i * 0.02})`); }
    }
    // dust / moths drifting in the floodlight beams
    for (let i = 0; i < 60; i++) {
      const bx = H(i * 3.3) * 1920, by = 120 + H(i * 7.1) * 520, sp = 10 + H(i) * 25;
      const x = bx + Math.sin(t * 0.8 + i) * 30 + t * sp * (H(i + 2) - 0.5), y = by + Math.sin(t * 1.3 + i * 2) * 14 - t * 6;
      const a = (0.25 + 0.5 * H(i + 9)) * (0.6 + 0.4 * Math.sin(t * 5 + i));
      A.glow(ctx, x, y, 5 + H(i + 4) * 7, `rgba(255,245,215,${a})`);
    }
    ctx.restore();
  }

  function packetBurst(ctx, t, c) {
    const [mx, my] = toScreen(c, T.mastTop.x, T.mastTop.y);
    const k = inv(5.0, 5.45, t);
    // shockwave + flash at the mast top
    if (k > 0 && k < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, mx, my, 260 * (0.4 + k), `rgba(120,250,255,${(1 - k) * 0.9})`);
      A.glow(ctx, mx, my, 90, `rgba(255,255,255,${(1 - k)})`);
      ctx.lineWidth = 6 * (1 - k) + 1; ctx.strokeStyle = `rgba(160,255,255,${(1 - k) * 0.9})`;
      A.ellipse(ctx, mx, my, 40 + k * 520, 40 + k * 520); ctx.stroke();
      ctx.lineWidth = 3 * (1 - k) + 1; ctx.strokeStyle = `rgba(255,120,200,${(1 - k) * 0.6})`;
      A.ellipse(ctx, mx, my, 20 + k * 340, 20 + k * 340); ctx.stroke();
      // radial sparks
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * A.TAU + H(i) * 0.3, r0 = 30 + k * 200 * (0.6 + H(i + 4)), r1 = r0 + 40 * (1 - k);
        ctx.strokeStyle = `rgba(200,255,255,${(1 - k) * 0.8})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * r0, my + Math.sin(a) * r0); ctx.lineTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    // stream in world space
    const head = headAt(t);
    if (head > 0) {
      ctx.save(); A.camera(ctx, c);
      A.drawPacketStream(ctx, LP, t, { head, count: 70, speed: 0.55, size: 16, spread: 46, seed: 3 });
      A.drawPacketStream(ctx, LP, t + 0.37, { head, count: 30, speed: 0.8, size: 10, spread: 90, seed: 9, alpha: 0.7 });
      ctx.restore();
    }
    // a few recognisable commuter packets riding the stream (mail, video, meme, photo)
    if (head > 0.1) {
      [[0.06, 'mail', 1], [0.11, 'video', 2], [0.17, 'meme', 3], [0.24, 'photo', 4], [0.3, 'update', 5]].forEach(([back, kind, seed]) => {
        const u = head - back - 0.01 * Math.sin(t * 2 + seed); if (u < 0.03) return;
        const [wx, wy, tx, ty] = pathAt(u), off = (H(seed) - 0.5) * 50;
        const [sx, sy] = toScreen(c, wx - ty * off, wy + tx * off);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, sx, sy - 10, 34, 'rgba(120,230,255,0.35)'); ctx.restore();
        A.drawPacket(ctx, sx, sy, 0.3 * c.zoom, { t, kind, seed, mood: 'shock', rot: Math.atan2(ty, tx) * 0.6, glow: 1.2 });
      });
    }
    // BIT: the one gold packet near the front of the stream, catching the light for a moment
    const bu = head - 0.018 - 0.006 * Math.sin(t * 3);
    if (head > 0.08) {
      const [wx, wy, tx, ty] = pathAt(bu);
      const [sx, sy] = toScreen(c, wx, wy - 18);
      const glint = Math.exp(-Math.pow((t - 5.62) / 0.09, 2));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      A.glow(ctx, sx, sy, 60 + glint * 120, `rgba(255,200,60,${0.55 + glint * 0.45})`);
      ctx.restore();
      A.drawBit(ctx, sx, sy + 16, 0.36 * c.zoom, { t, mood: 'determined', limbs: 'fly', vel: [tx * 1400, ty * 1400], glow: 1.4 + glint * 0.6, trail: 0.6, mouth: 0 });
      if (glint > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(sx + 6, sy - 6); ctx.rotate(t * 2);
        const L = 90 * glint;
        ctx.fillStyle = `rgba(255,250,220,${glint})`;
        ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -3); ctx.lineTo(L, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, -L * 0.7); ctx.lineTo(-3, 0); ctx.lineTo(0, L * 0.7); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill();
        A.glow(ctx, 0, 0, 30, `rgba(255,255,255,${glint})`);
        ctx.restore();
      }
    }
  }

  // motion smear: redraw the finished frame shifted along (vx,vy) with decreasing weight
  function smear(ctx, vx, vy, n = 7) {
    const len = Math.hypot(vx, vy); if (len < 2) return;
    const b = buf(), g = b.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= n; i++) { const f = i / n; ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(b, -vx * f, -vy * f); }
    ctx.restore();
  }
  function streaks(ctx, t, vx, vy, amt, seed = 0, col = '255,255,255') {
    if (amt <= 0.01) return;
    const len = Math.hypot(vx, vy) || 1, ux = vx / len, uy = vy / len;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const r1 = H(i * 3.1 + seed), r2 = H(i * 7.7 + seed + 1), r3 = H(i * 1.3 + seed + 2);
      const x = r1 * 2200 - 140, y = r2 * 1260 - 90, L = (120 + r3 * 520) * amt;
      ctx.strokeStyle = `rgba(${col},${(0.05 + r3 * 0.22) * amt})`; ctx.lineWidth = 1 + r3 * 3;
      ctx.beginPath(); ctx.moveTo(x - ux * L, y - uy * L); ctx.lineTo(x + ux * L * 0.2, y + uy * L * 0.2); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- scene
  A.scene({
    name: 's1_telaviv', start: 0, end: 6.2,
    draw(ctx, s) {
      const t = s.t;
      if (t < 2.6) {
        // ---- SHOT A: crane over the panorama
        const c = camA(t);
        A.drawTelAviv(ctx, t, { cam: c, roar: lerp(0.35, 0.75, smooth(0.3, 2.5, t)), broadcast: 0.45 });
        plane(ctx, t, c);
        foreground(ctx, t);
        // push-in smear into the stadium
        const pk = inv(2.25, 2.6, t);
        if (pk > 0) {
          // radial zoom streaks toward the stadium
          const [sx, sy] = toScreen(c, T.stadium.x, T.stadium.y);
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 40; i++) {
            const a = H(i) * A.TAU, r0 = 250 + H(i + 9) * 700, L = pk * pk * (140 + H(i + 3) * 400);
            ctx.strokeStyle = `rgba(255,240,200,${0.14 * pk})`; ctx.lineWidth = 1.5 + H(i + 5) * 2.5;
            ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); ctx.lineTo(sx + Math.cos(a) * (r0 + L), sy + Math.sin(a) * (r0 + L)); ctx.stroke();
          }
          ctx.restore();
          A.glow(ctx, sx, sy, 900, `rgba(255,240,200,${0.35 * pk * pk})`);
        }
        caption(ctx, t);
      } else if (t < 3.75) {
        // ---- SHOT B: in the stadium, crowd "ooh", announcer over it
        const lt = t - 2.6;
        const k = ease.inOut(clamp(lt / 1.15));
        const zs = lerp(1.05, 1.14, k);
        ctx.save();
        ctx.translate(960, 540); ctx.scale(zs, zs); ctx.rotate(lerp(-0.014, 0.004, k)); ctx.translate(-960 - lerp(-40, 45, k), -540 + lerp(-10, 12, k));
        const roar = clamp(0.25 + 0.95 * ease.out(inv(2.55, 3.35, t)));
        A.drawStadiumClose(ctx, t, { roar });
        pitchAction(ctx, t);
        stadiumFlares(ctx, t, roar);
        ctx.restore();
        // cut-in pop: brief warm flash on the cut
        const cf = 1 - inv(2.6, 2.8, t);
        if (cf > 0) { ctx.fillStyle = `rgba(255,245,220,${cf * 0.55})`; ctx.fillRect(0, 0, 1920, 1080); }
      } else {
        // ---- SHOT B2 + C: aerial over the stadium, WHIP up to the IPTV mast, packets launch, follow them over the sea
        const c = camC(t);
        const bc = lerp(0.6, 1.6, smooth(4.9, 5.1, t));
        A.drawTelAviv(ctx, t, { cam: c, roar: lerp(1, 0.75, smooth(3.9, 4.6, t)), broadcast: bc });
        if (t >= 4.9) packetBurst(ctx, t, c);
        // whip smear from the camera's actual velocity (exaggerated shutter)
        if (t > 4.45 && t < 5.05) {
          const c1 = camC(t - 1 / 15);
          const vx = -(c.x - c1.x) * c.zoom, vy = -(c.y - c1.y) * c.zoom, sp = Math.hypot(vx, vy);
          if (sp > 6) {
            const k = Math.min(1, 700 / sp);
            smear(ctx, vx * k, vy * k, 9);
            streaks(ctx, t, vx, vy, clamp(sp / 500), 2);
          }
        }
        // follow-the-stream horizontal smear + exit streaks + flash
        const ex = ease.in(inv(5.75, 6.2, t));
        if (ex > 0) {
          smear(ctx, -220 * ex, 0, 7);
          streaks(ctx, t, 1, 0, ex, 7, '190,250,255');
        }
        const fl = ease.in(inv(5.95, 6.2, t));
        if (fl > 0) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = A.linear(ctx, 0, 0, 1920, 0, [[0, `rgba(160,220,255,${fl * 0.4})`], [0.7, `rgba(230,250,255,${fl * 0.95})`], [1, `rgba(255,255,255,${fl})`]]);
          ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
        }
      }
    },
  });
})();
