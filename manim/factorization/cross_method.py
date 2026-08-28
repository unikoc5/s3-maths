"""Cross method (十字相乘法) bridged to the area / generic-rectangle model.

Scenes
------
  CrossMethodPositive   x^2 + 5x + 6  = (x+2)(x+3)      (leading coeff = 1)
  CrossMethodLeading    2x^2 + 7x + 3 = (2x+1)(x+3)     (leading coeff != 1, box method)

Idea: the "cross" of the cross method = the two OFF-DIAGONAL cells of the area
rectangle; their sum is the middle term. Factorising = recover the rectangle's side
lengths from its area (area conservation). See docs/factorization/CROSS_METHOD.md.

Colour system (consistent with the identity slides):
  x -> blue   added constants -> amber   x-product cells (middle term) -> green
  constant cell -> amber   removed/− -> red   ink -> white   bg -> dark slate
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shared.styles import (  # noqa: E402
    BG,
    COL_A,
    COL_AB,
    COL_B,
    COL_REMOVE,
    FILL_OPACITY,
    INK,
    STROKE,
    THIN_STROKE,
)

COL_X = COL_A      # x  -> blue
COL_NUM = COL_B    # added constants -> amber
COL_MID = COL_AB   # x-product cells (middle term) -> green
COL_CON = COL_B    # constant cell -> amber


def filled_rect(bl, w, h, color, opacity=FILL_OPACITY, stroke=THIN_STROKE):
    r = Rectangle(width=w, height=h, stroke_color=color, stroke_width=stroke,
                  fill_color=color, fill_opacity=opacity)
    r.move_to(np.array(bl, dtype=float) + np.array([w / 2.0, h / 2.0, 0.0]))
    return r


def dim_brace(p_start, p_end, direction, tex, color, buff=0.1, scale=0.8):
    line = Line(np.array(p_start, dtype=float), np.array(p_end, dtype=float))
    br = Brace(line, direction=direction, buff=buff, color=INK)
    lab = br.get_tex(tex)
    lab.set_color(color)
    lab.scale(scale)
    return VGroup(br, lab)


def at(tex, color, center, scale=1.0):
    m = MathTex(tex, color=color).scale(scale)
    m.move_to(np.array(center, dtype=float))
    return m


class _CrossScene(Slide):
    title_tex = ""

    def setup_scene(self):
        self.camera.background_color = BG
        title = MathTex(self.title_tex).scale(1.0).to_edge(UP, buff=0.4)
        return title


# ══════════════════════════════════════════════════════════════════════════════
# 1)  x^2 + 5x + 6 = (x+2)(x+3)
# ══════════════════════════════════════════════════════════════════════════════
class CrossMethodPositive(_CrossScene):
    title_tex = r"x^2 + 5x + 6"

    def construct(self):
        title = self.setup_scene()
        # glyphs: x ^2 + 5 x + 6
        title[0][0].set_color(COL_X)    # x
        title[0][3].set_color(COL_MID)  # 5
        title[0][4].set_color(COL_MID)  # x  (5x green)
        title[0][6].set_color(COL_CON)  # 6  (amber)
        self.play(Write(title))
        self.next_slide()

        # ────────────────────────────────────────────────────────────────────
        #  LEFT: the cross method
        # ────────────────────────────────────────────────────────────────────
        xL, xR = -5.6, -3.4
        yT, yB = 1.5, 0.0
        TL = np.array([xL, yT, 0]);  TR = np.array([xR, yT, 0])
        BL = np.array([xL, yB, 0]);  BR = np.array([xR, yB, 0])

        cm_x1 = at("x", COL_X, TL, 1.1)
        cm_x2 = at("x", COL_X, BL, 1.1)
        cm_n1 = at("+2", COL_NUM, TR, 1.1)
        cm_n2 = at("+3", COL_NUM, BR, 1.1)

        prompt = Tex(r"product $= 6$,\quad sum $= 5$", color=INK).scale(0.62)
        prompt.next_to(VGroup(cm_x1, cm_n2), UP, buff=0.55).shift(0.2 * RIGHT)

        line1 = Line(TL + np.array([0.32, -0.12, 0]), BR + np.array([-0.32, 0.12, 0]),
                     color=COL_MID, stroke_width=2.5)
        line2 = Line(BL + np.array([0.32, 0.12, 0]), TR + np.array([-0.32, -0.12, 0]),
                     color=COL_MID, stroke_width=2.5)

        check = MathTex("3x", "+", "2x", "=", "5x", r"\;\checkmark").scale(0.72)
        check[0].set_color(COL_MID)
        check[2].set_color(COL_MID)
        check[4].set_color(COL_MID)
        check[5].set_color(COL_MID)
        check.next_to(VGroup(cm_x2, cm_n2), DOWN, buff=0.7).shift(0.2 * RIGHT)

        # ── STEP: set up the cross (left column known, find the pair) ──
        self.play(FadeIn(cm_x1), FadeIn(cm_x2), FadeIn(prompt))
        self.next_slide()

        # ── STEP: fill the pair + cross-multiply ──
        self.play(FadeIn(cm_n1, shift=0.2 * LEFT), FadeIn(cm_n2, shift=0.2 * LEFT))
        self.play(Create(line1), Create(line2))
        self.play(FadeIn(check, shift=0.2 * UP))
        self.next_slide()

        # ────────────────────────────────────────────────────────────────────
        #  RIGHT: the area rectangle (generic rectangle)
        # ────────────────────────────────────────────────────────────────────
        x_len, p_len, q_len = 2.0, 1.0, 1.5
        bl = np.array([1.6, -1.9, 0.0])
        W, H = x_len + p_len, x_len + q_len

        c_x2 = filled_rect(bl + np.array([0, q_len, 0]), x_len, x_len, COL_X)          # x^2
        c_px = filled_rect(bl + np.array([x_len, q_len, 0]), p_len, x_len, COL_MID)    # 2x
        c_qx = filled_rect(bl, x_len, q_len, COL_MID)                                  # 3x
        c_c = filled_rect(bl + np.array([x_len, 0, 0]), p_len, q_len, COL_CON)         # 6
        outline = Rectangle(width=W, height=H, stroke_color=INK, stroke_width=STROKE)
        outline.move_to(bl + np.array([W / 2, H / 2, 0]))

        lab_x2 = at("x^2", COL_X, bl + np.array([x_len / 2, q_len + x_len / 2, 0]), 0.9)
        lab_px = at("2x", INK, bl + np.array([x_len + p_len / 2, q_len + x_len / 2, 0]), 0.72)
        lab_qx = at("3x", INK, bl + np.array([x_len / 2, q_len / 2, 0]), 0.72)
        lab_c = at("6", BG, bl + np.array([x_len + p_len / 2, q_len / 2, 0]), 0.72)

        # side labels (the factors)
        br_top_x = dim_brace(bl + np.array([0, H, 0]), bl + np.array([x_len, H, 0]), UP, "x", COL_X)
        br_top_p = dim_brace(bl + np.array([x_len, H, 0]), bl + np.array([W, H, 0]), UP, "+2", COL_NUM)
        br_left_x = dim_brace(bl + np.array([0, H, 0]), bl + np.array([0, q_len, 0]), LEFT, "x", COL_X)
        br_left_q = dim_brace(bl + np.array([0, q_len, 0]), bl, LEFT, "+3", COL_NUM)

        # ── STEP: build the rectangle's diagonal (x^2 and 6) ──
        self.play(Create(outline))
        self.play(FadeIn(c_x2), Write(lab_x2), FadeIn(c_c), Write(lab_c))
        self.play(GrowFromCenter(br_top_x), GrowFromCenter(br_left_x))
        self.next_slide()

        # ── STEP: the cross-products ARE the off-diagonal cells ──
        arrow1 = Arrow(check[0].get_top(), c_qx.get_center(), color=COL_MID,
                       stroke_width=3, max_tip_length_to_length_ratio=0.12, buff=0.15)
        arrow2 = Arrow(check[2].get_top(), c_px.get_center(), color=COL_MID,
                       stroke_width=3, max_tip_length_to_length_ratio=0.12, buff=0.15)
        self.play(GrowArrow(arrow1), GrowArrow(arrow2))
        self.play(FadeIn(c_qx), Write(lab_qx), FadeIn(c_px), Write(lab_px))
        self.play(FadeOut(arrow1), FadeOut(arrow2))
        self.play(GrowFromCenter(br_top_p), GrowFromCenter(br_left_q))
        self.next_slide()

        # ── STEP: read the factors off the sides ──
        result = MathTex("x^2 + 5x + 6", "=", "(x+2)(x+3)").scale(0.95)
        result.to_edge(DOWN, buff=0.45)
        result[2][1].set_color(COL_X)
        result[2][3].set_color(COL_NUM)
        result[2][6].set_color(COL_X)
        result[2][8].set_color(COL_NUM)
        box = SurroundingRectangle(result[2], color=COL_X, buff=0.18)
        self.play(FadeIn(result, shift=0.2 * UP))
        self.play(Create(box))
        self.wait(0.5)
        self.next_slide()


# ══════════════════════════════════════════════════════════════════════════════
# 2)  2x^2 + 7x + 3 = (2x+1)(x+3)   (leading coefficient != 1, box method)
# ══════════════════════════════════════════════════════════════════════════════
class CrossMethodLeading(_CrossScene):
    title_tex = r"2x^2 + 7x + 3"

    def construct(self):
        title = self.setup_scene()
        self.play(Write(title))
        self.next_slide()

        # ── cross method (left) ──
        xL, xR = -5.6, -3.3
        yT, yB = 1.5, 0.0
        TL = np.array([xL, yT, 0]);  TR = np.array([xR, yT, 0])
        BL = np.array([xL, yB, 0]);  BR = np.array([xR, yB, 0])

        cm_x1 = at("2x", COL_X, TL, 1.0)
        cm_x2 = at("x", COL_X, BL, 1.0)
        cm_n1 = at("+1", COL_NUM, TR, 1.0)
        cm_n2 = at("+3", COL_NUM, BR, 1.0)

        prompt = Tex(r"columns: $2x^2$ and $3$", color=INK).scale(0.6)
        prompt.next_to(VGroup(cm_x1, cm_n2), UP, buff=0.55)

        line1 = Line(TL + np.array([0.4, -0.12, 0]), BR + np.array([-0.36, 0.12, 0]),
                     color=COL_MID, stroke_width=2.5)
        line2 = Line(BL + np.array([0.3, 0.12, 0]), TR + np.array([-0.36, -0.12, 0]),
                     color=COL_MID, stroke_width=2.5)

        check = MathTex("6x", "+", "x", "=", "7x", r"\;\checkmark").scale(0.7)
        check[0].set_color(COL_MID)
        check[2].set_color(COL_MID)
        check[4].set_color(COL_MID)
        check[5].set_color(COL_MID)
        check.next_to(VGroup(cm_x2, cm_n2), DOWN, buff=0.7)

        self.play(FadeIn(cm_x1), FadeIn(cm_x2), FadeIn(prompt))
        self.next_slide()

        self.play(FadeIn(cm_n1, shift=0.2 * LEFT), FadeIn(cm_n2, shift=0.2 * LEFT))
        self.play(Create(line1), Create(line2))
        self.play(FadeIn(check, shift=0.2 * UP))
        self.next_slide()

        # ── area rectangle (right) ──
        x2_len, one_len = 2.4, 0.8   # widths: 2x then +1
        x_len, q_len = 1.2, 1.8      # heights: x then +3
        bl = np.array([1.6, -1.9, 0.0])
        W, H = x2_len + one_len, x_len + q_len

        c_ax2 = filled_rect(bl + np.array([0, q_len, 0]), x2_len, x_len, COL_X)        # 2x^2
        c_x = filled_rect(bl + np.array([x2_len, q_len, 0]), one_len, x_len, COL_MID)  # x
        c_6x = filled_rect(bl, x2_len, q_len, COL_MID)                                 # 6x
        c_c = filled_rect(bl + np.array([x2_len, 0, 0]), one_len, q_len, COL_CON)      # 3
        outline = Rectangle(width=W, height=H, stroke_color=INK, stroke_width=STROKE)
        outline.move_to(bl + np.array([W / 2, H / 2, 0]))

        lab_ax2 = at("2x^2", COL_X, bl + np.array([x2_len / 2, q_len + x_len / 2, 0]), 0.8)
        lab_x = at("x", INK, bl + np.array([x2_len + one_len / 2, q_len + x_len / 2, 0]), 0.66)
        lab_6x = at("6x", INK, bl + np.array([x2_len / 2, q_len / 2, 0]), 0.72)
        lab_c = at("3", BG, bl + np.array([x2_len + one_len / 2, q_len / 2, 0]), 0.66)

        br_top_x = dim_brace(bl + np.array([0, H, 0]), bl + np.array([x2_len, H, 0]), UP, "2x", COL_X)
        br_top_1 = dim_brace(bl + np.array([x2_len, H, 0]), bl + np.array([W, H, 0]), UP, "+1", COL_NUM)
        br_left_x = dim_brace(bl + np.array([0, H, 0]), bl + np.array([0, q_len, 0]), LEFT, "x", COL_X)
        br_left_q = dim_brace(bl + np.array([0, q_len, 0]), bl, LEFT, "+3", COL_NUM)

        self.play(Create(outline))
        self.play(FadeIn(c_ax2), Write(lab_ax2), FadeIn(c_c), Write(lab_c))
        self.play(GrowFromCenter(br_top_x), GrowFromCenter(br_left_x))
        self.next_slide()

        arrow1 = Arrow(check[0].get_top(), c_6x.get_center(), color=COL_MID,
                       stroke_width=3, max_tip_length_to_length_ratio=0.12, buff=0.15)
        arrow2 = Arrow(check[2].get_top(), c_x.get_center(), color=COL_MID,
                       stroke_width=3, max_tip_length_to_length_ratio=0.12, buff=0.15)
        self.play(GrowArrow(arrow1), GrowArrow(arrow2))
        self.play(FadeIn(c_6x), Write(lab_6x), FadeIn(c_x), Write(lab_x))
        self.play(FadeOut(arrow1), FadeOut(arrow2))
        self.play(GrowFromCenter(br_top_1), GrowFromCenter(br_left_q))
        self.next_slide()

        result = MathTex("2x^2 + 7x + 3", "=", "(2x+1)(x+3)").scale(0.92)
        result.to_edge(DOWN, buff=0.45)
        box = SurroundingRectangle(result[2], color=COL_X, buff=0.18)
        self.play(FadeIn(result, shift=0.2 * UP))
        self.play(Create(box))
        self.wait(0.5)
        self.next_slide()
