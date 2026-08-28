"""Shared layout + the step-by-step formula reveal engine for Area & Volume decks.

`RevealSlide` provides `reveal(desc, formula, steps)` which places the description
and formula centre-right and assembles the formula piece by piece:
    ("write", mobject)                 -> Write
    ("derive", [(src, part), ...])     -> TransformFromCopy (parallel)
    ("merge", [src_a, src_b], target)  -> two figure labels into one formula part
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_styles import INK, GOLD  # noqa: E402

# Layout anchors -----------------------------------------------------------
LEFT_X = -3.7
RIGHT_X = 3.4
LABEL_FS = 44
FORMULA_FS = 56
DESC_SCALE = 0.95
MAX_FORMULA_W = 6.4


def m(tex: str, color=INK, fs: int = FORMULA_FS, *parts) -> MathTex:
    """Shorthand MathTex in the formula font; extra `parts` -> multi-arg."""
    if parts:
        return MathTex(tex, *parts, font_size=fs, color=color)
    return MathTex(tex, font_size=fs, color=color)


def fraction(num: VMobject, den: VMobject, buff: float = 0.16) -> VGroup:
    """Stack `num` over `den` with a bar. Returns VGroup(num, bar, den)."""
    bar = Line(ORIGIN, RIGHT, color=INK, stroke_width=4)
    bar.set_width(max(num.width, den.width) + 0.3)
    num.next_to(bar, UP, buff=buff)
    den.next_to(bar, DOWN, buff=buff)
    return VGroup(num, bar, den)


def right_angle_mark(corner, d1, d2, size=0.26, color=INK, sw=2.0):
    p0 = corner + d1 * size
    p1 = corner + d1 * size + d2 * size
    p2 = corner + d2 * size
    return VMobject(stroke_color=color, stroke_width=sw).set_points_as_corners(
        [p0, p1, p2]
    )


class RevealSlide(Slide):
    def reveal(self, desc: Tex, formula: VMobject, steps, right_x: float = RIGHT_X):
        desc.set_color(GOLD).scale(DESC_SCALE)
        if formula.width > MAX_FORMULA_W:
            formula.scale(MAX_FORMULA_W / formula.width)
        grp = VGroup(desc, formula).arrange(DOWN, buff=0.62, aligned_edge=LEFT)
        grp.move_to([right_x, 0, 0])

        self.play(FadeIn(desc, shift=DOWN * 0.2))
        for step in steps:
            kind = step[0]
            if kind == "write":
                self.play(Write(step[1]))
            elif kind == "derive":
                self.play(
                    *[TransformFromCopy(s, p) for s, p in step[1]], run_time=0.9
                )
            elif kind == "merge":
                (src_a, src_b), target = step[1], step[2]
                ghost = target.copy()
                self.play(
                    TransformFromCopy(src_a, target),
                    TransformFromCopy(src_b, ghost),
                    run_time=0.95,
                )
                self.remove(ghost)
        return grp
