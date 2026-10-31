/* JM24 Magnitude Express: standard form, kept separate from Index cards. */
(function () {
  "use strict";

  var SUP = { "0": "\u2070", "1": "\u00b9", "2": "\u00b2", "3": "\u00b3", "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079", "-": "\u207b" };

  function sup(n) {
    return String(n).split("").map(function (c) { return SUP[c] || c; }).join("");
  }

  function fmt(m) {
    var rounded = Math.round(Math.abs(m) * 1e8) / 1e8;
    var text = rounded.toFixed(8).replace(/\.?0+$/, "");
    return (m < 0 && rounded !== 0 ? "\u2212" : "") + text;
  }

  function label(m, e) {
    return fmt(m) + " \u00d7 10" + sup(e);
  }

  var RULE = "1 \u2264 a < 10";

  var INTRO = [
    "Hey! Over here. Welcome to Station A-12, home of the Magnitude Express. You must be our new worker. Today is your first day!",
    "I'm OTTO, the AI supervisor here. Don't worry, the job is simple. Crates arrive from the edge of space, and we load them onto our cargo train out there.",
    "Come with me. Let me show you how the work goes!",
  ];

  var TRAINING = [
    {
      name: "SMALL NUMBERS", kind: "label",
      crates: ["0.00056"],
      task: "A crate arrives: 0.00056. Send its label in standard form.",
      say: [
        "Lesson 1: small numbers. This crate holds less than 1: 0.00056.",
        "The train only reads labels like a \u00d7 10\u207f, where a is at least 1 and less than 10. Move the decimal point RIGHT until the first non-zero digit is in front of it. Count the jumps. Small numbers get a NEGATIVE n.",
      ],
      steps: [{ m: 5.6, e: -4, act: "ship", hint: "Don't forget the minus sign on n. And a must be at least 1 and less than 10." }],
      done: "Correct! A number smaller than 1 has a negative n.",
    },
    {
      name: "TIE AND FIX (\u00d7)", kind: "op", op: "\u00d7", verb: "Multiply",
      crates: [label(4, 9), label(5, 2)],
      task: "Tie 4 \u00d7 10\u2079 and 5 \u00d7 10\u00b2 together. Send the raw answer first.",
      say: [
        "Lesson 2: tying crates. When two crates are tied together, their labels MULTIPLY: multiply the front numbers and ADD the powers of 10.",
        "Type exactly what you get, even if it breaks the rule. Don't fix it yet!",
      ],
      steps: [
        {
          m: 20, e: 11, act: "tie-held",
          hint: "Type the raw answer first: multiply the front numbers and add the powers. You fix it after.",
          after: "See the red HELD sign? a is 10 or more. Make a 10 times smaller, and add 1 to n. Same amount, correct label!",
        },
        { m: 2, e: 12, act: "ship", hint: "a must be at least 1 and less than 10. If a gets 10 times smaller, n goes up by 1." },
      ],
      done: "Great! Tie first, fix second. That's how this station works.",
    },
    {
      name: "ADD (+)", kind: "add", op: "+",
      vals: [[2.4, 5], [3, 4]],
      total: { m: 2.7, e: 5 },
      task: "Add 2.4 \u00d7 10\u2075 and 3 \u00d7 10\u2074. Click one crate, then change its label so both powers match.",
      say: [
        "Lesson 3: adding. You can only add labels with the SAME power of 10.",
        "Click ONE crate. Then change its label so its power matches the other crate. The amount inside must stay the same.",
      ],
      done: "Excellent! Same power first, then add. On your own shift, you can also send the total in one go.",
    },
  ];

  var PRAISE_TIE = "Whoa, a mental maths master? You skipped the relabel step and shipped it straight away!";
  var PRAISE_ADD = "You skipped the relabel step? What a crazy mental maths genius!";
  var MAX_STRIKES = 3;
  var PAY = 10;
  var BEST_KEY = "magnitude-express-best";

  var POW_BADGE = { "2": "2", "3": "3", "0": "0", "-1": "\u22121", "0.5": "0.5", "1/3": "1/3" };
  var POW_TEXT = { "2": "\u00b2", "3": "\u00b3", "0": "\u2070", "-1": "\u207b\u00b9", "0.5": " to the power 0.5", "1/3": " to the power 1/3" };

  var TIPS = {
    big: "A big number! Move the decimal point LEFT until one digit is in front. Count the jumps. That is n.",
    div: "A \u00f7 sign means divide: divide the front numbers and SUBTRACT the powers.",
    sub: "New job: subtracting! It works like adding: make the powers the same first.",
    sq: "New cargo: a crate with a power! (a \u00d7 10\u207f)\u00b2 means square BOTH parts: a\u00b2 and (10\u207f)\u00b2.",
    cube: "Power 3! Cube the front number, and multiply the power of 10 by 3.",
    neg: "A minus sign inside the brackets! Think carefully: is the answer positive or negative?",
    zero: "Power 0! Remember your index laws.",
    inv: "Power \u22121 means 'one over'. Then fix the label if a breaks the rule.",
    half: "Power 0.5 means square root. Tip: make the power of 10 even first.",
    third: "Power 1/3 means cube root. Tip: make the power of 10 a multiple of 3 first.",
    chain: "Three or more crates! Only \u00d7 and \u00f7 here, so work from left to right.",
    mixed: "Mixed signs! Do \u00d7 and \u00f7 first, then + and \u2212.",
    chain4: "Four crates now! Same rules: \u00d7 and \u00f7 first, then + and \u2212.",
    mixedpow: "A power inside a long job! Powers first, then \u00d7 and \u00f7, then + and \u2212.",
  };

  TRAINING.forEach(function (dock, i) {
    dock.training = true;
    dock.code = "TRAINING " + (i + 1) + "/" + TRAINING.length;
    if (dock.vals) dock.crates = dock.vals.map(function (v) { return label(v[0], v[1]); });
  });
  var DOCKS = TRAINING.slice();

  var MANT = [1.2, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9];
  var DIVS = [1.25, 1.6, 2, 2.5, 4, 5, 8];
  var LEVELS = [
    { upTo: 2, kinds: ["label", "mul", "div"] },
    { upTo: 5, kinds: ["mul", "div", "add", "sq", "label"] },
    { upTo: 8, kinds: ["add", "sub", "sq", "cube", "mul", "div"] },
    { upTo: 12, kinds: ["zero", "inv", "half", "third", "cube", "sub", "chain3"] },
    { upTo: 17, kinds: ["mixed3", "chain3", "half", "third", "inv", "sq", "cube", "sub"] },
    { upTo: Infinity, kinds: ["mixed4", "mixedpow", "chain4", "mixed3", "third", "half", "inv", "cube"] },
  ];
  var CHAINS = {
    chain3: { count: 3, mixed: false, name: "3 CRATES", tip: "chain" },
    chain4: { count: 4, mixed: false, name: "4 CRATES", tip: "chain" },
    mixed3: { count: 3, mixed: true, name: "MIXED", tip: "mixed" },
    mixed4: { count: 4, mixed: true, name: "MIXED (4)", tip: "chain4" },
    mixedpow: { count: 3, mixed: true, pow: true, name: "MIXED + POWER", tip: "mixedpow" },
  };
  var seenKinds = {};
  var seenTips = {};
  var lastKind = "";

  function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function between(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function chance(p) {
    return Math.random() < p;
  }

  function value(m, e) {
    return normal(round(m), e);
  }

  function times(a, b) {
    return value(a.m * b.m, a.e + b.e);
  }

  function over(a, b) {
    return value(a.m / b.m, a.e - b.e);
  }

  function plus(a, b, sign) {
    if (!a || !b || Math.abs(a.e - b.e) > 5) return null;
    var e = Math.min(a.e, b.e);
    return value(a.m * Math.pow(10, a.e - e) + sign * b.m * Math.pow(10, b.e - e), e);
  }

  function raised(v, pow) {
    if (pow === "0") return { m: 1, e: 0 };
    if (pow === "-1") return value(1 / v.m, -v.e);
    if (pow === "2") return times(v, v);
    return times(times(v, v), v);
  }

  function tidy(v) {
    return !!v && v.m !== 0 && Math.abs(v.e) <= 15 && nearly(Math.round(v.m * 1000), v.m * 1000);
  }

  function evaluate(items, ops) {
    var vals = items.map(function (it) { return it.pow ? raised(it.v, it.pow) : it.v; });
    var terms = [vals[0]];
    var signs = [1];
    ops.forEach(function (op, i) {
      var last = terms.length - 1;
      if (op === "\u00d7") terms[last] = times(terms[last], vals[i + 1]);
      else if (op === "\u00f7") terms[last] = over(terms[last], vals[i + 1]);
      else {
        terms.push(vals[i + 1]);
        signs.push(op === "+" ? 1 : -1);
      }
    });
    var total = terms[0];
    for (var k = 1; k < terms.length; k++) total = plus(total, terms[k], signs[k]);
    return total;
  }

  function exprText(items, ops) {
    return items.map(function (it, i) {
      var text = label(it.v.m, it.v.e);
      if (it.pow) text = "(" + text + ")" + POW_TEXT[it.pow];
      return (i ? " " + ops[i - 1] + " " : "") + text;
    }).join("");
  }

  function ordinary(m, e) {
    var digits = fmt(m).replace(".", "");
    var point = 1 + e;
    var whole;
    var frac = "";
    if (point >= digits.length) {
      whole = digits + new Array(point - digits.length + 1).join("0");
    } else if (point <= 0) {
      whole = "0";
      frac = new Array(1 - point).join("0") + digits;
    } else {
      whole = digits.slice(0, point);
      frac = digits.slice(point);
    }
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (frac ? "." + frac : "");
  }

  function calcDock(name, items, ops, answer, raw, tips, extra) {
    return {
      name: name, kind: "calc", items: items, ops: ops, answer: answer, raw: raw, tips: tips,
      task: "Work out " + exprText(items, ops) + "." + (extra || "") + " Send the label.",
    };
  }

  function makeLabel() {
    var big = chance(0.5);
    var m = between(101, 999) / 100;
    var e = big ? between(4, 9) : between(-7, -3);
    var text = ordinary(m, e);
    return {
      name: big ? "BIG NUMBER" : "SMALL NUMBER", kind: "label", crates: [text],
      task: "A crate arrives: " + text + ". Send its label in standard form.",
      steps: [{ m: m, e: e, act: "ship" }],
      tips: big ? ["big"] : [],
    };
  }

  function makeOp(op) {
    var split = op === "\u00f7";
    for (var t = 0; t < 200; t++) {
      var a = { m: pickFrom(MANT), e: between(-6, 9) };
      var b = { m: split ? pickFrom(DIVS.concat([3, 6])) : pickFrom(MANT), e: between(-6, 9) };
      var raw = split ? { m: round(a.m / b.m), e: a.e - b.e } : { m: round(a.m * b.m), e: a.e + b.e };
      var answer = split ? over(a, b) : times(a, b);
      if (!tidy(answer) || !tidy(raw)) continue;
      return calcDock(split ? "SPLIT (\u00f7)" : "TIE (\u00d7)", [{ v: a }, { v: b }], [op], answer, raw, split ? ["div"] : []);
    }
    return null;
  }

  function makeAdd(op, n) {
    for (var t = 0; t < 200; t++) {
      var e1 = between(-5, 8);
      var a = [between(11, 99) / 10, e1];
      var b = [chance(0.5) ? between(1, 9) : between(11, 99) / 10, e1 - (n > 15 && chance(0.4) ? 2 : 1)];
      var vals = chance(0.5) ? [a, b] : [b, a];
      var total = plus({ m: vals[0][0], e: vals[0][1] }, { m: vals[1][0], e: vals[1][1] }, op === "+" ? 1 : -1);
      if (!tidy(total) || (total.m < 0 && n < 13)) continue;
      var texts = vals.map(function (v) { return label(v[0], v[1]); });
      return {
        name: op === "+" ? "ADD (+)" : "SUBTRACT (\u2212)", kind: "add", op: op, vals: vals, total: total, crates: texts,
        tips: op === "+" ? [] : ["sub"],
        task: "Work out " + texts[0] + " " + op + " " + texts[1] + ". Click a crate to relabel it, or send the answer straight away.",
      };
    }
    return null;
  }

  function makePower(kind, n) {
    var neg = n >= 13 && chance(0.4);
    var v, answer, pow, name;
    var raw = null;
    if (kind === "sq" || kind === "cube") {
      pow = kind === "sq" ? "2" : "3";
      v = kind === "sq"
        ? { m: pickFrom([1.1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9]), e: between(-5, 6) }
        : { m: pickFrom([1.2, 1.5, 2, 3, 4, 5]), e: between(-4, 4) };
      if (neg) v.m = -v.m;
      answer = raised(v, pow);
      raw = { m: round(Math.pow(v.m, Number(pow))), e: v.e * Number(pow) };
      name = kind === "sq" ? "SQUARE (\u00b2)" : "CUBE (\u00b3)";
    } else if (kind === "zero") {
      pow = "0";
      v = { m: (neg ? -1 : 1) * between(11, 99) / 10, e: between(-8, 9) };
      answer = { m: 1, e: 0 };
      name = "POWER 0";
    } else if (kind === "inv") {
      pow = "-1";
      v = { m: (neg ? -1 : 1) * pickFrom(DIVS), e: between(-6, 6) };
      answer = raised(v, pow);
      raw = { m: round(1 / v.m), e: -v.e };
      name = "POWER \u22121";
    } else if (kind === "half") {
      pow = "0.5";
      answer = { m: pickFrom([1.1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9]), e: between(-4, 5) };
      v = times(answer, answer);
      name = "POWER 0.5";
    } else {
      pow = "1/3";
      answer = { m: (neg ? -1 : 1) * pickFrom([1.5, 2, 3, 4, 5]), e: between(-3, 3) };
      v = times(times(answer, answer), answer);
      name = "CUBE ROOT";
    }
    return calcDock(name, [{ v: v, pow: pow }], [], answer, raw, neg ? [kind, "neg"] : [kind]);
  }

  function makeChain(spec) {
    var count = spec.pow ? between(3, 4) : spec.count;
    for (var t = 0; t < 400; t++) {
      var ops = [];
      for (var i = 0; i < count - 1; i++) {
        ops.push(pickFrom(spec.mixed ? ["\u00d7", "\u00f7", "+", "\u2212"] : ["\u00d7", "\u00f7"]));
      }
      var hasAdd = ops.some(function (op) { return op === "+" || op === "\u2212"; });
      var hasMul = ops.some(function (op) { return op === "\u00d7" || op === "\u00f7"; });
      if (spec.mixed && !(hasAdd && hasMul)) continue;
      var items = [];
      var base = between(-3, 7);
      var target = base;
      var cur = null;
      var powDone = !spec.pow;
      for (var k = 0; k < count; k++) {
        var before = k === 0 ? "+" : ops[k - 1];
        var after = ops[k];
        var endsTerm = !after || after === "+" || after === "\u2212";
        if (before === "+" || before === "\u2212") {
          target = base + between(-1, 1);
          cur = null;
        }
        if (cur === null && !powDone && !endsTerm) {
          var pv = { m: pickFrom([1.2, 1.5, 2, 3, 4, 5]), e: between(-2, 3) };
          items.push({ v: pv, pow: "2" });
          powDone = true;
          cur = 2 * pv.e;
        } else if (cur === null) {
          var e0 = endsTerm ? target : between(-4, 8);
          items.push({ v: { m: pickFrom(MANT), e: e0 } });
          cur = e0;
        } else {
          var e1 = endsTerm ? (before === "\u00d7" ? target - cur : cur - target) : between(-4, 8);
          items.push({ v: { m: before === "\u00f7" ? pickFrom(DIVS) : pickFrom(MANT), e: e1 } });
          cur = before === "\u00d7" ? cur + e1 : cur - e1;
        }
      }
      if (!powDone || items.some(function (it) { return Math.abs(it.v.e) > 12; })) continue;
      var answer = evaluate(items, ops);
      if (!tidy(answer)) continue;
      return calcDock(spec.name, items, ops, answer, null, [spec.tip], spec.mixed ? " Do \u00d7 and \u00f7 first." : "");
    }
    return null;
  }

  function build(kind, n) {
    if (kind === "label") return makeLabel();
    if (kind === "mul") return makeOp("\u00d7");
    if (kind === "div") return makeOp("\u00f7");
    if (kind === "add") return makeAdd("+", n);
    if (kind === "sub") return makeAdd("\u2212", n);
    if (CHAINS[kind]) return makeChain(CHAINS[kind]);
    return makePower(kind, n);
  }

  function makeDock(n) {
    var level = LEVELS.filter(function (l) { return n <= l.upTo; })[0];
    var fresh = level.kinds.filter(function (k) { return !seenKinds[k]; });
    var kind = fresh.length && chance(0.7)
      ? fresh[0]
      : pickFrom(level.kinds.filter(function (k) { return k !== lastKind; }));
    var dock = build(kind, n) || makeOp("\u00d7");
    seenKinds[kind] = true;
    lastKind = kind;
    dock.code = "DOCK " + n;
    return dock;
  }

  var dockIndex = 0;
  var stepIndex = 0;
  var selected = null;
  var heldFix = null;
  var cash = 0;
  var shortcuts = 0;
  var strikes = 0;
  var busy = true;
  var run = 0;
  var introAt = 0;
  var wrongTicket = 0;
  var typers = {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(id) {
    return document.getElementById(id);
  }

  function nearly(a, b) {
    return Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduce ? 0 : ms); });
  }

  function play(node, frames, ms, easing) {
    var anim = node.animate(frames, { duration: reduce ? 1 : ms, easing: easing || "ease", fill: "forwards" });
    return anim.finished.catch(function () {});
  }

  function stopAnims(node) {
    node.getAnimations().forEach(function (anim) { anim.cancel(); });
  }

  try { localStorage.removeItem("magnitude-express-sound"); } catch (e) {}
  var sound = (function () {
    var ctx = null;
    var sfxBus, musicBus, echo, noise;
    var active = true;
    var wantMusic = false;
    var musicOn = false;
    var timer = 0;
    var nextTime = 0;
    var step = 0;

    var STEP = 60 / 84 / 2;
    var CHORDS = [
      { root: 33, notes: [57, 60, 64, 67, 71] },
      { root: 29, notes: [57, 60, 64, 65, 69] },
      { root: 36, notes: [55, 60, 64, 67, 71] },
      { root: 28, notes: [55, 59, 62, 64, 67] },
    ];
    var ARP = [0, 2, 1, 3, 4, 3, 1, 2];

    function freq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

    function gainNode(v, to) {
      var g = ctx.createGain();
      g.gain.value = v;
      if (to) g.connect(to);
      return g;
    }

    function impulse(sec) {
      var len = Math.floor(ctx.sampleRate * sec);
      var buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var d = buf.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      return buf;
    }

    function init() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      var master = gainNode(0.9);
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      var verb = ctx.createConvolver();
      verb.buffer = impulse(3.4);
      verb.connect(gainNode(0.5, master));
      sfxBus = gainNode(0.6, master);
      sfxBus.connect(gainNode(0.18, verb));
      musicBus = gainNode(0, master);
      musicBus.connect(verb);
      echo = ctx.createDelay(1.5);
      echo.delayTime.value = STEP * 3;
      var feedback = gainNode(0.38, echo);
      var tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2600;
      echo.connect(tone);
      tone.connect(feedback);
      tone.connect(musicBus);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      loadSample("game-sound/crate-drop.mp3", "crate");
    }

    var samples = {};

    function loadSample(url, name) {
      fetch(url)
        .then(function (res) { return res.arrayBuffer(); })
        .then(function (data) {
          return new Promise(function (resolve, reject) { ctx.decodeAudioData(data, resolve, reject); });
        })
        .then(function (buf) { samples[name] = { buf: buf, start: firstSound(buf) }; })
        .catch(function () {});
    }

    function firstSound(buf) {
      var peak = 0;
      var c, i, d;
      for (c = 0; c < buf.numberOfChannels; c++) {
        d = buf.getChannelData(c);
        for (i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
      }
      var limit = peak * 0.05;
      var first = buf.length;
      for (c = 0; c < buf.numberOfChannels; c++) {
        d = buf.getChannelData(c);
        for (i = 0; i < first; i++) {
          if (Math.abs(d[i]) > limit) { first = i; break; }
        }
      }
      return Math.max(0, first / buf.sampleRate - 0.002);
    }

    function sample(name, t, level) {
      var s = samples[name];
      if (!s) return false;
      var src = ctx.createBufferSource();
      src.buffer = s.buf;
      src.connect(gainNode(level, sfxBus));
      src.start(t, s.start);
      return true;
    }

    function running() {
      return !!ctx && active && !document.hidden;
    }

    function apply() {
      if (!ctx) return;
      if (running()) {
        ctx.resume();
        if (wantMusic && !musicOn) startMusic();
      } else {
        ctx.suspend();
      }
    }

    function now() {
      return running() && ctx.state === "running" ? ctx.currentTime : null;
    }

    function envelope(g, t, peak, a, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    function tone(type, f, t, a, d, peak, f2, to) {
      var o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      var g = gainNode(0, to || sfxBus);
      envelope(g, t, peak, a, d);
      o.connect(g);
      o.start(t);
      o.stop(t + a + d + 0.05);
    }

    function hiss(t, d, type, f, q, peak, f2, a) {
      a = a || 0.01;
      var s = ctx.createBufferSource();
      s.buffer = noise;
      s.loop = true;
      var flt = ctx.createBiquadFilter();
      flt.type = type;
      flt.frequency.setValueAtTime(f, t);
      flt.Q.value = q;
      if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      var g = gainNode(0, sfxBus);
      envelope(g, t, peak, a, d);
      s.connect(flt);
      flt.connect(g);
      s.start(t, Math.random());
      s.stop(t + a + d + 0.05);
    }

    function chugs(t, sec, gap, grow) {
      for (var at = 0; at < sec; at += gap, gap *= grow) {
        hiss(t + at, 0.05, "bandpass", 1500, 2.5, 0.16);
        tone("sine", 95, t + at, 0.004, 0.08, 0.12, 60);
      }
    }

    var fx = {
      trainIn: function (sec) {
        var t = now();
        if (t === null) return;
        hiss(t, sec, "lowpass", 1100, 0.8, 0.32, 150, 0.25);
        tone("triangle", 240, t, 0.15, sec, 0.07, 70);
        tone("sine", 480, t, 0.15, sec * 0.8, 0.025, 120);
        chugs(t, sec, 0.08, 1.09);
      },
      brake: function () {
        var t = now();
        if (t === null) return;
        hiss(t, 0.55, "highpass", 3200, 0.7, 0.2, 5000, 0.02);
        tone("sine", 90, t, 0.005, 0.3, 0.35, 40);
        [523, 831, 1247].forEach(function (f, i) { tone("sine", f, t + 0.02, 0.003, 0.7 - i * 0.15, 0.07 - i * 0.02); });
      },
      trainOut: function () {
        var t = now();
        if (t === null) return;
        tone("sine", 784, t, 0.05, 0.6, 0.09, 760);
        tone("sine", 988, t, 0.05, 0.6, 0.07, 960);
        hiss(t + 0.3, 1.4, "lowpass", 180, 0.8, 0.3, 1400, 0.4);
        tone("triangle", 60, t + 0.3, 0.3, 1.3, 0.07, 280);
        chugs(t + 0.35, 1.3, 0.22, 0.86);
      },
      belt: function (sec) {
        var t = now();
        if (t === null) return;
        for (var at = 0; at < sec; at += 0.05) tone("square", 2200 + Math.random() * 400, t + at, 0.002, 0.018, 0.035);
        tone("sawtooth", 170, t, 0.05, sec, 0.03, 430);
        tone("triangle", 340, t, 0.05, sec, 0.05, 860);
        tone("sine", 150, t + sec, 0.004, 0.22, 0.3, 55);
        hiss(t + sec, 0.12, "lowpass", 700, 1, 0.18);
      },
      thud: function (delay) {
        var t = now();
        if (t === null) return;
        t += delay;
        if (sample("crate", t, 2.4)) return;
        hiss(t, 0.03, "bandpass", 3800, 1.2, 0.5);
        tone("sine", 160, t, 0.002, 0.18, 0.35, 70);
        [[523, 0.55, 0.16], [1187, 0.42, 0.12], [1856, 0.3, 0.09], [2741, 0.22, 0.07], [3920, 0.15, 0.05]].forEach(function (p) {
          tone("triangle", p[0] * (0.97 + Math.random() * 0.06), t, 0.001, p[1], p[2]);
        });
      },
      zip: function () {
        var t = now();
        if (t === null) return;
        hiss(t, 0.32, "bandpass", 700, 3, 0.14, 4200);
      },
      knot: function () {
        var t = now();
        if (t === null) return;
        tone("square", 880, t, 0.002, 0.04, 0.04);
        tone("sine", 1400, t, 0.002, 0.08, 0.06);
      },
      magnet: function () {
        var t = now();
        if (t === null) return;
        tone("sine", 660, t, 0.03, 0.4, 0.05, 1760);
        tone("triangle", 990, t, 0.03, 0.4, 0.03, 2640);
      },
      held: function () {
        var t = now();
        if (t === null) return;
        tone("square", 110, t, 0.01, 0.35, 0.06);
        tone("square", 117, t, 0.01, 0.35, 0.06);
      },
      load: function () {
        var t = now();
        if (t === null) return;
        tone("sine", 130, t, 0.004, 0.16, 0.25, 60);
      },
      wrong: function () {
        var t = now();
        if (t === null) return;
        tone("sawtooth", 220, t, 0.01, 0.3, 0.05, 140);
        tone("square", 233, t, 0.01, 0.3, 0.04, 150);
      },
      fired: function () {
        var t = now();
        if (t === null) return;
        tone("sawtooth", 392, t, 0.05, 1.4, 0.06, 98);
        tone("triangle", 330, t + 0.1, 0.05, 1.4, 0.06, 82);
      },
    };

    function pad(chord, t, dur) {
      var flt = ctx.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.value = 800;
      flt.Q.value = 2;
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      lfo.connect(gainNode(350, flt.frequency));
      var g = gainNode(0, musicBus);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 1.6);
      g.gain.setValueAtTime(1, t + dur - 0.2);
      g.gain.linearRampToValueAtTime(0, t + dur + 1.6);
      flt.connect(g);
      lfo.start(t);
      lfo.stop(t + dur + 1.7);
      chord.notes.slice(0, 4).forEach(function (n) {
        [-7, 7].forEach(function (cents) {
          var o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = freq(n);
          o.detune.value = cents;
          o.connect(gainNode(0.022, flt));
          o.start(t);
          o.stop(t + dur + 1.7);
        });
      });
    }

    function bass(root, t, dur) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq(root);
      var g = gainNode(0, musicBus);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.8);
      g.gain.setValueAtTime(0.16, t + dur - 0.3);
      g.gain.linearRampToValueAtTime(0, t + dur + 0.4);
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.5);
    }

    function pluck(f, t, peak) {
      var g = gainNode(0, musicBus);
      g.connect(echo);
      envelope(g, t, peak, 0.006, 0.55);
      ["triangle", "sine"].forEach(function (type, i) {
        var o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f * (i + 1);
        o.connect(i ? gainNode(0.3, g) : g);
        o.start(t);
        o.stop(t + 0.65);
      });
    }

    function bell(f, t) {
      tone("sine", f, t, 0.01, 2.6, 0.03, 0, musicBus);
      tone("sine", f * 2.76, t, 0.01, 1.4, 0.01, 0, musicBus);
    }

    function beat(i, t) {
      var bar = Math.floor(i / 8);
      var chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
      var s = i % 8;
      if (i % 16 === 0) {
        pad(chord, t, STEP * 16);
        bass(chord.root, t, STEP * 16);
      }
      if (i >= 16 && (bar % 4 !== 3 || s < 4)) pluck(freq(chord.notes[ARP[s]] + 12), t, s === 0 ? 0.07 : 0.045);
      if (Math.random() < 0.05) bell(freq(chord.notes[Math.floor(Math.random() * chord.notes.length)] + 24), t);
    }

    function schedule() {
      if (ctx.state !== "running") return;
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.4) {
        beat(step, nextTime);
        step += 1;
        nextTime += STEP;
      }
    }

    function startMusic() {
      if (!ctx || musicOn) return;
      musicOn = true;
      step = 0;
      nextTime = ctx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.32, ctx.currentTime, 1.5);
      timer = setInterval(schedule, 120);
      schedule();
    }

    return {
      fx: fx,
      start: function () {
        wantMusic = true;
        init();
        apply();
      },
      setActive: function (yes) {
        active = yes;
        apply();
      },
      refresh: apply,
    };
  })();

  function typeOut(key, node, text, speed) {
    if (typers[key]) typers[key]();
    return new Promise(function (resolve) {
      if (reduce) {
        node.textContent = text;
        resolve();
      return;
    }
      var i = 0;
      var timer = setInterval(function () {
        i += 1;
        node.textContent = text.slice(0, i);
        if (i >= text.length) finish();
      }, speed);
      function finish() {
        clearInterval(timer);
        node.textContent = text;
        if (typers[key] === finish) delete typers[key];
        resolve();
      }
      typers[key] = finish;
    });
  }

  function stopTyping() {
    Object.keys(typers).forEach(function (key) { typers[key](); });
  }

  function logLine(text) {
    var box = el("story-log");
    if (typers.log) typers.log();
    Array.prototype.forEach.call(box.children, function (p) { p.classList.add("mx-old"); });
    var line = document.createElement("p");
    box.appendChild(line);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    return typeOut("log", line, text, 20);
  }

  function botSay(text, keep) {
    var bubble = el("mx-bubble");
    if (typers.bot) typers.bot();
    if (!keep) bubble.innerHTML = "";
    bubble.hidden = false;
    var line = document.createElement("p");
    bubble.appendChild(line);
    return typeOut("bot", line, text, 18);
  }

  function botHide() {
    if (typers.bot) typers.bot();
    var bubble = el("mx-bubble");
    bubble.hidden = true;
    bubble.innerHTML = "";
  }

  function botIn() {
    var bot = el("mx-bot");
    stopAnims(bot);
    bot.style.visibility = "visible";
    return play(bot, [
      { transform: "translate(-180px, -60px)", opacity: 0 },
      { transform: "translate(0, 0)", opacity: 1 },
    ], 900, "cubic-bezier(.2,.7,.3,1)");
  }

  async function botOut() {
    botHide();
    var bot = el("mx-bot");
    await play(bot, [
      { transform: "translate(0, 0)", opacity: 1 },
      { transform: "translate(-60px, -280px)", opacity: 0 },
    ], 900, "ease-in");
    bot.style.visibility = "hidden";
  }

  function showWrong(title, why) {
    var box = el("mx-wrong");
    var ticket = ++wrongTicket;
    el("mx-wrong-title").textContent = "\u274c " + title;
    el("mx-wrong-why").textContent = why;
    sound.fx.wrong();
    stopAnims(box);
    box.hidden = false;
    play(box, [
      { transform: "scaleY(0)", opacity: 0 },
      { transform: "scaleY(1.1)", opacity: 1, offset: 0.6 },
      { transform: "scaleY(1)", opacity: 1 },
    ], 260, "ease-out");
    setTimeout(function () {
      if (ticket !== wrongTicket) return;
      play(box, [{ opacity: 1 }, { opacity: 0 }], 400).then(function () {
        if (ticket === wrongTicket) box.hidden = true;
      });
    }, 2800);
  }

  function hideWrong() {
    wrongTicket += 1;
    var box = el("mx-wrong");
    stopAnims(box);
    box.hidden = true;
  }

  function lockInput(locked) {
    el("mx-a").disabled = locked;
    el("mx-n").disabled = locked;
    el("submit-btn").disabled = locked;
    if (!locked && !el("sci-game").classList.contains("game-off")) el("mx-a").focus();
  }

  function shake(nodes, px) {
    var xs = [0, -px, px, -px * 0.7, px * 0.7, -px * 0.3, 0];
    return Promise.all(nodes.map(function (node) {
      return play(node, xs.map(function (x) { return { transform: "translateX(" + x + "px)" }; }), 500, "linear");
    }));
  }

  function beltParts() {
    return [document.querySelector("#sci-game .mx-belt-track"), el("cargo-container")];
  }

  function trainIn() {
    var train = el("train");
    stopAnims(train);
    train.querySelectorAll(".mx-load").forEach(function (node) { node.remove(); });
    train.classList.remove("mx-lit");
    train.style.visibility = "visible";
    var from = -(train.offsetLeft + train.offsetWidth + 40);
    sound.fx.trainIn(1.5);
    return play(train, [{ transform: "translateX(" + from + "px)" }, { transform: "translateX(0)" }], 1500, "cubic-bezier(.2,.7,.3,1)");
  }

  async function brake() {
    var train = el("train");
    sound.fx.brake();
    play(el("mx-flash"), [{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0 }], 420);
    await play(train, [
      { transform: "translateX(0)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(0)" },
    ], 360, "linear");
    train.classList.add("mx-lit");
  }

  function puff() {
    var train = el("train");
    var scale = train.offsetWidth / 340;
    for (var k = 0; k < 6; k++) {
      var cloud = document.createElement("span");
      cloud.className = "mx-steam";
      cloud.style.left = (308 * scale - 9) + "px";
      cloud.style.top = (12 * scale - 9) + "px";
      train.appendChild(cloud);
      var anim = cloud.animate([
        { transform: "translate(0, 0) scale(.5)", opacity: 0.95 },
        { transform: "translate(" + (-18 - k * 14) + "px, " + (-34 - k * 5) + "px) scale(" + (1.5 + k * 0.3) + ")", opacity: 0 },
      ], { duration: reduce ? 1 : 1100, delay: reduce ? 0 : k * 110, easing: "ease-out", fill: "forwards" });
      anim.finished.then(remover(cloud), remover(cloud));
    }
  }

  function remover(node) {
    return function () { node.remove(); };
  }

  async function trainOut() {
    var train = el("train");
    sound.fx.trainOut();
    puff();
    await wait(350);
    var to = train.parentNode.clientWidth - train.offsetLeft + 40;
    await play(train, [{ transform: "translateX(0)" }, { transform: "translateX(" + to + "px)" }], 1400, "cubic-bezier(.5,0,.8,.4)");
    train.style.visibility = "hidden";
    train.classList.remove("mx-lit");
  }

  async function beltOpen() {
    var belt = el("conveyor-belt");
    sound.fx.belt(0.9);
    await play(belt, [{ width: "0%" }, { width: "100%" }], 900, "ease-out");
    belt.style.width = "100%";
    belt.classList.add("mx-run");
  }

  function crateNode(text, small) {
    var crate = document.createElement("div");
    crate.className = "mx-crate" + (small ? " mx-small" : "");
    var plate = document.createElement("span");
    plate.className = "mx-plate" + (text.length > (small ? 8 : 10) ? " mx-long" : "");
    plate.textContent = text;
    crate.appendChild(plate);
    return crate;
  }

  function crates() {
    return Array.prototype.slice.call(el("cargo-container").querySelectorAll(".mx-crate"));
  }

  function cargo() {
    return el("cargo-container").firstElementChild;
  }

  async function dropCrates(dock) {
    var box = el("cargo-container");
    box.innerHTML = "";
    var items = dock.items
      ? dock.items.map(function (it) { return { text: label(it.v.m, it.v.e), pow: it.pow }; })
      : dock.crates.map(function (text) { return { text: text }; });
    var signs = dock.ops || items.slice(1).map(function () { return dock.op; });
    var small = items.length >= 3 || (items.length > 1 && items.some(function (it) { return it.pow; }));
    var ops = [];
    function sign(text, extra) {
      var op = document.createElement("span");
      op.className = "mx-op" + (extra ? " " + extra : "");
      op.textContent = text;
      op.style.opacity = "0";
      box.appendChild(op);
      ops.push(op);
    }
    var nodes = items.map(function (item, i) {
      if (i > 0) sign(signs[i - 1]);
      if (item.pow) sign("(", "mx-paren");
      var node = crateNode(item.text, small);
      box.appendChild(node);
      if (item.pow) {
        sign(")", "mx-paren");
        sign(POW_BADGE[item.pow], "mx-pow");
      }
      return node;
    });
    await Promise.all(nodes.map(function (node, i) {
      sound.fx.thud(reduce ? 0 : (620 + i * 140) * 0.75 / 1000);
      return play(node, [
        { transform: "translateY(-150px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1, offset: 0.75 },
        { transform: "translateY(-8px)", opacity: 1, offset: 0.88 },
        { transform: "translateY(0)", opacity: 1 },
      ], 620 + i * 140, "ease-in");
    }));
    await Promise.all(ops.map(function (op) {
      return play(op, [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)" }], 260, "ease-out");
    }));
  }

  async function tie(text, fast) {
    var k = fast ? 0.4 : 1;
    var box = el("cargo-container");
    var list = crates();
    var ops = Array.prototype.slice.call(box.querySelectorAll(".mx-op"));
    list.forEach(function (node) {
      node.classList.remove("mx-pick", "mx-focus");
      node.removeAttribute("tabindex");
      node.removeAttribute("role");
    });
    await Promise.all(ops.map(function (op) {
      return play(op, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.4)" }], 220 * k);
    }));
    var area = box.getBoundingClientRect();
    var gap = 10;
    var total = list.reduce(function (sum, node) { return sum + node.offsetWidth; }, 0) + gap * (list.length - 1);
    var x = area.left + area.width / 2 - total / 2;
    await Promise.all(list.map(function (node) {
      var dx = x - node.getBoundingClientRect().left;
      x += node.offsetWidth + gap;
      return play(node, [{ transform: "translateX(0)" }, { transform: "translateX(" + dx + "px)" }], 520 * k, fast ? "cubic-bezier(.6,0,1,.6)" : "ease-in-out");
    }));

    var bundle = document.createElement("div");
    bundle.className = "mx-bundle";
    list.forEach(function (node) {
      stopAnims(node);
      node.style.transform = "none";
      node.style.opacity = "1";
    });
    box.innerHTML = "";
    list.forEach(function (node) {
      node.classList.remove("mx-focus");
      bundle.appendChild(node);
      stopAnims(node);
    });
    box.appendChild(bundle);

    var ropes = ["mx-rope mx-rope-a", "mx-rope mx-rope-b"].map(function (name) {
      var rope = document.createElement("span");
      rope.className = name;
      rope.style.transform = "scaleX(0)";
      bundle.appendChild(rope);
      return rope;
    });
    sound.fx.zip();
    await Promise.all(ropes.map(function (rope, i) {
      return play(rope, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], (420 + i * 120) * k, "ease-out");
    }));
    var knot = document.createElement("span");
    knot.className = "mx-knot";
    bundle.appendChild(knot);
    sound.fx.knot();
    await play(knot, [
      { transform: "translateX(-50%) scale(0)" },
      { transform: "translateX(-50%) scale(1.3)", offset: 0.7 },
      { transform: "translateX(-50%) scale(1)" },
    ], 260 * k, "ease-out");
    list.forEach(function (node) { node.classList.add("mx-tied"); });

    var tag = document.createElement("p");
    tag.className = "mx-tag";
    tag.textContent = text;
    bundle.appendChild(tag);
    await play(tag, [
      { transform: "translate(-50%, -24px)", opacity: 0 },
      { transform: "translate(-50%, 0)", opacity: 1 },
    ], 320 * k, "ease-out");
    return bundle;
  }

  function retag(bundle, text) {
    var tag = bundle.querySelector(".mx-tag");
    tag.textContent = text;
    return play(tag, [
      { transform: "translate(-50%, 0) scale(1)" },
      { transform: "translate(-50%, 0) scale(1.25)" },
      { transform: "translate(-50%, 0) scale(1)" },
    ], 240, "ease-out");
  }

  function magnet() {
    sound.fx.magnet();
    return Promise.all(crates().map(function (node) {
      return play(node, [
        { filter: "brightness(1)" },
        { filter: "brightness(1.6) drop-shadow(0 0 12px #67e8f9)" },
        { filter: "brightness(1)" },
      ], 380, "ease-in-out");
    }));
  }

  async function fastFix(filed, ticket) {
    var bundle = await tie(filed, true);
    if (ticket !== run) return null;
    return bundle;
  }

  function stampHeld(target) {
    var stamp = document.createElement("p");
    stamp.className = "mx-held";
    stamp.textContent = "HELD";
    target.appendChild(stamp);
    sound.fx.held();
    return play(stamp, [
      { transform: "translateX(-50%) rotate(-8deg) scale(2.2)", opacity: 0 },
      { transform: "translateX(-50%) rotate(-8deg) scale(1)", opacity: 1 },
    ], 280, "ease-out");
  }

  function stampCleared(target) {
    var stamp = document.createElement("p");
    stamp.className = "mx-cleared";
    stamp.textContent = "CLEARED";
    target.appendChild(stamp);
    return play(stamp, [
      { transform: "translateX(-50%) rotate(7deg) scale(2.2)", opacity: 0 },
      { transform: "translateX(-50%) rotate(7deg) scale(1)", opacity: 1 },
    ], 280, "ease-out");
  }

  async function ship(target) {
    var stamp = target.querySelector(".mx-held");
    if (stamp) stamp.remove();
    target.classList.remove("mx-focus");
    await stampCleared(target);
    await play(target, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], 320);

    var w = target.offsetWidth;
    var h = target.offsetHeight;
    var deck = el("mx-deck").getBoundingClientRect();
    var r = target.getBoundingClientRect();
    var s = Math.min(0.6, deck.width * 0.9 / w);
    var dx = deck.left + deck.width / 2 - (r.left + r.width / 2);
    var dy = deck.top - r.bottom;
    target.style.transformOrigin = "50% 100%";
    await play(target, [
      { transform: "translate(0, 0) scale(1)" },
      { transform: "translate(" + dx + "px, 0) scale(1)", offset: 0.5 },
      { transform: "translate(" + dx + "px, " + (dy - 24) + "px) scale(" + s + ")", offset: 0.85 },
      { transform: "translate(" + dx + "px, " + dy + "px) scale(" + s + ")" },
    ], 1500, "ease-in-out");

    var train = el("train");
    var t = train.getBoundingClientRect();
    deck = el("mx-deck").getBoundingClientRect();
    stopAnims(target);
    target.classList.add("mx-load");
    target.style.left = (deck.left + deck.width / 2 - t.left - w / 2) + "px";
    target.style.top = (deck.top - t.top - h) + "px";
    target.style.transform = "scale(" + s + ")";
    train.appendChild(target);
    sound.fx.load();
  }

  function refreshMode() {
    var dock = DOCKS[dockIndex];
    var mode = el("mx-mode");
    var btn = el("submit-btn");
    var add = dock && dock.kind === "add";
    if (heldFix) {
      mode.textContent = "\u25b8 FIX THE LABEL ON THE HELD CRATES (" + RULE + ")";
      btn.textContent = "SEND LABEL (Enter)";
    } else if (!add) {
      mode.textContent = "";
      btn.textContent = "SEND LABEL (Enter)";
    } else if (selected !== null) {
      mode.textContent = "\u25b8 RELABEL THE SELECTED CRATE (crate " + (selected + 1) + ")";
      btn.textContent = "RELABEL CRATE (Enter)";
    } else if (dock.training) {
      mode.textContent = "\u25b8 CLICK A CRATE TO PICK IT";
      btn.textContent = "RELABEL CRATE (Enter)";
    } else {
      mode.textContent = "\u25b8 SEND THE FINAL ANSWER (or click a crate to relabel it)";
      btn.textContent = "SEND ANSWER (Enter)";
    }
    mode.hidden = !mode.textContent;
    if (!busy) lockInput(add && dock.training && selected === null && !heldFix);
  }

  function pick(index) {
    var dock = DOCKS[dockIndex];
    if (busy || dock.kind !== "add" || heldFix) return;
    var list = crates();
    if (index !== null && !list[index]) return;
    selected = index;
    list.forEach(function (node, i) { node.classList.toggle("mx-focus", i === index); });
    if (index !== null) {
      play(list[index], [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], 220);
    }
    refreshMode();
  }

  function onYardClick(event) {
    var dock = DOCKS[dockIndex];
    if (busy || !dock || dock.kind !== "add") return;
    var crate = event.target.closest(".mx-crate.mx-pick");
    pick(crate ? crates().indexOf(crate) : null);
  }

  function readBest() {
    try {
      return Number(window.localStorage.getItem(BEST_KEY)) || 0;
    } catch (err) {
      return 0;
    }
  }

  function saveBest(amount) {
    try {
      window.localStorage.setItem(BEST_KEY, String(amount));
    } catch (err) {
      /* storage blocked */
    }
  }

  function bump(node) {
    play(node, [
      { transform: "translateX(-50%) scale(1)" },
      { transform: "translateX(-50%) scale(1.3)" },
      { transform: "translateX(-50%) scale(1)" },
    ], 360);
  }

  function showStrikes() {
    var box = el("mx-strikes");
    box.innerHTML = "";
    var money = document.createElement("span");
    money.className = "mx-cash";
    money.textContent = "EARNED $" + cash;
    box.appendChild(money);
    var head = document.createElement("span");
    head.textContent = "MISTAKES ";
    box.appendChild(head);
    for (var i = 0; i < MAX_STRIKES; i++) {
      var mark = document.createElement("b");
      mark.className = i < strikes ? "mx-x" : "";
      mark.textContent = i < strikes ? "\u2716" : "\u25cb";
      box.appendChild(mark);
    }
  }

  function strike() {
    strikes += 1;
    showStrikes();
    bump(el("mx-strikes"));
    if (strikes >= MAX_STRIKES) fired(run);
  }

  async function fired(ticket) {
    busy = true;
    lockInput(true);
    await wait(900);
    if (ticket !== run) return;
    el("mx-dock").textContent = "SHIFT OVER";
    sound.fx.fired();
    if (el("mx-bot").style.visibility !== "visible") botIn();
    botSay("That's three mistakes. Sorry... you're FIRED! You earned $" + cash + " today.");
    await logLine("[SYSTEM] Three mistakes. Your shift is over.");
    if (ticket !== run) return;
    await wait(2400);
    if (ticket !== run) return;
    var best = readBest();
    var record = cash > best;
    if (record) saveBest(cash);
    el("mx-end-title").textContent = "YOU'RE FIRED!";
    el("mx-end-score").textContent = "You shipped " + (cash / PAY) + (cash === PAY ? " load" : " loads") + " and earned $" + cash + ". "
      + (record ? "NEW RECORD!" : "Best: $" + best);
    el("mx-end").hidden = false;
  }

  async function openDock(i, ticket, trainReady) {
    if (i >= DOCKS.length) DOCKS.push(makeDock(i - TRAINING.length + 1));
    var dock = DOCKS[i];
    dockIndex = i;
    stepIndex = 0;
    selected = null;
    heldFix = null;
    refreshMode();
    el("mx-strikes").hidden = !!dock.training;
    if (!dock.training) showStrikes();
    el("mx-dock").textContent = dock.code;
    el("cargo-container").innerHTML = "";
    el("mx-a").value = "";
    el("mx-n").value = "";
    if (!trainReady) {
      await trainIn();
      if (ticket !== run) return;
      await brake();
      if (ticket !== run) return;
    }
    await dropCrates(dock);
    if (ticket !== run) return;
    if (dock.kind === "add") {
      crates().forEach(function (node, k) {
        node.classList.add("mx-pick");
        node.tabIndex = 0;
        node.setAttribute("role", "button");
        node.setAttribute("aria-label", "Crate " + (k + 1) + ": " + dock.crates[k]);
      });
    }
    logLine("[NEW CRATES] " + dock.code + ". " + dock.task);
    if (dock.say) {
      await botSay(dock.say[0]);
      if (ticket !== run) return;
      await wait(700);
      if (ticket !== run) return;
      await botSay(dock.say[1], true);
      if (ticket !== run) return;
    }
    var tip = (dock.tips || []).filter(function (key) { return !seenTips[key]; })[0];
    if (tip) {
      seenTips[tip] = true;
      if (el("mx-bot").style.visibility !== "visible") {
        dock.popped = true;
        await botIn();
        if (ticket !== run) return;
      }
      await botSay(TIPS[tip]);
      if (ticket !== run) return;
    }
    busy = false;
    refreshMode();
  }

  function shortcut(text) {
    shortcuts += 1;
    return shortcuts === 1 ? text : true;
  }

  async function departAndNext(target, filed, ticket, praise) {
    var dock = DOCKS[dockIndex];
    var popped = !!dock.popped;
    var paid = !dock.training;
    if (paid) {
      cash += PAY;
      showStrikes();
      bump(el("mx-strikes"));
    }
    logLine((praise ? "\u26a1 Shortcut! " : "\u2728 ") + "Label OK! " + filed + " follows the rule."
      + (paid ? " +$" + PAY + "." : "") + " The train is leaving. Next crates are on the way...");
    if (typeof praise === "string") {
      if (el("mx-bot").style.visibility !== "visible") {
        popped = true;
        botIn();
      }
      botSay(praise);
    } else if (dock.done) {
      botSay(dock.done);
    }
    await ship(target);
    if (ticket !== run) return;
    await trainOut();
    if (ticket !== run) return;
    await wait(500);
    if (ticket !== run) return;
    if (popped) {
      await botOut();
      if (ticket !== run) return;
    }

    if (dock.training && dockIndex === TRAINING.length - 1) {
      var lines = [
        "Training is over! From here on, you work alone. I'll be watching from the control room.",
        "On your own shift, you can skip steps. If you can work out the final label in your head, send it straight away!",
        "The jobs get harder as you go, and every load pays $" + PAY + ". Three mistakes and you're FIRED. Good luck!",
      ];
      for (var k = 0; k < lines.length; k++) {
        await botSay(lines[k]);
        if (ticket !== run) return;
        await wait(k === lines.length - 1 ? 1800 : 2200);
        if (ticket !== run) return;
      }
      await botOut();
      if (ticket !== run) return;
      await logLine("[SYSTEM] Training complete. Endless shift starts now. Best so far: $" + readBest() + ".");
      if (ticket !== run) return;
      await wait(700);
      if (ticket !== run) return;
    }
    await openDock(dockIndex + 1, ticket);
  }

  function readLabel() {
    var a = el("mx-a").value.trim().replace(/\u2212/g, "-");
    var n = el("mx-n").value.trim().replace(/\u2212/g, "-");
    if (a === "" || n === "") return { msg: "Fill in both boxes: a and n." };
    var m = Number(a);
    var e = Number(n);
    if (!isFinite(m)) return { msg: "a must be a number." };
    if (!isFinite(e) || Math.round(e) !== e) return { msg: "n must be a whole number." };
    return { m: m, e: e };
  }

  function legal(m) {
    return Math.abs(m) >= 1 && Math.abs(m) < 10;
  }

  function same(a, b) {
    var x = normal(a.m, a.e);
    var y = normal(b.m, b.e);
    return x.e === y.e && nearly(x.m, y.m);
  }

  function refuseHeld() {
    var target = cargo();
    var stamp = target.querySelector(".mx-held");
    play(target, [
      { transform: "translateX(0) rotate(0)" },
      { transform: "translateX(-12px) rotate(-3deg)" },
      { transform: "translateX(12px) rotate(3deg)" },
      { transform: "translateX(-8px) rotate(-2deg)" },
      { transform: "translateX(0) rotate(0)" },
    ], 450, "linear");
    if (stamp) {
      var off = { background: "#fee2e2", color: "#b91c1c", boxShadow: "0 0 0 rgba(239,68,68,0)" };
      var on = { background: "#ef4444", color: "#ffffff", boxShadow: "0 0 22px rgba(239,68,68,1)" };
      play(stamp, [off, on, off, on, off], 800, "linear");
    }
    shake([document.querySelector("#sci-game .mx-belt-track")], 10);
  }

  function miss(dock, why, hint) {
    showWrong("WRONG", why);
    if (dock.training) {
      if (hint) botSay("Hint: " + hint);
    } else {
      strike();
    }
  }

  function round(x) {
    return Math.round(x * 1e9) / 1e9;
  }

  function normal(m, e) {
    var sign = m < 0 ? -1 : 1;
    var a = Math.abs(m);
    while (a >= 10) { a = round(a / 10); e += 1; }
    while (a > 0 && a < 1) { a = round(a * 10); e -= 1; }
    return { m: sign * a, e: e };
  }

  function stepByStep(got) {
    shake([el("input-area")], 8);
    showWrong("STEP BY STEP", "You sent " + label(got.m, got.e) + ". That is the final label! But in training, send the raw answer first.");
    botSay("Nice mental maths! But in training we go step by step: send the raw answer first. On your own shift, you can send the final label in one go.");
  }

  function rejectAdd(dock, got, i) {
    var sent = "You sent " + label(got.m, got.e) + ". ";
    var why, hint;
    shake(beltParts().concat(el("input-area")), 9);
    if (i === null) {
      why = sent + (same({ m: -got.m, e: got.e }, dock.total)
        ? "Check the sign: + or \u2212?"
        : "That is not the answer for these two crates.");
    } else {
      var vi = dock.vals[i];
      var vj = dock.vals[1 - i];
      var keep = nearly(got.m * Math.pow(10, got.e - vi[1]), vi[0]);
      why = sent + (keep
        ? "Same amount, but use \u00d7 10" + sup(vj[1]) + " so it matches the other crate."
        : "Crate " + (i + 1) + " must keep the same amount inside.");
      hint = vj[1] > vi[1]
        ? "The power goes UP from " + vi[1] + " to " + vj[1] + ", so a must get smaller: divide by 10 for each step."
        : "The power goes DOWN from " + vi[1] + " to " + vj[1] + ", so a must get bigger: multiply by 10 for each step.";
    }
    miss(dock, why, hint);
  }

  function reject(dock, step, got) {
    var sent = "You sent " + label(got.m, got.e) + ". ";
    var why;
    if (step.act === "tie-held") {
      shake(beltParts().concat(el("input-area")), 10);
      why = sent + dock.verb + " first: send the raw answer, then fix the label.";
    } else if (step.act === "tie-ship") {
      shake(beltParts().concat(el("input-area")), 10);
      why = sent + "That is not the right label for these two crates.";
    } else if (stepIndex > 0) {
      refuseHeld();
      why = sent + (legal(got.m) ? "That label does not match the amount in the crates." : "a is still not between 1 and 10 (" + RULE + ").");
    } else {
      shake(beltParts().concat(el("input-area")), 10);
      why = sent + (legal(got.m) ? "That label does not match the number on the crate." : "a must be at least 1 and less than 10 (" + RULE + ").");
    }
    miss(dock, why, step.hint);
  }

  async function submitAdd(dock, got) {
    var ticket = run;
    var filed, bundle;
    if (selected === null && dock.training) {
      showWrong("PICK A CRATE", "Click one crate first.");
      return;
    }
    if (selected === null) {
      if (!same(got, dock.total)) {
        rejectAdd(dock, got, null);
      return;
    }
      hideWrong();
      busy = true;
      lockInput(true);
      filed = label(got.m, got.e);
      await magnet();
      if (ticket !== run) return;
      if (!legal(got.m)) {
        await holdForFix(await tie(filed), dock.total, "The station works it out: " + filed + ".", ticket);
      return;
    }
      bundle = await tie(filed, true);
      if (ticket !== run) return;
      await departAndNext(bundle, filed, ticket, shortcut(PRAISE_ADD));
      return;
    }

    var i = selected;
    var vi = dock.vals[i];
    var vj = dock.vals[1 - i];
    if (!(nearly(got.m * Math.pow(10, got.e - vi[1]), vi[0]) && got.e === vj[1])) {
      rejectAdd(dock, got, i);
      return;
    }
    hideWrong();
    busy = true;
    lockInput(true);
    var crate = crates()[i];
    crate.querySelector(".mx-plate").textContent = label(got.m, got.e);
    crate.classList.remove("mx-focus");
    crate.classList.add("mx-aligned");
    await play(crate, [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], 320);
    if (ticket !== run) return;
    selected = null;
    el("mx-mode").textContent = dock.op === "+" ? "\u25b8 ADDING..." : "\u25b8 SUBTRACTING...";

    var e = vj[1];
    var fronts = [];
    fronts[i] = got.m;
    fronts[1 - i] = vj[0];
    var sumM = round(dock.op === "+" ? fronts[0] + fronts[1] : fronts[0] - fronts[1]);
    var raw = label(sumM, e);
    await wait(450);
    if (ticket !== run) return;
    await magnet();
    if (ticket !== run) return;
    bundle = await tie(raw);
    if (ticket !== run) return;
    var said = "Both crates now use \u00d7 10" + sup(e) + ". The station works it out: " + raw + ".";
    if (legal(sumM)) {
      logLine("[SYSTEM] " + said);
      await departAndNext(bundle, raw, ticket);
      return;
    }
    el("mx-a").value = "";
    el("mx-n").value = "";
    await holdForFix(bundle, normal(sumM, e), said, ticket);
  }

  async function holdForFix(bundle, answer, said, ticket) {
    if (ticket !== run) return;
    await stampHeld(bundle);
    if (ticket !== run) return;
    heldFix = normal(answer.m, answer.e);
    logLine("[ALERT] " + said + " But it breaks the train's rule (" + RULE + "). The crates are HELD. Fix the label now.");
    busy = false;
    refreshMode();
  }

  function rejectCalc(dock, got) {
    shake(beltParts().concat(el("input-area")), 10);
    miss(dock, "You sent " + label(got.m, got.e) + ". " + (same({ m: -got.m, e: got.e }, dock.answer)
      ? "Check the sign: + or \u2212?"
      : "That is not the right answer for these crates."));
  }

  async function submitCalc(dock, got) {
    var ticket = run;
    if (!same(got, dock.answer)) {
      rejectCalc(dock, got);
      return;
    }
    hideWrong();
    busy = true;
    lockInput(true);
    var filed = label(got.m, got.e);
    if (!legal(got.m)) {
      await holdForFix(await tie(filed), dock.answer, "The crates are tied: " + filed + ".", ticket);
      return;
    }
    var raw = dock.raw;
    var bundle;
    if (raw && !legal(raw.m)) {
      bundle = await fastFix(filed, ticket);
      if (!bundle || ticket !== run) return;
      await departAndNext(bundle, filed, ticket, shortcut(PRAISE_TIE));
      return;
    }
    bundle = await tie(filed);
    if (ticket !== run) return;
    await departAndNext(bundle, filed, ticket);
  }

  async function fixHeld(dock, got) {
    var ticket = run;
    if (!(nearly(got.m, heldFix.m) && got.e === heldFix.e)) {
      refuseHeld();
      var why = "You sent " + label(got.m, got.e) + ". " + (legal(got.m)
        ? "That label does not match the amount in the crates."
        : "a is still not between 1 and 10 (" + RULE + ").");
      miss(dock, why, "Move the decimal point so a is between 1 and 10, then change the power to match.");
      return;
    }
    hideWrong();
    busy = true;
    lockInput(true);
    var filed = label(got.m, got.e);
    var target = cargo();
    await retag(target, filed);
    if (ticket !== run) return;
    heldFix = null;
    await departAndNext(target, filed, ticket);
  }

  async function submit() {
    if (busy) return;
    var got = readLabel();
    if (got.msg) {
      showWrong("ERROR", got.msg);
        return;
      }
    var dock = DOCKS[dockIndex];
    if (heldFix) return fixHeld(dock, got);
    if (dock.kind === "add") return submitAdd(dock, got);
    if (dock.kind === "calc") return submitCalc(dock, got);
    var step = dock.steps[stepIndex];
    var last = dock.steps[dock.steps.length - 1];
    var exact = nearly(got.m, step.m) && got.e === step.e;
    var shortcut = !exact && step.act === "tie-held" && nearly(got.m, last.m) && got.e === last.e;
    if (shortcut && dock.training) {
      stepByStep(got);
        return;
      }
    if (!exact && !shortcut) {
      reject(dock, step, got);
      return;
    }
    hideWrong();
    var filed = label(got.m, got.e);
    var ticket = run;
    busy = true;
    lockInput(true);

    if (shortcut) {
      var fixed = await fastFix(filed, ticket);
      if (!fixed || ticket !== run) return;
      await departAndNext(fixed, filed, ticket, PRAISE_TIE);
      return;
    }

    if (step.act === "tie-held") {
      var held = await tie(filed);
      if (ticket !== run) return;
      await stampHeld(held);
      if (ticket !== run) return;
      logLine("[ALERT] The crates are tied! But " + filed + " breaks the train's rule (" + RULE + "). The crates are HELD. Fix the label now.");
      if (dock.training && step.after) botSay(step.after);
      stepIndex += 1;
      busy = false;
      lockInput(false);
      return;
    }

    var target;
    if (step.act === "tie-ship") {
      target = await tie(filed);
    } else {
      target = cargo();
      var tag = target.querySelector(".mx-tag");
      if (tag) tag.textContent = filed;
      else target.querySelector(".mx-plate").textContent = filed;
    }
    if (ticket !== run) return;
    await departAndNext(target, filed, ticket);
  }

  async function startShift(skip) {
    sound.start();
    run += 1;
    var ticket = run;
    busy = true;
    lockInput(true);
    stopTyping();
    el("mx-title").hidden = true;
    el("mx-lobby").hidden = true;
    el("mx-stage").hidden = false;
    el("mx-end").hidden = true;
    el("mx-dock").textContent = "";
    selected = null;
    heldFix = null;
    strikes = 0;
    cash = 0;
    shortcuts = 0;
    DOCKS = TRAINING.slice();
    seenKinds = {};
    seenTips = {};
    lastKind = "";
    el("mx-strikes").hidden = true;
    el("mx-mode").hidden = true;
    el("submit-btn").textContent = "SEND LABEL (Enter)";
    el("cargo-container").innerHTML = "";
    el("mx-a").value = "";
    el("mx-n").value = "";
    var log = el("story-log");
    log.innerHTML = "";
    log.classList.remove("mx-on");
    var belt = el("conveyor-belt");
    stopAnims(belt);
    belt.style.width = "0";
    belt.classList.remove("mx-run");
    var train = el("train");
    stopAnims(train);
    train.querySelectorAll(".mx-load").forEach(function (node) { node.remove(); });
    train.style.visibility = "hidden";
    train.classList.remove("mx-lit");
    var bot = el("mx-bot");
    stopAnims(bot);
    bot.style.visibility = "hidden";
    botHide();
    hideWrong();
    var boot = el("mx-boot");
    stopAnims(boot);
    boot.style.display = "none";
    var bootText = el("mx-boot-text");
    bootText.textContent = "";

    if (skip) {
      boot.style.display = "";
      await typeOut("boot", bootText, "Station A-12 starting up...", 55);
      if (ticket !== run) return;
      await wait(700);
      await play(boot, [{ opacity: 1 }, { opacity: 0 }], 500);
      if (ticket !== run) return;
      boot.style.display = "none";
    }
    await trainIn();
    if (ticket !== run) return;
    await brake();
    if (ticket !== run) return;
    await beltOpen();
    if (ticket !== run) return;
    log.classList.add("mx-on");
    await logLine("[SYSTEM] Work starts now. The train is ready. Get ready for crates.");
    if (ticket !== run) return;
    await wait(700);
    if (ticket !== run) return;

    if (skip) {
      await openDock(TRAINING.length, ticket, true);
      return;
    }
    await botIn();
    if (ticket !== run) return;
    await botSay("Here come your first crates! I'll teach you one rule at a time.");
    if (ticket !== run) return;
    await wait(1200);
    if (ticket !== run) return;
    await openDock(0, ticket, true);
  }

  function showIntroLine() {
    el("mx-dialog-count").textContent = (introAt + 1) + " / " + INTRO.length;
    el("mx-dialog-next").textContent = introAt === INTRO.length - 1 ? "LET'S GO \u25b6" : "CONTINUE \u25b6";
    typeOut("intro", el("mx-dialog-text"), INTRO[introAt], 24);
  }

  async function startIntro() {
    sound.start();
    run += 1;
    var ticket = run;
    introAt = -1;
    el("mx-start").disabled = true;
    el("mx-skip").disabled = true;
    var title = el("mx-title");
    await play(title, [{ opacity: 1 }, { opacity: 0 }], 400);
    if (ticket !== run) return;
    title.hidden = true;
    stopAnims(title);
    var lobby = el("mx-lobby");
    var box = el("dialog-box");
    var bot = box.querySelector(".mx-dialog-bot");
    var panel = el("mx-dialog-panel");
    [lobby, box, bot, panel].forEach(stopAnims);
    el("mx-dialog-text").textContent = "";
    el("mx-dialog-count").textContent = "";
    box.hidden = false;
    lobby.hidden = false;
    bot.style.opacity = "0";
    panel.style.opacity = "0";
    await play(lobby, [{ opacity: 0 }, { opacity: 1 }], 500);
    if (ticket !== run) return;
    await play(bot, [
      { opacity: 0, transform: "translate(-90px, 30px)" },
      { opacity: 1, transform: "translate(0, 0)" },
    ], 550, "cubic-bezier(.2, .8, .3, 1.15)");
    if (ticket !== run) return;
    await play(panel, [
      { opacity: 0, transform: "translateY(16px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], 350, "ease-out");
    if (ticket !== run) return;
    introAt = 0;
    showIntroLine();
    el("mx-dialog-next").focus();
  }

  async function nextIntro() {
    if (typers.intro) {
      typers.intro();
      return;
    }
    if (introAt < 0 || introAt >= INTRO.length) return;
    introAt += 1;
    if (introAt < INTRO.length) {
      showIntroLine();
      return;
    }
    var ticket = run;
    var box = el("dialog-box");
    await play(box, [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(20px)" },
    ], 500, "ease-in");
    if (ticket !== run) return;
    await play(el("mx-lobby"), [{ opacity: 1 }, { opacity: 0 }], 400);
    if (ticket !== run) return;
    startShift(false);
  }

  function showGame(name) {
    el("ix-game").classList.toggle("game-off", name !== "index");
    el("sci-game").classList.toggle("game-off", name !== "magnitude");
    var room = el("sig-game");
    if (room) room.classList.toggle("game-off", name !== "signal");
    sound.setActive(name === "magnitude");
    document.querySelectorAll("#games-subnav .chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.getAttribute("data-game") === name);
    });
    if (window.SignalRoom) {
      if (name === "signal") window.SignalRoom.resume();
      else window.SignalRoom.pause();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!el("sci-game")) return;
    lockInput(true);
    el("mx-start").addEventListener("click", startIntro);
    el("mx-dialog-panel").addEventListener("click", function (event) {
      if (event.target.id !== "mx-dialog-next") nextIntro();
    });
    el("mx-dialog-next").addEventListener("click", nextIntro);
    el("mx-skip").addEventListener("click", function () { startShift(true); });
    el("mx-again").addEventListener("click", function () { startShift(false); });
    el("mx-again-solo").addEventListener("click", function () { startShift(true); });
    el("submit-btn").addEventListener("click", submit);
    document.addEventListener("visibilitychange", sound.refresh);
    el("input-area").addEventListener("keydown", function (event) {
      if (event.key === "Enter") submit();
    });
    el("mx-yard").addEventListener("click", onYardClick);
    el("mx-yard").addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target.closest(".mx-crate.mx-pick")) {
        event.preventDefault();
        onYardClick(event);
      }
    });
    el("games-subnav").addEventListener("click", function (event) {
      var btn = event.target.closest("[data-game]");
      if (!btn) return;
      showGame(btn.getAttribute("data-game"));
    });
  });
})();
