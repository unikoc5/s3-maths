"""Inequality - Deck 1 (Concept & Formula): the four signs + their number lines.

    Slide 1   overview: the four signs side by side (colour-coded)
    Slide 2   x > 8       greater than            open dot,   ray right
    Slide 3   x >= -3     greater than or equal   closed dot, ray right
    Slide 4   x < 8       smaller than            open dot,   ray left
    Slide 5   x <= -3     smaller than or equal   closed dot, ray left
    Slide 6   the dot rule: open = not included, closed = included

Render:
    manim-slides render signs.py InequalitySigns --quality h
    manim-slides convert InequalitySigns <out>/index.html --to html
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from ineq_common import (  # noqa: E402
    IneqSlide, BG, INK, MUTED, GOLD, GREEN, VIOLET, AMBER, BLUE,
    make_axis, solution_group, DOT_R,
)


class InequalitySigns(IneqSlide):
    def construct(self):
        self.camera.background_color = BG
        bar = self.title_bar(r"Inequality Signs")
        self.next_slide()

        # ── Slide 1: the four signs at a glance ───────────────────────────
        overview = self._overview()
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in overview],
                              lag_ratio=0.18))
        self.next_slide()
        self.play(FadeOut(overview))

        # ── Slides 2-5: one sign per slide, built on a number line ────────
        prev = None
        specs = [
            # parts,                 sign_col, name,                       ex,                                       boundary, right, closed, numbers, x_min, x_max
            (("x", ">", "8"),        GREEN,  "Greater than",              r"e.g. $9,\ 10,\ 13,\ 28\,\ldots$",       8,  True,  False, [-2, 0, 2, 4, 6, 8, 10, 12], -3, 13),
            (("x", r"\geq", "-3"),   VIOLET, "Greater than or equal to",  r"e.g. $-3,\ -2,\ -1,\ 0\,\ldots$",       -3, True,  True,  [-6, -4, -3, -2, 0, 2, 4],   -7, 5),
            (("x", "<", "8"),        AMBER,  "Smaller than",              r"e.g. $7,\ 6,\ 5,\ 0\,\ldots$",          8,  False, False, [-2, 0, 2, 4, 6, 8, 10, 12], -3, 13),
            (("x", r"\leq", "-3"),   BLUE,   "Smaller than or equal to",  r"e.g. $-3,\ -5,\ -10\,\ldots$",          -3, False, True,  [-6, -4, -3, -2, 0, 2, 4],   -7, 5),
        ]
        for spec in specs:
            grp = self._sign_slide(*spec)
            if prev is not None:
                self.play(FadeOut(prev))
            self.play(FadeIn(grp[0]))            # statement + name + examples
            self.play(*grp[1])                    # number-line build animations
            prev = grp[2]
            self.next_slide()

        self.play(FadeOut(prev))

        # ── Slide 6: the open / closed dot rule ───────────────────────────
        rule = self._dot_rule()
        self.play(FadeIn(rule[0]))
        self.play(*rule[1])
        self.next_slide()

    # ----------------------------------------------------------------------
    def _overview(self):
        items = [
            (("x", ">", "8"),      GREEN,  "Greater than"),
            (("x", r"\geq", "-3"), VIOLET, "Greater than or equal to"),
            (("x", "<", "8"),      AMBER,  "Smaller than"),
            (("x", r"\leq", "-3"), BLUE,   "Smaller than or equal to"),
        ]
        cards = []
        for parts, col, name in items:
            stmt = MathTex(*parts, font_size=72, color=INK)
            stmt[1].set_color(col)
            nm = Tex(name, font_size=32, color=col)
            inner = VGroup(stmt, nm).arrange(DOWN, buff=0.28)
            box = RoundedRectangle(
                corner_radius=0.18, width=5.6, height=2.25,
                stroke_color=col, stroke_width=2.0,
                fill_color=col, fill_opacity=0.08,
            )
            inner.move_to(box.get_center())
            cards.append(VGroup(box, inner))
        grid = VGroup(*cards).arrange_in_grid(rows=2, cols=2, buff=(0.55, 0.5))
        grid.move_to([0, -0.45, 0])
        return grid

    def _sign_slide(self, parts, sign_col, name, ex, boundary, to_right,
                    closed, numbers, x_min, x_max):
        stmt = MathTex(*parts, font_size=100, color=INK)
        stmt[1].set_color(sign_col)
        stmt.move_to([0, 1.45, 0])
        nm = Tex(name, font_size=44, color=sign_col).next_to(stmt, DOWN, buff=0.3)
        examples = Tex(ex, font_size=32, color=MUTED).next_to(nm, DOWN, buff=0.26)
        static = VGroup(stmt, nm, examples)

        nl = make_axis(numbers, x_min, x_max, y=-2.25)
        connector, dot, ray = solution_group(nl, boundary, to_right, closed,
                                              sign_col, rise=0.95)

        anims = [
            Create(nl),
            Create(connector),
            GrowFromCenter(dot),
            Create(ray),
        ]
        whole = VGroup(static, nl, connector, dot, ray)
        return (static, anims, whole, nl)

    def _dot_rule(self):
        # left: the two signs + rule text (fixed left margin);
        # right: a mini number line with a short vertical connector to the dot.
        MINI_X = 2.7          # common centre for both mini lines (so they align)
        statics, anims = [], []

        def row(seg_y, sign_a, col_a, sign_b, col_b, dot_closed, headline, sub):
            label = MathTex(sign_a, r"\;\;", sign_b, font_size=58, color=INK)
            label[0].set_color(col_a)
            label[2].set_color(col_b)
            head = Tex(headline, font_size=36, color=INK)
            note = Tex(sub, font_size=26, color=MUTED)
            text = VGroup(head, note).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
            left = VGroup(label, text).arrange(RIGHT, buff=0.5)
            left.move_to([0, seg_y + 0.25, 0]).to_edge(LEFT, buff=1.0)

            seg = Line(LEFT * 1.5, RIGHT * 1.5, color=INK, stroke_width=3)
            seg.add_tip(tip_length=0.2, tip_width=0.18)
            seg.add_tip(tip_length=0.2, tip_width=0.18, at_start=True)
            seg.move_to([MINI_X, seg_y, 0])
            c = seg.get_center()
            accent = col_b if dot_closed else col_a
            top = c + UP * 0.55
            connector = Line(c, top + DOWN * DOT_R, color=accent, stroke_width=3)
            if dot_closed:
                d = Dot(top, radius=DOT_R, color=accent)
            else:
                d = Circle(radius=DOT_R, color=accent, stroke_width=5,
                           fill_color=BG, fill_opacity=1.0).move_to(top)

            statics.append(left)
            anims.extend([Create(seg), Create(connector), GrowFromCenter(d)])
            return VGroup(left, seg, connector, d)

        r1 = row(0.55, "<", AMBER, ">", GREEN, False,
                 r"Open circle", r"boundary value is \emph{not} included")
        r2 = row(-1.35, r"\leq", BLUE, r"\geq", VIOLET, True,
                 r"Closed circle", r"boundary value \emph{is} included")

        whole = VGroup(r1, r2)
        return (VGroup(*statics), anims, whole)
