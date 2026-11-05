/* JM33 Harbour Grid — a lost baby sea creature in Victoria Harbour.
 * Story: a warm-up and five chapters (distance, slope, parallel and perpendicular lines,
 * mid-point and section formula, centres of a triangle).
 * Challenge: Night Shift (endless, three cannon charges) and Sonar Sprint (two minutes).
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
  var FR = { x: 20, y: 24, w: 980, h: 672 };
  var MINUS = "\u2212";

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
  function ms(s) { return "m<sub>" + s + "</sub>"; }
  function lin(e, c, v) {
    var s = (e === 1 ? "" : e === -1 ? "−" : fs(e)) + v;
    if (c > 0) s += " + " + fs(c);
    if (c < 0) s += " − " + fs(-c);
    return s;
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
    if (ans === Infinity) return v === Infinity ? OK : bad(o.undefMsg || "This line is vertical: Δx = 0, and you cannot divide by 0. Its slope is undefined.");
    if (v === Infinity) return bad(o.notUndef || "This value does exist. Only a vertical line has an undefined slope.");
    if (eq(v, ans)) return OK;
    if (o.approx && Math.abs(v - ans) <= o.approx) return OK;
    for (var i = 0; i < (wrongs || []).length; i++) {
      var w = wrongs[i];
      if (isFinite(w.v) && !eq(w.v, ans) && eq(v, w.v)) return bad(w.m);
    }
    if (Math.abs(v - ans) < 0.02) return bad("Very close, but give the exact value (a fraction such as 13/8), not a rounded decimal.", true);
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
    if (eq(x, ans.y) && eq(y, ans.x) && !eq(ans.x, ans.y)) return bad("x and y are swapped. A coordinate pair is (x, y): across first, then up.");
    if (Math.abs(x - ans.x) < 0.02 && Math.abs(y - ans.y) < 0.02) return bad("Very close, but give exact values (fractions such as 7/2 are fine), not rounded decimals.", true);
    return bad(o.generic ? o.generic(pt(x, y)) : "");
  }

  function ratioJudge(f, r, s, o) {
    o = o || {};
    if (REC) REC.push({ f: f, k: "ratio", a: [r, s] });
    var a = f.r.v, b = f.s.v;
    if (!(a > 0 && b > 0)) return bad("Both parts of a ratio must be positive numbers.", true);
    if (eq(a * s, b * r)) return OK;
    if (eq(a * r, b * s)) return bad(o.flip || "Upside down. The first number is the part next to the first letter.");
    return bad(o.generic ? o.generic(a, b) : "");
  }

  function distWrongs(A, B) {
    var dx = B.x - A.x, dy = B.y - A.y;
    return [
      { v: dx * dx + dy * dy, m: "You forgot the square root at the end." },
      { v: Math.abs(dx) + Math.abs(dy), m: "That's the route along the grid lines (Δx + Δy). Bo swims straight across, so use Pythagoras: √(Δx² + Δy²)." },
      { v: Math.sqrt(Math.pow(A.x + B.x, 2) + Math.pow(A.y + B.y, 2)), m: "You added the coordinates. Subtract them: (x₂ − x₁) and (y₂ − y₁)." },
      { v: Math.sqrt(Math.pow(Math.abs(B.x) - Math.abs(A.x), 2) + Math.pow(Math.abs(B.y) - Math.abs(A.y), 2)), m: "Careful with negative coordinates: subtracting a negative means adding, e.g. 3 − (−2) = 5." },
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
      { v: dy === 0 ? NaN : dx / dy, m: "Upside down: slope = Δy ÷ Δx (rise over run), not Δx ÷ Δy." },
      { v: dx === 0 ? NaN : -dy / dx, m: "Sign slip. Keep the same order on top and bottom: (y₂ − y₁) ÷ (x₂ − x₁)." },
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

  function slopeField(id, label) { return { id: id, type: "num", label: label, undef: true, ph: "e.g. −3/4" }; }

  /* ================================================================
   * Rounds
   * Each round: gen(o) → P · pts(P) for the map · draw(S, P) · steps(P) → [{ task, fields, judge, show, work }]
   * ================================================================ */

  var R = {};

  /* ---------- Warm-up ---------- */

  R.read = {
    topic: "intro", quick: true, title: "Where is Bo?",
    gen: function () {
      return loop(function () {
        var x = nz(-7, 7), y = nz(-6, 6);
        return Math.abs(x) !== Math.abs(y) ? { bo: pt(x, y) } : null;
      });
    },
    pts: function (P) { return [P.bo, pt(-8, -6), pt(8, 6)]; },
    draw: function (S, P) { S.boG = wIcon(S, S.base, P.bo, "bo"); wTag(S, S.base, P.bo, "Bo", { up: 1 }); },
    steps: function (P) {
      var b = P.bo;
      return [{
        kicker: "Reading the grid",
        task: "Read Bo's position as <b>(x, y)</b>.",
        info: ["1 square = 1 unit", "Right +, left − · up +, down −"],
        fields: [{ id: "b", type: "pt", label: "Bo is at" }],
        action: "Ping sonar",
        hints: ["Start at O, the origin. Count the squares across to Bo first: that is x.", "Then count up or down: that is y.", "Left of the y-axis, x is negative. Below the x-axis, y is negative."],
        judge: function (v) {
          var x = v.b.x.v, y = v.b.y.v;
          if (!(eq(x, b.x) && eq(y, b.y)) && eq(Math.abs(x), Math.abs(b.x)) && eq(Math.abs(y), Math.abs(b.y)))
            return bad("Right distances, wrong signs. Left of the y-axis, x is negative; below the x-axis, y is negative.");
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
        work: ["Across from O: x = " + fs(b.x), "Up from O: y = " + fs(b.y), "Bo is at " + fp(b) + "."],
      }];
    },
  };

  R.count = {
    topic: "intro", quick: true, title: "Count the squares",
    gen: function () {
      return loop(function () {
        var a = ri(-8, -1), b = ri(2, 8), k = nz(-5, 5);
        if (b - a < 4) return null;
        var vert = Math.random() < 0.5, swap = Math.random() < 0.5;
        var A = vert ? pt(k, a) : pt(a, k), B = vert ? pt(k, b) : pt(b, k);
        return swap ? { A: B, B: A, vert: vert } : { A: A, B: B, vert: vert };
      });
    },
    pts: function (P) { return [P.A, P.B, pt(-6, -5), pt(6, 5)]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.A, "bo");
      wIcon(S, S.base, P.B, "ferry");
      wTag(S, S.base, P.A, "Bo " + fp(P.A), { up: 1 });
      wTag(S, S.base, P.B, "Ferry " + fp(P.B), { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, d = dist(A, B), axis = P.vert ? "y" : "x";
      var a = P.vert ? A.y : A.x, b = P.vert ? B.y : B.x;
      return [{
        kicker: "Distance on one line",
        task: "Bo and the ferry share a " + (P.vert ? "vertical" : "horizontal") + " line. How far apart?",
        info: null,
        fields: [{ id: "d", type: "num", label: "Distance", unit: "units" }],
        action: "Measure",
        hints: ["Same " + (P.vert ? "x" : "y") + "-coordinate, so only the " + axis + "-coordinates change.", "Distance = |" + axis + "₂ − " + axis + "₁|. One point is on each side of the axis, so subtracting a negative means adding."],
        judge: function (v) {
          if (v.d.v < 0) return bad("A distance is never negative.");
          return numJudge(v.d, d, [{ v: Math.abs(Math.abs(b) - Math.abs(a)), m: "Bo and the ferry are on opposite sides of the axis. Count both parts and add them, or use |" + axis + "₂ − " + axis + "₁|." }]);
        },
        show: function (S, v, res, done) {
          var L = v.d.v, dir = mul(sub(B, A), 1 / d), end = add(A, mul(dir, L));
          wGrow(S, S.fx, A, end, { c: res.ok ? C.ok : C.rd, w: 4 }, 600, function () {
            for (var k = 1; k < L; k++) wDot(S, S.fx, add(A, mul(dir, k)), C.gd, 3);
            wait(400, done);
          });
        },
        work: ["Same " + (P.vert ? "x" : "y") + "-coordinate, so count along the " + axis + "-direction.",
          "Distance = |" + fs(b) + " − " + par(a) + "| = " + fs(d)],
      }];
    },
  };

  var TRIPLES = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]];

  R.pyth = {
    topic: "dist", quick: true, title: "Pythagoras on the grid",
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
      wTag(S, S.base, P.A, "Bo " + fp(P.A), { up: 1 });
      wTag(S, S.base, P.B, "Pier " + fp(P.B), { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, d = dist(A, B), K = pt(B.x, A.y);
      return [{
        kicker: "Distance formula",
        task: "How far must Bo swim in a <b>straight line</b> to the pier?",
        info: null,
        fields: [{ id: "d", type: "num", label: "Straight-line distance", unit: "units" }],
        action: "Measure",
        hints: ["Draw a right-angled triangle: across Δx, then up Δy. The straight line from Bo to the pier is the hypotenuse.",
          "Δx = |x₂ − x₁|, Δy = |y₂ − y₁|.", "d = √(Δx² + Δy²). That is the distance formula."],
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
        work: distLines(A, B, "Bo", "P").map(function (s, i) { return i ? s : s.replace("BoP", "d"); }),
      }];
    },
  };

  /* ---------- Chapter 1 · distance ---------- */

  function placeAt(C0, want, R0, used) {
    return loop(function () {
      var dx = ri(-9, 9), dy = ri(-9, 9), N = dx * dx + dy * dy, d = Math.sqrt(N);
      if (N < 4 || Math.abs(d - R0) < 0.35) return null;
      if ((d < R0) !== want) return null;
      var p = add(C0, pt(dx, dy));
      if (!within(p, 11)) return null;
      for (var i = 0; i < used.length; i++) if (d2(p, used[i]) < 9) return null;
      return p;
    });
  }

  function ringRound(kind) {
    return {
      topic: "dist", quick: true, title: kind === "hospital" ? "The hospital" : "The school",
      gen: function () {
        return loop(function () {
          var Cb = pt(ri(-4, 4), ri(-3, 3)), dx, dy, N;
          if (kind === "hospital") { var t = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]); dx = t[0]; dy = t[1]; }
          else { dx = ri(1, 7); dy = ri(1, 7); }
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
      pts: function (P) { return [P.C, P.H, add(P.C, pt(P.R, P.R)), sub(P.C, pt(P.R, P.R))]; },
      draw: function (S, P) {
        S.boG = wIcon(S, S.base, P.C, "bo");
        S.hG = wIcon(S, S.base, P.H, "bld");
        wTag(S, S.base, P.C, "Bo C" + fp(P.C), { up: 1 });
        wTag(S, S.base, P.H, P.name + " H" + fp(P.H), { up: 1 });
      },
      steps: function (P) {
        var d = dist(P.C, P.H), inside = d < P.R;
        return [{
          kicker: "Distance formula",
          task: "Danger ring radius <b>" + P.R + "</b>. Is the " + P.name.toLowerCase() + " inside? Find the distance first.",
          info: null,
          fields: [
            { id: "d", type: "num", label: "Distance CH", unit: "units", ph: kind === "hospital" ? "" : "e.g. √41" },
            { id: "act", type: "choice", label: P.name, opts: ["Evacuate", "Safe"] },
          ],
          action: "Send orders",
          hints: ["d = √((x₂ − x₁)² + (y₂ − y₁)²). Watch the negative signs.",
            kind === "hospital" ? "The distance comes out as a whole number this time." : "The distance is a surd this time. Leave it as √n, or give it to 2 decimal places.",
            "Inside the ring means the distance is less than " + P.R + "."],
          judge: function (v) {
            var r = numJudge(v.d, d, distWrongs(P.C, P.H), { approx: 0.01 });
            if (!r.ok) return r;
            if (v.act !== (inside ? 0 : 1)) return bad("CH ≈ " + d.toFixed(2) + " and the waves reach " + P.R + ". " + (inside ? "That is less than " + P.R + ", so the " + P.name.toLowerCase() + " is inside the ring." : "That is more than " + P.R + ", so the " + P.name.toLowerCase() + " is outside the ring."));
            return { ok: true, exact: v.d.exact && !isInt(d) };
          },
          show: function (S, v, res, done) {
            wRing(S, S.fx, P.C, P.R, { c: C.cy, fill: "rgba(34,227,255,.08)", grow: 700 });
            if (!res.ok && v.d.v > 0 && v.d.v < 40 && !eq(v.d.v, d)) wRing(S, S.fx, P.C, v.d.v, { c: C.rd, dash: "6 6", grow: 700 });
            wGrow(S, S.fx, P.C, P.H, { c: C.gd, w: 2.5, dash: "4 6" }, 700, function () {
              if (res.ok) wBadge(S, S.fx, P.H, inside ? "EVACUATE" : "SAFE", inside ? C.rd : C.ok);
              SFX.ping();
              wait(400, done);
            });
          },
          work: distLines(P.C, P.H, "C", "H").concat([(inside ? fs(d) === "?" ? "" : "" : "") + "CH ≈ " + d.toFixed(2) + (inside ? " < " : " > ") + P.R + ", so the " + P.name.toLowerCase() + " is " + (inside ? "inside the ring: evacuate." : "outside the ring: safe.")]),
        }];
      },
    };
  }
  R.hospital = ringRound("hospital");
  R.school = ringRound("school");

  var PLACES = ["Ferry pier", "Night market", "Clock tower", "Museum", "Harbour hotel"];

  R.three = {
    topic: "dist", quick: false, title: "Three buildings",
    gen: function () {
      var Cb = pt(ri(-3, 3), ri(-2, 2)), R0 = ri(5, 7);
      var wants = shuffle([true, false, Math.random() < 0.5]);
      var used = [Cb], list = [];
      var names = shuffle(PLACES.slice()).slice(0, 3);
      wants.forEach(function (w, i) { var p = placeAt(Cb, w, R0, used); used.push(p); list.push({ p: p, name: names[i], label: "ABC".charAt(i) }); });
      return { C: Cb, R: R0, list: list };
    },
    pts: function (P) { return [P.C, add(P.C, pt(P.R, P.R)), sub(P.C, pt(P.R, P.R))].concat(P.list.map(function (o) { return o.p; })); },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.C, "bo");
      wTag(S, S.base, P.C, "Bo C" + fp(P.C), { up: 1 });
      P.list.forEach(function (o) { wIcon(S, S.base, o.p, "bld"); wTag(S, S.base, o.p, o.label + fp(o.p), { up: 1 }); });
    },
    steps: function (P) {
      var truth = P.list.map(function (o) { return dist(P.C, o.p) < P.R ? 0 : 1; });
      return [{
        kicker: "Distance formula",
        task: "Waves reach <b>" + P.R + "</b> units. For each building: evacuate or safe?",
        info: null,
        fields: P.list.map(function (o, i) { return { id: "b" + i, type: "choice", label: o.label + " · " + o.name, opts: ["Evacuate", "Safe"] }; }),
        action: "Send orders",
        hints: ["Work out CA, CB and CC with the distance formula.", "You only need to compare with " + P.R + ": compare the squares, e.g. is CA² less than " + P.R * P.R + "?"],
        judge: function (v) {
          var wrong = [];
          P.list.forEach(function (o, i) { if (v["b" + i] !== truth[i]) wrong.push(o.label); });
          if (!wrong.length) return OK;
          return bad("Recheck " + wrong.join(" and ") + ". Work out the distance from C and compare it with " + P.R + ".");
        },
        show: function (S, v, res, done) {
          wRing(S, S.fx, P.C, P.R, { c: C.cy, fill: "rgba(34,227,255,.08)", grow: 700 });
          wait(750, function () {
            P.list.forEach(function (o, i) {
              var ok = v["b" + i] === truth[i];
              wLine(S, S.fx, P.C, o.p, { c: ok ? C.gd : C.rd, dash: "4 6", w: 2 });
              if (res.ok) wBadge(S, S.fx, o.p, truth[i] ? "SAFE" : "EVACUATE", truth[i] ? C.ok : C.rd);
              else if (!ok) wBadge(S, S.fx, o.p, "CHECK", C.rd);
            });
            SFX.ping();
            wait(400, done);
          });
        },
        work: P.list.map(function (o, i) {
          var N = d2(P.C, o.p), d = Math.sqrt(N);
          return "C" + o.label + " = √" + N + (isInt(d) ? " = " + d : " ≈ " + d.toFixed(2)) + (truth[i] ? " > " : " < ") + P.R + " → " + (truth[i] ? "safe" : "evacuate");
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
    topic: "dist", quick: true, title: "The lifeboat station",
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
      wTag(S, S.base, P.P, "Pier P" + fp(P.P), { up: 1 });
      wTag(S, S.base, P.Q, "Pier Q" + fp(P.Q), { up: 1 });
    },
    steps: function (P) {
      var A = P.P, B = P.Q, t = P.t;
      var lhs = B.x * B.x + B.y * B.y - A.x * A.x - A.y * A.y, k = 2 * (B.x - A.x);
      return [{
        kicker: "Equal distances",
        task: "Put station <b>S(t, 0)</b> on the seafront, <b>equidistant</b> from both piers. Find t.",
        info: null,
        fields: [{ id: "t", type: "num", label: "t", sub: "S(t, 0)" }],
        action: "Build station",
        hints: ["Equal distance: PS = QS, so PS² = QS² (no square roots needed).",
          "PS² = (t − " + par(A.x) + ")² + (0 − " + par(A.y) + ")². Do the same for QS².",
          "Expand both sides. The t² terms cancel, leaving a simple linear equation."],
        judge: function (v) {
          var x = v.t.v;
          var mx = (A.x + B.x) / 2;
          var r = numJudge(v.t, t, [{ v: mx, m: "That is halfway between the piers' x-coordinates. It only works when both piers are at the same height. Set PS² = QS² instead." }],
            { generic: function (x) { return "With t = " + fs(x) + ": PS = √" + fs(d2(pt(x, 0), A)) + " but QS = √" + fs(d2(pt(x, 0), B)) + ". They must be equal."; } });
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
        work: ["PS² = QS²", "(t − " + par(A.x) + ")² + " + par(A.y) + "² = (t − " + par(B.x) + ")² + " + par(B.y) + "²",
          "t² " + (A.x ? (-2 * A.x > 0 ? "+ " : "− ") + Math.abs(2 * A.x) + "t " : "") + "+ " + (A.x * A.x + A.y * A.y) + " = t² " + (B.x ? (-2 * B.x > 0 ? "+ " : "− ") + Math.abs(2 * B.x) + "t " : "") + "+ " + (B.x * B.x + B.y * B.y),
          fs(k) + "t = " + fs(lhs) + "  →  t = " + fs(t)],
      }];
    },
  };

  /* ---------- Chapter 2 · slope ---------- */

  R.heading = {
    topic: "slope", quick: true, title: "Which way is Bo heading?",
    gen: function () {
      return loop(function () {
        var A = pt(ri(-7, 4), ri(-5, 5)), B = add(A, pt(nz(-6, 6), nz(-6, 6)));
        return within(B, 10) && Math.abs(B.x - A.x) !== Math.abs(B.y - A.y) ? { A: A, B: B } : null;
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.B, "bo");
      wPin(S, S.base, P.A, C.mut, "A" + fp(P.A) + " · 2:20");
      wTag(S, S.base, P.B, "B" + fp(P.B) + " · 2:25", { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, m = slope(A, B);
      return [{
        kicker: "Slope",
        task: "Bo swam from A to B in a straight line. What is the <b>slope</b>?",
        info: null,
        fields: [slopeField("m", "Slope of AB")],
        action: "Plot the path",
        hints: ["Slope = rise ÷ run = Δy ÷ Δx.", "Δy = y_B − y_A and Δx = x_B − x_A, in the same order.", "Going down from left to right gives a negative slope."],
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
        work: slopeLines(A, B, "A", "B"),
      }];
    },
  };

  function sgnOf(v) { return v < 0 ? -1 : 1; }

  var TRACK_TYPES = ["Positive", "Negative", "Zero", "Undefined"];

  R.tracks = {
    topic: "slope", quick: true, title: "Patrol boat tracks",
    gen: function () {
      var types = shuffle([0, 1, 2, 3]);
      var centres = [pt(-5, 3.5), pt(5, 3.5), pt(-5, -3.5), pt(5, -3.5)];
      return {
        list: types.map(function (t, i) {
          var c = centres[i], d;
          if (t === 0) d = pick([pt(3, 2), pt(2, 3), pt(3, 1)]);
          else if (t === 1) d = pick([pt(3, -2), pt(2, -3), pt(3, -1)]);
          else if (t === 2) d = pt(4, 0);
          else d = pt(0, 4);
          return { t: t, a: sub(c, mul(d, 0.5)), b: add(c, mul(d, 0.5)) };
        }),
      };
    },
    pts: function () { return [pt(-8, -6), pt(8, 6)]; },
    draw: function (S, P) {
      S.trackG = [];
      P.list.forEach(function (o, i) {
        S.trackG.push(wLine(S, S.base, o.a, o.b, { c: C.cy, w: 4 }));
        wIcon(S, S.base, o.b, "boat");
        wTag(S, S.base, mid(o.a, o.b), "Track " + (i + 1), { c: C.ink, side: 1 });
      });
    },
    steps: function (P) {
      return [{
        kicker: "Sign of a slope",
        task: "Classify each track's slope (no numbers).",
        info: ["Left → right · uphill + · downhill − · flat 0 · vertical: undefined"],
        fields: P.list.map(function (o, i) { return { id: "t" + i, type: "choice", label: "Track " + (i + 1), opts: TRACK_TYPES }; }),
        action: "Log tracks",
        hints: ["Imagine walking along the track from left to right. Uphill means the slope is positive.", "A horizontal line has Δy = 0, so slope = 0.", "A vertical line has Δx = 0. You can't divide by 0, so the slope is undefined."],
        judge: function (v) {
          var wrong = [], msg = "";
          P.list.forEach(function (o, i) {
            if (v["t" + i] !== o.t) {
              wrong.push(i + 1);
              if (o.t === 2) msg = " Track " + (i + 1) + " is horizontal: Δy = 0, so the slope is 0.";
              if (o.t === 3) msg = " Track " + (i + 1) + " is vertical: Δx = 0, so the slope is undefined.";
            }
          });
          return wrong.length ? bad("Recheck track " + wrong.join(" and ") + "." + msg) : OK;
        },
        show: function (S, v, res, done) {
          P.list.forEach(function (o, i) {
            var ok = v["t" + i] === o.t;
            wLine(S, S.fx, o.a, o.b, { c: ok ? C.ok : C.rd, w: 5 });
            if (res.ok) wBadge(S, S.fx, o.a, TRACK_TYPES[o.t], C.ok);
          });
          wait(500, done);
        },
        work: ["Uphill (left to right): positive slope", "Downhill: negative slope", "Horizontal: slope 0", "Vertical: slope undefined"],
      }];
    },
  };

  R.landfall = {
    topic: "slope", quick: true, title: "Where will Bo reach the shore?",
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
      wTag(S, S.base, P.A, "Bo A" + fp(P.A), { up: 1 });
      var end = P.axis === "x" ? pt(P.X, 0) : pt(0, P.X);
      var dir = mul(sub(end, P.A), 0.18);
      wArrow(S, S.base, P.A, add(P.A, dir), C.gd);
    },
    steps: function (P) {
      var A = P.A, m = P.m, X = P.X, isX = P.axis === "x";
      var yInt = A.y - m * A.x, xInt = A.x - A.y / m;
      var wrongs = isX
        ? [{ v: A.x + A.y / m, m: "Sign slip. From A down to the x-axis, y changes by −y₀, so x changes by −y₀ ÷ m." },
          { v: A.x - A.y * m, m: "Divide by the slope, don't multiply: Δx = Δy ÷ m." },
          { v: yInt, m: "That is where the path crosses the y-axis. The seafront is the x-axis, where y = 0." }]
        : [{ v: A.y + m * A.x, m: "Sign slip. From A to the y-axis, x changes by −x₀, so y changes by m × (−x₀)." },
          { v: A.y - A.x / m, m: "Multiply by the slope, don't divide: Δy = m × Δx." },
          { v: xInt, m: "That is where the path crosses the x-axis. The breakwater is the y-axis, where x = 0." }];
      var work = isX
        ? ["Let Bo reach the x-axis at (X, 0).", "m = (0 − " + par(A.y) + ") ÷ (X − " + par(A.x) + ") = " + fs(m),
          "X − " + par(A.x) + " = " + fs(-A.y) + " ÷ " + pf(m) + " = " + fs(-A.y / m), "X = " + fs(X) + ", so the x-intercept is " + fs(X) + "."]
        : ["Let Bo reach the y-axis at (0, Y).", "m = (Y − " + par(A.y) + ") ÷ (0 − " + par(A.x) + ") = " + fs(m),
          "Y − " + par(A.y) + " = " + fs(m) + " × " + par(-A.x) + " = " + fs(-m * A.x), "Y = " + fs(X) + ", so the y-intercept is " + fs(X) + "."];
      return [{
        kicker: isX ? "x-intercept" : "y-intercept",
        task: isX ? "Bo keeps this heading. Find where it hits the seafront (<b>x-intercept</b>)."
          : "Bo keeps this heading. Find where it hits the breakwater (<b>y-intercept</b>).",
        info: ["Slope m = " + fs(m)],
        fields: [{ id: "x", type: "num", label: isX ? "x-intercept" : "y-intercept" }],
        action: "Send boats",
        hints: isX ? ["On the x-axis, y = 0. Call the landing point (X, 0).", "Slope from A to (X, 0) must equal " + fs(m) + ".", "(0 − y₀) ÷ (X − x₀) = m. Solve for X."]
          : ["On the y-axis, x = 0. Call the landing point (0, Y).", "Slope from A to (0, Y) must equal " + fs(m) + ".", "(Y − y₀) ÷ (0 − x₀) = m. Solve for Y."],
        judge: function (v) { return numJudge(v.x, X, wrongs); },
        show: function (S, v, res, done) {
          var T = isX ? pt(X, 0) : pt(0, X), U = isX ? pt(v.x.v, 0) : pt(0, v.x.v);
          if (S.inView(U)) { wIcon(S, S.fx, U, "boat"); wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fs(v.x.v)); }
          wLine(S, S.fx, A, T, { c: C.cy, w: 2, dash: "4 7" });
          wMove(S, S.boG, A, T, 1100, function () {
            if (!res.ok) wRing(S, S.fx, T, 0.7, { c: C.rd, w: 3 });
            SFX.splash();
            wait(350, done);
          });
        },
        work: work,
      }];
    },
  };

  R.lineup = {
    topic: "slope", quick: false, title: "Three in a line?",
    gen: function (o) {
      o = o || {};
      return loop(function () {
        var v = dirv(3, 3), A = pt(ri(-8, 0), ri(-6, 4)), k1 = ri(1, 2), k2 = k1 + ri(1, 2);
        var B = add(A, mul(v, k1)), L = add(A, mul(v, k2)), col = o.collinear || Math.random() < 0.5;
        if (!col) L = add(L, pt(0, sgn()));
        if (!allWithin([B, L], 10)) return null;
        if (!col && Math.abs(cross(A, B, L)) < 1e-9) return null;
        return { A: A, B: B, L: L, col: col, story: !!o.collinear };
      });
    },
    pts: function (P) { return [P.A, P.B, P.L]; },
    draw: function (S, P) {
      wPin(S, S.base, P.A, C.mut, "A" + fp(P.A));
      S.boG = wIcon(S, S.base, P.B, "bo");
      wTag(S, S.base, P.B, "Bo B" + fp(P.B), { up: 1 });
      wIcon(S, S.base, P.L, "light");
      wTag(S, S.base, P.L, (P.story ? "Lightship L" : "Power station L") + fp(P.L), { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, L = P.L, m1 = slope(A, B), m2 = slope(B, L), col = eq(m1, m2);
      var name = P.story ? "the lightship" : "the power station";
      return [{
        kicker: "Collinear points",
        task: "Is Bo's path A→B aimed straight at " + name + " L? Compare slopes.",
        info: null,
        fields: [slopeField("m1", "Slope of AB"), slopeField("m2", "Slope of BL"), { id: "c", type: "choice", label: "A, B, L collinear?", opts: ["Yes", "No"] }],
        action: "Check heading",
        hints: ["Work out m_AB and m_BL with Δy ÷ Δx.", "Equal slopes and a shared point B mean A, B and L lie on one straight line."],
        judge: function (v) {
          var r = numJudge(v.m1, m1, slopeWrongs(A, B));
          if (!r.ok) return bad("Slope of AB: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          r = numJudge(v.m2, m2, slopeWrongs(B, L));
          if (!r.ok) return bad("Slope of BL: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          if (v.c !== (col ? 0 : 1)) return bad(col ? "The slopes are equal and B is on both lines, so A, B and L are collinear." : "The slopes are different, so A, B and L are not on one straight line.");
          return OK;
        },
        show: function (S, v, res, done) {
          var end = S.ray(A, sub(B, A));
          wGrow(S, S.fx, A, end, { c: res.ok ? C.ok : C.cy, w: 2.5, dash: "6 6" }, 900, function () {
            wRing(S, S.fx, L, 0.7, { c: col ? C.ok : C.rd, w: 3 });
            wait(350, done);
          });
        },
        work: [slopeShort(A, B, "A", "B")].concat([slopeShort(B, L, "B", "L")])
          .concat([col ? ms("AB") + " = " + ms("BL") + " and B is common, so A, B and L are collinear." : ms("AB") + " ≠ " + ms("BL") + ", so A, B and L are not collinear."]),
      }];
    },
  };

  R.boatR = {
    topic: "slope", quick: true, title: "A boat on the path",
    gen: function () {
      return loop(function () {
        var v = dirv(3, 3), A = pt(ri(-8, -2), ri(-6, 4)), k1 = ri(1, 2), k2 = k1 + ri(1, 2);
        var Q = add(A, mul(v, k1)), Rr = add(A, mul(v, k2));
        return allWithin([Q, Rr], 10) ? { P: A, Q: Q, R: Rr } : null;
      });
    },
    pts: function (P) { return [P.P, P.Q, P.R, pt(P.R.x + 2, P.R.y)]; },
    draw: function (S, P) {
      wPin(S, S.base, P.P, C.mut, "P" + fp(P.P));
      S.boG = wIcon(S, S.base, P.Q, "bo");
      wTag(S, S.base, P.Q, "Bo Q" + fp(P.Q), { up: 1 });
      wLine(S, S.base, S.ray(pt(0, P.R.y), pt(-1, 0)), S.ray(pt(0, P.R.y), pt(1, 0)), { c: "rgba(255,198,90,.35)", dash: "3 8", w: 2 });
      wTag(S, S.base, pt(S.x0 + 0.6, P.R.y), "y = " + fs(P.R.y), { c: C.gd, anchor: "start", up: 1 });
    },
    steps: function (P) {
      var A = P.P, Q = P.Q, Rr = P.R, m = slope(A, Q);
      return [{
        kicker: "Collinear points",
        task: "Rescue waits on Bo's path at R(r, " + fs(Rr.y) + "). Find r.",
        info: null,
        fields: [{ id: "r", type: "num", label: "r" }],
        action: "Place boat",
        hints: ["P, Q and R are collinear, so the slope of QR must equal the slope of PQ.", "(" + fs(Rr.y) + " − " + par(Q.y) + ") ÷ (r − " + par(Q.x) + ") = " + ms("PQ") + ". Solve for r."],
        judge: function (v) {
          return numJudge(v.r, Rr.x, [{ v: Q.x + (Rr.y - Q.y) * m, m: "Divide by the slope, don't multiply: Δx = Δy ÷ m." }],
            { generic: function (x) { var s = slope(Q, pt(x, Rr.y)); return "With r = " + fs(x) + ", " + ms("QR") + " = " + fs(s) + " but " + ms("PQ") + " = " + fs(m) + ". They must be equal."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.r.v, Rr.y);
          if (S.inView(U)) { wIcon(S, S.fx, U, "boat"); wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "R" + fp(U)); }
          wLine(S, S.fx, A, S.ray(A, sub(Q, A)), { c: C.cy, w: 2, dash: "4 7" });
          wMove(S, S.boG, Q, Rr, 1000, function () { if (!res.ok) wRing(S, S.fx, Rr, 0.6, { c: C.rd, w: 3 }); wait(300, done); });
        },
        work: [slopeShort(A, Q, "P", "Q")].concat(["(" + fs(Rr.y) + " − " + par(Q.y) + ") ÷ (r − " + par(Q.x) + ") = " + fs(m),
          "r − " + par(Q.x) + " = " + fs(Rr.y - Q.y) + " ÷ " + pf(m) + " = " + fs((Rr.y - Q.y) / m), "r = " + fs(Rr.x)]),
      }];
    },
  };

  /* ---------- Chapter 3 · parallel and perpendicular ---------- */

  R.fence = {
    topic: "para", quick: true, title: "The second fence",
    gen: function () {
      return loop(function () {
        var v = dirv(3, 3), A = pt(ri(-8, 2), ri(-6, 4)), B = add(A, mul(v, ri(1, 2)));
        var d = ri(-6, 6), k = nz(-3, 3), Cc = pt(v.x * k, d + v.y * k);
        if (!allWithin([B, Cc], 10) || Cc.x === 0) return null;
        if (Math.abs(cross(A, B, Cc)) < 1e-9) return null;
        if (Math.abs(cross(A, B, Cc)) / dist(A, B) < 1.5) return null;
        return { A: A, B: B, C: Cc, D: pt(0, d), m: v.y / v.x };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C, P.D]; },
    draw: function (S, P) {
      wFence(S, S.base, S.ray(P.A, sub(P.A, P.B)), S.ray(P.B, sub(P.B, P.A)), C.cy);
      wPin(S, S.base, P.A, C.cy, "A" + fp(P.A)); wPin(S, S.base, P.B, C.cy, "B" + fp(P.B));
      wPin(S, S.base, P.C, C.gd, "C" + fp(P.C));
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, m = P.m, mp = -1 / m;
      return [{
        kicker: "Parallel lines",
        task: "Fence from C hits the breakwater at D. Need <b>CD ∥ AB</b>. Find D.",
        info: null,
        fields: [{ id: "D", type: "pt", label: "D" }],
        action: "Lay fence",
        hints: ["D is on the y-axis, so D = (0, d).", "Parallel lines have equal slopes: " + ms("CD") + " = " + ms("AB") + ".", "(d − " + par(Cc.y) + ") ÷ (0 − " + par(Cc.x) + ") = " + ms("AB") + ". Solve for d."],
        judge: function (v) {
          if (!eq(v.D.x.v, 0)) return bad("D is on the y-axis, so its x-coordinate is 0.");
          return ptJudge(v.D, D, [
            { p: pt(0, Cc.y - mp * Cc.x), m: "That would make the fences perpendicular. Parallel lines have EQUAL slopes." },
            { p: pt(0, Cc.y + m * Cc.x), m: "Sign slip. " + ms("CD") + " = (d − y_C) ÷ (0 − x_C), and 0 − x_C = " + fs(-Cc.x) + "." },
          ], { generic: function (q) { return "With D" + fp(q) + ", " + ms("CD") + " = " + fs(slope(Cc, q)) + " but " + ms("AB") + " = " + fs(m) + "."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.D.x.v, v.D.y.v), dir = sub(U, Cc);
          if (same(U, Cc)) { done(); return; }
          var far = S.ray(Cc, mul(dir, -1)), end = S.ray(Cc, dir);
          wGrow(S, S.fx, far, end, { c: res.ok ? C.ok : C.rd, w: 3, dash: "2 10", cap: "round", wide: 1 }, 800, function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "D" + fp(U));
            if (!res.ok) {
              var X = lineX(A, B, Cc, U);
              if (X && S.inView(X)) { wCrossMark(S, S.fx, X, C.rd); wTag(S, S.fx, X, "fences meet: Bo is trapped", { c: C.rd, up: 1 }); }
            } else wTag(S, S.fx, mid(Cc, U), "∥", { c: C.ok, side: 1, size: 26 });
            wait(350, done);
          });
        },
        work: [slopeShort(A, B, "A", "B")].concat(["CD ∥ AB, so " + ms("CD") + " = " + fs(m),
          "(d − " + par(Cc.y) + ") ÷ (0 − " + par(Cc.x) + ") = " + fs(m), "d = " + fs(Cc.y) + " + " + par(m) + " × " + par(-Cc.x) + " = " + fs(D.y), "D = " + fp(D)]),
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
    topic: "para", quick: true, title: "The typhoon shelter gate",
    gen: function () {
      return loop(function () {
        var v = dirv(3, 3), k = nz(-2, 2), Pp = pt(v.x * k, v.y * k);
        var r = nz(-6, 6), j = nz(-2, 2), Q = pt(r + v.y * j, -v.x * j);
        if (!allWithin([Pp, Q], 10) || Q.y === 0 || Q.x === 0) return null;
        if (Math.abs(v.y) === v.x) return null;
        return { P: Pp, Q: Q, R: pt(r, 0), m: v.y / v.x };
      });
    },
    pts: function (P) { return [P.P, P.Q, P.R, mul(P.P, -1)]; },
    draw: function (S, P) {
      wShore(S, S.base);
      wLine(S, S.base, S.ray(pt(0, 0), mul(P.P, -1)), S.ray(pt(0, 0), P.P), { c: C.cy, w: 3, dash: "10 6" });
      wPin(S, S.base, P.P, C.cy, "P" + fp(P.P));
      S.boG = wIcon(S, S.base, mul(P.P, 0.5), "bo");
      wPin(S, S.base, P.Q, C.gd, "Q" + fp(P.Q));
    },
    steps: function (P) {
      var Pp = P.P, Q = P.Q, Rr = P.R, m1 = P.m, m2 = -1 / m1;
      function rFor(s) { return Q.x - Q.y / s; }
      return [{
        kicker: "Perpendicular lines",
        task: "Gate from Q to seafront R must be <b>QR ⊥ OP</b>. Find R.",
        info: null,
        fields: [{ id: "R", type: "pt", label: "R" }],
        action: "Build gate",
        hints: ["R is on the x-axis, so R = (r, 0).", "Perpendicular slopes multiply to −1: " + ms("QR") + " = −1 ÷ " + ms("OP") + ".", "(0 − " + par(Q.y) + ") ÷ (r − " + par(Q.x) + ") = " + ms("QR") + ". Solve for r."],
        judge: function (v) {
          if (!eq(v.R.y.v, 0)) return bad("R is on the x-axis, so its y-coordinate is 0.");
          return ptJudge(v.R, Rr, [
            { p: pt(rFor(m1), 0), m: "That makes the gate parallel to the path. Perpendicular means m₁ × m₂ = −1." },
            { p: pt(rFor(-m1), 0), m: "The perpendicular slope is the negative reciprocal: flip it AND change the sign. You only changed the sign." },
            { p: pt(rFor(1 / m1), 0), m: "The perpendicular slope is the negative reciprocal: flip it AND change the sign. You only flipped it." },
          ], { generic: function (q) { var s = slope(Q, q); return "With R" + fp(q) + ", " + ms("QR") + " = " + fs(s) + ", and " + fs(m1) + " × " + par(s) + " = " + fs(m1 * s) + ", not −1."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.R.x.v, 0);
          if (same(U, Q)) { done(); return; }
          wGrow(S, S.fx, Q, U, { c: res.ok ? C.ok : C.rd, w: 5 }, 700, function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "R" + fp(U));
            var X = lineX(pt(0, 0), Pp, Q, U);
            if (X && S.inView(X)) {
              var ang = angleBetween(Pp, sub(U, Q));
              if (res.ok) wRight(S, S.fx, X, Pp, sub(Q, X), C.ok);
              else wTag(S, S.fx, X, "≈ " + Math.round(ang) + "°", { c: C.rd, up: 1, size: 20 });
            }
            wait(350, done);
          });
        },
        work: [ms("OP") + " = " + fs(Pp.y) + " ÷ " + fs(Pp.x) + " = " + fs(m1), "QR ⊥ OP, so " + ms("QR") + " = −1 ÷ " + par(m1) + " = " + fs(m2),
          "(0 − " + par(Q.y) + ") ÷ (r − " + par(Q.x) + ") = " + fs(m2), "r = " + fs(Q.x) + " + " + fs(-Q.y) + " ÷ " + pf(m2) + " = " + fs(Rr.x), "R = " + fp(Rr)],
      }];
    },
  };

  var REL = ["Parallel", "Perpendicular", "Neither"];

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
      var A = pt(ri(-8, 0), ri(-6, 5)), B = add(A, mul(v1, ri(1, 2)));
      var Cc = pt(ri(-2, 6), ri(-6, 5)), D = add(Cc, mul(v2, ri(1, 2)));
      if (!allWithin([B, D], 10) || !distinct([A, B, Cc, D])) return null;
      if (type === 0 && Math.abs(cross(A, B, Cc)) / dist(A, B) < 1.5) return null;
      return { A: A, B: B, C: Cc, D: D, t: type };
    });
  }

  R.proposals = {
    topic: "para", quick: false, title: "Fence proposals",
    gen: function () { return { list: shuffle([0, 1, 2]).map(pairFor) }; },
    pts: function (P) { var a = []; P.list.forEach(function (o) { a.push(o.A, o.B, o.C, o.D); }); return a; },
    draw: function () {},
    steps: function (P) {
      return P.list.map(function (o, i) {
        var m1 = slope(o.A, o.B), m2 = slope(o.C, o.D);
        return {
          kicker: "Parallel or perpendicular?",
          title: "Proposal " + (i + 1) + " of 3",
          task: "Fences AB and CD: <b>parallel</b>, <b>perpendicular</b>, or <b>neither</b>?",
          info: null,
          fields: [{ id: "r", type: "choice", label: "AB and CD are", opts: REL }],
          action: "Rule on it",
          hints: ["Work out " + ms("AB") + " and " + ms("CD") + ".", "Equal slopes: parallel. Product of slopes = −1: perpendicular."],
          draw: function (S) {
            wLine(S, S.step, S.ray(o.A, sub(o.A, o.B)), S.ray(o.B, sub(o.B, o.A)), { c: "rgba(34,227,255,.35)", w: 2, dash: "6 6" });
            wLine(S, S.step, S.ray(o.C, sub(o.C, o.D)), S.ray(o.D, sub(o.D, o.C)), { c: "rgba(255,198,90,.35)", w: 2, dash: "6 6" });
            wLine(S, S.step, o.A, o.B, { c: C.cy, w: 4 }); wLine(S, S.step, o.C, o.D, { c: C.gd, w: 4 });
            wPin(S, S.step, o.A, C.cy, "A" + fp(o.A)); wPin(S, S.step, o.B, C.cy, "B" + fp(o.B));
            wPin(S, S.step, o.C, C.gd, "C" + fp(o.C)); wPin(S, S.step, o.D, C.gd, "D" + fp(o.D));
          },
          judge: function (v) {
            if (v.r === o.t) return OK;
            return bad(ms("AB") + " = " + fs(m1) + " and " + ms("CD") + " = " + fs(m2) + ". " +
              (o.t === 0 ? "The slopes are equal, so the fences are parallel." : o.t === 1 ? "Their product is −1, so the fences are perpendicular." : "The slopes are not equal and their product is " + fs(m1 * m2) + ", not −1. Neither."));
          },
          show: function (S, v, res, done) {
            var X = lineX(o.A, o.B, o.C, o.D);
            if (res.ok && o.t === 1 && X && S.inView(X)) wRight(S, S.fx, X, sub(o.B, o.A), sub(o.D, o.C), C.ok);
            if (res.ok && o.t === 0) { wTag(S, S.fx, mid(o.A, o.B), "∥", { c: C.ok, side: 1, size: 26 }); wTag(S, S.fx, mid(o.C, o.D), "∥", { c: C.ok, side: 1, size: 26 }); }
            if (res.ok && o.t === 2 && X && S.inView(X)) wTag(S, S.fx, X, "≈ " + Math.round(angleBetween(sub(o.B, o.A), sub(o.D, o.C))) + "°", { c: C.gd, up: 1 });
            wait(400, done);
          },
          work: [ms("AB") + " = " + fs(o.B.y - o.A.y) + " ÷ " + fs(o.B.x - o.A.x) + " = " + fs(m1), ms("CD") + " = " + fs(o.D.y - o.C.y) + " ÷ " + fs(o.D.x - o.C.x) + " = " + fs(m2),
            o.t === 0 ? "Equal slopes → parallel." : o.t === 1 ? fs(m1) + " × " + par(m2) + " = −1 → perpendicular." : "Not equal, product " + fs(m1 * m2) + " ≠ −1 → neither."],
        };
      });
    },
  };

  R.findp = {
    topic: "para", quick: true, title: "Line up the buoy",
    gen: function () {
      return loop(function () {
        var rel = pick([0, 1]), v0 = dirv(3, 3), m0 = v0.y / v0.x;
        var mt = rel === 0 ? m0 : -1 / m0;
        var den = rel === 0 ? v0.x : Math.abs(v0.y);
        var Q = pt(ri(-3, 6), ri(-6, 6)), k = nz(-2, 2), x1 = Q.x - den * k;
        var p = Q.y - mt * (Q.x - x1);
        if (!isInt(p) || !within(pt(x1, p), 10)) return null;
        return { rel: rel, m0: m0, Q: Q, P: pt(x1, p) };
      });
    },
    pts: function (P) { return [P.P, P.Q, pt(P.P.x, 0)]; },
    draw: function (S, P) {
      var o = pt(S.x0 + 2, S.y0 + 2);
      wLine(S, S.base, S.ray(o, pt(-1, -P.m0)), S.ray(o, pt(1, P.m0)), { c: C.cy, w: 3, dash: "10 6" });
      wTag(S, S.base, S.ray(o, pt(1, P.m0)), "wall L, slope " + fs(P.m0), { c: C.cy, anchor: "end", up: 1 });
      wPin(S, S.base, P.Q, C.gd, "Q" + fp(P.Q));
      wLine(S, S.base, pt(P.P.x, S.y0), pt(P.P.x, S.y1), { c: "rgba(255,198,90,.3)", dash: "3 8", w: 2 });
    },
    steps: function (P) {
      var Q = P.Q, Pp = P.P, mt = P.rel === 0 ? P.m0 : -1 / P.m0, alt = P.rel === 0 ? -1 / P.m0 : P.m0;
      return [{
        kicker: P.rel === 0 ? "Parallel lines" : "Perpendicular lines",
        task: "Buoy line from P(" + fs(Pp.x) + ", p) to Q must be <b>" + (P.rel === 0 ? "∥" : "⊥") + "</b> wall L. Find p.",
        info: ["Slope of L: " + fs(P.m0)],
        fields: [{ id: "p", type: "num", label: "p" }],
        action: "Set buoy",
        hints: [P.rel === 0 ? "Parallel: " + ms("PQ") + " = " + fs(P.m0) + "." : "Perpendicular: " + ms("PQ") + " = −1 ÷ " + par(P.m0) + " = " + fs(mt) + ".", "(" + fs(Q.y) + " − p) ÷ (" + fs(Q.x) + " − " + par(Pp.x) + ") = " + ms("PQ") + ". Solve for p."],
        judge: function (v) {
          return numJudge(v.p, Pp.y, [{ v: Q.y - alt * (Q.x - Pp.x), m: P.rel === 0 ? "That makes the line perpendicular. Parallel means equal slopes." : "That makes the line parallel. Perpendicular means m₁ × m₂ = −1." }],
            { generic: function (x) { return "With p = " + fs(x) + ", " + ms("PQ") + " = " + fs(slope(pt(Pp.x, x), Q)) + ", but it should be " + fs(mt) + "."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(Pp.x, v.p.v);
          if (!S.inView(U) || same(U, Q)) { done(); return; }
          wGrow(S, S.fx, U, Q, { c: res.ok ? C.ok : C.rd, w: 4 }, 600, function () { wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U)); wait(300, done); });
        },
        work: [ms("PQ") + " = " + fs(mt), "(" + fs(Q.y) + " − p) ÷ " + par(Q.x - Pp.x) + " = " + fs(mt), fs(Q.y) + " − p = " + fs(mt * (Q.x - Pp.x)), "p = " + fs(Pp.y)],
      }];
    },
  };

  R.corner = {
    topic: "para", quick: false, title: "Prove the corner",
    gen: function () {
      return loop(function () {
        var u = dirv(3, 3), D = pt(ri(-3, 4), ri(-3, 4)), j = nz(-2, 2);
        var Cc = sub(D, mul(u, ri(1, 2))), A = add(D, mul(pt(-u.y, u.x), j)), B = sub(A, mul(u, ri(2, 3)));
        var e = pick([1, 2, 3, -1, -2]);
        if (u.x * e - u.y === 0) return null;
        var c0 = A.y - e * A.x;
        if (!allWithin([A, B, Cc, D], 11) || !distinct([A, B, Cc, D]) || A.x === 0) return null;
        return { A: A, B: B, C: Cc, D: D, e: e, c0: c0 };
      });
    },
    pts: function (P) { return [P.A, P.B, P.C, P.D]; },
    draw: function (S, P) {
      wPin(S, S.base, P.B, C.cy, "B" + fp(P.B)); wPin(S, S.base, P.C, C.gd, "C" + fp(P.C)); wPin(S, S.base, P.D, C.gd, "D" + fp(P.D));
      wLine(S, S.base, P.C, P.D, { c: C.gd, w: 4 });
      wLine(S, S.base, S.ray(pt(0, P.c0), pt(-1, -P.e)), S.ray(pt(0, P.c0), pt(1, P.e)), { c: "rgba(157,180,204,.3)", dash: "3 8", w: 2 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, e = P.e, c0 = P.c0, mCD = slope(Cc, D), mAD = slope(A, D);
      var Aexpr = "A(a, " + lin(e, c0, "a") + ")";
      return [{
        kicker: "Parallel lines · step 1",
        task: "Corner " + Aexpr + " slides. Need <b>BA ∥ CD</b>. Find a.",
        info: null,
        fields: [{ id: "a", type: "num", label: "a" }],
        action: "Fix post A",
        hints: ["BA ∥ CD, so " + ms("BA") + " = " + ms("CD") + " = " + fs(mCD) + ".", "(" + lin(e, c0, "a") + " − " + par(B.y) + ") ÷ (a − " + par(B.x) + ") = " + fs(mCD) + ". Cross-multiply and solve."],
        judge: function (v) {
          return numJudge(v.a, A.x, [], { generic: function (x) { var q = pt(x, e * x + c0); return "With a = " + fs(x) + ", A = " + fp(q) + " and " + ms("BA") + " = " + fs(slope(B, q)) + ", but " + ms("CD") + " = " + fs(mCD) + "."; } });
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
        work: [ms("CD") + " = " + fs(mCD), "(" + lin(e, c0, "a") + " − " + par(B.y) + ") ÷ (a − " + par(B.x) + ") = " + fs(mCD), "a = " + fs(A.x) + ", so A = " + fp(A)],
      }, {
        kicker: "Perpendicular lines · step 2",
        task: "Is corner D a right angle? Check <b>AD ⊥ CD</b> with slopes.",
        info: null,
        fields: [slopeField("m1", "Slope of AD"), slopeField("m2", "Slope of CD"), { id: "c", type: "choice", label: "AD ⊥ CD?", opts: ["Yes", "No"] }],
        action: "Check corner",
        hints: ["Work out " + ms("AD") + " and " + ms("CD") + ".", "Multiply them. If the product is −1, the lines are perpendicular."],
        judge: function (v) {
          var r = numJudge(v.m1, mAD, slopeWrongs(A, D));
          if (!r.ok) return bad("Slope of AD: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          r = numJudge(v.m2, mCD, slopeWrongs(Cc, D));
          if (!r.ok) return bad("Slope of CD: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          if (v.c !== 0) return bad(fs(mAD) + " × " + par(mCD) + " = −1, so AD ⊥ CD. The engineers are right.");
          return OK;
        },
        show: function (S, v, res, done) {
          wGrow(S, S.fx, A, D, { c: res.ok ? C.ok : C.rd, w: 4 }, 500, function () {
            if (res.ok) wRight(S, S.fx, D, sub(A, D), sub(Cc, D), C.ok);
            wait(300, done);
          });
        },
        work: [ms("AD") + " = " + fs(mAD), ms("CD") + " = " + fs(mCD), ms("AD") + " × " + ms("CD") + " = " + fs(mAD) + " × " + par(mCD) + " = −1", "So AD ⊥ CD."],
      }];
    },
  };

  /* ---------- Chapter 4 · mid-point and section formula ---------- */

  R.mid = {
    topic: "mid", quick: true, title: "The halfway light",
    gen: function () {
      return loop(function () {
        var A = pt(ri(-9, 9), ri(-7, 7)), B = pt(ri(-9, 9), ri(-7, 7));
        return d2(A, B) >= 36 && A.x !== B.x && A.y !== B.y ? { A: A, B: B } : null;
      });
    },
    pts: function (P) { return [P.A, P.B]; },
    draw: function (S, P) {
      S.boG = wIcon(S, S.base, P.A, "bo"); wTag(S, S.base, P.A, "Bo A" + fp(P.A), { up: 1 });
      wIcon(S, S.base, P.B, "gate"); wTag(S, S.base, P.B, "Exit B" + fp(P.B), { up: 1 });
      wLine(S, S.base, P.A, P.B, { c: "rgba(255,198,90,.4)", w: 2, dash: "4 8" });
    },
    steps: function (P) {
      var A = P.A, B = P.B, M = mid(A, B);
      return [{
        kicker: "Mid-point formula",
        task: "Light buoy M is <b>halfway</b> between A and B. Where is M?",
        info: null,
        fields: [{ id: "M", type: "pt", label: "M" }],
        action: "Drop buoy",
        hints: ["The mid-point is the average of the coordinates.", "M = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2). Halves like 5/2 are fine."],
        judge: function (v) {
          return ptJudge(v.M, M, [
            { p: mul(sub(B, A), 0.5), m: "That is half the DIFFERENCE. The mid-point uses the SUM: (x₁ + x₂) ÷ 2." },
            { p: add(A, B), m: "Add the coordinates, then divide by 2." },
            { p: mul(sub(A, B), 0.5), m: "That is half the difference. The mid-point uses the sum: (x₁ + x₂) ÷ 2." },
          ]);
        },
        show: function (S, v, res, done) {
          var U = pt(v.M.x.v, v.M.y.v);
          if (!S.inView(U)) { done(); return; }
          wDrop(S, S.fx, U, "light", function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "M" + fp(U));
            if (res.ok) { wTick(S, S.fx, mid(A, M), sub(B, A), C.ok); wTick(S, S.fx, mid(M, B), sub(B, A), C.ok); }
            wait(300, done);
          });
        },
        work: ["M = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2)", "= ((" + fs(A.x) + " + " + par(B.x) + ") ÷ 2, (" + fs(A.y) + " + " + par(B.y) + ") ÷ 2)", "= " + fp(M)],
      }];
    },
  };

  R.lostTug = {
    topic: "mid", quick: true, title: "The lost tug",
    gen: function () {
      return loop(function () {
        var A = pt(ri(-9, 9), ri(-7, 7)), B = pt(ri(-9, 9), ri(-7, 7));
        return d2(A, B) >= 36 && A.x !== B.x && A.y !== B.y ? { A: A, B: B, M: mid(A, B) } : null;
      });
    },
    pts: function (P) { return [P.A, P.B, P.M]; },
    draw: function (S, P) {
      wIcon(S, S.base, P.A, "tug"); wTag(S, S.base, P.A, "Tug A" + fp(P.A), { up: 1 });
      wIcon(S, S.base, P.M, "tug"); wTag(S, S.base, P.M, "Tug M" + fp(P.M), { up: 1 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, M = P.M;
      return [{
        kicker: "Mid-point formula",
        task: "M is the mid-point of AB. Find tug B.",
        info: null,
        fields: [{ id: "B", type: "pt", label: "B" }],
        action: "Send radio fix",
        hints: ["Let B = (x, y). Then (" + fs(A.x) + " + x) ÷ 2 = " + fs(M.x) + ".", "So x = 2 × " + par(M.x) + " − " + par(A.x) + ". Do the same for y.", "Check: B is as far beyond M as A is before it."],
        judge: function (v) {
          return ptJudge(v.B, B, [
            { p: mid(A, M), m: "That is the mid-point of A and M. M is in the middle, so B is on the far side of M." },
            { p: sub(M, A), m: "Not M − A. Use (x_A + x) ÷ 2 = x_M, so x = 2x_M − x_A." },
            { p: add(M, mul(sub(M, A), 0.5)), m: "B is a whole step beyond M, not half a step: x = 2x_M − x_A." },
          ], { generic: function (q) { return "The mid-point of A and your point is " + fp(mid(A, q)) + ", not M" + fp(M) + "."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.B.x.v, v.B.y.v);
          if (!S.inView(U)) { done(); return; }
          wGrow(S, S.fx, A, U, { c: res.ok ? C.ok : C.rd, w: 2.5, dash: "5 6" }, 600, function () {
            wDrop(S, S.fx, U, "tug", function () {
              wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "B" + fp(U));
              if (res.ok) { wTick(S, S.fx, mid(A, M), sub(B, A), C.ok); wTick(S, S.fx, mid(M, B), sub(B, A), C.ok); }
              wait(300, done);
            });
          });
        },
        work: ["(" + fs(A.x) + " + x) ÷ 2 = " + fs(M.x) + " → x = " + fs(2 * M.x) + " − " + par(A.x) + " = " + fs(B.x),
          "(" + fs(A.y) + " + y) ÷ 2 = " + fs(M.y) + " → y = " + fs(2 * M.y) + " − " + par(A.y) + " = " + fs(B.y), "B = " + fp(B)],
      }];
    },
  };

  function sectionGen(trap) {
    return function () {
      return loop(function () {
        var m, n, k;
        if (trap) { k = ri(3, 6); m = ri(1, k - 1); if (gcd(m, k) !== 1) return null; n = k - m; }
        else { m = ri(1, 4); n = ri(1, 4); if (m === n || gcd(m, n) !== 1) return null; }
        var v = pt(nz(-2, 2), nz(-2, 2)), A = pt(ri(-9, 3), ri(-7, 7)), B = add(A, mul(v, m + n));
        if (!within(B, 10) || d2(A, B) < 36) return null;
        return { A: A, B: B, m: m, n: n, P: add(A, mul(v, m)) };
      });
    };
  }

  function sectionGeneric(A, B, m, n) {
    return function (q) {
      if (Math.abs(cross(A, B, q)) > 1e-7) return "Your point " + fp(q) + " is not on AB at all.";
      var t = ((q.x - A.x) * (B.x - A.x) + (q.y - A.y) * (B.y - A.y)) / d2(A, B);
      if (t <= 0 || t >= 1) return "Your point is on the line AB, but not between A and B.";
      var g = t / (1 - t);
      return "Your point splits AB in the ratio " + fs(g) + " : 1, not " + m + " : " + n + ".";
    };
  }

  function sectionShow(P) {
    return function (S, v, res, done) {
      var U = pt(v.P.x.v, v.P.y.v);
      if (!S.inView(U)) { done(); return; }
      if (res.ok) for (var i = 1; i < P.m + P.n; i++) wDot(S, S.fx, add(P.A, mul(sub(P.B, P.A), i / (P.m + P.n))), C.gd, 4);
      wDrop(S, S.fx, U, "light", function () {
        wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U));
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
    S.boG = wIcon(S, S.base, P.A, "bo"); wTag(S, S.base, P.A, "Bo A" + fp(P.A), { up: 1 });
    wIcon(S, S.base, P.B, "gate"); wTag(S, S.base, P.B, "B" + fp(P.B), { up: 1 });
    wLine(S, S.base, P.A, P.B, { c: "rgba(255,198,90,.4)", w: 2, dash: "4 8" });
  }

  R.section = {
    topic: "mid", quick: true, title: "Lights closer to Bo",
    gen: sectionGen(false),
    pts: function (P) { return [P.A, P.B]; },
    draw: sectionDraw,
    steps: function (P) {
      var A = P.A, B = P.B, m = P.m, n = P.n;
      return [{
        kicker: "Section formula",
        task: "Light P on AB with <b>AP : PB = " + m + " : " + n + "</b>. Find P.",
        info: null,
        fields: [{ id: "P", type: "pt", label: "P" }],
        action: "Drop light",
        hints: ["AP : PB = m : n with m = " + m + ", n = " + n + ".", "P = ((n·x₁ + m·x₂) ÷ (m + n), (n·y₁ + m·y₂) ÷ (m + n)). A gets the weight n, B gets the weight m.",
          "Check: P should be " + m + "/" + (m + n) + " of the way from A to B."],
        judge: function (v) {
          return ptJudge(v.P, P.P, [
            { p: add(A, mul(sub(B, A), n / (m + n))), m: "Weights swapped. P is nearer the end with the SMALLER share, so x = (n·x₁ + m·x₂) ÷ (m + n): A gets n, B gets m." },
            { p: mid(A, B), m: "That is the mid-point. The ratio is " + m + " : " + n + ", not 1 : 1." },
          ], { generic: sectionGeneric(A, B, m, n) });
        },
        show: sectionShow(P),
        work: sectionWork(A, B, m, n, P.P),
      }];
    },
  };

  R.sectionAB = {
    topic: "mid", quick: true, title: "Read the plan carefully",
    gen: sectionGen(true),
    pts: function (P) { return [P.A, P.B]; },
    draw: sectionDraw,
    steps: function (P) {
      var A = P.A, B = P.B, m = P.m, n = P.n, k = m + n;
      return [{
        kicker: "Section formula",
        task: "Light P on AB with <b>AP : AB = " + m + " : " + k + "</b>. Find P.",
        info: null,
        fields: [{ id: "P", type: "pt", label: "P" }],
        action: "Drop light",
        hints: ["AB is the WHOLE segment. AP is " + m + " parts out of " + k + ".", "So PB is " + k + " − " + m + " = " + n + " parts: AP : PB = " + m + " : " + n + ".", "Now use the section formula with m : n = " + m + " : " + n + "."],
        judge: function (v) {
          return ptJudge(v.P, P.P, [
            { p: add(A, mul(sub(B, A), m / (m + k))), m: "Careful: the plan says AP : AB, not AP : PB. AP is " + m + " parts of the whole " + k + ", so AP : PB = " + m + " : " + n + "." },
            { p: add(A, mul(sub(B, A), n / k)), m: "Weights swapped. AP : PB = " + m + " : " + n + ", so A gets weight " + n + " and B gets weight " + m + "." },
          ], { generic: sectionGeneric(A, B, m, n) });
        },
        show: sectionShow(P),
        work: ["AP : AB = " + m + " : " + k + " → AP : PB = " + m + " : " + n].concat(sectionWork(A, B, m, n, P.P)),
      }];
    },
  };

  R.shoal = {
    topic: "mid", quick: true, title: "The shoal",
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
      S.boG = wIcon(S, S.base, P.A, "bo"); wTag(S, S.base, P.A, "Bo A" + fp(P.A), { up: 1 });
      wIcon(S, S.base, P.B, "gate"); wTag(S, S.base, P.B, "B" + fp(P.B), { up: 1 });
      wLine(S, S.base, P.A, P.B, { c: C.cy, w: 2.5 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, r = P.r, s = P.s;
      return [{
        kicker: "Finding a ratio",
        task: "AB meets the <b>x-axis</b> at P. Find <b>AP : PB</b>.",
        info: null,
        fields: [{ id: "k", type: "ratio", label: "AP : PB" }],
        action: "Mark the shoal",
        hints: ["Let AP : PB = k : 1. P is on the x-axis, so its y-coordinate is 0.", "Section formula for y: (1 × " + par(A.y) + " + k × " + par(B.y) + ") ÷ (k + 1) = 0.", "Shortcut: the ratio is the vertical distances to the axis, |y_A| : |y_B|."],
        judge: function (v) {
          return ratioJudge(v.k, r, s, {
            flip: "Upside down. AP is next to A, and A is " + Math.abs(A.y) + " units from the x-axis, while B is " + Math.abs(B.y) + " units from it.",
            generic: function (a, b) { var q = pt((b * A.x + a * B.x) / (a + b), (b * A.y + a * B.y) / (a + b)); return "That ratio puts P at " + fp(q) + ", which is not on the x-axis."; },
          });
        },
        show: function (S, v, res, done) {
          var a = v.k.r.v, b = v.k.s.v, U = pt((b * A.x + a * B.x) / (a + b), (b * A.y + a * B.y) / (a + b));
          wDrop(S, S.fx, U, "light", function () {
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "P" + fp(U));
            if (res.ok) { wLine(S, S.fx, A, U, { c: C.ok, w: 4 }); wLine(S, S.fx, U, B, { c: C.gd, w: 4 }); }
            wait(300, done);
          });
        },
        work: ["Let AP : PB = k : 1. P is on the x-axis, so y_P = 0.", "(1 × " + par(A.y) + " + k × " + par(B.y) + ") ÷ (k + 1) = 0", fs(A.y) + (B.y < 0 ? " − " + fs(-B.y) : " + " + fs(B.y)) + "k = 0 → k = " + fs(-A.y / B.y), "AP : PB = " + r + " : " + s],
      }];
    },
  };

  R.parallelogram = {
    topic: "mid", quick: true, title: "The fourth tug",
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
      ["A", "B", "C"].forEach(function (k) { wIcon(S, S.base, P[k], "tug"); wTag(S, S.base, P[k], k + fp(P[k]), { up: 1 }); });
      wLine(S, S.base, P.A, P.B, { c: C.cy, w: 2.5 }); wLine(S, S.base, P.B, P.C, { c: C.cy, w: 2.5 });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, D = P.D, M = mid(A, Cc);
      return [{
        kicker: "Mid-point formula",
        task: "Net is parallelogram <b>ABCD</b>. Where must tug D go?",
        info: null,
        fields: [{ id: "D", type: "pt", label: "D" }],
        action: "Send tug D",
        hints: ["The diagonals of a parallelogram bisect each other.", "So the mid-point of AC is also the mid-point of BD.", "Mid-point of AC = " + fp(M) + ". Now find D from B and this mid-point."],
        judge: function (v) {
          return ptJudge(v.D, D, [
            { p: add(B, sub(Cc, A)), m: "That makes a different parallelogram. In ABCD the corners go round in order, so the diagonals are AC and BD." },
            { p: add(A, sub(B, Cc)), m: "That makes a different parallelogram. In ABCD the corners go round in order, so the diagonals are AC and BD." },
          ], { generic: function (q) { return "Mid-point of AC = " + fp(M) + ", but mid-point of BD = " + fp(mid(B, q)) + ". They must match."; } });
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
        work: ["Diagonals bisect each other: mid-point of BD = mid-point of AC = " + fp(M), "D = (2 × " + par(M.x) + " − " + par(B.x) + ", 2 × " + par(M.y) + " − " + par(B.y) + ") = " + fp(D)],
      }];
    },
  };

  /* ---------- Chapter 5 · centres of a triangle ---------- */

  var CENTRES = ["Centroid", "Circumcentre", "Orthocentre", "In-centre"];
  var CENTRE_SCENES = [
    ["Equally far from all three stations", 1],
    ["Balance point of a triangular sling", 0],
    ["Where the shortest routes from each corner to the opposite side cross", 2],
    ["Centre of the largest round dome that fits inside the triangle", 3],
  ];
  var CENTRE_FACTS = {
    0: "Centroid: where the medians meet; the balance point.",
    1: "Circumcentre: where the perpendicular bisectors meet; equally far from the three vertices.",
    2: "Orthocentre: where the altitudes meet; an altitude is the shortest route from a vertex to the opposite side.",
    3: "In-centre: where the angle bisectors meet; equally far from the three sides.",
  };

  /* Right-angled △ with legs // axes. rightAt = "A"|"B"|"C". Often one vertex is O. */
  function rightLegs(rightAt, wantO) {
    return loop(function () {
      var bx = nz(4, 10) * sgn(), cy = nz(4, 10) * sgn();
      if (Math.abs(bx) === Math.abs(cy) && Math.random() < 0.4) return null;
      var A, B, Cc, right;
      if (rightAt === "A") {
        A = wantO ? pt(0, 0) : pt(ri(-3, 3), ri(-2, 2));
        B = pt(A.x + bx, A.y);
        Cc = pt(A.x, A.y + cy);
        right = A;
      } else if (rightAt === "B") {
        B = wantO ? pt(0, 0) : pt(ri(-3, 3), ri(-2, 2));
        A = pt(B.x + bx, B.y);
        Cc = pt(B.x, B.y + cy);
        right = B;
      } else {
        Cc = wantO ? pt(0, 0) : pt(ri(-3, 3), ri(-2, 2));
        A = pt(Cc.x + bx, Cc.y);
        B = pt(Cc.x, Cc.y + cy);
        right = Cc;
      }
      if (!allWithin([A, B, Cc], 11) || !distinct([A, B, Cc])) return null;
      var hypA = right === A ? B : A, hypB = right === Cc ? B : Cc;
      if (right === B) { hypA = A; hypB = Cc; }
      return { A: A, B: B, C: Cc, right: right, rightName: rightAt, hypA: hypA, hypB: hypB, O: mid(hypA, hypB), H: right, G: centroid(A, B, Cc) };
    });
  }

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
    ["A", "B", "C"].forEach(function (k) {
      wIcon(S, layer, T[k], "station");
      wTag(S, layer, T[k], named ? k + fp(T[k]) : k, { up: 1 });
    });
  }

  R.which = {
    topic: "centre", quick: true, title: "Four centres",
    gen: function () { return { T: acuteTri(), rows: shuffle(CENTRE_SCENES.slice()) }; },
    pts: function (P) { return [P.T.A, P.T.B, P.T.C]; },
    draw: function (S, P) { drawStations(S, S.base, P.T, false); },
    steps: function (P) {
      var T = P.T;
      return [{
        kicker: "Centres of a triangle",
        task: "Match each job to the right centre of △ABC.",
        info: ["Centroid · circumcentre · orthocentre · in-centre"],
        fields: P.rows.map(function (r, i) { return { id: "c" + i, type: "choice", label: r[0], opts: CENTRES, small: true }; }),
        action: "Brief the team",
        hints: [CENTRE_FACTS[1], CENTRE_FACTS[0], CENTRE_FACTS[2], CENTRE_FACTS[3]],
        judge: function (v) {
          var msgs = [];
          P.rows.forEach(function (r, i) { if (v["c" + i] !== r[1]) msgs.push("“" + r[0] + "”"); });
          return msgs.length ? bad("Recheck " + msgs.join(" and ") + ". Open a hint for what each centre means.") : OK;
        },
        show: function (S, v, res, done) {
          if (res.ok) {
            var pts = [centroid(T.A, T.B, T.C), circumcentre(T.A, T.B, T.C), orthocentre(T.A, T.B, T.C), incentre(T.A, T.B, T.C)];
            var cols = [C.gd, C.pk, C.ok, C.cy], names = ["G", "O", "H", "I"];
            pts.forEach(function (p, i) { wPin(S, S.fx, p, cols[i], names[i] + " · " + CENTRES[i].toLowerCase()); });
          }
          wait(400, done);
        },
        work: [CENTRE_FACTS[0], CENTRE_FACTS[1], CENTRE_FACTS[2], CENTRE_FACTS[3]],
      }];
    },
  };

  function circumTri() {
    /* JM33(E) style: right-angled △ → circumcentre = mid-point of the hypotenuse. */
    var T = rightLegs(pick(["A", "B", "C"]), Math.random() < 0.7);
    return { A: T.A, B: T.B, C: T.C, O: T.O, right: T.right, rightName: T.rightName, hypA: T.hypA, hypB: T.hypB };
  }

  function circumWork(T, O) {
    var hypA = T.hypA, hypB = T.hypB, rn = T.rightName;
    return ["△ABC is right-angled at " + rn + ".",
      "In a right-angled triangle, the circumcentre is the mid-point of the hypotenuse.",
      "Hypotenuse = " + (rn === "A" ? "BC" : rn === "B" ? "AC" : "AB") + " from " + fp(hypA) + " to " + fp(hypB) + ".",
      "O = ((" + fs(hypA.x) + " + " + par(hypB.x) + ") ÷ 2, (" + fs(hypA.y) + " + " + par(hypB.y) + ") ÷ 2) = " + fp(O)];
  }

  R.circum = {
    topic: "centre", quick: true, title: "Where is the mother?",
    gen: function () { return circumTri(); },
    pts: function (P) { return [P.A, P.B, P.C, P.O]; },
    draw: function (S, P) {
      drawStations(S, S.base, P, true);
      wRight(S, S.base, P.right, sub(P.hypA, P.right), sub(P.hypB, P.right), C.gd);
    },
    steps: function (P) {
      var O = P.O, G = centroid(P.A, P.B, P.C), H = P.right;
      var hypName = P.rightName === "A" ? "BC" : P.rightName === "B" ? "AC" : "AB";
      return [{
        kicker: "Circumcentre",
        task: "Mother is <b>equidistant</b> from A, B and C. Where is she?",
        info: ["△ABC right-angled at " + P.rightName],
        fields: [{ id: "M", type: "pt", label: "Mother" }],
        action: "Lock position",
        hints: ["Equally far from A, B and C: the circumcentre.",
          "Look carefully: one angle is a right angle (the legs meet square-on).",
          "In a right-angled triangle, the circumcentre is simply the mid-point of the hypotenuse " + hypName + "."],
        judge: function (v) {
          return ptJudge(v.M, O, [
            { p: G, m: "That is the centroid (the balance point). The mother is the same DISTANCE from all three stations: the circumcentre." },
            { p: H, m: "That is the orthocentre (the right-angle vertex). Equal distance from the three vertices means the circumcentre — the mid-point of the hypotenuse." },
            { p: mid(P.A, P.B), m: "Check which side is the hypotenuse: it is the side opposite the right angle, " + hypName + "." },
            { p: mid(P.B, P.C), m: "Check which side is the hypotenuse: it is the side opposite the right angle, " + hypName + "." },
            { p: mid(P.A, P.C), m: "Check which side is the hypotenuse: it is the side opposite the right angle, " + hypName + "." },
          ], { generic: function (q) { return "From your point: to A √" + fs(d2(q, P.A)) + ", to B √" + fs(d2(q, P.B)) + ", to C √" + fs(d2(q, P.C)) + ". They must all be equal."; } });
        },
        show: function (S, v, res, done) {
          var U = pt(v.M.x.v, v.M.y.v);
          if (!S.inView(U)) { done(); return; }
          wGrow(S, S.fx, P.hypA, P.hypB, { c: C.gd, w: 3 }, 700);
          [P.A, P.B, P.C].forEach(function (p, i) { wRing(S, S.fx, p, dist(p, U), { c: [C.cy, C.gd, C.pk][i], w: 1.8, op: 0.75, grow: 900 }); });
          SFX.ping();
          wait(950, function () {
            if (res.ok) { wRing(S, S.fx, O, dist(O, P.A), { c: C.ok, w: 3.5, grow: 500 }); wIcon(S, S.fx, O, "mother"); }
            wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fp(U));
            wait(400, done);
          });
        },
        work: circumWork(P, O),
      }];
    },
  };

  function orthoTri() {
    /* JM33(E) style: right-angled △ → orthocentre = the right-angle vertex. */
    var T = rightLegs(pick(["A", "B", "C"]), Math.random() < 0.7);
    return { A: T.A, B: T.B, C: T.C, H: T.H, right: T.right, rightName: T.rightName, hypA: T.hypA, hypB: T.hypB };
  }

  function orthoWork(T) {
    return ["△ABC is right-angled at " + T.rightName + " (the two legs meet square-on).",
      "In a right-angled triangle, the orthocentre is the right-angle vertex.",
      "Orthocentre H = " + T.rightName + " = " + fp(T.H)];
  }

  R.ortho = {
    topic: "centre", quick: true, title: "The medical boat",
    gen: function () { return orthoTri(); },
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      drawStations(S, S.base, P, true);
      wRight(S, S.base, P.right, sub(P.hypA, P.right), sub(P.hypB, P.right), C.gd);
    },
    steps: function (P) {
      var H = P.H, G = centroid(P.A, P.B, P.C), O = mid(P.hypA, P.hypB);
      return [{
        kicker: "Orthocentre",
        task: "Medical boat waits where the three <b>shortest routes</b> to the opposite sides cross. Find it.",
        info: ["△ABC right-angled at " + P.rightName],
        fields: [{ id: "H", type: "pt", label: "Medical boat" }],
        action: "Send medical boat",
        hints: ["The shortest routes are the altitudes. They meet at the orthocentre.",
          "Check the slopes (or the grid): one angle is 90°.",
          "In a right-angled triangle, the orthocentre is simply the right-angle vertex — here, " + P.rightName + "."],
        judge: function (v) {
          return ptJudge(v.H, H, [
            { p: G, m: "That is the centroid. The boats take the shortest routes to the opposite sides: altitudes, so you need the orthocentre." },
            { p: O, m: "That is the circumcentre (mid-point of the hypotenuse). In a right-angled triangle the orthocentre is the right-angle vertex, " + P.rightName + "." },
          ]);
        },
        show: function (S, v, res, done) {
          var U = pt(v.H.x.v, v.H.y.v);
          var feet = [foot(P.A, P.B, P.C), foot(P.B, P.A, P.C), foot(P.C, P.A, P.B)], from = [P.A, P.B, P.C];
          from.forEach(function (p, i) { wGrow(S, S.fx, p, feet[i], { c: C.gd, w: 2, dash: "5 6" }, 900); });
          wait(950, function () {
            feet.forEach(function (f, i) {
              if (d2(from[i], f) < 1e-9) return;
              wRight(S, S.fx, f, sub(from[i], f), sub(i === 0 ? P.B : i === 1 ? P.A : P.A, f), C.gd);
            });
            if (S.inView(U)) { wDrop(S, S.fx, U, "boat", function () { wPin(S, S.fx, U, res.ok ? C.ok : C.rd, fp(U)); wait(300, done); }); }
            else done();
          });
        },
        work: orthoWork(P),
      }];
    },
  };

  function centroidTri() {
    /* JM33(E) style: often one vertex is the origin O. */
    return loop(function () {
      var A = pt(0, 0), B = pt(nz(-9, 9), nz(-7, 7)), Cc = pt(nz(-9, 9), nz(-7, 7));
      if ((A.x + B.x + Cc.x) % 3 || (A.y + B.y + Cc.y) % 3 || Math.abs(cross(A, B, Cc)) < 30) return null;
      if (!allWithin([B, Cc], 11) || !distinct([A, B, Cc])) return null;
      return { A: A, B: B, C: Cc, G: centroid(A, B, Cc) };
    });
  }

  R.centroid = {
    topic: "centre", quick: true, title: "The sling hook",
    gen: centroidTri,
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      S.sling = sv("g", {}, S.base);
      wPoly(S, S.sling, [P.A, P.B, P.C], { c: C.cy, w: 2.5, fill: "rgba(34,227,255,.08)" });
      ["A", "B", "C"].forEach(function (k) { wIcon(S, S.sling, P[k], "heli"); wTag(S, S.base, P[k], k + fp(P[k]), { up: 1 }); });
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, G = P.G;
      return [{
        kicker: "Centroid",
        task: "Hook must sit at the sling's <b>balance point</b> (centroid). Where?",
        info: null,
        fields: [{ id: "G", type: "pt", label: "Hook" }],
        action: "Attach hook",
        hints: ["The balance point of a triangle is the centroid, where the three medians meet.", "G = ((x₁ + x₂ + x₃) ÷ 3, (y₁ + y₂ + y₃) ÷ 3)."],
        judge: function (v) {
          return ptJudge(v.G, G, [
            { p: add(add(A, B), Cc), m: "Add the three coordinates, then divide by 3." },
            { p: mul(add(add(A, B), Cc), 0.5), m: "There are three vertices, so divide by 3, not 2." },
            { p: circumcentre(A, B, Cc), m: "That is the circumcentre. The balance point is the centroid." },
          ]);
        },
        show: function (S, v, res, done) {
          var U = pt(v.G.x.v, v.G.y.v);
          [[A, mid(B, Cc)], [B, mid(A, Cc)], [Cc, mid(A, B)]].forEach(function (m) { wLine(S, S.fx, m[0], m[1], { c: C.gd, w: 1.5, dash: "4 6" }); });
          if (!S.inView(U)) { done(); return; }
          wPin(S, S.fx, U, res.ok ? C.ok : C.rd, "hook " + fp(U));
          var hook = S.P(U), g = S.sling, t0 = 0;
          anim(900, function (k) {
            if (res.ok) g.setAttribute("transform", "translate(0," + (-26 * Math.sin(k * Math.PI / 2)) + ")");
            else {
              var a = Math.sin(k * Math.PI * 3) * 7 * (1 - k * 0.4);
              g.setAttribute("transform", "rotate(" + a + " " + hook.x + " " + hook.y + ")");
            }
            t0 = k;
          }, function () { if (!res.ok) g.setAttribute("transform", ""); done(); });
        },
        work: ["G = ((x₁ + x₂ + x₃) ÷ 3, (y₁ + y₂ + y₃) ÷ 3)", "= ((" + fs(A.x) + " + " + par(B.x) + " + " + par(Cc.x) + ") ÷ 3, (" + fs(A.y) + " + " + par(B.y) + " + " + par(Cc.y) + ") ÷ 3)", "= " + fp(G)],
      }];
    },
  };

  R.centroidInv = {
    topic: "centre", quick: true, title: "The third helicopter",
    gen: centroidTri,
    pts: function (P) { return [P.A, P.B, P.C]; },
    draw: function (S, P) {
      ["A", "B"].forEach(function (k) { wIcon(S, S.base, P[k], "heli"); wTag(S, S.base, P[k], k + fp(P[k]), { up: 1 }); });
      wPin(S, S.base, P.G, C.gd, "G" + fp(P.G));
    },
    steps: function (P) {
      var A = P.A, B = P.B, Cc = P.C, G = P.G;
      return [{
        kicker: "Centroid",
        task: "G is the centroid. A and B are set. Where must helicopter C fly?",
        info: null,
        fields: [{ id: "C", type: "pt", label: "C" }],
        action: "Guide helicopter",
        hints: ["(x_A + x_B + x) ÷ 3 = x_G.", "So x = 3x_G − x_A − x_B. Do the same for y."],
        judge: function (v) {
          return ptJudge(v.C, Cc, [{ p: centroid(A, B, G), m: "That averages A, B and G. G is the centroid of A, B and C: (x_A + x_B + x_C) ÷ 3 = x_G." }],
            { generic: function (q) { return "The centroid of A, B and your point is " + fp(centroid(A, B, q)) + ", not G" + fp(G) + "."; } });
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
        work: ["(" + fs(A.x) + " + " + par(B.x) + " + x) ÷ 3 = " + fs(G.x) + " → x = " + fs(Cc.x), "(" + fs(A.y) + " + " + par(B.y) + " + y) ÷ 3 = " + fs(G.y) + " → y = " + fs(Cc.y), "C = " + fp(Cc)],
      }];
    },
  };

  var TRI_KIND = ["an acute-angled", "a right-angled", "an obtuse-angled"];
  var WHERE = ["Inside", "On the triangle", "Outside"];
  function whereAns(c, k) { return c === 0 || c === 3 ? 0 : k; }

  R.where = {
    topic: "centre", quick: true, title: "Inside, on or outside?",
    gen: function () {
      var all = [];
      for (var c = 0; c < 4; c++) for (var k = 0; k < 3; k++) all.push([c, k]);
      var rows = shuffle(all.filter(function (r) { return r[0] === 1 || r[0] === 2; })).slice(0, 2).concat([pick(all)]);
      return { rows: shuffle(rows), T: { A: pt(-7, -3), B: pt(6, -3), C: pt(-4, 5) } };
    },
    pts: function () { return [pt(-8, -5), pt(8, 6)]; },
    draw: function (S, P) {
      var tris = [[pt(-8, -4), pt(-2, -4), pt(-5, 1)], [pt(-1, -4), pt(4, -4), pt(-1, 1)], [pt(4.5, -4), pt(8.5, -4), pt(1.5, -1)]];
      tris.forEach(function (t, i) { wPoly(S, S.base, t, { c: C.cy, w: 2 }); wTag(S, S.base, pt((t[0].x + t[1].x) / 2, -4.6), ["acute", "right", "obtuse"][i], { c: C.mut }); });
    },
    steps: function (P) {
      return [{
        kicker: "Centres of a triangle",
        task: "Where does each centre lie for these triangles?",
        info: ["Inside · on the triangle · outside"],
        fields: P.rows.map(function (r, i) { return { id: "w" + i, type: "choice", label: CENTRES[r[0]] + " of " + TRI_KIND[r[1]] + " triangle", opts: WHERE, small: true }; }),
        action: "Submit",
        hints: ["Centroid and in-centre are ALWAYS inside.", "Right-angled: circumcentre is the mid-point of the hypotenuse; orthocentre is the right-angle vertex.", "Obtuse-angled: circumcentre and orthocentre are outside."],
        judge: function (v) {
          var wrong = [];
          P.rows.forEach(function (r, i) { if (v["w" + i] !== whereAns(r[0], r[1])) wrong.push(CENTRES[r[0]].toLowerCase() + " (" + TRI_KIND[r[1]].replace(/^an? /, "") + ")"); });
          return wrong.length ? bad("Recheck: " + wrong.join(", ") + ".") : OK;
        },
        show: function (S, v, res, done) { wait(250, done); },
        work: ["Centroid, in-centre: always inside.", "Circumcentre: inside (acute), mid-point of hypotenuse (right), outside (obtuse).", "Orthocentre: inside (acute), right-angle vertex (right), outside (obtuse)."],
      }];
    },
  };

  function eulerTri() {
    /* Right-angled at O(0,0), legs on the axes — the JM33(E) textbook shape.
       H = A = (0,0), O = mid of hypotenuse, G = (b/3, c/3). Multiples of 6 → all integers. */
    return loop(function () {
      var b = pick([6, 12]) * sgn(), c = pick([6, 12]) * sgn();
      var swap = Math.random() < 0.5;
      var A = pt(0, 0), B = swap ? pt(0, b) : pt(b, 0), Cc = swap ? pt(c, 0) : pt(0, c);
      if (!allWithin([B, Cc], 11)) return null;
      var O = mid(B, Cc), H = A, G = centroid(A, B, Cc);
      if (same(G, O)) return null;
      return { A: A, B: B, C: Cc, O: O, H: H, G: G, right: A, rightName: "A", hypA: B, hypB: Cc };
    });
  }

  R.euler = {
    topic: "centre", quick: false, title: "One straight line",
    gen: eulerTri,
    pts: function (P) { return [P.A, P.B, P.C, P.O, P.H]; },
    draw: function (S, P) {
      drawStations(S, S.base, P, true);
      wRight(S, S.base, P.right, sub(P.hypA, P.right), sub(P.hypB, P.right), C.gd);
    },
    steps: function (P) {
      var G = P.G, O = P.O, H = P.H, mGO = slope(G, O), mGH = slope(G, H);
      function pin(S, p, c, label) { wPin(S, S.keep, p, c, label); }
      return [{
        kicker: "Final · centroid",
        task: "Find the <b>centroid G</b> of △ABC.",
        info: ["Right-angled at A"],
        fields: [{ id: "p", type: "pt", label: "G" }],
        action: "Lock G", hints: ["G = ((x₁ + x₂ + x₃) ÷ 3, (y₁ + y₂ + y₃) ÷ 3).", "A is the origin, so G = (x_B + x_C, y_B + y_C) ÷ 3."],
        judge: function (v) { return ptJudge(v.p, G, [{ p: add(add(P.A, P.B), P.C), m: "Divide the sums by 3." }, { p: O, m: "That is the circumcentre (mid-point of the hypotenuse). The centroid averages all three vertices." }]); },
        show: function (S, v, res, done) { if (res.ok) pin(S, G, C.gd, "G" + fp(G)); else if (S.inView(pt(v.p.x.v, v.p.y.v))) wPin(S, S.fx, pt(v.p.x.v, v.p.y.v), C.rd, "?"); wait(300, done); },
        work: ["G = ((" + fs(P.A.x) + " + " + par(P.B.x) + " + " + par(P.C.x) + ") ÷ 3, (" + fs(P.A.y) + " + " + par(P.B.y) + " + " + par(P.C.y) + ") ÷ 3) = " + fp(G)],
      }, {
        kicker: "Final · circumcentre",
        task: "Find the <b>circumcentre O</b> of △ABC.",
        info: ["Right-angled at A"],
        fields: [{ id: "p", type: "pt", label: "O" }],
        action: "Lock O",
        hints: ["In a right-angled triangle, the circumcentre is the mid-point of the hypotenuse.", "The hypotenuse is BC, opposite the right angle at A."],
        judge: function (v) { return ptJudge(v.p, O, [{ p: H, m: "That is the orthocentre (the right-angle vertex). The circumcentre is the mid-point of the hypotenuse BC." }, { p: G, m: "That is the centroid. The circumcentre is the mid-point of the hypotenuse BC." }], { generic: function (q) { return "Distances from your point: √" + fs(d2(q, P.A)) + ", √" + fs(d2(q, P.B)) + ", √" + fs(d2(q, P.C)) + ". Not all equal."; } }); },
        show: function (S, v, res, done) { if (res.ok) { pin(S, O, C.pk, "O" + fp(O)); wRing(S, S.keep, O, dist(O, P.A), { c: "rgba(255,124,204,.5)", w: 1.5, grow: 600 }); } else if (S.inView(pt(v.p.x.v, v.p.y.v))) wPin(S, S.fx, pt(v.p.x.v, v.p.y.v), C.rd, "?"); wait(400, done); },
        work: circumWork(P, O),
      }, {
        kicker: "Final · orthocentre",
        task: "Find the <b>orthocentre H</b> of △ABC.",
        info: ["Right-angled at A"],
        fields: [{ id: "p", type: "pt", label: "H" }],
        action: "Lock H",
        hints: ["In a right-angled triangle, the orthocentre is the right-angle vertex.", "The right angle is at A."],
        judge: function (v) { return ptJudge(v.p, H, [{ p: O, m: "That is the circumcentre. In a right-angled triangle the orthocentre is the right-angle vertex A." }, { p: G, m: "That is the centroid. In a right-angled triangle the orthocentre is the right-angle vertex A." }]); },
        show: function (S, v, res, done) { if (res.ok) pin(S, H, C.ok, "H" + fp(H)); else if (S.inView(pt(v.p.x.v, v.p.y.v))) wPin(S, S.fx, pt(v.p.x.v, v.p.y.v), C.rd, "?"); wait(300, done); },
        work: orthoWork(P),
      }, {
        kicker: "Final · one straight line",
        task: "Are G, O and H <b>collinear</b>? Compare slopes.",
        info: null,
        fields: [slopeField("m1", "Slope of GO"), slopeField("m2", "Slope of GH"), { id: "c", type: "choice", label: "G, O, H collinear?", opts: ["Yes", "No"] }],
        action: "Light the way",
        hints: ["Work out the slopes of GO and GH.", "Equal slopes through the shared point G mean the three points are collinear."],
        judge: function (v) {
          var r = numJudge(v.m1, mGO, slopeWrongs(G, O));
          if (!r.ok) return bad("Slope of GO: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          r = numJudge(v.m2, mGH, slopeWrongs(G, H));
          if (!r.ok) return bad("Slope of GH: " + (r.msg || "check Δy ÷ Δx."), r.soft);
          if (v.c !== 0) return bad("Both slopes are " + fs(mGO) + " and G is on both lines, so G, O and H are collinear.");
          return OK;
        },
        show: function (S, v, res, done) {
          var a = S.ray(H, sub(H, O)), b = S.ray(O, sub(O, H));
          wGrow(S, S.fx, a, b, { c: C.gd, w: 4, glow: 1 }, 1000, function () { wait(300, done); });
        },
        work: [slopeShort(G, O, "G", "O"), slopeShort(G, H, "G", "H"), "Equal slopes and G is common, so G, O and H are collinear."],
      }];
    },
  };

  /* ================================================================
   * Story and challenge data
   * ================================================================ */

  var CHAPTERS = [
    { tab: "0 · Grid Room", sub: "reading the map", tutorial: true, rounds: [["read"], ["count"], ["pyth"]] },
    { tab: "1 · Evacuation", sub: "distance formula", rounds: [["hospital"], ["school"], ["three"], ["station"]] },
    { tab: "2 · Tracking", sub: "slope · intercepts · collinear", rounds: [["heading"], ["tracks"], ["landfall", { axis: "x" }], ["lineup", { collinear: true }], ["boatR"]] },
    { tab: "3 · Channel", sub: "parallel · perpendicular", rounds: [["fence"], ["gate"], ["proposals"], ["corner"]] },
    { tab: "4 · Lights", sub: "mid-point · section formula", rounds: [["mid"], ["lostTug"], ["section"], ["sectionAB"], ["shoal"]] },
    { tab: "5 · Mother", sub: "centres of a triangle", rounds: [["which"], ["circum"], ["ortho"], ["centroid"], ["euler"]] },
  ];

  var TOPICS = [
    { id: "dist", name: "Distance", rounds: ["pyth", "hospital", "school", "three", "station"] },
    { id: "slope", name: "Slope & collinear", rounds: ["heading", "tracks", "landfall", "lineup", "boatR"] },
    { id: "para", name: "Parallel & perpendicular", rounds: ["fence", "gate", "proposals", "findp", "corner"] },
    { id: "mid", name: "Mid-point & section", rounds: ["mid", "lostTug", "section", "sectionAB", "shoal", "parallelogram"] },
    { id: "centre", name: "Centres of a triangle", rounds: ["which", "where", "circum", "ortho", "centroid", "centroidInv"] },
  ];

  if (!stage) {
    if (typeof module === "object" && module.exports) module.exports = { R: R, CHAPTERS: CHAPTERS, TOPICS: TOPICS, parseVal: parseVal, fs: fs, rec: function (r) { REC = r; } };
    return;
  }

  var NAMES = { lau: "DR. MIRA LAU", kwok: "COMMANDER KWOK", you: "YOU" };
  var FACE_DEFAULT = { lau: "smile", kwok: "stern", you: "ready" };

  var OPENING = [
    { bg: "op-01-sonar.png", ken: "ken-a", music: "alert", sfx: "ping", lines: ["02:13 a.m. Harbour Watch Centre, Victoria Harbour.", "The sonar has just picked up something enormous."] },
    { bg: "op-02-bo-surface.png", ken: "ken-b", lines: ["Right beside the Star Ferry, a giant creature rises out of the water.", "Its eyes are as big as car tyres. Its back glows blue."] },
    { bg: "op-03-cannon.png", ken: "ken-c", who: "kwok", face: "stern", lines: ["This is Commander Kwok. Load the sonic cannon.", "If that thing moves towards the city, we fire."] },
    { bg: "op-02-bo-surface.png", who: "lau", face: "worried", lines: ["Commander, wait! Look at the size of its fins. That's a baby.", "Babies don't attack cities. Something is wrong."] },
    { bg: "op-03-cannon.png", who: "kwok", face: "angry", lines: ["Then prove it, Dr. Lau. You have until sunrise.", "And every wrong number brings my cannon one charge closer to firing."] },
    { bg: "op-04-gridroom.png", ken: "ken-a", music: "grid", who: "lau", face: "smile", lines: ["You must be the new grid analyst. Welcome to the Grid Room.", "This table is a map of the harbour on a coordinate plane. One square is 100 metres."] },
    { bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: ["I'll read the sonar. You give me numbers. Not guesses: numbers.", "Three wrong numbers in a chapter and Kwok fires a warning shot."] },
    { bg: "op-04-gridroom.png", who: "you", lines: ["Got it. Let's keep it safe."] },
  ];

  var STORY = [
    {
      card: { img: "op-04-gridroom.png", kicker: "Chapter 0", name: "The Grid Room", sub: "reading the map" },
      music: "grid",
      intro: [{ bg: "op-04-gridroom.png", who: "lau", face: "smile", lines: ["A quick warm-up on the map first. Kwok isn't watching yet, so mistakes are free in here."] }],
      between: [
        [{ bg: "op-04-gridroom.png", who: "lau", face: "smile", lines: ["Good. Across first, then up. Never the other way round."] }],
        [{ bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: ["On the same line you can just count squares.", "But Bo is hardly ever on the same line as anything."] }],
      ],
      outro: [
        { bg: "op-04-gridroom.png", who: "lau", face: "wow", lines: ["Pythagoras on a grid: that's the distance formula. You'll need it right now."] },
        { bg: "op-02-bo-surface.png", ken: "ken-c", sfx: "alarm", lines: ["A siren howls across the harbour. Bo has started thrashing its tail."] },
      ],
    },
    {
      card: { img: "ch1-evac.png", kicker: "Chapter 1", name: "Evacuation Ring", sub: "distance formula", alert: true },
      music: "alert",
      intro: [
        { bg: "ch1-evac.png", ken: "ken-b", who: "kwok", face: "stern", lines: ["Its waves will flip anything inside a ring around it.", "I won't evacuate the whole of Tsim Sha Tsui at 2 a.m. Tell me exactly who has to move."] },
        { bg: "ch1-evac.png", who: "lau", face: "focus", lines: ["You have Bo's coordinates and each building's coordinates.", "The distance formula tells you how far apart they are. Compare that with the size of the ring."] },
      ],
      between: [
        [{ bg: "ch1-evac.png", who: "kwok", face: "stern", lines: ["Hospital sorted. The school's numbers are less friendly."] }],
        [{ bg: "ch1-evac.png", who: "lau", face: "focus", lines: ["Three buildings on the same stretch of waterfront. Check every one."] }],
        [{ bg: "ch1-evac.png", who: "kwok", face: "stern", lines: ["Now the lifeboat station. It goes on the seafront, exactly as far from both piers."] },
          { bg: "ch1-evac.png", who: "lau", face: "smile", lines: ["On the seafront means y = 0. Equally far means PS = QS."] }],
      ],
      outro: [
        { bg: "ch1-evac.png", ken: "ken-a", lines: ["The evacuation finishes at 2:40 a.m. Not one person was moved by mistake."] },
        { bg: "op-03-cannon.png", who: "kwok", face: "shock", lines: ["...Fine. Good work, analyst."] },
        { bg: "op-01-sonar.png", ken: "ken-c", sfx: "ping", lines: ["Then the sonar beeps again. Bo is on the move."] },
      ],
    },
    {
      card: { img: "op-01-sonar.png", kicker: "Chapter 2", name: "Track the Tide", sub: "slope · intercepts · collinear points" },
      music: "alert",
      intro: [
        { bg: "op-01-sonar.png", who: "kwok", face: "angry", lines: ["Two sonar fixes, five minutes apart. Where is that thing heading?"] },
        { bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: ["Bo swims in straight lines. The direction of a straight line is its slope:", "rise over run, Δy ÷ Δx."] },
      ],
      between: [
        [{ bg: "op-04-gridroom.png", who: "lau", face: "smile", lines: ["Our patrol boats are out there too. Can you read their tracks at a glance?"] }],
        [{ bg: "op-01-sonar.png", who: "kwok", face: "stern", lines: ["If it keeps this heading, where does it hit the seafront? I need a number."] },
          { bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: ["The seafront is the x-axis. Where a line meets the x-axis is its x-intercept."] }],
        [{ bg: "op-04-gridroom.png", who: "lau", face: "worried", lines: ["Wait. Look at the lightship. Is Bo swimming straight at it?", "If it is, A, B and the lightship will all be on one straight line."] }],
        [{ bg: "ch2-lightship.png", ken: "ken-b", who: "lau", face: "wow", lines: ["It IS. It isn't attacking anything. It's following the light, like a moth to a lamp.", "It's lost."] },
          { bg: "ch2-lightship.png", who: "kwok", face: "stern", lines: ["Lost or not, it's the size of a ferry. Put a rescue boat right on its path."] }],
      ],
      outro: [
        { bg: "ch2-lightship.png", who: "lau", face: "smile", lines: ["If we can't stop it, we guide it. Back out to the open sea."] },
        { bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["Then build me a channel. You have until four o'clock."] },
      ],
    },
    {
      card: { img: "ch3-channel.png", kicker: "Chapter 3", name: "The Sonar Channel", sub: "parallel · perpendicular lines" },
      music: "grid",
      intro: [{ bg: "ch3-channel.png", ken: "ken-a", who: "lau", face: "focus", lines: ["Bo hates sonar. Two rows of sonar fences will make a channel for it to swim through.", "The rows must stay the same width all the way. Same width means parallel. Parallel means equal slopes."] }],
      between: [
        [{ bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["The typhoon shelter entrance is wide open. Block it with a gate, square-on to its path."] },
          { bg: "ch3-channel.png", who: "lau", face: "smile", lines: ["Square-on means perpendicular: m₁ × m₂ = −1."] }],
        [{ bg: "ch3-channel.png", lines: ["The engineers radio in three more fence designs."] },
          { bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["Approve the good ones. Reject the rest."] }],
        [{ bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["Last corner. My engineers swear it's a right angle. Prove it."] }],
      ],
      outro: [
        { bg: "ch3-channel.png", ken: "ken-b", lines: ["Bo slides into the channel... and stops at the far end."] },
        { bg: "ch3-channel.png", who: "lau", face: "worried", lines: ["Out there the water is pitch dark. It's too scared to go on."] },
      ],
    },
    {
      card: { img: "ch4-lights.png", kicker: "Chapter 4", name: "Lights on the Water", sub: "mid-point · section formula" },
      music: "grid",
      intro: [
        { bg: "ch4-lights.png", ken: "ken-a", who: "lau", face: "smile", lines: ["It follows light. So let's give it a path of lights, all the way to Lei Yue Mun."] },
        { bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["My boats only understand coordinates. Every buoy needs exact numbers."] },
      ],
      between: [
        [{ bg: "op-01-sonar.png", sfx: "ping", lines: ["The radio crackles. One of the tugs has lost its GPS."] },
          { bg: "op-03-cannon.png", who: "kwok", face: "angry", lines: ["Tug M says it's exactly halfway between tug A and the lost tug. Find it!"] }],
        [{ bg: "ch4-lights.png", who: "lau", face: "focus", lines: ["Near Bo the lights must be closer together. It's nervous.", "Put the next one so that AP : PB matches my plan."] }],
        [{ bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["My engineer wrote the next plan as AP : AB. Read it carefully."] }],
        [{ bg: "ch4-lights.png", who: "lau", face: "worried", lines: ["There's a shoal on the route, right where it crosses the x-axis.", "Give me the ratio AP : PB and I'll put a warning light there."] }],
      ],
      outro: [
        { bg: "ch4-lights.png", ken: "ken-b", lines: ["Light by light, Bo swims all the way to Lei Yue Mun."] },
        { bg: "ch5-call.png", ken: "ken-a", lines: ["Then it stops, lifts its head and calls out to the open sea."] },
        { bg: "ch5-call.png", sfx: "call", who: "lau", face: "wow", lines: ["Listen...", "Something out there is calling back."] },
      ],
    },
    {
      card: { img: "ch5-call.png", kicker: "Chapter 5", name: "Where the Mother Waits", sub: "centres of a triangle" },
      music: "alert",
      intro: [
        { bg: "ch5-call.png", who: "lau", face: "wow", lines: ["That's its mother! Our three hydrophone stations all heard her."] },
        { bg: "op-04-gridroom.png", who: "lau", face: "focus", lines: ["Tonight every job needs a different centre of the station triangle.", "Let's get them straight before we go."] },
      ],
      between: [
        [{ bg: "ch5-call.png", who: "lau", face: "focus", lines: ["All three stations heard her equally loud. So she's the same distance from all three."] },
          { bg: "op-04-gridroom.png", who: "lau", face: "smile", lines: ["Look at the grid: tonight's triangle is right-angled.", "Circumcentre of a right-angled triangle = mid-point of the hypotenuse. Easy."] }],
        [{ bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["My three rescue boats are at the stations. Each takes the shortest route to the opposite side.", "Where their routes cross, I'll park the medical boat."] },
          { bg: "op-04-gridroom.png", who: "lau", face: "smile", lines: ["Right-angled again. Orthocentre = the right-angle vertex. Don't overthink it."] }],
        [{ bg: "ch5-call.png", lines: ["A breakwater blocks the way out. Bo is too heavy to swim over it."] },
          { bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["Three helicopters will lift it in a triangular sling. Where does the hook go?"] }],
        [{ bg: "op-03-cannon.png", who: "kwok", face: "stern", lines: ["One last check before I stand my cannon down.", "Hook, mother, medical boat. If they're on one straight line, Bo can follow one line of lights to her."] }],
      ],
      outro: [],
    },
  ];

  var ENDING = [
    { bg: "end-01-mother.png", ken: "ken-a", music: "dawn", lines: ["05:58 a.m. The sun rises over Lei Yue Mun.", "And the sea rises with it."] },
    { bg: "end-01-mother.png", who: "lau", face: "wow", lines: ["There she is!"] },
    { bg: "end-02-reunion.png", ken: "ken-b", sfx: "call", lines: ["Bo swims straight along the line of lights, into its mother's side."] },
    { bg: "end-03-badge.png", ken: "ken-c", who: "kwok", face: "proud", lines: ["I was ready to fire tonight. Your numbers stopped me.", "Welcome to Harbour Watch, analyst."] },
    { bg: "end-03-badge.png", who: "lau", face: "smile", lines: ["Not guesses. Numbers. Well done."] },
  ];

  var PRAISE = ["Spot on.", "Locked in.", "Perfect numbers.", "Exactly right.", "Dr. Lau nods.", "Bo likes that."];

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
  var panel = el("div", "hg-panel");
  stage.appendChild(panel);
  var flash = el("div", "hg-flash");
  stage.appendChild(flash);
  var hud = el("div", "hg-hud");
  hud.hidden = true;
  stage.appendChild(hud);

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
    sv("rect", { x: 0, y: 0, width: 1280, height: 720, fill: "#040a16" }, board);
    return sv("g", {}, board);
  }

  /* ---------- the coordinate map ---------- */

  function makeMap(root, pts, o) {
    o = o || {};
    var xs = [0], ys = [0];
    pts.forEach(function (p) { if (p && isFinite(p.x) && isFinite(p.y)) { xs.push(p.x); ys.push(p.y); } });
    var pad = o.pad == null ? 2 : o.pad;
    var x0 = Math.floor(Math.min.apply(null, xs)) - pad, x1 = Math.ceil(Math.max.apply(null, xs)) + pad;
    var y0 = Math.floor(Math.min.apply(null, ys)) - pad, y1 = Math.ceil(Math.max.apply(null, ys)) + pad;
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
    S.k = clamp(u / 46, 0.55, 1.1);

    var cp = sv("clipPath", { id: "hg-clip" }, board.querySelector("defs"));
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, rx: 14 }, cp);
    var g = sv("g", { "clip-path": "url(#hg-clip)" }, root);
    sv("rect", { x: FR.x, y: FR.y, width: FR.w, height: FR.h, fill: "url(#hg-sea)" }, g);
    S.base0 = sv("g", {}, g);

    var step = u >= 34 ? 1 : u >= 20 ? 2 : 5;
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
    txt(root, FR.x + 16, FR.y + FR.h - 14, "1 unit = 100 m", { fill: "#6f8aa3", size: 13, anchor: "start", weight: 600 });
    return S;
  }

  /* ---------- world-space drawing ---------- */

  function wLine(S, layer, a, b, o) {
    o = o || {};
    var A = S.P(a), B = S.P(b);
    return sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: o.c || C.cy, "stroke-width": o.w || 2, "stroke-dasharray": o.dash, "stroke-linecap": o.cap || "round", opacity: o.op, filter: o.glow ? "url(#hg-glow)" : null }, layer);
  }
  function wFence(S, layer, a, b, c) {
    wLine(S, layer, a, b, { c: c, w: 1.2, op: 0.35 });
    return wLine(S, layer, a, b, { c: c, w: 7, dash: "0.5 18", glow: 1 });
  }
  function wDot(S, layer, p, c, r) { var q = S.P(p); return sv("circle", { cx: q.x, cy: q.y, r: r || 4, fill: c || C.cy }, layer); }
  function wPin(S, layer, p, c, label) {
    var q = S.P(p), g = sv("g", { class: "hg-pin" }, layer);
    sv("circle", { cx: q.x, cy: q.y, r: 9, fill: "none", stroke: c, "stroke-width": 2, opacity: 0.6 }, g);
    sv("circle", { cx: q.x, cy: q.y, r: 4.5, fill: c }, g);
    if (label) wTag(S, g, p, label, { c: c, up: 1 });
    return g;
  }
  function wTag(S, layer, p, s, o) {
    o = o || {};
    var q = S.P(p), anchor = o.anchor || "start", dx = 13, dy = o.up ? -Math.round(10 + 10 * S.k) : o.below ? 24 : 6;
    if (o.side) { dx = 12; dy = 5; }
    if (o.below) { anchor = o.anchor || "middle"; dx = 0; }
    if (anchor === "start" && q.x + dx + s.length * 8.5 > FR.x + FR.w - 6) { anchor = "end"; dx = -13; }
    if (q.y + dy < FR.y + 18) dy = 26;
    return txt(layer, q.x + (anchor === "end" ? -Math.abs(dx) : dx), q.y + dy, s, { fill: o.c || C.ink, size: o.size || 15, anchor: anchor });
  }
  function wBadge(S, layer, p, s, c) {
    var q = S.P(p), w = s.length * 8.6 + 16, g = sv("g", { class: "hg-pop" }, layer);
    sv("rect", { x: q.x - w / 2, y: q.y + 16, width: w, height: 22, rx: 6, fill: "rgba(4,10,22,.85)", stroke: c, "stroke-width": 1.5 }, g);
    txt(g, q.x, q.y + 32, s, { fill: c, size: 13, weight: 800, cls: "nohalo" });
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
    return sv("path", { d: d, fill: o.fill || "none", stroke: o.c || C.cy, "stroke-width": o.w || 2, "stroke-linejoin": "round" }, layer);
  }
  function wGrow(S, layer, a, b, o, dur, done) {
    var A = S.P(a), B = S.P(b), l = wLine(S, layer, a, a, o);
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
      sv("rect", { x: -11, y: -18, width: 22, height: 22, rx: 2, fill: "#203654", stroke: "#8fb8de", "stroke-width": 1.2 }, b);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) sv("rect", { x: -8 + c * 6, y: -15 + r * 6, width: 3.5, height: 3.5, fill: "#ffd98a", opacity: (r + c) % 2 ? 0.95 : 0.5 }, b);
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
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    audio.master = ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.85;
    audio.master.connect(comp);
    audio.music = ctx.createGain();
    audio.music.gain.value = 0;
    audio.music.connect(audio.master);
    audio.sfx = ctx.createGain();
    audio.sfx.gain.value = 0.9;
    audio.sfx.connect(audio.master);
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
      bpm: 84, swing: 0.5, bars: 4, vol: 0.45,
      roots: [45, 41, 43, 40],
      chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[(i * 3) % 4] + 12), e * 2.2, { type: "sine", gain: 0.035, lp: 2600 });
        if (i === 0) { tone(t, mtof(this.roots[bar] - 12), e * 7, { type: "triangle", gain: 0.16, lp: 600, a: 0.05 }); ch.forEach(function (m) { tone(t, mtof(m), e * 8, { type: "sine", gain: 0.016, a: 0.5 }); }); }
        if (i === 4) tone(t, mtof(this.roots[bar]), e * 3, { type: "triangle", gain: 0.08, lp: 700 });
        if (i % 2 === 0) noise(t, 0.04, { f: 8000, gain: 0.012 });
        if (bar === 0 && i === 6) tone(t, 1480, 0.9, { type: "sine", gain: 0.02, to: 1400 });
      },
    },
    alert: {
      bpm: 118, swing: 0.5, bars: 4, vol: 0.42,
      roots: [33, 33, 29, 31],
      play: function (t, i, bar, e) {
        var r = this.roots[bar];
        tone(t, mtof(r), e * 0.9, { type: "sawtooth", gain: i === 0 ? 0.14 : 0.075, lp: i % 2 ? 420 : 620 });
        noise(t, 0.03, { f: 9000, gain: 0.024 });
        if (i === 0) {
          tone(t, 90, 0.35, { to: 45, gain: 0.3 });
          tone(t, mtof(r + 36), e * 8, { type: "sawtooth", gain: 0.014, lp: 1400, a: 0.4 });
        }
        if (i === 4) noise(t, 0.12, { ft: "bandpass", f: 1500, gain: 0.045 });
        if (bar === 3 && i === 6) tone(t, 1480, 0.7, { type: "sine", gain: 0.03, to: 1380 });
      },
    },
    dawn: {
      bpm: 96, swing: 0.5, bars: 4, vol: 0.45,
      chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]],
      roots: [38, 35, 31, 33],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[i % 4] + (i >= 4 ? 12 : 0)), e * 1.6, { type: "triangle", gain: 0.05 });
        if (i % 2 === 0) tone(t, mtof(this.roots[bar]), e * 1.8, { type: "sine", gain: 0.17 });
        if (i === 0) ch.forEach(function (m) { tone(t, mtof(m - 12), e * 8, { type: "sine", gain: 0.02, a: 0.3 }); });
        noise(t, 0.04, { f: 8000, gain: 0.016 });
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
    click: function () { if (sfxOn()) tone(audio.ctx.currentTime, 660, 0.06, { type: "triangle", gain: 0.05, out: audio.sfx }); },
    blip: function () { if (sfxOn()) tone(audio.ctx.currentTime, 1250 + Math.random() * 200, 0.025, { type: "square", gain: 0.008, lp: 3000, out: audio.sfx }); },
    ping: function () { if (sfxOn()) { var t = audio.ctx.currentTime; tone(t, 1480, 1.2, { type: "sine", gain: 0.08, to: 1400, out: audio.sfx }); tone(t + 0.45, 1480, 0.8, { type: "sine", gain: 0.025, to: 1420, out: audio.sfx }); } },
    alarm: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      for (var j = 0; j < 4; j++) tone(t + j * 0.16, j % 2 ? 620 : 880, 0.15, { type: "square", gain: 0.04, lp: 2600, out: audio.sfx });
    },
    cannon: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      tone(t, 120, 0.9, { to: 30, gain: 0.5, out: audio.sfx });
      noise(t, 1.1, { ft: "lowpass", f: 1800, fto: 120, gain: 0.35, out: audio.sfx });
    },
    win: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      [74, 78, 81, 86].forEach(function (m, j) { tone(t + j * 0.09, mtof(m), 0.5, { type: "triangle", gain: 0.07, out: audio.sfx }); });
    },
    drop: function () { if (sfxOn()) { var t = audio.ctx.currentTime; tone(t, 900, 0.18, { to: 260, gain: 0.06, out: audio.sfx }); noise(t + 0.05, 0.25, { ft: "bandpass", f: 900, gain: 0.05, out: audio.sfx }); } },
    splash: function () { if (sfxOn()) noise(audio.ctx.currentTime, 0.6, { ft: "bandpass", f: 700, fto: 2400, gain: 0.12, q: 0.6, out: audio.sfx }); },
    whoosh: function () { if (sfxOn()) noise(audio.ctx.currentTime, 0.9, { ft: "bandpass", f: 400, fto: 3000, gain: 0.1, q: 0.7, out: audio.sfx }); },
    call: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      tone(t, 280, 1.4, { type: "sine", to: 520, gain: 0.12, a: 0.3, out: audio.sfx });
      tone(t + 1.3, 520, 1.6, { type: "sine", to: 240, gain: 0.1, a: 0.2, out: audio.sfx });
      tone(t, 282, 1.4, { type: "triangle", to: 524, gain: 0.03, a: 0.3, out: audio.sfx });
    },
  };

  function setMuted(m) {
    audio.muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
    if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : 0.85, audio.ctx.currentTime, 0.05);
    Array.prototype.forEach.call(stage.querySelectorAll(".snd"), function (b) { b.textContent = m ? "Sound off" : "Sound on"; });
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
    var lab = "<span>" + f.label + (f.sub ? "<small>" + f.sub + "</small>" : "") + "</span>";
    var inp = function (id, ph) { return '<input data-f="' + id + '" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="' + (ph || "") + '">'; };
    if (f.type === "pt") return '<div class="hg-field pt">' + lab + '<div class="hg-pair"><b>(</b>' + inp(f.id + "_x", "x") + "<b>,</b>" + inp(f.id + "_y", "y") + "<b>)</b></div></div>";
    if (f.type === "ratio") return '<div class="hg-field pt">' + lab + '<div class="hg-pair">' + inp(f.id + "_r") + "<b>:</b>" + inp(f.id + "_s") + "</div></div>";
    if (f.type === "choice") return '<div class="hg-field choice' + (f.small ? " small" : "") + '">' + lab + '<div class="hg-opts" data-c="' + f.id + '">' +
      f.opts.map(function (o, i) { return '<button type="button" data-i="' + i + '">' + o + "</button>"; }).join("") + "</div></div>";
    return '<div class="hg-field num">' + lab + '<div class="hg-one">' + inp(f.id, f.ph) + (f.undef ? '<button type="button" class="hg-undef" data-for="' + f.id + '">undefined</button>' : "") + (f.unit ? "<em>" + f.unit + "</em>" : "") + "</div></div>";
  }

  function buildPanel(o) {
    var givens = slimGivens(o.info);
    panel.innerHTML =
      '<div class="hg-top"><div class="hg-kicker">' + o.kicker + "</div>" + (o.meter != null ? '<div class="hg-meter"></div>' : "") + "</div>" +
      "<h3>" + o.title + "</h3>" +
      '<p class="hg-task">' + o.task + "</p>" +
      (givens ? '<p class="hg-givens">' + givens.join('<span class="hg-dot">·</span>') + "</p>" : "") +
      '<div class="hg-fields">' + o.fields.map(fieldHTML).join("") + "</div>" +
      '<div class="hg-actions"><button type="button" class="hg-btn go">' + o.action + "</button></div>" +
      '<div class="hg-say"></div>' +
      '<ol class="hg-hints" hidden></ol>' +
      '<div class="hg-after"><button type="button" class="hg-btn ghost hint">Hint</button>' +
      '<button type="button" class="hg-btn ghost snd">' + (audio.muted ? "Sound off" : "Sound on") + "</button>" +
      '<button type="button" class="hg-btn next" hidden>Next ▸</button></div>';

    var go = panel.querySelector(".go"), say = panel.querySelector(".hg-say"), hintList = panel.querySelector(".hg-hints");
    var hintBtn = panel.querySelector(".hint"), next = panel.querySelector(".next"), meterEl = panel.querySelector(".hg-meter");
    var hints = o.hints || [], shown = 0, choice = {}, locked = false;

    function hintLabel() { hintBtn.textContent = shown < hints.length ? "Hint " + (shown + 1) + "/" + hints.length : "No more hints"; hintBtn.disabled = shown >= hints.length; }
    hintLabel();
    hintBtn.addEventListener("click", function () {
      if (shown >= hints.length) return;
      hintList.appendChild(el("li", null, hints[shown++]));
      hintList.hidden = false;
      hintLabel();
      SFX.click();
    });
    panel.querySelector(".snd").addEventListener("click", function () { ensureAudio(); setMuted(!audio.muted); });
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
            if (choice[f.id] < 0) err = "Choose an option for “" + f.label + "”.";
            return;
          }
          var parts = f.type === "pt" ? ["x", "y"] : f.type === "ratio" ? ["r", "s"] : [null];
          var obj = {};
          parts.forEach(function (p) {
            if (err) return;
            var id = p ? f.id + "_" + p : f.id, s = raw(id), v = parseVal(s);
            if (v.empty) err = "Fill in " + f.label + (p && f.type === "pt" ? " (" + p + ")" : "") + ".";
            else if (v.comma) err = "Type one number in each box (no commas).";
            else if (isNaN(v.v)) err = f.label + ": “" + s + "” is not a number I can read. Fractions like −3/4 and surds like 2√5 are fine.";
            else if (v.undef && !f.undef) err = f.label + " must be a number.";
            v.raw = s;
            if (p) obj[p] = v; else obj = v;
          });
          out[f.id] = obj;
        });
        return { vals: out, err: err };
      },
      say: function (msg, kind) { say.className = "hg-say " + (kind || ""); say.innerHTML = msg; },
      lock: function (b) {
        locked = b;
        go.disabled = b;
        Array.prototype.forEach.call(panel.querySelectorAll("input, .hg-undef"), function (i) { i.disabled = b; });
      },
      meter: function (n, max, label) {
        if (!meterEl) return;
        var h = '<span>' + (label || "Cannon") + "</span>";
        for (var i = 0; i < max; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>';
        meterEl.innerHTML = h;
        meterEl.classList.toggle("hot", n >= max - 1 && n > 0);
      },
      done: function (label) { next.textContent = label; next.hidden = false; locked = true; Array.prototype.forEach.call(panel.querySelectorAll(".hg-opts button"), function (b) { b.disabled = true; }); },
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
    var root = freshBoard();
    var S = makeMap(root, spec.pts(P));
    spec.draw(S, P);
    var steps = spec.steps(P), si = 0;
    var myGen = gen;
    if (TEST) window.__hg = { spec: spec, P: P, S: S, steps: steps };
    openStep();

    function openStep() {
      var st = steps[si], m = ctx.meter ? ctx.meter() : null;
      if (TEST) window.__hg.si = si;
      S.step.innerHTML = "";
      S.fx.innerHTML = "";
      if (st.draw) st.draw(S);
      var api = buildPanel({
        kicker: ctx.kicker + (steps.length > 1 ? " · Step " + (si + 1) + "/" + steps.length : ""),
        title: st.title || spec.title, task: st.task, info: st.info, fields: st.fields, action: st.action, hints: st.hints,
        meter: m ? m[0] : null,
      });
      if (m) api.meter(m[0], m[1], m[2]);
      api.focus();
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
            var head = pick(PRAISE) + (res.exact || (r.vals && anyExact(r.vals)) ? " Exact surd." : "");
            var work = st.work ? '<details class="hg-workbox"><summary>Working</summary><ul class="hg-work">' + st.work.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></details>" : "";
            api.say("<b>" + head + "</b>" + work, "good");
            var last = si + 1 >= steps.length;
            if (last && ctx.onWin) ctx.onWin();
            api.done(last ? ctx.nextLabel || "Next ▸" : "Next step ▸");
            api.onNext(function () { if (!last) { si++; openStep(); } else ctx.onDone(); });
            if (last && ctx.auto) wait(ctx.auto, function () { ctx.onDone(); });
          } else {
            var msg = res.msg || "Not quite. Check your working, or open a hint.";
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
    '<div class="hgc-tools"><button type="button" class="hgc-tool skip" hidden>Skip ▸▸</button><button type="button" class="hgc-tool snd"></button></div>');
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
  cine.querySelector(".snd").textContent = audio.muted ? "Sound off" : "Sound on";

  var talking = null, cineGen = 0;
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
    hud.hidden = true;
    cine.hidden = false;
    dialog.classList.remove("on");
    cCard.classList.remove("on");
    cTitle.hidden = true;
    skipBtn.hidden = true;
  }

  function talk(beats, done) {
    if (!beats || !beats.length) { done(); return; }
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
      showLine();
    }
    function showLine() {
      var b = beats[bi], who = b.who || null;
      dialog.className = "hgc-dialog on" + (who ? " who-" + who : " narration");
      if (who) {
        dFace.hidden = false;
        dFaceImg.src = ART + who + "-" + (b.face || FACE_DEFAULT[who]) + ".png";
        dName.textContent = NAMES[who];
      } else dFace.hidden = true;
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

  function showCard(i, done) {
    var c = STORY[i].card;
    setBg(c.img, "ken-a");
    setBed(STORY[i].music);
    SFX.whoosh();
    cCard.className = "hgc-card" + (c.alert ? " alert" : "");
    cCard.querySelector("p").textContent = c.kicker;
    cCard.querySelector(".hgc-card-h").textContent = c.name;
    cCard.querySelector("span").textContent = c.sub;
    requestAnimationFrame(function () { cCard.classList.add("on"); });
    var ended = false, api = { advance: end, skip: end };
    talking = api;
    skipBtn.hidden = false;
    cineLater(3000, end);
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
      '<p class="hgc-kicker">' + o.kicker + "</p>" +
      '<div class="hgc-h">' + o.h + "</div>" +
      '<p class="hgc-sub">' + o.sub + "</p>" +
      (o.extra || "") +
      '<div class="hgc-btns">' + o.buttons.map(function (b, i) { return '<button type="button" class="hgc-go' + (b.ghost ? " ghost" : "") + '" data-b="' + i + '">' + b.label + "</button>"; }).join("") + "</div>";
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
  var DONE_KEY = "jm33-hg-done", BEST_KEY = "jm33-hg-best", TOPIC_KEY = "jm33-hg-topics";
  var done = load(DONE_KEY, []), best = load(BEST_KEY, { night: 0, sprint: 0 });
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var tabBtns = [], challengeTab = null, cannon = 0, sprintTimer = null;
  var CANNON_MAX = 3;

  function markTabs(on) {
    tabBtns.forEach(function (b, j) { b.classList.toggle("on", j === on); b.classList.toggle("done", done.indexOf(j) >= 0); });
    if (challengeTab) challengeTab.classList.toggle("on", on === "ch");
  }

  function stopSprint() { if (sprintTimer) { clearInterval(sprintTimer); sprintTimer = null; } }

  function showTitle() {
    stopSprint();
    openCine();
    markTabs(-1);
    setBg("hg-title.png");
    setBed("grid");
    showTitleScreen({
      kicker: "JM33 · Coordinates of Straight Lines",
      h: "Harbour<span>Grid</span>",
      sub: "2 a.m. A lost baby sea creature is loose in Victoria Harbour, and a sonic cannon is aimed at it. Guide it home before sunrise, one coordinate at a time.",
      buttons: [
        { label: "Story mode ▸", on: function () { cTitle.hidden = true; talk(OPENING, function () { playChapter(0); }); } },
        { label: "Challenge mode ▸", ghost: true, on: showChallengeMenu },
      ],
    });
  }

  function playChapter(i) {
    stopSprint();
    openCine();
    cannon = 0;
    markTabs(i);
    showCard(i, function () { talk(STORY[i].intro, function () { openStoryRound(i, 0); }); });
  }

  function chapterDone(i) {
    if (done.indexOf(i) < 0) { done.push(i); save(DONE_KEY, done); }
    openCine();
    markTabs(i);
    talk(STORY[i].outro, function () {
      if (i + 1 < STORY.length) { playChapter(i + 1); return; }
      talk(ENDING, showEnd);
    });
  }

  function showEnd() {
    markTabs(-1);
    showTitleScreen({
      cls: "bottom",
      kicker: "06:04 a.m. · Harbour safe",
      h: "Bo is<span>Home</span>",
      sub: "Distance, slope, intercepts, parallel and perpendicular lines, mid-points, sections and the centres of a triangle: every number counted.",
      buttons: [
        { label: "Replay story ▸", on: function () { playChapter(0); } },
        { label: "Challenge mode ▸", ghost: true, on: showChallengeMenu },
      ],
    });
  }

  function openStoryRound(i, r) {
    var ch = CHAPTERS[i], item = ch.rounds[r], spec = R[item[0]], last = r + 1 === ch.rounds.length;
    markTabs(i);
    var P = spec.gen(item[1] || {});
    runRound(spec, P, {
      kicker: "Chapter " + i + " · Round " + (r + 1) + "/" + ch.rounds.length,
      nextLabel: last ? (i + 1 < CHAPTERS.length ? "Finish chapter ▸" : "Sunrise ▸") : "Next round ▸",
      meter: ch.tutorial ? null : function () { return [cannon, CANNON_MAX, "Sonic cannon"]; },
      onWrong: function (api) {
        if (ch.tutorial) return false;
        cannon++;
        if (cannon < CANNON_MAX) return false;
        api.meter(cannon, CANNON_MAX, "Sonic cannon");
        wait(900, function () {
          SFX.cannon();
          flashRed();
          stage.classList.add("hg-shake");
          setTimeout(function () { stage.classList.remove("hg-shake"); }, 700);
          api.say("<b>BOOM.</b> Commander Kwok fires a warning shot over the water. Bo dives in fright.<br>The cannon recharges, and the sonar gives you fresh numbers…", "bad");
          wait(3200, function () { cannon = 0; openStoryRound(i, r); });
        });
        return true;
      },
      onDone: function () {
        if (last) { chapterDone(i); return; }
        var beats = (STORY[i].between || [])[r];
        if (!beats || !beats.length) { openStoryRound(i, r + 1); return; }
        openCine();
        markTabs(i);
        talk(beats, function () { openStoryRound(i, r + 1); });
      },
    });
  }

  /* ================================================================
   * Challenge mode
   * ================================================================ */

  var topicsOn = load(TOPIC_KEY, TOPICS.map(function (t) { return t.id; }));
  var CH = null;

  function showChallengeMenu() {
    stopSprint();
    openCine();
    markTabs("ch");
    setBg("op-04-gridroom.png", "ken-b");
    setBed("alert");
    var chips = TOPICS.map(function (t) { return '<button type="button" class="hgc-chip' + (topicsOn.indexOf(t.id) >= 0 ? " on" : "") + '" data-t="' + t.id + '">' + t.name + "</button>"; }).join("");
    showTitleScreen({
      cls: "menu",
      kicker: "Challenge mode · random numbers every time",
      h: "Night<span>Shift</span>",
      sub: "Pick the topics your class has covered, then choose a challenge.",
      extra: '<div class="hgc-chips">' + chips + '</div><p class="hgc-best">Best · Night Shift <b>' + best.night + "</b> rounds · Sonar Sprint <b>" + best.sprint + "</b> points</p>",
      buttons: [
        { label: "Night Shift ▸<small>endless · 3 cannon charges</small>", on: function () { startChallenge("night"); } },
        { label: "Sonar Sprint ▸<small>2 minutes · −8 s per miss</small>", on: function () { startChallenge("sprint"); } },
        { label: "← Title", ghost: true, on: showTitle },
      ],
      after: function (box) {
        Array.prototype.forEach.call(box.querySelectorAll(".hgc-chip"), function (c) {
          c.addEventListener("click", function () {
            var id = c.getAttribute("data-t"), k = topicsOn.indexOf(id);
            if (k >= 0) { if (topicsOn.length === 1) return; topicsOn.splice(k, 1); } else topicsOn.push(id);
            c.classList.toggle("on", topicsOn.indexOf(id) >= 0);
            save(TOPIC_KEY, topicsOn);
            SFX.click();
          });
        });
      },
    });
  }

  function startChallenge(mode) {
    var pool = [];
    TOPICS.forEach(function (t) { if (topicsOn.indexOf(t.id) >= 0) t.rounds.forEach(function (id) { if (mode !== "sprint" || R[id].quick) pool.push(id); }); });
    CH = { mode: mode, pool: pool, round: 0, score: 0, strikes: 0, time: 120, last: "" };
    setBed(mode === "sprint" ? "alert" : "grid");
    if (mode === "sprint") {
      stopSprint();
      sprintTimer = setInterval(function () {
        if (!CH || CH.mode !== "sprint" || !stageVisible()) return;
        CH.time -= 0.25;
        drawHud();
        if (CH.time <= 0) endChallenge();
      }, 250);
    }
    nextChallengeRound();
  }

  function drawHud() {
    if (!CH) { hud.hidden = true; return; }
    hud.hidden = false;
    if (CH.mode === "sprint") {
      var t = Math.max(0, Math.ceil(CH.time)), s = t % 60;
      hud.innerHTML = "<span>Sonar Sprint</span><b class='" + (t <= 15 ? "hot" : "") + "'>" + Math.floor(t / 60) + ":" + (s < 10 ? "0" : "") + s + "</b><span>Score " + CH.score + "</span>";
    } else hud.innerHTML = "<span>Night Shift</span><b>Round " + (CH.round) + "</b><span>Score " + CH.score + "</span>";
  }

  function nextChallengeRound() {
    if (!CH) return;
    var id;
    do { id = pick(CH.pool); } while (CH.pool.length > 1 && id === CH.last);
    CH.last = id;
    CH.round++;
    var spec = R[id];
    runRound(spec, spec.gen({}), {
      kicker: CH.mode === "sprint" ? "Sonar Sprint" : "Night Shift · Round " + CH.round,
      nextLabel: "Next round ▸",
      auto: CH.mode === "sprint" ? 1400 : 0,
      meter: CH.mode === "night" ? function () { return [CH.strikes, CANNON_MAX, "Sonic cannon"]; } : null,
      onWin: function () { CH.score++; drawHud(); },
      onWrong: function () {
        if (CH.mode === "sprint") { CH.time -= 8; drawHud(); return false; }
        CH.strikes++;
        if (CH.strikes >= CANNON_MAX) { wait(1600, function () { SFX.cannon(); flashRed(); endChallenge(); }); return true; }
        return false;
      },
      onDone: nextChallengeRound,
    });
    drawHud();
  }

  function endChallenge() {
    if (!CH) return;
    stopSprint();
    var mode = CH.mode, score = CH.score, key = mode === "sprint" ? "sprint" : "night";
    var isBest = score > best[key];
    if (isBest) { best[key] = score; save(BEST_KEY, best); }
    CH = null;
    openCine();
    markTabs("ch");
    setBg("ch5-call.png", "ken-a");
    showTitleScreen({
      cls: "bottom",
      kicker: mode === "sprint" ? "Time's up" : "Kwok fired the cannon",
      h: "Score<span>" + score + "</span>",
      sub: (isBest ? "New best! " : "Best: " + best[key] + ". ") + (mode === "sprint" ? "Correct rounds in two minutes." : "Rounds cleared before three wrong answers."),
      buttons: [
        { label: "Play again ▸", on: function () { startChallenge(mode); } },
        { label: "Challenge menu", ghost: true, on: showChallengeMenu },
      ],
    });
  }

  /* ================================================================
   * Wiring
   * ================================================================ */

  if (tabsEl) {
    CHAPTERS.forEach(function (ch, i) {
      var b = el("button", "hg-tab", ch.tab + "<small>" + ch.sub + "</small>");
      b.type = "button";
      b.addEventListener("click", function () { ensureAudio(); CH = null; playChapter(i); });
      tabsEl.appendChild(b);
      tabBtns.push(b);
    });
    challengeTab = el("button", "hg-tab ch", "★ Challenge<small>random rounds</small>");
    challengeTab.type = "button";
    challengeTab.addEventListener("click", function () { ensureAudio(); CH = null; showChallengeMenu(); });
    tabsEl.appendChild(challengeTab);
  }

  skipBtn.addEventListener("click", function (e) { e.stopPropagation(); if (talking) talking.skip(); });
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

  ["hg-title.png", "op-01-sonar.png", "op-02-bo-surface.png", "op-03-cannon.png", "op-04-gridroom.png", "lau-smile.png", "kwok-stern.png"].forEach(function (n) { new Image().src = ART + n; });
  markTabs(-1);
  showTitle();
  if (TEST) window.__hgApi = {
    R: R, playChapter: playChapter, openStoryRound: openStoryRound, startChallenge: startChallenge, showChallengeMenu: showChallengeMenu, showEnd: function () { openCine(); setBg("end-03-badge.png"); showEnd(); },
    rec: function (r) { REC = r; },
    play: function (id, o) { runRound(R[id], R[id].gen(o || {}), { kicker: "Test", meter: function () { return [1, CANNON_MAX, "Sonic cannon"]; }, onDone: function () {} }); },
  };
})();
