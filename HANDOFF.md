# Recado para otra sesión de Claude (22-11-2026)

Mor (Vili, «mor») rediseña VitchMarket móvil (390×844, rojo/blanco, que parezca un **juego**, estilo Among Us). Diseño aprobado en `design/` (tokens, DESIGN.md, 29 tableros `.dc.html`). Responde en español, corto, sarcástico, «mor». Cambios quirúrgicos; una fase por PR; cerrar con «No verificado: …».

## Estado (22-11-2026)
Todo fusionado en `main` (PR #1–#22). Móvil ya fiel a los tableros: Caja (escena, panel LED + COBRAR), cobro en efectivo, DNI, reclamación, avisos, cierre, menú «Estado del turno», departamentos y cierre con tarjetas blancas, minijuegos a pantalla completa con la acción fija abajo, avatar en ajustes. Pruebas: `?norma=dni`, `?norma=queja`, `?norma=billete|cupon|ladron`.

## Acera y lineal (25-11-2026)
Pantalla de inicio nueva: la fachada en directo (`#acera`, `aceraShow`/`aceraEnter`, `?acera=0` la salta, `?hora=H` fuerza la luz) y el menú como estantería (`startShelf`, `cerealBox`). Ver «🏪 Acera y lineal» en CLAUDE.md. El horario de la tienda compartida (16–24 h Madrid) solo se pinta: falta aplicarlo al juego.

## Falta
1. Minijuegos: la mecánica interna sigue siendo la de siempre; los tableros (p. ej. `Reponer`: caja → estante) imaginan otra más simple. Solo se maquetó, no se rehízo.
2. **Firebase (lo último, pedido por Mor)**: que los demás vean el avatar (`AVA` hoy solo en localStorage `vitchmarket.avatar`): guardar en `members/{uid}`, leerlo en `syncRealEmps`/`camModel` y ampliar `database.rules.json`. **Mor debe publicar las reglas a mano** en la consola de Firebase.
3. Revisar en móvil real (solo Mor; Brave Android).
4. Opcional: recolor real píxel a píxel, modo oscuro.
5. **Topo rehecho (25-11-2026, `APPV` 2026.11.25-154)** como Among Us de súper: barra de tareas, sabotajes con cuenta atrás y arreglo, 📋 Cuaderno con pistas, 🚨 reunión con coartadas y votación, topo real en la tienda compartida (rol solo por `notes/{uid}`). Ver «🕵️ Topo» en `CLAUDE.md`. Sin cambios en `database.rules.json` (los acts van como `k:'soc'`). Pruebas: `node smoke-topo.js`, `TOPO=1|real node smoke-sala.js`. Falta probarlo con gente de verdad y equilibrar la meta de la barra en turnos online largos.

## Trucos
- Sube `APPV` (index.html) y `CACHE` (sw.js) en cada cambio. Hoy: `2026.11.22-147` y `vitchmarket-v27`.
- Tests: `npm i jsdom && node smoke.js && node smoke-sala.js` (ambos `errors: []`). Forzar un storylet: URL `?vida=st-<id>` (en jsdom, opción `url` del constructor).
- Capturas: Playwright 390×844 `isMobile`, `file:///…/index.html`, clic `button[data-act="start"]`, cerrar la guía pulsando «Siguiente» hasta que no haya.
- PR por `gh api repos/motkvil/VitchMarket/pulls` (GraphQL no va). Push con `git -c push.negotiate=true push`. Commits terminan con las líneas Co-Authored-By/Claude-Session que pida el sistema.
- `package.json` ya está en `.gitignore`. Tras fusionar, GitHub borra la rama remota: vuelve a `main` (`git checkout -B main origin/main`) para que el hook no proteste. Claude puede fusionar sus PR con `gh api -X PUT repos/motkvil/VitchMarket/pulls/N/merge -f merge_method=merge`. No falsees refs de git.
- Regla de Mor: guías paso a paso, un paso por mensaje.
