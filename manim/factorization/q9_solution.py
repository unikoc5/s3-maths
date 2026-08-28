"""Worked-solution walkthrough — Quiz Q9 (Pre S3 L01-02 More about Factorization).

Q9  (a) Factorize  x^2 - 2xy - 35y^2                        (2 marks)
    (b) Hence, factorize  x^2 - 2xy - 35y^2 - 7x + 49y       (3 marks)

The MAIN deck stays clean (centred equations only). The *cross method* mechanics
are shown in a separate HTML sub-animation panel in the worked-solutions tab.
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sol_helpers import BG, COL_A, COL_AB, COL_B, HL, INK, _EQ_GAP, _align_left, boxed, title_tex  # noqa: E402

TCM = {"x": COL_A, "y": COL_B}


def _part_row(tag: str, tex: str, scale: float = 0.95) -> VGroup:
    label = MathTex(r"\text{" + tag + r"}", color=INK).scale(scale)
    body = MathTex(tex, tex_to_color_map=TCM).scale(scale)
    body.next_to(label, RIGHT, buff=_EQ_GAP)
    return VGroup(label, body)


def _eq_row(tex: str, scale: float = 1.0) -> VGroup:
    eq = MathTex("=", color=INK).scale(scale)
    body = MathTex(tex, tex_to_color_map=TCM).scale(scale)
    body.next_to(eq, RIGHT, buff=_EQ_GAP)
    return VGroup(eq, body)


class Q9Solution(Slide):
    def construct(self):
        self.camera.background_color = BG

        title = title_tex("Q9: Factorize")
        qa = _part_row("(a)", r"x^2 - 2xy - 35y^2")
        qb = _part_row("(b)", r"x^2 - 2xy - 35y^2 - 7x + 49y")
        qa.next_to(title, DOWN, buff=0.8)
        qb.next_to(qa, DOWN, buff=0.5)

        self.play(Write(title))
        self.play(FadeIn(qa, shift=0.2 * UP))
        self.play(FadeIn(qb, shift=0.2 * UP))
        self.wait(0.2)
        self.next_slide()

        head_a = MathTex(r"\text{Part (a) — cross method}", color=COL_AB).scale(0.8).to_edge(UP, buff=0.5)
        expr_a = MathTex(r"x^2 - 2xy - 35y^2", tex_to_color_map=TCM).scale(1.25).move_to([0, 0.7, 0])
        hint = MathTex(r"\text{(see the cross-method panel below)}", color=INK).scale(0.55).set_opacity(0.7)
        hint.next_to(expr_a, DOWN, buff=0.5)

        self.play(FadeOut(title), FadeOut(qb), FadeOut(qa), FadeIn(head_a, shift=0.2 * DOWN), FadeIn(expr_a))
        self.play(FadeIn(hint))
        self.next_slide()

        res_a = _eq_row(r"(x-7y)(x+5y)", scale=1.25)
        res_a.next_to(expr_a, DOWN, buff=0.8)
        body_x = expr_a.get_left()[0]
        eq_x = body_x - _EQ_GAP - res_a[0].width
        _align_left(res_a[0], eq_x)
        _align_left(res_a[1], body_x)
        box_a = SurroundingRectangle(res_a, color=COL_AB, buff=0.2)
        self.play(FadeOut(hint), FadeIn(res_a))
        self.play(Create(box_a))
        self.wait(0.2)
        self.next_slide()

        head_b = MathTex(r"\text{Part (b) — use (a), then group}", color=HL).scale(0.8).to_edge(UP, buff=0.5)
        e1 = MathTex(r"x^2 - 2xy - 35y^2 - 7x + 49y", tex_to_color_map=TCM).scale(1.0).move_to([0, 1.6, 0])

        self.play(
            FadeOut(head_a), FadeOut(expr_a), FadeOut(res_a), FadeOut(box_a),
            FadeIn(head_b, shift=0.2 * DOWN), FadeIn(e1),
        )
        self.next_slide()

        e2 = _eq_row(r"(x-7y)(x+5y)-7x+49y", scale=1.0).move_to([0, 0.4, 0])
        _align_left(e2[0], eq_x)
        _align_left(e2[1], body_x)
        self.play(FadeIn(e2))
        self.next_slide()

        e3 = _eq_row(r"(x-7y)(x+5y)-7(x-7y)", scale=1.0).move_to([0, -0.8, 0])
        _align_left(e3[0], eq_x)
        _align_left(e3[1], body_x)
        self.play(FadeIn(e3))
        self.play(e3[1][0:6].animate.set_color(HL), e3[1][7:13].animate.set_color(HL))
        self.next_slide()

        e4 = _eq_row(r"(x-7y)\,[(x+5y)-7]", scale=1.0).move_to([0, -2.0, 0])
        _align_left(e4[0], eq_x)
        _align_left(e4[1], body_x)
        e4[1][0:6].set_color(HL)
        self.play(FadeIn(e4))
        self.next_slide()

        final = _eq_row(r"(x-7y)(x+5y-7)", scale=1.15).move_to([0, -3.1, 0])
        _align_left(final[0], eq_x)
        _align_left(final[1], body_x)
        final[1][0:6].set_color(HL)
        box = SurroundingRectangle(final, color=HL, buff=0.2)
        self.play(ReplacementTransform(e4.copy(), final))
        self.play(Create(box))
        self.wait(0.3)
        self.next_slide()
