// Actividad 39.1 — El plan B, desactivado pieza por pieza.
// Abre la sesión AR cuatro veces (todo / sin anchors / sin hit-test / sin las dos),
// coloca el cubo y anota la ayuda, la línea de datos, el anclaje y la posición.
// Uso: DIR=s39 node a39_1.js
const { servir, instalar, sala, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 's39';

const COMBINACIONES = [
  ['con todo', []],
  ['sin anchors', ['anchors']],
  ['sin hit-test', ['hit-test']],
  ['sin hit-test ni anchors', ['hit-test', 'anchors']],
];

(async () => {
  const { base, cerrar } = await servir(__dirname + '/' + DIR + '/dist', 4361);
  const b = await navegador();
  const filas = [];
  for (const [nombre, quitar] of COMBINACIONES) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 860 } });
    const pg = await ctx.newPage();
    const errores = []; pg.on('pageerror', e => errores.push(String(e)));
    await pg.addInitScript(instalar(sala(), { quitar }));
    await pg.goto(base + '/');
    await pg.waitForSelector('#btn-ar:not([disabled])', { timeout: 15000 });
    await pg.click('#btn-ar');
    await pg.waitForFunction(() => !!window.__ses, null, { timeout: 15000 });
    await sleep(1500); // deja que el hit-test encuentre el suelo
    const antes = await pg.evaluate(() => document.querySelector('#xr-estado').textContent);
    await pg.evaluate(() => window.__tocar());
    await sleep(900);
    const r = await pg.evaluate(() => ({
      ayuda: document.querySelector('#xr-estado').textContent,
      datos: document.querySelector('#xr-datos').textContent,
      estado: document.querySelector('#estado-ar').textContent,
      peticiones: window.__peticiones, anclas: window.__cuenta,
    }));
    const m = /anclado: (sí|no)/.exec(r.datos), p = /pos: ([^·]+)/.exec(r.datos);
    filas.push({ nombre, antes, ...r, anclado: m && m[1], posicion: p && p[1].trim(), errores });
    console.log(`\n=== ${nombre} (se quitan: ${quitar.join(', ') || 'nada'})`);
    console.log('peticiones   : ' + JSON.stringify(r.peticiones));
    console.log('estado       : ' + r.estado);
    console.log('ayuda antes  : ' + antes);
    console.log('ayuda después: ' + r.ayuda);
    console.log('datos        : ' + r.datos);
    console.log('anclas creadas/borradas: ' + r.anclas.crearAncla + '/' + r.anclas.borrarAncla + (errores.length ? ' | errores: ' + errores.join(' ; ') : ''));
    await ctx.close();
  }
  console.log('\n| Combinación | Mensaje tras tocar | ¿Anclado? | Posición |\n|---|---|---|---|');
  for (const f of filas) console.log(`| ${f.nombre} | ${f.ayuda} | ${f.anclado} | ${f.posicion} |`);
  await b.close(); await cerrar();
})();
