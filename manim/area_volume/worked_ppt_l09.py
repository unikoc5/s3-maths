r"""PPT-driven worked solutions — L09 (Area and Volume 3).

Qc2Solution is a custom animated deck matching the 2025 PPT colours and
step sequence for the scale-drawing height question.
"""
from __future__ import annotations

import sys
import pathlib

import numpy as np
from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_styles import BG, INK  # noqa: E402

# PPT colour palette (QC2)
C_ONE = ManimColor("#FFD54F")       # 1 cm  — yellow
C_NINE = ManimColor("#F06292")      # 9 m   — pink/red
C_ACTUAL = ManimColor("#66BB6A")    # 126 m — green
C_DRAW = ManimColor("#64B5F6")      # height in drawing / answer — blue
C_X = ManimColor("#4FC3F7")         # working variable x


def _script(txt: str, size: int = 34, color=INK) -> Text:
    return Text(txt, font="Segoe Script", font_size=size, color=color, slant=ITALIC)


def _qc2_question() -> VGroup:
    badge = Text("2.", font="Segoe UI", font_size=40, color=INK, weight=BOLD).to_corner(UL, buff=0.5)

    row1 = VGroup(
        Text("Victor wants to make a scale drawing of a building with a scale of ",
             font="Segoe UI", font_size=30, color=INK),
        Text("1 cm", font="Segoe UI", font_size=30, color=C_ONE, weight=BOLD),
        Text(" : ", font="Segoe UI", font_size=30, color=INK),
        Text("9 m", font="Segoe UI", font_size=30, color=C_NINE, weight=BOLD),
        Text(".", font="Segoe UI", font_size=30, color=INK),
    ).arrange(RIGHT, buff=0.05, aligned_edge=DOWN)

    row2 = VGroup(
        Text("If the actual height of the building is ", font="Segoe UI", font_size=30, color=INK),
        Text("126 m", font="Segoe UI", font_size=30, color=C_ACTUAL, weight=BOLD),
        Text(", what should be its ", font="Segoe UI", font_size=30, color=INK),
        Text("height in the drawing", font="Segoe UI", font_size=30, color=C_DRAW, weight=BOLD),
        Text(" in cm?", font="Segoe UI", font_size=30, color=INK),
    ).arrange(RIGHT, buff=0.05, aligned_edge=DOWN)

    body = VGroup(row1, row2).arrange(DOWN, buff=0.28, aligned_edge=LEFT)
    grp = VGroup(badge, body).shift(UP * 0.15)
    if grp.width > config.frame_width - 1.0:
        grp.scale((config.frame_width - 1.0) / grp.width)
    return grp


def _colored_ratio() -> MathTex:
    eq = MathTex(
        "x", r"\text{ cm}", ":", "126", r"\text{ m}", "=",
        "1", r"\text{ cm}", ":", "9", r"\text{ m}",
    ).scale(1.15)
    eq.set_color_by_tex("x", C_X)
    eq.set_color_by_tex("126", C_ACTUAL)
    eq.set_color_by_tex("1", C_ONE)
    eq.set_color_by_tex("9", C_NINE)
    return eq


def _colored_fraction() -> MathTex:
    eq = MathTex(
        r"\frac{", "x", r"\text{ cm}}{", "126", r"\text{ m}}",
        "=",
        r"\frac{", "1", r"\text{ cm}}{", "9", r"\text{ m}}",
    ).scale(1.15)
    eq.set_color_by_tex("x", C_X)
    eq.set_color_by_tex("126", C_ACTUAL)
    eq.set_color_by_tex("1", C_ONE)
    eq.set_color_by_tex("9", C_NINE)
    return eq


def _solve_line() -> MathTex:
    eq = MathTex("x", "=", r"\frac{", "1", "}{", "9", "}", r"\times", "126").scale(1.2)
    eq.set_color_by_tex("x", C_X)
    eq.set_color_by_tex("1", C_ONE)
    eq.set_color_by_tex("9", C_NINE)
    eq.set_color_by_tex("126", C_ACTUAL)
    return eq


class Qc2Solution(Slide):
    """Scale drawing height — PPT-accurate (QC2)."""

    def construct(self):
        self.camera.background_color = BG

        question = _qc2_question()
        self.play(FadeIn(question, shift=0.2 * UP))
        self.wait(0.3)
        self.next_slide()

        self.play(question.animate.scale(0.65).to_edge(UP, buff=0.3))
        let_line = _script("Let x cm be the height of the building in the drawing")
        let_line.next_to(question, DOWN, buff=0.55).align_to(question, LEFT).shift(RIGHT * 0.25)
        self.play(FadeIn(let_line, shift=0.15 * UP))
        self.wait(0.25)
        self.next_slide()

        ratio = _colored_ratio()
        ratio.next_to(let_line, DOWN, buff=0.65)
        self.play(FadeIn(ratio, shift=0.12 * UP))
        self.wait(0.25)
        self.next_slide()

        frac = _colored_fraction()
        frac.move_to(ratio)
        self.play(TransformMatchingTex(ratio, frac, transform_mismatches=True), run_time=1.1)
        self.wait(0.2)
        self.next_slide()

        solve = _solve_line()
        solve.next_to(frac, DOWN, buff=0.55).align_to(frac, LEFT)
        self.play(FadeIn(solve, shift=0.12 * UP))
        self.wait(0.2)
        self.next_slide()

        result = MathTex("x", "=", "14").scale(1.35)
        result.set_color_by_tex("x", C_X)
        result.set_color_by_tex("14", C_DRAW)
        result.next_to(solve, DOWN, buff=0.45).align_to(solve, LEFT)
        self.play(FadeIn(result, shift=0.1 * UP))
        self.play(Circumscribe(result[2], color=C_DRAW, fade_out=True))
        self.wait(0.2)
        self.next_slide()

        conclusion = VGroup(
            MathTex(r"\therefore", color=C_DRAW).scale(1.0),
            _script("The height of the building in the drawing is ", size=30),
            Text("14", font="Segoe Script", font_size=34, color=C_DRAW, weight=BOLD, slant=ITALIC),
            _script(" cm", size=30),
        ).arrange(RIGHT, buff=0.08, aligned_edge=DOWN)
        conclusion.next_to(result, DOWN, buff=0.55).align_to(solve, LEFT)
        self.play(FadeIn(conclusion, shift=0.12 * UP))
        self.wait(0.3)
        self.next_slide()


# PPT colour palette (QC4)
C_FIND = ManimColor("#FFB74D")      # Find the unknown — amber
C_HYP = ManimColor("#66BB6A")      # corresponding lengths 3, 5 — green
C_AREA = ManimColor("#FFD54F")      # area values — yellow
C_T = ManimColor("#64B5F6")         # unknown T — blue
C_TRI = ManimColor("#b0bec5")       # triangle fill


def _tri_one(scale: float, hyp: str, area: str, center: np.ndarray) -> VGroup:
    u = 0.78
    leg_w, leg_h = 4 * u * scale, 3 * u * scale
    bl = center + LEFT * leg_w / 2 + DOWN * leg_h / 2
    br = bl + RIGHT * leg_w
    tl = bl + UP * leg_h
    tri = Polygon(bl, br, tl, stroke_color=WHITE, stroke_width=2.8, fill_color=C_TRI, fill_opacity=0.55)
    sq = 0.13 * scale
    ra = VGroup(
        Line(bl + RIGHT * sq, bl + RIGHT * sq + UP * sq, color=WHITE, stroke_width=1.8),
        Line(bl + RIGHT * sq + UP * sq, bl + UP * sq, color=WHITE, stroke_width=1.8),
    )
    hyp_lbl = MathTex(r"\mathbf{" + hyp + r"}\text{ cm}", font_size=34, color=C_HYP)
    hyp_lbl.move_to((br + tl) / 2 + RIGHT * 0.28 + UP * 0.1)
    area_lbl = MathTex(r"\text{area}=", area, r"\text{ cm}^2", font_size=32)
    area_lbl[1].set_color(C_T if area == "T" else C_AREA)
    area_lbl.next_to(tri, DOWN, buff=0.22)
    return VGroup(tri, ra, hyp_lbl, area_lbl)


def _tri_pair() -> VGroup:
    return VGroup(
        _tri_one(1.0, "3", "2.7", LEFT * 2.4),
        _tri_one(5 / 3, "5", "T", RIGHT * 2.6),
    )


def _qc4_question() -> VGroup:
    badge = Text("4.", font="Segoe UI", font_size=40, color=INK, weight=BOLD).to_corner(UL, buff=0.5)
    row = VGroup(
        Text("Find the unknown", font="Segoe UI", font_size=30, color=C_FIND, weight=BOLD),
        Text(" in each of the following pairs of similar plane figures,", font="Segoe UI", font_size=28, color=INK),
    ).arrange(RIGHT, buff=0.06, aligned_edge=DOWN)
    row2 = Text("where the marked lengths are corresponding lengths.",
                font="Segoe UI", font_size=28, color=INK)
    row2.next_to(row, DOWN, buff=0.22, aligned_edge=LEFT)
    part = Text("(a)", font="Segoe UI", font_size=32, color=INK, weight=BOLD)
    part.next_to(row2, DOWN, buff=0.35, aligned_edge=LEFT)
    body = VGroup(row, row2, part)
    grp = VGroup(badge, body).shift(UP * 0.35)
    if grp.width > config.frame_width - 1.0:
        grp.scale((config.frame_width - 1.0) / grp.width)
    return grp


class Qc4Solution(Slide):
    """Similar plane figures — part (a), triangle pair (QC4)."""

    def construct(self):
        self.camera.background_color = BG

        question = _qc4_question()
        self.play(FadeIn(question, shift=0.2 * UP))
        self.wait(0.3)
        self.next_slide()

        self.play(question.animate.scale(0.58).to_edge(UP, buff=0.28))
        tris = _tri_pair()
        tris.next_to(question, DOWN, buff=0.45)
        self.play(
            FadeIn(tris[0], shift=0.1 * UP),
            FadeIn(tris[1], shift=0.1 * UP),
        )
        self.wait(0.3)
        self.next_slide()

        rule = MathTex(
            r"\text{Areas of similar figures: }",
            r"\dfrac{A_2}{A_1}=\left(\dfrac{L_2}{L_1}\right)^2",
        ).scale(1.05)
        rule.next_to(tris, DOWN, buff=0.55)
        self.play(FadeIn(rule, shift=0.12 * UP))
        self.wait(0.2)
        self.next_slide()

        setup = MathTex(
            r"\dfrac{", "T", r"\text{ cm}^2}{", "2.7", r"\text{ cm}^2}",
            r"=\left(\dfrac{", "5", "}{", "3", "}\right)^2",
        ).scale(1.1)
        setup.set_color_by_tex("T", C_T)
        setup.set_color_by_tex("2.7", C_AREA)
        setup.set_color_by_tex("5", C_HYP)
        setup.set_color_by_tex("3", C_HYP)
        setup.next_to(rule, DOWN, buff=0.5)
        self.play(FadeIn(setup, shift=0.12 * UP))
        self.wait(0.2)
        self.next_slide()

        simp = MathTex(
            r"\dfrac{", "T", "}{", "2.7", "}", r"=", r"\dfrac{25}{9}",
        ).scale(1.15)
        simp.set_color_by_tex("T", C_T)
        simp.set_color_by_tex("2.7", C_AREA)
        simp.next_to(setup, DOWN, buff=0.45).align_to(setup, LEFT)
        self.play(FadeIn(simp, shift=0.1 * UP))
        self.wait(0.2)
        self.next_slide()

        solve = MathTex(
            "T", "=", r"\dfrac{25}{9}", r"\times", "2.7",
        ).scale(1.15)
        solve.set_color_by_tex("T", C_T)
        solve.set_color_by_tex("2.7", C_AREA)
        solve.next_to(simp, DOWN, buff=0.45).align_to(simp, LEFT)
        self.play(FadeIn(solve, shift=0.1 * UP))
        self.wait(0.2)
        self.next_slide()

        result = MathTex("T", "=", "7.5").scale(1.35)
        result.set_color_by_tex("T", C_T)
        result.set_color_by_tex("7.5", C_T)
        result.next_to(solve, DOWN, buff=0.45).align_to(solve, LEFT)
        self.play(FadeIn(result, shift=0.1 * UP))
        self.play(Circumscribe(result[2], color=C_T, fade_out=True))
        self.wait(0.3)
        self.next_slide()
