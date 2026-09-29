// node render_yt.js --frames 10,60 --prefix x   |   --range 0:1110 --workers 4 --out out/ytframes  |  --sheet a:b:n
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const out = path.resolve(__dirname, args.out || 'previews'); fs.mkdirSync(out, { recursive: true });
async function page(b) {
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('PAGE', m.text()); }); p.on('pageerror', e => console.log('PAGE EXC', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'gotv.html')); await p.evaluate(() => window.gReady); await p.evaluate(() => new Promise(r => setTimeout(r, 300))); return p;
}
const FAST = !!args.fast;
const grab = (p, f, png) => p.evaluate(async ([f, png, FAST]) => { await G.draw(f, { fast: !!FAST }); return document.getElementById('c').toDataURL(png ? 'image/png' : 'image/jpeg', 0.93); }, [f, !!args.png, FAST]);
const save = (u, file) => fs.writeFileSync(file, Buffer.from(u.split(',')[1], 'base64'));
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
  if (args.range) {
    const [a, e] = args.range.split(':').map(Number), Wk = +(args.workers || 4), pages = await Promise.all(Array.from({ length: Wk }, () => page(b)));
    let next = a, done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async p => { while (next < e) { const f = next++; save(await grab(p, f), path.join(out, String(f).padStart(5, '0') + '.jpg')); if (++done % 60 === 0) console.log(`${done}/${e - a}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`); } }));
  } else if (args.sheet) {
    const [a, e, n] = args.sheet.split(':').map(Number), p = await page(b), fr = Array.from({ length: n }, (_, i) => Math.round(a + (e - a) * i / Math.max(1, n - 1))), urls = [];
    for (const f of fr) urls.push(await grab(p, f));
    const url = await p.evaluate(async ([urls, fr]) => { const cols = Math.min(fr.length, 8), rows = Math.ceil(fr.length / cols), c = document.createElement('canvas'); c.width = 270 * cols; c.height = 480 * rows; const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height); for (let i = 0; i < urls.length; i++) { const im = new Image(); im.src = urls[i]; await im.decode(); const x = (i % cols) * 270, y = Math.floor(i / cols) * 480; g.drawImage(im, x, y, 270, 480); g.fillStyle = '#ff0'; g.font = '16px monospace'; g.fillText(`f${fr[i]} ${(fr[i] / 30).toFixed(2)}`, x + 6, y + 20); } return c.toDataURL('image/jpeg', .88); }, [urls, fr]);
    const file = path.join(out, `${args.prefix || 'ytsheet'}_${a}-${e}.jpg`); save(url, file); console.log(file);
  } else {
    const p = await page(b); for (const f of String(args.frames || 0).split(',').map(Number)) { const file = path.join(out, `${args.prefix || 'yt'}_${String(f).padStart(5, '0')}.${args.png ? 'png' : 'jpg'}`); const t0 = Date.now(); save(await grab(p, f), file); console.log(file, Date.now() - t0, 'ms'); }
  }
  await b.close();
})();
