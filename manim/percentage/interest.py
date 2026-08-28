"""Percentages - Deck 3 (Concept & Formula): simple and compound interest.

    Slide 1   the symbols:        P  R%  T  I  A
    Slide 2   simple interest:    I = P x R% x T ,  A = P(1 + R% x T)
    Slide 3   simple example:     $1,000,000 at 5% p.a. -> $50,000 each year
    Slide 4   compound interest:  A = P(1 + R%)^n  (interest earns interest)
    Slide 5   simple vs compound: after 2 years at 5%

Render (from dashboard/):
    .\\render.ps1 -SceneFile manim\\percentage\\interest.py `
                  -SceneName Interest -Deck percentage\\interest -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import (  # noqa: E402
    PctSlide, BG, INK, MUTED, GOLD, OLD, NEW, FACTOR, GROW,
)

PRIN = OLD        # principal
AMT = NEW         # amount
INT = GROW        # interest
RATE = GOLD       # rate
TIME = FACTOR     # time


def symbol_card(symbol: str, name: str, color, width: float = 2.45,
                height: float = 1.95) -> VGroup:
    sym = MathTex(symbol, font_size=54, color=color)
    nm = Tex(name, font_size=24, color=color)
    inner = VGroup(sym, nm).arrange(DOWN, buff=0.22)
    box = RoundedRectangle(
        corner_radius=0.16, width=width, height=height,
        stroke_color=color, stroke_width=2.0,
        fill_color=color, fill_opacity=0.08,
    )
    inner.move_to(box.get_center())
    return VGroup(box, inner)


class Interest(PctSlide):
    def construct(self):
        self.camera.background_color = BG
        self.title_bar(r"Simple \& Compound Interest")
        self.next_slide()

        # ── Slide 1: the symbols ─────────────────────────────────────────
        specs = [
            ("P", "Principal", PRIN),
            ("R\\%", "Rate p.a.", RATE),
            ("T", "Time (years)", TIME),
            ("I", "Interest", INT),
            ("A", "Amount", AMT),
        ]
        cards = [symbol_card(s, n, c) for s, n, c in specs]
        row = VGroup(*cards).arrange(RIGHT, buff=0.22).move_to([0, 0.35, 0])
        amt = MathTex(r"\text{Amount}", "=", r"\text{Principal}", "+", r"\text{Interest}",
                      font_size=40)
        amt.set_color_by_tex(r"\text{Amount}", AMT)
        amt.set_color_by_tex(r"\text{Principal}", PRIN)
        amt.set_color_by_tex(r"\text{Interest}", INT)
        amt.next_to(row, DOWN, buff=0.75)

        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in cards],
                              lag_ratio=0.16))
        self.play(Write(amt))
        self.next_slide()
        self.play(FadeOut(row), FadeOut(amt))

        # ── Slide 2: simple interest ─────────────────────────────────────
        head = Tex("Simple interest", font_size=42, color=GOLD).move_to([0, 2.0, 0])
        si = MathTex(r"I", "=", r"P", r"\times", r"R\%", r"\times", r"T", font_size=52)
        si.set_color_by_tex("I", INT)
        si.set_color_by_tex("P", PRIN)
        si.set_color_by_tex(r"R\%", RATE)
        si.set_color_by_tex("T", TIME)
        si.move_to([0, 0.95, 0])

        a1 = MathTex(r"A", "=", r"P", "+", r"I", font_size=46)
        a2 = MathTex("=", r"P", "+", r"P \times R\% \times T", font_size=46)
        a3 = MathTex("=", r"P\,(1 + R\% \times T)", font_size=46)
        for a in (a1, a2, a3):
            a.set_color_by_tex("A", AMT)
            a.set_color_by_tex("P", PRIN)
            a.set_color_by_tex("I", INT)
        a3.set_color_by_tex(r"P\,(1 + R\% \times T)", PRIN)
        steps = VGroup(a1, a2, a3).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        steps.move_to([0, -1.4, 0])
        a2.align_to(a1[1], LEFT)
        a3.align_to(a1[1], LEFT)

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(Write(si))
        self.next_slide()
        self.play(Write(a1))
        self.play(FadeIn(a2, shift=DOWN * 0.12))
        self.play(FadeIn(a3, shift=DOWN * 0.12))
        self.next_slide()
        self.play(FadeOut(VGroup(head, si, steps)))

        # ── Slide 3: simple example ──────────────────────────────────────
        head = Tex(r"Example: $\$1\,000\,000$ at $5\%$ p.a. (simple)",
                   font_size=36, color=GOLD).move_to([0, 2.0, 0])
        yearly = MathTex(r"\text{each year:}\quad 1\,000\,000 \times 5\% = \$50\,000",
                         font_size=42, color=INK).move_to([0, 0.85, 0])
        yearly.set_color_by_tex(r"\$50\,000", INT)
        two = MathTex(r"\text{after 2 years:}\quad I = 2 \times 50\,000 = \$100\,000",
                      font_size=42, color=INK).move_to([0, -0.25, 0])
        amt = MathTex(r"A = 1\,000\,000 + 100\,000 = \$1\,100\,000",
                      font_size=42, color=AMT).move_to([0, -1.5, 0])

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(Write(yearly))
        self.next_slide()
        self.play(Write(two))
        self.play(Write(amt))
        self.next_slide()
        self.play(FadeOut(VGroup(head, yearly, two, amt)))

        # ── Slide 4: compound interest ───────────────────────────────────
        head = Tex("Compound interest", font_size=42, color=GOLD).move_to([0, 2.0, 0])
        note = Tex(r"interest is added to the principal, so it \emph{earns interest too}",
                   font_size=32, color=MUTED).next_to(head, DOWN, buff=0.3)
        ci = MathTex(r"A", "=", r"P\,(1 + R\%)^{\,n}", font_size=58)
        ci.set_color_by_tex("A", AMT)
        ci.set_color_by_tex(r"P\,(1 + R\%)^{\,n}", PRIN)
        ci.move_to([0, -0.1, 0])
        ndef = MathTex(r"n = \text{number of compounding periods}", font_size=34, color=MUTED)
        ndef.next_to(ci, DOWN, buff=0.55)

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(note))
        self.next_slide()
        self.play(Write(ci))
        self.play(FadeIn(ndef))
        self.next_slide()
        self.play(FadeOut(VGroup(head, note, ci, ndef)))

        # ── Slide 5: how often is it compounded? ─────────────────────────
        head = Tex(r"How often is it compounded?", font_size=40, color=GOLD).move_to([0, 2.6, 0])
        sub = MathTex(r"\text{divide the yearly rate by } k,\ \text{and compound } kT \text{ times}",
                      font_size=30, color=MUTED).next_to(head, DOWN, buff=0.24)

        col_x = [-5.6, -2.0, 0.6]
        hdr_y = 1.35
        hdr = [
            Tex("Frequency", font_size=30, color=INK),
            MathTex(r"k\ \text{per year}", font_size=30, color=INK),
            Tex("Amount", font_size=30, color=INK),
        ]
        for cell, x in zip(hdr, col_x):
            cell.move_to([x, hdr_y, 0], aligned_edge=LEFT)
        hrule = Line([-6.3, hdr_y - 0.38, 0], [6.3, hdr_y - 0.38, 0],
                     color=MUTED, stroke_width=2)

        data = [
            ("Annually",    "1",  r"A = P\,(1 + R\%)^{T}"),
            ("Half-yearly", "2",  r"A = P\left(1 + \tfrac{R\%}{2}\right)^{2T}"),
            ("Quarterly",   "4",  r"A = P\left(1 + \tfrac{R\%}{4}\right)^{4T}"),
            ("Monthly",     "12", r"A = P\left(1 + \tfrac{R\%}{12}\right)^{12T}"),
        ]
        ys = [0.45, -0.5, -1.45, -2.4]
        rows = []
        for (freq, k, formula), y in zip(data, ys):
            c0 = Tex(freq, font_size=30, color=AMT)
            c1 = MathTex(k, font_size=34, color=RATE)
            c2 = MathTex(formula, font_size=34, color=PRIN)
            c0.move_to([col_x[0], y, 0], aligned_edge=LEFT)
            c1.move_to([col_x[1], y, 0], aligned_edge=LEFT)
            c2.move_to([col_x[2], y, 0], aligned_edge=LEFT)
            rows.append(VGroup(c0, c1, c2))
        table = VGroup(*rows)

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(sub))
        self.play(LaggedStart(*[FadeIn(c, shift=DOWN * 0.1) for c in hdr],
                              lag_ratio=0.15), Create(hrule))
        self.next_slide()
        for r in rows:
            self.play(FadeIn(r, shift=RIGHT * 0.2))
            self.next_slide()
        self.play(FadeOut(VGroup(head, sub, *hdr, hrule, table)))

        # ── Slide 6: simple vs compound after 2 years ────────────────────
        head = Tex(r"Same $\$1\,000\,000$ at $5\%$ for 2 years",
                   font_size=38, color=GOLD).move_to([0, 2.1, 0])

        s_head = Tex("Simple", font_size=34, color=INT)
        s_eq = MathTex(r"A = 1\,000\,000\,(1 + 5\% \times 2)", font_size=36, color=INK)
        s_res = MathTex(r"= \$1\,100\,000", font_size=40, color=INT)
        s_col = VGroup(s_head, s_eq, s_res).arrange(DOWN, buff=0.3)

        c_head = Tex("Compound", font_size=34, color=AMT)
        c_eq = MathTex(r"A = 1\,000\,000\,(1 + 5\%)^{2}", font_size=36, color=INK)
        c_res = MathTex(r"= \$1\,102\,500", font_size=40, color=AMT)
        c_col = VGroup(c_head, c_eq, c_res).arrange(DOWN, buff=0.3)

        cols = VGroup(s_col, c_col).arrange(RIGHT, buff=1.3).move_to([0, -0.1, 0])
        diff = MathTex(r"\text{compound earns } \$2\,500 \text{ more}",
                       font_size=32, color=GOLD).move_to([0, -2.4, 0])

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(s_col, shift=UP * 0.15))
        self.next_slide()
        self.play(FadeIn(c_col, shift=UP * 0.15))
        self.play(FadeIn(diff))
        self.next_slide()
