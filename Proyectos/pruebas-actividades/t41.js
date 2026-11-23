// t41.js — reconstrucción de test_s41.js (escenarios A a G de la guía de la Sesión 41) a partir de su
// descripción y de su salida. El evento beforeinstallprompt se simula (Chromium no lo dispara solo).
// Uso: DIR=s41 node t41.js        Variables extra: SOLO=ABCD (escenarios a correr), DOBLE=1 (escenario H nuevo).
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 's41', SOLO = process.env.SOLO || 'ABCDEFGHI';
const EVENTO = `
  window.__prompts = 0;
  window.__simular = (resultado) => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = async () => { window.__prompts++; if (e.__usado) throw new DOMException('prompt() ya se llamó para este evento', 'InvalidStateError'); e.__usado = true; };
    e.userChoice = Promise.resolve({ outcome: resultado, platform: 'web' });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  };`;
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('   ✗ FALLÓ: ' + m); } };
(async () => {
  const srv = await servir(__dirname + '/' + DIR + '/dist', 4367);
  const b = await navegador();
  const errores = [];
  async function pagina({ standalone = false, ua, temprano = false } = {}) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, ...(ua ? { userAgent: ua } : {}) });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errores.push(String(e)));
    await pg.addInitScript(EVENTO);
    // I: el evento llega en DOMContentLoaded: los módulos ya se ejecutaron, pero React aún no ha dibujado ni se ha suscrito.
    if (temprano) await pg.addInitScript(`document.addEventListener('DOMContentLoaded', () => { window.__temprano = window.__simular('accepted'); });`);
    if (standalone) await pg.addInitScript(`{ const mm = window.matchMedia.bind(window); window.matchMedia = (q) => q.includes('standalone') ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q); }`);
    await pg.goto(srv.base + '/'); await pg.waitForSelector('#visor canvas'); await sleep(600);
    const ver = () => pg.evaluate(() => ({ boton: !document.querySelector('#btn-instalar').hidden, texto: document.querySelector('#estado-instalacion').textContent, prompts: window.__prompts }));
    return { ctx, pg, ver };
  }
  let p, v;
  if (/[ABCD]/.test(SOLO)) {
    p = await pagina();
    v = await p.ver(); console.log('A1) sin evento → botón visible: ' + v.boton + ' | texto: ' + v.texto); ok(!v.boton, 'sin evento no hay botón');
    const dp = await p.pg.evaluate(() => window.__simular('accepted')); await sleep(200);
    v = await p.ver(); console.log('B1) llega beforeinstallprompt → defaultPrevented: ' + dp + ' | botón visible: ' + v.boton + ' | texto: ' + v.texto);
    ok(dp, 'debe llamar a preventDefault'); ok(v.boton, 'con evento hay botón');
    await p.pg.click('#btn-instalar'); await sleep(300);
    v = await p.ver(); console.log('C1) clic en «Instalar» → prompt() llamado ' + v.prompts + ' vez | botón visible: ' + v.boton);
    ok(v.prompts === 1, 'prompt() una sola vez'); ok(!v.boton, 'el botón no sobrevive al uso del evento');
    await p.pg.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await sleep(200);
    v = await p.ver(); console.log('C2) llega appinstalled → texto: ' + v.texto);
    await p.ctx.close();
    p = await pagina();
    await p.pg.evaluate(() => window.__simular('dismissed')); await sleep(200);
    await p.pg.click('#btn-instalar'); await sleep(300);
    v = await p.ver(); console.log('D1) usuario cancela → botón visible: ' + v.boton + ' | texto: ' + v.texto);
    ok(!v.boton, 'tras cancelar no hay botón hasta que Chrome vuelva a ofrecer'); ok(/Cancelaste/.test(v.texto), 'texto de «Cancelaste…»');
    await p.pg.evaluate(() => window.__simular('dismissed')); await sleep(200);
    v = await p.ver(); console.log('D2) Chrome vuelve a ofrecer la instalación → botón visible: ' + v.boton); ok(v.boton, 'un evento nuevo recupera el botón');
    await p.ctx.close();
  }
  if (SOLO.includes('H')) {
    // H (nuevo, actividad 41.4): un mismo evento NO puede abrir dos diálogos. Se cancela el diálogo y, sin que
    // Chrome mande un evento nuevo, se intenta pulsar «Instalar» otra vez (si el botón se dejó ver).
    p = await pagina();
    await p.pg.evaluate(() => window.__simular('dismissed')); await sleep(200);
    await p.pg.click('#btn-instalar'); await sleep(300);
    const visible = (await p.ver()).boton;
    if (visible) { await p.pg.click('#btn-instalar'); await sleep(300); }
    v = await p.ver(); console.log('H1) cancelar y volver a pulsar sin evento nuevo → botón visible tras cancelar: ' + visible + ' | prompt() llamado ' + v.prompts + ' veces');
    ok(!visible && v.prompts === 1, 'un evento ya usado no debe ofrecer el botón ni llamar dos veces a prompt()');
    await p.ctx.close();
  }
  if (SOLO.includes('I')) {
    p = await pagina({ temprano: true });
    v = await p.ver(); const dpT = await p.pg.evaluate(() => window.__temprano);
    console.log('I1) (nuevo, actividad 43.4) el evento llega antes del primer dibujo → defaultPrevented: ' + dpT + ' | botón visible: ' + v.boton + ' | texto: ' + v.texto);
    ok(dpT && v.boton, 'un evento que llega antes de que la interfaz se suscriba no se pierde');
    await p.ctx.close();
  }
  if (SOLO.includes('E')) {
    p = await pagina({ standalone: true });
    await p.pg.evaluate(() => window.__simular('accepted')); await sleep(200);
    v = await p.ver(); console.log('E1) modo standalone → botón visible: ' + v.boton + ' | texto: ' + v.texto); ok(!v.boton, 'instalada: sin botón');
    await p.ctx.close();
  }
  if (SOLO.includes('F')) {
    p = await pagina({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
    v = await p.ver(); console.log('F1) iPhone → botón visible: ' + v.boton + ' | texto: ' + v.texto); ok(!v.boton && /Compartir/.test(v.texto), 'iPhone: pasos manuales');
    await p.ctx.close();
  }
  if (SOLO.includes('G')) {
    p = await pagina();
    const banda = () => p.pg.evaluate(() => { const e = document.querySelector('#estado-conexion'); return e.hidden ? null : e.textContent; });
    console.log('G1) en línea → banda: ' + (await banda()));
    await p.ctx.setOffline(true); await sleep(400);
    const g2 = await banda(); console.log('G2) se corta la red → banda: ' + g2); ok(/Sin conexión/.test(g2 || ''), 'banda sin conexión');
    await p.pg.click('#tabs-modelo .tab[data-id=capas]'); await sleep(500);
    console.log('G3) sin red se cambia de modelo → «' + (await p.pg.textContent('#modelo-resumen')).slice(0, 50) + '…»');
    await p.ctx.setOffline(false); await sleep(400);
    const g4 = await banda(); console.log('G4) vuelve la red → banda: ' + g4); ok(/Volvió/.test(g4 || ''), 'banda de vuelta');
    await sleep(3300); const g5 = await banda(); console.log('G5) 3,3 s después → banda: ' + g5); ok(g5 === null, 'la banda se va sola');
    await p.ctx.close();
  }
  console.log('pageerrors: ' + JSON.stringify(errores));
  console.log('RESULTADO: ' + (fallos ? 'hay ' + fallos + ' fallos' : 'todo en orden'));
  await b.close(); await srv.cerrar(); process.exit(fallos ? 1 : 0);
})();
