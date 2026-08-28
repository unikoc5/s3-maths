(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var data = [];
  var meanBefore = null;
  var quizPick = null;

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
  function mode(arr) {
    if (!arr.length) return null;
    var freq = {};
    arr.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; });
    var best = 0, modes = [];
    Object.keys(freq).forEach(function (k) {
      var f = freq[k];
      if (f > best) { best = f; modes = [+k]; }
      else if (f === best) modes.push(+k);
    });
    if (best === 1) return "none";
    return modes.length > 1 ? modes.join(", ") : String(modes[0]);
  }
  function fmt(x) {
    if (x == null) return "—";
    if (typeof x === "string") return x;
    return Math.round(x * 100) / 100;
  }

  function renderChips() {
    var box = document.getElementById("stat-chips");
    box.innerHTML = "";
    data.forEach(function (v, i) {
      var c = document.createElement("span");
      c.className = "data-chip";
      c.textContent = v;
      c.title = "Click to remove";
      c.addEventListener("click", function () { data.splice(i, 1); render(); });
      box.appendChild(c);
    });
  }

  function renderChart() {
    var svg = document.getElementById("stat-chart");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!data.length) return;
    var max = Math.max.apply(null, data);
    var w = 360 / data.length;
    data.forEach(function (v, i) {
      var h = max ? (v / max) * 90 : 0;
      var rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", 20 + i * w);
      rect.setAttribute("y", 110 - h);
      rect.setAttribute("width", Math.max(8, w - 6));
      rect.setAttribute("height", h);
      rect.setAttribute("fill", v >= 50 ? "#f87171" : "#38bdf8");
      rect.setAttribute("rx", 4);
      svg.appendChild(rect);
    });
    var m = mean(data);
    if (m != null && max) {
      var y = 110 - (m / max) * 90;
      var line = document.createElementNS(NS, "line");
      line.setAttribute("x1", 15);
      line.setAttribute("x2", 385);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#fbbf24");
      line.setAttribute("stroke-width", 2);
      line.setAttribute("stroke-dasharray", "5 3");
      svg.appendChild(line);
    }
  }

  function render() {
    renderChips();
    renderChart();
    document.getElementById("stat-mean").textContent = fmt(mean(data));
    document.getElementById("stat-median").textContent = fmt(median(data));
    document.getElementById("stat-mode").textContent = fmt(mode(data));
    document.getElementById("stat-n").textContent = data.length;
    var insight = document.getElementById("stat-insight");
    if (data.some(function (v) { return v >= 50; })) {
      insight.textContent = "Outlier detected — median stays more stable than the mean.";
    } else if (data.length) {
      insight.textContent = "Yellow dashed line shows the mean on the bar chart.";
    } else {
      insight.textContent = "Mean uses every value; median resists outliers.";
    }
  }

  function addVal(v) {
    if (!isFinite(v)) return;
    data.push(Math.round(v));
    render();
  }

  function init() {
    document.getElementById("stat-add").addEventListener("click", function () {
      addVal(+document.getElementById("stat-in").value);
      document.getElementById("stat-in").value = "";
    });
    document.getElementById("stat-in").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("stat-add").click();
    });
    document.getElementById("stat-sample").addEventListener("click", function () {
      data = [2, 4, 6, 8];
      meanBefore = mean(data);
      render();
    });
    document.getElementById("stat-outlier").addEventListener("click", function () {
      if (!data.length) data = [2, 4, 6, 8];
      if (meanBefore == null) meanBefore = mean(data);
      addVal(100);
    });
    document.getElementById("stat-clear").addEventListener("click", function () {
      data = []; meanBefore = null; quizPick = null; render();
    });

    document.querySelectorAll("[data-ans]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        quizPick = btn.dataset.ans;
        document.querySelectorAll("[data-ans]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
    });
    document.getElementById("stat-quiz-check").addEventListener("click", function () {
      var fb = document.getElementById("stat-quiz-fb");
      if (!data.some(function (v) { return v >= 50; })) {
        fb.className = "feedback bad";
        fb.textContent = "Click “Add outlier 100” first.";
        return;
      }
      if (quizPick === "mean") {
        fb.className = "feedback ok";
        fb.textContent = "Correct — the mean jumps toward 100; the median moves much less.";
      } else if (quizPick) {
        fb.className = "feedback bad";
        fb.textContent = "The mean is pulled strongly by the outlier.";
      } else {
        fb.className = "feedback bad";
        fb.textContent = "Pick mean or median.";
      }
    });

    data = [2, 4, 6, 8];
    meanBefore = mean(data);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
