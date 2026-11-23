// arnes.js — arnés común para las pruebas de las actividades (Sesiones 39 a 45).
// Sirve la carpeta dist de un proyecto, abre Chromium (SwiftShader) y, si se pide,
// instala el emulador IWER con una sala sintética (como el arnés de test_s39.js de la guía).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const IWER = fs.readFileSync(require.resolve('iwer/build/iwer.min.js'), 'utf8');
const SEM = fs.readFileSync(path.join(path.dirname(require.resolve('iwer/build/iwer.min.js')), '../../@iwer/sem/build/iwer-sem.min.js'), 'utf8');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Servidor estático con interruptor «caído» (corta las conexiones, también las del Service Worker). */
function servir(dist, port) {
  const estado = { caido: false, peticiones: [] };
  const srv = http.createServer((q, r) => {
    if (estado.caido) { q.socket.destroy(); return; }
    let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || p.endsWith('/')) p += 'index.html';
    estado.peticiones.push(p);
    const f = path.join(dist, p);
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); r.end(d); } });
  });
  return new Promise(res => srv.listen(port, () => res({ estado, cerrar: () => new Promise(c => { srv.closeAllConnections?.(); srv.close(c); }), base: 'http://localhost:' + port })));
}

// Sala sintética mínima: un suelo de 6 × 6 m en y = 0 (igual que en la guía de la Sesión 39).
const SUELO = { uuid: '11111111-0000-4000-8000-000000000001', semanticLabel_META: 'FLOOR',
  locatable_META: { orientation: { x: 1, y: 0, z: 0, w: 0 }, position: { x: 0, y: 0, z: 0 } },
  bounded2D_META: { offset: { x: -3, y: -3 }, extent: { width: 6, height: 6 } } };
const sala = (...entidades) => JSON.stringify({ type: 'scene', version: 1, spatialEntities: [SUELO, ...entidades] });

/** Script que instala IWER (y la sala si `salaJSON`). `quitar` elimina funciones de la petición de sesión. */
const instalar = (salaJSON, { quitar = [], extra = '' } = {}) => IWER + '\n' + SEM + `
;(() => {
  const dev = new IWER.XRDevice(IWER.metaQuest3);
  dev.installRuntime({ forceInstall: true });
  ${salaJSON ? `dev.installSEM(IWER_SEM.SyntheticEnvironmentModule); dev.sem.loadEnvironment(${salaJSON});` : ''}
  window.__dev = dev;
  window.__mirar = (x, y, cabeceo) => { dev.position.set(x, y, 0); dev.quaternion.set(Math.sin(-cabeceo / 2), 0, 0, Math.cos(cabeceo / 2)); };
  window.__mirar(0, 1.6, 0.6);
  window.__cuenta = { crearAncla: 0, borrarAncla: 0 };
  { const c0 = XRFrame.prototype.createAnchor; if (c0) XRFrame.prototype.createAnchor = function (...a) { window.__cuenta.crearAncla++; return c0.apply(this, a).then((anc) => { const d0 = anc.delete.bind(anc); anc.delete = () => { window.__cuenta.borrarAncla++; return d0(); }; return anc; }); }; }
  const QUITAR = ${JSON.stringify(quitar)};
  const rs = navigator.xr.requestSession.bind(navigator.xr);
  navigator.xr.requestSession = async (modo, op = {}) => {
    const filtra = (l) => (l || []).filter((f) => !QUITAR.includes(f));
    const pedidas = { requiredFeatures: op.requiredFeatures, optionalFeatures: op.optionalFeatures };
    const o2 = { ...op, requiredFeatures: filtra(op.requiredFeatures), optionalFeatures: filtra(op.optionalFeatures) };
    // Si la app exige una función que este «dispositivo» no tiene, el navegador real responde NotSupportedError.
    if ((op.requiredFeatures || []).some((f) => QUITAR.includes(f))) { window.__peticiones = (window.__peticiones || []).concat([{ pedidas, resultado: 'NotSupportedError' }]); throw new DOMException('no disponible en este dispositivo', 'NotSupportedError'); }
    const s = await rs(modo, o2);
    if (QUITAR.length) { const ef = (s.enabledFeatures || []).filter((f) => !QUITAR.includes(f)); Object.defineProperty(s, 'enabledFeatures', { get: () => ef }); if (QUITAR.includes('hit-test')) s.requestHitTestSource = undefined; }
    window.__peticiones = (window.__peticiones || []).concat([{ pedidas, resultado: 'ok', concedidas: s.enabledFeatures }]);
    window.__ses = s; return s;
  };
  window.__tocar = async () => { const c = dev.controllers.right; c.updateButtonValue('trigger', 1); await new Promise(r => setTimeout(r, 100)); c.updateButtonValue('trigger', 0); await new Promise(r => setTimeout(r, 150)); };
  window.__dedo = (tipo, id, x, y) => document.querySelector('#xr-overlay').dispatchEvent(new PointerEvent(tipo, { pointerId: id, clientX: x, clientY: y, bubbles: true }));
  ${extra}
})();`;

async function navegador() {
  return chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { servir, instalar, sala, SUELO, navegador, sleep };
