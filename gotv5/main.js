// GOTV v5 compositor: scenes -> host overlay -> ransom-note captions -> paper grain. Stop-motion look: no motion blur, 1 sample per frame.
(() => {
  const W = 1080, H = 1920, FPS = 30, DURV = A.DUR;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const { clamp, lerp, inv, ease, hash, rng } = A, C = CL.C;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  A.tMap = null; A.post = null;
  // ---- captions: chips per phrase
  const EMPH = { 'מנטפליקס': C.red, 'מדיסני': C.blue, 'הספורט': C.green, 'ספורט': C.green, 'חיים': C.red, 'השידורים': C.red, 'שידורים': C.red, 'תקיעות': C.orange, 'נקודה': C.orange, 'אנימה': C.pink, 'טורקיות': C.orange, 'קוריאניות': C.blue, "וצ'רלטון": C.green };
  const chunks = (() => {
    const out = []; let cur = []; const flush = () => { if (cur.length) out.push(cur); cur = []; };
    WORDS.forEach(w => { if (cur.length && (w.ph !== cur[0].ph || cur.length >= 3 || cur.reduce((s, q) => s + q.w.length, 0) + w.w.length > 16)) flush(); cur.push(w); if (/[,?]$/.test(w.w)) flush(); });
    flush(); out.forEach(c => { c.t0 = c[0].t0; c.t1 = c[c.length - 1].t1; }); return out;
  })();
  CL.noCap = [[36.85, 99]];   // [t0,t1] windows with no captions (scenes may push more)
  CL.capY = 1400;              // caption baseline; scenes can override per time with CL.capYAt = t => y
  function captions(c, t) {
    if (CL.noCap.some(([a, b]) => t >= a && t < b)) return;
    const ci = chunks.findIndex(k => t >= k.t0 - 0.02 && t < k.t1 + 0.12); if (ci < 0) return;
    const ch = chunks[ci], big = ch.some(w => /^(תקיעות|נקודה)/.test(w.w)), size = big ? 132 : 92, YB = CL.capYAt ? CL.capYAt(t) : CL.capY;
    c.save(); c.direction = 'rtl'; c.font = `900 ${size}px Rubik`;
    const words = ch.map(w => w.w.replace(/[,?]/g, '')), gap = 18, pad = size * .3, widths = words.map(s => c.measureText(s).width + pad * 2);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1), fit = Math.min(1, 980 / total); let x = total / 2;    // RTL: first word at right
    c.translate(540, YB); c.scale(fit, fit);
    words.forEach((s, i) => {
      const w = ch[i], wp = widths[i], cx = x - wp / 2, age = t - w.t0, sc = CL.pop(t, w.t0 - .04, .22); x -= wp + gap; if (sc <= 0) return;
      const active = t >= w.t0 - .03 && t < w.t1 + .02, em = EMPH[s] || EMPH[s.replace(/^ו/, '')], sd = ci * 3 + i, jt = CL.j(t, sd, 2.2), rot = (hash(sd * 1.3) - .5) * .14 + jt[2];
      CL.chip(c, s, cx + jt[0], (hash(sd * 2.1) - .5) * 26 + jt[1], { size, fill: active ? C.yellow : (em ? '#fff' : C.white), ink: em && !active ? em : C.ink, rot, seed: sd + 2, scale: sc * (active ? 1.06 : 1), pad });
    });
    c.restore();
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (L) {
      c.save(); c.direction = 'ltr'; c.font = '700 34px Rubik'; const tw = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0), y = YB + size * .95 + 34, gs = Math.min(1, 980 / (tw + 60));
      c.translate(540, y); c.scale(gs, gs); c.fillStyle = 'rgba(255,253,246,.92)'; CL.tornPath(c, -tw / 2 - 24, -32, tw + 48, 64, { seed: 9, rough: 3 }); c.fill();
      let xx = -tw / 2; for (const w of L.words) { A.text(c, w.w, xx, 2, { font: '700 34px Rubik', align: 'left', fill: t >= w.t ? '#C2410C' : 'rgba(20,20,20,.72)' }); xx += c.measureText(w.w + ' ').width; }
      c.restore();
    }
  }
  const grain = (() => { const g = mk(270, 480), gx = g.getContext('2d'), id = gx.createImageData(270, 480), r = rng(5); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); return g; })();
  const ACC = mk(W, H), acx = ACC.getContext('2d');
  async function draw(f, opt = {}) {
    const t = f / FPS;
    cv.width = W;   // reset all canvas state
    if (window.HOST) await HOST.prepare(t);
    A.renderFrame(f);
    if (window.HOST) HOST.overlay(ctx, t);
    // whole-frame stop-motion punch at each phrase start (stepped at 12 fps)
    const q = CL.q(t, 12); let z = 1; chunks.forEach(k => { const u = q - k.t0; if (u >= 0 && u < .34) z += .03 * (1 - u / .34); });
    const j = CL.j(t, 77, 1.2);
    ACC.width = W; acx.save(); acx.translate(540 + j[0], 960 + j[1]); acx.rotate(j[2]); acx.scale(z, z); acx.translate(-540, -960); acx.drawImage(cv, 0, 0); acx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(ACC, 0, 0);
    captions(ctx, t);
    if (window.G_OVERLAY) window.G_OVERLAY(ctx, t);
    ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'multiply'; const gq = Math.floor(t * 12); ctx.drawImage(grain, (gq % 5) * 3, (gq % 7) * 2, 270 - 20, 480 - 20, 0, 0, W, H); ctx.restore();
    const fb = Math.max(1 - inv(0, 0.15, t), inv(DURV - .25, DURV, t)); if (fb > 0) { ctx.fillStyle = `rgba(20,14,6,${fb})`; ctx.fillRect(0, 0, W, H); }
  }
  window.G = { draw, W, H, FPS, DURV, chunks };
  window.gReady = Promise.all([CL.logosReady, document.fonts.ready.then(() => Promise.all(['300 20px Rubik', '600 20px Rubik', '700 20px Rubik', '900 20px Rubik', '20px Bangers', '20px Secular'].map(f => document.fonts.load(f, 'אבג abc'))))]);
})();
