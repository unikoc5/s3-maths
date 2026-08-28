/* Worked Solutions tab (Probability) — step-by-step Manim-slides walkthrough
 * synced to a diagram sub-panel that shows the tree diagram / tabulation / figure
 * for the active question, unfolding in step with the working.
 *
 * Source decks (Pre S3 Maths L10–12 Probability, 2025):
 *   L10 Probability I    -> prefix Q10
 *   L11 Probability II   -> prefix Q11   (tree diagrams & tabulation)
 *   L12 Probability III  -> prefix Q12   (expected value)
 *
 * The question bank lives in probability-worked-data.js (window.PBW_BANK).
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  // colour tokens (match the Manim decks / prob_common)
  const COL = {
    fav: "#FFD54F", tot: "#66BB6A", head: "#4FC3F7", tail: "#F06292",
    red: "#EF5350", green: "#66BB6A", blue: "#42A5F5", yellow: "#FFD54F",
    ink: "#cdd6e4", dim: "#94a3b8", line: "#28365c", panel: "#0f172a",
    boy: "#4FC3F7", girl: "#F06292", t: "#66BB6A", f: "#EF5350",
  };
  function col(c) { return COL[c] || c || COL.ink; }

  // ── svg helpers ──
  function E(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function kx(el, tex) { try { katex.render(tex, el, { throwOnError: false }); } catch (e) { el.textContent = tex; } }
  function renderTex(root) { root.querySelectorAll("[data-tex]").forEach((el) => kx(el, el.getAttribute("data-tex"))); }
  function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function ln(p, x1, y1, x2, y2, c, w, dash) {
    const a = { x1, y1, x2, y2, stroke: c, "stroke-width": w || 2, "stroke-linecap": "round" };
    if (dash) a["stroke-dasharray"] = dash; p.appendChild(E("line", a));
  }
  function rect(p, x, y, w, h, fill, stroke, sw, rx) {
    p.appendChild(E("rect", { x, y, width: w, height: h, rx: rx == null ? 8 : rx,
      fill: fill || "none", stroke: stroke || "none", "stroke-width": sw == null ? 1 : sw }));
  }
  function dot(p, cx, cy, r, fill, stroke, sw) {
    p.appendChild(E("circle", { cx, cy, r, fill: fill || "none", stroke: stroke || "none", "stroke-width": sw == null ? 0 : sw }));
  }
  function txt(p, cx, cy, s, c, size, anchor) {
    const t = E("text", { x: cx, y: cy, fill: c || COL.dim, "font-size": size || 14,
      "text-anchor": anchor || "middle", "font-family": "Hanken Grotesk, sans-serif", "font-weight": 600 });
    t.textContent = s; p.appendChild(t);
  }
  // LaTeX label centred at (cx,cy) inside a foreignObject
  function lab(p, cx, cy, tex, c, size, w, h) {
    w = w || 70; h = h || 30;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    fo.setAttribute("overflow", "visible");
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;justify-content:center;" +
      "color:" + (c || COL.ink) + ";font-size:" + (size || 16) + "px;line-height:1.1;";
    kx(div, tex); fo.appendChild(div); p.appendChild(fo);
  }

  /* ════════════════ DIAGRAM LIBRARY (viewBox 0 0 680 360) ════════════════ */
  function setVB(svg, w, h) { svg.setAttribute("viewBox", "0 0 " + w + " " + h); }

  // word: highlight chosen letters of a word.  d = { word, hi:[indices], cap }
  function figWord(svg, d, rv) {
    setVB(svg, 680, 360);
    const chars = (d.word || "").split("");
    const n = chars.length, cw = Math.min(56, 620 / n), y = 150, x0 = 340 - (n * cw) / 2;
    chars.forEach((ch, i) => {
      const x = x0 + i * cw, on = (d.hi || []).indexOf(i) >= 0;
      rect(svg, x + 3, y - 34, cw - 6, 68, on ? "rgba(255,213,79,.18)" : "rgba(148,163,184,.08)",
        on ? COL.fav : COL.line, on ? 2.4 : 1, 9);
      txt(svg, x + cw / 2, y + 9, ch, on ? COL.fav : COL.ink, 28);
    });
    if (d.cap) lab(svg, 340, 250, d.cap, COL.ink, 20, 620, 40);
  }

  // outcomes: sample space as chips, favourable ones glowing.  d = { items:[{t,fav}], cap, cols }
  function figOutcomes(svg, d, rv) {
    const items = d.items || [];
    const cols = d.cols || Math.min(6, items.length || 1);
    const rows = Math.ceil(items.length / cols);
    const cw = 96, ch = 60, gx = 14, gy = 14;
    const W = Math.max(680, cols * cw + (cols - 1) * gx + 60);
    const H = Math.max(220, rows * ch + (rows - 1) * gy + (d.cap ? 130 : 80));
    setVB(svg, W, H);
    const x0 = (W - (cols * cw + (cols - 1) * gx)) / 2, y0 = 40;
    items.forEach((it, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = x0 + c * (cw + gx), y = y0 + r * (ch + gy);
      const on = !!it.fav && rv >= (d.favReveal || 2);
      rect(svg, x, y, cw, ch, on ? "rgba(255,213,79,.16)" : "rgba(27,41,69,.7)",
        on ? COL.fav : COL.line, on ? 2.4 : 1.2, 11);
      lab(svg, x + cw / 2, y + ch / 2, it.t, on ? COL.fav : COL.ink, 19, cw - 8, ch - 8);
    });
    if (d.cap) lab(svg, W / 2, y0 + rows * (ch + gy) + 26, d.cap, COL.tot, 19, W - 40, 40);
  }

  // table / tabulation.  d = { rowH:[..], colH:[..], cells:[[..]], fav:[[r,c]..],
  //   rowLabel, colLabel, cap }
  function figTable(svg, d, rv) {
    const rowH = d.rowH || [], colH = d.colH || [];
    const nr = rowH.length, nc = colH.length;
    const cw = Math.min(88, 560 / Math.max(nc, 1)), ch = 46;
    const lead = 70, top = (d.colLabel ? 40 : 18) + 30;
    const W = Math.max(680, lead + nc * cw + 80);
    const H = top + nr * ch + (d.cap ? 70 : 30) + 20;
    setVB(svg, W, H);
    const x0 = (W - (lead + nc * cw)) / 2 + lead, y0 = top;
    const favset = {};
    (d.fav || []).forEach((p) => { favset[p[0] + "," + p[1]] = 1; });
    if (d.colLabel) txt(svg, x0 + (nc * cw) / 2, y0 - 34, d.colLabel, COL.dim, 13);
    if (d.rowLabel) {
      const t = E("text", { x: x0 - lead + 6, y: y0 + (nr * ch) / 2, fill: COL.dim, "font-size": 13,
        "font-family": "Hanken Grotesk, sans-serif", "font-weight": 600,
        transform: "rotate(-90 " + (x0 - lead + 6) + " " + (y0 + (nr * ch) / 2) + ")", "text-anchor": "middle" });
      t.textContent = d.rowLabel; svg.appendChild(t);
    }
    // column headers
    colH.forEach((h, c) => lab(svg, x0 + c * cw + cw / 2, y0 - 8, h, COL.head, 18, cw - 6, 28));
    // rows
    for (let r = 0; r < nr; r++) {
      lab(svg, x0 - lead / 2 + 6, y0 + 6 + r * ch + ch / 2, rowH[r], COL.tail, 18, lead - 6, 28);
      for (let c = 0; c < nc; c++) {
        const on = favset[r + "," + c] && rv >= (d.favReveal || 2);
        const x = x0 + c * cw, y = y0 + 6 + r * ch;
        rect(svg, x + 2, y + 2, cw - 4, ch - 4, on ? "rgba(255,213,79,.18)" : "rgba(27,41,69,.5)",
          on ? COL.fav : COL.line, on ? 2.2 : 1, 8);
        const cell = (d.cells && d.cells[r] && d.cells[r][c] != null) ? d.cells[r][c] : "";
        lab(svg, x + cw / 2, y + ch / 2, cell, on ? COL.fav : COL.ink, 17, cw - 8, ch - 8);
      }
    }
    if (d.cap) lab(svg, W / 2, y0 + 6 + nr * ch + 34, d.cap, COL.tot, 18, W - 40, 36);
  }

  // tree.  d = { root } where node = { t, c, p, fav, out, children:[] }
  // c = colour token/hex; p = edge probability tex; out = leaf outcome tex; fav = leaf favourable
  function figTree(svg, d, rv) {
    const root = d.root || { children: [] };
    let depth = 0;
    (function dep(n, dd) { n._d = dd; depth = Math.max(depth, dd); (n.children || []).forEach((c) => dep(c, dd + 1)); })(root, 0);
    let slot = 0;
    const LEAFH = d.leafH || 46, TOP = 40, LEFT = 40, LEVELW = d.levelW || 150;
    (function assignY(n) {
      if (!n.children || !n.children.length) { n._y = TOP + slot * LEAFH + LEAFH / 2; slot++; return n._y; }
      let s = 0; n.children.forEach((c) => { s += assignY(c); }); n._y = s / n.children.length; return n._y;
    })(root);
    (function assignX(n) { n._x = LEFT + n._d * LEVELW; (n.children || []).forEach(assignX); })(root);
    const leafLabelW = d.leafLabelW || 150;
    const W = Math.max(LEFT + depth * LEVELW + leafLabelW, 420);
    const H = Math.max(TOP + slot * LEAFH + 16, 200);
    setVB(svg, W, H);
    if (d.stages) d.stages.forEach((s, i) => txt(svg, LEFT + (i + 1) * LEVELW, 22, s, COL.dim, 13));
    dot(svg, root._x, root._y, 7, "#1b2945", COL.dim, 1.6);
    const showFav = rv >= (d.favReveal || 99);
    (function draw(n) {
      (n.children || []).forEach((c, i, arr) => { edge(n, c, i, arr.length); draw(c); });
      if (n !== root) node(n);
    })(root);
    function edge(p, c, i, cnt) {
      const cc = col(c.c);
      ln(svg, p._x, p._y, c._x, c._y, cc, 1.8, null);
      svg.lastChild.setAttribute("opacity", 0.55);
      if (c.p) {
        const t = 0.5 + (i - (cnt - 1) / 2) * 0.16;
        const mx = p._x + (c._x - p._x) * t, my = p._y + (c._y - p._y) * t;
        rect(svg, mx - 19, my - 13, 38, 26, COL.panel, cc, 1, 7);
        svg.lastChild.setAttribute("opacity", 0.97);
        lab(svg, mx, my, c.p, cc, 12, 32, 22);
      }
    }
    function node(n) {
      const cc = col(n.c), leaf = !n.children || !n.children.length;
      const fav = leaf && n.fav && showFav;
      dot(svg, n._x, n._y, 11, cc, fav ? COL.fav : "#0b1324", fav ? 3 : 1.2);
      if (fav) svg.lastChild.setAttribute("filter", "drop-shadow(0 0 4px " + COL.fav + ")");
      if (n.t) txt(svg, n._x, n._y + 5, n.t, "#06121f", 14);
      if (leaf && n.out) {
        const lx = n._x + 16;
        if (fav) { rect(svg, lx - 4, n._y - 13, leafLabelW - 16, 26, "rgba(255,213,79,.16)", COL.fav, 1.5, 7); }
        lab(svg, lx + (leafLabelW - 20) / 2, n._y, n.out, fav ? COL.fav : COL.ink, 14, leafLabelW - 24, 24);
      }
    }
  }

  // spinner / lucky wheel: regular polygon with n equal sectors, some highlighted.
  // d = { n, hi:[indices], labels:[..], cap }
  function figSpinner(svg, d, rv) {
    setVB(svg, 680, 360);
    const cx = 250, cy = 175, R = 130, n = d.n || 8;
    const hi = d.hi || [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const on = hi.indexOf(i) >= 0 && rv >= (d.favReveal || 2);
      const p = E("path", { d: "M " + cx + " " + cy + " L " + x0 + " " + y0 + " A " + R + " " + R + " 0 0 1 " + x1 + " " + y1 + " Z",
        fill: on ? "rgba(255,213,79,.3)" : "rgba(66,165,245,.12)", stroke: on ? COL.fav : "#F8FAFC",
        "stroke-width": on ? 2.4 : 1.6, "stroke-linejoin": "round" });
      svg.appendChild(p);
      const am = (a0 + a1) / 2, lr = R * 0.62;
      const lbl = (d.labels && d.labels[i] != null) ? d.labels[i] : (i + 1);
      txt(svg, cx + lr * Math.cos(am), cy + lr * Math.sin(am) + 5, "" + lbl, on ? COL.fav : COL.ink, 17);
    }
    dot(svg, cx, cy, 6, "#F8FAFC");
    if (d.cap) lab(svg, 500, cy, d.cap, COL.ink, 19, 320, 200);
  }

  // pie chart.  d = { slices:[{label, frac, fav}], cap }   frac in 0..1
  function figPie(svg, d, rv) {
    setVB(svg, 680, 360);
    const cx = 230, cy = 175, R = 135, slices = d.slices || [];
    let a = -Math.PI / 2;
    const palette = ["#42A5F5", "#66BB6A", "#FFD54F", "#F06292", "#AB47BC", "#FF8A65"];
    slices.forEach((s, i) => {
      const a1 = a + s.frac * 2 * Math.PI, large = s.frac > 0.5 ? 1 : 0;
      const x0 = cx + R * Math.cos(a), y0 = cy + R * Math.sin(a);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const on = s.fav && rv >= (d.favReveal || 2);
      const p = E("path", { d: "M " + cx + " " + cy + " L " + x0 + " " + y0 + " A " + R + " " + R + " 0 " + large + " 1 " + x1 + " " + y1 + " Z",
        fill: on ? COL.fav : palette[i % palette.length], "fill-opacity": on ? 0.85 : 0.55,
        stroke: "#0f172a", "stroke-width": 2 });
      svg.appendChild(p);
      const am = (a + a1) / 2, lr = R * 0.6;
      if (s.label) txt(svg, cx + lr * Math.cos(am), cy + lr * Math.sin(am) + 5, s.label, "#0b1324", 14);
      a = a1;
    });
    if (d.cap) lab(svg, 500, cy, d.cap, COL.ink, 18, 300, 220);
  }

  // bar chart.  d = { bars:[{label, v, fav}], cap }
  function figBars(svg, d, rv) {
    setVB(svg, 680, 360);
    const bars = d.bars || [], n = bars.length;
    const x0 = 70, y0 = 280, bw = Math.min(80, 540 / Math.max(n, 1)), gap = 20;
    const maxV = Math.max.apply(null, bars.map((b) => b.v).concat([1]));
    ln(svg, x0 - 6, y0, x0 + n * (bw + gap), y0, COL.dim, 1.6);
    ln(svg, x0 - 6, y0, x0 - 6, 40, COL.dim, 1.6);
    bars.forEach((b, i) => {
      const h = (b.v / maxV) * 210, x = x0 + i * (bw + gap), y = y0 - h;
      const on = b.fav && rv >= (d.favReveal || 2);
      rect(svg, x, y, bw, h, on ? "rgba(255,213,79,.7)" : "rgba(66,165,245,.55)", on ? COL.fav : "#42A5F5", 1.5, 4);
      txt(svg, x + bw / 2, y0 + 20, b.label, COL.ink, 13);
      txt(svg, x + bw / 2, y - 8, "" + b.v, on ? COL.fav : COL.ink, 14);
    });
    if (d.cap) lab(svg, 340, 320, d.cap, COL.tot, 17, 600, 36);
  }

  // generic schematic figure placeholder (dartboards etc.): just a caption.
  function figNote(svg, d, rv) {
    setVB(svg, 680, 220);
    rect(svg, 40, 30, 600, 150, "rgba(27,41,69,.5)", COL.line, 1.2, 12);
    lab(svg, 340, 95, d.cap || "\\text{See the question figure}", COL.dim, 18, 560, 120);
  }

  // schematic dartboard / geometric-probability figures. d = { kind, cap }
  // the shaded (favourable) region is drawn amber; the rest blue-grey.
  function poly(p, pts, fill, stroke, sw) {
    p.appendChild(E("polygon", { points: pts.map((q) => q[0] + "," + q[1]).join(" "),
      fill: fill || "none", stroke: stroke || COL.line, "stroke-width": sw == null ? 1.6 : sw, "stroke-linejoin": "round" }));
  }
  const SH = "rgba(255,213,79,.55)", BL = "rgba(66,165,245,.18)", GR = "rgba(148,163,184,.16)";
  function figGeom(svg, d, rv) {
    setVB(svg, 680, 360);
    const k = d.kind, cx = 200, cy = 180;
    if (k === "triangles16") {
      const A = [cx, 40], H = 250, W = 280;
      const P = (r, i) => {
        const L = [A[0] + (-(W / 2)) * (r / 4), A[1] + H * (r / 4)];
        const R = [A[0] + (W / 2) * (r / 4), A[1] + H * (r / 4)];
        return r === 0 ? A : [L[0] + (R[0] - L[0]) * (i / r), L[1] + (R[1] - L[1]) * (i / r)];
      };
      let idx = 0;
      for (let r = 0; r < 4; r++) {
        for (let i = 0; i <= r; i++) { poly(svg, [P(r, i), P(r + 1, i), P(r + 1, i + 1)], (idx++ % 16) < 9 ? SH : BL, "#0f172a", 1.4); }
        for (let i = 0; i < r; i++) { poly(svg, [P(r, i), P(r, i + 1), P(r + 1, i + 1)], (idx++ % 16) < 9 ? SH : BL, "#0f172a", 1.4); }
      }
    } else if (k === "sectors") {
      // circle: A 90° (top-right), then B,C,D share the rest (2:1:1) clockwise
      const R = 130, segs = [["A", 0, 90, BL], ["B", 90, 225, BL], ["C", 225, 292.5, SH], ["D", 292.5, 360, BL]];
      const rad = (a) => (a - 90) * Math.PI / 180;
      segs.forEach((s) => {
        const a0 = rad(s[1]), a1 = rad(s[2]), large = (s[2] - s[1]) > 180 ? 1 : 0;
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        svg.appendChild(E("path", { d: "M " + cx + " " + cy + " L " + x0 + " " + y0 + " A " + R + " " + R + " 0 " + large + " 1 " + x1 + " " + y1 + " Z",
          fill: s[3], stroke: "#0f172a", "stroke-width": 1.8 }));
        const am = (rad(s[1]) + rad(s[2])) / 2;
        txt(svg, cx + R * 0.6 * Math.cos(am), cy + R * 0.6 * Math.sin(am) + 5, s[0], COL.ink, 18);
      });
    } else if (k === "squares4") {
      const s = 110; // big square side
      rect(svg, cx - s, cy - s, 2 * s, 2 * s, "none", "#0f172a", 1.8, 0);
      ln(svg, cx, cy - s, cx, cy + s, "#0f172a", 1.4); ln(svg, cx - s, cy, cx + s, cy, "#0f172a", 1.4);
      const h = s / 2;
      rect(svg, cx - h, cy - h, h, h, SH, "#0f172a", 1.4, 0);
      rect(svg, cx, cy, h, h, SH, "#0f172a", 1.4, 0);
      rect(svg, cx - h, cy, h, h, BL, "#0f172a", 1.4, 0);
      rect(svg, cx, cy - h, h, h, BL, "#0f172a", 1.4, 0);
    } else if (k === "nested") {
      const sizes = [220, 120, 70, 40];
      sizes.forEach((sz, i) => rect(svg, cx - 110, cy - 110, sz, sz, i === sizes.length - 1 ? GR : (i === 1 ? SH : BL), "#0f172a", 1.6, 0));
      txt(svg, cx - 110 + 200, cy - 110 + 20, "A", COL.ink, 14);
      txt(svg, cx - 110 + 100, cy - 110 + 60, "B", COL.ink, 14);
      txt(svg, cx - 110 + 50, cy - 110 + 100, "C", COL.ink, 14);
    } else if (k === "ring") {
      dot(svg, cx, cy, 135, SH, "#0f172a", 1.8);
      dot(svg, cx, cy, 100, BL, "#0f172a", 1.8);
      lab(svg, cx + 60, cy - 60, "40", COL.ink, 16, 40, 24);
      lab(svg, cx, cy, "30", COL.ink, 16, 40, 24);
    } else if (k === "threecircles") {
      dot(svg, cx + 30, cy, 130, SH, "#0f172a", 1.8);   // big A
      dot(svg, cx - 40, cy, 78, BL, "#0f172a", 1.8);    // medium B (unshaded hole)
      dot(svg, cx - 4, cy, 26, SH, "#0f172a", 1.8);     // small C (shaded again)
    } else if (k === "inscribedTri") {
      const R = 130; dot(svg, cx, cy, R, "rgba(15,23,42,.9)", "#0f172a", 1.8);
      const s = R / Math.SQRT2;
      const TL = [cx - s, cy - s], TR = [cx + s, cy - s], BR = [cx + s, cy + s], BLp = [cx - s, cy + s];
      poly(svg, [TL, TR, BR, BLp], "none", "#cbd5e1", 1.6);
      poly(svg, [TL, TR, BLp], SH, "#cbd5e1", 1.6); // grey/ shaded half-square triangle
    } else if (k === "inscribedSq") {
      const R = 130; dot(svg, cx, cy, R, BL, "#0f172a", 1.8);
      const s = R / Math.SQRT2;
      rect(svg, cx - s, cy - s, 2 * s, 2 * s, SH, "#0f172a", 1.6, 0);
      ln(svg, cx - s, cy - s, cx + s, cy + s, "#94a3b8", 1.2, "5 4");
    } else if (k === "zones") {
      // L12 Q20: square 42 cm, circle r=14, inner diamond A (height 14 cm)
      const half = 105, cr = half * (14 / 21), dh = half * (7 / 21);
      rect(svg, cx - half, cy - half, 2 * half, 2 * half, GR, "#0f172a", 1.8, 0);
      dot(svg, cx, cy, cr, BL, "#0f172a", 1.8);
      poly(svg, [[cx, cy - dh], [cx + dh, cy], [cx, cy + dh], [cx - dh, cy]], SH, "#0f172a", 1.6);
      txt(svg, cx, cy - 4, "A", COL.ink, 16);
      txt(svg, cx + cr * 0.62, cy - cr * 0.15, "B", COL.ink, 15);
      txt(svg, cx + half - 22, cy - half + 18, "C", COL.ink, 15);
    }
    if (d.cap) lab(svg, 510, cy, d.cap, COL.ink, 18, 320, 260);
  }

  const FIG = {
    word: figWord, outcomes: figOutcomes, table: figTable, tree: figTree,
    spinner: figSpinner, pie: figPie, bars: figBars, geom: figGeom, note: figNote,
  };
  const FIG_LABEL = {
    word: "Sample space", outcomes: "Sample space", table: "Tabulation", tree: "Tree diagram",
    spinner: "Lucky wheel", pie: "Pie chart", bars: "Bar chart", geom: "Figure", note: "Figure",
  };

  function drawFigure(svg, fig, reveal) {
    clearSvg(svg);
    if (!fig) return false;
    const fn = FIG[fig.type];
    if (!fn) return false;
    fn(svg, fig.data || {}, reveal == null ? 99 : reveal);
    return true;
  }

  /* ════════════════ CONCEPT REFERENCE (popup modal) ════════════════ */
  const CONCEPTS = {
    "prob-formula": { name: "Probability of an event", tex: "P(E)=\\dfrac{\\text{number of favourable outcomes}}{\\text{total number of outcomes}}", note: "Valid when every outcome is equally likely." },
    "or-rule": { name: "‘A or B’ (mutually exclusive)", tex: "P(A\\text{ or }B)=P(A)+P(B)", note: "Add the counts; if A and B overlap, subtract the overlap once." },
    "complement": { name: "Complement", tex: "P(\\text{not }E)=1-P(E)", note: "Everything that is not E." },
    "and-rule": { name: "‘A and B’ (independent)", tex: "P(A\\text{ and }B)=P(A)\\times P(B)", note: "Multiply along the branches of a tree diagram." },
    "tree": { name: "Tree diagram", tex: "P(\\text{path})=\\text{product of branch probabilities}", note: "List every outcome by following each path from left to right." },
    "table": { name: "Tabulation", tex: "P=\\dfrac{\\text{favourable cells}}{\\text{all cells}}", note: "A grid lists every outcome of two combined actions." },
    "expected": { name: "Expected value", tex: "E=\\sum x_i\\,P(x_i)", note: "Each value times its probability, all added up." },
    "without-rep": { name: "Without replacement", tex: "P=\\dfrac{n_1}{N}\\times\\dfrac{n_2}{N-1}", note: "The total shrinks by one after the first draw." },
  };

  /* ════════════════ ENGINE ════════════════ */
  function mt(tex) { return '<span class="m" data-tex="' + tex + '"></span>'; }
  function cchip(key, label) { return '<button class="method-chip" data-concept="' + key + '"><span data-tex="' + label + '"></span></button>'; }

  let frame, listInner, deckEmpty, scrollEl, titleEl, subEl, qexprEl, prevBtn, nextBtn, resetBtn, progLabel, barFill;
  let modal, modalBody, modalClose, subWrap, subSvg, subLabel, deckBox, expandBtn;
  let active = null, step = 0, loadedDeck = null;
  let SOURCES = [];

  function postSlide(i) {
    let r = null;
    try { r = frame.contentWindow.Reveal; } catch (e) { r = null; }
    if (r && r.isReady && r.isReady()) { try { r.slide(i); return; } catch (e) {} }
    try { frame.contentWindow.postMessage(JSON.stringify({ method: "slide", args: [i] }), "*"); } catch (e) {}
  }

  function stepReveal(i) {
    if (!active || !active.steps) return 99;
    const s = active.steps[i];
    if (s && s.focus && typeof s.focus.reveal === "number") return s.focus.reveal;
    return 99;
  }

  function renderFigure(reveal) {
    if (!subWrap) return;
    if (!active || !active.figure) { subWrap.classList.add("hidden"); return; }
    subWrap.classList.remove("hidden");
    if (subLabel) subLabel.textContent = active.figLabel || FIG_LABEL[active.figure.type] || "Diagram";
    drawFigure(subSvg, active.figure, reveal == null ? 99 : reveal);
  }

  function buildCards() {
    scrollEl.innerHTML = "";
    (active.steps || []).forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "step-card" + (i === 0 ? " active" : "");
      card.dataset.step = i;
      card.innerHTML = '<div class="sc-head"><span class="sc-idx">' + (i + 1) + '</span>' +
        '<span class="sc-title">' + s.title + '</span></div><div class="sc-body">' + s.body + '</div>';
      card.addEventListener("click", (ev) => { if (!ev.target.closest(".method-chip")) setStep(i); });
      scrollEl.appendChild(card);
    });
    renderTex(scrollEl);
    scrollEl.querySelectorAll(".method-chip").forEach((chip) => {
      chip.addEventListener("click", (ev) => { ev.stopPropagation(); if (chip.dataset.concept) openConcept(chip.dataset.concept); });
    });
  }

  function setStep(i) {
    if (!active || !active.steps) return;
    i = Math.max(0, Math.min(active.steps.length - 1, i));
    step = i;
    Array.from(scrollEl.children).forEach((c, idx) => c.classList.toggle("active", idx === i));
    const card = scrollEl.children[i];
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    postSlide(active.steps[i].slide);
    renderFigure(stepReveal(i));
    progLabel.textContent = "Step " + (i + 1) + " / " + active.steps.length;
    barFill.style.width = ((i + 1) / active.steps.length * 100) + "%";
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === active.steps.length - 1;
  }

  function buildSources() {
    listInner.innerHTML = "";
    SOURCES.forEach((src) => {
      const grp = document.createElement("div"); grp.className = "src-group";
      const head = document.createElement("button");
      head.className = "src-head" + (src.open ? "" : " collapsed");
      head.innerHTML = '<span class="src-name">' + src.name + '</span><span class="src-badge">' + src.prefix + '</span><span class="src-caret">\u25be</span>';
      const body = document.createElement("div"); body.className = "src-body" + (src.open ? "" : " hidden");
      src.groups.forEach((g, gi) => {
        if (g.name) { const sh = document.createElement("p"); sh.className = "sub-head"; sh.textContent = g.name; body.appendChild(sh); }
        g.items.forEach((item) => {
          const qid = src.id + ":" + gi + ":" + item.n;
          const b = document.createElement("button"); b.className = "q-row"; b.dataset.qid = qid;
          b.innerHTML = '<span class="qn">' + src.prefix + item.n + '</span>' +
            (item.solved ? '<span class="dot built" title="walkthrough built">\u2713</span>' : '');
          b.addEventListener("click", () => loadQuestion(item, src, qid));
          body.appendChild(b);
        });
      });
      head.addEventListener("click", () => { head.classList.toggle("collapsed"); body.classList.toggle("hidden"); });
      grp.appendChild(head); grp.appendChild(body); listInner.appendChild(grp);
    });
  }

  function loadQuestion(item, src, qid) {
    active = item; step = 0;
    titleEl.textContent = src.prefix + item.n + (item.title ? " \u2014 " + item.title : "");
    subEl.textContent = item.sub || src.name;
    if (qexprEl) {
      const rows = item.question || [{ tag: "", txt: item.q || "" }];
      qexprEl.innerHTML = rows.map((r) => {
        const inner = r.tex ? '<span data-tex="' + r.tex + '"></span>' : '<span class="sp-q-txt">' + (r.txt || "") + '</span>';
        return '<div class="sp-q-row">' + (r.tag ? '<b>' + r.tag + '</b> ' : '') + inner + '</div>';
      }).join("");
      renderTex(qexprEl);
    }
    listInner.querySelectorAll(".q-row").forEach((b) => b.classList.toggle("active", b.dataset.qid === qid));

    if (item.solved) {
      deckEmpty.classList.add("hidden");
      frame.classList.remove("hidden");
      document.getElementById("worked-controls").classList.remove("hidden");
      buildCards();
      renderFigure(stepReveal(0));
      if (loadedDeck !== item.deck) {
        loadedDeck = item.deck;
        frame.onload = () => { setStep(0); setTimeout(() => postSlide(active.steps[step].slide), 700); };
        frame.src = item.deck;
      } else { setStep(0); }
    } else {
      loadedDeck = null;
      renderFigure(active.figure ? 99 : null);
      frame.src = "about:blank";
      frame.classList.add("hidden");
      deckEmpty.classList.remove("hidden");
      document.getElementById("worked-controls").classList.add("hidden");
      scrollEl.innerHTML = '<div class="no-sol">Step-by-step walkthrough not built yet.<br>The question' +
        (item.figure ? ' and its diagram are' : ' is') + ' shown for now.</div>';
      progLabel.textContent = "\u2014"; barFill.style.width = "0%";
      prevBtn.disabled = true; nextBtn.disabled = true;
    }
  }

  function openConcept(key) {
    const f = CONCEPTS[key];
    if (!f) return;
    modalBody.innerHTML = '<p class="mm-tag">Concept used here</p><h3>' + f.name + '</h3>' +
      '<div class="mm-row"><span data-tex="' + f.tex + '"></span></div>' +
      (f.note ? '<p class="mm-note">' + f.note + '</p>' : '');
    renderTex(modalBody);
    modal.classList.remove("hidden");
  }
  function closeModal() { modal.classList.add("hidden"); }

  const Worked = {
    mounted: false,
    mount() {
      if (this.mounted) return;
      frame = document.getElementById("worked-frame");
      listInner = document.getElementById("q-sources");
      deckEmpty = document.getElementById("deck-empty");
      scrollEl = document.getElementById("solution-scroll");
      titleEl = document.getElementById("w-qtitle");
      subEl = document.getElementById("w-qsub");
      qexprEl = document.getElementById("w-qexpr");
      prevBtn = document.getElementById("w-prev");
      nextBtn = document.getElementById("w-next");
      resetBtn = document.getElementById("w-reset");
      progLabel = document.getElementById("w-progress-label");
      barFill = document.getElementById("w-bar-fill");
      modal = document.getElementById("method-modal");
      modalBody = document.getElementById("mm-body");
      modalClose = document.getElementById("mm-close");
      subWrap = document.getElementById("worked-sub");
      subSvg = document.getElementById("sub-svg");
      subLabel = document.getElementById("sub-label");
      deckBox = document.getElementById("worked-deck");
      expandBtn = document.getElementById("deck-expand");
      if (!frame) return;
      this.mounted = true;
      SOURCES = (window.PBW_BANK && window.PBW_BANK()) || [];
      buildSources();
      prevBtn.addEventListener("click", () => setStep(step - 1));
      nextBtn.addEventListener("click", () => setStep(step + 1));
      resetBtn.addEventListener("click", () => setStep(0));
      modalClose.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      if (expandBtn) expandBtn.addEventListener("click", () => {
        const big = deckBox.classList.toggle("big");
        expandBtn.innerHTML = big ? "\u00d7" : "\u292a";
        expandBtn.title = big ? "Shrink" : "Enlarge";
      });
      window.addEventListener("keydown", (e) => { if (!modal.classList.contains("hidden") && e.key === "Escape") closeModal(); });
    },
    show() {
      this.mount();
      // optional deep-link:  #q=<srcId>:<questionNumber>   e.g. #q=l10:16
      const m = /[#&]q=([a-z0-9]+):([0-9]+)/i.exec(location.hash || "");
      if (m) {
        const sid = m[1].toLowerCase(), qn = m[2];
        for (const src of SOURCES) if (src.id === sid) {
          for (let gi = 0; gi < src.groups.length; gi++) for (const it of src.groups[gi].items) {
            if (String(it.n) === qn && it.solved) { loadQuestion(it, src, src.id + ":" + gi + ":" + it.n); return; }
          }
        }
      }
      if (!active) {
        let first = null, firstSrc = null;
        for (const src of SOURCES) for (const g of src.groups) for (const it of g.items) {
          if (!first) { first = it; firstSrc = src; }
          if (it.solved && !(first && first.solved)) { first = it; firstSrc = src; }
        }
        if (first) loadQuestion(first, firstSrc, firstSrc.id + ":0:" + first.n);
      }
    },
  };

  window.PBWorkedKit = { mt, cchip };
  window.PBFigure = {
    draw: function (svg, spec, methods, reveal) {
      if (!spec || !spec.type) return;
      drawFigure(svg, { type: spec.type, data: spec.data || {} }, reveal == null ? 99 : reveal);
    },
    renderTex: renderTex,
  };
  window.ProbWorked = Worked;
})();
