"""Shared palette + helpers for the Probability Manim slides.

Colour convention (used across all three decks so equal elements match):

    favourable outcomes (numerator)   -> amber
    total outcomes      (denominator) -> green
    Head  (H)                         -> blue
    Tail  (T)                         -> pink

The same colour is reused for a symbol everywhere it appears (figure label and
formula), and a value derived from a figure label is animated in with
`TransformFromCopy` so the eye can follow it.
"""
from __future__ import annotations

from manim import *
from manim_slides import Slide

# Canvas (match the dashboard) --------------------------------------------
BG = ManimColor("#0f172a")
INK = ManimColor("#F8FAFC")
MUTED = ManimColor("#94A3B8")
GOLD = ManimColor("#E6C260")

# Concept colours ----------------------------------------------------------
FAV = ManimColor("#FFD54F")     # favourable outcomes (numerator)
TOTAL = ManimColor("#66BB6A")   # total outcomes (denominator)
HEAD = ManimColor("#4FC3F7")    # H
TAIL = ManimColor("#F06292")    # T

STROKE = 3.0
THIN = 2.0
FORMULA_FS = 54
LABEL_FS = 42


def m(tex, color=INK, fs=FORMULA_FS, *parts):
    """MathTex shorthand; extra positional `parts` -> multi-argument MathTex."""
    if parts:
        return MathTex(tex, *parts, font_size=fs, color=color)
    return MathTex(tex, font_size=fs, color=color)


def fraction(num: VMobject, den: VMobject, buff: float = 0.18, sw: float = 3):
    """Stack `num` over `den` with a bar; returns VGroup(num, bar, den)."""
    bar = Line(ORIGIN, RIGHT, color=INK, stroke_width=sw)
    bar.set_width(max(num.width, den.width) + 0.3)
    num.next_to(bar, UP, buff=buff)
    den.next_to(bar, DOWN, buff=buff)
    return VGroup(num, bar, den)


def coin(letter: str, color, r: float = 0.55, fs: int = 44) -> VGroup:
    """A coin face: translucent disc with a centred H / T letter."""
    disc = Circle(radius=r, color=color, fill_color=color, fill_opacity=0.18, stroke_width=4)
    inner = Circle(radius=r - 0.08, color=color, stroke_width=1.5, stroke_opacity=0.6)
    lab = MathTex(letter, color=color, font_size=fs).move_to(disc.get_center())
    return VGroup(disc, inner, lab)


def letter(ch: str, fs: int = LABEL_FS):
    """A single H / T glyph already coloured by its concept colour."""
    return MathTex(ch, color=(HEAD if ch == "H" else TAIL), font_size=fs)


class ProbSlide(Slide):
    """Base slide with a persistent gold-accented title bar."""

    def title_bar(self, text: str) -> VGroup:
        title = Tex(text, font_size=52, color=INK).to_edge(UP, buff=0.5)
        accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
        accent.set_width(title.width + 0.6).next_to(title, DOWN, buff=0.14)
        self.play(Write(title), GrowFromCenter(accent))
        return VGroup(title, accent)
