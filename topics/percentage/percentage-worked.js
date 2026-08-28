/* Worked Solutions tab (Percentages) — Manim walkthrough + sub-animation panel.
 * Question bank: percentage-worked-data.js (window.PCTW_BANK).
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const COL = {
    old: "#4FC3F7", new: "#FFD54F", factor: "#CE93D8", grow: "#66BB6A", drop: "#F06292",
    ink: "#cdd6e4", dim: "#94a3b8", line: "#28365c", panel: "#0f172a", fav: "#FFD54F",
  };
  function col(c) { return COL[c] || c || COL.ink; }

  function E(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function kx(el, tex) { try { katex.render(tex, el, { throwOnError: false }); } catch (e) { el.textContent = tex; } }
  function renderTex(root) { root.querySelectorAll("[data-tex]").forEach((el) => kx(el, el.getAttribute("data-tex"))); }
  function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function ln(p, x1, y1, x2, y2, c, w) {
    p.appendChild(E("line", { x1, y1, x2, y2, stroke: c, "stroke-width": w || 2, "stroke-linecap": "round" }));
  }
  function rect(p, x, y, w, h, fill, stroke, sw, rx) {
    p.appendChild(E("rect", { x, y, width: w, height: h, rx: rx == null ? 8 : rx,
      fill: fill || "none", stroke: stroke || "none", "stroke-width": sw == null ? 1 : sw }));
  }
  function txt(p, cx, cy, s, c, size, anchor) {
    const t = E("text", { x: cx, y: cy, fill: c || COL.dim, "font-size": size || 14,
      "text-anchor": anchor || "middle", "font-family": "Hanken Grotesk, sans-serif", "font-weight": 600 });
    t.textContent = s; p.appendChild(t);
  }
  function lab(p, cx, cy, tex, c, size, w, h) {
    w = w || 90; h = h || 32;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;justify-content:center;" +
      "color:" + (c || COL.ink) + ";font-size:" + (size || 15) + "px;line-height:1.1;";
    kx(div, tex); fo.appendChild(div); p.appendChild(fo);
  }
  function setVB(svg, w, h) { svg.setAttribute("viewBox", "0 0 " + w + " " + h); }

  /* ── change-factor chain (horizontal) ── */
  function figChain(svg, d, rv) {
    const stages = d.stages || [];
    const n = stages.length;
    const W = Math.max(680, 80 + n * 150);
    setVB(svg, W, 280);
    const y = 120;
    let x = 50;
    if (d.original && rv >= 1) {
      rect(svg, x, y - 28, 88, 56, "rgba(79,195,247,.14)", COL.old, 2, 10);
      lab(svg, x + 44, y, d.original, COL.old, 16, 80, 40);
      txt(svg, x + 44, y + 42, "original", COL.dim, 11);
      x += 110;
    }
    stages.forEach((st, i) => {
      if (rv < i + (d.original ? 2 : 1)) return;
      ln(svg, x - 12, y, x + 8, y, COL.dim, 1.6);
      const cc = col(st.color || "factor");
      rect(svg, x + 8, y - 28, 118, 56, cc + "22", cc, 2, 10);
      lab(svg, x + 67, y - 6, st.pct || "", cc, 14, 100, 26);
      lab(svg, x + 67, y + 14, st.factor || "", COL.factor, 13, 108, 26);
      if (st.value) lab(svg, x + 67, y + 48, st.value, COL.new, 13, 80, 24);
      x += 138;
    });
    if (d.result && rv >= n + (d.original ? 2 : 1)) {
      ln(svg, x - 12, y, x + 8, y, COL.dim, 1.6);
      rect(svg, x + 8, y - 28, 96, 56, "rgba(255,213,79,.16)", COL.new, 2.2, 10);
      lab(svg, x + 56, y, d.result, COL.new, 17, 88, 40);
      txt(svg, x + 56, y + 42, "answer", COL.dim, 11);
    }
    if (d.cap) lab(svg, W / 2, 230, d.cap, COL.ink, 16, W - 40, 36);
  }

  /* ── tree (reuse probability layout) ── */
  function figTree(svg, d, rv) {
    const root = d.root || { children: [] };
    let depth = 0;
    (function dep(n, dd) { n._d = dd; depth = Math.max(depth, dd); (n.children || []).forEach((c) => dep(c, dd + 1)); })(root, 0);
    let slot = 0;
    const LEAFH = 48, TOP = 44, LEFT = 36, LEVELW = 148;
    (function assignY(n) {
      if (!n.children || !n.children.length) { n._y = TOP + slot * LEAFH + LEAFH / 2; slot++; return n._y; }
      let s = 0; n.children.forEach((c) => { s += assignY(c); }); n._y = s / n.children.length; return n._y;
    })(root);
    (function assignX(n) { n._x = LEFT + n._d * LEVELW; (n.children || []).forEach(assignX); })(root);
    const W = Math.max(680, LEFT + depth * LEVELW + 160);
    const H = Math.max(220, TOP + slot * LEAFH + 20);
    setVB(svg, W, H);
    if (d.stages) d.stages.forEach((s, i) => txt(svg, LEFT + (i + 1) * LEVELW, 24, s, COL.dim, 12));
    const show = rv >= (d.favReveal || 99);
    (function draw(n, p) {
      if (p) {
        const cc = col(n.c);
        ln(svg, p._x, p._y, n._x, n._y, cc, 1.8);
        svg.lastChild.setAttribute("opacity", "0.55");
        if (n.p) {
          const mx = (p._x + n._x) / 2, my = (p._y + n._y) / 2;
          rect(svg, mx - 22, my - 12, 44, 24, COL.panel, cc, 1, 7);
          lab(svg, mx, my, n.p, cc, 11, 40, 22);
        }
      }
      if (n.t) {
        const cc = col(n.c);
        const leaf = !n.children || !n.children.length;
        const fav = leaf && n.fav && show;
        svg.appendChild(E("circle", { cx: n._x, cy: n._y, r: 11, fill: cc, stroke: fav ? COL.fav : "#0b1324", "stroke-width": fav ? 3 : 1.2 }));
        if (n.t.length < 8) txt(svg, n._x, n._y + 5, n.t.replace(/\\%/g, "%"), "#06121f", 12);
        else lab(svg, n._x, n._y + 5, n.t, "#06121f", 11, 60, 22);
        if (leaf && n.out) lab(svg, n._x + 52, n._y, n.out, fav ? COL.fav : COL.ink, 14, 90, 26);
      }
      (n.children || []).forEach((c) => draw(c, n));
    })(root, null);
  }

  /* ── tabulation ── */
  function figTable(svg, d, rv) {
    const rowH = d.rowH || [], colH = d.colH || [];
    const nr = rowH.length, nc = colH.length;
    const cw = Math.min(92, 560 / Math.max(nc, 1)), ch = 46;
    const lead = 72, top = 52;
    const W = Math.max(680, lead + nc * cw + 80);
    const H = top + nr * ch + (d.cap ? 64 : 24);
    setVB(svg, W, H);
    const x0 = (W - (lead + nc * cw)) / 2 + lead, y0 = top;
    const favset = {};
    (d.fav || []).forEach((p) => { favset[p[0] + "," + p[1]] = 1; });
    colH.forEach((h, c) => lab(svg, x0 + c * cw + cw / 2, y0 - 10, h, COL.old, 17, cw - 6, 28));
    for (let r = 0; r < nr; r++) {
      lab(svg, x0 - lead / 2 + 4, y0 + 6 + r * ch + ch / 2, rowH[r], COL.grow, 16, lead - 8, 28);
      for (let c = 0; c < nc; c++) {
        const on = favset[r + "," + c] && rv >= (d.favReveal || 2);
        const x = x0 + c * cw, y = y0 + 6 + r * ch;
        rect(svg, x + 2, y + 2, cw - 4, ch - 4, on ? "rgba(255,213,79,.18)" : "rgba(27,41,69,.5)",
          on ? COL.fav : COL.line, on ? 2.2 : 1, 8);
        const cell = (d.cells && d.cells[r] && d.cells[r][c] != null) ? d.cells[r][c] : "";
        lab(svg, x + cw / 2, y + ch / 2, cell, on ? COL.fav : COL.ink, 16, cw - 8, ch - 8);
      }
    }
    if (d.cap) lab(svg, W / 2, y0 + 6 + nr * ch + 28, d.cap, COL.new, 17, W - 40, 36);
  }

  /* ── simple / compound interest schematic ── */
  function figInterest(svg, d, rv) {
    setVB(svg, 680, 280);
    const kind = d.kind || "simple";
    const x0 = 60, y0 = 220, bw = 72, gap = 18;
    if (kind === "simple") {
      const years = Math.max(1, Math.round(+d.T || 1));
      const n = years + 1;
      const P = +d.P || 0, I = +d.I || 0;
      ln(svg, x0 - 8, y0, x0 + n * (bw + gap), y0, COL.dim, 1.6);
      for (let i = 0; i < n; i++) {
        const x = x0 + i * (bw + gap);
        const hP = 50 + P * 0.012;
        const hI = rv >= 2 ? 18 + (I / years) * 0.012 : 0;
        rect(svg, x, y0 - hP, bw, hP, "rgba(255,213,79,.55)", COL.new, 1.5, 4);
        if (hI > 0) rect(svg, x, y0 - hP - hI - 4, bw, hI, "rgba(102,187,106,.65)", COL.grow, 1.5, 4);
        txt(svg, x + bw / 2, y0 + 18, i === 0 ? "Start" : "Yr " + i, COL.dim, 12);
        if (rv >= 3 && i === n - 1) lab(svg, x + bw / 2, y0 - hP - hI - 20, "A=" + d.A, COL.new, 14, bw + 20, 24);
      }
      lab(svg, 480, 90, "I = P \\times R \\times T", COL.ink, 18, 320, 40);
      if (rv >= 2) lab(svg, 480, 130, "=" + d.P + "\\times" + d.R + "\\times" + d.T, COL.grow, 16, 320, 36);
    } else {
      lab(svg, 340, 100, "A = P\\left(1+\\tfrac{R}{m}\\right)^{mt}", COL.ink, 18, 520, 44);
      if (rv >= 2) lab(svg, 340, 150, "P=" + d.P + ",\\ R=" + d.R + ",\\ m=" + d.m + ",\\ t=" + d.t, COL.old, 15, 520, 36);
      if (rv >= 3) lab(svg, 340, 200, "A=" + d.A + ",\\ \\text{CI}=" + d.CI, COL.new, 16, 420, 36);
    }
  }

  /* ── bar chart (growth/decay) ── */
  function figBars(svg, d, rv) {
    setVB(svg, 680, 280);
    const bars = d.bars || [], n = bars.length;
    const x0 = 70, y0 = 230, bw = Math.min(78, 520 / Math.max(n, 1)), gap = 16;
    const maxV = Math.max.apply(null, bars.map((b) => b.v).concat([1]));
    ln(svg, x0 - 6, y0, x0 + n * (bw + gap), y0, COL.dim, 1.6);
    bars.forEach((b, i) => {
      if (rv < i + 1) return;
      const h = (b.v / maxV) * 170, x = x0 + i * (bw + gap), y = y0 - h;
      const on = !!b.fav && rv >= (d.favReveal || 99);
      rect(svg, x, y, bw, h, on ? "rgba(255,213,79,.7)" : "rgba(79,195,247,.45)", on ? COL.new : COL.old, 1.5, 4);
      txt(svg, x + bw / 2, y0 + 18, b.label, COL.ink, 12);
      txt(svg, x + bw / 2, y - 8, "" + b.v, on ? COL.new : COL.ink, 13);
    });
    if (d.cap) lab(svg, 340, 260, d.cap, COL.factor, 16, 600, 32);
  }

  const FIG = { chain: figChain, tree: figTree, table: figTable, interest: figInterest, bars: figBars };
  const FIG_LABEL = {
    chain: "Change factors", tree: "Tree diagram", table: "Tabulation",
    interest: "Interest", bars: "Growth / decay",
  };

  function drawFigure(svg, fig, reveal) {
    clearSvg(svg);
    if (!fig) return false;
    const fn = FIG[fig.type];
    if (!fn) return false;
    fn(svg, fig.data || {}, reveal == null ? 99 : reveal);
    return true;
  }

  const CONCEPTS = {
    "change-factor": { name: "Change factor", tex: "\\text{new} = \\text{old}\\times(1 \\pm r\\%)", note: "Multiply successive factors for repeated change." },
    "reverse-pct": { name: "Reverse percentage", tex: "\\text{original} = \\dfrac{\\text{final}}{\\text{product of factors}}", note: "Undo the percentage steps." },
    growth: { name: "Geometric change", tex: "V = P(1 \\pm r)^{n}", note: "Same rate each period — compound growth or decay." },
    "simple-interest": { name: "Simple interest", tex: "I = P \\times R \\times T", note: "Only the principal earns each year." },
    "compound-interest": { name: "Compound interest", tex: "A = P\\left(1+\\tfrac{R}{m}\\right)^{mt}", note: "Interest is added to the principal each period." },
    "tax-bands": { name: "Salaries tax bands", tex: "\\text{Tax} = \\sum (\\text{band amount} \\times \\text{rate})", note: "Work band by band on net chargeable income." },
  };

  let frame, listInner, deckEmpty, scrollEl, titleEl, subEl, qexprEl, prevBtn, nextBtn, resetBtn, progLabel, barFill;
  let modal, modalBody, modalClose, subWrap, subSvg, subLabel, controlsEl;
  let active = null, step = 0, loadedDeck = null, SOURCES = [];

  function postSlide(i) {
    let r = null;
    try { r = frame.contentWindow.Reveal; } catch (e) { r = null; }
    if (r && r.isReady && r.isReady()) { try { r.slide(i); return; } catch (e) {} }
    try { frame.contentWindow.postMessage(JSON.stringify({ method: "slide", args: [i] }), "*"); } catch (e) {}
  }

  function stepFocus(i) {
    if (!active || !active.steps) return null;
    const s = active.steps[i];
    return (s && s.focus) ? s.focus : (active.figure ? { type: active.figure.type, reveal: 99, data: active.figure.data } : null);
  }

  function renderFigure(reveal) {
    if (!subWrap) return;
    const fig = stepFocus(step) || active.figure;
    if (!fig) { subWrap.classList.add("hidden"); return; }
    subWrap.classList.remove("hidden");
    if (subLabel) subLabel.textContent = active.figLabel || FIG_LABEL[fig.type] || "Diagram";
    const rv = (fig && typeof fig.reveal === "number") ? fig.reveal : reveal;
    drawFigure(subSvg, fig, rv == null ? 99 : rv);
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
    renderFigure();
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
          b.title = item.n;
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
      const rows = item.question || [{ tag: "", tex: item.short || "" }];
      qexprEl.innerHTML = rows.map((r) =>
        '<div class="sp-q-row">' + (r.tag ? '<b>' + r.tag + '</b> ' : '') +
        (r.tex ? '<span data-tex="' + r.tex + '"></span>' : '<span class="sp-q-txt">' + (r.txt || "") + '</span>') + '</div>'
      ).join("");
      renderTex(qexprEl);
    }
    listInner.querySelectorAll(".q-row").forEach((b) => b.classList.toggle("active", b.dataset.qid === qid));

    if (item.solved) {
      deckEmpty.classList.add("hidden");
      frame.classList.remove("hidden");
      if (controlsEl) controlsEl.classList.remove("hidden");
      buildCards();
      renderFigure();
      if (loadedDeck !== item.deck) {
        loadedDeck = item.deck;
        frame.onload = () => { setStep(0); setTimeout(() => postSlide(active.steps[step].slide), 700); };
        frame.src = item.deck;
      } else { setStep(0); }
    } else {
      loadedDeck = null;
      frame.src = "about:blank";
      frame.classList.add("hidden");
      deckEmpty.classList.remove("hidden");
      if (controlsEl) controlsEl.classList.add("hidden");
      if (subWrap) subWrap.classList.add("hidden");
      scrollEl.innerHTML = '<div class="no-sol">Step-by-step walkthrough not built yet.</div>';
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
      controlsEl = document.getElementById("worked-controls");
      if (!frame) return;
      this.mounted = true;
      SOURCES = (window.PCTW_BANK && window.PCTW_BANK()) || [];
      buildSources();
      prevBtn.addEventListener("click", () => setStep(step - 1));
      nextBtn.addEventListener("click", () => setStep(step + 1));
      resetBtn.addEventListener("click", () => setStep(0));
      modalClose.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      document.querySelectorAll(".panel-enlarge-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const kind = btn.dataset.enlarge;
          const pe = document.getElementById("panel-enlarge");
          const peBody = document.getElementById("pe-body");
          const peTitle = document.getElementById("pe-title");
          if (!pe || !peBody) return;
          if (kind === "deck" && frame && !frame.classList.contains("hidden")) {
            peTitle.textContent = "Main animation";
            peBody.innerHTML = '<div class="pe-deck"><iframe title="Enlarged slides"></iframe></div>';
            const f = peBody.querySelector("iframe");
            f.onload = () => postSlideIn(f, active && active.steps ? active.steps[step].slide : 0);
            f.src = frame.src;
          } else if (kind === "sub" && subWrap && !subWrap.classList.contains("hidden")) {
            peTitle.textContent = (subLabel.textContent || "Diagram") + " — enlarged";
            peBody.innerHTML = '<div class="pe-sub"></div>';
            peBody.querySelector(".pe-sub").appendChild(subSvg.cloneNode(true));
          } else return;
          pe.classList.remove("hidden");
        });
      });
      const peClose = document.getElementById("pe-close");
      if (peClose) peClose.addEventListener("click", () => document.getElementById("panel-enlarge").classList.add("hidden"));
      window.addEventListener("keydown", (e) => { if (!modal.classList.contains("hidden") && e.key === "Escape") closeModal(); });
    },
    show() {
      this.mount();
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

  function postSlideIn(f, i) {
    let r = null;
    try { r = f.contentWindow.Reveal; } catch (e) { r = null; }
    if (r && r.isReady && r.isReady()) { try { r.slide(i); } catch (e) {} }
  }

  window.PctWorked = Worked;
  window.PCTFigure = {
    draw: function (svg, spec, methods, reveal) {
      if (!spec || !spec.type) return;
      drawFigure(svg, { type: spec.type, data: spec.data || {} }, reveal == null ? 99 : reveal);
    },
    renderTex: renderTex,
  };
})();
