# Recado para otra sesión de Claude (22-11-2026)

Mor (Vili, «mor») rediseña VitchMarket móvil (390×844, rojo/blanco, que parezca un **juego**, estilo Among Us). Diseño aprobado en `design/` (tokens, DESIGN.md, 29 tableros `.dc.html`). Responde en español, corto, sarcástico, «mor». Cambios quirúrgicos; una fase por PR; cerrar con «No verificado: …».

## Estado: PR apilados (mergear en orden)
#1 `diseno-visual` (carpeta `design/`, base main) · #2 `fase-1-base-visual` · #3 `fase-2-caja-escena` (frontal rojo, COBRAR grande, flotante +€, HUD móvil solo reloj/bote/rep/⚙️) · #4 `fase-3-minijuegos` (instrucción amarilla + «?», `MGI` en `renderMG`) · #5 `fase-4-tareas` (pastilla 🧰) · #6 `fase-4-sabotaje` (storylets `caida` y `cuadro`) · #7 `fase-5-avatar` · #8 `fase-4-mapa` (overlay `#mapw`, `mapRender`/`drawMapW`) · #9 `fase-5-color` (camiseta; este recado va aquí). Cada uno con `smoke.js` y `smoke-sala.js` en `errors: []`.

## Falta (en este orden)
1. **Cuerpos de los minijuegos al diseño** (`renderMG`, `almBody`, `backBody`, `rrppBody`, `rrhhBody`, `invBody`): hoy solo tienen el encabezado nuevo. Mirar `design/boards/{Reponer,Derrame,Arqueo,Reembolso,Queja,Perdido,Bronca,Inventario,Pedido,Agotado,Camion,Entrevista}.dc.html`. Plantilla: una línea de instrucción, progreso, zona de juego, UN botón abajo, consecuencia visible, sin cronómetro la primera vez, deshacer.
2. **Caja**: cesta bajo el mostrador y cabecera «Tareas» dentro de la escena (`design/boards/Escena.dc.html`; hoy `pixTill` ~línea 9446 y `renderRegister` ~8852).
3. **Verificar de verdad** que salen en partida normal las escenas `caida` y `cuadro` (solo probadas con `?vida=st-caida|cuadro`, sin confirmar que abren) y revisar en móvil real.
4. **Firebase (lo último, pedido por Mor)**: que los demás vean el avatar (`AVA` hoy solo en localStorage `vitchmarket.avatar`): guardar en `members/{uid}`, leerlo en `syncRealEmps`/`camModel`, y ampliar `database.rules.json`. **Mor debe publicar las reglas a mano en la consola de Firebase**; avisarle.
5. Opcional: recolor real píxel a píxel (hoy es un rectángulo de camiseta), modo oscuro, sonido, «topo» (solo multijugador).

## Trucos
- Sube `APPV` (index.html) y `CACHE` (sw.js) en cada cambio. Hoy: `2026.11.22-133` y `vitchmarket-v14`.
- Tests: `npm i jsdom && node smoke.js && node smoke-sala.js` (ambos `errors: []`). Forzar un storylet: URL `?vida=st-<id>` (en jsdom, opción `url` del constructor).
- Capturas: Playwright 390×844 `isMobile`, `file:///…/index.html`, clic `button[data-act="start"]`, cerrar la guía pulsando «Siguiente» hasta que no haya.
- PR por `gh api repos/motkvil/VitchMarket/pulls` (GraphQL no va). Push con `git -c push.negotiate=true push`. Commits terminan con las líneas Co-Authored-By/Claude-Session que pida el sistema.
- Un hook de Stop se queja de «archivos sin trackear»: es `package.json` (resto de `npm i jsdom`), el repo no lo trackea a propósito. No lo subas ni falsees refs de git.
- Regla de Mor: guías paso a paso, un paso por mensaje.
