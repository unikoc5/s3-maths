"""Auto-generated worked-solution decks — do not edit by hand.

Regenerate:  python scripts/gen_pct_worked.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pct_sol_helpers import NEW, SolChainSlide, play_equation_chain  # noqa: F401


class _SolBase(SolChainSlide):
    note_color = NEW

class L04Q1aSolution(_SolBase):
    title = 'A:1(a): Percentage change'
    lines = [
        '\\text{New value} = \\text{Original}\\times(1+30\\%)\\times(1+40\\%)',
        '= 200(1+30\\%)(1+40\\%)',
        '= 364',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q1bSolution(_SolBase):
    title = 'A:1(b): Percentage change'
    lines = [
        '\\text{New value} = \\text{Original}\\times(1-50\\%)\\times(1-10\\%)',
        '= 8(1-50\\%)(1-10\\%)',
        '= 3.6\\,\\text{m}',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q1cSolution(_SolBase):
    title = 'A:1(c): Percentage change'
    lines = [
        '\\text{New value} = \\text{Original}\\times(1-25\\%)\\times(1+60\\%)',
        '= 1600(1-25\\%)(1+60\\%)',
        '= 1920',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q10Solution(_SolBase):
    title = 'A:10: Percentage change'
    lines = [
        '\\text{Overall change} = \\left[(1+22\\%)(1-30\\%)-1\\right]\\times100\\%',
        '= \\left[0.854-1\\right]\\times100\\%',
        '= -14.6\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q11Solution(_SolBase):
    title = 'A:11: Percentage change'
    lines = [
        '\\text{Overall change} = \\left[(1+20\\%)(1+10\\%)(1+35\\%)(1-45\\%)-1\\right]\\times100\\%',
        '= \\left[0.9801-1\\right]\\times100\\%',
        '= -1.99\\%',
    ]
    box_indices = (2,)
    scale = 0.78

class L04Q12Solution(_SolBase):
    title = 'A:12: Percentage change'
    lines = [
        '(1-90\\%)(1+x\\%) - 1 = -83\\%',
        '0.1(1+x\\%) = 0.17',
        'x = 70',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q13Solution(_SolBase):
    title = 'A:13: Percentage change'
    lines = [
        'V = l\\,w\\,h \\Rightarrow \\text{factor}_h = \\frac{\\text{factor}_V}{\\text{factor}_l\\,\\text{factor}_w}',
        '= \\frac{0.9}{1.2\\times1.15} = 0.652174',
        '\\%\\text{ change} = (0.652174-1)\\times100\\% = -34.782609\\%',
    ]
    box_indices = (2,)
    scale = 0.78

class L04Q14Solution(_SolBase):
    title = 'A:14: Percentage change'
    lines = [
        'V = l\\,w\\,h \\Rightarrow \\text{factor}_h = \\frac{\\text{factor}_V}{\\text{factor}_l\\,\\text{factor}_w}',
        '= \\frac{1.06}{0.85\\times1.16} = 1.075051',
        '\\%\\text{ change} = (1.075051-1)\\times100\\% = +7.505071\\%',
    ]
    box_indices = (2,)
    scale = 0.78

class L04Q15aSolution(_SolBase):
    title = 'A:15(a): Percentage change'
    lines = [
        '\\text{Original radius} = r',
        'A = \\pi r^2',
    ]
    box_indices = (1,)
    scale = 1.0

class L04Q15bSolution(_SolBase):
    title = 'A:15(b): Percentage change'
    lines = [
        "r' = r(1-20\\%) = 0.8r",
        "A' = \\pi (r')^2 = \\pi(0.8r)^2",
        '= 0.64\\pi r^2',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q15cSolution(_SolBase):
    title = 'A:15(c): Percentage change'
    lines = [
        "\\text{area factor} = \\left(\\frac{r'}{r}\\right)^2 = (0.8)^2 = 0.64",
        '\\%\\text{ change} = (0.64 - 1)\\times100\\%',
        '= -36\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q16aSolution(_SolBase):
    title = 'A:16(a): Percentage change'
    lines = [
        '\\text{new side} = l(1+20\\%)(1+20\\%) = 1.44l',
        '\\text{new area} = (1.44l)^2 = 2.0736l^2',
    ]
    box_indices = (1,)
    scale = 1.0

class L04Q16bSolution(_SolBase):
    title = 'A:16(b): Percentage change'
    lines = [
        '\\text{side factor} = (1.2)(1.2) = 1.44',
        '\\text{area factor} = (1.44)^2 = 2.0736',
        '\\%\\text{ change} = (2.0736-1)\\times100\\% = +107.36\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q17Solution(_SolBase):
    title = 'A:17: Percentage change'
    lines = [
        '\\text{Overall change} = \\left[(1+10\\%)(1-10\\%)-1\\right]\\times100\\%',
        '= \\left[0.99-1\\right]\\times100\\%',
        '= -1\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q18aSolution(_SolBase):
    title = 'A:18(a): Percentage change'
    lines = [
        "l' = l(1+10\\%) = 1.1l,\\quad w' = w(1-30\\%) = 0.7w",
        "A' = l'w' = (1.1l)(0.7w) = 0.77lw",
    ]
    box_indices = (1,)
    scale = 0.92

class L04Q18bSolution(_SolBase):
    title = 'A:18(b): Percentage change'
    lines = [
        '\\text{area factor} = (1+10\\%)(1-30\\%) = 0.77',
        '\\%\\text{ change} = (0.77-1)\\times100\\%',
        '= -23\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q19Solution(_SolBase):
    title = 'A:19: Percentage change'
    lines = [
        '\\text{arc} = r\\theta \\Rightarrow (1-20\\%)(1+k\\%) = 1',
        '0.8(1+k\\%) = 1',
        'k = 25',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q2Solution(_SolBase):
    title = 'A:2: Percentage change'
    lines = [
        '\\text{New value} = \\text{Original}\\times(1-18\\%)\\times(1+2\\%)',
        '= 2200(1-18\\%)(1+2\\%)',
        '= 1840.08\\,\\text{mm}',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q20aSolution(_SolBase):
    title = 'A:20(a): Percentage change'
    lines = [
        '\\text{remaining} = 1-37.5\\% = 62.5\\%',
        '\\text{study} = 62.5\\%\\times10\\% = 6.25\\%',
        '\\text{other} = 62.5\\%-6.25\\% = 56.25\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q20biSolution(_SolBase):
    title = 'A:20(b)(i): Percentage change'
    lines = [
        '\\text{freed} = 37.5\\%\\times5\\% + 56.25\\%\\times5\\% = 4.6875\\%',
        '\\text{new study} = 6.25\\% + 4.6875\\% = 10.9375\\%',
        '\\%\\text{ change} = \\tfrac{10.9375-6.25}{6.25}\\times100\\% = +75\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q20biiSolution(_SolBase):
    title = 'A:20(b)(ii): Percentage change'
    lines = [
        '\\text{material} = \\text{time}\\times\\text{speed}',
        '\\text{factor} = 1.75\\times1.04 = 1.82',
        '\\%\\text{ increase} = +82\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q21Solution(_SolBase):
    title = 'A:21: Percentage change'
    lines = [
        '\\text{old} = 10000 + 40000 + 200000 = 250000',
        "\\text{Ad}' = 10000(1+10\\%) = 11000,\\ \\text{Rent}' = 40000(1-20\\%) = 32000",
        "\\text{Wage}' = 200000(1+5\\%) = 210000,\\ \\text{new} = 253000",
        '\\%\\text{ change} = \\tfrac{253000-250000}{250000}\\times100\\% = 1.2\\%',
    ]
    box_indices = (3,)
    scale = 0.78

class L04Q22Solution(_SolBase):
    title = 'A:22: Percentage change'
    lines = [
        '\\text{old total} = 150 + 240 + 320 = 710',
        "P' = 150(1-2\\%) = 147,\\ Q' = 240(1+5\\%) = 252,\\ R' = 320",
        '\\text{new total} = 147 + 252 + 320 = 719',
        '\\%\\text{ change} = \\tfrac{719-710}{710}\\times100\\% = 1.268\\%',
    ]
    box_indices = (3,)
    scale = 0.86

class L04Q23Solution(_SolBase):
    title = 'A:23: Percentage change'
    lines = [
        '\\text{old} = 1+3 = 4',
        '\\text{new} = 1.16 + 3(0.88) = 3.8',
        '\\%\\text{ change} = \\tfrac{3.8-4}{4}\\times100\\% = -5\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q24Solution(_SolBase):
    title = 'A:24: Percentage change'
    lines = [
        '\\text{new total} = 5000\\times1.04 = 5200',
        "A' = 5200 - 1260 - 1920 = 2020",
        '\\%\\text{ change} = \\tfrac{2020-2500}{2500}\\times100\\% = -19.2\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class L04Q25Solution(_SolBase):
    title = 'A:25: Percentage change'
    lines = [
        '\\text{old} = 10',
        '\\text{new} = 1.2 + 5.75 + 2.85 = 9.8',
        '\\%\\text{ change} = \\tfrac{9.8-10}{10}\\times100\\% = -2\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q26Solution(_SolBase):
    title = 'A:26: Percentage change'
    lines = [
        '\\text{CSA}=2\\pi rh\\text{ const}\\Rightarrow r\\text{ factor}=\\tfrac{1}{1.6}=0.625',
        'V=\\pi r^2h\\Rightarrow\\text{factor}=0.625^2\\times1.6 = 0.625',
        '\\%\\text{ change} = (0.625-1)\\times100\\% = -37.5\\%',
    ]
    box_indices = (2,)
    scale = 0.78

class L04Q3aSolution(_SolBase):
    title = 'A:3(a): Percentage change'
    lines = [
        '\\text{Fiction} = 200\\times60\\%\\times(1+10\\%)',
        '= 120\\times1.1',
        '= 132',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q3bSolution(_SolBase):
    title = 'A:3(b): Percentage change'
    lines = [
        '\\text{Non-fiction} = 200\\times40\\%\\times(1+20\\%)',
        '= 80\\times1.2',
        '= 96',
    ]
    box_indices = (2,)
    scale = 0.92

class L04Q3cSolution(_SolBase):
    title = 'A:3(c): Percentage change'
    lines = [
        '\\text{Increase} = (132+96)-200',
        '= 228-200',
        '= 28',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q4Solution(_SolBase):
    title = 'A:4: Reverse percentage'
    lines = [
        'x\\times(1-15\\%)(1-18\\%) = 697',
        '0.697\\,x = 697',
        'x = 1000',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q5Solution(_SolBase):
    title = 'A:5: Reverse percentage'
    lines = [
        'x\\times(1+15\\%)(1-30\\%) = 241.5',
        '0.805\\,x = 241.5',
        'x = 300',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q6Solution(_SolBase):
    title = 'A:6: Reverse percentage'
    lines = [
        'x\\times(1+25\\%)(1-10\\%) = 99',
        '1.125\\,x = 99',
        'x = 88',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q7Solution(_SolBase):
    title = 'A:7: Reverse percentage'
    lines = [
        'x\\times(1+12\\%)(1+25\\%) = 17500',
        '1.4\\,x = 17500',
        'x = 12500',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q8aSolution(_SolBase):
    title = 'A:8(a): Reverse percentage'
    lines = [
        'x\\times(1+6\\%)(1+7\\%) = 90736',
        '1.1342\\,x = 90736',
        'x = 80000',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q8bSolution(_SolBase):
    title = 'A:8(b): Reverse percentage'
    lines = [
        'x\\times(1+30\\%)(1-20\\%) = 208',
        '1.04\\,x = 208',
        'x = 200\\,\\text{g}',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q8cSolution(_SolBase):
    title = 'A:8(c): Reverse percentage'
    lines = [
        'x\\times(1-40\\%)(1+60\\%) = 76.8',
        '0.96\\,x = 76.8',
        'x = 80\\,\\text{cm}^{3}',
    ]
    box_indices = (2,)
    scale = 1.0

class L04Q9Solution(_SolBase):
    title = 'A:9: Percentage change'
    lines = [
        '\\text{Overall change} = \\left[(1-15\\%)(1-8\\%)-1\\right]\\times100\\%',
        '= \\left[0.782-1\\right]\\times100\\%',
        '= -21.8\\%',
    ]
    box_indices = (2,)
    scale = 0.86
