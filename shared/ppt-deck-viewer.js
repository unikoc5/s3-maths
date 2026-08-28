/* Full PowerPoint video export viewer — optional hard crop to a time span. */
(function () {
  "use strict";
  var body = document.body;
  var title = body.getAttribute("data-ppt-title") || "Lesson deck";
  var videoFile = body.getAttribute("data-ppt-video") || "main.mp4";
  var sourceFile = body.getAttribute("data-ppt-source") || "";
  var sourceRange = body.getAttribute("data-ppt-range") || "";
  var clipStart = parseFloat(body.getAttribute("data-ppt-start") || "", 10);
  var clipEnd = parseFloat(body.getAttribute("data-ppt-end") || "", 10);
  var embed = body.getAttribute("data-ppt-embed") === "1";
  var hasClip = isFinite(clipStart) && isFinite(clipEnd) && clipEnd > clipStart;
  var clipLen = hasClip ? clipEnd - clipStart : 0;
  var scrubbing = false;

  function fmtTime(sec) {
    var t = Math.max(0, sec);
    var m = Math.floor(t / 60);
    var s = t - m * 60;
    var whole = Math.floor(s);
    var frac = Math.round((s - whole) * 100);
    var base = m + ":" + (whole < 10 ? "0" : "") + whole;
    if (frac <= 0) return base;
    if (frac % 10 === 0) return base + "." + (frac / 10);
    return base + "." + (frac < 10 ? "0" : "") + frac;
  }

  if (hasClip && !sourceRange) {
    sourceRange = fmtTime(clipStart) + " \u2013 " + fmtTime(clipEnd);
  }

  function clipSrc(file) {
    if (!hasClip) return file;
    return file + "#t=" + clipStart + "," + clipEnd;
  }

  if (embed) body.classList.add("embed-mode");

  document.title = title;
  body.innerHTML =
    (embed
      ? ""
      : '<div class="bar">' +
          '<span class="title">' + title + "</span>" +
          (sourceRange
            ? '<span class="meta ppt-src" id="src-meta">' +
                (sourceFile ? sourceFile + " \u00b7 " : "") + sourceRange + "</span>"
            : "") +
          '<span class="meta" id="meta"></span>' +
          '<button type="button" id="play-btn">Play / Pause</button>' +
          '<button type="button" id="restart-btn">Restart</button>' +
        "</div>") +
    '<div class="stage" id="stage">' +
      '<video id="v" src="' + clipSrc(videoFile) + '"' +
        (hasClip ? ' playsinline preload="auto"' : ' controls playsinline preload="metadata"') +
      "></video>" +
      (hasClip
        ? '<div class="clip-ui" id="clip-ui">' +
            '<input type="range" id="scrub" min="0" max="1000" value="0" aria-label="Clip progress">' +
            '<span class="clip-clock" id="clip-clock">0:00 / ' + fmtTime(clipLen) + "</span>" +
          "</div>"
        : "") +
    "</div>";

  var v = document.getElementById("v");
  var stage = document.getElementById("stage");
  var meta = embed ? null : document.getElementById("meta");
  var scrub = hasClip ? document.getElementById("scrub") : null;
  var clipClock = hasClip ? document.getElementById("clip-clock") : null;
  var failed = false;

  function postState() {
    if (!embed || window.parent === window) return;
    window.parent.postMessage({
      type: "ppt-state",
      title: title,
      source: sourceFile,
      range: sourceRange,
      clipLen: hasClip ? clipLen : (v.duration || 0),
      cropped: hasClip,
      paused: v.paused,
    }, "*");
  }

  function showError(msg) {
    if (failed) return;
    failed = true;
    stage.innerHTML =
      '<div class="err"><strong>Video not ready</strong>' + msg +
      "<br><br>In PowerPoint: <b>File \u2192 Export \u2192 Create a Video</b>, save as " +
      "<code>" + videoFile + "</code> in this folder, then refresh.</div>";
    postState();
  }

  function atClipEnd() {
    return v.currentTime >= clipEnd - 0.06;
  }

  function seekClipStart() {
    if (!hasClip) return;
    v.currentTime = clipStart;
  }

  function seekClipEnd() {
    if (!hasClip) return;
    v.pause();
    v.currentTime = Math.max(clipStart, clipEnd - 0.04);
    updateClipUi();
    postState();
  }

  function relTime() {
    return Math.max(0, Math.min(clipLen, v.currentTime - clipStart));
  }

  function updateClipUi() {
    if (!hasClip || !scrub || !clipClock) return;
    var rel = relTime();
    if (!scrubbing) scrub.value = String(Math.round((rel / clipLen) * 1000));
    clipClock.textContent = fmtTime(rel) + " / " + fmtTime(clipLen);
  }

  function enforceClipBounds() {
    if (!hasClip || failed) return;
    if (v.currentTime < clipStart) {
      v.currentTime = clipStart;
      return;
    }
    if (v.currentTime >= clipEnd - 0.02) {
      seekClipEnd();
    }
  }

  v.addEventListener("error", function () {
    showError("Could not load <code>" + videoFile + "</code> (missing, locked, or 0 bytes).");
  });

  v.addEventListener("loadedmetadata", function () {
    if (!v.duration || !isFinite(v.duration)) {
      showError("Video file appears empty — re-export from PowerPoint.");
      return;
    }
    if (hasClip) {
      if (clipEnd > v.duration + 0.5) {
        showError("Clip end (" + fmtTime(clipEnd) + ") is past video length (" + fmtTime(v.duration) + ").");
        return;
      }
      seekClipStart();
      if (meta) meta.textContent = "cropped " + fmtTime(clipLen);
      updateClipUi();
      postState();
      return;
    }
    if (meta) meta.textContent = fmtTime(v.duration);
    postState();
  });

  v.addEventListener("timeupdate", function () {
    enforceClipBounds();
    updateClipUi();
  });

  v.addEventListener("play", postState);
  v.addEventListener("pause", postState);

  v.addEventListener("seeking", function () {
    if (!hasClip || failed || scrubbing) return;
    if (v.currentTime < clipStart) v.currentTime = clipStart;
    else if (v.currentTime > clipEnd - 0.01) v.currentTime = clipEnd - 0.04;
  });

  v.addEventListener("seeked", function () {
    if (!hasClip || failed) return;
    if (v.currentTime < clipStart) v.currentTime = clipStart;
    else if (v.currentTime > clipEnd - 0.01) v.currentTime = clipEnd - 0.04;
    updateClipUi();
  });

  v.addEventListener("ended", function () {
    if (!hasClip) return;
    seekClipEnd();
  });

  if (scrub) {
    scrub.addEventListener("input", function () {
      scrubbing = true;
      var rel = (parseInt(scrub.value, 10) / 1000) * clipLen;
      v.currentTime = clipStart + rel;
      updateClipUi();
    });
    scrub.addEventListener("change", function () {
      scrubbing = false;
      enforceClipBounds();
    });
  }

  function togglePlay() {
    if (failed) return;
    if (hasClip && (v.currentTime < clipStart || atClipEnd())) seekClipStart();
    if (v.paused) v.play(); else v.pause();
  }

  function restartPlay() {
    if (failed) return;
    v.currentTime = hasClip ? clipStart : 0;
    updateClipUi();
    v.play();
  }

  if (!embed) {
    document.getElementById("play-btn").addEventListener("click", togglePlay);
    document.getElementById("restart-btn").addEventListener("click", restartPlay);
  }

  window.addEventListener("message", function (e) {
    if (!e.data || typeof e.data.type !== "string") return;
    if (e.data.type === "ppt-play") togglePlay();
    if (e.data.type === "ppt-restart") restartPlay();
  });

  window.addEventListener("keydown", function (e) {
    if (failed) return;
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      togglePlay();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (hasClip && atClipEnd()) seekClipStart();
      else if (hasClip && v.currentTime < clipStart) seekClipStart();
      v.play();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      var floor = hasClip ? clipStart : 0;
      v.currentTime = Math.max(floor, v.currentTime - 5);
      updateClipUi();
    }
  });

  window.Reveal = {
    isReady: function () { return !failed; },
    slide: function () {},
    getIndices: function () { return { h: 0, v: 0, f: 0 }; },
  };
})();
