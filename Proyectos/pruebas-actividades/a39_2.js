// Actividad 39.2 — Una retícula con significado. Caso nuevo de la prueba: una pared en la sala.
// La sala tiene el suelo (y = 0) y una PARED a 1,5 m delante, mirando hacia el usuario.
// Uso: DIR=a39 node a39_2.js   (con DIR=s39 se ve que la versión original coloca el cubo en la pared)
const { servir, instalar, sala, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a39';
const CAPTURAS = process.env.CAPTURAS || '';

// Pared: el «frente» de un plano es su -Y local. Un giro de -90° sobre X lleva -Y a +Z (hacia el usuario).
const PARED = { uuid: '11111111-0000-4000-8000-000000000002', semanticLabel_META: 'WALL_FACE',
  locatable_META: { orientation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, position: { x: 0, y: 1.5, z: -1.5 } },
  bounded2D_META: { offset: { x: -3, y: -1.5 }, extent: { width: 6, height: 3 } } };

let fallos = 0;
const ok = (c, m) => { console.log((c ? '   ✓ ' : '   ✗ FALLÓ: ') + m); if (!c) fallos++; };

(async () => {
  const { base, cerrar } = await servir(__dirname + '/' + DIR + '/dist', 4362);
  const b = await navegador();
  const ctx = await b.newContext({ viewport: { width: 760, height: 760 } });
  const pg = await ctx.newPage();
  const errores = []; pg.on('pageerror', e => errores.push(String(e)));
  await pg.addInitScript(instalar(sala(PARED)));
  await pg.goto(base + '/');
  await pg.waitForSelector('#btn-ar:not([disabled])');
  await pg.click('#btn-ar');
  await pg.waitForFunction(() => !!window.__ses);
  const leer = () => pg.evaluate(() => ({ ayuda: document.querySelector('#xr-estado').textContent, datos: document.querySelector('#xr-datos').textContent, anclas: { ...window.__cuenta } }));

  console.log('K1) mirando 34° hacia abajo: el rayo choca primero con la pared');
  await pg.evaluate(() => window.__mirar(0, 1.6, 0.6)); await sleep(1200);
  let r = await leer(); console.log('    ' + r.ayuda + '\n    ' + r.datos);
  ok(/superficie: inclinada/.test(r.datos), 'la superficie bajo la retícula es «inclinada»');
  if (CAPTURAS) await pg.screenshot({ path: CAPTURAS + '/39-2-pared-naranja.png' });
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  r = await leer(); console.log('    tras tocar: ' + r.datos);
  ok(!/fase: colocado/.test(r.datos), 'tocar sobre la pared NO coloca el cubo');
  ok(r.anclas.crearAncla === 0, 'no se crea ningún ancla en la pared');

  console.log('K2) mirando 57° hacia abajo: el rayo llega al suelo antes que a la pared');
  await pg.evaluate(() => window.__mirar(0, 1.6, 1.0)); await sleep(1200);
  r = await leer(); console.log('    ' + r.ayuda + '\n    ' + r.datos);
  ok(/superficie: horizontal/.test(r.datos) && /fase: listo/.test(r.datos), 'el suelo es «horizontal» y la fase pasa a «listo»');
  if (CAPTURAS) await pg.screenshot({ path: CAPTURAS + '/39-2-suelo-verde.png' });
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  r = await leer(); console.log('    tras tocar: ' + r.datos);
  ok(/fase: colocado/.test(r.datos) && /anclado: sí/.test(r.datos), 'tocar sobre el suelo coloca y ancla el cubo');
  const y = Number((/pos: \(([-\d.]+), ([-\d.]+)/.exec(r.datos) || [])[2]);
  ok(Math.abs(y - (-1.4)) < 0.05, `el centro del cubo queda a 20 cm del suelo (y = ${y}, suelo en -1,6 respecto a la cabeza)`);
  if (CAPTURAS) await pg.screenshot({ path: CAPTURAS + '/39-2-colocado.png' });

  console.log('K3) volver a apuntar a la pared con el cubo ya colocado');
  await pg.evaluate(() => window.__mirar(0, 1.6, 0.6)); await sleep(1000);
  const antes = (/pos: \([^)]*\)/.exec((await leer()).datos) || [])[0];
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  r = await leer();
  ok((/pos: \([^)]*\)/.exec(r.datos) || [])[0] === antes, 'un toque con la retícula naranja no recoloca el cubo (' + antes + ')');
  ok(errores.length === 0, 'sin errores en la página ' + (errores.length ? JSON.stringify(errores) : ''));
  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await cerrar(); process.exit(fallos ? 1 : 0);
})();
