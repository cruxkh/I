// subs.js: house-style subtitles (same look as the original GOTV film). Drawn on the final 2D compositor, above the
// paper grain, via window.AFTER_COMPOSITE. Hebrew line: big bold cream on a dark translucent pill; English line under it
// with words lighting up yellow in sync (word times from src/lines.js). Hidden after NO_SUBS_AFTER.
const NO_SUBS_AFTER = 92.7;
window.AFTER_COMPOSITE = (c, t) => {
  if (t > NO_SUBS_AFTER) return;
  const L = LINES.find(l => t >= l.t - 0.05 && t <= l.end + 0.35); if (!L) return;
  const sm = x => x * x * (3 - 2 * x), inv = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
  const a = Math.min(inv(L.t - 0.05, L.t + 0.12, t), 1 - inv(L.end + 0.15, L.end + 0.35, t));
  const y = 985 - (1 - sm(inv(L.t - 0.05, L.t + 0.2, t))) * 12;
  c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '700 50px Rubik'; c.direction = 'rtl';
  const w = Math.max(c.measureText(L.he).width, 300);
  c.fillStyle = 'rgba(12,8,28,0.42)'; c.beginPath(); c.roundRect(960 - w / 2 - 34, y - 46, w + 68, 116, 26); c.fill();
  c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = 'rgba(15,10,35,0.9)'; c.strokeText(L.he, 960, y);
  c.fillStyle = '#fff8e6'; c.fillText(L.he, 960, y);
  c.direction = 'ltr'; c.font = '500 26px Rubik'; c.textAlign = 'left';
  const total = L.words.reduce((s, w) => s + c.measureText(w.w + ' ').width, 0); let x = 960 - total / 2;
  for (const wd of L.words) {
    c.lineWidth = 4; c.strokeStyle = 'rgba(15,10,35,0.8)'; c.strokeText(wd.w, x, y + 46);
    c.fillStyle = t >= wd.t ? '#ffd84a' : 'rgba(255,255,255,0.55)'; c.fillText(wd.w, x, y + 46);
    x += c.measureText(wd.w + ' ').width;
  }
  c.restore();
};
