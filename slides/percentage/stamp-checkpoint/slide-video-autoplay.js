/**
 * Manim-slides background videos start at frame 0 when a slide opens, so edge
 * number-line labels look clipped until the clip finishes. Auto-play each slide
 * video on enter and pause on the last frame; if autoplay is blocked, jump there.
 */
(function () {
  function slideVideo(section) {
    if (!section || !section.slideBackgroundContentElement) return null;
    return section.slideBackgroundContentElement.querySelector("video");
  }

  function restOnFinalFrame(section) {
    var video = slideVideo(section);
    if (!video) return;

    video.muted = true;

    var finish = function () {
      video.removeEventListener("ended", finish);
      video.removeEventListener("timeupdate", onTick);
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.04);
      }
      video.pause();
    };

    var onTick = function () {
      if (video.duration && video.currentTime >= video.duration - 0.06) {
        finish();
      }
    };

    video.addEventListener("ended", finish);
    video.addEventListener("timeupdate", onTick);
    video.currentTime = 0;

    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.04);
        }
        video.pause();
      });
    }
  }

  Reveal.on("slidechanged", function (event) {
    restOnFinalFrame(event.currentSlide);
  });

  // This file loads after Reveal.initialize(), so "ready" may have fired already.
  function boot() {
    restOnFinalFrame(Reveal.getCurrentSlide());
  }
  if (Reveal.isReady()) {
    boot();
  } else {
    Reveal.on("ready", boot);
  }
})();
