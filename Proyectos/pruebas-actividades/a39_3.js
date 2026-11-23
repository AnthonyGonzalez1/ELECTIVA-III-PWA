// Actividad 39.3 — Quitar el cubo. Prueba con el arnés de IWER.
// IWER no implementa dom-overlay, así que un toque sobre un botón del overlay se emula como lo describe la
// especificación de WebXR DOM Overlays: primero llega «beforexrselect» al elemento; si nadie lo cancela,
// el mismo toque llega a la sesión como «select». Uso: DIR=a39 node a39_3.js
const { servir, instalar, sala, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a39';

// Toque «de teléfono» sobre un botón del overlay.
// El orden entre el «click» del botón y el «select» de la sesión no lo fija la especificación: se prueban los dos.
const TOQUE_BOTON = `window.__tocarBoton = async (sel, clickPrimero = false) => {
  const b = document.querySelector(sel);
  const ev = new Event('beforexrselect', { bubbles: true, cancelable: true });
  b.dispatchEvent(ev);
  if (clickPrimero) b.click();
  if (!ev.defaultPrevented) await window.__tocar(); // nadie lo canceló: el toque también es un «select»
  if (!clickPrimero) b.click();
  return ev.defaultPrevented;
};`;
// Para la segunda corrida: se ignora cualquier oyente de beforexrselect (como si se hubiera olvidado escribirlo).
const SIN_BEFOREXRSELECT = `{ const a0 = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function (t, ...r) { if (t === 'beforexrselect') return; return a0.call(this, t, ...r); }; }`;
// Para la carrera: createAnchor tarda 600 ms en resolverse.
const ANCLA_LENTA = `{ const c1 = XRFrame.prototype.createAnchor; XRFrame.prototype.createAnchor = function (...a) { const p = c1.apply(this, a); return new Promise((res, rej) => setTimeout(() => p.then(res, rej), 600)); }; }`;

let fallos = 0;
const ok = (c, m) => { console.log((c ? '   ✓ ' : '   ✗ FALLÓ: ') + m); if (!c) fallos++; };

async function abrir(b, base, { extra = '', quitar = [] } = {}) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 860 } });
  const pg = await ctx.newPage();
  const errores = []; pg.on('pageerror', e => errores.push(String(e)));
  await pg.addInitScript(instalar(sala(), { quitar, extra: TOQUE_BOTON + extra }));
  await pg.goto(base + '/');
  await pg.waitForSelector('#btn-ar:not([disabled])');
  await pg.click('#btn-ar');
  await pg.waitForFunction(() => !!window.__ses);
  await pg.evaluate(() => window.__mirar(0, 1.6, 1.0)); await sleep(1200);
  const leer = () => pg.evaluate(() => ({ ayuda: document.querySelector('#xr-estado').textContent, datos: document.querySelector('#xr-datos').textContent, anclas: { ...window.__cuenta }, botonOculto: document.querySelector('#btn-quitar-cubo').hidden }));
  return { ctx, pg, leer, errores };
}

(async () => {
  const { base, cerrar } = await servir(__dirname + '/' + DIR + '/dist', 4363);
  const b = await navegador();

  console.log('Q1) colocar y quitar el cubo (con beforexrselect)');
  let { ctx, pg, leer, errores } = await abrir(b, base);
  ok((await leer()).botonOculto, 'antes de colocar, «Quitar cubo» está oculto');
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  let r = await leer(); console.log('    colocado: ' + r.datos);
  ok(/fase: colocado/.test(r.datos) && /anclado: sí/.test(r.datos) && !r.botonOculto, 'colocado, anclado y con el botón visible');
  const cancelado = await pg.evaluate(() => window.__tocarBoton('#btn-quitar-cubo')); await sleep(800);
  r = await leer(); console.log('    tras «Quitar cubo»: ' + r.ayuda + '\n    ' + r.datos + '\n    anclas creadas/borradas: ' + r.anclas.crearAncla + '/' + r.anclas.borrarAncla);
  ok(cancelado, 'beforexrselect fue cancelado por la app');
  ok(/fase: listo/.test(r.datos) && /pos: —/.test(r.datos) && /anclado: no/.test(r.datos), 'el cubo desaparece, sin ancla, y la fase vuelve a «listo» (la retícula ya está sobre el suelo)');
  ok(r.anclas.crearAncla === 1 && r.anclas.borrarAncla === 1, 'se borró el ancla que se había creado (1/1)');
  ok(r.botonOculto, 'el botón vuelve a ocultarse');
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  r = await leer();
  ok(/fase: colocado/.test(r.datos), 'un toque nuevo lo vuelve a colocar');
  await pg.evaluate(() => window.__mirar(0, 1.6, 1.0));
  await pg.evaluate(() => window.__tocarBoton('#btn-quitar-cubo')); await sleep(200);
  await pg.evaluate(() => window.__mirar(0, 1.6, -0.6)); await sleep(1200); // mirar al techo: no hay superficie
  r = await leer();
  ok(/fase: buscando/.test(r.datos), 'si la retícula no ve superficie, la fase es «buscando»');
  ok(errores.length === 0, 'sin errores en la página');
  await ctx.close();

  for (const clickPrimero of [true, false]) {
    console.log(`Q2${clickPrimero ? 'a' : 'b'}) SIN beforexrselect; orden: ${clickPrimero ? 'click del botón y luego select' : 'select y luego click del botón'}`);
    ({ ctx, pg, leer, errores } = await abrir(b, base, { extra: SIN_BEFOREXRSELECT }));
    await pg.evaluate(() => window.__tocar()); await sleep(800);
    const pos1 = (/pos: \([^)]*\)/.exec((await leer()).datos) || [])[0];
    const c2 = await pg.evaluate((cp) => window.__tocarBoton('#btn-quitar-cubo', cp), clickPrimero); await sleep(800);
    r = await leer(); console.log('    tras «Quitar cubo»: ' + r.datos + '\n    anclas creadas/borradas: ' + r.anclas.crearAncla + '/' + r.anclas.borrarAncla);
    ok(!c2, 'nadie canceló beforexrselect');
    console.log('    observado: fase ' + (/fase: (\w+)/.exec(r.datos) || [])[1] + ', posición ' + ((/pos: \([^)]*\)/.exec(r.datos) || [])[0] || 'ninguna') + ' (antes ' + pos1 + ')');
    if (clickPrimero) ok(/fase: colocado/.test(r.datos) && r.anclas.crearAncla === 2, 'el cubo se quita y el select lo vuelve a colocar con un ancla nueva: el botón «no hace nada»');
    else ok(/fase: listo/.test(r.datos) && r.anclas.crearAncla === 2 && r.anclas.borrarAncla === 2, 'el select recoloca (ancla nueva) y el click lo quita: funciona, pero se crea y se borra un ancla de más');
    await ctx.close();
  }

  console.log('Q3) carrera: «Quitar cubo» mientras la creación del ancla está pendiente (createAnchor tarda 600 ms)');
  ({ ctx, pg, leer, errores } = await abrir(b, base, { extra: ANCLA_LENTA }));
  await pg.evaluate(() => window.__tocar()); // el ancla se pide aquí y llegará 600 ms después
  await pg.evaluate(() => window.__tocarBoton('#btn-quitar-cubo'));
  await sleep(1200);
  r = await leer(); console.log('    ' + r.datos + '\n    anclas creadas/borradas: ' + r.anclas.crearAncla + '/' + r.anclas.borrarAncla);
  ok(/anclado: no/.test(r.datos) && /pos: —/.test(r.datos), 'el ancla tardía no «resucita» el cubo');
  ok(r.anclas.crearAncla === r.anclas.borrarAncla, 'el ancla que llegó tarde se borró (creadas = borradas)');
  await ctx.close();

  console.log('Q4) sin hit-test: quitar y volver a colocar con el plan B');
  ({ ctx, pg, leer, errores } = await abrir(b, base, { quitar: ['hit-test'] }));
  r = await leer(); ok(/fase: colocado/.test(r.datos) && !r.botonOculto, 'sin hit-test el cubo empieza colocado a 1,5 m y el botón está visible');
  await pg.evaluate(() => window.__tocarBoton('#btn-quitar-cubo')); await sleep(800);
  r = await leer(); console.log('    ' + r.ayuda + '\n    ' + r.datos);
  ok(/fase: listo/.test(r.datos) && /pos: —/.test(r.datos), 'quitado: fase «listo», sin cubo');
  await pg.evaluate(() => window.__tocar()); await sleep(800);
  r = await leer(); ok(/fase: colocado/.test(r.datos), 'un toque lo coloca delante de la mirada');
  ok(errores.length === 0, 'sin errores en la página');
  await ctx.close();

  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await cerrar(); process.exit(fallos ? 1 : 0);
})();
