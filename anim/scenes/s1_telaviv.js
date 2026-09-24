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
      C = { px, py, pz, Fx: cp * hx, Fy: cp * hy, Fz: -sp, Rx: hy, Ry: -hx, Ux: sp * hx, Uy: sp * hy, Uz: cp };
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

    // ------------------------------------------------------------------ geography
    const coastX = y => -520 - 0.12 * y + 18 * Math.sin(y / 180);
    const STAD = { hx: 185, hy: 155 };                      // stadium precinct half extents
    const inPrecinct = (x, y, m = 0) => Math.abs(x) < STAD.hx + m && Math.abs(y) < STAD.hy + m;
    const AYA = [560, 628];                                 // Ayalon highway x range
    const AZSITE = [330, 480, 640, 860];                    // Azrieli site x0,x1,y0,y1
    const PARKS = [[150, 380, 430, 600], [-420, -250, 880, 1080], [820, 1100, -240, 40]];
    const inPark = (x, y) => PARKS.some(p => x > p[0] && x < p[1] && y > p[2] && y < p[3]);
    const AV = []; for (let k = 0; k < 20; k++) { const x = -330 + k * 105; if (x > AYA[0] - 40 && x < AYA[1] + 40) continue; AV.push({ x, w: x === -330 + 5 * 105 ? 30 : 14 }); }
    const CR = []; for (let j = 0; j < 30; j++) CR.push({ y: -700 + j * 82, w: 12 });
    const EXT = [-1500, -800, 1700, 1600];                  // world extent of the city model

    // buildings: generic prisms {pts:[[x,y]..] CCW, h, roof, seed, kind, cx, cy}
    const B = [];
    (() => {
      const r = mul(5401);
      const roofs = ['#4a4680', '#56528c', '#423e76', '#615d98', '#3c3870', '#6b67a2', '#504c86'];
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
      rect(338, 650, 470, 850, 22, 'mall');
    })();
    // Azrieli towers: round, triangular, square
    const AZ = (() => {
      const round = [], N = 28, cx = 372, cy = 812, R = 25;
      for (let i = 0; i < N; i++) { const a = (i / N) * A.TAU; round.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
      const tcx = 425, tcy = 748, s = 58, tri = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * A.TAU / 3 + 0.3; return [tcx + Math.cos(a) * s / Math.sqrt(3), tcy + Math.sin(a) * s / Math.sqrt(3)]; });
      const qx = 385, qy = 688, sq = [[qx - 22, qy - 22], [qx + 22, qy - 22], [qx + 22, qy + 22], [qx - 22, qy + 22]];
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
        const v = r(); g.fillStyle = v < 0.32 ? (r() < 0.8 ? '#ffe2a0' : '#bfe6ff') : v < 0.5 ? 'rgba(140,170,255,0.35)' : 'rgba(10,14,50,0.5)'; g.fillRect(xx, yy, 4, 5);
      }
      g.fillStyle = 'rgba(200,220,255,0.18)'; for (let yy = 0; yy < h; yy += 32) g.fillRect(0, yy, w, 2);
    });
    // crowd tiles: 128 x 64 px = 16 m (around the ring) x 8 m (up the slope), 8 px/m
    const crowdTile = (away, up) => A.layer(`s1a-crowd-${away ? 1 : 0}${up ? 1 : 0}`, 128, 64, (g, w, h) => {
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
      g.fillStyle = '#1e1940'; A.rrect(g, -STAD.hx, -STAD.hy, STAD.hx * 2, STAD.hy * 2, 20); g.fill();
      g.fillStyle = '#17122f';
      for (const [px0, py0, pw, ph] of [[-175, -145, 70, 80], [105, 60, 70, 85], [105, -145, 70, 70]]) {
        g.fillRect(px0, py0, pw, ph);
        g.strokeStyle = 'rgba(210,200,255,0.3)'; g.lineWidth = 0.25;
        for (let yy = py0 + 3; yy < py0 + ph; yy += 6) { for (let xx = px0 + 2; xx < px0 + pw; xx += 2.6) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 4.5); g.stroke(); } }
        for (let k = 0; k < 40; k++) { const cx = px0 + 3 + Math.floor(r() * (pw - 6) / 2.6) * 2.6 + 1.3, cy = py0 + 3 + Math.floor(r() * ph / 6) * 6 + 2.2; if (cy > py0 + ph - 3) continue; g.fillStyle = ['#8a88b0', '#3a4a8a', '#b8b0d0', '#7a2a3a', '#2a2a40'][Math.floor(r() * 5)]; A.rrect(g, cx - 0.9, cy - 2, 1.8, 4, 0.5); g.fill(); }
        for (let k = 0; k < 6; k++) glowAt(spr.warm, px0 + (k % 3 + 0.5) * pw / 3, py0 + (Math.floor(k / 3) + 0.5) * ph / 2, 14, 0.4);
      }
      for (let k = 0; k < 90; k++) { const a = (k / 90) * A.TAU, x = Math.cos(a) * 128, y = Math.sin(a) * 110; g.fillStyle = k % 2 ? '#15302c' : '#1d4636'; A.ellipse(g, x, y, 4, 4); g.fill(); }
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
    function groundPass(ctx, L, strips = 30) {
      const img = tex(L), s = L.s;
      const Y0 = -140, Y1 = 1220, X0 = -260, X1 = 2180;
      for (let i = 0; i < strips; i++) {
        const ya = lerp(Y0, Y1, i / strips), yb = lerp(Y0, Y1, (i + 1) / strips);
        const gA = G(X0, ya, 0), gB = G(X1, ya, 0), gC = G(X0, yb, 0);
        if (!gA || !gB || !gC) continue;
        const tA = [(gA[0] - L.x0) * s, (L.y1 - gA[1]) * s], tB = [(gB[0] - L.x0) * s, (L.y1 - gB[1]) * s], tC = [(gC[0] - L.x0) * s, (L.y1 - gC[1]) * s];
        const e1x = tB[0] - tA[0], e1y = tB[1] - tA[1], e2x = tC[0] - tA[0], e2y = tC[1] - tA[1], det = e1x * e2y - e1y * e2x;
        if (Math.abs(det) < 1e-6) continue;
        const W = X1 - X0, Hh = yb - ya;
        const a = W * e2y / det, c = -W * e2x / det, b = -Hh * e1y / det, d = Hh * e1x / det;
        const e = X0 - (a * tA[0] + c * tA[1]), f = ya - (b * tA[0] + d * tA[1]);
        ctx.save(); ctx.beginPath(); ctx.rect(X0, ya - 0.6, W, Hh + 1.2); ctx.clip();
        ctx.transform(a, b, c, d, e, f); ctx.drawImage(img, 0, 0);
        ctx.restore();
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
        ctx.strokeStyle = head ? 'rgba(255,240,200,0.55)' : 'rgba(255,50,70,0.6)'; ctx.lineWidth = Math.max(1, 1.5 * k);
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
        ctx.fillStyle = head ? 'rgba(255,255,235,0.95)' : 'rgba(255,90,100,0.95)'; const s = Math.max(1.4, 2 * k); ctx.fillRect(a[0] - s / 2, a[1] - s / 2, s, s);
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
        if (c) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = Math.max(1, 0.4 * k); A.ellipse(ctx, c[0], c[1], 7 * k, 7 * k * 0.9); ctx.stroke(); A.text(ctx, 'H', c[0], c[1], { font: `800 ${Math.max(8, 7 * k) | 0}px Rubik`, fill: 'rgba(255,220,120,0.9)' }); }
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
      const segs = [];
      for (let i = 0; i < SEG; i++) { const th = ((i + 0.5) / SEG) * A.TAU, m = ring(80, 62, th); segs.push({ i, d: (m[0] - C.px) ** 2 + (m[1] - C.py) ** 2 }); }
      segs.sort((a, b) => b.d - a.d);
      const fr = Math.floor(t * 7);
      for (const { i } of segs) {
        const a0 = (i / SEG) * A.TAU, a1 = ((i + 1) / SEG) * A.TAU;
        const away = i >= 4 && i <= 12;
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
        for (let r = 0; r < 3; r++) {
          const f0 = r / 3, f1 = (r + 1) / 3;
          const A0 = lerp(STD.in[0], STD.out[0], f0), B0 = lerp(STD.in[1], STD.out[1], f0), Z0 = lerp(STD.in[2], STD.out[2], f0);
          const A1 = lerp(STD.in[0], STD.out[0], f1), B1 = lerp(STD.in[1], STD.out[1], f1), Z1 = lerp(STD.in[2], STD.out[2], f1);
          const i0 = ring(A0, B0, a0), i1 = ring(A0, B0, a1), j0 = ring(A1, B1, a0), j1 = ring(A1, B1, a1);
          const O = P(i0[0], i0[1], Z0), U = P(i1[0], i1[1], Z0), W = P(j1[0], j1[1], Z1), V = P(j0[0], j0[1], Z1);
          if (!O || !U || !W || !V) continue;
          const up = H(i * 7.3 + r * 3.1 + fr * 0.37) < roar * 0.85;
          const pt = away ? (up ? pat.c11 : pat.c10) : (up ? pat.c01 : pat.c00);
          const lu = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]) * 8, lv = Math.hypot(j0[0] - i0[0], j0[1] - i0[1], Z1 - Z0) * 8;
          const bounce = up ? (Math.sin(t * 14 + i) * 0.5 + 0.5) * 3 : 0;
          patQuad(ctx, pt, O, U, W, V, lu, lv, i * 37 + r * 91 + bounce);
          if (r === 1) { // concourse walkway line
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
          ctx.fillStyle = A.linear(ctx, top[0], top[1], cx, cy, [[0, 'rgba(255,245,210,0.16)'], [1, 'rgba(255,245,210,0.015)']]);
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

    // ------------------------------------------------------------------ pitch + players
    const PL = []; // x in [-52.5,52.5] (goals east/west), y in [-34,34]
    function drawPitch(ctx, t) {
      // surround
      const sur = []; for (let i = 0; i < 48; i++) { const p = ring(STD.in[0], STD.in[1], (i / 48) * A.TAU); const q = P(p[0], p[1], 0); if (!q) return; sur.push(q); }
      ctx.fillStyle = '#176a33'; ctx.beginPath(); sur.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
      // stripes
      for (let s = 0; s < 14; s++) {
        const x0 = -52.5 + s * 7.5, x1 = x0 + 7.5, q = [P(x0, -34, 0), P(x1, -34, 0), P(x1, 34, 0), P(x0, 34, 0)];
        if (q.some(v => !v)) continue;
        ctx.fillStyle = s % 2 ? '#1f8a3e' : '#279a48'; ctx.beginPath(); q.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
      }
      // mowing checker (subtle cross stripes)
      for (let s = 0; s < 9; s++) {
        if (s % 2) continue; const y0 = -34 + s * 68 / 9, y1 = y0 + 68 / 9, q = [P(-52.5, y0, 0), P(52.5, y0, 0), P(52.5, y1, 0), P(-52.5, y1, 0)];
        if (q.some(v => !v)) continue; ctx.fillStyle = 'rgba(255,255,220,0.05)'; ctx.beginPath(); q.forEach((v, m) => m ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])); ctx.closePath(); ctx.fill();
      }
      // floodlit sheen
      const c = P(0, 0, 0);
      if (c) { const k = FOC / c[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, c[0], c[1], 0, 70 * k, [[0, 'rgba(255,255,210,0.14)'], [1, 'rgba(255,255,210,0)']]); ctx.fillRect(c[0] - 70 * k, c[1] - 70 * k, 140 * k, 140 * k); ctx.restore(); }
      // lines
      const line = pts => { ctx.beginPath(); let ok = false; for (const [x, y] of pts) { const p = P(x, y, 0); if (!p) continue; ok ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); ok = true; } ctx.stroke(); };
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
      const ax = 16 - lt * 6.2 - 0.25 * lt * lt, ay = 4 + 2.2 * Math.sin(lt * 0.9);
      const pl = [];
      pl.push({ x: ax, y: ay, team: 0, dir: [-1, 0.15 * Math.cos(lt * 0.9)], run: 1, num: 10, star: 1 });
      const r = mul(21);
      for (let i = 0; i < 21; i++) {
        const team = i < 10 ? 0 : 1;
        const bx = team ? -8 - r() * 38 : 8 + r() * 30, by = (r() - 0.5) * 58;
        const chase = team ? 0.5 * r() : 0.35 * r();
        let x = bx - lt * (team ? 2 + r() * 2 : 4 + r() * 2.5), y = by;
        x = lerp(x, ax + (team ? -6 - r() * 10 : 5 + r() * 8), chase); y = lerp(y, ay + (r() - 0.5) * 18, chase);
        x += Math.sin(t * 0.7 + i) * 1.2; y += Math.cos(t * 0.6 + i * 2) * 1.2;
        pl.push({ x, y, team, dir: [-1, Math.sin(i + t * 0.3) * 0.3], run: 0.6 + r() * 0.4, num: i });
      }
      pl.push({ x: -51.5, y: 0.5 * Math.sin(t), team: 2, dir: [1, 0], run: 0.15, num: 1 }); // opposing keeper (west goal)
      const touch = (lt * 2.1) % 1, ahead = 0.7 + 1.5 * Math.sin(touch * Math.PI);
      const ball = { x: ax - ahead, y: ay + 0.2, z: 0.11 + 0.12 * Math.abs(Math.sin(touch * Math.PI * 2)) };
      return { pl, ball };
    }
    function drawPlayers(ctx, t) {
      const { pl, ball } = matchState(t);
      const c = P(0, 0, 0); if (!c) return;
      const kc = FOC / c[2];
      if (kc < 1.2) { // too far: coloured dots
        for (const p of pl) { const q = P(p.x, p.y, 1); if (!q) continue; ctx.fillStyle = p.team === 0 ? '#ffd21f' : p.team === 1 ? '#e0322c' : '#35e07a'; ctx.fillRect(q[0] - 1, q[1] - 1, 2, 2); }
        return;
      }
      // shadows (four floodlights)
      ctx.save(); ctx.lineCap = 'round';
      for (const p of pl.concat([{ x: ball.x, y: ball.y, ball: 1 }])) {
        for (const T4 of TOWERS) {
          const dx = p.x - T4.x, dy = p.y - T4.y, l = Math.hypot(dx, dy), sl = (p.ball ? 0.2 : 1.1) * l / (T4.h - 1.8);
          const a = P(p.x, p.y, 0), b = P(p.x + dx / l * sl, p.y + dy / l * sl, 0); if (!a || !b) continue;
          ctx.strokeStyle = 'rgba(8,40,20,0.13)'; ctx.lineWidth = Math.max(1, (p.ball ? 0.2 : 0.45) * FOC / a[2]);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
      }
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
      const ph = t * (p.star ? 10 : 8) + p.num * 1.3, sw = Math.sin(ph) * 0.42 * p.run, lean = 0.18 * p.run;
      const pt = (f, s, z) => P(p.x + fx * f + sx * s, p.y + fy * f + sy * s, z);
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
        if (it.stadium) { drawStadium(ctx, t, roar, pat); drawPlayers(ctx, t); }
        else drawBuilding(ctx, it.b, t, pat);
      }
      drawFloodGlow(ctx, t);
      ctx.restore();
      // atmosphere: distance haze toward the top of frame + warm stadium bloom
      ctx.fillStyle = A.linear(ctx, 0, 0, 0, 700, [[0, `rgba(110,60,140,${0.42 * clamp(cam.z / 500)})`], [1, 'rgba(110,60,140,0)']]);
      ctx.fillRect(0, 0, 1920, 700);
      const sc = P(0, 0, 10);
      if (sc) { const k = FOC / sc[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, sc[0], sc[1], 0, 200 * k, [[0, 'rgba(255,235,180,0.16)'], [1, 'rgba(255,235,180,0)']]); ctx.fillRect(sc[0] - 200 * k, sc[1] - 200 * k, 400 * k, 400 * k); ctx.restore(); }
    }
    return { render, P: (...a) => P(...a), setCam };
  })();

  // ---------------------------------------------------------------- drone camera (metres)
  const DEG = Math.PI / 180;
  const q2 = p => 1 - (1 - p) * (1 - p);
  const droneCam = t => {
    const p = inv(0, 4.5, t), ef = q2(p), ed = p * p * (3 - 2 * p), e3 = ease.inOut(p);
    const Lx = lerp(-40, -2, ef) + A.wob(t, 1, 0.35) * 4 * (1 - ed), Ly = lerp(420, 1.5, ef) + A.wob(t, 2, 0.3) * 4 * (1 - ed);
    const z0 = Math.exp(lerp(Math.log(780), Math.log(23), ed)) * (1 + 0.01 * A.wob(t, 3, 0.5));
    const pitch0 = lerp(50, 80, e3) * DEG;
    const yaw = lerp(-0.3, 0.0, ef) + 0.01 * A.wob(t, 4, 0.25);
    const roll = 0.016 * A.wob(t, 5, 0.3) + lerp(0.03, 0, ef);
    const base = z0 / Math.tan(pitch0), hx = Math.sin(yaw), hy = -Math.cos(yaw);
    // 4.5 -> 4.74: tilt up hard toward the horizon (the whip), rising a little; drone position kept
    const w = ease.in(inv(4.5, 4.74, t));
    return { x: Lx - hx * base, y: Ly - hy * base, z: lerp(z0, 40, w), yaw, pitch: lerp(pitch0, 34 * DEG, w), roll };
  };

  // ---------------------------------------------------------------- scene
  const CUT = 4.72;
  A.scene({
    name: 's1_telaviv', start: 0, end: 6.2,
    draw(ctx, s) {
      const t = s.t;
      if (t < CUT) {
        // ---- SHOT A: the drone
        const cam = droneCam(t);
        const roar = clamp(0.3 + 0.7 * smooth(2.9, 3.6, t));
        AER.render(ctx, t, cam, roar);
        caption(ctx, t);
        // tilt-up smear
        if (t > 4.5) {
          const c1 = droneCam(t - 1 / 15), dp = (c1.pitch - cam.pitch) * 1304;
          if (dp > 4) { smear(ctx, 0, Math.min(700, dp), 9); streaks(ctx, t, 0, 1, clamp(dp / 500), 2); }
        }
      } else {
        // ---- SHOT C: whip lands on the IPTV mast, packets launch, follow them over the sea
        const c = camC(t);
        const bc = lerp(0.6, 1.6, smooth(4.9, 5.1, t));
        A.drawTelAviv(ctx, t, { cam: c, roar: 0.8, broadcast: bc });
        if (t >= 4.9) packetBurst(ctx, t, c);
        if (t < 5.05) {
          const c1 = camC(t - 1 / 15);
          const vx = -(c.x - c1.x) * c.zoom, vy = -(c.y - c1.y) * c.zoom, sp = Math.hypot(vx, vy);
          if (sp > 6) { const k = Math.min(1, 700 / sp); smear(ctx, vx * k, vy * k, 9); streaks(ctx, t, vx, vy, clamp(sp / 500), 2); }
        }
        const ex = ease.in(inv(5.75, 6.2, t));
        if (ex > 0) { smear(ctx, -220 * ex, 0, 7); streaks(ctx, t, 1, 0, ex, 7, '190,250,255'); }
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
