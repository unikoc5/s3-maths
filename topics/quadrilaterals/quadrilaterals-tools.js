(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SW = 2.5;
  var INK = "#e2e8f0";
  var ACCENT = "#38bdf8";
  var GOOD = "#4ade80";
  var MARK = "#fbbf24";
  var TICK = "#f87171";
  var VIOLET = "#a78bfa";
  var EPS_PAR = 0.08;  // ~4.6° — tougher, closer to JM28 feel
  var EPS_LEN_REL = 0.04; // 4% of average length (like triangle centres)
  var EPS_ANG = 6;



  var LABS = [
    { id: "detect", label: "Shape detector" },
    { id: "thm", label: "Mid-pt. / Intercept" },
    { id: "reasons", label: "Reason bank" },
  ];

  /* ── helpers ─────────────────────────────────────────────── */
  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function clr(svg) { while (svg && svg.firstChild) svg.removeChild(svg.firstChild); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function scale(v, k) { return { x: v.x * k, y: v.y * k }; }
  function unit(a, b) {
    var d = dist(a, b) || 1;
    return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
  }
  function perp(v) { return { x: -v.y, y: v.x }; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function fmt(n, d) {
    var p = Math.pow(10, d == null ? 1 : d);
    return String(Math.round(n * p) / p);
  }

  function slope(a, b) {
    var dx = b.x - a.x;
    if (Math.abs(dx) < 1e-6) return Infinity;
    return (b.y - a.y) / dx;
  }
  function isParallel(a, b, c, d) {
    var u = sub(b, a), v = sub(d, c);
    var cross = Math.abs(u.x * v.y - u.y * v.x);
    var mag = (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)) || 1;
    return cross / mag < EPS_PAR;
  }
  function isEqualLen(a, b, c, d) {
    var l1 = dist(a, b), l2 = dist(c, d);
    var avg = (l1 + l2) / 2 || 1;
    return Math.abs(l1 - l2) < avg * EPS_LEN_REL;
  }
  function isPerp(a, b, c, d) {
    var u = sub(b, a), v = sub(d, c);
    var dot = Math.abs(u.x * v.x + u.y * v.y);
    var mag = (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)) || 1;
    return dot / mag < EPS_PAR;
  }
  function lensClose(l1, l2) {
    var avg = (l1 + l2) / 2 || 1;
    return Math.abs(l1 - l2) < avg * EPS_LEN_REL;
  }
  function angleAt(prev, cur, next) {
    var u = unit(cur, prev), v = unit(cur, next);
    var dot = clamp(u.x * v.x + u.y * v.y, -1, 1);
    return Math.acos(dot) * 180 / Math.PI;
  }
  function nearly(a, b, eps) { return Math.abs(a - b) < (eps == null ? EPS_ANG : eps); }

  function renderMixed(el, text) {
    if (!el) return;
    el.textContent = "";
    String(text || "").split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (part.indexOf("**") === 0) {
        var s = document.createElement("strong");
        s.textContent = part.slice(2, -2);
        el.appendChild(s);
      } else el.appendChild(document.createTextNode(part));
    });
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  function svgPt(svg, e) {
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return {
      x: (e.clientX - r.left) * (vb.width / r.width),
      y: (e.clientY - r.top) * (vb.height / r.height),
    };
  }

  function seg(a, b, col, w) {
    return E("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: col || INK, "stroke-width": w || SW, "stroke-linecap": "round",
    });
  }
  function labelAt(p, text, dx, dy, fill, centered) {
    var attrs = {
      x: p.x + (dx || 0), y: p.y + (dy || 0),
      fill: fill || INK, "font-size": 14, "font-weight": 700,
    };
    if (centered) {
      attrs["text-anchor"] = "middle";
      attrs["dominant-baseline"] = "middle";
    }
    var t = E("text", attrs);
    t.textContent = text;
    return t;
  }

  /** Place label on the ray from centroid → vertex, fixed radius (same for every label). */
  var LABEL_R = 16;
  function outwardLabel(p, centroid, name, distPx) {
    var u = unit(centroid, p);
    var d = distPx == null ? LABEL_R : distPx;
    return labelAt(p, name, u.x * d, u.y * d, INK, true);
  }
  /** Invisible drag target + tiny vertex dot (no orange spots). */
  function handle(p, key, fill) {
    var g = E("g", {});
    g.appendChild(E("circle", {
      cx: p.x, cy: p.y, r: 4, fill: fill || INK, stroke: "#0f172a", "stroke-width": 1,
    }));
    g.appendChild(E("circle", {
      cx: p.x, cy: p.y, r: 20, fill: "transparent", "data-drag": String(key),
    }));
    return g;
  }
  function dragOnly(p, key) {
    return E("circle", {
      cx: p.x, cy: p.y, r: 18, fill: "transparent", "data-drag": String(key),
    });
  }

  function tickMark(a, b, n, color, t) {
    var g = E("g", {});
    var u = unit(a, b), nrm = perp(u);
    var m = lerp(a, b, t == null ? 0.5 : t);
    var count = Math.max(1, Math.min(4, n || 1));
    for (var k = 0; k < count; k++) {
      var c = add(m, scale(u, (k - (count - 1) / 2) * 5));
      g.appendChild(seg(add(c, scale(nrm, 7)), add(c, scale(nrm, -7)), color || TICK, 2));
    }
    return g;
  }

  /** Arrowhead // marks at fraction t along AB. n=1 or 2. */
  function parallelArrows(a, b, n, color, t) {
    var g = E("g", {});
    var u = unit(a, b), nrm = perp(u);
    var m = lerp(a, b, t == null ? 0.5 : t);
    var col = color || GOOD;
    var count = Math.max(1, Math.min(2, n || 1));
    for (var set = 0; set < count; set++) {
      var base = add(m, scale(u, (set - (count - 1) / 2) * 11));
      var tip = add(base, scale(u, 7));
      var left = add(add(base, scale(u, -3)), scale(nrm, 6));
      var right = add(add(base, scale(u, -3)), scale(nrm, -6));
      g.appendChild(E("polygon", {
        points: [tip, left, right].map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: col,
      }));
    }
    return g;
  }
  function parallelSlash(a, b, n, color, t) { return parallelArrows(a, b, n, color, t); }

  function dashedSeg(a, b, col, w) {
    var el = seg(a, b, col || "#fb923c", w || 2);
    el.setAttribute("stroke-dasharray", "7 5");
    return el;
  }

  /** Cluster segments by length; return tick count per index (0 = no mark). */
  function equalTickGroups(segs, epsRel) {
    epsRel = epsRel == null ? EPS_LEN_REL : epsRel;
    var n = segs.length;
    var parent = [];
    for (var i = 0; i < n; i++) parent[i] = i;
    function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
    function uni(a, b) {
      a = find(a); b = find(b);
      if (a !== b) parent[b] = a;
    }
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var avg = (segs[i].len + segs[j].len) / 2 || 1;
        if (Math.abs(segs[i].len - segs[j].len) < avg * epsRel) uni(i, j);
      }
    }
    var groups = {};
    for (var i = 0; i < n; i++) {
      var r = find(i);
      if (!groups[r]) groups[r] = [];
      groups[r].push(i);
    }
    var ticks = [];
    for (var i = 0; i < n; i++) ticks[i] = 0;
    var next = 1;
    Object.keys(groups).forEach(function (r) {
      var g = groups[r];
      if (g.length < 2) return;
      var t = next++;
      g.forEach(function (i) { ticks[i] = t; });
    });
    return ticks;
  }


  /** Equal-angle mark: n = 1, 2 or 3 concentric arcs (nOrDoubles: true⇒2). */
  function angleArc(vertex, pA, pB, r, color, nOrDoubles) {
    var g = E("g", {});
    var u = unit(vertex, pA), v = unit(vertex, pB);
    var a1 = Math.atan2(u.y, u.x), a2 = Math.atan2(v.y, v.x);
    var d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    var large = Math.abs(d) > Math.PI ? 1 : 0;
    var sweep = d > 0 ? 1 : 0;
    var n = 1;
    if (nOrDoubles === true) n = 2;
    else if (typeof nOrDoubles === "number") n = Math.max(1, Math.min(3, nOrDoubles | 0));
    function arc(rad) {
      var s = add(vertex, scale(u, rad));
      var e = add(vertex, scale(v, rad));
      return E("path", {
        d: "M " + s.x + " " + s.y + " A " + rad + " " + rad + " 0 " + large + " " + sweep + " " + e.x + " " + e.y,
        fill: "none", stroke: color || VIOLET, "stroke-width": 2.4,
      });
    }
    for (var i = 0; i < n; i++) g.appendChild(arc(r + i * 5));
    return g;
  }

  function rightAngleMark(corner, fromA, fromB, size) {
    size = size || 12;
    var u = unit(corner, fromA), v = unit(corner, fromB);
    var p1 = add(corner, scale(u, size));
    var p2 = add(p1, scale(v, size));
    var p3 = add(corner, scale(v, size));
    return E("polyline", {
      points: [p1, p2, p3].map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "none", stroke: MARK, "stroke-width": 2,
    });
  }

  function makeButtons(row, items, activeId, onClick) {
    if (!row) return;
    row.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (it.id === activeId ? " active" : "");
      b.textContent = it.label;
      b.disabled = !!it.disabled;
      b.addEventListener("click", function () { onClick(it.id); });
      row.appendChild(b);
    });
  }
  function makeChips(row, items, activeId, onClick) {
    if (!row) return;
    row.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (it.id === activeId ? " active" : "");
      b.textContent = it.label;
      b.addEventListener("click", function () { onClick(it.id); });
      row.appendChild(b);
    });
  }

  function setActiveLab(id) {
    makeChips(document.getElementById("jm29-lab-nav"), LABS, id, setActiveLab);
    document.querySelectorAll("#panel-tools .lab").forEach(function (lab) {
      lab.classList.toggle("active", lab.id === "lab-" + id);
    });
    if (id === "detect") renderDetect();
    if (id === "thm") renderThm();
    if (id === "reasons") renderReasons();
  }

  /* ═══════════════════════════════════════════════════════════
     LAB 1 — Free-drag detector
     ═══════════════════════════════════════════════════════════ */
  var verts = [
    { x: 90, y: 280 }, { x: 360, y: 280 }, { x: 440, y: 70 }, { x: 170, y: 70 },
  ];
  var detDrag = null;
  var proveReasonId = null;
  var proveStep = 0;
  var activePreset = "parallelogram";

  var PRESETS = {
    trapezium: [
      { x: 80, y: 280 }, { x: 440, y: 280 }, { x: 370, y: 70 }, { x: 150, y: 70 },
    ],
    parallelogram: [
      { x: 90, y: 280 }, { x: 360, y: 280 }, { x: 440, y: 70 }, { x: 170, y: 70 },
    ],
    rhombus: [
      { x: 250, y: 300 }, { x: 430, y: 175 }, { x: 250, y: 50 }, { x: 70, y: 175 },
    ],
    rectangle: [
      { x: 90, y: 270 }, { x: 420, y: 270 }, { x: 420, y: 80 }, { x: 90, y: 80 },
    ],
    square: [
      { x: 130, y: 300 }, { x: 390, y: 300 }, { x: 390, y: 40 }, { x: 130, y: 40 },
    ],
  };

  function analyseQuad(v) {
    var A = v[0], B = v[1], C = v[2], D = v[3];
    var parAB_DC = isParallel(A, B, D, C);
    var parAD_BC = isParallel(A, D, B, C);
    var eqAB_DC = isEqualLen(A, B, D, C);
    var eqAD_BC = isEqualLen(A, D, B, C);
    var eqAB_AD = isEqualLen(A, B, A, D);
    var eqAB_BC = isEqualLen(A, B, B, C);
    var eqBC_CD = isEqualLen(B, C, C, D);
    var allSidesEq = eqAB_AD && eqAB_BC && eqBC_CD && eqAB_DC;
    var angA = angleAt(D, A, B), angB = angleAt(A, B, C), angC = angleAt(B, C, D), angD = angleAt(C, D, A);
    var all90 = [angA, angB, angC, angD].every(function (a) { return nearly(a, 90, EPS_ANG); });
    // Adjacent sides nearly ⊥ (same idea as all ~90°, no parallel forcing)
    if (!all90 && isPerp(A, B, B, C) && isPerp(B, C, C, D) && isPerp(C, D, D, A) && isPerp(D, A, A, B)) {
      all90 = true;
    }
    // True rectangle/square: all right angles + opposite sides equal ⇒ both pairs //
    // Do NOT force // from angles alone (that made “3 equal sides + ~90°” look like a rectangle).
    if (all90 && eqAB_DC && eqAD_BC) {
      parAB_DC = true;
      parAD_BC = true;
    }
    var bothPar = parAB_DC && parAD_BC;
    var onePar = (parAB_DC || parAD_BC) && !bothPar;
    var oppAngEq = nearly(angA, angC) && nearly(angB, angD);
    var Oac = mid(A, C), Obd = mid(B, D);
    var diagsBisect = dist(Oac, Obd) < 16;

    // //gram needs both pairs // and opposite sides equal (avoids tolerance mismatch)
    var isPara = bothPar && eqAB_DC && eqAD_BC;

    var names = { square: false, rectangle: false, rhombus: false, parallelogram: false, trapezium: false, quad: true };
    if (onePar) names.trapezium = true;
    if (isPara) {
      names.parallelogram = true;
      if (allSidesEq || eqAB_AD) names.rhombus = true;
      if (all90) names.rectangle = true;
      if (names.rhombus && names.rectangle) names.square = true;
    }

    var primary = "quad";
    if (names.square) primary = "square";
    else if (names.rectangle) primary = "rectangle";
    else if (names.rhombus) primary = "rhombus";
    else if (names.parallelogram) primary = "parallelogram";
    else if (names.trapezium) primary = "trapezium";

    return {
      A: A, B: B, C: C, D: D,
      parAB_DC: parAB_DC, parAD_BC: parAD_BC, bothPar: bothPar, onePar: onePar,
      eqAB_DC: eqAB_DC, eqAD_BC: eqAD_BC, allSidesEq: allSidesEq,
      angA: angA, angB: angB, angC: angC, angD: angD, all90: all90, oppAngEq: oppAngEq,
      diagsBisect: diagsBisect, names: names, primary: primary,
      sides: [dist(A, B), dist(B, C), dist(C, D), dist(D, A)],
    };
  }

  var PROPS = {
    quad: {
      title: "General quadrilateral",
      list: ["No special // or equal-side pattern detected — keep dragging."],
    },
    trapezium: {
      title: "Trapezium",
      list: [
        "Exactly **one** pair of opposite sides //.",
        "Co-interior angles between the // sides sum to \\(180^\\circ\\).",
        "Reason: **[property of trapezium]**",
      ],
    },
    parallelogram: {
      title: "Parallelogram",
      list: [
        "Both pairs of opposite sides // (definition).",
        "Opposite sides equal — **[opp. sides of //gram]**",
        "Opposite angles equal — **[opp. ∠s of //gram]**",
        "Diagonals bisect each other — **[diags. of //gram]**",
      ],
    },
    square: {
      title: "Square",
      list: [
        "All sides equal.",
        "All angles \\(90^\\circ\\).",
        "Diagonals are equal, perpendicular, and bisect each other (and the vertex angles).",
        "Angle between a diagonal and a side is \\(45^\\circ\\).",
        "Reason: **[property of square]**",
      ],
    },
    rectangle: {
      title: "Rectangle",
      list: [
        "A parallelogram with all angles \\(90^\\circ\\).",
        "Diagonals are equal in length and bisect each other.",
        "Reason: **[property of rectangle]**",
      ],
    },
    rhombus: {
      title: "Rhombus",
      list: [
        "All sides equal.",
        "Diagonals are perpendicular bisectors of each other.",
        "Diagonals bisect the interior angles.",
        "Reason: **[property of rhombus]**",
      ],
    },
  };

  /** Prove recipes keyed by primary shape */
  function proveOptions(info) {
    var p = info.primary;
    if (p === "parallelogram") {
      return [
        {
          id: "def",
          label: "By definition (both //)",
          steps: [
            { t: "Observe both pairs", x: "From the figure, \\(AB\\)//\\(DC\\) and \\(AD\\)//\\(BC\\) (// marks)." },
            { t: "Definition", x: "A quadrilateral with both pairs of opposite sides // is a parallelogram." },
            { t: "Conclusion", x: "Therefore \\(ABCD\\) is a parallelogram." },
          ],
        },
        {
          id: "oppSides",
          label: "[opp. sides equal]",
          steps: [
            { t: "Given", x: "Opposite sides equal: \\(AB = DC\\), \\(AD = BC\\) (tick marks)." },
            { t: "Theorem", x: "A quadrilateral with both pairs of opposite sides equal is a parallelogram." },
            { t: "Conclusion", x: "\\(ABCD\\) is a parallelogram. Reason: **[opp. sides equal]**" },
          ],
        },
        {
          id: "diags",
          label: "[diags. bisect each other]",
          steps: [
            { t: "Diagonals", x: "Diagonals \\(AC\\), \\(BD\\) meet at their common mid-point (equal ticks on each half)." },
            { t: "Theorem", x: "If the diagonals of a quadrilateral bisect each other, it is a parallelogram." },
            { t: "Conclusion", x: "\\(ABCD\\) is a parallelogram. Reason: **[diags. bisect each other]**" },
          ],
        },
        {
          id: "onePair",
          label: "[2 sides equal and //]",
          steps: [
            { t: "Given", x: "One pair of opposite sides is both equal and //, e.g. \\(AB = DC\\) and \\(AB\\)//\\(DC\\)." },
            { t: "Theorem", x: "Then the quadrilateral is a parallelogram." },
            { t: "Conclusion", x: "\\(ABCD\\) is a parallelogram. Reason: **[2 sides equal and //]**" },
          ],
        },
      ];
    }
    if (p === "rhombus") {
      return [
        {
          id: "sides",
          label: "//gram + equal sides",
          steps: [
            { t: "Parallelogram", x: "Both pairs of opposite sides // ⇒ \\(ABCD\\) is a parallelogram." },
            { t: "Equal sides", x: "All four sides equal (same tick marks)." },
            { t: "Definition", x: "A parallelogram with all sides equal is a rhombus." },
            { t: "Conclusion", x: "\\(ABCD\\) is a rhombus. **[property of rhombus]**" },
          ],
        },
      ];
    }
    if (p === "rectangle") {
      return [
        {
          id: "right",
          label: "//gram + right angles",
          steps: [
            { t: "Parallelogram", x: "Both pairs of opposite sides // ⇒ parallelogram." },
            { t: "Right angles", x: "All interior angles are \\(90^\\circ\\) (right-angle marks)." },
            { t: "Definition", x: "A parallelogram with four right angles is a rectangle." },
            { t: "Conclusion", x: "\\(ABCD\\) is a rectangle. **[property of rectangle]**" },
          ],
        },
      ];
    }
    if (p === "square") {
      return [
        {
          id: "rectRhomb",
          label: "Rectangle + equal sides",
          steps: [
            { t: "Rectangle", x: "Four right angles and opposite sides // ⇒ rectangle." },
            { t: "Equal sides", x: "All sides equal ⇒ also a rhombus." },
            { t: "Definition", x: "A rectangle with equal sides (or rhombus with right angles) is a square." },
            { t: "Conclusion", x: "\\(ABCD\\) is a square. **[property of square]**" },
          ],
        },
        {
          id: "rhombRight",
          label: "Rhombus + right angle",
          steps: [
            { t: "Rhombus", x: "All sides equal and opposite sides // ⇒ rhombus." },
            { t: "Right angle", x: "One (hence all) angle is \\(90^\\circ\\)." },
            { t: "Conclusion", x: "\\(ABCD\\) is a square. **[property of square]**" },
          ],
        },
      ];
    }
    if (p === "trapezium") {
      return [
        {
          id: "onePar",
          label: "Exactly one pair //",
          steps: [
            { t: "Check //", x: "Exactly one pair of opposite sides is // (single // mark set)." },
            { t: "Definition", x: "A quadrilateral with exactly one pair of // sides is a trapezium." },
            { t: "Conclusion", x: "\\(ABCD\\) is a trapezium. **[property of trapezium]**" },
          ],
        },
      ];
    }
    return [
      {
        id: "none",
        label: "Keep exploring",
        steps: [
          { t: "Not special yet", x: "Drag vertices until a pair of sides becomes // or equal — badges will light up." },
          { t: "Tip", x: "Try making both pairs // for a parallelogram, or all sides equal for a rhombus." },
        ],
      },
    ];
  }

  function renderDetect() {
    var svg = document.getElementById("det-svg");
    if (!svg) return;
    clr(svg);
    var info = analyseQuad(verts);
    var A = info.A, B = info.B, C = info.C, D = info.D;
    var O = mid(A, C);
    // Use actual diagonal midpoints average if slightly off
    var Ob = mid(B, D);
    O = { x: (O.x + Ob.x) / 2, y: (O.y + Ob.y) / 2 };
    var centroid = { x: (A.x + B.x + C.x + D.x) / 4, y: (A.y + B.y + C.y + D.y) / 4 };
    var primary = info.primary;
    var showDiags = primary === "parallelogram" || primary === "rhombus" ||
      primary === "rectangle" || primary === "square";
    var showDiagPerp = primary === "rhombus" || primary === "square";
    var showEqualDiags = primary === "rectangle" || primary === "square";
    var showBisectHalves = primary === "parallelogram" || primary === "rhombus" ||
      primary === "rectangle" || primary === "square";
    var showAngleBisect = primary === "rhombus" || primary === "square";

    svg.appendChild(E("polygon", {
      points: [A, B, C, D].map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "rgba(56,189,248,.1)", stroke: "none",
    }));

    var sides = [
      { a: A, b: B, len: dist(A, B) },
      { a: B, b: C, len: dist(B, C) },
      { a: C, b: D, len: dist(C, D) },
      { a: D, b: A, len: dist(D, A) },
    ];
    sides.forEach(function (s) { svg.appendChild(seg(s.a, s.b, INK, SW)); });

    // Diagonals (dashed) for special shapes — draw under marks
    if (showDiags) {
      svg.appendChild(dashedSeg(A, C, "#fb923c", 2));
      svg.appendChild(dashedSeg(B, D, "#fb923c", 2));
      svg.appendChild(E("circle", { cx: O.x, cy: O.y, r: 3.5, fill: INK }));
      svg.appendChild(labelAt(O, primary === "rhombus" || primary === "square" ? "E" : "O", -14, -8, INK));
      if (showDiagPerp) {
        svg.appendChild(rightAngleMark(O, A, B, 10));
      }
    }

    // Parallel arrows offset from mid (t=0.32) so ticks at mid do not overlap
    if (info.parAB_DC) {
      svg.appendChild(parallelArrows(A, B, 1, GOOD, 0.32));
      svg.appendChild(parallelArrows(D, C, 1, GOOD, 0.32));
    }
    if (info.parAD_BC) {
      svg.appendChild(parallelArrows(A, D, 2, GOOD, 0.32));
      svg.appendChild(parallelArrows(B, C, 2, GOOD, 0.32));
    }

    // Build length segments for tick groups: 4 sides + optional diag pieces
    var markSegs = sides.map(function (s) {
      return { a: s.a, b: s.b, len: s.len, kind: "side" };
    });
    if (showEqualDiags) {
      markSegs.push({ a: A, b: C, len: dist(A, C), kind: "diagFull" });
      markSegs.push({ a: B, b: D, len: dist(B, D), kind: "diagFull" });
    } else if (showBisectHalves && info.diagsBisect) {
      markSegs.push({ a: A, b: O, len: dist(A, O), kind: "half" });
      markSegs.push({ a: O, b: C, len: dist(O, C), kind: "half" });
      markSegs.push({ a: B, b: O, len: dist(B, O), kind: "half" });
      markSegs.push({ a: O, b: D, len: dist(O, D), kind: "half" });
    }
    var ticks = equalTickGroups(markSegs);
    markSegs.forEach(function (s, i) {
      if (!ticks[i]) return;
      // sides: ticks near mid (0.58) away from // arrows at 0.32
      // halves: mid of half; full diags: mid
      var t = s.kind === "side" ? 0.58 : 0.5;
      var col = s.kind === "half" || s.kind === "diagFull" ? ACCENT : TICK;
      svg.appendChild(tickMark(s.a, s.b, ticks[i], col, t));
    });

    // Angles
    if (info.all90) {
      svg.appendChild(rightAngleMark(A, D, B));
      svg.appendChild(rightAngleMark(B, A, C));
      svg.appendChild(rightAngleMark(C, B, D));
      svg.appendChild(rightAngleMark(D, C, A));
    } else if (info.oppAngEq && info.bothPar) {
      svg.appendChild(angleArc(A, B, D, 28, VIOLET, false));
      svg.appendChild(angleArc(C, B, D, 28, VIOLET, false));
      svg.appendChild(angleArc(B, A, C, 24, MARK, true));
      svg.appendChild(angleArc(D, A, C, 24, MARK, true));
    }

    // Rhombus / square: diagonal bisects angle at C (sample), matching notes
    if (showAngleBisect && showDiags) {
      svg.appendChild(angleArc(C, B, O, 18, TICK, true));
      svg.appendChild(angleArc(C, D, O, 18, TICK, true));
    }

    ["A", "B", "C", "D"].forEach(function (name, i) {
      svg.appendChild(handle(verts[i], i, INK));
      svg.appendChild(outwardLabel(verts[i], centroid, name));
    });

    // badges
    var badges = document.getElementById("det-badges");
    badges.innerHTML = "";
    [
      { key: "trapezium", text: "Trapezium" },
      { key: "parallelogram", text: "Parallelogram" },
      { key: "rhombus", text: "Rhombus" },
      { key: "rectangle", text: "Rectangle" },
      { key: "square", text: "Square" },
    ].forEach(function (L) {
      var b = document.createElement("span");
      b.className = "badge" + (info.names[L.key] ? " on" : "");
      b.textContent = L.text;
      badges.appendChild(b);
    });

    var P = PROPS[info.primary];
    renderMixed(document.getElementById("det-caption"), P.title);
    var propsEl = document.getElementById("det-props");
    propsEl.innerHTML = "<ul class=\"prop-list\"></ul>";
    var ul = propsEl.querySelector("ul");
    P.list.forEach(function (line) {
      var li = document.createElement("li");
      ul.appendChild(li);
      renderMixed(li, line);
    });

    renderProve(info);
    renderTable(info);
    // refresh preset active state
    makeButtons(document.getElementById("det-preset-btns"), [
      { id: "trapezium", label: "Trapezium" },
      { id: "parallelogram", label: "Parallelogram" },
      { id: "rhombus", label: "Rhombus" },
      { id: "rectangle", label: "Rectangle" },
      { id: "square", label: "Square" },
    ], activePreset, applyPreset);
  }

  function applyPreset(id) {
    activePreset = id;
    verts = PRESETS[id].map(function (p) { return { x: p.x, y: p.y }; });
    proveReasonId = null;
    proveStep = 0;
    renderDetect();
  }

  function isParSide(info, p, q) {
    var A = info.A, B = info.B, C = info.C, D = info.D;
    if ((p === A && q === B) || (p === B && q === A) || (p === D && q === C) || (p === C && q === D)) return info.parAB_DC;
    if ((p === A && q === D) || (p === D && q === A) || (p === B && q === C) || (p === C && q === B)) return info.parAD_BC;
    return false;
  }

  function renderProve(info) {
    var opts = proveOptions(info);
    if (!opts.some(function (o) { return o.id === proveReasonId; })) {
      proveReasonId = opts[0].id;
      proveStep = 0;
    }
    makeButtons(document.getElementById("prove-reason-btns"), opts, proveReasonId, function (id) {
      proveReasonId = id;
      proveStep = 0;
      renderDetect();
    });
    var recipe = opts.filter(function (o) { return o.id === proveReasonId; })[0] || opts[0];
    var steps = recipe.steps;
    proveStep = clamp(proveStep, 0, steps.length - 1);
    var S = steps[proveStep];
    var body = document.getElementById("prove-body");
    body.innerHTML = "";
    var lab = document.createElement("div");
    lab.className = "step-label";
    lab.textContent = "Step " + (proveStep + 1) + " of " + steps.length;
    var title = document.createElement("p");
    title.className = "step-title";
    var text = document.createElement("p");
    text.className = "step-text";
    body.appendChild(lab);
    body.appendChild(title);
    body.appendChild(text);
    renderMixed(title, S.t);
    renderMixed(text, S.x);

    var dots = document.getElementById("prove-dots");
    dots.innerHTML = "";
    steps.forEach(function (_, i) {
      var d = document.createElement("span");
      if (i === proveStep) d.className = "on";
      dots.appendChild(d);
    });
    document.getElementById("prove-prev").disabled = proveStep === 0;
    document.getElementById("prove-next").disabled = proveStep === steps.length - 1;
  }

  var FAMILY_FEATURES = [
    { key: "onePara", label: "Exactly \\(1\\) pair //" },
    { key: "twoPara", label: "Both pairs //" },
    { key: "oppEq", label: "Opp. sides equal" },
    { key: "allEq", label: "All sides equal" },
    { key: "all90", label: "All angles \\(90^\\circ\\)" },
    { key: "diagBisect", label: "Diags. bisect" },
    { key: "diagPerp", label: "Diags. ⊥" },
    { key: "diagEq", label: "Diags. equal" },
  ];
  var FAMILY_MATRIX = {
    trapezium: { onePara: 1, twoPara: 0, oppEq: 0, allEq: 0, all90: 0, diagBisect: 0, diagPerp: 0, diagEq: 0 },
    parallelogram: { onePara: 0, twoPara: 1, oppEq: 1, allEq: 0, all90: 0, diagBisect: 1, diagPerp: 0, diagEq: 0 },
    rhombus: { onePara: 0, twoPara: 1, oppEq: 1, allEq: 1, all90: 0, diagBisect: 1, diagPerp: 1, diagEq: 0 },
    rectangle: { onePara: 0, twoPara: 1, oppEq: 1, allEq: 0, all90: 1, diagBisect: 1, diagPerp: 0, diagEq: 1 },
    square: { onePara: 0, twoPara: 1, oppEq: 1, allEq: 1, all90: 1, diagBisect: 1, diagPerp: 1, diagEq: 1 },
  };
  var FAMILY_COLS = ["trapezium", "parallelogram", "rhombus", "rectangle", "square"];
  var FAMILY_LABELS = { trapezium: "Trapezium", parallelogram: "Parallelogram", rhombus: "Rhombus", rectangle: "Rectangle", square: "Square" };

  function renderTable(info) {
    var table = document.getElementById("det-table");
    if (!table) return;
    var hl = info.primary === "quad" ? "" : info.primary;
    var head = "<tr><th>Property</th>" + FAMILY_COLS.map(function (c) {
      return "<th>" + FAMILY_LABELS[c] + "</th>";
    }).join("") + "</tr>";
    var rows = FAMILY_FEATURES.map(function (f) {
      return "<tr" + (hl ? "" : "") + " class=\"" + (hl ? "hl-check" : "") + "\" data-feat=\"" + f.key + "\"><td class=\"feat\">" + f.label + "</td>" +
        FAMILY_COLS.map(function (c) {
          var yes = FAMILY_MATRIX[c][f.key];
          var cls = (c === hl ? " hl" : "");
          return "<td class=\"" + (yes ? "yes" : "no") + (c === hl ? "\" style=\"background:rgba(2,132,199,.12)" : "") + "\">" + (yes ? "✓" : "—") + "</td>";
        }).join("") + "</tr>";
    }).join("");
    // highlight whole column via row cells — also mark rows
    table.innerHTML = head + FAMILY_FEATURES.map(function (f) {
      var cells = FAMILY_COLS.map(function (c) {
        var yes = FAMILY_MATRIX[c][f.key];
        var style = c === hl ? " style=\"background:rgba(2,132,199,.12)\"" : "";
        return "<td class=\"" + (yes ? "yes" : "no") + "\"" + style + ">" + (yes ? "✓" : "—") + "</td>";
      }).join("");
      return "<tr" + (hl ? " class=\"hl\"" : "") + "><td class=\"feat\">" + f.label + "</td>" + cells + "</tr>";
    }).join("");
    // Actually only highlight if primary matches a column — highlight those cells only, not all rows
    table.innerHTML = head + FAMILY_FEATURES.map(function (f) {
      var cells = FAMILY_COLS.map(function (c) {
        var yes = FAMILY_MATRIX[c][f.key];
        var style = c === hl ? " style=\"background:rgba(2,132,199,.12)\"" : "";
        return "<td class=\"" + (yes ? "yes" : "no") + "\"" + style + ">" + (yes ? "✓" : "—") + "</td>";
      }).join("");
      return "<tr><td class=\"feat\">" + f.label + "</td>" + cells + "</tr>";
    }).join("");
    if (window.renderMathInElement) {
      window.renderMathInElement(table, { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
    }
  }

  function bindDetect() {
    var svg = document.getElementById("det-svg");
    if (!svg) return;
    svg.addEventListener("pointerdown", function (e) {
      if (e.target.dataset.drag != null) {
        detDrag = +e.target.dataset.drag;
        e.target.setPointerCapture(e.pointerId);
      }
    });
    svg.addEventListener("pointermove", function (e) {
      if (detDrag == null) return;
      var p = svgPt(svg, e);
      verts[detDrag].x = clamp(p.x, 30, 470);
      verts[detDrag].y = clamp(p.y, 30, 310);
      activePreset = null;
      renderDetect();
    });
    svg.addEventListener("pointerup", function () { detDrag = null; });
    svg.addEventListener("pointercancel", function () { detDrag = null; });
    document.getElementById("prove-prev").addEventListener("click", function () {
      if (proveStep > 0) { proveStep--; renderDetect(); }
    });
    document.getElementById("prove-next").addEventListener("click", function () {
      proveStep++;
      renderDetect();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     LAB 2 — Mid-pt / Intercept (3 horizontals + 2 transversals)
     ═══════════════════════════════════════════════════════════ */
  var thmMode = "midpt";
  var thmY = [90, 190, 300];
  // Each transversal: top handle (x at y≈40) and bottom handle (x at y≈350)
  var thmT = [
    { top: 120, bot: 160 },
    { top: 380, bot: 420 },
  ];
  var thmDrag = null; // { kind:'y'|'t', i, which }

  function thmLinePts(ti) {
    return [
      { x: thmT[ti].top, y: 40 },
      { x: thmT[ti].bot, y: 350 },
    ];
  }
  function hitY(p1, p2, y) {
    var t = (y - p1.y) / ((p2.y - p1.y) || 1);
    return { x: p1.x + (p2.x - p1.x) * t, y: y };
  }

  function ensureTransversalSpan() {
    // Keep top above first parallel and bottom below last so they always cut all three
    // Handles already at y=40 and y=350; horizontals between 70–320 — OK by construction.
    // Also keep the two transversals from becoming nearly horizontal.
    thmT.forEach(function (t) {
      t.top = clamp(t.top, 40, 480);
      t.bot = clamp(t.bot, 40, 480);
    });
  }

  function thmApexPoint() {
    var L0 = thmLinePts(0), L1 = thmLinePts(1);
    var den = (L0[1].x - L0[0].x) * (L1[1].y - L1[0].y) - (L0[1].y - L0[0].y) * (L1[1].x - L1[0].x);
    if (Math.abs(den) < 1e-6) return null;
    var t = ((L1[0].x - L0[0].x) * (L1[1].y - L1[0].y) - (L1[0].y - L0[0].y) * (L1[1].x - L1[0].x)) / den;
    return { x: L0[0].x + t * (L0[1].x - L0[0].x), y: L0[0].y + t * (L0[1].y - L0[0].y) };
  }

  function lineXAtY(a, b, y) {
    var t = (y - a.y) / ((b.y - a.y) || 1);
    return a.x + (b.x - a.x) * t;
  }

  /** Place horizontals (and transversals if needed) so the active theorem holds. */
  function snapThmCondition() {
    if (thmMode === "intercept") {
      // AB = BC (and DE = EF) when the three // lines are equally spaced in y
      thmY[0] = 90;
      thmY[2] = 300;
      thmY[1] = (thmY[0] + thmY[2]) / 2;
      // Mild converging transversals so the figure stays readable
      thmT[0] = { top: 150, bot: 120 };
      thmT[1] = { top: 370, bot: 400 };
    } else {
      // Mid-pt: build △PCF with B, E exact mid-points on a // through them
      var P = { x: 260, y: 28 };
      var C = { x: 135, y: 310 };
      var F = { x: 385, y: 310 };
      thmY[2] = C.y;
      thmY[1] = (P.y + C.y) / 2; // mid-points of PC, PF share this y
      thmY[0] = (P.y + thmY[1]) / 2; // AD between P and BE
      thmT[0] = { top: lineXAtY(P, C, 40), bot: lineXAtY(P, C, 350) };
      thmT[1] = { top: lineXAtY(P, F, 40), bot: lineXAtY(P, F, 350) };
    }
    renderThm();
  }

  function renderThm() {
    makeButtons(document.getElementById("thm-mode-btns"), [
      { id: "midpt", label: "Mid-pt. thm." },
      { id: "intercept", label: "Intercept thm." },
    ], thmMode, function (id) { thmMode = id; renderThm(); });

    var snapBtn = document.getElementById("thm-snap-btn");
    if (snapBtn) {
      snapBtn.textContent = thmMode === "midpt"
        ? "Fit: PB = BC, PE = EF"
        : "Fit: AB = BC";
    }

    var svg = document.getElementById("thm-svg");
    if (!svg) return;
    clr(svg);
    ensureTransversalSpan();

    // three horizontals
    thmY.forEach(function (y, i) {
      svg.appendChild(E("line", {
        x1: 30, y1: y, x2: 490, y2: y,
        stroke: GOOD, "stroke-width": 3, "stroke-linecap": "round",
      }));
      svg.appendChild(parallelArrows({ x: 70, y: y }, { x: 120, y: y }, 1, GOOD));
      // invisible drag on the line (no orange spots)
      svg.appendChild(E("circle", {
        cx: 48, cy: y, r: 18, fill: "transparent", "data-drag": "y" + i,
      }));
    });

    var L0 = thmLinePts(0), L1 = thmLinePts(1);
    // extend transversals fully across view but keep handles
    svg.appendChild(seg(L0[0], L0[1], ACCENT, 2.6));
    svg.appendChild(seg(L1[0], L1[1], VIOLET, 2.6));

    var P0 = thmY.map(function (y) { return hitY(L0[0], L0[1], y); });
    var P1 = thmY.map(function (y) { return hitY(L1[0], L1[1], y); });

    var names0 = ["A", "B", "C"], names1 = ["D", "E", "F"];
    P0.forEach(function (p, i) {
      svg.appendChild(E("circle", { cx: p.x, cy: p.y, r: 5, fill: ACCENT }));
      svg.appendChild(labelAt(p, names0[i], -16, -6, ACCENT));
    });
    P1.forEach(function (p, i) {
      svg.appendChild(E("circle", { cx: p.x, cy: p.y, r: 5, fill: VIOLET }));
      svg.appendChild(labelAt(p, names1[i], 8, -6, VIOLET));
    });

    // transversal handles — small ink dots, no orange
    svg.appendChild(handle(L0[0], "t0top", ACCENT));
    svg.appendChild(handle(L0[1], "t0bot", ACCENT));
    svg.appendChild(handle(L1[0], "t1top", VIOLET));
    svg.appendChild(handle(L1[1], "t1bot", VIOLET));

    var dAB = dist(P0[0], P0[1]), dBC = dist(P0[1], P0[2]);
    var dDE = dist(P1[0], P1[1]), dEF = dist(P1[1], P1[2]);
    var dAD = dist(P0[0], P1[0]), dBE = dist(P0[1], P1[1]), dCF = dist(P0[2], P1[2]);

    // Apex P = meeting of the two transversals (vertex of △PCF)
    var den = (L0[1].x - L0[0].x) * (L1[1].y - L1[0].y) - (L0[1].y - L0[0].y) * (L1[1].x - L1[0].x);
    var apex = null;
    if (Math.abs(den) > 1e-6) {
      var tApex = ((L1[0].x - L0[0].x) * (L1[1].y - L1[0].y) - (L1[0].y - L0[0].y) * (L1[1].x - L1[0].x)) / den;
      apex = { x: L0[0].x + tApex * (L0[1].x - L0[0].x), y: L0[0].y + tApex * (L0[1].y - L0[0].y) };
    }
    var apexOk = !!(apex && apex.y < thmY[0] - 5 && apex.x > 20 && apex.x < 500);
    var dPB = apexOk ? dist(apex, P0[1]) : 0;
    var dPE = apexOk ? dist(apex, P1[1]) : 0;
    // Mid-pt: B, E mid-points of PC, PF ⇔ PB = BC and PE = EF
    var midLeft = apexOk && lensClose(dPB, dBC);
    var midRight = apexOk && lensClose(dPE, dEF);
    var midOk = midLeft && midRight;
    var halfOk = midOk && Math.abs(dBE * 2 - dCF) < ((dBE * 2 + dCF) / 2 || 1) * EPS_LEN_REL;
    // Intercept: equal segments on one transversal between the three // lines
    var equalLeft = lensClose(dAB, dBC);
    var equalRight = lensClose(dDE, dEF);

    if (thmMode === "intercept") {
      if (equalLeft) {
        svg.appendChild(tickMark(P0[0], P0[1], 1, ACCENT, 0.5));
        svg.appendChild(tickMark(P0[1], P0[2], 1, ACCENT, 0.5));
      }
      if (equalRight) {
        svg.appendChild(tickMark(P1[0], P1[1], 1, VIOLET, 0.5));
        svg.appendChild(tickMark(P1[1], P1[2], 1, VIOLET, 0.5));
      }
    } else {
      // Mid-pt. thm.: show intercepts AD, BE, CF on the three // lines
      svg.appendChild(seg(P0[0], P1[0], midOk ? MARK : INK, midOk ? 2.4 : 1.8));
      svg.appendChild(seg(P0[1], P1[1], midOk ? MARK : INK, midOk ? 3 : 2.2));
      svg.appendChild(seg(P0[2], P1[2], midOk ? MARK : INK, midOk ? 3 : 2.2));

      if (apexOk) {
        svg.appendChild(dashedSeg(apex, P0[0], ACCENT, 1.6));
        svg.appendChild(dashedSeg(apex, P1[0], VIOLET, 1.6));
        svg.appendChild(E("circle", { cx: apex.x, cy: apex.y, r: 5, fill: INK, stroke: MARK, "stroke-width": 1.5 }));
        svg.appendChild(labelAt(apex, "P", 8, -10, MARK));
      }
      if (midLeft) {
        svg.appendChild(tickMark(apex, P0[1], 1, ACCENT, 0.5));
        svg.appendChild(tickMark(P0[1], P0[2], 1, ACCENT, 0.5));
      }
      if (midRight) {
        svg.appendChild(tickMark(apex, P1[1], 1, VIOLET, 0.5));
        svg.appendChild(tickMark(P1[1], P1[2], 1, VIOLET, 0.5));
      }
    }

    var row = document.getElementById("thm-measures");
    row.innerHTML = "";
    var chips = thmMode === "midpt"
      ? [
          "\\(AD=" + fmt(dAD / 20, 1) + "\\)",
          "\\(BE=" + fmt(dBE / 20, 1) + "\\)",
          "\\(CF=" + fmt(dCF / 20, 1) + "\\)",
          "\\(PB=" + fmt(dPB / 20, 1) + "\\)",
          "\\(BC=" + fmt(dBC / 20, 1) + "\\)",
          "\\(PE=" + fmt(dPE / 20, 1) + "\\)",
          "\\(EF=" + fmt(dEF / 20, 1) + "\\)",
        ]
      : [
          "\\(AB=" + fmt(dAB / 20, 1) + "\\)",
          "\\(BC=" + fmt(dBC / 20, 1) + "\\)",
          "\\(DE=" + fmt(dDE / 20, 1) + "\\)",
          "\\(EF=" + fmt(dEF / 20, 1) + "\\)",
        ];
    chips.forEach(function (t) {
      var c = document.createElement("span");
      c.className = "measure-chip";
      row.appendChild(c);
      renderMixed(c, t);
    });

    if (thmMode === "intercept") {
      renderMixed(document.getElementById("thm-caption"),
        equalLeft
          ? "Intercept thm.: \\(AB = BC\\) ⇒ \\(DE = EF\\) on the other transversal."
          : "Intercept thm.: if \\(AB = BC\\) on one transversal, then \\(DE = EF\\) on the other.");
      renderMixed(document.getElementById("thm-note"),
        "**How:** drag the **middle** green line (left end) until the chips show \\(AB = BC\\). Purple \\(DE\\) and \\(EF\\) should match automatically. Tilt blue/purple handles only to change the transversals. Reason: **[intercept thm.]**");
    } else {
      renderMixed(document.getElementById("thm-caption"),
        halfOk
          ? "Mid-pt. thm.: \\(PB = BC\\), \\(PE = EF\\) ⇒ \\(BE\\)//\\(CF\\) and \\(BE = \\dfrac{1}{2}CF\\)."
          : "Mid-pt. thm.: make \\(PB = BC\\) and \\(PE = EF\\) (mid-points of \\(PC\\), \\(PF\\)).");
      renderMixed(document.getElementById("thm-note"),
        "**P** = where the transversals meet (vertex of △\\(PCF\\)). **How:** drag the **middle** green line until chips show \\(PB = BC\\) and \\(PE = EF\\) (halfway from \\(P\\) to the bottom //). Then check \\(BE\\) vs \\(CF\\). Reason: **[mid-pt. thm.]**");
    }
  }

  function bindThm() {
    var svg = document.getElementById("thm-svg");
    if (!svg) return;
    var snapBtn = document.getElementById("thm-snap-btn");
    if (snapBtn && !snapBtn.dataset.bound) {
      snapBtn.dataset.bound = "1";
      snapBtn.addEventListener("click", function () { snapThmCondition(); });
    }
    svg.addEventListener("pointerdown", function (e) {
      var key = e.target.dataset.drag;
      if (key == null) return;
      thmDrag = key;
      e.target.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!thmDrag) return;
      var p = svgPt(svg, e);
      if (thmDrag.charAt(0) === "y") {
        var i = +thmDrag.slice(1);
        var y = clamp(p.y, 60, 330);
        if (i === 0) y = Math.min(y, thmY[1] - 35);
        if (i === 1) y = clamp(y, thmY[0] + 35, thmY[2] - 35);
        if (i === 2) y = Math.max(y, thmY[1] + 35);
        thmY[i] = y;
      } else if (thmDrag.indexOf("t0") === 0) {
        if (thmDrag.indexOf("top") >= 0) thmT[0].top = clamp(p.x, 40, 480);
        else thmT[0].bot = clamp(p.x, 40, 480);
      } else if (thmDrag.indexOf("t1") === 0) {
        if (thmDrag.indexOf("top") >= 0) thmT[1].top = clamp(p.x, 40, 480);
        else thmT[1].bot = clamp(p.x, 40, 480);
      }
      renderThm();
    });
    svg.addEventListener("pointerup", function () { thmDrag = null; });
    svg.addEventListener("pointercancel", function () { thmDrag = null; });
  }

  /* ═══════════════════════════════════════════════════════════
     LAB 3 — Reason bank + explainer frame
     ═══════════════════════════════════════════════════════════ */
  var reasonCat = "quad";
  var reasonActive = null;

  var REASON_CATS = [
    { id: "quad", label: "Quadrilaterals" },
    { id: "thm", label: "Mid-pt. / Intercept" },
    { id: "parallel", label: "Angles & // lines" },
    { id: "cong", label: "Congruence" },
  ];

  var REASONS = {
    quad: [
      { id: "oppSides", abbr: "[opp. sides of //gram]", desc: "Opposite sides of a parallelogram are equal.", draw: "paraSides" },
      { id: "oppAng", abbr: "[opp. ∠s of //gram]", desc: "Opposite angles of a parallelogram are equal.", draw: "paraAng" },
      { id: "diags", abbr: "[diags. of //gram]", desc: "Diagonals of a parallelogram bisect each other.", draw: "paraDiags" },
      { id: "proveSides", abbr: "[opp. sides equal]", desc: "Both pairs of opposite sides equal ⇒ parallelogram.", draw: "proveSides" },
      { id: "proveDiags", abbr: "[diags. bisect each other]", desc: "Diagonals bisect each other ⇒ parallelogram.", draw: "proveDiags" },
      { id: "prove2", abbr: "[2 sides equal and //]", desc: "One pair of opposite sides equal and // ⇒ parallelogram.", draw: "prove2" },
      { id: "rhombus", abbr: "[property of rhombus]", desc: "All sides equal; diagonals ⊥ each other.", draw: "rhombus" },
      { id: "rectangle", abbr: "[property of rectangle]", desc: "All angles \\(90^\\circ\\); diagonals equal.", draw: "rectangle" },
      { id: "square", abbr: "[property of square]", desc: "Equal sides and right angles.", draw: "square" },
      { id: "trap", abbr: "[property of trapezium]", desc: "Exactly one pair of // sides.", draw: "trap" },
    ],
    thm: [
      { id: "midpt", abbr: "[mid-pt. thm.]", desc: "Segment joining mid-points of two sides is // to the third side and half as long.", draw: "midpt" },
      { id: "convMid", abbr: "[converse of mid-pt. thm.]", desc: "Line through a mid-point // to a side meets the third side at its mid-point.", draw: "convMid" },
      { id: "intercept", abbr: "[intercept thm.]", desc: "Parallels cutting equal intercepts on one transversal cut equal intercepts on any other.", draw: "intercept" },
    ],
    parallel: [
      { id: "alt", abbr: "[alt. ∠s, // lines]", desc: "Alternate interior angles are equal (Z-shape).", draw: "alt" },
      { id: "corr", abbr: "[corr. ∠s, // lines]", desc: "Corresponding angles are equal (F-shape).", draw: "corr" },
      { id: "int", abbr: "[int. ∠s, // lines]", desc: "Consecutive interior angles sum to \\(180^\\circ\\) (C-shape).", draw: "int" },
    ],
    cong: [
      { id: "SAS", abbr: "[SAS]", desc: "Two sides and included angle equal ⇒ congruent.", draw: "SAS" },
      { id: "ASA", abbr: "[ASA]", desc: "Two angles and included side equal ⇒ congruent.", draw: "ASA" },
      { id: "SSS", abbr: "[SSS]", desc: "Three sides equal ⇒ congruent.", draw: "SSS" },
      { id: "AAS", abbr: "[AAS]", desc: "Two angles and a non-included side equal ⇒ congruent.", draw: "AAS" },
      { id: "RHS", abbr: "[RHS]", desc: "Right angle, hypotenuse and one other side equal ⇒ congruent.", draw: "RHS" },
      { id: "corrS", abbr: "[corr. sides, ≅ △s]", desc: "Corresponding sides of congruent triangles are equal.", draw: "corrS", row: 2 },
      { id: "corrA", abbr: "[corr. ∠s, ≅ △s]", desc: "Corresponding angles of congruent triangles are equal.", draw: "corrA", row: 2 },
    ],
  };

  var REASON_EXPLAIN = {
    oppSides: {
      steps: [
        "In //gram \\(ABCD\\), opposite sides are equal.",
        "So \\(AB = CD\\) and \\(AD = BC\\).",
        "Write **[opp. sides of //gram]** after the statement.",
      ],
    },
    oppAng: {
      steps: [
        "Opposite angles of a //gram are equal: \\(\\angle A = \\angle C\\), \\(\\angle B = \\angle D\\).",
        "Consecutive angles are supplementary (int. ∠s, // lines).",
        "Reason: **[opp. ∠s of //gram]**",
      ],
    },
    diags: {
      steps: [
        "Diagonals meet at \\(O\\) with \\(AO = OC\\) and \\(BO = OD\\).",
        "Reason: **[diags. of //gram]**",
      ],
    },
    proveSides: {
      steps: [
        "Given both pairs of opposite sides equal.",
        "Conclude \\(ABCD\\) is a parallelogram.",
        "Reason: **[opp. sides equal]**",
      ],
    },
    proveDiags: {
      steps: [
        "Given diagonals bisect each other.",
        "Conclude parallelogram.",
        "Reason: **[diags. bisect each other]**",
      ],
    },
    prove2: {
      steps: [
        "Given one pair of opposite sides equal and //, e.g. \\(AB = DC\\) and \\(AB\\)//\\(DC\\).",
        "Conclude parallelogram.",
        "Reason: **[2 sides equal and //]**",
      ],
    },
    rhombus: {
      steps: [
        "All sides equal; diagonals are perpendicular.",
        "Reason: **[property of rhombus]**",
      ],
    },
    rectangle: {
      steps: [
        "All angles \\(90^\\circ\\); diagonals equal.",
        "Reason: **[property of rectangle]**",
      ],
    },
    square: {
      steps: [
        "Equal sides and four right angles.",
        "Reason: **[property of square]**",
      ],
    },
    trap: {
      steps: [
        "Exactly one pair of sides //.",
        "Co-interior angles with the bases sum to \\(180^\\circ\\).",
        "Reason: **[property of trapezium]**",
      ],
    },
    midpt: {
      steps: [
        "\\(D\\), \\(E\\) mid-points of \\(AB\\), \\(AC\\).",
        "Then \\(DE\\)//\\(BC\\) and \\(DE = \\dfrac{1}{2}BC\\).",
        "Reason: **[mid-pt. thm.]**",
      ],
    },
    convMid: {
      steps: [
        "\\(D\\) mid-point of \\(AB\\) and \\(DE\\)//\\(BC\\) meeting \\(AC\\) at \\(E\\).",
        "Then \\(E\\) is mid-point of \\(AC\\).",
        "Reason: **[converse of mid-pt. thm.]**",
      ],
    },
    intercept: {
      steps: [
        "Three // lines cut equal intercepts on one transversal.",
        "They cut equal intercepts on any other transversal.",
        "Reason: **[intercept thm.]**",
      ],
    },
    alt: {
      steps: [
        "Two // lines cut by a transversal.",
        "Alternate interior angles are equal (Z).",
        "Reason: **[alt. ∠s, // lines]**",
      ],
    },
    corr: {
      steps: [
        "Corresponding angles are equal (F).",
        "Reason: **[corr. ∠s, // lines]**",
      ],
    },
    int: {
      steps: [
        "Interior angles on the same side of the transversal sum to \\(180^\\circ\\) (C).",
        "Reason: **[int. ∠s, // lines]**",
      ],
    },
    SAS: { steps: ["Two sides and the included angle equal ⇒ △s congruent. **[SAS]**"] },
    ASA: { steps: ["Two angles and the included side equal ⇒ △s congruent. **[ASA]**"] },
    SSS: { steps: ["Three sides equal ⇒ △s congruent. **[SSS]**"] },
    AAS: { steps: ["Two angles and a non-included side equal ⇒ △s congruent. **[AAS]**"] },
    RHS: { steps: ["Right angle, hypotenuse and one other side equal ⇒ △s congruent. **[RHS]**"] },
    corrS: { steps: ["After congruence, matching sides are equal. **[corr. sides, ≅ △s]**"] },
    corrA: { steps: ["After congruence, matching angles are equal. **[corr. ∠s, ≅ △s]**"] },
  };

  function drawReasonFigure(svg, drawId) {
    clr(svg);
    var A = { x: 90, y: 220 }, B = { x: 280, y: 220 }, C = { x: 330, y: 70 }, D = { x: 140, y: 70 };
    function poly(pts, fill) {
      svg.appendChild(E("polygon", {
        points: pts.map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: fill || "rgba(56,189,248,.1)", stroke: "none",
      }));
    }
    function outline(pts) {
      for (var i = 0; i < pts.length; i++) svg.appendChild(seg(pts[i], pts[(i + 1) % pts.length], INK));
    }
    function labs(pts, names) {
      var cx = 0, cy = 0;
      pts.forEach(function (p) { cx += p.x; cy += p.y; });
      var cen = { x: cx / pts.length, y: cy / pts.length };
      pts.forEach(function (p, i) {
        svg.appendChild(E("circle", { cx: p.x, cy: p.y, r: 5, fill: MARK, stroke: "#0f172a", "stroke-width": 1.5 }));
        svg.appendChild(outwardLabel(p, cen, names[i]));
      });
    }

    if (drawId === "paraSides" || drawId === "proveSides") {
      poly([A, B, C, D]); outline([A, B, C, D]);
      // // at t=0.32, ticks at t=0.58 — no overlap
      svg.appendChild(parallelArrows(A, B, 1, GOOD, 0.32));
      svg.appendChild(parallelArrows(D, C, 1, GOOD, 0.32));
      svg.appendChild(parallelArrows(A, D, 2, GOOD, 0.32));
      svg.appendChild(parallelArrows(B, C, 2, GOOD, 0.32));
      svg.appendChild(tickMark(A, B, 1, TICK, 0.58));
      svg.appendChild(tickMark(D, C, 1, TICK, 0.58));
      svg.appendChild(tickMark(A, D, 2, TICK, 0.58));
      svg.appendChild(tickMark(B, C, 2, TICK, 0.58));
      labs([A, B, C, D], ["A", "B", "C", "D"]);
    } else if (drawId === "paraAng") {
      poly([A, B, C, D]); outline([A, B, C, D]);
      svg.appendChild(angleArc(A, B, D, 28, VIOLET, 1)); svg.appendChild(angleArc(C, B, D, 28, VIOLET, 1));
      svg.appendChild(angleArc(B, A, C, 22, MARK, 2)); svg.appendChild(angleArc(D, A, C, 22, MARK, 2));
      labs([A, B, C, D], ["A", "B", "C", "D"]);
    } else if (drawId === "paraDiags" || drawId === "proveDiags") {
      poly([A, B, C, D]); outline([A, B, C, D]);
      var O = mid(A, C);
      svg.appendChild(seg(A, C, ACCENT)); svg.appendChild(seg(B, D, ACCENT));
      svg.appendChild(tickMark(A, O, 1, ACCENT)); svg.appendChild(tickMark(O, C, 1, ACCENT));
      svg.appendChild(tickMark(B, O, 2, TICK)); svg.appendChild(tickMark(O, D, 2, TICK));
      svg.appendChild(E("circle", { cx: O.x, cy: O.y, r: 4, fill: MARK }));
      svg.appendChild(labelAt(O, "O", 8, -8, MARK));
      labs([A, B, C, D], ["A", "B", "C", "D"]);
    } else if (drawId === "prove2") {
      poly([A, B, C, D]); outline([A, B, C, D]);
      svg.appendChild(parallelArrows(A, B, 1, GOOD, 0.32));
      svg.appendChild(parallelArrows(D, C, 1, GOOD, 0.32));
      svg.appendChild(tickMark(A, B, 1, TICK, 0.58));
      svg.appendChild(tickMark(D, C, 1, TICK, 0.58));
      labs([A, B, C, D], ["A", "B", "C", "D"]);
    } else if (drawId === "rhombus") {
      var R = [{ x: 210, y: 50 }, { x: 340, y: 150 }, { x: 210, y: 250 }, { x: 80, y: 150 }];
      poly(R); outline(R);
      R.forEach(function (_, i) { svg.appendChild(tickMark(R[i], R[(i + 1) % 4], 1, TICK, 0.5)); });
      svg.appendChild(seg(R[0], R[2], ACCENT)); svg.appendChild(seg(R[1], R[3], ACCENT));
      svg.appendChild(rightAngleMark(mid(R[0], R[2]), R[0], R[1], 10));
      labs(R, ["A", "B", "C", "D"]);
    } else if (drawId === "rectangle" || drawId === "square") {
      var S = drawId === "square"
        ? [{ x: 120, y: 60 }, { x: 300, y: 60 }, { x: 300, y: 240 }, { x: 120, y: 240 }]
        : [{ x: 90, y: 80 }, { x: 330, y: 80 }, { x: 330, y: 220 }, { x: 90, y: 220 }];
      poly(S); outline(S);
      S.forEach(function (_, i) { svg.appendChild(rightAngleMark(S[i], S[(i + 3) % 4], S[(i + 1) % 4])); });
      if (drawId === "square") S.forEach(function (_, i) { svg.appendChild(tickMark(S[i], S[(i + 1) % 4], 1)); });
      labs(S, ["A", "B", "C", "D"]);
    } else if (drawId === "trap") {
      var T = [{ x: 130, y: 80 }, { x: 300, y: 80 }, { x: 360, y: 230 }, { x: 70, y: 230 }];
      poly(T); outline(T);
      svg.appendChild(parallelArrows(T[0], T[1], 1, GOOD, 0.4));
      svg.appendChild(parallelArrows(T[3], T[2], 1, GOOD, 0.4));
      labs(T, ["A", "B", "C", "D"]);
    } else if (drawId === "midpt" || drawId === "convMid") {
      // Standard: A apex, B C base; D, E mid-points of AB, AC; DE // BC
      var TA = { x: 210, y: 45 }, TB = { x: 55, y: 255 }, TC = { x: 365, y: 255 };
      var TD = mid(TA, TB), TE = mid(TA, TC);
      poly([TA, TB, TC]);
      svg.appendChild(seg(TA, TB, INK, SW));
      svg.appendChild(seg(TB, TC, INK, SW));
      svg.appendChild(seg(TC, TA, INK, SW));
      svg.appendChild(seg(TD, TE, INK, SW)); // DE stays white
      svg.appendChild(parallelArrows(TD, TE, 1, GOOD, 0.5));
      svg.appendChild(parallelArrows(TB, TC, 1, GOOD, 0.5)); // BC gets // too
      svg.appendChild(tickMark(TA, TD, 1, TICK, 0.5));
      svg.appendChild(tickMark(TD, TB, 1, TICK, 0.5));
      svg.appendChild(tickMark(TA, TE, 2, TICK, 0.5));
      svg.appendChild(tickMark(TE, TC, 2, TICK, 0.5));
      [
        ["A", TA], ["B", TB], ["C", TC], ["D", TD], ["E", TE],
      ].forEach(function (L) {
        svg.appendChild(E("circle", {
          cx: L[1].x, cy: L[1].y, r: 5,
          fill: L[0] === "D" || L[0] === "E" ? GOOD : MARK,
          stroke: "#0f172a", "stroke-width": 1.5,
        }));
        var cen = { x: (TA.x + TB.x + TC.x) / 3, y: (TA.y + TB.y + TC.y) / 3 };
        // Push D,E slightly farther so ticks / DE don't cover letters
        svg.appendChild(outwardLabel(L[1], cen, L[0]));
      });
    } else if (drawId === "intercept") {
      [80, 150, 220].forEach(function (y) {
        svg.appendChild(E("line", { x1: 40, y1: y, x2: 380, y2: y, stroke: GOOD, "stroke-width": 3 }));
        svg.appendChild(parallelArrows({ x: 60, y: y }, { x: 100, y: y }, 1, GOOD));
      });
      svg.appendChild(seg({ x: 100, y: 40 }, { x: 140, y: 260 }, ACCENT, 2.5));
      svg.appendChild(seg({ x: 300, y: 40 }, { x: 340, y: 260 }, VIOLET, 2.5));
      var ys = [80, 150, 220];
      var Li = [{ x: 100, y: 40 }, { x: 140, y: 260 }];
      var Ri = [{ x: 300, y: 40 }, { x: 340, y: 260 }];
      ys.forEach(function (y, i) {
        var p = hitY(Li[0], Li[1], y), q = hitY(Ri[0], Ri[1], y);
        svg.appendChild(E("circle", { cx: p.x, cy: p.y, r: 4, fill: ACCENT }));
        svg.appendChild(E("circle", { cx: q.x, cy: q.y, r: 4, fill: VIOLET }));
        svg.appendChild(labelAt(p, "ABC"[i], -14, -4, ACCENT));
        svg.appendChild(labelAt(q, "DEF"[i], 8, -4, VIOLET));
      });
      var pA = hitY(Li[0], Li[1], 80), pB = hitY(Li[0], Li[1], 150), pC = hitY(Li[0], Li[1], 220);
      svg.appendChild(tickMark(pA, pB, 1, ACCENT)); svg.appendChild(tickMark(pB, pC, 1, ACCENT));
    } else if (drawId === "alt" || drawId === "corr" || drawId === "int") {
      svg.appendChild(E("line", { x1: 40, y1: 100, x2: 380, y2: 100, stroke: GOOD, "stroke-width": 3 }));
      svg.appendChild(E("line", { x1: 40, y1: 220, x2: 380, y2: 220, stroke: GOOD, "stroke-width": 3 }));
      svg.appendChild(parallelArrows({ x: 70, y: 100 }, { x: 110, y: 100 }, 1, GOOD));
      svg.appendChild(parallelArrows({ x: 70, y: 220 }, { x: 110, y: 220 }, 1, GOOD));
      var T1 = { x: 120, y: 40 }, T2 = { x: 300, y: 280 };
      svg.appendChild(seg(T1, T2, ACCENT, 2.5));
      var H1 = hitY(T1, T2, 100), H2 = hitY(T1, T2, 220);
      var right1 = { x: H1.x + 80, y: H1.y }, left1 = { x: H1.x - 80, y: H1.y };
      var right2 = { x: H2.x + 80, y: H2.y }, left2 = { x: H2.x - 80, y: H2.y };
      var down1 = T2, up2 = T1;
      if (drawId === "corr") {
        // F-shape: same side of transversal, both “below-right” of their intersection
        svg.appendChild(angleArc(H1, right1, down1, 24, VIOLET));
        svg.appendChild(angleArc(H2, right2, down1, 24, VIOLET));
      } else if (drawId === "alt") {
        // Z-shape: alternate interior (right below top, left above bottom)
        svg.appendChild(angleArc(H1, right1, down1, 24, VIOLET));
        svg.appendChild(angleArc(H2, left2, up2, 24, VIOLET));
      } else {
        // C-shape: consecutive interior (both right side, between the // lines)
        svg.appendChild(angleArc(H1, right1, down1, 24, VIOLET));
        svg.appendChild(angleArc(H2, right2, up2, 24, VIOLET));
      }
    } else {
      // Congruence: identical triangles (exact translate)
      var U0 = { x: 55, y: 230 }, U1 = { x: 175, y: 230 }, U2 = { x: 95, y: 85 };
      var dx = 175;
      var V0 = { x: U0.x + dx, y: U0.y }, V1 = { x: U1.x + dx, y: U1.y }, V2 = { x: U2.x + dx, y: U2.y };
      var U = [U0, U1, U2], V = [V0, V1, V2];
      if (drawId === "RHS") {
        // Right-angled at U0 / V0
        U0 = { x: 60, y: 230 }; U1 = { x: 180, y: 230 }; U2 = { x: 60, y: 90 };
        V0 = { x: U0.x + dx, y: U0.y }; V1 = { x: U1.x + dx, y: U1.y }; V2 = { x: U2.x + dx, y: U2.y };
        U = [U0, U1, U2]; V = [V0, V1, V2];
      }
      poly(U); poly(V, "rgba(167,139,250,.12)");
      outline(U); outline(V);

      if (drawId === "SAS") {
        // two sides + included ∠ at U0
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5));
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
        svg.appendChild(tickMark(U0, U2, 2, TICK, 0.5));
        svg.appendChild(tickMark(V0, V2, 2, TICK, 0.5));
        svg.appendChild(angleArc(U0, U1, U2, 22, MARK));
        svg.appendChild(angleArc(V0, V1, V2, 22, MARK));
      } else if (drawId === "ASA") {
        // ∠ at U0 (1 arc), included side, ∠ at U1 (2 arcs)
        svg.appendChild(angleArc(U0, U1, U2, 22, MARK, 1));
        svg.appendChild(angleArc(V0, V1, V2, 22, MARK, 1));
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5));
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
        svg.appendChild(angleArc(U1, U0, U2, 22, VIOLET, 2));
        svg.appendChild(angleArc(V1, V0, V2, 22, VIOLET, 2));
      } else if (drawId === "SSS") {
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5));
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
        svg.appendChild(tickMark(U1, U2, 2, TICK, 0.5));
        svg.appendChild(tickMark(V1, V2, 2, TICK, 0.5));
        svg.appendChild(tickMark(U2, U0, 3, TICK, 0.5));
        svg.appendChild(tickMark(V2, V0, 3, TICK, 0.5));
      } else if (drawId === "AAS") {
        // ∠ U0 (1), ∠ U2 (2), non-included side
        svg.appendChild(angleArc(U0, U1, U2, 22, MARK, 1));
        svg.appendChild(angleArc(V0, V1, V2, 22, MARK, 1));
        svg.appendChild(angleArc(U2, U0, U1, 22, VIOLET, 2));
        svg.appendChild(angleArc(V2, V0, V1, 22, VIOLET, 2));
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5));
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
      } else if (drawId === "RHS") {
        svg.appendChild(rightAngleMark(U0, U1, U2));
        svg.appendChild(rightAngleMark(V0, V1, V2));
        svg.appendChild(tickMark(U1, U2, 2, TICK, 0.5)); // hypotenuse
        svg.appendChild(tickMark(V1, V2, 2, TICK, 0.5));
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5)); // leg
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
      } else if (drawId === "corrS") {
        // only corresponding sides — no angles
        svg.appendChild(tickMark(U0, U1, 1, TICK, 0.5));
        svg.appendChild(tickMark(V0, V1, 1, TICK, 0.5));
        svg.appendChild(tickMark(U1, U2, 2, TICK, 0.5));
        svg.appendChild(tickMark(V1, V2, 2, TICK, 0.5));
        svg.appendChild(tickMark(U2, U0, 3, TICK, 0.5));
        svg.appendChild(tickMark(V2, V0, 3, TICK, 0.5));
      } else if (drawId === "corrA") {
        // only corresponding angles — 1 / 2 / 3 arcs
        svg.appendChild(angleArc(U0, U1, U2, 22, MARK, 1));
        svg.appendChild(angleArc(V0, V1, V2, 22, MARK, 1));
        svg.appendChild(angleArc(U1, U0, U2, 22, VIOLET, 2));
        svg.appendChild(angleArc(V1, V0, V2, 22, VIOLET, 2));
        svg.appendChild(angleArc(U2, U0, U1, 22, ACCENT, 3));
        svg.appendChild(angleArc(V2, V0, V1, 22, ACCENT, 3));
      }
    }
  }

  function renderReasons() {
    makeButtons(document.getElementById("reason-cat-btns"), REASON_CATS, reasonCat, function (id) {
      reasonCat = id;
      reasonActive = null;
      renderReasons();
    });
    var grid = document.getElementById("reason-grid");
    var list = REASONS[reasonCat] || [];
    grid.innerHTML = "";
    grid.className = "reason-grid" + (reasonCat === "cong" ? " cong-grid" : "");
    var seenRow2 = false;
    list.forEach(function (r, i) {
      var b = document.createElement("button");
      b.type = "button";
      var rowCls = "";
      if (r.row === 2) {
        rowCls = " row2" + (!seenRow2 ? " row2-start" : "");
        seenRow2 = true;
      }
      b.className = "reason-card" + rowCls + (reasonActive === i ? " active" : "");
      b.innerHTML = '<span class="abbr"></span><span class="desc"></span>';
      b.querySelector(".abbr").textContent = r.abbr;
      renderMixed(b.querySelector(".desc"), r.desc);
      b.addEventListener("click", function () {
        reasonActive = i;
        renderReasons();
      });
      grid.appendChild(b);
    });

    var svg = document.getElementById("reason-svg");
    var explain = document.getElementById("reason-explain");
    if (reasonActive == null || !list[reasonActive]) {
      clr(svg);
      svg.appendChild(labelAt({ x: 80, y: 150 }, "Pick a reason →", 0, 0, "#94a3b8"));
      explain.innerHTML = "<p>Pick a reason card to see an explanation with a figure.</p>";
      return;
    }
    var R = list[reasonActive];
    drawReasonFigure(svg, R.draw);
    var ex = REASON_EXPLAIN[R.id] || { steps: [R.desc] };
    explain.innerHTML = "<p><strong></strong></p><ol></ol>";
    renderMixed(explain.querySelector("strong"), R.abbr);
    // put abbr in strong via text
    explain.querySelector("strong").textContent = R.abbr;
    var ol = explain.querySelector("ol");
    ex.steps.forEach(function (s) {
      var li = document.createElement("li");
      ol.appendChild(li);
      renderMixed(li, s);
    });
  }

  /* ── init ────────────────────────────────────────────────── */
  function init() {
    setActiveLab("detect");
    bindDetect();
    bindThm();
    renderDetect();
    renderThm();
    renderReasons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
