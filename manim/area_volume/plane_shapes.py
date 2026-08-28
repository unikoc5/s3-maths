"""Area & Volume - Part 1 (Concept & Formula): Areas of 2D shapes.

A Manim-Slides deck. One slide per shape:
    * the shape is drawn large on the centre-left,
    * its area formula is built on the centre-right, *step by step*: the
      structural skeleton (``A =``) first, then every variable is "derived"
      from its figure label with TransformFromCopy, then the remaining
      operators (e.g. ``/2``) are revealed,
    * every symbol keeps a fixed colour (see av_styles.SYMBOL); the matching
      symbol in the formula uses the same colour so the eye can follow it.

Render:
    manim-slides render plane_shapes.py PlaneShapes --quality h
    manim-slides convert PlaneShapes <out>/index.html --to html
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_styles import (  # noqa: E402
    BG, INK, GOLD, BLUE, AMBER, GREEN, PINK, VIOLET,
    SYMBOL, FILL, STROKE, THIN, FILL_OPACITY,
)

# Layout anchors -----------------------------------------------------------
LEFT_X = -3.7
RIGHT_X = 3.4
LABEL_FS = 44
FORMULA_FS = 60
DESC_SCALE = 0.95
MAX_FORMULA_W = 6.2


def sym(tex: str, key: str | None = None, fs: int = LABEL_FS) -> MathTex:
    """A coloured symbol label; colour comes from the symbol table."""
    key = key if key is not None else tex
    return MathTex(tex, font_size=fs, color=SYMBOL.get(key, INK))


def m(tex: str, color=INK, fs: int = FORMULA_FS, *parts) -> MathTex:
    """Shorthand MathTex in the formula font; extra `parts` -> multi-arg."""
    if parts:
        return MathTex(tex, *parts, font_size=fs, color=color)
    return MathTex(tex, font_size=fs, color=color)


def right_angle_mark(corner, d1, d2, size=0.28, color=INK):
    """Small right-angle square at `corner`, legs along unit dirs d1, d2."""
    p0 = corner + d1 * size
    p1 = corner + d1 * size + d2 * size
    p2 = corner + d2 * size
    return VMobject(stroke_color=color, stroke_width=THIN).set_points_as_corners(
        [p0, p1, p2]
    )


def fraction(num: VMobject, den: VMobject, buff: float = 0.16) -> VGroup:
    """Stack `num` over `den` with a fraction bar. Returns VGroup(num, bar, den)."""
    bar = Line(ORIGIN, RIGHT, color=INK, stroke_width=4)
    bar.set_width(max(num.width, den.width) + 0.3)
    num.next_to(bar, UP, buff=buff)
    den.next_to(bar, DOWN, buff=buff)
    return VGroup(num, bar, den)


class PlaneShapes(Slide):
    def construct(self):
        self.camera.background_color = BG

        title = Tex(r"Area of Different Shapes", font_size=54, color=INK)
        title.to_edge(UP, buff=0.55)
        accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
        accent.set_width(title.width + 0.6).next_to(title, DOWN, buff=0.15)
        self.play(Write(title), GrowFromCenter(accent))
        self.next_slide()

        builders = [
            self.square, self.rectangle, self.parallelogram, self.rhombus,
            self.triangle, self.trapezium, self.circle, self.sector,
        ]
        prev = None
        for build in builders:
            if prev is not None:
                self.play(FadeOut(prev))
            prev = build()
            self.next_slide()

    # ---- step-based right-side formula reveal ----------------------------
    def reveal(self, desc: Tex, formula: VMobject, steps):
        """Place desc+formula centre-right and play `steps` in order.

        Each step is one of:
            ("write", mobject)                 -> Write
            ("derive", [(src, part), ...])     -> TransformFromCopy (parallel)
            ("merge", [src_a, src_b], target)  -> two figure labels into one part
        Formula sub-mobjects are positioned up-front; nothing is shown until
        its own step, so the formula assembles piece by piece.
        """
        desc.set_color(GOLD).scale(DESC_SCALE)
        if formula.width > MAX_FORMULA_W:
            formula.scale(MAX_FORMULA_W / formula.width)
        grp = VGroup(desc, formula).arrange(DOWN, buff=0.62, aligned_edge=LEFT)
        grp.move_to([RIGHT_X, 0, 0])

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

    def _shape_kw(self, name):
        return dict(
            fill_color=FILL[name], fill_opacity=FILL_OPACITY,
            stroke_color=INK, stroke_width=STROKE,
        )

    # ---- 1. Square -------------------------------------------------------
    def square(self):
        s = 3.0
        sq = Square(side_length=s, **self._shape_kw("square"))
        sq.move_to([LEFT_X, 0, 0])
        l_bottom = sym("l").next_to(sq, DOWN, buff=0.3)
        l_left = sym("l").next_to(sq, LEFT, buff=0.3)

        self.play(DrawBorderThenFill(sq))
        self.play(Write(l_bottom), Write(l_left))

        desc = Tex(r"Area of a Square")
        formula = m("A", INK, FORMULA_FS, "=", "l", "^{2}")
        formula[2].set_color(BLUE)   # l
        formula[3].set_color(INK)    # exponent
        l_sq = VGroup(formula[2], formula[3])
        grp = self.reveal(desc, formula, [
            ("write", VGroup(formula[0], formula[1])),
            ("merge", [l_left, l_bottom], l_sq),   # both l's -> l^2
        ])
        return VGroup(sq, l_bottom, l_left, grp)

    # ---- 2. Rectangle ----------------------------------------------------
    def rectangle(self):
        rect = Rectangle(width=4.2, height=2.6, **self._shape_kw("rectangle"))
        rect.move_to([LEFT_X, 0, 0])
        l_lab = sym("l").next_to(rect, DOWN, buff=0.3)
        w_lab = sym("w").next_to(rect, RIGHT, buff=0.3)

        self.play(DrawBorderThenFill(rect))
        self.play(Write(l_lab), Write(w_lab))

        desc = Tex(r"Area of a Rectangle")
        formula = m("A", INK, FORMULA_FS, "=", "l", "w")
        formula[2].set_color(BLUE)
        formula[3].set_color(AMBER)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(formula[0], formula[1])),
            ("derive", [(l_lab, formula[2]), (w_lab, formula[3])]),
        ])
        return VGroup(rect, l_lab, w_lab, grp)

    # ---- 3. Parallelogram -----------------------------------------------
    def parallelogram(self):
        shift = 0.7
        bl, br = LEFT * 1.6 + DOWN * 1.1, RIGHT * 1.6 + DOWN * 1.1
        tl, tr = bl + UP * 2.2 + RIGHT * shift, br + UP * 2.2 + RIGHT * shift
        para = Polygon(bl, br, tr, tl, **self._shape_kw("parallelogram"))

        foot = np.array([0.4, bl[1], 0.0])
        top_pt = np.array([0.4, tl[1], 0.0])
        alt = DashedLine(top_pt, foot, color=GREEN, stroke_width=THIN + 0.5)
        ra = right_angle_mark(foot, LEFT, UP, color=GREEN)
        b_lab = sym("b").next_to(para, DOWN, buff=0.3).shift(LEFT * 0.2)
        h_lab = sym("h").next_to(alt, RIGHT, buff=0.18)

        shape = VGroup(para, alt, ra, b_lab, h_lab).move_to([LEFT_X, 0, 0])

        self.play(DrawBorderThenFill(para))
        self.play(Create(alt), Create(ra))
        self.play(Write(b_lab), Write(h_lab))

        desc = Tex(r"Area of a Parallelogram")
        formula = m("A", INK, FORMULA_FS, "=", "b", "h")
        formula[2].set_color(AMBER)
        formula[3].set_color(GREEN)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(formula[0], formula[1])),
            ("derive", [(b_lab, formula[2]), (h_lab, formula[3])]),
        ])
        return VGroup(shape, grp)

    # ---- 4. Rhombus ------------------------------------------------------
    def rhombus(self):
        top, bot = UP * 1.7, DOWN * 1.7
        rt, lf = RIGHT * 1.25, LEFT * 1.25
        rho = Polygon(top, rt, bot, lf, **self._shape_kw("rhombus"))

        d1 = DashedLine(lf, rt, color=BLUE, stroke_width=THIN + 0.5)
        d2 = DashedLine(top, bot, color=PINK, stroke_width=THIN + 0.5)
        d1_lab = sym("d_1").scale(0.85).next_to(rt, RIGHT, buff=0.15).shift(UP * 0.1)
        d2_lab = sym("d_2").scale(0.85).next_to(bot, DOWN, buff=0.15)

        shape = VGroup(rho, d1, d2, d1_lab, d2_lab).move_to([LEFT_X, 0, 0])

        self.play(DrawBorderThenFill(rho))
        self.play(Create(d1), Create(d2))
        self.play(Write(d1_lab), Write(d2_lab))

        desc = Tex(r"Area of a Rhombus")
        lhs = m("A", INK, FORMULA_FS, "=")
        d1_p = m("d_1", BLUE)
        d2_p = m("d_2", PINK)
        num = VGroup(d1_p, d2_p).arrange(RIGHT, buff=0.22)
        den = m("2", INK)
        frac = fraction(num, den)
        formula = VGroup(lhs, frac).arrange(RIGHT, buff=0.25)
        grp = self.reveal(desc, formula, [
            ("write", lhs),
            ("derive", [(d1_lab, d1_p), (d2_lab, d2_p)]),
            ("write", VGroup(frac[1], frac[2])),   # /2
        ])
        return VGroup(shape, grp)

    # ---- 5. Triangle -----------------------------------------------------
    def triangle(self):
        apex = UP * 1.7 + RIGHT * 0.3
        bl, br = LEFT * 1.6 + DOWN * 1.4, RIGHT * 1.6 + DOWN * 1.4
        tri = Polygon(bl, br, apex, **self._shape_kw("triangle"))

        foot = np.array([apex[0], bl[1], 0.0])
        alt = DashedLine(apex, foot, color=GREEN, stroke_width=THIN + 0.5)
        ra = right_angle_mark(foot, LEFT, UP, color=GREEN)
        b_lab = sym("b").next_to(tri, DOWN, buff=0.3)
        h_lab = sym("h").next_to(alt, RIGHT, buff=0.18)

        shape = VGroup(tri, alt, ra, b_lab, h_lab).move_to([LEFT_X, 0, 0])

        self.play(DrawBorderThenFill(tri))
        self.play(Create(alt), Create(ra))
        self.play(Write(b_lab), Write(h_lab))

        desc = Tex(r"Area of a Triangle")
        lhs = m("A", INK, FORMULA_FS, "=")
        b_p = m("b", AMBER)
        h_p = m("h", GREEN)
        num = VGroup(b_p, h_p).arrange(RIGHT, buff=0.22)
        den = m("2", INK)
        frac = fraction(num, den)
        formula = VGroup(lhs, frac).arrange(RIGHT, buff=0.25)
        grp = self.reveal(desc, formula, [
            ("write", lhs),
            ("derive", [(b_lab, b_p), (h_lab, h_p)]),
            ("write", VGroup(frac[1], frac[2])),   # /2
        ])
        return VGroup(shape, grp)

    # ---- 6. Trapezium ----------------------------------------------------
    def trapezium(self):
        tl, tr = LEFT * 1.0 + UP * 1.1, RIGHT * 1.0 + UP * 1.1
        bl, br = LEFT * 1.8 + DOWN * 1.1, RIGHT * 1.8 + DOWN * 1.1
        trap = Polygon(bl, br, tr, tl, **self._shape_kw("trapezium"))

        foot = np.array([-0.55, bl[1], 0.0])
        top_pt = np.array([-0.55, tl[1], 0.0])
        alt = DashedLine(top_pt, foot, color=GREEN, stroke_width=THIN + 0.5)
        ra = right_angle_mark(foot, RIGHT, UP, color=GREEN)
        b1_lab = sym("b_1").scale(0.85).next_to(VGroup(Dot(tl), Dot(tr)), UP, buff=0.22)
        b2_lab = sym("b_2").scale(0.85).next_to(trap, DOWN, buff=0.3)
        h_lab = sym("h").next_to(alt, LEFT, buff=0.18)

        shape = VGroup(trap, alt, ra, b1_lab, b2_lab, h_lab).move_to([LEFT_X, 0, 0])

        self.play(DrawBorderThenFill(trap))
        self.play(Create(alt), Create(ra))
        self.play(Write(b1_lab), Write(b2_lab), Write(h_lab))

        desc = Tex(r"Area of a Trapezium")
        lhs = m("A", INK, FORMULA_FS, "=")
        num = m("(", INK, FORMULA_FS, "b_1", "+", "b_2", ")")
        num[1].set_color(BLUE)
        num[3].set_color(AMBER)
        den = m("2", INK)
        frac = fraction(num, den)
        h_p = m("h", GREEN)
        formula = VGroup(lhs, frac, h_p).arrange(RIGHT, buff=0.22)
        grp = self.reveal(desc, formula, [
            ("write", lhs),
            ("derive", [(b1_lab, num[1]), (b2_lab, num[3])]),
            ("write", VGroup(num[0], num[2], num[4])),   # ( + )
            ("write", VGroup(frac[1], frac[2])),         # /2
            ("derive", [(h_lab, h_p)]),
        ])
        return VGroup(shape, grp)

    # ---- 7. Circle -------------------------------------------------------
    def circle(self):
        circ = Circle(radius=1.9, **self._shape_kw("circle"))
        circ.move_to([LEFT_X, 0, 0])
        center = circ.get_center()
        edge = center + RIGHT * 1.9
        radius = Line(center, edge, color=BLUE, stroke_width=STROKE)
        dot = Dot(center, radius=0.05, color=INK)
        r_lab = sym("r").next_to(radius, UP, buff=0.12)

        self.play(DrawBorderThenFill(circ))
        self.play(Create(radius), FadeIn(dot), Write(r_lab))

        desc = Tex(r"Area of a Circle")
        # one MathTex so A, =, pi, r all share a baseline
        formula = m("A", INK, FORMULA_FS, "=", r"\pi", "r", "^{2}")
        formula[3].set_color(BLUE)   # r
        grp = self.reveal(desc, formula, [
            ("write", VGroup(formula[0], formula[1], formula[2])),  # A = pi
            ("derive", [(r_lab, formula[3])]),                      # r from radius
            ("write", formula[4]),                                  # ^2
        ])
        return VGroup(circ, radius, dot, r_lab, grp)

    # ---- 8. Sector -------------------------------------------------------
    def sector(self):
        R = 2.9
        ang = 70 * DEGREES
        sec = AnnularSector(
            inner_radius=0, outer_radius=R, angle=ang, start_angle=0,
            **self._shape_kw("sector"),
        )
        center = sec.get_arc_center()
        e0 = center + R * RIGHT
        radius = Line(center, e0, color=BLUE, stroke_width=STROKE)
        r_lab = sym("r").next_to(radius, DOWN, buff=0.18)
        arc = Arc(radius=0.7, start_angle=0, angle=ang, arc_center=center,
                  color=VIOLET, stroke_width=STROKE)
        th_lab = MathTex(r"\theta", font_size=LABEL_FS, color=VIOLET)
        th_lab.move_to(center + 1.15 * np.array([np.cos(ang / 2), np.sin(ang / 2), 0]))

        shape = VGroup(sec, radius, arc, r_lab, th_lab).move_to([LEFT_X, 0, 0])

        self.play(DrawBorderThenFill(sec))
        self.play(Create(radius), Write(r_lab))
        self.play(Create(arc), Write(th_lab))

        desc = Tex(r"Area of a Sector")
        # one MathTex for the left side so A, =, pi, r, x share a baseline
        left = m("A", INK, FORMULA_FS, "=", r"\pi", "r", "^{2}", r"\times")
        left[3].set_color(BLUE)   # r
        num = m(r"\theta", VIOLET)
        den = m(r"360^{\circ}", INK)
        frac = fraction(num, den)
        formula = VGroup(left, frac).arrange(RIGHT, buff=0.2)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(left[0], left[1], left[2])),  # A = pi
            ("derive", [(r_lab, left[3])]),                # r
            ("write", left[4]),                            # ^2
            ("write", left[5]),                            # x
            ("derive", [(th_lab, num)]),                   # theta
            ("write", VGroup(frac[1], frac[2])),           # /360
        ])
        return VGroup(shape, grp)
