#!/usr/bin/env python3
"""Generate Percentage worked-solution Manim scenes + dashboard JS bank.

Reads topics/03-percentages/questions.json (sibling KOC Math Dashboard project)
and emits:
  dashboard/data/percentage-questions.json
  dashboard/manim/percentage/worked_l04.py … worked_quiz.py
  dashboard/topics/percentage/percentage-worked-data.js
  dashboard/render_pct_worked.ps1
"""
from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_SRC = ROOT.parent.parent / "KOC Math Dashboard" / "topics" / "03-percentages" / "questions.json"
JSON_DST = ROOT / "data" / "percentage-questions.json"
MANIM_DIR = ROOT / "manim" / "percentage"
TOPIC_DIR = ROOT / "topics" / "percentage"
RENDER_PS1 = ROOT / "render_pct_worked.ps1"

SOURCE_META = {
    "L04 Percentages (A)": ("l04", "A", "Pre S3 Maths L04 — Percentage (2025)", False, "worked_l04.py"),
    "L05 Percentages (B)": ("l05", "B", "Pre S3 Maths L05 — Percentage (2025)", False, "worked_l05.py"),
    "L06 Percentages (C)": ("l06", "C", "Pre S3 Maths L06 — Percentage (2025)", False, "worked_l06.py"),
    "L04-06 Quiz": ("quiz", "Qz", "Pre S3 Maths L04–06 — Percentage Quiz (2025)", True, "worked_quiz.py"),
}

TYPE_TITLE = {
    "percentage-change": "Percentage change",
    "reverse-percentage": "Reverse percentage",
    "growth-decay": "Growth & decay",
    "simple-interest": "Simple interest",
    "compound-interest": "Compound interest",
    "tax": "Salaries tax",
}

TAX_BANDS = [
    (50000, "2\\%"),
    (50000, "6\\%"),
    (50000, "10\\%"),
    (50000, "14\\%"),
    (None, "17\\%"),
]


def sanitize_latex(tex: str) -> str:
    """Fix common LaTeX patterns that break Manim MathTex."""
    if not tex:
        return tex
    # Superscripts/subscripts must sit outside \text{...}
    tex = re.sub(r"\\text\{([^}]*)\^(\d+)\}", r"\\text{\1}^{\2}", tex)
    tex = re.sub(r"\\text\{([^}]*)\^(\{[^}]+\})\}", r"\\text{\1}^{\2}", tex)
    tex = re.sub(r"\\text\{([^}]*)_(\w+)\}", r"\\text{\1}_{\2}", tex)
    return tex


def sanitize_question(q: dict) -> dict:
    q = dict(q)
    for key in ("prompt_latex", "answer_latex"):
        if q.get(key):
            q[key] = sanitize_latex(q[key])
    if q.get("steps_latex"):
        q["steps_latex"] = [sanitize_latex(s) for s in q["steps_latex"]]
    return q


def parse_qid(qid: str):
    m = re.match(r"PCT-(L\d+|QZ)-Q(.+)$", qid, re.I)
    if not m:
        raise ValueError(f"Bad id: {qid}")
    lesson = m.group(1).lower()
    num_raw = m.group(2)
    num_slug = re.sub(r"[^a-z0-9]", "", num_raw.lower())
    slug = ("qz" if lesson == "qz" else lesson) + "q" + num_slug + "-solution"
    cls = ("Qz" if lesson == "qz" else lesson.upper()) + "Q" + num_raw + "Solution"
    cls = re.sub(r"[^A-Za-z0-9]", "", cls)
    return lesson, num_raw, slug, cls


def main_num(number: str) -> str:
    m = re.match(r"(\d+)", number)
    return m.group(1) if m else number


def deck_title(prefix: str, number: str) -> str:
    return f"{prefix}:{number}"


def scale_for_lines(lines: list[str]) -> float:
    longest = max((len(x) for x in lines), default=0)
    if longest > 72:
        return 0.78
    if longest > 58:
        return 0.86
    if longest > 44:
        return 0.92
    return 1.0


def chain_figure(params: dict) -> dict | None:
    changes = params.get("changes") or []
    if not changes:
        return None
    orig = params.get("original")
    stages = []
    val = float(orig) if orig is not None else None
    for c in changes:
        sign = "+" if float(c) >= 0 else "-"
        fac = f"(1{sign}{abs(float(c)):g}\\%)"
        if val is not None:
            val *= 1 + float(c) / 100
        stages.append({
            "pct": f"{sign}{abs(float(c)):g}\\%",
            "factor": fac,
            "color": "grow" if float(c) >= 0 else "drop",
            "value": None if val is None else f"{val:g}",
        })
    return {
        "type": "chain",
        "figLabel": "Change factors" if len(changes) >= 2 else "Change factor",
        "data": {
            "original": None if orig is None else f"{float(orig):g}",
            "stages": stages,
            "result": None if params.get("result") is None else f"{float(params['result']):g}",
        },
    }


def tree_figure(params: dict) -> dict | None:
    changes = params.get("changes") or []
    if len(changes) < 2:
        return None
    orig = params.get("original")
    if orig is None:
        return None
    values = [float(orig)]
    for c in changes:
        values.append(values[-1] * (1 + float(c) / 100))
    root: dict = {"t": f"{values[0]:g}", "c": "old", "children": []}
    node = root
    for i, c in enumerate(changes):
        sign = "+" if float(c) >= 0 else "-"
        branch = {
            "t": f"{sign}{abs(float(c)):g}\\%",
            "c": "grow" if float(c) >= 0 else "drop",
            "p": f"{sign}{abs(float(c)):g}\\%",
            "children": [],
        }
        if i == len(changes) - 1:
            branch["out"] = f"{values[i + 1]:g}"
            branch["fav"] = True
        node["children"] = [branch]
        node = branch
    return {
        "type": "tree",
        "figLabel": "Successive changes",
        "data": {
            "root": root,
            "stages": [f"Change {i + 1}" for i in range(len(changes))],
            "favReveal": 99,
        },
    }


def growth_figure(params: dict) -> dict | None:
    p0 = params.get("P0")
    rate = params.get("rate")
    n = params.get("n")
    if p0 is None or rate is None or n is None:
        return None
    direction = params.get("direction", "+")
    sign = "+" if direction == "+" else "-"
    bars = []
    val = float(p0)
    for i in range(int(n) + 1):
        bars.append({
            "label": "Start" if i == 0 else f"Yr {i}",
            "v": round(val, 2),
            "fav": i == int(n),
        })
        if i < int(n):
            val *= 1 + float(rate) / 100 if direction == "+" else 1 - float(rate) / 100
    return {
        "type": "bars",
        "figLabel": "Growth / decay",
        "data": {
            "bars": bars,
            "cap": f"P(1{sign}{float(rate):g}\\%)^{{{int(n)}}}",
        },
    }


def interest_figure(qtype: str, params: dict) -> dict | None:
    p = params.get("P")
    r = params.get("R")
    t = params.get("T") or params.get("t")
    m = params.get("m", 1)
    if qtype == "simple-interest" and p and r and t:
        i = float(p) * float(r) / 100 * float(t)
        return {
            "type": "interest",
            "figLabel": "Simple interest",
            "data": {
                "kind": "simple",
                "P": f"{float(p):g}",
                "R": f"{float(r):g}\\%",
                "T": f"{float(t):g}",
                "I": f"{i:g}",
                "A": f"{float(p) + i:g}",
            },
        }
    if qtype == "compound-interest" and p and r and t:
        amt = float(params.get("A") or 0)
        if not amt:
            rate = float(r) / 100 / float(m)
            amt = float(p) * (1 + rate) ** (float(m) * float(t))
        return {
            "type": "interest",
            "figLabel": "Compound interest",
            "data": {
                "kind": "compound",
                "P": f"{float(p):g}",
                "R": f"{float(r):g}\\%",
                "m": int(m),
                "t": f"{float(t):g}",
                "A": f"{amt:g}",
                "CI": f"{amt - float(p):g}",
            },
        }
    return None


def tax_figure(params: dict) -> dict | None:
    nci = params.get("nci")
    if nci is None:
        return None
    nci = float(nci)
    rows, cells = [], []
    rem = nci
    for width, rate in TAX_BANDS:
        take = rem if width is None else min(rem, float(width))
        tax = take * float(rate.replace("\\%", "").replace("%", "")) / 100
        rows.append(f"{rate}")
        cells.append([f"{take:g}", f"{tax:g}"])
        rem -= take
        if rem <= 1e-9:
            break
    return {
        "type": "table",
        "figLabel": "Tax bands",
        "data": {
            "rowH": rows,
            "colH": ["\\text{NCI}", "\\text{Tax}"],
            "cells": cells,
            "rowLabel": "Rate",
            "cap": f"\\text{{NCI}} = {nci:g}",
        },
    }


def table_split_figure(qid: str, prompt: str) -> dict | None:
    if "60\\%" in prompt and "fiction" in prompt.lower():
        return {
            "type": "table",
            "figLabel": "Book split",
            "data": {
                "rowH": ["\\text{Fiction}", "\\text{Non-fiction}"],
                "colH": ["\\text{Share}", "\\text{Count}"],
                "cells": [["60\\%", "120"], ["40\\%", "80"]],
                "cap": "200 \\text{ books total}",
            },
        }
    if qid.endswith("Q3c"):
        return {
            "type": "table",
            "figLabel": "Totals",
            "data": {
                "rowH": ["\\text{Before}", "\\text{After}"],
                "colH": ["\\text{Fiction}", "\\text{Non-fiction}", "\\text{Total}"],
                "cells": [["120", "80", "200"], ["132", "96", "228"]],
                "fav": [[1, 2]],
                "cap": "\\text{Increase} = 28",
            },
        }
    return None


def build_figure(q: dict) -> dict | None:
    t = q["type"]
    p = q.get("params") or {}
    prompt = q.get("prompt_latex", "")
    qid = q["id"]
    tbl = table_split_figure(qid, prompt)
    if tbl:
        return tbl
    if t == "tax":
        return tax_figure(p)
    if t in ("simple-interest", "compound-interest"):
        fig = interest_figure(t, p)
        if fig:
            return fig
    if t == "growth-decay":
        return growth_figure(p)
    if t in ("percentage-change", "reverse-percentage"):
        if p.get("changes") and len(p["changes"]) >= 2 and p.get("original") is not None:
            return tree_figure(p) or chain_figure(p)
        return chain_figure(p)
    return None


def focus_for_figure(fig: dict | None, step_idx: int) -> dict | None:
    if not fig:
        return None
    stages = len((fig.get("data") or {}).get("stages") or [])
    if fig["type"] == "bars":
        bars = len((fig["data"] or {}).get("bars") or [])
        reveal = min(max(step_idx, 1), bars)
    elif fig["type"] == "tree":
        reveal = min(max(step_idx, 1), max(stages, 2))
    elif fig["type"] == "chain":
        reveal = min(max(step_idx, 1), max(stages, 1) + 1)
    elif fig["type"] == "table":
        reveal = min(max(step_idx, 1), 3)
    elif fig["type"] == "interest":
        reveal = min(max(step_idx, 1), 3)
    else:
        reveal = min(max(step_idx, 1), 3)
    return {"type": fig["type"], "reveal": reveal, "data": fig["data"]}


def slide_for_step(step_idx: int) -> int:
    return max(0, step_idx - 1)


def step_titles(n_lines: int) -> list[str]:
    if n_lines <= 1:
        return ["Answer"]
    if n_lines == 2:
        return ["Set up", "Answer"]
    if n_lines == 3:
        return ["Set up", "Substitute", "Answer"]
    return ["Set up", "Substitute", "Calculate"] + ["Working"] * max(0, n_lines - 4) + ["Answer"]


def js_escape(tex: str) -> str:
    return json.dumps(tex)[1:-1]


def mt(tex: str) -> str:
    return '<span class="m" data-tex="' + js_escape(tex) + '"></span>'


def concept_chip(qtype: str) -> str:
    chips = {
        "percentage-change": ('change-factor', "1 \\pm r\\%"),
        "reverse-percentage": ("reverse-pct", "\\text{reverse}"),
        "growth-decay": ("growth", "P(1 \\pm r)^n"),
        "simple-interest": ("simple-interest", "PRT"),
        "compound-interest": ("compound-interest", "A=P(1+\\tfrac{R}{m})^{mt}"),
        "tax": ("tax-bands", "\\text{tax bands}"),
    }
    key, label = chips.get(qtype, ("change-factor", "\\text{formula}"))
    return (
        '<button class="method-chip" data-concept="' + key + '">'
        '<span data-tex="' + js_escape(label) + '"></span></button>'
    )


def build_steps(q: dict, prefix: str) -> list[dict]:
    number = q["number"]
    tag = deck_title(prefix, number)
    lines = q.get("steps_latex") or []
    titles = step_titles(len(lines))
    fig = build_figure(q)
    steps = [{
        "slide": 0,
        "focus": focus_for_figure(fig, 0),
        "title": f"Problem ({tag})",
        "body": mt(q["prompt_latex"]),
    }]
    for i, latex in enumerate(lines):
        body = mt(latex)
        if i == 0:
            body = "Use " + concept_chip(q["type"]) + " — " + body
        steps.append({
            "slide": slide_for_step(i + 1),
            "focus": focus_for_figure(fig, i + 1),
            "title": titles[i] if i < len(titles) else "Working",
            "body": body,
        })
    return steps


def manim_class(q: dict, prefix: str) -> str:
    number = q["number"]
    _, _, _, cls = parse_qid(q["id"])
    lines = q.get("steps_latex") or []
    if not lines:
        lines = [q.get("answer_latex", "")]
    scale = scale_for_lines(lines)
    title = deck_title(prefix, number) + ": " + TYPE_TITLE.get(q["type"], "Percentage")
    box = (len(lines) - 1,) if lines else ()
    lines_repr = ",\n        ".join(repr(x) for x in lines)
    return f"""
class {cls}(_SolBase):
    title = {title!r}
    lines = [
        {lines_repr},
    ]
    box_indices = {box!r}
    scale = {scale}
"""


def emit_manim_file(path: Path, classes: list[str]):
    header = '''"""Auto-generated worked-solution decks — do not edit by hand.

Regenerate:  python scripts/gen_pct_worked.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from manim import *
from manim_slides import Slide

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pct_sol_helpers import NEW, SolChainSlide, play_equation_chain  # noqa: F401


class _SolBase(SolChainSlide):
    note_color = NEW
'''
    path.write_text(header + "".join(classes), encoding="utf-8")


def item_obj(q: dict, src_prefix: str) -> dict:
    _, _, slug, _ = parse_qid(q["id"])
    fig = build_figure(q)
    steps = build_steps(q, src_prefix)
    short = q["prompt_latex"]
    if len(short) > 48:
        short = short[:45] + "\\ldots"
    obj = {
        "n": q["number"],
        "short": short,
        "title": TYPE_TITLE.get(q["type"], "Percentage"),
        "sub": q["source"],
        "deck": f"../../slides/percentage/{slug}/index.html",
        "solved": True,
        "question": [{"tag": "", "tex": q["prompt_latex"]}],
        "steps": steps,
    }
    if fig:
        obj["figure"] = {"type": fig["type"], "data": fig["data"]}
        obj["figLabel"] = fig["figLabel"]
    return obj


def main():
    if not JSON_SRC.exists():
        raise SystemExit(f"Missing question bank: {JSON_SRC}")
    JSON_DST.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(JSON_SRC, JSON_DST)
    data = json.loads(JSON_DST.read_text(encoding="utf-8"))
    questions = [sanitize_question(q) for q in data["questions"]]
    data["questions"] = questions
    JSON_DST.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    by_source: dict[str, list] = defaultdict(list)
    for q in questions:
        by_source[q["source"]].append(q)

    render_jobs: list[tuple[str, str, str]] = []
    bank_sources = []
    manim_files: dict[str, list[str]] = defaultdict(list)

    for src_name, (sid, prefix, label, open_default, py_file) in SOURCE_META.items():
        qs = by_source.get(src_name, [])
        qs.sort(key=lambda x: (main_num(x["number"]), x["number"]))
        groups_map: dict[str, list] = defaultdict(list)
        for q in qs:
            groups_map[main_num(q["number"])].append(q)
            _, _, slug, cls = parse_qid(q["id"])
            manim_files[py_file].append(manim_class(q, prefix))
            render_jobs.append((py_file, cls, f"percentage/{slug}"))

        group_objs = []
        for gnum in sorted(groups_map.keys(), key=lambda x: int(x) if x.isdigit() else x):
            items = groups_map[gnum]
            group_objs.append({
                "name": f"Q{gnum}" if len(items) > 1 or "(" in items[0]["number"] else "",
                "items": [item_obj(q, prefix) for q in items],
            })
        bank_sources.append({
            "id": sid,
            "name": label,
            "prefix": prefix,
            "open": open_default,
            "groups": group_objs,
        })

    for py_file, classes in manim_files.items():
        emit_manim_file(MANIM_DIR / py_file, classes)

    js_lines = [
        "/* Auto-generated — Pre S3 Maths L04–06 Percentage (2025). Regenerate: python scripts/gen_pct_worked.py */",
        "(function () {",
        '  "use strict";',
        "  window.PCTW_BANK = function () {",
        "    return " + json.dumps(bank_sources, ensure_ascii=False, indent=2) + ";",
        "  };",
        "})();",
        "",
    ]
    (TOPIC_DIR / "percentage-worked-data.js").write_text("\n".join(js_lines), encoding="utf-8")

    ps1 = [
        "# Auto-generated batch render for Percentage worked solutions.",
        "# Run from dashboard/:  .\\render_pct_worked.ps1",
        "# Optional: .\\render_pct_worked.ps1 -Quality m   (faster preview)",
        "param(",
        "  [string]$Quality = 'h',",
        "  [switch]$Force",
        ")",
        "$ErrorActionPreference = 'Continue'",
        "$Here = $PSScriptRoot",
        f"$jobs = @(",
    ]
    for i, (py_file, cls, deck) in enumerate(render_jobs):
        comma = "," if i < len(render_jobs) - 1 else ""
        ps1.append(f"  @{{ File = 'manim\\percentage\\{py_file}'; Name = '{cls}'; Deck = '{deck}' }}{comma}")
    ps1.extend([
        ")",
        "$i = 0",
        "$skipped = 0",
        "$failed = 0",
        "$failList = @()",
        "foreach ($j in $jobs) {",
        "  $i++",
        "  $out = Join-Path $Here \"slides\\$($j.Deck)\\index.html\"",
        "  if ((Test-Path $out) -and -not $Force) {",
        "    $skipped++",
        "    Write-Host \"[$i/$($jobs.Count)] SKIP $($j.Name) (already rendered)\" -ForegroundColor DarkGray",
        "    continue",
        "  }",
        "  Write-Host \"[$i/$($jobs.Count)] $($j.Name)\" -ForegroundColor Cyan",
        "  & (Join-Path $Here 'render.ps1') -SceneFile $j.File -SceneName $j.Name -Deck $j.Deck -Quality $Quality",
        "  if ($LASTEXITCODE -ne 0) {",
        "    $failed++",
        "    $failList += $j.Name",
        "    Write-Host \"  FAILED $($j.Name) - continuing\" -ForegroundColor Red",
        "    continue",
        "  }",
        "}",
        "Write-Host \"Done: $($jobs.Count - $skipped - $failed) rendered, $skipped skipped, $failed failed.\" -ForegroundColor Green",
        "if ($failList.Count) { Write-Host \"Failed: $($failList -join ', ')\" -ForegroundColor Yellow }",
        "",
    ])
    RENDER_PS1.write_text("\n".join(ps1), encoding="utf-8")

    print(f"Copied {len(questions)} questions -> {JSON_DST}")
    print(f"Wrote {len(manim_files)} manim files, {len(render_jobs)} render jobs")
    print(f"Bank -> {TOPIC_DIR / 'percentage-worked-data.js'}")


if __name__ == "__main__":
    main()
