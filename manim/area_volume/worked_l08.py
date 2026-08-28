r"""Worked-solution decks — L08 (Area & Volume, prefix B): spheres, hemispheres,
composite solids and water displacement.

One navigable slide per line; the labelled diagram lives in the HTML sub-panel.
"""
from __future__ import annotations

import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_solutions import AVSolution  # noqa: E402


class Qb1Solution(AVSolution):
    title = r"B1 \quad Sphere: Volume \& Surface Area"
    lines = [
        r"\text{Sphere: }r=6\text{ cm}",
        r"V=\tfrac43\pi r^3=\tfrac43\pi(6)^3=288\pi\text{ cm}^3",
        r"A=4\pi r^2=4\pi(6)^2=144\pi\text{ cm}^2",
    ]
    box_indices = (1, 2)


class Qb2Solution(AVSolution):
    title = r"B2 \quad Sphere: Volume \& Surface Area"
    lines = [
        r"\text{Sphere: }r=18\text{ mm}",
        r"V=\tfrac43\pi(18)^3=7776\pi\text{ mm}^3",
        r"A=4\pi(18)^2=1296\pi\text{ mm}^2",
    ]
    box_indices = (1, 2)


class Qb3Solution(AVSolution):
    title = r"B3 \quad Sphere: Volume \& Surface Area"
    lines = [
        r"\text{Sphere: }r=3\text{ m}",
        r"V=\tfrac43\pi(3)^3=36\pi\text{ m}^3",
        r"A=4\pi(3)^2=36\pi\text{ m}^2",
    ]
    box_indices = (1, 2)


class Qb4Solution(AVSolution):
    title = r"B4 \quad Sphere: Radius from Surface Area"
    lines = [
        r"A=4\pi r^2=100\pi",
        r"r^2=25",
        r"r=5\text{ cm}",
    ]
    box_indices = (2,)


class Qb6Solution(AVSolution):
    title = r"B6 \quad Sphere: Radius from Surface Area"
    lines = [
        r"A=4\pi r^2=12\pi",
        r"r^2=3",
        r"r=\sqrt3\approx1.73\text{ cm}",
    ]
    box_indices = (2,)


class Qb7Solution(AVSolution):
    title = r"B7 \quad Sphere: Radius \& Volume"
    lines = [
        r"4\pi r^2=1850\;\Rightarrow\; r^2=147.2",
        r"r=12.1\text{ cm}\ (3\text{ s.f.})",
        r"V=\tfrac43\pi r^3\approx7480\text{ cm}^3\ (3\text{ s.f.})",
    ]
    box_indices = (1, 2)


class Qb8Solution(AVSolution):
    title = r"B8 \quad Hemisphere: Volume"
    lines = [
        r"\pi r^2=900\pi\;\Rightarrow\; r=30\text{ mm}",
        r"V=\tfrac23\pi r^3=\tfrac23\pi(30)^3",
        r"=18000\pi\text{ mm}^3",
    ]
    box_indices = (2,)


class Qb9Solution(AVSolution):
    title = r"B9 \quad Sphere: Surface Area"
    lines = [
        r"d=7\;\Rightarrow\; r=3.5\text{ cm}",
        r"A=4\pi r^2=4\pi(3.5)^2",
        r"=49\pi\text{ cm}^2",
    ]
    box_indices = (2,)


class Qb10Solution(AVSolution):
    title = r"B10 \quad Hemisphere: Base Circumference"
    lines = [
        r"\text{CSA}=2\pi r^2=200\;\Rightarrow\; r^2=31.83",
        r"r=5.642\text{ m}",
        r"C=2\pi r\approx35.4\text{ m}\ (3\text{ s.f.})",
    ]
    box_indices = (2,)


class Qb11Solution(AVSolution):
    title = r"B11 \quad Sphere: Recasting"
    lines = [
        r"\text{27 equal spheres: }27\cdot\tfrac43\pi r^3=\tfrac43\pi(15)^3",
        r"r^3=\dfrac{15^3}{27}=125\;\Rightarrow\; r=5\text{ cm}",
        r"A=4\pi r^2=4\pi(5)^2=100\pi\text{ cm}^2",
    ]
    box_indices = (1, 2)


class Qb12Solution(AVSolution):
    title = r"B12 \quad Sphere = Cylinder (Equal Volume)"
    lines = [
        r"\text{Sphere }r=9:\ V=\tfrac43\pi(9)^3=972\pi",
        r"\text{Cylinder }h=6.75:\ \pi r^2(6.75)=972\pi",
        r"r^2=144\;\Rightarrow\; r=12\text{ cm}",
    ]
    box_indices = (2,)


class Qb13Solution(AVSolution):
    title = r"B13 \quad Hemispherical Bowls"
    lines = [
        r"\text{Internal }r=7.8,\ \text{external }R=8.0\ (t=0.2)",
        r"V_{\text{bowl}}=\tfrac23\pi(R^3-r^3)=\tfrac23\pi(8^3-7.8^3)",
        r"\approx78.4\text{ cm}^3",
        r"n=\dfrac{600}{78.4}\approx7.65\;\Rightarrow\;7\text{ bowls}",
    ]
    box_indices = (3,)


class Qb14Solution(AVSolution):
    title = r"B14 \quad Sphere in Water (Displacement)"
    lines = [
        r"\text{Sphere }d=7.2\Rightarrow r=3.6;\ \text{tank }R=4.8",
        r"V_{\text{sphere}}=\tfrac43\pi(3.6)^3=62.208\pi",
        r"\text{rise}=\dfrac{62.208\pi}{\pi(4.8)^2}=2.7\text{ cm}",
        r"\text{original depth}=13-2.7=10.3\text{ cm}",
    ]
    box_indices = (3,)


class Qb15Solution(AVSolution):
    title = r"B15 \quad Cylinder + Hemisphere Vessel"
    lines = [
        r"d=30\Rightarrow r=15;\ \ V=\pi r^2h+\tfrac23\pi r^3=9000\pi",
        r"225h+2250=9000\;\Rightarrow\; h=30\text{ cm}",
        r"\text{total height}=h+r=30+15=45\text{ cm}",
        r"45>40\ \Rightarrow\ \text{no, it is not less than 40 cm}",
    ]
    box_indices = (2,)


class Qb16Solution(AVSolution):
    title = r"B16 \quad Two Hemispheres"
    lines = [
        r"\text{Larger: }2\pi R^2=40.5\pi\Rightarrow R=4.5\ (r=4)",
        r"A=2\pi r^2+2\pi R^2+\pi(R^2-r^2)",
        r"=32\pi+40.5\pi+4.25\pi=76.75\pi",
        r"\approx241\text{ cm}^2",
    ]
    box_indices = (3,)


class Qb17Solution(AVSolution):
    title = r"B17 \quad Cylinder + Hemisphere"
    lines = [
        r"\text{Cylinder }r=10,\ h=15;\ \text{hemisphere }r=6",
        r"\text{CSA}_{\text{cyl}}=2\pi r h=2\pi(10)(15)=300\pi",
        r"\text{CSA}_{\text{hemi}}=2\pi(6)^2=72\pi",
        r"\text{TSA}=100\pi+300\pi+64\pi+72\pi=536\pi\text{ cm}^2",
    ]
    box_indices = (1, 2, 3)


class Qb18Solution(AVSolution):
    title = r"B18 \quad Cone vs Hemisphere"
    lines = [
        r"\text{Equal TSA: }\pi r^2+\pi r l=3\pi R^2",
        r"207.36\pi+14.4\pi l=432\pi\Rightarrow l=15.6\text{ cm}",
        r"h=\sqrt{l^2-r^2}=\sqrt{243.36-207.36}=6",
        r"V_{\text{hemi}}=1152\pi>V_{\text{cone}}=414.72\pi\ \text{(yes)}",
    ]
    box_indices = (1, 3)


class Qb19Solution(AVSolution):
    title = r"B19 \quad Capsule (Cylinder + 2 Hemispheres)"
    lines = [
        r"d=1.5\Rightarrow r=0.75;\ \ 2\pi r h+4\pi r^2=20.25\pi",
        r"1.5h+2.25=20.25\Rightarrow h=12",
        r"\text{length}=h+2r=12+1.5=13.5\text{ cm}",
        r"V=\pi r^2h+\tfrac43\pi r^3=6.75\pi+0.5625\pi=7.3125\pi\text{ cm}^3",
    ]
    box_indices = (2, 3)


class Qb20Solution(AVSolution):
    title = r"B20 \quad Cone + Hemisphere"
    lines = [
        r"\dfrac{V_{\text{cone}}}{V_{\text{hemi}}}=\dfrac{8\pi r^2}{\tfrac23\pi r^3}=\dfrac23\Rightarrow r=18\text{ cm}",
        r"V=8\pi r^2+\tfrac23\pi r^3=2592\pi+3888\pi=6480\pi\text{ cm}^3",
        r"l=\sqrt{18^2+24^2}=30",
        r"\text{TSA}=\pi r l+2\pi r^2=540\pi+648\pi=1188\pi\text{ cm}^2",
    ]
    box_indices = (0, 1, 3)


class Qb22Solution(AVSolution):
    title = r"B22 \quad Cone Carved from a Sphere"
    lines = [
        r"\text{Cone }r=4,\ h=8\ \text{inscribed in sphere }R",
        r"16+(8-R)^2=R^2\Rightarrow R=5\text{ cm}",
        r"\dfrac{V_{\text{cone}}}{V_{\text{sphere}}}=\dfrac{128\pi/3}{500\pi/3}=25.6\%",
    ]
    box_indices = (1, 2)


class Qb23Solution(AVSolution):
    title = r"B23 \quad Composite Solid in a Tank"
    lines = [
        r"\text{Tank }R=2r;\ \text{remove solid }\Rightarrow\text{level drops }20\%",
        r"\pi r^2h+\tfrac23\pi r^3=0.2\cdot4\pi r^2(h+r)\Rightarrow h=\tfrac{2r}{3}",
        r"\text{SA}=\tfrac{13}{3}\pi r^2=975\pi\Rightarrow r=15\text{ cm}",
        r"V_{\text{water}}=4\pi r^2(h+r)-V_{\text{solid}}=18000\pi\text{ cm}^3",
    ]
    box_indices = (1, 3)
