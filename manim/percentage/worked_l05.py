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

class L05Q1Solution(_SolBase):
    title = 'B:1: Growth & decay'
    lines = [
        'Growth\\ \\text{factor} = 1+2\\% = 1.02',
        'V = P \\times (\\text{factor})^{n} = 200000\\times1.02^{2}',
        '= 208080',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q10aSolution(_SolBase):
    title = 'B:10(a): Growth & decay'
    lines = [
        'Growth\\ \\text{factor} = 1+8\\% = 1.08',
        'V = P \\times (\\text{factor})^{n} = 350000\\times1.08^{2}',
        '= 408240',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q10bSolution(_SolBase):
    title = 'B:10(b): Reverse percentage'
    lines = [
        'x\\times(1+8\\%)(1+8\\%)(1+8\\%) = 350000',
        '1.259712\\,x = 350000',
        'x = 277841.284357',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q11aSolution(_SolBase):
    title = 'B:11(a): Reverse percentage'
    lines = [
        'x\\times(1-10\\%)(1-10\\%)(1-10\\%) = 145800',
        '0.729\\,x = 145800',
        'x = 200000',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q11bSolution(_SolBase):
    title = 'B:11(b): Growth & decay'
    lines = [
        'Growth\\ \\text{factor} = 1+10\\% = 1.1',
        'V = P \\times (\\text{factor})^{n} = 145800\\times1.1^{3}',
        '= 194059.8',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q12aSolution(_SolBase):
    title = 'B:12(a): Reverse percentage'
    lines = [
        'x\\times(1+8\\%)(1+8\\%)(1+8\\%)(1+8\\%) = 22000',
        '1.360489\\,x = 22000',
        'x = 16170.656762',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q12bSolution(_SolBase):
    title = 'B:12(b): Reverse percentage'
    lines = [
        '\\text{increase} = 22000 - 16170.656762',
        '= 5829.343238',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q13aSolution(_SolBase):
    title = 'B:13(a): Reverse percentage'
    lines = [
        'x\\times(1-12\\%)(1-12\\%)(1-12\\%) = 3700',
        '0.681472\\,x = 3700',
        'x = 5429.423366',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q13bSolution(_SolBase):
    title = 'B:13(b): Reverse percentage'
    lines = [
        '\\text{decrease} = 5429.423366 - 3700',
        '= 1729.423366',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q14aSolution(_SolBase):
    title = 'B:14(a): Growth & decay'
    lines = [
        'V_1 = 4200000(1+8\\%)',
        '= 4536000',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q14bSolution(_SolBase):
    title = 'B:14(b): Growth & decay'
    lines = [
        'V_3 = 4200000(1+8\\%)(1+5\\%)^2',
        '= 4536000\\times1.1025',
        '= 5000940',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q15aSolution(_SolBase):
    title = 'B:15(a): Growth & decay'
    lines = [
        'V_4 = 28000(1+15\\%)(1-4\\%)^3',
        '= 28488.4992',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q15bSolution(_SolBase):
    title = 'B:15(b): Growth & decay'
    lines = [
        '\\text{change} = 28488.4992 - 28000',
        '= 488.4992',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q16aSolution(_SolBase):
    title = 'B:16(a): Reverse percentage'
    lines = [
        '5000000 = P(1-12\\%)^2(1+10\\%)^3',
        'P = \\frac{5000000}{0.7744\\times1.331}',
        '= 4850947.8364',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q16bSolution(_SolBase):
    title = 'B:16(b): Percentage change'
    lines = [
        '\\%\\text{ change} = \\left(\\tfrac{5000000}{4850947.8364}-1\\right)\\times100\\%',
        '= +3.07\\%',
    ]
    box_indices = (1,)
    scale = 0.78

class L05Q17Solution(_SolBase):
    title = 'B:17: Reverse percentage'
    lines = [
        'x + 0.9x + 0.81x = 40650',
        '2.71x = 40650',
        'x = 15000',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q18Solution(_SolBase):
    title = 'B:18: Simple interest'
    lines = [
        '\\text{rate} = \\tfrac{575}{500}-1 = 15\\%',
        '\\text{Aug units} = 500(1.15)^3 = 760.4375',
        '\\text{bill} = 760.4375\\times0.7 \\approx \\$532',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q19aSolution(_SolBase):
    title = 'B:19(a): Growth & decay'
    lines = [
        '108000(1+r) = 110000',
        '1+r = \\tfrac{110000}{108000}',
        'r = 1.85\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q19bSolution(_SolBase):
    title = 'B:19(b): Growth & decay'
    lines = [
        'P = 110000(1+r)^4',
        '= 118377',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q2Solution(_SolBase):
    title = 'B:2: Growth & decay'
    lines = [
        'Growth\\ \\text{factor} = 1+5.5\\% = 1.055',
        'V = P \\times (\\text{factor})^{n} = 80\\times1.055^{3}',
        '= 93.93931\\,\\text{kg}',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q20Solution(_SolBase):
    title = 'B:20: Growth & decay'
    lines = [
        '5120(1-r)^2 = 4500',
        '(1-r)^2 = 0.87890625',
        'r = 6.25\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q21Solution(_SolBase):
    title = 'B:21: Growth & decay'
    lines = [
        '12500(1+r)^2 = 18000',
        '(1+r)^2 = 1.44',
        'r = 20\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q22Solution(_SolBase):
    title = 'B:22: Growth & decay'
    lines = [
        '\\text{per piece: }1(1+r)^2 = \\tfrac{312.5}{50} = 6.25',
        '(1+r)^2 = 6.25,\\ 1+r = 2.5',
        'r = 150\\%',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q23Solution(_SolBase):
    title = 'B:23: Growth & decay'
    lines = [
        '\\text{3 quarters: }1000000(1-r)^3 = 988000',
        '(1-r)^3 = 0.988',
        'r = 0.402\\%',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q24aSolution(_SolBase):
    title = 'B:24(a): Growth & decay'
    lines = [
        'w = 115(1+2\\%)^4',
        '= 124\\,\\text{g}',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q24bSolution(_SolBase):
    title = 'B:24(b): Growth & decay'
    lines = [
        'w = 124(1+4\\%)^2',
        '= 135\\,\\text{g}',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q25aSolution(_SolBase):
    title = 'B:25(a): Growth & decay'
    lines = [
        'V = 64000(1-6\\%)^4',
        '= \\$49968',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q25bSolution(_SolBase):
    title = 'B:25(b): Growth & decay'
    lines = [
        'V = 64000(1-12\\%)^2 = \\$49562',
        '\\text{not equal; diff} = \\$49968 - \\$49562 = \\$406',
    ]
    box_indices = (1,)
    scale = 0.92

class L05Q26aSolution(_SolBase):
    title = 'B:26(a): Growth & decay'
    lines = [
        '1100(1-x\\%) = 770',
        '1-x\\% = 0.7',
        'x = 30',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q26bSolution(_SolBase):
    title = 'B:26(b): Growth & decay'
    lines = [
        '\\text{2 yr} = 3\\text{ periods: }V = 1100(0.7)^3 = 377.3',
        '\\text{dep} = 1100 - 377.3 = \\$722.7',
    ]
    box_indices = (1,)
    scale = 0.92

class L05Q27aSolution(_SolBase):
    title = 'B:27(a): Growth & decay'
    lines = [
        '\\text{Let 2021 profit of each} = X',
        'A_{2019} = \\tfrac{X}{1.03^2} = \\tfrac{X}{1.0609},\\ B_{2019} = \\tfrac{X}{1.04^2} = \\tfrac{X}{1.0816}',
        '\\text{Smaller divisor } \\Rightarrow \\text{ larger starting value: Company A}',
    ]
    box_indices = (2,)
    scale = 0.78

class L05Q27bSolution(_SolBase):
    title = 'B:27(b): Growth & decay'
    lines = [
        'A_{2019} - B_{2019} = \\tfrac{X}{1.0609} - \\tfrac{X}{1.0816} = 40000',
        'X\\left(\\tfrac{1}{1.0609}-\\tfrac{1}{1.0816}\\right) = 40000',
        "X = \\\\2217332\\ \\text{(each company's 2021 profit)}",
    ]
    box_indices = (2,)
    scale = 0.86

class L05Q3aSolution(_SolBase):
    title = 'B:3(a): Growth & decay'
    lines = [
        'Decay\\ \\text{factor} = 1-15\\% = 0.85',
        'V = P \\times (\\text{factor})^{n} = 180000\\times0.85^{3}',
        '= 110542.5',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q3bSolution(_SolBase):
    title = 'B:3(b): Growth & decay'
    lines = [
        '\\text{Dep} = 180000 - 180000(1-15\\%)^3',
        '= 180000 - 110542.5',
    ]
    box_indices = (1,)
    scale = 1.0

class L05Q4Solution(_SolBase):
    title = 'B:4: Growth & decay'
    lines = [
        '\\text{periods} = 12\\div2 = 6',
        'N = 10\\times(1+100\\%)^6 = 10\\times2^6',
        '= 640',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q5Solution(_SolBase):
    title = 'B:5: Growth & decay'
    lines = [
        'Decay\\ \\text{factor} = 1-30\\% = 0.7',
        'V = P \\times (\\text{factor})^{n} = 2580\\times0.7^{4}',
        '= 619.458',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q6aSolution(_SolBase):
    title = 'B:6(a): Growth & decay'
    lines = [
        '\\text{Growth factor} = 1 + \\frac{r}{100}',
        '= 1 + 20\\%',
        '= 1.2',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q6bSolution(_SolBase):
    title = 'B:6(b): Growth & decay'
    lines = [
        'Growth\\ \\text{factor} = 1+20\\% = 1.2',
        'V = P \\times (\\text{factor})^{n} = 3\\times1.2^{4}',
        '= 6.2208\\,\\text{m}',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q7aSolution(_SolBase):
    title = 'B:7(a): Growth & decay'
    lines = [
        '\\text{Decay factor} = 1 - \\frac{r}{100}',
        '= 1 - 20\\%',
        '= 0.8',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q7bSolution(_SolBase):
    title = 'B:7(b): Growth & decay'
    lines = [
        'Decay\\ \\text{factor} = 1-20\\% = 0.8',
        'V = P \\times (\\text{factor})^{n} = 12000\\times0.8^{4}',
        '= 4915.2',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q8Solution(_SolBase):
    title = 'B:8: Reverse percentage'
    lines = [
        'x\\times(1-25\\%)(1-25\\%) = 3940',
        '0.5625\\,x = 3940',
        'x = 7004.444444',
    ]
    box_indices = (2,)
    scale = 1.0

class L05Q9aSolution(_SolBase):
    title = 'B:9(a): Growth & decay'
    lines = [
        'Decay\\ \\text{factor} = 1-10\\% = 0.9',
        'V = P \\times (\\text{factor})^{n} = 120000\\times0.9^{2}',
        '= 97200',
    ]
    box_indices = (2,)
    scale = 0.92

class L05Q9bSolution(_SolBase):
    title = 'B:9(b): Reverse percentage'
    lines = [
        'x\\times(1-10\\%)(1-10\\%) = 120000',
        '0.81\\,x = 120000',
        'x = 148148.148148',
    ]
    box_indices = (2,)
    scale = 1.0
