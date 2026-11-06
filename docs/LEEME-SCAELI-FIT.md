# LEEME · Scaeli Fit (para arrancar un chat nuevo)

Leé esto entero antes de tocar código. Estado al 6 de noviembre de 2026 · versión 13.

## Qué es
Scaeli Fit es la app hermana de **Scaeli Daily** (oración) y del juego **Scaeli**. Sirve para nutrición y entrenamiento, con lo católico integrado en la estructura (ofrecer el entreno, rezar el Rosario entre series, ayuno eclesiástico, abstinencia), sin imágenes de santos. Las tres comparten el proyecto de Firebase `scaeli` y el mismo usuario (uid).

## Cómo trabaja Lorenzo (reglas fijas)
- **Solo se programa y se publica cuando escribe literalmente «programar»**, incluidos los arreglos de errores. Sin esa palabra se puede investigar, proponer y mostrar maquetas o vistazos, pero no tocar la app publicada.
- Español rioplatense con voseo, respuestas cortas, entregas completas y probadas. Si manda una lista, se hace todo junto.
- Los botones llevan un ícono o una sola palabra. Nada se da por sabido: todo lo que se toca tiene que explicar para qué es.
- No cambiar las claves internas que dicen «scala», el nombre Scaeli ni el lema «Tu fe, a otro nivel». No agregar idiomas. El pixel art de los personajes no se toca.
- Si algo admite dos lecturas, elegir la razonable, hacerla y avisar qué se decidió.

## Dónde está
- Repositorio: `LDiazVidela/scaeli-fit` (GitHub, rama `main`). Pedir acceso con *add_repo* (push).
- Publicado en GitHub Pages: https://ldiazvidela.github.io/scaeli-fit/ (se publica solo al hacer push, en 1 o 2 minutos).
- Daily: `LDiazVidela/scaeli-daily` → https://ldiazvidela.github.io/scaeli-daily/ (en el chat anterior no hubo acceso de escritura).

## Cómo está hecha
PWA sin compilación: módulos ES que se sirven tal cual.
- `index.html`: estructura, barra de navegación (Hoy · Entreno · Escuchar · Cuerpo · Yo), íconos SVG (`<symbol id="i-…">`), panel `#sheet`.
- `js/app.js` (~145 KB): toda la app. Las pantallas se arman con template literals (`renderHoy`, `renderEntreno`, `renderListen`, `renderCuerpo`, `renderMas`), con `render()` y `renderNow()`. Los paneles se abren con `openSheet({view,…})` y se dibujan en `renderSheetBody()`. Hay un solo manejador de clics global (por `id` o por `data-*`).
- `js/firebase.js`: inicio de sesión con Google y Apple (`OAuthProvider("apple.com")`), Firestore y `localBackend()` para el modo sin cuenta (guarda en `localStorage` `scaeli-fit-local`).
- `js/personaje.js`: el personaje compartido con Daily. `css/app.css` + `css/daily.css`.
- `data/`: `foods.json` + `foods_extra.json` (alimentos argentinos y USDA), `catalogo.js` (101 ejercicios), `ilus.js` (ids con dibujo), `rosario.js`, `ejercicios.js` (sprites viejos, ya no se muestran).
- `assets/ilus/ej/<id>-a.svg|-b.svg`: dibujos Everkinetic (CC BY-SA 4.0) como máscaras, en dos poses que se alternan. Mapa en `tools/ilus/mapa.json`. Las URL van absolutas (`ILU_BASE`). `press-hombros-maquina` no tiene dibujo a propósito.
- `assets/ilus/daily_*.png`: fondos del personaje y misterios, copiados de Daily.
- `sw.js`: caché `VERSION = "scaeli-fit-v13"`. **Subir una unidad en cada entrega.**
- `firestore.rules`: reglas unificadas de las tres apps (`users`, `grupos` con `mensajes`, `codes`). Nunca publicar reglas sin las tres secciones; la copia maestra está en Daily.

## Datos en Firestore (`users/{uid}/…`)
`days/{fecha}` (comidas, `type` gym/descanso, `check`, `vals {pasos,sueno,agua}`) · `workouts/{fecha}` (`routineId`, `sets`, `startedAt`, `pausedAt`, `pausedMs`, `autoPaused`, `offered`, `intention`, `done`, `summary`) · `body/{fecha}` · `foods`, `combos`, `recipes`, `tracks` · `settings/` `profile`, `targets`, `routines`, `loads`, `prs`, `progress` (XP), `plus`, `fast`, `fasts` (historial), `intents`, `hidden`, `equipo`, `grupo` ({gid}) · compartidos con Daily: `daily_settings/profile` (personaje, `fondo`, `rosSolo`) y `daily_settings/rosario` (avance del Rosario).

## Qué hace hoy (v13)
- **Grupo de perseverancia** propio de Fit (grupos con `tipo:"entreno"`): misión semanal, ranking por XP y quién entrenó hoy. **Historial** de entrenos con resumen y borrado; **Descartar** el entreno en curso. Programas de casa: full body 3, torso/piernas 4 (según equipo), solo mancuernas 3, 30 minutos y sin equipo 4.
- **Mi equipo**: cada usuario marca lo que tiene; el catálogo prioriza lo posible y los programas de casa (full body 3 días, torso/piernas 4 días) se arman solos con ese equipo. Mancuernas en «kg c/u».
- **Hoy**: calorías y macros por tipo de día, comidas con buscador rápido (solo se redibuja la lista, hasta 60 resultados) y «Cargar a mano». Favoritos, recetas y porciones caseras. Tarjeta **Tu día** (proteína automática; pasos, sueño y agua con panel explicativo y − / +; creatina con tilde). Ayuno Plus (16:8, 18:6, 20:4, OMAD, eclesiástico) con anillo, hora editable, historial y pantalla de «Ayuno cumplido». Calendario litúrgico (ayuno, abstinencia, tiempos).
- **Entreno**: ofrecer el entreno con intención; Comenzar, Pausar/Seguir y Terminar, con tope de 3 h si queda abierto. Series con kg, reps, RIR y «me costó»; peso sugerido con doble progresión. Descanso con anillo, +30 s y Saltar. Dibujos animados por ejercicio y ficha. Récords (PR, 1RM estimado). Resumen al terminar. Rutinas: mías, programas (6), catálogo de 101 ejercicios y rutina nueva. Rosario compacto entre series (cuenta y misterio, «Ver oración» opcional).
- **Escuchar** (pestaña): música propia (subir archivo o enlace) y el Rosario a pantalla completa.
- **Cuerpo**: peso diario, promedio de 7 días, cintura y consejo de ajuste. Plan de 90 días desde el 24/10/2026.
- **Yo**: personaje con el fondo elegido en Daily, nivel y XP, insignias, ayunos, Scaeli+, ajustes, recetas, alimentos, objetivos, rutinas, datos (exportar e importar).
- **XP**: entreno 50 (+20 si se ofrece) · rosario 30 · ayuno 15 · tres comidas 10 · pesaje 5. Niveles: Principiante 0 · Intermedio 300 · Avanzado 900 · Experto 2000 · Maestro 4000.
- **Scaeli+**: compartido con Daily (`settings/plus`). El correo del equipo se activa solo; códigos `SCAELI-LORENZO` y `PRUEBA-7D`. Ver `claude/SCAELI_PLUS_COMPARTIDO.md` en el proyecto.
- **Íconos**: pixel art con llama dorada sobre la escalera y fondo ámbar (Fit), hermano del de Daily (libro, fondo azul). El zip de íconos de Daily quedó entregado pero **falta subirlo al repo de Daily**.

## Cómo probar y entregar
1. `node --check js/app.js js/firebase.js`.
2. Servidor local: `python3 -m http.server 8765` en el repo.
3. Playwright (ya instalado, `require('playwright')`): poner `localStorage` `fit_local=1` y sembrar `scaeli-fit-local` con `settings/profile`, `settings/plus`, `settings/fast` y `daily_settings/profile` para entrar sin cuenta. Recorrer Hoy, Entreno, Escuchar, Cuerpo y Yo con 0 errores de consola y 0 respuestas 4xx, a 360, 375 y 390 px, y verificar que nada se salga de su tarjeta.
4. Subir `VERSION` en `sw.js` y anotar la versión en `README.md`.
5. Commit con las líneas de atribución, `git pull --rebase` y `git push`. Esperar hasta que https://ldiazvidela.github.io/scaeli-fit/sw.js muestre la versión nueva.
6. Mandar una imagen de vistazo y responder en pocas líneas qué se hizo y qué se decidió.

## Pendiente
- **Comidas por foto** (Scaeli+, con tope diario): requiere Firebase Blaze, una Cloud Function y una clave de API de un modelo de visión. Espera la decisión de Lorenzo.
- **App nativa** (Capacitor + RevenueCat) para las tiendas: lectura de Apple Health / Health Connect (pasos y sueño en «Tu día»), compras de Scaeli+ y contador de pasos.
- Activar Apple como proveedor en Firebase Authentication (requiere cuenta de Apple Developer).
- Subir los íconos pixel art al repo de Daily.
- Páginas legales propias de Fit (`terminos.html` y `privacidad.html` todavía son copias de Daily).
- Recomendador de rutinas por objetivo (Plus). Muro de mensajes en el grupo de Fit (Daily ya lo tiene).
- Dibujos fieles para los ejercicios sin ilustración (por ejemplo, press de hombros en máquina).
- Lo que Lorenzo anote después de su primer entreno con la app (3/11).
