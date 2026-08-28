"""Shared helpers for worked-solution Manim scenes (factorization)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from manim import *  # noqa: F401,F403
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shared.styles import BG, COL_A, COL_AB, COL_B, COL_REMOVE, INK  # noqa: E402,F401

HL = ManimColor("#C792EA")
HL_Y = ManimColor("#FFD54F")   # DOS / first factor (amber)
HL_B = ManimColor("#4FC3F7")   # cross / second factor (blue)
HL_O = ManimColor("#FF8A65")   # cancelled common factor (orange)
HL_G = ManimColor("#81C784")   # numeric / middle-term highlight (green)

CM_X = {"x": COL_A}
CM_XY = {"x": COL_A, "y": COL_B}

PART_RE = re.compile(
    r"^(\([ab]\)(?:\([ivx]+\))?(?:\\;|\\quad|\s)+)(.*)$"
    r"|^(\\text\{[^}]+\})(.*)$"
)

_EQ_GAP = 0.14


def title_tex(label: str) -> "MathTex":
    safe = label.replace("&", r"\&")
    return MathTex(r"\text{" + safe + r"}", color=INK).scale(1.0).to_edge(UP, buff=0.5)


def head_tex(label: str, color=COL_AB) -> "MathTex":
    return MathTex(r"\text{" + label + r"}", color=color).scale(0.78).to_edge(UP, buff=0.5)


def hint_tex(label: str) -> "MathTex":
    m = MathTex(r"\text{" + label + r"}", color=INK).scale(0.52)
    m.set_opacity(0.7)
    return m


def boxed(mobj, color=COL_AB, buff=0.2):
    return SurroundingRectangle(mobj, color=color, buff=buff)


def html_color(c: ManimColor) -> str:
    return c.to_hex().lstrip("#").upper()


def hc(c: ManimColor, tex: str) -> str:
    """No-op marker — use ``line_colors`` / ``tex_colors`` on SolChainSlide instead."""
    return tex


def _apply_line_styles(m, i: int, scene):
    body = _line_body(m)
    if i in getattr(scene, "line_colors", {}):
        body.set_color(scene.line_colors[i])
    for sub, col in getattr(scene, "tex_colors", {}).get(i, {}).items():
        body.set_color_by_tex(sub, col)


def _part_label_text(prefix: str) -> str:
    s = prefix.replace(r"\;", "").replace(r"\quad", "").strip()
    if s.startswith(r"\text{") and s.endswith("}"):
        return s
    return r"\text{" + s + r"}"


def _parse_line(tex: str):
    if tex.startswith("="):
        return "eq", "", tex[1:]
    m = PART_RE.match(tex)
    if m:
        g = m.group(1) or m.group(3)
        body = m.group(2) if m.group(1) else m.group(4)
        return "part", g, body
    return "body", "", tex


def _body_mob(body: str, cm: dict, scale: float) -> "MathTex":
    if not body:
        return MathTex("", color=INK).scale(scale)
    isolate = sorted(cm.keys(), key=len, reverse=True) if cm else ()
    return MathTex(
        body,
        tex_to_color_map=cm,
        substrings_to_isolate=isolate,
    ).scale(scale)


def _left_col_width(tex: str, scale: float) -> float:
    """Width of the left column entry ('=' or a part label) for one chain line."""
    kind, prefix, _ = _parse_line(tex)
    eq = MathTex("=", color=INK).scale(scale)
    if kind == "part":
        label = MathTex(_part_label_text(prefix), color=INK).scale(scale)
        return max(eq.width, label.width)
    return eq.width


def build_chain_line(tex: str, cm: dict, scale: float) -> "VGroup | MathTex":
    kind, prefix, body = _parse_line(tex)
    if kind == "eq":
        eq = MathTex("=", color=INK).scale(scale)
        b = _body_mob(body, cm, scale)
        b.next_to(eq, RIGHT, buff=_EQ_GAP)
        return VGroup(eq, b)
    if kind == "part":
        label = MathTex(_part_label_text(prefix), color=INK).scale(scale)
        b = _body_mob(body, cm, scale)
        b.next_to(label, RIGHT, buff=_EQ_GAP)
        return VGroup(label, b)
    return _body_mob(body or tex, cm, scale)


def _line_body(m):
    if isinstance(m, VGroup):
        return m[1]
    return m


def _align_left(mob, x: float, y: float | None = None):
    if y is None:
        y = mob.get_center()[1]
    mob.shift(RIGHT * (x - mob.get_left()[0]))
    mob.shift(UP * (y - mob.get_center()[1]))


def _place_at_columns(m, eq_x: float, body_x: float, left_w: float | None = None):
    if isinstance(m, VGroup) and len(m) == 2:
        left, body = m[0], m[1]
        _align_left(left, eq_x)
        min_body = eq_x + (left_w if left_w is not None else left.width) + _EQ_GAP
        _align_left(body, max(body_x, min_body))
    else:
        _align_left(_line_body(m), body_x)


def play_equation_chain(
    scene,
    *,
    title: str,
    lines: list[str],
    cm: dict | None = None,
    box_indices=(),
    note: str | None = None,
    note_color=COL_AB,
    scale: float = 1.0,
    buff: float = 0.5,
    title_buff: float = 0.65,
):
    """Render a vertical chain: part labels & '=' share one column; bodies align right."""
    cm = cm or {}
    scene.camera.background_color = BG
    t = title_tex(title)
    scene.play(Write(t))

    eq_x = None
    body_x = None
    mobs = []
    max_left_w = max(_left_col_width(tex, scale) for tex in lines) if lines else 0

    for i, tex in enumerate(lines):
        m = build_chain_line(tex, cm, scale)
        if i == 0:
            m.next_to(t, DOWN, buff=title_buff)
            m.move_to([0, m.get_center()[1], 0])
            body = _line_body(m)
            body_x = body.get_left()[0]
            eq_x = body_x - _EQ_GAP - max_left_w
            _place_at_columns(m, eq_x, body_x, max_left_w)
        else:
            m.next_to(mobs[-1], DOWN, buff=buff)
            _place_at_columns(m, eq_x, body_x, max_left_w)

        scene.play(FadeIn(m, shift=0.15 * UP))
        _apply_line_styles(m, i, scene)
        mobs.append(m)
        if i in box_indices:
            scene.play(Create(boxed(m, color=COL_AB)))
        scene.wait(0.1)
        scene.next_slide()

    if note:
        n = MathTex(note, color=note_color).scale(0.8)
        n.next_to(mobs[-1], DOWN, buff=0.6)
        if body_x is not None:
            _align_left(n, body_x)
        scene.play(FadeIn(n, shift=0.15 * UP))
        scene.wait(0.1)
        scene.next_slide()


class SolChainSlide(Slide):
    """Base slide: set class attrs then call construct()."""

    title = ""
    cm: dict = {}
    lines: list[str] = []
    box_indices = ()
    line_colors: dict = {}   # line index -> colour for the whole expression body
    tex_colors: dict = {}    # line index -> {tex substring: colour}
    note = None
    note_color = COL_AB
    scale = 1.0
    buff = 0.5
    title_buff = 0.65

    def construct(self):
        play_equation_chain(
            self,
            title=self.title,
            lines=self.lines,
            cm=self.cm,
            box_indices=self.box_indices,
            note=self.note,
            note_color=self.note_color,
            scale=self.scale,
            buff=self.buff,
            title_buff=self.title_buff,
        )
