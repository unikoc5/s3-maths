(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var INK = "#1e2a32";
  var MEAN = "#d97706";
  var MEDIAN = "#0d9488";
  var MODE = "#db2777";
  var MUTED = "#5a6b74";
  var INPUT_MIN = 0;
  var INPUT_MAX = 999;
  var BAR_MAX_H = 100;
  var DEFAULT_DATA = [0, 1, 3, 4, 5, 7, 7, 8, 10];

  var LABS = [
    { id: "averages", label: "Mean · Median · Mode" },
    { id: "transform", label: "+ / × constant" },
  ];

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


  function drawNumline(svgId, data, opts) {
    opts = opts || {};
    var svg = document.getElementById(svgId);
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!data.length) {
      var empty = E("text", {
        x: 320, y: 55, fill: MUTED, "font-size": 14, "text-anchor": "middle",
      });
      empty.textContent = "Add data to see the number line";
      svg.appendChild(empty);
      return;
    }

    var dataMax = Math.max.apply(null, data);
    var dataMin = Math.min.apply(null, data);
    var lo = Math.min(0, dataMin);
    var hi = dataMax;
    if (lo < 0) lo -= Math.max(2, Math.abs(lo) * 0.05);
    var x0 = 36;
    var x1 = 604;
    var yAxis = 72;

    function xScale(v) {
      if (hi === lo) return (x0 + x1) / 2;
      return x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    }

    svg.appendChild(E("line", {
      x1: x0, y1: yAxis, x2: x1, y2: yAxis,
      stroke: "#8a9aa3", "stroke-width": 2,
    }));

    var ticks = {};
    var tickStep = niceStep(hi - lo);
    var t0 = Math.ceil(lo / tickStep) * tickStep;
    for (var t = t0; t <= hi + 0.001; t += tickStep) ticks[fmt(t)] = t;
    ticks["0"] = 0;
    ticks[String(dataMax)] = dataMax;

    Object.keys(ticks).map(function (k) { return ticks[k]; }).sort(function (a, b) { return a - b; })
      .forEach(function (tv) {
        var tx = xScale(tv);
        svg.appendChild(E("line", {
          x1: tx, y1: yAxis - 4, x2: tx, y2: yAxis + 4,
          stroke: tv === 0 ? "#8a9aa3" : "#5a6b74",
          "stroke-width": tv === 0 ? 1.5 : 1,
        }));
        var lbl = E("text", {
          x: tx, y: yAxis + 16, fill: tv === 0 ? INK : MUTED,
          "font-size": tv === 0 ? 11 : 10, "font-weight": tv === 0 ? 700 : 400,
          "text-anchor": "middle",
        });
        lbl.textContent = fmt(tv);
        svg.appendChild(lbl);
      });

    var groups = {};
    data.forEach(function (v) {
      var key = String(v);
      groups[key] = (groups[key] || 0) + 1;
    });

    Object.keys(groups).forEach(function (key) {
      var v = +key;
      var count = groups[key];
      var cx = xScale(v);
      for (var i = 0; i < count; i++) {
        var cy = yAxis - 14 - i * 11;
        svg.appendChild(E("circle", {
          cx: cx, cy: cy, r: 5,
          fill: opts.outlier && v >= 50 ? "#e85d4c" : "#0d9488",
          stroke: "#0f7a7a", "stroke-width": 1.2,
        }));
      }
    });

    var m = mean(data);
    var med = median(data);
    var mod = modeValue(data);

    var mx = xScale(m);
    var mdx = xScale(med);
    var meanDx = 0;
    var medDx = 0;
    if (Math.abs(mx - mdx) < 28) {
      meanDx = -16;
      medDx = 16;
    }

    drawMarker(svg, mx, MEAN, "mean", meanDx);
    drawMarker(svg, mdx, MEDIAN, "median", medDx);
    if (mod != null) {
      var modX = Array.isArray(mod)
        ? xScale(mod.reduce(function (a, b) { return a + b; }, 0) / mod.length)
        : xScale(mod);
      var modDx = 0;
      if (Math.abs(modX - mx) < 24) modDx = 22;
      else if (Math.abs(modX - mdx) < 24) modDx = -22;
      drawMarker(svg, modX, MODE, "mode", modDx);
    }
  }

  function drawMarker(svg, x, col, label, labelDx) {
    labelDx = labelDx || 0;
    svg.appendChild(E("line", {
      x1: x, y1: 22, x2: x, y2: 58,
      stroke: col, "stroke-width": 2, "stroke-dasharray": "4 3",
    }));
    var t = E("text", {
      x: x + labelDx, y: 14, fill: col, "font-size": 10, "font-weight": 700, "text-anchor": "middle",
    });
    t.textContent = label;
    svg.appendChild(t);
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
          fill: isMode ? MODE : "#0d9488", rx: 3,
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
      note.textContent = "Mean uses every datum; median resists extreme values; mode is the most frequent value.";
    } else if (avgData.some(function (v) { return v >= 50; }) || Math.abs(mean(avgData) - median(avgData)) > 8) {
      note.textContent = "Skewed or outlier present — compare mean and median. Mode highlights the most repeated value.";
    } else {
      note.textContent = "Mean and median are often close here. Check whether any value repeats for the mode.";
    }
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

  function renderWeightedMean() {
    var table = document.getElementById("weight-table");
    if (!table) return;
    table.innerHTML = "";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Component</th><th>Mark</th><th>Weight (%)</th><th>Mark × weight</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    weightRows.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + row.label + "</td><td></td><td></td><td>" + (row.mark * row.weight) + "</td>";
      var markIn = document.createElement("input");
      markIn.type = "number";
      markIn.min = "0";
      markIn.max = "100";
      markIn.value = row.mark;
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
      wIn.addEventListener("input", function () {
        row.weight = Math.max(0, Math.min(100, Math.round(+wIn.value) || 0));
        wIn.value = row.weight;
        renderWeightedMean();
      });
      tr.children[1].appendChild(markIn);
      tr.children[2].appendChild(wIn);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var wm = weightedMean(weightRows);
    document.getElementById("weight-mean").textContent = fmt(wm.mean);
    document.getElementById("weight-sum").textContent = fmt(wm.sum);
    document.getElementById("weight-wsum").textContent = fmt(wm.wsum);
    var parts = weightRows.map(function (r) { return r.weight + "%×" + r.mark; });
    document.getElementById("weight-formula").textContent =
      "Weighted mean = (" + parts.join(" + ") + ") ÷ " + wm.wsum + "%";
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
    document.getElementById("transform-mul-val").textContent = fmt(transformMul);

    var orig = statsObj(transformBase);
    var transformed = statsObj(applyTransform(transformBase));
    renderStatPills("transform-orig", orig);
    renderStatPills("transform-new", transformed);

    var note = document.getElementById("transform-note");
    if (transformAdd !== 0 && transformMul === 1) {
      note.textContent = "Adding " + transformAdd + " shifts mean, median and mode each by " + transformAdd + ".";
    } else if (transformMul !== 1 && transformAdd === 0) {
      note.textContent = "Multiplying by " + fmt(transformMul) + " scales mean, median and mode each by the same factor.";
    } else if (transformAdd !== 0 || transformMul !== 1) {
      note.textContent = "Each average follows: ×" + fmt(transformMul) + " then " + (transformAdd >= 0 ? "+" : "") + transformAdd + ".";
    } else {
      note.textContent = "Move the sliders — +c shifts all three averages by c; ×k scales all three by k.";
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
      document.getElementById("avg-in").value = "0";
    });
    document.getElementById("avg-in").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("avg-add").click();
    });
    document.getElementById("avg-default").addEventListener("click", function () {
      avgData = DEFAULT_DATA.slice();
      renderAverages();
    });
    document.getElementById("avg-clear").addEventListener("click", function () {
      avgData = [];
      renderAverages();
    });

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

    renderAverages();
    renderWeightedMean();
    renderTransform();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
