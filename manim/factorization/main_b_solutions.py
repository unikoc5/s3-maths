"""Worked-solution decks — More about Factorization (2025), block B
(cross method & applications: hence-factorize, substitution, grouping).

Clean centred equation chains on the MAIN panel; method mechanics go to the
HTML sub-animation panel of the Worked-Solutions tab.
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sol_helpers import BG, COL_A, COL_AB, COL_B, HL_B, HL_G, HL_O, HL_Y, SolChainSlide  # noqa: E402


class _SolBase(SolChainSlide):
    pass


class Qb6Solution(_SolBase):
    title = "Q6: Factorize"
    cm = {"s": COL_A}
    lines = [r"-6s+s^2-91", r"=s^2-6s-91", r"=(s+7)(s-13)"]
    box_indices = (2,)
    scale = 1.1
    buff = 0.6


class Qb10Solution(_SolBase):
    title = "Q10: Factorize"
    cm = {"n": COL_A}
    lines = [r"-17n-n^2-72", r"=-(n^2+17n+72)", r"=-(n+8)(n+9)"]
    box_indices = (2,)
    scale = 1.1
    buff = 0.6


class Qb22Solution(_SolBase):
    title = "Q22: Factorize"
    cm = {"a": COL_A, "c": COL_B, "b": COL_AB}
    tex_colors = {3: {r"(a-2c)": HL_O}, 4: {r"(a-2c)": HL_O}}
    lines = [
        r"(a)\;3a^2-7ac+2c^2",
        r"=(a-2c)(3a-c)",
        r"(b)\;3a^2-7ac+2c^2-ab+2bc",
        r"=(a-2c)(3a-c)-b(a-2c)",
        r"=(a-2c)(3a-c-b)",
    ]
    box_indices = (1, 4)
    scale = 0.85
    buff = 0.4


class Qb36Solution(_SolBase):
    title = "Q36: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    tex_colors = {4: {r"(x+4y)": HL_O}, 5: {r"(x+4y)": HL_O}, 6: {r"(x+4y)": HL_O}}
    lines = [
        r"(a)\;x^2y-4xy^2-32y^3",
        r"=y(x^2-4xy-32y^2)",
        r"=y(x+4y)(x-8y)",
        r"(b)\;x^2y+2x^2+16xy-4xy^2+32y^2-32y^3",
        r"=y(x+4y)(x-8y)+2(x+4y)^2",
        r"=(x+4y)[\,y(x-8y)+2(x+4y)\,]",
        r"=(x+4y)(xy-8y^2+2x+8y)",
    ]
    box_indices = (2, 6)
    scale = 0.78
    buff = 0.36


class Qb45Solution(_SolBase):
    title = "Q45: Factorize"
    cm = {"x": COL_A}
    tex_colors = {1: {r"(x+3)": HL_O}, 2: {r"(x+3)": HL_O}, 3: {r"(x+3)": HL_O}, 4: {r"(x+3)": HL_O}}
    lines = [
        r"(x+3)^3-25x-75",
        r"=(x+3)^3-25(x+3)",
        r"=(x+3)[(x+3)^2-25]",
        r"=(x+3)[(x+3)^2-5^2]",
        r"=(x+3)(x+8)(x-2)",
    ]
    box_indices = (4,)
    scale = 0.92
    buff = 0.42


class Qb47Solution(_SolBase):
    title = "Q47: Factorize"
    cm = {"x": COL_A, "y": COL_B}
    tex_colors = {5: {r"(x-3y)": HL_O}, 6: {r"(x-3y)": HL_O}}
    lines = [
        r"(a)\;3x-9y",
        r"=3(x-3y)",
        r"(b)\;x^2+2xy-15y^2",
        r"=(x-3y)(x+5y)",
        r"(c)\;x^2+2xy-15y^2-3x+9y",
        r"=(x-3y)(x+5y)-3(x-3y)",
        r"=(x-3y)(x+5y-3)",
    ]
    box_indices = (1, 3, 6)
    scale = 0.82
    buff = 0.42


class Qb52Solution(_SolBase):
    title = "Q52: Factorize"
    cm = {"x": COL_A}
    tex_colors = {6: {r"(7x-2)": HL_O}, 7: {r"(7x-2)": HL_O}, 8: {r"(7x-2)": HL_O}}
    lines = [
        r"(a)\;14x^2-25x+6",
        r"=(2x-3)(7x-2)",
        r"(b)\;49x^2-4",
        r"=(7x+2)(7x-2)",
        r"(c)\;(42x^3-75x^2+18x)-(98x^2-8)",
        r"=3x(14x^2-25x+6)-2(49x^2-4)",
        r"=3x(2x-3)(7x-2)-2(7x+2)(7x-2)",
        r"=(7x-2)[3x(2x-3)-2(7x+2)]",
        r"=(7x-2)(6x^2-23x-4)",
        r"=(7x-2)(x-4)(6x+1)",
    ]
    box_indices = (1, 3, 9)
    scale = 0.68
    buff = 0.28


class Qb53Solution(_SolBase):
    title = "Q53: Factorize"
    line_colors = {0: HL_B}
    lines = [
        r"(a)\;2x^2-x-10",
        r"=(x+2)(2x-5)",
        r"(b)(i)\;2(y+2)^2-(y+2)-10,\ \ \text{let }x=y+2",
        r"=(x+2)(2x-5)",
        r"=(y+4)(2y-1)",
        r"(b)(ii)\;2(2z-5)^2-2z-5,\ \ \text{let }x=2z-5",
        r"=(x+2)(2x-5)",
        r"=(2z-3)(4z-15)",
    ]
    box_indices = (1, 4, 7)
    scale = 0.78
    buff = 0.45


class Qb56Solution(_SolBase):
    title = "Q56: Factorize"
    cm = {"x": COL_A, "y": COL_B, "xy": COL_AB}
    tex_colors = {
        3: {r"5x^2-17xy+6y^2": HL_B},
        4: {r"(x-3y)": HL_O, r"(5x-2y)": HL_O},
    }
    lines = [
        r"(a)\;5x^2-17xy+6y^2",
        r"=(x-3y)(5x-2y)",
        r"(b)\;45(p-q)^2-51(p^2-q^2)+6(p+q)^2",
        r"=5x^2-17xy+6y^2",
        r"=(x-3y)(5x-2y)",
        r"x-3y=-6q,\quad 5x-2y=13p-17q",
        r"=-6q(13p-17q)",
    ]
    box_indices = (1, 6)
    scale = 0.76
    buff = 0.4


class Qb59Solution(_SolBase):
    title = "Q59: Factorize"
    cm = {"a": COL_A, "b": COL_B}
    tex_colors = {
        4: {r"(5b-1)": HL_O},
        5: {r"(5b-1)": HL_O},
        6: {r"(5b-1)": HL_O},
        7: {r"(5b-1)": HL_O},
    }
    lines = [
        r"(a)\;5a^2-31a+6",
        r"=(a-6)(5a-1)",
        r"(b)\;5b^3-31b^2+51b-9",
        r"=b(5b^2-31b+6)+45b-9",
        r"=b(b-6)(5b-1)+9(5b-1)",
        r"=(5b-1)[\,b(b-6)+9\,]",
        r"=(5b-1)(b^2-6b+9)",
        r"=(5b-1)(b-3)^2",
    ]
    box_indices = (1, 7)
    scale = 0.74
    buff = 0.34


class Qb62Solution(_SolBase):
    title = "Q62: Factorize & simplify"
    cm = {"x": COL_A, "y": COL_B, "xy": COL_AB}
    line_colors = {0: HL_Y, 3: HL_B}
    tex_colors = {
        5: {r"15x^2-xy-28y^2": HL_B, r"9x^2-16y^2": HL_Y},
        7: {r"(3x+4y)": HL_O, r"(5x-7y)": HL_G},
    }
    lines = [
        r"(a)(i)\;9x^2-16y^2",
        r"=(3x)^2-(4y)^2",
        r"=(3x+4y)(3x-4y)",
        r"(a)(ii)\;15x^2-xy-28y^2",
        r"=(3x+4y)(5x-7y)",
        r"(b)\;\frac{15x^2-xy-28y^2}{45x-63y}\div\frac{9x^2-16y^2}{15x-6y}",
        r"=\frac{(3x+4y)(5x-7y)}{9(5x-7y)}\times\frac{3(5x-2y)}{(3x+4y)(3x-4y)}",
        r"=\frac{(3x+4y)(5x-7y)}{9(5x-7y)}\times\frac{3(5x-2y)}{(3x+4y)(3x-4y)}",
        r"=\frac{5x-2y}{3(3x-4y)}",
    ]
    box_indices = (2, 4, 8)
    scale = 0.54
    buff = 0.26
    title_buff = 0.48
