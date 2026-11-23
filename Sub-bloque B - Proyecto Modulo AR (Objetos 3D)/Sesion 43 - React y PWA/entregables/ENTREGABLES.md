# Sesión 43 · Actividades y entregables

React y PWA: el Atlas 3D con componentes, hooks y `useRegisterSW`.
Autor: Anthony Alejandro Gonzalez Sanchez · Electiva III – PWA · UPTC

Base de trabajo: checkpoint `pwa-ar-objetos3d-sesion43.zip` (y el de la S42 para comparar). Scripts en
`Proyectos/pruebas-actividades/`.

---

## Actividad 1 · Mide las dos versiones en tu equipo (individual)

Se sirvieron en local las compilaciones de la S42 y de la S43 y se corrió Lighthouse tres veces en cada una
(móvil, perfil nuevo en cada corrida). Corridas completas en `salidas/43-44-lighthouse-tres-versiones.md`.

**Mis medianas:**

| | Rendimiento | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| S42, sin framework | 53 | 754 ms | 4671 ms | 3625 ms | 0 |
| S43, React | 49 | 798 ms | 5800 ms | 4406 ms | 0 |

**Las de la guía (sección 8):**

| | Rendimiento | FCP | LCP | TBT |
|---|---|---|---|---|
| S42, sin framework | 83 | 1708 ms | 2290 ms | 554 ms |
| S43, React | 91 | 2248 ms | 2393 ms | 253 ms |

**Qué coincide y qué no.** Coincide la dirección del primer contenido y del contenido más grande: con React, FCP y
LCP empeoran porque el HTML llega con un `div` vacío y no hay nada que pintar hasta ejecutar JavaScript. En mi
equipo la diferencia de FCP es mucho menor (44 ms contra 540 ms). El CLS es 0 en las dos. **No coinciden ni el
rendimiento ni el TBT.** En la guía React sube de 83 a 91 y el TBT baja a menos de la mitad; en mi equipo React
baja de 53 a 49 y el TBT sube de 3,6 a 4,4 s. La explicación más probable es el entorno: medí en un contenedor sin
tarjeta gráfica, donde WebGL corre en la CPU (SwiftShader). Inicializar Three.js se vuelve una tarea larguísima que
domina el TBT, y React suma su propio trabajo encima. La hipótesis de la guía (el FCP llega más tarde y parte del
bloqueo queda fuera de la ventana que cuenta el TBT) no puede ocurrir aquí porque mi FCP casi no se movió. Mis
cifras sirven para comparar versiones entre sí en el mismo equipo, no para contrastarlas número a número con las de
la guía.

---

## Actividad 2 · Rompe la limpieza del visor (en parejas)

Se comentó `nuevo.destruir();` en `App.tsx` (`codigo/43-2-sin-destruir.diff`), se levantó `npm run dev` y se
contaron los `<canvas>` dentro de `#visor` (`salidas/43-2-lienzos.txt`, script `contar_lienzos.js`):

| Versión | Lienzos en `#visor` |
|---|---|
| `npm run dev`, **sin** `nuevo.destruir()` | **2** (los dos con contexto WebGL) |
| `npm run dev`, con la línea restaurada | 1 |
| `npm run build`, sin la línea | 1 |

**¿Por qué el defecto aparece en desarrollo y no en la versión compilada?** Porque `main.tsx` monta la app dentro de
`<StrictMode>`, y en desarrollo StrictMode ejecuta cada efecto dos veces a propósito: monta, ejecuta la limpieza y
vuelve a montar. Sin `destruir()`, la limpieza no quita el primer lienzo y el segundo montaje crea otro. En la
compilación de producción StrictMode no repite los efectos, así que el efecto corre una sola vez y el defecto no se
ve. Pero sigue ahí: aparecería en cuanto el componente se desmontara de verdad (otra ruta, una recarga en caliente),
dejando un lienzo y su bucle de dibujo vivos. Por eso conviene que StrictMode lo delate en desarrollo.

---

## Actividad 3 · Un componente nuevo: el contador de visitas (individual)

**Código** (`codigo/43-3-contador-visitas-react.diff`):

- `db.ts`: `ProgresoModelo` gana el campo opcional `visitas`, y `marcarModeloVisto()` hace
  `registro.visitas = (registro.visitas ?? 0) + 1`. Es opcional, así que los registros viejos valen 0. IndexedDB
  guarda el objeto entero y no hace falta subir la versión de la base.
- `Catalogo.tsx`: la `Tarjeta` calcula `const visitas = progreso?.visitas ?? 0` y muestra «Visitado N veces» («1
  vez» en singular).
- `useProgreso` **no cambia**: después de `marcarVisto` ya llama a `recargar()`, y el registro nuevo llega por props.

Prueba (`salidas/43-3-contador-react.txt`, script `a4344_3.js`): todas las tarjetas empiezan en 0; tras tres clics
en MVC y uno en Capas se lee «Visitado 3 veces» y «Visitado 1 vez»; después de recargar, los números siguen ahí.

**Dónde vive el dato y por qué:** el contador no existía en `useProgreso` (`ultimaVisita` se sobrescribe, no
cuenta), pero es un dato de progreso, igual que la última visita. Vive en el registro de IndexedDB y llega a la
tarjeta por props. Como estado de la tarjeta sería una línea menos, pero se perdería al recargar y habría dos
fuentes de verdad para el mismo hecho. La línea que lo cuenta está en `db.ts`, el «motor» compartido, así que sirve
igual para la versión de Angular (actividad 3 de la Sesión 44).

---

## Actividad 4 · La carrera del evento de instalación (individual)

**El cambio** (`codigo/43-4-evento-al-cargar.diff`, en `instalar.ts`): los oyentes de `beforeinstallprompt`,
`appinstalled` y el cambio de modo de visualización se registran **al cargar el módulo**, antes de que React dibuje.
El evento queda guardado en la variable `evento`. `iniciarInstalacion(alCambiar)` ya no empieza a escuchar: solo
agrega `alCambiar` a un conjunto de suscriptores y devuelve cómo quitarlo.

**¿Qué parte de `useInstalacion` debe cambiar?** En este proyecto, ninguna. `useInstalacion` usa
`useSyncExternalStore(suscribir, foto)`, y `foto()` lee `estadoInstalacion()` en cada dibujo. Si el evento ya llegó,
el primer dibujo ya ve «instalable» y el botón aparece. Lo que había que cambiar era lo que hacía `suscribir`: antes
el oyente se registraba al suscribirse React, después del primer dibujo, y un evento anterior se perdía. Si el hook
usara `useState` + `useEffect`, sí habría que cambiarlo: el estado inicial tendría que salir de
`estadoInstalacion()` y no de un valor fijo como «no-disponible».

**La prueba.** A `t41.js` (la reconstrucción de `test_s41.js`) se le añadió el escenario **I**: el evento se lanza
en `DOMContentLoaded`. A esa altura los módulos ya se ejecutaron, pero React todavía no ha dibujado ni se ha
suscrito.

| | Antes (checkpoint S43, `salidas/43-4-t41-s43.txt`) | Después (`salidas/43-4-t41-a43.txt`) |
|---|---|---|
| A–H (los de la S41) | todo en orden | todo en orden |
| I1 | `defaultPrevented: false`, sin botón ✗ | `defaultPrevented: true`, con botón ✓ |
| Resultado | hay 1 fallo | todo en orden |

Con el código original el evento llega y nadie lo escucha: Chrome mostraría su propia barra y el botón de la app
nunca aparecería.

**¿Qué prueba de la Sesión 41 te avisaría si te equivocas?** Ninguna de las de la S41 detecta la carrera: A–H pasan
igual antes y después, porque lanzan el evento con la página ya montada. Por eso hizo falta el escenario I. Las de
la S41 sí avisan de los errores típicos al hacer el cambio. Para comprobarlo se movió el oyente pero se olvidó
llamar a `avisar()` (`salidas/43-4-t41-a43-sin-avisar.txt`): **B1** falla («botón visible: false») y la prueba se
detiene en C porque no hay botón que pulsar. Si se olvidara soltar el evento tras usarlo, fallarían C1, D1 y H1,
como en la actividad 4 de la Sesión 41.
