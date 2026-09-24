// Character sheet / test reel for kits/family.js — `node render.js --html tools/test_family.html --sheet 0:1799:24 --prefix family`
(() => {
  const bg = (ctx) => {
    const g = A.layer('fam_bg', 1920, 1080, (c, w, h) => {
      c.fillStyle = A.linear(c, 0, 0, 0, h, [[0, '#6b3f4f'], [0.62, '#8a5a55'], [0.62, '#5a3a3a'], [1, '#3a2530']]); c.fillRect(0, 0, w, h);
      c.fillStyle = A.radial(c, 300, 200, 0, 1100, [[0, 'rgba(255,180,94,0.35)'], [1, 'rgba(255,180,94,0)']]); c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1;
      for (let y = 0; y < h * 0.62; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    });
    ctx.drawImage(g, 0, 0);
  };
  const label = (ctx, s, x, y, size = 26) => A.text(ctx, s, x, y, { font: `700 ${size}px Rubik`, fill: '#fff4d6', stroke: 'rgba(20,10,30,0.8)', lw: 6 });
  const title = (ctx, s) => A.text(ctx, s, 960, 44, { font: '700 36px Rubik', fill: '#ffd21f', stroke: '#1a1330', lw: 8 });
  // placeholder armchair (seat 250 wide at seat point) to check Saba's fit
  const chair = (ctx, x, y, s, layer) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (layer === 'back') {
      A.rrect(ctx, -150, -300, 300, 330, 60); A.fillStroke(ctx, '#7a3b3b', 5);
      A.rrect(ctx, -125, -20, 250, 60, 20); A.fillStroke(ctx, '#944848', 5);
      ctx.fillStyle = '#4a2a20'; ctx.fillRect(-130, 60, 16, 90); ctx.fillRect(114, 60, 16, 90);
    } else {
      A.rrect(ctx, -170, -60, 50, 130, 22); A.fillStroke(ctx, '#8a4242', 5);
      A.rrect(ctx, 120, -60, 50, 130, 22); A.fillStroke(ctx, '#8a4242', 5);
      A.rrect(ctx, -125, 30, 250, 40, 12); A.fillStroke(ctx, '#7a3b3b', 5);
    }
    ctx.restore();
  };
  const floorY = 900;

  A.scene({
    name: 'family_demo', start: 0, end: 60, draw(ctx, s) {
      const t = s.t;
      bg(ctx);
      if (t < 5) {
        title(ctx, 'SABA — poses (sit / rise / stand / jump)');
        chair(ctx, 300, 700, 1, 'back');
        A.drawSaba(ctx, 300, 700, 1, { t, pose: 'sit', mood: 'neutral', mouth: 0 });
        chair(ctx, 300, 700, 1, 'front');
        label(ctx, 'sit · neutral', 300, 960);
        A.drawSaba(ctx, 720, floorY - 150, 1, { t, pose: 'rise', rise: 0.5, mood: 'eager', gesture: 'fists', mouth: 0 });
        label(ctx, 'rise .5 · eager · fists', 720, 960);
        A.drawSaba(ctx, 1150, floorY, 1, { t, pose: 'stand', mood: 'tense', gesture: 'point', mouth: 0 });
        label(ctx, 'stand · tense · point', 1150, 960);
        A.drawSaba(ctx, 1620, floorY, 1, { t, pose: 'jump', mood: 'joy', mouth: 0 });
        label(ctx, 'jump · joy · armsUp', 1620, 960);
      } else if (t < 6.9) {
        title(ctx, 'SABA — moods');
        const moods = [['neutral', 'none'], ['eager', 'fists'], ['tense', 'none'], ['horror', 'headHands'], ['joy', 'armsUp']];
        moods.forEach(([md, g], i) => { const x = 220 + i * 370; A.drawSaba(ctx, x, 1300, 1.45, { t, pose: 'stand', mood: md, gesture: g, mouth: 0 }); label(ctx, md + ' · ' + g, x, 1010); });
      } else if (t < 10.4) {
        title(ctx, 'SABA lip-sync (saba1) — eager, sit');
        chair(ctx, 760, 1000, 1.9, 'back');
        A.drawSaba(ctx, 760, 1000, 1.9, { t, pose: 'sit', mood: 'eager', gesture: t < 8.5 ? 'point' : 'fists', gestureFrom: 'point', gestureK: A.inv(8.4, 8.9, t), look: [0.6, -0.1], lean: 0.3 });
        chair(ctx, 760, 1000, 1.9, 'front');
        label(ctx, 'mouth=' + A.mouth('SABA', t).toFixed(2), 1500, 300, 40);
      } else if (t < 12.5) {
        title(ctx, 'NOA lip-sync (noa1) — amused, sit, mug');
        A.drawNoa(ctx, 900, 880, 2.1, { t, pose: 'sit', mood: 'amused', gesture: 'mug', look: [-0.5, 0], flip: true });
        label(ctx, 'mouth=' + A.mouth('NOA', t).toFixed(2), 1500, 300, 40);
      } else if (t < 15.2) {
        const r = A.ease.inOut(A.inv(12.8, 14.6, t));
        title(ctx, 'SABA rise 0→1 (saba2) · eager → fists');
        chair(ctx, 760, 700, 1.15, 'back');
        A.drawSaba(ctx, 760, 700, 1.15, { t, pose: 'rise', rise: r, mood: 'eager', gesture: 'fists', gestureFrom: 'grip', gestureK: A.inv(13.4, 14.2, t), look: [0.7, -0.2] });
        chair(ctx, 760, 700, 1.15, 'front');
        label(ctx, 'rise=' + r.toFixed(2), 1500, 300, 40);
      } else if (t < 17.5) {
        title(ctx, 'SABA horror (saba3) · headHands');
        A.drawSaba(ctx, 900, 1250, 1.7, { t, pose: 'stand', mood: 'horror', gesture: 'headHands', gestureFrom: 'fists', gestureK: A.inv(15.0, 15.5, t) });
      } else if (t < 20) {
        title(ctx, 'NOA crouch · reach (router at floor) · focused (noa2)');
        ctx.fillStyle = '#2b2233'; A.rrect(ctx, 1260, 820, 230, 80, 16); ctx.fill(); ctx.strokeStyle = '#1a1330'; ctx.lineWidth = 5; ctx.stroke();
        for (let i = 0; i < 4; i++) A.glow(ctx, 1300 + i * 40, 850, 20, '#39ff9a', 0.6 + 0.4 * Math.sin(t * 9 + i));
        A.drawNoa(ctx, 1000, floorY, 1.5, { t, pose: 'crouch', mood: 'focused', gesture: 'reach', look: [0.6, 0.6], reachTo: [190, -40] });
      } else if (t < 26) {
        title(ctx, 'NOA — poses & gestures');
        const L = [['stand', 'neutral', 'none'], ['sit', 'amused', 'mug'], ['crouch', 'focused', 'reach'], ['stand', 'amused', 'shrug'], ['stand', 'joy', 'cheer']];
        L.forEach(([p, md, g], i) => { const x = 220 + i * 370; A.drawNoa(ctx, x, p === 'sit' ? floorY - 100 : floorY, 1.2, { t, pose: p, mood: md, gesture: g, mouth: 0 }); label(ctx, `${p} · ${md} · ${g}`, x, 960); });
      } else if (t < 30) {
        title(ctx, 'NOA — moods');
        const moods = ['neutral', 'amused', 'focused', 'joy', 'proud'];
        moods.forEach((md, i) => { const x = 220 + i * 370; A.drawNoa(ctx, x, 1400, 2.4, { t, pose: 'stand', mood: md, mouth: 0 }); label(ctx, md, x, 1010); });
      } else if (t < 40) {
        title(ctx, 'SABA gesture blends (gestureFrom/gestureK)');
        const seq = ['none', 'fists', 'point', 'headHands', 'armsUp', 'grip', 'none'];
        const u = (t - 30) / 10 * (seq.length - 1), i = Math.min(seq.length - 2, Math.floor(u)), k = A.smooth(0.2, 0.8, u - i);
        A.drawSaba(ctx, 600, floorY, 1.2, { t, pose: 'stand', mood: 'neutral', gesture: seq[i + 1], gestureFrom: seq[i], gestureK: k, mouth: 0 });
        label(ctx, `${seq[i]} → ${seq[i + 1]}  k=${k.toFixed(2)}`, 600, 980);
        const moods = ['neutral', 'eager', 'tense', 'horror', 'joy', 'neutral'];
        const v = (t - 30) / 10 * (moods.length - 1), j = Math.min(moods.length - 2, Math.floor(v)), q = A.smooth(0.2, 0.8, v - j);
        A.drawNoa(ctx, 1350, floorY, 1.3, { t, pose: 'stand', mood: ['neutral', 'amused', 'focused', 'joy', 'proud', 'neutral'][j + 1], moodFrom: ['neutral', 'amused', 'focused', 'joy', 'proud', 'neutral'][j], moodK: q, gesture: ['none', 'shrug', 'reach', 'cheer', 'none', 'none'][j + 1], gestureFrom: ['none', 'shrug', 'reach', 'cheer', 'none', 'none'][j], gestureK: q, mouth: 0, flip: true });
      } else if (t < 47.5) {
        title(ctx, 'SABA jump arc + scarfWave · NOA cheer');
        const ph = ((t - 40) % 1.4) / 1.4, air = Math.sin(Math.PI * ph);
        const sq = ph < 0.08 ? 0.15 : ph > 0.92 ? 0.12 : 0;
        A.drawSaba(ctx, 700, floorY, 1.1, { t, pose: ph < 0.06 || ph > 0.94 ? 'stand' : 'jump', air, mood: 'joy', gesture: 'armsUp', squash: sq, scarfWave: 1, mouth: 0.6 + 0.3 * Math.sin(t * 8) });
        A.drawNoa(ctx, 1300, floorY, 1.1, { t, pose: 'stand', mood: 'joy', gesture: 'cheer', mouth: 0.5, flip: true });
      } else if (t < 51) {
        title(ctx, 'SABA joy lip-sync (saba4) + NOA hug');
        const hug = A.smooth(47.6, 48.4, t);
        A.drawNoa(ctx, 1080, floorY - 60 * hug, 1.3, { t, pose: 'stand', mood: 'joy', hug, flip: true, mouth: 0 });
        A.drawSaba(ctx, 760, floorY, 1.3, { t, pose: 'stand', mood: 'joy', gesture: 'armsUp', scarfWave: 0.6, look: [0.6, 0] });
      } else if (t < 53.5) {
        title(ctx, 'NOA proud lip-sync (noa3)');
        A.drawNoa(ctx, 960, 1350, 2.6, { t, pose: 'stand', mood: 'proud', look: [0.7, 0.3] });
      } else {
        title(ctx, 'flip / scale / TV-light rim test');
        A.drawSaba(ctx, 500, floorY, 0.8, { t, pose: 'stand', mood: 'neutral', flip: true, rimColor: '#9ff5d0', light: [1, -0.3], rimA: 0.7 });
        A.drawNoa(ctx, 800, floorY, 0.8, { t, pose: 'stand', mood: 'neutral', rimColor: '#9ff5d0', light: [1, -0.3], rimA: 0.7 });
        A.drawSaba(ctx, 1200, floorY, 0.45, { t, pose: 'stand', mood: 'joy', gesture: 'armsUp' });
        A.drawNoa(ctx, 1450, floorY, 0.45, { t, pose: 'stand', mood: 'amused', gesture: 'shrug' });
        A.drawSaba(ctx, 1700, floorY, 0.3, { t, pose: 'stand', mood: 'eager' });
      }
    }
  });
  A.noSubs = t => false;
})();
