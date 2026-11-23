// Actividades 41.1 («Ahora no») y 41.2 (comprobarRed). Uso: DIR=a41 CAPTURAS=cap node a41_12.js
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 'a41', CAP = process.env.CAPTURAS;
const EVENTO = `window.__prompts = 0; window.__simular = (r) => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__prompts++; }; e.userChoice = Promise.resolve({ outcome: r, platform: 'web' }); window.dispatchEvent(e); return e.defaultPrevented; };`;
let fallos = 0; const ok = (c, m) => { console.log((c ? '   ✓ ' : '   ✗ FALLÓ: ') + m); if (!c) fallos++; };
(async () => {
  const srv = await servir(__dirname + '/' + DIR + '/dist', 4368);
  const b = await navegador();
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  const errores = []; pg.on('pageerror', (e) => errores.push(String(e)));
  await pg.addInitScript(EVENTO);
  const abrir = async () => { await pg.goto(srv.base + '/'); await pg.waitForSelector('#visor canvas'); await sleep(500); await pg.evaluate(() => window.__simular('dismissed')); await sleep(200); };
  const ver = () => pg.evaluate(() => ({ zona: !document.querySelector('.instalar-zona').hidden, instalar: !document.querySelector('#btn-instalar').hidden, ahoraNo: !document.querySelector('#btn-ahora-no').hidden, texto: document.querySelector('#estado-instalacion').textContent, clave: localStorage.getItem('atlas3d-instalar-pospuesta') }));
  // Captura de la franja entre el visor y «Uso sin conexión» (ahí vive la sección de instalar).
  const captura = async (nombre) => {
    if (!CAP) return;
    const caja = await pg.evaluate(() => { const a = document.querySelector('.diag-ar').getBoundingClientRect(), d = document.querySelector('.descargas-zona').getBoundingClientRect(); return { y: a.bottom + scrollY, h: d.top + scrollY + 70 - (a.bottom + scrollY) }; });
    await pg.screenshot({ path: `${CAP}/${nombre}.png`, fullPage: true, clip: { x: 0, y: caja.y, width: 412, height: caja.h } });
  };

  console.log('41.1 — «Ahora no»');
  await abrir();
  let v = await ver(); console.log('N1) llega el evento → ' + JSON.stringify(v));
  ok(v.zona && v.instalar && v.ahoraNo, 'se ven «Instalar» y «Ahora no» con su texto');
  await captura('41-1-estado-1-instalable');
  await pg.click('#btn-ahora-no'); await sleep(200);
  v = await ver(); console.log('N2) clic en «Ahora no» → ' + JSON.stringify(v));
  ok(!v.zona && v.clave, 'la sección desaparece y la decisión queda guardada');
  await captura('41-1-estado-2-pospuesta');
  await abrir(); // recargar: Chrome vuelve a mandar el evento
  v = await ver(); console.log('N3) recargar con evento (al día siguiente) → zona visible: ' + v.zona);
  ok(!v.zona, 'recargar no vuelve a insistir');
  await pg.evaluate(() => localStorage.setItem('atlas3d-instalar-pospuesta', String(Date.now() - 8 * 24 * 3600 * 1000)));
  await abrir();
  v = await ver(); console.log('N4) pasados 8 días, con evento → ' + JSON.stringify(v));
  ok(v.zona && v.instalar && v.ahoraNo && v.clave === null, 'pasados 7 días la oferta vuelve y la clave vencida se borra');
  await captura('41-1-estado-3-pasados-7-dias');
  await pg.click('#btn-instalar'); await sleep(300);
  v = await ver(); console.log('N5) «Instalar» y el usuario cancela el diálogo → ' + JSON.stringify(v));
  ok(v.zona && !v.instalar && !v.ahoraNo && /Cancelaste/.test(v.texto), 'sin evento, ni «Instalar» ni «Ahora no»; el texto de «Cancelaste» sigue (lo decide instalar.ts)');
  await captura('41-1-estado-4-cancelada');

  console.log('41.2 — comprobarRed()');
  await pg.evaluate(() => localStorage.clear());
  const banda = () => pg.evaluate(() => { const e = document.querySelector('#estado-conexion'); return e.hidden ? null : e.textContent; });
  const probar = () => pg.evaluate(async () => { const t0 = performance.now(); const m = await import(document.querySelector('script[type=module]').src); return null; }).catch(() => null);
  await pg.goto(srv.base + '/'); await pg.waitForSelector('#visor canvas'); await pg.reload(); await pg.waitForSelector('#visor canvas'); await sleep(800); // SW controlando
  console.log('R1) servidor arriba, en línea → banda: ' + (await banda()) + ' | ¿controla el SW?: ' + (await pg.evaluate(() => !!navigator.serviceWorker.controller)));
  ok((await banda()) === null, 'con el servidor arriba no hay banda');
  // Fichas descargadas: el caso trampa (la ficha está en la caché del SW).
  await pg.click('#btn-descargar'); await sleep(2500);
  console.log('R2) fichas descargadas → ' + (await pg.textContent('#estado-descarga')));
  srv.estado.caido = true;
  const t0 = Date.now();
  await pg.evaluate(() => window.dispatchEvent(new Event('online'))); // el navegador dice «en línea» (wifi sin salida)
  await pg.waitForFunction(() => !document.querySelector('#estado-conexion').hidden, null, { timeout: 8000 }).catch(() => {});
  const r3 = await banda(); console.log(`R3) SERVIDOR CAÍDO, navegador en línea → banda: ${r3} (${Date.now() - t0} ms)`);
  ok(/servidor no responde/.test(r3 || ''), 'detecta que la red no llega aunque navigator.onLine sea true y la ficha esté en caché');
  const directo = await pg.evaluate(async () => { const r = await fetch('/modelos/mvc.json').then((x) => 'respondió ' + x.status + ' (' + (x.headers.get('content-type') || '') + ')', (e) => 'error: ' + e.name); return r; });
  console.log('R4) control: la MISMA ficha sin parámetro, con el servidor caído → ' + directo + '  ← por eso no sirve para comprobar');
  await ctx.setOffline(true); await sleep(300);
  console.log('R5) sin red (offline) → banda: ' + (await banda()));
  ok(/^Sin conexión/.test((await banda()) || ''), '«no hay red» sin intentar la petición');
  srv.estado.caido = false; await ctx.setOffline(false);
  await pg.waitForFunction(() => /Volvió/.test(document.querySelector('#estado-conexion').textContent), null, { timeout: 8000 }).catch(() => {});
  console.log('R6) vuelve todo → banda: ' + (await banda()));
  ok(/Volvió/.test((await banda()) || ''), 'al volver, «Volvió la conexión»');
  console.log('pageerrors: ' + JSON.stringify(errores));
  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await srv.cerrar(); process.exit(fallos ? 1 : 0);
})();
