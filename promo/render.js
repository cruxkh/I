// Frame renderer: headless Chromium draws the canvas, frames come back as JPEG/PNG.
//   node render.js --frames 0,150,300 [--html index.html] [--out previews] [--prefix name] [--scale 0.5]
//   node render.js --range 0:1800 --workers 4 --out out/frames      (full render, jpg)
//   node render.js --sheet 600:900:12 --prefix s3 [--html ...]      (contact sheet: 12 frames between 600 and 900 -> one PNG)
// Console errors from the page are printed (prefixed PAGE).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const html = path.resolve(__dirname, args.html || 'index.html');
const out = path.resolve(__dirname, args.out || 'previews');
const prefix = args.prefix || 'f';
const scale = parseFloat(args.scale || (args.range ? 1 : 0.5));
fs.mkdirSync(out, { recursive: true });

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('PAGE', m.type(), m.text()); });
  p.on('pageerror', e => console.log('PAGE EXC', e.message));
  await p.goto('file://' + html);
  await p.evaluate(() => Promise.all(['300 20px Rubik','500 20px Rubik','700 20px Rubik','900 20px Rubik','20px Secular','400 20px Fredoka','700 20px Fredoka','20px Bangers'].map(f => document.fonts.load(f, 'אבג abc'))));
  await p.evaluate(() => new Promise(r => setTimeout(r, 300)));
  return p;
}
const grab = (p, f, fmt, sc) => p.evaluate(([f, fmt, sc]) => {
  A.renderFrame(f);
  let c = document.getElementById('c');
  if (sc !== 1) { const d = document.createElement('canvas'); d.width = 1920 * sc; d.height = 1080 * sc; d.getContext('2d').drawImage(c, 0, 0, d.width, d.height); c = d; }
  return c.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.93);
}, [f, fmt, sc]);
const save = (url, file) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));

(async () => {
  const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--disable-web-security'] });
  if (args.range) {
    const [a, b] = args.range.split(':').map(Number), W = parseInt(args.workers || 4);
    const pages = await Promise.all(Array.from({ length: W }, () => page(browser)));
    let next = a, done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async p => {
      while (next < b) {
        const f = next++;
        save(await grab(p, f, 'jpg', scale), path.join(out, String(f).padStart(5, '0') + '.jpg'));
        if (++done % 60 === 0) console.log(`${done}/${b - a} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
      }
    }));
  } else if (args.sheet) {
    const [a, b, n] = args.sheet.split(':').map(Number); const p = await page(browser);
    const frames = Array.from({ length: n }, (_, i) => Math.round(a + (b - a) * i / Math.max(1, n - 1)));
    const urls = []; for (const f of frames) urls.push(await grab(p, f, 'jpg', 0.25));
    const url = await p.evaluate(([urls, frames]) => new Promise(async res => {
      const cols = 4, rows = Math.ceil(urls.length / cols), c = document.createElement('canvas'); c.width = 480 * cols; c.height = 290 * rows;
      const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < urls.length; i++) {
        const im = new Image(); im.src = urls[i]; await im.decode();
        const x = (i % cols) * 480, y = Math.floor(i / cols) * 290; g.drawImage(im, x, y, 480, 270);
        g.fillStyle = '#ff0'; g.font = '16px monospace'; g.fillText(`f${frames[i]} t=${(frames[i] / 30).toFixed(2)}`, x + 4, y + 284);
      }
      res(c.toDataURL('image/jpeg', 0.9));
    }), [urls, frames]);
    const file = path.join(out, `${prefix}_sheet_${a}-${b}.jpg`); save(url, file); console.log(file);
  } else {
    const p = await page(browser); const t0 = Date.now();
    const frames = String(args.frames || '0').split(',').map(Number);
    for (const f of frames) { const file = path.join(out, `${prefix}_${String(f).padStart(5, '0')}.png`); save(await grab(p, f, 'png', scale), file); console.log(file); }
    console.log(`avg ${((Date.now() - t0) / frames.length).toFixed(0)} ms/frame (incl. PNG encode)`);
  }
  await browser.close();
})();
