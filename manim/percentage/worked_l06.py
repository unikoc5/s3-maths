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

class L06Q1aSolution(_SolBase):
    title = 'C:1(a): Simple interest'
    lines = [
        'I = P\\times R\\times T',
        '= 2000\\times4\\%\\times3',
        '= 240',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q1bSolution(_SolBase):
    title = 'C:1(b): Simple interest'
    lines = [
        'I = P\\times R\\times T',
        '= 300\\times3.5\\%\\times1.5',
        '= 15.75',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q1cSolution(_SolBase):
    title = 'C:1(c): Simple interest'
    lines = [
        'I = P\\times R\\times T',
        '= 60000\\times2\\%\\times0.666667',
        '= 800',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q10aSolution(_SolBase):
    title = 'C:10(a): Simple interest'
    lines = [
        '600 = P\\times3\\%\\times\\tfrac14',
        'P = \\$80000',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q10bSolution(_SolBase):
    title = 'C:10(b): Simple interest'
    lines = [
        'I = 80000\\times6\\%\\times\\tfrac34',
        '= 3600',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q11Solution(_SolBase):
    title = 'C:11: Simple interest'
    lines = [
        '1500 = P\\times12\\%\\times\\tfrac{15}{12}',
        'P = \\$10000',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q12aSolution(_SolBase):
    title = 'C:12(a): Simple interest'
    lines = [
        'A = 15000(1+6\\%\\times1.5)',
        '= \\$16350',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q12bSolution(_SolBase):
    title = 'C:12(b): Simple interest'
    lines = [
        'A = 16350(1+3\\%\\times2)',
        '= \\$17331',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q12cSolution(_SolBase):
    title = 'C:12(c): Simple interest'
    lines = [
        '\\text{interest} = 17331 - 15000',
        '= \\$2331',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q13aSolution(_SolBase):
    title = 'C:13(a): Compound interest'
    lines = [
        'A = P\\left(1+\\frac{R}{m}\\right)^{mt}',
        '= 10000\\left(1+\\frac{10\\%}{1}\\right)^{3}',
        'A = 13310',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q13bSolution(_SolBase):
    title = 'C:13(b): Compound interest'
    lines = [
        '\\text{CI} = A - P = 13310 - 10000',
        '= \\$3310',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q14Solution(_SolBase):
    title = 'C:14: Compound interest'
    lines = [
        'A = P\\left(1+\\frac{R}{m}\\right)^{mt}',
        '= 30000\\left(1+\\frac{3\\%}{1}\\right)^{4}',
        'A = 33765.2643',
        '\\text{CI} = A - 30000 = \\$3765.26',
    ]
    box_indices = (3,)
    scale = 1.0

class L06Q15aSolution(_SolBase):
    title = 'C:15(a): Compound interest'
    lines = [
        'A = P\\left(1+\\frac{R}{m}\\right)^{mt}',
        '= 8000\\left(1+\\frac{12\\%}{2}\\right)^{6}',
        'A = 11348.15',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q15bSolution(_SolBase):
    title = 'C:15(b): Compound interest'
    lines = [
        'A = P\\left(1+\\frac{R}{m}\\right)^{mt}',
        '= 8000\\left(1+\\frac{12\\%}{4}\\right)^{12}',
        'A = 11406.09',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q15cSolution(_SolBase):
    title = 'C:15(c): Compound interest'
    lines = [
        'A = P\\left(1+\\frac{R}{m}\\right)^{mt}',
        '= 8000\\left(1+\\frac{12\\%}{12}\\right)^{36}',
        'A = 11446.15',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q16aSolution(_SolBase):
    title = 'C:16(a): Compound interest'
    lines = [
        '23880 = P(1+\\tfrac{6\\%}{2})^6',
        'P = \\tfrac{23880}{1.03^6}',
        '= \\$19999',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q16bSolution(_SolBase):
    title = 'C:16(b): Compound interest'
    lines = [
        '\\text{CI} = 23880 - 19999',
        '= \\$3881',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q17aSolution(_SolBase):
    title = 'C:17(a): Compound interest'
    lines = [
        '99144 = P(1.08)^2',
        'P = \\$85000',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q17bSolution(_SolBase):
    title = 'C:17(b): Compound interest'
    lines = [
        'A = 85000\\left(1+\\tfrac{8\\%}{12}\\right)^9',
        '\\text{CI} = A - P = \\$5238.14',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q18aSolution(_SolBase):
    title = 'C:18(a): Compound interest'
    lines = [
        'A = 30000(1.06)^3',
        '= \\$35730.48',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q18bSolution(_SolBase):
    title = 'C:18(b): Compound interest'
    lines = [
        'A = 30000(1+\\tfrac{6\\%}{4})^{12}',
        '= \\$35868.55',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q18cSolution(_SolBase):
    title = 'C:18(c): Compound interest'
    lines = [
        '\\text{diff} = 35868.55 - 35730.48',
        '= \\$138.07',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q19aSolution(_SolBase):
    title = 'C:19(a): Compound interest'
    lines = [
        'A = 50000\\left(1+\\tfrac{6\\%}{2}\\right)^{4}',
        '= \\$56275',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q19bSolution(_SolBase):
    title = 'C:19(b): Compound interest'
    lines = [
        'A = 50000\\left(1+\\tfrac{6\\%}{4}\\right)^{8}',
        '= \\$56325',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q19cSolution(_SolBase):
    title = 'C:19(c): Compound interest'
    lines = [
        'A = 50000\\left(1+\\tfrac{6\\%}{12}\\right)^{24}',
        '= \\$56358',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q19dSolution(_SolBase):
    title = 'C:19(d): Compound interest'
    lines = [
        'A = 50000\\left(1+\\tfrac{6\\%}{365}\\right)^{730}',
        '= \\$56374',
    ]
    box_indices = (1,)
    scale = 0.92

class L06Q2aSolution(_SolBase):
    title = 'C:2(a): Simple interest'
    lines = [
        'I = 2000\\times10\\%\\times1',
        '= 200',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q2bSolution(_SolBase):
    title = 'C:2(b): Simple interest'
    lines = [
        'I = 3500\\times7\\%\\times1',
        '= 245',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q2cSolution(_SolBase):
    title = 'C:2(c): Simple interest'
    lines = [
        '= 200 + 245',
        '= 445',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q20Solution(_SolBase):
    title = 'C:20: Compound interest'
    lines = [
        '\\Delta = 48000\\left[(1+\\tfrac{5\\%}{12})^{24}-(1+\\tfrac{4\\%}{12})^{24}\\right]',
        '= \\$1046.32',
    ]
    box_indices = (1,)
    scale = 0.78

class L06Q21aSolution(_SolBase):
    title = 'C:21(a): Compound interest'
    lines = [
        'A = 5000(1.05)^4',
        '= \\$6077.53',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q21bSolution(_SolBase):
    title = 'C:21(b): Compound interest'
    lines = [
        '\\text{B interest} = 6077.53\\times5\\%\\times1.5 = 455.81',
        '\\text{total} = (6077.53-5000) + 455.81',
        '= \\$1533.35',
    ]
    box_indices = (2,)
    scale = 0.92

class L06Q22Solution(_SolBase):
    title = 'C:22: Compound interest'
    lines = [
        '\\text{SI} = 3000\\times10\\%\\times5 = 1500',
        '\\text{CI} = 3000(1.1^5-1) = 1831.53',
        '\\text{diff} = \\$331.53',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q23Solution(_SolBase):
    title = 'C:23: Compound interest'
    lines = [
        '\\text{each yr: }\\times1.1\\text{ then }-5000',
        '20000\\to17000\\to13700\\to10070\\to6077',
        '\\text{owed} = \\$6077',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q24Solution(_SolBase):
    title = 'C:24: Compound interest'
    lines = [
        '\\text{each mo: }\\times1.01\\text{ then }-500',
        '5000\\to4550\\to4095.5',
        '\\text{owed} = \\$4095.5',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q25aSolution(_SolBase):
    title = 'C:25(a): Compound interest'
    lines = [
        '\\text{each mo: }\\times1.015\\text{ then }-10000',
        '35000\\to25525\\to15907.88',
        '\\approx \\$15908',
    ]
    box_indices = (2,)
    scale = 0.92

class L06Q25bSolution(_SolBase):
    title = 'C:25(b): Compound interest'
    lines = [
        '\\text{iterate }\\times1.015,\\,-10000\\text{ until balance}\\le0',
        '\\text{settles on the } 4\\text{th repayment}',
    ]
    box_indices = (1,)
    scale = 0.86

class L06Q26Solution(_SolBase):
    title = 'C:26: Salaries tax'
    lines = [
        '\\text{Tax} = \\sum(\\text{band}\\times\\text{rate})',
        '= 50000\\times2\\%+50000\\times6\\%+50000\\times10\\%+5000\\times14\\%',
        '= 9700',
    ]
    box_indices = (2,)
    scale = 0.86

class L06Q27aSolution(_SolBase):
    title = 'C:27(a): Salaries tax'
    lines = [
        '\\text{annual} = 10000\\times12 = 120000',
        '\\text{NCI} = 120000 - 108000 = 12000',
        '= 12000\\times2\\%',
        '= 240',
    ]
    box_indices = (3,)
    scale = 1.0

class L06Q27bSolution(_SolBase):
    title = 'C:27(b): Salaries tax'
    lines = [
        '\\text{annual} = 63000\\times12 = 756000',
        '\\text{NCI} = 756000 - 108000 = 648000',
        '= 50000\\times2\\%+50000\\times6\\%+50000\\times10\\%+50000\\times14\\%+448000\\times17\\%',
        '= 92160',
    ]
    box_indices = (3,)
    scale = 0.78

class L06Q28Solution(_SolBase):
    title = 'C:28: Salaries tax'
    lines = [
        '\\text{first band }2\\%:\\ \\text{NCI} = \\tfrac{240}{2\\%} = 12000',
        '\\text{income} = 12000 + 216000',
        '= \\$228000',
    ]
    box_indices = (2,)
    scale = 0.86

class L06Q3Solution(_SolBase):
    title = 'C:3: Simple interest'
    lines = [
        'I_5-I_2 = 24000\\times3\\%\\times(5-2)',
        '= 2160',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q4Solution(_SolBase):
    title = 'C:4: Simple interest'
    lines = [
        '\\Delta I = 50000\\times(9\\%-4\\%)\\times4',
        '= 10000',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q5Solution(_SolBase):
    title = 'C:5: Simple interest'
    lines = [
        'T = \\tfrac{I}{PR} = \\tfrac{960}{8000\\times2\\%}',
        '= 6\\text{ years}',
    ]
    box_indices = (1,)
    scale = 0.92

class L06Q6Solution(_SolBase):
    title = 'C:6: Simple interest'
    lines = [
        'I = 21200-20000 = 1200',
        'R = \\tfrac{I}{PT} = \\tfrac{1200}{20000\\times2}',
        '= 3\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L06Q7Solution(_SolBase):
    title = 'C:7: Simple interest'
    lines = [
        'I = 34880-32000 = 2880',
        'T = \\tfrac{2880}{32000\\times3\\%}',
        '= 3\\text{ years}',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q8Solution(_SolBase):
    title = 'C:8: Simple interest'
    lines = [
        'A = P(1+RT)',
        '19550 = P(1+5\\%\\times3) = 1.15P',
        'P = \\$17000',
    ]
    box_indices = (2,)
    scale = 1.0

class L06Q9aSolution(_SolBase):
    title = 'C:9(a): Simple interest'
    lines = [
        'I = 12000\\times3\\%\\times2.5 = 900',
        'A = 12000 + 900 = 12900',
    ]
    box_indices = (1,)
    scale = 1.0

class L06Q9bSolution(_SolBase):
    title = 'C:9(b): Simple interest'
    lines = [
        'T = \\tfrac{18}{12} = 1.5',
        'I = 12000\\times3\\%\\times1.5 = 540',
        'A = 12540',
    ]
    box_indices = (2,)
    scale = 1.0
