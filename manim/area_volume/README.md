# Area & Volume — Manim slides

Part 1 (Concept & Formula) decks for the Area & Volume topic (L07–L09).

## Files

| File | What it is |
|------|------------|
| `av_styles.py` | Shared palette + the symbol→colour table (single source of truth). |
| `av_common.py` | `RevealSlide` (step-by-step formula reveal engine) + layout/helpers shared by the decks. |
| `plane_shapes.py` | `PlaneShapes` deck: areas of the 2D shapes (square, rectangle, parallelogram, rhombus, triangle, trapezium, circle, sector). |
| `solid_volumes.py` | `SolidVolumes` deck: volume & surface area of solids (prism, cylinder, pyramid, cone-volume, cone-surface, sphere) drawn as oblique 3D figures. |

One slide per shape — figure centre-left, formula centre-right; each symbol keeps
a fixed colour and is "derived" from the figure into the formula with
`TransformFromCopy`, then operators (`/2`, `×`, exponents) appear step by step.

## Colour convention

Same symbol = same colour everywhere (figure label **and** formula), so a number
substituted for a variable should reuse that variable's colour:

| symbol | colour | | symbol | colour |
|--------|--------|-|--------|--------|
| `l` length/side | blue | | `d₁` / `d₂` | blue / pink |
| `w` width, `b` base | amber | | `b₁` / `b₂` | blue / amber |
| `h` height | green | | `r` radius | blue |
| | | | `θ` angle | violet |

## Render

Uses the shared venv at `../../../KOC_web - reference/.venv`.

```powershell
$venv = "..\..\..\KOC_web - reference\.venv\Scripts"
# 2D shapes
& "$venv\manim-slides.exe" render plane_shapes.py PlaneShapes --quality h
& "$venv\manim-slides.exe" convert PlaneShapes ..\..\slides\area_volume\plane-shapes\index.html --to html
# 3D solids
& "$venv\manim-slides.exe" render solid_volumes.py SolidVolumes --quality h
& "$venv\manim-slides.exe" convert SolidVolumes ..\..\slides\area_volume\solids\index.html --to html
```

Output decks (`index_assets/` holds the per-slide videos):
- `dashboard/slides/area_volume/plane-shapes/index.html`
- `dashboard/slides/area_volume/solids/index.html`

> `media/` and `slides/files/` here are Manim build caches and can be deleted /
> regenerated at any time.
