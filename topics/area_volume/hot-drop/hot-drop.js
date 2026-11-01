/* JM32 · Hot Drop — steel-ball cooling pool night shift.
 * Xiao Wang fills every pool to a different level. The player works out the largest number of
 * steel balls that keeps the water at or below the red line; only that exact maximum passes.
 * Overfilling burns the player, underfilling gets them scolded: three shared strikes.
 * The shift runs from 22:00 to 06:00 on a real-time clock that only ticks while the player is thinking.
 */
(function () {
  "use strict";

  var stage = document.getElementById("hd-stage");
  if (!stage) return;
  var ART = ((document.currentScript && document.currentScript.src) || "").replace(/hot-drop\.js(\?.*)?$/, "art/");
  var AV = "?v=20261101u";

  var NS = "http://www.w3.org/2000/svg";
  var PI = Math.PI;
  var C = { am: "#ffb347", hot: "#ff7a2f", tl: "#3fd8cf", ok: "#4ef0a2", rd: "#ff4d5e", ink: "#eef5ff", mut: "#9fb2c8" };
  var INK = "#1b2433";
  var FR = { x: 20, y: 20, w: 1240, h: 680 };
  var FLOOR = 570;
  var CX = 470;
  var WANG_X = 120, CONSOLE_X = 1010, YOU_X = 1130;
  var OX = 0.45, OY = 0.3, ELL = 0.26;
  var LIVES = 3;
  var SHIFT_MS = 8 * 60 * 1000;
  var KEY_BEST = "hot-drop-best", KEY_TRAINED = "hot-drop-trained", KEY_MUTE = "hot-drop-muted";
  var TEST = /[?&]hdtest\b/.test(location.search);
  var SHOW_ANSWER = true; // testing only: change to false before pushing

  /* ================================================================
   * Small helpers
   * ================================================================ */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function sv(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function txt(parent, x, y, s, o) {
    o = o || {};
    var t = sv("text", {
      x: x, y: y, "text-anchor": o.anchor || "middle", fill: o.fill || C.ink,
      "font-size": o.size || 16, "font-weight": o.weight || 700, class: o.cls, "letter-spacing": o.ls,
      "font-family": o.mono ? "JetBrains Mono, ui-monospace, monospace" : null,
    }, parent);
    t.textContent = s;
    return t;
  }

  function line(parent, a, b, stroke, w, extra) {
    var at = { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: stroke, "stroke-width": w || 2, "stroke-linecap": "round" };
    for (var k in extra || {}) at[k] = extra[k];
    return sv("line", at, parent);
  }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fmt(x) { var r = Math.round(x * 100) / 100; return String(Math.abs(r) < 1e-9 ? 0 : r); }
  function fmt2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function pt(p) { return p.x.toFixed(1) + " " + p.y.toFixed(1); }
  function pts(list) { return list.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" "); }
  function piv(v) { return fmt(v / PI) + "π"; }
  function relOK(v, t) { return Math.abs(v - t) <= Math.max(0.6, Math.abs(t) * 0.01); }

  function wrapText(s, n) {
    var out = [], cur = "";
    String(s).split(" ").forEach(function (w) {
      if (cur && (cur + " " + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
    });
    if (cur) out.push(cur);
    return out;
  }

  function hull(P) {
    var p = P.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
    function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop();
      lo.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
      up.push(p[i]);
    }
    up.pop();
    lo.pop();
    return lo.concat(up);
  }

  function grad(defs, id, stops, o) {
    o = o || {};
    var g = sv(o.radial ? "radialGradient" : "linearGradient", o.radial
      ? { id: id, cx: o.cx || "50%", cy: o.cy || "50%", r: o.r || "50%" }
      : { id: id, x1: o.x1 || "0", y1: o.y1 || "0", x2: o.x2 == null ? "0" : o.x2, y2: o.y2 == null ? "1" : o.y2 }, defs);
    stops.forEach(function (s) { sv("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] }, g); });
  }

  function glowFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd, result: "b" }, f);
    var m = sv("feMerge", {}, f);
    sv("feMergeNode", { in: "b" }, m);
    sv("feMergeNode", { in: "b" }, m);
    sv("feMergeNode", { in: "SourceGraphic" }, m);
  }

  function blurFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd }, f);
  }

  /* ================================================================
   * Audio — procedural, no files
   * ================================================================ */

  var audio = { ctx: null, master: null, music: null, sfx: null, noise: null, bed: "", want: "", next: 0, k: 0, muted: false };
  try { audio.muted = localStorage.getItem(KEY_MUTE) === "1"; } catch (e) {}

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function stageVisible() { return !document.hidden && stage.offsetParent !== null; }

  function ensureAudio() {
    if (audio.ctx) {
      if (audio.ctx.state === "suspended" && stageVisible()) audio.ctx.resume();
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = audio.ctx = new Ctx();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 6;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);
    audio.master = ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.85;
    audio.master.connect(comp);
    audio.music = ctx.createGain();
    audio.music.gain.value = 0;
    audio.music.connect(audio.master);
    audio.sfx = ctx.createGain();
    audio.sfx.gain.value = 1.4;
    audio.sfx.connect(audio.master);
    audio.echoIn = ctx.createGain();
    var dl = ctx.createDelay(1);
    dl.delayTime.value = 0.42;
    var fb = ctx.createGain();
    fb.gain.value = 0.38;
    var dlp = ctx.createBiquadFilter();
    dlp.type = "lowpass";
    dlp.frequency.value = 2200;
    var wet = ctx.createGain();
    wet.gain.value = 0.55;
    audio.echoIn.connect(dl);
    dl.connect(dlp);
    dlp.connect(fb);
    fb.connect(dl);
    dlp.connect(wet);
    wet.connect(audio.music);
    var buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    if (audio.want) startBed(audio.want);
  }

  function tone(t, f, dur, o) {
    o = o || {};
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.det) osc.detune.value = o.det;
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    var g = ctx.createGain();
    var a = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.02));
    var node = osc;
    if (o.lp) {
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.lp;
      if (o.q) lp.Q.value = o.q;
      osc.connect(lp);
      node = lp;
    }
    node.connect(g);
    g.connect(o.out || audio.music);
    if (o.echo) {
      var send = ctx.createGain();
      send.gain.value = o.echo;
      g.connect(send);
      send.connect(audio.echoIn);
    }
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, o) {
    o = o || {};
    var ctx = audio.ctx;
    var src = ctx.createBufferSource();
    src.buffer = audio.noise;
    var f = ctx.createBiquadFilter();
    f.type = o.ft || "highpass";
    f.frequency.setValueAtTime(o.f || 6000, t);
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    if (o.q) f.Q.value = o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.05, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out || audio.music);
    if (o.echo) {
      var send = ctx.createGain();
      send.gain.value = o.echo;
      g.connect(send);
      send.connect(audio.echoIn);
    }
    src.start(t, Math.random() * 0.4);
    src.stop(t + dur + 0.02);
  }

  function kick(t, g) {
    tone(t, 130, 0.38, { to: 40, gain: g });
    noise(t, 0.025, { ft: "lowpass", f: 2500, gain: g * 0.25 });
  }
  function clang(t, f, g, echo) {
    tone(t, f, 0.55, { type: "square", gain: g * 0.45, lp: 3200, echo: echo });
    tone(t, f * 2.76, 0.32, { gain: g * 0.55, echo: echo });
    tone(t, f * 5.4, 0.16, { gain: g * 0.35 });
    noise(t, 0.12, { ft: "bandpass", f: 2800, q: 3, gain: g, echo: echo });
  }
  function pad(t, notes, dur, g, lp) {
    notes.forEach(function (m) {
      tone(t, mtof(m), dur, { type: "sawtooth", gain: g, a: dur * 0.3, lp: lp || 650, det: -9 });
      tone(t, mtof(m), dur, { type: "sawtooth", gain: g, a: dur * 0.3, lp: lp || 650, det: 9 });
    });
  }
  function steam(t, g) { noise(t, 1.4, { ft: "bandpass", f: 1600, fto: 6500, q: 0.8, gain: g, a: 0.35 }); }
  function chirp(t, g, out) {
    var base = 2600 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 4), gap = 0.07 + Math.random() * 0.05;
    for (var k = 0; k < n; k++) {
      var f = base * (1 + (Math.random() - 0.5) * 0.18);
      tone(t + k * gap, f, 0.055, { to: f * (1.25 + Math.random() * 0.3), gain: g, a: 0.008, out: out, echo: 0.15 });
    }
  }

  var MINOR = { roots: [40, 36, 33, 35], chords: [[52, 55, 59], [48, 52, 55], [45, 48, 52], [47, 51, 54]] };
  var BASS_LINE = [0, 0, null, 0, 12, null, 0, 7];
  var LEAD = [
    [[0, 64, 3], [3, 67, 1], [4, 66, 2], [6, 64, 2]],
    [[0, 60, 4], [4, 59, 2], [6, 60, 2]],
    [[0, 57, 3], [3, 60, 1], [4, 64, 4]],
    [[0, 63, 6], [6, 59, 2]],
  ];

  var BEDS = {
    night: {
      bpm: 92, swing: 0.54, bars: 8, vol: 1.25,
      play: function (t, i, bar, e) {
        var c = bar % 4, r = MINOR.roots[c], ch = MINOR.chords[c];
        if (i === 0) {
          pad(t, ch, e * 8.2, 0.02);
          tone(t, mtof(r), e * 8, { gain: 0.1, a: 0.05 });
        }
        if (i === 0 || i === 4 || (bar % 2 && i === 7)) kick(t, i === 7 ? 0.18 : 0.32);
        if (i === 4) clang(t, 330, 0.07, 0.3);
        if (i === 2 || i === 6) noise(t, 0.07, { ft: "bandpass", f: 1900, q: 7, gain: 0.05 });
        noise(t, 0.03, { f: 8000, gain: i % 2 ? 0.026 : 0.014 });
        if (BASS_LINE[i] !== null) tone(t, mtof(r + BASS_LINE[i]), e * 0.9, { type: "sawtooth", gain: 0.11, lp: 380, q: 8 });
        if (bar < 4) {
          LEAD[c].forEach(function (n) {
            if (n[0] === i) tone(t, mtof(n[1]), e * n[2], { type: "square", gain: 0.04, lp: 1800, a: 0.02, echo: 0.45 });
          });
        } else {
          tone(t, mtof(ch[i % 3] + 12), e * 0.9, { type: "triangle", gain: 0.035, lp: 2200, echo: 0.4 });
        }
        if ((bar === 3 || bar === 7) && i === 6) steam(t, 0.05);
      },
    },
    rush: {
      bpm: 128, swing: 0.5, bars: 4, vol: 1.15,
      play: function (t, i, bar, e) {
        var r = MINOR.roots[bar], ch = MINOR.chords[bar];
        if (i % 2 === 0) kick(t, 0.3);
        if (i === 2 || i === 6) clang(t, 380, 0.055, 0.25);
        noise(t, 0.03, { f: 9000, gain: 0.022 });
        noise(t + e / 2, 0.025, { f: 9000, gain: 0.012 });
        tone(t, mtof(r + (i % 2 ? 12 : 0)), e * 0.85, { type: "sawtooth", gain: 0.1, lp: i % 2 ? 520 : 820, q: 6 });
        if (i === 0) ch.forEach(function (m) { tone(t, mtof(m + 12), e * 1.5, { type: "square", gain: 0.022, lp: 1600, echo: 0.3 }); });
        tone(t, mtof(ch[i % 3] + 24), e * 0.8, { type: "triangle", gain: 0.028, echo: 0.3 });
        if (bar === 3 && i === 4) tone(t, 880, e * 3, { type: "square", to: 620, gain: 0.02, lp: 2500 });
      },
    },
    dawn: {
      bpm: 100, swing: 0.5, bars: 4, vol: 1.3,
      chords: [[62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69]],
      roots: [38, 35, 31, 33],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[i % 4] + (i >= 4 ? 12 : 0)), e * 1.6, { type: "triangle", gain: 0.05, echo: 0.35 });
        if (i % 2 === 0) tone(t, mtof(this.roots[bar]), e * 1.8, { type: "sine", gain: 0.17 });
        if (i === 0) pad(t, ch.map(function (m) { return m - 12; }), e * 8.2, 0.012, 1200);
        if (i === 0 || i === 4) kick(t, 0.16);
        if ((i === 3 || i === 7) && Math.random() < 0.45) chirp(t, 0.035);
      },
    },
    sad: {
      bpm: 66, swing: 0.5, bars: 4, vol: 1.2,
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        if (i === 0) pad(t, ch.map(function (m) { return m - 12; }), e * 8, 0.016, 500);
        if (i % 2 === 0) tone(t, mtof(ch[(i / 2) % 3] + 12), e * 1.8, { type: "triangle", gain: 0.04, echo: 0.4 });
        if (i === 0) tone(t, mtof(ch[0] - 24), e * 7, { type: "sine", gain: 0.12 });
        if (bar === 3 && i === 4) steam(t, 0.035);
      },
    },
  };

  function setBed(name) {
    audio.want = name;
    if (!audio.ctx || audio.bed === name) return;
    startBed(name);
  }

  function startBed(name) {
    var ctx = audio.ctx, now = ctx.currentTime, g = audio.music.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + 0.35);
    audio.bed = name;
    audio.k = 0;
    audio.next = now + 0.4;
    g.setValueAtTime(0, now + 0.4);
    g.linearRampToValueAtTime(BEDS[name] ? BEDS[name].vol : 0, now + 1.2);
  }

  setInterval(function () {
    if (!audio.ctx || !audio.bed) return;
    if (!stageVisible()) {
      if (audio.ctx.state === "running") audio.ctx.suspend();
      return;
    }
    if (audio.ctx.state === "suspended") { audio.ctx.resume(); return; }
    var now = audio.ctx.currentTime;
    if (audio.birds > 0 && !audio.muted && Math.random() < audio.birds * 0.018) chirp(now + 0.05, 0.02 + audio.birds * 0.025, audio.sfx);
    var bed = BEDS[audio.bed];
    if (!bed) return;
    var e = 60 / bed.bpm / 2;
    if (audio.next < now - 0.1) audio.next = now + 0.05;
    while (audio.next < now + 0.2) {
      var i = audio.k % 8;
      var bar = Math.floor(audio.k / 8) % bed.bars;
      bed.play(audio.next + (i % 2 ? e * (2 * bed.swing - 1) : 0), i, bar, e);
      audio.k++;
      audio.next += e;
    }
  }, 40);

  function sfxOn() { return audio.ctx && audio.ctx.state === "running"; }
  function now0() { return audio.ctx.currentTime; }
  var SFX = {
    click: function () { if (sfxOn()) tone(now0(), 660, 0.06, { type: "triangle", gain: 0.05, out: audio.sfx }); },
    blip: function () { if (sfxOn()) tone(now0(), 1200 + Math.random() * 200, 0.025, { type: "square", gain: 0.009, lp: 3000, out: audio.sfx }); },
    plop: function () {
      if (!sfxOn()) return;
      var t = now0();
      tone(t, 520 + Math.random() * 120, 0.12, { to: 150, gain: 0.07, out: audio.sfx });
      noise(t + 0.02, 0.35, { f: 3500, gain: 0.035, out: audio.sfx });
    },
    pour: function (dur) { if (sfxOn()) noise(now0(), dur || 1.6, { ft: "bandpass", f: 600, fto: 1100, q: 0.6, gain: 0.09, a: 0.15, out: audio.sfx }); },
    press: function () { if (sfxOn()) { var t = now0(); tone(t, 180, 0.08, { type: "square", gain: 0.05, lp: 900, out: audio.sfx }); tone(t + 0.05, 90, 0.2, { gain: 0.12, out: audio.sfx }); } },
    alarm: function () {
      if (!sfxOn()) return;
      var t = now0();
      for (var j = 0; j < 6; j++) tone(t + j * 0.15, j % 2 ? 620 : 880, 0.14, { type: "square", gain: 0.04, lp: 2600, out: audio.sfx });
    },
    splash: function () {
      if (!sfxOn()) return;
      var t = now0();
      noise(t, 0.9, { ft: "bandpass", f: 900, fto: 300, q: 0.7, gain: 0.2, out: audio.sfx });
      noise(t, 1.4, { f: 4000, gain: 0.08, out: audio.sfx });
      tone(t + 0.1, 700, 0.35, { type: "triangle", to: 1400, gain: 0.05, out: audio.sfx });
    },
    win: function () {
      if (!sfxOn()) return;
      var t = now0();
      [72, 76, 79, 84].forEach(function (m, j) { tone(t + j * 0.09, mtof(m), 0.5, { type: "triangle", gain: 0.08, out: audio.sfx }); });
    },
    scold: function () {
      if (!sfxOn()) return;
      var t = now0();
      tone(t, 220, 0.25, { type: "sawtooth", to: 150, gain: 0.06, lp: 900, out: audio.sfx });
      tone(t + 0.28, 180, 0.4, { type: "sawtooth", to: 110, gain: 0.06, lp: 900, out: audio.sfx });
    },
    whoosh: function () { if (sfxOn()) noise(now0(), 0.9, { ft: "bandpass", f: 400, fto: 3000, gain: 0.12, q: 0.7, out: audio.sfx }); },
  };

  function setMuted(m) {
    audio.muted = m;
    try { localStorage.setItem(KEY_MUTE, m ? "1" : "0"); } catch (e) {}
    if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : 0.85, audio.ctx.currentTime, 0.05);
    var label = m ? "Sound off" : "Sound on";
    Array.prototype.forEach.call(stage.querySelectorAll(".snd"), function (b) { b.textContent = label; });
  }

  /* ================================================================
   * Characters — white round head, a little hair, solid body, stick limbs
   * ================================================================ */

  var LOOK = {
    you: { shirt: "#dbe4f0", suit: "#2f6fd6", hair: "#2a1f17" },
    wang: { shirt: "#3aa866", suit: "#2c8a52", hair: "#c27a33" },
    boss: { shirt: "#f4f6f9", suit: "#4b5363", hair: "#a7b0ba" },
  };
  var NAMES = { you: "You", wang: "Xiao Wang", boss: "Boss Lau" };

  // [elbowX, elbowY, handX, handY] for the left and right arm; shoulders sit at (±17, -106).
  var ARMS = {
    idle: [[-26, -88, -29, -66], [26, -88, 29, -66]],
    wave: [[-26, -88, -29, -66], [31, -116, 38, -140]],
    hose: [[-4, -88, 18, -80], [28, -94, 40, -84]],
    point: [[-26, -88, -29, -66], [36, -104, 56, -110]],
    ouch: [[-32, -118, -24, -146], [32, -118, 24, -146]],
    hips: [[-36, -94, -20, -72], [36, -94, 20, -72]],
    thumbs: [[-26, -88, -29, -66], [33, -98, 36, -122]],
    shrug: [[-32, -100, -44, -112], [32, -100, 44, -112]],
    press: [[-26, -88, -29, -66], [30, -96, 46, -84]],
  };

  function limb(g, p, w, col) {
    return sv("polyline", {
      points: p.map(function (q) { return q[0] + "," + q[1]; }).join(" "),
      fill: "none", stroke: col || INK, "stroke-width": w || 4.2, "stroke-linecap": "round", "stroke-linejoin": "round",
    }, g);
  }

  function torso(g, who, L) {
    var edge = { stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" };
    function body(d, fill) { var a = { d: d, fill: fill }; for (var k in edge) a[k] = edge[k]; return sv("path", a, g); }
    if (who === "boss") {
      body("M-19 -110 Q0 -116 19 -110 L25 -64 Q0 -53 -25 -64 Z", L.suit);
      sv("path", { d: "M-8 -111 L8 -111 L0 -90 Z", fill: L.shirt }, g);
      sv("path", { d: "M-2.6 -108 L2.6 -108 L4 -91 L0 -85 L-4 -91 Z", fill: "#d62f3a" }, g);
      sv("path", { d: "M-8 -111 L-2.5 -92 M8 -111 L2.5 -92", stroke: INK, "stroke-width": 1.6, fill: "none" }, g);
      sv("circle", { cx: 0, cy: -77, r: 1.7, fill: INK }, g);
      sv("circle", { cx: 0, cy: -69, r: 1.7, fill: INK }, g);
    } else if (who === "wang") {
      body("M-17 -110 Q0 -116 17 -110 L20 -64 Q0 -57 -20 -64 Z", L.suit);
      sv("path", { d: "M0 -109 L0 -62", stroke: "rgba(0,0,0,.35)", "stroke-width": 1.6 }, g);
      sv("path", { d: "M-7 -111 L0 -103 L7 -111", stroke: INK, "stroke-width": 1.8, fill: "none" }, g);
      sv("rect", { x: 5, y: -100, width: 8, height: 7, rx: 1.5, fill: "rgba(255,255,255,.28)" }, g);
      sv("rect", { x: -19.5, y: -72, width: 39, height: 4, fill: "rgba(0,0,0,.3)" }, g);
    } else {
      body("M-17 -110 Q0 -116 17 -110 L20 -64 Q0 -57 -20 -64 Z", L.shirt);
      sv("path", { d: "M-12 -99 L12 -99 L13 -76 L19.5 -66 Q0 -58 -19.5 -66 L-13 -76 Z", fill: L.suit, stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      sv("path", { d: "M-12 -99 L-15 -110 M12 -99 L15 -110", stroke: L.suit, "stroke-width": 4, "stroke-linecap": "round" }, g);
      sv("rect", { x: -6, y: -94, width: 12, height: 8, rx: 1.5, fill: "rgba(255,255,255,.22)" }, g);
      sv("circle", { cx: -10, cy: -97, r: 1.7, fill: "#ffd166" }, g);
      sv("circle", { cx: 10, cy: -97, r: 1.7, fill: "#ffd166" }, g);
    }
  }

  function hair(g, who, L) {
    var st = { stroke: INK, "stroke-width": 2, "stroke-linejoin": "round" };
    if (who === "you") {
      sv("path", { d: "M-22.6 -138 C-24 -163 21 -167 22.6 -140 C17 -148 7 -151 -1 -152 C-5 -146 -13 -142 -22.6 -138 Z", fill: L.hair, stroke: st.stroke, "stroke-width": 2, "stroke-linejoin": "round" }, g);
    } else if (who === "wang") {
      sv("path", { d: "M-21 -136 L-28 -150 L-18 -150 L-18 -165 L-7 -156 L0 -171 L6 -156 L17 -165 L16 -150 L28 -151 L21 -136 C13 -151 -12 -152 -21 -136 Z", fill: L.hair, stroke: st.stroke, "stroke-width": 2, "stroke-linejoin": "round" }, g);
    } else {
      sv("ellipse", { cx: -21.5, cy: -139, rx: 4.6, ry: 7.5, fill: L.hair, stroke: INK, "stroke-width": 1.6 }, g);
      sv("ellipse", { cx: 21.5, cy: -139, rx: 4.6, ry: 7.5, fill: L.hair, stroke: INK, "stroke-width": 1.6 }, g);
      sv("path", { d: "M-13 -153 Q1 -162 15 -152", fill: "none", stroke: L.hair, "stroke-width": 2.6, "stroke-linecap": "round" }, g);
    }
  }

  function face(g, mood, who) {
    function eyes(r) {
      sv("circle", { cx: -7.5, cy: -138, r: r, fill: INK }, g);
      sv("circle", { cx: 7.5, cy: -138, r: r, fill: INK }, g);
    }
    function stroke(d, w, fill) {
      return sv("path", { d: d, fill: fill || "none", stroke: INK, "stroke-width": w || 2.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    }
    function blush() {
      sv("ellipse", { cx: -13.5, cy: -130, rx: 3.6, ry: 2.2, fill: "#ff9aa8", opacity: 0.65 }, g);
      sv("ellipse", { cx: 13.5, cy: -130, rx: 3.6, ry: 2.2, fill: "#ff9aa8", opacity: 0.65 }, g);
    }
    if (who === "boss") sv("path", { d: "M-9 -130.5 Q-4.5 -134.5 0 -131.5 Q4.5 -134.5 9 -130.5 Q4.5 -128 0 -129.5 Q-4.5 -128 -9 -130.5 Z", fill: "#6f7782", stroke: INK, "stroke-width": 1 }, g);
    switch (mood) {
      case "happy":
        stroke("M-10.5 -137 Q-7.5 -142 -4.5 -137");
        stroke("M4.5 -137 Q7.5 -142 10.5 -137");
        stroke("M-7.5 -127 Q0 -118.5 7.5 -127 Z", 2, "#c43c4f");
        blush();
        break;
      case "shock":
        eyes(3.3);
        sv("ellipse", { cx: 0, cy: -124.5, rx: 3.6, ry: 4.6, fill: INK }, g);
        break;
      case "angry":
        eyes(2.4);
        stroke("M-12.5 -146 L-4 -142", 2.8);
        stroke("M12.5 -146 L4 -142", 2.8);
        stroke("M-6.5 -122.5 Q0 -128 6.5 -122.5");
        break;
      case "sad":
        eyes(2.4);
        stroke("M-11.5 -143 L-4 -146", 2.4);
        stroke("M11.5 -143 L4 -146", 2.4);
        stroke("M-6 -122.5 Q0 -127.5 6 -122.5");
        break;
      case "pain":
        stroke("M-11 -141 L-5 -138 L-11 -135");
        stroke("M11 -141 L5 -138 L11 -135");
        stroke("M-7.5 -124.5 Q-3.75 -128 0 -124.5 Q3.75 -121 7.5 -124.5");
        blush();
        break;
      case "smug":
        stroke("M-10.5 -138 L-4.5 -138", 2.6);
        stroke("M4.5 -138 L10.5 -138", 2.6);
        stroke("M-6 -126 Q2 -121 8 -127");
        break;
      default:
        eyes(2.4);
        stroke("M-5 -126 Q0 -123 5 -126");
    }
  }

  function person(parent, who, o) {
    o = o || {};
    var L = LOOK[who], sc = o.sc || 1, band = o.band || 0;
    var g = sv("g", { transform: "translate(" + (o.x || 0) + "," + (o.y || 0) + ") scale(" + (o.flip ? -sc : sc) + "," + sc + ")" }, parent);
    if (!o.noShadow) sv("ellipse", { cx: 0, cy: 1, rx: 24, ry: 4.5, fill: "rgba(0,0,0,.35)" }, g);
    limb(g, [[-7, -64], [-10, -3]]);
    limb(g, [[7, -64], [10, -3]]);
    if (band >= 3) {
      limb(g, [[8.3, -42], [9.6, -14]], 10, "#f3efe6");
      sv("path", { d: "M3.8 -34 L14 -33 M4.2 -24 L14.6 -23", stroke: "#c9c1b2", "stroke-width": 1.2 }, g);
    }
    sv("path", { d: "M-17 0 Q-17 -6 -9.5 -5 L-6 -4 L-6 0 Z", fill: INK }, g);
    sv("path", { d: "M17 0 Q17 -6 9.5 -5 L6 -4 L6 0 Z", fill: INK }, g);
    torso(g, who, L);
    var arms = ARMS[o.pose] || ARMS.idle;
    arms.forEach(function (a, i) { limb(g, [[i ? 17 : -17, -106], [a[0], a[1]], [a[2], a[3]]]); });
    if (band >= 2) {
      var a0 = arms[0];
      limb(g, [[a0[0], a0[1]], [(a0[0] + a0[2]) / 2, (a0[1] + a0[3]) / 2]], 9, "#f3efe6");
    }
    arms.forEach(function (a) { sv("circle", { cx: a[2], cy: a[3], r: 3.6, fill: "#fff", stroke: INK, "stroke-width": 2 }, g); });
    if (o.pose === "thumbs") limb(g, [[36, -122], [35, -130]], 3.4);
    var hg = sv("g", {}, g);
    sv("circle", { cx: 0, cy: -136, r: 22, fill: "#fff", stroke: INK, "stroke-width": 3 }, hg);
    hair(hg, who, L);
    face(hg, o.mood || "normal", who);
    if (who === "boss" && o.mood === "angry") {
      sv("circle", { cx: 0, cy: -136, r: 20.5, fill: "rgba(255,70,70,.22)" }, hg);
      var vein = sv("g", { transform: "translate(16 -158)" }, hg);
      [0, 90, 180, 270].forEach(function (a) {
        sv("path", { d: "M-4.2 -6.2 Q0 -1 4.2 -6.2", transform: "rotate(" + a + ")", fill: "none", stroke: "#e2323e", "stroke-width": 2.4, "stroke-linecap": "round" }, vein);
      });
    }
    if (band >= 1) {
      sv("path", { d: "M-22.3 -148 Q0 -154 22.3 -148 L22 -141 Q0 -147 -22 -141 Z", fill: "#f3efe6", stroke: "#bdb4a3", "stroke-width": 1.2 }, hg);
      sv("path", { d: "M20 -146 L27 -150 M20 -144 L27 -141", stroke: "#f3efe6", "stroke-width": 3, "stroke-linecap": "round" }, hg);
    }
    if (band >= 2) sv("rect", { x: 7, y: -133, width: 9, height: 4.5, rx: 1, fill: "#f2cfa4", stroke: "#c9a37a", "stroke-width": 0.8, transform: "rotate(-18 11 -131)" }, hg);
    return g;
  }

  function portrait(who, mood, band) {
    var s = sv("svg", { viewBox: "-36 -176 72 76", preserveAspectRatio: "xMidYMid slice" });
    person(s, who, { mood: mood, band: band, noShadow: true });
    return s;
  }

  function figure(who, pose, mood, band, flip) {
    var s = sv("svg", { viewBox: "-62 -184 124 192" });
    person(s, who, { pose: pose, mood: mood, band: band, flip: flip });
    return s;
  }

  /* ================================================================
   * Pools — every kind knows its volume up to height h
   * ================================================================ */

  function nice(x) { return Math.abs(x * 2 - Math.round(x * 2)) < 1e-9; }

  var KINDS = {
    cyl: {
      label: "Cylinder tank",
      gen: function () {
        var H = ri(40, 60), S = H - ri(3, 8);
        return { R: ri(12, 28), H: H, S: S, d: S - ri(2, 9) };
      },
      V: function (p, h) { return PI * p.R * p.R * h; },
      half: function (p) { return p.R; },
      hint: "Cylinder: V = πr²h. The free space is a short cylinder: base area πR², height = the gap between the water and the red line.",
      work: function (p) { return ["Free space = πR² × (S − d) = π × " + p.R + "² × (" + p.S + " − " + p.d + ") = <b>" + piv(p.free) + "</b> cm³"]; },
      wrongs: function (p, dh) { return [{ v: PI * p.R * dh / p.ball, m: "Square the radius: the base area is πR², not πR." }]; },
      topLabel: function (p) { return "R = " + p.R + " cm"; },
    },

    cuboid: {
      label: "Box tank",
      poly: "box",
      noPi: true,
      gen: function () {
        var H = ri(36, 56), S = H - ri(3, 8);
        return { L: 2 * ri(14, 30), W: 2 * ri(10, 20), H: H, S: S, d: S - ri(1, 6) };
      },
      V: function (p, h) { return p.L * p.W * h; },
      half: function (p) { return p.L / 2; },
      hint: "Cuboid: V = length × width × height. The free space is a thin box: length × width × (gap between the water and the red line).",
      work: function (p) { return ["Free space = " + p.L + " × " + p.W + " × (" + p.S + " − " + p.d + ") = <b>" + fmt(p.free) + "</b> cm³"]; },
    },

    tri: {
      label: "Triangle tank",
      poly: "tri",
      noPi: true,
      gen: function () {
        var H = ri(36, 56), S = H - ri(3, 8);
        return { b: 2 * ri(14, 28), t: ri(20, 42), H: H, S: S, d: S - ri(1, 6) };
      },
      V: function (p, h) { return p.b * p.t * h / 2; },
      half: function (p) { return Math.min(p.b, p.t) / 3; },
      hint: "Prism: V = base area × height. The base is a triangle: area = 1/2 × base × height. The free space is a thin triangular prism: base area × (gap between the water and the red line).",
      work: function (p) {
        return [
          "Triangle area = 1/2 × " + p.b + " × " + p.t + " = " + fmt(p.b * p.t / 2) + " cm²",
          "Free space = " + fmt(p.b * p.t / 2) + " × (" + p.S + " − " + p.d + ") = <b>" + fmt(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        return [{ v: p.b * p.t * dh / p.ball, m: "A triangle's area needs the 1/2: area = 1/2 × base × height." }];
      },
    },

    trough: {
      label: "V-shaped trough",
      poly: "trough",
      noPi: true,
      raised: true,
      gen: function () {
        var H = 5 * ri(5, 9), k = pick([0.8, 1, 1.2, 1.5, 2]);
        if (Math.abs(k * H - Math.round(k * H)) > 1e-9) return null;
        var S = H - ri(2, 5), d = S - ri(2, 6);
        if (!nice(k * S) || !nice(k * d)) return null;
        return { w: Math.round(k * H), H: H, Lt: 10 * ri(4, 9), S: S, d: d };
      },
      V: function (p, h) { return p.w * h / p.H * h / 2 * p.Lt; },
      half: function (p, h) { return p.w * h / p.H / 2; },
      hint: "Triangular prism: V = 1/2 × width × height × length. The end of the trough is a triangle, and the water's end is a smaller similar triangle. Width at height h = w/H × h. Free space = (1/2 × width × height at the red line − the same at the water) × length.",
      work: function (p) {
        var wS = p.w * p.S / p.H, wd = p.w * p.d / p.H;
        return [
          "Width at height h = " + p.w + "/" + p.H + " × h → at the red line " + fmt(wS) + " cm, at the water " + fmt(wd) + " cm",
          "Free space = (1/2·" + fmt(wS) + "·" + p.S + " − 1/2·" + fmt(wd) + "·" + p.d + ") × " + p.Lt + " = <b>" + fmt(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        var wS = p.w * p.S / p.H, b = p.ball;
        return [
          { v: wS * dh * p.Lt / b, m: "The sides slope, so the width changes with height. Use (big triangle − small triangle) × length." },
          { v: p.w * dh * p.Lt / b, m: "That uses the top width for the whole layer. The sides slope: (big triangle − small triangle) × length." },
          { v: 2 * p.free / b, m: "A triangle's area needs the 1/2: area = 1/2 × width × height." },
          { v: KINDS.trough.V(p, dh) / b, m: "That's a small V of height S − d. The free space is big triangle minus small triangle, times the length." },
        ];
      },
    },

    cone: {
      label: "Funnel tank (cone)",
      raised: true,
      apex: true,
      gen: function () {
        var H = pick([40, 45, 48, 50, 60]), k = pick([0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.25]);
        if (Math.abs(k * H - Math.round(k * H)) > 1e-9) return null;
        var S = H - ri(2, 6), d = S - ri(2, 6);
        if (!nice(k * S) || !nice(k * d)) return null;
        return { R: Math.round(k * H), H: H, S: S, d: d };
      },
      V: function (p, h) { var q = p.R * h / p.H; return PI * q * q * h / 3; },
      half: function (p, h) { return p.R * h / p.H; },
      hint: "Cone: V = 1/3 πr²h. The water itself is a cone. Its radius at height h is R/H × h (similar triangles). Free space = (cone up to the red line) − (cone up to the water).",
      work: function (p) {
        var rS = p.R * p.S / p.H, rd = p.R * p.d / p.H;
        return [
          "Radius at height h = " + p.R + "/" + p.H + " × h → at the red line " + fmt(rS) + " cm, at the water " + fmt(rd) + " cm",
          "Free space = 1/3·π·" + fmt(rS) + "²·" + p.S + " − 1/3·π·" + fmt(rd) + "²·" + p.d + " = <b>" + piv(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        var rS = p.R * p.S / p.H, b = p.ball;
        return [
          { v: PI * rS * rS * dh / b, m: "The walls slope, so one radius can't be used for the whole layer. Use (cone up to the red line) − (cone up to the water)." },
          { v: PI * p.R * p.R * dh / b, m: "That treats the layer like a cylinder with the top radius. The walls slope: use big cone − small cone." },
          { v: KINDS.cone.V(p, dh) / b, m: "That's a little cone of height S − d. The free space is a ring-shaped layer: big cone minus small cone." },
          { v: PI * p.R * p.R * dh / 3 / b, m: "Both cones can't have radius " + p.R + ". Use similar triangles: radius = " + p.R + "/" + p.H + " × height." },
          { v: 3 * p.free / b, m: "A cone's volume needs the 1/3: V = 1/3 πr²h." },
        ];
      },
      topLabel: function (p) { return "R = " + p.R + " cm"; },
    },

    pyr: {
      label: "Square pyramid tank",
      poly: "pyr",
      noPi: true,
      raised: true,
      apex: true,
      gen: function () {
        var H = 5 * ri(8, 12), S = H - ri(2, 6), d = S - ri(2, 6), a = 4 * ri(10, 20);
        if (!nice(a * S / H) || !nice(a * d / H)) return null;
        return { a: a, H: H, S: S, d: d };
      },
      V: function (p, h) { var q = p.a * h / p.H; return q * q * h / 3; },
      half: function (p, h) { return p.a * h / p.H / 2; },
      hint: "Pyramid: V = 1/3 × base area × height. The water is itself an upside-down pyramid. Its side at height h is a/H × h. Free space = (pyramid up to the red line) − (pyramid up to the water).",
      work: function (p) {
        var sS = p.a * p.S / p.H, sd = p.a * p.d / p.H;
        return [
          "Side at height h = " + p.a + "/" + p.H + " × h → at the red line " + fmt(sS) + " cm, at the water " + fmt(sd) + " cm",
          "Free space = 1/3·" + fmt(sS) + "²·" + p.S + " − 1/3·" + fmt(sd) + "²·" + p.d + " = <b>" + fmt(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        var sS = p.a * p.S / p.H, b = p.ball;
        return [
          { v: sS * sS * dh / b, m: "The walls slope, so one square can't be used for the whole layer. Use (pyramid up to the red line) − (pyramid up to the water)." },
          { v: p.a * p.a * dh / b, m: "That uses the top square for the whole layer. The walls slope: big pyramid − small pyramid." },
          { v: KINDS.pyr.V(p, dh) / b, m: "That's a little pyramid of height S − d. The free space is big pyramid minus small pyramid." },
          { v: 3 * p.free / b, m: "A pyramid's volume needs the 1/3: V = 1/3 × base area × height." },
        ];
      },
    },

    capsule: {
      label: "Round-bottom tank",
      raised: true,
      gen: function () {
        var R = ri(14, 24), H = R + ri(26, 40), S = H - ri(3, 7), d = S - ri(2, 8);
        if (d < R + 4) return null;
        return { R: R, H: H, S: S, d: d };
      },
      V: function (p, h) {
        var R = p.R;
        if (h <= R) return PI * h * h * (3 * R - h) / 3;
        return 2 / 3 * PI * R * R * R + PI * R * R * (h - R);
      },
      half: function (p, h) { return h < p.R ? Math.sqrt(Math.max(0, p.R * p.R - (p.R - h) * (p.R - h))) : p.R; },
      hint: "Cylinder: V = πr²h. The water is already above the hemisphere, so the free space is just a cylinder layer: πR² × (S − d).",
      work: function (p) {
        return [
          "Both levels are above the hemisphere (" + p.R + " cm), so the gap is a cylinder layer",
          "Free space = πR² × (S − d) = π × " + p.R + "² × (" + p.S + " − " + p.d + ") = <b>" + piv(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        var b = p.ball, R = p.R;
        return [
          { v: (p.free + 2 / 3 * PI * R * R * R) / b, m: "The hemisphere at the bottom is already full of water — it isn't free space." },
          { v: PI * R * R * (p.S - R) / b, m: "Xiao Wang's water already fills part of the cylinder too. Only the gap S − d is free." },
        ];
      },
      topLabel: function (p) { return "r = " + p.R + " cm"; },
    },

    frustum: {
      label: "Bucket tank (frustum)",
      gen: function () {
        // radius grows 1 cm every u cm of height, so levels on a u/2 grid give whole or half radii
        var m = pick([4, 5, 6, 8, 10]), u = pick([4, 5, 6, 8]), H = m * u;
        if (H < 24 || H > 50) return null;
        var r1 = ri(Math.max(6, Math.ceil(m * 0.8)), Math.min(18, 2 * m)), step = u % 2 ? u : u / 2;
        var S = H - step * ri(1, 2), d = S - step * ri(1, 2);
        return { r1: r1, r2: r1 + m, H: H, h0: r1 * u, S: S, d: d };
      },
      V: function (p, h) {
        var k = (p.r2 - p.r1) / p.H, a = p.h0 + h;
        return PI * k * k * (a * a * a - p.h0 * p.h0 * p.h0) / 3;
      },
      half: function (p, h) { return p.r1 + (p.r2 - p.r1) * h / p.H; },
      hint: "Cone: V = 1/3 πr²h. Complete the cone: extend the walls down until they meet. Find the extra height with similar triangles, then use big cone − small cone.",
      work: function (p) {
        var rS = KINDS.frustum.half(p, p.S), rd = KINDS.frustum.half(p, p.d);
        return [
          "Extend the walls down to a point: extra height x = " + p.H + " × " + p.r1 + " ÷ (" + p.r2 + " − " + p.r1 + ") = " + fmt(p.h0) + " cm, so the full cone is " + fmt(p.h0) + " + " + p.H + " = " + fmt(p.h0 + p.H) + " cm tall",
          "From the point: red line " + fmt(p.h0) + " + " + p.S + " = " + fmt(p.h0 + p.S) + " cm → r = " + p.r2 + " × " + fmt(p.h0 + p.S) + "/" + fmt(p.h0 + p.H) + " = " + fmt(rS) + " cm; water " + fmt(p.h0) + " + " + p.d + " = " + fmt(p.h0 + p.d) + " cm → r = " + p.r2 + " × " + fmt(p.h0 + p.d) + "/" + fmt(p.h0 + p.H) + " = " + fmt(rd) + " cm",
          "Free space = 1/3·π·" + fmt(rS) + "²·" + fmt(p.h0 + p.S) + " − 1/3·π·" + fmt(rd) + "²·" + fmt(p.h0 + p.d) + " = <b>" + piv(p.free) + "</b> cm³",
        ];
      },
      wrongs: function (p, dh) {
        var K = KINDS.frustum, rS = K.half(p, p.S), rd = K.half(p, p.d), b = p.ball;
        return [
          { v: PI * (rS * rS * p.S - rd * rd * p.d) / 3 / b, m: "Measure the cone heights from the apex (" + fmt(p.h0) + " cm below the bottom), not from the bottom of the tank." },
          { v: PI * rS * rS * dh / b, m: "The walls slope, so one radius can't be used for the whole layer. Use big cone − small cone." },
          { v: PI * Math.pow((rS + rd) / 2, 2) * dh / b, m: "Averaging the two radii only gives an estimate. Use big cone − small cone for the exact space." },
        ];
      },
      topLabel: function (p) { return "top r = " + p.r2 + " cm"; },
    },
  };

  function levelFor(P, vol) {
    var lo = 0, hi = P.H * 1.8;
    if (P.K.V(P, hi) < vol) return hi;
    for (var i = 0; i < 50; i++) {
      var m = (lo + hi) / 2;
      if (P.K.V(P, m) < vol) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  // One ball's volume is given to the player: a multiple of π for round tanks, a plain number for box/pyramid tanks.
  var BALL_PI = [4.5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30, 32, 36, 40, 45, 48, 50, 60];
  var BALL_PLAIN = [20, 25, 30, 40, 45, 50, 60, 64, 75, 80, 100, 120, 125, 150];
  // Later pools may give only the ball's radius or diameter; volume = 4/3·π·r³.
  var BALL_R = [1.5, 2, 2.5, 3];
  // Balls are drawn at this fraction of their true size.
  var BALL_VIS = 0.6;

  function finishPool(p, kind, o) {
    var K = KINDS[kind];
    p.kind = kind;
    p.K = K;
    p.fromRim = !!o.fromRim;
    p.opts = o;
    p.ball = K.noPi && !p.ballPi ? p.bc : p.bc * PI;
    p.r = Math.cbrt(3 * p.ball / (4 * PI));
    p.free = K.V(p, p.S) - K.V(p, p.d);
    p.ratio = p.free / p.ball;
    p.N = Math.floor(p.ratio + 1e-9);
    return p;
  }

  function makePool(kind, o) {
    o = o || {};
    var K = KINDS[kind];
    for (var t = 0; t < 800; t++) {
      var p = K.gen();
      if (!p || !(p.d >= 3 && p.S > p.d && p.S < p.H)) continue;
      if (o.ballR) {
        var rb = pick(BALL_R);
        p.bc = 4 * rb * rb * rb / 3;
        p.ballPi = true;
        p.ballGiven = Math.random() < 0.5 ? "d" : "r";
      } else p.bc = pick(K.noPi ? BALL_PLAIN : BALL_PI);
      finishPool(p, kind, o);
      var f = p.ratio - p.N;
      if (f < 0.12 || f > 0.88) continue;
      if (p.N < (o.min || 10) || p.N > (o.max || 90)) continue;
      if (K.V(p, p.d) < 0.9 * p.free) continue;
      if (p.r > 0.25 * K.half(p, p.d)) continue;
      return p;
    }
    return makePool("cyl", { min: 10, max: 120 });
  }

  function ballText(P) { return P.K.noPi && !P.ballPi ? fmt(P.bc) + " cm³" : fmt(P.bc) + "π cm³"; }
  function ballExpr(P) { return P.K.noPi && !P.ballPi ? fmt(P.bc) : P.K.noPi ? "(" + fmt(P.bc) + "π)" : fmt(P.bc) + "π"; }
  function ballGivenText(P) { return P.ballGiven === "d" ? "diameter " + fmt(2 * P.r) + " cm" : "radius " + fmt(P.r) + " cm"; }
  function volText(P, v) { return P.K.noPi ? fmt(v) : piv(v); }

  function workLines(P) {
    var L = [];
    if (P.fromRim) L.push("Heights: red line " + P.H + " − " + fmt(P.H - P.S) + " = " + P.S + " cm, water " + P.H + " − " + fmt(P.H - P.d) + " = " + P.d + " cm");
    L = L.concat(P.K.work(P));
    if (P.ballGiven) L.push("One ball = 4/3 π r³" + (P.ballGiven === "d" ? ", r = " + fmt(2 * P.r) + " ÷ 2 = " + fmt(P.r) + " cm" : "") + " → 4/3 π × " + fmt(P.r) + "³ = " + ballText(P));
    L.push(volText(P, P.free) + " ÷ " + ballExpr(P) + " = " + fmt(P.ratio) + " → round down → <b>" + P.N + " balls</b>");
    return L;
  }

  /* ---------- "See solution" window: step cards + a side-view figure ---------- */

  var STEP_T = {
    cyl: ["Free space up to the red line"],
    cuboid: ["Free space up to the red line"],
    tri: ["Area of the triangle base", "Free space up to the red line"],
    trough: ["Width at each level (similar triangles)", "Free space = (big triangle − small triangle) × length"],
    cone: ["Radius at each level (similar triangles)", "Free space = big cone − small cone"],
    pyr: ["Side at each level (similar triangles)", "Free space = big pyramid − small pyramid"],
    capsule: ["Where are the two levels?", "Free space up to the red line"],
    frustum: ["Complete the cone", "Radius at each level (similar triangles)", "Free space = big cone − small cone"],
  };

  function solSteps(P) {
    var S = [];
    if (P.fromRim) S.push({ h: "Turn “below the rim” into heights", l: ["Red line: " + P.H + " − " + fmt(P.H - P.S) + " = " + P.S + " cm", "Water: " + P.H + " − " + fmt(P.H - P.d) + " = " + P.d + " cm"] });
    var titles = STEP_T[P.kind] || [];
    P.K.work(P).forEach(function (line, i) {
      S.push({ h: titles[i] || "Free space", l: line.split(/; | → (?=at )|, so /) });
    });
    if (P.ballGiven) {
      var bl = ["V = 4/3 π r³"];
      if (P.ballGiven === "d") bl.push("r = " + fmt(2 * P.r) + " ÷ 2 = " + fmt(P.r) + " cm");
      bl.push("4/3 π × " + fmt(P.r) + "³ = <b>" + ballText(P) + "</b>");
      S.push({ h: "Volume of one ball", l: bl });
    }
    S.push({ h: "How many balls fit?", l: [volText(P, P.free) + " ÷ " + ballExpr(P) + " = " + fmt(P.ratio)] });
    S.push({ h: "Round DOWN", l: [(P.N + 1) + " balls would push the water over the red line, so the answer is " + P.N + " balls."], pill: P.N + " balls" });
    return S;
  }

  var SOL_LVL = {
    cone: function (p, h) { return "r = " + fmt(p.R * h / p.H); },
    pyr: function (p, h) { return "side " + fmt(p.a * h / p.H); },
    trough: function (p, h) { return "width " + fmt(p.w * h / p.H); },
    frustum: function (p, h) { return "r = " + fmt(KINDS.frustum.half(p, h)); },
  };
  var SOL_DIM = {
    cyl: function (p) { return "R = " + p.R + " cm"; },
    cuboid: function (p) { return p.L + " cm × " + p.W + " cm base"; },
    tri: function (p) { return "triangle base " + p.b + " cm, height " + p.t + " cm"; },
    trough: function (p) { return "top " + p.w + " cm, length " + p.Lt + " cm"; },
    cone: function (p) { return "R = " + p.R + " cm, H = " + p.H + " cm"; },
    pyr: function (p) { return "square top " + p.a + " cm, H = " + p.H + " cm"; },
    capsule: function (p) { return "r = " + p.R + " cm"; },
    frustum: function (p) { return "bottom r = " + p.r1 + ", top r = " + p.r2 + " cm"; },
  };

  function solFig(P) {
    var K = P.K, W = 360, Hh = 300, cx = 120, base = 262, n = 48, i, h;
    var half = function (hh) { return K.poly === "box" ? P.L / 2 : K.poly === "tri" ? P.b / 2 : K.half(P, hh); };
    var maxHalf = 0;
    for (i = 0; i <= n; i++) maxHalf = Math.max(maxHalf, half(P.H * i / n));
    var s = Math.min(95 / maxHalf, 215 / P.H);
    var Y = function (hh) { return base - hh * s; };
    function band(h0, h1) {
      var L = [], R = [];
      for (i = 0; i <= n; i++) { h = h0 + (h1 - h0) * i / n; var w = half(h) * s; L.push((cx - w).toFixed(1) + "," + Y(h).toFixed(1)); R.unshift((cx + w).toFixed(1) + "," + Y(h).toFixed(1)); }
      return L.concat(R).join(" ");
    }
    var hid = "hd-solhatch" + (++uid);
    var out = '<svg viewBox="0 0 ' + W + " " + Hh + '" class="hd-sol-svg">' +
      '<defs><pattern id="' + hid + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(255,179,71,.28)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,179,71,.75)" stroke-width="3"/></pattern></defs>';
    out += '<polygon points="' + band(0, P.H) + '" fill="rgba(160,190,220,.08)"/>';
    out += '<polygon points="' + band(0, P.d) + '" fill="rgba(63,216,207,.55)"/>';
    out += '<polygon points="' + band(P.d, P.S) + '" fill="url(#' + hid + ')"/>';
    out += '<polygon points="' + band(0, P.H) + '" fill="none" stroke="#c9d5e2" stroke-width="2.5" stroke-linejoin="round"/>';
    var wS = half(P.S) * s, wd = half(P.d) * s, wH = half(P.H) * s;
    out += '<line x1="' + (cx - wS - 6) + '" y1="' + Y(P.S) + '" x2="' + (cx + wS + 6) + '" y2="' + Y(P.S) + '" stroke="#ff4d5e" stroke-width="2.5" stroke-dasharray="7 5"/>';
    out += '<line x1="' + (cx - wd) + '" y1="' + Y(P.d) + '" x2="' + (cx + wd) + '" y2="' + Y(P.d) + '" stroke="#bffaf5" stroke-width="2"/>';
    var bx = cx + Math.max(wS, wd, wH) + 8, tx = bx + 22;
    out += '<path d="M' + (bx - 3) + " " + Y(P.S) + " H" + bx + " V" + Y(P.d) + " H" + (bx - 3) + '" fill="none" stroke="#ffb347" stroke-width="2"/>';
    var yF = (Y(P.S) + Y(P.d)) / 2 + 4, yR = Math.min(Y(P.S) + 4, yF - 17), yW = Math.max(Y(P.d) + 4, yF + 17);
    [[Y(P.S), yR, "#ff7a86"], [(Y(P.S) + Y(P.d)) / 2, yF, "#ffb347"], [Y(P.d), yW, "#5fe6dc"]].forEach(function (q) {
      out += '<line x1="' + (bx + 2) + '" y1="' + q[0] + '" x2="' + (tx - 3) + '" y2="' + (q[1] - 4) + '" stroke="' + q[2] + '" stroke-width="1.2"/>';
    });
    out += '<text x="' + tx + '" y="' + yR + '" class="r">red line ' + P.S + ' cm</text>';
    out += '<text x="' + tx + '" y="' + yF + '" class="a">free space</text>';
    out += '<text x="' + tx + '" y="' + yW + '" class="t">water ' + P.d + ' cm</text>';
    var lvl = SOL_LVL[P.kind];
    if (lvl) {
      out += '<text x="' + cx + '" y="' + (Y(P.S) - 6) + '" class="w" text-anchor="middle">' + lvl(P, P.S) + "</text>";
      out += '<text x="' + cx + '" y="' + (Y(P.d) + 16) + '" class="w" text-anchor="middle">' + lvl(P, P.d) + "</text>";
    }
    out += '<text x="' + cx + '" y="' + (base + 24) + '" class="m" text-anchor="middle">' + (SOL_DIM[P.kind] ? SOL_DIM[P.kind](P) : "") + "</text>";
    out += '<circle cx="' + (W - 112) + '" cy="' + (Hh - 18) + '" r="8" fill="#b8c3d0" stroke="#384252" stroke-width="2"/>';
    out += '<text x="' + (W - 98) + '" y="' + (Hh - 13) + '" class="m">' + (P.ballGiven ? "ball " + ballGivenText(P) : "1 ball = " + ballText(P)) + "</text>";
    return out + "</svg>";
  }

  function solutionHTML(P, sub) {
    return '<div class="hd-sol-head"><div><div class="hd-sol-h">Solution</div><div class="hd-sol-sub">' + sub + "</div></div>" +
      '<button type="button" class="hd-sol-x" aria-label="Close">×</button></div>' +
      '<div class="hd-sol-body"><div class="hd-sol-fig">' + solFig(P) + "</div>" +
      '<ol class="hd-sol-steps">' + solSteps(P).map(function (st, i) {
        return '<li class="c' + (i % 4) + '"><span class="hd-sol-n">' + (i + 1) + "</span><div><div class=\"hd-sol-t\">" + st.h + "</div>" +
          st.l.map(function (x) { return "<p>" + x + "</p>"; }).join("") +
          (st.pill ? '<div class="hd-sol-pill">' + st.pill + "</div>" : "") + "</div></li>";
      }).join("") + "</ol></div>";
  }

  function hintsFor(P) {
    return [
      "Free space = the volume between the water surface and the red line." + (P.fromRim ? " First turn the “below the rim” numbers into heights: " + P.H + " − distance." : ""),
      P.K.hint,
      P.ballGiven
        ? "Each ball is a sphere: V = 4/3πr³" + (P.ballGiven === "d" ? " (radius = diameter ÷ 2)" : "") + ". Max balls = free space ÷ one ball. Then round DOWN."
        : "Max balls = free space ÷ " + ballText(P) + ". Then round DOWN.",
    ];
  }

  function allWrongs(P) {
    var K = P.K, ball = P.ball, dh = P.S - P.d, w = [];
    w.push({ v: K.V(P, P.S) / ball, m: "You counted the whole tank up to the red line, but Xiao Wang's water is already in there. Only the gap between the water surface and the red line is free." });
    w.push({ v: (K.V(P, P.H) - K.V(P, P.d)) / ball, m: "You filled up to the rim. The red line is the limit, not the rim." });
    w.push({ v: K.V(P, P.d) / ball, m: "That's the water already in the tank. You want the EMPTY space above it, up to the red line." });
    if (P.fromRim) w.push({ v: (K.V(P, P.H - P.d) - K.V(P, P.H - P.S)) / ball, m: "Those numbers are measured DOWN from the rim. Height above the bottom = " + P.H + " − distance below the rim." });
    if (P.ballGiven) {
      if (P.ballGiven === "d") w.push({ v: P.free / (ball * 8), m: "That's the diameter! Halve it first: radius = " + fmt(2 * P.r) + " ÷ 2 = " + fmt(P.r) + " cm." });
      w.push({ v: P.free / (ball * 0.75), m: "A sphere's volume needs the 4/3: V = 4/3πr³." });
      w.push({ v: P.free / (ball / P.r), m: "Cube the radius: V = 4/3πr³, not r²." });
      if (K.noPi) w.push({ v: P.free / P.bc, m: "One ball is " + ballText(P) + ". Don't drop the π (π ≈ 3.14)." });
    }
    return (K.wrongs ? K.wrongs(P, dh) : []).concat(w);
  }

  function diagnose(P, n) {
    if (n === P.N + 1) return "Free space ÷ one ball = " + fmt(P.ratio) + ", and you rounded up. Ball number " + n + " pushes the water over the red line, so always round DOWN.";
    var w = allWrongs(P);
    for (var i = 0; i < w.length; i++) {
      var v = w[i].v;
      if (!isFinite(v) || v <= 0) continue;
      if ((n === Math.floor(v + 1e-9) || n === Math.round(v)) && n !== P.N) return w[i].m;
    }
    return null;
  }

  /* ================================================================
   * Board
   * ================================================================ */

  var board = sv("svg", { class: "hd-board", viewBox: "0 0 1280 720", preserveAspectRatio: "xMidYMid meet" }, stage);
  var panel = el("div", "hd-ui");
  stage.appendChild(panel);
  var flashRed = el("div", "hd-flash red");
  var flashSteam = el("div", "hd-flash steam");
  stage.appendChild(flashRed);
  stage.appendChild(flashSteam);

  var gen = 0, uid = 0, hud = null;

  function anim(dur, step, done) {
    var g = gen, t0 = null;
    function f(ts) {
      if (g !== gen) return;
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      step(k);
      if (k < 1) requestAnimationFrame(f);
      else if (done) done();
    }
    requestAnimationFrame(f);
  }
  function wait(ms, fn) { var g = gen; setTimeout(function () { if (g === gen) fn(); }, ms); }
  function flash(node) { node.classList.remove("on"); void node.offsetWidth; node.classList.add("on"); }
  function shake() { stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); }

  function freshBoard() {
    gen++;
    board.innerHTML = "";
    hud = null;
    var defs = sv("defs", {}, board);
    glowFilter(defs, "hd-glow", 4);
    glowFilter(defs, "hd-glow-lg", 9);
    blurFilter(defs, "hd-blur", 6);
    blurFilter(defs, "hd-blur-sm", 2.5);
    grad(defs, "hd-hot", [[0, "#ff9a7a"], [0.28, "#ec4426"], [0.6, "#a8261a"], [0.84, "#5e3634"], [1, "#3b3739"]], { radial: true, cx: "38%", cy: "35%", r: "65%" });
    grad(defs, "hd-steel", [[0, "#f3f6fa"], [0.32, "#b8c3d0"], [1, "#384252"]], { radial: true, cx: "35%", cy: "30%", r: "70%" });
    grad(defs, "hd-water", [[0, "#58e6dc", 0.6], [1, "#0b4a66", 0.88]]);
    grad(defs, "hd-surface", [[0, "#7ff0e8", 0.55], [0.5, "#d3fffb", 0.92], [1, "#7ff0e8", 0.55]], { x2: "1", y2: "0" });
    grad(defs, "hd-interior", [[0, "#13222f", 0.95], [1, "#060b12", 0.97]]);
    grad(defs, "hd-glass", [[0, "#ffffff", 0.17], [0.12, "#ffffff", 0.03], [0.78, "#ffffff", 0], [0.9, "#ffffff", 0.11], [1, "#ffffff", 0.02]], { x2: "1", y2: "0" });
    grad(defs, "hd-floor", [[0, "#1d2532"], [1, "#07090d"]]);
    grad(defs, "hd-vig", [[0.55, "#000", 0], [1, "#000", 0.6]], { radial: true, r: "75%" });
    grad(defs, "hd-shade", [[0, "#05080d", 0.62], [0.5, "#05080d", 0.25], [1, "#05080d", 0.7]]);
    grad(defs, "hd-pipe", [[0, "#3c4654"], [0.45, "#a9b5c3"], [1, "#2e3742"]], { x2: "1", y2: "0" });
    grad(defs, "hd-lamp", [[0, "#ffcf8a", 0.32], [1, "#ffcf8a", 0]], { radial: true });
    var hatch = sv("pattern", { id: "hd-hatch", width: 10, height: 10, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    sv("rect", { width: 10, height: 10, fill: "rgba(255,179,71,.12)" }, hatch);
    sv("rect", { width: 4, height: 10, fill: "rgba(255,179,71,.45)" }, hatch);
    var scan = sv("pattern", { id: "hd-scan", width: 4, height: 4, patternUnits: "userSpaceOnUse" }, defs);
    sv("rect", { width: 4, height: 1.4, fill: "rgba(0,0,0,.4)" }, scan);
    return { root: sv("g", {}, board), defs: defs };
  }

  function backdrop(root, defs) {
    var cp = sv("clipPath", { id: "hd-frame" }, root);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16 }, cp);
    var g = sv("g", { "clip-path": "url(#hd-frame)" }, root);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "#0b1119" }, g);
    sv("image", { href: ART + "hd-play.jpg" + AV, x: FR.x, y: FR.y, width: FR.w, height: FR.h, preserveAspectRatio: "xMidYMid slice", opacity: 0.62 }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#hd-shade)" }, g);
    var wx = 730, wy = 118, ww = 160, wh = 132;
    grad(defs, "hd-sky", [[0, "#5d6fb4"], [0.55, "#e9977a"], [1, "#ffd79c"]], { x2: "0", y2: "1" });
    grad(defs, "hd-shaft", [[0, "#ffd9a0", 0.42], [1, "#ffd9a0", 0]], { x2: "0", y2: "1" });
    sv("rect", { x: wx - 7, y: wy - 7, width: ww + 14, height: wh + 14, rx: 3, fill: "#151b24", stroke: "#3a4452", "stroke-width": 3 }, g);
    sv("rect", { x: wx, y: wy, width: ww, height: wh, fill: "#0a1322" }, g);
    [[756, 140], [812, 132], [862, 168], [790, 196]].forEach(function (s) { sv("circle", { cx: s[0], cy: s[1], r: 1.3, fill: "#c9d6f2", opacity: 0.7 }, g); });
    var sky = sv("rect", { x: wx, y: wy, width: ww, height: wh, fill: "url(#hd-sky)", opacity: 0 }, g);
    for (var mi = 1; mi < 3; mi++) line(g, { x: wx + ww * mi / 3, y: wy }, { x: wx + ww * mi / 3, y: wy + wh }, "#151b24", 5);
    line(g, { x: wx, y: wy + wh / 2 }, { x: wx + ww, y: wy + wh / 2 }, "#151b24", 5);
    sv("rect", { x: wx - 12, y: wy + wh + 6, width: ww + 24, height: 7, rx: 2, fill: "#2a323e" }, g);
    var lamps = [];
    [[200, 70], [620, 60], [1000, 70]].forEach(function (l) {
      lamps.push(sv("ellipse", { cx: l[0], cy: l[1] + 70, rx: 170, ry: 120, fill: "url(#hd-lamp)" }, g));
      line(g, { x: l[0], y: FR.y }, { x: l[0], y: l[1] }, "#2a323e", 2);
      sv("path", { d: "M" + (l[0] - 16) + " " + (l[1] + 10) + " L" + (l[0] + 16) + " " + (l[1] + 10) + " L" + (l[0] + 8) + " " + l[1] + " L" + (l[0] - 8) + " " + l[1] + " Z", fill: "#3a4452" }, g);
      lamps.push(sv("ellipse", { cx: l[0], cy: l[1] + 11, rx: 10, ry: 3, fill: "#ffe2b0", filter: "url(#hd-glow)" }, g));
    });
    var shafts = sv("g", { opacity: 0, filter: "url(#hd-blur)" }, g);
    sv("polygon", { points: [wx, wy + wh, wx + ww, wy + wh, wx + ww - 70, FLOOR + 6, wx - 190, FLOOR + 6].join(" "), fill: "url(#hd-shaft)" }, shafts);
    sv("ellipse", { cx: wx - 60, cy: FLOOR + 8, rx: 150, ry: 14, fill: "#ffcf8a", opacity: 0.18 }, shafts);
    function dawn(p) {
      var d = clamp((p - 0.6) / 0.4, 0, 1);
      sky.setAttribute("opacity", d.toFixed(3));
      shafts.setAttribute("opacity", (d * d).toFixed(3));
      lamps.forEach(function (l) { l.setAttribute("opacity", (1 - 0.5 * d).toFixed(3)); });
    }
    sv("rect", { x: FR.x, y: FLOOR, width: FR.w, height: FR.y + FR.h - FLOOR, fill: "url(#hd-floor)" }, g);
    for (var x = FR.x - 20; x < FR.x + FR.w; x += 28) {
      sv("path", { d: "M" + x + " " + FLOOR + " L" + (x + 14) + " " + FLOOR + " L" + (x + 22) + " " + (FLOOR + 8) + " L" + (x + 8) + " " + (FLOOR + 8) + " Z", fill: "#e8b23a", opacity: 0.75 }, g);
    }
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#hd-vig)" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 16, fill: "none", stroke: "rgba(255,179,71,.2)", "stroke-width": 1.5 }, root);
    return { dawn: dawn, clipped: g };
  }

  /* ---------- the tank ---------- */

  function buildTank(root, defs, P) {
    var K = P.K, H = P.H, T = { P: P };
    var base = FLOOR - (K.raised ? 26 : 10), s;
    if (K.poly) {
      var dz = { box: P.W, tri: P.t, pyr: P.a, trough: P.Lt }[K.poly], wx = { box: P.L, tri: P.b, pyr: P.a, trough: P.w }[K.poly];
      s = Math.min(420 / (wx + dz * OX), 350 / (H + dz * OY));
    } else s = Math.min(350 / H, 200 / Math.max(K.half(P, 0), K.half(P, H)));
    T.s = s;
    T.base = base;
    var G = sv("g", {}, root);
    var clipId = "hd-tclip" + (++uid);
    var clip = sv("clipPath", { id: clipId }, defs);

    if (!K.poly) buildRound();
    else buildPoly();

    /* ── round tanks: cylinder, cone, capsule, frustum ── */
    function buildRound() {
      function half(h) { return K.half(P, h) * s; }
      function Y(h) { return base - h * s; }
      T.Y = Y;
      var topW = half(H), botW = half(0), maxW = Math.max(topW, botW);
      T.left = CX - maxW;
      T.right = CX + maxW;
      T.top = Y(H) - topW * ELL;
      T.rimLeft = { x: CX - topW + 12, y: Y(H) - 2 };
      T.edge = function (h) { return { x: CX + half(Math.min(h, H)), y: Y(Math.min(h, H)) }; };
      T.surface = function (h) { var hh = clamp(h, 0, H); return { x: CX, y: Y(hh), hw: half(hh) * 0.7 }; };
      T.rowCenter = function (y) { return { x: CX, y: Y(y) }; };

      function side(h) {
        var n = 56, Lp = [], Rp = [];
        for (var i = 0; i <= n; i++) {
          var y = h * (1 - Math.cos(i / n * PI / 2)), w = half(y);
          Lp.push({ x: CX - w, y: Y(y) });
          Rp.push({ x: CX + w, y: Y(y) });
        }
        return { L: Lp, R: Rp, n: n };
      }
      function prof(h, closeTop) {
        var S = side(h), d = "M" + pt(S.L[S.n]), i;
        for (i = S.n - 1; i >= 0; i--) d += " L" + pt(S.L[i]);
        d += botW > 0.5 ? " A" + botW.toFixed(1) + " " + (botW * ELL).toFixed(1) + " 0 0 0 " + pt(S.R[0]) : " L" + pt(S.R[0]);
        for (i = 1; i <= S.n; i++) d += " L" + pt(S.R[i]);
        if (closeTop == null) return d;
        var w = half(h);
        return d + " A" + w.toFixed(1) + " " + (w * ELL).toFixed(1) + " 0 0 " + (closeTop ? 0 : 1) + " " + pt(S.L[S.n]) + " Z";
      }
      function arc(h, front) {
        var w = half(h), y = Y(h);
        return "M" + (CX - w).toFixed(1) + " " + y.toFixed(1) + " A" + w.toFixed(1) + " " + (w * ELL).toFixed(1) + " 0 0 " + (front ? 0 : 1) + " " + (CX + w).toFixed(1) + " " + y.toFixed(1);
      }
      function band(h1, h2) {
        var S1 = side(h2), w1 = half(h1), w2 = half(h2), d, i, k0 = 0;
        while (k0 < S1.n && S1.L[k0].y > Y(h1)) k0++;
        d = "M" + pt(S1.L[S1.n]);
        for (i = S1.n - 1; i >= k0; i--) d += " L" + pt(S1.L[i]);
        d += " L" + (CX - w1).toFixed(1) + " " + Y(h1).toFixed(1);
        d += " A" + w1.toFixed(1) + " " + (w1 * ELL).toFixed(1) + " 0 0 0 " + (CX + w1).toFixed(1) + " " + Y(h1).toFixed(1);
        for (i = k0; i <= S1.n; i++) d += " L" + pt(S1.R[i]);
        d += " A" + w2.toFixed(1) + " " + (w2 * ELL).toFixed(1) + " 0 0 1 " + pt(S1.L[S1.n]) + " Z";
        return d;
      }
      T.bandPath = band;

      sv("ellipse", { cx: CX, cy: FLOOR + 3, rx: maxW * 1.08 + 12, ry: 12, fill: "rgba(0,0,0,.5)", filter: "url(#hd-blur)" }, G);
      if (K.raised) {
        [-1, 1].forEach(function (sg) {
          var x0 = CX + sg * (topW - 6), x1 = CX + sg * (topW + 12);
          line(G, { x: x0, y: Y(H) + 6 }, { x: x1, y: FLOOR }, "#4b5665", 8);
          line(G, { x: x0, y: Y(H) + 6 }, { x: x1, y: FLOOR }, "#7b8898", 2.5);
          sv("rect", { x: x1 - 10, y: FLOOR - 5, width: 20, height: 6, rx: 2, fill: "#2c343f" }, G);
        });
        line(G, { x: CX - topW - 4, y: FLOOR - 26 }, { x: CX + topW + 4, y: FLOOR - 26 }, "#3e4856", 5);
      } else {
        sv("rect", { x: CX - botW - 10, y: base - 2, width: 2 * botW + 20, height: FLOOR - base + 4, rx: 3, fill: "#2a323d", stroke: "#45505f", "stroke-width": 2 }, G);
      }
      var inner = prof(H, true);
      sv("path", { d: inner }, clip);
      sv("path", { d: inner, fill: "url(#hd-interior)" }, G);
      sv("path", { d: arc(H, false), fill: "none", stroke: "#6f7d8d", "stroke-width": 5 }, G);
      T.redBack = sv("path", { d: arc(P.S, false), fill: "none", stroke: C.rd, "stroke-width": 2.5, "stroke-dasharray": "8 7", opacity: 0.45 }, G);
      var inside = sv("g", { "clip-path": "url(#" + clipId + ")" }, G);
      T.waterBody = sv("path", { fill: "url(#hd-water)" }, inside);
      T.pileG = sv("g", { opacity: 0.85 }, inside);
      T.waterTop = sv("ellipse", { cx: CX, fill: "url(#hd-surface)", stroke: "rgba(210,255,250,.65)", "stroke-width": 1.2 }, inside);
      T.wasteG = sv("g", {}, inside);
      T.fall = sv("g", {}, G);
      sv("path", { d: inner, fill: "url(#hd-glass)" }, G);
      [0.33, 0.66].forEach(function (f) { if (H * f > 2) sv("path", { d: arc(H * f, true), fill: "none", stroke: "rgba(205,215,228,.22)", "stroke-width": 3 }, G); });
      sv("path", { d: prof(H), fill: "none", stroke: "#b9c5d3", "stroke-width": 4, "stroke-linejoin": "round" }, G);
      T.redFront = sv("path", { d: arc(P.S, true), fill: "none", stroke: C.rd, "stroke-width": 3.4, "stroke-dasharray": "11 6", filter: "url(#hd-glow)" }, G);
      sv("path", { d: arc(H, true), fill: "none", stroke: "#dbe3ec", "stroke-width": 6, "stroke-linecap": "round" }, G);
      if (botW > 0.5) sv("path", { d: arc(0, true), fill: "none", stroke: "#8794a3", "stroke-width": 4 }, G);

      T.setWater = function (h) {
        T.level = h;
        var hh = Math.min(h, H);
        if (hh <= 0.05) { T.waterBody.setAttribute("d", ""); T.waterTop.setAttribute("rx", 0); T.waterTop.setAttribute("ry", 0); return; }
        T.waterBody.setAttribute("d", prof(hh, false));
        var w = half(hh);
        T.waterTop.setAttribute("cy", Y(hh));
        T.waterTop.setAttribute("rx", w);
        T.waterTop.setAttribute("ry", w * ELL);
      };
      T.wasted = function (h) { sv("path", { d: band(h, P.S), fill: "url(#hd-hatch)", stroke: C.am, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, T.wasteG); };

      // labels: top radius, frustum bottom radius, height
      var labels = T.labels = sv("g", {}, root);
      if (K.topLabel) {
        line(labels, { x: CX, y: Y(H) }, { x: CX + topW, y: Y(H) }, C.am, 2, { "stroke-dasharray": "5 4" });
        sv("circle", { cx: CX, cy: Y(H), r: 3.2, fill: C.am }, labels);
        txt(labels, CX + topW / 2, Y(H) - 9, K.topLabel(P), { size: 20, weight: 800, fill: "#ffe0b8" });
      }
      if (P.kind === "frustum") {
        line(labels, { x: CX, y: Y(0) }, { x: CX + botW, y: Y(0) }, C.am, 2, { "stroke-dasharray": "5 4" });
        txt(labels, CX + botW / 2, FLOOR + 22, "bottom r = " + P.r1 + " cm", { size: 19, weight: 800, fill: "#ffe0b8" });
      }
      dimV(labels, T.left - 26, Y(0), Y(H), H + " cm");
    }

    /* ── flat-sided tanks: box, triangle prism, upside-down pyramid, V-trough ── */
    function buildPoly() {
      var kind = K.poly, prism = kind === "box" || kind === "tri";
      var D = { box: P.W, tri: P.t, pyr: P.a, trough: P.Lt }[kind];
      var zc = kind === "tri" ? P.t / 3 : D / 2;
      var cx0 = CX - D * s * OX / 2;
      function P3(x, y, z) { return { x: cx0 + x * s + z * s * OX, y: base - y * s - z * s * OY }; }
      // ring(h): the horizontal cross-section at height h, front edge first, going round.
      function ring(h) {
        if (kind === "box") return [P3(-P.L / 2, h, 0), P3(P.L / 2, h, 0), P3(P.L / 2, h, D), P3(-P.L / 2, h, D)];
        if (kind === "tri") return [P3(-P.b / 2, h, 0), P3(P.b / 2, h, 0), P3(0, h, D)];
        var q;
        if (kind === "pyr") {
          q = P.a * h / H;
          return [P3(-q / 2, h, zc - q / 2), P3(q / 2, h, zc - q / 2), P3(q / 2, h, zc + q / 2), P3(-q / 2, h, zc + q / 2)];
        }
        q = P.w * h / H;
        return [P3(-q / 2, h, 0), P3(q / 2, h, 0), P3(q / 2, h, D), P3(-q / 2, h, D)];
      }
      var bot = prism ? ring(0) : null;
      var apex = kind === "pyr" ? P3(0, 0, zc) : null;
      var a0 = kind === "trough" ? P3(0, 0, 0) : null, aL = kind === "trough" ? P3(0, 0, D) : null;
      // bottom points under ring edge i (from vertex i to vertex i+1)
      function under(i, n) {
        if (prism) return [bot[i], bot[(i + 1) % n]];
        if (apex) return [apex];
        return [[a0], [a0, aL], [aL], [aL, a0]][i];
      }
      function solid(h) {
        var r = ring(h);
        if (prism) return ring(0).concat(r);
        return (apex ? [apex] : [a0, aL]).concat(r);
      }
      var top = ring(H), n = top.length;
      function area(poly) {
        var a = 0;
        for (var i = 0; i < poly.length; i++) { var p = poly[i], q2 = poly[(i + 1) % poly.length]; a += p.x * q2.y - q2.x * p.y; }
        return a;
      }
      var faces = [], frontSign = 0;
      for (var i = 0; i < n; i++) {
        var f = under(i, n).concat([top[(i + 1) % n], top[i]]);
        var a = area(f);
        if (i === 0) frontSign = Math.sign(a);
        faces.push({ pts: f, vis: Math.abs(a) > 1 && Math.sign(a) === frontSign });
      }
      var start = 0;
      while (start < n && !(faces[start].vis && !faces[(start - 1 + n) % n].vis)) start++;
      if (start >= n) start = 0;
      var visIdx = [], hidIdx = [];
      for (var k = 0; k < n; k++) { var j = (start + k) % n; (faces[j].vis ? visIdx : hidIdx).push(j); }
      function chain(idx, r) {
        if (!idx.length) return [];
        var out = [r[idx[0]]];
        idx.forEach(function (j) { out.push(r[(j + 1) % n]); });
        return out;
      }

      var all = solid(H);
      T.Y = prism ? function (h) { return base - h * s; } : function (h) { return P3(0, h, zc).y; };
      T.left = Math.min.apply(null, all.map(function (p) { return p.x; }));
      T.right = Math.max.apply(null, all.map(function (p) { return p.x; }));
      T.top = Math.min.apply(null, top.map(function (p) { return p.y; }));
      T.rimLeft = { x: (top[0].x + top[n - 1].x) / 2 + 10, y: (top[0].y + top[n - 1].y) / 2 };
      T.edge = function (h) { return ring(Math.min(h, H))[1]; };
      T.surface = function (h) { var hh = clamp(h, 0, H), c = P3(0, hh, zc); return { x: c.x, y: c.y, hw: K.half(P, hh) * 2 * s * 0.35 }; };
      T.rowCenter = function (y) { return P3(0, y, zc); };

      sv("ellipse", { cx: (T.left + T.right) / 2, cy: FLOOR + 3, rx: (T.right - T.left) / 2 + 14, ry: 12, fill: "rgba(0,0,0,.5)", filter: "url(#hd-blur)" }, G);
      if (!prism) {
        [top[0], top[1], top[2]].forEach(function (c, i) {
          line(G, { x: c.x, y: c.y + 4 }, { x: c.x + (i === 0 ? -8 : 8), y: FLOOR - (i === 2 ? 14 : 0) }, i === 2 ? "#3a4351" : "#4b5665", 8);
        });
        line(G, { x: top[0].x - 6, y: FLOOR - 26 }, { x: top[1].x + 6, y: FLOOR - 26 }, "#3e4856", 5);
      } else {
        sv("polygon", { points: pts([{ x: bot[0].x - 8, y: bot[0].y }, { x: bot[1].x + 8, y: bot[1].y }, { x: bot[1].x + 8, y: FLOOR + 2 }, { x: bot[0].x - 8, y: FLOOR + 2 }]), fill: "#2a323d", stroke: "#45505f", "stroke-width": 2 }, G);
      }
      var inner = pts(hull(all));
      sv("polygon", { points: inner }, clip);
      sv("polygon", { points: inner, fill: "url(#hd-interior)" }, G);

      // hidden edges, faint
      var faint = "rgba(190,202,216,.35)";
      function faceEdges(i, col, w) {
        var u = under(i, n);
        for (var e = 0; e < u.length - 1; e++) line(G, u[e], u[e + 1], col, w);
        line(G, u[0], top[i], col, w);
        line(G, u[u.length - 1], top[(i + 1) % n], col, w);
      }
      hidIdx.forEach(function (i) { faceEdges(i, faint, 2); });
      hidIdx.forEach(function (i) { line(G, top[i], top[(i + 1) % n], "#6f7d8d", 4); });
      var rS = ring(P.S);
      T.redBack = sv("polyline", { points: pts(chain(hidIdx, rS)), fill: "none", stroke: C.rd, "stroke-width": 2.5, "stroke-dasharray": "8 7", opacity: 0.45 }, G);
      var inside = sv("g", { "clip-path": "url(#" + clipId + ")" }, G);
      T.waterBody = sv("polygon", { fill: "url(#hd-water)" }, inside);
      T.pileG = sv("g", { opacity: 0.85 }, inside);
      T.waterTop = sv("polygon", { fill: "url(#hd-surface)", stroke: "rgba(210,255,250,.65)", "stroke-width": 1.2 }, inside);
      T.wasteG = sv("g", {}, inside);
      T.fall = sv("g", {}, G);
      visIdx.forEach(function (i, k) { sv("polygon", { points: pts(faces[i].pts), fill: k === 0 ? "url(#hd-glass)" : "rgba(255,255,255,.035)" }, G); });
      var edge = "#b9c5d3";
      visIdx.forEach(function (i) { faceEdges(i, edge, 4); });
      T.redFront = sv("polyline", { points: pts(chain(visIdx, rS)), fill: "none", stroke: C.rd, "stroke-width": 3.4, "stroke-dasharray": "11 6", filter: "url(#hd-glow)" }, G);
      sv("polyline", { points: pts(chain(visIdx, top)), fill: "none", stroke: "#dbe3ec", "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" }, G);

      T.setWater = function (h) {
        T.level = h;
        var hh = Math.min(h, H);
        if (hh <= 0.05) { T.waterBody.setAttribute("points", ""); T.waterTop.setAttribute("points", ""); return; }
        T.waterBody.setAttribute("points", pts(hull(solid(hh))));
        T.waterTop.setAttribute("points", pts(ring(hh)));
      };
      T.wasted = function (h) {
        var ra = ring(h), rb = ring(P.S);
        visIdx.forEach(function (i, k) {
          var j = (i + 1) % n;
          sv("polygon", k === 0
            ? { points: pts([ra[i], ra[j], rb[j], rb[i]]), fill: "url(#hd-hatch)", stroke: C.am, "stroke-width": 1.5, "stroke-dasharray": "5 4" }
            : { points: pts([ra[i], ra[j], rb[j], rb[i]]), fill: "url(#hd-hatch)", opacity: 0.6 }, T.wasteG);
        });
      };

      var labels = T.labels = sv("g", {}, root);
      var LBL = { size: 19, weight: 800, fill: "#ffe0b8" };
      if (prism) {
        txt(labels, (bot[0].x + bot[1].x) / 2, FLOOR + 24, (kind === "box" ? P.L : P.b) + " cm", LBL);
        dimV(labels, bot[0].x - 26, T.Y(0), T.Y(H), H + " cm");
      } else if (kind === "trough") {
        var ft = P3(0, H, 0);
        line(labels, a0, ft, C.am, 2, { "stroke-dasharray": "5 4" });
        sv("polyline", { points: pts([{ x: ft.x, y: ft.y + 8 }, { x: ft.x + 8, y: ft.y + 8 }, { x: ft.x + 8, y: ft.y }]), fill: "none", stroke: C.am, "stroke-width": 1.8 }, labels);
        txt(labels, a0.x + 8, (a0.y + ft.y) / 2 + 14, H + " cm", { size: 19, weight: 800, fill: "#ffe0b8", anchor: "start" });
      } else if (kind === "pyr") {
        var pa = P3(0, 0, zc), pt = P3(0, H, zc);
        line(labels, pa, pt, C.am, 2, { "stroke-dasharray": "5 4" });
        sv("polyline", { points: pts([{ x: pt.x, y: pt.y + 8 }, { x: pt.x + 8, y: pt.y + 8 }, { x: pt.x + 8, y: pt.y }]), fill: "none", stroke: C.am, "stroke-width": 1.8 }, labels);
        txt(labels, pt.x + 8, (pa.y + pt.y) / 2 + 14, H + " cm", { size: 19, weight: 800, fill: "#ffe0b8", anchor: "start" });
      } else {
        dimV(labels, T.left - 26, T.Y(0), T.Y(H), H + " cm");
      }
      if (kind === "box") {
        txt(labels, (bot[1].x + bot[2].x) / 2 + 30, (bot[1].y + bot[2].y) / 2 + 8, P.W + " cm", { size: 19, weight: 800, fill: "#ffe0b8", anchor: "start" });
      } else if (kind === "tri") {
        var px = 44, py = 122, pw = 210, ph = 146;
        sv("rect", { x: px, y: py, width: pw, height: ph, rx: 8, fill: "#0e2236", stroke: "#4a7fae", "stroke-width": 1.5, opacity: 0.95 }, labels);
        txt(labels, px + 12, py + 19, "TOP VIEW", { size: 12, weight: 800, fill: "#8fc3ee", anchor: "start", cls: "nohalo" });
        var k = Math.min(150 / P.b, 78 / P.t), fx = px + pw / 2, fy = py + ph - 30;
        var A = { x: fx - P.b * k / 2, y: fy }, B = { x: fx + P.b * k / 2, y: fy }, Ap = { x: fx, y: fy - P.t * k };
        sv("polygon", { points: pts([A, B, Ap]), fill: "rgba(88,230,220,.16)", stroke: "#cfe6ff", "stroke-width": 2, "stroke-linejoin": "round" }, labels);
        line(labels, { x: fx, y: fy }, Ap, C.am, 2, { "stroke-dasharray": "5 4" });
        sv("polyline", { points: pts([{ x: fx + 8, y: fy }, { x: fx + 8, y: fy - 8 }, { x: fx, y: fy - 8 }]), fill: "none", stroke: C.am, "stroke-width": 1.8 }, labels);
        txt(labels, fx + 8, fy - P.t * k / 2 + 5, P.t + " cm", { size: 15, weight: 800, fill: "#ffd08a", anchor: "start", cls: "nohalo" });
        txt(labels, fx, fy + 19, P.b + " cm", { size: 15, weight: 800, fill: "#e6f0ff", cls: "nohalo" });
      } else if (kind === "pyr") {
        txt(labels, (top[3].x + top[2].x) / 2 + 30, top[3].y - 12, P.a + " cm", LBL);
        txt(labels, (top[1].x + top[2].x) / 2 + 14, (top[1].y + top[2].y) / 2 - 2, P.a + " cm", { size: 19, weight: 800, fill: "#ffe0b8", anchor: "start" });
      } else {
        txt(labels, (top[3].x + top[2].x) / 2 + 30, top[3].y - 12, P.w + " cm", LBL);
        txt(labels, (a0.x + aL.x) / 2 + 14, (a0.y + aL.y) / 2 + 24, P.Lt + " cm", { size: 19, weight: 800, fill: "#ffe0b8", anchor: "start" });
      }
    }

    /* ── pile of cooled balls at the bottom ── */
    T.pileN = 0;
    T.pileH = 0;
    T.setPile = function (count) {
      if (count <= 0) { T.pileG.innerHTML = ""; T.pileN = 0; T.pileH = 0; return; }
      T.pileN = count;
      // One drawn ball per real ball, drawn smaller than scale so the pile reads as a crowd.
      // Rows fill bottom-up in a fixed order, so a bigger pile only appends circles.
      var rr = P.r * BALL_VIS, rpx = rr * s, step = 2 * rr, row = rr * 1.732, spots = [], want = Math.min(count, 460), top = 0;
      for (var j = 0; spots.length < want; j++) {
        var yc = rr + j * row;
        if (yc > H) break;
        var hw = (K.poly === "box" ? P.L / 2 : K.poly === "tri" ? P.b / 3 : K.half(P, yc) * (K.poly ? 1 : 0.7)) - rr;
        if (hw < 0) continue;
        var c = T.rowCenter(yc), off = j % 2 ? rr : 0;
        for (var xcm = -hw + off; xcm <= hw + 1e-6 && spots.length < want; xcm += step) spots.push([c.x + xcm * s, c.y]);
        top = yc + rr;
      }
      T.pileH = top;
      var have = T.pileG.childNodes.length, lift = Math.max(6, rpx * 1.6);
      spots.slice(have).forEach(function (q, i) {
        var n = sv("circle", { cx: q[0], cy: q[1], r: Math.max(1.5, rpx * 0.96), fill: "url(#hd-steel)", stroke: "rgba(0,0,0,.25)", "stroke-width": 0.6 }, T.pileG);
        n.style.opacity = "0";
        n.style.transform = "translate(0px," + (-lift) + "px)";
        n.style.transition = "transform .34s cubic-bezier(.3,1.6,.55,1), opacity .2s ease-out";
        n.style.transitionDelay = Math.min(i * 28, 320) + "ms";
        requestAnimationFrame(function () { requestAnimationFrame(function () { n.style.opacity = "1"; n.style.transform = "none"; }); });
      });
    };

    T.redState = function (state) {
      var col = state === "ok" ? C.ok : C.rd;
      T.redFront.setAttribute("stroke", col);
      T.redBack.setAttribute("stroke", col);
      T.redFront.querySelectorAll("animate").forEach(function (a) { a.remove(); });
      if (state === "alarm") {
        sv("animate", { attributeName: "stroke-width", values: "3.4;7;3.4", dur: "0.5s", repeatCount: "indefinite" }, T.redFront);
      }
      if (state === "ok") T.redFront.setAttribute("stroke-dasharray", "none");
    };

    T.spill = function () {
      if (T.spilled) return;
      T.spilled = true;
      var lx = T.left + 2, rx = T.right - 2, y0 = T.Y(H);
      [[lx, -1], [rx, 1]].forEach(function (q) {
        var p = sv("path", { d: "M" + q[0] + " " + y0 + " Q" + (q[0] + q[1] * 16) + " " + (y0 + 20) + " " + (q[0] + q[1] * 12) + " " + FLOOR, fill: "none", stroke: "#6ee8e0", "stroke-width": 7, "stroke-linecap": "round", opacity: 0.85, "stroke-dasharray": "16 10" }, G);
        sv("animate", { attributeName: "stroke-dashoffset", from: 52, to: 0, dur: "0.4s", repeatCount: "indefinite" }, p);
        sv("ellipse", { cx: q[0] + q[1] * 30, cy: FLOOR + 6, rx: 46, ry: 7, fill: "rgba(110,232,224,.35)" }, G);
      });
    };

    return T;
  }

  function dimV(parent, x, y0, y1, label) {
    var g = sv("g", { opacity: 0.92 }, parent);
    line(g, { x: x, y: y0 }, { x: x, y: y1 }, C.mut, 1.6);
    line(g, { x: x - 6, y: y0 }, { x: x + 6, y: y0 }, C.mut, 1.6);
    line(g, { x: x - 6, y: y1 }, { x: x + 6, y: y1 }, C.mut, 1.6);
    txt(g, x - 10, y1 + (y0 - y1) * 0.18 + 6, label, { anchor: "end", size: 20, weight: 800, fill: "#e6eef7" });
  }

  /* ---------- ruler and level tags ---------- */

  function ruler(root, T, P) {
    return T.right + 30;
  }

  function makeTag(root, T, x, col, dy) {
    var g = sv("g", {}, root);
    var lead = line(g, { x: 0, y: 0 }, { x: 0, y: 0 }, col, 1.6, { "stroke-dasharray": "4 4", opacity: 0.8 });
    var tri = sv("polygon", { fill: col }, g);
    var box = sv("rect", { rx: 8, fill: "rgba(6,9,14,.9)", stroke: col, "stroke-width": 1.8, height: 32 }, g);
    var t = txt(g, 0, 0, "", { anchor: "start", size: 18, fill: col, weight: 800, cls: "nohalo" });
    return {
      set: function (h, label, dyOver) {
        var dy2 = dyOver == null ? dy : dyOver;
        var y = T.Y(Math.min(h, T.P.H)), e = T.edge(h);
        lead.setAttribute("x1", e.x + 4); lead.setAttribute("y1", e.y);
        lead.setAttribute("x2", x); lead.setAttribute("y2", y);
        tri.setAttribute("points", x + "," + y + " " + (x + 10) + "," + (y - 6) + " " + (x + 10) + "," + (y + 6));
        var w = label.length * 9.8 + 24;
        box.setAttribute("x", x + 11);
        box.setAttribute("y", y - 16 + dy2);
        box.setAttribute("width", w);
        t.setAttribute("x", x + 22);
        t.setAttribute("y", y + 6 + dy2);
        t.textContent = label;
      },
      node: g,
    };
  }

  /* ---------- conveyor, chute, console, monitor, HUD ---------- */

  function conveyor(root, mouth) {
    var g = sv("g", {}, root), y = 100, x1 = mouth.x + 74;
    for (var bx = FR.x + 70; bx < x1 - 20; bx += 170) line(g, { x: bx, y: FR.y }, { x: bx, y: y }, "#283039", 5);
    sv("rect", { x: FR.x - 10, y: y, width: x1 - FR.x + 10, height: 15, rx: 7, fill: "#262e3a", stroke: "#46515f", "stroke-width": 2 }, g);
    for (var rx = FR.x + 8; rx < x1 - 4; rx += 26) sv("circle", { cx: rx, cy: y + 7.5, r: 4.5, fill: "#4b5768" }, g);
    var cp = sv("clipPath", { id: "hd-belt" }, g);
    sv("rect", { x: FR.x, y: y - 30, width: x1 - FR.x - 18, height: 34 }, cp);
    var bg = sv("g", { "clip-path": "url(#hd-belt)" }, g);
    var mv = sv("g", {}, bg);
    for (var i = -1; i * 56 < x1 - FR.x; i++) sv("circle", { cx: FR.x + i * 56, cy: y - 8, r: 8, fill: "url(#hd-hot)", filter: "url(#hd-glow)" }, mv);
    sv("animateTransform", { attributeName: "transform", type: "translate", from: "0 0", to: "56 0", dur: "1.4s", repeatCount: "indefinite" }, mv);
    var d = "M" + (x1 - 12) + " " + (y + 8) + " C" + (mouth.x + 12) + " " + (y + 8) + " " + mouth.x + " " + (y + 34) + " " + mouth.x + " " + mouth.y;
    sv("path", { d: d, fill: "none", stroke: "#1f262f", "stroke-width": 32, "stroke-linecap": "round" }, g);
    sv("path", { d: d, fill: "none", stroke: "#5d6979", "stroke-width": 26, "stroke-linecap": "round" }, g);
    sv("path", { d: d, fill: "none", stroke: "rgba(255,255,255,.18)", "stroke-width": 6, "stroke-linecap": "round", transform: "translate(-6,0)" }, g);
    sv("ellipse", { cx: mouth.x, cy: mouth.y, rx: 15, ry: 5.5, fill: "#0b0f15", stroke: "#8a97a8", "stroke-width": 3 }, g);
    sv("ellipse", { cx: mouth.x, cy: mouth.y, rx: 9, ry: 3, fill: "rgba(255,140,60,.75)", filter: "url(#hd-glow)" }, g);
  }

  function drawConsole(root) {
    var g = sv("g", { transform: "translate(" + CONSOLE_X + "," + FLOOR + ")" }, root);
    sv("ellipse", { cx: 0, cy: 2, rx: 38, ry: 6, fill: "rgba(0,0,0,.4)" }, g);
    sv("rect", { x: -27, y: -70, width: 54, height: 70, rx: 4, fill: "#2b3442", stroke: "#4a5566", "stroke-width": 2 }, g);
    sv("polygon", { points: "-36,-70 36,-70 30,-98 -30,-98", fill: "#3a4555", stroke: "#566274", "stroke-width": 2 }, g);
    sv("rect", { x: -24, y: -94, width: 48, height: 18, rx: 3, fill: "#06140c", stroke: "#1f3a2a", "stroke-width": 1.5 }, g);
    var lcd = txt(g, 0, -80, "---", { size: 15, fill: "#5dff9d", mono: true, weight: 800, cls: "nohalo" });
    for (var i = 0; i < 6; i++) sv("rect", { x: -27 + i * 9, y: -16, width: 9, height: 6, fill: i % 2 ? "#1b1b1b" : "#e8b23a" }, g);
    var btn = sv("g", {}, g);
    sv("circle", { cx: 0, cy: -44, r: 15, fill: "#1b1f27", stroke: "#566274", "stroke-width": 2 }, btn);
    var cap = sv("g", {}, btn);
    sv("circle", { cx: 0, cy: -46, r: 11, fill: "#d9311f" }, cap);
    sv("ellipse", { cx: -3, cy: -49, rx: 5, ry: 3, fill: "rgba(255,255,255,.35)" }, cap);
    return {
      set: function (s) { lcd.textContent = s; },
      press: function () {
        cap.setAttribute("transform", "translate(0,3)");
        setTimeout(function () { cap.removeAttribute("transform"); }, 220);
      },
    };
  }

  function drawMonitor(root) {
    var w = 176, h = 118, x = FR.x + FR.w - w - 16, y = FR.y + 14;
    var g = sv("g", {}, root);
    line(g, { x: x + 40, y: FR.y }, { x: x + 40, y: y }, "#2a323d", 3);
    line(g, { x: x + w - 40, y: FR.y }, { x: x + w - 40, y: y }, "#2a323d", 3);
    sv("rect", { x: x, y: y, width: w, height: h, rx: 12, fill: "#1d232d", stroke: "#3c4758", "stroke-width": 3 }, g);
    var scr = { x: x + 9, y: y + 9, w: w - 18, h: h - 30 };
    var cpId = "hd-mon" + (++uid);
    var cp = sv("clipPath", { id: cpId }, g);
    sv("rect", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, rx: 6 }, cp);
    sv("rect", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, rx: 6, fill: "#071009" }, g);
    var screen = sv("g", { "clip-path": "url(#" + cpId + ")" }, g);
    txt(g, x + 14, y + h - 9, "OFFICE CAM", { size: 10, fill: "#6c7a8c", ls: ".18em", cls: "nohalo", anchor: "start" });
    var dot = sv("circle", { cx: x + w - 16, cy: y + h - 13, r: 3.5, fill: C.rd }, g);
    sv("animate", { attributeName: "opacity", values: "1;.2;1", dur: "1.6s", repeatCount: "indefinite" }, dot);
    function off() {
      screen.innerHTML = "";
      txt(screen, scr.x + scr.w / 2, scr.y + scr.h / 2 + 5, "· · ·", { size: 16, fill: "#24402e", cls: "nohalo" });
      sv("rect", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, fill: "url(#hd-scan)" }, screen);
    }
    off();
    return {
      on: function (mood) {
        screen.innerHTML = "";
        sv("rect", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, fill: mood === "angry" ? "#3a1416" : "#16283a" }, screen);
        var inner = sv("svg", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, viewBox: "-48 -180 96 66", preserveAspectRatio: "xMidYMid slice" }, screen);
        person(inner, "boss", { mood: mood, pose: mood === "angry" ? "hips" : mood === "happy" ? "thumbs" : "idle", noShadow: true });
        sv("rect", { x: scr.x, y: scr.y, width: scr.w, height: scr.h, fill: "url(#hd-scan)", opacity: 0.6 }, screen);
      },
      off: off,
      tip: { x: x - 4, y: y + h / 2 - 6 },
    };
  }

  function drawHUD(root, mode) {
    var g = sv("g", {}, root), x = FR.x + 16, y = FR.y + 14, shift = mode === "shift";
    sv("rect", { x: x, y: y, width: 226, height: 60, rx: 12, fill: "rgba(6,9,14,.84)", stroke: "rgba(255,179,71,.38)", "stroke-width": 1.5 }, g);
    var icon = sv("g", { transform: "translate(" + (x + 29) + "," + (y + 30) + ")" }, g);
    var clock = txt(g, x + 54, y + 44, "22:00", { anchor: "start", size: 27, weight: 800, mono: true, fill: "#fff", cls: "nohalo" });
    txt(g, x + 54, y + 17, shift ? "SHIFT ENDS 06:00" : "PRACTICE · CLOCK OFF", { anchor: "start", size: 12, weight: 700, fill: C.mut, ls: ".12em", cls: "nohalo" });
    sv("rect", { x: x + 150, y: y + 33, width: 62, height: 6, rx: 3, fill: "rgba(255,255,255,.1)" }, g);
    var bar = sv("rect", { x: x + 150, y: y + 33, width: 0, height: 6, rx: 3, fill: C.am }, g);
    var lx = x + 238;
    sv("rect", { x: lx, y: y, width: 166, height: 60, rx: 12, fill: "rgba(6,9,14,.84)", stroke: "rgba(255,255,255,.14)", "stroke-width": 1.5 }, g);
    txt(g, lx + 14, y + 17, shift ? "STRIKES" : "STRIKES · OFF", { anchor: "start", size: 12, weight: 700, fill: C.mut, ls: ".12em", cls: "nohalo" });
    var lives = sv("g", { opacity: shift ? 1 : 0.35 }, g);
    var sx = lx + 182;
    sv("rect", { x: sx, y: y, width: 206, height: 60, rx: 12, fill: "rgba(6,9,14,.84)", stroke: "rgba(78,240,162,.3)", "stroke-width": 1.5 }, g);
    txt(g, sx + 14, y + 17, "BALLS COOLED", { anchor: "start", size: 12, weight: 700, fill: C.mut, ls: ".12em", cls: "nohalo" });
    var score = txt(g, sx + 14, y + 47, "0", { anchor: "start", size: 26, weight: 800, mono: true, fill: C.ok, cls: "nohalo" });
    var pools = txt(g, sx + 192, y + 46, "", { anchor: "end", size: 12, fill: C.mut, cls: "nohalo" });
    hud = { icon: icon, clock: clock, bar: bar, lives: lives, lx: lx, y: y, score: score, pools: pools, shift: shift, iconKind: "" };
    updateHUD();
  }

  function strikeIcon(g, x, y, kind) {
    if (!kind) {
      sv("circle", { cx: x, cy: y, r: 14, fill: "rgba(255,255,255,.04)", stroke: "rgba(255,255,255,.3)", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, g);
      return;
    }
    if (kind === "burn") {
      sv("circle", { cx: x, cy: y, r: 14, fill: "#ff6a3c" }, g);
      var b = sv("g", { transform: "rotate(-35 " + x + " " + y + ")" }, g);
      sv("rect", { x: x - 12, y: y - 4.5, width: 24, height: 9, rx: 3.5, fill: "#f3efe6" }, b);
      sv("rect", { x: x - 4, y: y - 4.5, width: 8, height: 9, fill: "#e3c9a3" }, b);
    } else {
      sv("circle", { cx: x, cy: y, r: 14, fill: "#c03548" }, g);
      txt(g, x, y + 6, "!!", { size: 16, weight: 900, fill: "#fff", cls: "nohalo" });
    }
  }

  function clockText() {
    var p = clamp(state.elapsed / SHIFT_MS, 0, 1);
    var mins = 22 * 60 + Math.floor(p * 8 * 60), hh = Math.floor(mins / 60) % 24, mm = mins % 60;
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function updateHUD() {
    if (!hud) return;
    var p = clamp(state.elapsed / SHIFT_MS, 0, 1);
    hud.clock.textContent = hud.shift ? clockText() : "--:--";
    hud.bar.setAttribute("width", (62 * p).toFixed(1));
    hud.bar.setAttribute("fill", p > 7 / 8 ? C.rd : C.am);
    var kind = p > 0.8 ? "sun" : "moon";
    if (hud.iconKind !== kind) {
      hud.iconKind = kind;
      hud.icon.innerHTML = "";
      if (kind === "moon") {
        sv("circle", { cx: 0, cy: 0, r: 13, fill: "#e8eefc" }, hud.icon);
        sv("circle", { cx: 6, cy: -4, r: 11, fill: "#0b1018" }, hud.icon);
      } else {
        sv("circle", { cx: 0, cy: 0, r: 10, fill: "#ffc35a", filter: "url(#hd-glow)" }, hud.icon);
        for (var a = 0; a < 8; a++) line(hud.icon, { x: 14 * Math.cos(a * PI / 4), y: 14 * Math.sin(a * PI / 4) }, { x: 18 * Math.cos(a * PI / 4), y: 18 * Math.sin(a * PI / 4) }, "#ffc35a", 2.4);
      }
    }
    hud.lives.innerHTML = "";
    for (var i = 0; i < LIVES; i++) strikeIcon(hud.lives, hud.lx + 34 + i * 46, hud.y + 38, hud.shift ? state.strikes[i] : null);
    hud.score.textContent = String(state.cooled);
    hud.pools.textContent = hud.shift ? "pool " + Math.min(state.poolIdx + 1, SHIFT_POOLS) + "/" + SHIFT_POOLS : "practice";
    if (cur && cur.sc && cur.sc.dawn) cur.sc.dawn(hud.shift ? p : 0);
    audio.birds = hud.shift ? clamp((p - 0.7) / 0.3, 0, 1) : 0;
  }

  /* ---------- speech bubbles ---------- */

  function bubble(layer, tip, text, o) {
    o = o || {};
    var w = o.w || 300, lines = wrapText(text, Math.floor(w / 9.6)), h = 20 + lines.length * 22, bx, by, tail;
    var col = o.col || C.am;
    if (o.dir === "left") {
      bx = tip.x - 18 - w;
      by = clamp(tip.y - h / 2, FR.y + 8, FR.y + FR.h - h - 8);
      tail = [{ x: bx + w - 2, y: tip.y - 8 }, { x: bx + w - 2, y: tip.y + 8 }, tip];
    } else {
      bx = clamp(tip.x - w * (o.ax == null ? 0.3 : o.ax), FR.x + 8, FR.x + FR.w - w - 8);
      by = tip.y - 16 - h;
      var tx = clamp(tip.x, bx + 18, bx + w - 18);
      tail = [{ x: tx - 9, y: by + h - 2 }, { x: tx + 9, y: by + h - 2 }, tip];
    }
    var g = sv("g", { opacity: 0 }, layer);
    sv("polygon", { points: pts(tail), fill: "#fbfcfe", stroke: col, "stroke-width": 2.6, "stroke-linejoin": "round" }, g);
    sv("rect", { x: bx, y: by, width: w, height: h, rx: 13, fill: "#fbfcfe", stroke: col, "stroke-width": 2.6 }, g);
    var cover = tail.slice(0, 2).map(function (p) { return { x: p.x + (o.dir === "left" ? -2 : 0), y: p.y + (o.dir === "left" ? 0 : -2) }; });
    var mid = { x: (tail[0].x + tail[1].x) / 2 + (o.dir === "left" ? 4 : 0), y: (tail[0].y + tail[1].y) / 2 + (o.dir === "left" ? 0 : 4) };
    sv("polygon", { points: pts([cover[0], cover[1], mid]), fill: "#fbfcfe" }, g);
    lines.forEach(function (s, i) { txt(g, bx + 15, by + 29 + i * 22, s, { anchor: "start", size: 17.5, fill: INK, weight: 700, cls: "nohalo" }); });
    anim(220, function (k) { g.setAttribute("opacity", k); });
    if (o.ms) wait(o.ms, function () { anim(300, function (k) { g.setAttribute("opacity", 1 - k); }, function () { g.remove(); }); });
    return g;
  }

  /* ---------- sample-ball showcase set into the right wall ---------- */

  // Low on the wall right of the ruler: tags sit near the rim, the calculator covers x > ~945.
  function showcase(g, P, br, x0, topY) {
    var w = 196, h = 84;
    var x = Math.min(Math.max(x0, 690), 935 - w), y = Math.max(FLOOR - 36 - h, topY);
    var ix = x + 10, iy = y + 10, iw = 64, ih = h - 20;
    sv("rect", { x: x - 7, y: y - 7, width: w + 14, height: h + 14, rx: 16, fill: "rgba(0,0,0,.55)", filter: "url(#hd-blur-sm)" }, g);
    sv("rect", { x: x, y: y, width: w, height: h, rx: 12, fill: "#262e3a", stroke: "#4d5969", "stroke-width": 3 }, g);
    [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]].forEach(function (q) {
      sv("circle", { cx: q[0], cy: q[1], r: 2.6, fill: "#6b7788" }, g);
    });
    var gid = "hd-case" + (++uid);
    var grad = sv("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, g);
    sv("stop", { offset: "0", "stop-color": "#04070b" }, grad);
    sv("stop", { offset: "1", "stop-color": "#151d28" }, grad);
    sv("rect", { x: ix, y: iy, width: iw, height: ih, rx: 6, fill: "url(#" + gid + ")", stroke: "#0a0e14", "stroke-width": 2 }, g);
    sv("ellipse", { cx: ix + iw / 2, cy: iy + 2, rx: iw * 0.4, ry: 9, fill: "rgba(220,235,255,.14)", filter: "url(#hd-blur-sm)" }, g);
    var dr = clamp(br * 0.9, 9, 13), baseY = iy + ih - 7;
    sv("rect", { x: ix + iw / 2 - 18, y: baseY, width: 36, height: 6, rx: 2, fill: "#3a4555" }, g);
    sv("ellipse", { cx: ix + iw / 2, cy: baseY, rx: 18, ry: 2.6, fill: "#566274" }, g);
    sv("circle", { cx: ix + iw / 2, cy: baseY - dr + 1, r: dr, fill: "url(#hd-steel)" }, g);
    sv("rect", { x: ix, y: iy, width: iw, height: ih, rx: 5, fill: "rgba(90,170,255,.14)", stroke: "rgba(140,200,255,.45)", "stroke-width": 1.6 }, g);
    sv("polygon", { points: pts([{ x: ix + 10, y: iy }, { x: ix + 27, y: iy }, { x: ix + 12, y: iy + ih }, { x: ix + 2, y: iy + ih }]), fill: "rgba(190,225,255,.12)" }, g);
    var px = ix + iw + 10, pw = x + w - 10 - px;
    sv("rect", { x: px, y: iy, width: pw, height: ih, rx: 6, fill: "#3b2f1d", stroke: "#b98b4a", "stroke-width": 2 }, g);
    var given = P.ballGiven ? ballGivenText(P).split(" ") : null;
    txt(g, px + pw / 2, iy + 25, given ? "Ball " + given[0] : "1 ball =", { size: 13, weight: 700, fill: "#e6c08a", cls: "nohalo" });
    txt(g, px + pw / 2, iy + 49, given ? given[1] + " cm" : ballText(P), { size: 17, weight: 800, fill: "#ffd9a8", cls: "nohalo" });
  }

  /* ---------- whole pool scene ---------- */

  function buildScene(P, mode) {
    var B = freshBoard(), root = B.root;
    var bd = backdrop(root, B.defs);
    var sc = { dawn: bd.dawn };
    bd.dawn(mode === "shift" ? clamp(state.elapsed / SHIFT_MS, 0, 1) : 0);
    var Tprobe = { top: 0 };
    var T;
    var tankLayer = sv("g", {}, root);
    var labelsLayer = sv("g", {}, root);
    T = buildTank(tankLayer, B.defs, P);
    labelsLayer.appendChild(T.labels);
    Tprobe.top = T.top;
    var mouth = { x: CX + 6, y: Math.max(150, T.top - 44) };
    sc.mouth = { x: mouth.x, y: mouth.y + 6 };
    var conv = sv("g", {}, root);
    root.insertBefore(conv, tankLayer);
    conveyor(conv, mouth);
    sc.T = T;

    // ruler + tags
    var rx = ruler(labelsLayer, T, P);
    var caseG = sv("g", {}, root);
    root.insertBefore(caseG, tankLayer);
    showcase(caseG, P, Math.max(7, P.r * T.s), rx + 34, T.Y(P.d) + 40);
    sc.redTag = makeTag(labelsLayer, T, rx, C.rd, 0);
    sc.redTag.set(P.S, P.fromRim ? "RED LINE · " + fmt(P.H - P.S) + " cm below rim" : "RED LINE · " + P.S + " cm");
    sc.waterTag = makeTag(labelsLayer, T, rx, C.tl, 0);
    sc.setWaterTag = function (h, live) {
      var v = Math.min(h, P.H);
      var label = P.fromRim
        ? "WATER · " + (live ? fmt2(P.H - v) : fmt(P.H - v)) + " cm below rim"
        : "WATER · " + (live ? fmt2(v) : fmt(v)) + " cm";
      var gap = T.Y(v) - T.Y(P.S);
      sc.waterTag.set(v, label, Math.abs(gap) < 36 ? (gap >= 0 ? 1 : -1) * (36 - Math.abs(gap)) : 0);
    };
    sc.waterTag.set(0, "WATER · 0 cm");

    // steam above the water
    sc.steam = sv("g", { opacity: 0.55 }, labelsLayer);
    [-0.35, 0, 0.35].forEach(function (f, i) {
      var p = sv("path", { d: "M" + (CX + f * 120) + " 0 q -10 -20 0 -40 t 0 -40", fill: "none", stroke: "rgba(230,240,255,.35)", "stroke-width": 9, "stroke-linecap": "round", filter: "url(#hd-blur-sm)" }, sc.steam);
      sv("animateTransform", { attributeName: "transform", type: "translate", values: "0 10; 0 -26", dur: (2.4 + i * 0.5) + "s", repeatCount: "indefinite" }, p);
      sv("animate", { attributeName: "opacity", values: "0;1;0", dur: (2.4 + i * 0.5) + "s", repeatCount: "indefinite" }, p);
    });

    // people
    var wangWrap = sv("g", {}, root), youWrap = sv("g", {}, root);
    sc.wangPos = { x: WANG_X, y: FLOOR };
    sc.setWang = function (pose, mood) { wangWrap.innerHTML = ""; person(wangWrap, "wang", { x: WANG_X, y: FLOOR, sc: 1.05, pose: pose, mood: mood }); };
    sc.setYou = function (pose, mood) { youWrap.innerHTML = ""; person(youWrap, "you", { x: YOU_X, y: FLOOR, sc: 1.05, flip: true, pose: pose, mood: mood, band: burns() }); };
    sc.setWang("hose", "happy");
    sc.setYou("idle", "normal");
    var hand = { x: WANG_X + 40 * 1.05, y: FLOOR - 84 * 1.05 };
    var hose = T.rimLeft;
    var hd = "M" + hand.x + " " + hand.y + " C" + (hand.x + 50) + " " + (hand.y + 30) + " " + (hose.x - 70) + " " + (hose.y - 70) + " " + hose.x + " " + (hose.y - 4);
    var hoseG = sv("g", {}, root);
    root.insertBefore(hoseG, labelsLayer);
    sv("path", { d: hd, fill: "none", stroke: "#1d4b33", "stroke-width": 9, "stroke-linecap": "round" }, hoseG);
    sv("path", { d: hd, fill: "none", stroke: "#2f7a52", "stroke-width": 6, "stroke-linecap": "round" }, hoseG);
    sv("path", { d: hd, fill: "none", stroke: "rgba(255,255,255,.22)", "stroke-width": 1.6, "stroke-linecap": "round", transform: "translate(-1,-2)" }, hoseG);
    sv("rect", { x: hose.x - 6, y: hose.y - 10, width: 12, height: 12, rx: 2, fill: "#b8c2ce", transform: "rotate(30 " + hose.x + " " + (hose.y - 4) + ")" }, hoseG);
    sc.hoseEnd = { x: hose.x + 4, y: hose.y + 4 };

    sc.console = drawConsole(root);
    sc.monitor = drawMonitor(root);
    drawHUD(root, mode === "shift" ? "shift" : "practice");
    sc.fx = sv("g", {}, root);
    sc.bubbles = sv("g", {}, root);
    sc.counter = txt(root, sc.mouth.x - 30, sc.mouth.y + 8, "", { anchor: "end", size: 26, weight: 900, fill: "#ffd9a8", mono: true });
    T.setWater(0);
    T.setPile(0);
    sc.placeSteam = function (h) { sc.steam.setAttribute("transform", "translate(0," + T.Y(Math.min(h, P.H)) + ")"); };
    sc.placeSteam(0);
    return sc;
  }

  function burns() { return state.strikes.filter(function (k) { return k === "burn"; }).length; }

  /* ---------- fill and drop animations ---------- */

  function fillAnim(sc, P, done) {
    var T = sc.T;
    var stream = sv("path", { fill: "none", stroke: "#7aeee6", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.9, "stroke-dasharray": "14 8" }, T.fall);
    sv("animate", { attributeName: "stroke-dashoffset", from: 44, to: 0, dur: "0.35s", repeatCount: "indefinite" }, stream);
    SFX.pour(1.7);
    anim(1700, function (k) {
      var e = 1 - Math.pow(1 - k, 2), h = P.d * e, surf = T.surface(h);
      T.setWater(h);
      sc.setWaterTag(h, true);
      sc.placeSteam(h);
      var tx = clamp(sc.hoseEnd.x + 26, surf.x - surf.hw, surf.x + surf.hw);
      stream.setAttribute("d", "M" + sc.hoseEnd.x + " " + sc.hoseEnd.y + " Q" + (sc.hoseEnd.x + 22) + " " + (sc.hoseEnd.y + 8) + " " + tx + " " + surf.y);
    }, function () {
      stream.remove();
      T.setWater(P.d);
      sc.setWaterTag(P.d);
      done();
    });
  }

  function splash(layer, x, y) {
    var ring = sv("ellipse", { cx: x, cy: y, rx: 3, ry: 1, fill: "none", stroke: "#d3fffb", "stroke-width": 2 }, layer);
    var puff = sv("circle", { cx: x, cy: y - 6, r: 6, fill: "rgba(240,246,255,.5)", filter: "url(#hd-blur-sm)" }, layer);
    anim(520, function (k) {
      ring.setAttribute("rx", 3 + 22 * k);
      ring.setAttribute("ry", 1 + 6 * k);
      ring.setAttribute("opacity", 1 - k);
      puff.setAttribute("cy", y - 6 - 46 * k);
      puff.setAttribute("r", 6 + 10 * k);
      puff.setAttribute("opacity", 0.8 * (1 - k));
    }, function () { ring.remove(); puff.remove(); });
  }

  function burst(layer, x, y, dir, count) {
    var drops = [];
    for (var i = 0; i < (count || 34); i++) {
      var a = -PI / 2 + (Math.random() - 0.5) * 2.2 + dir * 0.4, v = 5 + Math.random() * 8;
      drops.push({ n: sv("circle", { r: 2.5 + Math.random() * 3.5, fill: i % 3 ? "#9ff4ee" : "#ffffff", opacity: 0.95 }, layer), vx: Math.cos(a) * v + dir * 2.5, vy: Math.sin(a) * v, x: x, y: y });
    }
    var cloud = sv("ellipse", { cx: x, cy: y - 20, rx: 30, ry: 18, fill: "rgba(240,246,255,.6)", filter: "url(#hd-blur)" }, layer);
    anim(1300, function (k) {
      drops.forEach(function (d) {
        d.x += d.vx; d.y += d.vy; d.vy += 0.42;
        d.n.setAttribute("cx", d.x); d.n.setAttribute("cy", d.y);
        d.n.setAttribute("opacity", 0.95 * (1 - k));
      });
      cloud.setAttribute("rx", 30 + 120 * k);
      cloud.setAttribute("ry", 18 + 60 * k);
      cloud.setAttribute("cy", y - 20 - 80 * k);
      cloud.setAttribute("opacity", 1 - k);
    }, function () { drops.forEach(function (d) { d.n.remove(); }); cloud.remove(); });
  }

  function dropAnim(n, done) {
    var sc = cur.sc, T = sc.T, P = cur.P;
    var vis = Math.min(n, 48), gap = clamp(2700 / vis, 55, 240), fallMs = 520;
    var V0 = P.K.V(P, P.d), target = P.d, shown = P.d, crossed = false, lastSnd = 0, t0 = null, g = gen;
    var over = n > P.N, burstAt = -1, lastSpray = -1;
    cur.burst = false;
    // Visible ball i stands for counts[i] balls in total; when overfilling, ball N+1 always gets its own drop.
    var counts = [];
    if (over && n > vis) {
      var pre = Math.max(1, Math.min(P.N + 1, Math.floor(vis * 0.4)));
      for (var j = 0; j < pre; j++) counts.push(Math.round((j + 1) * (P.N + 1) / pre));
      for (var j2 = 1; j2 <= vis - pre; j2++) counts.push(P.N + 1 + Math.round(j2 * (n - P.N - 1) / (vis - pre)));
    } else {
      for (var j3 = 0; j3 < vis; j3++) counts.push(Math.round((j3 + 1) * n / vis));
    }
    var balls = [];
    for (var i = 0; i < vis; i++) balls.push({ t: i * gap });
    var sinkMs = 460;
    var endT = (vis - 1) * gap + fallMs + sinkMs + 320;
    var br = Math.max(3.5, P.r * BALL_VIS * T.s);
    var waterG = T.waterTop.parentNode;
    function bubble(x, y) {
      var bb = sv("circle", { cx: x, cy: y, r: 1.2 + Math.random() * 1.8, fill: "none", stroke: "rgba(225,255,252,.8)", "stroke-width": 1 }, waterG);
      waterG.insertBefore(bb, T.waterTop);
      var dx = (Math.random() - 0.5) * 8, rise = 18 + Math.random() * 22;
      anim(520, function (k) {
        bb.setAttribute("cx", x + dx * k + Math.sin(k * 9) * 1.5);
        bb.setAttribute("cy", y - rise * k);
        bb.setAttribute("opacity", 1 - k);
      }, function () { bb.remove(); });
    }
    function sink(b, i, t) {
      var u = Math.min(1, (t - b.sinkT) / sinkMs), e = 1 - (1 - u) * (1 - u);
      var x = b.sx + (b.ex - b.sx) * e + Math.sin(u * 7 + i) * 1.2 * (1 - u), y = b.sy + (b.ey - b.sy) * e;
      b.n.setAttribute("cx", x); b.n.setAttribute("cy", y);
      b.c.setAttribute("cx", x); b.c.setAttribute("cy", y);
      b.n.setAttribute("opacity", 1 - u);
      b.c.setAttribute("opacity", Math.min(1, u * 1.6) * (u > 0.8 ? (1 - u) * 5 : 1));
      if (u < 0.75 && t - b.lastBub > 120) { b.lastBub = t; bubble(x + (Math.random() - 0.5) * br, y - br * 0.6); }
      if (u >= 1) {
        b.n.remove(); b.c.remove();
        b.sunk = true;
        T.setPile(b.count);
      }
    }
    function frame(ts) {
      if (g !== gen) return;
      if (t0 == null) t0 = ts;
      var t = ts - t0;
      balls.forEach(function (b, i) {
        if (b.sunk || t < b.t) return;
        if (b.done) { sink(b, i, t); return; }
        if (!b.n) {
          var surf = T.surface(target);
          b.tx = surf.x + (Math.random() - 0.5) * 2 * surf.hw;
          b.ty = surf.y;
          b.n = sv("circle", { r: br, fill: "url(#hd-hot)", filter: "url(#hd-glow)" }, T.fall);
        }
        var k = Math.min(1, (t - b.t) / fallMs);
        var x = sc.mouth.x + (b.tx - sc.mouth.x) * k, y = sc.mouth.y + (b.ty - sc.mouth.y) * k * k;
        b.n.setAttribute("cx", x);
        b.n.setAttribute("cy", y);
        if (k >= 1) {
          b.done = true;
          var landed = counts[i];
          waterG.insertBefore(b.n, T.waterTop);
          b.n.removeAttribute("filter");
          b.c = sv("circle", { cx: x, cy: y, r: br, fill: "url(#hd-steel)", opacity: 0 }, waterG);
          waterG.insertBefore(b.c, T.waterTop);
          var rv = P.r * BALL_VIS, floor = T.rowCenter(Math.max(rv, Math.min((T.pileH || 0) + rv, target - rv)));
          b.sx = x; b.sy = y; b.ex = floor.x + (x - floor.x) * 0.75; b.ey = Math.max(y + 6, floor.y);
          b.sinkT = t; b.lastBub = -1e9; b.count = landed;
          target = levelFor(P, V0 + landed * P.ball);
          splash(T.fall, x, y);
          if (ts - lastSnd > 85) { SFX.plop(); lastSnd = ts; }
          if (over && landed > P.N) {
            var top = T.surface(Math.min(target, P.H));
            if (burstAt < 0) {
              burstAt = i;
              cur.burst = true;
              burst(sc.fx, top.x, top.y, 1);
              SFX.splash();
              shake();
              if (!crossed) { crossed = true; T.redState("alarm"); SFX.alarm(); }
            } else if (i - lastSpray >= 3) {
              burst(sc.fx, top.x + (Math.random() - 0.5) * top.hw, top.y, Math.random() < 0.5 ? -1 : 1, 12);
            }
            if (i - lastSpray >= 3 || lastSpray < 0) lastSpray = i;
          }
          sc.counter.textContent = "×" + landed;
          sc.console.set(String(n - landed));
        }
      });
      shown += (target - shown) * 0.16;
      T.setWater(shown);
      sc.setWaterTag(shown, true);
      sc.placeSteam(shown);
      if (!crossed && shown > P.S + 0.01) {
        crossed = true;
        T.redState("alarm");
        SFX.alarm();
        shake();
      }
      if (shown > P.H) T.spill();
      if (t < endT) requestAnimationFrame(frame);
      else {
        T.setWater(target);
        sc.setWaterTag(target, true);
        sc.placeSteam(target);
        if (target > P.H) T.spill();
        done(target);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ================================================================
   * Panel
   * ================================================================ */

  function buildPanel(o) {
    panel.innerHTML =
      '<div class="hd-toast" hidden><div class="hd-toast-msg"></div><button type="button" class="hd-toast-x" aria-label="Close">×</button></div>' +
      '<div class="hd-bar">' +
      '<div class="hd-bar-id"><div class="hd-kicker">' + o.kicker + '</div><div class="hd-bar-title">' + o.title + "</div></div>" +
      '<div class="hd-fields">' + o.fields.map(function (f) {
        return '<label class="hd-field"><span>' + f.label + "</span>" +
          '<input data-f="' + f.id + '" type="text" inputmode="' + (f.vol ? "decimal" : "numeric") + '" autocomplete="off" spellcheck="false" placeholder="' + (f.ph || "") + '">' +
          (f.unit ? "<em>" + f.unit + "</em>" : "") + "</label>";
      }).join("") + "</div>" +
      '<button type="button" class="hd-btn go">DROP ▸</button>' +
      '<div class="hd-tools">' +
      '<button type="button" class="hd-tool calc-btn">Calculator</button>' +
      (o.hints ? '<button type="button" class="hd-tool hint-btn"></button>' : "") +
      (o.onAnswer ? '<button type="button" class="hd-tool ans-btn">Answer</button>' : "") +
      '<button type="button" class="hd-tool snd">' + (audio.muted ? "Sound off" : "Sound on") + "</button>" +
      "</div></div>" +
      '<div class="hd-result" hidden>' +
      '<div class="hd-res-main"><div class="hd-res-h"></div><div class="hd-res-body"></div></div>' +
      '<div class="hd-res-acts"><button type="button" class="hd-btn sol">See solution</button>' +
      '<button type="button" class="hd-btn next">Next ▸</button></div>' +
      "</div>" +
      '<div class="hd-sol" hidden><div class="hd-sol-box" role="dialog" aria-label="Solution"></div></div>';

    var q = function (s) { return panel.querySelector(s); };
    var go = q(".go"), toast = q(".hd-toast"), toastMsg = q(".hd-toast-msg"), bar = q(".hd-bar");
    var result = q(".hd-result"), next = q(".next"), hintBtn = q(".hint-btn");
    var shown = 0;
    function hintLabel() {
      if (!hintBtn) return;
      hintBtn.textContent = shown < o.hints.length ? "Hint " + (shown + 1) + "/" + o.hints.length : "Hints";
    }
    function say(msg, kind) {
      if (!msg) { toast.hidden = true; return; }
      toast.className = "hd-toast " + (kind || "");
      toastMsg.innerHTML = msg;
      toast.hidden = false;
    }
    hintLabel();
    if (hintBtn) hintBtn.addEventListener("click", function () {
      SFX.click();
      if (shown < o.hints.length) shown++;
      say(o.hints.slice(0, shown).map(function (h, j) { return "<b>" + (j + 1) + ".</b> " + h; }).join("<br>"), "tip");
      hintLabel();
    });
    q(".hd-toast-x").addEventListener("click", function () { say(""); });
    q(".snd").addEventListener("click", function () { ensureAudio(); setMuted(!audio.muted); });
    q(".calc-btn").addEventListener("click", function () { SFX.click(); calc.toggle(); });
    if (o.onAnswer) q(".ans-btn").addEventListener("click", function () { SFX.click(); o.onAnswer(); });
    go.addEventListener("click", function () { if (!go.disabled) { ensureAudio(); o.onDrop(); } });
    var nextFn = null, solHTML = "", sol = q(".hd-sol"), solBox = q(".hd-sol-box");
    next.addEventListener("click", function () { if (nextFn) { SFX.click(); nextFn(); } });
    function closeSol() { sol.hidden = true; }
    q(".sol").addEventListener("click", function () {
      SFX.click();
      solBox.innerHTML = solHTML;
      solBox.querySelector(".hd-sol-x").addEventListener("click", function () { SFX.click(); closeSol(); });
      sol.hidden = false;
    });
    sol.addEventListener("click", function (e) { if (e.target === sol) closeSol(); });
    sol.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSol(); });
    Array.prototype.forEach.call(panel.querySelectorAll("input"), function (inp) {
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
      inp.addEventListener("input", function () { inp.classList.remove("bad", "ok"); if (o.onInput) o.onInput(inp.getAttribute("data-f"), inp.value); });
    });

    return {
      input: function (id) { return panel.querySelector('[data-f="' + id + '"]'); },
      raw: function (id) { return this.input(id).value.trim(); },
      say: say,
      mark: function (id, ok) { var i = this.input(id); i.classList.remove("ok", "bad"); i.classList.add(ok ? "ok" : "bad"); },
      result: function (kind, head, body, solution) {
        say("");
        result.className = "hd-result " + kind;
        q(".hd-res-h").textContent = head;
        q(".hd-res-body").innerHTML = body;
        solHTML = solution;
        closeSol();
        bar.hidden = true;
        result.hidden = false;
      },
      lock: function (b) {
        go.disabled = b;
        Array.prototype.forEach.call(panel.querySelectorAll("input"), function (i) { i.disabled = b; });
      },
      next: function (label, fn, bad) {
        next.textContent = label;
        next.classList.toggle("bad", !!bad);
        nextFn = fn;
        setTimeout(function () { try { next.focus({ preventScroll: true }); } catch (e) {} }, 60);
      },
      focus: function () {
        var i = panel.querySelector("input:not([disabled])");
        if (i && stageVisible()) { try { i.focus({ preventScroll: true }); } catch (e) {} }
      },
    };
  }

  /* ---------- calculator ---------- */

  // Small recursive-descent evaluator: + − × ÷, brackets, π, x², Ans, and implicit multiplication (e.g. 784π, 2(3+4)).
  function calcEval(src, ans) {
    var toks = [], i = 0, s = src.replace(/\s+/g, "");
    while (i < s.length) {
      var ch = s[i], m = /^\d*\.?\d+|^\d+\./.exec(s.slice(i));
      if (m) { toks.push({ n: parseFloat(m[0]) }); i += m[0].length; continue; }
      if (ch === "π") toks.push({ n: PI });
      else if (s.slice(i, i + 3) === "Ans") { toks.push({ n: ans }); i += 3; continue; }
      else if ("+-×÷()²".indexOf(ch) >= 0) toks.push({ o: ch });
      else throw new Error("bad");
      i++;
    }
    var p = 0;
    function peek() { return toks[p]; }
    function isOp(t, c) { return t && t.o === c; }
    function startsPrimary(t) { return t && (t.n != null || t.o === "("); }
    function primary() {
      var t = toks[p++];
      if (!t) throw new Error("end");
      if (t.n != null) return t.n;
      if (t.o === "(") { var v = expr(); if (isOp(peek(), ")")) p++; return v; }
      throw new Error("bad");
    }
    function power() { var v = primary(); while (isOp(peek(), "²")) { p++; v = v * v; } return v; }
    function unary() { if (isOp(peek(), "-")) { p++; return -unary(); } if (isOp(peek(), "+")) { p++; return unary(); } return power(); }
    function term() {
      var v = unary();
      for (;;) {
        var t = peek();
        if (isOp(t, "×")) { p++; v *= unary(); }
        else if (isOp(t, "÷")) { p++; v /= unary(); }
        else if (startsPrimary(t)) v *= power();
        else return v;
      }
    }
    function expr() {
      var v = term();
      for (;;) {
        var t = peek();
        if (isOp(t, "+")) { p++; v += term(); }
        else if (isOp(t, "-")) { p++; v -= term(); }
        else return v;
      }
    }
    var v = expr();
    if (p < toks.length) throw new Error("bad");
    if (!isFinite(v)) throw new Error("nan");
    return v;
  }

  var calc = (function () {
    var box = el("div", "hd-calc");
    box.hidden = true;
    var keys = [
      ["7", "8", "9", "÷", "C"],
      ["4", "5", "6", "×", "⌫"],
      ["1", "2", "3", "−", "("],
      ["0", ".", "π", "+", ")"],
      ["x²", "Ans", "="],
    ];
    box.innerHTML =
      '<div class="hd-calc-head"><span>Calculator</span><button type="button" class="hd-calc-x" aria-label="Close">×</button></div>' +
      '<div class="hd-calc-scr"><div class="hd-calc-expr"></div><div class="hd-calc-out">0</div></div>' +
      '<div class="hd-calc-keys">' + keys.map(function (row) {
        return row.map(function (k) {
          var cls = k === "=" ? "eq" : /^[0-9.]$/.test(k) ? "num" : k === "C" || k === "⌫" ? "clr" : "op";
          return '<button type="button" class="' + cls + '" data-k="' + k + '">' + k + "</button>";
        }).join("");
      }).join("") + "</div>";
    stage.appendChild(box);
    var exprEl = box.querySelector(".hd-calc-expr"), outEl = box.querySelector(".hd-calc-out");
    var expr = "", ans = 0, done = false;
    function show(out) {
      exprEl.textContent = expr || " ";
      if (out != null) outEl.textContent = out;
    }
    function fmtCalc(v) {
      var r = parseFloat(v.toPrecision(10));
      return String(Math.abs(r) < 1e-12 ? 0 : r);
    }
    function press(k) {
      if (k === "C") { expr = ""; done = false; show("0"); return; }
      if (k === "⌫") { expr = done ? "" : expr.replace(/(Ans|.)$/, ""); done = false; show(); return; }
      if (k === "=") {
        if (!expr) return;
        try { ans = calcEval(expr.replace(/−/g, "-"), ans); show(fmtCalc(ans)); done = true; }
        catch (e) { show("Error"); }
        return;
      }
      var ins = k === "x²" ? "²" : k;
      if (done) { expr = /^[÷×−+²]$/.test(ins) ? "Ans" : ""; done = false; }
      expr += ins;
      show();
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.classList.contains("hd-calc-x")) { api.hide(); return; }
      SFX.blip();
      press(b.getAttribute("data-k"));
    });
    var KEYMAP = { "*": "×", "x": "×", "/": "÷", "-": "−", "+": "+", "(": "(", ")": ")", ".": ".", "p": "π", "Enter": "=", "=": "=", "Backspace": "⌫", "Escape": "C", "^": "x²" };
    document.addEventListener("keydown", function (e) {
      if (box.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement;
      if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA")) return;
      if (a && a.tagName === "BUTTON" && !box.contains(a) && (e.key === "Enter" || e.key === " ")) return;
      var k = /^[0-9]$/.test(e.key) ? e.key : KEYMAP[e.key];
      if (!k) return;
      e.preventDefault();
      press(k);
    });
    var api = {
      toggle: function () { box.hidden = !box.hidden; stage.classList.toggle("calc-on", !box.hidden); },
      hide: function () { box.hidden = true; stage.classList.remove("calc-on"); },
    };
    return api;
  })();

  function parseCount(s) { return /^\d+$/.test(s) ? parseInt(s, 10) : NaN; }

  // The unit box already shows "π cm³", so a stray π or "pi" typed by the student is ignored.
  function parseCoef(s) {
    var t = String(s || "").toLowerCase().replace(/\s+/g, "").replace(/cm(3|³)?$/, "").replace(/pi|π/g, "");
    return /^\d*\.?\d+$/.test(t) ? parseFloat(t) : NaN;
  }

  /* ================================================================
   * Game state and flow
   * ================================================================ */

  var state = { mode: "title", phase: "", strikes: [], cooled: 0, pools: 0, elapsed: 0, poolIdx: 0, seen: {}, last: performance.now(), rush: false };
  var cur = null;

  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY_BEST)) || {}; } catch (e) { return {}; } }
  function trained() { try { return localStorage.getItem(KEY_TRAINED) === "1"; } catch (e) { return false; } }

  var SCHEDULE = [
    { kind: "cyl" }, { kind: "tri" }, { kind: "cuboid", fromRim: true }, { kind: "trough" },
    { kind: "cone" }, { kind: "capsule" }, { kind: "pyr" }, { kind: "frustum" },
  ];
  var SHIFT_POOLS = SCHEDULE.length;
  function specFor(i) { return SCHEDULE[Math.min(i, SHIFT_POOLS - 1)]; }

  var WANG_NEW = {
    cyl: "Real pools now! Plain round tank. I filled it to… somewhere.",
    tri: "A triangle-shaped tank! The top view shows the triangle's base and its height.",
    cuboid: "A box-shaped tank this time! Length, width, height.",
    trough: "A V-shaped trough! It gets wider as the water rises.",
    rim: "I measured the water from the rim downwards this time. Sorry!",
    cone: "Funnel tank! Narrow at the bottom, wide at the top. Careful!",
    capsule: "This one has a round bottom. Don't worry, the water's already above it.",
    pyr: "Upside-down pyramid tank! A square on top, a point at the bottom.",
    frustum: "A bucket-shaped tank. Like a cone with its tip cut off!",
  };
  var WANG_RANDOM = [
    "Oops, the valve stuck again…",
    "Too much? Too little? I never know.",
    "I counted to ten and turned it off. Roughly.",
    "New water level again. Sorry!",
    "The gauge said something. I didn't read it.",
    "I think this one's fine? Probably?",
  ];
  var BOSS_OK = ["Full pool, zero waste. That's what I like!", "Every ball counts. Good work.", "Now THAT is efficiency."];
  var BOSS_OVER = ["Too many! That water's over the red line!", "Careful! That's boiling water!"];

  function wangLine(P, mode) {
    if (mode === "p1") return "Practice pool! I filled it to " + P.d + " cm. I think.";
    if (mode === "p2") return "Practice pool 2! The water's at a new height again, sorry!";
    if (P.ballGiven && !state.seen.ball) {
      state.seen.ball = state.seen[P.kind] = true;
      return "Uh oh, the new ball crate only says the " + (P.ballGiven === "d" ? "diameter" : "radius") + ". You'll have to work out each ball's volume yourself!";
    }
    var keys = [P.kind];
    if (P.fromRim) keys.push("rim");
    for (var i = 0; i < keys.length; i++) {
      if (!state.seen[keys[i]]) {
        keys.forEach(function (k) { state.seen[k] = true; });
        return WANG_NEW[keys[i]];
      }
    }
    return pick(WANG_RANDOM);
  }

  function openPool(mode, P) {
    closeCine();
    cur = { mode: mode, P: P };
    state.phase = "fill";
    var sc = buildScene(P, mode);
    cur.sc = sc;
    var practice = mode !== "shift";
    var cfg = {
      kicker: mode === "p1" ? "Practice 1 / 2" : mode === "p2" ? "Practice 2 / 2" : "Pool " + (state.poolIdx + 1) + " / " + SHIFT_POOLS,
      title: P.K.label,
      guide: mode === "p1" ? [
        "<b>1.</b> Free space = the gap between the water and the <span class=\"red\">red line</span>.",
        "<b>2.</b> Balls = free space ÷ " + ballText(P) + ", then round <b>down</b>.",
      ] : null,
      fields: mode === "p1" ? [
        { id: "free", label: "Free space", unit: P.K.noPi ? "cm³" : "π cm³", ph: "", vol: true },
        { id: "n", label: "Balls", unit: "", ph: "" },
      ] : [{ id: "n", label: "Balls", unit: "", ph: "" }],
      hints: mode === "p1" ? null : hintsFor(P),
      onDrop: onDrop,
      onAnswer: TEST || SHOW_ANSWER ? function () {
        var api = cur.api, free = cur.P.K.noPi ? cur.P.free : cur.P.free / PI;
        api.input("n").value = String(cur.P.N);
        if (mode === "p1") api.input("free").value = fmt(free);
        api.say("<b>Answer: " + cur.P.N + " balls</b><br>" + workLines(cur.P).join("<br>"), "tip");
      } : null,
      onInput: function (id, v) { if (id === "n") sc.console.set(v.trim() ? v.trim().slice(0, 4) : "---"); },
    };
    cur.api = buildPanel(cfg);
    cur.api.lock(true);
    setBed(practice ? "night" : state.rush ? "rush" : "night");
    var line1 = wangLine(P, mode);
    fillAnim(sc, P, function () {
      state.phase = "think";
      state.last = performance.now();
      sc.setWang("wave", "happy");
      bubble(sc.bubbles, { x: WANG_X + 8, y: FLOOR - 186 }, line1, { col: "#4fc98a", w: 290, ax: 0.15, ms: 6500 });
      cur.api.lock(false);
      cur.api.focus();
      if (cfg.guide) cur.api.say(cfg.guide.join("<br>"), "info");
    });
  }

  function onDrop() {
    if (state.phase !== "think" || !cur) return;
    var api = cur.api, P = cur.P, sc = cur.sc;
    if (cur.mode === "p1") {
      var free = parseCoef(api.raw("free"));
      if (!isFinite(free)) { api.mark("free", false); api.say("Fill in the free space first, e.g. 1500.", "warn"); return; }
      var fm = checkFree(P, P.K.noPi ? free : free * PI);
      if (fm) { api.mark("free", false); api.say(fm, "bad"); SFX.scold(); return; }
      api.mark("free", true);
    }
    var n = parseCount(api.raw("n"));
    if (!isFinite(n) || n <= 0) { api.mark("n", false); api.say("Type a whole number of balls, like 25.", "warn"); return; }
    state.phase = "anim";
    api.lock(true);
    api.say("");
    sc.bubbles.innerHTML = "";
    sc.console.press();
    SFX.press();
    sc.setYou("press", "normal");
    sc.setWang("idle", "shock");
    wait(260, function () { dropAnim(n, function (level) { resolve(n, level); }); });
  }

  function checkFree(P, v) {
    if (relOK(v, P.free)) return null;
    var K = P.K, c = [
      [K.V(P, P.S), "That's the whole tank up to the red line. Xiao Wang's water is already in there, so subtract it."],
      [K.V(P, P.H) - K.V(P, P.d), "Up to the rim? No: the red line is the limit."],
      [K.V(P, P.d), "That's the water already in the tank. You want the EMPTY space above it, up to the red line."],
      [K.V(P, P.H), "That's the whole tank. Only the gap between the water and the red line is free."],
      [PI * P.R * (P.S - P.d), "Square the radius: the base area is πR²."],
    ];
    for (var i = 0; i < c.length; i++) if (relOK(v, c[i][0])) return c[i][1];
    return "Not quite. Free space = πR² × (S − d), with R = " + P.R + ", S = " + P.S + " and d = " + P.d + ".";
  }

  function resolve(n, level) {
    var P = cur.P, sc = cur.sc, T = sc.T, api = cur.api, mode = cur.mode, shift = mode === "shift";
    var N = P.N, ok = n === N, over = n > N;
    var why = ok ? null : diagnose(P, n);
    var where = mode === "shift" ? "Pool " + (state.poolIdx + 1) + " / " + SHIFT_POOLS : "Tutorial";
    var lines = solutionHTML(P, where + " · " + P.K.label + (ok ? "" : " · you dropped " + n + ", the max is " + P.N));
    var retry = function () { openPool(mode, makePool(P.kind, P.opts)); };
    state.phase = "result";
    sc.console.set(String(n));
    if (ok) {
      T.redState("ok");
      SFX.win();
      flash(flashSteam);
      sc.setYou("thumbs", "happy");
      sc.setWang("wave", "happy");
      if (shift) { state.cooled += N; state.pools++; }
      api.result("good", "Perfect fill! " + N + " balls", "The water stopped just under the red line." + (shift ? " +" + N + " cooled." : ""), lines);
      if (!shift || Math.random() < 0.55) {
        sc.monitor.on("happy");
        bubble(sc.bubbles, sc.monitor.tip, pick(BOSS_OK), { dir: "left", col: "#ff8a8a", w: 290, ms: 4200 });
        wait(4400, function () { sc.monitor.off(); });
      }
    } else if (over) {
      if (!cur.burst) {
        var surf = T.surface(Math.min(level, P.H));
        burst(sc.fx, surf.x, surf.y, 1);
        SFX.splash();
        shake();
      }
      flash(flashRed);
      if (shift) state.strikes.push("burn");
      sc.setYou("ouch", "pain");
      sc.setWang("ouch", "shock");
      api.result("bad", "Too many! The max was " + N, (why || n + " balls pushed the water over the red line.") + (shift ? " <b>Burn! Strike " + state.strikes.length + " of " + LIVES + ".</b>" : ""), lines);
      sc.monitor.on("shock");
      bubble(sc.bubbles, sc.monitor.tip, pick(BOSS_OVER), { dir: "left", col: "#ff8a8a", w: 290, ms: 5000 });
    } else {
      T.wasted(level);
      SFX.scold();
      if (shift) state.strikes.push("scold");
      sc.setYou("shrug", "sad");
      sc.setWang("idle", "sad");
      var k = N - n;
      api.result("warn", "Too few! The max was " + N, (why || "The pool could take " + k + " more ball" + (k === 1 ? "" : "s") + ".") + (shift ? " <b>Wasted pool! Strike " + state.strikes.length + " of " + LIVES + ".</b>" : ""), lines);
      sc.monitor.on("angry");
      bubble(sc.bubbles, sc.monitor.tip, "That pool could take " + k + " more ball" + (k === 1 ? "" : "s") + "! You're wasting my money!", { dir: "left", col: "#ff8a8a", w: 290, ms: 5000 });
    }
    updateHUD();
    if (mode === "p1" || mode === "p2") {
      if (ok) api.next(mode === "p1" ? "Next practice ▸" : "Start the night shift ▸", mode === "p1" ? function () { openPool("p2", makePool("cyl", { min: 12, max: 60 })); } : finishTraining);
      else api.next("Try again ▸", retry, true);
      return;
    }
    if (state.strikes.length >= LIVES) {
      api.next("Uh oh… ▸", function () { endShift(state.strikes[LIVES - 1] === "burn" ? "hospital" : "fired"); }, true);
      return;
    }
    if (!ok) {
      api.next("Try again ▸", retry, true);
      return;
    }
    if (state.poolIdx >= SHIFT_POOLS - 1) {
      api.next("Clock out early ▸", function () { endShift("early"); });
      return;
    }
    api.next("Next pool ▸", function () { state.poolIdx++; openPool("shift", poolFor(state.poolIdx)); });
  }

  function poolFor(i) {
    var spec = specFor(i), o = {};
    for (var k in spec) o[k] = spec[k];
    if (i >= 4) o.ballR = i === 4 || Math.random() < 0.6;
    return makePool(spec.kind, o);
  }

  function finishTraining() {
    try { localStorage.setItem(KEY_TRAINED, "1"); } catch (e) {}
    startShift();
  }

  function startShift(quick) {
    state.mode = "shift";
    state.strikes = [];
    state.cooled = 0;
    state.pools = 0;
    state.elapsed = 0;
    state.poolIdx = 0;
    state.seen = {};
    state.rush = false;
    openCine();
    setBg("hd-floor.jpg", "ken-c");
    setBed("night");
    if (quick === true) { openPool("shift", poolFor(0)); return; }
    showCard({ kicker: "Night shift", h: "22:00", sub: SHIFT_POOLS + " pools · finish early, go home early · 3 strikes and you're out" }, function () {
      talk([{ who: "boss", mood: "normal", cast: { r: ["boss", "point", "normal"] }, lines: ["Tonight there are " + SHIFT_POOLS + " pools. Finish them all and you can go home early. If not, you stay until sunrise at 06:00. Don't burn yourself, and don't waste my pools."] }], function () {
        openPool("shift", poolFor(0));
      });
    });
  }

  function endShift(kind) {
    state.phase = "end";
    state.mode = "end";
    audio.birds = 0;
    var best = loadBest(), isBest = state.cooled > (best.cooled || 0);
    if (isBest) { try { localStorage.setItem(KEY_BEST, JSON.stringify({ cooled: state.cooled, pools: state.pools })); } catch (e) {} }
    openCine();
    talk(ENDINGS[kind](), function () { endCard(kind, isBest); });
  }

  function tick() {
    var now = performance.now(), dt = now - state.last;
    state.last = now;
    if (state.mode !== "shift" || !cur || cur.mode !== "shift" || state.phase !== "think" || !stageVisible()) return;
    state.elapsed += Math.min(dt, 1000);
    if (!state.rush && state.elapsed >= SHIFT_MS * 7 / 8) { state.rush = true; setBed("rush"); }
    if (state.elapsed >= SHIFT_MS) {
      state.elapsed = SHIFT_MS;
      updateHUD();
      endShift("dawn");
      return;
    }
    updateHUD();
  }
  setInterval(tick, 200);

  /* ================================================================
   * Cutscenes
   * ================================================================ */

  var cine = el("div", "hdc",
    '<img class="hdc-bg" alt=""><img class="hdc-bg" alt="">' +
    '<div class="hdc-vig"></div>' +
    '<div class="hdc-actor l"></div><div class="hdc-actor r"></div>' +
    '<div class="hdc-card"><p></p><div class="hdc-card-h"></div><span></span></div>' +
    '<div class="hdc-dialog"><div class="hdc-face"></div><div class="hdc-dbody"><div class="hdc-name"></div><p class="hdc-line"></p></div><span class="hdc-next">▼</span></div>' +
    '<div class="hdc-title" hidden></div>' +
    '<div class="hdc-tools"><button type="button" class="hdc-tool skip" hidden>Skip ▸▸</button><button type="button" class="hdc-tool snd"></button></div>');
  cine.hidden = true;
  stage.appendChild(cine);
  var bgs = cine.querySelectorAll(".hdc-bg");
  var actors = { l: cine.querySelector(".hdc-actor.l"), r: cine.querySelector(".hdc-actor.r") };
  var cCard = cine.querySelector(".hdc-card");
  var dialog = cine.querySelector(".hdc-dialog");
  var dFace = cine.querySelector(".hdc-face");
  var dName = cine.querySelector(".hdc-name");
  var dLine = cine.querySelector(".hdc-line");
  var cTitle = cine.querySelector(".hdc-title");
  var skipBtn = cine.querySelector(".skip");
  cine.querySelector(".snd").textContent = audio.muted ? "Sound off" : "Sound on";

  var talking = null, cineGen = 0, bgIdx = 0, bgName = "";
  function cineLater(ms, fn) { var g = cineGen; setTimeout(function () { if (g === cineGen) fn(); }, ms); }

  function setBg(name, ken) {
    if (name === bgName && !ken) return;
    bgName = name;
    var curImg = bgs[bgIdx], nxt = bgs[1 - bgIdx];
    bgIdx = 1 - bgIdx;
    var url = ART + name + AV;
    var show = function () {
      nxt.className = "hdc-bg";
      void nxt.offsetWidth;
      nxt.className = "hdc-bg on" + (ken ? " " + ken : "");
      curImg.classList.remove("on");
    };
    if (nxt.getAttribute("src") === url && nxt.complete) { show(); return; }
    nxt.onload = show;
    nxt.onerror = show;
    nxt.setAttribute("src", url);
  }

  // Painted cutscene portraits; the in-game SVG figure is the fallback if a file is missing.
  var CHAR_ART = {
    you: { normal: "you-normal", happy: "you-normal", pain: "you-hurt", sad: "you-sad", shock: "you-normal" },
    wang: { normal: "wang-happy", happy: "wang-happy", sad: "wang-sad", shock: "wang-sad" },
    boss: { normal: "boss-normal", angry: "boss-angry", happy: "boss-happy", shock: "boss-angry" },
  };
  function artFor(who, mood, band) {
    if (who === "you" && band >= 2 && mood !== "sad") mood = "pain";
    var set = CHAR_ART[who];
    return ART + "chars/" + (set[mood] || set.normal) + ".png" + AV;
  }

  function setCast(cast) {
    ["l", "r"].forEach(function (side) {
      var a = actors[side], spec = cast && cast[side];
      if (!spec) { a.classList.remove("on"); return; }
      var band = spec[0] === "you" ? (spec[3] != null ? spec[3] : burns()) : 0;
      a.innerHTML = "";
      a.classList.add("art");
      var img = el("img");
      img.alt = NAMES[spec[0]];
      img.onerror = function () {
        a.classList.remove("art");
        a.innerHTML = "";
        a.appendChild(figure(spec[0], spec[1], spec[2], band, side === "r"));
      };
      img.src = artFor(spec[0], spec[2], band);
      a.appendChild(img);
      a.classList.add("on");
    });
  }

  function setFace(who, mood, band) {
    dFace.innerHTML = "";
    dFace.appendChild(portrait(who, mood, band));
  }

  function openCine() {
    gen++;
    cineGen++;
    talking = null;
    cur = null;
    panel.innerHTML = "";
    board.innerHTML = "";
    hud = null;
    cine.hidden = false;
    dialog.classList.remove("on");
    cCard.classList.remove("on");
    cTitle.hidden = true;
    skipBtn.hidden = true;
    setCast(null);
  }

  function closeCine() {
    cineGen++;
    talking = null;
    cine.hidden = true;
    setCast(null);
  }

  function talk(beats, done) {
    if (!beats.length) { done(); return; }
    var g = cineGen, bi = -1, li = 0, typing = null, text = "";
    var api = { advance: advance, skip: finish };
    talking = api;
    skipBtn.hidden = false;
    nextBeat();

    function nextBeat() {
      bi++;
      if (bi >= beats.length) { finish(); return; }
      var b = beats[bi];
      li = 0;
      if (b.bg) setBg(b.bg, b.ken);
      if (b.music) setBed(b.music);
      if (b.sfx && SFX[b.sfx]) SFX[b.sfx]();
      if ("cast" in b) setCast(b.cast);
      showLine();
    }

    function showLine() {
      var b = beats[bi], who = b.who || null;
      dialog.className = "hdc-dialog on" + (who ? " who-" + who : " narration");
      dFace.innerHTML = "";
      if (who) {
        dFace.hidden = false;
        setFace(who, b.mood || "normal", who === "you" ? (b.band != null ? b.band : burns()) : 0);
        dName.textContent = NAMES[who];
      } else {
        dFace.hidden = true;
      }
      type(b.lines[li]);
    }

    function type(s) {
      text = s;
      dLine.textContent = "";
      var n = 0;
      clearInterval(typing);
      typing = setInterval(function () {
        if (g !== cineGen) { clearInterval(typing); return; }
        n++;
        dLine.textContent = text.slice(0, n);
        if (n % 3 === 0) SFX.blip();
        if (n >= text.length) { clearInterval(typing); typing = null; }
      }, 22);
    }

    function advance() {
      if (talking !== api) return;
      if (typing) { clearInterval(typing); typing = null; dLine.textContent = text; return; }
      if (li < beats[bi].lines.length - 1) { li++; showLine(); return; }
      nextBeat();
    }

    function finish() {
      if (talking !== api) return;
      clearInterval(typing);
      talking = null;
      skipBtn.hidden = true;
      dialog.classList.remove("on");
      if (g === cineGen) done();
    }
  }

  function showCard(c, done) {
    SFX.whoosh();
    cCard.querySelector("p").textContent = c.kicker;
    cCard.querySelector(".hdc-card-h").textContent = c.h;
    cCard.querySelector("span").textContent = c.sub;
    requestAnimationFrame(function () { cCard.classList.add("on"); });
    var ended = false, api = { advance: end, skip: end };
    talking = api;
    skipBtn.hidden = false;
    cineLater(2800, end);
    function end() {
      if (ended || talking !== api) return;
      ended = true;
      talking = null;
      skipBtn.hidden = true;
      cCard.classList.remove("on");
      cineLater(400, done);
    }
  }

  function showTitleScreen(o) {
    cTitle.innerHTML =
      '<p class="hdc-kicker">' + o.kicker + "</p>" +
      '<div class="hdc-h">' + o.h + "</div>" +
      '<p class="hdc-sub">' + o.sub + "</p>" +
      (o.best ? '<p class="hdc-best">' + o.best + "</p>" : "") +
      '<div class="hdc-go-row">' + o.actions.map(function (a, i) {
        return '<button type="button" class="hdc-go' + (a.alt ? " alt" : "") + '" data-i="' + i + '">' + a.label + "</button>";
      }).join("") + "</div>";
    cTitle.className = "hdc-title" + (o.cls ? " " + o.cls : "");
    cTitle.hidden = false;
    Array.prototype.forEach.call(cTitle.querySelectorAll(".hdc-go"), function (b) {
      b.addEventListener("click", function () {
        ensureAudio();
        SFX.click();
        cTitle.hidden = true;
        o.actions[+b.getAttribute("data-i")].fn();
      });
    });
  }

  var OPENING = [
    { bg: "hd-floor.jpg", ken: "ken-a", music: "night", cast: null, lines: ["22:00. Sunrise Steel Works. The night shift is about to start."] },
    { bg: "hd-office.jpg", ken: "ken-b", who: "boss", mood: "normal", cast: { r: ["boss", "hips", "normal"] }, lines: [
      "You're the new cooling-pool operator? Good. Listen carefully.",
      "The furnace makes steel balls all night. They come out red-hot, and you drop them into a cooling pool.",
    ] },
    { who: "boss", mood: "angry", cast: { r: ["boss", "point", "angry"] }, lines: [
      "Every pool has a red line. Water over it? Boiling water everywhere, and YOU get burnt.",
      "Drop too few? You're wasting my pool. So: the most balls possible, and not one more.",
    ] },
    { bg: "hd-valve.jpg", ken: "ken-b", who: "wang", mood: "happy", cast: { l: ["wang", "wave", "happy"] }, lines: ["Hi! I'm Xiao Wang. I fill the pools with water. It's my first week too!"] },
    { who: "wang", mood: "sad", cast: { l: ["wang", "shrug", "sad"] }, lines: ["The valve is… tricky. I never get the same water level twice. Sorry in advance!"] },
    { who: "you", mood: "normal", cast: { l: ["wang", "shrug", "sad"], r: ["you", "idle", "normal"] }, lines: ["So the number of balls changes every time. I'll have to work it out for every single pool."] },
    { bg: "hd-floor.jpg", who: "boss", mood: "normal", cast: { r: ["boss", "point", "normal"] }, lines: [
      "Three mistakes, burns or wasted pools, and you're done for the night. Last until sunrise.",
      "First, two practice pools. Practice doesn't count.",
    ] },
  ];

  var ENDINGS = {
    dawn: function () {
      return [
        { bg: "hd-dawn.jpg", ken: "ken-a", music: "dawn", cast: null, lines: ["06:00. The sun rises over Sunrise Steel Works."] },
        { who: "boss", mood: "happy", cast: { r: ["boss", "thumbs", "happy"] }, lines: [state.cooled + " balls cooled in " + state.pools + " pools. Not bad for a first night!"] },
        { who: "wang", mood: "happy", cast: { l: ["wang", "wave", "happy"], r: ["boss", "thumbs", "happy"] }, lines: ["Same time tomorrow? I promise I'll practise the valve!"] },
      ];
    },
    early: function () {
      var t = clockText();
      return [
        { bg: "hd-floor.jpg", ken: "ken-a", music: "dawn", cast: null, lines: [t + ". All " + SHIFT_POOLS + " pools are done, and the sun isn't even up yet."] },
        { who: "boss", mood: "happy", cast: { r: ["boss", "thumbs", "happy"] }, lines: [
          "All " + SHIFT_POOLS + " pools, finished by " + t + "? That's tonight's whole job done ahead of schedule!",
          state.cooled + " balls cooled and not a second wasted. That's what I call efficient work. Clock out and go home early. You've earned it!",
        ] },
        { who: "wang", mood: "happy", cast: { l: ["wang", "wave", "happy"], r: ["boss", "thumbs", "happy"] }, lines: ["You're going home early? Lucky! …Can you teach me the valve tomorrow?"] },
      ];
    },
    hospital: function () {
      return [
        { bg: "hd-hospital.jpg", ken: "ken-c", music: "sad", cast: null, lines: ["The next morning. City Hospital, burns ward."] },
        { who: "you", mood: "pain", band: 3, cast: { r: ["you", "idle", "pain", 3] }, lines: ["Ow. Ow. Ow. Next time I'm rounding DOWN."] },
        { who: "wang", mood: "sad", cast: { l: ["wang", "shrug", "sad"], r: ["you", "idle", "pain", 3] }, lines: ["I brought you grapes! …They got a bit cooked on the way. Sorry."] },
      ];
    },
    fired: function () {
      return [
        { bg: "hd-fired.jpg", ken: "ken-b", music: "sad", cast: null, lines: ["Outside the factory gate, a little before sunrise."] },
        { who: "boss", mood: "angry", cast: { r: ["boss", "hips", "angry"] }, lines: ["Half-empty pools, all night long! Do you know what that costs me? You're FIRED!"] },
        { who: "you", mood: "sad", cast: { l: ["you", "shrug", "sad"], r: ["boss", "hips", "angry"] }, lines: ["…Next time I'll use every last bit of space."] },
      ];
    },
  };

  function bestLine() {
    var b = loadBest();
    return b.cooled ? "Best shift: <b>" + b.cooled + "</b> balls cooled in " + b.pools + " pools" : "";
  }

  function endCard(kind, isBest) {
    var head = { early: ["Clocked out at " + clockText(), "HOME<span>EARLY</span>"], dawn: ["Shift complete", "SUNRISE<span>SURVIVED</span>"], hospital: ["Injured on duty", "BURNS<span>WARD</span>"], fired: ["Contract terminated", "YOU'RE<span>FIRED</span>"] }[kind];
    showTitleScreen({
      cls: "bottom",
      kicker: head[0],
      h: head[1],
      sub: "<b>" + state.cooled + "</b> balls cooled in <b>" + state.pools + "</b> pools." + (isBest ? " New best!" : "") + " Every pool had a different water level, and you worked each one out.",
      actions: [
        { label: "Work another shift ▸", fn: function () { startShift(true); } },
        { label: "Title", alt: true, fn: showTitle },
      ],
    });
  }

  function startStory() {
    state.mode = "practice";
    state.strikes = [];
    state.cooled = 0;
    state.pools = 0;
    state.elapsed = 0;
    talk(OPENING, function () {
      var P = finishPool({ R: 20, H: 50, S: 44, d: 37, bc: 36 }, "cyl", {});
      openPool("p1", P);
    });
  }

  function showTitle() {
    openCine();
    state.mode = "title";
    setBg("hd-title.jpg");
    setBed("night");
    var actions = [
      { label: "Start the night shift ▸", fn: startStory },
      { label: "Skip tutorial", alt: true, fn: function () { startShift(true); } },
    ];
    showTitleScreen({
      kicker: "JM32 · Areas & Volumes",
      h: "HOT<span>DROP</span>",
      sub: "Red-hot steel balls. A cooling pool. A water boy who never fills it the same way twice. Drop as many balls as you can, <b>without crossing the red line</b>.",
      best: bestLine(),
      actions: actions,
    });
  }

  skipBtn.addEventListener("click", function (e) { e.stopPropagation(); if (talking) talking.skip(); });
  cine.querySelector(".hdc-tools .snd").addEventListener("click", function (e) { e.stopPropagation(); ensureAudio(); setMuted(!audio.muted); });
  stage.addEventListener("pointerdown", ensureAudio);
  cine.addEventListener("click", function (e) {
    if (!talking || (e.target.closest && e.target.closest(".hdc-tools, .hdc-title"))) return;
    talking.advance();
  });
  document.addEventListener("keydown", function (e) {
    if (!talking || !stageVisible()) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space" || e.key === " " || e.key === "Enter") { e.preventDefault(); talking.advance(); }
  });

  /* Games sub-navigation on the lesson page */
  var sub = document.getElementById("games-subnav");
  if (sub) sub.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-game]");
    if (!btn) return;
    var name = btn.getAttribute("data-game");
    Array.prototype.forEach.call(sub.querySelectorAll("[data-game]"), function (c) { c.classList.toggle("active", c === btn); });
    var hd = document.getElementById("hd-root"), bl = document.getElementById("av-builder");
    if (hd) hd.classList.toggle("game-off", name !== "hotdrop");
    if (bl) bl.classList.toggle("game-off", name !== "builder");
    var rs = document.getElementById("rs-root");
    if (rs) rs.classList.toggle("game-off", name !== "ratio");
  });

  if (TEST) {
    window.__hd = {
      state: state,
      cur: function () { return cur; },
      makePool: makePool,
      sol: function (kind, o) { return solutionHTML(makePool(kind, o || {}), "test"); },
      open: function (mode, kind, o) { state.mode = mode === "shift" ? "shift" : "practice"; openPool(mode, makePool(kind, o || {})); },
      answer: function (delta) {
        if (!cur) return;
        var i = cur.api.input("n");
        i.value = String(cur.P.N + (delta || 0));
        if (cur.mode === "p1") cur.api.input("free").value = String(cur.P.K.noPi ? cur.P.free : cur.P.free / PI);
        panel.querySelector(".go").click();
      },
      shift: startShift,
      end: endShift,
    };
  }

  ["hd-title.jpg", "hd-floor.jpg", "hd-valve.jpg", "hd-play.jpg"].forEach(function (n) { new Image().src = ART + n + AV; });
  showTitle();
})();
