// Actividad 40.3 — Una prueba que falle antes de pasar: el escenario I (migración de IndexedDB v2 → v3),
// más dos casos que el escenario I original no cubría: el usuario que viene de la v1 (I3) y lo que ve
// sin conexión el usuario de la v2 que ya había descargado las fichas (I4).
// Uso: DIR=s40 node a40_3.js   (y DIR=v40a / DIR=v40b para las versiones rotas a propósito)
const { servir, navegador, sleep } = require('./arnes');
const DIR = process.env.DIR || 's40';

// Crea la base tal como la dejaba la versión `v` de la app (1: Sesión 33; 2: Sesiones 37-39), con datos de la demo.
const PREPARAR = async (v) => {
  await new Promise((res, rej) => { const d = indexedDB.deleteDatabase('atlas3d-progreso-db'); d.onsuccess = res; d.onerror = rej; });
  const db = await new Promise((res, rej) => {
    const p = indexedDB.open('atlas3d-progreso-db', v);
    p.onupgradeneeded = () => {
      const s = p.result.createObjectStore('progreso', { keyPath: 'modeloId' });
      s.createIndex('porFavorito', 'favorito', { unique: false }); s.createIndex('porUltimaVisita', 'ultimaVisita', { unique: false });
      if (v >= 2) p.result.createObjectStore('descargas', { keyPath: 'modeloId' });
    };
    p.onsuccess = () => res(p.result); p.onerror = () => rej(p.error);
  });
  const tiendas = v >= 2 ? ['progreso', 'descargas'] : ['progreso'];
  const tx = db.transaction(tiendas, 'readwrite');
  tx.objectStore('progreso').put({ modeloId: 'modelo-demo-1', favorito: true, ultimaVisita: 111, notaCifrada: null, notaIv: null });
  tx.objectStore('progreso').put({ modeloId: 'modelo-demo-3', favorito: false, ultimaVisita: 333, notaCifrada: null, notaIv: null });
  if (v >= 2) {
    tx.objectStore('descargas').put({ modeloId: 'modelo-demo-1', estado: 'listo' });
    tx.objectStore('descargas').put({ modeloId: 'modelo-demo-2', estado: 'listo' });
  }
  await new Promise((r) => (tx.oncomplete = r));
  db.close();
  if (v >= 2) { // la v2 había guardado las fichas con su nombre VIEJO en la caché de modelos
    const c = await caches.open('modelos-3d');
    for (const id of ['modelo-demo-1', 'modelo-demo-2']) await c.put('/modelos/' + id + '.json', new Response('{"id":"' + id + '"}', { headers: { 'Content-Type': 'application/json' } }));
  }
};
const LEER = async () => {
  const db = await new Promise((res, rej) => { const p = indexedDB.open('atlas3d-progreso-db'); p.onsuccess = () => res(p.result); p.onerror = () => rej(p.error); });
  const todo = (t) => new Promise((res) => { const r = db.transaction(t).objectStore(t).getAll(); r.onsuccess = () => res(r.result); });
  const out = { version: db.version, progreso: (await todo('progreso')).map((r) => [r.modeloId, r.favorito, r.ultimaVisita]), descargas: (await todo('descargas')).map((r) => [r.modeloId, r.estado]) };
  db.close(); return out;
};

(async () => {
  const srv = await servir(__dirname + '/' + DIR + '/dist', 4366);
  const b = await navegador();
  for (const v of [2, 1]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 900 } });
    const pg = await ctx.newPage();
    const errores = []; pg.on('pageerror', (e) => errores.push(String(e)));
    await pg.goto(srv.base + '/manifest.json'); // mismo origen, sin ejecutar la app
    await pg.evaluate(PREPARAR, v);
    console.log(`${v === 2 ? 'I1' : 'I3a'}) base v${v} preparada con identificadores de la demo`);
    await pg.goto(srv.base + '/'); await pg.waitForSelector('#visor canvas'); await sleep(1500);
    console.log(`${v === 2 ? 'I2' : 'I3b'}) tras abrir la app → ` + JSON.stringify(await pg.evaluate(LEER)));
    if (v === 2) {
      // I4: el usuario de la v2 había descargado las fichas. ¿Qué le dice la app y qué puede leer sin conexión?
      await pg.reload(); await pg.waitForSelector('#visor canvas'); await sleep(1200); // ahora el SW controla la página
      const lista = await pg.evaluate(() => [...document.querySelectorAll('.modelos-grid .disponible')].map((e) => e.closest('[data-id], article, li, .modelo-card')?.querySelector('h3, h2, strong')?.textContent?.trim() || e.textContent));
      console.log('I4a) la lista marca «disponible sin conexión» en → ' + JSON.stringify(lista));
      srv.estado.caido = true;
      await pg.reload(); await pg.waitForSelector('#visor canvas'); await sleep(1200);
      await pg.click('#tabs-modelo .tab[data-id=mvc]'); await sleep(1000);
      const det = (await pg.textContent('#pieza-detalle')).trim().replace(/\s+/g, ' ');
      console.log('I4b) SIN CONEXIÓN, ficha de MVC → ' + det.slice(0, 170));
      srv.estado.caido = false;
    }
    console.log('pageerrors: ' + JSON.stringify(errores));
    await ctx.close();
  }
  await b.close(); await srv.cerrar();
})();
