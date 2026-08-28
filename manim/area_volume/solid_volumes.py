"""Area & Volume - Part 1 (Concept & Formula): Volume & surface area of solids.

A Manim-Slides deck, one solid per slide (oblique 3D drawing centre-left,
formula assembled step-by-step centre-right). Same colour convention as the
2D-shapes deck: r -> blue, h -> green, base sides a/b -> blue/amber, slant l -> pink.

    1. Prism (cuboid)        V = base area x h = a x b x h
    2. Cylinder              V = pi r^2 h
    3. Pyramid (square base) V = 1/3 x base area x h = 1/3 x a x a x h
    4. Cone (volume)         V = 1/3 x pi r^2 h
    5. Cone (surface area)   Curved surface area = pi r l ;
                             Total surface area = pi r^2 + pi r l
    6. Sphere                V = 4/3 pi r^3 ;  Surface area = 4 pi r^2

Render:
    manim-slides render solid_volumes.py SolidVolumes --quality h
    manim-slides convert SolidVolumes <out>/index.html --to html
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_common import RevealSlide, m, LEFT_X, LABEL_FS, FORMULA_FS  # noqa: E402
from av_styles import (  # noqa: E402
    BG, INK, GOLD, BLUE, AMBER, GREEN, SLANT, FILL, BASE_FILL,
    STROKE, THIN,
)

BODY_OP = 0.28      # body face fill opacity (translucent solids)
BASE_OP = 0.6       # highlighted base-area face


def lab(tex: str, color, fs: int = LABEL_FS) -> MathTex:
    return MathTex(tex, color=color, font_size=fs)


def wlab(text: str, color, fs: int = 32) -> Tex:
    return Tex(text, color=color, font_size=fs)


def half_ellipse(rx: float, ry: float, lower: bool = True) -> VMobject:
    """Half-ellipse whose straight edge passes through ORIGIN (= ellipse centre).

    Built from a half-circle arc, then squashed in y *about the origin* so the
    diameter endpoints stay exactly on the x-axis (this is what keeps the rims
    connected to the cylinder/cone sides).
    """
    arc = Arc(radius=rx, start_angle=PI if lower else 0, angle=PI)
    arc.stretch(ry / rx, dim=1, about_point=ORIGIN)
    return arc


def vmeasure(top, bot, color, label_tex, lab_dir=RIGHT, fs=LABEL_FS):
    """Vertical dimension bar with end ticks; returns (group, label_mob)."""
    line = Line(top, bot, color=color, stroke_width=2.5)
    t1 = Line(top + LEFT * 0.1, top + RIGHT * 0.1, color=color, stroke_width=2.5)
    t2 = Line(bot + LEFT * 0.1, bot + RIGHT * 0.1, color=color, stroke_width=2.5)
    label = lab(label_tex, color, fs).next_to(line, lab_dir, buff=0.14)
    return VGroup(line, t1, t2, label), label


class SolidVolumes(RevealSlide):
    def construct(self):
        self.camera.background_color = BG

        title = Tex(r"Volume \& Surface Area of Solids", font_size=52, color=INK)
        title.to_edge(UP, buff=0.55)
        accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
        accent.set_width(title.width + 0.6).next_to(title, DOWN, buff=0.15)
        self.play(Write(title), GrowFromCenter(accent))
        self.next_slide()

        builders = [
            self.prism, self.cylinder, self.pyramid,
            self.cone_volume, self.cone_surface, self.sphere,
        ]
        prev = None
        for build in builders:
            if prev is not None:
                self.play(FadeOut(prev))
            prev = build()
            self.next_slide()

    def _place(self, group):
        group.move_to([LEFT_X, 0.1, 0])
        return group

    # ---- 1. Prism (cuboid slab) -----------------------------------------
    def prism(self):
        w, H = 3.2, 1.0
        o = np.array([1.15, 0.78, 0.0])
        A = np.array([-w / 2, -H / 2, 0]); B = np.array([w / 2, -H / 2, 0])
        C = np.array([w / 2, H / 2, 0]); D = np.array([-w / 2, H / 2, 0])
        front = Polygon(A, B, C, D, fill_color=FILL["cuboid"], fill_opacity=BODY_OP,
                        stroke_color=INK, stroke_width=STROKE)
        right = Polygon(B, C, C + o, B + o, fill_color=FILL["cuboid"],
                        fill_opacity=BODY_OP * 0.8, stroke_color=INK, stroke_width=STROKE)
        top = Polygon(D, C, C + o, D + o, fill_color=BASE_FILL, fill_opacity=BASE_OP,
                      stroke_color=INK, stroke_width=STROKE)
        hidden = VGroup(
            DashedLine(A + o, B + o, color=INK, stroke_width=THIN),
            DashedLine(A + o, D + o, color=INK, stroke_width=THIN),
            DashedLine(A + o, A, color=INK, stroke_width=THIN),
        )
        # base side labels a (front edge) and b (depth edge); h vertical
        a_lab = lab("a", BLUE).move_to((A + B) / 2 + DOWN * 0.32)
        b_lab = lab("b", AMBER).move_to((B + B + o) / 2 + RIGHT * 0.28 + DOWN * 0.05)
        hbar, h_lab = vmeasure(D + LEFT * 0.25, A + LEFT * 0.25, GREEN, "h", lab_dir=LEFT)

        group = self._place(VGroup(front, right, top, hidden, a_lab, b_lab, hbar))
        self.play(Create(front), Create(right), Create(top), Create(hidden))
        self.play(Write(a_lab), Write(b_lab), Create(hbar))

        desc = Tex(r"Volume of a Prism")
        l1 = m("V", INK, FORMULA_FS, "=", r"\text{base area}", r"\times", "h")
        l1[2].set_color(AMBER); l1[4].set_color(GREEN)
        l2 = m(r"\phantom{V}", INK, FORMULA_FS, "=", "a", r"\times", "b", r"\times", "h")
        l2[2].set_color(BLUE); l2[4].set_color(AMBER); l2[6].set_color(GREEN)
        formula = VGroup(l1, l2).arrange(DOWN, buff=0.45, aligned_edge=LEFT)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(l1[0], l1[1])),
            ("write", l1[2]),                       # base area
            ("write", l1[3]),                       # x
            ("derive", [(h_lab, l1[4])]),
            ("write", l2[1]),                       # =
            ("derive", [(a_lab, l2[2])]),
            ("write", l2[3]),                       # x
            ("derive", [(b_lab, l2[4])]),
            ("write", l2[5]),                       # x
            ("derive", [(h_lab, l2[6])]),
        ])
        return VGroup(group, grp)

    # ---- 2. Cylinder -----------------------------------------------------
    def cylinder(self):
        rx, ry, H = 1.3, 0.42, 2.5
        top_c = np.array([0, H / 2, 0]); bot_c = np.array([0, -H / 2, 0])
        # body fill = central rectangle + bottom half-disc so the silhouette is solid
        rect = Rectangle(width=2 * rx, height=H, fill_color=FILL["cylinder"],
                         fill_opacity=BODY_OP, stroke_width=0)
        bot_fill = Ellipse(width=2 * rx, height=2 * ry, fill_color=FILL["cylinder"],
                           fill_opacity=BODY_OP, stroke_width=0).move_to(bot_c)
        left = Line(top_c + LEFT * rx, bot_c + LEFT * rx, color=INK, stroke_width=STROKE)
        right = Line(top_c + RIGHT * rx, bot_c + RIGHT * rx, color=INK, stroke_width=STROKE)
        bfront = half_ellipse(rx, ry, lower=True).set_stroke(INK, STROKE).shift(bot_c)
        bback = DashedVMobject(
            half_ellipse(rx, ry, lower=False).set_stroke(INK, THIN).shift(bot_c),
            num_dashes=16)
        top = Ellipse(width=2 * rx, height=2 * ry, fill_color=BASE_FILL,
                      fill_opacity=BASE_OP, stroke_color=INK, stroke_width=STROKE).move_to(top_c)
        rad = Line(top_c, top_c + RIGHT * rx, color=BLUE, stroke_width=STROKE)
        r_lab = lab("r", BLUE).next_to(rad, UP, buff=0.06)
        hbar, h_lab = vmeasure(top_c + RIGHT * (rx + 0.5),
                               bot_c + RIGHT * (rx + 0.5), GREEN, "h", lab_dir=RIGHT)

        group = self._place(VGroup(rect, bot_fill, bback, bfront, left, right,
                                   top, rad, r_lab, hbar))
        self.play(FadeIn(rect), FadeIn(bot_fill), Create(left), Create(right),
                  Create(bfront), Create(bback))
        self.play(Create(top), Create(rad), Write(r_lab), Create(hbar))

        desc = Tex(r"Volume of a Cylinder")
        f = m("V", INK, FORMULA_FS, "=", r"\pi", "r", "^{2}", "h")
        f[3].set_color(BLUE); f[5].set_color(GREEN)
        grp = self.reveal(desc, f, [
            ("write", VGroup(f[0], f[1])),
            ("write", f[2]),                 # pi
            ("derive", [(r_lab, f[3])]),     # r
            ("write", f[4]),                 # ^2
            ("derive", [(h_lab, f[5])]),     # h
        ])
        return VGroup(group, grp)

    # ---- 3. Pyramid (square base) ---------------------------------------
    def pyramid(self):
        b = 2.5
        o = np.array([1.05, 0.62, 0.0])
        Hp = 2.6
        B1 = np.array([-b / 2, -1.0, 0]); B2 = np.array([b / 2, -1.0, 0])
        B3 = B2 + o; B4 = B1 + o
        base_c = (B1 + B2 + B3 + B4) / 4
        apex = base_c + UP * Hp
        base = Polygon(B1, B2, B3, B4, fill_color=BASE_FILL, fill_opacity=BASE_OP,
                       stroke_color=INK, stroke_width=STROKE)
        back_edge = DashedLine(B4, B3, color=INK, stroke_width=THIN)
        e1 = Line(apex, B1, color=INK, stroke_width=STROKE)
        e2 = Line(apex, B2, color=INK, stroke_width=STROKE)
        e3 = Line(apex, B3, color=INK, stroke_width=STROKE)
        e4 = DashedLine(apex, B4, color=INK, stroke_width=THIN)
        halt = DashedLine(apex, base_c, color=GREEN, stroke_width=2.5)
        h_lab = lab("h", GREEN).next_to(halt, LEFT, buff=0.1)
        # square base -> both sides labelled a
        a_front = lab("a", BLUE).move_to((B1 + B2) / 2 + DOWN * 0.3)
        a_depth = lab("a", BLUE).move_to((B2 + B3) / 2 + RIGHT * 0.3)

        group = self._place(VGroup(base, back_edge, e1, e2, e3, e4, halt,
                                   h_lab, a_front, a_depth))
        self.play(Create(base), Create(back_edge))
        self.play(Create(e1), Create(e2), Create(e3), Create(e4))
        self.play(Create(halt), Write(h_lab), Write(a_front), Write(a_depth))

        desc = Tex(r"Volume of a Pyramid")
        # 0 V,1 =,2 1/3,3 x,4 base area,5 x,6 h
        l1 = m("V", INK, FORMULA_FS, "=", r"\frac{1}{3}", r"\times",
               r"\text{base area}", r"\times", "h")
        l1[4].set_color(AMBER); l1[6].set_color(GREEN)
        # 0 phantom,1 =,2 1/3,3 x,4 a,5 x,6 a,7 x,8 h
        l2 = m(r"\phantom{V}", INK, FORMULA_FS, "=", r"\frac{1}{3}", r"\times",
               "a", r"\times", "a", r"\times", "h")
        l2[4].set_color(BLUE); l2[6].set_color(BLUE); l2[8].set_color(GREEN)
        # 0 phantom,1 =,2 1/3,3 x,4 a,5 ^2,6 x,7 h
        l3 = m(r"\phantom{V}", INK, FORMULA_FS, "=", r"\frac{1}{3}", r"\times",
               "a", "^{2}", r"\times", "h")
        l3[4].set_color(BLUE); l3[7].set_color(GREEN)
        formula = VGroup(l1, l2, l3).arrange(DOWN, buff=0.4, aligned_edge=LEFT)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(l1[0], l1[1])),
            ("write", l1[2]),                       # 1/3
            ("write", l1[3]),                       # x
            ("write", l1[4]),                       # base area
            ("write", l1[5]),                       # x
            ("derive", [(h_lab, l1[6])]),
            ("write", l2[1]),                       # =
            ("write", l2[2]),                       # 1/3
            ("write", l2[3]),                       # x
            ("derive", [(a_front, l2[4])]),
            ("write", l2[5]),                       # x
            ("derive", [(a_depth, l2[6])]),
            ("write", l2[7]),                       # x
            ("derive", [(h_lab, l2[8])]),
            ("write", VGroup(l3[1], l3[2], l3[3])),  # = 1/3 x
            ("merge", [l2[4], l2[6]], l3[4]),        # a x a -> a
            ("write", l3[5]),                        # ^2
            ("write", l3[6]),                        # x
            ("derive", [(h_lab, l3[7])]),
        ])
        return VGroup(group, grp)

    # ---- 4. Cone (volume) ------------------------------------------------
    def cone_volume(self):
        rx, ry, H = 1.35, 0.42, 2.8
        base_c = np.array([0, -H / 2, 0]); apex = np.array([0, H / 2, 0])
        bfront = half_ellipse(rx, ry, lower=True).set_stroke(INK, STROKE).shift(base_c)
        bback = DashedVMobject(
            half_ellipse(rx, ry, lower=False).set_stroke(INK, THIN).shift(base_c),
            num_dashes=16)
        fill = Ellipse(width=2 * rx, height=2 * ry, fill_color=BASE_FILL,
                       fill_opacity=BASE_OP * 0.7, stroke_width=0).move_to(base_c)
        sl = Line(apex, base_c + LEFT * rx, color=INK, stroke_width=STROKE)
        sr = Line(apex, base_c + RIGHT * rx, color=INK, stroke_width=STROKE)
        rad = Line(base_c, base_c + RIGHT * rx, color=BLUE, stroke_width=STROKE)
        r_lab = lab("r", BLUE).next_to(rad, DOWN, buff=0.08)
        halt = DashedLine(apex, base_c, color=GREEN, stroke_width=2.5)
        h_lab = lab("h", GREEN).next_to(halt, LEFT, buff=0.1)

        group = self._place(VGroup(fill, bback, bfront, sl, sr, halt, rad, r_lab, h_lab))
        self.play(Create(sl), Create(sr), Create(bfront), Create(bback), FadeIn(fill))
        self.play(Create(halt), Write(h_lab), Create(rad), Write(r_lab))

        desc = Tex(r"Volume of a Cone")
        # 0 V,1 =,2 1/3,3 x,4 pi,5 r,6 ^2,7 h
        f = m("V", INK, FORMULA_FS, "=", r"\frac{1}{3}", r"\times", r"\pi", "r", "^{2}", "h")
        f[5].set_color(BLUE); f[7].set_color(GREEN)
        grp = self.reveal(desc, f, [
            ("write", VGroup(f[0], f[1])),
            ("write", f[2]),                 # 1/3
            ("write", f[3]),                 # x
            ("write", f[4]),                 # pi
            ("derive", [(r_lab, f[5])]),     # r
            ("write", f[6]),                 # ^2
            ("derive", [(h_lab, f[7])]),     # h
        ])
        return VGroup(group, grp)

    # ---- 5. Cone (surface area) -----------------------------------------
    def cone_surface(self):
        rx, ry, H = 1.35, 0.42, 2.8
        base_c = np.array([0, -H / 2, 0]); apex = np.array([0, H / 2, 0])
        bfront = half_ellipse(rx, ry, lower=True).set_stroke(INK, STROKE).shift(base_c)
        bback = DashedVMobject(
            half_ellipse(rx, ry, lower=False).set_stroke(INK, THIN).shift(base_c),
            num_dashes=16)
        fill = Ellipse(width=2 * rx, height=2 * ry, fill_color=BASE_FILL,
                       fill_opacity=BASE_OP * 0.55, stroke_width=0).move_to(base_c)
        sl = Line(apex, base_c + LEFT * rx, color=INK, stroke_width=STROKE)
        sr = Line(apex, base_c + RIGHT * rx, color=SLANT, stroke_width=STROKE + 0.5)
        l_lab = lab("l", SLANT).move_to((apex + base_c + RIGHT * rx) / 2 + RIGHT * 0.3)
        rad = Line(base_c, base_c + RIGHT * rx * 0.92, color=BLUE, stroke_width=STROKE)
        r_lab = lab("r", BLUE).next_to(rad, DOWN, buff=0.06)
        halt = DashedLine(apex, base_c, color=GREEN, stroke_width=2.5)
        h_lab = lab("h", GREEN).next_to(halt, LEFT, buff=0.1)

        group = self._place(
            VGroup(fill, bback, bfront, sl, sr, halt, rad, r_lab, h_lab, l_lab))
        self.play(Create(sl), Create(bfront), Create(bback), FadeIn(fill))
        self.play(Create(sr), Write(l_lab))
        self.play(Create(halt), Write(h_lab), Create(rad), Write(r_lab))

        desc = Tex(r"Surface Area of a Cone")
        # 0 phrase,1 =,2 pi,3 r,4 l
        l1 = m(r"\text{Curved surface area}", INK, FORMULA_FS, "=", r"\pi", "r", "l")
        l1[3].set_color(BLUE); l1[4].set_color(SLANT)
        # 0 phrase,1 =,2 pi,3 r,4 ^2,5 +,6 pi,7 r,8 l
        l2 = m(r"\text{Total surface area}", INK, FORMULA_FS, "=", r"\pi", "r", "^{2}",
               "+", r"\pi", "r", "l")
        l2[3].set_color(BLUE); l2[7].set_color(BLUE); l2[8].set_color(SLANT)
        formula = VGroup(l1, l2).arrange(DOWN, buff=0.55, aligned_edge=LEFT)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(l1[0], l1[1])),
            ("write", l1[2]),                       # pi
            ("derive", [(r_lab, l1[3])]),
            ("derive", [(l_lab, l1[4])]),
            ("write", VGroup(l2[0], l2[1])),
            ("write", l2[2]),                       # pi
            ("derive", [(r_lab, l2[3])]),
            ("write", l2[4]),                       # ^2
            ("write", l2[5]),                       # +
            ("write", l2[6]),                       # pi
            ("derive", [(r_lab, l2[7])]),
            ("derive", [(l_lab, l2[8])]),
        ])
        return VGroup(group, grp)

    # ---- 6. Sphere -------------------------------------------------------
    def sphere(self):
        R = 1.95
        ball = Circle(radius=R, fill_color=FILL["sphere"], fill_opacity=BODY_OP,
                      stroke_color=INK, stroke_width=STROKE)
        eq_front = half_ellipse(R, R * 0.32, lower=True).set_stroke(INK, STROKE)
        eq_back = DashedVMobject(
            half_ellipse(R, R * 0.32, lower=False).set_stroke(INK, THIN), num_dashes=18)
        rad = Line(ORIGIN, RIGHT * R, color=BLUE, stroke_width=STROKE)
        r_lab = lab("r", BLUE).next_to(rad, UP, buff=0.06)

        group = self._place(VGroup(ball, eq_back, eq_front, rad, r_lab))
        self.play(Create(ball), Create(eq_front), Create(eq_back))
        self.play(Create(rad), Write(r_lab))

        desc = Tex(r"Sphere")
        # 0 V,1 =,2 4/3,3 pi,4 r,5 ^3
        l1 = m("V", INK, FORMULA_FS, "=", r"\frac{4}{3}", r"\pi", "r", "^{3}")
        l1[4].set_color(BLUE)
        # 0 phrase,1 =,2 4,3 pi,4 r,5 ^2
        l2 = m(r"\text{Surface area}", INK, FORMULA_FS, "=", "4", r"\pi", "r", "^{2}")
        l2[4].set_color(BLUE)
        formula = VGroup(l1, l2).arrange(DOWN, buff=0.55, aligned_edge=LEFT)
        grp = self.reveal(desc, formula, [
            ("write", VGroup(l1[0], l1[1])),
            ("write", l1[2]),               # 4/3
            ("write", l1[3]),               # pi
            ("derive", [(r_lab, l1[4])]),   # r
            ("write", l1[5]),               # ^3
            ("write", VGroup(l2[0], l2[1])),
            ("write", l2[2]),               # 4
            ("write", l2[3]),               # pi
            ("derive", [(r_lab, l2[4])]),   # r
            ("write", l2[5]),               # ^2
        ])
        return VGroup(group, grp)
