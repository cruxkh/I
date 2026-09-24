// Demo / test board for kits/props.js. Boards switch every 6 s (frame = t*30).
(() => {
  const bg = (k) => A.layer('prdemo_bg' + k, 1920, 1080, (g, w, h) => {
    if (k === 'room') { g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#6b3f4f'], [0.62, '#8a5a55'], [0.62, '#5a3526'], [1, '#3a2016']]); g.fillRect(0, 0, w, h);
      g.fillStyle = A.radial(g, 600, 200, 0, 1200, [[0, 'rgba(255,180,94,0.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h); return; }
    g.fillStyle = A.linear(g, 0, 0, 0, h, [[0, '#070b24'], [0.55, '#0a0f2e'], [1, '#141a4a']]); g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(41,240,255,0.10)'; g.lineWidth = 2;
    for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(960 + i * 40, 520); g.lineTo(960 + i * 260, 1080); g.stroke(); }
    for (let j = 0; j < 12; j++) { const y = 520 + Math.pow(j / 11, 2) * 560; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
  const label = (ctx, s, x, y) => A.text(ctx, s, x, y, { font: '600 24px Rubik', fill: '#9ff6ff', stroke: '#0a0f2e', lw: 6 });
  const BR = ['ILVIP', 'EMBY', 'LAGTV', 'LOADING+'], MO = ['grumpy', 'sleepy', 'shock', 'panting'];
  A.scene({ name: 'props-demo', start: 0, end: 60, draw(ctx, s) {
    const t = s.t;
    if (t < 6) { // lineup: every brand x mood
      ctx.drawImage(bg('data'), 0, 0);
      A.drawQueueSign(ctx, 960, 110, 1, { t, ticket: 347 + Math.floor(t), hang: 30 });
      BR.forEach((b, i) => MO.forEach((m, j) => {
        const x = 260 + j * 460, y = 330 + i * 200;
        A.drawBrandPacket(ctx, x - 80 + (i % 2) * 20, y + 60, 1.25, { t: t + i * 0.7 + j, brand: b, mood: m, shadow: 1, spinner: b === 'EMBY' && m === 'sleepy' ? 1 : 0, sign: b === 'ILVIP' && m === 'grumpy' ? 1 : 0 });
        if (i === 0) label(ctx, m, x + 80, 290);
      }));
      if (A.drawBit) A.drawBit(ctx, 1830, 1000, 1.25, { t, mood: 'determined', shadow: 1 });
    } else if (t < 12) { // close-ups with lipsync ranges faked
      ctx.drawImage(bg('data'), 0, 0);
      const lt = t - 6;
      A.drawBrandPacket(ctx, 560, 900, 4.2, { t, brand: 'ILVIP', mood: 'grumpy', sign: A.smooth(0.3, 1.1, lt), mouth: Math.max(0, Math.sin(t * 11)) * 0.7 * (lt % 2 > 0.8 ? 1 : 0), shadow: 1 });
      A.drawBrandPacket(ctx, 1400, 900, 4.2, { t, brand: 'EMBY', mood: 'sleepy', spinner: A.smooth(0.2, 0.6, lt), spinnerEyes: lt > 3 ? 1 : 0, shadow: 1, flip: true });
    } else if (t < 18) { // backgammon
      ctx.drawImage(bg('room'), 0, 0);
      const lt = t - 12;
      ctx.fillStyle = '#6a3a22'; ctx.fillRect(250, 820, 1420, 40); ctx.fillStyle = '#4a2616'; ctx.fillRect(250, 860, 1420, 20);
      A.drawBackgammon(ctx, 1060, 830, 2.2, { t, mode: 'board', dice: A.inv(0.3, 1.5, lt), diceVals: [6, 6], move: A.inv(2.2, 2.9, lt) });
      A.drawBackgammon(ctx, 290, 700, 1.3, { t, mode: 'case', anchor: 'handle', rot: Math.sin(t * 2.4) * 0.12 });
      A.ellipse(ctx, 290, 700, 10, 10); A.fillStroke(ctx, '#d9a57c', 3);
    } else if (t < 24) { // TV screens: old bug, switch overlay, GOTV bug
      ctx.fillStyle = '#20151c'; ctx.fillRect(0, 0, 1920, 1080);
      const scr = (x, y) => { ctx.fillStyle = A.linear(ctx, 0, y, 0, y + 248, [[0, '#3f8f4f'], [1, '#2a6a38']]); ctx.fillRect(x, y, 440, 248); ctx.strokeStyle = '#111'; ctx.lineWidth = 12; ctx.strokeRect(x - 6, y - 6, 452, 260); };
      const lt = t - 18;
      scr(120, 120); A.drawOldProviderBug(ctx, 120 + 440 - 70, 120 + 30, 0.7);
      scr(740, 120); A.drawSwitchOverlay(ctx, 740, 120, 440, 248, t, { p: A.inv(0.2, 5.2, lt) });
      scr(1360, 120); A.drawGOTVBug(ctx, 1360 + 440 - 62, 120 + 30, 0.7, { t, live: true });
      // big versions
      A.drawSwitchOverlay(ctx, 120, 480, 1040, 560, t, { p: lt < 3 ? 0.55 : 0.95 });
      A.drawGOTVBug(ctx, 1520, 640, 2.2, { t, shine: A.inv(1, 2.5, lt % 3) });
      A.drawOldProviderBug(ctx, 1520, 880, 1.6);
    } else { // queue at camera zoom
      ctx.drawImage(bg('data'), 0, 0);
      const lt = t - 24;
      A.drawQueueSign(ctx, 1300, 260, 1.4, { t, ticket: 348 });
      BR.forEach((b, i) => A.drawBrandPacket(ctx, 520 + i * 250, 860, 2, { t: t + i, brand: b, mood: lt > 3 ? 'shock' : ['grumpy', 'sleepy', 'grumpy', 'sleepy'][i], look: lt > 3 ? [0, -1] : undefined, spinner: b === 'EMBY' ? 1 : 0, sign: b === 'ILVIP' ? 1 : 0, shadow: 1 }));
      if (A.drawBit) A.drawBit(ctx, A.lerp(100, 1900, A.inv(3, 4, lt)), 700 - Math.sin(Math.PI * A.inv(3, 4, lt)) * 300, 1.6, { t, mood: 'cheeky', vel: lt > 3 && lt < 4 ? [1800, 0] : [0, 0], boost: lt > 3 && lt < 4 ? 1 : 0 });
    }
  } });
})();
