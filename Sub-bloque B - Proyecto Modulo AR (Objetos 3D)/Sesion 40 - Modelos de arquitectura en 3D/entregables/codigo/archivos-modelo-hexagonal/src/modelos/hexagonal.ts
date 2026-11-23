// hexagonal.ts — Arquitectura hexagonal (puertos y adaptadores) como DATOS (actividad 40.1).
// Solo datos: no se tocó constructor.ts. El núcleo queda en el centro; a la izquierda,
// el lado que lo USA (actores y adaptadores primarios); a la derecha, el lado que el núcleo
// NECESITA (puertos de salida, adaptadores secundarios y sistemas externos).
import type { DefinicionModelo } from "./tipos";

export const HEXAGONAL: DefinicionModelo = {
  id: "hexagonal",
  nombre: "Hexagonal (puertos y adaptadores)",
  resumen: "El dominio en el centro, sin depender de nada; todo lo externo entra y sale por puertos.",
  elevacion: 62,
  distancia: 0.8,
  piezas: [
    { id: "usuario", nombre: "Usuario", rol: "actor", forma: "esfera", pos: [-8, 0, 2.4], tam: [1.1, 1.1, 1.1], rotulo: "frente", resumen: "Quien usa la aplicación desde el navegador." },
    { id: "pruebas", nombre: "Pruebas", rol: "actor", forma: "esfera", pos: [-8, 0, -2.4], tam: [1.1, 1.1, 1.1], rotulo: "arriba", resumen: "Las pruebas automáticas usan el núcleo igual que un usuario, sin pantalla ni base de datos real." },
    { id: "api-rest", nombre: "API REST", rol: "presentacion", forma: "caja", pos: [-5.2, 0, 2.4], tam: [2.2, 1, 1.4], rotulo: "frente", resumen: "Adaptador primario: traduce peticiones HTTP en llamadas al puerto de entrada." },
    { id: "arnes", nombre: "Arnés", rol: "presentacion", forma: "caja", pos: [-5.2, 0, -2.4], tam: [2.2, 1, 1.4], rotulo: "frente", resumen: "Adaptador primario para las pruebas: llama al mismo puerto que la API." },
    { id: "puerto-entrada", nombre: "Puerto entrada", rol: "coordinacion", forma: "caja", pos: [-2.6, 0, 0], tam: [0.6, 1.4, 5.6], rotulo: "arriba", resumen: "Puerto de entrada: la interfaz con los casos de uso que el núcleo ofrece (crear pedido, consultar pedido)." },
    { id: "dominio", nombre: "Dominio", rol: "logica", forma: "cilindro", pos: [0, 0, 0], tam: [3.4, 1.4, 3.4], rotulo: "frente", resumen: "Reglas del negocio puras. No sabe si lo llaman por HTTP o desde una prueba, ni dónde se guardan los datos." },
    { id: "puerto-repo", nombre: "Puerto repo", rol: "coordinacion", forma: "caja", pos: [2.8, 0, 2.2], tam: [0.6, 1.2, 1.8], rotulo: "frente", resumen: "Puerto de salida: la interfaz que el núcleo define para guardar y leer pedidos." },
    { id: "puerto-aviso", nombre: "Puerto avisos", rol: "coordinacion", forma: "caja", pos: [2.8, 0, -2.2], tam: [0.6, 1.2, 1.8], rotulo: "arriba", resumen: "Puerto de salida: la interfaz que el núcleo define para avisar al cliente." },
    { id: "sql", nombre: "Adapt. SQL", rol: "datos", forma: "caja", pos: [5.4, 0, 2.2], tam: [2.2, 1, 1.4], rotulo: "frente", resumen: "Adaptador secundario: implementa el puerto de repositorio con consultas SQL." },
    { id: "correo", nombre: "Adapt. correo", rol: "infra", forma: "caja", pos: [5.4, 0, -2.2], tam: [2.2, 1, 1.4], rotulo: "frente", resumen: "Adaptador secundario: implementa el puerto de avisos enviando correos." },
    { id: "bd", nombre: "Base de datos", rol: "datos", forma: "cilindro", pos: [8.2, 0, 2.2], tam: [1.6, 1, 1.6], rotulo: "frente", resumen: "Almacenamiento real; se puede cambiar sin tocar el núcleo." },
    { id: "smtp", nombre: "SMTP", rol: "actor", forma: "esfera", pos: [8.2, 0, -2.2], tam: [1.1, 1.1, 1.1], rotulo: "arriba", resumen: "Sistema externo que entrega los correos." },
  ],
  enlaces: [
    { de: "usuario", a: "api-rest", tipo: "llamada" },
    { de: "pruebas", a: "arnes", tipo: "llamada" },
    { de: "api-rest", a: "puerto-entrada", tipo: "llamada" },
    { de: "arnes", a: "puerto-entrada", tipo: "llamada" },
    { de: "puerto-entrada", a: "dominio", tipo: "llamada" },
    { de: "dominio", a: "puerto-repo", etiqueta: "guarda", tipo: "datos" },
    { de: "dominio", a: "puerto-aviso", etiqueta: "avisa", tipo: "evento" },
    // La llamada va del puerto al adaptador, pero la DEPENDENCIA va al revés (el adaptador implementa el puerto).
    // Con los tres tipos de enlace solo se puede dibujar la llamada.
    { de: "puerto-repo", a: "sql", tipo: "llamada" },
    { de: "puerto-aviso", a: "correo", tipo: "llamada" },
    { de: "sql", a: "bd", tipo: "datos" },
    { de: "correo", a: "smtp", tipo: "llamada" },
  ],
};
