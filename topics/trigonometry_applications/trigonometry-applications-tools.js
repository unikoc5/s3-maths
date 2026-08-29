(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var d = 20, angle = 35;
  var svg;

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function rad(deg) { return deg * Math.PI / 180; }
  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1); }

  function renderKatex(root) {
    if (window.renderMathInElement && root) {
      window.renderMathInElement(root, {
        delimiters: [{ left: "\\(", right: "\\)", display: false }, { left: "\\[", right: "\\]", display: true }],
      });
    }
  }

  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var th = rad(angle);
    var scale = 6;
    var h = d * Math.tan(th);
    var gx = 60, gy = 280;
    var bx = gx + d * scale;
    var by = gy - h * scale;

    svg.appendChild(E("rect", { x: bx - 40, y: by, width: 80, height: gy - by, fill: "#d4c4b0", stroke: "#8a7a62", "stroke-width": 2 }));
    svg.appendChild(E("line", { x1: gx, y1: gy, x2: bx, y2: gy, stroke: "#5a6b74", "stroke-width": 2 }));
    svg.appendChild(E("line", { x1: gx, y1: gy, x2: bx, y2: by, stroke: "#0f7a7a", "stroke-width": 3, "stroke-dasharray": "8 4" }));
    svg.appendChild(E("line", { x1: bx, y1: gy, x2: bx, y2: by, stroke: "#db2777", "stroke-width": 2 }));

    svg.appendChild(E("circle", { cx: gx, cy: gy, r: 8, fill: "#fbbf24" }));
    var eye = E("text", { x: gx - 8, y: gy + 24, fill: "#fbbf24", "font-size": 13, "font-weight": 700 });
    eye.textContent = "You";
    svg.appendChild(eye);

    svg.appendChild(E("path", {
      d: "M " + (gx + 40) + " " + gy + " A 40 40 0 0 0 " + (gx + 40 * Math.cos(th)) + " " + (gy - 40 * Math.sin(th)),
      fill: "none", stroke: "#fbbf24", "stroke-width": 2,
    }));
    var al = E("text", { x: gx + 52, y: gy - 12, fill: "#fbbf24", "font-size": 14, "font-weight": 700 });
    al.textContent = "θ";
    svg.appendChild(al);

    var dl = E("text", { x: (gx + bx) / 2, y: gy + 22, fill: "#5a6b74", "font-size": 14 });
    dl.textContent = "d = " + d + " m";
    svg.appendChild(dl);
    var hl = E("text", { x: bx + 12, y: (gy + by) / 2, fill: "#f472b6", "font-size": 14, "font-weight": 700 });
    hl.textContent = "h = " + fmt(h) + " m";
    svg.appendChild(hl);

    document.getElementById("elev-d-val").textContent = d + " m";
    document.getElementById("elev-a-val").textContent = angle + "°";
    document.getElementById("elev-h").textContent = fmt(h) + " m";
    document.getElementById("elev-tan").textContent = fmt(Math.tan(th));
    var form = document.getElementById("elev-formula");
    form.textContent = "h = " + d + " \\times \\tan " + angle + "^\\circ = " + fmt(h) + "\\text{ m}";
    renderKatex(form);
    renderKatex(document.getElementById("panel-tools"));
  }

  function init() {
    svg = document.getElementById("elev-svg");
    document.getElementById("elev-d").addEventListener("input", function (e) { d = +e.target.value; render(); });
    document.getElementById("elev-a").addEventListener("input", function (e) { angle = +e.target.value; render(); });
    document.getElementById("elev-setup").addEventListener("click", function () {
      d = 10; angle = 30;
      document.getElementById("elev-d").value = 10;
      document.getElementById("elev-a").value = 30;
      render();
    });
    document.getElementById("elev-check-btn").addEventListener("click", function () {
      var fb = document.getElementById("elev-check-fb");
      var v = String(document.getElementById("elev-check-in").value).trim().replace(/\s/g, "");
      if (v === "5.8" || v === "5.77" || v === "5.7") {
        fb.className = "feedback ok";
        fb.textContent = "Correct — h = 10 × tan 30° ≈ 5.8 m.";
      } else {
        fb.className = "feedback bad";
        fb.textContent = "h = 10 × 0.577 ≈ 5.8 m.";
      }
    });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
