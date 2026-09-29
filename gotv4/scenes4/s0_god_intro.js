// ============================================================================
// s0_god_intro  -  "VOICE OF GOD" anime opening, OUTPUT-time interlude T 0..7.0 (s.t = T)
// Divine light: night sky, cel-shaded clouds parting, god rays, halo, feathers, dust motes.
// The Hebrew question appears WORD BY WORD in golden letters, hitting each spoken word.
// Goty (tiny, bottom) reacts. Tel Aviv skyline silhouette. Katakana ゴゴゴ drawn as vector strokes.
// Ends on pure #FFF6E0 (light flash 6.6-7.0) into the host shot at T=7.0.
// ============================================================================
(() => {
  const { clamp, lerp, hash, smooth, inv, TAU } = A;
  const W = 1080, H = 1920, CX = 540;
  const WHITE = '#FFF6E0';
  const eo = A.ease.out, eb = A.ease.outBack;

  // ---------- script (RTL: first word is rightmost of line) ----------
  const WORDS = [
    { w: 'איך', t0: .75, t1: 1.01, line: 0, deep: 1.0 },
    { w: 'אני', t0: 1.07, t1: 1.33, line: 0, deep: .6 },
    { w: 'מוצא', t0: 1.38, t1: 1.76, line: 0, deep: 1.4 },
    { w: 'לעצמי', t0: 1.81, t1: 2.27, line: 1, deep: .8 },
    { w: 'עכשיו', t0: 2.34, t1: 2.86, line: 1, deep: 1.5 },
    { w: 'שידורי', t0: 2.96, t1: 3.53, line: 2, deep: 1.1 },
    { w: 'צפייה', t0: 3.58, t1: 4.0, line: 2, deep: 1.0 },
    { w: 'מישראל', t0: 4.05, t1: 4.65, line: 3, deep: 1.4 },
    { w: 'ובמחיר', t0: 4.94, t1: 5.54, line: 3, deep: 1.6 },
    { w: 'משתלם', t0: 5.61, t1: 6.4, line: 4, deep: 1.2 },
  ];
  const LEAD = .03;                 // visual hit slightly BEFORE the spoken onset
  const QT = 6.12;                  // the "?" pops as the rising tone peaks
  const FLASH0 = 6.58, FLASH1 = 6.93;

  // ---------- layout (measured once) ----------
  let LAY = null;
  function layout(ctx) {
    if (LAY) return LAY;
    let fs = 156;
    const font = s => `900 ${s}px Rubik`;
    const lines = [0, 1, 2, 3, 4].map(l => WORDS.filter(w => w.line === l));
    const measure = s => {
      ctx.font = font(s); ctx.direction = 'rtl';
      const sp = s * .28;
      return lines.map(ws => { const wd = ws.map(w => ctx.measureText(w.w).width); return { wd, tot: wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1), sp }; });
    };
    let M = measure(fs);
    while (Math.max(...M.map(m => m.tot)) > 930 && fs > 80) { fs -= 4; M = measure(fs); }
    const lh = fs * 1.16, y0 = 430;
    lines.forEach((ws, li) => {
      const m = M[li]; let x = CX + m.tot / 2;           // right edge
      ws.forEach((w, i) => { w.wd = m.wd[i]; w.cx = x - w.wd / 2; w.cy = y0 + li * lh; x -= w.wd + m.sp; w.fs = fs; });
    });
    // question mark: sits left of the last word
    const lw = WORDS[9], qfs = fs * 1.2, qw = qfs * .5; lw.cx += qw * .55;
    LAY = { fs, lh, qx: lw.cx - lw.wd / 2 - qw * .62, qy: lw.cy, qfs };
    return LAY;
  }

  // ---------- small vector helpers ----------
  function star4(g, x, y, r, rot = 0, pinch = .16) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4, rr = i % 2 ? r * pinch : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }
  function glint(g, x, y, r, rot, alpha = 1, col = '#FFF6D0') {
    if (alpha <= 0.01 || r < 1) return;
    g.save(); g.globalAlpha *= alpha; g.globalCompositeOperation = 'lighter';
    g.fillStyle = A.radial(g, x, y, 0, r * .9, [[0, 'rgba(255,230,140,.55)'], [1, 'rgba(255,200,80,0)']]); g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = col; star4(g, x, y, r, rot); g.fill();
    g.fillStyle = '#fff'; star4(g, x, y, r * .55, rot + .785, .22); g.fill();
    g.restore();
  }
  function shake(t) {
    let sx = 0, sy = 0;
    for (const w of WORDS) {
      const u = t - (w.t0 - LEAD); if (u < 0 || u > .5) continue;
      const k = w.deep * 11 * Math.exp(-u * 9);
      sx += Math.sin(u * 83 + w.t0 * 9) * k; sy += Math.cos(u * 71 + w.t0 * 5) * k * .9;
    }
    { const u = t - QT; if (u > 0 && u < .6) { const k = 26 * Math.exp(-u * 7); sx += Math.sin(u * 91) * k; sy += Math.cos(u * 77) * k; } }
    // constant deep rumble (grows into the riser)
    const rb = .8 + smooth(.2, 1.5, t) * 1.6 + smooth(5.6, 6.6, t) * 5;
    sx += A.noise1(t * 31) * rb; sy += A.noise1(t * 27 + 40) * rb;
    return [sx, sy];
  }

  // ---------- cached static layers ----------
  const sky = () => A.layer('god_sky', W, H, g => {
    g.fillStyle = A.linear(g, 0, 0, 0, H, [[0, '#04031a'], [.25, '#0a0730'], [.55, '#1c0f52'], [.75, '#3d1c6e'], [.88, '#9a3f78'], [.94, '#e8804f'], [1, '#ffbd7a']]);
    g.fillRect(0, 0, W, H);
    // faint painted colour bands (anime sky)
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(${90 + i * 20},${40 + i * 6},${150 - i * 10},.05)`;
      g.beginPath(); g.moveTo(0, 1000 + i * 90);
      for (let x = 0; x <= W; x += 60) g.lineTo(x, 1000 + i * 90 + Math.sin(x * .006 + i * 2) * 40);
      g.lineTo(W, H); g.lineTo(0, H); g.fill();
    }
    // stars
    for (let i = 0; i < 260; i++) {
      const x = hash(i * 3.1) * W, y = Math.pow(hash(i * 7.7 + 1), 1.6) * 1350, r = .6 + hash(i * 1.9 + 4) * 1.8;
      g.fillStyle = `rgba(255,${235 + hash(i) * 20 | 0},${200 + hash(i + 3) * 55 | 0},${.35 + hash(i * 5) * .55})`;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    // halftone screen-tone (manga) in the outer shadows
    g.fillStyle = 'rgba(6,3,30,.55)';
    for (let y = 0; y < 1500; y += 22) for (let x = ((y / 22) % 2) * 11; x < W; x += 22) {
      const edge = Math.abs(x - CX) / CX, v = clamp((edge - .35) * 1.6) * (1 - y / 1700);
      if (v > .05) { g.beginPath(); g.arc(x, y, 1.2 + v * 6.2, 0, TAU); g.fill(); }
    }
  });

  const skyline = () => A.layer('god_skyline', W, 520, g => {
    // Tel Aviv silhouette: coordinates local, base at y=520. layers: far (lighter) then near (darker)
    const base = 520;
    const bld = (x, w, h, col, roof) => {
      g.fillStyle = col; g.fillRect(x, base - h, w, h);
      if (roof === 'step') { g.fillRect(x + w * .18, base - h - 22, w * .64, 22); g.fillRect(x + w * .4, base - h - 40, w * .2, 18); }
      if (roof === 'ant') { g.fillRect(x + w * .48, base - h - 60, 4, 60); }
      if (roof === 'slant') { g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w, base - h - 26); g.lineTo(x + w, base - h); g.fill(); }
    };
    const far = '#3b1d5e', near = '#160d33';
    let seed = 3;
    for (let x = -10; x < W + 20; x += 44) {
      const h = 90 + hash(seed++) * 150; bld(x, 38 + hash(seed++) * 22, h, far, ['step', 'ant', 'slant', null][hash(seed++) * 4 | 0]);
    }
    // Azrieli-style three towers (round, square, triangle) left
    g.fillStyle = '#20113f';
    g.beginPath(); g.roundRect(70, base - 330, 60, 330, [30, 30, 0, 0]); g.fill();
    g.fillRect(140, base - 350, 62, 350);
    g.beginPath(); g.moveTo(212, base); g.lineTo(212, base - 320); g.lineTo(272, base); g.fill();
    // Shalom Meir-style tall tower + Bauhaus blocks + Jaffa minaret
    g.fillStyle = near;
    g.fillRect(640, base - 300, 70, 300); g.fillRect(652, base - 322, 46, 22); g.fillRect(672, base - 368, 5, 46);
    g.fillRect(760, base - 240, 56, 240); g.fillRect(820, base - 200, 70, 200);
    g.beginPath(); g.moveTo(900, base); g.lineTo(900, base - 150); g.lineTo(925, base - 150); g.lineTo(925, base - 250); g.lineTo(936, base - 250); g.lineTo(930, base - 285); g.lineTo(922, base - 250); g.lineTo(936, base - 250); g.lineTo(936, base - 150); g.lineTo(980, base - 150); g.lineTo(980, base); g.fill();
    for (let x = -6; x < W + 20; x += 52) { if ((x > 60 && x < 290) || (x > 630 && x < 1000)) continue; bld(x, 46 + hash(x) * 20, 70 + hash(x * 1.7 + 2) * 150, near, ['step', null, 'slant', null][hash(x * .3) * 4 | 0]); }
    // sea-front ground strip
    g.fillStyle = '#0a0620'; g.fillRect(0, base - 26, W, 60);
    // windows
    let i = 0;
    for (let y = base - 300; y < base - 34; y += 16) for (let x = 6; x < W; x += 15) {
      i++; if (hash(i * 1.37) < .13) { g.fillStyle = hash(i) > .3 ? 'rgba(255,214,120,.85)' : 'rgba(255,240,200,.9)'; g.fillRect(x, y, 4, 6); }
    }
  });

  // ---------- clouds (cel-shaded) ----------
  const CLOUDS = []; {
    const R = A.rng(7);
    // [side, x, y, scale, layer]  layer 0 = back (slow), 1 = mid, 2 = front (fast + big)
    for (let i = 0; i < 26; i++) {
      const layer = i % 3, side = i % 2 ? 1 : -1;
      CLOUDS.push({ side, ox: 60 + R() * 470, y: 40 + R() * 980 * (layer === 2 ? .8 : 1), s: (layer === 0 ? .8 : layer === 1 ? 1.1 : 1.5) * (.8 + R() * .6), layer, seed: i * 5 + 1, ph: R() * 6 });
    }
  }
  function cloud(g, x, y, s, seed, lit, dark, rim) {
    const n = 7, cs = [];
    for (let i = 0; i < n; i++) {
      const a = i / (n - 1), r = (58 + Math.sin(a * Math.PI) * 60 + hash(seed + i) * 26) * s;
      cs.push([x + (a - .5) * 470 * s + (hash(seed + i * 2) - .5) * 40 * s, y + (hash(seed + i * 3) - .5) * 34 * s - Math.sin(a * Math.PI) * 30 * s, r]);
    }
    // flat base
    cs.push([x - 130 * s, y + 40 * s, 62 * s], [x + 60 * s, y + 46 * s, 66 * s]);
    g.lineJoin = 'round';
    g.fillStyle = 'rgba(8,4,34,.7)'; for (const [cx, cy, r] of cs) { g.beginPath(); g.arc(cx, cy, r + 5, 0, TAU); g.fill(); }   // ink outline
    g.fillStyle = dark; for (const [cx, cy, r] of cs) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
    g.fillStyle = lit; for (const [cx, cy, r] of cs) { g.beginPath(); g.arc(cx - r * .07, cy - r * .2, r * .84, 0, TAU); g.fill(); }
    // rim light on the upper edge
    g.strokeStyle = rim; g.lineWidth = 4 * s + 2; g.lineCap = 'round';
    for (const [cx, cy, r] of cs) { g.beginPath(); g.arc(cx, cy, r - 2, Math.PI * 1.08, Math.PI * 1.55); g.stroke(); }
  }
  function drawClouds(g, t, open, layers, bright) {
    for (const c of CLOUDS) {
      if (!layers.includes(c.layer)) continue;
      const spd = [.5, 1, 1.6][c.layer];
      const drift = Math.sin(t * .35 + c.ph) * 24 * spd + t * 6 * spd * c.side;
      // parting: clouds slide outward, center clears first (closer to the middle => moves further)
      const off = c.side * (open * (380 + c.ox * 1.0 + c.layer * 110));
      const x = CX + c.side * (c.ox * .6 - 60) + off + drift;
      const dist = Math.abs(x - CX) / 540;
      const gl = clamp(1 - dist * .9) * bright;             // proximity to the light
      const lit = A.mixc('#2a2068', '#ffd88a', clamp(gl * 1.1)), dark = A.mixc('#0c0832', '#8a4a92', clamp(gl * .8));
      const rim = A.mixc('#6a5cc0', '#fff2b8', clamp(gl * 1.3));
      if (x < -420 || x > W + 420) continue;
      cloud(g, x, c.y + (c.layer === 2 ? 40 * open : 0), c.s, c.seed, lit, dark, rim);
    }
  }

  // ---------- god rays ----------
  function rays(g, t, k, S, hot) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const N = 17;
    for (let i = 0; i < N; i++) {
      const base = -Math.PI * .5 + (i / (N - 1) - .5) * 2.05 + Math.PI;     // fan, pointing down (+y) after +PI
      const a = Math.PI / 2 + (i / (N - 1) - .5) * 2.15 + Math.sin(t * .35 + i * 1.7) * .05;
      const hw = .018 + hash(i * 3.3) * .05 + hot * .012;
      const L = 1900, al = k * (.14 + hash(i * 9.1) * .16) * (.65 + .35 * Math.sin(t * 1.3 + i * 2.1));
      const x1 = S[0] + Math.cos(a - hw) * L, y1 = S[1] + Math.sin(a - hw) * L, x2 = S[0] + Math.cos(a + hw) * L, y2 = S[1] + Math.sin(a + hw) * L;
      const gr = A.radial(g, S[0], S[1], 0, L, [[0, `rgba(255,236,170,${al})`], [.5, `rgba(255,200,100,${al * .55})`], [1, 'rgba(255,170,80,0)']]);
      g.fillStyle = gr; g.beginPath(); g.moveTo(S[0], S[1]); g.lineTo(x1, y1); g.lineTo(x2, y2); g.fill();
    }
    g.restore();
  }

  // ---------- feathers + dust ----------
  function feather(g, x, y, s, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= a;
    const body = new Path2D(); body.moveTo(0, -60); body.bezierCurveTo(26, -34, 24, 22, 0, 62); body.bezierCurveTo(-24, 22, -26, -34, 0, -60);
    g.fillStyle = '#FFF8E6'; g.fill(body);
    g.save(); g.clip(body); g.fillStyle = 'rgba(255,196,110,.55)'; g.fillRect(0, -70, 40, 140);            // cel shade
    g.strokeStyle = 'rgba(200,150,90,.7)'; g.lineWidth = 1.6; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 12); g.lineTo(i % 2 ? 24 : -24, i * 12 - 14); g.stroke(); } g.restore();
    g.lineWidth = 2.6; g.strokeStyle = 'rgba(70,40,80,.75)'; g.stroke(body);
    g.strokeStyle = '#D9B26A'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 78); g.stroke();
    g.restore();
  }
  function drift(g, t, open) {
    // dust motes (rise slowly, glow gold) and feathers (fall, sway)
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) {
      const sp = 14 + hash(i * 2.2) * 34, x0 = hash(i * 5.1) * W, y = ((hash(i * 3.3) * H - t * sp) % H + H) % H;
      const x = x0 + Math.sin(t * .6 + i) * 26, tw = .5 + .5 * Math.sin(t * 2.5 + i * 3), r = 1.2 + hash(i * 8.8) * 3.2;
      const a = (.25 + .5 * tw) * clamp(.4 + open) * (.4 + .6 * clamp(1 - Math.abs(x - CX) / 700));
      g.fillStyle = `rgba(255,${210 + hash(i) * 40 | 0},130,${a})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      if (r > 3.4) { g.fillStyle = `rgba(255,220,150,${a * .25})`; g.beginPath(); g.arc(x, y, r * 3.2, 0, TAU); g.fill(); }
    }
    g.restore();
    for (let i = 0; i < 16; i++) {
      const sp = 60 + hash(i * 6.1) * 70, per = (H + 300) / sp, ph = hash(i * 1.3) * per, u = ((t + ph) % per) / per;
      const y = -120 + u * (H + 240), x = 80 + hash(i * 2.9) * 920 + Math.sin(t * 1.1 + i * 2.3) * 60 + Math.sin(u * 9 + i) * 30;
      const s = .32 + hash(i * 4.7) * .34, rot = Math.sin(t * 1.4 + i * 1.9) * .9 + Math.sin(t * .7 + i) * .4 + .3;
      feather(g, x, y, s, rot, clamp(open * 1.6 + .2) * .95);
    }
  }

  // ---------- halo ----------
  function halo(g, t, k) {
    const hx = CX, hy = 205, R = 175;
    A.glow(g, hx, hy, 420, '#FFD97A', .55 * k); A.glow(g, hx, hy, 190, '#FFF6D0', .6 * k);
    g.save(); g.translate(hx, hy); g.lineCap = 'round';
    for (const [r, lw, col, al] of [[R + 22, 22, 'rgba(255,210,110,.28)', 1], [R, 16, '#B96A08', 1], [R, 11, '#FFC94A', 1], [R - 4, 4, '#FFF8D8', .9]]) {
      g.strokeStyle = col; g.globalAlpha = al * clamp(k * 1.4); g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    }
    g.globalAlpha = clamp(k * 1.4);
    // inner ring of rotating rune ticks
    g.rotate(t * .25);
    g.strokeStyle = 'rgba(255,236,170,.9)'; g.lineWidth = 3;
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, l = i % 4 ? 8 : 20; g.beginPath(); g.moveTo(Math.cos(a) * (R - 22), Math.sin(a) * (R - 22)); g.lineTo(Math.cos(a) * (R - 22 - l), Math.sin(a) * (R - 22 - l)); g.stroke(); }
    g.rotate(-t * .5);
    g.strokeStyle = 'rgba(255,240,190,.55)'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, R - 56, 0, TAU); g.stroke();
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2 + Math.PI / 4); g.fillStyle = 'rgba(255,240,190,.85)'; star4(g, R - 56, 0, 14, 0, .25); g.fill(); g.restore(); }
    g.restore();
    for (let i = 0; i < 6; i++) { const a = t * .5 + i * TAU / 6; glint(g, hx + Math.cos(a) * R, hy + Math.sin(a) * R, 10 + 6 * Math.sin(t * 5 + i * 2), t + i, .9 * clamp(k * 1.3)); }
  }

  // ---------- ゴ (katakana GO) as vector strokes ----------
  function kanaGo(g, x, y, s, w) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    const P = () => { g.beginPath(); g.moveTo(-34, -30); g.lineTo(34, -30); g.lineTo(34 - 2, 36); g.stroke(); g.beginPath(); g.moveTo(-40, 36); g.lineTo(34, 36); g.stroke();
      g.beginPath(); g.moveTo(40, -58); g.lineTo(48, -40); g.stroke(); g.beginPath(); g.moveTo(58, -62); g.lineTo(66, -44); g.stroke(); };
    g.strokeStyle = 'rgba(30,12,60,.9)'; g.lineWidth = w + 9; P();
    g.strokeStyle = '#FFE7A0'; g.lineWidth = w; P();
    g.restore();
  }
  function rumble(g, t, a) {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha = a;
    // columns of ゴゴゴ climbing both sides, trembling
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x = side < 0 ? 70 : W - 75, y = 1180 + i * 130 + (side < 0 ? 0 : 60), sc = .95 - i * .08;
      const jx = A.noise1(t * 38 + i * 4 + side) * 5, jy = A.noise1(t * 33 + i * 9 + side * 3) * 4;
      g.save(); g.translate(x + jx, y + jy); g.rotate(side * (-.12 + i * .05)); kanaGo(g, 0, 0, sc, 11); g.restore();
    }
    g.restore();
  }

  // ---------- golden Hebrew word ----------
  function fillGold(g, w, mix) {
    const fs = w.fs, top = w.cy - fs * .55;
    const gr = A.linear(g, 0, top, 0, top + fs * 1.1, [[0, '#FFFFF4'], [.42, '#FFEC9C'], [.5, '#FFD457'], [.54, '#FFB92A'], [1, '#EE8A0A']]);
    return mix > 0.01 ? A.linear(g, 0, top, 0, top + fs * 1.1, [[0, A.mixc('#FFFFF4', '#FFFFFF', mix)], [.5, A.mixc('#FFD457', '#FFF6E0', mix)], [1, A.mixc('#EE8A0A', '#FFF6E0', mix)]]) : gr;
  }
  function wordDraw(g, t, w, i, mix) {
    const tw = w.t0 - LEAD, u = t - tw; if (u < 0) return;
    const fs = w.fs, a = clamp(u / .05);
    const sc = lerp(2.5, 1, eb(clamp(u / .2))) * (1 + .012 * Math.sin(t * 3 + i));
    const rot = lerp(i % 2 ? .12 : -.12, 0, eo(clamp(u / .22)));
    const bob = Math.sin(t * 1.7 + i * .8) * 3;
    const cx = w.cx, cy = w.cy + bob;
    // impact burst behind the word: radial speed lines + shock ring
    if (u < .34) {
      const k = 1 - u / .34;
      g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter';
      const nL = 26;
      for (let q = 0; q < nL; q++) {
        const ang = q / nL * TAU + hash(i * 7 + q) * .2, r0 = fs * (.5 + u * 5), r1 = r0 + fs * (1.1 + hash(q + i) * 1.3) * (.5 + k * .5), hw = .028;
        g.fillStyle = `rgba(255,236,160,${.5 * k})`; g.beginPath(); g.moveTo(Math.cos(ang - hw) * r0, Math.sin(ang - hw) * r0 * .7); g.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1 * .7); g.lineTo(Math.cos(ang + hw) * r0, Math.sin(ang + hw) * r0 * .7); g.fill();
      }
      g.strokeStyle = `rgba(255,244,200,${.85 * k})`; g.lineWidth = 8 * k + 1; g.beginPath(); g.ellipse(0, 0, w.wd * .5 + u * 900, fs * .5 + u * 320, 0, 0, TAU); g.stroke();
      g.restore();
    }
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc);
    g.font = `900 ${fs}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.lineJoin = 'round';
    // divine glow
    const gl = 30 + 24 * Math.exp(-u * 4) + mix * 60;
    g.shadowColor = 'rgba(255,190,60,.95)'; g.shadowBlur = gl; g.fillStyle = 'rgba(255,190,60,.9)'; g.fillText(w.w, 0, 0); g.shadowBlur = 0;
    // 3D extrusion of the cel letters (dark amber)
    for (let e = 9; e >= 1; e--) { g.fillStyle = A.mixc('#B85C00', '#4A1F00', e / 9); g.fillText(w.w, e * .9 * .6, e * 1.4 * .6 + 3); }
    g.strokeStyle = '#3A1A05'; g.lineWidth = fs * .13; g.strokeText(w.w, 0, 0);
    g.fillStyle = fillGold(g, { fs, cy: 0 }, mix);
    g.fillText(w.w, 0, 0);
    // rim highlight stroke
    g.strokeStyle = 'rgba(255,255,240,.85)'; g.lineWidth = fs * .022; g.save(); g.translate(-fs * .012, -fs * .018); g.strokeText(w.w, 0, 0); g.restore();
    // white hit-flash
    const fl = Math.exp(-u * 11); if (fl > .02) { g.globalAlpha *= fl; g.fillStyle = '#fff'; g.fillText(w.w, 0, 0); }
    g.restore();
    // sparkles
    for (let q = 0; q < 9; q++) {
      const ph = hash(i * 13 + q) * .25, life = .55 + hash(i * 3 + q) * .3, uu = u - ph; if (uu < 0 || uu > life) continue;
      const k = uu / life, ex = (hash(i * 5 + q * 2) - .5) * (w.wd + fs * .9), ey = (hash(i * 9 + q * 3) - .5) * fs * 1.5;
      const r = fs * (.16 + hash(i + q * 7) * .2) * Math.sin(k * Math.PI);
      glint(g, cx + ex * (1 + k * .15), cy + ey - k * 30, r, k * 2 + q, 1);
    }
    // lingering shimmer (a glint sweeps across each word every ~2.6s)
    const per = 2.6, sw = ((t + i * .37) % per) / per;
    if (u > .6 && sw < .3) { const k = sw / .3; glint(g, cx + (.5 - k) * w.wd, cy - fs * .1 + Math.sin(k * 6) * fs * .15, fs * .17 * Math.sin(k * Math.PI), k * 3, .95); }
  }
  function questionDraw(g, t, mix) {
    const u = t - QT; if (u < 0) return;
    const L = layout(g), fs = L.qfs, x = L.qx, y = L.qy;
    const rise = smooth(QT + .05, QT + .5, t);
    let sc = lerp(3.2, 1, eb(clamp(u / .24))); sc *= 1 + .05 * Math.sin(t * 8) * rise + smooth(6.1, FLASH0, t) * .35;
    const cx = x, cy = y - 8;
    if (u < .45) {  // burst
      const k = 1 - u / .45; g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter';
      for (let q = 0; q < 34; q++) { const ang = q / 34 * TAU, r0 = 60 + u * 700, r1 = r0 + 220 + hash(q) * 300; g.fillStyle = `rgba(255,240,190,${.55 * k})`; g.beginPath(); g.moveTo(Math.cos(ang - .03) * r0, Math.sin(ang - .03) * r0); g.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); g.lineTo(Math.cos(ang + .03) * r0, Math.sin(ang + .03) * r0); g.fill(); }
      g.strokeStyle = `rgba(255,250,220,${k})`; g.lineWidth = 10 * k; g.beginPath(); g.arc(0, 0, 40 + u * 1300, 0, TAU); g.stroke(); g.restore();
    }
    g.save(); g.translate(cx, cy); g.scale(sc, sc); g.rotate(lerp(.25, -.04, eo(clamp(u / .3)))); g.font = `900 ${fs}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.lineJoin = 'round';
    g.shadowColor = 'rgba(255,200,80,1)'; g.shadowBlur = 40 + mix * 100; g.fillStyle = 'rgba(255,200,80,1)'; g.fillText('?', 0, 0); g.shadowBlur = 0;
    for (let e = 10; e >= 1; e--) { g.fillStyle = A.mixc('#B85C00', '#4A1F00', e / 10); g.fillText('?', e * .6, e * .9 + 3); }
    g.strokeStyle = '#3A1A05'; g.lineWidth = fs * .13; g.strokeText('?', 0, 0);
    g.fillStyle = A.linear(g, 0, -fs * .5, 0, fs * .5, [[0, A.mixc('#FFFFF4', '#FFFFFF', mix)], [.5, A.mixc('#FFE27A', '#FFF6E0', mix)], [.54, A.mixc('#FFB92A', '#FFF6E0', mix)], [1, A.mixc('#EE8A0A', '#FFF6E0', mix)]]); g.fillText('?', 0, 0);
    const fl = Math.exp(-u * 9); if (fl > .02) { g.globalAlpha = fl; g.fillStyle = '#fff'; g.fillText('?', 0, 0); }
    g.restore();
    for (let q = 0; q < 12; q++) { const ph = hash(q * 2.7) * .3, uu = u - ph, life = .7; if (uu < 0 || uu > life) continue; const k = uu / life, ang = hash(q) * TAU; glint(g, cx + Math.cos(ang) * (60 + k * 200), cy + Math.sin(ang) * (60 + k * 200), 34 * Math.sin(k * Math.PI), k * 3 + q, 1); }
  }

  // ---------- Goty scene ----------
  function sweatDrop(g, x, y, s, k) {
    g.save(); g.translate(x, y + k * 20); g.scale(s, s); g.globalAlpha *= clamp(k * 3) * (1 - clamp((k - .8) * 5));
    g.beginPath(); g.moveTo(0, -26); g.bezierCurveTo(16, -2, 16, 14, 0, 14); g.bezierCurveTo(-16, 14, -16, -2, 0, -26); g.closePath();
    g.fillStyle = A.linear(g, 0, -26, 0, 14, [[0, '#EAFBFF'], [1, '#6EC8FF']]); g.fill(); g.lineWidth = 3.5; g.strokeStyle = '#0B2A7A'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(-5, 2, 3, 6, .3, 0, TAU); g.fill();
    g.restore();
  }
  function tensionMarks(g, x, y, s, t, k) {   // manga "!" lines
    g.save(); g.translate(x, y); g.strokeStyle = `rgba(255,240,190,${k})`; g.lineCap = 'round'; g.lineWidth = 7 * s;
    for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * .32, r0 = 155 * s, r1 = r0 + (48 + (i % 2 ? 16 : 0)) * s; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke(); }
    g.restore();
  }
  function goty(g, t) {
    const gx = CX, gs = .8, base = 1690;
    // reaction state
    const w = WORDS;
    let pose = 'peek', face = 'happy', hopY = 0, rot = 0, look = { x: 0, y: -.95 };
    const gasp = u => u >= 0 && u < .7;
    const g1 = t - (w[0].t0 - LEAD);
    if (gasp(g1)) { pose = 'shock'; face = 'wow'; hopY = -80 * Math.sin(clamp(g1 / .5) * Math.PI) * Math.exp(-g1 * 2); }
    else if (t >= w[7].t0 - .05 && t < QT) { face = 'worried'; rot = A.key(t, [[4.05, 0], [4.35, -.16, 'out'], [4.8, -.16], [5.0, .14, 'inOut'], [5.6, .14], [QT, .0]]); look = { x: -.5, y: -.7 }; }
    else if (t >= 2.8 && t < 3.0) { pose = 'shock'; face = 'wow'; }
    else if (t >= 5.54 && t < QT) { face = 'worried'; rot = A.key(t, [[5.54, .14], [QT, .2, 'out']]); }
    // 'huh?!' beat
    const q = t - QT;
    if (q >= 0) { pose = 'shock'; face = 'wow'; rot = 0; hopY = -110 * Math.sin(clamp(q / .55) * Math.PI) * Math.exp(-q * 1.6); look = { x: 0, y: -1 }; }
    // reverent tiny sway
    if (t > 1.5 && q < 0) rot += Math.sin(t * 1.4) * .02;
    const y = base + hopY;
    // light pool + pillar contact
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = A.radial(g, gx, base + 92, 0, 300, [[0, 'rgba(255,225,140,.55)'], [1, 'rgba(255,200,100,0)']]); g.save(); g.translate(gx, base + 92); g.scale(1, .22); g.translate(-gx, -(base + 92)); g.fillRect(gx - 320, base - 300, 640, 700); g.restore(); g.restore();
    V.mascot(g, gx, y, gs, { t, pose, face, look, prop: 'none', rot, seed: 3, shadow: true });
    const bounceHop = 0;                          // body hop for peek pose is 0 (bounce*9 applied inside)
    const hop = Math.abs(Math.sin(((t * 2) % 1) * Math.PI)) * (pose === 'shock' ? 4 : 9) * gs;
    const ey = y - hop + (-10) * gs, eL = gx + rot * -0 - 34 * gs, eR = gx + 34 * gs;
    // sparkle eyes (star glints over the glossy eyes) while in awe
    const awe = smooth(.9, 1.6, t) * (1 - smooth(4.0, 4.3, t)) + smooth(4.3, 4.6, t) * .0;
    const wow = q >= 0 ? 1 : gasp(g1) ? 1 : 0;
    const sp = Math.max(awe, wow);
    if (sp > .05) {
      const tw = .75 + .25 * Math.sin(t * 11);
      for (const [ex, ph] of [[eL, 0], [eR, 1.6]]) {
        glint(g, ex - 4 * gs, ey - 10 * gs, (24 + 10 * Math.sin(t * 9 + ph)) * gs * sp * tw, t * 1.2 + ph, .95, '#FFFFFF');
        glint(g, ex + 8 * gs, ey + 12 * gs, 10 * gs * sp, -t + ph, .9, '#CFF3FF');
      }
    }
    // sweat drop after the first word, worry in the question
    if (t > 1.6) { const k = ((t - 1.6) % 2.4) / 2.4; if (t < QT + 1.2) sweatDrop(g, gx + 96 * gs + 6, y - 70 * gs + Math.sin(t * .0), gs * 1.05, k); }
    if (q >= 0) tensionMarks(g, gx, y - 20, gs, t, Math.exp(-q * 2.2) * clamp(q * 30));
    // reverent blush stars floating up towards the light
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const u = ((t * .35 + hash(i * 3.3)) % 1), sx = gx + (hash(i * 7.1) - .5) * 200 + Math.sin(u * 6 + i) * 20, sy = y - 140 * gs - u * 300; glint(g, sx, sy, 8 * Math.sin(u * Math.PI) + 1, u * 5 + i, .7 * clamp(t / 1.5)); }
    g.restore();
  }

  // ---------- main ----------
  A.scene({
    name: 'god_intro', outT: true, start: 0, end: 7.0,
    draw(g, s) {
      const t = s.t;
      layout(g);
      const open = smooth(.15, 3.6, t);                                        // clouds part
      const beams = clamp(.18 + open * .9 + smooth(5.5, 6.5, t) * .8);
      const fade = 1;                                                          // (compositor fades in from black)
      const hot = smooth(5.7, 6.5, t);
      const [shx, shy] = shake(t);
      const zoom = 1 + smooth(0, 6.6, t) * .06 + smooth(6.0, 6.6, t) * .08;

      // impact frames: 2 frames of inverted "manga" panel on the first word hit and the '?'
      const f = s.f;
      const impactFrame = (t0) => { const u = t - t0; return u >= 0 && u < 2 / 30 ? (Math.floor(u * 30) % 2) + 1 : 0; };
      const imp = impactFrame(WORDS[0].t0 - LEAD) || 0;

      g.save();
      g.translate(CX + shx, 960 + shy); g.scale(zoom, zoom); g.translate(-CX, -960);
      // ---- sky ----
      g.drawImage(sky(), 0, 0);
      const S = [CX, 220];
      // celestial glow behind the parting clouds
      A.glow(g, S[0], S[1], 1100, '#FF9A50', .18 + .35 * open);
      A.glow(g, S[0], S[1], 640, '#FFE2A0', .25 + .55 * open + hot * .3);
      // ---- back layers ----
      drawClouds(g, t, open, [0], .05 + open * .7);
      rays(g, t, beams, S, hot);
      drawClouds(g, t, open, [1], .05 + open * .8);
      halo(g, t, .25 + open * .75);
      // pillar of light down onto Goty
      g.save(); g.globalCompositeOperation = 'lighter';
      const pw = 150 + 30 * Math.sin(t * .8) + hot * 100;
      g.fillStyle = A.linear(g, 0, 300, 0, 1800, [[0, `rgba(255,236,170,${.1 + .12 * open})`], [.7, `rgba(255,214,120,${.08 + .08 * open + hot * .2})`], [1, `rgba(255,200,100,${.2 + hot * .3})`]]);
      g.beginPath(); g.moveTo(CX - 90, 300); g.lineTo(CX + 90, 300); g.lineTo(CX + pw, 1790); g.lineTo(CX - pw, 1790); g.fill(); g.restore();
      drawClouds(g, t, open, [2], .0 + open * .8);
      // ---- skyline + ground ----
      g.save(); g.globalAlpha = 1; g.drawImage(skyline(), 0, H - 520 - 16);
      // warm horizon glow rim
      A.glow(g, CX, H - 210, 700, '#FF9A5A', .28); g.restore();
      g.fillStyle = A.linear(g, 0, 1770, 0, H, [[0, '#0e0728'], [1, '#05030f']]); g.fillRect(-20, 1800, W + 40, 140);
      g.fillStyle = 'rgba(255,220,140,.35)'; g.fillRect(-20, 1799, W + 40, 3);
      // twinkle windows
      for (let i = 0; i < 26; i++) { const wx = 20 + hash(i * 4.1) * 1040, wy = 1560 + hash(i * 9.9) * 200, a = .5 + .5 * Math.sin(t * 3 + i * 2); glint(g, wx, wy, 4 + 3 * a, 0, .35 * a); }
      // ---- drift: dust + feathers ----
      drift(g, t, open);
      // ---- rumble katakana (behind the letters) ----
      rumble(g, t, smooth(.1, .6, t) * .8 * (1 - smooth(6.3, 6.6, t)));
      // ---- Goty ----
      goty(g, t);
      // ---- Hebrew words ----
      const mixW = smooth(6.2, FLASH0 + .1, t) * .85;
      WORDS.forEach((w, i) => wordDraw(g, t, w, i, mixW));
      questionDraw(g, t, mixW);
      // tiny glints across the whole sky
      for (let i = 0; i < 14; i++) { const a = .5 + .5 * Math.sin(t * 2.2 + i * 1.9); glint(g, hash(i * 3.3) * W, 60 + hash(i * 7.7) * 1200, 5 + 10 * a * hash(i), t * .5 + i, .5 * a * open); }
      g.restore();

      // ---- anime overlay: vertical soft vignette + speed lines on riser ----
      if (hot > 0.01) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(CX, 440);
        for (let q = 0; q < 46; q++) { const ang = hash(q * 1.7) * TAU + t * .15, r0 = 220 + hash(q) * 200 + (1 - hot) * 500, r1 = r0 + 500 + hash(q + 9) * 900; const hw = .012 + hash(q * 3) * .012; g.fillStyle = `rgba(255,244,210,${hot * .28})`; g.beginPath(); g.moveTo(Math.cos(ang - hw) * r0, Math.sin(ang - hw) * r0); g.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); g.lineTo(Math.cos(ang + hw) * r0, Math.sin(ang + hw) * r0); g.fill(); }
        g.restore();
      }
      // impact frame inversion
      if (imp) {
        g.save(); g.fillStyle = imp === 1 ? '#000' : '#fff'; g.globalAlpha = .82; g.fillRect(0, 0, W, H);
        g.translate(CX, WORDS[0].cy); g.strokeStyle = imp === 1 ? '#fff' : '#000'; g.lineWidth = 5;
        for (let q = 0; q < 60; q++) { const a = q / 60 * TAU + hash(q) * .1, r0 = 120 + hash(q * 2) * 80; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 1700, Math.sin(a) * 1700); g.stroke(); }
        g.restore();
        // the first golden word stays visible over the inversion
        g.save(); g.translate(CX + shx, 960 + shy); g.scale(zoom, zoom); g.translate(-CX, -960); wordDraw(g, t, WORDS[0], 0, 0); g.restore();
      }
      // ---- white light flash -> pure #FFF6E0 ----
      const fk = smooth(FLASH0, FLASH1, t);
      if (fk > 0) {
        // bloom from the question mark first, then everything
        const L = LAY, cxq = L.qx, cyq = L.qy;
        const rr = lerp(80, 2600, Math.pow(fk, .8));
        g.save(); g.globalAlpha = 1; g.fillStyle = A.radial(g, cxq, cyq, 0, rr, [[0, WHITE], [.55, WHITE], [1, 'rgba(255,246,224,0)']]); g.fillRect(0, 0, W, H); g.restore();
        g.save(); g.globalAlpha = Math.pow(fk, 1.6); g.fillStyle = WHITE; g.fillRect(0, 0, W, H); g.restore();
      }
      if (t >= FLASH1) { g.fillStyle = WHITE; g.fillRect(0, 0, W, H); }
    },
  });
})();
