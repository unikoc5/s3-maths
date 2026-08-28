r"""Remaining worked-solution decks — stubs batch (11 questions)."""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


# ── L07 ready + figure-trust ──

class Qa2Solution(AVSolution):
    title = r"A2 \quad Trapezoidal Prism: Volume \& TSA"
    lines = [
        r"\text{Trapezoid base: }4,\ 7,\ 4,\ 5;\ \text{length }10",
        r"\text{base}=\tfrac12(4+7)\times4=22\text{ cm}^2",
        r"V=22\times10=220\text{ cm}^3",
        r"\text{lateral}=(7+4+4+5)\times10=200",
        r"\text{TSA}=44+200=244\text{ cm}^2",
    ]
    box_indices = (2, 4)


class Qa5Solution(AVSolution):
    title = r"A5 \quad Cone: Volume"
    lines = [
        r"\text{Cone (figure): }r=5\text{ mm},\; h=12\text{ mm}",
        r"V=\tfrac13\pi r^2h=\tfrac13\pi(5)^2(12)",
        r"=\tfrac{100\pi}{1}\text{ mm}^3=100\pi\text{ mm}^3",
    ]
    box_indices = (2,)


class Qa16Solution(AVSolution):
    title = r"A16 \quad Pyramid from Net: Side \& TSA"
    lines = [
        r"\text{Square pyramid: }VN=30,\; VQ=34",
        r"VQ^2=VN^2+\left(\tfrac{s\sqrt2}{2}\right)^2\Rightarrow s=16\sqrt2",
        r"\text{Face slant }VM=\sqrt{VN^2+(s/2)^2}=\sqrt{1028}",
        r"A=s^2+4\left(\tfrac12 s\cdot VM\right)\approx1963\text{ cm}^2",
    ]
    box_indices = (1, 3)


class Qa24Solution(AVSolution):
    title = r"A24 \quad Conical Cup to Sector"
    lines = [
        r"\text{Cup (figure): }r=4.5,\ h=20,\ l=20.5\text{ cm}",
        r"\text{(a) Capacity}=\tfrac13\pi r^2h=424\text{ cm}^3\ (3\text{ s.f.})",
        r"\text{(b)(i) Sector area}=\pi rl=290\text{ cm}^2\ (3\text{ s.f.})",
        r"\text{(b)(ii) Angle}=79.0\text{ deg}\ (3\text{ s.f.})",
    ]
    box_indices = (1, 3)


class Qa25Solution(AVSolution):
    title = r"A25 \quad Sector to Cone"
    lines = [
        r"\text{Sector (figure): }R=12\text{ cm},\ \theta=120\text{ deg}",
        r"\text{Arc}=2\pi r=R\theta\pi/180\Rightarrow r=4\text{ cm}",
        r"\text{(a) Base radius}=4\text{ cm}",
        r"h=\sqrt{l^2-r^2}=\sqrt{128}=8\sqrt2",
        r"\text{(b) Capacity}=\tfrac13\pi r^2h\approx190\text{ cm}^3\ (3\text{ s.f.})",
    ]
    box_indices = (2, 4)


class Qb5Solution(AVSolution):
    title = r"B5 \quad Sphere: Volume"
    lines = [
        r"\text{Sphere (figure): }r=4\text{ cm}",
        r"V=\tfrac43\pi r^3=\tfrac43\pi(4)^3",
        r"=\dfrac{256}{3}\pi\text{ cm}^3",
    ]
    box_indices = (2,)


class Qc8Solution(AVSolution):
    title = r"C8 \quad Frustum: Volume"
    lines = [
        r"\text{Frustum: }R=45,\ r=20,\ h=8\text{ m}",
        r"V=\tfrac13\pi h(R^2+Rr+r^2)",
        r"=\tfrac13\pi(8)(2025+900+400)",
        r"=\dfrac{26600}{3}\pi\text{ m}^3",
    ]
    box_indices = (3,)


class Qc17Solution(AVSolution):
    title = r"C17 \quad Frustum Cup + Water"
    lines = [
        r"\text{Circumferences }20\text{ cm and }12\text{ cm}",
        r"\text{(a) CSA ratio }\sqrt{36/25}\Rightarrow R:r=6:5",
        r"\text{Water circumference}=15\text{ cm}",
        r"\text{(b) Capacity ratio}\approx3.81,\ (16/9)^3\approx5.62",
        r"\text{Claim disagreed — no overflow at }900\text{ cm}^3",
    ]
    box_indices = (4,)


class Qz1Solution(AVSolution):
    title = r"Qz1 \quad Pyramid Volume (MCQ)"
    lines = [
        r"\text{Triangular base: }\tfrac12(5)(12)=30\text{ cm}^2",
        r"V=\tfrac13(\text{base})(h)=160",
        r"h=\dfrac{160\times3}{30}=16\text{ cm}",
        r"V=160\text{ cm}^3\ \text{(option C)}",
    ]
    box_indices = (3,)


# ── Tool-primary: brief Manim intro (full steps in interactive tool) ──

class Qc10Solution(AVSolution):
    title = r"C10 \quad Square Frustum"
    lines = [
        r"\text{Square frustum: top }15,\ \text{bottom }30,\ h=17",
        r"\text{Use the Square Frustum Explorer for TSA \& volume}",
        r"\text{See the interactive tool tab for the full step-by-step}",
    ]
    box_indices = ()


class Qc12Solution(AVSolution):
    title = r"C12 \quad Rectangular Frustum"
    lines = [
        r"\text{Rectangular frustum: }8\times10\to16\times20,\ h=9",
        r"\text{Use the Rectangular Frustum Explorer}",
        r"\text{Find pyramid height }h,\ \text{then frustum volume}",
    ]
    box_indices = ()
