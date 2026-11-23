# Sesión 44 · Actividades y entregables

Angular y PWA: el Atlas 3D con componentes, servicios y señales.
Autor: Anthony Alejandro Gonzalez Sanchez · Electiva III – PWA · UPTC

Base de trabajo: checkpoint `pwa-ar-objetos3d-sesion44.zip` (ya corregido, sin los `.js` sueltos en `src/`). Scripts
en `Proyectos/pruebas-actividades/`.

---

## Actividad 1 · Mide las tres versiones (individual)

Compilaciones de las sesiones 42, 43 y 44 servidas en local, tres corridas de Lighthouse por versión (móvil, perfil
nuevo en cada corrida), las tres en la misma sesión de trabajo. Corridas completas en
`salidas/43-44-lighthouse-tres-versiones.md`.

**Mis medianas:**

| | Rendimiento | FCP | LCP | TBT |
|---|---|---|---|---|
| S42, sin framework | **53** | 754 ms | **4671 ms** | 3625 ms |
| S43, React | 49 | 798 ms | 5800 ms | 4406 ms |
| S44, Angular (visor diferido) | 46 | **626 ms** | 7049 ms | **3101 ms** |

**Las de la guía (sección 8):**

| | Rendimiento | FCP | LCP | TBT |
|---|---|---|---|---|
| S42, sin framework | 86 | 1704 ms | 2256 ms | 455 ms |
| S43, React | 94 | 2234 ms | 2371 ms | 132 ms |
| S44, Angular en un archivo | 75 | 1810 ms | 2342 ms | 995 ms |
| S44, Angular diferido | 79 | 1722 ms | 2773 ms | 620 ms |

**Qué coincide y qué no.** Coinciden tres direcciones. Angular con el visor diferido tiene **el peor LCP** de las tres:
el elemento más grande depende de un archivo que llega después. React tiene el FCP más lento de las dos versiones
con framework, porque su HTML llega vacío. Y diferir el visor le da a Angular el mejor FCP entre los frameworks; en
mi equipo, incluso mejor que la versión sin framework (626 contra 754 ms), porque lo primero que se descarga es un
archivo de 232 kB sin Three.js. **No coincide el orden del rendimiento ni el del TBT.** En la guía React gana y su
TBT es bajísimo (132 ms); en mi equipo React tiene el peor TBT y la versión sin framework gana en rendimiento. La
razón probable es la misma de la Sesión 43: sin tarjeta gráfica, WebGL corre en la CPU, la inicialización de Three.js
es una tarea enorme y pesa más que cualquier diferencia entre frameworks. Angular diferido sale con el menor TBT
porque esa tarea queda partida en dos y una parte cae fuera de la ventana que mide Lighthouse. Los LCP absolutos
(4,7 a 7 s) también reflejan el equipo lento, no las versiones.

---

## Actividad 2 · Rompe la limpieza del visor (en parejas)

Se comentó `this.visor()?.destruir();` en `visor.service.ts` (`codigo/44-2-sin-destruir.diff`), se levantó
`npm run dev` (ng serve) y se pegó en la consola el fragmento de la guía, que cuenta las llamadas a
`requestAnimationFrame` después de `__atlas.destruir()` (`salidas/44-2-raf.txt`, script `raf_tras_destruir.js`):

| Versión | Llamadas en 700 ms | Lienzos en la página |
|---|---|---|
| **Sin** `this.visor()?.destruir()` | **43** | 0 |
| Con la línea restaurada | 1 | 0 |

La guía reporta 42 y 0. Las 43 llamadas equivalen al bucle del visor pidiendo un cuadro tras otro (unos 60 por
segundo). La única llamada con la línea restaurada es probablemente un último cuadro que alguien pidió mientras la
aplicación se desmontaba; no se repite.

En las dos corridas quedan **0 lienzos**: Angular quita del documento el HTML del componente, así que el lienzo ya
no se ve. Sin `destruir()` el bucle sigue dibujando sobre un lienzo que nadie ve, gastando CPU y GPU. Mirando la
página no hay forma de notarlo.

**¿Por qué en Angular hizo falta construir una prueba para verlo?** Porque Angular no tiene un equivalente de
StrictMode que monte, desmonte y vuelva a montar cada componente en desarrollo. En React ese doble montaje dejaba
dos lienzos a la vista y el defecto se veía solo. En Angular el servicio se crea una vez y solo se destruye cuando se
destruye la aplicación, algo que en uso normal casi no pasa. Además, el síntoma (un bucle huérfano) no deja nada
visible. La única forma de verlo es provocar la destrucción a propósito (`__atlas.destruir()`) y medir algo que el
defecto cambie, como las llamadas a `requestAnimationFrame`.

---

## Actividad 3 · Un servicio nuevo: el contador de visitas (individual)

**Código** (`codigo/44-3-contador-visitas-angular.diff`):

- `db.ts`: **la misma línea de la Sesión 43** (campo opcional `visitas` y `visitas = (visitas ?? 0) + 1` en
  `marcarModeloVisto`). El archivo es idéntico en las versiones de React y de Angular, así que el cambio se copió tal
  cual.
- `catalogo.ts`: en `Tarjeta`, `protected readonly visitas = computed(() => this.progreso()?.visitas ?? 0);`
- `tarjeta.html`: «Visitado {{ visitas() }} {{ visitas() === 1 ? "vez" : "veces" }}».
- `ProgresoService` **no cambia**: después de `marcarVisto` recarga la señal `progreso`, y el `computed` se actualiza.

Prueba (`salidas/44-3-contador-angular.txt`, mismo script que en React): empieza en 0, cuenta 3 y 1 por tarjeta y
sobrevive a la recarga. La compilación no dejó archivos `.js` en `src/`.

**Dónde vive el dato y por qué:** en el registro de progreso de IndexedDB, no en una señal propia de la tarjeta. Una
señal local sería tan corta de escribir, pero se reiniciaría al recargar y duplicaría lo que ya guarda
`ProgresoService`. La tarjeta solo deriva el número con un `computed` de la señal que ya existe.

---

## Actividad 4 · Cuesta lo mismo, ¿pesa lo mismo? (individual)

Se quitó el `import()` dinámico de `visor.service.ts` y se volvió al import estático arriba del archivo
(`codigo/44-4-import-estatico.diff`).

| | Con `import()` (original) | Con import estático |
|---|---|---|
| Archivos iniciales | `main` + `chunk-GD7SK6UO.js`, total **232 kB** (66 kB comprimido) | un solo `main` de **755 kB** (176 kB comprimido) |
| Archivos diferidos | `chunk-XFRBEUET.js` «visor», 528 kB | ninguno |
| **Entradas del precaché** | **9** (754,18 KiB) | **7** (754,89 KiB) |

Pesan prácticamente lo mismo en total, pero no se descargan igual: con el import estático, todo lo que se descarga
antes del primer dibujo se triplica.

`checklist-atlas.js` (que contiene los puntos de `test_s42.js`) sobre esta compilación
(`salidas/44-4-lista-import-estatico.txt`):

```
4) service worker → {"activo":true,"controla":true,"precache":7}
   ✗ FALLÓ: precaché completo
RESULTADO: hay 1 fallos
```

El resto de los puntos pasa. El fallo es interesante porque no falta nada en el precaché: el punto exige al menos 8
entradas, y aquí hay 7 porque tres archivos se volvieron uno. Lo que delata, de forma indirecta, es que el visor ya
no está en un archivo aparte. Es lo mismo que pasó con la primera compilación de Angular en la guía.

**¿Qué otra forma habría de dejar el visor y Three.js en un archivo aparte sin `import()`?**

- **Vistas diferibles de Angular (`@defer`)**: envolver el componente del visor en `@defer (on idle) { … }` en la
  plantilla. El compilador saca solo a un archivo diferido el componente y todo lo que importa (visor.ts y Three.js),
  sin escribir `import()` a mano.
- **Separar en el empaquetador**: en Vite (sesiones 42 y 43), `manualChunks` pone Three.js en su propio archivo
  aunque el import sea estático. Ojo: así queda en otro archivo, pero se sigue descargando al inicio. Sirve para la
  caché (si cambia la app, Three.js no se vuelve a bajar), no para el primer contenido.
