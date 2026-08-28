r"""Worked-solution base for Area & Volume decks.

The MAIN slide panel stays clean: a centred chain of equations, one navigable
slide per line (mirrors the Factorization quiz_solutions ``_SolBase``). The
labelled diagram and any method break-outs live in the HTML sub-panel of the
Worked-Solutions tab, so the deck itself only has to carry the algebra:

    formula  ->  substitute the numbers  ->  simplify  ->  boxed answer

Each ``self.next_slide()`` is one step; the JS step list maps a step index to a
MAIN slide index (= line index here).

Render (from dashboard/):
    .\render.ps1 -SceneFile manim\area_volume\<file>.py -SceneName <Scene> -Deck area_volume\<deck> -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from av_styles import BG, INK, GOLD, GREEN, BLUE, AMBER  # noqa: E402


def title_tex(s: str) -> Tex:
    t = Tex(s, font_size=46, color=INK).to_edge(UP, buff=0.55)
    accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
    accent.set_width(max(t.width + 0.6, 1.5)).next_to(t, DOWN, buff=0.16)
    return VGroup(t, accent)


def boxed(mob, color=GREEN, buff=0.18):
    return SurroundingRectangle(mob, color=color, buff=buff, corner_radius=0.08,
                                stroke_width=3)


class AVSolution(Slide):
    """A clean, centred chain of equation lines — one slide per line.

    Subclasses set:
        title        : deck heading
        lines        : list of tex strings; line 0 is the problem statement.
                       Lines starting with "=" are left-aligned to the anchor.
        cm           : tex_to_color_map applied to every line
        box_indices  : indices of lines that get a result box
        note         : optional closing tex (e.g. an answer in words)
        scale, buff  : layout tweaks
    """

    title = ""
    lines: list[str] = []
    cm: dict = {}
    box_indices: tuple = ()
    note = None
    note_color = GREEN
    scale = 1.0
    buff = 0.5

    def construct(self):
        self.camera.background_color = BG
        head = title_tex(self.title)

        # ── Build every line first, clamp each to the frame width, then scale
        #    the whole stack so nothing ever spills past the edges of the slide.
        max_w = config.frame_width - 1.4
        mobs = []
        for tex in self.lines:
            if tex.startswith("="):
                mo = MathTex("=", tex[1:], tex_to_color_map=self.cm)
            else:
                mo = MathTex(tex, tex_to_color_map=self.cm)
            mo.scale(self.scale)
            if mo.width > max_w:
                mo.scale(max_w / mo.width)
            mobs.append(mo)

        stack = VGroup(*mobs).arrange(DOWN, aligned_edge=LEFT, buff=self.buff)

        note_mob = None
        if self.note:
            note_mob = Tex(self.note, color=self.note_color, font_size=38)
            if note_mob.width > max_w:
                note_mob.scale(max_w / note_mob.width)
            note_mob.next_to(stack, DOWN, buff=0.5)

        content = VGroup(stack, *( [note_mob] if note_mob is not None else [] ))

        # Fit into the band between the title and the bottom edge.
        avail_top = head.get_bottom()[1] - 0.4
        avail_bottom = -config.frame_height / 2 + 0.45
        avail_h = max(avail_top - avail_bottom, 0.1)
        sf = min(1.0, avail_h / content.height, max_w / content.width)
        if sf < 1.0:
            content.scale(sf)
        content.next_to(head, DOWN, buff=0.4)
        # keep it from creeping past the bottom on the very tallest decks
        if content.get_bottom()[1] < avail_bottom:
            content.shift(UP * (avail_bottom - content.get_bottom()[1]))

        self.play(Write(head[0]), GrowFromCenter(head[1]))
        for i, mo in enumerate(mobs):
            self.play(FadeIn(mo, shift=0.15 * UP))
            if i in self.box_indices:
                self.play(Create(boxed(mo)))
            self.wait(0.1)
            self.next_slide()

        if note_mob is not None:
            self.play(FadeIn(note_mob, shift=0.15 * UP))
            self.wait(0.1)
            self.next_slide()
