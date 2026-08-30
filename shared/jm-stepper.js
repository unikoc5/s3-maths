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

  function ensureTrack(frame) {
    var track = frame.querySelector(".step-track");
    if (track) return track;
    var panels = [].slice.call(frame.querySelectorAll(".step-panel"));
    if (!panels.length) return null;
    var host = panels[0].parentNode;
    host.classList.add("step-viewport");
    track = document.createElement("div");
    track.className = "step-track";
    panels.forEach(function (p) { track.appendChild(p); });
    host.appendChild(track);
    return track;
  }

  window.initJmStepper = function (name) {
    var frame = document.querySelector('[data-stepper="' + name + '"]');
    var dotsWrap = document.querySelector('[data-dots="' + name + '"]');
    if (!frame) return;
    var track = ensureTrack(frame);
    var panels = [].slice.call(frame.querySelectorAll(".step-panel"));
    var prev = frame.querySelector(".prev");
    var next = frame.querySelector(".next");
    var idx = 0;

    function show(i) {
      idx = Math.max(0, Math.min(panels.length - 1, i));
      if (track) track.style.transform = "translateX(-" + (idx * 100) + "%)";
      panels.forEach(function (p, j) { p.classList.toggle("active", j === idx); });
      if (dotsWrap) {
        [].slice.call(dotsWrap.querySelectorAll("span, button")).forEach(function (d, j) {
          d.classList.toggle("on", j === idx);
        });
      }
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === panels.length - 1;
      renderKatex(frame);
    }

    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    if (dotsWrap) {
      [].slice.call(dotsWrap.querySelectorAll("span, button")).forEach(function (d, j) {
        d.addEventListener("click", function () { show(j); });
      });
    }
    show(0);
  };
})();
