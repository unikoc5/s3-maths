/**
 * JM28 Geometry games
 * Marks follow the Interactive Tool (red equal-length ticks, blue right-angle /
 * equal-angle arcs). HKDSE wording. Progress persists across modes in this tab
 * Progress is in-memory only — a page refresh starts a fresh run.
 */
(function () {
  "use strict";
  var ROUND = 8;
  var MATCH_PRE = 3;
  var FACTORY_N = 5;
  var BOX_MS = 9000;
  var TICK = "#dc2626";
  var MARK = "#2563eb";
  var LINE = "#0f172a";
  var DASH = "#0284c7";

  var MODES = [
    { id: "meet", label: "Meeting Point" },
    { id: "centres", label: "Centre Snap" },
    { id: "angles", label: "Angle Pair Spot" },
    { id: "match", label: "Condition Check" },
  ];

  /* ── banks ───────────────────────────────────────────────
   * fig: construction id | null = text-only (no diagram)
   * markHint: short legend shown under the prompt when a figure is used
   */
  var CENTRE_BANK = [
    {
      id: "c-alt",
      q: "The dashed lines meet at which centre?",
      ans: "Orthocentre",
      opts: ["Orthocentre", "Centroid", "In-centre", "Circumcentre"],
      tip: "The three altitudes meet at the orthocentre.",
      fig: "altitude",
      markHint: "",
    },
    {
      id: "c-med",
      q: "The dashed lines meet at which centre?",
      ans: "Centroid",
      opts: ["Centroid", "Orthocentre", "In-centre", "Circumcentre"],
      tip: "The three medians meet at the centroid.",
      fig: "median",
      markHint: "",
    },
    {
      id: "c-bis",
      q: "The dashed lines meet at which centre?",
      ans: "In-centre",
      opts: ["In-centre", "Centroid", "Orthocentre", "Circumcentre"],
      tip: "The three angle bisectors meet at the in-centre.",
      fig: "bisector",
      markHint: "",
    },
    {
      id: "c-perp",
      q: "The dashed lines meet at which centre?",
      ans: "Circumcentre",
      opts: ["Circumcentre", "In-centre", "Centroid", "Orthocentre"],
      tip: "The three perpendicular bisectors meet at the circumcentre.",
      fig: "perp",
      markHint: "",
    },
    {
      id: "c-which-med",
      q: "Which special line joins a vertex to the mid-point of the opposite side?",
      ans: "Median",
      opts: ["Median", "Altitude", "Angle bisector", "Perpendicular bisector"],
      tip: "A median joins a vertex to the mid-point of the opposite side.",
      fig: null,
    },
    {
      id: "c-which-alt",
      q: "Which special line is drawn from a vertex perpendicular to the opposite side (or its extension)?",
      ans: "Altitude",
      opts: ["Altitude", "Median", "Angle bisector", "Perpendicular bisector"],
      tip: "An altitude is perpendicular from a vertex to the opposite side.",
      fig: null,
    },
    {
      id: "c-ratio",
      q: "The centroid divides each median in the ratio ___ from the vertex to the mid-point.",
      ans: "2 : 1",
      opts: ["2 : 1", "1 : 1", "3 : 1", "1 : 2"],
      tip: "From the vertex, the longer part to the shorter part is 2 : 1.",
      fig: null,
    },
    {
      id: "c-h-acute",
      q: "In an acute-angled triangle, where does the orthocentre lie?",
      ans: "Inside the triangle",
      opts: ["Inside the triangle", "Outside the triangle", "At a vertex", "At the mid-point of a side"],
      tip: "Acute → inside; right-angled → at the right-angled vertex; obtuse → outside.",
      fig: null,
    },
    {
      id: "c-h-obtuse",
      q: "In an obtuse-angled triangle, where does the orthocentre lie?",
      ans: "Outside the triangle",
      opts: ["Outside the triangle", "Inside the triangle", "At the obtuse vertex", "At the mid-point of a side"],
      tip: "When one angle is obtuse, the orthocentre lies outside the triangle.",
      fig: "tri-obtuse",
      markHint: "",
    },
    {
      id: "c-o-obtuse",
      q: "In an obtuse-angled triangle, where does the circumcentre lie?",
      ans: "Outside the triangle",
      opts: ["Outside the triangle", "Inside the triangle", "At a vertex", "On the longest side"],
      tip: "For an obtuse triangle the circumcentre lies outside.",
      fig: "tri-obtuse-b",
      markHint: "",
    },
    {
      id: "c-o-right",
      q: "In a right-angled triangle, the circumcentre is ___ .",
      ans: "the mid-point of the hypotenuse",
      opts: [
        "the mid-point of the hypotenuse",
        "the right-angled vertex",
        "the mid-point of a leg",
        "outside the triangle",
      ],
      tip: "In a right-angled triangle, the circumcentre is the mid-point of the hypotenuse.",
      fig: "tri-right",
      markHint: "",
    },
    {
      id: "c-iso-col",
      q: "In an isosceles triangle that is not equilateral, the orthocentre, centroid and circumcentre are ___ .",
      ans: "collinear",
      opts: ["collinear", "the same point", "never inside the triangle", "forming an equilateral triangle"],
      tip: "In an isosceles triangle these three centres lie on the axis of symmetry.",
      fig: "tri-iso-acbc",
      markHint: "",
    },
    {
      id: "c-equil",
      q: "In an equilateral triangle, the orthocentre, centroid, in-centre and circumcentre ___ .",
      ans: "coincide at the same point",
      opts: ["coincide at the same point", "form a smaller equilateral triangle", "lie on the base only", "cannot be constructed"],
      tip: "In an equilateral triangle all four centres are the same point.",
      fig: "tri-equil",
      markHint: "",
    },
    {
      id: "c-g-always",
      q: "In any triangle (acute, right or obtuse), the centroid ___ .",
      ans: "always lies inside the triangle",
      opts: [
        "always lies inside the triangle",
        "may lie outside if the triangle is obtuse",
        "lies on a side if the triangle is right-angled",
        "coincides with a vertex",
      ],
      tip: "The centroid is always inside the triangle.",
      fig: "tri-scalene",
      markHint: "",
    },
    {
      id: "c-alt-sc",
      q: "The dashed lines meet at which centre?",
      ans: "Orthocentre",
      opts: ["Orthocentre", "Centroid", "In-centre", "Circumcentre"],
      tip: "The three altitudes meet at the orthocentre.",
      fig: "altitude-sc",
      markHint: "",
    },
    {
      id: "c-perp-sc",
      q: "The dashed lines meet at which centre?",
      ans: "Circumcentre",
      opts: ["Circumcentre", "In-centre", "Centroid", "Orthocentre"],
      tip: "The three perpendicular bisectors meet at the circumcentre.",
      fig: "perp-sc",
      markHint: "",
    },
    {
      id: "c-bis-right",
      q: "The dashed lines meet at which centre?",
      ans: "In-centre",
      opts: ["In-centre", "Centroid", "Orthocentre", "Circumcentre"],
      tip: "The three angle bisectors meet at the in-centre.",
      fig: "bisector-right",
      markHint: "",
    },
    {
      id: "c-i-def",
      q: "Which centre is the centre of the circle that touches all three sides?",
      ans: "In-centre",
      opts: ["In-centre", "Circumcentre", "Centroid", "Orthocentre"],
      tip: "The in-centre is the centre of the inscribed circle.",
      fig: null,
    },
    {
      id: "c-o-def",
      q: "Which centre is equidistant from all three vertices?",
      ans: "Circumcentre",
      opts: ["Circumcentre", "In-centre", "Centroid", "Orthocentre"],
      tip: "The circumcentre is the centre of the circumscribed circle through the three vertices.",
      fig: null,
    },
    {
      id: "c-which-bis",
      q: "Which special line divides an angle of the triangle into two equal angles?",
      ans: "Angle bisector",
      opts: ["Angle bisector", "Median", "Altitude", "Perpendicular bisector"],
      tip: "An angle bisector splits an angle into two equal parts.",
      fig: null,
    },
    {
      id: "c-which-perp",
      q: "Which special line passes through the mid-point of a side and is perpendicular to that side?",
      ans: "Perpendicular bisector",
      opts: ["Perpendicular bisector", "Altitude", "Median", "Angle bisector"],
      tip: "A perpendicular bisector of a side goes through its mid-point at right angles.",
      fig: null,
    },
    {
      id: "c-med-sc",
      q: "The dashed lines meet at which centre?",
      ans: "Centroid",
      opts: ["Centroid", "Orthocentre", "In-centre", "Circumcentre"],
      tip: "The three medians meet at the centroid.",
      fig: "median-sc",
      markHint: "",
    },
  ];

  var ANGLE_BANK = [
    {
      id: "a-corr",
      q: "What are the shaded angles called?",
      ans: "Corresponding angles",
      opts: ["Corresponding angles", "Alternate angles", "Interior angles on the same side", "Vertically opposite angles"],
      tip: "Corresponding angles are equal when the lines are parallel.",
      fig: "corr",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-alt",
      q: "What are the shaded angles called?",
      ans: "Alternate angles",
      opts: ["Alternate angles", "Corresponding angles", "Interior angles on the same side", "Vertically opposite angles"],
      tip: "Alternate angles are equal when the lines are parallel.",
      fig: "alt",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-int",
      q: "What are the shaded angles called?",
      ans: "Interior angles on the same side",
      opts: ["Interior angles on the same side", "Corresponding angles", "Alternate angles", "Vertically opposite angles"],
      tip: "Interior angles on the same side of the transversal are supplementary (sum 180°) when the lines are parallel.",
      fig: "int",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-corr-eq",
      q: "If two parallel lines are cut by a transversal, corresponding angles are ___ .",
      ans: "equal",
      opts: ["equal", "supplementary (sum 180°)", "complementary (sum 90°)", "always 90°"],
      tip: "Parallel lines ⇒ corresponding angles are equal.",
      fig: null,
    },
    {
      id: "a-alt-eq",
      q: "If two parallel lines are cut by a transversal, alternate angles are ___ .",
      ans: "equal",
      opts: ["equal", "supplementary (sum 180°)", "complementary (sum 90°)", "always obtuse"],
      tip: "Parallel lines ⇒ alternate angles are equal.",
      fig: null,
    },
    {
      id: "a-int-sum",
      q: "If two parallel lines are cut by a transversal, interior angles on the same side of the transversal are ___ .",
      ans: "supplementary (sum 180°)",
      opts: ["supplementary (sum 180°)", "equal", "complementary (sum 90°)", "always acute"],
      tip: "Parallel lines ⇒ interior angles on the same side sum to 180°.",
      fig: null,
    },
    {
      id: "a-corr-2",
      q: "Name the shaded angle pair.",
      ans: "Corresponding angles",
      opts: ["Corresponding angles", "Alternate angles", "Interior angles on the same side", "Vertically opposite angles"],
      tip: "Corresponding angles are equal when the lines are parallel.",
      fig: "corr",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-alt-2",
      q: "Name the shaded angle pair.",
      ans: "Alternate angles",
      opts: ["Alternate angles", "Corresponding angles", "Interior angles on the same side", "Vertically opposite angles"],
      tip: "Alternate angles are equal when the lines are parallel.",
      fig: "alt",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-int-2",
      q: "Name the shaded angle pair.",
      ans: "Interior angles on the same side",
      opts: ["Interior angles on the same side", "Corresponding angles", "Alternate angles", "Vertically opposite angles"],
      tip: "Interior angles on the same side sum to 180° when the lines are parallel.",
      fig: "int",
      markHint: "Shaded regions show the angle pair asked about.",
    },
    {
      id: "a-vert",
      q: "Two angles opposite each other at a crossing of two lines are called ___ .",
      ans: "vertically opposite angles",
      opts: ["vertically opposite angles", "corresponding angles", "alternate angles", "interior angles on the same side"],
      tip: "Vertically opposite angles are equal.",
      fig: null,
    },
    {
      id: "a-trans",
      q: "A line that cuts two or more other lines is called a ___ .",
      ans: "transversal",
      opts: ["transversal", "median", "altitude", "parallel"],
      tip: "A transversal cuts two or more lines (often a pair of parallels).",
      fig: null,
    },
  ];

  var MATCH_BANK = [
    {
      id: "m-sss",
      q: "△ABC ≅ △DEF. Matching red ticks show three pairs of equal sides. Which condition is used?",
      ans: "SSS",
      opts: ["SSS", "SAS", "ASA", "RHS"],
      tip: "Three pairs of equal sides ⇒ SSS.",
      fig: "sss",
      markHint: "Red ticks = equal lengths (same tick count = same length).",
    },
    {
      id: "m-sas",
      q: "Matching ticks mark two pairs of equal sides; matching arcs mark the included equal angles. Which condition?",
      ans: "SAS",
      opts: ["SAS", "SSS", "ASA", "AAA"],
      tip: "Two sides and the included angle ⇒ SAS.",
      fig: "sas",
      markHint: "Red ticks = equal sides. Blue arcs = equal angles (included).",
    },
    {
      id: "m-asa",
      q: "Matching arcs mark two pairs of equal angles; a tick marks the included equal side. Which condition?",
      ans: "ASA",
      opts: ["ASA", "AAS", "SAS", "SSS"],
      tip: "Two angles and the included side ⇒ ASA.",
      fig: "asa",
      markHint: "Blue arcs = equal angles. Red tick = equal included side.",
    },
    {
      id: "m-aas",
      q: "Matching arcs mark two pairs of equal angles; a tick marks a non-included equal side. Which condition?",
      ans: "AAS",
      opts: ["AAS", "ASA", "SAS", "RHS"],
      tip: "Two angles and a non-included side ⇒ AAS.",
      fig: "aas",
      markHint: "Blue arcs = equal angles. Red tick = equal non-included side.",
    },
    {
      id: "m-rhs",
      q: "Both triangles are right-angled (blue square). Matching ticks mark equal hypotenuses and one pair of equal legs. Which condition?",
      ans: "RHS",
      opts: ["RHS", "SAS", "SSS", "ASA"],
      tip: "Right angle, hypotenuse and one other side ⇒ RHS.",
      fig: "rhs",
      markHint: "Blue square = right angle. Red ticks = equal hypotenuse / equal leg.",
    },
    {
      id: "m-aaa",
      q: "All three angles of △ABC equal those of △DEF, but the sides need not be equal. The triangles are ___ .",
      ans: "similar (AAA)",
      opts: ["similar (AAA)", "congruent (SSS)", "congruent (ASA)", "neither"],
      tip: "AAA ⇒ similar (same shape; sizes may differ).",
      fig: null,
    },
    {
      id: "m-3prop",
      q: "Corresponding sides of two triangles are in the same ratio. The triangles are ___ .",
      ans: "similar (three sides proportional)",
      opts: ["similar (three sides proportional)", "congruent (SSS)", "similar (AAA)", "neither"],
      tip: "Three sides proportional ⇒ similar.",
      fig: null,
    },
    {
      id: "m-2prop",
      q: "Two pairs of corresponding sides are proportional and the included angles are equal. The triangles are ___ .",
      ans: "similar (two sides proportional, included angle equal)",
      opts: [
        "similar (two sides proportional, included angle equal)",
        "congruent (SAS)",
        "similar (AAA)",
        "congruent (SSS)",
      ],
      tip: "Two sides proportional with equal included angle ⇒ similar.",
      fig: null,
    },
    {
      id: "m-cong-sim",
      q: "If two triangles are congruent, they are also ___ .",
      ans: "similar with scale factor 1",
      opts: ["similar with scale factor 1", "similar with scale factor ≠ 1", "never similar", "similar only if right-angled"],
      tip: "Congruence is similarity with scale factor 1.",
      fig: null,
    },
    {
      id: "m-aaa-not",
      q: "AAA alone is enough to prove triangles are ___ .",
      ans: "similar, but not necessarily congruent",
      opts: ["similar, but not necessarily congruent", "congruent", "neither similar nor congruent", "equal in area"],
      tip: "Same angles ⇒ similar; side lengths may still differ.",
      fig: null,
    },
  ];

  var FACTORY_CHALLENGES = [
    {
      id: "f-sss-yes",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "sss",
      accept: true,
      tip: "Three pairs of equal sides — the triangles are congruent.",
    },
    {
      id: "f-sas-yes",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "sas",
      accept: true,
      tip: "Two sides and the included angle match — the triangles are congruent.",
    },
    {
      id: "f-asa-yes",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "asa",
      accept: true,
      tip: "Two angles and the included side match — the triangles are congruent.",
    },
    {
      id: "f-rhs-yes",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "rhs",
      accept: true,
      tip: "Right angle, equal hypotenuse and equal leg — the triangles are congruent.",
    },
    {
      id: "f-aas-yes",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "aas",
      accept: true,
      tip: "Two angles and a non-included side match — the triangles are congruent.",
    },
    {
      id: "f-aaa-no",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "aaa",
      accept: false,
      tip: "Equal angles alone do not prove congruence (sizes may differ).",
    },
    {
      id: "f-one-no",
      req: "Accept if △ABC ≅ △DEF; Reject if not.",
      fig: "one",
      accept: false,
      tip: "Only one pair of equal sides is marked — not enough for congruence.",
    },
  ];

  var state = {
    mode: "meet",
    modes: {}, /* modeId -> modeState */
  };

  function emptyMode() {
    return {
      queue: [],
      index: 0,
      results: [], /* null | "ok" | "bad" */
      score: 0,
      streak: 0,
      answered: false,
      done: false,
      factoryAccepted: 0,
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function bankFor(mode) {
    if (mode === "angles") return ANGLE_BANK;
    if (mode === "match") return MATCH_BANK;
    return CENTRE_BANK;
  }

  function loadStore() {
    /* no persistence — refresh clears progress */
  }

  function saveStore() {
    /* no persistence — refresh clears progress */
  }

  function modeState() {
    if (!state.modes[state.mode]) state.modes[state.mode] = emptyMode();
    return state.modes[state.mode];
  }

  function uniquePick(bank, n, keyFn) {
    var seen = {};
    var out = [];
    shuffle(bank).forEach(function (item) {
      var k = keyFn(item);
      if (seen[k]) return;
      seen[k] = 1;
      out.push(item);
    });
    return out.slice(0, n);
  }

  function itemKey(item) {
    /* same diagram or same prompt text must not repeat in one round */
    if (item.fig) return "fig:" + item.fig;
    return "q:" + item.q;
  }

  function buildQueue(mode) {
    if (mode === "meet") return [];
    if (mode !== "match") return uniquePick(bankFor(mode), ROUND, itemKey);
    var bank = MATCH_BANK.filter(function (x) { return x.type !== "factory"; });
    var q = uniquePick(bank, MATCH_PRE, itemKey);
    var boxes = uniquePick(FACTORY_CHALLENGES, FACTORY_N, function (ch) { return "fig:" + ch.fig; });
    boxes.forEach(function (ch, i) {
      q.push({
        id: ch.id,
        type: "factory",
        boxIndex: i,
        boxTotal: boxes.length,
        req: ch.req,
        fig: ch.fig,
        accept: ch.accept,
        tip: ch.tip,
        q: ch.req,
      });
    });
    return q;
  }

  /* ── geometry helpers (SVG strings) ───────────────────── */
  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  function unit(p, q) {
    var d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
  }
  function perp(u) {
    return { x: -u.y, y: u.x };
  }
  function extend(p, q, extra) {
    var u = unit(p, q);
    var len = Math.hypot(q.x - p.x, q.y - p.y) + (extra || 36);
    return { x: p.x + u.x * len, y: p.y + u.y * len };
  }
  function hitLine(V, dirPt, B, C) {
    var dx = dirPt.x - V.x, dy = dirPt.y - V.y;
    var ex = C.x - B.x, ey = C.y - B.y;
    var den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-6) return extend(V, dirPt, 40);
    var t = ((B.x - V.x) * ey - (B.y - V.y) * ex) / den;
    if (t <= 0.05) return extend(V, dirPt, 40);
    return { x: V.x + dx * t, y: V.y + dy * t };
  }
  function footOnLine(V, B, C) {
    var u = unit(B, C);
    var t = (V.x - B.x) * u.x + (V.y - B.y) * u.y;
    return { x: B.x + u.x * t, y: B.y + u.y * t };
  }
  function mid(p, q) {
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  }

  function hashMarks(p, q, t, count) {
    var u = unit(p, q);
    var n = perp(u);
    var c = lerp(p, q, t);
    var len = 9;
    var gap = 4.5;
    var out = "";
    for (var i = 0; i < count; i++) {
      var off = (i - (count - 1) / 2) * gap;
      var a = { x: c.x + u.x * off - n.x * len / 2, y: c.y + u.y * off - n.y * len / 2 };
      var b = { x: c.x + u.x * off + n.x * len / 2, y: c.y + u.y * off + n.y * len / 2 };
      out += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + TICK + '" stroke-width="2"/>';
    }
    return out;
  }

  function rightAngleMark(V, P, Q) {
    var size = 11;
    var u1 = unit(V, P);
    var u2 = unit(V, Q);
    var a = { x: V.x + u1.x * size, y: V.y + u1.y * size };
    var b = { x: V.x + u1.x * size + u2.x * size, y: V.y + u1.y * size + u2.y * size };
    var c = { x: V.x + u2.x * size, y: V.y + u2.y * size };
    return '<polyline points="' + a.x + "," + a.y + " " + b.x + "," + b.y + " " + c.x + "," + c.y + '" fill="none" stroke="' + MARK + '" stroke-width="1.8"/>';
  }

  function shortArc(V, P, Q, r) {
    var a1 = Math.atan2(P.y - V.y, P.x - V.x);
    var a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
    var da = a2 - a1;
    while (da <= -Math.PI) da += Math.PI * 2;
    while (da > Math.PI) da -= Math.PI * 2;
    var sweep = da >= 0 ? 1 : 0;
    return "M " + (V.x + r * Math.cos(a1)) + " " + (V.y + r * Math.sin(a1)) +
      " A " + r + " " + r + " 0 0 " + sweep + " " +
      (V.x + r * Math.cos(a2)) + " " + (V.y + r * Math.sin(a2));
  }

  function equalAngleArcs(V, P, Q, count, baseR) {
    var out = "";
    var r0 = baseR == null ? 14 : baseR;
    var gap = 4.5; /* tight pair within one sign */
    for (var k = 0; k < count; k++) {
      out += '<path d="' + shortArc(V, P, Q, r0 + k * gap) + '" fill="none" stroke="' + MARK + '" stroke-width="1.6"/>';
    }
    return out;
  }

  /** Two half-signs, 錯開. 1 curve → farther (old); 2+ → shorter pack. */
  function bisectorArcs(V, P, Q, I, count, baseR) {
    var multi = count > 1;
    var scale = multi ? 0.55 : 1;
    var r0 = (baseR == null ? 14 : baseR) * scale;
    var gap = 4.5 * scale;
    var stagger = 3 * scale;
    var out = "";
    var k;
    for (k = 0; k < count; k++) {
      out += '<path d="' + shortArc(V, P, I, r0 + k * gap) + '" fill="none" stroke="' + MARK + '" stroke-width="1.6"/>';
      out += '<path d="' + shortArc(V, I, Q, r0 + stagger + k * gap) + '" fill="none" stroke="' + MARK + '" stroke-width="1.6"/>';
    }
    return out;
  }

  function dashLine(p, q) {
    return '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y +
      '" stroke="' + DASH + '" stroke-width="1.9" stroke-dasharray="6 3.5"/>';
  }

  function solidTri(A, B, C) {
    return '<polygon points="' + A.x + "," + A.y + " " + B.x + "," + B.y + " " + C.x + "," + C.y +
      '" fill="#e0f2fe" stroke="' + LINE + '" stroke-width="2.2"/>' +
      labelOutside(A, B, C, A, "A") +
      labelOutside(A, B, C, B, "B") +
      labelOutside(A, B, C, C, "C");
  }

  function label(P, t, dx, dy) {
    return '<text x="' + (P.x + (dx || 0)) + '" y="' + (P.y + (dy || 0)) +
      '" fill="' + LINE + '" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="middle">' + t + "</text>";
  }

  /** Place vertex letter outside the triangle, away from the centroid. */
  function labelOutside(A, B, C, P, t) {
    var g = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    var dx = P.x - g.x;
    var dy = P.y - g.y;
    var d = Math.hypot(dx, dy) || 1;
    var dist = 18;
    return label(P, t, (dx / d) * dist, (dy / d) * dist);
  }

  function meetDot(P) {
    void P;
    return "";
  }

  function triShape(name) {
    if (name === "scalene") {
      return { A: { x: 220, y: 40 }, B: { x: 40, y: 220 }, C: { x: 310, y: 175 } };
    }
    /* clearly obtuse at C, isosceles AC = BC */
    if (name === "obtuse") {
      return { A: { x: 50, y: 215 }, B: { x: 310, y: 215 }, C: { x: 180, y: 150 } };
    }
    if (name === "right") {
      return { A: { x: 55, y: 40 }, B: { x: 55, y: 215 }, C: { x: 290, y: 215 } };
    }
    /* true equilateral: side 220, height ≈ 190.5 */
    if (name === "equil") {
      return { A: { x: 180, y: 28 }, B: { x: 70, y: 218 }, C: { x: 290, y: 218 } };
    }
    /* isosceles AC = BC (apex C, acute) */
    if (name === "iso-acbc") {
      return { A: { x: 55, y: 210 }, B: { x: 305, y: 210 }, C: { x: 180, y: 40 } };
    }
    /* isosceles AB = AC (apex A) */
    return { A: { x: 180, y: 32 }, B: { x: 55, y: 215 }, C: { x: 305, y: 215 } };
  }

  function obtuseArc(V, P, Q) {
    /* wide arc to mark the obtuse angle (no centre plotted) */
    return equalAngleArcs(V, P, Q, 1, 22);
  }

  function drawPerpBundle(parts, A, B, C, tickPlan) {
    var Ma2 = mid(B, C), Mb2 = mid(A, C), Mc2 = mid(A, B);
    var nA = perp(unit(B, C));
    var nB = perp(unit(A, C));
    var nC = perp(unit(A, B));
    function ray(M, n, len) {
      return [
        { x: M.x - n.x * len, y: M.y - n.y * len },
        { x: M.x + n.x * len, y: M.y + n.y * len },
      ];
    }
    var ra = ray(Ma2, nA, 140);
    var rb = ray(Mb2, nB, 140);
    var rc = ray(Mc2, nC, 140);
    parts.push(dashLine(ra[0], ra[1]), dashLine(rb[0], rb[1]), dashLine(rc[0], rc[1]));
    parts.push(hashMarks(B, Ma2, 0.5, tickPlan[0]), hashMarks(Ma2, C, 0.5, tickPlan[0]));
    parts.push(hashMarks(A, Mb2, 0.5, tickPlan[1]), hashMarks(Mb2, C, 0.5, tickPlan[1]));
    parts.push(hashMarks(A, Mc2, 0.5, tickPlan[2]), hashMarks(Mc2, B, 0.5, tickPlan[2]));
    parts.push(rightAngleMark(Ma2, ra[1], C));
    parts.push(rightAngleMark(Mb2, rb[1], A));
    parts.push(rightAngleMark(Mc2, rc[1], A));
  }

  function drawCentreFig(kind) {
    var shape = "iso";
    var mode = kind;
    if (kind === "median-sc" || kind === "altitude-sc" || kind === "perp-sc") {
      shape = "scalene";
      mode = kind.replace("-sc", "");
    } else if (kind === "bisector-right") { mode = "bisector"; shape = "right"; }
    else if (kind === "tri-obtuse" || kind === "tri-obtuse-b") { mode = "shape-obtuse"; shape = "obtuse"; }
    else if (kind === "tri-right") { mode = "shape-right"; shape = "right"; }
    else if (kind === "tri-equil") { mode = "shape-equil"; shape = "equil"; }
    else if (kind === "tri-iso-acbc") { mode = "shape-iso-acbc"; shape = "iso-acbc"; }
    else if (kind === "tri-scalene") { mode = "shape-scalene"; shape = "scalene"; }
    else if (kind === "altitude") { shape = "scalene"; }
    else if (kind === "median") { shape = "scalene"; }
    else if (kind === "perp") { shape = "scalene"; }
    else if (kind === "bisector") { shape = "iso"; }

    var V = triShape(shape);
    var A = V.A, B = V.B, C = V.C;
    var parts = ['<svg class="tg-fig" viewBox="0 0 360 250" aria-hidden="true">', solidTri(A, B, C)];

    /* shape-only diagrams: show triangle type, never plot the centre */
    if (mode === "shape-obtuse") {
      parts.push(hashMarks(A, C, 0.5, 1), hashMarks(B, C, 0.5, 1));
      parts.push(obtuseArc(C, A, B));
    } else if (mode === "shape-right") {
      parts.push(rightAngleMark(B, A, C));
    } else if (mode === "shape-equil") {
      parts.push(hashMarks(A, B, 0.5, 1), hashMarks(B, C, 0.5, 1), hashMarks(C, A, 0.5, 1));
      parts.push(equalAngleArcs(A, B, C, 1, 16));
      parts.push(equalAngleArcs(B, A, C, 1, 16));
      parts.push(equalAngleArcs(C, A, B, 1, 16));
    } else if (mode === "shape-iso-acbc") {
      parts.push(hashMarks(A, C, 0.5, 1), hashMarks(B, C, 0.5, 1));
      parts.push(equalAngleArcs(A, B, C, 1, 16));
      parts.push(equalAngleArcs(B, A, C, 1, 16));
    } else if (mode === "altitude") {
      var Fa = footOnLine(A, B, C);
      var Fb = footOnLine(B, A, C);
      var Fc = footOnLine(C, A, B);
      parts.push(dashLine(A, extend(A, Fa, 28)), dashLine(B, extend(B, Fb, 28)), dashLine(C, extend(C, Fc, 28)));
      parts.push(rightAngleMark(Fa, A, C.x >= Fa.x ? C : B));
      parts.push(rightAngleMark(Fb, B, A));
      parts.push(rightAngleMark(Fc, C, A));
    } else if (mode === "median") {
      var Ma = mid(B, C), Mb = mid(A, C), Mc = mid(A, B);
      parts.push(dashLine(A, extend(A, Ma, 24)), dashLine(B, extend(B, Mb, 24)), dashLine(C, extend(C, Mc, 24)));
      parts.push(hashMarks(B, Ma, 0.5, 1), hashMarks(Ma, C, 0.5, 1));
      parts.push(hashMarks(A, Mb, 0.5, 2), hashMarks(Mb, C, 0.5, 2));
      parts.push(hashMarks(A, Mc, 0.5, 3), hashMarks(Mc, B, 0.5, 3));
    } else if (mode === "bisector") {
      var I = shape === "right"
        ? { x: 110, y: 170 }
        : { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 + 18 };
      var Ha = hitLine(A, I, B, C);
      var Hb = hitLine(B, I, A, C);
      var Hc = hitLine(C, I, A, B);
      parts.push(dashLine(A, extend(A, Ha, 28)));
      parts.push(dashLine(B, extend(B, Hb, 28)));
      parts.push(dashLine(C, extend(C, Hc, 28)));
      if (shape === "right") {
        /* scalene right: three different angles → 1 / 2 / 3 curves */
        parts.push(rightAngleMark(B, A, C));
        parts.push(bisectorArcs(A, B, C, Ha, 1, 14));
        parts.push(bisectorArcs(B, A, C, Hb, 2, 14));
        parts.push(bisectorArcs(C, A, B, Hc, 3, 14));
      } else {
        /* isosceles: equal base angles share curve count */
        parts.push(hashMarks(A, B, 0.45, 1), hashMarks(A, C, 0.45, 1));
        parts.push(bisectorArcs(A, B, C, Ha, 1, 14));
        parts.push(bisectorArcs(B, A, C, Hb, 2, 14));
        parts.push(bisectorArcs(C, A, B, Hc, 2, 14));
      }
    } else if (mode === "perp") {
      if (shape === "right") parts.push(rightAngleMark(B, A, C));
      drawPerpBundle(parts, A, B, C, shape === "scalene" ? [1, 2, 3] : [1, 2, 2]);
    }

    parts.push("</svg>");
    return parts.join("");
  }

  function angleWedge(cx, cy, a0, a1, col) {
    var r = 28;
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var da = a1 - a0;
    while (da < 0) da += Math.PI * 2;
    while (da >= Math.PI * 2) da -= Math.PI * 2;
    var large = da > Math.PI ? 1 : 0;
    return '<path d="M' + cx + "," + cy + " L" + x0 + "," + y0 +
      " A" + r + "," + r + " 0 " + large + " 1 " + x1 + "," + y1 +
      ' Z" fill="' + col + '" opacity=".55"/>';
  }

  function angleLabel(cx, cy, a0, a1, text) {
    var da = a1 - a0;
    while (da < 0) da += Math.PI * 2;
    while (da >= Math.PI * 2) da -= Math.PI * 2;
    var midA = a0 + da / 2;
    var r = 15;
    var x = cx + r * Math.cos(midA);
    var y = cy + r * Math.sin(midA);
    return '<text x="' + x + '" y="' + y +
      '" fill="#9f1239" font-size="13" font-weight="800" text-anchor="middle" dominant-baseline="middle">' +
      text + "</text>";
  }

  function parallelArrow(y, x) {
    return '<polyline points="' + (x - 9) + "," + (y - 7) + " " + (x + 5) + "," + y + " " +
      (x - 9) + "," + (y + 7) + '" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linejoin="round"/>';
  }

  function lineHitY(a, b, y) {
    var dy = b.y - a.y;
    if (Math.abs(dy) < 1e-6) return { x: a.x, y: y };
    var t = (y - a.y) / dy;
    return { x: a.x + (b.x - a.x) * t, y: y };
  }

  function drawAngleFig(kind) {
    var y1 = 72, y2 = 178;
    var t0 = { x: 100, y: 28 }, t1 = { x: 260, y: 222 };
    var p1 = lineHitY(t0, t1, y1);
    var p2 = lineHitY(t0, t1, y2);
    var parts = ['<svg class="tg-fig" viewBox="0 0 360 240" aria-hidden="true">'];
    parts.push('<line x1="36" y1="' + y1 + '" x2="324" y2="' + y1 + '" stroke="' + LINE + '" stroke-width="2.4"/>');
    parts.push('<line x1="36" y1="' + y2 + '" x2="324" y2="' + y2 + '" stroke="' + LINE + '" stroke-width="2.4"/>');
    parts.push(parallelArrow(y1, 88));
    parts.push(parallelArrow(y2, 88));
    parts.push('<line x1="' + t0.x + '" y1="' + t0.y + '" x2="' + t1.x + '" y2="' + t1.y + '" stroke="#334155" stroke-width="2.2"/>');
    parts.push('<text x="330" y="' + (y1 + 4) + '" fill="#64748b" font-size="12" font-weight="700">l1</text>');
    parts.push('<text x="330" y="' + (y2 + 4) + '" fill="#64748b" font-size="12" font-weight="700">l2</text>');

    var ang = Math.atan2(t1.y - t0.y, t1.x - t0.x);
    var up = ang - Math.PI; /* upward along transversal */
    var col = "#f472b6";

    if (kind === "corr") {
      /* corresponding: same relative position at each parallel */
      parts.push(angleWedge(p1.x, p1.y, 0, ang, col));
      parts.push(angleWedge(p2.x, p2.y, 0, ang, col));
      parts.push(angleLabel(p1.x, p1.y, 0, ang, "1"));
      parts.push(angleLabel(p2.x, p2.y, 0, ang, "2"));
    } else if (kind === "alt") {
      /* alternate interior: opposite sides of transversal, between parallels */
      parts.push(angleWedge(p1.x, p1.y, ang, Math.PI, col));
      parts.push(angleWedge(p2.x, p2.y, up, 0, col));
      parts.push(angleLabel(p1.x, p1.y, ang, Math.PI, "1"));
      parts.push(angleLabel(p2.x, p2.y, up, 0, "2"));
    } else {
      /* interior angles on the same side (both on the right of the transversal) */
      parts.push(angleWedge(p1.x, p1.y, 0, ang, col));
      parts.push(angleWedge(p2.x, p2.y, up, 0, col));
      parts.push(angleLabel(p1.x, p1.y, 0, ang, "1"));
      parts.push(angleLabel(p2.x, p2.y, up, 0, "2"));
    }

    parts.push("</svg>");
    return parts.join("");
  }

  function drawMatchFig(kind) {
    var L = { A: { x: 90, y: 36 }, B: { x: 36, y: 170 }, C: { x: 155, y: 170 } };
    var R = { A: { x: 270, y: 42 }, B: { x: 215, y: 170 }, C: { x: 340, y: 170 } };
    if (kind === "rhs") {
      L = { A: { x: 36, y: 40 }, B: { x: 36, y: 170 }, C: { x: 150, y: 170 } };
      R = { A: { x: 220, y: 40 }, B: { x: 220, y: 170 }, C: { x: 340, y: 170 } };
    }
    var parts = ['<svg class="tg-fig" viewBox="0 0 380 200" aria-hidden="true">'];
    function poly(T, fill) {
      return '<polygon points="' + T.A.x + "," + T.A.y + " " + T.B.x + "," + T.B.y + " " + T.C.x + "," + T.C.y +
        '" fill="' + fill + '" stroke="' + LINE + '" stroke-width="2"/>';
    }
    parts.push(poly(L, "#e0f2fe"), poly(R, "#fce7f3"));
    parts.push(
      labelOutside(L.A, L.B, L.C, L.A, "A"),
      labelOutside(L.A, L.B, L.C, L.B, "B"),
      labelOutside(L.A, L.B, L.C, L.C, "C")
    );
    parts.push(
      labelOutside(R.A, R.B, R.C, R.A, "D"),
      labelOutside(R.A, R.B, R.C, R.B, "E"),
      labelOutside(R.A, R.B, R.C, R.C, "F")
    );
    var leftEdge = Math.max(L.A.x, L.B.x, L.C.x);
    var rightEdge = Math.min(R.A.x, R.B.x, R.C.x);
    var midX = (leftEdge + rightEdge) / 2;
    var topY = Math.min(L.A.y, L.B.y, L.C.y, R.A.y, R.B.y, R.C.y);
    var botY = Math.max(L.A.y, L.B.y, L.C.y, R.A.y, R.B.y, R.C.y);
    var midY = (topY + botY) / 2 + 4;
    parts.push('<text x="' + midX + '" y="' + midY + '" text-anchor="middle" dominant-baseline="middle" fill="#0284c7" font-size="22" font-weight="800">≅</text>');

    if (kind === "sss") {
      parts.push(hashMarks(L.A, L.B, 0.5, 1), hashMarks(R.A, R.B, 0.5, 1));
      parts.push(hashMarks(L.B, L.C, 0.5, 2), hashMarks(R.B, R.C, 0.5, 2));
      parts.push(hashMarks(L.C, L.A, 0.5, 3), hashMarks(R.C, R.A, 0.5, 3));
    } else if (kind === "sas") {
      parts.push(hashMarks(L.A, L.B, 0.5, 1), hashMarks(R.A, R.B, 0.5, 1));
      parts.push(hashMarks(L.A, L.C, 0.5, 2), hashMarks(R.A, R.C, 0.5, 2));
      parts.push(equalAngleArcs(L.A, L.B, L.C, 1), equalAngleArcs(R.A, R.B, R.C, 1));
    } else if (kind === "asa") {
      parts.push(equalAngleArcs(L.A, L.B, L.C, 1), equalAngleArcs(R.A, R.B, R.C, 1));
      parts.push(equalAngleArcs(L.B, L.A, L.C, 2), equalAngleArcs(R.B, R.A, R.C, 2));
      parts.push(hashMarks(L.A, L.B, 0.5, 1), hashMarks(R.A, R.B, 0.5, 1));
    } else if (kind === "aas") {
      parts.push(equalAngleArcs(L.A, L.B, L.C, 1), equalAngleArcs(R.A, R.B, R.C, 1));
      parts.push(equalAngleArcs(L.B, L.A, L.C, 2), equalAngleArcs(R.B, R.A, R.C, 2));
      parts.push(hashMarks(L.B, L.C, 0.5, 1), hashMarks(R.B, R.C, 0.5, 1));
    } else if (kind === "rhs") {
      parts.push(rightAngleMark(L.B, L.A, L.C), rightAngleMark(R.B, R.A, R.C));
      parts.push(hashMarks(L.A, L.C, 0.5, 2), hashMarks(R.A, R.C, 0.5, 2)); /* hypotenuse */
      parts.push(hashMarks(L.A, L.B, 0.5, 1), hashMarks(R.A, R.B, 0.5, 1)); /* leg */
    } else if (kind === "aaa") {
      parts.push(equalAngleArcs(L.A, L.B, L.C, 1), equalAngleArcs(R.A, R.B, R.C, 1));
      parts.push(equalAngleArcs(L.B, L.A, L.C, 2), equalAngleArcs(R.B, R.A, R.C, 2));
      parts.push(equalAngleArcs(L.C, L.A, L.B, 3), equalAngleArcs(R.C, R.A, R.B, 3));
    } else if (kind === "one") {
      parts.push(hashMarks(L.A, L.B, 0.5, 1), hashMarks(R.A, R.B, 0.5, 1));
    }
    parts.push("</svg>");
    return parts.join("");
  }

  function figHtml(item) {
    if (!item.fig) return "";
    if (state.mode === "angles") return drawAngleFig(item.fig);
    if (state.mode === "match") return drawMatchFig(item.fig);
    return drawCentreFig(item.fig);
  }

  function updateProgressBar(ms) {
    var ok = 0, bad = 0, todo = 0;
    ms.results.forEach(function (r) {
      if (r === "ok") ok++;
      else if (r === "bad") bad++;
      else todo++;
    });
    /* pad remaining slots as todo */
    var left = Math.max(0, ms.queue.length - ms.results.length);
    todo += left;
    var total = ok + bad + todo || 1;
    $("tg-seg-ok").style.flex = String(ok || 0.0001);
    $("tg-seg-bad").style.flex = String(bad || 0.0001);
    $("tg-seg-todo").style.flex = String(todo || 0.0001);
    if (ok === 0) $("tg-seg-ok").style.flex = "0";
    if (bad === 0) $("tg-seg-bad").style.flex = "0";
    if (todo === 0) $("tg-seg-todo").style.flex = "0";
    var rate = ok + bad ? Math.round((ok / (ok + bad)) * 100) : 0;
    var attain = Math.round(((ok + bad) / total) * 100);
    $("tg-rate").textContent = "Hit rate " + rate + "% · Cleared " + attain + "%";
    void total;
  }

  function flashArena(ok) {
    var arena = $("tg-arena");
    if (!arena) return;
    arena.classList.remove("tg-flash-ok", "tg-flash-bad");
    void arena.offsetWidth;
    arena.classList.add(ok ? "tg-flash-ok" : "tg-flash-bad");
    setTimeout(function () {
      arena.classList.remove("tg-flash-ok", "tg-flash-bad");
    }, 420);
  }

  function setHud(ms) {
    var n = ms.queue.length;
    var q = Math.min(ms.index + 1, n);
    $("tg-qnum").textContent = q + " / " + n;
    $("tg-score").textContent = String(ms.score);
    $("tg-streak").textContent = String(ms.streak);
    var mission = $("tg-mission");
    if (mission) {
      var names = { centres: "Centre Snap", angles: "Angle Pair Spot", match: "Condition Check" };
      var cur = ms.queue[ms.index];
      if (cur && cur.type === "factory") {
        mission.textContent = "Factory Line · Box " + (cur.boxIndex + 1) + "/" + cur.boxTotal;
      } else {
        mission.textContent = (names[state.mode] || "Mission") + " · Round " + q;
      }
    }
    updateProgressBar(ms);
  }

  function showDone(ms) {
    $("tg-play").classList.add("hidden");
    $("tg-done").classList.remove("hidden");
    var n = ms.queue.length;
    var pct = n ? Math.round((ms.score / n) * 100) : 0;
    var maxScore = n;
    var pct2 = maxScore ? Math.round((ms.score / maxScore) * 100) : 0;
    $("tg-done-score").textContent = ms.score + " / " + maxScore + " (" + pct2 + "%)";
    var modeIdx = MODES.findIndex(function (m) { return m.id === state.mode; });
    var isFinal = modeIdx >= 0 && modeIdx === MODES.length - 1;
    var switchBtn = $("tg-switch");
    if (switchBtn) switchBtn.classList.toggle("hidden", isFinal);
    if (isFinal) {
      $("tg-done-msg").textContent = pct === 100
        ? "Arena champion! A perfect final run — every mark, every call. The Geometry Arena crown is yours."
        : pct >= 70
          ? "Victory lap complete! You smashed the final mission and claimed the Arena. Replay any mission to go for a flawless crown."
          : "You crossed the finish line! The Arena remembers its finishers — replay the final mission and chase a higher score.";
    } else {
      $("tg-done-msg").textContent = pct === 100
        ? "Flawless clear — every mark read correctly."
        : pct >= 70
          ? "Mission cleared. Replay or jump to the next arena."
          : "Warm-up done. Visit the Interactive Tool, then come back for another run.";
    }
    updateProgressBar(ms);
  }

  var factoryRun = null;

  function stopFactoryTimers() {
    if (!factoryRun) return;
    if (factoryRun.boxEl && factoryRun.onSlideEnd) {
      factoryRun.boxEl.removeEventListener("animationend", factoryRun.onSlideEnd);
    }
    if (factoryRun.pendingTimer) clearTimeout(factoryRun.pendingTimer);
    factoryRun = null;
  }

  /* Stable 2-column stack — flat crates, uses left and right of the bin */
  function packCrates(n) {
    var out = [];
    var cw = 44, ch = 32, gapX = 6, gapY = 4, pad = 6;
    for (var i = 0; i < n; i++) {
      var col = i % 2;
      var row = (i / 2) | 0;
      out.push({
        x: pad + col * (cw + gapX),
        y: pad + row * (ch + gapY),
        rot: 0,
      });
    }
    return out;
  }

  function pileLandPose(n) {
    var pack = packCrates(n);
    var p = pack[n - 1] || { x: 6, y: 6, rot: 0 };
    var bin = $("tg-bin");
    var conv = bin ? bin.parentElement : null;
    if (!bin || !conv) return { left: 22, top: 190, rot: 0 };
    var br = bin.getBoundingClientRect();
    var cr = conv.getBoundingClientRect();
    var crateH = 32;
    return {
      left: br.left - cr.left + p.x,
      top: br.bottom - cr.top - p.y - crateH,
      rot: 0,
    };
  }

  function updateBinVisual() {
    var n = factoryRun ? factoryRun.accepted : 0;
    var bin = $("tg-bin-stack");
    if (!bin) return;
    bin.innerHTML = "";
    packCrates(n).forEach(function (p) {
      var d = document.createElement("div");
      d.className = "tg-bin-crate";
      d.style.left = p.x + "px";
      d.style.bottom = p.y + "px";
      bin.appendChild(d);
    });
  }

  function setFactoryContinueLabel(answered) {
    var cont = $("tg-factory-continue");
    if (!cont) return;
    cont.classList.remove("hidden");
    if (!answered) {
      cont.textContent = "Skip";
      return;
    }
    var ms = modeState();
    cont.textContent = ms.index + 1 >= ms.queue.length ? "Mission results" : "Continue";
  }

  function revealFactoryResult(ok, tip, choice) {
    var ms = modeState();
    var item = ms.queue[ms.index];
    while (ms.results.length < ms.index) ms.results.push(null);
    ms.results[ms.index] = ok ? "ok" : "bad";
    ms.answered = true;
    if (ok) {
      ms.score += 1;
      ms.streak += 1;
    } else {
      ms.streak = 0;
    }
    var msg = ok ? ("Correct — " + tip) : ("Incorrect — " + tip);
    if (choice === "timeout") msg = "Too slow — " + tip;
    if (choice === "skip") msg = "Skipped — " + tip;
    $("tg-fb").className = "tg-fb " + (ok ? "ok" : "bad");
    $("tg-fb").textContent = msg;
    flashArena(ok);
    setFactoryContinueLabel(true);
    setHud(ms);
    saveStore();
  }

  function afterBoxAnim(ok, tip, choice) {
    if (!factoryRun) return;
    factoryRun.pendingTimer = setTimeout(function () {
      revealFactoryResult(ok, tip, choice);
    }, 40);
  }

  function factoryChoose(choice) {
    if (!factoryRun || factoryRun.locked) return;
    factoryRun.locked = true;
    var item = modeState().queue[modeState().index];
    var saidAccept = choice === "accept";
    var ok = (choice === "timeout" || choice === "skip") ? false : (saidAccept === item.accept);
    var box = factoryRun.boxEl;
    if (factoryRun.onSlideEnd) box.removeEventListener("animationend", factoryRun.onSlideEnd);

    $("tg-accept").disabled = true;
    $("tg-reject").disabled = true;
    $("tg-fb").textContent = "";
    $("tg-fb").className = "tg-fb";

    var parent = box.parentElement;
    var parentW = parent ? parent.getBoundingClientRect().width : 1;
    var curLeft = box.getBoundingClientRect().left - (parent ? parent.getBoundingClientRect().left : 0);
    box.style.animation = "none";
    box.style.left = curLeft + "px";
    box.style.top = "36px";
    box.classList.remove("run");
    void box.offsetWidth;

    function onAnimDone(e) {
      if (e.target !== box) return;
      if (e.animationName && e.animationName.indexOf("tg-box-") !== 0 && e.animationName !== "tg-box-burn") return;
      box.removeEventListener("animationend", onAnimDone);
      afterBoxAnim(ok, item.tip, choice);
    }

    if (choice === "reject") {
      box.innerHTML =
        '<span class="tg-flame tg-flame-a" aria-hidden="true"><span class="tg-flame-core"></span></span>' +
        '<span class="tg-flame tg-flame-b" aria-hidden="true"><span class="tg-flame-core"></span></span>' +
        '<span class="tg-flame tg-flame-c" aria-hidden="true"><span class="tg-flame-core"></span></span>';
      box.classList.add("tg-box-reject", "tg-box-burning");
      box.addEventListener("animationend", onAnimDone);
    } else if (choice === "timeout") {
      box.classList.add("tg-box-timeout");
      box.addEventListener("animationend", onAnimDone);
    } else if (choice === "skip") {
      /* 2.5× belt speed rush left off-screen, then reveal tip */
      var fullSpanPct = 94; /* 82% → -12% */
      var curPct = (curLeft / (parentW || 1)) * 100;
      var remainPct = Math.max(4, curPct - (-16));
      var rushMs = Math.max(140, Math.round((remainPct / fullSpanPct) * (BOX_MS / 2.5)));
      box.classList.add("tg-box-skip");
      box.style.transition = "left " + rushMs + "ms linear, opacity " + rushMs + "ms linear";
      void box.offsetWidth;
      box.style.left = "-18%";
      box.style.opacity = "0.35";
      factoryRun.pendingTimer = setTimeout(function () {
        box.style.visibility = "hidden";
        afterBoxAnim(ok, item.tip, choice);
      }, rushMs + 40);
    } else {
      /* accept: rush to tunnel, then drop onto the current pile top */
      factoryRun.accepted += 1;
      modeState().factoryAccepted = factoryRun.accepted;
      var land = pileLandPose(factoryRun.accepted);
      var tunnelX = 26;
      var dist = Math.max(0, curLeft - tunnelX);
      var rushMs = Math.min(750, Math.max(220, dist * 1.8));
      box.style.transition = "left " + rushMs + "ms cubic-bezier(.22,.82,.2,1)";
      box.style.left = tunnelX + "px";
      var drop = function () {
        box.style.transition =
          "top .75s cubic-bezier(.2,.7,.2,1), left .75s cubic-bezier(.2,.7,.2,1), transform .75s cubic-bezier(.2,.7,.2,1)";
        box.style.left = land.left + "px";
        box.style.top = land.top + "px";
        box.style.transform = "rotate(" + land.rot + "deg)";
        setTimeout(function () {
          box.style.visibility = "hidden";
          box.style.opacity = "0";
          updateBinVisual();
          afterBoxAnim(ok, item.tip, choice);
        }, 780);
      };
      setTimeout(drop, rushMs + 30);
    }
  }

  function spawnFactoryBox() {
    var item = modeState().queue[modeState().index];
    factoryRun.locked = false;
    $("tg-factory-req").textContent = item.req || item.q;
    $("tg-factory-fig").innerHTML = drawMatchFig(item.fig);
    $("tg-factory-prog").textContent = "Box " + (item.boxIndex + 1) + " / " + item.boxTotal;
    setFactoryContinueLabel(false);
    var box = $("tg-box");
    box.className = "tg-box";
    box.innerHTML = "";
    box.style.animation = "none";
    box.style.transition = "";
    box.style.left = "";
    box.style.top = "";
    box.style.transform = "";
    box.style.opacity = "";
    box.style.visibility = "";
    void box.offsetWidth;
    box.classList.add("run");
    box.style.animation = "tg-box-slide " + BOX_MS + "ms linear forwards";
    factoryRun.boxEl = box;
    factoryRun.onSlideEnd = function (e) {
      if (e.animationName !== "tg-box-slide") return;
      if (factoryRun && !factoryRun.locked) factoryChoose("timeout");
    };
    box.addEventListener("animationend", factoryRun.onSlideEnd);
    $("tg-fb").textContent = "";
    $("tg-fb").className = "tg-fb";
    $("tg-accept").disabled = false;
    $("tg-reject").disabled = false;
    updateBinVisual();
  }

  function renderFactory(item) {
    stopFactoryTimers();
    var ms = modeState();
    if (ms.factoryAccepted == null) ms.factoryAccepted = 0;
    $("tg-layout").classList.add("tg-text-only");
    $("tg-figure-wrap").classList.add("hidden");
    $("tg-figure").innerHTML = "";
    $("tg-mark-hint").classList.add("hidden");
    $("tg-prompt").textContent = "";
    $("tg-options").innerHTML =
      '<div class="tg-factory" id="tg-factory">' +
        '<p class="tg-factory-req" id="tg-factory-req"></p>' +
        '<div class="tg-factory-fig" id="tg-factory-fig"></div>' +
        '<div class="tg-conveyor" aria-hidden="true">' +
          '<div class="tg-belt"></div>' +
          '<div class="tg-tunnel" title="Accept"></div>' +
          '<div class="tg-bin">' +
            '<div class="tg-bin-stack" id="tg-bin-stack"></div>' +
          '</div>' +
          '<div class="tg-box" id="tg-box"></div>' +
        '</div>' +
        '<div class="tg-factory-actions">' +
          '<button type="button" class="btn tg-reject-btn" id="tg-reject">Reject</button>' +
          '<button type="button" class="btn primary tg-accept-btn" id="tg-accept">Accept</button>' +
          '<button type="button" class="btn primary" id="tg-factory-continue">Skip</button>' +
        '</div>' +
        '<p class="tg-factory-prog" id="tg-factory-prog"></p>' +
      '</div>';
    $("tg-next").classList.add("hidden");

    factoryRun = {
      locked: false,
      boxEl: null,
      onSlideEnd: null,
      pendingTimer: null,
      accepted: ms.factoryAccepted || 0,
    };
    $("tg-accept").onclick = function () { factoryChoose("accept"); };
    $("tg-reject").onclick = function () { factoryChoose("reject"); };
    $("tg-factory-continue").onclick = function () {
      if (!ms.answered) {
        factoryChoose("skip");
        return;
      }
      ms.factoryAccepted = factoryRun ? factoryRun.accepted : ms.factoryAccepted;
      var done = ms.index + 1 >= ms.queue.length;
      stopFactoryTimers();
      if (done) {
        ms.done = true;
        showDone(ms);
        saveStore();
      } else {
        ms.index += 1;
        ms.answered = false;
        renderQ();
        saveStore();
      }
    };
    spawnFactoryBox();
    void item;
  }

  function renderQ() {
    var ms = modeState();
    if (ms.done || ms.index >= ms.queue.length) {
      ms.done = true;
      showDone(ms);
      saveStore();
      return;
    }
    ms.answered = false;
    stopFactoryTimers();
    $("tg-play").classList.remove("hidden");
    $("tg-done").classList.add("hidden");
    $("tg-next").classList.add("hidden");
    $("tg-fb").textContent = "";
    $("tg-fb").className = "tg-fb";

    var item = ms.queue[ms.index];
    if (item.type === "factory") {
      setHud(ms);
      renderFactory(item);
      saveStore();
      return;
    }

    $("tg-prompt").textContent = item.q;

    var fig = figHtml(item);
    var wrap = $("tg-figure-wrap");
    var hint = $("tg-mark-hint");
    if (fig) {
      wrap.classList.remove("hidden");
      $("tg-figure").innerHTML = fig;
      if (item.markHint) {
        hint.classList.remove("hidden");
        hint.textContent = item.markHint;
      } else {
        hint.classList.add("hidden");
      }
      $("tg-layout").classList.remove("tg-text-only");
    } else {
      wrap.classList.add("hidden");
      $("tg-figure").innerHTML = "";
      hint.classList.add("hidden");
      $("tg-layout").classList.add("tg-text-only");
    }

    var opts = shuffle(item.opts.slice());
    var keys = ["A", "B", "C", "D"];
    var box = $("tg-options");
    box.innerHTML = "";
    opts.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tg-opt";
      b.dataset.ans = opt;
      b.innerHTML = '<span class="tg-key">' + keys[i] + '</span><span class="tg-opt-text"></span>';
      b.querySelector(".tg-opt-text").textContent = opt;
      b.addEventListener("click", function () { pick(opt, b); });
      box.appendChild(b);
    });
    setHud(ms);
    saveStore();
  }

  function pick(opt, btn) {
    var ms = modeState();
    if (ms.answered) return;
    ms.answered = true;
    var item = ms.queue[ms.index];
    var ok = opt === item.ans;
    document.querySelectorAll("#tg-options .tg-opt").forEach(function (el) {
      el.disabled = true;
      var ans = el.dataset.ans;
      if (ans === item.ans) el.classList.add("ok");
      else if (el === btn && !ok) el.classList.add("bad");
    });
    while (ms.results.length < ms.index) ms.results.push(null);
    ms.results[ms.index] = ok ? "ok" : "bad";
    flashArena(ok);
    if (ok) {
      ms.score += 1;
      ms.streak += 1;
      $("tg-fb").className = "tg-fb ok";
      $("tg-fb").textContent = "Hit! " + item.tip;
    } else {
      ms.streak = 0;
      $("tg-fb").className = "tg-fb bad";
      $("tg-fb").textContent = "Miss — " + item.tip;
    }
    $("tg-next").classList.remove("hidden");
    $("tg-next").textContent = ms.index + 1 >= ms.queue.length ? "Mission results" : "Next round";
    setHud(ms);
    saveStore();
  }

  function setMeetVisible(on) {
    var meet = $("tg-meet");
    var play = $("tg-play");
    var done = $("tg-done");
    if (meet) meet.classList.toggle("hidden", !on);
    if (on) {
      if (play) play.classList.add("hidden");
      if (done) done.classList.add("hidden");
      if (window.JM28MeetingPoint && window.JM28MeetingPoint.activate) {
        window.JM28MeetingPoint.activate();
      }
    } else {
      if (window.JM28MeetingPoint && window.JM28MeetingPoint.deactivate) {
        window.JM28MeetingPoint.deactivate();
      }
    }
  }

  function ensureMode(mode, forceNew) {
    stopFactoryTimers();
    state.mode = mode;
    document.querySelectorAll("[data-tg-mode]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tgMode === mode);
    });
    var blurb = {
      meet: "Free-draw from vertices or mid-points. Check answer with three lines — centres mark as G / H / I / O.",
      centres: "Read the marks, then name the centre or the special line. The meeting point stays unmarked.",
      angles: "Two parallels cut by a transversal — name the angle pair.",
      match: "Name the condition from the marks (3 rounds), then Factory Line (5 boxes). Accept if congruent; Reject if not.",
    };
    if ($("tg-blurb")) $("tg-blurb").textContent = blurb[mode] || "";

    if (mode === "meet") {
      setMeetVisible(true);
      saveStore();
      return;
    }

    setMeetVisible(false);
    var ms = modeState();
    if (forceNew || !ms.queue.length) {
      state.modes[mode] = emptyMode();
      ms = modeState();
      ms.queue = buildQueue(mode);
      ms.results = ms.queue.map(function () { return null; });
    }
    var play = $("tg-play");
    if (play) play.classList.toggle("hidden", !!ms.done);
    if (ms.done) showDone(ms);
    else renderQ();
    saveStore();
  }

  function next() {
    var ms = modeState();
    if (!ms.answered) return;
    ms.index += 1;
    ms.answered = false;
    if (ms.index >= ms.queue.length) {
      ms.done = true;
      showDone(ms);
    } else {
      renderQ();
    }
    saveStore();
  }

  function init() {
    if (!$("panel-game") || $("panel-game").dataset.tgBound === "1") return;
    $("panel-game").dataset.tgBound = "1";
    loadStore();

    document.querySelectorAll("[data-tg-mode]").forEach(function (b) {
      b.addEventListener("click", function () {
        ensureMode(b.dataset.tgMode, false);
      });
    });
    $("tg-next").addEventListener("click", next);
    $("tg-again").addEventListener("click", function () {
      ensureMode(state.mode, true);
    });
    $("tg-switch").addEventListener("click", function () {
      var i = MODES.findIndex(function (m) { return m.id === state.mode; });
      ensureMode(MODES[(i + 1) % MODES.length].id, false);
    });

    document.addEventListener("keydown", function (e) {
      var panel = $("panel-game");
      if (!panel || panel.classList.contains("hidden") || panel.style.display === "none") return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var k = e.key.toUpperCase();
      if (k === "ENTER" || k === " ") {
        var cont = $("tg-factory-continue");
        if (cont && !cont.classList.contains("hidden")) {
          e.preventDefault();
          cont.click();
          return;
        }
        var nextBtn = $("tg-next");
        if (nextBtn && !nextBtn.classList.contains("hidden")) {
          e.preventDefault();
          next();
        }
        return;
      }
      var idx = { A: 0, B: 1, C: 2, D: 3 }[k];
      if (idx == null) return;
      var btns = document.querySelectorAll("#tg-options .tg-opt:not([disabled])");
      if (btns[idx]) {
        e.preventDefault();
        btns[idx].click();
      }
    });

    ensureMode(state.mode || "meet", false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
