// Registro de sprites de ejercicios. Un solo lugar para sumar ejercicios nuevos.
// Cada entrada: archivos en assets/ejercicios/<id>/<id>.png + <id>.json (los genera tools/pixellab2sheet.py)
//   nombre   : cómo se muestra en la app
//   fps      : velocidad del loop
//   inicio   : primer cuadro del loop (0-based). PixelLab agrega un cuadro quieto al principio: se saltea con 1.
//   fin      : último cuadro del loop (opcional; por defecto el último del sheet)
//   espejar  : true si el sprite mira a la izquierda y hay que darlo vuelta
//   quieto   : cuadro para miniaturas/fichas (por defecto = inicio)
//   vista    : dirección exportada en PixelLab, informativa
export const EJERCICIOS = {
  "sentadilla-goblet": { nombre: "Sentadilla goblet", fps: 8, inicio: 2, espejar: false, quieto: 2, vista: "east" },
  "peso-muerto-rumano": { nombre: "Peso muerto rumano", fps: 8, inicio: 0, espejar: false, quieto: 0, vista: "east" },
  "jalon-al-pecho": { nombre: "Jalón al pecho (provisorio)", fps: 8, inicio: 0, espejar: false, quieto: 0, vista: "east" },
};
