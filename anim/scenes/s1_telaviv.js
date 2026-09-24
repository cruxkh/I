// ============================================================================
// S1 · "The broadcast" · global 0.0 - 6.2
// Night DRONE shot over Tel Aviv (custom aerial perspective): high over the city, flying forward and
// descending onto the floodlit stadium, arriving slowly over the centre circle (Maccabi on the ball);
// tilt/whip up to the IPTV mast (journey kit panorama) -> packets launch over the sea (Bit's gold glint)
// -> streak/flash into S2. Deterministic: pure function of t.
// ============================================================================
(() => {
  const { clamp, lerp, key, inv, smooth, ease, hash: H } = A;
  const T = A.TLV;

  // scratch buffer for smear / motion-blur compositing (redrawn every frame, no state carried)
  let BUF = null;
  const buf = () => { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = 1920; BUF.height = 1080; } return BUF; };

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

  function zoomBlur(ctx, amt) {
    const b = buf(), g = b.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 3; i++) { const s = 1 + amt * i / 3; ctx.globalAlpha = 0.28 / (i + 0.6); ctx.drawImage(b, 960 - 960 * s, 540 - 540 * s, 1920 * s, 1080 * s); }
    ctx.restore();
  }
  // wide-angle lens feel: darker, slightly cooler corners
  function lens(ctx) {
    const v = A.layer('s1-lens', 1920, 1080, (g, w, h) => { g.fillStyle = A.radial(g, w / 2, h / 2, h * 0.55, h * 1.15, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(8,4,30,0.5)']]); g.fillRect(0, 0, w, h); });
    ctx.drawImage(v, 0, 0);
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

  // ==========================================================================================
  //  AERIAL DRONE ENGINE (S1 shot A): a real pinhole camera over a metric Tel Aviv (1 unit = 1 m).
  //  x = east, y = north, z = up. Stadium centre at (0,0); sea to the west. The ground is a set of
  //  cached textures (3 resolutions) drawn as perspective strips ("mode 7"); buildings, towers, the
  //  stadium bowl, floodlights, pitch and players are live projected geometry.
  // ==========================================================================================
  const AER = (() => {
    const FOC = 1304;                                     // focal length px (vertical FOV 45 deg)
    const mul = seed => { let a = (Math.floor(seed * 2654435761) >>> 0) ^ 0x9e3779b9; return () => { a = (a + 0x6D2B79F5) >>> 0; let q = a; q = Math.imul(q ^ (q >>> 15), q | 1); q ^= q + Math.imul(q ^ (q >>> 7), q | 61); return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }; };
    let C = null;
    function setCam(px, py, pz, yaw, pitch) {
      const hx = Math.sin(yaw), hy = -Math.cos(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      C = { pitch, px, py, pz, Fx: cp * hx, Fy: cp * hy, Fz: -sp, Rx: hy, Ry: -hx, Ux: sp * hx, Uy: sp * hy, Uz: cp };
      return C;
    }
    // world -> screen [sx, sy, depth] (null if behind)
    const P = (x, y, z) => {
      const dx = x - C.px, dy = y - C.py, dz = z - C.pz, d = dx * C.Fx + dy * C.Fy + dz * C.Fz;
      if (d < 0.5) return null;
      const k = FOC / d;
      return [960 + (dx * C.Rx + dy * C.Ry) * k, 540 - (dx * C.Ux + dy * C.Uy + dz * C.Uz) * k, d];
    };
    // screen -> point on horizontal plane z
    const G = (sx, sy, z) => {
      const a = (sx - 960) / FOC, b = -(sy - 540) / FOC;
      const dx = C.Fx + a * C.Rx + b * C.Ux, dy = C.Fy + a * C.Ry + b * C.Uy, dz = C.Fz + b * C.Uz;
      if (dz > -1e-3) return null;
      const k = (z - C.pz) / dz;
      return [C.px + dx * k, C.py + dy * k];
    };

    // 3D polygon -> clipped (near plane) screen path; returns false if nothing is in front
    function polyPath(ctx, pts, near = 1) {
      const cp = pts.map(([x, y, z]) => { const dx = x - C.px, dy = y - C.py, dz = z - C.pz; return [dx * C.Rx + dy * C.Ry, dx * C.Ux + dy * C.Uy + dz * C.Uz, dx * C.Fx + dy * C.Fy + dz * C.Fz]; });
      const out = [], n = cp.length;
      for (let i = 0; i < n; i++) {
        const a = cp[i], b = cp[(i + 1) % n], ia = a[2] >= near, ib = b[2] >= near;
        if (ia) out.push(a);
        if (ia !== ib) { const k = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), near]); }
      }
      if (out.length < 3) return false;
      ctx.beginPath(); out.forEach(([x, y, d], i) => { const sx = 960 + x * FOC / d, sy = 540 - y * FOC / d; i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.closePath();
      return true;
    }
    // ------------------------------------------------------------------ geography
    const coastX = y => -520 - 0.12 * y + 18 * Math.sin(y / 180);
    const STAD = { hx: 150, hy: 126 };                      // stadium precinct half extents
    const inPrecinct = (x, y, m = 0) => Math.abs(x) < STAD.hx + m && Math.abs(y) < STAD.hy + m;
    const AYA = [560, 628];                                 // Ayalon highway x range
    const AZSITE = [235, 385, 395, 615];                    // Azrieli site x0,x1,y0,y1
    const PARKS = [[40, 230, 690, 860], [-420, -250, 880, 1080], [620, 900, -240, 40]];
    const inPark = (x, y) => PARKS.some(p => x > p[0] && x < p[1] && y > p[2] && y < p[3]);
    const AV = []; for (let k = 0; k < 20; k++) { const x = -330 + k * 105; if (x > AYA[0] - 40 && x < AYA[1] + 40) continue; AV.push({ x, w: x === -330 + 5 * 105 ? 30 : 14 }); }
    const CR = []; for (let j = 0; j < 30; j++) CR.push({ y: -700 + j * 82, w: 12 });
    const EXT = [-1500, -800, 1700, 1600];                  // world extent of the city model

    // buildings: generic prisms {pts:[[x,y]..] CCW, h, roof, seed, kind, cx, cy}
    const B = [];
    (() => {
      const r = mul(5401);
      const roofs = ['#34306a', '#3d3a74', '#2d2a5e', '#47437e', '#2a2754', '#6a66a0', '#3a3670', '#5a5690'];
      const rect = (x0, y0, x1, y1, h, kind) => B.push({ pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], h, roof: roofs[Math.floor(r() * roofs.length)], seed: r() * 1000, kind: kind || 'res', cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rect: [x0, y0, x1, y1] });
      for (let i = 0; i < AV.length - 1; i++) for (let j = 0; j < CR.length - 1; j++) {
        const bx0 = AV[i].x + AV[i].w / 2 + 3, bx1 = AV[i + 1].x - AV[i + 1].w / 2 - 3;
        const by0 = CR[j].y + CR[j].w / 2 + 3, by1 = CR[j + 1].y - CR[j + 1].w / 2 - 3;
        if (bx1 - bx0 < 20) continue;
        const nx = bx1 - bx0 > 110 ? 3 : 2, ny = 2 + (r() < 0.4 ? 1 : 0);
        for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
          const lx0 = lerp(bx0, bx1, a / nx), lx1 = lerp(bx0, bx1, (a + 1) / nx), ly0 = lerp(by0, by1, b / ny), ly1 = lerp(by0, by1, (b + 1) / ny);
          const cx = (lx0 + lx1) / 2, cy = (ly0 + ly1) / 2;
          if (cx < coastX(cy) + 110 || inPrecinct(cx, cy, 10) || inPark(cx, cy) || (cx > AZSITE[0] && cx < AZSITE[1] && cy > AZSITE[2] && cy < AZSITE[3])) { r(); r(); r(); r(); continue; }
          if (r() < 0.07) { r(); r(); r(); continue; }              // an empty lot / garden
          const sx = 2 + r() * 5, sy = 2 + r() * 5;
          const dStad = Math.hypot(cx, cy), q = r();
          let h = 11 + Math.floor(r() * 3) * 3.3;                     // 3-5 storey Bauhaus
          if (q < 0.1) h = 26 + r() * 22; else if (q < 0.13 && dStad > 330) h = 60 + r() * 70;
          rect(lx0 + sx, ly0 + sy, lx1 - sx * (0.5 + r()), ly1 - sy * (0.5 + r()), h, h > 55 ? 'tower' : 'res');
        }
      }
      // beachfront hotels
      for (let y = -660; y < 1500; y += 58) {
        const x0 = coastX(y + 20) + 102, x1 = Math.min(x0 + 26 + r() * 14, -330 - 12);
        if (x1 - x0 < 14) { r(); continue; }
        rect(x0, y + 4, x1, y + 36 + r() * 12, 45 + r() * 60, 'hotel');
      }
      // Azrieli mall base
      rect(245, 405, 378, 605, 22, 'mall');
    })();
    // Azrieli towers: round, triangular, square
    const AZ = (() => {
      const round = [], N = 28, cx = 282, cy = 560, R = 25;
      for (let i = 0; i < N; i++) { const a = (i / N) * A.TAU; round.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
      const tcx = 338, tcy = 505, s = 58, tri = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * A.TAU / 3 + 0.3; return [tcx + Math.cos(a) * s / Math.sqrt(3), tcy + Math.sin(a) * s / Math.sqrt(3)]; });
      const qx = 292, qy = 448, sq = [[qx - 22, qy - 22], [qx + 22, qy - 22], [qx + 22, qy + 22], [qx - 22, qy + 22]];
      return [
        { pts: round, h: 187, kind: 'glass', cx, cy, seed: 1, roof: '#3b3a6e', crown: 1 },
        { pts: tri, h: 169, kind: 'glass', cx: tcx, cy: tcy, seed: 2, roof: '#3b3a6e', crown: 1 },
        { pts: sq, h: 154, kind: 'glass', cx: qx, cy: qy, seed: 3, roof: '#3b3a6e', crown: 1 },
      ];
    })();
    for (const z of AZ) B.push(z);
    // spatial buckets for culling
    const CELL = 150, BK = new Map();
    for (const b of B) { const k = Math.floor(b.cx / CELL) + ',' + Math.floor(b.cy / CELL); if (!BK.has(k)) BK.set(k, []); BK.get(k).push(b); }

    // ------------------------------------------------------------------ sprites & patterns
    const sprite = (key, col, size = 64) => A.layer('s1a-spr-' + key, size, size, (g, w) => {
      g.fillStyle = A.radial(g, w / 2, w / 2, 0, w / 2, [[0, col], [0.35, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.35) + ')')], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, w);
    });
    const SPR = () => ({
      sodium: sprite('sod', 'rgba(255,170,80,1)'), warm: sprite('warm', 'rgba(255,236,190,1)'), white: sprite('wht', 'rgba(255,255,255,1)'),
      red: sprite('red', 'rgba(255,50,60,1)'), cyan: sprite('cyn', 'rgba(90,240,255,1)'), tail: sprite('tail', 'rgba(255,40,60,1)'),
    });
    const winTile = (key, base, litP, warm) => A.layer('s1a-win-' + key, 128, 128, (g, w, h) => {
      const r = mul(key.length * 77 + litP * 100);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let yy = 4; yy < h; yy += 26) for (let xx = 3; xx < w; xx += 16) {
        const lit = r() < litP, c = warm[Math.floor(r() * warm.length)];
        g.fillStyle = lit ? c : 'rgba(20,18,50,0.9)'; g.fillRect(xx, yy, 10, 12);
        if (lit) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(xx, yy, 10, 3); }
      }
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let yy = 0; yy < h; yy += 26) g.fillRect(0, yy + 20, w, 3);
    });
    const glassTile = () => A.layer('s1a-glass', 128, 128, (g, w, h) => {
      const r = mul(99);
      g.fillStyle = A.linear(g, 0, 0, w, 0, [[0, '#2c3a7a'], [0.5, '#3d4d96'], [1, '#2a3572']]); g.fillRect(0, 0, w, h);
      for (let yy = 1; yy < h; yy += 8) for (let xx = 1; xx < w; xx += 6) {
        const v = r(); g.fillStyle = v < 0.45 ? (r() < 0.75 ? '#ffe2a0' : '#bfe6ff') : v < 0.62 ? 'rgba(160,190,255,0.55)' : 'rgba(10,14,50,0.5)'; g.fillRect(xx, yy, 4, 5);
      }
      g.fillStyle = 'rgba(200,220,255,0.18)'; for (let yy = 0; yy < h; yy += 32) g.fillRect(0, yy, w, 2);
    });
    // crowd tiles: 128 x 64 px = 16 m (around the ring) x 8 m (up the slope), 8 px/m
    const crowdTile = (away, up) => A.layer(`s1a-crowd-${away ? 1 : 0}${up ? 1 : 0}`, 256, 128, (g, w, h) => {
      g.scale(2, 2); w /= 2; h /= 2;
      const r = mul(away * 10 + 3), r2 = mul(up * 7 + away + 11);
      g.fillStyle = '#231d4a'; g.fillRect(0, 0, w, h);
      for (let row = 0; row < 10; row++) {
        const y = 3 + row * 6.4; g.fillStyle = row % 2 ? 'rgba(255,210,31,0.12)' : 'rgba(31,79,191,0.18)'; g.fillRect(0, y + 2.2, w, 1.4);
        for (let x = 1 + (row % 2) * 2; x < w; x += 4.4) {
          const v = r();
          if (v < 0.04) continue;
          let shirt;
          if (away) shirt = v < 0.6 ? '#e0322c' : v < 0.85 ? '#ffffff' : '#b8201a';
          else shirt = v < 0.62 ? (r() < 0.5 ? '#ffd21f' : '#ffc400') : v < 0.84 ? '#2a5fd6' : v < 0.93 ? '#ffffff' : '#ffe04d';
          const jx = (r2() - 0.5) * 0.8, lift = up ? -1.2 : 0;
          g.fillStyle = shirt; g.fillRect(x + jx - 1.5, y + lift, 3.2, 2.6);
          g.fillStyle = ['#c98f65', '#8a5a3c', '#e0b08a', '#3a2418'][Math.floor(r() * 4)]; g.fillRect(x + jx - 0.9, y - 1.5 + lift, 1.9, 1.7);
          if (up && r2() < 0.55) { g.fillStyle = r2() < 0.5 ? '#ffd21f' : '#2a5fd6'; g.fillRect(x + jx - 2.2, y - 3.6, 4.6, 1.2); }
        }
      }
    });

    // ------------------------------------------------------------------ ground textures
    function drawGround(g, x0, y0, x1, y1, s) {
      const r = mul(Math.round(s * 13));
      g.fillStyle = '#110d28'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      const spr = SPR();
      const glowAt = (img, x, y, rad, a) => { g.globalAlpha = a; g.drawImage(img, x - rad, y - rad, rad * 2, rad * 2); g.globalAlpha = 1; };
      // sea + beach (polygons sampled along the coast)
      const band = (off0, off1, fill) => {
        g.beginPath();
        for (let y = y0 - 20; y <= y1 + 20; y += 10) g.lineTo(coastX(y) + off0, y);
        for (let y = y1 + 20; y >= y0 - 20; y -= 10) g.lineTo(coastX(y) + off1, y);
        g.closePath(); g.fillStyle = fill; g.fill();
      };
      band(-3000, 0, '#0b1a44');
      // sea depth gradient + moon sheen
      g.save(); band(-3000, 0, 'rgba(0,0,0,0)'); g.clip();
      g.fillStyle = A.linear(g, -560, 0, -1500, 0, [[0, '#17336a'], [0.25, '#10265a'], [1, '#081334']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = A.linear(g, 0, -400, 0, 900, [[0, 'rgba(160,170,255,0)'], [0.5, 'rgba(190,190,255,0.10)'], [1, 'rgba(160,170,255,0)']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let i = 0; i < 2600 * Math.min(1, s); i++) {
        const y = lerp(y0, y1, r()), x = coastX(y) - 20 - r() * 1400, L = 6 + r() * 26;
        g.fillStyle = `rgba(150,170,255,${0.04 + r() * 0.1})`; g.fillRect(x, y, L, Math.max(0.6, 1 / s));
      }
      g.restore();
      band(0, 55, '#5a4b72');
      band(0, 12, '#6b5a84');
      band(40, 55, '#7a6590');
      band(55, 70, '#3c3368');                // promenade
      band(70, 92, '#241e46');                // coast road
      band(92, 99, '#2b2555');
      // promenade lamps
      for (let y = y0; y < y1; y += 24) glowAt(spr.sodium, coastX(y) + 62, y, 11, 0.55);
      for (let y = y0; y < y1; y += 30) { glowAt(spr.sodium, coastX(y) + 73, y, 9, 0.4); glowAt(spr.sodium, coastX(y) + 90, y + 15, 9, 0.4); }
      // lifeguard huts / beach umbrellas
      for (let y = y0 - (y0 % 160); y < y1; y += 160) { g.fillStyle = '#d8d0ea'; g.fillRect(coastX(y) + 28, y, 5, 5); g.fillStyle = '#e0322c'; g.fillRect(coastX(y) + 28, y + 5, 5, 1.5); }
      // city: roads
      const cityClip = () => { g.beginPath(); for (let y = y0 - 20; y <= y1 + 20; y += 10) g.lineTo(coastX(y) + 99, y); g.lineTo(x1 + 50, y1 + 20); g.lineTo(x1 + 50, y0 - 20); g.closePath(); };
      g.save(); cityClip(); g.clip();
      // sidewalk tone for all blocks, then roads on top
      g.fillStyle = '#1c1740'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let i = 0; i < AV.length - 1; i++) for (let j = 0; j < CR.length - 1; j++) {
        const bx0 = AV[i].x + AV[i].w / 2 + 3, bx1 = AV[i + 1].x - AV[i + 1].w / 2 - 3, by0 = CR[j].y + CR[j].w / 2 + 3, by1 = CR[j + 1].y - CR[j + 1].w / 2 - 3;
        if (bx1 < x0 || bx0 > x1 || by1 < y0 || by0 > y1) continue;
        g.fillStyle = '#121a2c'; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);                // courtyards / gardens
        const nt = Math.round((bx1 - bx0) * (by1 - by0) / 90);
        for (let k = 0; k < nt; k++) { const x = lerp(bx0, bx1, r()), y = lerp(by0, by1, r()), rr = 2 + r() * 3.5; g.fillStyle = r() < 0.5 ? '#15302c' : '#1a3a33'; A.ellipse(g, x, y, rr, rr); g.fill(); g.fillStyle = 'rgba(90,150,130,0.25)'; A.ellipse(g, x - rr * 0.3, y + rr * 0.3, rr * 0.45, rr * 0.45); g.fill(); }
      }
      g.fillStyle = '#2a1f3c';
      for (const a of AV) g.fillRect(a.x - a.w / 2, y0, a.w, y1 - y0);
      for (const c of CR) g.fillRect(x0, c.y - c.w / 2, x1 - x0, c.w);
      // boulevard trees (wide avenue)
      for (const a of AV) if (a.w > 20) { g.fillStyle = '#1b3130'; g.fillRect(a.x - 5, y0, 10, y1 - y0); for (let y = y0; y < y1; y += 7) { g.fillStyle = r() < 0.5 ? '#173a30' : '#1f4a3a'; A.ellipse(g, a.x + (r() - 0.5) * 4, y, 3.6, 3.6); g.fill(); } }
      // Ayalon highway
      g.fillStyle = '#1b1638'; g.fillRect(AYA[0], y0, AYA[1] - AYA[0], y1 - y0);
      g.fillStyle = '#2a2250'; g.fillRect(AYA[0] + 30, y0, 8, y1 - y0);
      g.strokeStyle = 'rgba(200,190,255,0.25)'; g.lineWidth = 0.4; g.setLineDash([4, 6]);
      for (const lx of [AYA[0] + 8, AYA[0] + 16, AYA[0] + 23, AYA[0] + 45, AYA[0] + 52, AYA[0] + 60]) { g.beginPath(); g.moveTo(lx, y0); g.lineTo(lx, y1); g.stroke(); }
      g.setLineDash([]);
      for (let y = y0; y < y1; y += 45) { glowAt(spr.sodium, AYA[0] + 34, y, 26, 0.35); }
      // lane dashes on avenues
      g.strokeStyle = 'rgba(200,190,255,0.16)'; g.lineWidth = 0.35; g.setLineDash([3, 5]);
      for (const a of AV) { g.beginPath(); g.moveTo(a.x, y0); g.lineTo(a.x, y1); g.stroke(); }
      g.setLineDash([]);
      // crossings: zebra hints
      // street lamps (sodium pools)
      for (const a of AV) for (let y = y0 - (y0 % 28); y < y1; y += 28) { glowAt(spr.sodium, a.x - a.w / 2 + 1, y, 13, 0.55); glowAt(spr.sodium, a.x + a.w / 2 - 1, y + 14, 13, 0.55); }
      for (const c of CR) for (let x = x0 - (x0 % 30); x < x1; x += 30) glowAt(spr.sodium, x, c.y - c.w / 2 + 1, 12, 0.5);
      // parks
      for (const p of PARKS) {
        if (p[1] < x0 || p[0] > x1 || p[3] < y0 || p[2] > y1) continue;
        g.fillStyle = '#152a2a'; g.fillRect(p[0], p[2], p[1] - p[0], p[3] - p[2]);
        g.strokeStyle = '#3a3260'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0], p[2]); g.quadraticCurveTo((p[0] + p[1]) / 2, p[3] + 40, p[1], p[2] + 30); g.stroke();
        for (let k = 0; k < (p[1] - p[0]) * (p[3] - p[2]) / 40; k++) { const x = lerp(p[0], p[1], r()), y = lerp(p[2], p[3], r()), rr = 2.5 + r() * 4; g.fillStyle = r() < 0.5 ? '#113026' : '#1b4232'; A.ellipse(g, x, y, rr, rr); g.fill(); g.fillStyle = 'rgba(120,200,160,0.18)'; A.ellipse(g, x - rr * 0.3, y + rr * 0.3, rr * 0.4, rr * 0.4); g.fill(); }
        for (let k = 0; k < 14; k++) glowAt(spr.warm, lerp(p[0], p[1], r()), lerp(p[2], p[3], r()), 7, 0.45);
      }
      // stadium precinct: plaza + car parks + tree ring
      g.fillStyle = '#1a1538'; A.rrect(g, -STAD.hx, -STAD.hy, STAD.hx * 2, STAD.hy * 2, 20); g.fill();
      for (const [px0, py0, pw, ph] of [[-146, -120, 36, 70], [110, 40, 36, 78], [110, -120, 36, 62]]) {
        g.fillStyle = '#17122f'; g.fillRect(px0, py0, pw, ph);
        g.strokeStyle = 'rgba(210,200,255,0.3)'; g.lineWidth = 0.25;
        for (let yy = py0 + 3; yy < py0 + ph; yy += 6) { for (let xx = px0 + 2; xx < px0 + pw; xx += 2.6) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 4.5); g.stroke(); } }
        for (let k = 0; k < 40; k++) { const cx = px0 + 3 + Math.floor(r() * (pw - 6) / 2.6) * 2.6 + 1.3, cy = py0 + 3 + Math.floor(r() * ph / 6) * 6 + 2.2; if (cy > py0 + ph - 3) continue; g.fillStyle = ['#8a88b0', '#3a4a8a', '#b8b0d0', '#7a2a3a', '#2a2a40'][Math.floor(r() * 5)]; A.rrect(g, cx - 0.9, cy - 2, 1.8, 4, 0.5); g.fill(); }
        for (let k = 0; k < 6; k++) glowAt(spr.warm, px0 + (k % 3 + 0.5) * pw / 3, py0 + (Math.floor(k / 3) + 0.5) * ph / 2, 14, 0.4);
      }
      // plaza paving + fans streaming to the gates + kiosks
      g.strokeStyle = 'rgba(160,150,220,0.10)'; g.lineWidth = 0.3;
      for (let x = -STAD.hx; x < STAD.hx; x += 6) { g.beginPath(); g.moveTo(x, -STAD.hy); g.lineTo(x, STAD.hy); g.stroke(); }
      for (let y = -STAD.hy; y < STAD.hy; y += 6) { g.beginPath(); g.moveTo(-STAD.hx, y); g.lineTo(STAD.hx, y); g.stroke(); }
      if (s > 2) for (let k = 0; k < 900; k++) {
        const a = r() * A.TAU, rr = 104 + Math.pow(r(), 2) * 30, x = Math.cos(a) * rr * 1.08, y = Math.sin(a) * rr * 0.9;
        g.fillStyle = r() < 0.6 ? '#ffd21f' : r() < 0.6 ? '#2a5fd6' : '#e8e4ff'; g.fillRect(x, y, 0.55, 0.55);
      }
      for (let k = 0; k < 8; k++) { const a = (k / 8) * A.TAU + 0.3, x = Math.cos(a) * 124, y = Math.sin(a) * 104; g.fillStyle = '#ffe4a6'; g.fillRect(x - 2, y - 1.5, 4, 3); glowAt(spr.warm, x, y, 10, 0.5); }
      for (let k = 0; k < 90; k++) { const a = (k / 90) * A.TAU, x = Math.cos(a) * 118, y = Math.sin(a) * 100; g.fillStyle = k % 2 ? '#10241f' : '#163a2c'; A.ellipse(g, x, y, 3.2, 3.2); g.fill(); g.fillStyle = 'rgba(120,200,150,0.18)'; A.ellipse(g, x - 1, y + 1, 1.3, 1.3); g.fill(); }
      // light spill around the stadium
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = A.radial(g, 0, 0, 80, 260, [[0, 'rgba(255,230,170,0.22)'], [1, 'rgba(255,230,170,0)']]); g.fillRect(-270, -270, 540, 540);
      g.globalCompositeOperation = 'source-over';
      // building ambient occlusion
      g.fillStyle = 'rgba(6,4,18,0.6)';
      for (const b of B) { if (b.cx < x0 - 60 || b.cx > x1 + 60 || b.cy < y0 - 60 || b.cy > y1 + 60) continue; g.beginPath(); b.pts.forEach((p, i) => { const dx = p[0] - b.cx, dy = p[1] - b.cy, l = Math.hypot(dx, dy) || 1; i ? g.lineTo(p[0] + dx / l * 2.5, p[1] + dy / l * 2.5) : g.moveTo(p[0] + dx / l * 2.5, p[1] + dy / l * 2.5); }); g.closePath(); g.fill(); }
      g.restore();
    }
    const TEX = [
      { key: 'lo', x0: -1500, y0: -800, x1: 1500, y1: 1600, s: 0.9 },
      { key: 'mid', x0: -520, y0: -320, x1: 520, y1: 820, s: 2.6 },
      { key: 'hi', x0: -195, y0: -165, x1: 195, y1: 165, s: 7 },
    ];
    const tex = L => A.layer('s1a-ground-' + L.key, Math.ceil((L.x1 - L.x0) * L.s), Math.ceil((L.y1 - L.y0) * L.s), g => {
      g.setTransform(L.s, 0, 0, -L.s, -L.x0 * L.s, L.y1 * L.s);
      drawGround(g, L.x0, L.y0, L.x1, L.y1, L.s);
    });
    // draw a texture on the ground plane with perspective strips
    function groundPass(ctx, L, strips = 34, cols = 4) {
      const img = tex(L), s = L.s;
      const Y0 = -140, Y1 = 1220, X0 = -260, X1 = 2180, CW = (X1 - X0) / cols;
      const tx = g => [(g[0] - L.x0) * s, (L.y1 - g[1]) * s];
      let prev = null;
      for (let i = 0; i <= strips; i++) {
        const y = lerp(Y0, Y1, i / strips), row = [];
        for (let c = 0; c <= cols; c++) { const g = G(X0 + c * CW, y, 0); row.push(g ? tx(g) : null); }
        if (prev) {
          const ya = lerp(Y0, Y1, (i - 1) / strips), Hh = y - ya;
          for (let c = 0; c < cols; c++) {
            const tA = prev.row[c], tB = prev.row[c + 1], tC = row[c], tD = row[c + 1];
            if (!tA || !tB || !tC || !tD) continue;
            // affine fit through the cell centre: use averaged edge vectors (error split over all 4 corners)
            const e1x = (tB[0] - tA[0] + tD[0] - tC[0]) / 2, e1y = (tB[1] - tA[1] + tD[1] - tC[1]) / 2;
            const e2x = (tC[0] - tA[0] + tD[0] - tB[0]) / 2, e2y = (tC[1] - tA[1] + tD[1] - tB[1]) / 2;
            const det = e1x * e2y - e1y * e2x; if (Math.abs(det) < 1e-6) continue;
            const a = CW * e2y / det, cc = -CW * e2x / det, b = -Hh * e1y / det, d = Hh * e1x / det;
            const mx = (tA[0] + tB[0] + tC[0] + tD[0]) / 4, my = (tA[1] + tB[1] + tC[1] + tD[1]) / 4;
            const sx0 = X0 + (c + 0.5) * CW, sy0 = ya + Hh / 2;
            const e = sx0 - (a * mx + cc * my), f = sy0 - (b * mx + d * my);
            ctx.save(); ctx.beginPath(); ctx.rect(X0 + c * CW - 0.6, ya - 0.6, CW + 1.2, Hh + 1.2); ctx.clip();
            ctx.transform(a, b, cc, d, e, f); ctx.drawImage(img, 0, 0);
            ctx.restore();
          }
        }
        prev = { row };
      }
    }
    // does the texture cover the whole view on the ground?
    const covers = (L, vb) => vb[0] > L.x0 && vb[2] < L.x1 && vb[1] > L.y0 && vb[3] < L.y1;
    function viewBox() {
      const pts = [[-260, -140], [2180, -140], [2180, 1220], [-260, 1220]].map(([x, y]) => G(x, y, 0)).filter(Boolean);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }

    // ------------------------------------------------------------------ live: cars
    const CARS = (() => {
      const r = mul(77), a = [];
      for (const av of AV) for (let k = 0; k < 16; k++) a.push({ ax: 'y', c: av.x + (k % 2 ? 2.8 : -2.8), dir: k % 2 ? 1 : -1, ph: r() * 2400, v: 11 + r() * 7, lo: -700, hi: 1600 });
      for (const cr of CR) for (let k = 0; k < 12; k++) a.push({ ax: 'x', c: cr.y + (k % 2 ? 2.5 : -2.5), dir: k % 2 ? 1 : -1, ph: r() * 3200, v: 10 + r() * 6, lo: -1500, hi: 1700 });
      for (let k = 0; k < 150; k++) { const s = k % 2 ? 1 : -1, lane = Math.floor(r() * 3); a.push({ ax: 'y', c: s > 0 ? AYA[0] + 5 + lane * 8 : AYA[0] + 43 + lane * 8, dir: s, ph: r() * 2400, v: 26 + r() * 10, lo: -700, hi: 1600 }); }
      for (let k = 0; k < 40; k++) { const s = k % 2 ? 1 : -1; a.push({ ax: 'c', off: s > 0 ? 76 : 86, dir: s, ph: r() * 2400, v: 13 + r() * 6, lo: -700, hi: 1600 }); }
      return a;
    })();
    function drawCars(ctx, t, vb) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const c of CARS) {
        const span = c.hi - c.lo, pos = c.lo + (((c.ph + t * c.v * c.dir) % span) + span) % span;
        let x, y, tx, ty;
        if (c.ax === 'y') { x = c.c; y = pos; tx = 0; ty = c.dir; } else if (c.ax === 'x') { x = pos; y = c.c; tx = c.dir; ty = 0; } else { y = pos; x = coastX(y) + c.off; tx = -0.12 * c.dir; ty = c.dir; }
        if (x < vb[0] - 30 || x > vb[2] + 30 || y < vb[1] - 30 || y > vb[3] + 30) continue;
        if (c.ax === 'x' && (x < coastX(y) + 99 || (x > AYA[0] && x < AYA[1]) || inPrecinct(x, y))) continue;
        if (c.ax === 'y' && c.c < AYA[0] && inPrecinct(x, y)) continue;
        const L = 7 + c.v * 1.1;
        const a = P(x, y, 0.8), b = P(x - tx * L, y - ty * L, 0.8);
        if (!a || !b) continue;
        const k = FOC / a[2], head = c.dir > 0;
        const w = Math.min(3, Math.max(1, 0.9 * k));
        ctx.strokeStyle = head ? 'rgba(255,240,200,0.22)' : 'rgba(255,50,70,0.3)'; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
        const m = [lerp(a[0], b[0], 0.3), lerp(a[1], b[1], 0.3)];
        ctx.strokeStyle = head ? 'rgba(255,245,215,0.6)' : 'rgba(255,60,80,0.7)'; ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
        ctx.fillStyle = head ? 'rgba(255,255,235,0.95)' : 'rgba(255,90,100,0.95)'; const s = Math.min(5, Math.max(1.4, 1.6 * k)); ctx.fillRect(a[0] - s / 2, a[1] - s / 2, s, s);
      }
      ctx.restore();
    }
    // sea: foam lines + moon glints
    function drawSea(ctx, t, vb) {
      if (vb[0] > coastX(vb[1]) + 20 && vb[0] > coastX(vb[3]) + 20) return;
      ctx.save(); ctx.lineCap = 'round';
      for (let w = 0; w < 4; w++) {
        const off = [3, 14, 30, 52][w], ph = t * 1.1 - w * 0.9;
        ctx.strokeStyle = `rgba(210,220,255,${[0.7, 0.4, 0.25, 0.15][w]})`;
        ctx.beginPath(); let started = false;
        for (let y = Math.max(vb[1] - 40, -800); y < Math.min(vb[3] + 40, 1600); y += 12) {
          const x = coastX(y) - off - 5 * Math.sin(ph + y / 55) - 3 * Math.sin(ph * 0.7 + y / 23);
          const p = P(x, y, 0); if (!p) continue;
          started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); started = true;
          ctx.lineWidth = Math.max(0.8, (1.8 - w * 0.3) * FOC / p[2]);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      const fr = Math.floor(t * 7);
      for (let i = 0; i < 260; i++) {
        const y = lerp(vb[1], vb[3], H(i * 1.7 + fr * 0.13)), cx = coastX(y);
        const x = cx - 30 - H(i * 3.1 + fr * 0.71) * 700;
        if (x < vb[0]) continue;
        const p = P(x, y, 0); if (!p) continue;
        const k = FOC / p[2], a = 0.25 + 0.6 * H(i + fr);
        ctx.fillStyle = `rgba(230,225,255,${a})`; ctx.fillRect(p[0], p[1], Math.max(1.5, 5 * k), Math.max(1, 0.6 * k));
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------ live: buildings
    const WIN = () => ({ lit: winTile('lit', '#4a4488', 0.42, ['#ffcf73', '#ffe4a6', '#ffb35c', '#fff2cf', '#bfe3ff']), dark: winTile('dark', '#2c285e', 0.34, ['#ffcf73', '#ffb35c', '#ffe4a6', '#9fd0ff']), glass: glassTile() });
    const PAT = {};
    function patterns(ctx) { if (!PAT.lit) { const w = WIN(); PAT.lit = ctx.createPattern(w.lit, 'repeat'); PAT.dark = ctx.createPattern(w.dark, 'repeat'); PAT.glass = ctx.createPattern(w.glass, 'repeat'); const c = crowdTile; PAT.c00 = ctx.createPattern(c(0, 0), 'repeat'); PAT.c01 = ctx.createPattern(c(0, 1), 'repeat'); PAT.c10 = ctx.createPattern(c(1, 0), 'repeat'); PAT.c11 = ctx.createPattern(c(1, 1), 'repeat'); } return PAT; }
    // fill quad O,U,(UV),V with a pattern mapped so pattern px (u along O->U, v along O->V) spans lu x lv pattern px
    function patQuad(ctx, pat, O, U, W, V, lu, lv, uoff = 0) {
      const a = (U[0] - O[0]) / lu, b = (U[1] - O[1]) / lu, c = (V[0] - O[0]) / lv, d = (V[1] - O[1]) / lv;
      pat.setTransform(new DOMMatrix([a, b, c, d, O[0] - a * uoff, O[1] - b * uoff]));
      ctx.fillStyle = pat; ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(U[0], U[1]); ctx.lineTo(W[0], W[1]); ctx.lineTo(V[0], V[1]); ctx.closePath(); ctx.fill();
    }
    function drawBuilding(ctx, b, t, pat) {
      const n = b.pts.length, bot = [], top = [];
      for (let i = 0; i < n; i++) { const p = b.pts[i], q = P(p[0], p[1], 0), r = P(p[0], p[1], b.h); if (!q || !r) return; bot.push(q); top.push(r); }
      const glass = b.kind === 'glass';
      let uacc = b.seed * 8;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, p = b.pts[i], q = b.pts[j];
        const ex = q[0] - p[0], ey = q[1] - p[1], len = Math.hypot(ex, ey);
        // outward normal for CCW polygon (x east, y north): (ey, -ex)
        const nx = ey / len, ny = -ex / len;
        const vis = (C.px - p[0]) * nx + (C.py - p[1]) * ny > 0;
        if (vis) {
          const west = nx < -0.3 || ny < -0.5;
          const px = Math.abs(top[i][0] - bot[i][0]) + Math.abs(top[i][1] - bot[i][1]) + Math.abs(bot[j][0] - bot[i][0]) + Math.abs(bot[j][1] - bot[i][1]);
          if (px < 5) { ctx.fillStyle = west ? '#4a4488' : '#2c285e'; ctx.beginPath(); ctx.moveTo(bot[i][0], bot[i][1]); ctx.lineTo(bot[j][0], bot[j][1]); ctx.lineTo(top[j][0], top[j][1]); ctx.lineTo(top[i][0], top[i][1]); ctx.fill(); }
          else patQuad(ctx, glass ? pat.glass : west ? pat.lit : pat.dark, bot[i], bot[j], top[j], top[i], len * 8, b.h * 8, uacc);
          if (glass && !west) { ctx.fillStyle = 'rgba(10,8,40,0.35)'; ctx.beginPath(); ctx.moveTo(bot[i][0], bot[i][1]); ctx.lineTo(bot[j][0], bot[j][1]); ctx.lineTo(top[j][0], top[j][1]); ctx.lineTo(top[i][0], top[i][1]); ctx.fill(); }
        }
        uacc += len * 8;
      }
      // roof
      ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = b.roof; ctx.fill();
      const k = FOC / top[0][2];
      if (k * 6 > 3) { ctx.strokeStyle = 'rgba(14,10,36,0.7)'; ctx.lineWidth = Math.max(0.8, 0.6 * k); ctx.stroke(); }
      // roof details: solar water heaters (panel + white tank), stair boxes, rooftop lights
      if (b.rect && k > 1.4 && b.kind !== 'mall') {
        const [x0, y0, x1, y1] = b.rect, rs = mul(b.seed), np = 1 + Math.floor(rs() * 4);
        for (let i = 0; i < np; i++) {
          const cx = lerp(x0 + 2, x1 - 3, rs()), cy = lerp(y0 + 2, y1 - 3, rs()), z = b.h;
          const q = [P(cx, cy, z + 0.3), P(cx + 2, cy, z + 0.3), P(cx + 2, cy + 1.2, z + 1.2), P(cx, cy + 1.2, z + 1.2)];
          if (q.some(v => !v)) continue;
          ctx.fillStyle = '#1e2a5a'; ctx.beginPath(); q.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(180,200,255,0.55)'; ctx.lineWidth = Math.max(0.6, 0.15 * k); ctx.stroke();
          const tk = P(cx + 1, cy + 1.7, z + 1.6);
          if (tk) { ctx.fillStyle = '#d9d4ee'; A.ellipse(ctx, tk[0], tk[1], Math.max(1, 0.55 * k), Math.max(1, 0.55 * k)); ctx.fill(); }
        }
        if (rs() < 0.5 && k > 2.5) {
          const sx = lerp(x0 + 2, x1 - 5, rs()), sy = lerp(y0 + 2, y1 - 5, rs());
          const s4 = [P(sx, sy, b.h + 2.4), P(sx + 3, sy, b.h + 2.4), P(sx + 3, sy + 3, b.h + 2.4), P(sx, sy + 3, b.h + 2.4)];
          if (!s4.some(v => !v)) { ctx.fillStyle = A.mixc(b.roof, '#ffffff', 0.15); ctx.beginPath(); s4.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill(); }
        }
      }
      if (b.h > 55) {
        const c = P(b.cx, b.cy, b.h + 2), bl = Math.pow(Math.max(0, Math.sin(t * 2.6 + b.seed)), 6);
        if (c) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = Math.max(6, 5 * k); ctx.globalAlpha = 0.3 + 0.7 * bl; ctx.drawImage(SPR().red, c[0] - r, c[1] - r, 2 * r, 2 * r); ctx.restore(); }
      }
      if (b.crown) { // Azrieli: lit crown ring + helipad
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,210,255,0.8)'; ctx.lineWidth = Math.max(1.2, 0.8 * k);
        ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
        const c = P(b.cx, b.cy, b.h + 0.2);
        if (c) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = Math.max(1, 0.4 * k); A.ellipse(ctx, c[0], c[1], 4.5 * k, 4.5 * k); ctx.stroke(); A.text(ctx, 'H', c[0], c[1], { font: `800 ${Math.max(7, 4.5 * k) | 0}px Rubik`, fill: 'rgba(255,220,120,0.9)' }); }
        const bl = Math.pow(Math.max(0, Math.sin(t * 2.6 + b.seed * 2)), 6);
        if (c) { const r = Math.max(8, 6 * k); ctx.globalAlpha = 0.35 + 0.65 * bl; ctx.drawImage(SPR().red, c[0] - r + 10 * k, c[1] - r, 2 * r, 2 * r); ctx.globalAlpha = 1; }
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------ live: stadium
    const SEG = 72, NSE = 3.2;
    const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
    const ring = (a, b, th) => [a * spow(Math.cos(th), 2 / NSE), b * spow(Math.sin(th), 2 / NSE)];
    const STD = { in: [62, 44, 2.5], out: [98, 80, 29], lip0: [95, 77, 33], lip1: [106, 88, 33] };
    const TOWERS = [[-104, -88], [104, -88], [104, 88], [-104, 88]].map(([x, y]) => ({ x, y, h: 64 }));
    const P3 = (x, y, z) => P(x, y, z);
    function drawStadium(ctx, t, roar, pat) {
      const spr = SPR();
      // pitch surround grass (inside the stands) + pitch
      drawPitch(ctx, t);
      // LED ad-board ring
      {
        ctx.save(); ctx.lineCap = 'butt';
        for (let i = 0; i < SEG; i++) {
          const a0 = (i / SEG) * A.TAU, a1 = ((i + 1) / SEG) * A.TAU;
          const p0 = ring(58.5, 40.5, a0), p1 = ring(58.5, 40.5, a1), q0 = P(p0[0], p0[1], 0.9), q1 = P(p1[0], p1[1], 0.9);
          if (!q0 || !q1) continue;
          const on = (i + Math.floor(t * 9)) % 6 < 3;
          ctx.strokeStyle = on ? '#ffd21f' : (i % 12 < 6 ? '#29f0ff' : '#2a5fd6'); ctx.lineWidth = Math.max(1.2, 0.9 * FOC / q0[2]);
          ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
        }
        ctx.restore();
      }
      // stands: sort segments far -> near; facade (outer wall) + 3 slope bands + aisles
      const uc = P(80, 0, 15), ultrasLive = !!uc && FOC / uc[2] >= 4;
      const segs = [];
      for (let i = 0; i < SEG; i++) { const th = ((i + 0.5) / SEG) * A.TAU, m = ring(80, 62, th); segs.push({ i, d: (m[0] - C.px) ** 2 + (m[1] - C.py) ** 2 }); }
      segs.sort((a, b) => b.d - a.d);
      const fr = Math.floor(t * 7);
      for (const { i } of segs) {
        const a0 = (i / SEG) * A.TAU, a1 = ((i + 1) / SEG) * A.TAU;
        const away = i >= 42 && i <= 49;
        // outer facade
        const o0 = ring(STD.out[0], STD.out[1], a0), o1 = ring(STD.out[0], STD.out[1], a1);
        const ex = o1[0] - o0[0], ey = o1[1] - o0[1];
        if ((C.px - o0[0]) * ey + (C.py - o0[1]) * -ex > 0) {
          const f = [P(o0[0], o0[1], 0), P(o1[0], o1[1], 0), P(o1[0], o1[1], STD.out[2]), P(o0[0], o0[1], STD.out[2])];
          if (!f.some(v => !v)) {
            ctx.fillStyle = '#322b66'; ctx.beginPath(); f.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
            const s0 = [P(o0[0], o0[1], 14), P(o1[0], o1[1], 14), P(o1[0], o1[1], 16.5), P(o0[0], o0[1], 16.5)];
            if (!s0.some(v => !v)) { ctx.fillStyle = i % 2 ? '#ffd21f' : '#1f4fbf'; ctx.beginPath(); s0.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill(); }
          }
        }
        // slope bands
        for (let r = 0; r < 6; r++) {
          const f0 = r / 6, f1 = (r + 1) / 6;
          const A0 = lerp(STD.in[0], STD.out[0], f0), B0 = lerp(STD.in[1], STD.out[1], f0), Z0 = lerp(STD.in[2], STD.out[2], f0);
          const A1 = lerp(STD.in[0], STD.out[0], f1), B1 = lerp(STD.in[1], STD.out[1], f1), Z1 = lerp(STD.in[2], STD.out[2], f1);
          const i0 = ring(A0, B0, a0), i1 = ring(A0, B0, a1), j0 = ring(A1, B1, a0), j1 = ring(A1, B1, a1);
          const O = P(i0[0], i0[1], Z0), U = P(i1[0], i1[1], Z0), W = P(j1[0], j1[1], Z1), V = P(j0[0], j0[1], Z1);
          if (!O || !U || !W || !V) continue;
          const ang = ((i + 0.5) / SEG) * A.TAU, inU = (ang < UTH + 0.02 || ang > A.TAU - UTH - 0.02) && ultrasLive;
          if (inU) { ctx.fillStyle = r % 2 ? '#1e1840' : '#241d4c'; ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(U[0], U[1]); ctx.lineTo(W[0], W[1]); ctx.lineTo(V[0], V[1]); ctx.closePath(); ctx.fill(); continue; }
          const up = H(i * 7.3 + r * 3.1 + fr * 0.37) < roar * 0.85;
          const pt = away ? (up ? pat.c11 : pat.c10) : (up ? pat.c01 : pat.c00);
          const lu = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]) * 16, lv = Math.hypot(j0[0] - i0[0], j0[1] - i0[1], Z1 - Z0) * 16;
          const bounce = up ? (Math.sin(t * 14 + i) * 0.5 + 0.5) * 3 : 0;
          patQuad(ctx, pt, O, U, W, V, lu, lv, i * 37 + r * 91 + bounce);
          if (r === 3) { // concourse walkway line
            ctx.strokeStyle = 'rgba(15,10,35,0.8)'; ctx.lineWidth = Math.max(1, 1.2 * FOC / O[2]); ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(U[0], U[1]); ctx.stroke();
          }
        }
        if (i % 6 === 0) { // aisle
          const i0 = ring(STD.in[0], STD.in[1], a0), j0 = ring(STD.out[0], STD.out[1], a0), O = P(i0[0], i0[1], STD.in[2]), V = P(j0[0], j0[1], STD.out[2]);
          if (O && V) { ctx.strokeStyle = 'rgba(150,140,210,0.45)'; ctx.lineWidth = Math.max(1, 1.3 * FOC / O[2]); ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(V[0], V[1]); ctx.stroke(); }
        }
        // roof lip
        const l0 = ring(STD.lip0[0], STD.lip0[1], a0), l1 = ring(STD.lip0[0], STD.lip0[1], a1), m0 = ring(STD.lip1[0], STD.lip1[1], a0), m1 = ring(STD.lip1[0], STD.lip1[1], a1);
        const R = [P(l0[0], l0[1], 33), P(l1[0], l1[1], 33), P(m1[0], m1[1], 34), P(m0[0], m0[1], 34)];
        if (!R.some(v => !v)) {
          ctx.fillStyle = '#3a3474'; ctx.beginPath(); R.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,245,215,0.85)'; ctx.lineWidth = Math.max(1, 0.35 * FOC / R[0][2]); ctx.beginPath(); ctx.moveTo(R[0][0], R[0][1]); ctx.lineTo(R[1][0], R[1][1]); ctx.stroke();
        }
      }
      drawPlayers(ctx, t);
      drawUltras(ctx, t, roar);
      // crowd camera flashes + phone lights
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const nF = 18 + Math.round(roar * 60);
      for (let q = 0; q < nF; q++) {
        const slot = Math.floor(t * 6 + H(q) * 7), ph = (t * 6 + H(q) * 7) % 1; if (ph > 0.35) continue;
        const th = H(slot * 3.7 + q * 11.1) * A.TAU, f = H(slot * 5.3 + q * 2.9);
        const pr = ring(lerp(STD.in[0], STD.out[0], f), lerp(STD.in[1], STD.out[1], f), th), p = P(pr[0], pr[1], lerp(STD.in[2], STD.out[2], f) + 1);
        if (!p) continue; const rr = Math.max(4, 2.2 * FOC / p[2]) * (1 - ph / 0.35 * 0.5);
        ctx.drawImage(spr.white, p[0] - rr, p[1] - rr, 2 * rr, 2 * rr);
      }
      ctx.restore();
      // floodlight towers
      for (const T4 of TOWERS) {
        const b = P(T4.x, T4.y, 0), top = P(T4.x, T4.y, T4.h);
        if (!b || !top) continue;
        const k = FOC / top[2];
        ctx.strokeStyle = '#141032'; ctx.lineWidth = Math.max(2, 2.4 * k); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(170,160,230,0.5)'; ctx.lineWidth = Math.max(0.8, 0.6 * k); ctx.stroke();
        // lamp head: panel facing the pitch
        const dx = -T4.x, dy = -T4.y, l = Math.hypot(dx, dy), ux = -dy / l, uy = dx / l;
        const hw = 9, P4 = [P(T4.x + ux * hw, T4.y + uy * hw, T4.h + 4), P(T4.x - ux * hw, T4.y - uy * hw, T4.h + 4), P(T4.x - ux * hw + dx / l * 3, T4.y - uy * hw + dy / l * 3, T4.h - 3), P(T4.x + ux * hw + dx / l * 3, T4.y + uy * hw + dy / l * 3, T4.h - 3)];
        if (!P4.some(v => !v)) {
          ctx.fillStyle = '#1c1740'; ctx.beginPath(); P4.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fffbe8';
          for (let q = 0; q < 12; q++) { const u = (q % 6 + 0.5) / 6, v = (Math.floor(q / 6) + 0.5) / 2; const x = lerp(lerp(P4[0][0], P4[1][0], u), lerp(P4[3][0], P4[2][0], u), v), y = lerp(lerp(P4[0][1], P4[1][1], u), lerp(P4[3][1], P4[2][1], u), v); const s = Math.max(1.2, 1.1 * k); ctx.fillRect(x - s / 2, y - s / 2, s, s); }
        }
      }
    }
    // additive: light cones + lamp blooms (drawn after everything so they sit on top)
    function drawFloodGlow(ctx, t) {
      const spr = SPR();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const T4 of TOWERS) {
        const top = P(T4.x, T4.y, T4.h); if (!top) continue;
        const k = FOC / top[2];
        // cone to the pitch quadrant
        const q = [[T4.x * 0.02, T4.y * 0.55], [T4.x * 0.55, T4.y * 0.02], [-T4.x * 0.3, -T4.y * 0.05], [-T4.x * 0.05, -T4.y * 0.3]].map(([x, y]) => P(x, y, 0));
        if (!q.some(v => !v)) {
          const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
          const kz = clamp(C.pz / 220, 0.15, 1); ctx.fillStyle = A.linear(ctx, top[0], top[1], cx, cy, [[0, `rgba(255,245,210,${0.12 * kz})`], [1, 'rgba(255,245,210,0.0)']]);
          ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(q[0][0], q[0][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.closePath(); ctx.fill();
        }
        const fl = 0.93 + 0.07 * Math.sin(t * 31 + T4.x);
        const r1 = Math.max(40, 30 * k) * fl, r2 = Math.max(16, 9 * k);
        ctx.globalAlpha = 0.55; ctx.drawImage(spr.warm, top[0] - r1, top[1] - r1, r1 * 2, r1 * 2);
        ctx.globalAlpha = 1; ctx.drawImage(spr.white, top[0] - r2, top[1] - r2, r2 * 2, r2 * 2);
        // anamorphic streak
        ctx.fillStyle = A.linear(ctx, top[0] - r1 * 3, 0, top[0] + r1 * 3, 0, [[0, 'rgba(120,170,255,0)'], [0.5, 'rgba(190,220,255,0.55)'], [1, 'rgba(120,170,255,0)']]);
        ctx.fillRect(top[0] - r1 * 3, top[1] - 1.5, r1 * 6, 3);
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------ the ULTRAS: Maccabi Tel Aviv home end (east)
    // Individual fans as cached cartoon sprites on the terraces (LOD: tiny ones are left to the crowd pattern).
    const UR = 40, UTH = 1.12;                                   // rows, half-extent of the end in ring angle
    const standAt = (th, f) => { const p = ring(lerp(STD.in[0], STD.out[0], f), lerp(STD.in[1], STD.out[1], f), th); return [p[0], p[1], lerp(STD.in[2], STD.out[2], f)]; };
    const rowF = r => 0.025 + 0.95 * (r + 0.5) / UR;
    const TIFO = { r0: 8, r1: 20, th0: -0.95, th1: -0.3 };
    const underTifo = (r, th) => r >= TIFO.r0 && r <= TIFO.r1 && th > TIFO.th0 && th < TIFO.th1;
    const LOOKS = 20;
    const FANS = (() => {
      const r = mul(1948), rows = [];
      for (let row = 0; row < UR; row++) {
        const f = rowF(row), arr = [];
        let th = -UTH, prev = standAt(th, f), acc = r() * 0.6;
        while (th < UTH) {
          th += 0.0015; const p = standAt(th, f); acc -= Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
          if (acc > 0) continue;
          acc = 0.56 + r() * 0.14;
          if (r() < 0.035) continue;                               // a gap
          const sect = Math.floor((th + UTH) / 0.26) * 7 + Math.floor(row / 9) * 3;
          const bh = H(sect * 1.37 + 4.2);
          arr.push({ x: p[0] + (r() - 0.5) * 0.15, y: p[1], z: p[2], th, row, seed: r() * 1000, look: Math.floor(r() * LOOKS),
            beh: bh < 0.34 ? 'bounce' : bh < 0.58 ? 'twirl' : bh < 0.8 ? 'scarf' : 'clap', ph: r() });
        }
        rows.push(arr);
      }
      return rows;
    })();
    // appearance table
    const LOOK = (() => {
      const r = mul(88), a = [];
      const skins = ['#e2b089', '#c98f65', '#a86f4c', '#7a4e33', '#f0c7a2'];
      for (let i = 0; i < LOOKS; i++) {
        const v = r();
        const shirt = v < 0.5 ? 'yellow' : v < 0.66 ? 'ystripe' : v < 0.86 ? 'blue' : 'navy';
        a.push({ shirt, skin: skins[Math.floor(r() * skins.length)], hair: Math.floor(r() * 6), paint: r() < 0.25, neckScarf: r() < 0.5, beard: r() < 0.25 });
      }
      return a;
    })();
    // fan sprite: 96 x 160 px = 1.55 m; bottom-centre anchor. 3/4 view turned toward screen-right (the pitch).
    const POSES = ['clap', 'up', 'pump', 'scarf', 'tw0', 'tw1', 'tw2', 'tw3'];
    const fanSprite = (look, pose, mouth) => A.layer(`s1u-fan-${look}-${pose}-${mouth}`, 96, 200, g => {
      const L = LOOK[look], O = '#1a1330';
      // legs (jeans) so the packed terraces read solid from above
      g.fillStyle = ['#23204a', '#2e3a6e', '#1c1a33'][look % 3]; g.strokeStyle = O; g.lineWidth = 3;
      A.rrect(g, 28, 160, 19, 42, 6); g.fill(); g.stroke(); A.rrect(g, 51, 160, 19, 42, 6); g.fill(); g.stroke();
      const shirtC = { yellow: '#ffd21f', ystripe: '#ffd21f', blue: '#1f4fbf', navy: '#23204a' }[L.shirt], trim = L.shirt === 'blue' || L.shirt === 'navy' ? '#ffd21f' : '#1f4fbf';
      g.lineJoin = 'round'; g.lineCap = 'round';
      const scarfBand = (pts, w) => { // striped yellow/blue scarf along a polyline
        for (let i = 0; i < pts.length - 1; i++) { g.strokeStyle = O; g.lineWidth = w + 3; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); }
        for (let i = 0; i < pts.length - 1; i++) { g.strokeStyle = i % 2 ? '#1f4fbf' : '#ffd21f'; g.lineWidth = w; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); }
      };
      const arm = (sh, el, hd, sleeve = true) => {
        g.strokeStyle = O; g.lineWidth = 14; g.beginPath(); g.moveTo(...sh); g.lineTo(...el); g.lineTo(...hd); g.stroke();
        g.strokeStyle = L.skin; g.lineWidth = 9; g.beginPath(); g.moveTo(...el); g.lineTo(...hd); g.stroke();
        if (sleeve) { g.strokeStyle = shirtC; g.lineWidth = 10; g.beginPath(); g.moveTo(...sh); g.lineTo(lerp(sh[0], el[0], 0.75), lerp(sh[1], el[1], 0.75)); g.stroke(); }
        g.fillStyle = L.skin; A.ellipse(g, hd[0], hd[1], 6.5, 6.5); A.fillStroke(g, L.skin, 2.5, O);
      };
      const shL = [28, 100], shR = [68, 98];
      let armsBehind = [], armsFront = [], scarf = null;
      if (pose === 'clap') { armsFront.push([shL, [32, 130], [50, 112]], [shR, [70, 128], [54, 110]]); }
      else if (pose === 'up') { armsBehind.push([shL, [16, 62], [12, 22]], [shR, [80, 60], [84, 18]]); }
      else if (pose === 'pump') { armsBehind.push([shR, [82, 62], [78, 16]]); armsFront.push([shL, [22, 128], [34, 150]]); }
      else if (pose === 'scarf') { armsBehind.push([shL, [14, 64], [14, 22]], [shR, [82, 62], [82, 20]]); scarf = [[14, 20], [26, 26], [38, 29], [50, 29], [62, 27], [74, 23], [82, 18]]; }
      else { const k = +pose[2], a = k * Math.PI / 2 + 0.4; armsBehind.push([shR, [82, 62], [76, 16]]); armsFront.push([shL, [24, 126], [36, 148]]);
        const pts = [[76, 14]]; for (let i = 1; i <= 6; i++) { const rr = i * 8.5, aa = a + i * 0.22; pts.push([76 + Math.cos(aa) * rr, 14 + Math.sin(aa) * rr * 0.55]); } scarf = pts; }
      armsBehind.forEach(a => arm(...a));
      // torso (cut by the row in front at the bottom)
      g.fillStyle = shirtC; A.rrect(g, 22, 90, 54, 80, 18); A.fillStroke(g, shirtC, 3, O);
      if (L.shirt === 'ystripe') { g.save(); A.rrect(g, 22, 90, 54, 80, 18); g.clip(); g.fillStyle = '#1f4fbf'; g.fillRect(20, 118, 60, 10); g.fillRect(20, 140, 60, 10); g.restore(); A.rrect(g, 22, 90, 54, 80, 18); g.lineWidth = 3; g.strokeStyle = O; g.stroke(); }
      if (L.shirt === 'navy') { g.fillStyle = '#ffd21f'; g.font = '800 16px Rubik'; g.textAlign = 'center'; g.fillText('12', 52, 132); }
      g.strokeStyle = trim; g.lineWidth = 3; g.beginPath(); g.moveTo(42, 93); g.lineTo(52, 104); g.lineTo(62, 93); g.stroke();
      // floodlight rim on the right edge
      g.strokeStyle = 'rgba(255,245,210,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(74, 104); g.lineTo(75, 160); g.stroke();
      if (L.neckScarf && !scarf) scarfBand([[34, 94], [44, 99], [54, 99], [64, 94]], 8), scarfBand([[40, 99], [38, 112], [37, 126]], 7);
      // head (3/4 right)
      const hx = 51, hy = 70;
      g.fillStyle = L.skin; A.ellipse(g, hx - 13, hy + 2, 4, 6); A.fillStroke(g, L.skin, 2.5, O); // ear
      A.ellipse(g, hx, hy, 17, 19); A.fillStroke(g, L.skin, 3, O);
      g.fillStyle = 'rgba(120,50,40,0.18)'; A.ellipse(g, hx - 7, hy + 3, 8, 11); g.fill();
      // hair / hats
      const hc = ['#1d1330', '#3a2418', '#1d1330', '#6b4a2a'][L.hair % 4];
      if (L.hair === 4) { g.fillStyle = '#ffd21f'; g.beginPath(); g.ellipse(hx, hy - 12, 20, 9, 0, Math.PI, 0); g.lineTo(hx + 24, hy - 9); g.lineTo(hx - 22, hy - 9); g.closePath(); A.fillStroke(g, '#ffd21f', 3, O); g.fillStyle = '#1f4fbf'; g.fillRect(hx - 18, hy - 13, 36, 3); }
      else if (L.hair === 5) { g.fillStyle = '#1f4fbf'; g.beginPath(); g.ellipse(hx, hy - 8, 18, 14, 0, Math.PI, 0); g.closePath(); A.fillStroke(g, '#1f4fbf', 3, O); g.fillStyle = '#ffd21f'; g.fillRect(hx - 17, hy - 11, 34, 4); A.ellipse(g, hx, hy - 23, 4, 4); g.fill(); }
      else if (L.hair !== 3) { g.fillStyle = hc; g.beginPath(); g.ellipse(hx - 2, hy - 8, 17, 12, -0.1, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fill(); g.fillStyle = hc; A.ellipse(g, hx - 13, hy - 2, 5, 9); g.fill(); }
      else { g.fillStyle = 'rgba(255,255,255,0.25)'; A.ellipse(g, hx + 3, hy - 12, 7, 3); g.fill(); }
      if (L.beard) { g.fillStyle = hc; g.beginPath(); g.ellipse(hx + 3, hy + 11, 12, 8, 0, 0, Math.PI); g.fill(); }
      // face paint (yellow/blue cheek stripes)
      if (L.paint) { g.fillStyle = '#ffd21f'; g.fillRect(hx + 7, hy + 2, 4, 8); g.fillStyle = '#1f4fbf'; g.fillRect(hx + 11, hy + 2, 4, 8); }
      // eyes, brows (excited)
      g.fillStyle = '#fff'; A.ellipse(g, hx + 3, hy - 2, 3.6, 4.2); g.fill(); A.ellipse(g, hx + 12, hy - 2, 3.2, 4); g.fill();
      g.fillStyle = O; A.ellipse(g, hx + 4.5, hy - 2, 1.8, 2.2); g.fill(); A.ellipse(g, hx + 13.3, hy - 2, 1.6, 2); g.fill();
      g.strokeStyle = O; g.lineWidth = 2.5; g.beginPath(); g.moveTo(hx - 1, hy - 9); g.lineTo(hx + 7, hy - 11); g.moveTo(hx + 10, hy - 11); g.lineTo(hx + 16, hy - 9); g.stroke();
      g.beginPath(); g.moveTo(hx + 16, hy + 1); g.lineTo(hx + 19, hy + 6); g.lineTo(hx + 15, hy + 7); g.stroke(); // nose
      // mouth: singing
      if (mouth) { g.fillStyle = '#3a0f1e'; A.ellipse(g, hx + 9, hy + 12, 5.5, 6.5); A.fillStroke(g, '#3a0f1e', 2, O); g.fillStyle = '#e0506a'; A.ellipse(g, hx + 9, hy + 15, 3, 2); g.fill(); }
      else { g.strokeStyle = O; g.lineWidth = 2.5; g.beginPath(); g.arc(hx + 9, hy + 9, 4.5, 0.2, Math.PI - 0.2); g.stroke(); }
      if (scarf) scarfBand(scarf, 9);
      armsFront.forEach(a => arm(...a));
    });
    // flag cloth design (u across 0..1, v down 0..1)
    const FLAGS = [[-0.62, 30, 0, 0.1], [-0.36, 21, 1, 1.3], [-0.08, 34, 2, 2.1], [0.2, 12, 0, 3.7], [0.46, 27, 1, 4.4], [0.66, 16, 2, 5.9], [-0.52, 9, 1, 6.6], [0.02, 6, 0, 7.9]];
    const TIFOIMG = () => A.layer('s1u-tifo', 1800, 520, (g, w, h) => {
      g.fillStyle = '#1f4fbf'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffd21f'; g.fillRect(0, 0, w, 34); g.fillRect(0, h - 34, w, 34);
      g.fillStyle = '#16307a'; for (let x = -40; x < w; x += 80) { g.beginPath(); g.moveTo(x, 34); g.lineTo(x + 40, 34); g.lineTo(x + 10, h - 34); g.lineTo(x - 30, h - 34); g.fill(); }
      const star = (cx, cy, R, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; for (const o of [0, Math.PI]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = o - Math.PI / 2 + i * A.TAU / 3; i ? g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R) : g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.closePath(); g.stroke(); } };
      star(160, h / 2, 120, '#ffd21f', 26); star(w - 160, h / 2, 120, '#ffd21f', 26);
      g.font = '250px Secular'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
      g.lineWidth = 22; g.strokeStyle = '#0d1033'; g.lineJoin = 'round'; g.strokeText('מכבי תל אביב', w / 2, h / 2 + 12);
      g.fillStyle = '#ffd21f'; g.fillText('מכבי תל אביב', w / 2, h / 2 + 12);
    });
    const SMOKE = () => A.layer('s1u-smoke', 128, 128, (g, w) => {
      const r = mul(5);
      for (let i = 0; i < 26; i++) { const x = 64 + (r() - 0.5) * 60, y = 64 + (r() - 0.5) * 60, rr = 18 + r() * 26; g.fillStyle = A.radial(g, x, y, 0, rr, [[0, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, w, w); }
    });
    const tint = (img, key, col) => A.layer('s1u-tint-' + key, img.width, img.height, g => { g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, img.width, img.height); });
    const EMIT = [[-0.46, 8, 0], [0.38, 13, 1], [-0.12, 36, 2], [0.56, 31, 3], [-0.66, 22, 4], [0.12, 3, 5]];

    function fanPose(f, t) {
      const beat = t * 2.15;
      if (f.beh === 'bounce') { const j = Math.max(0, Math.sin(A.TAU * beat - f.th * 7 - f.row * 0.12)); return { pose: j > 0.35 ? 'up' : 'pump', jump: 0.3 * Math.pow(j, 0.8) }; }
      if (f.beh === 'twirl') return { pose: 'tw' + (Math.floor(t * 9 + f.ph * 4) % 4), jump: 0.06 * Math.max(0, Math.sin(A.TAU * beat + f.ph * 6)) };
      if (f.beh === 'scarf') return { pose: 'scarf', jump: 0.1 * Math.max(0, Math.sin(A.TAU * beat * 0.5 - f.th * 5)), sway: 0.12 * Math.sin(Math.PI * beat - f.th * 3) };
      const on = (Math.floor(beat * 2 + f.ph * 2) % 2) === 0; return { pose: on ? 'clap' : 'up', jump: on ? 0 : 0.12 };
    }
    function drawFan(ctx, f, t, roar, tx, ty) {
      const st = fanPose(f, t), jump = st.jump * (0.4 + 0.6 * roar), sw = st.sway || 0;
      const p = P(f.x + tx * sw, f.y + ty * sw, f.z + jump); if (!p) return;
      const k = FOC / p[2], h = 1.95 * k;
      if (h < 7 || p[0] < -h || p[0] > 1920 + h || p[1] < -10 || p[1] > 1080 + 2 * h) return;
      const mouth = Math.sin(t * 8.5 + f.seed) > -0.35 ? 1 : 0;
      const img = fanSprite(f.look, st.pose, mouth), w = h * 0.48;
      ctx.drawImage(img, p[0] - w / 2, p[1] - h, w, h);
      return p;
    }
    function drawDrum(ctx, f, t) {
      const p = P(f.x - 0.55, f.y, f.z + 0.75); if (!p) return; const k = FOC / p[2];
      ctx.fillStyle = '#1f4fbf'; A.ellipse(ctx, p[0], p[1], 0.36 * k, 0.4 * k); A.fillStroke(ctx, '#1f4fbf', Math.max(1, 0.03 * k), A.OUTLINE);
      ctx.fillStyle = '#f4f0e6'; A.ellipse(ctx, p[0] + 0.05 * k, p[1], 0.3 * k, 0.34 * k); ctx.fill();
      ctx.fillStyle = '#ffd21f'; ctx.fillRect(p[0] - 0.36 * k, p[1] - 0.04 * k, 0.72 * k, 0.08 * k);
      const hit = Math.abs(Math.sin(t * Math.PI * 2.15)), sx = p[0] + 0.05 * k, sy = p[1] - 0.2 * k;
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = Math.max(1.2, 0.035 * k); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx - 0.1 * k, sy - 0.5 * k * hit); ctx.lineTo(sx + 0.05 * k, sy + 0.05 * k); ctx.stroke();
    }
    function drawFlag(ctx, fl, t, roar) {
      const [th, row, design, ph] = fl, base = standAt(th, rowF(row));
      const e = 0.002, a = standAt(th - e, rowF(row)), b = standAt(th + e, rowF(row));
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      const nx = -ty, ny = tx; // horizontal normal
      const sw = Math.sin(t * 1.9 + ph) * (0.8 + 0.4 * roar);           // big side to side waving
      const top = [base[0] + tx * sw * 2.2, base[1] + ty * sw * 2.2, base[2] + 7.2 - Math.abs(sw) * 0.6];
      const bot = [base[0], base[1], base[2] + 1.1];
      const W = 5.4, Hh = 3.6, dir = Math.cos(t * 1.9 + ph) > 0 ? 1 : -1;
      const mp = (u, v) => {
        const wave = Math.sin(u * 5.5 - t * 7 + ph) * 0.55 * u + Math.sin(u * 9 - t * 11) * 0.12 * u;
        return [top[0] - tx * dir * u * W + nx * wave, top[1] - ty * dir * u * W + ny * wave, top[2] - v * Hh - u * 0.9 * (1 - roar * 0.3) + wave * 0.3];
      };
      // pole
      const pb = P(...bot), pt = P(...top); if (!pb || !pt) return;
      const kk = FOC / pt[2];
      ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = Math.max(1.5, 0.09 * kk); ctx.beginPath(); ctx.moveTo(pb[0], pb[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      ctx.strokeStyle = '#d8d0ea'; ctx.lineWidth = Math.max(0.8, 0.045 * kk); ctx.stroke();
      const NU = 10, NV = 5, G2 = [];
      for (let i = 0; i <= NU; i++) { G2.push([]); for (let j = 0; j <= NV; j++) G2[i].push(P(...mp(i / NU, j / NV))); }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
        const q = [G2[i][j], G2[i + 1][j], G2[i + 1][j + 1], G2[i][j + 1]]; if (q.some(v => !v)) continue;
        const u = (i + 0.5) / NU, v = (j + 0.5) / NV;
        let col = design === 0 ? (v < 0.2 || v > 0.8 ? '#1f4fbf' : '#ffd21f') : design === 1 ? '#1f4fbf' : (u < 0.5 ? '#ffd21f' : '#1f4fbf');
        const shade = Math.cos(u * 5.5 - t * 7 + ph);
        ctx.fillStyle = col; ctx.beginPath(); q.forEach((w2, m) => m ? ctx.lineTo(w2[0], w2[1]) : ctx.moveTo(w2[0], w2[1])); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
        if (shade < 0) { ctx.fillStyle = `rgba(10,8,40,${-shade * 0.28})`; ctx.fill(); } else { ctx.fillStyle = `rgba(255,250,220,${shade * 0.12})`; ctx.fill(); }
      }
      // Star of David on the cloth
      const sc = design === 1 ? '#ffd21f' : '#1f4fbf', R = 0.28;
      ctx.strokeStyle = sc; ctx.lineWidth = Math.max(1.2, 0.16 * kk); ctx.lineJoin = 'round';
      for (const o of [0, Math.PI]) {
        ctx.beginPath(); let ok = true;
        for (let i = 0; i < 3; i++) { const a = o - Math.PI / 2 + i * A.TAU / 3, q = P(...mp(0.5 + Math.cos(a) * R * Hh / W, 0.5 + Math.sin(a) * R)); if (!q) { ok = false; break; } i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
        if (ok) { ctx.closePath(); ctx.stroke(); }
      }
      // outline
      ctx.strokeStyle = 'rgba(26,19,48,0.8)'; ctx.lineWidth = Math.max(1, 0.05 * kk); ctx.beginPath();
      const edge = []; for (let i = 0; i <= NU; i++) edge.push(G2[i][0]); for (let j = 0; j <= NV; j++) edge.push(G2[NU][j]); for (let i = NU; i >= 0; i--) edge.push(G2[i][NV]); for (let j = NV; j >= 0; j--) edge.push(G2[0][j]);
      if (!edge.some(v => !v)) { edge.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.stroke(); }
    }
    function drawTifo(ctx, t) {
      const img = TIFOIMG(), N = 18;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, th0 = lerp(TIFO.th1, TIFO.th0, u0), th1 = lerp(TIFO.th1, TIFO.th0, u1);
        const rip = (u, v) => 0.25 * Math.sin(u * 14 - t * 4) * Math.sin(v * 3 + t * 2);
        const tl = standAt(th0, rowF(TIFO.r1)), tr = standAt(th1, rowF(TIFO.r1)), bl = standAt(th0, rowF(TIFO.r0));
        const A0 = P(tl[0], tl[1], tl[2] + 1.2 + rip(u0, 0)), B0 = P(tr[0], tr[1], tr[2] + 1.2 + rip(u1, 0)), C0 = P(bl[0], bl[1], bl[2] + 1.2 + rip(u0, 1));
        const brp = standAt(th1, rowF(TIFO.r0)), D0 = P(brp[0], brp[1], brp[2] + 1.2 + rip(u1, 1));
        if (!A0 || !B0 || !C0 || !D0) continue;
        const sw = img.width / N;
        ctx.save(); ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(B0[0], B0[1]); ctx.lineTo(D0[0], D0[1]); ctx.lineTo(C0[0], C0[1]); ctx.closePath(); ctx.clip();
        const a = (B0[0] - A0[0]) / sw, b = (B0[1] - A0[1]) / sw, c = (C0[0] - A0[0]) / img.height, d = (C0[1] - A0[1]) / img.height;
        ctx.transform(a, b, c, d, A0[0], A0[1]); ctx.drawImage(img, i * sw, 0, sw + 1, img.height, 0, 0, sw + 1, img.height);
        ctx.restore();
        const sh = Math.sin(u0 * 14 - t * 4); if (sh < 0) { ctx.fillStyle = `rgba(10,8,40,${-sh * 0.15})`; ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(B0[0], B0[1]); ctx.lineTo(D0[0], D0[1]); ctx.lineTo(C0[0], C0[1]); ctx.fill(); }
      }
    }
    function drawSmokeFlares(ctx, t, roar) {
      const spr = SPR(), sm = SMOKE(), yel = tint(sm, 'y', 'rgba(255,214,60,1)'), org = tint(sm, 'o', 'rgba(255,150,60,1)');
      for (const [th, row, sd] of EMIT) {
        const e = standAt(th, rowF(row));
        for (let i = 15; i >= 0; i--) {
          const age = ((t * 0.3 + i / 16 + sd * 0.137) % 1);
          const x = e[0] + age * 2.5 - 1, y = e[1] + age * 6 * Math.sin(sd + 1), z = e[2] + 2 + age * 13;
          const p = P(x, y, z); if (!p) continue;
          const k = FOC / p[2], r = (1.3 + age * 6.5) * k;
          ctx.globalAlpha = 0.6 * (1 - age) * Math.min(1, age * 6);
          ctx.drawImage(age < 0.2 ? org : yel, p[0] - r, p[1] - r, 2 * r, 2 * r);
        }
        ctx.globalAlpha = 1;
        const fp = P(e[0], e[1], e[2] + 2.0); if (!fp) continue;
        const k = FOC / fp[2], fl = 0.8 + 0.2 * Math.sin(t * 37 + sd * 5) + 0.1 * Math.sin(t * 23 + sd);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const r1 = 3.2 * k * fl, r2 = 0.5 * k * fl;
        ctx.globalAlpha = 0.6; ctx.drawImage(spr.tail, fp[0] - r1, fp[1] - r1, 2 * r1, 2 * r1);
        ctx.globalAlpha = 0.8; ctx.drawImage(spr.sodium, fp[0] - r1 * 0.5, fp[1] - r1 * 0.5, r1, r1);
        ctx.globalAlpha = 1; ctx.drawImage(spr.white, fp[0] - r2, fp[1] - r2, 2 * r2, 2 * r2);
        for (let s2 = 0; s2 < 6; s2++) { const a = H(s2 + sd * 7 + Math.floor(t * 20)) * A.TAU, d = H(s2 * 3 + Math.floor(t * 20)) * 0.8 * k; ctx.fillStyle = 'rgba(255,230,160,0.9)'; ctx.fillRect(fp[0] + Math.cos(a) * d, fp[1] + Math.sin(a) * d - 0.3 * k, 2, 2); }
        ctx.restore();
      }
    }
    function drawFence(ctx, t) {
      // front fence along the inner edge of the home end, with hanging banners
      const a = STD.in[0] - 1, b = STD.in[1] - 1, N = 60;
      const post = th => ring(a, b, th);
      ctx.lineCap = 'round';
      const pts = []; for (let i = 0; i <= N; i++) pts.push(post(lerp(-UTH - 0.05, UTH + 0.05, i / N)));
      // hanging banners on the fence
      const BAN = [[-0.62, -0.46, '#ffd21f', 'MACCABI'], [-0.3, -0.12, '#1f4fbf', 'שער 11'], [0.05, 0.25, '#ffd21f', 'צהוב'], [0.4, 0.6, '#1f4fbf', 'MTA']];
      for (const [t0, t1, col, txt] of BAN) {
        const p0 = post(t0), p1 = post(t1);
        const q = [P(p0[0], p0[1], 2.2), P(p1[0], p1[1], 2.2), P(p1[0], p1[1], 0.9), P(p0[0], p0[1], 0.9)];
        if (q.some(v => !v)) continue;
        ctx.fillStyle = col; ctx.beginPath(); q.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = A.OUTLINE; ctx.lineWidth = 1.5; ctx.stroke();
        const k = FOC / q[0][2], cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
        const fs = Math.max(6, 0.8 * k) | 0;
        if (fs > 7) { ctx.save(); ctx.translate(cx, cy); { let ang = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]); if (Math.cos(ang) < 0) ang += Math.PI; ctx.rotate(ang); } ctx.scale(Math.min(1, Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) / (fs * txt.length * 0.62)), 1);
          A.text(ctx, txt, 0, 0, { font: `800 ${fs}px Rubik`, fill: col === '#ffd21f' ? '#1f4fbf' : '#ffd21f', dir: /[א-ת]/.test(txt) ? 'rtl' : 'ltr' }); ctx.restore(); }
      }
      // rails + posts
      for (const z of [2.3, 1.2]) {
        ctx.beginPath(); let ok = false;
        for (const p of pts) { const q = P(p[0], p[1], z); if (!q) { ok = false; continue; } ok ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); ok = true; }
        ctx.strokeStyle = '#141032'; ctx.lineWidth = z > 2 ? 4 : 2.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(200,200,240,0.6)'; ctx.lineWidth = z > 2 ? 1.5 : 1; ctx.stroke();
      }
      for (let i = 0; i <= N; i += 2) {
        const p = pts[i], q0 = P(p[0], p[1], 0), q1 = P(p[0], p[1], 2.3); if (!q0 || !q1) continue;
        ctx.strokeStyle = '#141032'; ctx.lineWidth = Math.max(1.5, 0.07 * FOC / q0[2]); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
      }
    }
    function drawCapo(ctx, t, y, ph) {
      // capo standing on the fence platform, back to the pitch, megaphone raised toward the crowd
      const x = STD.in[0] - 1.6, zf = 1.0;
      const bob = Math.abs(Math.sin(t * Math.PI * 2.15 + ph)) * 0.08;
      const feet = P(x, y, zf + bob), hip = P(x, y, zf + 0.95 + bob), sh = P(x, y, zf + 1.45 + bob), head = P(x, y, zf + 1.72 + bob);
      if (!feet || !hip || !sh || !head) return;
      const k = FOC / sh[2], O = A.OUTLINE;
      const seg = (a, b, w, c) => { ctx.strokeStyle = O; ctx.lineWidth = w * k + 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = w * k; ctx.stroke(); };
      ctx.lineCap = 'round';
      seg([feet[0] - 0.12 * k, feet[1]], [hip[0] - 0.08 * k, hip[1]], 0.16, '#23204a'); seg([feet[0] + 0.12 * k, feet[1]], [hip[0] + 0.08 * k, hip[1]], 0.16, '#23204a');
      seg(hip, sh, 0.44, '#ffd21f');
      A.text(ctx, '12', (hip[0] + sh[0]) / 2, (hip[1] + sh[1]) / 2, { font: `800 ${Math.max(6, 0.22 * k) | 0}px Rubik`, fill: '#1f4fbf' });
      const armUp = 0.3 + 0.25 * Math.sin(t * 4.3 + ph);
      const hand = [sh[0] + 0.25 * k, sh[1] - (0.35 + armUp) * k];
      seg([sh[0] + 0.18 * k, sh[1]], hand, 0.11, '#ffd21f');
      seg([sh[0] - 0.18 * k, sh[1]], [sh[0] - 0.35 * k, sh[1] - 0.3 * k - armUp * 0.5 * k], 0.11, '#ffd21f');
      // megaphone (seen from behind: the handle + the narrow end)
      ctx.fillStyle = '#f2f0f8'; ctx.beginPath(); ctx.moveTo(hand[0] - 0.08 * k, hand[1] - 0.05 * k); ctx.lineTo(hand[0] + 0.12 * k, hand[1] - 0.18 * k); ctx.lineTo(hand[0] + 0.2 * k, hand[1] + 0.02 * k); ctx.closePath(); A.fillStroke(ctx, '#f2f0f8', 2, O);
      ctx.fillStyle = '#c98f65'; A.ellipse(ctx, head[0], head[1], 0.13 * k, 0.14 * k); A.fillStroke(ctx, '#c98f65', 2, O);
      ctx.fillStyle = '#1d1330'; A.ellipse(ctx, head[0], head[1] - 0.02 * k, 0.12 * k, 0.12 * k); ctx.fill();
    }
    function drawUltras(ctx, t, roar) {
      // quick reject: centre of the end on screen at all and big enough?
      const c = P(80, 0, 15); if (!c) return;
      const kc = FOC / c[2]; if (kc < 4) return;
      // along-row tangent (horizontal) for scarf sway
      let drumI = 0;
      for (let row = UR - 1; row >= 0; row--) {
        if (row === TIFO.r0 - 1) drawTifo(ctx, t);
        const arr = FANS[row];
        // draw far-to-near along the row relative to the camera
        let best = 0, bd = 1e9; for (let i = 0; i < arr.length; i += 4) { const d = (arr[i].x - C.px) ** 2 + (arr[i].y - C.py) ** 2; if (d < bd) { bd = d; best = i; } }
        const order = []; for (let i = 0; i < best; i++) order.push(i); for (let i = arr.length - 1; i >= best; i--) order.push(i);
        for (const i of order) {
          const f = arr[i]; if (underTifo(row, f.th)) continue;
          const p = drawFan(ctx, f, t, roar, 0, 1);
          if (p && row <= 1 && (i % 23 === 5)) drawDrum(ctx, f, t);
        }
      }
      drawSmokeFlares(ctx, t, roar);
      for (const fl of FLAGS) drawFlag(ctx, fl, t, roar);
      drawFence(ctx, t);
      drawCapo(ctx, t, 12, 0); drawCapo(ctx, t, -9, 1.7);
    }

    // ------------------------------------------------------------------ pitch + players
    const PL = []; // x in [-52.5,52.5] (goals east/west), y in [-34,34]
    function drawPitch(ctx, t) {
      // surround
      const sur3 = []; for (let i = 0; i < 64; i++) { const p = ring(STD.in[0], STD.in[1], (i / 64) * A.TAU); sur3.push([p[0], p[1], 0]); }
      ctx.fillStyle = '#176a33'; if (polyPath(ctx, sur3)) ctx.fill();
      // stripes
      for (let s = 0; s < 14; s++) {
        const x0 = -52.5 + s * 7.5, x1 = x0 + 7.5;
        ctx.fillStyle = s % 2 ? '#26a049' : '#33b457'; if (polyPath(ctx, [[x0, -34, 0], [x1, -34, 0], [x1, 34, 0], [x0, 34, 0]])) ctx.fill();
      }
      // mowing checker (subtle cross stripes)
      ctx.fillStyle = 'rgba(255,255,220,0.05)';
      for (let q = 0; q < 9; q += 2) { const y0 = -34 + q * 68 / 9, y1 = y0 + 68 / 9; if (polyPath(ctx, [[-52.5, y0, 0], [52.5, y0, 0], [52.5, y1, 0], [-52.5, y1, 0]])) ctx.fill(); }
      // pitch shading: darker toward the edges, warm hot-spots under each floodlight bank
      {
        const c0 = P(0, 0, 0);
        if (c0) {
          const k = FOC / c0[2];
          ctx.save(); polyPath(ctx, sur3); ctx.clip();
          ctx.fillStyle = A.radial(ctx, c0[0], c0[1], 18 * k, 80 * k, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(3,18,12,0.32)']]); ctx.fillRect(-200, -200, 2320, 1480);
          ctx.globalCompositeOperation = 'lighter';
          for (const T4 of TOWERS) { const h = P(T4.x * 0.33, T4.y * 0.33, 0); if (!h) continue; const kk = FOC / h[2]; ctx.fillStyle = A.radial(ctx, h[0], h[1], 0, 34 * kk, [[0, 'rgba(255,250,215,0.10)'], [1, 'rgba(255,250,215,0)']]); ctx.fillRect(h[0] - 34 * kk, h[1] - 34 * kk, 68 * kk, 68 * kk); }
          ctx.restore();
        }
      }
      // floodlit sheen
      const c = P(0, 0, 0);
      if (c) { const k = FOC / c[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, c[0], c[1], 0, 70 * k, [[0, 'rgba(255,255,210,0.08)'], [1, 'rgba(255,255,210,0)']]); ctx.fillRect(c[0] - 70 * k, c[1] - 70 * k, 140 * k, 140 * k); ctx.restore(); }
      // lines
      const line = pts0 => { const pts = []; for (let i = 0; i < pts0.length; i++) { if (i) { const [x0, y0] = pts0[i - 1], [x1, y1] = pts0[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4)); for (let j = 1; j <= n; j++) pts.push([lerp(x0, x1, j / n), lerp(y0, y1, j / n)]); } else pts.push(pts0[0]); } let prev = null; for (const [x, y] of pts) { const p = P(x, y, 0); if (!p || p[2] < 2) { prev = null; continue; } if (prev) { ctx.lineWidth = Math.max(1, 0.13 * FOC * 2 / (p[2] + prev[2])); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } prev = p; } };
      const arc = (cx, cy, r, a0, a1, n = 40) => { const a = []; for (let i = 0; i <= n; i++) { const th = lerp(a0, a1, i / n); a.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); } return a; };
      const kc = c ? FOC / c[2] : 1;
      ctx.strokeStyle = 'rgba(250,255,245,0.92)'; ctx.lineWidth = Math.max(1, 0.14 * kc); ctx.lineJoin = 'round';
      line([[-52.5, -34], [52.5, -34], [52.5, 34], [-52.5, 34], [-52.5, -34]]);
      line([[0, -34], [0, 34]]);
      line(arc(0, 0, 9.15, 0, A.TAU, 64));
      for (const sd of [-1, 1]) {
        line([[sd * 52.5, -20.16], [sd * 36, -20.16], [sd * 36, 20.16], [sd * 52.5, 20.16]]);
        line([[sd * 52.5, -9.16], [sd * 47, -9.16], [sd * 47, 9.16], [sd * 52.5, 9.16]]);
        const ang = Math.acos(5.5 / 9.15); line(sd > 0 ? arc(41.5, 0, 9.15, Math.PI - ang, Math.PI + ang, 20) : arc(-41.5, 0, 9.15, -ang, ang, 20));
      }
      for (const [x, y] of [[0, 0], [41.5, 0], [-41.5, 0]]) { const p = P(x, y, 0); if (p) { ctx.fillStyle = '#fff'; A.ellipse(ctx, p[0], p[1], Math.max(1.2, 0.2 * FOC / p[2]), Math.max(1.2, 0.2 * FOC / p[2])); ctx.fill(); } }
      // goals (3D posts + net)
      for (const sd of [-1, 1]) {
        const gx = sd * 52.5, bx = sd * 54.5;
        const pts = [[gx, -3.66, 0], [gx, -3.66, 2.44], [gx, 3.66, 2.44], [gx, 3.66, 0]].map(v => P(...v)), back = [[bx, -3.66, 0], [bx, -3.66, 1.6], [bx, 3.66, 1.6], [bx, 3.66, 0]].map(v => P(...v));
        if (pts.some(v => !v) || back.some(v => !v)) continue;
        ctx.fillStyle = 'rgba(235,240,255,0.18)'; ctx.beginPath(); [pts[1], pts[2], back[2], back[1]].forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(235,240,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); [back[0], back[1], back[2], back[3]].forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.4, 0.14 * FOC / pts[1][2]); ctx.beginPath(); pts.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.stroke();
      }
    }
    // match state: Maccabi (yellow) attack toward the WEST goal (x = -52.5)
    function matchState(t) {
      const lt = t - 1.5;
      const ax = Math.min(-10 + lt * 7.5, 44), ay = -19 + 1.5 * Math.sin(lt * 0.9);
      const pl = [];
      pl.push({ x: ax, y: ay, team: 0, dir: [1, 0.15 * Math.cos(lt * 0.9)], run: 1, num: 10, star: 1 });
      const r = mul(21);
      for (let i = 0; i < 21; i++) {
        const team = i < 10 ? 0 : 1;
        const bx = team ? 8 + r() * 38 : -8 - r() * 30, by = (r() - 0.5) * 58;
        const chase = team ? 0.5 * r() : 0.35 * r();
        let x = bx + lt * (team ? 1.5 + r() * 1.5 : 3.5 + r() * 2), y = by;
        x = lerp(x, ax + (team ? 6 + r() * 10 : -5 - r() * 8), chase); y = lerp(y, ay + (r() - 0.5) * 18, chase);
        x += Math.sin(t * 0.7 + i) * 1.2; y += Math.cos(t * 0.6 + i * 2) * 1.2;
        pl.push({ x, y, team, dir: [1, Math.sin(i + t * 0.3) * 0.3], run: 0.6 + r() * 0.4, num: i });
      }
      pl.push({ x: 50.5, y: -1 + 0.8 * Math.sin(t), team: 2, dir: [-1, 0], run: 0.15, num: 1 }); // opposing keeper (east goal)
      // the duel: three red defenders closing on the ball carrier, one yellow runner making the run ahead
      const cl = clamp((lt - 1.2) / 2.2);
      [[5, 3.5, 30], [6.5, -3, 31], [9, 1.5, 32]].forEach(([ox, oy, n], m) => { const k2 = 1 - cl * (0.35 + m * 0.1); pl.push({ x: ax + ox * k2 + 1.5 * Math.sin(t * 1.3 + m), y: ay + oy * k2, team: 1, dir: [-1, -oy * 0.05], run: 0.8, num: n }); });
      pl.push({ x: ax + 5 + lt * 1.2, y: ay - 11 + Math.sin(t) * 0.8, team: 0, dir: [1, 0.1], run: 1, num: 33 });
      const touch = (lt * 2.1) % 1, ahead = 0.7 + 1.5 * Math.sin(touch * Math.PI);
      const ball = { x: ax + ahead, y: ay + 0.2, z: 0.11 + 0.12 * Math.abs(Math.sin(touch * Math.PI * 2)) };
      return { pl, ball };
    }
    function drawPlayers(ctx, t) {
      const { pl, ball } = matchState(t);
      const c = P(ball.x, ball.y, 0) || P(0, 0, 0);
      const kc = c ? FOC / c[2] : 99;
      if (kc < 1.2) { // too far: coloured dots
        for (const p of pl) { const q = P(p.x, p.y, 1); if (!q) continue; ctx.fillStyle = p.team === 0 ? '#ffd21f' : p.team === 1 ? '#e0322c' : '#35e07a'; ctx.fillRect(q[0] - 1, q[1] - 1, 2, 2); }
        return;
      }
      // shadows: four faint, soft, tapered floodlight shadows (a gentle star) + a soft contact blob under the feet
      const shSpr = A.layer('s1a-shadow', 128, 32, (g, w, h) => {
        const id = g.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = x / (w - 1), half = lerp(0.95, 0.25, u), v = Math.abs((y + 0.5) / h * 2 - 1) / half;
          const a = v >= 1 ? 0 : Math.pow(1 - v * v, 1.5) * Math.pow(1 - u, 1.3) * Math.min(1, u * 12 + 0.35);
          const o = (y * w + x) * 4; id.data[o] = 6; id.data[o + 1] = 30; id.data[o + 2] = 16; id.data[o + 3] = Math.round(a * 255);
        }
        g.putImageData(id, 0, 0);
      });
      const blob = A.layer('s1a-contact', 64, 64, (g, w) => { g.fillStyle = A.radial(g, w / 2, w / 2, 0, w / 2, [[0, 'rgba(5,24,12,1)'], [0.5, 'rgba(5,24,12,0.55)'], [1, 'rgba(5,24,12,0)']]); g.fillRect(0, 0, w, w); });
      ctx.save();
      for (const p of pl.concat([{ x: ball.x, y: ball.y, ball: 1 }])) {
        const a = P(p.x, p.y, 0); if (!a) continue;
        const k = FOC / a[2];
        for (const T4 of TOWERS) {
          const dx = p.x - T4.x, dy = p.y - T4.y, l = Math.hypot(dx, dy), sl = (p.ball ? 0.25 : 1.25) * l / (T4.h - 1.8);
          const b = P(p.x + dx / l * sl, p.y + dy / l * sl, 0); if (!b) continue;
          const sx = b[0] - a[0], sy = b[1] - a[1], len = Math.hypot(sx, sy); if (len < 0.5) continue;
          const wid = (p.ball ? 0.22 : 0.62) * k;
          ctx.restore(); ctx.save();
          ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(sy, sx)); ctx.globalAlpha = 0.11;
          ctx.drawImage(shSpr, -0.06 * len, -wid / 2, len * 1.06, wid);
        }
        ctx.restore(); ctx.save();
        const r = (p.ball ? 0.16 : 0.42) * k; ctx.globalAlpha = p.ball ? 0.35 : 0.42;
        ctx.drawImage(blob, a[0] - r, a[1] - r * 0.8, r * 2, r * 1.6);
      }
      ctx.restore(); ctx.save();
      // players sorted far -> near
      const list = pl.map(p => ({ p, d: (p.x - C.px) ** 2 + (p.y - C.py) ** 2 })).sort((a, b) => b.d - a.d);
      for (const { p } of list) drawPlayer(ctx, p, t);
      // ball
      const bp = P(ball.x, ball.y, ball.z);
      if (bp) { const k = FOC / bp[2], rr = Math.max(1.5, 0.13 * k); ctx.fillStyle = '#fff'; A.ellipse(ctx, bp[0], bp[1], rr, rr); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,40,0.6)'; ctx.lineWidth = Math.max(0.6, rr * 0.25); ctx.stroke(); ctx.fillStyle = '#222'; A.ellipse(ctx, bp[0] - rr * 0.2, bp[1] - rr * 0.1, rr * 0.35, rr * 0.35); ctx.fill(); }
      ctx.restore();
    }
    function drawPlayer(ctx, p, t) {
      const shirt = p.team === 0 ? '#ffd21f' : p.team === 1 ? '#e0322c' : '#35e07a', shorts = p.team === 0 ? '#1f4fbf' : p.team === 1 ? '#ffffff' : '#1a1330', socks = p.team === 0 ? '#ffd21f' : p.team === 1 ? '#e0322c' : '#1a1330';
      const dl = Math.hypot(p.dir[0], p.dir[1]) || 1, fx = p.dir[0] / dl, fy = p.dir[1] / dl, sx = -fy, sy = fx;
      const ph = t * (p.star ? 10 : 8) + p.num * 1.3, sw = Math.sin(ph) * 0.5 * p.run, lean = 0.3 * p.run;
      const zf = lerp(1, 0.5, clamp((C.pitch * 180 / Math.PI - 25) / 45)), pt = (f, s, z) => P(p.x + fx * f + sx * s, p.y + fy * f + sy * s, z * zf); // heights compressed so running direction reads from straight above
      const hip = pt(lean * 0.4, 0, 0.95), sh = pt(lean, 0, 1.45), head = pt(lean * 1.15, 0, 1.72);
      const fL = pt(sw, 0.13, 0.05), fR = pt(-sw, -0.13, 0.05), kL = pt(sw * 0.6 + 0.05, 0.12, 0.5), kR = pt(-sw * 0.6 + 0.05, -0.12, 0.5);
      const hL = pt(-sw * 0.7, 0.32, 1.0), hR = pt(sw * 0.7, -0.32, 1.0), sL = pt(lean, 0.22, 1.42), sR = pt(lean, -0.22, 1.42);
      if ([hip, sh, head, fL, fR, kL, kR, hL, hR, sL, sR].some(v => !v)) return;
      const k = FOC / sh[2], O = '#1a1330';
      const seg = (a, b, w, col) => { ctx.strokeStyle = O; ctx.lineWidth = w * k + Math.max(1, 0.06 * k); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.stroke(); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      seg(kL, fL, 0.13, socks); seg(kR, fR, 0.13, socks); seg(hip, kL, 0.17, shorts); seg(hip, kR, 0.17, shorts);
      seg(sL, hL, 0.1, '#b9794f'); seg(sR, hR, 0.1, '#b9794f');
      seg(hip, sh, 0.36, shirt); seg(sL, sR, 0.2, shirt);
      ctx.fillStyle = '#b9794f'; A.ellipse(ctx, head[0], head[1], 0.13 * k, 0.13 * k); A.fillStroke(ctx, '#b9794f', Math.max(0.8, 0.04 * k));
      ctx.fillStyle = '#1d1330'; A.ellipse(ctx, head[0] - fx * 0.02 * k, head[1], 0.12 * k, 0.1 * k); ctx.fill();
      if (p.star && k > 8) { // number on the back + a subtle hero rim light
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.drawImage(SPR().warm, sh[0] - 1.2 * k, sh[1] - 1.2 * k, 2.4 * k, 2.4 * k); ctx.restore();
      }
    }

    // ------------------------------------------------------------------ the whole aerial frame
    function render(ctx, t, cam, roar) {
      setCam(cam.x, cam.y, cam.z, cam.yaw, cam.pitch);
      const pat = patterns(ctx);
      ctx.save();
      ctx.fillStyle = '#140f30'; ctx.fillRect(0, 0, 1920, 1080);
      ctx.translate(960, 540); ctx.rotate(cam.roll || 0); ctx.translate(-960, -540);
      ctx.imageSmoothingQuality = 'high';
      // sky + far ground beyond the modelled city (visible when the gimbal is tilted up)
      {
        const hy = 540 - FOC * Math.tan(cam.pitch);
        if (hy > -300) {
          ctx.fillStyle = A.linear(ctx, 0, hy - 900, 0, hy, [[0, '#090b2a'], [0.45, '#1b1f4a'], [0.75, '#3a276a'], [0.93, '#8a3a7c'], [1, '#d8577a']]);
          ctx.fillRect(-500, Math.min(-300, hy - 900), 2920, hy - Math.min(-300, hy - 900) + 1);
          ctx.fillStyle = A.linear(ctx, 0, hy, 0, hy + 160, [[0, '#4a2a5a'], [1, '#140f30']]); ctx.fillRect(-500, hy, 2920, 1700);
        }
      }
      const vb = viewBox();
      // ground: coarsest first, finer layers only when needed (and skip coarse layers they fully cover)
      const kc = FOC / Math.max(1, cam.z / Math.sin(cam.pitch));
      const useMid = kc > 1.2, useHi = kc > 4;
      const layers = [TEX[0]];
      if (useMid) layers.push(TEX[1]);
      if (useHi) layers.push(TEX[2]);
      let startI = 0; for (let i = layers.length - 1; i >= 0; i--) if (covers(layers[i], vb)) { startI = i; break; }
      for (let i = startI; i < layers.length; i++) groundPass(ctx, layers[i]);
      drawSea(ctx, t, vb);
      drawCars(ctx, t, vb);
      // buildings (+ stadium as one sorted item)
      const items = [];
      const bx0 = Math.floor((vb[0] - 200) / CELL), bx1 = Math.floor((vb[2] + 200) / CELL), by0 = Math.floor((vb[1] - 200) / CELL), by1 = Math.floor((vb[3] + 200) / CELL);
      for (let gx = bx0; gx <= bx1; gx++) for (let gy = by0; gy <= by1; gy++) {
        const arr = BK.get(gx + ',' + gy); if (!arr) continue;
        for (const b of arr) {
          const m = P(b.cx, b.cy, b.h * 0.5); if (!m) continue;
          const mg = 120 + b.h * FOC / m[2];
          if (m[0] < -mg || m[0] > 1920 + mg || m[1] < -mg || m[1] > 1080 + mg) continue;
          items.push({ b, d: (b.cx - C.px) ** 2 + (b.cy - C.py) ** 2 });
        }
      }
      items.push({ stadium: 1, d: C.px ** 2 + C.py ** 2 });
      items.sort((a, b) => b.d - a.d);
      for (const it of items) {
        if (it.stadium) drawStadium(ctx, t, roar, pat);
        else drawBuilding(ctx, it.b, t, pat);
      }
      drawFloodGlow(ctx, t);
      ctx.restore();
      // atmosphere: distance haze toward the top of frame + warm stadium bloom
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, 700, [[0, `rgba(90,50,130,${0.3 * clamp(cam.z / 500)})`], [1, 'rgba(110,60,140,0)']]);
      ctx.fillRect(0, 0, 1920, 700);
      const sc = P(0, 0, 10);
      if (sc) { const k = FOC / sc[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, sc[0], sc[1], 0, 200 * k, [[0, `rgba(255,235,180,${0.16 * clamp(cam.z / 200)})`], [1, 'rgba(255,235,180,0)']]); ctx.fillRect(sc[0] - 200 * k, sc[1] - 200 * k, 400 * k, 400 * k); ctx.restore(); }
    }
    return { render, P: (...a) => P(...a), setCam };
  })();

  // ---------------------------------------------------------------- drone camera (metres)
  const DEG = Math.PI / 180;
  // ---------------------------------------------------------------- drone path (camera POSITION keys, metres)
  // 0 - 2.35: the original high descent (same positions as v6); then the gimbal tilts up while the drone swings
  // round the north-east corner and drops to a low oblique angle gliding along the Maccabi home (ultras) stand.
  //        t     x      y      z     yaw    tilt(deg down)
  const CK = [[0, 117, 938, 760, -0.30, 55], [1.2, 32, 574, 540, -0.19, 60], [2.35, -4, 155, 235, -0.05, 70],
    [3.4, 24, 98, 104, 0.22, 60], [4.5, 44, 64, 46, 0.5, 40], [5.6, 53, 38, 15, 0.34, 17], [7.0, 55, 18, 10.5, 0.2, 12], [8.4, 55.5, -1, 9.5, 0.12, 11]];
  // Hermite spline, Catmull-Rom interior tangents, zero tangent at the first key (slow ease-in) and the last
  const spl = (t, K, j) => {
    const n = K.length; if (t <= K[0][0]) return K[0][j]; if (t >= K[n - 1][0]) return K[n - 1][j];
    const tan = i => (i === 0 || i === n - 1) ? 0 : (K[i + 1][j] - K[i - 1][j]) / (K[i + 1][0] - K[i - 1][0]);
    let i = 0; while (K[i + 1][0] < t) i++;
    const h = K[i + 1][0] - K[i][0], u = (t - K[i][0]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * K[i][j] + (u3 - 2 * u2 + u) * h * tan(i) + (-2 * u3 + 3 * u2) * K[i + 1][j] + (u3 - u2) * h * tan(i + 1);
  };
  const yawAt = t => spl(t, CK, 4);
  const droneCam = t => {
    const tt = Math.min(t, 8.4);
    // altitude interpolated in log space for the high part (steady perceived descent rate)
    const zl = Math.exp(spl(tt, CK.map(k => [k[0], 0, 0, Math.log(k[3])]), 3));
    const hov = clamp(1 - zl / 300) ; // float grows as we get lower
    const x = spl(tt, CK, 1) + 0.35 * A.noise1(t * 0.43 + 7) * hov, y = spl(tt, CK, 2) + 0.35 * A.noise1(t * 0.51 + 19) * hov;
    const z = zl + 0.25 * A.noise1(t * 0.38 + 3) * hov;
    const yaw = yawAt(t) + 0.004 * A.wob(t, 4, 0.35);
    const yawRate = (yawAt(t + 0.05) - yawAt(t - 0.05)) / 0.1;
    const roll = -yawRate * 0.12 + 0.006 * A.wob(t, 5, 0.3);            // bank into the turn
    const tilt = spl(tt, CK, 5) + 0.25 * A.wob(t, 6, 0.45);
    // 8.45 -> 8.72: tilt up hard toward the sky (the whip); drone position kept
    const w = ease.in(inv(8.45, 8.72, t));
    return { x, y, z, yaw, pitch: lerp(tilt, -28, w) * DEG, roll };
  };
  // hover float (two low-frequency channels, a few px) + faint wind micro-jitter, in screen px
  const hover = t => [3.2 * A.noise1(t * 0.42 + 11) + 1.6 * A.noise1(t * 0.61 + 37) + 0.35 * A.noise1(t * 7.3 + 5), 2.6 * A.noise1(t * 0.37 + 71) + 1.4 * A.noise1(t * 0.55 + 3) + 0.3 * A.noise1(t * 8.1 + 9)];

  // ---------------------------------------------------------------- scene
  const CUT = 8.72, SH = 4.0; // shot C (mast + packets) = the v6 shot shifted by +4.0 s
  A.scene({
    name: 's1_telaviv', start: 0, end: 10.2,
    draw(ctx, s) {
      const t = s.t;
      if (t < CUT) {
        // ---- SHOT A: the drone
        const cam = droneCam(t);
        const roar = clamp(0.35 + 0.65 * smooth(2.9, 4.2, t));
        const [hx, hy] = hover(t);
        ctx.save(); ctx.translate(960 + hx, 540 + hy); ctx.scale(1.012, 1.012); ctx.translate(-960, -540);
        AER.render(ctx, t, cam, roar);
        ctx.restore();
        // motion softness on the fast part of the descent: a light radial (zoom) blur from the altitude rate
        const c1 = droneCam(t - 1 / 30), zr = Math.log(c1.z / cam.z);
        if (zr > 0.02 && t < 5) zoomBlur(ctx, Math.min(0.018, (zr - 0.02) * 0.6));
        lens(ctx);
        caption(ctx, t);
        if (t > 8.45) {
          const dp = (cam.pitch - droneCam(t - 1 / 15).pitch) * -1304;
          if (dp > 4) { smear(ctx, 0, Math.min(700, dp), 9); streaks(ctx, t, 0, 1, clamp(dp / 500), 2); }
        }
      } else {
        // ---- SHOT C: whip lands on the IPTV mast, packets launch, follow them over the sea
        const tc = t - SH;
        const c = camC(tc);
        const bc = lerp(0.6, 1.6, smooth(4.9, 5.1, tc));
        A.drawTelAviv(ctx, t, { cam: c, roar: 0.9, broadcast: bc });
        if (tc >= 4.9) packetBurst(ctx, tc, c);
        if (tc < 5.05) {
          const c1 = camC(tc - 1 / 15);
          const vx = -(c.x - c1.x) * c.zoom, vy = -(c.y - c1.y) * c.zoom, sp = Math.hypot(vx, vy);
          if (sp > 6) { const k = Math.min(1, 700 / sp); smear(ctx, vx * k, vy * k, 9); streaks(ctx, t, vx, vy, clamp(sp / 500), 2); }
        }
        const ex = ease.in(inv(5.75, 6.2, tc));
        if (ex > 0) { smear(ctx, -220 * ex, 0, 7); streaks(ctx, t, 1, 0, ex, 7, '190,250,255'); }
        const fl = ease.in(inv(5.95, 6.2, tc));
        if (fl > 0) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = A.linear(ctx, 0, 0, 1920, 0, [[0, `rgba(160,220,255,${fl * 0.4})`], [0.7, `rgba(230,250,255,${fl * 0.95})`], [1, `rgba(255,255,255,${fl})`]]);
          ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
        }
      }
    },
  });
})();
