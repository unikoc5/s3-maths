# Factorization — Geometric (Area-Model) Proofs of the Three Identities

Design notes + research for the **Concept & Formula** Manim slides.

The three identities (as shown to students):

$$(a+b)^2 \equiv a^2 + 2ab + b^2$$
$$(a-b)^2 \equiv a^2 - 2ab + b^2$$
$$(a+b)(a-b) \equiv a^2 - b^2$$

All three are proved by **area conservation**: a region is cut and rearranged; only the
arrangement changes, so the total area before = total area after. That conservation *is*
the proof.

---

## 1. $(a+b)^2 = a^2 + 2ab + b^2$ — square dissection

Take a square of side $(a+b)$, so its area is $(a+b)^2$. Cut each side into a segment of
length $a$ and a segment of length $b$. The two cuts split the square into **four** pieces:

| Piece | Dimensions | Area |
|-------|-----------|------|
| Square (corner) | $a \times a$ | $a^2$ |
| Rectangle | $a \times b$ | $ab$ |
| Rectangle | $b \times a$ | $ab$ |
| Square (corner) | $b \times b$ | $b^2$ |

Summing: $(a+b)^2 = a^2 + ab + ab + b^2 = a^2 + 2ab + b^2$. The doubling of $ab$ is visible
as **two congruent rectangles**.

## 2. $(a-b)^2 = a^2 - 2ab + b^2$ — over-subtraction model

Start from a square of side $a$ (area $a^2$). The target inner square has side $(a-b)$.
Remove **two** $a \times b$ strips (one along a full side, one along the adjacent full
side); together they remove $2ab$. But the strips **overlap** in a $b \times b$ corner, so
that corner is removed **twice**. Add the $b^2$ corner back once:

$$(a-b)^2 = a^2 - ab - ab + b^2 = a^2 - 2ab + b^2.$$

The remaining (un-removed, not-double-counted) region is exactly the $(a-b)\times(a-b)$
square. This "subtract two strips, add back the doubly-removed corner" story is the
clearest visual (inclusion–exclusion on area).

## 3. $a^2 - b^2 = (a+b)(a-b)$ — L-shape (gnomon) rearrangement

Start from a square of side $a$ (area $a^2$). Remove a square of side $b$ from one corner
(area $b^2$). What remains is an **L-shaped gnomon** of area $a^2 - b^2$. Cut the gnomon
into two rectangles:

- top piece: $a \times (a-b)$
- bottom piece: $(a-b) \times b$

Rotate the bottom piece $90^\circ$ and slide it against the top piece. The two combine into
a single rectangle of width $(a+b)$ and height $(a-b)$:

$$a^2 - b^2 = (a+b)(a-b).$$

Area is preserved through the cut + rotate + join, so the L-shape area $a^2-b^2$ equals the
rectangle area $(a+b)(a-b)$.

---

## Color system (consistent symbol ↔ color)

The same symbol always uses the same color so the eye can follow substitutions and areas:

| Symbol / region | Color | Hex |
|-----------------|-------|-----|
| variable `a`, side `a`, area `a²` | blue | `#4FC3F7` |
| variable `b`, side `b`, area `b²` | amber | `#FFD54F` |
| product `ab` rectangles / term `2ab` | green | `#81C784` |
| "removed" / subtracted ink | red | `#E57373` |
| ink / outlines / neutral text | white | `#FFFFFF` |
| slide background | dark slate | `#0f172a` |

Rules:
- When a number is substituted for a variable, the number takes the variable's color
  (e.g. `a = 3` → the `3` is blue; `b = 2` → the `2` is amber).
- A region's fill color matches the algebra term it represents (so `a²` text is blue and
  sits in the blue square, `2ab` is green, `b²` is amber).
- Visual side lengths are proportional to `a` and `b` (`a` drawn longer than `b`) so the
  areas genuinely correspond to the quantities.

## Sources

- Math Doubts — $(a+b)^2$ geometric proof: https://www.mathdoubts.com/a-plus-b-whole-square-geometric-proof/
- Math Doubts — $a^2-b^2$ geometric proof: https://www.mathdoubts.com/a-squared-minus-b-squared-geometric-proof/
- ProofWiki — Square of Sum (Euclid, Elements II.4): https://proofwiki.org/wiki/Square_of_Sum/Geometric_Proof
- math1089 — Geometric proofs of algebraic identities (Part 1): https://math1089.in/2021/01/06/geometric-proofs-of-few-algebraic-identities-part-1/
- NCERT Class 9 lab activity — verify $(a-b)^2$: https://www.cbsetuts.com/ncert-class-9-maths-lab-manual-verify-algebraic-identity-ab2-a2-2ab-b2/
- MSTE Illinois — difference of two squares paper model: https://mste.illinois.edu/dildine/times/diff2sq.pdf
- NCTM Illuminations — interactive $(a+b)^2$ investigation: https://www.nctm.org/Classroom-Resources/Illuminations/Interactives/A-Geometric-Investigation-of-(a-_-b)%5E2/
