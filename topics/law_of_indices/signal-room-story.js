/* Signal Room story: title → opening cutscene → tutorial → HELP / YES / BROKEN → LAT 35 / LNG 14 → game clear.
   Runs on top of signal-room.js and only talks to it through window.SignalRoom and the signalroom:lever event. */
(function () {
  "use strict";

  var room = document.getElementById("sig-room");
  var api = window.SignalRoom;
  var scene = room && room.querySelector(".sig-scene");
  if (!room || !api || !scene) return;

  var rain = document.getElementById("sig-rain");
  var lever = document.getElementById("sig-lever");
  var buffer = document.getElementById("sig-buffer");
  var cursor = room.querySelector(".sg-crt-cursor");
  var switches = Array.prototype.slice.call(room.querySelectorAll(".sig-switch"));
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var VALUES = [32, 16, 8, 4, 2, 1];
  var STAGES = [
    { word: "HELP", kind: "letter" },
    { word: "YES", kind: "letter" },
    { word: "BROKEN", kind: "letter" },
    { word: "35", kind: "digit" },
    { word: "14", kind: "digit" }
  ];

  /* title | cutscene | tutorial | press8 | pull | free | dialog | busy | ending */
  var phase = "title";
  var consoleOpen = false;
  var stage = 0;
  var idx = 0;
  var liveSignal = false;
  var slots = [];

  /* ---------- Overlay DOM ---------- */

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html) node.innerHTML = html;
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  /* The camera wraps the art and the rain so both zoom together. */
  var cam = el("div", "sgs-cam");
  room.insertBefore(cam, scene);
  cam.appendChild(scene);
  if (rain) cam.appendChild(rain);

  var dim = el("div", "sgs-dim");
  var noise = el("div", "sgs-static");
  var glare = el("div", "sgs-glare");
  var spotEl = el("div", "sgs-spot");
  var tip = el("div", "sgs-tip");
  spotEl.appendChild(tip);

  var dialog = el("div", "sgs-dialog");
  dialog.hidden = true;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-live", "polite");
  var face = el("div", "sgs-face");
  var body = el("div", "sgs-body");
  var nameEl = el("div", "sgs-name");
  var lineEl = el("p", "sgs-line");
  var nextEl = el("span", "sgs-next", "&#9660;");
  body.appendChild(nameEl);
  body.appendChild(lineEl);
  dialog.appendChild(face);
  dialog.appendChild(body);
  dialog.appendChild(nextEl);

  function icon(paths) {
    return '<span class="sgs-role-icon" aria-hidden="true"><svg viewBox="0 0 64 64">' + paths + "</svg></span>";
  }

  var ICON_STORY = icon(
    '<path d="M22 54 L26 22 H38 L42 54 Z" fill="#f2ede1"/><path d="M24.6 34 H39.4 L40 40 H24 Z M23.4 46 H40.6 L41.2 52 H22.8 Z" fill="#c9463a"/>' +
    '<rect x="25" y="14" width="14" height="8" rx="1.5" fill="#ffe9a6"/><path d="M24 14 L32 7 L40 14 Z" fill="#c9463a"/>' +
    '<path d="M39 17 L58 10 V24 Z M25 17 L6 10 V24 Z" fill="#ffe9a6" opacity=".45"/>');
  var ICON_CHALLENGE = icon(
    '<path d="M18 10 H46 V22 C46 32 40 38 32 38 C24 38 18 32 18 22 Z" fill="#ffc65a"/>' +
    '<path d="M18 14 H10 C10 24 14 28 19 28 M46 14 H54 C54 24 50 28 45 28" fill="none" stroke="#ffc65a" stroke-width="3.5"/>' +
    '<rect x="29" y="38" width="6" height="8" fill="#d4a043"/><rect x="20" y="46" width="24" height="7" rx="2" fill="#d4a043"/>' +
    '<path d="M32 16 L34.5 22 L41 22.5 L36 26.5 L37.7 33 L32 29.5 L26.3 33 L28 26.5 L23 22.5 L29.5 22 Z" fill="#fff6d8"/>');
  var ICON_GUESS = icon(
    '<circle cx="32" cy="32" r="24" fill="#1d3a24" stroke="#9ef59a" stroke-width="3"/>' +
    '<text x="32" y="43" text-anchor="middle" font-family="JetBrains Mono, Consolas, monospace" font-weight="900" font-size="30" fill="#c8ffc6">?</text>' +
    '<path d="M14 32 H8 M56 32 H50 M32 14 V8 M32 56 V50" stroke="#9ef59a" stroke-width="3" stroke-linecap="round"/>');
  var ICON_SPEED = icon(
    '<circle cx="32" cy="36" r="21" fill="#2a1f0e" stroke="#ffc65a" stroke-width="4"/><rect x="27" y="6" width="10" height="7" rx="2" fill="#ffc65a"/>' +
    '<path d="M32 13 V15" stroke="#ffc65a" stroke-width="4"/><path d="M32 36 L42 26" stroke="#fff6d8" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M32 19 A17 17 0 0 1 49 36 L32 36 Z" fill="#ffc65a" opacity=".35"/>');

  function card(id, art, name, text) {
    return '<button type="button" class="sgs-role" id="' + id + '">' + art + "<strong>" + name + "</strong><span>" + text + "</span></button>";
  }

  function portrait(src) {
    return '<img src="' + src + '" alt="" aria-hidden="true">';
  }

  var title = el("div", "sgs-title",
    '<p class="sgs-kicker">JM24 &middot; Signal Room</p>' +
    "<h2>Lighthouse Binary Decoder</h2>" +
    '<p class="sgs-sub" id="sgs-title-sub"></p>' +
    '<div class="sgs-roles" data-step="mode">' +
    card("sgs-mode-story", ICON_STORY, "Story Mode", "Two rescue stories<br>send and read signals") +
    card("sgs-mode-challenge", ICON_CHALLENGE, "Challenge Mode", "Random every time<br>beat your best score") +
    "</div>" +
    '<div class="sgs-roles" data-step="story" hidden>' +
    card("sgs-role-worker", portrait("game-art/signal-room/protagonist-smile.webp"), "Stranded Worker", "Send the signal<br>decimal &rarr; binary") +
    card("sgs-role-rescuer", portrait("game-art/signal-room/rescuer-smile.webp"), "Rescuer", "Read the signal<br>binary &rarr; decimal") +
    "</div>" +
    '<div class="sgs-roles" data-step="challenge" hidden>' +
    card("sgs-ch-guess", ICON_GUESS, "Guess the Number", "Find 1&ndash;63 in as few<br>guesses as you can") +
    card("sgs-ch-speed", ICON_SPEED, "Speed Decode", "Decode random words<br>before time runs out") +
    "</div>" +
    '<button type="button" class="sgs-back" id="sgs-back" hidden>&larr; Back</button>');

  var TITLE_SUBS = {
    mode: "A storm. Six lighthouses. How do you want to play?",
    story: "Which side of the signal are you on?",
    challenge: "Pick a challenge and beat your best score."
  };

  function titleStep(step) {
    Array.prototype.forEach.call(title.querySelectorAll("[data-step]"), function (group) {
      group.hidden = group.getAttribute("data-step") !== step;
    });
    title.querySelector("#sgs-title-sub").textContent = TITLE_SUBS[step];
    title.querySelector("#sgs-back").hidden = step === "mode";
  }

  var clear = el("div", "sgs-clear",
    "<h2>GAME CLEAR</h2>" +
    '<p class="sgs-sub">Rescue ship inbound &middot; LAT 35 &middot; LNG 14</p>' +
    '<button type="button" class="sgs-btn" id="sgs-again">Play again</button>');
  var clearHead = clear.querySelector("h2");
  var clearSub = clear.querySelector(".sgs-sub");

  function showClear(head, sub, long) {
    clearHead.textContent = head;
    clearSub.textContent = sub;
    clear.classList.toggle("is-long", !!long);
    clear.classList.add("is-on");
  }

  [dim, noise, glare, spotEl, dialog, title, clear].forEach(function (node) { room.appendChild(node); });

  var ME_FACES = {
    normal: "game-art/signal-room/protagonist-think.webp",
    tired: "game-art/signal-room/protagonist-tired.webp",
    think: "game-art/signal-room/protagonist-think.webp",
    joy: "game-art/signal-room/protagonist-joy.webp",
    anxious: "game-art/signal-room/protagonist-anxious.webp",
    smile: "game-art/signal-room/protagonist-smile.webp"
  };
  var cast = { name: "worker", faces: ME_FACES };

  function setCast(name, faces) {
    cast = { name: name, faces: faces || ME_FACES };
  }

  var RADIO_FACE =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect width="100" height="100" fill="#14211a"/>' +
    '<path d="M66 32 L80 10" stroke="#8a8f86" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="10" r="3" fill="#c9cfc4"/>' +
    '<rect x="14" y="32" width="70" height="52" rx="6" fill="#3d4a3a" stroke="#0e130d" stroke-width="2.5"/>' +
    '<rect x="20" y="38" width="30" height="40" rx="4" fill="#1d241c"/>' +
    '<path d="M24 45 H46 M24 51 H46 M24 57 H46 M24 63 H46 M24 69 H46" stroke="#536150" stroke-width="2.5"/>' +
    '<rect x="56" y="40" width="22" height="13" rx="2" fill="#0b1a0d"/><path class="sgs-needle" d="M60 51 L69 42" stroke="#9ef59a" stroke-width="1.5"/>' +
    '<circle cx="62" cy="68" r="6" fill="#20271f" stroke="#a7ae9f" stroke-width="1.5"/><circle cx="75" cy="68" r="4" fill="#20271f" stroke="#a7ae9f" stroke-width="1.5"/>' +
    '<g class="sgs-waves" fill="none" stroke="#9ef59a" stroke-width="2.5" stroke-linecap="round"><path d="M86 18 q6 6 0 12"/><path d="M91 12 q10 12 0 24"/></g>' +
    "</svg>";

  /* ---------- Sound (radio and console generated; storm from recordings) ---------- */

  var sfx = (function () {
    var ctx = null;
    var noiseBuf = null;
    var muted = false;
    var storm = null;
    var stormWanted = false;

    function ac() {
      if (muted) return null;
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function hiss(c) {
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        var data = noiseBuf.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      var src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      var band = c.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1700;
      band.Q.value = 0.6;
      var gain = c.createGain();
      gain.gain.value = 0;
      src.connect(band);
      band.connect(gain);
      gain.connect(c.destination);
      src.start();
      return { src: src, gain: gain };
    }

    function crackle(gain, vol, t0, t1) {
      for (var t = t0; t < t1; t += 0.045) {
        gain.gain.setValueAtTime(vol * (0.3 + Math.random() * 0.7) * (Math.random() < 0.12 ? 1.7 : 1), t);
      }
    }

    function tone(c, freq, t, len, vol, type, out) {
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.setValueAtTime(vol, t + Math.max(0.02, len - 0.03));
      gain.gain.linearRampToValueAtTime(0, t + len);
      osc.connect(gain);
      gain.connect(out || c.destination);
      osc.start(t);
      osc.stop(t + len + 0.05);
      return osc;
    }

    function strike(c, t, len, type, freq, q, vol, out) {
      if (!noiseBuf) {
        var seed = hiss(c);
        seed.src.stop();
        seed.gain.disconnect();
      }
      var src = c.createBufferSource();
      var filter = c.createBiquadFilter();
      var gain = c.createGain();
      src.buffer = noiseBuf;
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + len);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out || c.destination);
      src.start(t, Math.random());
      src.stop(t + len + 0.05);
      return filter;
    }

    function ring(c, t, freq, len, vol, out, type) {
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.985, t + len);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + len);
      osc.connect(gain);
      gain.connect(out || c.destination);
      osc.start(t);
      osc.stop(t + len + 0.05);
    }

    /* Overdrive + compressor so the lever hits hard and gritty. */
    function heavyBus(c, drive, level) {
      var input = c.createGain();
      var shaper = c.createWaveShaper();
      var comp = c.createDynamicsCompressor();
      var outGain = c.createGain();
      var curve = new Float32Array(1024);
      for (var i = 0; i < curve.length; i++) {
        var x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      comp.threshold.value = -12;
      comp.knee.value = 6;
      comp.ratio.value = 6;
      comp.attack.value = 0.002;
      comp.release.value = 0.18;
      outGain.gain.value = level;
      input.connect(shaper);
      shaper.connect(comp);
      comp.connect(outGain);
      outGain.connect(c.destination);
      window.setTimeout(function () { outGain.disconnect(); }, 4000);
      return input;
    }

    /* Clipped mains hum (~60 Hz) that sags and stutters like a struggling power line, then a relay cuts it. */
    function mainsBuzz(c, t, len) {
      var bus = heavyBus(c, 6, 0.55);
      var shape = c.createBiquadFilter();
      var gate = c.createGain();
      shape.type = "lowpass";
      shape.frequency.setValueAtTime(5200, t);
      shape.frequency.exponentialRampToValueAtTime(2200, t + len);
      gate.gain.setValueAtTime(0, t);
      gate.gain.linearRampToValueAtTime(0.75, t + 0.006);
      for (var s = 0.03; s < len - 0.05; s += 0.022) {
        var dip = Math.random() < 0.1 ? 0.25 : 0.7 + Math.random() * 0.3;
        gate.gain.setValueAtTime(0.75 * dip, t + s);
      }
      gate.gain.setValueAtTime(0.7, t + len - 0.04);
      gate.gain.linearRampToValueAtTime(0, t + len);
      [["sawtooth", 1, 0.5], ["square", 1.007, 0.35], ["sawtooth", 2, 0.2]].forEach(function (v) {
        var osc = c.createOscillator();
        osc.type = v[0];
        osc.frequency.setValueAtTime(64 * v[1], t);
        osc.frequency.exponentialRampToValueAtTime(56 * v[1], t + len);
        var g = c.createGain();
        g.gain.value = v[2];
        osc.connect(g);
        g.connect(shape);
        osc.start(t);
        osc.stop(t + len + 0.05);
      });
      shape.connect(gate);
      gate.connect(bus);
      strike(c, t + len, 0.03, "lowpass", 2600, 0.8, 0.9, bus);
      ring(c, t + len, 480, 0.12, 0.12, bus, "triangle");
    }

    function sparks(c, t, len, count, vol, out) {
      for (var i = 0; i < count; i++) {
        var at = t + Math.pow(Math.random(), 1.8) * len;
        var fade = 1 - (at - t) / len;
        strike(c, at, 0.004 + Math.random() * 0.012, "highpass", 2600 + Math.random() * 2600, 0.8, vol * (0.4 + fade * 0.6), out);
      }
    }

    /* Storm uses real recordings through <audio> elements: fetch/decodeAudioData is blocked on file://. */
    var STORM_DIR = "game-art/signal-room/";
    var RAIN_VOL = 0.6;
    var RAIN_FADE = 1.5;
    var THUNDER = ["storm-thunder-1.mp3", "storm-thunder-2.mp3", "storm-thunder-3.mp3"];
    var thunderLive = [];
    var voiceLive = null;

    function audible() {
      return !muted && gameVisible();
    }

    function thunderClip(vol) {
      if (!audible()) return;
      var el = new Audio(STORM_DIR + THUNDER[Math.floor(Math.random() * THUNDER.length)]);
      el.volume = Math.min(1, vol);
      thunderLive.push(el);
      el.addEventListener("ended", function () {
        thunderLive.splice(thunderLive.indexOf(el), 1);
      });
      el.play().catch(function () {});
    }

    function scheduleThunder() {
      if (!storm) return;
      storm.thunderTimer = window.setTimeout(function () {
        thunderClip(0.45 + Math.random() * 0.4);
        scheduleThunder();
      }, 9000 + Math.random() * 11000);
    }

    function rainTick() {
      var decks = storm.decks;
      var cur = decks[storm.active];
      var next = decks[1 - storm.active];
      if (!audible()) {
        decks.forEach(function (d) { d.pause(); });
        thunderLive.forEach(function (d) { d.pause(); });
        storm.paused = true;
        return;
      }
      if (storm.paused) {
        storm.paused = false;
        cur.play().catch(function () {});
        if (next.currentTime > 0 && !next.ended) next.play().catch(function () {});
        thunderLive.forEach(function (d) { d.play().catch(function () {}); });
      }
      if (!cur.duration) return;
      var left = cur.duration - cur.currentTime;
      if (left < RAIN_FADE && next.paused) {
        next.currentTime = 0;
        next.volume = 0;
        next.play().catch(function () {});
      }
      if (left < RAIN_FADE) {
        var k = Math.max(0, left / RAIN_FADE);
        cur.volume = RAIN_VOL * k;
        next.volume = RAIN_VOL * (1 - k);
      }
      if (cur.ended || left <= 0.05) {
        cur.pause();
        cur.currentTime = 0;
        next.volume = RAIN_VOL;
        storm.active = 1 - storm.active;
      }
    }

    function beginStorm() {
      if (storm || muted || !stormWanted) return;
      var decks = [0, 1].map(function () {
        var el = new Audio(STORM_DIR + "storm-rain-loop.mp3");
        el.preload = "auto";
        el.volume = RAIN_VOL;
        return el;
      });
      storm = { decks: decks, active: 0, paused: false, thunderTimer: 0 };
      decks[0].play().catch(function () {});
      storm.timer = window.setInterval(rainTick, 100);
      scheduleThunder();
    }

    return {
      burst: function (dur, vol) {
        var c = ac();
        if (!c) return;
        var n = hiss(c);
        var now = c.currentTime;
        crackle(n.gain, vol, now, now + dur);
        n.gain.gain.setValueAtTime(0, now + dur);
        n.src.stop(now + dur + 0.05);
      },
      bed: function (vol) {
        var c = ac();
        if (!c) return { stop: function () {} };
        var n = hiss(c);
        var live = true;
        var timer = 0;
        var tick = function () {
          if (!live) return;
          crackle(n.gain, vol, c.currentTime, c.currentTime + 0.5);
          timer = window.setTimeout(tick, 450);
        };
        tick();
        return {
          stop: function () {
            if (!live) return;
            live = false;
            window.clearTimeout(timer);
            n.gain.gain.cancelScheduledValues(c.currentTime);
            n.gain.gain.setTargetAtTime(0, c.currentTime, 0.05);
            n.src.stop(c.currentTime + 0.3);
          }
        };
      },
      blind: function () {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        for (var i = 0; i < 4; i++) {
          tone(c, 480, now + i * 0.5, 0.26, 0.09);
          tone(c, 620, now + i * 0.5, 0.26, 0.07);
        }
      },
      thud: function () {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        var osc = tone(c, 95, now, 0.28, 0.45);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.25);
      },
      rumble: function () {
        thunderClip(1);
      },
      send: function () {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        var bus = heavyBus(c, 3.2, 0.8);
        var grind = strike(c, now, 0.16, "bandpass", 700, 2.5, 0.7, bus);
        grind.frequency.exponentialRampToValueAtTime(2800, now + 0.15);
        for (var i = 0; i < 5; i++) {
          strike(c, now + i * 0.028, 0.01, "bandpass", 3000 - i * 220, 4, 0.9, bus);
        }

        var slam = now + 0.16;
        strike(c, slam, 0.09, "lowpass", 6500, 0.7, 1.6, bus);
        strike(c, slam, 0.22, "lowpass", 420, 1.2, 1.4, bus);
        var thump = tone(c, 150, slam, 0.42, 1.3, "sine", bus);
        thump.frequency.exponentialRampToValueAtTime(34, slam + 0.4);
        [227, 571, 1163, 1871, 2917].forEach(function (f, k) {
          ring(c, slam, f, 1.3 - k * 0.22, 0.32 - k * 0.055, bus, "triangle");
        });
        [0.085, 0.16].forEach(function (d, k) {
          strike(c, slam + d, 0.05, "bandpass", 1300 + k * 500, 1.5, 0.6 - k * 0.25, bus);
          ring(c, slam + d, 743 + k * 310, 0.3, 0.1, bus, "triangle");
        });

        mainsBuzz(c, slam + 0.01, 0.95);
      },
      press: function () {
        if (muted) return;
        var el = new Audio(STORM_DIR + "button-press.mp3");
        el.volume = 0.9;
        el.play().catch(function () {});
      },
      release: function () {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        var bus = heavyBus(c, 2.6, 0.8);
        strike(c, now, 0.06, "lowpass", 3000, 0.7, 1.1, bus);
        var thump = tone(c, 110, now, 0.22, 0.8, "sine", bus);
        thump.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        [389, 1031, 1777].forEach(function (f, k) {
          ring(c, now, f, 0.6 - k * 0.15, 0.2 - k * 0.05, bus, "triangle");
        });
        sparks(c, now + 0.02, 0.35, 12, 0.6, bus);
      },
      fanfare: function () {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          tone(c, f, now + i * 0.14, 0.55, 0.07, "triangle");
        });
      },
      chirp: function (ok) {
        var c = ac();
        if (!c) return;
        var now = c.currentTime;
        if (ok) {
          tone(c, 880, now, 0.08, 0.06, "square");
          tone(c, 1320, now + 0.08, 0.12, 0.06, "square");
        } else {
          tone(c, 196, now, 0.22, 0.09, "square");
          tone(c, 185, now + 0.02, 0.2, 0.06, "sawtooth");
        }
      },
      voice: function (clear) {
        if (muted) return { stop: function () {} };
        var el = new Audio(STORM_DIR + (clear ? "radio-chatter-clear.mp3" : "radio-chatter.mp3"));
        el.loop = true;
        el.volume = clear ? 0.7 : 0.85;
        el.addEventListener("loadedmetadata", function () {
          el.currentTime = Math.random() * Math.max(0, el.duration - 8);
        }, { once: true });
        el.play().catch(function () {});
        voiceLive = el;
        return {
          stop: function () {
            el.pause();
            if (voiceLive === el) voiceLive = null;
          }
        };
      },
      startStorm: function () {
        stormWanted = true;
        beginStorm();
      },
      toggle: function () {
        muted = !muted;
        if (ctx) {
          if (muted) ctx.suspend();
          else ctx.resume();
        }
        if (voiceLive) {
          if (muted) voiceLive.pause();
          else voiceLive.play().catch(function () {});
        }
        if (!muted) beginStorm();
        return muted;
      }
    };
  })();

  /* ---------- Small helpers ---------- */

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function isLit(i) {
    return switches[i] && switches[i].getAttribute("aria-pressed") === "true";
  }

  function currentSum() {
    var total = 0;
    for (var i = 0; i < VALUES.length; i++) if (isLit(i)) total += VALUES[i];
    return total;
  }

  function sumOf(lights) {
    var total = 0;
    for (var i = 0; i < VALUES.length; i++) if (lights && lights[i]) total += VALUES[i];
    return total;
  }

  function codeOf(ch) {
    return /\d/.test(ch) ? 30 + Number(ch) : ch.charCodeAt(0) - 64;
  }

  function charOf(n) {
    if (n >= 1 && n <= 26) return String.fromCharCode(64 + n);
    if (n >= 30 && n <= 39) return String(n - 30);
    return "";
  }

  function target() {
    var st = STAGES[stage];
    return st && idx < st.word.length ? codeOf(st.word[idx]) : -1;
  }

  function setLocked(on) {
    room.classList.toggle("sgs-locked", !!on);
  }

  function updateSignal() {
    if (!liveSignal) return;
    var total = currentSum();
    api.setSignal(String(total));
  }

  function gameVisible() {
    var panel = document.getElementById("panel-games");
    var game = document.getElementById("sig-game");
    return !!(panel && !panel.classList.contains("hidden") && game && !game.classList.contains("game-off"));
  }

  function pulseClass(name, ms) {
    room.classList.remove(name);
    void room.offsetWidth;
    room.classList.add(name);
    window.setTimeout(function () { room.classList.remove(name); }, ms);
  }

  function lightning() {
    var bolt = document.getElementById("sig-bolt");
    if (bolt) bolt.setAttribute("transform", "translate(" + Math.round(Math.random() * 560 - 300) + " 0)");
    room.classList.add("is-lightning");
    window.setTimeout(function () { room.classList.remove("is-lightning"); }, 100);
    window.setTimeout(function () { room.classList.add("is-lightning"); }, 220);
    window.setTimeout(function () { room.classList.remove("is-lightning"); }, 300);
    window.setTimeout(sfx.rumble, 280);
  }

  /* ---------- CRT buffer: the target word is ghosted, sent characters light up ---------- */

  function buildBuffer(word) {
    while (buffer.firstChild) buffer.removeChild(buffer.firstChild);
    slots = [];
    var wide = word.length > 4;
    var w = wide ? 54 : 58;
    var gap = wide ? 64 : 72;
    for (var i = 0; i < word.length; i++) {
      var x = 610 + i * gap;
      var g = svg("g", { transform: "translate(" + x + " 714)" });
      var rect = svg("rect", { width: w, height: 56, rx: 6 });
      var text = svg("text", { "class": "sig-slot-char sgs-ghost", x: w / 2, y: 40 });
      text.textContent = word[i];
      g.appendChild(rect);
      g.appendChild(text);
      buffer.appendChild(g);
      slots.push({ x: x, w: w, rect: rect, text: text });
    }
    markCurrent();
  }

  function markCurrent() {
    slots.forEach(function (slot, i) { slot.rect.classList.toggle("sgs-slot-now", i === idx); });
    var slot = slots[idx];
    if (!cursor) return;
    if (slot) {
      cursor.setAttribute("x", slot.x + (slot.w - 18) / 2);
      cursor.setAttribute("y", 776);
      cursor.style.display = "";
    } else {
      cursor.style.display = "none";
    }
  }

  function fillSlot(i) {
    var slot = slots[i];
    if (!slot) return;
    slot.text.classList.remove("sgs-ghost");
    slot.rect.classList.remove("sgs-slot-now");
    slot.rect.classList.add("sgs-slot-sent");
  }

  function beginStage(n) {
    stage = n;
    idx = 0;
    buildBuffer(STAGES[n].word);
  }

  /* ---------- Spotlight (viewBox coordinates) ---------- */

  var spotTarget = null;
  var SPOTS = {
    row: { x: 800, y: 535, rx: 480, ry: 108 },
    note: { x: 1474, y: 165, rx: 125, ry: 135 },
    slotH: { x: 639, y: 742, rx: 58, ry: 50, label: "H = 8", side: "bottom", gap: 36 },
    switch8: { x: 722, y: 548, rx: 78, ry: 92, label: "Press it", side: "top" },
    lever: { x: 1415, y: 640, rx: 135, ry: 190, label: "Pull to send", side: "top" },
    chart: { x: 127, y: 190, rx: 115, ry: 150, label: "LAT 35 · LNG 14", side: "bottom" }
  };

  function spot(t) {
    spotTarget = t || null;
    renderSpot();
  }

  function renderSpot() {
    var t = spotTarget;
    if (!t) {
      spotEl.classList.remove("is-on");
      return;
    }
    var k = room.clientWidth / 1600;
    var x = t.x * k;
    var y = t.y * k;
    var rx = t.rx * k;
    var ry = t.ry * k;
    spotEl.style.background = "radial-gradient(ellipse " + rx * 1.3 + "px " + ry * 1.3 + "px at " + x + "px " + y + "px, " +
      "rgba(2,4,6,0) 0%, rgba(2,4,6,0) 70%, rgba(2,4,6,.78) 100%)";
    if (t.label) {
      tip.hidden = false;
      tip.textContent = t.label;
      tip.className = "sgs-tip is-" + (t.side || "top");
      var gap = (t.gap || 22) * k;
      if (t.side === "right") {
        tip.style.left = x + rx + gap + "px";
        tip.style.top = y + "px";
      } else {
        tip.style.left = x + "px";
        tip.style.top = (t.side === "bottom" ? y + ry + gap : y - ry - gap) + "px";
      }
    } else {
      tip.hidden = true;
    }
    spotEl.classList.add("is-on");
  }

  window.addEventListener("resize", renderSpot);

  /* ---------- Dialogue box ---------- */

  var talk = null;

  function finishTyping(t) {
    window.clearInterval(t.timer);
    lineEl.textContent = t.text;
    t.ready = true;
    if (t.hold) t.resolve();
    else dialog.classList.add("is-ready");
  }

  /* hold: the line stays up and resolves as soon as it is typed; the game moves on from the player's action. */
  function say(who, mood, text, opt) {
    opt = opt || {};
    if (talk) window.clearInterval(talk.timer);
    var radio = who === "radio";
    dialog.hidden = false;
    dialog.classList.toggle("is-radio", radio);
    dialog.classList.toggle("is-top", !!opt.top);
    dialog.classList.toggle("is-hold", !!opt.hold);
    dialog.classList.remove("is-ready");
    dialog.classList.toggle("is-onair", !!opt.onair);
    dialog.classList.toggle("is-passive", !!opt.passive);
    dialog.classList.toggle("is-mid", !!opt.mid);
    nameEl.textContent = opt.name || (radio ? "RADIO" : "ME");
    var faceKind = radio ? "radio" : cast.name;
    var nextMood = mood || "normal";
    if (face.getAttribute("data-kind") !== faceKind || (!radio && face.getAttribute("data-mood") !== nextMood)) {
      face.innerHTML = radio
        ? RADIO_FACE
        : '<img src="' + (cast.faces[nextMood] || cast.faces.normal) + '" alt="" aria-hidden="true">';
      face.setAttribute("data-kind", faceKind);
    }
    face.setAttribute("data-mood", nextMood);
    lineEl.textContent = "";
    return new Promise(function (resolve) {
      var t = { text: text, i: 0, timer: 0, resolve: resolve, hold: !!opt.hold, ready: false, at: Date.now() };
      talk = t;
      if (reduced) {
        finishTyping(t);
        return;
      }
      t.timer = window.setInterval(function () {
        t.i += 1;
        lineEl.textContent = text.slice(0, t.i);
        if (t.i >= text.length) finishTyping(t);
      }, 24);
    });
  }

  function advance() {
    var t = talk;
    if (!t) return;
    if (!t.ready) {
      finishTyping(t);
      return;
    }
    if (t.hold) return;
    talk = null;
    dialog.classList.remove("is-ready");
    t.resolve();
  }

  function quiet() {
    if (talk) window.clearInterval(talk.timer);
    talk = null;
    dialog.hidden = true;
  }

  function awaiting() {
    return !!talk && !dialog.hidden;
  }

  /* Radio line: green flicker on the CRT and screen, static under the voice unless the channel is clear. */
  async function radio(text, opt) {
    opt = opt || {};
    room.classList.toggle("sgs-radio", !opt.clean);
    api.setSignal(opt.clean ? "CHANNEL CLEAR" : "INCOMING");
    if (opt.burst) {
      quiet();
      sfx.burst(1.2, 0.5);
      await wait(1200);
    }
    var bed = opt.clean ? { stop: function () {} } : sfx.bed(0.16);
    var voice = sfx.voice(!!opt.clean);
    await say("radio", null, text);
    voice.stop();
    bed.stop();
    room.classList.remove("sgs-radio");
    updateSignal();
  }

  /* ---------- Opening cutscene (no console input) ---------- */

  async function cutscene() {
    phase = "cutscene";
    setLocked(true);
    room.classList.add("sgs-dark");
    api.setSignal("NO SIGNAL");
    await wait(900);
    lightning();
    await wait(900);
    await say("me", "tired", "The storm is getting worse... I've been stranded on this island for days, completely cut off from the world...");

    quiet();
    await wait(400);
    await radio("...bzzzt... Is anyone there? This is the rescue team patrolling near the sector... Anyone copy? ...bzzzt...", { burst: true });
    api.setSignal("INCOMING");
    await say("me", "joy", "A voice?! It's the rescue team! Hello?! Can you hear me? I'm stranded on the island! Please help!");

    quiet();
    api.setSignal("NO CARRIER");
    sfx.blind();
    await wait(2200);
    await say("me", "anxious", "Damn it! The transmitter is completely fried... They can hear nothing from my side! The radio is broken!");
    await radio("...No response... We will check the next area in a few minutes... Over...");
    api.setSignal("NO SIGNAL");

    pulseClass("sgs-shake", 520);
    sfx.thud();
    window.setTimeout(function () { pulseClass("sgs-shake", 520); sfx.thud(); }, 380);
    await say("me", "anxious", "Wait, don't leave! Think... think! What can I use...");

    room.classList.add("sgs-zoom");
    lightning();
    await wait(1300);
    await say("me", "joy", "Right! There are several lighthouses on this island! If I can control them from this panel, I can blink them to send a distress message!");

    quiet();
    room.classList.remove("sgs-zoom");
    room.classList.remove("sgs-dark");
    await wait(1500);
    tutorial();
  }

  /* ---------- Tutorial ---------- */

  async function tutorial() {
    phase = "tutorial";
    liveSignal = true;
    beginStage(0);
    updateSignal();
    spot(SPOTS.row);
    await say("me", "think", "Let me check the log... It says the lighthouses represent binary values from left to right: 32, 16, 8, 4, 2, 1. We can use ON/OFF states to represent numbers.");
    spot(SPOTS.note);
    await say("me", "normal", "And there's a cipher note on the wall. A=1, B=2... Alright! Let's try to send a distress signal: 'HELP'! The first letter is 'H'... which is 8.");
    spot(SPOTS.slotH);
    await say("me", "think", "I need to flip the switches to make the sum equal to 8.", { top: true });
    spot(SPOTS.switch8);
    phase = "press8";
    setLocked(false);
    say("me", "normal", "Let's press the 3rd button from the left, which represents 2\u00B3 = 8.", { hold: true });
  }

  async function afterPress8() {
    phase = "busy";
    quiet();
    spot(null);
    await wait(500);
    spot(SPOTS.lever);
    phase = "pull";
  }

  /* ---------- Sending ---------- */

  function refuse() {
    phase = "dialog";
    setLocked(true);
    var total = currentSum();
    var st = STAGES[stage];
    var want = st.word[idx];
    var msg;
    if (st.kind === "digit") {
      msg = "Wait! That's wrong. The current code is " + total + ". According to the note, I need to send the correct digit code for our coordinates! Let me re-calculate.";
    } else {
      var got = charOf(total);
      var meaning = /\d/.test(got) ? "the digit '" + got + "'" : got ? "'" + got + "'" : "not on the code sheet";
      msg = "Wait! That's not right! This adds up to " + total + ", which is " + meaning + ". We need to send '" + want + "' (" + codeOf(want) + "). Let me adjust the switches.";
    }
    say("me", "anxious", msg).then(function () {
      quiet();
      phase = "free";
      setLocked(false);
    });
  }

  async function accept() {
    var fromTutorial = phase === "pull";
    phase = "busy";
    setLocked(true);
    spot(null);
    sfx.send();
    pulseClass("sgs-sent", 900);
    fillSlot(idx);
    idx += 1;
    var wordDone = idx >= STAGES[stage].word.length;
    if (stage === STAGES.length - 1 && wordDone) {
      ending();
      return;
    }
    window.setTimeout(function () {
      api.setLever(false);
      for (var i = 0; i < VALUES.length; i++) api.setLighthouse(i, false);
      sfx.release();
    }, 1600);
    await wait(1000);
    if (fromTutorial) {
      await say("me", "joy", "Great! 2\u00B3 = 8 represents H! The first letter is successfully sent! Now, let's show 'E', 'L', and 'P'!");
      quiet();
    } else if (wordDone) {
      await outro(stage);
      quiet();
    }
    markCurrent();
    phase = "free";
    setLocked(false);
  }

  async function outro(n) {
    if (n === 0) {
      await radio("...bzzzt... received... HELP... signal... Is someone on the island? ...bzzzt...", { burst: true });
      beginStage(1);
      await say("me", "joy", "They heard it! They're asking if anyone is here... Quick, I need to reply 'YES'! The first letter is 'Y' (25)!");
    } else if (n === 1) {
      await radio("...Survivors confirmed! ...Please respond... bzzzt... What is your status? Over...", { burst: true });
      beginStage(2);
      await say("me", "anxious", "Damn it, the connection is getting worse, I can't speak into the mic at all... I must let them know our situation. Let's reply 'BROKEN'! The first letter is 'B' (2)!");
    } else if (n === 2) {
      await radio("Is your radio broken? Understood. What are your coordinates? Please send your Latitude (LAT) first.", { burst: true });
      api.setChartGlow(true);
      spot(SPOTS.chart);
      beginStage(3);
      await say("me", "think", "Coordinates! Let me check the chart on the wall... Our Latitude is '35'! Wait, the cipher note says 0=30, 1=31... 9=39. So the digit 3 is '33', and 5 is '35'! Let's send '33' first!");
      spot(null);
    } else if (n === 3) {
      await radio("Latitude 35 received! Please send your Longitude (LNG) next.");
      spot(SPOTS.chart);
      beginStage(4);
      await say("me", "think", "The Longitude on the chart is '14'! According to the note, digit 1 is '31', and 4 is '34'! Let's send '31' first!");
      spot(null);
    }
  }

  /* ---------- Ending ---------- */

  async function ending() {
    phase = "ending";
    liveSignal = false;
    markCurrent();
    await wait(600);
    api.setBeacons([true, true, true, true, true, true]);
    room.classList.add("sgs-blaze");
    api.setChartGlow(false);
    await wait(1700);
    sfx.fanfare();
    await radio("Coordinates confirmed! Latitude 35, Longitude 14! The rescue ship has locked onto your lighthouse signals and is heading your way at full speed. Stay safe in the control room!", { clean: true });
    api.setSignal("LOCKED ON");
    await say("me", "smile", "We did it... We're going to make it!");
    quiet();
    showClear("GAME CLEAR", "Rescue ship inbound \u00B7 LAT 35 \u00B7 LNG 14");
  }

  /* ---------- Reset / start ---------- */

  function resetScene() {
    liveSignal = false;
    quiet();
    spot(null);
    ["sgs-dark", "sgs-zoom", "sgs-radio", "sgs-blaze", "sgs-sent", "sgs-shake"].forEach(function (c) { room.classList.remove(c); });
    clear.classList.remove("is-on");
    for (var i = 0; i < VALUES.length; i++) api.setLighthouse(i, false);
    api.setLever(false);
    api.setBeacons(null);
    api.setChartGlow(false);
    stage = 0;
    idx = 0;
    buildBuffer("");
    api.setSignal("\u2014");
  }

  function showTitle() {
    resetScene();
    if (window.SignalRoomRescue) window.SignalRoomRescue.reset();
    if (window.SignalRoomChallenge) window.SignalRoomChallenge.reset();
    consoleOpen = false;
    setCast("worker", ME_FACES);
    phase = "title";
    setLocked(true);
    titleStep("mode");
    title.hidden = false;
  }

  document.getElementById("sgs-mode-story").addEventListener("click", function () { titleStep("story"); });
  document.getElementById("sgs-mode-challenge").addEventListener("click", function () { titleStep("challenge"); });
  document.getElementById("sgs-back").addEventListener("click", function () { titleStep("mode"); });

  ["guess", "speed"].forEach(function (kind) {
    document.getElementById("sgs-ch-" + kind).addEventListener("click", function () {
      if (!window.SignalRoomChallenge) return;
      title.hidden = true;
      phase = "challenge";
      setLocked(false);
      sfx.startStorm();
      window.SignalRoomChallenge.start(kind);
    });
  });

  document.getElementById("sgs-role-worker").addEventListener("click", function () {
    title.hidden = true;
    sfx.startStorm();
    cutscene();
  });

  document.getElementById("sgs-role-rescuer").addEventListener("click", function () {
    if (!window.SignalRoomRescue) return;
    title.hidden = true;
    phase = "rescue";
    sfx.startStorm();
    window.SignalRoomRescue.start();
  });

  document.getElementById("sgs-again").addEventListener("click", showTitle);

  /* ---------- Input gate: the console only answers when the story allows it ---------- */

  function gate(event) {
    var control = event.target.closest && event.target.closest(".sig-switch, .sig-lever, .sig-note");
    if (!control) return;
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
    var isLever = control === lever;
    var ok = false;
    if (phase === "free") {
      if (!isLever || currentSum() === target()) {
        ok = true;
      } else if (event.type === "keydown" || (event.type === "pointerdown" && event.button === 0)) {
        refuse();
      }
    } else if (phase === "press8") {
      ok = control.classList.contains("sig-switch") && control.getAttribute("data-index") === "2" && !isLit(2);
    } else if (phase === "pull") {
      ok = isLever && currentSum() === target();
    } else if (phase === "challenge") {
      ok = control.classList.contains("sig-note") ||
        (consoleOpen && (!isLever || currentSum() > 0));
    }
    if (!ok) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  ["pointerdown", "pointerup", "click", "keydown"].forEach(function (type) {
    room.addEventListener(type, gate, true);
  });

  ["click", "keydown"].forEach(function (type) {
    room.addEventListener(type, function (event) {
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest && event.target.closest(".sig-switch")) sfx.press();
    });
  });

  room.addEventListener("click", function (event) {
    if (!awaiting() || Date.now() - talk.at < 300) return;
    if (event.target.closest(".sig-note-modal, .sgs-title, .sgs-clear")) return;
    advance();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (!awaiting() || !gameVisible()) return;
    if (event.key !== "Enter" && event.key !== " " && event.key !== "ArrowRight") return;
    var modal = document.getElementById("sig-note-modal");
    if (modal && !modal.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    advance();
  }, true);

  room.addEventListener("signalroom:lever", function (event) {
    if (!event.detail || !event.detail.down) return;
    if (phase !== "free" && phase !== "pull") return;
    if (sumOf(event.detail.lights) !== target()) return;
    accept();
  });

  var watcher = new MutationObserver(function () {
    updateSignal();
    if (phase === "press8" && isLit(2)) afterPress8();
  });
  switches.forEach(function (button) {
    watcher.observe(button, { attributes: true, attributeFilter: ["aria-pressed"] });
  });

  window.SignalRoomKit = {
    room: room,
    cam: cam,
    sfx: sfx,
    say: say,
    quiet: quiet,
    awaiting: awaiting,
    showing: function () { return talk && !dialog.hidden ? talk.text : ""; },
    wait: wait,
    spot: spot,
    lightning: lightning,
    pulseClass: pulseClass,
    gameVisible: gameVisible,
    setCast: setCast,
    setLocked: setLocked,
    setConsole: function (on) { consoleOpen = !!on; },
    showClear: showClear,
    codeOf: codeOf,
    charOf: charOf,
    reduced: reduced
  };

  showTitle();
})();
