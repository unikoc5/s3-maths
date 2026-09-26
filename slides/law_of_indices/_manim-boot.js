/**
 * JM24 Concept decks — Manim vocabulary (JM25–27 / 30 / 32):
 *
 * KINDS
 *   Write / FadeIn(shift)  — new definition or caption
 *   TransformFromCopy      — data-fly-from (provenance from example)
 *   TransformMatchingTex   — stage-pane replace-in-place
 *   Indicate               — one-beat pulse (cancel token / decimal)
 *   SurroundingRectangle   — .box-final on the takeaway only
 *   temporary note         — .note-proc / .note-sem / .note-warn under work
 *
 * HIGHLIGHT
 *   COL_A blue / COL_B amber / COL_AB green / COL_REMOVE red / operators INK
 *   Same quantity keeps its colour across morphs
 *
 * POINT SELECTION
 *   one click = one next_slide() beat; advance mid-anim finishes current beat only
 */
(function () {
  "use strict";

  var FLY_MS = 560;   /* ~TransformFromCopy 0.55–0.9s */
  var PEEL_MS = 640;
  var CANCEL_MS = 480;
  var JUMP_MS = 560;
  var autoTimers = [];
  var rafIds = [];
  var playToken = 0;

  var anim = { busy: false, skip: false, finish: null };

  /** Reveal scales .slides; body-fixed ghosts must match that visual size. */
  function revealScale() {
    try {
      if (window.Reveal && typeof Reveal.getScale === "function") {
        var s = Reveal.getScale();
        if (s && s > 0.05) return s;
      }
    } catch (e) { /* ignore */ }
    return 1;
  }

  function scaledFontPx(elOrFs) {
    var fs = typeof elOrFs === "string"
      ? elOrFs
      : window.getComputedStyle(elOrFs).fontSize;
    var px = parseFloat(fs);
    if (!isFinite(px) || px <= 0) px = 34;
    return (px * revealScale()) + "px";
  }

  function renderMath(root) {
    if (!window.renderMathInElement) return;
    renderMathInElement(root || document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false
    });
  }

  function clearAutoTimers() {
    autoTimers.forEach(function (id) { window.clearTimeout(id); });
    autoTimers = [];
    rafIds.forEach(function (id) { try { cancelAnimationFrame(id); } catch (e) { /* */ } });
    rafIds = [];
    playToken += 1;
    anim.busy = false;
    anim.skip = false;
    anim.finish = null;
  }

  function later(fn, ms) {
    var token = playToken;
    var id = window.setTimeout(function () {
      if (token !== playToken) return;
      fn();
    }, ms);
    autoTimers.push(id);
    return id;
  }

  function raf(fn) {
    var id = window.requestAnimationFrame(fn);
    rafIds.push(id);
    return id;
  }

  function purgeGhosts() {
    document.querySelectorAll(
      ".fly-ghost, .peel-ghost, .times-ghost, .dp-ghost, .pv-drag-box"
    ).forEach(function (g) {
      if (g.parentNode) g.parentNode.removeChild(g);
    });
  }

  function clearSourceMarks() {
    document.querySelectorAll(".example-row .src, .example-row .src-core").forEach(function (el) {
      el.classList.remove("is-source", "is-spent", "expand-framed");
    });
  }

  function clearAllExpandFrames(scope) {
    (scope || document).querySelectorAll(".expand-framed").forEach(function (el) {
      el.classList.remove("expand-framed");
    });
  }

  function markSource(sel, spent) {
    if (!sel) return;
    var src = document.querySelector(sel);
    if (!src) return;
    if (spent) {
      src.classList.remove("is-source");
      src.classList.add("is-spent");
    } else {
      src.classList.remove("is-spent");
      src.classList.add("is-source");
    }
  }

  function setExpandFrame(el, on) {
    if (!el) return;
    /* Prefer .src-core so the yellow frame never covers the outer power */
    var target = el.querySelector && el.querySelector(".src-core");
    (target || el).classList.toggle("expand-framed", !!on);
  }

  /** Yellow frame belongs on the Example-row term being expanded (not the work row). */
  function frameExampleSrc(pane) {
    clearAllExpandFrames();
    clearSourceMarks();
    if (!pane) return null;
    var sel = pane.getAttribute("data-ex-src");
    if (!sel) {
      var fly = pane.querySelector("[data-fly-from]");
      if (fly) sel = fly.getAttribute("data-fly-from");
    }
    if (!sel) return null;
    var src = document.querySelector(sel);
    if (src) setExpandFrame(src, true);
    return src;
  }

  /** Manim Indicate — one-beat flash */
  function indicate(el) {
    if (!el) return;
    el.classList.remove("indicate");
    void el.offsetWidth;
    el.classList.add("indicate");
    later(function () { el.classList.remove("indicate"); }, 720);
  }

  /** Manim title_bar: accent width = title.width + 0.6 */
  function syncTitleBars(scope) {
    (scope || document).querySelectorAll(".m-head").forEach(function (head) {
      var title = head.querySelector(".m-title");
      var line = head.querySelector(".m-line");
      if (!title || !line) return;
      var w = title.getBoundingClientRect().width;
      if (w > 40) line.style.width = Math.round(w + 36) + "px";
    });
  }

  function restoreVisualState(scope) {
    var root = scope || document;
    root.querySelectorAll(".token, .src, .c, .expand-term, .conv-extra, .sci-jump-eq").forEach(function (t) {
      t.classList.remove(
        "struck", "gather-left", "gather-right", "gather-mid", "is-remaining",
        "expand-framed", "framed", "dragged", "landed", "awaiting",
        "dragging", "spent", "is-on", "fly-wait", "fly-land", "combined", "combining",
        "fade-out-step", "fade-in-step", "peel-factor-wait", "peel-times-live", "is-peel-pending"
      );
      t.style.opacity = "";
      t.style.fontSize = "";
    });
    root.querySelectorAll(".frac-stack, .frac-build").forEach(function (f) {
      f.classList.remove(
        "cancelled", "cancel-done", "gathering", "gathered",
        "phase-bar", "phase-compact", "phase-num", "phase-expand",
        "phase-den", "phase-cancel", "phase-result"
      );
    });
    root.querySelectorAll("sup.pow, .pow").forEach(function (p) { p.style.opacity = ""; });
    root.querySelectorAll(".cancel-result, .gather-eq, .neg-link-eq, .neg-drag-seat").forEach(function (r) {
      r.classList.remove("show", "indicated", "linked");
    });
    root.querySelectorAll(".stage-pane").forEach(function (p) {
      p.classList.remove("is-active", "is-kept", "peel-arrive", "is-measure", "is-peel-seat", "is-measure-hide", "fade-out-step", "fade-in-step");
      p.style.opacity = "";
    });
    root.querySelectorAll(".work-fixed-frame.is-multi").forEach(function (f) {
      f.classList.remove("is-multi");
    });
    clearSourceMarks();
    clearAllExpandFrames(root);
    purgeGhosts();
  }

  /**
   * TransformFromCopy: frame stays on Example only → clone flies (no frame) → land.
   */
  function flyFromTo(fromEl, toEl, delay) {
    if (!fromEl || !toEl) {
      if (toEl) {
        toEl.classList.remove("fly-wait");
        toEl.classList.add("fly-land");
      }
      return;
    }
    toEl.classList.add("fly-wait");
    toEl.classList.remove("fly-land");
    later(function () {
      /* Yellow frame only on the Example source — never on the flying clone */
      setExpandFrame(fromEl, true);
      var fromFs = window.getComputedStyle(fromEl).fontSize;
      toEl.style.fontSize = fromFs;
      var from = fromEl.getBoundingClientRect();
      if (!from.width) {
        toEl.classList.remove("fly-wait");
        toEl.classList.add("fly-land");
        setExpandFrame(fromEl, false);
        return;
      }
      var ghost = fromEl.cloneNode(true);
      ghost.classList.remove("expand-framed", "is-source", "is-spent", "fly-wait", "fly-land");
      ghost.querySelectorAll(".expand-framed").forEach(function (el) {
        el.classList.remove("expand-framed");
      });
      ghost.classList.add("fly-ghost", "flying");
      if (fromEl.querySelector(".mini-frac") || fromEl.classList.contains("mini-frac")) {
        ghost.classList.add("fly-ghost-frac");
      }
      /* Auto size — fixed width/height was cracking (a/b) into two lines */
      ghost.style.left = from.left + "px";
      ghost.style.top = from.top + "px";
      ghost.style.width = "auto";
      ghost.style.height = "auto";
      ghost.style.maxWidth = "none";
      ghost.style.fontSize = scaledFontPx(fromFs);
      ghost.style.lineHeight = "1.15";
      ghost.style.whiteSpace = "nowrap";
      ghost.style.display = "inline-flex";
      ghost.style.flexDirection = "row";
      ghost.style.alignItems = "center";
      ghost.style.transform = "translate(0,0) scale(1)";
      ghost.style.transformOrigin = "left top";
      document.body.appendChild(ghost);
      ghost.style.left = from.left + "px";
      ghost.style.top = from.top + "px";
      var to2 = toEl.getBoundingClientRect();
      var dx = to2.left - from.left;
      var dy = to2.top - from.top;
      raf(function () {
        raf(function () {
          ghost.style.transform = "translate(" + dx + "px, " + dy + "px) scale(1)";
        });
      });
      later(function () {
        toEl.classList.remove("fly-wait");
        toEl.classList.add("fly-land");
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        setExpandFrame(fromEl, false);
      }, FLY_MS);
    }, delay || 0);
  }

  function runFlyIns(root) {
    if (!root) return;
    var nodes = root.querySelectorAll("[data-fly-from]");
    Array.prototype.forEach.call(nodes, function (toEl, i) {
      var sel = toEl.getAttribute("data-fly-from");
      if (!sel) return;
      /* Frame briefly while copying — do NOT permanently dim the example term */
      flyFromTo(document.querySelector(sel), toEl, i * 40);
    });
  }

  function paneIndex(pane) {
    var frame = pane.parentElement;
    if (!frame) return 0;
    return Array.prototype.indexOf.call(frame.querySelectorAll(".stage-pane"), pane);
  }

  function isStackFrame(frame) {
    return !!(frame && frame.getAttribute("data-stack") === "1");
  }

  /** One visible pane → absolute center seat (no y-pop). Two+ → stacked 上下. */
  function syncStackMode(frame) {
    if (!frame || !isStackFrame(frame)) return;
    var shown = frame.querySelectorAll(
      ".stage-pane.visible.is-active, .stage-pane.visible.is-kept"
    );
    if (shown.length >= 2) frame.classList.add("is-multi");
    else frame.classList.remove("is-multi");
  }

  function activatePane(pane, opts) {
    opts = opts || {};
    var frame = pane && pane.parentElement;
    if (!frame) return;
    var stack = isStackFrame(frame);
    frame.querySelectorAll(".stage-pane").forEach(function (p) {
      p.classList.remove("peel-arrive", "is-measure", "is-peel-seat", "is-measure-hide", "fade-out-step", "fade-in-step");
      if (!stack) {
        p.classList.remove("is-active", "is-kept");
      } else if (p !== pane && p.classList.contains("visible")) {
        if (p.getAttribute("data-replace") === "1") {
          p.classList.remove("is-kept", "is-active");
        } else {
          p.classList.add("is-kept");
          p.classList.remove("is-active");
        }
      }
    });
    pane.classList.add("is-active");
    pane.classList.remove("is-kept");
    if (opts.peel) pane.classList.add("peel-arrive");
    if (opts.fadeIn) pane.classList.add("fade-in-step");
    syncStackMode(frame);
    frameExampleSrc(pane);
    renderMath(pane);
    var flyNodes = pane.querySelectorAll("[data-fly-from]");
    if (flyNodes.length && !opts.skipFly) {
      Array.prototype.forEach.call(flyNodes, function (toEl, i) {
        var sel = toEl.getAttribute("data-fly-from");
        if (!sel) return;
        flyFromTo(document.querySelector(sel), toEl, i * 50);
      });
    }
  }

  /** Fade-out previous pane, fade-in next (no peel power). */
  function crossfadePanes(fromPane, toPane, done) {
    anim.busy = true;
    var stack = isStackFrame(toPane && toPane.parentElement);
    if (stack) {
      if (fromPane) {
        fromPane.classList.remove("is-active");
        if (fromPane.getAttribute("data-replace") !== "1") {
          fromPane.classList.add("is-kept");
        }
      }
      activatePane(toPane, { fadeIn: true });
      later(function () {
        toPane.classList.remove("fade-in-step");
        anim.busy = false;
        anim.finish = null;
        if (done) done();
      }, 380);
      anim.finish = function () {
        activatePane(toPane, { skipFly: true });
        anim.busy = false;
        anim.finish = null;
        if (done) done();
      };
      return;
    }
    if (fromPane) {
      fromPane.classList.add("is-active", "fade-out-step");
    }
    later(function () {
      if (fromPane) fromPane.classList.remove("is-active", "fade-out-step");
      activatePane(toPane, { fadeIn: true });
      later(function () {
        toPane.classList.remove("fade-in-step");
        anim.busy = false;
        anim.finish = null;
        if (done) done();
      }, 380);
    }, 320);
    anim.finish = function () {
      if (fromPane) fromPane.classList.remove("is-active", "fade-out-step");
      activatePane(toPane, { skipFly: true });
      anim.busy = false;
      anim.finish = null;
      if (done) done();
    };
  }

  function peelBetween(fromPane, toPane, done) {
    if (!fromPane || !toPane) {
      activatePane(toPane);
      if (done) done();
      return;
    }
    if (!fromPane.getAttribute || fromPane.getAttribute("data-peel-live") !== "1") {
      frameExampleSrc(fromPane);
    }

    var pow = fromPane._peelPow || null;
    if (!pow) {
      pow = fromPane.querySelector("sup.pow.outer");
    }
    if (!pow) {
      var pows = fromPane.querySelectorAll("sup.pow");
      pow = pows.length ? pows[pows.length - 1] : null;
    }
    if (!pow) {
      crossfadePanes(fromPane, toPane, done);
      return;
    }

    var stack = isStackFrame(fromPane.parentElement);
    var fromR = pow.getBoundingClientRect();

    /*
     * Final layout from the first frame — no measure/overlay thrash (that was
     * popping the whole expression and parking × on the next factor).
     * Real .peel-times stays visible in its CSS seat; only the power flies.
     */
    fromPane.classList.remove("is-active", "is-peel-seat", "is-measure", "is-measure-hide");
    if (stack && fromPane.getAttribute("data-replace") !== "1") {
      fromPane.classList.add("is-kept");
    }
    activatePane(toPane, { peel: true, skipFly: true });
    void toPane.offsetWidth;

    var timesEl = toPane.querySelector(".token.peel-times, .peel-times");
    var rightFactor = toPane.querySelector(".token.next-factor, .token.peel-target");
    if (!rightFactor) {
      var toks = toPane.querySelectorAll(".token:not(.op)");
      rightFactor = toks.length >= 2 ? toks[1] : toks[0];
    }

    /* Only hide the NEW factor the power is becoming — keep leading a / (ab) visible */
    if (rightFactor) {
      rightFactor.classList.add("peel-factor-wait");
    }
    if (timesEl) {
      timesEl.classList.remove("is-peel-pending");
      timesEl.classList.add("peel-times-live");
    }
    void toPane.offsetWidth;

    function baseBox(tok) {
      if (!tok) return null;
      var letter = tok.querySelector(".sym-a, .sym-a2, .sym-b, .sym-y") || tok;
      return letter.getBoundingClientRect();
    }
    var rightBox = baseBox(rightFactor) || (rightFactor ? rightFactor.getBoundingClientRect() : null);

    var landX = rightBox ? rightBox.left + rightBox.width / 2 : fromR.left + 80;
    var landY = rightBox ? rightBox.top + rightBox.height / 2 : fromR.top + fromR.height / 2;

    var startX = fromR.left + fromR.width / 2;
    var startY = fromR.top + fromR.height / 2;
    var lift = Math.max(10, Math.abs(landX - startX) * 0.1);

    var cs = window.getComputedStyle(pow);
    var ghost = document.createElement("span");
    ghost.className = "peel-ghost";
    ghost.textContent = pow.textContent;
    ghost.style.left = fromR.left + "px";
    ghost.style.top = fromR.top + "px";
    ghost.style.fontSize = scaledFontPx(cs.fontSize);
    ghost.style.lineHeight = "1";
    ghost.style.fontFamily = cs.fontFamily;
    ghost.style.color = cs.color;
    ghost.style.fontWeight = cs.fontWeight;
    ghost.style.transform = "translate(0,0) scale(1)";
    document.body.appendChild(ghost);
    pow.style.opacity = "0";

    var peelToken = playToken;
    var finished = false;
    function cleanup(skip) {
      if (finished) return;
      finished = true;
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (rightFactor) rightFactor.classList.remove("peel-factor-wait");
      if (timesEl) timesEl.classList.remove("peel-times-live", "is-peel-pending");
      fromPane.classList.remove("is-active", "is-peel-seat", "is-measure-hide");
      if (stack && fromPane.getAttribute("data-replace") !== "1") {
        fromPane.classList.add("is-kept");
      } else {
        fromPane.classList.remove("is-kept");
      }
      if (fromPane.getAttribute && fromPane.getAttribute("data-peel-live") === "1") {
        fromPane.classList.remove("is-kept");
      }
      pow.style.opacity = "";
      toPane.classList.remove("peel-arrive");
      syncStackMode(toPane.parentElement);
      anim.busy = false;
      anim.finish = null;
      if (done) done();
    }

    anim.busy = true;
    anim.finish = function () { cleanup(true); };

    var t0 = null;
    var FADE_TAIL = 0.16;
    function frame(now) {
      if (playToken !== peelToken || finished) return;
      if (anim.skip) { cleanup(true); return; }
      if (t0 == null) t0 = now;
      var p = Math.min(1, (now - t0) / PEEL_MS);
      var ease = 1 - Math.pow(1 - Math.min(1, p / (1 - FADE_TAIL * 0.35)), 2.4);
      var x = (landX - startX) * ease;
      var y = (landY - startY) * ease - Math.sin(Math.PI * ease) * lift;
      var opacity = 1;
      if (p > 1 - FADE_TAIL) {
        opacity = Math.max(0, 1 - (p - (1 - FADE_TAIL)) / FADE_TAIL);
      }
      ghost.style.opacity = String(opacity);
      ghost.style.transform = "translate(" + x + "px, " + y + "px) scale(1)";
      if (p < 1) raf(frame);
      else cleanup(false);
    }
    raf(frame);
  }

  /** One Manim next_slide: show this stage-pane (peel from previous if needed) */
  function runStageStep(pane) {
    if (!pane) return;
    clearAutoTimers();
    purgeGhosts();
    var frame = pane.parentElement;
    var panes = frame ? frame.querySelectorAll(".stage-pane") : [];
    var idx = paneIndex(pane);
    var prev = idx > 0 ? panes[idx - 1] : null;

    var peelFromSel = pane.getAttribute("data-peel-from");
    if (peelFromSel && pane.querySelector(".peel-times, .next-factor, .peel-target")) {
      var fromSrc = document.querySelector(peelFromSel);
      if (fromSrc) {
        peelFromSource(fromSrc, pane, function () { /* wait */ });
        return;
      }
    }

    if (prev && prev.querySelector(".pow") && pane.querySelector(".peel-times, .next-factor, .peel-target")) {
      prev.classList.add("is-active");
      peelBetween(prev, pane, function () { /* stop — wait for next click */ });
      return;
    }
    if (prev && prev.classList.contains("visible") && !pane.querySelector("[data-fly-from]")) {
      crossfadePanes(prev, pane, function () {});
      return;
    }
    if (pane.getAttribute("data-gather") === "1") {
      activatePane(pane);
      runGatherOnce(pane);
      return;
    }
    activatePane(pane);
  }

  /**
   * Peel outer power from an Example-row .src into a work pane
   * (no intermediate (ab)^2 work step). Geometry starts at the real source.
   */
  function peelFromSource(fromSrc, toPane, done) {
    if (!fromSrc || !toPane) {
      activatePane(toPane);
      if (done) done();
      return;
    }
    clearAllExpandFrames();
    setExpandFrame(fromSrc, true);

    var pow = fromSrc.querySelector("sup.pow.outer");
    if (!pow) {
      var pows = fromSrc.querySelectorAll("sup.pow");
      pow = pows.length ? pows[pows.length - 1] : null;
    }
    if (!pow) {
      setExpandFrame(fromSrc, false);
      activatePane(toPane);
      if (done) done();
      return;
    }

    var host = document.createElement("div");
    host.className = "stage-pane is-active";
    host.setAttribute("data-peel-live", "1");
    host._peelPow = pow;
    host.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(host);

    peelBetween(host, toPane, function () {
      if (host.parentNode) host.parentNode.removeChild(host);
      setExpandFrame(fromSrc, false);
      pow.style.opacity = "";
      if (done) done();
    });
  }

  function runGatherOnce(pane) {
    var list = Array.prototype.slice.call(pane.querySelectorAll(".token.factor"));
    if (list.length < 3) return;
    anim.busy = true;
    list[0].classList.add("gather-right");
    list[list.length - 1].classList.add("gather-left");
    function end() {
      list.forEach(function (t) {
        t.classList.remove("gather-left", "gather-right", "gather-mid");
      });
      anim.busy = false;
      anim.finish = null;
    }
    anim.finish = end;
    later(end, 640);
  }

  function runFracPhase(root) {
    var build = root.closest(".frac-build") || root;
    var phase = root.getAttribute("data-phase");
    var frac = build.querySelector(".frac-stack");
    if (!frac || !phase) return;
    if (phase === "bar" || phase === "compact") {
      frac.classList.add("phase-bar", "phase-compact");
      /* Fly every compact term (numerator AND denominator) — do not dim sources */
      runFlyIns(frac);
      return;
    }
    if (phase === "num" || phase === "expand") {
      anim.busy = true;
      var compactEls = frac.querySelectorAll(".compact-view");
      compactEls.forEach(function (el) { el.style.opacity = "0"; });
      later(function () {
        frac.classList.remove("phase-compact");
        frac.classList.add("phase-bar", "phase-num", "phase-expand", "phase-den");
        compactEls.forEach(function (el) { el.style.opacity = ""; });
        var expandViews = frac.querySelectorAll(".expand-view");
        expandViews.forEach(function (ev) {
          ev.style.opacity = "0";
        });
        raf(function () {
          raf(function () {
            expandViews.forEach(function (ev) {
              ev.style.transition = "opacity 0.4s ease";
              ev.style.opacity = "1";
            });
          });
        });
        later(function () {
          expandViews.forEach(function (ev) {
            ev.style.transition = "";
            ev.style.opacity = "";
          });
          anim.busy = false;
          anim.finish = null;
        }, 420);
      }, 280);
      anim.finish = function () {
        frac.classList.remove("phase-compact");
        frac.classList.add("phase-bar", "phase-num", "phase-expand", "phase-den");
        compactEls.forEach(function (el) { el.style.opacity = ""; });
        anim.busy = false;
        anim.finish = null;
      };
      return;
    }
    if (phase === "den") {
      frac.classList.add("phase-den");
      var denHost = frac.querySelector(".den .expand-view") || frac.querySelector(".den");
      runFlyIns(denHost);
      return;
    }
    if (phase === "cancel") {
      var cap = build.querySelector(".cancel-caption");
      if (cap) cap.classList.add("show");
      runCancelOnly(frac);
      return;
    }
    if (phase === "result") {
      var cap2 = build.querySelector(".cancel-caption");
      if (cap2) cap2.classList.remove("show");
      runGatherToResult(frac);
    }
  }

  function runCancelOnly(frac) {
    anim.busy = true;
    var numCancels = frac.querySelectorAll(".num .token.cancelable, .num .expand-view .token.cancelable");
    var denCancels = frac.querySelectorAll(".den .token.cancelable, .den .expand-view .token.cancelable");
    if (!numCancels.length) numCancels = frac.querySelectorAll(".num .token.cancelable");
    if (!denCancels.length) denCancels = frac.querySelectorAll(".den .token.cancelable");
    var pairs = Math.min(numCancels.length, denCancels.length);
    var steps = [];
    var i;
    for (i = 0; i < pairs; i++) {
      steps.push(numCancels[i]);
      steps.push(denCancels[i]);
    }
    var step = 0;
    function finishAll() {
      while (step < steps.length) {
        if (steps[step]) steps[step].classList.add("struck");
        step += 1;
      }
      frac.classList.add("cancelled", "cancel-done");
      frac.querySelectorAll(".token.remain").forEach(function (t) {
        t.classList.add("is-remaining");
      });
      anim.busy = false;
      anim.finish = null;
    }
    anim.finish = finishAll;
    function next() {
      if (anim.skip) { finishAll(); return; }
      if (step >= steps.length) { finishAll(); return; }
      if (steps[step]) {
        indicate(steps[step]);
        steps[step].classList.add("struck");
      }
      step += 1;
      later(next, CANCEL_MS);
    }
    later(next, 160);
  }

  function runGatherToResult(frac) {
    anim.busy = true;
    frac.classList.add("gathering");
    /* Collect remain tokens + the × ops between consecutive remains */
    var numKids = Array.prototype.slice.call(
      (frac.querySelector(".num .expand-view") || frac.querySelector(".num") || frac).children
    );
    var denKids = Array.prototype.slice.call(
      (frac.querySelector(".den .expand-view") || frac.querySelector(".den") || frac).children
    );
    var remGroup = [];
    function collectRem(kids) {
      var i;
      for (i = 0; i < kids.length; i++) {
        if (kids[i].classList && kids[i].classList.contains("remain")) {
          remGroup.push(kids[i]);
          kids[i].classList.add("is-remaining");
          if (i + 1 < kids.length && kids[i + 1].classList.contains("op") &&
              i + 2 < kids.length && kids[i + 2].classList.contains("remain")) {
            remGroup.push(kids[i + 1]);
            kids[i + 1].classList.add("is-remaining");
          }
        }
      }
    }
    collectRem(numKids);
    collectRem(denKids);
    if (!remGroup.length) {
      frac.querySelectorAll(".token.remain").forEach(function (t) {
        remGroup.push(t);
        t.classList.add("is-remaining");
      });
    }

    var side = frac.querySelector(".gather-side");
    var eq = frac.querySelector(".gather-eq");
    var result = frac.querySelector(".cancel-result");
    if (eq) eq.classList.add("show");

    var target = result || side || eq;
    var targetR = target ? target.getBoundingClientRect() : null;
    var ghosts = [];
    var groupLeft = Infinity;
    var groupTop = Infinity;
    remGroup.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.left < groupLeft) groupLeft = r.left;
      if (r.top < groupTop) groupTop = r.top;
    });

    remGroup.forEach(function (t, i) {
      if (!targetR) return;
      var r = t.getBoundingClientRect();
      var g = t.cloneNode(true);
      g.classList.add("fly-ghost", "flying");
      g.style.left = r.left + "px";
      g.style.top = r.top + "px";
      g.style.width = r.width + "px";
      g.style.height = r.height + "px";
      document.body.appendChild(g);
      ghosts.push(g);
      t.style.opacity = "0";
      /* Converge toward result seat, keeping relative spacing then morph */
      var dx = targetR.left + 8 + i * 14 - r.left;
      var dy = targetR.top + 4 - r.top;
      raf(function () {
        raf(function () {
          g.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.88)";
          g.style.opacity = "0.55";
        });
      });
    });

    function end() {
      ghosts.forEach(function (g) {
        if (g.parentNode) g.parentNode.removeChild(g);
      });
      frac.classList.add("gathered");
      if (result) {
        result.classList.add("show", "morph-in");
        renderMath(result);
      }
      remGroup.forEach(function (t) {
        t.classList.remove("gather-left", "gather-right", "gather-mid");
        t.style.opacity = "";
      });
      anim.busy = false;
      anim.finish = null;
    }
    anim.finish = end;
    later(end, 780);
  }

  /** Negative indices: frame BOTH columns together, then drag into linked equation. */
  function runNegLink(frag) {
    var slide = frag.closest("section") || document;
    var leftSrc = slide.querySelector(".neg-left-result");
    var rightSrc = slide.querySelector(".neg-right-result");
    var seat = slide.querySelector(".neg-link-eq");
    if (!seat) return;
    anim.busy = true;
    clearAllExpandFrames(slide);
    if (leftSrc) setExpandFrame(leftSrc, true);
    if (rightSrc) setExpandFrame(rightSrc, true);
    later(function () {
      setExpandFrame(leftSrc, false);
      setExpandFrame(rightSrc, false);
      seat.classList.add("show");
      renderMath(seat);
      var leftSeat = seat.querySelector(".neg-drag-left");
      var rightSeat = seat.querySelector(".neg-drag-right");
      /* Same-size clones: match seat font before fly */
      if (leftSrc && leftSeat) {
        leftSeat.style.fontSize = window.getComputedStyle(leftSrc).fontSize;
        flyFromTo(leftSrc, leftSeat, 0);
      }
      if (rightSrc && rightSeat) {
        rightSeat.style.fontSize = window.getComputedStyle(rightSrc).fontSize;
        flyFromTo(rightSrc, rightSeat, 0);
      }
      later(function () {
        seat.classList.add("linked");
        anim.busy = false;
        anim.finish = null;
      }, FLY_MS + 80);
    }, 480);
    anim.finish = function () {
      setExpandFrame(leftSrc, false);
      setExpandFrame(rightSrc, false);
      seat.classList.add("show", "linked");
      renderMath(seat);
      anim.busy = false;
      anim.finish = null;
    };
  }

  /** Re-apply visual state from currently-visible fragments (slide return). */
  function rebuildFromVisible(slide) {
    if (!slide) return;
    slide.querySelectorAll(".work-fixed-frame").forEach(function (frame) {
      var stack = isStackFrame(frame);
      var panes = Array.prototype.slice.call(frame.querySelectorAll(".stage-pane.visible"));
      frame.querySelectorAll(".stage-pane").forEach(function (p) {
        p.classList.remove("is-active", "is-kept", "peel-arrive", "is-measure");
      });
      if (!panes.length) return;
      if (stack) {
        panes.forEach(function (p, i) {
          if (i < panes.length - 1) {
            if (p.getAttribute("data-replace") === "1") {
              p.classList.remove("is-kept", "is-active");
            } else {
              p.classList.add("is-kept");
            }
          } else {
            p.classList.add("is-active");
          }
          p.querySelectorAll(".token, .fly-wait").forEach(function (t) {
            t.classList.remove("fly-wait");
            t.classList.add("fly-land");
            t.style.opacity = "";
          });
        });
      } else {
        var last = panes[panes.length - 1];
        last.classList.add("is-active");
        last.querySelectorAll(".token").forEach(function (t) {
          t.classList.remove("fly-wait");
          t.classList.add("fly-land");
          t.style.opacity = "";
        });
      }
    });

    slide.querySelectorAll(".frac-build").forEach(function (build) {
      var frac = build.querySelector(".frac-stack");
      if (!frac) return;
      var phases = Array.prototype.slice.call(build.querySelectorAll(".frac-phase.visible"));
      frac.classList.remove(
        "phase-bar", "phase-compact", "phase-num", "phase-expand", "phase-den",
        "phase-cancel", "phase-result", "cancelled", "cancel-done", "gathering", "gathered"
      );
      frac.querySelectorAll(".cancel-result, .gather-eq").forEach(function (el) {
        el.classList.remove("show", "morph-in");
      });
      var cap = build.querySelector(".cancel-caption");
      if (cap) cap.classList.remove("show");
      if (!phases.length) return;
      var applied = {};
      phases.forEach(function (ph) {
        var phase = ph.getAttribute("data-phase");
        if (!phase) return;
        applied[phase] = true;
      });
      if (applied.compact || applied.bar) frac.classList.add("phase-bar", "phase-compact");
      if (applied.expand || applied.num) {
        frac.classList.remove("phase-compact");
        frac.classList.add("phase-bar", "phase-num", "phase-expand", "phase-den");
      }
      if (applied.cancel) {
        frac.classList.add("cancelled", "cancel-done", "phase-cancel");
        frac.querySelectorAll(".token.cancelable").forEach(function (t) {
          t.classList.add("struck");
        });
        frac.querySelectorAll(".token.remain").forEach(function (t) {
          t.classList.add("is-remaining");
        });
        if (cap) cap.classList.add("show");
      }
      if (applied.result) {
        frac.classList.add("gathered", "phase-result");
        frac.querySelectorAll(".cancel-result, .gather-eq").forEach(function (el) {
          el.classList.add("show");
        });
      }
      frac.querySelectorAll("[data-fly-from]").forEach(function (t) {
        t.classList.remove("fly-wait");
        t.classList.add("fly-land");
      });
    });

    var negStep = slide.querySelector(".neg-link-step.visible");
    var seat = slide.querySelector(".neg-link-eq");
    if (seat) {
      if (negStep) {
        seat.classList.add("show", "linked");
        seat.querySelectorAll(".fly-wait").forEach(function (t) {
          t.classList.remove("fly-wait");
          t.classList.add("fly-land");
        });
        renderMath(seat);
      } else {
        seat.classList.remove("show", "linked");
      }
    }

    slide.querySelectorAll(".sci-jump").forEach(function (host) {
      var eqs = Array.prototype.slice.call(host.querySelectorAll(".sci-jump-eq.visible"));
      host.querySelectorAll(".sci-jump-eq").forEach(function (el) {
        el.classList.remove("is-on");
      });
      if (eqs.length) eqs[eqs.length - 1].classList.add("is-on");
    });

    clearAllExpandFrames(slide);
    clearSourceMarks();
    renderMath(slide);
  }

  /** One decimal-jump step — pendulum lower semicircle; direction from dx (left +n / right −n) */
  function runSciStep(eq) {
    if (!eq) return;
    var host = eq.parentElement;
    if (!host) return;
    var eqs = host.querySelectorAll(".sci-jump-eq");
    var idx = Array.prototype.indexOf.call(eqs, eq);
    var prev = idx > 0 ? eqs[idx - 1] : null;
    eqs.forEach(function (el) { el.classList.remove("is-on"); });
    if (prev) prev.classList.add("is-on");

    function show() {
      eqs.forEach(function (el) { el.classList.remove("is-on"); });
      eq.classList.add("is-on");
      anim.busy = false;
      anim.finish = null;
    }

    if (!prev) {
      eq.classList.add("is-on");
      return;
    }

    var dp = prev.querySelector(".dp-live");
    var dpTo = eq.querySelector(".dp-live");
    if (!dp || !dpTo) {
      show();
      return;
    }

    anim.busy = true;
    anim.finish = show;
    indicate(dp);
    var fr = dp.getBoundingClientRect();
    var tr = dpTo.getBoundingClientRect();
    var ghost = document.createElement("span");
    ghost.className = "dp-ghost";
    ghost.textContent = ".";
    ghost.style.left = fr.left + "px";
    ghost.style.top = fr.top + "px";
    document.body.appendChild(ghost);
    dp.style.opacity = "0";
    var dx = tr.left - fr.left;
    var dy = tr.top - fr.top;
    /* Lower semicircle (pendulum): parametric x linear, y dips below baseline */
    var radius = Math.max(36, Math.abs(dx) * 0.55);
    var t0 = null;
    var token = playToken;
    function frame(now) {
      if (token !== playToken) {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        return;
      }
      if (anim.skip) {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        dp.style.opacity = "";
        show();
        return;
      }
      if (t0 == null) t0 = now;
      var p = Math.min(1, (now - t0) / JUMP_MS);
      var ease = 1 - Math.pow(1 - p, 2.2);
      /* θ from π → 0 (left jump) or 0 → π mapped onto lower half via sin */
      var arcY = Math.sin(Math.PI * ease) * radius;
      ghost.style.transform =
        "translate(" + (dx * ease) + "px, " + (dy * ease + arcY) + "px)";
      if (p < 1) raf(frame);
      else {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
        dp.style.opacity = "";
        show();
      }
    }
    raf(frame);
  }

  /** One PV pair (one next_slide) */
  function runPvStep(term) {
    if (!term) return;
    var root = term.closest(".pv-stack") || term.parentElement;
    var i = parseInt(term.getAttribute("data-pv-i"), 10);
    if (isNaN(i)) {
      var terms = root.querySelectorAll(".expand-term");
      i = Array.prototype.indexOf.call(terms, term);
    }
    var cells = root.querySelectorAll('[data-pv-pair="' + i + '"]');
    if (!cells.length) {
      term.classList.add("landed");
      return;
    }
    var digit = cells[0];
    var place = cells[1] || cells[0];
    digit.classList.add("framed");
    place.classList.add("framed");
    anim.busy = true;

    function finish() {
      digit.classList.remove("framed");
      place.classList.remove("framed");
      digit.classList.add("dragged");
      place.classList.add("dragged");
      term.classList.remove("awaiting", "combining");
      term.classList.add("landed");
      document.querySelectorAll(".pv-drag-box").forEach(function (b) {
        if (b.parentNode) b.parentNode.removeChild(b);
      });
      anim.busy = false;
      anim.finish = null;
    }
    anim.finish = finish;

    later(function () {
      if (anim.skip) { finish(); return; }
      term.classList.add("awaiting");
      var dR = digit.getBoundingClientRect();
      var pR = place.getBoundingClientRect();
      var tR = term.getBoundingClientRect();
      function makeBox(rect, html) {
        var box = document.createElement("div");
        box.className = "pv-drag-box";
        box.innerHTML = html;
        box.style.left = rect.left + "px";
        box.style.top = rect.top + "px";
        box.style.width = rect.width + "px";
        box.style.height = rect.height + "px";
        document.body.appendChild(box);
        return box;
      }
      var boxD = makeBox(dR, digit.innerHTML);
      var boxP = makeBox(pR, place.innerHTML);
      raf(function () {
        raf(function () {
          boxD.style.transform = "translate(" + (tR.left - dR.left) + "px, " + (tR.top - dR.top) + "px)";
          boxP.style.transform = "translate(" + (tR.left - pR.left) + "px, " + (tR.top - pR.top + 8) + "px)";
        });
      });
      later(function () {
        if (anim.skip) { finish(); return; }
        term.classList.add("combining");
        boxP.style.transform =
          "translate(" + (tR.left - pR.left + dR.width * 0.85) + "px, " + (tR.top - pR.top) + "px)";
        boxD.classList.add("fade-frame");
        boxP.classList.add("fade-frame");
        later(finish, 450);
      }, FLY_MS);
    }, 280);
  }

  function runConvStep(row) {
    anim.busy = true;
    row.classList.add("rhs-in");
    var extra = row.querySelector(".conv-extra");
    var nextRow = row.nextElementSibling;
    while (nextRow && !nextRow.classList.contains("conv-row")) {
      nextRow = nextRow.nextElementSibling;
    }
    function end() {
      if (extra) {
        extra.classList.add("spent");
        if (nextRow) {
          var subj = nextRow.querySelector(".conv-subj");
          if (subj) flyFromTo(extra, subj, 0);
          nextRow.classList.add("recv-extra");
        }
      }
      anim.busy = false;
      anim.finish = null;
    }
    anim.finish = end;
    if (extra) {
      later(function () {
        extra.classList.add("dragging");
        later(end, 520);
      }, 400);
    } else {
      later(end, 280);
    }
  }

  function trySkipAnim() {
    if (!anim.busy) return false;
    anim.skip = true;
    if (typeof anim.finish === "function") anim.finish();
    return true;
  }

  function onFragmentShown(ev) {
    try {
      var frag = ev && ev.fragment;
      if (!frag) return;

      if (frag.classList.contains("stage-pane")) {
        runStageStep(frag);
        return;
      }
      if (frag.classList.contains("frac-phase") || frag.getAttribute("data-phase")) {
        runFracPhase(frag);
        return;
      }
      if (frag.classList.contains("neg-link-step")) {
        runNegLink(frag);
        return;
      }
      if (frag.classList.contains("sci-jump-eq")) {
        runSciStep(frag);
        return;
      }
      if (frag.classList.contains("expand-term") || frag.classList.contains("pv-step")) {
        runPvStep(frag);
        return;
      }
      if (frag.classList.contains("conv-row")) {
        runConvStep(frag);
        return;
      }
      clearSourceMarks();
      runFlyIns(frag);
    } catch (err) { /* */ }
  }

  function onFragmentHidden(ev) {
    clearAutoTimers();
    purgeGhosts();
    var frag = ev && ev.fragment;
    if (!frag) return;

    if (frag.classList.contains("stage-pane")) {
      frag.classList.remove("is-active", "is-kept", "peel-arrive", "fade-out-step", "fade-in-step");
      frag.querySelectorAll(".token").forEach(function (t) {
        t.classList.remove("fly-wait", "fly-land");
        t.style.opacity = "";
      });
      frag.querySelectorAll("sup.pow").forEach(function (p) { p.style.opacity = ""; });
      clearAllExpandFrames();
      var frame = frag.parentElement;
      if (frame) {
        var panes = Array.prototype.slice.call(frame.querySelectorAll(".stage-pane.visible"));
        frame.querySelectorAll(".stage-pane").forEach(function (p) {
          p.classList.remove("is-active", "is-kept");
        });
        if (isStackFrame(frame)) {
          panes.forEach(function (p, i) {
            if (i < panes.length - 1) p.classList.add("is-kept");
            else p.classList.add("is-active");
            p.querySelectorAll(".token").forEach(function (t) {
              t.classList.remove("fly-wait");
              t.style.opacity = "";
            });
            p.querySelectorAll("sup.pow").forEach(function (pw) { pw.style.opacity = ""; });
          });
          if (panes.length) frameExampleSrc(panes[panes.length - 1]);
        } else {
          var last = panes[panes.length - 1];
          if (last && last !== frag) {
            last.classList.add("is-active");
            last.querySelectorAll(".token").forEach(function (t) {
              t.classList.remove("fly-wait");
              t.style.opacity = "";
            });
            last.querySelectorAll("sup.pow").forEach(function (p) { p.style.opacity = ""; });
            frameExampleSrc(last);
            renderMath(last);
          }
        }
      }
      return;
    }

    if (frag.classList.contains("neg-link-step")) {
      var slide = frag.closest("section");
      if (slide) {
        var seat = slide.querySelector(".neg-link-eq");
        if (seat) seat.classList.remove("show", "linked");
        clearAllExpandFrames(slide);
      }
      return;
    }

    if (frag.classList.contains("frac-phase") || frag.getAttribute("data-phase")) {
      var build = frag.closest(".frac-build");
      var frac = build && build.querySelector(".frac-stack");
      if (!frac) return;
      var phase = frag.getAttribute("data-phase");
      var cap = build.querySelector(".cancel-caption");
      frac.querySelectorAll(".token").forEach(function (t) {
        t.style.opacity = "";
        t.classList.remove("fly-wait", "fly-land");
      });
      if (phase === "result") {
        frac.classList.remove("gathered", "gathering");
        frac.querySelectorAll(".cancel-result, .gather-eq").forEach(function (el) {
          el.classList.remove("show", "morph-in");
        });
        frac.querySelectorAll(".token.remain").forEach(function (t) {
          t.style.opacity = "";
          t.classList.add("is-remaining");
        });
      } else if (phase === "cancel") {
        frac.classList.remove("cancelled", "cancel-done");
        frac.querySelectorAll(".token").forEach(function (t) {
          t.classList.remove("struck", "is-remaining");
        });
        if (cap) cap.classList.remove("show");
      } else if (phase === "den") {
        frac.classList.remove("phase-den");
      } else if (phase === "num" || phase === "expand") {
        frac.classList.remove("phase-num", "phase-expand", "phase-den");
        frac.classList.add("phase-bar", "phase-compact");
      } else if (phase === "bar" || phase === "compact") {
        frac.classList.remove(
          "phase-bar", "phase-compact", "phase-num", "phase-expand", "phase-den",
          "cancelled", "cancel-done", "gathering", "gathered"
        );
        frac.querySelectorAll(".cancel-result, .gather-eq").forEach(function (el) {
          el.classList.remove("show", "morph-in");
        });
        frac.querySelectorAll(".token").forEach(function (t) {
          t.classList.remove("struck", "is-remaining");
          t.style.opacity = "";
        });
        if (cap) cap.classList.remove("show");
      }
      return;
    }

    if (frag.classList.contains("sci-jump-eq")) {
      var host = frag.parentElement;
      if (!host) return;
      var eqs = host.querySelectorAll(".sci-jump-eq");
      frag.classList.remove("is-on");
      var visible = [];
      eqs.forEach(function (el) {
        if (el.classList.contains("visible") && el !== frag) visible.push(el);
      });
      eqs.forEach(function (el) { el.classList.remove("is-on"); });
      if (visible.length) visible[visible.length - 1].classList.add("is-on");
    }
  }

  function playTitleEnter(slide) {
    if (!slide) return;
    var head = slide.querySelector(".m-head");
    if (!head) return;
    head.classList.remove("title-enter");
    void head.offsetWidth;
    head.classList.add("title-enter");
    later(function () { syncTitleBars(slide); }, 80);
    later(function () { syncTitleBars(slide); }, 420);
  }

  Reveal.initialize({
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 1.6,
    controls: false,
    progress: false,
    slideNumber: false,
    history: false,
    overview: false,
    keyboard: {
      27: null,       /* disable ESC overview */
      13: "next",
      32: "next",
      39: "next",
      37: "prev",
      8: "prev",       /* Backspace = go back one fragment */
      33: "prev",
      34: "next",
      38: null,
      40: null
    },
    touch: true,
    center: false,
    embedded: false,
    transition: "none",
    backgroundTransition: "none",
    fragments: true
  });

  function afterReady() {
    renderMath();
    syncTitleBars();
    try { Reveal.layout(); } catch (e) { /* */ }
    later(function () { syncTitleBars(); }, 80);
    playTitleEnter(Reveal.getCurrentSlide && Reveal.getCurrentSlide());

    if (Reveal.next) {
      var origNext = Reveal.next.bind(Reveal);
      Reveal.next = function () {
        if (trySkipAnim()) return;
        return origNext();
      };
    }
    if (Reveal.prev) {
      var origPrev = Reveal.prev.bind(Reveal);
      Reveal.prev = function () {
        clearAutoTimers();
        purgeGhosts();
        anim.busy = false;
        anim.skip = false;
        anim.finish = null;
        return origPrev();
      };
    }
  }

  if (Reveal.isReady && Reveal.isReady()) afterReady();
  else if (Reveal.on) Reveal.on("ready", afterReady);
  else setTimeout(afterReady, 60);

  if (Reveal.on) {
    Reveal.on("fragmentshown", onFragmentShown);
    Reveal.on("fragmenthidden", onFragmentHidden);
    Reveal.on("slidechanged", function (ev) {
      clearAutoTimers();
      purgeGhosts();
      if (ev && ev.previousSlide) restoreVisualState(ev.previousSlide);
      if (ev && ev.currentSlide) {
        restoreVisualState(ev.currentSlide);
        rebuildFromVisible(ev.currentSlide);
      }
      syncTitleBars();
      playTitleEnter(ev && ev.currentSlide);
    });
  }

  document.addEventListener("selectstart", function (e) { e.preventDefault(); });
  document.addEventListener("mousedown", function (e) {
    if (e.detail > 1) e.preventDefault();
  });
})();
