"""Percentages - Deck 4 (Concept & Formula): progressive salaries tax.

    Slide 1   tax rate table (HK progressive brackets)
    Slide 2   net chargeable income formula
    Slide 3   example setup: Miss Kwan
    Slide 4   step 1: NCI = income − allowance
    Slide 5   step 2: split NCI into $50,000 brackets
    Slide 6   step 3: calculate tax payable

Render (from dashboard/):
    .\\render.ps1 -SceneFile manim\\percentage\\tax.py `
                  -SceneName SalariesTax -Deck percentage\\tax -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import (  # noqa: E402
    PctSlide, BG, INK, MUTED, GOLD, OLD, NEW, FACTOR, GROW, DROP,
)

INCOME = OLD
ALLOW = DROP
NCI = NEW
TAX = GROW
RATE = GOLD

# Safe vertical bands (16:9 frame, y in [-4, 4])
TOP_Y = 2.35
MID_Y = 0.0
LOW_Y = -2.6


def tax_table_row(income_tex: str, rate_tex: str, tax_tex: str,
                  y: float) -> MathTex:
    row = MathTex(income_tex, rate_tex, tax_tex, font_size=28, color=INK)
    row[1].set_color(RATE)
    row[2].set_color(TAX)
    row.move_to([0, y, 0])
    return row


class SalariesTax(PctSlide):
    def _step_header(self, n: int, label: str) -> VGroup:
        """Step badge + caption pinned to the upper-left corner."""
        step = Tex(f"Step {n}", font_size=34, color=GOLD)
        head = Tex(label, font_size=34, color=INK)
        block = VGroup(step, head).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        block.to_corner(UL, buff=0.55)
        return block

    def _below_header(self, hdr: VGroup, mob: Mobject, buff: float = 0.72,
                      center: bool = True) -> Mobject:
        """Place content clearly below the step header, never overlapping it."""
        mob.next_to(hdr, DOWN, buff=buff, aligned_edge=LEFT)
        if center:
            mob.set_x(0)
        return mob

    def construct(self):
        self.camera.background_color = BG
        title_grp = self.title_bar(r"Progressive Salaries Tax")
        self.next_slide()
        self.play(FadeOut(title_grp))

        # ── Slide 1: tax rate table ──────────────────────────────────────
        head = Tex("Salaries tax rates (progressive)", font_size=38, color=GOLD)
        head.move_to([0, TOP_Y, 0])
        hdr_y = 1.55
        hdr = MathTex(
            r"\text{Net chargeable income}",
            r"\qquad\text{Tax rate}",
            r"\qquad\text{Salaries tax}",
            font_size=28, color=MUTED,
        ).move_to([0, hdr_y, 0])
        hrule = Line([-5.5, hdr_y - 0.35, 0], [5.5, hdr_y - 0.35, 0],
                     color=MUTED, stroke_width=2)

        rows_data = [
            (r"\text{On the first } \$50\,000", r"\qquad 2\%", r"\qquad \$1\,000"),
            (r"\text{On the next } \$50\,000", r"\qquad 6\%", r"\qquad \$3\,000"),
            (r"\text{On the next } \$50\,000", r"\qquad 10\%", r"\qquad \$5\,000"),
            (r"\text{On the next } \$50\,000", r"\qquad 14\%", r"\qquad \$7\,000"),
            (r"\text{Remainder}", r"\qquad 17\%", r"\qquad ?"),
        ]
        ys = [0.75, 0.05, -0.65, -1.35, -2.05]
        rows = [tax_table_row(a, b, c, y) for (a, b, c), y in zip(rows_data, ys)]
        table = VGroup(*rows)

        note = Tex(r"Each bracket is taxed at its own rate --- not the whole income!",
                   font_size=28, color=MUTED).move_to([0, LOW_Y, 0])

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(hdr, shift=DOWN * 0.1), Create(hrule))
        self.next_slide()
        for r in rows:
            self.play(FadeIn(r, shift=RIGHT * 0.15))
            self.next_slide()
        self.play(FadeIn(note))
        self.next_slide()
        self.play(FadeOut(VGroup(head, hdr, hrule, table, note)))

        # ── Slide 2: net chargeable income ───────────────────────────────
        head = Tex("Net chargeable income", font_size=42, color=GOLD).move_to([0, 1.8, 0])
        eq = MathTex(
            r"\text{Net chargeable income}", "=",
            r"\text{Total annual income}", "-", r"\text{Tax allowance}",
            font_size=46,
        )
        eq.set_color_by_tex(r"\text{Net chargeable income}", NCI)
        eq.set_color_by_tex(r"\text{Total annual income}", INCOME)
        eq.set_color_by_tex(r"\text{Tax allowance}", ALLOW)
        eq.next_to(head, DOWN, buff=0.55)
        note = Tex(r"Only the net chargeable income is taxed --- not the full salary",
                   font_size=30, color=MUTED)
        note.next_to(eq, DOWN, buff=0.55)

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(Write(eq))
        self.play(FadeIn(note))
        self.next_slide()
        self.play(FadeOut(VGroup(head, eq, note)))

        # ── Slide 3: example setup ───────────────────────────────────────
        head = Tex("Example: Miss Kwan (2019/20)", font_size=40, color=GOLD)
        head.to_edge(UP, buff=0.55)
        inc = MathTex(r"\text{Total annual income} = \$300\,000", font_size=40, color=INCOME)
        allw = MathTex(r"\text{Tax allowance} = \$120\,000", font_size=40, color=ALLOW)
        ask = Tex(r"Find her salaries tax payable.", font_size=34, color=INK)
        block = VGroup(inc, allw, ask).arrange(DOWN, buff=0.5)
        block.next_to(head, DOWN, buff=0.55)

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(inc, shift=UP * 0.12))
        self.play(FadeIn(allw, shift=UP * 0.12))
        self.play(FadeIn(ask))
        self.next_slide()
        self.play(FadeOut(VGroup(head, block)))

        # ── Slide 4: step 1 ──────────────────────────────────────────────
        hdr = self._step_header(1, "Find net chargeable income")
        eq = MathTex(
            r"\text{NCI}", "=", r"300\,000", "-", r"120\,000",
            "=", r"\$180\,000",
            font_size=44,
        )
        eq.set_color_by_tex(r"\text{NCI}", NCI)
        eq.set_color_by_tex(r"300\,000", INCOME)
        eq.set_color_by_tex(r"120\,000", ALLOW)
        eq.set_color_by_tex(r"\$180\,000", NCI)
        self._below_header(hdr, eq, buff=0.75)

        self.play(FadeIn(hdr, shift=DOWN * 0.1))
        self.play(Write(eq))
        self.next_slide()
        self.play(FadeOut(VGroup(hdr, eq)))

        # ── Slide 5: step 2 ──────────────────────────────────────────────
        hdr = self._step_header(2, r"Split into $\$50\,000$ brackets")
        div = MathTex(
            r"180\,000 \div 50\,000 = 3\ \text{remainder}\ 30\,000",
            font_size=38, color=INK,
        )
        brk = MathTex(
            r"180\,000 = 50\,000 + 50\,000 + 50\,000 + 30\,000",
            font_size=36, color=NCI,
        )
        rates = MathTex(
            r"\text{brackets:}\quad 2\%\;\|\;6\%\;\|\;10\%\;\|\;14\%",
            font_size=32, color=RATE,
        )
        body = VGroup(div, brk, rates).arrange(DOWN, aligned_edge=LEFT, buff=0.38)
        self._below_header(hdr, body, buff=0.75)

        self.play(FadeIn(hdr, shift=DOWN * 0.1))
        self.play(Write(div))
        self.next_slide()
        self.play(Write(brk))
        self.play(FadeIn(rates))
        self.next_slide()
        self.play(FadeOut(VGroup(hdr, body)))

        # ── Slide 6: step 3 ──────────────────────────────────────────────
        hdr = self._step_header(3, "Calculate salaries tax payable")
        calc = MathTex(
            r"(50\,000 \times 2\%) + (50\,000 \times 6\%) + (50\,000 \times 10\%)",
            r"+ (30\,000 \times 14\%)",
            font_size=32, color=INK,
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.26)
        parts = MathTex(
            r"= 1\,000 + 3\,000 + 5\,000 + 4\,200",
            font_size=38, color=TAX,
        )
        ans = MathTex(r"= \$13\,200", font_size=48, color=TAX)
        body = VGroup(calc, parts, ans).arrange(DOWN, aligned_edge=LEFT, buff=0.38)
        self._below_header(hdr, body, buff=0.75)

        self.play(FadeIn(hdr, shift=DOWN * 0.1))
        self.play(Write(calc))
        self.next_slide()
        self.play(Write(parts))
        self.play(Write(ans))
        self.next_slide()
