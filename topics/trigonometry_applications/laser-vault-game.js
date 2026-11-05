/* JM35 Laser Vault — trigonometry heist.
 * Story: opening → simulator → lobby (tan) → gallery (sin/cos, beam power) → mirror hall (two triangles)
 * → vault (timed) → ending. Challenge: Speed Crack (2 min) and Clean Run (endless, 3 EMPs).
 * Every room is drawn to scale in SVG; the player's answer is fired as a real beam.
 */
(function () {
  "use strict";

  var stage = document.getElementById("lv-stage");
  if (!stage) return;

  var ART = "game/";
  var V = "?v=20261011-lv1";
  var NS = "http://www.w3.org/2000/svg";
  var DEG = Math.PI / 180;
  var KEY_UNLOCK = "laser-vault-unlocked";
  var KEY_BEST = "laser-vault-best";
  var KEY_MUTE = "laser-vault-muted";
  var EMP_MAX = 3;
  var SPEED_TIME = 120;
  var SPEED_PENALTY = 8;

  /* ================================================================
   * Maths helpers
   * ================================================================ */

  function sind(x) { return Math.sin(x * DEG); }
  function cosd(x) { return Math.cos(x * DEG); }
  function tand(x) { return Math.tan(x * DEG); }
  function atand(r) { return Math.atan(r) / DEG; }
  function asind(r) { return Math.asin(Math.max(-1, Math.min(1, r))) / DEG; }
  function acosd(r) { return Math.acos(Math.max(-1, Math.min(1, r))) / DEG; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(x) { return (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, ""); }
  function dp1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rand1(a, b) { return Math.round((a + Math.random() * (b - a)) * 10) / 10; }
  function randLen(a, b) { return Math.random() < 0.55 ? randInt(Math.ceil(a), Math.floor(b)) : rand1(a, b); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function solveTri(p) {
    var a = p.a, b = p.b, L = p.L, th = p.th;
    if (a != null && b != null) { L = Math.sqrt(a * a + b * b); th = atand(b / a); }
    else if (a != null && th != null) { b = a * tand(th); L = a / cosd(th); }
    else if (b != null && th != null) { a = b / tand(th); L = b / sind(th); }
    else if (L != null && th != null) { a = L * cosd(th); b = L * sind(th); }
    else if (L != null && b != null) { th = asind(b / L); a = Math.sqrt(L * L - b * b); }
    else if (L != null && a != null) { th = acosd(a / L); b = Math.sqrt(L * L - a * a); }
    return { a: a, b: b, L: L, th: th };
  }

  /* Reads "32.5", "6√3", "6sqrt3", "10/√3", "5√3/2", "(4+3)/sin…" is not allowed: numbers, √, ( ), × ÷ + − only. */
  function parseAnswer(raw) {
    var s = String(raw == null ? "" : raw).toLowerCase()
      .replace(/\s+/g, "")
      .replace(/sqrt|root/g, "√")
      .replace(/[×x*]/g, "*")
      .replace(/÷/g, "/")
      .replace(/[−–]/g, "-")
      .replace(/,/g, ".")
      .replace(/[°º]|deg|m$/g, "");
    if (!s) return null;
    var i = 0;
    function peek() { return s.charAt(i); }
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "-") {
        var op = s.charAt(i++);
        var w = term();
        v = op === "+" ? v + w : v - w;
      }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var c = peek();
        if (c === "*" || c === "/") {
          i++;
          var w = unary();
          v = c === "*" ? v * w : v / w;
        } else if (c === "√" || c === "(" || (/[0-9.]/.test(c) && s.charAt(i - 1) === ")")) {
          v *= unary();
        } else {
          return v;
        }
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
      if (i !== s.length || !isFinite(v)) return null;
      return { value: v, exact: s.indexOf("√") >= 0 };
    } catch (e) {
      return null;
    }
  }

  function closeEnough(v, ans, kind) {
    if (kind === "angle") return Math.abs(v - ans) <= 0.16;
    return Math.abs(v - ans) <= Math.max(0.06, Math.abs(ans) * 0.007);
  }

  function nearWrong(v, w) {
    return isFinite(w) && Math.abs(v - w) <= Math.max(0.12, Math.abs(w) * 0.015);
  }

  /* ================================================================
   * Room types
   * ================================================================ */

  var MSG = {
    rad: "Your calculator is in RAD mode! Switch it to DEG, then try again.",
    swap: "That's the other angle of the triangle. Opposite and adjacent got swapped: the opposite side is the one facing θ.",
    ratio: function (f) { return "That's the value of " + f + " θ, not the angle. Press " + f + "⁻¹ (SHIFT " + f + ") to turn it into θ."; },
    fn: function (used, want, why) { return "You used " + used + ", but " + why + ". This one needs " + want + "."; },
    flip: function (how) { return "Right ratio, wrong way round. You need to " + how + "."; },
  };

  var SIDE_RULE = "Seen from θ: the opposite side faces θ, the adjacent side touches θ, the hypotenuse is the beam. Then pick SOH, CAH or TOA.";

  var TRI = {
    "tan-angle": {
      know: ["a", "b"], ask: "th", title: "Aim the turret",
      task: "Turn the turret so the beam hits the sensor. Find the angle <b>θ</b>.",
      rule: "tan θ = opposite ÷ adjacent, so θ = tan⁻¹(opp ÷ adj).",
      sub: function (r) { return "θ = tan⁻¹(" + num(r.b) + " ÷ " + num(r.a) + ")"; },
      wrongs: function (r) {
        var w = [
          { v: atand(r.a / r.b), m: MSG.swap },
          { v: Math.atan(r.b / r.a), m: MSG.rad },
          { v: r.b / r.a, m: MSG.ratio("tan") },
        ];
        if (r.b < r.a) {
          w.push({ v: asind(r.b / r.a), m: MSG.fn("sin⁻¹", "tan⁻¹", "we know the opposite and adjacent sides, not the hypotenuse") });
          w.push({ v: acosd(r.b / r.a), m: MSG.fn("cos⁻¹", "tan⁻¹", "we know the opposite and adjacent sides, not the hypotenuse") });
        }
        return w;
      },
    },
    "tan-opp": {
      know: ["a", "th"], ask: "b", title: "Place the sensor",
      task: "The turret is locked at its angle. Slide the sensor along the rail to where the beam will hit. Find <b>d</b>.",
      rule: "tan θ = opp ÷ adj, so opposite = adjacent × tan θ.",
      sub: function (r) { return "d = " + num(r.a) + " × tan " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.a / tand(r.th), m: MSG.flip("multiply: opposite = adjacent × tan θ") },
          { v: r.a * sind(r.th), m: MSG.fn("sin", "tan", "sin needs the hypotenuse, and we only know the adjacent side") },
          { v: r.a * cosd(r.th), m: MSG.fn("cos", "tan", "cos links adjacent and hypotenuse, and we want the opposite") },
          { v: r.a * Math.tan(r.th), m: MSG.rad },
        ];
      },
    },
    "tan-adj": {
      know: ["b", "th"], ask: "a", title: "Place the sensor",
      task: "The turret is locked at its angle. Slide the sensor along the rail to where the beam will hit. Find <b>d</b>.",
      rule: "tan θ = opp ÷ adj, so adjacent = opposite ÷ tan θ.",
      sub: function (r) { return "d = " + num(r.b) + " ÷ tan " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.b * tand(r.th), m: MSG.flip("divide: adjacent = opposite ÷ tan θ") },
          { v: r.b / sind(r.th), m: "That's the beam length (the hypotenuse). The sensor sits on the rail, so you need the adjacent side." },
          { v: r.b * cosd(r.th), m: MSG.fn("cos", "tan", "we know the opposite side, not the hypotenuse") },
          { v: r.b / Math.tan(r.th), m: MSG.rad },
        ];
      },
    },
    "cos-hyp": {
      know: ["a", "th"], ask: "L", title: "Set the beam power",
      task: "Power is the length of the beam. Set it so the beam stops exactly on the sensor.",
      rule: "cos θ = adj ÷ hyp, so hypotenuse = adjacent ÷ cos θ.",
      sub: function (r) { return "power = " + num(r.a) + " ÷ cos " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.a * cosd(r.th), m: MSG.flip("divide: hypotenuse = adjacent ÷ cos θ. The beam must be longer than " + num(r.a) + " m") },
          { v: r.a / sind(r.th), m: MSG.fn("sin", "cos", "the known side touches θ, so it is the adjacent") },
          { v: r.a * tand(r.th), m: "That's the opposite side, not the beam length." },
          { v: r.a / Math.cos(r.th), m: MSG.rad },
        ];
      },
    },
    "sin-hyp": {
      know: ["b", "th"], ask: "L", title: "Set the beam power",
      task: "Power is the length of the beam. Set it so the beam stops exactly on the sensor.",
      rule: "sin θ = opp ÷ hyp, so hypotenuse = opposite ÷ sin θ.",
      sub: function (r) { return "power = " + num(r.b) + " ÷ sin " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.b * sind(r.th), m: MSG.flip("divide: hypotenuse = opposite ÷ sin θ. The beam must be longer than " + num(r.b) + " m") },
          { v: r.b / cosd(r.th), m: MSG.fn("cos", "sin", "the known side faces θ, so it is the opposite") },
          { v: r.b / tand(r.th), m: "That's the adjacent side, not the beam length." },
          { v: r.b / Math.sin(r.th), m: MSG.rad },
        ];
      },
    },
    "sin-opp": {
      know: ["L", "th"], ask: "b", title: "Catch the beam",
      task: "This turret's power and angle are locked, so the beam stops after a fixed length. Slide the sensor to where it ends. Find <b>d</b>.",
      rule: "sin θ = opp ÷ hyp, so opposite = hypotenuse × sin θ.",
      sub: function (r) { return "d = " + num(r.L) + " × sin " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.L * cosd(r.th), m: MSG.fn("cos", "sin", "d faces θ, so it is the opposite side") },
          { v: r.L / sind(r.th), m: MSG.flip("multiply: opposite = hypotenuse × sin θ") },
          { v: r.L * tand(r.th), m: MSG.fn("tan", "sin", "the power is the hypotenuse, not the adjacent side") },
          { v: r.L * Math.sin(r.th), m: MSG.rad },
        ];
      },
    },
    "cos-adj": {
      know: ["L", "th"], ask: "a", title: "Catch the beam",
      task: "This turret's power and angle are locked, so the beam stops after a fixed length. Slide the sensor to where it ends. Find <b>d</b>.",
      rule: "cos θ = adj ÷ hyp, so adjacent = hypotenuse × cos θ.",
      sub: function (r) { return "d = " + num(r.L) + " × cos " + num(r.th) + "°"; },
      wrongs: function (r) {
        return [
          { v: r.L * sind(r.th), m: MSG.fn("sin", "cos", "d touches θ, so it is the adjacent side") },
          { v: r.L / cosd(r.th), m: MSG.flip("multiply: adjacent = hypotenuse × cos θ") },
          { v: r.L * Math.cos(r.th), m: MSG.rad },
        ];
      },
    },
    "sin-angle": {
      know: ["L", "b"], ask: "th", title: "Aim a fixed beam",
      task: "The power is locked, so the beam has a fixed length. Turn the turret so it ends exactly on the sensor. Find <b>θ</b>.",
      rule: "sin θ = opp ÷ hyp, so θ = sin⁻¹(opp ÷ hyp).",
      sub: function (r) { return "θ = sin⁻¹(" + num(r.b) + " ÷ " + num(r.L) + ")"; },
      wrongs: function (r) {
        return [
          { v: acosd(r.b / r.L), m: MSG.fn("cos⁻¹", "sin⁻¹", "the known side faces θ, so it is the opposite") },
          { v: atand(r.b / r.L), m: MSG.fn("tan⁻¹", "sin⁻¹", "the power is the hypotenuse, not the adjacent side") },
          { v: Math.asin(r.b / r.L), m: MSG.rad },
          { v: r.b / r.L, m: MSG.ratio("sin") },
        ];
      },
    },
    "cos-angle": {
      know: ["L", "a"], ask: "th", title: "Aim a fixed beam",
      task: "The power is locked, so the beam has a fixed length. Turn the turret so it ends exactly on the sensor. Find <b>θ</b>.",
      rule: "cos θ = adj ÷ hyp, so θ = cos⁻¹(adj ÷ hyp).",
      sub: function (r) { return "θ = cos⁻¹(" + num(r.a) + " ÷ " + num(r.L) + ")"; },
      wrongs: function (r) {
        return [
          { v: asind(r.a / r.L), m: MSG.fn("sin⁻¹", "cos⁻¹", "the known side touches θ, so it is the adjacent") },
          { v: atand(r.a / r.L), m: MSG.fn("tan⁻¹", "cos⁻¹", "the power is the hypotenuse, not the opposite side") },
          { v: Math.acos(r.a / r.L), m: MSG.rad },
          { v: r.a / r.L, m: MSG.ratio("cos") },
        ];
      },
    },
  };

  var ASK_LABEL = { th: "θ =", a: "d =", b: "d =", L: "power =", x1: "x₁ =", x2: "x₂ =", L1: "leg 1 =", Ltot: "power =" };

  function makeTri(type, p, o) {
    o = o || {};
    var spec = TRI[type];
    var r = solveTri(p);
    var sx = o.sx || 1, sy = o.sy || 1;
    var room = {
      kind: "tri", type: type, a: r.a, b: r.b, L: r.L, th: r.th, sx: sx, sy: sy,
      ask: spec.ask, known: {}, tip: o.tip, teach: o.teach, face: o.face, time: o.time || 0,
    };
    spec.know.forEach(function (k) { room.known[k] = true; });
    room.E = { x: 0, y: 0 };
    room.C = { x: sx * r.a, y: 0 };
    room.T = { x: sx * r.a, y: sy * r.b };
    room.initSensor = spec.ask === "th" || spec.ask === "L";
    room.initMirror = false;
    var pad = Math.max(1.5, 0.16 * Math.max(r.a, r.b));
    room.box = {
      minX: Math.min(0, room.T.x) - pad, maxX: Math.max(0, room.T.x) + pad,
      minY: Math.min(0, room.T.y) - pad, maxY: Math.max(0, room.T.y) + pad,
    };
    room.steps = [{
      ask: spec.ask,
      kind: spec.ask === "th" ? "angle" : "length",
      unit: spec.ask === "th" ? "°" : "m",
      title: spec.title,
      task: function () { return spec.task; },
      tip: SIDE_RULE,
      rule: spec.rule,
      sub: spec.sub,
      usesTh: false,
      calc: function (rm) { return rm[spec.ask]; },
      wrongs: spec.wrongs,
      visual: triVisual,
      apply: function (rm) { if (spec.ask === "a" || spec.ask === "b") rm.sensorShown = true; },
    }];
    return room;
  }

  var MSTEP = {
    th: {
      kind: "angle", unit: "°", title: "Aim at the mirror",
      task: function (r) { return "The mirror is <b>h₁ = " + num(r.h1) + " m</b> up and <b>x₁ = " + num(r.x1) + " m</b> along. Find the turret angle <b>θ</b>."; },
      tip: "Look at the first triangle only: turret, the point under the mirror, and the mirror.",
      rule: "In the first triangle, tan θ = h₁ ÷ x₁.",
      sub: function (r) { return "θ = tan⁻¹(" + num(r.h1) + " ÷ " + num(r.x1) + ")"; },
      calc: function (r) { return atand(r.h1 / r.x1); },
      wrongs: function (r) {
        return [
          { v: atand(r.x1 / r.h1), m: MSG.swap },
          { v: Math.atan(r.h1 / r.x1), m: MSG.rad },
          { v: r.h1 / r.x1, m: MSG.ratio("tan") },
        ];
      },
    },
    x1: {
      kind: "length", unit: "m", title: "Place the mirror",
      task: function (r) { return "The turret is locked at <b>θ = " + num(r.th) + "°</b> and the mirror wall is <b>h₁ = " + num(r.h1) + " m</b> away. Slide the mirror to where the beam arrives. Find <b>x₁</b>."; },
      tip: "The angle is fixed. Where along the wall will the beam arrive?",
      rule: "tan θ = h₁ ÷ x₁, so x₁ = h₁ ÷ tan θ.",
      sub: function (r) { return "x₁ = " + num(r.h1) + " ÷ tan " + num(r.th) + "°"; },
      calc: function (r, th) { return r.h1 / tand(th); },
      wrongs: function (r) {
        return [
          { v: r.h1 * tand(r.th), m: MSG.flip("divide: x₁ = h₁ ÷ tan θ") },
          { v: r.h1 / sind(r.th), m: "That's the length of the beam to the mirror. The mirror slides along the wall, so you need x₁ = h₁ ÷ tan θ." },
          { v: r.h1 / Math.tan(r.th), m: MSG.rad },
        ];
      },
    },
    x2: {
      kind: "length", unit: "m", title: "Place the sensor", usesTh: true,
      task: function (r) { return "The beam leaves the mirror at the same angle θ. The sensor rail is <b>h₂ = " + num(r.h2) + " m</b> below the mirror wall. How far past the mirror must the sensor go? Find <b>x₂</b>."; },
      tip: "Same θ on the way down. Now use the second triangle, with h₂.",
      rule: "The beam leaves at the same θ. tan θ = h₂ ÷ x₂, so x₂ = h₂ ÷ tan θ.",
      sub: function (r) { return "x₂ = " + num(r.h2) + " ÷ tan " + dp1(r.playerTh != null ? r.playerTh : r.th) + "°"; },
      calc: function (r, th) { return r.h2 / tand(th); },
      wrongs: function (r) {
        var w = [
          { v: r.h2 * tand(r.th), m: MSG.flip("divide: x₂ = h₂ ÷ tan θ") },
          { v: r.h2 / sind(r.th), m: "That's the length of the reflected beam, not the distance along the rail." },
          { v: r.x1 + r.x2, m: "That's measured from the turret. x₂ is measured from the mirror." },
          { v: r.h2 / Math.tan(r.th), m: MSG.rad },
        ];
        if (Math.abs(r.h1 - r.h2) > 0.3) w.push({ v: r.h1 / tand(r.th), m: "That uses h₁. The second triangle uses h₂, the drop from the mirror wall to the sensor rail." });
        return w;
      },
    },
    L1: {
      kind: "length", unit: "m", title: "Power: leg 1",
      task: function (r) { return "Turret at <b>θ = " + num(r.th) + "°</b>, mirror wall <b>h₁ = " + num(r.h1) + " m</b> away. How long is leg 1, from the turret to the mirror?"; },
      tip: "Leg 1 is the hypotenuse of the first triangle.",
      rule: "sin θ = h₁ ÷ leg 1, so leg 1 = h₁ ÷ sin θ.",
      sub: function (r) { return "leg 1 = " + num(r.h1) + " ÷ sin " + num(r.th) + "°"; },
      calc: function (r, th) { return r.h1 / sind(th); },
      wrongs: function (r) {
        return [
          { v: r.h1 * sind(r.th), m: MSG.flip("divide: leg 1 = h₁ ÷ sin θ") },
          { v: r.h1 / cosd(r.th), m: MSG.fn("cos", "sin", "h₁ faces θ, so it is the opposite side") },
          { v: r.h1 / tand(r.th), m: "That's x₁, the distance along the floor, not the beam length." },
          { v: r.h1 / Math.sin(r.th), m: MSG.rad },
        ];
      },
    },
    Ltot: {
      kind: "length", unit: "m", title: "Power: full beam", usesTh: true,
      task: function (r) { return "The sensor is <b>h₂ = " + num(r.h2) + " m</b> below the mirror wall. Set the total power: leg 1 + leg 2."; },
      tip: "Leg 2 is the hypotenuse of the second triangle. Then add the legs.",
      rule: "Leg 2 = h₂ ÷ sin θ. Power = leg 1 + leg 2.",
      sub: function (r) {
        var t = dp1(r.playerTh != null ? r.playerTh : r.th);
        return "power = " + num(r.h1) + " ÷ sin " + t + "° + " + num(r.h2) + " ÷ sin " + t + "°";
      },
      calc: function (r, th) { return (r.h1 + r.h2) / sind(th); },
      wrongs: function (r) {
        return [
          { v: r.L1, m: "That's only leg 1. Add the reflected leg as well: h₂ ÷ sin θ." },
          { v: r.h2 / sind(r.th), m: "That's only leg 2. Add leg 1 as well." },
          { v: r.x1 + r.x2, m: "That's the distance along the floor. Power is the length of the beam itself." },
          { v: (r.h1 + r.h2) * sind(r.th), m: MSG.flip("divide: each leg = height ÷ sin θ") },
          { v: (r.h1 + r.h2) / Math.sin(r.th), m: MSG.rad },
        ];
      },
    },
  };

  var MIRROR_STEPS = {
    "mir-angle": ["th", "x2"],
    "mir-place": ["x1", "x2"],
    "mir-power": ["L1", "Ltot"],
    "mir-boss": ["th", "x2", "Ltot"],
  };

  function makeMirror(type, p, o) {
    o = o || {};
    var th = p.th != null ? p.th : atand(p.h1 / p.x1);
    var x1 = p.x1 != null ? p.x1 : p.h1 / tand(th);
    var x2 = p.h2 / tand(th);
    var room = {
      kind: "mirror", type: type, th: th, h1: p.h1, h2: p.h2, x1: x1, x2: x2,
      L1: p.h1 / sind(th), Ltot: (p.h1 + p.h2) / sind(th),
      known: { h1: true, h2: true }, tip: o.tip, teach: o.teach, face: o.face, time: o.time || 0,
    };
    if (p.th != null) room.known.th = true;
    if (p.x1 != null) room.known.x1 = true;
    room.E = { x: 0, y: 0 };
    room.M = { x: x1, y: p.h1 };
    room.C1 = { x: x1, y: 0 };
    room.S = { x: x1 + x2, y: p.h1 - p.h2 };
    room.C2 = { x: x1, y: p.h1 - p.h2 };
    room.initMirror = type !== "mir-place";
    room.initSensor = type === "mir-power";
    var pad = Math.max(1.5, 0.14 * Math.max(x1 + x2, p.h1, p.h2));
    room.box = { minX: -pad, maxX: x1 + x2 + pad, minY: Math.min(0, p.h1 - p.h2) - pad, maxY: p.h1 };
    room.steps = MIRROR_STEPS[type].map(function (ask) {
      var d = MSTEP[ask];
      return {
        ask: ask, kind: d.kind, unit: d.unit, title: d.title, task: d.task, tip: d.tip,
        rule: d.rule, sub: d.sub, usesTh: !!d.usesTh, wrongs: d.wrongs, visual: mirrorVisual,
        calc: function (r, t) { return d.calc(r, t == null ? r.th : t); },
        apply: function (r) {
          if (ask === "x1") r.mirrorShown = true;
          if (ask === "x2") r.sensorShown = true;
        },
      };
    });
    return room;
  }

  function buildRoom(def) {
    return def.kind === "mirror" ? makeMirror(def.type, def.p, def.o) : makeTri(def.type, def.p, def.o);
  }

  function T(type, p, o) { return { kind: "tri", type: type, p: p, o: o || {} }; }
  function M(type, p, o) { return { kind: "mirror", type: type, p: p, o: o || {} }; }

  /* ================================================================
   * Story
   * ================================================================ */

  var OPENING = [
    { bg: "op-02-news.png", ken: "ken-a", music: "heist", lines: [
      "Last night, the Prism Heart vanished from the City Museum.",
      "The most famous treasure in the city, gone without a trace.",
    ] },
    { bg: "op-03-collector.png", ken: "ken-b", lines: [
      "Everyone knows who took it: Victor Crane, the Collector.",
      "But nobody can prove it, and nobody can get inside his tower.",
    ] },
    { bg: "op-03-collector.png", who: "collector", face: "smug", lines: [
      "Let them try. My vault is guarded by lasers that no thief can beat.",
      "Every beam is set to a precise angle. One wrong number, and the alarms sing!",
    ] },
    { bg: "op-04-call.png", ken: "ken-c", who: "echo", face: "smile", lines: [
      "Phantom! Did you see the news?",
      "Crane's tower is full of lasers, angles and distances.",
    ] },
    { bg: "op-04-call-tease.png", who: "echo", face: "tease", lines: [
      "That's not a security system. That's a trigonometry test.",
      "Lucky for us, you're good at maths.",
    ] },
    { bg: "op-04-call-tease.png", who: "phantom", face: "ready", lines: [
      "Then let's go and get the Prism Heart back.",
    ] },
    { bg: "op-05-blueprint.png", ken: "ken-a", who: "echo", face: "focus", lines: [
      "Crane Tower has four levels: the lobby, the gallery, the mirror hall and the vault.",
      "I'll hack the laser controls. You give me the numbers: angles, distances, beam power.",
      "Get one wrong and the alarm goes off.",
    ] },
    { bg: "op-04-call-alarm.png", who: "echo", face: "alarm", lines: [
      "If that happens, fire an EMP. Each one resets the alarm once.",
      "You get three on every floor. Run out, and Crane catches you.",
    ] },
    { bg: "op-04-call.png", who: "echo", face: "smile", lines: [
      "First, a warm-up. I built a simulator that copies Crane's laser rooms.",
      "No alarms in there, so mistakes are free. Let's go!",
    ] },
  ];

  var CHAPTERS = [
    {
      id: "sim", where: "Simulator", name: "Simulator", sub: "Warm-up · tan, cos and exact values",
      bg: "challenge-bg.png", music: "heist", support: true,
      intro: [],
      rooms: [
        T("tan-angle", { a: 8, b: 5 }, {
          teach: [
            "Every laser room is a right-angled triangle. The beam is the hypotenuse.",
            "This sensor is 5 m up and 8 m across from the turret.",
            "Seen from θ, 5 m is the opposite side and 8 m is the adjacent side. That means tan.",
            "θ = tan⁻¹(opposite ÷ adjacent). Give the angle to 1 decimal place, then hit FIRE.",
          ],
          tip: "Opposite ÷ adjacent, then tan⁻¹. Round to 1 d.p.",
        }),
        T("tan-opp", { a: 6, th: 35 }, {
          teach: [
            "Now the turret is stuck at 35°. You choose where the sensor goes on the rail.",
            "We know the adjacent side and want the opposite: opposite = adjacent × tan θ.",
          ],
          tip: "d is the opposite side here. Opposite = adjacent × tan θ.",
        }),
        T("cos-hyp", { a: 7, th: 40 }, {
          teach: [
            "Crane's gallery lasers need the right power. Power is the beam length, in metres.",
            "Too little power and the beam fizzles out. Too much and it hits the alarm plate behind the sensor.",
            "We know the adjacent side and want the hypotenuse. cos θ = adj ÷ hyp, so hyp = adj ÷ cos θ.",
          ],
          tip: "hypotenuse = adjacent ÷ cos θ. The beam must be longer than 7 m.",
        }),
        T("tan-opp", { a: 6, th: 60 }, {
          teach: [
            "Last one. 30°, 45° and 60° are special angles with exact values.",
            "tan 60° = √3. You can type 6√3 instead of a decimal. Real phantoms don't need calculators.",
          ],
          face: "tease",
          tip: "tan 60° = √3. Try an exact answer, like 6√3.",
        }),
      ],
      outro: [
        { bg: "challenge-bg.png", who: "echo", face: "wow", lines: ["Simulator cleared! You're faster than my code."] },
        { bg: "op-06-infiltrate.png", ken: "ken-a", music: "heist", lines: ["Midnight. Crane Tower."] },
        { bg: "op-06-infiltrate.png", who: "echo", face: "focus", lines: ["You're in. Lasers ahead. Stay calm and trust the triangles."] },
      ],
    },
    {
      id: "f1", where: "1F Lobby", name: "1F · The Lobby", sub: "tan and tan⁻¹",
      bg: "fl-1-lobby.png", music: "heist", support: true,
      card: { img: "fl-1-lobby.png", kicker: "Floor 1", name: "The Lobby", sub: "tan · tan⁻¹" },
      intro: [
        { bg: "fl-1-lobby.png", who: "echo", face: "smile", lines: [
          "Lobby lasers only need tan: opposite and adjacent, no hypotenuse.",
          "Fresh EMPs loaded. Three of them.",
        ] },
      ],
      rooms: [
        T("tan-angle", { a: 12, b: 4.5 }, { tip: "Which two sides do you know, seen from θ? Pick the matching ratio." }),
        T("tan-adj", { b: 3.2, th: 24 }, { sx: -1, tip: "The rail is 3.2 m from the turret's line. This time d is the adjacent side." }),
        T("tan-opp", { a: 9.5, th: 52 }, { sy: -1, tip: "Locked at 52°. Where will the beam cross the rail?" }),
      ],
      outro: [
        { bg: "fl-1-lobby.png", who: "collector", face: "smug", lines: [
          "Hm? A visitor in my lobby? How amusing.",
          "Enjoy it while it lasts. My gallery is not so kind.",
        ] },
      ],
    },
    {
      id: "f2", where: "2F Gallery", name: "2F · The Gallery", sub: "sin, cos and beam power",
      bg: "fl-2-gallery.png", music: "heist",
      card: { img: "fl-2-gallery.png", kicker: "Floor 2", name: "The Gallery", sub: "sin · cos · beam power" },
      intro: [
        { bg: "fl-2-gallery.png", who: "echo", face: "focus", lines: [
          "The gallery turrets have power limits. Power is the beam length: the hypotenuse.",
          "So now we need sin and cos as well. Remember SOH CAH TOA.",
          "From here on I won't label the sides for you. New EMP pack loaded.",
        ] },
      ],
      rooms: [
        T("sin-hyp", { b: 4, th: 28 }, { tip: "Power must be exact. Which side do you know, seen from θ?" }),
        T("cos-adj", { L: 11, th: 33 }, { sx: -1, tip: "Fixed power, fixed angle. Slide the sensor to where the beam ends." }),
        T("sin-angle", { L: 9, b: 5.2 }, { sy: -1, tip: "Hypotenuse and opposite known, angle wanted. Which inverse?" }),
        T("cos-angle", { L: 12, a: 7.5 }, { tip: "Hypotenuse and adjacent this time." }),
      ],
      outro: [
        { bg: "fl-2-gallery.png", who: "collector", face: "angry", lines: [
          "WHAT? Somebody got through my gallery?",
          "No matter. The Mirror Hall will bounce you right back out!",
        ] },
      ],
    },
    {
      id: "f3", where: "3F Mirror Hall", name: "3F · The Mirror Hall", sub: "Reflections · two triangles",
      bg: "fl-3-mirror.png", music: "heist",
      card: { img: "fl-3-mirror.png", kicker: "Floor 3", name: "The Mirror Hall", sub: "reflections · two triangles" },
      intro: [
        { bg: "fl-3-mirror.png", who: "echo", face: "focus", lines: [
          "Mirror Hall. Every beam has to bounce off the mirror on the far wall.",
          "A mirror sends the beam away at the same angle it arrived: θ in, θ out.",
          "So every room is two right-angled triangles with the same θ. Solve them one at a time.",
        ] },
      ],
      rooms: [
        M("mir-angle", { h1: 4, x1: 6, h2: 3 }, { tip: "Step 1 only needs the first triangle." }),
        M("mir-place", { th: 40, h1: 5, h2: 2.5 }),
        M("mir-power", { th: 35, h1: 4, h2: 4 }),
      ],
      outro: [
        { bg: "op-03-collector-shock.png", who: "collector", face: "shock", lines: ["The Mirror Hall too?! Impossible!"] },
        { bg: "op-03-collector-angry.png", who: "collector", face: "angry", lines: ["Fine. FINE. Nobody has ever opened my vault. Nobody!"] },
      ],
    },
    {
      id: "f4", where: "B1 Vault", name: "B1 · The Vault", sub: "Timed locks · everything at once",
      bg: "fl-4-vault.png", music: "tension",
      card: { img: "fl-4-vault.png", kicker: "Level B1", name: "The Vault", sub: "timed locks · everything you know", vault: true },
      intro: [
        { bg: "fl-4-vault.png", who: "echo", face: "alarm", lines: [
          "This is it: the vault. The laser rings rotate, so every lock has a timer.",
          "If the timer runs out, the alarm goes off.",
          "Three locks. Then the Prism Heart is ours.",
        ] },
      ],
      rooms: [
        T("sin-angle", { L: 14, b: 6.3 }, { sx: -1, time: 90, tip: "Fixed power again. Which sides do you know?" }),
        M("mir-place", { th: 28, h1: 3.5, h2: 5 }, { time: 120, tip: "Mirror first, then sensor. Watch the clock." }),
        M("mir-boss", { h1: 4.8, x1: 5.5, h2: 3.6 }, { time: 180, tip: "The last lock: angle, sensor, then full power." }),
      ],
      outro: [],
    },
  ];

  var ENDING = [
    { bg: "end-01-escape.png", ken: "ken-a", music: "triumph", who: "echo", face: "wow", lines: [
      "The vault is open! You've got the Prism Heart!",
      "Now get out of there!",
    ] },
    { bg: "end-02-collector.png", ken: "ken-b", lines: ["Crane ran after you, straight into his own laser grid."] },
    { bg: "end-02-collector.png", who: "collector", face: "shock", lines: ["No, no, NO! My beautiful angles!"] },
    { bg: "end-03-return.png", ken: "ken-c", lines: [
      "The next morning, the Prism Heart was back in the City Museum.",
      "On its stand lay a small white card. No name. Just a triangle, drawn in ink.",
    ] },
    { bg: "end-03-return.png", who: "echo", face: "smile", lines: ["Not bad, Phantom. Not bad at all."] },
  ];

  var PRAISE = [
    "Clean hit. Next lock!",
    "Sensor locked. Smooth.",
    "Bang on. Crane won't know what hit him.",
    "Perfect. The lasers love you.",
    "Access granted. Nice maths.",
  ];
  var STEP_PRAISE = ["Step cleared. Keep going.", "Locked in. Next part.", "Nice. One more triangle."];
  var WOW = [
    "Exact value? No calculator? Mental-maths phantom!",
    "You typed the surd straight in! Genius-level heisting.",
    "Exact answer! Even Crane's engineers can't do that.",
  ];

  var NAMES = { echo: "ECHO", collector: "VICTOR CRANE", phantom: "YOU" };

  /* ================================================================
   * Challenge rooms
   * ================================================================ */

  var TRI_EASY = ["tan-angle", "tan-opp", "tan-adj"];
  var TRI_ALL = TRI_EASY.concat(["cos-hyp", "sin-hyp", "sin-opp", "cos-adj", "sin-angle", "cos-angle"]);
  var MIR_ALL = ["mir-angle", "mir-place", "mir-power"];

  function randomRoom(level) {
    var pool = level < 3 ? TRI_EASY : level < 6 ? TRI_ALL : TRI_ALL.concat(MIR_ALL, MIR_ALL);
    if (level >= 10) pool = pool.concat(["mir-boss"]);
    var type = pick(pool);
    return type.indexOf("mir") === 0 ? randomMirror(type) : randomTri(type);
  }

  function randomTri(type) {
    for (var n = 0; n < 60; n++) {
      var special = Math.random() < 0.2;
      var th = special ? pick([30, 45, 60]) : randInt(18, 68);
      var p;
      switch (type) {
        case "tan-angle": p = { a: randLen(4, 12), b: randLen(2.5, 10) }; break;
        case "tan-opp": case "cos-hyp": p = { a: randLen(4, 11), th: th }; break;
        case "tan-adj": case "sin-hyp": p = { b: randLen(3, 9), th: th }; break;
        case "sin-opp": case "cos-adj": p = { L: randLen(7, 15), th: th }; break;
        case "sin-angle": p = { L: randLen(7, 15) }; p.b = rand1(2.5, p.L * 0.85); break;
        default: p = { L: randLen(7, 15) }; p.a = rand1(2.5, p.L * 0.85); break;
      }
      var r = solveTri(p);
      var ratio = r.b / r.a;
      if (ratio < 0.3 || ratio > 2.4 || r.L > 22 || r.th < 12 || r.th > 76) continue;
      return makeTri(type, p, { sx: pick([1, -1]), sy: pick([1, -1]) });
    }
    return makeTri("tan-angle", { a: 8, b: 5 });
  }

  function randomMirror(type) {
    for (var n = 0; n < 60; n++) {
      var p = { h1: randLen(3, 6), h2: randLen(2, 6) };
      if (type === "mir-angle" || type === "mir-boss") p.x1 = randLen(3.5, 9);
      else p.th = randInt(25, 60);
      var th = p.th != null ? p.th : atand(p.h1 / p.x1);
      var x1 = p.x1 != null ? p.x1 : p.h1 / tand(th);
      var x2 = p.h2 / tand(th);
      if (th < 22 || th > 64 || x1 + x2 > 20 || x1 < 2 || x2 < 1.5) continue;
      return makeMirror(type, p);
    }
    return makeMirror("mir-angle", { h1: 4, x1: 6, h2: 3 });
  }

  /* ================================================================
   * Storage
   * ================================================================ */

  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function unlocked() { return parseInt(load(KEY_UNLOCK) || "0", 10) || 0; }
  function unlock(i) { if (i > unlocked()) store(KEY_UNLOCK, String(i)); }
  function bests() {
    try { return JSON.parse(load(KEY_BEST) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveBest(kind, val) {
    var b = bests();
    var isNew = !(b[kind] >= val);
    if (isNew) { b[kind] = val; store(KEY_BEST, JSON.stringify(b)); }
    return isNew;
  }

  /* ================================================================
   * Audio — procedural beds and effects (no files)
   * ================================================================ */

  var audio = { ctx: null, master: null, music: null, sfx: null, noise: null, bed: "", want: "", next: 0, k: 0, muted: load(KEY_MUTE) === "1" };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

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
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
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
      osc.connect(lp);
      node = lp;
    }
    node.connect(g);
    g.connect(o.out || audio.music);
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
    g.gain.setValueAtTime(o.gain || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out || audio.music);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  var BEDS = {
    heist: {
      bpm: 92, swing: 0.64, bars: 4, vol: 0.5,
      bass: [[38, 41, 45, 48], [34, 38, 41, 45], [31, 34, 38, 41], [33, 37, 40, 43]],
      chords: [[53, 57, 60, 64], [50, 53, 57, 62], [50, 53, 55, 58], [49, 52, 55, 57]],
      play: function (t, i, bar, e) {
        if (i % 2 === 0) {
          var m = this.bass[bar][i / 2];
          tone(t, mtof(m), e * 1.7, { type: "triangle", gain: 0.2, lp: 900 });
          tone(t, mtof(m - 12), e * 1.5, { type: "sine", gain: 0.1 });
        }
        noise(t, 0.05, { f: 7500, gain: i % 2 ? 0.04 : 0.022 });
        if (i === 2 || i === 6) noise(t, 0.16, { ft: "bandpass", f: 2200, q: 0.8, gain: 0.055 });
        if (i === 3 || i === 7) {
          this.chords[bar].forEach(function (c) { tone(t, mtof(c), 0.26, { type: "sine", gain: 0.03, lp: 2000 }); });
        }
        if (bar === 0 && i === 0) tone(t, mtof(74), e * 5, { type: "sine", gain: 0.045, a: 0.01 });
        if (bar === 2 && i === 4) tone(t, mtof(77), e * 3, { type: "sine", gain: 0.04, a: 0.01 });
        if (bar === 3 && i === 1) tone(t, mtof(76), e * 3, { type: "sine", gain: 0.04, a: 0.01 });
      },
    },
    tension: {
      bpm: 124, swing: 0.5, bars: 4, vol: 0.45,
      roots: [33, 33, 29, 31],
      play: function (t, i, bar, e) {
        var r = this.roots[bar];
        tone(t, mtof(r), e * 0.9, { type: "sawtooth", gain: i === 0 ? 0.15 : 0.085, lp: i % 2 ? 420 : 640 });
        noise(t, 0.03, { f: 9000, gain: 0.028 });
        if (i === 0) {
          tone(t, 90, 0.35, { to: 45, gain: 0.32 });
          tone(t, mtof(r + 36), e * 8, { type: "sawtooth", gain: 0.016, lp: 1400, a: 0.4 });
          tone(t, mtof(r + 43), e * 8, { type: "sawtooth", gain: 0.012, lp: 1400, a: 0.4, detune: 8 });
        }
        if (i === 4) noise(t, 0.12, { ft: "bandpass", f: 1500, gain: 0.05 });
      },
    },
    triumph: {
      bpm: 104, swing: 0.5, bars: 4, vol: 0.45,
      chords: [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 66]],
      roots: [38, 35, 31, 33],
      play: function (t, i, bar, e) {
        var ch = this.chords[bar];
        tone(t, mtof(ch[i % 4] + (i >= 4 ? 12 : 0)), e * 1.6, { type: "triangle", gain: 0.055 });
        if (i % 2 === 0) tone(t, mtof(this.roots[bar]), e * 1.8, { type: "sine", gain: 0.18 });
        if (i === 0) ch.forEach(function (m) { tone(t, mtof(m - 12), e * 8, { type: "sine", gain: 0.022, a: 0.3 }); });
        noise(t, 0.04, { f: 8000, gain: 0.018 });
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

  function scheduleMusic() {
    if (!audio.ctx || !audio.bed) return;
    if (!stageVisible()) {
      if (audio.ctx.state === "running") audio.ctx.suspend();
      return;
    }
    if (audio.ctx.state === "suspended") { audio.ctx.resume(); return; }
    var bed = BEDS[audio.bed];
    if (!bed) return;
    var now = audio.ctx.currentTime;
    var e = 60 / bed.bpm / 2;
    if (audio.next < now - 0.1) audio.next = now + 0.05;
    while (audio.next < now + 0.2) {
      var i = audio.k % 8;
      var bar = Math.floor(audio.k / 8) % bed.bars;
      var t = audio.next + (i % 2 ? e * (2 * bed.swing - 1) : 0);
      bed.play(t, i, bar, e);
      audio.k++;
      audio.next += e;
    }
  }
  setInterval(scheduleMusic, 40);

  function sfxOn() { return audio.ctx && audio.ctx.state === "running"; }
  var SFX = {
    click: function () { if (sfxOn()) tone(audio.ctx.currentTime, 660, 0.06, { type: "triangle", gain: 0.05, out: audio.sfx }); },
    blip: function () { if (sfxOn()) tone(audio.ctx.currentTime, 1300 + Math.random() * 220, 0.025, { type: "square", gain: 0.01, lp: 3000, out: audio.sfx }); },
    laser: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      tone(t, 1600, 0.32, { type: "sawtooth", to: 320, gain: 0.07, lp: 5000, out: audio.sfx });
      tone(t, 2600, 0.2, { type: "sine", to: 900, gain: 0.05, out: audio.sfx });
    },
    hit: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      [1047, 1568, 2093].forEach(function (f, j) { tone(t + j * 0.06, f, 0.6, { gain: 0.07, out: audio.sfx }); });
    },
    alarm: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      for (var j = 0; j < 6; j++) tone(t + j * 0.16, j % 2 ? 620 : 880, 0.15, { type: "square", gain: 0.045, lp: 2600, out: audio.sfx });
    },
    emp: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      noise(t, 0.8, { ft: "lowpass", f: 6000, fto: 90, gain: 0.35, out: audio.sfx });
      tone(t, 80, 0.7, { to: 35, gain: 0.4, out: audio.sfx });
      tone(t + 0.02, 1200, 0.5, { to: 200, gain: 0.06, out: audio.sfx });
    },
    fizzle: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      noise(t, 0.35, { ft: "bandpass", f: 900, q: 2, gain: 0.12, out: audio.sfx });
      tone(t, 300, 0.3, { type: "sawtooth", to: 80, gain: 0.04, out: audio.sfx });
    },
    win: function () {
      if (!sfxOn()) return;
      var t = audio.ctx.currentTime;
      [74, 78, 81, 86].forEach(function (m, j) { tone(t + j * 0.09, mtof(m), 0.5, { type: "triangle", gain: 0.08, out: audio.sfx }); });
    },
    whoosh: function () {
      if (sfxOn()) noise(audio.ctx.currentTime, 0.9, { ft: "bandpass", f: 400, fto: 3000, gain: 0.12, q: 0.7, out: audio.sfx });
    },
  };

  function setMuted(m) {
    audio.muted = m;
    store(KEY_MUTE, m ? "1" : "0");
    if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : 0.85, audio.ctx.currentTime, 0.05);
    muteBtn.textContent = m ? "SOUND OFF" : "SOUND ON";
  }

  /* ================================================================
   * DOM
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

  stage.innerHTML = "";
  var bgs = [el("img", "lv-bg"), el("img", "lv-bg")];
  bgs.forEach(function (b) { b.alt = ""; b.setAttribute("aria-hidden", "true"); stage.appendChild(b); });
  stage.appendChild(el("div", "lv-layer lv-vignette"));

  var board = sv("svg", { class: "lv-board", viewBox: "0 0 1280 720", preserveAspectRatio: "xMidYMid meet", "aria-label": "Laser room" }, stage);

  var cardTitle = el("div", "lv-layer lv-card-title", "<p></p><h3></h3><span></span>");
  stage.appendChild(cardTitle);

  var hud = el("div", "lv-hud",
    '<div class="lv-pill" data-h="emp">EMP <span class="lv-emps"><i></i><i></i><i></i></span></div>' +
    '<div class="lv-pill" data-h="where"></div>' +
    '<div class="lv-pill" data-h="time">Time <b>0:00</b></div>' +
    '<div class="lv-pill" data-h="score">Score <b>0</b></div>' +
    '<div class="lv-pill" data-h="rooms">Rooms <b>0</b></div>');
  stage.appendChild(hud);
  var hEmp = hud.querySelector('[data-h="emp"]');
  var hPips = Array.prototype.slice.call(hud.querySelectorAll(".lv-emps i"));
  var hWhere = hud.querySelector('[data-h="where"]');
  var hTime = hud.querySelector('[data-h="time"]');
  var hScore = hud.querySelector('[data-h="score"]');
  var hRooms = hud.querySelector('[data-h="rooms"]');

  var panel = el("div", "lv-panel",
    '<div class="lv-p-head"><span class="lv-p-where"></span><span class="lv-p-count"></span></div>' +
    '<h3 class="lv-p-title"></h3>' +
    '<p class="lv-p-task"></p>' +
    '<div class="lv-p-steps"></div>' +
    '<div class="lv-p-know"></div>' +
    '<div class="lv-p-row"><span class="lv-p-ask"></span>' +
    '<input class="lv-p-input" type="text" autocomplete="off" spellcheck="false" aria-label="Your answer">' +
    '<span class="lv-p-unit"></span></div>' +
    '<div class="lv-p-keys">' +
    '<button type="button" class="lv-key" data-ins="√">√</button>' +
    '<button type="button" class="lv-key" data-ins="(">(</button>' +
    '<button type="button" class="lv-key" data-ins=")">)</button>' +
    '<button type="button" class="lv-key" data-ins="/">÷</button>' +
    '<button type="button" class="lv-key" data-del="1">⌫</button></div>' +
    '<div class="lv-p-actions"><button type="button" class="lv-btn fire">Fire</button>' +
    '<button type="button" class="lv-btn hint">Hint</button>' +
    '<button type="button" class="lv-btn next" hidden>Next ▸</button></div>' +
    '<span class="lv-deg">Calculator in DEG · answers to 1 d.p.</span>' +
    '<div class="lv-echo"><img alt=""><p></p></div>');
  panel.hidden = true;
  stage.appendChild(panel);
  var pWhere = panel.querySelector(".lv-p-where");
  var pCount = panel.querySelector(".lv-p-count");
  var pTitle = panel.querySelector(".lv-p-title");
  var pTask = panel.querySelector(".lv-p-task");
  var pSteps = panel.querySelector(".lv-p-steps");
  var pKnow = panel.querySelector(".lv-p-know");
  var pAsk = panel.querySelector(".lv-p-ask");
  var pUnit = panel.querySelector(".lv-p-unit");
  var input = panel.querySelector(".lv-p-input");
  var fireBtn = panel.querySelector(".lv-btn.fire");
  var hintBtn = panel.querySelector(".lv-btn.hint");
  var nextBtn = panel.querySelector(".lv-btn.next");
  var echoBox = panel.querySelector(".lv-echo");
  var echoImg = echoBox.querySelector("img");
  var echoText = echoBox.querySelector("p");

  var dialog = el("div", "lv-dialog",
    '<div class="lv-face"><img alt=""></div><div class="lv-dbody"><div class="lv-name"></div><p class="lv-line"></p></div><span class="lv-next">▼</span>');
  stage.appendChild(dialog);
  var dFace = dialog.querySelector(".lv-face");
  var dFaceImg = dFace.querySelector("img");
  var dName = dialog.querySelector(".lv-name");
  var dLine = dialog.querySelector(".lv-line");

  var promptEl = el("div", "lv-prompt", "Click to continue ▸");
  stage.appendChild(promptEl);

  var title = el("div", "lv-title",
    '<p class="lv-kicker">JM35 · Trigonometry Heist</p>' +
    "<h2>Laser<span>Vault</span></h2>" +
    '<p class="lv-sub"></p>' +
    '<div class="lv-cards" data-step="mode"></div>' +
    '<div class="lv-cards list" data-step="story" hidden></div>' +
    '<div class="lv-cards" data-step="challenge" hidden></div>' +
    '<button type="button" class="lv-back" hidden>← Back</button>');
  title.hidden = true;
  stage.appendChild(title);
  var titleSub = title.querySelector(".lv-sub");
  var titleBack = title.querySelector(".lv-back");

  var result = el("div", "lv-result");
  result.hidden = true;
  stage.appendChild(result);

  var redFlash = el("div", "lv-layer lv-red");
  stage.appendChild(redFlash);

  var tools = el("div", "lv-tools",
    '<button type="button" class="lv-tool" data-t="skip" hidden>Skip ▸▸</button>' +
    '<button type="button" class="lv-tool" data-t="menu" hidden>Menu</button>' +
    '<button type="button" class="lv-tool" data-t="mute"></button>' +
    '<button type="button" class="lv-tool" data-t="full" title="Full screen">⛶</button>');
  stage.appendChild(tools);
  var skipBtn = tools.querySelector('[data-t="skip"]');
  var menuBtn = tools.querySelector('[data-t="menu"]');
  var muteBtn = tools.querySelector('[data-t="mute"]');
  var fullBtn = tools.querySelector('[data-t="full"]');
  muteBtn.textContent = audio.muted ? "SOUND OFF" : "SOUND ON";

  /* ================================================================
   * State
   * ================================================================ */

  var state = {
    gen: 0, mode: null, chapter: 0, roomIdx: 0, room: null, roomCtx: null,
    emp: EMP_MAX, busy: false, talk: null, timer: 0, timerOn: false, timerKind: null,
    score: 0, stats: null, hintLevel: 0,
  };

  function newStats() { return { rooms: 0, alarms: 0, exact: 0, hints: 0 }; }

  function later(ms, fn) {
    var g = state.gen;
    return setTimeout(function () { if (g === state.gen) fn(); }, ms);
  }

  function stageVisible() {
    if (document.hidden) return false;
    return document.fullscreenElement === stage || stage.offsetParent !== null;
  }

  /* ================================================================
   * Backgrounds, HUD, overlays
   * ================================================================ */

  var bgIdx = 0, bgKey = "";
  function setBg(name, o) {
    o = o || {};
    var key = name + (o.dim ? "|dim" : "");
    if (key === bgKey && !o.ken) return;
    bgKey = key;
    var cur = bgs[bgIdx], nxt = bgs[1 - bgIdx];
    bgIdx = 1 - bgIdx;
    var url = ART + name + V;
    var cls = "lv-bg on" + (o.dim ? " dim" : "") + (o.ken ? " " + o.ken : "");
    var show = function () {
      nxt.className = "lv-bg" + (o.dim ? " dim" : "");
      void nxt.offsetWidth;
      nxt.className = cls;
      cur.classList.remove("on");
    };
    if (nxt.getAttribute("src") === url && nxt.complete) { show(); return; }
    nxt.onload = show;
    nxt.onerror = show;
    nxt.setAttribute("src", url);
  }

  function preload(names) {
    names.forEach(function (n) { var im = new Image(); im.src = ART + n + V; });
  }

  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }

  function updateHud() {
    var m = state.mode;
    hud.classList.toggle("on", !!m);
    hEmp.hidden = !((m === "story" && CHAPTERS[state.chapter].id !== "sim") || m === "clean");
    hPips.forEach(function (p, i) { p.classList.toggle("lit", i < state.emp); });
    hWhere.hidden = m !== "story";
    if (m === "story") hWhere.textContent = CHAPTERS[state.chapter].where;
    hTime.hidden = !state.timerOn;
    hTime.querySelector("b").textContent = fmtTime(state.timer);
    hTime.classList.toggle("warn", state.timerOn && state.timer <= 15);
    hScore.hidden = m !== "speed";
    hScore.querySelector("b").textContent = state.score;
    hRooms.hidden = m !== "clean";
    hRooms.querySelector("b").textContent = state.stats ? state.stats.rooms : 0;
    menuBtn.hidden = !m;
  }

  function flashRed() {
    redFlash.classList.remove("on");
    void redFlash.offsetWidth;
    redFlash.classList.add("on");
  }

  function hidePuzzle() {
    board.classList.remove("on");
    panel.classList.remove("on");
    panel.hidden = true;
  }

  function resetScreen() {
    state.talk = null;
    state.room = null;
    state.busy = false;
    state.timerOn = false;
    state.timerKind = null;
    stage.classList.remove("is-talk");
    dialog.classList.remove("on");
    promptEl.classList.remove("on");
    skipBtn.hidden = true;
    cardTitle.classList.remove("on");
    title.classList.remove("on");
    title.hidden = true;
    result.classList.remove("on");
    result.hidden = true;
    hidePuzzle();
  }

  function newGen() { state.gen++; }

  /* ================================================================
   * Dialogue
   * ================================================================ */

  function talk(beats, done) {
    beats = beats || [];
    if (!beats.length) { if (done) done(); return; }
    var g = state.gen, bi = -1, li = 0, typing = null, line = "";
    var api = { advance: advance, skip: finish };
    state.talk = api;
    stage.classList.add("is-talk");
    skipBtn.hidden = false;
    nextBeat();

    function nextBeat() {
      bi++;
      if (bi >= beats.length) { finish(); return; }
      var b = beats[bi];
      li = 0;
      if (b.bg) setBg(b.bg, { ken: b.ken, dim: b.dim });
      if (b.music) setBed(b.music);
      if (b.sfx && SFX[b.sfx]) SFX[b.sfx]();
      if (b.onShow) b.onShow();
      if (b.lines && b.lines.length) {
        promptEl.classList.remove("on");
        showLine();
      } else {
        dialog.classList.remove("on");
        promptEl.classList.add("on");
      }
    }

    function showLine() {
      var b = beats[bi];
      var who = b.who || null;
      dialog.className = "lv-dialog on" + (who ? " who-" + who : " narration");
      if (who) {
        dFace.hidden = false;
        dFaceImg.src = ART + who + "-" + (b.face || (who === "phantom" ? "ready" : "smile")) + ".png" + V;
        dName.textContent = NAMES[who];
      } else {
        dFace.hidden = true;
      }
      type(b.lines[li]);
    }

    function type(text) {
      line = text;
      dLine.textContent = "";
      var n = 0;
      clearInterval(typing);
      typing = setInterval(function () {
        if (g !== state.gen) { clearInterval(typing); return; }
        n++;
        dLine.textContent = line.slice(0, n);
        if (n % 3 === 0) SFX.blip();
        if (n >= line.length) { clearInterval(typing); typing = null; }
      }, 22);
    }

    function advance() {
      if (state.talk !== api) return;
      if (typing) { clearInterval(typing); typing = null; dLine.textContent = line; return; }
      var b = beats[bi];
      if (b && b.lines && li < b.lines.length - 1) { li++; showLine(); return; }
      nextBeat();
    }

    function finish() {
      if (state.talk !== api) return;
      clearInterval(typing);
      typing = null;
      for (var j = bi + 1; j < beats.length; j++) if (beats[j].onShow) beats[j].onShow();
      state.talk = null;
      stage.classList.remove("is-talk");
      dialog.classList.remove("on");
      promptEl.classList.remove("on");
      skipBtn.hidden = true;
      if (done && g === state.gen) done();
    }
  }

  function showCard(ch, done) {
    var c = ch.card;
    setBg(c.img, { ken: "ken-a" });
    if (ch.music) setBed(ch.music);
    SFX.whoosh();
    cardTitle.className = "lv-layer lv-card-title" + (c.vault ? " vault" : "");
    cardTitle.querySelector("p").textContent = c.kicker;
    cardTitle.querySelector("h3").textContent = c.name;
    cardTitle.querySelector("span").textContent = c.sub;
    requestAnimationFrame(function () { cardTitle.classList.add("on"); });
    var g = state.gen, ended = false;
    var api = { advance: end, skip: end };
    state.talk = api;
    stage.classList.add("is-talk");
    skipBtn.hidden = false;
    var tm = setTimeout(end, 3200);
    function end() {
      if (ended || g !== state.gen) return;
      ended = true;
      clearTimeout(tm);
      state.talk = null;
      stage.classList.remove("is-talk");
      skipBtn.hidden = true;
      cardTitle.classList.remove("on");
      later(380, done);
    }
  }

  /* ================================================================
   * Board drawing
   * ================================================================ */

  var BOX = { x: 46, y: 96, w: 800, h: 520 };
  var COL = { cy: "#22e3ff", gd: "#ffc65a", ok: "#4ade80", rd: "#ff3b3b", wh: "#eaf6ff", st: "#6b7a99", mg: "#ff2fb3" };

  function layoutRoom(room) {
    var bx = room.box, W = bx.maxX - bx.minX, H = bx.maxY - bx.minY;
    var s = Math.min(BOX.w / W, BOX.h / H, 74);
    room.map = { s: s, ox: BOX.x + (BOX.w - W * s) / 2, oy: BOX.y + (BOX.h - H * s) / 2 };
  }

  function P(room, p) {
    var m = room.map, bx = room.box;
    return { x: m.ox + (p.x - bx.minX) * m.s, y: m.oy + (bx.maxY - p.y) * m.s };
  }

  function unit(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / L, y: dy / L };
  }

  function dist(a, b) { return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)); }

  function ptsAttr(pts) { return pts.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" "); }

  function line(g, a, b, color, w, dash, op) {
    return sv("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, "stroke-width": w || 2, "stroke-dasharray": dash, "stroke-linecap": "round", opacity: op }, g);
  }

  function text(g, p, str, color, size, anchor) {
    var t = sv("text", { x: p.x, y: p.y, fill: color || COL.wh, "font-size": size || 20, "font-weight": 800, "text-anchor": anchor || "middle", "stroke-width": 6 }, g);
    t.textContent = str;
    return t;
  }

  function sideLabel(g, a, b, lab, away) {
    if (!lab) return;
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var d = unit(a, b), nx = -d.y, ny = d.x;
    if (away && (mx - away.x) * nx + (my - away.y) * ny < 0) { nx = -nx; ny = -ny; }
    var off = 22 + Math.abs(nx) * 30;
    text(g, { x: mx + nx * off, y: my + ny * off + 7 }, lab.t, lab.c, 20);
  }

  function rightMark(g, c, d1, d2) {
    var k = 15;
    sv("polyline", {
      points: ptsAttr([{ x: c.x + d1.x * k, y: c.y + d1.y * k }, { x: c.x + d1.x * k + d2.x * k, y: c.y + d1.y * k + d2.y * k }, { x: c.x + d2.x * k, y: c.y + d2.y * k }]),
      fill: "none", stroke: COL.st, "stroke-width": 2,
    }, g);
  }

  function angleArc(g, c, d1, d2, r, lab) {
    var p1 = { x: c.x + d1.x * r, y: c.y + d1.y * r }, p2 = { x: c.x + d2.x * r, y: c.y + d2.y * r };
    var sweep = d1.x * d2.y - d1.y * d2.x > 0 ? 1 : 0;
    sv("path", { d: "M" + p1.x + "," + p1.y + " A" + r + "," + r + " 0 0 " + sweep + " " + p2.x + "," + p2.y, fill: "none", stroke: lab ? lab.c : COL.gd, "stroke-width": 2.5 }, g);
    if (!lab) return;
    var bx = d1.x + d2.x, by = d1.y + d2.y, bl = Math.sqrt(bx * bx + by * by) || 1;
    var lr = r + 30 + (lab.t.length > 3 ? 14 : 0);
    text(g, { x: c.x + bx / bl * lr, y: c.y + by / bl * lr + 7 }, lab.t, lab.c, 20);
  }

  function dimLine(g, a, b, lab, side, frac) {
    line(g, a, b, COL.st, 2);
    var d = unit(a, b), n = { x: -d.y * 7, y: d.x * 7 };
    [a, b].forEach(function (p) { line(g, { x: p.x - n.x, y: p.y - n.y }, { x: p.x + n.x, y: p.y + n.y }, COL.st, 2); });
    var f = frac == null ? 0.5 : frac;
    var mx = a.x + (b.x - a.x) * f, my = a.y + (b.y - a.y) * f;
    text(g, { x: mx + side * 14, y: my + 7 }, lab.t, lab.c, 20, side < 0 ? "end" : "start");
  }

  function rail(g, a, b) {
    line(g, a, b, "rgba(34,227,255,.55)", 3, "2 9");
  }

  function drawEmitter(g, p, dir) {
    sv("circle", { cx: p.x, cy: p.y, r: 22, fill: "rgba(34,227,255,.08)" }, g);
    line(g, p, { x: p.x + dir.x * 28, y: p.y + dir.y * 28 }, COL.cy, 7);
    sv("circle", { cx: p.x, cy: p.y, r: 14, fill: "#0b2533", stroke: COL.cy, "stroke-width": 2.5 }, g);
    sv("circle", { cx: p.x, cy: p.y, r: 5, fill: "#bff8ff", filter: "url(#lvGlow)" }, g);
  }

  function drawSensor(g, p, color, pulse) {
    sv("circle", { cx: p.x, cy: p.y, r: 17, fill: "none", stroke: color, "stroke-width": 3, class: pulse ? "lv-sensor-ring" : null }, g);
    sv("circle", { cx: p.x, cy: p.y, r: 7, fill: color, filter: "url(#lvGlow)" }, g);
  }

  function drawMirrorPanel(g, room, mx, glow) {
    var s = room.map.s, c = P(room, { x: mx, y: room.h1 });
    var hw = Math.max(26, 0.65 * s);
    sv("rect", { x: c.x - hw, y: c.y - 2, width: hw * 2, height: 9, rx: 2, fill: "#cfe9f5", stroke: glow ? COL.cy : "#8fb3c7", "stroke-width": 2, filter: glow ? "url(#lvGlow)" : null }, g);
  }

  function beamEls(g, pts) {
    var a = ptsAttr(pts);
    var glow = sv("polyline", { points: a, fill: "none", stroke: "rgba(34,227,255,.4)", "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round", filter: "url(#lvGlow)" }, g);
    var core = sv("polyline", { points: a, fill: "none", stroke: "#d4faff", "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    return [glow, core];
  }

  function sideLab(room, k) {
    var pre = k === "L" ? "power " : "";
    if (room.known[k]) return { t: pre + num(room[k]) + " m", c: COL.wh };
    if (room.solved[k] != null) return { t: pre + dp1(room.solved[k]) + " m", c: COL.ok };
    if (room.ask === k) return { t: k === "L" ? "power = ?" : "d = ?", c: COL.gd };
    return null;
  }

  function angleLab(room) {
    if (room.known.th) return { t: "θ = " + num(room.th) + "°", c: COL.wh };
    if (room.solved.th != null) return { t: dp1(room.solved.th) + "°", c: COL.ok };
    return { t: "θ = ?", c: COL.gd };
  }

  function mirLab(room, k, name) {
    if (room.known[k]) return { t: name + " = " + num(room[k]) + " m", c: COL.wh };
    if (room.solved[k] != null) return { t: name + " = " + dp1(room.solved[k]) + " m", c: COL.ok };
    var cur = room.steps[room.stepIdx];
    if (cur && room.steps.some(function (s) { return s.ask === k; })) return { t: name + " = ?", c: COL.gd };
    return null;
  }

  var drawLayers = {};

  function drawRoom(room, temp) {
    temp = temp || {};
    while (board.firstChild) board.removeChild(board.firstChild);
    var defs = sv("defs", {}, board);
    defs.innerHTML =
      '<filter id="lvGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

    var bx = room.box;
    var tl = P(room, { x: bx.minX, y: bx.maxY }), br = P(room, { x: bx.maxX, y: bx.minY });
    var w = br.x - tl.x, h = br.y - tl.y;
    var floor = sv("g", {}, board);
    sv("rect", { x: tl.x, y: tl.y, width: w, height: h, fill: "rgba(6,12,24,.9)" }, floor);
    var step = room.map.s >= 26 ? 1 : 2;
    for (var gx = Math.ceil(bx.minX / step) * step; gx <= bx.maxX; gx += step) {
      var px = P(room, { x: gx, y: 0 }).x;
      line(floor, { x: px, y: tl.y }, { x: px, y: br.y }, "rgba(34,227,255,.07)", 1);
    }
    for (var gy = Math.ceil(bx.minY / step) * step; gy <= bx.maxY; gy += step) {
      var py = P(room, { x: 0, y: gy }).y;
      line(floor, { x: tl.x, y: py }, { x: br.x, y: py }, "rgba(34,227,255,.07)", 1);
    }
    sv("rect", { x: tl.x, y: tl.y, width: w, height: h, fill: "none", stroke: "#3a4660", "stroke-width": 6, rx: 4 }, floor);
    sv("rect", { x: tl.x + 8, y: tl.y + 8, width: w - 16, height: h - 16, fill: "none", stroke: "rgba(255,59,59,.38)", "stroke-width": 2, "stroke-dasharray": "10 9", rx: 2 }, floor);
    text(floor, { x: tl.x + 2, y: br.y + 26 }, "1 square = " + step + " m", "rgba(214,244,255,.45)", 14, "start");

    var marks = sv("g", {}, board);
    var beams = sv("g", {}, board);
    var top = sv("g", {}, board);
    drawLayers = { marks: marks, beams: beams, top: top, fx: sv("g", {}, board) };

    if (room.kind === "tri") drawTri(room, marks, top, temp);
    else drawMirrorRoom(room, marks, top, temp);

    room.beams.forEach(function (pts) { beamEls(beams, pts.map(function (p) { return P(room, p); })); });

    if (room.cleared) {
      var c = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2 };
      var st = text(drawLayers.fx, c, "ACCESS GRANTED", COL.ok, 54, "middle");
      st.setAttribute("class", "lv-stamp");
      st.setAttribute("stroke-width", 9);
    }
  }

  function aimDir(room) {
    var th = room.known.th ? room.th : room.solved.th;
    if (th == null) return null;
    return { x: room.sx * cosd(th), y: -room.sy * sind(th) };
  }

  function drawTri(room, g, top, temp) {
    var E = P(room, room.E), C = P(room, room.C), T = P(room, room.T);
    var bx = room.box;
    var ref = { x: room.sx, y: 0 };
    var full = room.sensorShown;
    var cen = { x: (E.x + C.x + T.x) / 3, y: (E.y + C.y + T.y) / 3 };
    var aim = aimDir(room);
    var beamDir = full ? unit(E, T) : aim;

    if (full) {
      line(g, E, C, COL.st, 2, "7 7");
      line(g, C, T, COL.st, 2, "7 7");
      line(g, E, T, "rgba(34,227,255,.35)", 2, "4 8");
      rightMark(g, C, unit(C, E), unit(C, T));
      sideLabel(g, E, C, sideLab(room, "a"), cen);
      sideLabel(g, C, T, sideLab(room, "b"), cen);
      sideLabel(g, E, T, sideLab(room, "L"), cen);
    } else if (room.ask === "b") {
      var r1 = P(room, { x: room.C.x, y: bx.minY + 0.35 }), r2 = P(room, { x: room.C.x, y: bx.maxY - 0.35 });
      rail(g, r1, r2);
      line(g, E, C, COL.st, 2, "7 7");
      rightMark(g, C, unit(C, E), { x: 0, y: -room.sy });
      sideLabel(g, E, C, sideLab(room, "a"), { x: (E.x + C.x) / 2, y: C.y - room.sy * 60 });
      var along = P(room, { x: room.C.x, y: room.sy * (room.sy > 0 ? bx.maxY : -bx.minY) * 0.5 });
      text(g, { x: along.x + room.sx * 18, y: along.y + 7 }, sideLab(room, "b").t, COL.gd, 20, room.sx > 0 ? "start" : "end");
    } else {
      var foot = P(room, { x: 0, y: room.T.y });
      var q1 = P(room, { x: bx.minX + 0.35, y: room.T.y }), q2 = P(room, { x: bx.maxX - 0.35, y: room.T.y });
      rail(g, q1, q2);
      line(g, E, foot, COL.st, 2, "7 7");
      rightMark(g, foot, unit(foot, E), { x: room.sx, y: 0 });
      var bl = sideLab(room, "b");
      if (bl) text(g, { x: E.x - room.sx * 16, y: (E.y + foot.y) / 2 + 7 }, bl.t, bl.c, 20, room.sx > 0 ? "end" : "start");
      var mid = P(room, { x: room.sx * Math.abs(room.sx > 0 ? bx.maxX : bx.minX) * 0.5, y: room.T.y });
      text(g, { x: mid.x, y: mid.y - room.sy * 20 + (room.sy > 0 ? 0 : 14) }, sideLab(room, "a").t, COL.gd, 20);
    }

    line(g, E, { x: E.x + ref.x * 120, y: E.y }, COL.st, 2, "3 6");
    var arcDir = beamDir || { x: room.sx * cosd(room.th), y: -room.sy * sind(room.th) };
    angleArc(g, E, ref, arcDir, 46, angleLab(room));

    if (!full && aim) {
      var len = 150;
      line(g, E, { x: E.x + aim.x * len, y: E.y + aim.y * len }, "rgba(34,227,255,.5)", 2, "4 8");
      if (room.known.L) text(g, { x: E.x + aim.x * (len + 16), y: E.y + aim.y * (len + 16) - 10 }, "power " + num(room.L) + " m", COL.wh, 18, room.sx > 0 ? "start" : "end");
    }

    drawEmitter(top, E, beamDir || ref);
    if (full) drawSensor(top, T, room.cleared ? COL.ok : COL.gd, !room.cleared);
    if (temp.sensorAt) drawSensor(top, P(room, temp.sensorAt), COL.gd, false);
  }

  function drawMirrorRoom(room, g, top, temp) {
    var bx = room.box;
    var E = P(room, room.E), M = P(room, room.M), S = P(room, room.S), C1 = P(room, room.C1), C2 = P(room, room.C2);
    var tl = P(room, { x: bx.minX, y: bx.maxY }), br = P(room, { x: bx.maxX, y: bx.minY });

    line(g, { x: tl.x, y: tl.y }, { x: br.x, y: tl.y }, "#8fa3b8", 5);
    text(g, { x: tl.x + 16, y: tl.y + 30 }, "MIRROR WALL", "rgba(214,244,255,.55)", 14, "start");

    var xL = bx.minX * 0.5;
    dimLine(g, P(room, { x: xL, y: 0 }), P(room, { x: xL, y: room.h1 }), { t: "h₁ = " + num(room.h1) + " m", c: COL.wh }, 1, 0.72);
    var xR = room.S.x + (bx.maxX - room.S.x) * 0.55;
    dimLine(g, P(room, { x: xR, y: room.h1 }), P(room, { x: xR, y: room.h1 - room.h2 }), { t: "h₂ = " + num(room.h2) + " m", c: COL.wh }, -1, 0.35);

    var thKnown = room.known.th || room.solved.th != null;
    var thVal = room.known.th ? room.th : room.solved.th;
    var showX1 = room.known.x1 || room.solved.x1 != null;

    if (room.mirrorShown && showX1) {
      line(g, E, C1, COL.st, 2, "7 7");
      line(g, M, C1, COL.st, 2, "7 7");
      rightMark(g, C1, unit(C1, E), unit(C1, M));
      sideLabel(g, E, C1, mirLab(room, "x1", "x₁"), { x: C1.x, y: C1.y - 80 });
    } else {
      line(g, E, { x: E.x + 120, y: E.y }, COL.st, 2, "3 6");
    }
    if (!room.mirrorShown) {
      rail(g, P(room, { x: 0.4, y: room.h1 - 0.25 }), P(room, { x: bx.maxX - 0.4, y: room.h1 - 0.25 }));
      var xl = mirLab(room, "x1", "x₁");
      if (xl) text(g, { x: P(room, { x: (bx.maxX * 0.4), y: room.h1 }).x, y: tl.y + 46 }, xl.t, xl.c, 20);
    }

    if (room.mirrorShown) line(g, E, M, "rgba(34,227,255,.3)", 2, "4 8");
    var l1 = room.steps.some(function (s) { return s.ask === "L1"; });
    if (l1 && room.mirrorShown) {
      var lab = room.solved.L1 != null ? { t: "leg 1 = " + dp1(room.solved.L1) + " m", c: COL.ok } : { t: "leg 1 = ?", c: COL.gd };
      sideLabel(g, E, M, lab, { x: C1.x, y: C1.y });
    }

    if (room.sensorShown) {
      line(g, M, C2, COL.st, 2, "7 7");
      line(g, C2, S, COL.st, 2, "7 7");
      line(g, M, S, "rgba(34,227,255,.3)", 2, "4 8");
      rightMark(g, C2, unit(C2, M), unit(C2, S));
      sideLabel(g, C2, S, mirLab(room, "x2", "x₂"), { x: C2.x, y: C2.y - 80 });
    } else {
      var railStart = room.mirrorShown ? room.M.x : 0.4;
      rail(g, P(room, { x: railStart, y: room.S.y }), P(room, { x: bx.maxX - 0.3, y: room.S.y }));
      if (room.mirrorShown) line(g, M, C2, COL.st, 2, "7 7");
      var x2l = mirLab(room, "x2", "x₂");
      var midX = (room.mirrorShown ? room.M.x : 0) + (bx.maxX - (room.mirrorShown ? room.M.x : 0)) * 0.42;
      if (x2l) text(g, { x: P(room, { x: midX, y: 0 }).x, y: P(room, { x: 0, y: room.S.y }).y + 30 }, x2l.t, x2l.c, 20);
    }

    var toM = thKnown ? { x: cosd(thVal), y: -sind(thVal) } : unit(E, M);
    if (room.mirrorShown) toM = unit(E, M);
    angleArc(g, E, { x: 1, y: 0 }, toM, 46, room.known.th ? { t: "θ = " + num(room.th) + "°", c: COL.wh } : room.solved.th != null ? { t: dp1(room.solved.th) + "°", c: COL.ok } : { t: "θ = ?", c: COL.gd });
    if (!room.mirrorShown && thKnown) line(g, E, { x: E.x + toM.x * 150, y: E.y + toM.y * 150 }, "rgba(34,227,255,.5)", 2, "4 8");
    if (room.mirrorShown) angleArc(g, M, { x: 1, y: 0 }, unit(M, S), 34, { t: "θ", c: "rgba(255,198,90,.85)" });

    if (room.mirrorShown) drawMirrorPanel(top, room, room.M.x, room.beams.length > 0);
    if (temp.mirrorAt) drawMirrorPanel(top, room, temp.mirrorAt.x, false);
    drawEmitter(top, E, thKnown || room.mirrorShown ? toM : { x: 1, y: 0 });
    if (room.sensorShown) drawSensor(top, S, room.cleared ? COL.ok : COL.gd, !room.cleared);
    if (temp.sensorAt) drawSensor(top, P(room, temp.sensorAt), COL.gd, false);
  }

  /* ---------- shot geometry (metres) ---------- */

  function rayBox(room, p, d) {
    var bx = room.box, e = 0.08, ts = [];
    if (d.x > 1e-9) ts.push((bx.maxX - e - p.x) / d.x);
    if (d.x < -1e-9) ts.push((bx.minX + e - p.x) / d.x);
    if (d.y > 1e-9) ts.push((bx.maxY - e - p.y) / d.y);
    if (d.y < -1e-9) ts.push((bx.minY + e - p.y) / d.y);
    var t = Infinity;
    ts.forEach(function (x) { if (x > 0 && x < t) t = x; });
    if (!isFinite(t)) t = 0;
    return { x: p.x + d.x * t, y: p.y + d.y * t };
  }

  function alongPath(pts, len) {
    var out = [pts[0]], left = len;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = dist(a, b);
      if (d >= left) {
        out.push({ x: a.x + (b.x - a.x) * left / d, y: a.y + (b.y - a.y) * left / d });
        return out;
      }
      out.push(b);
      left -= d;
    }
    return out;
  }

  function clampIn(room, p) {
    var bx = room.box, e = 0.35;
    return { x: clamp(p.x, bx.minX + e, bx.maxX - e), y: clamp(p.y, bx.minY + e, bx.maxY - e) };
  }

  function triVisual(room, step, v, ok) {
    var E = room.E, Tt = room.T;
    switch (step.ask) {
      case "th": {
        if (ok) return { path: [E, Tt], end: "hit" };
        var ang = clamp(v, 0.5, 89.5);
        return { path: [E, rayBox(room, E, { x: room.sx * cosd(ang), y: room.sy * sind(ang) })], end: "alarm" };
      }
      case "b":
        return { path: [E, Tt], end: ok ? "hit" : "alarm", sensorAt: ok ? null : clampIn(room, { x: Tt.x, y: room.sy * v }) };
      case "a":
        return { path: [E, Tt], end: ok ? "hit" : "alarm", sensorAt: ok ? null : clampIn(room, { x: room.sx * v, y: Tt.y }) };
      default: {
        var ext = rayBox(room, Tt, unit(E, Tt));
        if (ok) return { path: [E, Tt], end: "hit" };
        return { path: alongPath([E, Tt, ext], Math.max(0.3, v)), end: v < room.L ? "fizzle" : "alarm" };
      }
    }
  }

  function mirrorVisual(room, step, v, ok) {
    var E = room.E, Mm = room.M, S = room.S;
    var full = [E, Mm, S, rayBox(room, S, unit(Mm, S))];
    switch (step.ask) {
      case "th": {
        if (ok) return { path: [E, Mm], end: "hit" };
        var ang = clamp(v, 1, 89);
        return { path: [E, rayBox(room, E, { x: cosd(ang), y: sind(ang) })], end: "alarm" };
      }
      case "x1":
        return { path: [E, Mm], end: ok ? "hit" : "alarm", mirrorAt: ok ? null : { x: clamp(v, room.box.minX + 0.6, room.box.maxX - 0.6) } };
      case "x2":
        return { path: [Mm, S], end: ok ? "hit" : "alarm", sensorAt: ok ? null : clampIn(room, { x: Mm.x + v, y: S.y }) };
      case "L1":
        if (ok) return { path: [E, Mm], end: "hit", replace: true };
        return { path: alongPath(full, Math.max(0.3, v)), end: v < room.L1 ? "fizzle" : "alarm" };
      default:
        if (ok) return { path: [E, Mm, S], end: "hit", replace: true };
        return { path: alongPath(full, Math.max(0.3, v)), end: v < room.Ltot ? "fizzle" : "alarm" };
    }
  }

  function animateBeam(room, pathM, done) {
    var g = state.gen;
    var pts = pathM.map(function (p) { return P(room, p); });
    var lens = [], total = 0;
    for (var i = 1; i < pts.length; i++) { var d = dist(pts[i - 1], pts[i]); lens.push(d); total += d; }
    var els = beamEls(drawLayers.beams, [pts[0], pts[0]]);
    var dur = Math.min(950, 260 + total * 0.9), t0 = null;
    function partial(len) {
      var out = [pts[0]], left = len;
      for (var j = 1; j < pts.length; j++) {
        if (lens[j - 1] >= left) {
          var a = pts[j - 1], b = pts[j], k = lens[j - 1] ? left / lens[j - 1] : 0;
          out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
          return out;
        }
        out.push(pts[j]);
        left -= lens[j - 1];
      }
      return out;
    }
    function frame(ts) {
      if (g !== state.gen) return;
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - k, 2);
      var a = ptsAttr(partial(total * e));
      els[0].setAttribute("points", a);
      els[1].setAttribute("points", a);
      if (k < 1) requestAnimationFrame(frame);
      else done(pts[pts.length - 1]);
    }
    requestAnimationFrame(frame);
  }

  function burst(p, color) {
    var g = drawLayers.fx;
    sv("circle", { cx: p.x, cy: p.y, r: 12, fill: "none", stroke: color, "stroke-width": 4, class: "lv-burst" }, g);
    sv("circle", { cx: p.x, cy: p.y, r: 6, fill: color, filter: "url(#lvGlow)" }, g);
  }

  /* ================================================================
   * Puzzle flow
   * ================================================================ */

  function curStep() { return state.room.steps[state.room.stepIdx]; }

  function say(msg, face, tone) {
    echoImg.src = ART + "echo-" + (face || "smile") + ".png" + V;
    echoText.textContent = msg;
    echoBox.className = "lv-echo" + (tone ? " " + tone : "");
  }

  function chipsFor(room) {
    if (room.kind !== "tri") return [];
    var names = { a: "adjacent", b: "opposite", L: "hypotenuse" };
    var out = [];
    if (room.known.th) out.push("θ = " + num(room.th) + "°");
    ["b", "a", "L"].forEach(function (k) { if (room.known[k]) out.push(names[k] + " = " + num(room[k]) + " m"); });
    if (room.ask === "a") out.push("d = adjacent");
    if (room.ask === "b") out.push("d = opposite");
    if (room.ask === "L") out.push("power = hypotenuse");
    return out;
  }

  function startRoom(room, ctx) {
    state.room = room;
    state.roomCtx = ctx;
    state.busy = false;
    state.hintLevel = 0;
    room.stepIdx = 0;
    room.beams = [];
    room.solved = {};
    room.playerTh = null;
    room.cleared = false;
    room.sensorShown = room.initSensor;
    room.mirrorShown = room.initMirror;
    setBg(ctx.bg, { dim: true });
    if (ctx.music) setBed(ctx.music);
    layoutRoom(room);
    drawRoom(room);
    board.classList.add("on");
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add("on"); });
    if (ctx.time) {
      state.timer = ctx.time;
      state.timerOn = true;
      state.timerKind = "room";
    } else if (state.timerKind === "room") {
      state.timerOn = false;
      state.timerKind = null;
    }
    renderPanel(true);
    updateHud();
  }

  function renderPanel(first) {
    var room = state.room, step = curStep(), ctx = state.roomCtx;
    pWhere.textContent = ctx.where;
    pCount.textContent = ctx.count;
    pTitle.textContent = step.title;
    pTask.innerHTML = step.task(room);
    pSteps.innerHTML = "";
    pSteps.hidden = room.steps.length < 2;
    room.steps.forEach(function (s, i) {
      pSteps.appendChild(el("i", i < room.stepIdx ? "done" : i === room.stepIdx ? "now" : ""));
    });
    var chips = ctx.support ? chipsFor(room) : [];
    pKnow.innerHTML = chips.map(function (c) { return "<span>" + c + "</span>"; }).join("");
    pKnow.hidden = !chips.length;
    pAsk.textContent = ASK_LABEL[step.ask];
    pUnit.textContent = step.unit;
    input.value = "";
    input.disabled = false;
    fireBtn.disabled = false;
    hintBtn.disabled = false;
    fireBtn.hidden = false;
    hintBtn.hidden = false;
    nextBtn.hidden = true;
    state.hintLevel = 0;
    say(first && room.tip ? room.tip : step.tip, room.face || "smile");
    focusInput();
  }

  function focusInput() {
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  }

  function diagnose(room, step, v, ans) {
    var list = step.wrongs(room);
    for (var i = 0; i < list.length; i++) if (nearWrong(v, list[i].v)) return list[i].m;
    if (step.kind === "angle") {
      if (v <= 0 || v >= 90) return "In a right-angled triangle, θ has to be between 0° and 90°.";
      return (v > ans ? "Too steep" : "Too shallow") + ": the beam missed the sensor. " + SIDE_RULE;
    }
    if (step.ask === "L" || step.ask === "L1" || step.ask === "Ltot") {
      var leg = room.kind === "tri" ? Math.max(room.known.a ? room.a : 0, room.known.b ? room.b : 0) : 0;
      if (leg && v <= leg) return "The hypotenuse is always the longest side, so the power must be more than " + num(leg) + " m.";
      return (v < ans ? "Not enough power: the beam fizzled out before the sensor. " : "Too much power: the beam flew past the sensor into the alarm plate. ") + "Check which ratio links what you know.";
    }
    return (v > ans ? "Too far" : "Not far enough") + ": the beam missed the sensor. " + SIDE_RULE;
  }

  function fire() {
    if (state.busy || !state.room || state.room.cleared || state.talk) return;
    ensureAudio();
    var room = state.room, step = curStep();
    var parsed = parseAnswer(input.value);
    if (!parsed) {
      say("I can't read that. Type a number like 32.5, or an exact value like 6√3.", "focus");
      SFX.click();
      focusInput();
      return;
    }
    var v = parsed.value;
    var ans = step.calc(room, room.th);
    var ok = closeEnough(v, ans, step.kind);
    if (!ok && step.usesTh && room.playerTh != null) ok = closeEnough(v, step.calc(room, room.playerTh), step.kind);
    state.busy = true;
    input.disabled = true;
    fireBtn.disabled = true;
    hintBtn.disabled = true;
    var vis = step.visual(room, step, ok ? ans : v, ok);
    drawRoom(room, { sensorAt: vis.sensorAt, mirrorAt: vis.mirrorAt });
    SFX.laser();
    animateBeam(room, vis.path, function (endPx) {
      if (vis.end === "hit") { burst(endPx, COL.ok); SFX.hit(); }
      else if (vis.end === "fizzle") { burst(endPx, "#ff9d3b"); SFX.fizzle(); }
      else { burst(endPx, COL.rd); }
      later(ok ? 420 : 600, function () {
        if (ok) onCorrect(room, step, parsed, vis, ans);
        else onWrong(room, step, v, ans);
      });
    });
  }

  function onCorrect(room, step, parsed, vis, ans) {
    var v = parsed.value;
    if (step.ask === "th") room.playerTh = v;
    room.solved[step.ask] = v;
    if (vis.replace) room.beams = [vis.path];
    else room.beams.push(vis.path);
    step.apply(room);
    room.stepIdx++;
    var exact = parsed.exact && step.kind === "length" && Math.abs(ans * 10 - Math.round(ans * 10)) > 1e-6;
    if (exact) {
      state.stats.exact++;
      if (state.mode === "speed") state.score += 50;
    }
    var last = room.stepIdx >= room.steps.length;
    if (last) {
      room.cleared = true;
      state.stats.rooms++;
      if (state.timerKind === "room") { state.timerOn = false; state.timerKind = null; }
      if (state.mode === "speed") state.score += 100;
      SFX.win();
    }
    drawRoom(room);
    if (exact) say(pick(WOW), "wow", "wow");
    else say(last ? pick(PRAISE) : pick(STEP_PRAISE), "smile", "good");
    updateHud();
    if (!last) {
      later(1500, function () { state.busy = false; renderPanel(false); drawRoom(room); });
      return;
    }
    if (state.mode === "story") {
      fireBtn.hidden = true;
      hintBtn.hidden = true;
      nextBtn.hidden = false;
      var ch = CHAPTERS[state.chapter];
      nextBtn.textContent = state.roomIdx + 1 >= ch.rooms.length ? "Continue ▸" : "Next room ▸";
      state.busy = false;
      try { nextBtn.focus({ preventScroll: true }); } catch (e) {}
    } else {
      later(1200, nextChallengeRoom);
    }
  }

  function onWrong(room, step, v, ans) {
    var msg = diagnose(room, step, v, ans);
    state.stats.alarms++;
    if (state.mode === "story" && CHAPTERS[state.chapter].id === "sim") {
      SFX.fizzle();
      say(msg + " It's only the simulator, so no alarm. Try again!", "alarm", "bad");
      later(1100, resumeRoom);
      return;
    }
    flashRed();
    SFX.alarm();
    if (state.mode === "story") {
      later(650, function () { alarmScene(msg); });
    } else if (state.mode === "speed") {
      state.timer = Math.max(0, state.timer - SPEED_PENALTY);
      updateHud();
      say(msg + " (−" + SPEED_PENALTY + " s)", "alarm", "bad");
      later(1300, resumeRoom);
    } else if (state.emp > 0) {
      state.emp--;
      updateHud();
      say(msg + " EMP used: " + state.emp + " left.", "alarm", "bad");
      later(1400, resumeRoom);
    } else {
      say(msg, "alarm", "bad");
      later(1400, endChallenge);
    }
  }

  function resumeRoom() {
    var room = state.room;
    if (!room) return;
    drawRoom(room);
    state.busy = false;
    input.disabled = false;
    fireBtn.disabled = false;
    hintBtn.disabled = false;
    focusInput();
    try { input.select(); } catch (e) {}
  }

  function hint() {
    if (state.busy || !state.room || state.room.cleared) return;
    var step = curStep();
    state.hintLevel++;
    state.stats.hints++;
    SFX.click();
    if (state.hintLevel === 1) say(step.rule, "focus");
    else say(step.rule + " So: " + step.sub(state.room), "focus");
    focusInput();
  }

  function alarmScene(msg) {
    hidePuzzle();
    var ch = CHAPTERS[state.chapter];
    var beats = [{ bg: "alarm.png", ken: "ken-a", music: "tension", who: "echo", face: "alarm", lines: [msg] }];
    if (state.emp > 0) {
      state.emp--;
      var left = state.emp;
      beats.push({
        bg: "alarm-emp.png", sfx: "emp", who: "echo", face: "smile",
        onShow: updateHud,
        lines: ["EMP away! The alarm is reset. " + (left ? left + " EMP" + (left > 1 ? "s" : "") + " left on this floor." : "That was your last EMP. Careful now.")],
      });
      talk(beats, function () {
        setBed(ch.music);
        setBg(state.roomCtx.bg, { dim: true });
        board.classList.add("on");
        panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add("on"); });
        if (state.roomCtx.time) { state.timer = state.roomCtx.time; state.timerOn = true; state.timerKind = "room"; }
        updateHud();
        resumeRoom();
      });
    } else {
      beats.push({ bg: "alarm.png", who: "collector", face: "angry", lines: ["Caught you! Nobody beats MY angles!"] });
      talk(beats, caught);
    }
  }

  function roomTimeout() {
    var room = state.room;
    if (!room || room.cleared || state.busy) return;
    state.busy = true;
    input.disabled = true;
    fireBtn.disabled = true;
    hintBtn.disabled = true;
    state.stats.alarms++;
    flashRed();
    SFX.alarm();
    later(650, function () { alarmScene("Time's up! The vault rings locked back on. Be quicker this time."); });
  }

  /* ================================================================
   * Story flow
   * ================================================================ */

  function startStory(chapter, withOpening) {
    newGen();
    resetScreen();
    state.mode = "story";
    state.stats = newStats();
    state.chapter = chapter;
    updateHud();
    if (withOpening) talk(OPENING, function () { playChapter(0); });
    else playChapter(chapter);
  }

  function playChapter(i) {
    var ch = CHAPTERS[i];
    state.chapter = i;
    state.emp = EMP_MAX;
    state.roomIdx = 0;
    updateHud();
    preload([ch.bg].concat(i + 1 < CHAPTERS.length ? [CHAPTERS[i + 1].bg] : []));
    var go = function () { talk(ch.intro, nextStoryRoom); };
    setBed(ch.music);
    if (ch.card) showCard(ch, go);
    else go();
  }

  function nextStoryRoom() {
    var ch = CHAPTERS[state.chapter];
    if (state.roomIdx >= ch.rooms.length) { chapterDone(); return; }
    var def = ch.rooms[state.roomIdx];
    var room = buildRoom(def);
    var begin = function () {
      startRoom(room, {
        where: ch.where,
        count: "Room " + (state.roomIdx + 1) + " / " + ch.rooms.length,
        bg: ch.bg, music: ch.music, support: !!ch.support, time: room.time,
      });
    };
    if (room.teach) talk([{ bg: ch.bg, dim: true, who: "echo", face: room.face || "smile", lines: room.teach }], begin);
    else begin();
  }

  function chapterDone() {
    var i = state.chapter;
    unlock(i + 1);
    hidePuzzle();
    talk(CHAPTERS[i].outro, function () {
      if (i + 1 < CHAPTERS.length) playChapter(i + 1);
      else ending();
    });
  }

  function storyNext() {
    if (!state.room || !state.room.cleared) return;
    SFX.click();
    state.roomIdx++;
    state.room = null;
    hidePuzzle();
    later(250, nextStoryRoom);
  }

  function ending() {
    state.timerOn = false;
    hud.classList.remove("on");
    talk(ENDING, function () {
      var s = state.stats;
      setBg("end-03-return.png", {});
      showResult({
        cls: "light", title: "HEIST COMPLETE", sub: "The Prism Heart is home, and Victor Crane is out of excuses.",
        stats: [[s.rooms, "Rooms cracked"], [s.alarms, "Alarms"], [s.exact, "Exact answers"]],
        buttons: [["Play again", function () { startStory(0, true); }], ["Challenge mode", function () { showTitle("challenge"); }]],
      });
    });
  }

  function caught() {
    var ch = CHAPTERS[state.chapter];
    setBg("alarm.png", {});
    showResult({
      cls: "center caught", title: "CAUGHT", sub: "You ran out of EMPs in " + ch.where + ". Every floor gives you three fresh ones. Try again!",
      stats: [[state.stats.rooms, "Rooms cracked"], [state.stats.alarms, "Alarms"]],
      buttons: [["Retry floor", function () { startStory(state.chapter, false); }], ["Title", function () { showTitle(); }]],
    });
  }

  /* ================================================================
   * Challenge flow
   * ================================================================ */

  function startChallenge(kind) {
    newGen();
    resetScreen();
    state.mode = kind;
    state.stats = newStats();
    state.score = 0;
    state.emp = EMP_MAX;
    setBed("heist");
    updateHud();
    var lines = kind === "speed"
      ? ["Speed Crack: crack as many rooms as you can in two minutes.", "Every wrong answer costs 8 seconds. Exact values earn bonus points. Go!"]
      : ["Clean Run: the rooms never stop, and they keep getting harder.", "You have three EMPs. The fourth alarm ends the run."];
    talk([{ bg: "challenge-bg.png", who: "echo", face: kind === "speed" ? "tease" : "focus", lines: lines }], function () {
      if (kind === "speed") { state.timer = SPEED_TIME; state.timerOn = true; state.timerKind = "speed"; }
      nextChallengeRoom();
    });
  }

  function nextChallengeRoom() {
    var room = randomRoom(state.stats.rooms);
    startRoom(room, {
      where: state.mode === "speed" ? "Speed Crack" : "Clean Run",
      count: "Room " + (state.stats.rooms + 1),
      bg: "challenge-bg.png", support: false, time: 0,
    });
  }

  function endChallenge() {
    newGen();
    var kind = state.mode;
    state.timerOn = false;
    state.busy = true;
    hidePuzzle();
    setBg("challenge-bg.png", { dim: true });
    var s = state.stats, val = kind === "speed" ? state.score : s.rooms;
    var isNew = saveBest(kind, val);
    var best = bests()[kind] || 0;
    if (isNew && val > 0) SFX.win();
    showResult({
      cls: "center", title: kind === "speed" ? "TIME'S UP" : "RUN OVER",
      sub: isNew && val > 0 ? "New best! Echo is updating the leaderboard." : "Crane's lasers win this round. Go again?",
      stats: kind === "speed"
        ? [[state.score, "Score"], [s.rooms, "Rooms"], [s.exact, "Exact"], [best, "Best", true]]
        : [[s.rooms, "Rooms"], [s.exact, "Exact"], [best, "Best", true]],
      buttons: [["Play again", function () { startChallenge(kind); }], ["Title", function () { showTitle("challenge"); }]],
    });
  }

  /* ================================================================
   * Title + results
   * ================================================================ */

  var TITLE_SUB = {
    mode: "A stolen treasure. A tower full of lasers. Only trigonometry can get you in.",
    story: "Pick where to start. New floors unlock as you clear them.",
    challenge: "Random laser rooms. Beat your best.",
  };

  function card(strong, span, em, onClick, disabled) {
    var b = el("button", "lv-card", "<strong>" + strong + "</strong>" + (span ? "<span>" + span + "</span>" : "") + (em ? "<em>" + em + "</em>" : ""));
    b.type = "button";
    if (disabled) b.disabled = true;
    b.addEventListener("click", function (e) { ensureAudio(); SFX.click(); onClick(e); });
    return b;
  }

  function titleStep(step) {
    Array.prototype.forEach.call(title.querySelectorAll("[data-step]"), function (g) {
      g.hidden = g.getAttribute("data-step") !== step;
    });
    titleSub.textContent = TITLE_SUB[step];
    titleBack.hidden = step === "mode";
    var box = title.querySelector('[data-step="' + step + '"]');
    box.innerHTML = "";
    var b = bests();
    if (step === "mode") {
      box.appendChild(card("Story Mode", "Break into Crane Tower: a simulator and four laser floors.", "Start here", function () { titleStep("story"); }));
      box.appendChild(card("Challenge Mode", "Random laser rooms. Beat your best score.", "Speed Crack · Clean Run", function () { titleStep("challenge"); }));
    } else if (step === "story") {
      var open = unlocked();
      box.appendChild(card("New heist", null, "Opening + Simulator", function () { startStory(0, true); }));
      CHAPTERS.forEach(function (ch, i) {
        var locked = i > open;
        var c = card(ch.name, null, locked ? "Locked" : ch.sub, function (e) {
          if (locked && !(e && e.shiftKey)) return;
          startStory(i, false);
        });
        c.classList.toggle("is-locked", locked);
        box.appendChild(c);
      });
    } else {
      box.appendChild(card("Speed Crack", "Two minutes. Crack as many rooms as you can.", b.speed ? "Best: " + b.speed + " pts" : "No score yet", function () { startChallenge("speed"); }));
      box.appendChild(card("Clean Run", "Endless rooms, three EMPs. How far can you go?", b.clean ? "Best: " + b.clean + " rooms" : "No score yet", function () { startChallenge("clean"); }));
    }
  }

  function showTitle(step) {
    newGen();
    resetScreen();
    state.mode = null;
    updateHud();
    setBg("op-01-title.png", {});
    setBed("heist");
    title.hidden = false;
    requestAnimationFrame(function () { title.classList.add("on"); });
    titleStep(step || "mode");
  }

  function showResult(o) {
    result.className = "lv-result " + (o.cls || "");
    result.innerHTML =
      "<h2>" + o.title + "</h2>" +
      '<p class="lv-sub">' + o.sub + "</p>" +
      '<div class="lv-stats">' + o.stats.map(function (s) {
        return '<div class="lv-stat' + (s[2] ? " best" : "") + '"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>";
      }).join("") + "</div>" +
      '<div class="lv-result-btns"></div>';
    var row = result.querySelector(".lv-result-btns");
    o.buttons.forEach(function (b) {
      var btn = el("button", "lv-btn", b[0]);
      btn.type = "button";
      btn.addEventListener("click", function () { SFX.click(); b[1](); });
      row.appendChild(btn);
    });
    result.hidden = false;
    requestAnimationFrame(function () { result.classList.add("on"); });
  }

  /* ================================================================
   * Input wiring
   * ================================================================ */

  fireBtn.addEventListener("click", fire);
  hintBtn.addEventListener("click", hint);
  nextBtn.addEventListener("click", storyNext);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); fire(); }
  });
  Array.prototype.forEach.call(panel.querySelectorAll(".lv-key"), function (k) {
    k.addEventListener("click", function () {
      if (input.disabled) return;
      var s = input.selectionStart == null ? input.value.length : input.selectionStart;
      var e2 = input.selectionEnd == null ? s : input.selectionEnd;
      if (k.hasAttribute("data-del")) {
        if (s === e2 && s > 0) s--;
        input.value = input.value.slice(0, s) + input.value.slice(e2);
      } else {
        var ins = k.getAttribute("data-ins");
        input.value = input.value.slice(0, s) + ins + input.value.slice(e2);
        s += ins.length;
      }
      input.focus();
      input.setSelectionRange(s, s);
    });
  });

  titleBack.addEventListener("click", function () { SFX.click(); titleStep("mode"); });
  skipBtn.addEventListener("click", function (e) { e.stopPropagation(); if (state.talk) state.talk.skip(); });
  menuBtn.addEventListener("click", function (e) { e.stopPropagation(); showTitle(); });
  muteBtn.addEventListener("click", function (e) { e.stopPropagation(); ensureAudio(); setMuted(!audio.muted); });
  fullBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen();
  });

  stage.addEventListener("pointerdown", ensureAudio);
  stage.addEventListener("click", function (e) {
    if (!state.talk) return;
    if (e.target.closest && e.target.closest(".lv-tools, .lv-panel, .lv-title, .lv-result")) return;
    state.talk.advance();
  });

  document.addEventListener("keydown", function (e) {
    if (!stageVisible()) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var isGo = e.code === "Space" || e.key === " " || e.key === "Enter";
    if (!isGo) return;
    if (state.talk) {
      if (tag === "BUTTON" && stage.contains(e.target) && !e.target.closest(".lv-tools")) return;
      e.preventDefault();
      state.talk.advance();
    } else if (state.room && state.room.cleared && !nextBtn.hidden && e.target !== nextBtn) {
      e.preventDefault();
      storyNext();
    }
  });

  var lastTick = Date.now();
  setInterval(function () {
    var now = Date.now(), dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!state.timerOn || state.talk || !stageVisible()) return;
    if (state.timerKind === "room" && state.busy) return;
    state.timer -= dt;
    if (state.timer <= 0) {
      state.timer = 0;
      state.timerOn = false;
      updateHud();
      if (state.timerKind === "speed") {
        state.timerKind = null;
        if (state.busy) later(900, endChallenge);
        else endChallenge();
      } else {
        roomTimeout();
      }
      return;
    }
    updateHud();
  }, 200);

  preload(["op-01-title.png", "op-02-news.png", "op-03-collector.png", "echo-smile.png", "collector-smug.png", "challenge-bg.png"]);
  showTitle();
})();
