"""Shared helpers for inequality worked-solution Manim scenes."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from manim import *  # noqa: F401,F403
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ineq_common import (  # noqa: E402
    BG, INK, MUTED, GREEN, VIOLET, AMBER, BLUE, RED, GOLD,
)
from step_utils import normalize_steps, clean as clean_step_tex  # noqa: E402

REL_COL = {
    r"\le": BLUE, r"\ge": VIOLET, r"<": AMBER, r">": GREEN,
    r"\leq": BLUE, r"\geq": VIOLET,
}
FLIP_RE = re.compile(r"\\text\{flip\}|flip", re.I)
SIGN_RE = re.compile(r"(\\le|\\ge|\\leq|\\geq|[<>])")

def sign_color(tex: str) -> ManimColor:
    for sym, col in REL_COL.items():
        if sym in tex:
            return col
    return INK


def title_tex(label: str) -> MathTex:
    safe = label.replace("&", r"\&")
    return MathTex(r"\text{" + safe + r"}", color=INK).scale(0.95).to_edge(UP, buff=0.48)


def _rel_index(parts) -> int | None:
    for i, p in enumerate(parts):
        s = p.get_tex_string() if hasattr(p, "get_tex_string") else str(p)
        if SIGN_RE.search(s):
            return i
    return None


def _place_sign(eq: Mobject, sign_x: float, y: float | None = None):
    idx = _rel_index(eq.submobjects) if isinstance(eq, MathTex) else None
    if idx is None:
        eq.move_to([0, y if y is not None else eq.get_center()[1], 0])
        return
    eq.move_to([0, y if y is not None else eq.get_center()[1], 0])
    eq.shift(RIGHT * (sign_x - eq[idx].get_center()[0]))


def play_ineq_chain(scene, q: dict, *, scale: float = 0.82, buff: float = 0.42):
    """Reveal one slide per line in ``steps_latex``; signs aligned vertically."""
    scene.camera.background_color = BG
    num = q.get("number", "")
    label = f"Q{num}" if not str(num).startswith("Q") else str(num)
    head = title_tex(f"{label}: Solve")
    scene.play(Write(head))

    steps = normalize_steps(q)

    sign_x = None
    mobs: list[Mobject] = []
    flip_indices = {i for i, s in enumerate(steps) if FLIP_RE.search(s)}
    last_i = len(steps) - 1

    for i, raw_tex in enumerate(steps):
        tex = clean_step_tex(raw_tex)
        eq = MathTex(tex, color=INK).scale(scale)
        if i == 0:
            eq.next_to(head, DOWN, buff=0.55)
            _place_sign(eq, 0)
            sign_x = _rel_index(eq.submobjects)
            if sign_x is not None:
                sign_x = eq[sign_x].get_center()[0]
            else:
                sign_x = 0.0
        else:
            eq.next_to(mobs[-1], DOWN, buff=buff)
            _place_sign(eq, sign_x)

        if i in flip_indices:
            for j, part in enumerate(eq.submobjects):
                s = part.get_tex_string() if hasattr(part, "get_tex_string") else ""
                if "flip" in s.lower():
                    part.set_color(RED)
                elif SIGN_RE.search(s):
                    part.set_color(RED)
        if i == last_i:
            col = sign_color(tex)
            for part in eq.submobjects:
                s = part.get_tex_string() if hasattr(part, "get_tex_string") else ""
                if SIGN_RE.search(s):
                    part.set_color(col)

        scene.play(FadeIn(eq, shift=0.12 * UP))
        mobs.append(eq)
        if i == last_i:
            box = SurroundingRectangle(eq, color=sign_color(tex), buff=0.14, corner_radius=0.08)
            scene.play(Create(box))
        scene.next_slide()

    if not steps:
        prompt = q.get("prompt_latex", "").strip()
        prob = MathTex(prompt, color=INK).scale(scale).next_to(head, DOWN, buff=0.55)
        scene.play(Write(prob))
        scene.next_slide()


class IneqWorkedScene(Slide):
    """Parametric worked solution — set ``Q`` dict before rendering."""

    Q: dict = {}

    def __str__(self):
        return str(self.Q.get("deck_id") or self.Q.get("id") or "IneqWorked")

    def construct(self):
        play_ineq_chain(self, self.Q)
