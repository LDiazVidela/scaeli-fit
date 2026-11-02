# Scaeli+ compartido · contrato entre Scaeli Daily y Scaeli Fit

Versión 1 · 2026-11-01. Este archivo es el acuerdo entre las dos apps. Los dos repos llevan una copia idéntica
(`scaeli-daily/docs/SCAELI_PLUS_COMPARTIDO.md` y `scaeli-fit/docs/SCAELI_PLUS_COMPARTIDO.md`). Si una app
necesita cambiar algo, cambia este archivo primero, sube la versión y la otra app se adapta.

## 1. Principio

Una sola suscripción, **Scaeli+**, vale para las dos apps. Quien la contrata en Daily es Plus en Fit y al revés.
La oración y lo básico de cada app son gratis siempre. El nombre es siempre «Scaeli+» (nunca «Fit Plus» ni «Daily Plus»).

## 2. Identidad

Las dos apps usan el mismo proyecto Firebase (`scaeli`) y el mismo usuario (uid de Firebase Auth, Google o Apple).
Esa es la llave que une todo: el estado Plus, los grupos y los códigos están atados al uid.

## 3. Fuente de verdad del estado Plus

Documento Firestore: **`users/{uid}/settings/plus`**

```json
{
  "active": true,
  "source": "store" | "code" | "team",
  "plan": "mensual" | "anual" | null,
  "code": "SCAELI-LORENZO",          // solo si source = code
  "since": "2026-11-01",              // fecha de alta, YYYY-MM-DD
  "until": "2027-11-01" | null,       // vencimiento; null = sin vencimiento (equipo o código permanente)
  "app": "daily" | "fit",             // qué app escribió este documento por última vez
  "updated": 1762045800000            // Date.now() de la última escritura
}
```

Regla de lectura, idéntica en las dos apps:

```
esPlus = doc existe && doc.active === true && (doc.until == null || doc.until >= hoy)
```

Quién escribe:
- **Al confirmar una compra en tienda** (RevenueCat devuelve el entitlement `plus` activo): la app que vendió escribe el documento con `source: "store"`, `plan`, `until` = fecha de expiración que informa RevenueCat (o `null` si no la informa).
- **Al canjear un código**: la app que canjeó escribe `source: "code"`, `code`, `until` según `days` del código.
- **Equipo** (email del dueño del proyecto): la app escribe `source: "team"`, `until: null` la primera vez que detecta el email.
- Cada app **también escucha** el documento en tiempo real (`onSnapshot`) y actualiza su interfaz; así un cambio hecho en una app se ve en la otra sin reiniciar.
- Si RevenueCat dice «sin entitlement» pero el documento dice `source: "store"` y `until` vencido, la app lo marca `active: false` (solo cuando `source` es `store`; nunca pisa `code` ni `team`).

Las reglas de Firestore ya permiten esto: cada usuario lee y escribe lo suyo bajo `users/{uid}/…`.

## 4. RevenueCat (tiendas)

- **Un solo proyecto de RevenueCat** con dos apps adentro (Daily Android, Daily iOS, Fit Android, Fit iOS).
- **Un solo entitlement: `plus`.** Los productos de las dos apps se adjuntan al mismo entitlement.
- **App User ID = uid de Firebase.** Las dos apps llaman `Purchases.logIn(uid)` al iniciar sesión (Daily ya hace
  `comprasIniciar(uid)`; Fit hará lo mismo). Así RevenueCat ve al mismo cliente desde las dos apps.
- Productos (ya definidos por Daily, Fit los reutiliza tal cual):
  - App Store: grupo «Scaeli+», `scaeli_plus_mensual` (USD 2,99), `scaeli_plus_anual` (USD 19,99).
  - Play: suscripción `scaeli_plus` con planes base `mensual` y `anual`.
  - En Play, cada app tiene su propio listado de productos; se crean con los **mismos ids** en la ficha de Fit.
- Texto de la pantalla de compra, igual en las dos: «La oración es gratis siempre. Scaeli+ te ayuda a ver tu
  camino y a sostenerlo.» · «Anual USD 19,99 por año · Ahorrás 44 %» · «Mensual USD 2,99 por mes» · «Restaurar compras».

## 5. Códigos (web y pruebas)

Colección raíz **`codes/{CODIGO}`**, compartida. Documento:

```json
{ "label": "para quién", "days": 0, "max": 0, "uses": 0, "until": "2027-03-31" }
```

- `days`: duración en días del Plus que otorga (0 = sin vencimiento). `max`: canjes permitidos (0 = sin límite).
  `until`: fecha límite para canjearlo (opcional).
- Canje: la app lee el documento (`getDoc`), valida `max`/`until`, incrementa `uses` (`increment(1)`), y escribe
  `users/{uid}/settings/plus` con `source: "code"`.
- Reglas ya publicadas: lectura con sesión; actualización solo del campo `uses` en +1; nadie crea ni borra desde la app.
- Códigos existentes: `SCAELI-LORENZO` (permanente, sin límite), `PRUEBA-7D` (7 días, 20 usos, hasta 2027-03-31).
- Daily reemplaza su código fijo `SCAELI-PRUEBA` por esta colección (puede crearse `SCAELI-PRUEBA` como documento
  para no romper nada). Los códigos se aceptan **solo en la web**, nunca en las apps de tienda (política de Apple).

## 6. Equipo

Lista única de emails con acceso completo, en las dos apps: `["lorenzodiazvidela@gmail.com"]`.
Ambas conservan el botón «Ver la app como usuario gratis» (guardado local, no toca Firestore).

## 7. Qué incluye Scaeli+ (para que las dos pantallas lo digan igual)

| En Daily | En Fit |
|---|---|
| Tu progreso y tus virtudes | Ayuno con planes y ventanas |
| Caminos guiados (Adviento, Cuaresma…) | Rutinas recomendadas por objetivo |
| Tu año con Dios en historias | Escaneo de comidas por foto (con tope diario) |
| | Informes mensuales y más avatares |

Gratis siempre: rezar, el Evangelio, las Horas y el rosario (Daily); registrar comidas, la base de alimentos,
el código de barras, las rutinas con el personaje, el rosario y la música (Fit).

## 8. Grupos

La colección `grupos/{gid}` y `grupos/{gid}/miembros/{uid}` (reglas de Daily 1.8) la usan las dos apps.
Fit agrega el campo `tipo: "entreno"` en el grupo para distinguirlo de los de perseverancia; Daily ignora ese campo.

## 9. Reglas de Firestore

Un único archivo `firestore.rules`, idéntico en los dos repos, con las secciones `users`, `grupos` y `codes`.
**Nunca publicar las reglas desde un repo que no tenga las tres secciones.** (El 2026-11-01 Fit publicó sin `grupos`
y Daily quedó sin permisos 18 minutos; se corrigió a las 22:29.)

## 10. Lo que cada app tiene que hacer ahora

Daily:
1. `esPlus()` pasa a leer `users/{uid}/settings/plus` con `onSnapshot` (además de RevenueCat/local como respaldo).
2. Al comprar, restaurar o detectar el email del equipo, escribir el documento (sección 3).
3. El código de prueba se canjea contra `codes/` (sección 5) y escribe el documento.
4. Copiar `firestore.rules` y este archivo al repo.

Fit:
1. Ya lee y escribe `users/{uid}/settings/plus` (código y equipo). Agregar `source`, `app`, `updated`.
2. Copiar de Daily la pantalla de Scaeli+ (textos, planes, «Restaurar compras», «Ver como gratis») y la pestaña «Yo».
3. Cuando se empaquete con Capacitor, usar `nativo.js` de Daily tal cual con `Purchases.logIn(uid)`.

## 11. Avatar compartido

- Fuente: **`users/{uid}/daily_settings/profile`** (campos `sx`, `prenda`, `peinado`, `alt`, `nombre`, `fondo`, como los escribe Daily hoy).
- **Daily edita, Fit solo lee.** Fit escucha el documento con `onSnapshot` y pinta el avatar con `personaje.js` y las hojas `assets/personaje/m.png` / `f.png` / `pj.json` de Daily, copiadas sin cambios al repo de Fit. Cuando Daily agregue prendas o peinados, manda las tres piezas nuevas a Fit.
- Fit muestra «Personalizar en Scaeli Daily» (abre la otra app) en lugar de un editor propio.
- Los sprites de ejercicios son del personaje deportivo y no cambian con la ropa de Daily. Lo único que Fit toma del perfil para los ejercicios es `sx`: con `sx: "f"` usa los sprites femeninos cuando existan.
- Si el documento no existe (usuario que empieza por Fit), Fit muestra el personaje base masculino y ofrece el botón para crearlo en Daily.
