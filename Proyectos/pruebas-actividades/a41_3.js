// Actividad 41.3 — rótulos que no se pisen: misma vista (Microservicios, mismo arrastre) antes y después.
// Uso: DIR=s41 ARRASTRES=0,80,160 CAPTURAS=cap SUFIJO=antes node a41_3.js
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 's41', CAP = process.env.CAPTURAS || 'cap', SUF = process.env.SUFIJO || DIR;
const ARR = (process.env.ARRASTRES || '0').split(',').map(Number);
const PIEZA = process.env.PIEZA || '';
(async () => {
  const srv = await servir(__dirname + '/' + DIR + '/dist', 4370);
  const b = await navegador();
  for (const dx of ARR) {
    const pg = await (await b.newContext({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 1 })).newPage();
    await pg.goto(srv.base + '/'); await pg.waitForSelector('#visor canvas'); await sleep(500);
    await pg.click('#tabs-modelo .tab[data-id=microservicios]'); await sleep(800);
    if (PIEZA) { await pg.click(`#chips-piezas .chip[data-id=${PIEZA}]`); await sleep(500); }
    const c = await (await pg.$('#visor canvas')).boundingBox();
    const x0 = c.x + c.width / 2, y0 = c.y + c.height * 0.8;
    if (dx) { await pg.mouse.move(x0, y0); await pg.mouse.down(); for (let i = 1; i <= 10; i++) { await pg.mouse.move(x0 + dx * i / 10, y0); await sleep(16); } await pg.mouse.up(); }
    await sleep(2500); // que pase la inercia de los controles
    await pg.locator('#visor').screenshot({ path: `${CAP}/41-3-${SUF}-dx${dx}${PIEZA ? '-' + PIEZA : ''}.png` });
    await pg.context().close();
  }
  await b.close(); await srv.cerrar();
})();
