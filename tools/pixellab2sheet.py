#!/usr/bin/env python3
"""Convierte una exportación de PixelLab (ZIP o carpeta con metadata.json) en un spritesheet
horizontal PNG + JSON propio de Scaeli Fit.

Uso:
  python3 tools/pixellab2sheet.py <zip_o_carpeta> <nombre-ejercicio> [--dir east] [--anim NOMBRE]
  → assets/ejercicios/<nombre-ejercicio>/<nombre-ejercicio>.png
  → assets/ejercicios/<nombre-ejercicio>/<nombre-ejercicio>.json

El JSON resultante:
  { "frameW":172, "frameH":172, "frames":9, "floorY":147, "direction":"east",
    "bboxes":[[x0,y0,x1,y1],...], "source":"pixellab", "character":"...", "animation":"..." }
"""
import json, os, shutil, sys, tempfile, zipfile
from PIL import Image

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]
    direction = "east"; anim = None
    args = sys.argv[3:]
    for i, a in enumerate(args):
        if a == "--dir": direction = args[i + 1]
        if a == "--anim": anim = args[i + 1]
    tmp = None
    if zipfile.is_zipfile(src):
        tmp = tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); root = tmp
    else:
        root = src
    meta = json.load(open(os.path.join(root, "metadata.json")))
    state = meta["states"][0]
    anims = state["frames"].get("animations", {})
    if not anims:
        sys.exit("La exportación no trae animaciones (solo rotaciones).")
    if anim is None:
        anim = list(anims.keys())[0]
    if direction not in anims[anim]:
        sys.exit("La animación no tiene dirección %s; tiene: %s" % (direction, list(anims[anim].keys())))
    paths = [os.path.join(root, p) for p in anims[anim][direction]]
    frames = [Image.open(p).convert("RGBA") for p in paths]
    w, h = frames[0].size
    for f in frames:
        if f.size != (w, h): sys.exit("Cuadros de distinto tamaño: %s" % [f.size for f in frames])
    sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    bboxes = []
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * w, 0))
        bboxes.append(list(f.split()[3].getbbox() or (0, 0, 0, 0)))
    floors = sorted(set(b[3] for b in bboxes))
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "ejercicios", name)
    os.makedirs(out, exist_ok=True)
    sheet.save(os.path.join(out, name + ".png"), optimize=True)
    info = {
        "frameW": w, "frameH": h, "frames": len(frames), "floorY": floors[-1], "direction": direction,
        "bboxes": bboxes, "source": "pixellab",
        "character": state["character"].get("prompt", "")[:80], "animation": anim,
    }
    json.dump(info, open(os.path.join(out, name + ".json"), "w"), indent=1)
    print("OK", out, "cuadros:", len(frames), "tamaño:", w, "x", h, "piso y:", floors)
    if len(floors) > 1:
        print("AVISO: los pies no terminan en la misma línea en todos los cuadros:", floors)
    if tmp: shutil.rmtree(tmp)

if __name__ == "__main__":
    main()
