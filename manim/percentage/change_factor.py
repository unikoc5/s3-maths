"""Percentages - Deck 1 (Concept & Formula): the change-factor model.

    Slide 1   master relation:  New value = Old value x Change factor
    Slide 2   table:            Old value | Change factor | New value
    Slide 3   worked single:    1000 x (1 + 10%) = 1100
    Slide 4   factor rules:     increase -> (1 + rate);  decrease -> (1 - rate)
    Slide 5   repeated change:  New value = Old value x (Change factor)^n

Render (from dashboard/):
    .\\render.ps1 -SceneFile manim\\percentage\\change_factor.py `
                  -SceneName ChangeFactor -Deck percentage\\change-factor -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import (  # noqa: E402
    PctSlide, factor_box, BG, INK, MUTED, GOLD, OLD, NEW, FACTOR, GROW, DROP,
)

COLS = [-4.3, 0.0, 4.3]   # x-positions of the three columns


class ChangeFactor(PctSlide):
    def construct(self):
        self.camera.background_color = BG
        self.title_bar(r"Percentage Change")
        self.next_slide()

        # ── Slide 1: the master relation ─────────────────────────────────
        new = Tex("New value", font_size=48, color=NEW)
        eq = MathTex("=", font_size=52, color=INK)
        old = Tex("Old value", font_size=48, color=OLD)
        tms = MathTex(r"\times", font_size=52, color=INK)
        fac = Tex("Change factor", font_size=48, color=FACTOR)
        relation = VGroup(new, eq, old, tms, fac).arrange(RIGHT, buff=0.3)
        relation.move_to([0, 0.4, 0])
        sub = Tex(r"Every percentage change is a multiplication.",
                  font_size=32, color=MUTED).next_to(relation, DOWN, buff=0.7)

        self.play(FadeIn(old, shift=UP * 0.2))
        self.play(Write(tms), FadeIn(fac, shift=UP * 0.2))
        self.play(Write(eq), FadeIn(new, shift=UP * 0.2))
        self.play(FadeIn(sub))
        self.next_slide()
        self.play(FadeOut(relation), FadeOut(sub))

        # ── Slide 2: the three-column table ──────────────────────────────
        heads = [
            Tex("Old value", font_size=40, color=OLD),
            Tex("Change factor", font_size=40, color=FACTOR),
            Tex("New value", font_size=40, color=NEW),
        ]
        for h, x in zip(heads, COLS):
            h.move_to([x, 1.85, 0])
        rule = Line([-6.2, 1.35, 0], [6.2, 1.35, 0], color=MUTED, stroke_width=2)

        row = [
            MathTex("1000", font_size=56, color=OLD).move_to([COLS[0], 0.55, 0]),
            MathTex(r"+10\%", font_size=56, color=GROW).move_to([COLS[1], 0.55, 0]),
            MathTex("?", font_size=56, color=NEW).move_to([COLS[2], 0.55, 0]),
        ]
        table = VGroup(*heads, rule, *row)

        self.play(LaggedStart(*[FadeIn(h, shift=DOWN * 0.15) for h in heads],
                              lag_ratio=0.2), Create(rule))
        self.play(FadeIn(row[0]), FadeIn(row[1]), FadeIn(row[2]))
        self.next_slide()

        # ── Slide 3: turn +10% into (1 + 10%) and evaluate ───────────────
        factor = MathTex(r"(1 + 10\%)", font_size=56, color=GROW).move_to([COLS[1], 0.55, 0])
        self.play(TransformMatchingShapes(row[1], factor))

        l1 = MathTex(r"\text{New value}", "=", "1000", r"\times", r"(1 + 10\%)",
                     font_size=46)
        l2 = MathTex("=", "1000", r"\times", "1.1", font_size=46)
        l3 = MathTex("=", "1100", font_size=46)
        l1.set_color_by_tex(r"\text{New value}", NEW)
        l1.set_color_by_tex("1000", OLD)
        l1.set_color_by_tex(r"(1 + 10\%)", GROW)
        l2.set_color_by_tex("1000", OLD)
        l2.set_color_by_tex("1.1", GROW)
        l3.set_color_by_tex("1100", NEW)
        steps = VGroup(l1, l2, l3).arrange(DOWN, aligned_edge=LEFT, buff=0.32)
        steps.move_to([0, -1.9, 0])
        l2.align_to(l1[1], LEFT)
        l3.align_to(l1[1], LEFT)

        self.play(Write(l1))
        self.play(FadeIn(l2, shift=DOWN * 0.15))
        self.play(FadeIn(l3, shift=DOWN * 0.15))
        result = MathTex("1100", font_size=56, color=NEW).move_to([COLS[2], 0.55, 0])
        self.play(TransformFromCopy(l3[1], result), FadeOut(row[2]))
        self.next_slide()
        self.play(FadeOut(VGroup(table, factor, steps, result)))

        # ── Slide 4: growth vs decay factor ──────────────────────────────
        head = Tex("Reading a change factor", font_size=40, color=GOLD).move_to([0, 1.9, 0])
        grow = factor_box(r"+50\%", r"(1 + 50\%)", GROW, "Growth factor")
        decay = factor_box(r"-15\%", r"(1 - 15\%)", DROP, "Decay factor")
        boxes = VGroup(grow, decay).arrange(RIGHT, buff=0.9).move_to([0, 0.15, 0])
        rule_up = MathTex(r"\text{increase} \;\rightarrow\; (1 + \text{rate})",
                          font_size=36).set_color_by_tex("increase", GROW)
        rule_dn = MathTex(r"\text{decrease} \;\rightarrow\; (1 - \text{rate})",
                          font_size=36).set_color_by_tex("decrease", DROP)
        rules = VGroup(rule_up, rule_dn).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        rules.move_to([0, -2.35, 0])

        self.play(FadeIn(head, shift=DOWN * 0.15))
        self.play(FadeIn(grow, shift=UP * 0.2), FadeIn(decay, shift=UP * 0.2))
        self.play(Write(rule_up))
        self.play(Write(rule_dn))
        self.next_slide()
        self.play(FadeOut(VGroup(head, boxes, rules)))

        # ── Slide 5: repeated (compound) change ──────────────────────────
        gen = MathTex(r"\text{New value}", "=", r"\text{Old value}", r"\times",
                      r"(\text{Change factor})^{n}", font_size=46)
        gen.set_color_by_tex(r"\text{New value}", NEW)
        gen.set_color_by_tex(r"\text{Old value}", OLD)
        gen.set_color_by_tex(r"(\text{Change factor})^{n}", FACTOR)
        gen.move_to([0, 1.75, 0])
        gen_note = MathTex(r"n = \text{number of times the change is applied}",
                           font_size=34, color=MUTED).next_to(gen, DOWN, buff=0.3)

        ex = Tex(r"Example: $\$10\,000$ grows $+10\%$ each year, 2021 $\to$ 2025",
                 font_size=34, color=GOLD).move_to([0, -0.1, 0])
        ncount = MathTex(r"n = 5", font_size=40, color=FACTOR).next_to(ex, DOWN, buff=0.4)
        ans = MathTex(r"\text{New value}", "=", r"10\,000", r"\times", r"(1 + 10\%)^{5}",
                      font_size=46)
        ans.set_color_by_tex(r"\text{New value}", NEW)
        ans.set_color_by_tex(r"10\,000", OLD)
        ans.set_color_by_tex(r"(1 + 10\%)^{5}", GROW)
        ans.next_to(ncount, DOWN, buff=0.45)

        self.play(Write(gen))
        self.play(FadeIn(gen_note))
        self.next_slide()
        self.play(FadeIn(ex, shift=DOWN * 0.15))
        self.play(Write(ncount))
        self.play(Write(ans))
        self.next_slide()
