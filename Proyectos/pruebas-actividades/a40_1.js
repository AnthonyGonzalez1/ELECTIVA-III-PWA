// Actividad 40.1 — el cuarto modelo (hexagonal) en el visor: pestaña, piezas, leyenda, ficha y captura.
// Uso: DIR=a40 CAPTURAS=cap node a40_1.js
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a40', CAP = process.env.CAPTURAS;
(async () => {
  const { base, cerrar } = await servir(__dirname + '/' + DIR + '/dist', 4364);
  const b = await navegador();
  const pg = await (await b.newContext({ viewport: { width: 760, height: 1100 }, deviceScaleFactor: 1 })).newPage();
  const errores = []; pg.on('pageerror', e => errores.push(String(e)));
  await pg.goto(base + '/'); await pg.waitForSelector('#visor canvas'); await sleep(800);
  console.log('pestañas → ' + JSON.stringify(await pg.$$eval('#tabs-modelo .tab', ts => ts.map(t => t.dataset.id))));
  await pg.click('#tabs-modelo .tab[data-id=hexagonal]'); await sleep(1500);
  const r = await pg.evaluate(() => ({ resumen: document.querySelector('#modelo-resumen').textContent, piezas: [...document.querySelectorAll('#chips-piezas .chip')].map(c => c.textContent.trim()), leyenda: document.querySelector('#leyenda').textContent.trim().replace(/\s+/g, ' '), detalle: document.querySelector('#pieza-detalle').textContent.trim().slice(0, 160) }));
  console.log('hexagonal: ' + r.piezas.length + ' piezas → ' + JSON.stringify(r.piezas));
  console.log('leyenda → ' + r.leyenda); console.log('resumen → ' + r.resumen); console.log('detalle → ' + r.detalle);
  if (CAP) await pg.locator('.visor-zona').screenshot({ path: CAP + '/40-1-hexagonal.png' });
  await pg.click('#chips-piezas .chip[data-id=dominio]'); await sleep(1200);
  console.log('pieza «Núcleo de dominio» → ' + (await pg.textContent('#pieza-detalle')).trim().replace(/\s+/g, ' '));
  if (CAP) await pg.locator('.visor-zona').screenshot({ path: CAP + '/40-1-hexagonal-nucleo.png' });
  console.log('pageerrors: ' + JSON.stringify(errores));
  await b.close(); await cerrar();
})();
