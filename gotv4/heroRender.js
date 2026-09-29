// node heroRender.js <preset> '<json args>' out.png [W H crop]
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const [name, argj, out, crop] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('EXC', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'heroTest.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  await p.evaluate(([n, a]) => RENDER(n, JSON.parse(a || '[]')), [name, argj]);
  const url = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); await b.close(); console.log(out);
})();
