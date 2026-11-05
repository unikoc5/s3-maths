/* JM32 Game 2 — ratio solitaire (same engine as JM29's theorem solitaire).
 * Top right: draw pile. Next row: four empty ace slots.
 * Below: three columns. The left one starts empty; the other two have four
 * cards each, three face down and the bottom one face up.
 * An ace opens a slot. Only that reason stacks on the slot, and only the same
 * reason stacks on a column. Face-up cards in a column are glued: they move
 * as one pile, including onto an ace. An empty column can hold any card. */
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

  function lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  function Fig() {
    this.svg = svgEl("svg", { class: "ts-fig", viewBox: "0 0 120 100", "aria-hidden": "true" });
  }
  Fig.prototype.line = function (a, b, cls) {
    svgEl("line", { class: cls || "ts-line", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, this.svg);
    return this;
  };
  Fig.prototype.poly = function (pts, cls) {
    svgEl("polygon", { class: cls || "ts-line", points: pts.map(function (p) { return p.join(","); }).join(" ") }, this.svg);
    return this;
  };
  Fig.prototype.path = function (d, cls) {
    svgEl("path", { class: cls || "ts-line", d: d }, this.svg);
    return this;
  };
  Fig.prototype.ellipse = function (c, rx, ry, cls) {
    svgEl("ellipse", { class: cls || "ts-line", cx: c[0], cy: c[1], rx: rx, ry: ry }, this.svg);
    return this;
  };
  Fig.prototype.circle = function (c, r, cls) {
    svgEl("circle", { class: cls || "ts-line", cx: c[0], cy: c[1], r: r }, this.svg);
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
      r = base - k * 2.6;
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

  /* ─── solids: two side by side, small on the left ─────────────────── */

  var GROUND = 76;

  function cone(f, cx, s) {
    var r = 10 * s, h = 24 * s, ry = r * 0.3, top = [cx, GROUND - h];
    f.path("M" + (cx - r) + "," + GROUND + " A" + r + "," + ry + " 0 0 1 " + (cx + r) + "," + GROUND, "ts-dash");
    f.path("M" + (cx - r) + "," + GROUND + " A" + r + "," + ry + " 0 0 0 " + (cx + r) + "," + GROUND);
    f.line([cx - r, GROUND], top).line([cx + r, GROUND], top);
    return { x: cx + r, y: GROUND - h / 2, top: GROUND - h };
  }

  function cylinder(f, cx, s) {
    var r = 9 * s, h = 22 * s, ry = r * 0.3, t = GROUND - h;
    f.ellipse([cx, t], r, ry);
    f.path("M" + (cx - r) + "," + GROUND + " A" + r + "," + ry + " 0 0 1 " + (cx + r) + "," + GROUND, "ts-dash");
    f.path("M" + (cx - r) + "," + GROUND + " A" + r + "," + ry + " 0 0 0 " + (cx + r) + "," + GROUND);
    f.line([cx - r, t], [cx - r, GROUND]).line([cx + r, t], [cx + r, GROUND]);
    return { x: cx + r, y: GROUND - h / 2, top: t - ry };
  }

  function sphere(f, cx, s) {
    var r = 12 * s, c = [cx, GROUND - r];
    f.circle(c, r);
    f.path("M" + (cx - r) + "," + c[1] + " A" + r + "," + r * 0.3 + " 0 0 0 " + (cx + r) + "," + c[1]);
    f.path("M" + (cx - r) + "," + c[1] + " A" + r + "," + r * 0.3 + " 0 0 1 " + (cx + r) + "," + c[1], "ts-dash");
    f.line(c, [cx + r, c[1]], "ts-dim");
    return { x: cx + r, y: c[1], top: GROUND - 2 * r, cy: c[1], r: r };
  }

  function cuboid(f, cx, w, h, d) {
    var x0 = cx - w / 2 - d * 0.35, y0 = GROUND, dx = d * 0.7, dy = d * 0.5;
    var A = [x0, y0], B = [x0 + w, y0], C = [x0 + w, y0 - h], D = [x0, y0 - h];
    f.poly([A, B, C, D]);
    f.poly([D, C, [C[0] + dx, C[1] - dy], [D[0] + dx, D[1] - dy]]);
    f.poly([B, [B[0] + dx, B[1] - dy], [C[0] + dx, C[1] - dy], C]);
    return { x: x0 + w + dx, y: y0 - h / 2, top: y0 - h - dy };
  }

  function bottle(f, cx, s) {
    var r = 8 * s, h = 15 * s, n = 3 * s, neck = 8 * s, t = GROUND - h;
    f.path("M" + (cx - r) + "," + GROUND + " L" + (cx - r) + "," + t + " Q" + (cx - r) + "," + (t - 5 * s) + " " + (cx - n) + "," + (t - 6 * s) +
      " L" + (cx - n) + "," + (t - 6 * s - neck) + " L" + (cx + n) + "," + (t - 6 * s - neck) + " L" + (cx + n) + "," + (t - 6 * s) +
      " Q" + (cx + r) + "," + (t - 5 * s) + " " + (cx + r) + "," + t + " L" + (cx + r) + "," + GROUND + " Z");
    return { x: cx + r, y: GROUND - h / 2, top: t - 6 * s - neck };
  }

  function statue(f, cx, s) {
    var hr = 4.5 * s, body = 13 * s, w = 9 * s, base = 3 * s;
    var headC = [cx, GROUND - base - body - hr];
    f.circle(headC, hr);
    f.path("M" + (cx - w / 2) + "," + (GROUND - base) + " L" + (cx - w * 0.28) + "," + (GROUND - base - body) +
      " L" + (cx + w * 0.28) + "," + (GROUND - base - body) + " L" + (cx + w / 2) + "," + (GROUND - base) + " Z");
    f.poly([[cx - w * 0.7, GROUND], [cx + w * 0.7, GROUND], [cx + w * 0.7, GROUND - base], [cx - w * 0.7, GROUND - base]]);
    return { x: cx + w * 0.7, y: GROUND - (base + body) / 2, top: headC[1] - hr };
  }

  /* opts: kind, k (size of the big one), a / b (labels), sim, note, dims (cuboids drawn to their own shape) */
  function pair(opts) {
    var f = new Fig(), k = opts.k || 1.5, A, B, SC = 1.3;
    var draw = { cone: cone, cyl: cylinder, sphere: sphere, bottle: bottle, statue: statue }[opts.kind];
    if (opts.kind === "cuboid") {
      var ds = opts.dims || [[14, 16, 8], [14 * k, 16 * k, 8 * k]];
      A = cuboid(f, 28, ds[0][0] * SC, ds[0][1] * SC, ds[0][2] * SC);
      B = cuboid(f, 80, ds[1][0] * SC, ds[1][1] * SC, ds[1][2] * SC);
    } else {
      A = draw(f, 28, SC);
      B = draw(f, 80, k * SC);
    }
    if (opts.a) f.label([A.x + 2, A.y], opts.a, 0, 0, "ts-len ts-left");
    if (opts.b) f.label([B.x + 2, B.y], opts.b, 0, 0, "ts-len ts-left");
    if (opts.under) {
      f.label([28, GROUND + 7], opts.under[0], 0, 0, "ts-len");
      f.label([80, GROUND + 7], opts.under[1], 0, 0, "ts-len");
    }
    if (opts.sim) f.label([60, 8], "similar", 0, 0, "ts-tag");
    if (opts.note) f.label([60, 94], opts.note, 0, 0, "ts-note");
    return f.svg;
  }

  /* ─── triangles ───────────────────────────────────────────────────── */

  /* DE across triangle ABC, with or without DE // BC. */
  function triDE(opts) {
    var A = [60, 8], B = [16, 78], C = [104, 78], t = opts.t || 0.4;
    var D = lerp(A, B, t), E = lerp(A, C, t);
    var f = new Fig().poly([A, B, C]).line(D, E);
    if (opts.par) f.arrow(D, E, 1).arrow(B, C, 1);
    f.label(A, "A", 0, -3).label(B, "B", -5, 3).label(C, "C", 5, 3).label(D, "D", -6, 0).label(E, "E", 6, 0);
    if (opts.note) f.label([60, 92], opts.note, 0, 0, "ts-note");
    return f.svg;
  }

  /* Two triangles, the second 4/3 the size. `angles` = how many angle pairs are marked equal. */
  function triSim(opts) {
    var k = 4 / 3;
    var P = [8, 78], Q = [38, 78], R = [16, 50];
    var P2 = [52, 78], Q2 = [52 + 30 * k, 78], R2 = [52 + 8 * k, 78 - 28 * k];
    var f = new Fig().poly([P, Q, R]).poly([P2, Q2, R2]);
    var n = opts.angles == null ? 3 : opts.angles;
    var tri = [[P, Q, R], [P2, Q2, R2]];
    tri.forEach(function (t) {
      var c = [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3];
      if (n >= 1) f.arc(t[0], t[1], t[2], c, 7, 1);
      if (n >= 2) f.arc(t[1], t[0], t[2], c, 7, 2);
      if (n >= 3) f.arc(t[2], t[0], t[1], c, 6, 3);
    });
    f.label(mid(P, Q), opts.a || "3", 0, 6, "ts-len");
    f.label(mid(P2, Q2), opts.b || "4", 0, 6, "ts-len");
    if (opts.area) f.label([21, 70], opts.area, 0, 0, "ts-len");
    if (opts.note) f.label([60, 94], opts.note, 0, 0, "ts-note");
    return f.svg;
  }

  /* Triangle ABC with D on BC and the line AD. */
  function triCevian(opts) {
    var A = [52, 10], B = [12, 78], C = [108, 78], D = lerp(B, C, opts.f || 0.4);
    var f = new Fig().poly([A, B, C]).line(A, D);
    if (opts.median) f.ticks(B, D, 1).ticks(D, C, 1);
    if (opts.bd) f.label(mid(B, D), opts.bd, 0, 7, "ts-len");
    if (opts.dc) f.label(mid(D, C), opts.dc, 0, 7, "ts-len");
    f.label(A, "A", 0, -3).label(B, "B", -5, 3).label(C, "C", 5, 3).label(D, "D", 0, 7);
    if (opts.note) f.label([92, 22], opts.note, 0, 0, "ts-note");
    return f.svg;
  }

  /* AD // BC: triangles ABC and DBC on the same base. */
  function triPar() {
    var A = [34, 18], D = [88, 18], B = [14, 80], C = [106, 80];
    var f = new Fig().line([20, 18], [104, 18]).line(B, C);
    f.line(A, B).line(A, C).line(D, B).line(D, C);
    f.arrow([50, 18], [74, 18], 1).arrow([50, 80], [74, 80], 1);
    f.label(A, "A", 0, -5).label(D, "D", 0, -5).label(B, "B", -5, 3).label(C, "C", 5, 3);
    return f.svg;
  }

  /* Two triangles on the same base BC, heights marked. */
  function triBase(opts) {
    var B = [16, 80], C = [104, 80], P = [44, 22], Q = [80, 46];
    var f = new Fig().poly([P, B, C]).poly([Q, B, C]);
    f.line(P, [P[0], 80], "ts-dash").line(Q, [Q[0], 80], "ts-dash");
    f.label([P[0] - 2, 50], opts.hp || "5", 0, 0, "ts-len ts-right");
    f.label([Q[0] - 2, 70], opts.hq || "3", 0, 0, "ts-len ts-right");
    f.label(P, "P", 0, -4).label(Q, "Q", 3, -4).label(B, "B", -5, 3).label(C, "C", 5, 3);
    return f.svg;
  }

  /* Two separate triangles with bases 3 and 5 and different, unmarked heights. */
  function triTwo() {
    var f = new Fig().poly([[8, 78], [38, 78], [20, 18]]).poly([[54, 78], [108, 78], [92, 52]]);
    f.label([23, 78], "3", 0, 7, "ts-len").label([81, 78], "5", 0, 7, "ts-len");
    return f.svg;
  }

  /* Parallelogram ABCD with diagonal AC. */
  function para() {
    var A = [32, 20], B = [12, 80], C = [90, 80], D = [110, 20];
    var f = new Fig().poly([A, B, C, D]).line(A, C);
    f.arrow(A, D, 1).arrow(B, C, 1).arrow(B, A, 2).arrow(C, D, 2);
    f.label(A, "A", -3, -4).label(B, "B", -5, 3).label(C, "C", 5, 3).label(D, "D", 4, -4);
    return f.svg;
  }

  var FIGS = { pair: pair, triDE: triDE, triSim: triSim, triCevian: triCevian, triPar: triPar, triBase: triBase, triTwo: triTwo, para: para };

  function renderFig(card) {
    var fn = FIGS[card.fig];
    return fn ? fn(card.opts || {}) : document.createElement("span");
  }

  /* ─── cards ──────────────────────────────────────────────────────── */

  var SUIT_NAME = {
    k2: "Area ratio = k\u00b2",
    k3: "Volume ratio = k\u00b3",
    base: "Same height / base",
    none: "Cannot conclude",
  };

  var CATALOG = {};
  var CONTENTS = [];
  var ACES = [];

  function addCard(card, pile) {
    CATALOG[card.id] = card;
    pile.push(card);
  }

  /* Area ratio = k² */
  addCard({
    id: "k2-cone", suit: "k2", ace: false, fig: "pair", opts: { kind: "cone", a: "4", b: "6", sim: true },
    given: "Two similar cones, heights 4 and 6.",
    concl: "Curved areas 4 : 9",
    why: "Similar solids, and the answer is an area: square the length ratio. 2\u00b2 : 3\u00b2 = 4 : 9. That is Area ratio = k\u00b2.",
  }, CONTENTS);
  addCard({
    id: "k2-sphere", suit: "k2", ace: false, fig: "pair", opts: { kind: "sphere", a: "3", b: "5", k: 1.35, sim: true },
    given: "Two spheres, radii 3 and 5.",
    concl: "Surface areas 9 : 25",
    why: "Surface area is an area, so square the radii: 3\u00b2 : 5\u00b2 = 9 : 25. That is Area ratio = k\u00b2.",
  }, CONTENTS);
  addCard({
    id: "k2-cuboid-back", suit: "k2", ace: false, fig: "pair", opts: { kind: "cuboid", k: 1.25, sim: true, note: "A\u2081 : A\u2082 = 16 : 25" },
    given: "Two similar cuboids, total surface areas 16 : 25.",
    concl: "Lengths 4 : 5",
    why: "Going back from an area ratio: take the square root. \u221a16 : \u221a25 = 4 : 5. That is Area ratio = k\u00b2.",
  }, CONTENTS);
  addCard({
    id: "k2-de", suit: "k2", ace: false, fig: "triDE", opts: { par: true, note: "AD : AB = 2 : 5" },
    given: "DE // BC and AD : AB = 2 : 5.",
    concl: "\u25b3ADE : \u25b3ABC = 4 : 25",
    why: "DE // BC makes \u25b3ADE ~ \u25b3ABC with k = 2/5, so the areas are 2\u00b2 : 5\u00b2. That is Area ratio = k\u00b2.",
  }, CONTENTS);
  addCard({
    id: "k2-tri", suit: "k2", ace: false, fig: "triSim", opts: { angles: 3, note: "small area = 18" },
    given: "Two similar triangles, sides 3 and 4. The smaller area is 18.",
    concl: "Larger area = 32",
    why: "All three angles match, so the triangles are similar: 18 \u00d7 (4/3)\u00b2 = 32. That is Area ratio = k\u00b2.",
  }, CONTENTS);
  addCard({
    id: "k2-percent", suit: "k2", ace: false, fig: "pair", opts: { kind: "cuboid", k: 1.2, a: "L", b: "1.2L", sim: true },
    given: "A similar model with every length 20% longer.",
    concl: "Area +44%",
    why: "Areas scale by k\u00b2 = 1.2\u00b2 = 1.44, a 44% increase. That is Area ratio = k\u00b2.",
  }, CONTENTS);

  /* Volume ratio = k³ */
  addCard({
    id: "k3-sphere", suit: "k3", ace: false, fig: "pair", opts: { kind: "sphere", a: "2", b: "3", sim: true },
    given: "Two spheres, radii 2 and 3.",
    concl: "Volumes 8 : 27",
    why: "Volume needs the cube of the length ratio: 2\u00b3 : 3\u00b3 = 8 : 27. That is Volume ratio = k\u00b3.",
  }, CONTENTS);
  addCard({
    id: "k3-cone", suit: "k3", ace: false, fig: "pair", opts: { kind: "cone", a: "6", b: "9", sim: true, note: "small V = 40" },
    given: "Two similar cones, heights 6 and 9. The small one has volume 40.",
    concl: "Larger V = 135",
    why: "40 \u00d7 (9/6)\u00b3 = 40 \u00d7 27/8 = 135. Volume uses the cube. That is Volume ratio = k\u00b3.",
  }, CONTENTS);
  addCard({
    id: "k3-bottle", suit: "k3", ace: false, fig: "pair", opts: { kind: "bottle", k: 1.6, sim: true, note: "V\u2081 : V\u2082 = 8 : 125" },
    given: "Two similar bottles, capacities 8 : 125.",
    concl: "Heights 2 : 5",
    why: "Going back from a volume ratio: take the cube root. \u221b8 : \u221b125 = 2 : 5. That is Volume ratio = k\u00b3.",
  }, CONTENTS);
  addCard({
    id: "k3-two-step", suit: "k3", ace: false, fig: "pair", opts: { kind: "cyl", sim: true, note: "A\u2081 : A\u2082 = 4 : 9" },
    given: "Two similar cylinders, surface areas 4 : 9.",
    concl: "Volumes 8 : 27",
    why: "The answer is a volume. Square-root the areas to get k = 2 : 3, then cube it: 8 : 27. That is Volume ratio = k\u00b3.",
  }, CONTENTS);
  addCard({
    id: "k3-percent", suit: "k3", ace: false, fig: "pair", opts: { kind: "sphere", k: 1.15, a: "r", b: "1.1r", sim: true },
    given: "A sphere whose radius grows by 10%.",
    concl: "Volume +33.1%",
    why: "Volume scales by k\u00b3 = 1.1\u00b3 = 1.331, a 33.1% increase. That is Volume ratio = k\u00b3.",
  }, CONTENTS);
  addCard({
    id: "k3-statue", suit: "k3", ace: false, fig: "pair", opts: { kind: "statue", k: 1.9, a: "h", b: "2h", sim: true, note: "same material" },
    given: "Two similar statues of the same material, heights h and 2h.",
    concl: "Masses 1 : 8",
    why: "Same material, so mass follows volume: 1\u00b3 : 2\u00b3 = 1 : 8. That is Volume ratio = k\u00b3.",
  }, CONTENTS);

  /* Same height / same base */
  addCard({
    id: "b-ratio", suit: "base", ace: false, fig: "triCevian", opts: { f: 0.4, bd: "2", dc: "3" },
    given: "D is on BC with BD : DC = 2 : 3.",
    concl: "\u25b3ABD : \u25b3ADC = 2 : 3",
    why: "\u25b3ABD and \u25b3ADC share the height from A, so their areas are in the ratio of their bases. That is Same height / base.",
  }, CONTENTS);
  addCard({
    id: "b-value", suit: "base", ace: false, fig: "triCevian", opts: { f: 0.4, bd: "4", dc: "6", note: "\u25b3ABC = 50" },
    given: "BD = 4, DC = 6 and the area of \u25b3ABC is 50.",
    concl: "\u25b3ABD = 20",
    why: "Same height from A, so \u25b3ABD takes 4/10 of the area: 50 \u00d7 4/10 = 20. That is Same height / base.",
  }, CONTENTS);
  addCard({
    id: "b-median", suit: "base", ace: false, fig: "triCevian", opts: { f: 0.5, median: true },
    given: "D is the mid-point of BC.",
    concl: "\u25b3ABD = \u25b3ADC",
    why: "Equal bases and the same height from A give equal areas. That is Same height / base.",
  }, CONTENTS);
  addCard({
    id: "b-par", suit: "base", ace: false, fig: "triPar", opts: null,
    given: "AD // BC.",
    concl: "\u25b3ABC = \u25b3DBC",
    why: "Both triangles stand on BC, and AD // BC keeps A and D at the same height. That is Same height / base.",
  }, CONTENTS);
  addCard({
    id: "b-heights", suit: "base", ace: false, fig: "triBase", opts: null,
    given: "\u25b3PBC and \u25b3QBC share the base BC. Their heights are 5 and 3.",
    concl: "\u25b3PBC : \u25b3QBC = 5 : 3",
    why: "Same base BC, so the areas are in the ratio of the heights. That is Same height / base.",
  }, CONTENTS);
  addCard({
    id: "b-para", suit: "base", ace: false, fig: "para", opts: null,
    given: "ABCD is a parallelogram with diagonal AC.",
    concl: "\u25b3ABC = \u25b3CDA",
    why: "BC = AD, and the two parallel sides keep the same distance apart, so equal bases and equal heights. That is Same height / base.",
  }, CONTENTS);

  /* Cannot conclude */
  addCard({
    id: "n-cyl", suit: "none", ace: false, fig: "pair", opts: { kind: "cyl", k: 1.4, a: "r = 2", b: "r = 3" },
    given: "Two cylinders with radii 2 and 3. Nothing else is given.",
    concl: "Volumes 8 : 27",
    why: "Nobody said the cylinders are similar, and the heights are unknown, so k\u00b3 cannot be used. Cannot conclude.",
  }, CONTENTS);
  addCard({
    id: "n-cone", suit: "none", ace: false, fig: "pair", opts: { kind: "cone", a: "4", b: "6" },
    given: "Two cones with heights 4 and 6. They are not marked similar.",
    concl: "Curved areas 4 : 9",
    why: "Without \u201csimilar\u201d, the radii could be anything, so k\u00b2 cannot be used. Cannot conclude.",
  }, CONTENTS);
  addCard({
    id: "n-cuboid", suit: "none", ace: false, fig: "pair", opts: { kind: "cuboid", dims: [[12, 14, 8], [20, 30, 10]], under: ["2\u00d73\u00d74", "4\u00d76\u00d710"] },
    given: "Cuboids 2 \u00d7 3 \u00d7 4 and 4 \u00d7 6 \u00d7 10.",
    concl: "Volumes 1 : 8",
    why: "2 : 4 and 3 : 6 match, but 4 : 10 does not, so the cuboids are not similar. Cannot conclude.",
  }, CONTENTS);
  addCard({
    id: "n-two", suit: "none", ace: false, fig: "triTwo", opts: null,
    given: "Two triangles with bases 3 and 5. Their heights are different.",
    concl: "Areas 3 : 5",
    why: "Base ratio only works when the heights are equal, and these are not. Cannot conclude.",
  }, CONTENTS);
  addCard({
    id: "n-angle", suit: "none", ace: false, fig: "triSim", opts: { angles: 1 },
    given: "Two triangles with sides 3 and 4, and only one pair of equal angles.",
    concl: "Areas 9 : 16",
    why: "One pair of equal angles does not make the triangles similar, so k\u00b2 cannot be used. Cannot conclude.",
  }, CONTENTS);
  addCard({
    id: "n-de", suit: "none", ace: false, fig: "triDE", opts: { par: false, note: "AD : AB = 2 : 5" },
    given: "AD : AB = 2 : 5, but DE is not marked parallel to BC.",
    concl: "\u25b3ADE : \u25b3ABC = 4 : 25",
    why: "Without DE // BC the two triangles are not known to be similar. Cannot conclude.",
  }, CONTENTS);

  addCard({ id: "a-k2", suit: "k2", ace: true, why: "This A opens the Area ratio = k\u00b2 slot." }, ACES);
  addCard({ id: "a-k3", suit: "k3", ace: true, why: "This A opens the Volume ratio = k\u00b3 slot." }, ACES);
  addCard({ id: "a-base", suit: "base", ace: true, why: "This A opens the Same height / base slot." }, ACES);
  addCard({ id: "a-none", suit: "none", ace: true, why: "This A opens the Cannot conclude slot." }, ACES);

  var TOTAL = CONTENTS.length + ACES.length;
  // One slot fewer than there are reasons: a finished pile leaves and frees its slot.
  var SLOTS = 2;
  var COLS = 3;

  var GUIDE = [
    { suit: "k2", rule: "Similar 2D figures", eg: "2 : 3 \u2192 4 : 9" },
    { suit: "k3", rule: "Similar 3D solids", eg: "2 : 3 \u2192 8 : 27" },
    { suit: "base", rule: "Triangles: same base / same height", eg: "BD : DC" },
    { suit: "none", rule: "Not similar", eg: "No ratio found" },
  ];

  /* ─── rules ──────────────────────────────────────────────────────── */

  var root, board, feedback, undoBtn, movesEl, timeEl, overlay;
  var state, history, drag;
  var t0 = 0, tEnd = 0;

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

  function suitTotal(suit) {
    var n = 0;
    var i;
    for (i = 0; i < ACES.length; i++) if (ACES[i].suit === suit) n += 1;
    for (i = 0; i < CONTENTS.length; i++) if (CONTENTS[i].suit === suit) n += 1;
    return n;
  }

  function deal() {
    var ids = shuffle(CONTENTS.map(function (c) { return c.id; }));
    var columns = [[]];
    var next = 0;
    for (var c = 1; c < COLS; c++) {
      var col = [], n = c + 1;
      for (var i = 0; i < n; i++) col.push({ id: ids[next++], up: i === n - 1 });
      columns.push(col);
    }
    var stock = ids.slice(next).concat(ACES.map(function (a) { return a.id; }));
    stock = shuffle(stock);
    ensureEarlyAce(stock);
    var found = [];
    for (var s = 0; s < SLOTS; s++) found.push(null);
    return { columns: columns, stock: stock, waste: [], found: found, done: [], moves: 0 };
  }

  function isWon() {
    return state.done.length === ACES.length;
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
        return { ok: false, message: "This slot is already " + SUIT_NAME[slot.suit] + ". " + (state.found.indexOf(null) >= 0 ? "Use the empty slot." : "Both slots are in use: finish one reason first.") };
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
      var slot = state.found[target.index];
      for (i = 0; i < ids.length; i++) slot.ids.push(ids[i]);
      if (slot.ids.length === suitTotal(slot.suit)) {
        state.done.push(slot.suit);
        state.found[target.index] = null;
        state.flash = slot.suit;
      }
      return;
    }
    var col = state.columns[target.index];
    for (i = 0; i < ids.length; i++) col.push({ id: ids[i], up: true });
  }

  function checkpoint() {
    history.push(JSON.stringify(state));
    if (history.length > 160) history.shift();
    if (!t0) { t0 = Date.now(); tickTime(); }
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

    board.appendChild(guideEl("rs-guide"));

    var aces = h("div", "ts-aces", null, board);
    for (var i = 0; i < SLOTS; i++) renderFound(i, aces);
    var done = h("div", "rs-done", null, aces);
    h("span", "rs-done-h", "Done " + state.done.length + " / " + ACES.length, done);
    state.done.forEach(function (s) { h("span", "rs-done-chip s-" + s, "\u2713 " + SUIT_NAME[s], done); });
    var dragons = h("div", "ts-dragons", null, board);
    for (var c = 0; c < COLS; c++) renderColumn(c, dragons);

    var won = isWon();
    root.classList.toggle("ts-won", won);
    undoBtn.disabled = !history.length || won;
    movesEl.textContent = "Moves " + state.moves;
    if (won) {
      if (!tEnd) { tEnd = Date.now(); showWin(); }
      say("Cleared in " + fmtTime(tEnd - t0) + ". All four reasons are home.", true);
    } else if (state.flash) {
      say(SUIT_NAME[state.flash] + " is complete! That pile leaves, so its slot is free again.", true);
    } else say("", true);
    state.flash = null;
  }

  function guideEl(cls) {
    var g = h("div", cls);
    h("div", "rs-guide-h", "Sort by the reason", g);
    GUIDE.forEach(function (x) {
      var it = h("div", "rs-guide-it s-" + x.suit, null, g);
      h("b", null, SUIT_NAME[x.suit], it);
      h("span", null, x.rule + " \u00b7 " + x.eg, it);
    });
    return g;
  }

  /* ─── timer, start and finish screens ────────────────────────────── */

  function fmtTime(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function tickTime() {
    if (!timeEl) return;
    timeEl.textContent = "Time " + (t0 ? fmtTime((tEnd || Date.now()) - t0) : "0:00");
  }

  function showOverlay(build) {
    overlay.innerHTML = "";
    var card = h("div", "rs-ov-card", null, overlay);
    build(card);
    overlay.hidden = false;
  }

  function showIntro() {
    showOverlay(function (card) {
      h("h3", "rs-ov-h", "Ratio Solitaire", card);
      h("p", "rs-ov-p", null, card).innerHTML = "Sort each card by the <b>reason</b> behind it:";
      card.appendChild(guideEl("rs-guide rs-guide-big"));
      h("p", "rs-ov-p", null, card).innerHTML = "Only <b>2 slots</b> for 4 reasons. Finish a pile and its slot is free again.";
      var go = h("button", "ts-btn rs-ov-go", t0 ? "Back to game \u25b8" : "Start \u25b8", card);
      go.type = "button";
      go.addEventListener("click", function () { overlay.hidden = true; if (!t0) t0 = Date.now(); tickTime(); });
    });
  }

  function showWin() {
    tickTime();
    showOverlay(function (card) {
      h("h3", "rs-ov-h", "Congratulations!", card);
      h("p", "rs-ov-p", "You sorted all 24 cards by their reasons.", card);
      var st = h("div", "rs-ov-stats", null, card);
      var a = h("div", null, null, st); h("b", null, fmtTime(tEnd - t0), a); h("span", null, "time used", a);
      var b = h("div", null, null, st); h("b", null, String(state.moves), b); h("span", null, "moves", b);
      var row = h("div", "rs-ov-row", null, card);
      var close = h("button", "ts-btn ghost", "Close", row);
      close.type = "button";
      close.addEventListener("click", function () { overlay.hidden = true; });
      var again = h("button", "ts-btn rs-ov-go", "Play again \u25b8", row);
      again.type = "button";
      again.addEventListener("click", function () { overlay.hidden = true; newGame(); t0 = Date.now(); tickTime(); });
    });
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
        } else say("Both slots are in use. Finish one reason first: a full pile leaves and frees its slot.", false);
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
    if (!history.length || !gameVisible() || isWon()) return;
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
    tEnd = 0;
    if (t0) t0 = Date.now();
    endDrag();
    render();
    tickTime();
  }

  function init() {
    root = document.getElementById("rs-game");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    root.setAttribute("role", "application");
    root.setAttribute("aria-label", "Ratio solitaire");
    root.innerHTML = "";
    board = h("div", "ts-board", null, root);
    overlay = h("div", "rs-overlay", null, root);
    overlay.hidden = true;
    feedback = h("p", "ts-feedback", null, root);
    feedback.setAttribute("aria-live", "polite");
    var actions = h("div", "ts-actions", null, root);
    undoBtn = h("button", "ts-btn ghost", "Undo", actions);
    undoBtn.type = "button";
    undoBtn.addEventListener("click", undo);
    var again = h("button", "ts-btn", "New deal", actions);
    again.type = "button";
    again.addEventListener("click", newGame);
    var help = h("button", "ts-btn ghost", "How to play", actions);
    help.type = "button";
    help.addEventListener("click", showIntro);
    timeEl = h("span", "ts-moves rs-time", "Time 0:00", actions);
    movesEl = h("span", "ts-moves", "", actions);
    setInterval(tickTime, 500);

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
    showIntro();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
