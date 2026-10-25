// Catálogo de ejercicios de Scaeli Fit. Un ejercicio puede existir sin sprite: el sprite se agrega
// en data/ejercicios.js con el mismo id cuando el archivo existe.
//   id      : nombre de archivo del sprite (minúsculas, guiones)
//   app     : id histórico usado en las rutinas por defecto (null si es nuevo)
//   grupo   : pecho | espalda | hombros | piernas | gluteos | brazos | core | completo
//   equipo  : barra | mancuernas | maquina | polea | peso-corporal | kettlebell | banco
//   estado  : parado | sentado | banco (acostado boca arriba en banco) | piso (acostado en el piso) | prono | plancha | colgado | rodillas | inclinado
//   vista   : dirección de PixelLab
//   cuadros : 8 o 12
//   musc    : músculos principales
//   paso    : incremento de carga sugerido en kg (0 = sin carga)
//   rest    : descanso sugerido en segundos
export const CATALOGO = [
  // ---- Pecho ----
  { id: "press-banca", app: null, nombre: "Press de banca con barra", grupo: "pecho", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 12, musc: ["pectoral", "tríceps", "deltoide anterior"], paso: 2.5, rest: 180 },
  { id: "press-banca-mancuernas", app: null, nombre: "Press de banca con mancuernas", grupo: "pecho", equipo: "mancuernas", estado: "banco", vista: "south-east", cuadros: 8, musc: ["pectoral", "tríceps"], paso: 2, rest: 180 },
  { id: "press-inclinado-barra", app: null, nombre: "Press inclinado con barra", grupo: "pecho", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 8, musc: ["pectoral superior", "deltoide anterior"], paso: 2.5, rest: 180 },
  { id: "press-inclinado-mancuernas", app: null, nombre: "Press inclinado con mancuernas", grupo: "pecho", equipo: "mancuernas", estado: "banco", vista: "south-east", cuadros: 8, musc: ["pectoral superior"], paso: 2, rest: 180 },
  { id: "press-inclinado-maquina", app: "incl", nombre: "Press inclinado en máquina", grupo: "pecho", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["pectoral superior"], paso: 2.5, rest: 180 },
  { id: "chest-press-maquina", app: "chestpress", nombre: "Chest press en máquina", grupo: "pecho", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["pectoral", "tríceps"], paso: 2.5, rest: 180 },
  { id: "aperturas-mancuernas", app: null, nombre: "Aperturas con mancuernas", grupo: "pecho", equipo: "mancuernas", estado: "banco", vista: "south-east", cuadros: 8, musc: ["pectoral"], paso: 1, rest: 90 },
  { id: "aperturas-polea", app: null, nombre: "Aperturas en polea (cruce)", grupo: "pecho", equipo: "polea", estado: "parado", vista: "south", cuadros: 8, musc: ["pectoral"], paso: 2.5, rest: 90 },
  { id: "pec-deck", app: null, nombre: "Pec-deck (contractora)", grupo: "pecho", equipo: "maquina", estado: "sentado", vista: "south", cuadros: 8, musc: ["pectoral"], paso: 2.5, rest: 90 },
  { id: "flexiones", app: null, nombre: "Flexiones de brazos", grupo: "pecho", equipo: "peso-corporal", estado: "plancha", vista: "east", cuadros: 8, musc: ["pectoral", "tríceps", "core"], paso: 0, rest: 90 },
  { id: "flexiones-rodillas", app: null, nombre: "Flexiones con rodillas apoyadas", grupo: "pecho", equipo: "peso-corporal", estado: "plancha", vista: "east", cuadros: 8, musc: ["pectoral", "tríceps"], paso: 0, rest: 60 },
  { id: "fondos-paralelas", app: null, nombre: "Fondos en paralelas", grupo: "pecho", equipo: "peso-corporal", estado: "colgado", vista: "east", cuadros: 8, musc: ["pectoral inferior", "tríceps"], paso: 0, rest: 120 },
  { id: "press-declinado-barra", app: null, nombre: "Press declinado con barra", grupo: "pecho", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 8, musc: ["pectoral inferior"], paso: 2.5, rest: 180 },
  // ---- Espalda ----
  { id: "jalon-al-pecho", app: "latpull", nombre: "Jalón al pecho", grupo: "espalda", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["dorsal", "bíceps"], paso: 2.5, rest: 180 },
  { id: "jalon-agarre-cerrado", app: null, nombre: "Jalón agarre cerrado (neutro)", grupo: "espalda", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["dorsal", "bíceps"], paso: 2.5, rest: 180 },
  { id: "dominadas", app: null, nombre: "Dominadas", grupo: "espalda", equipo: "peso-corporal", estado: "colgado", vista: "south", cuadros: 8, musc: ["dorsal", "bíceps"], paso: 0, rest: 180 },
  { id: "dominadas-supinas", app: null, nombre: "Dominadas supinas (chin-up)", grupo: "espalda", equipo: "peso-corporal", estado: "colgado", vista: "south", cuadros: 8, musc: ["dorsal", "bíceps"], paso: 0, rest: 180 },
  { id: "remo-barra", app: null, nombre: "Remo con barra", grupo: "espalda", equipo: "barra", estado: "inclinado", vista: "east", cuadros: 8, musc: ["dorsal", "romboides", "bíceps"], paso: 2.5, rest: 180 },
  { id: "remo-mancuerna-un-brazo", app: null, nombre: "Remo con mancuerna a un brazo", grupo: "espalda", equipo: "mancuernas", estado: "inclinado", vista: "east", cuadros: 8, musc: ["dorsal", "bíceps"], paso: 2, rest: 120 },
  { id: "remo-maquina", app: "rowm", nombre: "Remo en máquina", grupo: "espalda", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["dorsal", "romboides"], paso: 2.5, rest: 180 },
  { id: "remo-polea-baja", app: "rowc", nombre: "Remo en polea baja (neutro)", grupo: "espalda", equipo: "polea", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["dorsal", "romboides"], paso: 2.5, rest: 180 },
  { id: "remo-t", app: null, nombre: "Remo T (barra apoyada)", grupo: "espalda", equipo: "barra", estado: "inclinado", vista: "east", cuadros: 8, musc: ["dorsal", "romboides"], paso: 5, rest: 180 },
  { id: "remo-invertido", app: null, nombre: "Remo invertido", grupo: "espalda", equipo: "peso-corporal", estado: "colgado", vista: "east", cuadros: 8, musc: ["dorsal", "romboides", "bíceps"], paso: 0, rest: 120 },
  { id: "peso-muerto", app: null, nombre: "Peso muerto convencional", grupo: "espalda", equipo: "barra", estado: "parado", vista: "east", cuadros: 12, musc: ["isquiotibiales", "glúteo", "espalda baja"], paso: 5, rest: 180 },
  { id: "peso-muerto-rumano", app: null, nombre: "Peso muerto rumano", grupo: "piernas", equipo: "barra", estado: "parado", vista: "east", cuadros: 8, musc: ["isquiotibiales", "glúteo"], paso: 2.5, rest: 180 },
  { id: "peso-muerto-sumo", app: null, nombre: "Peso muerto sumo", grupo: "piernas", equipo: "barra", estado: "parado", vista: "south", cuadros: 12, musc: ["glúteo", "aductores", "cuádriceps"], paso: 5, rest: 180 },
  { id: "pull-over", app: null, nombre: "Pull-over con mancuerna", grupo: "espalda", equipo: "mancuernas", estado: "banco", vista: "south-east", cuadros: 8, musc: ["dorsal", "pectoral"], paso: 2, rest: 90 },
  { id: "hiperextensiones", app: null, nombre: "Hiperextensiones (banco romano)", grupo: "espalda", equipo: "banco", estado: "prono", vista: "east", cuadros: 8, musc: ["espalda baja", "glúteo", "isquiotibiales"], paso: 0, rest: 90 },
  { id: "face-pull", app: null, nombre: "Face pull", grupo: "hombros", equipo: "polea", estado: "parado", vista: "south-east", cuadros: 8, musc: ["deltoide posterior", "romboides"], paso: 2.5, rest: 90 },
  { id: "encogimientos", app: null, nombre: "Encogimientos con mancuernas", grupo: "espalda", equipo: "mancuernas", estado: "parado", vista: "south", cuadros: 8, musc: ["trapecio"], paso: 2, rest: 90 },
  // ---- Hombros ----
  { id: "press-militar-barra", app: null, nombre: "Press militar con barra", grupo: "hombros", equipo: "barra", estado: "parado", vista: "south", cuadros: 8, musc: ["deltoide", "tríceps"], paso: 2.5, rest: 180 },
  { id: "press-militar-mancuernas", app: null, nombre: "Press de hombros con mancuernas", grupo: "hombros", equipo: "mancuernas", estado: "parado", vista: "south", cuadros: 8, musc: ["deltoide", "tríceps"], paso: 2, rest: 120 },
  { id: "press-hombros-maquina", app: "shpress", nombre: "Press de hombros en máquina", grupo: "hombros", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["deltoide"], paso: 2.5, rest: 90 },
  { id: "press-arnold", app: null, nombre: "Press Arnold", grupo: "hombros", equipo: "mancuernas", estado: "sentado", vista: "south", cuadros: 8, musc: ["deltoide"], paso: 2, rest: 120 },
  { id: "elevaciones-laterales", app: "latraise", nombre: "Elevaciones laterales", grupo: "hombros", equipo: "mancuernas", estado: "parado", vista: "south", cuadros: 8, musc: ["deltoide lateral"], paso: 1, rest: 90 },
  { id: "elevaciones-laterales-polea", app: null, nombre: "Elevaciones laterales en polea", grupo: "hombros", equipo: "polea", estado: "parado", vista: "south", cuadros: 8, musc: ["deltoide lateral"], paso: 2.5, rest: 90 },
  { id: "elevaciones-frontales", app: null, nombre: "Elevaciones frontales", grupo: "hombros", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 8, musc: ["deltoide anterior"], paso: 1, rest: 90 },
  { id: "pajaros", app: null, nombre: "Pájaros (vuelos posteriores)", grupo: "hombros", equipo: "mancuernas", estado: "inclinado", vista: "south", cuadros: 8, musc: ["deltoide posterior"], paso: 1, rest: 90 },
  { id: "posterior-hombro-pec-deck", app: "reardelt", nombre: "Posterior de hombro (pec-deck inverso)", grupo: "hombros", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["deltoide posterior"], paso: 2.5, rest: 90 },
  { id: "remo-al-menton", app: null, nombre: "Remo al mentón", grupo: "hombros", equipo: "barra", estado: "parado", vista: "south", cuadros: 8, musc: ["deltoide lateral", "trapecio"], paso: 2.5, rest: 90 },
  // ---- Piernas ----
  { id: "sentadilla-barra", app: null, nombre: "Sentadilla con barra", grupo: "piernas", equipo: "barra", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps", "glúteo"], paso: 5, rest: 180 },
  { id: "sentadilla-goblet", app: null, nombre: "Sentadilla goblet", grupo: "piernas", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps", "glúteo"], paso: 2, rest: 180 },
  { id: "sentadilla-frontal", app: null, nombre: "Sentadilla frontal", grupo: "piernas", equipo: "barra", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps"], paso: 5, rest: 180 },
  { id: "sentadilla-sin-peso", app: null, nombre: "Sentadilla sin peso", grupo: "piernas", equipo: "peso-corporal", estado: "parado", vista: "east", cuadros: 8, musc: ["cuádriceps", "glúteo"], paso: 0, rest: 60 },
  { id: "sentadilla-hack", app: "hack", nombre: "Sentadilla hack", grupo: "piernas", equipo: "maquina", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps"], paso: 5, rest: 180 },
  { id: "sentadilla-smith", app: null, nombre: "Sentadilla en Smith", grupo: "piernas", equipo: "maquina", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps", "glúteo"], paso: 5, rest: 180 },
  { id: "sentadilla-bulgara", app: null, nombre: "Sentadilla búlgara", grupo: "piernas", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 8, musc: ["cuádriceps", "glúteo"], paso: 2, rest: 120 },
  { id: "zancadas", app: null, nombre: "Zancadas", grupo: "piernas", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps", "glúteo"], paso: 2, rest: 120 },
  { id: "step-up", app: null, nombre: "Step-up al cajón", grupo: "piernas", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 8, musc: ["cuádriceps", "glúteo"], paso: 2, rest: 120 },
  { id: "prensa-45", app: "legpress", nombre: "Prensa 45°", grupo: "piernas", equipo: "maquina", estado: "banco", vista: "south-east", cuadros: 12, musc: ["cuádriceps", "glúteo"], paso: 5, rest: 180 },
  { id: "extension-cuadriceps", app: "legext", nombre: "Extensión de cuádriceps", grupo: "piernas", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["cuádriceps"], paso: 2.5, rest: 90 },
  { id: "curl-femoral-sentado", app: "seatcurl", nombre: "Curl femoral sentado", grupo: "piernas", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["isquiotibiales"], paso: 2.5, rest: 90 },
  { id: "curl-femoral-acostado", app: "lyingcurl", nombre: "Curl femoral acostado", grupo: "piernas", equipo: "maquina", estado: "prono", vista: "south-east", cuadros: 8, musc: ["isquiotibiales"], paso: 2.5, rest: 90 },
  { id: "buenos-dias", app: null, nombre: "Buenos días con barra", grupo: "piernas", equipo: "barra", estado: "parado", vista: "east", cuadros: 8, musc: ["isquiotibiales", "espalda baja"], paso: 2.5, rest: 120 },
  { id: "aductores-maquina", app: null, nombre: "Aductores en máquina", grupo: "piernas", equipo: "maquina", estado: "sentado", vista: "south", cuadros: 8, musc: ["aductores"], paso: 2.5, rest: 90 },
  { id: "abductores-maquina", app: "abd", nombre: "Abductores en máquina", grupo: "gluteos", equipo: "maquina", estado: "sentado", vista: "south", cuadros: 8, musc: ["glúteo medio"], paso: 2.5, rest: 90 },
  { id: "gemelos-de-pie", app: "calfstand", nombre: "Gemelos de pie", grupo: "piernas", equipo: "maquina", estado: "parado", vista: "east", cuadros: 8, musc: ["gemelos"], paso: 5, rest: 90 },
  { id: "gemelos-sentado", app: null, nombre: "Gemelos sentado", grupo: "piernas", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["sóleo"], paso: 5, rest: 90 },
  { id: "gemelos-en-prensa", app: "calfpress", nombre: "Gemelos en prensa", grupo: "piernas", equipo: "maquina", estado: "banco", vista: "south-east", cuadros: 8, musc: ["gemelos"], paso: 5, rest: 90 },
  // ---- Glúteo ----
  { id: "hip-thrust-maquina", app: "hipthrust", nombre: "Hip thrust", grupo: "gluteos", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 12, musc: ["glúteo mayor"], paso: 5, rest: 180 },
  { id: "puente-gluteo", app: null, nombre: "Puente de glúteo", grupo: "gluteos", equipo: "peso-corporal", estado: "piso", vista: "east", cuadros: 8, musc: ["glúteo mayor"], paso: 0, rest: 60 },
  { id: "patada-gluteo-polea", app: null, nombre: "Patada de glúteo en polea", grupo: "gluteos", equipo: "polea", estado: "parado", vista: "east", cuadros: 8, musc: ["glúteo mayor"], paso: 2.5, rest: 90 },
  { id: "kettlebell-swing", app: null, nombre: "Swing con kettlebell", grupo: "gluteos", equipo: "kettlebell", estado: "parado", vista: "east", cuadros: 8, musc: ["glúteo", "isquiotibiales"], paso: 4, rest: 90 },
  // ---- Brazos ----
  { id: "curl-biceps-barra", app: null, nombre: "Curl de bíceps con barra", grupo: "brazos", equipo: "barra", estado: "parado", vista: "east", cuadros: 8, musc: ["bíceps"], paso: 2.5, rest: 90 },
  { id: "curl-biceps-mancuernas", app: null, nombre: "Curl alternado con mancuernas", grupo: "brazos", equipo: "mancuernas", estado: "parado", vista: "south", cuadros: 8, musc: ["bíceps"], paso: 1, rest: 90 },
  { id: "curl-martillo", app: null, nombre: "Curl martillo", grupo: "brazos", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 8, musc: ["bíceps", "braquial"], paso: 1, rest: 90 },
  { id: "curl-biceps-maquina", app: "curlm", nombre: "Curl de bíceps en máquina", grupo: "brazos", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["bíceps"], paso: 2.5, rest: 90 },
  { id: "curl-predicador", app: null, nombre: "Curl predicador (banco Scott)", grupo: "brazos", equipo: "barra", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["bíceps"], paso: 2.5, rest: 90 },
  { id: "curl-inclinado", app: null, nombre: "Curl inclinado con mancuernas", grupo: "brazos", equipo: "mancuernas", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["bíceps"], paso: 1, rest: 90 },
  { id: "curl-concentrado", app: null, nombre: "Curl concentrado", grupo: "brazos", equipo: "mancuernas", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["bíceps"], paso: 1, rest: 60 },
  { id: "curl-polea", app: null, nombre: "Curl en polea baja", grupo: "brazos", equipo: "polea", estado: "parado", vista: "east", cuadros: 8, musc: ["bíceps"], paso: 2.5, rest: 90 },
  { id: "pushdown-polea-barra", app: "pushdown", nombre: "Pushdown en polea (barra)", grupo: "brazos", equipo: "polea", estado: "parado", vista: "east", cuadros: 8, musc: ["tríceps"], paso: 2.5, rest: 90 },
  { id: "triceps-polea-soga", app: "rope", nombre: "Tríceps en polea con soga", grupo: "brazos", equipo: "polea", estado: "parado", vista: "east", cuadros: 8, musc: ["tríceps"], paso: 2.5, rest: 90 },
  { id: "extension-triceps-polea", app: "ohext", nombre: "Extensión de tríceps sobre cabeza (polea)", grupo: "brazos", equipo: "polea", estado: "parado", vista: "east", cuadros: 8, musc: ["tríceps"], paso: 2.5, rest: 90 },
  { id: "extension-triceps-mancuerna", app: null, nombre: "Extensión de tríceps con mancuerna (sentado)", grupo: "brazos", equipo: "mancuernas", estado: "sentado", vista: "south", cuadros: 8, musc: ["tríceps"], paso: 2, rest: 90 },
  { id: "press-frances", app: null, nombre: "Press francés", grupo: "brazos", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 8, musc: ["tríceps"], paso: 2.5, rest: 90 },
  { id: "press-cerrado", app: null, nombre: "Press de banca agarre cerrado", grupo: "brazos", equipo: "barra", estado: "banco", vista: "south-east", cuadros: 8, musc: ["tríceps", "pectoral"], paso: 2.5, rest: 120 },
  { id: "patada-triceps", app: null, nombre: "Patada de tríceps", grupo: "brazos", equipo: "mancuernas", estado: "inclinado", vista: "east", cuadros: 8, musc: ["tríceps"], paso: 1, rest: 60 },
  { id: "fondos-banco", app: null, nombre: "Fondos en banco", grupo: "brazos", equipo: "peso-corporal", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["tríceps"], paso: 0, rest: 90 },
  { id: "curl-muneca", app: null, nombre: "Curl de muñeca", grupo: "brazos", equipo: "mancuernas", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["antebrazo"], paso: 1, rest: 60 },
  // ---- Core ----
  { id: "plancha", app: "plank", nombre: "Plancha", grupo: "core", equipo: "peso-corporal", estado: "plancha", vista: "east", cuadros: 8, musc: ["core"], paso: 0, rest: 60 },
  { id: "plancha-lateral", app: null, nombre: "Plancha lateral", grupo: "core", equipo: "peso-corporal", estado: "plancha", vista: "south", cuadros: 8, musc: ["oblicuos"], paso: 0, rest: 60 },
  { id: "abdominales-piso", app: null, nombre: "Abdominales (crunch)", grupo: "core", equipo: "peso-corporal", estado: "piso", vista: "east", cuadros: 8, musc: ["recto abdominal"], paso: 0, rest: 60 },
  { id: "abdominales-polea", app: "cableab", nombre: "Abdominales en polea", grupo: "core", equipo: "polea", estado: "rodillas", vista: "east", cuadros: 8, musc: ["recto abdominal"], paso: 2.5, rest: 90 },
  { id: "abdominales-maquina", app: null, nombre: "Abdominales en máquina", grupo: "core", equipo: "maquina", estado: "sentado", vista: "south-east", cuadros: 8, musc: ["recto abdominal"], paso: 2.5, rest: 90 },
  { id: "elevacion-piernas-piso", app: null, nombre: "Elevación de piernas acostado", grupo: "core", equipo: "peso-corporal", estado: "piso", vista: "east", cuadros: 8, musc: ["abdomen inferior", "flexores de cadera"], paso: 0, rest: 60 },
  { id: "elevacion-piernas-colgado", app: null, nombre: "Elevación de piernas colgado", grupo: "core", equipo: "peso-corporal", estado: "colgado", vista: "east", cuadros: 8, musc: ["abdomen inferior"], paso: 0, rest: 90 },
  { id: "bicho-muerto", app: null, nombre: "Bicho muerto (dead bug)", grupo: "core", equipo: "peso-corporal", estado: "piso", vista: "east", cuadros: 8, musc: ["core profundo"], paso: 0, rest: 60 },
  { id: "bicicleta", app: null, nombre: "Abdominales bicicleta", grupo: "core", equipo: "peso-corporal", estado: "piso", vista: "east", cuadros: 8, musc: ["oblicuos"], paso: 0, rest: 60 },
  { id: "russian-twist", app: null, nombre: "Giro ruso", grupo: "core", equipo: "peso-corporal", estado: "piso", vista: "south", cuadros: 8, musc: ["oblicuos"], paso: 0, rest: 60 },
  { id: "rueda-abdominal", app: null, nombre: "Rueda abdominal", grupo: "core", equipo: "peso-corporal", estado: "rodillas", vista: "east", cuadros: 8, musc: ["core"], paso: 0, rest: 90 },
  { id: "mountain-climbers", app: null, nombre: "Escaladores (mountain climbers)", grupo: "core", equipo: "peso-corporal", estado: "plancha", vista: "east", cuadros: 8, musc: ["core", "cardio"], paso: 0, rest: 60 },
  { id: "pallof-press", app: null, nombre: "Pallof press", grupo: "core", equipo: "polea", estado: "parado", vista: "south", cuadros: 8, musc: ["oblicuos", "core"], paso: 2.5, rest: 60 },
  { id: "flexion-lateral-mancuerna", app: null, nombre: "Flexión lateral con mancuerna", grupo: "core", equipo: "mancuernas", estado: "parado", vista: "south", cuadros: 8, musc: ["oblicuos"], paso: 2, rest: 60 },
  // ---- Cuerpo completo y cardio ----
  { id: "burpees", app: null, nombre: "Burpees", grupo: "completo", equipo: "peso-corporal", estado: "parado", vista: "east", cuadros: 12, musc: ["cuerpo completo"], paso: 0, rest: 60 },
  { id: "saltos-tijera", app: null, nombre: "Saltos de tijera (jumping jacks)", grupo: "completo", equipo: "peso-corporal", estado: "parado", vista: "south", cuadros: 8, musc: ["cardio"], paso: 0, rest: 30 },
  { id: "sentadilla-salto", app: null, nombre: "Sentadilla con salto", grupo: "completo", equipo: "peso-corporal", estado: "parado", vista: "east", cuadros: 8, musc: ["cuádriceps", "glúteo", "cardio"], paso: 0, rest: 60 },
  { id: "thruster", app: null, nombre: "Thruster con mancuernas", grupo: "completo", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 12, musc: ["cuádriceps", "deltoide"], paso: 2, rest: 90 },
  { id: "clean-kettlebell", app: null, nombre: "Cargada con kettlebell", grupo: "completo", equipo: "kettlebell", estado: "parado", vista: "east", cuadros: 8, musc: ["cuerpo completo"], paso: 4, rest: 90 },
  { id: "farmer-walk", app: null, nombre: "Caminata del granjero", grupo: "completo", equipo: "mancuernas", estado: "parado", vista: "east", cuadros: 8, musc: ["antebrazo", "trapecio", "core"], paso: 4, rest: 90 },
  { id: "soga-saltar", app: null, nombre: "Saltar la soga", grupo: "completo", equipo: "peso-corporal", estado: "parado", vista: "east", cuadros: 8, musc: ["cardio", "gemelos"], paso: 0, rest: 30 },
];

export const GRUPOS = { pecho: "Pecho", espalda: "Espalda", hombros: "Hombros", piernas: "Piernas", gluteos: "Glúteo", brazos: "Brazos", core: "Core", completo: "Cuerpo completo" };
export const EQUIPOS = { barra: "Barra", mancuernas: "Mancuernas", maquina: "Máquina", polea: "Polea", "peso-corporal": "Peso corporal", kettlebell: "Kettlebell", banco: "Banco" };
