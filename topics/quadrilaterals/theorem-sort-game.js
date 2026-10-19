/* JM29 Game 2 — theorem solitaire.
 * Top right: draw pile. Next row: three empty ace slots.
 * Below: two columns. The left one starts empty; the right one has four cards,
 * three face down and the bottom one face up.
 * An ace opens a slot. Only that reason stacks on the slot, and only the same
 * reason stacks on a column. Face-up cards in a column are glued: they move
 * as one pile, including onto an ace. The empty column can hold any card, so
 * one of the three reasons has to wait until a column is free. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
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

  function Fig() {
    this.svg = svgEl("svg", { class: "ts-fig", viewBox: "0 0 120 100", "aria-hidden": "true" });
  }
  Fig.prototype.line = function (a, b, cls) {
    svgEl("line", { class: cls || "ts-line", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, this.svg);
    return this;
  };
  Fig.prototype.poly = function (pts) {
    svgEl("polygon", { class: "ts-line", points: pts.map(function (p) { return p.join(","); }).join(" ") }, this.svg);
    return this;
  };
  Fig.prototype.ticks = function (a, b, count) {
    var d = unit(a, b), n = [-d[1], d[0]], m = mid(a, b);
    for (var k = 0; k < count; k++) {
      var off = (k - (count - 1) / 2) * 2.6;
      var c = [m[0] + d[0] * off, m[1] + d[1] * off];
      this.line([c[0] - n[0] * 3.2, c[1] - n[1] * 3.2], [c[0] + n[0] * 3.2, c[1] + n[1] * 3.2], "ts-mark");
    }
    return this;
  };
  Fig.prototype.arrow = function (a, b, count) {
    var d = unit(a, b), n = [-d[1], d[0]], m = mid(a, b);
    for (var k = 0; k < (count || 1); k++) {
      var off = (k - ((count || 1) - 1) / 2) * 3.4;
      var c = [m[0] + d[0] * off, m[1] + d[1] * off];
      svgEl("path", {
        class: "ts-mark",
        d: "M" + (c[0] - d[0] * 2 + n[0] * 3) + "," + (c[1] - d[1] * 2 + n[1] * 3) +
           "L" + (c[0] + d[0] * 2) + "," + (c[1] + d[1] * 2) +
           "L" + (c[0] - d[0] * 2 - n[0] * 3) + "," + (c[1] - d[1] * 2 - n[1] * 3),
      }, this.svg);
    }
    return this;
  };
  Fig.prototype.label = function (p, text, dx, dy, cls) {
    var t = svgEl("text", { class: cls || "ts-pt", x: p[0] + (dx || 0), y: p[1] + (dy || 0) }, this.svg);
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
        class: "ts-mark",
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
    if (opts.bc) f.label(mid(B, C), opts.bc, 0, -5, "ts-len");
    if (opts.mn) f.label(mid(M, N), opts.mn, 0, -4, "ts-len");
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
    return f.svg;
  }

  /* Same neat horizontal midline as the true cards. Only AM = MB is marked,
   * so the picture does not give the answer away. */
  function midHalf(opts) {
    opts = opts || {};
    var A = TRI.A, B = TRI.B, C = TRI.C, M = mid(A, B), N = mid(A, C);
    var f = new Fig().poly([A, B, C]).line(M, N);
    f.ticks(A, M, 1).ticks(M, B, 1);
    f.label(A, "A", 0, -3).label(B, "B", -5, 4).label(C, "C", 5, 4).label(M, "M", -6, 0).label(N, "N", 6, 0);
    if (opts.mn) f.label(mid(M, N), opts.mn, 0, -4, "ts-len");
    return f.svg;
  }

  function intercept(opts) {
    if (typeof opts === "boolean") opts = { parallel: opts };
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
      f.label([48, 68], "110\u00b0", 0, 0, "ts-len");
      f.label([34, 78], "70\u00b0", 0, 0, "ts-len");
    } else if (opts.kind === "base") {
      f.arc(M, A, N, amn, 11, 1);
      f.arc(N, A, M, amn, 11, 1);
    }
    f.label(A, "A", 0, -3).label(B, "B", -6, 3).label(C, "C", 5, 3).label(M, "M", -8, 1).label(N, "N", 7, -1);
    if (opts.bc) f.label(mid(B, C), opts.bc, 0, -6, "ts-len");
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
    f.label(A, "A", -7, -1).label(C, "C", -8, 2).label(E, "E", -7, 3);
    f.label(B, "B", 6, -1).label(D, "D", 6, 2).label(F, "F", 5, 3);
    return f.svg;
  }

  function renderFig(card) {
    if (card.fig === "twoMid") return twoMid(card.opts || null);
    if (card.fig === "midPar") return midPar(card.opts || null);
    if (card.fig === "midHalf") return midHalf(card.opts || null);
    if (card.fig === "intercept") return intercept(card.opts || { parallel: false });
    if (card.fig === "trapezium") return trapezium(card.opts || null);
    if (card.fig === "midAngle") return midAngle(card.opts || null);
    if (card.fig === "cutAngles") return cutAngles(card.opts || null);
    return document.createElement("span");
  }

  /* ─── cards ──────────────────────────────────────────────────────── */

  var SUIT_NAME = {
    mid: "mid-pt thm.",
    int: "intercept thm.",
    none: "Cannot conclude",
  };

  var CATALOG = {};
  var CONTENTS = [];
  var ACES = [];

  function addCard(card, pile) {
    CATALOG[card.id] = card;
    pile.push(card);
  }

  addCard({
    id: "c-mid-par", suit: "mid", ace: false, fig: "twoMid", opts: null,
    given: "M and N are the mid-points of AB and AC.",
    concl: "MN // BC",
    why: "Two mid-points are given and we learn something about MN. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-mid-half", suit: "mid", ace: false, fig: "twoMid", opts: { bc: "10" },
    given: "M and N are the mid-points of AB and AC. BC = 10.",
    concl: "MN = 5",
    why: "Two mid-points give MN = \u00bdBC = 5. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-mid-double", suit: "mid", ace: false, fig: "twoMid", opts: { mn: "3" },
    given: "M and N are the mid-points of AB and AC. MN = 3.",
    concl: "BC = 6",
    why: "Two mid-points give MN = \u00bdBC, so BC = 6. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-mid-8", suit: "mid", ace: false, fig: "twoMid", opts: { bc: "8" },
    given: "M and N are the mid-points of AB and AC. BC = 8.",
    concl: "MN = 4",
    why: "Two mid-points give MN = \u00bdBC = 4. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-mid-12", suit: "mid", ace: false, fig: "twoMid", opts: { mn: "6" },
    given: "M and N are the mid-points of AB and AC. MN = 6.",
    concl: "BC = 12",
    why: "Two mid-points give MN = \u00bdBC, so BC = 12. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-mid-pq", suit: "mid", ace: false, fig: "twoMid", opts: { M: "P", N: "Q" },
    given: "P and Q are the mid-points of AB and AC.",
    concl: "PQ // BC",
    why: "Two mid-points are given and we learn something about PQ. That is the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-lines", suit: "int", ace: false, fig: "intercept", opts: { parallel: true },
    given: "AB // CD // EF and AC = CE.",
    concl: "BD = DF",
    why: "Parallel lines cut equal parts on one line, so they cut equal parts on the other. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-mid", suit: "int", ace: false, fig: "midPar", opts: null,
    given: "M is the mid-point of AB and MN // BC.",
    concl: "AN = NC",
    why: "Only one mid-point is given, plus a parallel line. Finding the other mid-point is the intercept thm., not the mid-pt thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-trap", suit: "int", ace: false, fig: "trapezium", opts: null,
    given: "In trapezium ABCD, AD // EF // BC and AE = EB.",
    concl: "DF = FC",
    why: "Three parallel lines cut AB into equal parts, so they cut DC into equal parts. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-de", suit: "int", ace: false, fig: "midPar", opts: { M: "D", N: "E" },
    given: "D is the mid-point of AB and DE // BC.",
    concl: "E is the mid-point of AC",
    why: "One mid-point and a parallel line give the other mid-point. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-right", suit: "int", ace: false, fig: "intercept", opts: { parallel: true, ticks: "right" },
    given: "AB // CD // EF and BD = DF.",
    concl: "AC = CE",
    why: "Parallel lines cut equal parts on one line, so they cut equal parts on the other. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-int-trap-right", suit: "int", ace: false, fig: "trapezium", opts: { ticks: "right" },
    given: "In trapezium ABCD, AD // EF // BC and DF = FC.",
    concl: "AE = EB",
    why: "Three parallel lines cut DC into equal parts, so they cut AB into equal parts. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-none-half", suit: "none", ace: false, fig: "midHalf", opts: { mn: "\u00bdBC" },
    given: "M is the mid-point of AB and MN = \u00bdBC.",
    concl: "N is the mid-point of AC",
    why: "MN = \u00bdBC is what the mid-pt thm. gives you, not what it needs. Without MN // BC, nothing proves N is the mid-point.",
  }, CONTENTS);
  addCard({
    id: "c-none-lines", suit: "none", ace: false, fig: "intercept", opts: { parallel: false },
    given: "AC = CE.",
    concl: "BD = DF",
    why: "The three lines are not given parallel, so the intercept thm. cannot be used.",
  }, CONTENTS);
  addCard({
    id: "c-none-equal", suit: "none", ace: false, fig: "twoMid", opts: null,
    given: "M and N are the mid-points of AB and AC.",
    concl: "MN = BC",
    why: "The mid-pt thm. gives MN = \u00bdBC, not MN = BC.",
  }, CONTENTS);
  addCard({
    id: "c-none-para", suit: "none", ace: false, fig: "midPar", opts: { ticks: false },
    given: "MN // BC.",
    concl: "AN = NC",
    why: "A parallel line alone is not enough. The intercept thm. also needs a mid-point.",
  }, CONTENTS);
  addCard({
    id: "c-none-one", suit: "none", ace: false, fig: "midHalf", opts: null,
    given: "M is the mid-point of AB.",
    concl: "N is the mid-point of AC",
    why: "One mid-point and no parallel line proves nothing about N.",
  }, CONTENTS);
  addCard({
    id: "c-none-bare", suit: "none", ace: false, fig: "intercept", opts: { parallel: true, ticks: "none" },
    given: "AB // CD // EF.",
    concl: "BD = DF",
    why: "The lines are parallel, but the parts on one side are not given equal, so the intercept thm. does not apply.",
  }, CONTENTS);
  addCard({
    id: "c-ang-corr", suit: "int", ace: false, fig: "midAngle", opts: { kind: "corr" },
    given: "M is the mid-point of AB. The marked corr. \u2220s are equal.",
    concl: "AN = NC",
    why: "Equal corr. \u2220s prove MN // BC. One mid-point and that parallel give AN = NC. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-ang-alt", suit: "int", ace: false, fig: "cutAngles", opts: { kind: "alt" },
    given: "The marked alt. \u2220s are equal. AC = CE.",
    concl: "BD = DF",
    why: "Equal alt. \u2220s prove the three lines are parallel. Equal parts AC = CE then give BD = DF. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-ang-int", suit: "int", ace: false, fig: "midAngle", opts: { kind: "int" },
    given: "",
    concl: "AN = NC",
    why: "Two int. \u2220s add to 180\u00b0, so MN // BC. One mid-point and that parallel give AN = NC. That is the intercept thm.",
  }, CONTENTS);
  addCard({
    id: "c-ang-mid-corr", suit: "mid", ace: false, fig: "midAngle", opts: { kind: "corr", both: true, bc: "10" },
    given: "M and N are the mid-points of AB and AC. The marked corr. \u2220s are equal. BC = 10.",
    concl: "MN = 5",
    why: "Both mid-points are given, so the mid-pt thm. gives MN = \u00bdBC = 5. The equal corr. \u2220s are not needed for the length.",
  }, CONTENTS);
  addCard({
    id: "c-ang-mid-int", suit: "mid", ace: false, fig: "midAngle", opts: { kind: "int", both: true },
    given: "M and N are the mid-points of AB and AC. The marked int. \u2220s add to 180\u00b0.",
    concl: "MN = \u00bdBC",
    why: "Both mid-points give MN = \u00bdBC by the mid-pt thm. The int. \u2220s add to 180\u00b0, so they also prove MN // BC, but the length comes from the mid-points.",
  }, CONTENTS);
  addCard({
    id: "c-ang-bare", suit: "none", ace: false, fig: "cutAngles", opts: { kind: "corr", ticks: false },
    given: "The marked corr. \u2220s are equal.",
    concl: "BD = DF",
    why: "Equal corr. \u2220s do prove the lines are parallel. The intercept thm. still needs equal parts on one side, and none are given.",
  }, CONTENTS);
  addCard({
    id: "c-ang-base", suit: "none", ace: false, fig: "midAngle", opts: { kind: "base" },
    given: "M is the mid-point of AB. The marked angles of \u25b3AMN are equal.",
    concl: "AN = NC",
    why: "Those equal angles sit in \u25b3AMN. They are not a corr., alt. or int. pair for MN and BC, so they do not prove MN // BC.",
  }, CONTENTS);

  addCard({ id: "a-mid", suit: "mid", ace: true, why: "This A opens the mid-pt thm. slot." }, ACES);
  addCard({ id: "a-int", suit: "int", ace: true, why: "This A opens the intercept thm. slot." }, ACES);
  addCard({ id: "a-none", suit: "none", ace: true, why: "This A opens the Cannot conclude slot." }, ACES);

  var TOTAL = CONTENTS.length + ACES.length;

  /* ─── rules ──────────────────────────────────────────────────────── */

  var root, board, feedback, undoBtn, movesEl;
  var state, history, drag;

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function ensureEarlyAce(stock) {
    var n = stock.length;
    var start = Math.max(0, n - 3);
    var i, j, k, tmp;
    for (i = start; i < n; i++) if (CATALOG[stock[i]].ace) return;
    for (j = 0; j < start; j++) {
      if (!CATALOG[stock[j]].ace) continue;
      k = start + Math.floor(Math.random() * (n - start));
      tmp = stock[j]; stock[j] = stock[k]; stock[k] = tmp;
      return;
    }
  }

  var DEAL = 7;

  function suitTotal(suit) {
    var n = 0;
    var i;
    for (i = 0; i < ACES.length; i++) if (ACES[i].suit === suit) n += 1;
    for (i = 0; i < CONTENTS.length; i++) if (CONTENTS[i].suit === suit) n += 1;
    return n;
  }

  function deal() {
    var ids = shuffle(CONTENTS.map(function (c) { return c.id; }));
    var dealt = [];
    for (var i = 0; i < DEAL; i++) dealt.push({ id: ids[i], up: i === DEAL - 1 });
    var stock = ids.slice(DEAL).concat(ACES.map(function (c) { return c.id; }));
    stock = shuffle(stock);
    ensureEarlyAce(stock);
    return { columns: [[], dealt], stock: stock, waste: [], found: [null, null, null], moves: 0 };
  }

  function isWon() {
    var n = 0;
    for (var i = 0; i < state.found.length; i++) if (state.found[i]) n += state.found[i].ids.length;
    return n === TOTAL;
  }

  function faceUpStart(col) {
    var i;
    for (i = 0; i < col.length; i++) if (col[i].up) return i;
    return -1;
  }

  /* A column's face-up cards stay glued. Grabbing any of them lifts the whole run. */
  function runIds(from) {
    if (from.zone === "waste") {
      if (!state.waste.length) return null;
      return [state.waste[state.waste.length - 1]];
    }
    var col = state.columns[from.col];
    if (!col) return null;
    var start = faceUpStart(col);
    if (start < 0) return null;
    var ids = [];
    var suit = null;
    var i, card;
    for (i = start; i < col.length; i++) {
      if (!col[i].up) return null;
      card = CATALOG[col[i].id];
      if (suit == null) suit = card.suit;
      else if (card.suit !== suit) return null;
      ids.push(col[i].id);
    }
    return ids.length ? ids : null;
  }

  function foundIndex(suit) {
    for (var i = 0; i < state.found.length; i++) {
      if (state.found[i] && state.found[i].suit === suit) return i;
    }
    return -1;
  }

  function evaluate(from, target) {
    var ids = runIds(from);
    if (!ids) return { ok: false, message: "" };
    if (from.zone === "col" && target.type === "col" && from.col === target.index) return { ok: false, message: "" };

    var contact = CATALOG[ids[0]];
    var shown = CATALOG[ids[ids.length - 1]];
    if (target.type === "found") {
      var slot = state.found[target.index];
      if (contact.ace) {
        if (ids.length !== 1) return { ok: false, message: "" };
        if (!slot) return { ok: true };
        if (slot.suit === contact.suit) return { ok: false, message: "That ace is already up." };
        return { ok: false, message: "This slot is already " + SUIT_NAME[slot.suit] + "." };
      }
      if (!slot) return { ok: false, message: "Play an A on this slot first." };
      if (slot.suit !== contact.suit) return { ok: false, message: "Wrong ace. " + shown.why };
      return { ok: true };
    }

    if (target.type === "col") {
      if (contact.ace) return { ok: false, message: "Aces go on the empty slots above, not on a column." };
      var col = state.columns[target.index];
      if (!col.length) return { ok: true };
      var bottomSlot = col[col.length - 1];
      if (!bottomSlot.up) return { ok: false, message: "" };
      var bottom = CATALOG[bottomSlot.id];
      if (bottom.suit === contact.suit) return { ok: true };
      var msg = "Wrong column. " + shown.why;
      if (foundIndex(contact.suit) >= 0) msg += " It goes on the " + SUIT_NAME[contact.suit] + " ace.";
      else msg += " The " + SUIT_NAME[contact.suit] + " ace is not out yet, so this card has to wait.";
      return { ok: false, message: msg };
    }
    return { ok: false, message: "" };
  }

  function take(from) {
    if (from.zone === "waste") return [state.waste.pop()];
    var col = state.columns[from.col];
    var start = faceUpStart(col);
    if (start < 0) return [];
    var moved = col.splice(start);
    var under = col[col.length - 1];
    if (under && !under.up) under.up = true;
    var ids = [];
    for (var i = 0; i < moved.length; i++) ids.push(moved[i].id);
    return ids;
  }

  function mutate(from, target) {
    var ids = take(from);
    var i;
    if (target.type === "found") {
      var card = CATALOG[ids[0]];
      if (!state.found[target.index]) state.found[target.index] = { suit: card.suit, ids: [] };
      for (i = 0; i < ids.length; i++) state.found[target.index].ids.push(ids[i]);
      return;
    }
    var col = state.columns[target.index];
    for (i = 0; i < ids.length; i++) col.push({ id: ids[i], up: true });
  }

  function checkpoint() {
    history.push(JSON.stringify(state));
    if (history.length > 160) history.shift();
  }

  function commit(from, target) {
    checkpoint();
    mutate(from, target);
    state.moves += 1;
    render();
  }

  /* ─── render ─────────────────────────────────────────────────────── */

  function h(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function say(text, ok) {
    feedback.textContent = text || "";
    feedback.className = "ts-feedback" + (text ? (ok ? " ok" : " bad") : "");
  }

  function shake(node) {
    if (!node) return;
    node.classList.remove("ts-shake");
    void node.offsetWidth;
    node.classList.add("ts-shake");
  }

  function fullCard(card, meta) {
    var el = h("div", card.ace ? "ts-card ts-ace s-" + card.suit : "ts-card");
    el.setAttribute("draggable", "false");
    if (meta) {
      el.classList.add("ts-draggable");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", card.ace ? "A, " + SUIT_NAME[card.suit] : (card.given ? "Given: " + card.given + ". " : "") + "Conclusion: " + card.concl);
      el.dataset.from = meta.from;
      if (meta.col != null) el.dataset.col = String(meta.col);
      if (meta.index != null) el.dataset.index = String(meta.index);
    }
    if (card.ace) {
      h("span", "ts-ace-corner", "A", el);
      h("span", "ts-ace-name", SUIT_NAME[card.suit], el);
      h("span", "ts-ace-corner ts-ace-br", "A", el);
    } else {
      el.appendChild(renderFig(card));
      h("span", "ts-concl", "\u21d2 " + card.concl, el);
    }
    return el;
  }

  function banner(card, meta) {
    var el = h("div", "ts-banner ts-draggable", "\u21d2 " + card.concl);
    el.setAttribute("draggable", "false");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Cards above: " + card.concl);
    el.dataset.from = meta.from;
    el.dataset.col = String(meta.col);
    el.dataset.index = String(meta.index);
    return el;
  }

  function renderColumn(index, parent) {
    var col = state.columns[index];
    var el = h("div", "ts-col" + (col.length ? "" : " empty"), null, parent);
    el.dataset.drop = "col:" + index;
    if (!col.length) {
      h("span", "ts-empty-label", "Empty", el);
      return;
    }
    var stack = h("div", "ts-stack", null, el);
    var y = 0;
    var i;
    for (i = 0; i < col.length; i++) {
      var slot = col[i];
      var card = CATALOG[slot.id];
      var last = i === col.length - 1;
      var node;
      if (!slot.up) node = h("div", "ts-backstrip");
      else if (!last) node = banner(card, { from: "col", col: index, index: i });
      else node = fullCard(card, { from: "col", col: index, index: i });
      node.style.top = y + "px";
      node.style.zIndex = String(i + 1);
      stack.appendChild(node);
      if (!last) y += slot.up ? 28 : 16;
      else stack.style.height = (y + (node.offsetHeight || 188)) + "px";
    }
  }

  function renderFound(index, parent) {
    var slot = state.found[index];
    var el = h("div", "ts-found", null, parent);
    el.dataset.drop = "found:" + index;
    if (!slot) {
      el.classList.add("vacant");
      el.setAttribute("aria-label", "Empty ace slot");
      h("span", "ts-found-a", "A", el);
      return;
    }
    var top = CATALOG[slot.ids[slot.ids.length - 1]];
    el.classList.add("filled", "s-" + slot.suit);
    el.setAttribute("aria-label", SUIT_NAME[slot.suit] + ", " + slot.ids.length + " cards");
    h("span", "ts-found-kicker", "A", el);
    h("span", "ts-found-name", SUIT_NAME[slot.suit], el);
    h("span", "ts-found-top", top.ace ? "Play cards of this reason" : "\u21d2 " + top.concl, el);
    h("span", "ts-found-count", slot.ids.length + " / " + suitTotal(slot.suit), el);
  }

  function render() {
    board.innerHTML = "";
    var corner = h("div", "ts-corner", null, board);
    var waste = h("div", "ts-waste", null, corner);
    if (state.waste.length) {
      var topId = state.waste[state.waste.length - 1];
      waste.appendChild(fullCard(CATALOG[topId], { from: "waste" }));
      if (state.waste.length > 1) h("span", "ts-under", String(state.waste.length - 1) + " under", waste);
    }
    var stock = h("button", "ts-stock", null, corner);
    stock.type = "button";
    if (state.stock.length) {
      stock.setAttribute("aria-label", "Draw a card");
      h("span", "ts-stock-count", String(state.stock.length), stock);
    } else if (state.waste.length) {
      stock.classList.add("empty");
      stock.setAttribute("aria-label", "Turn the pile over");
      h("span", "ts-stock-count", "Turn", stock);
    } else {
      stock.classList.add("empty", "dead");
      stock.disabled = true;
      stock.setAttribute("aria-label", "Draw pile is empty");
    }

    var aces = h("div", "ts-aces", null, board);
    for (var i = 0; i < 3; i++) renderFound(i, aces);
    var dragons = h("div", "ts-dragons", null, board);
    renderColumn(0, dragons);
    renderColumn(1, dragons);

    root.classList.toggle("ts-won", isWon());
    undoBtn.disabled = !history.length;
    movesEl.textContent = "Moves " + state.moves;
    if (isWon()) say("Cleared. All three reasons are home.", true);
    else say("", true);
  }

  function buildGhost(ids) {
    var g = h("div", "ts-ghost");
    g.appendChild(fullCard(CATALOG[ids[0]], null));
    if (ids.length > 1) h("span", "ts-ghost-n", "+" + (ids.length - 1), g);
    return g;
  }

  /* ─── drag ───────────────────────────────────────────────────────── */

  function parseFrom(el) {
    if (el.dataset.from === "waste") return { zone: "waste" };
    return { zone: "col", col: +el.dataset.col, index: +el.dataset.index };
  }

  function parseDrop(value) {
    var bits = value.split(":");
    return { type: bits[0], index: +bits[1] };
  }

  function dropAt(x, y) {
    var ghost = drag && drag.ghost;
    if (ghost) ghost.hidden = true;
    var list = document.elementsFromPoint(x, y);
    if (ghost) ghost.hidden = false;
    var i, slot;
    for (i = 0; i < list.length; i++) {
      if (!list[i].closest) continue;
      slot = list[i].closest("[data-drop]");
      if (slot && root.contains(slot)) return slot;
    }
    return null;
  }

  function setOver(el) {
    var prev = board.querySelectorAll(".ts-over");
    var i;
    for (i = 0; i < prev.length; i++) if (prev[i] !== el) prev[i].classList.remove("ts-over");
    if (el) el.classList.add("ts-over");
  }

  function markDragging(from) {
    var nodes = board.querySelectorAll(".ts-draggable");
    var i, el;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (from.zone === "waste" && el.dataset.from === "waste") el.classList.add("ts-dragging");
      if (from.zone === "col" && el.dataset.from === "col" && +el.dataset.col === from.col && +el.dataset.index >= from.index) {
        el.classList.add("ts-dragging");
      }
    }
  }

  function endDrag() {
    if (drag && drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    var nodes = board.querySelectorAll(".ts-dragging, .ts-over");
    var i;
    for (i = 0; i < nodes.length; i++) nodes[i].classList.remove("ts-dragging", "ts-over");
    document.body.classList.remove("ts-grabbing");
    drag = null;
  }

  function play(from, target) {
    var result = evaluate(from, target);
    if (!result.ok) return result;
    commit(from, target);
    return { ok: true, message: "" };
  }

  function onPointerDown(e) {
    if (drag) endDrag();
    if (e.button !== 0 || isWon()) return;
    var stock = e.target.closest ? e.target.closest(".ts-stock") : null;
    if (stock && root.contains(stock)) {
      e.preventDefault();
      if (!state.stock.length && !state.waste.length) return;
      checkpoint();
      if (state.stock.length) state.waste.push(state.stock.pop());
      else {
        state.stock = state.waste.slice().reverse();
        state.waste = [];
      }
      state.moves += 1;
      render();
      return;
    }
    var card = e.target.closest ? e.target.closest(".ts-draggable") : null;
    if (!card || !root.contains(card)) return;
    var from = parseFrom(card);
    if (from.zone === "col") {
      var start = faceUpStart(state.columns[from.col]);
      if (start < 0) return;
      from.index = start;
    }
    var ids = runIds(from);
    if (!ids) return;
    e.preventDefault();
    drag = { from: from, ids: ids, x: e.clientX, y: e.clientY, moved: false, ghost: null };
  }

  function onPointerMove(e) {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.x) < 5 && Math.abs(e.clientY - drag.y) < 5) return;
      drag.moved = true;
      drag.ghost = buildGhost(drag.ids);
      document.body.appendChild(drag.ghost);
      document.body.classList.add("ts-grabbing");
      markDragging(drag.from);
    }
    drag.ghost.style.left = (e.clientX - 48) + "px";
    drag.ghost.style.top = (e.clientY - 28) + "px";
    setOver(dropAt(e.clientX, e.clientY));
  }

  function onPointerUp(e) {
    if (!drag) return;
    var info = drag;
    var moved = info.moved;
    var targetEl = moved ? dropAt(e.clientX, e.clientY) : null;
    endDrag();
    if (!moved) {
      if (info.ids.length === 1 && CATALOG[info.ids[0]].ace) {
        var slot = -1;
        var i;
        for (i = 0; i < state.found.length; i++) if (!state.found[i]) { slot = i; break; }
        if (slot >= 0) {
          var clicked = play(info.from, { type: "found", index: slot });
          if (!clicked.ok && clicked.message) say(clicked.message, false);
        }
      }
      return;
    }
    if (!targetEl) return;
    var result = play(info.from, parseDrop(targetEl.dataset.drop));
    if (!result.ok && result.message) {
      say(result.message, false);
      shake(targetEl);
    }
  }

  function undo() {
    if (!history.length || !gameVisible()) return;
    state = JSON.parse(history.pop());
    endDrag();
    render();
  }

  function gameVisible() {
    var node = root;
    while (node) {
      if (node.classList && (node.classList.contains("hidden") || node.classList.contains("game-off"))) return false;
      node = node.parentElement;
    }
    return true;
  }

  function newGame() {
    history = [];
    state = deal();
    endDrag();
    render();
  }

  function init() {
    root = document.getElementById("ts-game");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.setAttribute("role", "application");
    root.setAttribute("aria-label", "Theorem solitaire");
    root.innerHTML = "";
    h("p", "ts-task", "Draw from the pile at the top right. An A opens an empty slot; cards of that reason go on it. Two columns: stack the same reason, and the empty one can hold any card. Face-up cards in a column move together. Some parallels come from corr., alt. or int. angles, not from arrows.", root);
    board = h("div", "ts-board", null, root);
    feedback = h("p", "ts-feedback", null, root);
    feedback.setAttribute("aria-live", "polite");
    var actions = h("div", "ts-actions", null, root);
    undoBtn = h("button", "ts-btn ghost", "Undo", actions);
    undoBtn.type = "button";
    undoBtn.addEventListener("click", undo);
    var again = h("button", "ts-btn", "New deal", actions);
    again.type = "button";
    again.addEventListener("click", newGame);
    movesEl = h("span", "ts-moves", "", actions);

    root.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("keydown", function (e) {
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && gameVisible()) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        undo();
      }
    });
    newGame();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
