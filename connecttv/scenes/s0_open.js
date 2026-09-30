// s0_open: "פותחים את המסך, והעולם של הבידור נפתח בפניכם"  (voice clock v = 0 .. 3.65)
// A black TV screen powers on, a neon bolt CRACKS it on "המסך" (0.74), the glass shatters and a liquid candy iris floods in
// on "והעולם" (1.26), entertainment icons pop on "הבידור" (1.85), mega splash on "נפתח" (2.33), the ConnectTV splash + TV
// silhouette settles on "בפניכם" (2.57).  No brand wordmark here (saved for the end card).
(() => {
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C, W = CL.W, H = CL.H, TAU = A.TAU;   // 1920 x 1080 landscape
  const IX = W / 2, IY = 420;                     // impact / focus point (kept above the caption band y>820)
  const sm = (a, b, x) => A.smooth(a, b, x);
  const T_POW = 0.12, T_CRACK = 0.74, T_BURST = 1.26, T_ICON = 1.85, T_MEGA = 2.33, T_SETTLE = 2.57;

  // ---------------------------------------------------------------- glass shards (web of rays x rings around the impact)
  let SH = null;
  function buildShards() {
    const rg = rng(41), N = 14, rings = [0, 110, 250, 440, 720, 1150, 2200], ang = [];
    for (let i = 0; i < N; i++) ang.push((i + (rg() - .5) * .7) / N * TAU + .2);
    const V = ang.map((a) => rings.map((r, k) => { const rr = k ? r * (1 + (rg() - .5) * .22) : 0, lat = k ? (rg() - .5) * rr * .10 : 0; return [IX + Math.cos(a) * rr - Math.sin(a) * lat, IY + Math.sin(a) * rr + Math.cos(a) * lat]; }));
    const shards = [], segs = [];
    for (let i = 0; i < N; i++) for (let k = 0; k < rings.length - 1; k++) {
      const i2 = (i + 1) % N, poly = k ? [V[i][k], V[i][k + 1], V[i2][k + 1], V[i2][k]] : [V[i][0], V[i][1], V[i2][1]];
      const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]), dx = c[0] - IX, dy = c[1] - IY;
      shards.push({ poly, c, d: Math.hypot(dx, dy), a: Math.atan2(dy, dx), h1: rg(), h2: rg(), h3: rg(), k });
      segs.push([V[i][k], V[i][k + 1]]); if (k) segs.push([V[i][k], V[i2][k]]);
    }
    SH = { shards, segs };
  }

  // ---------------------------------------------------------------- the screen texture (dark glass + power-on line + charge), redrawn each frame
  let SC = null;
  const scan = () => CL.layer('s0_scan', W, H, g => { g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); });
  function screenTex(t) {
    if (!SC) { SC = document.createElement('canvas'); SC.width = W; SC.height = H; }
    const g = SC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = '#02030b'; g.fillRect(0, 0, W, H);
    g.fillStyle = A.radial(g, IX, IY, 0, 1500, [[0, 'rgba(30,40,120,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, W, H);
    g.drawImage(scan(), 0, 0);
    const q = CL.qs(t, 30);
    // static grain (tiny, flickery), heavier just before the strike
    const grain = .25 + .75 * sm(.3, .74, t);
    g.fillStyle = 'rgba(190,220,255,.5)'; for (let i = 0; i < 70 * grain; i++) g.fillRect(hash(q * 3.1 + i) * W, hash(q * 1.7 + i * 2) * H, 2 + hash(i) * 5, 2);
    // CUE 0.12 power-on-line (voice "פותחים": the screen wakes)
    if (t >= T_POW) {
      const lw = t < .38 ? W * ease.out(inv(T_POW, .38, t)) : W * (1 - ease.in(inv(.38, .68, t)));
      const charge = sm(.4, .74, t), th = 5 + charge * 10;
      if (lw > 1) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.fillStyle = A.linear(g, 0, IY - 80, 0, IY + 80, [[0, 'rgba(25,200,255,0)'], [.5, `rgba(25,200,255,${.30 + charge * .3})`], [1, 'rgba(25,200,255,0)']]); g.fillRect(IX - lw / 2, IY - 80, lw, 160);
        g.fillStyle = '#fff'; g.fillRect(IX - lw / 2, IY - th / 2, lw, th); g.restore();
      }
      if (t > .45 && t < T_CRACK + .3) {   // charge orb + tiny arcs building up ("את")
        const k = sm(.45, .74, t), r = 8 + 40 * k * (1 + .15 * Math.sin(t * 70));
        g.save(); g.globalCompositeOperation = 'lighter';
        g.fillStyle = A.radial(g, IX, IY, 0, 120 + 420 * k, [[0, 'rgba(255,255,255,.9)'], [.15, 'rgba(25,200,255,.55)'], [.5, 'rgba(139,61,255,.28)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(IX - 700, IY - 700, 1400, 1400);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(IX, IY, r, 0, TAU); g.fill(); g.restore();
        if (t < T_CRACK) for (let i = 0; i < 4; i++) { const a = hash(q * 2.3 + i * 5) * TAU, L = 130 + hash(q + i) * 220 * k; CL.bolt(g, IX, IY, IX + Math.cos(a) * L, IY + Math.sin(a) * L, k > .2 ? 1 : 0, q * 7 + i, { lw: 4 + 3 * k, col: i % 2 ? C.pink : C.cyan }); }
      }
    }
    // glass reflection streaks
    g.fillStyle = 'rgba(255,255,255,.045)'; g.beginPath(); g.moveTo(-50, 300); g.lineTo(700, -50); g.lineTo(980, -50); g.lineTo(-50, 560); g.fill();
    g.beginPath(); g.moveTo(W + 50, 1130); g.lineTo(1300, 1130); g.lineTo(W + 50, 640); g.fill();
    return SC;
  }

  // ---------------------------------------------------------------- shards draw
  function drawShards(ctx, t, tex) {
    const u = t - T_BURST, crackR = 1900 * ease.out(clamp((t - T_CRACK) / .34)), sepK = sm(.86, T_BURST, t);
    const rum = 1 + 2.5 * sepK;
    for (const s of SH.shards) {
      let ox = 0, oy = 0, rot = 0, sc = 1, al = 1;
      if (u < 0) {
        const cr = s.d < crackR ? 1 : 0, e = (2 + 24 * sepK * sepK) * cr, jj = Math.sin(t * 55 + s.h1 * 40) * rum * sepK * cr;
        ox = Math.cos(s.a) * e + jj; oy = Math.sin(s.a) * e + Math.cos(t * 47 + s.h2 * 30) * rum * sepK * cr; rot = (s.h3 - .5) * .012 * sepK * cr;
      } else {
        // CUE 1.26 shard-burst (glass explodes toward camera, liquid iris floods in)
        const sp = (2100 - Math.min(s.d, 1400) * .55) * (.55 + .9 * s.h1), disp = sp * (1 - Math.exp(-3.4 * u)) / 3.4, fall = 1500 * u * u * (.35 + s.h2);
        const cr = s.d < crackR ? 1 : .35;
        ox = Math.cos(s.a) * (12 + disp) * cr; oy = Math.sin(s.a) * (12 + disp) * cr + fall; rot = (s.h3 - .5) * 6 * u * cr; sc = 1 + (.9 + s.h2) * u * cr; al = 1 - sm(.15, .5 + s.h3 * .25, u);
        if (al <= .01) continue;
      }
      ctx.save(); ctx.globalAlpha = al; ctx.translate(s.c[0] + ox, s.c[1] + oy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-s.c[0], -s.c[1]);
      ctx.beginPath(); s.poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(tex, 0, 0);
      if (u >= 0 || s.d < crackR) { ctx.fillStyle = `rgba(160,220,255,${.05 + .12 * s.h1})`; ctx.fillRect(s.c[0] - 900, s.c[1] - 900, 1800, 1800 * (.3 + .3 * s.h2)); }   // gloss band
      ctx.restore();
      if (u >= 0 || s.d < crackR) { ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(215,245,255,${u >= 0 ? .9 : .55})`; ctx.lineWidth = u >= 0 ? 4 : 2; ctx.stroke(); }
      ctx.restore();
    }
  }
  // glowing crack web (pre burst)
  function drawCracks(ctx, t) {
    const R = 1900 * ease.out(clamp((t - T_CRACK) / .34)); if (R <= 1 || t >= T_BURST) return;
    const fl = .75 + .25 * hash(CL.qs(t, 30) * 3.3);
    ctx.save(); ctx.beginPath(); ctx.arc(IX, IY, R, 0, TAU); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); SH.segs.forEach(([a, b]) => { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }); };
    ctx.globalCompositeOperation = 'lighter';
    const lk = .22 + .5 * sm(.8, T_BURST, t);
    path(); ctx.strokeStyle = A.hex(C.cyan, lk * fl); ctx.lineWidth = 14; ctx.stroke();
    path(); ctx.strokeStyle = A.hex(C.pink, lk * .5 * fl); ctx.lineWidth = 26; ctx.stroke();
    path(); ctx.strokeStyle = `rgba(255,255,255,${.95 * fl})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- liquid iris (candy bands around a blob hole that shows the world)
  const Rf = u => 2000 * ease.out(clamp(u / .8));
  function blobPts(R, seed, u) { const pts = []; for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, r = R * (1 + .07 * A.noise2(Math.cos(a) * 1.4 + seed, Math.sin(a) * 1.4 + u * 2.4 + seed)); pts.push([IX + Math.cos(a) * r, IY + Math.sin(a) * r]); } return pts; }
  const BANDS = [[C.pink, 0], [C.orange, .045], [C.yellow, .09], [C.lime, .135], [C.cyan, .18], [C.purple, .225]];
  const HOLE_LAG = .29;

  // ---------------------------------------------------------------- the candy world
  function rays(ctx, t, k) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(IX, IY); ctx.rotate(t * .25); ctx.fillStyle = A.radial(ctx, 0, 0, 0, 1700, [[0, `rgba(255,255,255,${.20 * k})`], [1, 'rgba(255,255,255,0)']]);
    for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-110, -2000); ctx.lineTo(110, -2000); ctx.fill(); } ctx.restore();
  }
  function waves(ctx, t) {
    const lift = ease.out(inv(1.55, 2.3, t)) + .25 * Math.exp(-Math.max(0, t - T_MEGA) * 4) * Math.sin(Math.max(0, t - T_MEGA) * 14) * (t > T_MEGA ? 1 : 0);
    [[C.purple, 0], [C.blue, 1], [C.cyan, 2]].forEach(([col, j]) => {
      const base = H + 30 - (150 + 45 * j) * lift; ctx.beginPath(); ctx.moveTo(-10, H + 10);
      for (let x = -10; x <= W + 40; x += 30) ctx.lineTo(x, base + Math.sin(x * .008 + t * (1.5 + j * .4) + j * 2) * (26 + 8 * j) + Math.sin(x * .02 - t * 2 + j) * 8);
      ctx.lineTo(W + 10, H + 10); ctx.closePath(); ctx.fillStyle = A.linear(ctx, 0, base - 40, 0, base + 160, [[0, col], [1, A.mixc('#050826', col, .45)]]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 4; ctx.stroke();
    });
  }
  function world(ctx, t) {
    const pk = Math.exp(-Math.max(0, t - T_MEGA) * 3.2) * (t > T_MEGA ? 1 : 0);
    CL.bg(ctx, t, { tint: [C.pink, C.cyan, C.purple], speed: .7 });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, IX, IY, 0, 1200, [[0, A.hex(C.purple, .45 + .4 * pk)], [.5, A.hex(C.pink, .12 + .2 * pk)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
    rays(ctx, t, .7 + 1.2 * pk);
    CL.twinkle(ctx, t * 1.3, 0, 30, W, 780, 28, 5);
    waves(ctx, t);
  }

  // ---------------------------------------------------------------- flying liquid drops (ballistic with drag) and sparks
  function drops(ctx, t, t0, N, seed, o = {}) {
    const u = t - t0; if (u < 0) return; const rg = rng(seed);
    for (let i = 0; i < N; i++) {
      const a = (i + rg() * .8) / N * TAU, sp = (o.min || 500) + rg() * (o.rng || 1100), r = (o.r || 26) * (.6 + rg() * 1.2), k = 1.5 + rg() * .9, g = o.g ?? 700, col = CL.CAND[i % 8];
      const d = sp * (1 - Math.exp(-k * u)) / k, x = (o.x ?? IX) + Math.cos(a) * d * 1.6, y = (o.y ?? IY) + Math.sin(a) * d + g * u * u * .5 - (o.up || 60) * u;
      const life = o.life || 1.6, al = 1 - sm(life * .75, life, u), s = Math.min(1, u * 9) * al; if (s <= .02 || x < -150 || x > W + 150 || y > H + 150) continue;
      CL.drop(ctx, x, y, r * s, col, t, i);
    }
  }
  function burstSparks(ctx, t, t0, N, seed, R) {
    const u = t - t0; if (u < 0 || u > 1.1) return; const rg = rng(seed);
    for (let i = 0; i < N; i++) { const a = rg() * TAU, sp = 300 + rg() * R, d = sp * (1 - Math.exp(-3 * u)) / 3, s = (18 + rg() * 40) * (1 - u / 1.1) * (.6 + .4 * Math.sin(t * 30 + i)); CL.spark(ctx, IX + Math.cos(a) * d, IY + Math.sin(a) * d - 40 * u, s, rg() * 3 + u * 2, [ '#fff', C.yellow, C.cyan, C.pink ][i % 4]); }
  }

  // charging core: a jelly orb that swells at the centre until it detonates as the mega splash on "נפתח"
  function core(ctx, t) {
    if (t < 1.5 || t >= T_MEGA - .02) return; const k = ease.inOut(inv(1.5, T_MEGA - .03, t)), r = 40 + 190 * k, pl = 1 + .06 * Math.sin(t * 16) * k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, IX, IY, 0, r * 3, [[0, A.hex(C.pink, .5 * k)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(IX - r * 3, IY - r * 3, r * 6, r * 6); ctx.restore();
    CL.drop(ctx, IX, IY, r * pl, C.pink, t * 2, 3); CL.drop(ctx, IX - r * .08, IY - r * .06, r * .62 * pl, C.orange, t * 2.5, 5); CL.drop(ctx, IX - r * .1, IY - r * .1, r * .3 * pl, C.yellow, t * 3, 8);
  }
  // rising gel bubbles that keep the candy world alive (continuous, wraps)
  function bubbles(ctx, t) {
    if (t < 1.4) return;
    for (let i = 0; i < 20; i++) {
      const t0 = 1.3 + hash(i * 1.7) * .8, sp = 190 + hash(i * 3.1) * 200, r = 26 + hash(i * 5.3) * 62, per = H + 300, y = H + 150 - (((t - t0) * sp) % per), x = hash(i * 7.7) * W + Math.sin(t * 1.4 + i * 2) * 40;
      if (t < t0 || y > H + 140 && t - t0 < .01) continue; const k = Math.min(1, (t - t0) * 4); CL.drop(ctx, x, y, r * k, CL.CAND[i % 8], t, i);
    }
  }
  // ---------------------------------------------------------------- entertainment icons (play, star, clapper, reel)
  function iconPlay(g, r) { CL.gel(g, 0, 0, r * 2, r * 2, { fill: C.pink, r, rim: '#fff', shadow: 10 }); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-r * .28, -r * .48); g.lineTo(r * .55, 0); g.lineTo(-r * .28, r * .48); g.closePath(); g.lineJoin = 'round'; g.lineWidth = r * .14; g.strokeStyle = '#fff'; g.stroke(); g.fill(); }
  function iconStar(g, r) {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .5 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.lineJoin = 'round';
    g.strokeStyle = C.ink; g.lineWidth = r * .16; g.stroke(); g.fillStyle = A.linear(g, 0, -r, 0, r, [[0, '#fff3a0'], [.5, C.yellow], [1, C.orange]]); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = r * .05; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-r * .18, -r * .3, r * .16, r * .07, -.7, 0, TAU); g.fill();
  }
  function iconClap(g, r) {
    const w = r * 2, h = r * 1.5; CL.gel(g, 0, r * .18, w, h * .78, { fill: '#1b2a86', dark: '#0b1250', r: r * .16, rim: '#fff', shadow: 8 });
    g.save(); g.translate(0, -r * .5); g.rotate(-.16); g.beginPath(); g.roundRect(-w / 2, -r * .22, w, r * .44, r * .1); g.clip(); g.fillStyle = '#fff'; g.fillRect(-w / 2, -r * .3, w, r * .6);
    g.fillStyle = C.cyan; for (let i = -3; i < 5; i++) { g.beginPath(); g.moveTo(-w / 2 + i * r * .5, -r * .3); g.lineTo(-w / 2 + i * r * .5 + r * .25, -r * .3); g.lineTo(-w / 2 + i * r * .5 - r * .05, r * .3); g.lineTo(-w / 2 + i * r * .5 - r * .3, r * .3); g.fill(); } g.restore();
    g.beginPath(); g.roundRect(-w / 2, -r * .72, w, r * .44, r * .1); g.save(); g.translate(0, -r * .5); g.rotate(-.16); g.beginPath(); g.roundRect(-w / 2, -r * .22, w, r * .44, r * .1); g.lineWidth = r * .07; g.strokeStyle = C.ink; g.stroke(); g.restore();
  }
  function iconReel(g, r) {
    CL.gel(g, 0, 0, r * 2, r * 2, { fill: C.purple, r, rim: '#fff', shadow: 10 }); g.fillStyle = '#0b1250'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * r * .5, Math.sin(a) * r * .5, r * .2, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, r * .12, 0, TAU); g.fill();
  }
  const ICONS = [iconPlay, iconStar, iconClap, iconReel];
  function icons(ctx, t) {
    const u = t - T_MEGA; if (u > .6) return;
    ICONS.forEach((fn, i) => {
      const t0 = T_ICON - .07 + i * .022, pp = CL.pop(t, t0, .38); if (pp <= 0) return;
      const a = i * TAU / 4 + .7 + (t - T_ICON) * .9 + (u > 0 ? u * 2 : 0), R0 = pp + (u > 0 ? 2.8 * ease.out(clamp(u / .5)) : 0), sc = (1 + (u > 0 ? u * 1.6 : 0)) * Math.min(1, pp), al = u > 0 ? 1 - sm(0, .55, u) : 1;
      const x = IX + Math.cos(a) * R0 * 640, y = IY + Math.sin(a) * R0 * 270 + Math.sin(t * 3 + i) * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2.2 + i * 2) * .18); ctx.scale(sc, sc); ctx.globalAlpha *= al; fn(ctx, 118); ctx.restore();
    });
  }

  // ---------------------------------------------------------------- bezel of the TV we are inside
  function bezel(ctx, t) {
    const u = t - T_BURST, s = u < 0 ? 1 : 1 + 6 * ease.out(clamp(u / .6)), al = u < 0 ? 1 : 1 - sm(.18, .55, u); if (al <= .01) return;
    ctx.save(); ctx.globalAlpha = al; ctx.translate(IX, IY); ctx.scale(s, s); ctx.translate(-IX, -IY);
    ctx.beginPath(); ctx.rect(-400, -400, W + 800, H + 800); ctx.roundRect(38, 38, W - 76, H - 38 - 84, 70);
    ctx.fillStyle = A.linear(ctx, 0, 0, W, H, [[0, '#4aa8ff'], [.5, C.blue], [1, '#4a1fb8']]); ctx.fill('evenodd');
    ctx.beginPath(); ctx.roundRect(38, 38, W - 76, H - 38 - 84, 70); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
    ctx.lineWidth = 24; ctx.strokeStyle = 'rgba(5,8,38,.28)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(W / 2, 14, W * .5, 22, 0, 0, TAU); ctx.fill();
    const led = t > T_POW ? .5 + .5 * Math.sin(t * 6) : .35; ctx.fillStyle = A.hex(C.pink, .4 + .6 * led); ctx.beginPath(); ctx.arc(W - 150, H - 40, 11, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- ConnectTV splash + TV silhouette hint (settles on "בפניכם")
  function hint(ctx, t) {
    const pp = CL.pop(t, T_SETTLE - .07, .42); if (pp <= 0) return; const on = CL.spring(t, T_SETTLE - .02, .6), bob = Math.sin(t * 2.2) * 8;
    ctx.save(); ctx.translate(IX, IY + 30 + bob); ctx.scale(pp, pp); ctx.rotate((1 - Math.min(1, pp)) * -.2 + Math.sin(t * 1.3) * .015);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, 0, 0, 0, 620, [[0, A.hex(C.cyan, .5)], [.55, A.hex(C.purple, .22)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-640, -640, 1280, 1280); ctx.globalCompositeOperation = 'source-over';
    CL.tv(ctx, 0, 0, 560, 400, (g, sw, sh) => {   // the TV of the logo, screen lit by the liquid world
      g.fillStyle = A.linear(g, 0, -sh / 2, 0, sh / 2, [[0, '#7fe8ff'], [.5, C.blue], [1, C.purple]]); g.fillRect(-sw / 2, -sh / 2, sw, sh);
      g.fillStyle = A.radial(g, 0, 0, 0, sw * .6 * on, [[0, 'rgba(255,255,255,.95)'], [.35, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-sw / 2, -sh / 2, sw, sh);
      CL.spark(g, -sw * .22, -sh * .18, 46 * on * (.8 + .2 * Math.sin(t * 6)), t, '#fff'); CL.spark(g, sw * .25, sh * .2, 30 * on * (.8 + .2 * Math.sin(t * 7 + 2)), -t, C.yellow);
    }, { t, chin: 0 });
    const fl = .65 + .35 * hash(CL.qs(t, 15) * 2.7);   // the logo's neon bolt, crackling across the TV
    CL.bolt(ctx, 380, -330, 120, 40, on, 21, { lw: 12, col: C.cyan, alpha: fl }); CL.bolt(ctx, 380, -330, 120, 40, on, 21, { lw: 5, col: C.pink, alpha: fl * .7 });
    ctx.restore();
  }

  // ---------------------------------------------------------------- scene
  A.scene({ name: 's0_open', start: 0, end: 3.65, draw(ctx, s) {
    const t = s.t;
    // camera: shakes on each impact + punches
    let [sx, sy] = CL.shake(t, T_CRACK, .6, 26), [sx2, sy2] = CL.shake(t, T_BURST, .55, 30), [sx3, sy3] = CL.shake(t, T_MEGA, .6, 26);
    const rumble = sm(.86, T_BURST, t) * (t < T_BURST ? 1 : 0) * 7;
    sx += sx2 + sx3 + Math.sin(t * 61) * rumble; sy += sy2 + sy3 + Math.cos(t * 53) * rumble;
    const z = 1 + .04 * sm(0, T_CRACK, t) + (t > T_CRACK ? .05 * Math.exp(-(t - T_CRACK) * 8) : 0) + (t > T_BURST ? .10 * Math.exp(-(t - T_BURST) * 4.5) : 0) + (t > T_MEGA ? .09 * Math.exp(-(t - T_MEGA) * 5) : 0) + .11 * ease.in(inv(3.0, 3.65, t));
    if (!SH) buildShards();
    ctx.save(); ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = '#02030b'; ctx.fillRect(-300, -300, W + 600, H + 600);
    // light leaking through the cracks
    const leak = sm(.78, T_BURST, t) * (t < T_BURST + .1 ? 1 : 0);
    if (leak > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.radial(ctx, IX, IY, 0, 1300, [[0, A.hex(C.pink, .95 * leak)], [.3, A.hex(C.cyan, .8 * leak)], [.6, A.hex(C.purple, .5 * leak)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore(); }
    // liquid iris + world
    const u = t - T_BURST + .02;
    if (u > 0) {
      const Rh = Rf(u - HOLE_LAG);
      if (Rh < 1500) {
        BANDS.forEach(([col, lag], i) => { const R = Rf(u - lag); if (R < 2) return; A.blob(ctx, blobPts(R, i * 3.1, u)); ctx.fillStyle = col; ctx.fill(); if (i === 0) { ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.stroke(); } });
        if (Rh > 2) { ctx.save(); A.blob(ctx, blobPts(Rh, 9.7, u)); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke(); ctx.clip(); world(ctx, t); ctx.restore(); }
      } else world(ctx, t);
    }
    // glass
    if (t < T_BURST + 1.3) drawShards(ctx, t, screenTex(t));
    drawCracks(ctx, t);
    // CUE 1.26 splash (colour burst through the glass) and drops
    if (t >= T_BURST - .03) { const p = CL.spring(t, T_BURST - .04, .6), fade = 1 - sm(1.55, 2.0, t); if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; CL.splash(ctx, IX, IY, 620, p, 2, [C.pink, C.orange, C.yellow, C.cyan, C.purple, C.lime]); ctx.restore(); } }
    drops(ctx, t, T_BURST, 26, 11, { r: 34, min: 600, rng: 1200, life: 2.6, up: 90, g: 420 });
    bubbles(ctx, t);
    // CUE 1.70 sparkle ping (של)
    if (t > 1.68 && t < 2.2) { const k = (t - 1.7) / .5; CL.ring(ctx, IX, IY, 760, clamp(k), '#fff', 10); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + .3, d = 200 + 640 * ease.out(clamp(k)); CL.spark(ctx, IX + Math.cos(a) * d * 1.5, IY + Math.sin(a) * d * .7, 34 * (1 - clamp(k)), t * 3, i % 2 ? C.yellow : '#fff'); } }
    // CUE 1.85 icons-pop (הבידור)
    core(ctx, t);
    icons(ctx, t);
    // CUE 2.33 mega-splash (נפתח): huge candy splash, ring shockwaves, drops, sparks, flash
    if (t >= T_MEGA - .04) {
      const p1 = CL.spring(t, T_MEGA - .05, .75), p2 = CL.spring(t, T_MEGA - .02, .65), br = 1 + .018 * Math.sin(t * 3.1);
      CL.splash(ctx, IX, IY, 1000 * br, p1, 5, [C.pink, C.orange, C.yellow, C.lime, C.cyan, C.blue, C.purple, C.green]);
      CL.splash(ctx, IX, IY, 660 * br, p2, 12, [C.cyan, C.yellow, C.pink, C.purple, C.orange, C.lime]);
      CL.ring(ctx, IX, IY, 1700, (t - T_MEGA) / .7, '#fff', 34); CL.ring(ctx, IX, IY, 1300, (t - T_MEGA - .07) / .7, C.pink, 24); CL.ring(ctx, IX, IY, 950, (t - T_MEGA - .13) / .7, C.cyan, 18);
      drops(ctx, t, T_MEGA - .02, 36, 23, { r: 44, min: 800, rng: 1500, life: 3.2, up: 120, g: 300 });
      burstSparks(ctx, t, T_MEGA, 36, 7, 1500);
    }
    // hint of the brand: TV silhouette inside the settled splash (בפניכם)
    hint(ctx, t);
    burstSparks(ctx, t, T_SETTLE, 14, 31, 800);
    if (t > T_SETTLE + .3) CL.twinkle(ctx, A.T * .9 + 3, 160, 60, W - 320, 700, 14, 17, ['#fff', C.cyan, C.yellow, C.pink]);
    // CUE 0.74 bolt-crack (המסך): bolt from above lands ON the word; flash, shockwave rings
    { const p = ease.in(clamp((t - .58) / .155)), fl = t < T_CRACK ? 1 : Math.max(0, 1 - sm(.78, 1.08, t)) * (.6 + .4 * hash(CL.qs(t, 30) * 1.9));
      if (p > 0 && fl > 0) { const sd = 3 + (t > T_CRACK ? Math.floor(t * 12) % 3 : 0); CL.bolt(ctx, 1230, -90, IX, IY, p, sd, { lw: 28, col: C.cyan, alpha: fl }); CL.bolt(ctx, 1230, -90, IX, IY, p, sd, { lw: 11, col: C.pink, alpha: fl * .6 }); }
      [[1990, 120, .77, C.pink, 4], [-60, 760, .80, C.purple, 5], [1960, 900, .83, C.cyan, 6], [40, -40, .86, C.yellow, 7]].forEach(([x, y, t0, col, sd]) => { const q = ease.out(clamp((t - t0) / .13)), f2 = Math.max(0, 1 - sm(t0 + .1, t0 + .38, t)); if (q > 0 && f2 > 0) CL.bolt(ctx, IX, IY, x, y, q, sd, { lw: 14, col, alpha: f2 }); });
      CL.ring(ctx, IX, IY, 1500, (t - T_CRACK) / .55, '#fff', 16); CL.ring(ctx, IX, IY, 1000, (t - T_CRACK - .06) / .55, C.cyan, 12);
      if (t > T_CRACK - .005 && t < T_CRACK + .3) { CL.spark(ctx, IX, IY, 300 * Math.exp(-(t - T_CRACK) * 11), .3, '#fff'); CL.spark(ctx, IX, IY, 190 * Math.exp(-(t - T_CRACK) * 11), .3 + Math.PI / 4, C.cyan); }
      const wf = t >= T_CRACK - .005 ? Math.exp(-(t - T_CRACK) * 16) * .8 : 0, wb = t >= T_BURST - .01 ? Math.exp(-(t - T_BURST) * 14) * .4 : 0, wm = t >= T_MEGA - .01 ? Math.exp(-(t - T_MEGA) * 12) * .6 : 0;
      const fa = Math.max(wf, wb, wm); if (fa > .01) { ctx.fillStyle = `rgba(255,255,255,${fa})`; ctx.fillRect(-300, -300, W + 600, H + 600); } }
    bezel(ctx, t);
    ctx.restore();
    // dark vignette on top of everything (keeps the punch cinematic)
    CL.vignette(ctx, .45);
  } });
})();
