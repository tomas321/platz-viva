"""The city's photos stack a 'pred' (before) photo over a 'po' (after) photo with a red label on each.
Split them into two images and trim off the labels."""
import sys
from pathlib import Path
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
PAIRS = {  # source file -> name prefix in src/assets/img
    "city-tram-stop-2026-08-28-1.jpg": "stops",
    "city-first-stage-2026-07-22-2.jpg": "memorial",
    "city-first-stage-2026-07-22-1.jpg": "circle",
}
for f, name in PAIRS.items():
    im = Image.open(src / f).convert("RGB")
    w, h = im.size
    half = h // 2
    for i, part in enumerate(["before", "after"]):
        top = i * half
        crop = im.crop((0, top, w, top + 735))  # labels sit near the bottom of each half
        crop.save(out / f"{name}-{part}.jpg", quality=88, optimize=True)
        print(name, part, crop.size)
