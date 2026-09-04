/** Hide the blinking insertion caret on chrome while keeping text highlight and pointer-drag. */
(function () {
  "use strict";
  if (window.__S3_CARET_SUPPRESS__) return;
  window.__S3_CARET_SUPPRESS__ = true;

  var style = document.createElement("style");
  style.id = "s3-suppress-ui-caret";
  style.textContent =
    'html, body { caret-color: transparent; }' +
    '*:not(input):not(textarea):not(select):not([contenteditable="true"]) { caret-color: transparent; }' +
    'input, textarea, select, [contenteditable="true"] { caret-color: auto; }' +
    ".hint, .lead, .lede, .feedback, .formula, .eq-line, .katex, .katex-html," +
    ".hero h1, .hero p, .eyebrow, h1, h2, h3, .part-title, .note-box, .quiz-stem," +
    ".cross-math, .cross-preview, #tool-eq, .caption, .intro {" +
    "  -webkit-user-select: text; user-select: text; caret-color: transparent;" +
    "}" +
    ".chip, .tab, .jm-tab, .subnav, .slider-row, .tool-sliders, input[type=range]," +
    "svg, .lab-svg, .numline-svg, .topic-card, .back-link, button, .jm-tabs," +
    ".stat-card, .pcard, .method-chip {" +
    "  caret-color: transparent;" +
    "}";
  (document.head || document.documentElement).appendChild(style);

  function isEditable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function mayKeepFocus(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (isEditable(el)) return true;
    var tag = el.tagName;
    if (tag === "BUTTON" || tag === "A") return true;
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
    ".it-field, .transform-sliders, input[type=range], .topic-card, .card-art";

  var SELECTABLE =
    ".hint, .lead, .lede, .feedback, .cross-step-note, .step-text, .intro, " +
    ".task-box p, .panel p, .no-sol, .quiz-stem, .eq-line, .step-title, " +
    ".comic-check-card, .legend-title, .legend .lg-item em, .legend .lg-item .katex, " +
    ".katex, .katex-html, .formula, .cross-math, .cross-preview, .note-box, " +
    ".part-title, h1, h2, h3, .caption, #tool-eq, .pg-sym, .eyebrow, .hero";

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
