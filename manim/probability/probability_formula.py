"""Probability - Deck 1: the probability formula + a worked coin example.

    Slide 1   definition:  P = favourable / total
    Slide 2   example:     P(tail) when tossing a coin = 1/2

Render:
    manim-slides render probability_formula.py ProbabilityFormula --quality h
    manim-slides convert ProbabilityFormula <out>/index.html --to html
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from prob_common import (  # noqa: E402
    ProbSlide, coin, fraction, BG, INK, GOLD, MUTED, FAV, TOTAL, HEAD, TAIL, FORMULA_FS,
)


class ProbabilityFormula(ProbSlide):
    def construct(self):
        self.camera.background_color = BG
        self.title_bar(r"Probability")
        self.next_slide()

        # ── Slide 1: the definition ───────────────────────────────────────
        lhs = Tex(r"Probability", font_size=46, color=INK)
        eq = MathTex("=", font_size=54, color=INK)
        num = Tex(r"Number of favourable outcomes", font_size=38, color=FAV)
        den = Tex(r"Total number of possible outcomes", font_size=38, color=TOTAL)
        frac = fraction(num, den)
        defn = VGroup(lhs, eq, frac).arrange(RIGHT, buff=0.32).move_to([0, 0.2, 0])

        self.play(Write(lhs), Write(eq))
        self.play(FadeIn(num, shift=DOWN * 0.2))
        self.play(Create(frac[1]))
        self.play(FadeIn(den, shift=UP * 0.2))
        self.next_slide()
        self.play(FadeOut(defn))

        # ── Slide 2: coin example ─────────────────────────────────────────
        ex = Tex(r"Example: getting a tail when tossing a coin", font_size=38, color=GOLD)
        ex.move_to([0, 2.05, 0])
        self.play(FadeIn(ex, shift=DOWN * 0.2))

        head = coin("H", HEAD)
        tail = coin("T", TAIL)
        coins = VGroup(head, tail).arrange(RIGHT, buff=1.1).move_to([-3.6, -0.1, 0])
        head_lab = Tex("Head", font_size=30, color=HEAD).next_to(head, DOWN, buff=0.22)
        tail_lab = Tex("Tail", font_size=30, color=TAIL).next_to(tail, DOWN, buff=0.22)
        possibles = Tex(r"2 possible outcomes", font_size=30, color=TOTAL).next_to(coins, UP, buff=0.5)

        self.play(GrowFromCenter(head), GrowFromCenter(tail))
        self.play(Write(head_lab), Write(tail_lab))
        self.play(FadeIn(possibles, shift=DOWN * 0.15))

        # favourable = the tail coin (flash the highlight once, then clear it)
        fav_ring = Circle(radius=0.72, color=FAV, stroke_width=5).move_to(tail.get_center())
        fav_note = Tex(r"favourable", font_size=26, color=FAV).next_to(fav_ring, UP, buff=0.12)
        self.play(Create(fav_ring), FadeIn(fav_note, shift=DOWN * 0.1))
        self.wait(0.4)
        self.play(FadeOut(fav_ring), FadeOut(fav_note))
        self.next_slide()

        # P(tail) = 1 / 2  (1 derived from the tail coin, 2 from both coins)
        plhs = MathTex(r"P(\text{tail})", "=", font_size=FORMULA_FS, color=INK)
        one = MathTex("1", color=FAV, font_size=FORMULA_FS)
        two = MathTex("2", color=TOTAL, font_size=FORMULA_FS)
        pfrac = fraction(one, two)
        peq = VGroup(plhs, pfrac).arrange(RIGHT, buff=0.3).move_to([1.5, -0.1, 0])

        self.play(Write(plhs))
        self.play(TransformFromCopy(tail, one))
        self.play(Create(pfrac[1]))
        self.play(TransformFromCopy(coins, two))

        # annotations matching the source slide
        n1 = Tex(r"Getting tail only", font_size=24, color=FAV)
        n2 = Tex(r"Getting head or tail", font_size=24, color=TOTAL)
        n1.next_to(pfrac, RIGHT, buff=0.85).shift(UP * 0.5)
        n2.next_to(pfrac, RIGHT, buff=0.85).shift(DOWN * 0.5)
        a1 = Arrow(n1.get_left(), one.get_right(), buff=0.12, color=FAV, stroke_width=3,
                   max_tip_length_to_length_ratio=0.12)
        a2 = Arrow(n2.get_left(), two.get_right(), buff=0.12, color=TOTAL, stroke_width=3,
                   max_tip_length_to_length_ratio=0.12)
        self.play(FadeIn(n1), GrowArrow(a1))
        self.play(FadeIn(n2), GrowArrow(a2))
        self.wait(0.3)
        self.next_slide()
