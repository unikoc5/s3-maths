"""Work backwards: stamp value n years ago under repeated % increase.

Render from dashboard/:
    .\\render.ps1 -SceneFile manim\\percentage\\stamp_checkpoint.py `
        -SceneName StampCheckpoint -Deck percentage\\stamp-checkpoint -Quality m
"""
from __future__ import annotations

import pathlib
import sys

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from pct_common import BG, FACTOR, GOLD, GROW, INK, MUTED, NEW, OLD, PctSlide


class StampCheckpoint(PctSlide):
    """Find a past value when the same % increase applies each year."""

    def construct(self):
        self.camera.background_color = BG
        # In-video title (chip button name is separate in the dashboard HTML).
        self.title_bar("Work backwards")

        # Slide 1: concept
        heading = Tex(
            r"Known final value + same \% each year $\Rightarrow$ work backwards.",
            color=GOLD,
            font_size=36,
        ).move_to([0, 1.15, 0])
        forward = MathTex(
            r"\text{after }n\text{ years:} \quad x(1+r\%)^n",
            font_size=46,
        ).move_to([0, 0.15, 0])
        forward.set_color_by_tex("x", OLD)
        forward.set_color_by_tex("r", GROW)
        forward.set_color_by_tex("n", GOLD)
        backward = MathTex(
            r"x=\dfrac{\text{final}}{(1+r\%)^n}",
            font_size=48,
        ).move_to([0, -1.05, 0])
        backward.set_color_by_tex("x", OLD)
        backward.set_color_by_tex("final", NEW)
        backward.set_color_by_tex("r", GROW)
        note = Tex(
            r"Let $x$ be the value $n$ years ago, then solve.",
            color=MUTED,
            font_size=34,
        ).move_to([0, -2.15, 0])

        self.play(FadeIn(heading, shift=DOWN * 0.15))
        self.play(Write(forward))
        self.play(Write(backward))
        self.play(FadeIn(note))
        self.next_slide()

        # Slide 2: question (finish setup before next_slide — avoid black open).
        self.play(FadeOut(VGroup(heading, forward, backward, note)))
        q1 = Tex(
            r"A stamp is worth $\$450$ this year.",
            color=NEW,
            font_size=44,
        ).move_to([0, 1.15, 0])
        q2 = Tex(
            r"Its value increases at $15\%$ every year.",
            color=GROW,
            font_size=44,
        ).next_to(q1, DOWN, buff=0.4)
        q3 = Tex(
            r"Find the value $x$ of the stamp 3 years ago.",
            color=GOLD,
            font_size=44,
        ).move_to([0, -1.35, 0])

        self.play(FadeIn(q1, shift=DOWN * 0.12))
        self.play(FadeIn(q2, shift=DOWN * 0.12))
        self.play(Write(q3))
        self.play(FadeOut(VGroup(q1, q2, q3)))

        prompt_a = Tex(
            r"Question: stamp $=\$450$ this year; $+15\%$ each year.",
            color=INK,
            font_size=30,
        )
        prompt_a.set_color_by_tex("450", NEW)
        prompt_a.set_color_by_tex("+15", GROW)
        prompt_b = Tex(
            r"Find the value $x$ of the stamp 3 years ago.",
            color=GOLD,
            font_size=30,
        )
        prompt_b.set_color_by_tex("x", OLD)
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
        p2019 = place_price(MathTex(r"x", color=OLD, font_size=40), 0.6)

        self.play(FadeIn(prompt, shift=DOWN * 0.1), FadeIn(table_shell))
        self.play(FadeIn(y2019, shift=RIGHT * 0.08), FadeIn(p2019, shift=RIGHT * 0.08))
        self.next_slide()

        # Rows: only ADD — title / prompt / table stay put.
        y2020 = place_year("2020", 0.0)
        p2020 = place_price(MathTex(r"x(1+15\%)", color=GROW, font_size=36), 0.0)
        self.play(FadeIn(y2020, shift=RIGHT * 0.08), FadeIn(p2020, shift=RIGHT * 0.08))
        self.next_slide()

        y2021 = place_year("2021", -0.6)
        p2021 = place_price(MathTex(r"x(1+15\%)^2", color=GROW, font_size=36), -0.6)
        self.play(FadeIn(y2021, shift=RIGHT * 0.08), FadeIn(p2021, shift=RIGHT * 0.08))
        self.next_slide()

        y2022 = place_year("2022", -1.2, NEW)
        p2022 = place_price(
            MathTex(r"x(1+15\%)^3=450", color=NEW, font_size=36),
            -1.2,
        )
        self.play(FadeIn(y2022, shift=RIGHT * 0.08), FadeIn(p2022, shift=RIGHT * 0.08))
        self.next_slide()

        # Compact table on the right; algebra steps on the left (worksheet layout).
        compact_panel = RoundedRectangle(
            width=5.6,
            height=4.35,
            corner_radius=0.18,
            stroke_color=FACTOR,
            stroke_width=2,
            fill_color=FACTOR,
            fill_opacity=0.08,
        ).move_to([3.55, -0.35, 0])
        compact_h = Tex("Question table", color=GOLD, font_size=26).move_to([3.55, 1.45, 0])
        compact_rule = Line([1.05, 1.1, 0], [6.05, 1.1, 0], color=MUTED, stroke_width=2)
        c_years = VGroup(
            Tex("2019", color=OLD, font_size=26),
            Tex("2020", color=INK, font_size=26),
            Tex("2021", color=INK, font_size=26),
            Tex("2022", color=NEW, font_size=26),
        ).arrange(DOWN, buff=0.32).move_to([1.45, -0.45, 0], aligned_edge=LEFT)
        c_prices = VGroup(
            MathTex("x", color=OLD, font_size=28),
            MathTex(r"x(1+15\%)", color=GROW, font_size=26),
            MathTex(r"x(1+15\%)^2", color=GROW, font_size=26),
            MathTex(r"x(1+15\%)^3=450", color=NEW, font_size=24),
        ).arrange(DOWN, buff=0.34, aligned_edge=LEFT).move_to([3.15, -0.45, 0], aligned_edge=LEFT)
        compact = VGroup(compact_panel, compact_h, compact_rule, c_years, c_prices)

        let_x = Tex(
            r"Let $x$ be the price 3 years ago.",
            color=OLD,
            font_size=34,
        ).move_to([-3.15, 0.85, 0])
        eq1 = MathTex(r"x(1+15\%)^3=450", font_size=40).move_to([-3.15, 0.05, 0])
        eq1.set_color_by_tex("x", OLD)
        eq1.set_color_by_tex("15", GROW)
        eq1.set_color_by_tex("450", NEW)
        eq2 = MathTex(r"x(1.520875)=450", font_size=40).move_to([-3.15, -0.85, 0])
        eq2.set_color_by_tex("x", OLD)
        eq2.set_color_by_tex("1.520875", FACTOR)
        eq2.set_color_by_tex("450", NEW)
        eq3 = MathTex(r"x=296", color=OLD, font_size=44).move_to([-3.15, -1.75, 0])

        self.play(
            FadeOut(VGroup(
                table_shell, y2019, p2019, y2020, p2020, y2021, p2021, y2022, p2022
            )),
            FadeIn(compact),
        )
        self.play(FadeIn(let_x, shift=DOWN * 0.08))
        self.next_slide()

        self.play(Write(eq1))
        self.next_slide()

        self.play(Write(eq2))
        self.next_slide()

        self.play(Write(eq3))
        self.next_slide()

        # Keep prompt; replace working with boxed answer.
        conclusion = Tex(
            r"The price of the stamp 3 years ago was",
            color=MUTED,
            font_size=34,
        ).move_to([-3.15, -0.35, 0])
        answer = MathTex(r"\boxed{\$296}", color=GROW, font_size=60).move_to(
            [-3.15, -1.55, 0]
        )

        self.play(FadeOut(VGroup(let_x, eq1, eq2, eq3)))
        self.play(FadeIn(conclusion), Write(answer))
        self.next_slide()
