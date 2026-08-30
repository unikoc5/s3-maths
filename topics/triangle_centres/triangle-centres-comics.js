/* JM28 comics — linear JM35 reader + two follow-ups when a concept finishes. */
(function () {
  "use strict";

  var CHECKS = {
    triangleLines: {
      ch1: [
        {
          id: "t1a",
          prompt: "In \\(\\triangle ABC\\), which segment is the altitude from vertex A?",
          choices: [
            "AD, where D lies on BC (or its extension) and \\(\\angle ADB = 90^{\\circ}\\)",
            "AM, where M is the mid-point of BC",
            "AE, which splits \\(\\angle A\\) into two equal parts",
            "The line through the mid-point of BC at right angles to BC",
          ],
          answer: 0,
          explain: "An altitude is perpendicular to the line containing the opposite side.",
        },
        {
          id: "t1b",
          prompt: "An altitude of a triangle always",
          choices: [
            "meets the opposite side at its mid-point",
            "is perpendicular to the line of the opposite side",
            "bisects the vertex angle",
            "stays inside an obtuse triangle",
          ],
          answer: 1,
          explain: "Perpendicular is the definition. In an obtuse triangle two altitudes fall outside.",
        },
      ],
      ch2: [
        {
          id: "t2a",
          prompt: "In \\(\\triangle PQR\\), which segment is the median from Q?",
          choices: [
            "QS, where S is the mid-point of PR",
            "QT, where T lies on PR and \\(\\angle QTP = 90^{\\circ}\\)",
            "QU, which splits \\(\\angle Q\\) into two equal parts",
            "The perpendicular bisector of PR",
          ],
          answer: 0,
          explain: "A median joins a vertex to the mid-point of the opposite side.",
        },
        {
          id: "t2b",
          prompt: "A median splits the opposite side into",
          choices: ["two perpendicular parts", "two equal lengths", "two equal angles", "a 2 : 1 ratio"],
          answer: 1,
          explain: "Mid-point means two equal halves. The 2 : 1 ratio is for the centroid on the median.",
        },
      ],
      ch3: [
        {
          id: "t3a",
          prompt: "Ray AE from A is the angle bisector of \\(\\angle BAC\\) when",
          choices: ["\\(\\angle BAE = \\angle EAC\\)", "BE = EC", "AE \\(\\perp\\) BC", "AB = AC"],
          answer: 0,
          explain: "An angle bisector divides one angle into two equal angles.",
        },
        {
          id: "t3b",
          prompt: "Every point on an angle bisector is",
          choices: [
            "equidistant from the two arms of the angle",
            "equidistant from the three vertices",
            "the mid-point of the opposite side",
            "outside the triangle",
          ],
          answer: 0,
          explain: "That equal-distance property is why the in-centre is the incentre of the incircle.",
        },
      ],
      ch4: [
        {
          id: "t4a",
          prompt: "M is the mid-point of BC. The perpendicular bisector of BC is",
          choices: [
            "the line through M perpendicular to BC",
            "segment AM from A to M",
            "a line through B perpendicular to AC",
            "the angle bisector of \\(\\angle A\\)",
          ],
          answer: 0,
          explain: "It must pass through the mid-point and be perpendicular to the side — it need not go through a vertex.",
        },
        {
          id: "t4b",
          prompt: "Every point on the perpendicular bisector of BC is",
          choices: [
            "closer to B than to C",
            "equidistant from B and C",
            "on the altitude from A",
            "the centroid",
          ],
          answer: 1,
          explain: "That is why the three perpendicular bisectors meet at the circumcentre.",
        },
      ],
      ch5: [
        {
          id: "t5a",
          prompt: "The orthocentre is the meeting point of the three",
          choices: ["altitudes", "medians", "internal angle bisectors", "perpendicular bisectors of the sides"],
          answer: 0,
          explain: "Orthocentre ↔ altitudes.",
        },
        {
          id: "t5b",
          prompt: "In an obtuse triangle the orthocentre lies",
          choices: ["inside the triangle", "outside the triangle", "at the mid-point of a side", "at the obtuse vertex only if it is isosceles"],
          answer: 1,
          explain: "Two altitudes fall outside, so they meet outside.",
        },
      ],
      ch6: [
        {
          id: "t6a",
          prompt: "The centroid is the meeting point of the three",
          choices: ["altitudes", "medians", "angle bisectors", "perpendicular bisectors"],
          answer: 1,
          explain: "Centroid ↔ medians. It is the balance point.",
        },
        {
          id: "t6b",
          prompt: "Where is the centroid of an obtuse triangle?",
          choices: ["Inside the triangle", "Outside the triangle", "On the longest side", "At the obtuse vertex"],
          answer: 0,
          explain: "The centroid stays inside every triangle.",
        },
      ],
      ch7: [
        {
          id: "t7a",
          prompt: "Which statement about the in-centre is true?",
          choices: [
            "It is the centre of the circle that touches all three sides, and it is inside both acute and obtuse triangles",
            "It is outside an obtuse triangle",
            "It is the meeting point of the three medians",
            "It is the centre of the circle through all three vertices",
          ],
          answer: 0,
          explain: "In-centre ↔ internal angle bisectors ↔ incircle. Always inside.",
        },
        {
          id: "t7b",
          prompt: "The in-centre is equidistant from",
          choices: ["the three vertices", "the three sides", "the three mid-points only", "one side only"],
          answer: 1,
          explain: "Those equal perpendicular distances are the in-radius.",
        },
      ],
      ch8: [
        {
          id: "t8a",
          prompt: "Where is the circumcentre of an obtuse triangle?",
          choices: ["Outside the triangle", "Inside the triangle", "At the obtuse vertex", "At the mid-point of the shortest side"],
          answer: 0,
          explain: "The circumcentre is outside when the triangle is obtuse (it is the mid-point of the hypotenuse in a right triangle).",
        },
        {
          id: "t8b",
          prompt: "The circumcentre is the centre of the circle through",
          choices: ["the three mid-points of the sides", "the three vertices", "the three feet of the altitudes", "one vertex only"],
          answer: 1,
          explain: "Circumcentre ↔ perpendicular bisectors ↔ circumcircle through A, B and C.",
        },
      ],
      quest1: [
        {
          id: "q1a",
          prompt: "The largest circle that fits inside a triangular cake uses the",
          choices: ["circumcentre", "centroid", "in-centre", "orthocentre"],
          answer: 2,
          explain: "The incircle touches all three sides, so its centre is the in-centre.",
        },
        {
          id: "q1b",
          prompt: "That centre is found as the intersection of the",
          choices: ["medians", "altitudes", "internal angle bisectors", "perpendicular bisectors"],
          answer: 2,
          explain: "Angle bisectors meet at the in-centre.",
        },
      ],
      quest2: [
        {
          id: "q2a",
          prompt: "A meeting point the same distance from three houses at the vertices of a triangle is the",
          choices: ["in-centre", "centroid", "orthocentre", "circumcentre"],
          answer: 3,
          explain: "Equal distance to the three vertices is the circumradius, so the point is the circumcentre.",
        },
        {
          id: "q2b",
          prompt: "You construct that point by drawing the",
          choices: ["three medians", "three altitudes", "perpendicular bisectors of the sides", "three angle bisectors"],
          answer: 2,
          explain: "Perpendicular bisectors meet at the circumcentre.",
        },
      ],
      quest3: [
        {
          id: "q3a",
          prompt: "A triangular board balances at the",
          choices: ["orthocentre", "circumcentre", "centroid", "in-centre"],
          answer: 2,
          explain: "The centroid is the centre of mass for a uniform triangular lamina.",
        },
        {
          id: "q3b",
          prompt: "The centroid divides each median in the ratio",
          choices: ["1 : 1", "2 : 1 (vertex to mid-point)", "3 : 1", "1 : 2 (vertex to mid-point)"],
          answer: 1,
          explain: "Vertex to centroid : centroid to mid-point = 2 : 1.",
        },
      ],
      quest4: [
        {
          id: "q4a",
          prompt: "Three paths that each meet a side at right angles lock together at the",
          choices: ["centroid", "in-centre", "circumcentre", "orthocentre"],
          answer: 3,
          explain: "Paths perpendicular to the sides are altitudes; they meet at the orthocentre.",
        },
        {
          id: "q4b",
          prompt: "In an acute triangle that locking point is",
          choices: ["inside the triangle", "outside the triangle", "on a side", "at a vertex always"],
          answer: 0,
          explain: "All three altitudes fall inside an acute triangle.",
        },
      ],
      law1: [
        {
          id: "l1a",
          prompt: "Match the line to the centre: medians meet at the",
          choices: ["orthocentre", "centroid", "in-centre", "circumcentre"],
          answer: 1,
          explain: "Medians → centroid.",
        },
        {
          id: "l1b",
          prompt: "Match the line to the centre: perpendicular bisectors meet at the",
          choices: ["orthocentre", "centroid", "in-centre", "circumcentre"],
          answer: 3,
          explain: "Perpendicular bisectors → circumcentre.",
        },
      ],
      law2: [
        {
          id: "l2a",
          prompt: "Which centre can lie outside the triangle?",
          choices: [
            "Centroid only",
            "In-centre only",
            "Orthocentre and circumcentre (obtuse case)",
            "All four centres",
          ],
          answer: 2,
          explain: "Centroid and in-centre stay inside. Orthocentre and circumcentre go outside when the triangle is obtuse.",
        },
        {
          id: "l2b",
          prompt: "In a right-angled triangle the circumcentre is",
          choices: [
            "the mid-point of the hypotenuse",
            "the right-angled vertex",
            "the mid-point of a leg",
            "outside the triangle",
          ],
          answer: 0,
          explain: "The hypotenuse is a diameter of the circumcircle.",
        },
      ],
    },
    anglePairs: {
      ch1: [
        {
          id: "a1a",
          prompt: "A transversal is",
          choices: [
            "a line that crosses two or more other lines",
            "a line that never meets another line",
            "a line that bisects an angle",
            "a line perpendicular to every line",
          ],
          answer: 0,
          explain: "One line cutting the others is the transversal.",
        },
        {
          id: "a1b",
          prompt: "Two lines cut by a transversal form how many angles at the two intersections together?",
          choices: ["4", "6", "8", "2"],
          answer: 2,
          explain: "Four angles at each crossing, eight in total.",
        },
      ],
      ch2: [
        {
          id: "a2a",
          prompt: "Corresponding angles occupy",
          choices: [
            "the same relative corner at the two intersections",
            "inside and opposite sides of the transversal",
            "inside and the same side of the transversal",
            "the same vertex",
          ],
          answer: 0,
          explain: "Think of an F-shape — same corner, two crossings.",
        },
        {
          id: "a2b",
          prompt: "A corresponding angle is 73°. If the lines are parallel, the matching corresponding angle is",
          choices: ["73°", "107°", "146°", "17°"],
          answer: 0,
          explain: "Corresponding angles are equal when the lines are parallel.",
        },
      ],
      ch3: [
        {
          id: "a3a",
          prompt: "Alternate angles lie",
          choices: [
            "inside the parallel lines and on opposite sides of the transversal",
            "outside the parallel lines and on the same side of the transversal",
            "at the same intersection only",
            "inside the parallel lines and on the same side of the transversal",
          ],
          answer: 0,
          explain: "Think of a Z-shape.",
        },
        {
          id: "a3b",
          prompt: "One alternate angle is 128°. The matching alternate angle is",
          choices: ["128°", "52°", "64°", "180°"],
          answer: 0,
          explain: "Alternate angles are equal when the lines are parallel.",
        },
      ],
      ch4: [
        {
          id: "a4a",
          prompt: "Two co-interior angles are \\(x\\) and 137°. If the lines are parallel, \\(x\\) is",
          choices: ["43°", "137°", "53°", "317°"],
          answer: 0,
          explain: "Co-interior (allied) angles add to 180°: \\(x = 180^{\\circ} - 137^{\\circ} = 43^{\\circ}\\).",
        },
        {
          id: "a4b",
          prompt: "Co-interior angles are also called interior angles on the same side. They",
          choices: ["are equal", "add to 90°", "add to 180° when the lines are parallel", "add to 360°"],
          answer: 2,
          explain: "Supplementary — a C-shape.",
        },
      ],
      law1: [
        {
          id: "al1",
          prompt: "If corresponding angles are equal, the two lines cut by the transversal are",
          choices: ["perpendicular", "parallel", "equal in length", "intersecting at 45°"],
          answer: 1,
          explain: "Equal corresponding (or alternate) angles are a parallel-line test.",
        },
        {
          id: "al2",
          prompt: "If two co-interior angles are 80° and 80°, the lines",
          choices: [
            "must be parallel, because the angles are equal",
            "are not parallel, because 80° + 80° ≠ 180°",
            "are perpendicular",
            "cannot be cut by a transversal",
          ],
          answer: 1,
          explain: "Parallel needs the co-interior pair to be supplementary, not merely equal.",
        },
      ],
    },
    similarCongruent: {
      ch1: [
        {
          id: "sc1a",
          prompt: "\\(\\triangle ABC\\) is similar to \\(\\triangle DEF\\). Which vertex corresponds to B?",
          choices: ["E", "D", "F", "It cannot be determined"],
          answer: 0,
          explain: "Match letters in order: A↔D, B↔E, C↔F.",
        },
        {
          id: "sc1b",
          prompt: "If \\(\\triangle ABC \\sim \\triangle DEF\\), then side AB corresponds to",
          choices: ["DE", "EF", "DF", "FE"],
          answer: 0,
          explain: "First two letters to first two letters: AB ↔ DE.",
        },
      ],
      ch2: [
        {
          id: "sc2a",
          prompt: "Two similar triangles have corresponding sides 4 cm and 10 cm. The scale factor from the first to the second is",
          choices: ["2.5", "0.4", "6", "14"],
          answer: 0,
          explain: "10 ÷ 4 = 2.5.",
        },
        {
          id: "sc2b",
          prompt: "Similar triangles have",
          choices: [
            "equal corresponding angles and proportional corresponding sides",
            "equal corresponding sides only",
            "the same perimeter always",
            "scale factor 1 always",
          ],
          answer: 0,
          explain: "Same shape; size may differ.",
        },
      ],
      ch3: [
        {
          id: "sc3a",
          prompt: "Which information proves two triangles similar by AA?",
          choices: [
            "Two pairs of corresponding angles are equal",
            "One pair of sides is equal",
            "The triangles have the same perimeter",
            "One angle in each triangle is acute",
          ],
          answer: 0,
          explain: "Two equal corresponding angles are enough (the third follows).",
        },
        {
          id: "sc3b",
          prompt: "Sides 3, 4, 5 and 6, 8, 10. Which similarity test applies?",
          choices: ["SSS similarity", "AA similarity", "RHS congruence", "SSA congruence"],
          answer: 0,
          explain: "All three pairs are in the same ratio 1 : 2.",
        },
      ],
      ch4: [
        {
          id: "sc4a",
          prompt: "Which statement is always true for congruent triangles?",
          choices: [
            "All corresponding sides and angles are equal",
            "Their corresponding sides only need to be proportional",
            "Their scale factor can be any positive number",
            "They must both be right triangles",
          ],
          answer: 0,
          explain: "Congruent means the same shape and the same size.",
        },
        {
          id: "sc4b",
          prompt: "Congruent triangles are similar with scale factor",
          choices: ["0", "1", "2", "any number"],
          answer: 1,
          explain: "Same size means k = 1.",
        },
      ],
      ch5: [
        {
          id: "sc5a",
          prompt: "Two side pairs are equal and the included angle is equal. The congruence test is",
          choices: ["SAS", "SSS", "AAS", "SSA"],
          answer: 0,
          explain: "The equal angle lies between the two known sides.",
        },
        {
          id: "sc5b",
          prompt: "SSS congruence needs",
          choices: [
            "three pairs of equal corresponding sides",
            "three equal angles only",
            "two sides and a non-included angle",
            "one side and two angles",
          ],
          answer: 0,
          explain: "All three sides match, in corresponding order.",
        },
      ],
      ch6: [
        {
          id: "sc6a",
          prompt: "RHS congruence needs",
          choices: [
            "equal right angles, equal hypotenuses and one equal corresponding side",
            "equal right angles only",
            "equal hypotenuses only",
            "two non-included sides and any angle",
          ],
          answer: 0,
          explain: "Right angle, hypotenuse, and one other corresponding side.",
        },
        {
          id: "sc6b",
          prompt: "ASA needs two angles and",
          choices: [
            "the side between those two angles",
            "the side opposite the larger angle only",
            "the hypotenuse",
            "any third angle",
          ],
          answer: 0,
          explain: "The included side sits between the two known angles. AAS uses a non-included side.",
        },
      ],
      law1: [
        {
          id: "scl1",
          prompt: "Which statement correctly compares similar and congruent triangles?",
          choices: [
            "Every congruent pair is similar, but a similar pair need not be congruent",
            "Every similar pair is congruent",
            "Congruent triangles can have different corresponding side lengths",
            "Similar triangles must have scale factor 1",
          ],
          answer: 0,
          explain: "Congruence is similarity with k = 1.",
        },
        {
          id: "scl2",
          prompt: "SSA is",
          choices: [
            "a standard congruence test in this course",
            "not a reliable congruence test (the ambiguous case)",
            "the same as SAS",
            "enough for similarity only when k = 1",
          ],
          answer: 1,
          explain: "Two sides and a non-included angle can fit two different triangles.",
        },
      ],
    },
  };

  function start() {
    var map = window.JM28_COMICS;
    var order = window.JM28_COMIC_ORDER || ["triangleLines", "anglePairs", "similarCongruent"];
    if (!map || !window.initJmComicsBundle) return;
    var series = order.map(function (key) {
      return {
        id: key,
        label: map[key].label,
        comics: window.jmComicsFromTopic(map[key], CHECKS[key] || {}),
      };
    });
    window.initJmComicsBundle(series);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
