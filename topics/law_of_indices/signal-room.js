/* Signal Room scene: lighthouse buttons, transmit handle, notes, and storm weather. No puzzle logic yet. */
(function () {
  "use strict";

  var room = document.getElementById("sig-room");
  var canvas = document.getElementById("sig-rain");
  var scene = room && room.querySelector(".sig-scene");
  if (!room || !canvas || !scene) return;

  var ctx = canvas.getContext("2d");
  var lit = [false, false, false, false, false, false];
  var drops = [];
  var running = false;
  var raf = 0;
  var boltTimer = 0;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var viewW = 1;
  var viewH = 1;

  function each(selector, fn) {
    Array.prototype.forEach.call(room.querySelectorAll(selector), fn);
  }

  /* SVG controls have no native button behaviour, so Enter/Space must be wired by hand. */
  function onActivate(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      fn.call(el, event);
    });
  }

  function applyLight(i, on) {
    if (i < 0 || i > 5) return;
    lit[i] = !!on;
    var match = '[data-index="' + i + '"]';
    each(".sig-house" + match + ", .sig-blip" + match, function (el) {
      el.classList.toggle("is-on", lit[i]);
    });
    each(".sig-switch" + match, function (el) {
      el.classList.toggle("is-on", lit[i]);
      el.setAttribute("aria-pressed", lit[i] ? "true" : "false");
    });
  }

  function sceneVisible() {
    var panel = document.getElementById("panel-games");
    var game = document.getElementById("sig-game");
    if (!panel || panel.classList.contains("hidden") || panel.hidden) return false;
    if (!game || game.classList.contains("game-off")) return false;
    return true;
  }

  /* ---------- Rain ---------- */

  function seed() {
    var count = Math.max(50, Math.min(140, Math.round(viewW * viewH / 2600)));
    drops = [];
    for (var i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        z: 0.55 + Math.random() * 1.1,
        len: 10 + Math.random() * 16
      });
    }
  }

  function fit() {
    var rect = canvas.getBoundingClientRect();
    var sizeChanged = Math.abs(rect.width - viewW) > 1 || Math.abs(rect.height - viewH) > 1;
    viewW = Math.max(1, rect.width);
    viewH = Math.max(1, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!drops.length || sizeChanged) seed();
  }

  function draw() {
    ctx.clearRect(0, 0, viewW, viewH);
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.x -= 1.8 * d.z;
      d.y += 12 * d.z;
      if (d.y - d.len > viewH) {
        d.y = -Math.random() * 30;
        d.x = Math.random() * (viewW + 40);
      }
      if (d.x < -20) d.x += viewW + 40;
      ctx.strokeStyle = "rgba(205, 220, 232, " + (0.22 + d.z * 0.26) + ")";
      ctx.lineWidth = d.z > 1.2 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * 0.15, d.y - d.len);
      ctx.stroke();
    }
  }

  function loop() {
    if (!running) return;
    if (sceneVisible()) draw();
    raf = window.requestAnimationFrame(loop);
  }

  /* ---------- Lightning ---------- */

  var bolt = document.getElementById("sig-bolt");

  function strike(duration) {
    room.classList.add("is-lightning");
    window.setTimeout(function () { room.classList.remove("is-lightning"); }, duration);
  }

  function flash() {
    if (!sceneVisible()) return;
    if (bolt) bolt.setAttribute("transform", "translate(" + Math.round(Math.random() * 560 - 300) + " 0)");
    strike(90);
    if (Math.random() < 0.45) {
      window.setTimeout(function () { if (running) strike(70); }, 160);
    }
  }

  function armBolt() {
    if (!running || reduced) return;
    boltTimer = window.setTimeout(function () {
      flash();
      armBolt();
    }, 2600 + Math.random() * 4800);
  }

  function resume() {
    var startLoop = !running;
    running = true;
    fit();
    if (sceneVisible()) draw();
    if (!startLoop) return;
    if (!reduced) loop();
    armBolt();
  }

  function pause() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    if (boltTimer) window.clearTimeout(boltTimer);
    boltTimer = 0;
    room.classList.remove("is-lightning");
  }

  /* ---------- Lighthouse buttons ---------- */

  each(".sig-switch", function (button) {
    onActivate(button, function (event) {
      var index = +button.getAttribute("data-index");
      if (event.type === "keydown") {
        button.classList.add("is-pressing");
        window.setTimeout(function () { button.classList.remove("is-pressing"); }, 130);
      }
      applyLight(index, !lit[index]);
    });
  });

  /* ---------- Transmit throttle.
     The rods are hinged at fixed brackets (PIVOT) and the whole Π handle swings in the plane that
     points out of the console — seen from the side it sweeps a fan. tilt 0° = standing upright
     (idle); tilt 90° = pointing straight at the player; tilt 115° = hanging down past the hinge
     (send: red bar at the bottom, rods above it). We draw that swing in pseudo-3D: the grip's
     screen position is the projected lever tip, the rods are redrawn from the fixed feet to the
     grip (so they foreshorten), and the grip scales up slightly as it comes towards the viewer. ---------- */

  var lever = document.getElementById("sig-lever");
  var rodL = document.getElementById("sig-rod-l");
  var rodR = document.getElementById("sig-rod-r");
  var gripG = document.getElementById("sig-grip-g");
  var nuts = document.getElementById("sig-nuts");
  var PIVOT = { x: 1415, y: 622 }; /* hinge line (half-way along the slots), in viewBox units */
  var ARM = 120;                   /* hinge → grip centre */
  var ROD_DX = 30;                 /* rod centres sit ±30 from the middle */
  var ROD_HW = 7;                  /* rod half-width */
  var LEAN = 0.55;                 /* how far "towards you" reads as "down" on screen (camera is above the console) */
  var GROW = 0.22;                 /* grip scale gain when pointing at the viewer */
  var TILT_MAX = 115;
  var tilt = 0;
  var thrown = false;
  var drag = null;
  var skipClick = false;
  var tween = null;

  function gripOffset(deg) {
    var rad = deg * Math.PI / 180;
    /* up-the-panel component (cos) lifts the grip; out-of-panel component (sin) reads as "down" and "closer" */
    return { y: -ARM * Math.cos(rad) + ARM * LEAN * Math.sin(rad), s: 1 + GROW * Math.sin(rad) };
  }

  function poseLever(deg) {
    tilt = Math.max(0, Math.min(TILT_MAX, deg));
    var o = gripOffset(tilt);
    var gripY = PIVOT.y + o.y;
    var s = o.s;
    var below = gripY > PIVOT.y;              /* grip has swung past the hinge: rods now arrive from above */
    var endY = gripY + (below ? -18 : 18) * s; /* rod tops tuck under the grip on the hinge side */
    if (nuts) nuts.setAttribute("transform", below ? "scale(1 -1)" : "");
    var side, fx, bx, hw;
    for (side = -1; side <= 1; side += 2) {
      fx = PIVOT.x + side * ROD_DX;
      bx = PIVOT.x + side * ROD_DX * s;
      hw = ROD_HW * s;
      (side < 0 ? rodL : rodR).setAttribute("d",
        "M" + (fx - ROD_HW) + " " + PIVOT.y +
        " H" + (fx + ROD_HW) +
        " L" + (bx + hw) + " " + endY +
        " L" + (bx - hw) + " " + endY + " Z");
    }
    gripG.setAttribute("transform", "translate(" + PIVOT.x + " " + gripY + ") scale(" + s + ")");
  }

  function stopTween() {
    if (tween) window.cancelAnimationFrame(tween);
    tween = null;
  }

  function swingTo(target) {
    stopTween();
    var from = tilt;
    var dist = Math.abs(target - from);
    /* no frames arrive while the tab is hidden, so land on the stop straight away */
    if (reduced || dist < 0.5 || document.hidden) { poseLever(target); return; }
    var duration = 220 + 320 * (dist / TILT_MAX);
    var t0 = null;
    var step = function (now) {
      if (t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / duration);
      var e = 1 - Math.pow(1 - k, 3); /* ease-out: lands firmly on the stop */
      poseLever(from + (target - from) * e);
      tween = k < 1 ? window.requestAnimationFrame(step) : null;
    };
    tween = window.requestAnimationFrame(step);
  }

  function setThrown(on) {
    thrown = !!on;
    swingTo(thrown ? TILT_MAX : 0);
    lever.classList.toggle("is-thrown", thrown);
    lever.setAttribute("aria-pressed", thrown ? "true" : "false");
    lever.setAttribute("aria-label", thrown ? "Push transmit lever up" : "Pull transmit lever down");
    room.dispatchEvent(new CustomEvent("signalroom:lever", { detail: { down: thrown, lights: lit.slice() } }));
  }

  /* Pointer y in viewBox units. */
  function pointerY(event) {
    var pt = scene.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(scene.getScreenCTM().inverse()).y;
  }

  /* Screen travel of the grip from upright to fully down, used to turn drag distance into tilt. */
  var TRAVEL = gripOffset(TILT_MAX).y - gripOffset(0).y;

  if (lever && rodL && rodR && gripG) {
    poseLever(0);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && tween) {
        stopTween();
        poseLever(thrown ? TILT_MAX : 0);
      }
    });

    lever.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      stopTween();
      drag = { id: event.pointerId, y0: pointerY(event), from: tilt, moved: false };
      try { lever.setPointerCapture(event.pointerId); } catch (e) { /* synthetic or stale pointer */ }
      lever.classList.add("is-dragging");
    });

    lever.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dy = pointerY(event) - drag.y0;
      if (Math.abs(dy) > 4) drag.moved = true;
      poseLever(drag.from + dy / TRAVEL * TILT_MAX);
    });

    var endDrag = function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      lever.classList.remove("is-dragging");
      if (event.type === "pointercancel" || moved) {
        setThrown(tilt > TILT_MAX / 2);
      } else {
        setThrown(!thrown);
      }
      skipClick = event.type === "pointerup";
      window.setTimeout(function () { skipClick = false; }, 0);
    };

    lever.addEventListener("pointerup", endDrag);
    lever.addEventListener("pointercancel", endDrag);

    onActivate(lever, function () {
      if (skipClick) {
        skipClick = false;
        return;
      }
      setThrown(!thrown);
    });
  }

  /* ---------- Cipher note and full code sheet ---------- */

  var cipherNote = document.getElementById("sig-cipher-note");
  var noteModal = document.getElementById("sig-note-modal");
  var noteClose = document.getElementById("sig-note-close");

  function showCodeSheet(show) {
    if (!cipherNote || !noteModal) return;
    noteModal.hidden = !show;
    noteModal.setAttribute("aria-hidden", show ? "false" : "true");
    cipherNote.setAttribute("aria-expanded", show ? "true" : "false");
    if (show && noteClose) noteClose.focus();
    if (!show) cipherNote.focus();
  }

  if (cipherNote) onActivate(cipherNote, function () { showCodeSheet(true); });
  if (noteClose) noteClose.addEventListener("click", function () { showCodeSheet(false); });
  if (noteModal) {
    noteModal.addEventListener("click", function (event) {
      if (event.target === noteModal) showCodeSheet(false);
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && noteModal && !noteModal.hidden) showCodeSheet(false);
  });

  /* ---------- Games sub-navigation ---------- */

  var gamesNav = document.getElementById("games-subnav");
  if (gamesNav) {
    gamesNav.addEventListener("click", function (event) {
      var button = event.target.closest("[data-game]");
      if (!button) return;
      var name = button.getAttribute("data-game");
      var indexGame = document.getElementById("ix-game");
      var magnitudeGame = document.getElementById("sci-game");
      var signalGame = document.getElementById("sig-game");
      if (indexGame) indexGame.classList.toggle("game-off", name !== "index");
      if (magnitudeGame) magnitudeGame.classList.toggle("game-off", name !== "magnitude");
      if (signalGame) signalGame.classList.toggle("game-off", name !== "signal");
      gamesNav.querySelectorAll("[data-game]").forEach(function (chip) {
        chip.classList.toggle("active", chip === button);
      });
      if (name === "signal") resume();
      else pause();
    });
  }

  window.addEventListener("resize", function () {
    if (running) fit();
  });

  if (sceneVisible()) resume();

  window.SignalRoom = {
    setLighthouse: applyLight,
    setLever: function (down) {
      if (lever && gripG) setThrown(down);
    },
    setChartGlow: function (on) {
      var chart = document.getElementById("sig-chart-note");
      if (chart) chart.classList.toggle("is-hot", !!on);
    },
    setSignal: function (text) {
      var node = document.getElementById("sig-signal");
      if (node) node.textContent = text;
    },
    setBuffer: function (chars) {
      var slots = room.querySelectorAll("#sig-buffer .sig-slot-char");
      for (var i = 0; i < slots.length; i++) {
        slots[i].textContent = chars && chars[i] ? chars[i] : "";
      }
    },
    resume: resume,
    pause: pause
  };
})();
