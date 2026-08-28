"""Style tokens for the Area & Volume Manim slides.

Consistent symbol <-> colour mapping so the eye can follow a symbol (and any
number substituted for it) across the figure and the formula:

    length / side   l   -> blue
    width           w   -> amber
    base            b   -> amber  (a horizontal measure, same family as width)
    height          h   -> green
    diagonal        d1  -> blue       d2 -> pink
    parallel sides  b1  -> blue       b2 -> amber
    radius          r   -> blue
    angle           theta -> violet

The same colour is reused for the matching symbol in the formula.
Background / ink match the rest of the dashboard (dark slate).
"""
from __future__ import annotations

from manim import ManimColor

# Canvas (match dashboard) -------------------------------------------------
BG = ManimColor("#0f172a")
INK = ManimColor("#F8FAFC")
MUTED = ManimColor("#94A3B8")
GOLD = ManimColor("#E6C260")        # descriptive "Area of ..." text

# Symbol colours -----------------------------------------------------------
BLUE = ManimColor("#4FC3F7")        # l, d1, b1, r
AMBER = ManimColor("#FFD54F")       # w, b, b2, base area
GREEN = ManimColor("#66BB6A")       # h
PINK = ManimColor("#F06292")        # d2
VIOLET = ManimColor("#AB47BC")      # theta
SLANT = ManimColor("#F06292")       # slant height l (cone)
ORANGE = ManimColor("#FFB74D")

# Symbol -> colour lookup (single source of truth)
SYMBOL = {
    "l": BLUE,
    "w": AMBER,
    "b": AMBER,
    "h": GREEN,
    "d_1": BLUE,
    "d_2": PINK,
    "b_1": BLUE,
    "b_2": AMBER,
    "r": BLUE,
    r"\theta": VIOLET,
}

# Per-shape translucent fills (echo the source slide's colour coding) -------
FILL = {
    "square": ManimColor("#E57373"),
    "rectangle": ManimColor("#FFB74D"),
    "parallelogram": ManimColor("#B39DDB"),
    "rhombus": ManimColor("#7986CB"),
    "triangle": ManimColor("#64B5F6"),
    "trapezium": ManimColor("#AED581"),
    "circle": ManimColor("#4DD0E1"),
    "sector": ManimColor("#90A4AE"),
    # 3D solids: body fill (base faces are drawn amber separately)
    "cuboid": ManimColor("#FFCC80"),
    "cylinder": ManimColor("#90CAF9"),
    "pyramid": ManimColor("#CE93D8"),
    "cone": ManimColor("#80CBC4"),
    "sphere": ManimColor("#4DD0E1"),
}

# Highlight for "base area" faces on the solids.
BASE_FILL = AMBER

# Strokes / opacity --------------------------------------------------------
STROKE = 3.0
THIN = 2.0
FILL_OPACITY = 0.45
