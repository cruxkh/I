// Real channel / service logos (transparent PNGs from the public tv-logos collection), preloaded before the first frame.
(() => {
  const FILES = { netflix: 'netflix.png', disney: 'disney-plus.png', prime: 'amazon-prime-video.png', appletv: 'apple-tv-plus.png', hbo: 'hbo-max.png', hulu: 'hulu.png', paramount: 'paramount-plus.png', discovery: 'discovery-plus.png', espn: 'espn-plus.png',
    sport5: '5sport-il.png', sport5live: '5live-il.png', sport5plus: '5plus-il.png', sport5gold: '5gold-il.png', sport5stars: '5stars-il.png', hotzone: 'hot-zone-il.png', sport5_4k: '5sport4k-il.png', sport1: 'sport1-il.png', sport2: 'sport2-il.png', sport3: 'sport3-il.png', sport4: 'sport4-il.png', one: 'one-il.png', one2: 'one2-il.png',
    kan11: 'kan11-il.png', keshet12: 'keshet12-il.png', reshet13: 'reshet13-il.png', ch14: 'channel14-il.png', ch9: 'channel9-il.png', i24: 'i24-news-il.png', hot: 'hot3-il.png', yes: 'yes-israel-il.png', zoom: 'zoom-il.png' };
  const IMGS = {};
  V.logoNames = Object.keys(FILES);
  V.logosReady = Promise.all(Object.entries(FILES).map(([k, f]) => new Promise(res => { const im = new Image(); im.onload = () => { IMGS[k] = im; res(); }; im.onerror = () => res(); im.src = 'assets/logos/' + f; })));
  // V.logoImg(name) -> HTMLImageElement (natural size, transparent PNG) or null
  V.logoImg = k => IMGS[k] || null;
  // draw a real logo centred at (x,y) fitted inside maxW x maxH (keeps aspect). opts {alpha, rot, glow(colour), shadow}
  V.drawLogo = (ctx, k, x, y, maxW, maxH, o = {}) => {
    const im = IMGS[k]; if (!im) return null; const s = Math.min(maxW / im.width, maxH / im.height), w = im.width * s, h = im.height * s;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.globalAlpha = (ctx.globalAlpha || 1) * (o.alpha ?? 1);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowBlur ?? 40; } else if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,10,40,.55)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12; }
    ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); return { w, h };
  };
  // logo on a glass card: V.logoCard(ctx, 'netflix', x, y, w, h, {tint, rot, scale, alpha, pad})
  V.logoCard = (ctx, k, x, y, w, h, o = {}) => {
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale); ctx.globalAlpha = (ctx.globalAlpha || 1) * (o.alpha ?? 1);
    V.glass(ctx, -w / 2, -h / 2, w, h, o.r ?? h * .22, { tint: o.tint || '#7FA8FF', alpha: o.glassAlpha ?? .28, shadow: 40 });
    const pad = o.pad ?? .2; V.drawLogo(ctx, k, 0, 0, w * (1 - pad), h * (1 - pad), { shadow: false }); ctx.restore();
  };
})();
