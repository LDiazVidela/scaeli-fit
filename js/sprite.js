// Animación por spritesheet para los ejercicios (pixel art de PixelLab).
// Uso:
//   import { SpriteAnim, loadSprite, EJERCICIOS } from "./sprite.js";
//   const s = await loadSprite("sentadilla-goblet");          // lee assets/ejercicios/<id>/<id>.png + .json
//   const anim = new SpriteAnim(canvasEl, s, { fps: 8, start: 1, scale: 2, flip: false });
//   anim.play();  anim.stop();  anim.set({ fps: 10, flip: true, scale: 3 });

import { EJERCICIOS } from "../data/ejercicios.js";
export { EJERCICIOS };

const cache = new Map();

export function loadSprite(id) {
  if (cache.has(id)) return cache.get(id);
  const cfg = EJERCICIOS[id];
  if (!cfg) return Promise.reject(new Error("Ejercicio sin sprite: " + id));
  const base = (cfg.carpeta || "assets/ejercicios/" + id + "/") + (cfg.archivo || id);
  const p = Promise.all([
    fetch(base + ".json").then((r) => { if (!r.ok) throw new Error("No se encontró " + base + ".json"); return r.json(); }),
    new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error("No se pudo cargar " + base + ".png")); im.src = base + ".png"; }),
  ]).then(([meta, img]) => ({ id, cfg, meta, img }));
  cache.set(id, p);
  return p;
}

export class SpriteAnim {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{img:HTMLImageElement, meta:object, cfg:object}} sprite  resultado de loadSprite
   * @param {{fps?:number, start?:number, end?:number, scale?:number, flip?:boolean, autoplay?:boolean}} opts
   *   start/end: índices de cuadro (0-based) del loop, ambos inclusive. Por defecto los del registro.
   *   scale: múltiplo entero. flip: espejado horizontal (mira a la izquierda).
   */
  constructor(canvas, sprite, opts = {}) {
    this.canvas = canvas; this.sprite = sprite;
    const c = sprite.cfg || {}, m = sprite.meta;
    this.fps = opts.fps ?? c.fps ?? 8;
    this.start = opts.start ?? c.inicio ?? 0;
    this.end = opts.end ?? c.fin ?? (m.frames - 1);
    this.scale = Math.max(1, Math.round(opts.scale ?? 2));
    this.flip = opts.flip ?? !!c.espejar;
    this.frame = this.start; this._raf = 0; this._last = 0; this._acc = 0;
    this.ctx = canvas.getContext("2d");
    this._size();
    this.draw();
    if (opts.autoplay) this.play();
  }
  _size() {
    const m = this.sprite.meta, s = this.scale;
    this.canvas.width = m.frameW * s; this.canvas.height = m.frameH * s;
    this.canvas.style.width = m.frameW * s + "px"; this.canvas.style.height = m.frameH * s + "px";
    this.canvas.style.imageRendering = "pixelated";
  }
  set(o) {
    if (o.fps != null) this.fps = o.fps;
    if (o.flip != null) this.flip = !!o.flip;
    if (o.start != null) { this.start = o.start; if (this.frame < this.start) this.frame = this.start; }
    if (o.end != null) { this.end = o.end; if (this.frame > this.end) this.frame = this.start; }
    if (o.scale != null) { this.scale = Math.max(1, Math.round(o.scale)); this._size(); }
    this.draw();
  }
  draw() {
    const m = this.sprite.meta, s = this.scale, ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    if (this.flip) { ctx.translate(this.canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(this.sprite.img, this.frame * m.frameW, 0, m.frameW, m.frameH, 0, 0, m.frameW * s, m.frameH * s);
    ctx.restore();
  }
  step() { this.frame = this.frame >= this.end ? this.start : this.frame + 1; this.draw(); }
  play() {
    if (this._raf) return;
    this._last = performance.now(); this._acc = 0;
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      this._acc += t - this._last; this._last = t;
      const dt = 1000 / this.fps;
      while (this._acc >= dt) { this._acc -= dt; this.step(); }
    };
    this._raf = requestAnimationFrame(tick);
  }
  stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; }
  get playing() { return !!this._raf; }
  /** Cantidad de cuadros del loop actual. */
  get length() { return this.end - this.start + 1; }
}

/** Dibuja un solo cuadro (sin animar) en un canvas: para miniaturas y fichas. */
export function drawFrame(canvas, sprite, frame, scale = 1, flip = false) {
  const a = new SpriteAnim(canvas, sprite, { scale, flip, start: frame, end: frame });
  return a;
}
