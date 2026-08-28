# KOC S3 Math Dashboard (Summer 2026)

Interactive math dashboard for the five S3 summer topics. Each topic has three parts:

1. **Concept & Formula** — Manim-Slides animations explaining the formula *and* its
   underlying geometric / visual proof (LaTeX throughout).
2. **Interactive Tool** — an in-browser widget (sliders / toggles + live math).
3. **Worked Problem** — a chosen exam-style problem walked through step-by-step using a
   dual-panel animation system (Main Simulation + Diagram Analysis), mirroring
   `../KOC_web - reference/output/index.html`.

## Topics

| # | Folder | Source material |
|---|--------|-----------------|
| 1 | Factorization | `../S3 MATH summer 2026/L01-02 More about Factorization` |
| 2 | Inequality | `../S3 MATH summer 2026/L03 Inequality` |
| 3 | Percentages | `../S3 MATH summer 2026/L04-06 Percentages` |
| 4 | Area and Volume | `../S3 MATH summer 2026/L07-09 Area and Volume` |
| 5 | Probability | `../S3 MATH summer 2026/L10-12 Probability` |

## Folder layout

```
dashboard/
  README.md
  requirements.txt
  render.ps1                       one-command render + HTML convert helper
  manim/
    shared/styles.py               shared colors + helpers (consistent symbol↔color)
    factorization/
      identities_geometry.py       (a+b)², (a-b)², (a+b)(a-b) area proofs
  slides/
    factorization/                 rendered Manim-Slides HTML decks (generated)
  docs/
    factorization/
      GEOMETRY_PROOFS.md           research notes + sources for the proofs
```

## Rendering (uses the reference venv)

The Python environment from `../KOC_web - reference/.venv` (manim 0.20.1,
manim-slides 5.6.0, Python 3.14) is reused.

```powershell
# Render one scene to an HTML slide deck
.\render.ps1 -SceneName PerfectSquareSum -Deck factorization/perfect-square-sum
```

See `docs/factorization/GEOMETRY_PROOFS.md` for the math + design rationale.
