"""Repeated increase: compound growth table for a car price.

Render from dashboard/:
    .\\render.ps1 -SceneFile manim\\percentage\\car_checkpoint.py `
        -SceneName CarCheckpoint -Deck percentage\\car-checkpoint -Quality m
"""
from __future__ import annotations

import pathlib
import sys

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import BG, FACTOR, GOLD, GROW, INK, MUTED, NEW, OLD, PctSlide


class CarCheckpoint(PctSlide):
    """Build a year-by-year compound growth table for a car price."""

    def construct(self):
        self.camera.background_color = BG
        # In-video title (chip button name is separate in the dashboard HTML).
        self.title_bar("Repeated increase")

        # Slide 1: title + concept together (no empty title-only page).
        heading = Tex(
            r"Same \% increase each year $\Rightarrow$ multiply again.",
            color=GOLD,
            font_size=40,
        ).move_to([0, 1.05, 0])
        factor = MathTex(r"+2\% \quad \longrightarrow \quad \times(1+2\%)", font_size=52)
        factor.move_to([0, -0.1, 0])
        factor.set_color_by_tex("+2", GROW)
        factor.set_color_by_tex(r"\times", GROW)
        note = Tex(
            r"After $n$ years, multiply by $(1+2\%)$ a total of $n$ times.",
            color=MUTED,
            font_size=34,
        ).move_to([0, -1.4, 0])

        self.play(FadeIn(heading, shift=DOWN * 0.15))
        self.play(Write(factor))
        self.play(FadeIn(note))
        self.next_slide()

        # Slide 2: question, then finish table setup before next_slide so
        # page 3 never opens on a mid-FadeOut black frame.
        self.play(FadeOut(VGroup(heading, factor, note)))
        q1 = Tex(
            r"The price of a car is $\$100\,000$ in 2019.",
            color=OLD,
            font_size=44,
        ).move_to([0, 1.0, 0])
        q2 = Tex(
            r"The price increases steadily by $2\%$ each year.",
            color=GROW,
            font_size=44,
        ).next_to(q1, DOWN, buff=0.4)
        q3 = Tex(
            r"Find its price in 2022.",
            color=GOLD,
            font_size=46,
        ).move_to([0, -1.55, 0])

        self.play(FadeIn(q1, shift=DOWN * 0.12))
        self.play(FadeIn(q2, shift=DOWN * 0.12))
        self.play(Write(q3))
        self.play(FadeOut(VGroup(q1, q2, q3)))

        prompt_a = Tex(
            r"Question: car $=\$100\,000$ in 2019; then $+2\%$ each year.",
            color=INK,
            font_size=30,
        )
        prompt_a.set_color_by_tex("100", OLD)
        prompt_a.set_color_by_tex("+2", GROW)
        prompt_b = Tex(r"Find the price in 2022.", color=GOLD, font_size=30)
        prompt = VGroup(prompt_a, prompt_b).arrange(DOWN, buff=0.1).to_edge(UP, buff=1.28)

        panel = RoundedRectangle(
            width=13.2,
            height=5.05,
            corner_radius=0.2,
            stroke_color=FACTOR,
            stroke_width=3,
            fill_color=FACTOR,
            fill_opacity=0.08,
        ).move_to([0, -0.45, 0])
        col_year = Tex("Year", color=GOLD, font_size=36).move_to(
            [-5.0, 1.55, 0], aligned_edge=LEFT
        )
        # Build "Price ($)" in parts — bare "\$" inside Tex often disappears.
        col_price = VGroup(
            Tex("Price (", color=GOLD, font_size=36),
            MathTex(r"\$", color=GOLD, font_size=36),
            Tex(")", color=GOLD, font_size=36),
        ).arrange(RIGHT, buff=0.04).move_to([-2.35, 1.55, 0], aligned_edge=LEFT)
        header_rule = Line([-6.3, 1.15, 0], [6.3, 1.15, 0], color=MUTED, stroke_width=2)
        table_shell = VGroup(panel, col_year, col_price, header_rule)

        def place_year(text: str, y_pos: float, color=INK) -> Tex:
            label = Tex(text, color=color, font_size=34)
            label.move_to([-5.0, y_pos, 0], aligned_edge=LEFT)
            return label

        def place_price(mob: Mobject, y_pos: float) -> Mobject:
            mob.move_to([-2.35, y_pos, 0], aligned_edge=LEFT)
            return mob

        y2019 = place_year("2019", 0.6, OLD)
        p2019 = place_price(MathTex(r"100\,000", color=OLD, font_size=36), 0.6)

        self.play(FadeIn(prompt, shift=DOWN * 0.1), FadeIn(table_shell))
        self.play(FadeIn(y2019, shift=RIGHT * 0.08), FadeIn(p2019, shift=RIGHT * 0.08))
        self.next_slide()

        # Page 3+: only ADD rows — title / prompt / table stay put.
        y2020 = place_year("2020", 0.0)
        p2020 = place_price(MathTex(r"100\,000(1+2\%)", color=GROW, font_size=34), 0.0)
        self.play(FadeIn(y2020, shift=RIGHT * 0.08), FadeIn(p2020, shift=RIGHT * 0.08))
        self.next_slide()

        y2021 = place_year("2021", -0.6)
        p2021_a = place_price(
            MathTex(r"100\,000(1+2\%)(1+2\%)", color=GROW, font_size=32),
            -0.6,
        )
        self.play(FadeIn(y2021, shift=RIGHT * 0.08), FadeIn(p2021_a, shift=RIGHT * 0.08))
        self.next_slide()

        p2021_b = place_price(
            MathTex(r"100\,000(1+2\%)^2", color=NEW, font_size=36),
            -0.6,
        )
        self.play(ReplacementTransform(p2021_a, p2021_b))
        self.next_slide()

        y2022 = place_year("2022", -1.2, NEW)
        p2022_a = place_price(
            MathTex(r"100\,000(1+2\%)(1+2\%)(1+2\%)", color=GROW, font_size=30),
            -1.2,
        )
        self.play(FadeIn(y2022, shift=RIGHT * 0.08), FadeIn(p2022_a, shift=RIGHT * 0.08))
        self.next_slide()

        p2022_b = place_price(
            MathTex(r"100\,000(1+2\%)^3", color=NEW, font_size=36),
            -1.2,
        )
        self.play(ReplacementTransform(p2022_a, p2022_b))
        self.next_slide()

        summary = MathTex(
            r"\text{After }n\text{ years: }100\,000(1+2\%)^n",
            font_size=34,
        ).move_to([0, -2.0, 0])
        summary.set_color_by_tex("100", OLD)
        summary.set_color_by_tex("2", GROW)
        summary.set_color_by_tex("n", GOLD)
        n_note = Tex(
            r"$n=$ number of yearly increases (calculation periods)",
            color=MUTED,
            font_size=26,
        ).next_to(summary, DOWN, buff=0.12)

        self.play(Write(summary))
        self.play(FadeIn(n_note))
        self.next_slide()

        self.play(FadeOut(VGroup(
            prompt,
            table_shell,
            y2019,
            p2019,
            y2020,
            p2020,
            y2021,
            p2021_b,
            y2022,
            p2022_b,
            summary,
            n_note,
        )))
        recall = Tex(r"For 2022, $n=3$ years after 2019:", color=GOLD, font_size=38)
        recall.move_to([0, 1.0, 0])
        calc = MathTex(
            r"100\,000(1+2\%)^3 = 100\,000 \times 1.02^3 = 106\,120.8",
            font_size=38,
        ).move_to([0, -0.1, 0])
        calc.set_color_by_tex("100", OLD)
        calc.set_color_by_tex("1.02", GROW)
        calc.set_color_by_tex("106", NEW)
        answer = MathTex(r"\boxed{\$106\,120.80}", color=GROW, font_size=56).move_to(
            [0, -1.6, 0]
        )

        self.play(FadeIn(recall, shift=DOWN * 0.1))
        self.play(Write(calc))
        self.play(Write(answer))
        self.next_slide()
