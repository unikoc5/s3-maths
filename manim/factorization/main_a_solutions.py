"""Worked-solution decks — More about Factorization (2025), block A
(perfect squares, difference of squares, and their applications).

Clean centred equation chains on the MAIN panel; mechanics go to the HTML
sub-animation panel of the Worked-Solutions tab.
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sol_helpers import BG, COL_A, COL_AB, COL_B, HL_O, SolChainSlide, boxed, title_tex  # noqa: E402


class _SolBase(SolChainSlide):
    pass


class Qa1Solution(_SolBase):
    title = "Q1: Factorize"
    cm = {"a": COL_A}
    lines = [r"a^2+4a+4", r"=a^2+2(a)(2)+2^2", r"=(a+2)^2"]
    box_indices = (2,)
    scale = 1.2
    buff = 0.6


class Qa4Solution(_SolBase):
    title = "Q4: Factorize"
    cm = {"b": COL_B}
    lines = [r"9b^2-6b+1", r"=(3b)^2-2(3b)(1)+1^2", r"=(3b-1)^2"]
    box_indices = (2,)
    scale = 1.2
    buff = 0.6


class Qa10Solution(_SolBase):
    title = "Q10: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [r"32x^2-50y^2", r"=2(16x^2-25y^2)", r"=2[(4x)^2-(5y)^2]", r"=2(4x+5y)(4x-5y)"]
    box_indices = (3,)
    scale = 1.05


class Qa12Solution(_SolBase):
    title = "Q12: Factorize"
    cm = {"x": COL_A}
    tex_colors = {
        2: {r"(x+2)^2": HL_O},
        4: {r"(5x^2+20x+20)": HL_O},
        5: {r"(x+2)^2": HL_O},
        6: {r"(x+2)^2": HL_O},
    }
    lines = [
        r"(a)\;5x^2+20x+20",
        r"=5(x^2+4x+4)",
        r"=5(x+2)^2",
        r"(b)\;5x^2+20x-25",
        r"=(5x^2+20x+20)-45",
        r"=5(x+2)^2-45",
        r"=5[(x+2)^2-3^2]",
        r"=5(x+5)(x-1)",
    ]
    box_indices = (2, 7)
    scale = 0.85
    buff = 0.38


class Qa13Solution(_SolBase):
    title = "Q13: Factorize"
    cm = {"x": COL_A}
    lines = [r"x^2+4x+3", r"=(x+1)(x+3)"]
    box_indices = (1,)
    scale = 1.2
    buff = 0.7


class Qa19Solution(_SolBase):
    title = "Q19: Factorize"
    cm = {"p": COL_A, "q": COL_B}
    lines = [r"p^2+8pq+15q^2", r"=(p+3q)(p+5q)"]
    box_indices = (1,)
    scale = 1.15
    buff = 0.7


class Qa22Solution(_SolBase):
    title = "Q22: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [r"x^2+17xy+30y^2", r"=(x+2y)(x+15y)"]
    box_indices = (1,)
    scale = 1.15
    buff = 0.7


class Qa23Solution(_SolBase):
    title = "Q23: Factorize"
    cm = {"x": COL_A}
    lines = [r"x^2-14x+13", r"=(x-1)(x-13)"]
    box_indices = (1,)
    scale = 1.2
    buff = 0.7


class Qa30Solution(_SolBase):
    title = "Q30: Factorize"
    cm = {"a": COL_A, "b": COL_B}
    lines = [r"a^2-18ab+56b^2", r"=(a-4b)(a-14b)"]
    box_indices = (1,)
    scale = 1.15
    buff = 0.7


class Qa40Solution(_SolBase):
    title = "Q40: Factorize"
    cm = {"m": COL_A, "k": COL_B}
    lines = [r"m^2n-10mnk+21k^2n", r"=n(m^2-10mk+21k^2)", r"=n(m-3k)(m-7k)"]
    box_indices = (2,)
    scale = 1.0


class Qa46Solution(_SolBase):
    title = "Q46: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    lines = [r"x^4-16x^2y^2+63y^4", r"=(x^2-7y^2)(x^2-9y^2)", r"=(x^2-7y^2)(x+3y)(x-3y)"]
    box_indices = (2,)
    scale = 0.95


class Qa61Solution(_SolBase):
    title = "Q61: Factorize"
    cm = {"s": COL_A, "t": COL_B}
    lines = [r"-6st+s^2-91t^2", r"=s^2-6st-91t^2", r"=(s+7t)(s-13t)"]
    box_indices = (2,)
    scale = 1.05


class Qa66Solution(_SolBase):
    title = "Q66: Factorize"
    cm = {"a": COL_A, "b": COL_B}
    lines = [r"3a^2-15ab-42b^2", r"=3(a^2-5ab-14b^2)", r"=3(a+2b)(a-7b)"]
    box_indices = (2,)
    scale = 1.0


class Qa69Solution(_SolBase):
    title = "Q69: Factorize"
    cm = {r"\theta": COL_A, r"\phi": COL_B}
    lines = [
        r"-42\theta^2-119\theta\phi+98\phi^2",
        r"=-7(6\theta^2+17\theta\phi-14\phi^2)",
        r"=-7(2\theta+7\phi)(3\theta-2\phi)",
    ]
    box_indices = (2,)
    scale = 0.92


class Qa70Solution(_SolBase):
    title = "Q70: Factorize"
    cm = {r"\alpha": COL_A, r"\beta": COL_B, r"\gamma": COL_AB}
    lines = [
        r"24\alpha^4\gamma^2+90\beta^4\gamma^2-94\alpha^2\beta^2\gamma^2",
        r"=2\gamma^2(12\alpha^4-47\alpha^2\beta^2+45\beta^4)",
        r"=2\gamma^2(4\alpha^2-9\beta^2)(3\alpha^2-5\beta^2)",
        r"=2\gamma^2(2\alpha+3\beta)(2\alpha-3\beta)(3\alpha^2-5\beta^2)",
    ]
    box_indices = (3,)
    scale = 0.72
    buff = 0.42
