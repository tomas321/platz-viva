"""Crop archive photos and illustrations out of the poster photos.
Boxes are in 1400px-wide overview coordinates (x1, y1, x2, y2); scaled to the 4000px originals."""
import sys
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
K = 4000 / 1400

BOXES = {
  "map-wagner":        ("103934", (545, 240, 642, 310)),
  "engraving-church":  ("103934", (630, 385, 824, 507)),
  "napoleon-ball": ("103934", (1172, 262, 1292, 420)),
  "street-1930s":      ("103951", (511, 240, 709, 372)),
  "market-1928":       ("103951", (768, 310, 966, 437)),
  "market-hall-ill": ("103951", (766, 512, 965, 608)),
  "manderlak-1949":    ("104013", (97, 249, 229, 376)),
  "brouk-plan-1935":   ("104013", (288, 247, 419, 372)),
  "brouk-night":       ("103604", (40, 310, 198, 548)),
  "stalin-workshop":   ("103604", (922, 116, 1192, 333)),
  "manderlak-ill":     ("104013", (343, 433, 435, 618)),
  "may-day":           ("104043", (6, 252, 141, 384)),
  "stalin-scaffold":   ("104043", (197, 322, 331, 501)),
  "lower-square-1933": ("104043", (853, 240, 1042, 365)),
  "spitalska":         ("104043", (1101, 236, 1246, 358)),
  "prior-ill": ("104043", (1128, 532, 1368, 612)),
  "november-1989":     ("104059", (911, 217, 1045, 352)),
  "orange-circles": ("104126", (582, 270, 742, 378)),
  "fewer-barriers": ("104126", (1185, 352, 1360, 436)),
  "tree-planting": ("104137", (530, 202, 750, 310)),
  "tree-street": ("104137", (558, 380, 784, 506)),
  "lawn-benches": ("104200", (902, 352, 1100, 476)),
  "ossuary": ("104210", (366, 200, 574, 322)),
}

# Cards that hang at a slight angle on the poster: trim the edges so no poster background shows.
TILTED = {"fewer-barriers", "lawn-benches", "tree-planting", "tree-street", "ossuary"}

OUT.mkdir(parents=True, exist_ok=True)
only = set(sys.argv[3:])
for name, (photo, (x1, y1, x2, y2)) in BOXES.items():
    if only and name not in only:
        continue
    im = Image.open(SRC / f"20261012_{photo}.jpg")
    im = ImageOps.exif_transpose(im).convert("RGB")
    crop = im.crop((round(x1 * K), round(y1 * K), round(x2 * K), round(y2 * K)))
    if name in TILTED:
        w, h = crop.size
        dx, dy = round(w * 0.035), round(h * 0.05)
        crop = crop.crop((dx, dy, w - dx, h - dy))
    if not name.endswith(("-ill", "diagram")):
        crop = ImageOps.autocontrast(crop, cutoff=0.5)
        crop = ImageEnhance.Contrast(crop).enhance(1.05)
    crop = crop.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    crop.save(OUT / f"{name}.jpg", quality=90, optimize=True)
    print(name, crop.size)
