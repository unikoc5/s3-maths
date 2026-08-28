r"""Worked-solution decks — L07 (Area & Volume, prefix A).

Each scene is a clean centred chain of equations (one navigable slide per line);
the labelled diagram lives in the dashboard's HTML sub-panel. Slide index in the
JS step list equals the line index here (title + problem share slide 0).

Render every scene in this file with render_av_worked.ps1.
"""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


class Qa3Solution(AVSolution):
    title = r"A3 \quad Triangular Prism: Volume \& Surface Area"
    lines = [
        r"\text{Right-angled cross-section: legs }6,8;\ \text{length }5",
        r"\text{hypotenuse}=\sqrt{6^2+8^2}=10",
        r"V=\left(\tfrac12\cdot6\cdot8\right)\times5=24\times5=120\text{ cm}^3",
        r"A=2\left(\tfrac12\cdot6\cdot8\right)+(6+8+10)\times5",
        r"=48+120=168\text{ cm}^2",
    ]
    box_indices = (2, 4)


class Qa4Solution(AVSolution):
    title = r"A4 \quad Cylinder from Surface Area \& Circumference"
    lines = [
        r"2\pi r=32\pi\;\Rightarrow\; r=16\text{ mm}",
        r"A=2\pi r^2+2\pi r h=1312\pi",
        r"2(16)^2+2(16)h=1312",
        r"512+32h=1312\;\Rightarrow\; h=25\text{ mm}",
        r"V=\pi r^2h=\pi(16)^2(25)=6400\pi\text{ mm}^3",
    ]
    box_indices = (3, 4)


class Qa6Solution(AVSolution):
    title = r"A6 \quad Cone: Volume"
    lines = [
        r"\text{Cone: }d=6\Rightarrow r=3,\ h=4\ (\text{slant }5)",
        r"V=\tfrac13\pi r^2h=\tfrac13\pi(3)^2(4)",
        r"=12\pi\text{ cm}^3",
    ]
    box_indices = (2,)


class Qa7Solution(AVSolution):
    title = r"A7 \quad Pyramid: Volume"
    lines = [
        r"\text{Square base side }16,\ \text{height }45",
        r"V=\tfrac13\times(16)^2\times45",
        r"=\tfrac13\times256\times45=3840\text{ cm}^3",
    ]
    box_indices = (2,)


class Qa8Solution(AVSolution):
    title = r"A8 \quad Conical Cups: Capacity Check"
    lines = [
        r"\text{Each cup: }d=9\Rightarrow r=4.5,\ h=14",
        r"V=\tfrac13\pi r^2h=\tfrac13\pi(4.5)^2(14)=94.5\pi",
        r"8V=756\pi\approx2375\text{ cm}^3",
        r"2375>2250\ \Rightarrow\ \text{yes, they can hold it}",
    ]
    box_indices = (3,)


class Qa9Solution(AVSolution):
    title = r"A9 \quad Triangular-Based Pyramid"
    lines = [
        r"\triangle PQR\ \text{right-angled at }Q:\ PQ=6,\ QR=10",
        r"VP=\sqrt{VQ^2-PQ^2}=\sqrt{7.5^2-6^2}",
        r"=\sqrt{20.25}=4.5\text{ m}",
        r"V=\tfrac13\left(\tfrac12\cdot6\cdot10\right)(4.5)=45\text{ m}^3",
    ]
    box_indices = (2, 3)


class Qa10Solution(AVSolution):
    title = r"A10 \quad Pyramid on a Rectangular Base"
    lines = [
        r"\text{Base }BC=12,\ CD=16;\ \text{slant edge }AD=26",
        r"ND=\tfrac12\sqrt{12^2+16^2}=\tfrac12(20)=10",
        r"AN=\sqrt{AD^2-ND^2}=\sqrt{26^2-10^2}=24",
        r"V=\tfrac13(12\times16)(24)=1536\text{ cm}^3",
    ]
    box_indices = (2, 3)


class Qa11Solution(AVSolution):
    title = r"A11 \quad Pyramid from its Volume"
    lines = [
        r"V=\tfrac13[\triangle QRS]\,PQ:\ 28=\tfrac13[\triangle QRS](7)",
        r"[\triangle QRS]=12\text{ cm}^2",
        r"\tfrac12\cdot QR\cdot6=12\;\Rightarrow\; QR=4\text{ cm}",
        r"PR=\sqrt{PQ^2+QR^2}=\sqrt{7^2+4^2}=\sqrt{65}\approx8.1\text{ cm}",
    ]
    box_indices = (1, 3)


class Qa12Solution(AVSolution):
    title = r"A12 \quad Hexagonal Pyramid: Volume"
    lines = [
        r"\text{Regular hexagon side }6:\ \text{area}=\tfrac{3\sqrt3}{2}(6)^2=54\sqrt3",
        r"V=\tfrac13\times54\sqrt3\times12",
        r"=216\sqrt3\approx374\text{ cm}^3",
    ]
    box_indices = (2,)


class Qa13Solution(AVSolution):
    title = r"A13 \quad Cone: Surface Area"
    lines = [
        r"\text{Cone: }r=4,\ \text{slant }l=8",
        r"\text{CSA}=\pi r l=\pi(4)(8)=32\pi\text{ cm}^2",
        r"\text{TSA}=\pi r^2+\pi r l=16\pi+32\pi=48\pi\text{ cm}^2",
    ]
    box_indices = (1, 2)


class Qa14Solution(AVSolution):
    title = r"A14 \quad Cone: Surface Area"
    lines = [
        r"\text{Cone: }r=20,\ \text{slant }l=33",
        r"\text{CSA}=\pi r l=\pi(20)(33)=660\pi\text{ m}^2",
        r"\text{TSA}=\pi r^2+\pi r l=400\pi+660\pi=1060\pi\text{ m}^2",
    ]
    box_indices = (1, 2)


class Qa15Solution(AVSolution):
    title = r"A15 \quad Cone: Surface Area"
    lines = [
        r"\text{Cone: }r=1.5,\ \text{slant }l=3.6",
        r"\text{CSA}=\pi r l=\pi(1.5)(3.6)=5.4\pi\text{ mm}^2",
        r"\text{TSA}=\pi r^2+\pi r l=2.25\pi+5.4\pi=7.65\pi\text{ mm}^2",
    ]
    box_indices = (1, 2)


class Qa17Solution(AVSolution):
    title = r"A17 \quad Open Square Pyramid (Tent)"
    lines = [
        r"\text{Base side }60,\ \text{slant edge }50",
        r"\text{slant height }m=\sqrt{50^2-30^2}=\sqrt{1600}=40",
        r"A=4\times\tfrac12(60)(40)",
        r"=4\times1200=4800\text{ cm}^2",
    ]
    box_indices = (3,)


class Qa18Solution(AVSolution):
    title = r"A18 \quad Cone from its Volume"
    lines = [
        r"\tfrac13\pi r^2(8)=96\pi\;\Rightarrow\; r^2=36",
        r"r=6\text{ cm}",
        r"l=\sqrt{r^2+h^2}=\sqrt{36+64}=10\text{ cm}",
        r"\text{TSA}=\pi r^2+\pi r l=36\pi+60\pi=96\pi\text{ cm}^2",
    ]
    box_indices = (1, 3)


class Qa20Solution(AVSolution):
    title = r"A20 \quad Cone Poured into a Cylinder"
    lines = [
        r"\text{Cone: }r=9,\ h=15\quad\text{Cylinder: }r=6",
        r"V=\tfrac13\pi(9)^2(15)=405\pi\text{ cm}^3",
        r"\pi(6)^2 h=405\pi\;\Rightarrow\; 36h=405",
        r"h=11.25\text{ cm}",
    ]
    box_indices = (3,)


class Qa21Solution(AVSolution):
    title = r"A21 \quad Cone Immersed in Water"
    lines = [
        r"\text{Water }\pi r^2(8);\ \text{cone }\tfrac13\pi r^2(9)=3\pi r^2",
        r"\text{Total}=\pi r^2(8)+3\pi r^2=11\pi r^2",
        r"\pi r^2 H=11\pi r^2\;\Rightarrow\; H=11\text{ cm}",
    ]
    box_indices = (2,)


class Qa22Solution(AVSolution):
    title = r"A22 \quad Pyramid vs Cone (Equal Volume)"
    lines = [
        r"\tfrac13a^2H_p=\tfrac13\pi a^2H_c",
        r"a^2H_p=\pi a^2H_c\;\Rightarrow\; H_p=\pi H_c",
        r"\pi>1\ \Rightarrow\ \text{the pyramid is taller}",
    ]
    box_indices = (2,)


class Qa23Solution(AVSolution):
    title = r"A23 \quad Cuboid Melted into Cones"
    lines = [
        r"\text{Cuboid }V=12.5\times4\times4=200\text{ cm}^3",
        r"\text{Cone }V=\tfrac13\pi(1.5)^2(2.4)=1.8\pi\approx5.655",
        r"n=\dfrac{200}{1.8\pi}\approx35.4",
        r"\Rightarrow\ 35\text{ cones}",
    ]
    box_indices = (3,)
