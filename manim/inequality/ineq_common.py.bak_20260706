"""Shared palette + number-line helpers for the Inequality Manim slides.

Colour convention (a sign keeps its colour everywhere it appears, so the eye can
follow it across the symbol, the name and the number line):

    greater than            >        -> green
    greater than or equal   >=       -> violet
    smaller than            <        -> amber
    smaller than or equal   <=       -> blue

A *closed* (filled) dot means the boundary value IS included (>= / <=); an *open*
(hollow) dot means it is NOT included (> / <). The open dot is punched out with a
BG-coloured fill so the number line shows through the hole.
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

# Sign colours -------------------------------------------------------------
GREEN = ManimColor("#66BB6A")    # >
VIOLET = ManimColor("#AB47BC")   # >=
AMBER = ManimColor("#FFD54F")    # <
BLUE = ManimColor("#4FC3F7")     # <=
RED = ManimColor("#EF5350")      # flip warning / "danger"
SAFE = ManimColor("#66BB6A")     # safe-method tick

STROKE = 3.0
THIN = 2.0
FORMULA_FS = 60
DOT_R = 0.16


class IneqSlide(Slide):
    """Base slide with a persistent gold-accented title bar."""

    def title_bar(self, text: str) -> VGroup:
        title = Tex(text, font_size=52, color=INK).to_edge(UP, buff=0.5)
        accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
        accent.set_width(title.width + 0.6).next_to(title, DOWN, buff=0.14)
        self.play(Write(title), GrowFromCenter(accent))
        return VGroup(title, accent)


# ── number-line construction ──────────────────────────────────────────────
def make_axis(numbers, x_min, x_max, length=9.4, y=-1.7, num_color=MUTED):
    """A horizontal number line with arrow-heads at both ends.

    `numbers` are the integer positions that get a printed label; ticks are
    drawn at every integer so the line reads like a ruler.
    """
    nl = NumberLine(
        x_range=[x_min, x_max, 1],
        length=length,
        include_ticks=True,
        tick_size=0.10,
        stroke_width=STROKE,
        color=INK,
        include_tip=False,
    )
    nl.add_tip(tip_length=0.24, tip_width=0.22)
    nl.add_tip(tip_length=0.24, tip_width=0.22, at_start=True)
    nl.add_numbers(numbers, font_size=30, color=num_color, buff=0.28)
    # add_tip shortens the axis, so the labels drift off the ticks; snap each
    # label back under its own tick mark.
    for label, val in zip(getattr(nl, "numbers", []), numbers):
        label.set_x(tick_point(nl, val)[0])
    nl.move_to([0, y, 0])
    return nl


def tick_point(nl: NumberLine, value):
    """Exact centre of the tick mark at `value`.

    `add_tip()` slightly shortens the axis, so `number_to_point()` drifts off the
    tick marks that were placed during construction. We therefore snap to the
    nearest actual tick so a connector/dot lands precisely on the white tick.
    """
    target_x = nl.number_to_point(value)[0]
    ticks = getattr(nl, "ticks", None)
    if ticks is not None and len(ticks) > 0:
        nearest = min(ticks, key=lambda t: abs(t.get_center()[0] - target_x))
        return nearest.get_center()
    return nl.number_to_point(value)


def closed_dot(nl: NumberLine, value, color, r: float = DOT_R) -> Dot:
    """Filled dot -> boundary value is included (snapped onto its tick)."""
    return Dot(tick_point(nl, value), radius=r, color=color)


def open_dot(nl: NumberLine, value, color, r: float = DOT_R) -> Circle:
    """Hollow dot -> boundary value is NOT included (BG fill punches the hole)."""
    return Circle(
        radius=r, color=color, stroke_width=5,
        fill_color=BG, fill_opacity=1.0,
    ).move_to(tick_point(nl, value))


def solution_group(nl: NumberLine, boundary, to_right: bool, closed: bool,
                   color, rise: float = 0.9, r: float = DOT_R) -> VGroup:
    """The solution drawn *above* the axis, textbook style.

    A vertical connector rises from the boundary tick on the axis up to a dot
    (closed = included, open = not included); a thick ray then extends from the
    dot towards the relevant axis end, carrying its own arrow-head. Returns
    ``VGroup(connector, dot, ray)`` so each piece can be animated in turn.
    """
    base = tick_point(nl, boundary)
    center = base + UP * rise
    connector = Line(base, center + DOWN * r, color=color, stroke_width=3)
    if closed:
        dot = Dot(center, radius=r, color=color)
    else:
        dot = Circle(radius=r, color=color, stroke_width=5,
                     fill_color=BG, fill_opacity=1.0).move_to(center)
    d = RIGHT if to_right else LEFT
    start = center + d * r
    end_val = nl.x_range[1] if to_right else nl.x_range[0]
    end = np.array([nl.number_to_point(end_val)[0] + d[0] * 0.05, center[1], 0.0])
    ray = Line(start, end, color=color, stroke_width=7)
    ray.add_tip(tip_length=0.28, tip_width=0.26)
    return VGroup(connector, dot, ray)


def m(tex, color=INK, fs: int = FORMULA_FS, *parts):
    """MathTex shorthand; extra positional `parts` -> multi-argument MathTex."""
    if parts:
        return MathTex(tex, *parts, font_size=fs, color=color)
    return MathTex(tex, font_size=fs, color=color)
