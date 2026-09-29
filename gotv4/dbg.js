const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('EXC', e.message)); await p.goto('file://' + path.resolve(__dirname, 'gotv.html')); await p.evaluate(() => window.gReady);
for (const f of [290, 340, 340]) { const r = await p.evaluate(async f => { await G.draw(f, { fast: true }); const c = document.getElementById('c').getContext('2d'); const d = c.getImageData(540, 700, 1, 1).data; return [f, d[0], d[1], d[2], HOST ? 'host' : '']; }, f); console.log(JSON.stringify(r)); }
await b.close(); })();
