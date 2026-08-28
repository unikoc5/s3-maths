"""Patch inequality worked deck HTML for embedded iframe video playback."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "manim" / "inequality"))
from render_all_worked import SLIDES, patch_html_embed  # noqa: E402


def main():
    n = 0
    for html in sorted(SLIDES.glob("*-solution/index.html")):
        patch_html_embed(html)
        n += 1
    print(f"patched {n} decks under {SLIDES}")


if __name__ == "__main__":
    main()
