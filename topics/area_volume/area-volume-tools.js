/* Area & Volume interactive tool — similar shapes & solids (drag to resize).
 *
 * Three labs, each merging a 2D shape with its matching 3D solid:
 *     Square   + Prism      Triangle + Pyramid      Circle + Sphere
 *
 * The learner DRAGS the figures (orange handles) to set the two lengths L1, L2.
 * From the line ratio we read the scale factor  k = L2 / L1,  then show how the
 * 2D base area scales by k^2 and the solid's volume scales by k^3.
 *
 * Colours match the Manim decks:  figure ① -> blue,  figure ② -> amber.
 * All maths renders as LaTeX via KaTeX (figure labels use SVG <foreignObject>).
 */
(function () {
  "use strict";

  const C = {
    a: "#4FC3F7",     // figure ① (blue)
    b: "#FFD54F",     // figure ② (amber)
    ab: "#81C784",    // ratios / k (green)
    grip: "#FF8A65",  // drag handle (orange)
    ink: "#e5e7eb",
    dim: "#94a3b8",
  };
  const NS = "http://www.w3.org/2000/svg";

  const PAL1 = { fill: C.a, stroke: "#bfe9ff", lab: C.a };
  const PAL2 = { fill: C.b, stroke: "#ffe9a3", lab: C.b };

  // ── geometry (svg user units) ──
  const UNIT = 20;
  const ROW1 = 175;   // baseline of the 2D shapes
  const ROW2 = 400;   // baseline of the 3D solids
  const CX1 = 145, CX2 = 375;
  const LMIN = 1, LMAX = 6;

  // ── small svg helpers ──
  function E(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function rectSvg(p, x, y, w, h, fill, op, stroke, sw) {
    p.appendChild(E("rect", { x, y, width: Math.max(0, w), height: Math.max(0, h), fill,
      "fill-opacity": op, stroke: stroke || fill, "stroke-width": sw == null ? 2 : sw }));
  }
  function polySvg(p, pts, fill, op, stroke, sw, dash) {
    const a = { points: pts.map((q) => q[0] + "," + q[1]).join(" "), fill,
      "fill-opacity": op, stroke: stroke || fill, "stroke-width": sw == null ? 2 : sw };
    if (dash) a["stroke-dasharray"] = dash;
    p.appendChild(E("polygon", a));
  }
  function lineSvg(p, x1, y1, x2, y2, col, w, dash) {
    const a = { x1, y1, x2, y2, stroke: col, "stroke-width": w || 2 };
    if (dash) a["stroke-dasharray"] = dash;
    p.appendChild(E("line", a));
  }
  function circleSvg(p, cx, cy, r, fill, op, stroke, sw) {
    p.appendChild(E("circle", { cx, cy, r: Math.max(0, r), fill, "fill-opacity": op,
      stroke: stroke || fill, "stroke-width": sw == null ? 2 : sw }));
  }
  function ellipseSvg(p, cx, cy, rx, ry, stroke, sw, dash) {
    const a = { cx, cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: "none",
      stroke, "stroke-width": sw || 1.5 };
    if (dash) a["stroke-dasharray"] = dash;
    p.appendChild(E("ellipse", a));
  }
  function halfEllipseSvg(p, cx, cy, rx, ry, lower, stroke, sw, dash) {
    const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 ${lower ? 1 : 0} ${cx + rx} ${cy}`;
    const a = { d, fill: "none", stroke, "stroke-width": sw || 1.5 };
    if (dash) a["stroke-dasharray"] = dash;
    p.appendChild(E("path", a));
  }
  // iPad / phone: WebKit (bug 23113) paints foreignObject content without the
  // svg's viewBox transform, so KaTeX labels drift to the top-left or vanish.
  // Workaround: position:fixed re-anchors the content to the foreignObject box,
  // with percentage sizes so flex centring still works. Desktop is untouched.
  function isTouchUI() {
    const de = document.documentElement;
    return de.classList.contains("tablet-touch") || de.classList.contains("phone-compact") ||
      window.innerWidth <= 767 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }
  function isAppleWebKit() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true; // iPadOS desktop UA
    return /AppleWebKit/.test(ua) && !/Chrome|CriOS|Edg|Android/.test(ua);
  }
  function anchorFO(fo, div, w, h) {
    if (!isTouchUI() || !isAppleWebKit()) return;
    // position:fixed re-anchors to the foreignObject box (WebKit bug 23113).
    // Pixel width/height are ignored (shrink-wrap), so centre with left/top 50%
    // + translate(-50%,-50%). Rewrite cssText in one shot — piecemeal style
    // updates are unreliable inside a foreignObject on WebKit.
    const color = div.style.color || "#e8eefc";
    const fs = parseFloat(div.style.fontSize) || 14;
    const svg = fo.ownerSVGElement;
    const paint = (s) => {
      div.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);" +
        "white-space:nowrap;display:flex;align-items:center;justify-content:center;" +
        "color:" + color + ";font-size:" + (fs * s) + "px;line-height:1;";
    };
    const apply = () => {
      const vb = svg && svg.viewBox && svg.viewBox.baseVal;
      const cw = svg ? svg.getBoundingClientRect().width : 0;
      if (!vb || !vb.width || !cw) { paint(1); return false; }
      paint(cw / vb.width);
      return true;
    };
    if (!apply() && typeof ResizeObserver !== "undefined" && svg) {
      const ro = new ResizeObserver(() => { if (apply()) ro.disconnect(); });
      ro.observe(svg);
    }
  }
  function tex(p, cx, cy, latex, color, size, w, h) {
    w = w || 110; h = h || 30;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    fo.setAttribute("overflow", "visible");
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;" +
      "justify-content:center;color:" + color + ";font-size:" + (size || 15) + "px;line-height:1;";
    try { katex.render(latex, div, { throwOnError: false, displayMode: false }); }
    catch (e) { div.textContent = latex; }
    fo.appendChild(div);
    p.appendChild(fo);
    anchorFO(fo, div, w, h);
  }
  const tc = (c, s) => `\\textcolor{${c}}{${s}}`;
  const f2 = (x) => (Number.isInteger(x) ? String(x) : (+x.toFixed(2)).toString());
  const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

  /* ─────────── lab registry (2D family, 3D family, area & volume) ─────────── */
  const LABS = {
    square: {
      twoD: "square", threeD: "prism",
      area: (L) => L * L,
      vol: (L) => L * L * L,
    },
    triangle: {
      twoD: "triangle", threeD: "pyramid",
      area: (L) => (Math.sqrt(3) / 4) * L * L,
      vol: (L) => (1 / 3) * ((Math.sqrt(3) / 4) * L * L) * L,
    },
    circle: {
      twoD: "circle", threeD: "sphere",
      area: (L) => Math.PI * (L / 2) * (L / 2),
      vol: (L) => (4 / 3) * Math.PI * Math.pow(L / 2, 3),
    },
  };

  /* ─────────── figure drawing ─────────── */
  function draw2D(svg, fam, cx, base, L, pal) {
    const s = L * UNIT;
    if (fam === "square") {
      rectSvg(svg, cx - s / 2, base - s, s, s, pal.fill, 0.45, pal.lab, 2);
    } else if (fam === "triangle") {
      const h = s * 0.866;
      polySvg(svg, [[cx - s / 2, base], [cx + s / 2, base], [cx, base - h]], pal.fill, 0.45, pal.lab, 2);
    } else if (fam === "circle") {
      const r = s / 2;
      circleSvg(svg, cx, base - r, r, pal.fill, 0.45, pal.lab, 2);
    }
  }

  function draw3D(svg, fam, cx, base, L, pal) {
    const s = L * UNIT;
    if (fam === "prism") {                 // cube, oblique
      const ox = s * 0.36, oy = s * 0.28;
      const A = [cx - s / 2, base], B = [cx + s / 2, base];
      const Cc = [cx + s / 2, base - s], D = [cx - s / 2, base - s];
      const Ct = [Cc[0] + ox, Cc[1] - oy], Dt = [D[0] + ox, D[1] - oy], Bt = [B[0] + ox, B[1] - oy];
      polySvg(svg, [D, Cc, Ct, Dt], pal.fill, 0.6, pal.lab, 2);    // top = base face
      polySvg(svg, [B, Cc, Ct, Bt], pal.fill, 0.30, pal.lab, 2);   // right
      polySvg(svg, [A, B, Cc, D], pal.fill, 0.5, pal.lab, 2);      // front
    } else if (fam === "pyramid") {        // triangular base, oblique
      const ox = s * 0.16, oy = s * 0.42, hp = s * 1.0;
      const FL = [cx - s / 2, base], FR = [cx + s / 2, base];
      const Bk = [(FL[0] + FR[0]) / 2 + ox, base - oy];
      const gx = (FL[0] + FR[0] + Bk[0]) / 3, gy = (FL[1] + FR[1] + Bk[1]) / 3;
      const apex = [gx, gy - hp];
      polySvg(svg, [FL, FR, Bk], pal.fill, 0.55, pal.lab, 2);      // base triangle
      lineSvg(svg, apex[0], apex[1], Bk[0], Bk[1], pal.stroke, 1.5, "5 4");
      lineSvg(svg, apex[0], apex[1], FL[0], FL[1], pal.lab, 2);
      lineSvg(svg, apex[0], apex[1], FR[0], FR[1], pal.lab, 2);
    } else if (fam === "sphere") {
      const r = s / 2, cy = base - r;
      const contour = pal.lab === C.a ? "#7ec8ea" : "#e8c45a";
      circleSvg(svg, cx, cy, r, pal.fill, 0.4, pal.lab, 2);
      ellipseSvg(svg, cx, cy, r, r * 0.30, contour, 1.5, "5 4");
    }
  }

  // dimension ruler with a draggable handle; `which` = 1 (controls L1) or 2 (L2)
  function ruler(svg, cx, base, L, pal, which) {
    const half = (L * UNIT) / 2, y = base + 14;
    lineSvg(svg, cx - half, y, cx + half, y, pal.lab, 1.3);
    lineSvg(svg, cx - half, y - 4, cx - half, y + 4, pal.lab, 1.3);
    lineSvg(svg, cx + half, y - 4, cx + half, y + 4, pal.lab, 1.3);
    tex(svg, cx, y + 15, `L_{${which}}=${f2(L)}`, pal.lab, 13, 100, 22);
    const g = E("circle", { cx: cx + half, cy: y, r: 5, fill: C.grip,
      stroke: "#fff", "stroke-width": 1.5, class: "handle" });
    g.dataset.which = which;
    svg.appendChild(g);
  }

  function renderTexAttrs(root) {
    (root || document).querySelectorAll("[data-tex]").forEach((el) => {
      try { katex.render(el.getAttribute("data-tex"), el, { throwOnError: false, displayMode: false }); }
      catch (e) {}
    });
  }
  function km(el, latex) {
    try { katex.render(latex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = latex; }
  }

  /* ─────────── step walkthrough panel ─────────── */
  // step 0 = givens only; 1 = scale factor k; 2 = area of ②; 3 = volume of ②
  const STEP_FOCUS = ["all", "all", "2d", "3d"];

  function buildSteps(container, lab, L1, L2, step) {
    clear(container);
    const L = LABS[lab];
    const k = L2 / L1, k2 = k * k, k3 = k * k * k;
    const A1 = L.area(L1), A2 = A1 * k2, V1 = L.vol(L1), V2 = V1 * k3;
    const A2txt = step >= 2 ? `${tc(C.ab, f1(A2))}\\,\\text{cm}^2` : "?";
    const V2txt = step >= 3 ? `${tc(C.ab, f1(V2))}\\,\\text{cm}^3` : "?";

    function card(active, idx, title, bodyLatex) {
      const c = document.createElement("div");
      c.className = "step-card" + (active ? " active" : "");
      const head = document.createElement("div");
      head.className = "step-head";
      const ix = document.createElement("span");
      ix.className = "step-index"; ix.textContent = idx;
      const tt = document.createElement("span");
      tt.className = "step-title"; tt.textContent = title;
      head.appendChild(ix); head.appendChild(tt);
      const body = document.createElement("div");
      body.className = "step-body";
      bodyLatex.forEach((ltx) => { const d = document.createElement("div"); d.className = "eq-line"; km(d, ltx); body.appendChild(d); });
      c.appendChild(head); c.appendChild(body);
      container.appendChild(c);
    }

    // Given card (always)
    card(step === 0, "✓", "Given", [
      `${tc(C.a, "①")}\\;\\; L_1=${tc(C.a, f1(L1))}\\;\\Rightarrow\\; A_1=${f1(A1)}\\,\\text{cm}^2,\\; V_1=${f1(V1)}\\,\\text{cm}^3`,
      `${tc(C.b, "②")}\\;\\; L_2=${tc(C.b, f1(L2))}\\;\\Rightarrow\\; A_2=${A2txt},\\; V_2=${V2txt}`,
    ]);

    if (step >= 1) card(step === 1, "1", "Scale factor k", [
      `k=\\dfrac{L_2}{L_1}=\\dfrac{${tc(C.b, f1(L2))}}{${tc(C.a, f1(L1))}}=${tc(C.ab, f2(k))}`,
    ]);
    if (step >= 2) card(step === 2, "2", "Area of ② = k² × A₁", [
      `A_2=${tc(C.ab, "k^2")}\\times A_1=${f2(k)}^2\\times ${f1(A1)}`,
      `\\;\\;\\;=${tc(C.ab, f2(k2))}\\times ${f1(A1)}=${tc(C.ab, f1(A2))}\\,\\text{cm}^2`,
    ]);
    if (step >= 3) card(step === 3, "3", "Volume of ② = k³ × V₁", [
      `V_2=${tc(C.ab, "k^3")}\\times V_1=${f2(k)}^3\\times ${f1(V1)}`,
      `\\;\\;\\;=${tc(C.ab, f2(k3))}\\times ${f1(V1)}=${tc(C.ab, f1(V2))}\\,\\text{cm}^3`,
    ]);
  }

  /* ─────────── tool wiring (drag + steps) ─────────── */
  function initTools() {
    const svg = document.getElementById("tool-svg");
    const stepsBox = document.getElementById("tool-steps");
    const backBtn = document.getElementById("step-back");
    const nextBtn = document.getElementById("step-next");
    const progress = document.getElementById("step-progress");
    const labBtns = document.querySelectorAll("[data-lab]");
    const resetBtn = document.getElementById("tool-reset");
    const state = { lab: "square", L1: 2, L2: 3, step: 0 };
    let dragging = null;

    function group(opacity) { return E("g", { opacity }); }

    function redraw() {
      const L = LABS[state.lab];
      const focus = STEP_FOCUS[state.step];
      const op2d = focus === "3d" ? 0.25 : 1;
      const op3d = focus === "2d" ? 0.25 : 1;
      clear(svg);
      // captions
      tex(svg, 260, 22, `\\textcolor{${C.dim}}{\\text{Flat shape} \\rightarrow \\text{area} = k^2}`, C.dim, 14, 320, 24);
      tex(svg, 260, 236, `\\textcolor{${C.dim}}{\\text{Solid} \\rightarrow \\text{volume} = k^3}`, C.dim, 14, 320, 24);
      lineSvg(svg, 24, 224, 496, 224, C.dim, 1, "3 5");
      // 2D row (area)
      const g2 = group(op2d); svg.appendChild(g2);
      draw2D(g2, L.twoD, CX1, ROW1, state.L1, PAL1);
      draw2D(g2, L.twoD, CX2, ROW1, state.L2, PAL2);
      ruler(g2, CX1, ROW1, state.L1, PAL1, 1);
      ruler(g2, CX2, ROW1, state.L2, PAL2, 2);
      // 3D row (volume)
      const g3 = group(op3d); svg.appendChild(g3);
      draw3D(g3, L.threeD, CX1, ROW2, state.L1, PAL1);
      draw3D(g3, L.threeD, CX2, ROW2, state.L2, PAL2);
      ruler(g3, CX1, ROW2, state.L1, PAL1, 1);
      ruler(g3, CX2, ROW2, state.L2, PAL2, 2);
      attachHandles();
      // panel
      buildSteps(stepsBox, state.lab, state.L1, state.L2, state.step);
      backBtn.disabled = state.step === 0;
      nextBtn.disabled = state.step === 3;
      progress.textContent = state.step === 0 ? "Drag, then Next" : "Step " + state.step + " / 3";
    }

    function svgPoint(evt) {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    function attachHandles() {
      svg.querySelectorAll(".handle").forEach((h) => {
        h.addEventListener("pointerdown", (e) => { dragging = +h.dataset.which; e.preventDefault(); });
      });
    }
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const p = svgPoint(e);
      const cx = dragging === 1 ? CX1 : CX2;
      let L = (2 * (p.x - cx)) / UNIT;
      L = Math.round(L * 2) / 2;                 // snap to 0.5
      L = Math.min(LMAX, Math.max(LMIN, L));
      if (L !== state["L" + dragging]) { state["L" + dragging] = L; state.step = 0; redraw(); }
    });
    window.addEventListener("pointerup", () => { dragging = null; });

    nextBtn.addEventListener("click", () => { if (state.step < 3) { state.step++; redraw(); } });
    backBtn.addEventListener("click", () => { if (state.step > 0) { state.step--; redraw(); } });
    labBtns.forEach((b) => b.addEventListener("click", () => {
      state.lab = b.dataset.lab; state.step = 0;
      labBtns.forEach((x) => x.classList.toggle("active", x === b));
      redraw();
    }));
    if (resetBtn) resetBtn.addEventListener("click", () => {
      state.L1 = 2; state.L2 = 3; state.step = 0; redraw();
    });

    redraw();
  }

  function initTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = {
      slides: document.getElementById("panel-slides"),
      tools: document.getElementById("panel-tools"),
      game: document.getElementById("panel-game"),
      comics: document.getElementById("panel-comics"),
      quiz: document.getElementById("panel-quiz"),
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      for (const k in panels) { if (panels[k]) panels[k].classList.toggle("hidden", k !== t.dataset.tab); }
      if (window.AVGame && t.dataset.tab === "game") window.AVGame.show();
    }));
  }
  function initDecks() {
    const frame = document.getElementById("deck-frame");
    const btns = document.querySelectorAll("[data-deck]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("active", x === b));
      frame.src = b.dataset.deck;
    }));
    if (window.KOCDeckTouch) window.KOCDeckTouch.initDeckTouchNav(frame);
  }

  function start() {
    if (window.KOCDeckTouch) {
      window.KOCDeckTouch.initTabletClass();
      window.KOCDeckTouch.initTabletMode();
    }
    renderTexAttrs(); initTabs(); initDecks(); initTools();
  }
  if (window.katex) { window.addEventListener("DOMContentLoaded", start); }
  else { window.addEventListener("DOMContentLoaded", () => {
    (function wait() { if (window.katex) start(); else setTimeout(wait, 30); })();
  }); }
})();
