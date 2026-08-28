r"""Worked-solution decks (Area & Volume) — starter batch.

Each scene is a clean centred chain of equations (one navigable slide per line);
the labelled diagram lives in the dashboard's HTML sub-panel. Slide index in the
JS step list equals the line index here (title + problem share slide 0).

Scenes:
    Qa1Solution   cylinder: volume + total surface area
    Qa19Solution  cone: slant height + total surface area
    Qz2Solution   cone vs cylinder of equal volume -> cylinder height
    Qz4Solution   sphere: volume from surface area
    Qz6Solution   cylinder + hemisphere composite: volume
    Qc6Solution   similar cones: area ratio + volume ratio
    Qc11Solution  frustum: apex distance + volume
    Qb21Solution  water displacement: original water level
"""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


class Qa1Solution(AVSolution):
    title = r"A1 \quad Cylinder: Volume \& Surface Area"
    lines = [
        r"\text{Cylinder: } d=10\text{ m},\; h=9\text{ m}",
        r"r=\tfrac{d}{2}=5\text{ m}",
        r"V=\pi r^2 h=\pi(5)^2(9)",
        r"=225\pi\text{ m}^3",
        r"A=2\pi r^2+2\pi r h=2\pi(5)^2+2\pi(5)(9)",
        r"=50\pi+90\pi=140\pi\text{ m}^2",
    ]
    box_indices = (3, 5)


class Qa19Solution(AVSolution):
    title = r"A19 \quad Cone: Slant Height \& Surface Area"
    lines = [
        r"\text{Cone: } r=11\text{ cm},\; h=60\text{ cm}",
        r"l=\sqrt{r^2+h^2}=\sqrt{11^2+60^2}",
        r"=\sqrt{3721}=61\text{ cm}",
        r"A=\pi r^2+\pi r l=\pi(11)^2+\pi(11)(61)",
        r"=121\pi+671\pi=792\pi\text{ cm}^2",
    ]
    box_indices = (2, 4)


class Qz2Solution(AVSolution):
    title = r"Qz2 \quad Cone \& Cylinder of Equal Volume"
    lines = [
        r"\text{Cone } r=3,\,h=4\quad\text{Cylinder } r=2",
        r"V_{\text{cone}}=\tfrac13\pi r^2 h=\tfrac13\pi(3)^2(4)=12\pi\text{ cm}^3",
        r"V_{\text{cyl}}=\pi(2)^2 h=4\pi h",
        r"4\pi h=12\pi",
        r"h=3\text{ cm}",
    ]
    box_indices = (4,)
    note = r"Cylinder height $=3$ cm \;(option B)"


class Qz4Solution(AVSolution):
    title = r"Qz4 \quad Sphere: Volume from Surface Area"
    lines = [
        r"\text{Sphere: surface area }=64\pi\text{ cm}^2",
        r"4\pi r^2=64\pi\;\Rightarrow\; r^2=16",
        r"r=4\text{ cm}",
        r"V=\tfrac43\pi r^3=\tfrac43\pi(4)^3",
        r"=\dfrac{256}{3}\pi\text{ cm}^3",
    ]
    box_indices = (4,)
    note = r"$V=\tfrac{256}{3}\pi$ cm$^3$ \;(option D)"


class Qz6Solution(AVSolution):
    title = r"Qz6 \quad Cylinder + Hemisphere: Volume"
    lines = [
        r"\text{Base } r=4\text{ mm},\; \text{cylinder } h=10\text{ mm}",
        r"V=\pi r^2 h+\tfrac23\pi r^3",
        r"=\pi(4)^2(10)+\tfrac23\pi(4)^3",
        r"=160\pi+\tfrac{128}{3}\pi=\tfrac{608}{3}\pi",
        r"\approx 637\text{ mm}^3",
    ]
    box_indices = (4,)


class Qc6Solution(AVSolution):
    title = r"C6 \quad Similar Cones: Area \& Volume Ratios"
    lines = [
        r"\text{Similar cones, heights }12\text{ cm and }9\text{ cm}",
        r"k=\dfrac{12}{9}=\dfrac{4}{3}",
        r"\dfrac{A_{\text{large}}}{A_{\text{small}}}=k^2=\dfrac{16}{9}",
        r"\dfrac{V_{\text{large}}}{V_{\text{small}}}=k^3=\dfrac{64}{27}",
    ]
    box_indices = (2, 3)


class Qc11Solution(AVSolution):
    title = r"C11 \quad Frustum: Apex Distance \& Volume"
    lines = [
        r"\text{Frustum: radii }14\text{ and }10.5\text{ cm},\; h=48\text{ cm}",
        r"\text{Similar cones: }\dfrac{10.5}{x}=\dfrac{14}{x+48}",
        r"x=144\;\Rightarrow\; AP=144\text{ cm}",
        r"V=\tfrac13\pi(14)^2(192)-\tfrac13\pi(10.5)^2(144)",
        r"=\tfrac13\pi(37632-15876)",
        r"=7252\pi\text{ cm}^3",
    ]
    box_indices = (2, 5)


class Qb21Solution(AVSolution):
    title = r"B21 \quad Water Displacement: Original Level"
    lines = [
        r"\text{Cup } r=6\text{ cm};\; 3\text{ stones } r=3\text{ cm};\; \text{rises to }14\text{ cm}",
        r"V_{\text{stones}}=3\times\tfrac43\pi(3)^3=108\pi\text{ cm}^3",
        r"\text{rise}=\dfrac{108\pi}{\pi(6)^2}=3\text{ cm}",
        r"\text{original level}=14-3=11\text{ cm}",
    ]
    box_indices = (3,)
