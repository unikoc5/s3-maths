/** iPad embed nav: All topics button in the tab row; posts back to hub.
 * Desktop hub keeps its viewer-bar. Only active when embedded + tablet-touch.
 */
(function () {
  "use strict";

  var TABLET_MAX_W = 1366;

  function isTouchTabletDevice() {
    if (navigator.maxTouchPoints < 1) return false;
    var w = window.innerWidth;
    if (w < 768 || w > TABLET_MAX_W) return false;
    var ua = navigator.userAgent || "";
    if (/iPad/i.test(ua)) return true;
    if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    if (window.matchMedia("(hover: none)").matches) return true;
    return false;
  }

  function applyTabletClass() {
    document.documentElement.classList.toggle("tablet-touch", isTouchTabletDevice());
  }

  function ensureTabRow() {
    var row = document.querySelector(".tab-row");
    if (row) return row;
    var tabs = document.querySelector("nav.tabs");
    if (!tabs || !tabs.parentNode) return null;
    row = document.createElement("div");
    row.className = "tab-row";
    tabs.parentNode.insertBefore(row, tabs);
    row.appendChild(tabs);
    return row;
  }

  function ensureBackBtn() {
    if (window.self === window.top) return;
    document.documentElement.classList.add("in-embed");
    applyTabletClass();

    var row = ensureTabRow();
    if (!row) return;
    if (row.querySelector(".embed-back-btn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "embed-back-btn";
    btn.setAttribute("aria-label", "Back to gallery");
    btn.innerHTML = "&#8592; All topics";
    btn.addEventListener("click", function () {
      try {
        parent.postMessage({ type: "uniplus:back-to-gallery" }, "*");
      } catch (e) {}
    });
    row.appendChild(btn);
  }

  function boot() {
    ensureBackBtn();
    window.addEventListener("resize", function () {
      applyTabletClass();
      ensureBackBtn();
    });
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        applyTabletClass();
        ensureBackBtn();
      }, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
