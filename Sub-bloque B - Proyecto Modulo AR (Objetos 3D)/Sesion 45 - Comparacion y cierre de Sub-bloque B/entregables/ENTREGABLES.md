# Sesión 45 · Actividades y entregables

Comparación y cierre del Sub-bloque B.
Autor: Anthony Alejandro Gonzalez Sanchez · Electiva III – PWA · UPTC

**Versión elegida:** la de Angular (Sesión 44) con el contador de visitas de la actividad 3 de la Sesión 44. Es la
que quedó en `Proyectos/pwa-ar-objetos3d` más ese cambio. La lista de verificación es
`Proyectos/checklist-atlas/checklist-atlas.js`.

---

## Actividad 1 · Ejecuta la lista sobre dos versiones (individual)

Salidas: `salidas/45-1-lista-mi-version-a44.txt` (mi versión) y `salidas/45-1-lista-s42.txt` (Sesión 42, compilada
desde su zip).

| Punto | Sesión 42 | Mi versión (Angular) |
|---|---|---|
| 1 documento | ✓ (lang es, descripción de 140 caracteres, un main, un h1) | ✓ igual |
| 2–3 manifest e instalabilidad | ✓ sin errores | ✓ sin errores |
| 4 Service Worker | ✓ activo, controla, 9 entradas | ✓ activo, controla, 9 entradas |
| 5 servidor caído | ✓ 1 lienzo, 3 pestañas | ✓ igual |
| 6 CLS | ✓ 0,008 | ✓ 0,008 |
| 7–12 dibujo bajo demanda | ✓ 0 llamadas quieta; girar, pieza, modelo y tamaño dibujan | ✓ igual |
| **13 nota y favorito** | **✗ nota conservada: ""** | **✓ «repasar el controlador»** |
| Resultado | 1 fallo | todo en orden |

**La única diferencia es el punto 13.** La prueba escribe «repasar el controlador» en la tarjeta de MVC sin
guardarla y luego marca como favorito la de Capas. En la Sesión 42, marcar un favorito llama a `render()`, que borra
y vuelve a escribir el HTML de todo el catálogo. El texto escrito vivía solo en el `<input>` borrado y se pierde. En
Angular cada tarjeta es un componente con su propia señal `nota`: al cambiar el favorito solo se actualiza el botón
de esa tarjeta, y el campo de MVC no se toca. No es que Angular sea «mejor» en general: es que actualiza solo lo que
cambió, y la versión sin framework, para no complicarse, lo reescribía todo.

Lo que *no* cambió también dice algo. Del 1 al 12 las dos versiones dan lo mismo, porque esos puntos dependen del
motor (visor, Service Worker, manifest), que es idéntico en las dos. En mi corrida el CLS de la S42 salió 0,008, no
el 0,050 de la guía; la diferencia es del entorno de medida, no del código.

---

## Actividad 2 · Rompe un punto a propósito (en parejas)

Se hicieron dos rupturas sobre una copia de mi versión, una cada vez, restaurando entre ellas:

| Cambio | Línea que falló | Salida |
|---|---|---|
| Quitar `<meta name="description">` de `src/index.html` (`codigo/45-2-quitar-description.diff`) | `1) documento → … "descr":0 …` y `✗ FALLÓ: meta description` | `salidas/45-2-lista-sin-description.txt` |
| Cambiar `start_url` a `https://otro-sitio.example/` (`codigo/45-2-cambiar-start-url.diff`) | `2) manifest → errores de Chrome: [{"message":"property 'start_url' ignored, should be same origin as document." …}]` y `✗ FALLÓ: el manifest no debe tener errores` | `salidas/45-2-lista-start-url.txt` |
| Restaurado | `RESULTADO: todo en orden` | `salidas/45-2-lista-restaurada.txt` |

Detalle del segundo caso: el punto 3 (instalabilidad) **siguió pasando**. Chrome ignora el `start_url` de otro
origen, usa la URL del documento y la app sigue siendo instalable. Sin el punto 2, que pregunta por los errores del
manifest, el error habría pasado inadvertido.

**¿Qué tipo de defecto no podría detectar nunca esta lista?** Los que están donde la lista no mira y los que nadie
pensó en comprobar. La pista de la sección 4 es el caso real: el script de compilación de Angular dejaba cinco
archivos `.js` sueltos en `src/`. La aplicación compilada era idéntica, así que los 13 puntos pasaban, y el defecto
estaba en el contenido del repositorio y del zip. Tampoco puede detectar lo que solo se ve con un teléfono en la
mano: que los rótulos se lean en AR, que el ancla corrija la posición, que el diálogo real de instalación de Chrome
aparezca. Ni defectos de experiencia como un texto confuso o un botón mal ubicado. La lista comprueba lo que se
pensó en comprobar; para lo demás hace falta revisar el producto con ojos frescos.

---

## Actividad 3 · Un registro de decisión (individual)

Entregable: **[`decision.md`](decision.md)**. El proyecto es una PWA de inventario para Aminta Pastelería y Café
(planta y tres sedes, unas seis pantallas, uso sin conexión, una sola persona que la mantiene). La decisión es
**React**, con tres razones apoyadas en cifras de la guía: el punto 13 en una app de formularios, el costo de
herramientas de Angular (Node 22 y dos scripts) y el TBT de 132 ms. La sección «Qué no sabemos» lista lo que habría
que medir antes de estar seguros: los equipos reales de las sedes, la conexión, la API de facturación, el
crecimiento y quién la mantendrá.

---

## Actividad 4 · Mide tu versión (individual)

La versión no está publicada, así que se midió servida en local, con tres corridas de Lighthouse (móvil, perfil
nuevo en cada una; `salidas/45-4-lighthouse-mi-version.md`):

| Corrida | Rendimiento | FCP | LCP | TBT |
|---|---|---|---|---|
| 1 | 47 | 621 ms | 6863 ms | 3025 ms |
| 2 | 45 | 625 ms | 7290 ms | 3322 ms |
| 3 | 48 | 616 ms | 6526 ms | 2514 ms |
| **Mediana** | **47** | **621 ms** | **6863 ms** | **3025 ms** |

Comparada con la tabla de la sección 5 (Angular diferido: 79, 1722 ms, 2773 ms, 620 ms), la dirección coincide en lo
que caracteriza a esta versión: el primer contenido llega pronto y el contenido más grande muy tarde, porque depende
del visor diferido. Los valores absolutos son mucho peores (rendimiento 47 contra 79, TBT de 3 s) porque medí en un
contenedor sin tarjeta gráfica, donde Three.js se inicializa en la CPU. Es el mismo efecto que se vio al medir las
tres versiones en la Sesión 44.

**¿Qué número cambia más de una corrida a otra?** El **TBT**: de 2514 a 3322 ms, unos 800 ms, más de una cuarta
parte de la mediana. El LCP varía unos 760 ms (alrededor del 11 %) y el FCP casi nada (9 ms).
