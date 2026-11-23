# Registro de decisión: framework para la PWA de inventario de Aminta

Autor: Anthony Alejandro Gonzalez Sanchez · Electiva III – PWA · Actividad 3 de la Sesión 45

## Contexto

Aminta Pastelería y Café tiene una planta de producción y sedes en Tunja, Chía y Mosquera. Hoy usa un software solo
para la facturación electrónica; el inventario se lleva en papel, y es donde más tiempo y dinero se pierde. Se
quiere una PWA para registrar entradas y salidas de insumos y producto en la planta y en cada sede, consultar
existencias y ver alertas de faltantes.

- Unas cinco o seis pantallas: inicio de turno, entradas, salidas y traslados entre sedes, existencias, alertas.
  Son pantallas de formularios y listas.
- Debe funcionar sin conexión en la bodega o en el mostrador y sincronizar después (IndexedDB y Background Sync,
  como en el Atlas).
- La construye y mantiene una sola persona (yo, durante la práctica). Después la heredaría quien siga en el cargo,
  que puede no ser desarrollador de tiempo completo.

## Opciones

1. Sin framework (TypeScript + Vite + Workbox), como el Atlas hasta la Sesión 42.
2. React + Vite + `vite-plugin-pwa`, como la Sesión 43.
3. Angular, como la Sesión 44.

## Decisión

**React con Vite y `vite-plugin-pwa`**, con la misma separación del Atlas: un «motor» sin framework (`db.ts`,
sincronización, Service Worker) y React solo para la pantalla.

## Razones

1. **Es una app de formularios, y el defecto de la versión sin framework es justo de formularios.** En la lista de
   verificación, la versión sin framework falla el punto 13: `render()` reescribía todo el catálogo y borraba la
   nota que se estaba escribiendo al marcar un favorito en otra tarjeta. React y Angular pasan los 13 de 13. En un
   inventario, perder una cantidad a medio escribir es peor que perder una nota.
2. **Menos herramientas que mantener que Angular.** React se integró con un solo plugin (`vite-plugin-pwa`) y Node
   20. Angular pidió Node 22.22.3 o superior y dos scripts propios para el Service Worker. Para una sola persona, y
   para quien herede el proyecto, cada pieza de compilación propia es algo más que se puede romper.
3. **Interacción ágil en equipos modestos.** En la tabla de la sección 5 de la guía, React tiene el mejor
   rendimiento (94) y el menor TBT (132 ms, contra 455 sin framework y 620 en Angular). La app se abre una vez por
   turno y luego se usa muchas veces, así que la respuesta al tocar pesa más que el primer contenido.

## Riesgos

- **Primer contenido más lento:** React tardó 530 ms más en mostrar algo (2234 contra 1704 ms). En una sede con
  datos móviles malos, la primera carga del día se notará. Se mitiga con el Service Worker (desde la segunda visita
  la app sale de la caché).
- **Efectos sin limpieza:** el error de la Sesión 43 (dos lienzos por falta de `destruir()`) muestra lo fácil que es
  olvidar una limpieza. Hay que mantener StrictMode en desarrollo y escribir pruebas que lo verifiquen.
- **Dependencias que cambian:** React y su ecosistema se actualizan seguido. Si el proyecto queda quieto un año,
  actualizarlo puede costar.
- **Quien herede el proyecto** tiene que saber React, o al menos JavaScript moderno. Si nadie en Aminta programa,
  cualquiera de las tres opciones deja el mismo problema.

## Qué no sabemos

- **En qué equipos se usará.** No sé qué teléfonos o tabletas hay en cada sede ni qué versión de Android y de Chrome
  tienen. Todas las cifras de la guía son de Chromium con lentitud simulada, no de esos equipos. Habría que medir en
  uno de ellos.
- **La conexión real en cada sede y en la planta.** Si es buena, la desventaja de FCP de React casi desaparece; si
  es muy mala, podría ser decisiva.
- **Si el software de facturación tiene una API** con la que sincronizar productos. Eso podría añadir pantallas y
  cambiar el tamaño del proyecto.
- **Cuánto crecerá.** La guía advierte que con diez veces más pantalla las proporciones podrían cambiar. Seis
  pantallas son pocas; si llegan a treinta, la comparación con Angular habría que repetirla.
- **Quién la mantendrá después de la práctica.** Es la pregunta que más pesa y ninguna cifra la contesta.
