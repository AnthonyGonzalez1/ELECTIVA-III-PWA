// Actividades 43.3 y 44.3 — «Visitado N veces» en cada tarjeta. Uso: DIR=a43 node a4344_3.js
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a43';
let fallos = 0; const ok = (c, m) => { console.log((c ? '   ✓ ' : '   ✗ FALLÓ: ') + m); if (!c) fallos++; };
(async () => {
  const srv = await servir(__dirname + '/' + DIR + '/dist', 4371);
  const b = await navegador();
  const pg = await (await b.newContext({ viewport: { width: 412, height: 900 } })).newPage();
  const errores = []; pg.on('pageerror', (e) => errores.push(String(e)));
  await pg.goto(srv.base + '/'); await pg.waitForSelector('.modelo-card'); await sleep(800);
  const leer = () => pg.$$eval('.modelo-card', (cs) => Object.fromEntries(cs.map((c) => [c.dataset.id, c.querySelector('.visitas')?.textContent])));
  let v = await leer(); console.log('V1) al abrir → ' + JSON.stringify(v));
  ok(Object.values(v).every((t) => t === 'Visitado 0 veces'), 'todas empiezan en 0');
  for (let i = 0; i < 3; i++) { await pg.click('.modelo-card[data-id="mvc"] .btn-visitar'); await sleep(400); }
  await pg.click('.modelo-card[data-id="capas"] .btn-visitar'); await sleep(400);
  v = await leer(); console.log('V2) 3 clics en MVC y 1 en Capas → ' + JSON.stringify(v));
  ok(v.mvc === 'Visitado 3 veces' && v.capas === 'Visitado 1 vez' && v.microservicios === 'Visitado 0 veces', 'cuenta por tarjeta (y «1 vez» en singular)');
  await pg.reload(); await pg.waitForSelector('.modelo-card'); await sleep(800);
  v = await leer(); console.log('V3) tras recargar → ' + JSON.stringify(v));
  ok(v.mvc === 'Visitado 3 veces' && v.capas === 'Visitado 1 vez', 'el contador sobrevive a la recarga (vive en IndexedDB)');
  ok(errores.length === 0, 'sin errores en la página ' + JSON.stringify(errores));
  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await srv.cerrar(); process.exit(fallos ? 1 : 0);
})();
