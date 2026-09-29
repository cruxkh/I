// S2a: LIVE Israeli TV -> "NETFLIX" theatre -> "Disney+" night. Global 5.00-9.05 (+0.3 tail whip-out).
(() => {
  const W = 1920, H = 1080, OL = A.OUTLINE, TAU = A.TAU;
  const eo = A.ease.out, eb = A.ease.outBack, inv = A.inv;
  const cam = (ctx, z, rot, dx, dy) => { ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); };
  const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : eb(inv(t0, t0 + d, t)));
  const spark = (ctx, x, y, r, rot, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.2 : r; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  };
  const heart = (ctx, x, y, s, fill, lw = 0) => {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.8, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
    ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke(); }
  };

  // =====================================================================  LIVE WORLD
  const liveBG = () => A.layer('s2a_live_bg', W, H, (c) => {
    c.fillStyle = A.linear(c, 0, 0, 0, H, [[0, '#150F45'], [1, '#2B1B6B']]); c.fillRect(0, 0, W, H);
    // wall panels
    for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)'; c.fillRect(i * 214, 0, 214, H); }
    const wx = 120, wy = 100, ww = 1680, wh = 600;
    c.save(); A.rrect(c, wx, wy, ww, wh, 34); c.clip();
    c.fillStyle = A.linear(c, 0, wy, 0, wy + wh, [[0, '#2E7BFF'], [0.42, '#6FD0FF'], [0.72, '#FFE9B4'], [1, '#FFD590']]); c.fillRect(wx, wy, ww, wh);
    const base = 565;
    const R = A.rng(11);
    // far layer
    let x = wx - 20;
    while (x < wx + ww) { const w = 50 + R() * 60, h = 70 + R() * 130; c.fillStyle = '#B6CDF2'; c.fillRect(x, base - h, w, h + 5); c.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 4; k++) c.fillRect(x + 8, base - h + 12 + k * 26, w - 16, 5); x += w + 6; }
    // near layer
    x = wx - 40;
    while (x < wx + ww) {
      const w = 60 + R() * 70, h = 60 + R() * 120, col = ['#8FB2E8', '#9CC0F0', '#7EA3DC'][Math.floor(R() * 3)];
      c.fillStyle = col; c.fillRect(x, base - h, w, h + 5); c.lineWidth = 3; c.strokeStyle = 'rgba(26,19,48,0.55)'; c.strokeRect(x, base - h, w, h + 5);
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (let yy = base - h + 14; yy < base - 12; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 20) c.fillRect(xx, yy, 9, 11);
      x += w + 10;
    }
    // Azrieli: round, square, triangle
    const tw = 112, tb = base + 4;
    const bandsFn = (cx, top, w) => { c.fillStyle = 'rgba(40,70,140,0.55)'; for (let yy = top + 30; yy < tb - 10; yy += 26) c.fillRect(cx - w / 2 + 8, yy, w - 16, 12); };
    // round
    { const cx = 815, top = 230; c.beginPath(); c.moveTo(cx - tw / 2, tb); c.lineTo(cx - tw / 2, top + 40); c.quadraticCurveTo(cx - tw / 2, top - 6, cx, top - 6); c.quadraticCurveTo(cx + tw / 2, top - 6, cx + tw / 2, top + 40); c.lineTo(cx + tw / 2, tb); c.closePath();
      c.fillStyle = A.linear(c, cx - tw / 2, 0, cx + tw / 2, 0, [[0, '#F2F7FF'], [0.6, '#D0E0F7'], [1, '#9DB8E4']]); c.fill(); c.lineWidth = 6; c.strokeStyle = OL; c.stroke(); bandsFn(cx, top, tw);
      c.fillStyle = '#fff'; c.fillRect(cx - 5, top - 40, 10, 38); c.lineWidth = 3; c.strokeRect(cx - 5, top - 40, 10, 38); }
    // square
    { const cx = 960, top = 200; c.beginPath(); c.rect(cx - tw / 2, top, tw, tb - top); c.fillStyle = A.linear(c, cx - tw / 2, 0, cx + tw / 2, 0, [[0, '#F2F7FF'], [0.6, '#D0E0F7'], [1, '#9DB8E4']]); c.fill(); c.lineWidth = 6; c.strokeStyle = OL; c.stroke();
      c.fillStyle = 'rgba(40,70,140,0.55)'; for (let yy = top + 22; yy < tb - 10; yy += 24) for (let xx = cx - tw / 2 + 10; xx < cx + tw / 2 - 20; xx += 24) c.fillRect(xx, yy, 14, 13);
      c.fillStyle = '#7EA3DC'; c.fillRect(cx - tw / 2 - 5, top - 10, tw + 10, 16); c.lineWidth = 4; c.strokeRect(cx - tw / 2 - 5, top - 10, tw + 10, 16); }
    // triangle
    { const cx = 1105, top = 215; c.beginPath(); c.moveTo(cx - tw / 2, tb); c.lineTo(cx - tw / 2, top + 60); c.lineTo(cx, top - 10); c.lineTo(cx + tw / 2, top + 60); c.lineTo(cx + tw / 2, tb); c.closePath();
      c.fillStyle = A.linear(c, cx - tw / 2, 0, cx + tw / 2, 0, [[0, '#F2F7FF'], [0.6, '#D0E0F7'], [1, '#9DB8E4']]); c.fill(); c.lineWidth = 6; c.strokeStyle = OL; c.stroke();
      c.fillStyle = 'rgba(40,70,140,0.55)'; for (let yy = top + 70; yy < tb - 10; yy += 24) c.fillRect(cx - tw / 2 + 10, yy, tw - 20, 12);
      c.beginPath(); c.moveTo(cx - 30, top + 60); c.lineTo(cx, top + 8); c.lineTo(cx + 30, top + 60); c.fillStyle = 'rgba(40,70,140,0.45)'; c.fill(); }
    // sand + umbrellas + palms
    c.fillStyle = A.linear(c, 0, base, 0, 640, [[0, '#FFE2A0'], [1, '#F6C572']]); c.fillRect(wx, base, ww, 90);
    const um = [[300, 0], [560, 1], [1250, 2], [1500, 0], [1700, 1]], uc = ['#FF4F9A', '#38D9F5', '#FFC24A'];
    um.forEach(([ux, ci]) => { const uy = base + 38; c.fillStyle = OL; c.fillRect(ux - 2, uy - 4, 4, 32); c.beginPath(); c.moveTo(ux - 34, uy); c.quadraticCurveTo(ux, uy - 46, ux + 34, uy); c.closePath(); c.fillStyle = uc[ci]; c.fill(); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); });
    [[210, 1], [1660, -1], [700, 1], [1400, -1]].forEach(([px, d]) => {
      c.lineWidth = 12; c.strokeStyle = OL; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, base + 40); c.quadraticCurveTo(px + d * 30, base - 60, px + d * 14, base - 130); c.stroke();
      c.lineWidth = 6; c.strokeStyle = '#B9803B'; c.stroke();
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.62; const ex = px + d * 14 + Math.cos(a) * 76, ey = base - 130 + Math.sin(a) * 60 + 26; c.beginPath(); c.moveTo(px + d * 14, base - 130); c.quadraticCurveTo(px + d * 14 + Math.cos(a) * 44, base - 130 + Math.sin(a) * 60 - 22, ex, ey); c.quadraticCurveTo(px + d * 14 + Math.cos(a) * 40, base - 130 + Math.sin(a) * 30, px + d * 14, base - 128); c.fillStyle = '#2FBF6B'; c.fill(); c.lineWidth = 3; c.strokeStyle = OL; c.stroke(); }
    });
    // sea
    c.fillStyle = A.linear(c, 0, 640, 0, 700, [[0, '#28C7E6'], [1, '#1673E0']]); c.fillRect(wx, 640, ww, 70);
    c.restore();
    // frame
    A.rrect(c, wx, wy, ww, wh, 34); c.lineWidth = 14; c.strokeStyle = OL; c.stroke();
    A.rrect(c, wx - 10, wy - 10, ww + 20, wh + 20, 42); c.lineWidth = 6; c.strokeStyle = '#38D9F5'; c.stroke();
  });

  const flag = (ctx, x, y, w, h, t) => {
    ctx.save(); ctx.translate(x, y);
    const n = 96, sw = w / n;
    for (let i = 0; i < n; i++) {
      const xx = i * sw, k = i / n, yo = Math.sin(xx * 0.022 - t * 7) * 14 * (0.25 + k), sl = Math.cos(xx * 0.022 - t * 7);
      ctx.save(); ctx.translate(0, yo); ctx.beginPath(); ctx.rect(xx, 0, sw + 1.2, h); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1B4FD6'; ctx.fillRect(0, h * 0.11, w, h * 0.13); ctx.fillRect(0, h * 0.76, w, h * 0.13);
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.strokeStyle = '#1B4FD6'; ctx.lineWidth = h * 0.045; ctx.lineJoin = 'miter';
      for (const up of [1, -1]) { ctx.beginPath(); for (let q = 0; q < 3; q++) { const a = -Math.PI / 2 * up + q * TAU / 3; ctx[q ? 'lineTo' : 'moveTo'](Math.cos(a) * h * 0.2, Math.sin(a) * h * 0.2); } ctx.closePath(); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = sl > 0 ? `rgba(255,255,255,${0.16 * sl})` : `rgba(10,20,80,${-0.22 * sl})`; ctx.fillRect(xx, 0, sw + 1.2, h);
      ctx.restore();
    }
    // outline top/bottom
    ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.lineJoin = 'round';
    for (const yy of [0, h]) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const xx = i * sw, yo = Math.sin(xx * 0.022 - t * 7) * 14 * (0.25 + i / n); ctx[i ? 'lineTo' : 'moveTo'](xx, yy + yo); } ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h); ctx.stroke();
    { const yo = Math.sin(w * 0.022 - t * 7) * 14 * 1.25; ctx.beginPath(); ctx.moveTo(w, yo); ctx.lineTo(w, h + yo); ctx.stroke(); }
    ctx.restore();
  };

  const anchor = (ctx, x, y, t) => {
    const bob = Math.sin(t * 9) * 3, talk = Math.abs(Math.sin(t * 13)) * 0.6 + 0.25 * Math.abs(Math.sin(t * 7.3));
    const skin = '#F5B98F';
    ctx.save(); ctx.translate(x, y + bob);
    A.rrect(ctx, -28, 50, 56, 70, 14); A.fillStroke(ctx, '#E5A07A', 5);
    A.blob(ctx, [[-170, 340], [-160, 180], [-105, 112], [0, 100], [105, 112], [160, 180], [170, 340]]); A.fillStroke(ctx, '#1FB6A6', 6);
    A.path(ctx, [[-46, 104], [46, 104], [0, 215]]); A.fillStroke(ctx, '#fff', 4);
    A.path(ctx, [[-46, 104], [-100, 122], [-34, 262], [-4, 214]]); A.fillStroke(ctx, '#158F83', 4);
    A.path(ctx, [[46, 104], [100, 122], [34, 262], [4, 214]]); A.fillStroke(ctx, '#158F83', 4);
    A.path(ctx, [[-10, 118], [10, 118], [16, 150], [0, 240], [-16, 150]]); A.fillStroke(ctx, '#FFC24A', 4);
    // waving arm
    const a = Math.sin(t * 10) * 0.5, sh = [138, 150], el = [238, 262], hd = [el[0] + Math.sin(a) * 150 + 20, el[1] - Math.cos(a) * 150];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, col] of [[62, OL], [48, '#1FB6A6']]) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(el[0], el[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(hd[0], hd[1] - 14, 36, 0, TAU); A.fillStroke(ctx, skin, 5);
    for (let k = 0; k < 4; k++) { const fa = -Math.PI / 2 + (k - 1.5) * 0.42 + a; ctx.lineWidth = 15; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(hd[0], hd[1] - 14); ctx.lineTo(hd[0] + Math.cos(fa) * 50, hd[1] - 14 + Math.sin(fa) * 50); ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = skin; ctx.stroke(); }
    // head
    A.ellipse(ctx, -84, 6, 14, 20); A.fillStroke(ctx, skin, 5); A.ellipse(ctx, 84, 6, 14, 20); A.fillStroke(ctx, skin, 5);
    A.ellipse(ctx, 0, 0, 82, 90); A.fillStroke(ctx, skin, 6);
    A.blob(ctx, [[-92, 10], [-98, -55], [-52, -114], [20, -124], [82, -96], [98, -40], [92, 10], [72, -32], [20, -64], [-30, -58], [-72, -22]]); A.fillStroke(ctx, '#3B2417', 6);
    // face
    const bl = A.blink(t, 3);
    for (const sx of [-30, 30]) { A.ellipse(ctx, sx, -4, 9, Math.max(1.5, 13 * (1 - bl))); ctx.fillStyle = '#2a1a12'; ctx.fill(); if (bl < 0.3) { ctx.beginPath(); ctx.arc(sx + 3, -8, 3.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
      ctx.lineWidth = 6; ctx.strokeStyle = '#3B2417'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx - 15, -30 - talk * 4); ctx.quadraticCurveTo(sx, -40 - talk * 6, sx + 15, -30 - talk * 4); ctx.stroke(); }
    for (const sx of [-52, 52]) { ctx.beginPath(); ctx.arc(sx, 24, 14, 0, TAU); ctx.fillStyle = 'rgba(255,79,154,0.35)'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(-32, 30); ctx.quadraticCurveTo(0, 42 + 40 * talk, 32, 30); ctx.quadraticCurveTo(0, 36, -32, 30); ctx.closePath();
    ctx.fillStyle = '#7A1E2E'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-32, 28, 64, 9); ctx.fillStyle = '#FF7B8A'; ctx.fillRect(-20, 52, 40, 30); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    // headset
    ctx.lineWidth = 9; ctx.strokeStyle = '#231A45'; ctx.beginPath(); ctx.arc(0, -8, 98, -Math.PI * 0.96, -Math.PI * 0.04); ctx.stroke();
    A.rrect(ctx, -110, -14, 26, 46, 10); A.fillStroke(ctx, '#FF4F9A', 4);
    ctx.lineWidth = 6; ctx.strokeStyle = '#231A45'; ctx.beginPath(); ctx.moveTo(-100, 30); ctx.quadraticCurveTo(-92, 74, -40, 62); ctx.stroke();
    ctx.beginPath(); ctx.arc(-38, 62, 10, 0, TAU); A.fillStroke(ctx, '#FF4F9A', 4);
    ctx.restore();
  };

  const liveWorld = (ctx, t) => {
    const lt = t - 5, punch = 1 + 0.3 * (1 - eo(inv(5, 5.42, t)));
    const z = 1.06 * punch + 0.06 * inv(5, 6.8, t);
    ctx.save();
    cam(ctx, z, Math.sin(lt * 1.7) * 0.012 + 0.03 * (1 - eo(inv(5, 5.5, t))), Math.sin(lt * 1.3) * 18 - 14 * inv(5, 6.8, t), Math.cos(lt * 1.1) * 10 + 8 * (1 - inv(5, 6.8, t)));
    ctx.drawImage(liveBG(), 0, 0);
    // window animated bits
    ctx.save(); A.rrect(ctx, 120, 100, 1680, 600, 34); ctx.clip();
    A.glow(ctx, 1560, 300, 340, '#FFF1B8', 0.85);
    ctx.fillStyle = '#FFE9A0'; ctx.beginPath(); ctx.arc(1560, 300, 44, 0, TAU); ctx.fill();
    for (let i = 0; i < 5; i++) { const cx = 100 + ((i * 420 + t * 26) % 2100) - 100 + 120, cy = 190 + (i % 3) * 62; ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (const [dx, dy, r] of [[0, 0, 34], [38, -12, 42], [82, 2, 32], [40, 10, 40]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, TAU); ctx.fill(); } }
    // birds
    for (let i = 0; i < 4; i++) { const bx = 300 + ((i * 380 + t * 90) % 1500), by = 210 + Math.sin(t * 3 + i) * 12 + i * 30, fl = Math.sin(t * 14 + i) * 8; ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 16, by - fl); ctx.quadraticCurveTo(bx - 6, by - 10 + fl, bx, by); ctx.quadraticCurveTo(bx + 6, by - 10 + fl, bx + 16, by - fl); ctx.stroke(); }
    // waves
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineCap = 'round';
    for (let r = 0; r < 5; r++) { const yy = 650 + r * 12; ctx.beginPath(); for (let xx = 100; xx <= 1820; xx += 24) { const y2 = yy + Math.sin(xx * 0.03 + t * (r % 2 ? 3 : -3) + r) * 4; ctx[xx === 100 ? 'moveTo' : 'lineTo'](xx, y2); } ctx.stroke(); }
    ctx.restore();
    // studio lights rig
    ctx.fillStyle = '#0B0830'; ctx.fillRect(0, 0, W, 62);
    for (let i = 0; i < 6; i++) { const lx = 200 + i * 300, on = 0.75 + 0.25 * Math.sin(t * 6 + i * 2); A.rrect(ctx, lx - 44, 20, 88, 34, 10); A.fillStroke(ctx, '#3A2E8A', 4); A.glow(ctx, lx, 60, 180, '#8FE9FF', 0.35 * on); A.glow(ctx, lx, 40, 60, '#fff', 0.7 * on); }

    // flag on pole (left)
    const fp = pop(t, 5.12, 0.4);
    ctx.save(); ctx.translate(200, 500); ctx.scale(fp, fp); ctx.translate(-200, -500);
    ctx.lineCap = 'round'; ctx.lineWidth = 20; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(196, 205); ctx.lineTo(196, 700); ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#FFC24A'; ctx.stroke();
    ctx.beginPath(); ctx.arc(196, 200, 17, 0, TAU); A.fillStroke(ctx, '#FFE08A', 5);
    flag(ctx, 200, 236, 430, 300, t);
    ctx.restore();

    // anchor + desk
    const ap = pop(t, 5.05, 0.45);
    ctx.save(); ctx.translate(1330, 700); ctx.scale(ap, ap); ctx.translate(-1330, -700); anchor(ctx, 1330, 430, t); ctx.restore();
    A.rrect(ctx, 760, 686, 1250, 130, 26); ctx.fillStyle = A.linear(ctx, 0, 686, 0, 816, [[0, '#2A3AAE'], [1, '#121B62']]); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#38D9F5'; ctx.fillRect(776, 698, 1218, 10); A.glow(ctx, 1380, 700, 420, '#38D9F5', 0.28);
    // mug
    A.rrect(ctx, 1520, 640, 56, 56, 10); A.fillStroke(ctx, '#FF4F9A', 5);
    ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.beginPath(); ctx.arc(1582, 668, 14, -1.3, 1.3); ctx.stroke();
    // papers
    ctx.save(); ctx.translate(1180, 690); ctx.rotate(-0.08); A.rrect(ctx, -70, -22, 140, 24, 5); A.fillStroke(ctx, '#fff', 4); ctx.restore();

    // headline
    const hp = pop(t, 5.10, 0.34);
    ctx.save(); ctx.translate(960, 172); ctx.rotate(-0.035); ctx.scale(hp, hp);
    A.text(ctx, 'שידורים חיים', 4, 8, { font: '900 124px Rubik', fill: OL, dir: 'rtl' });
    A.text(ctx, 'שידורים חיים', 0, 0, { font: '900 124px Rubik', fill: '#FFC24A', stroke: OL, lw: 22, dir: 'rtl' });
    A.text(ctx, 'שידורים חיים', 0, 0, { font: '900 124px Rubik', fill: A.linear(ctx, 0, -60, 0, 60, [[0, '#FFF3B0'], [0.5, '#FFC24A'], [1, '#FF9A2E']]), dir: 'rtl' });
    ctx.restore();
    const lp = pop(t, 5.02, 0.35);
    D.LIVE(ctx, 1590, 180, 2.1 * lp, t);
    A.glow(ctx, 1590, 180, 220 * lp, '#FF4A3D', 0.35);

    // ticker
    const tk = A.key(t, [[5.3, 130], [5.55, 0, 'outBack']]);
    ctx.save(); ctx.translate(0, tk);
    ctx.fillStyle = '#0B1250'; ctx.fillRect(0, 792, W, 86); ctx.fillStyle = '#38D9F5'; ctx.fillRect(0, 792, W, 6); ctx.fillStyle = OL; ctx.fillRect(0, 878, W, 6);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 798, 1640, 80); ctx.clip();
    ctx.font = '800 50px Rubik'; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const unit = 'חדשות · ספורט · תרבות · שידור חי · ', uw = ctx.measureText(unit).width;
    for (let k = -1; k < 4; k++) { const rx = 1620 + ((t * 260) % uw) * -1 + k * uw + uw; ctx.fillStyle = '#fff'; ctx.fillText(unit, rx, 840); }
    ctx.restore();
    A.rrect(ctx, 1650, 792, 300, 86, 0); ctx.fillStyle = '#FF4A3D'; ctx.fill();
    ctx.fillStyle = OL; ctx.fillRect(1644, 792, 8, 92);
    A.text(ctx, 'מבזק', 1790, 840, { font: '900 54px Rubik', fill: '#fff', dir: 'rtl' });
    ctx.restore();

    // viewfinder
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'butt';
    for (const [cx, cy, dx, dy] of [[50, 40, 1, 1], [W - 50, 40, -1, 1], [50, H - 190, 1, -1], [W - 50, H - 190, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + dy * 60); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * 60, cy); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(96, 96, 12, 0, TAU); ctx.fillStyle = `rgba(255,74,61,${0.55 + 0.45 * Math.sin(t * 8)})`; ctx.fill();
    A.text(ctx, 'REC', 132, 98, { font: '700 26px Rubik', fill: '#fff', align: 'left' });

    // confetti + pop stars
    const R = A.rng(5);
    for (let i = 0; i < 34; i++) {
      const ang = -Math.PI / 2 + (R() - 0.5) * 2.6, v = 500 + R() * 800, t0 = 5.14 + R() * 0.12, dt = t - t0, col = ['#FFC24A', '#38D9F5', '#FF4F9A', '#fff', '#3DDC84'][i % 5];
      if (dt < 0 || dt > 1.5) continue;
      const px = 1590 + Math.cos(ang) * v * dt * 0.75, py = 180 + Math.sin(ang) * v * dt + 1400 * dt * dt * 0.5;
      ctx.save(); ctx.translate(px, py); ctx.rotate(dt * (4 + i % 5)); ctx.globalAlpha = 1 - inv(1.1, 1.5, dt); ctx.fillStyle = col; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
    }
    ctx.restore();
  };

  // =====================================================================  NETFLIX WORLD
  const curtain = () => A.layer('s2a_curtain', 960, H, (c, w, h) => {
    for (let x = 0; x < w; x += 4) {
      const s = 0.5 + 0.5 * Math.sin(x / w * TAU * 5.5 + 0.6 * Math.sin(x / 90));
      c.fillStyle = A.mixc('#4A0610', '#E52535', Math.pow(s, 1.3) * 0.95); c.fillRect(x, 0, 4.5, h);
    }
    c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, 'rgba(0,0,0,0.5)'], [0.25, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); c.fillRect(0, 0, w, h);
    c.fillStyle = A.linear(c, 0, 0, w, 0, [[0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); c.fillRect(0, 0, w, h);
  });
  const nfBG = () => A.layer('s2a_nf_bg', W, H, (c) => {
    c.fillStyle = A.radial(c, 960, 460, 0, 1100, [[0, '#4A0C1A'], [0.55, '#1F0710'], [1, '#08020A']]); c.fillRect(0, 0, W, H);
    // floor
    c.fillStyle = A.linear(c, 0, 800, 0, H, [[0, '#3B0B14'], [1, '#12040A']]); c.fillRect(0, 800, W, H - 800);
    c.strokeStyle = 'rgba(255,160,120,0.12)'; c.lineWidth = 3;
    for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(960 + i * 60, 800); c.lineTo(960 + i * 240, H); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 796, W, 8);
  });

  const posterArt = (ctx, kind, t) => {
    const w = 250, h = 366;
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, 20); ctx.clip();
    if (kind === 0) { // detective
      ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#0B2A4A'], [1, '#1D6E86']]); ctx.fillRect(-w / 2, -h / 2, w, h);
      A.glow(ctx, 0, -70, 150, '#FFF3C4', 0.4); ctx.beginPath(); ctx.arc(0, -70, 62, 0, TAU); ctx.fillStyle = '#FFF3C4'; ctx.fill();
      ctx.fillStyle = '#0A1226'; for (const [bx, bw, bh] of [[-125, 60, 150], [-70, 44, 110], [70, 50, 130], [110, 60, 170]]) ctx.fillRect(bx, 70 - bh + 50, bw, bh + 80);
      ctx.fillStyle = 'rgba(255,220,120,0.9)'; for (let i = 0; i < 8; i++) ctx.fillRect(-118 + (i % 2) * 20, -30 + Math.floor(i / 2) * 26 + 40, 8, 10);
      // man
      ctx.fillStyle = '#05080F'; A.blob(ctx, [[-70, 190], [-58, 60], [-30, 20], [30, 20], [58, 60], [70, 190]]); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -4, 27, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -18, 62, 13, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-32, -18); ctx.quadraticCurveTo(-30, -60, 0, -60); ctx.quadraticCurveTo(30, -60, 32, -18); ctx.fill();
      ctx.fillStyle = '#C0392B'; ctx.fillRect(-32, -26, 64, 8);
      ctx.beginPath(); ctx.arc(60, 96, 20, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = '#FFE08A'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(74, 110); ctx.lineTo(96, 134); ctx.stroke();
    } else if (kind === 1) { // romance
      ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#FF4F9A'], [0.6, '#FF9A6B'], [1, '#FFD27A']]); ctx.fillRect(-w / 2, -h / 2, w, h);
      A.glow(ctx, 0, 20, 170, '#FFF', 0.35);
      const b = Math.sin(t * 5) * 0.06;
      heart(ctx, 0, -10 + b * 40, 70 + b * 60, '#FF2E63', 5);
      ctx.fillStyle = '#3A0F3A'; A.blob(ctx, [[-96, 190], [-88, 110], [-62, 76], [-30, 90], [-24, 190]]); ctx.fill(); ctx.beginPath(); ctx.arc(-58, 52, 26, 0, TAU); ctx.fill();
      A.blob(ctx, [[96, 190], [88, 110], [62, 76], [30, 90], [24, 190]]); ctx.fill(); ctx.beginPath(); ctx.arc(58, 52, 26, 0, TAU); ctx.fill();
      for (let i = 0; i < 5; i++) heart(ctx, -90 + i * 46, -140 + Math.sin(t * 3 + i) * 10 + (i % 2) * 24, 12 + (i % 3) * 4, 'rgba(255,255,255,0.8)');
    } else if (kind === 2) { // sci-fi
      ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#0A0A2E'], [1, '#4B1FA8']]); ctx.fillRect(-w / 2, -h / 2, w, h);
      const R = A.rng(3); for (let i = 0; i < 30; i++) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); ctx.fillRect(-120 + R() * 240, -170 + R() * 340, 3, 3); } ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(28, -20, 72, 0, TAU); ctx.fillStyle = A.linear(ctx, -40, -90, 90, 50, [[0, '#FF9A6B'], [1, '#B03A9A']]); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(28, -20, 130, 24, -0.35, 0, TAU); ctx.lineWidth = 12; ctx.strokeStyle = '#38D9F5'; ctx.stroke();
      ctx.save(); ctx.translate(-60 + Math.sin(t * 4) * 6, 100); ctx.rotate(-0.5); A.blob(ctx, [[0, -60], [20, -20], [20, 40], [-20, 40], [-20, -20]]); A.fillStroke(ctx, '#EEF3FF', 5); ctx.beginPath(); ctx.arc(0, -8, 9, 0, TAU); A.fillStroke(ctx, '#38D9F5', 3); A.path(ctx, [[-20, 24], [-38, 52], [-20, 40]]); A.fillStroke(ctx, '#FF4A3D', 4); A.path(ctx, [[20, 24], [38, 52], [20, 40]]); A.fillStroke(ctx, '#FF4A3D', 4); A.path(ctx, [[-10, 42], [0, 84 + Math.sin(t * 30) * 8], [10, 42]]); ctx.fillStyle = '#FFC24A'; ctx.fill(); ctx.restore();
    } else { // comedy
      ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#FFD23F'], [1, '#FF8A3D']]); ctx.fillRect(-w / 2, -h / 2, w, h);
      D.starburst(ctx, 0, 0, 110, 210, 14, t * 0.4, 'rgba(255,255,255,0.28)');
      ctx.beginPath(); ctx.arc(0, -10, 92, 0, TAU); A.fillStroke(ctx, '#FFE24D', 7);
      for (const sx of [-34, 34]) { ctx.beginPath(); ctx.arc(sx, -36, 11, 0, TAU); ctx.fillStyle = OL; ctx.fill(); ctx.beginPath(); ctx.arc(sx + (sx > 0 ? 30 : -30), -6 + (Math.sin(t * 8) * 4), 9, 0, TAU); ctx.fillStyle = '#38D9F5'; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-56, 6); ctx.quadraticCurveTo(0, 130, 56, 6); ctx.closePath(); ctx.fillStyle = '#7A1E2E'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-60, 6, 120, 20); ctx.fillStyle = '#FF7B8A'; ctx.beginPath(); ctx.arc(0, 66, 30, 0, TAU); ctx.fill(); ctx.restore();
      const R = A.rng(9); for (let i = 0; i < 12; i++) { ctx.save(); ctx.translate(-115 + R() * 230, -170 + R() * 60 + ((t * 40 + i * 30) % 60)); ctx.rotate(R() * 6); ctx.fillStyle = ['#FF4F9A', '#38D9F5', '#fff', '#3DDC84'][i % 4]; ctx.fillRect(-6, -3, 12, 6); ctx.restore(); }
    }
    ctx.restore();
  };
  const POSTERS = [['מתח', 0, '#0B2A4A'], ['רומנטיקה', 1, '#B0134F'], ['מדע בדיוני', 2, '#3A1786'], ['קומדיה', 3, '#C05A00']];
  const posterCard = (ctx, i, t, front) => {
    const w = 250, h = 366;
    if (front) {
      posterArt(ctx, POSTERS[i][1], t);
      ctx.save(); A.rrect(ctx, -w / 2, h / 2 - 66, w, 66, 0); ctx.clip(); ctx.fillStyle = 'rgba(8,2,10,0.85)'; ctx.fillRect(-w / 2, h / 2 - 66, w, 66); ctx.restore();
      A.text(ctx, POSTERS[i][0], 0, h / 2 - 32, { font: '800 38px Rubik', fill: '#fff', dir: 'rtl' });
    } else {
      A.rrect(ctx, -w / 2, -h / 2, w, h, 20); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, '#B3121F'], [1, '#5E0812']]); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 8; for (let k = -6; k < 8; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + k * 40, -h / 2); ctx.lineTo(-w / 2 + k * 40 + 200, h / 2); ctx.stroke(); } ctx.restore();
      spark(ctx, 0, 0, 60, 0.3, 'rgba(255,255,255,0.5)');
    }
    A.rrect(ctx, -w / 2, -h / 2, w, h, 20); ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.stroke();
  };

  const kernel = (ctx, x, y, s, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (const [dx, dy, r] of [[-9, 4, 12], [9, 5, 12], [0, -7, 13], [0, 8, 9]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fillStyle = '#FFF4CC'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(26,19,48,0.8)'; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(1 * s, -1 * s, 5 * s, 0, TAU); ctx.fillStyle = '#FFC24A'; ctx.fill();
    ctx.restore();
  };
  const bucket = (ctx, x, y, s, t, t0) => {
    const b = pop(t, 6.82, 0.35) * (1 + 0.14 * Math.exp(-(t - t0) * 12) * (t > t0 ? 1 : 0)) ;
    ctx.save(); ctx.translate(x, y); ctx.scale(b * s, b * (s + (t > t0 ? 0.12 * Math.exp(-(t - t0) * 10) * Math.sin((t - t0) * 40) : 0)));
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 46, -108 + Math.sin(a) * 20, 26, 0, TAU); ctx.fillStyle = '#FFF4CC'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OL; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-64, -88); ctx.lineTo(64, -88); ctx.lineTo(48, 84); ctx.lineTo(-48, 84); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.save(); ctx.clip();
    ctx.fillStyle = '#E52535'; for (let k = -3; k < 4; k++) if (k % 2 === 0) ctx.fillRect(k * 20 - 10, -100, 20, 200); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(-64, -88); ctx.lineTo(64, -88); ctx.lineTo(48, 84); ctx.lineTo(-48, 84); ctx.closePath(); ctx.stroke();
    ctx.restore();
  };

  const netflixWorld = (ctx, t) => {
    const lt = t - 6.7, z = 1.05 + 0.05 * inv(6.6, 8.1, t);
    const sh = t > 6.78 ? Math.exp(-(t - 6.78) * 9) * 1 : 0;
    ctx.save();
    cam(ctx, z, Math.sin(lt * 2) * 0.008, Math.sin(lt * 2.4) * 16 + A.noise1(t * 40) * 12 * sh, Math.cos(lt * 1.6) * 8 + A.noise1(t * 40 + 9) * 12 * sh);
    ctx.drawImage(nfBG(), 0, 0);
    // beams
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ox = 500 + i * 460, sw = Math.sin(t * 2.2 + i * 2) * 140, tx = ox + sw * 1.2 + (i - 1) * 90;
      const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(255,230,200,0.5)'); g.addColorStop(1, 'rgba(255,190,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox - 16, -10); ctx.lineTo(ox + 16, -10); ctx.lineTo(tx + 220, 900); ctx.lineTo(tx - 220, 900); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    A.glow(ctx, 960, 880, 700, '#FF6A4A', 0.28);
    A.glow(ctx, 960, 330, 600, '#FF2A38', 0.32 + 0.1 * Math.sin(t * 9));

    // wordmark
    if (t >= 6.76) {
      const sc = A.key(t, [[6.76, 2.8], [6.86, 0.92, 'in'], [6.95, 1.08, 'out'], [7.06, 1, 'inOut']]);
      const al = A.clamp((t - 6.76) / 0.05);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(960, 300 + Math.sin(lt * 3) * 5); ctx.scale(sc, sc);
      ctx.font = '900 250px Rubik'; ctx.letterSpacing = '10px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      for (let i = 20; i > 0; i -= 2) { ctx.fillStyle = i > 14 ? '#2A0308' : '#6B060F'; ctx.fillText('NETFLIX', 0, i); }
      ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.strokeText('NETFLIX', 0, 0);
      ctx.fillStyle = A.linear(ctx, 0, -110, 0, 110, [[0, '#FF6B5A'], [0.45, '#F0141F'], [1, '#A30812']]); ctx.fillText('NETFLIX', 0, 0);
      // gloss sweep
      const sw = A.key(t, [[7.25, -700], [7.6, 700, 'inOut']]);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
      ctx.letterSpacing = '0px'; ctx.restore();
      // shockwave
      if (t < 7.2) { const q = inv(6.86, 7.2, t); ctx.save(); ctx.globalAlpha = 1 - q; ctx.lineWidth = 26 * (1 - q) + 2; ctx.strokeStyle = '#FFD3C8'; ctx.beginPath(); ctx.ellipse(960, 300, 300 + q * 900, 90 + q * 300, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // posters
    for (let i = 0; i < 4; i++) {
      const t0 = 6.9 + i * 0.09, q = inv(t0, t0 + 0.3, t); if (t < t0) continue;
      const ang = Math.PI * (1 - eo(q)), sx = Math.cos(ang);
      const bx = 480 + i * 320, by = 640 - (i === 1 || i === 2 ? 14 : 0);
      const rise = (1 - eo(q)) * 300, hop = t > 7.55 + i * 0.07 ? 46 * Math.exp(-(t - 7.55 - i * 0.07) * 9) * Math.abs(Math.sin((t - 7.55 - i * 0.07) * 12)) : 0;
      ctx.save(); ctx.translate(bx, by + rise - hop + Math.sin(t * 3 + i * 1.7) * 7); ctx.rotate((i - 1.5) * 0.07 + Math.sin(t * 2 + i) * 0.02);
      const s2 = 1.02 + (i === 1 || i === 2 ? 0.05 : 0); ctx.scale(Math.abs(sx) * s2, s2);
      // shadow
      ctx.save(); ctx.globalAlpha = 0.35; A.rrect(ctx, -110, -150, 250, 366, 20); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
      posterCard(ctx, i, t, sx > 0);
      ctx.restore();
      if (q > 0.85 && q < 1) A.glow(ctx, bx, by, 300, '#FFB8A0', 0.4);
    }
    // curtains
    const op = A.ease.inOut(inv(6.6, 6.95, t)), cw = 960 - 690 * op, sway = Math.sin(t * 5) * 3 * op;
    ctx.drawImage(curtain(), 0, 0, 960, H, -20, 0, cw + 20 + sway, H);
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(curtain(), 0, 0, 960, H, -20, 0, cw + 20 - sway, H); ctx.restore();
    ctx.fillStyle = OL; ctx.fillRect(cw - 4 + sway, 0, 8, H); ctx.fillRect(W - cw - 4 - sway, 0, 8, H);
    // valance
    ctx.fillStyle = A.linear(ctx, 0, 0, 0, 110, [[0, '#7A0A17'], [1, '#D01A2B']]); ctx.fillRect(-20, -10, W + 40, 90);
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(i * 168 + 84, 80, 84, 0, Math.PI); ctx.fillStyle = i % 2 ? '#C41626' : '#E22B3C'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.stroke(); }
    ctx.fillStyle = '#FFC24A'; ctx.fillRect(-20, 70, W + 40, 10);
    // popcorn (in front of curtains)
    const R = A.rng(21);
    for (let b = 0; b < 2; b++) {
      const t0 = b ? 7.05 : 6.98, sx = b ? 1730 : 190;
      for (let i = 0; i < 22; i++) {
        const dir = b ? -1 : 1, ang = -Math.PI * (0.18 + R() * 0.5), v = 700 + R() * 900, dt = t - t0; const ii = i;
        const rr = R(); if (dt < 0 || dt > 1.6) continue;
        const px = sx + dir * Math.cos(ang) * v * dt * 0.8 * (b ? -1 : 1) * (b ? -1 : 1), py = 700 + Math.sin(ang) * v * dt + 1900 * dt * dt * 0.5;
        ctx.globalAlpha = 1 - inv(1.2, 1.6, dt); kernel(ctx, px, py, 0.9 + rr * 0.5, dt * (5 + ii % 6) * (ii % 2 ? 1 : -1)); ctx.globalAlpha = 1;
      }
    }
    bucket(ctx, 170, 790, 0.95, t, 6.98); bucket(ctx, 1750, 790, 0.95, t, 7.05);
    // twinkles
    for (let i = 0; i < 14; i++) { const q = (t * 0.7 + A.hash(i * 3.1)) % 1; spark(ctx, 300 + A.hash(i * 7.7) * 1320, 170 + A.hash(i * 5.3) * 620, 22 * Math.sin(q * Math.PI), q * 3, 'rgba(255,224,200,0.9)'); }
    ctx.restore();
  };

  // =====================================================================  DISNEY WORLD
  const dnBG = () => A.layer('s2a_dn_bg', W, H, (c) => {
    c.fillStyle = A.linear(c, 0, 0, 0, H, [[0, '#050A3A'], [0.45, '#1B2F9E'], [0.8, '#6A3FB5'], [1, '#B25CC0']]); c.fillRect(0, 0, W, H);
    const R = A.rng(33);
    for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * 720, r = 0.8 + R() * 2.2; c.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.65})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    // moon
    const g = A.radial(c, 1650, 250, 0, 260, [[0, 'rgba(255,246,216,0.55)'], [1, 'rgba(255,246,216,0)']]); c.fillStyle = g; c.fillRect(1390, 0, 520, 520);
    c.beginPath(); c.arc(1650, 250, 62, 0, TAU); c.fillStyle = '#FFF6D8'; c.fill();
    c.beginPath(); c.arc(1626, 236, 14, 0, TAU); c.fillStyle = 'rgba(210,190,150,0.5)'; c.fill();
    c.beginPath(); c.arc(1676, 276, 9, 0, TAU); c.fill();
    // far hills
    c.fillStyle = '#2B2280'; c.beginPath(); c.moveTo(0, 800); c.bezierCurveTo(300, 690, 500, 780, 800, 760); c.bezierCurveTo(1200, 740, 1500, 690, 1920, 780); c.lineTo(1920, H); c.lineTo(0, H); c.fill();
    // castle
    const sil = '#0A0E3A';
    c.fillStyle = sil; c.strokeStyle = '#0A0E3A';
    const tower = (cx, w, top, rh, flag) => { c.fillStyle = sil; c.fillRect(cx - w / 2, top, w, 880 - top); c.beginPath(); c.moveTo(cx - w / 2 - 12, top); c.lineTo(cx, top - rh); c.lineTo(cx + w / 2 + 12, top); c.closePath(); c.fill();
      if (flag) { c.fillRect(cx - 2, top - rh - 44, 4, 46); c.beginPath(); c.moveTo(cx + 2, top - rh - 44); c.lineTo(cx + 40, top - rh - 32); c.lineTo(cx + 2, top - rh - 20); c.closePath(); c.fillStyle = '#FF4F9A'; c.fill(); c.fillStyle = sil; } };
    c.fillRect(640, 730, 640, 150);
    for (let x = 640; x < 1280; x += 40) c.fillRect(x, 710, 24, 24);
    tower(960, 132, 600, 166, true); tower(820, 84, 660, 120, true); tower(1100, 84, 660, 120, true); tower(720, 70, 710, 96, false); tower(1200, 70, 710, 96, false);
    tower(650, 56, 750, 70, false); tower(1270, 56, 750, 70, false);
    c.beginPath(); c.moveTo(900, 880); c.lineTo(900, 800); c.arc(960, 800, 60, Math.PI, 0); c.lineTo(1020, 880); c.fillStyle = '#F2B84B'; c.fill();
    c.fillStyle = '#FFD778';
    for (const [wx, wy] of [[960, 680], [960, 740], [820, 720], [1100, 720], [720, 770], [1200, 770], [900, 760], [1020, 760]]) { c.beginPath(); c.ellipse(wx, wy, 8, 14, 0, 0, TAU); c.fill(); }
    // foreground hills
    c.fillStyle = '#100B52'; c.beginPath(); c.moveTo(0, 860); c.bezierCurveTo(400, 800, 700, 900, 960, 880); c.bezierCurveTo(1300, 860, 1600, 800, 1920, 870); c.lineTo(1920, H); c.lineTo(0, H); c.fill();
    c.fillStyle = 'rgba(180,120,255,0.18)'; c.fillRect(0, 880, W, H - 880);
  });
  const ARC = { p0: [-40, 760], c: [960, -60], p2: [1960, 700] };
  const arcPt = (u) => { const a = 1 - u; return [a * a * ARC.p0[0] + 2 * a * u * ARC.c[0] + u * u * ARC.p2[0], a * a * ARC.p0[1] + 2 * a * u * ARC.c[1] + u * u * ARC.p2[1]]; };

  const disneyWorld = (ctx, t) => {
    const lt = t - 8.0, z = 1.05 + 0.05 * inv(7.9, 9.1, t);
    ctx.save();
    cam(ctx, z, Math.sin(lt * 1.5) * 0.008, Math.sin(lt * 1.9) * 14, Math.cos(lt * 1.3) * 8);
    ctx.drawImage(dnBG(), 0, 0);
    A.glow(ctx, 960, 640, 560, '#FFB8FF', 0.22);
    // twinkling stars
    for (let i = 0; i < 46; i++) { const q = (t * 0.9 + A.hash(i * 2.3)) % 1, r = 18 * Math.sin(q * Math.PI); spark(ctx, A.hash(i * 9.1) * W, A.hash(i * 4.7) * 640, r, q * 1.2, i % 4 ? '#fff' : '#FFE08A'); }
    // arc of sparkles + shooting star
    const p = eo(inv(8.04, 8.78, t)), cols = ['#FFE08A', '#fff', '#38D9F5', '#FF9AD0'];
    for (let k = 0; k <= 46; k++) {
      const u = k / 46; if (u > p) break;
      const [x, y] = arcPt(u), age = (p - u) * 0.74 + 0, tw = Math.sin(t * 9 + k * 1.7) * 0.5 + 0.5;
      const life = A.clamp(1 - Math.max(0, t - 8.0 - u * 0.7 - 0.3) / 1.5);
      if (life <= 0) continue;
      const sz = (14 + 12 * A.hash(k * 3.3)) * (0.55 + 0.45 * tw) * life * (u > p - 0.04 ? 1.3 : 1);
      A.glow(ctx, x, y, sz * 3, cols[k % 4], 0.35 * life); spark(ctx, x, y, sz, k * 0.5, cols[k % 4]);
      // falling glitter
      for (let m = 0; m < 2; m++) { const fa = (t - 8.0 - u * 0.7) * 0.9 + m * 0.5; if (fa > 0 && fa < 1.4) { const fx = x + (A.hash(k * 5 + m) - 0.5) * 100, fy = y + 60 * fa + fa * fa * 90; spark(ctx, fx, fy, 8 * (1 - fa / 1.4), fa * 4, cols[(k + m) % 4]); } }
    }
    if (p > 0 && p < 1) { // comet
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 24; k++) { const u0 = Math.max(0, p - k * 0.008), [x, y] = arcPt(u0); const f = 1 - k / 24; ctx.beginPath(); ctx.arc(x, y, 30 * f * f + 3, 0, TAU); ctx.fillStyle = `rgba(255,${200 + 40 * f},${150 + 90 * f},${0.45 * f})`; ctx.fill(); }
      ctx.restore(); const [hx, hy] = arcPt(p); A.glow(ctx, hx, hy, 160, '#FFF6D8', 0.9); spark(ctx, hx, hy, 64, t * 4, '#fff');
    }
    // wordmark
    const wp = pop(t, 8.06, 0.4);
    if (wp > 0) {
      ctx.save(); ctx.translate(960, 190); ctx.scale(wp, wp); ctx.rotate(-0.02 * (1 - inv(8.06, 8.5, t)));
      ctx.font = '700 210px Fredoka'; const w1 = ctx.measureText('Disney').width; ctx.font = '700 300px Fredoka'; const w2 = ctx.measureText('+').width, tot = w1 + w2 + 6, x0 = -tot / 2;
      A.glow(ctx, 0, 0, 520, '#7FA8FF', 0.45);
      const put = (s, x, font, fill, lw) => { ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.strokeText(s, x, 0); ctx.fillStyle = fill; ctx.fillText(s, x, 0); };
      ctx.save(); ctx.translate(0, 10); ctx.globalAlpha = 0.5; put('Disney', x0, '700 210px Fredoka', '#000', 26); ctx.restore();
      put('Disney', x0, '700 210px Fredoka', A.linear(ctx, 0, -100, 0, 100, [[0, '#fff'], [1, '#C9D8FF']]), 26);
      put('+', x0 + w1 + 6, '700 300px Fredoka', A.linear(ctx, 0, -110, 0, 110, [[0, '#FFF3B0'], [0.5, '#FFC24A'], [1, '#F08A1E']]), 26);
      ctx.restore();
      for (let i = 0; i < 9; i++) { const q = ((t - 8.1) * 1.4 + A.hash(i * 4.4)) % 1, sx = 960 + (A.hash(i * 6.1) - 0.5) * 900, sy = 190 + (A.hash(i * 2.9) - 0.5) * 200; if (t > 8.1) spark(ctx, sx, sy, 34 * Math.sin(q * Math.PI), q * 2, i % 2 ? '#fff' : '#FFE08A'); }
      if (t < 8.4) { const q = inv(8.06, 8.4, t); ctx.save(); ctx.globalAlpha = 1 - q; ctx.lineWidth = 16 * (1 - q) + 2; ctx.strokeStyle = '#FFF6D8'; ctx.beginPath(); ctx.ellipse(960, 190, 200 + q * 900, 80 + q * 250, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore();
  };

  // =====================================================================  compositing
  const BUF = () => A.layer('s2a_buf', W, H, () => {});
  const worlds = { L: liveWorld, N: netflixWorld, D: disneyWorld };

  const blurDraw = (ctx, buf, len, zoom, rot) => {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    const n = len < 6 ? 1 : 22;
    for (let i = 0; i < n; i++) { ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(buf, n > 1 ? (i / (n - 1) - 0.5) * len : 0, 0); }
    ctx.restore(); ctx.globalAlpha = 1;
  };
  const streaks = (ctx, env, seed, dirSign = 1, cols = ['#fff', '#38D9F5', '#FFC24A']) => {
    if (env <= 0.02) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) {
      const y = A.hash(i * 3.7 + seed) * H, L = (300 + A.hash(i * 1.9 + seed) * 900) * env, th = 2 + A.hash(i * 8.1 + seed) * 7;
      const x = A.hash(i * 5.3 + seed) * (W + 800) - 400;
      const g = ctx.createLinearGradient(x, 0, x + L * dirSign, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, cols[i % 3]);
      ctx.globalAlpha = 0.6 * env; ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + L * dirSign), y, Math.abs(L), th);
    }
    ctx.restore();
  };
  const bufCtx = () => { const b = BUF(), c = b.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); return [b, c]; };

  const whipXY = (t, t0, d) => { const e = (tt) => A.ease.inOut(inv(t0, t0 + d, tt)) * (W + 40); return [e(t), (e(t + 0.008) - e(t - 0.008))]; };

  A.scene({
    name: 's2a', start: 5.0, end: 9.35, // drawn through the 0.3 s tail
    draw(ctx, s) {
      const t = s.t;
      // background safety (opaque at start)
      if (t < 6.52) worlds.L(ctx, t);
      else if (t < 6.80) {
        // flipping tiles: LIVE -> NETFLIX
        ctx.fillStyle = '#12030A'; ctx.fillRect(0, 0, W, H);
        A.glow(ctx, 960, 540, 900, '#FF2A38', 0.25);
        const cols = 10, cw = W / cols;
        for (let i = 0; i < cols; i++) {
          const dl = Math.abs(i - 4.5) * 0.014, q = inv(6.52 + dl, 6.52 + dl + 0.15, t), ang = q * Math.PI, sx = Math.cos(ang), lift = Math.sin(ang) * 70 * (i % 2 ? 1 : -1);
          const cx = i * cw + cw / 2;
          ctx.save(); ctx.translate(cx, 540 + lift); ctx.scale(Math.max(0.02, Math.abs(sx)), 1 + 0.06 * Math.sin(ang)); ctx.translate(-cx, -540);
          ctx.beginPath(); ctx.rect(i * cw, 0, cw + 0.5, H); ctx.clip();
          (sx > 0 ? worlds.L : worlds.N)(ctx, t);
          ctx.fillStyle = `rgba(20,5,10,${0.55 * Math.sin(ang)})`; ctx.fillRect(i * cw, 0, cw, H);
          ctx.restore();
        }
        streaks(ctx, Math.sin(inv(6.52, 6.80, t) * Math.PI) * 0.6, 41, 1, ['#fff', '#FF6A6A', '#FFC24A']);
      } else if (t < 7.86) worlds.N(ctx, t);
      else if (t < 8.06) {
        const [x, v] = whipXY(t, 7.86, 0.2), [b, c] = bufCtx();
        c.save(); c.beginPath(); c.rect(-x, 0, W, H); c.clip(); c.translate(-x, 0); worlds.N(c, t); c.restore();
        c.save(); c.beginPath(); c.rect(W - x + 40, 0, W, H); c.clip(); c.translate(W - x + 40, 0); worlds.D(c, t); c.restore();
        const env = Math.sin(inv(7.86, 8.06, t) * Math.PI);
        blurDraw(ctx, b, Math.abs(v) * 1.3, 1 + 0.05 * env, -0.02 * env);
        streaks(ctx, env, 77, 1);
      } else if (t < 9.05) worlds.D(ctx, t);
      else {
        // TAIL: fast whip-out to the left over 0.3 s
        const q = inv(9.05, 9.35, t), e = (tt) => Math.pow(inv(9.05, 9.35, tt), 2.2) * (W + 300);
        const x = e(t), v = e(t + 0.008) - e(t - 0.008), [b, c] = bufCtx();
        c.save(); c.translate(-x, 0); worlds.D(c, Math.min(t, 9.2)); c.restore();
        blurDraw(ctx, b, Math.abs(v) * 1.4, 1 + 0.06 * q, -0.03 * q);
        streaks(ctx, Math.min(1, q * 2.2), 91, 1);
      }
      // ENTRY: burst out of the gold-white flash
      if (t < 5.3) {
        const q = inv(5.0, 5.28, t), a = 1 - eo(q);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9 * (1 - q); D.starburst(ctx, 960, 540, 200 + q * 700, 700 + q * 1800, 18, q * 0.6, 'rgba(255,240,200,0.5)'); ctx.restore();
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#FFF4D8'; ctx.fillRect(0, 0, W, H); ctx.restore();
        ctx.save(); ctx.globalAlpha = (1 - q) * 0.7; ctx.lineWidth = 40 * (1 - q); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(960, 540, 120 + q * 1500, 0, TAU); ctx.stroke(); ctx.restore();
      }
    },
  });
})();
