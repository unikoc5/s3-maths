/* JM34 Game 1 — Blackout Voyage (cockpit edition).
 * No calculators: fly the airship with exact trigonometry. Every wrong answer costs 1000 ft;
 * at zero the ship hits the sea and the chapter restarts.
 * Questions, figures and story live in blackout-voyage-data.js — this file is the cockpit UI and flow.
 *
 * Cockpit geometry is drawn in a 1600 × 900 viewBox; every HTML zone below is positioned in % of
 * that box (see blackout-voyage.css), so the screens can never drift off the drawn bezels.
 */
(function () {
  "use strict";

  var root = document.getElementById("bv-stage");
  var D = window.BV_DATA;
  if (!root || !D) return;

  var ART = "game/";
  var V = "?v=20261119-ansgate";
  var SAVE_KEY = "jm34-bv-save-v1";
  var MUTE_KEY = "jm34-bv-muted";
  var LANG_KEY = "jm34-bv-lang";
  var MAX_ALT = 5;
  var CLIMB_STREAK = 3;
  /* Show-answer is for local testing only — hidden on github.io / Platform embeds. */
  function allowAnswerReveal() {
    try {
      var h = (location.hostname || "").toLowerCase();
      return location.protocol === "file:" || h === "localhost" || h === "127.0.0.1";
    } catch (e) { return false; }
  }
  var ALLOW_ANS = allowAnswerReveal();

  var L = D.L, CHAPTERS = D.CHAPTERS, NAMES = D.NAMES, FACES = D.FACES, rad = D.rad;
  var OPENING = D.OPENING, CH_INTRO = D.CH_INTRO, ENDING = D.ENDING;

  var lang = (function () {
    try { var l = localStorage.getItem(LANG_KEY); if (l === "zh" || l === "en") return l; } catch (e) {}
    return "en";
  })();
  function T(x) {
    if (x == null) return x;
    if (typeof x === "object" && ("en" in x || "zh" in x)) return x[lang] != null ? x[lang] : (x.en || x.zh || "");
    return x;
  }
  function both(ck) {
    return { en: ck && ck.en != null ? ck.en : ck, zh: ck && ck.zh != null ? ck.zh : ck };
  }

  var UI = {
    soundOn: L("Sound on", "音效開"),
    soundOff: L("Sound off", "音效關"),
    fullscreen: L("Fullscreen", "全螢幕"),
    menu: L("Menu", "選單"),
    skip: L("Skip story", "跳過劇情"),
    skipShort: L("SKIP", "跳"),
    langSwitch: L("中文", "English"),
    chKicker: function (ci, k, n) { return L("CH " + (ci + 1) + " · " + (k + 1) + "/" + n, "第 " + (ci + 1) + " 章 · " + (k + 1) + "/" + n); },
    check: L("CHECK", "核對"),
    next: L("NEXT ▸", "下一題 ▸"),
    finish: L("FINISH ▸", "完成 ▸"),
    cineNext: L("Click ▸", "按一下 ▸"),
    exactPh: L("exact value", "精確值"),
    climb: L("CLIMB ×3", "連對×3"),
    alt: L("ALT", "高度"),
    climbGain: L("Altitude +1000 ft!", "高度 +1000 呎！"),
    sextant: L("SEXTANT NOTCH", "六分儀刻線"),
    equalTo: L("EQUAL TO?", "相等於？"),
    optionalRewrite: L("Optional: tap a dashed term to rewrite it.", "可選：點虛線項目改寫。"),
    optionalPairs: L("Optional: pair cards that add to 90°. You can type the total any time.", "可選：把和為 90° 的卡配對。也可直接輸入總和。"),
    opposite: L("\\text{opposite}", "\\text{對邊}"),
    adjacent: L("\\text{adjacent}", "\\text{鄰邊}"),
    hypotenuse: L("\\text{hypotenuse}", "\\text{斜邊}"),
    findThirdSide: L("Find the third side.", "求第三邊。"),
    nowRatios: L("Now find the ratios.", "再求各比率。"),
    provedPartB: L("Proved — now part (b).", "證畢——做 (b)。"),
    rewritten: L("Rewritten — type the answer.", "已改寫——輸入答案。"),
    pickLine: L("Pick the correct next line on the chart screen.", "在左邊熒幕選出正確的下一行。"),
    pickNotch: L("Set the sextant on the chart screen.", "在左邊熒幕設定六分儀刻線。"),
    placeSides: L("Tap a number, then tap its side on the triangle.", "先點數字，再點三角形上對應的邊。"),
    spotLine: L("Tap the first wrong line on the chart screen.", "在左邊熒幕點出第一行錯誤。"),
    practiceNoAlt: L("Practice question — no altitude lost. ", "練習題——不扣高度。"),
    outOfAlt: L("Out of altitude! ", "高度歸零！"),
    minusAlt: L("−1000 ft. ", "−1000 呎。"),
    cantRead: L("Can't read that. Use digits, √, /, + and brackets.", "無法辨識。請用數字、√、/、+ 及括號。"),
    roundedDec: L("Rounded decimal — give the exact value (use √).", "用小數近似了——請給精確值（用 √）。"),
    rationalize: L("Right value — rationalize: no √ underneath.", "數值正確——請有理化：分母不能有 √。"),
    hitBolt: L("Lightning strike!", "雷擊！"),
    hitIce: L("Clipped an ice cliff!", "擦過冰崖！"),
    hitTurb: L("Turbulence — lost altitude!", "氣流不穩——掉高度！"),
    sinking: L("Altitude zero — going down…", "高度歸零——正在下墜……"),
    altZero: L("Altitude zero", "高度歸零"),
    intoSea: L("Into the sea", "墜海"),
    crashSub: function (ck) { var c = both(ck); return L("Too many wrong answers. Try " + c.en + " again — you start with full altitude.", "錯誤太多。再試「" + c.zh + "」——由滿高度重新開始。"); },
    retryCh: function (ck) { var c = both(ck); return L("Retry " + c.en, "重試「" + c.zh + "」"); },
    takeOff: L("Take off ▸", "起飛 ▸"),
    chComplete: function (ck) { var c = both(ck); return L(c.en + " complete", c.zh + " 完成"); },
    voyageComplete: L("Voyage complete", "航程完成"),
    retryStars: function (s) { return L("Retry for " + s, "重試爭取 " + s); },
    perfectFlight: L("Perfect flight — no wrong answers", "完美飛行——無錯誤"),
    altLeft: function (ft, extra) {
      var x = both(extra || "");
      return L("Altitude left: " + ft + " ft." + x.en, "剩餘高度：" + ft + " 呎。" + x.zh);
    },
    allCleared: function (tot) { return L(" All four chapters cleared — " + tot + " / 12 stars in total.", " 四章全通關——共 " + tot + " / 12 粒星。"); },
    best: function (s) { return L("Best: " + s, "最佳：" + s); },
    chapArrow: function (ck) { var c = both(ck); return L(c.en + " ▸", c.zh + " ▸"); },
    continueCh: function (ck) { var c = both(ck); return L("Continue — " + c.en, "繼續——" + c.zh); },
    lineN: function (n) { return L("LINE " + n, "第 " + n + " 行"); },
    claim: L("Claim", "聲稱"),
    titleEyebrow: L("JM34 · Trigonometric relations", "JM34 · 三角學關係"),
    titleName: L("Blackout Voyage", "斷電航程"),
    titleSub: L("A solar storm has knocked out every calculator on board. Fly the airship with exact values only — each wrong answer costs 1000 ft. Hit the sea and the chapter restarts.", "太陽風暴令船上所有電子計算機失效。只可用精確值駕駛飛船——每錯一題扣 1000 呎。墜海則該章重新開始。"),
    startCh1: L("Start from Chapter 1", "由第 1 章開始"),
    start: L("Start ▸", "開始 ▸"),
    reveal: L("Show answer", "顯示答案"),
    revealShort: L("ANS", "答"),
    pairNoPartner: function (name) { return L("45° has no partner — work out " + name + "²45° yourself.", "45° 沒有配對——請自行計算 " + name + "²45°。"); },
    pairHint: function (name, a, b, why) { var w = both(why); return L(name + "²" + a + "° + " + name + "²" + b + "° = 1. " + w.en, name + "²" + a + "° + " + name + "²" + b + "° = 1。" + w.zh); },
    pairWrong: function (a, b, sum) { return L(a + "° + " + b + "° = " + sum + "°, not 90°. Partners must add up to 90°.", a + "° + " + b + "° = " + sum + "°，不是 90°。配對兩角須互補為 90°。"); },
  };

  /* ─── save ─────────────────────────────────────────────────────────── */

  function readSave() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) {}
    if (!s || s.v !== 1) s = { v: 1, cleared: 0, wrong: 0, crashes: 0 };
    if (!s.stars || s.stars.length !== CHAPTERS.length) s.stars = [0, 0, 0, 0];
    return s;
  }
  function writeSave(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  var save = readSave();

  var state = {
    gen: 0, mode: "title", chapter: 0, pi: 0, alt: MAX_ALT, streak: 0,
    chWrong: 0, zapTimer: null, puzzle: null, busy: false, solved: false,
    lastCard: null, cine: null,
  };

  /* ─── helpers ──────────────────────────────────────────────────────── */

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function btn(cls, html, fn) {
    var b = h("button", cls, html);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  }
  function texHTML(s) {
    s = T(s);
    if (s == null) return "";
    s = String(s);
    if (window.katex) {
      try { return window.katex.renderToString(s, { throwOnError: false }); } catch (e) {}
    }
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function rich(s) {
    s = T(s);
    if (s == null) return "";
    return String(s).split("$").map(function (part, i) { return i % 2 ? texHTML(part) : part; }).join("");
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function later(ms, fn) {
    var my = state.gen;
    return setTimeout(function () { if (my === state.gen) fn(); }, ms);
  }
  function starStr(n) {
    var s = "";
    for (var i = 0; i < 3; i++) s += i < n ? "★" : "☆";
    return s;
  }
  function starsFor(alt) { return alt >= MAX_ALT ? 3 : alt >= 3 ? 2 : 1; }
  function restart(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    if (cls === "bad") {
      later(450, function () { if (node && node.classList) node.classList.remove("bad"); });
    }
  }

  /* ─── exact-answer parser ──────────────────────────────────────────── */

  function parseAnswer(src) {
    var s = String(src).replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-");
    var i = 0, dec = false, irr = false;
    function peek() { return s[i]; }
    function num() {
      var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw new Error("num");
      i += m[0].length;
      if (m[0].indexOf(".") >= 0) dec = true;
      return { v: parseFloat(m[0]), r: false };
    }
    function atom() {
      var c = peek();
      if (c === "√") { i++; var a = atom(); return { v: Math.sqrt(a.v), r: true }; }
      if (c === "(") {
        i++;
        var e = expr();
        if (peek() !== ")") throw new Error("paren");
        i++;
        return e;
      }
      return num();
    }
    function startsAtom(c) { return c === "√" || c === "(" || (c != null && /[\d.]/.test(c)); }
    function product() {
      var a = atom();
      while (startsAtom(peek())) { var b = atom(); a = { v: a.v * b.v, r: a.r || b.r }; }
      return a;
    }
    function unary() {
      if (peek() === "-") { i++; var u = unary(); return { v: -u.v, r: u.r }; }
      if (peek() === "+") { i++; return unary(); }
      return product();
    }
    function term() {
      var a = unary();
      for (;;) {
        var c = peek();
        if (c === "*") { i++; var b = unary(); a = { v: a.v * b.v, r: a.r || b.r }; }
        else if (c === "/") { i++; var d = unary(); if (d.r) irr = true; a = { v: a.v / d.v, r: a.r || d.r }; }
        else break;
      }
      return a;
    }
    function expr() {
      var a = term();
      for (;;) {
        var c = peek();
        if (c === "+") { i++; var b = term(); a = { v: a.v + b.v, r: a.r || b.r }; }
        else if (c === "-") { i++; var d = term(); a = { v: a.v - d.v, r: a.r || d.r }; }
        else break;
      }
      return a;
    }
    try {
      if (!s) return null;
      var out = expr();
      if (i !== s.length || !isFinite(out.v)) return null;
      return { v: out.v, dec: dec, irr: irr };
    } catch (e) {
      return null;
    }
  }

  function toTex(s) {
    var i = 0;
    function grab() {
      if (s[i] === "(") {
        var depth = 0, j = i;
        for (; j < s.length; j++) {
          if (s[j] === "(") depth++;
          else if (s[j] === ")") { depth--; if (depth === 0) break; }
        }
        var inner = s.slice(i + 1, j);
        i = j + 1;
        return toTex(inner);
      }
      if (s[i] === "√") { i++; return "\\sqrt{" + grab() + "}"; }
      var m = /^[\d.]+/.exec(s.slice(i));
      if (m) { i += m[0].length; return m[0]; }
      return "\\,";
    }
    var out = "";
    while (i < s.length) {
      var c = s[i];
      if (c === "√") { i++; out += "\\sqrt{" + grab() + "}"; }
      else if (c === "*" || c === "×") { out += "\\times "; i++; }
      else if (c === "−") { out += "-"; i++; }
      else { out += c; i++; }
    }
    return out;
  }

  function near(a, b) { return Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)); }
  function isRational(x) {
    for (var k = 1; k <= 1000; k++) if (Math.abs(x * k - Math.round(x * k)) < 1e-7) return true;
    return false;
  }

  /* ─── cockpit art (SVG) ────────────────────────────────────────────── */

  function rivets(pts) {
    return pts.map(function (p) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="url(#bvg-rivet)" stroke="#2a1c08" stroke-width="1"/>';
    }).join("");
  }
  function frameRivets() {
    var pts = [], i;
    for (i = 0; i <= 12; i++) pts.push([144 + i * 109.3, 19]);
    for (i = 1; i < 6; i++) { pts.push([144 - i * 7.6, 19 + i * 52.8]); pts.push([1456 + i * 7.6, 19 + i * 52.8]); }
    return rivets(pts);
  }
  function bezel(x, y, w, hgt, r, label) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hgt + '" rx="' + r + '" fill="url(#bvg-bezel)" stroke="#070504" stroke-width="3"/>' +
      '<rect x="' + (x + 8) + '" y="' + (y + 8) + '" width="' + (w - 16) + '" height="' + (hgt - 16) + '" rx="' + (r - 4) + '" fill="none" stroke="url(#bvg-brass)" stroke-width="5"/>' +
      rivets([[x + 16, y + 16], [x + w - 16, y + 16], [x + 16, y + hgt - 16], [x + w - 16, y + hgt - 16]]) +
      (label ? '<text x="' + (x + w / 2) + '" y="' + (y + hgt - 2) + '" class="bv-engrave" text-anchor="middle">' + label + "</text>" : "");
  }

  var SCENE_SVG =
    '<svg class="bv-scene" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><defs>' +
    '<linearGradient id="bvg-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c120a"/><stop offset="1" stop-color="#3a2614"/></linearGradient>' +
    '<linearGradient id="bvg-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc95"/><stop offset=".35" stop-color="#c9973a"/><stop offset=".72" stop-color="#7a5418"/><stop offset="1" stop-color="#b8892f"/></linearGradient>' +
    '<linearGradient id="bvg-rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9c877"/><stop offset=".45" stop-color="#a87a26"/><stop offset="1" stop-color="#4a3210"/></linearGradient>' +
    '<linearGradient id="bvg-console" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3226"/><stop offset=".12" stop-color="#2b241b"/><stop offset="1" stop-color="#120e09"/></linearGradient>' +
    '<linearGradient id="bvg-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a352d"/><stop offset="1" stop-color="#1a1713"/></linearGradient>' +
    '<radialGradient id="bvg-rivet" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fbe7ad"/><stop offset=".6" stop-color="#b8892f"/><stop offset="1" stop-color="#5a3d10"/></radialGradient>' +
    '<linearGradient id="bvg-pillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140c06"/><stop offset="1" stop-color="#3a2614"/></linearGradient>' +
    '<linearGradient id="bvg-pillarR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#140c06"/><stop offset="1" stop-color="#3a2614"/></linearGradient>' +
    "</defs>" +
    '<rect width="1600" height="380" fill="url(#bvg-wall)"/>' +
    '<path d="M0 0 L138 0 L94 344 L0 380 Z" fill="url(#bvg-pillar)"/>' +
    '<path d="M1600 0 L1462 0 L1506 344 L1600 380 Z" fill="url(#bvg-pillarR)"/>' +
    '<g stroke="#0e0905" stroke-width="2" opacity=".55"><path d="M0 70 L128 72 M0 150 L118 152 M0 230 L108 232 M0 310 L98 312"/><path d="M1600 70 L1472 72 M1600 150 L1482 152 M1600 230 L1492 232 M1600 310 L1502 312"/></g>' +
    '<path d="M136 8 L1464 8 L1508 340 L92 340 Z" fill="url(#bvg-brass)" stroke="#2a1c08" stroke-width="3"/>' +
    '<path d="M150 26 L1450 26 L1488 322 L112 322 Z" fill="#05070c" stroke="#1a1208" stroke-width="4"/>' +
    frameRivets() +
    '<rect x="0" y="340" width="1600" height="34" fill="url(#bvg-rail)"/>' +
    '<rect x="0" y="340" width="1600" height="3" fill="#fbe7ad" opacity=".55"/>' +
    '<rect x="0" y="374" width="1600" height="526" fill="url(#bvg-console)"/>' +
    '<rect x="0" y="374" width="1600" height="10" fill="#000" opacity=".45"/>' +
    bezel(36, 386, 900, 500, 22, "") +
    '<rect x="58" y="408" width="856" height="456" rx="14" fill="#03070b"/>' +
    bezel(954, 386, 612, 286, 18, "") +
    '<rect x="972" y="402" width="576" height="254" rx="12" fill="#0b0904"/>' +
    bezel(954, 684, 612, 202, 18, "") +
    '<rect x="968" y="698" width="584" height="174" rx="12" fill="#1a140c"/>' +
    "</svg>";

  /* Altimeter: needle sweeps 270°, 0 ft at −135°, 5000 ft at +135°. */
  function altAngle(v) { return -135 + v * 54; }
  var DIAL_SVG = (function () {
    function pt(v, r) { var a = rad(altAngle(v)); return { x: 60 + r * Math.sin(a), y: 60 - r * Math.cos(a) }; }
    function band(v0, v1, col) {
      var p0 = pt(v0, 41), p1 = pt(v1, 41);
      return '<path d="M' + p0.x.toFixed(1) + " " + p0.y.toFixed(1) + " A41 41 0 " + ((v1 - v0) * 54 > 180 ? 1 : 0) + " 1 " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="5"/>';
    }
    var s = '<svg class="bv-dial" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
      '<radialGradient id="bvd-face" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#2a2318"/><stop offset="1" stop-color="#0c0905"/></radialGradient></defs>' +
      '<circle cx="60" cy="60" r="58" fill="url(#bvg-brass)" stroke="#2a1c08" stroke-width="2"/>' +
      '<circle cx="60" cy="60" r="51" fill="url(#bvd-face)" stroke="#3b2a10" stroke-width="2"/>' +
      band(0, 1, "#ef4444") + band(1, 3, "#f59e0b") + band(3, 5, "#22c55e");
    for (var t = 0; t <= 10; t++) {
      var v = t / 2, a = pt(v, 47), b = pt(v, t % 2 ? 42 : 38);
      s += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="#f6e7c1" stroke-width="' + (t % 2 ? 1.2 : 2.2) + '"/>';
      if (!(t % 2)) { var n = pt(v, 29); s += '<text x="' + n.x.toFixed(1) + '" y="' + (n.y + 4.5).toFixed(1) + '" text-anchor="middle" class="bv-dial-n">' + v + "</text>"; }
    }
    s += '<text x="60" y="47" text-anchor="middle" class="bv-dial-cap">×1000 FT</text>' +
      '<g class="bv-needle"><path d="M58 64 L60 17 L62 64 Z" fill="#f8fafc"/><path d="M58.6 64 L60 74 L61.4 64 Z" fill="#94a3b8"/></g>' +
      '<circle cx="60" cy="60" r="5" fill="url(#bvg-brass)" stroke="#2a1c08" stroke-width="1"/>' +
      '<path d="M22 40 A44 44 0 0 1 70 17" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5" stroke-linecap="round"/>';
    return s + "</svg>";
  })();

  var ICON = {
    soundOn: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fs: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };

  /* ─── DOM ──────────────────────────────────────────────────────────── */

  root.innerHTML = "";
  var R = h("div", "bv-root");
  root.appendChild(R);
  R.innerHTML =
    '<div class="bv-cockpit" hidden>' +
    SCENE_SVG +
    '  <div class="bv-win"><div class="bv-world"><img class="bv-sky" alt=""></div><div class="bv-rain"></div>' +
    '    <div class="bv-flood"></div><div class="bv-flash"></div><div class="bv-warn"></div><div class="bv-wincap"></div></div>' +
    '  <div class="bv-alt">' + DIAL_SVG + '<div class="bv-alt-val"></div></div>' +
    '  <div class="bv-climb"><span class="bv-climb-lab"></span><span class="bv-pips"></span></div>' +
    '  <div class="bv-plate"><span class="bv-plate-ch"></span><span class="bv-plate-place"></span></div>' +
    '  <div class="bv-lamps"></div>' +
    '  <div class="bv-alarm"></div>' +
    '  <div class="bv-crt"><div class="bv-crt-in"></div></div>' +
    '  <div class="bv-read">' +
    '    <div class="bv-read-head"><span class="bv-kicker"></span><span class="bv-ptitle"></span></div>' +
    '    <div class="bv-prompt"></div>' +
    '    <div class="bv-ansslot"></div>' +
    '    <div class="bv-status"></div>' +
    "  </div>" +
    '  <div class="bv-pad"><div class="bv-keys"></div><button class="bv-act" type="button"></button></div>' +
    "</div>" +
    '<div class="bv-overlay bv-title" hidden></div>' +
    '<div class="bv-overlay bv-card" hidden></div>' +
    '<div class="bv-overlay bv-cine" hidden>' +
    '  <img class="bv-cine-bg" alt="">' +
    '  <div class="bv-dialog"><img class="bv-face" alt="" hidden>' +
    '    <div class="bv-dialog-body"><div class="bv-who"></div><p class="bv-line"></p></div>' +
    '    <div class="bv-cine-next"></div></div>' +
    "</div>" +
    '<div class="bv-tools">' +
    '  <button class="bv-tool" type="button" data-t="mute"></button>' +
    '  <button class="bv-tool" type="button" data-t="fs"></button>' +
    '  <button class="bv-tool bv-tool-lang" type="button" data-t="lang"></button>' +
    (ALLOW_ANS ? '  <button class="bv-tool bv-tool-reveal" type="button" data-t="reveal"></button>' : "") +
    '  <button class="bv-tool bv-tool-skip" type="button" data-t="skip" hidden></button>' +
    "</div>" +
    '<div class="bv-fade"></div>';

  function q(sel) { return R.querySelector(sel); }
  var el = {
    cockpit: q(".bv-cockpit"), win: q(".bv-win"), world: q(".bv-world"), sky: q(".bv-sky"),
    flood: q(".bv-flood"), flash: q(".bv-flash"), warn: q(".bv-warn"), wincap: q(".bv-wincap"),
    alt: q(".bv-alt"), needle: q(".bv-needle"), altVal: q(".bv-alt-val"),
    climbLab: q(".bv-climb-lab"), pips: q(".bv-pips"),
    plateCh: q(".bv-plate-ch"), platePlace: q(".bv-plate-place"), lamps: q(".bv-lamps"), alarm: q(".bv-alarm"),
    crt: q(".bv-crt"), work: q(".bv-crt-in"),
    read: q(".bv-read"), kicker: q(".bv-kicker"), ptitle: q(".bv-ptitle"), prompt: q(".bv-prompt"),
    ans: q(".bv-ansslot"), status: q(".bv-status"),
    pad: q(".bv-pad"), keys: q(".bv-keys"), act: q(".bv-act"),
    title: q(".bv-title"), card: q(".bv-card"),
    cine: q(".bv-cine"), cineBg: q(".bv-cine-bg"), face: q(".bv-face"), who: q(".bv-who"), line: q(".bv-line"), cineNext: q(".bv-cine-next"),
    mute: q('[data-t="mute"]'), fs: q('[data-t="fs"]'), lang: q('[data-t="lang"]'),
    reveal: q('[data-t="reveal"]'), skip: q('[data-t="skip"]'),
    fade: q(".bv-fade"),
  };
  var cineSkip = null;
  for (var sk = 0; sk < CLIMB_STREAK; sk++) el.pips.appendChild(h("i"));

  /* ─── keypad + action lever ───────────────────────────────────────── */

  var padHook = null;
  var nextFn = null;
  var PAD_KEYS = ["7", "8", "9", "√", "(", ")", "4", "5", "6", "/", "+", "−", "1", "2", "3", "0", ".", "⌫"];
  PAD_KEYS.forEach(function (k) {
    el.keys.appendChild(btn("bv-key" + (/[\d.]/.test(k) ? "" : " op") + (k === "⌫" ? " del" : ""), k, function () {
      if (!padHook || padHook.locked) return;
      sfx("tick");
      if (k === "⌫") padHook.inp.value = padHook.inp.value.slice(0, -1);
      else padHook.inp.value += k === "−" ? "-" : k;
      padHook.refresh();
    }));
  });
  el.act.addEventListener("click", function () {
    if (nextFn) { var f = nextFn; sfx("tick"); f(); return; }
    if (padHook && !padHook.locked) padHook.submit();
  });
  function syncPad() {
    var typing = !!(padHook && !padHook.locked);
    el.pad.classList.toggle("typing", typing);
    el.pad.classList.toggle("go", !!nextFn);
    el.act.disabled = !typing && !nextFn;
    var last = state.mode === "play" && state.pi + 1 >= CHAPTERS[state.chapter].puzzles.length;
    el.act.textContent = nextFn ? T(last ? UI.finish : UI.next) : T(UI.check);
  }
  function setPad(hook) { padHook = hook || null; syncPad(); }
  function setNext(fn) { nextFn = fn || null; syncPad(); }

  function toolLabels() {
    var muted = !!(audio && audio.muted);
    el.mute.innerHTML = muted ? ICON.soundOff : ICON.soundOn;
    el.mute.title = T(muted ? UI.soundOff : UI.soundOn);
    el.fs.innerHTML = ICON.fs;
    el.fs.title = T(UI.fullscreen);
    el.lang.textContent = lang === "zh" ? "EN" : "中";
    el.lang.title = T(UI.langSwitch);
    if (el.reveal) {
      el.reveal.textContent = T(UI.revealShort);
      el.reveal.title = T(UI.reveal);
    }
    el.skip.textContent = T(UI.skipShort);
    el.skip.title = T(UI.skip);
    el.cineNext.textContent = T(UI.cineNext);
    el.climbLab.textContent = T(UI.climb);
    syncPad();
  }

  function setCineSkip(fn) {
    cineSkip = fn || null;
    el.skip.hidden = !cineSkip;
  }

  function setLang(l) {
    lang = l === "zh" ? "zh" : "en";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    toolLabels();
    if (state.mode === "title") showTitle();
    else if (state.mode === "card" && state.lastCard) showCard(state.lastCard);
    else if (state.mode === "cine" && state.cine) state.cine.paint();
    else if (state.mode === "play") {
      updateHud();
      el.plateCh.textContent = T(CHAPTERS[state.chapter].card.kicker);
      el.platePlace.textContent = T(CHAPTERS[state.chapter].place);
      runPuzzle(state.pi);
    }
  }

  function fadeThrough(fn) {
    el.fade.classList.add("on");
    later(360, function () { fn(); el.fade.classList.remove("on"); });
  }
  function preload(list) {
    list.forEach(function (n) { var i = new Image(); i.src = ART + n + V; });
  }
  function artSrc(img, name, fallback) {
    img.onerror = fallback ? function () { img.onerror = null; img.src = ART + fallback + V; } : null;
    img.src = ART + name + V;
  }

  /* ─── HUD ──────────────────────────────────────────────────────────── */

  function updateHud() {
    el.needle.style.transform = "rotate(" + altAngle(state.alt) + "deg)";
    el.altVal.textContent = state.alt * 1000 + " ft";
    el.alt.classList.toggle("warn", state.alt === 2 || state.alt === 3);
    el.alt.classList.toggle("danger", state.alt <= 1);
    el.cockpit.classList.toggle("low", state.alt <= 1);
    var pips = el.pips.children;
    for (var j = 0; j < pips.length; j++) pips[j].classList.toggle("on", j < state.streak);
    /* lower altitude → the horizon (sea, peaks) climbs up the windshield */
    el.world.style.transform = "translateY(" + -(66 + (MAX_ALT - state.alt) * 12) + "%)";
  }

  function buildLamps() {
    var n = CHAPTERS[state.chapter].puzzles.length;
    el.lamps.innerHTML = "";
    for (var i = 0; i < n; i++) el.lamps.appendChild(h("i"));
  }
  function updateLamps() {
    var ls = el.lamps.children;
    for (var i = 0; i < ls.length; i++) {
      ls[i].className = i < state.pi || (i === state.pi && state.solved) ? "done" : i === state.pi ? "cur" : "";
    }
  }

  function status(text, tone) {
    el.status.className = "bv-status" + (tone ? " " + tone : "");
    el.status.innerHTML = rich(text) || "";
    el.status.scrollTop = 0;
  }

  function enterPlay() {
    var ch = CHAPTERS[state.chapter];
    state.mode = "play";
    hideOverlays();
    el.cockpit.hidden = false;
    el.cockpit.classList.toggle("dry", !!ch.dry);
    el.cockpit.classList.remove("sinking", "shake", "ok", "climb");
    el.wincap.classList.remove("on");
    el.wincap.innerHTML = "";
    el.alarm.classList.remove("on");
    el.flash.classList.remove("on");
    artSrc(el.sky, ch.sky);
    el.plateCh.textContent = T(ch.card.kicker);
    el.platePlace.textContent = T(ch.place);
    buildLamps();
    setBed(ch.music);
    updateHud();
    scheduleZap();
  }

  function clearZap() { if (state.zapTimer) { clearTimeout(state.zapTimer); state.zapTimer = null; } }
  function scheduleZap() {
    clearZap();
    if (CHAPTERS[state.chapter].dry) return;
    state.zapTimer = later(7000 + Math.random() * 9000, function () {
      if (state.mode !== "play") return;
      restart(el.flash, "on");
      sfx("thunder");
      scheduleZap();
    });
  }

  function gain() {
    state.streak++;
    if (state.streak >= CLIMB_STREAK) {
      state.streak = 0;
      if (state.alt < MAX_ALT) {
        state.alt++;
        sfx("climb");
        restart(el.cockpit, "climb");
        el.wincap.classList.add("up");
        el.wincap.innerHTML = "<b>+1000 FT</b><span>" + T(UI.climbGain) + "</span>";
        restart(el.wincap, "on");
      } else restart(el.cockpit, "ok");
    } else restart(el.cockpit, "ok");
    updateHud();
  }

  function shake() { restart(el.cockpit, "shake"); }

  function hurt(why) {
    if (state.mode !== "play" || state.busy) return;
    var p = state.puzzle;
    if (p && p.free) {
      shake();
      sfx("deny");
      status(T(UI.practiceNoAlt) + T(why), "bad");
      return;
    }
    state.alt = Math.max(0, state.alt - 1);
    state.streak = 0;
    state.chWrong++;
    save.wrong = (save.wrong || 0) + 1;
    writeSave(save);
    if (state.alt <= 0) {
      status(T(UI.outOfAlt) + T(why), "bad");
      crash();
      return;
    }
    var ch = CHAPTERS[state.chapter];
    var dry = !!ch.dry;
    var ice = state.alt <= 2 && !dry;
    var hitLabel = dry ? UI.hitTurb : ice ? UI.hitIce : UI.hitBolt;
    sfx(dry ? "gust" : ice ? "crunch" : "thunder");
    sfx("bad");
    el.wincap.classList.remove("up");
    el.wincap.innerHTML = "<b>−1000 FT</b><span>" + T(hitLabel) + "</span>";
    restart(el.wincap, "on");
    if (!dry) restart(el.flash, "on");
    restart(el.alarm, "on");
    shake();
    updateHud();
    status(T(UI.minusAlt) + T(why), "bad");
  }

  /* hints and rough work: a wrong pick explains itself but costs no altitude */
  function hint(why) {
    sfx("deny");
    shake();
    status(T(why), "bad");
  }

  /* ─── answer box (exact values + surd keypad) ─────────────────────── */

  function answerBox(o) {
    var box = h("div", "bv-ans");
    var row = h("div", "bv-ans-row");
    row.appendChild(h("span", "bv-ans-label", texHTML(o.label)));
    var field = h("div", "bv-field");
    var inp = document.createElement("input");
    inp.className = "bv-input";
    inp.type = "text";
    inp.setAttribute("inputmode", "none");
    inp.setAttribute("autocomplete", "off");
    inp.spellcheck = false;
    inp.placeholder = T(UI.exactPh);
    var prev = h("span", "bv-preview");
    field.appendChild(inp);
    if (o.unit) field.appendChild(h("span", "bv-unit", o.unit));
    field.appendChild(prev);
    row.appendChild(field);
    box.appendChild(row);

    var hook = { inp: inp, refresh: refresh, submit: submit, locked: false };

    function refresh() {
      var v = inp.value.replace(/sqrt/gi, "√").replace(/[rRsSqQ]/g, "√").replace(/[^0-9√()+\-−*×/÷.]/g, "");
      if (v !== inp.value) inp.value = v;
      prev.innerHTML = v ? texHTML(toTex(v)) : "";
      field.classList.toggle("has", !!v);
    }
    function submit() {
      if (hook.locked || state.busy) return;
      var raw = inp.value.trim();
      if (!raw) return;
      var r = parseAnswer(raw);
      if (!r) { sfx("deny"); status(UI.cantRead, ""); return; }
      var close = near(r.v, o.ans);
      if (r.dec) {
        if (close && isRational(o.ans)) return accept();
        if (close || Math.abs(r.v - o.ans) <= 0.01 * Math.abs(o.ans) + 0.005) {
          sfx("deny");
          status(UI.roundedDec, "bad");
          return;
        }
        return reject();
      }
      if (close) {
        if (r.irr && !o.allowIrr) { sfx("deny"); status(UI.rationalize, ""); return; }
        return accept();
      }
      reject();
    }
    function accept() {
      hook.locked = true;
      inp.disabled = true;
      box.classList.add("ok");
      setPad(null);
      sfx("ok");
      gain();
      o.onOk();
    }
    function reject() {
      restart(box, "bad");
      inp.select();
      hurt(o.why);
    }
    inp.addEventListener("input", refresh);
    inp.addEventListener("focus", function () { if (!hook.locked) setPad(hook); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      e.stopPropagation();
    });
    setPad(hook);
    if (!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
      setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 60);
    }
    return box;
  }

  function figNode(html) { return h("div", "bv-fig", html); }

  /* ─── puzzle widgets ───────────────────────────────────────────────
   * Each widget gets ctx = { work, ans, done }:
   *   work — the big chart screen (figures, working, choices)
   *   ans  — the answer slot on the readout (typed answers)
   */

  var W = {};

  W.num = function (p, c) {
    c.work.appendChild(figNode(p.fig()));
    c.ans.appendChild(answerBox({ label: p.label, unit: p.unit, ans: p.ans, why: p.why, allowIrr: p.allowIrr, onOk: c.done }));
  };

  W.notch = function (p, c) {
    var wrap = h("div", "bv-split");
    var fig = figNode(p.fig());
    wrap.appendChild(fig);
    var col = h("div", "bv-notches");
    col.appendChild(h("div", "bv-cap", T(UI.sextant)));
    var sight = fig.querySelector("#bv-sight");
    var x1 = sight ? +sight.getAttribute("x1") : 0, y1 = sight ? +sight.getAttribute("y1") : 0;
    var busy = false;
    [30, 45, 60].forEach(function (a) {
      var b = btn("bv-notch", a + "°", function () {
        if (busy || b.classList.contains("bad")) return;
        sfx("gear");
        if (sight) {
          sight.setAttribute("x2", (x1 + 460 * Math.cos(rad(a))).toFixed(1));
          sight.setAttribute("y2", (y1 - 460 * Math.sin(rad(a))).toFixed(1));
        }
        if (a === p.ans) {
          busy = true;
          b.classList.add("good");
          sfx("ok");
          gain();
          later(500, c.done);
        } else {
          b.classList.add("bad");
          hurt(p.why);
        }
      });
      col.appendChild(b);
    });
    wrap.appendChild(col);
    c.work.appendChild(wrap);
    c.ans.appendChild(h("div", "bv-ans-hint", "◂ " + T(UI.pickNotch)));
  };

  W.rebuild = function (p, c) {
    var SLOT = { adj: [190, 248], opp: [372, 150], hyp: [150, 118] };
    var s = '<path d="M50 230 L330 230 L330 55 Z" class="f-tri"/>' +
      '<path class="f-ra" d="M318 230 L318 218 L330 218"/>' +
      '<path class="f-arc" d="M88 230 A38 38 0 0 0 81.5 208.8"/>' +
      '<text x="104" y="218" class="f-ang" text-anchor="middle">θ</text>';
    Object.keys(SLOT).forEach(function (k) {
      var q2 = SLOT[k];
      s += '<g class="bv-slot" data-slot="' + k + '"><rect x="' + (q2[0] - 44) + '" y="' + (q2[1] - 21) + '" width="88" height="42" rx="8"/>' +
        '<text x="' + q2[0] + '" y="' + (q2[1] + 7) + '" class="f-txt" text-anchor="middle"></text></g>';
    });
    var wrap = h("div", "bv-split");
    var fig = figNode('<svg viewBox="0 0 430 280" preserveAspectRatio="xMidYMid meet">' + s + "</svg>");
    wrap.appendChild(fig);
    var side = h("div", "bv-rebuild");
    side.appendChild(h("div", "bv-reading", texHTML(p.reading)));
    var tiles = h("div", "bv-tiles");
    side.appendChild(tiles);
    var gauges = h("div", "bv-gauges");
    side.appendChild(gauges);
    wrap.appendChild(side);
    c.work.appendChild(wrap);

    var slots = {};
    fig.querySelectorAll(".bv-slot").forEach(function (g) { slots[g.getAttribute("data-slot")] = g; });
    function setSlot(k, val, cls) {
      slots[k].querySelector("text").textContent = val;
      slots[k].classList.remove("armed", "ask");
      if (cls) slots[k].classList.add(cls);
    }

    var picked = null, placed = 0;
    shuffle(p.place).forEach(function (k) {
      var t = btn("bv-tile", p.sides[k], function () {
        if (t.classList.contains("used")) return;
        sfx("tick");
        tiles.querySelectorAll(".bv-tile").forEach(function (x) { x.classList.remove("sel"); });
        t.classList.add("sel");
        picked = { key: k, btn: t };
        Object.keys(slots).forEach(function (sk2) { if (!slots[sk2].classList.contains("filled")) slots[sk2].classList.add("armed"); });
      });
      tiles.appendChild(t);
    });

    Object.keys(slots).forEach(function (k) {
      slots[k].addEventListener("click", function () {
        if (!picked || slots[k].classList.contains("filled")) return;
        if (k === picked.key) {
          setSlot(k, p.sides[k], "filled");
          picked.btn.classList.add("used");
          picked.btn.classList.remove("sel");
          picked = null;
          Object.keys(slots).forEach(function (sk2) { slots[sk2].classList.remove("armed"); });
          sfx("ok");
          gain();
          placed++;
          if (placed === p.place.length) later(300, askMissing);
        } else {
          hurt(p.placeWhy);
        }
      });
    });

    function askMissing() {
      setSlot(p.missing, "?", "ask");
      var nm = { opp: T(UI.opposite), adj: T(UI.adjacent), hyp: T(UI.hypotenuse) }[p.missing];
      status(UI.findThirdSide, "");
      c.ans.innerHTML = "";
      c.ans.appendChild(answerBox({
        label: nm + " =", ans: p.missAns, why: p.missWhy, allowIrr: true,
        onOk: function () {
          setSlot(p.missing, p.sides[p.missing], "filled");
          status(UI.nowRatios, "good");
          later(300, function () { askRatio(0); });
        },
      }));
    }

    var rows = p.asks.map(function (a) {
      var r = h("div", "bv-gauge", "<span>" + texHTML(a.tex) + '</span><span class="v">—</span>');
      gauges.appendChild(r);
      return r;
    });
    function askRatio(i) {
      if (i >= p.asks.length) { later(400, c.done); return; }
      var a = p.asks[i];
      rows.forEach(function (r, j) { r.classList.toggle("cur", j === i); });
      c.ans.innerHTML = "";
      c.ans.appendChild(answerBox({
        label: a.tex + " =", ans: a.ans, why: a.why,
        onOk: function () {
          rows[i].classList.remove("cur");
          rows[i].classList.add("done");
          rows[i].querySelector(".v").innerHTML = "✓";
          later(300, function () { askRatio(i + 1); });
        },
      }));
    }
  };

  W.steps = function (p, c) {
    var chain = h("div", "bv-chain");
    var opts = h("div", "bv-opts");
    c.work.appendChild(chain);
    c.work.appendChild(opts);
    c.ans.appendChild(h("div", "bv-ans-hint", "◂ " + T(UI.pickLine)));
    var k = 0;
    function addLine(t, tag, rule) {
      chain.querySelectorAll(".bv-chain-line").forEach(function (x) { x.classList.remove("cur"); });
      var row = h("div", "bv-chain-line cur");
      row.appendChild(h("span", "tag", tag || ""));
      row.appendChild(h("span", "tex", texHTML(t)));
      if (rule) row.appendChild(h("span", "rule", "← " + T(rule)));
      chain.appendChild(row);
      chain.scrollTop = chain.scrollHeight;
    }
    addLine(p.start, T(p.startTag) || "");
    function showStep() {
      opts.innerHTML = "";
      if (k >= p.steps.length) {
        if (p.endTag) addLine("\\text{" + T(p.endTag) + "}\\ \\checkmark", "", "");
        opts.hidden = true;
        if (p.then) later(400, showThen);
        else later(400, c.done);
        return;
      }
      var st = p.steps[k];
      shuffle([{ tex: st.ok.tex, ok: true }].concat(st.bad)).forEach(function (o) {
        var b = btn("bv-opt", texHTML("=" + o.tex), function () {
          if (b.classList.contains("bad")) return;
          if (o.ok) {
            sfx("gear");
            sfx("ok");
            gain();
            addLine(o.tex, "=", T(st.ok.rule));
            k++;
            showStep();
          } else {
            b.classList.add("bad");
            hurt(o.why);
          }
        });
        opts.appendChild(b);
      });
    }
    function showThen() {
      var t = p.then;
      el.prompt.innerHTML = rich(t.prompt);
      c.ans.innerHTML = "";
      c.ans.appendChild(answerBox({ label: t.label, unit: t.unit, ans: t.ans, why: t.why, onOk: c.done }));
      status(UI.provedPartB, "good");
    }
    showStep();
  };

  function renderExpr(items, onChip) {
    var wrap = h("span", "bv-frac-row");
    items.forEach(function (it) {
      if (typeof it === "string" || (it && !it.frac && !it.tex && ("en" in it || "zh" in it))) {
        wrap.appendChild(h("span", "bv-chip", texHTML(it)));
      } else if (it.frac) {
        var f = h("span", "bv-frac");
        f.appendChild(renderExpr(it.frac[0], onChip));
        f.appendChild(h("span", "bv-frac-bar"));
        f.appendChild(renderExpr(it.frac[1], onChip));
        wrap.appendChild(f);
      } else {
        var b = btn("bv-chip hint", texHTML(it.tex));
        onChip(it, b);
        wrap.appendChild(b);
      }
    });
    return wrap;
  }

  W.cofn = function (p, c) {
    var exprBox = h("div", "bv-expr");
    var work = h("div", "bv-rewrite");
    var pick = null;
    exprBox.appendChild(renderExpr(p.expr, function (it, b) {
      b.addEventListener("click", function () {
        if (b.classList.contains("fixed")) return;
        sfx("tick");
        exprBox.querySelectorAll(".bv-chip").forEach(function (x) { x.classList.remove("pick"); });
        b.classList.add("pick");
        pick = { it: it, btn: b };
        showChoices();
      });
    }));
    c.work.appendChild(exprBox);
    c.work.appendChild(work);
    work.appendChild(h("p", "bv-muted", T(UI.optionalRewrite)));
    c.ans.appendChild(answerBox({ label: p.final.label, unit: p.final.unit, ans: p.final.ans, why: p.final.why, onOk: c.done }));

    function showChoices() {
      work.innerHTML = "";
      work.appendChild(h("div", "bv-cap", T(UI.equalTo)));
      var grid = h("div", "bv-coupling");
      shuffle([pick.it.to].concat(pick.it.alts)).forEach(function (t) {
        var b = btn("bv-opt", texHTML(t), function () {
          if (b.classList.contains("bad") || !pick) return;
          if (t === pick.it.to) {
            sfx("gear");
            pick.btn.innerHTML = texHTML(pick.it.to);
            pick.btn.className = "bv-chip fixed";
            pick = null;
            work.innerHTML = "";
            status(UI.rewritten, "good");
          } else {
            b.classList.add("bad");
            hint(pick.it.why);
          }
        });
        grid.appendChild(b);
      });
      work.appendChild(grid);
    }
  };

  W.pairs = function (p, c) {
    var fn = p.fn === "cos" ? "\\cos" : "\\sin";
    var name = p.fn === "cos" ? "cos" : "sin";
    var grid = h("div", "bv-pairs");
    grid.style.gridTemplateColumns = "repeat(" + (p.angles.length > 8 ? 6 : 3) + ", 1fr)";
    var sumLine = h("div", "bv-sum", "");
    c.work.appendChild(grid);
    c.work.appendChild(sumLine);
    c.work.appendChild(h("p", "bv-muted", T(UI.optionalPairs)));
    c.ans.appendChild(answerBox({
      label: p.final.label, ans: p.final.ans, why: p.final.why,
      onOk: function () { grid.classList.add("off"); c.done(); },
    }));
    var parts = [], sel = null;
    function updSum() { sumLine.innerHTML = parts.length ? texHTML("=" + parts.join("+") + "+\\cdots") : ""; }
    shuffle(p.angles).forEach(function (a) {
      var b = btn("bv-card-t", texHTML(fn + "^2 " + a + "^\\circ"), function () {
        if (b.classList.contains("done") || b.classList.contains("lone")) return;
        b.classList.remove("bad");
        if (a === p.lone) {
          sfx("tick");
          b.classList.add("lone");
          parts.push(fn + "^2 45^\\circ");
          if (sel) { sel.b.classList.remove("sel"); sel = null; }
          status(UI.pairNoPartner(name), "");
          updSum();
          return;
        }
        if (!sel) { sfx("tick"); sel = { a: a, b: b }; b.classList.add("sel"); return; }
        if (sel.b === b) { b.classList.remove("sel"); sel = null; return; }
        if (sel.a + a === 90) {
          sfx("gear");
          sel.b.classList.remove("sel", "bad");
          b.classList.remove("bad");
          sel.b.classList.add("done");
          b.classList.add("done");
          sel.b.innerHTML = texHTML("1");
          b.innerHTML = texHTML("\\checkmark");
          parts.push("1");
          status(UI.pairHint(name, Math.min(sel.a, a), Math.max(sel.a, a), p.pairWhy), "good");
          sel = null;
          updSum();
        } else {
          var other = sel.b;
          other.classList.remove("sel");
          [other, b].forEach(function (x) { restart(x, "bad"); });
          var why = UI.pairWrong(sel.a, a, sel.a + a);
          sel = null;
          hint(why);
        }
      });
      grid.appendChild(b);
    });
  };

  W.spot = function (p, c) {
    c.work.appendChild(h("div", "bv-claim", '<span class="bv-cap">' + T(UI.claim) + "</span>" + texHTML(p.claim)));
    var log = h("div", "bv-log");
    var busy = false;
    p.lines.forEach(function (ln, i) {
      var b = btn("bv-log-line", '<span class="n">' + T(UI.lineN(i + 1)) + "</span>" + texHTML(ln.tex), function () {
        if (busy || b.classList.contains("bad")) return;
        if (ln.wrong) {
          busy = true;
          b.classList.add("good");
          sfx("ok");
          gain();
          later(300, c.done);
        } else {
          b.classList.add("bad");
          hurt(ln.why);
        }
      });
      log.appendChild(b);
    });
    c.work.appendChild(log);
    c.ans.appendChild(h("div", "bv-ans-hint", "◂ " + T(UI.spotLine)));
  };

  /* ─── flow ─────────────────────────────────────────────────────────── */

  function runPuzzle(k) {
    var ch = CHAPTERS[state.chapter];
    if (k >= ch.puzzles.length) { chapterDone(); return; }
    ++state.gen;
    state.pi = k;
    state.solved = false;
    state.busy = false;
    var p = ch.puzzles[k];
    state.puzzle = p;
    if (state.mode !== "play") enterPlay();
    setPad(null);
    setNext(null);
    scheduleZap();
    updateLamps();
    el.kicker.textContent = T(UI.chKicker(state.chapter, k, ch.puzzles.length));
    el.ptitle.textContent = T(p.title);
    el.prompt.innerHTML = rich(p.prompt);
    el.work.innerHTML = "";
    el.work.className = "bv-crt-in t-" + p.type;
    el.ans.innerHTML = "";
    status(p.tip || "", "");
    W[p.type](p, { work: el.work, ans: el.ans, done: function () { solved(p, k); } });
  }

  /* Dev/test: skip the whole puzzle and show the win line (no step-through). Local only. */
  function revealAnswer() {
    if (!ALLOW_ANS) return;
    if (state.mode !== "play" || state.solved || state.busy || !state.puzzle) return;
    ensureAudio();
    sfx("ok");
    setPad(null);
    solved(state.puzzle, state.pi);
  }

  function solved(p, k) {
    if (state.mode !== "play") return;
    state.solved = true;
    updateLamps();
    status(p.win, "good");
    setPad(null);
    setNext(function () { setNext(null); runPuzzle(k + 1); });
  }

  function crash() {
    state.mode = "crash";
    state.busy = true;
    save.crashes = (save.crashes || 0) + 1;
    writeSave(save);
    clearZap();
    setBed("none");
    setPad(null);
    ++state.gen;
    updateHud();
    sfx("crash");
    el.wincap.innerHTML = "<b>0 FT</b><span>" + T(UI.sinking) + "</span>";
    restart(el.wincap, "on");
    restart(el.alarm, "on");
    el.cockpit.classList.add("sinking");
    later(2400, function () { fadeThrough(crashCard); });
  }

  function crashCard() {
    var ch = CHAPTERS[state.chapter];
    showCard({
      img: "crash.png", crash: true,
      kicker: UI.altZero, name: UI.intoSea, sub: UI.crashSub(ch.card.kicker),
      buttons: [
        { label: UI.retryCh(ch.card.kicker), act: function () { startChapter(state.chapter); } },
        { label: UI.menu, ghost: true, act: showTitle },
      ],
    });
  }

  function chapterCard(i, keepAlt) {
    var ch = CHAPTERS[i];
    var best = save.stars[i] || 0;
    showCard({
      img: ch.card.img, kicker: ch.card.kicker, name: ch.card.name, sub: ch.card.sub,
      best: best ? UI.best(starStr(best)) : "",
      buttons: [{ label: UI.takeOff, act: function () { startChapter(i, !!keepAlt); } }],
    });
  }

  /* keepAlt: continue the voyage with current altitude + climb streak. Retries / menu take-offs refill. */
  function startChapter(i, keepAlt) {
    hideOverlays();
    state.chapter = i;
    if (!keepAlt) {
      state.alt = MAX_ALT;
      state.streak = 0;
    }
    state.chWrong = 0;
    state.mode = "start";
    preload([CHAPTERS[i].sky]);
    var intro = CH_INTRO[i] || [];
    function go() { fadeThrough(function () { enterPlay(); runPuzzle(0); }); }
    if (intro.length) playCine(intro, go);
    else go();
  }

  function chapterDone() {
    var i = state.chapter;
    var ch = CHAPTERS[i];
    var stars = starsFor(state.alt);
    var perfect = state.chWrong === 0;
    save.cleared = Math.max(save.cleared || 0, i + 1);
    save.stars[i] = Math.max(save.stars[i] || 0, stars);
    writeSave(save);
    var last = i + 1 >= CHAPTERS.length;
    function showDoneCard() {
      var buttons = [];
      if (!last) buttons.push({ label: UI.chapArrow(CHAPTERS[i + 1].card.kicker), act: function () { chapterCard(i + 1, true); } });
      if (stars < 3) buttons.push({ label: UI.retryStars(starStr(3)), ghost: !last, act: function () { startChapter(i, false); } });
      buttons.push({ label: UI.menu, ghost: true, act: showTitle });
      var total = 0;
      save.stars.forEach(function (n) { total += n || 0; });
      showCard({
        img: last ? "end-02-landing.png" : ch.card.img,
        kicker: UI.chComplete(ch.card.kicker),
        name: last ? UI.voyageComplete : ch.card.name,
        stars: stars,
        badge: perfect ? UI.perfectFlight : "",
        sub: UI.altLeft(state.alt * 1000, last ? UI.allCleared(total) : ""),
        buttons: buttons,
        music: last ? "triumph" : "calm",
      });
    }
    fadeThrough(function () {
      if (last) playCine(ENDING, showDoneCard);
      else showDoneCard();
    });
  }

  /* ─── overlays ─────────────────────────────────────────────────────── */

  function hideOverlays() {
    el.title.hidden = true;
    el.card.hidden = true;
    el.cine.hidden = true;
    setCineSkip(null);
  }

  function playCine(scenes, done) {
    var i = 0, li = 0;
    ++state.gen;
    state.mode = "cine";
    clearZap();
    setPad(null);
    el.cockpit.hidden = true;
    el.title.hidden = true;
    el.card.hidden = true;
    el.cine.hidden = false;

    function finish() {
      el.cine.hidden = true;
      el.cine.onclick = null;
      state.cine = null;
      setCineSkip(null);
      done();
    }
    function paint() {
      var sc = scenes[i];
      if (sc.who && sc.face && FACES[sc.who] && FACES[sc.who][sc.face]) {
        el.face.hidden = false;
        el.face.src = ART + FACES[sc.who][sc.face] + V;
        el.who.textContent = T(NAMES[sc.who] || sc.who);
      } else {
        el.face.hidden = true;
        el.who.textContent = "";
      }
      el.line.textContent = T(sc.lines[li]) || "";
      el.cineNext.textContent = T(UI.cineNext);
    }
    function show() {
      if (i >= scenes.length) { finish(); return; }
      var sc = scenes[i];
      artSrc(el.cineBg, sc.bg, sc.alt);
      restart(el.cineBg, "in");
      if (sc.music) setBed(sc.music);
      li = 0;
      paint();
    }
    function advance() {
      sfx("tick");
      if (li + 1 < scenes[i].lines.length) { li++; paint(); restart(el.line, "in"); return; }
      i++;
      show();
    }
    state.cine = { paint: paint };
    el.cine.onclick = advance;
    setCineSkip(function () { sfx("tick"); finish(); });
    show();
  }

  function overlayText(eyebrow, name, sub) {
    var t = h("div", "bv-ov-text");
    t.appendChild(h("div", "bv-eyebrow", T(eyebrow)));
    t.appendChild(h("div", "bv-ov-title", T(name)));
    if (sub) t.appendChild(h("p", "bv-ov-sub", T(sub)));
    return t;
  }

  function showCard(o) {
    ++state.gen;
    state.mode = "card";
    state.lastCard = o;
    clearZap();
    setPad(null);
    el.cockpit.hidden = true;
    el.cine.hidden = true;
    el.title.hidden = true;
    el.card.className = "bv-overlay bv-card" + (o.crash ? " crash" : "");
    el.card.innerHTML = "";
    var img = h("img");
    img.alt = "";
    img.src = ART + o.img + V;
    el.card.appendChild(img);
    var t = overlayText(o.kicker, o.name, null);
    if (o.stars) t.appendChild(h("div", "bv-stars", starStr(o.stars)));
    if (o.badge) t.appendChild(h("div", "bv-badge", T(o.badge)));
    t.appendChild(h("p", "bv-ov-sub", T(o.sub)));
    if (o.best) t.appendChild(h("p", "bv-best", T(o.best)));
    var btns = h("div", "bv-btns");
    o.buttons.forEach(function (b) {
      btns.appendChild(btn("bv-btn" + (b.ghost ? " ghost" : ""), T(b.label), function () { sfx("tick"); ensureAudio(); b.act(); }));
    });
    t.appendChild(btns);
    el.card.appendChild(t);
    el.card.hidden = false;
    if (!o.crash) setBed(o.music || "calm");
  }

  function showTitle() {
    ++state.gen;
    state.mode = "title";
    clearZap();
    setPad(null);
    el.cockpit.hidden = true;
    el.card.hidden = true;
    el.cine.hidden = true;
    el.title.innerHTML = "";
    var img = h("img");
    img.alt = "";
    img.src = ART + "title.png" + V;
    el.title.appendChild(img);
    var t = overlayText(UI.titleEyebrow, UI.titleName, UI.titleSub);
    var btns = h("div", "bv-btns");
    function go(label, ghost, act) {
      btns.appendChild(btn("bv-btn" + (ghost ? " ghost" : ""), T(label), function () { ensureAudio(); sfx("tick"); act(); }));
    }
    var cleared = save.cleared || 0;
    function beginFrom(i, withOpening) {
      if (withOpening) playCine(OPENING, function () { chapterCard(i); });
      else chapterCard(i);
    }
    if (cleared > 0 && cleared < CHAPTERS.length) {
      go(UI.continueCh(CHAPTERS[cleared].card.kicker), false, function () { beginFrom(cleared, false); });
      go(UI.startCh1, true, function () { beginFrom(0, true); });
    } else {
      go(UI.start, false, function () { beginFrom(0, true); });
    }
    t.appendChild(btns);
    var chaps = h("div", "bv-chaps");
    CHAPTERS.forEach(function (ch, i) {
      var c = btn("bv-chap", '<span class="k">' + T(ch.card.kicker) + '</span><span class="n">' + T(ch.card.name) + '</span><span class="s">' + starStr(save.stars[i] || 0) + "</span>", function () {
        ensureAudio();
        sfx("tick");
        chapterCard(i);
      });
      c.disabled = i > cleared;
      chaps.appendChild(c);
    });
    t.appendChild(chaps);
    el.title.appendChild(t);
    el.title.hidden = false;
    setBed("calm");
  }

  /* ─── audio: Web Audio synth beds + sfx (no files) ─────────────────── */

  var audio = { ctx: null, master: null, music: null, sfx: null, bed: "", step: 0, timer: null, noise: null, muted: false };
  try { audio.muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function ensureAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audio.ctx) {
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      /* ~3× louder than cockpit10; light limiter only catches peaks. */
      var lim = audio.ctx.createDynamicsCompressor();
      lim.threshold.value = -6;
      lim.knee.value = 20;
      lim.ratio.value = 2;
      lim.attack.value = 0.01;
      lim.release.value = 0.25;
      audio.master.connect(lim);
      lim.connect(audio.ctx.destination);
      audio.music = audio.ctx.createGain();
      audio.music.gain.value = 4.05;
      var hp = audio.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 70;
      audio.music.connect(hp);
      hp.connect(audio.master);
      audio.sfx = audio.ctx.createGain();
      audio.sfx.gain.value = 4.8;
      audio.sfx.connect(audio.master);
      applyMute();
      if (audio.bed) startBed();
    }
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return audio.ctx;
  }
  function applyMute() {
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 5.1;
    toolLabels();
  }
  function noiseBuffer() {
    if (audio.noise) return audio.noise;
    var len = audio.ctx.sampleRate * 2;
    var buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    return buf;
  }
  function tone(dest, f, t, dur, type, g, f2) {
    var c = audio.ctx;
    var o = c.createOscillator(), a = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(Math.max(g, 0.0002), t + Math.min(0.04, dur / 3));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a);
    a.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(dest, t, dur, type, f, g, f2) {
    var c = audio.ctx;
    var s = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain();
    s.buffer = noiseBuffer();
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + Math.min(0.08, dur / 4));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl);
    fl.connect(a);
    a.connect(dest);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  var NOTE = { A2: 110, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, C5: 523.25, E5: 659.25, G5: 783.99 };
  var CALM = [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]];
  var BELLS = ["A4", "C5", "E5", "G4", "E4"];

  function bedStep(name, n, t) {
    var m = audio.music;
    if (name === "calm") {
      if (n % 8 === 0) CALM[(n / 8) % 4].forEach(function (k) { tone(m, NOTE[k], t, 4.3, "triangle", 0.09); });
      if (n % 4 === 2 && Math.random() < 0.6) tone(m, NOTE[BELLS[Math.floor(Math.random() * BELLS.length)]], t, 1.6, "sine", 0.055);
    } else if (name === "storm") {
      if (n % 8 === 0) { tone(m, NOTE.A2, t, 4.3, "triangle", 0.14); tone(m, NOTE.E3, t, 4.3, "sine", 0.075); }
      if (n % 4 === 0) noise(m, t, 2.6, "bandpass", 380 + Math.random() * 300, 0.14);
      if (n % 2 === 1 && Math.random() < 0.25) tone(m, NOTE.D4, t, 0.9, "sine", 0.04);
    } else if (name === "tension") {
      tone(m, n % 2 ? 116.54 : NOTE.A2, t, 0.32, "triangle", 0.14);
      if (n % 8 === 0) { tone(m, NOTE.D3, t, 4.2, "sine", 0.09); tone(m, NOTE.F3, t, 4.2, "sine", 0.06); }
    } else if (name === "triumph") {
      var arp = ["C4", "E4", "G4", "C5", "G4", "E4", "D4", "G4"];
      tone(m, NOTE[arp[n % 8]], t, 0.6, "triangle", 0.12);
      if (n % 8 === 0) ["C4", "E4", "G4"].forEach(function (k) { tone(m, NOTE[k] / 2, t, 4.2, "sine", 0.09); });
    }
  }
  function startBed() {
    if (audio.timer) clearInterval(audio.timer);
    audio.timer = null;
    if (!audio.ctx || !audio.bed || audio.bed === "none") return;
    audio.step = 0;
    var tick = function () {
      if (!audio.ctx || audio.ctx.state !== "running") return;
      bedStep(audio.bed, audio.step++, audio.ctx.currentTime + 0.05);
    };
    tick();
    audio.timer = setInterval(tick, 500);
  }
  function setBed(name) {
    if (audio.bed === name) return;
    audio.bed = name;
    if (audio.ctx) startBed();
  }

  function sfx(name) {
    if (!audio.ctx || audio.muted) return;
    var t = audio.ctx.currentTime + 0.01, d = audio.sfx;
    if (name === "tick") tone(d, 1800, t, 0.04, "square", 0.08);
    else if (name === "ok") { tone(d, 880, t, 0.18, "sine", 0.32); tone(d, 1318.5, t + 0.1, 0.3, "sine", 0.32); }
    else if (name === "deny") { tone(d, 330, t, 0.12, "square", 0.12); tone(d, 262, t + 0.1, 0.16, "square", 0.12); }
    else if (name === "bad") {
      tone(d, 140, t, 0.45, "sawtooth", 0.22, 70);
      tone(d, 740, t + 0.05, 0.22, "square", 0.12);
      tone(d, 554, t + 0.3, 0.22, "square", 0.12);
      noise(d, t, 0.5, "lowpass", 900, 0.28, 200);
    } else if (name === "climb") tone(d, 300, t, 0.6, "triangle", 0.22, 900);
    else if (name === "gear") { noise(d, t, 0.06, "highpass", 3000, 0.2); tone(d, 1250, t, 0.05, "square", 0.09); }
    else if (name === "thunder") noise(d, t, 2.2, "lowpass", 260, 0.45, 60);
    else if (name === "gust") {
      noise(d, t, 0.65, "bandpass", 900, 0.32, 350);
      tone(d, 180, t, 0.4, "sine", 0.16, 90);
    }
    else if (name === "crash") { noise(d, t, 2.8, "lowpass", 1800, 0.7, 80); tone(d, 220, t, 1.8, "sawtooth", 0.28, 40); }
    else if (name === "crunch") { noise(d, t, 0.7, "bandpass", 1400, 0.55, 300); tone(d, 95, t, 0.6, "sawtooth", 0.28, 45); }
  }

  /* ─── input wiring ─────────────────────────────────────────────────── */

  el.mute.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.muted = !audio.muted;
    try { localStorage.setItem(MUTE_KEY, audio.muted ? "1" : "0"); } catch (err) {}
    ensureAudio();
    applyMute();
  });
  el.fs.addEventListener("click", function (e) {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen();
  });
  el.skip.addEventListener("click", function (e) {
    e.stopPropagation();
    if (cineSkip) cineSkip();
  });
  if (el.reveal) {
    el.reveal.addEventListener("click", function (e) {
      e.stopPropagation();
      revealAnswer();
    });
  }
  el.lang.addEventListener("click", function (e) {
    e.stopPropagation();
    setLang(lang === "zh" ? "en" : "zh");
  });
  root.addEventListener("pointerdown", function () { ensureAudio(); }, { once: true });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || state.mode !== "play" || !nextFn) return;
    if (!root.offsetParent && !document.fullscreenElement) return;
    if (e.target && e.target.closest && e.target.closest("textarea, select, button")) return;
    e.preventDefault();
    el.act.click();
  });

  applyMute();
  preload(["title.png", "ch1-card.png", "sky-ch1.png", "crash.png", "op-01-departure.png", "op-02-storm.png"]);
  showTitle();
})();
