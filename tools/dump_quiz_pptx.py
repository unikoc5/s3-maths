import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
p = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\S3 MATH summer 2026\L03 Inequality\PPT\Pre S3 Maths L03 Inequality Quiz (2025).pptx")
with zipfile.ZipFile(p) as z:
    names = sorted(
        [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
        key=lambda s: int(re.search(r"slide(\d+)", s).group(1)),
    )
    for sn in names:
        idx = int(re.search(r"slide(\d+)", sn).group(1))
        root = ET.fromstring(z.read(sn))
        parts = [t.text for t in root.iter(f"{{{NS['a']}}}t") if t.text]
        body = re.sub(r"\s+", " ", " ".join(parts)).strip()
        if body:
            print(f"--- slide {idx} ---\n{body}\n")
