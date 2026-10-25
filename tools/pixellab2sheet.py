#!/usr/bin/env python3
"""Convierte una exportación de PixelLab en un spritesheet horizontal PNG + JSON propio de Scaeli Fit.

Acepta los dos formatos de exportación de PixelLab:
  A) "Export character" → ZIP/carpeta con metadata.json y cuadros sueltos (Idle/animations/<anim>/<dir>/frame_000.png)
  B) "Spritesheet (PNG + JSON)" → ZIP/carpeta con <nombre>.png y <nombre>.json (celdas fijas, filas de rotaciones y animación)

Uso:
  python3 tools/pixellab2sheet.py <zip_o_carpeta> <nombre-ejercicio> [--dir east] [--anim NOMBRE] [--rotaciones <carpeta>]
  → assets/ejercicios/<nombre-ejercicio>/<nombre-ejercicio>.png
  → assets/ejercicios/<nombre-ejercicio>/<nombre-ejercicio>.json
  --rotaciones <carpeta>: además guarda las 8 rotaciones del estado en assets/<carpeta>/<direccion>.png

El JSON resultante:
  { "frameW":172, "frameH":172, "frames":9, "floorY":147, "direction":"east",
    "bboxes":[[x0,y0,x1,y1],...], "source":"pixellab", "character":"...", "animation":"..." }
"""
import glob, json, os, shutil, sys, tempfile, zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def arg(args, key, default=None):
    return args[args.index(key) + 1] if key in args else default

def frames_from_character_export(root, direction, anim):
    meta = json.load(open(os.path.join(root, "metadata.json")))
    state = meta["states"][0]
    anims = state["frames"].get("animations", {})
    if not anims: sys.exit("La exportación no trae animaciones (solo rotaciones).")
    if anim is None: anim = list(anims.keys())[0]
    if anim not in anims:
        cand = [a for a in anims if a.lower().startswith(anim.lower())]
        if not cand: sys.exit("Animaciones disponibles: %s" % list(anims.keys()))
        anim = cand[0]
    if direction not in anims[anim]:
        sys.exit("La animación no tiene dirección %s; tiene: %s" % (direction, list(anims[anim].keys())))
    frames = [Image.open(os.path.join(root, p)).convert("RGBA") for p in anims[anim][direction]]
    rot = {d: Image.open(os.path.join(root, p)).convert("RGBA") for d, p in state["frames"].get("rotations", {}).items()}
    return frames, rot, state["character"].get("prompt", "")[:80], anim

def frames_from_spritesheet_export(root, direction, anim):
    js = glob.glob(os.path.join(root, "*.json"))
    meta = json.load(open(js[0]))
    ss = meta["spritesheet"]
    sheet = Image.open(os.path.join(root, os.path.basename(ss["path"]))).convert("RGBA")
    cw, ch = ss["cell_size"]["width"], ss["cell_size"]["height"]
    cols = ss["columns"]
    cell = lambda r, c: sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
    rot, frames, used = {}, None, None
    anim_rows = [r for r in ss["rows"] if r["type"] == "animation"]
    for r in ss["rows"]:
        if r["type"] == "rotations":
            for i, d in enumerate(r["directions"]): rot[d] = cell(r["row"], i)
    for r in anim_rows:
        if anim and not r["animation"].lower().startswith(anim.lower()): continue
        if r.get("direction") and r["direction"] != direction: continue
        frames = [cell(r["row"], i) for i in range(r["frame_count"])]; used = r; break
    if frames is None:
        sys.exit("No hay fila de animación con dirección %s. Filas: %s" % (direction, [(r["animation"][:40], r.get("direction")) for r in anim_rows]))
    # recorte: PixelLab deja la celda grande; dejamos el ancho útil común + 4 px de margen
    boxes = [f.split()[3].getbbox() for f in frames]
    x0 = max(0, min(b[0] for b in boxes) - 4); x1 = min(cw, max(b[2] for b in boxes) + 4)
    y0 = max(0, min(b[1] for b in boxes) - 4); y1 = min(ch, max(b[3] for b in boxes) + 4)
    frames = [f.crop((x0, y0, x1, y1)) for f in frames]
    return frames, rot, meta["character"].get("name", ""), used["animation"][:60]

def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]
    args = sys.argv[3:]
    direction, anim, rotdir = arg(args, "--dir", "east"), arg(args, "--anim"), arg(args, "--rotaciones")
    tmp = None
    if zipfile.is_zipfile(src):
        tmp = tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); root = tmp
    else:
        root = src
    if os.path.exists(os.path.join(root, "metadata.json")):
        frames, rot, char, anim_name = frames_from_character_export(root, direction, anim)
    else:
        frames, rot, char, anim_name = frames_from_spritesheet_export(root, direction, anim)
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    bboxes = []
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * w, 0))
        bboxes.append(list(f.split()[3].getbbox() or (0, 0, 0, 0)))
    floors = sorted(set(b[3] for b in bboxes))
    out = os.path.join(ROOT, "assets", "ejercicios", name)
    os.makedirs(out, exist_ok=True)
    sheet.save(os.path.join(out, name + ".png"), optimize=True)
    info = {"frameW": w, "frameH": h, "frames": len(frames), "floorY": floors[-1], "direction": direction,
            "bboxes": bboxes, "source": "pixellab", "character": char, "animation": anim_name}
    json.dump(info, open(os.path.join(out, name + ".json"), "w"), indent=1)
    print("OK", out, "cuadros:", len(frames), "tamaño:", w, "x", h, "piso y:", floors)
    if len(floors) > 1: print("AVISO: los pies no terminan en la misma línea en todos los cuadros:", floors)
    if rotdir and rot:
        rd = os.path.join(ROOT, "assets", rotdir); os.makedirs(rd, exist_ok=True)
        for d, im in rot.items(): im.save(os.path.join(rd, d + ".png"), optimize=True)
        print("Rotaciones guardadas en", rd, list(rot.keys()))
    if tmp: shutil.rmtree(tmp)

if __name__ == "__main__":
    main()
