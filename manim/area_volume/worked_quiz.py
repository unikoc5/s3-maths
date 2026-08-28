r"""Worked-solution decks — L07-09 Quiz (prefix Qz), extra batch.

One navigable slide per line; the labelled diagram lives in the HTML sub-panel.
"""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


class Qz3Solution(AVSolution):
    title = r"Qz3 \quad Sphere: Recasting (MCQ)"
    lines = [
        r"\text{27 spheres }r=3\ \text{melted into one}",
        r"R^3=27\cdot3^3=729\;\Rightarrow\; R=9\text{ cm}",
        r"A=4\pi R^2=4\pi(9)^2=324\pi\text{ cm}^2",
    ]
    box_indices = (2,)


class Qz5Solution(AVSolution):
    title = r"Qz5 \quad Conical Vessel: Capacity (MCQ)"
    lines = [
        r"324\text{ cm}^3\ \text{at }\tfrac35\ \text{of the depth}",
        r"\dfrac{324}{V}=\left(\tfrac35\right)^3=\tfrac{27}{125}",
        r"V=324\times\dfrac{125}{27}=1500\text{ cm}^3",
    ]
    box_indices = (2,)


class Qz7Solution(AVSolution):
    title = r"Qz7 \quad Square Pyramid: Surface Area"
    lines = [
        r"\text{Base side }10,\ \text{height }12",
        r"\text{slant height}=\sqrt{12^2+5^2}=13",
        r"\text{TSA}=10^2+4\cdot\tfrac12(10)(13)",
        r"=100+260=360\text{ cm}^2",
    ]
    box_indices = (3,)


class Qz8Solution(AVSolution):
    title = r"Qz8 \quad Conical Vessel: Ratios"
    lines = [
        r"(a)\ \dfrac{\text{CSA}_{\text{vessel}}}{\text{CSA}_{\text{water}}}=\dfrac{36}{25}\Rightarrow r_{\text{base}}:r_{\text{water}}=6:5",
        r"(b)\ \text{capacity}=600\left(\tfrac65\right)^3=1036.8\text{ cm}^3",
        r"600+300=900<1036.8\;\Rightarrow\;\text{no overflow}",
    ]
    box_indices = (2,)
