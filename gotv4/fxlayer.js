// Director overlay: creator-style stickers and the GOTV mascot placed on the beat over the animation scenes.
(() => {
  const S = (name, t0, dur, x, y, s = 1, rot = 0, o = {}) => ({ kind: 's', name, t0, t1: t0 + dur, x, y, s, rot, o });
  const M = (t0, dur, x, y, s, pose, face, o = {}) => ({ kind: 'm', t0, t1: t0 + dur, x, y, s, pose, face, o });
  const EV = [
    M(4.55, 1.05, 905, 1150, .62, 'wave', 'happy', { flip: true }),
    S('eyes', 0.35, 1.3, 930, 250, .9, .12),
    S('fire', 7.35, 1.1, 930, 300, .95, .15),
    S('boom', 9.7, 0.9, 880, 330, 1.0, -.12, { text: 'בום!' }),
    M(11.95, 1.1, 190, 1010, .7, 'point', 'excited'),
    S('mindblown', 14.75, 1.0, 900, 300, .95, .1),
    M(15.2, 1.15, 890, 1030, .7, 'cheer', 'excited', { flip: true }),
    S('clap', 15.95, 1.1, 150, 1090, .85, -.1),
    M(18.0, 0.8, 900, 1030, .66, 'wow', 'wow', { flip: true }),
    S('cool', 22.6, 1.1, 920, 260, .95, .1),
    M(22.95, 0.9, 190, 1030, .68, 'zap', 'excited'),
    M(28.4, 0.75, 890, 1040, .68, 'shock', 'wow', { flip: true }),
    S('fire', 29.3, 0.9, 180, 300, .95, -.12),
    S('check', 34.4, 1.0, 920, 320, .9, .1),
    M(37.2, 2.2, 880, 1340, .8, 'cheer', 'happy', { flip: true }),
  ];
  function overlay(ctx, t) {
    for (const e of EV) {
      if (t < e.t0 || t > e.t1 + .35) continue;
      ctx.save();
      const o = Object.assign({ t, t0: e.t0, tOut: e.t1 - .3, rot: e.rot }, e.o);
      try {
        if (e.kind === 's') V.sticker(ctx, e.name, e.x, e.y, e.s, o);
        else V.mascot(ctx, e.x, e.y, e.s, Object.assign({ pose: e.pose, face: e.face, flip: !!e.o.flip }, o));
      } catch (err) { console.error('fx', e.name || e.pose, err.message); }
      ctx.restore();
    }
  }
  window.FXL = { overlay, EV };
})();
