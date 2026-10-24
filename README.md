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
