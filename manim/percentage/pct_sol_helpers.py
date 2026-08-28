"""Shared helpers for Percentage worked-solution Manim scenes."""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *  # noqa: F401,F403
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pct_common import BG, DROP, FACTOR, GROW, INK, NEW, OLD  # noqa: E402

HL = FACTOR
HL_Y = NEW
HL_B = OLD
HL_G = GROW
HL_P = DROP

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "factorization"))
from sol_helpers import (  # noqa: E402
    SolChainSlide,
    boxed,
    play_equation_chain,
    title_tex,
)

__all__ = [
    "BG",
    "DROP",
    "FACTOR",
    "GROW",
    "HL",
    "HL_B",
    "HL_G",
    "HL_P",
    "HL_Y",
    "INK",
    "NEW",
    "OLD",
    "SolChainSlide",
    "boxed",
    "play_equation_chain",
    "title_tex",
]
