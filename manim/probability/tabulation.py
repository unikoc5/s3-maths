"""Probability - Deck 3: tabulation for tossing a coin twice (same example).

A 2x2 table whose rows are the 1st toss (H/T) and columns the 2nd toss (H/T).
Each cell's outcome is derived from its row + column header, then all four
outcomes are listed out.

Render:
    manim-slides render tabulation.py Tabulation --quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from prob_common import (  # noqa: E402
    ProbSlide, BG, INK, MUTED, HEAD, TAIL, FAV, TOTAL, fraction,
)

TEAL = ManimColor("#26A69A")
GRID = ManimColor("#5B7A99")
ROWFILL = ManimColor("#1f3147")


def glyph(ch, fs=40):
    return MathTex(ch, color=(HEAD if ch == "H" else TAIL), font_size=fs)


class Tabulation(ProbSlide):
    def construct(self):
        self.camera.background_color = BG

        title = Tex(r"Tabulation", font_size=46, color=TEAL).to_edge(UP, buff=0.5)
        arrow = MathTex(r"\longrightarrow", color=INK, font_size=40).next_to(title, RIGHT, buff=0.25)
        sub = Tex(r"List out all the possible outcomes", color=INK, font_size=36)
        sub.next_to(arrow, RIGHT, buff=0.25)
        VGroup(title, arrow, sub).center().to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.play(Write(arrow), FadeIn(sub, shift=RIGHT * 0.2))

        # ── table geometry ────────────────────────────────────────────────
        col_x = [-2.0, -0.3, 1.4]      # corner, 2nd-toss H, 2nd-toss T
        row_y = [1.3, 0.2, -0.9]       # header row, 1st-toss H, 1st-toss T
        vx = [-2.85, -1.15, 0.55, 2.25]
        hy = [1.85, 0.75, -0.35, -1.45]

        grid = VGroup()
        for x in vx:
            grid.add(Line([x, hy[0], 0], [x, hy[-1], 0], color=GRID, stroke_width=2))
        for y in hy:
            grid.add(Line([vx[0], y, 0], [vx[-1], y, 0], color=GRID, stroke_width=2))

        # faint shading for the header row & column
        hdr_row = Rectangle(width=vx[-1] - vx[1], height=hy[0] - hy[1],
                            color=ROWFILL, fill_color=ROWFILL, fill_opacity=0.7, stroke_width=0)
        hdr_row.move_to([(vx[1] + vx[-1]) / 2, (hy[0] + hy[1]) / 2, 0])
        hdr_col = Rectangle(width=vx[1] - vx[0], height=hy[1] - hy[-1],
                            color=ROWFILL, fill_color=ROWFILL, fill_opacity=0.7, stroke_width=0)
        hdr_col.move_to([(vx[0] + vx[1]) / 2, (hy[1] + hy[-1]) / 2, 0])

        # corner cell labels with a diagonal divider
        diag = Line([vx[0], hy[0], 0], [vx[1], hy[1], 0], color=GRID, stroke_width=1.5)
        c_2nd = Tex(r"2\textsuperscript{nd} toss", color=MUTED, font_size=20).move_to([col_x[0] + 0.42, row_y[0] + 0.22, 0])
        c_1st = Tex(r"1\textsuperscript{st} toss", color=MUTED, font_size=20).move_to([col_x[0] - 0.42, row_y[0] - 0.22, 0])

        self.play(FadeIn(hdr_row), FadeIn(hdr_col), Create(grid))
        self.play(Create(diag), FadeIn(c_2nd), FadeIn(c_1st))

        # headers
        hH = glyph("H").move_to([col_x[1], row_y[0], 0])   # 2nd toss H
        hT = glyph("T").move_to([col_x[2], row_y[0], 0])   # 2nd toss T
        rH = glyph("H").move_to([col_x[0], row_y[1], 0])   # 1st toss H
        rT = glyph("T").move_to([col_x[0], row_y[2], 0])   # 1st toss T
        self.play(Write(hH), Write(hT), Write(rH), Write(rT))
        self.next_slide()

        # ── cells derived from row (1st) + column (2nd) headers ────────────
        # cell = first toss (row) letter + second toss (column) letter
        spec = {
            "HH": (rH, hH, col_x[1], row_y[1]),
            "HT": (rH, hT, col_x[2], row_y[1]),
            "TH": (rT, hH, col_x[1], row_y[2]),
            "TT": (rT, hT, col_x[2], row_y[2]),
        }
        cells = {}
        for k, (rsrc, csrc, x, y) in spec.items():
            g0 = glyph(k[0], fs=38)
            g1 = glyph(k[1], fs=38)
            grp = VGroup(g0, g1).arrange(RIGHT, buff=0.06).move_to([x, y, 0])
            self.play(TransformFromCopy(rsrc, g0), run_time=0.55)
            self.play(TransformFromCopy(csrc, g1), run_time=0.55)
            cells[k] = grp
        self.next_slide()

        # ── list out the outcomes ─────────────────────────────────────────
        label = Tex(r"Possible outcomes ", "=", color=INK, font_size=38)
        items = VGroup()
        for k in ("HH", "HT", "TH", "TT"):
            o0 = glyph(k[0], fs=38)
            o1 = glyph(k[1], fs=38)
            items.add(VGroup(o0, o1).arrange(RIGHT, buff=0.05))
        items.arrange(RIGHT, buff=0.5)
        commas = VGroup()
        line = VGroup(label, items).arrange(RIGHT, buff=0.3).move_to([-0.3, -2.55, 0])

        self.play(Write(label))
        order = ["HH", "HT", "TH", "TT"]
        for i, k in enumerate(order):
            self.play(TransformFromCopy(cells[k], items[i]), run_time=0.55)
            if i < 3:
                comma = Tex(",", color=INK, font_size=38).next_to(items[i], RIGHT, buff=0.08).align_to(items[i], DOWN)
                commas.add(comma)
                self.play(FadeIn(comma), run_time=0.15)
        self.wait(0.3)
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
        calc.move_to([-0.6, -3.55, 0])

        self.play(Write(plhs))

        boxes = VGroup(*[
            SurroundingRectangle(cells[k], color=FAV, buff=0.12, stroke_width=3)
            for k in ("HT", "TH")
        ])
        self.play(Create(boxes))
        self.play(TransformFromCopy(boxes, f1[0]))
        self.play(Create(f1[1]), TransformFromCopy(VGroup(*cells.values()), f1[2]))
        self.play(Write(eq), Write(f2))
        self.wait(0.3)
        self.next_slide()
