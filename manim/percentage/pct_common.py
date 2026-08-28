"""Shared palette + helpers for the Percentages Manim slides.

Colour convention (a quantity keeps its colour everywhere it appears, so the eye
can follow it from a word-label to the formula to the worked number):

    Old value / Principal / Cost      -> blue
    New value / Amount                -> amber
    Change factor                     -> violet
    increase  (+rate, growth)         -> green
    decrease  (-rate, decay)          -> pink

A growth factor is ``(1 + rate)`` (green); a decay factor is ``(1 - rate)``
(pink). The same factor idea drives every percentage topic — repeated change,
profit/discount and interest — so the colours are reused across all three decks.
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))

# Canvas (match the dashboard) --------------------------------------------
BG = ManimColor("#0f172a")
INK = ManimColor("#F8FAFC")
MUTED = ManimColor("#94A3B8")
GOLD = ManimColor("#E6C260")

# Concept colours ----------------------------------------------------------
OLD = ManimColor("#4FC3F7")      # old value / principal / cost
NEW = ManimColor("#FFD54F")      # new value / amount
FACTOR = ManimColor("#CE93D8")   # change factor
GROW = ManimColor("#66BB6A")     # increase / growth / +rate
DROP = ManimColor("#F06292")     # decrease / decay / -rate
# NOTE: avoid the names UP / DOWN here — Manim uses those for direction vectors.

# Profit-loss roles (reuse the core colours so ideas line up) --------------
COST = OLD                       # cost price
MARK = FACTOR                    # marked price
SELL = GROW                      # selling price
PROFIT = NEW                     # profit

STROKE = 3.0
THIN = 2.0
FORMULA_FS = 54
LABEL_FS = 42


class PctSlide(Slide):
    """Base slide with a persistent gold-accented title bar."""

    def title_bar(self, text: str) -> VGroup:
        title = Tex(text, font_size=52, color=INK).to_edge(UP, buff=0.5)
        accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
        accent.set_width(title.width + 0.6).next_to(title, DOWN, buff=0.14)
        self.play(Write(title), GrowFromCenter(accent))
        return VGroup(title, accent)


def m(tex, color=INK, fs: int = FORMULA_FS, *parts):
    """MathTex shorthand; extra positional ``parts`` -> multi-argument MathTex."""
    if parts:
        return MathTex(tex, *parts, font_size=fs, color=color)
    return MathTex(tex, font_size=fs, color=color)


def factor_box(rate_tex: str, factor_tex: str, color, caption: str,
               width: float = 5.4, height: float = 2.35) -> VGroup:
    """A captioned card showing a rate turning into its change factor.

    e.g. ``+50\\%``  ->  ``(1 + 50\\%)``  captioned "Growth factor".
    """
    rate = MathTex(rate_tex, font_size=58, color=color)
    arrow = MathTex(r"\rightarrow", font_size=46, color=MUTED)
    fac = MathTex(factor_tex, font_size=58, color=color)
    row = VGroup(rate, arrow, fac).arrange(RIGHT, buff=0.32)
    cap = Tex(caption, font_size=30, color=color)
    inner = VGroup(row, cap).arrange(DOWN, buff=0.28)
    box = RoundedRectangle(
        corner_radius=0.18, width=width, height=height,
        stroke_color=color, stroke_width=2.0,
        fill_color=color, fill_opacity=0.08,
    )
    inner.move_to(box.get_center())
    return VGroup(box, inner)
