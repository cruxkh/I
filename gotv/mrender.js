// node mrender.js --mode mascot|stickers|one|st1 --t 1.2 --w 1600 --h 900 --out previews/x.png [--pose zap] [--name arrow] [--s 3] [--cols 4]
const { chromium } = require('playwright'); const path = require('path');
const a = Object.fromEntries(process.argv.slice(2).reduce((r, v, i, arr) => v.startsWith('--') ? r.concat([[v.slice(2), arr[i + 1]]]) : r, []));
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('PAGE', m.text()); }); p.on('pageerror', e => console.log('PAGE EXC', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'mtest.html')); await p.evaluate(() => window.gReady); await p.waitForTimeout(200);
  const opt = Object.assign({}, a); ['t','s','cols','tOut','t0'].forEach(k => { if (opt[k] != null) opt[k] = +opt[k]; }); if (opt.look && opt.look.startsWith('{')) opt.look = JSON.parse(opt.look);
  const t0 = Date.now();
  const url = await p.evaluate(([m, W, H, t, o]) => { T[m](W, H, t, o); return document.getElementById('c').toDataURL('image/png'); }, [a.mode || 'mascot', +(a.w || 1600), +(a.h || 900), +(a.t || 1.5), opt]);
  require('fs').writeFileSync(path.resolve(__dirname, a.out || 'previews/m_test.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('ok', Date.now() - t0, 'ms'); await b.close();
})();
