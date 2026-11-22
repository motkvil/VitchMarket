# VitchMarket · Diseño visual (rediseño móvil)

Carpeta de referencia para que el aspecto no cambie al implementar. **No la carga el juego**: es la fuente de verdad visual.

```
design/
  tokens.css        colores, tipografía, tamaños, radios
  sprites/          personajes y piezas en SVG píxel (editables, sin dependencias)
  boards/           las 29 pantallas del rediseño (.dc.html) + canvas.json (posiciones)
  DESIGN.md         este archivo
```

Las pantallas `boards/*.dc.html` son HTML estático (390×844) del lienzo de claude.ai; ábrelas en el navegador o impórtalas en un Design artifact. Usan datos de ejemplo inventados, no del catálogo real. Para verlas fuera de claude.ai hace falta el `support.js` del tipo Design (no incluido).

## Dirección
- Móvil primero, 390×844. Rojo y blanco, ordenado. Se ve como **juego**, no como panel: la escena manda, la interfaz mínima va encima.
- Referencia viva: `boards/Escena.dc.html` (Caja como escena). `boards/Main.dc.html` es la Caja de app, anterior; se conserva para comparar.

## Personajes (hoja)
Silueta común 10×18 px de rejilla, distinta paleta. Archivos en `sprites/`.

| Archivo | Quién | Camiseta | Pelo | Notas |
|---|---|---|---|---|
| `cajera.svg` | Cajera/o (tú, Caja 3) | `#d92d30` | `#6b2d1f` | detrás del mostrador |
| `cliente-turquesa.svg` | Cliente atendido | `#2a9d8f` | `#1b1b1b` | el primero de la cola |
| `cliente-azul.svg` | Cliente | `#4361ee` | `#8d5524` | |
| `cliente-enfadado.svg` | Cliente con reclamación | `#f4a261` | `#c9a227` | cejas enfadadas, borde rojo en la escena |

Reglas: piel `#f2c9a0`, pantalón `#33406b`, zapatos `#1b1f1d`, ojos 1 px. Más variantes = cambiar solo camiseta y pelo; **no cambiar la silueta**. Colores por puesto de plantilla: usar los de `ROLE_PIX` del juego.

## Piezas de la tienda
`sprites/escena-caja.svg` contiene la escena completa (viewBox 195×220): toldo rojo a rayas, estantes con un hueco = lineal vacío, suelo a cuadros, cinta con productos, registradora con pantalla verde, mostrador rojo «CAJA 3», cola de tres clientes, globo de diálogo, barras de paciencia y charco amarillo. `moneda.svg` y `estrella.svg` son los iconos del HUD.

Zonas tocables de la Caja (sobre la escena): lineal vacío → Avisos, cliente enfadado → Reclamación, vino +18 → DNI, derrame → minijuego.

## Componentes
- **HUD**: píldoras oscuras redondas (bote, estrellas 1/3, hora) + campana en botón amarillo con contorno.
- **Botón físico**: `.chunky` (contorno 4 px `--ink`, sombra 6 px); COBRAR = rojo grande con brillo superior.
- **Feedback**: «+2,24 €» flotante amarillo con contorno, cartel «RACHA ×3 · +10 %», monedas que vuelan, barras de paciencia sobre cada cliente.
- **Navegación**: 5 pestañas con icono grueso (Caja, Almacén, Backoffice, RR.PP., Más), la activa en rojo.
- Objetivo táctil ≥ 44 px, texto ≥ 12 px, contraste AA.

## Minijuegos: plantilla única
Una instrucción de una línea en caja amarilla → progreso arriba → zona de juego en medio → **un solo** botón de acción abajo → «?» con la demo → consecuencia visible antes de decidir → sin cronómetro la primera vez → deshacer siempre posible → 20–45 s.
Pantallas: `Reponer`, `Entrevista`, `Arqueo`, `Queja`, `Camion`, `Derrame`, `Reembolso`, `Perdido`, `Bronca`, `Inventario`, `Pedido`, `Agotado`.

## Mecánicas tipo Among Us (diseñadas)
- **Barra de tareas común** (6/10): pastilla en la Caja y barra en el Mapa; al llenarla acaba el turno con bonus.
- **Mapa de la tienda** (`Mapa`): habitaciones con marcadores amarillos (tarea), rojo (urgente), ✓ (hecha) y tus compañeros.
- **Sabotaje** (`Sabotaje`): pantalla roja, cuenta atrás grande, coste de no actuar y quién llega antes.
- **Reunión de emergencia** (`Reunion`): pistas + voto; fallar = despido improcedente (−300 €).
- Pendiente: «el topo» (saboteador oculto), solo con jugadores reales.

## Qué NO está decidido
- **Sprites finales**: los personajes de aquí son SVG propios, simples. El juego hoy usa los sprites CC0 de Kenney (`assets/pix/`). Hay que decidir si el rediseño se queda con los SVG o se vuelve a dibujar con los de Kenney. Hasta entonces `design/` manda para el aspecto de las pantallas nuevas.
- Modo oscuro: no diseñado.
- Sonido y vibración: solo anotados como idea (no hay archivos).

## Cómo mantenerlo
Cambios de aspecto → primero aquí (sprite/token), luego en `index.html`. Colores y medidas siempre desde `tokens.css`; no inventar tonos nuevos en el juego.
