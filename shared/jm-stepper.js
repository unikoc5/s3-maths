(function () {
  "use strict";

  function renderKatex(root) {
    if (window.renderMathInElement && root) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  window.initJmStepper = function (name) {
    var frame = document.querySelector('[data-stepper="' + name + '"]');
    var dotsWrap = document.querySelector('[data-dots="' + name + '"]');
    if (!frame || !dotsWrap) return;
    var panels = frame.querySelectorAll(".step-panel");
    var prev = frame.querySelector(".prev");
    var next = frame.querySelector(".next");
    var idx = 0;

    function show(i) {
      idx = Math.max(0, Math.min(panels.length - 1, i));
      panels.forEach(function (p, j) {
        p.classList.toggle("active", j === idx);
      });
      dotsWrap.querySelectorAll("span").forEach(function (d, j) {
        d.classList.toggle("on", j === idx);
      });
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === panels.length - 1;
      renderKatex(frame);
    }

    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    show(0);
  };
})();
