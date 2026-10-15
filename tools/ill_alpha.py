"""Make the poster's green background around the line illustrations transparent."""
import sys
from pathlib import Path
from PIL import Image

for f in sys.argv[1:]:
    im = Image.open(f).convert("RGBA")
    px = im.load()
    w, h = im.size
    bg = px[2, 2]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            if d < 60 and g >= r and g >= b - 10:
                px[x, y] = (r, g, b, 0)
    out = Path(f).with_suffix(".png")
    im.save(out, optimize=True)
    Path(f).unlink()
    print(out, bg)
