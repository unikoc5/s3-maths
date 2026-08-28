"""A short Manim Slides deck for a sequential percentage-change example.

Render from dashboard/:
    .\\render.ps1 -SceneFile manim\\percentage\\rainfall_change.py `
        -SceneName RainfallChange -Deck percentage\\rainfall-change -Quality m
"""
from __future__ import annotations

import pathlib
import sys

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import BG, DROP, FACTOR, GOLD, GROW, INK, MUTED, NEW, OLD, PctSlide


class RainfallChange(PctSlide):
    """Introduce change factors, then solve the supplied rainfall example."""

    def construct(self):
        self.camera.background_color = BG
        self.title_bar("Percentage Change: Rainfall")
        self.next_slide()

        # Slide 1: concept
        new_value = Tex("New value", color=NEW, font_size=48)
        equals = MathTex("=", color=INK, font_size=52)
        old_value = Tex("Old value", color=OLD, font_size=48)
        times = MathTex(r"\times", color=INK, font_size=52)
        factor = Tex("Change factor", color=FACTOR, font_size=48)
        relation = VGroup(new_value, equals, old_value, times, factor).arrange(
            RIGHT, buff=0.28
        ).move_to([0, 0.15, 0])
        meaning = Tex(
            "A percentage change is a multiplication.",
            color=MUTED,
            font_size=34,
        ).next_to(relation, DOWN, buff=0.75)

        self.play(FadeIn(old_value, shift=UP * 0.2))
        self.play(Write(times), FadeIn(factor, shift=UP * 0.2))
        self.play(Write(equals), FadeIn(new_value, shift=UP * 0.2))
        self.play(FadeIn(meaning))
        self.next_slide()
        self.play(FadeOut(VGroup(relation, meaning)))

        # Slide 2: translate percentage changes into factors
        heading = Tex("Turn the percentage into a change factor", color=GOLD, font_size=42)
        heading.move_to([0, 1.45, 0])
        grow_rate = MathTex(r"+12\%", color=GROW, font_size=58)
        grow_factor = MathTex(r"1+0.12=1.12", color=GROW, font_size=54)
        drop_rate = MathTex(r"-15\%", color=DROP, font_size=58)
        drop_factor = MathTex(r"1-0.15=0.85", color=DROP, font_size=54)
        grow = VGroup(grow_rate, MathTex(r"\longrightarrow", color=MUTED), grow_factor).arrange(
            RIGHT, buff=0.35
        )
        decay = VGroup(drop_rate, MathTex(r"\longrightarrow", color=MUTED), drop_factor).arrange(
            RIGHT, buff=0.35
        )
        factors = VGroup(grow, decay).arrange(DOWN, buff=0.65).move_to([0, -0.35, 0])
        note = Tex(
            "Increase: add the rate.  Decrease: subtract the rate.",
            color=MUTED,
            font_size=30,
        ).next_to(factors, DOWN, buff=0.65)

        self.play(FadeIn(heading, shift=DOWN * 0.15))
        self.play(Write(grow))
        self.play(Write(decay))
        self.play(FadeIn(note))
        self.next_slide()
        self.play(FadeOut(VGroup(heading, factors, note)))

        # Slide 3: introduce the example before beginning the working.
        question = Tex(
            r"Rainfall was $2500\text{ mm}$ in 2019.",
            color=OLD,
            font_size=50,
        ).move_to([0, 1.15, 0])
        line_2 = Tex(
            r"In 2020, it increased by $12\%$.",
            color=GROW,
            font_size=50,
        ).next_to(question, DOWN, buff=0.42)
        line_3 = Tex(
            r"In 2021, it decreased by $15\%$.",
            color=DROP,
            font_size=50,
        ).next_to(line_2, DOWN, buff=0.42)
        ask = Tex("Find the rainfall in 2021.", color=GOLD, font_size=48).move_to([0, -1.95, 0])

        self.play(FadeIn(question, shift=DOWN * 0.15))
        self.play(FadeIn(line_2, shift=DOWN * 0.15))
        self.play(FadeIn(line_3, shift=DOWN * 0.15))
        self.play(Write(ask))
        self.next_slide()
        self.play(FadeOut(VGroup(question, line_2, line_3, ask)))

        # Persistent question banner — stays put across calculation slides.
        prompt_line_1 = Tex(
            r"Question: $2500\text{ mm}$ in 2019, then $+12\%$, then $-15\%$.",
            color=INK,
            font_size=34,
        )
        prompt_line_1.set_color_by_tex("2500", OLD)
        prompt_line_1.set_color_by_tex("+12", GROW)
        prompt_line_1.set_color_by_tex("-15", DROP)
        prompt_line_2 = Tex(
            r"Find the rainfall in 2021.",
            color=GOLD,
            font_size=34,
        )
        prompt = VGroup(prompt_line_1, prompt_line_2).arrange(
            DOWN, buff=0.14
        ).to_edge(UP, buff=1.55)

        step_1_label = Tex(r"Step 1: apply the 12\% increase", color=GROW, font_size=36)
        step_1_label.move_to([0, 0.55, 0])
        working_1 = MathTex(r"2500 \times 1.12 = 2800", font_size=64).move_to([0, -0.35, 0])
        working_1.set_color_by_tex("2500", OLD)
        working_1.set_color_by_tex("1.12", GROW)
        working_1.set_color_by_tex("2800", NEW)
        explanation_1 = Tex(
            r"The 2020 rainfall is $2800\text{ mm}$.",
            color=MUTED,
            font_size=34,
        ).move_to([0, -1.65, 0])

        self.play(FadeIn(prompt, shift=DOWN * 0.1))
        self.play(Write(step_1_label))
        self.play(Write(working_1))
        self.play(FadeIn(explanation_1))
        self.next_slide()

        # Keep the question banner; only swap the step-1 detail for a compact recap.
        carried_step_1 = MathTex(r"\text{Step 1: }2500 \times 1.12 = 2800", font_size=34)
        carried_step_1.set_color_by_tex("2500", OLD)
        carried_step_1.set_color_by_tex("1.12", GROW)
        carried_step_1.set_color_by_tex("2800", NEW)
        carried_step_1.move_to([0, 0.55, 0])
        step_2_label = Tex(r"Step 2: apply the 15\% decrease to 2800", color=DROP, font_size=36)
        step_2_label.move_to([0, -0.2, 0])
        working_2 = MathTex(r"2800 \times 0.85 = 2380", font_size=64).move_to([0, -1.1, 0])
        working_2.set_color_by_tex("2800", NEW)
        working_2.set_color_by_tex("0.85", DROP)
        working_2.set_color_by_tex("2380", GROW)
        explanation_2 = Tex(
            r"The 2021 rainfall is $2380\text{ mm}$.",
            color=MUTED,
            font_size=34,
        ).move_to([0, -2.15, 0])

        self.play(
            FadeOut(VGroup(step_1_label, explanation_1)),
            ReplacementTransform(working_1, carried_step_1),
        )
        self.play(Write(step_2_label))
        self.play(Write(working_2))
        self.play(FadeIn(explanation_2))
        self.next_slide()

        # Keep banner + both step results; only add the warning / final answer.
        wrong_label = Tex(
            r"Wrong: do not add $+12\%$ and $-15\%$ directly.",
            color=DROP,
            font_size=30,
        ).move_to([0, -0.35, 0])
        wrong_working = MathTex(
            r"2500 \times (1+0.12-0.15)=2425 \ne 2380",
            color=DROP,
            font_size=40,
        ).move_to([0, -0.9, 0])
        why_wrong = Tex(
            r"The $15\%$ decrease is taken from $2800$, not from $2500$.",
            color=MUTED,
            font_size=28,
        ).move_to([0, -1.4, 0])
        combined = MathTex(r"2500 \times 1.12 \times 0.85 = 2380", font_size=40)
        combined.move_to([0, -1.95, 0])
        combined.set_color_by_tex("2500", OLD)
        combined.set_color_by_tex("1.12", GROW)
        combined.set_color_by_tex("0.85", DROP)
        combined.set_color_by_tex("2380", GROW)
        answer = MathTex(r"\boxed{2380\text{ mm}}", color=GROW, font_size=54).move_to([0, -2.65, 0])

        self.play(FadeOut(VGroup(step_2_label, explanation_2)))
        self.play(working_2.animate.scale(0.55).move_to([0, 0.05, 0]))
        self.play(FadeIn(wrong_label), Write(wrong_working))
        self.play(FadeIn(why_wrong))
        self.play(Write(combined))
        self.play(Write(answer))
        self.next_slide()
