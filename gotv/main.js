// GOTV Short: compositor. draw(f): temporal supersampling of the scene stack (motion blur), then bloom + captions + grain + fade.
(() => {
  const W = 1080, H = 1920, FPS = 30, DURV = 39.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ACC = mk(W, H), SUB = mk(W, H), BLM = mk(270, 480), BLM2 = mk(135, 240);
  const acx = ACC.getContext('2d'), bx = BLM.getContext('2d'), bx2 = BLM2.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A;
  const eob = t => ease.outBack(clamp(t)), eo = t => ease.out(clamp(t));
  A.post = null;
  const sortScenes = () => A.scenes.sort((a, b) => (a.start + a.shift) - (b.start + b.shift));

  // ---------------- captions v2
  const EMPH = { 'מנטפליקס': '#FF5A66', 'מדיסני': '#6DB8FF', 'הספורט': '#4BE59A', 'ספורט': '#4BE59A', 'חיים': '#FF7A7A', 'השידורים': '#FF7A7A', 'שידורים': '#FF7A7A', 'תקיעות': '#FFC24A', 'נקודה': '#FFC24A', 'אנימה': '#FF8BE0', 'תורכיות': '#FFB347', 'קוריאניות': '#7DF2E6', "וצ'רלטון": '#FF9A3D' };
  const chunks = (() => {
    const out = []; let cur = []; const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach(w => { if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 17)) flush(); cur.push(w); if (/[,?]$/.test(w.w)) flush(); });
    flush(); out.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; }); return out;
  })();
  const NOCAP = [[36.2, 99], [25.5, 25.61]];   // end line is drawn by the host/end-card scenes
  function captions(c, t) {
    if (NOCAP.some(([a, b]) => t >= a && t < b)) return;
    const ci = chunks.findIndex(k => t >= k.t0 - 0.02 && t < k.t1 + 0.08); if (ci < 0) return;
    const heroType = t >= 25.61 && t < 27.2;   // the impact scene draws the giant words itself: keep only the English gloss
    const ch = chunks[ci], age = t - ch.t0, big = ch.some(w => /^(תקיעות|נקודה)/.test(w.w)), size = big ? 168 : 100, YB = big ? 1300 : 1320;
    if (!heroType) {
    c.save(); c.direction = 'rtl'; c.font = `900 ${size}px Rubik`;
    const words = ch.map(w => w.w.replace(/[,?]/g, '')), gap = size * 0.34, widths = words.map(s => c.measureText(s).width);
    let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1); const fit = Math.min(1, 940 / total);
    const pop = eob(age / 0.2); const sc0 = lerp(0.6, 1, pop) * fit, tilt = (hash(ci * 3.1) - .5) * .05 * (1 - eo(age / .3));
    c.translate(540, YB); c.rotate(tilt); c.scale(sc0, sc0);
    let x = total / 2;
    words.forEach((s, i) => {
      const w = ch[i], wp = widths[i], cx = x - wp / 2, active = t >= w.t0 && t < w.t1 + 0.02, k = clamp((t - w.t0) / .14), scl = active ? 1 + .14 * Math.sin(k * Math.PI) : 1, em = EMPH[s] || EMPH[s.replace(/^ו/, '')];
      c.save(); c.translate(cx, 0); c.scale(scl, scl); c.font = `900 ${size}px Rubik`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      if (active && !big) { c.save(); c.shadowColor = 'rgba(255,190,60,.55)'; c.shadowBlur = 40; c.fillStyle = V.lin(c, 0, -size * .62, 0, size * .62, [[0, '#FFE9A8'], [1, '#FFB021']]); V.rr(c, -wp / 2 - 26, -size * .62, wp + 52, size * 1.24, size * .34); c.fill(); c.restore(); }
      c.shadowColor = 'rgba(0,8,40,.65)'; c.shadowBlur = 22; c.shadowOffsetY = 12;
      if (!(active && !big)) { c.lineWidth = size * .16; c.strokeStyle = '#060A1E'; c.strokeText(s, 0, 0); }
      c.shadowColor = 'transparent';
      c.fillStyle = (active && !big) ? '#101440' : big ? V.lin(c, 0, -size * .5, 0, size * .5, V.GOLD_GRAD) : em ? em : V.lin(c, 0, -size * .5, 0, size * .5, V.WHITE_GRAD);
      c.fillText(s, 0, 0); c.restore(); x -= wp + gap;
    });
    c.restore(); }
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (L) {
      c.save(); c.direction = 'ltr'; c.font = '600 34px Rubik'; const tw = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0), y = YB + (big ? 150 : 108), gs = Math.min(1, 980 / (tw + 52));
      c.translate(540, y); c.scale(gs, gs); c.translate(-540, -y); c.fillStyle = 'rgba(6,10,30,0.6)'; V.rr(c, 540 - tw / 2 - 26, y - 30, tw + 52, 60, 30); c.fill();
      let xx = 540 - tw / 2; for (const w of L.words) { A.text(c, w.w, xx, y + 2, { font: '600 34px Rubik', align: 'left', fill: t >= w.t ? '#FFD84A' : 'rgba(255,255,255,.62)' }); xx += c.measureText(w.w + ' ').width; }
      c.restore();
    }
  }

  // ---------------- post
  const grain = []; for (let k = 0; k < 4; k++) { const g = mk(270, 480), gx = g.getContext('2d'), id = gx.createImageData(270, 480), r = rng(k + 11); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); grain.push(g); }
  const vig = mk(W, H); { const g = vig.getContext('2d'); g.fillStyle = V.rad(g, 540, 960, 700, 1500, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(2,4,20,.55)']]); g.fillRect(0, 0, W, H); }
  function bloom(c, amt = 0.4) {
    bx.clearRect(0, 0, 270, 480); bx.filter = 'brightness(1.25) contrast(1.35) saturate(1.3) blur(2px)'; bx.drawImage(ACC, 0, 0, 270, 480); bx.filter = 'none';
    bx2.clearRect(0, 0, 135, 240); bx2.filter = 'blur(6px)'; bx2.drawImage(BLM, 0, 0, 135, 240); bx2.filter = 'none';
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = amt; c.imageSmoothingQuality = 'high'; c.drawImage(BLM2, 0, 0, W, H); c.globalAlpha = amt * .6; c.drawImage(BLM, 0, 0, W, H); c.restore();
  }
  function post(c, t, f) {
    bloom(c, 0.42);
    c.drawImage(vig, 0, 0);
    if (!(t >= 25.5 && t < 25.61)) captions(c, t);
    c.save(); c.globalAlpha = .05; c.globalCompositeOperation = 'overlay'; c.drawImage(grain[(f >> 1) % 4], 0, 0, W, H); c.restore();
    if (window.G_OVERLAY) window.G_OVERLAY(c, t);
    const fb = Math.max(1 - inv(0, 0.22, t), inv(DURV - 0.3, DURV, t)); if (fb > 0) { c.fillStyle = `rgba(0,0,0,${fb})`; c.fillRect(0, 0, W, H); }
  }
  let sorted = false;
  async function draw(f, opt = {}) {
    if (!sorted) { sortScenes(); sorted = true; }
    const N = opt.fast ? 1 : (opt.n || 5), shutter = 0.55, t = f / FPS;
    acx.setTransform(1, 0, 0, 1, 0, 0); acx.globalAlpha = 1; acx.globalCompositeOperation = 'source-over'; acx.fillStyle = '#000'; acx.fillRect(0, 0, W, H);
    for (let k = 0; k < N; k++) {
      const ff = f + (N === 1 ? 0 : ((k + .5) / N - .5) * shutter);
      if (window.HOST) await HOST.prepare(ff / FPS);
      A.renderFrame(ff); acx.globalAlpha = 1 / (k + 1); acx.drawImage(cv, 0, 0);
    }
    acx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.drawImage(ACC, 0, 0);
    post(ctx, t, f);
  }
  window.G = { draw, W, H, FPS, DURV, chunks };
  window.gReady = document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '900 20px Rubik'].map(f => document.fonts.load(f, 'אבג abc'))));
})();
