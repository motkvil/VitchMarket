# VitchMarket

Juego de simulación de supermercado en el navegador. Eres cajera o cajero de la caja 3 de VitchMarket y, entre turnos, quien lleva la tienda.

- **En caja:** escanea productos (algunos con el código dañado), comprueba el DNI en el alcohol, cobra con tarjeta o da el cambio exacto, y no te equivoques con la bolsa.
- **Reclamaciones:** resuelve las dudas tú y deriva el resto a Backoffice, Relaciones Públicas o Almacén.
- **Avisos:** lineales vacíos, derrames, clientes y turistas perdidos, megafonía y camiones. Mandas a alguien de tu plantilla o vas tú y juegas el minijuego: reponer, fregar (con cartel), indicar el pasillo o colocar el camión.
- **Salir de caja:** antes de irte le dices algo al cliente (con educación o «espérese un momento, joder, que ya vengo») y reacciona según su carácter. O dejas a alguien cubriéndote la caja.
- **Supervisar:** recorres la tienda, ves quién trabaja y quién mira el móvil, y animas o echas la bronca.
- **Clientes con personalidad:** la señora de los céntimos, quien va con prisa, quien es borde, quien es un encanto, influencers grabando, turistas, quien se cuela y quien va en las nubes. Y los habituales, que vuelven y se acuerdan de cómo les atendiste.
- **Personal:** cada trabajador tiene nombre, nacionalidad, idiomas, carácter, puesto, obligaciones, ánimo y rasgos ocultos. Llegan tarde, faltan, hablan durante el turno, discuten con clientes o los clientes los felicitan.
- **Reunión de personal** cada 3 turnos: valoras a cada persona, das toques, subes sueldos, despides, atiendes peticiones y entrevistas a candidatos.
- **Tienda:** stock por producto, pedidos a distribuidores y mejoras.
- **Tienda compartida:** una sola VitchMarket para todo el mundo, siempre online. Pones tu nombre y solicitas un cargo: el primero que pide ser jefe con el puesto libre lleva la caja y contrata al resto (Caja, Almacén, Backoffice, RR.PP.), que hace los avisos y las reclamaciones con los minijuegos. Sin conexión, se juega en solitario. Necesita Firebase (ver `firebase-config.js` y `database.rules.json`).

## Jugar

Un solo `index.html` sin dependencias ni build. El catálogo está en `productos.js`.

```bash
python3 -m http.server 8000
```

Y abre http://localhost:8000.

También funciona en GitHub Pages tal cual (rama `main`, carpeta raíz). La partida se guarda en el navegador al empezar y al cerrar cada turno: si recargas, sigues donde lo dejaste.

## Test

```bash
npm i jsdom && node smoke.js
```

Un bot juega varios turnos y debe imprimir `errors: []`.

`node smoke-sala.js` prueba la tienda compartida sin red: un jefe y una empleada en dos navegadores jsdom con una Firebase falsa en memoria. También debe imprimir `errors: []` (con `ROLE=back` la empleada va a Backoffice y prueba las reclamaciones en directo).
