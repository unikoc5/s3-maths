/** Blur accidental focus on non-input UI so the text caret never appears on sliders, labels, chips, etc. */
(function () {
  "use strict";

  function mayKeepFocus(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return true;
    if (el.isContentEditable) return true;
    var role = el.getAttribute("role");
    if (role === "button" || role === "tab" || role === "separator" || role === "checkbox" || role === "radio") return true;
    var ti = el.getAttribute("tabindex");
    if (ti != null && ti !== "-1") return true;
    return false;
  }

  var DRAG_CHROME =
    ".slider-row, .tool-sliders, .chip, .tab-row .tab, .tabs .tab, .pcard, " +
    ".tiny-x, .sf-card, .stat-card, .stat-pill, .badge-row, .subnav, .deck-wrap, " +
    "svg, .lab-svg, .numline-svg, .bar-chart-fixed, .jm-tabs, .power-block, " +
    ".times-sign, .one-mark, .bit-toggle, .quiz-nav, .sf-progress-track, " +
    ".tool-action, .cross-btn, .method-chip, .step-dots, .nav-btn, .deck-nav-btn, " +
    ".it-field, .transform-sliders, input[type=range]";

  var SELECTABLE =
    ".hint, .lead, .feedback, .cross-step-note, .step-text, .intro, " +
    ".task-box p, .panel p, .no-sol, .quiz-stem, .eq-line, .step-title, " +
    ".comic-check-card, .legend-title, .legend .lg-item em, .legend .lg-item .katex, " +
    ".katex, .katex-html, .formula, .cross-math, .cross-preview, .note-box, " +
    ".part-title, h1, h2, h3, .caption, #tool-eq, .pg-sym";

  document.addEventListener("focusin", function (e) {
    if (mayKeepFocus(e.target)) return;
    e.target.blur();
  });

  document.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    var el = e.target;
    if (!el || el.closest("input, textarea, select, [contenteditable='true']")) return;
    if (el.closest("button, a, [role='button'], [role='tab'], [tabindex]:not([tabindex='-1'])")) return;
    if (el.closest(SELECTABLE)) return;
    if (el.closest(DRAG_CHROME)) e.preventDefault();
  });
})();
