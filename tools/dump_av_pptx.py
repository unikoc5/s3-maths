"""Dump all text from Area & Volume PowerPoints for manual audit."""
import re, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
AV = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\S3 MATH summer 2026\L07-09 Area and Volume\PPT")
OUT = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\dashboard\tools\av_ppt_dump.txt")

def slide_texts(pptx):
    with zipfile.ZipFile(pptx) as z:
        names = sorted([n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
                       key=lambda s: int(re.search(r"slide(\d+)", s).group(1)))
        for sn in names:
            idx = int(re.search(r"slide(\d+)", sn).group(1))
            root = ET.fromstring(z.read(sn))
            parts = [t.text for t in root.iter(f"{{{NS['a']}}}t") if t.text]
            yield idx, re.sub(r"\s+", " ", " ".join(parts)).strip()

lines = []
for pptx in sorted(AV.glob("*.pptx")):
    lines.append(f"\n{'='*80}\nFILE: {pptx.name}\n{'='*80}")
    for idx, body in slide_texts(pptx):
        lines.append(f"\n--- slide {idx} ---")
        lines.append(body if body else "(no extractable text)")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT} ({len(lines)} lines)")
