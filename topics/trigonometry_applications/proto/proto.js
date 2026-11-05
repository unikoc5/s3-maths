/* JM35 Laser Vault — the Prism Heart heist.
 * Four chapters of randomised trigonometry rounds: rooftops, gallery, mirror vault and harbour escape.
 */
(function () {
  "use strict";

  var stage = document.getElementById("lvp-stage");
  var tabsEl = document.getElementById("lvp-tabs");
  if (!stage) return;
  // Resolved from the script URL because the game is mounted from two different pages.
  var ART = ((document.currentScript && document.currentScript.src) || "").replace(/proto\/proto\.js(\?.*)?$/, "game/");

  var NS = "http://www.w3.org/2000/svg";
  var DEG = Math.PI / 180;
  var C = { cy: "#22e3ff", gd: "#ffc65a", ok: "#3ef0a0", rd: "#ff4d5e", ink: "#e8f4ff", mut: "#9db4cc" };
  var FR = { x: 36, y: 36, w: 848, h: 648 };   // scene frame left of the panel

  function sind(x) { return Math.sin(x * DEG); }
  function cosd(x) { return Math.cos(x * DEG); }
  function tand(x) { return Math.tan(x * DEG); }
  function atand(r) { return Math.atan(r) / DEG; }
  function fx(x, d) { var p = Math.pow(10, d); return (Math.round(x * p) / p).toFixed(d); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function parseNum(s) {
    var t = String(s == null ? "" : s).trim().replace(/[°º\s]/g, "").replace(/(km|min|m)$/i, "");
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  function parseBearing(s) {
    var t = String(s || "").toUpperCase().replace(/[°º\s]/g, "");
    var m = t.match(/^([NS])(\d+(?:\.\d+)?)([EW])$/);
    if (m) {
      var a = parseFloat(m[2]);
      if (a > 90) return NaN;
      if (m[1] === "N" && m[3] === "E") return a;
      if (m[1] === "S" && m[3] === "E") return 180 - a;
      if (m[1] === "S") return 180 + a;
      return (360 - a) % 360;
    }
    var v = parseNum(t);
    return v >= 0 && v < 360 ? v : NaN;
  }

  /* SVG helpers --------------------------------------------------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function sv(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function txt(parent, x, y, s, o) {
    o = o || {};
    var t = sv("text", {
      x: x, y: y, "text-anchor": o.anchor || "middle", fill: o.fill || C.ink,
      "font-size": o.size || 17, "font-weight": o.weight || 700, class: o.cls, "letter-spacing": o.ls,
    }, parent);
    t.textContent = s;
    return t;
  }

  function line(parent, a, b, stroke, w, dash, extra) {
    var at = { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: stroke, "stroke-width": w || 2, "stroke-dasharray": dash, "stroke-linecap": "round" };
    for (var k in extra || {}) at[k] = extra[k];
    return sv("line", at, parent);
  }

  function arc(parent, c, r, a0, a1, stroke, w) {
    var p0 = { x: c.x + r * Math.cos(a0 * DEG), y: c.y + r * Math.sin(a0 * DEG) };
    var p1 = { x: c.x + r * Math.cos(a1 * DEG), y: c.y + r * Math.sin(a1 * DEG) };
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    return sv("path", { d: "M" + p0.x + " " + p0.y + " A" + r + " " + r + " 0 " + large + " " + sweep + " " + p1.x + " " + p1.y, fill: "none", stroke: stroke, "stroke-width": w || 2.5 }, parent);
  }

  function dimV(parent, x, y0, y1, label, side) {
    var g = sv("g", { opacity: .9 }, parent);
    line(g, { x: x, y: y0 }, { x: x, y: y1 }, C.mut, 1.5);
    line(g, { x: x - 6, y: y0 }, { x: x + 6, y: y0 }, C.mut, 1.5);
    line(g, { x: x - 6, y: y1 }, { x: x + 6, y: y1 }, C.mut, 1.5);
    txt(g, x + (side || 1) * 10, (y0 + y1) / 2 + 6, label, { anchor: (side || 1) > 0 ? "start" : "end", size: 16 });
  }

  function dimH(parent, x0, x1, y, label) {
    var g = sv("g", { opacity: .9 }, parent);
    line(g, { x: x0, y: y }, { x: x1, y: y }, C.mut, 1.5);
    line(g, { x: x0, y: y - 6 }, { x: x0, y: y + 6 }, C.mut, 1.5);
    line(g, { x: x1, y: y - 6 }, { x: x1, y: y + 6 }, C.mut, 1.5);
    txt(g, (x0 + x1) / 2, y + 22, label, { size: 16 });
  }

  function grad(defs, id, stops, o) {
    o = o || {};
    var g = sv(o.radial ? "radialGradient" : "linearGradient", o.radial
      ? { id: id, cx: o.cx == null ? "50%" : o.cx, cy: o.cy == null ? "50%" : o.cy, r: o.r == null ? "50%" : o.r, gradientUnits: o.units }
      : { id: id, x1: o.x1 || "0", y1: o.y1 || "0", x2: o.x2 == null ? "0" : o.x2, y2: o.y2 == null ? "1" : o.y2, gradientUnits: o.units }, defs);
    stops.forEach(function (s) { sv("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] }, g); });
    return g;
  }

  function glowFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd || 4, result: "b" }, f);
    var m = sv("feMerge", {}, f);
    sv("feMergeNode", { in: "b" }, m);
    sv("feMergeNode", { in: "b" }, m);
    sv("feMergeNode", { in: "SourceGraphic" }, m);
  }

  function blurFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd }, f);
  }

  function noiseFilter(defs, id, freq, op) {
    var f = sv("filter", { id: id }, defs);
    sv("feTurbulence", { type: "fractalNoise", baseFrequency: freq || .9, numOctaves: 3, seed: 7, result: "n" }, f);
    sv("feColorMatrix", { in: "n", type: "saturate", values: "0", result: "g" }, f);
    var ct = sv("feComponentTransfer", { in: "g", result: "a" }, f);
    sv("feFuncA", { type: "linear", slope: op || .12 }, ct);
    sv("feBlend", { in: "SourceGraphic", in2: "a", mode: "overlay" }, f);
  }

  function frame(parent, fill) {
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16, fill: fill }, parent);
  }
  function frameEdge(parent) {
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16, fill: "none", stroke: "rgba(34,227,255,.22)", "stroke-width": 1.5 }, parent);
    // vignette
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16, fill: "url(#lvp-vig)", "pointer-events": "none" }, parent);
  }
  function clipped(parent, id) {
    var cp = sv("clipPath", { id: id }, parent);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16 }, cp);
    return sv("g", { "clip-path": "url(#" + id + ")" }, parent);
  }

  function compass(parent, x, y) {
    var g = sv("g", { opacity: .9 }, parent);
    sv("circle", { cx: x, cy: y, r: 24, fill: "rgba(5,10,20,.55)", stroke: "rgba(232,244,255,.25)" }, g);
    sv("path", { d: "M" + x + " " + (y - 20) + " L" + (x + 7) + " " + (y + 4) + " L" + x + " " + y + " Z", fill: C.rd }, g);
    sv("path", { d: "M" + x + " " + (y - 20) + " L" + (x - 7) + " " + (y + 4) + " L" + x + " " + y + " Z", fill: "#fff" }, g);
    sv("path", { d: "M" + x + " " + (y + 20) + " L" + (x + 7) + " " + (y - 4) + " L" + x + " " + y + " Z", fill: "#4a5a74" }, g);
    sv("path", { d: "M" + x + " " + (y + 20) + " L" + (x - 7) + " " + (y - 4) + " L" + x + " " + y + " Z", fill: "#7a8aa4" }, g);
    txt(g, x, y - 28, "N", { size: 14, cls: "nohalo" });
  }

  // Phantom hanging from a rope: hands meet the rope at y = -24, feet at y = 34.
  function phantom(parent, pose) {
    if (pose === "crawl") {
      var w = sv("g", {}, parent);
      phantom(w, "reach").setAttribute("transform", "translate(0,-15) rotate(90)");
      return w;
    }
    var g = sv("g", {}, parent);
    var up = pose !== "stand";
    var rim = "rgba(34,227,255,.55)";
    sv("path", { d: "M-8 -5 C-14 6 -17 20 -15 31 Q0 27 15 31 C17 20 14 6 8 -5 Z", fill: "#0b111d", stroke: rim, "stroke-width": 1 }, g);
    sv("rect", { x: -6.5, y: 12, width: 5.5, height: 20, rx: 2.5, fill: "#1b263b" }, g);
    sv("rect", { x: 1, y: 12, width: 5.5, height: 20, rx: 2.5, fill: "#1b263b" }, g);
    sv("rect", { x: -7.5, y: 30, width: 7, height: 4, rx: 1.5, fill: "#05080f" }, g);
    sv("rect", { x: 0.5, y: 30, width: 7, height: 4, rx: 1.5, fill: "#05080f" }, g);
    sv("path", { d: "M-8 -6 Q0 -9 8 -6 L6.5 14 L-6.5 14 Z", fill: "#202e48", stroke: rim, "stroke-width": 1 }, g);
    sv("rect", { x: -6.5, y: 9, width: 13, height: 2.5, fill: "#0b111d" }, g);
    sv("rect", { x: -1.5, y: 8.5, width: 3, height: 3.5, rx: .8, fill: C.cy, filter: "url(#lvp-glow)" }, g);
    if (up) {
      sv("path", { d: "M-7 -4 L-2.5 -23", stroke: "#202e48", "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, g);
      sv("path", { d: "M7 -4 L2.5 -23", stroke: "#202e48", "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, g);
      sv("circle", { cx: -2.2, cy: -24, r: 2.4, fill: "#e8f0fa" }, g);
      sv("circle", { cx: 2.2, cy: -24, r: 2.4, fill: "#e8f0fa" }, g);
    } else {
      sv("path", { d: "M-7.5 -4 L-10 11", stroke: "#202e48", "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, g);
      sv("path", { d: "M7.5 -4 L10 11", stroke: "#202e48", "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, g);
      sv("circle", { cx: -10.2, cy: 12.5, r: 2.4, fill: "#e8f0fa" }, g);
      sv("circle", { cx: 10.2, cy: 12.5, r: 2.4, fill: "#e8f0fa" }, g);
    }
    sv("circle", { cx: 0, cy: -13, r: 7, fill: "#141d2e", stroke: rim, "stroke-width": 1 }, g);
    sv("ellipse", { cx: 0, cy: -12.5, rx: 4.6, ry: 3.6, fill: "#eef4fb" }, g);
    sv("ellipse", { cx: -1.9, cy: -13, rx: 1.4, ry: .8, fill: "#0b111d" }, g);
    sv("ellipse", { cx: 1.9, cy: -13, rx: 1.4, ry: .8, fill: "#0b111d" }, g);
    sv("circle", { cx: 6.2, cy: -13.5, r: 1.4, fill: C.cy, filter: "url(#lvp-glow)" }, g);
    return g;
  }

  /* ---------------------------------------------------------------- */

  var board = sv("svg", { class: "lvp-board", viewBox: "0 0 1280 720", preserveAspectRatio: "xMidYMid meet" }, stage);
  var panel = el("div", "lvp-panel");
  stage.appendChild(panel);
  var flash = el("div", "lvp-flash");
  stage.appendChild(flash);
  var gen = 0;
  function anim(dur, step, done) {
    var g = gen, t0 = null;
    function f(ts) {
      if (g !== gen) return;
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var stop = step(k) === true;
      if (k < 1 && !stop) requestAnimationFrame(f);
      else if (done) done();
    }
    requestAnimationFrame(f);
  }
  function wait(ms, fn) { var g = gen; setTimeout(function () { if (g === gen) fn(); }, ms); }
  function flashRed() { SFX.alarm(); flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on"); }

  function freshBoard() {
    gen++;
    board.innerHTML = "";
    var defs = sv("defs", {}, board);
    glowFilter(defs, "lvp-glow", 4);
    glowFilter(defs, "lvp-glow-lg", 9);
    blurFilter(defs, "lvp-blur", 6);
    blurFilter(defs, "lvp-blur-lg", 18);
    noiseFilter(defs, "lvp-grain", .8, .1);
    grad(defs, "lvp-vig", [[0.55, "#000", 0], [1, "#000", .55]], { radial: true, r: "75%" });
    return { root: sv("g", {}, board), defs: defs };
  }

  function svgPoint(evt) {
    var pt = board.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(board.getScreenCTM().inverse());
  }

  function draggable(node, onMove, canDrag) {
    node.addEventListener("pointerdown", function (e) {
      if (canDrag && !canDrag()) return;
      e.preventDefault();
      try { node.setPointerCapture(e.pointerId); } catch (err) {}
      var move = function (ev) { onMove(svgPoint(ev)); };
      var up = function () {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
        node.removeEventListener("pointercancel", up);
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
      node.addEventListener("pointercancel", up);
    });
  }

  /* Panel ----------------------------------------------------------- */

  function buildPanel(o) {
    panel.innerHTML =
      '<div class="lvp-kicker">' + o.kicker + "</div>" +
      "<h3>" + o.title + "</h3>" +
      '<p class="lvp-task">' + o.task + "</p>" +
      (o.info ? '<ul class="lvp-info">' + o.info.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="lvp-fields">' + o.fields.map(function (f) {
        return '<label class="lvp-field"><span>' + f.label + (f.sub ? "<small>" + f.sub + "</small>" : "") + "</span>" +
          '<input data-f="' + f.id + '" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="' + (f.ph || "") + '">' +
          "<em>" + (f.unit || "") + "</em></label>";
      }).join("") + "</div>" +
      '<div class="lvp-actions"><button type="button" class="lvp-btn go">' + o.action + "</button>" +
      (o.tries ? '<span class="lvp-tries"></span>' : "") + "</div>" +
      '<div class="lvp-say"></div>' +
      '<ol class="lvp-hints" hidden></ol>' +
      '<div class="lvp-after"><button type="button" class="lvp-btn ghost hint">Hint</button>' +
      '<button type="button" class="lvp-btn ghost snd">' + (audio.muted ? "Sound off" : "Sound on") + "</button>" +
      '<button type="button" class="lvp-btn next" hidden>' + (o.nextLabel || "Next level ▸") + "</button></div>";

    var go = panel.querySelector(".go");
    var say = panel.querySelector(".lvp-say");
    var hintList = panel.querySelector(".lvp-hints");
    var hintBtn = panel.querySelector(".hint");
    var next = panel.querySelector(".next");
    var triesEl = panel.querySelector(".lvp-tries");
    var tries = o.tries || 0;
    var hints = o.hints || [], shown = 0;

    function hintLabel() { hintBtn.textContent = shown < hints.length ? "Hint " + (shown + 1) + "/" + hints.length : "No more hints"; hintBtn.disabled = shown >= hints.length; }
    hintLabel();
    hintBtn.addEventListener("click", function () {
      if (shown >= hints.length) return;
      hintList.appendChild(el("li", null, hints[shown++]));
      hintList.hidden = false;
      hintLabel();
    });
    panel.querySelector(".snd").addEventListener("click", function () { ensureAudio(); setMuted(!audio.muted); });
    go.addEventListener("click", function () { if (!go.disabled) o.onAction(); });
    next.addEventListener("click", function () { if (o.onNext) o.onNext(); });
    Array.prototype.forEach.call(panel.querySelectorAll("input"), function (inp) {
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
    });

    function drawTries() {
      if (!triesEl) return;
      var h = (o.triesLabel || "Tries") + " ";
      for (var i = 0; i < o.tries; i++) h += '<i class="' + (i < tries ? "on" : "") + '"></i>';
      triesEl.innerHTML = h;
    }
    drawTries();

    return {
      input: function (id) { return panel.querySelector('[data-f="' + id + '"]'); },
      val: function (id) { return parseNum(this.input(id).value); },
      raw: function (id) { return this.input(id).value; },
      check: function (ids) {
        for (var i = 0; i < ids.length; i++) {
          var f = o.fields.filter(function (x) { return x.id === ids[i]; })[0];
          var s = this.raw(ids[i]).trim();
          if (!s) return "Fill in " + f.label + ".";
          if (isNaN(this.val(ids[i]))) return f.label + ": “" + s + "” is not a valid number.";
        }
        return "";
      },
      say: function (msg, kind) { say.className = "lvp-say " + (kind || ""); say.textContent = msg; },
      lock: function (b) {
        go.disabled = b;
        Array.prototype.forEach.call(panel.querySelectorAll("input"), function (i) { i.disabled = b; });
      },
      useTry: function () { tries = Math.max(0, tries - 1); drawTries(); return tries; },
      win: function () { next.hidden = false; if (o.onWin) o.onWin(); },
      reroll: function (msg) { if (o.onReroll) o.onReroll(msg); },
    };
  }

  /* Random rounds ---------------------------------------------------- */

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function near(v, target, tol) { return Math.abs(v - target) <= tol; }
  function rel(v, target, pct, min) { return near(v, target, Math.max(min || 0, Math.abs(target) * pct)); }
  function nf(x) { return String(Math.round(x * 100) / 100); }

  /* Shared rooftop scenery ------------------------------------------- */

  function skyDefs(defs) {
    grad(defs, "l1-sky", [[0, "#05070f"], [0.5, "#0b1430"], [1, "#1a2a52"]]);
    grad(defs, "l1-moon", [[0, "#fff8e6", .9], [0.3, "#fff2cc", .35], [1, "#fff2cc", 0]], { radial: true });
    grad(defs, "l1-bld", [[0, "#1b2740"], [1, "#0d1424"]]);
    grad(defs, "l1-hill", [[0, "#142036"], [1, "#07101c"]]);
    grad(defs, "l1-hill2", [[0, "#0d1626"], [1, "#050a12"]]);
    grad(defs, "l1-fog", [[0, "#9fb6d8", 0], [1, "#9fb6d8", .22]]);
  }

  function nightSky(g) {
    var rs = rng(5);
    for (var i = 0; i < 90; i++) sv("circle", { cx: FR.x + rs() * FR.w, cy: FR.y + rs() * FR.h * .6, r: rs() * 1.3 + .3, fill: "#fff", opacity: .3 + rs() * .6 }, g);
    sv("circle", { cx: 720, cy: 120, r: 90, fill: "url(#l1-moon)" }, g);
    sv("circle", { cx: 720, cy: 120, r: 26, fill: "#fff6dc" }, g);
    var rc = rng(3);
    for (var bx = FR.x; bx < FR.x + FR.w; bx += 18) {
      var bh = 40 + rc() * 110;
      sv("rect", { x: bx, y: 600 - bh, width: 14, height: bh, fill: "#0a1222" }, g);
      for (var wy = 606 - bh; wy < 596; wy += 9) if (rc() < .35) sv("rect", { x: bx + 3 + Math.floor(rc() * 2) * 5, y: wy, width: 3, height: 4, fill: "rgba(255,210,140," + (.2 + rc() * .5) + ")" }, g);
    }
    sv("rect", { x: FR.x, y: 560, width: FR.w, height: 130, fill: "url(#l1-fog)" }, g);
  }

  function tower(g, x, y, w, h, glow) {
    sv("rect", { x: x - 2, y: y - 2, width: w + 4, height: h + 4, fill: "rgba(0,0,0,.5)", filter: "url(#lvp-blur)" }, g);
    sv("rect", { x: x, y: y, width: w, height: h, fill: "url(#l1-bld)", stroke: glow ? "rgba(34,227,255,.6)" : "rgba(160,190,230,.25)", "stroke-width": 1.5 }, g);
    for (var wy = y + 14; wy < y + h - 8; wy += 18) for (var wx = x + 10; wx < x + w - 14; wx += 18) sv("rect", { x: wx, y: wy, width: 9, height: 10, fill: "rgba(255,198,90," + (0.08 + ((wx * 7 + wy * 3) % 10) / 28) + ")" }, g);
    line(g, { x: x - 4, y: y }, { x: x + w + 4, y: y }, glow ? C.cy : "#8ba3c4", glow ? 3 : 2, null, glow ? { filter: "url(#lvp-glow)" } : null);
  }

  // A cable that unrolls from a to b, then Phantom slides along it.
  function zipRide(g, a, b, dur, done) {
    var cg = line(g, a, a, "rgba(207,227,245,.35)", 7, null, { filter: "url(#lvp-blur)" });
    var cb = line(g, a, a, "#e6f0ff", 2.5);
    var rider = sv("g", { transform: "translate(" + a.x + "," + (a.y + 6) + ")" }, g);
    sv("line", { x1: 0, y1: 0, x2: 0, y2: 16, stroke: "#cfe3f5", "stroke-width": 2 }, rider);
    sv("rect", { x: -7, y: -5, width: 14, height: 8, rx: 3, fill: "#cfe3f5" }, rider);
    phantom(rider).setAttribute("transform", "translate(0,30) scale(.75)");
    anim(600, function (k) {
      [cg, cb].forEach(function (c) { c.setAttribute("x2", a.x + (b.x - a.x) * k); c.setAttribute("y2", a.y + (b.y - a.y) * k); });
    }, function () {
      anim(dur, function (k) {
        var e = k * k * (3 - 2 * k);
        rider.setAttribute("transform", "translate(" + (a.x + (b.x - a.x) * e) + "," + (a.y + (b.y - a.y) * e + 6) + ")");
      }, function () { if (done) done(rider); });
    });
  }

  function standing(g, x, roofY) {
    var f = phantom(g, "stand");
    f.setAttribute("transform", "translate(" + x + "," + (roofY - 34) + ")");
    return f;
  }

  /* ================================================================
   * Chapter 1 · Round 1 — Zipline over a contour map (inclination)
   * ================================================================ */

  var Z = { SC: 50, Pk: { x: 230, y: 200 }, R: { x: 730, y: 560 } };
  Z.D = dist(Z.Pk, Z.R);
  Z.u = { x: (Z.Pk.x - Z.R.x) / Z.D, y: (Z.Pk.y - Z.R.y) / Z.D };
  Z.contours = [[320, 110], [300, 220], [280, 330], [260, Z.D - 180], [240, 560], [220, 580], [200, 600]];

  function zOnCircle(d, r, side) {
    var ca = clamp((d * d + Z.D * Z.D - r * r) / (2 * d * Z.D), -1, 1);
    var a = Math.acos(ca) * side;
    var ru = { x: Z.u.x * Math.cos(a) - Z.u.y * Math.sin(a), y: Z.u.x * Math.sin(a) + Z.u.y * Math.cos(a) };
    return { x: Z.R.x + d * ru.x, y: Z.R.y + d * ru.y };
  }

  function zFits(p) {
    if (p.x < FR.x + 50 || p.x > FR.x + FR.w - 70 || p.y < FR.y + 50 || p.y > FR.y + FR.h - 50) return false;
    if (p.x < FR.x + 280 && p.y > FR.y + FR.h - 100) return false;
    if (p.x > FR.x + FR.w - 120 && p.y < FR.y + 110) return false;
    if (Math.abs(p.x - Z.R.x) < 100 && p.y > Z.R.y + 15 && p.y < Z.R.y + 85) return false;
    return dist(p, Z.R) >= 80;
  }

  // Exactly one anchor passes both rules; the other two fail for different reasons.
  function genZip() {
    for (var n = 0; n < 300; n++) {
      var roof = pick([130, 140, 150, 160, 170]);
      var cls = { ok: [], steep: [], weak: [] };
      Z.contours.forEach(function (c) {
        var h = c[0], r = c[1], v = h - roof;
        if (v < 30) return;
        for (var k = Math.max(10, Math.ceil((Z.D - r + 12) / Z.SC * 10)); k <= 80; k++) {
          var cm = k / 10, d = cm * Z.SC;
          if (d > Z.D + r - 12) break;
          [1, -1].forEach(function (side) {
            var p = zOnCircle(d, r, side);
            if (!zFits(p)) return;
            var hm = cm * 100, th = atand(v / hm), L = Math.hypot(hm, v);
            var a = { h: h, d: d, cm: cm, p: p, hm: hm, v: v, th: th, L: L };
            if (th >= 12 && th <= 23 && L <= 390) cls.ok.push(a);
            else if (th >= 28 && L <= 400) cls.steep.push(a);
            else if ((th > 2 && th <= 8) || (L >= 412 && th >= 11 && th <= 24)) cls.weak.push(a);
          });
        }
      });
      if (!cls.ok.length || !cls.steep.length || !cls.weak.length) continue;
      for (var m = 0; m < 60; m++) {
        var set = [pick(cls.ok), pick(cls.steep), pick(cls.weak)];
        if (dist(set[0].p, set[1].p) < 90 || dist(set[0].p, set[2].p) < 90 || dist(set[1].p, set[2].p) < 90) continue;
        var good = set[0];
        shuffle(set).forEach(function (a, i) { a.id = "ABC"[i]; });
        return { roof: roof, anchors: set, good: good };
      }
    }
  }

  function levelZip(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var SC = Z.SC, Pk = Z.Pk, R = Z.R, ROOF = P.roof, LMAX = 400, TMIN = 10, TMAX = 25;
    var anchors = P.anchors, contours = Z.contours;
    var bands = ["#3a6a4a", "#35604a", "#2f5747", "#2a4d43", "#25443f", "#203c3a", "#1b3435", "#172d32"];

    grad(defs, "l1-sea", [[0, "#0b1b2b"], [1, "#071220"]]);
    skyDefs(defs);

    var map = sv("g", {}, root);
    frame(map, "url(#l1-sea)");
    var mg = clipped(map, "l1-clip");
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "#0a1a2c", filter: "url(#lvp-grain)", opacity: .8 }, mg);
    for (var gx = FR.x; gx <= FR.x + FR.w; gx += SC) line(mg, { x: gx, y: FR.y }, { x: gx, y: FR.y + FR.h }, "rgba(120,180,255,.06)", 1);
    for (var gy = FR.y; gy <= FR.y + FR.h; gy += SC) line(mg, { x: FR.x, y: gy }, { x: FR.x + FR.w, y: gy }, "rgba(120,180,255,.06)", 1);
    sv("circle", { cx: Pk.x, cy: Pk.y, r: 660, fill: "#152a2c" }, mg);
    sv("circle", { cx: Pk.x + 14, cy: Pk.y + 14, r: 612, fill: "rgba(0,0,0,.35)", filter: "url(#lvp-blur-lg)" }, mg);
    contours.slice().reverse().forEach(function (c, i) {
      var k = contours.length - 1 - i;
      sv("circle", { cx: Pk.x + 8, cy: Pk.y + 8, r: c[1], fill: "rgba(0,0,0,.3)", filter: "url(#lvp-blur)" }, mg);
      sv("circle", { cx: Pk.x, cy: Pk.y, r: c[1], fill: bands[k] }, mg);
      sv("circle", { cx: Pk.x, cy: Pk.y, r: c[1], fill: "none", stroke: "rgba(200,255,220,.5)", "stroke-width": c[0] % 100 === 0 ? 2 : 1.1 }, mg);
    });
    sv("circle", { cx: Pk.x, cy: Pk.y, r: 110, fill: "#4a7a56" }, mg);
    sv("circle", { cx: Pk.x - 20, cy: Pk.y - 20, r: 60, fill: "rgba(255,255,255,.07)", filter: "url(#lvp-blur-lg)" }, mg);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "#000", opacity: .18, filter: "url(#lvp-grain)" }, mg);
    var rnd = rng(11);
    for (var t = 0; t < 70; t++) {
      var ang = rnd() * Math.PI * 2, rad = 130 + rnd() * 430;
      var tx = Pk.x + rad * Math.cos(ang), ty = Pk.y + rad * Math.sin(ang);
      if (tx < FR.x + 10 || tx > FR.x + FR.w - 10 || ty < FR.y + 10 || ty > FR.y + FR.h - 10 || dist({ x: tx, y: ty }, R) < 70) continue;
      sv("circle", { cx: tx, cy: ty, r: 3 + rnd() * 3, fill: "rgba(20,60,36,.9)" }, mg);
      sv("circle", { cx: tx - 1, cy: ty - 1, r: 1.6, fill: "rgba(120,200,140,.5)" }, mg);
    }
    contours.forEach(function (c, i) {
      var a = (30 + i * 5) * DEG;
      txt(mg, Pk.x + c[1] * Math.cos(a), Pk.y + c[1] * Math.sin(a) + 5, c[0] + " m", { size: 13, fill: "#cfffe0", weight: 600 });
    });
    txt(mg, Pk.x, Pk.y + 6, "▲ 330 m", { size: 15, fill: "#eafff0" });

    sv("path", { d: "M" + (FR.x + FR.w) + " 420 Q 820 500 760 548", fill: "none", stroke: "rgba(255,220,160,.25)", "stroke-width": 5 }, mg);
    sv("path", { d: "M" + (FR.x + FR.w) + " 420 Q 820 500 760 548", fill: "none", stroke: "rgba(255,220,160,.6)", "stroke-width": 1, "stroke-dasharray": "8 8" }, mg);
    sv("rect", { x: R.x - 24, y: R.y - 24, width: 48, height: 48, rx: 4, fill: "rgba(0,0,0,.4)", filter: "url(#lvp-blur)" }, mg);
    sv("rect", { x: R.x - 70, y: R.y + 30, width: 140, height: 42, rx: 6, fill: "rgba(4,8,16,.7)" }, mg);
    sv("rect", { x: R.x - 20, y: R.y - 20, width: 40, height: 40, rx: 4, fill: "#243752", stroke: C.cy, "stroke-width": 2 }, mg);
    sv("rect", { x: R.x - 10, y: R.y - 10, width: 20, height: 20, rx: 2, fill: "#101a2c", stroke: "rgba(34,227,255,.5)" }, mg);
    sv("circle", { cx: R.x, cy: R.y, r: 3, fill: C.cy, filter: "url(#lvp-glow)" }, mg);
    txt(mg, R.x, R.y + 44, "R · first rooftop", { size: 15 });
    txt(mg, R.x, R.y + 63, ROOF + " m above sea level", { size: 14, fill: C.gd, weight: 600 });

    var sx = FR.x + 26, sy = FR.y + FR.h - 30;
    sv("rect", { x: sx - 12, y: sy - 36, width: 236, height: 56, rx: 8, fill: "rgba(4,8,16,.8)", stroke: "rgba(255,255,255,.08)" }, mg);
    line(mg, { x: sx, y: sy }, { x: sx + SC, y: sy }, C.ink, 3);
    line(mg, { x: sx, y: sy - 6 }, { x: sx, y: sy + 6 }, C.ink, 2);
    line(mg, { x: sx + SC, y: sy - 6 }, { x: sx + SC, y: sy + 6 }, C.ink, 2);
    txt(mg, sx + SC / 2, sy - 12, "1 cm", { size: 13 });
    txt(mg, sx + SC + 14, sy + 5, "Scale 1 : 10 000", { size: 15, anchor: "start", fill: C.gd });
    compass(mg, FR.x + FR.w - 48, FR.y + 52);
    frameEdge(map);

    var selLayer = sv("g", {}, mg);
    var pinLayer = sv("g", {}, mg);
    var sel = null;

    anchors.forEach(function (a) {
      var g = sv("g", { class: "lvp-pick" }, pinLayer);
      sv("circle", { cx: a.p.x, cy: a.p.y, r: 24, fill: "transparent" }, g);
      var halo = sv("circle", { cx: a.p.x, cy: a.p.y, r: 16, fill: "rgba(255,198,90,.25)", filter: "url(#lvp-glow)" }, g);
      sv("animate", { attributeName: "r", values: "14;19;14", dur: "2s", repeatCount: "indefinite" }, halo);
      a.ring = sv("circle", { cx: a.p.x, cy: a.p.y, r: 10, fill: "#0b1626", stroke: C.gd, "stroke-width": 3 }, g);
      txt(g, a.p.x - 16, a.p.y - 12, a.id, { size: 20, fill: C.gd, anchor: "end" });
      txt(g, a.p.x + 16, a.p.y + 6, a.h + " m", { size: 13, fill: "#ffe0a8", anchor: "start", weight: 600 });
      g.addEventListener("click", function () { if (!busy) select(a); });
    });

    function select(a) {
      sel = a;
      selLayer.innerHTML = "";
      anchors.forEach(function (b) { b.ring.setAttribute("fill", b === a ? C.gd : "#0b1626"); });
      line(selLayer, a.p, R, "rgba(34,227,255,.35)", 8, null, { filter: "url(#lvp-blur)" });
      line(selLayer, a.p, R, C.cy, 2.5, "9 7");
      var m = { x: (a.p.x + R.x) / 2, y: (a.p.y + R.y) / 2 };
      txt(selLayer, m.x + 14, m.y - 10, fx(a.cm, 1) + " cm on the map", { size: 16, fill: C.cy, anchor: "start" });
      api.say("Anchor " + a.id + " selected. " + a.id + "R measures " + fx(a.cm, 1) + " cm on the map; " + a.id + " is " + a.h + " m above sea level.", "info");
    }

    var side = sv("g", { display: "none" }, root);
    var busy = false;

    function launch() {
      if (busy) return;
      if (!sel) { api.say("Pick an anchor (A, B or C) on the map first.", "bad"); return; }
      var cm = sel.cm, hm = sel.hm, v = sel.v, th = sel.th, L = sel.L;
      var bad = api.check(["h", "th", "L"]);
      if (bad) { api.say(bad, "bad"); return; }
      var ih = api.val("h"), ith = api.val("th"), iL = api.val("L");
      var errs = [];
      if (Math.abs(ih - hm) > 0.5) {
        if (Math.abs(ih - cm) < 0.05) errs.push("Horizontal distance: " + fx(cm, 1) + " cm is the map length. Convert with the scale 1 : 10 000.");
        else if (Math.abs(ih - cm * 10000) < 1) errs.push("Horizontal distance: that number is in cm. Convert to metres.");
        else errs.push("Horizontal distance is wrong: real distance = map length × 10 000, then change to m.");
      }
      if (Math.abs(ith - th) > 0.2) {
        if (Math.abs(ith - atand(hm / v)) < 0.3) errs.push("Inclination: vertical and horizontal are swapped. tan θ = vertical ÷ horizontal.");
        else errs.push("Inclination is wrong: vertical distance = difference in height, then use tan⁻¹.");
      }
      if (Math.abs(iL - L) > Math.max(1, L * 0.005)) {
        if (Math.abs(iL - (hm + v)) < 1) errs.push("Cable length is not vertical + horizontal: the cable is the hypotenuse (Pythagoras, or sin / cos).");
        else errs.push("Cable length is wrong: the cable is the hypotenuse of the right-angled triangle.");
      }
      if (errs.length) { flashRed(); api.say(errs.join("\n"), "bad"); return; }
      ride(hm, v, th, L);
    }

    function ride(hm, v, th, L) {
      busy = true;
      api.lock(true);
      map.setAttribute("display", "none");
      side.setAttribute("display", "");
      side.innerHTML = "";
      frame(side, "url(#l1-sky)");
      var sg = clipped(side, "l1-clip-s");
      nightSky(sg);

      var s = Math.min(600 / hm, 380 / v);
      var A = { x: 130, y: 0 }, roofY = 560;
      A.y = roofY - v * s;
      var Rt = { x: A.x + hm * s, y: roofY };
      var bottom = FR.y + FR.h;
      var w = (bottom - A.y) / (v / hm * 2.2 + 0.35);
      sv("path", { d: "M" + FR.x + " " + (A.y + 60) + " Q" + (A.x - 60) + " " + (A.y + 20) + " " + A.x + " " + A.y + " Q" + (A.x + w * .5) + " " + (A.y + (bottom - A.y) * .45) + " " + (A.x + w) + " " + bottom + " L" + FR.x + " " + bottom + "Z", fill: "url(#l1-hill2)" }, sg);
      sv("path", { d: "M" + FR.x + " " + (A.y + 90) + " Q" + (A.x - 40) + " " + (A.y + 30) + " " + A.x + " " + A.y + " Q" + (A.x + w * .4) + " " + (A.y + (bottom - A.y) * .5) + " " + (A.x + w * .85) + " " + bottom + " L" + FR.x + " " + bottom + "Z", fill: "url(#l1-hill)" }, sg);
      for (var tr = 0; tr < 9; tr++) { var tx2 = A.x - 60 + tr * 9, ty2 = A.y + 4 + tr * 1.2; sv("path", { d: "M" + tx2 + " " + (ty2 + 14) + " L" + (tx2 + 4) + " " + ty2 + " L" + (tx2 + 8) + " " + (ty2 + 14) + "Z", fill: "#0b1322" }, sg); }
      sv("rect", { x: A.x - 5, y: A.y - 34, width: 10, height: 36, rx: 2, fill: "#2a3a55" }, sg);
      sv("circle", { cx: A.x, cy: A.y - 36, r: 4, fill: C.gd, filter: "url(#lvp-glow)" }, sg);
      tower(sg, Rt.x, roofY, 100, bottom - roofY, true);

      txt(sg, A.x, A.y - 48, sel.id + "  ·  " + sel.h + " m", { size: 16, fill: C.gd });
      sv("rect", { x: Rt.x + 8, y: roofY + 14, width: 84, height: 22, rx: 4, fill: "rgba(4,8,16,.75)" }, sg);
      txt(sg, Rt.x + 50, roofY + 30, "Roof · " + ROOF + " m", { size: 14, fill: C.gd, cls: "nohalo" });
      line(sg, A, { x: Rt.x, y: A.y }, "rgba(232,244,255,.35)", 1.5, "6 6");
      dimV(sg, Rt.x - 16, A.y, roofY, fx(v, 0) + " m", -1);
      dimH(sg, A.x, Rt.x, roofY + 48, fx(hm, 0) + " m");
      arc(sg, A, 70, 0, th, C.gd);
      txt(sg, A.x + 80, A.y + 22, fx(th, 1) + "°", { size: 16, fill: C.gd, anchor: "start" });

      var dir = { x: (Rt.x - A.x) / (L * s), y: (Rt.y - A.y) / (L * s) };
      var cableLen = Math.min(L, LMAX) * s;
      var cableGlow = line(sg, A, A, "rgba(207,227,245,.35)", 7, null, { filter: "url(#lvp-blur)" });
      var cable = line(sg, A, A, "#e6f0ff", 2.5);
      var rider = sv("g", { transform: "translate(" + A.x + "," + (A.y + 6) + ")" }, sg);
      sv("line", { x1: 0, y1: 0, x2: 0, y2: 16, stroke: "#cfe3f5", "stroke-width": 2 }, rider);
      sv("rect", { x: -7, y: -5, width: 14, height: 8, rx: 3, fill: "#cfe3f5" }, rider);
      phantom(rider).setAttribute("transform", "translate(0,30) scale(.75)");
      frameEdge(side);

      function moveRider(t) {
        rider.setAttribute("transform", "translate(" + (A.x + dir.x * cableLen * t) + "," + (A.y + dir.y * cableLen * t + 6) + ")");
      }

      anim(700, function (k) {
        var e = { x: A.x + dir.x * cableLen * k, y: A.y + dir.y * cableLen * k };
        [cable, cableGlow].forEach(function (c) { c.setAttribute("x2", e.x); c.setAttribute("y2", e.y); });
      }, function () {
        if (L > LMAX) {
          var end = { x: A.x + dir.x * cableLen, y: A.y + dir.y * cableLen };
          anim(700, function (k) { [cable, cableGlow].forEach(function (c) { c.setAttribute("y2", end.y + 160 * k * k); c.setAttribute("x2", end.x - 40 * k); }); }, function () {
            flashRed();
            finish(false, "The cable is too short. This route needs " + fx(L, 1) + " m, but the cable is only 400 m.");
          });
          return;
        }
        if (th > TMAX) {
          anim(900, function (k) { moveRider(k * k); }, function () {
            flashRed();
            sv("circle", { cx: Rt.x, cy: roofY, r: 26, fill: "rgba(255,77,94,.55)", filter: "url(#lvp-glow-lg)" }, sg);
            txt(sg, Rt.x - 30, roofY - 56, "CRASH", { size: 34, fill: C.rd, anchor: "end", ls: ".08em" });
            finish(false, "Too steep: " + fx(th, 1) + "° is more than 25°. You hit the wall at full speed.");
          });
          return;
        }
        if (th < TMIN) {
          anim(2200, function (k) { moveRider(0.5 * (1 - Math.pow(1 - k, 3))); }, function () {
            flashRed();
            finish(false, "Too shallow: " + fx(th, 1) + "° is less than 10°. You stopped halfway, hanging in mid-air.");
          });
          return;
        }
        anim(2000, function (k) { moveRider(k * k * (3 - 2 * k)); }, function () {
          sv("circle", { cx: Rt.x, cy: roofY, r: 22, fill: "rgba(62,240,160,.5)", filter: "url(#lvp-glow-lg)" }, sg);
          txt(sg, Rt.x + 50, roofY - 50, "LANDED", { size: 26, fill: C.ok, ls: ".1em" });
          finish(true, "Landed. Inclination " + fx(th, 1) + "° is within 10°–25°, and the " + fx(L, 1) + " m cable is under 400 m.");
        });
      });
    }

    function finish(ok, msg) {
      api.say(msg, ok ? "good" : "bad");
      if (ok) { api.win(); return; }
      var back = sv("g", { class: "lvp-pick" }, side);
      sv("rect", { x: FR.x + 20, y: FR.y + 20, width: 170, height: 42, rx: 10, fill: "rgba(5,8,15,.9)", stroke: C.cy, "stroke-width": 1.5 }, back);
      txt(back, FR.x + 105, FR.y + 47, "← Back to map", { size: 16, fill: C.cy, cls: "nohalo" });
      back.addEventListener("click", function () {
        side.setAttribute("display", "none");
        map.setAttribute("display", "");
        busy = false;
        api.lock(false);
      });
    }

    return { launch: launch };
  }

  /* ================================================================
   * Chapter 1 · Round 2 — Rooftop to rooftop (two angles of depression)
   * ================================================================ */

  function genRoof() {
    for (;;) {
      var HA = ri(18, 28) * 5, be = ri(48, 62), al = ri(12, 26);
      if (be - al < 22) continue;
      var d = HA / tand(be), drop = d * tand(al), HB = HA - drop;
      if (HB < 25 || d < 45 || d > 125) continue;
      return { HA: HA, be: be, al: al, d: d, drop: drop, HB: HB, L: d / cosd(al) };
    }
  }

  function levelRoof(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    skyDefs(defs);
    frame(root, "url(#l1-sky)");
    var g = clipped(root, "r2-clip");
    nightSky(g);
    var GY = FR.y + FR.h - 64;
    var s = Math.min(480 / P.HA, 390 / P.d);
    var A = { x: FR.x + 250, y: GY - P.HA * s };
    var Bx = A.x + P.d * s, Bt = { x: Bx, y: GY - P.HB * s };
    sv("rect", { x: FR.x, y: GY, width: FR.w, height: FR.y + FR.h - GY, fill: "#0a101c" }, g);
    line(g, { x: FR.x, y: GY }, { x: FR.x + FR.w, y: GY }, "#2d4062", 3);
    tower(g, A.x - 150, A.y, 150, GY - A.y, false);
    tower(g, Bx, Bt.y, 140, GY - Bt.y, false);
    txt(g, A.x - 75, A.y + 34, "BUILDING A", { size: 13, fill: C.mut, ls: ".18em" });
    txt(g, Bx + 70, Bt.y + 34, "BUILDING B", { size: 13, fill: C.mut, ls: ".18em" });

    line(g, A, { x: Bx + 150, y: A.y }, "rgba(232,244,255,.4)", 1.5, "6 6");
    line(g, A, Bt, "rgba(255,198,90,.85)", 2, "8 6");
    line(g, A, { x: Bx, y: GY }, "rgba(34,227,255,.8)", 2, "8 6");
    arc(g, A, 120, 0, P.al, C.gd);
    arc(g, A, 74, 0, P.be, C.cy);
    txt(g, A.x + 132 * cosd(P.al / 2), A.y + 132 * sind(P.al / 2) + 6, "α = " + P.al + "°", { size: 16, fill: C.gd, anchor: "start" });
    txt(g, A.x + 84 * cosd(P.be / 2) + 4, A.y + 84 * sind(P.be / 2) + 8, "β = " + P.be + "°", { size: 16, fill: C.cy, anchor: "start" });
    dimV(g, A.x - 174, GY, A.y, P.HA + " m", -1);
    dimV(g, Bx + 160, GY, Bt.y, "? m", 1);
    dimH(g, A.x, Bx, GY + 24, "? m");
    var man = standing(g, A.x - 22, A.y);
    frameEdge(root);

    var busy = false;
    function launch() {
      if (busy) return;
      var bad = api.check(["d", "hb", "L"]);
      if (bad) { api.say(bad, "bad"); return; }
      var id = api.val("d"), ihb = api.val("hb"), iL = api.val("L"), errs = [];
      if (!rel(id, P.d, 0.01, 0.5)) {
        if (rel(id, P.HA * tand(P.be), 0.01, 0.5)) errs.push("Horizontal distance: tan β = vertical ÷ horizontal, so horizontal = height ÷ tan β, not × tan β.");
        else if (rel(id, P.HA / tand(P.al), 0.01, 0.5)) errs.push("Horizontal distance: use β, the angle to the FOOT of B. Its triangle has A's full height as the vertical side.");
        else errs.push("Horizontal distance is wrong. Use β and Building A's height.");
      }
      if (!near(ihb, P.HB, 0.8)) {
        if (near(ihb, P.drop, 0.8)) errs.push("Height of B: that is how far B's roof is BELOW A's roof. Subtract it from A's height.");
        else errs.push("Height of B is wrong. First use α to find how far B's roof is below A's roof.");
      }
      if (!rel(iL, P.L, 0.01, 0.8)) {
        if (near(iL, P.d + P.drop, 1.5)) errs.push("Cable: the cable is the hypotenuse, not horizontal + vertical.");
        else if (rel(iL, Math.hypot(P.d, P.HA), 0.01, 1)) errs.push("Cable: the cable goes to B's roof, not to the foot of B.");
        else errs.push("Cable length is wrong. It is the hypotenuse of the triangle with angle α.");
      }
      if (errs.length) { flashRed(); api.say(errs.join("\n"), "bad"); return; }
      busy = true;
      api.lock(true);
      man.setAttribute("display", "none");
      sv("rect", { x: A.x - 12, y: A.y - 58, width: 6, height: 58, fill: "#2a3a55" }, g);
      sv("rect", { x: Bt.x + 22, y: Bt.y - 58, width: 6, height: 58, fill: "#2a3a55" }, g);
      zipRide(g, { x: A.x - 9, y: A.y - 56 }, { x: Bt.x + 25, y: Bt.y - 56 }, 1900, function () {
        sv("circle", { cx: Bt.x + 30, cy: Bt.y, r: 22, fill: "rgba(62,240,160,.5)", filter: "url(#lvp-glow-lg)" }, g);
        txt(g, Bt.x + 75, Bt.y - 70, "LANDED", { size: 24, fill: C.ok, ls: ".1em" });
        api.say("Landed on Building B. Gap " + fx(P.d, 1) + " m, B is " + fx(P.HB, 1) + " m tall, cable " + fx(P.L, 1) + " m.", "good");
        api.win();
      });
    }
    return { launch: launch };
  }

  /* ================================================================
   * Chapter 1 · Round 3 — Grappling hook up to Crane Tower (elevation)
   * ================================================================ */

  function genGrapple() {
    for (;;) {
      var H0 = ri(12, 22) * 5, rise = ri(8, 18) * 5, d = ri(7, 16) * 5, th = atand(rise / d);
      if (th < 30 || th > 62) continue;
      return { H0: H0, HT: H0 + rise, rise: rise, d: d, th: th, L: Math.hypot(rise, d) };
    }
  }

  function levelGrapple(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    skyDefs(defs);
    frame(root, "url(#l1-sky)");
    var g = clipped(root, "r3-clip");
    nightSky(g);
    var GY = FR.y + FR.h - 50;
    var s = Math.min((GY - FR.y - 90) / P.HT, 380 / P.d);
    var A = { x: FR.x + 300, y: GY - P.H0 * s };
    var Tx = A.x + P.d * s, Tt = { x: Tx, y: GY - P.HT * s };
    sv("rect", { x: FR.x, y: GY, width: FR.w, height: FR.y + FR.h - GY, fill: "#0a101c" }, g);
    tower(g, A.x - 200, A.y, 200, GY - A.y, false);
    tower(g, Tx, Tt.y, 190, GY - Tt.y, true);
    txt(g, Tx + 95, Tt.y + 34, "CRANE TOWER", { size: 13, fill: C.cy, ls: ".18em" });
    sv("rect", { x: Tx - 10, y: Tt.y - 6, width: 26, height: 8, fill: "#3a4d6e" }, g);

    line(g, A, { x: Tx, y: A.y }, "rgba(232,244,255,.4)", 1.5, "6 6");
    line(g, A, Tt, "rgba(255,198,90,.85)", 2, "8 6");
    arc(g, A, 70, -atand(P.rise / P.d), 0, C.gd);
    txt(g, A.x + 82, A.y - 14, "θ = ?", { size: 16, fill: C.gd, anchor: "start" });
    dimV(g, A.x - 224, GY, A.y, P.H0 + " m", -1);
    dimV(g, Tx + 214, GY, Tt.y, P.HT + " m", 1);
    dimH(g, A.x, Tx, A.y + 30, P.d + " m");
    var man = standing(g, A.x - 22, A.y);
    frameEdge(root);

    var busy = false;
    function launch() {
      if (busy) return;
      var bad = api.check(["th", "L"]);
      if (bad) { api.say(bad, "bad"); return; }
      var ith = api.val("th"), iL = api.val("L"), errs = [];
      if (!near(ith, P.th, 0.2)) {
        if (near(ith, atand(P.d / P.rise), 0.3)) errs.push("Angle: vertical and horizontal are swapped. tan θ = vertical ÷ horizontal.");
        else if (near(ith, atand(P.HT / P.d), 0.3)) errs.push("Angle: the vertical side starts at YOUR roof, not at the street. Use the height difference.");
        else errs.push("Angle of elevation is wrong. Find the vertical side first, then use tan⁻¹.");
      }
      if (!rel(iL, P.L, 0.006, 0.6)) {
        if (near(iL, P.rise + P.d, 1)) errs.push("Rope: the rope is the hypotenuse, not vertical + horizontal.");
        else if (rel(iL, Math.hypot(P.HT, P.d), 0.01, 1)) errs.push("Rope: measure from your roof, not from the street.");
        else errs.push("Rope length is wrong. The rope is the hypotenuse of the triangle.");
      }
      if (errs.length) { flashRed(); api.say(errs.join("\n"), "bad"); return; }
      busy = true;
      api.lock(true);
      man.setAttribute("display", "none");
      zipRide(g, { x: A.x - 4, y: A.y - 40 }, { x: Tt.x + 3, y: Tt.y - 2 }, 1700, function (rider) {
        rider.setAttribute("display", "none");
        standing(g, Tt.x + 40, Tt.y);
        sv("circle", { cx: Tt.x + 10, cy: Tt.y, r: 22, fill: "rgba(62,240,160,.5)", filter: "url(#lvp-glow-lg)" }, g);
        txt(g, Tt.x + 90, Tt.y - 70, "ON THE TOWER", { size: 22, fill: C.ok, ls: ".1em" });
        api.say("Hooked. Angle of elevation " + fx(P.th, 1) + "°, rope " + fx(P.L, 1) + " m. You're on Crane Tower.", "good");
        api.win();
      });
    }
    return { launch: launch };
  }

  /* ================================================================
   * Chapter 2 · Round 1 — Drop between two cameras (angles of depression)
   * ================================================================ */

  function genCams() {
    for (;;) {
      var W = pick([24, 26, 28, 30]);
      var A = { id: "A", x: 0, h: ri(7, 10), lo: ri(25, 40) }; A.hi = ri(A.lo + 18, 68);
      var Bc = { id: "B", x: W, h: ri(5, 8), lo: ri(22, 40) }; Bc.hi = ri(Bc.lo + 18, 68);
      var nA = A.h / tand(A.hi), fA = A.h / tand(A.lo), nB = Bc.h / tand(Bc.hi), fB = Bc.h / tand(Bc.lo);
      var g0 = fA, g1 = W - fB, mid = (g0 + g1) / 2;
      if (g1 - g0 < 1.2 || g1 - g0 > 2.4 || mid < W * 0.35 || mid > W * 0.65) continue;
      var rl = Math.ceil(nA + 1), rr = Math.floor(W - nB - 1);
      if (rl > g0 - 2 || rr < g1 + 2) continue;
      A.r = [nA, fA]; Bc.r = [W - fB, W - nB];
      return { W: W, cams: [A, Bc], rail: [rl, rr], gap: [g0, g1] };
    }
  }

  function levelCams(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var W = P.W, HC = 10, S = Math.min(25, 700 / W), X0 = FR.x + (FR.w - W * S) / 2, FY = 485;
    var RL = P.rail[0], RR = P.rail[1];
    function px(x) { return X0 + x * S; }
    function py(y) { return FY - y * S; }
    var cams = P.cams;

    grad(defs, "l2-wall", [[0, "#1a2742"], [1, "#0b1324"]]);
    grad(defs, "l2-floor", [[0, "#1b2a44"], [1, "#0a1220"]]);
    grad(defs, "l2-refl", [[0, "#2a3c5c", .5], [1, "#2a3c5c", 0]]);
    grad(defs, "l2-cone-r", [[0, "#ff4d5e", .5], [1, "#ff4d5e", .08]]);
    grad(defs, "l2-cone-c", [[0, "#22e3ff", .35], [1, "#22e3ff", .04]]);
    grad(defs, "l2-light", [[0, "#ffe6b0", .35], [1, "#ffe6b0", 0]], { radial: true });

    frame(root, "#070b14");
    var g = clipped(root, "l2-clip");
    sv("rect", { x: px(0), y: py(HC), width: W * S, height: HC * S, fill: "url(#l2-wall)" }, g);
    for (var i = 0; i <= 7; i++) {
      var xx = px(i * W / 7);
      sv("rect", { x: xx - 6, y: py(HC), width: 12, height: HC * S, fill: "#0b1222", opacity: .8 }, g);
      sv("rect", { x: xx - 2, y: py(HC), width: 2, height: HC * S, fill: "rgba(255,255,255,.08)" }, g);
    }
    for (var j = 1; j < 7; j++) {
      var cx = px((j - .5) * W / 7);
      sv("rect", { x: cx - 30, y: py(HC) + 40, width: 60, height: 90, rx: 3, fill: "#0e1830", stroke: "rgba(255,255,255,.06)" }, g);
      sv("rect", { x: cx - 24, y: py(HC) + 48, width: 48, height: 72, fill: "#121f3a" }, g);
    }
    for (var l = 0; l < 4; l++) {
      var lx = px(W * (l + .5) / 4);
      sv("ellipse", { cx: lx, cy: py(HC) + 10, rx: 120, ry: 170, fill: "url(#l2-light)" }, g);
      sv("rect", { x: lx - 26, y: py(HC), width: 52, height: 6, rx: 2, fill: "#ffe6b0", opacity: .8 }, g);
    }
    sv("rect", { x: FR.x, y: FY, width: FR.w, height: FR.y + FR.h - FY, fill: "url(#l2-floor)" }, g);
    sv("rect", { x: px(0), y: FY, width: W * S, height: 50, fill: "url(#l2-refl)" }, g);
    for (var fxl = 0; fxl <= W; fxl += 2) line(g, { x: px(fxl), y: FY }, { x: px(fxl) + (fxl - W / 2) * 2.2, y: FY + 90 }, "rgba(255,255,255,.05)", 1);
    sv("rect", { x: FR.x, y: FY - 2, width: FR.w, height: 4, fill: "#2d4062" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: px(0) - FR.x, height: FR.h, fill: "#0a1222" }, g);
    sv("rect", { x: px(W), y: FR.y, width: FR.x + FR.w - px(W), height: FR.h, fill: "#0a1222" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: py(HC) - FR.y, fill: "#070b14" }, g);
    sv("rect", { x: px(RL) - 10, y: py(HC) - 26, width: (RR - RL) * S + 20, height: 26, fill: "#121c30", stroke: "rgba(255,255,255,.08)" }, g);
    for (var v = 0; v < (RR - RL) * S / 26 - .5; v++) sv("rect", { x: px(RL) + 4 + v * 26, y: py(HC) - 20, width: 14, height: 14, rx: 2, fill: "#0a1220" }, g);
    line(g, { x: px(RL), y: py(HC) + 4 }, { x: px(RR), y: py(HC) + 4 }, C.gd, 2, "3 7", { opacity: .7 });
    txt(g, px((RL + RR) / 2), py(HC) - 34, "VENT RAIL · x = " + RL + " m TO " + RR + " m", { size: 12, fill: C.mut, ls: ".2em" });

    for (var t = 0; t <= W; t++) {
      var big = t % 5 === 0 || t === W;
      line(g, { x: px(t), y: FY + 2 }, { x: px(t), y: FY + (big ? 14 : 7) }, C.mut, big ? 2 : 1);
      if (big && (t === W || W - t >= 3)) txt(g, px(t), FY + 34, t + " m", { size: 14, fill: C.mut });
    }

    var cones = sv("g", {}, g);
    var camLabels = [];

    cams.forEach(function (c) {
      var p = { x: px(c.x), y: py(c.h) };
      var dir = c.x === 0 ? 1 : -1;
      var cg = sv("g", {}, g);
      sv("rect", { x: dir > 0 ? p.x - 6 : p.x - 8, y: p.y - 22, width: 14, height: 22, rx: 2, fill: "#2a3b57" }, cg);
      sv("rect", { x: dir > 0 ? p.x : p.x - 40, y: p.y - 12, width: 40, height: 22, rx: 5, fill: "#2f4160", stroke: "#8ba3c4", "stroke-width": 1.5 }, cg);
      sv("circle", { cx: p.x + dir * 38, cy: p.y + 2, r: 7, fill: "#09111f", stroke: "#8ba3c4" }, cg);
      sv("circle", { cx: p.x + dir * 38, cy: p.y + 2, r: 3, fill: C.rd, filter: "url(#lvp-glow)" }, cg);
      sv("animate", { attributeName: "opacity", values: "1;.3;1", dur: "1.2s", repeatCount: "indefinite" }, cg.lastChild);
      dimV(g, p.x + dir * -24, FY, p.y, c.h + " m", -dir);
      var lx2 = p.x + dir * 54;
      camLabels.push(txt(g, lx2, p.y + 34, "Camera " + c.id, { size: 16, anchor: dir > 0 ? "start" : "end" }));
      camLabels.push(txt(g, lx2, p.y + 54, "depression " + c.lo + "° – " + c.hi + "°", { size: 15, fill: C.gd, anchor: dir > 0 ? "start" : "end", weight: 600 }));
      line(g, { x: p.x + dir * 44, y: p.y + 2 }, { x: p.x + dir * 120, y: p.y + 2 }, "rgba(232,244,255,.3)", 1.5, "5 5");
    });

    var vx = RL + .5;
    var hatch = sv("g", { class: "lvp-drag" }, g);
    sv("rect", { x: -28, y: -16, width: 56, height: 48, fill: "transparent" }, hatch);
    sv("rect", { x: -22, y: -8, width: 44, height: 14, rx: 3, fill: C.gd, filter: "url(#lvp-glow)" }, hatch);
    sv("rect", { x: -16, y: -5, width: 32, height: 8, rx: 2, fill: "#2b1d05", opacity: .5 }, hatch);
    var rope = line(g, { x: 0, y: 0 }, { x: 0, y: 0 }, "#cfe3f5", 2);
    var man = phantom(g);
    var readout = txt(g, 0, 0, "", { size: 16, fill: C.gd });
    camLabels.forEach(function (t) {
      t.setAttribute("stroke", "#070b14"); t.setAttribute("stroke-width", 4); t.setAttribute("paint-order", "stroke");
      g.appendChild(t);
    });

    var manY = py(HC) + 72;
    function place() {
      var x = px(vx);
      hatch.setAttribute("transform", "translate(" + x + "," + (py(HC) + 4) + ")");
      rope.setAttribute("x1", x); rope.setAttribute("x2", x);
      rope.setAttribute("y1", py(HC) + 10); rope.setAttribute("y2", manY - 30);
      man.setAttribute("transform", "translate(" + x + "," + manY + ") scale(1.25)");
      readout.setAttribute("x", x); readout.setAttribute("y", py(HC) + 36);
      readout.textContent = "x = " + fx(vx, 1) + " m";
    }
    place();
    frameEdge(root);

    var busy = false;
    draggable(hatch, function (p) {
      vx = clamp(Math.round((p.x - X0) / S * 10) / 10, RL, RR);
      api.input("x").value = fx(vx, 1);
      place();
    }, function () { return !busy; });
    api.input("x").value = fx(vx, 1);
    api.input("x").addEventListener("input", function () {
      var val = api.val("x");
      if (!isNaN(val) && !busy) { vx = clamp(val, RL, RR); place(); }
    });

    function drawCones(seen) {
      cones.innerHTML = "";
      cams.forEach(function (c) {
        var p = { x: px(c.x), y: py(c.h) };
        var hit = seen.indexOf(c) >= 0;
        sv("polygon", { points: p.x + "," + p.y + " " + px(c.r[0]) + "," + FY + " " + px(c.r[1]) + "," + FY, fill: hit ? "url(#l2-cone-r)" : "url(#l2-cone-c)", stroke: hit ? C.rd : "rgba(34,227,255,.7)", "stroke-width": 1.5 }, cones);
        sv("rect", { x: px(c.r[0]), y: FY - 3, width: px(c.r[1]) - px(c.r[0]), height: 6, fill: hit ? C.rd : C.cy, opacity: .8, filter: "url(#lvp-glow)" }, cones);
      });
    }

    function drop() {
      if (busy) return;
      var bad = api.check(["x"]);
      if (bad) { api.say(bad, "bad"); return; }
      var x = api.val("x");
      if (x < RL || x > RR) { api.say("The vent rail only runs from x = " + RL + " m to " + RR + " m.", "bad"); return; }
      vx = x;
      place();
      busy = true;
      api.lock(true);
      var y0 = manY, yEnd = FY - 42;
      anim(800, function (k) { manY = y0 + (yEnd - y0) * k * k; place(); }, function () {
        var M = 0.15;
        var seen = cams.filter(function (c) { return vx >= c.r[0] - M && vx <= c.r[1] + M; });
        drawCones(seen);
        if (!seen.length) {
          sv("ellipse", { cx: px(vx), cy: FY, rx: 30, ry: 8, fill: "rgba(62,240,160,.5)", filter: "url(#lvp-glow-lg)" }, cones);
          api.say("Safe. Neither camera can see x = " + fx(vx, 1) + " m.", "good");
          api.win();
          return;
        }
        flashRed();
        var left = api.useTry();
        if (!left) { api.reroll("Spotted by camera " + seen[0].id + ". Out of tries."); return; }
        api.say("Spotted by camera " + seen[0].id + ".", "bad");
        wait(1800, function () {
          cones.innerHTML = "";
          anim(600, function (k) { manY = yEnd + (py(HC) + 72 - yEnd) * k; place(); }, function () { busy = false; api.lock(false); });
        });
      });
    }

    return { launch: drop };
  }

  /* ================================================================
   * Chapter 2 · Round 2 — Hide in the shadow of a display case
   * ================================================================ */

  function genShadow() {
    for (;;) {
      var Hc = ri(14, 20) / 2, hc = ri(18, 26) / 10, d = ri(10, 18) / 2;
      var al = atand((Hc - hc) / d), xe = Hc * d / (Hc - hc), sh = xe - d;
      if (sh < 2.2 || sh > 4.2 || xe > 13.5) continue;
      var key = Math.round((d + sh * (0.65 + Math.random() * 0.2)) * 10) / 10;
      if (key - d < 1.6 || xe - key < 0.4) continue;
      return { Hc: Hc, hc: hc, d: d, al: al, xe: xe, sh: sh, key: key };
    }
  }

  function levelShadow(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var W = 15, HC = 11, S = 42, CW = 0.8;
    var X0 = FR.x + (FR.w - W * S) / 2 + 20, FY = FR.y + FR.h - 130;
    function px(x) { return X0 + x * S; }
    function py(y) { return FY - y * S; }

    grad(defs, "l2-wall", [[0, "#1a2742"], [1, "#0b1324"]]);
    grad(defs, "l2-floor", [[0, "#1b2a44"], [1, "#0a1220"]]);
    grad(defs, "l5-glass", [[0, "#bfefff", .28], [1, "#7fd8ff", .1]]);
    grad(defs, "l5-shadow", [[0, "#22e3ff", .28], [1, "#22e3ff", .06]]);

    frame(root, "#070b14");
    var g = clipped(root, "l5-clip");
    sv("rect", { x: px(0), y: py(HC), width: W * S, height: HC * S, fill: "url(#l2-wall)" }, g);
    for (var i = 1; i < 5; i++) {
      var cx = px(i * W / 5);
      sv("rect", { x: cx - 34, y: py(HC) + 50, width: 68, height: 96, rx: 3, fill: "#0e1830", stroke: "rgba(255,198,90,.25)" }, g);
      sv("rect", { x: cx - 27, y: py(HC) + 57, width: 54, height: 82, fill: "#152443" }, g);
    }
    sv("rect", { x: FR.x, y: FY, width: FR.w, height: FR.y + FR.h - FY, fill: "url(#l2-floor)" }, g);
    sv("rect", { x: FR.x, y: FY - 2, width: FR.w, height: 4, fill: "#2d4062" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: px(0) - FR.x, height: FR.h, fill: "#0a1222" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: py(HC) - FR.y, fill: "#070b14" }, g);
    for (var t = 0; t <= W; t++) {
      var big = t % 5 === 0;
      line(g, { x: px(t), y: FY + 2 }, { x: px(t), y: FY + (big ? 14 : 7) }, C.mut, big ? 2 : 1);
      if (big) txt(g, px(t), FY + 34, t + " m", { size: 14, fill: C.mut });
    }

    var shadowLayer = sv("g", {}, g);

    var cam = { x: px(0), y: py(P.Hc) };
    sv("rect", { x: cam.x, y: cam.y - 12, width: 40, height: 22, rx: 5, fill: "#2f4160", stroke: "#8ba3c4", "stroke-width": 1.5 }, g);
    sv("circle", { cx: cam.x + 38, cy: cam.y + 2, r: 7, fill: "#09111f", stroke: "#8ba3c4" }, g);
    var led = sv("circle", { cx: cam.x + 38, cy: cam.y + 2, r: 3, fill: C.rd, filter: "url(#lvp-glow)" }, g);
    sv("animate", { attributeName: "opacity", values: "1;.3;1", dur: "1.2s", repeatCount: "indefinite" }, led);
    txt(g, cam.x + 54, cam.y - 16, "Camera", { size: 16, anchor: "start" });
    line(g, { x: cam.x + 44, y: cam.y + 2 }, { x: cam.x + 150, y: cam.y + 2 }, "rgba(232,244,255,.3)", 1.5, "5 5");
    dimV(g, px(0) - 24, FY, cam.y, nf(P.Hc) + " m", -1);

    var c0 = px(P.d - CW), c1 = px(P.d), ct = py(P.hc);
    sv("rect", { x: c0 - 6, y: FY - 16, width: CW * S + 12, height: 16, fill: "#2a3b57" }, g);
    sv("rect", { x: c0, y: ct, width: CW * S, height: FY - 16 - ct, fill: "url(#l5-glass)", stroke: "rgba(191,239,255,.7)", "stroke-width": 1.5 }, g);
    sv("rect", { x: c0 + 8, y: ct + 18, width: CW * S - 16, height: 22, rx: 3, fill: "rgba(255,198,90,.35)" }, g);
    dimV(g, c0 - 18, FY, ct, nf(P.hc) + " m", -1);
    dimH(g, px(0), c1, FY + 58, nf(P.d) + " m to the back of the case");

    var key = { x: px(P.key), y: FY - 6 };
    var kg = sv("g", {}, g);
    sv("circle", { cx: key.x, cy: key.y, r: 14, fill: "rgba(255,198,90,.3)", filter: "url(#lvp-glow)" }, kg);
    sv("rect", { x: key.x - 12, y: key.y - 6, width: 24, height: 12, rx: 2, fill: C.gd }, kg);
    txt(g, key.x, key.y - 26, "keycard", { size: 14, fill: C.gd });
    dimH(g, px(0), key.x, FY + 96, nf(P.key) + " m to the keycard");

    var man = phantom(g, "stand");
    man.setAttribute("transform", "translate(" + (c1 + 14) + "," + (FY - 39) + ") scale(1.15)");
    var crawler = phantom(g, "crawl");
    crawler.setAttribute("display", "none");
    var manX = c1 + 38;
    function placeMan() { crawler.setAttribute("transform", "translate(" + manX + "," + FY + ")"); }
    frameEdge(root);

    var busy = false;
    function launch() {
      if (busy) return;
      var bad = api.check(["al", "x"]);
      if (bad) { api.say(bad, "bad"); return; }
      var ial = api.val("al"), ix = api.val("x"), errs = [];
      if (!near(ial, P.al, 0.3)) {
        if (near(ial, atand(P.d / (P.Hc - P.hc)), 0.4)) errs.push("Angle: vertical and horizontal are swapped. tan α = vertical ÷ horizontal.");
        else if (near(ial, atand(P.Hc / P.d), 0.4)) errs.push("Angle: the line passes the TOP of the case, so the vertical side is camera height − case height.");
        else errs.push("Angle of depression is wrong. Use the triangle from the camera to the top of the case.");
      }
      if (!near(ix, P.xe, 0.15)) {
        if (near(ix, P.sh, 0.15)) errs.push("Shadow end: that is the length of the shadow. The question asks for the distance from the wall.");
        else errs.push("Shadow end is wrong. With the same angle, the vertical side is now the full camera height.");
      }
      if (errs.length) { flashRed(); api.say(errs.join("\n"), "bad"); return; }
      busy = true;
      api.lock(true);
      var end = { x: px(P.xe), y: FY };
      sv("polygon", { points: c1 + "," + ct + " " + c1 + "," + FY + " " + end.x + "," + FY, fill: "url(#l5-shadow)" }, shadowLayer);
      var sight = line(g, cam, cam, "rgba(255,77,94,.85)", 2, "8 6");
      anim(900, function (k) { sight.setAttribute("x2", cam.x + (end.x - cam.x) * k); sight.setAttribute("y2", cam.y + (end.y - cam.y) * k); }, function () {
        txt(g, end.x + 8, FY - 10, "x = " + fx(P.xe, 2) + " m", { size: 14, fill: C.cy, anchor: "start" });
        man.setAttribute("display", "none");
        crawler.setAttribute("display", "");
        placeMan();
        var x0 = manX;
        anim(1800, function (k) { manX = x0 + (key.x - 24 - x0) * k; placeMan(); }, function () {
          kg.setAttribute("opacity", ".25");
          sv("circle", { cx: key.x, cy: key.y, r: 24, fill: "rgba(62,240,160,.45)", filter: "url(#lvp-glow-lg)" }, g);
          api.say("Keycard taken. The shadow reaches " + fx(P.xe, 2) + " m and the card was at " + nf(P.key) + " m, so you stayed hidden the whole way.", "good");
          api.win();
        });
      });
    }
    return { launch: launch };
  }

  /* ================================================================
   * Chapter 3 — Mirror locks: 2, 3 and 4 mirrors, beam hidden until fired
   * ================================================================ */

  var MSTAGES = [
    { seq: ["C", "F"], sensor: "R", room: function () { return { W: pick([14, 15, 16]), H: 6 }; }, th: [28, 60] },
    { seq: ["C", "R", "F"], sensor: "L", room: function () { return { W: 10, H: 10 }; }, th: [30, 80] },
    { seq: ["C", "R", "F", "L"], sensor: "C", room: function () { return { W: 10, H: 10 }; }, th: [30, 80] },
  ];
  var SURF = { C: "ceiling", F: "floor", R: "right wall", L: "left wall" };
  function flat(s) { return s === "C" || s === "F"; }

  function traceBeam(W, H, e, th, n) {
    var p = { x: 0, y: e }, dx = cosd(th), dy = sind(th), out = [];
    for (var i = 0; i < n; i++) {
      var tx = dx > 0 ? (W - p.x) / dx : dx < 0 ? -p.x / dx : Infinity;
      var ty = dy > 0 ? (H - p.y) / dy : dy < 0 ? -p.y / dy : Infinity;
      var t = Math.min(tx, ty), s;
      p = { x: p.x + dx * t, y: p.y + dy * t };
      if (tx < ty) { s = dx > 0 ? "R" : "L"; dx = -dx; } else { s = dy > 0 ? "C" : "F"; dy = -dy; }
      out.push({ s: s, x: p.x, y: p.y, pos: flat(s) ? p.x : p.y });
    }
    return out;
  }

  function genMirror(k) {
    var st = MSTAGES[k];
    for (;;) {
      var rm = st.room(), e = pick([1, 1.5, 2]), th = ri(st.th[0], st.th[1]);
      var hits = traceBeam(rm.W, rm.H, e, th, st.seq.length + 1), ok = true;
      for (var i = 0; i < hits.length && ok; i++) {
        var h = hits[i], want = i < st.seq.length ? st.seq[i] : st.sensor;
        var len = flat(h.s) ? rm.W : rm.H;
        if (h.s !== want || h.pos < 1 || h.pos > len - 1) ok = false;
        else if (h.s === "L" && Math.abs(h.pos - e) < 1.3) ok = false;
        for (var j = 0; j < i && ok; j++) if (hits[j].s === h.s && Math.abs(hits[j].pos - h.pos) < 1.3) ok = false;
      }
      if (ok) return { stage: k, W: rm.W, H: rm.H, e: e, th: th, hits: hits, seq: st.seq, sensor: st.sensor };
    }
  }

  function levelMirror(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var W = P.W, H = P.H, MW = 0.6, TH = P.th;
    var S = Math.min(600 / W, 430 / H);
    var X0 = FR.x + (FR.w - W * S) / 2 + 10, top = FR.y + (FR.h - H * S) / 2 - 8, FY = top + H * S;
    function px(x) { return X0 + x * S; }
    function py(y) { return FY - y * S; }
    function P2(p) { return { x: px(p.x), y: py(p.y) }; }
    var used = {};
    P.seq.concat([P.sensor]).forEach(function (s) { used[s] = 1; });

    grad(defs, "l3-wall", [[0, "#111c33"], [0.6, "#0c1527"], [1, "#0a1220"]]);
    grad(defs, "l3-floorsh", [[0, "#000", .5], [1, "#000", 0]]);
    grad(defs, "l3-mirror", [[0, "#ffffff"], [0.5, "#bfefff"], [1, "#7fd8ff"]], { x2: "1", y2: "0" });
    grad(defs, "l3-mirror-v", [[0, "#ffffff"], [0.5, "#bfefff"], [1, "#7fd8ff"]]);
    grad(defs, "l3-emit", [[0, "#22e3ff", .5], [1, "#22e3ff", 0]], { radial: true });

    frame(root, "#06090f");
    var g = clipped(root, "l3-clip");
    sv("rect", { x: px(0), y: py(H), width: W * S, height: H * S, fill: "url(#l3-wall)" }, g);
    for (var gx = 0; gx <= W; gx++) line(g, { x: px(gx), y: py(H) }, { x: px(gx), y: FY }, "rgba(34,227,255,.07)", 1);
    for (var gy = 0; gy <= H; gy++) line(g, { x: px(0), y: py(gy) }, { x: px(W), y: py(gy) }, "rgba(34,227,255,.07)", 1);
    sv("rect", { x: px(0), y: FY - 40, width: W * S, height: 40, fill: "url(#l3-floorsh)" }, g);
    sv("rect", { x: px(0) - 8, y: py(H) - 8, width: W * S + 16, height: H * S + 16, rx: 6, fill: "none", stroke: "#2d4062", "stroke-width": 8 }, g);
    if (used.C) line(g, { x: px(0), y: py(H) + 3 }, { x: px(W), y: py(H) + 3 }, C.gd, 2, "3 7", { opacity: .55 });
    if (used.F) line(g, { x: px(0), y: FY - 3 }, { x: px(W), y: FY - 3 }, C.gd, 2, "3 7", { opacity: .55 });
    if (used.R) line(g, { x: px(W) - 3, y: py(H) }, { x: px(W) - 3, y: FY }, C.gd, 2, "3 7", { opacity: .55 });
    if (used.L) line(g, { x: px(0) + 3, y: py(H) }, { x: px(0) + 3, y: FY }, C.gd, 2, "3 7", { opacity: .55 });
    txt(g, px(W / 2), py(H) - 22, "CEILING", { size: 12, fill: C.mut, ls: ".2em" });
    txt(g, px(W / 2), FY + 56, "FLOOR", { size: 12, fill: C.mut, ls: ".2em" });

    var step = W > 12 ? 2 : 1;
    for (var t = 0; t <= W; t += step) txt(g, px(t), FY + 30, t + "", { size: 13, fill: C.mut, weight: 600 });
    txt(g, px(W) + 16, FY + 30, "m", { size: 13, fill: C.mut, anchor: "start" });
    var hstep = H > 6 ? 2 : 1;
    for (var hy = hstep; hy <= H; hy += hstep) {
      if (used.R || P.sensor === "R") txt(g, px(W) + 14, py(hy) + 5, hy + "", { size: 13, fill: C.mut, anchor: "start", weight: 600 });
      txt(g, px(0) - 14, py(hy) + 5, hy + "", { size: 13, fill: C.mut, anchor: "end", weight: 600 });
    }
    dimH(g, px(0), px(W), FY + 70, W + " m");
    dimV(g, px(W) + 46, FY, py(H), H + " m", 1);

    var e = P2({ x: 0, y: P.e });
    sv("circle", { cx: e.x, cy: e.y, r: 50, fill: "url(#l3-emit)" }, g);
    sv("rect", { x: e.x - 8, y: e.y - 14, width: 22, height: 28, rx: 5, fill: "#223250", stroke: "#8ba3c4", "stroke-width": 1.5 }, g);
    var noz = sv("g", { transform: "rotate(" + (-TH) + " " + e.x + " " + e.y + ")" }, g);
    sv("rect", { x: e.x, y: e.y - 5, width: 30, height: 10, rx: 3, fill: "#2f4160", stroke: "#8ba3c4" }, noz);
    sv("circle", { cx: e.x + 30, cy: e.y, r: 4, fill: C.cy, filter: "url(#lvp-glow)" }, noz);
    line(g, e, { x: e.x + 80, y: e.y }, "rgba(232,244,255,.35)", 1.5, "6 6");
    arc(g, e, 50, -TH, 0, C.gd);
    txt(g, e.x + 58, e.y + 20, TH + "°", { size: 16, fill: C.gd, anchor: "start" });
    txt(g, e.x + 14, e.y + 40, "laser · " + nf(P.e) + " m up", { size: 13, fill: C.mut, anchor: "start" });

    var goal = P.hits[P.hits.length - 1], sp = P2(goal), sIn = { x: 0, y: 0 };
    if (goal.s === "R") sIn = { x: -1, y: 0 }; else if (goal.s === "L") sIn = { x: 1, y: 0 }; else if (goal.s === "C") sIn = { x: 0, y: 1 }; else sIn = { x: 0, y: -1 };
    var sc = { x: sp.x + sIn.x * 12, y: sp.y + sIn.y * 12 };
    sv("rect", { x: sc.x - (flat(goal.s) ? 20 : 11), y: sc.y - (flat(goal.s) ? 11 : 20), width: flat(goal.s) ? 40 : 22, height: flat(goal.s) ? 22 : 40, rx: 4, fill: "#223250", stroke: "#8ba3c4" }, g);
    var sensor = sv("circle", { cx: sc.x, cy: sc.y, r: 8, fill: "#0b1626", stroke: C.gd, "stroke-width": 3 }, g);
    var sring = sv("circle", { cx: sc.x, cy: sc.y, r: 13, fill: "none", stroke: C.gd, "stroke-width": 1.5, opacity: .6 }, g);
    sv("animate", { attributeName: "r", values: "11;20;11", dur: "2s", repeatCount: "indefinite" }, sring);
    sv("animate", { attributeName: "opacity", values: ".7;0;.7", dur: "2s", repeatCount: "indefinite" }, sring);
    txt(g, sc.x + sIn.x * 30 + (flat(goal.s) ? 0 : 0), sc.y + sIn.y * 34 + (flat(goal.s) ? 5 : -18), "SENSOR", { size: 12, fill: C.gd, anchor: goal.s === "R" ? "end" : goal.s === "L" ? "start" : "middle", ls: ".12em" });

    var beamLayer = sv("g", {}, g);
    var busy = false;
    var mirrors = P.seq.map(function (s, i) {
      var len = flat(s) ? W : H, ans = P.hits[i].pos, p0 = Math.round(len * (0.2 + 0.6 * Math.random()) * 10) / 10;
      if (Math.abs(p0 - ans) < 1.5) p0 = Math.round(((p0 + len / 2) % (len - 1) + 0.5) * 10) / 10;
      return { s: s, id: "ABCD"[i], len: len, p: p0 };
    });

    mirrors.forEach(function (m) {
      var hz = flat(m.s), L = MW * S;
      m.g = sv("g", { class: "lvp-drag" }, g);
      sv("rect", hz ? { x: -30, y: -24, width: 60, height: 48, fill: "transparent" } : { x: -24, y: -30, width: 48, height: 60, fill: "transparent" }, m.g);
      sv("rect", hz ? { x: -L / 2 - 3, y: -5, width: L + 6, height: 10, rx: 2, fill: "#2f4160" } : { x: -5, y: -L / 2 - 3, width: 10, height: L + 6, rx: 2, fill: "#2f4160" }, m.g);
      sv("rect", hz ? { x: -L / 2, y: -3, width: L, height: 6, rx: 2, fill: "url(#l3-mirror)", stroke: C.cy, "stroke-width": 1.2, filter: "url(#lvp-glow)" } : { x: -3, y: -L / 2, width: 6, height: L, rx: 2, fill: "url(#l3-mirror-v)", stroke: C.cy, "stroke-width": 1.2, filter: "url(#lvp-glow)" }, m.g);
      m.label = txt(g, 0, 0, "", { size: 14, fill: C.gd, anchor: m.s === "F" || m.s === "C" ? "middle" : "end" });
      draggable(m.g, function (p) {
        var v = hz ? (p.x - X0) / S : (FY - p.y) / S;
        m.p = clamp(Math.round(v * 10) / 10, 0.3, m.len - 0.3);
        api.input(m.id).value = fx(m.p, 1);
        placeM(m);
      }, function () { return !busy; });
      api.input(m.id).value = fx(m.p, 1);
      api.input(m.id).addEventListener("input", function () {
        var v = api.val(m.id);
        if (!isNaN(v) && !busy) { m.p = clamp(v, 0.3, m.len - 0.3); placeM(m); }
      });
      placeM(m);
    });
    frameEdge(root);

    function placeM(m) {
      var x, y, lx, ly;
      if (m.s === "C") { x = px(m.p); y = py(H) + 3; lx = x; ly = y + 30; }
      else if (m.s === "F") { x = px(m.p); y = FY - 3; lx = x; ly = y - 18; }
      else if (m.s === "R") { x = px(W) - 3; y = py(m.p); lx = x - 16; ly = y + 5; }
      else { x = px(0) + 3; y = py(m.p); lx = px(0) - 40; ly = y + 5; }
      m.g.setAttribute("transform", "translate(" + x + "," + y + ")");
      m.label.setAttribute("x", lx);
      m.label.setAttribute("y", ly);
      m.label.textContent = m.id + "  " + (flat(m.s) ? "x" : "h") + " = " + fx(m.p, 1) + " m";
    }

    function beam(pts) {
      var pp = pts.map(function (q) { return q.x + "," + q.y; }).join(" ");
      sv("polyline", { points: pp, fill: "none", stroke: "rgba(34,227,255,.25)", "stroke-width": 20, "stroke-linejoin": "round", filter: "url(#lvp-blur)" }, beamLayer);
      sv("polyline", { points: pp, fill: "none", stroke: "rgba(34,227,255,.6)", "stroke-width": 7, "stroke-linejoin": "round" }, beamLayer);
      sv("polyline", { points: pp, fill: "none", stroke: "#f2ffff", "stroke-width": 2.5, "stroke-linejoin": "round" }, beamLayer);
    }

    function animatePath(pts, done) {
      var lens = [], total = 0;
      for (var i = 1; i < pts.length; i++) { lens.push(dist(pts[i - 1], pts[i])); total += lens[i - 1]; }
      anim(Math.min(1800, 300 + total * 1.1), function (k) {
        var left = total * k, out = [pts[0]];
        for (var j = 1; j < pts.length; j++) {
          if (lens[j - 1] >= left) {
            var a = pts[j - 1], b = pts[j], f = lens[j - 1] ? left / lens[j - 1] : 0;
            out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
            break;
          }
          out.push(pts[j]);
          left -= lens[j - 1];
        }
        beamLayer.innerHTML = "";
        beam(out);
      }, done);
    }

    function fire() {
      if (busy) return;
      var bad = api.check(mirrors.map(function (m) { return m.id; }));
      if (bad) { api.say(bad, "bad"); return; }
      mirrors.forEach(function (m) { m.p = clamp(api.val(m.id), 0.3, m.len - 0.3); placeM(m); });
      busy = true;
      api.lock(true);
      var pts = [e], miss = -1;
      for (var i = 0; i < mirrors.length; i++) {
        if (Math.abs(mirrors[i].p - P.hits[i].pos) > MW / 2) { miss = i; break; }
        pts.push(P2(P.hits[i]));
      }
      if (miss < 0) pts.push({ x: sc.x, y: sc.y });
      else {
        // The beam fades out before it reaches the surface, so a miss never shows where it should have hit.
        var a = pts[pts.length - 1], b = P2(P.hits[miss]), dd = dist(a, b), f = Math.min(0.35, 1.6 * S / dd);
        pts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
      }
      animatePath(pts, function () {
        if (miss < 0) {
          sensor.setAttribute("fill", C.ok);
          sensor.setAttribute("stroke", C.ok);
          sring.setAttribute("stroke", C.ok);
          sv("circle", { cx: sc.x, cy: sc.y, r: 20, fill: "rgba(62,240,160,.5)", filter: "url(#lvp-glow-lg)" }, beamLayer);
          api.say("Sensor hit. Lock open.", "good");
          api.win();
          return;
        }
        beamLayer.setAttribute("opacity", ".35");
        flashRed();
        var ok = mirrors.slice(0, miss).map(function (m) { return m.id; });
        var msg = ok.length ? "The beam bounced off " + (ok.length > 1 ? ok.slice(0, -1).join(", ") + " and " + ok[ok.length - 1] : ok[0]) + ", but mirror " + mirrors[miss].id + " missed it." : "Mirror A missed the beam.";
        var left = api.useTry();
        if (!left) { api.reroll(msg + " Out of charge."); return; }
        api.say(msg, "bad");
        wait(1600, function () { beamLayer.innerHTML = ""; beamLayer.setAttribute("opacity", "1"); busy = false; api.lock(false); });
      });
    }

    return { launch: fire };
  }

  /* ================================================================
   * Chapter 4 — Harbour escape (bearings · shortest distance)
   * ================================================================ */

  var SEA = { H0: { x: 250, y: 560 }, K: 40 };
  function kp(p) { return { x: SEA.H0.x + p.x * SEA.K, y: SEA.H0.y - p.y * SEA.K }; }
  function vec(b, d) { return { x: d * sind(b), y: d * cosd(b) }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function onMap(p, m) { return p.x > FR.x + m && p.x < FR.x + FR.w - m && p.y > FR.y + m && p.y < FR.y + FR.h - m; }
  function fmtB(b) { var r = Math.round(b) % 360; return (r < 10 ? "00" : r < 100 ? "0" : "") + r + "°"; }

  function seaDefs(defs, cx, cy) {
    grad(defs, "l4-sea", [[0, "#06251f", .9], [0.6, "#041a18"], [1, "#030d10"]], { radial: true, cx: cx, cy: cy, r: 620, units: "userSpaceOnUse" });
    grad(defs, "l4-sweep", [[0, "#3ef0a0", 0], [1, "#3ef0a0", .35]], { x1: "0", y1: "0", x2: "1", y2: "0" });
    grad(defs, "l4-land", [[0, "#1f3a2a"], [1, "#0e1f17"]]);
  }

  function boatIcon(parent, color) {
    var b = sv("g", {}, parent);
    sv("circle", { cx: 0, cy: 0, r: 16, fill: "rgba(34,227,255,.25)", filter: "url(#lvp-glow)" }, b);
    sv("path", { d: "M0 -16 L9 10 L0 5 L-9 10 Z", fill: color || C.cy, stroke: "#fff", "stroke-width": 1 }, b);
    return b;
  }

  function wakeRing(parent, p) {
    var wk = sv("circle", { cx: p.x, cy: p.y, r: 3, fill: "none", stroke: "rgba(255,255,255,.5)", "stroke-width": 1 }, parent);
    sv("animate", { attributeName: "r", from: 3, to: 16, dur: "1.4s", fill: "freeze" }, wk);
    sv("animate", { attributeName: "opacity", from: .6, to: 0, dur: "1.4s", fill: "freeze" }, wk);
  }

  function genPatrol() {
    for (;;) {
      var b0 = ri(25, 65), D = ri(9, 14), al = ri(40, 70), side = pick([1, -1]), v = pick([20, 24, 30, 36]);
      var c = ((b0 + 180 + side * al) % 360 + 360) % 360;
      var Pk = vec(b0, D), dir = vec(c, 1), along = D * cosd(al);
      var M = add(Pk, { x: dir.x * along, y: dir.y * along });
      var t = along / v * 60;
      if (!onMap(kp(Pk), 70) || !onMap(kp(M), 70) || t < 6 || t > 40) continue;
      if (kp(Pk).x > FR.x + FR.w - 130 && kp(Pk).y < FR.y + 200) continue;
      return { b0: b0, D: D, al: al, c: c, v: v, Pk: Pk, M: M, s: D * sind(al), t: t, mb: (Math.atan2(M.x, M.y) / DEG + 360) % 360 };
    }
  }

  function levelPatrol(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var K = SEA.K, H0 = SEA.H0, SPEED = P.v, COURSE = P.c, Pkm = P.Pk, NET = 0.6;
    var dirC = vec(COURSE, 1);
    function boatAt(t) { return add(Pkm, { x: dirC.x * SPEED * t / 60, y: dirC.y * SPEED * t / 60 }); }

    seaDefs(defs, H0.x, H0.y);
    frame(root, "#030d10");
    var g = clipped(root, "l4-clip");
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#l4-sea)" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "#000", opacity: .25, filter: "url(#lvp-grain)" }, g);
    for (var gx = H0.x % K; gx <= FR.x + FR.w; gx += K) line(g, { x: gx, y: FR.y }, { x: gx, y: FR.y + FR.h }, "rgba(62,240,160,.06)", 1);
    for (var gy = H0.y % K; gy <= FR.y + FR.h; gy += K) line(g, { x: FR.x, y: gy }, { x: FR.x + FR.w, y: gy }, "rgba(62,240,160,.06)", 1);
    for (var rr = 2; rr <= 16; rr += 2) {
      sv("circle", { cx: H0.x, cy: H0.y, r: rr * K, fill: "none", stroke: "rgba(62,240,160," + (rr % 4 === 0 ? .22 : .1) + ")", "stroke-width": 1 }, g);
      if (rr % 4 === 0) txt(g, H0.x - rr * K * sind(60) - 6, H0.y - rr * K * cosd(60) - 6, rr + " km", { size: 12, fill: "rgba(62,240,160,.6)", anchor: "end", weight: 600, cls: "nohalo" });
    }
    var sweep = sv("g", {}, g);
    sv("path", { d: "M" + H0.x + " " + H0.y + " L" + (H0.x + 700) + " " + H0.y + " A700 700 0 0 0 " + (H0.x + 700 * Math.cos(-50 * DEG)) + " " + (H0.y + 700 * Math.sin(-50 * DEG)) + " Z", fill: "url(#l4-sweep)", opacity: .6 }, sweep);
    line(sweep, H0, { x: H0.x + 700, y: H0.y }, "rgba(62,240,160,.8)", 2);
    sv("animateTransform", { attributeName: "transform", type: "rotate", from: "0 " + H0.x + " " + H0.y, to: "360 " + H0.x + " " + H0.y, dur: "6s", repeatCount: "indefinite" }, sweep);
    var sx = FR.x + FR.w - 180, sy = FR.y + FR.h - 26;
    line(g, { x: sx, y: sy }, { x: sx + 2 * K, y: sy }, C.ink, 3);
    txt(g, sx + K, sy - 10, "2 km", { size: 13 });
    compass(g, FR.x + FR.w - 48, FR.y + 150);

    var Pp = kp(Pkm);
    line(g, H0, { x: H0.x, y: H0.y - 100 }, "rgba(232,244,255,.5)", 1.5, "5 5");
    txt(g, H0.x, H0.y - 108, "N", { size: 14, fill: C.mut });
    arc(g, H0, 60, -90, P.b0 - 90, C.gd);
    txt(g, H0.x + 84 * sind(P.b0 / 2), H0.y - 84 * cosd(P.b0 / 2) + 5, fmtB(P.b0), { size: 15, fill: C.gd });
    line(g, H0, Pp, "rgba(255,198,90,.75)", 2, "8 6");
    var mHP = { x: (H0.x + Pp.x) / 2, y: (H0.y + Pp.y) / 2 };
    txt(g, mHP.x - 12, mHP.y, P.D + " km", { size: 16, fill: C.gd, anchor: "end" });
    line(g, Pp, { x: Pp.x, y: Pp.y - 80 }, "rgba(232,244,255,.5)", 1.5, "5 5");
    txt(g, Pp.x, Pp.y - 88, "N", { size: 14, fill: C.mut });
    line(g, Pp, { x: Pp.x + 78 * sind(COURSE), y: Pp.y - 78 * cosd(COURSE) }, "rgba(34,227,255,.85)", 2, "6 5");
    arc(g, Pp, 40, -90, -90 + COURSE, C.cy);
    txt(g, Pp.x + 64 * sind(COURSE / 2), Pp.y - 64 * cosd(COURSE / 2) + 5, fmtB(COURSE), { size: 15, fill: C.cy });

    sv("circle", { cx: H0.x, cy: H0.y, r: 22, fill: "rgba(255,77,94,.15)", filter: "url(#lvp-glow)" }, g);
    sv("path", { d: "M" + H0.x + " " + (H0.y - 12) + " L" + (H0.x + 8) + " " + (H0.y + 9) + " L" + (H0.x - 8) + " " + (H0.y + 9) + " Z", fill: "#3a6ea8", stroke: "#fff", "stroke-width": 1 }, g);
    var bl = sv("circle", { cx: H0.x, cy: H0.y - 2, r: 3, fill: "#4fa3ff", filter: "url(#lvp-glow)" }, g);
    sv("animate", { attributeName: "fill", values: "#4fa3ff;#ff4d5e;#4fa3ff", dur: "1s", repeatCount: "indefinite" }, bl);
    txt(g, H0.x - 20, H0.y + 32, "H · patrol boat", { size: 15, fill: "#8fc4ff", anchor: "end" });
    txt(g, Pp.x - 16, Pp.y - 30, "P", { size: 18, fill: C.cy, anchor: "end" });
    txt(g, Pp.x - 16, Pp.y - 8, "your speedboat", { size: 14, fill: C.cy, anchor: "end", weight: 600 });

    var trail = sv("polyline", { points: "", fill: "none", stroke: "rgba(34,227,255,.5)", "stroke-width": 2, "stroke-dasharray": "3 6" }, g);
    var wake = sv("g", {}, g);
    var boat = boatIcon(g);
    var drone = sv("g", { display: "none" }, g);
    sv("circle", { cx: 0, cy: 0, r: 14, fill: "rgba(62,240,160,.3)", filter: "url(#lvp-glow)" }, drone);
    sv("circle", { cx: 0, cy: 0, r: 6, fill: C.ok }, drone);
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(function (p) { sv("circle", { cx: p[0], cy: p[1], r: 3.5, fill: "none", stroke: C.ok, "stroke-width": 1.5 }, drone); });
    var smoke = sv("circle", { cx: 0, cy: 0, r: 0, fill: "rgba(220,232,245,.22)", stroke: "#dfe9f5", "stroke-width": 2, display: "none", "stroke-dasharray": "4 4" }, g);
    var droneLine = line(g, H0, H0, "rgba(62,240,160,.6)", 2, "4 6");
    sv("rect", { x: FR.x + 14, y: FR.y + 14, width: 150, height: 36, rx: 8, fill: "rgba(3,13,16,.8)", stroke: "rgba(62,240,160,.35)" }, g);
    var clock = txt(g, FR.x + 30, FR.y + 39, "T + 0 min", { size: 18, anchor: "start", fill: C.ok, cls: "nohalo" });
    frameEdge(root);

    function placeBoat(t) {
      var p = kp(boatAt(t));
      boat.setAttribute("transform", "translate(" + p.x + "," + p.y + ") rotate(" + COURSE + ")");
      return p;
    }
    placeBoat(0);

    var busy = false;

    function launch() {
      if (busy) return;
      if (!api.raw("b").trim()) { api.say("Fill in Smoke bearing.", "bad"); return; }
      var b = parseBearing(api.raw("b"));
      if (isNaN(b)) { api.say("Bearing: write a true bearing such as 125° or a compass bearing such as S55°E.", "bad"); return; }
      var bad = api.check(["d", "t"]);
      if (bad) { api.say(bad, "bad"); return; }
      var d = api.val("d"), t = api.val("t");
      if (d <= 0) { api.say("Distance must be positive.", "bad"); return; }
      if (d > 20) { api.say("The drone can fly at most 20 km.", "bad"); return; }
      if (t <= 0 || t > 60) { api.say("Time must be between 0 and 60 minutes.", "bad"); return; }
      busy = true;
      api.lock(true);
      var T = vec(b, d), Tp = kp(T);
      var tEnd = Math.max(t, P.t) + 8;
      var hidden = false, checked = false;
      drone.setAttribute("display", "");
      smoke.setAttribute("display", "none");
      wake.innerHTML = "";
      var pts = [], frameN = 0;
      anim(tEnd * 140, function (k) {
        var tau = k * tEnd;
        if (!checked && tau >= t) {
          checked = true;
          hidden = Math.hypot(boatAt(t).x - T.x, boatAt(t).y - T.y) <= NET;
          smoke.setAttribute("display", "");
          smoke.setAttribute("cx", Tp.x); smoke.setAttribute("cy", Tp.y);
          smoke.setAttribute("r", NET * K);
        }
        var bt = hidden ? t : tau;
        var bp = placeBoat(bt);
        pts.push(bp.x + "," + bp.y);
        trail.setAttribute("points", pts.join(" "));
        if (frameN++ % 6 === 0) wakeRing(wake, bp);
        var f = Math.min(1, tau / t);
        var dp = { x: H0.x + (Tp.x - H0.x) * f, y: H0.y + (Tp.y - H0.y) * f };
        drone.setAttribute("transform", "translate(" + dp.x + "," + dp.y + ")");
        droneLine.setAttribute("x2", dp.x); droneLine.setAttribute("y2", dp.y);
        clock.textContent = "T + " + Math.floor(bt) + " min";
        return hidden;
      }, function () {
        if (hidden) {
          smoke.setAttribute("stroke-dasharray", null);
          sv("circle", { cx: Tp.x, cy: Tp.y, r: 34, fill: "rgba(220,232,245,.35)", filter: "url(#lvp-glow-lg)" }, g);
          clock.textContent = "T + " + fx(t, 0) + " min";
          api.say("Smoke on target. You slipped past the patrol boat unseen.", "good");
          api.win();
          return;
        }
        flashRed();
        smoke.setAttribute("stroke", C.rd);
        var relv = { x: T.x - Pkm.x, y: T.y - Pkm.y };
        var off = Math.abs(relv.x * dirC.y - relv.y * dirC.x);
        var msg = off > NET ? "The smoke missed your course. The patrol saw you." : "Right place, wrong time. The smoke had cleared.";
        var left = api.useTry();
        if (!left) { api.reroll(msg + " No drones left."); return; }
        api.say(msg, "bad");
        wait(1800, function () {
          pts = [];
          trail.setAttribute("points", "");
          wake.innerHTML = "";
          drone.setAttribute("display", "none");
          droneLine.setAttribute("x2", H0.x); droneLine.setAttribute("y2", H0.y);
          smoke.setAttribute("display", "none");
          smoke.setAttribute("stroke", "#dfe9f5");
          placeBoat(0);
          clock.textContent = "T + 0 min";
          busy = false;
          api.lock(false);
        });
      });
    }

    return { launch: launch };
  }

  function genPickup() {
    for (;;) {
      var n = ri(8, 18) / 2, e = ri(6, 18) / 2, v = pick([30, 36, 40, 45]);
      if (Math.abs(e - n) < 1) continue;
      var d = Math.hypot(e, n), t = d / v * 60;
      if (t < 6 || t > 22) continue;
      return { n: n, e: e, v: v, b: atand(e / n), d: d, t: t };
    }
  }

  function levelPickup(api, P) {
    var B = freshBoard(), root = B.root, defs = B.defs;
    var K = Math.min(56, (FR.h - 200) / P.n, (FR.w - 340) / P.e);
    var O = { x: FR.x + 160, y: FR.y + FR.h - 90 };
    function mp(p) { return { x: O.x + p.x * K, y: O.y - p.y * K }; }
    seaDefs(defs, O.x, O.y);
    frame(root, "#030d10");
    var g = clipped(root, "l6-clip");
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#l4-sea)" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "#000", opacity: .25, filter: "url(#lvp-grain)" }, g);
    for (var gx = O.x % K; gx <= FR.x + FR.w; gx += K) line(g, { x: gx, y: FR.y }, { x: gx, y: FR.y + FR.h }, "rgba(62,240,160,.06)", 1);
    for (var gy = O.y % K; gy <= FR.y + FR.h; gy += K) line(g, { x: FR.x, y: gy }, { x: FR.x + FR.w, y: gy }, "rgba(62,240,160,.06)", 1);
    var sx = FR.x + FR.w - 180, sy = FR.y + FR.h - 26;
    line(g, { x: sx, y: sy }, { x: sx + 2 * K, y: sy }, C.ink, 3);
    txt(g, sx + K, sy - 10, "2 km", { size: 13 });
    compass(g, FR.x + FR.w - 48, FR.y + 60);

    var Lp = mp({ x: 0, y: P.n }), Qp = mp({ x: P.e, y: P.n });
    line(g, O, Lp, "rgba(255,198,90,.75)", 2, "8 6");
    line(g, Lp, Qp, "rgba(255,198,90,.75)", 2, "8 6");
    sv("path", { d: "M" + (Lp.x + 14) + " " + Lp.y + " L" + (Lp.x + 14) + " " + (Lp.y + 14) + " L" + Lp.x + " " + (Lp.y + 14), fill: "none", stroke: C.gd, "stroke-width": 1.5 }, g);
    txt(g, O.x - 14, (O.y + Lp.y) / 2, nf(P.n) + " km", { size: 16, fill: C.gd, anchor: "end" });
    txt(g, (Lp.x + Qp.x) / 2, Lp.y - 14, nf(P.e) + " km", { size: 16, fill: C.gd });
    line(g, O, { x: O.x, y: O.y + 0 }, C.mut, 1);

    sv("circle", { cx: Lp.x, cy: Lp.y, r: 40, fill: "rgba(255,240,180,.12)", filter: "url(#lvp-glow-lg)" }, g);
    sv("path", { d: "M" + (Lp.x - 7) + " " + (Lp.y + 10) + " L" + (Lp.x - 4) + " " + (Lp.y - 14) + " L" + (Lp.x + 4) + " " + (Lp.y - 14) + " L" + (Lp.x + 7) + " " + (Lp.y + 10) + " Z", fill: "#e8f0fa", stroke: "#8ba3c4" }, g);
    sv("circle", { cx: Lp.x, cy: Lp.y - 16, r: 4, fill: "#fff2b3", filter: "url(#lvp-glow)" }, g);
    txt(g, Lp.x - 14, Lp.y - 22, "L · lighthouse", { size: 14, fill: C.ink, anchor: "end" });

    sv("circle", { cx: Qp.x, cy: Qp.y, r: 22, fill: "rgba(255,198,90,.18)", filter: "url(#lvp-glow)" }, g);
    sv("path", { d: "M" + (Qp.x - 18) + " " + (Qp.y - 4) + " L" + (Qp.x + 18) + " " + (Qp.y - 4) + " L" + (Qp.x + 12) + " " + (Qp.y + 7) + " L" + (Qp.x - 12) + " " + (Qp.y + 7) + " Z", fill: C.gd, stroke: "#fff", "stroke-width": 1 }, g);
    sv("rect", { x: Qp.x - 5, y: Qp.y - 12, width: 10, height: 8, fill: "#ffe0a8" }, g);
    txt(g, Qp.x, Qp.y + 30, "Q · pickup ship", { size: 14, fill: C.gd });

    line(g, O, { x: O.x, y: O.y - 70 }, "rgba(232,244,255,.5)", 1.5, "5 5");
    txt(g, O.x + 12, O.y - 60, "N", { size: 14, fill: C.mut, anchor: "start" });
    txt(g, O.x + 18, O.y + 30, "you", { size: 14, fill: C.cy, anchor: "start", weight: 600 });

    var trail = sv("polyline", { points: "", fill: "none", stroke: "rgba(34,227,255,.5)", "stroke-width": 2, "stroke-dasharray": "3 6" }, g);
    var wake = sv("g", {}, g);
    var boat = boatIcon(g);
    boat.setAttribute("transform", "translate(" + O.x + "," + O.y + ")");
    sv("rect", { x: FR.x + 14, y: FR.y + 14, width: 150, height: 36, rx: 8, fill: "rgba(3,13,16,.8)", stroke: "rgba(62,240,160,.35)" }, g);
    var clock = txt(g, FR.x + 30, FR.y + 39, "T + 0 min", { size: 18, anchor: "start", fill: C.ok, cls: "nohalo" });
    frameEdge(root);

    var busy = false;
    function launch() {
      if (busy) return;
      if (!api.raw("b").trim()) { api.say("Fill in Bearing.", "bad"); return; }
      var b = parseBearing(api.raw("b"));
      if (isNaN(b)) { api.say("Bearing: write a true bearing such as 058° or a compass bearing such as N58°E.", "bad"); return; }
      var bad = api.check(["d", "t"]);
      if (bad) { api.say(bad, "bad"); return; }
      var d = api.val("d"), t = api.val("t");
      if (d <= 0 || d > 20) { api.say("Distance must be between 0 and 20 km.", "bad"); return; }
      if (t <= 0 || t > 60) { api.say("Time must be between 0 and 60 minutes.", "bad"); return; }
      busy = true;
      api.lock(true);
      var T = vec(b, d), Tp = mp(T), pts = [], frameN = 0;
      anim(2000, function (k) {
        var p = { x: O.x + (Tp.x - O.x) * k, y: O.y + (Tp.y - O.y) * k };
        boat.setAttribute("transform", "translate(" + p.x + "," + p.y + ") rotate(" + b + ")");
        pts.push(p.x + "," + p.y);
        trail.setAttribute("points", pts.join(" "));
        if (frameN++ % 6 === 0) wakeRing(wake, p);
        clock.textContent = "T + " + Math.floor(t * k) + " min";
      }, function () {
        clock.textContent = "T + " + fx(t, 0) + " min";
        var there = Math.hypot(T.x - P.e, T.y - P.n) <= 0.3, onTime = near(t, P.t, 0.6);
        if (there && onTime) {
          sv("circle", { cx: Qp.x, cy: Qp.y, r: 30, fill: "rgba(62,240,160,.45)", filter: "url(#lvp-glow-lg)" }, g);
          api.say("Aboard. The pickup ship hauls you in, right on time.", "good");
          api.win();
          return;
        }
        flashRed();
        var msg = !there ? "You ended up out at sea, away from the ship." : "Right place, but the ship expected you at a different time.";
        var left = api.useTry();
        if (!left) { api.reroll(msg + " Out of tries."); return; }
        api.say(msg, "bad");
        wait(1800, function () {
          pts = [];
          trail.setAttribute("points", "");
          wake.innerHTML = "";
          boat.setAttribute("transform", "translate(" + O.x + "," + O.y + ")");
          clock.textContent = "T + 0 min";
          busy = false;
          api.lock(false);
        });
      });
    }
    return { launch: launch };
  }

  /* ================================================================
   * Chapter registry
   * ================================================================ */

  var MIRROR_HINTS = [
    "Each leg of the beam is the hypotenuse of a right-angled triangle with the laser's angle.",
    "A mirror sends the beam away at the same angle it arrives, so every leg uses the same angle.",
    "Towards the ceiling or floor: horizontal run = vertical change ÷ tan θ. Towards a wall: vertical change = horizontal run × tan θ.",
    "Work leg by leg, in order, keeping track of where each leg starts.",
  ];

  function mirrorRound(k, title, task) {
    return {
      gen: function () { return genMirror(k); },
      build: levelMirror,
      panel: function (P) {
        return {
          kicker: "Reflection",
          title: title,
          task: task + " Beam stays hidden until you fire.",
          info: null,
          fields: P.seq.map(function (s, i) { return { id: "ABCD"[i], label: "Mirror " + "ABCD"[i], sub: SURF[s] + (flat(s) ? " · x" : " · h"), unit: "m" }; }),
          action: "Fire",
          tries: 3,
          triesLabel: "Charge",
          hints: MIRROR_HINTS,
        };
      },
    };
  }

  var CHAPTERS = [
    {
      tab: "1 Rooftops", sub: "inclination · depression · elevation", nextLabel: "Into the tower ▸",
      rounds: [
        {
          gen: genZip, build: levelZip,
          panel: function (P) {
            return {
              kicker: "Gradient & inclination",
              title: "Ridge to rooftop",
              task: "Pick a map anchor, then enter its <b>horizontal distance</b>, <b>inclination</b> and <b>cable length</b>.",
              info: ["Cable ≤ 400 m", "Inclination 10°–25°"],
              fields: [
                { id: "h", label: "Horizontal distance", unit: "m" },
                { id: "th", label: "Inclination", unit: "°" },
                { id: "L", label: "Cable length", unit: "m" },
              ],
              action: "Launch",
              hints: [
                "Real distance = map length × 10 000. Then change cm into m.",
                "Vertical distance = anchor height − rooftop height.",
                "Inclination: tan θ = vertical ÷ horizontal. The cable is the hypotenuse.",
                "Check every anchor against both rules before you choose.",
              ],
            };
          },
        },
        {
          gen: genRoof, build: levelRoof,
          panel: function (P) {
            return {
              kicker: "Angles of depression",
              title: "Rooftop to rooftop",
              task: "From A's roof: find the <b>gap</b>, <b>B's height</b> and the <b>cable</b> to B's roof.",
              info: null,
              fields: [
                { id: "d", label: "Horizontal distance", sub: "A to B", unit: "m" },
                { id: "hb", label: "Height of B", unit: "m" },
                { id: "L", label: "Cable length", sub: "A's roof to B's roof", unit: "m" },
              ],
              action: "Zip across",
              hints: [
                "Angles of depression are measured down from the horizontal at A's roof.",
                "Start with β: its triangle has A's full height as the vertical side. Horizontal = height ÷ tan β.",
                "Use α with the same horizontal distance to find how far B's roof is below A's roof.",
                "The cable is the hypotenuse of the α triangle.",
              ],
            };
          },
        },
        {
          gen: genGrapple, build: levelGrapple,
          panel: function (P) {
            return {
              kicker: "Angle of elevation",
              title: "Up to Crane Tower",
              task: "Aim the hook at the tower ledge: <b>angle of elevation</b> and <b>rope length</b>.",
              info: null,
              fields: [
                { id: "th", label: "Angle of elevation", unit: "°" },
                { id: "L", label: "Rope length", unit: "m" },
              ],
              action: "Fire hook",
              hints: [
                "Draw the right-angled triangle from you to the ledge.",
                "Vertical side = ledge height − your roof height.",
                "tan θ = vertical ÷ horizontal; the rope is the hypotenuse.",
              ],
            };
          },
        },
      ],
    },
    {
      tab: "2 Gallery", sub: "angles of depression", nextLabel: "To the vault ▸",
      rounds: [
        {
          gen: genCams, build: levelCams,
          panel: function (P) {
            return {
              kicker: "Angles of depression",
              title: "Drop between the cameras",
              task: "Drop at an <b>x</b> that <b>neither camera</b> can see. Cones appear only after you drop.",
              info: null,
              fields: [{ id: "x", label: "Drop point x", unit: "m" }],
              action: "Drop",
              tries: 3,
              hints: [
                "Each camera sees a strip of floor between its two rays.",
                "A ray with angle of depression θ from height h meets the floor h ÷ tan θ from that wall.",
                "Camera B is on the right wall: subtract its distances from the room width.",
                "Drop into the gap between the two strips.",
              ],
            };
          },
        },
        {
          gen: genShadow, build: levelShadow,
          panel: function (P) {
            return {
              kicker: "Angle of depression",
              title: "In the case's shadow",
              task: "Sight line clears the case top. Find its <b>angle of depression</b> and where it <b>meets the floor</b>.",
              info: null,
              fields: [
                { id: "al", label: "Angle of depression", unit: "°" },
                { id: "x", label: "Shadow ends at", sub: "x from the wall", unit: "m" },
              ],
              action: "Sneak",
              hints: [
                "Draw the line from the camera to the top back corner of the case.",
                "Down to the case top, the line drops (camera height − case height) over the distance to the case.",
                "Keep the same angle: with the full camera height you get where the line meets the floor.",
              ],
            };
          },
        },
      ],
    },
    {
      tab: "3 Mirrors", sub: "reflection", nextLabel: "Open the vault ▸",
      rounds: [
        mirrorRound(0, "Lock 1 · two mirrors", "Place A (ceiling) and B (floor) so the beam hits the right-wall sensor."),
        mirrorRound(1, "Lock 2 · three mirrors", "Place A–C (ceiling → right → floor) so the beam hits the left-wall sensor."),
        mirrorRound(2, "Lock 3 · four mirrors", "Place A–D (ceiling → right → floor → left) so the beam hits the ceiling sensor."),
      ],
    },
    {
      tab: "4 Harbour", sub: "bearings · shortest distance", nextLabel: "Finish the heist ▸",
      rounds: [
        {
          gen: genPatrol, build: levelPatrol,
          panel: function (P) {
            return {
              kicker: "Bearings · shortest distance",
              title: "Slip past the patrol",
              task: "Drop smoke <b>where and when</b> you pass closest to patrol H.",
              info: ["Course " + fmtB(P.c) + " · " + P.v + " km/h"],
              fields: [
                { id: "b", label: "Smoke bearing", sub: "from H", unit: "", ph: "e.g. 125° or S55°E" },
                { id: "d", label: "Distance", sub: "from H", unit: "km" },
                { id: "t", label: "Time", sub: "minutes from now", unit: "min" },
              ],
              action: "Launch drone",
              tries: 3,
              triesLabel: "Drones",
              hints: [
                "You pass closest to H at the foot of the perpendicular from H to your course.",
                "Find the angle between your course and the line from P back to H (the back bearing).",
                "Shortest distance = PH × sin(that angle); distance you travel = PH × cos(that angle).",
                "The bearing of the closest point from H is your course ± 90°.",
              ],
            };
          },
        },
        {
          gen: genPickup, build: levelPickup,
          panel: function (P) {
            return {
              kicker: "Bearings",
              title: "Meet the pickup ship",
              task: "Set <b>bearing</b>, <b>distance</b> and <b>arrival time</b> to reach Q.",
              info: ["Speed " + P.v + " km/h"],
              fields: [
                { id: "b", label: "Bearing", sub: "from you", unit: "", ph: "e.g. 058° or N58°E" },
                { id: "d", label: "Distance", unit: "km" },
                { id: "t", label: "Arrival time", sub: "minutes from now", unit: "min" },
              ],
              action: "Full speed",
              tries: 3,
              hints: [
                "You, L and Q form a right-angled triangle with the right angle at L.",
                "tan(angle at you) = east distance ÷ north distance. A bearing is measured clockwise from north.",
                "Distance by Pythagoras. Time = distance ÷ speed, then change hours into minutes.",
              ],
            };
          },
        },
      ],
    },
  ];

  /* ================================================================
   * Story — animated cutscenes
   * ================================================================ */

  var NAMES = { echo: "ECHO", crane: "SILAS CRANE", phantom: "PHANTOM" };
  var FACES = { echo: "echo-smile.png", crane: "collector-smug.png", phantom: "phantom-ready.png" };

  var OPENING = [
    { bg: "op-02-news.png", ken: "ken-a", music: "heist", lines: ["Tonight only: the Prism Heart diamond goes on show in Silas Crane's private tower."] },
    { bg: "op-03-collector.png", ken: "ken-b", who: "crane", lines: ["Lasers, cameras, a mirror vault. Nobody takes anything from Silas Crane."] },
    { bg: "op-04-call.png", ken: "ken-c", who: "echo", lines: ["Phantom, did you hear that? He's practically inviting us."] },
    { bg: "op-04-call-tease.png", who: "phantom", lines: ["Then let's accept the invitation."] },
  ];

  var STORY = [
    {
      card: { img: "ch1-rooftops.png", kicker: "Chapter 1", name: "The Rooftops", sub: "inclination · depression · elevation" },
      music: "heist",
      intro: [
        { bg: "ch1-ridge.png", ken: "ken-b", who: "echo", lines: ["No road to Crane Tower. Ridge, two rooftops, then the tower."] },
      ],
      between: [
        [{ bg: "ch1-rooftops.png", ken: "ken-a", who: "echo", lines: ["One roof down. The next one is lower."] }],
        [{ bg: "ch1-grapple.png", ken: "ken-c", who: "phantom", lines: ["Crane Tower is higher. Going up."] }],
      ],
      outro: [
        { bg: "op-03-collector.png", who: "crane", lines: ["Hm? Something on my roof? Just a bird, I'm sure."] },
      ],
    },
    {
      card: { img: "fl-2-gallery.png", kicker: "Chapter 2", name: "The Gallery", sub: "angles of depression" },
      music: "heist",
      intro: [
        { bg: "op-06-infiltrate.png", ken: "ken-a", lines: ["Through the roof hatch into Crane's private gallery."] },
        { bg: "fl-2-gallery.png", ken: "ken-c", who: "echo", lines: ["Two cameras. Find the blind spot."] },
      ],
      between: [
        [{ bg: "ch2-keycard.png", ken: "ken-b", who: "echo", lines: ["The guard dropped the vault keycard out past that glass case.", "Crawl to it. Stay in the case's shadow."] }],
      ],
      outro: [
        { bg: "ch2-keycard.png", who: "phantom", lines: ["Keycard. Next stop, the vault."] },
      ],
    },
    {
      card: { img: "fl-3-mirror.png", kicker: "Chapter 3", name: "The Mirror Vault", sub: "reflection" },
      music: "tension",
      intro: [
        { bg: "fl-4-vault.png", ken: "ken-b", lines: ["Three optical locks. Each opens only to its own laser."] },
      ],
      between: [
        [{ bg: "fl-3-mirror.png", ken: "ken-a", who: "echo", lines: ["Lock one open. This one needs a wall mirror too."] }],
        [{ bg: "fl-3-mirror.png", ken: "ken-c", who: "echo", lines: ["Last lock. Four mirrors."] }],
      ],
      outro: [
        { bg: "fl-4-vault.png", ken: "ken-a", lines: ["The last sensor flashes green. The vault door rolls open..."] },
        { bg: "prop-prism-heart.png", ken: "ken-c", who: "phantom", lines: ["The Prism Heart. Hello, beautiful."] },
        { bg: "op-04-call-alarm.png", sfx: "alarm", who: "echo", lines: ["Harbour patrol on the way! Get to the boat!"] },
      ],
    },
    {
      card: { img: "ch4-speedboat.png", kicker: "Chapter 4", name: "Harbour Escape", sub: "bearings · shortest distance", alert: true },
      music: "tension",
      intro: [
        { bg: "ch4-speedboat.png", ken: "ken-b", who: "echo", lines: ["Patrol boat ahead. I've hacked its drone."] },
      ],
      between: [
        [{ bg: "ch4-speedboat.png", ken: "ken-a", who: "echo", lines: ["We're past them! Now find the pickup ship."] }],
      ],
      outro: [],
    },
  ];

  var ENDING = [
    { bg: "end-laugh.png", ken: "ken-a", music: "triumph", who: "phantom", lines: ["The Prism Heart is ours!"] },
    { bg: "end-laugh.png", who: "echo", lines: ["Too easy!"] },
    { bg: "end-fake.png", ken: "ken-c", sfx: "hit", lines: ["...crack."] },
    { bg: "end-fake.png", who: "phantom", lines: ["Wait. This is... glass?"] },
    { bg: "op-03-collector.png", ken: "ken-b", who: "crane", lines: ["Nice maths, Phantom. But the real Prism Heart never left my side."] },
  ];

  /* Audio — procedural beds and effects (no files) ----------------- */

  var MUTE_KEY = "jm35-lvp-muted";
  var audio = { ctx: null, master: null, music: null, sfx: null, noise: null, bed: "", want: "", next: 0, k: 0, muted: false };
  try { audio.muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function stageVisible() { return !document.hidden && (document.fullscreenElement === stage || stage.offsetParent !== null); }

  function ensureAudio() {
    if (audio.ctx) {
      if (audio.ctx.state === "suspended" && stageVisible()) audio.ctx.resume();
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = audio.ctx = new Ctx();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    audio.master = ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.85;
    audio.master.connect(comp);
    audio.music = ctx.createGain();
    audio.music.gain.value = 0;
    audio.music.connect(audio.master);
    audio.sfx = ctx.createGain();
    audio.sfx.gain.value = 0.9;
    audio.sfx.connect(audio.master);
    var buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    if (audio.want) startBed(audio.want);
  }

  function tone(t, f, dur, o) {
    o = o || {};
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    var g = ctx.createGain();
    var a = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.02));
    var node = osc;
    if (o.lp) {
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.lp;
      osc.connect(lp);
      node = lp;
    }
    node.connect(g);
    g.connect(o.out || audio.music);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, o) {
    o = o || {};
    var ctx = audio.ctx;
    var src = ctx.createBufferSource();
    src.buffer = audio.noise;
    var f = ctx.createBiquadFilter();
    f.type = o.ft || "highpass";
    f.frequency.setValueAtTime(o.f || 6000, t);
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    if (o.q) f.Q.value = o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(o.gain || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out || audio.music);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  var BEDS = {
    heist: {
      bpm: 92, swing: 0.64, bars: 4, vol: 0.5,
      bass: [[38, 41, 45, 48], [34, 38, 41, 45], [31, 34, 38, 41], [33, 37, 40, 43]],
      chords: [[53, 57, 60, 64], [50, 53, 57, 62], [50, 53, 55, 58], [49, 52, 55, 57]],
      play: function (t, i, bar, e) {
        if (i % 2 === 0) {
          var m = this.bass[bar][i / 2];
          tone(t, mtof(m), e * 1.7, { type: "triangle", gain: 0.2, lp: 900 });
          tone(t, mtof(m - 12), e * 1.5, { type: "sine", gain: 0.1 });
        }
        noise(t, 0.05, { f: 7500, gain: i % 2 ? 0.04 : 0.022 });
        if (i === 2 || i === 6) noise(t, 0.16, { ft: "bandpass", f: 2200, q: 0.8, gain: 0.055 });
        if (i === 3 || i === 7) {
          this.chords[bar].forEach(function (c) { tone(t, mtof(c), 0.26, { type: "sine", gain: 0.03, lp: 2000 }); });
        }
        if (bar === 0 && i === 0) tone(t, mtof(74), e * 5, { type: "sine", gain: 0.045, a: 0.01 });
        if (bar === 2 && i === 4) tone(t, mtof(77), e * 3, { type: "sine", gain: 0.04, a: 0.01 });
        if (bar === 3 && i === 1) tone(t, mtof(76), e * 3, { type: "sine", gain: 0.04, a: 0.01 });
      },
    },
    tension: {
      bpm: 124, swing: 0.5, bars: 4, vol: 0.45,
      roots: [33, 33, 29, 31],
      play: function (t, i, bar, e) {
        var r = this.roots[bar];
        tone(t, mtof(r), e * 0.9, { type: "sawtooth", gain: i === 0 ? 0.15 : 0.085, lp: i % 2 ? 420 : 640 });
        noise(t, 0.03, { f: 9000, gain: 0.028 });
        if (i === 0) {
          tone(t, 90, 0.35, { to: 45, gain: 0.32 });
          tone(t, mtof(r + 36), e * 8, { type: "sawtooth", gain: 0.016, lp: 1400, a: 0.4 });
          tone(t, mtof(r + 43), e * 8, { type: "sawtooth", gain: 0.012, lp: 1400, a: 0.4, detune: 8 });
        }
        if (i === 4) noise(t, 0.12, { ft: "bandpass", f: 1500, gain: 0.05 });
      },
    },
    triumph: {
      bpm: 104, swing: 0.5, bars: 4, vol: 0.45,
      chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]],
      roots: [38, 35, 31, 33],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[i % 4] + (i >= 4 ? 12 : 0)), e * 1.6, { type: "triangle", gain: 0.055 });
        if (i % 2 === 0) tone(t, mtof(this.roots[bar]), e * 1.8, { type: "sine", gain: 0.18 });
        if (i === 0) ch.forEach(function (m) { tone(t, mtof(m - 12), e * 8, { type: "sine", gain: 0.022, a: 0.3 }); });
        noise(t, 0.04, { f: 8000, gain: 0.018 });
      },
    },
  };

  function setBed(name) {
    audio.want = name;
    if (!audio.ctx || audio.bed === name) return;
    startBed(name);
  }

  function startBed(name) {
    var ctx = audio.ctx, now = ctx.currentTime, g = audio.music.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + 0.35);
    audio.bed = name;
    audio.k = 0;
    audio.next = now + 0.4;
    g.setValueAtTime(0, now + 0.4);
    g.linearRampToValueAtTime(BEDS[name] ? BEDS[name].vol : 0, now + 1.2);
  }

  setInterval(function () {
    if (!audio.ctx || !audio.bed) return;
    if (!stageVisible()) {
      if (audio.ctx.state === "running") audio.ctx.suspend();
      return;
    }
    if (audio.ctx.state === "suspended") { audio.ctx.resume(); return; }
    var bed = BEDS[audio.bed];
    if (!bed) return;
    var now = audio.ctx.currentTime;
    var e = 60 / bed.bpm / 2;
    if (audio.next < now - 0.1) audio.next = now + 0.05;
    while (audio.next < now + 0.2) {
      var i = audio.k % 8;
      var bar = Math.floor(audio.k / 8) % bed.bars;
      bed.play(audio.next + (i % 2 ? e * (2 * bed.swing - 1) : 0), i, bar, e);
      audio.k++;
      audio.next += e;
    }
  }, 40);

  function sfxOn() { return audio.ctx && audio.ctx.state === "running"; }
  var SFX = {
    click: function () { if (sfxOn()) tone(audio.ctx.currentTime, 660, 0.06, { type: "triangle", gain: 0.05, out: audio.sfx }); },
    blip: function () { if (sfxOn()) tone(audio.ctx.currentTime, 1300 + Math.random() * 220, 0.025, { type: "square", gain: 0.01, lp: 3000, out: audio.sfx }); },
    alarm: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      for (var j = 0; j < 6; j++) tone(t + j * 0.16, j % 2 ? 620 : 880, 0.15, { type: "square", gain: 0.045, lp: 2600, out: audio.sfx });
    },
    win: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      [74, 78, 81, 86].forEach(function (m, j) { tone(t + j * 0.09, mtof(m), 0.5, { type: "triangle", gain: 0.08, out: audio.sfx }); });
    },
    whoosh: function () {
      if (sfxOn()) noise(audio.ctx.currentTime, 0.9, { ft: "bandpass", f: 400, fto: 3000, gain: 0.12, q: 0.7, out: audio.sfx });
    },
    hit: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      noise(t, 0.35, { f: 3500, gain: 0.16, out: audio.sfx });
      tone(t, 1900, 0.25, { type: "triangle", to: 700, gain: 0.05, out: audio.sfx });
    },
  };

  function setMuted(m) {
    audio.muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
    if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : 0.85, audio.ctx.currentTime, 0.05);
    var label = m ? "Sound off" : "Sound on";
    Array.prototype.forEach.call(stage.querySelectorAll(".snd"), function (b) { b.textContent = label; });
  }

  /* Cutscene layer -------------------------------------------------- */

  var cine = el("div", "lvc",
    '<img class="lvc-bg" alt=""><img class="lvc-bg" alt="">' +
    '<div class="lvc-vig"></div>' +
    '<div class="lvc-card"><p></p><div class="lvc-card-h"></div><span></span></div>' +
    '<div class="lvc-dialog"><div class="lvc-face"><img alt=""></div><div class="lvc-dbody"><div class="lvc-name"></div><p class="lvc-line"></p></div><span class="lvc-next">▼</span></div>' +
    '<div class="lvc-title" hidden></div>' +
    '<div class="lvc-tools"><button type="button" class="lvc-tool skip" hidden>Skip ▸▸</button><button type="button" class="lvc-tool snd"></button></div>');
  cine.hidden = true;
  stage.appendChild(cine);
  var bgs = cine.querySelectorAll(".lvc-bg");
  var cCard = cine.querySelector(".lvc-card");
  var dialog = cine.querySelector(".lvc-dialog");
  var dFace = cine.querySelector(".lvc-face");
  var dFaceImg = dFace.querySelector("img");
  var dName = cine.querySelector(".lvc-name");
  var dLine = cine.querySelector(".lvc-line");
  var cTitle = cine.querySelector(".lvc-title");
  var skipBtn = cine.querySelector(".skip");
  cine.querySelector(".snd").textContent = audio.muted ? "Sound off" : "Sound on";

  var talking = null, cineGen = 0;
  function cineLater(ms, fn) { var g = cineGen; setTimeout(function () { if (g === cineGen) fn(); }, ms); }

  var bgIdx = 0, bgName = "";
  function setBg(name, ken) {
    if (name === bgName && !ken) return;
    bgName = name;
    var cur = bgs[bgIdx], nxt = bgs[1 - bgIdx];
    bgIdx = 1 - bgIdx;
    var url = ART + name;
    var show = function () {
      nxt.className = "lvc-bg";
      void nxt.offsetWidth;
      nxt.className = "lvc-bg on" + (ken ? " " + ken : "");
      cur.classList.remove("on");
    };
    if (nxt.getAttribute("src") === url && nxt.complete) { show(); return; }
    nxt.onload = show;
    nxt.onerror = show;
    nxt.setAttribute("src", url);
  }

  function openCine() {
    gen++;
    cineGen++;
    talking = null;
    panel.innerHTML = "";
    board.innerHTML = "";
    cine.hidden = false;
    dialog.classList.remove("on");
    cCard.classList.remove("on");
    cTitle.hidden = true;
    skipBtn.hidden = true;
  }

  function talk(beats, done) {
    if (!beats.length) { done(); return; }
    var g = cineGen, bi = -1, li = 0, typing = null, text = "";
    var api = { advance: advance, skip: finish };
    talking = api;
    skipBtn.hidden = false;
    nextBeat();

    function nextBeat() {
      bi++;
      if (bi >= beats.length) { finish(); return; }
      var b = beats[bi];
      li = 0;
      if (b.bg) setBg(b.bg, b.ken);
      if (b.music) setBed(b.music);
      if (b.sfx && SFX[b.sfx]) SFX[b.sfx]();
      showLine();
    }

    function showLine() {
      var b = beats[bi], who = b.who || null;
      dialog.className = "lvc-dialog on" + (who ? " who-" + who : " narration");
      if (who) {
        dFace.hidden = false;
        dFaceImg.src = ART + FACES[who];
        dName.textContent = NAMES[who];
      } else {
        dFace.hidden = true;
      }
      type(b.lines[li]);
    }

    function type(s) {
      text = s;
      dLine.textContent = "";
      var n = 0;
      clearInterval(typing);
      typing = setInterval(function () {
        if (g !== cineGen) { clearInterval(typing); return; }
        n++;
        dLine.textContent = text.slice(0, n);
        if (n % 3 === 0) SFX.blip();
        if (n >= text.length) { clearInterval(typing); typing = null; }
      }, 22);
    }

    function advance() {
      if (talking !== api) return;
      if (typing) { clearInterval(typing); typing = null; dLine.textContent = text; return; }
      if (li < beats[bi].lines.length - 1) { li++; showLine(); return; }
      nextBeat();
    }

    function finish() {
      if (talking !== api) return;
      clearInterval(typing);
      talking = null;
      skipBtn.hidden = true;
      dialog.classList.remove("on");
      if (g === cineGen) done();
    }
  }

  function showCard(i, done) {
    var c = STORY[i].card;
    setBg(c.img, "ken-a");
    setBed(STORY[i].music);
    SFX.whoosh();
    cCard.className = "lvc-card" + (c.alert ? " alert" : "");
    cCard.querySelector("p").textContent = c.kicker;
    cCard.querySelector(".lvc-card-h").textContent = c.name;
    cCard.querySelector("span").textContent = c.sub;
    requestAnimationFrame(function () { cCard.classList.add("on"); });
    var ended = false;
    var api = { advance: end, skip: end };
    talking = api;
    skipBtn.hidden = false;
    cineLater(3000, end);
    function end() {
      if (ended || talking !== api) return;
      ended = true;
      talking = null;
      skipBtn.hidden = true;
      cCard.classList.remove("on");
      cineLater(400, done);
    }
  }

  function showTitleScreen(o) {
    cTitle.innerHTML =
      '<p class="lvc-kicker">' + o.kicker + "</p>" +
      '<div class="lvc-h">' + o.h + "</div>" +
      '<p class="lvc-sub">' + o.sub + "</p>" +
      '<button type="button" class="lvc-go">' + o.action + "</button>";
    cTitle.className = "lvc-title" + (o.cls ? " " + o.cls : "");
    cTitle.hidden = false;
    cTitle.querySelector(".lvc-go").addEventListener("click", function () { ensureAudio(); SFX.click(); o.onGo(); });
  }

  /* Flow ------------------------------------------------------------ */

  var current = -1;
  var tabBtns = [];
  var TEST = /[?&]lvtest\b/.test(location.search);

  function showTitle() {
    openCine();
    tabBtns.forEach(function (b) { b.classList.remove("on"); });
    setBg("op-01-title.png");
    setBed("heist");
    showTitleScreen({
      kicker: "JM35 · Trigonometry Heist",
      h: "Laser<span>Vault</span>",
      sub: "Tonight the Prism Heart diamond goes on show inside Silas Crane's laser-guarded tower. Four chapters, ten right-angled triangles, one perfect heist.",
      action: "Start the heist ▸",
      onGo: function () { cTitle.hidden = true; talk(OPENING, function () { playChapter(0); }); },
    });
  }

  function playChapter(i) {
    openCine();
    current = i;
    tabBtns.forEach(function (b, j) { b.classList.toggle("on", j === i); });
    showCard(i, function () { talk(STORY[i].intro, function () { openRound(i, 0); }); });
  }

  function chapterDone(i) {
    openCine();
    talk(STORY[i].outro, function () {
      if (i + 1 < STORY.length) { playChapter(i + 1); return; }
      talk(ENDING, showEnd);
    });
  }

  function showEnd() {
    tabBtns.forEach(function (b) { b.classList.remove("on"); });
    showTitleScreen({
      cls: "bottom",
      kicker: "Heist complete... or is it?",
      h: "To Be<span>Continued</span>",
      sub: "Inclination, depression, elevation, reflection and bearings: you cracked every triangle. Crane just cracked you.",
      action: "Replay with new numbers ▸",
      onGo: function () {
        tabBtns.forEach(function (b) { b.classList.remove("done"); });
        showTitle();
      },
    });
  }

  function roundDone(i, r) {
    if (r + 1 >= CHAPTERS[i].rounds.length) { chapterDone(i); return; }
    var beats = (STORY[i].between || [])[r];
    if (!beats || !beats.length) { openRound(i, r + 1); return; }
    openCine();
    talk(beats, function () { openRound(i, r + 1); });
  }

  // Every visit rolls fresh numbers, so a round cannot be passed by remembering answers.
  function openRound(i, r) {
    cineGen++;
    talking = null;
    cine.hidden = true;
    current = i;
    tabBtns.forEach(function (b, j) { b.classList.toggle("on", j === i); });
    var ch = CHAPTERS[i], rd = ch.rounds[r], last = r + 1 === ch.rounds.length;
    var P = rd.gen();
    var cfg = rd.panel(P);
    cfg.kicker = "Chapter " + (i + 1) + " · Round " + (r + 1) + "/" + ch.rounds.length + " · " + cfg.kicker;
    cfg.nextLabel = last ? ch.nextLabel : "Next round ▸";
    var handle = null, api = null;
    cfg.onAction = function () { if (handle) handle.launch(); };
    cfg.onNext = function () { roundDone(i, r); };
    cfg.onWin = function () { SFX.win(); if (last && tabBtns[i]) tabBtns[i].classList.add("done"); };
    cfg.onReroll = function (msg) {
      api.say(msg + "\nNew numbers coming up…", "bad");
      wait(2600, function () { openRound(i, r); });
    };
    api = buildPanel(cfg);
    handle = rd.build(api, P);
    if (TEST) window.__lvp = { chapter: i, round: r, P: P, open: openRound };
  }

  if (tabsEl) {
    CHAPTERS.forEach(function (ch, i) {
      var b = el("button", "lvp-tab", ch.tab + "<small>" + ch.sub + "</small>");
      b.type = "button";
      b.addEventListener("click", function () { ensureAudio(); playChapter(i); });
      tabsEl.appendChild(b);
      tabBtns.push(b);
    });
  }

  skipBtn.addEventListener("click", function (e) { e.stopPropagation(); if (talking) talking.skip(); });
  cine.querySelector(".lvc-tools .snd").addEventListener("click", function (e) { e.stopPropagation(); ensureAudio(); setMuted(!audio.muted); });
  stage.addEventListener("pointerdown", ensureAudio);
  cine.addEventListener("click", function (e) {
    if (!talking || (e.target.closest && e.target.closest(".lvc-tools, .lvc-title"))) return;
    talking.advance();
  });
  document.addEventListener("keydown", function (e) {
    if (!talking || !stageVisible()) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space" || e.key === " " || e.key === "Enter") { e.preventDefault(); talking.advance(); }
  });

  ["op-01-title.png", "op-02-news.png", "op-03-collector.png", "echo-smile.png", "collector-smug.png"].forEach(function (n) { new Image().src = ART + n; });
  showTitle();
})();
