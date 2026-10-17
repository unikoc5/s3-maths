(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var INK = "#e2e8f0";
  var MEAN = "#fbbf24";
  var MEDIAN = "#34d399";
  var MODE = "#f472b6";
  var MUTED = "#64748b";
  var INPUT_MIN = 0;
  var INPUT_MAX = 20; /* keep the playground readable on one line */
  var BAR_MAX_H = 100;
  var DEFAULT_DATA = [0, 1, 3, 4, 5, 7, 7, 8, 10];
  var LINE_LO = 0;
  var LINE_HI = 12;

  var LABS = [
    { id: "averages", label: "Mean · Median · Mode" },
    { id: "transform", label: "Shift & stretch" },
  ];

  var MISSIONS = {
    sandbox: {
      title: "Sandbox",
      goal: "Freestyle — drop and drag dots. Watch the triangle (mean) slide as you move mass.",
      start: function () { avgData = DEFAULT_DATA.slice(); },
      check: function () { return null; },
    },
    mean6: {
      title: "Mission: mean = 6",
      goal: "Arrange any data so the mean is exactly 6 (median can be anything).",
      start: function () { avgData = [4, 5, 8]; },
      check: function () {
        var m = mean(avgData);
        if (m == null) return false;
        return Math.abs(m - 6) < 0.051;
      },
    },
    split: {
      title: "Mission: split the averages",
      goal: "Make |mean − median| ≥ 2 so students see how an extreme value pulls the mean.",
      start: function () { avgData = [3, 4, 5, 5, 6]; },
      check: function () {
        if (avgData.length < 3) return false;
        return Math.abs(mean(avgData) - median(avgData)) >= 2;
      },
    },
    mode3: {
      title: "Mission: mode = 3",
      goal: "Make 3 the unique mode (it must appear more often than every other value).",
      start: function () { avgData = [1, 2, 4, 5]; },
      check: function () {
        var mo = modeValue(avgData);
        return mo === 3;
      },
    },
    outlier: {
      title: "Mission: survive an outlier",
      goal: "Keep the median at 5 while the mean is at least 8 — one large value is enough.",
      start: function () { avgData = [3, 4, 5, 6, 7]; },
      check: function () {
        if (avgData.length < 3) return false;
        return Math.abs(median(avgData) - 5) < 0.051 && mean(avgData) >= 8;
      },
    },
  };

  var activeMission = "sandbox";
  var dragState = null;
  var suppressClick = false;
  var numlineBound = null;

  var WEIGHT_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fb7185"];
  var WEIGHT_ROWS = [
    { label: "Song", mark: 59, weight: 45 },
    { label: "Scale", mark: 47, weight: 25 },
    { label: "Arpeggio", mark: 52, weight: 10 },
    { label: "Sight-reading", mark: 63, weight: 20 },
  ];

  var TRANSFORM_PRESETS = {
    notes: [3, 4, 4, 4, 7, 7, 12, 14, 16, 17],
    exam: [62, 55, 45, 72, 26, 75, 97, 85, 85, 52, 63, 75],
    custom: [2, 4, 6, 8],
  };

  var SCENARIOS = [
    {
      title: "Favourite bread vote",
      text: "Customers vote for their favourite bread type (categories, not numbers). Which average finds the most popular choice?",
      data: "Wholemeal · White · Wholemeal · Sourdough · Wholemeal · Rye · White · Wholemeal",
      answer: "mode",
      explain: "Mode — we want the most frequent category, not a numeric average.",
    },
    {
      title: "Daily rainfall in May",
      text: "Daily rainfall amounts (mm). Which average gives a typical daily rainfall?",
      data: "3.2, 0, 5.1, 12.4, 2.8, 0, 8.6, 4.1, 1.5, 6.3, 3.0, 7.2 mm",
      answer: "mean",
      explain: "Mean — numeric measurements without strong skew; the mean balances all days.",
    },
    {
      title: "Tourist heights",
      text: "Heights of tourists in a group (cm). Which average best reflects a typical height?",
      data: "130, 133, 139, 141, 142, 143, 145, 148, 150, 182, 188",
      answer: "median",
      explain: "Median — two very tall tourists pull the mean up; the median stays near the main group.",
    },
    {
      title: "Rice cooker prices",
      text: "Prices ($) of rice cookers in a shop. Which average best reflects a typical price?",
      data: "358, 542, 610, 655, 712, 2123, 2800, 3180, 4320",
      answer: "median",
      explain: "Median — a few very high prices skew the mean upward.",
    },
    {
      title: "Set-meal prices",
      text: "Prices ($) of set meals. The manager claims the average price is $70. Which average supports this claim?",
      data: "30, 30, 30, 45, 95, 120, 140, 150",
      answer: "median",
      explain: "Median = $70 exactly — the manager’s claim matches the median, not the mean ($77.5).",
    },
    {
      title: "Repeated high values",
      text: "Can the mode reflect the centre well?",
      data: "25, 27, 33, 37, 49, 51, 53, 59, 59, 69, 69, 69",
      twoStep: true,
      answerNo: "no",
      answerSecond: "median",
      explainNo: "Mode is 69 at the high end — it does not sit near the centre.",
      explainYes: "The mode (69) is at the high end, not near the middle of the data.",
      explainSecond: "Median (~52) sits in the middle of the ordered list.",
    },
  ];

  var avgData = [];
  var weightRows = WEIGHT_ROWS.map(function (r) {
    return { label: r.label, mark: r.mark, weight: r.weight };
  });
  var transformBase = sortedCopy(TRANSFORM_PRESETS.notes);
  var transformAdd = 0;
  var transformMul = 1;
  var outlierQuizPick = null;
  var scenariosReady = false;

  function mean(arr) {
    if (!arr.length) return null;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return null;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function modeValue(arr) {
    if (!arr.length) return null;
    var freq = {};
    arr.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; });
    var best = 0;
    var modes = [];
    Object.keys(freq).forEach(function (k) {
      var f = freq[k];
      var num = +k;
      if (f > best) { best = f; modes = [num]; }
      else if (f === best) modes.push(num);
    });
    if (best <= 1) return null;
    return modes.length > 1 ? modes : modes[0];
  }

  function fmtMode(m) {
    if (m == null) return "—";
    if (Array.isArray(m)) return m.map(fmt).join(", ");
    return fmt(m);
  }

  function fmt(x) {
    if (x == null) return "—";
    if (typeof x === "string") return x;
    return (Math.round(x * 100) / 100).toFixed(2).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function sortedCopy(arr) {
    return arr.slice().sort(function (a, b) { return a - b; });
  }

  function clampInput(v) {
    if (!isFinite(v)) return null;
    return Math.max(INPUT_MIN, Math.min(INPUT_MAX, Math.round(v)));
  }

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function typeset(root) {
    if (!root || !window.renderMathInElement) return;
    window.renderMathInElement(root, {
      delimiters: [{ left: "\\(", right: "\\)", display: false }],
      throwOnError: false,
    });
  }


  function lineRange(data) {
    var hi = LINE_HI;
    var lo = LINE_LO;
    if (data.length) {
      hi = Math.max(LINE_HI, Math.max.apply(null, data) + 1);
      lo = Math.min(LINE_LO, Math.min.apply(null, data));
    }
    return { lo: lo, hi: hi };
  }

  /** Triangle tip sits on the number line (no extra beam). */
  function drawFulcrum(svg, mx, yLine, label) {
    var tipY = yLine; /* tip shares the axis y — visually kisses the stroke */
    var baseY = yLine + 18;
    svg.appendChild(E("polygon", {
      points: (mx - 10) + "," + baseY + " " + (mx + 10) + "," + baseY + " " + mx + "," + tipY,
      fill: "#f59e0b", stroke: "#d97706", "stroke-width": 1,
    }));
    if (label) {
      var t = E("text", {
        x: mx, y: baseY + 14, fill: "#b45309", "font-size": 10, "font-weight": 800, "text-anchor": "middle",
      });
      t.textContent = label;
      svg.appendChild(t);
    }
  }

  function drawNumline(svgId, data, opts) {
    opts = opts || {};
    var svg = document.getElementById(svgId);
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var range = lineRange(data);
    var lo = range.lo;
    var hi = range.hi;
    var x0 = 36;
    var x1 = 684;
    var yAxis = 98;

    function xScale(v) {
      if (hi === lo) return (x0 + x1) / 2;
      return x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    }
    function xToValue(px) {
      if (hi === lo) return lo;
      var t = (px - x0) / (x1 - x0);
      return lo + t * (hi - lo);
    }

    numlineBound = { svg: svg, x0: x0, x1: x1, lo: lo, hi: hi, xScale: xScale, xToValue: xToValue };

    svg.appendChild(E("rect", {
      x: x0 - 8, y: yAxis - 40, width: (x1 - x0) + 16, height: 72,
      fill: "transparent", class: "track-hit",
    }));

    svg.appendChild(E("line", {
      x1: x0, y1: yAxis, x2: x1, y2: yAxis,
      stroke: "#334155", "stroke-width": 2.5,
    }));

    var ticks = {};
    var tickStep = niceStep(hi - lo);
    var t0 = Math.ceil(lo / tickStep) * tickStep;
    for (var t = t0; t <= hi + 0.001; t += tickStep) ticks[fmt(t)] = t;
    ticks["0"] = 0;
    Object.keys(ticks).map(function (k) { return ticks[k]; }).sort(function (a, b) { return a - b; })
      .forEach(function (tv) {
        var tx = xScale(tv);
        svg.appendChild(E("line", {
          x1: tx, y1: yAxis - 5, x2: tx, y2: yAxis + 5,
          stroke: tv === 0 ? "#94a3b8" : "#475569",
          "stroke-width": tv === 0 ? 1.5 : 1,
        }));
        var lbl = E("text", {
          x: tx, y: yAxis + 18, fill: tv === 0 ? "#0f172a" : MUTED,
          "font-size": tv === 0 ? 11 : 10, "font-weight": tv === 0 ? 700 : 400,
          "text-anchor": "middle",
        });
        lbl.textContent = fmt(tv);
        svg.appendChild(lbl);
      });

    var m = data.length ? mean(data) : null;
    var mx = m != null ? xScale(m) : (x0 + x1) / 2;

    if (!data.length) {
      var empty = E("text", {
        x: 360, y: 48, fill: MUTED, "font-size": 14, "text-anchor": "middle",
      });
      empty.textContent = "Click the line to drop your first value";
      svg.appendChild(empty);
      drawFulcrum(svg, mx, yAxis, null);
      return;
    }

    var stack = {};
    data.forEach(function (v, idx) {
      var key = String(v);
      if (!stack[key]) stack[key] = [];
      stack[key].push(idx);
    });

    Object.keys(stack).forEach(function (key) {
      var v = +key;
      var idxs = stack[key];
      var cx = xScale(v);
      idxs.forEach(function (dataIdx, i) {
        var cy = yAxis - 16 - i * 12;
        var c = E("circle", {
          cx: cx, cy: cy, r: 7,
          fill: "#38bdf8", stroke: "#0284c7", "stroke-width": 1.4,
          class: "dot-hit",
          "data-index": String(dataIdx),
        });
        svg.appendChild(c);
      });
    });

    var med = median(data);
    var mod = modeValue(data);
    var mdx = xScale(med);
    var meanDx = 0;
    var medDx = 0;
    if (Math.abs(mx - mdx) < 28) {
      meanDx = -16;
      medDx = 16;
    }

    drawMarker(svg, mx, MEAN, "mean", meanDx, 18, yAxis);
    drawMarker(svg, mdx, MEDIAN, "median", medDx, 18, yAxis);
    if (mod != null) {
      var modX = Array.isArray(mod)
        ? xScale(mod.reduce(function (a, b) { return a + b; }, 0) / mod.length)
        : xScale(mod);
      var modDx = 0;
      if (Math.abs(modX - mx) < 24) modDx = 22;
      else if (Math.abs(modX - mdx) < 24) modDx = -22;
      drawMarker(svg, modX, MODE, "mode", modDx, 18, yAxis);
    }

    drawFulcrum(svg, mx, yAxis, "mean " + fmt(m));
  }

  /** Twin number lines for outlier story (before | after) */
  function drawOutlierStory() {
    var svg = document.getElementById("outlier-viz");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var before = [2, 4, 6, 8];
    var after = [2, 4, 6, 8, 20];
    drawMiniBalance(svg, before, 16, 348, "before");
    drawMiniBalance(svg, after, 372, 704, "after");
    svg.appendChild(E("line", {
      x1: 360, y1: 14, x2: 360, y2: 136, stroke: "#cbd5e1", "stroke-width": 1, "stroke-dasharray": "4 3",
    }));
  }

  function drawMiniBalance(svg, data, xL, xR, tag) {
    var lo = 0;
    var hi = 20;
    var yAxis = 78;
    function xs(v) { return xL + 14 + ((v - lo) / (hi - lo)) * ((xR - xL) - 28); }
    var m = mean(data);
    var med = median(data);
    var mx = xs(m);
    var title = E("text", {
      x: (xL + xR) / 2, y: 14, fill: "#475569", "font-size": 11, "font-weight": 800, "text-anchor": "middle",
    });
    title.textContent = tag === "after" ? "After +20" : "Before";
    svg.appendChild(title);
    [0, 5, 10, 15, 20].forEach(function (tv) {
      var tx = xs(tv);
      svg.appendChild(E("line", { x1: tx, y1: yAxis - 4, x2: tx, y2: yAxis + 4, stroke: "#94a3b8", "stroke-width": 1 }));
      var tl = E("text", { x: tx, y: yAxis + 16, fill: MUTED, "font-size": 8, "text-anchor": "middle" });
      tl.textContent = String(tv);
      svg.appendChild(tl);
    });
    svg.appendChild(E("line", {
      x1: xL + 8, y1: yAxis, x2: xR - 8, y2: yAxis,
      stroke: "#334155", "stroke-width": 2,
    }));
    data.forEach(function (v, i) {
      var cx = xs(v);
      var order = data.slice(0, i).filter(function (x) { return x === v; }).length;
      var cy = yAxis - 14 - order * 11;
      var isOut = v >= 20;
      svg.appendChild(E("circle", {
        cx: cx, cy: cy, r: isOut ? 8 : 6,
        fill: isOut ? "#f87171" : "#38bdf8",
        stroke: isOut ? "#dc2626" : "#0284c7", "stroke-width": 1.2,
      }));
      if (isOut) {
        var ot = E("text", {
          x: cx, y: cy - 12, fill: "#dc2626", "font-size": 9, "font-weight": 800, "text-anchor": "middle",
        });
        ot.textContent = "20";
        svg.appendChild(ot);
      }
    });
    var medX = xs(med);
    svg.appendChild(E("line", {
      x1: medX, y1: 28, x2: medX, y2: yAxis,
      stroke: "#34d399", "stroke-width": 1.5, "stroke-dasharray": "3 2",
    }));
    var medT = E("text", {
      x: medX, y: 26, fill: "#0d9488", "font-size": 9, "font-weight": 700, "text-anchor": "middle",
    });
    medT.textContent = "median " + fmt(med);
    svg.appendChild(medT);
    drawFulcrum(svg, mx, yAxis, "mean " + fmt(m));
  }

  function drawMarker(svg, x, col, label, labelDx, topY, endY) {
    labelDx = labelDx || 0;
    topY = topY || 22;
    endY = endY == null ? 98 : endY;
    svg.appendChild(E("line", {
      x1: x, y1: topY + 4, x2: x, y2: endY,
      stroke: col, "stroke-width": 2, "stroke-dasharray": "4 3",
    }));
    var t = E("text", {
      x: x + labelDx, y: topY, fill: col, "font-size": 10, "font-weight": 700, "text-anchor": "middle",
    });
    t.textContent = label;
    svg.appendChild(t);
  }

  function clientToSvgX(svg, clientX) {
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse()).x;
  }

  function bindNumlineInteractions() {
    var svg = document.getElementById("avg-numline");
    if (!svg || svg.dataset.bound === "1") return;
    svg.dataset.bound = "1";

    svg.addEventListener("pointerdown", function (e) {
      if (!numlineBound) return;
      var target = e.target;
      if (target && target.classList && target.classList.contains("dot-hit")) {
        var idx = +target.getAttribute("data-index");
        if (!isFinite(idx)) return;
        dragState = { index: idx, pointerId: e.pointerId };
        svg.classList.add("dragging");
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
        return;
      }
    });

    svg.addEventListener("pointermove", function (e) {
      if (!dragState || e.pointerId !== dragState.pointerId || !numlineBound) return;
      var sx = clientToSvgX(svg, e.clientX);
      if (sx == null) return;
      var v = clampInput(Math.round(numlineBound.xToValue(sx)));
      if (v == null) return;
      if (avgData[dragState.index] !== v) {
        avgData[dragState.index] = v;
        renderAverages();
      }
    });

    function endDrag(e) {
      if (!dragState || (e && e.pointerId !== dragState.pointerId)) return;
      suppressClick = true;
      dragState = null;
      svg.classList.remove("dragging");
    }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    svg.addEventListener("click", function (e) {
      if (suppressClick) { suppressClick = false; return; }
      if (dragState) return;
      var target = e.target;
      if (target && target.classList && target.classList.contains("dot-hit")) return;
      if (!numlineBound) return;
      var sx = clientToSvgX(svg, e.clientX);
      if (sx == null || sx < numlineBound.x0 - 4 || sx > numlineBound.x1 + 4) return;
      var v = clampInput(Math.round(numlineBound.xToValue(sx)));
      if (v == null) return;
      avgData.push(v);
      renderAverages();
    });

    svg.addEventListener("dblclick", function (e) {
      var target = e.target;
      if (!target || !target.classList || !target.classList.contains("dot-hit")) return;
      var idx = +target.getAttribute("data-index");
      if (!isFinite(idx)) return;
      avgData.splice(idx, 1);
      renderAverages();
      e.preventDefault();
    });
  }

  function setMission(id) {
    if (!MISSIONS[id]) id = "sandbox";
    activeMission = id;
    var m = MISSIONS[id];
    m.start();
    document.querySelectorAll("#mission-bar .chip-mission").forEach(function (b) {
      b.classList.toggle("active", b.dataset.mission === id);
    });
    var hud = document.getElementById("mission-hud");
    var title = document.getElementById("mission-title");
    var goal = document.getElementById("mission-goal");
    if (hud && title && goal) {
      hud.classList.add("show");
      hud.classList.remove("ok");
      title.textContent = m.title;
      goal.textContent = m.goal;
    }
    renderAverages();
  }

  function updateMissionHud() {
    var m = MISSIONS[activeMission];
    var hud = document.getElementById("mission-hud");
    var goal = document.getElementById("mission-goal");
    if (!m || !hud || !goal) return;
    var ok = m.check();
    if (ok === null) {
      hud.classList.remove("ok");
      goal.textContent = m.goal;
      return;
    }
    if (ok) {
      hud.classList.add("ok");
      goal.textContent = "Cleared! " + m.goal + "  ·  Try another mission or keep playing.";
    } else {
      hud.classList.remove("ok");
      goal.textContent = m.goal + "  ·  Current mean " + fmt(mean(avgData)) +
        ", median " + fmt(median(avgData)) + ", mode " + fmtMode(modeValue(avgData)) + ".";
    }
  }

  function niceStep(range) {
    if (range <= 10) return 1;
    if (range <= 30) return 5;
    if (range <= 80) return 10;
    if (range <= 200) return 20;
    return 50;
  }

  function dataInBarRange(data) {
    if (!data.length) return false;
    return data.every(function (v) {
      return v >= 0 && v <= 10 && v === Math.round(v);
    });
  }

  function freqMapFromData(data) {
    var map = [];
    for (var i = 0; i <= 10; i++) map.push({ value: i, freq: 0 });
    data.forEach(function (v) { map[v].freq += 1; });
    return map;
  }

  function renderAvgBarChart() {
    var section = document.getElementById("avg-bar-section");
    var svg = document.getElementById("avg-bar-chart");
    if (!section || !svg) return;

    if (!dataInBarRange(avgData)) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var rows = freqMapFromData(avgData);
    var maxF = 1;
    rows.forEach(function (r) { maxF = Math.max(maxF, r.freq); });

    var n = rows.length;
    var slotW = 48;
    var barW = 30;
    var totalW = n * slotW;
    var startX = (640 - totalW) / 2;
    var chartBottom = 118;

    rows.forEach(function (r, i) {
      var h = maxF ? (r.freq / maxF) * BAR_MAX_H : 0;
      var cx = startX + i * slotW + slotW / 2;
      var bx = cx - barW / 2;
      var by = chartBottom - h;
      var isMode = r.freq > 1 && r.freq === maxF;
      if (r.freq > 0) {
        svg.appendChild(E("rect", {
          x: bx, y: by, width: barW, height: h,
          fill: isMode ? MODE : "#38bdf8", rx: 3,
        }));
        var ft = E("text", {
          x: cx, y: by - 4,
          fill: INK, "font-size": 10, "text-anchor": "middle",
        });
        ft.textContent = r.freq;
        svg.appendChild(ft);
      }
      var lbl = E("text", {
        x: cx, y: chartBottom + 14,
        fill: INK, "font-size": 11, "font-weight": 700, "text-anchor": "middle",
      });
      lbl.textContent = r.value;
      svg.appendChild(lbl);
    });
  }

  function renderChips(containerId, data, onRemove) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = "";
    var indexed = data.map(function (v, i) { return { v: v, i: i }; });
    indexed.sort(function (a, b) { return a.v - b.v || a.i - b.i; });
    indexed.forEach(function (item) {
      var c = document.createElement("span");
      c.className = "data-chip";
      c.textContent = item.v;
      c.title = "Click to remove";
      c.addEventListener("click", function () { onRemove(item.i); });
      box.appendChild(c);
    });
  }

  function renderStatPills(containerId, stats) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = "";
    [
      { key: "mean", cls: "mean", label: "Mean" },
      { key: "median", cls: "median", label: "Median" },
      { key: "mode", cls: "mode", label: "Mode" },
    ].forEach(function (item) {
      var p = document.createElement("span");
      p.className = "stat-pill " + item.cls;
      var val = item.key === "mode" ? fmtMode(stats.mode) : fmt(stats[item.key]);
      p.textContent = item.label + ": " + val;
      box.appendChild(p);
    });
  }

  function renderAverages() {
    renderChips("avg-chips", avgData, function (i) {
      avgData.splice(i, 1);
      renderAverages();
    });
    drawNumline("avg-numline", avgData);
    renderAvgBarChart();
    document.getElementById("avg-mean").textContent = fmt(mean(avgData));
    document.getElementById("avg-median").textContent = fmt(median(avgData));
    document.getElementById("avg-mode").textContent = fmtMode(modeValue(avgData));
    document.getElementById("avg-n").textContent = avgData.length;

    var note = document.getElementById("avg-note");
    if (!avgData.length) {
      note.textContent = "Click the number line to drop dots. The triangle under the line is the mean.";
    } else if (Math.abs(mean(avgData) - median(avgData)) >= 2) {
      note.textContent = "Mean and median have split — an extreme value is pulling the triangle (mean) away from the middle.";
    } else if (modeValue(avgData) != null) {
      note.textContent = "Mode is the tallest stack. Drag dots together to build a mode, or pull one far away to tip the mean.";
    } else {
      note.textContent = "No repeated value yet — mode is undefined. Stack two identical dots to create one.";
    }
    updateMissionHud();
  }

  function weightedMean(rows) {
    var sum = 0;
    var wsum = 0;
    rows.forEach(function (r) {
      sum += r.mark * r.weight;
      wsum += r.weight;
    });
    if (!wsum) return { mean: null, sum: 0, wsum: 0 };
    return { mean: sum / wsum, sum: sum, wsum: wsum };
  }

  function syncLastWeight() {
    var sum3 = weightRows[0].weight + weightRows[1].weight + weightRows[2].weight;
    if (sum3 > 100) {
      /* trim the row that just grew — keep first three ≤ 100 */
      var over = sum3 - 100;
      for (var i = 2; i >= 0 && over > 0; i--) {
        var cut = Math.min(weightRows[i].weight, over);
        weightRows[i].weight -= cut;
        over -= cut;
      }
      sum3 = weightRows[0].weight + weightRows[1].weight + weightRows[2].weight;
    }
    weightRows[3].weight = Math.max(0, 100 - sum3);
  }

  function renderWeightShareBar() {
    var bar = document.getElementById("weight-share");
    var labs = document.getElementById("weight-share-labels");
    if (!bar || !labs) return;
    bar.innerHTML = "";
    labs.innerHTML = "";
    var total = weightRows.reduce(function (s, r) { return s + r.weight; }, 0);
    weightRows.forEach(function (row, i) {
      if (row.weight <= 0) return;
      var pct = total ? (row.weight / total) * 100 : 0;
      var col = WEIGHT_COLORS[i % WEIGHT_COLORS.length];
      var lab = document.createElement("span");
      lab.style.flex = "0 0 " + pct + "%";
      lab.style.color = col;
      lab.textContent = pct >= 8 ? row.label : "";
      lab.title = row.label + " " + row.weight + "%";
      labs.appendChild(lab);
      var seg = document.createElement("div");
      seg.className = "seg";
      seg.style.flex = "0 0 " + pct + "%";
      seg.style.background = col;
      seg.title = row.label + ": mark " + row.mark + ", " + row.weight + "%";
      if (pct >= 12) seg.textContent = String(row.mark);
      bar.appendChild(seg);
    });
  }

  function renderWeightedMean() {
    var host = document.getElementById("weight-blocks");
    if (!host) return;
    syncLastWeight();
    host.innerHTML = "";
    var maxW = Math.max.apply(null, weightRows.map(function (r) { return r.weight; }).concat([1]));
    weightRows.forEach(function (row, idx) {
      var wrap = document.createElement("div");
      wrap.className = "weight-row";
      var name = document.createElement("span");
      name.className = "w-name";
      name.textContent = row.label;
      name.style.color = WEIGHT_COLORS[idx % WEIGHT_COLORS.length];
      var barWrap = document.createElement("div");
      barWrap.className = "w-bar-wrap";
      barWrap.title = row.weight + "%";
      var bar = document.createElement("div");
      bar.className = "w-bar";
      bar.style.width = Math.max(8, (row.weight / maxW) * 100) + "%";
      bar.style.background = WEIGHT_COLORS[idx % WEIGHT_COLORS.length];
      bar.textContent = row.mark + "";
      barWrap.appendChild(bar);
      var markIn = document.createElement("input");
      markIn.type = "number";
      markIn.min = "0";
      markIn.max = "100";
      markIn.value = row.mark;
      markIn.setAttribute("aria-label", row.label + " score");
      markIn.addEventListener("input", function () {
        row.mark = Math.max(0, Math.min(100, Math.round(+markIn.value) || 0));
        markIn.value = row.mark;
        renderWeightedMean();
      });
      var wIn = document.createElement("input");
      wIn.type = "number";
      wIn.min = "0";
      wIn.max = "100";
      wIn.value = row.weight;
      wIn.setAttribute("aria-label", row.label + " weight %");
      if (idx === 3) {
        wIn.readOnly = true;
        wIn.className = "w-locked";
        wIn.title = "100% minus the other three";
      } else {
        wIn.addEventListener("input", function () {
          row.weight = Math.max(0, Math.min(100, Math.round(+wIn.value) || 0));
          renderWeightedMean();
        });
      }
      wrap.appendChild(name);
      wrap.appendChild(barWrap);
      wrap.appendChild(markIn);
      wrap.appendChild(wIn);
      host.appendChild(wrap);
    });

    var wm = weightedMean(weightRows);
    var meanEl = document.getElementById("weight-mean");
    var wsumEl = document.getElementById("weight-wsum");
    if (meanEl) meanEl.textContent = fmt(wm.mean);
    if (wsumEl) wsumEl.textContent = fmt(wm.wsum) + "%";
    var note = document.getElementById("weight-formula");
    if (note) {
      var heaviest = weightRows.slice().sort(function (a, b) { return b.weight - a.weight; })[0];
      note.textContent = heaviest && heaviest.weight
        ? ("Overall score sits under the triangle. “" + heaviest.label +
          "” currently has the largest share — change a score or weight and watch it move.")
        : "Set the first three weights; the last fills the rest to 100%.";
    }
    renderWeightShareBar();
    drawWeightBalance(wm);
  }

  /** Scores on a number line; triangle at the overall mean touches the line */
  function drawWeightBalance(wm) {
    var svg = document.getElementById("weight-viz");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var x0 = 36;
    var x1 = 684;
    var yAxis = 72;
    var lo = 0;
    var hi = 100;
    function xs(v) { return x0 + ((v - lo) / (hi - lo)) * (x1 - x0); }

    svg.appendChild(E("line", {
      x1: x0, y1: yAxis, x2: x1, y2: yAxis,
      stroke: "#334155", "stroke-width": 2.2,
    }));
    [0, 25, 50, 75, 100].forEach(function (tv) {
      var tx = xs(tv);
      svg.appendChild(E("line", { x1: tx, y1: yAxis - 5, x2: tx, y2: yAxis + 5, stroke: "#94a3b8", "stroke-width": 1 }));
      var tl = E("text", { x: tx, y: yAxis + 18, fill: MUTED, "font-size": 10, "text-anchor": "middle" });
      tl.textContent = String(tv);
      svg.appendChild(tl);
    });

    weightRows.forEach(function (row, i) {
      if (!row.weight) return;
      var cx = xs(row.mark);
      var r = 6 + Math.sqrt(row.weight) * 0.9;
      var cy = yAxis - 14 - (i % 2) * 2;
      svg.appendChild(E("circle", {
        cx: cx, cy: cy, r: r,
        fill: WEIGHT_COLORS[i % WEIGHT_COLORS.length], stroke: "#0f172a", "stroke-width": 1,
      }));
      var lab = E("text", {
        x: cx, y: cy - r - 4, fill: WEIGHT_COLORS[i % WEIGHT_COLORS.length],
        "font-size": 9, "font-weight": 700, "text-anchor": "middle",
      });
      lab.textContent = row.label;
      svg.appendChild(lab);
    });

    var mx = wm.mean != null ? xs(wm.mean) : (x0 + x1) / 2;
    drawFulcrum(svg, mx, yAxis, wm.mean != null ? ("overall " + fmt(wm.mean)) : null);
  }

  function renderScenarios() {
    if (scenariosReady) return;
    scenariosReady = true;
    var list = document.getElementById("scenario-list");
    if (!list) return;

    SCENARIOS.forEach(function (sc, si) {
      var card = document.createElement("div");
      card.className = "scenario-card";
      card.innerHTML =
        "<h3>" + (si + 1) + ". " + sc.title + "</h3>" +
        "<p>" + sc.text + "</p>" +
        "<div class=\"scenario-data\">" + sc.data + "</div>" +
        "<div class=\"count-row scenario-btns\"></div>" +
        "<p class=\"feedback scenario-fb\">Choose an answer.</p>";

      var row = card.querySelector(".scenario-btns");
      var fb = card.querySelector(".scenario-fb");
      var step2 = null;

      if (sc.twoStep) {
        var fb2 = null;
        ["Yes", "No"].forEach(function (label) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.textContent = label;
          b.addEventListener("click", function () {
            row.querySelectorAll(".btn").forEach(function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            if (step2) { step2.remove(); step2 = null; }
            if (fb2) { fb2.remove(); fb2 = null; }
            var ans = label.toLowerCase();
            if (ans === "yes") {
              fb.className = "feedback bad scenario-fb";
              fb.textContent = sc.explainYes;
              return;
            }
            fb.className = "feedback ok scenario-fb";
            fb.textContent = "Correct — mode does not reflect the centre well.";
            step2 = document.createElement("div");
            step2.className = "scenario-step2";
            step2.innerHTML = "<p class=\"split-hint\">Which average best reflects the centre?</p>";
            var row2 = document.createElement("div");
            row2.className = "count-row";
            [{ id: "mean", label: "Mean" }, { id: "median", label: "Median" }].forEach(function (opt) {
              var b2 = document.createElement("button");
              b2.type = "button";
              b2.className = "btn";
              b2.textContent = opt.label;
              b2.addEventListener("click", function () {
                row2.querySelectorAll(".btn").forEach(function (x) { x.classList.remove("active"); });
                b2.classList.add("active");
                if (!fb2) {
                  fb2 = document.createElement("p");
                  fb2.className = "feedback scenario-fb2";
                  step2.appendChild(fb2);
                }
                if (opt.id === sc.answerSecond) {
                  fb2.className = "feedback ok scenario-fb2";
                  fb2.textContent = "Correct — " + sc.explainSecond;
                } else {
                  fb2.className = "feedback bad scenario-fb2";
                  fb2.textContent = "Not quite — " + sc.explainSecond;
                }
              });
              row2.appendChild(b2);
            });
            step2.appendChild(row2);
            card.appendChild(step2);
          });
          row.appendChild(b);
        });
      } else {
        [{ id: "mean", label: "Mean" }, { id: "median", label: "Median" }, { id: "mode", label: "Mode" }].forEach(function (opt) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.textContent = opt.label;
          b.addEventListener("click", function () {
            row.querySelectorAll(".btn").forEach(function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            if (opt.id === sc.answer) {
              fb.className = "feedback ok scenario-fb";
              fb.textContent = "Correct — " + sc.explain;
            } else {
              fb.className = "feedback bad scenario-fb";
              fb.textContent = "Not quite — " + sc.explain;
            }
          });
          row.appendChild(b);
        });
      }
      list.appendChild(card);
    });
  }

  function applyTransform(arr) {
    return sortedCopy(arr.map(function (v) { return v * transformMul + transformAdd; }));
  }

  function statsObj(arr) {
    return { mean: mean(arr), median: median(arr), mode: modeValue(arr) };
  }

  function renderTransform() {
    renderChips("transform-chips", transformBase, function (i) {
      transformBase.splice(i, 1);
      renderTransform();
    });
    document.getElementById("transform-add-val").textContent =
      transformAdd >= 0 ? "+" + transformAdd : String(transformAdd);
    document.getElementById("transform-mul-val").textContent = "×" + fmt(transformMul);

    var afterData = applyTransform(transformBase);
    var orig = statsObj(transformBase);
    var transformed = statsObj(afterData);
    renderStatPills("transform-orig", orig);
    renderStatPills("transform-new", transformed);
    drawTransformTwin(transformBase, afterData, orig, transformed);

    var note = document.getElementById("transform-note");
    if (transformAdd !== 0 && transformMul === 1) {
      note.textContent = "Everyone got a " + (transformAdd >= 0 ? "+" : "") + transformAdd +
        " bonus — the whole cloud slid sideways. Mean, median and mode each moved by the same amount.";
    } else if (transformMul !== 1 && transformAdd === 0) {
      note.textContent = "Every score was stretched by ×" + fmt(transformMul) +
        " — gaps grew or shrank together. Mean, median and mode each scaled the same way.";
    } else if (transformAdd !== 0 || transformMul !== 1) {
      note.textContent = "First stretch (×" + fmt(transformMul) + "), then bonus (" +
        (transformAdd >= 0 ? "+" : "") + transformAdd + "). Both number lines tell the same story.";
    } else {
      note.textContent = "Move the sliders — watch the after-line slide or stretch. The three averages ride along with the dots.";
    }
  }

  /** Twin number lines: before (left) vs after (right) — 具像化 shift/stretch */
  function drawTransformTwin(before, after, so, sn) {
    var svg = document.getElementById("transform-viz");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var all = before.concat(after);
    if (!all.length) {
      var empty = E("text", { x: 360, y: 72, fill: MUTED, "font-size": 14, "text-anchor": "middle" });
      empty.textContent = "Pick a sample set above";
      svg.appendChild(empty);
      return;
    }
    var lo = Math.min.apply(null, all);
    var hi = Math.max.apply(null, all);
    var pad = Math.max(2, (hi - lo) * 0.12);
    lo = Math.floor(lo - pad);
    hi = Math.ceil(hi + pad);
    if (hi <= lo) { lo -= 1; hi += 1; }

    drawTransformHalf(svg, before, so, 16, 340, lo, hi, "Before");
    drawTransformHalf(svg, after, sn, 380, 704, lo, hi, "After");
    svg.appendChild(E("line", {
      x1: 348, y1: 72, x2: 368, y2: 72,
      stroke: "#0284c7", "stroke-width": 2.5,
    }));
    svg.appendChild(E("polygon", {
      points: "368,66 380,72 368,78", fill: "#0284c7",
    }));
  }

  function drawTransformHalf(svg, data, stats, xL, xR, lo, hi, title) {
    var y = 78;
    function xs(v) {
      if (hi === lo) return (xL + xR) / 2;
      return xL + 12 + ((v - lo) / (hi - lo)) * ((xR - xL) - 24);
    }
    var ttl = E("text", {
      x: (xL + xR) / 2, y: 14, fill: "#475569", "font-size": 11, "font-weight": 800, "text-anchor": "middle",
    });
    ttl.textContent = title;
    svg.appendChild(ttl);
    svg.appendChild(E("line", {
      x1: xL + 8, y1: y, x2: xR - 8, y2: y,
      stroke: "#334155", "stroke-width": 2,
    }));
    var step = niceStep(hi - lo);
    var t0 = Math.ceil(lo / step) * step;
    for (var t = t0; t <= hi + 0.001; t += step) {
      var tx = xs(t);
      svg.appendChild(E("line", { x1: tx, y1: y - 4, x2: tx, y2: y + 4, stroke: "#94a3b8", "stroke-width": 1 }));
      var tl = E("text", { x: tx, y: y + 16, fill: MUTED, "font-size": 8, "text-anchor": "middle" });
      tl.textContent = fmt(t);
      svg.appendChild(tl);
    }
    var stack = {};
    data.forEach(function (v) {
      var key = String(v);
      if (!stack[key]) stack[key] = 0;
      stack[key] += 1;
      var order = stack[key] - 1;
      var cx = xs(v);
      var cy = y - 14 - order * 11;
      svg.appendChild(E("circle", {
        cx: cx, cy: cy, r: 6,
        fill: "#38bdf8", stroke: "#0284c7", "stroke-width": 1.2,
      }));
    });
    if (stats.median != null) {
      var mdx = xs(stats.median);
      svg.appendChild(E("line", {
        x1: mdx, y1: 32, x2: mdx, y2: y,
        stroke: MEDIAN, "stroke-width": 1.5, "stroke-dasharray": "3 2",
      }));
    }
    if (stats.mean != null) {
      var mx = xs(stats.mean);
      var mt = E("text", { x: mx, y: 26, fill: "#b45309", "font-size": 9, "font-weight": 800, "text-anchor": "middle" });
      mt.textContent = "mean " + fmt(stats.mean);
      svg.appendChild(mt);
      drawFulcrum(svg, mx, y, null);
    }
  }

  function showLab(id) {
    document.querySelectorAll("#panel-tools .lab").forEach(function (lab) {
      lab.classList.toggle("active", lab.id === "lab-" + id);
    });
    document.querySelectorAll("#jm31-lab-nav .chip").forEach(function (c) {
      c.classList.toggle("active", c.dataset.lab === id);
    });
    if (id === "averages") {
      renderAverages();
      renderWeightedMean();
    }
    if (id === "transform") renderTransform();
  }

  function addToAvg(v) {
    v = clampInput(v);
    if (v == null) return;
    avgData.push(v);
    renderAverages();
  }

  function init() {
    var nav = document.getElementById("jm31-lab-nav");
    LABS.forEach(function (lab, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (i === 0 ? " active" : "");
      b.dataset.lab = lab.id;
      b.textContent = lab.label;
      b.addEventListener("click", function () { showLab(lab.id); });
      nav.appendChild(b);
    });

    document.getElementById("avg-add").addEventListener("click", function () {
      addToAvg(+document.getElementById("avg-in").value);
      document.getElementById("avg-in").value = "5";
    });
    document.getElementById("avg-in").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("avg-add").click();
    });
    document.getElementById("avg-default").addEventListener("click", function () {
      setMission("sandbox");
    });
    document.getElementById("avg-clear").addEventListener("click", function () {
      avgData = [];
      renderAverages();
    });

    document.querySelectorAll("#mission-bar .chip-mission").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMission(btn.dataset.mission);
      });
    });
    bindNumlineInteractions();

    document.getElementById("more-questions-btn").addEventListener("click", function () {
      var panel = document.getElementById("more-questions-panel");
      var open = panel.classList.toggle("open");
      this.textContent = open ? "Hide questions" : "More questions";
      if (open) renderScenarios();
      if (open) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.querySelectorAll("[data-tpreset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        transformBase = sortedCopy(TRANSFORM_PRESETS[btn.dataset.tpreset]);
        transformAdd = 0;
        transformMul = 1;
        document.getElementById("transform-add").value = "0";
        document.getElementById("transform-mul").value = "1";
        renderTransform();
      });
    });
    document.getElementById("transform-add").addEventListener("input", function (e) {
      transformAdd = +e.target.value;
      renderTransform();
    });
    document.getElementById("transform-mul").addEventListener("input", function (e) {
      transformMul = +e.target.value;
      renderTransform();
    });

    document.querySelectorAll("[data-oans]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        outlierQuizPick = btn.dataset.oans;
        document.querySelectorAll("[data-oans]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var fb = document.getElementById("outlier-fb");
        if (outlierQuizPick === "mean") {
          fb.className = "feedback ok";
          fb.textContent = "Correct — the mean jumps toward the outlier; the median moves much less.";
        } else {
          fb.className = "feedback bad";
          fb.textContent = "The mean is pulled strongly by the outlier.";
        }
      });
    });

    setMission("sandbox");
    renderWeightedMean();
    drawOutlierStory();
    renderTransform();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
