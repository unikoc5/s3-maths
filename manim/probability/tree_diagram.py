"""Probability - Deck 2: tree diagram for tossing a coin twice.

Builds the tree branch by branch, then derives each possible outcome (HH, HT,
TH, TT) from the branch labels, then computes P(exactly 1 head and 1 tail).

Render:
    manim-slides render tree_diagram.py TreeDiagram --quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from prob_common import (  # noqa: E402
    ProbSlide, coin, fraction, BG, INK, MUTED, FAV, TOTAL, HEAD, TAIL, FORMULA_FS,
)


def word(text, color, fs=34):
    return Tex(text, color=color, font_size=fs)


class TreeDiagram(ProbSlide):
    def construct(self):
        self.camera.background_color = BG
        title = Tex(r"Tree diagram", font_size=46, color=TOTAL).to_edge(UP, buff=0.5)
        arrow = MathTex(r"\longrightarrow", color=INK, font_size=40).next_to(title, RIGHT, buff=0.25)
        sub = Tex(r"List out all the possible outcomes", color=INK, font_size=36)
        sub.next_to(arrow, RIGHT, buff=0.25)
        VGroup(title, arrow, sub).center().to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.play(Write(arrow), FadeIn(sub, shift=RIGHT * 0.2))

        # column headers
        h1 = Tex(r"1\textsuperscript{st} Toss", color=MUTED, font_size=32).move_to([-2.3, 2.5, 0])
        h2 = Tex(r"2\textsuperscript{nd} Toss", color=MUTED, font_size=32).move_to([1.6, 2.5, 0])
        h3 = Tex(r"Possible outcome", color=MUTED, font_size=32).move_to([4.85, 2.5, 0])
        self.play(FadeIn(h1), FadeIn(h2), FadeIn(h3))

        # root coin
        root = coin(r"\$", GOLD, r=0.5, fs=30).move_to([-5.6, 0, 0])
        root[2].set_opacity(0)  # blank face
        spin = MathTex(r"\circlearrowright", color=GOLD, font_size=40).move_to(root.get_center())
        self.play(GrowFromCenter(root[0]), GrowFromCenter(root[1]), FadeIn(spin))
        self.next_slide()

        # ── 1st toss ──────────────────────────────────────────────────────
        t1_head = word("Head", HEAD).move_to([-2.3, 1.15, 0])
        t1_tail = word("Tail", TAIL).move_to([-2.3, -1.15, 0])
        l1a = Line(root.get_right(), t1_head.get_left(), color=MUTED, stroke_width=2, buff=0.15)
        l1b = Line(root.get_right(), t1_tail.get_left(), color=MUTED, stroke_width=2, buff=0.15)
        self.play(Create(l1a), Create(l1b))
        self.play(Write(t1_head), Write(t1_tail))
        self.next_slide()

        # ── 2nd toss ──────────────────────────────────────────────────────
        t2 = {
            "HH": word("Head", HEAD).move_to([1.6, 1.7, 0]),
            "HT": word("Tail", TAIL).move_to([1.6, 0.55, 0]),
            "TH": word("Head", HEAD).move_to([1.6, -0.55, 0]),
            "TT": word("Tail", TAIL).move_to([1.6, -1.7, 0]),
        }
        l2 = [
            Line(t1_head.get_right(), t2["HH"].get_left(), color=MUTED, stroke_width=2, buff=0.15),
            Line(t1_head.get_right(), t2["HT"].get_left(), color=MUTED, stroke_width=2, buff=0.15),
            Line(t1_tail.get_right(), t2["TH"].get_left(), color=MUTED, stroke_width=2, buff=0.15),
            Line(t1_tail.get_right(), t2["TT"].get_left(), color=MUTED, stroke_width=2, buff=0.15),
        ]
        self.play(*[Create(x) for x in l2])
        self.play(*[Write(t2[k]) for k in t2])
        self.next_slide()

        # ── possible outcomes (derived from the branch labels) ────────────
        sources = {  # outcome -> (first-toss word, second-toss word)
            "HH": (t1_head, t2["HH"]),
            "HT": (t1_head, t2["HT"]),
            "TH": (t1_tail, t2["TH"]),
            "TT": (t1_tail, t2["TT"]),
        }
        outcomes = {}
        for k, src in sources.items():
            y = t2[k].get_y()
            c0 = HEAD if k[0] == "H" else TAIL
            c1 = HEAD if k[1] == "H" else TAIL
            g0 = MathTex(k[0], color=c0, font_size=44)
            g1 = MathTex(k[1], color=c1, font_size=44)
            grp = VGroup(g0, g1).arrange(RIGHT, buff=0.08).move_to([4.85, y, 0])
            ul = Line(grp.get_left() + LEFT * 0.15, grp.get_right() + RIGHT * 0.15,
                      color=MUTED, stroke_width=2).next_to(grp, DOWN, buff=0.12)
            self.play(TransformFromCopy(src[0], g0), run_time=0.6)
            self.play(TransformFromCopy(src[1], g1), run_time=0.6)
            self.play(Create(ul), run_time=0.3)
            outcomes[k] = VGroup(grp, ul)
        self.next_slide()

        # ── P(exactly 1 head and 1 tail) ──────────────────────────────────
        plhs = MathTex(r"P(\text{exactly 1 head and 1 tail})", "=",
                       font_size=40, color=INK)
        f1 = fraction(MathTex("2", color=FAV, font_size=46),
                      MathTex("4", color=TOTAL, font_size=46))
        eq = MathTex("=", font_size=46, color=INK)
        f2 = fraction(MathTex("1", color=INK, font_size=46),
                      MathTex("2", color=INK, font_size=46))
        calc = VGroup(plhs, f1, eq, f2).arrange(RIGHT, buff=0.28)
        calc.move_to([-0.6, -3.05, 0])

        self.play(Write(plhs))

        # favourable = HT and TH -> highlight only after the question is posed
        boxes = VGroup(*[
            SurroundingRectangle(outcomes[k][0], color=FAV, buff=0.12, stroke_width=3)
            for k in ("HT", "TH")
        ])
        self.play(Create(boxes))
        self.play(TransformFromCopy(boxes, f1[0]))
        self.play(Create(f1[1]), TransformFromCopy(VGroup(*outcomes.values()), f1[2]))
        self.play(Write(eq), Write(f2))
        self.wait(0.3)
        self.next_slide()
