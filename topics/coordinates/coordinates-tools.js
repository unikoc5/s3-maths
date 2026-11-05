(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var ORIGIN = { x: 250, y: 250 };
  var SCALE = 22;
  var GRID = 10;
  var COL = {
    ink: "#1e2a32",
    muted: "#5a6b74",
    x: "#4f77b7",
    y: "#4f957f",
    line: "#8a9aa3",
    orange: "#d97706",
    point: "#111827",
    axis: "#8a9aa3",
    grid: "rgba(30,42,50,.08)",
    fill: "rgba(79,119,183,.10)",
  };

  var LABS = [
    { id: "distance", label: "1 · Distance" },
    { id: "slope", label: "2 · Gradient" },
    { id: "midpt", label: "3 · Mid-point" },
    { id: "centres", label: "4 · Centres" },
  ];

  var SLOPE_MODES = [
    { id: "basic", label: "Rise ÷ run" },
    { id: "steep", label: "Steepness" },
    { id: "parallel", label: "Parallel" },
    { id: "perp", label: "Perpendicular" },
  ];

  var MID_MODES = [
    { id: "mid", label: "Mid-point" },
    { id: "section", label: "Section formula" },
  ];

  var CENT_MODES = [
    { id: "I", label: "In-centre I" },
    { id: "O", label: "Circumcentre O" },
    { id: "G", label: "Centroid G" },
    { id: "H", label: "Orthocentre H" },
  ];

  var A = { x: 1, y: 1 };
  var B = { x: 5, y: 4 };
  var SLOPE_A = { x: 1, y: 1 };
  var SLOPE_B = { x: 5, y: 4 };
  var CENT_TRI = [
    { x: 285, y: 72 },
    { x: 72, y: 398 },
    { x: 418, y: 365 },
  ];
  var slopeMode = "basic";
  var midMode = "mid";
  var centMode = "I";
  var secM = 2;
  var secN = 1;
  var perpStep = 0;
  var steepStep = 0;
  var STEEP_MAX = 5;
  var parallelC2 = -2;
  var parallelHandle = { x: 3, y: 0.25 };
  var parallelDragging = false;
  var steepPlacements = { pool: [], slots: [null, null, null, null] };
  var drag = null;
  var activeLab = "distance";

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function fmt(n) {
    if (!isFinite(n)) return "∞";
    var r = Math.round(n * 1000) / 1000;
    return Math.abs(r) < 1e-9 ? "0" : String(r);
  }

  function gcdInt(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function fracTex(num, den) {
    num = Math.round(num);
    den = Math.round(den);
    if (den === 0) return String(num);
    if (den < 0) { num = -num; den = -den; }
    if (num === 0) return "0";
    var g = gcdInt(num, den);
    num /= g;
    den /= g;
    if (den === 1) return String(num);
    var sign = num < 0 ? "-" : "";
    num = Math.abs(num);
    return sign + "\\tfrac{" + num + "}{" + den + "}";
  }

  function pairFracTex(xNum, xDen, yNum, yDen) {
    return "\\left(" + fracTex(xNum, xDen) + ",\\; " + fracTex(yNum, yDen) + "\\right)";
  }

  function toPx(p) { return { x: ORIGIN.x + p.x * SCALE, y: ORIGIN.y - p.y * SCALE }; }
  function fromPx(px) {
    return {
      x: Math.round((px.x - ORIGIN.x) / SCALE),
      y: Math.round((ORIGIN.y - px.y) / SCALE),
    };
  }

  function clampGrid(p) {
    return {
      x: Math.max(-GRID, Math.min(GRID, p.x)),
      y: Math.max(-GRID, Math.min(GRID, p.y)),
    };
  }

  function renderKatex(root) {
    if (window.renderMathInElement && root) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  function K(tex, display) {
    if (!window.katex) return tex;
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: !!display });
    } catch (e) {
      return tex;
    }
  }

  function km(el, tex, display) {
    if (!el) return;
    if (window.katex) {
      try {
        katex.render(tex, el, { throwOnError: false, displayMode: !!display });
        return;
      } catch (e) {}
    }
    el.textContent = tex;
  }

  function setNote(el, html) {
    if (!el) return;
    el.innerHTML = html;
    renderKatex(el);
  }

  function paintTex(root) {
    (root || document).querySelectorAll("[data-tex]").forEach(function (el) {
      el.innerHTML = K(el.getAttribute("data-tex"), el.hasAttribute("data-display"));
    });
  }

  function svgTex(svg, px, tex, w, h, col, fontPx) {
    w = w || 130;
    h = h || 28;
    var fo = E("foreignObject", {
      x: px.x, y: px.y - h / 2, width: w, height: h,
    });
    var div = document.createElement("div");
    div.style.cssText = "font-size:" + (fontPx || 14) + "px;font-weight:700;color:" + (col || COL.ink) + ";line-height:1.1;white-space:nowrap;pointer-events:none;font-family:inherit";
    div.innerHTML = K(tex);
    fo.appendChild(div);
    svg.appendChild(fo);
  }

  function clampPlot(p) {
    return {
      x: Math.max(40, Math.min(460, p.x)),
      y: Math.max(28, Math.min(470, p.y)),
    };
  }

  function atXY(mx, my) {
    return clampPlot(toPx({ x: mx, y: my }));
  }

  function addPlainLabel(svg, p, text, col, size) {
    var t = E("text", {
      x: p.x, y: p.y,
      fill: col || COL.ink,
      "font-size": size || 13,
      "font-weight": 700,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    t.textContent = text;
    svg.appendChild(t);
    return t;
  }

  function nearLine(m, c, x, side, dist) {
    dist = dist == null ? 0.85 : dist;
    var len = Math.hypot(1, m) || 1;
    var nx = -m / len;
    var ny = 1 / len;
    if (side < 0) { nx = -nx; ny = -ny; }
    return { x: x + nx * dist, y: m * x + c + ny * dist };
  }

  function texAt(svg, mx, my, tex, col) {
    var p = atXY(mx, my);
    svgTex(svg, { x: p.x, y: p.y }, tex, 140, 26, col, 14);
  }

  function plainAt(svg, mx, my, text, col, size) {
    addPlainLabel(svg, atXY(mx, my), text, col, size);
  }

  function pairTex(name, xNum, xDen, yNum, yDen) {
    return "\\mathrm{" + name + "}(" + fracTex(xNum, xDen) + "," + fracTex(yNum, yDen) + ")";
  }

  function signed(n) {
    if (n < 0) return "(" + n + ")";
    return String(n);
  }

  function clr(g) { while (g.firstChild) g.removeChild(g.firstChild); }

  function drawGrid(svg) {
    var clipId = (svg.id || "plot") + "-clip";
    if (!svg.querySelector("#" + clipId)) {
      var defs = E("defs", {});
      var clip = E("clipPath", { id: clipId });
      var vb = svg.viewBox && svg.viewBox.baseVal;
      var w = vb && vb.width ? vb.width : 500;
      var h = vb && vb.height ? vb.height : 500;
      clip.appendChild(E("rect", { x: 0, y: 0, width: w, height: h, rx: 18, ry: 18 }));
      defs.appendChild(clip);
      svg.appendChild(defs);
      svg.setAttribute("clip-path", "url(#" + clipId + ")");
    }
    for (var i = -GRID; i <= GRID; i++) {
      var gx = ORIGIN.x + i * SCALE;
      var gy = ORIGIN.y + i * SCALE;
      svg.appendChild(E("line", {
        x1: gx, y1: 24, x2: gx, y2: 476,
        stroke: i === 0 ? COL.axis : COL.grid,
        "stroke-width": i === 0 ? 1.6 : 1,
      }));
      svg.appendChild(E("line", {
        x1: 24, y1: gy, x2: 476, y2: gy,
        stroke: i === 0 ? COL.axis : COL.grid,
        "stroke-width": i === 0 ? 1.6 : 1,
      }));
    }
    svg.appendChild(E("text", { x: 458, y: ORIGIN.y - 8, fill: COL.muted, "font-size": 13, "font-weight": 600 })).textContent = "x";
    svg.appendChild(E("text", { x: ORIGIN.x + 8, y: 32, fill: COL.muted, "font-size": 13, "font-weight": 600 })).textContent = "y";
  }

  function seg(p, q, col, w, dash) {
    var el = E("line", {
      x1: p.x, y1: p.y, x2: q.x, y2: q.y,
      stroke: col || COL.line, "stroke-width": w || 2.5, "stroke-linecap": "round",
    });
    if (dash) el.setAttribute("stroke-dasharray", dash);
    return el;
  }

  function rightAngle(V, P, Q, size) {
    size = size || 10;
    var u1 = unit(V, P);
    var u2 = unit(V, Q);
    var a = { x: V.x + u1.x * size, y: V.y + u1.y * size };
    var b = { x: V.x + u1.x * size + u2.x * size, y: V.y + u1.y * size + u2.y * size };
    var c = { x: V.x + u2.x * size, y: V.y + u2.y * size };
    return E("polyline", {
      points: [a.x, a.y, b.x, b.y, c.x, c.y].join(" "),
      fill: "none", stroke: COL.line, "stroke-width": 1.8,
    });
  }

  function unit(p, q) {
    var d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
  }

  function dot(p, col, r) {
    return E("circle", { cx: p.x, cy: p.y, r: r || 5, fill: col || COL.point });
  }

  function label(p, text, col, dx, dy) {
    var t = E("text", {
      x: p.x + (dx || 10), y: p.y + (dy || -6),
      fill: col || COL.ink, "font-size": 14, "font-weight": 700,
    });
    t.textContent = text;
    return t;
  }

  function dragHandle(p, dataKey, dataVal) {
    var attrs = { cx: p.x, cy: p.y, r: 16, fill: "transparent" };
    attrs["data-" + dataKey] = dataVal;
    var h = E("circle", attrs);
    h.style.cursor = "grab";
    return h;
  }

  function pt(e, svg) {
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    return {
      x: (e.clientX - r.left) * (vb.width / r.width),
      y: (e.clientY - r.top) * (vb.height / r.height),
    };
  }

  /* ── Lab 1: Distance ── */
  function renderDistance() {
    var svg = document.getElementById("dist-svg");
    if (!svg) return;
    clr(svg);
    drawGrid(svg);

    var pa = toPx(A);
    var pb = toPx(B);
    var dx = B.x - A.x;
    var dy = B.y - A.y;
    var corner = toPx({ x: B.x, y: A.y });

    svg.appendChild(seg(pa, corner, COL.x, 2, "6 4"));
    svg.appendChild(seg(corner, pb, COL.y, 2, "6 4"));
    svg.appendChild(seg(pa, pb, COL.line, 3.5));
    svg.appendChild(rightAngle(corner, pa, pb, 12));

    svg.appendChild(dot(pa, COL.point, 5));
    svg.appendChild(dot(pb, COL.point, 5));
    svg.appendChild(labelAway(pa, corner, "A", COL.ink, 16));
    svg.appendChild(labelAway(pb, corner, "B", COL.ink, 16));
    svg.appendChild(label(
      { x: (pa.x + corner.x) / 2, y: pa.y + 28 },
      "|Δx| = " + Math.abs(dx), COL.x, 0, 0
    ));
    svg.appendChild(label(
      { x: corner.x + 8, y: (corner.y + pb.y) / 2 },
      "|Δy| = " + Math.abs(dy), COL.y, 0, 4
    ));

    svg.appendChild(dragHandle(pa, "ab", 0));
    svg.appendChild(dragHandle(pb, "ab", 1));

    var d = Math.hypot(dx, dy);
    document.getElementById("dist-dx").textContent = Math.abs(dx);
    document.getElementById("dist-dy").textContent = Math.abs(dy);
    document.getElementById("dist-d").textContent = fmt(d);
    km(document.getElementById("dist-formula"),
      "d = \\sqrt{" + signed(dx) + "^2 + " + signed(dy) + "^2} = " + fmt(d), true);
    setNote(document.getElementById("dist-note"),
      "A\\((" + A.x + "," + A.y + ")\\)  B\\((" + B.x + "," + B.y + ")\\) — the distance is the hypotenuse of a right triangle with legs \\(|\\Delta x|\\) and \\(|\\Delta y|\\).");
  }

  /* ── Lab 2: Slope ── */
  var STEEP_LINES = [
    { id: "mh", m: 0.5, col: COL.x, tex: "m = \\tfrac{1}{2}", plain: "m = 1/2", val: 0.5 },
    { id: "p2", m: 2, col: COL.x, tex: "m = 2", plain: "m = 2", val: 2 },
    { id: "mnh", m: -0.5, col: COL.y, tex: "m = -\\tfrac{1}{2}", plain: "m = -1/2", val: -0.5 },
    { id: "mn2", m: -2, col: COL.y, tex: "m = -2", plain: "m = -2", val: -2 },
  ];
  var STEEP_SORT_ORDER = ["mn2", "mnh", "mh", "p2"];

  function lineMC(m, c, col, w, opacity) {
    var span = GRID - 0.2;
    var p1 = toPx({ x: -span, y: m * (-span) + c });
    var p2 = toPx({ x: span, y: m * span + c });
    var el = seg(p1, p2, col, w);
    if (opacity != null) el.setAttribute("opacity", opacity);
    return el;
  }

  function lineThroughOrigin(m, col, w, opacity) {
    return lineMC(m, 0, col, w, opacity);
  }

  function renderSlopeBasic(svg) {
    var pa = toPx(SLOPE_A);
    var pb = toPx(SLOPE_B);
    var dx = SLOPE_B.x - SLOPE_A.x;
    var dy = SLOPE_B.y - SLOPE_A.y;
    var corner = toPx({ x: SLOPE_B.x, y: SLOPE_A.y });

    svg.appendChild(seg(pa, corner, COL.x, 2, "5 4"));
    svg.appendChild(seg(corner, pb, COL.y, 2, "5 4"));
    svg.appendChild(seg(pa, pb, COL.line, 3.5));
    svg.appendChild(rightAngle(corner, pa, pb, 12));
    svg.appendChild(dot(pa, COL.point, 5));
    svg.appendChild(dot(pb, COL.point, 5));
    svg.appendChild(labelAway(pa, corner, "A", COL.ink, 16));
    svg.appendChild(labelAway(pb, corner, "B", COL.ink, 16));
    svg.appendChild(label(
      { x: (pa.x + corner.x) / 2, y: pa.y + 28 },
      "run = " + Math.abs(dx), COL.x, 0, 0
    ));
    svg.appendChild(label(
      { x: corner.x + 10, y: (corner.y + pb.y) / 2 },
      "rise = " + Math.abs(dy), COL.y, 0, 4
    ));
    svg.appendChild(dragHandle(pa, "slopeab", 0));
    svg.appendChild(dragHandle(pb, "slopeab", 1));

    if (dx === 0) {
      km(document.getElementById("slope-formula"),
        "m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{" + dy + "}{0}\\;\\text{is undefined}", true);
    } else {
      km(document.getElementById("slope-formula"),
        "m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{" + dy + "}{" + dx + "} = " + fracTex(dy, dx), true);
    }
    setNote(document.getElementById("slope-note"),
      "<strong>Why \\(\\dfrac{\\Delta y}{\\Delta x}\\)?</strong> We treat horizontal \\(x\\) as the step forward and ask how much \\(y\\) rises or falls. " +
      "If the line is flat, \\(m=0\\); if vertical, \\(\\Delta x=0\\) and \\(m\\) is undefined. " +
      "Using \\(\\dfrac{\\Delta x}{\\Delta y}\\) would wrongly make a flat road undefined and a vertical wall have \\(m=0\\).");
  }

  function steepLineById(id) {
    for (var i = 0; i < STEEP_LINES.length; i++) {
      if (STEEP_LINES[i].id === id) return STEEP_LINES[i];
    }
    return null;
  }

  function drawSteepLine(svg, L, x, side, plain) {
    svg.appendChild(lineThroughOrigin(L.m, L.col, 2.25, 1));
    var q = nearLine(L.m, 0, x, side, 0.85);
    if (plain) plainAt(svg, q.x, q.y, L.plain, L.col, 12);
    else texAt(svg, q.x, q.y, L.tex, L.col);
  }

  function renderSlopeSteep(svg) {
    if (steepStep === 0) drawSteepLine(svg, STEEP_LINES[0], 5, -1);
    else if (steepStep === 1) drawSteepLine(svg, STEEP_LINES[1], 3.2, -1);
    else if (steepStep === 2) drawSteepLine(svg, STEEP_LINES[2], -4.2, 1);
    else if (steepStep === 3) drawSteepLine(svg, STEEP_LINES[3], 2.6, 1);
    else if (steepStep === 4) {
      drawSteepLine(svg, steepLineById("mnh"), -4.6, 1);
      drawSteepLine(svg, steepLineById("mn2"), 2.8, 1);
    } else {
      drawSteepLine(svg, steepLineById("p2"), 3.2, -1, true);
      drawSteepLine(svg, steepLineById("mh"), 5.6, -1, true);
      drawSteepLine(svg, steepLineById("mnh"), -5.2, 1, true);
      drawSteepLine(svg, steepLineById("mn2"), 3.2, 1, true);
    }

    var formulaEl = document.getElementById("slope-formula");
    var noteEl = document.getElementById("slope-note");
    if (formulaEl) formulaEl.style.display = steepStep === 5 ? "none" : "";
    if (noteEl) noteEl.style.display = steepStep === 5 ? "none" : "";

    if (steepStep === 0) {
      km(formulaEl, "m = \\tfrac{1}{2}", true);
      setNote(noteEl,
        "<strong>Step 1.</strong> A gentle uphill: \\(m = \\tfrac{1}{2}\\). " +
        "For every 2 units right, the line rises only 1. Press <em>Next</em>.");
    } else if (steepStep === 1) {
      km(formulaEl, "m = 2", true);
      setNote(noteEl,
        "<strong>Step 2.</strong> \\(m = 2\\) is much steeper than \\(m = \\tfrac{1}{2}\\): " +
        "it rises 2 for every 1 unit right. Larger positive slope \\(\\Rightarrow\\) steeper uphill.");
    } else if (steepStep === 2) {
      km(formulaEl, "m = -\\tfrac{1}{2}", true);
      setNote(noteEl,
        "<strong>Step 3.</strong> \\(m = -\\tfrac{1}{2}\\) has the same look-steepness as \\(m = \\tfrac{1}{2}\\), but it goes downhill. " +
        "Visual steepness uses \\(|m|\\); the sign only tells up or down.");
    } else if (steepStep === 3) {
      km(formulaEl, "m = -2", true);
      setNote(noteEl,
        "<strong>Step 4.</strong> \\(m = -2\\) looks steeper than \\(m = -\\tfrac{1}{2}\\), because \\(|-2| > |-\\tfrac{1}{2}|\\). Press <em>Next</em> to compare the two green lines.");
    } else if (steepStep === 4) {
      km(formulaEl, "-2 < -\\tfrac{1}{2}", true);
      setNote(noteEl,
        "<strong>The two green lines.</strong> \\(m=-2\\) looks steeper than \\(m=-\\tfrac{1}{2}\\) — that part is true. " +
        "But both slopes are <em>negative</em>. A flatter downhill is closer to 0, so its slope is <em>larger</em>: " +
        "\\(-\\tfrac{1}{2}\\) is nearer 0 than \\(-2\\), therefore \\(-\\tfrac{1}{2} > -2\\). " +
        "Looking steeper does not mean a larger slope once the sign is negative.");
    }
  }

  function renderSlopeParallel(svg) {
    var m = 0.75;
    var c1 = 1;
    var c2 = parallelC2;
    var pA = toPx({ x: -GRID, y: m * (-GRID) + c1 });
    var pB = toPx({ x: GRID, y: m * GRID + c1 });
    var pC = toPx({ x: -GRID, y: m * (-GRID) + c2 });
    var pD = toPx({ x: GRID, y: m * GRID + c2 });
    svg.appendChild(seg(pA, pB, COL.x, 2.5));
    svg.appendChild(seg(pC, pD, COL.x, 2.2, "12 6 0 6"));
    var l1x = -5;
    var l2x = 4;
    addPlainLabel(svg, atXY(l1x, m * l1x + c1 + 2), "L1: m = " + fmt(m), COL.x, 13);
    addPlainLabel(svg, atXY(l2x, m * l2x + c2 - 2), "L2: m = " + fmt(m), COL.x, 13);
    var l2Hit = seg(pC, pD, "transparent", 20);
    l2Hit.setAttribute("data-parallel", "l2");
    l2Hit.setAttribute("pointer-events", "stroke");
    l2Hit.style.cursor = "move";
    svg.appendChild(l2Hit);

    if (Math.abs(c2 - c1) < 1e-9) {
      km(document.getElementById("slope-formula"),
        "L_1 = L_2 \\Rightarrow \\text{infinitely many points of intersection}", true);
      setNote(document.getElementById("slope-note"),
        "<strong>L₁ and L₂ overlap（無限個交點）</strong> — drag the dashed L₂ away. Slope stays the same.");
    } else {
      km(document.getElementById("slope-formula"),
        "m_1=m_2,\\;c_1\\ne c_2 \\Rightarrow \\text{no intersection}", true);
      setNote(document.getElementById("slope-note"),
        "<strong>L₁ and L₂ do not overlap（沒有交點）</strong> — drag the dashed L₂ onto L₁. Slope does not change.");
    }
  }

  function renderSlopePerp(svg) {
    var m1 = 2 / 3;
    var mWrong = -2 / 3;
    var mRight = -3 / 2;

    function addLine(m, col, w, dash, opacity) {
      var p1 = toPx({ x: -GRID, y: m * (-GRID) });
      var p2 = toPx({ x: GRID, y: m * GRID });
      var el = seg(p1, p2, col, w, dash);
      if (opacity != null) el.setAttribute("opacity", opacity);
      svg.appendChild(el);
    }

    addLine(m1, COL.x, 2.5, null, 1);
    (function () {
      var q = nearLine(m1, 0, 5.1, -1, 1.05);
      texAt(svg, q.x, q.y, "L_1:\\; m_1 = \\tfrac{2}{3}", COL.x);
    })();

    if (perpStep === 1) {
      addLine(mRight, COL.y, 2.2, "10 6", 0.95);
      (function () {
        var q = nearLine(mRight, 0, 3.2, 1, 0.9);
        texAt(svg, q.x, q.y, "L_2:\\; m_2 < 0", COL.y);
      })();
      var o = toPx({ x: 0, y: 0 });
      svg.appendChild(rightAngle(o, toPx({ x: 4, y: m1 * 4 }), toPx({ x: 4, y: mRight * 4 }), 14));
    }
    if (perpStep === 2) {
      addLine(mWrong, COL.line, 2.2, "10 6", 0.95);
      (function () {
        var q = nearLine(mWrong, 0, 3.8, 1, 0.9);
        texAt(svg, q.x, q.y, "m_2 = -\\tfrac{2}{3}\\; \\text{✗}", COL.line);
      })();
    }
    if (perpStep >= 3) {
      addLine(mRight, COL.y, 2.5, null, 1);
      (function () {
        var q = nearLine(mRight, 0, 3.2, 1, 0.9);
        texAt(svg, q.x, q.y, "L_2:\\; m_2 = -\\tfrac{3}{2}\\; \\text{✓}", COL.y);
      })();
      var o2 = toPx({ x: 0, y: 0 });
      svg.appendChild(rightAngle(o2, toPx({ x: 4, y: m1 * 4 }), toPx({ x: 4, y: mRight * 4 }), 14));
    }

    if (perpStep === 0) {
      km(document.getElementById("slope-formula"), "m_1 \\times m_2 = -1 \\text{ ?}", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 1.</strong> One line has slope \\(m_1 = \\tfrac{2}{3}\\). " +
        "If another line is perpendicular to it, why should \\(m_1 \\times m_2 = -1\\)? Press <em>Next</em>.");
    } else if (perpStep === 1) {
      km(document.getElementById("slope-formula"), "m_1 > 0 \\Rightarrow m_2 < 0", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 2.</strong> The green dashed line is perpendicular to the blue line. " +
        "Since \\(m_1 = \\tfrac{2}{3} > 0\\), the perpendicular slope \\(m_2\\) must be <em>negative</em> (\\(m_2 < 0\\)). " +
        "Opposite signs \\(\\Rightarrow m_1 \\times m_2\\) is negative.");
    } else if (perpStep === 2) {
      km(document.getElementById("slope-formula"), "\\tfrac{2}{3} \\text{ and } -\\tfrac{2}{3} \\text{ are NOT perpendicular}", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 3.</strong> What about \\(m_2 = -\\tfrac{2}{3}\\)? Just flipping the sign gives a reflection, not a \\(90°\\) turn. " +
        "The angle is clearly not right — so the perpendicular slope is not simply \\(-m_1\\).");
    } else {
      km(document.getElementById("slope-formula"),
        "m_1 \\times m_2 = -1 \\quad\\Rightarrow\\quad \\tfrac{2}{3} \\times \\left(-\\tfrac{3}{2}\\right) = -1", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 4 — conclusion.</strong> The perpendicular slope is the <strong>negative reciprocal</strong>: \\(m_2 = -\\tfrac{3}{2}\\). " +
        "Check: \\(\\tfrac{2}{3} \\times \\left(-\\tfrac{3}{2}\\right) = -1\\). Swap rise and run, then change sign.");
    }
  }

  function updateSlopeStepNav() {
    var stepLbl = document.getElementById("perp-step-label");
    var prevBtn = document.getElementById("perp-prev");
    var nextBtn = document.getElementById("perp-next");
    var max = slopeMode === "steep" ? STEEP_MAX : 3;
    var step = slopeMode === "steep" ? steepStep : perpStep;
    if (stepLbl) stepLbl.textContent = "Step " + (step + 1) + " / " + (max + 1);
    if (prevBtn) prevBtn.disabled = step === 0;
    if (nextBtn) nextBtn.disabled = step === max;
  }

  function renderSlope() {
    var svg = document.getElementById("slope-svg");
    if (!svg) return;
    clr(svg);
    drawGrid(svg);
    var steepRow = document.getElementById("steep-sort");
    var stepNav = document.getElementById("perp-step-nav");
    if (steepRow) steepRow.classList.toggle("visible", slopeMode === "steep" && steepStep === 5);
    if (stepNav) stepNav.classList.toggle("visible", slopeMode === "perp" || slopeMode === "steep");
    updateSlopeStepNav();
    var formulaEl = document.getElementById("slope-formula");
    if (formulaEl && slopeMode !== "steep") formulaEl.style.display = "";
    var noteEl = document.getElementById("slope-note");
    if (noteEl && slopeMode !== "steep") noteEl.style.display = "";
    if (slopeMode === "basic") renderSlopeBasic(svg);
    else if (slopeMode === "steep") renderSlopeSteep(svg);
    else if (slopeMode === "parallel") renderSlopeParallel(svg);
    else renderSlopePerp(svg);
  }

  /* ── Lab 3: Mid-point & section ── */
  function renderMidpt() {
    var svg = document.getElementById("mid-svg");
    if (!svg) return;
    clr(svg);
    drawGrid(svg);

    var pa = toPx(A);
    var pb = toPx(B);
    svg.appendChild(dragHandle(pa, "ab", 0));
    svg.appendChild(dragHandle(pb, "ab", 1));

    function coordName(name, x, y) {
      return name + "(" + fmt(x) + "," + fmt(y) + ")";
    }
    function segUp(a, b) {
      var n = perpVec(unit(a, b));
      if (n.y > 0) n = { x: -n.x, y: -n.y };
      return n;
    }
    function addCoordLabel(pt, dir, text) {
      var d = Math.hypot(dir.x, dir.y) || 1;
      var ux = dir.x / d;
      var uy = dir.y / d;
      var gap = 22 + Math.min(20, Math.max(0, text.length - 5) * 1.4);
      var x = Math.max(30, Math.min(470, pt.x + ux * gap));
      var y = Math.max(18, Math.min(482, pt.y + uy * gap));
      var anchor = "middle";
      if (ux > 0.4) anchor = "start";
      else if (ux < -0.4) anchor = "end";
      var t = E("text", {
        x: x, y: y,
        fill: COL.ink, "font-size": 14, "font-weight": 700,
        "text-anchor": anchor, "dominant-baseline": "middle",
      });
      t.textContent = text;
      svg.appendChild(t);
    }
    function addEndLabel(endPt, otherPt, text) {
      var u = unit(otherPt, endPt);
      var n = segUp(pa, pb);
      addCoordLabel(endPt, { x: u.x * 0.9 + n.x * 0.55, y: u.y * 0.9 + n.y * 0.55 }, text);
    }

    var ratioRow = document.getElementById("mid-ratio-row");
    if (ratioRow) ratioRow.style.display = midMode === "section" ? "flex" : "none";

    if (midMode === "mid") {
      var M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      var pm = toPx(M);
      svg.appendChild(seg(pa, pb, COL.line, 2.4));
      svg.appendChild(dot(pa, COL.point, 5));
      svg.appendChild(dot(pb, COL.point, 5));
      svg.appendChild(dot(pm, COL.point, 5));
      addEndLabel(pa, pb, coordName("A", A.x, A.y));
      addEndLabel(pb, pa, coordName("B", B.x, B.y));
      addCoordLabel(pm, segUp(pa, pb), coordName("M", M.x, M.y));
      km(document.getElementById("mid-formula"),
        "M = \\left(\\dfrac{" + A.x + "+" + B.x + "}{2},\\; \\dfrac{" + A.y + "+" + B.y + "}{2}\\right) = "
        + pairFracTex(A.x + B.x, 2, A.y + B.y, 2), true);
      setNote(document.getElementById("mid-note"),
        "Mid-point = average of coordinates — same idea as the mean of two numbers.");
    } else {
      var m = secM;
      var n = secN;
      var P = {
        x: (n * A.x + m * B.x) / (m + n),
        y: (n * A.y + m * B.y) / (m + n),
      };
      var pp = toPx(P);
      svg.appendChild(seg(pa, pp, COL.orange, 3.2));
      svg.appendChild(seg(pp, pb, COL.y, 3.2));
      var apMid = lerpPt(pa, pp, 0.5);
      var pbMid = lerpPt(pp, pb, 0.5);
      var nDown = perpVec(unit(pa, pb));
      if (nDown.y < 0) nDown = { x: -nDown.x, y: -nDown.y };
      var nUp = { x: -nDown.x, y: -nDown.y };
      addPlainLabel(svg, { x: apMid.x + nDown.x * 30, y: apMid.y + nDown.y * 30 }, "m = " + m, COL.orange, 13);
      addPlainLabel(svg, { x: pbMid.x + nDown.x * 30, y: pbMid.y + nDown.y * 30 }, "n = " + n, COL.y, 13);
      svg.appendChild(dot(pa, COL.point, 5));
      svg.appendChild(dot(pb, COL.point, 5));
      svg.appendChild(dot(pp, COL.point, 5));
      addEndLabel(pa, pb, coordName("A", A.x, A.y));
      addEndLabel(pb, pa, coordName("B", B.x, B.y));
      var pxNum = n * A.x + m * B.x;
      var pyNum = n * A.y + m * B.y;
      var den = m + n;
      var pDir = { x: nUp.x * 0.7 + unit(pa, pb).x * 0.15, y: nUp.y * 0.7 + unit(pa, pb).y * 0.15 };
      var pd = Math.hypot(pDir.x, pDir.y) || 1;
      var pLab = {
        x: Math.max(28, Math.min(360, pp.x + (pDir.x / pd) * 30)),
        y: Math.max(22, Math.min(478, pp.y + (pDir.y / pd) * 30)),
      };
      svgTex(svg, { x: pLab.x - 8, y: pLab.y },
        pairTex("P", pxNum, den, pyNum, den), 140, 26, COL.ink, 14);
      km(document.getElementById("mid-formula"),
        "P = \\left(\\dfrac{" + n + "\\cdot" + A.x + "+" + m + "\\cdot" + B.x + "}{" + den + "},\\; "
        + "\\dfrac{" + n + "\\cdot" + A.y + "+" + m + "\\cdot" + B.y + "}{" + den + "}\\right) = "
        + pairFracTex(pxNum, den, pyNum, den), true);
      setNote(document.getElementById("mid-note"),
        "Orange \\(AP\\) and green \\(PB\\) show the ratio \\(m:n\\) from \\(A\\), so \\(AP:PB = m:n\\). " +
        "Weight \\(B\\) by \\(m\\) and \\(A\\) by \\(n\\), then divide by \\(m+n\\). When \\(m = n\\) you get the mid-point.");
    }
    renderKatex(document.getElementById("lab-midpt"));
  }
  function perpVec(u) { return { x: -u.y, y: u.x }; }

  function lerpPt(p, q, t) {
    return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  }

  function hashMarks(p, q, t, count, col, len) {
    var g = E("g", {});
    var u = unit(p, q);
    var n = perpVec(u);
    var c = lerpPt(p, q, t);
    len = len || 10;
    var gap = 5;
    for (var i = 0; i < count; i++) {
      var off = (i - (count - 1) / 2) * gap;
      var a = { x: c.x + u.x * off - n.x * len / 2, y: c.y + u.y * off - n.y * len / 2 };
      var b = { x: c.x + u.x * off + n.x * len / 2, y: c.y + u.y * off + n.y * len / 2 };
      g.appendChild(seg(a, b, col || COL.line, 2));
    }
    return g;
  }

  function halfSideTicks(p1, m, p2, count) {
    var g = E("g", {});
    g.appendChild(hashMarks(p1, m, 0.5, count, COL.line, 9));
    g.appendChild(hashMarks(m, p2, 0.5, count, COL.line, 9));
    return g;
  }

  function shortArcPath(V, a1, a2, r) {
    var da = a2 - a1;
    while (da <= -Math.PI) da += Math.PI * 2;
    while (da > Math.PI) da -= Math.PI * 2;
    var sweep = da >= 0 ? 1 : 0;
    return "M " + (V.x + r * Math.cos(a1)) + " " + (V.y + r * Math.sin(a1)) +
      " A " + r + " " + r + " 0 0 " + sweep + " " +
      (V.x + r * Math.cos(a2)) + " " + (V.y + r * Math.sin(a2));
  }

  function bisectorArcMarks(V, P, Q, I, count, baseR) {
    var g = E("g", {});
    var aP = Math.atan2(P.y - V.y, P.x - V.x);
    var aQ = Math.atan2(Q.y - V.y, Q.x - V.x);
    var aI = Math.atan2(I.y - V.y, I.x - V.x);
    var gap = 0.14;
    for (var k = 0; k < count; k++) {
      var r = baseR + k * 5;
      var mid1 = aI - gap;
      var mid2 = aI + gap;
      g.appendChild(E("path", {
        d: shortArcPath(V, aP, mid1, r),
        fill: "none", stroke: COL.line, "stroke-width": 1.6,
      }));
      g.appendChild(E("path", {
        d: shortArcPath(V, mid2, aQ, r),
        fill: "none", stroke: COL.line, "stroke-width": 1.6,
      }));
    }
    return g;
  }

  function centSideLengths(v) {
    return [0, 1, 2].map(function (i) {
      var j = (i + 1) % 3;
      return Math.hypot(v[j].x - v[i].x, v[j].y - v[i].y);
    });
  }

  function centSideTickPlan(v) {
    var sides = centSideLengths(v).map(function (len, idx) { return { idx: idx, len: len }; });
    sides.sort(function (a, b) { return a.len - b.len; });
    var plan = [0, 0, 0];
    plan[sides[0].idx] = 1;
    plan[sides[1].idx] = 2;
    plan[sides[2].idx] = 3;
    return plan;
  }

  function centAngleAt(v, i) {
    var prev = v[(i + 2) % 3];
    var cur = v[i];
    var next = v[(i + 1) % 3];
    var u = { x: prev.x - cur.x, y: prev.y - cur.y };
    var w = { x: next.x - cur.x, y: next.y - cur.y };
    var dotp = u.x * w.x + u.y * w.y;
    var m = Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1;
    return Math.acos(Math.max(-1, Math.min(1, dotp / m)));
  }

  function centAngleArcPlan(v) {
    var angs = [0, 1, 2].map(function (i) { return { idx: i, ang: centAngleAt(v, i) }; });
    angs.sort(function (a, b) { return a.ang - b.ang; });
    var plan = [0, 0, 0];
    plan[angs[0].idx] = 1;
    plan[angs[1].idx] = 2;
    plan[angs[2].idx] = 3;
    return plan;
  }

  function distPointToSeg(p, a, b) {
    var abx = b.x - a.x;
    var aby = b.y - a.y;
    var len2 = abx * abx + aby * aby || 1;
    var t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
  }

  function incentre(v) {
    var a = Math.hypot(v[1].x - v[2].x, v[1].y - v[2].y);
    var b = Math.hypot(v[0].x - v[2].x, v[0].y - v[2].y);
    var c = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
    var s = a + b + c;
    return { x: (a * v[0].x + b * v[1].x + c * v[2].x) / s, y: (a * v[0].y + b * v[1].y + c * v[2].y) / s };
  }

  function circumcentre(v) {
    var A0 = v[0], B0 = v[1], C0 = v[2];
    var D = 2 * (A0.x * (B0.y - C0.y) + B0.x * (C0.y - A0.y) + C0.x * (A0.y - B0.y));
    if (Math.abs(D) < 1e-9) return null;
    var a2 = A0.x * A0.x + A0.y * A0.y;
    var b2 = B0.x * B0.x + B0.y * B0.y;
    var c2 = C0.x * C0.x + C0.y * C0.y;
    return {
      x: (a2 * (B0.y - C0.y) + b2 * (C0.y - A0.y) + c2 * (A0.y - B0.y)) / D,
      y: (a2 * (C0.x - B0.x) + b2 * (A0.x - C0.x) + c2 * (B0.x - A0.x)) / D,
    };
  }

  function centroid(v) {
    return { x: (v[0].x + v[1].x + v[2].x) / 3, y: (v[0].y + v[1].y + v[2].y) / 3 };
  }

  function centFoot(P, Q, R) {
    var dx = R.x - Q.x;
    var dy = R.y - Q.y;
    var t = ((P.x - Q.x) * dx + (P.y - Q.y) * dy) / (dx * dx + dy * dy || 1);
    return { x: Q.x + t * dx, y: Q.y + t * dy };
  }

  function intersectLines(p1, p2, p3, p4) {
    var d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    var d2 = { x: p4.x - p3.x, y: p4.y - p3.y };
    var det = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(det) < 1e-9) return null;
    var t = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / det;
    return { x: p1.x + t * d1.x, y: p1.y + t * d1.y };
  }

  function orthocentreCoord(v) {
    var F0 = centFoot(v[0], v[1], v[2]);
    var F1 = centFoot(v[1], v[0], v[2]);
    return intersectLines(v[0], F0, v[1], F1);
  }

  function labelAway(p, from, text, col, dist) {
    var dx = p.x - from.x;
    var dy = p.y - from.y;
    var d = Math.hypot(dx, dy) || 1;
    var ux = dx / d;
    var uy = dy / d;
    var len = String(text).length;
    var gap = (dist || 18) + Math.min(28, Math.max(0, len - 2) * 1.8);
    var x = p.x + ux * gap;
    var y = p.y + uy * gap;
    /* If near the SVG edge, flip so the label stays on-screen */
    var margin = 8 + len * 4;
    if (x < margin || x > 500 - margin || y < 16 || y > 500 - 16) {
      ux = -ux;
      uy = -uy;
      x = p.x + ux * gap;
      y = p.y + uy * gap;
    }
    x = Math.max(margin, Math.min(500 - margin, x));
    y = Math.max(16, Math.min(484, y));
    var anchor = "middle";
    if (Math.abs(ux) >= Math.abs(uy) * 0.75) {
      anchor = ux >= 0 ? "start" : "end";
    }
    var baseline = "middle";
    if (Math.abs(uy) > Math.abs(ux) * 0.9) {
      baseline = uy >= 0 ? "hanging" : "auto";
    }
    var t = E("text", {
      x: x, y: y,
      fill: col || COL.ink, "font-size": 14, "font-weight": 700,
      "text-anchor": anchor, "dominant-baseline": baseline,
    });
    t.textContent = text;
    return t;
  }

  function renderCentres() {
    var svg = document.getElementById("cent-svg");
    if (!svg) return;
    clr(svg);

    var v = CENT_TRI;
    var px = v.slice();

    svg.appendChild(E("polygon", {
      points: px.map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: COL.fill, stroke: COL.ink, "stroke-width": 2.5,
    }));

    var labelOff = [
      { dx: 0, dy: -18 },
      { dx: -28, dy: 24 },
      { dx: 20, dy: 20 },
    ];
    ["A", "B", "C"].forEach(function (name, i) {
      svg.appendChild(dot(px[i], COL.point, 4.5));
      svg.appendChild(label(
        { x: px[i].x + labelOff[i].dx, y: px[i].y + labelOff[i].dy },
        name, COL.ink, 0, 0
      ));
    });

    var I = incentre(v);
    var O = circumcentre(v);
    var G = centroid(v);
    var H = orthocentreCoord(v);

    function midp(p, q) {
      return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    }

    function footOnLine(P, Q, R) {
      return centFoot(P, Q, R);
    }

    function perpBisectorLine(p, q, ext) {
      var M = midp(p, q);
      var u = unit(p, q);
      var n = { x: -u.y, y: u.x };
      return {
        M: M,
        a: { x: M.x - n.x * ext, y: M.y - n.y * ext },
        b: { x: M.x + n.x * ext, y: M.y + n.y * ext },
        u: u,
        n: n,
      };
    }

    function markRightAt(vertex, arm1, arm2, size) {
      svg.appendChild(rightAngle(vertex, arm1, arm2, size || 11));
    }

    var sideTicks = centSideTickPlan(v);
    var arcPlan = centAngleArcPlan(v);

    if (centMode === "I") {
      v.forEach(function (vi, i) {
        svg.appendChild(seg(px[i], { x: I.x, y: I.y }, COL.x, 2, "6 4"));
        svg.appendChild(bisectorArcMarks(vi, v[(i + 1) % 3], v[(i + 2) % 3], I, arcPlan[i], 16));
      });
      var r = distPointToSeg(I, v[0], v[1]);
      svg.appendChild(E("circle", {
        cx: I.x, cy: I.y, r: r,
        fill: "none", stroke: COL.y, "stroke-width": 2,
      }));
      svg.appendChild(dot({ x: I.x, y: I.y }, COL.point, 4.5));
      svg.appendChild(label({ x: I.x + 12, y: I.y - 10 }, "I", COL.ink, 0, 0));
      km(document.getElementById("cent-formula"), "\\text{In-centre } I", true);
      setNote(document.getElementById("cent-note"),
        "\\(I\\) = intersection of the three <strong>angle bisectors 角平分線</strong>. " +
        "Arc marks on each half of an angle match (same count) — different counts at \\(A,B,C\\) show the three angles differ. Also the <strong>incircle 內切圓</strong> centre.");
    } else if (centMode === "O") {
      if (O) {
        var rad = Math.hypot(O.x - v[0].x, O.y - v[0].y);
        [[0, 1], [1, 2], [2, 0]].forEach(function (pair, sideIdx) {
          var p = v[pair[0]];
          var q = v[pair[1]];
          var M = midp(p, q);
          var n = perpVec(unit(p, q));
          var towardM = (M.x - O.x) * n.x + (M.y - O.y) * n.y;
          if (towardM < 0) { n = { x: -n.x, y: -n.y }; }
          var onCircle = { x: O.x + n.x * rad, y: O.y + n.y * rad };
          svg.appendChild(seg(O, onCircle, COL.x, 2, "7 5"));
          markRightAt(M, { x: M.x + unit(p, q).x * 18, y: M.y + unit(p, q).y * 18 }, onCircle, 10);
          svg.appendChild(halfSideTicks(p, M, q, sideTicks[sideIdx]));
        });
        svg.appendChild(E("circle", {
          cx: O.x, cy: O.y, r: rad,
          fill: "none", stroke: COL.y, "stroke-width": 2,
        }));
        svg.appendChild(dot({ x: O.x, y: O.y }, COL.point, 5));
        svg.appendChild(labelAway(O, G, "O", COL.ink, 18));
      }
      km(document.getElementById("cent-formula"), "\\text{Circumcentre } O", true);
      setNote(document.getElementById("cent-note"),
        "\\(O\\) = intersection of the three <strong>perpendicular bisectors 垂直平分線</strong>. " +
        "Right-angle mark + matching half-ticks on each side; \\(1/2/3\\) tick counts distinguish the three different side lengths. Also the <strong>circumcircle 外接圓</strong> centre.");
    } else if (centMode === "G") {
      v.forEach(function (vi, i) {
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        var p1 = v[j];
        var p2 = v[k];
        var M = midp(p1, p2);
        var sideIdx = (i + 1) % 3;
        svg.appendChild(seg(px[i], M, COL.x, 2.5));
        svg.appendChild(dot(M, COL.point, 2.5));
        svg.appendChild(halfSideTicks(p1, M, p2, sideTicks[sideIdx]));
      });
      svg.appendChild(dot({ x: G.x, y: G.y }, COL.point, 4.5));
      svg.appendChild(label({ x: G.x + 12, y: G.y + 4 }, "G", COL.ink, 0, 0));
      km(document.getElementById("cent-formula"), "\\text{Centroid } G", true);
      setNote(document.getElementById("cent-note"),
        "\\(G\\) = intersection of the three <strong>medians 中線</strong>. " +
        "Matching half-ticks on each side mark the mid-point; \\(1/2/3\\) counts show the three sides have different lengths. Divides each median \\(2:1\\) from the vertex.");
    } else {
      v.forEach(function (vi, i) {
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        var F = footOnLine(vi, v[j], v[k]);
        svg.appendChild(seg(px[i], F, COL.x, 2.5));
        markRightAt(F, px[i], v[j], 10);
      });
      if (H) {
        svg.appendChild(dot({ x: H.x, y: H.y }, COL.point, 5));
        svg.appendChild(labelAway(H, G, "H", COL.ink, 18));
      }
      km(document.getElementById("cent-formula"), "\\text{Orthocentre } H", true);
      setNote(document.getElementById("cent-note"),
        "\\(H\\) = intersection of the three <strong>altitudes 高</strong> " +
        "(right-angle mark where each altitude meets the opposite side).");
    }
  }

  function renderActive() {
    if (activeLab === "distance") renderDistance();
    else if (activeLab === "slope") renderSlope();
    else if (activeLab === "midpt") renderMidpt();
    else renderCentres();
  }

  function showLab(id) {
    activeLab = id;
    document.querySelectorAll("#panel-tools .lab").forEach(function (lab) {
      lab.classList.toggle("active", lab.id === "lab-" + id);
    });
    document.querySelectorAll("#jm33-lab-nav .chip").forEach(function (c) {
      c.classList.toggle("active", c.dataset.lab === id);
    });
    renderActive();
  }

  function bindBtns(containerId, items, active, onPick) {
    var row = document.getElementById(containerId);
    if (!row) return;
    row.innerHTML = "";
    items.forEach(function (item) {
      var id = item.id || item;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (id === active ? " active" : "");
      b.textContent = item.label || item;
      b.addEventListener("click", function () {
        onPick(id);
        row.querySelectorAll(".btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
      });
      row.appendChild(b);
    });
  }

  function sortSlotUnder(ev) {
    var el = document.elementFromPoint(ev.clientX, ev.clientY);
    return el && el.closest ? el.closest(".sort-slot, .sort-pool") : null;
  }

  function ghostDrag(sourceEl, e, onMove, onDrop) {
    var ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = sourceEl.innerHTML;
    var sx = e.clientX;
    var sy = e.clientY;
    var moved = false;
    ghost.style.left = sx + "px";
    ghost.style.top = sy + "px";
    document.body.appendChild(ghost);
    sourceEl.classList.add("dragging");

    function mv(ev) {
      if (Math.abs(ev.clientX - sx) > 4 || Math.abs(ev.clientY - sy) > 4) moved = true;
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      if (onMove) onMove(ev, moved);
    }
    function cleanup() {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cn);
      ghost.remove();
      sourceEl.classList.remove("dragging");
    }
    function up(ev) { cleanup(); onDrop(ev, moved); }
    function cn(ev) { cleanup(); onDrop(ev, true); }
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cn);
  }

  function renderSteepSort() {
    var pool = document.getElementById("steep-pool");
    var slots = document.querySelectorAll("#steep-slots .sort-slot");
    if (!pool) return;

    function makeCard(line) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort-card";
      btn.dataset.id = line.id;
      btn.style.borderLeft = "5px solid " + line.col;
      btn.style.color = line.col;
      btn.innerHTML = K(line.tex);
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        var originPool = steepPlacements.pool.slice();
        var originSlots = steepPlacements.slots.slice();
        ghostDrag(btn, e, function (ev) {
          document.querySelectorAll(".sort-slot.drag-over").forEach(function (n) {
            n.classList.remove("drag-over");
          });
          var hit = sortSlotUnder(ev);
          if (hit && hit.classList.contains("sort-slot")) hit.classList.add("drag-over");
        }, function (ev, moved) {
          document.querySelectorAll(".sort-slot.drag-over").forEach(function (n) {
            n.classList.remove("drag-over");
          });
          if (!moved) return;
          var hit = sortSlotUnder(ev);
          var cardId = line.id;
          var fromSlotIdx = steepPlacements.slots.indexOf(cardId);
          var newPool = steepPlacements.pool.filter(function (id) { return id !== cardId; });
          var newSlots = steepPlacements.slots.map(function (id) {
            return id === cardId ? null : id;
          });
          if (hit && hit.classList.contains("sort-slot")) {
            var slotIdx = +hit.dataset.slot;
            if (fromSlotIdx === slotIdx) {
              steepPlacements.pool = originPool;
              steepPlacements.slots = originSlots;
              renderSteepSort();
              return;
            }
            var displaced = newSlots[slotIdx];
            newSlots[slotIdx] = cardId;
            if (displaced) {
              if (fromSlotIdx >= 0) newSlots[fromSlotIdx] = displaced;
              else newPool.push(displaced);
            }
          } else if (hit && hit.classList.contains("sort-pool")) {
            newPool.push(cardId);
          } else {
            steepPlacements.pool = originPool;
            steepPlacements.slots = originSlots;
            renderSteepSort();
            return;
          }
          steepPlacements.pool = newPool;
          steepPlacements.slots = newSlots;
          var msg = document.getElementById("steep-sort-msg");
          if (msg) { msg.className = "sort-msg"; msg.textContent = "Place all four slopes, then check."; }
          renderSteepSort();
        });
      });
      return btn;
    }

    pool.innerHTML = "";
    slots.forEach(function (slot) {
      slot.innerHTML = "";
      slot.classList.remove("drag-over");
      var id = steepPlacements.slots[+slot.dataset.slot];
      if (id) {
        var line = steepLineById(id);
        if (line) slot.appendChild(makeCard(line));
      }
    });
    steepPlacements.pool.forEach(function (id) {
      var line = steepLineById(id);
      if (line) pool.appendChild(makeCard(line));
    });
  }

  function resetSteepSort() {
    steepPlacements = {
      pool: STEEP_LINES.map(function (L) { return L.id; }).sort(function () { return Math.random() - 0.5; }),
      slots: [null, null, null, null],
    };
    var msg = document.getElementById("steep-sort-msg");
    if (msg) { msg.className = "sort-msg"; msg.textContent = "Place all four slopes, then check."; }
    renderSteepSort();
  }

  function checkSteepSort() {
    var msg = document.getElementById("steep-sort-msg");
    if (!msg) return;
    if (steepPlacements.pool.length > 0) {
      msg.className = "sort-msg bad";
      msg.textContent = "Place all four slopes in the slots first.";
      return;
    }
    var ok = steepPlacements.slots.every(function (id, i) { return id === STEEP_SORT_ORDER[i]; });
    if (ok) {
      msg.className = "sort-msg ok";
      msg.innerHTML = "Correct! \\(-2 < -\\tfrac{1}{2} < \\tfrac{1}{2} < 2\\).";
      renderKatex(msg);
    } else {
      msg.className = "sort-msg bad";
      msg.textContent = "Not quite — remember negative slopes are smaller than positive ones.";
    }
  }

  function initSteepSort() {
    resetSteepSort();
    var checkBtn = document.getElementById("steep-check");
    var resetBtn = document.getElementById("steep-reset");
    if (checkBtn) checkBtn.addEventListener("click", checkSteepSort);
    if (resetBtn) resetBtn.addEventListener("click", resetSteepSort);
  }

  function bindSvgDrag(svg, key, maxIdx) {
    svg.addEventListener("pointerdown", function (e) {
      var el = e.target;
      if (el.dataset[key] == null) return;
      drag = +el.dataset[key];
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (drag == null) return;
      var p = clampGrid(fromPx(pt(e, svg)));
      if (key === "ab") {
        if (drag === 0) A = p; else B = p;
      } else if (key === "slopeab") {
        if (drag === 0) SLOPE_A = p; else SLOPE_B = p;
      } else if (key === "abc") {
        /* centres are static */
      }
      renderActive();
    });
    svg.addEventListener("pointerup", function () { drag = null; });
    svg.addEventListener("pointercancel", function () { drag = null; });
  }

  function bindParallelDrag(svg) {
    svg.addEventListener("pointerdown", function (e) {
      if (!e.target || e.target.dataset.parallel !== "l2") return;
      parallelDragging = true;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!parallelDragging || slopeMode !== "parallel") return;
      var p = fromPx(pt(e, svg));
      var next = p.y - 0.75 * p.x;
      next = Math.max(-10, Math.min(10, Math.round(next * 4) / 4));
      if (Math.abs(next - 1) < 0.26) next = 1;
      parallelC2 = next;
      parallelHandle = { x: p.x, y: 0.75 * p.x + next };
      renderSlope();
    });
    svg.addEventListener("pointerup", function () { parallelDragging = false; });
    svg.addEventListener("pointercancel", function () { parallelDragging = false; });
  }

  function init() {
    document.querySelectorAll("#jm33-lab-nav .chip").forEach(function (b) {
      b.addEventListener("click", function () { showLab(b.dataset.lab); });
    });

    paintTex(document.getElementById("panel-tools"));
    renderKatex(document.getElementById("panel-tools"));

    bindBtns("slope-mode-btns", SLOPE_MODES, slopeMode, function (id) {
      slopeMode = id;
      if (id !== "perp") perpStep = 0;
      if (id !== "steep") steepStep = 0;
      var sr = document.getElementById("steep-sort");
      if (sr) sr.classList.remove("visible");
      renderSlope();
    });

    bindBtns("mid-mode-btns", MID_MODES, midMode, function (id) {
      midMode = id;
      renderMidpt();
    });

    bindBtns("cent-mode-btns", CENT_MODES, centMode, function (id) {
      centMode = id;
      renderCentres();
    });

    var distSvg = document.getElementById("dist-svg");
    var slopeSvg = document.getElementById("slope-svg");
    var midSvg = document.getElementById("mid-svg");
    if (distSvg) bindSvgDrag(distSvg, "ab");
    if (slopeSvg) {
      bindSvgDrag(slopeSvg, "slopeab");
      bindParallelDrag(slopeSvg);
    }
    if (midSvg) bindSvgDrag(midSvg, "ab");

    var perpPrev = document.getElementById("perp-prev");
    var perpNext = document.getElementById("perp-next");
    if (perpPrev) perpPrev.addEventListener("click", function () {
      if (slopeMode === "steep") {
        if (steepStep > 0) { steepStep--; renderSlope(); }
      } else if (perpStep > 0) {
        perpStep--;
        renderSlope();
      }
    });
    if (perpNext) perpNext.addEventListener("click", function () {
      if (slopeMode === "steep") {
        if (steepStep < STEEP_MAX) { steepStep++; renderSlope(); }
      } else if (perpStep < 3) {
        perpStep++;
        renderSlope();
      }
    });

    initSteepSort();

    var mEl = document.getElementById("mid-m");
    var nEl = document.getElementById("mid-n");
    if (mEl) mEl.addEventListener("input", function () {
      secM = +mEl.value;
      document.getElementById("mid-m-val").textContent = secM;
      renderMidpt();
    });
    if (nEl) nEl.addEventListener("input", function () {
      secN = +nEl.value;
      document.getElementById("mid-n-val").textContent = secN;
      renderMidpt();
    });

    showLab("distance");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
