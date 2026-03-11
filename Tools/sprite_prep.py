# -*- coding: cp1252 -*-

# tools/sprite_prep.py
from __future__ import annotations
import argparse
from pathlib import Path
from PIL import Image

def parse_hex_color(s: str) -> tuple[int, int, int]:
    s = s.strip()
    if s.startswith("#"):
        s = s[1:]
    if len(s) != 6:
        raise ValueError("Färg måste vara 6 hex-tecken, t.ex. FF00FF eller #FF00FF")
    r = int(s[0:2], 16)
    g = int(s[2:4], 16)
    b = int(s[4:6], 16)
    return r, g, b

def close_to_key(r: int, g: int, b: int, key: tuple[int, int, int], tol: int) -> bool:
    kr, kg, kb = key
    # "box"-tolerans (snabb, bra för pixelart)
    return max(abs(r - kr), abs(g - kg), abs(b - kb)) <= tol

def process_image(in_path: Path, out_path: Path, key: tuple[int, int, int], tol: int) -> bool:
    try:
        img = Image.open(in_path).convert("RGBA")
    except Exception as e:
        print(f"SKIP (kan ej läsa): {in_path} ({e})")
        return False

    px = img.load()
    w, h = img.size
    changed = False

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if close_to_key(r, g, b, key, tol):
                px[x, y] = (r, g, b, 0)
                changed = True

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path.with_suffix(".png"), format="PNG")
    return changed

def main():
    ap = argparse.ArgumentParser(
        description="Gör key-color (default magenta) transparent och exporterar PNG."
    )
    ap.add_argument("input_dir", help="Mapp med råbilder (från Paint).")
    ap.add_argument("output_dir", help="Mapp där färdiga PNG:er sparas.")
    ap.add_argument("--key", default="FF00FF",
                    help="Key-color i hex (default FF00FF). Ex: FF00FF eller #FF00FF")
    ap.add_argument("--tolerance", type=int, default=0,
                    help="0 = exakt färg. Testa 5–20 om du har 'nästan magenta'.")
    ap.add_argument("--ext", default="png,bmp",
                    help="Filändelser att processa (kommaseparerat). Default: png,bmp")
    args = ap.parse_args()

    in_dir = Path(args.input_dir)
    out_dir = Path(args.output_dir)
    if not in_dir.exists():
        raise SystemExit(f"Input-mappen finns inte: {in_dir}")

    key = parse_hex_color(args.key)
    tol = max(0, min(255, args.tolerance))
    exts = {("." + e.strip().lower().lstrip(".")) for e in args.ext.split(",")}

    files = [p for p in in_dir.rglob("*") if p.is_file() and p.suffix.lower() in exts]
    if not files:
        print("Inga filer hittades.")
        return

    changed_count = 0
    for p in files:
        rel = p.relative_to(in_dir)
        out_path = out_dir / rel
        if process_image(p, out_path, key, tol):
            changed_count += 1

    print(f"Klar! Processade {len(files)} filer. Tog bort bakgrund i {changed_count} st.")

if __name__ == "__main__":
    main()
