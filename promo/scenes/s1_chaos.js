// S1 CHAOS -> THE RIGHT PLACE  (global 0.00-5.00)
// 0-3.0 app-chaos in the living room; 3.05 tiles spiral into the big TV; 3.55 gold burst; push into TV; 5.00 full gold-white.
(() => {
  const S = {}; // helpers namespace (local)
  const TAU = A.TAU, clamp = A.clamp, inv = A.inv;
  const T_FREEZE = 2.0, T_SNAP = 3.05, T_BURST = 3.55, T_WASH = 4.55, T_END = 5.0;
  const GOLD_WHITE = '#FFF4D8';

  // ---------------------------------------------------------------- world layout
  const L = {
    tv: { x: 1400, y: 450, w: 560, h: 316 },          // the big TV (right of centre)
    old: { x: 300, y: 430, w: 430, h: 250 },          // left monitor / old TV on shelf
    lap: { x: 1010, y: 815, w: 330, h: 205 },         // laptop on coffee table
    yoni: { x: 760, y: 700 },                          // sofa centre (feet/seat anchor)
    head: { x: 760, y: 470 },                          // tornado axis
  };
  const TILE_C = [['#E50914', '#7A0710'], ['#1FB6A6', '#0B5F58'], ['#3D7BFF', '#1B3C9C'], ['#FF8A3D', '#B34A0B'], ['#B14CFF', '#5B1FA8'],
                  ['#3DDC84', '#127A44'], ['#FF4F9A', '#9C1F5A'], ['#FFC24A', '#B87A0B'], ['#38D9F5', '#0B7E96'], ['#F4F4F8', '#9A9AB8']];
  const TILE_L = ['TV', 'PLAY', 'LIVE', '+', 'HD', 'Vidly', 'Zapp', 'Cineo', 'Playz', 'Streamo', 'NEW', 'SPORT', 'FILM', 'KIDS', '4K', 'ON'];

  // ---------------------------------------------------------------- fake app UIs (brand-neutral)
  const POST = [['#FF5F6D', '#FFC371'], ['#36D1DC', '#5B86E5'], ['#F7971E', '#FFD200'], ['#B24592', '#F15F79'], ['#11998E', '#38EF7D'], ['#4776E6', '#8E54E9'], ['#EB3349', '#F45C43'], ['#FDC830', '#F37335']];
  function poster(ctx, x, y, w, h, seed, r = 8) {
    const c = POST[Math.floor(A.hash(seed) * POST.length)];
    A.rrect(ctx, x, y, w, h, r); ctx.fillStyle = A.linear(ctx, x, y, x + w * 0.4, y + h, [[0, c[0]], [1, c[1]]]); ctx.fill();
    const k = Math.floor(A.hash(seed + 5) * 3), cx = x + w / 2, cy = y + h * 0.42, s = w * 0.22;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    if (k === 0) ctx.arc(cx, cy, s, 0, TAU); else if (k === 1) { ctx.moveTo(cx - s * 0.7, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx - s * 0.7, cy + s); ctx.closePath(); } else { ctx.moveTo(cx, cy - s * 1.1); ctx.lineTo(cx + s, cy + s * 0.8); ctx.lineTo(cx - s, cy + s * 0.8); ctx.closePath(); }
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + w * 0.12, y + h * 0.78, w * 0.76, Math.max(2, h * 0.05));
    ctx.fillRect(x + w * 0.12, y + h * 0.88, w * 0.5, Math.max(2, h * 0.05));
  }
  function spinner(ctx, x, y, r, t, col = '#fff') {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); const a = t * 7; ctx.arc(0, 0, r, a, a + 1.6); ctx.stroke(); ctx.restore();
  }
  // draws a UI in a w x h box at origin (caller clips)
  function fakeUI(ctx, w, h, kind, t, seed) {
    const u = h / 100;
    if (kind === 0) { // dark red streaming rows
      ctx.fillStyle = '#12070B'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#E50914'; ctx.fillRect(w * 0.04, 6 * u, w * 0.12, 9 * u);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 4; i++) ctx.fillRect(w * (0.22 + i * 0.09), 9 * u, w * 0.06, 3 * u);
      const ph = h * 0.25;
      for (let r = 0; r < 3; r++) {
        const pw = ph * 0.68, off = -((t * (60 + r * 30) * (r % 2 ? -1 : 1)) % (pw + 10)) - (r % 2 ? 0 : 0);
        for (let i = -1; i < w / (pw + 10) + 2; i++) poster(ctx, off + i * (pw + 10) + w * 0.02, h * (0.24 + r * 0.25), pw, ph, r * 31 + (i + Math.floor(-off / 1)) * 0 + ((i % 8) + 8) % 8 + r * 7);
      }
    } else if (kind === 1) { // light blue grid + buffering spinner
      ctx.fillStyle = '#E9F1FF'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2F6BFF'; ctx.fillRect(0, 0, w, 13 * u);
      A.text(ctx, 'Vidly', w * 0.08, 6.5 * u, { font: `800 ${9 * u}px Rubik`, fill: '#fff', align: 'left' });
      const cols = 5, pw = w / cols - 8, ph = h * 0.34;
      for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) poster(ctx, 6 + i * (pw + 8), 17 * u + r * (ph + 8), pw, ph, 40 + r * 9 + i * 3);
      ctx.fillStyle = 'rgba(20,30,60,0.55)'; ctx.fillRect(0, 0, w, h);
      spinner(ctx, w / 2, h / 2, h * 0.11, t);
    } else if (kind === 2) { // purple hero + ad
      ctx.fillStyle = '#1D0F3F'; ctx.fillRect(0, 0, w, h);
      const hh = h * 0.5; ctx.fillStyle = A.linear(ctx, 0, 0, w, hh, [[0, '#7B3CFF'], [1, '#FF4F9A']]); ctx.fillRect(0, 0, w, hh);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(w * 0.06, hh * 0.55, w * 0.32, 5 * u); ctx.fillRect(w * 0.06, hh * 0.72, w * 0.2, 4 * u);
      A.rrect(ctx, w * 0.06, hh * 0.85, w * 0.15, 8 * u, 6); ctx.fillStyle = '#FFC24A'; ctx.fill();
      for (let i = 0; i < 6; i++) poster(ctx, 8 + i * (w / 6), h * 0.55, w / 6 - 10, h * 0.42, 60 + i);
      A.rrect(ctx, w * 0.62, h * 0.06, w * 0.34, 14 * u, 6); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fill();
      A.text(ctx, 'AD 0:0' + (5 - Math.floor(t * 1.2) % 5), w * 0.79, h * 0.06 + 7 * u, { font: `800 ${8 * u}px Rubik`, fill: '#FFD84A' });
    } else if (kind === 3) { // green list rows
      ctx.fillStyle = '#0B1F17'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#20C46B'; ctx.fillRect(0, 0, w, 12 * u);
      A.text(ctx, 'Zapp', w * 0.06, 6 * u, { font: `800 ${8 * u}px Rubik`, fill: '#fff', align: 'left' });
      const sc = (t * 30) % (h * 0.24);
      for (let i = -1; i < 5; i++) { const y = 14 * u + i * h * 0.24 - sc; poster(ctx, w * 0.05, y, h * 0.2, h * 0.2, 80 + i + 1, 6); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(w * 0.32, y + h * 0.04, w * 0.5, 4 * u); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(w * 0.32, y + h * 0.12, w * 0.32, 3 * u); }
    } else { // orange phone
      ctx.fillStyle = '#2A1200'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, h * 0.5, [[0, '#FF8A3D'], [1, '#FFC24A']]); ctx.fillRect(0, 0, w, h * 0.42);
      spinner(ctx, w / 2, h * 0.7, w * 0.16, t + 0.3, '#FFC24A');
      A.text(ctx, '...', w / 2, h * 0.9, { font: `800 ${w * 0.16}px Rubik`, fill: '#fff' });
    }
  }
  // draw a device (bezel + UI). x,y = centre. o: {kind, seed, bez, r, dim}
  function screen(ctx, x, y, w, h, kind, t, o = {}) {
    const b = o.bez ?? 14;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
    A.rrect(ctx, -w / 2 - b, -h / 2 - b, w + b * 2, h + b * 2, o.r ?? 18); A.fillStroke(ctx, o.frame || '#241C44', 6);
    ctx.save(); A.rrect(ctx, -w / 2, -h / 2, w, h, (o.r ?? 18) * 0.5); ctx.clip();
    ctx.translate(-w / 2, -h / 2); fakeUI(ctx, w, h, kind, t + (o.toff || 0), o.seed || 0);
    if (o.drain) { ctx.fillStyle = `rgba(14,11,46,${o.drain})`; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.55, 0); ctx.lineTo(w * 0.15, h); ctx.lineTo(0, h); ctx.fill();
    ctx.restore(); ctx.restore();
  }

  // ---------------------------------------------------------------- static room (cached, world coords, 2600x1500, origin -340,-210)
  const OX = 340, OY = 210;
  function roomLayer() {
    return A.layer('s1_room', 2600, 1500, (g) => {
      g.translate(OX, OY);
      const X0 = -340, Y0 = -210, W = 2600, H = 1500, floorY = 740;
      // wall
      g.fillStyle = A.linear(g, 0, Y0, 0, floorY, [[0, '#1C1450'], [1, '#3A2478']]); g.fillRect(X0, Y0, W, floorY - Y0);
      // wall stripes texture
      g.fillStyle = 'rgba(255,255,255,0.028)'; for (let x = X0; x < X0 + W; x += 90) g.fillRect(x, Y0, 44, floorY - Y0);
      // window with night city (upper centre-left)
      g.save(); g.translate(1000, 250);
      A.rrect(g, -180, -150, 360, 300, 14); A.fillStroke(g, A.linear(g, 0, -150, 0, 150, [[0, '#0E0B2E'], [1, '#3B2A86']]), 8);
      g.save(); A.rrect(g, -180, -150, 360, 300, 14); g.clip();
      const r = A.rng(4); for (let i = 0; i < 22; i++) { const bw = 30 + r() * 40, bh = 40 + r() * 110; g.fillStyle = '#150F3D'; g.fillRect(-180 + i * 18 - 10, 150 - bh, bw, bh); }
      for (let i = 0; i < 70; i++) { g.fillStyle = r() > 0.5 ? '#FFD88A' : '#7FE7FF'; g.fillRect(-175 + r() * 350, -20 + r() * 165, 4, 5); }
      for (let i = 0; i < 26; i++) { g.fillStyle = '#fff'; g.globalAlpha = 0.4 + r() * 0.5; g.fillRect(-175 + r() * 350, -145 + r() * 100, 2.5, 2.5); }
      g.globalAlpha = 1; g.fillStyle = '#FFF6E0'; g.beginPath(); g.arc(110, -85, 22, 0, TAU); g.fill(); g.restore();
      g.fillStyle = A.OUTLINE; g.fillRect(-5, -150, 10, 300); g.fillRect(-180, -5, 360, 10);
      g.restore();
      // curtains
      for (const s of [-1, 1]) { g.beginPath(); const cx = 1000 + s * 215; g.moveTo(cx - 40, 90); g.lineTo(cx + 40, 90); g.lineTo(cx + 46, 470); g.lineTo(cx - 46, 470); g.closePath(); A.fillStroke(g, s < 0 ? '#C23C7A' : '#B03270', 6); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 5; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 14, 100); g.lineTo(cx + i * 15, 460); g.stroke(); } }
      // shelf w/ books (left wall)
      g.save(); g.translate(300, 0);
      A.rrect(g, -260, 130, 520, 26, 6); A.fillStroke(g, '#5B3A2A', 6); // shelf above monitor
      const rr = A.rng(8); let bx = -250; const bc = ['#FF4F9A', '#38D9F5', '#FFC24A', '#3DDC84', '#B14CFF', '#FF8A3D'];
      while (bx < 210) { const bw = 18 + rr() * 18, bh = 50 + rr() * 45; A.rrect(g, bx, 130 - bh, bw, bh, 3); A.fillStroke(g, bc[Math.floor(rr() * 6)], 4); bx += bw + 3; }
      g.restore();
      // plant right of window
      g.save(); g.translate(1990, 690);
      A.rrect(g, -55, -60, 110, 110, 14); A.fillStroke(g, '#FF8A3D', 6);
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.32; g.beginPath(); g.ellipse(Math.cos(a) * 75, -60 + Math.sin(a) * 120, 22, 70, a + Math.PI / 2, 0, TAU); A.fillStroke(g, i % 2 ? '#2FBF71' : '#1E9E5B', 5); }
      g.restore();
      // floor
      g.fillStyle = A.linear(g, 0, floorY, 0, Y0 + H, [[0, '#4A2F5E'], [1, '#22123A']]); g.fillRect(X0, floorY, W, H - (floorY - Y0));
      g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = floorY + 30; y < Y0 + H; y += 60) g.fillRect(X0, y, W, 3);
      g.fillStyle = '#1a1330'; g.fillRect(X0, floorY - 8, W, 12); // baseboard
      // rug
      g.save(); g.translate(950, 900); A.ellipse(g, 0, 0, 820, 190); A.fillStroke(g, '#7A2C6E', 6); A.ellipse(g, 0, 0, 700, 150); g.strokeStyle = '#FFC24A'; g.lineWidth = 6; g.setLineDash([26, 16]); g.stroke(); g.setLineDash([]); g.restore();
      // TV cabinet
      g.save(); g.translate(L.tv.x, 690);
      A.rrect(g, -420, -26, 840, 100, 14); A.fillStroke(g, '#6B4330', 7); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-410, 22, 820, 6);
      A.rrect(g, -300, -2, 220, 66, 8); A.fillStroke(g, '#4B2E20', 5); A.rrect(g, 80, -2, 220, 66, 8); A.fillStroke(g, '#4B2E20', 5);
      g.restore();
      // old TV shelf/table
      g.save(); g.translate(L.old.x, 690); A.rrect(g, -250, 30, 500, 90, 12); A.fillStroke(g, '#6B4330', 7); g.restore();
      // coffee table
      g.save(); g.translate(1010, 900);
      A.rrect(g, -270, -80, 540, 30, 10); A.fillStroke(g, '#8A5A3A', 7);
      for (const s of [-1, 1]) { A.rrect(g, s * 220 - 12, -52, 24, 116, 6); A.fillStroke(g, '#5B3A2A', 6); }
      g.restore();
      // cables (tangle) on floor
      const cr = A.rng(21);
      const cabs = [['#0B0818', 1100, 770, 700, 990, 1380, 990, 1620, 770], ['#0B0818', 320, 770, 500, 1040, 900, 1060, 1200, 940], ['#3A3A52', 1450, 770, 1200, 1100, 760, 1080, 560, 930], ['#0B0818', 1000, 770, 1500, 1050, 260, 1020, 140, 860]];
      for (const c of cabs) {
        g.beginPath(); g.moveTo(c[1], c[2]); g.bezierCurveTo(c[3], c[4], c[5], c[6], c[7], c[8]); g.lineCap = 'round';
        g.strokeStyle = A.OUTLINE; g.lineWidth = 16; g.stroke(); g.strokeStyle = c[0] === '#0B0818' ? '#4B4570' : '#8888A8'; g.lineWidth = 8; g.stroke();
      }
      // power strip
      A.rrect(g, 1040, 750, 130, 34, 8); A.fillStroke(g, '#F2F2F8', 5); for (let i = 0; i < 4; i++) { g.fillStyle = '#333'; g.fillRect(1056 + i * 28, 762, 14, 10); } g.fillStyle = '#FF4A3D'; g.beginPath(); g.arc(1160, 767, 5, 0, TAU); g.fill();
      // remotes strewn about
      const rem = [[520, 990, 0.6], [1250, 1020, -0.4], [1480, 930, 1.2], [700, 1090, -1.0], [1010, 1060, 0.2], [230, 940, -0.7], [1700, 1010, 0.9]];
      rem.forEach(([x, y, a], i) => {
        g.save(); g.translate(x, y); g.rotate(a); A.rrect(g, -18, -62, 36, 124, 12); A.fillStroke(g, ['#2E2E44', '#E8E8F2', '#3B3B58'][i % 3], 5);
        for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-7 + (k % 2) * 14, -32 + Math.floor(k / 2) * 20, 5, 0, TAU); g.fillStyle = [D.red, D.cyan, D.gold, D.green, D.magenta, '#fff'][(k + i) % 6]; g.fill(); }
        g.restore();
      });
      // wall sockets etc
      // sticky notes (wall by left monitor, tv side)
      const notes = [[110, 300, -0.15, '#FFE066', '1234'], [500, 300, 0.1, '#FF9EC4', 'PASS?'], [105, 400, 0.12, '#9EF0FF', 'אבא123'], [1010, 470, 0.08, '#FFE066', 'Zapp: xY7!'], [1820, 250, -0.1, '#FF9EC4', 'איפה\nהשלט?!'], [1780, 640, 0.15, '#9EF0FF', 'סיסמה\n?']];
      for (const [x, y, a, c, txt] of notes) {
        g.save(); g.translate(x, y); g.rotate(a); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.fillStyle = c; g.fillRect(-46, -46, 92, 92); g.shadowColor = 'transparent';
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-46, -46, 92, 10);
        txt.split('\n').forEach((ln, i, arr) => A.text(g, ln, 0, -4 + (i - (arr.length - 1) / 2) * 26, { font: '700 24px Rubik', fill: '#3a2a10', dir: /[א-ת]/.test(ln) ? 'rtl' : 'ltr' }));
        g.restore();
      }
    });
  }

  // ---------------------------------------------------------------- tornado of app tiles
  const TORN = (() => {
    const r = A.rng(77), a = [];
    const N = 28;
    for (let i = 0; i < N; i++) {
      const c = TILE_C[i % TILE_C.length];
      a.push({ a0: r() * TAU, h: (i + r() * 0.6) / N, sz: 62 + r() * 38, c1: c[0], c2: c[1], lab: TILE_L[Math.floor(r() * TILE_L.length)], sp: 0.85 + r() * 0.4, rot0: (r() - 0.5) * 1.2, wob: r() * 9, kind: i % 5 });
    }
    return a;
  })();
  const TPH = (t) => A.key(t, [[0, 0], [T_FREEZE + 0.12, 15.5, 'out'], [T_SNAP, 15.9, 'lin']]); // tornado phase (rad*)
  function tornPos(q, t) {
    const tt = Math.min(t, T_SNAP), ph = TPH(tt);
    const grow = A.smooth(-0.1, 0.45, tt);           // funnel builds in
    const ang = q.a0 + ph * q.sp * 1.15;
    const h = q.h;
    const rad = (110 + 330 * Math.pow(h, 0.85)) * (0.5 + 0.5 * grow);
    const cx = L.head.x + 20 * Math.sin(h * 3 + tt * 2) * (tt < T_FREEZE ? 1 : 0.2) + (h - 0.5) * 60;
    const y0 = L.head.y + 130 - h * 470;
    const bob = tt > T_FREEZE ? Math.sin(tt * 6 + q.wob) * 5 : 0;
    const x = cx + Math.cos(ang) * rad, y = y0 + Math.sin(ang) * rad * 0.26 + bob;
    const depth = Math.sin(ang); // >0 front
    const sc = 0.72 + 0.28 * (depth * 0.5 + 0.5) + 0.2 * h;
    return { x, y, depth, sc, rot: q.rot0 + Math.sin(ang * 1.3 + q.wob) * 0.5 + ang * 0.25 * (tt < T_FREEZE ? 1 : 0.2) };
  }
  function tile(ctx, q, x, y, sc, rot, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    const w = q.sz, h = q.sz;
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    A.rrect(ctx, -w / 2, -h / 2, w, h, w * 0.24); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, q.c1], [1, q.c2]]); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 6; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
    A.rrect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h * 0.36, w * 0.18); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    if (q.kind === 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-w * 0.14, -h * 0.2); ctx.lineTo(w * 0.24, 0); ctx.lineTo(-w * 0.14, h * 0.2); ctx.closePath(); ctx.fill(); }
    else A.text(ctx, q.lab, 0, 2, { font: `800 ${Math.round(h * (q.lab.length > 4 ? 0.22 : 0.3))}px Rubik`, fill: '#fff' });
    ctx.restore();
  }
  function tornado(ctx, t, front) {
    const list = [];
    for (const q of TORN) { const p = tornPos(q, t); if ((p.depth >= 0) === front) list.push([q, p]); }
    list.sort((a, b) => a[1].depth - b[1].depth);
    for (const [q, p] of list) {
      const idx = TORN.indexOf(q), grow = A.smooth(-0.1 + q.h * 0.3, 0.3 + q.h * 0.3, Math.min(t, T_SNAP));
      if (t >= T_SNAP + idx * 0.010) continue; // handled by spiral
      const sc = p.sc * (0.2 + 0.8 * A.ease.outBack(clamp(grow)));
      // motion streak while spinning fast
      if (t < T_FREEZE + 0.1) { const v = (1 - A.smooth(1.3, T_FREEZE + 0.1, t)); if (v > 0.05) { ctx.save(); ctx.globalAlpha = 0.16 * v; const pb = tornPosPrev(q, t); tile(ctx, q, pb.x, pb.y, pb.sc * (0.2 + 0.8 * A.ease.outBack(clamp(grow))), pb.rot, 1); ctx.restore(); } }
      tile(ctx, q, p.x, p.y, sc, p.rot);
    }
  }
  function tornPosPrev(q, t) { return tornPos(q, t - 0.035); }
  const TVC = () => ({ x: L.tv.x, y: L.tv.y });

  // spiral: tiles + poster cards from other screens flying into the TV
  const CARDS = (() => { const a = [], r = A.rng(5); const srcs = [L.old, L.lap]; srcs.forEach((s, si) => { for (let i = 0; i < 9; i++) { const c = TILE_C[(i * 3 + si) % TILE_C.length]; a.push({ sx: s.x + (r() - 0.5) * s.w * 0.7, sy: s.y + (r() - 0.5) * s.h * 0.6, sz: 60 + r() * 20, c1: c[0], c2: c[1], lab: '', kind: 0, d: 0.02 * i + 0.03 * si + r() * 0.03 }); } }); return a; })();
  function spiralPos(px, py, u, dirSign, tx, ty) {
    const e = Math.pow(u, 1.9), vx = px - tx, vy = py - ty, r0 = Math.hypot(vx, vy), a0 = Math.atan2(vy, vx);
    const a = a0 + dirSign * 3.2 * A.ease.inOut(u), r = r0 * (1 - e) + 4;
    return { x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r * 0.85, e };
  }
  function spiralItems(ctx, t) {
    if (t < T_SNAP) return 0;
    const tv = TVC(); let arrived = 0;
    const one = (q, px, py, sc0, rot0, d, dur) => {
      const u = inv(T_SNAP + d, T_SNAP + d + dur, t); if (u >= 1) { arrived++; return; }
      for (let g = 4; g >= 0; g--) { // trail ghosts
        const ug = clamp(u - g * 0.045); if (ug <= 0 && g > 0) continue;
        const p = spiralPos(px, py, ug, -1, tv.x, tv.y);
        const sc = sc0 * (1 - 0.8 * Math.pow(ug, 1.6)) * (g ? 0.85 - g * 0.1 : 1);
        if (g) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; tile(ctx, { ...q, c1: '#FFC24A', c2: '#FF8A3D', kind: 9, lab: '' }, p.x, p.y, sc, rot0 + ug * 9, 0.32 - g * 0.06); ctx.restore(); }
        else tile(ctx, q, p.x, p.y, sc, rot0 + ug * 9, 1);
      }
    };
    TORN.forEach((q, i) => { const p = tornPos(q, T_SNAP); one(q, p.x, p.y, p.sc, p.rot, i * 0.010, 0.5 + 0.06 * (i % 4)); });
    CARDS.forEach((q) => one(q, q.sx, q.sy, 1, 0.2, q.d + 0.02, 0.55));
    return arrived;
  }

  // ---------------------------------------------------------------- gold burst
  function sparkle(ctx, x, y, r, rot, col) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
  function rays(ctx, x, y, n, len, w, rot, col, alpha) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(i * TAU / n); const l = len * (0.7 + 0.3 * A.hash(i * 3.1));
      ctx.beginPath(); ctx.moveTo(0, -w * 0.5); ctx.lineTo(l, -w * 0.08); ctx.lineTo(l, w * 0.08); ctx.lineTo(0, w * 0.5); ctx.closePath();
      ctx.fillStyle = A.linear(ctx, 0, 0, l, 0, [[0, col], [1, 'rgba(255,194,74,0)']]); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  const SPARKS = (() => { const r = A.rng(31), a = []; for (let i = 0; i < 70; i++) a.push({ a: r() * TAU, v: 300 + r() * 1300, sz: 10 + r() * 30, d: r() * 0.25, rot: r() * TAU, life: 0.6 + r() * 0.7, col: r() > 0.5 ? '#FFE08A' : (r() > 0.5 ? '#FFFFFF' : '#FFC24A') }); return a; })();
  function burst(ctx, t) {
    const tv = TVC(), b = t - T_BURST; if (b < 0) return;
    const a = clamp(1 - inv(0.5, 1.5, b));
    rays(ctx, tv.x, tv.y, 22, 1500 * A.ease.out(clamp(b / 0.35)), 230, b * 0.35, '#FFE9A8', 0.55 * a + 0.1);
    rays(ctx, tv.x, tv.y, 14, 1100 * A.ease.out(clamp(b / 0.3)), 150, -b * 0.5 + 0.2, '#FFFFFF', 0.5 * a);
    // shock rings
    for (let k = 0; k < 3; k++) { const bb = b - k * 0.11; if (bb < 0) continue; const p = A.ease.out(clamp(bb / 0.7)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - p) * 0.9; ctx.lineWidth = 40 * (1 - p) + 4; ctx.strokeStyle = k ? '#FFC24A' : '#FFF4D8'; ctx.beginPath(); ctx.arc(tv.x, tv.y, 60 + p * 1300, 0, TAU); ctx.stroke(); ctx.restore(); }
    for (const s of SPARKS) { const bb = b - s.d; if (bb < 0 || bb > s.life) continue; const p = bb / s.life, e = A.ease.out(p); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p * p; sparkle(ctx, tv.x + Math.cos(s.a) * s.v * e * 0.9, tv.y + Math.sin(s.a) * s.v * e * 0.9 + 200 * p * p, s.sz * (1 - p * 0.5), s.rot + p * 3, s.col); ctx.restore(); }
  }

  // ---------------------------------------------------------------- devices layer
  function bigTV(ctx, t, arrived) {
    const tv = L.tv, b = t - T_BURST;
    ctx.save(); ctx.translate(tv.x, tv.y);
    // stand
    ctx.beginPath(); ctx.moveTo(-40, tv.h / 2); ctx.lineTo(40, tv.h / 2); ctx.lineTo(90, 265); ctx.lineTo(-90, 265); ctx.closePath(); A.fillStroke(ctx, '#241C44', 6);
    ctx.restore();
    // body
    ctx.save(); ctx.translate(tv.x, tv.y);
    A.rrect(ctx, -tv.w / 2 - 16, -tv.h / 2 - 16, tv.w + 32, tv.h + 32, 22); A.fillStroke(ctx, '#1b1438', 8);
    ctx.save(); A.rrect(ctx, -tv.w / 2, -tv.h / 2, tv.w, tv.h, 10); ctx.clip(); ctx.translate(-tv.w / 2, -tv.h / 2);
    if (t < T_SNAP) { fakeUI(ctx, tv.w, tv.h, 0, t, 1); }
    else if (t < T_BURST) {
      const p = inv(T_SNAP, T_BURST, t); fakeUI(ctx, tv.w, tv.h, 0, T_SNAP, 1);
      ctx.fillStyle = `rgba(14,11,46,${0.8 * A.smooth(0, 0.3, p)})`; ctx.fillRect(0, 0, tv.w, tv.h);
      // gathering vortex glow
      ctx.globalCompositeOperation = 'lighter'; const g = 0.2 + 0.8 * p * p; ctx.fillStyle = A.radial(ctx, tv.w / 2, tv.h / 2, 0, tv.w * 0.6 * g, [[0, 'rgba(255,240,190,' + (0.95 * g) + ')'], [0.5, 'rgba(255,194,74,' + 0.5 * g + ')'], [1, 'rgba(255,194,74,0)']]); ctx.fillRect(0, 0, tv.w, tv.h);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // blown-up golden screen
      ctx.fillStyle = A.radial(ctx, tv.w / 2, tv.h / 2, 0, tv.w * 0.75, [[0, '#FFFFFF'], [0.35, '#FFF0B8'], [1, '#FFC24A']]); ctx.fillRect(0, 0, tv.w, tv.h);
      ctx.save(); ctx.translate(tv.w / 2, tv.h / 2); ctx.rotate(b * 0.4); ctx.globalAlpha = 0.35; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600, -50); ctx.lineTo(600, 50); ctx.fill(); } ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tv.w * 0.5, 0); ctx.lineTo(tv.w * 0.18, tv.h); ctx.lineTo(0, tv.h); ctx.fill();
    ctx.restore(); ctx.restore();
  }
  function otherDevices(ctx, t) {
    const dr = A.smooth(T_SNAP + 0.05, T_SNAP + 0.5, t) * 0.9;
    // old monitor
    ctx.save(); ctx.translate(L.old.x, L.old.y); ctx.beginPath(); ctx.moveTo(-40, L.old.h / 2); ctx.lineTo(40, L.old.h / 2); ctx.lineTo(60, 262); ctx.lineTo(-60, 262); ctx.closePath(); A.fillStroke(ctx, '#241C44', 6); ctx.restore();
    screen(ctx, L.old.x, L.old.y, L.old.w, L.old.h, 1, t, { drain: dr, bez: 14 });
    // laptop
    const lp = L.lap; ctx.save(); ctx.translate(lp.x, lp.y);
    ctx.beginPath(); ctx.moveTo(-lp.w / 2 - 30, lp.h / 2 + 12); ctx.lineTo(lp.w / 2 + 30, lp.h / 2 + 12); ctx.lineTo(lp.w / 2 + 44, lp.h / 2 + 34); ctx.lineTo(-lp.w / 2 - 44, lp.h / 2 + 34); ctx.closePath(); A.fillStroke(ctx, '#B8B6D0', 6); ctx.restore();
    screen(ctx, lp.x, lp.y, lp.w, lp.h, 2, t, { drain: dr, bez: 12, frame: '#3B3B58', r: 12 });
  }

  // ---------------------------------------------------------------- people (adapter around kit_people.js PPL; placeholders until it lands)
  function people(ctx, t, layer) {
    if (window.S1_PEOPLE) return window.S1_PEOPLE(ctx, t, layer, L, { T_FREEZE, T_SNAP, T_BURST });
    // placeholders
    if (layer !== 'mid') return;
    const box = (x, y, w, h, c, txt) => { ctx.fillStyle = c; ctx.fillRect(x - w / 2, y - h, w, h); A.text(ctx, txt, x, y - h / 2, { font: '700 30px Rubik', fill: '#fff' }); };
    box(L.yoni.x, L.yoni.y, 200, 400, '#c96', 'YONI'); box(330, 700, 130, 320, '#6a9', 'MAYA'); box(1130, 700, 130, 320, '#69c', 'TOM');
  }

  // ---------------------------------------------------------------- camera
  function cam(t) {
    const shake = t > T_SNAP - 0.02 ? 1 : 0;
    const x = A.key(t, [[0, 1200], [0.9, 900, 'out'], [T_FREEZE, 830, 'inOut'], [T_FREEZE + 0.86, 800, 'inOut'], [T_SNAP, 960, 'out'], [T_BURST + 0.1, 1000, 'inOut'], [4.1, 1180, 'inOut'], [T_END, L.tv.x, 'in']]);
    const y = A.key(t, [[0, 640], [0.9, 560, 'out'], [T_FREEZE, 540], [T_SNAP, 540, 'out'], [T_BURST + 0.1, 520, 'inOut'], [4.1, 480, 'inOut'], [T_END, L.tv.y, 'in']]);
    const zoom = A.key(t, [[0, 1.55], [0.9, 1.16, 'out'], [T_FREEZE, 1.24, 'inOut'], [T_FREEZE + 0.86, 1.34, 'inOut'], [T_SNAP, 1.0, 'outBack'], [T_BURST + 0.1, 1.06, 'inOut'], [4.1, 1.45, 'inOut'], [T_END, 5.6, 'in']]);
    const rot = A.key(t, [[0, 0.07], [0.9, -0.015, 'out'], [T_FREEZE, 0.01], [T_SNAP, 0, 'out'], [T_BURST, 0], [T_BURST + 0.12, 0.02, 'out'], [4.3, -0.015, 'inOut'], [T_END, 0.0, 'inOut']]);
    const sh = (t > T_BURST && t < T_BURST + 0.6 ? 1.2 * (1 - inv(T_BURST, T_BURST + 0.6, t)) : 0) + (t > T_SNAP && t < T_SNAP + 0.3 ? 0.6 * (1 - inv(T_SNAP, T_SNAP + 0.3, t)) : 0) + (t > 4.2 ? 0.25 * inv(4.2, T_END, t) : 0);
    return { x, y, zoom, rot, shake: sh, t };
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's1_chaos', start: 0, end: 5.0, draw(ctx, s) {
    const t = s.t;
    if (t >= T_END) { ctx.fillStyle = GOLD_WHITE; ctx.fillRect(0, 0, 1920, 1080); return; }
    ctx.fillStyle = '#0E0B2E'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.save();
    A.camera(ctx, cam(t));
    ctx.drawImage(roomLayer(), -OX, -OY);
    // evening lamp glow + TV chaos glow
    A.glow(ctx, 1000, 250, 700, 'rgba(120,120,255,0.35)', 0.5);
    A.glow(ctx, 240, 640, 420, 'rgba(255,170,90,0.55)', 0.35);
    // screens flicker light (different colours) onto the room before the snap
    const chaos = 1 - A.smooth(T_SNAP - 0.1, T_SNAP + 0.3, t);
    A.glow(ctx, L.tv.x, L.tv.y + 100, 720, 'rgba(255,60,80,0.9)', 0.32 * chaos);
    A.glow(ctx, L.old.x, L.old.y + 60, 480, 'rgba(60,120,255,0.9)', 0.36 * chaos);
    A.glow(ctx, L.lap.x, L.lap.y, 420, 'rgba(180,80,255,0.9)', 0.36 * chaos);

    // shadow of sofa etc handled by kit
    people(ctx, t, 'back');
    otherDevices(ctx, t);
    const arrived = t >= T_SNAP ? TORN.length + CARDS.length : 0;
    bigTV(ctx, t, arrived);
    tornado(ctx, t, false);
    people(ctx, t, 'mid');
    tornado(ctx, t, true);
    people(ctx, t, 'front');
    spiralItems(ctx, t);
    // gold light over the room
    const gl = A.smooth(T_BURST, T_BURST + 0.25, t) * (0.7 + 0.3 * (1 - A.smooth(T_BURST + 0.3, T_BURST + 1.2, t)));
    if (gl > 0) {
      A.glow(ctx, L.tv.x, L.tv.y, 2200, 'rgba(255,214,120,1)', 0.45 * gl);
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,190,70,${0.5 * gl})`; ctx.fillRect(-400, -300, 2800, 1700); ctx.restore();
    }
    burst(ctx, t);
    // pre-burst charge glow at the TV
    const ch = inv(T_SNAP, T_BURST, t); if (ch > 0 && t < T_BURST) A.glow(ctx, L.tv.x, L.tv.y, 300 + 900 * ch * ch, 'rgba(255,220,130,1)', 0.75 * ch);
    ctx.restore();

    // ---- screen-space overlays
    // opening speed streaks
    const sk = 1 - A.smooth(0.05, 0.75, t);
    if (sk > 0.01) { const r = A.rng(9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const y = r() * 1080, len = 300 + r() * 700, x = ((r() * 2600 - t * 4200 * (0.6 + r())) % 2600 + 2600) % 2600 - 340; ctx.globalAlpha = 0.18 * sk; ctx.fillStyle = r() > 0.5 ? '#B9A6FF' : '#FFE9B0'; ctx.fillRect(x, y, len, 2 + r() * 4); } ctx.restore(); }
    // snap flash + vignette punch at freeze->snap
    const sn = 1 - inv(T_SNAP, T_SNAP + 0.14, t); if (t >= T_SNAP && sn > 0) { ctx.fillStyle = `rgba(255,244,216,${0.35 * sn})`; ctx.fillRect(0, 0, 1920, 1080); }
    const bf = t >= T_BURST ? 1 - inv(T_BURST, T_BURST + 0.28, t) : 0; if (bf > 0) { ctx.fillStyle = `rgba(255,250,235,${0.8 * bf})`; ctx.fillRect(0, 0, 1920, 1080); }
    // final wash to gold-white
    const w = A.ease.in(inv(T_WASH, T_END - 0.06, t)); if (w > 0) { ctx.fillStyle = GOLD_WHITE; ctx.globalAlpha = w; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
  } });
})();
