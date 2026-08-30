/* JM29 comics — key pages, then two follow-up checks when a concept is complete. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "para-definition",
      chip: "P1",
      title: "What is a parallelogram?",
      chapter: "P1A \u00b7 Definition",
      image: "comics/01-para-definition.png?v=20260818-jm29n",
    },
    {
      id: "para-prove-map",
      chip: "P2",
      title: "Four prove tests — the map",
      chapter: "P1B \u00b7 Prove map",
      image: "comics/02-para-five-tests-map.png?v=20260818-jm29h",
      checks: [
        {
          id: "para1",
          prompt: "A parallelogram is a quadrilateral with",
          choices: [
            "exactly one pair of parallel sides",
            "both pairs of opposite sides parallel",
            "all four sides equal, and no other condition",
            "one pair of equal adjacent sides",
          ],
          answer: 1,
          explain: "By definition, both pairs of opposite sides are parallel. The other properties follow from that.",
        },
        {
          id: "para2",
          prompt: "Which statement can be used as a test that ABCD is a parallelogram?",
          choices: [
            "Only one pair of opposite sides is equal",
            "The diagonals are equal, and nothing else is known",
            "Both pairs of opposite sides are equal",
            "One angle is 90°",
          ],
          answer: 2,
          explain: "Opposite sides equal (both pairs) is one of the standard parallelogram tests. Equal diagonals alone would fit a rectangle or an isosceles trapezium.",
        },
      ],
    },
    {
      id: "opp-sides-equal",
      chip: "P3",
      title: "Opp. sides equal — stick intuition",
      chapter: "P2 \u00b7 Opp. sides equal",
      image: "comics/03-opp-sides-equal-setup.png?v=20260827-jm29ae",
      checks: [
        {
          id: "side1",
          prompt: "In parallelogram ABCD, AB = 7 cm and AD = 4 cm. What is CD?",
          choices: ["4 cm", "7 cm", "11 cm", "Cannot tell"],
          answer: 1,
          explain: "Opposite sides of a parallelogram are equal, so CD = AB = 7 cm.",
        },
        {
          id: "side2",
          prompt: "A quadrilateral has AB = CD and AD = BC. This is enough to prove it is a parallelogram because",
          choices: [
            "equal sides force a right angle",
            "both pairs of opposite sides are equal",
            "the diagonals must be perpendicular",
            "one pair of sides is parallel",
          ],
          answer: 1,
          explain: "Opposite sides equal (both pairs) is a parallelogram test.",
        },
      ],
    },
    {
      id: "opp-angles-int",
      chip: "P4",
      title: "Why opposite angles are equal",
      chapter: "P3 \u00b7 Opposite angles",
      image: "comics/05-opp-angles-equal-why.png?v=20260827-jm29ae",
      checks: [
        {
          id: "ang1",
          prompt: "In a parallelogram, opposite angles are equal and consecutive angles",
          choices: [
            "are also equal",
            "add to 90°",
            "add to 180°",
            "add to 360°",
          ],
          answer: 2,
          explain: "Consecutive angles are co-interior on parallel sides, so they are supplementary (sum 180°).",
        },
        {
          id: "ang2",
          prompt: "One angle of a parallelogram is 112°. The opposite angle is",
          choices: ["68°", "112°", "248°", "90°"],
          answer: 1,
          explain: "Opposite angles are equal, so the opposite angle is also 112°. The consecutive angle would be 68°.",
        },
      ],
    },
    {
      id: "one-pair-equal-parallel",
      chip: "P5",
      title: "Why 1 pair // and equal works",
      chapter: "P4 \u00b7 1 pair // and equal",
      image: "comics/06-one-pair-equal-parallel.png?v=20260827-jm29r",
      checks: [
        {
          id: "pair1",
          prompt: "ABCD has AB // DC and AB = DC. Then ABCD is a parallelogram because",
          choices: [
            "one pair of opposite sides is both parallel and equal",
            "all sides must then be equal",
            "the diagonals bisect each other automatically",
            "AB // DC alone is already enough",
          ],
          answer: 0,
          explain: "One pair of opposite sides that is both parallel and equal is a parallelogram test. Parallel alone would only make a trapezium.",
        },
        {
          id: "pair2",
          prompt: "A trapezium has exactly one pair of parallel sides. To upgrade it to a parallelogram you still need",
          choices: [
            "those parallel sides to be equal",
            "a right angle",
            "equal diagonals",
            "equal adjacent sides",
          ],
          answer: 0,
          explain: "If that unique parallel pair is also equal, the figure meets the “one pair // and equal” test.",
        },
      ],
    },
    {
      id: "diags-rotate-180",
      chip: "P6",
      title: "Diagonals & rotate 180°",
      chapter: "P5 \u00b7 Diags. bisect",
      image: "comics/07-diags-bisect-why.png?v=20260827-jm29w",
      checks: [
        {
          id: "diag1",
          prompt: "The diagonals of a parallelogram",
          choices: [
            "are always equal",
            "are always perpendicular",
            "bisect each other",
            "bisect the vertex angles",
          ],
          answer: 2,
          explain: "In every parallelogram the diagonals bisect each other. Equal or perpendicular diagonals need extra conditions (rectangle, rhombus, …).",
        },
        {
          id: "diag2",
          prompt: "Diagonals AC and BD of quadrilateral ABCD meet at M, with AM = MC and BM = MD. Then ABCD is a parallelogram because",
          choices: [
            "the diagonals are equal",
            "the diagonals bisect each other",
            "M is the mid-point of one side",
            "the figure has a line of symmetry",
          ],
          answer: 1,
          explain: "Diagonals bisecting each other is a parallelogram test.",
        },
      ],
    },
    {
      id: "rhombus-definition",
      chip: "P7",
      title: "What is a rhombus?",
      chapter: "P6 \u00b7 Rhombus",
      image: "comics/08-rhombus-definition.png?v=20260827-jm29y",
      checks: [
        {
          id: "rho1",
          prompt: "A rhombus is a parallelogram with",
          choices: [
            "equal diagonals",
            "all sides equal",
            "four right angles",
            "exactly one pair of parallel sides",
          ],
          answer: 1,
          explain: "A rhombus is an equilateral parallelogram — all four sides equal.",
        },
        {
          id: "rho2",
          prompt: "Which statement is true for every rhombus?",
          choices: [
            "It must be a square",
            "Its diagonals are equal",
            "Its opposite angles are equal",
            "It has no parallel sides",
          ],
          answer: 2,
          explain: "A rhombus is still a parallelogram, so opposite angles are equal. It is a square only if the angles are also 90°.",
        },
      ],
    },
    {
      id: "rhombus-diags-perp",
      chip: "P8",
      title: "Symmetry → right angle at centre",
      chapter: "P7A \u00b7 Diags. of rhombus ⊥",
      image: "comics/09-rhombus-diags-perp.png?v=20260827-jm29u",
    },
    {
      id: "rhombus-bisect-angles",
      chip: "P9",
      title: "Same symmetry bisects angles",
      chapter: "P7B \u00b7 Diags. bisect ∠s",
      image: "comics/10-rhombus-bisect-angles.png?v=20260827-jm29z",
      checks: [
        {
          id: "rd1",
          prompt: "The diagonals of a rhombus",
          choices: [
            "are equal and never perpendicular",
            "bisect each other at right angles",
            "are parallel",
            "are always longer than the sides",
          ],
          answer: 1,
          explain: "Rhombus diagonals are perpendicular bisectors of each other.",
        },
        {
          id: "rd2",
          prompt: "In a rhombus, each diagonal",
          choices: [
            "is equal to a side",
            "bisects the two angles at the vertices it joins",
            "is parallel to a pair of sides",
            "is twice the other diagonal",
          ],
          answer: 1,
          explain: "The same symmetry that makes the diagonals perpendicular also makes each diagonal an angle bisector.",
        },
      ],
    },
    {
      id: "square-definition",
      chip: "P10",
      title: "Square = definition",
      chapter: "P8A \u00b7 Square",
      image: "comics/11-square-definition.png?v=20260827-jm29ac",
    },
    {
      id: "square-diags",
      chip: "P11",
      title: "Square diagonals → 45°",
      chapter: "P8B \u00b7 Square diags.",
      image: "comics/12-square-diags.png?v=20260827-jm29ac",
      checks: [
        {
          id: "sq1",
          prompt: "A square is a rhombus that is also a",
          choices: ["trapezium", "kite only", "rectangle", "triangle"],
          answer: 2,
          explain: "A square has all sides equal (rhombus) and four right angles (rectangle).",
        },
        {
          id: "sq2",
          prompt: "The diagonals of a square",
          choices: [
            "are unequal",
            "are equal and bisect each other at 90°, splitting the corners into 45°",
            "meet at 60°",
            "do not bisect the angles",
          ],
          answer: 1,
          explain: "Square diagonals are equal, perpendicular, and bisect the 90° corners into 45°.",
        },
      ],
    },
    {
      id: "trapezium-definition",
      chip: "P12",
      title: "What is a trapezium?",
      chapter: "P9 \u00b7 Trapezium",
      image: "comics/13-trapezium-definition.png?v=20260827-jm29ae",
      checks: [
        {
          id: "trap1",
          prompt: "In this course a trapezium is a quadrilateral with",
          choices: [
            "both pairs of opposite sides parallel",
            "exactly one pair of parallel sides",
            "all sides equal",
            "no parallel sides",
          ],
          answer: 1,
          explain: "British usage here: exactly one pair of parallel sides (the bases).",
        },
        {
          id: "trap2",
          prompt: "An isosceles trapezium has",
          choices: [
            "all four sides equal",
            "equal non-parallel sides (the legs) and equal base angles",
            "perpendicular diagonals only",
            "no equal angles",
          ],
          answer: 1,
          explain: "The two legs are equal, so the base angles are equal and the diagonals are equal.",
        },
      ],
    },
  ];

  function start() {
    if (window.initJmComics) window.initJmComics(COMICS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
