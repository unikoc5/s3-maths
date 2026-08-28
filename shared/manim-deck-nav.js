/** Manim-Slides / Reveal: click & Enter → next; disable ↑↓. */
(function () {
  "use strict";

  function install(Reveal) {
    if (!Reveal || Reveal.__kocManimNav) return;
    Reveal.__kocManimNav = true;

    Reveal.addKeyBinding(
      { keyCode: 13, key: "ENTER", description: "Next slide" },
      function () { Reveal.next(); }
    );
    // Swallow vertical arrows (no vertical slides in these decks).
    Reveal.addKeyBinding(
      { keyCode: 38, key: "UP", description: "Disabled" },
      function () { /* no-op */ }
    );
    Reveal.addKeyBinding(
      { keyCode: 40, key: "DOWN", description: "Disabled" },
      function () { /* no-op */ }
    );

    document.addEventListener("click", function (e) {
      if (e.button !== 0) return;
      if (e.target.closest("a, button, .controls, .progress, .speaker-notes")) return;
      try {
        if (Reveal.isReady && Reveal.isReady()) Reveal.next();
      } catch (err) { /* ignore */ }
    });
  }

  function boot() {
    var R = window.Reveal;
    if (!R) return;
    if (typeof R.isReady === "function" && R.isReady()) {
      install(R);
      return;
    }
    if (typeof R.on === "function") {
      R.on("ready", function () { install(window.Reveal); });
    } else {
      // Reveal.initialize may still be running (sync script after init call).
      setTimeout(boot, 50);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
