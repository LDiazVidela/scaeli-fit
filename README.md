# Scaeli Fit

**Ordenar el cuerpo desde la templanza.** Comidas y macros, entrenamiento ofrecido con temporizador de descanso, peso y cintura, música y rosario para el gym. Hermana de [Scaeli](https://github.com/LDiazVidela/scala-paradisi), el juego católico.

App web instalable (PWA), sin servidor propio: los datos de cada persona viven en su cuenta de Google a través de Firebase.

## Usar la app

1. Abrí la dirección publicada (GitHub Pages de este repositorio) desde el celular.
2. Entrá con tu cuenta de Google.
3. Agregala a la pantalla de inicio: en iPhone, Compartir → **Agregar a inicio**; en Android, el menú del navegador → **Instalar app**.

La primera vez pide tus datos (edad, altura, peso, actividad, objetivo, si tenés balanza) y calcula tus calorías y macros. Todo se puede ajustar después en **Más**.

## Qué hace

- **Hoy** — comidas con búsqueda de 247 alimentos argentinos, carga en gramos, unidades o **porciones caseras** (taza, cucharada, palma, rodaja) para quien no tiene balanza; favoritos; copiar el día anterior; checklist (proteína, creatina, pasos, agua, sueño). La fecha muestra el **tiempo litúrgico**: los viernes de Cuaresma marcan abstinencia (la carne se atenúa y la cena sugiere un plato del tiempo), Miércoles de Ceniza y Viernes Santo marcan ayuno.
- **Recetas** — cargás los ingredientes de tu comida casera, cuántas porciones salen (o el peso total cocido) y la receta pasa a ser un alimento propio con sus macros exactos. Se puede marcar apta para abstinencia.
- **Entreno** — antes de empezar, una oración breve y la intención por la que ofrecés la sesión. Cuatro rutinas (Upper A/B, Lower A/B), series con kg × reps × RIR, "me costó", progresión conservadora (+2,5 / +5 kg solo si se cumplió el rango con RIR ≥ 2), **temporizador de descanso** automático (3:00 músculos grandes, 1:30 chicos) que sigue visible al cambiar de pestaña.
- **Escuchar** — reproductor para tu música (subida a tu cuenta o por enlace) y **rosario guiado** con los misterios del día, cita, fruto y una meditación breve por misterio.
- **Cuerpo** — promedio de 7 días, gráfico de 13 columnas semanales con meta, cintura, ritmo semanal y consejo de ajuste de calorías.
- **Más** — alimentos, objetivos, meta de peso, favoritos, rutinas (series, reps, salto, descanso), intenciones, exportar e importar todos tus datos, modo claro.

## Cómo está hecha

- HTML, CSS y JavaScript sin frameworks ni compilación. `index.html` + `css/app.css` + `js/app.js` + `js/firebase.js`.
- **Firebase**: Authentication (Google), Firestore con caché local (funciona sin señal y sincroniza después), Storage para la música. Proyecto `scaeli`, compartido con el juego.
- `data/foods.json`: base de alimentos compartida, de solo lectura. Lo que cada persona agrega u oculta queda en su cuenta.
- `sw.js` + `manifest.webmanifest`: instalable y disponible sin conexión.
- Tipografía Bricolage Grotesque; paleta grafito + ámbar.

### Datos en Firestore

Todo bajo `users/{uid}/`:

| Colección / documento | Contenido |
| --- | --- |
| `days/{AAAA-MM-DD}` | `{date, type, entries[], check{}}` — cada entrada guarda sus macros ya calculados |
| `foods/{id}` | alimentos propios por 100 g; las recetas generan `foods/rec-{id}` con `unitG` = gramos por porción |
| `recipes/{id}` | `{name, items[], portions, cookedG, lent}` |
| `combos/{id}` | favoritos `{name, meal, items[]}` |
| `workouts/{AAAA-MM-DD}` | `{routineId, sets{exId:[{w,r,rir,hard}]}, done, intention, offered}` |
| `body/{AAAA-MM-DD}` | `{weight?, waist?}` |
| `tracks/{id}` | `{name, url, path, order}` |
| `settings/targets` | `{gym, rest, goal}` · `settings/profile` · `settings/routines` · `settings/loads` · `settings/intents` · `settings/hidden` |

## Configuración de Firebase (una sola vez)

En la consola de Firebase del proyecto `scaeli`:

1. **Authentication → Sign-in method → Google**: habilitado.
2. **Authentication → Settings → Dominios autorizados**: agregar `ldiazvidela.github.io` (y el dominio propio si se usa).
3. **Firestore Database → Reglas**: pegar el contenido de [`firestore.rules`](firestore.rules) y publicar.
4. **Storage → Reglas**: pegar el contenido de [`storage.rules`](storage.rules) y publicar.

Sin las reglas publicadas, la app muestra "La base de datos rechazó la operación".

## Publicar

GitHub Pages desde la rama `main`, carpeta raíz. Cada `push` actualiza la app; el service worker toma la versión nueva al recargar.

## Licencia

Código: MIT. Textos de oraciones y meditaciones: libres para uso personal y pastoral.

## Sprites de ejercicios (pixel art)

Las animaciones viven en `assets/ejercicios/<id>/<id>.png` (spritesheet horizontal) + `<id>.json` (tamaño de cuadro, cantidad, línea de piso). Pantalla de prueba: `sprites.html`.

Para sumar un ejercicio nuevo:
1. Exportá el personaje desde PixelLab (ZIP con `metadata.json`), con la animación del ejercicio ya generada.
2. Corré `python3 tools/pixellab2sheet.py <archivo.zip> <id-del-ejercicio> --dir east` (nombre en minúsculas con guiones, ej. `peso-muerto-rumano`). Genera el PNG y el JSON en `assets/ejercicios/<id>/` y avisa si los pies no quedan en la misma línea.
3. Registralo en `data/ejercicios.js`: `"<id>": { nombre, fps: 8, inicio: 1, espejar: false }` (`inicio: 1` saltea el cuadro quieto que agrega PixelLab).
4. Abrí `sprites.html`, elegí el ejercicio y revisá loop, FPS y espejado. Listo: la app lo usa desde el mismo registro.

## Plus y códigos de acceso

Las funciones Plus (ayuno con planes) se desbloquean con un código. Los códigos se crean en la consola de Firebase, colección `codes`, un documento por código (el id es el código, en mayúsculas):

```
codes/SCAELI-LORENZO   { label: "Lorenzo", days: 0, max: 0, uses: 0 }
codes/PRUEBA-7D        { label: "prueba", days: 7, max: 20, uses: 0, until: "2027-03-31" }
```

- `days`: duración en días (0 = para siempre). `max`: cantidad de canjes permitidos (0 = sin límite). `until`: fecha límite para canjearlo (opcional).
- Hay que publicar `firestore.rules` (incluye la regla de `codes`).
- El estado queda en `users/{uid}/settings/plus`.

## Modo demo

`index.html?demo=1` abre la app con una sesión en memoria, sin Google ni Firestore (nada se guarda). El código Plus del demo es `DEMO`.

## Compartido con Scaeli Daily

- `docs/SCAELI_PLUS_COMPARTIDO.md`: contrato de Scaeli+ (una suscripción para las dos apps), códigos, grupos y avatar.
- `firestore.rules`: reglas únicas del proyecto (users, grupos, codes). Idénticas en los dos repos.
- `js/personaje.js`, `assets/avatar/`, `data/rosario.js`, `assets/ilus/`, `css/daily.css`: copiados de Daily sin cambios; se actualizan desde Daily.
- El avatar se edita en Daily (`users/{uid}/daily_settings/profile`); Fit solo lo lee. El avance del Rosario también se comparte (`daily_settings/rosario`).

## Rutinas: biblioteca y propias (2026-11-02)
- En Entreno, el **+** junto a las rutinas abre *Rutinas*: **Mis rutinas** (usar hoy, agregar/quitar ejercicios, borrar), **Biblioteca** (programas preseteados en `PROGRAMAS`, armados con ids del catálogo) y **Nueva** (nombre, día y ejercicios del catálogo con filtro por grupo).
- Un programa reemplaza `settings/routines`; las cargas (`settings/loads`) se conservan por id de ejercicio.
- Ejercicios de tiempo llevan `tiempo:true` (plancha, etc.); `step:0` sin `tiempo` es peso corporal por reps.
- Descanso: el anillo del encabezado se toca para empezar/parar; tarjeta de descanso con +30 s y Saltar; «Rezar» abre el rosario compacto (mismo avance que Daily, `daily_settings/rosario`).
- Login con Apple: requiere activar Apple en Firebase → Authentication → Sign-in method (cuenta Apple Developer). Hasta entonces el botón informa el error.
- Ícono iOS: `icons/fit-ios-180.png` (arte con margen, como Daily). Caché `scaeli-fit-v8`.

## Ronda 2026-11-02 (tarde)
- Dibujos de ejercicios: Everkinetic (CC BY-SA 4.0) como máscaras SVG en `assets/ilus/ej/<id>-a|b.svg`, pintadas con `currentColor` y alternando dos poses (`.ilu`). Mapa catálogo→Everkinetic en `tools/ilus/mapa.json`; lista de ids con dibujo en `data/ilus.js`. Los sprites PixelLab quedan en el repo pero no se muestran.
- Sesión de entrenamiento: `workout.startedAt` (botón Comenzar o al marcar la primera serie), cronómetro, Terminar → `workout.summary` {dur,sets,vol,ex[],prs[]} y pantalla de resumen. Récords por ejercicio en `settings/prs` {w,r,e1rm,date} (e1RM = Epley).
- Ayuno: hora de inicio editable (`fastedit`). Hoy: botón «Volver a hoy» en la tarjeta; el render conserva el scroll.

## Versión 10 (2026-11-02, mediodía)
- **Búsqueda rápida**: al escribir se redibuja solo la lista de resultados (no el panel), la base se ordena y normaliza una sola vez, y se muestran hasta 60 resultados. En el modo sin cuenta, el guardado local avisa solo a quien mira ese documento.
- **Cargar a mano** (al final de cualquier búsqueda): nombre, calorías y macros; con gramos se guarda por 100 g, sin gramos como «1 porción». Se puede guardar en «mis alimentos».
- **Ayuno**: historial en `settings/fasts` (`{list:[{date,plan,ms,done}]}`, últimos 60), pantalla «Ayuno cumplido» con horas, plan y XP, y mensaje sobrio si se corta antes. XP: ayuno cumplido 15 (`XP.fast`); el eclesiástico cuenta como cumplido con más de 1 h. Yo → Ayunos lista los últimos 10.
- **XP**: entreno 50 (+20 ofrecido) · rosario 30 · ayuno 15 · comidas 10 · pesaje 5.
- **Hoy**: los iconos del checklist llevan su nombre; la fecha va arriba en grande (`.eyebrow.fecha`) y «Día N de 90» y el tiempo litúrgico pasan a etiquetas. En la app instalada hay más aire arriba.
- **Yo**: personaje centrado, con el fondo elegido en Daily (`daily_settings/profile.fondo`; imágenes `assets/ilus/daily_<fondo>.png`, copiadas de Daily).
- **Escuchar** es una pestaña (sin panel ni animación), con «Agregar pista» como tarjeta aparte.
- **Entreno**: botón Pausar/Seguir (`workout.pausedAt`, `workout.pausedMs`; la duración los descuenta), el anillo dice siempre «Descanso», «Agregar ejercicio» al final de la rutina, y la fecha en el título. Rosario compacto: solo cuenta y contemplación del misterio, con «Ver oración» opcional; al pasar la cuenta se redibuja solo esa tarjeta.
- **Catálogo**: pestaña en Rutinas con los 101 ejercicios; al tocar uno se elige a qué rutina va.
- **Dibujos**: se quitó `press-hombros-maquina` (mostraba una barra). Queda sin dibujo hasta tener uno fiel.
- **Íconos nuevos** (pixel art, familia con Daily): llama dorada sobre la escalera, fondo ámbar. `icons/fit-*.png`, maskable con margen; el de Daily (libro, fondo azul) se entrega aparte para subir a ese repo.
- Caché del service worker: `scaeli-fit-v10`.

## Versión 11 (2026-11-02, tarde)
- **Tu día** (reemplaza la fila de iconos): tarjeta con título y explicación; cada ítem muestra nombre, valor y meta, con barra de avance. Proteína se calcula sola con las comidas; pasos, sueño y agua se cargan tocando (panel con qué es, para qué sirve, botones − / + y meta); creatina es un tilde. Se guarda en `days/{fecha}.vals` (`{pasos,sueno,agua}`) y `check[k]` queda en `true` al llegar a la meta. Metas: 10.000 pasos, 8 h, 2,5 L (`DIA` en app.js). Pie: en la versión de tiendas, pasos y sueño vendrán de Apple Health / Google Fit.
- **Tarjeta de sesión**: el cronómetro arriba y los botones abajo (Pausar/Seguir como ícono y Terminar), sin salirse de la tarjeta. Formato h:mm:ss pasada la hora.
- **Tope de 3 h**: un entreno que quedó abierto se frena solo a las 3 h (`workout.autoPaused`); si no tenía series, se reinicia.
- **Bordes**: nada se sale de la pantalla (revisado a 360, 375 y 390 px); en la app instalada, más margen a los costados y arriba para las esquinas redondeadas del teléfono.
- Caché del service worker: `scaeli-fit-v11`.

## Versión 12 (2026-11-04)
- **Mi equipo** (`settings/equipo`, `{list:[…]}`): gimnasio, mancuernas, barra, soportes/rack, banco plano, banco inclinable, barra de dominadas, kettlebell. Sin configurar se muestra todo. `reqDe(ejercicio)` dice qué necesita cada ejercicio (el inclinado pide banco inclinable; la sentadilla y el press con barra piden rack; máquinas, poleas, paralelas y rueda abdominal piden gimnasio). En el catálogo van primero los que podés hacer y después «Con otro equipo», atenuados y con lo que falta.
- **Programas de casa** que se arman con el equipo (`programasCasa()`): «full body 3 días» y «torso / piernas 4 días». Cada lugar tiene opciones en orden (por ejemplo sentadilla con barra → goblet → sin peso). Si el programa es de casa y no hay equipo cargado, primero se pide. Las rutinas guardan `prog` y `eq`; si el equipo cambia, Programas ofrece «Actualizar».
- **Mancuernas**: «kg c/u» en la columna y en el sugerido, saltos de hasta 2 kg y aviso de usar el peso más cercano y sumar repeticiones.
- **Pulido**: barra de abajo con nombres; rutinas en una fila deslizable; Salir · Rutinas · Rezar en una fila; tarjeta de sesión en una línea; descanso con el ejercicio en chico; «Elegí» en vez de «— kg»; mensajes flotantes de una línea; Cuerpo y Escuchar con estado vacío; cita del ayuno con la referencia aparte; X del catálogo arriba a la derecha; ícono propio de proteína.
- Caché del service worker: `scaeli-fit-v12`.

## Versión 13 (2026-11-06)
- **Descartar entreno**: botón con tacho en la tarjeta en curso → panel de confirmación; borra `workouts/{fecha}` sin XP ni récords.
- **Historial**: Yo → Entrenamientos (últimos 3 y «Ver todos»), con resumen por día (rutina, duración, series, volumen, récords, XP) y «Borrar este entreno», que descuenta la XP (`unawardWorkout`). El resumen ahora guarda `name`, `intention` y `xp`.
- **Grupo de perseverancia** (`settings/grupo` = `{gid}`; `grupos/{gid}` con `tipo:"entreno"`, que Daily oculta): crear, unirse con código de 8 letras, compartir, salir. Cada miembro publica `{n, s:{lunes:{e,m,o,x}}, hoy:{f,ok}}`. Misión semanal rotativa (3 entrenos, 120 min u 2 ofrecidos por persona, sumados entre todos) y ranking por XP de Fit. Sin cuenta, el grupo queda local (`scaeli-fit-grupos`). Las reglas de Firestore existentes ya lo permiten.
- **Más rutinas de casa**: «solo mancuernas 3 días», «30 minutos» y «sin equipo 4 días» (fijas, no dependen de Mi equipo).
- **Logo nuevo** (ilustración del arco con la mancuerna): ícono de inicio recortado al arco, sin texto; logo completo en el login.
- **Prolijidad**: tarjeta del entreno en dos filas (tiempo arriba; descartar, pausa y Terminar abajo), «Personalizar en Scaeli Daily» como tarjeta, revisión de desbordes a 360/375/390 px.
- Caché: `scaeli-fit-v13`.

## Versión 14 (2026-11-06)
- **Color de Fit: verde** (el de la mancuerna del ícono). `--accent` #9CCB3B en oscuro y #4E7F14 en claro. El dorado queda en `--fe` y se aplica solo a lo de la fe y Scaeli+ (ofrecer, Rosario y su botón, Scaeli+, ayuno cumplido) redefiniendo `--accent` dentro de esos contenedores; los paneles llevan `data-view` para eso.
- Caché: `scaeli-fit-v14`.

## Versión 15 (2026-11-07)
- **Modo entreno** (`focoActivo()`): con la sesión en marcha, pantalla completa (sin barra de abajo), barra fija con cronómetro, anillo de descanso y pausa; un ejercicio por vez (`exIdx`) con puntos de avance, Anterior / Siguiente, «Ver todos» (panel `exlist`, también para agregar ejercicio) y Rezar · Descartar · Terminar. La flecha sale sin cortar el entreno; el botón ↑ de la tarjeta vuelve. Pantalla siempre encendida (Wake Lock).
- **Series confirmadas**: una serie cuenta solo con «Hecha» (`ok:true`; las viejas sin `ok` cuentan si tienen reps, helper `hecha()`). Los valores sugeridos van en gris; confirmada, la fila queda fija y verde (tocar de nuevo para editar). El fuego pasó a **«Costó»**, con una línea que lo explica.
- **Descanso persistente** (`scaeli-fit-timer` en localStorage): si el sistema cierra la app, al volver sigue con el tiempo real o avisa «Descanso listo».
- **Guardado en Firestore**: `userBackend.setDoc` limpia los campos `undefined` (Firestore tiraba error y no guardaba, por ejemplo al agregar un ejercicio a mitad del entreno).
- **Oración antes de entrenar** centrada y a pantalla completa.
- **Rangos de fuerza** (Hierro → Bronce → Plata → Oro → Platino → Diamante) por grupo (pecho, espalda, piernas, posterior, hombros, brazos) y general: mejor 1RM estimado de los básicos × factor (mancuernas por mancuerna, máquinas) / peso corporal; umbrales ×0,65 para mujeres. Tarjeta en Yo con lo que falta para el próximo; «¡Subiste de rango!» en el resumen; escudo en el ranking del grupo (`rg`).
- **Armame una rutina** (`armarPrograma`, `armarSesion`): objetivo, días, minutos y prioridad → programa completo (cuerpo completo / torso-piernas / PPL según días, la versión B elige variantes) o sesión suelta de hoy; usa Mi equipo. Sin IA.
- Caché: `scaeli-fit-v15`.

## Versión 16 (2026-11-07)
- **Armame una rutina con varios músculos**: hasta 3 (`o.prios`), en la sesión de hoy y en el programa. En la sesión, el primero elegido lleva más ejercicios (peso 2, resto 1; ej. espalda y bíceps en 60 min = 3 + 2 + core). Se suman Bíceps y Tríceps como opciones.
- Caché: `scaeli-fit-v16`.

## Versión 17 (2026-11-07)
- **Técnica de los 101 ejercicios** (`data/tecnica.js`: 3 claves + error común). Plegable «Técnica» bajo el nombre del ejercicio (abierta o cerrada se recuerda en el modo entreno; en la ficha va abierta).
- **Pantalla completa más limpia**: el descanso va dentro de la barra fija (anillo + franja con +30 s y Saltar), sin la tarjeta duplicada; barra más baja; Anterior con borde; leyenda de Hecha/Costó solo hasta el primer entreno terminado y sin el «Primera vez…» repetido.
- **Sugeridos por serie**: cada serie copia peso y reps de la última cargada (`baseSerie`), también al confirmar con Hecha.
- Caché: `scaeli-fit-v17` (incluye `data/tecnica.js`).
