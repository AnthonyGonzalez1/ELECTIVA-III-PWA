# Sesión 42 · Actividades y entregables

Lighthouse y cierre del proyecto.
Autor: Anthony Alejandro Gonzalez Sanchez · Electiva III – PWA · UPTC

Mediciones con Lighthouse 13.6 (perfil «Móvil», lentitud simulada, un perfil de navegador nuevo en cada corrida,
equivalente a incógnito), en un contenedor Linux sin tarjeta gráfica. Script: `Proyectos/pruebas-actividades/lh.js`.

---

## Actividad 1 · Mide tu propia página, con método (individual)

Proyecto medido: **el Gestor de Tareas** (`Proyectos/gestor-de-tareas`, versión de la Sesión 26), servido en local
porque no está publicado. Tres corridas (`salidas/42-1-gestor-base.md`):

| Corrida | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| 1 | 100 | 84 | 96 | 90 | 809 ms | 809 ms | 51 ms | 0,004 |
| 2 | 100 | 84 | 96 | 90 | 751 ms | 751 ms | 40 ms | 0,004 |
| 3 | 100 | 84 | 96 | 90 | 752 ms | 752 ms | 89 ms | 0,009 |
| **Mediana** | **100** | **84** | **96** | **90** | **752 ms** | **752 ms** | **51 ms** | **0,004** |

El rendimiento ya está en 100: la app es HTML, CSS y unos pocos archivos JS, sin librerías pesadas. Los puntos
perdidos están en accesibilidad, y de ahí salen los dos hallazgos con más impacto:

1. **Controles de formulario sin nombre accesible** (auditorías `select-name` y `label`, peso 10 cada una, las de
   más peso que fallan). El `<select>` de prioridad no tiene `<label>`, y las casillas de cada tarea se crean en
   `tareas.js` sin ningún texto asociado. Un lector de pantalla anuncia «cuadro combinado» o «casilla, no marcada»
   sin decir de qué. La causa es que el diseño se apoya en lo que se ve (el placeholder, la tarea escrita al lado),
   pero ese texto visual no está conectado al control en el código.
2. **Contraste insuficiente del subtítulo** (`color-contrast`, peso 7). `p.subtitulo` usa `#777` sobre blanco:
   contraste de 4,47:1, por debajo del 4,5:1 que exige WCAG AA para texto de 13,6 px. Es poco, pero es texto
   pequeño y gris, el caso que más cuesta leer con mala pantalla o mucha luz.

Hallazgos menores: no hay `meta description` (SEO 90), el navegador registra un 404 por `/favicon.ico` (buenas
prácticas 96) y el CSS bloquea el primer dibujo unos 120 ms (estimado, sin peso en el puntaje).

---

## Actividad 2 · Un cambio, una medición (individual)

**El cambio** (solo el primer hallazgo; `codigo/42-2-gestor-etiquetas.diff`): `<label>` visualmente ocultos
(clase `.solo-lectores`) para el título y la prioridad, y `aria-label="Completada: <título>"` en cada casilla. El
diseño en pantalla no cambia. Se regeneró `sw.js` con `workbox injectManifest` porque cambiaron archivos
precacheados.

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Línea base (mediana de 3) | 100 | 84 | 96 | 90 | 752 ms | 752 ms | 51 ms | 0,004 |
| Con etiquetas (mediana de 3) | 98 | **96** | 96 | 90 | 753 ms | 753 ms | 156 ms | 0,004 |
| Línea base, repetida (mediana de 3) | 96 | 84 | 96 | 90 | 757 ms | 757 ms | 228 ms | 0,004 |

Tablas completas: `salidas/42-1-gestor-base.md`, `salidas/42-2-gestor-con-etiquetas.md` y
`salidas/42-2-gestor-base-repeticion.md`.

**Lo que mejoró:** accesibilidad pasó de 84 a 96 en las tres corridas. Ya no fallan `label` ni `select-name`; solo
queda el contraste.

**Lo que «empeoró»:** el rendimiento bajó de 100 a 98 porque el TBT subió de 51 a 156 ms. El cambio no puede
explicarlo: agrega dos etiquetas y un atributo, cero trabajo de JavaScript que valga 100 ms. Para comprobarlo se
volvió a medir la línea base **sin el cambio**: salió con TBT de 37, 287 y 228 ms y rendimiento 96. El TBT de esta
página varía entre corridas más que lo que el cambio podría moverlo. Lo produce el propio equipo (otros procesos
usando la CPU durante la carga) y Lighthouse lo multiplica al simular un teléfono más lento.

**¿Por qué es un error cambiar tres cosas y medir una sola vez?** Con tres cambios no se sabe cuál causó cada
diferencia; uno puede mejorar y otro empeorar, y el resultado neto esconde a los dos. Con una sola medición no se
puede separar el efecto del ruido: aquí, una sola corrida de la línea base podía dar TBT de 37 o de 287 ms. Si se
hubiera medido una vez antes y una después, se habría concluido que poner etiquetas «empeora el rendimiento».

---

## Actividad 3 · Rompe el dibujo bajo demanda (en parejas)

`test_s42.js` no viene en el zip. La Sesión 45 publica `checklist-atlas.js`, que repite sus doce puntos y agrega
el 13, así que se usó esa lista. Se quitó `sucio = true;` de `seleccionar()` en `visor.ts`
(`codigo/42-3-quitar-sucio.diff`), se recompiló y se ejecutó (`salidas/42-3-lista-sin-sucio.txt`):

```
7) escena quieta durante 1,5 s → llamadas de dibujo: 0
8) arrastrar para girar → llamadas de dibujo nuevas: sí (744)
9) tras soltar y pasar la inercia → vuelve a quedarse quieta: sí
10) elegir una pieza → llamadas de dibujo nuevas: no
   ✗ FALLÓ: elegir una pieza debe redibujar
11) cambiar de modelo → llamadas de dibujo nuevas: sí
12) cambiar el tamaño de la ventana → llamadas de dibujo nuevas: sí
13) … nota conservada: ""
   ✗ FALLÓ: la nota escrita no debe borrarse al marcar un favorito
RESULTADO: hay 2 fallos
```

**Falla la línea 10**, la que debía fallar. No hizo falta escribir un caso nuevo. El fallo del punto 13 no tiene que
ver con el cambio: es el defecto conocido de la versión sin framework, que esta lista detecta siempre en la S42.

Con la línea restaurada (`salidas/42-3-lista-restaurada-s42.txt`), el punto 10 vuelve a «sí» y solo queda el 13.

---

## Actividad 4 · El LCP: ¿cuál es «el elemento más grande»? (individual)

Datos sacados de los dos informes de los recursos (`lighthouse-antes.html` es la Sesión 41 y
`lighthouse-despues.html` la de hoy):

| | Sesión 41 | Sesión 42 |
|---|---|---|
| LCP | 1,7 s | 2,3 s |
| Elemento | `section.visor-zona > p.aviso-demo` (el párrafo fijo «Toca una pieza para ver qué hace…») | `div#pieza-detalle > p` (el párrafo «Riesgo…» de la ficha del modelo) |
| Retraso de dibujo del elemento | 70 ms | 507 ms |

En la S41 el elemento más grande era un párrafo que ya viene en el HTML y se pinta con el primer cuadro. En la S42,
con el espacio reservado, ese párrafo dejó de ser el más grande en pantalla y pasó a serlo el texto de la ficha.
Ese texto lo escribe JavaScript cuando termina de cargar el paquete principal (Three.js incluido), y por eso tarda
507 ms más. Las mediciones propias de las sesiones 43 y 44 confirman el mismo elemento.

**Propuesta:** escribir en `index.html`, al compilar, el contenido inicial de la ficha del modelo que se abre por
defecto (MVC: «Cuándo usarlo» y «Riesgo»), dentro de `#pieza-detalle`. Se pinta con el primer cuadro, en el mismo
lugar y con el mismo tamaño, así que no mueve la página. Cuando JavaScript arranca, reemplaza ese texto por el mismo
texto. El LCP volvería a parecerse al FCP, como en la S41, sin quitar la reserva de espacio que arregló el CLS.

**Costo:**

- El texto queda en dos lugares (la ficha JSON y el HTML). Para que no se desincronicen habría que generarlo desde
  el JSON con un paso de compilación, otro script que mantener.
- El HTML pesa unos cientos de bytes más.
- Si la app se abre con `?modelo=` apuntando a otro modelo, se verá un instante la ficha de MVC antes de cambiar.
  Habría que leer el parámetro también en ese paso o aceptar el parpadeo.
- No es «engañar a la métrica»: el usuario ve de verdad el texto antes. Pero solo vale para el modelo por defecto.
