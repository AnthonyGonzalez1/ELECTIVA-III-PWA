// Actividad 40.2 — aviso «agranda el modelo para leer los nombres». Prueba con IWER.
// Coloca el modelo de Capas lejos (≈2,3 m) a escala 0,25, comprueba el aviso, pellizca para agrandarlo
// y comprueba que el aviso desaparece. Uso: DIR=a40 node a40_2.js
const { servir, instalar, sala, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a40';
let fallos = 0; const ok = (c, m) => { console.log((c ? '   ✓ ' : '   ✗ FALLÓ: ') + m); if (!c) fallos++; };
(async () => {
  const { base, cerrar } = await servir(__dirname + '/' + DIR + '/dist', 4365);
  const b = await navegador();
  const pg = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
  const errores = []; pg.on('pageerror', e => errores.push(String(e)));
  await pg.addInitScript(instalar(sala()));
  await pg.goto(base + '/'); await pg.waitForSelector('#btn-ar:not([disabled])');
  await pg.click('#tabs-modelo .tab[data-id=capas]');
  await pg.click('#btn-ar'); await pg.waitForFunction(() => !!window.__ses);
  const leer = () => pg.evaluate(() => ({ ayuda: document.querySelector('#xr-estado').textContent, datos: document.querySelector('#xr-datos').textContent }));
  const px = (d) => Number((/letra: (\d+) px/.exec(d) || [])[1]);
  for (const [nombre, cabeceo] of [['lejos (≈2,3 m)', 0.6], ['cerca (≈1,0 m)', 1.0]]) {
    await pg.evaluate((c) => window.__mirar(0, 1.6, c), cabeceo); await sleep(1200);
    await pg.evaluate(() => window.__tocar()); await sleep(2500);
    const r = await leer();
    console.log(`${nombre}, escala 0,25 → letra ${px(r.datos)} px | ${r.ayuda}`);
  }
  let r = await leer();
  ok(/Agranda el modelo/.test(r.ayuda), 'a escala 0,25 aparece el aviso (' + px(r.datos) + ' px)');
  // Pellizco (cerca, ≈1 m): dos dedos que se separan de 80 a 280 px (factor 3,5 → la escala llega casi al máximo).
  await pg.evaluate(async () => { const d = window.__dedo, s = (ms) => new Promise(r => setTimeout(r, ms));
    d('pointerdown', 1, 166, 500); d('pointerdown', 2, 246, 500); await s(50);
    for (let i = 1; i <= 10; i++) { d('pointermove', 1, 166 - i * 10, 500); d('pointermove', 2, 246 + i * 10, 500); await s(30); }
    d('pointerup', 1, 66, 500); d('pointerup', 2, 346, 500); });
  await sleep(1500);
  r = await leer(); console.log('tras pellizcar → ' + r.datos);
  ok(!/Agranda el modelo/.test(r.ayuda) && px(r.datos) >= 12, 'agrandado: el aviso desaparece (' + px(r.datos) + ' px, ' + (/escala: [\d.]+/.exec(r.datos) || [''])[0] + ')');
  ok(errores.length === 0, 'sin errores en la página');
  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await cerrar(); process.exit(fallos ? 1 : 0);
})();
