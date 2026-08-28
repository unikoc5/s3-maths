"""Patch questions.json with expanded step chains."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "manim" / "inequality"))
from step_utils import normalize_steps  # noqa: E402

DATA = HERE.parent / "manim" / "inequality" / "questions.json"


def main():
    with DATA.open(encoding="utf-8") as f:
        data = json.load(f)
    changed = 0
    for q in data["questions"]:
        expanded = normalize_steps(q)
        if expanded != q.get("steps_latex"):
            q["steps_latex"] = expanded
            changed += 1
    with DATA.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"patched {changed}/{len(data['questions'])} questions -> {DATA}")


if __name__ == "__main__":
    main()
