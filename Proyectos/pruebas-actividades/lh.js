// lh.js — corre Lighthouse (móvil, con la lentitud simulada por defecto) N veces sobre una carpeta servida
// localmente y escribe la tabla con la mediana. Uso: node lh.js CARPETA_DIST PUERTO N ETIQUETA [ruta]
const { servir } = require('./arnes');
const fs = require('fs'), path = require('path');
const [dist, puerto, n, etiqueta, ruta = '/'] = process.argv.slice(2);
(async () => {
  const lighthouse = (await import('lighthouse')).default;
  const chromeLauncher = await import('chrome-launcher');
  const srv = await servir(path.resolve(dist), Number(puerto));
  const filas = [];
  for (let i = 1; i <= Number(n); i++) {
    // Un perfil nuevo en cada corrida = como una ventana de incógnito (sin caché ni Service Worker previos).
    const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
    const r = await lighthouse(srv.base + ruta, { port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    await chrome.kill();
    const a = r.lhr.audits, c = r.lhr.categories;
    const fila = { corrida: i, rendimiento: Math.round(c.performance.score * 100), accesibilidad: Math.round(c.accessibility.score * 100), practicas: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      fcp: Math.round(a['first-contentful-paint'].numericValue), lcp: Math.round(a['largest-contentful-paint'].numericValue), tbt: Math.round(a['total-blocking-time'].numericValue), cls: +a['cumulative-layout-shift'].numericValue.toFixed(3) };
    const lcpNodo = (a['lcp-breakdown-insight']?.details?.items || []).find((x) => x.type === 'node');
    fila.lcpElemento = lcpNodo ? lcpNodo.selector : (a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.selector || '?');
    filas.push(fila);
    if (process.env.GUARDAR) fs.writeFileSync(`${process.env.GUARDAR}/lighthouse-${etiqueta}-${i}.html`, r.report);
    if (process.env.JSON) fs.writeFileSync(`${process.env.JSON}/lighthouse-${etiqueta}-${i}.json`, JSON.stringify(r.lhr));
    console.error(`  corrida ${i}: ${JSON.stringify(fila)}`);
  }
  const med = (k) => { const v = filas.map((f) => f[k]).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
  const cols = ['rendimiento', 'accesibilidad', 'practicas', 'seo', 'fcp', 'lcp', 'tbt', 'cls'];
  const tit = { rendimiento: 'Rend.', accesibilidad: 'Acces.', practicas: 'Buenas prác.', seo: 'SEO', fcp: 'FCP (ms)', lcp: 'LCP (ms)', tbt: 'TBT (ms)', cls: 'CLS' };
  let out = `\n### ${etiqueta}\n\n| Corrida | ${cols.map((k) => tit[k]).join(' | ')} | Elemento LCP |\n|---|${cols.map(() => '---').join('|')}|---|\n`;
  for (const f of filas) out += `| ${f.corrida} | ${cols.map((k) => f[k]).join(' | ')} | \`${f.lcpElemento}\` |\n`;
  out += `| **Mediana** | ${cols.map((k) => '**' + med(k) + '**').join(' | ')} | |\n`;
  console.log(out);
  await srv.cerrar();
})();
