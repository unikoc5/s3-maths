"""Normalize and expand inequality worked-solution step chains."""
from __future__ import annotations

import re

ANNOT_RE = re.compile(r"(\\;|\\quad)\([^)]*\)$")
FLIP_RE = re.compile(r"\\text\{flip\}|flip", re.I)
SIGN_RE = re.compile(r"(\\le|\\ge|\\leq|\\geq|[<>])")
SP = re.compile(r"\s+")


def clean(tex: str) -> str:
    return ANNOT_RE.sub("", tex or "").strip()


def _nums(s: str) -> list[float]:
    out = []
    for m in re.finditer(r"-?\d+(?:\.\d+)?", s.replace(r"\frac", "")):
        try:
            out.append(float(m.group()))
        except ValueError:
            pass
    return out


def _flip_rel(rel: str) -> str:
    rel = rel.replace(r"\le", "LE").replace(r"\ge", "GE").replace(r"\leq", "LE").replace(r"\geq", "GE")
    m = {">": r"\le", "<": r"\ge", "LE": r"\ge", "GE": r"\le"}
    for k, v in m.items():
        if k in rel:
            return v.replace("LE", r"\le").replace("GE", r"\ge")
    return rel


def _bridge(prev: str, curr: str) -> str | None:
    """Insert a missing intermediate line between *prev* and *curr*."""
    p, c = clean(prev), clean(curr)

    # a < x - b  then  -x < -k  →  k < x
    m = re.search(
        r"(-?\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*x\s*-\s*(\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"-\s*x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*-(\d+(?:\.\d+)?)", c)
    if m and n:
        a, rel, b = m.group(1), m.group(2), m.group(3)
        k = n.group(2)
        if abs(float(a) + float(b) - float(k)) < 1e-6:
            return f"{k} {rel} x"

    # a >= x + b  then  -x >= -k  →  (a-b) >= x
    m = re.search(
        r"(-?\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*x\s*\+\s*(\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"-\s*x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*-(\d+(?:\.\d+)?)", c)
    if m and n:
        a, rel, b = m.group(1), m.group(2), m.group(3)
        k = n.group(2)
        if abs(float(a) - float(b) - float(k)) < 1e-6:
            return f"{k} {rel} x"

    # a rel b - x  →  -x intermediate before x on the left
    m = re.search(
        r"(-?\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)\s*-\s*x",
        p,
    )
    n = re.search(r"x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)", c)
    if m and n and "- x" not in c:
        a, rel, b = float(m.group(1)), m.group(2), float(m.group(3))
        bound = b - a
        nb = float(n.group(2))
        if abs(nb - bound) < 1e-6:
            if rel in ("<", r"\le"):
                op = r"\ge" if rel == r"\le" else ">"
                mid = f"- x {op} {int(-bound) if -bound == int(-bound) else -bound}"
            else:
                op = r"\le" if rel == r"\ge" else "<"
                mid = f"- x {op} {int(-bound) if -bound == int(-bound) else -bound}"
            if clean(mid) != clean(c) and clean(mid) != clean(p):
                return mid

    # x + a < b  →  x < b - a  (show subtraction before simplifying)
    m = re.search(
        r"x\s*\+\s*(\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)", c)
    if m and n and p.count("x") == 1:
        a, rel, b = float(m.group(1)), m.group(2), float(m.group(3))
        nb = float(n.group(2))
        if rel in ("<", r"\le") and abs(nb - (b - a)) < 1e-6 and a != 0:
            mid = f"x {rel} {int(b) if b == int(b) else b} - {int(a) if a == int(a) else a}"
            if clean(mid) != clean(c) and clean(mid) != clean(p):
                return mid

    # x - a > b  →  x > b + a
    m = re.search(
        r"x\s*-\s*(\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)", c)
    if m and n and p.count("x") == 1:
        a, rel, b = float(m.group(1)), m.group(2), float(m.group(3))
        nb = float(n.group(2))
        if rel in (">", r"\ge") and abs(nb - (b + a)) < 1e-6 and a != 0:
            mid = f"x {rel} {int(b) if b == int(b) else b} + {int(a) if a == int(a) else a}"
            if clean(mid) != clean(c) and clean(mid) != clean(p):
                return mid

    # x + a <= b  →  (a-b) >= x style for >= on left constant
    m = re.search(
        r"(-?\d+(?:\.\d+)?)\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*x\s*\+\s*(\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)", c)
    if m and n:
        left, rel, a = float(m.group(1)), m.group(2), float(m.group(3))
        nb = float(n.group(2))
        if rel in (r"\ge", ">") and abs(nb - (left - a)) < 1e-6:
            mid = f"{int(left - a) if (left - a) == int(left - a) else left - a} {rel} x"
            if clean(mid) != clean(c) and clean(mid) != clean(p):
                return mid

    m = re.search(
        r"(-?\d+(?:\.\d+)?)\s*-\s*x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)",
        p,
    )
    n = re.search(r"-\s*x\s*(\\le|\\ge|<|>|\\leq|\\geq)\s*(-?\d+(?:\.\d+)?)", c)
    if m and n and "- x" not in p.split("<")[0]:
        c0, rel, a = float(m.group(1)), m.group(2), float(m.group(3))
        rhs = float(n.group(2))
        if abs(a - c0 - rhs) < 1e-6:
            return f"- x {rel} {int(rhs) if rhs == int(rhs) else rhs}"

    # c - x > a  →  -x > (a-c)
    if re.search(r"\bx\b", p) and p.count("x") >= 2:
        n = re.search(r"-\s*(\d+)\s*x\s*(\\le|\\ge|<|>|\\leq|\\geq)", c)
        if n and not re.search(r"-\s*\d*\s*x", p):
            return None  # already the collect step

    return None


def normalize_steps(q: dict) -> list[str]:
    """Full chain for Manim + UI: prompt first, bridges inserted, dupes removed."""
    prompt = (q.get("prompt_latex") or "").strip()
    raw = [s for s in (q.get("steps_latex") or []) if s and s.strip()]
    if not raw:
        return [prompt] if prompt else []

    steps = list(raw)
    if clean(steps[0]) != clean(prompt):
        steps.insert(0, prompt)

    out: list[str] = [steps[0]]
    for i in range(1, len(steps)):
        prev, curr = out[-1], steps[i]
        if clean(curr) == clean(prev):
            continue
        bridge = _bridge(prev, curr)
        if bridge and clean(bridge) != clean(prev) and clean(bridge) != clean(curr):
            out.append(bridge)
        if clean(curr) != clean(out[-1]):
            out.append(curr)

    # drop duplicate consecutive after clean (e.g. 3x<56 twice)
    deduped = [out[0]]
    for s in out[1:]:
        if clean(s) != clean(deduped[-1]):
            deduped.append(s)
    return deduped


def step_title(i: int, n: int, tex: str) -> str:
    if i == 0:
        return "Problem"
    if i == n - 1:
        return "Solution"
    if FLIP_RE.search(tex):
        return "Flip the sign"
    if re.search(r"\\times|\\div", tex):
        return "Simplify"
    if re.search(r"-\s*\d*\s*x", clean(tex)) and i > 0:
        return "Rearrange"
    return f"Step {i}"


def step_note(i: int, n: int, tex: str, prev: str | None, q: dict) -> str:
    """Short pedagogy line for the side panel (plain text hints)."""
    t = clean(tex)
    p = clean(prev or "")

    if i == 0:
        return "Start with the given inequality."

    if i == n - 1:
        ans = q.get("answer_latex", t)
        if (q.get("params") or {}).get("kind") == "intlist":
            return "List all positive integers that satisfy the inequality."
        if FLIP_RE.search(tex):
            return "Divide by a negative and flip the sign — final answer."
        return "Final answer in simplest form."

    if FLIP_RE.search(tex):
        return "Divide both sides by a negative number; the sign flips."

    if re.search(r"\\times\s*\d+", tex) or r"\quad(\times" in tex:
        return "Multiply both sides to clear denominators or fractions."

    if re.search(r"\\div\s*\d+", tex) or "÷" in tex:
        return "Divide both sides to isolate x."

    if re.search(r"(\d+(?:\.\d+)?)\s*[<>\\le\\ge]+\s*x\s*$", t) and re.search(r"x\s*-\s*\d+", p):
        return "Add to both sides to collect the constant."

    if re.search(r"x\s*[<>\\le\\ge]+\s*\d+\s*-\s*\d+", t) and re.search(r"x\s*\+\s*\d+", p):
        return "Subtract the same amount from both sides."

    if re.search(r"x\s*[<>\\le\\ge]+\s*\d+\s*\+\s*\d+", t) and re.search(r"x\s*-\s*\d+", p):
        return "Add to both sides."

    if re.search(r"-\s*x\s*[<>\\le\\ge]", t) and p and "- x" not in p:
        if re.search(r"x\s*-\s*\d+", p):
            return "Add/subtract to collect the constant on one side."
        if re.search(r"x\s*\+\s*\d+", p):
            return "Subtract the constant from both sides."
        if re.search(r"\d+\s*-\s*x", p):
            return "Subtract to get x on one side."
        return "Rearrange so x is on one side."

    if re.search(r"-\s*\d+\s*x", t) and p and p.count("x") >= 2:
        return "Collect x-terms on one side and numbers on the other."

    if p and t != p:
        return "Apply the same operation to both sides."

    return "Continue simplifying."
