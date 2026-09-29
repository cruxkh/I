// S1 CHAOS -> THE RIGHT PLACE  (global 0.00-5.00)
// 0-3.0 app-chaos in the living room; 3.05 tiles spiral into the big TV; 3.55 gold burst; push into TV; 5.00 full gold-white.
(() => {
  const S = {}; // helpers namespace (local)
  const TAU = A.TAU, clamp = A.clamp, inv = A.inv;
  const T_FREEZE = 2.0, T_SNAP = 3.05, T_BURST = 3.55, T_WASH = 4.55, T_END = 5.0;
  const GOLD_WHITE = '#FFF4D8';

  // ---------------------------------------------------------------- world layout
  const P = window.PPL;
  const L = {
    tv: { x: P.TV.x + P.TV.w / 2, y: P.TV.y + P.TV.h / 2, w: P.TV.w, h: P.TV.h },   // the big TV (right of centre)
    old: { x: 868, y: 322, w: 230, h: 130 },          // small monitor on the wall shelf
    lap: { x: 1130, y: 968, w: 300, h: 190, s: 0.5 }, // laptop on the pouf
    head: { x: 610, y: 500 },                          // tornado axis (above Yoni)
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

  // ---------------------------------------------------------------- static clutter over the kit room (cables, remotes, pouf)
  function clutterLayer() {
    return A.layer('s1_clutter', 1920, 1080, (g) => {
      // cables snaking across the floor from the TV console, tangled
      const cabs = [['#0B0818', 1450, 812, 1200, 1010, 800, 1000, 500, 960], ['#0B0818', 1300, 812, 1700, 1000, 1000, 1080, 260, 900], ['#3A3A52', 1600, 812, 1300, 900, 1250, 1040, 900, 990], ['#0B0818', 1500, 812, 1750, 950, 1400, 1020, 1120, 900], ['#E8E8F2', 1350, 812, 1050, 980, 760, 930, 420, 1030]];
      for (const c of cabs) {
        g.beginPath(); g.moveTo(c[1], c[2]); g.bezierCurveTo(c[3], c[4], c[5], c[6], c[7], c[8]); g.lineCap = 'round';
        g.strokeStyle = A.OUTLINE; g.lineWidth = 17; g.stroke(); g.strokeStyle = c[0] === '#0B0818' ? '#4B4570' : (c[0] === '#E8E8F2' ? '#fff' : '#8888A8'); g.lineWidth = 8; g.stroke();
      }
      // power strip
      g.save(); g.translate(1215, 985); g.rotate(-0.08); A.rrect(g, -70, -18, 140, 36, 8); A.fillStroke(g, '#F2F2F8', 5); for (let i = 0; i < 4; i++) { g.fillStyle = '#333'; g.fillRect(-54 + i * 30, -6, 16, 12); } g.fillStyle = '#FF4A3D'; g.beginPath(); g.arc(56, 0, 5, 0, TAU); g.fill(); g.restore();
      // pouf under the laptop
      g.save(); g.translate(1130, 985); A.ellipse(g, 0, 62, 110, 22); g.fillStyle = 'rgba(8,4,26,.35)'; g.fill();
      A.rrect(g, -96, -30, 192, 84, 30); A.fillStroke(g, A.linear(g, 0, -30, 0, 54, [[0, '#38D9F5'], [1, '#1F8FB0']]), 6); g.restore();
      // remotes strewn about
      const rem = [[470, 990, 0.9], [1010, 1040, -0.5], [1560, 1000, 1.3], [780, 1050, -1.0], [300, 940, 0.4], [1720, 930, -0.3]];
      rem.forEach(([x, y, a], i) => { P.remote(g, x, y, 1.15, a, { t: 0 }); });
    });
  }
  function notes(ctx, t) { // sticky notes on devices / wall, drawn above screens
    const list = [[1052, 232, -0.2, '#FFE066', '1234'], [1806, 214, 0.14, '#FF9EC4', 'PASS?'], [772, 268, -0.1, '#9EF0FF', 'אבא123'], [1035, 640, 0.1, '#FFE066', 'Zapp:\nxY7!'], [560, 340, -0.08, '#FF9EC4', 'איפה\nהשלט?!'], [1470, 690, 0.1, '#9EF0FF', 'סיסמה\n?']];
    for (const [x, y, a, c, txt] of list) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.sin(t * 2 + x) * 0.012); const S = 0.62;
      ctx.scale(S, S); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fillStyle = c; ctx.fillRect(-46, -46, 92, 92); ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-46, -46, 92, 10);
      txt.split('\n').forEach((ln, i, arr) => A.text(ctx, ln, 0, -2 + (i - (arr.length - 1) / 2) * 28, { font: '700 26px Rubik', fill: '#3a2a10', dir: /[א-ת]/.test(ln) ? 'rtl' : 'ltr' }));
      ctx.restore();
    }
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
    const rad = (190 + 300 * Math.pow(h, 0.8)) * (0.5 + 0.5 * grow);
    const cx = L.head.x + 20 * Math.sin(h * 3 + tt * 2) * (tt < T_FREEZE ? 1 : 0.2) + (h - 0.5) * 60;
    const y0 = L.head.y - 110 - h * 350;
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
      if (t >= T_SNAP + idx * 0.006) continue; // handled by spiral
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
        const sc = sc0 * (1.15 - 0.85 * Math.pow(ug, 2.2)) * (g ? 0.85 - g * 0.1 : 1);
        if (g) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; tile(ctx, { ...q, c1: '#FFC24A', c2: '#FF8A3D', kind: 9, lab: '' }, p.x, p.y, sc, rot0 + ug * 9, 0.32 - g * 0.06); ctx.restore(); }
        else tile(ctx, q, p.x, p.y, sc, rot0 + ug * 9, 1);
      }
    };
    TORN.forEach((q, i) => { const p = tornPos(q, T_SNAP); one(q, p.x, p.y, p.sc, p.rot, i * 0.006, 0.3 + 0.03 * (i % 4)); });
    CARDS.forEach((q) => one(q, q.sx, q.sy, 1, 0.2, q.d * 0.6, 0.38));
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
  function bigTV(ctx, t) {
    const tv = L.tv, b = t - T_BURST;
    const chaos = 1 - A.smooth(T_SNAP - 0.1, T_SNAP + 0.3, t);
    P.tv(ctx, (c, w, h) => {
      if (t < T_SNAP) { fakeUI(c, w, h, 0, t, 1); }
      else if (t < T_BURST) {
        const p = inv(T_SNAP, T_BURST, t); fakeUI(c, w, h, 0, T_SNAP, 1);
        c.fillStyle = `rgba(14,11,46,${0.8 * A.smooth(0, 0.3, p)})`; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter'; const g = 0.2 + 0.8 * p * p; c.fillStyle = A.radial(c, w / 2, h / 2, 0, w * 0.6 * g, [[0, 'rgba(255,240,190,' + (0.95 * g) + ')'], [0.5, 'rgba(255,194,74,' + 0.5 * g + ')'], [1, 'rgba(255,194,74,0)']]); c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'source-over';
      } else {
        c.fillStyle = A.radial(c, w / 2, h / 2, 0, w * 0.75, [[0, '#FFFBEA'], [0.3, '#FFE9A0'], [1, '#FFB830']]); c.fillRect(0, 0, w, h);
        c.save(); c.translate(w / 2, h / 2); c.rotate(b * 0.4); c.globalAlpha = 0.35; for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(700, -50); c.lineTo(700, 50); c.fill(); } c.restore();
      }
    }, { spill: t < T_BURST ? '#FF5A78' : '#FFD27A', spillAlpha: t < T_BURST ? 0.3 * chaos : 0.6 });
  }
  function otherDevices(ctx, t) {
    const dr = A.smooth(T_SNAP + 0.05, T_SNAP + 0.5, t) * 0.92;
    const gold = A.smooth(T_BURST, T_BURST + 0.15, t);
    const ov = (c, w, h) => { if (dr) { c.fillStyle = `rgba(14,11,46,${dr})`; c.fillRect(0, 0, w, h); } if (gold) { c.fillStyle = `rgba(255,236,170,${gold * 0.85})`; c.fillRect(0, 0, w, h); } };
    // small monitor on the shelf
    ctx.save(); ctx.translate(L.old.x, L.old.y); ctx.beginPath(); ctx.moveTo(-28, L.old.h / 2 + 10); ctx.lineTo(28, L.old.h / 2 + 10); ctx.lineTo(40, 82); ctx.lineTo(-40, 82); ctx.closePath(); A.fillStroke(ctx, '#241C44', 5); ctx.restore();
    screen(ctx, L.old.x, L.old.y, L.old.w, L.old.h, 1, t, { drain: dr * (1 - gold), bez: 10, r: 12 });
    if (gold) { ctx.save(); ctx.globalAlpha = gold * 0.85; A.rrect(ctx, L.old.x - L.old.w / 2, L.old.y - L.old.h / 2, L.old.w, L.old.h, 6); ctx.fillStyle = '#FFECAA'; ctx.fill(); ctx.restore(); }
    // laptop on the pouf
    P.laptop(ctx, L.lap.x, L.lap.y, L.lap.s, (c, w, h) => { fakeUI(c, w, h, 2, t, 3); ov(c, w, h); }, { spill: '#B47CFF', spillAlpha: 0 });
  }
  const TABLET_UI = (t) => (c, w, h) => { fakeUI(c, w, h, 3, t, 4); const dr = A.smooth(T_SNAP + 0.05, T_SNAP + 0.5, t) * 0.92, gold = A.smooth(T_BURST, T_BURST + 0.15, t); if (dr) { c.fillStyle = `rgba(14,11,46,${dr})`; c.fillRect(0, 0, w, h); } if (gold) { c.fillStyle = `rgba(255,236,170,${gold * 0.9})`; c.fillRect(0, 0, w, h); } };
  const PHONE_UI = (t) => (c, w, h) => { fakeUI(c, w, h, 4, t, 5); const dr = A.smooth(T_SNAP + 0.05, T_SNAP + 0.5, t) * 0.92, gold = A.smooth(T_BURST, T_BURST + 0.15, t); if (dr) { c.fillStyle = `rgba(14,11,46,${dr})`; c.fillRect(0, 0, w, h); } if (gold) { c.fillStyle = `rgba(255,236,170,${gold * 0.9})`; c.fillRect(0, 0, w, h); } };

  // ---------------------------------------------------------------- people
  const SOFA = { x: 610, y: 905, s: 0.86 };
  const STAGE = (list, t, dur = 0.3) => { let i = 0; for (let j = 0; j < list.length; j++) if (t >= list[j][0]) i = j; const from = list[Math.max(0, i - 1)][1], to = list[i][1]; return { from: i ? from : to, to, k: i ? A.smooth(list[i][0], list[i][0] + dur, t) : 1 }; };
  const pick = (seq, t, step) => seq[Math.floor(t / step) % seq.length];
  const LOOKCAM = { x: 0, y: 0.05 };
  function personArgs(who, t) {
    const frozen = t >= T_FREEZE && t < T_SNAP, pt = t < T_SNAP ? Math.min(t, T_FREEZE) : t;
    const post = t >= T_SNAP;
    let list, face, look;
    if (who === 'yoni') {
      list = [[0, 'remote'], [0.95, 'scratch'], [T_SNAP, 'lean'], [3.75, 'cheer']];
      face = frozen ? 'worried' : post ? (t < 4.1 ? 'wow' : 'joy') : pick(['confused', 'worried', 'bored', 'confused', 'worried'], t, 0.42);
      const seq = [{ x: 0.9, y: -0.05 }, { x: -1, y: 0 }, { x: 0.25, y: 0.8 }, { x: 0.9, y: 0 }, { x: -1, y: 0.1 }, { x: 0.3, y: 0.8 }, { x: 0.9, y: -0.05 }];
      look = frozen ? LOOKCAM : post ? 'tv' : seq[Math.floor(t / 0.3) % seq.length];
    } else if (who === 'maya') {
      list = [[0, 'slump'], [1.1, 'shrug'], [1.8, 'idle'], [T_SNAP, 'lean'], [3.7, 'cheer']];
      face = frozen ? 'bored' : post ? (t < 4.0 ? 'wow' : 'joy') : (t < 1.1 ? 'bored' : t < 1.8 ? 'confused' : 'bored');
      look = frozen ? LOOKCAM : post ? 'tv' : (t < 0.8 ? { x: 0.9, y: 0 } : { x: 0.3, y: 0.3 });
    } else {
      list = [[0, 'point'], [T_SNAP, 'lean'], [3.7, 'cheer']];
      face = frozen ? 'bored' : post ? (t < 4.0 ? 'wow' : 'joy') : (t < 1.5 ? 'worried' : 'bored');
      look = frozen ? LOOKCAM : post ? 'tv' : { x: -0.2, y: 0.2 };
    }
    return { t: pt, blend: STAGE(list, t), face, look, tvSide: 1 };
  }
  const SEAT = () => P.sofaSeat(SOFA.x, SOFA.y, SOFA.s, 1);
  function people(ctx, t, layer) {
    if (layer === 'back') {
      P.person(ctx, 'maya', 330, 748, 1.02, { ...personArgs('maya', t) });
      const tom = P.person(ctx, 'tom', 930, 716, 1.2, { flip: true, ...personArgs('tom', t) });
      if (tom) { const r = t < T_SNAP ? -0.25 : 0; P.tablet(ctx, tom.handR[0] - 20, tom.handR[1] - 70, 0.5, 0.2, TABLET_UI(t), { spill: '#7fe0a8', spillAlpha: 0 }); }
      P.sofaBack(ctx, SOFA.x, SOFA.y, SOFA.s);
    } else if (layer === 'mid') {
      const st = SEAT(), a = personArgs('yoni', t);
      const r = P.person(ctx, 'yoni', st.x, st.y + 18, 1.08, { seated: true, ...a });
      // popcorn bucket on the lap side? phone in left hand
      if (r) {
        P.phone(ctx, r.handL[0] - 6, r.handL[1] - 28, 0.42, -0.25 + 0.1 * Math.sin(t * 5), PHONE_UI(t), { spill: '#FFA050', spillAlpha: 0 });
        if (t < T_REMOTE_DROP) P.remote(ctx, r.handR[0] + 6, r.handR[1] - 20, 1.0, 0.5 + 0.2 * Math.sin(t * 12) * (t < T_FREEZE ? 1 : 0), { t });
      }
      P.sofaFront(ctx, SOFA.x, SOFA.y, SOFA.s);
      if (t >= T_REMOTE_DROP) { // remote falls, bounces
        const a0 = personArgs('yoni', T_REMOTE_DROP);
        ctx.save(); ctx.globalAlpha = 0; const r0 = P.person(ctx, 'yoni', st.x, st.y + 18, 1.08, { seated: true, ...a0 }); ctx.restore();
        const dt = t - T_REMOTE_DROP, fy = 960, x0 = r0.handR[0] + 6, y0 = r0.handR[1] - 20, g = 4200;
        const tHit = Math.sqrt(2 * (fy - y0) / g), vy = g * tHit;
        let y;
        if (dt < tHit) y = y0 + 0.5 * g * dt * dt; else { const d2 = dt - tHit, v2 = vy * 0.32, tb = 2 * v2 / g; y = d2 < tb ? fy - (v2 * d2 - 0.5 * g * d2 * d2) : fy; }
        const rot = 0.5 + Math.min(dt, tHit + 0.3) * 5;
        ctx.save(); ctx.fillStyle = 'rgba(8,4,26,0.3)'; A.ellipse(ctx, x0 + 10, fy + 30, 22, 7); ctx.fill(); ctx.restore();
        P.remote(ctx, x0 + dt * 40, y, 1.0, rot, { t });
      }
    } else if (layer === 'front') { /* nothing */ }
  }
  const T_REMOTE_DROP = 3.85;

  // ---------------------------------------------------------------- camera
  function cam(t) {
    const TS = T_SNAP + 0.4;
    const x = A.key(t, [[0, 1130], [0.9, 760, 'out'], [T_FREEZE, 700, 'inOut'], [T_SNAP, 640, 'inOut'], [TS, 960, 'out'], [T_BURST + 0.15, 1020, 'inOut'], [4.3, 1360, 'inOut'], [T_END, L.tv.x, 'in']]);
    const y = A.key(t, [[0, 640], [0.9, 590, 'out'], [T_FREEZE, 560], [T_SNAP, 540, 'inOut'], [TS, 540, 'out'], [T_BURST + 0.15, 520, 'inOut'], [4.3, 450, 'inOut'], [T_END, L.tv.y, 'in']]);
    const zoom = A.key(t, [[0, 1.6], [0.9, 1.3, 'out'], [T_FREEZE - 0.01, 1.34, 'lin'], [T_FREEZE + 0.12, 1.47, 'out'], [T_SNAP, 1.58, 'lin'], [TS, 1.0, 'outBack'], [T_BURST + 0.15, 1.04, 'inOut'], [4.3, 1.3, 'inOut'], [4.7, 2.3, 'inOut'], [T_END, 5.4, 'in']]);
    const rot = A.key(t, [[0, 0.06], [0.9, -0.012, 'out'], [T_FREEZE, 0.01], [T_SNAP, 0.0, 'inOut'], [TS, 0, 'out'], [T_BURST, 0], [T_BURST + 0.12, 0.015, 'out'], [4.3, -0.01, 'inOut'], [T_END, 0.0, 'inOut']]);
    const sh = (t > T_FREEZE && t < T_FREEZE + 0.2 ? 0.7 * (1 - inv(T_FREEZE, T_FREEZE + 0.2, t)) : 0) + (t > T_BURST && t < T_BURST + 0.6 ? 1.2 * (1 - inv(T_BURST, T_BURST + 0.6, t)) : 0) + (t > T_SNAP && t < T_SNAP + 0.3 ? 0.6 * (1 - inv(T_SNAP, T_SNAP + 0.3, t)) : 0) + (t > 4.2 ? 0.25 * inv(4.2, T_END, t) : 0);
    // keep the view inside the 1920x1080 kit room
    const hw = 960 / zoom, hh = 540 / zoom, m = 1 + Math.abs(rot) * 2;
    return { x: A.clamp(x, hw * m, 1920 - hw * m), y: A.clamp(y, hh * m, 1080 - hh * m), zoom, rot, shake: sh, t };
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's1_chaos', start: 0, end: 5.0, draw(ctx, s) {
    const t = s.t;
    if (t >= T_END) { ctx.fillStyle = GOLD_WHITE; ctx.fillRect(0, 0, 1920, 1080); return; }
    ctx.fillStyle = '#0E0B2E'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.save();
    A.camera(ctx, cam(t));
    P.room(ctx, t, { tvRect: true });
    ctx.drawImage(clutterLayer(), 0, 0);
    // evening lamp glow + TV chaos glow
            // screens flicker light (different colours) onto the room before the snap
    const chaos = 1 - A.smooth(T_SNAP - 0.1, T_SNAP + 0.3, t);
    A.glow(ctx, L.tv.x, L.tv.y + 100, 720, 'rgba(255,60,80,0.9)', 0.32 * chaos);
    A.glow(ctx, L.old.x, L.old.y + 60, 480, 'rgba(60,120,255,0.9)', 0.36 * chaos);
    A.glow(ctx, L.lap.x, L.lap.y - 60, 420, 'rgba(180,80,255,0.9)', 0.36 * chaos);

    // shadow of sofa etc handled by kit
    people(ctx, t, 'back');
    otherDevices(ctx, t);
    const arrived = t >= T_SNAP ? TORN.length + CARDS.length : 0;
    bigTV(ctx, t, arrived);
    notes(ctx, t);
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
    const bf = t >= T_BURST ? 1 - inv(T_BURST, T_BURST + 0.28, t) : 0; if (bf > 0) { ctx.fillStyle = `rgba(255,250,235,${0.6 * bf})`; ctx.fillRect(0, 0, 1920, 1080); }
    // final wash to gold-white
    const w = A.ease.in(inv(T_WASH, T_END - 0.06, t)); if (w > 0) { ctx.fillStyle = GOLD_WHITE; ctx.globalAlpha = w; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
  } });
})();
