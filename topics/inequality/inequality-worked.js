/* Worked Solutions tab (Inequality) — Manim deck + number-line sub-panel. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const COL = {
    gt: "#66BB6A", ge: "#AB47BC", lt: "#FFD54F", le: "#4FC3F7",
    ink: "#cdd6e4", dim: "#94a3b8", line: "#28365c", axis: "#6679a0", bg: "#0f172a",
    ok: "#66BB6A", bad: "#EF5350",
  };

  function E(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function kx(el, tex) { try { katex.render(tex, el, { throwOnError: false }); } catch (e) { el.textContent = tex; } }
  function renderTex(root) { root.querySelectorAll("[data-tex]").forEach((el) => kx(el, el.getAttribute("data-tex"))); }
  function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function ln(p, x1, y1, x2, y2, c, w) {
    p.appendChild(E("line", { x1, y1, x2, y2, stroke: c, "stroke-width": w || 2.5, "stroke-linecap": "round" }));
  }
  function lab(p, cx, cy, tex, c, size, w, h) {
    w = w || 80; h = h || 32;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;justify-content:center;color:" +
      (c || COL.ink) + ";font-size:" + (size || 16) + "px;";
    kx(div, tex); fo.appendChild(div); p.appendChild(fo);
  }

  function signCol(dir) {
    if (dir === "gt") return COL.gt;
    if (dir === "ge") return COL.ge;
    if (dir === "lt") return COL.lt;
    return COL.le;
  }

  function figNumberline(svg, d, rv) {
    svg.setAttribute("viewBox", "0 0 680 280");
    const b = +d.bound, dir = d.direction || "gt", closed = !!d.closed;
    const acc = signCol(dir);
    const right = dir === "gt" || dir === "ge";
    const span = Math.max(6, Math.ceil(Math.abs(b)) + 4);
    const lo = b - span, hi = b + span;
    const W = 560, x0 = 60, yA = 170, yD = 95;
    const X = (v) => x0 + (v - lo) / (hi - lo) * W;
    if (rv >= 1) ln(svg, x0, yA, x0 + W, yA, COL.axis, 2.5);
    const cx = X(b);
    if (rv >= 1) ln(svg, cx, yA - 10, cx, yA + 10, COL.dim, 2);
    if (rv >= 2) ln(svg, cx, yA, cx, yD + 12, acc, 2.5);
    const x1 = right ? x0 + W : x0, x2 = right ? cx + 10 : cx - 10;
    if (rv >= 4) {
      ln(svg, x2, yD, x1 + (right ? -8 : 8), yD, acc, 6);
      const ax = right ? x0 + W - 4 : x0 + 4;
      svg.appendChild(E("polygon", {
        points: right ? (ax + "," + yD + " " + (ax - 12) + "," + (yD - 7) + " " + (ax - 12) + "," + (yD + 7))
          : (ax + "," + yD + " " + (ax + 12) + "," + (yD - 7) + " " + (ax + 12) + "," + (yD + 7)),
        fill: acc,
      }));
    }
    if (rv >= 3) {
      if (closed) svg.appendChild(E("circle", { cx, cy: yD, r: 10, fill: acc }));
      else svg.appendChild(E("circle", { cx, cy: yD, r: 10, fill: COL.bg, stroke: acc, "stroke-width": 3.5 }));
    }
    if (rv >= 5 && d.answer) lab(svg, 340, 42, d.answer, acc, 22, 420, 40);
    lab(svg, cx, yA + 28, d.bound_latex || String(b), COL.dim, 15, 50, 24);
  }

  function figIntlist(svg, d, rv) {
    svg.setAttribute("viewBox", "0 0 680 220");
    const vals = d.values || [];
    const chips = vals.map((v, i) => {
      const x = 80 + i * 72, y = 90;
      if (rv >= 2) {
        svg.appendChild(E("rect", { x, y, width: 58, height: 44, rx: 10,
          fill: "rgba(102,187,106,.15)", stroke: COL.ok, "stroke-width": 2 }));
      }
      lab(svg, x + 29, y + 22, String(v), COL.ok, 20, 50, 30);
    });
    if (d.cap && rv >= 3) lab(svg, 340, 170, d.cap, COL.le, 18, 500, 36);
    return chips;
  }

  function figCheck(svg, d, rv) {
    svg.setAttribute("viewBox", "0 0 680 240");
    const grp = d.group || [];
    grp.forEach((v, i) => {
      const ok = rv >= 2 && (d.direction === "gt" ? v > d.bound : v < d.bound);
      const x = 120 + i * 130, y = 90;
      svg.appendChild(E("rect", { x, y, width: 90, height: 50, rx: 10,
        fill: ok ? "rgba(102,187,106,.16)" : "rgba(239,83,80,.12)",
        stroke: ok ? COL.ok : COL.bad, "stroke-width": 2 }));
      lab(svg, x + 45, y + 28, String(v), ok ? COL.ok : COL.bad, 20, 70, 34);
      if (rv >= 3) lab(svg, x + 45, y + 68, ok ? "\\checkmark" : "\\times", ok ? COL.ok : COL.bad, 18, 30, 24);
    });
    if (rv >= 1) lab(svg, 340, 30, "7x+3>17 \\Rightarrow x>2", COL.le, 18, 320, 30);
  }

  const DRAW = {
    numberline: figNumberline,
    intlist: figIntlist,
    check: figCheck,
  };

  let SOURCES = [], active = null, step = 0, loadedDeck = null;
  let frame, listInner, deckEmpty, scrollEl, titleEl, subEl, qexprEl;
  let prevBtn, nextBtn, resetBtn, progLabel, barFill, subWrap, subSvg, subLabel;

  function playDeckVideo(iframe) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      const slide = iframe.contentWindow.Reveal.getCurrentSlide();
      if (!slide || !slide.slideBackgroundContentElement) return;
      const vids = slide.slideBackgroundContentElement.getElementsByTagName("video");
      for (let i = 0; i < vids.length; i++) {
        vids[i].currentTime = 0;
        vids[i].muted = true;
        vids[i].play().catch(function () {});
      }
    } catch (e) { /* not ready */ }
  }

  function postSlideInFrame(iframe, i) {
    if (!iframe || !iframe.contentWindow) return;
    let tries = 0;
    function attempt() {
      tries++;
      try {
        const r = iframe.contentWindow.Reveal;
        if (r && r.isReady && r.isReady()) {
          r.slide(i);
          setTimeout(function () { playDeckVideo(iframe); }, 80);
          return;
        }
      } catch (e) { /* cross-origin or loading */ }
      if (tries < 30) setTimeout(attempt, 120);
    }
    attempt();
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ method: "slide", args: [i] }), "*");
    } catch (e) { /* iframe not ready */ }
    setTimeout(function () { playDeckVideo(iframe); }, 400);
  }

  function postSlide(i) { postSlideInFrame(frame, i); }

  function stepReveal(s) {
    const f = active && active.steps && active.steps[s] && active.steps[s].focus;
    return (f && f.reveal) || 0;
  }

  function renderFocus(focus) {
    if (!subSvg) return;
    clearSvg(subSvg);
    if (!focus || !focus.type || !DRAW[focus.type]) {
      subWrap.classList.add("hidden");
      return;
    }
    subWrap.classList.remove("hidden");
    subLabel.textContent = focus.type === "numberline" ? "Number line" :
      focus.type === "intlist" ? "Integer list" : "Check values";
    DRAW[focus.type](subSvg, focus.data || {}, focus.reveal || 5);
  }

  function setStep(s) {
    if (!active || !active.steps) return;
    step = Math.max(0, Math.min(active.steps.length - 1, s));
    scrollEl.querySelectorAll(".step-card").forEach((c, i) => c.classList.toggle("active", i === step));
    progLabel.textContent = "Step " + (step + 1) + " / " + active.steps.length;
    barFill.style.width = ((step + 1) / active.steps.length * 100) + "%";
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === active.steps.length - 1;
    postSlide(active.steps[step].slide);
    renderFocus(active.steps[step].focus);
    renderTex(scrollEl);
  }

  function buildCards() {
    scrollEl.innerHTML = "";
    active.steps.forEach((st, i) => {
      const card = document.createElement("div");
      card.className = "step-card" + (i === step ? " active" : "");
      card.innerHTML = '<div class="sc-head"><span class="sc-idx">' + (i + 1) + '</span><span class="sc-title">' +
        st.title + '</span></div><div class="sc-body">' + st.body + '</div>';
      card.addEventListener("click", () => setStep(i));
      scrollEl.appendChild(card);
    });
    renderTex(scrollEl);
  }

  function buildSources() {
    listInner.innerHTML = "";
    SOURCES.forEach((src) => {
      const grp = document.createElement("div"); grp.className = "src-group";
      const head = document.createElement("button"); head.type = "button";
      head.className = "src-head" + (src.open ? "" : " collapsed");
      head.innerHTML = '<span class="src-name">' + src.name + '</span><span class="src-badge">' + src.prefix +
        '</span><span class="src-caret">\u25be</span>';
      const body = document.createElement("div"); body.className = "src-body" + (src.open ? "" : " hidden");
      src.groups.forEach((g, gi) => {
        if (g.name) { const sh = document.createElement("p"); sh.className = "sub-head"; sh.textContent = g.name; body.appendChild(sh); }
        g.items.forEach((item) => {
          const qid = src.id + ":" + gi + ":" + item.n;
          const b = document.createElement("button"); b.className = "q-row"; b.dataset.qid = qid;
          b.innerHTML = '<span class="qn">' + src.prefix + item.n + '</span>' +
            (item.solved ? '<span class="dot built">\u2713</span>' : '');
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
    qexprEl.innerHTML = (item.question || []).map((r) =>
      '<div class="sp-q-row">' + (r.tag ? "<b>" + r.tag + "</b> " : "") +
      '<span data-tex="' + r.tex + '"></span></div>').join("");
    renderTex(qexprEl);
    listInner.querySelectorAll(".q-row").forEach((b) => b.classList.toggle("active", b.dataset.qid === qid));
    if (item.solved) {
      deckEmpty.classList.add("hidden");
      frame.classList.remove("hidden");
      document.getElementById("worked-controls").classList.remove("hidden");
      buildCards();
      if (loadedDeck !== item.deck) {
        loadedDeck = item.deck;
        frame.onload = function () {
          setStep(0);
          setTimeout(function () { postSlideInFrame(frame, 0); }, 500);
        };
        frame.src = item.deck;
      } else setStep(0);
    } else {
      loadedDeck = null; frame.src = "about:blank"; frame.classList.add("hidden");
      deckEmpty.classList.remove("hidden");
      subWrap.classList.add("hidden");
      document.getElementById("worked-controls").classList.add("hidden");
      scrollEl.innerHTML = '<div class="no-sol">Walkthrough not built yet.</div>';
    }
  }

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
      subWrap = document.getElementById("worked-sub");
      subSvg = document.getElementById("sub-svg");
      subLabel = document.getElementById("sub-label");
      if (!frame) return;
      this.mounted = true;
      SOURCES = (window.IWQ_BANK && window.IWQ_BANK()) || [];
      buildSources();
      prevBtn.addEventListener("click", () => setStep(step - 1));
      nextBtn.addEventListener("click", () => setStep(step + 1));
      resetBtn.addEventListener("click", () => setStep(0));
    },
    show() {
      this.mount();
      if (!active) {
        for (const src of SOURCES) for (const g of src.groups) for (const it of g.items) {
          if (it.solved) { loadQuestion(it, src, src.id + ":0:" + it.n); return; }
        }
      }
    },
  };

  window.IWQKit = { mt: (t) => '<span class="m" data-tex="' + t + '"></span>' };
  window.IWFigure = {
    draw: function (svg, spec, methods, reveal) {
      if (!spec || !spec.type || !DRAW[spec.type]) return;
      clearSvg(svg);
      var rv = reveal != null ? reveal : (spec.reveal != null ? spec.reveal : 5);
      DRAW[spec.type](svg, spec.data || {}, rv);
    },
    renderTex: renderTex,
  };
  window.IneqWorked = Worked;
})();
