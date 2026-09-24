// Demo for kits/home.js. Views by global t:
// 0.6-6 street (push-in + marker along A.STREET path) | 6-14.5 master LIVE | 14.5-22 master FREEZE
// 22-26 TV zoom 2.2x in room (freeze) | 26-30 TV full-screen freeze | 30-36 router close-up 3x, ledGlow ramp
// 36-40 Saba-face zone 3x (bg quality) | 40-46 TV full-screen LIVE breakaway | 46-52 master GOAL | 52-59 TV full-screen GOAL
A.noSubs = () => true;
function saba(ctx, x, y) { ctx.save(); ctx.fillStyle = 'rgba(40,20,60,0.85)'; A.ellipse(ctx, x + 10, y - 120, 95, 130); ctx.fill(); A.ellipse(ctx, x + 20, y - 300, 62, 70); ctx.fill(); ctx.fillRect(x + 40, y - 30, 110, 60); ctx.fillRect(x + 120, y, 40, 120); ctx.restore(); }
function noa(ctx, x, y) { ctx.save(); ctx.fillStyle = 'rgba(20,60,70,0.85)'; A.ellipse(ctx, x, y - 90, 60, 95); ctx.fill(); A.ellipse(ctx, x, y - 230, 60, 60); ctx.fill(); ctx.restore(); }
function tvState(t) {
  if (t < 14.5) return { state: 'live', matchT: t - 13 };
  if (t < 46) return { state: 'freeze', matchT: 1.5, freezeGlitch: A.clamp((t - 14.5) / 0.4) * 0.8, spinner: A.smooth(14.7, 15.2, t), bufferPct: Math.min(99, Math.floor((t - 14.5) * 3)) };
  return { state: 'goal', matchT: 1.5 + (t - 46) };
}
function room(ctx, t, o = {}) {
  const LR = A.LR, tv = LR.tv, st = tvState(t);
  A.drawLivingRoom(ctx, t, { tvGlow: st.state === 'freeze' ? 0.6 : st.state === 'goal' ? 1.4 : 1, flash: o.flash });
  A.drawTV(ctx, tv.x, tv.y, tv.w, tv.h, t, st);
  A.drawRouter(ctx, LR.router.x, LR.router.y, LR.router.s, { t, activity: 0.6, ledGlow: o.ledGlow || 0 });
  A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'back');
  saba(ctx, LR.chair.x, LR.chair.y);
  A.drawArmchair(ctx, LR.chair.x, LR.chair.y, 1, 'front');
  noa(ctx, LR.sofa.x, LR.sofa.y);
}
A.scene({ name: 'demo_home', start: 0, end: 60, draw(ctx, s) {
  const t = s.t;
  if (t < 6) {
    const p = A.inv(0.6, 6, t);
    A.drawTorontoStreet(ctx, t, { cam: { x: A.lerp(960, 1100, p), y: A.lerp(540, 500, p), zoom: A.lerp(1, 1.25, A.ease.inOut(p)) } });
    ctx.save(); A.camera(ctx, { x: A.lerp(960, 1100, p), y: A.lerp(540, 500, p), zoom: A.lerp(1, 1.25, A.ease.inOut(p)) });
    const q = A.STREET.at(p); A.glow(ctx, q[0], q[1], 40, '#ffc93c', 1); ctx.fillStyle = '#ffc93c'; A.ellipse(ctx, q[0], q[1], 10, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,0,255,0.5)'; ctx.lineWidth = 2; A.path(ctx, A.STREET.path, false); ctx.stroke();
    ctx.restore();
  } else if (t < 22) {
    room(ctx, t);
  } else if (t < 26) {
    const tv = A.LR.tv; ctx.save(); A.camera(ctx, { x: tv.x + tv.w / 2, y: tv.y + tv.h / 2 + 20, zoom: 2.2 }); room(ctx, t); ctx.restore();
  } else if (t < 30 || (t >= 40 && t < 46) || t >= 52) {
    const st = t >= 52 ? { state: 'goal', matchT: 1.2 + (t - 52) } : t >= 40 ? { state: 'live', matchT: t - 44.5 } : tvState(t);
    A.drawTVScreen(ctx, 0, 0, 1920, 1080, t, st);
  } else if (t < 36) {
    const L = A.routerLED(A.LR.router.x, A.LR.router.y, A.LR.router.s);
    ctx.save(); A.camera(ctx, { x: L[0] + 30, y: L[1] - 20, zoom: 3 }); room(ctx, t, { ledGlow: A.smooth(31, 35.5, t) * 2.5 }); ctx.restore();
  } else if (t < 40) {
    ctx.save(); A.camera(ctx, { x: 700, y: 440, zoom: 3 }); room(ctx, t); ctx.restore();
  } else {
    room(ctx, t, { flash: Math.max(0, 1 - Math.abs(t - 47.8) / 0.4) });
  }
} });
