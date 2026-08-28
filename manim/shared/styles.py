"""Shared style tokens + helpers for the KOC dashboard Manim slides.

Consistent symbol <-> colour mapping (see docs/factorization/GEOMETRY_PROOFS.md):
    a  -> blue     b  -> amber     ab -> green
    removed ink -> red    neutral ink -> white    background -> dark slate
"""
from __future__ import annotations

from manim import ManimColor

# ── Palette ────────────────────────────────────────────────────────────────
COL_A = ManimColor("#4FC3F7")   # variable a, side a, area a^2
COL_B = ManimColor("#FFD54F")   # variable b, side b, area b^2
COL_AB = ManimColor("#81C784")  # product ab rectangles / term 2ab
COL_REMOVE = ManimColor("#E57373")  # subtracted / removed ink
INK = ManimColor("#FFFFFF")     # outlines + neutral text
BG = ManimColor("#0f172a")      # slide background (matches reference)

# ── Strokes / sizes ──────────────────────────────────────────────────────────
STROKE = 3.0
THIN_STROKE = 2.0
FILL_OPACITY = 0.42
AREA_FONT = 40
LABEL_FONT = 38

# Map for MathTex colouring so a/b are always the right colour.
TEX_COLOR_MAP = {"a": COL_A, "b": COL_B}
