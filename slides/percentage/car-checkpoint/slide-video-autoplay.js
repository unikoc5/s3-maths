/**
 * Manim-slides background videos: mute + autoplay, then rest on the last frame.
 * If autoplay is blocked or stalls near t=0, jump to the final frame so the
 * slide never looks blank.
 */
(function () {
  function slideVideo(section) {
    if (!section || !section.slideBackgroundContentElement) return null;
    return section.slideBackgroundContentElement.querySelector("video");
  }

  function whenReady(video, fn) {
    if (video.readyState >= 1 && video.duration && isFinite(video.duration)) {
      fn();
      return;
    }
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("canplay", finish);
      fn();
    };
    video.addEventListener("loadedmetadata", finish);
    video.addEventListener("canplay", finish);
    // Last resort if metadata events never fire.
    setTimeout(finish, 800);
  }

  function jumpToEnd(video) {
    whenReady(video, function () {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = Math.max(0, video.duration - 0.05);
        } catch (e) {}
      }
      video.pause();
    });
  }

  function restOnFinalFrame(section) {
    var video = slideVideo(section);
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.playsInline = true;

    var finish = function () {
      video.removeEventListener("ended", finish);
      video.removeEventListener("timeupdate", onTick);
      jumpToEnd(video);
    };

    var onTick = function () {
      if (video.duration && video.currentTime >= video.duration - 0.06) {
        finish();
      }
    };

    video.addEventListener("ended", finish);
    video.addEventListener("timeupdate", onTick);

    whenReady(video, function () {
      try {
        video.currentTime = 0;
      } catch (e) {}
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          jumpToEnd(video);
        });
      }
      // If still stuck near the blank opening frame, show the finished slide.
      setTimeout(function () {
        if (video.paused && (!video.currentTime || video.currentTime < 0.12)) {
          jumpToEnd(video);
        }
      }, 450);
    });
  }

  Reveal.on("slidechanged", function (event) {
    restOnFinalFrame(event.currentSlide);
  });

  function boot() {
    restOnFinalFrame(Reveal.getCurrentSlide());
  }
  if (Reveal.isReady()) {
    boot();
  } else {
    Reveal.on("ready", boot);
  }
})();
