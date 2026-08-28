/* Worked Solutions tab (Area & Volume) — single top animation panel (Manim deck or
 * labelled SVG diagram) with progressive step cards below. Pure-algebra questions
 * collapse the animation panel. *
 * Source decks:
 * Source deck: "Pre S3 Maths L07-09 Area and Volume (2025)" -> prefixes QA/QB/QC
 * Question numbers are preserved; the lesson letter disambiguates repeats.
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  // ── colour tokens (match the Manim decks / av_styles) ──
  const COL = {
    r: "#4FC3F7", l: "#4FC3F7", w: "#FFD54F", b: "#FFD54F", h: "#66BB6A",
    slant: "#F06292", ink: "#cdd6e4", dim: "#94a3b8", face: "#FFD54F",
    body: "#90CAF9", water: "#4DD0E1", solid: "#CE93D8",
  };

  // ── svg helpers ──
  function E(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function kx(el, tex) {
    const block = el.closest(".sc-line") || el.closest(".sp-q-row");
    const opts = { throwOnError: false, displayMode: !!block, strict: "ignore" };
    try { katex.render(tex, el, opts); } catch (e) { el.textContent = tex; }
  }
  function renderTex(root) { root.querySelectorAll("[data-tex]").forEach((el) => kx(el, el.getAttribute("data-tex"))); }
  function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function ln(p, x1, y1, x2, y2, col, w, dash) {
    const a = { x1, y1, x2, y2, stroke: col, "stroke-width": w || 2, "stroke-linecap": "round" };
    if (dash) a["stroke-dasharray"] = dash; p.appendChild(E("line", a));
  }
  function poly(p, pts, fill, op, stroke, sw, dash) {
    const a = { points: pts.map((q) => q[0] + "," + q[1]).join(" "), fill, "fill-opacity": op == null ? 0.32 : op,
      stroke: stroke || "#F8FAFC", "stroke-width": sw == null ? 2.4 : sw, "stroke-linejoin": "round" };
    if (dash) a["stroke-dasharray"] = dash; p.appendChild(E("polygon", a));
  }
  function ell(p, cx, cy, rx, ry, fill, op, stroke, sw, dash) {
    const a = { cx, cy, rx, ry, fill: fill || "none", "fill-opacity": op == null ? 0 : op,
      stroke: stroke || "#F8FAFC", "stroke-width": sw == null ? 2.4 : sw };
    if (dash) a["stroke-dasharray"] = dash; p.appendChild(E("ellipse", a));
  }
  function circ(p, cx, cy, r, fill, op, stroke, sw) {
    p.appendChild(E("circle", { cx, cy, r, fill: fill || "none", "fill-opacity": op == null ? 0 : op,
      stroke: stroke || "#F8FAFC", "stroke-width": sw == null ? 2.4 : sw }));
  }
  // a half-ellipse arc (front solid / back dashed) as an SVG path
  function halfEll(p, cx, cy, rx, ry, lower, stroke, sw, dash) {
    const sweep = lower ? 0 : 1;
    const a = { d: "M " + (cx - rx) + " " + cy + " A " + rx + " " + ry + " 0 0 " + sweep + " " + (cx + rx) + " " + cy,
      fill: "none", stroke: stroke || "#F8FAFC", "stroke-width": sw == null ? 2.4 : sw };
    if (dash) a["stroke-dasharray"] = dash; p.appendChild(E("path", a));
  }
  // LaTeX label centred at (cx,cy) with a dark pill background for contrast
  function lab(p, cx, cy, tex, color, size, w, h, hi) {
    w = w || 64; h = h || 30;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    fo.setAttribute("overflow", "visible");
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;justify-content:center;";
    const span = document.createElement("span");
    const bg = hi ? "rgba(79,195,247,.42)" : "rgba(8,14,28,.82)";
    const border = hi ? "2px solid #4FC3F7" : "none";
    span.style.cssText = "color:" + (color || COL.ink) + ";font-size:" + (size || 17) + "px;background:" + bg +
      ";border:" + border + ";padding:1px 6px;border-radius:7px;line-height:1.2;white-space:nowrap;font-weight:" + (hi ? "700" : "400") + ";";
    kx(span, tex); div.appendChild(span); fo.appendChild(div); p.appendChild(fo);
  }
  function txt(p, cx, cy, s, color, size) {
    const t = E("text", { x: cx, y: cy, fill: color || COL.dim, "font-size": size || 13,
      "text-anchor": "middle", "font-family": "Hanken Grotesk, sans-serif" });
    t.textContent = s; p.appendChild(t);
  }

  /* ════════════════ DIAGRAM LIBRARY ════════════════
   * Each drawer renders one labelled figure into the sub-panel svg (viewBox
   * 0 0 680 320). `d` carries the dimension labels (LaTeX strings). The figures
   * are schematic but accurately proportioned and clearly labelled.
   */
  function gctx(svg) { const g = E("g", {}); svg.appendChild(g); return g; }

  function figCuboid(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, by = 235, w = 200, ht = 120, ox = 78, oy = 50;
    const A = [cx - w / 2, by], B = [cx + w / 2, by], C = [cx + w / 2, by - ht], D = [cx - w / 2, by - ht];
    const A2 = [A[0] + ox, A[1] - oy], B2 = [B[0] + ox, B[1] - oy], C2 = [C[0] + ox, C[1] - oy], D2 = [D[0] + ox, D[1] - oy];
    poly(g, [A2, B2, C2, D2], COL.body, 0.18);
    ln(g, A[0], A[1], A2[0], A2[1], "#6b7da8", 1.6, "5 4");
    ln(g, A2[0], A2[1], B2[0], B2[1], "#6b7da8", 1.6, "5 4");
    ln(g, A2[0], A2[1], D2[0], D2[1], "#6b7da8", 1.6, "5 4");
    poly(g, [D, C, C2, D2], COL.face, 0.5);
    poly(g, [B, C, C2, B2], COL.body, 0.22);
    poly(g, [A, B, C, D], COL.body, 0.3);
    if (rv >= 1) {
      lab(g, cx, by + 22, d.w || "l", COL.r, 17);
      lab(g, B[0] + ox / 2 + 26, by - oy / 2 + 4, d.d || "w", COL.w, 17);
      lab(g, A[0] - 24, by - ht / 2, d.h || "h", COL.h, 17);
    }
  }

  function figPrismTri(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, by = 250, base = 170, hT = 120, ox = 150, oy = 38;
    const A = [cx - base / 2, by], B = [cx + base / 2, by], T = [cx - base / 2 + 50, by - hT];
    const A2 = [A[0] + ox, A[1] - oy], B2 = [B[0] + ox, B[1] - oy], T2 = [T[0] + ox, T[1] - oy];
    ln(g, A[0], A[1], A2[0], A2[1], "#6b7da8", 1.6, "5 4");
    poly(g, [A2, B2, T2], COL.body, 0.16);
    poly(g, [B, B2, T2, T], COL.body, 0.22);
    poly(g, [A, B, T], COL.face, 0.42);
    ln(g, T[0], T[1], T2[0], T2[1], "#F8FAFC", 2.2);
    if (rv >= 1) {
      lab(g, cx, by + 22, d.b || "b", COL.w, 16);
      lab(g, (A[0] + T[0]) / 2 - 26, (A[1] + T[1]) / 2, d.h || "h", COL.h, 16);
      lab(g, (B[0] + B2[0]) / 2 + 14, (B[1] + B2[1]) / 2 + 8, d.len || "L", COL.r, 16);
    }
  }

  function arrowLine(g, x1, y1, x2, y2, col, w, both) {
    ln(g, x1, y1, x2, y2, col, w || 2.4);
    const ang = Math.atan2(y2 - y1, x2 - x1), s = 7;
    function head(x, y, a) {
      ln(g, x, y, x + s * Math.cos(a + 2.45), y + s * Math.sin(a + 2.45), col, w);
      ln(g, x, y, x + s * Math.cos(a - 2.45), y + s * Math.sin(a - 2.45), col, w);
    }
    head(x2, y2, ang);
    if (both) head(x1, y1, ang + Math.PI);
  }

  function figCylinder(svg, d, rv) {
    const g = gctx(svg);
    const VB_W = 680, VB_H = 320;
    const rx = 102, ry = 30, topY = 68, botY = 236;
    const cx = VB_W / 2 + 18;
    const rc = d.rc || COL.r;
    const hc = d.hc || "#64B5F6";
    const C_CIRC = "#FFD54F", C_TSA = "#F48FB1", C_VOL = "#F06292";
    const ink = "#CBD5E1";
    const circHi = rv >= 1 && rv <= 2;
    const tsaHi = rv >= 3 && rv <= 4;
    const volHi = rv >= 5;
    const showRLab = !!d.r;
    const showHLab = !!d.h;
    function cylRTex() {
      if (d.r === "16") return "\\mathbf{16}";
      return "\\mathit{r}\\text{ mm}";
    }
    function cylHTex() {
      if (d.h === "25") return "\\mathbf{25}";
      return "\\mathit{h}\\text{ mm}";
    }

    // Wireframe first; highlight fills/overlays last so nothing gets painted over.
    ln(g, cx - rx, topY, cx - rx, botY, ink, 2.6);
    ln(g, cx + rx, topY, cx + rx, botY, ink, 2.6);
    halfEll(g, cx, botY, rx, ry, false, "#475569", 1.6, "5 4");

    if (!volHi && !tsaHi && !circHi) {
      poly(g, [[cx - rx, topY], [cx + rx, topY], [cx + rx, botY], [cx - rx, botY]], COL.body, 0.18, "none", 0);
      ell(g, cx, topY, rx, ry, COL.face, 0.42, "none", 0);
      halfEll(g, cx, botY, rx, ry, true, ink, 2.6);
    } else if (circHi) {
      ell(g, cx, botY, rx, ry, "none", 0, C_CIRC, 4.2);
    } else if (!volHi) {
      halfEll(g, cx, botY, rx, ry, true, ink, 2.6);
    }

    if (tsaHi) {
      poly(g, [[cx - rx, topY], [cx + rx, topY], [cx + rx, botY], [cx - rx, botY]], C_TSA, 0.28, "none", 0);
    }
    if (volHi) {
      poly(g, [[cx - rx, topY], [cx + rx, topY], [cx + rx, botY], [cx - rx, botY]], C_VOL, 0.38, "none", 0);
      ell(g, cx, topY, rx, ry, C_VOL, 0.42, C_VOL, 2.4);
      ell(g, cx, botY, rx, ry, C_VOL, 0.42, C_VOL, 2.4);
    }

    ell(g, cx, topY, rx, ry, "none", 0, volHi ? C_VOL : ink, volHi ? 2.4 : 2.6);

    if (showRLab) {
      arrowLine(g, cx, botY, cx + rx, botY, rc, 2.8, true);
      lab(g, cx + rx / 2, botY + 22, cylRTex(), rc, 18, d.r === "16" ? 52 : 72, 30);
    }
    if (showHLab) {
      const ax = cx + rx + 34;
      arrowLine(g, ax, topY, ax, botY, hc, 2.8, true);
      lab(g, ax + 22, (topY + botY) / 2, cylHTex(), hc, 18, d.h === "25" ? 52 : 72, 30);
    }
  }

  function figCone(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, ry = 34, rx = 92, apexY = 80, botY = 245;
    poly(g, [[cx, apexY], [cx - rx, botY], [cx + rx, botY]], COL.body, 0.2, "none", 0);
    halfEll(g, cx, botY, rx, ry, false, "#6b7da8", 1.6, "5 4");
    halfEll(g, cx, botY, rx, ry, true, "#F8FAFC", 2.4);
    ell(g, cx, botY, rx, ry, COL.face, 0.32, "none", 0);
    ln(g, cx, apexY, cx - rx, botY, "#F8FAFC", 2.4);
    ln(g, cx, apexY, cx + rx, botY, (d.slant && rv >= 2) ? COL.slant : "#F8FAFC", (d.slant && rv >= 2) ? 2.8 : 2.4);
    if (rv >= 1) {
      ln(g, cx, apexY, cx, botY, COL.h, 2.2, "5 4");
      lab(g, cx - 18, (apexY + botY) / 2, d.h || "h", COL.h, 16);
      ln(g, cx, botY, cx + rx, botY, COL.r, 2.6);
      lab(g, cx + rx / 2, botY + 20, d.r || "r", COL.r, 16);
    }
    if (d.slant && rv >= 2) lab(g, (cx + cx + rx) / 2 + 26, (apexY + botY) / 2, d.slant, COL.slant, 16);
  }

  function figSphere(svg, d, rv) {
    const g = gctx(svg);
    const cx = d.cx != null ? d.cx : 340, cy = d.cy != null ? d.cy : 160, R = 95;
    const rCol = d.rc || COL.r;
    circ(g, cx, cy, R, COL.water, 0.18, "#F8FAFC", 2.4);
    halfEll(g, cx, cy, R, R * 0.32, false, "#6b7da8", 1.6, "5 4");
    halfEll(g, cx, cy, R, R * 0.32, true, "#F8FAFC", 2.0);
    if (rv >= 1) {
      ln(g, cx, cy, cx + R, cy, rCol, 2.6, d.rDash ? "5 4" : null);
      lab(g, cx + R / 2, cy - 16, d.r || "r", rCol, 16);
    }
  }

  function drawSphereShaded(parent, cx, cy, R, fillHex, fillOp, strokeHex, sw, className) {
    const grp = E("g", {});
    if (className) grp.setAttribute("class", className);
    circ(grp, cx, cy, R, fillHex, fillOp == null ? 0.28 : fillOp, strokeHex || "#F8FAFC", sw || 2);
    halfEll(grp, cx, cy, R, R * 0.28, false, "#6b7da8", 1.3, "4 3");
    halfEll(grp, cx, cy, R, R * 0.28, true, strokeHex || "#F8FAFC", (sw || 2) * 0.85);
    parent.appendChild(grp);
    return grp;
  }

  /** QB11 — single large sphere (radius 15 cm), centred in the panel. */
  function figSphereRecast(svg, d, rv) {
    const g = gctx(svg);
    const largeCol = d.largeRc || "#FFB74D";
    const cx = 340, cy = 160, R = 92;
    drawSphereShaded(g, cx, cy, R, largeCol, 0.34, "#F8FAFC", 2.4);
    ln(g, cx, cy, cx + R, cy, largeCol, 2.6);
    lab(g, cx + R / 2, cy - 18, d.largeR || "15", largeCol, 17, 44, 28);
  }

  function figHemisphere(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, cy = 175, R = 100;
    const p = E("path", { d: "M " + (cx - R) + " " + cy + " A " + R + " " + R + " 0 0 1 " + (cx + R) + " " + cy + " Z",
      fill: COL.water, "fill-opacity": 0.2, stroke: "#F8FAFC", "stroke-width": 2.4 });
    g.appendChild(p);
    halfEll(g, cx, cy, R, R * 0.3, true, "#F8FAFC", 2.4);
    halfEll(g, cx, cy, R, R * 0.3, false, "#6b7da8", 1.6, "5 4");
    if (rv >= 1) {
      ln(g, cx, cy, cx + R, cy, COL.r, 2.6);
      lab(g, cx + R / 2, cy - 16, d.r || "r", COL.r, 16);
    }
  }

  function figPyramid(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, by = 245, base = 150, ox = 95, oy = 40, hT = 165;
    const A = [cx - base / 2, by], B = [cx + base / 2, by];
    const A2 = [A[0] + ox, A[1] - oy], B2 = [B[0] + ox, B[1] - oy];
    const baseC = [(A[0] + B[0] + A2[0] + B2[0]) / 4, (A[1] + B[1] + A2[1] + B2[1]) / 4];
    const apex = [baseC[0], baseC[1] - hT];
    poly(g, [A, B, B2, A2], COL.face, 0.4);
    ln(g, apex[0], apex[1], A2[0], A2[1], "#6b7da8", 1.6, "5 4");
    ln(g, apex[0], apex[1], A[0], A[1], "#F8FAFC", 2.4);
    ln(g, apex[0], apex[1], B[0], B[1], "#F8FAFC", 2.4);
    ln(g, apex[0], apex[1], B2[0], B2[1], "#F8FAFC", 2.4);
    ln(g, apex[0], apex[1], baseC[0], baseC[1], COL.h, 2.2, "5 4");
    if (rv >= 1) {
      lab(g, baseC[0] - 20, (apex[1] + baseC[1]) / 2, d.h || "h", COL.h, 16);
      lab(g, cx, by + 20, d.b || "a", COL.r, 16);
      lab(g, (B[0] + B2[0]) / 2 + 20, (B[1] + B2[1]) / 2 + 6, d.d || "a", COL.w, 16);
    }
  }

  function figFrustum(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, topY = 95, botY = 245, rxT = 52, rxB = 100, ry = 26;
    poly(g, [[cx - rxT, topY], [cx + rxT, topY], [cx + rxB, botY], [cx - rxB, botY]], COL.body, 0.2, "none", 0);
    halfEll(g, cx, botY, rxB, ry, false, "#6b7da8", 1.6, "5 4");
    halfEll(g, cx, botY, rxB, ry, true, "#F8FAFC", 2.4);
    ln(g, cx - rxT, topY, cx - rxB, botY, "#F8FAFC", 2.4);
    ln(g, cx + rxT, topY, cx + rxB, botY, "#F8FAFC", 2.4);
    ell(g, cx, topY, rxT, ry * 0.8, COL.face, 0.5, "#F8FAFC", 2.4);
    if (rv >= 1) {
      ln(g, cx, topY, cx + rxT, topY, COL.r, 2.4);
      lab(g, cx + rxT / 2, topY - 14, d.rt || "r", COL.r, 15);
      ln(g, cx, botY, cx + rxB, botY, COL.w, 2.4);
      lab(g, cx + rxB / 2, botY + 18, d.rb || "R", COL.w, 15);
      ln(g, cx - rxB - 24, topY, cx - rxB - 24, botY, COL.h, 2.2);
      lab(g, cx - rxB - 42, (topY + botY) / 2, d.h || "h", COL.h, 15);
    }
  }

  function figCylHemi(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, rx = 80, ry = 26, topY = 90, botY = 210;
    poly(g, [[cx - rx, topY], [cx + rx, topY], [cx + rx, botY], [cx - rx, botY]], COL.body, 0.2, "none", 0);
    const p = E("path", { d: "M " + (cx - rx) + " " + botY + " A " + rx + " " + rx + " 0 0 0 " + (cx + rx) + " " + botY,
      fill: COL.water, "fill-opacity": 0.2, stroke: "#F8FAFC", "stroke-width": 2.4 });
    g.appendChild(p);
    ln(g, cx - rx, topY, cx - rx, botY, "#F8FAFC", 2.4);
    ln(g, cx + rx, topY, cx + rx, botY, "#F8FAFC", 2.4);
    ell(g, cx, topY, rx, ry, COL.face, 0.5, "#F8FAFC", 2.4);
    if (rv >= 1) {
      ln(g, cx, topY, cx + rx, topY, COL.r, 2.4);
      lab(g, cx + rx / 2, topY - 14, d.r || "r", COL.r, 15);
      ln(g, cx + rx + 24, topY, cx + rx + 24, botY, COL.h, 2.2);
      lab(g, cx + rx + 42, (topY + botY) / 2, d.h || "h", COL.h, 15);
    }
  }

  function figCircle(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, cy = 160, R = 100;
    circ(g, cx, cy, R, COL.body, 0.2, "#F8FAFC", 2.4);
    if (rv >= 1) {
      ln(g, cx, cy, cx + R, cy, COL.r, 2.6);
      lab(g, cx + R / 2, cy - 16, d.r || "r", COL.r, 16);
    }
  }

  function figSector(svg, d, rv) {
    const g = gctx(svg);
    const cx = 200, cy = 230, R = 150, a0 = -Math.PI * 0.08, a1 = -Math.PI * 0.62;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const p = E("path", { d: "M " + cx + " " + cy + " L " + x0 + " " + y0 + " A " + R + " " + R + " 0 0 0 " + x1 + " " + y1 + " Z",
      fill: COL.body, "fill-opacity": 0.28, stroke: "#F8FAFC", "stroke-width": 2.4, "stroke-linejoin": "round" });
    g.appendChild(p);
    if (rv >= 1) {
      lab(g, (cx + x0) / 2, (cy + y0) / 2 + 16, d.r || "r", COL.r, 16);
      lab(g, cx + 64, cy - 40, d.ang || "\\theta", COL.slant, 16);
    }
  }

  function figSimilar(svg, d, rv) {
    const g = gctx(svg);
    figSmallCyl(g, 150, 0.7, d.r1 || "r_1", d.h1 || "h_1", rv);
    figSmallCyl(g, 440, 1.0, d.r2 || "r_2", d.h2 || "h_2", rv);
    txt(g, 295, 170, "\u2192", COL.dim, 30);
    txt(g, 150, 300, "\u2460", COL.r, 20);
    txt(g, 440, 300, "\u2461", COL.w, 20);
  }

  // Pair of similar right triangles (QC4) — 3-4-5 family, right angle bottom-left.
  function figSimilarTriPair(svg, d, rv) {
    const g = gctx(svg);
    const C_HYP = "#66BB6A", FILL = "#b0bec5";
    const u = 28;
    function drawTri(bx, by, legW, legH, hyp, areaTex, showLbl) {
      const bl = [bx, by], br = [bx + legW, by], tl = [bx, by - legH];
      poly(g, [bl, br, tl], FILL, 0.55, "#F8FAFC", 2.6);
      rightAngleMark(g, bx, by, 14, "bl");
      if (showLbl) {
        const mx = (br[0] + tl[0]) / 2 + 12, my = (br[1] + tl[1]) / 2 - 10;
        lab(g, mx, my, "\\mathbf{" + hyp + "}\\text{ cm}", C_HYP, 19, 72, 32);
        lab(g, bx + legW / 2, by + 34, "\\text{area}=\\color{#FFD54F}{" + areaTex + "}\\text{ cm}^2", COL.ink, 17, 132, 32);
      }
    }
    drawTri(55, 262, 4 * u, 3 * u, d.hyp1 || "3", d.area1 || "2.7", rv >= 1);
    drawTri(355, 262, (20 / 3) * u, 5 * u, d.hyp2 || "5", d.area2 || "T", rv >= 1);
  }
  function figSmallCyl(g, cx, scale, rlab, hlab, rv) {
    const rx = 55 * scale, ry = 18 * scale, topY = 150 - 70 * scale, botY = 250;
    poly(g, [[cx - rx, topY], [cx + rx, topY], [cx + rx, botY], [cx - rx, botY]], COL.body, 0.2, "none", 0);
    ln(g, cx - rx, topY, cx - rx, botY, "#F8FAFC", 2.2);
    ln(g, cx + rx, topY, cx + rx, botY, "#F8FAFC", 2.2);
    halfEll(g, cx, botY, rx, ry, true, "#F8FAFC", 2.2);
    ell(g, cx, topY, rx, ry, COL.face, 0.5, "#F8FAFC", 2.2);
    if (rv == null || rv >= 1) {
      if (rlab) lab(g, cx, topY - 4, rlab, COL.r, 14, 48, 22);
      if (hlab) lab(g, cx + rx + 22, (topY + botY) / 2, hlab, COL.h, 14, 48, 22);
    }
  }

  // Water container: a cylinder partly full, optionally with a submerged solid.
  // reveal model: rv0 empty container, rv1 + radius/solid, rv2 + water level & depth
  // (the depth is frequently the answer, so it is held back to the final step).
  function figWater(svg, d, rv) {
    const g = gctx(svg);
    const cx = 250, rx = 95, ry = 30, topY = 80, botY = 250;
    const waterY = d.full ? topY + 14 : topY + 70;
    const showWater = rv >= 2;
    if (showWater) {
      poly(g, [[cx - rx, waterY], [cx + rx, waterY], [cx + rx, botY], [cx - rx, botY]], COL.water, 0.32, "none", 0);
      halfEll(g, cx, botY, rx, ry, true, COL.water, 2.4);
      ell(g, cx, waterY, rx, ry, COL.water, 0.5, COL.water, 2.2);
    }
    ln(g, cx - rx, topY, cx - rx, botY, "#F8FAFC", 2.4);
    ln(g, cx + rx, topY, cx + rx, botY, "#F8FAFC", 2.4);
    halfEll(g, cx, botY, rx, ry, false, "#6b7da8", 1.6, "5 4");
    halfEll(g, cx, botY, rx, ry, true, "#F8FAFC", 2.4);
    ell(g, cx, topY, rx, ry, "none", 0, "#F8FAFC", 2.4);
    if (rv >= 1 && d.ball) circ(g, cx, showWater ? (waterY + botY) / 2 + 10 : botY - 42, 34, COL.solid, 0.5, "#F8FAFC", 2.2);
    if (rv >= 1 && d.r) { ln(g, cx, topY, cx + rx, topY, COL.r, 2.4); lab(g, cx + rx / 2, topY - 14, d.r, COL.r, 15); }
    if (showWater) {
      ln(g, cx + rx + 24, waterY, cx + rx + 24, botY, COL.h, 2.2);
      lab(g, cx + rx + 46, (waterY + botY) / 2, d.depth || "h", COL.h, 15);
    }
  }

  function rightAngleMark(g, x, y, s, corner) {
    const c = "#1e293b";
    if (corner === "bl") {
      poly(g, [[x, y - s], [x + s, y - s], [x + s, y], [x, y]], "none", 0, c, 1.6);
      ln(g, x, y - s, x + s, y - s, c, 1.6);
      ln(g, x + s, y - s, x + s, y, c, 1.6);
    } else {
      poly(g, [[x, y + s], [x + s, y + s], [x + s, y], [x, y]], "none", 0, c, 1.6);
      ln(g, x, y + s, x + s, y + s, c, 1.6);
      ln(g, x + s, y + s, x + s, y, c, 1.6);
    }
  }

  function figPrismTrap(svg, d, rv) {
    const g = gctx(svg);
    const VB_W = 680, VB_H = 320;
    // Right-angled trapezium front face: BL(0,0) TL(0,4) TR(4,4) BR(7,0); length 10 → depth
    const u = 21 * 1.2;
    const bw = 7 * u, tw = 4 * u, hT = 4 * u;
    const dx = 10 * u * 0.58, dy = -10 * u * 0.20;

    function build(lx, by) {
      const BL = [lx, by], BR = [lx + bw, by];
      const TL = [lx, by - hT], TR = [lx + tw, by - hT];
      const BL2 = [BL[0] + dx, BL[1] + dy], BR2 = [BR[0] + dx, BR[1] + dy];
      const TL2 = [TL[0] + dx, TL[1] + dy], TR2 = [TR[0] + dx, TR[1] + dy];
      return { BL, BR, TL, TR, BL2, BR2, TL2, TR2, by };
    }

    const probeBy = hT + 48;
    const probe = build(0, probeBy);
    const corners = [probe.BL, probe.BR, probe.TL, probe.TR, probe.BL2, probe.BR2, probe.TL2, probe.TR2];
    const minX = Math.min.apply(null, corners.map((p) => p[0])) - 70;
    const maxX = Math.max.apply(null, corners.map((p) => p[0])) + 58;
    const minY = Math.min.apply(null, corners.map((p) => p[1])) - 29;
    const maxY = probeBy + 33;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const lx = VB_W / 2 - cx;
    const by = probeBy + (VB_H / 2 - cy);

    const P = build(lx, by);
    const BL = P.BL, BR = P.BR, TL = P.TL, TR = P.TR;
    const BL2 = P.BL2, BR2 = P.BR2, TL2 = P.TL2, TR2 = P.TR2;
    const G_TOP = "#e2e8f0", G_FRONT = "#94a3b8", G_RIGHT = "#64748b", G_LEFT = "#7c8798";
    const baseHi = rv === 2 || rv === 3;
    const hiLen = rv === 3;
    const volHi = rv >= 4;
    const showLbl = rv >= 1;
    const ink = "#0f172a";
    const lenCx = (BR[0] + BR2[0]) / 2 + 16, lenCy = (BR[1] + BR2[1]) / 2 + 10;

    // Hidden / rear edges
    ln(g, BL2[0], BL2[1], BR2[0], BR2[1], "#475569", 1.5, "5 4");
    ln(g, BL[0], BL[1], BL2[0], BL2[1], "#475569", 1.5, "5 4");
    ln(g, TL[0], TL[1], TL2[0], TL2[1], "#475569", 1.5, "5 4");

    // Left face (vertical 4 cm edge)
    poly(g, [BL, TL, TL2, BL2], G_LEFT, 0.62, ink, 1.6);
    // Top face
    poly(g, [TL, TR, TR2, TL2], G_TOP, 0.88, ink, 1.8);
    // Right slanted face
    poly(g, [BR, TR, TR2, BR2], G_RIGHT, 0.72, ink, 1.8);
    // Front face — right-angled trapezium base
    poly(g, [BL, BR, TR, TL], baseHi ? "#FFD54F" : G_FRONT, baseHi ? 0.82 : 0.88, ink, 2.2);
    if (baseHi) poly(g, [BL, BR, TR, TL], "none", 0, "#FFD54F", 3.2);

    if (volHi) {
      const R = "#F48FB1";
      poly(g, [BL, BR, TR, TL], R, 0.38, R, 2.2);
      poly(g, [BL, TL, TL2, BL2], R, 0.32, "none", 0);
      poly(g, [TL, TR, TR2, TL2], R, 0.32, "none", 0);
      poly(g, [BR, TR, TR2, BR2], R, 0.32, "none", 0);
    }

    // Visible depth edges
    ln(g, BR[0], BR[1], BR2[0], BR2[1], hiLen ? COL.l : ink, hiLen ? 3.4 : 2.2);
    ln(g, TR[0], TR[1], TR2[0], TR2[1], ink, 2.2);

    // Front outline
    ln(g, BL[0], BL[1], BR[0], BR[1], ink, 2.2);
    ln(g, BL[0], BL[1], TL[0], TL[1], ink, 2.2);
    ln(g, TL[0], TL[1], TR[0], TR[1], ink, 2.2);
    ln(g, TR[0], TR[1], BR[0], BR[1], ink, 2.2);

    rightAngleMark(g, BL[0], BL[1], 11, "bl");
    rightAngleMark(g, TL[0], TL[1], 11, "tl");

    if (showLbl) {
      const lbl = "#F8FAFC";
      lab(g, (BL[0] + BR[0]) / 2, by + 18, "\\mathbf{" + (d.bot || "7") + "}\\text{ cm}", lbl, 17, 76, 30);
      lab(g, (TL[0] + TR[0]) / 2, TL[1] - 14, "\\mathbf{" + (d.top || "4") + "}\\text{ cm}", lbl, 17, 76, 30);
      lab(g, BL[0] - 32, (BL[1] + TL[1]) / 2, "\\mathbf{" + (d.h || "4") + "}\\text{ cm}", lbl, 17, 76, 30);
      const sx = (TR[0] + BR[0]) / 2 + 20, sy = (TR[1] + BR[1]) / 2 - 6;
      lab(g, sx, sy, "\\mathbf{" + (d.slant || "5") + "}\\text{ cm}", lbl, 17, 76, 30);
      lab(g, lenCx, lenCy, "\\mathbf{" + (d.len || "10") + "}\\text{ cm}", hiLen ? "#F8FAFC" : lbl, 17, 84, 30, hiLen);
    }
  }

  const FIG = {
    cuboid: figCuboid, prism: figCuboid, prism_tri: figPrismTri, prism_trap: figPrismTrap, cylinder: figCylinder,
    cone: figCone, sphere: figSphere, sphere_recast: figSphereRecast, hemisphere: figHemisphere, pyramid: figPyramid,
    frustum: figFrustum, cyl_hemi: figCylHemi, cone_cyl: figCylHemi, circle: figCircle,
    sector: figSector, similar: figSimilar, similar_tri: figSimilarTriPair, water: figWater,
  };

  const FIG_LABEL = {
    cuboid: "Cuboid / prism", prism: "Prism", prism_tri: "Triangular prism", prism_trap: "Trapezoidal prism", cylinder: "Cylinder",
    cone: "Cone", sphere: "Sphere", sphere_recast: "Large sphere", hemisphere: "Hemisphere", pyramid: "Pyramid",
    frustum: "Frustum", cyl_hemi: "Cylinder + hemisphere", cone_cyl: "Cone + cylinder",
    circle: "Circle", sector: "Sector", similar: "Similar solids", similar_tri: "Similar triangles", water: "Water displacement",
  };

  function drawFigure(svg, fig, reveal) {
    clearSvg(svg);
    if (!fig) return false;
    const fn = FIG[fig.type];
    if (!fn) return false;
    fn(svg, fig.data || {}, reveal == null ? 99 : reveal);
    return true;
  }

  /* ════════════════ FORMULA REFERENCE (for the popup modal) ════════════════ */
  const FORMULAS = {
    "vol-cylinder": { name: "Volume of a cylinder", tex: "V=\\pi r^2 h", note: "Base area (\\pi r^2) times height h." },
    "vol-cone": { name: "Volume of a cone", tex: "V=\\tfrac{1}{3}\\pi r^2 h", note: "One third of the cylinder on the same base." },
    "vol-sphere": { name: "Volume of a sphere", tex: "V=\\tfrac{4}{3}\\pi r^3", note: "Depends only on the radius r." },
    "vol-hemisphere": { name: "Volume of a hemisphere", tex: "V=\\tfrac{2}{3}\\pi r^3", note: "Half a sphere." },
    "vol-prism": { name: "Volume of a prism", tex: "V=\\text{base area}\\times h", note: "Cross-section area times length." },
    "vol-pyramid": { name: "Volume of a pyramid", tex: "V=\\tfrac{1}{3}\\times\\text{base area}\\times h", note: "One third of the prism on the same base." },
    "sa-cylinder": { name: "Surface area of a cylinder", tex: "A=2\\pi r^2+2\\pi r h", note: "Two circular ends plus the curved side 2\\pi r h." },
    "csa-cone": { name: "Curved surface area of a cone", tex: "A=\\pi r l", note: "l is the slant height, l=\\sqrt{r^2+h^2}." },
    "sa-cone": { name: "Total surface area of a cone", tex: "A=\\pi r^2+\\pi r l", note: "Base circle plus curved surface." },
    "sa-sphere": { name: "Surface area of a sphere", tex: "A=4\\pi r^2", note: "Four times the area of a great circle." },
    "pythagoras": { name: "Slant height (Pythagoras)", tex: "l=\\sqrt{r^2+h^2}", note: "The slant l is the hypotenuse of the right triangle (r, h)." },
    "similar-area": { name: "Areas of similar solids", tex: "\\dfrac{A_2}{A_1}=k^2", note: "k is the length scale factor." },
    "similar-vol": { name: "Volumes of similar solids", tex: "\\dfrac{V_2}{V_1}=k^3", note: "Volume scales as the cube of the length ratio." },
    "displacement": { name: "Water displacement", tex: "V_{\\text{solid}}=A_{\\text{base}}\\times \\Delta h", note: "A submerged solid raises the water by its own volume." },
  };

  /* ════════════════ QUESTION-BANK BUILDERS ════════════════ */
  function mt(tex) { return '<span class="m" data-tex="' + tex + '"></span>'; }
  // Join plain prose + raw LaTeX fragments into one KaTeX line (matches pinned-question typography).
  function mx() {
    var tex = "";
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (typeof a !== "string") continue;
      if (a === "\\\\" || a === "\\break") { tex += "\\\\"; continue; }
      if (a.charAt(0) === "\\") tex += a;
      else tex += "\\text{" + a.replace(/\\/g, "\\textbackslash ").replace(/([#%&_{}])/g, "\\$1") + "}";
    }
    return mt(tex);
  }
  // Stack math lines inside one step card (avoids horizontal scroll).
  function mlines() {
    var html = [];
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      var inner = (typeof a === "string" && a.indexOf('class="m"') !== -1) ? a : mt(a);
      html.push('<div class="sc-line">' + inner + '</div>');
    }
    return html.join("");
  }
  function fchip(key, label) { return '<button class="method-chip" data-formula="' + key + '"><span data-tex="' + label + '"></span></button>'; }
  function tchip(label) { return '<button class="method-chip tool" data-tool-open="1">' + (label || "interactive tool") + '</button>'; }
  function st(slide, focus, title, body) { return { slide: slide, focus: focus, title: title, body: body }; }
  // A stub question (number + figure + question text, no walkthrough yet).
  function stub(n, opts) {
    opts = opts || {};
    return {
      n: n, solved: false, title: opts.title || "", sub: opts.sub || "",
      question: opts.question || [{ tag: "", txt: opts.q || "" }],
      figure: opts.figure || null, tool: opts.tool || null, formulas: opts.formulas || [],
      noAnim: opts.noAnim || false,
    };
  }

  // ── starter batch (fully-built questions) are appended later via AVW_BANK ──
  // window.AVW_BANK is populated by the data section below; we read it at mount.
  function deckPath(id) { return "../../slides/area_volume/" + id + "/index.html"; }
  function toolURL(tool) {
    if (!tool) return "about:blank";
    const bases = {
      frustum: "../../tools/frustum-solver/index.html",
      water: "../../tools/water-volume/index.html",
      frustum_sq: "../../tools/frustum-square/index.html",
      frustum_rect: "../../tools/frustum-rect/index.html",
    };
    const base = bases[tool.kind] || bases.water;
    const params = Object.assign({ embed: "1" }, tool.params || {});
    const q = "?" + Object.keys(params).map((k) => k + "=" + encodeURIComponent(params[k])).join("&");
    return base + q;
  }

  /* ════════════════ ENGINE ════════════════ */
  let frame, listInner, deckEmpty, scrollEl, titleEl, qexprEl, prevBtn, nextBtn, resetBtn, progLabel, barFill;
  let modal, modalBody, modalClose, animWrap, animLabel, deckLayer, figLayer, subSvg, stageEl, modeBar, modeToolBtn, ctrls;
  let panelEnlarge, peBody, peTitle, peClose, enlargeFrame = null, enlargeKind = null;
  let active = null, activeSrc = null, step = 0, loadedDeck = null, wmode = "walk";
  let SOURCES = [];

  // Whether the unified animation panel should be visible for this question/mode.
  function needsAnimPanel(item, mode) {
    if (!item) return false;
    if (mode === "tool" && item.tool) return true;
    if (item.noAnim) return false;
    if (item.figure) return true;
    if (item.solved && item.deck) return true;
    return !!(item.figure);
  }

  // Figure-first when no deck; both panels when deck + figure (e.g. QB7).
  function hasDeckWalk(item) {
    return !!(item && item.solved && item.deck && !item.noAnim);
  }
  function hasFigWalk(item, mode) {
    return !!(item && item.figure && mode === "walk");
  }
  function animSplit(item, mode) {
    return hasDeckWalk(item) && hasFigWalk(item, mode);
  }
  function figOnlyWalk(item, mode) {
    return hasFigWalk(item, mode) && !hasDeckWalk(item);
  }
  function walkAnimLayout() {
    if (wmode === "tool") return "tool";
    const showDeck = hasDeckWalk(active);
    const showFig = hasFigWalk(active, wmode);
    if (showDeck && showFig) return "split";
    if (showFig) return "fig";
    if (showDeck) return "deck";
    return "none";
  }
  function postSlideInFrame(iframe, i) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      const r = iframe.contentWindow.Reveal;
      if (r && r.isReady && r.isReady()) { r.slide(i); return; }
    } catch (e) {}
    try { iframe.contentWindow.postMessage(JSON.stringify({ method: "slide", args: [i] }), "*"); } catch (e) {}
  }
  function postSlide(i) { postSlideInFrame(frame, i); }
  function currentSlideIndex() { return active && active.steps && active.steps[step] ? active.steps[step].slide : 0; }

  // ── enlarge lightbox — mirrors whatever the animation panel is showing ──
  function syncEnlargePanel() {
    if (!enlargeKind || !panelEnlarge || panelEnlarge.classList.contains("hidden")) return;
    if ((enlargeKind === "deck" || enlargeKind === "split" || enlargeKind === "tool") && enlargeFrame) {
      postSlideInFrame(enlargeFrame, currentSlideIndex());
    }
    if (enlargeKind === "fig" || enlargeKind === "split") {
      const svg = peBody && peBody.querySelector(".pe-sub svg");
      if (svg && subSvg) {
        svg.innerHTML = subSvg.innerHTML;
        const rv = subSvg.getAttribute("data-rv");
        if (rv != null) svg.setAttribute("data-rv", rv);
      }
    }
  }
  function closePanelEnlarge() {
    if (!panelEnlarge) return;
    panelEnlarge.classList.add("hidden");
    if (peBody) peBody.innerHTML = "";
    enlargeFrame = null;
    enlargeKind = null;
  }
  function openPanelEnlarge(kind) {
    if (!panelEnlarge || !peBody || kind !== "anim") return;
    if (!animWrap || animWrap.classList.contains("collapsed")) return;

    const layout = walkAnimLayout();
    if (layout === "none") return;

    if (layout === "tool") {
      const src = (frame && frame.src) || "";
      if (!src || /about:blank$/.test(src)) return;
      if (peTitle) peTitle.textContent = (active.tool.label || "Interactive tool") + " — enlarged";
      peBody.innerHTML = '<div class="pe-deck"><iframe title="Enlarged tool view"></iframe></div>';
      enlargeFrame = peBody.querySelector("iframe");
      enlargeKind = "tool";
      const idx = currentSlideIndex();
      enlargeFrame.onload = () => postSlideInFrame(enlargeFrame, idx);
      enlargeFrame.src = src;
      panelEnlarge.classList.remove("hidden");
      return;
    }

    if (layout === "fig") {
      if (!subSvg) return;
      if (peTitle) peTitle.textContent = (animLabel.textContent || "Diagram") + " — enlarged";
      peBody.innerHTML = '<div class="pe-sub"></div>';
      peBody.querySelector(".pe-sub").appendChild(subSvg.cloneNode(true));
      enlargeFrame = null;
      enlargeKind = "fig";
      panelEnlarge.classList.remove("hidden");
      return;
    }

    const src = (frame && frame.src) || "";
    if (!frame || !src || /about:blank$/.test(src)) return;
    const idx = currentSlideIndex();

    if (layout === "split") {
      if (!subSvg) return;
      if (peTitle) peTitle.textContent = (animLabel.textContent || "Walkthrough + diagram") + " — enlarged";
      peBody.innerHTML =
        '<div class="pe-anim-split">' +
        '<div class="pe-deck"><iframe title="Enlarged walkthrough"></iframe></div>' +
        '<div class="pe-sub"></div></div>';
      enlargeFrame = peBody.querySelector("iframe");
      peBody.querySelector(".pe-sub").appendChild(subSvg.cloneNode(true));
      enlargeKind = "split";
      enlargeFrame.onload = () => postSlideInFrame(enlargeFrame, idx);
      enlargeFrame.src = src;
      panelEnlarge.classList.remove("hidden");
      return;
    }

    if (peTitle) peTitle.textContent = (titleEl.textContent || "Animation") + " — enlarged";
    peBody.innerHTML = '<div class="pe-deck"><iframe title="Enlarged worked solution view"></iframe></div>';
    enlargeFrame = peBody.querySelector("iframe");
    enlargeKind = "deck";
    enlargeFrame.onload = () => postSlideInFrame(enlargeFrame, idx);
    enlargeFrame.src = src;
    panelEnlarge.classList.remove("hidden");
  }
  // How much of the figure to reveal for a given walkthrough step.
  // An explicit focus.reveal wins; otherwise the step index drives a gentle
  // progressive reveal so the diagram unfolds with the Next button.
  function stepReveal(i) {
    if (!active || !active.steps) return 99;
    const s = active.steps[i];
    if (s && s.focus && typeof s.focus.reveal === "number") return s.focus.reveal;
    return i;
  }

  function figureForStep(i) {
    if (!active || !active.figure) return null;
    const over = (active.steps[i] && active.steps[i].focus && active.steps[i].focus.fig) || {};
    return { type: active.figure.type, data: Object.assign({}, active.figure.data || {}, over) };
  }

  function renderFigure(reveal, stepIdx) {
    if (!subSvg) return;
    const fig = figureForStep(stepIdx == null ? step : stepIdx);
    if (!fig) return;
    if (animLabel) animLabel.textContent = active.figLabel || FIG_LABEL[fig.type] || "Diagram";
    subSvg.setAttribute("data-rv", String(reveal == null ? 99 : reveal));
    drawFigure(subSvg, fig, reveal == null ? 99 : reveal);
    syncEnlargePanel();
  }

  function updateAnimPanel() {
    if (!animWrap) return;
    const show = needsAnimPanel(active, wmode);
    animWrap.classList.toggle("collapsed", !show);
    if (stageEl) stageEl.classList.toggle("anim-collapsed", !show);
    if (!show) return;

    if (wmode === "tool") {
      if (stageEl) stageEl.classList.remove("anim-split");
      if (deckLayer) deckLayer.classList.remove("hidden");
      if (figLayer) figLayer.classList.add("hidden");
      if (animLabel) animLabel.textContent = (active.tool && active.tool.label) || "Interactive tool";
      return;
    }

    const split = animSplit(active, wmode);
    const showDeck = hasDeckWalk(active);
    const showFig = hasFigWalk(active, wmode);

    if (stageEl) stageEl.classList.toggle("anim-split", split);

    if (showDeck) {
      if (deckLayer) deckLayer.classList.remove("hidden");
    } else if (deckLayer) {
      deckLayer.classList.add("hidden");
    }

    if (showFig) {
      if (figLayer) figLayer.classList.remove("hidden");
      renderFigure(stepReveal(step), step);
    } else if (figLayer) {
      figLayer.classList.add("hidden");
    }

    if (animLabel) {
      if (split) animLabel.textContent = "Walkthrough + diagram";
      else if (showDeck) animLabel.textContent = "Walkthrough";
      else if (showFig) animLabel.textContent = active.figLabel || FIG_LABEL[active.figure.type] || "Diagram";
    }
  }
  function buildCards() {
    scrollEl.innerHTML = "";
    (active.steps || []).forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "step-card" + (i === step ? " active" : "") + (i > step ? " future" : "");
      card.dataset.step = i;
      card.innerHTML = '<div class="sc-head"><span class="sc-title">' + s.title + '</span></div><div class="sc-body">' + s.body + '</div>';
      card.addEventListener("click", (ev) => { if (!ev.target.closest(".method-chip")) setStep(i); });
      scrollEl.appendChild(card);
    });
    renderTex(scrollEl);
    scrollEl.querySelectorAll(".method-chip").forEach((chip) => {
      chip.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (chip.dataset.toolOpen) setMode("tool");
        else if (chip.dataset.formula) openFormula(chip.dataset.formula);
      });
    });
  }

  function refreshCardVisibility() {
    Array.from(scrollEl.children).forEach((c, idx) => {
      c.classList.toggle("active", idx === step);
      c.classList.toggle("future", idx > step);
    });
  }
  function setStep(i) {
    if (!active || !active.steps) return;
    i = Math.max(0, Math.min(active.steps.length - 1, i));
    step = i;
    refreshCardVisibility();
    const card = scrollEl.children[i];
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (wmode === "walk" && hasDeckWalk(active)) postSlide(active.steps[i].slide);
    updateAnimPanel();
    syncEnlargePanel();
    progLabel.textContent = "Step " + (i + 1) + " / " + active.steps.length;
    barFill.style.width = ((i + 1) / active.steps.length * 100) + "%";
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === active.steps.length - 1;
  }
  function setMode(mode) {
    if (!active || !active.tool) mode = "walk";
    closePanelEnlarge();
    wmode = mode;
    if (modeBar) modeBar.querySelectorAll(".wmode-btn").forEach((b) => b.classList.toggle("active", b.dataset.wmode === mode));
    if (mode === "tool") {
      ctrls.classList.add("hidden");
      deckEmpty.classList.add("hidden");
      loadedDeck = null;
      frame.src = toolURL(active.tool);
      updateAnimPanel();
    } else {
      if (active.solved) {
        ctrls.classList.remove("hidden");
        buildCards();
        if (figOnlyWalk(active, "walk") || active.noAnim) {
          loadedDeck = null;
          frame.src = "about:blank";
          deckEmpty.classList.add("hidden");
          updateAnimPanel();
          setStep(step);
        } else if (hasDeckWalk(active)) {
          if (loadedDeck !== active.deck) {
            loadedDeck = active.deck;
            frame.onload = () => { setStep(0); setTimeout(goToWalkSlide, 700); };
            frame.src = active.deck;
          } else {
            setStep(step);
          }
          deckEmpty.classList.add("hidden");
          updateAnimPanel();
        } else {
          loadedDeck = null;
          frame.src = "about:blank";
          deckEmpty.classList.add("hidden");
          updateAnimPanel();
          setStep(step);
        }
      } else {
        frame.src = "about:blank";
        deckEmpty.classList.remove("hidden");
        ctrls.classList.add("hidden");
        updateAnimPanel();
      }
    }
  }  function goToWalkSlide() { if (active && active.steps) postSlide(active.steps[step].slide); }

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
            (item.solved ? '<span class="dot built" title="walkthrough built">\u2713</span>' : '') +
            (item.tool ? '<span class="dot tool" title="interactive tool">\u25c6</span>' : '');
          b.addEventListener("click", () => loadQuestion(item, src, qid));
          body.appendChild(b);
        });
      });
      head.addEventListener("click", () => { head.classList.toggle("collapsed"); body.classList.toggle("hidden"); });
      grp.appendChild(head); grp.appendChild(body); listInner.appendChild(grp);
    });
  }

  function loadQuestion(item, src, qid) {
    closePanelEnlarge();
    active = item; activeSrc = src; step = 0; wmode = "walk";
    titleEl.textContent = src.prefix + item.n + (item.title ? " \u2014 " + item.title : "");
    if (qexprEl) {
      const rows = item.question || [{ tag: "", txt: item.q || "" }];
      qexprEl.innerHTML = rows.map((r) => {
        if (r.tex) {
          const tex = (r.tag ? "\\text{" + r.tag + " }" : "") + r.tex;
          return '<div class="sp-q-row"><span data-tex="' + tex + '"></span></div>';
        }
        const inner = '<span class="sp-q-txt">' + (r.txt || "") + '</span>';
        return '<div class="sp-q-row">' + (r.tag ? '<b>' + r.tag + '</b> ' : '') + inner + '</div>';
      }).join("");
      renderTex(qexprEl);
    }
    listInner.querySelectorAll(".q-row").forEach((b) => b.classList.toggle("active", b.dataset.qid === qid));

    // mode bar visibility
    if (item.tool) { modeBar.classList.remove("hidden"); modeToolBtn.textContent = item.tool.label || "Interactive tool"; }
    else modeBar.classList.add("hidden");
    modeBar.querySelectorAll(".wmode-btn").forEach((b) => b.classList.toggle("active", b.dataset.wmode === "walk"));

    if (item.solved) {
      deckEmpty.classList.add("hidden");
      ctrls.classList.remove("hidden");
      buildCards();
      if (figOnlyWalk(item, "walk") || item.noAnim) {
        loadedDeck = null;
        frame.src = "about:blank";
        updateAnimPanel();
        setStep(0);
      } else if (hasDeckWalk(item)) {
        if (loadedDeck !== item.deck) {
          loadedDeck = item.deck;
          frame.onload = () => { setStep(0); setTimeout(goToWalkSlide, 700); };
          frame.src = item.deck;
        } else {
          setStep(0);
        }
        updateAnimPanel();
      } else {
        updateAnimPanel();
        setStep(0);
      }
    } else {
      loadedDeck = null;
      frame.src = "about:blank";
      deckEmpty.classList.remove("hidden");
      ctrls.classList.add("hidden");
      updateAnimPanel();
      scrollEl.innerHTML = '<div class="no-sol">Step-by-step walkthrough not built yet.<br>The question' +
        (item.figure ? ' and its diagram are' : ' is') + ' shown' + (item.tool ? ', and you can open the interactive tool above.' : ' for now.') + '</div>';
      progLabel.textContent = "\u2014"; barFill.style.width = "0%";
      prevBtn.disabled = true; nextBtn.disabled = true;
    }  }

  function openFormula(key) {
    const f = FORMULAS[key];
    if (!f) return;
    modalBody.innerHTML = '<p class="mm-tag">Formula used here</p><h3>' + f.name + '</h3>' +
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
      qexprEl = document.getElementById("w-qexpr");
      prevBtn = document.getElementById("w-prev");
      nextBtn = document.getElementById("w-next");
      resetBtn = document.getElementById("w-reset");
      progLabel = document.getElementById("w-progress-label");
      barFill = document.getElementById("w-bar-fill");
      modal = document.getElementById("method-modal");
      modalBody = document.getElementById("mm-body");
      modalClose = document.getElementById("mm-close");
      animWrap = document.getElementById("worked-anim");
      stageEl = document.getElementById("worked-stage");
      animLabel = document.getElementById("anim-label");
      deckLayer = document.getElementById("anim-deck-layer");
      figLayer = document.getElementById("anim-fig-layer");
      subSvg = document.getElementById("sub-svg");
      modeBar = document.getElementById("wmode-bar");
      modeToolBtn = document.getElementById("wmode-tool-btn");
      ctrls = document.getElementById("worked-controls");
      panelEnlarge = document.getElementById("panel-enlarge");
      peBody = document.getElementById("pe-body");
      peTitle = document.getElementById("pe-title");
      peClose = document.getElementById("pe-close");
      if (!frame) return;
      this.mounted = true;
      SOURCES = (window.AVW_BANK && window.AVW_BANK()) || [];
      buildSources();
      prevBtn.addEventListener("click", () => setStep(step - 1));
      nextBtn.addEventListener("click", () => setStep(step + 1));
      resetBtn.addEventListener("click", () => setStep(0));
      modalClose.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      modeBar.querySelectorAll(".wmode-btn").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.wmode)));
      document.querySelectorAll(".panel-enlarge-btn").forEach((btn) => {
        btn.addEventListener("click", (ev) => { ev.stopPropagation(); openPanelEnlarge(btn.dataset.enlarge); });
      });
      if (peClose) peClose.addEventListener("click", closePanelEnlarge);
      if (panelEnlarge) panelEnlarge.addEventListener("click", (e) => { if (e.target === panelEnlarge) closePanelEnlarge(); });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (panelEnlarge && !panelEnlarge.classList.contains("hidden")) { closePanelEnlarge(); return; }
        if (!modal.classList.contains("hidden")) closeModal();
      });
    },
    show() {
      this.mount();
      if (!active) {
        // open the first built question, else the first question available
        let first = null, firstSrc = null;
        for (const src of SOURCES) for (const g of src.groups) for (const it of g.items) {
          if (!first) { first = it; firstSrc = src; }
          if (it.solved && !(first && first.solved)) { first = it; firstSrc = src; }
        }
        if (first) loadQuestion(first, firstSrc, firstSrc.id + ":0:" + first.n);
      }
    },
  };

  // expose builders so the data file/section can construct records consistently
  window.AVWorkedKit = { mt, mx, mlines, fchip, tchip, st, stub, deckPath };
  window.AVFigure = {
    draw: function (svg, type, data, reveal) {
      drawFigure(svg, { type: type, data: data || {} }, reveal == null ? 99 : reveal);
    },
    renderTex: renderTex,
  };
  window.AVWorked = Worked;
})();
