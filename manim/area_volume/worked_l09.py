r"""Worked-solution decks — L09 (Area & Volume, prefix C): scales, similar
figures/solids, and frustums.

One navigable slide per line; the labelled diagram lives in the HTML sub-panel.
"""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


class Qc1Solution(AVSolution):
    title = r"C1 \quad Scale: Length"
    lines = [
        r"\text{Scale }1:4,\ \text{drawing length }5\text{ cm}",
        r"\text{actual}=5\times4=20\text{ cm}",
    ]
    box_indices = (1,)


class Qc2Solution(AVSolution):
    title = r"C2 \quad Scale: Length"
    lines = [
        r"\text{Scale }1\text{ cm}:9\text{ m},\ \text{actual }126\text{ m}",
        r"\text{drawing}=\dfrac{126}{9}=14\text{ cm}",
    ]
    box_indices = (1,)


class Qc3Solution(AVSolution):
    title = r"C3 \quad Scale: Area"
    lines = [
        r"\text{Scale }1:400,\ \text{plan }4.5\times3.5\text{ cm}",
        r"\text{actual}=18\text{ m}\times14\text{ m}",
        r"\text{area}=18\times14=252\text{ m}^2",
    ]
    box_indices = (2,)


class Qc4Solution(AVSolution):
    title = r"C4 \quad Similar Plane Figures"
    lines = [
        r"\text{Area scales as length}^2",
        r"(a)\ P=324\left(\tfrac{28}{36}\right)^2=196\text{ m}^2",
        r"(b)\ x=32\sqrt{\tfrac{9}{16}}=24\text{ cm}",
        r"(c)\ T=2.7\left(\tfrac{3}{5}\right)^2=0.972\text{ cm}^2",
    ]
    box_indices = (1, 2, 3)


class Qc5Solution(AVSolution):
    title = r"C5 \quad Similar Solids"
    lines = [
        r"\text{Area}\propto L^2,\quad \text{volume}\propto L^3",
        r"(a)\ x=200\left(\tfrac34\right)^2=112.5\text{ cm}^2",
        r"(b)\ v=24000\left(\tfrac{9}{15}\right)^3=5184\text{ m}^3",
        r"(c)\ h=3\sqrt{\tfrac{36}{81}}=2\text{ cm}",
        r"(d)\ x=\sqrt[3]{\tfrac{125}{64}}=1.25\text{ mm}",
    ]
    box_indices = (1, 2, 3, 4)


class Qc7Solution(AVSolution):
    title = r"C7 \quad Conical Vessel (Part Full)"
    lines = [
        r"\text{Full capacity }480\text{ cm}^3,\ \text{filled to half depth}",
        r"\dfrac{V_{\text{water}}}{480}=\left(\tfrac12\right)^3=\tfrac18",
        r"V_{\text{water}}=60\text{ cm}^3",
    ]
    box_indices = (2,)


class Qc9Solution(AVSolution):
    title = r"C9 \quad Frustum: Curved Surface Area"
    lines = [
        r"\text{Radii }R=15,\ r=10;\ \text{slant }l=40",
        r"\text{CSA}=\pi(R+r)l=\pi(25)(40)",
        r"=1000\pi\text{ cm}^2",
    ]
    box_indices = (2,)


class Qc13Solution(AVSolution):
    title = r"C13 \quad Conical Cup: Water Poured Out"
    lines = [
        r"\text{Cone }d=6\Rightarrow r=3,\ h=12;\ \text{full }V=36\pi",
        r"\text{depth drops }6\Rightarrow\text{remaining cone }r=1.5,\ h=6",
        r"V_{\text{left}}=\tfrac13\pi(1.5)^2(6)=4.5\pi",
        r"V_{\text{out}}=36\pi-4.5\pi=31.5\pi\text{ cm}^3",
    ]
    box_indices = (3,)


class Qc14Solution(AVSolution):
    title = r"C14 \quad Inverted Square Pyramidal Vessel"
    lines = [
        r"\text{Base }9,\ \text{water depth }8,\ \text{capacity }324",
        r"\tfrac13(9)^2H=324\Rightarrow H=12\text{ cm}",
        r"V_{\text{water}}=324\left(\tfrac{8}{12}\right)^3=96\text{ cm}^3",
        r"\text{extra}=324-96=228\text{ cm}^3",
    ]
    box_indices = (1, 3)


class Qc15Solution(AVSolution):
    title = r"C15 \quad Frustum + Similar Cone"
    lines = [
        r"\text{Cone P height }6+24=30;\ Y\sim P,\ \tfrac{24}{30}=\tfrac45",
        r"\dfrac{V_Y}{V_P}=\left(\tfrac45\right)^3=\tfrac{64}{125}\Rightarrow V_X:V_Y=61:64",
        r"\dfrac{\text{CSA}_P}{\text{CSA}_Y}=\left(\tfrac54\right)^2\Rightarrow\text{CSA}_P=625",
        r"\text{CSA}_X=625-400=225\text{ cm}^2",
    ]
    box_indices = (1, 3)


class Qc16Solution(AVSolution):
    title = r"C16 \quad Frustum from a Pyramid"
    lines = [
        r"\dfrac{[\triangle VPS]}{[PSTU]}=\dfrac45\Rightarrow\dfrac{\text{top}}{\text{whole}}=\dfrac49",
        r"\text{linear ratio }\tfrac23\Rightarrow V_{\text{top}}=1080\left(\tfrac23\right)^3=320",
        r"V_{\text{frustum}}=1080-320=760\text{ cm}^3",
    ]
    box_indices = (2,)
