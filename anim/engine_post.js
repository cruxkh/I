// Global finishing pass: Hebrew subtitles, vignette, film grain, letterbox fade-in/out.
(() => {
  const grain = [];
  for (let k = 0; k < 6; k++) {
    grain.push(A.layer('grain' + k, 480, 270, (g, w, h) => {
      const id = g.createImageData(w, h), r = A.rng(k + 3);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
    }));
  }
  const vig = A.layer('vignette', 1920, 1080, (g, w, h) => {
    g.fillStyle = A.radial(g, w / 2, h / 2, h * 0.45, h * 1.05, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,25,0.55)']]);
    g.fillRect(0, 0, w, h);
  });

  // subtitles: Hebrew (primary, big) with small English under it. Title-card scenes can suppress via A.noSubs(t).
  function subs(ctx, t) {
    if (A.noSubs && A.noSubs(t)) return;
    const L = (A.LINES || []).find(l => t >= l.t - 0.05 && t <= l.end + 0.35);
    if (!L) return;
    const a = Math.min(A.inv(L.t - 0.05, L.t + 0.12, t), 1 - A.inv(L.end + 0.15, L.end + 0.35, t));
    const y = 985 - (1 - A.ease.out(A.inv(L.t - 0.05, L.t + 0.2, t))) * 12;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '700 50px Rubik'; ctx.direction = 'rtl';
    const w = Math.max(ctx.measureText(L.he).width, 300);
    ctx.fillStyle = 'rgba(12,8,28,0.42)'; A.rrect(ctx, 960 - w / 2 - 34, y - 46, w + 68, 116, 26); ctx.fill();
    A.text(ctx, L.he, 960, y, { font: '700 50px Rubik', fill: '#fff8e6', stroke: 'rgba(15,10,35,0.9)', lw: 7, dir: 'rtl' });
    // english with word-by-word lighting
    ctx.font = '500 26px Rubik';
    const words = L.words; let total = words.reduce((s, w) => s + ctx.measureText(w.w + ' ').width, 0), x = 960 - total / 2;
    for (const w of words) {
      const lit = t >= w.t;
      A.text(ctx, w.w, x, y + 46, { font: '500 26px Rubik', align: 'left', fill: lit ? '#ffd84a' : 'rgba(255,255,255,0.55)', stroke: 'rgba(15,10,35,0.8)', lw: 4 });
      x += ctx.measureText(w.w + ' ').width;
    }
    ctx.restore();
  }

  A.post = (ctx, t, f) => {
    ctx.drawImage(vig, 0, 0);
    ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(grain[f % 6], 0, 0, 1920, 1080);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    subs(ctx, t);
    // fade from / to black at very start and end
    const fb = Math.max(1 - A.inv(0, 0.6, t), A.inv(59.2, 60, t));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, 1920, 1080); }
  };
})();
