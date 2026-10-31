/* JM31 · OBJECTION! The Average Trial
 * Story: four cases (notes A–D) played as continuous trials. Each case is a flat list of steps
 * (average-trial-cases.js); new evidence is shown as a card, calculations and deductions open answer panels.
 * Challenge: Rapid Objection (2 min), Fair or Rigged? (3 gavels), Deduction Board (3 gavels).
 * Text is bilingual: any { en, zh } value is resolved by T() at render time; the HUD button toggles English / 中文.
 * A pocket calculator (HUD) is available while playing, so working does not need a separate device.
 * Teacher mode (HUD "ANS") unlocks every case and adds Show answer on each question.
 */
(function () {
  "use strict";

  var stage = document.getElementById("at-stage");
  if (!stage) return;

  var CASES = window.AT_CASES || [];
  var ART = "game/";
  var V = "?v=20261027-at24";
  var KEY = "average-trial-v1";
  var MAX_PAT = 5;
  var RAPID_TIME = 120;
  var RAPID_PENALTY = 8;

  /* ================================================================
   * Save
   * ================================================================ */

  var save = (function () {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  })();
  save.cleared = save.cleared || {};
  save.best = save.best || {};
  function store() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode */ } }

  var lang = save.lang === "zh" ? "zh" : "en";
  function L(en, zh) { return { en: en, zh: zh }; }
  function T(x) { return x && typeof x === "object" && "en" in x ? x[lang] : x; }

  /* ================================================================
   * Cast and places
   * ================================================================ */

  var CAST = {
    kit: { name: L("Kit", "Kit"), at: "defense", faces: ["normal", "point", "sweat", "think"], ph: "#2c4aa8" },
    mei: { name: L("Mei", "Mei"), at: "defense", faces: ["normal", "worried", "cry", "joy"], ph: "#8a5a32" },
    max: { name: L("Max Outlier", "Max Outlier"), at: "prosecution", faces: ["smug", "point", "shock", "break"], ph: "#26305c" },
    judge: { name: L("Judge", "法官"), at: "judge", faces: ["normal", "stern", "surprised", "pleased"], ph: "#2a2a2a" },
    grant: { name: L("Insp. Grant", "Grant 督察"), at: "witness", faces: ["normal", "smug", "sweat", "break"], ph: "#8f7f4a" },
    doris: { name: L("Doris Fung", "Doris Fung"), at: "witness", faces: ["normal", "smug", "sweat", "break"], ph: "#c9a412" },
    felix: { name: L("Felix Tam", "Felix Tam"), at: "witness", faces: ["normal", "smug", "sweat", "break"], ph: "#5f6472" },
    victor: { name: L("Victor Mega", "Victor Mega"), at: "witness", faces: ["normal", "smug", "sweat", "break"], ph: "#d9701a" },
  };

  var FACE_ALIAS = {
    sweat: ["shock", "surprised", "worried"], shock: ["sweat", "surprised", "worried"], surprised: ["sweat", "shock"],
    worried: ["sweat", "shock"], angry: ["smug", "stern"], laugh: ["smug", "joy"], smug: ["normal"], stern: ["smug", "normal"],
    point: ["smug", "normal"], "break": ["cry", "sweat", "shock"], cry: ["break", "worried"], joy: ["pleased", "smug", "normal"],
    pleased: ["joy", "normal"], think: ["normal"],
  };

  var PLACES = {
    defense: { bg: "bg-defense", fg: "fg-bench", tone: "court" },
    prosecution: { bg: "bg-prosecution", fg: "fg-bench", tone: "court" },
    witness: { bg: "bg-witness", fg: "fg-stand", stand: true, tone: "court" },
    judge: { bg: "bg-judge", fg: "fg-judge", tone: "court" },
    wide: { bg: "bg-wide", tone: "court" },
    lobby: { bg: "bg-lobby", tone: "cool" },
  };

  function faceNo(who, face) {
    var list = CAST[who].faces;
    var i = list.indexOf(face || list[0]);
    if (i < 0 && FACE_ALIAS[face]) {
      for (var k = 0; k < FACE_ALIAS[face].length && i < 0; k++) i = list.indexOf(FACE_ALIAS[face][k]);
    }
    return (i < 0 ? 0 : i) + 1;
  }

  /* ================================================================
   * Small helpers
   * ================================================================ */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function $(sel, root) { return (root || stage).querySelector(sel); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return sum(a) / a.length; }
  function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function median(a) {
    var s = sorted(a), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function modes(a) {
    var c = {}, best = 0, out = [];
    a.forEach(function (v) { c[v] = (c[v] || 0) + 1; if (c[v] > best) best = c[v]; });
    if (best < 2) return [];
    Object.keys(c).forEach(function (k) { if (c[k] === best) out.push(Number(k)); });
    return out.sort(function (x, y) { return x - y; });
  }
  function round(v, dp) { var p = Math.pow(10, dp == null ? 2 : dp); return Math.round(v * p) / p; }
  function fmt(v) {
    if (typeof v !== "number") return String(v);
    var r = round(v, 2);
    return (Math.abs(r) >= 10000 ? r.toLocaleString("en-US") : String(r));
  }
  function esc(s) { return String(T(s)).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* *word* → red emphasis, [word] → gold. */
  function markup(text) {
    return esc(text).replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]/g, "<strong>$1</strong>");
  }

  function parseNum(raw) {
    var s = String(raw == null ? "" : raw).replace(/[０-９．／－]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .toLowerCase().replace(/[−–]/g, "-")
      .replace(/\$|%|,|，|\s|ml|min|kg|cm|units?|ju|分鐘|分|元|杯|箱|個|人/g, "");
    if (!s) return null;
    var f = /^(-?\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s);
    if (f) return Number(f[1]) / Number(f[2]);
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    return Number(s);
  }
  function close(v, a, tol) { return Math.abs(v - a) <= (tol == null ? 0.006 : tol) + 1e-9; }
  function near(v, w) { return Math.abs(v - w) <= Math.max(0.011, Math.abs(w) * 0.002); }

  /* ================================================================
   * Audio (tiny WebAudio blips, no files)
   * ================================================================ */

  var AC = null;
  function ac() {
    if (save.muted) return null;
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === "suspended") AC.resume();
    return AC;
  }
  function tone(freq, dur, type, vol, delay, slide) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol) {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; g.gain.value = vol || 0.12;
    s.connect(g); g.connect(c.destination); s.start();
  }
  var SFX = {
    blip: function (p) { tone(p || 520, 0.035, "square", 0.025); },
    good: function () { tone(660, 0.09, "square", 0.05); tone(880, 0.09, "square", 0.05, 0.09); tone(1320, 0.16, "square", 0.05, 0.18); },
    bad: function () { tone(300, 0.22, "sawtooth", 0.06, 0, 120); },
    shout: function () { noise(0.25, 0.16); tone(392, 0.35, "sawtooth", 0.05); tone(523, 0.35, "square", 0.04); tone(659, 0.45, "square", 0.035, 0.05); },
    gavel: function () { tone(140, 0.12, "triangle", 0.2); tone(140, 0.12, "triangle", 0.2, 0.22); tone(120, 0.18, "triangle", 0.22, 0.44); },
    ev: function () { tone(988, 0.08, "square", 0.04); tone(1318, 0.18, "square", 0.04, 0.08); },
    page: function () { tone(740, 0.05, "triangle", 0.05); },
    fanfare: function () { [523, 659, 784, 1046, 784, 1046].forEach(function (f, i) { tone(f, i === 5 ? 0.5 : 0.14, "square", 0.05, i * 0.13); }); },
    fail: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.28, "sawtooth", 0.05, i * 0.22); }); },
  };

  /* ================================================================
   * DOM
   * ================================================================ */

  stage.tabIndex = 0;
  stage.innerHTML =
    '<div class="at-scene" data-tone="cool">' +
    '<img class="at-bg" alt="">' +
    '<div class="at-lines"></div>' +
    '<div class="at-chr is-out"><img alt=""><div class="at-chr-ph"></div></div>' +
    '<div class="at-fg" hidden><img alt=""></div>' +
    "</div>" +
    '<div class="at-hud">' +
    '<div class="at-hud-left" style="display:flex;gap:.45em">' +
    '<div class="at-patience" hidden></div><div class="at-hud-chip" hidden></div></div>' +
    '<div class="at-hud-right">' +
    '<button type="button" class="at-btn is-ghost is-icon at-calc-btn" data-act="calc" hidden>123</button>' +
    '<button type="button" class="at-btn is-ghost is-icon at-teach" data-act="teach" hidden>ANS</button>' +
    '<button type="button" class="at-btn is-ghost at-lang" data-act="lang"></button>' +
    '<button type="button" class="at-btn is-ghost is-icon" data-act="mute" title="Sound on / off"></button>' +
    '<button type="button" class="at-btn is-ghost is-icon" data-act="full" title="Full screen">&#x26F6;</button>' +
    '<button type="button" class="at-btn is-ghost is-icon" data-act="exit" title="Leave" hidden>&#x2715;</button>' +
    "</div></div>" +
    '<div class="at-timer" hidden><i></i></div>' +
    '<div class="at-dlg" hidden><div class="at-name"></div><p class="at-line"></p><span class="at-next" hidden>&#x25BC;</span></div>' +
    '<div class="at-panel" hidden></div>' +
    '<div class="at-calc" hidden tabindex="-1">' +
    '<div class="at-calc-bar"><span class="at-calc-title"></span><button type="button" class="at-calc-x" data-calc="close">&#x2715;</button></div>' +
    '<div class="at-calc-screen"><div class="at-calc-expr"></div><div class="at-calc-res">0</div></div>' +
    '<div class="at-calc-keys">' +
    '<button type="button" class="at-calc-key is-fn" data-k="C">C</button>' +
    '<button type="button" class="at-calc-key is-fn" data-k="BK">&#x2190;</button>' +
    '<button type="button" class="at-calc-key is-fn" data-k="(">(</button>' +
    '<button type="button" class="at-calc-key is-fn" data-k=")">)</button>' +
    '<button type="button" class="at-calc-key" data-k="7">7</button>' +
    '<button type="button" class="at-calc-key" data-k="8">8</button>' +
    '<button type="button" class="at-calc-key" data-k="9">9</button>' +
    '<button type="button" class="at-calc-key is-op" data-k="/">&#x00F7;</button>' +
    '<button type="button" class="at-calc-key" data-k="4">4</button>' +
    '<button type="button" class="at-calc-key" data-k="5">5</button>' +
    '<button type="button" class="at-calc-key" data-k="6">6</button>' +
    '<button type="button" class="at-calc-key is-op" data-k="*">&#x00D7;</button>' +
    '<button type="button" class="at-calc-key" data-k="1">1</button>' +
    '<button type="button" class="at-calc-key" data-k="2">2</button>' +
    '<button type="button" class="at-calc-key" data-k="3">3</button>' +
    '<button type="button" class="at-calc-key is-op" data-k="-">&#x2212;</button>' +
    '<button type="button" class="at-calc-key" data-k="0">0</button>' +
    '<button type="button" class="at-calc-key" data-k=".">.</button>' +
    '<button type="button" class="at-calc-key is-fn" data-k="%">%</button>' +
    '<button type="button" class="at-calc-key is-op" data-k="+">+</button>' +
    '<button type="button" class="at-calc-key is-eq" data-k="=">=</button>' +
    "</div></div>" +
    '<div class="at-menu" hidden></div>' +
    '<div class="at-shout" hidden><div></div></div>' +
    '<div class="at-flash"></div>';

  var sceneEl = $(".at-scene");
  var bgImg = $(".at-bg");
  var linesEl = $(".at-lines");
  var chrEl = $(".at-chr");
  var chrImg = $(".at-chr img");
  var chrPh = $(".at-chr-ph");
  var fgEl = $(".at-fg");
  var fgImg = $(".at-fg img");
  var patEl = $(".at-patience");
  var chipEl = $(".at-hud-chip");
  var calcBtn = $('[data-act="calc"]');
  var teachBtn = $('[data-act="teach"]');
  var calcEl = $(".at-calc");
  var langBtn = $('[data-act="lang"]');
  var muteBtn = $('[data-act="mute"]');
  var exitBtn = $('[data-act="exit"]');
  var timerEl = $(".at-timer");
  var dlg = $(".at-dlg");
  var nameEl = $(".at-name");
  var lineEl = $(".at-line");
  var nextEl = $(".at-next");
  var panel = $(".at-panel");
  var menu = $(".at-menu");
  var shoutEl = $(".at-shout");
  var flashEl = $(".at-flash");

  function art(name) { return ART + name + (/^fg-|-\d$/.test(name) ? ".png" : ".jpg") + V; }

  function setImg(img, name, holder) {
    var src = art(name);
    if (img.getAttribute("data-src") === src) return;
    img.setAttribute("data-src", src);
    holder.classList.remove("is-missing");
    img.onerror = function () { holder.classList.add("is-missing"); };
    img.onload = function () { holder.classList.remove("is-missing"); };
    img.src = src;
  }

  function preload(names) {
    names.forEach(function (n) { var i = new Image(); i.src = art(n); });
  }

  function updateMute() { muteBtn.innerHTML = save.muted ? "&#x1F507;" : "&#x1F50A;"; }
  updateMute();

  function updateLangUi() {
    stage.classList.toggle("is-zh", lang === "zh");
    stage.setAttribute("lang", lang === "zh" ? "zh-HK" : "en");
    langBtn.textContent = lang === "zh" ? "EN" : "中文";
    langBtn.title = lang === "zh" ? "Switch to English" : "切換至中文";
    calcBtn.title = T(L("Calculator", "計算機"));
    var calcTitle = $(".at-calc-title");
    if (calcTitle) calcTitle.textContent = T(L("Calculator", "計算機"));
    updateTeach();
  }
  function updateTeach() {
    teachBtn.textContent = lang === "zh" ? "答案" : "ANS";
    teachBtn.title = lang === "zh" ? "老師模式：題目可顯示答案" : "Teacher mode: show the answer";
    teachBtn.classList.toggle("is-on", !!save.teacher);
  }
  updateLangUi();

  /* ================================================================
   * Scene control
   * ================================================================ */

  var view = { place: null, who: null, face: null, cut: null };

  function showBg(name, tone) {
    sceneEl.setAttribute("data-tone", tone || "cool");
    setImg(bgImg, name, bgImg);
  }

  function showSprite(who, face, left) {
    if (!who) { chrEl.classList.add("is-out"); view.who = null; return; }
    var changed = view.who !== who || view.face !== face;
    chrEl.style.setProperty("--ph", CAST[who].ph);
    chrPh.textContent = T(CAST[who].name);
    setImg(chrImg, who + "-" + faceNo(who, face), chrEl);
    chrEl.classList.remove("is-out");
    chrEl.classList.toggle("is-left", !!left);
    if (changed && view.who === who) { chrEl.classList.remove("bump"); void chrEl.offsetWidth; chrEl.classList.add("bump"); }
    view.who = who; view.face = face;
  }

  function showPlace(key, who, face) {
    var p = PLACES[key];
    view.place = key; view.cut = null;
    showBg(p.bg, p.tone);
    if (p.fg) {
      fgEl.hidden = false;
      fgEl.classList.toggle("is-stand", !!p.stand);
      setImg(fgImg, p.fg, fgEl);
    } else {
      fgEl.hidden = true;
    }
    showSprite(who || null, face);
  }

  function showCut(name, tone) {
    view.place = null; view.cut = name;
    showBg(name, tone || "cool");
    fgEl.hidden = true;
    showSprite(null);
  }

  /* ================================================================
   * Dialogue
   * ================================================================ */

  var talk = { token: 0, typing: false, full: "", done: null, timer: null };

  function segs(text) {
    var out = [], re = /\*([^*]+)\*|\[([^\]]+)\]/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      out.push({ t: m[1] || m[2], c: m[1] ? "em" : "strong" });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }

  function renderPrefix(parts, n) {
    var html = "", left = n;
    for (var i = 0; i < parts.length && left > 0; i++) {
      var piece = parts[i].t.slice(0, left);
      left -= piece.length;
      html += parts[i].c ? "<" + parts[i].c + ">" + esc(piece) + "</" + parts[i].c + ">" : esc(piece);
    }
    return html;
  }

  /* text / opts.name may be bilingual. opts: { name, cls, pitch, arrow:false } */
  function type(text, opts, done) {
    opts = opts || {};
    var my = ++talk.token;
    clearTimeout(talk.timer);
    talk.src = text; talk.opts = opts;
    dlg.hidden = false;
    nameEl.textContent = T(opts.name) || "";
    lineEl.className = "at-line" + (opts.cls ? " " + opts.cls : "");
    var parts = segs(T(text)), total = 0;
    parts.forEach(function (p) { total += p.t.length; });
    var n = 0;
    talk.typing = true;
    talk.done = done || null;
    talk.finish = function () {
      n = total;
      lineEl.innerHTML = renderPrefix(parts, n);
      talk.typing = false;
      nextEl.hidden = opts.arrow === false;
    };
    nextEl.hidden = true;
    lineEl.innerHTML = "";
    var speed = opts.cls === "is-narr" ? 20 : 26;
    (function tick() {
      if (my !== talk.token) return;
      n += 1;
      lineEl.innerHTML = renderPrefix(parts, n);
      if (opts.pitch && n % 2 === 0) SFX.blip(opts.pitch);
      if (n >= total) { talk.finish(); return; }
      talk.timer = setTimeout(tick, speed);
    })();
  }

  /* Language switch mid-line: show the whole line in the new language. */
  function retypeLine() {
    if (dlg.hidden || talk.src == null) return;
    talk.token++; clearTimeout(talk.timer);
    var parts = segs(T(talk.src));
    nameEl.textContent = T(talk.opts.name) || "";
    lineEl.innerHTML = renderPrefix(parts, Infinity);
    talk.typing = false;
    nextEl.hidden = talk.opts.arrow === false;
  }

  function advance() {
    if (dlg.hidden) return;
    if (talk.typing) { clearTimeout(talk.timer); talk.finish(); return; }
    var d = talk.done;
    if (!d) return;
    talk.done = null;
    SFX.page();
    d();
  }

  dlg.addEventListener("click", advance);

  var PITCH = { kit: 560, mei: 760, max: 330, judge: 250, grant: 300, doris: 700, felix: 620, victor: 230 };

  /* ================================================================
   * Story runner
   * ================================================================ */

  var R = null; // story run

  function push(steps, done) { R.frames.push({ steps: steps, i: 0, done: done || null }); }

  function next() {
    if (!R || R.halt) return;
    var f = R.frames[R.frames.length - 1];
    while (f && f.i >= f.steps.length) {
      R.frames.pop();
      if (f.done) { f.done(); return; }
      f = R.frames[R.frames.length - 1];
    }
    if (!f) return;
    exec(f.steps[f.i++]);
  }

  function exec(st) {
    switch (st.k) {
      case "cut": R.place = "cut"; showCut(st.img, st.tone); next(); break;
      case "place":
        R.place = st.v;
        if (st.v !== "court") showPlace(st.v, null);
        next();
        break;
      case "scene":
        R.place = st.v === "lobby" ? st.v : "court";
        showPlace(st.v, st.who || null, st.face);
        next();
        break;
      case "say": doSay(st, next); break;
      case "ev": SFX.ev(); showEvidence(st.id, next); break;
      case "cp": R.cp = { i: R.frames[0].i, place: R.place, found: R.found.slice() }; next(); break;
      case "fx": doFx(st, next); break;
      case "banner": doBanner(st.top, st.title, next); break;
      case "calc": doCalc(st, next); break;
      case "choice": doChoice(st, next); break;
      case "deduce": doDeduce(st, next); break;
      case "pick": doPick(st, next); break;
      case "cf": doCf(st, next); break;
      case "verdict": doVerdict(st.text, false, next); break;
      case "end": caseClear(); break;
      default: next();
    }
  }

  function doSay(st, done) {
    var who = st.who;
    var face = st.think ? (st.face || "think") : st.face;
    if (who) {
      if (R && R.place === "court") {
        var at = st.at || CAST[who].at;
        if (view.place !== at || view.who !== who || view.face !== face) showPlace(at, who, face);
      } else if (R && R.place !== "cut") {
        showSprite(who, face);
      }
    }
    var cls = !who ? "is-narr" : st.think ? "is-think" : "";
    var name = st.name || (who ? CAST[who].name : "");
    type(st.text, { name: name, cls: cls, pitch: who ? PITCH[who] : 0 }, done);
  }

  function flash(red) {
    flashEl.classList.remove("on", "is-red");
    void flashEl.offsetWidth;
    if (red) flashEl.classList.add("is-red");
    flashEl.classList.add("on");
  }
  function shake() { stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); }
  function speedLines() { linesEl.classList.remove("on"); void linesEl.offsetWidth; linesEl.classList.add("on"); }

  var SHOUTS = { objection: [L("OBJECTION!", "異議！"), ""], hold: [L("HOLD IT!", "等一下！"), "is-hold"], take: [L("TAKE THAT!", "看招！"), "is-take"] };

  function shout(kind, done) {
    var s = SHOUTS[kind];
    dlg.hidden = true;
    shoutEl.className = "at-shout" + (s[1] ? " " + s[1] : "");
    shoutEl.firstChild.textContent = T(s[0]);
    shoutEl.hidden = false;
    var inner = shoutEl.firstChild;
    inner.style.animation = "none"; void inner.offsetWidth; inner.style.animation = "";
    SFX.shout();
    shake();
    setTimeout(function () { shoutEl.hidden = true; if (done) done(); }, 950);
  }

  function doFx(st, done) {
    var v = st.v;
    if (v === "objection" || v === "hold" || v === "take") {
      var who = st.who || "kit";
      shout(v, function () {
        if (R && R.place === "court") showPlace(CAST[who].at, who, "point");
        speedLines();
        flash();
        setTimeout(done, 350);
      });
    } else if (v === "gavel") {
      if (R && R.place === "court") showPlace("judge", "judge", "stern");
      SFX.gavel(); shake();
      setTimeout(done, 750);
    } else if (v === "shake") { shake(); flash(); setTimeout(done, 450); }
    else if (v === "flash") { flash(); setTimeout(done, 300); }
    else done();
  }

  function doBanner(top, title, done) {
    dlg.hidden = true;
    var b = el("div", "at-banner", "<small>" + esc(top) + "</small><span>" + esc(title) + "</span>");
    stage.appendChild(b);
    SFX.ev();
    setTimeout(function () { b.remove(); done(); }, 1850);
  }

  /* ---------- Patience ---------- */

  var pips = null;
  function drawPips(n, max, label) {
    pips = [n, max, label];
    patEl.hidden = false;
    var html = "<b>" + esc(label || L("Patience", "耐性")) + "</b>";
    for (var i = 0; i < max; i++) html += '<span class="at-pat' + (i < n ? "" : " off") + '"></span>';
    patEl.innerHTML = html;
  }

  function loseMark(n) {
    var pips = patEl.querySelectorAll(".at-pat");
    if (pips[n]) pips[n].classList.add("lost");
  }

  /* Returns false when the case is lost. */
  function penalty() {
    if (!R) return true;
    R.pat -= 1;
    drawPips(R.pat, MAX_PAT);
    loseMark(R.pat);
    SFX.bad(); flash(true); shake();
    if (R.pat <= 0) {
      R.halt = true;
      setTimeout(gameOver, 700);
      return false;
    }
    return true;
  }

  /* ================================================================
   * Evidence renders
   * ================================================================ */

  function renderEv(show) {
    if (!show) return "";
    var h = "";
    if (show.type === "list") {
      h = (show.label ? "<p>" + markup(show.label) + "</p>" : "") + '<div class="at-chips">' +
        show.values.map(function (v) {
          var blur = typeof v === "string" && /^[a-z]$/.test(v);
          return '<span class="at-chip' + (blur ? " is-blur" : "") + '">' + esc(v) + "</span>";
        }).join("") + "</div>";
    } else if (show.type === "table") {
      h = (show.label ? "<p>" + markup(show.label) + "</p>" : "") + "<table>" +
        (show.head ? "<tr>" + show.head.map(function (c, i) { return i === 0 ? "<th>" + esc(c) + "</th>" : "<th style=\"text-align:center\">" + esc(c) + "</th>"; }).join("") + "</tr>" : "") +
        show.rows.map(function (r) {
          return "<tr>" + r.map(function (c, i) {
            var blur = typeof c === "string" && /^[a-z]$/.test(c);
            return i === 0 ? "<th>" + esc(c) + "</th>" : "<td" + (blur ? ' class="is-blur"' : "") + ">" + esc(c) + "</td>";
          }).join("") + "</tr>";
        }).join("") + "</table>";
    } else if (show.type === "note" || show.type === "ledger") {
      h = show.lines.map(function (l) { return "<p>" + markup(l) + "</p>"; }).join("");
    } else if (show.type === "jug") {
      h = jugSvg(show);
    } else if (show.type === "pies") {
      h = piesSvg(show);
    } else if (show.type === "cf") {
      h = cfSvg(show, null);
    }
    if (show.foot) h += '<p class="at-ev-note">' + markup(show.foot) + "</p>";
    return '<div class="at-ev' + (show.type === "ledger" ? " at-ledger" : "") + '">' + h + "</div>";
  }

  function jugSvg(s) {
    var level = 200 - Math.min(1, s.reading / 600) * 150;
    return '<svg viewBox="0 0 320 220" shape-rendering="crispEdges">' +
      '<rect x="0" y="0" width="320" height="220" fill="#2b2f45"/>' +
      '<rect x="8" y="8" width="304" height="204" fill="none" stroke="#f4ecd6" stroke-width="4"/>' +
      '<rect x="70" y="' + level + '" width="100" height="' + (200 - level) + '" fill="#c98a4a"/>' +
      '<rect x="70" y="' + level + '" width="100" height="6" fill="#e9b884"/>' +
      '<path d="M66 40 H174 V200 H66 Z" fill="none" stroke="#dfe8ff" stroke-width="5"/>' +
      '<path d="M174 70 H200 V150 H174" fill="none" stroke="#dfe8ff" stroke-width="5"/>' +
      [100, 200, 300, 400, 500].map(function (m) {
        var y = 200 - (m / 600) * 150;
        return '<rect x="66" y="' + y + '" width="16" height="3" fill="#dfe8ff"/>' + '<text x="40" y="' + (y + 5) + '" font-size="13" fill="#dfe8ff" style="fill:#dfe8ff">' + m + "</text>";
      }).join("") +
      '<rect x="212" y="54" width="92" height="54" fill="#0f1a12" stroke="#6ee68f" stroke-width="3"/>' +
      '<text x="258" y="90" text-anchor="middle" font-size="26" style="fill:#6ee68f">' + s.reading + "</text>" +
      '<text x="258" y="130" text-anchor="middle" font-size="15" style="fill:#f4ecd6">mL</text>' +
      '<text x="258" y="186" text-anchor="middle" font-size="16" style="fill:#ffc84a">' + esc(s.tag || "") + "</text>" +
      "</svg>";
  }

  function piesSvg(s) {
    var w = 200 * s.groups.length;
    var out = '<svg viewBox="0 0 ' + w + ' 250">';
    s.groups.forEach(function (g, gi) {
      var cx = 100 + gi * 200, cy = 100, r = 72, a0 = -Math.PI / 2;
      g.slices.forEach(function (sl) {
        var a1 = a0 + (sl[1] / 100) * Math.PI * 2;
        var large = a1 - a0 > Math.PI ? 1 : 0;
        out += '<path d="M' + cx + " " + cy + " L" + (cx + r * Math.cos(a0)).toFixed(1) + " " + (cy + r * Math.sin(a0)).toFixed(1) +
          " A" + r + " " + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)).toFixed(1) + " " + (cy + r * Math.sin(a1)).toFixed(1) +
          ' Z" fill="' + sl[2] + '" stroke="#2a2116" stroke-width="2"/>';
        var am = (a0 + a1) / 2;
        out += '<text x="' + (cx + r * 0.58 * Math.cos(am)).toFixed(1) + '" y="' + (cy + r * 0.58 * Math.sin(am) + 5).toFixed(1) +
          '" text-anchor="middle" font-size="15" style="fill:#fff">' + sl[1] + "%</text>";
        a0 = a1;
      });
      out += '<text x="' + cx + '" y="192" text-anchor="middle" font-size="15">' + esc(g.label) + "</text>";
    });
    var keys = s.groups[0].slices;
    keys.forEach(function (sl, i) {
      var x = 20 + i * (w - 40) / keys.length;
      out += '<rect x="' + x + '" y="214" width="14" height="14" fill="' + sl[2] + '" stroke="#2a2116"/>' +
        '<text x="' + (x + 20) + '" y="226" font-size="14">' + esc(sl[0]) + "</text>";
    });
    return out + "</svg>";
  }

  var CF = { x0: 56, x1: 404, y0: 236, y1: 18, w: 420, h: 280 };

  function cfSvg(s, line) {
    function sx(x) { return CF.x0 + (x - s.xmin) / (s.xmax - s.xmin) * (CF.x1 - CF.x0); }
    function sy(y) { return CF.y0 - y / s.ymax * (CF.y0 - CF.y1); }
    var o = '<svg viewBox="0 0 ' + CF.w + " " + CF.h + '" shape-rendering="crispEdges">';
    for (var gx = s.xmin; gx <= s.xmax + 1e-9; gx += s.xminor) {
      o += '<line class="grid' + (Math.abs((gx - s.xmin) % s.xmajor) < 1e-9 || Math.abs(((gx - s.xmin) % s.xmajor) - s.xmajor) < 1e-9 ? "" : " is-minor") + '" x1="' + sx(gx) + '" y1="' + CF.y1 + '" x2="' + sx(gx) + '" y2="' + CF.y0 + '"/>';
    }
    for (var gy = 0; gy <= s.ymax; gy += s.yminor) {
      o += '<line class="grid' + (gy % s.ystep === 0 ? "" : " is-minor") + '" x1="' + CF.x0 + '" y1="' + sy(gy) + '" x2="' + CF.x1 + '" y2="' + sy(gy) + '"/>';
    }
    for (gy = 0; gy <= s.ymax; gy += s.ystep) o += '<text x="' + (CF.x0 - 8) + '" y="' + (sy(gy) + 5) + '" text-anchor="end" font-size="13">' + gy + "</text>";
    for (gx = s.xmin; gx <= s.xmax + 1e-9; gx += s.xmajor) o += '<text x="' + sx(gx) + '" y="' + (CF.y0 + 18) + '" text-anchor="middle" font-size="13">' + round(gx, 1) + "</text>";
    o += '<line class="axis" x1="' + CF.x0 + '" y1="' + CF.y0 + '" x2="' + CF.x1 + '" y2="' + CF.y0 + '"/>' +
      '<line class="axis" x1="' + CF.x0 + '" y1="' + CF.y0 + '" x2="' + CF.x0 + '" y2="' + CF.y1 + '"/>';
    o += '<polyline class="curve" shape-rendering="auto" points="' + s.pts.map(function (p) { return sx(p[0]) + "," + sy(p[1]); }).join(" ") + '"/>';
    s.pts.forEach(function (p) { o += '<rect class="dot" x="' + (sx(p[0]) - 4) + '" y="' + (sy(p[1]) - 4) + '" width="8" height="8"/>'; });
    o += '<text x="' + ((CF.x0 + CF.x1) / 2) + '" y="' + (CF.h - 4) + '" text-anchor="middle" font-size="13">' + esc(s.xlabel) + "</text>";
    o += '<text x="14" y="' + ((CF.y0 + CF.y1) / 2) + '" text-anchor="middle" font-size="13" transform="rotate(-90 14 ' + ((CF.y0 + CF.y1) / 2) + ')">' + esc(s.ylabel) + "</text>";
    if (line) o += line(sx, sy);
    return '<div class="at-cf">' + o + "</svg></div>";
  }

  function cfCross(s, y) {
    for (var i = 1; i < s.pts.length; i++) {
      var a = s.pts[i - 1], b = s.pts[i];
      if (y >= a[1] && y <= b[1] && b[1] > a[1]) return a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]);
    }
    return null;
  }

  /* ================================================================
   * Panels: evidence card, calc, choice, deduce, pick, cumulative-frequency read
   * ================================================================ */

  /* Set by each panel so a language switch can rebuild it; cleared once the panel is answered. */
  var panelDraw = null;

  function openPanel(html, wide) {
    dlg.hidden = true;
    panel.className = "at-panel" + (wide ? " is-wide" : "");
    panel.innerHTML = html;
    panel.hidden = false;
    panel.scrollTop = 0;
    stage.classList.add("has-panel");
  }
  function closePanel() { panelDraw = null; panel.hidden = true; panel.innerHTML = ""; stage.classList.remove("has-panel"); }

  function thinkPose() {
    if (R && R.place === "court") showPlace("defense", "kit", "think");
  }

  function evFor(st) {
    if (!st.show) return "";
    if (typeof st.show === "string") return renderEv(R.kase.evidence[st.show].show);
    return renderEv(st.show);
  }
  /* Evidence HTML may be a builder so a redraw renders it in the current language. */
  function evOf(h) { return typeof h === "function" ? h() : h || ""; }

  function showEvidence(id, done) {
    var def = R.kase.evidence[id];
    dlg.hidden = true;
    openPanel('<p class="at-ev-kicker">' + esc(L("New evidence", "新證物")) + "</p>" +
      "<h3>" + esc(def.name) + "</h3>" +
      '<p class="at-q">' + markup(def.desc) + "</p>" + renderEv(def.show) +
      '<div class="at-row"><button type="button" class="at-btn is-gold" data-c="go">' + esc(L("Continue", "繼續")) + " &#x25B6;</button></div>");
    panel.classList.add("is-evcard");
    panelDraw = function () { showEvidence(id, done); };
    var go = $('[data-c="go"]', panel);
    go.addEventListener("click", function () { closePanel(); done(); });
    setTimeout(function () { go.focus(); }, 30);
  }

  /* calc: { q, a, tol, unit, wrongs:[{v,m}], hint, show, title } — onRight/onWrong let challenges reuse it. */
  var HINT = L("Hint from Mei", "Mei 的提示");
  var NEED_NUM = L("Type a number.", "請輸入數字。");

  function remember(st) {
    if (!R || !st.found) return;
    var show = st.show || "";
    R.found = R.found.filter(function (f) { return f.show === show; });
    R.found.push({ show: show, text: st.found });
  }

  /* Results from earlier questions on the same evidence, so a later part does not depend on memory. */
  function foundHtml(st) {
    if (!R || !st || !st.show) return "";
    var items = R.found.filter(function (f) { return f.show === st.show; });
    if (!items.length) return "";
    return '<p class="at-found"><b>' + esc(L("Already found", "已求出")) + "</b> " +
      items.map(function (f) { return esc(f.text); }).join(" · ") + "</p>";
  }

  function revealHtml() {
    if (!save.teacher) return "";
    return '<button type="button" class="at-btn is-gold at-help at-reveal" data-c="reveal">' + esc(L("Show answer", "顯示答案")) + "</button>";
  }
  function onReveal(fn) {
    var b = panel.querySelector('[data-c="reveal"]');
    if (b) b.addEventListener("click", fn);
  }

  /* One answer that satisfies every clue. The last blank is fixed by the mean when there is one. */
  function solveDeduce(st) {
    var vars = st.vars, known = 0, found = null;
    st.data.forEach(function (d) { if (typeof d === "number") known += d; });
    function bounds(k, vals) {
      var lo = 0, hi = 99;
      if (!st.order) return [lo, hi];
      var idx = st.data.indexOf(k), left = null, right = null, p, d;
      for (p = idx - 1; p >= 0; p--) {
        d = st.data[p];
        if (typeof d === "number") { left = d; break; }
        if (vals[d] != null && isFinite(vals[d])) { left = vals[d]; break; }
      }
      for (p = idx + 1; p < st.data.length; p++) {
        d = st.data[p];
        if (typeof d === "number") { right = d; break; }
        if (vals[d] != null && isFinite(vals[d])) { right = vals[d]; break; }
      }
      if (st.order === "asc") {
        if (left != null) lo = Math.max(lo, left);
        if (right != null) hi = Math.min(hi, right);
      } else {
        if (left != null) hi = Math.min(hi, left);
        if (right != null) lo = Math.max(lo, right);
      }
      return [lo, hi];
    }
    function rec(i, vals) {
      if (found) return;
      if (i === vars.length) {
        if (!deduceCheck(st, vals)) {
          found = {};
          vars.forEach(function (k) { found[k] = vals[k]; });
        }
        return;
      }
      var k = vars[i];
      if (i === vars.length - 1 && st.mean != null) {
        var sofar = known, j;
        for (j = 0; j < i; j++) sofar += vals[vars[j]];
        var need = st.mean * st.data.length - sofar;
        if (st.int === false || Math.abs(need - Math.round(need)) < 1e-6) {
          vals[k] = st.int === false ? Math.round(need * 1000) / 1000 : Math.round(need);
          rec(i + 1, vals);
        }
        return;
      }
      var b = bounds(k, vals), v;
      for (v = b[0]; v <= b[1] && !found; v++) { vals[k] = v; rec(i + 1, vals); }
    }
    rec(0, {});
    return found;
  }

  function solvePick(st) {
    var best = null, n = st.data.length;
    function fits(chosen) {
      var left = st.data.filter(function (v, i) { return chosen.indexOf(i) < 0; });
      if (st.remMean != null && Math.abs(mean(left) - st.remMean) > 1e-9) return false;
      if (st.remMode != null) {
        var ms = modes(left);
        if (!(ms.length === 1 && ms[0] === st.remMode)) return false;
      }
      return true;
    }
    function rec(start, chosen) {
      if (best) return;
      if (chosen.length === st.count) { if (fits(chosen)) best = chosen.slice(); return; }
      for (var i = start; i < n && !best; i++) { chosen.push(i); rec(i + 1, chosen); chosen.pop(); }
    }
    rec(0, []);
    return best;
  }

  function calcPanel(st, hooks) {
    var html = (st.title ? "<h3>" + esc(st.title) + "</h3>" : "") +
      '<p class="at-q">' + markup(st.q) + "</p>" + foundHtml(st) + evOf(hooks.evHtml) +
      '<div class="at-row"><input class="at-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Your answer">' +
      (st.unit ? '<span class="at-unit">' + esc(st.unit) + "</span>" : "") +
      '<button type="button" class="at-btn is-red" data-c="go">' + esc(L("Submit", "提交")) + "</button>" + revealHtml() + "</div>" +
      '<p class="at-fb" aria-live="polite"></p>' +
      (st.hint ? '<button type="button" class="at-btn is-ghost at-help" data-c="hint" hidden>' + esc(HINT) + "</button>" : "");
    openPanel(html, hooks.wide);
    panelDraw = function () { calcPanel(st, hooks); };
    var input = $(".at-input", panel), fb = $(".at-fb", panel), hintBtn = $('[data-c="hint"]', panel);
    var locked = false;
    setTimeout(function () { input.focus(); }, 30);
    function submit() {
      if (locked) return;
      var v = parseNum(input.value);
      if (v == null) { fb.className = "at-fb is-bad"; fb.textContent = T(NEED_NUM); return; }
      if (close(v, st.a, st.tol)) {
        locked = true; panelDraw = null;
        fb.className = "at-fb is-good";
        fb.textContent = T(L("Correct: ", "正確：")) + fmt(st.a) + (st.unit ? " " + T(st.unit) : "") + (lang === "zh" ? "" : ".");
        SFX.good();
        hooks.onRight();
        return;
      }
      var msg = null;
      (st.wrongs || []).forEach(function (w) { if (!msg && near(v, w.v)) msg = w.m; });
      fb.className = "at-fb is-bad";
      fb.innerHTML = markup(msg || hooks.generic || L("Not quite. Check your working and try again.", "不太對。檢查一下你的計算，再試一次。"));
      if (hintBtn) hintBtn.hidden = false;
      input.select();
      var keep = hooks.onWrong(v);
      if (keep === false) { locked = true; panelDraw = null; }
    }
    panel.querySelector('[data-c="go"]').addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } e.stopPropagation(); });
    if (hintBtn) hintBtn.addEventListener("click", function () { fb.className = "at-fb is-hint"; fb.innerHTML = markup(st.hint); });
    onReveal(function () { input.value = fmt(st.a); submit(); });
  }

  function doCalc(st, done) {
    thinkPose();
    calcPanel(st, {
      evHtml: function () { return evFor(st); },
      onRight: function () { remember(st); setTimeout(function () { closePanel(); done(); }, 900); },
      onWrong: function () { return st.practice ? true : penalty(); },
    });
  }

  /* choice: { q, options:[...], a, why:[...per option], explain, show } */
  function choicePanel(st, hooks) {
    var longest = Math.max.apply(null, st.options.map(function (o) { return String(o && o.en || o).length; }));
    var cols = st.options.length <= 3 && longest <= 16 ? st.options.length : st.options.length % 2 === 0 && longest <= 44 ? 2 : 1;
    var html = (st.title ? "<h3>" + esc(st.title) + "</h3>" : "") +
      '<p class="at-q">' + markup(st.q) + "</p>" + foundHtml(st) + evOf(hooks.evHtml) +
      '<div class="at-choices" style="grid-template-columns:repeat(' + cols + ',1fr)">' + st.options.map(function (o, i) {
        return '<button type="button" class="at-btn at-choice" data-o="' + i + '">' + markup(o) + "</button>";
      }).join("") + "</div>" + revealHtml() +
      '<p class="at-fb" aria-live="polite"></p>' +
      '<button type="button" class="at-btn is-gold at-help" data-c="go" hidden>' + esc(L("Continue", "繼續")) + " &#x25B6;</button>";
    openPanel(html, hooks.wide);
    panelDraw = function () { choicePanel(st, hooks); };
    var fb = $(".at-fb", panel), go = $('[data-c="go"]', panel), locked = false;
    panel.querySelectorAll("[data-o]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (locked || b.classList.contains("is-wrong")) return;
        var i = Number(b.getAttribute("data-o"));
        if (i === st.a) {
          locked = true; panelDraw = null;
          b.classList.add("is-right");
          b.parentNode.classList.add("is-done");
          fb.className = "at-fb is-good";
          fb.innerHTML = markup(st.explain || L("Correct!", "正確！"));
          SFX.good();
          go.hidden = false;
          go.focus();
          return;
        }
        b.classList.add("is-wrong");
        fb.className = "at-fb is-bad";
        fb.innerHTML = markup((st.why && st.why[i]) || L("Not that one. Think again.", "不是這個，再想想。"));
        if (hooks.onWrong(i) === false) { locked = true; panelDraw = null; }
      });
    });
    go.addEventListener("click", function () { hooks.onRight(); });
    onReveal(function () {
      var right = panel.querySelector('[data-o="' + st.a + '"]');
      if (right) right.click();
    });
  }

  function doChoice(st, done) {
    thinkPose();
    choicePanel(st, {
      evHtml: function () { return evFor(st); },
      onRight: function () { closePanel(); done(); },
      onWrong: function () { return penalty(); },
    });
  }

  /* deduce: { q, data:[n|"x"], vars:["x","y"], order:"asc"|"desc", mean, median, mode, less:[["a","b"]], show } */
  /* Returns null when every clue fits, else a bilingual message; .soft = incomplete input (no penalty). */
  function deduceCheck(st, vals) {
    var i, soft;
    for (i = 0; i < st.vars.length; i++) {
      var v = vals[st.vars[i]];
      if (v == null || !isFinite(v)) { soft = L("Fill in every blank.", "請填寫每一個空格。"); soft.soft = true; return soft; }
      if (st.int !== false && Math.round(v) !== v) { soft = L("The blanks are whole numbers (integers).", "空格要填整數。"); soft.soft = true; return soft; }
    }
    var arr = st.data.map(function (d) { return typeof d === "string" ? vals[d] : d; });
    if (st.order === "asc") for (i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return L("The data must stay in *ascending* order (smallest to largest).", "數據必須保持*遞升*次序（由小至大）。");
    if (st.order === "desc") for (i = 1; i < arr.length; i++) if (arr[i] > arr[i - 1]) return L("The data must stay in *descending* order (largest to smallest).", "數據必須保持*遞降*次序（由大至小）。");
    var less = st.less || [];
    for (i = 0; i < less.length; i++) if (!(vals[less[i][0]] < vals[less[i][1]])) return L(less[i][0] + " must be smaller than " + less[i][1] + ".", less[i][0] + " 必須小於 " + less[i][1] + "。");
    var pairs = st.vars.map(function (k) { return k + " = " + vals[k]; });
    var en = "With " + pairs.join(" and ") + ", ", zh = "當 " + pairs.join("、") + " 時，";
    if (st.mean != null) { var m = mean(arr); if (Math.abs(m - st.mean) > 1e-9) return L(en + "the mean is " + fmt(m) + ", not " + st.mean + ".", zh + "平均數是 " + fmt(m) + "，不是 " + st.mean + "。"); }
    if (st.median != null) { var md = median(arr); if (Math.abs(md - st.median) > 1e-9) return L(en + "the median is " + fmt(md) + ", not " + st.median + ".", zh + "中位數是 " + fmt(md) + "，不是 " + st.median + "。"); }
    if (st.mode != null) {
      var ms = modes(arr);
      if (!(ms.length === 1 && ms[0] === st.mode)) {
        return ms.length === 0 ? L(en + "no value repeats, so there is no mode. But the mode must be " + st.mode + " only.", zh + "沒有數值重複出現，所以沒有眾數。但眾數必須只是 " + st.mode + "。")
          : ms.length > 1 ? L(en + "the modes tie: " + ms.join(" and ") + ". But the mode must be " + st.mode + " only.", zh + "眾數有 " + ms.join(" 和 ") + " 並列。但眾數必須只是 " + st.mode + "。")
          : L(en + "the mode is " + ms[0] + ". But the mode must be " + st.mode + " only.", zh + "眾數是 " + ms[0] + "。但眾數必須只是 " + st.mode + "。");
      }
    }
    return null;
  }

  function deducePanel(st, hooks) {
    var en = [], zh = [];
    if (st.order) { en.push(st.order === "asc" ? "arranged in ascending order" : "arranged in descending order"); zh.push(st.order === "asc" ? "按遞升次序排列" : "按遞降次序排列"); }
    if (st.mean != null) { en.push("mean = " + st.mean); zh.push("平均數 = " + st.mean); }
    if (st.median != null) { en.push("median = " + st.median); zh.push("中位數 = " + st.median); }
    if (st.mode != null) { en.push("mode = " + st.mode); zh.push("眾數 = " + st.mode); }
    (st.less || []).forEach(function (p) { en.push(p[0] + " < " + p[1]); zh.push(p[0] + " < " + p[1]); });
    var ev = evOf(hooks.evHtml);
    var html = (st.title ? "<h3>" + esc(st.title) + "</h3>" : "") +
      '<p class="at-q">' + markup(st.q) + "</p>" + foundHtml(st) + ev +
      '<div class="at-ev at-ledger"><div class="at-deduce">' + st.data.map(function (d) {
        return typeof d === "string"
          ? '<label><input class="at-input is-small" data-v="' + d + '" inputmode="numeric" placeholder="' + d + '" aria-label="' + d + '"></label>'
          : '<span class="at-chip">' + d + "</span>";
      }).join("") + "</div>" +
      (ev ? "" : '<p class="at-ev-note">' + esc(L("Pencil note: " + en.join(" · "), "鉛筆註記：" + zh.join(" · "))) + "</p>") + "</div>" +
      '<div class="at-row"><button type="button" class="at-btn is-red" data-c="go">' + esc(L("Check", "檢查")) + "</button>" + revealHtml() + "</div>" +
      '<p class="at-fb" aria-live="polite"></p>' +
      (st.hint ? '<button type="button" class="at-btn is-ghost at-help" data-c="hint" hidden>' + esc(HINT) + "</button>" : "");
    openPanel(html, hooks.wide);
    panelDraw = function () { deducePanel(st, hooks); };
    var fb = $(".at-fb", panel), hintBtn = $('[data-c="hint"]', panel), locked = false;
    var inputs = panel.querySelectorAll("[data-v]");
    setTimeout(function () { if (inputs[0]) inputs[0].focus(); }, 30);
    function check() {
      if (locked) return;
      var vals = {};
      inputs.forEach(function (inp) { vals[inp.getAttribute("data-v")] = parseNum(inp.value); });
      var msg = deduceCheck(st, vals);
      if (!msg) {
        locked = true; panelDraw = null;
        var got = st.vars.map(function (k) { return k + " = " + vals[k]; });
        fb.className = "at-fb is-good";
        fb.textContent = T(L("Every clue fits: " + got.join(", ") + ".", "所有線索都吻合：" + got.join("、") + "。"));
        SFX.good();
        hooks.onRight(vals);
        return;
      }
      fb.className = "at-fb is-bad";
      fb.innerHTML = markup(msg);
      if (hintBtn) hintBtn.hidden = false;
      if (msg.soft) return;
      if (hooks.onWrong() === false) { locked = true; panelDraw = null; }
    }
    panel.querySelector('[data-c="go"]').addEventListener("click", check);
    inputs.forEach(function (inp) {
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } e.stopPropagation(); });
    });
    if (hintBtn) hintBtn.addEventListener("click", function () { fb.className = "at-fb is-hint"; fb.innerHTML = markup(st.hint); });
    onReveal(function () {
      var sol = solveDeduce(st);
      if (!sol) { fb.className = "at-fb is-bad"; fb.textContent = T(L("No single answer.", "找不到唯一答案。")); return; }
      inputs.forEach(function (inp) { inp.value = String(sol[inp.getAttribute("data-v")]); });
      check();
    });
  }

  function doDeduce(st, done) {
    thinkPose();
    deducePanel(st, {
      evHtml: function () { return evFor(st); },
      onRight: function () { remember(st); setTimeout(function () { closePanel(); done(); }, 1000); },
      onWrong: function () { return penalty(); },
    });
  }

  /* pick: { q, data:[...], count, remMean, remMode, unit, show } */
  function doPick(st, done) {
    thinkPose();
    var html = "<h3>" + esc(st.title || L("Find the missing entries", "找出被撕走的項目")) + "</h3>" +
      '<p class="at-q">' + markup(st.q) + "</p>" + foundHtml(st) + evFor(st) +
      '<div class="at-pick">' + st.data.map(function (v, i) { return '<button type="button" data-p="' + i + '">' + v + "</button>"; }).join("") + "</div>" +
      '<div class="at-row"><button type="button" class="at-btn is-red" data-c="go">' + esc(L("Tear these out", "撕走這些")) + "</button>" + revealHtml() + "</div>" +
      '<p class="at-fb" aria-live="polite"></p>' +
      (st.hint ? '<button type="button" class="at-btn is-ghost at-help" data-c="hint" hidden>' + esc(HINT) + "</button>" : "");
    openPanel(html);
    panelDraw = function () { doPick(st, done); };
    var fb = $(".at-fb", panel), hintBtn = $('[data-c="hint"]', panel), locked = false, chosen = [];
    panel.querySelectorAll("[data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (locked) return;
        var i = Number(b.getAttribute("data-p")), at = chosen.indexOf(i);
        if (at >= 0) chosen.splice(at, 1);
        else { if (chosen.length >= st.count) { var old = chosen.shift(); panel.querySelector('[data-p="' + old + '"]').classList.remove("on"); } chosen.push(i); }
        b.classList.toggle("on", chosen.indexOf(i) >= 0);
        SFX.page();
      });
    });
    panel.querySelector('[data-c="go"]').addEventListener("click", function () {
      if (locked) return;
      if (chosen.length !== st.count) { fb.className = "at-fb is-bad"; fb.textContent = T(L("Choose exactly " + st.count + " entries.", "請剛好選擇 " + st.count + " 項。")); return; }
      var removed = chosen.map(function (i) { return st.data[i]; });
      var left = st.data.filter(function (v, i) { return chosen.indexOf(i) < 0; });
      var en = "Tearing out " + removed.join(" and ") + " leaves ", zh = "撕走 " + removed.join(" 和 ") + " 後，剩下的數據";
      var unit = st.unit ? " " + T(st.unit) : "";
      var msg = null;
      if (st.remMean != null && Math.abs(mean(left) - st.remMean) > 1e-9) msg = L(en + "a mean of " + fmt(mean(left)) + unit + ", not " + st.remMean + ".", zh + "平均數是 " + fmt(mean(left)) + unit + "，不是 " + st.remMean + "。");
      if (!msg && st.remMode != null) {
        var ms = modes(left);
        if (!(ms.length === 1 && ms[0] === st.remMode)) {
          msg = L(en + (ms.length > 1 ? "a tie for the mode (" + ms.join(" and ") + ")" : ms.length ? "a mode of " + ms[0] : "no mode") + ", not " + st.remMode + ".",
            zh + (ms.length > 1 ? "有多於一個眾數（" + ms.join(" 和 ") + "）" : ms.length ? "眾數是 " + ms[0] : "沒有眾數") + "，不是 " + st.remMode + "。");
        }
      }
      if (!msg) {
        locked = true; panelDraw = null;
        fb.className = "at-fb is-good";
        fb.textContent = T(L("Mean " + fmt(mean(left)) + ", mode " + modes(left).join(", ") + ". It fits!", "平均數 " + fmt(mean(left)) + "，眾數 " + modes(left).join("、") + "，完全吻合！"));
        SFX.good();
        setTimeout(function () { closePanel(); done(); }, 1100);
        return;
      }
      fb.className = "at-fb is-bad";
      fb.innerHTML = markup(msg);
      if (hintBtn) hintBtn.hidden = false;
      if (penalty() === false) { locked = true; panelDraw = null; }
    });
    if (hintBtn) hintBtn.addEventListener("click", function () { fb.className = "at-fb is-hint"; fb.innerHTML = markup(st.hint); });
    onReveal(function () {
      var idx = solvePick(st);
      if (!idx) { fb.className = "at-fb is-bad"; fb.textContent = T(L("No single answer.", "找不到唯一答案。")); return; }
      panel.querySelectorAll("[data-p].on").forEach(function (b) { b.click(); });
      idx.forEach(function (i) {
        var b = panel.querySelector('[data-p="' + i + '"]');
        if (b && !b.classList.contains("on")) b.click();
      });
      panel.querySelector('[data-c="go"]').click();
    });
  }

  /* cf: { q, show:"evId", target, n, m50, a, tol, wrongs, q2 } — drag the line to n/2, then read the median.
   * resume: rebuild straight into the reading step (after a language switch). */
  function doCf(st, done, resume) {
    thinkPose();
    var s = typeof st.show === "string" ? R.kase.evidence[st.show].show : st.show;
    var y = resume ? st.target : Math.round(s.ymax / 2) + 3, phase = 1;
    function lineFn(sx, sy) {
      var o = '<line class="guide" x1="' + CF.x0 + '" y1="' + sy(y) + '" x2="' + CF.x1 + '" y2="' + sy(y) + '"/>' +
        '<text class="tag" x="' + (CF.x1 - 4) + '" y="' + (sy(y) - 6) + '" text-anchor="end" style="fill:#1f5fd6">CF = ' + y + "</text>";
      if (phase === 2) {
        var x = cfCross(s, y);
        o += '<line class="drop" x1="' + sx(x) + '" y1="' + sy(y) + '" x2="' + sx(x) + '" y2="' + CF.y0 + '"/>';
      }
      return o;
    }
    var html = '<div class="at-cfwrap"><div class="at-cfside"><h3>' + esc(L("Read the graph", "讀圖")) + "</h3>" +
      '<p class="at-q">' + markup(st.q) + "</p>" + foundHtml(st) +
      '<div class="at-row" data-ph="1"><button type="button" class="at-btn" data-c="up">&#x25B2;</button><button type="button" class="at-btn" data-c="down">&#x25BC;</button>' +
      '<button type="button" class="at-btn is-red" data-c="read">' + esc(L("Read across here", "在這裏橫向讀數")) + "</button></div>" +
      '<p class="at-fb" aria-live="polite"></p>' + revealHtml() + "</div>" +
      '<div class="at-ev" data-cf>' + cfSvg(s, lineFn) + "</div></div>";
    openPanel(html, true);
    panelDraw = function () { doCf(st, done, phase === 2); };
    var box = panel.querySelector("[data-cf]"), fb = $(".at-fb", panel);
    function redraw() { box.innerHTML = cfSvg(s, lineFn); bind(); }
    function setFromEvent(e) {
      if (phase !== 1) return;
      var svg = box.querySelector("svg"), r = svg.getBoundingClientRect();
      var vy = (e.clientY - r.top) / r.height * CF.h;
      y = Math.max(0, Math.min(s.ymax, Math.round((CF.y0 - vy) / (CF.y0 - CF.y1) * s.ymax)));
      redraw();
    }
    function bind() {
      var svg = box.querySelector("svg");
      svg.addEventListener("pointerdown", function (e) {
        setFromEvent(e);
        function mv(ev) { setFromEvent(ev); }
        function up() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", up);
      });
    }
    bind();
    panel.querySelector('[data-c="up"]').addEventListener("click", function () { if (y < s.ymax) { y++; redraw(); } });
    panel.querySelector('[data-c="down"]').addEventListener("click", function () { if (y > 0) { y--; redraw(); } });
    function readStep(quiet) {
      phase = 2;
      if (!quiet) SFX.good();
      redraw();
      var row = panel.querySelector('[data-ph="1"]');
      row.innerHTML = '<input class="at-input" type="text" inputmode="decimal" autocomplete="off" aria-label="Median"><span class="at-unit">' + esc(st.unit || "") + '</span><button type="button" class="at-btn is-red" data-c="go">' + esc(L("Submit", "提交")) + "</button>";
      fb.className = "at-fb is-good";
      fb.innerHTML = markup(st.q2 || L("Now drop down to the horizontal axis. What is the median?", "現在垂直向下讀到橫軸。中位數是多少？"));
      var input = row.querySelector("input");
      input.focus();
      var locked = false;
      function submit() {
        if (locked) return;
        var v = parseNum(input.value);
        if (v == null) { fb.className = "at-fb is-bad"; fb.textContent = T(NEED_NUM); return; }
        if (close(v, st.a, st.tol)) {
          locked = true; panelDraw = null;
          fb.className = "at-fb is-good";
          fb.textContent = T(L("Correct: about ", "正確：大約 ")) + fmt(st.a) + " " + T(st.unit || "") + (lang === "zh" ? "" : ".");
          SFX.good();
          setTimeout(function () { closePanel(); done(); }, 1000);
          return;
        }
        var msg = null;
        (st.wrongs || []).forEach(function (w) { if (!msg && near(v, w.v)) msg = w.m; });
        fb.className = "at-fb is-bad";
        fb.innerHTML = markup(msg || L("Read the value where the green line meets the horizontal axis. Each small square is " + s.xminor + ".", "讀出綠線與橫軸相交的數值。每一小格代表 " + s.xminor + "。"));
        if (penalty() === false) { locked = true; panelDraw = null; }
      }
      row.querySelector('[data-c="go"]').addEventListener("click", submit);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } e.stopPropagation(); });
    }
    panel.querySelector('[data-c="read"]').addEventListener("click", function () {
      if (phase !== 1) return;
      if (y === st.target) { readStep(false); return; }
      fb.className = "at-fb is-bad";
      fb.innerHTML = markup(y === 50 && st.m50 ? st.m50 : L("The line is at CF = " + y + ". The median is the *middle* item: read across at n ÷ 2, where n = " + st.n + ".",
        "藍線在累積頻數 = " + y + "。中位數是*中間*的那一項：要在 n ÷ 2 橫向讀數，而 n = " + st.n + "。"));
      penalty();
    });
    onReveal(function () {
      if (phase === 1) { y = st.target; readStep(true); }
      var input = $(".at-input", panel);
      if (!input) return;
      input.value = fmt(st.a);
      var go = panel.querySelector('[data-c="go"]');
      if (go) go.click();
    });
    if (resume) readStep(true);
  }

  /* ================================================================
   * Verdicts, case flow, menus
   * ================================================================ */

  /* Re-renders the visible menu (title, case files, results...) in the current language. */
  var menuDraw = null;
  function showMenu(draw) { menuDraw = draw; draw(); menu.hidden = false; }

  function verdictHtml(text, guilty, still) {
    return '<div class="at-scrim' + (guilty ? " is-red" : "") + '"' + (still ? ' style="animation:none"' : "") + '></div><p class="at-verdict' + (guilty ? " is-guilty" : "") + '">' +
      T(text).split("").map(function (c, i) {
        return '<span style="' + (still ? "animation:none" : "animation-delay:" + (i * 0.09) + "s") + '">' + (c === " " ? "&nbsp;" : esc(c)) + "</span>";
      }).join("") + "</p>";
  }

  function doVerdict(text, guilty, done) {
    dlg.hidden = true; closePanel();
    if (!guilty && R) showPlace("wide", null);
    menuDraw = null;
    menu.innerHTML = verdictHtml(text, guilty, false);
    menu.hidden = false;
    if (guilty) SFX.fail(); else { SFX.gavel(); setTimeout(SFX.fanfare, 700); }
    if (!done) return;
    var t = setTimeout(go, 2800);
    function go() { clearTimeout(t); menu.removeEventListener("click", go); menu.hidden = true; done(); }
    menu.addEventListener("click", go);
  }

  function hud(mode) {
    var playing = mode !== "menu";
    exitBtn.hidden = !playing;
    calcBtn.hidden = !playing;
    teachBtn.hidden = !playing;
    if (!playing) calcEl.hidden = true;
    calcBtn.classList.toggle("is-on", playing && !calcEl.hidden);
    patEl.hidden = !playing || mode === "rapid";
    chipEl.hidden = mode === "menu" || mode === "story";
    timerEl.hidden = mode !== "rapid";
  }

  function resetStage() {
    talk.token++; clearTimeout(talk.timer); talk.src = null;
    dlg.hidden = true;
    closePanel(); shoutEl.hidden = true;
    stopChallenge();
  }

  function startCase(kase) {
    resetStage();
    R = { kase: kase, frames: [{ steps: kase.steps, i: 0 }], pat: MAX_PAT, found: [], cp: { i: 0, place: "cut", found: [] }, place: "cut", halt: false };
    menu.hidden = true; menuDraw = null;
    hud("story");
    drawPips(R.pat, MAX_PAT);
    preload(Object.keys(PLACES).map(function (k) { return PLACES[k].bg; }).concat(["fg-bench", "fg-stand", "fg-judge"]));
    stage.focus();
    next();
  }

  function retryFromCheckpoint() {
    var cp = R.cp, kase = R.kase;
    resetStage();
    R = { kase: kase, frames: [{ steps: kase.steps, i: cp.i }], pat: MAX_PAT, found: (cp.found || []).slice(), cp: cp, place: cp.place, halt: false };
    menu.hidden = true; menuDraw = null;
    hud("story");
    drawPips(R.pat, MAX_PAT);
    if (cp.place === "court") showPlace("wide", null);
    else if (PLACES[cp.place]) showPlace(cp.place, null);
    next();
  }

  var GUILTY = L("GUILTY", "有罪");

  function gameOver() {
    dlg.hidden = true; closePanel();
    doVerdict(GUILTY, true, null);
    var run = R;
    setTimeout(function () {
      if (R !== run) return;
      showMenu(function () {
        menu.innerHTML = verdictHtml(GUILTY, true, true) +
          '<p class="at-menu-text">' + esc(L("The judge has run out of patience. Mei's shop is in danger!", "法官失去耐性了，Mei 的茶舖危在旦夕！")) + "</p>" +
          '<div class="at-menu-row"><button type="button" class="at-btn is-red" data-m="retry">' + esc(L("Try again from the last checkpoint", "從上一個存檔點重來")) + "</button>" +
          '<button type="button" class="at-btn is-ghost" data-m="cases">' + esc(L("Case files", "案件檔案")) + "</button></div>";
      });
    }, 1400);
  }

  function stars(p) { return p >= 5 ? 3 : p >= 3 ? 2 : 1; }
  function starText(n) { return "&#x2605;".repeat(n) + '<span style="opacity:.3">' + "&#x2605;".repeat(3 - n) + "</span>"; }

  function caseClear() {
    var kase = R.kase, got = stars(R.pat), pat = R.pat;
    save.cleared[kase.id] = Math.max(save.cleared[kase.id] || 0, got);
    store();
    R.halt = true;
    dlg.hidden = true;
    var nextCase = CASES.filter(function (c) { return c.id === kase.id + 1; })[0];
    hud("menu");
    showMenu(function () {
      menu.innerHTML = '<div class="at-menu-bg" style="background-image:url(' + art(kase.clearBg || "end-01-verdict") + ')"></div>' +
        '<p class="at-kicker">' + esc(L("Case " + kase.id + " cleared", "第 " + kase.id + " 章 完成")) + "</p>" +
        '<div class="at-logo" style="font-size:3.4cqw">' + esc(kase.title) + "</div>" +
        '<div class="at-big-stars">' + starText(got) + "</div>" +
        '<p class="at-menu-text">' + esc(L("Judge's patience left: " + pat + " / " + MAX_PAT + ". ", "法官剩餘耐性：" + pat + " / " + MAX_PAT + "。")) +
        esc(got < 3 ? L("Clear it with full patience for 3 stars.", "保持滿耐性過關可得 3 星。") : L("A flawless defence!", "完美的辯護！")) + "</p>" +
        '<div class="at-menu-row">' + (nextCase
          ? '<button type="button" class="at-btn is-red" data-m="case" data-id="' + nextCase.id + '">' + esc(L("Next: Case " + nextCase.id, "下一章：第 " + nextCase.id + " 章")) + " &#x25B6;</button>"
          : '<button type="button" class="at-btn is-gold" data-m="challenge">' + esc(L("Try Challenge Mode", "挑戰模式")) + "</button>") +
        '<button type="button" class="at-btn is-ghost" data-m="cases">' + esc(L("Case files", "案件檔案")) + "</button></div>";
    });
  }

  function unlocked(id) { return id === 1 || !!save.cleared[id - 1] || !!save.teacher; }

  var BACK = L("Back", "返回");
  function teacherLink() {
    return '<button type="button" class="at-link" data-m="teacher">' + esc(save.teacher
      ? L("Teacher mode is on. Click to turn it off.", "老師模式已開啟。再按一下關閉。")
      : L("Teacher mode: unlock every case and show answers", "老師模式：解鎖全部案件，並顯示答案")) + "</button>";
  }

  function showTitle() {
    resetStage(); R = null;
    hud("menu");
    showCut("title", "cool");
    showMenu(function () {
      menu.innerHTML = '<div class="at-menu-bg" style="background-image:url(' + art("title") + ')"></div>' +
        '<p class="at-kicker">' + esc(L("JM31 · Measures of Central Tendency", "JM31 · 集中趨勢的量度")) + "</p>" +
        '<div class="at-logo">OBJECTION!</div>' +
        '<p class="at-logo-sub">' + esc(L("The Average Trial", "平均數大審判")) + "</p>" +
        '<p class="at-menu-text">' + esc(L("A giant tea chain wants a tiny shop closed. Defend it with the mean, the median and the mode.", "連鎖茶飲巨企想趕走一間小茶舖。用平均數、中位數和眾數為它辯護！")) + "</p>" +
        '<div class="at-cards" style="--cols:2;max-width:36em">' +
        '<button type="button" class="at-btn at-card" data-m="cases"><b>' + esc(L("Story Mode", "故事模式")) + "</b><strong>" + esc(L("Four cases", "四個案件")) + "</strong><span>" + esc(L("Notes A–D, one case each", "筆記 A 至 D，每份一個案件")) + "</span></button>" +
        '<button type="button" class="at-btn at-card is-red" data-m="challenge"><b>' + esc(L("Challenge Mode", "挑戰模式")) + "</b><strong>" + esc(L("Three trials", "三種挑戰")) + "</strong><span>" + esc(L("Random every time · beat your best", "每次隨機出題 · 刷新最高分")) + "</span></button>" +
        "</div>" + teacherLink();
    });
  }

  function showCases() {
    resetStage(); R = null;
    hud("menu");
    showMenu(function () {
      menu.innerHTML = '<div class="at-menu-bg" style="background-image:url(' + art("bg-wide") + ')"></div>' +
        '<p class="at-kicker">' + esc(L("Story Mode", "故事模式")) + '</p><div class="at-logo" style="font-size:3.6cqw">' + esc(L("Case Files", "案件檔案")) + "</div>" +
        '<div class="at-cards" style="--cols:2">' + CASES.map(function (c) {
          var open = unlocked(c.id), st = save.cleared[c.id] || 0;
          var cover = open && c.cover ? ' style="--cover:url(' + art(c.cover) + ')"' : "";
          return '<button type="button" class="at-btn at-card' + (open ? "" : " is-locked") + (cover ? " has-cover" : "") + '" data-m="case" data-id="' + c.id + '"' + cover + (open ? "" : " disabled") + ">" +
            "<b>" + esc(L("Case " + c.id, "第 " + c.id + " 章")) + " &middot; " + esc(c.notes) + "</b><strong>" + (open ? esc(c.title) : "&#x1F512; " + esc(L("Locked", "未解鎖"))) + "</strong><span>" + esc(c.topic) + "</span>" +
            (st ? '<i class="at-stars" style="font-style:normal">' + starText(st) + "</i>" : "") + "</button>";
        }).join("") + "</div>" +
        '<div class="at-menu-row"><button type="button" class="at-btn is-ghost" data-m="title">&#x25C0; ' + esc(BACK) + "</button></div>" +
        teacherLink();
    });
  }

  function showChallenges() {
    resetStage(); R = null;
    hud("menu");
    var best = save.best, BEST = L("Best: ", "最高分：");
    showMenu(function () {
      menu.innerHTML = '<div class="at-menu-bg" style="background-image:url(' + art("challenge-bg") + ')"></div>' +
        '<p class="at-kicker">' + esc(L("Challenge Mode", "挑戰模式")) + '</p><div class="at-logo" style="font-size:3.6cqw">' + esc(L("Pick a Trial", "選擇挑戰")) + "</div>" +
        '<div class="at-cards" style="--cols:3">' +
        '<button type="button" class="at-btn at-card is-red" data-m="ch" data-id="rapid"><b>' + esc(L("2 minutes", "2 分鐘")) + "</b><strong>" + esc(CH_NAMES.rapid) + "</strong><span>" +
        esc(L("Mean, median, mode, weighted mean, missing data. Wrong = −" + RAPID_PENALTY + "s.", "平均數、中位數、眾數、加權平均數、遺失數據。答錯扣 " + RAPID_PENALTY + " 秒。")) + "</span><span>" + esc(BEST) + (best.rapid || 0) + "</span></button>" +
        '<button type="button" class="at-btn at-card" data-m="ch" data-id="fair"><b>' + esc(L("3 gavels", "3 次機會")) + "</b><strong>" + esc(CH_NAMES.fair) + "</strong><span>" +
        esc(L("Which average did they use? Is the claim misleading?", "他們用了哪個『平均』？這個說法是否誤導？")) + "</span><span>" + esc(BEST) + (best.fair || 0) + "</span></button>" +
        '<button type="button" class="at-btn at-card is-gold" data-m="ch" data-id="deduce"><b>' + esc(L("3 gavels", "3 次機會")) + "</b><strong>" + esc(CH_NAMES.deduce) + "</strong><span>" +
        esc(L("Rebuild blurred data from the mean, median and mode.", "用平均數、中位數和眾數還原模糊的數據。")) + "</span><span>" + esc(BEST) + (best.deduce || 0) + "</span></button>" +
        "</div>" +
        '<div class="at-menu-row"><button type="button" class="at-btn is-ghost" data-m="title">&#x25C0; ' + esc(BACK) + "</button></div>";
    });
  }

  function confirmExit() {
    var inStory = !!R;
    var wasHidden = menu.hidden, old = menu.innerHTML, oldDraw = menuDraw;
    showMenu(function () {
      menu.innerHTML = '<p class="at-menu-text" style="font-size:1.3em">' +
        esc(inStory ? L("Leave this case? Progress since the start of the case is lost.", "要離開這個案件嗎？本案的進度將會遺失。") : L("Stop this challenge?", "要停止這個挑戰嗎？")) + "</p>" +
        '<div class="at-menu-row"><button type="button" class="at-btn is-red" data-m="' + (inStory ? "cases" : "challenge") + '">' + esc(L("Leave", "離開")) + "</button>" +
        '<button type="button" class="at-btn is-ghost" data-m="stay">' + esc(L("Keep playing", "繼續玩")) + "</button></div>";
    });
    menu._restore = function () {
      menuDraw = oldDraw;
      if (wasHidden) { menu.hidden = true; return; }
      if (oldDraw) oldDraw(); else menu.innerHTML = old;
    };
    if (C && C.timer) { C.paused = true; }
  }

  function redrawOpenPanel() {
    if (panel.hidden || !panelDraw) return;
    var typed = [].map.call(panel.querySelectorAll("input"), function (i) { return i.value; });
    panelDraw();
    var now = panel.querySelectorAll("input");
    if (now.length === typed.length) [].forEach.call(now, function (inp, i) { inp.value = typed[i]; });
  }

  function setLang(l) {
    lang = l; save.lang = l; store();
    updateLangUi();
    if (pips && !patEl.hidden) drawPips(pips[0], pips[1], pips[2]);
    if (C && !chipEl.hidden) setScore(C.score);
    if (view.who) chrPh.textContent = T(CAST[view.who].name);
    if (!menu.hidden && menuDraw) menuDraw();
    redrawOpenPanel();
    retypeLine();
  }

  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-m]");
    if (!b) return;
    var m = b.getAttribute("data-m");
    SFX.page();
    if (m === "cases") showCases();
    else if (m === "title") showTitle();
    else if (m === "challenge") showChallenges();
    else if (m === "case") { var id = Number(b.getAttribute("data-id")); var k = CASES.filter(function (c) { return c.id === id; })[0]; if (k && unlocked(id)) startCase(k); }
    else if (m === "retry") retryFromCheckpoint();
    else if (m === "teacher") { save.teacher = !save.teacher; store(); updateTeach(); if (menuDraw) menuDraw(); }
    else if (m === "ch") startChallenge(b.getAttribute("data-id"));
    else if (m === "stay") { if (menu._restore) menu._restore(); if (C) C.paused = false; }
    else if (m === "again") startChallenge(C ? C.kind : "rapid");
  });

  stage.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "mute") { save.muted = !save.muted; store(); updateMute(); }
    else if (a === "calc") { calcEl.hidden = !calcEl.hidden; calcBtn.classList.toggle("is-on", !calcEl.hidden); if (!calcEl.hidden) calcEl.focus(); SFX.page(); }
    else if (a === "teach") { save.teacher = !save.teacher; store(); updateTeach(); SFX.page(); redrawOpenPanel(); }
    else if (a === "lang") setLang(lang === "zh" ? "en" : "zh");
    else if (a === "full") {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    } else if (a === "exit") confirmExit();
  });

  stage.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest(".at-calc")) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
    if ((e.key === " " || e.key === "Enter") && !dlg.hidden && panel.hidden && menu.hidden) { e.preventDefault(); advance(); }
  });

  /* Pocket calculator. The expression is checked before it is evaluated, same idea as the Percentages calculator. */
  (function () {
    var exprEl = $(".at-calc-expr"), resEl = $(".at-calc-res");
    var expr = "", lastWasEq = false;
    function formatNum(n) {
      if (!isFinite(n)) return "ERR";
      var r = Math.round(n * 1e8) / 1e8;
      if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
      return String(parseFloat(r.toFixed(6)));
    }
    function evalExpr(raw) {
      var s = raw.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      if (!/^[\d+\-*/().\s]+$/.test(s)) return NaN;
      try {
        var v = Function('"use strict"; return (' + s + ")")();
        return typeof v === "number" ? v : NaN;
      } catch (err) { return NaN; }
    }
    function preview() {
      if (!expr) { resEl.textContent = "0"; resEl.classList.remove("is-err"); return; }
      var v = evalExpr(expr);
      if (isFinite(v)) { resEl.textContent = "= " + formatNum(v); resEl.classList.remove("is-err"); }
      else { resEl.textContent = expr.charAt(expr.length - 1) === "=" ? "ERR" : "…"; resEl.classList.toggle("is-err", expr.charAt(expr.length - 1) === "="); }
    }
    function append(tok) {
      if (lastWasEq && /[\d.]/.test(tok)) { expr = ""; lastWasEq = false; }
      if (lastWasEq && /[+\-×÷*/(]/.test(tok)) { expr = resEl.textContent.replace(/^=\s*/, ""); lastWasEq = false; }
      expr += tok;
      exprEl.textContent = expr;
      preview();
    }
    function backspace() { expr = expr.slice(0, -1); lastWasEq = false; exprEl.textContent = expr; preview(); }
    function clearAll() { expr = ""; lastWasEq = false; exprEl.textContent = ""; resEl.textContent = "0"; resEl.classList.remove("is-err"); }
    function equals() {
      var v = evalExpr(expr);
      if (!isFinite(v)) { resEl.textContent = "ERR"; resEl.classList.add("is-err"); expr += "="; exprEl.textContent = expr; return; }
      var out = formatNum(v);
      resEl.textContent = "= " + out;
      resEl.classList.remove("is-err");
      expr = out; lastWasEq = true; exprEl.textContent = expr;
    }
    function percent() {
      var m = expr.match(/(\d+\.?\d*)$/);
      if (m) expr = expr.slice(0, -m[0].length) + "(" + m[0] + "/100)";
      else if (!expr || /[+\-×÷*(]$/.test(expr)) expr += "(0/100)";
      else expr = "(" + expr + ")/100";
      lastWasEq = false;
      exprEl.textContent = expr;
      preview();
    }
    function press(k) {
      SFX.blip(640);
      if (k === "C") clearAll();
      else if (k === "BK") backspace();
      else if (k === "%") percent();
      else if (k === "=") equals();
      else if (k === "(" || k === ")") append(k);
      else if (k === "*") append("×");
      else if (k === "/") append("÷");
      else if (k === "-") append("−");
      else append(k);
    }
    calcEl.addEventListener("click", function (e) {
      e.stopPropagation();
      var b = e.target.closest("button");
      if (!b) return;
      if (b.getAttribute("data-calc") === "close") { calcEl.hidden = true; calcBtn.classList.remove("is-on"); return; }
      if (b.hasAttribute("data-k")) press(b.getAttribute("data-k"));
    });
    calcEl.addEventListener("keydown", function (e) {
      e.stopPropagation();
      var map = { "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", ".": ".", "+": "+", "-": "-", "*": "*", "/": "/", "%": "%", "(": "(", ")": ")" };
      if (e.key === "Enter") { e.preventDefault(); equals(); }
      else if (e.key === "Backspace") { e.preventDefault(); backspace(); }
      else if (e.key === "Escape") { e.preventDefault(); calcEl.hidden = true; calcBtn.classList.remove("is-on"); }
      else if (map[e.key]) { e.preventDefault(); press(map[e.key]); }
    });
  })();

  /* ================================================================
   * Challenge mode
   * ================================================================ */

  var C = null;

  function stopChallenge() {
    if (C && C.timer) clearInterval(C.timer);
    C = null;
    timerEl.hidden = true;
  }

  var CH_NAMES = { rapid: L("Rapid Objection", "快速異議"), fair: L("Fair or Rigged?", "公平還是誤導？"), deduce: L("Deduction Board", "推理板") };
  var GAVELS = L("Gavels", "機會");

  function startChallenge(kind) {
    resetStage(); R = null;
    menu.hidden = true; menuDraw = null;
    C = { kind: kind, score: 0, lives: 3, paused: false };
    hud(kind === "rapid" ? "rapid" : "lives");
    showCut("challenge-bg", "red");
    setScore(0);
    if (kind === "rapid") {
      C.time = RAPID_TIME;
      C.last = Date.now();
      C.timer = setInterval(rapidTick, 100);
      showSprite("max", "smug", true);
      rapidNext();
    } else {
      drawPips(3, 3, GAVELS);
      if (kind === "fair") fairNext(); else deduceNext();
    }
    stage.focus();
  }

  function setScore(n) { C.score = n; chipEl.textContent = T(L("Score ", "分數 ")) + n; }

  function popup(text, good) {
    var p = el("div", "at-plus " + (good ? "is-good" : "is-bad"), esc(text));
    stage.appendChild(p);
    setTimeout(function () { p.remove(); }, 1000);
  }

  function finishChallenge() {
    if (!C || C.over) return;
    C.over = true;
    var kind = C.kind, score = C.score;
    if (C.timer) clearInterval(C.timer);
    var isBest = !save.teacher && score > (save.best[kind] || 0);
    if (isBest) { save.best[kind] = score; store(); }
    closePanel();
    hud("menu");
    showMenu(function () {
      menu.innerHTML = '<div class="at-menu-bg" style="background-image:url(' + art("challenge-bg") + ')"></div>' +
        '<p class="at-kicker">' + esc(CH_NAMES[kind]) + "</p>" +
        '<div class="at-logo" style="font-size:4.4cqw">' + esc(L("Score ", "分數 ")) + score + "</div>" +
        '<p class="at-menu-text">' + esc(isBest ? L("New personal best!", "刷新個人最高分！") : L("Best: " + (save.best[kind] || 0), "最高分：" + (save.best[kind] || 0))) + "</p>" +
        '<div class="at-menu-row"><button type="button" class="at-btn is-red" data-m="again">' + esc(L("Play again", "再玩一次")) + "</button>" +
        '<button type="button" class="at-btn is-ghost" data-m="challenge">' + esc(L("Challenge menu", "挑戰選單")) + "</button></div>";
    });
    timerEl.hidden = true;
    SFX.fanfare();
    C.timer = null;
  }

  function loseLife() {
    C.lives -= 1;
    drawPips(C.lives, 3, GAVELS);
    loseMark(C.lives);
    SFX.bad(); flash(true); shake();
    if (C.lives <= 0) { setTimeout(finishChallenge, 900); return false; }
    return true;
  }

  /* ---------- Rapid Objection ---------- */

  function rapidTick() {
    if (!C || C.paused) { if (C) C.last = Date.now(); return; }
    var now = Date.now();
    C.time -= (now - C.last) / 1000;
    C.last = now;
    var f = Math.max(0, C.time / RAPID_TIME);
    timerEl.firstChild.style.transform = "scaleX(" + f + ")";
    timerEl.classList.toggle("is-low", C.time < 20);
    if (C.time <= 0) { C.time = 0; finishChallenge(); }
  }

  function chipsHtml(arr) { return '<div class="at-ev"><div class="at-chips">' + arr.map(function (v) { return '<span class="at-chip">' + v + "</span>"; }).join("") + "</div></div>"; }
  function tableHtml(head, rows) { return function () { return renderEv({ type: "table", head: head, rows: rows }); }; }
  function nice(v) { return Math.abs(round(v, 2) - v) < 1e-9; }
  function W(v, en, zh) { return { v: v, m: L(en, zh) }; }

  var VALUE = L("Value", "數值"), FREQ = L("Frequency", "頻數");
  var STATS = { mean: L("mean", "平均數"), median: L("median", "中位數"), mode: L("mode", "眾數") };

  var RAPID = [
    function () {
      var n, a;
      do { n = ri(5, 8); a = []; for (var i = 0; i < n; i++) a.push(ri(2, 40)); } while (!nice(sum(a) / n));
      return { q: L("Find the [mean] of these data.", "求這些數據的[平均數]。"), ev: chipsHtml(a), a: sum(a) / n, dp: true,
        wrongs: [W(sum(a), "That's the total. Divide by n = " + n + ".", "這是總和。要除以 n = " + n + "。"), W(sum(a) / (n - 1), "Count again: there are " + n + " data.", "再數一數：一共有 " + n + " 個數據。")] };
    },
    function () {
      var n = ri(6, 9), a = [];
      for (var i = 0; i < n; i++) a.push(ri(1, 50));
      var s = sorted(a), md = median(a);
      var w = [], EVEN = ["With an even n, take the mean of the two middle values.", "n 是雙數時，要取中間兩個值的平均數。"];
      var raw = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
      if (raw !== md) w.push(W(raw, "Sort the data first, then find the middle.", "先把數據排序，再找中間的值。"));
      if (n % 2 === 0) { if (s[n / 2] !== md) w.push(W(s[n / 2], EVEN[0], EVEN[1])); if (s[n / 2 - 1] !== md) w.push(W(s[n / 2 - 1], EVEN[0], EVEN[1])); }
      if ((n + 1) / 2 !== md) w.push(W((n + 1) / 2, "(n + 1) ÷ 2 is the position of the median, not its value.", "(n + 1) ÷ 2 是中位數的位置，不是它的數值。"));
      return { q: L("Find the [median] of these data.", "求這些數據的[中位數]。"), ev: chipsHtml(a), a: md, wrongs: w };
    },
    function () {
      var m = ri(3, 30), a = [m, m, m], used = {}; used[m] = 1;
      var k = ri(4, 6);
      while (k > 0) { var v = ri(1, 35); if (!used[v]) { used[v] = 1; a.push(v); if (k % 2 === 0 && ri(0, 1)) { a.push(v); } k--; } }
      a = shuffle(a);
      var ms = modes(a);
      if (ms.length !== 1) return RAPID[2]();
      return { q: L("Find the [mode] of these data.", "求這些數據的[眾數]。"), ev: chipsHtml(a), a: ms[0],
        wrongs: [W(3, "3 is how many times the mode appears. The mode is the value itself.", "3 是眾數出現的次數。眾數是那個數值本身。"), W(Math.max.apply(null, a), "That's the largest value, not the most frequent one.", "這是最大的數值，不是出現次數最多的。")] };
    },
    function () {
      var x0 = ri(0, 3), xs = [x0, x0 + 1, x0 + 2, x0 + 3, x0 + 4], f, fx, n;
      do { f = xs.map(function () { return ri(1, 9); }); n = sum(f); fx = sum(xs.map(function (x, i) { return x * f[i]; })); } while (!nice(fx / n));
      return { q: L("Find the [mean] from the frequency table.", "根據頻數表求[平均數]。"), ev: tableHtml([VALUE].concat(xs), [[FREQ].concat(f)]), a: fx / n, dp: true,
        wrongs: [W(mean(xs), "You ignored the frequencies. Mean = Σfx ÷ Σf.", "你忽略了頻數。平均數 = Σfx ÷ Σf。"), W(fx, "That's Σfx. Divide by the total frequency Σf = " + n + ".", "這是 Σfx。要除以總頻數 Σf = " + n + "。"),
          W(fx / 5, "Divide by the total frequency (" + n + "), not by the number of columns.", "要除以總頻數（" + n + "），不是除以欄數。")] };
    },
    function () {
      var x0 = ri(0, 4), xs = [x0, x0 + 1, x0 + 2, x0 + 3, x0 + 4], f = xs.map(function () { return ri(2, 12); });
      var data = [];
      xs.forEach(function (x, i) { for (var k = 0; k < f[i]; k++) data.push(x); });
      var md = median(data), w = [];
      if (xs[2] !== md) w.push(W(xs[2], "That's the middle column. Count the data: the median is the middle item of all " + data.length + ".", "這是中間的一欄。要數數據：中位數是全部 " + data.length + " 個數據中間的那一個。"));
      var big = xs[f.indexOf(Math.max.apply(null, f))];
      if (big !== md) w.push(W(big, "That's the mode (highest frequency), not the median.", "這是眾數（頻數最高），不是中位數。"));
      return { q: L("Find the [median] from the frequency table.", "根據頻數表求[中位數]。"), ev: tableHtml([VALUE].concat(xs), [[FREQ].concat(f)]), a: md, wrongs: w };
    },
    function () {
      var n = ri(4, 7), m = ri(10, 40), a, last;
      do { a = []; for (var i = 0; i < n - 1; i++) a.push(m + ri(-8, 8)); last = n * m - sum(a); } while (last < 1 || last > 99);
      return { q: L("The mean of " + n + " numbers is [" + m + "]. " + (n - 1) + " of them are shown. Find the missing number.", n + " 個數的平均數是 [" + m + "]，下面列出了其中 " + (n - 1) + " 個。求不見了的那個數。"),
        ev: chipsHtml(a.concat(["?"])), a: last,
        wrongs: [W(n * m, "That's the total of all " + n + " numbers. Subtract the ones you know.", "這是全部 " + n + " 個數的總和。要減去已知的數。"), W(sum(a), "That's the sum of the known numbers. The total should be " + n + " × " + m + ".", "這是已知數的和。總和應該是 " + n + " × " + m + "。")] };
    },
    function () {
      var key = pick(["mean", "median", "mode"]), stat = STATS[key], base = ri(8, 40), k = pick([2, 3, 4, 5, 0.5]), c = pick([-6, -5, -3, 2, 3, 4, 5, 7, 10]);
      var csEn = c < 0 ? "subtract " + (-c) : "add " + c, csZh = c < 0 ? "減去 " + (-c) : "加上 " + c, sign = c < 0 ? "− " + (-c) : "+ " + c;
      return { q: L("A data set has " + stat.en + " [" + base + "]. Each datum is multiplied by " + k + ", then you " + csEn + ". Find the new " + stat.en + ".",
        "一組數據的" + stat.zh + "是 [" + base + "]。每個數據先乘以 " + k + "，再" + csZh + "。求新的" + stat.zh + "。"), ev: "", a: k * base + c,
        wrongs: [W(k * base, "You multiplied but forgot to " + csEn + ".", "你乘了，但忘了" + csZh + "。"), W(base + c, "You forgot to multiply by " + k + ".", "你忘了乘以 " + k + "。"),
          W(k * (base + c), "Multiply first, then add: " + k + " × " + base + " " + sign + ".", "先乘後加：" + k + " × " + base + " " + sign + "。"), W(base, "Every average changes in the same way as the data.", "每個『平均』都會跟數據以同樣方式改變。")] };
    },
    function () {
      var n = ri(3, 4), marks = [], ws, wsum;
      for (var i = 0; i < n; i++) marks.push(ri(40, 95));
      do { ws = marks.map(function () { return ri(1, 8) * 5; }); wsum = sum(ws); } while (wsum !== 100);
      var a = sum(marks.map(function (m, i) { return m * ws[i]; })) / 100;
      var labels = [L("Test", "測驗"), L("Exam", "考試"), L("Project", "專題"), L("Homework", "功課")].slice(0, n);
      return { q: L("Find the [weighted mean] mark.", "求分數的[加權平均數]。"), dp: true,
        ev: tableHtml([""].concat(labels), [[L("Mark", "分數")].concat(marks), [L("Weight", "權重")].concat(ws.map(function (w) { return w + "%"; }))]), a: a,
        wrongs: [W(mean(marks), "That's the ordinary mean. Multiply each mark by its weight first.", "這是普通的平均數。要先把每個分數乘以它的權重。"), W(a * 100, "Divide by the total weight, 100%.", "要除以權重的總和 100%。")] };
    },
  ];

  function rapidNext() {
    if (!C || C.over) return;
    var q = pick(RAPID)();
    q.title = CH_NAMES.rapid;
    if (q.dp) q.q = L(q.q.en + " (2 d.p. if needed)", q.q.zh + "（如有需要，準確至兩位小數）");
    calcPanel(q, {
      evHtml: q.ev,
      onRight: function () {
        setScore(C.score + 1);
        popup("+1", true);
        showSprite("max", "shock", true);
        setTimeout(rapidNext, 450);
      },
      onWrong: function () {
        C.time -= RAPID_PENALTY;
        popup("-" + RAPID_PENALTY + "s", false);
        SFX.bad(); shake();
        showSprite("max", "smug", true);
        var fb = $(".at-fb", panel);
        fb.innerHTML += "<br>" + esc(L("Answer: ", "答案：")) + fmt(q.a);
        setTimeout(function () { if (C && C.time > 0) rapidNext(); }, 1700);
        return false;
      },
    });
  }

  /* ---------- Fair or Rigged? ---------- */

  var SPEAKERS = ["max", "victor", "doris", "felix", "grant"];

  /* ctx: [what the data are, unit, the claim's opening words] */
  var FAIR = [
    function () {
      var base = ri(10, 25), n = ri(6, 8), a = [];
      for (var i = 0; i < n; i++) a.push(base + ri(-3, 4));
      var out = base * ri(5, 9);
      a.push(out);
      var ctx = pick([
        [L("monthly salaries", "月薪"), L("($1000s)", "（$1000）"), L("The average salary here is", "這裏的平均薪金是")],
        [L("daily waiting times", "每日輪候時間"), L("(min)", "（分鐘）"), L("The average wait is", "平均輪候時間是")],
        [L("house prices on the street", "這條街的樓價"), L("($100k)", "（$10 萬）"), L("The average house price is", "平均樓價是")],
      ]);
      var useMean = Math.random() < 0.6;
      var mn = mean(a), md = median(a);
      if (!useMean && modes(a).indexOf(md) >= 0) return FAIR[0]();
      return { a: shuffle(a), ctx: ctx, used: useMean ? 0 : 1, value: useMean ? mn : md, fair: !useMean,
        why: useMean ? L("The extreme value " + out + " drags the mean up to " + fmt(mn) + ". Most data sit near the median, " + fmt(md) + ".", "極端值 " + out + " 把平均數拉高到 " + fmt(mn) + "。大部分數據都接近中位數 " + fmt(md) + "。")
          : L("The median ignores the extreme value " + out + ", so it shows a typical value well.", "中位數不受極端值 " + out + " 影響，所以能好好反映一般的數值。") };
    },
    function () {
      var low = ri(2, 4) * 10, a = [low, low, low];
      var k = ri(4, 5), v = low + ri(1, 2) * 5;
      for (var i = 0; i < k; i++) { v += ri(2, 6) * 5; a.push(v); }
      var useMode = Math.random() < 0.6;
      var md = median(a);
      if (md === low || mean(a) === md) return FAIR[1]();
      return { a: shuffle(a), ctx: [L("prices on the menu", "餐牌上的價錢"), L("($)", "（$）"), L("Our average price is only", "我們的平均價錢只是")], used: useMode ? 2 : 1, value: useMode ? low : md, fair: !useMode,
        why: useMode ? L("The mode " + low + " is the *lowest* price, repeated. Most items cost much more: the median is " + fmt(md) + ".", "眾數 " + low + " 是重複出現的*最低*價錢。大部分貨品貴得多：中位數是 " + fmt(md) + "。")
          : L("The median " + fmt(md) + " sits in the middle of the prices, so it is a fair typical value.", "中位數 " + fmt(md) + " 位於價錢的中間，是公平的一般數值。") };
    },
    function () {
      var base = ri(20, 40), a = [base - 3, base - 2, base - 1, base, base + 1, base + 2, base + 3];
      a.push(base + pick([-1, 1]));
      var mn = mean(a), md = median(a);
      if (mn === md) return FAIR[2]();
      return { a: shuffle(a), ctx: pick([[L("test marks", "測驗分數"), "", L("The average mark is", "平均分是")], [L("heights of plants", "植物高度"), L("(cm)", "（cm）"), L("The average height is", "平均高度是")]]), used: 0, value: mn, fair: true,
        why: L("No extreme values: the mean (" + fmt(mn) + ") and median (" + fmt(md) + ") are close, so the mean is a fair average.", "沒有極端值：平均數（" + fmt(mn) + "）和中位數（" + fmt(md) + "）很接近，所以平均數是公平的『平均』。") };
    },
  ];

  function fairNext() {
    if (!C || C.over) return;
    var it = pick(FAIR)();
    var who = pick(SPEAKERS), nm = CAST[who].name, v = fmt(it.value);
    showSprite(who, "smug", true);
    var claim = L(nm.en + ': "' + it.ctx[2].en + " " + v + '!"', nm.zh + "：「" + it.ctx[2].zh + " " + v + "！」");
    function ev() {
      return '<div class="at-ev"><p>' + esc(it.ctx[0]) + " " + esc(it.ctx[1]) + '</p><div class="at-chips">' + it.a.map(function (x) { return '<span class="at-chip">' + x + "</span>"; }).join("") + "</div></div>";
    }
    var used = [STATS.mean, STATS.median, STATS.mode][it.used], ms = modes(it.a).join(", ");
    choicePanel({ title: L("Fair or Rigged? · Step 1", "公平還是誤導？· 第 1 步"), q: L("[" + claim.en + "] Which average did they use?", "[" + claim.zh + "] 他們用了哪一個『平均』？"),
      options: [L("Mean", "平均數"), L("Median", "中位數"), L("Mode", "眾數")], a: it.used,
      explain: L("Yes, " + v + " is the " + used.en + ".", "對，" + v + " 是" + used.zh + "。"),
      why: [L("The mean is " + fmt(mean(it.a)) + ".", "平均數是 " + fmt(mean(it.a)) + "。"), L("The median is " + fmt(median(it.a)) + ".", "中位數是 " + fmt(median(it.a)) + "。"),
        ms ? L("The mode is " + ms + ".", "眾數是 " + ms + "。") : L("There is no mode (no value repeats).", "沒有眾數（沒有數值重複）。")] }, {
      evHtml: ev,
      onWrong: function () { return loseLife(); },
      onRight: function () {
        choicePanel({ title: L("Fair or Rigged? · Step 2", "公平還是誤導？· 第 2 步"), q: L("[" + claim.en + "] Does " + v + " fairly represent the data?", "[" + claim.zh + "] " + v + " 能公平地代表這些數據嗎？"),
          options: [L("Fair — it shows a typical value", "公平 —— 它反映了一般的數值"), L("Rigged — it is misleading", "誤導 —— 這個說法有誤導成分")], a: it.fair ? 0 : 1,
          explain: it.why, why: [it.why, it.why] }, {
          evHtml: ev,
          onWrong: function () { return loseLife(); },
          onRight: function () { setScore(C.score + 1); popup("+1", true); fairNext(); },
        });
      },
    });
  }

  /* ---------- Deduction Board ---------- */

  function genDeduce() {
    for (var tries = 0; tries < 400; tries++) {
      var n = ri(5, 7), a = [];
      for (var i = 0; i < n; i++) a.push(ri(2, 30));
      a = sorted(a);
      var d = ri(0, n - 2); a[d + 1] = a[d];
      a = sorted(a);
      if (!nice(mean(a) * 1)) continue;
      if (Math.abs(round(mean(a), 1) - mean(a)) > 1e-9) continue;
      var hide = shuffle(a.map(function (v, k) { return k; })).slice(0, 2).sort(function (x, y) { return x - y; });
      var clues = shuffle(["mean", "median", "mode"]).slice(0, 2);
      if (clues.indexOf("mode") >= 0 && modes(a).length !== 1) continue;
      var st = { data: a.map(function (v, k) { return hide.indexOf(k) === 0 ? "p" : hide.indexOf(k) === 1 ? "q" : v; }), vars: ["p", "q"], order: "asc" };
      clues.forEach(function (c) { st[c] = c === "mean" ? mean(a) : c === "median" ? median(a) : modes(a)[0]; });
      var sols = 0;
      for (var p = 0; p <= 40 && sols < 2; p++) for (var q = 0; q <= 40 && sols < 2; q++) if (!deduceCheck(st, { p: p, q: q })) sols++;
      if (sols === 1) return st;
    }
    return { data: [2, 3, 4, "p", 5, "q"], vars: ["p", "q"], order: "asc", mean: 4.5, mode: 4 };
  }

  function deduceNext() {
    if (!C || C.over) return;
    var st = genDeduce();
    st.title = CH_NAMES.deduce;
    st.q = L("Two entries of this ledger are blurred. Use the pencil note to rebuild them.", "賬簿上有兩項模糊了。用鉛筆註記把它們還原。");
    showSprite("felix", "smug", true);
    deducePanel(st, {
      onWrong: function () { showSprite("felix", "smug", true); return loseLife(); },
      onRight: function () { setScore(C.score + 1); popup("+1", true); showSprite("felix", "sweat", true); setTimeout(deduceNext, 900); },
    });
  }

  /* ================================================================
   * Boot
   * ================================================================ */

  showTitle();

  window.AverageTrial = { startCase: function (id) { var k = CASES.filter(function (c) { return c.id === id; })[0]; if (k) startCase(k); }, showTitle: showTitle };
})();
