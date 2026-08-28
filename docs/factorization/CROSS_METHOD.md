# Cross Method ↔ Area Model — research + visualization design

The lesson (L01-02) factorises quadratics with the **cross method (十字相乘法)**. This doc
explains the underlying geometry (the **area / generic-rectangle model**) and how to animate
the bridge between them.

## The cross method (as taught in the PPT)

For `x² + bx + c = (x + p)(x + q)`:

```
   x  ⤫  +p        cross products:  x·(+q) = qx
   x  ⤫  +q                         x·(+p) = px
                                    ───────────────
                                    sum = (p+q)x = bx   ✓
   →  (x + p)(x + q)
```

- Left column multiplies to the `x²` coefficient (here `1`).
- Right column multiplies to the constant `c` (so `pq = c`).
- The two cross-products must sum to the middle coefficient `b` (so `p + q = b`).

The deck extends this to: negative cases (`x²−bx+c`, `x²±bx−c`), two variables
(`p²+8pq+15q²`), common-factor-first (`3b²−36b+81`), and leading coefficient ≠ 1
(`2x²−19x+45`, `(2x+3)(7x+2)` etc.).

## The geometry: area model (generic rectangle)

`(x + p)(x + q)` is the area of a rectangle with width `x+p` and height `x+q`. It tiles into
a 2×2 grid:

```
            x          + p
        ┌─────────┬──────────┐
   x    │   x²    │    p·x    │
        ├─────────┼──────────┤
   + q  │   q·x   │    p·q    │
        └─────────┴──────────┘
```

| Cell | Area | Role in the trinomial |
|------|------|------------------------|
| top-left | `x²` | first term |
| bottom-right | `pq` | constant term `c` |
| top-right + bottom-left | `px + qx` | middle term `bx` |

**Key bridge:** the "cross" of the cross method = the two **off-diagonal** cells. Their sum
`px + qx = (p+q)x = bx` is exactly the "check the middle term" step. Factorising = given the
area (the trinomial), recover the side lengths `x+p` and `x+q`. The proof is **area
conservation**: the four cells always reassemble into the full `(x+p)(x+q)` rectangle.

### Leading coefficient ≠ 1  (`ax² + bx + c`)
Rectangle is `(mx + p)(nx + q)` with `mn = a`, `pq = c`, and `mq + np = b`. The cross
method's left column entries `mx, nx` multiply to `ax²`; the grid's off-diagonal cells
`mqx` and `npx` sum to `bx`.

### Sign handling
- both positive (`x²+bx+c`): clean positive-area rectangle.
- both negative (`x²−bx+c`): rectangle `(x−p)(x−q)`; visualise via a square of side `x`
  with strips removed (same inclusion–exclusion idea as `(a−b)²`).
- opposite signs (`x²+bx−c`): needs **signed tiles / zero pairs** (algebra-tile model) —
  the cleanest honest visual uses positive and negative tiles that cancel.

## Visualization plan (Manim slides)

Run the **cross method and the rectangle side-by-side**, same color system as the identity
slides (`x` blue; numbers in accent colors; each grid cell filled to match; side lengths
drawn proportional so areas correspond).

1. Show `x² + bx + c`.
2. Lay the `x²` tile (blue square) + the `c` block (amber): "what rectangle has this area?"
3. Run the cross method to find `p, q`.
4. The cross-multiply arrows **morph into** the two off-diagonal rectangles `px`, `qx`
   (green): the cross = the two middle cells.
5. The two green cells slide together into the `bx` strip → middle term checks out.
6. Read side lengths `x+p`, `x+q` off the rectangle → `(x+p)(x+q)`, boxed.
7. Numeric instance (e.g. `x²+5x+6`), color-coded.

Stretch scenes: a negative case and a leading-coefficient-≠-1 (box-method) case.

## Sources

- NIE / NTU Singapore — comparing the cross-method with the Rectangle Diagram & AlgeCards
  (area conservation, "form a rectangle, find length/breadth"):
  https://repository.nie.edu.sg/bitstreams/553e6088-0558-4b27-8083-f6d1e14bfa96/download
- Oak National Academy — factorising `x²+bx+c` with an area model / algebra tiles:
  https://www.thenational.academy/teachers/programmes/maths-secondary-ks4-higher/units/algebraic-manipulation/lessons/factorising-a-quadratic-expression
- Purplemath — box method for `a ≠ 1`: https://www.purplemath.com/modules/factquad2.htm
- ChiliMath — box/grid method for trinomials: https://www.chilimath.com/lessons/intermediate-algebra/factoring-trinomial-box-method/
- Lesson source: `S3 MATH summer 2026/L01-02 More about Factorization/PPT/Pre S3 Maths L01-02 - More about Factorization (2025).pptx` (cross method on slides 9, 11, 13, 21)
