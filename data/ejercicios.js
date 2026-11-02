// Registro de sprites de ejercicios. Un solo lugar para sumar ejercicios nuevos.
// Cada entrada: archivos en assets/ejercicios/<id>/<id>.png + <id>.json (los genera tools/pixellab2sheet.py)
//   nombre   : cómo se muestra en la app
//   fps      : velocidad del loop
//   inicio   : primer cuadro del loop (0-based). PixelLab suele agregar un cuadro quieto al principio: se saltea con 1.
//   fin      : último cuadro del loop (opcional; por defecto el último del sheet)
//   espejar  : true si el sprite mira a la izquierda y hay que darlo vuelta
//   quieto   : cuadro para miniaturas/fichas (por defecto = inicio)
//   vista    : dirección exportada en PixelLab, informativa
export const EJERCICIOS = {
  "abductores-maquina": { nombre: "Abductores en máquina", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "south" },
  "chest-press-maquina": { nombre: "Chest press en máquina (provisorio)", fps: 8, inicio: 0, espejar: false, quieto: 0, vista: "south-east" },
  "curl-biceps-barra": { nombre: "Curl de bíceps con barra", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "curl-biceps-mancuernas": { nombre: "Curl con mancuernas", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "curl-biceps-maquina": { nombre: "Curl de bíceps en máquina", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "curl-femoral-sentado": { nombre: "Curl femoral sentado (provisorio)", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "curl-martillo": { nombre: "Curl martillo (provisorio)", fps: 8, inicio: 2, espejar: false, quieto: 2, vista: "east" },
  "elevaciones-frontales": { nombre: "Elevaciones frontales", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "elevaciones-laterales": { nombre: "Elevaciones laterales", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "south" },
  "extension-cuadriceps": { nombre: "Extensión de cuádriceps", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "extension-triceps-polea": { nombre: "Extensión de tríceps sobre cabeza", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "hip-thrust-maquina": { nombre: "Hip thrust", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "jalon-al-pecho": { nombre: "Jalón al pecho", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "peso-muerto-rumano": { nombre: "Peso muerto rumano", fps: 8, inicio: 0, espejar: false, quieto: 0, vista: "east" },
  "plancha": { nombre: "Plancha", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "posterior-hombro-pec-deck": { nombre: "Posterior de hombro (pec-deck inverso)", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "north" },
  "prensa-45": { nombre: "Prensa 45°", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "press-hombros-maquina": { nombre: "Press de hombros en máquina", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "press-inclinado-maquina": { nombre: "Press inclinado en máquina", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "press-militar-mancuernas": { nombre: "Press de hombros con mancuernas", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "south" },
  "remo-maquina": { nombre: "Remo en máquina", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "remo-polea-baja": { nombre: "Remo en polea baja", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "saltos-tijera": { nombre: "Saltos de tijera", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "south" },
  "sentadilla-goblet": { nombre: "Sentadilla goblet", fps: 8, inicio: 2, espejar: false, quieto: 2, vista: "east" },
  "sentadilla-hack": { nombre: "Sentadilla hack", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "sentadilla-sin-peso": { nombre: "Sentadilla sin peso", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "triceps-polea-soga": { nombre: "Tríceps en polea con soga", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
  "zancadas": { nombre: "Zancadas", fps: 8, inicio: 1, espejar: false, quieto: 1, vista: "east" },
};
