/* JM29 Game 2 — Proof Pipes.
 * Each given is a tap with its own colour of water. Round switches send the
 * water through a theorem valve and on to a conclusion outlet (or to
 * Cannot conclude). Every switch output is a closed pipe, so connecting the
 * water proves nothing; the theorem and the outlet must both be right.
 * Several givens can share one board: two colours in one pipe is a mix.
 * Linked switches turn together. Two-step boards pass a result box whose
 * statement becomes the given for the second theorem.
 * Leaks and mixes are plumbing slips and do not count as attempts. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function h(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function unit(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  }

  function mid(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  function rand(n) { return Math.floor(Math.random() * n); }

  function shuffle(list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = rand(i + 1); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ─── figures ────────────────────────────────────────────────────── */

  function Fig() {
    this.svg = svgEl("svg", { class: "pp-fig", viewBox: "0 0 120 100", "aria-hidden": "true" });
  }
  Fig.prototype.line = function (a, b, cls) {
    svgEl("line", { class: cls || "pp-line", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, this.svg);
    return this;
  };
  Fig.prototype.poly = function (pts) {
    svgEl("polygon", { class: "pp-line", points: pts.map(function (p) { return p.join(","); }).join(" ") }, this.svg);
    return this;
  };
  Fig.prototype.ticks = function (a, b, count) {
    var d = unit(a, b), n = [-d[1], d[0]], m = mid(a, b);
    for (var k = 0; k < count; k++) {
      var off = (k - (count - 1) / 2) * 2.6;
      var c = [m[0] + d[0] * off, m[1] + d[1] * off];
      this.line([c[0] - n[0] * 3.2, c[1] - n[1] * 3.2], [c[0] + n[0] * 3.2, c[1] + n[1] * 3.2], "pp-mark");
    }
    return this;
  };
  Fig.prototype.arrow = function (a, b, count) {
    var d = unit(a, b), n = [-d[1], d[0]], m = mid(a, b);
    for (var k = 0; k < (count || 1); k++) {
      var off = (k - ((count || 1) - 1) / 2) * 3.4;
      var c = [m[0] + d[0] * off, m[1] + d[1] * off];
      svgEl("path", {
        class: "pp-mark",
        d: "M" + (c[0] - d[0] * 2 + n[0] * 3) + "," + (c[1] - d[1] * 2 + n[1] * 3) +
           "L" + (c[0] + d[0] * 2) + "," + (c[1] + d[1] * 2) +
           "L" + (c[0] - d[0] * 2 - n[0] * 3) + "," + (c[1] - d[1] * 2 - n[1] * 3),
      }, this.svg);
    }
    return this;
  };
  Fig.prototype.label = function (p, text, dx, dy, cls) {
    var t = svgEl("text", { class: cls || "pp-pt", x: p[0] + (dx || 0), y: p[1] + (dy || 0) }, this.svg);
    t.textContent = text;
    return this;
  };
  /* Arc of the wedge at vertex between arm1 and arm2 that faces `toward`. */
  Fig.prototype.arc = function (vertex, arm1, arm2, toward, radius, count) {
    var a1 = Math.atan2(arm1[1] - vertex[1], arm1[0] - vertex[0]);
    var a2 = Math.atan2(arm2[1] - vertex[1], arm2[0] - vertex[0]);
    var diff = a2 - a1;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    var bis = a1 + diff / 2;
    var want = Math.atan2(toward[1] - vertex[1], toward[0] - vertex[0]);
    var sweep = Math.cos(bis - want) > 0 ? diff : (diff > 0 ? diff - 2 * Math.PI : diff + 2 * Math.PI);
    var large = Math.abs(sweep) > Math.PI ? 1 : 0;
    var flag = sweep >= 0 ? 1 : 0;
    var n = count || 1;
    var base = radius || 12;
    var k, r, x1, y1, x2, y2;
    for (k = 0; k < n; k++) {
      r = base - k * 3.2;
      x1 = vertex[0] + r * Math.cos(a1);
      y1 = vertex[1] + r * Math.sin(a1);
      x2 = vertex[0] + r * Math.cos(a1 + sweep);
      y2 = vertex[1] + r * Math.sin(a1 + sweep);
      svgEl("path", {
        class: "pp-mark",
        d: "M" + x1.toFixed(1) + "," + y1.toFixed(1) + "A" + r.toFixed(1) + "," + r.toFixed(1) +
           " 0 " + large + " " + flag + " " + x2.toFixed(1) + "," + y2.toFixed(1)
      }, this.svg);
    }
    return this;
  };

  var TRI = { A: [60, 10], B: [14, 90], C: [106, 90] };

  function twoMid(opts) {
    opts = opts || {};
    var A = TRI.A, B = TRI.B, C = TRI.C, M = mid(A, B), N = mid(A, C);
    var f = new Fig().poly([A, B, C]).line(M, N);
    f.ticks(A, M, 1).ticks(M, B, 1).ticks(A, N, 2).ticks(N, C, 2);
    f.label(A, opts.A || "A", 0, -3).label(B, opts.B || "B", -5, 4).label(C, opts.C || "C", 5, 4);
    f.label(M, opts.M || "M", -6, 0).label(N, opts.N || "N", 6, 0);
    if (opts.bc) f.label(mid(B, C), opts.bc, 0, -5, "pp-len");
    if (opts.mn) f.label(mid(M, N), opts.mn, 0, -4, "pp-len");
    return f.svg;
  }

  function midPar(opts) {
    opts = opts || {};
    var A = TRI.A, B = TRI.B, C = TRI.C, M = mid(A, B), N = mid(A, C);
    var f = new Fig().poly([A, B, C]).line(M, N);
    if (opts.ticks !== false) f.ticks(A, M, 1).ticks(M, B, 1);
    if (opts.arrows !== false) f.arrow(M, N, 1).arrow(B, C, 1);
    f.label(A, "A", 0, -3).label(B, "B", -5, 4).label(C, "C", 5, 4);
    f.label(M, opts.M || "M", -6, 0).label(N, opts.N || "N", 6, 0);
    if (opts.bc) f.label(mid(B, C), opts.bc, 14, -6, "pp-len");
    if (opts.mn) f.label(mid(M, N), opts.mn, 12, -5, "pp-len");
    return f.svg;
  }

  function midHalf(opts) {
    opts = opts || {};
    var A = TRI.A, B = TRI.B, C = TRI.C, M = mid(A, B), N = mid(A, C);
    var f = new Fig().poly([A, B, C]).line(M, N);
    f.ticks(A, M, 1).ticks(M, B, 1);
    f.label(A, "A", 0, -3).label(B, "B", -5, 4).label(C, "C", 5, 4).label(M, "M", -6, 0).label(N, "N", 6, 0);
    if (opts.mn) f.label(mid(M, N), opts.mn, 0, -4, "pp-len");
    return f.svg;
  }

  function intercept(opts) {
    opts = opts || {};
    var parallel = !!opts.parallel;
    var ticks = opts.ticks == null ? "left" : opts.ticks;
    var A = [30, 20], C = [40, 50], E = [50, 80];
    var B, D, F;
    if (parallel) { B = [80, 20]; D = [92, 50]; F = [104, 80]; }
    else { B = [84, 12]; D = [92, 50]; F = [100.8, 91.8]; }
    var f = new Fig();
    function across(p, q) {
      var d = unit(p, q);
      f.line([p[0] - d[0] * 14, p[1] - d[1] * 14], [q[0] + d[0] * 12, q[1] + d[1] * 12]);
    }
    across(A, B); across(C, D); across(E, F);
    f.line([25, 5], [55, 95]).line(
      [B[0] - (D[0] - B[0]) * 0.3, B[1] - (D[1] - B[1]) * 0.3],
      [F[0] + (F[0] - D[0]) * 0.25, F[1] + (F[1] - D[1]) * 0.25]
    );
    if (ticks === "left" || ticks === "both") f.ticks(A, C, 1).ticks(C, E, 1);
    if (ticks === "right" || ticks === "both") f.ticks(B, D, 1).ticks(D, F, 1);
    if (parallel) f.arrow(A, B, 1).arrow(C, D, 1).arrow(E, F, 1);
    f.label(A, "A", -6, 5).label(C, "C", -6, 5).label(E, "E", -6, 5);
    f.label(B, "B", 6, -5).label(D, "D", 6, -5).label(F, "F", 6, -5);
    return f.svg;
  }

  function trapezium(opts) {
    opts = opts || {};
    var side = opts.ticks || "left";
    var A = [35, 15], D = [85, 15], B = [10, 88], C = [110, 88], E = mid(A, B), F = mid(D, C);
    var f = new Fig().poly([A, D, C, B]).line(E, F);
    f.arrow(A, D, 1).arrow(E, F, 1).arrow(B, C, 1);
    if (side === "left" || side === "both") f.ticks(A, E, 1).ticks(E, B, 1);
    if (side === "right" || side === "both") f.ticks(D, F, 1).ticks(F, C, 1);
    f.label(A, "A", -4, -3).label(D, "D", 4, -3).label(B, "B", -5, 4).label(C, "C", 5, 4).label(E, "E", -6, 0).label(F, "F", 6, 0);
    return f.svg;
  }

  /* Parallel is not arrowed: equal corr. / alt. angles, or int. angles adding to 180°, show it. */
  function midAngle(opts) {
    opts = opts || {};
    var A = [60, 12], B = [16, 90], C = [104, 90], M = mid(A, B);
    var N = mid(A, C);
    var f = new Fig().poly([A, B, C]).line(M, N);
    if (opts.both) f.ticks(A, M, 1).ticks(M, B, 1).ticks(A, N, 2).ticks(N, C, 2);
    else f.ticks(A, M, 1).ticks(M, B, 1);
    var amn = [(A[0] + M[0] + N[0]) / 3, (A[1] + M[1] + N[1]) / 3];
    var strip = [(M[0] + B[0] + C[0]) / 3, (M[1] + B[1] + C[1]) / 3];
    if (opts.kind === "corr") {
      f.arc(M, A, N, amn, 11, 1);
      f.arc(B, A, C, strip, 12, 1);
    } else if (opts.kind === "int") {
      f.arc(M, B, N, strip, 11, 1);
      f.arc(B, M, C, strip, 12, 1);
      f.label([48, 68], "110\u00b0", 0, 0, "pp-len");
      f.label([34, 78], "70\u00b0", 0, 0, "pp-len");
    } else if (opts.kind === "base") {
      f.arc(M, A, N, amn, 11, 1);
      f.arc(N, A, M, amn, 11, 1);
    }
    f.label(A, "A", 0, -3).label(B, "B", -6, 3).label(C, "C", 5, 3).label(M, "M", -8, 1).label(N, "N", 7, -1);
    if (opts.bc) f.label(mid(B, C), opts.bc, 0, -6, "pp-len");
    return f.svg;
  }

  /* Three lines cut by two transversals. Parallel is shown by the angles, not by arrows. */
  function cutAngles(opts) {
    opts = opts || {};
    var A = [33, 18], C = [40.5, 48], E = [48, 78];
    var B = [91, 18], D = [98.5, 48], F = [106, 78];
    var f = new Fig();
    function across(p, q) {
      var d = unit(p, q);
      f.line([p[0] - d[0] * 12, p[1] - d[1] * 6], [q[0] + d[0] * 8, q[1] + d[1] * 6]);
    }
    across(A, B); across(C, D); across(E, F);
    f.line([30, 6], [52, 94]).line([88, 6], [110, 94]);
    if (opts.ticks !== false) f.ticks(A, C, 1).ticks(C, E, 1);
    var low = function (p) { return [p[0] + 12, p[1] + 7]; };
    if (opts.kind === "corr") {
      f.arc(A, B, C, low(A), 9, 1);
      f.arc(C, D, E, low(C), 9, 1);
    } else if (opts.kind === "alt") {
      f.arc(A, B, C, low(A), 9, 1);
      f.arc(E, [E[0] - 16, E[1]], C, [E[0] - 7, E[1] - 7], 9, 1);
    }
    f.label(A, "A", -9, 9).label(C, "C", -9, 9).label(E, "E", -9, 9);
    f.label(B, "B", 7, -6).label(D, "D", 7, -6).label(F, "F", 7, -6);
    return f.svg;
  }

  var FIGS = {
    twoMid: twoMid, midPar: midPar, midHalf: midHalf, intercept: intercept,
    trapezium: trapezium, midAngle: midAngle, cutAngles: cutAngles,
  };

  /* ─── cards ──────────────────────────────────────────────────────── */
  /* concl is what the theorem proves. wrong are claims the given does not
   * prove. also lists other facts the given proves in one step; they are
   * never offered as wrong outlets, and two lanes whose facts overlap are
   * never dealt together. */

  var CARDS = [
    { id: "c-mid-par", suit: "mid", fig: "twoMid",
      given: "M and N are the mid-points of AB and AC.",
      concl: "MN // BC", wrong: ["MN = BC", "AM = AN"], also: ["MN = \u00bdBC"],
      why: "Two mid-points are given, so the mid-pt thm. tells us about MN: MN // BC." },
    { id: "c-mid-half", suit: "mid", fig: "twoMid", opts: { bc: "10" },
      given: "M and N are the mid-points of AB and AC. BC = 10.",
      concl: "MN = 5", wrong: ["MN = 10", "MN = 20"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "Two mid-points give MN = \u00bdBC = 5. That is the mid-pt thm." },
    { id: "c-mid-double", suit: "mid", fig: "twoMid", opts: { mn: "3" },
      given: "M and N are the mid-points of AB and AC. MN = 3.",
      concl: "BC = 6", wrong: ["BC = 3", "BC = 1.5"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "Two mid-points give MN = \u00bdBC, so BC = 6. That is the mid-pt thm." },
    { id: "c-mid-8", suit: "mid", fig: "twoMid", opts: { bc: "8" },
      given: "M and N are the mid-points of AB and AC. BC = 8.",
      concl: "MN = 4", wrong: ["MN = 8", "MN = 16"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "Two mid-points give MN = \u00bdBC = 4. That is the mid-pt thm." },
    { id: "c-mid-12", suit: "mid", fig: "twoMid", opts: { mn: "6" },
      given: "M and N are the mid-points of AB and AC. MN = 6.",
      concl: "BC = 12", wrong: ["BC = 3", "BC = 6"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "Two mid-points give MN = \u00bdBC, so BC = 12. That is the mid-pt thm." },
    { id: "c-mid-pq", suit: "mid", fig: "twoMid", opts: { M: "P", N: "Q" },
      given: "P and Q are the mid-points of AB and AC.",
      concl: "PQ // BC", wrong: ["PQ = BC", "AP = AQ"], also: ["PQ = \u00bdBC"],
      why: "Two mid-points are given, so the mid-pt thm. tells us about PQ: PQ // BC." },
    { id: "c-int-lines", suit: "int", fig: "intercept", opts: { parallel: true },
      given: "AB // CD // EF and AC = CE.",
      concl: "BD = DF", wrong: ["AB = CD", "AC = BD"],
      why: "Parallel lines cut equal parts on one line, so they cut equal parts on the other. That is the intercept thm." },
    { id: "c-int-mid", suit: "int", fig: "midPar",
      given: "M is the mid-point of AB and MN // BC.",
      concl: "AN = NC", wrong: ["MN = BC", "AN = AM"], also: ["N is the mid-point of AC"],
      why: "Only one mid-point is given, plus a parallel line. Finding the other mid-point is the intercept thm., not the mid-pt thm." },
    { id: "c-int-trap", suit: "int", fig: "trapezium",
      given: "In trapezium ABCD, AD // EF // BC and AE = EB.",
      concl: "DF = FC", wrong: ["AD = BC", "EF = AD"],
      why: "Three parallel lines cut AB into equal parts, so they cut DC into equal parts. That is the intercept thm." },
    { id: "c-int-de", suit: "int", fig: "midPar", opts: { M: "D", N: "E" },
      given: "D is the mid-point of AB and DE // BC.",
      concl: "E is the mid-point of AC", wrong: ["DE = BC", "AD = AE"], also: ["AE = EC"],
      why: "One mid-point and a parallel line give the other mid-point. That is the intercept thm." },
    { id: "c-int-right", suit: "int", fig: "intercept", opts: { parallel: true, ticks: "right" },
      given: "AB // CD // EF and BD = DF.",
      concl: "AC = CE", wrong: ["AB = CD", "BD = AC"],
      why: "Parallel lines cut equal parts on one line, so they cut equal parts on the other. That is the intercept thm." },
    { id: "c-int-trap-right", suit: "int", fig: "trapezium", opts: { ticks: "right" },
      given: "In trapezium ABCD, AD // EF // BC and DF = FC.",
      concl: "AE = EB", wrong: ["AD = BC", "AE = DF"],
      why: "Three parallel lines cut DC into equal parts, so they cut AB into equal parts. That is the intercept thm." },
    { id: "c-ang-corr", suit: "int", angle: true, fig: "midAngle", opts: { kind: "corr" },
      given: "M is the mid-point of AB. The marked corr. \u2220s are equal.",
      concl: "AN = NC", wrong: ["MN = BC", "AM = AN"], also: ["MN // BC", "N is the mid-point of AC"],
      why: "Equal corr. \u2220s prove MN // BC. One mid-point and that parallel give AN = NC. That is the intercept thm." },
    { id: "c-ang-alt", suit: "int", angle: true, fig: "cutAngles", opts: { kind: "alt" },
      given: "The marked alt. \u2220s are equal. AC = CE.",
      concl: "BD = DF", wrong: ["AB = CD", "AC = BD"], also: ["AB // CD"],
      why: "Equal alt. \u2220s prove the three lines are parallel. Equal parts AC = CE then give BD = DF. That is the intercept thm." },
    { id: "c-ang-int", suit: "int", angle: true, fig: "midAngle", opts: { kind: "int" },
      given: "M is the mid-point of AB. The marked int. \u2220s add to 180\u00b0.",
      concl: "AN = NC", wrong: ["AN = MN", "MN = BC"], also: ["MN // BC", "N is the mid-point of AC"],
      why: "Two int. \u2220s add to 180\u00b0, so MN // BC. One mid-point and that parallel give AN = NC. That is the intercept thm." },
    { id: "c-ang-mid-corr", suit: "mid", angle: true, fig: "midAngle", opts: { kind: "corr", both: true, bc: "10" },
      given: "M and N are the mid-points of AB and AC. The marked corr. \u2220s are equal. BC = 10.",
      concl: "MN = 5", wrong: ["MN = 10", "MN = 20"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "Both mid-points are given, so the mid-pt thm. gives MN = \u00bdBC = 5. The equal corr. \u2220s are not needed for the length." },
    { id: "c-ang-mid-int", suit: "mid", angle: true, fig: "midAngle", opts: { kind: "int", both: true },
      given: "M and N are the mid-points of AB and AC. The marked int. \u2220s add to 180\u00b0.",
      concl: "MN = \u00bdBC", wrong: ["MN = BC", "MN = 2BC"], also: ["MN // BC"],
      why: "Both mid-points give MN = \u00bdBC by the mid-pt thm. The int. \u2220s also prove MN // BC, but the length comes from the mid-points." },
    { id: "c-none-half", suit: "none", fig: "midHalf", opts: { mn: "\u00bdBC" },
      given: "M is the mid-point of AB and MN = \u00bdBC.",
      concl: "N is the mid-point of AC", wrong: ["MN // BC", "AN = MN"],
      why: "MN = \u00bdBC is what the mid-pt thm. gives you, not what it needs. Without MN // BC, nothing proves N is the mid-point." },
    { id: "c-none-lines", suit: "none", fig: "intercept", opts: { parallel: false },
      given: "AC = CE.",
      concl: "BD = DF", wrong: ["AB // CD", "AB = CD"],
      why: "The three lines are not given parallel, so the intercept thm. cannot be used." },
    { id: "c-none-equal", suit: "none", fig: "twoMid",
      given: "M and N are the mid-points of AB and AC.",
      concl: "MN = BC", wrong: ["MN = 2BC", "AM = MN"], also: ["MN // BC", "MN = \u00bdBC"],
      why: "The mid-pt thm. gives MN // BC and MN = \u00bdBC. None of these claims says that." },
    { id: "c-none-para", suit: "none", fig: "midPar", opts: { ticks: false },
      given: "MN // BC.",
      concl: "AN = NC", wrong: ["M is the mid-point of AB", "MN = \u00bdBC"],
      why: "A parallel line alone is not enough. The intercept thm. also needs a mid-point." },
    { id: "c-none-one", suit: "none", fig: "midHalf",
      given: "M is the mid-point of AB.",
      concl: "N is the mid-point of AC", wrong: ["MN // BC", "MN = \u00bdBC"],
      why: "One mid-point and no parallel line proves nothing about N." },
    { id: "c-none-bare", suit: "none", fig: "intercept", opts: { parallel: true, ticks: "none" },
      given: "AB // CD // EF.",
      concl: "BD = DF", wrong: ["AC = CE", "AB = CD"],
      why: "The lines are parallel, but no parts on one side are given equal, so the intercept thm. does not apply." },
    { id: "c-ang-bare", suit: "none", angle: true, fig: "cutAngles", opts: { kind: "corr", ticks: false },
      given: "The marked corr. \u2220s are equal.",
      concl: "BD = DF", wrong: ["AC = CE", "AC = BD"], also: ["AB // CD"],
      why: "Equal corr. \u2220s do prove the lines are parallel. The intercept thm. still needs equal parts on one side, and none are given." },
    { id: "c-ang-base", suit: "none", angle: true, fig: "midAngle", opts: { kind: "base" },
      given: "M is the mid-point of AB. The marked angles of \u25b3AMN are equal.",
      concl: "AN = NC", wrong: ["MN // BC", "MN = \u00bdBC"], also: ["AM = AN"],
      why: "Those equal angles sit in \u25b3AMN. They are not a corr., alt. or int. pair for MN and BC, so they do not prove MN // BC." },
  ];

  /* Two-step proofs: the result of step 1 is a new given for step 2. */
  var CHAINS = [
    { id: "ch-mn10", chain: true, fig: "midPar", opts: { bc: "10" },
      given: "M is the mid-point of AB, MN // BC and BC = 10.",
      steps: [
        { thm: "int", concl: "N is the mid-point of AC", wrong: ["MN = BC", "AN = AM"] },
        { thm: "mid", concl: "MN = 5", wrong: ["MN = 10", "MN = 20"] },
      ],
      why: "Step 1: one mid-point and MN // BC make N the mid-point of AC (intercept thm.). Step 2: now there are two mid-points, so MN = \u00bdBC = 5 (mid-pt thm.)." },
    { id: "ch-mn12", chain: true, fig: "midPar", opts: { bc: "12" },
      given: "M is the mid-point of AB, MN // BC and BC = 12.",
      steps: [
        { thm: "int", concl: "N is the mid-point of AC", wrong: ["MN = BC", "AN = AM"] },
        { thm: "mid", concl: "MN = 6", wrong: ["MN = 12", "MN = 24"] },
      ],
      why: "Step 1: one mid-point and MN // BC make N the mid-point of AC (intercept thm.). Step 2: now there are two mid-points, so MN = \u00bdBC = 6 (mid-pt thm.)." },
    { id: "ch-de4", chain: true, fig: "midPar", opts: { M: "D", N: "E", mn: "4" },
      given: "D is the mid-point of AB, DE // BC and DE = 4.",
      steps: [
        { thm: "int", concl: "E is the mid-point of AC", wrong: ["DE = BC", "AD = AE"] },
        { thm: "mid", concl: "BC = 8", wrong: ["BC = 4", "BC = 2"] },
      ],
      why: "Step 1: one mid-point and DE // BC make E the mid-point of AC (intercept thm.). Step 2: now there are two mid-points, so DE = \u00bdBC and BC = 8 (mid-pt thm.)." },
    { id: "ch-pq7", chain: true, fig: "midPar", opts: { M: "P", N: "Q", mn: "7" },
      given: "P is the mid-point of AB, PQ // BC and PQ = 7.",
      steps: [
        { thm: "int", concl: "Q is the mid-point of AC", wrong: ["PQ = BC", "AP = AQ"] },
        { thm: "mid", concl: "BC = 14", wrong: ["BC = 7", "BC = 3.5"] },
      ],
      why: "Step 1: one mid-point and PQ // BC make Q the mid-point of AC (intercept thm.). Step 2: now there are two mid-points, so PQ = \u00bdBC and BC = 14 (mid-pt thm.)." },
    { id: "ch-ang10", chain: true, angle: true, fig: "midAngle", opts: { kind: "corr", bc: "10" },
      given: "M is the mid-point of AB. The marked corr. \u2220s are equal. BC = 10.",
      steps: [
        { thm: "int", concl: "N is the mid-point of AC", wrong: ["MN = BC", "AM = AN"] },
        { thm: "mid", concl: "MN = 5", wrong: ["MN = 10", "MN = 20"] },
      ],
      why: "Step 1: equal corr. \u2220s give MN // BC, and with one mid-point N is the mid-point of AC (intercept thm.). Step 2: two mid-points give MN = \u00bdBC = 5 (mid-pt thm.)." },
  ];

  var FILLER = ["MN = 2BC", "AM = MN", "AB = CD", "AC = BD", "AD = BC"];

  /* tpl: board layout. links: switches that turn together. */
  var LEVELS = [
    { tpl: "single", lanes: [{ suit: "mid", angle: false }], scramble: 2,
      tip: "Water flows from the given on the left. Click a round switch to send it another way: first through a theorem, then to the conclusion that theorem proves. Click a plain pipe to turn it so the joins line up. Then open the water." },
    { tpl: "single", lanes: [{ suit: "int", angle: false }], scramble: 3,
      tip: "One mid-point and a parallel line is a different theorem from two mid-points." },
    { tpl: "two", lanes: [{ suit: "none", angle: false }, { prov: true, angle: false }], scramble: 3,
      tip: "Two givens share one board, each with its own colour of water. The two colours must never meet in the same pipe. If a given proves nothing, send it to the Cannot conclude drain next to its tap." },
    { tpl: "two", lanes: [{ angle: false }, { angle: false }], links: [["o0", "o2"]], scramble: 4,
      tip: "Switches with the same coloured ring and letter are linked. Turning one turns the other the same way." },
    { tpl: "chain", lanes: [{ chain: true, angle: false }], scramble: 4,
      tip: "A two-step proof. After the first theorem the water picks a result box. That result becomes a new given, and the water goes round to the second theorem and the final conclusion." },
    { tpl: "two", lanes: [{ angle: true }, { angle: true }], links: [["t1", "t2"]], scramble: 4,
      tip: "Marked angles can prove two lines are parallel. The two switches next to the taps are linked." },
    { tpl: "chain", lanes: [{ chain: true }], links: [["a2", "b2"]], scramble: 5,
      tip: "Two steps again. The switch that picks the result box is linked to the switch that picks the final conclusion." },
    { tpl: "three", lanes: [{}, {}, {}], links: [["t1", "t3"], ["o1", "o2"]], scramble: 6,
      tip: "Three givens and two pairs of linked switches. Plan every route before you open the water." },
  ];

  var THM_NAME = { mid: "Mid-pt thm.", int: "Intercept thm." };
  var LANE_COLOR = ["#38bdf8", "#fb923c", "#a3e635"];
  var LINK_COLOR = ["", "#c084fc", "#f472b6"];
  var BEST_KEY = "jm29-proof-pipes-best";

  /* ─── boards ─────────────────────────────────────────────────────── */

  var CELL = 60;
  var N = 0, E = 1, S = 2, W = 3;
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  var DIRANG = [-90, 0, 90, 180];
  var BASE = { straight: [E, W], elbow: [N, E] };

  function opp(d) { return (d + 2) % 4; }

  function openings(t) {
    return BASE[t.kind].map(function (d) { return (d + t.rot) % 4; });
  }

  function Board(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.cells = {}; this.taps = []; this.sw = {};
    this.nV = 0; this.nOut = 0; this.nRel = 0;
  }
  Board.prototype.put = function (c, r, t) {
    t.c = c; t.r = r;
    this.cells[c + "," + r] = t;
    if (t.kind === "switch") this.sw[t.id] = t;
    if (t.kind === "tap") this.taps[t.lane] = t;
    if (t.kind === "valve") this.nV = Math.max(this.nV, t.vslot + 1);
    if (t.kind === "drain" && t.slot !== "X") this.nOut = Math.max(this.nOut, t.slot + 1);
    if (t.kind === "relay") this.nRel = Math.max(this.nRel, t.rslot + 1);
    return t;
  };
  Board.prototype.h = function (c, r, fixed) { return this.put(c, r, { kind: "straight", sol: 0, fixed: !!fixed }); };
  Board.prototype.v = function (c, r, fixed) { return this.put(c, r, { kind: "straight", sol: 1, fixed: !!fixed }); };
  Board.prototype.bend = function (c, r, a, b, fixed) {
    var k;
    for (k = 0; k < 4; k++) {
      var o = [(N + k) % 4, (E + k) % 4];
      if (o.indexOf(a) >= 0 && o.indexOf(b) >= 0) break;
    }
    return this.put(c, r, { kind: "elbow", sol: k, fixed: !!fixed });
  };

  /* Same seed, same layout: the deal and the drawn board must match. */
  function seeded(seed) {
    return function (n) {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n);
    };
  }

  function shuffleWith(rnd, list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = rnd(i + 1); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* Each deal places the parts at random spots inside loose column bands,
   * then routes every connection as a winding pipe that never crosses
   * another, so no two boards share a route. */

  var FAIL = {};
  var AROUND = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var PERMS = [];
  (function () {
    for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) for (var c = 0; c < 4; c++) {
      if (a !== b && b !== c && a !== c) PERMS.push([a, b, c, 6 - a - b - c]);
    }
  })();
  var RING = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

  function Layout(cols, rows, rnd) {
    this.B = new Board(cols, rows);
    this.rnd = rnd;
    this.taken = {};
    this.port = {};
    this.soft = {};
    this.edges = [];
  }
  Layout.prototype.free = function (c, r) {
    return c >= 0 && r >= 0 && c < this.B.cols && r < this.B.rows && !this.taken[c + "," + r];
  };
  /* Random free cell in the band whose `need` neighbours are free too. */
  Layout.prototype.spot = function (c0, c1, r0, r1, need) {
    r0 = Math.max(0, r0); r1 = Math.min(this.B.rows - 1, r1);
    if (c1 < c0 || r1 < r0) throw FAIL;
    var good = [], c, r, k;
    for (c = c0; c <= c1; c++) for (r = r0; r <= r1; r++) {
      var ok = this.free(c, r) && !this.port[c + "," + r] && !this.soft[c + "," + r];
      for (k = 0; ok && k < need.length; k++) {
        ok = this.free(c + need[k][0], r + need[k][1]) && !this.port[(c + need[k][0]) + "," + (r + need[k][1])];
      }
      for (k = 0; ok && k < RING.length; k++) {
        var q = (c + RING[k][0]) + "," + (r + RING[k][1]);
        ok = !this.B.cells[q];
      }
      if (ok) good.push([c, r]);
    }
    if (!good.length) throw FAIL;
    return good[this.rnd(good.length)];
  };
  Layout.prototype.add = function (p, t, ports, extra) {
    var self = this;
    this.taken[p[0] + "," + p[1]] = true;
    (extra || []).forEach(function (e) { self.taken[(p[0] + e[0]) + "," + (p[1] + e[1])] = true; });
    (ports || []).forEach(function (d) { self.port[(p[0] + DX[d]) + "," + (p[1] + DY[d])] = true; });
    return this.B.put(p[0], p[1], t);
  };
  Layout.prototype.tap = function (r0, r1, lane) {
    var t = this.add(this.spot(0, 0, r0, r1, [[1, 0]]), { kind: "tap", lane: lane });
    this.soft[1 + "," + t.r] = true;
    return t;
  };
  Layout.prototype.sw = function (c0, c1, r0, r1, id) {
    return this.add(this.spot(c0, c1, Math.max(1, r0), Math.min(this.B.rows - 2, r1), AROUND),
      { kind: "switch", id: id, ins: [W], outs: [N, E, S], state: 0 }, [N, E, S, W]);
  };
  Layout.prototype.valve = function (c0, c1, r0, r1, slot) {
    return this.add(this.spot(c0, c1, r0, r1, [[-1, 0], [1, 0]]), { kind: "valve", vslot: slot }, [W, E]);
  };
  /* Merges and joints face their neighbours once everything is placed (orient). */
  Layout.prototype.merge = function (c0, c1, r0, r1) {
    return this.add(this.spot(c0, c1, r0, r1, AROUND), { kind: "merge", flex: true }, [N, E, S, W]);
  };
  /* Elbow shared by two lanes: its answer depends on the deal, so plant() picks it. */
  Layout.prototype.joint = function (c0, c1, r0, r1) {
    return this.add(this.spot(c0, c1, r0, r1, AROUND), { kind: "elbow", joint: true, flex: true, rot: 0 }, [N, E, S, W]);
  };
  Layout.prototype.cannot = function (c0, c1, r0, r1) {
    var label = [[1, 0], [2, 0], [3, 0]];
    return this.add(this.spot(c0, c1, r0, r1, [[-1, 0]].concat(label)),
      { kind: "drain", slot: "X", inD: W, label: "right" }, [W], label);
  };
  /* n outlets (or result boxes) stacked in column c, rows r0..r1. */
  Layout.prototype.column = function (c, n, r0, r1, relay) {
    var self = this, rows = [], r;
    for (r = r0; r <= r1; r++) rows.push(r);
    return shuffleWith(this.rnd, rows).slice(0, n).sort(function (a, b) { return a - b; }).map(function (row, i) {
      if (!relay) {
        return self.add([c, row], { kind: "drain", slot: i, inD: W, label: "right" }, [W], [[1, 0], [2, 0], [3, 0]]);
      }
      var t = self.add([c, row], { kind: "relay", rslot: i }, [W], [[1, 0], [2, 0]]);
      self.B.h(c + 1, row, true).hidden = true;
      t.exit = self.B.h(c + 2, row, true);
      t.exit.hidden = true;
      self.port[(c + 3) + "," + row] = true;
      return t;
    });
  };
  /* Water leaves tile a through side da and enters tile b through side db. */
  Layout.prototype.link = function (a, da, b, db) {
    this.edges.push({ a: a, da: da, b: b, db: db, da0: da, db0: db });
  };
  /* A switch's three outlets go to the targets; orient() decides which goes where. */
  Layout.prototype.fan = function (s, targets) {
    var self = this;
    targets.forEach(function (tg) { self.link(s, "fan", tg[0], tg[1]); });
  };

  function toward(t, p, d) {
    var x = p.c - t.c, y = p.r - t.r, len = Math.sqrt(x * x + y * y) || 1;
    return (x * DX[d] + y * DY[d]) / len;
  }
  /* Point every flexible side at the part on the other end of its pipe,
   * so the pipes leave in an order that does not force them to cross. */
  Layout.prototype.orient = function (noise) {
    var self = this, B = this.B, k, todo = this.edges.filter(function (e) { return !e.done; });
    todo.forEach(function (e) { e.da = e.da0; e.db = e.db0; });
    for (k in B.cells) {
      var t = B.cells[k];
      if (t.kind === "switch") {
        var fans = todo.filter(function (e) { return e.a === t && e.da === "fan"; });
        fans.forEach(function (e) {
          var a = Math.atan2(e.b.c - t.c, t.r - e.b.r);
          e.key = (a < -Math.PI / 2 ? a + 2 * Math.PI : a) + self.rnd(100) * noise / 50;
        });
        fans.sort(function (p, q) { return p.key - q.key; }).forEach(function (e, i) { e.da = t.outs[i]; });
      }
      if (!t.flex) continue;
      var ins = todo.filter(function (e) { return e.b === t; });
      var out = todo.filter(function (e) { return e.a === t; })[0];
      if (!out) continue;
      var best = -1e9, pick = null;
      PERMS.forEach(function (p) {
        if (t.joint && (p[1] !== (p[0] + 1) % 4 && p[1] !== (p[0] + 3) % 4 || p[2] !== opp(p[1]))) return;
        var sc = toward(t, out.b, p[0]) + self.rnd(100) * noise / 50;
        ins.forEach(function (e, j) { sc += toward(t, e.a, p[j + 1]); });
        if (sc > best) { best = sc; pick = p; }
      });
      t.out = pick[0]; out.da = pick[0]; t.ins = [];
      ins.forEach(function (e, j) { e.db = pick[j + 1]; t.ins.push(pick[j + 1]); });
      for (var d = 0; d < 4; d++) {
        var used = d === t.out || t.ins.indexOf(d) >= 0;
        this.port[(t.c + DX[d]) + "," + (t.r + DY[d])] = used || undefined;
      }
    }
  };

  function sideTo(p, q) {
    for (var d = 0; d < 4; d++) if (p[0] + DX[d] === q[0] && p[1] + DY[d] === q[1]) return d;
    return -1;
  }

  /* Cheapest path over cells that ok() allows; cost(v) prices entering cell v. */
  Layout.prototype.path = function (s, t, ok, cost) {
    var cols = this.B.cols, si = s[1] * cols + s[0], ti = t[1] * cols + t[0], k;
    if (!ok(s[0], s[1]) || !ok(t[0], t[1])) return null;
    var dist = {}, prev = {}, heap = [[0, si]];
    dist[si] = 0;
    function push(x) {
      heap.push(x);
      for (var i = heap.length - 1; i > 0;) {
        var p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp; i = p;
      }
    }
    function pop() {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (var i = 0; ;) {
          var l = 2 * i + 1, r = l + 1, m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          var tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp; i = m;
        }
      }
      return top;
    }
    while (heap.length) {
      var h = pop(), d = h[0], u = h[1];
      if (d !== dist[u]) continue;
      if (u === ti) break;
      var uc = u % cols, ur = (u - uc) / cols;
      for (k = 0; k < 4; k++) {
        var nc = uc + DX[k], nr = ur + DY[k];
        if (!ok(nc, nr)) continue;
        var v = nr * cols + nc, nd = d + cost(v);
        if (dist[v] == null || nd < dist[v]) { dist[v] = nd; prev[v] = u; push([nd, v]); }
      }
    }
    if (dist[ti] == null) return null;
    var out = [], x = ti;
    while (true) {
      out.unshift([x % cols, Math.floor(x / cols)]);
      if (x === si) break;
      x = prev[x];
    }
    return out;
  };

  /* Negotiated routing: pipes may overlap at first, overlapping cells get
   * dearer each round, until every pipe has cells of its own. */
  Layout.prototype.route = function () {
    var self = this, B = this.B, cols = B.cols, n = cols * B.rows, ends = {}, k, bad = false;
    var edges = this.edges.filter(function (e) { return !e.done; }), base = [], hist = [], use = [], pres = 1, it, over = 1;
    for (k = 0; k < n; k++) { base[k] = 1 + this.rnd(6); hist[k] = 0; use[k] = 0; }
    edges.forEach(function (e, i) {
      e.s = [e.a.c + DX[e.da], e.a.r + DY[e.da]];
      e.t = [e.b.c + DX[e.db], e.b.r + DY[e.db]];
      e.path = null;
      [e.s, e.t].forEach(function (p) {
        var key = p[0] + "," + p[1];
        if (ends[key] != null && ends[key] !== i) bad = true;
        ends[key] = i;
      });
    });
    if (bad) return false;
    function cost(v) { return base[v] + hist[v] + pres * use[v]; }
    function idx(q) { return q[1] * cols + q[0]; }
    for (it = 0; it < 30 && over; it++) {
      var order = shuffleWith(this.rnd, edges.map(function (e, i) { return i; }));
      for (k = 0; k < order.length; k++) {
        var i = order[k], e = edges[i];
        if (e.path) e.path.forEach(function (q) { use[idx(q)]--; });
        var p = this.path(e.s, e.t, function (c, r) {
          var key = c + "," + r;
          return self.free(c, r) && (ends[key] === i || (ends[key] == null && !self.port[key]));
        }, cost);
        if (!p) return false;
        p.forEach(function (q) { use[idx(q)]++; });
        e.path = p;
      }
      over = 0;
      for (k = 0; k < n; k++) if (use[k] > 1) { over++; hist[k] += 4 * (use[k] - 1); }
      pres *= 2;
    }
    if (over) return false;
    var tiles = [];
    edges.forEach(function (e) {
      var p = e.path, last = p.length - 1;
      p.forEach(function (q, j) {
        var a = j === 0 ? opp(e.da) : sideTo(q, p[j - 1]);
        var b = j === last ? opp(e.db) : sideTo(q, p[j + 1]);
        if (a === b) bad = true;
        tiles.push([q, a, b]);
      });
    });
    if (bad) return false;
    tiles.forEach(function (t) {
      var q = t[0], a = t[1], b = t[2];
      self.taken[q[0] + "," + q[1]] = true;
      if (a === opp(b)) B.put(q[0], q[1], { kind: "straight", sol: a % 2 === 1 ? 0 : 1 });
      else B.bend(q[0], q[1], a, b);
    });
    edges.forEach(function (e) { e.done = true; });
    return true;
  };

  Layout.prototype.save = function () {
    var B = this.B;
    function copy(o) { var c = {}, k; for (k in o) c[k] = o[k]; return c; }
    return { taken: copy(this.taken), port: copy(this.port), soft: copy(this.soft), cells: copy(B.cells),
      sw: copy(B.sw), taps: B.taps.slice(), edges: this.edges.length, nV: B.nV, nOut: B.nOut, nRel: B.nRel };
  };
  Layout.prototype.load = function (s) {
    var B = this.B;
    this.taken = s.taken; this.port = s.port; this.soft = s.soft;
    B.cells = s.cells; B.sw = s.sw; B.taps = s.taps;
    B.nV = s.nV; B.nOut = s.nOut; B.nRel = s.nRel;
    this.edges.length = s.edges;
  };

  /* Columns from `block` onwards hold outlet labels, so pipes stay out. */
  function genLayout(cols, rows, block, rnd, build) {
    for (var tries = 0; tries < 3000; tries++) {
      var L = new Layout(cols, rows, rnd), c, r;
      for (c = block[0]; c <= block[1]; c++) for (r = 0; r < rows; r++) L.taken[c + "," + r] = true;
      try { build(L); } catch (err) { if (err === FAIL) continue; throw err; }
      for (var o = 0; o < 4; o++) {
        L.orient(o ? 1 : 0.01);
        if (L.route()) return L.B;
      }
    }
    return null;
  }

  /* Build and route the board one stage at a time; a stage that will not
   * route is redone on its own before the whole board is thrown away. */
  function genStaged(cols, rows, rnd, stages) {
    for (var tries = 0; tries < 60; tries++) {
      var L = new Layout(cols, rows, rnd), s, ok = true;
      for (s = 0; s < stages.length && ok; s++) {
        var snap = L.save(), a, o;
        ok = false;
        for (a = 0; a < 40 && !ok; a++) {
          L.load(snap);
          snap = L.save();
          try { stages[s](L); } catch (err) { if (err === FAIL) continue; throw err; }
          for (o = 0; o < 4 && !ok; o++) {
            L.orient(o ? 1 : 0.01);
            ok = L.route();
          }
        }
      }
      if (ok) return L.B;
    }
    return null;
  }

  /* One given: switch 1 picks a theorem (or Cannot conclude), the two theorem
   * pipes merge, switch 2 picks one of three outlets or result boxes. */
  function module(L, o) {
    var OC = o.oc, top = L.rnd(2) === 0, bx = band(top ? 0 : 2, 3, o.r0, o.r1);
    var b0 = band(top ? 1 : 0, 3, o.r0, o.r1), b1 = band(top ? 2 : 1, 3, o.r0, o.r1);
    var s1 = L.sw(1, 2, o.r0, o.r1, o.id + "1");
    var x = L.cannot(1, OC - 7, bx[0], bx[1]);
    var v0 = L.valve(3, OC - 6, b0[0], b0[1], o.v);
    var v1 = L.valve(3, OC - 6, b1[0], b1[1], o.v + 1);
    var m = L.merge(Math.max(v0.c, v1.c) + 1, OC - 4, v0.r, v1.r);
    var s2 = L.sw(m.c + 1, OC - 3, o.r0, o.r1, o.id + "2");
    L.fan(s1, [[v0, W], [v1, W], [x, W]]);
    L.link(v0, E, m, "in");
    L.link(v1, E, m, "in");
    L.link(m, "out", s2, W);
    L.fan(s2, o.outs.map(function (t) { return [t, W]; }));
    return s1;
  }

  /* Row slice i of m, so parts keep their top-to-bottom order without crossing. */
  function band(i, m, r0, r1) {
    var h = r1 - r0 + 1;
    return [r0 + Math.floor(i * h / m), r0 + Math.floor((i + 1) * h / m) - 1];
  }

  /* n givens share n + 1 theorem corridors. Corridor 0 and corridor n belong
   * to the first and last tap; each corridor between is fed by a joint that
   * either neighbouring tap can claim. Neighbouring corridor switches share
   * the outlet between them through a merge. From top to bottom the rows
   * alternate corridor, given, corridor, ... so no two pipes have to cross. */
  function lanes(L, n, OC) {
    var rows = L.B.rows, k = n + 1, m = 2 * n + 1, i, b;
    var outs = L.column(OC, 2 * k + 1, 0, rows - 1);
    var taps = [], ts = [], xs = [], js = [], vs = [], os = [], ms = [];
    for (i = 0; i < n; i++) { b = band(2 * i + 1, m, 0, rows - 1); taps.push(L.tap(b[0], b[1], i)); }
    taps.forEach(function (tp, j) { ts.push(L.sw(1, 2, tp.r - 1, tp.r + 1, "t" + (j + 1))); });
    for (i = 0; i < n; i++) { b = band(2 * i + 1, m, 0, rows - 1); xs.push(L.cannot(3, 6, b[0], b[1])); }
    for (i = 0; i < n - 1; i++) { b = band(2 * i + 2, m, 0, rows - 1); js.push(L.joint(2, 5, b[0], b[1])); }
    for (i = 0; i < k; i++) { b = band(2 * i, m, 0, rows - 1); vs.push(L.valve(6, OC - 6, b[0], b[1], i)); }
    for (i = 0; i < 2 * k - 1; i++) {
      b = band(i, 2 * k - 1, 1, rows - 2);
      if (i % 2) ms.push(L.merge(OC - 4, OC - 2, b[0], b[1]));
      else os.push(L.sw(OC - 5, OC - 3, b[0], b[1], "o" + i / 2));
    }
    taps.forEach(function (tp, j) { L.link(tp, E, ts[j], W); });
    ts.forEach(function (s, j) {
      L.fan(s, [
        [xs[j], W],
        j === 0 ? [vs[0], W] : [js[j - 1], "in"],
        j === n - 1 ? [vs[k - 1], W] : [js[j], "in"],
      ]);
    });
    js.forEach(function (jt, j) { L.link(jt, "out", vs[j + 1], W); });
    vs.forEach(function (v, j) { L.link(v, E, os[j], W); });
    ms.forEach(function (m, j) { L.link(m, "out", outs[2 * j + 2], W); });
    os.forEach(function (s, j) {
      L.fan(s, [
        j === 0 ? [outs[0], W] : [ms[j - 1], "in"],
        [outs[2 * j + 1], W],
        j === k - 1 ? [outs[2 * j + 2], W] : [ms[j], "in"],
      ]);
    });
  }

  var TEMPLATES = {
    single: function (rnd) {
      return genLayout(14, 7, [11, 13], rnd, function (L) {
        var outs = L.column(10, 3, 0, 6);
        var tap = L.tap(0, 6, 0);
        L.link(tap, E, module(L, { r0: 0, r1: 6, oc: 10, id: "a", v: 0, outs: outs }), W);
      });
    },
    chain: function (rnd) {
      var rel, s1, c;
      /* Rows 6-7 stay empty until the last stage, so the result boxes can reach module B. */
      var B = genStaged(16, 15, rnd, [
        function (L) {
          for (c = 0; c < 16; c++) L.taken[c + ",6"] = L.taken[c + ",7"] = true;
          rel = L.column(10, 3, 0, 5, true);
          var tap = L.tap(0, 5, 0);
          L.link(tap, E, module(L, { r0: 0, r1: 5, oc: 10, id: "a", v: 0, outs: rel }), W);
        },
        function (L) {
          s1 = module(L, { r0: 8, r1: 14, oc: 10, id: "b", v: 2, outs: L.column(10, 3, 8, 14) });
        },
        function (L) {
          for (c = 0; c < 16; c++) { delete L.taken[c + ",6"]; delete L.taken[c + ",7"]; }
          var mz = L.merge(3, 14, 6, 7);
          rel.forEach(function (t) { L.link(t.exit, E, mz, "in"); });
          L.link(mz, "out", s1, W);
        },
      ]);
      if (B) B.vgroups = [[0, 1], [2, 3]];
      return B;
    },
    two: function (rnd) {
      return genLayout(17, 11, [14, 16], rnd, function (L) { lanes(L, 2, 13); });
    },
    three: function (rnd) {
      return genLayout(18, 15, [15, 17], rnd, function (L) { lanes(L, 3, 14); });
    },
  };

  /* ─── water ──────────────────────────────────────────────────────── */

  function pass(t, inD) {
    var o;
    switch (t.kind) {
      case "straight":
      case "elbow":
        o = openings(t);
        if (o.indexOf(inD) < 0) return null;
        return o[0] === inD ? o[1] : o[0];
      case "valve":
      case "relay": return inD === W ? E : null;
      case "merge": return t.ins.indexOf(inD) >= 0 ? t.out : null;
      case "switch":
        if (t.ins.indexOf(inD) < 0) return null;
        o = t.outs[t.state];
        return o === inD ? null : o;
      default: return null;
    }
  }

  function trace(B, tap) {
    var c = tap.c, r = tap.r, out = E, guard = 0;
    var run = { lane: tap.lane, path: [{ t: tap, dirs: [E] }], valves: [], relays: [], end: null, leak: null };
    while (guard++ < 200) {
      var nc = c + DX[out], nr = r + DY[out], inD = opp(out);
      var t = B.cells[nc + "," + nr];
      if (t && t.kind === "drain" && t.inD === inD) {
        run.path.push({ t: t, dirs: [inD] });
        run.end = t;
        return run;
      }
      var next = t ? pass(t, inD) : null;
      if (next == null) {
        run.leak = { c: c, r: r, dir: out, back: !!t && t.kind === "switch" && t.ins.indexOf(inD) >= 0 };
        return run;
      }
      if (t.kind === "valve") run.valves.push(t);
      if (t.kind === "relay") run.relays.push(t);
      run.path.push({ t: t, dirs: [inD, next] });
      c = nc; r = nr; out = next;
    }
    run.leak = { c: c, r: r, dir: out };
    return run;
  }

  function findMix(runs) {
    var seen = {}, i, j;
    for (i = 0; i < runs.length; i++) {
      for (j = 0; j < runs[i].path.length; j++) {
        var t = runs[i].path[j].t, k = t.c + "," + t.r;
        if (seen[k] != null && seen[k] !== i) return t;
        seen[k] = i;
      }
    }
    return null;
  }

  /* ─── dealing ────────────────────────────────────────────────────── */

  function provable(card) { return !!card.chain || card.suit !== "none"; }
  function finalConcl(card) { return card.chain ? card.steps[1].concl : card.concl; }
  function knows(card) {
    var k = (card.also || []).slice();
    if (provable(card)) k.push(finalConcl(card));
    if (card.chain) k.push(card.steps[0].concl);
    return k;
  }
  function clash(a, b) {
    return (provable(a) && knows(b).indexOf(finalConcl(a)) >= 0) ||
           (provable(b) && knows(a).indexOf(finalConcl(b)) >= 0);
  }
  function matches(want, c) {
    if (want.suit && c.suit !== want.suit) return false;
    if (want.prov && c.suit === "none") return false;
    if (want.angle != null && !!c.angle !== want.angle) return false;
    return true;
  }

  function pickCards(L, used) {
    for (var tries = 0; tries < 80; tries++) {
      var cards = [], ok = true;
      shuffle(L.lanes).forEach(function (want) {
        if (!ok) return;
        var pool = (want.chain ? CHAINS : CARDS).filter(function (c) {
          return matches(want, c) && cards.indexOf(c) < 0 &&
            cards.every(function (o) { return !clash(o, c); });
        });
        if (!pool.length) { ok = false; return; }
        var fresh = pool.filter(function (c) { return !used[c.id]; });
        var from = fresh.length ? fresh : pool;
        cards.push(from[rand(from.length)]);
      });
      if (ok) return cards;
    }
    return null;
  }

  function linkGroups(B, links) {
    var groups = [], inGroup = {}, id;
    (links || []).forEach(function (ids, i) {
      groups.push(ids.slice());
      ids.forEach(function (sid) { inGroup[sid] = true; B.sw[sid].link = i + 1; });
    });
    for (id in B.sw) if (!inGroup[id]) groups.push([id]);
    return groups;
  }

  /* Pick random switch settings, follow the water, and if every given lands
   * somewhere it could be right, label the board so that route is the answer. */
  function plant(B, cards, groups) {
    var a, k;
    for (a = 0; a < 800; a++) {
      groups.forEach(function (g) {
        var st = rand(3);
        g.forEach(function (id) { B.sw[id].state = st; });
      });
      for (k in B.cells) {
        if (B.cells[k].joint) B.cells[k].rot = rand(4);
        else if (B.cells[k].sol != null) B.cells[k].rot = B.cells[k].sol;
      }
      var runs = B.taps.map(function (tap) { return trace(B, tap); });
      if (runs.some(function (r) { return r.leak; }) || findMix(runs)) continue;
      var plan = { valve: {}, out: {}, relay: {}, keys: {}, states: {}, joints: {} }, ok = true;
      runs.forEach(function (run, i) {
        var card = cards[i], end = run.end;
        if (!ok) return;
        if (card.chain) {
          if (end.slot === "X" || run.valves.length !== 2 || run.relays.length !== 1) { ok = false; return; }
          plan.valve[run.valves[0].vslot] = card.steps[0].thm;
          plan.valve[run.valves[1].vslot] = card.steps[1].thm;
          plan.relay[run.relays[0].rslot] = card.steps[0].concl;
          plan.out[end.slot] = card.steps[1].concl;
        } else if (card.suit === "none") {
          if (end.slot !== "X") { ok = false; return; }
        } else {
          if (end.slot === "X" || run.valves.length !== 1) { ok = false; return; }
          plan.valve[run.valves[0].vslot] = card.suit;
          plan.out[end.slot] = card.concl;
        }
        run.path.forEach(function (s) { plan.keys[s.t.c + "," + s.t.r] = true; });
      });
      if (!ok) continue;
      for (k in B.sw) plan.states[k] = B.sw[k].state;
      for (k in B.cells) if (B.cells[k].joint) plan.joints[k] = B.cells[k].rot;
      return plan;
    }
    return null;
  }

  function fillTexts(n, planted, pool, banned) {
    var used = {}, out = [], i, k;
    banned.forEach(function (t) { used[t] = true; });
    for (k in planted) used[planted[k]] = true;
    var rest = shuffle(pool).concat(shuffle(FILLER)).filter(function (t) {
      if (used[t]) return false;
      used[t] = true;
      return true;
    });
    for (i = 0; i < n; i++) out[i] = planted[i] != null ? planted[i] : (rest.shift() || "\u2014");
    return out;
  }

  function dealLevel(L, used) {
    for (var tries = 0; tries < 40; tries++) {
      var cards = pickCards(L, used);
      if (!cards) continue;
      var seed = rand(1e9);
      var B = TEMPLATES[L.tpl](seeded(seed));
      if (!B) continue;
      var groups = linkGroups(B, L.links);
      var plan = plant(B, cards, groups);
      if (!plan) continue;
      var banned = [], outPool = [], relPool = [];
      cards.forEach(function (c) {
        banned = banned.concat(knows(c));
        if (c.chain) { outPool = outPool.concat(c.steps[1].wrong); relPool = relPool.concat(c.steps[0].wrong); }
        else if (c.suit === "none") outPool = outPool.concat([c.concl], c.wrong);
        else outPool = outPool.concat(c.wrong);
      });
      var valves = [], i, free = [];
      for (i = 0; i < B.nV; i++) {
        if (plan.valve[i]) valves[i] = plan.valve[i];
        else { valves[i] = Math.random() < 0.5 ? "mid" : "int"; free.push(i); }
      }
      (B.vgroups || [valves.map(function (v, j) { return j; })]).forEach(function (grp) {
        var same = grp.every(function (j) { return valves[j] === valves[grp[0]]; });
        var open = grp.filter(function (j) { return free.indexOf(j) >= 0; });
        if (same && open.length) {
          var f = open[rand(open.length)];
          valves[f] = valves[f] === "mid" ? "int" : "mid";
        }
      });
      return {
        cards: cards, plan: plan, valves: valves, seed: seed,
        outs: fillTexts(B.nOut, plan.out, outPool, banned),
        rels: B.nRel ? fillTexts(B.nRel, plan.relay, relPool, banned) : [],
      };
    }
    return null;
  }

  /* ─── judging ────────────────────────────────────────────────────── */

  function hint(thm) {
    return thm === "mid"
      ? "The mid-pt thm. needs two mid-points. Count them in the given."
      : "The intercept thm. needs parallel lines plus a mid-point or equal parts. Look again at what is given.";
  }

  function judge(card, run, deal) {
    var end = run.end;
    var said = end.slot === "X" ? null : deal.outs[end.slot];
    if (card.chain) {
      var s = card.steps;
      var v = run.valves.map(function (t) { return t.thm; });
      var rel = run.relays.length ? deal.rels[run.relays[0].rslot] : null;
      if (end.slot === "X") return { msg: "This can be proved in two steps. The result of step 1 is a new given for step 2." };
      if (v[0] !== s[0].thm) return { msg: "Step 1: wrong theorem. " + hint(v[0]), at: run.valves[0] };
      if (rel !== s[0].concl) return { msg: "Step 1 does not prove \u201c" + rel + "\u201d. Try another result box.", at: run.relays[0] };
      if (v[1] !== s[1].thm) return { msg: "Step 2: wrong theorem. You now also know \u201c" + rel + "\u201d. " + hint(v[1]), at: run.valves[1] };
      if (said !== s[1].concl) return { msg: "Step 2 does not prove \u201c" + said + "\u201d. Try another outlet." };
      return { ok: true };
    }
    if (end.slot === "X") {
      if (card.suit === "none") return { ok: true };
      return { msg: "This one can be proved. Check which theorem has everything it needs in the given." };
    }
    if (card.suit === "none") {
      return { msg: "\u201c" + said + "\u201d cannot be proved from this given. Does any theorem have everything it needs?" };
    }
    var thm = run.valves.length ? run.valves[0].thm : null;
    if (thm !== card.suit) return { msg: "Wrong theorem. " + hint(thm), at: run.valves[0] };
    if (said !== card.concl) return { msg: "Right theorem, but it does not prove \u201c" + said + "\u201d. Try another outlet." };
    return { ok: true };
  }

  /* ─── drawing ────────────────────────────────────────────────────── */

  var EDGE = [[30, 0], [60, 30], [30, 60], [0, 30]];
  var JOINT = { "pp-casing": 10, "pp-metal": 7, "pp-water": 4.5 };

  function arm(g, d, cls, from) {
    var f = from || 0;
    return svgEl("line", {
      class: cls, x1: 30 + DX[d] * f, y1: 30 + DY[d] * f, x2: EDGE[d][0], y2: EDGE[d][1],
    }, g);
  }

  function layers(t, g, dirs) {
    ["pp-casing", "pp-metal", "pp-water"].forEach(function (cls) {
      dirs.forEach(function (d) {
        var el = arm(g, d, cls);
        if (cls === "pp-water") t.waters.push({ el: el, d: d });
      });
      var j = svgEl("circle", { class: cls + "-j", cx: 30, cy: 30, r: JOINT[cls] }, g);
      if (cls === "pp-water") t.waters.push({ el: j, d: -1 });
    });
  }

  function wrapText(text, max) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w; }
      else cur = cur ? cur + " " + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function textBox(svg, x, r, w, text, cls, tcls) {
    var lines = wrapText(text, 19);
    var box = svgEl("rect", { class: cls, x: x, y: r * CELL + 7, width: w, height: CELL - 14, rx: 8 }, svg);
    var tx = svgEl("text", { class: tcls, x: x + 10, y: r * CELL + 30 - (lines.length - 1) * 8.5 }, svg);
    lines.forEach(function (ln, i) {
      var sp = svgEl("tspan", { x: x + 10, dy: i ? 17 : 0 }, tx);
      sp.textContent = ln;
    });
    return box;
  }

  function makeButton(g, label, fn) {
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", label);
    g.classList.add("pp-turn");
    g.addEventListener("click", fn);
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
    });
  }

  function drawTile(svg, B, deal, t, onTurn) {
    var g = svgEl("g", { class: "pp-tile pp-" + t.kind, transform: "translate(" + t.c * CELL + " " + t.r * CELL + ")" }, svg);
    t.g = g;
    t.waters = [];
    if (t.kind === "relay") {
      t.box = textBox(svg, t.c * CELL + 4, t.r, 3 * CELL - 8, deal.rels[t.rslot], "pp-relay", "pp-relay-t");
      return;
    }
    if (t.hidden) return;
    var hit = function () { svgEl("rect", { class: "pp-hit", x: 1, y: 1, width: CELL - 2, height: CELL - 2, rx: 8 }, g); };
    if (BASE[t.kind]) {
      if (!t.fixed) hit();
      var rg = svgEl("g", { class: "pp-rot", style: "transform:rotate(" + t.angle + "deg)" }, g);
      layers(t, rg, BASE[t.kind]);
      t.rg = rg;
      if (!t.fixed) makeButton(g, "Pipe. Click to turn it.", function () { onTurn(t); });
    } else if (t.kind === "switch") {
      hit();
      var disc = svgEl("circle", { class: "pp-disc", cx: 30, cy: 30, r: 21 }, g);
      if (t.link) disc.style.stroke = LINK_COLOR[t.link];
      layers(t, g, [N, E, S, W].filter(function (d) { return t.ins.indexOf(d) >= 0 || t.outs.indexOf(d) >= 0; }));
      var ag = svgEl("g", { class: "pp-rot", style: "transform:rotate(" + t.angle + "deg)" }, g);
      ["pp-casing", "pp-metal pp-arm", "pp-water"].forEach(function (cls) {
        var el = arm(ag, E, cls);
        if (cls === "pp-water") t.waters.push({ el: el, d: -1 });
      });
      svgEl("path", { class: "pp-arrow", d: "M43 23L53 30L43 37Z" }, ag);
      svgEl("circle", { class: "pp-knob", cx: 30, cy: 30, r: 6 }, g);
      if (t.link) {
        var lt = svgEl("text", { class: "pp-linkt", x: 52, y: 9 }, g);
        lt.textContent = "AB".charAt(t.link - 1);
        lt.style.fill = LINK_COLOR[t.link];
      }
      t.rg = ag;
      makeButton(g, t.link ? "Linked switch. Click to turn it and its partner." : "Switch. Click to send the water another way.", function () { onTurn(t); });
    } else if (t.kind === "valve") {
      layers(t, g, [W, E]);
      svgEl("circle", { class: "pp-wheel", cx: 30, cy: 30, r: 11 }, g);
      svgEl("path", { class: "pp-spoke", d: "M30 19V41M19 30H41" }, g);
      var tag = svgEl("text", { class: "pp-tag pp-tag-" + t.thm, x: 30, y: 9 }, g);
      tag.textContent = THM_NAME[t.thm];
    } else if (t.kind === "merge") {
      layers(t, g, t.ins.concat([t.out]));
    } else if (t.kind === "tap") {
      layers(t, g, [E]);
      var tank = svgEl("rect", { class: "pp-tank", x: 4, y: 14, width: 30, height: 32, rx: 6 }, g);
      tank.style.fill = B.taps.length > 1 ? LANE_COLOR[t.lane] : "";
      var lab = svgEl("text", { class: "pp-tank-t" + (B.taps.length > 1 ? " pp-tank-n" : ""), x: 19, y: 31 }, g);
      lab.textContent = B.taps.length > 1 ? String(t.lane + 1) : "GIVEN";
    } else if (t.kind === "drain") {
      layers(t, g, [t.inD]);
      var cx = 30 - DX[t.inD] * 6, cy = 30 - DY[t.inD] * 6;
      svgEl("rect", { class: "pp-grate" + (t.slot === "X" ? " pp-grate-x" : ""), x: cx - 15, y: cy - 15, width: 30, height: 30, rx: 6 }, g);
      svgEl("path", { class: "pp-bars", d: "M" + (cx - 7) + " " + (cy - 9) + "v18M" + cx + " " + (cy - 9) + "v18M" + (cx + 7) + " " + (cy - 9) + "v18" }, g);
      var x = t.label === "right" ? (t.c + 1) * CELL + 6 : t.label.c * CELL + 6;
      var x2 = t.slot === "X";
      t.labelEl = textBox(svg, x, t.r, 3 * CELL - 12, x2 ? "Cannot conclude" : deal.outs[t.slot],
        "pp-out" + (x2 ? " pp-out-x" : ""), "pp-out-t" + (x2 ? " pp-out-tx" : ""));
    }
  }

  function wet(t, dirs, color) {
    t.g.classList.add("wet");
    t.g.style.setProperty("--w", color);
    t.waters.forEach(function (w) {
      var on = (t.kind !== "merge" && t.kind !== "switch") || w.d < 0 || dirs.indexOf(w.d) >= 0;
      w.el.classList.toggle("on", on);
    });
    if (t.box) { t.box.classList.add("wet"); t.box.style.setProperty("--w", color); }
  }

  function spray(svg, leak, color) {
    var x = leak.c * CELL + EDGE[leak.dir][0], y = leak.r * CELL + EDGE[leak.dir][1];
    var g = svgEl("g", { class: "pp-fx", transform: "translate(" + x + " " + y + ")" }, svg);
    for (var i = 0; i < 7; i++) {
      var a = (leak.dir - 1) * Math.PI / 2 + (i - 3) * 0.32;
      var d = svgEl("circle", { class: "pp-drop", cx: 0, cy: 0, r: 2.6 + (i % 3) }, g);
      d.style.fill = color;
      d.style.setProperty("--dx", (Math.cos(a) * (16 + (i % 2) * 8)).toFixed(1) + "px");
      d.style.setProperty("--dy", (Math.sin(a) * (16 + (i % 2) * 8)).toFixed(1) + "px");
      d.style.animationDelay = (i * 40) + "ms";
    }
    svgEl("circle", { class: "pp-ring", cx: 0, cy: 0, r: 12 }, g);
  }

  function mixMark(svg, t) {
    var g = svgEl("g", { class: "pp-fx", transform: "translate(" + (t.c * CELL + 30) + " " + (t.r * CELL + 30) + ")" }, svg);
    svgEl("circle", { class: "pp-ring", cx: 0, cy: 0, r: 16 }, g);
    svgEl("circle", { class: "pp-mixdot", cx: 0, cy: 0, r: 26 }, g);
  }

  /* ─── game ───────────────────────────────────────────────────────── */

  function Game(root) {
    this.root = root;
    this.level = 0;
    this.stars = [];
    this.used = {};
    this.busy = false;
    this.timers = [];
    this.build();
    this.startLevel();
  }

  Game.prototype.build = function () {
    var self = this;
    var top = h("div", "pp-top", null, this.root);
    this.levelEl = h("span", "pp-level", null, top);
    this.starEl = h("span", "pp-stars", null, top);
    var reset = h("button", "pp-btn pp-btn-ghost", "Reset pipes", top);
    reset.type = "button";
    reset.addEventListener("click", function () { if (!self.busy && !self.cleared) self.dealPipes(); });
    this.tipEl = h("p", "pp-tip", null, this.root);
    this.mainEl = h("div", "pp-main", null, this.root);
    this.cardsEl = h("div", "pp-cards", null, this.mainEl);
    this.boardEl = h("div", "pp-boardwrap", null, this.mainEl);
    var act = h("div", "pp-actions", null, this.root);
    this.goBtn = h("button", "pp-btn pp-go", "Open the water \u25b8", act);
    this.goBtn.type = "button";
    this.goBtn.addEventListener("click", function () { self.open(); });
    this.feedEl = h("div", "pp-feed", null, act);
    this.doneEl = h("div", "pp-done", null, this.root);
  };

  Game.prototype.startLevel = function () {
    var L = LEVELS[this.level], self = this;
    this.attempts = 0;
    this.cleared = false;
    this.busy = false;
    this.deal = dealLevel(L, this.used);
    this.deal.cards.forEach(function (c) { self.used[c.id] = true; });
    this.levelEl.textContent = "Level " + (this.level + 1) + " / " + LEVELS.length;
    this.tipEl.textContent = L.tip;
    this.doneEl.innerHTML = "";
    this.doneEl.classList.remove("show");
    this.goBtn.disabled = false;
    this.updateStars();
    this.renderCards();
    this.dealPipes();
  };

  Game.prototype.renderCards = function () {
    var cards = this.deal.cards, many = cards.length > 1, el = this.cardsEl;
    el.innerHTML = "";
    el.className = "pp-cards pp-cards-" + cards.length;
    cards.forEach(function (card, i) {
      var box = h("div", "pp-card", null, el);
      box.style.setProperty("--lane", LANE_COLOR[i]);
      var head = h("div", "pp-card-head", null, box);
      h("span", "pp-badge", many ? "Given " + (i + 1) : "Given", head);
      if (card.chain) h("span", "pp-steps", "2 steps", head);
      var body = h("div", "pp-card-body", null, box);
      body.appendChild(FIGS[card.fig](card.opts || null));
      h("p", "pp-given", card.given, body);
    });
  };

  Game.prototype.updateStars = function () {
    var total = this.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
    this.starEl.textContent = "\u2605 " + total + " / " + LEVELS.length * 3;
  };

  Game.prototype.clearTimers = function () {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  };

  Game.prototype.dealPipes = function () {
    var self = this, L = LEVELS[this.level], deal = this.deal, k;
    this.clearTimers();
    this.feedEl.innerHTML = "";
    this.boardEl.innerHTML = "";
    var B = TEMPLATES[L.tpl](seeded(deal.seed));
    var groups = linkGroups(B, L.links);
    this.B = B;
    this.groupOf = {};
    groups.forEach(function (g) {
      var st = rand(3);
      g.forEach(function (id) { self.groupOf[id] = g; B.sw[id].state = st; });
    });
    var onRoute = [], offRoute = [], joints = [];
    for (k in B.cells) {
      var t = B.cells[k];
      if (t.kind === "valve") t.thm = deal.valves[t.vslot];
      if (t.joint) { t.sol = deal.plan.joints[k]; joints.push(t); continue; }
      if (t.sol != null) {
        t.rot = t.sol;
        if (!t.fixed) (deal.plan.keys[k] ? onRoute : offRoute).push(t);
      }
    }
    var picked = shuffle(onRoute).slice(0, L.scramble);
    picked = picked.concat(shuffle(offRoute).slice(0, L.scramble - picked.length), joints);
    picked.forEach(function (t) {
      if (t.kind === "straight") t.rot = 1 - t.sol;
      else t.rot = (t.sol + 1 + rand(3)) % 4;
    });
    for (k in B.cells) {
      var c = B.cells[k];
      if (c.sol != null) c.angle = c.rot * 90;
      if (c.kind === "switch") c.angle = DIRANG[c.outs[c.state]];
    }

    var svg = svgEl("svg", {
      class: "pp-board",
      viewBox: "0 0 " + B.cols * CELL + " " + B.rows * CELL,
      role: "group",
      "aria-label": "Pipe board",
    });
    /* Big boards may run past the screen rather than shrink below ~44px a cell. */
    svg.style.minHeight = "min(" + B.rows * 44 + "px, " + (B.rows / B.cols * 90).toFixed(1) + "vw)";
    /* Tall boards keep the givens in a column on the left so the board can use the height. */
    this.mainEl.classList.toggle("pp-side", B.rows >= 14);
    this.boardEl.appendChild(svg);
    svgEl("rect", { class: "pp-bg", x: 0, y: 0, width: B.cols * CELL, height: B.rows * CELL, rx: 12 }, svg);
    var c2, r2;
    for (c2 = 1; c2 < B.cols; c2++) svgEl("line", { class: "pp-grid", x1: c2 * CELL, y1: 6, x2: c2 * CELL, y2: B.rows * CELL - 6 }, svg);
    for (r2 = 1; r2 < B.rows; r2++) svgEl("line", { class: "pp-grid", x1: 6, y1: r2 * CELL, x2: B.cols * CELL - 6, y2: r2 * CELL }, svg);
    var order = Object.keys(B.cells).map(function (key) { return B.cells[key]; });
    order.sort(function (a, b) { return (a.kind === "relay") - (b.kind === "relay"); });
    order.forEach(function (t) { drawTile(svg, B, deal, t, function (tt) { self.turn(tt); }); });
    this.svg = svg;
  };

  Game.prototype.dry = function () {
    this.clearTimers();
    var B = this.B, k;
    for (k in B.cells) {
      var t = B.cells[k];
      t.g.classList.remove("wet", "bad");
      t.waters.forEach(function (w) { w.el.classList.remove("on"); });
      if (t.box) t.box.classList.remove("wet", "bad");
      if (t.labelEl) t.labelEl.classList.remove("good", "bad");
    }
    var fx = this.svg.querySelectorAll(".pp-fx");
    for (var i = 0; i < fx.length; i++) fx[i].remove();
    this.feedEl.innerHTML = "";
  };

  Game.prototype.turn = function (t) {
    if (this.busy || this.cleared) return;
    var B = this.B;
    this.dry();
    if (t.kind === "switch") {
      this.groupOf[t.id].forEach(function (id) {
        var s = B.sw[id];
        s.state = (s.state + 1) % s.outs.length;
        var target = DIRANG[s.outs[s.state]];
        s.angle += ((target - s.angle) % 360 + 360) % 360;
        s.rg.style.transform = "rotate(" + s.angle + "deg)";
      });
    } else {
      t.rot = (t.rot + 1) % (t.kind === "straight" ? 2 : 4);
      t.angle += 90;
      t.rg.style.transform = "rotate(" + t.angle + "deg)";
    }
    sfx("click");
  };

  Game.prototype.open = function () {
    if (this.busy || this.cleared) return;
    var self = this, STEP = 60, B = this.B;
    this.dry();
    this.busy = true;
    this.goBtn.disabled = true;
    sfx("flow");
    var runs = B.taps.map(function (tap) { return trace(B, tap); });
    var mix = findMix(runs), longest = 0;
    runs.forEach(function (run) {
      var color = LANE_COLOR[run.lane];
      run.path.forEach(function (step, i) {
        self.timers.push(setTimeout(function () { wet(step.t, step.dirs, color); }, i * STEP));
      });
      var endAt = run.path.length * STEP;
      longest = Math.max(longest, endAt);
      if (run.leak) self.timers.push(setTimeout(function () { spray(self.svg, run.leak, color); }, endAt));
    });
    if (mix) this.timers.push(setTimeout(function () { mixMark(self.svg, mix); }, longest));
    this.timers.push(setTimeout(function () { self.finish(runs, mix); }, longest + 350));
  };

  Game.prototype.say = function (cls, lane, text) {
    var p = h("p", "pp-msg " + cls, null, this.feedEl);
    if (lane != null && this.B.taps.length > 1) {
      h("span", "pp-dot", null, p).style.background = LANE_COLOR[lane];
      h("b", null, "Given " + (lane + 1) + ": ", p);
      p.style.borderLeftColor = LANE_COLOR[lane];
    }
    p.appendChild(document.createTextNode(text));
  };

  Game.prototype.finish = function (runs, mix) {
    var self = this, deal = this.deal;
    this.feedEl.innerHTML = "";
    var leaky = runs.filter(function (r) { return r.leak; });
    if (leaky.length || mix) {
      leaky.forEach(function (r) {
        self.say("pp-msg-leak", r.lane, r.leak.back
          ? "A switch points back at the water. Turn it so it points up, down or right."
          : "Water leaks out of a pipe. Turn it so the joins line up.");
      });
      if (mix) this.say("pp-msg-leak", null, "Two colours of water meet in the same pipe. Each given needs its own route.");
      sfx("leak");
      this.busy = false;
      this.goBtn.disabled = false;
      return;
    }
    this.attempts++;
    var verdicts = runs.map(function (run) { return judge(deal.cards[run.lane], run, deal); });
    var allOk = verdicts.every(function (v) { return v.ok; });
    verdicts.forEach(function (v, i) {
      var end = runs[i].end, at = v.at || end;
      if (v.ok) { if (end.labelEl) end.labelEl.classList.add("good"); }
      else if (at.labelEl) at.labelEl.classList.add("bad");
      else if (at.box) at.box.classList.add("bad");
      else at.g.classList.add("bad");
      if (!v.ok) self.say("pp-msg-bad", i, v.msg);
      else if (allOk) self.say("pp-msg-good", i, deal.cards[i].why);
      else self.say("pp-msg-good", i, "correct.");
    });
    if (allOk) {
      this.clearLevel();
    } else {
      sfx("wrong");
      this.busy = false;
      this.goBtn.disabled = false;
    }
  };

  Game.prototype.clearLevel = function () {
    var self = this;
    var got = this.attempts === 1 ? 3 : this.attempts === 2 ? 2 : 1;
    this.stars[this.level] = got;
    this.updateStars();
    this.cleared = true;
    this.busy = false;
    sfx("win");
    var box = this.doneEl;
    box.innerHTML = "";
    box.classList.add("show");
    var last = this.level === LEVELS.length - 1;
    h("p", "pp-done-stars", "\u2605\u2605\u2605".slice(0, got) + "\u2606\u2606\u2606".slice(0, 3 - got), box);
    if (!last) {
      h("p", "pp-done-t", "Level " + (this.level + 1) + " clear!", box);
      var next = h("button", "pp-btn pp-go", "Next level \u25b8", box);
      next.type = "button";
      next.addEventListener("click", function () {
        self.level++;
        self.startLevel();
      });
      next.focus({ preventScroll: true });
      return;
    }
    var total = this.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
    var best = 0;
    try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) { /* storage blocked */ }
    if (total > best) {
      try { localStorage.setItem(BEST_KEY, String(total)); } catch (e) { /* storage blocked */ }
    }
    h("p", "pp-done-t", "All levels clear! You earned " + total + " / " + LEVELS.length * 3 + " stars.", box);
    h("p", "pp-done-s", total > best ? "New best score!" : "Best so far: " + best + " stars.", box);
    var again = h("button", "pp-btn pp-go", "Play again", box);
    again.type = "button";
    again.addEventListener("click", function () {
      self.level = 0;
      self.stars = [];
      self.used = {};
      self.startLevel();
    });
  };

  /* ─── sound ──────────────────────────────────────────────────────── */

  var actx = null;
  function sfx(kind) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (e) { return; }
    var t = actx.currentTime;
    function tone(f, start, dur, type, vol, f2) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, t + start);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + start + dur);
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t + start); o.stop(t + start + dur + 0.02);
    }
    if (kind === "click") tone(520, 0, 0.06, "triangle", 0.08, 380);
    else if (kind === "flow") { tone(180, 0, 0.5, "sine", 0.06, 320); tone(240, 0.1, 0.5, "sine", 0.04, 420); }
    else if (kind === "leak") { tone(900, 0, 0.25, "sawtooth", 0.03, 300); }
    else if (kind === "wrong") { tone(300, 0, 0.18, "square", 0.05); tone(220, 0.18, 0.28, "square", 0.05); }
    else if (kind === "win") { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.22, "triangle", 0.09); }); }
  }

  function boot() {
    var root = document.getElementById("pp-game");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    var game = new Game(root);
    if (/[?&]pptest/.test(location.search + location.hash)) {
      window.__pp = {
        game: game, LEVELS: LEVELS, TEMPLATES: TEMPLATES, trace: trace, FIGS: FIGS,
        solve: function () {
          var B = game.B, st = game.deal.plan.states, k;
          for (k in B.cells) {
            var t = B.cells[k];
            if (t.sol != null && t.rg) { t.rot = t.sol; t.angle = t.sol * 90; t.rg.style.transform = "rotate(" + t.angle + "deg)"; }
            else if (t.sol != null) t.rot = t.sol;
          }
          for (k in B.sw) {
            B.sw[k].state = st[k];
            B.sw[k].angle = DIRANG[B.sw[k].outs[st[k]]];
            B.sw[k].rg.style.transform = "rotate(" + B.sw[k].angle + "deg)";
          }
          game.open();
        },
      };
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
