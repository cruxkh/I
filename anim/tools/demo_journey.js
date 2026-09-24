// Demo for kits/journey.js — cycles through every background.
(() => {
  const seg = (name, start, end, draw) => A.scene({ name, start, end, draw });
  const lbl = (ctx, s) => A.text(ctx, s, 30, 40, { font: '600 26px Rubik', align: 'left', fill: 'rgba(255,255,255,0.7)' });
  // 0-3 wide panorama
  seg('wide', 0, 3, (ctx, s) => { A.drawTelAviv(ctx, s.t, { cam: { x: 1920, y: 1080, zoom: A.lerp(0.5, 0.56, s.p) } }); lbl(ctx, 'TLV wide'); });
  // 3-6 zoom to stadium
  seg('stad', 3, 6, (ctx, s) => {
    const k = A.ease.inOut(A.clamp(s.lt / 1.5));
    const c = { x: A.lerp(1100, 620, k), y: A.lerp(1400, 1650, k), zoom: A.lerp(1.0, 2.2, k) };
    A.drawTelAviv(ctx, s.t, { cam: c, roar: 0.7 }); lbl(ctx, 'TLV stadium');
  });
  // 6-9 mast + packet stream
  seg('mast', 6, 9, (ctx, s) => {
    const k = A.ease.inOut(A.clamp(s.lt / 2));
    const c = { x: A.lerp(1090, 1500, k), y: A.lerp(1270, 1050, k), zoom: A.lerp(1.9, 1.1, k) };
    A.drawTelAviv(ctx, s.t, { cam: c, broadcast: 1 });
    ctx.save(); A.camera(ctx, c); A.drawPacketStream(ctx, A.TLV.launchPath, s.t, { head: A.clamp(s.lt / 1.5), count: 60 }); ctx.restore();
    lbl(ctx, 'TLV mast');
  });
  seg('close', 9, 12, (ctx, s) => { A.drawStadiumClose(ctx, s.t, { roar: s.lt > 1.2 ? 1 : 0.3 }); lbl(ctx, 'stadium close'); });
  seg('tunnel', 12, 18, (ctx, s) => {
    const jam = A.smooth(14.5, 15.5, s.t);
    A.drawDataTunnel(ctx, s.t, { speed: A.lerp(1, 0.15, jam), z: s.lt * A.lerp(6, 1, jam), jam }); lbl(ctx, 'tunnel');
  });
  seg('ocean', 18, 23, (ctx, s) => {
    A.drawOceanFloor(ctx, s.t, { scroll: s.lt * 900 });
    A.drawRouteMap(ctx, 1380, 40, 500, 280, s.t, { p: s.p, km: Math.round(s.p * 11000) });
    lbl(ctx, 'ocean');
  });
  seg('map', 23, 26, (ctx, s) => {
    ctx.fillStyle = '#061426'; ctx.fillRect(0, 0, 1920, 1080);
    A.drawRouteMap(ctx, 160, 90, 1600, 900, s.t, { p: s.p, km: Math.round(s.p * 11000) });
  });
})();
