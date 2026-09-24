// Demo / test board for kits/datafolk.js — boards switch by time; lip-sync boards use the real film times.
(() => {
  const TAU = Math.PI * 2;
  const bg = (hue = 0) => A.layer('dfdemo_bg' + hue, 1920, 1080, (g, w, h) => {
    g.fillStyle = A.linear(g, 0, 0, 0, h, hue ? [[0, '#021421'], [0.6, '#062c3c'], [1, '#0b4a5c']] : [[0, '#070b24'], [0.55, '#0a0f2e'], [1, '#141a4a']]);
    g.fillRect(0, 0, w, h);
    const c = hue ? '41,240,255' : '41,240,255';
    g.strokeStyle = `rgba(${c},0.10)`; g.lineWidth = 2;
    for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(960 + i * 40, 520); g.lineTo(960 + i * 260, 1080); g.stroke(); }
    for (let j = 0; j < 12; j++) { const y = 520 + Math.pow(j / 11, 2) * 560; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let i = 0; i < 60; i++) { const r = A.rng(i + 5); const x = r() * w, y = r() * 480; g.fillStyle = `rgba(${i % 3 ? '41,240,255' : '255,63,164'},${0.15 + r() * 0.3})`; g.fillRect(x, y, 2 + r() * 30, 2); }
    g.fillStyle = A.radial(g, 960, 500, 0, 900, [[0, 'rgba(41,240,255,0.10)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, w, h);
  });
  const label = (ctx, s, x, y) => A.text(ctx, s, x, y, { font: '600 26px Rubik', fill: '#9ff6ff', stroke: '#0a0f2e', lw: 6 });
  const streaks = (ctx, t, n = 30, col = '41,240,255') => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const y = A.hash(i) * 1080, sp = 300 + A.hash(i + 3) * 900, x = 1920 - ((t * sp + A.hash(i + 7) * 3000) % 2400);
      ctx.fillStyle = A.linear(ctx, x, 0, x + 160, 0, [[0, `rgba(${col},0.5)`], [1, `rgba(${col},0)`]]); ctx.fillRect(x, y, 160, 2); }
    ctx.restore();
  };

  A.scene({ name: 'datafolk-demo', start: 0, end: 60, draw(ctx, s) {
    const t = s.t;
    ctx.drawImage(bg(t >= 30.5 && t < 41.5 ? 1 : 0), 0, 0);
    streaks(ctx, t);
    if (t < 8) {
      const moods = ['determined', 'panic', 'cheeky', 'joy', 'exhausted', 'squeeze'];
      moods.forEach((m, i) => {
        const x = 200 + i * 304;
        A.drawBit(ctx, x, 640, 1.8, { t: t + i * 0.37, mood: m, mouth: 0, shadow: 1, limbs: m === 'exhausted' ? 'flop' : m === 'joy' ? 'arms-up' : m === 'squeeze' ? 'push' : 'stand', wink: m === 'cheeky' ? A.smooth(3, 3.3, t) * (1 - A.smooth(4.5, 4.8, t)) : 0 });
        label(ctx, m, x, 700);
      });
      A.text(ctx, 'BIT — moods', 960, 90, { font: '700 44px Rubik', fill: '#ffc93c' });
    } else if (t < 14) {
      const lt = t - 8, mood = lt < 1.5 ? 'determined' : lt < 3 ? 'panic' : lt < 4.5 ? 'cheeky' : 'joy';
      A.drawBit(ctx, 620, 960, 5, { t, mood, mouth: Math.max(0, Math.sin(t * 9)) * 0.7 * (lt % 1.5 > 0.7 ? 1 : 0), look: [Math.sin(t * 0.9) * 0.8, Math.cos(t * 0.7) * 0.3], wink: mood === 'cheeky' ? A.smooth(3.4, 3.6, lt) : 0, shadow: 1 });
      A.drawCatPacket(ctx, 1450, 960, 2.1, { t, mood: lt < 3 ? 'bored' : lt < 4.5 ? 'grumpy' : 'shock', mouth: lt > 3 ? Math.max(0, Math.sin(t * 7)) * 0.8 : 0 });
      label(ctx, 'close-up ' + mood, 620, 60);
    } else if (t < 21) {
      const items = [
        ['run', 260, 480, { limbs: 'run', vel: [420, 0], mood: 'determined' }],
        ['fly', 760, 480, { limbs: 'fly', vel: [1100, -250], mood: 'determined' }],
        ['flop', 1260, 480, { limbs: 'flop', mood: 'exhausted' }],
        ['arms-up', 1680, 480, { limbs: 'arms-up', mood: 'joy' }],
        ['crouch', 300, 880, { limbs: 'crouch', mood: 'determined' }],
        ['push (squeeze)', 800, 880, { limbs: 'push', mood: 'squeeze' }],
        ['BOOST', 1500, 860, { limbs: 'fly', vel: [900, -700], boost: 0.6 + 0.4 * Math.sin(t * 2), mood: 'determined' }],
      ];
      for (const [n, x, y, o] of items) {
        if (n === 'fly' || n === 'BOOST') {
          const pts = []; for (let i = 0; i < 24; i++) { const u = i / 23; pts.push([x - (1 - u) * 520 * (n === 'BOOST' ? 0.8 : 1), y - 70 + (1 - u) * (n === 'BOOST' ? 400 : 110) + Math.sin(u * 6 + t * 3) * 14 * (1 - u)]); }
          A.drawBinaryTrail(ctx, pts, t, { width: 34 });
        }
        A.drawBit(ctx, x, y, 1.5, Object.assign({ t, mouth: 0, shadow: n === 'fly' || n === 'BOOST' ? 0 : 1 }, o));
        label(ctx, n, x, y + 36);
      }
    } else if (t < 30.5) {
      // JAM (real times): packets queue, Bit squeezes, Cat speaks, boost
      for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
        const seed = r * 20 + i, sc = 0.7 + r * 0.25, y = 560 + r * 150, x = 80 + i * 150 + (r % 2) * 70 + Math.sin(t * 0.5 + seed) * 4;
        if (r === 2 && i > 7) continue;
        const moods = ['bored', 'sleep', 'annoyed', 'bored', 'shock'];
        A.drawPacket(ctx, x, y, sc, { t, seed, mood: moods[seed % 5], honk: (seed % 7 === 3) ? Math.max(0, Math.sin((t - 22) * 2.2 + seed)) : 0 });
      }
      A.drawCatPacket(ctx, 1480, 930, 2.0, { t, mood: t < 25 ? 'bored' : t < 28.6 ? 'grumpy' : 'shock', arms: t > 26.5 && t < 28 ? 'point' : 'crossed' });
      let bx = A.key(t, [[21, 300], [24, 820], [28.6, 900]]), by = 930, mood = t < 24 ? 'squeeze' : 'determined', o = { t, mood, shadow: 1 };
      if (t >= 28.6) {
        const u = t - 28.6;
        if (u < 0.35) o.limbs = 'crouch';
        else { bx = 900 + (u - 0.35) * 700; by = 930 - Math.pow(u - 0.35, 1) * 600; o.limbs = 'fly'; o.vel = [700, -600]; o.boost = 1; o.shadow = 0;
          const pts = []; for (let i = 0; i < 20; i++) { const k = (1 - i / 19) * Math.min(u - 0.35, 0.8); pts.push([bx - k * 700, by + k * 600 - 70]); }
          A.drawBinaryTrail(ctx, pts, t); }
      } else if (t < 24) o.vel = [60, 0];
      A.drawBit(ctx, bx, by, 1.8, o);
      label(ctx, 'JAM test  (BIT 21.9-23.9 / 28.0-28.6, CAT 25.1-27.8)', 960, 60);
    } else if (t < 41.5) {
      // OCEAN (real times)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(120,240,255,0.25)'; ctx.lineWidth = 120; ctx.beginPath(); ctx.moveTo(0, 820); ctx.lineTo(1920, 780); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,250,255,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 762); ctx.lineTo(1920, 722); ctx.moveTo(0, 878); ctx.lineTo(1920, 838); ctx.stroke(); ctx.restore();
      const sx = A.key(t, [[30.5, 2400], [35.2, 1350, 'out'], [35.6, 1300], [36.0, 1220, 'in'], [36.4, 1290, 'out'], [41.5, 1500]]);
      const bite = A.key(t, [[34.5, 0.15], [35.6, 1, 'out'], [36.0, 0, 'in'], [41.5, 0.3]]);
      A.drawShark(ctx, sx, 520, 1.1, { t, mood: t > 36.1 ? 'dazed' : 'hungry', bite, flip: true, bandaid: t > 38.5 });
      const bx = t < 36 ? A.key(t, [[30.5, 200], [36, 760]]) : A.key(t, [[36, 760], [36.4, 560, 'out'], [41.5, 760]]);
      const by = 840 - (t > 36 && t < 36.6 ? Math.sin((t - 36) / 0.6 * Math.PI) * 80 : 0);
      const mood = t > 37.4 ? 'cheeky' : t > 32 ? 'panic' : 'determined';
      const pts = []; for (let i = 0; i < 16; i++) pts.push([bx - (15 - i) * 30, by - 60 + Math.sin(i * 0.8 + t * 5) * 5]);
      A.drawBinaryTrail(ctx, pts, t, { color: '#29f0ff' });
      A.drawBit(ctx, bx, by, 1.4, { t, mood, limbs: 'fly', vel: [900, 0], wink: t > 38.0 && t < 38.9 ? 1 : 0 });
      label(ctx, 'OCEAN test  (BIT 32.2-33.9, 37.6-38.6)', 960, 60);
    } else if (t < 46) {
      const bx = A.key(t, [[41.5, 150], [44.5, 1100]]), joy = t > 44.5;
      A.drawBit(ctx, bx, 800, 2.2, { t, mood: joy ? 'joy' : 'determined', limbs: joy ? 'arms-up' : 'run', vel: joy ? [0, 0] : [320, 0], shadow: 1 });
      label(ctx, 'LAST MILE test (BIT 41.9-43.4, 44.6-45.3)', 960, 60);
    } else if (t < 50) {
      const kinds = ['mail', 'video', 'meme', 'update', 'shop', 'photo'], moods = ['bored', 'annoyed', 'sleep', 'shock'];
      kinds.forEach((k, i) => moods.forEach((m, j) => A.drawPacket(ctx, 220 + i * 300, 260 + j * 200, 1.25, { t, kind: k, seed: i * 4 + j, mood: m, honk: k === 'video' && j === 0 ? A.smooth(46.5, 47, t) * (1 - A.smooth(48.5, 49, t)) : 0 })));
      moods.forEach((m, j) => label(ctx, m, 60, 230 + j * 200));
    } else if (t < 54.5) {
      ['bored', 'grumpy', 'shock'].forEach((m, i) => A.drawCatPacket(ctx, 330 + i * 400, 460, 1.1, { t, mood: m, mouth: 0, arms: ['crossed', 'point', 'down'][i] }));
      A.drawShark(ctx, 560, 800, 0.62, { t, mood: 'hungry', bite: 0.5 + 0.5 * Math.sin(t * 3) });
      A.drawShark(ctx, 1450, 800, 0.62, { t, mood: 'dazed', flip: true, bandaid: true });
    } else {
      // exhausted flop by the LED port, speaks 55.0-56.9, winks 56.9
      A.glow(ctx, 960, 600, 300, '#29f0ff', 0.3);
      const wink = A.smooth(56.9, 57.1, t) * (1 - A.smooth(58.3, 58.5, t));
      A.drawBit(ctx, 960, 820, 3.2, { t, mood: 'exhausted', wink, lid: t > 58.5 ? A.smooth(58.5, 59, t) : 0, shadow: 1, glow: 0.7 });
      label(ctx, 'EXHAUSTED (BIT 55.0-56.9, wink 56.9)', 960, 60);
    }
  } });
})();
