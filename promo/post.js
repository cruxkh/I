// Global finishing pass: house-style subtitles (big bold Hebrew on a dark pill, small English with words lighting yellow),
// light vignette + grain, fade in/out. Scenes must keep key action above y=900 (subtitle zone is y 930-1060).
(() => {
  const grain = [];
  for (let k = 0; k < 6; k++) grain.push(A.layer('grain' + k, 480, 270, (g, w, h) => {
    const id = g.createImageData(w, h), r = A.rng(k + 3);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }));
  const vig = A.layer('vignette', 1920, 1080, (g, w, h) => {
    g.fillStyle = A.radial(g, w / 2, h / 2, h * 0.5, h * 1.05, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,25,0.45)']]); g.fillRect(0, 0, w, h);
  });
  function subs(ctx, t) {
    if (A.noSubs && A.noSubs(t)) return;
    const L = A.LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.3);
    if (!L) return;
    const a = Math.min(A.inv(L.t - 0.05, L.t + 0.12, t), 1 - A.inv(L.end + 0.1, L.end + 0.3, t));
    const y = 985 - (1 - A.ease.out(A.inv(L.t - 0.05, L.t + 0.2, t))) * 12;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '700 50px Rubik'; ctx.direction = 'rtl';
    const w = Math.max(ctx.measureText(L.he).width, 300);
    ctx.fillStyle = 'rgba(12,8,28,0.5)'; A.rrect(ctx, 960 - w / 2 - 34, y - 46, w + 68, 116, 26); ctx.fill();
    A.text(ctx, L.he, 960, y, { font: '700 50px Rubik', fill: '#fff8e6', stroke: 'rgba(15,10,35,0.9)', lw: 7, dir: 'rtl' });
    ctx.font = '500 26px Rubik'; ctx.direction = 'ltr';
    const total = L.words.reduce((s, w) => s + ctx.measureText(w.w + ' ').width, 0); let x = 960 - total / 2;
    for (const w of L.words) {
      A.text(ctx, w.w, x, y + 46, { font: '500 26px Rubik', align: 'left', fill: t >= w.t ? '#ffd84a' : 'rgba(255,255,255,0.55)', stroke: 'rgba(15,10,35,0.8)', lw: 4 });
      x += ctx.measureText(w.w + ' ').width;
    }
    ctx.restore();
  }
  A.post = (ctx, t, f) => {
    ctx.drawImage(vig, 0, 0);
    ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(grain[(f >> 1) % 6], 0, 0, 1920, 1080);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    subs(ctx, t);
    const fb = Math.max(1 - A.inv(0, 0.35, t), A.inv(A.DUR - 0.35, A.DUR, t));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, 1920, 1080); }
  };
})();
