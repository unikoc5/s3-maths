/**
 * Click or Space advances a Manim-Slides Reveal deck.
 * Left / Right stay previous / next. Space is next, not play/pause.
 */
(function () {
  "use strict";

  function reveal() {
    var R = window.Reveal;
    return R && R.next ? R : null;
  }

  function nextSlide() {
    var R = reveal();
    if (R) R.next();
  }

  function prevSlide() {
    var R = reveal();
    if (R) R.prev();
  }

  function bind() {
    var R = reveal();
    if (!R || !R.addKeyBinding) return false;
    if (R.__quadAdvance) return true;
    R.__quadAdvance = true;
    R.addKeyBinding(
      { keyCode: 32, key: "SPACE", description: "Next slide" },
      nextSlide
    );
    R.addKeyBinding(
      { keyCode: 39, key: "RIGHT", description: "Next slide" },
      nextSlide
    );
    R.addKeyBinding(
      { keyCode: 37, key: "LEFT", description: "Previous slide" },
      prevSlide
    );
    document.addEventListener("click", function (e) {
      if (e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest("a, button")) return;
      nextSlide();
    });
    window.addEventListener("message", function (e) {
      var data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (err) { return; }
      }
      if (!data || !data.method) return;
      if (data.method === "next") nextSlide();
      if (data.method === "prev") prevSlide();
    });
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    if (bind() || ++tries > 50) clearInterval(timer);
  }, 100);
})();
