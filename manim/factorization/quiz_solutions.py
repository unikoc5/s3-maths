"""Worked-solution decks for the Factorization Quiz (ANS) — Qz1 .. Qz11.

The MAIN panel stays clean (a centred chain of equations); the cross method /
perfect square / difference-of-squares / common-factor / grouping mechanics are
shown step-by-step in the HTML sub-animation panel of the Worked-Solutions tab.

Each ``self.next_slide()`` is one navigable slide; the JS step list maps a step to
a MAIN slide index (= line index here) plus a sub-panel focus animation.
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sol_helpers import BG, COL_A, COL_AB, COL_B, HL, INK, HL_O, SolChainSlide, boxed, title_tex  # noqa: E402


class _SolBase(SolChainSlide):
    pass


class Qz1Solution(Slide):
    """Factorize x^2 - 6x - 7   (cross method).  Answer (x-7)(x+1) = option B."""

    def construct(self):
        self.camera.background_color = BG
        cm = {"x": COL_A}
        title = title_tex("Qz1: Factorize")
        q = MathTex(r"x^2-6x-7", tex_to_color_map=cm).scale(1.3).next_to(title, DOWN, buff=0.9)
        self.play(Write(title))
        self.play(FadeIn(q, shift=0.2 * UP))
        self.wait(0.2)
        self.next_slide()

        head = MathTex(r"\text{Use the cross method}", color=COL_AB).scale(0.78).to_edge(UP, buff=0.5)
        expr = MathTex(r"x^2-6x-7", tex_to_color_map=cm).scale(1.3).move_to([0, 0.7, 0])
        hint = MathTex(r"\text{work it in the cross-method panel below}", color=INK).scale(0.52).set_opacity(0.7)
        hint.next_to(expr, DOWN, buff=0.5)
        self.play(FadeOut(title), ReplacementTransform(q, expr), FadeIn(head, shift=0.2 * DOWN))
        self.play(FadeIn(hint))
        self.next_slide()

        res = MathTex(r"=(x-7)(x+1)", tex_to_color_map=cm).scale(1.3).next_to(expr, DOWN, buff=0.8)
        self.play(FadeOut(hint), Write(res))
        self.play(Create(boxed(res)))
        self.next_slide()

        opt = MathTex(r"\checkmark\;\text{Option B}", color=COL_AB).scale(0.95).next_to(res, DOWN, buff=0.8)
        self.play(FadeIn(opt, shift=0.2 * UP))
        self.wait(0.2)
        self.next_slide()


class Qz2Solution(_SolBase):
    title = "Qz2: Factorize"
    cm = {"p": COL_A, "q": COL_B}
    lines = [
        r"49p^2+9q^2-42pq",
        r"=49p^2-42pq+9q^2",
        r"=(7p)^2-2(7p)(3q)+(3q)^2",
        r"=(7p-3q)^2",
    ]
    box_indices = (3,)
    note = r"\checkmark\;\text{Option C}"
    scale = 1.0


class Qz3Solution(_SolBase):
    title = "Qz3: Find the one with no factor (x+2)"
    cm = {}
    lines = [
        r"\text{I:}\ x^2+4 \qquad \text{II:}\ x^2-4 \qquad \text{III:}\ (x-3)^2-25",
        r"\text{II:}\quad x^2-4",
        r"=(x+2)(x-2)\ \checkmark",
        r"\text{III:}\quad (x-3)^2-25",
        r"=(x-3)^2-5^2",
        r"=(x+2)(x-8)\ \checkmark",
        r"\text{I:}\quad x^2+4\ \text{is a sum of squares: no factor}",
    ]
    note = r"\text{Only I has no factor }(x+2):\ \text{Option A}"
    scale = 0.82
    buff = 0.55


class Qz4Solution(_SolBase):
    title = "Qz4: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [
        r"x^2-8xy+15y^2-5x+15y",
        r"=(x-3y)(x-5y)-5x+15y",
        r"=-5(x-3y)+(x-3y)(x-5y)",
        r"=(x-3y)(x-5y-5)",
    ]
    box_indices = (3,)
    note = r"\checkmark\;\text{Option A}"
    scale = 0.95
    buff = 0.5


class Qz5Solution(_SolBase):
    title = "Qz5: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [
        r"x^2(x+y)-y^2(y+x)",
        r"=(x+y)\,(x^2-y^2)",
        r"=(x+y)(x+y)(x-y)",
        r"=(x+y)^2(x-y)",
    ]
    box_indices = (3,)
    note = r"\checkmark\;\text{Option A}"
    scale = 1.0


class Qz6Solution(_SolBase):
    title = "Qz6: Factorize"
    cm = {"y": COL_A}
    lines = [
        r"y^2+4y-12",
        r"=(y+6)(y-2)",
    ]
    box_indices = (1,)
    note = r"\checkmark\;\text{Option C}"
    scale = 1.2
    buff = 0.7


class Qz7Solution(_SolBase):
    title = "Qz7: Factorize"
    cm = {"n": COL_A}
    lines = [
        r"n^2+12n+35",
        r"=(n+5)(n+7)",
    ]
    box_indices = (1,)
    note = r"\checkmark\;\text{Option A}"
    scale = 1.2
    buff = 0.7


class Qz8Solution(_SolBase):
    title = "Qz8: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [
        r"(a)\;x^2+8x+7",
        r"=(x+1)(x+7)",
        r"(b)\;y^2-11y-26",
        r"=(y+2)(y-13)",
    ]
    box_indices = (1, 3)
    scale = 1.0
    buff = 0.5


class Qz10Solution(_SolBase):
    title = "Qz10: Factorize"
    cm = {"u": COL_A, "v": COL_B, "x": COL_AB, "y": COL_A, "z": COL_B}
    lines = [
        r"(a)\;\; -72u^2+240uv-200v^2",
        r"=-8(9u^2-30uv+25v^2)",
        r"=-8[(3u)^2-2(3u)(5v)+(5v)^2]",
        r"=-8(3u-5v)^2",
        r"(b)\;\; 63xy^2+84xyz+28xz^2",
        r"=7x(9y^2+12yz+4z^2)",
        r"=7x[(3y)^2+2(3y)(2z)+(2z)^2]",
        r"=7x(3y+2z)^2",
    ]
    box_indices = (3, 7)
    scale = 0.82
    buff = 0.4


class Qz11Solution(_SolBase):
    title = "Qz11: Factorize"
    cm = {"a": COL_A, "b": COL_B}
    tex_colors = {2: {r"(a+b)^2": HL_O}, 3: {r"(a+b)^2": HL_O}, 4: {r"(a+b)^2": HL_O}}
    lines = [
        r"a^4-a^2-2a^2b^2-2ab+b^4-b^2",
        r"=(a^4-2a^2b^2+b^4)-(a^2+2ab+b^2)",
        r"=(a^2-b^2)^2-(a+b)^2",
        r"=[(a-b)(a+b)]^2-(a+b)^2",
        r"=(a+b)^2\,[(a-b)^2-1]",
        r"=(a+b)^2(a-b-1)(a-b+1)",
    ]
    box_indices = (5,)
    scale = 0.8
    buff = 0.4
