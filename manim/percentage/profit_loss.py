"""Percentages - Deck 2 (Concept & Formula): cost, marked price, discount,
selling price and profit (the "CMDSP" chain).

    Slide 1   the five quantities:  C  M  D  S  P
    Slide 2   marked price:  Marked = Cost x (1 + profit%)
    Slide 3   discount:      Selling = Marked x (1 - discount%)
    Slide 4   profit:        Profit = Selling - Cost ,  Profit% = Profit / Cost
    Slide 5   worked cake:   M = $260, +30% at marked price, then 15% discount

Render (from dashboard/):
    .\\render.ps1 -SceneFile manim\\percentage\\profit_loss.py `
                  -SceneName ProfitLoss -Deck percentage\\profit-loss -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import (  # noqa: E402
    PctSlide, BG, INK, MUTED, GOLD, COST, MARK, SELL, PROFIT, GROW, DROP,
)


def quantity_card(symbol: str, name: str, color, width: float = 2.45,
                  height: float = 2.0) -> VGroup:
    sym = MathTex(symbol, font_size=62, color=color)
    nm = Tex(name, font_size=26, color=color)
    inner = VGroup(sym, nm).arrange(DOWN, buff=0.24)
    box = RoundedRectangle(
        corner_radius=0.16, width=width, height=height,
        stroke_color=color, stroke_width=2.0,
        fill_color=color, fill_opacity=0.08,
    )
    inner.move_to(box.get_center())
    return VGroup(box, inner)


class ProfitLoss(PctSlide):
    def construct(self):
        self.camera.background_color = BG
        self.title_bar(r"Profit, Discount \& Marked Price")
        self.next_slide()

        # ── Slide 1: the five quantities ─────────────────────────────────
        specs = [
            ("C", "Cost", COST),
            ("M", "Marked price", MARK),
            ("D", "Discount", DROP),
            ("S", "Selling price", SELL),
            ("P", "Profit", PROFIT),
        ]
        cards = [quantity_card(s, n, c) for s, n, c in specs]
        row = VGroup(*cards).arrange(RIGHT, buff=0.22).move_to([0, 0.35, 0])
        flow = Tex(r"cost $\rightarrow$ marked price $\rightarrow$ discount $\rightarrow$ selling price $\rightarrow$ profit",
                   font_size=32, color=MUTED).next_to(row, DOWN, buff=0.7)

        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in cards],
                              lag_ratio=0.16))
        self.play(FadeIn(flow))
        self.next_slide()
        self.play(FadeOut(row), FadeOut(flow))

        # ── Slide 2: marked price ────────────────────────────────────────
        self._formula_slide(
            head="Marked price (price on the tag)",
            line=[r"\text{Marked price}", "=", r"\text{Cost}", r"\times",
                  r"(1 + \text{profit}\%)"],
            colmap={r"\text{Marked price}": MARK, r"\text{Cost}": COST,
                    r"(1 + \text{profit}\%)": GROW},
            note=r"percentage profit on cost \emph{raises} the marked price above cost",
            note_col=GROW,
        )

        # ── Slide 3: discount ────────────────────────────────────────────
        self._formula_slide(
            head="Selling price after a discount",
            line=[r"\text{Selling price}", "=", r"\text{Marked price}", r"\times",
                  r"(1 - \text{discount}\%)"],
            colmap={r"\text{Selling price}": SELL, r"\text{Marked price}": MARK,
                    r"(1 - \text{discount}\%)": DROP},
            note=r"a discount \emph{lowers} the marked price",
            note_col=DROP,
        )

        # ── Slide 4: profit ──────────────────────────────────────────────
        head = Tex("Profit and percentage profit", font_size=40, color=GOLD).move_to([0, 1.95, 0])
        p1 = MathTex(r"\text{Profit}", "=", r"\text{Selling price}", "-", r"\text{Cost}",
                     font_size=48)
        p1.set_color_by_tex(r"\text{Profit}", PROFIT)
        p1.set_color_by_tex(r"\text{Selling price}", SELL)
        p1.set_color_by_tex(r"\text{Cost}", COST)
        p2 = MathTex(r"\text{Profit}\%", "=", r"{\text{Profit} \over \text{Cost}}",
                     r"\times 100\%", font_size=48)
        p2.set_color_by_tex(r"\text{Profit}\%", PROFIT)
        p2.set_color_by_tex(r"{\text{Profit} \over \text{Cost}}", INK)
        col = VGroup(p1, p2).arrange(DOWN, buff=0.7).move_to([0, -0.15, 0])

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(Write(p1))
        self.play(Write(p2))
        self.next_slide()
        self.play(FadeOut(VGroup(head, col)))

        # ── Slide 5: worked cake example ─────────────────────────────────
        self._worked_example()

    # ----------------------------------------------------------------------
    def _formula_slide(self, head, line, colmap, note, note_col):
        h = Tex(head, font_size=40, color=GOLD).move_to([0, 1.7, 0])
        eq = MathTex(*line, font_size=48)
        for tex, col in colmap.items():
            eq.set_color_by_tex(tex, col)
        eq.move_to([0, 0.1, 0])
        nt = Tex(note, font_size=32, color=note_col).move_to([0, -1.6, 0])
        self.play(FadeIn(h, shift=DOWN * 0.15))
        self.play(Write(eq))
        self.play(FadeIn(nt))
        self.next_slide()
        self.play(FadeOut(VGroup(h, eq, nt)))

    def _worked_example(self):
        q1 = Tex(r"A cake is marked at $\$260$. Sold at the marked price,",
                 font_size=38, color=INK)
        q2 = Tex(r"the profit is $30\%$. Find the profit if it is sold",
                 font_size=38, color=INK)
        q3 = Tex(r"at a $15\%$ discount.", font_size=38, color=INK)
        ques = VGroup(q1, q2, q3).arrange(DOWN, aligned_edge=LEFT, buff=0.26)
        ques.to_edge(LEFT, buff=0.7).shift(UP * 1.55)

        lines = [
            (r"\text{Cost:}", r"260 = C \times (1 + 30\%)", r"\Rightarrow\; C = \$200", COST),
            (r"\text{Selling:}", r"S = 260 \times (1 - 15\%)", r"= \$221", SELL),
            (r"\text{Profit:}", r"P = 221 - 200", r"= \$21", PROFIT),
            (r"\text{Profit}\%:", r"\tfrac{21}{200} \times 100\%", r"= 10.5\%", PROFIT),
        ]
        rows = []
        for lbl, mid, res, col in lines:
            r = MathTex(lbl, mid, res, font_size=40)
            r.set_color_by_tex(lbl, MUTED)
            r[2].set_color(col)
            rows.append(r)
        block = VGroup(*rows).arrange(DOWN, aligned_edge=LEFT, buff=0.36)
        block.move_to([0, -1.15, 0])

        self.play(FadeIn(ques, shift=DOWN * 0.1))
        self.next_slide()
        for r in rows:
            self.play(Write(r))
            self.next_slide()
