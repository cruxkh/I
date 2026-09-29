// GOTV Short: compositor. draw(f): temporal supersampling of the scene stack (motion blur), then bloom + captions + grain + fade.
(() => {
  const W = 1080, H = 1920, FPS = 30, DURV = TLF.TOTAL;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ACC = mk(W, H), SUB = mk(W, H), BLM = mk(270, 480), BLM2 = mk(135, 240);
  const acx = ACC.getContext('2d'), bx = BLM.getContext('2d'), bx2 = BLM2.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t));
  A.post = null; A.tMap = TLF.vOf; A.holdAt = TLF.holdAt;
  const sortScenes = () => A.scenes.sort((a, b) => (a.start + a.shift) - (b.start + b.shift));

  // ---------------- captions v2
  const EMPH = { 'מנטפליקס': '#FF5A66', 'מדיסני': '#6DB8FF', 'הספורט': '#4BE59A', 'ספורט': '#4BE59A', 'חיים': '#FF7A7A', 'השידורים': '#FF7A7A', 'שידורים': '#FF7A7A', 'תקיעות': '#FFC24A', 'נקודה': '#FFC24A', 'אנימה': '#FF8BE0', 'טורקיות': '#FFB347', 'קוריאניות': '#7DF2E6', "וצ'רלטון": '#FF9A3D' };
  const chunks = (() => {
    const out = []; let cur = []; const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach(w => { if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 17)) flush(); cur.push(w); if (/[,?]$/.test(w.w)) flush(); });
    flush(); out.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; }); return out;
  })();
  const NOCAP = [[36.2, 99], [25.5, 25.61]];   // end line is drawn by the host/end-card scenes
  function captions(c, t, T) { if (window.DBG) console.log("cap", t.toFixed(2), T.toFixed(2));
    if (NOCAP.some(([a, b]) => t >= a && t < b)) return;
    const hd = TLF.holdAt(T); if (hd && hd.kind === 'interlude') return;
    let ci = chunks.findIndex(k => t >= k.t0 - 0.02 && t < k.t1 + 0.08);
    if (hd) { ci = -1; chunks.forEach((k, i) => { if (k.t0 <= t + 0.01) ci = i; }); }   // during a hold the last spoken chunk stays on screen
    if (ci < 0) return;
    const heroType = t >= 25.61 && t < 27.2;   // the impact scene draws the giant words itself: keep only the English gloss
    const ch = chunks[ci], age = hd ? 9 : t - ch.t0, big = ch.some(w => /^(תקיעות|נקודה)/.test(w.w)), size = big ? 172 : 104, YB = big ? 1300 : 1320;
    if (!heroType) {
      c.save(); c.direction = 'rtl'; c.font = `900 ${size}px Rubik`;
      const words = ch.map(w => w.w.replace(/[,?]/g, '')), gap = size * 0.36, widths = words.map(s => c.measureText(s).width);
      let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1); const fit = Math.min(1, 930 / total);
      const pop = eob(age / 0.2), slide = (1 - pop) * 70, sc0 = lerp(0.72, 1, pop) * fit;
      c.translate(540 + slide * (ci % 2 ? 1 : -1) * (1 - Math.min(1, age / .2)), YB); c.transform(1, 0, -0.10, 1, 0, 0); c.scale(sc0, sc0);   // manga-style italic skew
      // slanted caption band (manga box): dark glass parallelogram + white/gold rules + halftone corner
      const bw = total + size * 0.9, bh = size * 1.42; c.save(); c.globalAlpha = Math.min(1, age / .12);
      const bg = c.createLinearGradient(-bw / 2, 0, bw / 2, 0); bg.addColorStop(0, 'rgba(6,10,40,0)'); bg.addColorStop(.12, 'rgba(6,10,40,.66)'); bg.addColorStop(.88, 'rgba(6,10,40,.66)'); bg.addColorStop(1, 'rgba(6,10,40,0)'); c.fillStyle = bg; c.fillRect(-bw / 2, -bh / 2, bw, bh);
      c.fillStyle = V.lin(c, -bw / 2, 0, bw / 2, 0, [[0, 'rgba(255,194,74,0)'], [.2, '#FFC24A'], [.8, '#FFC24A'], [1, 'rgba(255,194,74,0)']]); c.fillRect(-bw / 2, -bh / 2, bw, 5); c.fillRect(-bw / 2, bh / 2 - 5, bw, 5);
      c.fillStyle = 'rgba(255,255,255,.10)'; for (let yy = -bh / 2 + 10; yy < bh / 2; yy += 12) for (let xx = -bw / 2 + 12 + (((yy / 12) | 0) % 2) * 6; xx < -bw / 2 + bw * .18; xx += 12) { c.beginPath(); c.arc(xx, yy, 2.2 * (1 - (xx + bw / 2) / (bw * .18)), 0, A.TAU); c.fill(); }
      c.restore();
      let x = total / 2;
      words.forEach((s, i) => {
        const w = ch[i], wp = widths[i], cx = x - wp / 2, active = !hd && t >= w.t0 - 0.03 && t < w.t1 - 0.01, k = clamp((t - w.t0) / .16), scl = active ? 1 + .16 * Math.sin(k * Math.PI) : 1, em = EMPH[s] || EMPH[s.replace(/^ו/, '')];
        c.save(); c.translate(cx, 0); c.scale(scl, scl); c.font = `900 ${size}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.miterLimit = 2;
        if (active) { c.save(); c.globalCompositeOperation = 'lighter'; for (let r = 0; r < 12; r++) { const an = r / 12 * A.TAU + s.length; c.strokeStyle = 'rgba(255,225,140,.55)'; c.lineWidth = 4; c.beginPath(); c.moveTo(Math.cos(an) * (wp * .5 + 30), Math.sin(an) * size * .62); c.lineTo(Math.cos(an) * (wp * .5 + 30 + 40 * Math.sin(k * Math.PI)), Math.sin(an) * (size * .62 + 40 * Math.sin(k * Math.PI))); c.stroke(); } c.restore(); }
        c.shadowColor = 'rgba(0,4,30,.7)'; c.shadowBlur = 20; c.shadowOffsetY = 12;
        c.lineWidth = size * .22; c.strokeStyle = '#05061c'; c.strokeText(s, 0, 0); c.shadowColor = 'transparent';
        c.lineWidth = size * .08; c.strokeStyle = active ? '#FF4FA8' : (em || '#5AD1FF'); c.strokeText(s, 5, 6);                      // colour offset shadow (anime title style)
        c.lineWidth = size * .22; c.strokeStyle = '#05061c'; c.strokeText(s, 0, 0);
        const fg = c.createLinearGradient(0, -size * .5, 0, size * .5);
        if (big) { fg.addColorStop(0, '#FFF6C2'); fg.addColorStop(.5, '#FFC24A'); fg.addColorStop(1, '#E48A12'); }
        else if (active) { fg.addColorStop(0, '#FFFBD6'); fg.addColorStop(.55, '#FFD84A'); fg.addColorStop(1, '#FFA51A'); }
        else if (em) { fg.addColorStop(0, '#FFFFFF'); fg.addColorStop(.3, em); fg.addColorStop(1, em); }
        else { fg.addColorStop(0, '#FFFFFF'); fg.addColorStop(1, '#BFD6FF'); }
        c.fillStyle = fg; c.fillText(s, 0, 0);
        c.restore(); x -= wp + gap;
      });
      c.restore();
    }
    let L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (!L && hd) { for (const l of A.LINES) if (l.t <= t + 0.01) L = l; }
    if (L) {
      c.save(); c.direction = 'ltr'; c.font = '600 34px Rubik'; const tw = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0), y = YB + (big ? 150 : 108), gs = Math.min(1, 980 / (tw + 52));
      c.translate(540, y); c.scale(gs, gs); c.translate(-540, -y); c.fillStyle = 'rgba(6,10,30,0.6)'; V.rr(c, 540 - tw / 2 - 26, y - 30, tw + 52, 60, 30); c.fill();
      let xx = 540 - tw / 2; for (const w of L.words) { A.text(c, w.w, xx, y + 2, { font: '600 34px Rubik', align: 'left', fill: t >= w.t ? '#FFD84A' : 'rgba(255,255,255,.62)' }); xx += c.measureText(w.w + ' ').width; }
      c.restore();
    }
  }


  // ---------------- global camera / edit layer: beat pulse, phrase punch, dutch swings, whips at cuts, impact shakes, RGB split
  const CUTS = [[3.05, 1], [5.0, -1], [9.05, 1], [13.10, 1], [15.81, -1], [18.81, 1], [20.64, -1], [23.9, 1], [25.61, 0], [30.12, -1], [36.88, 0]];
  const HITS = [[3.05, .7, 1], [25.61, 1.2, 1], [26.55, .8, 1], [29.28, .9, 1], [36.9, .6, 1], [9.35, .3, .5], [13.4, .3, .5], [31.6, .35, .5], [35.19, .4, .6]];
  const starts = chunks.map(c => c.t0);
  function camAt(t) {
    let z = 1.0, rot = 0, dx = 0, dy = 0, rgb = 0, streak = 0, sdir = 0;
    const beat = ((t % .5) / .5); z += .010 * Math.pow(Math.max(0, 1 - beat * 3.2), 2);
    rot += .006 * Math.sin(t * .8);
    starts.forEach((s, i) => { const u = t - s; if (u >= 0 && u < .7) { z += (i % 2 ? .05 : .035) * Math.exp(-u * 9); if (i % 3 === 1) rot += (i % 2 ? .04 : -.04) * Math.pow(Math.sin(Math.PI * clamp(u / .7)), 2); } });
    CUTS.forEach(([c, dir]) => { const u = (t - (c - .07)) / .32; if (u >= 0 && u < 1) { const e = Math.sin(Math.PI * u), k = (1 - Math.cos(Math.PI * u)) / 2; dx += dir * 300 * e * e * (u < .5 ? -1 : 1) * .5; streak = Math.max(streak, e); sdir = dir; z += .05 * e; rgb = Math.max(rgb, 9 * e); } });
    HITS.forEach(([h, dur, a]) => { const u = t - h; if (u >= 0 && u < dur) { const k = Math.exp(-u * 5 / dur) * a; dx += Math.sin(u * 71) * 20 * k; dy += Math.cos(u * 63) * 17 * k; rot += Math.sin(u * 47) * .012 * k; z += .04 * k; rgb = Math.max(rgb, 8 * k); } });
    return { z, rot, dx, dy, rgb, streak, sdir };
  }
  const RGBF = { r: 'url(#fR)', g: 'url(#fG)', b: 'url(#fB)' };
  // ---------------- post
  const grain = []; for (let k = 0; k < 4; k++) { const g = mk(270, 480), gx = g.getContext('2d'), id = gx.createImageData(270, 480), r = rng(k + 11); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); grain.push(g); }
  const vig = mk(W, H); { const g = vig.getContext('2d'); g.fillStyle = V.rad(g, 540, 960, 700, 1500, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(2,4,20,.55)']]); g.fillRect(0, 0, W, H); }
  function bloom(c, amt = 0.4) {
    bx.clearRect(0, 0, 270, 480); bx.filter = 'brightness(1.25) contrast(1.35) saturate(1.3) blur(2px)'; bx.drawImage(ACC, 0, 0, 270, 480); bx.filter = 'none';
    bx2.clearRect(0, 0, 135, 240); bx2.filter = 'blur(6px)'; bx2.drawImage(BLM, 0, 0, 135, 240); bx2.filter = 'none';
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = amt; c.imageSmoothingQuality = 'high'; c.drawImage(BLM2, 0, 0, W, H); c.globalAlpha = amt * .6; c.drawImage(BLM, 0, 0, W, H); c.restore();
  }
  function post(c, t, f, T) {
    bloom(c, 0.42);
    c.drawImage(vig, 0, 0);
    if (!(t >= 25.5 && t < 25.61)) captions(c, t, T);
    c.save(); c.globalAlpha = .05; c.globalCompositeOperation = 'overlay'; c.drawImage(grain[(f >> 1) % 4], 0, 0, W, H); c.restore();
    if (window.G_OVERLAY) window.G_OVERLAY(c, t);
    const fb = Math.max(1 - inv(0, 0.22, T), inv(DURV - 0.3, DURV, T)); if (fb > 0) { c.fillStyle = `rgba(0,0,0,${fb})`; c.fillRect(0, 0, W, H); }
  }
  let sorted = false, lastCam = { rgb: 0 };
  async function draw(f, opt = {}) {
    if (!sorted) { sortScenes(); sorted = true; }
    const N = opt.fast ? 1 : (opt.n || 3), shutter = 0.55, T0 = f / FPS, t = TLF.vOf(T0);
    ACC.width = W; acx.fillStyle = '#000'; acx.fillRect(0, 0, W, H);
    for (let k = 0; k < N; k++) {
      const ff = f + (N === 1 ? 0 : ((k + .5) / N - .5) * shutter);
      cv.width = W;   // reset ALL canvas state (clips, filters, stacks) so nothing leaks between frames
      const vv = TLF.vOf(ff / FPS);
      if (window.HOST) await HOST.prepare(vv);
      A.renderFrame(ff); if (window.HOST) HOST.overlay(ctx, vv); if (window.FXL) FXL.overlay(ctx, vv); if (window.ANIMEFX) ANIMEFX.overlay(ctx, ff / FPS, vv);
      const cm = camAt(vv), zz = Math.max(cm.z, 1 + 1.3 * Math.abs(cm.rot) + (Math.abs(cm.dx) + Math.abs(cm.dy)) / 540);
      acx.save(); acx.globalAlpha = 1 / (k + 1); acx.translate(540 + cm.dx, 960 + cm.dy); acx.rotate(cm.rot); acx.scale(zz, zz); acx.translate(-540, -960); acx.drawImage(cv, 0, 0);
      if (cm.streak > .3) { for (let q = 1; q <= 4; q++) { acx.globalAlpha = (1 / (k + 1)) * .16 * cm.streak; acx.drawImage(cv, -cm.sdir * q * 26, 0); } }
      acx.restore(); lastCam = cm;
    }
    acx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    const rg = opt.fast ? 0 : camAt(t).rgb;
    if (rg > .6) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter'; ctx.filter = RGBF.r; ctx.drawImage(ACC, rg, 0); ctx.filter = RGBF.g; ctx.drawImage(ACC, 0, 0); ctx.filter = RGBF.b; ctx.drawImage(ACC, -rg, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over'; } else ctx.drawImage(ACC, 0, 0);
    post(ctx, t, f, T0);
  }
  window.G = { draw, W, H, FPS, DURV, chunks };
  window.gReady = Promise.all([V.logosReady, document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '900 20px Rubik'].map(f => document.fonts.load(f, 'אבג abc'))))]);
})();
