// V6 IMPACT (global 25.61-30.42): frozen spinner + gold 3D slam + glass shatter, giant gold period, zoom-whip into a slow-mo penalty, goal eruption, pull-back whip.
(() => {
  'use strict';
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const C = V.C, TAU = Math.PI * 2, PI = Math.PI;
  const eo = ease.out, ein = ease.in, eio = ease.inOut;
  const lin = V.lin, rad = V.rad, glow = V.glow;
  const sst = (a, b, x) => A.smooth(a, b, x);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const mixc = (a, b, t) => A.mixc(a, b, t);

  // ------------------------------------------------------------------ timeline (global seconds)
  const T0 = 25.61;
  const TS1 = 25.62, TC1 = TS1 + 0.09;         // "אין" approach start / contact
  const TS2 = 25.90, TC2 = TS2 + 0.09;         // "תקיעות" approach / contact = spinner shatters
  const TDOT = 26.55;                          // giant period contact
  const TZ0 = 27.0, TW0 = 27.11;               // type whoosh start / world takes over
  const HOLD0 = 28.46, HOLD1 = 28.54;          // tiny freeze-frame on the smash
  const KICK = 28.15, GOALW = 29.20, GOALR = 29.28;   // world time of boot / net contact, real time of net contact
  const PB0 = 29.75, PB1 = 30.12, WH1 = 30.42;

  // ------------------------------------------------------------------ shake
  const SHK = [[TC1, 1.0, 7], [TC2, 2.5, 5], [TDOT, 1.8, 8], [28.05, 1.3, 9], [GOALR, 2.2, 5]];
  function shake(t) {
    let x = 0, y = 0, r = 0;
    for (const [te, a, k] of SHK) { const d = t - te; if (d < 0 || d > 1.3) continue; const e = a * Math.exp(-d * k); x += e * A.noise1(t * 47 + te * 3) * 22; y += e * A.noise1(t * 41 + te * 5 + 9) * 22; r += e * A.noise1(t * 33 + te) * 0.012; }
    return { x, y, r };
  }

  // ================================================================== IMPACT ASSETS
  const SPX = 540, SPY = 610, SPR = 290;
  const Y1 = 385, Y2 = 690, DOTX = 540, DOTY = 985, DOTR = 118;

  // extruded chrome-gold text layer: deep extrusion, chrome face with horizon band + sky reflection, bevel
  function textLayer(key, str, size, maxW) {
    return A.layer(key, 1080, Math.round(size * 1.85), (g, w, h) => {
      g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
      let sz = size; g.font = `900 ${sz}px Rubik`; const tw = g.measureText(str).width; if (tw > maxW) sz = sz * maxW / tw;
      g.font = `900 ${sz}px Rubik`;
      const cx = w / 2 - 20, cy = h / 2 - 26, D = 58, ex = 0.5, ey = 1.0;
      g.strokeStyle = '#1b0c02'; g.lineWidth = sz * 0.085 + 10;
      g.strokeText(str, cx + D * ex, cy + D * ey); g.strokeText(str, cx, cy);
      for (let k = D; k >= 1; k -= 1) { g.strokeText(str, cx + k * ex, cy + k * ey); }
      for (let k = D; k >= 1; k--) { const q = k / D; g.fillStyle = mixc(k < 6 ? '#FFD36A' : '#F5A623', '#4a2000', Math.pow(q, 0.75)); g.fillText(str, cx + k * ex, cy + k * ey); }
      // extrusion side: horizon reflection band + edge lines
      g.save(); g.globalAlpha = .55; g.globalCompositeOperation = 'source-atop'; g.fillStyle = lin(g, 0, cy + sz * .1, 0, cy + sz * .5 + D, [[0, 'rgba(255,240,180,.0)'], [.5, 'rgba(255,225,140,.35)'], [1, 'rgba(120,60,0,.45)']]); g.fillRect(0, 0, w, h); g.restore();
      g.globalAlpha = 0.45; g.fillStyle = '#fff2c0'; g.fillText(str, cx + 2 * ex, cy + 2 * ey); g.globalAlpha = 1;
      const f = mk(w, h), fg = f.getContext('2d'); fg.direction = 'rtl'; fg.textAlign = 'center'; fg.textBaseline = 'middle'; fg.lineJoin = 'round'; fg.font = g.font;
      fg.fillStyle = lin(fg, 0, cy - sz * 0.5, 0, cy + sz * 0.55, [[0, '#FFFDF0'], [0.16, '#FFEFB0'], [0.34, '#FFC94E'], [0.5, '#A9640A'], [0.53, '#FFE08A'], [0.7, '#FFB92E'], [0.9, '#F09A14'], [1, '#D97F08']]); fg.fillText(str, cx, cy);
      fg.globalCompositeOperation = 'source-atop';
      fg.fillStyle = lin(fg, 0, cy - sz * .5, 0, cy - sz * .05, [[0, 'rgba(140,200,255,.32)'], [1, 'rgba(140,200,255,0)']]); fg.fillRect(0, cy - sz * .5, w, sz * .5);
      fg.strokeStyle = 'rgba(255,255,255,.85)'; fg.lineWidth = sz * 0.05; fg.strokeText(str, cx - 3, cy - 4);
      fg.strokeStyle = 'rgba(150,60,0,.6)'; fg.lineWidth = sz * 0.05; fg.strokeText(str, cx + 4, cy + 5);
      g.strokeStyle = '#1b0c02'; g.lineWidth = sz * 0.05; g.strokeText(str, cx, cy);
      g.drawImage(f, 0, 0);
    });
  }
  const L1 = () => textLayer('v6L1', 'אין', 330, 900);
  const L2 = () => textLayer('v6L2', 'תקיעות', 300, 960);

  // glossy frozen spinner
  function spinBase() {
    return A.layer('v6spin', 900, 900, g => {
      const cx = 450, cy = 450, R = SPR, N = 12, a0 = -35 * PI / 180, r = rng(9);
      // frozen glass track
      g.save(); g.lineWidth = 22; g.strokeStyle = 'rgba(160,230,255,.10)'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      g.lineWidth = 3; g.strokeStyle = 'rgba(220,250,255,.35)'; g.beginPath(); g.arc(cx, cy, R + 11, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, R - 11, 0, TAU); g.stroke(); g.restore();
      for (let i = N - 1; i >= 0; i--) {
        const a = a0 - i * (TAU / N), rr = 66 - i * 3.6, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, al = 1 - i * 0.055;
        g.save(); g.globalAlpha = al; g.translate(x, y);
        g.shadowColor = 'rgba(90,209,255,.95)'; g.shadowBlur = 46;
        g.fillStyle = rad(g, -rr * .3, -rr * .38, rr * .05, rr * 1.05, [[0, '#FFFFFF'], [0.22, '#C9F1FF'], [0.55, '#4DA8FF'], [0.88, '#1A3FD6'], [1, '#0B1E86']]);
        g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.fill(); g.shadowColor = 'transparent';
        // inner refraction crescent + rim
        g.strokeStyle = 'rgba(160,245,255,.85)'; g.lineWidth = rr * .09; g.beginPath(); g.arc(0, 0, rr * .82, .25 * PI, .95 * PI); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, rr - 1.5, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(-rr * .32, -rr * .42, rr * .3, rr * .17, -.6, 0, TAU); g.fill();
        // frost patches
        g.save(); g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.clip();
        for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(235,252,255,${.28 + r() * .3})`; g.beginPath(); const ba = r() * TAU, bl = 8 + (r() * 3 | 0); for (let q = 0; q < bl; q++) { const aa = ba + q / bl * 1.6, rd = rr * (0.55 + r() * .55); g.lineTo(Math.cos(aa) * rd, Math.sin(aa) * rd); } g.closePath(); g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.6; for (let k = 0; k < 6; k++) { g.beginPath(); let px = (r() - .5) * rr, py = (r() - .5) * rr; g.moveTo(px, py); for (let q = 0; q < 4; q++) { px += (r() - .5) * rr * .6; py += (r() - .5) * rr * .6; g.lineTo(px, py); } g.stroke(); }
        g.restore();
        // ice crystals radiating out
        for (let k = 0; k < 9; k++) { const aa = r() * TAU, len = 16 + r() * 44 * (1 - i * .04), wd = 4 + r() * 6; g.save(); g.rotate(aa); g.fillStyle = `rgba(${210 + r() * 40 | 0},250,255,${.55 + r() * .4})`; g.beginPath(); g.moveTo(rr - 3, -wd); g.lineTo(rr + len, 0); g.lineTo(rr - 3, wd); g.closePath(); g.fill(); g.restore(); }
        g.restore();
      }
      // icicles hanging from the lower half of the track
      for (let k = 0; k < 14; k++) { const a = PI * (.1 + r() * .8), x = cx + Math.cos(a) * (R + 8), y = cy + Math.sin(a) * (R + 8), len = 22 + r() * 60; g.fillStyle = `rgba(215,248,255,${.45 + r() * .4})`; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + (r() - .5) * 6, y + len); g.closePath(); g.fill(); }
    });
  }
  const spinTint = (key, col) => A.layer(key, 900, 900, g => { g.drawImage(spinBase(), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 900, 900); });

  function drawSpinner(ctx, cx, cy, sc, gl, fi, alpha = 1) {
    const base = spinBase(); ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha = alpha;
    ctx.drawImage(base, -450, -450);
    if (gl > 0.02) {
      const r = rng(fi * 13 + 5), sp = 20 * gl;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.32 * gl * alpha; ctx.drawImage(spinTint('v6spinC', '#00E5FF'), -450 + sp, -450); ctx.drawImage(spinTint('v6spinM', '#FF2A9A'), -450 - sp, -450 + 2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
      for (let k = 0; k < 6; k++) { const sy = r() * 860, sh = 14 + r() * 60, dx = (r() - .5) * 220 * gl; ctx.drawImage(base, 0, sy, 900, sh, -450 + dx, -450 + sy, 900, sh); if (r() < .4) { ctx.fillStyle = `rgba(0,229,255,${.25 * gl})`; ctx.fillRect(-450 + dx, -450 + sy, 900, 3); } }
    }
    ctx.restore();
  }

  // cracks
  const CRACKS = (() => {
    const r = rng(77), out = [];
    const walk = (x, y, a, len, dep) => { const pts = [[x, y]]; let l = 0; while (l < len) { const st = 16 + r() * 26; a += (r() - .5) * .8; x += Math.cos(a) * st; y += Math.sin(a) * st; pts.push([x, y]); l += st; if (dep < 2 && r() < .22) walk(x, y, a + (r() < .5 ? -1 : 1) * (.5 + r() * .6), len * .4 + 30, dep + 1); } out.push(pts); };
    for (let i = 0; i < 9; i++) walk(0, 0, i / 9 * TAU + (r() - .5) * .3, 200 + r() * 260, 0);
    return out;
  })();
  function drawCracks(ctx, cx, cy, g, alpha = 1, sc = 1) {
    if (g <= 0) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? `rgba(255,255,255,${.95 * alpha})` : `rgba(80,210,255,${.5 * alpha})`; ctx.lineWidth = pass ? 2.2 : 6;
      for (const pts of CRACKS) { const n = Math.max(1, Math.floor(g * (pts.length - 1) + 1e-6)), fr = g * (pts.length - 1) - Math.floor(g * (pts.length - 1)); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n && i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (n < pts.length - 1) { const a = pts[n], b = pts[n + 1]; ctx.lineTo(lerp(a[0], b[0], fr), lerp(a[1], b[1], fr)); } ctx.stroke(); }
    }
    ctx.restore();
  }

  // shards
  function genShards(N, seed, spec) {
    const r = rng(seed), out = [];
    for (let i = 0; i < N; i++) {
      const a = r() * TAU, rr = spec.ring ? spec.R + (r() - .5) * 46 : Math.sqrt(r()) * spec.R;
      const size = spec.smin + Math.pow(r(), 2) * (spec.smax - spec.smin), nv = 3 + (r() * 2.4 | 0), poly = [];
      const angs = Array.from({ length: nv }, () => r() * TAU).sort((p, q) => p - q);
      angs.forEach(an => { const rd = size * (.45 + r() * .75); poly.push([Math.cos(an) * rd, Math.sin(an) * rd * (.6 + r() * .6)]); });
      const dir = a + (r() - .5) * .5, sp = spec.v0 + r() * (spec.v1 - spec.v0);
      out.push({ ox: Math.cos(a) * rr, oy: Math.sin(a) * rr, vx: Math.cos(dir) * sp, vy: Math.sin(dir) * sp - 80, vz: spec.z0 + r() * (spec.z1 - spec.z0), poly, ax: r() * TAU, ay: r() * TAU, az: r() * TAU, wx: (r() - .5) * 16, wy: (r() - .5) * 16, wz: (r() - .5) * 12, ph: r() * TAU, size });
    }
    return out;
  }
  const SH_BIG = genShards(190, 2024, { R: SPR, ring: true, smin: 12, smax: 92, v0: 120, v1: 900, z0: 300, z1: 2900 });
  const SH_SMALL = genShards(70, 555, { R: 120, ring: false, smin: 5, smax: 26, v0: 150, v1: 900, z0: 100, z1: 1200 });

  function drawShards(ctx, list, tau, cx, cy, Fz, grav) {
    if (tau < 0) return;
    ctx.save();
    const items = [];
    for (const s of list) {
      const z = s.vz * tau; const den = 1 - z / Fz; if (den < 0.07) continue;
      const sc = 1 / den, X = s.ox + s.vx * tau, Y = s.oy + s.vy * tau + 0.5 * grav * tau * tau;
      items.push([z, s, sc, cx + X * sc, cy + Y * sc]);
    }
    items.sort((a, b) => a[0] - b[0]);
    for (const [z, s, sc, sx, sy] of items) {
      if (sx < -600 || sx > 1700 || sy < -600 || sy > 2500) continue;
      const ax = s.ax + s.wx * tau, ay = s.ay + s.wy * tau, az = s.az + s.wz * tau;
      const cxr = Math.cos(ax), sxr = Math.sin(ax), cyr = Math.cos(ay), syr = Math.sin(ay), czr = Math.cos(az), szr = Math.sin(az);
      const pts = s.poly.map(([u, v]) => {
        let x = u, y = v * cxr, zz = v * sxr;      // rotate about x
        const x2 = x * cyr + zz * syr; zz = -x * syr + zz * cyr; x = x2;   // about y
        return [(x * czr - y * szr) * sc, (x * szr + y * czr) * sc];
      });
      const nz = cxr * cyr, facing = Math.abs(nz);
      const L = -0.35 * (cyr * sxr * 0 + 0) + 0;      // (unused)
      const glint = Math.pow(Math.max(0, Math.sin(ax * 1.7 + ay * 1.3 + s.ph)), 10);
      const depthA = clamp(1.25 - sc * 0.14, 0.25, 1), near = sc > 2.2;
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(sx + p[0], sy + p[1]) : ctx.moveTo(sx + p[0], sy + p[1]))); ctx.closePath();
      const g = ctx.createLinearGradient(sx - s.size * sc, sy - s.size * sc, sx + s.size * sc, sy + s.size * sc);
      g.addColorStop(0, `rgba(235,252,255,${(.6 * facing + .18) * depthA})`); g.addColorStop(.5, `rgba(120,200,255,${(.35 + .2 * facing) * depthA})`); g.addColorStop(1, `rgba(40,110,230,${.5 * depthA})`);
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(1.4, 2.2 * Math.min(sc, 3)); ctx.strokeStyle = `rgba(255,255,255,${(.55 + .4 * glint) * depthA})`; ctx.stroke();
      if (glint > .05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${glint * .8 * depthA})`; ctx.fill(); ctx.restore(); }
      if (glint > .35 && s.size > 24) V.sparkle(ctx, sx, sy, s.size * sc * .9 * glint, '#fff', 0, glint);
      // streak (motion blur friendly)
      if (tau < .5 && s.size > 20 && Fz > 1200) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(150,220,255,${.22 * depthA})`; ctx.lineWidth = s.size * sc * .25; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx + (s.ox + s.vx * (tau - .045)) / Math.max(.1, 1 - s.vz * (tau - .045) / Fz), cy + (s.oy + s.vy * (tau - .045)) / Math.max(.1, 1 - s.vz * (tau - .045) / Fz)); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore();
  }

  // rays texture
  const raysTex = () => A.layer('v6rays', 1200, 1200, g => {
    g.translate(600, 600); const N = 28;
    for (let i = 0; i < N; i++) { const a = i / N * TAU, w = TAU / N * (.18 + .22 * hash(i + 3)); g.save(); g.rotate(a); g.fillStyle = rad(g, 0, 0, 20, 600, [[0, 'rgba(255,225,150,.75)'], [.6, 'rgba(255,190,90,.22)'], [1, 'rgba(255,190,90,0)']]); g.beginPath(); g.moveTo(0, 0); g.lineTo(600, -Math.tan(w / 2) * 600); g.lineTo(600, Math.tan(w / 2) * 600); g.closePath(); g.fill(); g.restore(); }
  });

  function shock(ctx, cx, cy, age, o = {}) {
    const dur = o.dur ?? .55; if (age < 0 || age > dur) return; const u = age / dur, r = eo(u) * (o.R ?? 1500), a = Math.pow(1 - u, 1.4) * (o.a ?? 1), w = (o.w ?? 110) * (1 - u * .7) + 6;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); if (o.sy) ctx.scale(1, o.sy);
    ctx.lineWidth = w; ctx.strokeStyle = rad(ctx, 0, 0, Math.max(1, r - w), r + w, [[0, 'rgba(255,200,90,0)'], [.5, `rgba(255,214,120,${.5 * a})`], [.8, `rgba(255,255,255,${.95 * a})`], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = 5 + 5 * (1 - u); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function burstLines(ctx, cx, cy, age, seed, col = '255,235,170', n = 46, dur = .45) {
    if (age < 0 || age > dur) return; const u = age / dur, r = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy);
    for (let i = 0; i < n; i++) { const a = r() * TAU, r0 = 80 + r() * 200 + eo(u) * 900 * (.6 + r() * .6), len = 60 + r() * 380 * (1 - u * .5); ctx.strokeStyle = `rgba(${col},${(1 - u) * (.35 + r() * .5)})`; ctx.lineWidth = 2 + r() * 6 * (1 - u); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len)); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- impact drawing
  function bgImpact(ctx, t) {
    const lt = t - T0;
    ctx.fillStyle = lin(ctx, 0, 0, 0, 1920, [[0, '#04061a'], [.45, '#0a1248'], [1, '#03040e']]); ctx.fillRect(0, 0, 1080, 1920);
    const en = Math.exp(-lt * 2.4) + .9 * Math.exp(-Math.max(0, t - TC2) * 2.2) * (t > TC2 ? 1 : 0) + .6 * Math.exp(-Math.max(0, t - TDOT) * 3) * (t > TDOT ? 1 : 0);
    glow(ctx, 540, 640, 1100, C.blue, .5); glow(ctx, 540, 640, 700, C.sky, .06 + .16 * en); glow(ctx, 540, 700, 800, C.gold, .06 + .3 * en);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(540, 640); ctx.rotate(t * .16); const rs = 2.25 + .08 * Math.sin(t * 3); ctx.scale(rs, rs); ctx.globalAlpha = clamp(.12 + .5 * en, 0, .75) * (t > TC2 ? 1.1 : .28); ctx.drawImage(raysTex(), -600, -600); ctx.restore();
    // floor haze + dust
    const r = rng(41); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) { const x = r() * 1200 - 60 + Math.sin(t * .6 + i) * 30, y = ((r() * 2100 - t * (30 + r() * 90)) % 2100 + 2100) % 2100 - 90, s = 1.5 + r() * 5, a = .2 + .6 * r(); ctx.fillStyle = `rgba(${r() < .5 ? '255,214,130' : '150,220,255'},${a * .55})`; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function goldDot(ctx, x, y, r, sx = 1, sy = 1, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.globalAlpha = a;
    glow(ctx, 0, 0, r * 2.1, C.gold, .55);
    ctx.fillStyle = 'rgba(70,30,0,.9)'; ctx.beginPath(); ctx.arc(r * .05, r * .11, r * 1.02, 0, TAU); ctx.fill();            // extrusion / thickness
    ctx.fillStyle = rad(ctx, -r * .32, -r * .38, r * .04, r * 1.05, [[0, '#FFFFF0'], [.14, '#FFF3B8'], [.45, '#FFC24A'], [.82, '#E48A12'], [1, '#8f4a00']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,180,.9)'; ctx.lineWidth = r * .04; ctx.beginPath(); ctx.arc(0, 0, r * .95, PI * 1.05, PI * 1.62); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,190,80,.7)'; ctx.lineWidth = r * .05; ctx.beginPath(); ctx.arc(0, 0, r * .9, PI * .1, PI * .6); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.fillStyle = lin(ctx, 0, -r, 0, r, [[0, 'rgba(150,200,255,.3)'], [.3, 'rgba(150,200,255,0)'], [.46, 'rgba(90,40,0,0)'], [.52, 'rgba(90,40,0,.4)'], [.58, 'rgba(255,230,150,.25)'], [1, 'rgba(255,230,150,0)']]); ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(-r * .34, -r * .5, r * .3, r * .14, -.55, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function slamLine(ctx, layer, y, age, s0, extra) {
    if (age < 0) return;
    const dur = .09, k = [[0, s0], [dur, .88, 'in'], [dur + .1, 1.07, 'out'], [dur + .3, 1, 'inOut']];
    const sc = A.key(age, k), al = clamp(age / .03);
    ctx.save(); ctx.translate(540, y + (extra ? extra.dy : 0)); if (extra) ctx.rotate(extra.rot);
    if (sc > 1.12) { for (let j = 3; j >= 1; j--) { ctx.save(); ctx.globalAlpha = .16 * al; ctx.scale(sc * (1 + .07 * j), sc * (1 + .07 * j)); ctx.drawImage(layer, -540, -layer.height / 2); ctx.restore(); } }
    ctx.globalAlpha = al; ctx.scale(sc, sc);
    // subtle breathing after settle
    const br = age > .5 ? 1 + .012 * Math.sin(age * 5) : 1; ctx.scale(br, br);
    ctx.drawImage(layer, -540, -layer.height / 2);
    // foil sweep clipped to the lettering
    const sp = [[.32, .78], [1.05, 1.5]].map(([a0, a1]) => inv(a0, a1, age)).find(u => u > 0 && u < 1);
    if (sp !== undefined && age > .2) { const T = foilTmp(layer.height), tg = T.getContext('2d'); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, 1080, layer.height); tg.drawImage(layer, 0, 0); tg.globalCompositeOperation = 'source-in';
      const x0 = lerp(-300, 1300, eio(sp)); tg.fillStyle = lin(tg, x0 - 160, 0, x0 + 160, layer.height * .6, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.95)'], [1, 'rgba(255,255,255,0)']]); tg.fillRect(0, 0, 1080, layer.height);
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(T, -540, -layer.height / 2); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
  }
  const foilTmps = {}; const foilTmp = h => foilTmps[h] || (foilTmps[h] = mk(1080, h));

  function typeGroup(ctx, t, zs, zcx, zcy) {
    ctx.save(); ctx.translate(zcx, zcy); ctx.scale(zs, zs); ctx.translate(-zcx, -zcy);
    const jt = t - TDOT, jolt = jt > 0 ? Math.exp(-jt * 13) : 0;
    const ex = { dy: -22 * jolt * Math.cos(jt * 38), rot: .012 * jolt * Math.sin(jt * 50) };
    // glow plates behind the lettering
    if (t > TC1) glow(ctx, 540, Y1, 520, C.gold, .32 * Math.min(1, (t - TC1) * 8));
    if (t > TC2) glow(ctx, 540, Y2, 620, C.gold, .36 * Math.min(1, (t - TC2) * 8));
    slamLine(ctx, L1(), Y1, t - TS1, 3.4, ex);
    slamLine(ctx, L2(), Y2, t - TS2, 3.9, ex);
    // giant period
    const u = (t - (TDOT - .11)) / .11;
    if (u > 0) {
      let sx = 1, sy = 1, s, a = 1, dy = 0;
      if (u < 1) { s = lerp(8, 1, ein(u)); a = clamp(u * 5); sx = sy = s; if (u < .95) { ctx.save(); ctx.globalAlpha = .35; goldDot(ctx, DOTX, DOTY, DOTR * s * 1.18, 1, 1, .5); ctx.restore(); } }
      else { const ag = t - TDOT, kk = Math.exp(-ag * 11) * Math.cos(ag * 32); sy = 1 - .42 * kk; sx = 1 + .55 * (1 - sy) * 1.2; dy = DOTR * (1 - sy); sx = Math.max(.6, sx); }
      goldDot(ctx, DOTX, DOTY + dy, DOTR, sx, sy, a);
    }
    ctx.restore();
  }

  function drawImpact(ctx, t) {
    const lt = t - T0, fi = Math.floor(t * 30), sh = shake(t);
    ctx.save(); ctx.translate(540, 960); ctx.rotate(sh.r); ctx.translate(-540 + sh.x, -960 + sh.y);
    bgImpact(ctx, t);
    // frozen spinner
    if (t < TC2) {
      const pop = lerp(1.32, 1, eo(clamp(lt / .28))), gl = clamp(.6 * Math.exp(-lt * 6) + .1 + .3 * inv(TC1, TC2, t) + (hash(fi * 3.7) > .8 ? .3 : 0), 0, .7);
      const jx = (hash(fi * 1.7) - .5) * gl * 16, jy = (hash(fi * 2.9) - .5) * gl * 10;
      ctx.save(); ctx.fillStyle = rad(ctx, SPX, SPY, 100, 460, [[0, 'rgba(4,8,40,.65)'], [1, 'rgba(4,8,40,0)']]); ctx.fillRect(0, 0, 1080, 1300); ctx.restore(); glow(ctx, SPX, SPY, 420, C.sky, .14);
      drawSpinner(ctx, SPX + jx, SPY + jy, pop * (1 + .012 * Math.sin(t * 9)), gl, fi);
      drawCracks(ctx, SPX, SPY, sst(TC1 + .12, TC2 - .01, t), .8, pop);
    }
    // type group (whoosh with radial blur)
    if (t < TW0 + 0.08) {
      const u = inv(TZ0, TZ0 + .16, t), zs = Math.exp(3.0 * ein(u));
      if (u > 0) { const blur = Math.sin(clamp(u) * PI * .5) * .9, n = 8; for (let j = n; j >= 1; j--) { ctx.save(); ctx.globalAlpha = .16 + .1 * (n - j) / n; typeGroup(ctx, t, zs / (1 + j * .07 * blur * zs * .25), DOTX, DOTY); ctx.restore(); } typeGroup(ctx, t, zs, DOTX, DOTY); }
      else typeGroup(ctx, t, 1, DOTX, DOTY);
    }
    // shard shower
    drawShards(ctx, SH_BIG, t - TC2, SPX, SPY, 1500, 700);
    // shock rings, bursts
    shock(ctx, 540, 640, t - T0, { R: 1500, dur: .5, w: 120 }); shock(ctx, 540, Y1, t - TC1, { R: 1100, dur: .45, w: 90 }); shock(ctx, SPX, SPY, t - TC2, { R: 1700, dur: .6, w: 150 }); shock(ctx, DOTX, DOTY + 90, t - TDOT, { R: 1500, dur: .55, w: 120, sy: .55 }); shock(ctx, DOTX, DOTY, t - TDOT - .08, { R: 900, dur: .5, w: 70 });
    burstLines(ctx, SPX, SPY, t - TC2, 11); burstLines(ctx, 540, Y1, t - TC1, 5, '255,255,255', 30, .35); burstLines(ctx, DOTX, DOTY, t - TDOT, 23);
    // sparkle debris
    if (t > TC2) { const r = rng(88); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 46; i++) { const a = r() * TAU, sp = 200 + r() * 700, tt = t - TC2 - r() * .1; if (tt < 0) continue; const x = SPX + Math.cos(a) * sp * tt * 1.2, y = SPY + Math.sin(a) * sp * tt * 1.2 + 350 * tt * tt, al = clamp(1 - tt / (.7 + r() * .6)); if (al <= 0) continue; V.sparkle(ctx, x, y, 8 + r() * 18, r() < .5 ? '#FFE9A8' : '#B7F0FF', r() * 3, al); } ctx.restore(); }
    ctx.restore();
    // flashes
    V.flash(ctx, t, T0, .26, '#fff', 1); V.flash(ctx, t, TC1, .14, '#fff', .35); V.flash(ctx, t, TC2, .2, '#fff', .6); V.flash(ctx, t, TDOT, .2, '#FFE9A8', .5);
    // whoosh brightening
    const uz = inv(TZ0 + .06, TZ0 + .17, t); if (uz > 0) { ctx.save(); ctx.globalAlpha = uz * .9; ctx.fillStyle = rad(ctx, 540, 960, 0, 1200, [[0, '#FFFBE0'], [.5, '#FFC24A'], [1, '#E48A12']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
  }

  // ================================================================== WORLD (penalty)
  const WLD = mk(1080, 1920), WG = WLD.getContext('2d');
  const STAND_W = 1500, STAND_H = 560, BAND = 4;
  const H0S = 118;                                   // screen-horizon shift (action sits lower, clear of the top bug)
  const PIV = [0, 6.5];                               // orbit pivot (x, z): the penalty spot

  function standsLayer() {
    return A.layer('v6stands', STAND_W, STAND_H, (g, w, h) => {
      const r = rng(404); const pal = ['#FFD21E', '#FFD21E', '#FFD21E', '#2A4FD8', '#2A4FD8', '#F2F4FF', '#E8323C', '#141830'];
      g.fillStyle = '#101640'; g.fillRect(0, 0, w, h);
      const rows = 30;
      for (let row = 0; row < rows; row++) {
        const q = row / (rows - 1), y = 40 + q * (h - 70), sz = lerp(11, 24, q), step = sz * 1.12;
        for (let x = -10 + (row % 2) * step * .5; x < w + 10; x += step) {
          const jx = (r() - .5) * 4, jy = (r() - .5) * 3; const pick = r(); let col = pal[(r() * pal.length) | 0]; if (pick < .06) col = '#0a0e28';
          const px = x + jx, py = y + jy;
          g.fillStyle = col; g.beginPath(); g.ellipse(px, py + sz * .62, sz * .62, sz * .5, 0, 0, TAU); g.fill();
          g.fillStyle = r() < .5 ? '#c99a78' : r() < .5 ? '#8a5a3c' : '#e8bd98'; g.beginPath(); g.arc(px, py, sz * .31, 0, TAU); g.fill();
          if (r() < .35) { g.fillStyle = '#1a120c'; g.beginPath(); g.arc(px, py - sz * .07, sz * .31, PI, TAU); g.fill(); }
        }
        g.fillStyle = `rgba(3,5,20,${.3 - .1 * q})`; g.fillRect(0, y + sz * .9, w, sz * .35);
      }
      g.fillStyle = 'rgba(4,6,24,.92)'; for (let x = 140; x < w; x += 250) g.fillRect(x, 30, 16, h);
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, 'rgba(2,4,20,.55)'], [.45, 'rgba(3,6,30,.22)'], [1, 'rgba(10,20,60,0)']]); g.fillRect(0, 0, w, h);
      g.fillStyle = lin(g, 0, 0, w, 0, [[0, 'rgba(2,4,20,.6)'], [.22, 'rgba(2,4,20,0)'], [.78, 'rgba(2,4,20,0)'], [1, 'rgba(2,4,20,.6)']]); g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = lin(g, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [90 / h, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,1)']]); g.fillRect(0, 0, w, h);
    });
  }
  // depth-of-field: the far (upper) tiers are drawn from a soft copy
  const standsSoft = () => A.layer('v6standsSoft', STAND_W, STAND_H, g => { g.filter = 'blur(2.6px)'; g.drawImage(standsLayer(), 0, 0); });
  function armsLayer() {
    return A.layer('v6arms', STAND_W, STAND_H, (g, w, h) => {
      const r = rng(707), pal = ['#FFD21E', '#c99a78', '#2A4FD8', '#e8bd98'];
      for (let i = 0; i < 520; i++) { const q = r(), y = 40 + q * (h - 90), sz = lerp(11, 24, (y - 40) / (h - 70)), x = r() * w, a = (r() - .5) * .5, len = sz * (1 + r() * .9); g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = pal[(r() * 4) | 0]; g.lineCap = 'round'; g.lineWidth = sz * .2; g.beginPath(); g.moveTo(-sz * .2, 0); g.lineTo(-sz * .3, -len); g.stroke(); g.beginPath(); g.moveTo(sz * .2, 0); g.lineTo(sz * .35, -len * .9); g.stroke(); g.restore(); }
    });
  }
  // advertising boards: GOTV + the real sport5 logo, 128 px per metre, x from -14 to 14 m
  const BW = 3584, BH = 116, BPX = 128;
  function boardsLayer() {
    return A.layer('v6boards', BW, BH, (g, w, h) => {
      g.fillStyle = '#050a2a'; g.fillRect(0, 0, w, h);
      const pw = 2 * BPX;
      for (let x = 0, i = 0; x < w; x += pw, i++) {
        const k = i % 4;
        const bg = k === 0 ? lin(g, 0, 0, 0, h, [[0, '#FFE08A'], [1, '#F0A814']]) : k === 2 ? lin(g, 0, 0, 0, h, [[0, '#3C7BFF'], [1, '#1B3FC4']]) : lin(g, 0, 0, 0, h, [[0, '#122072'], [1, '#070E3E']]);
        g.fillStyle = bg; g.fillRect(x + 5, 4, pw - 10, h - 8);
        if (k === 1 || k === 3) {
          g.fillStyle = 'rgba(255,255,255,.07)'; for (let q = 0; q < 6; q++) g.fillRect(x + 12 + q * 40, 10, 14, h - 20);
          V.drawLogo(g, 'sport5', x + pw * .5, h * .5, pw * .5, h * .8, { shadow: false });
        } else {
          g.fillStyle = k === 0 ? '#0B1450' : '#fff'; g.font = '900 64px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText('GOTV', x + pw / 2, h / 2 + 3);
        }
        g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 5, 4, pw - 10, 8); g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x + 5, h - 14, pw - 10, 10);
      }
    });
  }

  // ---------------------------------------------------------------- camera
  const camKeys = {
    f: [[27.0, 1350], [27.9, 1480], [28.15, 1680], [29.2, 2000], [29.67, 2080]],
    x: [[27.0, -0.75], [27.9, -0.4], [28.15, -0.05], [28.5, 0.2], [29.2, 0.7], [29.67, 0.8]],
    h: [[27.0, 1.05], [28.15, 1.18], [29.2, 1.5], [29.67, 1.62]],
    H0: [[27.0, 610 + H0S], [28.15, 545 + H0S], [29.2, 500 + H0S], [29.67, 495 + H0S]],
  };
  // speed ramp: run-up slightly fast, slow-mo after the boot, hard freeze at the smash
  const DEL = [[27.0, 0], [28.05, .10], [28.46, 0]];
  const TKICK = 28.05;                                            // real time of boot contact
  const wt = t => (t < HOLD0 ? t + A.key(t, DEL, 'lin') : t < HOLD1 ? HOLD0 : t - (HOLD1 - HOLD0));
  const mkProj = c => {
    const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
    return (X, Y, Z) => {
      const dx = X - PIV[0], dz = Z - PIV[1], X2 = PIV[0] + dx * cs + dz * sn, Z2 = PIV[1] - dx * sn + dz * cs;
      const d = Math.max(.25, c.z - Z2), k = c.f / d;
      let sx = 540 + c.ox + (X2 - c.x) * k, sy = c.H0 + c.oy + (c.h - Y) * k;
      if (c.kz !== 1) { sx = c.ax + (sx - c.ax) * c.kz; sy = c.ay + (sy - c.ay) * c.kz; }
      return [sx, sy, k * c.kz, Z2];
    };
  };
  function camAt(w, t) {
    const K = a => A.key(w, a, 'inOut');
    let f = K(camKeys.f), x = K(camKeys.x), h = K(camKeys.h), H0 = K(camKeys.H0), z = 16.6;
    const arr = 1 - eo(inv(TW0 - .05, TW0 + .8, t));                // low-angle whip in
    f *= 1 + .34 * arr; h -= .78 * arr; H0 += 40 * arr;
    if (w > HOLD0 - .02 && t < HOLD1 + .25) { const k = Math.exp(-Math.max(0, t - HOLD0) * 9); f *= 1 + .04 * k * (t >= HOLD0 ? 1 : 0); }
    const pb = ein(inv(PB0, PB1, t)); f *= 1 - .52 * pb; z += 9 * pb; h += 2.4 * pb; H0 -= 40 * pb;
    const ox = 9 * A.noise1(w * .8 + 3), oy = 8 * A.noise1(w * .6 + 11);
    const yaw = -.34 * (1 - eo(inv(TW0 - .05, 28.0, t))) + .34 * sst(27.95, 28.4, w) - .26 * sst(28.55, 29.35, w) + .03 * Math.sin(w * .7);
    x += 2.6 * Math.sin(clamp(yaw, -.55, .55));
    const dutch = .012 * Math.sin(w * .9) - .07 * arr + .03 * sst(TKICK - .2, TKICK, t) * (1 - sst(TKICK + .1, TKICK + .5, t)) + (w > GOALW - .1 ? .085 * sst(GOALW - .1, GOALW + .35, w) : 0) - .02 * pb;
    const c = { f, x, h, z, H0, ox, oy, yaw: clamp(yaw, -.55, .55), roll: dutch, kz: 1, ax: 540, ay: 900 };
    const b0 = mkProj(c)(SPOT[0], .22, SPOT[2]); c.ax = b0[0]; c.ay = b0[1];
    c.kz = 1 + .72 * ein(inv(TKICK - .2, TKICK, t)) * (1 - .86 * eo(inv(TKICK, TKICK + .42, t)));
    return c;
  }

  // ---------------------------------------------------------------- ball / actors kinematics (world time w)
  const SPOT = [0.1, 0.11, 11.0];
  function ballAt(w) {
    if (w < KICK) return { p: [SPOT[0], SPOT[1], SPOT[2]], spin: 0, fly: 0 };
    const u = (w - KICK) / (GOALW - KICK);
    let X, Y, Z;
    if (u <= 1) { Z = lerp(11, -0.15, u); X = .1 + 2.82 * (1 - Math.pow(1 - u, 1.15)); Y = .11 + 1.78 * (1 - Math.pow(1 - u, 1.55)); }
    else {
      const a = w - GOALW; Z = A.key(a, [[0, -0.15], [.16, -1.85, 'out'], [.5, -1.55, 'inOut'], [.9, -1.3, 'inOut']]);
      X = A.key(a, [[0, 2.92], [.16, 3.05, 'out'], [.9, 3.0]]);
      Y = A.key(a, [[0, 1.89], [.14, 1.86], [.7, .11, 'in'], [.86, .55, 'out'], [1.0, .11, 'in'], [1.15, .2, 'out'], [1.3, .11, 'in']]);
    }
    return { p: [X, Y, Z], spin: (w - KICK) * 22, fly: 1 };
  }

  const KIT = {
    teamA: { shirt: '#F2C511', trim: '#1740C8', shorts: '#1638B8', sock: '#F2C511', sockB: '#1638B8', num: '#12308F', boot: '#FF7A1F', sleeves: 0, hair: '#150d07' },
    teamB: { shirt: '#E9ECF8', trim: '#0E1A4D', shorts: '#0E1A4D', sock: '#E9ECF8', sockB: '#E8323C', num: '#0E1A4D', boot: '#1a1f38', sleeves: 0, hair: '#3a2410' },
    keeper: { shirt: '#E5222F', trim: '#7d0f18', shorts: '#15181f', sock: '#15181f', sockB: '#7d0f18', num: '#fff', boot: '#20263a', sleeves: 1, glove: '#7dffb0', hair: '#12100e' },
  };
  const SKIN = '#B98056';

  // ---------- rig
  function ik(H, T, pole, l1 = .46, l2 = .46) {
    let dx = T[0] - H[0], dy = T[1] - H[1], dz = T[2] - H[2]; const D = Math.hypot(dx, dy, dz) || 1e-4, Dm = Math.min(D, (l1 + l2) * .998), u = [dx / D, dy / D, dz / D];
    const a = (l1 * l1 - l2 * l2 + Dm * Dm) / (2 * Dm), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)); const pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2]; let n = [pole[0] - u[0] * pd, pole[1] - u[1] * pd, pole[2] - u[2] * pd]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(q => q / nl);
    return { knee: [H[0] + u[0] * a + n[0] * h, H[1] + u[1] * a + n[1] * h, H[2] + u[2] * a + n[2] * h], ankle: [H[0] + u[0] * Dm, H[1] + u[1] * Dm, H[2] + u[2] * Dm] };
  }
  function armJ(sh, side, p) {
    const [t1, f1, t2, f2] = p, d = (t, f) => [side * Math.sin(t) * Math.cos(f), -Math.cos(t), -Math.sin(t) * Math.sin(f)];
    const d1 = d(t1, f1), d2 = d(t2, f2), el = [sh[0] + d1[0] * .3, sh[1] + d1[1] * .3, sh[2] + d1[2] * .3], wr = [el[0] + d2[0] * .27, el[1] + d2[1] * .27, el[2] + d2[2] * .27]; return [sh, el, wr];
  }
  function makeRig(o) {
    const r = o.root, lean = o.lean || 0, yaw = o.yaw || 0, cl = Math.cos(lean), sl = Math.sin(lean);
    const hipL = [r[0] - .1, r[1], r[2]], hipR = [r[0] + .1, r[1], r[2]];
    const legL = ik(hipL, o.fL, [-.15, 0, -1]), legR = ik(hipR, o.fR, [.15, 0, -1]);
    const S = [r[0], r[1] + .52 * cl, r[2] - .52 * sl], sx = .2 * Math.cos(yaw), sz = .2 * Math.sin(yaw);
    const shR = [S[0] + sx, S[1], S[2] - sz], shL = [S[0] - sx, S[1], S[2] + sz];
    const head = [S[0] + (o.headX || 0), S[1] + .27 * cl, S[2] - .27 * sl - .02];
    return { r, S, hipL, hipR, legL, legR, shL, shR, head, armL: armJ(shL, -1, o.aL), armR: armJ(shR, 1, o.aR), yaw, lean };
  }

  // ================================================================== FIGURE RENDERER
  // Smooth tapered limbs with muscle bulge, cloth that lags the motion, hair tufts, and a silhouette rim light.
  const FIGC = mk(1500, 1500), FG = FIGC.getContext('2d'), RIMC = mk(1500, 1500), RG = RIMC.getContext('2d');
  const pal = (hex, o = {}) => ({ hi: mixc(hex, '#ffffff', o.hi ?? .2), base: hex, lo: mixc(hex, '#050a26', o.lo ?? .46), wm: mixc(hex, '#ff9048', .12) });
  function limb(g, a, b, ra, rb, c, bulge = .1, mid = .45) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-3, th = Math.atan2(dy, dx), nx = -dy / L, ny = dx / L;
    const rm = lerp(ra, rb, mid) * (1 + bulge), mx = a[0] + dx * mid, my = a[1] + dy * mid, cr = 2 * rm - (ra + rb) / 2;
    g.beginPath(); g.moveTo(a[0] + nx * ra, a[1] + ny * ra); g.quadraticCurveTo(mx + nx * cr, my + ny * cr, b[0] + nx * rb, b[1] + ny * rb);
    g.arc(b[0], b[1], rb, th + PI / 2, th - PI / 2, true);
    g.quadraticCurveTo(mx - nx * cr, my - ny * cr, a[0] - nx * ra, a[1] - ny * ra);
    g.arc(a[0], a[1], ra, th - PI / 2, th - PI * 1.5, true); g.closePath();
    const sg = nx < 0 ? 1 : -1, gx = mx - nx * rm * sg, gy = my - ny * rm * sg, hx = mx + nx * rm * sg, hy = my + ny * rm * sg;
    const gr = g.createLinearGradient(gx, gy, hx, hy); gr.addColorStop(0, c.hi); gr.addColorStop(.28, c.base); gr.addColorStop(.78, c.lo); gr.addColorStop(1, c.wm);
    g.fillStyle = gr; g.fill();
  }
  function lagV(rig, pj) { if (!rig.prev) return [0, 0]; const a = pj(rig.r[0], rig.r[1], rig.r[2]), b = pj(rig.prev.r[0], rig.prev.r[1], rig.prev.r[2]), m = .3 * a[2]; return [clamp(b[0] - a[0], -m, m), clamp(b[1] - a[1], -m, m)]; }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add3 = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  function toeOf(a, kn, gb, fw = [0, -.05, -.17]) { const s = sub3(a, kn), l = Math.hypot(s[0], s[1], s[2]) || 1; return [a[0] + lerp(s[0] / l * .17, fw[0], gb), a[1] + lerp(s[1] / l * .17, fw[1], gb), a[2] + lerp(s[2] / l * .17, fw[2], gb)]; }

  function drawFigure(g, pj, rig, kit, o = {}) {
    const P = p => pj(p[0], p[1], p[2]), k = P(rig.r)[2], sc = o.scale || 1, time = o.time || 0;
    const pts = { hL: P([rig.r[0] - .16, rig.r[1] + .02, rig.r[2]]), hR: P([rig.r[0] + .16, rig.r[1] + .02, rig.r[2]]), sL: P(rig.shL), sR: P(rig.shR), S: P(rig.S), hd: P(rig.head), r: P(rig.r) };
    const legs = [[rig.hipL, rig.legL, -1], [rig.hipR, rig.legR, 1]].map(([hip, leg, side]) => { const gb = clamp(1 - leg.ankle[1] / .22); const toe = o.toes ? o.toes[side] : toeOf(leg.ankle, leg.knee, gb); return { side, H: P(hip), K: P(leg.knee), Ank: P(leg.ankle), T: P(toe), gb, hip3: hip, leg }; });
    const arms = [[rig.armL, -1], [rig.armR, 1]].map(([aj, side]) => ({ side, S: P(aj[0]), E: P(aj[1]), W: P(aj[2]), z3: aj })), lag = lagV(rig, pj);
    // bbox
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const allp = [pts.hL, pts.hR, pts.sL, pts.sR, pts.hd, ...legs.flatMap(l => [l.H, l.K, l.Ank, l.T]), ...arms.flatMap(a => [a.S, a.E, a.W])];
    allp.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    const mg = .32 * k; x0 -= mg; y0 -= mg; x1 += mg; y1 += mg;
    if (x1 < -50 || x0 > 1130 || y1 < -50 || y0 > 1970) return;
    const ox = Math.floor(x0), oy = Math.floor(y0), bw = Math.min(1500, Math.ceil(x1 - ox)), bh = Math.min(1500, Math.ceil(y1 - oy));
    const f = FG; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, bw, bh); f.translate(-ox, -oy); f.globalAlpha = 1; f.globalCompositeOperation = 'source-over'; f.shadowColor = 'transparent';
    const Q = [], push = (z, fn) => Q.push({ z, fn });
    const cShirt = pal(kit.shirt, { lo: .5 }), cShort = pal(kit.shorts, { lo: .5 }), cSock = pal(kit.sock, { lo: .5 }), cSockB = pal(kit.sockB, { lo: .4 }), cSkin = pal(SKIN, { hi: .16, lo: .5 }), cTrim = pal(kit.trim, { lo: .4 });
    const cBoot = pal(kit.boot, { hi: .3, lo: .5 }), cSleeve = kit.sleeves ? cShirt : null, cGlove = pal(kit.glove || SKIN, { hi: .35, lo: .35 });
    const ripple = (u, sp = 9, am = .012) => Math.sin(time * sp + u * 6) * am * k;

    // ---- legs
    legs.forEach(L => {
      const zc = (L.hip3[2] + L.leg.ankle[2]) / 2, zk = P([(L.hip3[0] + L.leg.knee[0]) / 2, (L.hip3[1] + L.leg.knee[1]) / 2, (L.hip3[2] + L.leg.knee[2]) / 2])[3];
      const kk = L.K[2], up = 1;
      push(zk, ff => {
        limb(ff, L.H, L.K, .108 * k, .068 * k, cSkin, .08, .3);                                       // thigh
        // shorts leg (wider hem, cloth lag)
        const hem = [lerp(L.H[0], L.K[0], .5) + lag[0] * .5 + ripple(L.side, 10, .01), lerp(L.H[1], L.K[1], .5) + lag[1] * .5 + Math.abs(ripple(L.side + 2, 8, .012))];
        limb(ff, [L.H[0], L.H[1] - .02 * k], hem, .122 * k, .13 * k, cShort, -.04, .5);
        ff.strokeStyle = 'rgba(255,255,255,.18)'; ff.lineWidth = Math.max(1.5, .01 * k); ff.beginPath(); ff.moveTo(hem[0] - .1 * k, hem[1]); ff.lineTo(hem[0] + .1 * k, hem[1]); ff.stroke();
        // calf + sock
        limb(ff, L.K, L.Ank, .066 * k, .04 * k, cSock, .14, .32);
        const sb = [lerp(L.K[0], L.Ank[0], .2), lerp(L.K[1], L.Ank[1], .2)], sb2 = [lerp(L.K[0], L.Ank[0], .32), lerp(L.K[1], L.Ank[1], .32)]; limb(ff, sb, sb2, .062 * k, .06 * k, cSockB, 0, .5);
        ff.fillStyle = cSkin.base; ff.beginPath(); ff.arc(L.K[0], L.K[1], .064 * k, 0, TAU); ff.fill();
      });
      push(P(L.leg.ankle)[3] + .02, ff => {                                                        // boot
        const hl = [L.Ank[0] - (L.T[0] - L.Ank[0]) * .18, L.Ank[1] - (L.T[1] - L.Ank[1]) * .18 + .01 * k];
        limb(ff, hl, L.T, .05 * k, .04 * k, cBoot, .18, .4);
        ff.strokeStyle = 'rgba(255,255,255,.7)'; ff.lineWidth = Math.max(1.4, .01 * k); ff.lineCap = 'round'; ff.beginPath(); ff.moveTo(L.Ank[0] + (L.T[0] - L.Ank[0]) * .1, L.Ank[1] + (L.T[1] - L.Ank[1]) * .1 + .03 * k); ff.lineTo(L.T[0] - (L.T[0] - L.Ank[0]) * .15, L.T[1] - (L.T[1] - L.Ank[1]) * .15 + .03 * k); ff.stroke();
      });
    });
    // ---- torso (smooth blob with waist taper, hem cloth flutter)
    push(P([rig.r[0], rig.r[1] + .05, rig.r[2]])[3] + .03, ff => {
      const c = t => [lerp(pts.S[0], (pts.hL[0] + pts.hR[0]) / 2, t), lerp(pts.S[1], (pts.hL[1] + pts.hR[1]) / 2, t)];
      const hv = t => [lerp((pts.sR[0] - pts.sL[0]) / 2, (pts.hR[0] - pts.hL[0]) / 2, t), lerp((pts.sR[1] - pts.sL[1]) / 2, (pts.hR[1] - pts.hL[1]) / 2, t)];
      const prof = t => t < .18 ? lerp(1.02, 1.1, t / .18) : t < .66 ? lerp(1.1, .88, (t - .18) / .48) : lerp(.88, .98, (t - .66) / .34);
      const side = (t, s) => { const cc = c(t), h = hv(t), p = prof(t); return [cc[0] + s * h[0] * p, cc[1] + s * h[1] * p]; };
      const ts = [0, .16, .4, .66, 1.05], hemLag = 1.0;
      const nk = [pts.S[0], pts.S[1] - .045 * k];
      const poly = [];
      poly.push([side(0, -1)[0], side(0, -1)[1] - .02 * k]); ts.forEach(t => poly.push(side(t, -1).map((v, i) => v + (t > 1 ? lag[i] * hemLag * .8 + (i ? Math.abs(ripple(-1, 9, .012)) : ripple(-1, 9, .008)) : t > .6 ? lag[i] * .25 : 0))));
      ts.slice().reverse().forEach(t => poly.push(side(t, 1).map((v, i) => v + (t > 1 ? lag[i] * hemLag * .8 + (i ? Math.abs(ripple(1, 9, .012)) : ripple(1, 9, .008)) : t > .6 ? lag[i] * .25 : 0))));
      poly.push([side(0, 1)[0], side(0, 1)[1] - .02 * k]); poly.push([nk[0] + .03 * k, nk[1]]); poly.push([nk[0] - .03 * k, nk[1]]);
      A.blob(ff, poly, true);
      const gx0 = Math.min(pts.sL[0], pts.hL[0]) - .08 * k, gx1 = Math.max(pts.sR[0], pts.hR[0]) + .08 * k;
      const gr = ff.createLinearGradient(gx0, 0, gx1, 0); gr.addColorStop(0, cShirt.hi); gr.addColorStop(.22, cShirt.base); gr.addColorStop(.78, cShirt.lo); gr.addColorStop(1, cShirt.wm);
      ff.fillStyle = gr; ff.fill(); ff.save(); ff.clip();
      // vertical light falloff + waist shade
      ff.fillStyle = lin(ff, 0, pts.S[1], 0, pts.hL[1] + .2 * k, [[0, 'rgba(255,255,255,.16)'], [.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,10,40,.3)']]); ff.fillRect(gx0, pts.S[1] - .1 * k, gx1 - gx0, .8 * k);
      // side panel stripes
      ff.strokeStyle = cTrim.base; ff.lineWidth = Math.max(2, .02 * k); ff.beginPath(); [-1, 1].forEach(s => { ff.moveTo(side(.05, s)[0] - s * .045 * k, side(.05, s)[1]); ff.lineTo(side(.66, s)[0] - s * .045 * k, side(.66, s)[1]); ff.lineTo(side(1, s)[0] - s * .045 * k, side(1, s)[1]); }); ff.globalAlpha = .75; ff.stroke(); ff.globalAlpha = 1;
      // hem band
      const hb = [side(.98, -1), side(.98, 1)]; ff.strokeStyle = cTrim.base; ff.lineWidth = Math.max(2, .025 * k); ff.beginPath(); ff.moveTo(hb[0][0] + lag[0] * .7, hb[0][1] + lag[1] * .7); ff.lineTo(hb[1][0] + lag[0] * .7, hb[1][1] + lag[1] * .7); ff.stroke();
      // number / sponsor
      const ang = Math.atan2(pts.sR[1] - pts.sL[1], pts.sR[0] - pts.sL[0]), wide = clamp(Math.hypot(pts.sR[0] - pts.sL[0], pts.sR[1] - pts.sL[1]) / (.4 * k), .25, 1.05), ch = c(.36);
      ff.save(); ff.translate(ch[0], ch[1]); ff.rotate(ang); ff.scale(wide, Math.max(.6, Math.cos(rig.lean || 0) * .95));
      if (o.front) { ff.font = `900 ${.115 * k}px Rubik`; ff.textAlign = 'center'; ff.textBaseline = 'middle'; ff.direction = 'ltr'; ff.fillStyle = 'rgba(255,255,255,.95)'; ff.fillText('GOTV', 0, -.02 * k); ff.fillStyle = 'rgba(255,255,255,.5)'; ff.fillRect(-.14 * k, .06 * k, .28 * k, .012 * k); }
      else { ff.font = `900 ${.34 * k}px Rubik`; ff.textAlign = 'center'; ff.textBaseline = 'middle'; ff.direction = 'ltr'; ff.fillStyle = kit.num; ff.globalAlpha = .92; ff.fillText(o.num || '10', 0, .02 * k); ff.globalAlpha = .35; ff.strokeStyle = '#fff'; ff.lineWidth = Math.max(1, .006 * k); ff.strokeText(o.num || '10', 0, .02 * k); ff.globalAlpha = 1; ff.font = `800 ${.075 * k}px Rubik`; ff.fillStyle = kit.num; ff.fillText('GOTV', 0, -.18 * k); }
      ff.restore(); ff.restore();
      // collar
      ff.strokeStyle = cTrim.base; ff.lineWidth = Math.max(2, .028 * k); ff.lineCap = 'round'; ff.beginPath(); ff.moveTo(nk[0] - .06 * k, nk[1] + .004 * k); ff.quadraticCurveTo(nk[0], nk[1] + (o.front ? .05 : .025) * k, nk[0] + .06 * k, nk[1] + .004 * k); ff.stroke();
      // pelvis / short block
      const wv = [(pts.hR[0] - pts.hL[0]) / 2, (pts.hR[1] - pts.hL[1]) / 2], hc = [(pts.hL[0] + pts.hR[0]) / 2, (pts.hL[1] + pts.hR[1]) / 2];
      A.blob(ff, [[hc[0] - wv[0] * 1.0, hc[1] - wv[1] * 1.0 - .03 * k], [hc[0], hc[1] - .05 * k], [hc[0] + wv[0] * 1.0, hc[1] + wv[1] * 1.0 - .03 * k], [hc[0] + wv[0] * 1.08 + lag[0] * .5, hc[1] + wv[1] * 1.08 + .1 * k + lag[1] * .5], [hc[0] + lag[0] * .6, hc[1] + .13 * k + lag[1] * .6], [hc[0] - wv[0] * 1.08 + lag[0] * .5, hc[1] - wv[1] * 1.08 + .1 * k + lag[1] * .5]], true);
      ff.fillStyle = lin(ff, hc[0] - wv[0], 0, hc[0] + wv[0], 0, [[0, cShort.hi], [.25, cShort.base], [.8, cShort.lo], [1, cShort.wm]]); ff.fill();
    });
    // ---- arms
    arms.forEach(Ar => {
      const zz = P(Ar.z3[1])[3] + (Ar.side < 0 ? -.04 : .04) * (o.front ? -1 : 1);
      push(zz, ff => {
        const sl = kit.sleeves ? 1 : .0, mid = [lerp(Ar.S[0], Ar.E[0], .62), lerp(Ar.S[1], Ar.E[1], .62)];
        limb(ff, Ar.S, Ar.E, .06 * k, .048 * k, kit.sleeves ? cShirt : cSkin, .1, .4);                  // upper arm
        if (!kit.sleeves) { limb(ff, Ar.S, mid, .076 * k, .066 * k, cShirt, .04, .5); const c2 = [lerp(Ar.S[0], Ar.E[0], .72), lerp(Ar.S[1], Ar.E[1], .72)]; limb(ff, mid, c2, .07 * k, .066 * k, cTrim, 0, .5); }
        limb(ff, Ar.E, Ar.W, .047 * k, .034 * k, kit.sleeves ? cShirt : cSkin, .12, .35);               // forearm
        if (kit.sleeves) { limb(ff, Ar.E, [lerp(Ar.E[0], Ar.W[0], .3), lerp(Ar.E[1], Ar.W[1], .3)], .055 * k, .05 * k, cTrim, 0, .5); }
        ff.fillStyle = cSkin.base; ff.beginPath(); ff.arc(Ar.E[0], Ar.E[1], .046 * k, 0, TAU); ff.fill();
        if (kit.sleeves) { ff.fillStyle = cShirt.base; ff.beginPath(); ff.arc(Ar.E[0], Ar.E[1], .05 * k, 0, TAU); ff.fill(); }
        // hand / glove
        const gc = kit.glove ? cGlove : cSkin, hr = (kit.glove ? .066 : .042) * k, dxw = Ar.W[0] - Ar.E[0], dyw = Ar.W[1] - Ar.E[1], ll = Math.hypot(dxw, dyw) || 1, hx = Ar.W[0] + dxw / ll * hr * .7, hy = Ar.W[1] + dyw / ll * hr * .7;
        ff.save(); ff.translate(hx, hy); ff.rotate(Math.atan2(dyw, dxw)); ff.scale(1.1, kit.glove ? .95 : .82); ff.fillStyle = gc.base; ff.beginPath(); ff.arc(0, 0, hr, 0, TAU); ff.fill(); ff.fillStyle = gc.hi; ff.globalAlpha = .55; ff.beginPath(); ff.arc(-hr * .15, -hr * .3, hr * .55, 0, TAU); ff.fill(); ff.globalAlpha = 1;
        if (kit.glove) { ff.strokeStyle = 'rgba(0,60,30,.45)'; ff.lineWidth = Math.max(1, hr * .07); for (let q = -1; q <= 1; q++) { ff.beginPath(); ff.moveTo(hr * .1, q * hr * .35); ff.lineTo(hr * .85, q * hr * .35); ff.stroke(); } }
        ff.restore();
      });
    });
    // ---- head + neck + hair
    push(P(rig.head)[3] - .02, ff => {
      const hd = pts.hd, r0 = .118 * k * sc, nkp = [pts.S[0], pts.S[1] - .03 * k];
      limb(ff, nkp, [hd[0], hd[1] + .07 * k], .05 * k, .047 * k, cSkin, 0, .5);
      const hairC = kit.hair, lg = [lag[0] * .6, lag[1] * .6];
      // ears
      ff.fillStyle = cSkin.lo; ff.beginPath(); ff.ellipse(hd[0] - r0 * .98, hd[1] + r0 * .08, r0 * .17, r0 * .27, 0, 0, TAU); ff.fill(); ff.beginPath(); ff.ellipse(hd[0] + r0 * .98, hd[1] + r0 * .08, r0 * .17, r0 * .27, 0, 0, TAU); ff.fill();
      // skull
      const gr = ff.createLinearGradient(hd[0] - r0, hd[1] - r0, hd[0] + r0, hd[1] + r0); gr.addColorStop(0, cSkin.hi); gr.addColorStop(.45, cSkin.base); gr.addColorStop(1, cSkin.lo);
      ff.fillStyle = gr; ff.beginPath(); ff.ellipse(hd[0], hd[1], r0 * .95, r0 * 1.1, 0, 0, TAU); ff.fill();
      if (o.front) {
        // faceless: soft cheek/jaw shading only
        ff.fillStyle = 'rgba(60,20,10,.14)'; ff.beginPath(); ff.ellipse(hd[0], hd[1] + r0 * .62, r0 * .62, r0 * .36, 0, 0, TAU); ff.fill();
        ff.fillStyle = hairC; ff.beginPath(); ff.ellipse(hd[0], hd[1] - r0 * .42, r0 * 1.02, r0 * .78, 0, PI, TAU); ff.fill();
        ff.fillStyle = hairC; ff.beginPath(); ff.moveTo(hd[0] - r0 * .95, hd[1] - r0 * .3); ff.quadraticCurveTo(hd[0] - r0 * .3 + lg[0] * .4, hd[1] - r0 * 1.7 + lg[1] * .3, hd[0] + r0 * .9 + lg[0] * .5, hd[1] - r0 * 1.15 + lg[1] * .4); ff.lineTo(hd[0] + r0 * .95, hd[1] - r0 * .3); ff.closePath(); ff.fill();
      } else {
        // back of the head: mostly hair, nape, a flicking tuft
        ff.fillStyle = hairC; ff.beginPath(); ff.ellipse(hd[0], hd[1] - r0 * .06, r0 * 1.0, r0 * 1.04, 0, PI * .08, PI * .92, true); ff.closePath(); ff.fill();
        ff.beginPath(); ff.ellipse(hd[0], hd[1] - r0 * .12, r0 * 1.0, r0 * .98, 0, 0, TAU); ff.fill();
        ff.fillStyle = cSkin.lo; ff.beginPath(); ff.moveTo(hd[0] - r0 * .55, hd[1] + r0 * .62); ff.quadraticCurveTo(hd[0], hd[1] + r0 * 1.12, hd[0] + r0 * .55, hd[1] + r0 * .62); ff.quadraticCurveTo(hd[0], hd[1] + r0 * .4, hd[0] - r0 * .55, hd[1] + r0 * .62); ff.fill();
        ff.fillStyle = hairC; ff.beginPath(); ff.moveTo(hd[0] - r0 * .55, hd[1] - r0 * .95); ff.quadraticCurveTo(hd[0] + lg[0] * .6, hd[1] - r0 * 1.42 + lg[1] * .6 - Math.abs(Math.sin(time * 11)) * r0 * .05, hd[0] + r0 * .6 + lg[0] * 1.0, hd[1] - r0 * 1.05 + lg[1] * .9); ff.quadraticCurveTo(hd[0] + r0 * .2, hd[1] - r0 * .85, hd[0] - r0 * .55, hd[1] - r0 * .95); ff.closePath(); ff.fill();
      }
      // hair sheen
      ff.strokeStyle = 'rgba(255,240,215,.4)'; ff.lineWidth = Math.max(1.5, r0 * .07); ff.lineCap = 'round'; ff.beginPath(); ff.ellipse(hd[0], hd[1] - r0 * .12, r0 * .92, r0 * .9, 0, PI * 1.15, PI * 1.6); ff.stroke();
    });
    Q.sort((a, b) => a.z - b.z); Q.forEach(q => q.fn(f));
    // ---- rim light from the silhouette (cool back-left key, warm right fill)
    const d = Math.max(2, .016 * k);
    const rim = (dx, dy, col) => { const r = RG; r.setTransform(1, 0, 0, 1, 0, 0); r.globalCompositeOperation = 'source-over'; r.clearRect(0, 0, bw, bh); r.drawImage(FIGC, 0, 0, bw, bh, 0, 0, bw, bh); r.globalCompositeOperation = 'destination-out'; r.drawImage(FIGC, 0, 0, bw, bh, dx, dy, bw, bh); r.globalCompositeOperation = 'source-in'; r.fillStyle = col; r.fillRect(0, 0, bw, bh); r.globalCompositeOperation = 'source-over'; };
    g.drawImage(FIGC, 0, 0, bw, bh, ox, oy, bw, bh);
    rim(d, d * .5, 'rgba(150,232,255,.95)'); g.drawImage(RIMC, 0, 0, bw, bh, ox, oy, bw, bh);
    rim(-d, d * .3, 'rgba(255,214,150,.85)'); g.drawImage(RIMC, 0, 0, bw, bh, ox, oy, bw, bh);
  }

  // ---------- striker
  const R_EV = [[26.6, 27.02, -0.72, 13.25, 0.30], [27.20, 27.68, -0.52, 11.95, 0.30]];
  const L_EV = [[26.85, 27.35, -0.55, 12.6, 0.30], [27.53, 28.02, -0.30, 11.12, 0.24]];
  function footAt(ev, w, first) {
    let pos = [first[0], 0, first[1]];
    for (const [tl, td, x, z, lh] of ev) {
      if (w < tl) return pos; const np = [x, 0, z];
      if (w < td) { const q = (w - tl) / (td - tl), e = eio(q); return [lerp(pos[0], np[0], e), lh * Math.sin(q * PI), lerp(pos[2], np[2], e)]; }
      pos = np;
    }
    return pos;
  }
  const armSet = {
    run: (sw) => [.2 + .55 * Math.abs(sw), sw > 0 ? PI / 2 : -PI / 2, .2 + .55 * Math.abs(sw) + 1.05 * (sw > 0 ? 1 : .35), PI / 2],
    wide: [1.35, .25, 1.55, .35], across: [.95, 1.25, 1.75, 1.45], up: [2.55, .1, 2.9, .3], pump: [2.3, .5, 2.2, 1.2],
  };
  const lerpA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  function strikerRig(w, root0) {
    const rootX = A.key(w, [[26.9, -.9], [27.68, -.55], [28.02, -.33], [28.4, -.16], [29.0, -.08], [29.4, -.12]]);
    const rootZ = A.key(w, [[26.9, 13.7], [27.35, 12.95], [27.68, 12.25], [28.02, 11.55], [28.15, 11.42], [28.5, 10.9], [29.0, 10.65], [29.5, 10.75]]);
    const bob = .03 * Math.sin((w - 27) * TAU / .66);
    const fL = footAt(L_EV, w, [-.95, 14.0]);
    let fR = footAt(R_EV, w, [-.95, 14.9]);
    if (w > 27.86) {
      const kk = [[27.86, [-.52, 0, 11.95]], [28.03, [-.02, .55, 12.55], 'out'], [28.15, [.14, .16, 11.3], 'in'], [28.3, [.28, .7, 10.55], 'out'], [28.6, [.34, 1.2, 10.1], 'inOut'], [29.0, [.15, .45, 10.5], 'inOut'], [29.35, [-.05, 0, 10.9], 'inOut']];
      fR = A.key(w, kk);
    }
    const swing = clamp((fR[2] - fL[2]) / .9, -1, 1);
    let aL = armSet.run(swing), aR = armSet.run(-swing);
    const kick = sst(27.95, 28.1, w) * (1 - sst(28.6, 29.0, w)), cel = sst(GOALW - .03, GOALW + .18, w);
    aL = lerpA(aL, armSet.wide, kick); aR = lerpA(aR, armSet.across, kick);
    const pump = .5 + .5 * Math.sin((w - GOALW) * 9);
    aL = lerpA(aL, lerpA(armSet.up, armSet.pump, pump * .5), cel); aR = lerpA(aR, lerpA(armSet.up, armSet.pump, (1 - pump) * .5), cel);
    const lean = A.key(w, [[27, .24], [28.02, .14], [28.15, .05], [28.4, .3], [28.9, .1], [29.3, -.05]]);
    const hop = cel * Math.max(0, Math.sin((w - GOALW) * 7)) * .2;
    const yaw = clamp(-swing * .4, -.55, .55) + .38 * kick * Math.sin(sst(28.0, 28.3, w) * PI);
    const rootY = .93 + bob - .06 * Math.sin(sst(27.95, 28.05, w) * PI) + hop;
    fL[1] += hop; fR[1] += hop;
    return makeRig({ root: [rootX, rootY, rootZ], fL: [fL[0], fL[1] + .08, fL[2]], fR: [fR[0], fR[1] + .08, fR[2]], lean, yaw, aL, aR, headX: .01 * Math.sin(w * 3) });
  }
  function standRig(x, z, seed, w, cheer) {
    const sw = .015 * Math.sin(w * 1.3 + seed), hop = cheer ? Math.max(0, Math.sin((w - GOALW) * 8 + seed)) * .16 * cheer : 0;
    const aa = lerpA([.3, .3, .6, .5], armSet.up, cheer || 0);
    return makeRig({ root: [x, .93 + sw + hop, z], fL: [x - .16, .08 + hop, z + .04], fR: [x + .16, .08 + hop, z - .04], lean: .06, yaw: .05 * Math.sin(w * .7 + seed), aL: aa, aR: aa });
  }
  const BYST = [[-4.6, 8.6, 1, 'teamA'], [5.2, 9.0, 2, 'teamB'], [-8.0, 7.0, 3, 'teamB'], [8.4, 7.6, 4, 'teamA'], [2.6, 8.2, 5, 'teamB']];

  // ---------- keeper (frontal), full-extension dive
  function keeperRig(w) {
    const ready = w < 28.3, Z = .3;
    const gam = A.key(w, [[27, 0], [28.3, 0], [28.55, .12, 'out'], [29.0, 1.0, 'inOut'], [29.4, 1.42, 'inOut'], [29.8, 1.5]]);
    const hx = A.key(w, [[27, .0], [27.7, .35, 'inOut'], [28.1, -.3, 'inOut'], [28.3, 0], [29.0, 1.35, 'inOut'], [29.4, 2.55, 'inOut'], [29.8, 3.0, 'out']]);
    const hy = A.key(w, [[27, 1.0], [28.2, .95], [28.4, .78, 'out'], [28.95, 1.3, 'out'], [29.25, 1.12, 'in'], [29.5, .38, 'in'], [29.8, .25]]);
    const U = [Math.sin(gam), Math.cos(gam)], Rp = [Math.cos(gam), -Math.sin(gam)];
    const at = (up, side, z = 0) => [hx + U[0] * up + Rp[0] * side, hy + U[1] * up + Rp[1] * side, Z + z];
    const dive = sst(28.3, 28.8, w), jump = sst(28.75, 29.05, w);
    const hipL = at(0, -.1), hipR = at(0, .1), S = at(.58, 0), shL = at(.58, -.23), shR = at(.58, .23), head = at(.78, 0);
    const spread = lerp(.6, .1, dive);
    const hand = (side, shj) => {
      const ext = [shj[0] + (U[0] * Math.cos(spread * .5) + side * Rp[0] * Math.sin(spread * .5)) * .6, shj[1] + (U[1] * Math.cos(spread * .5) + side * Rp[1] * Math.sin(spread * .5)) * .6, Z];
      const rdy = [shj[0] + side * .52, shj[1] - .08, Z + .22];
      return [lerp(rdy[0], ext[0], dive), lerp(rdy[1], ext[1], dive), lerp(rdy[2], ext[2], dive)];
    };
    const arm = (side, shj) => { const wr = hand(side, shj); const dir = sub3(wr, shj), l = Math.hypot(dir[0], dir[1], dir[2]) || 1, s1 = .31 / .6; const straight = add3(shj, dir, s1); const bend = (1 - dive) * .11; return [shj, [straight[0] + side * bend * .6, straight[1] - bend, straight[2] + bend * .5], wr]; };
    const legT = side => {
      const hip = side < 0 ? hipL : hipR;
      let foot;
      if (ready) foot = [hx + side * .32, .05, Z + .03];
      else { const fx = hip[0] - U[0] * .9 + side * Rp[0] * (.16 + .1 * dive), fy = Math.max(.05, hip[1] - U[1] * .9 + side * Rp[1] * (.16 + .1 * dive)); foot = [fx, fy, Z]; }
      const bendDir = [side * (ready ? .1 : .04) + (ready ? 0 : -Rp[0] * .12), ready ? .02 : -Rp[1] * .12, .18];
      return ik(hip, foot, bendDir);
    };
    const rig = { r: [hx, hy, Z], S, head, hipL, hipR, legL: legT(-1), legR: legT(1), shL, shR, armL: arm(-1, shL), armR: arm(1, shR), yaw: 0, lean: 0, gam };
    return rig;
  }

  // ---------- ball
  const ICO = (() => { const p = (1 + Math.sqrt(5)) / 2, v = []; [[0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p], [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0], [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]].forEach(a => { const l = Math.hypot(...a); v.push(a.map(q => q / l)); }); return v; })();
  function drawBall(g, x, y, r, spin, alpha = 1) {
    g.save(); g.globalAlpha = alpha; g.translate(x, y);
    g.shadowColor = 'rgba(255,220,140,.9)'; g.shadowBlur = r * .9; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = rad(g, -r * .35, -r * .4, r * .05, r * 1.1, [[0, '#ffffff'], [.6, '#e6ebf8'], [1, '#8a9ac8']]); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
    const cs = Math.cos(spin), sn = Math.sin(spin), ax = [.6, .5, .62], al = Math.hypot(...ax), k = ax.map(q => q / al);
    ICO.forEach(v => {
      const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2], cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      const q = [v[0] * cs + cr[0] * sn + k[0] * d * (1 - cs), v[1] * cs + cr[1] * sn + k[1] * d * (1 - cs), v[2] * cs + cr[2] * sn + k[2] * d * (1 - cs)];
      if (q[2] < .05) return; g.fillStyle = '#10142a'; g.save(); g.translate(q[0] * r * .92, q[1] * r * .92); g.rotate(Math.atan2(q[1], q[0])); g.scale(Math.max(.25, q[2]), 1); g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.lineTo(Math.cos(a) * r * .34, Math.sin(a) * r * .34); } g.closePath(); g.fill(); g.restore();
    });
    g.restore();
    g.strokeStyle = 'rgba(160,230,255,.9)'; g.lineWidth = Math.max(1.5, r * .08); g.beginPath(); g.arc(0, 0, r - .5, PI * 1.05, PI * 1.6); g.stroke();
    g.strokeStyle = 'rgba(255,215,140,.8)'; g.beginPath(); g.arc(0, 0, r - .5, PI * .1, PI * .5); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(-r * .38, -r * .45, r * .22, r * .12, -.6, 0, TAU); g.fill();
    g.restore();
  }
  function trail(g, pj, w, t) {
    if (w < KICK + .004) return; const N = 30, dt = .016, pts = [];
    for (let i = 0; i < N; i++) { const ww = w - i * dt; if (ww < KICK) break; const b = ballAt(ww).p, s = pj(b[0], b[1], b[2]); const age = i / N; pts.push([s[0] + A.noise1(t * 8 + i * .45) * 7 * age * (s[2] / 100), s[1] + A.noise1(t * 8 + i * .45 + 30) * 7 * age * (s[2] / 100), s[2]]); }
    if (pts.length < 2) return; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < pts.length - 1; i++) { const q = 1 - i / pts.length, r0 = .11 * pts[i][2]; const wd = r0 * (pass === 0 ? 3.4 : pass === 1 ? 2.0 : 0.95) * Math.pow(q, .8), col = pass === 0 ? `rgba(40,200,255,${.28 * q})` : pass === 1 ? `rgba(120,225,255,${.5 * q})` : `rgba(255,214,110,${.95 * q})`; g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke(); }
    }
    for (let i = 2; i < pts.length; i += 3) { const q = 1 - i / pts.length; V.sparkle(g, pts[i][0] + A.noise1(i * 3.1 + Math.floor(t * 20)) * 16, pts[i][1] + A.noise1(i * 5.7 + Math.floor(t * 20)) * 16, 6 + 12 * q, i % 2 ? '#FFE9A8' : '#9BEBFF', i, q * .9); }
    g.restore();
  }

  // ---------- pitch / goal
  function drawPitch(g, c, pj, t) {
    const XM = 26;
    const pl = pj(-14, 0, -6), pr = pj(14, 0, -6);
    g.fillStyle = '#12592a'; g.beginPath(); g.moveTo(-300, pl[1] - 6); g.lineTo(pl[0], pl[1] - 6); g.lineTo(pr[0], pr[1] - 6); g.lineTo(1400, pr[1] - 6); g.lineTo(1400, 2200); g.lineTo(-300, 2200); g.closePath(); g.fill();
    const zs = []; for (let z = -6; z < 16.5; z += 3.6) zs.push(z);
    zs.push(16.5);
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = Math.min(zs[i + 1], 16.4); if (za >= 16.4) break;
      const a = pj(-XM, 0, za), b = pj(XM, 0, za), cc = pj(XM, 0, zb), d = pj(-XM, 0, zb);
      g.fillStyle = i % 2 ? '#1a7034' : '#0f5325'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(cc[0], cc[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill();
    }
    const yb = pl[1];
    g.save(); g.globalCompositeOperation = 'lighter'; const gc = pj(0, 0, 3); g.fillStyle = rad(g, gc[0], gc[1], 20, 900, [[0, 'rgba(120,255,170,.16)'], [.5, 'rgba(60,180,120,.05)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, yb, 1080, 1920 - yb); g.restore();
    g.fillStyle = lin(g, 0, yb - 6, 0, yb + 90, [[0, 'rgba(90,190,220,.28)'], [1, 'rgba(90,190,220,0)']]); g.fillRect(0, yb - 6, 1080, 96);
    g.fillStyle = lin(g, 0, 950, 0, 1920, [[0, 'rgba(2,10,20,0)'], [1, 'rgba(2,10,20,.78)']]); g.fillRect(0, 950, 1080, 1020);
    const quad = (a, b, cc, d) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(cc[0], cc[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); };
    const ribbonX = (x0, x1, z, wd) => quad(pj(x0, 0, z - wd / 2), pj(x1, 0, z - wd / 2), pj(x1, 0, z + wd / 2), pj(x0, 0, z + wd / 2));
    const ribbonZ = (x, z0, z1, wd) => quad(pj(x - wd / 2, 0, z0), pj(x + wd / 2, 0, z0), pj(x + wd / 2, 0, z1), pj(x - wd / 2, 0, z1));
    g.fillStyle = 'rgba(240,255,245,.85)'; ribbonX(-XM, XM, 0, .14); ribbonX(-9.16, 9.16, 5.5, .14); ribbonZ(-9.16, 0, 5.5, .14); ribbonZ(9.16, 0, 5.5, .14);
    ribbonZ(-20.16, 0, 16.4, .14); ribbonZ(20.16, 0, 16.4, .14);
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, p = pj(SPOT[0] + Math.cos(a) * .15, 0, 11 + Math.sin(a) * .15); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); g.fill();
  }
  // ad boards around the pitch, projected slice by slice so they follow the orbit
  function drawBoards(g, pj, t, E) {
    const tex = boardsLayer(), sl = 1.0, x00 = -14;
    for (let x = x00; x < 14 - 1e-6; x += sl) {
      const p0 = pj(x, .9, -6), p1 = pj(x + sl, .9, -6), q0 = pj(x, 0, -6);
      const u0 = (x - x00) * BPX, du = sl * BPX; g.save();
      g.transform((p1[0] - p0[0]) / du, (p1[1] - p0[1]) / du, (q0[0] - p0[0]) / BH, (q0[1] - p0[1]) / BH, p0[0], p0[1]);
      g.drawImage(tex, u0, 0, du, BH, 0, 0, du + .8, BH); g.restore();
    }
    const a = pj(-14, .9, -6), b = pj(14, .9, -6), a0 = pj(-14, 0, -6), b0 = pj(14, 0, -6);
    // led chase / glass sheen along the boards
    g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(b0[0], b0[1]); g.lineTo(a0[0], a0[1]); g.closePath(); g.clip();
    const sx = ((t * 380) % 2600) - 700, gr = g.createLinearGradient(sx, 0, sx + 340, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${.16 + .12 * E})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-300, Math.min(a[1], b[1]) - 10, 1700, 200);
    g.fillStyle = lin(g, 0, a[1], 0, a0[1] + 20, [[0, 'rgba(255,255,255,.16)'], [1, 'rgba(90,200,255,.05)']]); g.fillRect(-300, Math.min(a[1], b[1]) - 10, 1700, 200); g.restore();
    // dark under-lip
    g.fillStyle = 'rgba(0,6,20,.45)'; g.beginPath(); g.moveTo(a0[0] - 400, a0[1] - 2); g.lineTo(b0[0] + 400, b0[1] - 2); g.lineTo(b0[0] + 400, b0[1] + 10); g.lineTo(a0[0] - 400, a0[1] + 10); g.fill();
  }
  const NETF = {
    back: [[-3.4, 0, -2.2], [3.4, 0, -2.2], [3.4, 2.0, -2.2], [-3.4, 2.0, -2.2], 26, 9],
    left: [[-3.66, 0, 0], [-3.4, 0, -2.2], [-3.4, 2.0, -2.2], [-3.66, 2.44, 0], 6, 9],
    right: [[3.66, 0, 0], [3.4, 0, -2.2], [3.4, 2.0, -2.2], [3.66, 2.44, 0], 6, 9],
    top: [[-3.66, 2.44, 0], [3.66, 2.44, 0], [3.4, 2.0, -2.2], [-3.4, 2.0, -2.2], 26, 6],
  };
  function drawGoal(g, c, pj, w, t) {
    const age = w - GOALW, I = [2.9, 1.85, -1.9];
    const env = age < 0 ? 0 : Math.exp(-age * 2.4);
    const disp = P => {
      const idle = .012 * Math.sin(w * 2 + P[0] * 2 + P[1] * 3);
      let dx = idle, dy = 0, dz = -idle; if (age >= 0) {
        const r = Math.hypot(P[0] - I[0], P[1] - I[1], P[2] - I[2]), fw = clamp(-P[2] / 2.2, 0, 1), wave = Math.sin(TAU * (r * .5 - age * 2.6));
        const a = .3 * env * Math.exp(-r * .25) * fw, bulge = -.7 * Math.exp(-age * 3.2) * Math.exp(-(r * r) / 3.2) * fw;
        dx += (P[0] - I[0]) / (r + .6) * a * wave; dy += (P[1] - I[1]) / (r + .6) * a * wave; dz += bulge + a * wave * .7;
      } return [P[0] + dx, P[1] + dy, P[2] + dz];
    };
    const lerp3 = (a, b, q) => [lerp(a[0], b[0], q), lerp(a[1], b[1], q), lerp(a[2], b[2], q)];
    g.save(); g.lineCap = 'round';
    { const q = [pj(-3.66, 0, 0), pj(3.66, 0, 0), pj(3.4, 2.0, -2.2), pj(-3.4, 2.0, -2.2), pj(-3.66, 2.44, 0), pj(3.66, 2.44, 0)]; g.fillStyle = 'rgba(2,8,20,.55)'; g.beginPath(); g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); g.lineTo(q[5][0], q[5][1]); g.lineTo(q[4][0], q[4][1]); g.closePath(); g.fill(); }
    Object.values(NETF).forEach(F => {
      const [p00, p10, p11, p01, nu, nv] = F;
      const at = (u, v) => disp(lerp3(lerp3(p00, p10, u), lerp3(p01, p11, u), v));
      const k0 = pj(0, 1, 0)[2];
      g.strokeStyle = 'rgba(235,245,255,.42)'; g.lineWidth = Math.max(1, .012 * k0);
      g.beginPath();
      for (let i = 0; i <= nu; i++) { for (let j = 0; j <= nv * 2; j++) { const P = at(i / nu, j / (nv * 2)), s = pj(P[0], P[1], P[2]); j ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); } }
      for (let j = 0; j <= nv; j++) { for (let i = 0; i <= nu * 2; i++) { const P = at(i / (nu * 2), j / nv), s = pj(P[0], P[1], P[2]); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); } }
      g.stroke();
    });
    const k = pj(0, 1, 0)[2], wd = Math.max(4, .13 * k);
    const post = (x) => { const a = pj(x, 0, 0), b = pj(x, 2.44, 0); g.strokeStyle = 'rgba(255,255,255,.98)'; g.lineWidth = wd; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = 'rgba(120,220,255,.6)'; g.lineWidth = wd * .3; g.stroke(); };
    g.shadowColor = 'rgba(255,255,255,.7)'; g.shadowBlur = 14;
    post(-3.66); post(3.66); { const a = pj(-3.66, 2.44, 0), b = pj(3.66, 2.44, 0); g.strokeStyle = '#fff'; g.lineWidth = wd; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.restore();
  }

  // ---------- lights / lens
  function standMap(c, pj) {
    const p0 = pj(0, 0, -8.5), yb = pj(0, .9, -6)[1], s = p0[2] / 65.3, xs = p0[0];
    return { s, xs, yb, map: (cx, cy) => [xs + (cx - 750) * s, yb + 8 - (STAND_H - 30 - cy) * s] };
  }
  const LIGHTS = [[190, 22], [520, 14], [980, 14], [1310, 22]];
  function drawLights(g, st, t, w, E) {
    g.save(); g.globalCompositeOperation = 'lighter';
    LIGHTS.forEach(([cx, cy], i) => {
      const [x, y] = st.map(cx, cy), fl = .9 + .1 * A.noise1(t * 3 + i * 7), s = st.s;
      const dirx = (540 - x) * .4; g.fillStyle = lin(g, x, y, x + dirx, y + 900 * s, [[0, `rgba(190,230,255,${.2 * fl})`], [1, 'rgba(190,230,255,0)']]); g.beginPath(); g.moveTo(x - 30 * s, y); g.lineTo(x + 30 * s, y); g.lineTo(x + dirx + 340 * s, y + 900 * s); g.lineTo(x + dirx - 340 * s, y + 900 * s); g.closePath(); g.fill();
      glow(g, x, y, 380 * s * (1 + .5 * E), '#BFE6FF', .55 * fl); glow(g, x, y, 150 * s, '#ffffff', .9 * fl);
      g.fillStyle = `rgba(255,255,255,${.85 * fl})`; for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { g.beginPath(); g.arc(x + (a - 1) * 24 * s, y + (b - .5) * 20 * s, 8 * s, 0, TAU); g.fill(); }
      g.fillStyle = rad(g, x, y, 0, 520 * s, [[0, 'rgba(160,220,255,.5)'], [1, 'rgba(160,220,255,0)']]); g.save(); g.translate(x, y); g.scale(1, .035); g.beginPath(); g.arc(0, 0, 520 * s * (1 + E * .6), 0, TAU); g.fill(); g.restore();
      for (let k = 0; k < 4; k++) { g.save(); g.translate(x, y); g.rotate(k * PI / 4 + t * .05); g.fillStyle = rad(g, 0, 0, 0, 150 * s, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.scale(1, .05); g.beginPath(); g.arc(0, 0, 150 * s, 0, TAU); g.fill(); g.restore(); }
    });
    g.restore();
  }
  function drawFlares(g, st, t, w, E) {
    const F = [[210, 470, '#FF4A2A'], [420, 500, '#FF7A22'], [1070, 490, '#FF3A6A'], [1290, 460, '#FF5A2A'], [760, 520, '#FF6A2A']], s = st.s;
    F.forEach(([cx, cy, col], i) => {
      const [x, y] = st.map(cx, cy), fl = .8 + .25 * A.noise1(t * 9 + i * 4), R = (70 + 60 * E) * s * fl;
      g.save(); for (let k = 0; k < 5; k++) { const ph = ((t * .35 + k / 5 + i * .17) % 1), yy = y - ph * 300 * s, xx = x + Math.sin(ph * 5 + i + k) * 30 * s + ph * 40 * s, rr = (50 + ph * 120) * s; g.fillStyle = rad(g, xx, yy, 0, rr, [[0, `rgba(230,70,50,${.2 * (1 - ph)})`], [1, 'rgba(230,70,50,0)']]); g.beginPath(); g.arc(xx, yy, rr, 0, TAU); g.fill(); } g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, R * 3, col, .6 * fl); glow(g, x, y, R * 1.1, '#FFE0B0', .85); glow(g, x, y, R * .4, '#ffffff', 1);
      const r = rng(i + 90); for (let k = 0; k < 10; k++) { const ph = ((t * 1.3 + r()) % 1), a = -PI / 2 + (r() - .5) * 1.6; V.sparkle(g, x + Math.cos(a) * ph * 90 * s, y + Math.sin(a) * ph * 90 * s + ph * ph * 60 * s, 4 * s + 4, '#FFC070', 0, (1 - ph)); } g.restore();
    });
  }
  function drawFlags(g, st, t, E) {
    const FL = [[300, 300, '#FFD21E', '#1740C8'], [640, 250, '#2A4FD8', '#FFD21E'], [900, 330, '#FFD21E', '#1740C8'], [1200, 280, '#2A4FD8', '#FFD21E'], [470, 390, '#FFD21E', '#FFD21E'], [1080, 380, '#2A4FD8', '#2A4FD8']], s = st.s;
    FL.forEach(([cx, cy, c1, c2], i) => {
      const [x, y] = st.map(cx, cy), wd = 120 * s, ht = 66 * s;
      g.strokeStyle = '#0a0d24'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(x, y + 240 * s); g.lineTo(x, y - 20 * s); g.stroke();
      for (let k = 0; k < 10; k++) { const u0 = k / 10, u1 = (k + 1) / 10, o0 = Math.sin(t * 6 + i + u0 * 5) * 9 * s * u0 * (1 + E), o1 = Math.sin(t * 6 + i + u1 * 5) * 9 * s * u1 * (1 + E); g.fillStyle = k % 2 ? c1 : mixc(c1, '#000', .18); g.beginPath(); g.moveTo(x + u0 * wd, y + o0); g.lineTo(x + u1 * wd, y + o1); g.lineTo(x + u1 * wd, y + ht + o1); g.lineTo(x + u0 * wd, y + ht + o0); g.closePath(); g.fill(); }
      g.fillStyle = c2; g.globalAlpha = .9; g.fillRect(x + wd * .35, y + ht * .33, wd * .3, ht * .34); g.globalAlpha = 1;
    });
  }
  function drawPhotoFlashes(g, st, t, E) {
    const r = rng(303); g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) { const cx = r() * STAND_W, cy = 80 + r() * 420, per = .35 + r() * 1.2, ph = r() * 5, q = ((t / per + ph) % 1), a = Math.pow(Math.max(0, 1 - q * 9), 2) * (.7 + E); if (a < .02) continue; const [x, y] = st.map(cx, cy); glow(g, x, y, (26 + r() * 30) * st.s, '#ffffff', a); V.sparkle(g, x, y, (14 + 22 * r()) * st.s * (1 + E), '#fff', 0, a); }
    g.restore();
  }
  function lensFlare(ctx, t, E) {
    const lx = 820 + 30 * Math.sin(t * .4), ly = 130, dx = 540 - lx, dy = 900 - ly;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[.35, 80, '#6AD8FF', .12], [.62, 46, '#FFD27A', .14], [.9, 130, '#7A8CFF', .09], [1.3, 60, '#FF7AC8', .1], [1.7, 100, '#7AFFD8', .08]].forEach(([k, r, col, a]) => { ctx.globalAlpha = a * (1 + E * 1.5); ctx.fillStyle = rad(ctx, lx + dx * k, ly + dy * k, r * .2, r, [[0, col], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.arc(lx + dx * k, ly + dy * k, r, 0, TAU); ctx.fill(); });
    ctx.restore();
  }

  // ---------- confetti
  const CONF = (() => { const r = rng(31), o = [], pal2 = ['#FFC24A', '#FFE9A8', '#2F6BFF', '#5AD1FF', '#FFFFFF', '#FFD21E', '#FF4F9A', '#E8323C']; for (let i = 0; i < 320; i++) o.push({ x: r() * 1200 - 60, y: 520 + r() * 140 + H0S, vx: (r() - .5) * 300, vy: -(300 + r() * 1150), g: 200 + r() * 170, w: 9 + r() * 15, h: 6 + r() * 9, sp: 2 + r() * 6, ph: r() * TAU, col: pal2[(r() * pal2.length) | 0], near: r() < .2, d: r() * .4, sw: 15 + r() * 50 }); return o; })();
  function drawConfetti(ctx, t) {
    const t0 = GOALR; if (t < t0) return; ctx.save();
    for (const c of CONF) { const tau = t - t0 - c.d; if (tau < 0 || tau > 5) continue; const sl = c.near ? 2.4 : 1, x = c.x + c.vx * tau * sl + Math.sin(tau * 2 + c.ph) * c.sw, y = c.y + c.vy * tau * sl + .5 * c.g * tau * tau * sl; if (y > 2100 || x < -100 || x > 1200) continue; const fl = Math.cos(tau * c.sp + c.ph);
      ctx.save(); ctx.translate(x, y); ctx.rotate(tau * c.sp * .5 + c.ph); ctx.scale(1, fl); ctx.globalAlpha = c.near ? .85 : 1; ctx.fillStyle = Math.abs(fl) < .25 ? '#fff' : c.col; ctx.fillRect(-c.w * sl / 2, -c.h * sl / 2, c.w * sl, c.h * sl); ctx.restore(); }
    ctx.restore();
  }

  // ---------- ghost spinner / smash (freeze frame: sharp, no white flash)
  const GHOST_T0 = 28.27;
  function ghostCenter(t) { const c = camAt(HOLD0, HOLD0 + .01), pj = mkProj(c), b = ballAt(HOLD0).p; return pj(b[0], b[1], b[2]); }
  function drawGhost(ctx, t) {
    if (t < GHOST_T0 || t >= HOLD1) return; const [cx, cy, k] = ghostCenter(t), fi = Math.floor(t * 30), u = inv(GHOST_T0, HOLD0, t);
    const flick = t < HOLD0 - .05 ? (hash(fi * 5.3) > .38 ? 1 : .25) : 1, al = clamp(u * 3) * flick, sc = lerp(.42, .62, eo(u)), R = 250 * sc;
    const hit = t >= HOLD0;
    ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = rad(ctx, cx - R * .2, cy - R * .3, R * .1, R * 1.1, [[0, 'rgba(200,245,255,.36)'], [.7, 'rgba(90,170,255,.2)'], [1, 'rgba(60,130,255,.32)']]); ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(230,252,255,.85)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,220,255,.55)'; ctx.lineWidth = 12; ctx.globalCompositeOperation = 'lighter'; ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    drawSpinner(ctx, cx, cy, sc * .82, .5 * (1 - u * .6) + .25, fi, .9);
    if (hit || u > .8) drawCracks(ctx, cx, cy, clamp(inv(.8, 1, u)) * 1 + (hit ? 1 : 0), 1, .5);
    ctx.restore();
  }
  function drawSmash(ctx, t) {
    const [cx, cy] = ghostCenter(t); const tau = t - HOLD0;
    if (tau < 0 || tau > 1.2) return;
    if (tau < .5) drawShards(ctx, SH_SMALL, tau, cx, cy, 1000, 900);
    // tasteful, thin impact ring instead of a flash
    shock(ctx, cx, cy, tau, { R: 300, dur: .34, w: 26, a: .7 });
    if (tau < .12) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx, cy, 190, '#BFEFFF', .45 * (1 - tau / .12)); glow(ctx, cx, cy, 90, '#FFF3C4', .5 * (1 - tau / .12)); ctx.restore(); }
  }

  // ---------- broadcast bug (real sport5 logo)
  function drawBug(ctx, t, score) {
    const a0 = TW0 + .1, a1 = PB1 - .05; if (t < a0 || t > a1 + .3) return;
    const inn = ease.outBack(clamp((t - a0) / .4)), out = 1 - ein(clamp((t - a1) / .25)); if (inn <= 0.001 || out <= 0) return;
    const x = 40 - (1 - inn) * 420, y = 178, w = 372, h = 104;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = clamp(out);
    ctx.shadowColor = 'rgba(0,0,30,.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10; A.rrect(ctx, 0, 0, w, h, 26); ctx.fillStyle = lin(ctx, 0, 0, w, h, [[0, '#0e1a66'], [1, '#050a34']]); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); A.rrect(ctx, 0, 0, w, h, 26); ctx.clip(); ctx.fillStyle = lin(ctx, 0, 0, 0, h * .5, [[0, 'rgba(255,255,255,.26)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, w, h * .5);
    const sw = ((t - a0) * 520) % 900 - 250; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lin(ctx, sw, 0, sw + 120, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, w, h); ctx.restore();
    A.rrect(ctx, 1, 1, w - 2, h - 2, 25); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
    // logo tile (the logo is white: sit it on the brand blue)
    A.rrect(ctx, 10, 10, 84, h - 20, 18); ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#2F6BFF'], [1, '#1436b8']]); ctx.fill();
    V.drawLogo(ctx, 'sport5', 52, h / 2, 68, h - 34, { shadow: false });
    // LIVE pill + score
    const pulse = .65 + .35 * Math.sin(t * 9);
    A.rrect(ctx, 108, 14, 86, 32, 16); ctx.fillStyle = '#E8232F'; ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${pulse})`; ctx.beginPath(); ctx.arc(126, 30, 6, 0, TAU); ctx.fill();
    A.text(ctx, 'LIVE', 162, 31, { font: '800 20px Rubik', fill: '#fff' });
    A.text(ctx, 'GOTV', 316, 30, { font: '900 24px Rubik', fill: '#FFC24A' });
    const sc = score, pop = sc.pop; A.rrect(ctx, 108, 54, 244, 38, 12); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
    A.text(ctx, 'ISR', 138, 74, { font: '800 20px Rubik', fill: '#cfe0ff' });
    ctx.save(); ctx.translate(230, 73); ctx.scale(pop, pop); A.text(ctx, sc.a + '  -  ' + sc.b, 0, 0, { font: '900 30px Rubik', fill: sc.hot ? '#FFC24A' : '#fff' }); ctx.restore();
    A.text(ctx, 'OPP', 322, 74, { font: '800 20px Rubik', fill: '#cfe0ff' });
    ctx.restore();
  }

  // ---------------------------------------------------------------- world renderer
  function renderWorld(g, t) {
    const w = wt(t), c = camAt(w, t), pj = mkProj(c), E = sst(GOALW, GOALW + .15, w) * (1 - .25 * sst(GOALW + 1, GOALW + 2.2, w));
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowColor = 'transparent';
    g.fillStyle = '#02030e'; g.fillRect(0, 0, 1080, 1920);
    g.save(); g.translate(540, 900); g.rotate(c.roll); g.translate(-540, -900);
    const pjS = mkProj(Object.assign({}, c, { yaw: c.yaw * .25 })), st = standMap(c, pjS);
    // sky
    g.fillStyle = lin(g, 0, -200, 0, st.yb + 40, [[0, '#02030e'], [.5, '#070d34'], [1, '#17286e']]); g.fillRect(-300, -300, 1680, st.yb + 400);
    glow(g, 540, st.yb - 420, 900, '#2F6BFF', .22 + .2 * E);
    // stands: 4 tiers with real depth (parallax shift per tier, soft far tiers, independent bounce)
    const S = standsLayer(), Sf = standsSoft(), Ar = armsLayer(), bh = STAND_H / BAND;
    for (let i = 0; i < BAND; i++) {
      const amp = (1.2 + 1.3 * i) * (.25 + 3.2 * E) * st.s, bo = -Math.abs(Math.sin(w * (7 + i * .9) + i * 1.7)) * amp;
      const dy = st.yb + 8 - (STAND_H - 30 - i * bh) * st.s + bo, zt = -8.5 - (BAND - 1 - i) * 2.6, sh = pjS(0, 0, zt)[0] - st.xs;
      g.drawImage(i < 2 ? Sf : S, 0, i * bh, STAND_W, bh, st.xs + sh - 750 * st.s, dy, STAND_W * st.s, bh * st.s + 1.5);
      if (E > .01) { g.save(); g.globalAlpha = E; g.drawImage(Ar, 0, i * bh, STAND_W, bh, st.xs + sh - 750 * st.s, dy - 14 * st.s * E * (1 + Math.sin(w * 8 + i)) * .5, STAND_W * st.s, bh * st.s + 1.5); g.restore(); }
      g.fillStyle = `rgba(4,8,36,${.22 - i * .06})`; g.fillRect(0, dy, 1080, bh * st.s + 1.5);   // atmospheric depth
    }
    // haze layer between crowd and pitch
    g.fillStyle = lin(g, 0, st.yb - 220 * st.s, 0, st.yb + 10, [[0, 'rgba(70,120,255,0)'], [1, 'rgba(90,150,255,.14)']]); g.fillRect(0, st.yb - 220 * st.s, 1080, 230 * st.s);
    drawFlags(g, st, t, E); drawLights(g, st, t, w, E); drawPhotoFlashes(g, st, t, E); drawFlares(g, st, t, w, E);
    if (E > .01) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lin(g, 0, st.yb - 500 * st.s, 0, st.yb, [[0, 'rgba(255,200,90,0)'], [1, `rgba(255,190,80,${.32 * E})`]]); g.fillRect(0, st.yb - 500 * st.s, 1080, 500 * st.s); g.restore(); }
    drawPitch(g, c, pj, t);
    drawBoards(g, pj, t, E);
    drawGoal(g, c, pj, w, t);
    // ---- actors
    const sr = strikerRig(w), kr = keeperRig(w); sr.prev = strikerRig(w - .07); kr.prev = keeperRig(w - .07);
    const shadowE = (x, z, rx, rz, a) => { const p = pj(x, 0, z), q = pj(x + rx, 0, z), s = pj(x, 0, z - rz); const ex = Math.abs(q[0] - p[0]), ey = Math.abs(s[1] - p[1]); g.save(); g.translate(p[0], p[1]); g.scale(1, Math.max(.05, ey / Math.max(1, ex))); g.fillStyle = rad(g, 0, 0, 0, ex, [[0, `rgba(0,10,20,${a})`], [1, 'rgba(0,10,20,0)']]); g.beginPath(); g.arc(0, 0, ex, 0, TAU); g.fill(); g.restore(); };
    shadowE(sr.r[0] + .1, sr.r[2] + .25, .75, .4, .5); BYST.forEach(([x, z]) => shadowE(x + .1, z + .2, .6, .3, .38)); shadowE(kr.r[0] + (kr.gam > .3 ? .3 : 0), kr.r[2] + .1, .6 + kr.gam * .6, .3, .4);
    { const b = ballAt(w).p; shadowE(b[0], b[2] + .05, .2 + b[1] * .05, .12, .55); }
    const items = [], cheerA = sst(GOALW - .05, GOALW + .2, w);
    BYST.forEach(([x, z, sd, kit]) => { const rg = standRig(x, z, sd, w, kit === 'teamA' ? cheerA : cheerA * .0); items.push({ z: pj(x, 0, z)[3], fn: gg => drawFigure(gg, pj, rg, KIT[kit], { num: String(2 + sd * 3), time: w + sd, scale: 1 }) }); });
    items.push({ z: pj(sr.r[0], 0, sr.r[2])[3], fn: gg => drawFigure(gg, pj, sr, KIT.teamA, { num: '10', time: w, scale: 1.04 }) });
    items.push({ z: pj(0, 0, kr.r[2])[3], fn: gg => drawFigure(gg, pj, kr, KIT.keeper, { front: true, time: w, scale: 1.02 }) });
    const bl = ballAt(w), bs = pj(bl.p[0], bl.p[1], bl.p[2]);
    items.push({ z: bs[3] - .001, fn: gg => trail(gg, pj, w, t) });
    items.push({ z: bs[3], fn: gg => drawBall(gg, bs[0], bs[1], .115 * bs[2], bl.spin) });
    items.sort((a, b) => a.z - b.z);
    items.forEach(it => it.fn(g));
    // boot contact: sparks + gold/cyan kick glow
    if (w > KICK - .01 && w < KICK + .25) { const b0 = pj(SPOT[0], .25, SPOT[2]), q = 1 - (w - KICK) / .25; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, b0[0], b0[1], 200 * q + 50, '#FFD27A', .75 * q); glow(g, b0[0], b0[1], 130 * q + 30, '#7ADFFF', .6 * q); for (let i = 0; i < 14; i++) { const a = hash(i * 3.3) * TAU, d = eo(1 - q) * (60 + 200 * hash(i)) * (b0[2] / 300); V.sparkle(g, b0[0] + Math.cos(a) * d, b0[1] + Math.sin(a) * d, (10 + 10 * hash(i + 4)) * Math.min(2, b0[2] / 250), '#FFF3C4', a, q); } g.restore(); }
    g.restore();
    // goal impact effects (screen space, toned down)
    const gp = pj(2.9, 1.85, -1.9);
    if (w >= GOALW - .005) {
      const ag = w - GOALW;
      g.save(); g.globalCompositeOperation = 'lighter';
      if (ag < .35) glow(g, gp[0], gp[1], 420 * (1 - ag * 2) + 80, '#FFE9A8', .6 * (1 - ag * 2.8 > 0 ? 1 - ag * 2.8 : 0));
      g.restore();
      shock(g, gp[0], gp[1], ag, { R: 460, dur: .55, w: 34, a: .6 }); burstLines(g, gp[0], gp[1], ag, 61, '255,240,190', 44, .5);
      V.flash(g, w, GOALW, .18, '#FFE9A8', .28);
      if (ag > 0 && ag < 1.2) { g.save(); g.globalCompositeOperation = 'lighter'; const r = rng(17); for (let i = 0; i < 40; i++) { const a = r() * TAU, sp = 200 + r() * 700, x = gp[0] + Math.cos(a) * sp * ag, y = gp[1] + Math.sin(a) * sp * ag + 280 * ag * ag, al = clamp(1 - ag / (.6 + r() * .6)); if (al > 0) V.sparkle(g, x, y, 8 + r() * 16, r() < .5 ? '#FFE9A8' : '#9BEBFF', r() * 3, al); } g.restore(); }
    }
    lensFlare(g, t, E);
    drawConfetti(g, t);
    return { E, c, pj };
  }

  // ---------------------------------------------------------------- composite for t >= TW0
  const TINT = mk(1080, 1920), TG = TINT.getContext('2d');
  function tinted(col) { TG.globalCompositeOperation = 'source-over'; TG.clearRect(0, 0, 1080, 1920); TG.drawImage(WLD, 0, 0); TG.globalCompositeOperation = 'multiply'; TG.fillStyle = col; TG.fillRect(0, 0, 1080, 1920); TG.globalCompositeOperation = 'source-over'; return TINT; }
  function drawWorldPhase(ctx, t) {
    renderWorld(WG, t);
    const holding = t >= HOLD0 && t < HOLD1, sh0 = shake(t), sh = holding ? { x: 0, y: 0, r: 0 } : sh0, pb = ein(inv(PB0, PB1, t)), wh = t > PB1 ? ein(inv(PB1, WH1, t)) : 0;
    ctx.save();
    if (t <= PB1) {
      ctx.translate(540, 960); ctx.rotate(sh.r); ctx.translate(-540 + sh.x, -960 + sh.y);
      if (holding) { ctx.translate(540, 900); ctx.scale(1.06, 1.06); ctx.translate(-540, -900); }
      ctx.drawImage(WLD, 0, 0);
      if (holding) {     // freeze-frame stamp: hard chroma split + crisp contrast, no white flash
        ctx.fillStyle = 'rgba(0,4,20,.2)'; ctx.fillRect(0, 0, 1080, 1920); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3; ctx.drawImage(tinted('#ff2a5a'), -8, 0); ctx.drawImage(tinted('#22d8ff'), 8, 0); ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rad(ctx, 540, 900, 300, 1100, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(50,70,130,1)']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
      }
      if (pb > .02) { const n = 7; for (let j = 1; j <= n; j++) { const s = 1 - pb * .11 * j / n; ctx.save(); ctx.globalAlpha = .16; ctx.translate(540, 900); ctx.scale(s, s); ctx.translate(-540, -900); ctx.drawImage(WLD, 0, 0); ctx.restore(); } }
    } else {
      ctx.fillStyle = lin(ctx, 0, 0, 1080, 0, [[0, '#CFE4FF'], [1, '#FFFFFF']]); ctx.fillRect(0, 0, 1080, 1920);
      const off = wh * 1700, n = 12, L = 620 * wh;
      for (let j = n; j >= 0; j--) { ctx.save(); ctx.globalAlpha = j === 0 ? 1 : .5 / (1 + j * .35); ctx.drawImage(WLD, off - L * j / n, 0); ctx.restore(); }
    }
    ctx.restore();
    const br = Math.max(sst(29.86, PB1, t) * .7, wh * .55); if (br > 0) { ctx.save(); ctx.globalAlpha = br; ctx.fillStyle = rad(ctx, 540, 900, 0, 1300, [[0, '#FFFFFF'], [1, '#CFE6FF']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    ctx.save(); ctx.translate(540 + sh.x * .5, 960 + sh.y * .5); ctx.translate(-540, -960);
    if (holding) { ctx.translate(540, 900); ctx.scale(1.06, 1.06); ctx.translate(-540, -900); }
    drawGhost(ctx, t); drawSmash(ctx, t); ctx.restore();
    // broadcast bug rides above the world (not with the whip)
    if (t <= PB1 + .1) { const gs = t >= GOALR; drawBug(ctx, t, { a: gs ? 1 : 0, b: 0, hot: gs, pop: gs ? 1 + .5 * Math.exp(-(t - GOALR) * 8) * Math.cos((t - GOALR) * 30) : 1 }); }
    const ga = 1 - sst(TW0, TW0 + .3, t); if (ga > 0) { ctx.save(); ctx.globalAlpha = ga; ctx.fillStyle = rad(ctx, 540, 960, 0, 1200, [[0, '#FFFBE0'], [.5, '#FFC24A'], [1, '#E48A12']]); ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    V.flash(ctx, t, TW0 + .03, .3, '#ffffff', .85);
  }

  A.scene({
    name: 'v6_impact', start: 25.61, end: 30.42,
    draw(ctx, s) {
      const t = s.t;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1080, 1920);
      if (t < TW0) drawImpact(ctx, t); else drawWorldPhase(ctx, t);
    },
  });
})();
