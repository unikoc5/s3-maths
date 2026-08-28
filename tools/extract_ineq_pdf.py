"""Extract text from L03 Inequality PDFs for question inventory."""
from pathlib import Path
import fitz  # PyMuPDF

BASE = Path(r"C:\Users\Kinny\Desktop\KOC_math_dashboard_2\S3 MATH summer 2026\L03 Inequality\PDF")
FILES = [
    "Pre S3 L03 - Inequality - 2025 (QUE).pdf",
    "Pre S3 L03 Inequality Quiz (QUE).pdf",
    "Pre S3 L03 Inequality Quiz (ANS).pdf",
]

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "_ineq_pdf_dump.txt"
    with out.open("w", encoding="utf-8") as f:
        for fname in FILES:
            p = BASE / fname
            f.write(f"\n{'='*60}\n{fname}\n{'='*60}\n")
            if not p.exists():
                f.write("MISSING\n")
                continue
            doc = fitz.open(p)
            for i, page in enumerate(doc, 1):
                text = page.get_text().strip()
                if text:
                    f.write(f"\n--- page {i} ---\n{text}\n")
    print("wrote", out)
