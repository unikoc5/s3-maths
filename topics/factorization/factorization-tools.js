/* Factorization interactive tools — area-model widgets + cross-method.
 * Consistent colours with the Manim slides:
 *   x/a -> blue   b -> amber   ab / middle-term -> green   removed -> red
 * ALL maths/symbols render as LaTeX via KaTeX (figure labels use SVG <foreignObject>).
 */
(function () {
  "use strict";

  // Light-theme palette: bright fills for cells, darker inks for labels/equations.
  const C = {
    a: "#0277BD",      // a / x — text on white
    b: "#9A7209",      // b — text on white (was pale #FFD54F)
    ab: "#2E7D32",     // ab / middle — text on white
    aFill: "#4FC3F7",  // cell / swatch fill
    bFill: "#FFD54F",
    abFill: "#81C784",
    rm: "#C62828",     // removed / minus (darker for light bg)
    ink: "#2c2420",
    dim: "#5d544f",
    cellA: "#06283d",  // dark text on blue fill
    cellAB: "#11321d", // dark text on green fill
    cellB: "#3a2f06",  // dark text on amber fill
  };
  const NS = "http://www.w3.org/2000/svg";
  const TABLET_MAX_W = 1366;
  const PHONE_MAX_W = 767;
  const deckTouch = () => window.KOCDeckTouch;
  let phoneCompactBound = false;
  const phoneCompactCallbacks = [];

  function isTouchTabletDevice() {
    const D = deckTouch();
    if (D) return D.isTouchTabletDevice();
    if (navigator.maxTouchPoints < 1) return false;
    const w = window.innerWidth;
    if (w < 768 || w > TABLET_MAX_W) return false;
    const ua = navigator.userAgent || "";
    if (/iPad/i.test(ua)) return true;
    if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    if (window.matchMedia("(hover: none)").matches) return true;
    return false;
  }

  function isTabletTouch() {
    const D = deckTouch();
    return D ? D.isTabletTouch() : document.documentElement.classList.contains("tablet-touch");
  }

  function initTabletMode(onChange) {
    const D = deckTouch();
    if (D) { D.initTabletMode(onChange); return; }
    function apply() {
      document.documentElement.classList.toggle("tablet-touch", isTouchTabletDevice());
      if (onChange) onChange();
    }
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", () => setTimeout(apply, 120));
  }

  function isPhoneCompact() { return window.innerWidth <= PHONE_MAX_W; }
  function isTouchUI() { return isTabletTouch() || isPhoneCompact(); }

  function initPhoneCompact(onChange) {
    if (onChange) phoneCompactCallbacks.push(onChange);
    function apply() {
      document.documentElement.classList.toggle("phone-compact", isPhoneCompact());
      phoneCompactCallbacks.forEach((cb) => cb());
    }
    apply();
    if (!phoneCompactBound) {
      phoneCompactBound = true;
      window.addEventListener("resize", apply);
      window.addEventListener("orientationchange", () => setTimeout(apply, 120));
    }
  }

  function svgRoot(el) {
    if (!el) return null;
    if (el.ownerSVGElement) return el.ownerSVGElement;
    if (el.tagName === "svg") return el;
    return el.closest ? el.closest("svg") : null;
  }

  function labelScale(svg) {
    if (!isPhoneCompact()) return 1;
    const root = svgRoot(svg);
    const w = root && root.getBoundingClientRect ? root.getBoundingClientRect().width : window.innerWidth - 48;
    return Math.max(0.55, Math.min(0.85, w / 400));
  }

  function phoneTexSize(base, svg) {
    const root = svgRoot(svg);
    const vbW = root && root.viewBox && root.viewBox.baseVal ? root.viewBox.baseVal.width : 410;
    const renderW = root && root.getBoundingClientRect ? root.getBoundingClientRect().width : vbW;
    const targetScreenPx = 15;
    const screenPx = base * (renderW / vbW);
    if (screenPx >= targetScreenPx) return base;
    return Math.ceil(base * (targetScreenPx / Math.max(1, screenPx)));
  }

  function scaleInset(inset, ls) {
    if (ls >= 1) return inset;
    const out = {};
    Object.keys(inset).forEach((k) => { out[k] = Math.round(inset[k] * ls); });
    return out;
  }

  // Extra inset on tablet so side labels (4x, 2y) do not overlap cell values.
  function figInsets(compact, svg) {
    if (isPhoneCompact()) {
      return compact
        ? { ml: 78, mr: 68, mt: 46, mb: 50, edgeX: 38, edgeTop: 24, edgeRight: 38, edgeBottom: 28 }
        : { ml: 64, mr: 64, mt: 44, mb: 42, edgeX: 34, edgeTop: 22, edgeRight: 36, edgeBottom: 26 };
    }
    let inset;
    if (!isTabletTouch()) {
      inset = compact
        ? { ml: 56, mr: 66, mt: 40, mb: 44, edgeX: 24, edgeTop: 20, edgeRight: 28, edgeBottom: 22 }
        : { ml: 46, mr: 24, mt: 40, mb: 24, edgeX: 24, edgeTop: 20, edgeRight: 28, edgeBottom: 22 };
    } else {
      inset = compact
        ? { ml: 78, mr: 72, mt: 48, mb: 48, edgeX: 46, edgeTop: 26, edgeRight: 40, edgeBottom: 28 }
        : { ml: 68, mr: 36, mt: 46, mb: 30, edgeX: 42, edgeTop: 24, edgeRight: 34, edgeBottom: 26 };
    }
    return scaleInset(inset, labelScale(svg));
  }

  // Plain SVG text for tablet — avoids WebKit foreignObject misalignment when the SVG scales.
  function latexToPlain(latex) {
    return latex
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\textcolor\{#[0-9a-fA-F]+\}\{([^}]*)\}/g, "$1")
      .replace(/[{}\\]/g, "")
      .replace(/\^2/g, "\u00B2");
  }

  function svgLabel(p, cx, cy, latex, color, size) {
    const t = E("text", {
      x: cx, y: cy, fill: color, "font-size": size || 16,
      "text-anchor": "middle", "dominant-baseline": "middle",
      "font-family": "JetBrains Mono, monospace", "font-weight": "700",
    });
    t.textContent = latexToPlain(latex);
    p.appendChild(t);
    return t;
  }

  function E(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function rectSvg(p, x, y, w, h, fill, op, stroke, sw, dash) {
    const a = {
      x, y, width: Math.max(0, w), height: Math.max(0, h), fill,
      "fill-opacity": op == null ? 0.42 : op,
      stroke: stroke || fill, "stroke-width": sw == null ? 1.5 : sw,
    };
    if (dash) a["stroke-dasharray"] = dash;
    const el = E("rect", a);
    p.appendChild(el);
    return el;
  }
  function lineSvg(p, x1, y1, x2, y2, col, w, dash) {
    const a = { x1, y1, x2, y2, stroke: col, "stroke-width": w || 2 };
    if (dash) a["stroke-dasharray"] = dash;
    p.appendChild(E("line", a));
  }
  function plainText(p, x, y, s, col, size) {
    const t = E("text", {
      x, y, fill: col, "font-size": size || 13, "text-anchor": "middle",
      "dominant-baseline": "middle", "font-family": "Hanken Grotesk, sans-serif",
    });
    t.textContent = s;
    p.appendChild(t);
  }
  // LaTeX label centred at (cx, cy) inside the SVG via <foreignObject>.
  function tex(p, cx, cy, latex, color, size, w, h) {
    if (isTabletTouch() || isPhoneCompact()) {
      const base = size || 16;
      const fs = isPhoneCompact() ? phoneTexSize(base, p) : base;
      return svgLabel(p, cx, cy, latex, color, fs);
    }
    const ls = labelScale(p);
    const fs = (size || 16) * ls;
    w = (w || 170) * ls; h = (h || 46) * ls;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    fo.setAttribute("overflow", "visible");
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;" +
      "justify-content:center;color:" + color + ";font-size:" + fs + "px;line-height:1;" +
      "white-space:nowrap;";
    try { katex.render(latex, div, { throwOnError: false, displayMode: false }); }
    catch (e) { div.textContent = latex; }
    fo.appendChild(div);
    p.appendChild(fo);
    return fo;
  }
  // Like tex(), but shrinks the font so the label fits inside a cell of size
  // cw×ch. Keeps value labels readable (and non-overlapping) when the figure
  // becomes small as the user drags the sliders down.
  function fitTex(p, cx, cy, latex, color, cw, ch, opts) {
    opts = opts || {};
    const maxFs = opts.max == null ? 16 : opts.max;
    const minFs = opts.min == null ? 7 : opts.min;
    // Rough rendered-length estimate: drop LaTeX markup, keep visible glyphs.
    const glyphs = latex
      .replace(/\\textcolor\{#[0-9a-fA-F]+\}\{([^}]*)\}/g, "$1")
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/[\\{}^]/g, "");
    const ops = (glyphs.match(/[=+\-()/]/g) || []).length;
    const em = Math.max(0.01, glyphs.length * (opts.glyphEm == null ? 0.55 : opts.glyphEm) + ops * 0.35);
    const padX = opts.padX == null ? 10 : opts.padX;
    const padY = opts.padY == null ? 8 : opts.padY;
    const availW = Math.max(8, cw - padX);
    const availH = Math.max(8, ch - padY);
    let fs = Math.min(maxFs, availW / em, availH * 0.72);
    fs = Math.max(minFs, fs);
    // Keep foreignObject inside the cell so labels never spill past the border.
    const boxW = Math.max(12, Math.min(cw, availW + 2));
    const boxH = Math.max(12, Math.min(ch, Math.max(fs * 1.85, availH * 0.9)));
    if (isTabletTouch() || isPhoneCompact()) {
      let fsOut = fs;
      if (isPhoneCompact()) fsOut = Math.max(fs, phoneTexSize(Math.max(minFs, 11), p));
      return svgLabel(p, cx, cy, latex, color, fsOut);
    }
    return tex(p, cx, cy, latex, color, fs, boxW, boxH);
  }
  // ── click-to-focus helpers (used by the (a+b)^2 / (a-b)^2 tools) ──
  // Make an element selectable; clicking toggles the cell highlight.
  function pickable(el, idx, api) {
    if (!el || !api || idx == null) return el;
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => { e.stopPropagation(); api.select(idx); });
    return el;
  }
  // Dim an element when another cell is focused.
  function fade(el, off) { if (el) el.style.opacity = off ? 0.16 : 1; }
  // Make a decorative overlay ignore clicks so the pickable cell beneath it
  // still receives them.
  function noHit(el) { if (el) el.style.pointerEvents = "none"; return el; }
  // True when intervals [a0,a1] and [b0,b1] genuinely overlap (not just touch).
  function span(a0, a1, b0, b1) { return Math.min(a1, b1) - Math.max(a0, b0) > 0.5; }
  const tc = (c, s) => `\\textcolor{${c}}{${s}}`;
  // Slider a,b → x/y algebra (e.g. a=3 → 3x, b=2 → 2y).
  const coefX = (n) => {
    if (n === 0) return "0";
    if (n === 1) return "x";
    if (n === -1) return "-x";
    return n + "x";
  };
  const coefY = (n) => {
    if (n === 0) return "0";
    if (n === 1) return "y";
    if (n === -1) return "-y";
    return n + "y";
  };
  const sqX = (n) => {
    const sq = n * n;
    return sq === 1 ? "x^2" : sq + "x^2";
  };
  const sqY = (n) => {
    const sq = n * n;
    return sq === 1 ? "y^2" : sq + "y^2";
  };
  const xyCoef = (n) => {
    if (n === 0) return "0";
    if (n === 1) return "xy";
    if (n === -1) return "-xy";
    return n + "xy";
  };
  const midXY = (a, b) => xyCoef(2 * a * b);
  const binomPlusXY = (a, b) => `(${tc(C.a, coefX(a))}+${tc(C.b, coefY(b))})`;
  const binomDiffXY = (a, b) => `(${tc(C.a, coefX(a))}-${tc(C.b, coefY(b))})`;
  const dosDiffXY = (a, b) => `${tc(C.a, sqX(a))} - ${tc(C.b, sqY(b))}`;
  const dosFactorsXY = (a, b) =>
    `(${tc(C.a, coefX(a))}+${tc(C.b, coefY(b))})(${tc(C.a, coefX(a))}-${tc(C.b, coefY(b))})`;
  // Diagonal-hatch + dashed-outline overlay used to flag a region as "shared"
  // (e.g. the b² corner that both ab strips of (a-b)² cover twice).
  function hatchOverlay(svg, x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    const pid = "hatch-" + Math.random().toString(36).slice(2);
    const defs = E("defs", {});
    const pat = E("pattern", {
      id: pid, width: 7, height: 7,
      patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)",
    });
    pat.appendChild(E("line", { x1: 0, y1: 0, x2: 0, y2: 7, stroke: color, "stroke-width": 1.4 }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    rectSvg(svg, x, y, w, h, "url(#" + pid + ")", 1, color, 2, "4 3").style.pointerEvents = "none";
  }
  // Diagonal-stripe fill (no border) used to texture a region so it reads as a
  // single strip. `angle` sets the slant; opposite angles cross-hatch on overlap.
  function hatchFill(svg, x, y, w, h, color, angle, op) {
    if (w <= 0 || h <= 0) return;
    const pid = "hf-" + Math.random().toString(36).slice(2);
    const defs = E("defs", {});
    const pat = E("pattern", {
      id: pid, width: 9, height: 9,
      patternUnits: "userSpaceOnUse", patternTransform: "rotate(" + angle + ")",
    });
    pat.appendChild(E("line", {
      x1: 0, y1: 0, x2: 0, y2: 9, stroke: color, "stroke-width": 2,
      "stroke-opacity": op == null ? 1 : op,
    }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    rectSvg(svg, x, y, w, h, "url(#" + pid + ")", 1, "none", 0).style.pointerEvents = "none";
  }

  /* ───────────────────────── Tool 1: (a+b)^2 ───────────────────────── */
  const toolSum = {
    name: "(a+b)^2",
    viewBox: "0 0 410 380",
    defaults: { a: 3, b: 2 },
    sliders: [
      { key: "a", label: "a", min: 1, max: 7, step: 1, color: C.a },
      { key: "b", label: "b", min: 1, max: 5, step: 1, color: C.b },
    ],
    clamp() {},
    draw(svg, st, api) {
      // Scale the figure to fill the canvas so cells stay large & legible
      // regardless of how small a/b are; proportions still reflect a:b.
      const inset = figInsets(false, svg);
      const ml = inset.ml, mr = inset.mr, mt = inset.mt, mb = inset.mb;
      const aw = 410 - ml - mr, ah = 380 - mt - mb;
      const S = Math.min(aw, ah), unit = S / (st.a + st.b);
      const A = st.a * unit, B = st.b * unit;
      const ox = ml + (aw - S) / 2, top = mt + (ah - S) / 2;
      const sel = api ? api.sel : null;
      const cells = [
        { x: ox, y: top, w: A, h: A, fill: C.aFill, op: 0.55, lt: sqX(st.a), tc: C.cellA },
        { x: ox + A, y: top, w: B, h: A, fill: C.abFill, op: 0.55, lt: xyCoef(st.a * st.b), tc: C.cellAB },
        { x: ox, y: top + A, w: A, h: B, fill: C.abFill, op: 0.55, lt: xyCoef(st.a * st.b), tc: C.cellAB },
        { x: ox + A, y: top + A, w: B, h: B, fill: C.bFill, op: 0.65, lt: sqY(st.b), tc: C.cellB },
      ];
      cells.forEach((c, i) => {
        const on = sel === i, dim = sel != null && !on;
        const op = on ? Math.min(0.95, c.op + 0.28) : c.op;
        const r = rectSvg(svg, c.x, c.y, c.w, c.h, c.fill, op, on ? C.ink : c.fill, on ? 3 : 1.5);
        fade(r, dim); pickable(r, i, api);
        const f = fitTex(svg, c.x + c.w / 2, c.y + c.h / 2, c.lt, c.tc, c.w, c.h, { max: 22, min: 10 });
        fade(f, dim); pickable(f, i, api);
      });
      rectSvg(svg, ox, top, S, S, "none", 0, C.ink, 2.5);
      const sc = sel != null ? cells[sel] : null;
      const tops = [
        { cx: ox + A / 2, s: ox, e: ox + A, t: coefX(st.a), col: C.a },
        { cx: ox + A + B / 2, s: ox + A, e: ox + A + B, t: coefY(st.b), col: C.b },
      ];
      const lefts = [
        { cy: top + A / 2, s: top, e: top + A, t: coefX(st.a), col: C.a },
        { cy: top + A + B / 2, s: top + A, e: top + A + B, t: coefY(st.b), col: C.b },
      ];
      tops.forEach((L) => {
        fade(tex(svg, L.cx, top - inset.edgeTop, L.t, L.col, 20, 70, 34), sc && !span(sc.x, sc.x + sc.w, L.s, L.e));
      });
      lefts.forEach((L) => {
        fade(tex(svg, ox - inset.edgeX, L.cy, L.t, L.col, 20, 48, 34), sc && !span(sc.y, sc.y + sc.h, L.s, L.e));
      });
    },
    latex(st) {
      const a = st.a, b = st.b;
      return [
        `(${tc(C.a, "a")}+${tc(C.b, "b")})^2 = ${tc(C.a, "a^2")} + ${tc(C.ab, "2ab")} + ${tc(C.b, "b^2")}`,
        `${binomPlusXY(a, b)}^2 = ${tc(C.a, sqX(a))} + ${tc(C.ab, midXY(a, b))} + ${tc(C.b, sqY(b))}`,
      ];
    },
  };

  /* ───────────────────────── Tool 2: (a-b)^2 ───────────────────────── */
  const toolDiff = {
    name: "(a-b)^2",
    viewBox: "0 0 410 380",
    defaults: { a: 5, b: 2 },
    sliders: [
      { key: "a", label: "a", min: 3, max: 8, step: 1, color: C.a },
      { key: "b", label: "b", min: 1, max: 7, step: 1, color: C.b },
    ],
    clamp(st) { if (st.b > st.a - 1) st.b = st.a - 1; },
    draw(svg, st, api) {
      const inset = figInsets(true, svg);
      const ml = inset.ml, mr = inset.mr, mt = inset.mt, mb = inset.mb;
      const aw = 410 - ml - mr, ah = 380 - mt - mb;
      const A = Math.min(aw, ah), unit = A / st.a;
      const B = st.b * unit, IN = A - B;
      const ox = ml + (aw - A) / 2, top = mt + (ah - A) / 2;
      const sel = api ? api.sel : null, anySel = sel != null;
      const bg = rectSvg(svg, ox, top, A, A, C.aFill, 0.2, C.aFill, 1);
      fade(bg, anySel);
      const ab = st.a * st.b;
      const innerSqLabel = `(${tc(C.a, "a")}-${tc(C.b, "b")})^2`;
      const cells = [
        { x: ox + IN, y: top, w: B, h: A, fill: C.abFill, op: 0.5,
          lx: ox + IN + B / 2, ly: top + IN / 2, lw: B, lh: IN, lt: xyCoef(ab), tc: C.cellAB },
        { x: ox, y: top + IN, w: A, h: B, fill: C.abFill, op: 0.5,
          lx: ox + IN / 2, ly: top + IN + B / 2, lw: IN, lh: B, lt: xyCoef(ab), tc: C.cellAB },
        { x: ox + IN, y: top + IN, w: B, h: B, fill: C.bFill, op: 0.55,
          lx: ox + IN + B / 2, ly: top + IN + B / 2, lw: B, lh: B, lt: sqY(st.b), tc: C.cellB },
        { x: ox, y: top, w: IN, h: IN, fill: C.aFill, op: 0.6,
          lx: ox + IN / 2, ly: top + IN / 2, lw: IN, lh: IN, lt: innerSqLabel, tc: C.cellA,
          // Scale with cell; pad keeps (a-b)^2 inside borders at extreme a/b (e.g. 4 & 3).
          fitOpts: { max: 24, min: 10, padX: 12, padY: 10, glyphEm: 0.52 } },
      ];
      cells.forEach((c, i) => {
        const on = sel === i, dim = anySel && !on;
        const op = on ? Math.min(0.95, c.op + 0.28) : c.op;
        const r = rectSvg(svg, c.x, c.y, c.w, c.h, c.fill, op, on ? C.ink : c.fill, on ? 3 : 1);
        fade(r, dim); pickable(r, i, api);
        const f = c.fitOpts
          ? fitTex(svg, c.lx, c.ly, c.lt, c.tc, c.lw, c.lh, c.fitOpts)
          : fitTex(svg, c.lx, c.ly, c.lt, c.tc, c.lw, c.lh, { max: 22, min: 10, padX: 8, padY: 8 });
        fade(f, dim); pickable(f, i, api);
      });
      // Hint before any click: stripe each FULL ab strip with slanted lines
      // (bottom strip one way, right strip the other). The stripes run through
      // the b² corner, so the corner shows a cross-hatch — making it obvious
      // each ab strip is the whole a×b band and the corner is shared by both.
      if (sel == null) {
        const stripe = "#558B2F";
        hatchFill(svg, ox, top + IN, A, B, stripe, 45, 0.55);      // bottom ab strip "/"
        hatchFill(svg, ox + IN, top, B, A, stripe, -45, 0.55);     // right ab strip "\"
        // redraw labels so they stay crisp above the stripes (non-interactive
        // so the cells underneath stay clickable)
        noHit(fitTex(svg, ox + IN + B / 2, top + IN / 2, xyCoef(ab), C.cellAB, B, IN, { max: 22, min: 10, padX: 8, padY: 8 }));
        noHit(fitTex(svg, ox + IN / 2, top + IN + B / 2, xyCoef(ab), C.cellAB, IN, B, { max: 22, min: 10, padX: 8, padY: 8 }));
        noHit(fitTex(svg, ox + IN + B / 2, top + IN + B / 2, sqY(st.b), C.cellB, B, B, { max: 22, min: 10, padX: 8, padY: 8 }));
      }
      // When an ab strip is picked, reveal that it continues *through* the b²
      // corner — paint the corner in the strip colour so the full a×b extent is
      // visible, then hatch it to flag the corner as the shared (double-counted)
      // piece. This corrects the static look where ab seems to be only one cell.
      if (sel === 0 || sel === 1) {
        rectSvg(svg, ox + IN, top + IN, B, B, C.abFill, Math.min(0.95, 0.5 + 0.28)).style.pointerEvents = "none";
        hatchOverlay(svg, ox + IN, top + IN, B, B, C.rm);
        noHit(fitTex(svg, ox + IN + B / 2, top + IN + B / 2, "\\text{shared}", C.rm, B, B, { max: 12 }));
      }
      rectSvg(svg, ox, top, A, A, "none", 0, C.ink, 2.5);
      const sc = sel != null ? cells[sel] : null;
      const tops = [
        { cx: ox + IN + B / 2, s: ox + IN, e: ox + A, t: coefY(st.b), col: C.b, fz: 20 },
      ];
      const rights = [
        { cy: top + IN + B / 2, s: top + IN, e: top + A, t: coefY(st.b), col: C.b, fz: 18 },
      ];
      tops.forEach((L) => {
        fade(tex(svg, L.cx, top - inset.edgeTop, L.t, L.col, L.fz, 70, 34), sc && !span(sc.x, sc.x + sc.w, L.s, L.e));
      });
      rights.forEach((L) => {
        fade(tex(svg, ox + A + inset.edgeRight, L.cy, L.t, L.col, L.fz, 70, 34), sc && !span(sc.y, sc.y + sc.h, L.s, L.e));
      });
      // total side length a = (a-b) + b, shown on the otherwise-empty left &
      // bottom sides; lit when the selected piece spans that whole side (i.e.
      // makes clear each ab strip is a full a×b rectangle).
      const fullV = sc && sc.y <= top + 0.5 && sc.y + sc.h >= top + A - 0.5;
      const fullH = sc && sc.x <= ox + 0.5 && sc.x + sc.w >= ox + A - 0.5;
      fade(tex(svg, ox - inset.edgeX, top + A / 2, coefX(st.a), C.a, 20, 48, 34), sc && !fullV);
      fade(tex(svg, ox + A / 2, top + A + inset.edgeBottom, coefX(st.a), C.a, 20, 70, 34), sc && !fullH);
    },
    latex(st) {
      const a = st.a, b = st.b;
      return [
        `(${tc(C.a, "a")}-${tc(C.b, "b")})^2 = ${tc(C.a, "a^2")} - ${tc(C.ab, "2ab")} + ${tc(C.b, "b^2")}`,
        `${binomDiffXY(a, b)}^2 = ${tc(C.a, sqX(a))} - ${tc(C.ab, midXY(a, b))} + ${tc(C.b, sqY(b))}`,
      ];
    },
  };

  /* ──────────────────── Tool 3: a^2 - b^2 = (a+b)(a-b) ──────────────────── */
  const toolDoS = {
    name: "a^2-b^2",
    viewBox: "0 0 450 380",
    defaults: { a: 5, b: 2, mode: 0 },
    sliders: [
      { key: "a", label: "a", min: 3, max: 8, step: 1, color: C.a },
      { key: "b", label: "b", min: 1, max: 7, step: 1, color: C.b },
    ],
    buttons: [{ label: "Rearrange \u27f3", toggle: "mode" }],
    clamp(st) { if (st.b > st.a - 1) st.b = st.a - 1; },
    draw(svg, st) {
      if (!st.mode) {
        let inset;
        if (isPhoneCompact()) {
          inset = { ml: 58, mr: 56, mt: 44, mb: 56, edgeX: 32, edgeTop: 22, edgeRight: 34, edgeBottom: 26 };
        } else if (isTabletTouch()) {
          inset = { ml: 66, mr: 54, mt: 46, mb: 54, edgeX: 42, edgeTop: 24, edgeRight: 38, edgeBottom: 28 };
        } else {
          inset = { ml: 34, mr: 48, mt: 40, mb: 52, edgeX: 24, edgeTop: 20, edgeRight: 28, edgeBottom: 22 };
        }
        if (!isPhoneCompact()) inset = scaleInset(inset, labelScale(svg));
        const ml = inset.ml, mr = inset.mr, mt = inset.mt, mb = inset.mb;
        const aw = 450 - ml - mr, ah = 380 - mt - mb;
        const A = Math.min(aw, ah), unit = A / st.a;
        const B = st.b * unit, IN = A - B;
        const ox = ml + (aw - A) / 2, top = mt + (ah - A) / 2;
        rectSvg(svg, ox, top, A, IN, C.aFill, 0.55, C.aFill, 1);
        rectSvg(svg, ox, top + IN, IN, B, C.aFill, 0.55, C.aFill, 1);
        rectSvg(svg, ox + IN, top + IN, B, B, C.bFill, 0.35, C.rm, 2, "4 3");
        rectSvg(svg, ox, top, A, A, "none", 0, C.ink, 2.5);
        fitTex(svg, ox + A / 2, top + IN / 2, sqX(st.a) + "-" + sqY(st.b), C.cellA, A, IN, { max: 22, min: 11 });
        fitTex(svg, ox + IN + B / 2, top + IN + B / 2, sqY(st.b), C.rm, B, B, { max: 18, min: 10 });
        tex(svg, ox + A / 2, top - inset.edgeTop, coefX(st.a), C.a, 20, 70, 34);
        tex(svg, ox - inset.edgeX, top + A / 2, coefX(st.a), C.a, 20, 48, 34);
        tex(svg, ox + IN + B / 2, top + A + inset.edgeBottom, coefY(st.b), C.b, 20, 70, 34);
        tex(svg, ox + A + inset.edgeRight, top + IN + B / 2, coefY(st.b), C.b, 20, 70, 34);
      } else {
        let inset;
        if (isPhoneCompact()) {
          inset = { ml: 96, mr: 48, mt: 46, mb: 40, edgeX: 16, edgeTop: 22 };
        } else if (isTabletTouch()) {
          inset = { ml: 88, mr: 52, mt: 48, mb: 40, edgeX: 14, edgeTop: 24 };
        } else {
          inset = { ml: 108, mr: 42, mt: 44, mb: 36, edgeX: 14, edgeTop: 20 };
        }
        if (!isPhoneCompact()) inset = scaleInset(inset, labelScale(svg));
        const ml = inset.ml, mr = inset.mr, mt = inset.mt, mb = inset.mb;
        const aw = 450 - ml - mr, ah = 380 - mt - mb;
        const unit = Math.min(aw / (st.a + st.b), ah / (st.a - st.b));
        const A = st.a * unit, B = st.b * unit, IN = A - B;
        const W = A + B, H = IN;
        const ox = ml + (aw - W) / 2, top = mt + (ah - H) / 2;
        rectSvg(svg, ox, top, A, H, C.aFill, 0.55, C.aFill, 1);
        rectSvg(svg, ox + A, top, B, H, C.aFill, 0.55, C.aFill, 1);
        lineSvg(svg, ox + A, top, ox + A, top + H, C.ink, 1, "3 3");
        rectSvg(svg, ox, top, W, H, "none", 0, C.ink, 2.5);
        fitTex(svg, ox + W / 2, top + H / 2, sqX(st.a) + "-" + sqY(st.b), C.cellA, W, H, { max: 22, min: 11 });
        tex(svg, ox + W / 2, top - inset.edgeTop, "(" + coefX(st.a) + "+" + coefY(st.b) + ")", C.a, 18, 120, 34);
        const leftLblW = 118;
        const ls = labelScale(svg);
        const leftGap = 12;
        const halfW = (leftLblW * ls) / 2;
        let lcx = ox - leftGap - halfW;
        if (lcx - halfW < 6) lcx = 6 + halfW;
        tex(svg, lcx, top + H / 2, "(" + coefX(st.a) + "-" + coefY(st.b) + ")", C.a, 16, leftLblW, 34);
      }
    },
    latex(st) {
      const a = st.a, b = st.b;
      return [
        `${tc(C.a, "a^2")} - ${tc(C.b, "b^2")} = (${tc(C.a, "a")}+${tc(C.b, "b")})(${tc(C.a, "a")}-${tc(C.b, "b")})`,
        `${dosDiffXY(a, b)} = ${dosFactorsXY(a, b)}`,
      ];
    },
  };

  const TOOLS = { sum: toolSum, diff: toolDiff, dos: toolDoS };

  /* ───────────────────────── wiring ───────────────────────── */
  function renderEq(container, lines) {
    clear(container);
    lines.forEach((t) => {
      const d = document.createElement("div");
      d.className = "eq-line";
      try { katex.render(t, d, { throwOnError: false, displayMode: false }); }
      catch (e) { d.textContent = t; }
      container.appendChild(d);
    });
  }
  function renderTexAttrs(root) {
    (root || document).querySelectorAll("[data-tex]").forEach((el) => {
      try { katex.render(el.getAttribute("data-tex"), el, { throwOnError: false, displayMode: false }); }
      catch (e) {}
    });
  }

  function initTools() {
    const svg = document.getElementById("tool-svg");
    const controls = document.getElementById("tool-controls");
    const eqBox = document.getElementById("tool-eq");
    const toolBtns = document.querySelectorAll("[data-tool]");
    let current = null, state = {};

    const api = {
      get sel() { return state.sel == null ? null : state.sel; },
      select(i) { state.sel = (state.sel === i ? null : i); redraw(); },
    };

    function redraw() {
      if (current.clamp) current.clamp(state);
      clear(svg);
      current.draw(svg, state, api);
      if (isTabletTouch() && current.viewBox) {
        const vb = current.viewBox.split(/\s+/);
        if (vb.length >= 4) svg.style.aspectRatio = vb[2] + " / " + vb[3];
      } else {
        svg.style.aspectRatio = "";
      }
      renderEq(eqBox, current.latex(state));
      current.sliders.forEach((s) => {
        const badge = document.getElementById("val-" + s.key);
        if (badge) badge.textContent = state[s.key];
        const inp = document.getElementById("sl-" + s.key);
        if (inp && +inp.value !== state[s.key]) inp.value = state[s.key];
      });
    }

    function loadTool(key) {
      current = TOOLS[key];
      state = Object.assign({}, current.defaults);
      svg.setAttribute("viewBox", current.viewBox);
      clear(controls);
      current.sliders.forEach((s) => {
        const wrap = document.createElement("label");
        wrap.className = "slider-row";
        const name = document.createElement("span");
        name.className = "slider-name";
        name.style.color = s.color;
        try { katex.render(s.label, name, { throwOnError: false }); } catch (e) { name.textContent = s.label; }
        const inp = document.createElement("input");
        inp.id = "sl-" + s.key; inp.type = "range";
        inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = state[s.key];
        inp.addEventListener("input", (e) => { state[s.key] = +e.target.value; redraw(); });
        const val = document.createElement("span");
        val.className = "slider-val"; val.id = "val-" + s.key; val.textContent = state[s.key];
        wrap.appendChild(name); wrap.appendChild(inp); wrap.appendChild(val);
        controls.appendChild(wrap);
      });
      (current.buttons || []).forEach((b) => {
        const btn = document.createElement("button");
        btn.className = "tool-action";
        btn.textContent = b.label;
        btn.addEventListener("click", () => { state[b.toggle] = state[b.toggle] ? 0 : 1; redraw(); });
        controls.appendChild(btn);
      });
      redraw();
      toolBtns.forEach((b) => b.classList.toggle("active", b.dataset.tool === key));
    }

    // Click empty canvas (or the outer border) to clear the focus.
    svg.addEventListener("click", (e) => {
      if ((e.target === svg || e.target.getAttribute("fill") === "none") && state.sel != null) {
        state.sel = null; redraw();
      }
    });

    const toolLayout = document.querySelector(".tool-layout");
    const crossLab = document.getElementById("cross-lab");
    function activate(key) {
      const isCross = key === "cross";
      toolBtns.forEach((b) => b.classList.toggle("active", b.dataset.tool === key));
      if (toolLayout) toolLayout.classList.toggle("hidden", isCross);
      if (crossLab) crossLab.classList.toggle("hidden", !isCross);
      if (isCross) {
        if (window.FZ_CROSS && window.FZ_CROSS.show) window.FZ_CROSS.show();
      } else {
        loadTool(key);
      }
    }
    toolBtns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tool)));
    const onLayoutChange = () => {
      if (current && toolLayout && !toolLayout.classList.contains("hidden")) redraw();
      if (window.FZ_CROSS && window.FZ_CROSS.onTabletChange) window.FZ_CROSS.onTabletChange();
    };
    initTabletMode(onLayoutChange);
    initPhoneCompact(onLayoutChange);
    initPhoneCompact(() => {
      if (window.FactGame && window.FactGame.onPhoneLayout) window.FactGame.onPhoneLayout();
    });
    let phoneResizeT = null;
    window.addEventListener("resize", () => {
      if (!isPhoneCompact()) return;
      const panel = document.getElementById("panel-tools");
      if (!panel || panel.classList.contains("hidden")) return;
      clearTimeout(phoneResizeT);
      phoneResizeT = setTimeout(() => {
        if (current && toolLayout && !toolLayout.classList.contains("hidden")) redraw();
      }, 120);
    });
    activate("sum");
  }

  /* ───────────────── Cross method wizard ───────────────── */
  const posDivisors = (n) => {
    n = Math.abs(n); const ds = [];
    for (let d = 1; d <= n; d++) if (n % d === 0) ds.push(d);
    return ds;
  };
  const gcd2 = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a;
  };
  const gcd3 = (a, b, c) => gcd2(gcd2(a, b), c);
  const polyTerm = (n, v, lead) => {
    if (n === 0) return "";
    const sign = n < 0 ? (lead ? "-" : " - ") : (lead ? "" : " + ");
    const m = Math.abs(n);
    return sign + (m === 1 ? "" : m) + v;
  };
  const polyTex = (A, B, C) => polyTerm(A, "x^2", true) + polyTerm(B, "xy", false) + polyTerm(C, "y^2", false);
  const factorTex = (p, q) => {
    const xs = p === 1 ? "x" : p === -1 ? "-x" : p + "x";
    const ym = Math.abs(q) === 1 ? "y" : Math.abs(q) + "y";
    return "(" + xs + (q < 0 ? " - " : " + ") + ym + ")";
  };
  const midTex = (m) => (m === 0 ? "0" : (m === 1 ? "" : m === -1 ? "-" : m) + "xy");
  const xyTermTex = (n) => {
    if (n === 0) return "0";
    if (n === 1) return "xy";
    if (n === -1) return "-xy";
    return n + "xy";
  };

  function kxEl(latex, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    try { katex.render(latex, d, { throwOnError: false, displayMode: false }); }
    catch (e) { d.textContent = latex; }
    return d;
  }

  function initCrossLab() {
    const lab = document.getElementById("cross-lab");
    if (!lab) return;

    const aEl = document.getElementById("cross-a");
    const bEl = document.getElementById("cross-b");
    const cEl = document.getElementById("cross-c");
    const preview = document.getElementById("cross-preview");
    const step1Err = document.getElementById("cross-step1-err");
    const panels = [1, 2, 3, 4].map((n) => document.getElementById("cross-step-" + n));
    const dots = document.querySelectorAll(".cross-step-dot");
    const xPairsEl = document.getElementById("cross-x-pairs");
    const yPairsEl = document.getElementById("cross-y-pairs");
    const checkEl = document.getElementById("cross-check");
    const answerEl = document.getElementById("cross-answer");
    const productsEl = document.getElementById("cross-products");
    const prodBlEl = document.getElementById("cross-prod-bl");
    const prodTrEl = document.getElementById("cross-prod-tr");
    const prodSumEl = document.getElementById("cross-prod-sum");
    const slots = {};
    document.querySelectorAll(".drop-slot").forEach((el) => { slots[el.dataset.slot] = el; });

    let selectedChip = null;

    function clearChipSelection() {
      selectedChip = null;
      lab.classList.remove("chip-pick-active");
      lab.querySelectorAll(".drag-chip.chip-selected").forEach((c) => c.classList.remove("chip-selected"));
      Object.values(slots).forEach((s) => s.classList.remove("slot-targetable"));
    }

    function selectChip(chip, val, kind) {
      if (selectedChip && selectedChip.value === val && selectedChip.kind === kind) {
        clearChipSelection();
        return;
      }
      clearChipSelection();
      selectedChip = { value: val, kind: kind };
      chip.classList.add("chip-selected");
      lab.classList.add("chip-pick-active");
      Object.values(slots).forEach((s) => {
        s.classList.toggle("slot-targetable", s.dataset.kind === kind);
      });
    }

    function placeChipInSlot(slotKey) {
      if (!selectedChip) return;
      const el = slots[slotKey];
      if (selectedChip.kind !== el.dataset.kind) return;
      wiz.values[slotKey] = selectedChip.value;
      clearChipSelection();
      renderSlot(slotKey);
      updateCheck();
    }

    const wiz = {
      step: 1,
      A: 2, B: 7, C: 3,
      outerSign: 1,
      A1: 2, B1: 7, C1: 3,
      gcf: 1,
      A2: 2, B2: 7, C2: 3,
      values: { tl: null, tr: null, bl: null, br: null },
    };

    function readInputs() {
      wiz.A = parseInt(aEl.value, 10);
      wiz.B = parseInt(bEl.value, 10);
      wiz.C = parseInt(cEl.value, 10);
    }

    function updatePreview() {
      readInputs();
      if (!Number.isInteger(wiz.A) || !Number.isInteger(wiz.B) || !Number.isInteger(wiz.C)) {
        preview.textContent = "";
        return;
      }
      clear(preview);
      preview.appendChild(kxEl(polyTex(wiz.A, wiz.B, wiz.C)));
    }

    function showStep(n) {
      wiz.step = n;
      panels.forEach((p, i) => p.classList.toggle("hidden", i + 1 !== n));
      dots.forEach((d) => {
        const s = +d.dataset.step;
        d.classList.toggle("active", s === n);
        d.classList.toggle("done", s < n);
      });
    }

    function prepNeg() {
      if (wiz.A < 0) {
        wiz.outerSign = -1;
        wiz.A1 = -wiz.A;
        wiz.B1 = -wiz.B;
        wiz.C1 = -wiz.C;
      } else {
        wiz.outerSign = 1;
        wiz.A1 = wiz.A;
        wiz.B1 = wiz.B;
        wiz.C1 = wiz.C;
      }
    }

    function prepGcf() {
      wiz.gcf = gcd3(wiz.A1, wiz.B1, wiz.C1);
      if (wiz.gcf < 1) wiz.gcf = 1;
      wiz.A2 = wiz.A1 / wiz.gcf;
      wiz.B2 = wiz.B1 / wiz.gcf;
      wiz.C2 = wiz.C1 / wiz.gcf;
    }

    function renderStep2() {
      const note = document.getElementById("cross-step2-note");
      const math = document.getElementById("cross-step2-math");
      clear(math);
      if (wiz.A < 0) {
        note.textContent = "The x² coefficient is negative — factor out −1 so the inner x² coefficient becomes positive.";
        math.appendChild(kxEl(
          polyTex(wiz.A, wiz.B, wiz.C) + " = -1 \\cdot (" +
          polyTex(wiz.A1, wiz.B1, wiz.C1) + ")"
        ));
      } else {
        note.textContent = "The x² coefficient is already positive — no negative sign to extract.";
        math.appendChild(kxEl(polyTex(wiz.A, wiz.B, wiz.C)));
      }
    }

    function renderStep3() {
      const note = document.getElementById("cross-step3-note");
      const math = document.getElementById("cross-step3-math");
      clear(math);
      const prefix = wiz.outerSign === -1 ? "-1" : "1";
      if (wiz.gcf > 1) {
        note.textContent = "All three inner coefficients share a common factor — extract it before using the cross method.";
        math.appendChild(kxEl(
          polyTex(wiz.A, wiz.B, wiz.C) + " = " + prefix + " \\cdot " + wiz.gcf +
          " \\cdot (" + polyTex(wiz.A2, wiz.B2, wiz.C2) + ")"
        ));
      } else {
        note.textContent = "No common factor among the inner coefficients.";
        if (wiz.outerSign === -1) {
          math.appendChild(kxEl(
            polyTex(wiz.A, wiz.B, wiz.C) + " = -1 \\cdot (" +
            polyTex(wiz.A2, wiz.B2, wiz.C2) + ")"
          ));
        } else {
          math.appendChild(kxEl(polyTex(wiz.A2, wiz.B2, wiz.C2)));
        }
      }
    }

    function makeChip(val, kind) {
      const chip = document.createElement("span");
      chip.className = "drag-chip " + (kind === "x" ? "x-chip" : "y-chip");
      chip.textContent = val;
      chip.dataset.value = String(val);
      chip.dataset.kind = kind;
      if (isTouchUI()) {
        chip.draggable = false;
        chip.setAttribute("role", "button");
        chip.tabIndex = 0;
        chip.addEventListener("click", () => selectChip(chip, val, kind));
      } else {
        chip.draggable = true;
        chip.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", JSON.stringify({ value: val, kind: kind }));
          e.dataTransfer.effectAllowed = "copy";
        });
      }
      return chip;
    }

    function buildPairGroups(container, pairs, kind) {
      clear(container);
      pairs.forEach(([p, q]) => {
        const g = document.createElement("div");
        g.className = "pair-group";
        g.appendChild(makeChip(p, kind));
        const sep = document.createElement("span");
        sep.className = "pair-group-sep";
        sep.textContent = "\u00d7";
        g.appendChild(sep);
        g.appendChild(makeChip(q, kind));
        container.appendChild(g);
      });
    }

    function clearSlots() {
      wiz.values = { tl: null, tr: null, bl: null, br: null };
      clearChipSelection();
      Object.keys(slots).forEach((k) => renderSlot(k));
      updateCheck();
    }

    function renderSlot(key) {
      const el = slots[key];
      const val = wiz.values[key];
      const kind = el.dataset.kind;
      clear(el);
      el.classList.toggle("filled", val != null);
      el.classList.remove("correct", "wrong", "drag-over");
      if (val == null) {
        const ph = document.createElement("span");
        ph.className = "slot-placeholder";
        ph.textContent = "?";
        el.appendChild(ph);
        return;
      }
      const span = document.createElement("span");
      span.className = "slot-val " + (kind === "x" ? "x-val" : "y-val");
      span.textContent = val;
      el.appendChild(span);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-clear";
      btn.title = "Clear";
      btn.textContent = "\u00d7";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        wiz.values[key] = null;
        renderSlot(key);
        updateCheck();
      });
      el.appendChild(btn);
    }

    function setupDrop(slotKey) {
      const el = slots[slotKey];
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        el.classList.add("drag-over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("drag-over");
        let data;
        try { data = JSON.parse(e.dataTransfer.getData("text/plain")); }
        catch (err) { return; }
        if (data.kind !== el.dataset.kind) return;
        wiz.values[slotKey] = data.value;
        renderSlot(slotKey);
        updateCheck();
      });
      if (isTouchUI()) {
        el.addEventListener("click", () => placeChipInSlot(slotKey));
      }
    }

    Object.keys(slots).forEach(setupDrop);

    function hasFactorisation() {
      const aPairs = posDivisors(wiz.A2).map((d) => [d, wiz.A2 / d]);
      const cPairs = [];
      posDivisors(wiz.C2).forEach((d) => {
        cPairs.push([d, wiz.C2 / d]);
        cPairs.push([-d, wiz.C2 / -d]);
      });
      for (let i = 0; i < aPairs.length; i++) {
        const [a1, a2] = aPairs[i];
        for (let j = 0; j < cPairs.length; j++) {
          const [c1, c2] = cPairs[j];
          if (a1 * c2 + a2 * c1 === wiz.B2) return true;
        }
      }
      return false;
    }

    function updateCheck() {
      clear(checkEl);
      clear(answerEl);
      clear(prodBlEl);
      clear(prodTrEl);
      clear(prodSumEl);
      const { tl: a1, tr: c1, bl: a2, br: c2 } = wiz.values;
      const filled = [a1, c1, a2, c2].every((v) => v != null);
      if (!filled) {
        productsEl.classList.add("empty");
        prodSumEl.classList.add("hidden");
        const hint = document.createElement("span");
        hint.className = "cross-hint";
        hint.textContent = isTouchUI()
          ? "Tap all four slots to test a combination."
          : "Fill all four slots to test a combination.";
        checkEl.appendChild(hint);
        Object.keys(slots).forEach((k) => slots[k].classList.remove("correct", "wrong"));
        return;
      }
      productsEl.classList.remove("empty");
      prodSumEl.classList.remove("hidden");
      const pBr = a1 * c2;  // top-left × bottom-right → below 1y (br)
      const pBl = a2 * c1;  // bottom-left × top-right → below 2x (bl)
      const mid = pBr + pBl;
      const ok = mid === wiz.B2;
      Object.keys(slots).forEach((k) => {
        slots[k].classList.toggle("correct", ok);
        slots[k].classList.toggle("wrong", !ok);
      });

      prodBlEl.appendChild(kxEl(xyTermTex(pBl)));
      prodTrEl.appendChild(kxEl(xyTermTex(pBr)));

      prodSumEl.appendChild(kxEl("= " + midTex(mid)));
      const mark = document.createElement("span");
      mark.className = "cross-mark " + (ok ? "ok" : "bad");
      mark.textContent = ok ? "\u2713" : "\u2717";
      prodSumEl.appendChild(mark);

      if (ok) {
        let f1 = [a1, c1], f2 = [a2, c2];
        if (f2[0] > f1[0] || (f2[0] === f1[0] && f2[1] > f1[1])) { const t = f1; f1 = f2; f2 = t; }
        let prefix = "";
        if (wiz.outerSign === -1 && wiz.gcf > 1) prefix = "-" + wiz.gcf;
        else if (wiz.outerSign === -1) prefix = "-1";
        else if (wiz.gcf > 1) prefix = String(wiz.gcf);
        const inner = factorTex(f1[0], f1[1]) + factorTex(f2[0], f2[1]);
        const full = prefix
          ? polyTex(wiz.A, wiz.B, wiz.C) + " = " + prefix + "\\cdot" + inner
          : polyTex(wiz.A, wiz.B, wiz.C) + " = " + inner;
        answerEl.appendChild(kxEl(full));
      }
    }

    function renderStep4() {
      document.getElementById("cross-a2-label").textContent = wiz.A2;
      document.getElementById("cross-c2-label").textContent = wiz.C2;
      const step4Note = document.querySelector("#cross-step-4 .cross-step-note");
      if (step4Note) {
        step4Note.textContent = isTouchUI()
          ? "Tap a number from the factor pairs, then tap a slot to place it. Check whether the cross products give the correct xy term."
          : "Drag numbers from the factor pairs into the four slots, then check whether the cross products give the correct xy term.";
      }
      const eqEl = document.getElementById("cross-equation");
      clear(eqEl);
      eqEl.appendChild(kxEl(polyTex(wiz.A2, wiz.B2, wiz.C2)));
      const targetB = document.getElementById("cross-target-b");
      clear(targetB);
      targetB.appendChild(kxEl(midTex(wiz.B2)));

      const xPairs = posDivisors(wiz.A2).map((d) => [d, wiz.A2 / d]);
      const yPairs = [];
      posDivisors(wiz.C2).forEach((d) => {
        yPairs.push([d, wiz.C2 / d]);
        yPairs.push([-d, wiz.C2 / -d]);
      });
      buildPairGroups(xPairsEl, xPairs, "x");
      buildPairGroups(yPairsEl, yPairs, "y");
      clearSlots();
      if (!hasFactorisation()) {
        const hint = document.createElement("p");
        hint.className = "cross-hint";
        hint.textContent = "This inner trinomial has no integer cross-method factorisation — every combination will show \u2717.";
        answerEl.appendChild(hint);
      }
    }

    document.getElementById("cross-next-1").addEventListener("click", () => {
      readInputs();
      step1Err.classList.add("hidden");
      if (!Number.isInteger(wiz.A) || !Number.isInteger(wiz.B) || !Number.isInteger(wiz.C)) {
        step1Err.textContent = "Please enter whole numbers for all three coefficients.";
        step1Err.classList.remove("hidden");
        return;
      }
      if (wiz.A === 0 || wiz.C === 0) {
        step1Err.textContent = "The x\u00b2 and y\u00b2 coefficients must be non-zero for the cross method.";
        step1Err.classList.remove("hidden");
        return;
      }
      prepNeg();
      renderStep2();
      showStep(2);
    });

    document.getElementById("cross-back-2").addEventListener("click", () => showStep(1));
    document.getElementById("cross-next-2").addEventListener("click", () => {
      prepGcf();
      renderStep3();
      showStep(3);
    });

    document.getElementById("cross-back-3").addEventListener("click", () => showStep(2));
    document.getElementById("cross-next-3").addEventListener("click", () => {
      renderStep4();
      showStep(4);
    });

    document.getElementById("cross-back-4").addEventListener("click", () => showStep(3));
    document.getElementById("cross-clear-slots").addEventListener("click", clearSlots);

    [aEl, bEl, cEl].forEach((el) => {
      el.addEventListener("input", updatePreview);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && wiz.step === 1) document.getElementById("cross-next-1").click();
      });
    });

    window.FZ_CROSS = {
      show() {
        renderTexAttrs(lab);
        updatePreview();
        showStep(wiz.step);
      },
      onTabletChange() {
        const step4Note = document.querySelector("#cross-step-4 .cross-step-note");
        if (step4Note) {
          step4Note.textContent = isTouchUI()
            ? "Tap a number from the factor pairs, then tap a slot to place it. Check whether the cross products give the correct xy term."
            : "Drag numbers from the factor pairs into the four slots, then check whether the cross products give the correct xy term.";
        }
        if (wiz.step === 4) renderStep4();
      },
    };

    updatePreview();
    renderTexAttrs(lab);
  }

  function initTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = {
      slides: document.getElementById("panel-slides"),
      tools: document.getElementById("panel-tools"),
      game: document.getElementById("panel-game"),
      summary: document.getElementById("panel-summary"),
      quiz: document.getElementById("panel-quiz"),
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      for (const k in panels) { if (panels[k]) panels[k].classList.toggle("hidden", k !== t.dataset.tab); }
      if (window.FactGame) { (t.dataset.tab === "game" ? window.FactGame.show() : window.FactGame.hide()); }
    }));
  }

  function initDecks() {
    const frame = document.getElementById("deck-frame");
    const btns = document.querySelectorAll("[data-deck]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("active", x === b));
      frame.src = b.dataset.deck;
    }));
    if (deckTouch()) deckTouch().initDeckTouchNav(frame);
  }

  function initSummarySlideshow() {
    const sets = document.querySelectorAll("#summary-stage .summary-set");
    const styleChips = document.querySelectorAll("[data-summary-style]");
    const prevBtn = document.getElementById("summary-prev");
    const nextBtn = document.getElementById("summary-next");
    const pageNum = document.getElementById("summary-page-num");
    const pageTotal = document.getElementById("summary-page-total");
    if (!sets.length || !prevBtn || !nextBtn) return;

    let styleId = "style-1";
    let idx = 0;

    function activeSet() {
      return document.querySelector('#summary-stage .summary-set[data-summary-set="' + styleId + '"]');
    }

    function slides() {
      const set = activeSet();
      return set ? set.querySelectorAll(".summary-slide") : [];
    }

    function render() {
      sets.forEach((s) => s.classList.toggle("hidden", s.dataset.summarySet !== styleId));
      const list = slides();
      list.forEach((s, i) => s.classList.toggle("active", i === idx));
      if (pageNum) pageNum.textContent = String(idx + 1);
      if (pageTotal) pageTotal.textContent = String(list.length || 2);
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx >= list.length - 1;
    }

    function setStyle(id) {
      styleId = id;
      idx = 0;
      styleChips.forEach((c) => c.classList.toggle("active", c.dataset.summaryStyle === id));
      render();
    }

    styleChips.forEach((c) => {
      c.addEventListener("click", () => setStyle(c.dataset.summaryStyle));
    });

    prevBtn.addEventListener("click", () => {
      if (idx > 0) { idx--; render(); }
    });
    nextBtn.addEventListener("click", () => {
      const list = slides();
      if (idx < list.length - 1) { idx++; render(); }
    });

    document.addEventListener("keydown", (e) => {
      const panel = document.getElementById("panel-summary");
      if (!panel || panel.classList.contains("hidden")) return;
      const list = slides();
      if (e.key === "ArrowLeft" && idx > 0) { idx--; render(); }
      else if (e.key === "ArrowRight" && idx < list.length - 1) { idx++; render(); }
    });

    render();
  }

  function initSummaryPhoneZoom() {
    const panel = document.getElementById("panel-summary");
    const overlay = document.getElementById("summary-zoom-overlay");
    if (!panel || !overlay) return;

    const zoomImg = overlay.querySelector(".summary-zoom-img");
    const closeBtn = overlay.querySelector(".summary-zoom-close");
    if (!zoomImg || !closeBtn) return;

    function openZoom(img) {
      if (!isPhoneCompact() || !img || img.hidden) return;
      const src = img.currentSrc || img.src;
      if (!src) return;
      zoomImg.src = src;
      zoomImg.alt = img.alt || "Summary page";
      overlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }

    function closeZoom() {
      overlay.classList.add("hidden");
      zoomImg.removeAttribute("src");
      zoomImg.alt = "";
      document.body.style.overflow = "";
    }

    panel.addEventListener("click", (e) => {
      if (!isPhoneCompact()) return;
      const img = e.target.closest(".summary-slide.active img");
      if (!img || img.hidden) return;
      e.preventDefault();
      openZoom(img);
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeZoom();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeZoom();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeZoom();
    });

    initPhoneCompact(() => {
      if (!isPhoneCompact()) closeZoom();
    });
  }

  function start() {
    if (deckTouch()) deckTouch().initTabletClass();
    renderTexAttrs();
    initTabs();
    initDecks();
    initTools();
    initCrossLab();
    initSummarySlideshow();
    initSummaryPhoneZoom();
  }
  if (window.katex) { window.addEventListener("DOMContentLoaded", start); }
  else { window.addEventListener("DOMContentLoaded", () => {
    // KaTeX is deferred; ensure it is present before first render.
    (function wait() { if (window.katex) start(); else setTimeout(wait, 30); })();
  }); }

  window.FZPhone = { isPhoneCompact, isTouchUI, initPhoneCompact, labelScale };
})();
