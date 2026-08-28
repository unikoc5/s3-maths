/** iPhone / narrow phone layout — gated by html.phone-compact (<=767px).
 * Desktop and iPad (tablet-touch, >=768px) are unchanged. */
(function () {
  "use strict";

  var PHONE_MAX_W = 767;

  function isPhoneCompact() {
    return window.innerWidth <= PHONE_MAX_W;
  }

  function applyPhoneClass() {
    document.documentElement.classList.toggle("phone-compact", isPhoneCompact());
  }

  function boot() {
    applyPhoneClass();
    window.addEventListener("resize", applyPhoneClass);
    window.addEventListener("orientationchange", function () {
      setTimeout(applyPhoneClass, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.KOCPhone = { isPhoneCompact: isPhoneCompact, applyPhoneClass: applyPhoneClass };
})();
