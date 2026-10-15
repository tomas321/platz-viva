"""Collapse the relative preview folder into single self-contained HTML files (images and fonts as data URIs)."""
import base64, mimetypes, re, sys
from pathlib import Path

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
mimetypes.add_type("font/woff2", ".woff2"); mimetypes.add_type("image/avif", ".avif"); mimetypes.add_type("image/webp", ".webp")

def data(p: Path) -> str:
    return f"data:{mimetypes.guess_type(p.name)[0]};base64,{base64.b64encode(p.read_bytes()).decode()}"

for page in sorted(p.name for p in src.glob("*.html")):
    html = (src / page).read_text()
    html = re.sub(r"<source[^>]*>", "", html)               # keep only the <img> fallback
    html = re.sub(r'\s(srcset|sizes)="[^"]*"', "", html)
    def css_inline(m):
        css = (src / m.group(1)).read_text()
        css = re.sub(r"url\(\./([^)]+)\)", lambda u: f"url({data(src / '_astro' / u.group(1))})" if re.search(r"-(latin|latin-ext|cyrillic|cyrillic-ext)-wght", u.group(1)) else "url()", css)
        return f"<style>{css}</style>"
    html = re.sub(r'<link rel="stylesheet" href="(_astro/[^"]+\.css)">', css_inline, html)
    html = re.sub(r'(src|href)="(_astro/[^"]+|favicon\.svg)"', lambda m: f'{m.group(1)}="{data(src / m.group(2))}"', html)
    (dst / page).write_text(html)
    print(page, len(html) // 1024, "KB")
