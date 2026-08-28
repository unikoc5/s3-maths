"""Audit Area & Volume worked solutions vs source PowerPoints + PDFs."""
from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2")
AV = ROOT / "S3 MATH summer 2026" / "L07-09 Area and Volume"
PPT_MAIN = AV / "PPT" / "Pre S3 Maths L07-09 Area and Volume (2025).pptx"
PPT_QUIZ = AV / "PPT" / "pre S3 Maths L07-09 Area and Volume Quiz (ANS) (Simson) v2.pptx"
BANK = ROOT / "dashboard" / "topics" / "area_volume" / "area-volume-bank.js"
SLIDES = ROOT / "dashboard" / "slides" / "area_volume"
NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


def slide_texts(pptx: Path):
    with zipfile.ZipFile(pptx) as z:
        names = sorted(
            [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
            key=lambda s: int(re.search(r"slide(\d+)", s).group(1)),
        )
        for sn in names:
            idx = int(re.search(r"slide(\d+)", sn).group(1))
            root = ET.fromstring(z.read(sn))
            parts = [t.text for t in root.iter(f"{{{NS['a']}}}t") if t.text]
            yield idx, re.sub(r"\s+", " ", " ".join(parts)).strip()


def find_q_markers(text: str):
    """Find question numbers like '1.' '12.' at start or after section markers."""
    hits = []
    for m in re.finditer(r"(?<![(\d])(?<!\w)(\d{1,2})\.\s", text):
        hits.append(int(m.group(1)))
    return hits


def extract_lesson_sections(pptx: Path):
    """Parse main deck into L07/L08/L09 sections by slide content."""
    slides = list(slide_texts(pptx))
    sections = {"L07": [], "L08": [], "L09": [], "other": []}
    current = "other"
    for idx, body in slides:
        bl = body.lower()
        if re.search(r"\bL07\b|lesson\s*07|\(A\)|area and volume \(A\)", bl, re.I):
            current = "L07"
        elif re.search(r"\bL08\b|lesson\s*08|\(B\)|area and volume \(B\)", bl, re.I):
            current = "L08"
        elif re.search(r"\bL09\b|lesson\s*09|\(C\)|area and volume \(C\)", bl, re.I):
            current = "L09"
        qnums = find_q_markers(body)
        if qnums or re.search(r"Find the|Calculate|Hence|Determine|Can they|Explain|Agree|Disagree", body, re.I):
            sections[current].append({"slide": idx, "qnums": qnums, "text": body[:500]})
    return slides, sections


def extract_quiz(pptx: Path):
    out = []
    for idx, body in slide_texts(pptx):
        qnums = find_q_markers(body)
        if qnums or re.search(r"Find|Which|Calculate|volume|surface area", body, re.I):
            out.append({"slide": idx, "qnums": qnums, "text": body[:500]})
    return out


def parse_bank():
    text = BANK.read_text(encoding="utf-8")
    solved = set(re.findall(r'\{\s*n:\s*"(\d+)"\s*,\s*solved:\s*true', text))
    stubs = re.findall(r'stub\("(\d+)"', text)
    # map by section - crude split on ITEMS.l07/l08/l09/quiz
    sections = {}
    for key, prefix in [("l07", "QA"), ("l08", "QB"), ("l09", "QC"), ("quiz", "Qz")]:
        m = re.search(rf"ITEMS\.{key}\s*=\s*\[(.*?)\];", text, re.S)
        if not m:
            continue
        block = m.group(1)
        nums = re.findall(r'(?:n:\s*"(\d+)"|stub\("(\d+)"\))', block)
        items = []
        for a, b in nums:
            n = a or b
            is_stub = f'stub("{n}"' in block and f'n: "{n}"' not in block.split(f'stub("{n}"')[0][-20:]
            # better: check solved
            pat = rf'\{{\s*n:\s*"{n}"\s*,\s*solved:\s*true'
            is_solved = bool(re.search(pat, block))
            is_stub = f'stub("{n}"' in block and not is_solved
            deck = None
            dm = re.search(rf'n:\s*"{n}"[^}}]*deck:\s*deckPath\("([^"]+)"\)', block)
            if dm:
                deck = dm.group(1)
            elif is_solved:
                dm2 = re.search(rf'solved:\s*true[^}}]*deck:\s*deckPath\("([^"]+)"\)', block)
                if dm2:
                    deck = dm2.group(1)
            items.append({"n": n, "prefix": prefix, "solved": is_solved, "stub": is_stub, "deck": deck})
        sections[prefix] = items
    return sections


def deck_exists(deck_id: str | None) -> bool:
    if not deck_id:
        return False
    return (SLIDES / deck_id / "index.html").is_file()


def main():
    print("=" * 72)
    print("AREA & VOLUME WORKED SOLUTIONS AUDIT")
    print("=" * 72)

    bank = parse_bank()
    for prefix, items in bank.items():
        solved = [i for i in items if i["solved"]]
        stubs = [i for i in items if i["stub"]]
        missing_deck = [i for i in solved if not deck_exists(i.get("deck"))]
        print(f"\n--- Bank {prefix}: {len(items)} questions, {len(solved)} solved, {len(stubs)} stubs ---")
        if missing_deck:
            print(f"  WARNING: {len(missing_deck)} marked solved but no rendered deck:")
            for i in missing_deck:
                print(f"    {prefix}{i['n']} deck={i.get('deck')}")

    print("\n" + "=" * 72)
    print("STUB QUESTIONS (not rendered)")
    print("=" * 72)
    for prefix, items in bank.items():
        for i in items:
            if i["stub"]:
                print(f"  {prefix}{i['n']}")

    print("\n" + "=" * 72)
    print(f"MAIN PPT: {PPT_MAIN.name}")
    print("=" * 72)
    all_slides, sections = extract_lesson_sections(PPT_MAIN)
    print(f"Total slides: {len(all_slides)}")
    for lesson in ["L07", "L08", "L09"]:
        print(f"\n  {lesson}: {len(sections[lesson])} question-like slides")
        for s in sections[lesson][:3]:
            print(f"    slide {s['slide']:3d} qnums={s['qnums']} | {s['text'][:120]}...")

    print("\n" + "=" * 72)
    print(f"QUIZ PPT: {PPT_QUIZ.name}")
    print("=" * 72)
    quiz = extract_quiz(PPT_QUIZ)
    print(f"Total question-like slides: {len(quiz)}")
    for s in quiz:
        print(f"  slide {s['slide']:3d} qnums={s['qnums']} | {s['text'][:140]}")

    # Full slide dump for stub question numbers
    print("\n" + "=" * 72)
    print("PPT SLIDES MATCHING STUB QUESTION NUMBERS")
    print("=" * 72)
    stub_map = {"QA": "L07", "QB": "L08", "QC": "L09", "Qz": "quiz"}
    stub_nums = {}
    for prefix, items in bank.items():
        stub_nums[prefix] = [i["n"] for i in items if i["stub"]]

    for idx, body in slide_texts(PPT_MAIN):
        for prefix, lesson in [("QA", "L07"), ("QB", "L08"), ("QC", "L09")]:
            for n in stub_nums.get(prefix, []):
                if re.search(rf"(?<![(\d]){n}\.\s", body):
                    print(f"\n[{prefix}{n}] MAIN slide {idx}:")
                    print(body[:800])

    for idx, body in slide_texts(PPT_QUIZ):
        for n in stub_nums.get("Qz", []):
            if re.search(rf"(?<![(\d]){n}\.\s", body) or (n == "1" and "1." in body[:30]):
                print(f"\n[Qz{n}] QUIZ slide {idx}:")
                print(body[:800])


if __name__ == "__main__":
    main()
