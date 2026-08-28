r"""PPT-driven worked solutions — L07 (Area and Volume 1).

Qa2Solution: LaTeX-only main deck (question pinned top-left). The labelled
trapezoidal prism lives in the dashboard SVG sub-panel, synced by step reveal.
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_styles import BG, INK  # noqa: E402

C_VOL = ManimColor("#F48FB1")
C_TSA = ManimColor("#64B5F6")
C_BASE = ManimColor("#FFD54F")
C_TOP = ManimColor("#FFB74D")
C_BOT = ManimColor("#66BB6A")
C_LEN = ManimColor("#4FC3F7")


def _hdr_question() -> MathTex:
    q = MathTex(
        r"\text{2. Find the }",
        r"\text{volume}",
        r"\text{ and the }",
        r"\text{total\ surface\ area}",
        r"\text{ of the following right solids}",
        font_size=28,
        color=INK,
    )
    q[1].set_color(C_VOL)
    q[3].set_color(C_TSA)
    q.to_corner(UL, buff=0.38)
    return q


def _hdr_part1() -> MathTex:
    p = MathTex(
        r"\mathbf{Part\ 1}",
        r"\text{ Find the }",
        r"\text{volume}",
        r"\text{ of the prism}",
        font_size=26,
        color=INK,
    )
    p[0].set_color(C_VOL)
    p[2].set_color(C_VOL)
    return p


class Qa2Solution(Slide):
    """Right-angled trapezoidal prism — volume (diagram in sub-panel)."""

    def construct(self):
        self.camera.background_color = BG

        # Slide 0 — prism in SVG sub-panel only (no main-deck text yet)
        self.wait(0.45)
        self.next_slide()

        question = _hdr_question()
        self.play(FadeIn(question))
        self.wait(0.25)
        self.next_slide()

        part1 = _hdr_part1()
        part1.next_to(question, DOWN, buff=0.22, aligned_edge=LEFT)
        header = VGroup(question, part1)
        self.play(FadeIn(part1))
        self.wait(0.2)
        self.next_slide()

        base_hint = MathTex(r"\text{Base (right-angled trapezium)}", font_size=30, color=C_BASE)
        base_hint.next_to(header, DOWN, buff=0.55, aligned_edge=LEFT)
        self.play(FadeIn(base_hint))
        self.wait(0.35)
        self.next_slide()

        self.play(FadeOut(base_hint))

        base_lbl = MathTex(r"\mathbf{Base\ area}", font_size=32, color=C_BASE)
        base_lbl.next_to(header, DOWN, buff=0.55, aligned_edge=LEFT)
        formula = MathTex(
            r"=", r"\left[\frac{1}{2}(", "4", "+", "7", ")", r"\times", "4", r"\right]",
            r"\text{ cm}^2",
        ).scale(1.05)
        formula.set_color_by_tex("4", C_TOP)
        formula[7].set_color(C_BOT)
        formula.set_color_by_tex("7", C_BOT)
        formula.next_to(base_lbl, RIGHT, buff=0.12)
        grp_f = VGroup(base_lbl, formula)
        self.play(Write(base_lbl), FadeIn(formula, shift=0.08 * UP))
        self.wait(0.2)
        self.next_slide()

        result = MathTex(r"=", "22", r"\text{ cm}^2").scale(1.12)
        result.set_color_by_tex("22", C_BASE)
        result.next_to(grp_f, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(result, shift=0.08 * UP))
        self.play(Circumscribe(result[1], color=C_BASE, fade_out=True))
        self.wait(0.2)
        self.next_slide()

        vol_lbl = MathTex(r"\mathbf{Volume\ of\ Prism}", font_size=32, color=C_VOL)
        vol_lbl.move_to(base_lbl)
        eq_part = MathTex(r"=", "22", r"\times", "10", r"\text{ cm}^3").scale(1.05)
        eq_part.set_color_by_tex("22", C_BASE)
        eq_part.set_color_by_tex("10", C_LEN)
        eq_part.next_to(vol_lbl, RIGHT, buff=0.12)
        self.play(
            Transform(base_lbl, vol_lbl),
            TransformMatchingTex(VGroup(formula, result), eq_part, transform_mismatches=True),
            run_time=1.3,
        )
        vol_line = VGroup(base_lbl, eq_part)
        self.wait(0.25)
        self.next_slide()

        final = MathTex(r"=", "220", r"\text{ cm}^3").scale(1.15)
        final.set_color_by_tex("220", C_VOL)
        final.next_to(vol_line, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(final, shift=0.1 * UP))
        box = SurroundingRectangle(final, color=C_VOL, buff=0.12, corner_radius=0.08, stroke_width=3)
        self.play(Create(box))
        self.wait(0.3)
        self.next_slide()


C_TSA_Q = ManimColor("#F48FB1")
C_CIRC = ManimColor("#FFD54F")
C_R = ManimColor("#66BB6A")
C_H = ManimColor("#64B5F6")
C_VOL = ManimColor("#F06292")


def _hdr_qa4() -> VGroup:
    q = MathTex(
        r"\text{4. The total surface area of a right cylinder and the}",
        r"\text{circumference of its base are }",
        r"1312\pi\ \text{mm}^2",
        r"\text{ and }",
        r"32\pi\ \text{mm}",
        r"\text{ respectively. Find its}",
        font_size=24,
        color=INK,
    )
    q[2].set_color(C_TSA_Q)
    q[4].set_color(C_CIRC)
    tail = MathTex(
        r"\text{(a) }",
        r"\text{height}",
        r"\text{, (b) }",
        r"\text{volume}",
        r"\text{. (Give the answers in terms of }\pi\text{ if necessary.)}",
        font_size=24,
        color=INK,
    )
    tail[1].set_color(C_H)
    tail[3].set_color(C_VOL)
    q.to_corner(UL, buff=0.35)
    tail.next_to(q, DOWN, buff=0.06, aligned_edge=LEFT)
    return VGroup(q, tail)


class Qa4Solution(Slide):
    """Right cylinder — TSA + circumference given; find height and volume."""

    def construct(self):
        self.camera.background_color = BG

        self.wait(0.45)
        self.next_slide()

        question = _hdr_qa4()
        self.play(FadeIn(question))
        self.wait(0.25)
        self.next_slide()

        let_r = MathTex(
            r"\textit{Let }", r"r", r"\textit{ mm be the base radius of the cylinder.}",
            font_size=28, color=INK,
        )
        let_r[1].set_color(C_R)
        let_r.next_to(question, DOWN, buff=0.45, aligned_edge=LEFT)
        self.play(FadeIn(let_r))
        self.wait(0.2)
        self.next_slide()

        circ = MathTex(
            r"\therefore\ \textit{Circumference of its base}=",
            r"32\pi\ \text{mm.}",
            font_size=28, color=INK,
        )
        circ[1].set_color(C_CIRC)
        circ.next_to(let_r, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(circ))
        self.wait(0.2)
        self.next_slide()

        eq_r = MathTex(r"\therefore\ ", "2\pi r", r"=", "32\pi", font_size=30, color=INK)
        eq_r[1].set_color(C_R)
        eq_r[3].set_color(C_CIRC)
        eq_r.next_to(circ, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(eq_r))
        self.wait(0.2)
        self.next_slide()

        res_r = MathTex(
            r"r", r"=", r"\dfrac{32\pi}{2\pi}", r"=", "16",
            r"\text{.}\ \therefore\ \text{The base radius is }", "16", r"\text{ mm.}",
            font_size=28, color=INK,
        )
        res_r[0].set_color(C_R)
        res_r[4].set_color(C_R)
        res_r[6].set_color(C_R)
        res_r.next_to(eq_r, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(res_r))
        self.play(Circumscribe(VGroup(res_r[4], res_r[6]), color=C_R, fade_out=True))
        self.wait(0.2)
        self.next_slide()

        let_h = MathTex(
            r"\textit{Let }", r"h", r"\textit{ mm be the height of the cylinder.}",
            font_size=28, color=INK,
        )
        let_h[1].set_color(C_H)
        let_h.next_to(res_r, DOWN, buff=0.45, aligned_edge=LEFT)
        self.play(FadeIn(let_h))
        self.wait(0.2)
        self.next_slide()

        tsa_lbl = MathTex(
            r"\therefore\ ",
            r"\textit{Total surface area}=\ ",
            r"1312\pi\ \text{mm}^2",
            font_size=28, color=INK,
        )
        tsa_lbl[1].set_color(C_TSA_Q)
        tsa_lbl[2].set_color(C_TSA_Q)
        tsa_lbl.next_to(let_h, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(tsa_lbl))
        self.wait(0.2)
        self.next_slide()

        tsa_eq = MathTex(
            r"\therefore\ 2\pi(", "16", r")", "h", r"+2\pi(", "16", r")^2=",
            "1312\pi",
            font_size=26, color=INK,
        )
        tsa_eq.set_color_by_tex("16", C_R)
        tsa_eq.set_color_by_tex("h", C_H)
        tsa_eq[-1].set_color(C_TSA_Q)
        tsa_eq.next_to(tsa_lbl, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(tsa_eq))
        self.wait(0.2)
        self.next_slide()

        simp = MathTex(
            r"\therefore\ 32\pi", "h", r"+512\pi=", "1312\pi",
            font_size=28, color=INK,
        )
        simp.set_color_by_tex("h", C_H)
        simp[-1].set_color(C_TSA_Q)
        simp.next_to(tsa_eq, DOWN, buff=0.38, aligned_edge=LEFT)
        simp2 = MathTex(r"\therefore\ 32\pi", "h", r"=800\pi", font_size=28, color=INK)
        simp2.set_color_by_tex("h", C_H)
        simp2.next_to(simp, DOWN, buff=0.28, aligned_edge=LEFT)
        self.play(FadeIn(simp), FadeIn(simp2))
        self.wait(0.2)
        self.next_slide()

        res_h = MathTex(
            r"\therefore\ ", "h", r"=", "25",
            r"\text{.}\ \therefore\ \text{The height is }", "25", r"\text{ mm.}",
            font_size=28, color=INK,
        )
        res_h.set_color_by_tex("h", C_H)
        res_h.set_color_by_tex("25", C_H)
        res_h.next_to(simp2, DOWN, buff=0.38, aligned_edge=LEFT)
        self.play(FadeIn(res_h))
        self.play(Circumscribe(VGroup(res_h[3], res_h[5]), color=C_H, fade_out=True))
        self.wait(0.2)
        self.next_slide()

        vol_lbl = MathTex(
            r"\textit{Volume of the cylinder}",
            r"=\pi\times",
            "16^2", r"\times", "25", r"\text{ mm}^3",
            font_size=28, color=INK,
        )
        vol_lbl[0].set_color(C_VOL)
        vol_lbl.set_color_by_tex("16", C_R)
        vol_lbl.set_color_by_tex("25", C_H)
        vol_lbl.next_to(res_h, DOWN, buff=0.45, aligned_edge=LEFT)
        self.play(FadeIn(vol_lbl))
        self.wait(0.2)
        self.next_slide()

        vol_ans = MathTex(r"=", "6400\pi", r"\text{ mm}^3", font_size=32, color=INK)
        vol_ans[1].set_color(C_VOL)
        vol_ans.next_to(vol_lbl, DOWN, buff=0.32, aligned_edge=LEFT)
        self.play(FadeIn(vol_ans, shift=0.08 * UP))
        box = SurroundingRectangle(vol_ans, color=C_VOL, buff=0.12, corner_radius=0.08, stroke_width=3)
        self.play(Create(box))
        self.wait(0.3)
        self.next_slide()
