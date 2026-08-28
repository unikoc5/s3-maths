"""Audit inequality worked solutions vs PDF/PPT sources."""
from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
DASH = HERE.parent
DATA = DASH / "manim" / "inequality" / "questions.json"
SLIDES = DASH / "slides" / "inequality"
PPT_BASE = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\S3 MATH summer 2026\L03 Inequality\PPT")
PDF_DUMP = HERE / "_ineq_pdf_dump.txt"

EXTRA_QUIZ_IDS = {
    "INEQ-QZ-Q1", "INEQ-QZ-Q2", "INEQ-QZ-Q3",
    "INEQ-QZ-Q5", "INEQ-QZ-Q6b", "INEQ-QZ-Q8",
}


def deck_status(deck_id: str) -> dict:
    html = SLIDES / deck_id / "index.html"
    assets = SLIDES / deck_id / "index_assets"
    mp4s = list(assets.glob("*.mp4")) if assets.is_dir() else []
    patched = False
    if html.is_file():
        t = html.read_text(encoding="utf-8", errors="replace")
        patched = "playCurrentBgVideo" in t and "embedded: true" in t
    return {
        "html": html.is_file(),
        "assets": assets.is_dir(),
        "videos": len(mp4s),
        "embed_patch": patched,
        "ok": html.is_file() and len(mp4s) > 0,
    }


def ppt_slide_count(pptx: Path) -> int:
    if not pptx.is_file():
        return -1
    with zipfile.ZipFile(pptx) as z:
        return len([n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)])


def pdf_question_numbers() -> dict[str, set[int]]:
    if not PDF_DUMP.is_file():
        return {}
    text = PDF_DUMP.read_text(encoding="utf-8")
    out: dict[str, set[int]] = {"main": set(), "quiz": set()}
    section = None
    for line in text.splitlines():
        if "Pre S3 L03 - Inequality - 2025 (QUE)" in line:
            section = "main"
            continue
        if "Pre S3 L03 Inequality Quiz (QUE)" in line and section != "quiz_ans":
            section = "quiz"
            continue
        if section and re.match(r"^(\d{1,2})\.\s", line.strip()):
            n = int(re.match(r"^(\d{1,2})", line.strip()).group(1))
            out[section].add(n)
    return out


def main():
    qs = json.loads(DATA.read_text(encoding="utf-8"))["questions"]
    main_q = sorted([q for q in qs if q["source"] == "L03(A)"], key=lambda x: int(x["number"]))
    quiz_q = sorted([q for q in qs if q["source"] == "Quiz"], key=lambda x: str(x["number"]))

    pdf_nums = pdf_question_numbers()
    main_pdf = pdf_nums.get("main", set())
    quiz_pdf = pdf_nums.get("quiz", set())

    print("=" * 70)
    print("INEQUALITY WORKED SOLUTIONS — COVERAGE AUDIT")
    print("=" * 70)

    # PPT inventory
    main_ppt = PPT_BASE / "Pre S3 Maths L03 - Inequality (2025).pptx"
    quiz_ppt = PPT_BASE / "Pre S3 Maths L03 Inequality Quiz (2025).pptx"
    quiz_ans = PPT_BASE / "Pre S3 Maths L03 Inequality Quiz (ANS) james.pptx"
    for label, p in [("Main PPT", main_ppt), ("Quiz PPT", quiz_ppt), ("Quiz ANS PPT", quiz_ans)]:
        exists = p.is_file()
        slides = ppt_slide_count(p) if exists else -1
        print(f"{label}: {'FOUND' if exists else 'MISSING'} | slides={slides}")

    print()
    print("--- MAIN (L03 Inequality 2025) ---")
    json_nums = {int(q["number"]) for q in main_q}
    print(f"PDF (QUE) question numbers found: {len(main_pdf)} -> {sorted(main_pdf)}")
    print(f"JSON bank: {len(main_q)} questions Q1–Q{max(json_nums)}")
    missing_json = sorted(main_pdf - json_nums)
    extra_json = sorted(json_nums - main_pdf)
    if missing_json:
        print(f"  In PDF but NOT in JSON: {missing_json}")
    if extra_json:
        print(f"  In JSON but NOT parsed from PDF text: {extra_json}")

    render_fail = []
    unverified = []
    for q in main_q:
        n = int(q["number"])
        did = f"qa{n}-solution"
        st = deck_status(did)
        if not st["ok"]:
            render_fail.append((n, did, st))
        if not q.get("verified"):
            unverified.append(n)

    print(f"Rendered decks OK: {len(main_q) - len(render_fail)}/{len(main_q)}")
    if render_fail:
        print("  Render/asset problems:")
        for n, did, st in render_fail:
            print(f"    Q{n} ({did}): html={st['html']} videos={st['videos']} embed={st['embed_patch']}")

    print()
    print("--- QUIZ (Inequality Quiz 2025) ---")
    print(f"PDF (QUE) question numbers: {sorted(quiz_pdf)}")
    print(f"JSON bank: {len(quiz_q)} entries:")
    for q in quiz_q:
        num = str(q["number"]).lstrip("Q")
        extra = " [EXTRA hand-authored]" if q["id"] in EXTRA_QUIZ_IDS else ""
        print(f"  {q['id']} number={q['number']}{extra}")

    quiz_render_fail = []
    for q in quiz_q:
        m = re.match(r"INEQ-QZ-Q(\d+)([a-z]?)$", q["id"], re.I)
        did = f"qz{m.group(1)}{m.group(2).lower()}-solution" if m else q["id"]
        st = deck_status(did)
        if not st["ok"]:
            quiz_render_fail.append((q["id"], did, st))

    print(f"Quiz rendered OK: {len(quiz_q) - len(quiz_render_fail)}/{len(quiz_q)}")
    if quiz_render_fail:
        for qid, did, st in quiz_render_fail:
            print(f"  {qid} ({did}): videos={st['videos']}")

    # Known PDF vs JSON wording mismatches (manual rules from PDF read)
    print()
    print("--- KNOWN PDF vs JSON PROMPT MISMATCHES (content drift) ---")
    mismatches = [
        (5, "PDF: 11 ≥ 3 + x", "JSON: 11 \\ge x + 3"),
        (22, "PDF: 216x/9 ≤ 24", "JSON: 24 x \\le 24"),
        (23, "PDF: −x + 3 > 7", "JSON: 3 - x > 7"),
        (25, "PDF: x + 2 ≥ 4 + 3x", "JSON: x + 2 \\ge 3 x + 4"),
        (32, "PDF: −30 + 12x < 42", "JSON: 12 x - 30 < 42"),
        (33, "PDF: 4(x−1) ≥ 7x−10", "JSON: 4 x - 4 \\ge 7 x - 10"),
        (34, "PDF: 6(3−x) ≤ 4(−2x+3)", "JSON: 18 - 6 x \\le 12 - 8 x"),
        (35, "PDF: 2x+3 > 5(2x−1)", "JSON: 2 x + 3 > 10 x - 5"),
        (43, "PDF: −6(5−2x) > 42", "JSON: 12 x - 30 > 42"),
        (44, "PDF: 5(x−8) < 10", "JSON: 5 x - 40 < 10"),
    ]
    for n, pdf, js in mismatches:
        q = next((x for x in main_q if int(x["number"]) == n), None)
        js_actual = q["prompt_latex"] if q else "?"
        print(f"  Q{n}: {pdf}")
        print(f"       JSON: {js_actual}")

    print()
    print("--- QUIZ: PDF vs dashboard ---")
    print("  PDF Quiz QUE lists Q1–Q7 (8 may be on continuation page)")
    print("  PPT Quiz has worked slides mainly for Q5, Q6(a)(b), Q8 (text extract)")
    print("  Dashboard has Qz1–3,5,6b,8 from EXTRA + Qz4,6a,7 from JSON extraction")
    in_pdf_not_extra = sorted(quiz_pdf - {1, 2, 3, 4, 5, 6, 7, 8})
    if in_pdf_not_extra:
        print(f"  Unexpected PDF nums: {in_pdf_not_extra}")

    print()
    print("--- WHY MAIN PPT SHOWS ALMOST NO QUESTIONS IN TEXT EXTRACT ---")
    print("  Main deck slides are predominantly equation images/OLE; python-pptx text")
    print("  extraction only captured the title slide. PDF (QUE) is the reliable inventory.")


if __name__ == "__main__":
    main()
