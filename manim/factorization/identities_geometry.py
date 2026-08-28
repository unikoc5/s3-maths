"""Algebraic (expansion) proofs of the three factorization identities.

Scenes (each a Manim-Slides deck)
---------------------------------
  PerfectSquareSum     (a+b)^2 = a^2 + 2ab + b^2   — expand (a+b)(a+b)
  PerfectSquareDiff    (a-b)^2 = a^2 - 2ab + b^2   — expand (a-b)(a-b)
  DifferenceOfSquares  a^2 - b^2 = (a+b)(a-b)      — expand (a+b)(a-b)

Consistent symbol <-> colour mapping lives in ``shared/styles.py``:
  a -> blue   b -> amber   ab -> green   removed -> red.

These scenes replace the earlier geometric (area-model) proofs. Scene class
names are unchanged so ``render.ps1`` still targets the same decks.
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shared.styles import (  # noqa: E402
    BG,
    COL_A,
    COL_AB,
    COL_B,
    COL_REMOVE,
    INK,
)

TCM = {"a": COL_A, "b": COL_B}


def dist_arrows(L1, L2, R1, R2):
    """Four FOIL-style curved arrows: each left term → each right term.

    Order returned: First (L1→R1), Outer (L1→R2), Inner (L2→R1), Last (L2→R2).
    """
    tip = 0.18
    sw = 3.0
    first = CurvedArrow(
        L1.get_top() + 0.06 * UP, R1.get_top() + 0.06 * UP,
        color=COL_A, stroke_width=sw, tip_length=tip, angle=-TAU / 5,
    )
    outer = CurvedArrow(
        L1.get_top() + 0.06 * UP, R2.get_top() + 0.06 * UP,
        color=COL_AB, stroke_width=sw, tip_length=tip, angle=-TAU / 3.2,
    )
    inner = CurvedArrow(
        L2.get_bottom() + 0.06 * DOWN, R1.get_bottom() + 0.06 * DOWN,
        color=COL_AB, stroke_width=sw, tip_length=tip, angle=TAU / 3.2,
    )
    last = CurvedArrow(
        L2.get_bottom() + 0.06 * DOWN, R2.get_bottom() + 0.06 * DOWN,
        color=COL_B, stroke_width=sw, tip_length=tip, angle=TAU / 5,
    )
    return VGroup(first, outer, inner, last)


class _FactorScene(Slide):
    """Shared setup: dark background + a colour-coded title banner."""

    title_tex = ""

    def setup_scene(self):
        self.camera.background_color = BG
        title = MathTex(self.title_tex, tex_to_color_map=TCM).scale(1.0)
        title.to_edge(UP, buff=0.45)
        return title

    def play_dist_arrows(self, L1, L2, R1, R2, note):
        """Animate distributive-law arrows, then pause for next_slide."""
        arrows = dist_arrows(L1, L2, R1, R2)
        note.next_to(VGroup(L1, L2, R1, R2), DOWN, buff=0.85)
        self.play(Create(arrows[0]), Create(arrows[1]))   # from first left term
        self.play(Create(arrows[2]), Create(arrows[3]))   # from second left term
        self.play(FadeIn(note, shift=0.12 * UP))
        return arrows


# ══════════════════════════════════════════════════════════════════════════════
# 1)  (a+b)^2 = a^2 + 2ab + b^2
# ══════════════════════════════════════════════════════════════════════════════
class PerfectSquareSum(_FactorScene):
    title_tex = r"(a+b)^2 = a^2 + 2ab + b^2"

    def construct(self):
        title = self.setup_scene()

        line0 = MathTex(r"(a+b)^2", tex_to_color_map=TCM).scale(1.15)
        # Split product so FOIL arrows can target each factor
        line1 = MathTex(
            r"(a+b)^2", "=",
            "(", "a", "+", "b", ")",
            "(", "a", "+", "b", ")",
            tex_to_color_map=TCM,
        ).scale(1.05)
        # indices: 0=(a+b)^2  1==  2=(  3=a  4=+  5=b  6=)  7=(  8=a  9=+  10=b  11=)
        line2 = MathTex(
            r"(a+b)^2", "=",
            r"a\cdot a", "+", r"a\cdot b", "+", r"b\cdot a", "+", r"b\cdot b",
            tex_to_color_map=TCM,
        ).scale(0.95)
        line3 = MathTex(
            r"(a+b)^2", "=",
            r"a^2", "+", r"ab", "+", r"ba", "+", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.0)
        line4 = MathTex(
            r"(a+b)^2", "=",
            r"a^2", "+", r"2ab", "+", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.1)

        line2[2].set_color(COL_A)
        line2[4].set_color(COL_AB)
        line2[6].set_color(COL_AB)
        line2[8].set_color(COL_B)
        line3[2].set_color(COL_A)
        line3[4].set_color(COL_AB)
        line3[6].set_color(COL_AB)
        line3[8].set_color(COL_B)
        line4[2].set_color(COL_A)
        line4[4].set_color(COL_AB)
        line4[6].set_color(COL_B)

        note_arrows = MathTex(
            r"\text{distributive law: each term }\times\text{ each term}",
            color=INK,
        ).scale(0.52)
        note_arrows.set_opacity(0.8)
        note_dist = MathTex(
            r"\text{write out the four products}",
            color=INK,
        ).scale(0.55)
        note_dist.set_opacity(0.75)
        note_combine = MathTex(
            r"\text{combine like terms: } ab + ba = 2ab",
            color=COL_AB,
        ).scale(0.55)

        # ── STEP: title ──
        self.play(Write(title))
        self.wait(0.25)
        self.next_slide()

        # ── STEP: rewrite as product ──
        line0.move_to(ORIGIN)
        self.play(FadeIn(line0, shift=0.2 * UP))
        self.next_slide()

        line1.move_to(ORIGIN)
        self.play(TransformMatchingTex(line0, line1))
        self.next_slide()

        # ── STEP: distributive-law arrows ──
        arrows = self.play_dist_arrows(
            line1[3], line1[5], line1[8], line1[10], note_arrows,
        )
        self.next_slide()

        # ── STEP: write the four products ──
        line2.move_to(ORIGIN)
        note_dist.next_to(line2, DOWN, buff=0.55)
        self.play(
            FadeOut(arrows), FadeOut(note_arrows),
            TransformMatchingTex(line1, line2),
            FadeIn(note_dist, shift=0.15 * UP),
        )
        self.next_slide()

        # ── STEP: simplify products ──
        line3.move_to(ORIGIN)
        self.play(FadeOut(note_dist), TransformMatchingTex(line2, line3))
        self.next_slide()

        # ── STEP: combine like terms → identity ──
        line4.move_to(ORIGIN)
        note_combine.next_to(line4, DOWN, buff=0.55)
        self.play(TransformMatchingTex(line3, line4), FadeIn(note_combine, shift=0.15 * UP))
        box = SurroundingRectangle(line4, color=COL_AB, buff=0.28)
        self.play(Create(box))
        self.wait(0.35)
        self.next_slide()

        # ── STEP: numeric check a=3, b=2 ──
        self.play(FadeOut(note_combine))
        sub = MathTex("a = ", "3", r",\quad b = ", "2").scale(0.85)
        sub[0].set_color(COL_A)
        sub[1].set_color(COL_A)
        sub[2].set_color(COL_B)
        sub[3].set_color(COL_B)
        line_a = MathTex(
            r"(", "3", "+", "2", ")^2", "=", "3^2", "+", "2(3)(2)", "+", "2^2",
        ).scale(0.78)
        line_b = MathTex("=", "9", "+", "12", "+", "4", "=", "25").scale(0.78)
        line_a[1].set_color(COL_A)
        line_a[3].set_color(COL_B)
        line_a[6].set_color(COL_A)
        line_a[8].set_color(COL_AB)
        line_a[10].set_color(COL_B)
        line_b[1].set_color(COL_A)
        line_b[3].set_color(COL_AB)
        line_b[5].set_color(COL_B)
        numeric = VGroup(sub, line_a, line_b).arrange(DOWN, buff=0.32, aligned_edge=LEFT)
        numeric.next_to(box, DOWN, buff=0.55)
        self.play(FadeIn(sub, shift=0.25 * UP))
        self.play(FadeIn(line_a, shift=0.2 * UP))
        self.play(FadeIn(line_b, shift=0.2 * UP))
        self.wait(0.4)
        self.next_slide()


# ══════════════════════════════════════════════════════════════════════════════
# 2)  (a-b)^2 = a^2 - 2ab + b^2
# ══════════════════════════════════════════════════════════════════════════════
class PerfectSquareDiff(_FactorScene):
    title_tex = r"(a-b)^2 = a^2 - 2ab + b^2"

    def construct(self):
        title = self.setup_scene()

        line0 = MathTex(r"(a-b)^2", tex_to_color_map=TCM).scale(1.15)
        line1 = MathTex(
            r"(a-b)^2", "=",
            "(", "a", "-", "b", ")",
            "(", "a", "-", "b", ")",
            tex_to_color_map=TCM,
        ).scale(1.05)
        line2 = MathTex(
            r"(a-b)^2", "=",
            r"a\cdot a", "+", r"a\cdot(-b)", "+", r"(-b)\cdot a", "+", r"(-b)\cdot(-b)",
            tex_to_color_map=TCM,
        ).scale(0.82)
        line3 = MathTex(
            r"(a-b)^2", "=",
            r"a^2", "-", r"ab", "-", r"ba", "+", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.0)
        line4 = MathTex(
            r"(a-b)^2", "=",
            r"a^2", "-", r"2ab", "+", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.1)

        line2[2].set_color(COL_A)
        line2[4].set_color(COL_AB)
        line2[6].set_color(COL_AB)
        line2[8].set_color(COL_B)
        line3[2].set_color(COL_A)
        line3[3].set_color(COL_REMOVE)
        line3[4].set_color(COL_AB)
        line3[5].set_color(COL_REMOVE)
        line3[6].set_color(COL_AB)
        line3[8].set_color(COL_B)
        line4[2].set_color(COL_A)
        line4[3].set_color(COL_REMOVE)
        line4[4].set_color(COL_AB)
        line4[6].set_color(COL_B)

        note_arrows = MathTex(
            r"\text{distributive law: each term }\times\text{ each term}",
            color=INK,
        ).scale(0.52)
        note_arrows.set_opacity(0.8)
        note_dist = MathTex(
            r"\text{distribute, watching the minus signs}",
            color=INK,
        ).scale(0.55)
        note_dist.set_opacity(0.75)
        note_combine = MathTex(
            r"\text{combine like terms: } -ab - ba = -2ab",
            color=COL_AB,
        ).scale(0.55)

        # ── STEP: title ──
        self.play(Write(title))
        self.wait(0.25)
        self.next_slide()

        # ── STEP: rewrite as product ──
        line0.move_to(ORIGIN)
        self.play(FadeIn(line0, shift=0.2 * UP))
        self.next_slide()

        line1.move_to(ORIGIN)
        self.play(TransformMatchingTex(line0, line1))
        self.next_slide()

        # ── STEP: distributive-law arrows ──
        arrows = self.play_dist_arrows(
            line1[3], line1[5], line1[8], line1[10], note_arrows,
        )
        self.next_slide()

        # ── STEP: write the four products ──
        line2.move_to(ORIGIN)
        note_dist.next_to(line2, DOWN, buff=0.55)
        self.play(
            FadeOut(arrows), FadeOut(note_arrows),
            TransformMatchingTex(line1, line2),
            FadeIn(note_dist, shift=0.15 * UP),
        )
        self.next_slide()

        # ── STEP: simplify products / signs ──
        line3.move_to(ORIGIN)
        self.play(FadeOut(note_dist), TransformMatchingTex(line2, line3))
        self.next_slide()

        # ── STEP: combine → identity ──
        line4.move_to(ORIGIN)
        note_combine.next_to(line4, DOWN, buff=0.55)
        self.play(TransformMatchingTex(line3, line4), FadeIn(note_combine, shift=0.15 * UP))
        box = SurroundingRectangle(line4, color=COL_A, buff=0.28)
        self.play(Create(box))
        self.wait(0.35)
        self.next_slide()

        # ── STEP: numeric check a=5, b=2 ──
        self.play(FadeOut(note_combine))
        sub = MathTex("a = ", "5", r",\quad b = ", "2").scale(0.85)
        sub[0].set_color(COL_A)
        sub[1].set_color(COL_A)
        sub[2].set_color(COL_B)
        sub[3].set_color(COL_B)
        line_a = MathTex(
            "(", "5", "-", "2", ")^2", "=", "5^2", "-", "2(5)(2)", "+", "2^2",
        ).scale(0.78)
        line_b = MathTex("=", "25", "-", "20", "+", "4", "=", "9").scale(0.78)
        line_a[1].set_color(COL_A)
        line_a[3].set_color(COL_B)
        line_a[6].set_color(COL_A)
        line_a[7].set_color(COL_REMOVE)
        line_a[8].set_color(COL_AB)
        line_a[10].set_color(COL_B)
        line_b[1].set_color(COL_A)
        line_b[2].set_color(COL_REMOVE)
        line_b[3].set_color(COL_AB)
        line_b[5].set_color(COL_B)
        numeric = VGroup(sub, line_a, line_b).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        numeric.next_to(box, DOWN, buff=0.55)
        self.play(FadeIn(sub, shift=0.25 * UP))
        self.play(FadeIn(line_a, shift=0.2 * UP))
        self.play(FadeIn(line_b, shift=0.2 * UP))
        self.wait(0.4)
        self.next_slide()


# ══════════════════════════════════════════════════════════════════════════════
# 3)  a^2 - b^2 = (a+b)(a-b)
# ══════════════════════════════════════════════════════════════════════════════
class DifferenceOfSquares(_FactorScene):
    title_tex = r"a^2 - b^2 = (a+b)(a-b)"

    def construct(self):
        title = self.setup_scene()

        # Product split for FOIL arrows
        line0 = MathTex(
            "(", "a", "+", "b", ")",
            "(", "a", "-", "b", ")",
            tex_to_color_map=TCM,
        ).scale(1.15)
        # indices: 0=( 1=a 2=+ 3=b 4=) 5=( 6=a 7=- 8=b 9=)
        line1 = MathTex(
            r"(a+b)(a-b)", "=",
            r"a(a-b)", "+", r"b(a-b)",
            tex_to_color_map=TCM,
        ).scale(1.0)
        line2 = MathTex(
            r"(a+b)(a-b)", "=",
            r"a^2", "-", r"ab", "+", r"ba", "-", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.0)
        line3 = MathTex(
            r"(a+b)(a-b)", "=",
            r"a^2", "-", r"ab", "+", r"ab", "-", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.0)
        line4 = MathTex(
            r"(a+b)(a-b)", "=",
            r"a^2", "-", r"b^2",
            tex_to_color_map=TCM,
        ).scale(1.1)
        line5 = MathTex(
            r"a^2", "-", r"b^2", "=",
            r"(a+b)(a-b)",
            tex_to_color_map=TCM,
        ).scale(1.15)

        line1[2].set_color(COL_A)
        line1[4].set_color(COL_B)
        line2[2].set_color(COL_A)
        line2[3].set_color(COL_REMOVE)
        line2[4].set_color(COL_AB)
        line2[6].set_color(COL_AB)
        line2[7].set_color(COL_REMOVE)
        line2[8].set_color(COL_B)
        line3[2].set_color(COL_A)
        line3[3].set_color(COL_REMOVE)
        line3[4].set_color(COL_AB)
        line3[6].set_color(COL_AB)
        line3[7].set_color(COL_REMOVE)
        line3[8].set_color(COL_B)
        line4[2].set_color(COL_A)
        line4[3].set_color(COL_REMOVE)
        line4[4].set_color(COL_B)
        line5[0].set_color(COL_A)
        line5[1].set_color(COL_REMOVE)
        line5[2].set_color(COL_B)

        note_arrows = MathTex(
            r"\text{distributive law: each term }\times\text{ each term}",
            color=INK,
        ).scale(0.52)
        note_arrows.set_opacity(0.8)
        note_dist = MathTex(
            r"\text{expand the product}",
            color=INK,
        ).scale(0.55)
        note_dist.set_opacity(0.75)
        note_cancel = MathTex(
            r"\text{middle terms cancel: } -ab + ab = 0",
            color=COL_AB,
        ).scale(0.55)

        # ── STEP: title ──
        self.play(Write(title))
        self.wait(0.25)
        self.next_slide()

        # ── STEP: start from RHS product ──
        line0.move_to(ORIGIN)
        self.play(FadeIn(line0, shift=0.2 * UP))
        self.next_slide()

        # ── STEP: distributive-law arrows ──
        arrows = self.play_dist_arrows(
            line0[1], line0[3], line0[6], line0[8], note_arrows,
        )
        self.next_slide()

        # ── STEP: distribute ──
        line1.move_to(ORIGIN)
        note_dist.next_to(line1, DOWN, buff=0.55)
        self.play(
            FadeOut(arrows), FadeOut(note_arrows),
            ReplacementTransform(line0, line1),
            FadeIn(note_dist, shift=0.15 * UP),
        )
        self.next_slide()

        # ── STEP: fully expand ──
        line2.move_to(ORIGIN)
        self.play(FadeOut(note_dist), TransformMatchingTex(line1, line2))
        self.next_slide()

        # ── STEP: ba = ab ──
        line3.move_to(ORIGIN)
        self.play(TransformMatchingTex(line2, line3))
        self.next_slide()

        # ── STEP: cancel middle terms ──
        line4.move_to(ORIGIN)
        note_cancel.next_to(line4, DOWN, buff=0.55)
        self.play(TransformMatchingTex(line3, line4), FadeIn(note_cancel, shift=0.15 * UP))
        self.next_slide()

        # ── STEP: rewrite as factorization identity ──
        line5.move_to(ORIGIN)
        self.play(FadeOut(note_cancel), TransformMatchingTex(line4, line5))
        box = SurroundingRectangle(line5, color=COL_A, buff=0.28)
        self.play(Create(box))
        self.wait(0.35)
        self.next_slide()

        # ── STEP: numeric check a=5, b=2 ──
        sub = MathTex("a = ", "5", r",\quad b = ", "2").scale(0.85)
        sub[0].set_color(COL_A)
        sub[1].set_color(COL_A)
        sub[2].set_color(COL_B)
        sub[3].set_color(COL_B)
        line_a = MathTex("5^2", "-", "2^2", "=", "(5+2)(5-2)").scale(0.78)
        line_a[0].set_color(COL_A)
        line_a[1].set_color(COL_REMOVE)
        line_a[2].set_color(COL_B)
        line_a[4][1].set_color(COL_A)
        line_a[4][3].set_color(COL_B)
        line_a[4][6].set_color(COL_A)
        line_a[4][8].set_color(COL_B)
        line_b = MathTex("=", "25", "-", "4", "=", "(7)(3)", "=", "21").scale(0.78)
        line_b[1].set_color(COL_A)
        line_b[2].set_color(COL_REMOVE)
        line_b[3].set_color(COL_B)
        numeric = VGroup(sub, line_a, line_b).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        numeric.next_to(box, DOWN, buff=0.55)
        self.play(FadeIn(sub, shift=0.25 * UP))
        self.play(FadeIn(line_a, shift=0.2 * UP))
        self.play(FadeIn(line_b, shift=0.2 * UP))
        self.wait(0.4)
        self.next_slide()
