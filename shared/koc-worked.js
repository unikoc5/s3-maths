/* KOC reference step driver — Figure panel + Solution panel (diagram sync per step) */
(function () {
  "use strict";

  function bindSolScale(solPanel) {
    if (!solPanel || !window.ResizeObserver) return;
    var ro = new ResizeObserver(function (entries) {
      var w = entries[0].contentRect.width;
      if (w < 1) return;
      var body = Math.round(Math.max(14, Math.min(18, 11 + w * 0.022)));
      solPanel.style.setProperty("--koc-sol-body", body + "px");
      solPanel.style.setProperty("--koc-sol-ui", (body - 1) + "px");
      solPanel.style.setProperty("--koc-sol-math", "1.08em");
    });
    ro.observe(solPanel);
  }

  function bindSplitter(splitRow) {
    var bar = splitRow.querySelector(".koc-splitter");
    var sol = splitRow.querySelector(".koc-solution-panel");
    var viz = splitRow.querySelector(".koc-viz-column");
    if (!bar || !sol) return;
    bindSolScale(sol);
    var dragging = false;
    function setWidth(pct) {
      pct = Math.max(24, Math.min(58, pct));
      splitRow.style.setProperty("--koc-sol-width", pct + "%");
    }
    function onMove(clientX) {
      var rect = splitRow.getBoundingClientRect();
      var w = rect.width - (clientX - rect.left);
      setWidth((w / rect.width) * 100);
    }
    function notifyResize() {
      splitRow.dispatchEvent(new CustomEvent("koc-resize", { bubbles: false }));
    }
    bar.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      bar.classList.add("koc-splitter-active");
      document.body.classList.add("koc-splitter-dragging");
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      onMove(e.clientX);
    });
    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove("koc-splitter-active");
      document.body.classList.remove("koc-splitter-dragging");
      notifyResize();
    });
    bar.addEventListener("keydown", function (e) {
      var cur = parseFloat(splitRow.style.getPropertyValue("--koc-sol-width")) || 36;
      if (e.key === "ArrowLeft") { setWidth(cur + 2); e.preventDefault(); notifyResize(); }
      if (e.key === "ArrowRight") { setWidth(cur - 2); e.preventDefault(); notifyResize(); }
    });
    if (viz && window.ResizeObserver) {
      new ResizeObserver(notifyResize).observe(viz);
    }
  }

  function KocView(root, config, figureApi) {
    this.root = root;
    this.config = config;
    this.figureApi = figureApi;
    this.step = 0;
    this.diagramPanel = root.querySelector(".koc-diagram-panel");
    this.diagramSvg = root.querySelector(".koc-diagram-svg");
    this.cards = Array.from(root.querySelectorAll(".koc-step-card"));
    this.progressLabel = root.querySelector(".koc-sol-progress-label");
    this.progressFill = root.querySelector(".koc-sol-bar-fill");
    this.prevBtn = root.querySelector(".koc-prev");
    this.nextBtn = root.querySelector(".koc-next");
    this.resetBtn = root.querySelector(".koc-reset");
    this._bind();
  }

  KocView.prototype._bind = function () {
    var self = this;
    this.cards.forEach(function (card) {
      card.addEventListener("click", function () {
        self.setStep(parseInt(card.dataset.step, 10));
      });
    });
    this.prevBtn.addEventListener("click", function () { self.setStep(self.step - 1); });
    this.nextBtn.addEventListener("click", function () { self.setStep(self.step + 1); });
    this.resetBtn.addEventListener("click", function () { self.setStep(0); });
    var splitRow = this.root.querySelector(".koc-split-row");
    if (splitRow) {
      splitRow.addEventListener("koc-resize", function () { self._drawFig(self.step); });
    }
  };

  KocView.prototype._figData = function (i) {
    var base = (this.config.figure && this.config.figure.data) || {};
    var over = (this.config.steps[i] && this.config.steps[i].fig) || {};
    return Object.assign({}, base, over);
  };

  KocView.prototype._drawFig = function (i) {
    var api = this.figureApi;
    if (!api || !api.draw || !this.diagramSvg) return;
    var st = this.config.steps[i];
    var spec = st.focus;
    if (spec && spec.type) {
      var data = Object.assign({}, spec.data || {}, st.fig || {});
      api.draw(
        this.diagramSvg,
        { type: spec.type, data: data },
        this.config.methods || {},
        spec.reveal != null ? spec.reveal : (st.reveal != null ? st.reveal : 99)
      );
    } else if (this.config.figure) {
      api.draw(
        this.diagramSvg,
        { type: this.config.figure.type, data: this._figData(i) },
        this.config.methods || {},
        st.reveal != null ? st.reveal : i
      );
    } else {
      if (this.diagramPanel) this.diagramPanel.classList.add("koc-diagram-empty");
      return;
    }
    if (this.diagramPanel) this.diagramPanel.classList.remove("koc-diagram-empty");
  };

  KocView.prototype.setStep = function (i) {
    i = Math.max(0, Math.min(this.config.steps.length - 1, i));
    this.step = i;
    this.cards.forEach(function (c, idx) { c.classList.toggle("active", idx === i); });
    var pct = Math.round(((i + 1) / this.config.steps.length) * 100);
    if (this.progressFill) this.progressFill.style.width = pct + "%";
    if (this.progressLabel) this.progressLabel.textContent = "Step " + (i + 1) + " / " + this.config.steps.length;
    this.prevBtn.disabled = i === 0;
    this.nextBtn.disabled = i === this.config.steps.length - 1;
    var scroll = this.root.querySelector(".koc-solution-scroll");
    var card = this.cards[i];
    if (card && scroll) {
      var cr = card.getBoundingClientRect();
      var sr = scroll.getBoundingClientRect();
      if (cr.top < sr.top || cr.bottom > sr.bottom) {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    this._drawFig(i);
  };

  KocView.prototype.activate = function () {
    this.setStep(this.step);
  };

  function buildView(config) {
    var el = document.createElement("div");
    el.className = "koc-view";
    el.id = "koc-view-" + config.id;
    el.innerHTML =
      '<div class="koc-split-row">' +
        '<div class="koc-viz-column">' +
          '<section class="koc-diagram-panel">' +
            '<span class="koc-badge">Figure</span>' +
            '<div class="koc-diagram-inner">' +
              '<svg class="koc-diagram-svg" viewBox="0 0 680 320" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Question diagram"></svg>' +
            "</div>" +
          "</section>" +
        "</div>" +
        '<div class="koc-splitter" role="separator" aria-orientation="vertical" aria-label="Resize solution panel" tabindex="0"></div>' +
        '<section class="koc-solution-panel">' +
          '<div class="koc-sol-head">' +
            "<h3>" + config.title + "</h3>" +
            (config.subtitle ? "<p>" + config.subtitle + "</p>" : "") +
            '<div class="koc-sol-progress">' +
              '<span class="koc-sol-progress-label">Step 1 / 1</span>' +
              '<div class="koc-sol-bar"><div class="koc-sol-bar-fill"></div></div>' +
            "</div>" +
          "</div>" +
          '<div class="koc-problem">' +
            '<p class="koc-problem-label">Problem statement</p>' +
            '<div class="koc-problem-body">' + config.problemHtml + "</div>" +
          "</div>" +
          '<div class="koc-solution-scroll">' +
            config.steps.map(function (s, idx) {
              return (
                '<div class="koc-step-card' + (idx === 0 ? " active" : "") + '" data-step="' + idx + '" data-reveal="' +
                (s.reveal != null ? s.reveal : idx) + '">' +
                '<div class="koc-step-head"><span class="koc-step-idx">' + (idx + 1) + '</span>' +
                '<span class="koc-step-title">' + s.title + "</span></div>" +
                '<div class="koc-step-body">' + s.body + "</div></div>"
              );
            }).join("") +
          "</div>" +
          '<div class="koc-sol-foot">' +
            '<button type="button" class="wbtn koc-prev">&larr; Prev</button>' +
            '<button type="button" class="wbtn primary koc-next">Next &rarr;</button>' +
            '<button type="button" class="wbtn koc-reset">Reset</button>' +
          "</div>" +
        "</section>" +
      "</div>";
    return el;
  }

  window.KocWorked = {
    views: {},
    activeId: null,
    mount: function (container, questions, options) {
      if (!container) return;
      options = options || {};
      var figureApi = options.figureApi || null;
      this._mountEl = container;
      container.innerHTML = "";
      if (!questions || !questions.length) {
        container.innerHTML =
          '<div class="koc-empty"><div><strong>Worked solutions</strong>No questions added yet. ' +
          "Select a question tab will appear here when items are configured.</div></div>";
        return;
      }
      var tabs = document.createElement("div");
      tabs.className = "koc-q-tabs";
      questions.forEach(function (q, qi) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip" + (qi === 0 ? " active" : "");
        btn.dataset.q = q.id;
        btn.textContent = q.label;
        btn.addEventListener("click", function () {
          window.KocWorked.show(q.id);
        });
        tabs.appendChild(btn);
      });
      container.appendChild(tabs);
      var wrap = document.createElement("div");
      wrap.className = "koc-worked-root";
      questions.forEach(function (q) {
        var viewEl = buildView(q);
        wrap.appendChild(viewEl);
        window.KocWorked.views[q.id] = new KocView(viewEl, q, figureApi);
      });
      container.appendChild(wrap);
      wrap.querySelectorAll(".koc-split-row").forEach(bindSplitter);
      var renderTex = (figureApi && figureApi.renderTex) || (window.AVFigure && window.AVFigure.renderTex);
      if (renderTex) renderTex(container);
      window.KocWorked.show(questions[0].id);
    },
    show: function (id) {
      var root = this._mountEl || document.getElementById("koc-worked-mount");
      if (!root) return;
      root.querySelectorAll(".koc-q-tabs .chip").forEach(function (b) {
        b.classList.toggle("active", b.dataset.q === id);
      });
      root.querySelectorAll(".koc-view").forEach(function (v) {
        v.classList.toggle("active", v.id === "koc-view-" + id);
      });
      if (this.activeId !== id) {
        this.activeId = id;
        if (this.views[id]) this.views[id].activate();
      }
    },
  };
})();
