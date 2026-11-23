# Pruebas de las actividades (Sesiones 39 a 45)

Scripts con los que se hicieron y comprobaron las actividades del Sub-bloque B. Cada `entregables/ENTREGABLES.md`
de las sesiones 39 a 45 dice qué script produjo cada salida.

## Preparación

```bash
npm install
npx playwright install chromium
```

Cada script sirve la carpeta `dist` de un proyecto que esté al lado, con el nombre que indique la variable `DIR`:

- `s39` … `s44`: el checkpoint de la sesión, sin tocar. Se descomprime `pwa-ar-objetos3d-sesionNN.zip` (está en
  `recursos/` de cada sesión) en `./sNN` y se ejecuta `npm install && npm run build`.
- `a39` … `a44`: el mismo checkpoint con los cambios de las actividades. Se copia `sNN` en `aNN`, se aplican los
  `.diff` de `entregables/codigo/` en orden (`git apply`) y se vuelve a compilar.

## Qué hace cada script

| Script | Actividad | Uso |
|---|---|---|
| `arnes.js` | común | servidor con interruptor «caído», Chromium con SwiftShader y el emulador IWER con sala sintética |
| `a39_1.js` | 39.1 | `DIR=s39 node a39_1.js` |
| `a39_2.js` | 39.2 | `DIR=a39 CAPTURAS=. node a39_2.js` (con `DIR=s39` debe fallar) |
| `a39_3.js` | 39.3 | `DIR=a39 node a39_3.js` |
| `a40_1.js` | 40.1 | `DIR=a40 CAPTURAS=. node a40_1.js` |
| `a40_2.js` | 40.2 | `DIR=a40 node a40_2.js` |
| `a40_3.js` | 40.3 | `DIR=s40 node a40_3.js` (y las versiones rotas `v40a`, `v40b`) |
| `t41.js` | 41.4, 43.4 | reconstrucción de `test_s41.js` (escenarios A–G) más H e I nuevos: `DIR=s41 node t41.js` |
| `a41_12.js` | 41.1 y 41.2 | `DIR=a41 CAPTURAS=. node a41_12.js` |
| `a41_3.js` | 41.3 | `DIR=s41 ARRASTRES=-120 SUFIJO=antes node a41_3.js` |
| `lh.js` | 42, 43, 44, 45 | `CHROME_PATH=… node lh.js CARPETA PUERTO 3 ETIQUETA` (Lighthouse móvil, mediana de N corridas) |
| `a4344_3.js` | 43.3 y 44.3 | `DIR=a43 node a4344_3.js` |
| `contar_lienzos.js` | 43.2 | `node contar_lienzos.js http://localhost:5173/ etiqueta` (con `npm run dev` abierto) |
| `raf_tras_destruir.js` | 44.2 | `node raf_tras_destruir.js http://localhost:4200/ etiqueta` (con `npm run dev` abierto) |

La lista de verificación de las sesiones 42 y 45 es `checklist-atlas.js` (carpeta `Proyectos/checklist-atlas`).
`test_s42.js` no viene en ningún zip; `checklist-atlas.js` repite sus 12 puntos y añade el 13.

## Límites

- `test_s39.js`, `test_s40.js` y `test_s41.js` tampoco vienen en los zips: la guía muestra fragmentos y la salida.
  Lo que hay aquí se reconstruyó a partir de esos fragmentos (el arnés de IWER y el evento simulado son los de la guía).
- IWER no implementa `dom-overlay`. El toque sobre un botón del overlay se emula como lo describe la especificación:
  primero `beforexrselect` y, si nadie lo cancela, un `select`.
- Las cifras de Lighthouse se tomaron en un contenedor Linux sin tarjeta gráfica (WebGL por software): sirven para
  comparar versiones entre sí, no para compararlas una a una con las de la guía.
