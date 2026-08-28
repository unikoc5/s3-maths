"""Checkpoint 2: working backwards through two percentage increases.

Render from dashboard/:
    .\\render.ps1 -SceneFile manim/percentage/salary_checkpoint.py `
        -SceneName SalaryCheckpoint -Deck percentage/salary-checkpoint -Quality m
"""
from __future__ import annotations

import pathlib
import sys

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import BG, DROP, FACTOR, GOLD, GROW, INK, MUTED, NEW, OLD, PctSlide


def compact_salary_table() -> VGroup:
    """Return the question's year table as a compact, reusable side panel."""
    panel = RoundedRectangle(
        width=3.75,
        height=3.85,
        corner_radius=0.18,
        stroke_color=FACTOR,
        stroke_width=2,
        fill_color=FACTOR,
        fill_opacity=0.08,
    )
    heading = Tex("Question table", color=GOLD, font_size=24).move_to([0, 1.45, 0])
    rule = Line([-1.68, 1.05, 0], [1.68, 1.05, 0], color=MUTED, stroke_width=2)
    divider = Line([-0.8, -1.42, 0], [-0.8, 1.05, 0], color=MUTED, stroke_width=2)
    years = VGroup(
        Tex("2018", color=OLD, font_size=25),
        Tex("2019", color=INK, font_size=25),
        Tex("2020", color=NEW, font_size=25),
    ).arrange(DOWN, buff=0.37).move_to([-1.22, -0.27, 0])
    values = VGroup(
        MathTex("x", color=OLD, font_size=30),
        MathTex(r"x(1.04)", color=GROW, font_size=27),
        MathTex(r"x(1.04)(1.035)=13\,455", color=NEW, font_size=20),
    ).arrange(DOWN, buff=0.42, aligned_edge=LEFT).move_to([0.63, -0.27, 0])
    return VGroup(panel, heading, rule, divider, years, values).move_to([-4.25, -0.45, 0])


class SalaryCheckpoint(PctSlide):
    """A beginner-friendly reverse percentage-change worked example."""

    def construct(self):
        self.camera.background_color = BG
        self.title_bar("Checkpoint 2: Work Backwards")
        self.next_slide()

        # Concept page: reversing a change means dividing by its factor.
        heading = Tex("When the final value is known, work backwards.", color=GOLD, font_size=42)
        heading.move_to([0, 1.15, 0])
        forward = MathTex(
            r"\text{increase by }r\% \quad \longrightarrow \quad \times(1+r\%)",
            font_size=42,
        ).move_to([0, 0.05, 0])
        forward.set_color_by_tex(r"\times", GROW)
        backward = MathTex(
            r"\text{work backwards} \quad \longrightarrow \quad \div(1+r\%)",
            font_size=42,
        ).move_to([0, -1.1, 0])
        backward.set_color_by_tex(r"\div", NEW)
        note = Tex(
            "Undo each percentage change in reverse order.",
            color=MUTED,
            font_size=32,
        ).move_to([0, -2.2, 0])

        self.play(FadeIn(heading, shift=DOWN * 0.15))
        self.play(Write(forward))
        self.play(Write(backward))
        self.play(FadeIn(note))
        self.next_slide()
        self.play(FadeOut(VGroup(heading, forward, backward, note)))

        # Case page: reproduce the checkpoint in a simple, readable table.
        case_1 = Tex(
            r"Tony's monthly salary increased by $4\%$ in 2019",
            color=GROW,
            font_size=44,
        ).move_to([0, 1.45, 0])
        case_2 = Tex(
            r"and by $3.5\%$ in 2020.",
            color=GROW,
            font_size=44,
        ).next_to(case_1, DOWN, buff=0.28)
        case_3 = Tex(
            r"His salary in 2020 was $\$13\,455$. Find his salary in 2018.",
            color=INK,
            font_size=40,
        ).next_to(case_2, DOWN, buff=0.4)

        years = VGroup(
            Tex("2018", color=OLD, font_size=38),
            Tex("2019", color=INK, font_size=38),
            Tex("2020", color=NEW, font_size=38),
        ).arrange(DOWN, buff=0.34)
        values = VGroup(
            MathTex("x", color=OLD, font_size=46),
            MathTex(r"x(1+4\%)", color=GROW, font_size=40),
            MathTex(r"x(1+4\%)(1+3.5\%)=13\,455", color=NEW, font_size=36),
        ).arrange(DOWN, buff=0.36, aligned_edge=LEFT)
        years.move_to([-4.35, -1.35, 0])
        values.move_to([1.25, -1.35, 0])
        divider = Line([-3.0, -2.45, 0], [-3.0, -0.2, 0], color=MUTED)
        table_rule = Line([-5.6, -0.25, 0], [5.8, -0.25, 0], color=MUTED)

        self.play(FadeIn(case_1, shift=DOWN * 0.12), FadeIn(case_2, shift=DOWN * 0.12))
        self.play(FadeIn(case_3, shift=DOWN * 0.12))
        self.play(Create(divider), Create(table_rule), FadeIn(years), FadeIn(values))
        self.next_slide()
        self.play(FadeOut(VGroup(case_1, case_2, case_3, years, values, divider, table_rule)))

        # Persistent question + table for all calculation slides.
        prompt_a = Tex(
            r"Question: 2018 salary $=x$; then $+4\%$, then $+3.5\%$.",
            color=INK,
            font_size=32,
        )
        prompt_a.set_color_by_tex("x", OLD)
        prompt_a.set_color_by_tex("+4", GROW)
        prompt_a.set_color_by_tex("+3.5", GROW)
        prompt_b = Tex(
            r"2020 salary $=\$13\,455$. Find the 2018 salary.",
            color=GOLD,
            font_size=32,
        )
        prompt_b.set_color_by_tex("13", NEW)
        prompt = VGroup(prompt_a, prompt_b).arrange(DOWN, buff=0.14).to_edge(UP, buff=1.55)
        table = compact_salary_table()

        step_1 = Tex("Step 1: undo the latest increase first.", color=GOLD, font_size=36)
        step_1.move_to([2.0, 0.55, 0])
        factor_1 = MathTex(r"1+3.5\%=1.035", color=GROW, font_size=46).move_to([2.0, -0.15, 0])
        working_1 = MathTex(r"13\,455 \div 1.035 = 13\,000", font_size=52).move_to([2.0, -1.1, 0])
        working_1.set_color_by_tex("13", NEW)
        working_1.set_color_by_tex("1.035", FACTOR)
        working_1.set_color_by_tex("000", OLD)
        result_1 = Tex("So the 2019 salary was $13 000$.", color=MUTED, font_size=32)
        result_1.move_to([2.0, -2.15, 0])

        self.play(FadeIn(prompt, shift=DOWN * 0.1), FadeIn(table))
        self.play(Write(step_1))
        self.play(Write(factor_1))
        self.play(Write(working_1))
        self.play(FadeIn(result_1))
        self.next_slide()

        # Keep prompt + table; compact step 1 into a carried line, then step 2.
        carried = MathTex(r"13\,455 \div 1.035 = 13\,000", font_size=34)
        carried.set_color_by_tex("13", NEW)
        carried.set_color_by_tex("1.035", FACTOR)
        carried.move_to([2.0, 0.55, 0])
        step_2 = Tex(r"Step 2: undo the earlier 4\% increase.", color=GOLD, font_size=36)
        step_2.move_to([2.0, -0.15, 0])
        factor_2 = MathTex(r"1+4\%=1.04", color=GROW, font_size=46).move_to([2.0, -0.8, 0])
        working_2 = MathTex(r"13\,000 \div 1.04 = 12\,500", font_size=52).move_to([2.0, -1.75, 0])
        working_2.set_color_by_tex("13", NEW)
        working_2.set_color_by_tex("1.04", FACTOR)
        working_2.set_color_by_tex("500", OLD)

        self.play(
            FadeOut(VGroup(step_1, factor_1, result_1)),
            ReplacementTransform(working_1, carried),
        )
        self.play(Write(step_2))
        self.play(Write(factor_2))
        self.play(Write(working_2))
        self.next_slide()

        # Keep prompt + table; replace step working with the full reverse answer.
        reverse = MathTex(
            r"x=13\,455 \div 1.035 \div 1.04=12\,500",
            font_size=43,
        ).move_to([2.0, -0.05, 0])
        reverse.set_color_by_tex("13", NEW)
        reverse.set_color_by_tex("1.035", FACTOR)
        reverse.set_color_by_tex("1.04", FACTOR)
        reverse.set_color_by_tex("500", OLD)
        check = MathTex(
            r"12\,500 \times 1.04 \times 1.035=13\,455",
            font_size=31,
            color=MUTED,
        ).move_to([2.0, -1.05, 0])
        answer_label = Tex("Tony's monthly salary in 2018 was", color=MUTED, font_size=28)
        answer_label.move_to([2.0, -1.75, 0])
        answer = MathTex(r"\boxed{\$12\,500}", color=GROW, font_size=58).move_to([2.0, -2.5, 0])

        self.play(FadeOut(VGroup(carried, step_2, factor_2, working_2)))
        self.play(Write(reverse))
        self.play(FadeIn(check))
        self.play(FadeIn(answer_label))
        self.play(Write(answer))
        self.next_slide()
        self.play(FadeOut(VGroup(
            prompt, table, reverse, check, answer_label, answer
        )))

        # Final page: recall the basic percentage-change formula (as on the sheet).
        recall = Tex("Recall:", color=INK, font_size=40).move_to([-5.0, 1.45, 0])
        formula = MathTex(
            r"\text{Percentage change}"
            r"=\dfrac{\text{new}-\text{old}}{\text{old}}\times 100\%",
            font_size=44,
        ).move_to([0, 0.25, 0])
        formula.set_color_by_tex(r"\text{Percentage change}", INK)
        formula.set_color_by_tex(r"\text{new}", NEW)
        formula.set_color_by_tex(r"\text{old}", OLD)
        ex = Tex(
            r"Example: old $=\$12\,500$, new $=\$13\,455$",
            color=MUTED,
            font_size=30,
        ).move_to([0, -1.2, 0])
        ex_calc = MathTex(
            r"\dfrac{13\,455-12\,500}{12\,500}\times 100\%"
            r"=7.64\%",
            font_size=36,
        ).move_to([0, -2.1, 0])
        ex_calc.set_color_by_tex("13", NEW)
        ex_calc.set_color_by_tex("12", OLD)
        ex_calc.set_color_by_tex("7.64", GROW)
        content = VGroup(recall, formula, ex, ex_calc)
        frame = SurroundingRectangle(
            content,
            buff=0.45,
            color=DROP,
            stroke_width=3,
        )

        self.play(Create(frame), FadeIn(recall, shift=DOWN * 0.1))
        self.play(Write(formula))
        self.play(FadeIn(ex))
        self.play(Write(ex_calc))
        self.next_slide()
