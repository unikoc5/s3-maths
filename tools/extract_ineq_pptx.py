import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

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


def dump(pptx: Path, label: str):
    print(f"\n=== {label}: {pptx.name} ===")
    for idx, body in slide_texts(pptx):
        if not body:
            continue
        nums = re.findall(r"(?<!\()\b(\d{1,3})\.", body)
        if nums or re.search(r"inequal|Solve|Find|Which|Hence|number line|x\s*[<>≤≥=]", body, re.I):
            print(f"Slide {idx:2d} | nums={nums} | {body[:400]}")


if __name__ == "__main__":
    base = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\S3 MATH summer 2026\L03 Inequality\PPT")
    dump(base / "Pre S3 Maths L03 - Inequality (2025).pptx", "MAIN")
    dump(base / "Pre S3 Maths L03 Inequality Quiz (2025).pptx", "QUIZ")
    dump(base / "Pre S3 Maths L03 Inequality Quiz (ANS) james.pptx", "QUIZ ANS")
