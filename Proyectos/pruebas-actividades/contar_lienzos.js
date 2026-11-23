// Cuenta los <canvas> dentro de #visor en una URL (servidor de desarrollo). Uso: node contar_lienzos.js URL ETIQUETA
const { navegador, sleep } = require('./arnes');
(async () => {
  const [url, etiqueta] = process.argv.slice(2);
  const b = await navegador();
  const pg = await (await b.newContext({ viewport: { width: 412, height: 900 } })).newPage();
  const errores = []; pg.on('pageerror', (e) => errores.push(String(e)));
  await pg.goto(url); await pg.waitForSelector('#visor canvas', { timeout: 60000 }); await sleep(2500);
  const n = await pg.$$eval('#visor canvas', (cs) => cs.length);
  const contextos = await pg.evaluate(() => [...document.querySelectorAll('#visor canvas')].map((c) => (c.getContext('webgl2') || c.getContext('webgl')) ? 'webgl' : '?'));
  console.log(`${etiqueta}: lienzos en #visor = ${n} ${JSON.stringify(contextos)} | pageerrors: ${JSON.stringify(errores)}`);
  await b.close();
})();
