"""Find the depreciation rate r from original and later values.

Correct solution: r = 36 (worksheet wrongly showed r = 20).

Render from dashboard/:
    .\\render.ps1 -SceneFile manim\\percentage\\machine_depreciation.py `
        -SceneName MachineDepreciation -Deck percentage\\machine-depreciation -Quality m
"""
from __future__ import annotations

import pathlib
import sys

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import BG, DROP, FACTOR, GOLD, INK, MUTED, NEW, OLD, PctSlide


class MachineDepreciation(PctSlide):
    """Solve for the yearly depreciation rate given old and new values."""

    def construct(self):
        self.camera.background_color = BG
        # In-video title (chip button name is separate in the dashboard HTML).
        self.title_bar("Find the rate")

        # Slide 1: concept
        heading = Tex(
            r"Depreciation by $r\%$ each year $\Rightarrow$ multiply by $(1-r\%)$.",
            color=GOLD,
            font_size=36,
        ).move_to([0, 1.15, 0])
        formula = MathTex(
            r"\text{new}=\text{old}\times(1-r\%)",
            font_size=50,
        ).move_to([0, 0.05, 0])
        formula.set_color_by_tex("new", NEW)
        formula.set_color_by_tex("old", OLD)
        formula.set_color_by_tex("r", DROP)
        rearrange = MathTex(
            r"1-r\%=\dfrac{\text{new}}{\text{old}}",
            font_size=48,
        ).move_to([0, -1.15, 0])
        rearrange.set_color_by_tex("new", NEW)
        rearrange.set_color_by_tex("old", OLD)
        rearrange.set_color_by_tex("r", DROP)
        note = Tex(
            r"Then solve for $r$.",
            color=MUTED,
            font_size=34,
        ).move_to([0, -2.2, 0])

        self.play(FadeIn(heading, shift=DOWN * 0.15))
        self.play(Write(formula))
        self.play(Write(rearrange))
        self.play(FadeIn(note))
        self.next_slide()

        # Slide 2: question
        self.play(FadeOut(VGroup(heading, formula, rearrange, note)))
        q1 = Tex(
            r"A machine depreciates by $r\%$ each year.",
            color=DROP,
            font_size=42,
        ).move_to([0, 1.25, 0])
        q2 = Tex(
            r"Original value $=\$10\,000$; after 1 year $=\$6\,400$.",
            color=INK,
            font_size=40,
        ).next_to(q1, DOWN, buff=0.4)
        q2.set_color_by_tex("10", OLD)
        q2.set_color_by_tex("6", NEW)
        q3 = Tex(
            r"Find the value of $r$.",
            color=GOLD,
            font_size=44,
        ).move_to([0, -1.35, 0])

        self.play(FadeIn(q1, shift=DOWN * 0.12))
        self.play(FadeIn(q2, shift=DOWN * 0.12))
        self.play(Write(q3))
        # Wait for the learner to press before leaving the question page.
        self.next_slide()

        self.play(FadeOut(VGroup(q1, q2, q3)))

        # Persistent prompt for calculation slides.
        prompt_a = Tex(
            r"Question: old $=\$10\,000$; new $=\$6\,400$ after 1 year.",
            color=INK,
            font_size=30,
        )
        prompt_a.set_color_by_tex("10", OLD)
        prompt_a.set_color_by_tex("6", NEW)
        prompt_b = Tex(
            r"Depreciates by $r\%$ each year. Find $r$.",
            color=GOLD,
            font_size=30,
        )
        prompt_b.set_color_by_tex("r", DROP)
        prompt = VGroup(prompt_a, prompt_b).arrange(DOWN, buff=0.1).to_edge(UP, buff=1.28)

        panel = RoundedRectangle(
            width=12.4,
            height=4.7,
            corner_radius=0.2,
            stroke_color=FACTOR,
            stroke_width=3,
            fill_color=FACTOR,
            fill_opacity=0.08,
        ).move_to([0, -0.45, 0])

        eq1 = MathTex(
            r"6\,400=10\,000\times(1-r\%)",
            font_size=46,
        ).move_to([0, 0.55, 0])
        eq1.set_color_by_tex("6", NEW)
        eq1.set_color_by_tex("10", OLD)
        eq1.set_color_by_tex("r", DROP)

        self.play(FadeIn(prompt, shift=DOWN * 0.1), FadeIn(panel))
        self.play(Write(eq1))
        self.next_slide()

        eq2 = MathTex(
            r"0.64=1-r\%",
            font_size=48,
        ).move_to([0, -0.35, 0])
        eq2.set_color_by_tex("0.64", NEW)
        eq2.set_color_by_tex("r", DROP)
        self.play(Write(eq2))
        self.next_slide()

        eq3 = MathTex(
            r"r\%=1-0.64=0.36",
            font_size=48,
        ).move_to([0, -1.25, 0])
        eq3.set_color_by_tex("r", DROP)
        eq3.set_color_by_tex("0.64", NEW)
        eq3.set_color_by_tex("0.36", DROP)
        self.play(Write(eq3))
        self.next_slide()

        eq4 = MathTex(
            r"r=36",
            color=DROP,
            font_size=52,
        ).move_to([0, -2.15, 0])
        self.play(Write(eq4))
        self.next_slide()

        # Final answer page — keep prompt; clear working.
        self.play(FadeOut(VGroup(panel, eq1, eq2, eq3, eq4)))
        recall = Tex(
            r"Check: $\$10\,000\times(1-36\%)=\$10\,000\times 0.64=\$6\,400$.",
            color=MUTED,
            font_size=32,
        ).move_to([0, 0.35, 0])
        recall.set_color_by_tex("10", OLD)
        recall.set_color_by_tex("36", DROP)
        recall.set_color_by_tex("6", NEW)
        answer = MathTex(r"\boxed{r=36}", color=DROP, font_size=64).move_to(
            [0, -1.2, 0]
        )

        self.play(FadeIn(recall, shift=DOWN * 0.08))
        self.play(Write(answer))
        self.next_slide()
