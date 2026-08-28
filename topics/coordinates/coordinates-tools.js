(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var ORIGIN = { x: 250, y: 250 };
  var SCALE = 22;
  var GRID = 10;

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

  function svgTex(svg, px, tex, w, h) {
    var fo = E("foreignObject", {
      x: px.x, y: px.y - (h || 28), width: w || 130, height: h || 36,
    });
    var div = document.createElement("div");
    div.style.cssText = "font-size:14px;color:#e2e8f0;line-height:1.2";
    div.innerHTML = K(tex);
    fo.appendChild(div);
    svg.appendChild(fo);
  }

  function signed(n) {
    if (n < 0) return "(" + n + ")";
    return String(n);
  }

  function clr(g) { while (g.firstChild) g.removeChild(g.firstChild); }

  function drawGrid(svg) {
    for (var i = -GRID; i <= GRID; i++) {
      var gx = ORIGIN.x + i * SCALE;
      var gy = ORIGIN.y + i * SCALE;
      svg.appendChild(E("line", {
        x1: gx, y1: 20, x2: gx, y2: 480,
        stroke: i === 0 ? "#94a3b8" : "#334155",
        "stroke-width": i === 0 ? 1.5 : 0.5,
      }));
      svg.appendChild(E("line", {
        x1: 20, y1: gy, x2: 480, y2: gy,
        stroke: i === 0 ? "#94a3b8" : "#334155",
        "stroke-width": i === 0 ? 1.5 : 0.5,
      }));
    }
    svg.appendChild(E("text", { x: 462, y: ORIGIN.y - 6, fill: "#94a3b8", "font-size": 12 })).textContent = "x";
    svg.appendChild(E("text", { x: ORIGIN.x + 6, y: 28, fill: "#94a3b8", "font-size": 12 })).textContent = "y";
  }

  function seg(p, q, col, w, dash) {
    var el = E("line", {
      x1: p.x, y1: p.y, x2: q.x, y2: q.y,
      stroke: col || "#38bdf8", "stroke-width": w || 2.5, "stroke-linecap": "round",
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
      fill: "none", stroke: "#fbbf24", "stroke-width": 1.8,
    });
  }

  function unit(p, q) {
    var d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
  }

  function dot(p, col, r) {
    return E("circle", { cx: p.x, cy: p.y, r: r || 6, fill: col || "#38bdf8" });
  }

  function label(p, text, col, dx, dy) {
    var t = E("text", {
      x: p.x + (dx || 10), y: p.y + (dy || -6),
      fill: col || "#e2e8f0", "font-size": 14, "font-weight": 700,
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

    svg.appendChild(seg(pa, corner, "#f472b6", 2, "6 4"));
    svg.appendChild(seg(corner, pb, "#34d399", 2, "6 4"));
    svg.appendChild(seg(pa, pb, "#38bdf8", 3.5));
    svg.appendChild(rightAngle(corner, pa, pb, 12));

    svg.appendChild(dot(pa, "#fbbf24", 8));
    svg.appendChild(dot(pb, "#2dd4bf", 8));
    svg.appendChild(labelAway(pa, corner, "A", "#fbbf24", 16));
    svg.appendChild(labelAway(pb, corner, "B", "#2dd4bf", 16));
    svg.appendChild(label(
      { x: (pa.x + corner.x) / 2, y: pa.y + 28 },
      "|Δx| = " + Math.abs(dx), "#f472b6", 0, 0
    ));
    svg.appendChild(label(
      { x: corner.x + 8, y: (corner.y + pb.y) / 2 },
      "|Δy| = " + Math.abs(dy), "#34d399", 0, 4
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
    { id: "mh", m: 0.5, c: -1, col: "#38bdf8", tex: "m = \\tfrac{1}{2}", val: 0.5 },
    { id: "p2", m: 2, c: 2, col: "#0284c7", tex: "m = 2", val: 2 },
    { id: "mnh", m: -0.5, c: 3, col: "#f87171", tex: "m = -\\tfrac{1}{2}", val: -0.5 },
    { id: "mn2", m: -2, c: -2, col: "#dc2626", tex: "m = -2", val: -2 },
  ];
  var STEEP_SORT_ORDER = ["mn2", "mnh", "mh", "p2"];

  function lineMC(m, c, col, w, opacity) {
    var p1 = toPx({ x: -GRID, y: m * (-GRID) + c });
    var p2 = toPx({ x: GRID, y: m * GRID + c });
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

    svg.appendChild(seg(pa, corner, "#f472b6", 2, "5 4"));
    svg.appendChild(seg(corner, pb, "#34d399", 2, "5 4"));
    svg.appendChild(seg(pa, pb, "#38bdf8", 3.5));
    svg.appendChild(rightAngle(corner, pa, pb, 12));
    svg.appendChild(dot(pa, "#fbbf24", 8));
    svg.appendChild(dot(pb, "#2dd4bf", 8));
    svg.appendChild(labelAway(pa, corner, "A", "#fbbf24", 16));
    svg.appendChild(labelAway(pb, corner, "B", "#2dd4bf", 16));
    svg.appendChild(label(
      { x: (pa.x + corner.x) / 2, y: pa.y + 28 },
      "run = " + Math.abs(dx), "#f472b6", 0, 0
    ));
    svg.appendChild(label(
      { x: corner.x + 10, y: (corner.y + pb.y) / 2 },
      "rise = " + Math.abs(dy), "#34d399", 0, 4
    ));

    km(document.getElementById("slope-formula"),
      "m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{" + dy + "}{" + dx + "} = \\dfrac{3}{4}", true);
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

  function renderSlopeSteep(svg) {
    var labelPos = [
      { x: 4, y: STEEP_LINES[1].m * 4 + STEEP_LINES[1].c },
      { x: -3, y: STEEP_LINES[0].m * (-3) + STEEP_LINES[0].c },
      { x: 5, y: STEEP_LINES[2].m * 5 + STEEP_LINES[2].c },
      { x: -4, y: STEEP_LINES[3].m * (-4) + STEEP_LINES[3].c },
    ];
    STEEP_LINES.forEach(function (L, i) {
      svg.appendChild(lineMC(L.m, L.c, L.col, 3, 1));
      svgTex(svg, toPx(labelPos[i]), L.tex, 100, 32);
    });

    setNote(document.getElementById("slope-note"),
      "<strong>Order slopes from smallest to largest</strong> on the number line — this is <em>not</em> the same as who looks steepest. " +
      "For example, \\(m = -2\\) looks steeper than \\(m = -\\tfrac{1}{2}\\), but \\(-2 < -\\tfrac{1}{2}\\), so \\(-2\\) is the <em>smaller</em> slope value. " +
      "Remember \\(-1 > -100\\) on the number line — a steeper-looking negative slope can still be numerically smaller. " +
      "Drag the four cards into order, then press <em>Check order</em>.");
  }

  function renderSlopeParallel(svg) {
    var m = 0.75;
    var c1 = 1;
    var c2 = -2;
    [-GRID, GRID].forEach(function (x) {
      var p1 = toPx({ x: x, y: m * x + c1 });
      var p2 = toPx({ x: x, y: m * x + c2 });
    });
    var pA = toPx({ x: -GRID, y: m * (-GRID) + c1 });
    var pB = toPx({ x: GRID, y: m * GRID + c1 });
    var pC = toPx({ x: -GRID, y: m * (-GRID) + c2 });
    var pD = toPx({ x: GRID, y: m * GRID + c2 });
    svg.appendChild(seg(pA, pB, "#38bdf8", 3));
    svg.appendChild(seg(pC, pD, "#a78bfa", 3));
    svg.appendChild(label(toPx({ x: 3, y: m * 3 + c1 }), "L₁: m = " + fmt(m), "#38bdf8"));
    svg.appendChild(label(toPx({ x: 3, y: m * 3 + c2 }), "L₂: m = " + fmt(m), "#a78bfa"));

    km(document.getElementById("slope-formula"), "m_1 = m_2 \\Rightarrow \\text{parallel (or the same line if they coincide)}", true);
    setNote(document.getElementById("slope-note"),
      "Same slope \\(\\Rightarrow\\) same steepness. Different \\(y\\)-intercepts \\(\\Rightarrow\\) parallel distinct lines. If they also share a point, they are the same line.");
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

    addLine(m1, "#38bdf8", 4, null, 1);
    svgTex(svg, toPx({ x: 4, y: m1 * 4 }), "L_1:\\; m_1 = \\tfrac{2}{3}", 120, 36);

    if (perpStep === 1) {
      addLine(mRight, "#f87171", 2.5, "10 6", 0.95);
      svgTex(svg, toPx({ x: -5, y: mRight * (-5) }), "L_2:\\; m_2 < 0", 110, 36);
      var o = toPx({ x: 0, y: 0 });
      svg.appendChild(rightAngle(o, toPx({ x: 4, y: m1 * 4 }), toPx({ x: 4, y: mRight * 4 }), 14));
    }
    if (perpStep === 2) {
      addLine(mWrong, "#f87171", 2.5, "10 6", 0.95);
      svgTex(svg, toPx({ x: 5, y: mWrong * 5 }), "m_2 = -\\tfrac{2}{3}\\; \\text{✗}", 130, 36);
    }
    if (perpStep >= 3) {
      addLine(mRight, "#34d399", 4, null, 1);
      svgTex(svg, toPx({ x: -5, y: mRight * (-5) }), "L_2:\\; m_2 = -\\tfrac{3}{2}\\; \\text{✓}", 140, 36);
      var o2 = toPx({ x: 0, y: 0 });
      svg.appendChild(rightAngle(o2, toPx({ x: 4, y: m1 * 4 }), toPx({ x: 4, y: mRight * 4 }), 14));
    }

    var stepLbl = document.getElementById("perp-step-label");
    var prevBtn = document.getElementById("perp-prev");
    var nextBtn = document.getElementById("perp-next");
    if (stepLbl) stepLbl.textContent = "Step " + (perpStep + 1) + " / 4";
    if (prevBtn) prevBtn.disabled = perpStep === 0;
    if (nextBtn) nextBtn.disabled = perpStep === 3;

    if (perpStep === 0) {
      km(document.getElementById("slope-formula"), "m_1 \\times m_2 = -1 \\text{ ?}", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 1.</strong> One line has slope \\(m_1 = \\tfrac{2}{3}\\). " +
        "If another line is perpendicular to it, why should \\(m_1 \\times m_2 = -1\\)? Press <em>Next</em>.");
    } else if (perpStep === 1) {
      km(document.getElementById("slope-formula"), "m_1 > 0 \\Rightarrow m_2 < 0", true);
      setNote(document.getElementById("slope-note"),
        "<strong>Step 2.</strong> The red dashed line is perpendicular to the blue line. " +
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

  function renderSlope() {
    var svg = document.getElementById("slope-svg");
    if (!svg) return;
    clr(svg);
    drawGrid(svg);
    var steepRow = document.getElementById("steep-sort");
    var stepNav = document.getElementById("perp-step-nav");
    if (steepRow) steepRow.classList.toggle("visible", slopeMode === "steep");
    if (stepNav) stepNav.classList.toggle("visible", slopeMode === "perp");
    var formulaEl = document.getElementById("slope-formula");
    if (formulaEl) formulaEl.style.display = slopeMode === "steep" ? "none" : "";
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
    svg.appendChild(seg(pa, pb, "#64748b", 2, "4 4"));
    svg.appendChild(dot(pa, "#fbbf24", 8));
    svg.appendChild(dot(pb, "#2dd4bf", 8));
    var midCorner = toPx({ x: B.x, y: A.y });
    svg.appendChild(labelAway(pa, midCorner, "A(" + A.x + "," + A.y + ")", "#fbbf24", 26));
    svg.appendChild(labelAway(pb, midCorner, "B(" + B.x + "," + B.y + ")", "#2dd4bf", 26));
    svg.appendChild(dragHandle(pa, "ab", 0));
    svg.appendChild(dragHandle(pb, "ab", 1));

    var ratioRow = document.getElementById("mid-ratio-row");
    if (ratioRow) ratioRow.style.display = midMode === "section" ? "flex" : "none";

    if (midMode === "mid") {
      var M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      var pm = toPx(M);
      svg.appendChild(dot(pm, "#a78bfa", 9));
      svg.appendChild(label(pm, "M", "#a78bfa", 12, 4));
      km(document.getElementById("mid-formula"),
        "M = \\left(\\dfrac{" + A.x + "+" + B.x + "}{2},\\; \\dfrac{" + A.y + "+" + B.y + "}{2}\\right) = "
        + pairFracTex(A.x + B.x, 2, A.y + B.y, 2), true);
      setNote(document.getElementById("mid-note"),
        "Mid-point = average of coordinates — same idea as the mean of two numbers. Example: \\(A(1,1)\\) and \\(B(5,4)\\) give \\(M\\left(3,\\,\\tfrac{5}{2}\\right)\\).");
    } else {
      var m = secM;
      var n = secN;
      var P = {
        x: (n * A.x + m * B.x) / (m + n),
        y: (n * A.y + m * B.y) / (m + n),
      };
      var pp = toPx(P);
      svg.appendChild(dot(pp, "#f472b6", 9));
      svg.appendChild(label(pp, "P", "#f472b6", 12, 4));
      var pxNum = n * A.x + m * B.x;
      var pyNum = n * A.y + m * B.y;
      var den = m + n;
      km(document.getElementById("mid-formula"),
        "P = \\left(\\dfrac{" + n + "\\cdot" + A.x + "+" + m + "\\cdot" + B.x + "}{" + den + "},\\; "
        + "\\dfrac{" + n + "\\cdot" + A.y + "+" + m + "\\cdot" + B.y + "}{" + den + "}\\right) = "
        + pairFracTex(pxNum, den, pyNum, den), true);
      setNote(document.getElementById("mid-note"),
        "Ratio \\(m:n\\) from \\(A\\) means \\(AP:PB = m:n\\). Weight \\(B\\) by \\(m\\) and \\(A\\) by \\(n\\), then divide by \\(m+n\\) — a weighted average. When \\(m = n\\) you get the mid-point.");
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
      g.appendChild(seg(a, b, col || "#fbbf24", 2));
    }
    return g;
  }

  function halfSideTicks(p1, m, p2, count) {
    var g = E("g", {});
    g.appendChild(hashMarks(p1, m, 0.5, count, "#fbbf24", 9));
    g.appendChild(hashMarks(m, p2, 0.5, count, "#fbbf24", 9));
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
        fill: "none", stroke: "#fbbf24", "stroke-width": 1.6,
      }));
      g.appendChild(E("path", {
        d: shortArcPath(V, mid2, aQ, r),
        fill: "none", stroke: "#fbbf24", "stroke-width": 1.6,
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
      fill: col || "#e2e8f0", "font-size": 14, "font-weight": 700,
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
      fill: "rgba(56,189,248,.08)", stroke: "#e2e8f0", "stroke-width": 2.5,
    }));

    var labelOff = [
      { dx: 0, dy: -18 },
      { dx: -28, dy: 24 },
      { dx: 20, dy: 20 },
    ];
    ["A", "B", "C"].forEach(function (name, i) {
      svg.appendChild(dot(px[i], ["#fbbf24", "#2dd4bf", "#a78bfa"][i], 7));
      svg.appendChild(label(
        { x: px[i].x + labelOff[i].dx, y: px[i].y + labelOff[i].dy },
        name, "#e2e8f0", 0, 0
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
        svg.appendChild(seg(px[i], { x: I.x, y: I.y }, "#a78bfa", 2, "6 4"));
        svg.appendChild(bisectorArcMarks(vi, v[(i + 1) % 3], v[(i + 2) % 3], I, arcPlan[i], 16));
      });
      var r = distPointToSeg(I, v[0], v[1]);
      svg.appendChild(E("circle", {
        cx: I.x, cy: I.y, r: r,
        fill: "none", stroke: "#34d399", "stroke-width": 2,
      }));
      svg.appendChild(dot({ x: I.x, y: I.y }, "#34d399", 7));
      svg.appendChild(label({ x: I.x + 12, y: I.y - 10 }, "I", "#34d399", 0, 0));
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
          svg.appendChild(seg(O, onCircle, "#f87171", 2, "7 5"));
          markRightAt(M, { x: M.x + unit(p, q).x * 18, y: M.y + unit(p, q).y * 18 }, onCircle, 10);
          svg.appendChild(halfSideTicks(p, M, q, sideTicks[sideIdx]));
        });
        svg.appendChild(E("circle", {
          cx: O.x, cy: O.y, r: rad,
          fill: "none", stroke: "#f87171", "stroke-width": 2,
        }));
        svg.appendChild(dot({ x: O.x, y: O.y }, "#f87171", 8));
        svg.appendChild(labelAway(O, G, "O", "#f87171", 18));
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
        svg.appendChild(seg(px[i], M, "#fbbf24", 2.5));
        svg.appendChild(dot(M, "#64748b", 4));
        svg.appendChild(halfSideTicks(p1, M, p2, sideTicks[sideIdx]));
      });
      svg.appendChild(dot({ x: G.x, y: G.y }, "#fbbf24", 7));
      svg.appendChild(label({ x: G.x + 12, y: G.y + 4 }, "G", "#fbbf24", 0, 0));
      km(document.getElementById("cent-formula"), "\\text{Centroid } G", true);
      setNote(document.getElementById("cent-note"),
        "\\(G\\) = intersection of the three <strong>medians 中線</strong>. " +
        "Matching half-ticks on each side mark the mid-point; \\(1/2/3\\) counts show the three sides have different lengths. Divides each median \\(2:1\\) from the vertex.");
    } else {
      v.forEach(function (vi, i) {
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        var F = footOnLine(vi, v[j], v[k]);
        svg.appendChild(seg(px[i], F, "#38bdf8", 2.5));
        markRightAt(F, px[i], v[j], 10);
      });
      if (H) {
        svg.appendChild(dot({ x: H.x, y: H.y }, "#2dd4bf", 8));
        svg.appendChild(labelAway(H, G, "H", "#2dd4bf", 18));
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
      el.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (drag == null) return;
      var p = clampGrid(fromPx(pt(e, svg)));
      if (key === "ab") {
        if (drag === 0) A = p; else B = p;
      } else if (key === "abc") {
        /* centres are static */
      }
      renderActive();
    });
    svg.addEventListener("pointerup", function () { drag = null; });
    svg.addEventListener("pointercancel", function () { drag = null; });
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
      var sr = document.getElementById("steep-sort");
      if (sr) sr.classList.toggle("visible", id === "steep");
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

    ["dist-svg", "slope-svg", "mid-svg"].forEach(function (id) {
      var svg = document.getElementById(id);
      if (!svg) return;
      bindSvgDrag(svg, "ab");
    });

    var perpPrev = document.getElementById("perp-prev");
    var perpNext = document.getElementById("perp-next");
    if (perpPrev) perpPrev.addEventListener("click", function () {
      if (perpStep > 0) { perpStep--; renderSlope(); }
    });
    if (perpNext) perpNext.addEventListener("click", function () {
      if (perpStep < 3) { perpStep++; renderSlope(); }
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
