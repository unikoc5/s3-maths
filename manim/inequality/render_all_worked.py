"""Batch-render inequality worked-solution decks from questions.json.

Usage (from dashboard/):
    ..\\KOC_web - reference\\.venv\\Scripts\\python.exe manim\\inequality\\render_all_worked.py --quality l
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from manim import tempconfig

HERE = Path(__file__).resolve().parent
DASH = HERE.parents[1]
DATA = HERE / "questions.json"
VENV_MS = DASH.parent / "KOC_web - reference" / ".venv" / "Scripts" / "manim-slides.exe"
MEDIA = DASH / ".manim-media"
SLIDES = DASH / "slides" / "inequality"

sys.path.insert(0, str(HERE))
sys.path.insert(0, str(DASH / "tools"))
from worked_solutions import IneqWorkedScene  # noqa: E402
from gen_ineq_worked_data import EXTRA_QUIZ  # noqa: E402

QUALITY = {"l": "low_quality", "m": "medium_quality", "h": "high_quality", "p": "fourk_quality"}


def deck_id(q: dict) -> str:
    if q.get("deck_id"):
        return q["deck_id"]
    qid = q["id"]
    m = re.match(r"INEQ-L03-Q(\d+)$", qid)
    if m:
        return f"qa{m.group(1)}-solution"
    m = re.match(r"INEQ-QZ-Q(\d+)([a-z]?)$", qid, re.I)
    if m:
        return f"qz{m.group(1)}{m.group(2).lower()}-solution"
    return qid.lower().replace("_", "-") + "-solution"


def scene_name(q: dict) -> str:
    return deck_id(q).replace("-", "_").title().replace("_", "")


def load_questions(prefix: str = "", only: str = ""):
    with DATA.open(encoding="utf-8") as f:
        qs = {q["id"]: q for q in json.load(f)["questions"]}
    for eq in EXTRA_QUIZ:
        qs.setdefault(eq["id"], eq)
    qs = list(qs.values())
    if prefix:
        qs = [q for q in qs if q["id"].startswith(prefix)]
    if only:
        ids = {x.strip() for x in only.split(",")}
        qs = [q for q in qs if q["id"] in ids]
    for q in qs:
        q["deck_id"] = deck_id(q)
    return qs


def render_one(q: dict, quality: str, retries: int = 3):
    IneqWorkedScene.Q = q
    out_name = q["deck_id"]
    last_exc = None
    for attempt in range(retries):
        try:
            with tempconfig({
                "quality": QUALITY[quality],
                "output_file": out_name,
                "media_dir": str(MEDIA),
                "disable_caching": attempt > 0,
                "verbosity": "ERROR",
            }):
                IneqWorkedScene().render()
            return
        except Exception as exc:
            last_exc = exc
            if attempt + 1 < retries:
                print(f"  retry {attempt + 2}/{retries} ({q['id']})", flush=True)
    raise last_exc


def patch_html_embed(out_html: Path):
    """Embed-friendly Reveal config + restart background video on each slide."""
    if not out_html.is_file():
        return
    text = out_html.read_text(encoding="utf-8")
    text = text.replace("embedded: false", "embedded: true")
    text = text.replace("autoPlayMedia: null", "autoPlayMedia: true")
    if "playCurrentBgVideo" not in text:
        inject = """
      function playCurrentBgVideo() {
        try {
          var slide = Reveal.getCurrentSlide();
          if (!slide || !slide.slideBackgroundContentElement) return;
          var vids = slide.slideBackgroundContentElement.getElementsByTagName("video");
          for (var i = 0; i < vids.length; i++) {
            vids[i].currentTime = 0;
            vids[i].muted = true;
            vids[i].play().catch(function () {});
          }
        } catch (e) {}
      }
      Reveal.on("ready", playCurrentBgVideo);
      Reveal.on("slidechanged", playCurrentBgVideo);
"""
        text = text.replace("Reveal.addKeyBinding(", inject + "      Reveal.addKeyBinding(")
    out_html.write_text(text, encoding="utf-8")


def convert_one(q: dict):
    out_dir = SLIDES / q["deck_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_html = out_dir / "index.html"
    exe = str(VENV_MS)
    subprocess.run(
        [
            exe, "convert", "--to=html",
            "-c", "embedded=true",
            "-c", "auto_play_media=true",
            q["deck_id"], str(out_html),
        ],
        cwd=str(DASH),
        check=False,
    )
    patch_html_embed(out_html)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quality", default="l", choices=list(QUALITY))
    ap.add_argument("--prefix", default="")
    ap.add_argument("--only", default="")
    ap.add_argument("--convert-only", action="store_true")
    ap.add_argument("--render-only", action="store_true")
    ap.add_argument("--missing", action="store_true", help="skip decks that already have index.html")
    args = ap.parse_args()

    qs = load_questions(args.prefix, args.only)
    if args.missing:
        qs = [q for q in qs if not (SLIDES / q["deck_id"] / "index.html").is_file()]
    total = len(qs)
    failed = []
    for i, q in enumerate(qs, 1):
        print(f"[{i}/{total}] {q['id']} -> {q['deck_id']}", flush=True)
        try:
            if not args.convert_only:
                render_one(q, args.quality)
            if not args.render_only:
                convert_one(q)
        except Exception as exc:
            msg = str(exc).encode("ascii", "replace").decode("ascii")
            failed.append((q["id"], msg))
            print(f"  FAILED: {q['id']}: {msg}", flush=True)
    print(f"done: {total - len(failed)}/{total} decks", flush=True)
    if failed:
        print("failures:", ", ".join(f[0] for f in failed), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
