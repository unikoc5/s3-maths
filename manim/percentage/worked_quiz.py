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

class QzQ1Solution(_SolBase):
    title = 'Qz:1: Percentage change'
    lines = [
        '80(1-10\\%)(1+10\\%) = 80(0.99) = 79.2',
        '\\text{change} = 79.2 - 80 = -0.8\\,\\text{kg}',
    ]
    box_indices = (1,)
    scale = 1.0

class QzQ2Solution(_SolBase):
    title = 'Qz:2: Percentage change'
    lines = [
        '\\text{Overall change} = \\left[(1+30\\%)(1-15\\%)-1\\right]\\times100\\%',
        '= \\left[1.105-1\\right]\\times100\\%',
        '= +10.5\\%',
    ]
    box_indices = (2,)
    scale = 0.86

class QzQ3Solution(_SolBase):
    title = 'Qz:3: Simple interest'
    lines = [
        'A = 50000(1+6\\%\\times10)+40000(1+7\\%\\times10)',
        '= 80000 + 68000',
        '= \\$148000',
    ]
    box_indices = (2,)
    scale = 0.92

class QzQ4Solution(_SolBase):
    title = 'Qz:4: Compound interest'
    lines = [
        '6000 = P(1.12^7 - 1)',
        'P = \\tfrac{6000}{1.12^7-1} \\approx 4956',
        '\\approx \\$5000',
    ]
    box_indices = (2,)
    scale = 1.0

class QzQ5Solution(_SolBase):
    title = 'Qz:5: Salaries tax'
    lines = [
        '\\text{tax on first }150000 = 1000+3000+5000 = 9000',
        '\\text{remainder} = \\tfrac{15300-9000}{14\\%} = 45000',
        '\\text{NCI} = 195000,\\ \\text{income} = \\$335000',
    ]
    box_indices = (2,)
    scale = 0.92

class QzQ6aSolution(_SolBase):
    title = 'Qz:6(a): Reverse percentage'
    lines = [
        '\\text{20 yr} = 4\\text{ periods}',
        '150000 = V(1.25)^4 \\Rightarrow V = \\tfrac{150000}{1.25^4}',
        '= \\$61440',
    ]
    box_indices = (2,)
    scale = 0.92

class QzQ6bSolution(_SolBase):
    title = 'Qz:6(b): Reverse percentage'
    lines = [
        '\\text{increase} = 150000 - 61440',
        '= \\$88560',
    ]
    box_indices = (1,)
    scale = 1.0

class QzQ7Solution(_SolBase):
    title = 'Qz:7: Compound interest'
    lines = [
        'A = 5000\\left(1+\\tfrac{7.8\\%}{12}\\right)^{36}',
        '= \\$6313',
    ]
    box_indices = (1,)
    scale = 0.92

class QzQ8Solution(_SolBase):
    title = 'Qz:8: Compound interest'
    lines = [
        'X:\\ (1+\\tfrac{4\\%}{2})^{20} = 1.4859',
        'Y:\\ (1+\\tfrac{2\\%}{4})^{40} = 1.2208',
        '\\text{per \\$1, } X>Y \\Rightarrow \\text{X gives more}',
    ]
    box_indices = (2,)
    scale = 0.92
