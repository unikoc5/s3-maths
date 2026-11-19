/* JM33 Harbour Grid — a lost baby sea creature in Victoria Harbour.
 * Story: a warm-up and five chapters (distance, slope, parallel and perpendicular lines,
 * mid-point and section formula, centres of a triangle).
 * Every round is drawn on a to-scale coordinate grid with fresh numbers on every visit.
 */
(function () {
  "use strict";

  var doc = typeof document !== "undefined" ? document : null;
  var stage = doc && doc.getElementById("hg-stage");
  var tabsEl = doc && doc.getElementById("hg-tabs");
  var ART = ((doc && doc.currentScript && doc.currentScript.src) || "").replace(/harbour-grid\.js(\?.*)?$/, "game/") || "game/";

  var NS = "http://www.w3.org/2000/svg";
  var C = { cy: "#22e3ff", gd: "#ffc65a", ok: "#3ef0a0", rd: "#ff4d5e", ink: "#e8f4ff", mut: "#9db4cc", pk: "#ff7ccc", bo: "#3a6fd8" };
  /* Map frame inside the 1280 × 720 board (the dock sits below the board). */
  var FR = { x: 24, y: 10, w: 1232, h: 700 };
  var BH = 720; /* board viewBox height; re-measured each round */
  var dockLock = 0, dockMax = 0;
  var MINUS = "\u2212";

  /* Bilingual text (as in JM31): any { en, zh } value is resolved by T() at render time. */
  var LANG_KEY = "jm33-hg-lang";
  var langPref = "en";
  try { langPref = localStorage.getItem(LANG_KEY) === "zh" ? "zh" : "en"; } catch (e) {}
  /* The language in use: the saved choice in translated rounds, English in rounds not yet translated. */
  var lang = langPref;
  function L(en, zh) { return { en: en, zh: zh }; }
  function T(x) { return x && typeof x === "object" && "en" in x ? x[lang] : x; }
  /* Show-answer is for local testing only — hidden on github.io / Platform embeds. */
  function allowAnswerReveal() {
    try {
      var h = (location.hostname || "").toLowerCase();
      return location.protocol === "file:" || h === "localhost" || h === "127.0.0.1";
    } catch (e) { return false; }
  }
  var ALLOW_ANS = allowAnswerReveal();
  /* Typeset \( … \) maths inside an element with KaTeX (left as plain text if KaTeX is missing). */
  function tex(node) {
    if (!node || typeof window === "undefined" || !window.renderMathInElement) return;
    try { window.renderMathInElement(node, { delimiters: [{ left: "\\(", right: "\\)", display: false }], throwOnError: false }); } catch (e) {}
  }

  /* ================================================================
   * Maths helpers
   * ================================================================ */

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nz(a, b) { var v; do { v = ri(a, b); } while (v === 0); return v; }
  function sgn() { return Math.random() < 0.5 ? -1 : 1; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function eq(a, b) { return isFinite(a) && isFinite(b) && Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)); }
  function isInt(v) { return eq(v, Math.round(v)); }

  function pt(x, y) { return { x: x, y: y }; }
  function add(a, b) { return pt(a.x + b.x, a.y + b.y); }
  function sub(a, b) { return pt(a.x - b.x, a.y - b.y); }
  function mul(a, k) { return pt(a.x * k, a.y * k); }
  function mid(a, b) { return pt((a.x + b.x) / 2, (a.y + b.y) / 2); }
  function same(a, b) { return eq(a.x, b.x) && eq(a.y, b.y); }
  function d2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
  function dist(a, b) { return Math.sqrt(d2(a, b)); }
  function slope(a, b) { return Math.abs(b.x - a.x) < 1e-9 ? Infinity : (b.y - a.y) / (b.x - a.x); }
  function cross(a, b, c) { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }
  function within(p, m) { return Math.abs(p.x) <= m && Math.abs(p.y) <= m; }
  function allWithin(list, m) { for (var i = 0; i < list.length; i++) if (!within(list[i], m)) return false; return true; }
  function distinct(list) {
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) if (same(list[i], list[j])) return false;
    return true;
  }
  /* (q, p) with q > 0, p ≠ 0, gcd 1: a direction of slope p/q. */
  function dirv(maxp, maxq) {
    var p, q;
    do { q = ri(1, maxq); p = nz(-maxp, maxp); } while (gcd(p, q) !== 1);
    return pt(q, p);
  }
  function loop(fn) {
    for (var i = 0; i < 4000; i++) { var r = fn(); if (r) return r; }
    throw new Error("Harbour Grid: generator gave up");
  }

  function centroid(A, B, Cc) { return pt((A.x + B.x + Cc.x) / 3, (A.y + B.y + Cc.y) / 3); }
  function circumcentre(A, B, Cc) {
    var d = 2 * (A.x * (B.y - Cc.y) + B.x * (Cc.y - A.y) + Cc.x * (A.y - B.y));
    var a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = Cc.x * Cc.x + Cc.y * Cc.y;
    return pt((a2 * (B.y - Cc.y) + b2 * (Cc.y - A.y) + c2 * (A.y - B.y)) / d,
      (a2 * (Cc.x - B.x) + b2 * (A.x - Cc.x) + c2 * (B.x - A.x)) / d);
  }
  function orthocentre(A, B, Cc) {
    var O = circumcentre(A, B, Cc);
    return pt(A.x + B.x + Cc.x - 2 * O.x, A.y + B.y + Cc.y - 2 * O.y);
  }
  function incentre(A, B, Cc) {
    var a = dist(B, Cc), b = dist(A, Cc), c = dist(A, B), s = a + b + c;
    return pt((a * A.x + b * B.x + c * Cc.x) / s, (a * A.y + b * B.y + c * Cc.y) / s);
  }
  function foot(P, A, B) {
    var d = sub(B, A), t = ((P.x - A.x) * d.x + (P.y - A.y) * d.y) / (d.x * d.x + d.y * d.y);
    return add(A, mul(d, t));
  }

  /* ---------- formatting ---------- */

  function neg(s) { return String(s).replace(/-/g, MINUS); }
  function fs(v) {
    if (v === Infinity || v === -Infinity) return "undefined";
    if (!isFinite(v)) return "?";
    if (isInt(v)) return neg(String(Math.round(v)));
    for (var d = 2; d <= 96; d++) {
      var n = v * d;
      if (Math.abs(n - Math.round(n)) < 1e-7) return neg(Math.round(n) + "/" + d);
    }
    return neg(String(Math.round(v * 100) / 100));
  }
  function par(v) { return v < 0 ? "(" + fs(v) + ")" : fs(v); }
  function pf(v) { return v < 0 || !isInt(v) ? "(" + fs(v) + ")" : fs(v); }
  function fp(p) { return "(" + fs(p.x) + ", " + fs(p.y) + ")"; }
  function surd(n) {
    if (n === 0) return "0";
    var a = 1, b = n;
    for (var k = Math.floor(Math.sqrt(n)); k > 1; k--) if (n % (k * k) === 0) { a = k; b = n / (k * k); break; }
    if (b === 1) return String(a);
    return (a > 1 ? a : "") + "√" + b;
  }
  function distAns(A, B) {
    var N = d2(A, B), d = Math.sqrt(N);
    return isInt(d) ? d : surd(N);
  }
  function ms(s) { return "m<sub>" + s + "</sub>"; }
  /* Plain-text "x_A" → x<sub>A</sub> so formulas in the dock read like the textbook. */
  function subs(s) {
    if (s == null) return s;
    return String(s).split(/(\\\([\s\S]*?\\\))/).map(function (part, i) {
      return i % 2 ? part : part.replace(/\b([xymd])_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");
    }).join("");
  }
  function lin(e, c, v) {
    var s = (e === 1 ? "" : e === -1 ? "−" : fs(e)) + v;
    if (c > 0) s += " + " + fs(c);
    if (c < 0) s += " − " + fs(-c);
    return s;
  }

  /* ---------- TeX formatting (inside \( … \)) ---------- */

  function tf(v) {
    if (!isFinite(v)) return "\\text{undefined}";
    if (isInt(v)) return String(Math.round(v));
    var a = Math.abs(v);
    for (var d = 2; d <= 96; d++) {
      var n = a * d;
      if (Math.abs(n - Math.round(n)) < 1e-7) return (v < 0 ? "-" : "") + "\\frac{" + Math.round(n) + "}{" + d + "}";
    }
    return String(Math.round(v * 100) / 100);
  }
  function tp(v) { return v < 0 ? "(" + tf(v) + ")" : tf(v); }
  function tpt(p) { return "(" + tf(p.x) + ", " + tf(p.y) + ")"; }
  function tx(s) { return "\\(" + s + "\\)"; }
  function tlin(e, c, v) {
    var s = (e === 1 ? "" : e === -1 ? "-" : tf(e)) + v;
    if (c > 0) s += " + " + tf(c);
    if (c < 0) s += " - " + tf(-c);
    return s;
  }
  /* "\( m_{AB} = \frac{y_B - y_A}{x_B - x_A} \)" with the numbers put in. */
  function slopeTex(A, B, nA, nB) {
    return tx("m_{" + nA + nB + "} = \\frac{" + tf(B.y) + " - " + tp(A.y) + "}{" + tf(B.x) + " - " + tp(A.x) + "} = " + tf(slope(A, B)));
  }
  var F_SLOPE = tx("m = \\frac{y_2 - y_1}{x_2 - x_1}");
  var F_DIST = tx("d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}");
  var F_MID = tx("M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)");
  var F_SEC = tx("P = \\left(\\frac{n x_1 + m x_2}{m + n}, \\frac{n y_1 + m y_2}{m + n}\\right)");
  var F_CEN = tx("G = \\left(\\frac{x_1 + x_2 + x_3}{3}, \\frac{y_1 + y_2 + y_3}{3}\\right)");
  var YESNO = [L("Yes", "是"), L("No", "否")];
  /* Prefix a judge message, e.g. "Slope of AB: …", keeping both languages. */
  function badAs(r, en, zh) {
    var m = r.msg && typeof r.msg === "object" ? r.msg : { en: r.msg, zh: r.msg };
    return bad(L(en + (m.en || "check Δy ÷ Δx."), zh + (m.zh || "檢查 Δy ÷ Δx。")), r.soft);
  }

  /* ---------- answers ---------- */

  var UNDEF = /^(undefined|undef|und|none|nil|∞|inf|infinity|nan|不存在|無定義|未定義|没有|沒有)$/i;

  function parseVal(raw) {
    var s = String(raw == null ? "" : raw).trim().toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[−–—]/g, "-")
      .replace(/sqrt|root/g, "√")
      .replace(/[×*]/g, "*")
      .replace(/÷/g, "/")
      .replace(/（/g, "(").replace(/）/g, ")")
      .replace(/^\+/, "");
    if (!s) return { empty: true, v: NaN };
    if (UNDEF.test(s)) return { v: Infinity, undef: true };
    if (/[,，]/.test(s)) return { v: NaN, comma: true };
    var i = 0;
    function peek() { return s.charAt(i); }
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "-") {
        var op = s.charAt(i++), w = term();
        v = op === "+" ? v + w : v - w;
      }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var c = peek();
        if (c === "*" || c === "/") { i++; var w = unary(); v = c === "*" ? v * w : v / w; }
        else if (c === "√" || c === "(") v *= unary();
        else return v;
      }
    }
    function unary() {
      if (peek() === "-") { i++; return -unary(); }
      if (peek() === "+") { i++; return unary(); }
      return primary();
    }
    function primary() {
      var c = peek();
      if (c === "√") { i++; return Math.sqrt(primary()); }
      if (c === "(") {
        i++;
        var v = expr();
        if (peek() !== ")") throw new Error("bracket");
        i++;
        return v;
      }
      var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw new Error("number");
      i += m[0].length;
      return parseFloat(m[0]);
    }
    try {
      var v = expr();
      if (i !== s.length || !isFinite(v)) return { v: NaN };
      return { v: v, exact: s.indexOf("√") >= 0 };
    } catch (e) {
      return { v: NaN };
    }
  }

  var OK = { ok: true };
  var REC = null;
  function bad(m, soft) { return { ok: false, msg: m || "", soft: !!soft }; }

  function numJudge(f, ans, wrongs, o) {
    o = o || {};
    if (REC) REC.push({ f: f, k: "num", a: ans });
    var v = f.v;
    if (ans === Infinity) return v === Infinity ? OK : bad(o.undefMsg || L("This line is vertical: Δx = 0, and you cannot divide by 0. Its slope is undefined.", "這條線是鉛垂線：Δx = 0，不能除以 0，所以斜率不存在。"));
    if (v === Infinity) return bad(o.notUndef || L("This value does exist. Only a vertical line has an undefined slope.", "這個值是存在的。只有鉛垂線的斜率才不存在。"));
    if (eq(v, ans)) return OK;
    if (o.approx && Math.abs(v - ans) <= o.approx) return OK;
    for (var i = 0; i < (wrongs || []).length; i++) {
      var w = wrongs[i];
      if (isFinite(w.v) && !eq(w.v, ans) && eq(v, w.v)) return bad(w.m);
    }
    if (Math.abs(v - ans) < 0.02) return bad(L("Very close, but give the exact value (a fraction such as 13/8), not a rounded decimal.", "很接近了，但請給出準確值（例如分數 13/8），不要用四捨五入的小數。"), true);
    return bad(o.generic ? o.generic(v) : "");
  }

  function ptJudge(f, ans, wrongs, o) {
    o = o || {};
    if (REC) REC.push({ f: f, k: "pt", a: ans });
    var x = f.x.v, y = f.y.v;
    if (eq(x, ans.x) && eq(y, ans.y)) return OK;
    for (var i = 0; i < (wrongs || []).length; i++) {
      var w = wrongs[i];
      if (w.p && !same(w.p, ans) && eq(x, w.p.x) && eq(y, w.p.y)) return bad(w.m);
    }
    if (eq(x, ans.y) && eq(y, ans.x) && !eq(ans.x, ans.y)) return bad(L("x and y are swapped. A coordinate pair is (x, y): across first, then up.", "x 和 y 調轉了。坐標是 (x, y)：先橫後直。"));
    if (Math.abs(x - ans.x) < 0.02 && Math.abs(y - ans.y) < 0.02) return bad(L("Very close, but give exact values (fractions such as 7/2 are fine), not rounded decimals.", "很接近了，但請給出準確值（可以用分數如 7/2），不要用四捨五入的小數。"), true);
    return bad(o.generic ? o.generic(pt(x, y)) : "");
  }

  function ratioJudge(f, r, s, o) {
    o = o || {};
    if (REC) REC.push({ f: f, k: "ratio", a: [r, s] });
    var a = f.r.v, b = f.s.v;
    if (!(a > 0 && b > 0)) return bad(L("Both parts of a ratio must be positive numbers.", "比的兩項都必須是正數。"), true);
    if (eq(a * s, b * r)) return OK;
    if (eq(a * r, b * s)) return bad(o.flip || L("Upside down. The first number is the part next to the first letter.", "前後調轉了。第一個數是靠近第一個字母的那一段。"));
    return bad(o.generic ? o.generic(a, b) : "");
  }

  function distWrongs(A, B) {
    var dx = B.x - A.x, dy = B.y - A.y;
    return [
      { v: dx * dx + dy * dy, m: L("You forgot the square root at the end.", "最後忘了開平方根。") },
      { v: Math.abs(dx) + Math.abs(dy), m: L("That's the route along the grid lines (Δx + Δy). Bo swims straight across, so use Pythagoras: √(Δx² + Δy²).", "這是沿格線走的路程（Δx + Δy）。Bo 是直線游過去的，要用畢氏定理：√(Δx² + Δy²)。") },
      { v: Math.sqrt(Math.pow(A.x + B.x, 2) + Math.pow(A.y + B.y, 2)), m: L("You added the coordinates. Subtract them: (x₂ − x₁) and (y₂ − y₁).", "你把坐標相加了。應該相減：(x₂ − x₁) 和 (y₂ − y₁)。") },
      { v: Math.sqrt(Math.pow(Math.abs(B.x) - Math.abs(A.x), 2) + Math.pow(Math.abs(B.y) - Math.abs(A.y), 2)), m: L("Careful with negative coordinates: subtracting a negative means adding, e.g. 3 − (−2) = 5.", "小心負坐標：減去負數等於加，例如 3 − (−2) = 5。") },
    ];
  }

  function distLines(A, B, nA, nB) {
    var dx = B.x - A.x, dy = B.y - A.y, N = dx * dx + dy * dy, r = Math.sqrt(N);
    var last = "= √(" + par(dx) + "² + " + par(dy) + "²) = √" + fs(N);
    if (isInt(r)) last += " = " + Math.round(r);
    else last += (isInt(N) && surd(N) !== "√" + N ? " = " + surd(N) : "") + " ≈ " + r.toFixed(2);
    return [nA + nB + " = √((x₂ − x₁)² + (y₂ − y₁)²)",
      "= √((" + fs(B.x) + " − " + par(A.x) + ")² + (" + fs(B.y) + " − " + par(A.y) + ")²)", last];
  }

  function slopeWrongs(A, B) {
    var dx = B.x - A.x, dy = B.y - A.y;
    return [
      { v: dy === 0 ? NaN : dx / dy, m: L("Upside down: slope = Δy ÷ Δx (rise over run), not Δx ÷ Δy.", "上下調轉了：斜率 = Δy ÷ Δx，不是 Δx ÷ Δy。") },
      { v: dx === 0 ? NaN : -dy / dx, m: L("Sign slip. Keep the same order on top and bottom: (y₂ − y₁) ÷ (x₂ − x₁).", "正負號錯了。分子分母要用相同次序相減：(y₂ − y₁) ÷ (x₂ − x₁)。") },
    ];
  }

  function slopeLines(A, B, nA, nB) {
    var dx = B.x - A.x, dy = B.y - A.y;
    return [ms(nA + nB) + " = (y₂ − y₁) ÷ (x₂ − x₁)",
      "= (" + fs(B.y) + " − " + par(A.y) + ") ÷ (" + fs(B.x) + " − " + par(A.x) + ")",
      "= " + fs(dy) + " ÷ " + pf(dx) + " = " + fs(slope(A, B))];
  }
  function slopeShort(A, B, nA, nB) {
    return ms(nA + nB) + " = (" + fs(B.y) + " − " + par(A.y) + ") ÷ (" + fs(B.x) + " − " + par(A.x) + ") = " + fs(slope(A, B));
  }

  function slopeField(id, nm) { return { id: id, type: "num", label: tx("m_{" + nm + "} ="), undef: true, ph: L("e.g. −3/4", "例如 −3/4") }; }

  /* ================================================================
   * Rounds
   * Each round: gen(o) → P · pts(P) for the map · draw(S, P) · steps(P) → [{ task, fields, judge, show, work }]
   * ================================================================ */

  var R = {};

  /* ---------- Warm-up ---------- */

  R.read = {
    topic: "intro", title: L("Where is Bo?", "Bo 在哪裏？"),
    gen: function () {
      return loop(function () {
        var x = nz(-7, 7), y = nz(-6, 6);
        return Math.abs(x) !== Math.abs(y) ? { bo: pt(x, y) } : null;
      });
    },
    pts: function (P) { return [P.bo, pt(-3, -2), pt(3, 2)]; },
    draw: function (S, P) { S.boG = wIcon(S, S.base, P.bo, "bo"); wTag(S, S.base, P.bo, L("Bo", "Bo"), { below: 1 }); },
    steps: function (P) {
      var b = P.bo;
      return [{
        kicker: L("Reading coordinates", "讀坐標"),
        q: L("Command can only send help to an exact spot. Write Bo's position as <b>(x, y)</b>.", "指揮部只能把救援送到準確的位置。寫出 Bo 的坐標 <b>(x, y)</b>。"),
        how: L("From O: count across for x, then up or down for y.", "從 O 出發：先數橫向是 x，再數上下是 y。"),
        fields: [{ id: "b", type: "pt", label: L("Bo is at", "Bo 在") }],
        action: L("Ping sonar", "發出聲納"),
        answer: { b: b },
        hints: [
          L("Start at O. Count squares across to Bo first: that is x.", "從 O 開始，先數到 Bo 的橫向格數：那是 x。"),
          L("Then count up or down: that is y.", "再數上下：那是 y。"),
          L("Left of the y-axis, x is negative; below the x-axis, y is negative.", "y 軸左邊 x 為負；x 軸下方 y 為負。")],
        judge: function (v) {
          var x = v.b.x.v, y = v.b.y.v;
          if (!(eq(x, b.x) && eq(y, b.y)) && eq(Math.abs(x), Math.abs(b.x)) && eq(Math.abs(y), Math.abs(b.y)))
            return bad(L("Right distances, wrong signs. Left of the y-axis, x is negative; below the x-axis, y is negative.",
              "距離對了，正負號錯了。y 軸左邊 x 為負；x 軸下方 y 為負。"));
          return ptJudge(v.b, b, []);
        },
        show: function (S, v, res, done) {
          var q = pt(v.b.x.v, v.b.y.v);
          wLine(S, S.fx, pt(b.x, 0), b, { c: C.gd, dash: "6 6" });
          wLine(S, S.fx, pt(0, b.y), b, { c: C.gd, dash: "6 6" });
          if (S.inView(q)) wPin(S, S.fx, q, res.ok ? C.ok : C.rd, fp(q));
          SFX.ping();
          wait(700, done);
        },
        workTex: [tx("x = " + tf(b.x)), tx("y = " + tf(b.y)), L("Bo is at " + fp(b) + ".", "Bo 在 " + fp(b) + "。")],
      }];
    },
  };

  R.count = {
    topic: "intro", title: L("Count the squares", "數格距離"),
    gen: function () {
      return loop(function () {
        var a = ri(-8, -1), b = ri(2, 8), k = nz(-5, 5);
        if (b - a < 4) return null;
        var vert = Math.random() < 0.5, swap = Math.random() < 0.5;
        var A = vert ? pt(k, a) : pt(a, k), B = vert ? pt(k, b) : pt(b, k);
        return swap ? { A: B, B: A, vert: vert } : { A: A, B: B, vert: vert };
      });
    },
    pts: function (P) { return [P.A, P.B, pt(-2, -2), pt(2, 2)]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.A, "bo");
      wIcon(S, S.base, P.B, "ferry");
      wTag(S, S.base, P.A, L("Bo " + fp(P.A), "Bo " + fp(P.A)), { up: 1 });
      wTag(S, S.base, P.B, L("Ferry " + fp(P.B), "渡輪 " + fp(P.B)), { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, d = dist(A, B), axis = P.vert ? "y" : "x";
      var a = P.vert ? A.y : A.x, b = P.vert ? B.y : B.x;
      return [{
        kicker: P.vert ? L("Distance on a vertical line", "鉛垂線上的距離") : L("Distance on a horizontal line", "水平線上的距離"),
        q: L("The ferry captain must know how close Bo is before moving. Find the distance between Bo and the ferry.", "渡輪船長開船前要知道 Bo 有多近。求 Bo 與渡輪之間的距離。"),
        how: P.vert ? L("Same x-coordinate — count along y.", "x 相同 — 沿 y 方向數格。") : L("Same y-coordinate — count along x.", "y 相同 — 沿 x 方向數格。"),
        formula: P.vert ? tx("d = |y_2 - y_1|") : tx("d = |x_2 - x_1|"),
        fields: [{ id: "d", type: "num", label: L("Distance", "距離"), unit: L("units", "單位") }],
        action: L("Measure", "量度"),
        answer: { d: d },
        hints: [
          L("Same " + (P.vert ? "x" : "y") + "-coordinate, so only the " + axis + "-coordinates change.", "兩點的 " + (P.vert ? "x" : "y") + " 相同，只有 " + axis + " 坐標改變。"),
          L("Distance = |" + axis + "₂ − " + axis + "₁|.", "距離 = |" + axis + "₂ − " + axis + "₁|。")],
        judge: function (v) {
          if (v.d.v < 0) return bad(L("A distance is never negative.", "距離不能是負數。"));
          return numJudge(v.d, d, [{ v: Math.abs(Math.abs(b) - Math.abs(a)), m: L("Bo and the ferry are on opposite sides of the axis. Use |" + axis + "₂ − " + axis + "₁|.",
            "Bo 與渡輪在軸的兩側。用 |" + axis + "₂ − " + axis + "₁|。") }]);
        },
        show: function (S, v, res, done) {
          var Ln = v.d.v, dir = mul(sub(B, A), 1 / d), end = add(A, mul(dir, Ln));
          wGrow(S, S.fx, A, end, { c: res.ok ? C.ok : C.rd, w: 4 }, 600, function () {
            for (var k = 1; k < Ln; k++) wDot(S, S.fx, add(A, mul(dir, k)), C.gd, 3);
            wait(400, done);
          });
        },
        workTex: [
          tx("d = |" + axis + "_2 - " + axis + "_1|"),
          tx("= |" + tf(b) + " - " + tp(a) + "| = " + tf(d))],
      }];
    },
  };

  var TRIPLES = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]];

  R.pyth = {
    topic: "dist", title: L("Pythagoras on the grid", "格線上的畢氏定理"),
    gen: function () {
      return loop(function () {
        var t = pick(TRIPLES), A = pt(ri(-6, 6), ri(-5, 5));
        var B = add(A, pt(sgn() * t[0], sgn() * t[1]));
        return allWithin([B], 11) ? { A: A, B: B } : null;
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.A, "bo");
      wIcon(S, S.base, P.B, "pier");
      wTag(S, S.base, P.A, L("Bo " + fp(P.A), "Bo " + fp(P.A)), { away: P.B });
      wTag(S, S.base, P.B, L("Pier " + fp(P.B), "碼頭 " + fp(P.B)), { away: P.A });
    },
    steps: function (P) {
      var A = P.A, B = P.B, d = dist(A, B), K = pt(B.x, A.y);
      var dx = B.x - A.x, dy = B.y - A.y, N = dx * dx + dy * dy;
      return [{
        kicker: L("Distance formula", "距離公式"),
        q: L("A rescue rope will run straight from the pier to Bo. How long must it be? Find the <b>straight-line distance</b>.", "救援繩會由碼頭直拉到 Bo。繩要多長？求兩者的<b>直線距離</b>。"),
        how: L("Use Δx and Δy in the distance formula.", "用 Δx、Δy 代入距離公式。"),
        formula: F_DIST,
        fields: [{ id: "d", type: "num", label: L("Straight-line distance", "直線距離"), unit: L("units", "單位"), ph: L("e.g. √41", "例如 √41") }],
        action: L("Measure", "量度"),
        answer: { d: distAns(A, B) },
        hints: [
          L("Δx and Δy form a right-angled triangle; the straight line is the hypotenuse.", "Δx 和 Δy 構成直角三角形；直線是斜邊。"),
          L("Δx = |x₂ − x₁|, Δy = |y₂ − y₁|.", "Δx = |x₂ − x₁|，Δy = |y₂ − y₁|。"),
          L("d = √(Δx² + Δy²).", "d = √(Δx² + Δy²)。")],
        judge: function (v) { return numJudge(v.d, d, distWrongs(A, B), { approx: 0.01 }); },
        show: function (S, v, res, done) {
          wLine(S, S.fx, A, K, { c: C.gd, w: 3 });
          wLine(S, S.fx, K, B, { c: C.gd, w: 3 });
          wRight(S, S.fx, K, sub(A, K), sub(B, K), C.gd);
          wTag(S, S.fx, mid(A, K), "Δx = " + Math.abs(B.x - A.x), { c: C.gd, below: 1 });
          wTag(S, S.fx, mid(K, B), "Δy = " + Math.abs(B.y - A.y), { c: C.gd, side: 1 });
          if (v.d.v > 0 && v.d.v < 40) wRing(S, S.fx, A, v.d.v, { c: res.ok ? C.ok : C.rd, dash: "8 6", grow: 700 });
          wGrow(S, S.fx, A, B, { c: res.ok ? C.ok : C.cy, w: 3 }, 700, function () { wait(300, done); });
        },
        workTex: [
          F_DIST,
          tx("= \\sqrt{(" + tf(B.x) + " - " + tp(A.x) + ")^2 + (" + tf(B.y) + " - " + tp(A.y) + ")^2}"),
          tx("= \\sqrt{" + tp(dx) + "^2 + " + tp(dy) + "^2} = \\sqrt{" + N + "}" + (isInt(d) ? " = " + Math.round(d) : " \\approx " + d.toFixed(2)))],
      }];
    },
  };

  /* ---------- Chapter 1 · distance ---------- */

  function placeAt(C0, want, R0, used) {
    return loop(function () {
      var dx = ri(-9, 9), dy = ri(-6, 9), N = dx * dx + dy * dy, d = Math.sqrt(N);
      if (N < 4 || Math.abs(d - R0) < 0.35) return null;
      if ((d < R0) !== want) return null;
      var p = add(C0, pt(dx, dy));
      if (!within(p, 11) || p.y < -3) return null;
      for (var i = 0; i < used.length; i++) if (d2(p, used[i]) < 9) return null;
      return p;
    });
  }

  function ringRound(kind) {
    var hosp = kind === "hospital";
    var NAME = hosp ? L("Hospital", "醫院") : L("School", "學校");
    var the = hosp ? L("the hospital", "醫院") : L("the school", "學校");
    return {
      topic: "dist", title: hosp ? L("The hospital", "醫院") : L("The school", "學校"),
      gen: function () {
        return loop(function () {
          var Cb = pt(ri(-4, 4), ri(-3, 3)), dx, dy, N;
          if (kind === "hospital") { var t = pick([[3, 4], [4, 3], [6, 8], [8, 6]]); dx = t[0]; dy = t[1]; }
          else { dx = ri(2, 7); dy = ri(2, 7); }
          N = dx * dx + dy * dy;
          var d = Math.sqrt(N);
          if (kind !== "hospital" && isInt(d)) return null;
          var H = add(Cb, pt(sgn() * dx, sgn() * dy));
          if (!within(H, 11)) return null;
          if (H.x >= 0 && H.y >= 0 && Cb.x >= 0 && Cb.y >= 0) return null;
          var cands = [Math.floor(d) - 1, Math.floor(d), Math.ceil(d), Math.ceil(d) + 1].filter(function (r) { return r >= 3 && Math.abs(r - d) >= 0.3; });
          if (!cands.length) return null;
          return { C: Cb, H: H, R: pick(cands), name: kind === "hospital" ? "Hospital" : "School" };
        });
      },
      pts: function (P) { return [P.C, P.H, add(P.C, pt(P.R, P.R)), add(P.C, pt(-P.R, -P.R))]; },
      draw: function (S, P) {
        S.boG = wIcon(S, S.base, P.C, "bo");
        S.hG = wIcon(S, S.base, P.H, kind === "hospital" ? "hospital" : "school");
        wTag(S, S.base, P.C, "Bo C" + fp(P.C), { lift: 1, away: P.H });
        wTag(S, S.base, P.H, L(NAME.en + " H" + fp(P.H), NAME.zh + " H" + fp(P.H)), { lift: 1, away: P.C });
      },
      steps: function (P) {
        var d = dist(P.C, P.H), inside = d < P.R, R = P.R, dd = d.toFixed(2).replace(/\.00$/, "");
        var dx = P.H.x - P.C.x, dy = P.H.y - P.C.y, N = dx * dx + dy * dy;
        var dTex = isInt(d) ? String(Math.round(d)) : "\\sqrt{" + N + "}" + (surd(N) !== "√" + N ? " = " + surd(N).replace(/√(\d+)/, "\\sqrt{$1}") : "") + " \\approx " + d.toFixed(2);
        function tp(v) { return v < 0 ? "(" + MINUS + Math.abs(v) + ")" : String(v); }
        function tn(v) { return v < 0 ? MINUS + Math.abs(v) : String(v); }
        return [{
          kicker: L("Distance formula", "距離公式"),
          q: L("Typhoon warning! Every building <b>within " + R + " units</b> of Bo must evacuate. Does " + the.en + " need to evacuate?",
            "颱風警告！距離 Bo <b>" + R + " 單位以內</b>的建築物都要撤離。" + the.zh + "要撤離嗎？"),
          how: L("Find the distance CH, then compare it with " + R + ".", "先求距離 CH，再和 " + R + " 比較。"),
          formula: "\\(CH = \\sqrt{(x_H - x_C)^2 + (y_H - y_C)^2}\\)",
          fields: [
            { id: "d", type: "num", label: "\\(CH =\\)", unit: L("units", "單位"), ph: hosp ? "" : L("e.g. √41", "例如 √41") },
            { id: "act", type: "choice", label: NAME, opts: [L("Evacuate", "撤離"), L("Safe", "安全")] },
          ],
          action: L("Send orders", "發出指令"),
          answer: { d: distAns(P.C, P.H), act: inside ? 0 : 1 },
          hints: [
            L("Subtract the coordinates of C from those of H: \\(x_H - x_C\\) and \\(y_H - y_C\\). Watch the negative signs.", "用 H 的坐標減 C 的坐標：\\(x_H - x_C\\) 和 \\(y_H - y_C\\)。小心負號。"),
            hosp ? L("The distance is a whole number this time.", "這次的距離是整數。") : L("The distance is a surd this time. Leave it as \\(\\sqrt{n}\\), or give it to 2 decimal places.", "這次的距離是根式，可寫成 \\(\\sqrt{n}\\)，或取至兩位小數。"),
            L("If CH < " + R + ", the building is inside the danger zone: evacuate.", "如果 CH < " + R + "，建築物在危險範圍內：要撤離。")],
          judge: function (v) {
            var r = numJudge(v.d, d, distWrongs(P.C, P.H), { approx: 0.01 });
            if (!r.ok) return r;
            if (v.act !== (inside ? 0 : 1)) return bad(inside
              ? L("CH = " + dd + ", which is less than " + R + ". So " + the.en + " is inside the danger zone and must evacuate.", "CH = " + dd + "，小於 " + R + "，所以" + the.zh + "在危險範圍內，要撤離。")
              : L("CH = " + dd + ", which is more than " + R + ". So " + the.en + " is outside the danger zone and is safe.", "CH = " + dd + "，大於 " + R + "，所以" + the.zh + "在危險範圍外，是安全的。"));
            return { ok: true, exact: v.d.exact && !isInt(d) };
          },
          workTex: [
            "\\(CH = \\sqrt{(x_H - x_C)^2 + (y_H - y_C)^2}\\)",
            "\\(= \\sqrt{(" + tn(P.H.x) + " - " + tp(P.C.x) + ")^2 + (" + tn(P.H.y) + " - " + tp(P.C.y) + ")^2}\\)",
            "\\(= \\sqrt{" + tp(dx) + "^2 + " + tp(dy) + "^2} = " + dTex + "\\)",
            inside ? L("\\(" + dd + " < " + R + "\\), so " + the.en + " must <b>evacuate</b>.", "\\(" + dd + " < " + R + "\\)，所以" + the.zh + "要<b>撤離</b>。")
              : L("\\(" + dd + " > " + R + "\\), so " + the.en + " is <b>safe</b>.", "\\(" + dd + " > " + R + "\\)，所以" + the.zh + "是<b>安全</b>的。")],
          show: function (S, v, res, done) {
            wRing(S, S.fx, P.C, P.R, { c: C.cy, fill: "rgba(34,227,255,.08)", grow: 700 });
            if (!res.ok && v.d.v > 0 && v.d.v < 40 && !eq(v.d.v, d)) wRing(S, S.fx, P.C, v.d.v, { c: C.rd, dash: "6 6", grow: 700 });
            wGrow(S, S.fx, P.C, P.H, { c: C.gd, w: 2.5, dash: "4 6" }, 700, function () {
              if (res.ok) wBadge(S, S.fx, P.H, T(inside ? L("EVACUATE", "撤離") : L("SAFE", "安全")), inside ? C.rd : C.ok);
              SFX.ping();
              wait(400, done);
            });
          },
        }];
      },
    };
  }
  R.hospital = ringRound("hospital");

  var PLACES = [L("Ferry pier", "渡輪碼頭"), L("Night market", "夜市"), L("Clock tower", "鐘樓"), L("Museum", "博物館"), L("Harbour hotel", "海港酒店")];

  R.three = {
    topic: "dist", title: L("Three buildings", "三幢建築物"),
    gen: function () {
      var Cb = pt(ri(-3, 3), ri(-2, 2)), R0 = ri(5, 7);
      var wants = shuffle([true, false, Math.random() < 0.5]);
      var used = [Cb], list = [];
      var names = shuffle(PLACES.slice()).slice(0, 3);
      wants.forEach(function (w, i) { var p = placeAt(Cb, w, R0, used); used.push(p); list.push({ p: p, name: names[i], label: "DEF".charAt(i) }); });
      return { C: Cb, R: R0, list: list };
    },
    pts: function (P) { return [P.C].concat(P.list.map(function (o) { return o.p; })); },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.C, "bo");
      P.list.forEach(function (o) { wIcon(S, S.base, o.p, "bld"); });
      wTag(S, S.base, P.C, "Bo C" + fp(P.C), { up: 1, lift: 1 });
      P.list.forEach(function (o) { wTag(S, S.base, o.p, T(o.name) + " " + o.label + fp(o.p), { up: 1, lift: 1 }); });
    },
    steps: function (P) {
      var truth = P.list.map(function (o) { return dist(P.C, o.p) < P.R ? 0 : 1; });
      var R0 = P.R, R2 = R0 * R0;
      return [{
        kicker: L("Distance formula", "距離公式"),
        q: L("Bo's waves are dangerous within <b>" + R0 + " units</b> of C. For each building, compare its distance from C with " + R0 + ". Evacuate or Safe?", "Bo 掀起的浪在 C 周圍 <b>" + R0 + " 單位</b>內都有危險。比較每幢建築物與 C 的距離和 " + R0 + "：撤離還是安全？"),
        how: L("Compare d² with " + R0 + "² = " + R2 + " — no square root needed.", "比較 d² 與 " + R0 + "² = " + R2 + "，不用開方。"),
        formula: tx("d^2 = (\\Delta x)^2 + (\\Delta y)^2"),
        fields: P.list.map(function (o, i) { return { id: "b" + i, type: "choice", label: o.label + " · " + T(o.name), opts: [L("Evacuate", "撤離"), L("Safe", "安全")] }; }),
        action: L("Send orders", "發出指令"),
        answer: (function () { var a = {}; truth.forEach(function (t, i) { a["b" + i] = t; }); return a; })(),
        hints: [
          L("Work out CD, CE and CF with the distance formula.", "用距離公式求 CD、CE、CF。"),
          L("Compare each d² with " + R2 + ".", "把每個 d² 與 " + R2 + " 比較。")],
        judge: function (v) {
          var wrong = [];
          P.list.forEach(function (o, i) { if (v["b" + i] !== truth[i]) wrong.push(o.label); });
          if (!wrong.length) return OK;
          return bad(L("Recheck " + wrong.join(" and ") + ". Compare distance from C with " + R0 + ".",
            "請再檢查 " + wrong.join("、") + "。比較與 C 的距離和 " + R0 + "。"));
        },
        show: function (S, v, res, done) {
          wRing(S, S.fx, P.C, P.R, { c: C.cy, fill: "rgba(34,227,255,.08)", grow: 700 });
          wait(750, function () {
            P.list.forEach(function (o, i) {
              var ok = v["b" + i] === truth[i];
              wLine(S, S.fx, P.C, o.p, { c: ok ? C.gd : C.rd, dash: "4 6", w: 2 });
              if (res.ok) wBadge(S, S.fx, o.p, T(truth[i] ? L("SAFE", "安全") : L("EVACUATE", "撤離")), truth[i] ? C.ok : C.rd);
              else if (!ok) wBadge(S, S.fx, o.p, T(L("CHECK", "檢查")), C.rd);
            });
            SFX.ping();
            wait(400, done);
          });
        },
        workTex: P.list.map(function (o, i) {
          var N = d2(P.C, o.p), d = Math.sqrt(N);
          var cmp = truth[i] ? " > " : " < ";
          return L(tx("C" + o.label + ": d^2 = " + N + (isInt(d) ? ",\\ d = " + Math.round(d) : ",\\ d \\approx " + d.toFixed(2)) + cmp + R0 + " \\Rightarrow " + (truth[i] ? "\\text{Safe}" : "\\text{Evacuate}")),
            tx("C" + o.label + "：d^2 = " + N + cmp + R0 + " \\Rightarrow " + (truth[i] ? "\\text{安全}" : "\\text{撤離}")));
        }),
      }];
    },
  };

  var NORMS = (function () {
    var out = {};
    [25, 50, 65, 85, 100].forEach(function (N) {
      var list = [];
      for (var x = -10; x <= 10; x++) for (var y = -10; y <= 10; y++) if (x * x + y * y === N) list.push(pt(x, y));
      out[N] = list;
    });
    return out;
  })();

  R.station = {
    topic: "dist", title: L("The lifeboat station", "救生站"),
    gen: function () {
      return loop(function () {
        var N = pick([25, 50, 65]), vs = NORMS[N].filter(function (p) { return p.y > 0; });
        var u = pick(vs), w = pick(vs);
        if (u.x === w.x || u.y === w.y) return null;
        var t = ri(-4, 4), S0 = pt(t, 0), Pp = add(S0, u), Q = add(S0, w);
        if (!allWithin([Pp, Q], 11)) return null;
        return { t: t, P: Pp, Q: Q };
      });
    },
    pts: function (P) { return [P.P, P.Q, pt(P.t, 0), pt(P.t - 3, -2)]; },
    draw: function (S, P) {
      wShore(S, S.base);
      wIcon(S, S.base, P.P, "pier"); wIcon(S, S.base, P.Q, "pier");
      wTag(S, S.base, P.P, L("Pier P" + fp(P.P), "碼頭 P" + fp(P.P)), { up: 1 });
      wTag(S, S.base, P.Q, L("Pier Q" + fp(P.Q), "碼頭 Q" + fp(P.Q)), { up: 1 });
    },
    steps: function (P) {
      var A = P.P, B = P.Q, t = P.t;
      var lhs = B.x * B.x + B.y * B.y - A.x * A.x - A.y * A.y, k = 2 * (B.x - A.x);
      return [{
        kicker: L("Equal distances", "等距"),
        q: L("The lifeboat station on the shore (x-axis) must reach both piers equally fast. Find <b>t</b> so S(t, 0) is the same distance from P and Q.", "岸邊（x 軸）的救生站要同樣快到達兩個碼頭。求 <b>t</b>，使 S(t, 0) 與 P、Q 等距。"),
        how: L("Set PS² = QS² and solve for t.", "令 PS² = QS²，解出 t。"),
        formula: tx("PS^2 = QS^2"),
        fields: [{ id: "t", type: "num", label: "t", sub: tx("S(t, 0)") }],
        action: L("Build station", "建造救生站"),
        answer: { t: t },
        hints: [
          L("PS = QS ⇒ PS² = QS² — no square roots needed.", "PS = QS ⇒ PS² = QS²，不用開方。"),
          L("Expand (t − x_P)² + y_P² = (t − x_Q)² + y_Q².", "展開 (t − x_P)² + y_P² = (t − x_Q)² + y_Q²。"),
          L("The t² terms cancel; solve the linear equation.", "t² 項消去，解一次方程。")],
        judge: function (v) {
          var x = v.t.v;
          var mx = (A.x + B.x) / 2;
          var r = numJudge(v.t, t, [{ v: mx, m: L("That is halfway between the piers' x-coordinates — use PS² = QS² instead.",
            "那是兩碼頭 x 的中點 — 應用 PS² = QS²。") }],
            { generic: function (xv) { return L("With t = " + fs(xv) + ": PS ≠ QS. They must be equal.",
              "t = " + fs(xv) + " 時 PS ≠ QS，兩者必須相等。"); } });
          return r;
        },
        show: function (S, v, res, done) {
          var Sx = pt(v.t.v, 0);
          if (!S.inView(Sx)) { done(); return; }
          var g = wIcon(S, S.fx, Sx, "boat");
          wPin(S, S.fx, Sx, res.ok ? C.ok : C.rd, "S" + fp(Sx));
          var c = res.ok ? C.ok : C.gd;
          wGrow(S, S.fx, Sx, A, { c: c, w: 2.5 }, 600);
          wGrow(S, S.fx, Sx, B, { c: c, w: 2.5 }, 600, function () {
            wTag(S, S.fx, mid(Sx, A), "√" + fs(d2(Sx, A)), { c: c });
            wTag(S, S.fx, mid(Sx, B), "√" + fs(d2(Sx, B)), { c: c });
            wait(300, done);
          });
          return g;
        },
        workTex: [
          tx("PS^2 = QS^2"),
          tx("(t - " + tp(A.x) + ")^2 + " + tp(A.y) + "^2 = (t - " + tp(B.x) + ")^2 + " + tp(B.y) + "^2"),
          tx(tf(k) + "t = " + tf(lhs) + " \\Rightarrow t = " + tf(t))],
      }];
    },
  };

  /* ---------- Chapter 2 · slope ---------- */

  R.heading = {
    topic: "slope", title: L("Which way is Bo heading?", "Bo 朝哪個方向游？"),
    gen: function () {
      return loop(function () {
        var A = pt(ri(-7, 4), ri(-2, 5)), B = add(A, pt(nz(-6, 6), nz(-6, 6)));
        return within(B, 10) && B.y >= -2 && Math.abs(B.x - A.x) !== Math.abs(B.y - A.y) ? { A: A, B: B } : null;
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.B, "bo");
      wPin(S, S.base, P.A, C.mut, "A" + fp(P.A) + " · 2:20", besideLine(P.A, P.B));
      wTag(S, S.base, P.B, "B" + fp(P.B) + " · 2:25", { lift: 1, away: besideLine(P.B, P.A) });
    },
    steps: function (P) {
      var A = P.A, B = P.B, m = slope(A, B);
      return [{
        kicker: L("Slope of a line", "直線斜率"),
        q: L("To predict where Bo goes next, we need its direction — the slope. Bo swam from A to B. Find the <b>slope of AB</b>.", "要預測 Bo 下一步去哪，就要知道它的方向——斜率。Bo 從 A 游到 B。求 <b>AB 的斜率</b>。"),
        how: L("Use Δy ÷ Δx in the same order.", "用相同次序的 Δy ÷ Δx。"),
        formula: F_SLOPE,
        fields: [slopeField("m", "AB")],
        action: L("Plot the path", "畫出路徑"),
        answer: { m: m },
        hints: [
          L("Slope = rise ÷ run = Δy ÷ Δx.", "斜率 = 升 ÷ 跑 = Δy ÷ Δx。"),
          L("Δy = y_B − y_A, Δx = x_B − x_A.", "Δy = y_B − y_A，Δx = x_B − x_A。"),
          L("Downhill left to right → negative slope.", "由左至右向下降 → 負斜率。")],
        judge: function (v) { return numJudge(v.m, m, slopeWrongs(A, B)); },
        show: function (S, v, res, done) {
          var s = v.m.v, dir = s === Infinity ? pt(0, sgnOf(B.y - A.y)) : pt(sgnOf(B.x - A.x), sgnOf(B.x - A.x) * s);
          var end = S.ray(A, dir);
          wGrow(S, S.fx, A, end, { c: res.ok ? C.ok : C.rd, w: 3 }, 700, function () {
            if (res.ok) {
              var K = pt(B.x, A.y);
              wLine(S, S.fx, A, K, { c: C.gd, w: 2, dash: "5 5" }); wLine(S, S.fx, K, B, { c: C.gd, w: 2, dash: "5 5" });
              wTag(S, S.fx, mid(A, K), "Δx = " + fs(B.x - A.x), { c: C.gd, below: 1 });
              wTag(S, S.fx, mid(K, B), "Δy = " + fs(B.y - A.y), { c: C.gd, side: 1 });
            } else wRing(S, S.fx, B, 0.6, { c: C.rd, w: 3 });
            wait(350, done);
          });
        },
        workTex: [slopeTex(A, B, "A", "B")],
      }];
    },
  };

  function sgnOf(v) { return v < 0 ? -1 : 1; }

  var TRACK_TYPES = [L("Positive", "正"), L("Negative", "負"), L("Zero", "零"), L("Undefined", "不存在")];

  R.tracks = {
    topic: "slope", title: L("Patrol boat tracks", "巡邏船航跡"),
    gen: function () {
      var types = shuffle([0, 1, 2, 3]);
      /* Four tracks side by side in the upper half; labels sit in a row underneath. */
      var cx = [-9, -3, 3, 9];
      return {
        list: types.map(function (t, i) {
          var c = pt(cx[i], 4.2), d;
          if (t === 0) d = pick([pt(3, 3), pt(2.6, 3.4), pt(3.4, 2.4)]);
          else if (t === 1) d = pick([pt(3, -3), pt(2.6, -3.4), pt(3.4, -2.4)]);
          else if (t === 2) d = pt(4, 0);
          else d = pt(0, 3.8);
          return { t: t, a: sub(c, mul(d, 0.5)), b: add(c, mul(d, 0.5)), c: c };
        }),
      };
    },
    pts: function () { return [pt(-11.5, 0), pt(11.5, 6.6)]; },
    draw: function (S, P) {
      S.trackG = [];
      P.list.forEach(function (o, i) {
        S.trackG.push(wLine(S, S.base, o.a, o.b, { c: C.cy, w: 4 }));
        wIcon(S, S.base, o.b, "boat");
        wTag(S, S.base, pt(o.c.x, 1.2), L("Track " + (i + 1), "航跡 " + (i + 1)), { c: C.ink, anchor: "middle", size: 17 });
      });
    },
    steps: function (P) {
      return [{
        kicker: L("Sign of a slope", "斜率正負"),
        q: L("Patrol boats report their tracks. Rising, falling, flat or vertical tells the team which way each boat is moving. Classify each slope — no calculation.", "巡邏船回報航跡。上升、下降、水平或鉛垂，告訴隊伍每艘船往哪走。判斷每條航跡的斜率類型，不用計算。"),
        how: L("Read left → right on the map.", "在圖上由左讀至右。"),
        fields: P.list.map(function (o, i) { return { id: "t" + i, type: "choice", label: L("Track " + (i + 1), "航跡 " + (i + 1)), opts: TRACK_TYPES }; }),
        action: L("Log tracks", "記錄航跡"),
        answer: (function () { var a = {}; P.list.forEach(function (o, i) { a["t" + i] = o.t; }); return a; })(),
        hints: [
          L("Uphill left to right → positive.", "由左至右向上升 → 正。"),
          L("Horizontal: Δy = 0 → slope 0.", "水平：Δy = 0 → 斜率 0。"),
          L("Vertical: Δx = 0 → undefined.", "鉛垂：Δx = 0 → 不存在。")],
        judge: function (v) {
          var wrong = [], msgEn = "", msgZh = "";
          P.list.forEach(function (o, i) {
            if (v["t" + i] !== o.t) {
              wrong.push(i + 1);
              if (o.t === 2) { msgEn = " Track " + (i + 1) + " is horizontal (slope 0)."; msgZh = " 航跡 " + (i + 1) + " 是水平線（斜率 0）。"; }
              if (o.t === 3) { msgEn = " Track " + (i + 1) + " is vertical (undefined)."; msgZh = " 航跡 " + (i + 1) + " 是鉛垂線（不存在）。"; }
            }
          });
          return wrong.length ? bad(L("Recheck track " + wrong.join(" and ") + "." + msgEn, "請再檢查航跡 " + wrong.join("、") + "。" + msgZh)) : OK;
        },
        show: function (S, v, res, done) {
          P.list.forEach(function (o, i) {
            var ok = v["t" + i] === o.t;
            wLine(S, S.fx, o.a, o.b, { c: ok ? C.ok : C.rd, w: 5 });
            if (res.ok) wBadge(S, S.fx, o.a, T(TRACK_TYPES[o.t]), C.ok);
          });
          wait(500, done);
        },
        workTex: [
          L("Uphill: positive · downhill: negative · horizontal: 0 · vertical: undefined.",
            "向上升：正 · 向下降：負 · 水平：0 · 鉛垂：不存在。")],
      }];
    },
  };

  R.landfall = {
    topic: "slope", title: L("Where will Bo reach the shore?", "Bo 會在哪裏靠岸？"),
    gen: function (o) {
      o = o || {};
      var axis = o.axis || pick(["x", "y"]);
      return loop(function () {
        var v = dirv(4, 4), k = nz(-3, 3), A, X;
        if (axis === "x") { X = ri(-6, 6); A = pt(X + v.x * k, v.y * k); }
        else { X = ri(-6, 6); A = pt(v.x * k, X + v.y * k); }
        if (!within(A, 10) || A.x === 0 || A.y === 0) return null;
        return { axis: axis, A: A, m: v.y / v.x, X: X };
      });
    },
    pts: function (P) { return [P.A, P.axis === "x" ? pt(P.X, 0) : pt(0, P.X)]; },
    draw: function (S, P) {
      if (P.axis === "x") wShore(S, S.base);
      S.boG = wIcon(S, S.base, P.A, "bo");
      var end = P.axis === "x" ? pt(P.X, 0) : pt(0, P.X);
      wTag(S, S.base, P.A, L("Bo A" + fp(P.A), "Bo A" + fp(P.A)), { lift: 1, away: end });
      var dir = mul(sub(end, P.A), 0.22);
      wArrow(S, S.base, add(P.A, mul(dir, 0.35)), add(P.A, dir), C.gd);
    },
    steps: function (P) {
      var A = P.A, m = P.m, X = P.X, isX = P.axis === "x";
      var yInt = A.y - m * A.x, xInt = A.x - A.y / m;
      var wrongs = isX
        ? [{ v: A.x + A.y / m, m: L("Sign slip: Δx = Δy ÷ m.", "正負號錯了：Δx = Δy ÷ m。") },
          { v: A.x - A.y * m, m: L("Divide by m, don't multiply: Δx = Δy ÷ m.", "要除以 m，不是乘以 m：Δx = Δy ÷ m。") },
          { v: yInt, m: L("That is the y-intercept. The shore is the x-axis (y = 0).", "那是 y 截距。岸邊是 x 軸（y = 0）。") }]
        : [{ v: A.y + m * A.x, m: L("Sign slip: Δy = m × Δx.", "正負號錯了：Δy = m × Δx。") },
          { v: A.y - A.x / m, m: L("Multiply by m, don't divide: Δy = m × Δx.", "要乘以 m，不是除以 m：Δy = m × Δx。") },
          { v: xInt, m: L("That is the x-intercept. The breakwater is the y-axis (x = 0).", "那是 x 截距。防波堤是 y 軸（x = 0）。") }];
      return [{
        kicker: isX ? L("x-intercept", "x 截距") : L("y-intercept", "y 截距"),
        q: isX
          ? L("Bo keeps swimming straight with slope <b>" + fs(m) + "</b>. The shore is the x-axis — the team must wait where Bo lands. Find the <b>x-intercept</b>.", "Bo 以斜率 <b>" + fs(m) + "</b> 直游。岸邊就是 x 軸，隊伍要在 Bo 靠岸處等候。求 <b>x 截距</b>。")
          : L("Bo keeps swimming straight with slope <b>" + fs(m) + "</b>. The pier runs along the y-axis — where will Bo reach it? Find the <b>y-intercept</b>.", "Bo 以斜率 <b>" + fs(m) + "</b> 直游。碼頭沿 y 軸，Bo 會在哪裏到達？求 <b>y 截距</b>。"),
        how: isX ? L("On the x-axis, y = 0 — use the slope formula.", "在 x 軸上 y = 0，用斜率公式。") : L("On the y-axis, x = 0 — use the slope formula.", "在 y 軸上 x = 0，用斜率公式。"),
        formula: isX ? tx("\\frac{0 - y_A}{X - x_A} = m") : tx("\\frac{Y - y_A}{0 - x_A} = m"),
        fields: [{ id: "x", type: "num", label: isX ? L("x-intercept", "x 截距") : L("y-intercept", "y 截距") }],
        action: L("Send boats", "派出船隻"),
        answer: { x: X },
        hints: isX
          ? [L("Landing point (X, 0). Slope from A equals " + fs(m) + ".", "登岸點 (X, 0)。A 到此的斜率 = " + fs(m) + "。"),
            L("(0 − y_A) ÷ (X − x_A) = m. Solve for X.", "(0 − y_A) ÷ (X − x_A) = m，解 X。")]
          : [L("Landing point (0, Y). Slope from A equals " + fs(m) + ".", "登岸點 (0, Y)。A 到此的斜率 = " + fs(m) + "。"),
            L("(Y − y_A) ÷ (0 − x_A) = m. Solve for Y.", "(Y − y_A) ÷ (0 − x_A) = m，解 Y。")],
        judge: function (v) { return numJudge(v.x, X, wrongs); },
        show: function (S, v, res, done) {
          var Tgt = isX ? pt(X, 0) : pt(0, X), U = isX ? pt(v.x.v, 0) : pt(0, v.x.v);
          if (S.inView(U)) { wIcon(S, S.fx, U, "boat"); wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fs(v.x.v)); }
          wLine(S, S.fx, A, Tgt, { c: C.cy, w: 2, dash: "4 7" });
          wMove(S, S.boG, A, Tgt, 1100, function () {
            if (!res.ok) wRing(S, S.fx, Tgt, 0.7, { c: C.rd, w: 3 });
            SFX.splash();
            wait(350, done);
          });
        },
        workTex: isX
          ? [tx("\\frac{0 - " + tp(A.y) + "}{X - " + tp(A.x) + "} = " + tf(m)),
            tx("X - " + tp(A.x) + " = \\frac{" + tf(-A.y) + "}{" + tp(m) + "}"),
            tx("X = " + tf(X))]
          : [tx("\\frac{Y - " + tp(A.y) + "}{0 - " + tp(A.x) + "} = " + tf(m)),
            tx("Y - " + tp(A.y) + " = " + tf(m) + " \\times " + tp(-A.x)),
            tx("Y = " + tf(X))],
      }];
    },
  };

  R.lineup = {
    topic: "slope", title: L("Three in a line?", "三點共線？"),
    gen: function (o) {
      o = o || {};
      return loop(function () {
        var v = dirv(3, 3), A = pt(ri(-8, 0), ri(-2, 5)), k1 = ri(1, 2), k2 = k1 + ri(1, 2);
        var B = add(A, mul(v, k1)), L = add(A, mul(v, k2)), col = o.collinear || Math.random() < 0.5;
        if (!col) L = add(L, pt(0, sgn()));
        if (!allWithin([B, L], 10) || B.y < -2 || L.y < -2) return null;
        if (!col && Math.abs(cross(A, B, L)) < 1e-9) return null;
        return { A: A, B: B, L: L, col: col, story: !!o.collinear };
      });
    },
    pts: function (P) { return [P.A, P.B, P.L]; },
    draw: function (S, P) {
      wPin(S, S.base, P.A, C.mut, "A" + fp(P.A), besideLine(P.A, P.B));
      S.boG = wIcon(S, S.base, P.B, "bo");
      wIcon(S, S.base, P.L, "light");
      wTag(S, S.base, P.B, L("Bo B" + fp(P.B), "Bo B" + fp(P.B)), { lift: 1, away: besideLine(P.B, P.A) });
      wTag(S, S.base, P.L, L((P.story ? "Lightship L" : "Power station L") + fp(P.L), (P.story ? "燈船 L" : "發電站 L") + fp(P.L)), { lift: 1, away: besideLine(P.L, P.B) });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Lp = P.L, m1 = slope(A, B), m2 = slope(B, Lp), col = eq(m1, m2);
      return [{
        kicker: L("Collinear points", "共線"),
        q: L("Bo swims from A through B. Is lighthouse L straight ahead on the same path? Same slope for AB and BL means one straight line. Find both slopes.", "Bo 由 A 經 B 游去。燈塔 L 是否就在同一條直路上？AB 與 BL 斜率相同就是同一直線。求兩條斜率。"),
        how: L("Equal slopes through B ⇒ collinear.", "通過 B 的斜率相同 ⇒ 共線。"),
        formula: F_SLOPE,
        fields: [slopeField("m1", "AB"), slopeField("m2", "BL"), { id: "c", type: "choice", label: L("A, B, L collinear?", "A、B、L 共線？"), opts: YESNO }],
        action: L("Check heading", "檢查航向"),
        answer: { m1: m1, m2: m2, c: col ? 0 : 1 },
        hints: [
          L("m_AB and m_BL: Δy ÷ Δx each time.", "m_AB 和 m_BL：每次用 Δy ÷ Δx。"),
          L("Same slopes + point B in common → one line.", "斜率相同且共用 B → 同一直線。")],
        judge: function (v) {
          var r = numJudge(v.m1, m1, slopeWrongs(A, B));
          if (!r.ok) return badAs(r, "Slope of AB: ", "AB 的斜率：");
          r = numJudge(v.m2, m2, slopeWrongs(B, Lp));
          if (!r.ok) return badAs(r, "Slope of BL: ", "BL 的斜率：");
          if (v.c !== (col ? 0 : 1)) return bad(col
            ? L("Equal slopes through B, so A, B and L are collinear.", "通過 B 斜率相同，A、B、L 共線。")
            : L("Different slopes, so A, B and L are not collinear.", "斜率不同，A、B、L 不共線。"));
          return OK;
        },
        show: function (S, v, res, done) {
          var end = S.ray(A, sub(B, A));
          wGrow(S, S.fx, A, end, { c: res.ok ? C.ok : C.cy, w: 2.5, dash: "6 6" }, 900, function () {
            wRing(S, S.fx, Lp, 0.7, { c: col ? C.ok : C.rd, w: 3 });
            wait(350, done);
          });
        },
        workTex: [slopeTex(A, B, "A", "B"), slopeTex(B, Lp, "B", "L"),
          col ? L(tx("m_{AB} = m_{BL} \\Rightarrow \\text{collinear}"), tx("m_{AB} = m_{BL} \\Rightarrow \\text{共線}"))
            : L(tx("m_{AB} \\neq m_{BL} \\Rightarrow \\text{not collinear}"), tx("m_{AB} \\neq m_{BL} \\Rightarrow \\text{不共線}"))],
      }];
    },
  };

  R.boatR = {
    topic: "slope", title: L("A boat on the path", "路線上的船"),
    gen: function () {
      return loop(function () {
        var v = dirv(3, 3), A = pt(ri(-8, -2), ri(-2, 5)), k1 = ri(1, 2), k2 = k1 + ri(1, 2);
        var Q = add(A, mul(v, k1)), Rr = add(A, mul(v, k2));
        return allWithin([Q, Rr], 10) && Q.y >= -2 && Rr.y >= -2 ? { P: A, Q: Q, R: Rr } : null;
      });
    },
    pts: function (P) { return [P.P, P.Q, P.R, pt(P.R.x + 2, P.R.y)]; },
    draw: function (S, P) {
      wLine(S, S.base, S.ray(pt(0, P.R.y), pt(-1, 0)), S.ray(pt(0, P.R.y), pt(1, 0)), { c: "rgba(255,198,90,.4)", w: 2, op: 0.55 });
      wPin(S, S.base, P.P, C.mut, "P" + fp(P.P), besideLine(P.P, P.Q));
      S.boG = wIcon(S, S.base, P.Q, "bo");
      wTag(S, S.base, P.Q, "Bo Q" + fp(P.Q), { lift: 1, away: besideLine(P.Q, P.P) });
      wTag(S, S.base, pt(S.x0 + 0.6, P.R.y), "y = " + fs(P.R.y), { c: C.gd, anchor: "start", up: 1 });
    },
    steps: function (P) {
      var A = P.P, Q = P.Q, Rr = P.R, m = slope(A, Q);
      return [{
        kicker: L("Collinear points", "共線"),
        q: L("To intercept Bo, the boat R(r, " + fs(Rr.y) + ") must sit right on Bo's path PQ — so PR has the same slope as PQ. Find <b>r</b>.", "要截住 Bo，船 R(r, " + fs(Rr.y) + ") 必須正好在 Bo 的路線 PQ 上——即 PR 與 PQ 斜率相同。求 <b>r</b>。"),
        how: L("Set m_QR = m_PQ and solve for r.", "令 m_QR = m_PQ，解 r。"),
        formula: tx("m_{QR} = m_{PQ}"),
        fields: [{ id: "r", type: "num", label: "r" }],
        action: L("Place boat", "放置船隻"),
        answer: { r: Rr.x },
        hints: [
          L("Collinear ⇒ m_QR = m_PQ.", "共線 ⇒ m_QR = m_PQ。"),
          L("(" + fs(Rr.y) + " − y_Q) ÷ (r − x_Q) = m_PQ. Solve for r.", "(" + fs(Rr.y) + " − y_Q) ÷ (r − x_Q) = m_PQ，解 r。")],
        judge: function (v) {
          return numJudge(v.r, Rr.x, [{ v: Q.x + (Rr.y - Q.y) * m, m: L("Divide by m, don't multiply: Δx = Δy ÷ m.", "要除以 m，不是乘以 m：Δx = Δy ÷ m。") }],
            { generic: function (x) {
              var s = slope(Q, pt(x, Rr.y));
              return L("With r = " + fs(x) + ", m_QR = " + fs(s) + " but m_PQ = " + fs(m) + ".",
                "r = " + fs(x) + " 時 m_QR = " + fs(s) + "，但 m_PQ = " + fs(m) + "。");
            } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.r.v, Rr.y);
          if (S.inView(U)) { wIcon(S, S.fx, U, "boat"); wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "R" + fp(U), besideLine(U, Q)); }
          wLine(S, S.fx, A, S.ray(A, sub(Q, A)), { c: C.cy, w: 2, dash: "4 7" });
          wMove(S, S.boG, Q, Rr, 1000, function () { if (!res.ok) wRing(S, S.fx, Rr, 0.6, { c: C.rd, w: 3 }); wait(300, done); });
        },
        workTex: [slopeTex(A, Q, "P", "Q"),
          tx("\\frac{" + tf(Rr.y) + " - " + tp(Q.y) + "}{r - " + tp(Q.x) + "} = " + tf(m)),
          tx("r = " + tf(Rr.x))],
      }];
    },
  };

  /* ---------- Chapter 3 · parallel and perpendicular ---------- */

  R.fence = {
    topic: "para", title: L("The second fence", "第二道圍欄"),
    gen: function () {
      return loop(function () {
        /* Keep geometry in the upper/mid band so labels stay above the dock. */
        var v = dirv(3, 3), A = pt(ri(-8, 2), ri(-1, 5)), B = add(A, mul(v, ri(1, 2)));
        var d = ri(-1, 6), k = nz(-3, 3), Cc = pt(v.x * k, d + v.y * k);
        if (!allWithin([B, Cc], 10) || Cc.x === 0 || Cc.y < -1 || B.y < -1) return null;
        if (Math.abs(cross(A, B, Cc)) < 1e-9) return null;
        if (Math.abs(cross(A, B, Cc)) / dist(A, B) < 1.5) return null;
        return { A: A, B: B, C: Cc, D: pt(0, d), m: v.y / v.x };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C, P.D, pt(0, Math.max(P.D.y, 2))]; },
    draw: function (S, P) {
      wFence(S, S.base, S.ray(P.A, sub(P.A, P.B)), S.ray(P.B, sub(P.B, P.A)), C.cy);
      wParallel(S, S.base, P.A, P.B, 1, C.cy);
      wPin(S, S.base, P.A, C.cy, "A" + fp(P.A), besideLine(P.A, P.B)); wPin(S, S.base, P.B, C.cy, "B" + fp(P.B), besideLine(P.B, P.A));
      wPin(S, S.base, P.C, C.gd, "C" + fp(P.C), besideLine(P.C, P.D));
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, m = P.m, mp = -1 / m;
      return [{
        kicker: L("Parallel lines", "平行線"),
        q: L("Two fences make a channel for Bo only if they never meet — so new fence <b>CD</b> must be <b>parallel to AB</b> (same slope). D is on the y-axis. Find D.", "兩道圍欄永不相交才能形成航道——所以新圍欄 <b>CD</b> 必須<b>平行於 AB</b>（斜率相同）。D 在 y 軸上。求 D。"),
        how: L("Parallel ⇔ equal slopes. Let D = (0, d), set m_CD = m_AB, solve for d.", "平行 ⇔ 斜率相等。設 D = (0, d)，令 m_CD = m_AB，解 d。"),
        formula: F_SLOPE,
        fields: [{ id: "D", type: "pt", label: L("D", "D") }],
        action: L("Lay fence", "架設圍欄"),
        answer: { D: D },
        hints: [L("D is on the y-axis, so D = (0, d).", "D 在 y 軸上，所以 D = (0, d)。"), L("Parallel lines: m_CD = m_AB.", "平行線：m_CD = m_AB。"), L("(d − y_C) ÷ (0 − x_C) = m_AB. Solve for d.", "(d − y_C) ÷ (0 − x_C) = m_AB，解 d。")],
        judge: function (v) {
          if (!eq(v.D.x.v, 0)) return bad(L("D is on the y-axis, so its x-coordinate is 0.", "D 在 y 軸上，x 坐標須為 0。"));
          return ptJudge(v.D, D, [
            { p: pt(0, Cc.y - mp * Cc.x), m: L("That would make the fences perpendicular. Parallel lines have equal slopes.", "那會令圍欄互相垂直。平行線斜率須相等。") },
            { p: pt(0, Cc.y + m * Cc.x), m: L("Sign slip. m_CD = (d − y_C) ÷ (0 − x_C); note 0 − x_C = " + fs(-Cc.x) + ".", "符號錯了。m_CD = (d − y_C) ÷ (0 − x_C)；注意 0 − x_C = " + fs(-Cc.x) + "。") },
          ], { generic: function (q) { return L("With D" + fp(q) + ", m_CD = " + fs(slope(Cc, q)) + " but m_AB = " + fs(m) + ".", "若 D" + fp(q) + "，則 m_CD = " + fs(slope(Cc, q)) + "，但 m_AB = " + fs(m) + "。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.D.x.v, v.D.y.v), dir = sub(U, Cc);
          if (same(U, Cc)) { done(); return; }
          var far = S.ray(Cc, mul(dir, -1)), end = S.ray(Cc, dir);
          wGrow(S, S.fx, far, end, { c: res.ok ? C.ok : C.rd, w: 3.5, cap: "round" }, 800, function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "D" + fp(U), besideLine(U, Cc));
            if (!res.ok) {
              var X = lineX(A, B, Cc, U);
              if (X && S.inView(X)) { wCrossMark(S, S.fx, X, C.rd); wTag(S, S.fx, X, T(L("fences meet: Bo is trapped", "圍欄相交：Bo 被困")), { c: C.rd, up: 1 }); }
            } else {
              wParallel(S, S.fx, A, B, 1, C.ok);
              wParallel(S, S.fx, Cc, U, 1, C.ok);
            }
            wait(350, done);
          });
        },
        workTex: [slopeTex(A, B, "A", "B"), L("CD // AB, so \\(m_{CD} = " + tf(m) + "\\)", "CD // AB，所以 \\(m_{CD} = " + tf(m) + "\\)"),
          tx("\\frac{d - " + tf(Cc.y) + "}{0 - " + tf(Cc.x) + "} = " + tf(m)),
          tx("d = " + tf(Cc.y) + " + " + tf(m) + " \\times " + tp(-Cc.x) + " = " + tf(D.y)),
          tx("D = " + tpt(D))],
      }];
    },
  };

  function lineX(A, B, Cc, D) {
    var a1 = B.y - A.y, b1 = A.x - B.x, c1 = a1 * A.x + b1 * A.y;
    var a2 = D.y - Cc.y, b2 = Cc.x - D.x, c2 = a2 * Cc.x + b2 * Cc.y;
    var det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-9) return null;
    return pt((b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det);
  }
  function angleBetween(u, w) {
    var a = Math.abs(Math.atan2(u.x * w.y - u.y * w.x, u.x * w.x + u.y * w.y)) * 180 / Math.PI;
    return a > 90 ? 180 - a : a;
  }

  R.gate = {
    topic: "para", title: L("The typhoon shelter gate", "避風塘閘門"),
    gen: function () {
      return loop(function () {
        var v = dirv(3, 3), k = nz(-2, 2), Pp = pt(v.x * k, v.y * k);
        var r = nz(-6, 6), j = nz(-2, 2), Q = pt(r + v.y * j, -v.x * j);
        if (!allWithin([Pp, Q], 10) || Q.y === 0 || Q.x === 0 || Q.y < -3) return null;
        if (Math.abs(v.y) === v.x) return null;
        return { P: Pp, Q: Q, R: pt(r, 0), m: v.y / v.x };
      });
    },
    pts: function (P) { return [P.P, P.Q, P.R, mul(P.P, -1)]; },
    draw: function (S, P) {
      wShore(S, S.base);
      wLine(S, S.base, S.ray(pt(0, 0), mul(P.P, -1)), S.ray(pt(0, 0), P.P), { c: C.cy, w: 3, op: 0.55 });
      wPin(S, S.base, P.P, C.cy, "P" + fp(P.P), besideLine(P.P, pt(0, 0)));
      S.boG = wIcon(S, S.base, mul(P.P, 0.5), "bo");
      wTag(S, S.base, mul(P.P, 0.5), "Bo", { lift: 1, away: besideLine(mul(P.P, 0.5), pt(0, 0)) });
      wPin(S, S.base, P.Q, C.gd, "Q" + fp(P.Q), besideLine(P.Q, P.R));
    },
    steps: function (P) {
      var Pp = P.P, Q = P.Q, Rr = P.R, m1 = P.m, m2 = -1 / m1;
      function rFor(s) { return Q.x - Q.y / s; }
      return [{
        kicker: L("Perpendicular lines", "垂直線"),
        q: L("The shelter gate must close straight across the channel OP, so gate <b>QR ⊥ OP</b> (slopes multiply to −1). R is on the x-axis. Find R.", "避風塘閘門要橫越航道 OP 把它關上，所以閘門 <b>QR ⊥ OP</b>（斜率之積為 −1）。R 在 x 軸上。求 R。"),
        how: L("Perpendicular ⇔ m₁ × m₂ = −1. Let R = (r, 0) and solve for r.", "垂直 ⇔ m₁ × m₂ = −1。設 R = (r, 0)，解 r。"),
        formula: F_SLOPE,
        fields: [{ id: "R", type: "pt", label: L("R", "R") }],
        action: L("Build gate", "建造閘門"),
        answer: { R: Rr },
        hints: [L("R is on the x-axis, so R = (r, 0).", "R 在 x 軸上，所以 R = (r, 0)。"), L("Perpendicular: m_QR = −1 ÷ m_OP.", "垂直：m_QR = −1 ÷ m_OP。"), L("(0 − y_Q) ÷ (r − x_Q) = m_QR. Solve for r.", "(0 − y_Q) ÷ (r − x_Q) = m_QR，解 r。")],
        judge: function (v) {
          if (!eq(v.R.y.v, 0)) return bad(L("R is on the x-axis, so its y-coordinate is 0.", "R 在 x 軸上，y 坐標須為 0。"));
          return ptJudge(v.R, Rr, [
            { p: pt(rFor(m1), 0), m: L("That makes the gate parallel to the path. Perpendicular means m₁ × m₂ = −1.", "那會令閘門與路徑平行。垂直表示 m₁ × m₂ = −1。") },
            { p: pt(rFor(-m1), 0), m: L("The perpendicular slope is the negative reciprocal: flip AND change sign.", "垂直斜率是負倒數：要倒數又要變號。") },
            { p: pt(rFor(1 / m1), 0), m: L("The perpendicular slope is the negative reciprocal: flip AND change sign.", "垂直斜率是負倒數：要倒數又要變號。") },
          ], { generic: function (q) { var s = slope(Q, q); return L("With R" + fp(q) + ", m_QR = " + fs(s) + "; " + fs(m1) + " × " + par(s) + " = " + fs(m1 * s) + ", not −1.", "若 R" + fp(q) + "，m_QR = " + fs(s) + "；" + fs(m1) + " × " + par(s) + " = " + fs(m1 * s) + "，不是 −1。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.R.x.v, 0);
          if (same(U, Q)) { done(); return; }
          wGrow(S, S.fx, Q, U, { c: res.ok ? C.ok : C.rd, w: 5 }, 700, function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "R" + fp(U), Q);
            var X = lineX(pt(0, 0), Pp, Q, U);
            if (X && S.inView(X)) {
              var ang = angleBetween(Pp, sub(U, Q));
              if (res.ok) wRight(S, S.fx, X, Pp, sub(Q, X), C.ok);
              else wTag(S, S.fx, X, "≈ " + Math.round(ang) + "°", { c: C.rd, up: 1, size: 20 });
            }
            wait(350, done);
          });
        },
        workTex: [tx("m_{OP} = " + tf(Pp.y) + " \\div " + tf(Pp.x) + " = " + tf(m1)),
          L("QR ⊥ OP, so \\(m_{QR} = -1 \\div " + tp(m1) + " = " + tf(m2) + "\\)", "QR ⊥ OP，所以 \\(m_{QR} = -1 \\div " + tp(m1) + " = " + tf(m2) + "\\)"),
          tx("\\frac{0 - " + tf(Q.y) + "}{r - " + tf(Q.x) + "} = " + tf(m2)),
          tx("r = " + tf(Q.x) + " + " + tf(-Q.y) + " \\div " + tp(m2) + " = " + tf(Rr.x)),
          tx("R = " + tpt(Rr))],
      }];
    },
  };

  var REL = [L("Parallel", "平行"), L("Perpendicular", "垂直"), L("Neither", "兩者都不是")];

  function pairFor(type) {
    return loop(function () {
      var v1 = dirv(3, 3), v2;
      if (type === 0) v2 = v1;
      else if (type === 1) v2 = v1.y > 0 ? pt(v1.y, -v1.x) : pt(-v1.y, v1.x);
      else {
        v2 = dirv(3, 3);
        var s1 = v1.y / v1.x, s2 = v2.y / v2.x;
        if (eq(s1, s2) || eq(s1 * s2, -1)) return null;
      }
      /* Prefer mid/upper y so segment tips and labels clear the dock. */
      var A = pt(ri(-8, 0), ri(-1, 6)), B = add(A, mul(v1, ri(1, 2)));
      var Cc = pt(ri(-2, 6), ri(-1, 6)), D = add(Cc, mul(v2, ri(1, 2)));
      if (!allWithin([B, D], 10) || !distinct([A, B, Cc, D])) return null;
      if (B.y < -1 || D.y < -1 || Cc.y < -1) return null;
      if (type === 0 && Math.abs(cross(A, B, Cc)) / dist(A, B) < 1.5) return null;
      return { A: A, B: B, C: Cc, D: D, t: type };
    });
  }

  R.proposals = {
    topic: "para", title: L("Fence proposals", "圍欄方案"),
    gen: function () { return { list: shuffle([0, 1, 2]).map(pairFor) }; },
    pts: function (P) { var a = []; P.list.forEach(function (o) { a.push(o.A, o.B, o.C, o.D); }); return a; },
    draw: function () {},
    steps: function (P) {
      return P.list.map(function (o, i) {
        var m1 = slope(o.A, o.B), m2 = slope(o.C, o.D);
        return {
          kicker: L("Parallel or perpendicular?", "平行還是垂直？"),
          title: L("Proposal " + (i + 1) + " of 3", "方案 " + (i + 1) + " / 3"),
          q: L("Engineers sent fence plans. Parallel fences make a channel; perpendicular fences make a corner. Work out m_AB and m_CD: <b>parallel</b>, <b>perpendicular</b> or <b>neither</b>?", "工程師送來圍欄方案。平行的圍欄可做航道；垂直的可做角落。求 m_AB 和 m_CD：<b>平行</b>、<b>垂直</b>還是<b>兩者都不是</b>？"),
          how: L("Equal slopes → parallel · product −1 → perpendicular · otherwise neither.", "斜率相等 → 平行 · 積為 −1 → 垂直 · 否則兩者都不是。"),
          formula: F_SLOPE,
          fields: [{ id: "r", type: "choice", label: L("AB and CD are", "AB 與 CD"), opts: REL }],
          action: L("Rule on it", "作出判斷"),
          answer: { r: o.t },
          hints: [L("Find m_AB and m_CD with Δy ÷ Δx.", "用 Δy ÷ Δx 求 m_AB 和 m_CD。"), L("Equal slopes → parallel. Product −1 → perpendicular.", "斜率相等 → 平行。積為 −1 → 垂直。")],
          draw: function (S) {
            /* Solid faint extensions (never sparse dashes — those looked “broken”). */
            wLine(S, S.step, S.ray(o.A, sub(o.A, o.B)), S.ray(o.B, sub(o.B, o.A)), { c: "rgba(34,227,255,.32)", w: 2.2, op: 0.75 });
            wLine(S, S.step, S.ray(o.C, sub(o.C, o.D)), S.ray(o.D, sub(o.D, o.C)), { c: "rgba(255,198,90,.32)", w: 2.2, op: 0.75 });
            wLine(S, S.step, o.A, o.B, { c: C.cy, w: 4.5 }); wLine(S, S.step, o.C, o.D, { c: C.gd, w: 4.5 });
            wPin(S, S.step, o.A, C.cy, "A" + fp(o.A)); wPin(S, S.step, o.B, C.cy, "B" + fp(o.B));
            wPin(S, S.step, o.C, C.gd, "C" + fp(o.C)); wPin(S, S.step, o.D, C.gd, "D" + fp(o.D));
          },
          judge: function (v) {
            if (v.r === o.t) return OK;
            return bad(o.t === 0
              ? L("m_AB = " + fs(m1) + " and m_CD = " + fs(m2) + ". Equal slopes → parallel.", "m_AB = " + fs(m1) + "，m_CD = " + fs(m2) + "。斜率相等 → 平行。")
              : o.t === 1
                ? L("m_AB = " + fs(m1) + " and m_CD = " + fs(m2) + ". Product −1 → perpendicular.", "m_AB = " + fs(m1) + "，m_CD = " + fs(m2) + "。積為 −1 → 垂直。")
                : L("m_AB = " + fs(m1) + ", m_CD = " + fs(m2) + "; product " + fs(m1 * m2) + " ≠ −1 → neither.", "m_AB = " + fs(m1) + "，m_CD = " + fs(m2) + "；積 " + fs(m1 * m2) + " ≠ −1 → 兩者都不是。"));
          },
          show: function (S, v, res, done) {
            var X = lineX(o.A, o.B, o.C, o.D);
            if (res.ok && o.t === 1 && X && S.inView(X)) wRight(S, S.fx, X, sub(o.B, o.A), sub(o.D, o.C), C.ok);
            if (res.ok && o.t === 0) { wParallel(S, S.fx, o.A, o.B, 1, C.ok); wParallel(S, S.fx, o.C, o.D, 1, C.ok); }
            if (res.ok && o.t === 2 && X && S.inView(X)) wTag(S, S.fx, X, "≈ " + Math.round(angleBetween(sub(o.B, o.A), sub(o.D, o.C))) + "°", { c: C.gd, up: 1 });
            wait(400, done);
          },
          workTex: [slopeTex(o.A, o.B, "A", "B"), slopeTex(o.C, o.D, "C", "D"),
            o.t === 0 ? L("Equal slopes → parallel.", "斜率相等 → 平行。") : o.t === 1 ? fs(m1) + " \\times " + tp(m2) + " = -1 → " + T(L("perpendicular", "垂直")) + "." : L("Product " + fs(m1 * m2) + " ≠ −1 → neither.", "積 " + fs(m1 * m2) + " ≠ −1 → 兩者都不是。")],
        };
      });
    },
  };

  R.findp = {
    topic: "para", title: L("Line up the buoy", "對準浮標"),
    gen: function () {
      return loop(function () {
        var rel = pick([0, 1]), v0 = dirv(3, 3), m0 = v0.y / v0.x;
        var mt = rel === 0 ? m0 : -1 / m0;
        var den = rel === 0 ? v0.x : Math.abs(v0.y);
        var Q = pt(ri(-3, 6), ri(-2, 6)), k = nz(-2, 2), x1 = Q.x - den * k;
        var p = Q.y - mt * (Q.x - x1);
        if (!isInt(p) || p < -2 || !within(pt(x1, p), 10)) return null;
        return { rel: rel, m0: m0, Q: Q, P: pt(x1, p) };
      });
    },
    pts: function (P) { return [P.P, P.Q, pt(P.P.x, 0)]; },
    draw: function (S, P) {
      var o = pt(S.x0 + 2, S.y0 + 2);
      wLine(S, S.base, S.ray(o, pt(-1, -P.m0)), S.ray(o, pt(1, P.m0)), { c: C.cy, w: 2.5, op: 0.5 });
      wLine(S, S.base, pt(P.P.x, S.y0), pt(P.P.x, S.y1), { c: "rgba(255,198,90,.35)", w: 2, op: 0.55 });
      wPin(S, S.base, P.Q, C.gd, "Q" + fp(P.Q));
      var e0 = S.ray(o, pt(-1, -P.m0)), lp = add(e0, mul(sub(S.ray(o, pt(1, P.m0)), e0), 0.8));
      wTag(S, S.base, lp, T(L("wall L, slope " + fs(P.m0), "牆 L，斜率 " + fs(P.m0))), { c: C.cy, away: besideLine(lp, e0) });
    },
    steps: function (P) {
      var Q = P.Q, Pp = P.P, mt = P.rel === 0 ? P.m0 : -1 / P.m0, alt = P.rel === 0 ? -1 / P.m0 : P.m0;
      return [{
        kicker: P.rel === 0 ? L("Parallel lines", "平行線") : L("Perpendicular lines", "垂直線"),
        q: P.rel === 0
          ? L("A buoy rope PQ must run alongside sea wall L without ever touching it, so <b>PQ // L</b> (slope " + fs(P.m0) + "). Find <b>p</b> in P(" + fs(Pp.x) + ", p).", "浮標繩 PQ 要沿着海堤 L 而永不碰到它，所以 <b>PQ // L</b>（斜率 " + fs(P.m0) + "）。求 P(" + fs(Pp.x) + ", p) 中的 <b>p</b>。")
          : L("A support beam PQ is strongest when it meets sea wall L at a right angle, so <b>PQ ⊥ L</b> (slope " + fs(P.m0) + "). Find <b>p</b> in P(" + fs(Pp.x) + ", p).", "支撐樑 PQ 與海堤 L 成直角時最穩固，所以 <b>PQ ⊥ L</b>（斜率 " + fs(P.m0) + "）。求 P(" + fs(Pp.x) + ", p) 中的 <b>p</b>。"),
        how: P.rel === 0
          ? L("Set m_PQ = " + fs(P.m0) + ", then solve for p.", "令 m_PQ = " + fs(P.m0) + "，解 p。")
          : L("m_PQ × m_L = −1, so m_PQ = −1 ÷ " + par(P.m0) + ", then solve for p.", "m_PQ × m_L = −1，所以 m_PQ = −1 ÷ " + par(P.m0) + "，再解 p。"),
        formula: F_SLOPE,
        fields: [{ id: "p", type: "num", label: "p" }],
        action: L("Set buoy", "放置浮標"),
        answer: { p: Pp.y },
        hints: [P.rel === 0 ? L("Parallel: m_PQ = " + fs(P.m0) + ".", "平行：m_PQ = " + fs(P.m0) + "。") : L("Perpendicular: m_PQ = " + fs(mt) + ".", "垂直：m_PQ = " + fs(mt) + "。"), L("(" + fs(Q.y) + " − p) ÷ (" + fs(Q.x) + " − " + par(Pp.x) + ") = m_PQ. Solve for p.", "(" + fs(Q.y) + " − p) ÷ (" + fs(Q.x) + " − " + par(Pp.x) + ") = m_PQ，解 p。")],
        judge: function (v) {
          return numJudge(v.p, Pp.y, [{ v: Q.y - alt * (Q.x - Pp.x), m: P.rel === 0 ? L("That makes the line perpendicular. Parallel means equal slopes.", "那會變成垂直。平行表示斜率相等。") : L("That makes the line parallel. Perpendicular means m₁ × m₂ = −1.", "那會變成平行。垂直表示 m₁ × m₂ = −1。") }],
            { generic: function (x) { return L("With p = " + fs(x) + ", m_PQ = " + fs(slope(pt(Pp.x, x), Q)) + "; should be " + fs(mt) + ".", "若 p = " + fs(x) + "，m_PQ = " + fs(slope(pt(Pp.x, x), Q)) + "；應為 " + fs(mt) + "。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(Pp.x, v.p.v);
          if (!S.inView(U) || same(U, Q)) { done(); return; }
          wGrow(S, S.fx, U, Q, { c: res.ok ? C.ok : C.rd, w: 4 }, 600, function () { wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U), Q); wait(300, done); });
        },
        workTex: [L("\\(m_{PQ} = " + tf(mt) + "\\)", "\\(m_{PQ} = " + tf(mt) + "\\)"),
          "\\(\\frac{" + tf(Q.y) + " - p}{" + tf(Q.x) + " - " + tf(Pp.x) + "} = " + tf(mt) + "\\)",
          fs(Q.y) + " - p = " + tf(mt * (Q.x - Pp.x)),
          "p = " + tf(Pp.y)],
      }];
    },
  };

  R.corner = {
    topic: "para", title: L("Prove the corner", "驗證直角"),
    gen: function () {
      return loop(function () {
        var u = dirv(3, 3), D = pt(ri(-3, 4), ri(-1, 5)), j = nz(-2, 2);
        var Cc = sub(D, mul(u, ri(1, 2))), A = add(D, mul(pt(-u.y, u.x), j)), B = sub(A, mul(u, ri(2, 3)));
        var e = pick([1, 2, 3, -1, -2]);
        if (u.x * e - u.y === 0) return null;
        var c0 = A.y - e * A.x;
        if (!allWithin([A, B, Cc, D], 11) || !distinct([A, B, Cc, D]) || A.x === 0) return null;
        if (A.y < -2 || B.y < -2 || Cc.y < -2) return null;
        return { A: A, B: B, C: Cc, D: D, e: e, c0: c0 };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C, P.D]; },
    draw: function (S, P) {
      wLine(S, S.base, S.ray(pt(0, P.c0), pt(-1, -P.e)), S.ray(pt(0, P.c0), pt(1, P.e)), { c: "rgba(157,180,204,.35)", w: 2, op: 0.55 });
      wLine(S, S.base, P.C, P.D, { c: C.gd, w: 4 });
      wPin(S, S.base, P.B, C.cy, "B" + fp(P.B)); wPin(S, S.base, P.C, C.gd, "C" + fp(P.C), P.D); wPin(S, S.base, P.D, C.gd, "D" + fp(P.D), P.C);
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, e = P.e, c0 = P.c0, mCD = slope(Cc, D), mAD = slope(A, D);
      return [{
        kicker: L("Parallel lines", "平行線"),
        q: L("Bo's resting pen needs side BA parallel to side CD. Corner post A(a, " + lin(e, c0, "a") + ") slides on the grey line. Find <b>a</b> so that <b>BA // CD</b>.", "Bo 的休息圍欄要 BA 邊平行於 CD 邊。角柱 A(a, " + lin(e, c0, "a") + ") 沿灰線滑動。求 <b>a</b> 使 <b>BA // CD</b>。"),
        how: L("Set m_BA = m_CD, cross-multiply and solve for a.", "令 m_BA = m_CD，交叉相乘解 a。"),
        formula: F_SLOPE,
        fields: [{ id: "a", type: "num", label: "a" }],
        action: L("Fix post A", "固定柱 A"),
        answer: { a: A.x },
        hints: [L("BA // CD, so m_BA = m_CD = " + fs(mCD) + ".", "BA // CD，所以 m_BA = m_CD = " + fs(mCD) + "。"), L("Cross-multiply the slope equation and solve.", "對斜率方程交叉相乘再求解。")],
        judge: function (v) {
          return numJudge(v.a, A.x, [], { generic: function (x) { var q = pt(x, e * x + c0); return L("With a = " + fs(x) + ", m_BA = " + fs(slope(B, q)) + " but m_CD = " + fs(mCD) + ".", "若 a = " + fs(x) + "，m_BA = " + fs(slope(B, q)) + "，但 m_CD = " + fs(mCD) + "。"); } });
        },
        show: function (S, v, res, done) {
          var q = pt(v.a.v, e * v.a.v + c0);
          if (!S.inView(q) || same(q, B)) { done(); return; }
          wGrow(S, S.fx, B, q, { c: res.ok ? C.ok : C.rd, w: 4 }, 600, function () {
            wPin(S, res.ok ? S.keep : S.fx, q, res.ok ? C.cy : C.rd, "A" + fp(q));
            if (res.ok) wLine(S, S.keep, B, q, { c: C.cy, w: 4 });
            wait(300, done);
          });
        },
        workTex: [slopeTex(Cc, D, "C", "D"), L("a = " + fs(A.x) + ", A = " + tpt(A), "a = " + fs(A.x) + "，A = " + tpt(A))],
      }, {
        kicker: L("Perpendicular lines", "垂直線"),
        q: L("The gate hinge at D only fits a square corner. Find m_AD and m_CD. Is <b>AD ⊥ CD</b>?", "D 點的閘門鉸鏈只裝得進直角。求 m_AD 和 m_CD。<b>AD ⊥ CD</b> 嗎？"),
        how: L("AD ⊥ CD ⇔ m_AD × m_CD = −1.", "AD ⊥ CD ⇔ m_AD × m_CD = −1。"),
        fields: [slopeField("m1", "AD"), slopeField("m2", "CD"), { id: "c", type: "choice", label: L("AD ⊥ CD?", "AD ⊥ CD？"), opts: YESNO }],
        action: L("Check corner", "檢查角位"),
        answer: { m1: mAD, m2: mCD, c: 0 },
        hints: [L("Work out m_AD and m_CD.", "求 m_AD 和 m_CD。"), L("If the product is −1, they are perpendicular.", "若積為 −1，則互相垂直。")],
        judge: function (v) {
          var r = numJudge(v.m1, mAD, slopeWrongs(A, D));
          if (!r.ok) return badAs(r, "Slope of AD: ", "AD 的斜率：");
          r = numJudge(v.m2, mCD, slopeWrongs(Cc, D));
          if (!r.ok) return badAs(r, "Slope of CD: ", "CD 的斜率：");
          if (v.c !== 0) return bad(L(fs(mAD) + " × " + par(mCD) + " = −1, so AD ⊥ CD.", fs(mAD) + " × " + par(mCD) + " = −1，所以 AD ⊥ CD。"));
          return OK;
        },
        show: function (S, v, res, done) {
          wGrow(S, S.fx, A, D, { c: res.ok ? C.ok : C.rd, w: 4 }, 500, function () {
            if (res.ok) wRight(S, S.fx, D, sub(A, D), sub(Cc, D), C.ok);
            wait(300, done);
          });
        },
        workTex: [slopeTex(A, D, "A", "D"), slopeTex(Cc, D, "C", "D"), fs(mAD) + " \\times " + tp(mCD) + " = -1", L("So AD ⊥ CD.", "所以 AD ⊥ CD。")],
      }];
    },
  };

  /* ---------- Chapter 4 · mid-point and section formula ---------- */

  R.mid = {
    topic: "mid", title: L("The halfway light", "半途信號燈"),
    gen: function () {
      return loop(function () {
        var A = pt(ri(-9, 9), ri(-2, 7)), B = pt(ri(-9, 9), ri(-2, 7));
        return d2(A, B) >= 36 && A.x !== B.x && A.y !== B.y ? { A: A, B: B } : null;
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      wLine(S, S.base, P.A, P.B, { c: "rgba(255,198,90,.45)", w: 2.5, op: 0.7 });
      S.boG = wIcon(S, S.base, P.A, "bo"); wIcon(S, S.base, P.B, "gate");
      wTag(S, S.base, P.A, "Bo A" + fp(P.A), { lift: 1, away: P.B });
      wTag(S, S.base, P.B, "Exit B" + fp(P.B), { lift: 1, away: P.A });
    },
    steps: function (P) {
      var A = P.A, B = P.B, M = mid(A, B);
      return [{
        kicker: L("Mid-point formula", "中點公式"),
        q: L("Bo follows the middle of the channel between buoys A and B. Drop light <b>M</b> exactly halfway.", "Bo 會沿浮標 A、B 之間的航道中央游。在正中央放下信號燈 <b>M</b>。"),
        how: L("Average both coordinates.", "對兩組坐標取平均。"),
        formula: F_MID,
        fields: [{ id: "M", type: "pt", label: L("M", "M") }],
        action: L("Drop buoy", "放下浮標"),
        answer: { M: M },
        hints: [L("Mid-point = average of coordinates.", "中點 = 坐標的平均。"), L("Fractions such as 5/2 are fine.", "可以用分數，例如 5/2。")],
        judge: function (v) {
          return ptJudge(v.M, M, [
            { p: mul(sub(B, A), 0.5), m: L("That is half the difference. Use (x₁ + x₂) ÷ 2.", "那是差的一半。應用 (x₁ + x₂) ÷ 2。") },
            { p: add(A, B), m: L("Add the coordinates, then divide by 2.", "先相加，再除以 2。") },
            { p: mul(sub(A, B), 0.5), m: L("That is half the difference. Use (x₁ + x₂) ÷ 2.", "那是差的一半。應用 (x₁ + x₂) ÷ 2。") },
          ]);
        },
        show: function (S, v, res, done) {
          var U = pt(v.M.x.v, v.M.y.v);
          if (!S.inView(U)) { done(); return; }
          wDrop(S, S.fx, U, "light", function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "M" + fp(U), besideLine(U, A));
            if (res.ok) { wTick(S, S.fx, mid(A, M), sub(B, A), C.ok); wTick(S, S.fx, mid(M, B), sub(B, A), C.ok); }
            wait(300, done);
          });
        },
        workTex: [F_MID, "M = \\left(\\frac{" + tf(A.x) + " + " + tf(B.x) + "}{2}, \\frac{" + tf(A.y) + " + " + tf(B.y) + "}{2}\\right) = " + tpt(M)],
      }];
    },
  };

  R.lostTug = {
    topic: "mid", title: L("The lost tug", "迷失的拖船"),
    gen: function () {
      return loop(function () {
        var A = pt(ri(-9, 9), ri(-2, 7)), B = pt(ri(-9, 9), ri(-2, 7));
        return d2(A, B) >= 36 && A.x !== B.x && A.y !== B.y ? { A: A, B: B, M: mid(A, B) } : null;
      });
    },
    pts: function (P) { return [P.A, P.B, P.M]; },
    draw: function (S, P) {
      wIcon(S, S.base, P.A, "tug"); wIcon(S, S.base, P.M, "tug");
      wTag(S, S.base, P.A, "Tug A" + fp(P.A), { lift: 1, away: P.M });
      wTag(S, S.base, P.M, "Tug M" + fp(P.M), { up: 1, lift: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, M = P.M;
      return [{
        kicker: L("Mid-point formula (reverse)", "中點公式（逆推）"),
        q: L("Tug B lost its GPS. Its radio says: “Light M is exactly halfway between tug A and me.” Find tug <b>B</b>.", "拖船 B 的 GPS 失靈。它無線電說：「信號燈 M 正好在拖船 A 和我的正中間。」求拖船 <b>B</b>。"),
        how: L("(x_A + x_B) ÷ 2 = x_M ⇒ x_B = 2x_M − x_A (same for y).", "(x_A + x_B) ÷ 2 = x_M ⇒ x_B = 2x_M − x_A（y 同理）。"),
        formula: F_MID,
        fields: [{ id: "B", type: "pt", label: L("B", "B") }],
        action: L("Send radio fix", "發送定位"),
        answer: { B: B },
        hints: [L("(" + fs(A.x) + " + x) ÷ 2 = " + fs(M.x) + " → x = 2×" + par(M.x) + " − " + par(A.x) + ".", "(" + fs(A.x) + " + x) ÷ 2 = " + fs(M.x) + " → x = 2×" + par(M.x) + " − " + par(A.x) + "。"), L("Do the same for y.", "y 用同樣方法。")],
        judge: function (v) {
          return ptJudge(v.B, B, [
            { p: mid(A, M), m: L("That is the mid-point of A and M. B is on the far side of M.", "那是 A 與 M 的中點。B 在 M 的另一邊。") },
            { p: sub(M, A), m: L("Use x = 2x_M − x_A.", "用 x = 2x_M − x_A。") },
            { p: add(M, mul(sub(M, A), 0.5)), m: L("B is a full step beyond M: x = 2x_M − x_A.", "B 在 M 外一整步：x = 2x_M − x_A。") },
          ], { generic: function (q) { return L("Mid-point of A and your point is " + fp(mid(A, q)) + ", not M" + fp(M) + ".", "A 與你的點的中點是 " + fp(mid(A, q)) + "，不是 M" + fp(M) + "。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.B.x.v, v.B.y.v);
          if (!S.inView(U)) { done(); return; }
          wGrow(S, S.fx, A, U, { c: res.ok ? C.ok : C.rd, w: 2.5, dash: "5 6" }, 600, function () {
            wDrop(S, S.fx, U, "tug", function () {
              wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "B" + fp(U), A);
              if (res.ok) { wTick(S, S.fx, mid(A, M), sub(B, A), C.ok); wTick(S, S.fx, mid(M, B), sub(B, A), C.ok); }
              wait(300, done);
            });
          });
        },
        workTex: [tx("\\frac{" + tf(A.x) + " + x}{2} = " + tf(M.x) + " \\Rightarrow x = " + tf(B.x)),
          tx("\\frac{" + tf(A.y) + " + y}{2} = " + tf(M.y) + " \\Rightarrow y = " + tf(B.y)),
          tx("B = " + tpt(B))],
      }];
    },
  };

  function sectionGen(trap) {
    return function () {
      return loop(function () {
        var m, n, k;
        if (trap) { k = ri(3, 6); m = ri(1, k - 1); if (gcd(m, k) !== 1) return null; n = k - m; }
        else { m = ri(1, 4); n = ri(1, 4); if (m === n || gcd(m, n) !== 1) return null; }
        var v = pt(nz(-2, 2), nz(-2, 2)), A = pt(ri(-9, 3), ri(-2, 7)), B = add(A, mul(v, m + n));
        if (!within(B, 10) || B.y < -2 || d2(A, B) < 36) return null;
        return { A: A, B: B, m: m, n: n, P: add(A, mul(v, m)) };
      });
    };
  }

  function sectionGeneric(A, B, m, n) {
    return function (q) {
      if (Math.abs(cross(A, B, q)) > 1e-7) return L("Your point " + fp(q) + " is not on AB.", "你的點 " + fp(q) + " 不在 AB 上。");
      var t = ((q.x - A.x) * (B.x - A.x) + (q.y - A.y) * (B.y - A.y)) / d2(A, B);
      if (t <= 0 || t >= 1) return L("Your point is on line AB but not between A and B.", "你的點在直線 AB 上，但不在 A 與 B 之間。");
      var g = t / (1 - t);
      return L("Your point splits AB in ratio " + fs(g) + " : 1, not " + m + " : " + n + ".", "你的點把 AB 分成 " + fs(g) + " : 1，不是 " + m + " : " + n + "。");
    };
  }

  function sectionShow(P) {
    return function (S, v, res, done) {
      var U = pt(v.P.x.v, v.P.y.v);
      if (!S.inView(U)) { done(); return; }
      if (res.ok) for (var i = 1; i < P.m + P.n; i++) wDot(S, S.fx, add(P.A, mul(sub(P.B, P.A), i / (P.m + P.n))), C.gd, 4);
      wDrop(S, S.fx, U, "light", function () {
        wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U), besideLine(U, P.A));
        if (res.ok) { wLine(S, S.fx, P.A, P.P, { c: C.ok, w: 4 }); wLine(S, S.fx, P.P, P.B, { c: C.gd, w: 4 }); }
        wait(300, done);
      });
    };
  }

  function sectionWork(A, B, m, n, Pp) {
    return ["P = ((n·x₁ + m·x₂) ÷ (m + n), (n·y₁ + m·y₂) ÷ (m + n)) with m : n = " + m + " : " + n,
      "x = (" + n + " × " + par(A.x) + " + " + m + " × " + par(B.x) + ") ÷ " + (m + n) + " = " + fs(Pp.x),
      "y = (" + n + " × " + par(A.y) + " + " + m + " × " + par(B.y) + ") ÷ " + (m + n) + " = " + fs(Pp.y), "P = " + fp(Pp)];
  }

  function sectionDraw(S, P) {
    wLine(S, S.base, P.A, P.B, { c: "rgba(255,198,90,.45)", w: 2.5, op: 0.7 });
    S.boG = wIcon(S, S.base, P.A, "bo"); wIcon(S, S.base, P.B, "gate");
    wTag(S, S.base, P.A, "Bo A" + fp(P.A), { lift: 1, away: P.B });
    wTag(S, S.base, P.B, "B" + fp(P.B), { lift: 1, away: P.A });
  }

  R.section = {
    topic: "mid", title: L("Lights closer to Bo", "靠近 Bo 的燈"),
    gen: sectionGen(false),
    pts: function (P) { return [P.A, P.B]; },
    draw: sectionDraw,
    steps: function (P) {
      var A = P.A, B = P.B, m = P.m, n = P.n;
      return [{
        kicker: L("Section formula", "分點公式"),
        q: L("Bo is shy near the middle, so the light goes off-centre: place P on AB with <b>AP : PB = " + m + " : " + n + "</b>. Find P.", "Bo 不敢靠近中央，所以燈要偏一邊：在 AB 上放燈 P，使 <b>AP : PB = " + m + " : " + n + "</b>。求 P。"),
        how: L("A gets weight n, B gets weight m in the section formula.", "分點公式中 A 的權重是 n，B 的權重是 m。"),
        formula: F_SEC,
        fields: [{ id: "P", type: "pt", label: L("P", "P") }],
        action: L("Drop light", "放下信號燈"),
        answer: { P: P.P },
        hints: [L("m = " + m + ", n = " + n + " in AP : PB = m : n.", "AP : PB = m : n，其中 m = " + m + "，n = " + n + "。"), L("P is " + m + "/" + (m + n) + " of the way from A to B.", "P 在 A 到 B 路程的 " + m + "/" + (m + n) + " 處。")],
        judge: function (v) {
          return ptJudge(v.P, P.P, [
            { p: add(A, mul(sub(B, A), n / (m + n))), m: L("Weights swapped: A gets n, B gets m.", "權重調轉了：A 取 n，B 取 m。") },
            { p: mid(A, B), m: L("That is the mid-point, not ratio " + m + " : " + n + ".", "那是中點，不是 " + m + " : " + n + "。") },
          ], { generic: sectionGeneric(A, B, m, n) });
        },
        show: sectionShow(P),
        workTex: [F_SEC,
          tx("x = \\frac{" + n + " \\cdot " + tp(A.x) + " + " + m + " \\cdot " + tp(B.x) + "}{" + (m + n) + "} = " + tf(P.P.x)),
          tx("y = \\frac{" + n + " \\cdot " + tp(A.y) + " + " + m + " \\cdot " + tp(B.y) + "}{" + (m + n) + "} = " + tf(P.P.y)),
          tx("P = " + tpt(P.P))],
      }];
    },
  };

  R.sectionAB = {
    topic: "mid", title: L("Read the plan carefully", "細讀圖則"),
    gen: sectionGen(true),
    pts: function (P) { return [P.A, P.B]; },
    draw: sectionDraw,
    steps: function (P) {
      var A = P.A, B = P.B, m = P.m, n = P.n, k = m + n;
      return [{
        kicker: L("Section formula", "分點公式"),
        q: L("The harbour plan gives the light's place as a part of the <b>whole</b> route: <b>AP : AB = " + m + " : " + k + "</b>. Find P.", "海港圖則用<b>整段</b>路線表示燈的位置：<b>AP : AB = " + m + " : " + k + "</b>。求 P。"),
        how: L("First change to AP : PB = " + m + " : " + n + ", then use the section formula.", "先改寫為 AP : PB = " + m + " : " + n + "，再用分點公式。"),
        formula: F_SEC,
        fields: [{ id: "P", type: "pt", label: L("P", "P") }],
        action: L("Drop light", "放下信號燈"),
        answer: { P: P.P },
        hints: [L("AP is " + m + " parts of the whole " + k + "; PB is " + n + " parts.", "AP 佔全段 " + k + " 份中的 " + m + " 份；PB 佔 " + n + " 份。"), L("Then AP : PB = " + m + " : " + n + ".", "所以 AP : PB = " + m + " : " + n + "。")],
        judge: function (v) {
          return ptJudge(v.P, P.P, [
            { p: add(A, mul(sub(B, A), m / (m + k))), m: L("The plan is AP : AB, not AP : PB. Convert to AP : PB = " + m + " : " + n + ".", "圖則是 AP : AB，不是 AP : PB。先改為 AP : PB = " + m + " : " + n + "。") },
            { p: add(A, mul(sub(B, A), n / k)), m: L("Weights swapped: A gets n, B gets m.", "權重調轉：A 取 n，B 取 m。") },
          ], { generic: sectionGeneric(A, B, m, n) });
        },
        show: sectionShow(P),
        workTex: [L("AP : AB = " + m + " : " + k + " → AP : PB = " + m + " : " + n, "AP : AB = " + m + " : " + k + " → AP : PB = " + m + " : " + n),
          F_SEC,
          tx("P = " + tpt(P.P))],
      }];
    },
  };

  R.shoal = {
    topic: "mid", title: L("The shoal", "淺灘"),
    gen: function () {
      return loop(function () {
        var r = ri(1, 5), s = ri(1, 5);
        if (r === s || gcd(r, s) !== 1) return null;
        var v = pt(nz(-3, 3), sgn() * ri(1, 3)), Px = ri(-5, 5);
        var A = sub(pt(Px, 0), mul(v, r)), B = add(pt(Px, 0), mul(v, s));
        if (!allWithin([A, B], 11) || d2(A, B) < 25) return null;
        return { A: A, B: B, r: r, s: s, X: pt(Px, 0) };
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      wShoal(S, S.base);
      wLine(S, S.base, P.A, P.B, { c: C.cy, w: 2.5 });
      S.boG = wIcon(S, S.base, P.A, "bo");
      wIcon(S, S.base, P.B, "gate");
      wTag(S, S.base, P.A, "Bo A" + fp(P.A), { away: P.B });
      wTag(S, S.base, P.B, "B" + fp(P.B), { away: P.A });
    },
    steps: function (P) {
      var A = P.A, B = P.B, r = P.r, s = P.s;
      return [{
        kicker: L("Section formula", "分點公式"),
        q: L("A shoal lies along the <b>x-axis</b>, and Bo's route AB crosses it at P. How far along the route is the danger? Find <b>AP : PB</b>.", "淺灘沿 <b>x 軸</b>，Bo 的路線 AB 在 P 點穿過它。危險在路線的哪個位置？求 <b>AP : PB</b>。"),
        how: L("Let AP : PB = k : 1; set y_P = 0 with the section formula.", "設 AP : PB = k : 1；用分點公式令 y_P = 0。"),
        formula: F_SEC,
        fields: [{ id: "k", type: "ratio", label: L("AP : PB", "AP : PB") }],
        action: L("Mark the shoal", "標記淺灘"),
        answer: { k: { r: r, s: s } },
        hints: [L("Shortcut: |y_A| : |y_B|.", "捷徑：|y_A| : |y_B|。"), L("Or solve (y_A + k·y_B) ÷ (k + 1) = 0.", "或解 (y_A + k·y_B) ÷ (k + 1) = 0。")],
        judge: function (v) {
          return ratioJudge(v.k, r, s, {
            flip: L("Upside down. AP is next to A (" + Math.abs(A.y) + " from the axis), PB next to B (" + Math.abs(B.y) + ").", "前後調轉。AP 靠近 A（離軸 " + Math.abs(A.y) + "），PB 靠近 B（離軸 " + Math.abs(B.y) + "）。"),
            generic: function (a, b) { var q = pt((b * A.x + a * B.x) / (a + b), (b * A.y + a * B.y) / (a + b)); return L("That ratio puts P at " + fp(q) + ", not on the x-axis.", "該比會令 P 在 " + fp(q) + "，不在 x 軸上。"); },
          });
        },
        show: function (S, v, res, done) {
          var a = v.k.r.v, b = v.k.s.v, U = pt((b * A.x + a * B.x) / (a + b), (b * A.y + a * B.y) / (a + b));
          wDrop(S, S.fx, U, "light", function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U), besideLine(U, A));
            if (res.ok) { wLine(S, S.fx, A, U, { c: C.ok, w: 4 }); wLine(S, S.fx, U, B, { c: C.gd, w: 4 }); }
            wait(300, done);
          });
        },
        workTex: [L("Let AP : PB = k : 1, y_P = 0.", "設 AP : PB = k : 1，y_P = 0。"),
          tx("\\frac{" + tf(A.y) + " + k \\cdot " + tp(B.y) + "}{k + 1} = 0"),
          tx("k = " + tf(-A.y / B.y)),
          "AP : PB = " + r + " : " + s],
      }];
    },
  };

  R.parallelogram = {
    topic: "mid", title: L("The fourth tug", "第四艘拖船"),
    gen: function () {
      return loop(function () {
        var A = pt(ri(-8, 4), ri(-6, 6)), B = add(A, pt(ri(2, 6), nz(-4, 4))), Cc = add(B, pt(nz(-3, 3), ri(3, 6)));
        var D = add(A, sub(Cc, B));
        if (!allWithin([B, Cc, D], 10) || Math.abs(cross(A, B, Cc)) < 6) return null;
        return { A: A, B: B, C: Cc, D: D };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C, P.D]; },
    draw: function (S, P) {
      wLine(S, S.base, P.A, P.B, { c: C.cy, w: 2.5 }); wLine(S, S.base, P.B, P.C, { c: C.cy, w: 2.5 });
      ["A", "B", "C"].forEach(function (k) { wIcon(S, S.base, P[k], "tug"); });
      ["A", "B", "C"].forEach(function (k) { wTag(S, S.base, P[k], k + fp(P[k]), { away: mid(P.A, P.C) }); });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, M = mid(A, Cc);
      return [{
        kicker: L("Mid-point formula", "中點公式"),
        q: L("Four tugs hold a net flat only if ABCD is a <b>parallelogram</b>. Find where tug <b>D</b> must go.", "四艘拖船要排成<b>平行四邊形</b> ABCD，網才會拉平。求拖船 <b>D</b> 的位置。"),
        how: L("Diagonals bisect: mid(AC) = mid(BD); reverse for D.", "對角線互相平分：mid(AC) = mid(BD)；逆推 D。"),
        formula: F_MID,
        fields: [{ id: "D", type: "pt", label: L("D", "D") }],
        action: L("Send tug D", "派出拖船 D"),
        answer: { D: D },
        hints: [L("Diagonals AC and BD share the same mid-point.", "對角線 AC 與 BD 的中點相同。"), L("Mid(AC) = " + fp(M) + ".", "Mid(AC) = " + fp(M) + "。")],
        judge: function (v) {
          return ptJudge(v.D, D, [
            { p: add(B, sub(Cc, A)), m: L("Corners go A→B→C→D; diagonals are AC and BD.", "頂點順序 A→B→C→D；對角線是 AC 和 BD。") },
            { p: add(A, sub(B, Cc)), m: L("Corners go A→B→C→D; diagonals are AC and BD.", "頂點順序 A→B→C→D；對角線是 AC 和 BD。") },
          ], { generic: function (q) { return L("Mid(AC) = " + fp(M) + " but Mid(BD) = " + fp(mid(B, q)) + ".", "Mid(AC) = " + fp(M) + "，但 Mid(BD) = " + fp(mid(B, q)) + "。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.D.x.v, v.D.y.v);
          if (!S.inView(U)) { done(); return; }
          wDrop(S, S.fx, U, "tug", function () {
            var c = res.ok ? C.ok : C.rd;
            wLine(S, S.fx, Cc, U, { c: c, w: 2.5 }); wLine(S, S.fx, U, A, { c: c, w: 2.5 });
            wLine(S, S.fx, A, Cc, { c: C.gd, w: 1.5, dash: "4 6" }); wLine(S, S.fx, B, U, { c: C.gd, w: 1.5, dash: "4 6" });
            wPin(S, S.fx, U, c, "D" + fp(U));
            wait(300, done);
          });
        },
        workTex: [L("Mid(AC) = Mid(BD) = " + tpt(M), "Mid(AC) = Mid(BD) = " + tpt(M)),
          tx("D = \\left(2 \\cdot " + tf(M.x) + " - " + tf(B.x) + ", 2 \\cdot " + tf(M.y) + " - " + tf(B.y) + "\\right) = " + tpt(D))],
      }];
    },
  };

  /* ---------- Chapter 5 · centres of a triangle ---------- */

  var CENTRES = [L("Centroid", "重心"), L("Circumcentre", "外心"), L("Orthocentre", "垂心"), L("In-centre", "內心")];
  var CENTRE_SCENES = [
    [L("Equally far from all three stations", "與三個站點等距"), 1],
    [L("Balance point of a triangular sling", "三角吊索的平衡點"), 0],
    [L("Where altitudes from each corner meet", "各頂點垂線的交點"), 2],
    [L("Centre of the largest dome inside the triangle", "三角形內最大圓的圓心"), 3],
  ];
  var CENTRE_FACTS = {
    0: L("Centroid: medians meet; balance point.", "重心：中線交點；平衡點。"),
    1: L("Circumcentre: ⊥ bisectors meet; equal distance to vertices.", "外心：垂直平分線交點；到三頂點等距。"),
    2: L("Orthocentre: altitudes meet.", "垂心：垂線交點。"),
    3: L("In-centre: angle bisectors meet; equal distance to sides.", "內心：角平分線交點；到三邊等距。"),
  };

  function acuteTri() {
    return loop(function () {
      var a = ri(-8, -2), b = ri(2, 8), c = ri(a + 2, b - 2), d = ri(5, 10), s = ri(-1, 1);
      var A = pt(a + s, -3), B = pt(b + s, -3), Cc = pt(c + s, d - 3);
      var H = orthocentre(A, B, Cc);
      return H.y > A.y + 0.5 && H.y < Cc.y - 0.5 ? { A: A, B: B, C: Cc } : null;
    });
  }

  function drawStations(S, layer, T, named) {
    wPoly(S, layer, [T.A, T.B, T.C], { c: C.cy, w: 2.5, fill: "rgba(34,227,255,.05)" });
    ["A", "B", "C"].forEach(function (k) { wIcon(S, layer, T[k], "station"); });
    ["A", "B", "C"].forEach(function (k) {
      wTag(S, layer, T[k], named ? k + fp(T[k]) : k, { away: pt((T.A.x + T.B.x + T.C.x) / 3, (T.A.y + T.B.y + T.C.y) / 3) });
    });
  }

  R.which = {
    topic: "centre", title: L("Four centres", "四個中心"),
    gen: function () { return { T: acuteTri(), rows: shuffle(CENTRE_SCENES.slice()) }; },
    pts: function (P) { return [P.T.A, P.T.B, P.T.C]; },
    draw: function (S, P) { drawStations(S, S.base, P.T, false); },
    steps: function (P) {
      var Tri = P.T;
      return [{
        kicker: L("Centres of a triangle", "三角形的中心"),
        q: L("Bo's mother could be at any of the four centres of △ABC. First, match each job to the right centre.", "Bo 的媽媽可能在 △ABC 四個中心的任何一個。先把每項工作配對到正確的中心。"),
        how: L("Centroid · circumcentre · orthocentre · in-centre — use the hints.", "重心 · 外心 · 垂心 · 內心 — 可參考提示。"),
        fields: P.rows.map(function (r, i) { return { id: "c" + i, type: "choice", label: r[0], opts: CENTRES, small: true }; }),
        action: L("Brief the team", "向隊伍簡報"),
        answer: (function () { var a = {}; P.rows.forEach(function (r, i) { a["c" + i] = r[1]; }); return a; })(),
        hints: [CENTRE_FACTS[1], CENTRE_FACTS[0], CENTRE_FACTS[2], CENTRE_FACTS[3]],
        judge: function (v) {
          var badN = 0;
          P.rows.forEach(function (r, i) { if (v["c" + i] !== r[1]) badN++; });
          return badN ? bad(L("Recheck your matches. Open a hint for each centre.", "請再檢查配對。打開提示查看各中心的意義。")) : OK;
        },
        show: function (S, v, res, done) {
          if (res.ok) {
            var pts = [centroid(Tri.A, Tri.B, Tri.C), circumcentre(Tri.A, Tri.B, Tri.C), orthocentre(Tri.A, Tri.B, Tri.C), incentre(Tri.A, Tri.B, Tri.C)];
            var cols = [C.gd, C.pk, C.ok, C.cy], names = ["G", "O", "H", "I"];
            pts.forEach(function (p, i) { wPin(S, S.fx, p, cols[i], names[i] + " · " + T(CENTRES[i])); });
          }
          wait(400, done);
        },
        workTex: [CENTRE_FACTS[0], CENTRE_FACTS[1], CENTRE_FACTS[2], CENTRE_FACTS[3]],
      }];
    },
  };

  /* One side (AB) on a horizontal line y = k (sometimes a vertical line x = k, via sw), C free.
     need.G / need.O / need.H → that centre has integer coordinates. */
  function baseTri(need) {
    need = need || {};
    var list = [];
    var dys = need.G ? (need.O && need.H ? [6, 9] : [3, 6, 9]) : [4, 5, 6, 7, 8, 9, 10];
    [0, 0, 0, -4, -3, -2, 2].forEach(function (y0, yi) {
      if (yi > 0 && y0 === 0) return;
      for (var a = -9; a <= 2; a++) for (var b = a + 6; b <= 9; b++) for (var c = -8; c <= 8; c++) {
        if (c === a || c === b) continue;
        dys.forEach(function (m) {
          [m, -m].forEach(function (dy) {
            var y1 = y0 + dy;
            if (Math.abs(y1) > 9 || Math.abs(dy) * (b - a) < 36) return;
            if ((c - a) * (b - c) === dy * dy) return;
            var G = pt((a + b + c) / 3, (2 * y0 + y1) / 3);
            if (need.G && !(isInt(G.x) && isInt(G.y))) return;
            var ox = (a + b) / 2, O = pt(ox, ((ox - c) * (ox - c) - (ox - a) * (ox - a) + y1 * y1 - y0 * y0) / (2 * dy));
            if (need.O && !(isInt(O.x) && isInt(O.y) && within(O, 10))) return;
            var H = pt(c, y0 + (c - a) * (b - c) / dy);
            if (need.H && !(isInt(H.y) && within(H, 10))) return;
            if (need.O && need.G && eq(G.x, O.x)) return;
            list.push({ a: a, b: b, c: c, y0: y0, y1: y1, G: G, O: O, H: H });
          });
        });
      }
    });
    var r = pick(list), sw = Math.random() < 0.35;
    function f(p) { return sw ? pt(p.y, p.x) : p; }
    var A = pt(r.a, r.y0), B = pt(r.b, r.y0);
    if (Math.random() < 0.5) { var t = A; A = B; B = t; }
    return { A: f(A), B: f(B), C: f(pt(r.c, r.y1)), G: f(r.G), O: f(r.O), H: f(r.H), sw: sw };
  }

  /* Along-base coordinate u (x if AB is horizontal) and the other one v. */
  function baseKey(P) {
    return P.sw
      ? { u: "y", v: "x", U: function (p) { return p.y; }, V: function (p) { return p.x; }, line: L("vertical", "鉛垂"), perp: L("horizontal", "水平") }
      : { u: "x", v: "y", U: function (p) { return p.x; }, V: function (p) { return p.y; }, line: L("horizontal", "水平"), perp: L("vertical", "鉛垂") };
  }

  function circumWork(P) {
    var K = baseKey(P), A = P.A, B = P.B, Cc = P.C, O = P.O;
    var uo = K.U(O), du = uo - K.U(A), dc = uo - K.U(Cc), va = K.V(A), vc = K.V(Cc);
    return [
      L("AB is " + K.line.en + ", so O is on its ⊥ bisector.", "AB 是" + K.line.zh + "線，所以 O 在 AB 的垂直平分線上。"),
      tx(K.u + "_O = \\frac{" + tf(K.U(A)) + " + " + tf(K.U(B)) + "}{2} = " + tf(uo)),
      tx("OA^2 = OC^2"),
      tx(tp(du) + "^2 + (" + K.v + " - " + tp(va) + ")^2 = " + tp(dc) + "^2 + (" + K.v + " - " + tp(vc) + ")^2"),
      tx(tf(2 * (vc - va)) + K.v + " = " + tf(dc * dc + vc * vc - du * du - va * va) + " \\Rightarrow " + K.v + " = " + tf(K.V(O))),
      tx("O = " + tpt(O))];
  }

  function bisectorLine(S, layer, P, c) {
    var M = mid(P.A, P.B), d = P.sw ? pt(1, 0) : pt(0, 1);
    return wLine(S, layer, S.ray(M, d), S.ray(M, mul(d, -1)), { c: c || C.gd, w: 1.8, dash: "6 6" });
  }

  R.circum = {
    topic: "centre", title: L("Where is the mother?", "媽媽在哪裏？"),
    gen: function () { return baseTri({ O: true }); },
    pts: function (P) { return [P.A, P.B, P.C, P.O]; },
    draw: function (S, P) { drawStations(S, S.base, P, true); },
    steps: function (P) {
      var O = P.O, A = P.A, B = P.B, Cc = P.C, K = baseKey(P), uo = K.U(O);
      return [{
        kicker: L("Circumcentre", "外心"),
        q: L("Bo's mother is the <b>same distance</b> from stations A, B and C. Find her position O.", "Bo 的媽媽與站 A、B、C <b>等距</b>。求她的位置 O。"),
        how: L("AB is " + K.line.en + ", so O is on the ⊥ bisector " + K.u + " = (" + K.u + "<sub>A</sub> + " + K.u + "<sub>B</sub>) ÷ 2. Then OA = OC gives " + K.v + ".",
          "AB 是" + K.line.zh + "線，所以 O 在垂直平分線 " + K.u + " = (" + K.u + "<sub>A</sub> + " + K.u + "<sub>B</sub>) ÷ 2 上。再用 OA = OC 求 " + K.v + "。"),
        formula: tx("OA = OB = OC"),
        fields: [{ id: "M", type: "pt", label: L("Mother", "媽媽") }],
        action: L("Lock position", "鎖定位置"),
        answer: { M: O },
        hints: [
          L("Equal distance from three vertices → circumcentre.", "到三頂點等距 → 外心。"),
          L("⊥ bisector of AB: " + K.u + " = " + fs(uo) + ".", "AB 的垂直平分線：" + K.u + " = " + fs(uo) + "。"),
          L("Put " + K.u + " = " + fs(uo) + " into OA² = OC², then solve for " + K.v + ".", "把 " + K.u + " = " + fs(uo) + " 代入 OA² = OC²，再解 " + K.v + "。")],
        judge: function (v) {
          return ptJudge(v.M, O, [
            { p: P.G, m: L("That is the centroid. Equal distance from vertices → circumcentre.", "那是重心。到頂點等距 → 外心。") },
            { p: P.H, m: L("That is the orthocentre (altitudes). You need equal distances.", "那是垂心（垂線交點）。這題要等距。") },
            { p: mid(A, B), m: L("The mid-point of AB is equally far from A and B only — C is further away.", "AB 的中點只與 A、B 等距，與 C 的距離不同。") },
          ], { generic: function (q) { return L("Distances √" + fs(d2(q, A)) + ", √" + fs(d2(q, B)) + ", √" + fs(d2(q, Cc)) + " must be equal.", "距離 √" + fs(d2(q, A)) + "、√" + fs(d2(q, B)) + "、√" + fs(d2(q, Cc)) + " 須相等。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.M.x.v, v.M.y.v);
          bisectorLine(S, S.fx, P);
          if (!S.inView(U)) { wait(400, done); return; }
          [A, B, Cc].forEach(function (p, i) { wRing(S, S.fx, p, dist(p, U), { c: [C.cy, C.gd, C.pk][i], w: 1.8, op: 0.75, grow: 900 }); });
          SFX.ping();
          wait(950, function () {
            if (res.ok) { wRing(S, S.fx, O, dist(O, A), { c: C.ok, w: 3.5, grow: 500 }); wIcon(S, S.fx, O, "mother"); }
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fp(U));
            wait(400, done);
          });
        },
        workTex: circumWork(P),
      }];
    },
  };

  function orthoWork(P) {
    var K = baseKey(P), A = P.A, B = P.B, Cc = P.C, H = P.H;
    var mAH = -1 / slope(B, Cc);
    var last = P.sw
      ? tx("x_H = " + tf(A.x) + " + \\frac{" + tf(Cc.y) + " - " + tp(A.y) + "}{" + tf(mAH) + "} = " + tf(H.x))
      : tx("y_H = " + tf(A.y) + " + " + tp(mAH) + "(" + tf(Cc.x) + " - " + tp(A.x) + ") = " + tf(H.y));
    return [
      L("AB is " + K.line.en + ", so the altitude from C is " + K.perp.en + ".", "AB 是" + K.line.zh + "線，所以由 C 出發的垂線是" + K.perp.zh + "線。"),
      tx(K.u + "_H = " + K.u + "_C = " + tf(K.U(Cc))),
      slopeTex(B, Cc, "B", "C"),
      tx("m_{AH} = -\\frac{1}{m_{BC}} = " + tf(mAH)),
      last,
      tx("H = " + tpt(H))];
  }

  /* Draw all three altitudes as full lines through H (so obtuse cases still show the ray past the boat). */
  function altitudes(S, layer, P) {
    var H = P.H || orthocentre(P.A, P.B, P.C);
    var ends = [[P.B, P.C], [P.A, P.C], [P.A, P.B]];
    [P.A, P.B, P.C].forEach(function (p, i) {
      var f = foot(p, ends[i][0], ends[i][1]);
      var dir = sub(same(p, H) ? f : H, p);
      if (Math.hypot(dir.x, dir.y) < 1e-9) dir = sub(f, p);
      if (Math.hypot(dir.x, dir.y) < 1e-9) return;
      wLine(S, layer, S.ray(p, dir), S.ray(p, mul(dir, -1)), { c: C.gd, w: 1.8, dash: "5 6", op: 0.9 });
      if (d2(p, f) < 1e-9) return;
      var side = sub(ends[i][1], ends[i][0]);
      wRight(S, layer, f, sub(p, f), side, C.gd);
    });
  }

  R.ortho = {
    topic: "centre", title: L("The medical boat", "醫療船"),
    gen: function () { return baseTri({ H: true }); },
    pts: function (P) { return [P.A, P.B, P.C, P.H]; },
    draw: function (S, P) { drawStations(S, S.base, P, true); },
    steps: function (P) {
      var H = P.H, A = P.A, B = P.B, Cc = P.C, K = baseKey(P);
      var mBC = slope(B, Cc), mAH = -1 / mBC;
      return [{
        kicker: L("Orthocentre", "垂心"),
        q: L("The medical boat waits where the three <b>altitudes</b> meet (orthocentre H). Find H.", "醫療船在<b>三條垂線</b>的交點（垂心 H）等候。求 H。"),
        how: L("AB is " + K.line.en + ", so the altitude from C is the " + K.perp.en + " line " + K.u + " = " + K.u + "<sub>C</sub>. The altitude from A is ⊥ BC.",
          "AB 是" + K.line.zh + "線，所以由 C 出發的垂線是" + K.perp.zh + "線 " + K.u + " = " + K.u + "<sub>C</sub>。由 A 出發的垂線 ⊥ BC。"),
        formula: tx("m_{BC} \\times m_{AH} = -1"),
        fields: [{ id: "H", type: "pt", label: L("Medical boat", "醫療船") }],
        action: L("Send medical boat", "派出醫療船"),
        answer: { H: H },
        hints: [
          L("Altitude from C: " + K.u + " = " + fs(K.U(Cc)) + ".", "由 C 出發的垂線：" + K.u + " = " + fs(K.U(Cc)) + "。"),
          L("m<sub>BC</sub> = " + fs(mBC) + ", so m<sub>AH</sub> = " + fs(mAH) + ".", "m<sub>BC</sub> = " + fs(mBC) + "，所以 m<sub>AH</sub> = " + fs(mAH) + "。"),
          L("Go from A with slope " + fs(mAH) + " until " + K.u + " = " + fs(K.U(Cc)) + ".", "由 A 以斜率 " + fs(mAH) + " 前進，直到 " + K.u + " = " + fs(K.U(Cc)) + "。")],
        judge: function (v) {
          return ptJudge(v.H, H, [
            { p: P.G, m: L("That is the centroid (medians). You need the altitudes.", "那是重心（中線）。這題要用垂線。") },
            { p: P.O, m: L("That is the circumcentre (⊥ bisectors). Altitudes pass through the vertices.", "那是外心（垂直平分線）。垂線要經過頂點。") },
            { p: foot(Cc, A, B), m: L("That is only the foot of the altitude from C. Find where it meets the altitude from A.", "那只是由 C 出發的垂足。要找它與由 A 出發的垂線的交點。") },
          ], { generic: function (q) { return L("Your point is not on the altitude from C (" + K.u + " = " + fs(K.U(Cc)) + "), or AH is not ⊥ BC.", "你的點不在由 C 出發的垂線（" + K.u + " = " + fs(K.U(Cc)) + "）上，或 AH 不垂直於 BC。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.H.x.v, v.H.y.v);
          altitudes(S, S.fx, P);
          wait(600, function () {
            if (S.inView(U)) { wDrop(S, S.fx, U, "boat", function () { wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fp(U)); wait(300, done); }); }
            else done();
          });
        },
        workTex: orthoWork(P),
      }];
    },
  };

  R.centroid = {
    topic: "centre", title: L("The sling hook", "吊索掛鉤"),
    gen: function () { return baseTri({ G: true }); },
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      wPoly(S, S.base, [P.A, P.B, P.C], { c: C.cy, w: 2.5, fill: "rgba(34,227,255,.08)" });
      ["A", "B", "C"].forEach(function (k) { wIcon(S, S.base, P[k], "heli"); });
      ["A", "B", "C"].forEach(function (k) { wTag(S, S.base, P[k], k + fp(P[k]), { away: P.G }); });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, G = P.G;
      return [{
        kicker: L("Centroid", "重心"),
        q: L("Three helicopters lift a net together. Hang the hook at the balance point, <b>centroid G</b>. Find G.", "三架直升機一起吊起一張網。把掛鉤掛在平衡點 <b>重心 G</b>。求 G。"),
        how: L("Average all three vertex coordinates.", "對三個頂點坐標取平均。"),
        formula: F_CEN,
        fields: [{ id: "G", type: "pt", label: L("Hook", "掛鉤") }],
        action: L("Attach hook", "掛上掛鉤"),
        answer: { G: G },
        hints: [L("Centroid = where the medians meet.", "重心 = 中線交點。"), L("Add the three x's and divide by 3; same for y.", "三個 x 相加再除以 3；y 同理。")],
        judge: function (v) {
          return ptJudge(v.G, G, [
            { p: add(add(A, B), Cc), m: L("Add the three coordinates, then divide by 3.", "三個坐標相加，再除以 3。") },
            { p: mul(add(add(A, B), Cc), 0.5), m: L("Three vertices: divide by 3, not 2.", "三個頂點：除以 3，不是 2。") },
            { p: P.O, m: L("That is the circumcentre. Balance point = centroid.", "那是外心。平衡點是重心。") },
            { p: P.H, m: L("That is the orthocentre. Balance point = centroid.", "那是垂心。平衡點是重心。") },
          ]);
        },
        show: function (S, v, res, done) {
          var U = pt(v.G.x.v, v.G.y.v);
          [[A, mid(B, Cc)], [B, mid(A, Cc)], [Cc, mid(A, B)]].forEach(function (m) { wGrow(S, S.fx, m[0], m[1], { c: C.gd, w: 1.6, dash: "4 6" }, 700); });
          wait(750, function () {
            if (S.inView(U)) {
              if (res.ok) wRing(S, S.fx, U, 0.8, { c: C.ok, w: 3, grow: 500 });
              wPin(S, S.fx, U, res.ok ? C.ok : C.rd, T(L("hook ", "掛鉤 ")) + fp(U));
              SFX.ping();
            }
            wait(400, done);
          });
        },
        workTex: [F_CEN, tx("G = \\left(\\frac{" + tf(A.x) + " + " + tf(B.x) + " + " + tf(Cc.x) + "}{3}, \\frac{" + tf(A.y) + " + " + tf(B.y) + " + " + tf(Cc.y) + "}{3}\\right) = " + tpt(G))],
      }];
    },
  };

  R.centroidInv = {
    topic: "centre", title: L("The third helicopter", "第三架直升機"),
    gen: function () { return baseTri({ G: true }); },
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      ["A", "B"].forEach(function (k) { wIcon(S, S.base, P[k], "heli"); });
      wPin(S, S.base, P.G, C.gd, "G" + fp(P.G));
      ["A", "B"].forEach(function (k) { wTag(S, S.base, P[k], k + fp(P[k]), { up: 1 }); });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, G = P.G;
      return [{
        kicker: L("Centroid (reverse)", "重心（逆推）"),
        q: L("Helicopter C lost its GPS. The hook G must stay at the balance point (centroid) of A, B and C. Find where helicopter <b>C</b> must fly.", "直升機 C 的 GPS 失靈。掛鉤 G 必須在 A、B、C 的平衡點（重心）。求直升機 <b>C</b> 要飛到哪裏。"),
        how: L("Set (x<sub>A</sub> + x<sub>B</sub> + x) ÷ 3 = x<sub>G</sub> and solve; same for y.", "設 (x<sub>A</sub> + x<sub>B</sub> + x) ÷ 3 = x<sub>G</sub> 再解；y 同理。"),
        formula: F_CEN,
        fields: [{ id: "C", type: "pt", label: L("C", "C") }],
        action: L("Guide helicopter", "引導直升機"),
        answer: { C: Cc },
        hints: [L("x = 3x<sub>G</sub> − x<sub>A</sub> − x<sub>B</sub>.", "x = 3x<sub>G</sub> − x<sub>A</sub> − x<sub>B</sub>。")],
        judge: function (v) {
          return ptJudge(v.C, Cc, [{ p: centroid(A, B, G), m: L("G is the centroid of A, B and C — not of A, B and G.", "G 是 A、B、C 的重心，不是 A、B、G 的重心。") }],
            { generic: function (q) { return L("Centroid of A, B and your point is " + fp(centroid(A, B, q)) + ", not G" + fp(G) + ".", "A、B 與你的點的重心是 " + fp(centroid(A, B, q)) + "，不是 G" + fp(G) + "。"); } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.C.x.v, v.C.y.v);
          if (!S.inView(U)) { done(); return; }
          wDrop(S, S.fx, U, "heli", function () {
            wPoly(S, S.fx, [A, B, U], { c: res.ok ? C.ok : C.rd, w: 2.5 });
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "C" + fp(U));
            wait(300, done);
          });
        },
        workTex: [tx("\\frac{" + tf(A.x) + " + " + tf(B.x) + " + x}{3} = " + tf(G.x) + " \\Rightarrow x = " + tf(Cc.x)),
          tx("\\frac{" + tf(A.y) + " + " + tf(B.y) + " + y}{3} = " + tf(G.y) + " \\Rightarrow y = " + tf(Cc.y)),
          tx("C = " + tpt(Cc))],
      }];
    },
  };

  var TRI_KIND = [L("an acute-angled", "銳角"), L("a right-angled", "直角"), L("an obtuse-angled", "鈍角")];
  var WHERE = [L("Inside", "在內"), L("On the triangle", "在邊上"), L("Outside", "在外")];
  function whereAns(c, k) { return c === 0 || c === 3 ? 0 : k; }

  R.where = {
    topic: "centre", title: L("Inside, on or outside?", "在內、在邊上還是在外？"),
    gen: function () {
      var all = [];
      for (var c = 0; c < 4; c++) for (var k = 0; k < 3; k++) all.push([c, k]);
      var rows = shuffle(all.filter(function (r) { return r[0] === 1 || r[0] === 2; })).slice(0, 2).concat([pick(all)]);
      return { rows: shuffle(rows), T: { A: pt(-7, -3), B: pt(6, -3), C: pt(-4, 5) } };
    },
    pts: function () { return [pt(-8, -5), pt(8, 6)]; },
    draw: function (S, P) {
      var tris = [[pt(-8, -4), pt(-2, -4), pt(-5, 1)], [pt(-1, -4), pt(4, -4), pt(-1, 1)], [pt(4.5, -4), pt(8.5, -4), pt(1.5, -1)]];
      tris.forEach(function (t, i) { wPoly(S, S.base, t, { c: C.cy, w: 2 }); wTag(S, S.base, pt((t[0].x + t[1].x) / 2, -4.6), T([L("acute", "銳角"), L("right", "直角"), L("obtuse", "鈍角")][i]), { c: C.mut }); });
    },
    steps: function (P) {
      return [{
        kicker: L("Centres of a triangle", "三角形的中心"),
        q: L("Before choosing a meeting point, the team checks: is that centre <b>inside</b>, <b>on</b> or <b>outside</b> the triangle of stations?", "選會合點之前，隊伍要先確認：該中心在站點三角形的<b>內</b>、<b>上</b>還是<b>外</b>？"),
        how: L("Centroid & in-centre: always inside. Circumcentre & orthocentre depend on angle type.", "重心與內心：恆在內。外心與垂心：視三角形類型而定。"),
        fields: P.rows.map(function (r, i) {
          return { id: "w" + i, type: "choice",
            label: L(CENTRES[r[0]].en + " · " + TRI_KIND[r[1]].en + " △", CENTRES[r[0]].zh + " · " + TRI_KIND[r[1]].zh + " 三角形"),
            opts: WHERE, small: true };
        }),
        action: L("Submit", "提交"),
        answer: (function () { var a = {}; P.rows.forEach(function (r, i) { a["w" + i] = whereAns(r[0], r[1]); }); return a; })(),
        hints: [L("Centroid and in-centre: always inside.", "重心與內心：恆在內。"), L("Right △: circumcentre on hypotenuse; orthocentre at right angle.", "直角三角形：外心在斜邊上；垂心在直角頂。"), L("Obtuse △: circumcentre and orthocentre outside.", "鈍角三角形：外心與垂心在外。")],
        judge: function (v) {
          var n = 0;
          P.rows.forEach(function (r, i) { if (v["w" + i] !== whereAns(r[0], r[1])) n++; });
          return n ? bad(L("Recheck your choices.", "請再檢查你的選擇。")) : OK;
        },
        show: function (S, v, res, done) { wait(250, done); },
        workTex: [L("Centroid, in-centre: inside.", "重心、內心：在內。"), L("Circumcentre: in / on hypotenuse / out.", "外心：內／斜邊上／外。"), L("Orthocentre: in / at right angle / out.", "垂心：內／直角頂／外。")],
      }];
    },
  };

  R.euler = {
    topic: "centre", title: L("One straight line", "一直線"),
    gen: function () { return baseTri({ G: true, O: true, H: true }); },
    pts: function (P) { return [P.A, P.B, P.C, P.O, P.H]; },
    draw: function (S, P) { drawStations(S, S.base, P, true); },
    steps: function (P) {
      var G = P.G, O = P.O, H = P.H, A = P.A, B = P.B, Cc = P.C, K = baseKey(P), mGO = slope(G, O), mGH = slope(G, H);
      function pin(S, p, c, label) { wPin(S, S.keep, p, c, label); }
      function miss(S, v) { var q = pt(v.p.x.v, v.p.y.v); if (S.inView(q)) wPin(S, S.fx, q, C.rd, "?"); }
      return [{
        kicker: L("Centroid", "重心"),
        q: L("Mother's last call: “Three lights — G, O and H — sit on one straight line. Follow it home.” Step 1 of 4: find the <b>centroid G</b>.", "媽媽最後的呼叫：「三盞燈 G、O、H 在同一直線上，沿着它回家。」第 1／4 步：求<b>重心 G</b>。"),
        how: L("Average all three vertices.", "對三個頂點坐標取平均。"),
        formula: F_CEN,
        fields: [{ id: "p", type: "pt", label: L("G", "G") }],
        action: L("Lock G", "鎖定 G"),
        answer: { p: G },
        hints: [L("Add the three x's and divide by 3; same for y.", "三個 x 相加再除以 3；y 同理。")],
        judge: function (v) { return ptJudge(v.p, G, [{ p: add(add(A, B), Cc), m: L("Divide the sums by 3.", "相加後除以 3。") }, { p: O, m: L("That is the circumcentre.", "那是外心。") }, { p: H, m: L("That is the orthocentre.", "那是垂心。") }]); },
        show: function (S, v, res, done) { if (res.ok) pin(S, G, C.gd, "G" + fp(G)); else miss(S, v); wait(300, done); },
        workTex: [F_CEN, tx("G = \\left(\\frac{" + tf(A.x) + " + " + tf(B.x) + " + " + tf(Cc.x) + "}{3}, \\frac{" + tf(A.y) + " + " + tf(B.y) + " + " + tf(Cc.y) + "}{3}\\right) = " + tpt(G))],
      }, {
        kicker: L("Circumcentre", "外心"),
        q: L("G is lit. Step 2 of 4: light the second lamp at the <b>circumcentre O</b>.", "G 已亮起。第 2／4 步：在<b>外心 O</b> 點亮第二盞燈。"),
        how: L("O is on the ⊥ bisector of AB (" + K.u + " = " + K.u + "<sub>O</sub>), then OA = OC.", "O 在 AB 的垂直平分線（" + K.u + " = " + K.u + "<sub>O</sub>）上，再用 OA = OC。"),
        formula: tx("OA = OB = OC"),
        fields: [{ id: "p", type: "pt", label: L("O", "O") }],
        action: L("Lock O", "鎖定 O"),
        answer: { p: O },
        hints: [L("⊥ bisector of AB: " + K.u + " = " + fs(K.U(O)) + ".", "AB 的垂直平分線：" + K.u + " = " + fs(K.U(O)) + "。"), L("Solve OA² = OC² for " + K.v + ".", "解 OA² = OC² 求 " + K.v + "。")],
        judge: function (v) { return ptJudge(v.p, O, [{ p: H, m: L("That is the orthocentre.", "那是垂心。") }, { p: G, m: L("That is the centroid.", "那是重心。") }, { p: mid(A, B), m: L("Mid-point of AB is not equally far from C.", "AB 的中點與 C 的距離不同。") }], { generic: function () { return L("Distances to A, B, C must be equal.", "到 A、B、C 的距離須相等。"); } }); },
        show: function (S, v, res, done) { bisectorLine(S, S.fx, P, C.pk); if (res.ok) { pin(S, O, C.pk, "O" + fp(O)); wRing(S, S.keep, O, dist(O, A), { c: "rgba(255,124,204,.5)", w: 1.5, grow: 600 }); } else miss(S, v); wait(400, done); },
        workTex: circumWork(P),
      }, {
        kicker: L("Orthocentre", "垂心"),
        q: L("Two lamps lit. Step 3 of 4: light the last lamp at the <b>orthocentre H</b>.", "兩盞燈已亮。第 3／4 步：在<b>垂心 H</b> 點亮最後一盞燈。"),
        how: L("Altitude from C is " + K.perp.en + ": " + K.u + " = " + K.u + "<sub>C</sub>. Altitude from A is ⊥ BC.", "由 C 出發的垂線是" + K.perp.zh + "線：" + K.u + " = " + K.u + "<sub>C</sub>。由 A 出發的垂線 ⊥ BC。"),
        formula: tx("m_{BC} \\times m_{AH} = -1"),
        fields: [{ id: "p", type: "pt", label: L("H", "H") }],
        action: L("Lock H", "鎖定 H"),
        answer: { p: H },
        hints: [L("m<sub>AH</sub> = −1 ÷ m<sub>BC</sub> = " + fs(-1 / slope(B, Cc)) + ".", "m<sub>AH</sub> = −1 ÷ m<sub>BC</sub> = " + fs(-1 / slope(B, Cc)) + "。")],
        judge: function (v) { return ptJudge(v.p, H, [{ p: O, m: L("That is the circumcentre.", "那是外心。") }, { p: G, m: L("That is the centroid.", "那是重心。") }, { p: foot(Cc, A, B), m: L("That is only the foot of the altitude from C.", "那只是由 C 出發的垂足。") }]); },
        show: function (S, v, res, done) { if (res.ok) pin(S, H, C.ok, "H" + fp(H)); else miss(S, v); wait(300, done); },
        workTex: orthoWork(P),
      }, {
        kicker: L("Collinear points", "共線"),
        q: L("Is Mother right — do the three lamps really make <b>one straight path</b> for Bo? Same slope from G to O and from G to H means one line. Step 4 of 4: find m<sub>GO</sub> and m<sub>GH</sub>.", "媽媽說得對嗎？三盞燈真的連成 Bo 的<b>一條直路</b>嗎？由 G 到 O 與由 G 到 H 斜率相同，就是同一直線。第 4／4 步：求 m<sub>GO</sub> 和 m<sub>GH</sub>。"),
        how: L("Collinear ⇔ m<sub>GO</sub> = m<sub>GH</sub> (shared point G).", "共線 ⇔ m<sub>GO</sub> = m<sub>GH</sub>（共用點 G）。"),
        formula: F_SLOPE,
        fields: [slopeField("m1", "GO"), slopeField("m2", "GH"), { id: "c", type: "choice", label: L("G, O, H collinear?", "G、O、H 共線？"), opts: YESNO }],
        action: L("Light the way", "照亮路線"),
        answer: { m1: mGO, m2: mGH, c: 0 },
        hints: [L("Work out both slopes.", "求兩條斜率。"), L("Equal slopes through G → collinear.", "過 G 的斜率相等 → 共線。")],
        judge: function (v) {
          var r = numJudge(v.m1, mGO, slopeWrongs(G, O));
          if (!r.ok) return badAs(r, "Slope of GO: ", "GO 的斜率：");
          r = numJudge(v.m2, mGH, slopeWrongs(G, H));
          if (!r.ok) return badAs(r, "Slope of GH: ", "GH 的斜率：");
          if (v.c !== 0) return bad(L("Equal slopes through G, so G, O and H are collinear.", "過 G 斜率相同，所以 G、O、H 共線。"));
          return OK;
        },
        show: function (S, v, res, done) {
          var a = S.ray(H, sub(H, O)), b = S.ray(O, sub(O, H));
          wGrow(S, S.fx, a, b, { c: C.gd, w: 4, glow: 1 }, 1000, function () { wait(300, done); });
        },
        workTex: [slopeTex(G, O, "G", "O"), slopeTex(G, H, "G", "H"), L("Equal slopes through G → collinear (the Euler line).", "過 G 斜率相等 → 共線（歐拉線）。")],
      }];
    },
  };

  /* ---------- Extra round types ---------- */

  R.findk = {
    topic: "dist", title: L("The rescue boat", "救援船"),
    gen: function () {
      return loop(function () {
        var t = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]);
        var A = pt(ri(-6, 6), ri(-4, 4)), right = Math.random() < 0.5;
        var dx = (right ? 1 : -1) * t[0], dy = sgn() * t[1];
        var Pp = add(A, pt(dx, dy)), other = A.x - dx;
        if (!within(Pp, 10) || Math.abs(other) > 10) return null;
        return { A: A, P: Pp, d: Math.round(Math.hypot(dx, dy)), right: right, other: other };
      });
    },
    pts: function (P) { return [P.A, P.P, pt(P.other, P.P.y), pt(P.A.x + (P.right ? -4 : 4), P.P.y)]; },
    draw: function (S, P) {
      wIcon(S, S.base, P.A, "bo");
      wTag(S, S.base, P.A, "Bo A" + fp(P.A), { up: 1, lift: 1 });
      var y = P.P.y;
      wLine(S, S.base, S.ray(pt(P.A.x, y), pt(1, 0)), S.ray(pt(P.A.x, y), pt(-1, 0)), { c: C.mut, w: 1.5, dash: "3 7" });
      wTag(S, S.base, pt(P.A.x + (P.right ? -4 : 4), y), "y = " + fs(y), { c: C.mut });
    },
    steps: function (P) {
      var A = P.A, k = P.P.x, y = P.P.y, d = P.d, dx = k - A.x, dy = y - A.y;
      var side = P.right ? L("right", "右") : L("left", "左");
      return [{
        kicker: L("Distance formula (reverse)", "距離公式（逆推）"),
        q: L("The rescue boat P(k, " + fs(y) + ") must be exactly <b>" + d + " units</b> from Bo, on the <b>" + side.en + "</b> of Bo. Find k.",
          "救援船 P(k, " + fs(y) + ") 必須與 Bo 相距恰好 <b>" + d + " 單位</b>，並在 Bo 的<b>" + side.zh + "方</b>。求 k。"),
        how: L("Set AP² = " + d + "², solve for k (two answers), then choose the " + side.en + " one.", "令 AP² = " + d + "²，解出 k（兩個答案），再選" + side.zh + "方那個。"),
        formula: tx("AP^2 = (k - x_A)^2 + (y_P - y_A)^2"),
        fields: [{ id: "k", type: "num", label: "k", sub: tx("P(k, " + tf(y) + ")") }],
        action: L("Send boat", "派出救援船"),
        answer: { k: k },
        hints: [
          L("(k − " + par(A.x) + ")² + (" + fs(y) + " − " + par(A.y) + ")² = " + d + "².", "(k − " + par(A.x) + ")² + (" + fs(y) + " − " + par(A.y) + ")² = " + d + "²。"),
          L("(k − " + par(A.x) + ")² = " + (dx * dx) + ", so k − " + par(A.x) + " = ±" + Math.abs(dx) + ".", "(k − " + par(A.x) + ")² = " + (dx * dx) + "，所以 k − " + par(A.x) + " = ±" + Math.abs(dx) + "。"),
          L("On the " + side.en + " of Bo means k " + (P.right ? ">" : "<") + " " + fs(A.x) + ".", "在 Bo 的" + side.zh + "方即 k " + (P.right ? ">" : "<") + " " + fs(A.x) + "。")],
        judge: function (v) {
          return numJudge(v.k, k, [
            { v: P.other, m: L("That point is also " + d + " units away, but on the wrong side of Bo.", "那一點同樣相距 " + d + "，但在 Bo 的另一邊。") },
            { v: A.x + Math.abs(dy) * (P.right ? 1 : -1), m: L("You swapped Δx and Δy. Δy = " + fs(dy) + " is fixed; solve for Δx.", "你把 Δx 和 Δy 調轉了。Δy = " + fs(dy) + " 已知，要解 Δx。") },
          ], { generic: function (x) { return L("With k = " + fs(x) + ", AP = √" + fs(d2(pt(x, y), A)) + ", not " + d + ".", "k = " + fs(x) + " 時，AP = √" + fs(d2(pt(x, y), A)) + "，不是 " + d + "。"); } });
        },
        show: function (S, v, res, done) {
          wRing(S, S.fx, A, d, { c: C.cy, w: 1.8, dash: "6 6", grow: 700 });
          var U = pt(v.k.v, y);
          wait(700, function () {
            if (!S.inView(U)) { done(); return; }
            wIcon(S, S.fx, U, "boat");
            wGrow(S, S.fx, A, U, { c: res.ok ? C.ok : C.rd, w: 2.5 }, 500, function () {
              wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U));
              wTag(S, S.fx, mid(A, U), "√" + fs(d2(A, U)), { c: res.ok ? C.ok : C.rd });
              wait(300, done);
            });
          });
        },
        workTex: [
          tx("(k - " + tp(A.x) + ")^2 + (" + tf(y) + " - " + tp(A.y) + ")^2 = " + d + "^2"),
          tx("(k - " + tp(A.x) + ")^2 = " + (d * d) + " - " + (dy * dy) + " = " + (dx * dx)),
          tx("k - " + tp(A.x) + " = \\pm " + Math.abs(dx) + " \\Rightarrow k = " + tf(Math.min(k, P.other)) + "\\ \\text{or}\\ " + tf(Math.max(k, P.other))),
          L("P is on the " + side.en + " of Bo, so k = " + fs(k) + ".", "P 在 Bo 的" + side.zh + "方，所以 k = " + fs(k) + "。")],
      }];
    },
  };

  var ISO_OPTS = [L("Isosceles", "等腰三角形"), L("Right-angled", "直角三角形"), L("Neither", "兩者皆非")];
  function triKind(A, B, Cc) {
    var s = [d2(A, B), d2(B, Cc), d2(Cc, A)], t = s.slice().sort(function (a, b) { return a - b; });
    var iso = s[0] === s[1] || s[1] === s[2] || s[0] === s[2], right = t[0] + t[1] === t[2];
    return { s: s, iso: iso, right: right };
  }

  R.iso = {
    topic: "dist", title: L("Three lighthouses", "三座燈塔"),
    gen: function () {
      var want = pick([0, 1, 2]);
      return loop(function () {
        var A = pt(ri(-7, 3), ri(-5, 3)), B, Cc, g, k;
        if (want === 0) {
          var v = pt(2 * nz(-3, 3), 2 * ri(0, 3));
          g = gcd(v.x, v.y); k = nz(-4, 4);
          B = add(A, v); Cc = add(mid(A, B), pt(-v.y / g * k, v.x / g * k));
        } else if (want === 1) {
          var u = pt(nz(-5, 5), nz(-5, 5));
          g = gcd(u.x, u.y); k = nz(-3, 3);
          B = add(A, u); Cc = add(A, pt(-u.y / g * k, u.x / g * k));
        } else {
          B = add(A, pt(ri(3, 9), ri(-4, 4))); Cc = add(A, pt(ri(-3, 7), ri(3, 9)));
        }
        if (!allWithin([A, B, Cc], 10) || Math.abs(cross(A, B, Cc)) < 16) return null;
        var t = triKind(A, B, Cc);
        if ((t.iso ? 0 : t.right ? 1 : 2) !== want || (t.iso && t.right)) return null;
        var pts = shuffle([A, B, Cc]);
        return { A: pts[0], B: pts[1], C: pts[2], want: want };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      var G = centroid(P.A, P.B, P.C);
      wPoly(S, S.base, [P.A, P.B, P.C], { c: C.cy, w: 2, fill: "rgba(34,227,255,.05)" });
      ["A", "B", "C"].forEach(function (n) { wIcon(S, S.base, P[n], "light"); wTag(S, S.base, P[n], n + fp(P[n]), { away: G }); });
    },
    steps: function (P) {
      var t = triKind(P.A, P.B, P.C), s = t.s;
      var why = P.want === 0 ? L("Two sides are equal → isosceles.", "有兩邊相等 → 等腰三角形。")
        : P.want === 1 ? L("The two smaller squares add up to the largest → right-angled (Pythagoras).", "兩個較小的平方之和等於最大的 → 直角三角形（畢氏定理逆定理）。")
          : L("No equal sides, and no Pythagoras match → neither.", "沒有相等的邊，也不符合畢氏定理 → 兩者皆非。");
      return [{
        kicker: L("Distance formula · triangle type", "距離公式 · 三角形類型"),
        q: L("Lighthouses A, B and C form a triangle. Is it <b>isosceles</b>, <b>right-angled</b> or <b>neither</b>?", "燈塔 A、B、C 組成一個三角形。它是<b>等腰</b>、<b>直角</b>還是<b>兩者皆非</b>？"),
        how: L("Find AB², BC² and CA². Two equal → isosceles. Two add up to the third → right-angled.", "求 AB²、BC²、CA²。有兩個相等 → 等腰；兩個之和等於第三個 → 直角。"),
        formula: tx("AB^2 = (x_B - x_A)^2 + (y_B - y_A)^2"),
        fields: [{ id: "t", type: "choice", label: L("△ABC is", "△ABC 是"), opts: ISO_OPTS }],
        action: L("Report", "報告"),
        answer: { t: P.want },
        hints: [
          L("Squares are enough — no square roots needed.", "比較平方就夠，不用開方。"),
          L("Check: any two equal? Does small + small = largest?", "檢查：有沒有兩個相等？較小兩個之和是否等於最大的？")],
        judge: function (v) {
          if (v.t === P.want) return OK;
          return bad(L("AB² = " + s[0] + ", BC² = " + s[1] + ", CA² = " + s[2] + ". " + why.en, "AB² = " + s[0] + "，BC² = " + s[1] + "，CA² = " + s[2] + "。" + why.zh));
        },
        show: function (S, v, res, done) {
          var sides = [[P.A, P.B], [P.B, P.C], [P.C, P.A]];
          sides.forEach(function (e, i) {
            wGrow(S, S.fx, e[0], e[1], { c: res.ok ? C.gd : C.rd, w: 2.5 }, 600);
            wTag(S, S.fx, mid(e[0], e[1]), surd(s[i]), { c: C.gd });
          });
          wait(650, function () {
            if (res.ok && P.want === 1) {
              var at = [P.A, P.B, P.C].filter(function (p) {
                var o = [P.A, P.B, P.C].filter(function (q) { return q !== p; });
                return Math.abs((o[0].x - p.x) * (o[1].x - p.x) + (o[0].y - p.y) * (o[1].y - p.y)) < 1e-9;
              })[0];
              if (at) { var o2 = [P.A, P.B, P.C].filter(function (q) { return q !== at; }); wRight(S, S.fx, at, sub(o2[0], at), sub(o2[1], at), C.ok); }
            }
            SFX.ping();
            wait(350, done);
          });
        },
        workTex: [tx("AB^2 = " + s[0]), tx("BC^2 = " + s[1]), tx("CA^2 = " + s[2]), why],
      }];
    },
  };

  R.incline = {
    topic: "slope", title: L("The searchlight", "探射燈"),
    gen: function () {
      return loop(function () {
        var A = pt(ri(-8, 0), ri(-5, 3)), v = pt(ri(2, 7), nz(-7, 7));
        if (Math.random() < 0.65) v.y = Math.abs(v.y);
        var B = add(A, v);
        if (!within(B, 10)) return null;
        return { A: A, B: B };
      });
    },
    pts: function (P) { return [P.A, P.B, add(P.A, pt(-2, 0))]; },
    draw: function (S, P) {
      wLine(S, S.base, S.ray(P.A, sub(P.A, P.B)), S.ray(P.A, sub(P.B, P.A)), { c: C.cy, w: 2.5 });
      wIcon(S, S.base, P.A, "light");
      wPin(S, S.base, P.A, C.cy, "A" + fp(P.A));
      wPin(S, S.base, P.B, C.cy, "B" + fp(P.B));
    },
    steps: function (P) {
      var A = P.A, B = P.B, m = slope(A, B), deg = Math.atan(m) * 180 / Math.PI, th = deg < 0 ? deg + 180 : deg;
      var flip = Math.atan(1 / Math.abs(m)) * 180 / Math.PI;
      return [{
        kicker: L("Slope · inclination", "斜率 · 傾角"),
        q: L("The searchlight beam runs along line AB. Find its <b>inclination θ</b>, correct to the nearest degree.", "探射燈光束沿直線 AB。求其<b>傾角 θ</b>，答案準確至最接近的度。"),
        how: L("Find m<sub>AB</sub>, then tan θ = m. If m < 0, θ = 180° + tan⁻¹ m.", "先求 m<sub>AB</sub>，再用 tan θ = m。若 m < 0，則 θ = 180° + tan⁻¹ m。"),
        formula: tx("\\tan\\theta = m, \\quad 0^\\circ \\le \\theta < 180^\\circ"),
        fields: [{ id: "th", type: "num", label: tx("\\theta ="), unit: "°", ph: L("e.g. 37", "例如 37") }],
        action: L("Aim the light", "瞄準探射燈"),
        answer: { th: Math.round(th) },
        hints: [
          L("m<sub>AB</sub> = " + fs(m) + ".", "m<sub>AB</sub> = " + fs(m) + "。"),
          m < 0 ? L("m is negative, so θ is obtuse: θ = 180° + tan⁻¹(" + fs(m) + ").", "m 是負數，所以 θ 是鈍角：θ = 180° + tan⁻¹(" + fs(m) + ")。")
            : L("θ = tan⁻¹(" + fs(m) + ") — use SHIFT tan on the calculator.", "θ = tan⁻¹(" + fs(m) + ")——用計算機 SHIFT tan。")],
        judge: function (v) {
          var x = v.th.v;
          if (Math.abs(x - th) <= 0.6) return OK;
          if (m < 0 && Math.abs(x - deg) <= 0.6) return bad(L("θ must be between 0° and 180°. For a negative slope, add 180°.", "θ 要介乎 0° 至 180°。斜率是負數時要加 180°。"));
          if (Math.abs(x - flip) <= 0.6 || Math.abs(x - (180 - flip)) <= 0.6) return bad(L("You used Δx ÷ Δy. tan θ = Δy ÷ Δx.", "你用了 Δx ÷ Δy。tan θ = Δy ÷ Δx。"));
          if (m < 0 && Math.abs(x + deg) <= 0.6) return bad(L("The line goes down to the right, so θ is obtuse: θ = 180° + tan⁻¹ m.", "直線向右下傾，所以 θ 是鈍角：θ = 180° + tan⁻¹ m。"));
          if (isFinite(x) && Math.abs(x - th) <= 2) return bad(L("Close — round to the nearest degree.", "很接近——請準確至最接近的度。"), true);
          return bad(L("tan " + fs(x) + "° ≈ " + (Math.round(Math.tan(x * Math.PI / 180) * 100) / 100) + ", but m = " + fs(m) + ".", "tan " + fs(x) + "° ≈ " + (Math.round(Math.tan(x * Math.PI / 180) * 100) / 100) + "，但 m = " + fs(m) + "。"));
        },
        show: function (S, v, res, done) {
          var x = v.th.v, Xc = pt(A.x - A.y / m, 0), at = S.inView(Xc) ? Xc : A;
          wLine(S, S.fx, at, S.ray(at, pt(1, 0)), { c: C.gd, w: 2, dash: "5 6" });
          function arc(deg2, col) {
            var r = 1.3, n = 24, d = "";
            for (var i = 0; i <= n; i++) {
              var a = deg2 * i / n * Math.PI / 180, q = S.P(add(at, pt(r * Math.cos(a), r * Math.sin(a))));
              d += (i ? "L" : "M") + q.x + " " + q.y + " ";
            }
            return sv("path", { d: d, fill: "none", stroke: col, "stroke-width": 2.5 }, S.fx);
          }
          if (isFinite(x) && x > 0 && x < 180) arc(x, res.ok ? C.ok : C.rd);
          wTag(S, S.fx, add(at, pt(1.9 * Math.cos(Math.min(x || th, 170) * Math.PI / 360), 1.9 * Math.sin(Math.min(x || th, 170) * Math.PI / 360))), "θ = " + fs(x) + "°", { c: res.ok ? C.ok : C.rd });
          SFX.ping();
          wait(500, done);
        },
        workTex: [slopeTex(A, B, "A", "B"),
          tx("\\tan\\theta = " + tf(m)),
          m < 0 ? tx("\\theta = 180^\\circ + \\tan^{-1}\\left(" + tf(m) + "\\right) \\approx " + Math.round(th) + "^\\circ")
            : tx("\\theta = \\tan^{-1}\\left(" + tf(m) + "\\right) \\approx " + Math.round(th) + "^\\circ")],
      }];
    },
  };

  var RIGHT_OPTS = [L("At A", "在 A"), L("At B", "在 B"), L("At C", "在 C"), L("No right angle", "沒有直角")];

  R.rightAt = {
    topic: "para", title: L("The square corner", "直角的角落"),
    gen: function () {
      var want = pick([0, 1, 2, 3]);
      return loop(function () {
        var V = pt(ri(-6, 3), ri(-5, 2)), u = mul(dirv(3, 3), ri(1, 2)), w = pt(-u.y, u.x);
        w = mul(w, pick([1, 2]) * sgn());
        var P1 = add(V, u), P2 = add(V, w);
        if (want === 3) P2 = add(P2, pick([pt(1, 0), pt(0, 1), pt(-1, 0), pt(0, -1)]));
        var tri = [V, P1, P2];
        if (!allWithin(tri, 10) || Math.abs(cross(V, P1, P2)) < 10) return null;
        for (var i = 0; i < 3; i++) {
          var a = tri[(i + 1) % 3], b = tri[(i + 2) % 3];
          if (a.x === b.x || a.y === b.y) return null;
        }
        var right = -1;
        for (var j = 0; j < 3; j++) {
          var p = tri[j], q1 = tri[(j + 1) % 3], q2 = tri[(j + 2) % 3];
          if ((q1.x - p.x) * (q2.x - p.x) + (q1.y - p.y) * (q2.y - p.y) === 0) right = j;
        }
        if (want === 3 ? right !== -1 : right !== 0) return null;
        var pos = want === 3 ? ri(0, 2) : want, order = [null, null, null];
        order[pos] = V;
        var rest = shuffle([P1, P2]), k = 0;
        for (var n = 0; n < 3; n++) if (!order[n]) order[n] = rest[k++];
        return { A: order[0], B: order[1], C: order[2], want: want };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      var G = centroid(P.A, P.B, P.C);
      wPoly(S, S.base, [P.A, P.B, P.C], { c: C.cy, w: 2.5, fill: "rgba(34,227,255,.05)" });
      ["A", "B", "C"].forEach(function (n) { wIcon(S, S.base, P[n], "station"); wTag(S, S.base, P[n], n + fp(P[n]), { away: G }); });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, mAB = slope(A, B), mBC = slope(B, Cc), mCA = slope(Cc, A);
      var names = ["A", "B", "C"];
      var why = P.want === 3 ? L("No two slopes multiply to −1, so there is no right angle.", "沒有兩條斜率之積為 −1，所以沒有直角。")
        : L("The two sides meeting at " + names[P.want] + " have slopes multiplying to −1, so ∠" + names[P.want] + " = 90°.", "在 " + names[P.want] + " 相交的兩邊斜率之積為 −1，所以 ∠" + names[P.want] + " = 90°。");
      return [{
        kicker: L("Perpendicular lines", "垂直線"),
        q: L("The builders need a square corner. Is △ABC right-angled? If so, <b>where is the right angle</b>?", "工程隊需要一個直角。△ABC 是直角三角形嗎？如是，<b>直角在哪個頂點</b>？"),
        how: L("Find m<sub>AB</sub>, m<sub>BC</sub> and m<sub>CA</sub>. Two slopes multiplying to −1 meet at a right angle.", "求 m<sub>AB</sub>、m<sub>BC</sub>、m<sub>CA</sub>。兩條斜率之積為 −1，它們相交處就是直角。"),
        formula: tx("m_1 \\times m_2 = -1"),
        fields: [{ id: "r", type: "choice", label: L("Right angle", "直角"), opts: RIGHT_OPTS }],
        action: L("Check the corner", "檢查角落"),
        answer: { r: P.want },
        hints: [
          L("∠A is between AB and CA; ∠B is between AB and BC; ∠C is between BC and CA.", "∠A 在 AB 與 CA 之間；∠B 在 AB 與 BC 之間；∠C 在 BC 與 CA 之間。"),
          L("Multiply each pair of slopes.", "把每對斜率相乘。")],
        judge: function (v) {
          if (v.r === P.want) return OK;
          return bad(L("m<sub>AB</sub> = " + fs(mAB) + ", m<sub>BC</sub> = " + fs(mBC) + ", m<sub>CA</sub> = " + fs(mCA) + ". " + why.en,
            "m<sub>AB</sub> = " + fs(mAB) + "，m<sub>BC</sub> = " + fs(mBC) + "，m<sub>CA</sub> = " + fs(mCA) + "。" + why.zh));
        },
        show: function (S, v, res, done) {
          var pts = [A, B, Cc];
          if (res.ok && P.want < 3) {
            var p = pts[P.want], o = pts.filter(function (q) { return q !== p; });
            wRight(S, S.fx, p, sub(o[0], p), sub(o[1], p), C.ok);
            wBadge(S, S.fx, p, "90°", C.ok);
          } else if (res.ok) wBadge(S, S.fx, centroid(A, B, Cc), T(L("NO 90°", "沒有直角")), C.gd);
          SFX.ping();
          wait(400, done);
        },
        workTex: [slopeTex(A, B, "A", "B"), slopeTex(B, Cc, "B", "C"), slopeTex(Cc, A, "C", "A"), why],
      }];
    },
  };

  /* ================================================================
   * Story data
   * ================================================================ */

  var CHAPTERS = [
    { tab: L("0 · Grid Room", "0 · 格線室"), sub: L("reading the map", "讀地圖"), tutorial: true, rounds: [["read"], ["count"], ["pyth"]] },
    { tab: L("1 · Evacuation", "1 · 撤離"), sub: L("distance formula", "距離公式"), rounds: [["hospital"], ["findk"], ["three"], ["iso"], ["station"]] },
    { tab: L("2 · Tracking", "2 · 追蹤"), sub: L("slope · inclination · collinear", "斜率 · 傾角 · 共線"), rounds: [["heading"], ["tracks"], ["incline"], ["landfall", { axis: "x" }], ["lineup", { collinear: true }], ["boatR"]] },
    { tab: L("3 · Channel", "3 · 航道"), sub: L("parallel · perpendicular", "平行 · 垂直"), rounds: [["fence"], ["gate"], ["findp"], ["proposals"], ["rightAt"], ["corner"]] },
    { tab: L("4 · Lights", "4 · 燈標"), sub: L("mid-point · section formula", "中點 · 分點公式"), rounds: [["mid"], ["lostTug"], ["parallelogram"], ["section"], ["sectionAB"], ["shoal"]] },
    { tab: L("5 · Mother", "5 · 媽媽"), sub: L("centres of a triangle", "三角形的中心"), rounds: [["which"], ["centroid"], ["centroidInv"], ["circum"], ["ortho"], ["where"], ["euler"]] },
  ];

  if (!stage) {
    if (typeof module === "object" && module.exports) module.exports = { R: R, CHAPTERS: CHAPTERS, parseVal: parseVal, fs: fs, rec: function (r) { REC = r; } };
    return;
  }

  var NAMES = {
    lau: L("DR. MIRA LAU", "劉米拉博士"),
    kwok: L("COMMANDER KWOK", "郭指揮官"),
    you: L("YOU", "你"),
  };
  var FACE_DEFAULT = { lau: "smile", kwok: "stern", you: "ready" };

  var OPENING = [
    { bg: "op-01-sonar.png", ken: "ken-a", music: "alert", sfx: "ping", lines: [
      L("2:13 a.m. Harbour Watch Centre, Victoria Harbour.", "凌晨 2:13，維多利亞港海港監察中心。"),
      L("Sonar has just picked up something enormous.", "聲納剛剛捕捉到一個龐然大物。"),
    ] },
    { bg: "op-02-bo-surface.png", ken: "ken-b", sfx: "ping", lines: [
      L("Right beside the Star Ferry, a giant creature rises out of the water.", "就在天星小輪旁，一頭巨大生物從海中升起。"),
      L("Its eyes are as big as car tyres. Its back glows blue.", "牠的眼睛有車胎那麼大，背上泛着藍光。"),
    ] },
    { bg: "op-03-cannon.png", ken: "ken-c", music: "alert", who: "kwok", face: "stern", lines: [
      L("This is Commander Kwok. Load the sonic cannon.", "我是郭指揮官。聲波炮上膛。"),
      L("If that thing moves towards the city, we fire.", "那東西只要向市區移動，我們就開炮。"),
    ] },
    { bg: "op-02-bo-surface.png", who: "lau", face: "worried", lines: [
      L("Commander, wait! Look at the size of its fins. That's a baby.", "指揮官，等等！看看牠的鰭有多小——牠還是幼崽。"),
      L("Babies don't attack cities. Something is wrong.", "幼崽不會攻擊城市。事情不對勁。"),
    ] },
    { bg: "op-03-cannon.png", who: "kwok", face: "angry", lines: [
      L("Then prove it, Dr. Lau. You have until sunrise.", "那就證明給我看，劉博士。你只有到日出前的時間。"),
      L("Every wrong number brings my cannon one charge closer to firing.", "每算錯一個數字，聲波炮就增加一格能量。"),
    ] },
    { bg: "op-04-gridroom.png", ken: "ken-a", music: "grid", who: "lau", face: "smile", lines: [
      L("You must be the new grid analyst. Welcome to the Grid Room.", "你一定是新來的格線分析員。歡迎來到格線室。"),
      L("This table maps the harbour on a coordinate plane. One square is 100 metres.", "這張桌把海港畫成坐標平面，每一格代表 100 米。"),
    ] },
    { bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: [
      L("I'll read the sonar. You give me numbers — not guesses.", "我來讀聲納，你給我數字——不要猜測。"),
      L("Three wrong answers fill the cannon. Its deterrent blast will scare the creature off and cost us its signal.", "錯三次，聲波炮就會蓄滿。驅離震波會嚇跑牠，令我們失去訊號。"),
    ] },
  ];

  /* After 3 misses: deterrent blast scares Bo off — not a kill shot. Then retry the same round. */
  var FAIL_BLAST = [
    { bg: "op-03-cannon.png", ken: "ken-c", music: "alert", sfx: "cannon", who: "kwok", face: "angry", lines: [
      L("Cannon charged. Deterrent blast — clear that water!", "聲波炮蓄滿。驅離震波——把那片水域清開！"),
    ] },
    { bg: "op-02-bo-surface.png", ken: "ken-b", sfx: "splash", lines: [
      L("The shockwave slams the surface. Bo startles, dives — and the sonar signal goes dead.", "震波砸在海面上。Bo 受驚一竄潛下——聲納訊號斷了。"),
    ] },
    { bg: "op-04-gridroom.png", who: "lau", face: "worried", lines: [
      L("We scared it off again! That was a deterrent blast, not a rescue.", "我們又嚇跑它了！那是驅離震波，不是救援。"),
      L("Bo needs a path home — not a cannon. Fresh numbers. Try this round again.", "Bo 要的是回家的路——不是炮彈。換一組新數字，再試這一關。"),
    ] },
  ];

  var STORY = [
    {
      card: { img: "op-04-gridroom.png", kicker: L("Chapter 0 · warm-up", "第 0 章 · 熱身"), name: L("The Grid Room", "格線室"), sub: L("coordinates · distance formula", "坐標 · 距離公式") },
      music: "grid",
      intro: [
        { bg: "op-02-bo-surface.png", ken: "ken-b", sfx: "ping", lines: [
          L("Recap: sonar found a lost baby sea creature in Victoria Harbour. We call it Bo — it has lost its mother.", "前情：聲納在維多利亞港發現一隻迷路的小海生物。我們叫它 Bo——它和媽媽走散了。"),
        ] },
        { bg: "op-04-gridroom.png", ken: "ken-a", music: "grid", who: "lau", face: "smile", lines: [
          L("I'm Dr. Mira Lau. Tonight you work with me and Commander Kwok as our map analyst.", "我是劉米拉博士。今晚你和我、郭指揮官一起行動，你是地圖分析員。"),
          L("This is the Grid Room. Before we rush outside, warm up: find Bo on the map, then measure how far things are.", "這裏是格線室。衝出去之前先熱身：在地圖上找到 Bo，再量量東西有多遠。"),
          L("No strikes in this warm-up. Get used to reading (x, y), then we face the real harbour.", "熱身不算失誤。先熟習讀 (x, y)，然後才進真正的海港。"),
        ] },
        { bg: "op-04-gridroom.png", who: "kwok", face: "stern", lines: [
          L("When you can pin Bo's position and distances, you join the live operation. Begin.", "你能鎖定 Bo 的位置和距離之後，才加入正式行動。開始吧。"),
        ] },
      ],
      between: [],
      outro: [
        { bg: "hg-lau-evac-command.jpg", ken: "ken-c", sfx: "alarm", who: "kwok", face: "stern", lines: [
          L("Alarm! Bo's thrashing is kicking up a danger ring on the water.", "警報！Bo 拍打水面，海面上出現一圈危險範圍。"),
        ] },
        { bg: "hg-lau-evac-command.jpg", who: "lau", face: "worried", lines: [
          L("Any building inside that ring must evacuate. We need exact distances from Bo — now.", "圈內的建築物都要撤離。現在就要算出與 Bo 的準確距離。"),
        ] },
      ],
    },
    {
      card: { img: "ch1-evac.png", kicker: L("Chapter 1", "第 1 章"), name: L("Evacuation Ring", "撤離警戒圈"), sub: L("distance formula", "距離公式"), alert: true },
      music: "alert",
      intro: [
        { bg: "hg-lau-evac-command.jpg", who: "lau", face: "focus", lines: [
          L("The harbour is panicking. Hospital, school, piers — who is inside Bo's splash zone?", "海港亂成一團。醫院、學校、碼頭——誰在 Bo 的拍浪範圍內？"),
          L("Measure each distance. If it's shorter than the danger radius, order them out.", "量出每一段距離。比危險半徑短的，立刻下令撤離。"),
        ] },
      ],
      between: [
        [{ bg: "ch1-evac.png", who: "kwok", face: "stern", lines: [
          L("Good. Keep measuring — a wrong call leaves people in the water.", "好。繼續量——算錯一次，就有人留在危險裏。"),
        ] }],
      ],
      outro: [
        { bg: "hg-lau-sonar-trace.jpg", ken: "ken-c", sfx: "ping", who: "lau", face: "focus", lines: [
          L("The ring is clear. Sonar picks up Bo moving — a straight trail across the harbour.", "警戒圈清了。聲納捕捉到 Bo 在游——海港上留下一條直線航跡。"),
          L("If we know which way that trail leans, we can wait where Bo will surface.", "只要知道這條航跡往哪邊傾，我們就能在 Bo 浮出處等候。"),
        ] },
      ],
    },
    {
      card: { img: "op-01-sonar.png", kicker: L("Chapter 2", "第 2 章"), name: L("Track the Tide", "追蹤潮向"), sub: L("slope · intercepts · collinear points", "斜率 · 截距 · 共線") },
      music: "alert",
      intro: [
        { bg: "hg-lau-sonar-trace.jpg", who: "lau", face: "focus", lines: [
          L("Bo is swimming in a straight line. The rise over the run of that line is its heading.", "Bo 正在直線游動。這條線「上升多少、橫走多少」，就是它的航向。"),
          L("Read the slope, find where it hits the shore, and check if a lighthouse sits on the same path.", "讀出斜率，算出它靠岸的位置，再確認燈塔是否就在同一條路上。"),
        ] },
      ],
      between: [
        [{ bg: "op-01-sonar.png", who: "kwok", face: "stern", lines: [
          L("Patrol boats are on the water too. Don't mix their tracks with Bo's.", "巡邏船也在水上。別把他們的航跡和 Bo 的搞混。"),
        ] }],
      ],
      outro: [
        { bg: "hg-lau-channel-engineers.jpg", who: "lau", face: "focus", lines: [
          L("Bo keeps drifting into shipping lanes. We have to build a safe channel with fences.", "Bo 一直漂進航道。我們必須用圍欄築出一條安全通道。"),
          L("Side fences must never meet — they stay parallel. The gate across the mouth must close at a right angle.", "兩側圍欄永不相交——保持平行。出口的閘門要成直角關上。"),
        ] },
      ],
    },
    {
      card: { img: "ch3-channel.png", kicker: L("Chapter 3", "第 3 章"), name: L("The Sonar Channel", "聲納航道"), sub: L("parallel · perpendicular lines", "平行線 · 垂直線") },
      music: "grid",
      intro: [
        { bg: "hg-lau-channel-engineers.jpg", who: "lau", face: "focus", lines: [
          L("Engineers are waiting for numbers. A fence that runs beside another needs the same slope.", "工程隊在等數字。要與另一道圍欄並排，兩條線的斜率必須相同。"),
          L("A gate that seals the channel needs the opposite reciprocal slope — a true right angle.", "要封住航道的閘門，斜率必須是負倒數——真正的直角。"),
        ] },
      ],
      between: [
        [{ bg: "ch3-channel.png", who: "kwok", face: "stern", lines: [
          L("Check every proposal. One crooked corner and Bo escapes into the open harbour.", "每個方案都要核對。一個歪角，Bo 就會逃進外港。"),
        ] }],
      ],
      outro: [
        { bg: "hg-lau-lights-boat.jpg", who: "lau", face: "worried", lines: [
          L("Night falls. The channel we built is pitch black — Bo can't see the edges.", "夜幕降臨。我們築好的航道一片漆黑——Bo 看不見兩邊。"),
          L("Drop signal lights on the water so Bo can follow the safe path home.", "在水面上放下信號燈，讓 Bo 沿着安全路線回家。"),
        ] },
      ],
    },
    {
      card: { img: "ch4-lights.png", kicker: L("Chapter 4", "第 4 章"), name: L("Lights on the Water", "水面燈標"), sub: L("mid-point · section formula", "中點 · 分點公式") },
      music: "grid",
      intro: [
        { bg: "hg-lau-lights-boat.jpg", who: "lau", face: "focus", lines: [
          L("Two buoys mark the edges of the channel. Bo always swims down the middle — the safest water.", "兩個浮標標出航道兩側。Bo 總是沿正中央游——那裏最安全。"),
          L("So the first light must sit exactly halfway between them. That's why we need the mid-point.", "所以第一盞燈必須放在兩浮標的正中央。這就是為什麼要求中點。"),
        ] },
        { bg: "ch4-lights.png", who: "kwok", face: "stern", lines: [
          L("Later lights go closer to one buoy when Bo is shy of the middle. We'll cut the segment in a given ratio.", "之後有些燈要偏近其中一個浮標——Bo 不敢靠中央時。那時就要按指定比分割線段。"),
        ] },
      ],
      between: [
        [{ bg: "ch4-lights.png", who: "lau", face: "smile", lines: [
          L("Light is on. Keep placing them — every exact spot keeps Bo off the rocks.", "燈亮了。繼續放——每一個準確位置都能讓 Bo 避開礁石。"),
        ] }],
        [{ bg: "ch4-lights.png", who: "kwok", face: "stern", lines: [
          L("A tug lost contact. Its last signal said a light was halfway between it and another boat — reverse that.", "一艘拖船失聯。最後信號說，有盞燈正好在它和另一艘船中間——倒推回去。"),
        ] }],
      ],
      outro: [
        { bg: "hg-lau-mother-signal.jpg", sfx: "call", who: "lau", face: "wow", lines: [
          L("Radio crackle — Bo's mother answered! Three rescue stations form a triangle around her call.", "無線電沙沙作響——Bo 的媽媽回應了！三個救援站圍成三角形，罩住她的呼叫。"),
          L("She is waiting at one of the triangle's centres. Match the job, then find the exact point.", "她在三角形的其中一個「心」等候。先配對工作，再算出準確位置。"),
        ] },
      ],
    },
    {
      card: { img: "ch5-call.png", kicker: L("Chapter 5", "第 5 章"), name: L("Where the Mother Waits", "媽媽守候之處"), sub: L("centres of a triangle", "三角形的中心") },
      music: "alert",
      intro: [
        { bg: "hg-lau-mother-signal.jpg", who: "lau", face: "focus", lines: [
          L("Mother's signal is weak. Different teams need different meeting points on the triangle of stations.", "媽媽的信號很弱。不同隊伍要在三個站點構成的三角形上，會合在不同的點。"),
          L("Balance point for the sling, equal distance for Mother, altitudes for the medical boat — each centre has a job.", "吊索要平衡點，媽媽要等距點，醫療船要垂線交點——每個「心」都有任務。"),
        ] },
        { bg: "ch5-call.png", who: "kwok", face: "stern", lines: [
          L("Her last message: three lamps — G, O and H — lie on one straight line. Light them, then follow that line home.", "她最後的訊息：三盞燈 G、O、H 在同一直線上。點亮它們，沿着那條線回家。"),
        ] },
      ],
      between: [
        [{ bg: "ch5-call.png", who: "lau", face: "smile", lines: [
          L("One centre found. Keep going — Mother is still waiting.", "找到一個中心了。繼續——媽媽還在等。"),
        ] }],
      ],
      outro: [],
    },
  ];

  var ENDING = [
    { bg: "end-01-mother.png", ken: "ken-a", music: "dawn", lines: [
      L("Sunrise. Mother and Bo meet at Lei Yue Mun.", "日出。媽媽與 Bo 在鯉魚門重逢。"),
    ] },
    { bg: "end-03-badge.png", ken: "ken-c", who: "kwok", face: "proud", lines: [
      L("Your coordinates kept the harbour safe. Well done.", "你的坐標守住了海港。做得好。"),
    ] },
  ];

  var PRAISE = ["Spot on.", "Locked in.", "Perfect numbers.", "Exactly right.", "Dr. Lau nods.", "Bo likes that."];
  var PRAISE_ZH = ["完全正確。", "鎖定！", "數字完美。", "一點不差。", "劉博士點頭了。", "Bo 很開心。"];

  /* ================================================================
   * SVG helpers
   * ================================================================ */

  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function sv(tag, attrs, parent) {
    var n = doc.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, o) {
    o = o || {};
    var t = sv("text", { x: x, y: y, "text-anchor": o.anchor || "middle", fill: o.fill || C.ink, "font-size": o.size || 16, "font-weight": o.weight || 700, class: o.cls }, parent);
    t.textContent = s;
    return t;
  }
  function glowFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd || 4, result: "b" }, f);
    var m = sv("feMerge", {}, f);
    sv("feMergeNode", { in: "b" }, m);
    sv("feMergeNode", { in: "SourceGraphic" }, m);
  }
  function blurFilter(defs, id, sd) {
    var f = sv("filter", { id: id, x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    sv("feGaussianBlur", { stdDeviation: sd }, f);
  }
  function grad(defs, id, stops, o) {
    o = o || {};
    var g = sv(o.radial ? "radialGradient" : "linearGradient", o.radial ? { id: id, cx: "50%", cy: o.cy || "50%", r: o.r || "60%" } : { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    stops.forEach(function (s) { sv("stop", { offset: s[0], "stop-color": s[1], "stop-opacity": s[2] == null ? 1 : s[2] }, g); });
  }

  var board = sv("svg", { class: "hg-board", viewBox: "0 0 1280 720", preserveAspectRatio: "xMidYMid meet" }, stage);
  var panel = el("div", "hg-panel hg-dock");
  stage.appendChild(panel);
  var flash = el("div", "hg-flash");
  stage.appendChild(flash);

  var gen = 0;
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
  function wait(ms, fn) { var g = gen; setTimeout(function () { if (g === gen && fn) fn(); }, ms); }
  function flashRed() { flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on"); }
  function ease(k) { return 1 - Math.pow(1 - k, 3); }

  function freshBoard() {
    gen++;
    board.innerHTML = "";
    var defs = sv("defs", {}, board);
    glowFilter(defs, "hg-glow", 3.5);
    glowFilter(defs, "hg-glow-lg", 8);
    blurFilter(defs, "hg-blur", 5);
    grad(defs, "hg-sea", [[0, "#071a33"], [0.55, "#05142a"], [1, "#030b1a"]]);
    grad(defs, "hg-vig", [[0.55, "#000", 0], [1, "#000", 0.55]], { radial: true, r: "75%" });
    grad(defs, "hg-sweep", [[0, "#22e3ff", 0.18], [1, "#22e3ff", 0]], { radial: true, r: "50%" });
    sv("rect", { x: 0, y: 0, width: 1280, height: BH, fill: "#040a16" }, board);
    return sv("g", {}, board);
  }

  /* ---------- the coordinate map ---------- */

  function makeMap(root, pts, o) {
    o = o || {};
    var xs = [0], ys = [0];
    pts.forEach(function (p) { if (p && isFinite(p.x) && isFinite(p.y)) { xs.push(p.x); ys.push(p.y); } });
    var pad = o.pad == null ? 2 : o.pad;
    /* Extra world space under the lowest point so labels / pins clear the dock edge. */
    var padBot = o.padBot == null ? 1.5 : o.padBot;
    var x0 = Math.floor(Math.min.apply(null, xs)) - pad, x1 = Math.ceil(Math.max.apply(null, xs)) + pad;
    var y0 = Math.floor(Math.min.apply(null, ys)) - pad - padBot, y1 = Math.ceil(Math.max.apply(null, ys)) + pad;
    if (x1 - x0 < 12) { var e1 = (12 - (x1 - x0)) / 2; x0 -= e1; x1 += e1; }
    if (y1 - y0 < 9) { var e2 = (9 - (y1 - y0)) / 2; y0 -= e2; y1 += e2; }
    var u = Math.min(FR.w / (x1 - x0), FR.h / (y1 - y0));
    var ex = (FR.w / u - (x1 - x0)) / 2, ey = (FR.h / u - (y1 - y0)) / 2;
    x0 -= ex; x1 += ex; y0 -= ey; y1 += ey;

    var S = { u: u, x0: x0, x1: x1, y0: y0, y1: y1 };
    S.P = function (p) { return { x: FR.x + (p.x - x0) * u, y: FR.y + (y1 - p.y) * u }; };
    S.inv = function (sx, sy) { return pt(x0 + (sx - FR.x) / u, y1 - (sy - FR.y) / u); };
    S.inView = function (p) { return p && isFinite(p.x) && isFinite(p.y) && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1; };
    S.ray = function (p, d) {
      var t = Infinity;
      if (d.x > 1e-9) t = Math.min(t, (x1 - p.x) / d.x);
      if (d.x < -1e-9) t = Math.min(t, (x0 - p.x) / d.x);
      if (d.y > 1e-9) t = Math.min(t, (y1 - p.y) / d.y);
      if (d.y < -1e-9) t = Math.min(t, (y0 - p.y) / d.y);
      if (!isFinite(t) || t < 0) return p;
      return add(p, mul(d, t));
    };
    /* Keep icons readable even when the grid is zoomed out. */
    S.k = clamp(u / 40, 0.85, 1.35);

    var cp = sv("clipPath", { id: "hg-clip" }, board.querySelector("defs"));
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 14 }, cp);
    var g = sv("g", { "clip-path": "url(#hg-clip)" }, root);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#hg-sea)" }, g);
    S.base0 = sv("g", {}, g);

    var step = u >= 28 ? 1 : u >= 16 ? 2 : 5;
    for (var i = Math.ceil(x0); i <= Math.floor(x1); i++) {
      var X = S.P(pt(i, 0)).x;
      sv("line", { x1: X, y1: FR.y, x2: X, y2: FR.y + FR.h, stroke: i % 5 ? "rgba(110,200,255,.11)" : "rgba(110,200,255,.24)", "stroke-width": 1 }, S.base0);
    }
    for (var j = Math.ceil(y0); j <= Math.floor(y1); j++) {
      var Y = S.P(pt(0, j)).y;
      sv("line", { x1: FR.x, y1: Y, x2: FR.x + FR.w, y2: Y, stroke: j % 5 ? "rgba(110,200,255,.11)" : "rgba(110,200,255,.24)", "stroke-width": 1 }, S.base0);
    }
    var O = S.P(pt(0, 0));
    var sweep = sv("g", { opacity: 0.55 }, S.base0);
    sv("path", { d: "M" + O.x + " " + O.y + " L" + (O.x + 900) + " " + (O.y - 120) + " A900 900 0 0 0 " + (O.x + 900) + " " + (O.y + 40) + " Z", fill: "url(#hg-sweep)" }, sweep);
    sv("animateTransform", { attributeName: "transform", type: "rotate", from: "0 " + O.x + " " + O.y, to: "-360 " + O.x + " " + O.y, dur: "14s", repeatCount: "indefinite" }, sweep);

    var axes = sv("g", {}, S.base0);
    sv("line", { x1: FR.x, y1: O.y, x2: FR.x + FR.w - 4, y2: O.y, stroke: "#7fe8ff", "stroke-width": 2, opacity: 0.85 }, axes);
    sv("line", { x1: O.x, y1: FR.y + FR.h, x2: O.x, y2: FR.y + 4, stroke: "#7fe8ff", "stroke-width": 2, opacity: 0.85 }, axes);
    sv("path", { d: "M" + (FR.x + FR.w - 4) + " " + O.y + " l-12 -6 v12 Z", fill: "#7fe8ff" }, axes);
    sv("path", { d: "M" + O.x + " " + (FR.y + 4) + " l-6 12 h12 Z", fill: "#7fe8ff" }, axes);
    txt(axes, FR.x + FR.w - 16, O.y - 12, "x", { fill: "#7fe8ff", size: 18, cls: "hg-ital" });
    txt(axes, O.x + 14, FR.y + 22, "y", { fill: "#7fe8ff", size: 18, cls: "hg-ital" });
    txt(axes, O.x - 12, O.y + 18, "O", { fill: "#bfefff", size: 15 });
    for (i = Math.ceil(x0); i <= Math.floor(x1); i++) {
      if (!i || i % step) continue;
      var px = S.P(pt(i, 0));
      if (px.x > FR.x + FR.w - 30 || px.x < FR.x + 8) continue;
      sv("line", { x1: px.x, y1: O.y - 4, x2: px.x, y2: O.y + 4, stroke: "#7fe8ff", "stroke-width": 1.5 }, axes);
      txt(axes, px.x, O.y + 18, neg(i), { fill: "#9fc6dc", size: 13, weight: 600 });
    }
    for (j = Math.ceil(y0); j <= Math.floor(y1); j++) {
      if (!j || j % step) continue;
      var py = S.P(pt(0, j));
      if (py.y < FR.y + 30 || py.y > FR.y + FR.h - 8) continue;
      sv("line", { x1: O.x - 4, y1: py.y, x2: O.x + 4, y2: py.y, stroke: "#7fe8ff", "stroke-width": 1.5 }, axes);
      txt(axes, O.x - 9, py.y + 5, neg(j), { fill: "#9fc6dc", size: 13, weight: 600, anchor: "end" });
    }

    S.base = sv("g", {}, g);
    S.keep = sv("g", {}, g);
    S.step = sv("g", {}, g);
    S.fx = sv("g", {}, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#hg-vig)", "pointer-events": "none" }, g);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 14, fill: "none", stroke: "rgba(34,227,255,.25)", "stroke-width": 1.5 }, root);
    txt(root, FR.x + FR.w - 16, FR.y + 22, "1 unit = 100 m", { fill: "#6f8aa3", size: 13, anchor: "end", weight: 600 });
    /* Things a label must not sit on: axis + tick numbers, the scale note, then every icon, pin, line and label drawn later. */
    S.obs = [];
    /* Tick numbers sit under the x-axis and to the left of the y-axis — keep those strips only. */
    if (O.y > FR.y && O.y < FR.y + FR.h) S.obs.push({ r: { x0: FR.x, y0: O.y - 3, x1: FR.x + FR.w, y1: O.y + 20 } });
    if (O.x > FR.x && O.x < FR.x + FR.w) S.obs.push({ r: { x0: O.x - 36, y0: FR.y, x1: O.x - 2, y1: FR.y + FR.h } });
    S.obs.push({ r: { x0: FR.x + FR.w - 120, y0: FR.y, x1: FR.x + FR.w, y1: FR.y + 30 } });
    return S;
  }
  function obsRect(S, el, x0, y0, x1, y1) { addObs(S, { el: el, r: { x0: x0, y0: y0, x1: x1, y1: y1 } }); }
  function obsSeg(S, el, A, B) { if (Math.abs(A.x - B.x) + Math.abs(A.y - B.y) > 1) addObs(S, { el: el, a: A, b: B }); }
  function addObs(S, o) { if (!S.obs) return; S.obs.push(o); reflow(S, o); }
  function segHitsRect(a, b, r) {
    if (Math.max(a.x, b.x) < r.x0 || Math.min(a.x, b.x) > r.x1 || Math.max(a.y, b.y) < r.y0 || Math.min(a.y, b.y) > r.y1) return false;
    var inside = function (p) { return p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1; };
    if (inside(a) || inside(b)) return true;
    var side = function (x, y) { return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); };
    var s1 = side(r.x0, r.y0), s2 = side(r.x1, r.y0), s3 = side(r.x0, r.y1), s4 = side(r.x1, r.y1);
    return !((s1 > 0 && s2 > 0 && s3 > 0 && s4 > 0) || (s1 < 0 && s2 < 0 && s3 < 0 && s4 < 0));
  }
  function hits(S, r, self) {
    var n = 0;
    (S.obs || []).forEach(function (o) {
      if (o === self || (o.el && !o.el.isConnected)) return;
      if (o.r ? !(o.r.x1 < r.x0 || o.r.x0 > r.x1 || o.r.y1 < r.y0 || o.r.y0 > r.y1) : segHitsRect(o.a, o.b, r)) n++;
    });
    return n;
  }

  /* ---------- world-space drawing ---------- */

  function wLine(S, layer, a, b, o) {
    o = o || {};
    var A = S.P(a), B = S.P(b);
    var l = sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: o.c || C.cy, "stroke-width": o.w || 2, "stroke-dasharray": o.dash || null, "stroke-linecap": o.cap || "round", opacity: o.op, filter: o.glow ? "url(#hg-glow)" : null }, layer);
    obsSeg(S, l, A, B);
    return l;
  }
  /* Solid fence: continuous rail + short posts (never a sparse dash that looks “broken”). */
  function wFence(S, layer, a, b, c) {
    wLine(S, layer, a, b, { c: c, w: 3.5, glow: 1 });
    var A = S.P(a), B = S.P(b);
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var g = sv("g", {}, layer);
    for (var t = 14; t < L - 8; t += 15) {
      var x = A.x + ux * t, y = A.y + uy * t;
      sv("line", { x1: x - nx * 5, y1: y - ny * 5, x2: x + nx * 5, y2: y + ny * 5, stroke: c, "stroke-width": 2.2, "stroke-linecap": "round" }, g);
    }
    return g;
  }
  /* JM29 parallelArrows: chevron // marks sitting on the segment (n = 1 or 2). */
  function wParallel(S, layer, a, b, n, c) {
    var A = S.P(a), B = S.P(b);
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    /* Orient left→right / bottom→top so opposite sides match (JM29 orientSeg). */
    if (Math.abs(dx) >= Math.abs(dy) ? dx < 0 : dy < 0) { var tmp = A; A = B; B = tmp; dx = -dx; dy = -dy; }
    var u = pt(dx / L, dy / L), nrm = pt(-u.y, u.x);
    var midPt = pt((A.x + B.x) / 2, (A.y + B.y) / 2);
    var count = Math.max(1, Math.min(2, n || 1));
    var g = sv("g", { class: "hg-para" }, layer);
    var base0 = pt(midPt.x - u.x * 2, midPt.y - u.y * 2);
    for (var set = 0; set < count; set++) {
      var off = (set - (count - 1) / 2) * 11;
      var base = pt(base0.x + u.x * off, base0.y + u.y * off);
      var tip = pt(base.x + u.x * 7, base.y + u.y * 7);
      var left = pt(base.x - u.x * 3 + nrm.x * 6, base.y - u.y * 3 + nrm.y * 6);
      var right = pt(base.x - u.x * 3 - nrm.x * 6, base.y - u.y * 3 - nrm.y * 6);
      sv("polygon", { points: tip.x + "," + tip.y + " " + left.x + "," + left.y + " " + right.x + "," + right.y, fill: c || C.ok }, g);
    }
    return g;
  }
  function wDot(S, layer, p, c, r) { var q = S.P(p); return sv("circle", { cx: q.x, cy: q.y, r: r || 4, fill: c || C.cy }, layer); }
  function wPin(S, layer, p, c, label, away) {
    var q = S.P(p), g = sv("g", { class: "hg-pin" }, layer);
    sv("circle", { cx: q.x, cy: q.y, r: 9, fill: "none", stroke: c, "stroke-width": 2, opacity: 0.6 }, g);
    sv("circle", { cx: q.x, cy: q.y, r: 4.5, fill: c }, g);
    obsRect(S, g, q.x - 10, q.y - 10, q.x + 10, q.y + 10);
    if (label) wTag(S, layer, p, label, away ? { c: c, lift: 1, away: away } : { c: c, up: 1, lift: 1 });
    return g;
  }
  /* For a line through A and B that runs on past B: an `away` point that puts B's label beside the line (above it). */
  function besideLine(B, A) {
    var d = sub(B, A), n = pt(d.y, -d.x);
    if (n.y > 0 || (n.y === 0 && n.x > 0)) n = mul(n, -1);
    return add(B, n);
  }
  function wTag(S, layer, p, s, o) {
    o = o || {};
    var src = s;
    s = String(T(s));
    var q = S.P(p), size = o.size || 15, anchor = o.anchor || "start";
    var lift = o.lift ? 10 : 0;
    var upY = -Math.round(16 + 12 * S.k + lift), downY = Math.round(22 + 12 * S.k) + lift, sideX = Math.round(26 * S.k) + 4;
    var dx = 14, dy = o.up ? upY : o.below ? downY : 8;
    if (o.side) { dx = 16; if (!o.up && !o.below) dy = 5; }
    if (o.below || anchor === "middle") { if (!o.side) dx = 0; if (o.below) anchor = o.anchor || "middle"; }
    /* o.away: the point this one gets joined to — put the label on the opposite side so the line misses it. */
    if (o.away) {
      var aw = S.P(o.away);
      dy = aw.y < q.y - 4 ? downY : upY;
      anchor = aw.x > q.x + 4 ? "end" : "start";
      dx = anchor === "end" ? -14 : 14;
    }
    /* Stroke halo only (CSS .hg-board text) — no black boxes; those looked off-centre. */
    var t = txt(layer, 0, 0, s, { fill: o.c || C.ink, size: size, anchor: anchor, weight: 800 });
    var cands = [[anchor, anchor === "middle" ? (o.side ? dx : 0) : anchor === "end" ? -Math.abs(dx) : dx, dy]];
    [["start", 14, upY], ["end", -14, upY], ["start", 14, downY], ["end", -14, downY], ["middle", 0, upY], ["middle", 0, downY],
      ["start", sideX, 5], ["end", -sideX, 5], ["start", sideX, upY], ["end", -sideX, upY], ["start", sideX, downY], ["end", -sideX, downY],
      ["start", 14, upY - 18], ["end", -14, upY - 18], ["start", 14, downY + 18], ["end", -14, downY + 18], ["middle", 0, upY - 18], ["middle", 0, downY + 18],
      ["start", sideX + 24, 5], ["end", -sideX - 24, 5]]
      .forEach(function (c) { cands.push(c); });
    var e = { el: t, q: q, cands: cands, tag: 1, r: null, src: src };
    placeTag(S, e);
    if (S.obs) S.obs.push(e);
    return t;
  }
  /* Try each candidate offset; keep the first that is inside the frame and touches nothing already drawn. */
  function placeTag(S, e) {
    var t = e.el, q = e.q, best = null;
    for (var i = 0; i < e.cands.length; i++) {
      var c = e.cands[i];
      t.setAttribute("text-anchor", c[0]);
      t.setAttribute("x", q.x + c[1]);
      t.setAttribute("y", q.y + c[2]);
      var bb = t.getBBox(), r = { x0: bb.x - 2, y0: bb.y - 1, x1: bb.x + bb.width + 2, y1: bb.y + bb.height + 1 };
      var out = r.x0 < FR.x + 4 || r.x1 > FR.x + FR.w - 4 || r.y0 < FR.y + 4 || r.y1 > FR.y + FR.h - 4;
      var score = (out ? 100 : 0) + hits(S, r, e) + i * 0.01;
      if (!best || score < best.score) best = { c: c, r: r, score: score };
      if (score < 1) break;
    }
    t.setAttribute("text-anchor", best.c[0]);
    t.setAttribute("x", q.x + best.c[1]);
    t.setAttribute("y", q.y + best.c[2]);
    e.r = best.r;
  }
  /* Something new was drawn: move any label it lands on. */
  function reflow(S, o) {
    (S.obs || []).forEach(function (e) {
      if (!e.tag || e === o || !e.el.isConnected) return;
      if (o.r ? !(o.r.x1 < e.r.x0 || o.r.x0 > e.r.x1 || o.r.y1 < e.r.y0 || o.r.y0 > e.r.y1) : segHitsRect(o.a, o.b, e.r)) placeTag(S, e);
    });
  }
  function wBadge(S, layer, p, s, c) {
    var q = S.P(p), g = sv("g", { class: "hg-pop" }, layer);
    var t = txt(g, q.x, q.y + 30, s, { fill: c, size: 13, weight: 800, anchor: "middle" });
    var bb = t.getBBox(), padX = 8, padY = 4;
    var rect = sv("rect", {
      x: bb.x - padX, y: bb.y - padY, width: bb.width + padX * 2, height: bb.height + padY * 2,
      rx: 6, fill: "rgba(4,10,22,.85)", stroke: c, "stroke-width": 1.5,
    }, g);
    g.insertBefore(rect, t);
    obsRect(S, g, bb.x - padX, bb.y - padY, bb.x + bb.width + padX, bb.y + bb.height + padY);
    return g;
  }
  function wRing(S, layer, p, r, o) {
    o = o || {};
    var q = S.P(p), R0 = r * S.u;
    var c = sv("circle", { cx: q.x, cy: q.y, r: o.grow ? 0 : R0, fill: o.fill || "none", stroke: o.c || C.cy, "stroke-width": o.w || 2, "stroke-dasharray": o.dash, opacity: o.op }, layer);
    if (o.grow) anim(o.grow, function (k) { c.setAttribute("r", R0 * ease(k)); });
    return c;
  }
  function wPoly(S, layer, list, o) {
    o = o || {};
    var d = list.map(function (p, i) { var q = S.P(p); return (i ? "L" : "M") + q.x + " " + q.y; }).join(" ") + " Z";
    var path = sv("path", { d: d, fill: o.fill || "none", stroke: o.c || C.cy, "stroke-width": o.w || 2, "stroke-linejoin": "round" }, layer);
    list.forEach(function (p, i) { obsSeg(S, path, S.P(p), S.P(list[(i + 1) % list.length])); });
    return path;
  }
  function wGrow(S, layer, a, b, o, dur, done) {
    var A = S.P(a), B = S.P(b), l = wLine(S, layer, a, a, o);
    obsSeg(S, l, A, B);
    anim(dur, function (k) { var e = ease(k); l.setAttribute("x2", A.x + (B.x - A.x) * e); l.setAttribute("y2", A.y + (B.y - A.y) * e); }, done);
    return l;
  }
  function unit2(v) { var L = Math.hypot(v.x, v.y) || 1; return pt(v.x / L, v.y / L); }
  function wRight(S, layer, at, d1, d2, c) {
    var q = S.P(at), a = unit2(pt(d1.x, -d1.y)), b = unit2(pt(d2.x, -d2.y)), s = 13;
    var p1 = pt(q.x + a.x * s, q.y + a.y * s), p2 = pt(q.x + (a.x + b.x) * s, q.y + (a.y + b.y) * s), p3 = pt(q.x + b.x * s, q.y + b.y * s);
    return sv("path", { d: "M" + p1.x + " " + p1.y + " L" + p2.x + " " + p2.y + " L" + p3.x + " " + p3.y, fill: "none", stroke: c, "stroke-width": 2 }, layer);
  }
  function wTick(S, layer, p, dir, c) {
    var q = S.P(p), n = unit2(pt(dir.y, dir.x)), s = 8;
    return sv("line", { x1: q.x - n.x * s, y1: q.y - n.y * s, x2: q.x + n.x * s, y2: q.y + n.y * s, stroke: c, "stroke-width": 3, "stroke-linecap": "round" }, layer);
  }
  function wCrossMark(S, layer, p, c) {
    var q = S.P(p), s = 9, g = sv("g", {}, layer);
    sv("path", { d: "M" + (q.x - s) + " " + (q.y - s) + " L" + (q.x + s) + " " + (q.y + s) + " M" + (q.x + s) + " " + (q.y - s) + " L" + (q.x - s) + " " + (q.y + s), stroke: c, "stroke-width": 3.5, "stroke-linecap": "round" }, g);
    return g;
  }
  function wArrow(S, layer, a, b, c) {
    var A = S.P(a), B = S.P(b), d = unit2(pt(B.x - A.x, B.y - A.y)), n = pt(-d.y, d.x);
    sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: c, "stroke-width": 3, "stroke-linecap": "round" }, layer);
    sv("path", { d: "M" + (B.x + d.x * 10) + " " + (B.y + d.y * 10) + " L" + (B.x + n.x * 7) + " " + (B.y + n.y * 7) + " L" + (B.x - n.x * 7) + " " + (B.y - n.y * 7) + " Z", fill: c }, layer);
  }
  function wShore(S, layer) {
    var O = S.P(pt(0, 0));
    sv("rect", { x: FR.x, y: O.y, width: FR.w, height: 6, fill: "rgba(255,198,90,.18)" }, layer);
    txt(layer, FR.x + FR.w - 70, O.y - 8, "seafront", { fill: "rgba(255,198,90,.7)", size: 13, anchor: "end", weight: 600 });
  }
  function wShoal(S, layer) {
    var O = S.P(pt(0, 0)), g = sv("g", { opacity: 0.6 }, layer);
    for (var x = FR.x + 6; x < FR.x + FR.w; x += 14) sv("line", { x1: x, y1: O.y + 5, x2: x + 8, y2: O.y - 5, stroke: "#c9a35c", "stroke-width": 1.5 }, g);
    txt(layer, FR.x + FR.w - 70, O.y - 10, "shoal", { fill: "#e3c27e", size: 13, anchor: "end", weight: 600 });
  }

  /* Icons: an outer <g> carries the position, an inner one the scale and CSS pop. */
  function wIcon(S, layer, p, kind) {
    var q = S.P(p), g = sv("g", { transform: "translate(" + q.x + " " + q.y + ")" }, layer);
    var inner = sv("g", { class: "hg-icon" }, g), b = sv("g", { transform: "scale(" + S.k + ")" }, inner);
    ICONS[kind](b);
    g._p = p;
    var hw = 24 * S.k, hh = 17 * S.k;
    obsRect(S, g, q.x - hw, q.y - hh, q.x + hw, q.y + hh);
    return g;
  }
  function wMove(S, g, a, b, dur, done) {
    if (!g) { if (done) done(); return; }
    var A = S.P(a), B = S.P(b);
    var flip = B.x < A.x ? -1 : 1, body = g.firstChild && g.firstChild.firstChild;
    if (body) body.setAttribute("transform", "scale(" + flip * S.k + " " + S.k + ")");
    anim(dur, function (k) {
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      g.setAttribute("transform", "translate(" + (A.x + (B.x - A.x) * e) + " " + (A.y + (B.y - A.y) * e) + ")");
    }, done);
  }
  function wDrop(S, layer, p, kind, done) {
    var g = wIcon(S, layer, p, kind);
    g.firstChild.classList.add("hg-drop");
    SFX.drop();
    wait(380, done);
    return g;
  }

  var ICONS = {
    bo: function (b) {
      sv("ellipse", { cx: 0, cy: 0, rx: 34, ry: 20, fill: "rgba(34,227,255,.22)", filter: "url(#hg-blur)" }, b);
      sv("path", { d: "M-22 0 C-29 -3 -35 -11 -40 -10 C-37 -4 -37 4 -40 10 C-35 11 -29 3 -22 0 Z", fill: "#2a56b0", stroke: "rgba(150,220,255,.7)", "stroke-width": 1 }, b);
      sv("path", { d: "M-24 0 C-22 -12 -4 -16 10 -14 C22 -12 28 -6 28 0 C28 7 20 12 8 13 C-6 14 -22 10 -24 0 Z", fill: "#3a6fd8", stroke: "rgba(160,225,255,.85)", "stroke-width": 1.2 }, b);
      sv("path", { d: "M-15 5 C-4 11 12 11 24 4 C20 10 10 13 0 13 C-8 13 -13 9 -15 5 Z", fill: "#d4e9ff", opacity: 0.9 }, b);
      [[11, -12, 6, -23], [15, -12, 14, -24], [19, -10, 22, -21]].forEach(function (f) {
        sv("path", { d: "M" + f[0] + " " + f[1] + " Q" + (f[0] - 3) + " " + (f[1] - 7) + " " + f[2] + " " + f[3], stroke: "#5ff3ff", "stroke-width": 2.4, fill: "none", "stroke-linecap": "round", filter: "url(#hg-glow)" }, b);
      });
      sv("circle", { cx: 17, cy: -3, r: 4.6, fill: "#0a1530" }, b);
      sv("circle", { cx: 18.6, cy: -4.6, r: 1.7, fill: "#fff" }, b);
      [[-12, -8], [-4, -11], [4, -12]].forEach(function (s) { sv("circle", { cx: s[0], cy: s[1], r: 1.8, fill: "#7ff6ff", filter: "url(#hg-glow)" }, b); });
      sv("path", { d: "M2 7 Q6 13 12 9", stroke: "#2a56b0", "stroke-width": 2, fill: "none", "stroke-linecap": "round" }, b);
    },
    mother: function (b) {
      sv("circle", { cx: 0, cy: 0, r: 30, fill: "rgba(255,198,90,.25)", filter: "url(#hg-blur)" }, b);
      sv("circle", { cx: 0, cy: 0, r: 14, fill: "none", stroke: C.gd, "stroke-width": 2.5 }, b);
      sv("circle", { cx: 0, cy: 0, r: 22, fill: "none", stroke: C.gd, "stroke-width": 1.5, opacity: 0.6 }, b);
      sv("path", { d: "M-9 2 C-6 -7 6 -7 9 2 C6 6 -6 6 -9 2 Z", fill: "#3b2a7a", stroke: C.gd, "stroke-width": 1.5 }, b);
    },
    boat: function (b) {
      sv("path", { d: "M-16 2 L16 2 L11 10 L-11 10 Z", fill: "#e8eef6", stroke: "#0b1426", "stroke-width": 1 }, b);
      sv("rect", { x: -7, y: -7, width: 12, height: 9, rx: 1.5, fill: "#ff8a3d" }, b);
      sv("circle", { cx: 2, cy: -11, r: 2.2, fill: C.gd, filter: "url(#hg-glow)" }, b);
    },
    tug: function (b) {
      sv("path", { d: "M-15 2 L15 2 L12 10 L-12 10 Z", fill: "#d84a3a", stroke: "#0b1426", "stroke-width": 1 }, b);
      sv("rect", { x: -9, y: -6, width: 13, height: 8, rx: 1.5, fill: "#f2f2f2" }, b);
      sv("rect", { x: 5, y: -12, width: 4, height: 7, fill: "#222" }, b);
    },
    ferry: function (b) {
      sv("path", { d: "M-22 2 L22 2 L18 11 L-18 11 Z", fill: "#2f9e5b", stroke: "#0b1426", "stroke-width": 1 }, b);
      sv("rect", { x: -16, y: -6, width: 32, height: 8, rx: 2, fill: "#f4f4ec" }, b);
      sv("rect", { x: -12, y: -4, width: 24, height: 3, fill: "#2f9e5b" }, b);
    },
    pier: function (b) {
      sv("rect", { x: -13, y: -5, width: 26, height: 8, rx: 1.5, fill: "#8a6b45", stroke: "#3a2a18", "stroke-width": 1 }, b);
      [-9, -3, 3, 9].forEach(function (x) { sv("rect", { x: x - 1, y: 3, width: 2, height: 7, fill: "#5a4228" }, b); });
    },
    bld: function (b) {
      sv("rect", { x: -14, y: -24, width: 28, height: 28, rx: 3, fill: "#203654", stroke: "#8fb8de", "stroke-width": 1.6 }, b);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) sv("rect", { x: -10 + c * 7, y: -20 + r * 7, width: 4.5, height: 4.5, fill: "#ffd98a", opacity: (r + c) % 2 ? 0.95 : 0.55 }, b);
    },
    hospital: function (b) {
      sv("ellipse", { cx: 0, cy: -2, rx: 28, ry: 26, fill: "rgba(255,77,94,.18)", filter: "url(#hg-blur)" }, b);
      sv("rect", { x: -18, y: -26, width: 36, height: 34, rx: 4, fill: "#f4f7fb", stroke: "#dce6f2", "stroke-width": 1.5 }, b);
      sv("rect", { x: -22, y: 6, width: 44, height: 8, rx: 2, fill: "#c5d0de" }, b);
      /* Red medical cross — the landmark students look for. */
      sv("rect", { x: -5, y: -22, width: 10, height: 26, rx: 2, fill: "#ff3350" }, b);
      sv("rect", { x: -13, y: -14, width: 26, height: 10, rx: 2, fill: "#ff3350" }, b);
      sv("circle", { cx: 0, cy: -28, r: 3.5, fill: "#ff4d5e", filter: "url(#hg-glow)" }, b);
    },
    school: function (b) {
      sv("ellipse", { cx: 0, cy: -2, rx: 28, ry: 26, fill: "rgba(255,198,90,.16)", filter: "url(#hg-blur)" }, b);
      sv("rect", { x: -18, y: -18, width: 36, height: 26, rx: 3, fill: "#f0e6c8", stroke: "#c9b48a", "stroke-width": 1.4 }, b);
      sv("path", { d: "M-22 -18 L0 -32 L22 -18 Z", fill: "#3a6fd8", stroke: "#8fb8de", "stroke-width": 1.2 }, b);
      sv("rect", { x: -4, y: -2, width: 8, height: 10, fill: "#5a3a1a" }, b);
      sv("rect", { x: -14, y: -12, width: 7, height: 6, fill: "#7ec8ff" }, b);
      sv("rect", { x: 7, y: -12, width: 7, height: 6, fill: "#7ec8ff" }, b);
      sv("circle", { cx: 0, cy: -34, r: 3.2, fill: C.gd, filter: "url(#hg-glow)" }, b);
    },
    gate: function (b) {
      sv("path", { d: "M-12 8 L-12 -12 L12 -12 L12 8", fill: "none", stroke: C.gd, "stroke-width": 3, "stroke-linejoin": "round" }, b);
      sv("circle", { cx: 0, cy: -12, r: 3, fill: C.gd, filter: "url(#hg-glow)" }, b);
    },
    light: function (b) {
      sv("circle", { cx: 0, cy: 0, r: 16, fill: "rgba(255,198,90,.28)", filter: "url(#hg-blur)" }, b);
      sv("path", { d: "M-6 8 L6 8 L4 -4 L-4 -4 Z", fill: "#e9edf3", stroke: "#0b1426", "stroke-width": 1 }, b);
      sv("circle", { cx: 0, cy: -7, r: 4.5, fill: "#ffd277", filter: "url(#hg-glow)" }, b);
    },
    station: function (b) {
      sv("path", { d: "M-9 10 L0 -16 L9 10 Z", fill: "#16314f", stroke: "#8fe9ff", "stroke-width": 1.4 }, b);
      sv("circle", { cx: 0, cy: -18, r: 3.5, fill: C.cy, filter: "url(#hg-glow)" }, b);
      sv("path", { d: "M-8 -22 Q0 -30 8 -22", fill: "none", stroke: C.cy, "stroke-width": 1.5, opacity: 0.7 }, b);
    },
    heli: function (b) {
      sv("ellipse", { cx: 0, cy: 0, rx: 11, ry: 7, fill: "#cfd8e3", stroke: "#0b1426", "stroke-width": 1 }, b);
      sv("rect", { x: 8, y: -2, width: 14, height: 3, fill: "#cfd8e3" }, b);
      sv("line", { x1: -18, y1: -10, x2: 18, y2: -10, stroke: "#e8f4ff", "stroke-width": 2 }, b);
      sv("line", { x1: 0, y1: -10, x2: 0, y2: -6, stroke: "#e8f4ff", "stroke-width": 2 }, b);
      sv("circle", { cx: -4, cy: -1, r: 3, fill: "#5fb6ff" }, b);
    },
  };

  /* ================================================================
   * Audio — procedural beds and effects
   * ================================================================ */

  var MUTE_KEY = "jm33-hg-muted";
  /* Loud but clean: raise level without the old 5× clip. Soft waves + lowpass keep quality. */
  var HG_MASTER = 1.15;
  var HG_MUSIC = 0.62;
  var HG_SFX = 1.05;
  var audio = { ctx: null, master: null, music: null, sfx: null, noise: null, bed: "", want: "", next: 0, k: 0, muted: false };
  try { audio.muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function stageVisible() { return !doc.hidden && (doc.fullscreenElement === stage || stage.offsetParent !== null); }

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
    comp.knee.value = 10;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);
    audio.master = ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : HG_MASTER;
    audio.master.connect(comp);
    audio.music = ctx.createGain();
    audio.music.gain.value = 0;
    var musicBus = ctx.createGain();
    musicBus.gain.value = HG_MUSIC;
    var musicLp = ctx.createBiquadFilter();
    musicLp.type = "lowpass";
    musicLp.frequency.value = 5200;
    musicLp.Q.value = 0.65;
    audio.music.connect(musicBus);
    musicBus.connect(musicLp);
    musicLp.connect(audio.master);
    audio.sfx = ctx.createGain();
    audio.sfx.gain.value = HG_SFX;
    var sfxLp = ctx.createBiquadFilter();
    sfxLp.type = "lowpass";
    sfxLp.frequency.value = 6500;
    sfxLp.Q.value = 0.55;
    audio.sfx.connect(sfxLp);
    sfxLp.connect(audio.master);
    var buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    if (audio.want) startBed(audio.want);
  }

  function tone(t, f, dur, o) {
    o = o || {};
    var ctx = audio.ctx, osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    var g = ctx.createGain(), a = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.1, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.02));
    var node = osc;
    if (o.lp) { var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = o.lp; osc.connect(lp); node = lp; }
    node.connect(g);
    g.connect(o.out || audio.music);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, o) {
    o = o || {};
    var ctx = audio.ctx, src = ctx.createBufferSource();
    src.buffer = audio.noise;
    var f = ctx.createBiquadFilter();
    f.type = o.ft || "highpass";
    f.frequency.setValueAtTime(o.f || 6000, t);
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    if (o.q) f.Q.value = o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(o.gain || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.out || audio.music);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  var BEDS = {
    grid: {
      bpm: 84, swing: 0.5, bars: 4, vol: 1,
      roots: [45, 41, 43, 40],
      chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[(i * 3) % 4] + 12), e * 2.2, { type: "sine", gain: 0.035, lp: 2600 });
        if (i === 0) { tone(t, mtof(this.roots[bar] - 12), e * 7, { type: "triangle", gain: 0.16, lp: 600, a: 0.05 }); ch.forEach(function (m) { tone(t, mtof(m), e * 8, { type: "sine", gain: 0.016, a: 0.5 }); }); }
        if (i === 4) tone(t, mtof(this.roots[bar]), e * 3, { type: "triangle", gain: 0.08, lp: 700 });
        if (i % 2 === 0) noise(t, 0.03, { f: 6000, gain: 0.007 });
        if (bar === 0 && i === 6) tone(t, 1320, 0.8, { type: "sine", gain: 0.014, to: 1240 });
      },
    },
    alert: {
      bpm: 118, swing: 0.5, bars: 4, vol: 1,
      roots: [33, 33, 29, 31],
      play: function (t, i, bar, e) {
        var r = this.roots[bar];
        tone(t, mtof(r), e * 0.9, { type: "triangle", gain: i === 0 ? 0.11 : 0.055, lp: i % 2 ? 480 : 700 });
        noise(t, 0.03, { f: 7000, gain: 0.012 });
        if (i === 0) {
          tone(t, 90, 0.35, { to: 45, gain: 0.18 });
          tone(t, mtof(r + 36), e * 8, { type: "sine", gain: 0.012, lp: 1600, a: 0.4 });
        }
        if (i === 4) noise(t, 0.1, { ft: "bandpass", f: 1200, gain: 0.028 });
        if (bar === 3 && i === 6) tone(t, 1480, 0.7, { type: "sine", gain: 0.022, to: 1380 });
      },
    },
    dawn: {
      bpm: 96, swing: 0.5, bars: 4, vol: 1,
      chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]],
      roots: [38, 35, 31, 33],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[i % 4] + (i >= 4 ? 12 : 0)), e * 1.6, { type: "triangle", gain: 0.05 });
        if (i % 2 === 0) tone(t, mtof(this.roots[bar]), e * 1.8, { type: "sine", gain: 0.12 });
        if (i === 0) ch.forEach(function (m) { tone(t, mtof(m - 12), e * 8, { type: "sine", gain: 0.015, a: 0.3 }); });
        noise(t, 0.03, { f: 5500, gain: 0.008 });
      },
    },
  };

  function setBed(name) { audio.want = name; if (!audio.ctx || audio.bed === name) return; startBed(name); }
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
    if (!stageVisible()) { if (audio.ctx.state === "running") audio.ctx.suspend(); return; }
    if (audio.ctx.state === "suspended") { audio.ctx.resume(); return; }
    var bed = BEDS[audio.bed];
    if (!bed) return;
    var now = audio.ctx.currentTime, e = 60 / bed.bpm / 2;
    if (audio.next < now - 0.1) audio.next = now + 0.05;
    while (audio.next < now + 0.2) {
      var i = audio.k % 8, bar = Math.floor(audio.k / 8) % bed.bars;
      bed.play(audio.next + (i % 2 ? e * (2 * bed.swing - 1) : 0), i, bar, e);
      audio.k++;
      audio.next += e;
    }
  }, 40);

  function sfxOn() { return audio.ctx && audio.ctx.state === "running"; }
  var SFX = {
    click: function () { if (sfxOn()) tone(audio.ctx.currentTime, 640, 0.05, { type: "sine", gain: 0.07, lp: 2800, out: audio.sfx }); },
    blip: function () { if (sfxOn()) tone(audio.ctx.currentTime, 1000 + Math.random() * 140, 0.03, { type: "sine", gain: 0.035, lp: 3000, out: audio.sfx }); },
    ping: function () { if (sfxOn()) { var t = audio.ctx.currentTime; tone(t, 1240, 1.0, { type: "sine", gain: 0.1, to: 1120, lp: 3800, out: audio.sfx }); tone(t + 0.4, 1240, 0.65, { type: "sine", gain: 0.035, to: 1160, lp: 3800, out: audio.sfx }); } },
    alarm: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      for (var j = 0; j < 4; j++) tone(t + j * 0.16, j % 2 ? 580 : 780, 0.14, { type: "triangle", gain: 0.08, lp: 2200, out: audio.sfx });
    },
    cannon: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      tone(t, 110, 0.75, { to: 35, gain: 0.42, out: audio.sfx });
      noise(t, 0.9, { ft: "lowpass", f: 1400, fto: 110, gain: 0.28, out: audio.sfx });
    },
    win: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      [74, 78, 81, 86].forEach(function (m, j) { tone(t + j * 0.09, mtof(m), 0.5, { type: "sine", gain: 0.09, lp: 4200, out: audio.sfx }); });
    },
    drop: function () { if (sfxOn()) { var t = audio.ctx.currentTime; tone(t, 800, 0.17, { to: 250, gain: 0.08, lp: 3200, out: audio.sfx }); noise(t + 0.05, 0.22, { ft: "bandpass", f: 750, gain: 0.055, out: audio.sfx }); } },
    splash: function () { if (sfxOn()) noise(audio.ctx.currentTime, 0.55, { ft: "bandpass", f: 650, fto: 2000, gain: 0.11, q: 0.5, out: audio.sfx }); },
    whoosh: function () { if (sfxOn()) noise(audio.ctx.currentTime, 0.75, { ft: "bandpass", f: 380, fto: 2400, gain: 0.09, q: 0.55, out: audio.sfx }); },
    call: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      tone(t, 280, 1.35, { type: "sine", to: 500, gain: 0.12, a: 0.3, lp: 2800, out: audio.sfx });
      tone(t + 1.25, 500, 1.5, { type: "sine", to: 240, gain: 0.1, a: 0.2, lp: 2800, out: audio.sfx });
      tone(t, 282, 1.35, { type: "triangle", to: 504, gain: 0.035, a: 0.3, lp: 2000, out: audio.sfx });
    },
  };

  function setMuted(m) {
    audio.muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
    if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : HG_MASTER, audio.ctx.currentTime, 0.05);
    Array.prototype.forEach.call(stage.querySelectorAll(".snd"), function (b) { b.textContent = T(m ? L("Sound off", "靜音") : L("Sound on", "聲音開")); });
    if (typeof syncCineTools === "function") syncCineTools();
  }

  /* ================================================================
   * Panel
   * ================================================================ */

  /* Drop bullets that only repeat map labels; keep facts the map does not show. */
  function slimGivens(list) {
    if (!list || !list.length) return null;
    var keep = [];
    list.forEach(function (s) {
      var t = String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!t) return;
      if (/^[A-Z]\([^)]+\)(\s*,\s*[A-Z]\([^)]+\))*$/.test(t)) return;
      if (/^(Bo|Pier|Ferry|Tug|Hospital|School|Lightship|Power station|Exit|Mother|Hook|Medical boat|Fence [12]|Gate|Station)[^:]*:\s*[A-Z]?\(?-?\d/i.test(t) &&
          !/\b(radius|slope|ratio|reach|Danger|mid-point|halfway|right-angled|on the|must|exactly|AP\s*:|PB|wall|ring|units)\b/i.test(t)) return;
      if (/^[A-Z][^:]{0,24}:\s*[A-Z]?\(?-?\d[^)]*\)\s*$/.test(t) && !/\b(slope|radius|ratio|mid-point|right-angled)\b/i.test(t)) return;
      keep.push(s);
    });
    return keep.length ? keep : null;
  }

  function fieldHTML(f) {
    var lab = "<span>" + T(f.label) + (f.sub ? "<small>" + T(f.sub) + "</small>" : "") + "</span>";
    var inp = function (id, ph) { return '<input data-f="' + id + '" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="' + (T(ph) || "") + '">'; };
    if (f.type === "pt") return '<div class="hg-field pt">' + lab + '<div class="hg-pair"><b>(</b>' + inp(f.id + "_x", "x") + "<b>,</b>" + inp(f.id + "_y", "y") + "<b>)</b></div></div>";
    if (f.type === "ratio") return '<div class="hg-field pt">' + lab + '<div class="hg-pair">' + inp(f.id + "_r") + "<b>:</b>" + inp(f.id + "_s") + "</div></div>";
    if (f.type === "choice") return '<div class="hg-field choice' + (f.small ? " small" : "") + '">' + lab + '<div class="hg-opts" data-c="' + f.id + '">' +
      f.opts.map(function (o, i) { return '<button type="button" data-i="' + i + '">' + T(o) + "</button>"; }).join("") + "</div></div>";
    return '<div class="hg-field num">' + lab + '<div class="hg-one">' + inp(f.id, f.ph) + (f.undef ? '<button type="button" class="hg-undef" data-for="' + f.id + '">undefined</button>' : "") + (f.unit ? "<em>" + T(f.unit) + "</em>" : "") + "</div></div>";
  }
  /* Field name for messages: the plain label, without any \( … \) maths markup. */
  function workHTML(list, open) {
    if (!list || !list.length) return "";
    return '<details class="hg-workbox"' + (open ? " open" : "") + "><summary>" + T(L("Working", "計算過程")) + '</summary><ul class="hg-work">' +
      list.map(function (s) { return "<li>" + subs(T(s)) + "</li>"; }).join("") + "</ul></details>";
  }
  function fname(f) { return String(T(f.label)).replace(/\\\(|\\\)/g, "").replace(/\s*=\s*$/, "").trim(); }

  function buildPanel(o) {
    lang = o.q ? langPref : "en";
    var givens = slimGivens(o.info);
    var manyChoice = o.fields.filter(function (f) { return f.type === "choice"; }).length >= 2;
    var kick = T(o.kicker) + (o.step ? T(L(" · Step " + o.step[0] + "/" + o.step[1], " · 第 " + o.step[0] + "/" + o.step[1] + " 步")) : "");
    panel.className = "hg-panel hg-dock" + (manyChoice ? " tall" : "") + (o.q ? " v2" : "");
    /* v2: one question, one formula, one answer row; the small tools sit in the top bar. */
    if (o.q) panel.innerHTML =
      '<div class="hg-dock-main">' +
        '<div class="hg-top">' +
          '<div class="hg-kicker">' + kick + '<span class="hg-story">' + T(o.title) + "</span>" + (o.skill ? '<span class="hg-chip">' + T(o.skill) + "</span>" : "") + "</div>" +
          '<div class="hg-tools">' + (o.meter != null ? '<div class="hg-meter"></div>' : "") +
            '<button type="button" class="hg-tool hint"></button>' +
            (ALLOW_ANS ? '<button type="button" class="hg-tool ans">' + T(L("Show answer", "顯示答案")) + "</button>" : "") +
            '<button type="button" class="hg-tool snd">' + T(audio.muted ? L("Sound off", "靜音") : L("Sound on", "聲音開")) + "</button>" +
            '<button type="button" class="hg-tool lang">' + (lang === "zh" ? "EN" : "中文") + "</button>" +
          "</div>" +
        "</div>" +
        '<p class="hg-q">' + subs(T(o.q)) + "</p>" +
        '<div class="hg-solve">' +
          '<div class="hg-how">' + (o.how ? "<span>" + subs(T(o.how)) + "</span>" : "") + (o.formula ? '<span class="hg-formula">' + T(o.formula) + "</span>" : "") + "</div>" +
          '<div class="hg-fields">' + o.fields.map(fieldHTML).join("") + "</div>" +
          '<button type="button" class="hg-btn go">' + T(o.action) + " ▸</button>" +
          '<button type="button" class="hg-btn next" hidden>Next ▸</button>' +
        "</div>" +
        '<div class="hg-say"></div>' +
        '<ol class="hg-hints" hidden></ol>' +
      "</div>";
    else panel.innerHTML =
      '<div class="hg-dock-main">' +
      '<div class="hg-dock-row">' +
        '<div class="hg-dock-copy">' +
          '<div class="hg-top"><div class="hg-kicker">' + kick + '<span class="hg-story">' + T(o.title) + "</span></div>" + (o.meter != null ? '<div class="hg-meter"></div>' : "") + "</div>" +
          '<dl class="hg-card">' +
            (o.skill ? '<div class="hg-row skill"><dt>Skill</dt><dd>' + o.skill + "</dd></div>" : "") +
            '<div class="hg-row do"><dt>Do</dt><dd>' + subs(o.task) + "</dd></div>" +
            (o.use ? '<div class="hg-row use"><dt>Use</dt><dd>' + subs(o.use) + "</dd></div>" : "") +
          "</dl>" +
      (givens ? '<p class="hg-givens">' + givens.join('<span class="hg-dot">·</span>') + "</p>" : "") +
        "</div>" +
      '<div class="hg-fields">' + o.fields.map(fieldHTML).join("") + "</div>" +
      "</div>" +
      '<div class="hg-say"></div>' +
      '<ol class="hg-hints" hidden></ol>' +
      "</div>" +
        '<div class="hg-dock-side">' +
          '<button type="button" class="hg-btn go">' + o.action + "</button>" +
          '<div class="hg-after">' +
            '<button type="button" class="hg-btn ghost hint">Hint</button>' +
            (ALLOW_ANS ? '<button type="button" class="hg-btn ghost ans">Show answer</button>' : "") +
      '<button type="button" class="hg-btn ghost snd">' + (audio.muted ? "Sound off" : "Sound on") + "</button>" +
            '<button type="button" class="hg-btn next" hidden>Next ▸</button>' +
          "</div>" +
        "</div>";

    var go = panel.querySelector(".go"), say = panel.querySelector(".hg-say"), hintList = panel.querySelector(".hg-hints"), main = panel.querySelector(".hg-dock-main");
    var hintBtn = panel.querySelector(".hint"), ansBtn = panel.querySelector(".ans"), next = panel.querySelector(".next"), meterEl = panel.querySelector(".hg-meter");
    var hints = o.hints || [], shown = 0, choice = {}, locked = false, revealed = false;
    var workList = o.workTex || o.work;
    if (ansBtn && !o.answer) ansBtn.hidden = true;
    panel.style.minHeight = dockLock ? Math.min(dockLock, dockMax || dockLock) + "px" : "";
    if (dockMax) panel.style.maxHeight = dockMax + "px";
    var nType = o.fields.filter(function (f) { return f.type !== "choice"; }).length, nPick = o.fields.length - nType;
    var idle = manyChoice || o.q ? "" : (nType && nPick ? "Type your answer and pick an option" : nType ? "Type your answer" : "Pick an option") +
      ", then press <b>" + T(o.action) + "</b>.";
    function setSay(html, kind) {
      html = T(html);
      say.className = "hg-say " + (html ? kind || "" : "idle");
      say.innerHTML = html || (!idle ? "" : locked ? "Checking on the map…" : idle);
      tex(say);
      revealSay();
    }
    /* Scroll the dock (the real overflow container), not the inner column — otherwise feedback is clipped. */
    function revealSay() {
      requestAnimationFrame(function () {
        if (say.classList.contains("idle")) return;
        panel.scrollTop = Math.max(0, say.offsetTop - 8);
      });
    }
    setSay("");
    tex(panel);

    function hintLabel() { hintBtn.textContent = shown < hints.length ? T(L("Hint ", "提示 ")) + (shown + 1) + "/" + hints.length : T(L("No more hints", "沒有更多提示")); hintBtn.disabled = shown >= hints.length; }
    hintLabel();
    hintBtn.addEventListener("click", function () {
      if (shown >= hints.length) return;
      hintList.appendChild(el("li", null, subs(T(hints[shown++]))));
      tex(hintList.lastChild);
      hintList.hidden = false;
      var li = hintList.lastChild;
      if (li.offsetTop + li.offsetHeight > main.scrollTop + main.clientHeight) main.scrollTop = li.offsetTop + li.offsetHeight - main.clientHeight + 8;
      hintLabel();
      SFX.click();
    });
    function fillStr(a) {
      if (a == null) return "";
      if (typeof a === "string") return a;
      if (typeof a === "number") return fs(a);
      return String(a);
    }
    function fillAnswer(ans) {
      if (!ans) return;
      o.fields.forEach(function (f) {
        var a = ans[f.id];
        if (a == null && a !== 0) return;
        if (f.type === "choice") {
          choice[f.id] = a;
          var box = panel.querySelector('.hg-opts[data-c="' + f.id + '"]');
          if (!box) return;
          Array.prototype.forEach.call(box.children, function (c) {
            var on = +c.getAttribute("data-i") === a;
            c.classList.toggle("on", on);
          });
          return;
        }
        if (f.type === "pt") {
          var ix = panel.querySelector('[data-f="' + f.id + '_x"]');
          var iy = panel.querySelector('[data-f="' + f.id + '_y"]');
          if (ix) ix.value = fillStr(a.x);
          if (iy) iy.value = fillStr(a.y);
          return;
        }
        if (f.type === "ratio") {
          var ir = panel.querySelector('[data-f="' + f.id + '_r"]');
          var is_ = panel.querySelector('[data-f="' + f.id + '_s"]');
          if (ir) ir.value = fillStr(a.r != null ? a.r : a[0]);
          if (is_) is_.value = fillStr(a.s != null ? a.s : a[1]);
          return;
        }
        var inp = panel.querySelector('[data-f="' + f.id + '"]');
        if (inp) inp.value = fillStr(a);
      });
    }
    if (ansBtn) {
      ansBtn.addEventListener("click", function () {
        if (!ALLOW_ANS || locked || revealed) return;
        ensureAudio();
        SFX.click();
        revealed = true;
        fillAnswer(o.answer);
        ansBtn.disabled = true;
        ansBtn.textContent = T(L("Answer shown", "已顯示答案"));
      });
    }
    panel.querySelector(".snd").addEventListener("click", function () { ensureAudio(); setMuted(!audio.muted); });
    var langBtn = panel.querySelector(".lang");
    if (langBtn) langBtn.addEventListener("click", function () { if (o.onLang) o.onLang(); });
    Array.prototype.forEach.call(panel.querySelectorAll(".hg-opts"), function (box) {
      var id = box.getAttribute("data-c");
      choice[id] = -1;
      box.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b || locked) return;
        choice[id] = +b.getAttribute("data-i");
        Array.prototype.forEach.call(box.children, function (c) { c.classList.toggle("on", c === b); });
        SFX.click();
      });
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".hg-undef"), function (b) {
      b.addEventListener("click", function () { if (locked) return; var i = panel.querySelector('[data-f="' + b.getAttribute("data-for") + '"]'); i.value = "undefined"; i.focus(); });
    });
    Array.prototype.forEach.call(panel.querySelectorAll("input"), function (inp) {
      inp.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); go.click(); } });
    });
    var onAct = null, onNext = null;
    go.addEventListener("click", function () { if (!go.disabled && onAct) onAct(); });
    next.addEventListener("click", function () { if (onNext) onNext(); });

    function raw(id) { var i = panel.querySelector('[data-f="' + id + '"]'); return i ? i.value : ""; }

    var api = {
      onAction: function (fn) { onAct = fn; },
      onNext: function (fn) { onNext = fn; },
      read: function () {
        var out = {}, err = "";
        o.fields.forEach(function (f) {
          if (err) return;
          if (f.type === "choice") {
            out[f.id] = choice[f.id];
            if (choice[f.id] < 0) err = T(L("Choose an option for “" + fname(f) + "”.", "請為「" + fname(f) + "」選一個選項。"));
            return;
          }
          var parts = f.type === "pt" ? ["x", "y"] : f.type === "ratio" ? ["r", "s"] : [null];
          var obj = {};
          parts.forEach(function (p) {
            if (err) return;
            var id = p ? f.id + "_" + p : f.id, s = raw(id), v = parseVal(s);
            var nm = fname(f) + (p && f.type === "pt" ? " (" + p + ")" : "");
            if (v.empty) err = T(L("Fill in " + nm + ".", "請填寫 " + nm + "。"));
            else if (v.comma) err = T(L("Type one number in each box (no commas).", "每格只填一個數（不要用逗號）。"));
            else if (isNaN(v.v)) err = T(L(fname(f) + ": “" + s + "” is not a number I can read. Fractions like −3/4 and surds like 2√5 are fine.", fname(f) + "：讀不懂「" + s + "」。可以填分數如 −3/4，或根式如 2√5。"));
            else if (v.undef && !f.undef) err = T(L(fname(f) + " must be a number.", fname(f) + " 必須是一個數。"));
            v.raw = s;
            if (p) obj[p] = v; else obj = v;
          });
          out[f.id] = obj;
        });
        return { vals: out, err: err };
      },
      say: function (msg, kind) { setSay(subs(T(msg)), kind); },
      lock: function (b) {
        locked = b;
        go.disabled = b;
        Array.prototype.forEach.call(panel.querySelectorAll("input, .hg-undef"), function (i) { i.disabled = b; });
      },
      meter: function (n, max, label) {
        if (!meterEl) return;
        var h = '<span>' + (T(label) || "Strikes") + "</span>";
        for (var i = 0; i < max; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>';
        meterEl.innerHTML = h;
        meterEl.title = T(L("Each wrong answer charges the sonic cannon. At 3, a deterrent blast scares Bo off — then this round restarts with new numbers.",
          "每錯一次聲波炮蓄一格。滿 3 格會發射驅離震波嚇跑 Bo，然後本關換新數字重來。"));
        meterEl.classList.toggle("hot", n >= max - 1 && n > 0);
      },
      done: function (label) { next.textContent = T(label); next.hidden = false; if (o.q) go.hidden = true; locked = true; revealSay(); if (ansBtn) ansBtn.disabled = true; Array.prototype.forEach.call(panel.querySelectorAll(".hg-opts button"), function (b) { b.disabled = true; }); },
      focus: function () { var i = panel.querySelector("input"); if (i && !("ontouchstart" in window)) try { i.focus({ preventScroll: true }); } catch (e) {} },
    };
    return api;
  }

  /* ================================================================
   * Round runner
   * ================================================================ */

  /* ctx: kicker, meter() → [n, max, label] or null, onWrong(api) → true if the round was rerolled,
   * onWin(), onDone(), nextLabel, auto (ms before auto-advance). */
  function runRound(spec, P, ctx) {
    cineGen++;
    talking = null;
    cine.hidden = true;
    var steps = spec.steps(P), si = 0;
    var m0 = ctx.meter ? ctx.meter() : null;
    fitFrame(steps.map(function (st, i) { try { return panelOpts(i, m0); } catch (e) { return null; } }).filter(Boolean));
    var root = freshBoard();
    var S = makeMap(root, spec.pts(P));
    spec.draw(S, P);
    var myGen = gen;
    if (TEST) window.__hg = { spec: spec, P: P, S: S, steps: steps };
    openStep();

    function panelOpts(i, m) {
      var st = steps[i];
      return {
        kicker: ctx.kicker, step: steps.length > 1 ? [i + 1, steps.length] : null,
        title: st.title || spec.title, skill: st.kicker, task: st.task, use: st.use, info: st.info, fields: st.fields, action: st.action, hints: st.hints,
        q: st.q, how: st.how, formula: st.formula, workTex: st.workTex,
        answer: typeof st.answer === "function" ? st.answer() : st.answer,
        work: st.work,
        meter: m ? m[0] : null,
      };
    }

    function openStep() {
      var st = steps[si];
      if (TEST) window.__hg.si = si;
      S.step.innerHTML = "";
      S.fx.innerHTML = "";
      if (st.draw) st.draw(S);
      mountPanel(null);
    }

    /* Build the dock for the current step. `keep` (from a language switch) restores what was typed and any result. */
    function mountPanel(keep) {
      var st = steps[si], m = ctx.meter ? ctx.meter() : null, api;
      var opts = panelOpts(si, m);
      opts.onLang = function () {
        var k = { vals: {}, picks: {}, result: api.result };
        Array.prototype.forEach.call(panel.querySelectorAll("input[data-f]"), function (i) { k.vals[i.getAttribute("data-f")] = i.value; });
        Array.prototype.forEach.call(panel.querySelectorAll(".hg-opts"), function (b) { var on = b.querySelector("button.on"); if (on) k.picks[b.getAttribute("data-c")] = on.getAttribute("data-i"); });
        setLang(lang === "zh" ? "en" : "zh");
        relabel(S);
        mountPanel(k);
      };
      api = buildPanel(opts);
      if (m) api.meter(m[0], m[1], m[2]);
      if (keep) {
        Object.keys(keep.vals).forEach(function (id) { var i = panel.querySelector('[data-f="' + id + '"]'); if (i) i.value = keep.vals[id]; });
        Object.keys(keep.picks).forEach(function (id) { var b = panel.querySelector('.hg-opts[data-c="' + id + '"] button[data-i="' + keep.picks[id] + '"]'); if (b) b.click(); });
        if (keep.result) { api.lock(true); finish(keep.result); }
      } else api.focus();
      function finish(res) {
        api.result = res;
        var head = T(pick(lang === "zh" ? PRAISE_ZH : PRAISE)) + (res.exact ? T(L(" Exact surd.", " 準確根式。")) : "");
        api.say("<b>" + head + "</b>" + workHTML(st.workTex || st.work, false), "good");
        var last = si + 1 >= steps.length;
        api.done(last ? ctx.nextLabel || L("Next ▸", "下一關 ▸") : L("Next step ▸", "下一步 ▸"));
        api.onNext(function () { if (!last) { si++; openStep(); } else ctx.onDone(); });
      }
      api.onAction(function () {
        var r = api.read();
        if (r.err) { api.say(r.err, "info"); return; }
        var res = st.judge(r.vals) || bad("");
        S.fx.innerHTML = "";
        api.lock(true);
        api.say("", "");
        st.show(S, r.vals, res, function () {
          if (gen !== myGen) return;
          if (res.ok) {
            SFX.win();
            var last = si + 1 >= steps.length;
            finish({ exact: !!(res.exact || (r.vals && anyExact(r.vals))) });
            if (last && ctx.onWin) ctx.onWin();
            if (last && ctx.auto) wait(ctx.auto, function () { ctx.onDone(); });
          } else {
            var msg = res.msg || L("Not quite. Check your working, or open a hint.", "還差一點。檢查一下計算，或者打開提示。");
            if (res.soft) { api.say(msg, "info"); api.lock(false); return; }
            SFX.alarm();
            flashRed();
            api.say(msg, "bad");
            var rerolled = ctx.onWrong ? ctx.onWrong(api) : false;
            var m2 = ctx.meter ? ctx.meter() : null;
            if (m2) api.meter(m2[0], m2[1], m2[2]);
            if (!rerolled) api.lock(false);
          }
        });
      });
    }
  }
  /* The dock sits below the board. Map height is the same every round (does not shrink when the dock is taller);
   * a tall dock scrolls inside the leftover band. dockLock only stops the dock jumping between steps. */
  function fitFrame(list) {
    stage.style.aspectRatio = stage.style.height = "";
    stage.style.maxHeight = "";
    board.style.flex = board.style.aspectRatio = board.style.maxHeight = "";
    panel.style.minHeight = panel.style.maxHeight = "";
    dockLock = 0;
    dockMax = 0;
    var h = 0;
    list.forEach(function (opts) {
      buildPanel(opts);
      h = Math.max(h, panel.getBoundingClientRect().height);
    });
    dockLock = Math.ceil(h);
    /* Board size from stage width + 11:10 / 94vh — never from dock height (that made tall rounds shrink the map). */
    var w = stage.getBoundingClientRect().width || stage.clientWidth || 960;
    var cap = Math.round(window.innerHeight * 0.94);
    var pad = 28;
    var stageH = Math.min(cap, Math.round(w * 10 / 11));
    var dockBand = Math.round(Math.min(300, Math.max(200, stageH * 0.30)));
    var boardH = Math.max(240, stageH - dockBand - pad);
    BH = clamp(Math.round(1280 * boardH / w), 420, 1200);
    board.setAttribute("viewBox", "0 0 1280 " + BH);
    FR.h = BH - 2 * FR.y;
    board.style.flex = "0 0 auto";
    board.style.aspectRatio = w + " / " + boardH;
    board.style.maxHeight = boardH + "px";
    stage.style.aspectRatio = "auto";
    stage.style.height = "auto";
    stage.style.maxHeight = "94vh";
    dockMax = Math.max(140, stageH - boardH - pad);
    panel.style.maxHeight = dockMax + "px";
    panel.style.minHeight = dockLock ? Math.min(dockLock, dockMax) + "px" : "";
    fitW = stage.getBoundingClientRect().width;
  }
  /* The dock's locked min-height was measured at the old width; after a resize let it size to its content. */
  var fitW = 0;
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(function () {
      var w = stage.getBoundingClientRect().width;
      if (w > 0 && Math.abs(w - fitW) > 2) {
        fitW = w;
        dockLock = 0;
        if (!panel) return;
        panel.style.minHeight = "";
        var bh = board.getBoundingClientRect().height;
        if (bh > 0) {
          dockMax = Math.max(140, Math.round(window.innerHeight * 0.94) - bh - 28);
          panel.style.maxHeight = dockMax + "px";
        }
      }
    }).observe(stage);
  }
  function setLang(l) {
    lang = langPref = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    if (typeof onLangChange === "function") onLangChange();
  }
  /* Re-letter the map labels in the current language and re-place them (lengths change). */
  function relabel(S) {
    (S.obs || []).forEach(function (e) {
      if (!e.tag || !e.src || typeof e.src !== "object" || !e.el.isConnected) return;
      e.el.textContent = T(e.src);
      placeTag(S, e);
    });
  }
  function anyExact(vals) {
    for (var k in vals) { var v = vals[k]; if (v && v.exact && isFinite(v.v) && !isInt(v.v)) return true; }
    return false;
  }

  /* ================================================================
   * Cutscenes
   * ================================================================ */

  var cine = el("div", "hgc",
    '<img class="hgc-bg" alt=""><img class="hgc-bg" alt="">' +
    '<div class="hgc-vig"></div>' +
    '<div class="hgc-card"><p></p><div class="hgc-card-h"></div><span></span></div>' +
    '<div class="hgc-dialog"><div class="hgc-face"><img alt=""></div><div class="hgc-dbody"><div class="hgc-name"></div><p class="hgc-line"></p></div><span class="hgc-next">▼</span></div>' +
    '<div class="hgc-title" hidden></div>' +
    '<div class="hgc-tools">' +
      '<button type="button" class="hgc-tool skip" hidden></button>' +
      '<button type="button" class="hgc-tool lang"></button>' +
      '<button type="button" class="hgc-tool snd"></button>' +
    "</div>");
  cine.hidden = true;
  stage.appendChild(cine);
  var bgs = cine.querySelectorAll(".hgc-bg");
  var cCard = cine.querySelector(".hgc-card");
  var dialog = cine.querySelector(".hgc-dialog");
  var dFace = cine.querySelector(".hgc-face");
  var dFaceImg = dFace.querySelector("img");
  var dName = cine.querySelector(".hgc-name");
  var dLine = cine.querySelector(".hgc-line");
  var cTitle = cine.querySelector(".hgc-title");
  var skipBtn = cine.querySelector(".skip");
  var cineLangBtn = cine.querySelector(".hgc-tools .lang");
  var cineScreen = null; /* redraw current title/menu when language changes */
  var cardSrc = null;
  function syncCineTools() {
    skipBtn.textContent = T(L("Skip ▸▸", "跳過 ▸▸"));
    cineLangBtn.textContent = lang === "zh" ? "EN" : "中文";
    cine.querySelector(".snd").textContent = T(audio.muted ? L("Sound off", "靜音") : L("Sound on", "聲音開"));
  }
  syncCineTools();

  var talking = null, cineGen = 0;
  /* When set, Skip jumps past the whole cutscene chain (outro → card → intro) straight to gameplay. */
  var storySkipTo = null;
  function clearStorySkip() { storySkipTo = null; }
  function goStorySkip() {
    if (!storySkipTo) {
      if (talking) talking.skip();
      return;
    }
    var fn = storySkipTo;
    storySkipTo = null;
    cineGen++;
    if (talking && talking.abort) talking.abort();
    talking = null;
    cardSrc = null;
    skipBtn.hidden = true;
    dialog.classList.remove("on");
    cCard.classList.remove("on");
    cTitle.hidden = true;
    fn();
  }
  function cineLater(ms, fn) { var g = cineGen; setTimeout(function () { if (g === cineGen) fn(); }, ms); }

  var bgIdx = 0, bgName = "";
  function setBg(name, ken) {
    if (name === bgName && !ken) return;
    bgName = name;
    var cur = bgs[bgIdx], nxt = bgs[1 - bgIdx];
    bgIdx = 1 - bgIdx;
    var url = ART + name;
    var show = function () {
      nxt.className = "hgc-bg";
      void nxt.offsetWidth;
      nxt.className = "hgc-bg on" + (ken ? " " + ken : "");
      cur.classList.remove("on");
    };
    if (nxt.getAttribute("src") === url && nxt.complete) { show(); return; }
    nxt.onload = show;
    nxt.onerror = show;
    nxt.setAttribute("src", url);
  }

  function openCine() {
    gen++;
    cineGen++;
    talking = null;
    panel.innerHTML = "";
    board.innerHTML = "";
    cine.hidden = false;
    dialog.classList.remove("on");
    cCard.classList.remove("on");
    cTitle.hidden = true;
    skipBtn.hidden = true;
  }

  function talk(beats, done) {
    if (!beats || !beats.length) { done(); return; }
    var g = cineGen, bi = -1, li = 0, typing = null, text = "", lineSrc = "", whoNow = null;
    var api = { advance: advance, skip: finish, abort: abort, relang: relang };
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
      showLine();
    }
    function showLine() {
      var b = beats[bi], who = b.who || null;
      whoNow = who;
      dialog.className = "hgc-dialog on" + (who ? " who-" + who : " narration");
      if (who) {
        dFace.hidden = false;
        dFaceImg.src = ART + who + "-" + (b.face || FACE_DEFAULT[who]) + ".png";
        dName.textContent = T(NAMES[who]);
      } else dFace.hidden = true;
      type(b.lines[li]);
    }
    function type(s) {
      lineSrc = s;
      text = T(s);
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
    function relang() {
      if (whoNow) dName.textContent = T(NAMES[whoNow]);
      text = T(lineSrc);
      if (typing) { clearInterval(typing); typing = null; }
      dLine.textContent = text;
    }
    function advance() {
      if (talking !== api) return;
      if (typing) { clearInterval(typing); typing = null; dLine.textContent = text; return; }
      if (li < beats[bi].lines.length - 1) { li++; showLine(); return; }
      nextBeat();
    }
    function abort() {
      clearInterval(typing);
      typing = null;
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

  function paintCard(c) {
    cCard.querySelector("p").textContent = T(c.kicker);
    cCard.querySelector(".hgc-card-h").textContent = T(c.name);
    cCard.querySelector("span").textContent = T(c.sub);
  }
  function showCard(i, done) {
    var c = STORY[i].card;
    cardSrc = c;
    setBg(c.img, "ken-a");
    setBed(STORY[i].music);
    cCard.className = "hgc-card" + (c.alert ? " alert" : "");
    paintCard(c);
    requestAnimationFrame(function () { cCard.classList.add("on"); });
    var ended = false, api = { advance: end, skip: end, abort: function () { ended = true; }, relang: function () { paintCard(c); } };
    talking = api;
    skipBtn.hidden = false;
    cineLater(3000, end);
    function end() {
      if (ended || talking !== api) return;
      ended = true;
      talking = null;
      cardSrc = null;
      skipBtn.hidden = true;
      cCard.classList.remove("on");
      cineLater(400, done);
    }
  }

  function showTitleScreen(o) {
    syncCineTools();
    cTitle.innerHTML =
      '<p class="hgc-kicker">' + T(o.kicker) + "</p>" +
      '<div class="hgc-h">' + T(o.h) + "</div>" +
      '<p class="hgc-sub">' + T(o.sub) + "</p>" +
      (o.extra ? (typeof o.extra === "function" ? o.extra() : T(o.extra)) : "") +
      '<div class="hgc-btns">' + o.buttons.map(function (b, i) { return '<button type="button" class="hgc-go' + (b.ghost ? " ghost" : "") + '" data-b="' + i + '">' + T(b.label) + "</button>"; }).join("") + "</div>";
    cTitle.className = "hgc-title" + (o.cls ? " " + o.cls : "");
    cTitle.hidden = false;
    Array.prototype.forEach.call(cTitle.querySelectorAll(".hgc-go"), function (btn) {
      btn.addEventListener("click", function () { ensureAudio(); SFX.click(); o.buttons[+btn.getAttribute("data-b")].on(); });
    });
    if (o.after) o.after(cTitle);
  }

  /* ================================================================
   * Story flow
   * ================================================================ */

  var TEST = /[?&]hgtest\b/.test(location.search);
  var DONE_KEY = "jm33-hg-done";
  var done = load(DONE_KEY, []);
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var tabBtns = [], cannon = 0;
  var CANNON_MAX = 3;

  function markTabs(on) {
    tabBtns.forEach(function (b, j) { b.classList.toggle("on", j === on); b.classList.toggle("done", done.indexOf(j) >= 0); });
  }

  function showTitle() {
    openCine();
    markTabs(-1);
    setBg("hg-title.png");
    setBed("grid");
    cineScreen = showTitle;
    showTitleScreen({
      kicker: L("JM33 · Coordinates of Straight Lines", "JM33 · 直線的坐標"),
      h: "Harbour<span>Grid</span>",
      sub: L("Each round: read the points on the map, calculate with one formula, type the answer. Distance · slope · parallel & perpendicular · mid-point & section · triangle centres.",
        "每關：讀地圖上的點 → 用一個公式計算 → 填答案。距離 · 斜率 · 平行與垂直 · 中點與分點 · 三角形的心。"),
      buttons: [
        { label: L("Story mode ▸", "故事模式 ▸"), on: function () {
          cineScreen = null;
          cTitle.hidden = true;
          /* Skip opening → still land on Chapter 0 briefing (not straight into a question). */
          storySkipTo = function () { clearStorySkip(); cannon = 0; playChapter(0); };
          talk(OPENING, function () { playChapter(0); });
        } },
      ],
    });
  }

  function playChapter(i) {
    openCine();
    cannon = 0;
    markTabs(i);
    storySkipTo = function () { clearStorySkip(); openStoryRound(i, 0); };
    showCard(i, function () {
      talk(STORY[i].intro, function () { clearStorySkip(); openStoryRound(i, 0); });
    });
  }

  function chapterDone(i) {
    if (done.indexOf(i) < 0) { done.push(i); save(DONE_KEY, done); }
    openCine();
    markTabs(i);
    if (i + 1 < STORY.length) {
      storySkipTo = function () { clearStorySkip(); cannon = 0; markTabs(i + 1); openStoryRound(i + 1, 0); };
      talk(STORY[i].outro, function () { playChapter(i + 1); });
    } else {
      storySkipTo = function () { clearStorySkip(); showEnd(); };
    talk(STORY[i].outro, function () {
        talk(ENDING, function () { clearStorySkip(); showEnd(); });
    });
    }
  }

  function showEnd() {
    markTabs(-1);
    cineScreen = showEnd;
    showTitleScreen({
      cls: "bottom",
      kicker: L("06:04 a.m. · Harbour safe", "清晨 06:04 · 海港安全"),
      h: L("Bo is<span>Home</span>", "Bo<span>到家了</span>"),
      sub: L("Distance, slope, intercepts, parallel and perpendicular lines, mid-points, sections and the centres of a triangle: every number counted.",
        "距離、斜率、截距、平行與垂直、中點、分點、三角形的中心——每一個數字都算過了。"),
      buttons: [
        { label: L("Replay story ▸", "重玩故事 ▸"), on: function () { cineScreen = null; playChapter(0); } },
      ],
    });
  }

  function openStoryRound(i, r) {
    var ch = CHAPTERS[i], item = ch.rounds[r], spec = R[item[0]], last = r + 1 === ch.rounds.length;
    markTabs(i);
    var P = spec.gen(item[1] || {});
    runRound(spec, P, {
      kicker: L("Chapter " + i + " · Round " + (r + 1) + "/" + ch.rounds.length, "第 " + i + " 章 · 第 " + (r + 1) + "/" + ch.rounds.length + " 關"),
      nextLabel: last ? (i + 1 < CHAPTERS.length ? L("Finish chapter ▸", "完成本章 ▸") : L("Sunrise ▸", "日出 ▸")) : L("Next round ▸", "下一關 ▸"),
      meter: ch.tutorial ? null : function () { return [cannon, CANNON_MAX, L("Sonic cannon", "聲波炮")]; },
      onWrong: function (api) {
        if (ch.tutorial) return false;
        cannon++;
        if (cannon < CANNON_MAX) return false;
        api.meter(cannon, CANNON_MAX, L("Sonic cannon", "聲波炮"));
        wait(700, function () {
          flashRed();
          stage.classList.add("hg-shake");
          setTimeout(function () { stage.classList.remove("hg-shake"); }, 700);
          openCine();
          markTabs(i);
          setBg("op-03-cannon.png", "ken-c");
          setBed("alert");
          storySkipTo = function () { clearStorySkip(); cannon = 0; openStoryRound(i, r); };
          talk(FAIL_BLAST, function () { clearStorySkip(); cannon = 0; openStoryRound(i, r); });
        });
        return true;
      },
      onDone: function () {
        if (last) { chapterDone(i); return; }
        var beats = (STORY[i].between || [])[r];
        if (!beats || !beats.length) { openStoryRound(i, r + 1); return; }
        openCine();
        markTabs(i);
        storySkipTo = function () { clearStorySkip(); openStoryRound(i, r + 1); };
        talk(beats, function () { clearStorySkip(); openStoryRound(i, r + 1); });
      },
    });
  }

  /* ================================================================
   * Wiring
   * ================================================================ */

  function paintTabs() {
    tabBtns.forEach(function (b, i) {
      var ch = CHAPTERS[i];
      b.innerHTML = T(ch.tab) + "<small>" + T(ch.sub) + "</small>";
    });
  }
  function onLangChange() {
    syncCineTools();
    paintTabs();
    if (talking && talking.relang) talking.relang();
    if (cardSrc && cCard.classList.contains("on")) paintCard(cardSrc);
    if (cineScreen && !cTitle.hidden) cineScreen();
  }

  if (tabsEl) {
    CHAPTERS.forEach(function (ch, i) {
      var b = el("button", "hg-tab", "");
      b.type = "button";
      b.addEventListener("click", function () { ensureAudio(); playChapter(i); });
      tabsEl.appendChild(b);
      tabBtns.push(b);
    });
    paintTabs();
  }

  skipBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    ensureAudio();
    SFX.click();
    goStorySkip();
  });
  cineLangBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    ensureAudio();
    SFX.click();
    setLang(lang === "zh" ? "en" : "zh");
  });
  cine.querySelector(".hgc-tools .snd").addEventListener("click", function (e) { e.stopPropagation(); ensureAudio(); setMuted(!audio.muted); });
  stage.addEventListener("pointerdown", ensureAudio);
  cine.addEventListener("click", function (e) {
    if (!talking || (e.target.closest && e.target.closest(".hgc-tools, .hgc-title"))) return;
    talking.advance();
  });
  doc.addEventListener("keydown", function (e) {
    if (!talking || !stageVisible()) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
    if (e.code === "Space" || e.key === " " || e.key === "Enter") { e.preventDefault(); talking.advance(); }
  });

  [
    "hg-title.png", "op-01-sonar.png", "op-02-bo-surface.png", "op-03-cannon.png", "op-04-gridroom.png",
    "hg-lau-evac-command.jpg", "hg-lau-sonar-trace.jpg", "hg-lau-channel-engineers.jpg",
    "hg-lau-lights-boat.jpg", "hg-lau-mother-signal.jpg", "lau-smile.png", "kwok-stern.png",
  ].forEach(function (n) { new Image().src = ART + n; });
  markTabs(-1);
  showTitle();
  if (TEST) window.__hgApi = {
    R: R, playChapter: playChapter, openStoryRound: openStoryRound, showEnd: function () { openCine(); setBg("end-03-badge.png"); showEnd(); },
    rec: function (r) { REC = r; },
    play: function (id, o) { runRound(R[id], R[id].gen(o || {}), { kicker: "Test", meter: function () { return [1, CANNON_MAX, "Strikes"]; }, onDone: function () {} }); },
  };
})();
