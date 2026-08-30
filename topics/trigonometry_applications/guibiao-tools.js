(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  /* Layout: 表 further right so 圭 is long; Sun stays on the RIGHT */
  var GROUND_Y = 330;
  var POST_X = 400;
  var POST_H = 120;
  var POST_TOP = GROUND_Y - POST_H;
  var GUI_LEFT = 36;
  var GUI_RIGHT = 620;
  var VB_W = 700;
  var VB_H = 420;
  /* Fixed noon azimuth: Sun only moves vertically on this line */
  var SUN_X = 470;

  var COL = {
    ink: "#27364a",
    muted: "#5c6578",
    line: "#234e70",
    vertex: "#6b7280",
    stone: "#c8d0d8",
    stoneLight: "#d8dee5",
    stoneEdge: "#6b7785",
    ground: "#e6edf2",
    shadow: "#3a4450",
  };

  var SEASONS = [
    { id: "xiazhi", label: "夏至", alt: 62, color: COL.muted },
    { id: "chunfen", label: "春分", alt: 45, color: COL.muted },
    { id: "qiufen", label: "秋分", alt: 45, color: COL.muted },
    { id: "dongzhi", label: "冬至", alt: 26, color: COL.muted },
  ];

  var sun = { x: SUN_X, y: 70 };
  var drag = null;
  var sunAnim = null;
  var svg;

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function fmt(n) { return (Math.round(n * 10) / 10).toFixed(1); }

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

  function shadowFromAltitude(altDeg) {
    return POST_H / Math.tan(rad(altDeg));
  }

  /** Tip of shadow on the ground for a given altitude (to the LEFT of 表). */
  function tipXFromAltitude(altDeg) {
    return POST_X - shadowFromAltitude(altDeg);
  }

  /**
   * One straight ray: Sun → through tip of 表 → hit ground.
   * tip.x is the shadow tip.
   */
  function rayHitGround(sx, sy) {
    var dy = POST_TOP - sy;
    if (Math.abs(dy) < 1e-6) return null;
    var t = (GROUND_Y - sy) / dy;
    if (t <= 1) return null; /* must pass through post tip then continue to ground */
    var tipX = sx + t * (POST_X - sx);
    return { tipX: tipX, t: t };
  }

  function tipXFromRay(sx, sy) {
    var hit = rayHitGround(sx, sy);
    return hit ? hit.tipX : null;
  }

  /** Shadow tip must stay on the 圭 bar. */
  function tipLimits() {
    return {
      min: GUI_LEFT + 8,                          /* longest shadow — left end of 圭 */
      max: tipXFromAltitude(72),                  /* shortest — still on 圭, near 表 */
    };
  }

  function yFromTip(tipX) {
    var dx = POST_X - SUN_X;
    var k = (tipX - SUN_X) / dx;
    if (Math.abs(k - 1) < 1e-6) return 58;
    return (k * POST_TOP - GROUND_Y) / (k - 1);
  }

  /** Noon: azimuth fixed — only altitude (y); keep shadow tip on 圭. */
  function clampSun() {
    sun.x = SUN_X;
    var lim = tipLimits();
    var yLo = yFromTip(lim.max); /* high Sun → short shadow → tip near 表 → smaller y */
    var yHi = yFromTip(lim.min); /* low Sun → long shadow → tip near left of 圭 → larger y */
    var lo = Math.min(yLo, yHi);
    var hi = Math.max(yLo, yHi);
    sun.y = Math.max(lo, Math.min(hi, sun.y));
    /* Snap tip onto 圭 if float error pushes it off */
    var tip = tipXFromRay(sun.x, sun.y);
    if (tip != null) {
      if (tip < lim.min) sun.y = yFromTip(lim.min);
      if (tip > lim.max) sun.y = yFromTip(lim.max);
    }
  }

  /** Place Sun at fixed x so the ray through 表 tip hits tipX. */
  function placeSunOnRay(tipX) {
    var lim = tipLimits();
    tipX = Math.max(lim.min, Math.min(lim.max, tipX));
    sun.x = SUN_X;
    sun.y = yFromTip(tipX);
    clampSun();
  }

  function metricsFromSun() {
    sun.x = SUN_X;
    var tipX = tipXFromRay(sun.x, sun.y);
    if (tipX == null) {
      return { shadow: 0, alt: 90, tipX: POST_X, valid: false };
    }
    var shadow = POST_X - tipX;
    var alt = shadow > 1 ? deg(Math.atan(POST_H / shadow)) : 89;
    return { shadow: Math.max(shadow, 0), alt: alt, tipX: tipX, valid: tipX < POST_X - 2 };
  }

  /** Set altitude by moving Sun up/down only. */
  function sunFromAltitude(altDeg) {
    placeSunOnRay(tipXFromAltitude(altDeg));
  }

  function seasonMarks() {
    var out = [];
    var seenEquinox = false;
    SEASONS.forEach(function (s) {
      if ((s.id === "chunfen" || s.id === "qiufen") && seenEquinox) return;
      if (s.id === "chunfen" || s.id === "qiufen") seenEquinox = true;
      out.push({
        id: s.id,
        label: s.id === "chunfen" || s.id === "qiufen" ? "春分 · 秋分" : s.label,
        color: s.color,
        alt: s.alt,
        x: tipXFromAltitude(s.alt),
      });
    });
    return out;
  }

  function nearestSeason(tipX) {
    var marks = seasonMarks();
    var best = null;
    var bestD = Infinity;
    marks.forEach(function (m) {
      var d = Math.abs(tipX - m.x);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    });
    return bestD < 14 ? best : null;
  }

  function arrowHead(x1, y1, x2, y2, size) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var a1 = ang + Math.PI * 0.82;
    var a2 = ang - Math.PI * 0.82;
    return "M " + x2 + " " + y2 +
      " L " + (x2 + size * Math.cos(a1)) + " " + (y2 + size * Math.sin(a1)) +
      " M " + x2 + " " + y2 +
      " L " + (x2 + size * Math.cos(a2)) + " " + (y2 + size * Math.sin(a2));
  }

  var scene = null;
  var formulaReady = false;

  function setVal(id, text, flash) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.textContent === text) return;
    el.textContent = text;
    if (!flash) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  function ensureScene() {
    if (scene && svg.contains(scene.shadow)) return scene;

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var marks = seasonMarks();

    var defs = E("defs", {});
    var sky = E("linearGradient", { id: "gb-sky", x1: "0", y1: "0", x2: "0", y2: "1" });
    sky.appendChild(E("stop", { offset: "0%", "stop-color": "#8ec8e8" }));
    sky.appendChild(E("stop", { offset: "55%", "stop-color": "#c5e6f6" }));
    sky.appendChild(E("stop", { offset: "100%", "stop-color": "#e4f3fb" }));
    defs.appendChild(sky);
    svg.appendChild(defs);

    svg.appendChild(E("rect", { x: 0, y: 0, width: VB_W, height: GROUND_Y, fill: "url(#gb-sky)" }));
    svg.appendChild(E("rect", { x: 0, y: GROUND_Y, width: VB_W, height: VB_H - GROUND_Y, fill: COL.ground }));

    svg.appendChild(E("rect", {
      x: GUI_LEFT, y: GROUND_Y - 12, width: POST_X - GUI_LEFT + 28, height: 20,
      rx: 4, fill: COL.stone, stroke: COL.stoneEdge, "stroke-width": 1.6,
    }));

    marks.forEach(function (mk) {
      svg.appendChild(E("line", {
        x1: mk.x, y1: GROUND_Y + 8, x2: mk.x, y2: GROUND_Y + 22,
        stroke: COL.muted, "stroke-width": 2.5, opacity: 0.95,
      }));
      var t = E("text", {
        x: mk.x, y: GROUND_Y + 38,
        fill: COL.ink, "font-size": 12, "font-weight": 700, "text-anchor": "middle",
      });
      t.textContent = mk.label;
      svg.appendChild(t);
    });
    var guiLbl = E("text", {
      x: GUI_LEFT + 8, y: GROUND_Y + 58,
      fill: COL.ink, "font-size": 15, "font-weight": 700, "text-anchor": "start",
    });
    guiLbl.textContent = "圭";
    svg.appendChild(guiLbl);

    var shadow = E("rect", {
      x: 0, y: GROUND_Y - 12, width: 1, height: 20,
      fill: COL.shadow, opacity: "0.72",
    });
    var shadowHi = E("rect", {
      x: 0, y: GROUND_Y - 12, width: 1, height: 6,
      fill: "#1e2937", opacity: "0.28",
    });
    var tip = E("circle", {
      cx: 0, cy: GROUND_Y - 2, r: 4, fill: COL.vertex, stroke: "#fff", "stroke-width": 1.2,
    });
    svg.appendChild(shadow);
    svg.appendChild(shadowHi);
    svg.appendChild(tip);

    svg.appendChild(E("rect", {
      x: POST_X - 8, y: POST_TOP, width: 16, height: POST_H,
      fill: COL.stoneLight, stroke: COL.stoneEdge, "stroke-width": 1.6,
    }));
    svg.appendChild(E("circle", {
      cx: POST_X, cy: POST_TOP, r: 4, fill: COL.vertex, stroke: "#fff", "stroke-width": 1.2,
    }));
    var biaoLbl = E("text", {
      x: POST_X + 20, y: POST_TOP + 18,
      fill: COL.ink, "font-size": 14, "font-weight": 700,
    });
    biaoLbl.textContent = "表";
    svg.appendChild(biaoLbl);

    var ray = E("line", {
      x1: SUN_X, y1: 70, x2: POST_X, y2: GROUND_Y - 2,
      stroke: "#fde047", "stroke-width": 2.5, opacity: 0.95,
    });
    var rayHead = E("path", {
      d: "M 0 0", stroke: "#fde047", "stroke-width": 2.5, fill: "none",
    });
    svg.appendChild(ray);
    svg.appendChild(rayHead);
    svg.appendChild(E("circle", {
      cx: POST_X, cy: POST_TOP, r: 7, fill: "none", stroke: "#fde047", "stroke-width": 1.5, opacity: 0.7,
    }));

    var sDash = E("line", {
      x1: 0, y1: GROUND_Y - 12, x2: POST_X, y2: GROUND_Y - 12,
      stroke: COL.line, "stroke-width": 2, "stroke-dasharray": "5 4",
    });
    svg.appendChild(sDash);
    svg.appendChild(E("line", {
      x1: POST_X, y1: GROUND_Y - 12, x2: POST_X, y2: POST_TOP,
      stroke: COL.line, "stroke-width": 2, "stroke-dasharray": "5 4",
    }));
    svg.appendChild(E("path", {
      d: "M " + (POST_X - 14) + " " + (GROUND_Y - 12) +
        " L " + (POST_X - 14) + " " + (GROUND_Y - 26) +
        " L " + POST_X + " " + (GROUND_Y - 26),
      fill: "none", stroke: COL.line, "stroke-width": 1.8,
    }));

    var sLbl = E("text", {
      x: POST_X, y: GROUND_Y - 22,
      fill: COL.ink, "font-size": 14, "font-weight": 700, "text-anchor": "middle",
    });
    sLbl.textContent = "s";
    svg.appendChild(sLbl);

    var hl = E("text", {
      x: POST_X + 22, y: (POST_TOP + GROUND_Y - 12) / 2 + 5,
      fill: COL.ink, "font-size": 16, "font-weight": 800,
    });
    hl.textContent = "H";
    svg.appendChild(hl);
    var hlSub = E("text", {
      x: POST_X + 22, y: (POST_TOP + GROUND_Y - 12) / 2 + 20,
      fill: COL.muted, "font-size": 11, "font-weight": 600,
    });
    hlSub.textContent = "(height of 表)";
    svg.appendChild(hlSub);

    var thetaArc = E("path", {
      d: "M 0 0", fill: "none", stroke: COL.line, "stroke-width": 1.8,
    });
    var thetaLbl = E("text", {
      x: 0, y: GROUND_Y - 18,
      fill: COL.ink, "font-size": 13, "font-weight": 700,
    });
    thetaLbl.textContent = "θ";
    svg.appendChild(thetaArc);
    svg.appendChild(thetaLbl);

    var sunGlow = E("circle", {
      cx: SUN_X, cy: 70, r: 30, fill: "rgba(253,224,71,.2)",
    });
    var sunDisk = E("circle", {
      cx: SUN_X, cy: 70, r: 18,
      fill: "#fde047", stroke: "#f59e0b", "stroke-width": 2,
      style: "cursor: grab",
    });
    var sunLbl = E("text", {
      x: SUN_X, y: 42,
      fill: "#b45309", "font-size": 13, "font-weight": 700, "text-anchor": "middle",
    });
    sunLbl.textContent = "Sun (drag ↑↓)";
    svg.appendChild(sunGlow);
    svg.appendChild(sunDisk);
    svg.appendChild(sunLbl);

    scene = {
      shadow: shadow,
      shadowHi: shadowHi,
      tip: tip,
      ray: ray,
      rayHead: rayHead,
      sDash: sDash,
      sLbl: sLbl,
      thetaArc: thetaArc,
      thetaLbl: thetaLbl,
      sunGlow: sunGlow,
      sunDisk: sunDisk,
      sunLbl: sunLbl,
    };
    return scene;
  }

  function paint(flashStats) {
    var s = ensureScene();
    var m = metricsFromSun();
    var tipX = m.tipX;
    var shW = Math.max(POST_X - tipX, 0);

    s.shadow.setAttribute("x", tipX);
    s.shadow.setAttribute("width", shW);
    s.shadowHi.setAttribute("x", tipX);
    s.shadowHi.setAttribute("width", shW);
    s.tip.setAttribute("cx", tipX);

    s.ray.setAttribute("x1", sun.x);
    s.ray.setAttribute("y1", sun.y);
    s.ray.setAttribute("x2", tipX);
    s.ray.setAttribute("y2", GROUND_Y - 2);
    s.rayHead.setAttribute("d", arrowHead(sun.x, sun.y, tipX, GROUND_Y - 2, 11));

    s.sDash.setAttribute("x1", tipX);
    s.sLbl.setAttribute("x", (tipX + POST_X) / 2);

    var arcR = 36;
    var th = rad(m.alt);
    s.thetaArc.setAttribute("d",
      "M " + (tipX + arcR) + " " + (GROUND_Y - 6) +
      " A " + arcR + " " + arcR + " 0 0 0 " +
      (tipX + arcR * Math.cos(th)) + " " + (GROUND_Y - 6 - arcR * Math.sin(th)));
    s.thetaLbl.setAttribute("x", tipX + arcR + 8);

    s.sunGlow.setAttribute("cy", sun.y);
    s.sunDisk.setAttribute("cy", sun.y);
    s.sunLbl.setAttribute("y", sun.y - 28);

    setVal("gb-alt", fmt(m.alt) + "°", flashStats);
    setVal("gb-shadow", fmt(m.shadow / 10) + " units", flashStats);
    setVal("gb-tan", fmt(Math.tan(rad(m.alt))), flashStats);

    if (!formulaReady) {
      var form = document.getElementById("gb-formula");
      if (form) {
        form.innerHTML =
          "\\(\\tan\\theta = \\dfrac{H}{s} \\quad\\Rightarrow\\quad s = \\dfrac{H}{\\tan\\theta}\\)";
        renderKatex(form);
        formulaReady = true;
      }
    }

    var near = nearestSeason(tipX);
    var seasonEl = document.getElementById("gb-season");
    var fb = document.getElementById("gb-season-fb");
    SEASONS.forEach(function (s) {
      var b = document.getElementById("badge-" + s.id);
      if (!b) return;
      var on = false;
      if (near) {
        if (near.id === "chunfen" || near.label === "春分 · 秋分") {
          on = s.id === "chunfen" || s.id === "qiufen";
        } else {
          on = near.id === s.id;
        }
      }
      b.classList.toggle("on", on);
    });
    if (near) {
      if (seasonEl) seasonEl.textContent = near.label;
      if (fb) {
        fb.className = "feedback ok";
        fb.textContent = "Shadow tip is on the “" + near.label + "” mark — that is how the 圭表 reads the season.";
      }
    } else {
      if (seasonEl) seasonEl.textContent = "—";
      if (fb) {
        fb.className = "feedback";
        fb.textContent = "Drag the Sun until the shadow tip lines up with a season mark.";
      }
    }
  }

  function pt(e) {
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    return {
      x: (e.clientX - r.left) * (vb.width / r.width),
      y: (e.clientY - r.top) * (vb.height / r.height),
    };
  }

  function bindDrag() {
    svg.addEventListener("pointerdown", function (e) {
      var p = pt(e);
      if (Math.hypot(p.x - sun.x, p.y - sun.y) > 36) return;
      if (sunAnim) {
        cancelAnimationFrame(sunAnim);
        sunAnim = null;
      }
      drag = { oy: p.y - sun.y };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = pt(e);
      sun.x = SUN_X;
      sun.y = p.y - drag.oy;
      clampSun();
      paint(false);
    });
    function end() { drag = null; }
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  function easeInOutCubic(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  function initGuibiao() {
    svg = document.getElementById("gb-svg");
    if (!svg) return;
    sunFromAltitude(45);
    bindDrag();
    paint(false);

    function animateSunToAlt(altDeg) {
      var startTip = metricsFromSun().tipX;
      var endTip = tipXFromAltitude(altDeg);
      if (sunAnim) cancelAnimationFrame(sunAnim);
      var t0 = performance.now();
      var dur = 720;
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        placeSunOnRay(startTip + (endTip - startTip) * easeInOutCubic(p));
        paint(false);
        if (p < 1) {
          sunAnim = requestAnimationFrame(tick);
        } else {
          sunAnim = null;
          placeSunOnRay(endTip);
          paint(true);
        }
      }
      sunAnim = requestAnimationFrame(tick);
    }

    SEASONS.forEach(function (s) {
      var btn = document.getElementById("gb-preset-" + s.id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        animateSunToAlt(s.alt);
      });
    });

    if (window.initJmStepper) window.initJmStepper("gb-intro");
    renderKatex(document.getElementById("panel-tools"));
  }

  window.initGuibiaoLab = initGuibiao;
})();
