/**
 * Shared helper for every Manim-Slides reveal.js deck.
 *
 * 1. On Cloudflare Pages, slide .mp4 files are not deployed (~800MB stripped).
 *    Rewrite Reveal background-video URLs to GitHub Pages before Reveal.init.
 * 2. Harden slide backgrounds: reveal.js can leave a previous slide's
 *    background video visible (or stack a stale <video> in the same
 *    background), which composites two frames — e.g. "+10%" ghosting behind
 *    "(1 + 10%)". Force-hide every background except the current slide's and
 *    keep only one live <video> per background. Applies on all hosts and
 *    devices (the glitch shows on both desktop and iPad).
 */
(function () {
  "use strict";

  var GH =
    "https://unipluseducationact-ctrl.github.io/math-s3/dashboard";

  function rewriteToGitHub() {
    // Only rewrite when not already on GitHub Pages (local / CF / custom domain).
    if (/github\.io$/i.test(location.hostname)) return;
    if (location.protocol === "file:") return;
    // Keep local preview on local mp4s (new decks are not on GH Pages yet).
    if (/^(localhost|127\.0\.0\.1)$/i.test(location.hostname)) return;

    document.querySelectorAll("[data-background-video]").forEach(function (el) {
      var v = el.getAttribute("data-background-video");
      if (!v || /^https?:\/\//i.test(v)) return;
      el.setAttribute(
        "data-background-video",
        GH + new URL(v, location.href).pathname
      );
    });

    document.querySelectorAll("video source[src], video[src]").forEach(function (el) {
      var v = el.getAttribute("src");
      if (!v || /^https?:\/\//i.test(v)) return;
      el.setAttribute("src", GH + new URL(v, location.href).pathname);
    });
  }

  rewriteToGitHub();

  function applyBackgroundVisibility() {
    var R = window.Reveal;
    if (!R || !R.isReady || !R.isReady()) return;
    var current = null;
    try {
      var idx = R.getIndices();
      current = R.getSlideBackground(idx.h, idx.v);
    } catch (e) { /* reveal not fully ready */ }
    if (!current) return;

    document
      .querySelectorAll(".reveal .backgrounds .slide-background")
      .forEach(function (bg) {
        var isCurrent = bg === current || bg.contains(current) || current.contains(bg);
        if (!isCurrent) {
          bg.style.visibility = "hidden";
          bg.style.opacity = "0";
          bg.querySelectorAll("video").forEach(function (v) {
            try { v.pause(); } catch (e) { /* ignore */ }
          });
        } else {
          bg.style.visibility = "";
          bg.style.opacity = "";
        }
      });

    // If a stale <video> was left behind in the current background, keep only
    // the most recently added one visible.
    var vids = current.querySelectorAll("video");
    for (var i = 0; i < vids.length - 1; i++) {
      vids[i].style.display = "none";
      try { vids[i].pause(); } catch (e) { /* ignore */ }
    }
    if (vids.length) vids[vids.length - 1].style.display = "";
  }

  function hookReveal() {
    var R = window.Reveal;
    if (!R || !R.isReady) return false;
    var run = function () {
      applyBackgroundVisibility();
      // run again shortly after — reveal (re)creates background videos async
      setTimeout(applyBackgroundVisibility, 120);
      setTimeout(applyBackgroundVisibility, 500);
    };
    if (R.isReady()) {
      R.on("ready", run);
      R.on("slidechanged", run);
      R.on("fragmentshown", run);
      R.on("fragmenthidden", run);
      run();
      return true;
    }
    return false;
  }

  var tries = 0;
  var timer = setInterval(function () {
    if (hookReveal() || ++tries > 100) clearInterval(timer);
  }, 200);
})();
