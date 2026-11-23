// Actividad 44.2: pega en la consola el fragmento de la guía y lee cuántas veces se pide un cuadro de
// animación DESPUÉS de destruir la aplicación. Uso: node raf_tras_destruir.js URL ETIQUETA
const { navegador, sleep } = require('./arnes');
(async () => {
  const [url, etiqueta] = process.argv.slice(2);
  const b = await navegador();
  const pg = await (await b.newContext({ viewport: { width: 412, height: 900 } })).newPage();
  const consola = []; pg.on('console', (m) => consola.push(m.text()));
  await pg.goto(url, { timeout: 120000 }); await pg.waitForSelector('#visor canvas', { timeout: 120000 }); await sleep(2000);
  // El fragmento de la guía, tal cual:
  await pg.evaluate(`let n = 0; const o = requestAnimationFrame;
requestAnimationFrame = (f) => { n++; return o(f); };
__atlas.destruir();
setTimeout(() => console.log("llamadas:", n), 700);`);
  await sleep(1200);
  console.log(`${etiqueta} → ${consola.filter((t) => t.startsWith('llamadas:')).join(' ')} | lienzos que quedan: ${await pg.$$eval('canvas', (c) => c.length)}`);
  await b.close();
})();
