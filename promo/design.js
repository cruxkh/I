// Shared look. Everything in the film is flat vector with a thick dark outline (A.OUTLINE) + soft light glows.
const D = {
  bg: '#0E0B2E', violet: '#2B1B6B', indigo: '#1B1550', gold: '#FFC24A', goldHi: '#FFE08A', cyan: '#38D9F5', magenta: '#FF4F9A',
  cream: '#FFF6E0', ink: '#1a1330', green: '#3DDC84', red: '#FF4A3D', blue: '#3D7BFF', orange: '#FF8A3D', teal: '#1FB6A6',
};
// brand-neutral "app tile": rounded square with a colour gradient and a label; used everywhere for apps/channels
D.tile = (ctx, x, y, w, h, c1, c2, label, o = {}) => {
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale);
  A.rrect(ctx, -w / 2, -h / 2, w, h, o.r ?? 26); ctx.fillStyle = A.linear(ctx, 0, -h / 2, 0, h / 2, [[0, c1], [1, c2]]); ctx.fill();
  ctx.lineWidth = o.lw ?? 6; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
  if (label) A.text(ctx, label, 0, 0, { font: o.font || '800 ' + Math.round(h * 0.28) + 'px Rubik', fill: o.fill || '#fff', stroke: o.stroke || null, lw: 6, dir: o.dir || 'ltr' });
  ctx.restore();
};
D.LIVE = (ctx, x, y, s = 1, t = 0) => { // red LIVE badge with blinking dot
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); A.rrect(ctx, -62, -24, 124, 48, 14); ctx.fillStyle = D.red; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = A.OUTLINE; ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.beginPath(); ctx.arc(-34, 0, 9, 0, A.TAU); ctx.fill();
  A.text(ctx, 'LIVE', 12, 2, { font: '800 30px Rubik', fill: '#fff' }); ctx.restore();
};
D.starburst = (ctx, x, y, r0, r1, n, rot, fill) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r0 : r1; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
