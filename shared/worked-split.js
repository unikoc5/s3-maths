/* Draggable split + responsive step typography for worked-solution dashboards. */
(function () {
  "use strict";

  var HANDLE_W = 10;
  var MIN_LEFT = 180;
  var MIN_RIGHT = 220;
  var DEFAULT_RATIO = 0.55;

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function applyFontVars(el, body, title, idx, idxFont) {
    if (!el) return;
    el.style.setProperty("--ws-step-font", body + "px");
    el.style.setProperty("--ws-step-title", title + "px");
    el.style.setProperty("--ws-step-katex", (body * 1.12) + "px");
    el.style.setProperty("--ws-step-idx", idx + "px");
    el.style.setProperty("--ws-step-idx-font", idxFont + "px");
  }

  function updateFontScale(rightPane) {
    if (!rightPane) return;
    var w = rightPane.getBoundingClientRect().width;
    var t = clamp((w - 240) / 360, 0, 1);
    var body = Math.round(15 + t * 7);
    var title = Math.round(13 + t * 5);
    var idx = Math.round(22 + t * 4);
    var idxFont = Math.round(11 + t * 3);
    applyFontVars(rightPane, body, title, idx, idxFont);
    /* Area & Volume: pinned question sits above the stage split */
    if (rightPane.classList.contains("solution-steps-wrap")) {
      applyFontVars(rightPane.closest(".worked-content"), body, title, idx, idxFont);
    }
  }

  function bindResize(split, handle, left, right, storageKey) {
    var ratio = DEFAULT_RATIO;
    if (storageKey) {
      try {
        var saved = parseFloat(localStorage.getItem(storageKey));
        if (!isNaN(saved) && saved > 0 && saved < 1) ratio = saved;
      } catch (e) { /* private mode */ }
    }

    function applyRatio(next) {
      var total = split.getBoundingClientRect().width - HANDLE_W;
      if (total <= 0) return;
      var maxR = (total - MIN_RIGHT) / total;
      var minR = MIN_LEFT / total;
      ratio = clamp(next, minR, maxR);
      left.style.flexBasis = (ratio * 100) + "%";
      split.style.setProperty("--ws-left-pct", (ratio * 100) + "%");
      updateFontScale(right);
    }

    applyRatio(ratio);

    if (window.ResizeObserver) {
      new ResizeObserver(function () { updateFontScale(right); }).observe(right);
    } else {
      window.addEventListener("resize", function () { updateFontScale(right); });
    }

    function onMove(clientX) {
      var rect = split.getBoundingClientRect();
      applyRatio((clientX - rect.left) / rect.width);
    }

    function stopDrag() {
      handle.classList.remove("dragging");
      document.body.classList.remove("ws-split-dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", stopDrag);
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(ratio)); } catch (e) { /* private mode */ }
      }
    }

    function onMouseMove(e) { onMove(e.clientX); }
    function onTouchMove(e) {
      if (e.touches[0]) onMove(e.touches[0].clientX);
    }

    function startDrag(e) {
      e.preventDefault();
      handle.classList.add("dragging");
      document.body.classList.add("ws-split-dragging");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopDrag);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", stopDrag);
    }

    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startDrag, { passive: false });
    handle.addEventListener("dblclick", function () {
      applyRatio(DEFAULT_RATIO);
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(ratio)); } catch (e) { /* private mode */ }
      }
    });
  }

  function wrapSplit(parent, leftSel, rightSel, storageKey) {
    if (!parent || parent.querySelector(".ws-split")) return;
    var left = parent.querySelector(leftSel);
    var right = parent.querySelector(rightSel);
    if (!left || !right) return;

    var split = document.createElement("div");
    split.className = "ws-split";
    parent.insertBefore(split, left);
    split.appendChild(left);

    var handle = document.createElement("div");
    handle.className = "ws-split-handle";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-label", "Drag to resize animation and solution panels");
    handle.title = "Drag to resize · double-click to reset";
    split.appendChild(handle);

    left.classList.add("ws-split-pane", "ws-split-left");
    right.classList.add("ws-split-pane", "ws-split-right");
    split.appendChild(right);

    bindResize(split, handle, left, right, storageKey);
  }

  function init() {
    var pageKey = location.pathname.replace(/[^\w-]+/g, "_");

    document.querySelectorAll(".worked-layout").forEach(function (layout) {
      wrapSplit(layout, ".worked-main", ".solution-panel", "ws-split-main-" + pageKey);
    });

    document.querySelectorAll("#worked-stage, .worked-stage").forEach(function (stage) {
      wrapSplit(stage, ".worked-anim-col", ".solution-steps-wrap", "ws-split-stage-" + pageKey);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.WorkedSplit = { init: init, updateFontScale: updateFontScale };
})();
