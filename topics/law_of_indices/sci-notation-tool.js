window.SciNotationTool = (function () {
  var container = null;
  var activeModuleId = "convert-large";
  var stepIndex = 0;
  var animating = false;

  function lang() {
    return window.I18n && window.I18n.lang === "zh" ? "zh" : "en";
  }

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      return window.I18n.t(key);
    }
    return fallback || key;
  }

  function pick(obj, enKey, zhKey) {
    return lang() === "zh" ? obj[zhKey] : obj[enKey];
  }

  function getModules() {
    return window.SCI_NOTATION_MODULES || [];
  }

  function getModule(id) {
    return getModules().find(function (m) {
      return m.id === id;
    });
  }

  function getActiveModule() {
    return getModule(activeModuleId) || getModules()[0];
  }

  function moduleLabel(mod) {
    return pick(mod, "titleEn", "titleZh");
  }

  function renderModulePills() {
    return getModules()
      .map(function (mod) {
        return (
          '<button type="button" class="sci-module-pill' +
          (mod.id === activeModuleId ? " is-active" : "") +
          '" data-module="' +
          mod.id +
          '">' +
          moduleLabel(mod) +
          "</button>"
        );
      })
      .join("");
  }

  function renderProgress(mod) {
    var total = mod.steps.length;
    var current = stepIndex + 1;
    var pct = Math.round((current / total) * 100);
    return (
      '<div class="sci-progress">' +
      '  <div class="sci-progress-meta">' +
      '    <span>' +
      t("sciTool.step", "Step") +
      " " +
      current +
      " / " +
      total +
      "</span>" +
      '    <span class="sci-ref">' +
      pick(mod, "refEn", "refZh") +
      "</span>" +
      "  </div>" +
      '  <div class="sci-progress-bar"><div class="sci-progress-fill" style="width:' +
      pct +
      '%"></div></div>' +
      "</div>"
    );
  }

  function renderStep(mod, step) {
    return (
      '<div class="sci-step-panel is-visible">' +
      '  <p class="sci-step-kicker">' +
      pick(step, "titleEn", "titleZh") +
      "</p>" +
      '  <p class="sci-step-body">' +
      pick(step, "bodyEn", "bodyZh") +
      "</p>" +
      (step.mathEn
        ? '<pre class="sci-step-math">' + pick(step, "mathEn", "mathZh") + "</pre>"
        : "") +
      "</div>"
    );
  }

  function renderWalkthrough() {
    var mod = getActiveModule();
    if (!mod) return "";
    var step = mod.steps[stepIndex];
    var isFirst = stepIndex === 0;
    var isLast = stepIndex >= mod.steps.length - 1;

    return (
      '<article class="sci-walkthrough">' +
      '  <header class="sci-walkthrough-head">' +
      '    <p class="section-label">' +
      t("sciTool.part", "Scientific Notation") +
      "</p>" +
      "    <h2>" +
      moduleLabel(mod) +
      "</h2>" +
      '    <p class="sci-prompt">' +
      pick(mod, "promptEn", "promptZh") +
      "</p>" +
      "  </header>" +
      renderProgress(mod) +
      '  <div class="sci-step-stage" id="sci-step-stage">' +
      renderStep(mod, step) +
      "</div>" +
      (isLast
        ? '<div class="sci-answer-banner">' +
          "<span>" +
          t("sciTool.answer", "Answer") +
          ":</span> " +
          "<strong>" +
          pick(mod, "answerEn", "answerZh") +
          "</strong></div>"
        : "") +
      '  <div class="sci-nav">' +
      '    <button type="button" class="sci-nav-btn" id="sci-prev"' +
      (isFirst ? " disabled" : "") +
      ">" +
      t("sciTool.prev", "← Previous step") +
      "</button>" +
      '    <button type="button" class="sci-nav-btn is-primary" id="sci-next">' +
      (isLast ? t("sciTool.restart", "Restart") : t("sciTool.next", "Next step →")) +
      "</button>" +
      "  </div>" +
      "</article>"
    );
  }

  function render() {
    if (!container) return;
    container.innerHTML =
      '<div class="sci-tool">' +
      '  <div class="sci-module-pills" role="tablist">' +
      renderModulePills() +
      "</div>" +
      renderWalkthrough() +
      "</div>";
    bindEvents();
  }

  function animateStepChange(updateFn) {
    if (animating) return;
    var stage = document.getElementById("sci-step-stage");
    if (!stage) {
      updateFn();
      render();
      return;
    }
    animating = true;
    var panel = stage.querySelector(".sci-step-panel");
    if (panel) panel.classList.add("is-exiting");

    window.setTimeout(function () {
      updateFn();
      render();
      animating = false;
      var nextPanel = document.querySelector("#sci-step-stage .sci-step-panel");
      if (nextPanel) {
        nextPanel.classList.add("is-entering");
        window.requestAnimationFrame(function () {
          nextPanel.classList.remove("is-entering");
        });
      }
    }, 280);
  }

  function goNext() {
    var mod = getActiveModule();
    if (!mod) return;
    if (stepIndex >= mod.steps.length - 1) {
      animateStepChange(function () {
        stepIndex = 0;
      });
      return;
    }
    animateStepChange(function () {
      stepIndex += 1;
    });
  }

  function goPrev() {
    if (stepIndex <= 0) return;
    animateStepChange(function () {
      stepIndex -= 1;
    });
  }

  function setModule(id) {
    if (id === activeModuleId) return;
    animateStepChange(function () {
      activeModuleId = id;
      stepIndex = 0;
    });
  }

  function bindEvents() {
    if (!container) return;

    container.querySelectorAll("[data-module]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setModule(btn.getAttribute("data-module"));
      });
    });

    var prev = container.querySelector("#sci-prev");
    var next = container.querySelector("#sci-next");
    if (prev) prev.addEventListener("click", goPrev);
    if (next) next.addEventListener("click", goNext);
  }

  return {
    init: function init(root) {
      container = root;
      activeModuleId = "convert-large";
      stepIndex = 0;
      animating = false;
      render();
    },
    refresh: function refresh() {
      render();
    },
    destroy: function destroy() {
      container = null;
    },
  };
})();
