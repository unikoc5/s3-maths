"""Generate topics/inequality/inequality-worked-data.js from questions.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "manim" / "inequality" / "questions.json"
OUT = HERE.parent / "topics" / "inequality" / "inequality-worked-data.js"

import sys
sys.path.insert(0, str(HERE.parent / "manim" / "inequality"))
from step_utils import normalize_steps, step_title, step_note, clean  # noqa: E402

EXTRA_QUIZ = [
    {
        "id": "INEQ-QZ-Q1", "source": "Quiz", "number": "1",
        "prompt_latex": r"x > -2\pi",
        "type": "integer_sum",
        "answer_latex": r"-21",
        "steps_latex": [
            r"x > -2\pi",
            r"\text{Negative integers: } -6,-5,-4,-3,-2,-1",
            r"\text{Sum} = (-6)+(-5)+(-4)+(-3)+(-2)+(-1) = -21",
        ],
        "params": {"kind": "intsum", "values": [-6, -5, -4, -3, -2, -1], "sum": -21},
        "verified": True, "note": "MCQ answer B",
    },
    {
        "id": "INEQ-QZ-Q2", "source": "Quiz", "number": "2",
        "prompt_latex": r"2x \le 3",
        "type": "mcq_logic",
        "answer_latex": r"x \le \tfrac{3}{2}",
        "steps_latex": [
            r"2x \le 3",
            r"x \le \tfrac{3}{2}",
            r"1-2x \le -2 \text{ is NOT always true (e.g.\ } x=0)",
        ],
        "params": {"kind": "mcq", "answer": "B"},
        "verified": True, "note": "",
    },
    {
        "id": "INEQ-QZ-Q3", "source": "Quiz", "number": "3",
        "prompt_latex": r"x \le y,\; z > y,\; z<0",
        "type": "mcq_logic",
        "answer_latex": r"-\tfrac{x}{4} < -\tfrac{z}{4} \text{ may fail}",
        "steps_latex": [
            r"x \le y \text{ and } z > y \Rightarrow x < z",
            r"-\tfrac{x}{4} < -\tfrac{z}{4} \text{ is not always true}",
        ],
        "params": {"kind": "mcq", "answer": "D"},
        "verified": True, "note": "",
    },
    {
        "id": "INEQ-QZ-Q5", "source": "Quiz", "number": "5",
        "prompt_latex": r"7x + 3 > 17",
        "type": "mcq_check",
        "answer_latex": r"x > 2",
        "steps_latex": [r"7x + 3 > 17", r"7x > 14", r"x > 2"],
        "params": {"direction": "gt", "bound": 2.0, "bound_latex": "2", "closed": False,
                   "kind": "mcq", "answer": "D", "test_group": [2.1, 3.2, 4.3]},
        "verified": True, "note": "",
    },
    {
        "id": "INEQ-QZ-Q6b", "source": "Quiz", "number": "6b",
        "prompt_latex": r"\text{Positive integers for (a)}",
        "type": "integer_list",
        "answer_latex": r"1,2,3,4",
        "steps_latex": [r"x \le \tfrac{24}{5}", r"\text{Positive integers: } 1,2,3,4"],
        "params": {"kind": "intlist", "values": [1, 2, 3, 4]},
        "verified": True, "note": "",
    },
    {
        "id": "INEQ-QZ-Q8", "source": "Quiz", "number": "8",
        "prompt_latex": r"\frac{2x-k}{3}=\frac{5x-7}{4}+\frac{x+k}{6}",
        "type": "parameter",
        "answer_latex": r"k \in \{1,2,3\}",
        "steps_latex": [
            r"12(2x-k)=9(5x-7)+2(x+k)",
            r"24x-12k=45x-63+2x+2k",
            r"-23x=14k-63",
            r"x=\frac{63-14k}{23}",
            r"\text{Need } x \ge 0 \Rightarrow k \in \{1,2,3\}",
        ],
        "params": {"kind": "param", "values": [1, 2, 3]},
        "verified": True, "note": "",
    },
]


def deck_id(q):
    if q.get("deck_id"):
        return q["deck_id"]
    qid = q["id"]
    m = re.match(r"INEQ-L03-Q(\d+)$", qid)
    if m:
        return f"qa{m.group(1)}-solution"
    m = re.match(r"INEQ-QZ-Q(\d+)([a-z]?)$", qid, re.I)
    if m:
        return f"qz{m.group(1)}{m.group(2).lower()}-solution"
    return qid.lower() + "-solution"


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def mt(tex: str) -> str:
    return '<span class="m" data-tex="' + esc(tex) + '"></span>'


def step_body(i: int, q: dict, tex: str, prev: str | None, n: int) -> str:
    note = step_note(i, n, tex, prev, q)
    if i == 0:
        return note + " " + mt(q["prompt_latex"])
    if i == n - 1:
        ans = q.get("answer_latex", clean(tex))
        return note + " " + mt(ans)
    return note + " " + mt(clean(tex))


def nl_focus(q: dict):
    p = q.get("params") or {}
    if p.get("kind") in ("intlist", "intsum", "mcq", "param"):
        return None
    if p.get("bound") is None:
        return None
    d = p.get("direction", "gt")
    return {
        "type": "numberline",
        "reveal": 5,
        "data": {
            "bound": p["bound"],
            "bound_latex": p.get("bound_latex", str(p["bound"])),
            "direction": d,
            "closed": p.get("closed", d in ("ge", "le")),
            "answer": q.get("answer_latex", ""),
        },
    }


def fig_focus(q: dict):
    p = q.get("params") or {}
    k = p.get("kind")
    if k == "intlist":
        return {"type": "intlist", "reveal": 3, "data": {"values": p["values"], "cap": q.get("answer_latex", "")}}
    if k == "intsum":
        return {"type": "intlist", "reveal": 3, "data": {"values": p["values"], "cap": "sum = " + str(p.get("sum", ""))}}
    if k == "mcq" and p.get("test_group"):
        return {"type": "check", "reveal": 3, "data": {"group": p["test_group"], "bound": p.get("bound", 2), "direction": "gt"}}
    if k == "param":
        return {"type": "intlist", "reveal": 3, "data": {"values": p["values"], "cap": r"k \in \{1,2,3\}"}}
    return nl_focus(q)


def build_steps(q: dict):
    chain = normalize_steps(q)
    lines = []
    n = len(chain)
    for si, tex in enumerate(chain):
        prev = chain[si - 1] if si > 0 else None
        title = step_title(si, n, tex)
        body = step_body(si, q, tex, prev, n)
        focus = fig_focus(q) if si == n - 1 else None
        lines.append(f"      st({si}, {json.dumps(focus)}, '{esc(title)}', '{esc(body)}')")
    return lines


def display_num(q: dict) -> str:
    n = str(q["number"])
    return n[1:] if n.upper().startswith("Q") else n


def item_js(q: dict) -> str:
    n = display_num(q)
    did = deck_id(q)
    sub = q.get("type", "inequality").replace("_", " ")
    parts = q.get("parts") or [{"tag": "", "tex": q["prompt_latex"]}]
    if not q.get("parts"):
        parts = [{"tag": "", "tex": q["prompt_latex"]}]
    qrows = ", ".join(f"{{ tag: '{esc(p.get('tag',''))}', tex: '{esc(p['tex'])}' }}" for p in parts)
    steps = ",\n".join(build_steps(q))
    return f"""    {{
      n: "{esc(n)}", short: "{esc(q['prompt_latex'][:40])}", title: "Solve", sub: "{esc(sub)}",
      deck: "../../slides/inequality/{did}/index.html", solved: true,
      question: [{qrows}],
      params: {json.dumps(q.get('params') or {})},
      steps: [
{steps}
      ]
    }}"""


def main():
    with DATA.open(encoding="utf-8") as f:
        data = json.load(f)
    qs = {q["id"]: q for q in data["questions"]}
    for eq in EXTRA_QUIZ:
        qs.setdefault(eq["id"], eq)
    all_q = list(qs.values())

    main_q = sorted([q for q in all_q if q["source"] == "L03(A)"], key=lambda x: int(x["number"]))
    def sort_key(x):
        n = display_num(x)
        m = re.match(r"(\d+)", n)
        return (int(m.group(1)) if m else 0, n)

    quiz_q = sorted([q for q in all_q if q["source"] == "Quiz"], key=sort_key)

    def grp(name, items):
        return (
            f"        {{ name: {json.dumps(name)}, items: [\n"
            + ",\n".join(item_js(q) for q in items)
            + "\n        ] }"
        )

    groups_main = [
        grp("Checkpoint 1–2 · add / subtract (Q1–10)", [q for q in main_q if 1 <= int(q["number"]) <= 10]),
        grp("Checkpoint 3 · multiply / divide (Q11–22)", [q for q in main_q if 11 <= int(q["number"]) <= 22]),
        grp("Both sides & brackets (Q23–40)", [q for q in main_q if 23 <= int(q["number"]) <= 40]),
        grp("Fractions & mixed (Q41–60)", [q for q in main_q if 41 <= int(q["number"]) <= 60]),
    ]

    js = f"""/* Inequality — Worked-Solutions question bank (auto-generated). */
(function () {{
  "use strict";
  function st(slide, focus, title, body) {{ return {{ slide: slide, focus: focus, title: title, body: body }}; }}

  window.IWQ_BANK = function () {{
    var K = window.IWQKit;
    if (!K) return [];
    return [
      {{
        id: "main", name: "Pre S3 Maths L03 — Inequality (2025)", prefix: "Q", open: false,
        groups: [
{",\n".join(groups_main)}
        ]
      }},
      {{
        id: "quiz", name: "Pre S3 Maths L03 Inequality Quiz (2025)", prefix: "Qz", open: true,
        groups: [
          {{ name: "", items: [
{",\n".join(item_js(q) for q in quiz_q)}
          ] }}
        ]
      }}
    ];
  }};
}})();
"""
    OUT.write_text(js, encoding="utf-8")
    print(f"wrote {OUT} ({len(main_q)} main + {len(quiz_q)} quiz)")


if __name__ == "__main__":
    main()
