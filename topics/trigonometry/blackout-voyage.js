/* JM34 Game 1 — Blackout Voyage.
 * No calculators: fly the airship with exact trigonometry. Every wrong answer costs altitude,
 * and at zero the ship hits the sea and the chapter restarts.
 * Chapters follow JM34 (A) special angles, (B) identities, (C) complementary angles, (D) proofs.
 */
(function () {
  "use strict";

  var root = document.getElementById("bv-stage");
  if (!root) return;

  var ART = "game/";
  var V = "?v=20261104-cockpit4";
  var SAVE_KEY = "jm34-bv-save-v1";
  var MUTE_KEY = "jm34-bv-muted";
  var MAX_ALT = 5;
  var CLIMB_STREAK = 4;

  var NAMES = { kit: "KIT", captain: "CAPTAIN REED", engineer: "ENG. MOSS", quartermaster: "QUARTERMASTER VENN" };
  var FACES = {
    kit: { think: "kit-think.png", shock: "kit-shock.png", joy: "kit-joy.png" },
    captain: { calm: "captain-calm.png", stern: "captain-stern.png", smile: "captain-smile.png", worried: "captain-worried.png" },
    engineer: { focus: "engineer-focus.png", grin: "engineer-grin.png", panic: "engineer-panic.png", cheer: "engineer-cheer.png" },
    quartermaster: { friendly: "quartermaster-friendly.png", nervous: "quartermaster-nervous.png", exposed: "quartermaster-exposed.png" },
  };
  var OPENING = [
    { bg: "op-01-departure.png", music: "calm", lines: ["Dawn. The airship leaves Hong Kong harbour under a clear sky.", "You are Kit — apprentice navigator on your first long voyage."] },
    { bg: "op-02-storm.png", music: "storm", lines: ["By dusk a solar storm rolls in. Lightning crawls along the hull.", "The radio dies. Then every electronic instrument follows."] },
    { bg: "op-03-blackout.png", who: "engineer", face: "panic", lines: ["Every screen is dead. Compass, GPS, the lot.", "We're flying on brass dials and whatever Kit can still calculate."] },
    { bg: "op-04-briefing.png", who: "captain", face: "stern", lines: ["Listen carefully. From this moment, only exact values count.", "A rounded guess of √2 as 1.41 will put us kilometres off course."] },
    { bg: "op-05-navigator.png", who: "kit", face: "think", lines: ["The Clockwork Navigator still works — gears and a unit-length brass arm.", "Sin, cos, tan… that's how we get home."] },
    { bg: "op-04-briefing.png", who: "captain", face: "calm", lines: ["Altitude is your life. Every wrong number costs a thousand feet.", "Drop to the sea and we restart that stretch. Ready?"] },
  ];
  var CH_INTRO = [
    [{ bg: "op-05-navigator.png", who: "kit", face: "think", lines: ["First stretch: mountains ahead. Special angles only — 30°, 45°, 60°."] }],
    [{ bg: "bg-bridge.png", who: "engineer", face: "focus", lines: ["Half the gauges are smashed. Rebuild each triangle from what's left,", "then read sin and cos off the sides."] }],
    [{ bg: "op-02-storm.png", who: "captain", face: "worried", lines: ["Complementary angles: θ and 90° − θ swap sin and cos.", "Use that to rewrite every reading on the board."] }],
    [{ bg: "op-04-briefing.png", who: "quartermaster", face: "nervous", lines: ["Someone has been feeding us false identities.", "Prove the true ones. Spot the forged lines."] }],
  ];
  var ENDING = [
    { bg: "end-01-reveal.png", who: "quartermaster", face: "exposed", lines: ["…Fine. It was me. I cut the instruments so you'd turn back.", "I never wanted this voyage."] },
    { bg: "end-02-landing.png", who: "captain", face: "smile", lines: ["We land on exact values alone. Hong Kong harbour — home."] },
    { bg: "end-03-crew.png", who: "kit", face: "joy", lines: ["No calculator. Just trigonometry. And a crew that trusts the maths."] },
  ];

  function rad(d) { return (d * Math.PI) / 180; }

  /* ─── figures for the sextant puzzles (SVG strings) ─────────────────── */

  function svg(w, hgt, inner) {
    return '<svg viewBox="0 0 ' + w + " " + hgt + '" preserveAspectRatio="xMidYMid meet">' + inner + "</svg>";
  }
  function ln(x1, y1, x2, y2, cls, extra) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + cls + '"' + (extra || "") + "/>";
  }
  function tx(x, y, s, cls, anchor) {
    return '<text x="' + x + '" y="' + y + '" class="' + (cls || "f-txt") + '" text-anchor="' + (anchor || "middle") + '">' + s + "</text>";
  }
  function arc(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(rad(a0)), y0 = cy - r * Math.sin(rad(a0));
    var x1 = cx + r * Math.cos(rad(a1)), y1 = cy - r * Math.sin(rad(a1));
    var sweep = a1 > a0 ? 0 : 1;
    return '<path class="f-arc" d="M' + x0.toFixed(1) + " " + y0.toFixed(1) + " A" + r + " " + r + " 0 0 " + sweep + " " + x1.toFixed(1) + " " + y1.toFixed(1) + '"/>';
  }
  function arcLabel(cx, cy, r, a, s) {
    return tx((cx + r * Math.cos(rad(a))).toFixed(1), (cy - r * Math.sin(rad(a)) + 6).toFixed(1), s, "f-ang");
  }
  function rightMark(x, y, sx, sy) {
    var k = 12;
    return '<path class="f-ra" d="M' + (x + sx * k) + " " + y + " L" + (x + sx * k) + " " + (y + sy * k) + " L" + x + " " + (y + sy * k) + '"/>';
  }
  function shipGlyph(x, y, ghost) {
    return '<g transform="translate(' + x + "," + y + ')"' + (ghost ? ' opacity=".35"' : "") + ">" +
      '<ellipse cx="-26" cy="-14" rx="30" ry="11" class="f-ship"/>' +
      '<rect x="-36" y="-3" width="22" height="7" rx="3" class="f-gon"/>' +
      '<path d="M-56 -14 L-66 -24 L-62 -14 L-66 -4 Z" class="f-gon"/></g>';
  }

  function figSight(o) {
    var S = { x: 90, y: 272 };
    var a = o.a;
    var L = Math.min(320, 214 / Math.tan(rad(a)));
    var F = { x: S.x + L, y: S.y };
    var P = { x: F.x, y: S.y - L * Math.tan(rad(a)) };
    var s = "";
    if (o.obj === "tower") {
      s += '<rect x="' + (P.x - 9) + '" y="' + P.y + '" width="18" height="' + (340 - P.y) + '" class="f-mtn"/>';
      s += ln(P.x, P.y, P.x, P.y - 22, "f-dash");
      s += '<circle cx="' + P.x + '" cy="' + (P.y - 24) + '" r="4" class="f-beacon"/>';
    } else {
      s += '<path class="f-mtn" d="M' + (P.x - 95) + " 340 L" + (P.x - 34) + " " + (P.y + 70) + " L" + P.x + " " + P.y + " L" + (P.x + 54) + " " + (P.y + 62) + " L" + (P.x + 170) + ' 340 Z"/>';
    }
    s += ln(S.x, S.y, F.x + 30, F.y, "f-dash");
    s += ln(F.x, F.y, P.x, P.y, o.unknown === "h" ? "f-line f-unk" : "f-line");
    s += rightMark(F.x, F.y, -1, -1);
    if (o.notch) {
      s += '<line id="bv-sight" x1="' + S.x + '" y1="' + S.y + '" x2="' + (S.x + 420) + '" y2="' + S.y + '" class="f-line f-sight"/>';
    } else {
      s += ln(S.x, S.y, P.x, P.y, "f-line");
    }
    s += arc(S.x, S.y, 44, 0, a);
    s += arcLabel(S.x, S.y, 66, a / 2, o.unknown === "a" ? "θ = ?" : a + "°");
    s += tx(S.x + L / 2, S.y + 26, o.dist);
    s += tx(F.x + 14, (F.y + P.y) / 2 + 6, o.h, o.unknown === "h" ? "f-q" : "f-txt", "start");
    s += shipGlyph(S.x, S.y);
    return svg(560, 340, s);
  }

  function figRope(o) {
    var S = { x: 100, y: 70 };
    var V = 228;
    var L = V / Math.tan(rad(o.a));
    var A = { x: S.x + L, y: S.y + V };
    var s = "";
    s += '<path class="f-mtn" d="M' + (A.x - 70) + " 340 L" + (A.x - 30) + " " + A.y + " L560 " + (A.y - 40) + ' L560 340 Z"/>';
    s += '<rect x="' + (A.x - 5) + '" y="' + (A.y - 18) + '" width="10" height="18" class="f-gon"/>';
    s += ln(S.x, S.y, A.x + 110, S.y, "f-dash");
    s += ln(A.x, S.y, A.x, A.y - 18, "f-dash");
    s += rightMark(A.x, S.y, -1, 1);
    s += ln(S.x, S.y, A.x, A.y - 18, "f-line f-unk");
    s += arc(S.x, S.y, 44, -o.a, 0);
    s += arcLabel(S.x, S.y, 68, -o.a / 2, o.a + "°");
    s += tx(A.x + 12, (S.y + A.y) / 2, o.drop, "f-txt", "start");
    s += tx((S.x + A.x) / 2 - 16, (S.y + A.y) / 2 + 4, o.rope, "f-q", "end");
    s += shipGlyph(S.x, S.y);
    return svg(560, 340, s);
  }

  function figMast(o) {
    var S = { x: 90, y: 180 };
    var L = 170;
    var top = S.y - L * Math.tan(rad(o.up));
    var base = S.y + L * Math.tan(rad(o.down));
    var M = S.x + L;
    var s = "";
    s += '<path class="f-mtn" d="M' + (M - 60) + " 480 L" + (M - 40) + " " + base + " L540 " + (base - 10) + ' L540 480 Z"/>';
    s += ln(M, top, M, base, "f-line f-unk", ' stroke-width="6"');
    for (var y = top + 24; y < base; y += 30) s += ln(M - 7, y, M + 7, y + 14, "f-ra");
    s += ln(S.x, S.y, M + 40, S.y, "f-dash");
    s += ln(S.x, S.y, M, top, "f-line");
    s += ln(S.x, S.y, M, base, "f-line");
    s += rightMark(M, S.y, -1, -1);
    s += arc(S.x, S.y, 36, 0, o.up);
    s += arc(S.x, S.y, 46, -o.down, 0);
    s += arcLabel(S.x, S.y, 58, o.up / 2, o.up + "°");
    s += arcLabel(S.x, S.y, 66, -o.down / 2, o.down + "°");
    s += tx(S.x + L * 0.66, S.y + 24, o.dist);
    s += tx(M + 18, (top + base) / 2 + 40, o.h, "f-q", "start");
    s += shipGlyph(S.x, S.y);
    return svg(560, 480, s);
  }

  function figDouble(o) {
    var A = { x: 70, y: 292 }, B = { x: 301, y: 292 }, F = { x: 416, y: 292 }, P = { x: 416, y: 92 };
    var s = "";
    s += '<path class="f-mtn" d="M348 340 L386 160 L416 92 L448 168 L524 340 Z"/>';
    s += ln(A.x, A.y, F.x + 30, F.y, "f-dash");
    s += ln(F.x, F.y, P.x, P.y, "f-line f-unk");
    s += rightMark(F.x, F.y, -1, -1);
    s += ln(A.x, A.y, P.x, P.y, "f-line");
    s += ln(B.x, B.y, P.x, P.y, "f-line");
    s += arc(A.x, A.y, 50, 0, 30) + arcLabel(A.x, A.y, 74, 15, "30°");
    s += arc(B.x, B.y, 34, 0, 60) + arcLabel(B.x, B.y, 54, 30, "60°");
    s += tx((A.x + B.x) / 2, A.y + 28, o.gap);
    s += tx(F.x + 14, 200, "h = ?", "f-q", "start");
    s += tx(A.x, A.y + 28, "A", "f-ang") + tx(B.x, B.y + 28, "B", "f-ang");
    s += shipGlyph(A.x, A.y, true) + shipGlyph(B.x, B.y);
    return svg(560, 340, s);
  }

  /* ─── chapters ──────────────────────────────────────────────────────── */

  var CHAPTERS = [
    {
      card: { img: "ch1-card.png", kicker: "Chapter 1", name: "Special Angles", sub: "Exact values of sin, cos and tan at 30°, 45° and 60° · rationalizing the denominator" },
      sky: "sky-ch1.png", place: "OVER THE MOUNTAINS", music: "storm",
      puzzles: [
        {
          type: "num", free: true,
          title: "First peak",
          prompt: "Peak <b>120 m</b> ahead, summit on the <b>45°</b> notch. Find the height <b>h</b> above the ship.",
          fig: function () { return figSight({ a: 45, dist: "120 m", h: "h = ?", unknown: "h" }); },
          label: "h =", unit: "m", ans: 120,
          why: "tan 45° = h / 120, and tan 45° = 1. So h = 120 × 1.",
          tip: "Practice — wrong answers cost no altitude.",
          win: "tan 45° = 1 → h = 120 m.",
        },
        {
          type: "num",
          title: "The ridge",
          prompt: "Ridge <b>200 m</b> ahead, top on the <b>60°</b> notch. Find <b>h</b>.",
          fig: function () { return figSight({ a: 60, dist: "200 m", h: "h = ?", unknown: "h" }); },
          label: "h =", unit: "m", ans: 200 * Math.sqrt(3),
          why: "h = 200 × tan 60°, and tan 60° = √3 exactly.",
          tip: "Type √ with the key, or press r.",
          win: "h = 200√3 m.",
        },
        {
          type: "notch",
          title: "Signal tower",
          prompt: "Tower <b>150 m</b> ahead, top <b>50√3 m</b> above the ship. Which notch?",
          fig: function () { return figSight({ a: 30, dist: "150 m", h: "50√3 m", unknown: "a", obj: "tower", notch: true }); },
          ans: 30,
          why: "tan θ = 50√3 / 150 = √3 / 3 = 1 / √3. That's tan 30°.",
          tip: "Find tan θ, then pick the notch.",
          win: "tan θ = √3/3 → θ = 30°.",
        },
        {
          type: "num",
          title: "Mooring rope",
          prompt: "Post <b>30 m</b> below; rope at <b>60°</b> to the horizontal. Find length <b>L</b>.",
          fig: function () { return figRope({ a: 60, drop: "30 m", rope: "L = ?" }); },
          label: "L =", unit: "m", ans: 20 * Math.sqrt(3),
          why: "sin 60° = 30 / L and sin 60° = √3/2. So L = 30 ÷ (√3/2) = 60/√3 — then rationalize.",
          tip: "No √ in the denominator.",
          win: "L = 20√3 m.",
        },
        {
          type: "num",
          title: "Radio mast",
          prompt: "Mast <b>30 m</b> ahead: elevation <b>45°</b> to the top, depression <b>60°</b> to the foot. Find height <b>H</b>.",
          fig: function () { return figMast({ up: 45, down: 60, dist: "30 m", h: "H = ?" }); },
          label: "H =", unit: "m", ans: 30 + 30 * Math.sqrt(3),
          why: "Top part = 30 × tan 45° = 30. Bottom part = 30 × tan 60° = 30√3. Add the two parts.",
          tip: "Add the part above and the part below.",
          win: "H = 30 + 30√3 m.",
        },
        {
          type: "num",
          title: "The last summit",
          prompt: "From <b>A</b>: <b>30°</b> notch. Fly <b>200 m</b> to <b>B</b>: <b>60°</b> notch. Find <b>h</b>.",
          fig: function () { return figDouble({ gap: "200 m" }); },
          label: "h =", unit: "m", ans: 100 * Math.sqrt(3),
          why: "From A the distance is h / tan 30° = √3 h. From B it is h / tan 60° = h / √3. √3 h − h/√3 = 200, so (2/√3) h = 200 and h = 100√3.",
          tip: "Write both distances in terms of h; they differ by 200 m.",
          win: "h = 100√3 m.",
        },
      ],
    },

    {
      card: { img: "ch2-card.png", kicker: "Chapter 2", name: "Basic Identities", sub: "Find the other ratios from one · sin²θ + cos²θ = 1 · tan θ = sin θ / cos θ" },
      sky: "sky-ch2.png", place: "HIGH PASS", music: "storm",
      puzzles: [
        {
          type: "rebuild",
          title: "Given tan θ",
          prompt: "Acute θ with $\\tan\\theta=\\dfrac{5}{12}$. Find $\\sin\\theta$ and $\\cos\\theta$.",
          reading: "\\tan\\theta=\\dfrac{5}{12}",
          sides: { opp: "5", adj: "12", hyp: "13" },
          place: ["opp", "adj"], missing: "hyp", missAns: 13,
          placeWhy: "tan θ = opposite / adjacent: 5 is opposite θ, 12 is next to θ.",
          missWhy: "Pythagoras: hyp² = 5² + 12² = 169.",
          asks: [
            { tex: "\\sin\\theta", ans: 5 / 13, why: "sin θ = opposite / hypotenuse = 5/13." },
            { tex: "\\cos\\theta", ans: 12 / 13, why: "cos θ = adjacent / hypotenuse = 12/13." },
          ],
          tip: "Tap a number, then tap its side.",
          win: "sin θ = 5/13, cos θ = 12/13.",
        },
        {
          type: "rebuild",
          title: "Given cos θ",
          prompt: "Acute θ with $\\cos\\theta=\\dfrac{8}{17}$. Find $\\sin\\theta$ and $\\tan\\theta$.",
          reading: "\\cos\\theta=\\dfrac{8}{17}",
          sides: { opp: "15", adj: "8", hyp: "17" },
          place: ["adj", "hyp"], missing: "opp", missAns: 15,
          placeWhy: "cos θ = adjacent / hypotenuse: 8 is next to θ, 17 is the hypotenuse.",
          missWhy: "Pythagoras: opp² = 17² − 8² = 225.",
          asks: [
            { tex: "\\sin\\theta", ans: 15 / 17, why: "sin θ = opposite / hypotenuse = 15/17." },
            { tex: "\\tan\\theta", ans: 15 / 8, why: "tan θ = opposite / adjacent = 15/8." },
          ],
          tip: "Place the two known sides first.",
          win: "sin θ = 15/17, tan θ = 15/8.",
        },
        {
          type: "rebuild",
          title: "Given sin θ",
          prompt: "Acute θ with $\\sin\\theta=0.2=\\dfrac{1}{5}$. Find $\\cos\\theta$ and $\\tan\\theta$.",
          reading: "\\sin\\theta=0.2=\\dfrac{1}{5}",
          sides: { opp: "1", adj: "2√6", hyp: "5" },
          place: ["opp", "hyp"], missing: "adj", missAns: 2 * Math.sqrt(6),
          placeWhy: "sin θ = opposite / hypotenuse: 1 is opposite θ, 5 is the hypotenuse.",
          missWhy: "Pythagoras: adj² = 5² − 1² = 24, so adj = √24 = 2√6.",
          asks: [
            { tex: "\\cos\\theta", ans: (2 * Math.sqrt(6)) / 5, why: "cos θ = adjacent / hypotenuse = 2√6 / 5." },
            { tex: "\\tan\\theta", ans: Math.sqrt(6) / 12, why: "tan θ = 1 / (2√6). Rationalize: multiply top and bottom by √6 to get √6 / 12." },
          ],
          tip: "Simplest surds; no √ underneath.",
          win: "cos θ = 2√6/5, tan θ = √6/12.",
        },
        {
          type: "steps",
          title: "Simplify (1)",
          prompt: "Simplify $\\sin\\theta-\\cos\\theta\\tan\\theta$.",
          start: "\\sin\\theta-\\cos\\theta\\tan\\theta",
          steps: [
            {
              ok: { tex: "\\sin\\theta-\\cos\\theta\\cdot\\dfrac{\\sin\\theta}{\\cos\\theta}", rule: "tan θ = sin θ / cos θ" },
              bad: [
                { tex: "\\sin\\theta-\\cos\\theta\\cdot\\dfrac{\\cos\\theta}{\\sin\\theta}", why: "That's 1 / tan θ. tan θ = sin θ / cos θ." },
                { tex: "\\sin\\theta-\\tan\\theta", why: "cos θ is multiplied by tan θ — you can't just drop it." },
              ],
            },
            {
              ok: { tex: "\\sin\\theta-\\sin\\theta", rule: "cos θ cancels" },
              bad: [
                { tex: "\\sin\\theta-1", why: "cos θ cancels with cos θ, leaving sin θ — not 1." },
                { tex: "\\sin\\theta-\\sin^2\\theta", why: "There's only one sin θ on top. Nothing gets squared." },
              ],
            },
            {
              ok: { tex: "0", rule: "anything minus itself" },
              bad: [
                { tex: "1", why: "sin θ − sin θ is 0, not 1." },
                { tex: "2\\sin\\theta", why: "It's a subtraction: sin θ − sin θ = 0." },
              ],
            },
          ],
          tip: "Pick the correct next line.",
          win: "Simplifies to 0.",
        },
        {
          type: "steps",
          title: "Simplify (2)",
          prompt: "Simplify $7-7\\sin^2\\theta$.",
          start: "7-7\\sin^2\\theta",
          steps: [
            {
              ok: { tex: "7(1-\\sin^2\\theta)", rule: "take out the common factor 7" },
              bad: [
                { tex: "7(1-\\sin\\theta)^2", why: "Taking 7 out gives 7(1 − sin²θ). Nothing is squared as a bracket." },
                { tex: "0\\cdot\\sin^2\\theta", why: "7 − 7 sin²θ is not (7 − 7) sin²θ — the first 7 isn't multiplied by sin²θ." },
              ],
            },
            {
              ok: { tex: "7\\cos^2\\theta", rule: "1 − sin²θ = cos²θ" },
              bad: [
                { tex: "7\\cos\\theta", why: "From sin²θ + cos²θ = 1, 1 − sin²θ = cos²θ — squared." },
                { tex: "7\\tan^2\\theta", why: "From sin²θ + cos²θ = 1, 1 − sin²θ = cos²θ. No tan here." },
              ],
            },
          ],
          tip: "Factor out 7 first.",
          win: "7 cos²θ.",
        },
        {
          type: "steps",
          title: "Simplify (3)",
          prompt: "Simplify $\\dfrac{1}{\\sin\\theta}-\\dfrac{\\cos^2\\theta}{\\sin\\theta}$.",
          start: "\\dfrac{1}{\\sin\\theta}-\\dfrac{\\cos^2\\theta}{\\sin\\theta}",
          steps: [
            {
              ok: { tex: "\\dfrac{1-\\cos^2\\theta}{\\sin\\theta}", rule: "same denominator — combine" },
              bad: [
                { tex: "\\dfrac{1-\\cos^2\\theta}{\\sin^2\\theta}", why: "Both denominators are sin θ, so the result keeps sin θ. Don't multiply them." },
                { tex: "\\dfrac{1-\\cos\\theta}{\\sin\\theta}", why: "cos²θ stays squared when you combine the fractions." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin^2\\theta}{\\sin\\theta}", rule: "1 − cos²θ = sin²θ" },
              bad: [
                { tex: "\\dfrac{\\sin\\theta}{\\sin\\theta}", why: "1 − cos²θ = sin²θ — squared." },
                { tex: "\\dfrac{\\tan^2\\theta}{\\sin\\theta}", why: "Use sin²θ + cos²θ = 1: 1 − cos²θ = sin²θ." },
              ],
            },
            {
              ok: { tex: "\\sin\\theta", rule: "cancel one sin θ" },
              bad: [
                { tex: "1", why: "sin²θ ÷ sin θ leaves one sin θ." },
                { tex: "\\sin^2\\theta", why: "Dividing by sin θ removes one power of sin θ." },
              ],
            },
          ],
          tip: "Same denominator — combine first.",
          win: "Simplifies to sin θ.",
        },
        {
          type: "steps",
          title: "Simplify (4)",
          prompt: "Simplify $\\dfrac{\\cos^4\\theta-\\sin^4\\theta}{\\sin\\theta+\\cos\\theta}$.",
          start: "\\dfrac{\\cos^4\\theta-\\sin^4\\theta}{\\sin\\theta+\\cos\\theta}",
          steps: [
            {
              ok: { tex: "\\dfrac{(\\cos^2\\theta+\\sin^2\\theta)(\\cos^2\\theta-\\sin^2\\theta)}{\\sin\\theta+\\cos\\theta}", rule: "a² − b² = (a + b)(a − b), with a = cos²θ, b = sin²θ" },
              bad: [
                { tex: "\\dfrac{(\\cos^2\\theta-\\sin^2\\theta)^2}{\\sin\\theta+\\cos\\theta}", why: "a² − b² factorises as (a + b)(a − b), not (a − b)²." },
                { tex: "\\dfrac{\\cos^4\\theta}{\\sin\\theta}-\\dfrac{\\sin^4\\theta}{\\cos\\theta}", why: "You can't split the denominator between the terms like that." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\cos^2\\theta-\\sin^2\\theta}{\\sin\\theta+\\cos\\theta}", rule: "cos²θ + sin²θ = 1" },
              bad: [
                { tex: "\\dfrac{1-\\sin^2\\theta}{\\sin\\theta+\\cos\\theta}", why: "Only the first bracket equals 1. The second bracket, cos²θ − sin²θ, stays." },
                { tex: "\\cos^2\\theta-\\sin^2\\theta", why: "sin θ + cos θ is NOT 1 — only sin²θ + cos²θ = 1." },
              ],
            },
            {
              ok: { tex: "\\dfrac{(\\cos\\theta+\\sin\\theta)(\\cos\\theta-\\sin\\theta)}{\\sin\\theta+\\cos\\theta}", rule: "difference of two squares again" },
              bad: [
                { tex: "\\dfrac{(\\cos\\theta-\\sin\\theta)^2}{\\sin\\theta+\\cos\\theta}", why: "a² − b² = (a + b)(a − b), not (a − b)²." },
                { tex: "\\dfrac{(1-\\sin\\theta)(1+\\sin\\theta)}{\\sin\\theta+\\cos\\theta}", why: "That would be 1 − sin²θ, but the top is cos²θ − sin²θ." },
              ],
            },
            {
              ok: { tex: "\\cos\\theta-\\sin\\theta", rule: "cancel (cos θ + sin θ)" },
              bad: [
                { tex: "\\sin\\theta-\\cos\\theta", why: "What's left is (cos θ − sin θ). Order matters in a subtraction." },
                { tex: "1", why: "Only the (cos θ + sin θ) bracket cancels. (cos θ − sin θ) remains." },
              ],
            },
          ],
          tip: "Difference of two squares.",
          win: "cos θ − sin θ.",
        },
      ],
    },

    {
      card: { img: "ch3-card.png", kicker: "Chapter 3", name: "Complementary Angles", sub: "sin(90° − θ) = cos θ · cos(90° − θ) = sin θ · tan(90° − θ) = 1 / tan θ" },
      sky: "sky-ch3.png", place: "OPEN SEA", music: "storm",
      puzzles: [
        {
          type: "cofn",
          title: "Find θ (1)",
          prompt: "Acute θ with $\\sin\\theta=\\cos 58^\\circ$. Find θ.",
          expr: ["\\sin\\theta", "=", { tex: "\\cos 58^\\circ", to: "\\sin 32^\\circ", alts: ["\\cos 32^\\circ", "\\sin 58^\\circ"], why: "cos(90° − θ) = sin θ, so cos 58° = sin(90° − 58°)." }],
          final: { label: "\\theta =", unit: "°", ans: 32, why: "cos 58° = sin(90° − 58°) = sin 32°, so θ = 32°." },
          tip: "Answer now, or tap the dashed term to rewrite.",
          win: "θ = 32°.",
        },
        {
          type: "cofn",
          title: "Exact value (1)",
          prompt: "Find $\\dfrac{4\\sin 55^\\circ}{\\cos 35^\\circ}$.",
          expr: [{ frac: [["4", { tex: "\\sin 55^\\circ", to: "\\cos 35^\\circ", alts: ["\\sin 35^\\circ", "\\cos 55^\\circ"], why: "sin(90° − θ) = cos θ, so sin 55° = cos(90° − 55°)." }], ["\\cos 35^\\circ"]] }],
          final: { label: "\\text{value} =", ans: 4, why: "sin 55° = cos 35°, so the fraction is 4 cos 35° ÷ cos 35° = 4." },
          tip: "55° + 35° = 90°.",
          win: "Value = 4.",
        },
        {
          type: "cofn",
          title: "Exact value (2)",
          prompt: "Find $2+\\tan 17^\\circ\\tan 73^\\circ$.",
          expr: ["2+\\tan 17^\\circ", { tex: "\\tan 73^\\circ", to: "\\dfrac{1}{\\tan 17^\\circ}", alts: ["\\tan 17^\\circ", "\\dfrac{1}{\\tan 73^\\circ}"], why: "tan(90° − θ) = 1 / tan θ, so tan 73° = 1 / tan(90° − 73°)." }],
          final: { label: "\\text{value} =", ans: 3, why: "tan 73° = 1 / tan 17°, so tan 17° tan 73° = 1 and the value is 2 + 1." },
          tip: "tan(90° − θ) = 1/tan θ.",
          win: "Value = 3.",
        },
        {
          type: "pairs", fn: "sin",
          title: "Sum of squares (1)",
          prompt: "Find $\\sin^2 10^\\circ+\\sin^2 20^\\circ+\\sin^2 40^\\circ+\\sin^2 50^\\circ+\\sin^2 70^\\circ+\\sin^2 80^\\circ$.",
          angles: [10, 20, 40, 50, 70, 80],
          final: { label: "\\text{total} =", ans: 3, why: "sin²80° = cos²10°, so sin²10° + sin²80° = 1. The six terms make three such pairs." },
          pairWhy: "sin²θ + sin²(90° − θ) = sin²θ + cos²θ = 1.",
          tip: "Answer now, or pair cards that add to 90°.",
          win: "Total = 3.",
        },
        {
          type: "cofn",
          title: "Find θ (2)",
          prompt: "Acute θ with $\\cos(\\theta+20^\\circ)=\\sin 24^\\circ$. Find θ.",
          expr: ["\\cos(\\theta+20^\\circ)", "=", { tex: "\\sin 24^\\circ", to: "\\cos 66^\\circ", alts: ["\\sin 66^\\circ", "\\cos 24^\\circ"], why: "sin θ = cos(90° − θ), so sin 24° = cos(90° − 24°)." }],
          final: { label: "\\theta =", unit: "°", ans: 46, why: "sin 24° = cos 66°, so θ + 20° = 66° and θ = 46°." },
          tip: "Same function on both sides first.",
          win: "θ = 46°.",
        },
        {
          type: "steps",
          title: "Simplify",
          prompt: "Simplify $\\dfrac{1}{1+\\tan^2\\theta}$.",
          start: "\\dfrac{1}{1+\\tan^2\\theta}",
          steps: [
            {
              ok: { tex: "\\dfrac{1}{1+\\dfrac{\\sin^2\\theta}{\\cos^2\\theta}}", rule: "tan θ = sin θ / cos θ" },
              bad: [
                { tex: "\\dfrac{1}{1+\\dfrac{\\cos^2\\theta}{\\sin^2\\theta}}", why: "tan θ = sin θ / cos θ, so tan²θ = sin²θ / cos²θ." },
                { tex: "\\dfrac{1}{\\sin^2\\theta+\\cos^2\\theta}", why: "1 + tan²θ is not sin²θ + cos²θ. Rewrite tan²θ first." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\cos^2\\theta}{\\cos^2\\theta+\\sin^2\\theta}", rule: "multiply top and bottom by cos²θ" },
              bad: [
                { tex: "\\dfrac{\\cos^2\\theta}{1+\\sin^2\\theta}", why: "Multiply every term on the bottom by cos²θ: 1 × cos²θ + sin²θ." },
                { tex: "\\dfrac{\\sin^2\\theta}{\\cos^2\\theta+\\sin^2\\theta}", why: "The top is 1, and 1 × cos²θ = cos²θ." },
              ],
            },
            {
              ok: { tex: "\\cos^2\\theta", rule: "cos²θ + sin²θ = 1" },
              bad: [
                { tex: "\\dfrac{\\cos^2\\theta}{2}", why: "cos²θ + sin²θ = 1, not 2." },
                { tex: "\\tan^2\\theta", why: "The bottom becomes 1, leaving cos²θ on top." },
              ],
            },
          ],
          tip: "Rewrite tan²θ first.",
          win: "cos²θ.",
        },
        {
          type: "pairs", fn: "cos",
          title: "Sum of squares (2)",
          prompt: "Find $\\cos^2 5^\\circ+\\cos^2 10^\\circ+\\cdots+\\cos^2 85^\\circ$.",
          angles: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
          lone: 45,
          final: { label: "\\text{total} =", ans: 17 / 2, why: "The 16 other terms make 8 pairs worth 1 each, and cos²45° = (1/√2)² = 1/2." },
          pairWhy: "cos²θ + cos²(90° − θ) = cos²θ + sin²θ = 1.",
          tip: "Answer now, or pair cards. One has no partner — work it out.",
          win: "Total = 17/2.",
        },
      ],
    },

    {
      card: { img: "ch4-card.png", kicker: "Chapter 4", name: "Proving Identities", sub: "Prove step by step · spot the wrong line · hence find θ" },
      sky: "sky-ch4.png", place: "APPROACHING HONG KONG", music: "tension", dry: true,
      puzzles: [
        {
          type: "steps",
          title: "Proof (1)",
          prompt: "Prove $\\sin\\theta\\tan\\theta\\equiv\\dfrac{1}{\\cos\\theta}-\\cos\\theta$.",
          start: "\\sin\\theta\\tan\\theta", startTag: "LHS", endTag: "RHS",
          steps: [
            {
              ok: { tex: "\\sin\\theta\\cdot\\dfrac{\\sin\\theta}{\\cos\\theta}", rule: "tan θ = sin θ / cos θ" },
              bad: [
                { tex: "\\sin\\theta\\cdot\\dfrac{\\cos\\theta}{\\sin\\theta}", why: "tan θ = sin θ / cos θ, not cos θ / sin θ." },
                { tex: "\\tan^2\\theta", why: "sin θ × tan θ is not tan²θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin^2\\theta}{\\cos\\theta}", rule: "multiply" },
              bad: [
                { tex: "\\dfrac{\\sin^2\\theta}{\\cos^2\\theta}", why: "There is only one cos θ on the bottom." },
                { tex: "\\dfrac{2\\sin\\theta}{\\cos\\theta}", why: "sin θ × sin θ = sin²θ, not 2 sin θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{1-\\cos^2\\theta}{\\cos\\theta}", rule: "sin²θ = 1 − cos²θ" },
              bad: [
                { tex: "\\dfrac{1+\\cos^2\\theta}{\\cos\\theta}", why: "sin²θ = 1 − cos²θ (minus, not plus)." },
                { tex: "\\dfrac{\\cos^2\\theta-1}{\\cos\\theta}", why: "sin²θ = 1 − cos²θ. That's the wrong way round." },
              ],
            },
            {
              ok: { tex: "\\dfrac{1}{\\cos\\theta}-\\cos\\theta", rule: "split the fraction" },
              bad: [
                { tex: "\\dfrac{1}{\\cos\\theta}-\\cos^2\\theta", why: "cos²θ ÷ cos θ = cos θ." },
                { tex: "1-\\cos\\theta", why: "1 ÷ cos θ stays as 1/cos θ." },
              ],
            },
          ],
          tip: "Start from the LHS.",
          win: "Proved.",
        },
        {
          type: "steps",
          title: "Proof (2)",
          prompt: "Prove $(2+\\sin\\theta)(2-\\sin\\theta)\\equiv 3+\\cos^2\\theta$.",
          start: "(2+\\sin\\theta)(2-\\sin\\theta)", startTag: "LHS", endTag: "RHS",
          steps: [
            {
              ok: { tex: "4-\\sin^2\\theta", rule: "(a + b)(a − b) = a² − b²" },
              bad: [
                { tex: "4+\\sin^2\\theta", why: "(a + b)(a − b) = a² − b² — minus." },
                { tex: "4-2\\sin\\theta", why: "sin θ × sin θ = sin²θ." },
              ],
            },
            {
              ok: { tex: "4-(1-\\cos^2\\theta)", rule: "sin²θ = 1 − cos²θ" },
              bad: [
                { tex: "4-(1+\\cos^2\\theta)", why: "sin²θ = 1 − cos²θ (minus)." },
                { tex: "4-\\cos^2\\theta", why: "sin²θ is not cos²θ. sin²θ = 1 − cos²θ." },
              ],
            },
            {
              ok: { tex: "3+\\cos^2\\theta", rule: "expand the bracket" },
              bad: [
                { tex: "3-\\cos^2\\theta", why: "Minus a minus: −(−cos²θ) = +cos²θ." },
                { tex: "5-\\cos^2\\theta", why: "4 − 1 = 3, and −(−cos²θ) = +cos²θ." },
              ],
            },
          ],
          tip: "LHS is a difference of squares.",
          win: "Proved.",
        },
        {
          type: "steps",
          title: "Proof (3)",
          prompt: "Prove $\\dfrac{1}{\\sin^2\\theta}\\equiv 1+\\tan^2(90^\\circ-\\theta)$.",
          start: "1+\\tan^2(90^\\circ-\\theta)", startTag: "RHS", endTag: "LHS",
          steps: [
            {
              ok: { tex: "1+\\dfrac{1}{\\tan^2\\theta}", rule: "tan(90° − θ) = 1 / tan θ" },
              bad: [
                { tex: "1+\\tan^2\\theta", why: "tan(90° − θ) is not tan θ. It's 1 / tan θ." },
                { tex: "1+\\cos^2\\theta", why: "tan(90° − θ) = 1 / tan θ." },
              ],
            },
            {
              ok: { tex: "1+\\dfrac{\\cos^2\\theta}{\\sin^2\\theta}", rule: "1 / tan θ = cos θ / sin θ" },
              bad: [
                { tex: "1+\\dfrac{\\sin^2\\theta}{\\cos^2\\theta}", why: "1 / tan θ flips sin/cos into cos/sin." },
                { tex: "1+\\dfrac{1}{\\sin^2\\theta}", why: "1 / tan θ = cos θ / sin θ — the cos θ doesn't vanish." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin^2\\theta+\\cos^2\\theta}{\\sin^2\\theta}", rule: "common denominator" },
              bad: [
                { tex: "\\dfrac{1+\\cos^2\\theta}{\\sin^2\\theta}", why: "The 1 must become sin²θ / sin²θ first." },
                { tex: "\\dfrac{1+\\cos^2\\theta}{1+\\sin^2\\theta}", why: "You can't add tops and bottoms separately." },
              ],
            },
            {
              ok: { tex: "\\dfrac{1}{\\sin^2\\theta}", rule: "sin²θ + cos²θ = 1" },
              bad: [
                { tex: "1", why: "Only the top becomes 1. The bottom sin²θ stays." },
                { tex: "\\dfrac{1}{\\cos^2\\theta}", why: "The bottom is sin²θ, and it doesn't change." },
              ],
            },
          ],
          tip: "Start from the RHS.",
          win: "Proved.",
        },
        {
          type: "spot",
          title: "Spot the wrong line",
          prompt: "This claim is <b>false</b>. Tap the first wrong line.",
          claim: "\\dfrac{1+\\sin\\theta}{\\cos\\theta}\\equiv\\dfrac{\\cos\\theta}{1+\\sin\\theta}",
          lines: [
            { tex: "\\text{LHS}=\\dfrac{1+\\sin\\theta}{\\cos\\theta}", why: "That's just the left-hand side. Nothing wrong yet." },
            { tex: "=\\dfrac{(1+\\sin\\theta)(1+\\sin\\theta)}{\\cos\\theta(1+\\sin\\theta)}", why: "Multiplying top and bottom by the same thing is allowed." },
            { tex: "=\\dfrac{1-\\sin^2\\theta}{\\cos\\theta(1+\\sin\\theta)}", wrong: true },
            { tex: "=\\dfrac{\\cos^2\\theta}{\\cos\\theta(1+\\sin\\theta)}", why: "1 − sin²θ = cos²θ is fine. The trouble starts earlier." },
            { tex: "=\\dfrac{\\cos\\theta}{1+\\sin\\theta}=\\text{RHS}", why: "Cancelling cos θ is fine. Look earlier." },
          ],
          tip: "Watch the algebra, not only the trig.",
          win: "Line 3: (1+sinθ)² ≠ 1−sin²θ.",
        },
        {
          type: "steps",
          title: "Proof (4)",
          prompt: "Prove $\\dfrac{1+\\sin\\theta}{\\cos\\theta}\\equiv\\dfrac{\\cos\\theta}{1-\\sin\\theta}$.",
          start: "\\dfrac{1+\\sin\\theta}{\\cos\\theta}", startTag: "LHS", endTag: "RHS",
          steps: [
            {
              ok: { tex: "\\dfrac{(1+\\sin\\theta)(1-\\sin\\theta)}{\\cos\\theta(1-\\sin\\theta)}", rule: "multiply top and bottom by (1 − sin θ)" },
              bad: [
                { tex: "\\dfrac{(1+\\sin\\theta)(1-\\sin\\theta)}{\\cos\\theta}", why: "Whatever you multiply the top by, you must multiply the bottom by too." },
                { tex: "\\dfrac{1+\\sin\\theta-\\sin\\theta}{\\cos\\theta-\\sin\\theta}", why: "Multiply top and bottom — don't subtract from them." },
              ],
            },
            {
              ok: { tex: "\\dfrac{1-\\sin^2\\theta}{\\cos\\theta(1-\\sin\\theta)}", rule: "(a + b)(a − b) = a² − b²" },
              bad: [
                { tex: "\\dfrac{1+\\sin^2\\theta}{\\cos\\theta(1-\\sin\\theta)}", why: "(1 + sin θ)(1 − sin θ) = 1 − sin²θ (minus)." },
                { tex: "\\dfrac{1-2\\sin\\theta+\\sin^2\\theta}{\\cos\\theta(1-\\sin\\theta)}", why: "That's (1 − sin θ)². Here it's (1 + sin θ)(1 − sin θ) = 1 − sin²θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\cos^2\\theta}{\\cos\\theta(1-\\sin\\theta)}", rule: "1 − sin²θ = cos²θ" },
              bad: [
                { tex: "\\dfrac{\\cos\\theta}{\\cos\\theta(1-\\sin\\theta)}", why: "1 − sin²θ = cos²θ — squared." },
                { tex: "\\dfrac{1}{\\cos\\theta(1-\\sin\\theta)}", why: "1 − sin²θ = cos²θ, not 1." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\cos\\theta}{1-\\sin\\theta}", rule: "cancel one cos θ" },
              bad: [
                { tex: "\\dfrac{1}{1-\\sin\\theta}", why: "cos²θ ÷ cos θ = cos θ." },
                { tex: "\\dfrac{\\cos\\theta}{1+\\sin\\theta}", why: "The bottom bracket is (1 − sin θ) — the same sign slip as the false proof." },
              ],
            },
          ],
          tip: "True form of the false claim above.",
          win: "Proved.",
        },
        {
          type: "steps",
          title: "Prove, then find θ (1)",
          prompt: "(a) Prove $\\dfrac{\\sin\\theta+\\sin\\theta\\cos\\theta}{1+\\cos\\theta-\\sin^2\\theta}\\equiv\\tan\\theta$.",
          start: "\\dfrac{\\sin\\theta+\\sin\\theta\\cos\\theta}{1+\\cos\\theta-\\sin^2\\theta}", startTag: "LHS", endTag: "RHS",
          steps: [
            {
              ok: { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{1+\\cos\\theta-\\sin^2\\theta}", rule: "factorise the top" },
              bad: [
                { tex: "\\dfrac{\\sin^2\\theta\\cos\\theta}{1+\\cos\\theta-\\sin^2\\theta}", why: "Terms that are added don't multiply. Take out the common factor: sin θ(1 + cos θ)." },
                { tex: "\\dfrac{\\sin\\theta\\cos\\theta}{1+\\cos\\theta-\\sin^2\\theta}", why: "Taking sin θ out of the first term leaves 1: sin θ(1 + cos θ)." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\cos^2\\theta+\\cos\\theta}", rule: "1 − sin²θ = cos²θ" },
              bad: [
                { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\cos\\theta+\\cos\\theta}", why: "1 − sin²θ = cos²θ — squared." },
                { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\sin^2\\theta+\\cos\\theta}", why: "1 − sin²θ is cos²θ, not sin²θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\cos\\theta(\\cos\\theta+1)}", rule: "factorise the bottom" },
              bad: [
                { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\cos^3\\theta}", why: "cos²θ + cos θ is a sum, not a product. Take out the common factor cos θ." },
                { tex: "\\dfrac{\\sin\\theta(1+\\cos\\theta)}{\\cos^2\\theta(1+\\cos\\theta)}", why: "Take out just one cos θ: cos²θ + cos θ = cos θ(cos θ + 1)." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin\\theta}{\\cos\\theta}", rule: "cancel (1 + cos θ)" },
              bad: [
                { tex: "\\sin\\theta", why: "Only (1 + cos θ) cancels. cos θ stays on the bottom." },
                { tex: "\\dfrac{1}{\\cos\\theta}", why: "sin θ on top doesn't cancel with anything." },
              ],
            },
            {
              ok: { tex: "\\tan\\theta", rule: "sin θ / cos θ = tan θ" },
              bad: [
                { tex: "\\dfrac{1}{\\tan\\theta}", why: "sin θ / cos θ is tan θ itself." },
                { tex: "\\tan^2\\theta", why: "sin θ / cos θ = tan θ. Nothing is squared." },
              ],
            },
          ],
          then: {
            prompt: "(b) Hence find acute θ if that expression $=\\tan 63^\\circ$.",
            label: "\\theta =", unit: "°", ans: 63,
            why: "By (a), the left-hand side is identical to tan θ. So tan θ = tan 63°.",
          },
          tip: "Factorise top and bottom.",
          win: "θ = 63°.",
        },
        {
          type: "steps",
          title: "Prove, then find θ (2)",
          prompt: "(a) Prove $\\dfrac{1}{2}\\left[\\dfrac{\\tan\\theta}{\\cos\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]\\times\\sin^2(90^\\circ-\\theta)\\equiv\\sin\\theta$.",
          start: "\\dfrac{1}{2}\\left[\\dfrac{\\tan\\theta}{\\cos\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]\\times\\sin^2(90^\\circ-\\theta)", startTag: "LHS", endTag: "RHS",
          steps: [
            {
              ok: { tex: "\\dfrac{1}{2}\\left[\\dfrac{\\sin\\theta}{\\cos^2\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]\\times\\sin^2(90^\\circ-\\theta)", rule: "tan θ / cos θ = sin θ / cos²θ" },
              bad: [
                { tex: "\\dfrac{1}{2}\\left[\\dfrac{\\sin\\theta}{\\cos\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]\\times\\sin^2(90^\\circ-\\theta)", why: "tan θ / cos θ = (sin θ / cos θ) ÷ cos θ — you still need to divide by cos θ again." },
                { tex: "\\dfrac{1}{2}\\left[\\dfrac{1}{\\sin\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]\\times\\sin^2(90^\\circ-\\theta)", why: "tan θ / cos θ = sin θ / cos²θ, not 1 / sin θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{1}{2}\\left[\\dfrac{\\sin\\theta}{\\cos^2\\theta}+\\dfrac{\\sin\\theta}{\\cos^2\\theta}\\right]\\times\\cos^2\\theta", rule: "cos(90° − θ) = sin θ, sin(90° − θ) = cos θ" },
              bad: [
                { tex: "\\dfrac{1}{2}\\left[\\dfrac{\\sin\\theta}{\\cos^2\\theta}+\\dfrac{\\cos\\theta}{\\cos^2\\theta}\\right]\\times\\sin^2\\theta", why: "cos(90° − θ) = sin θ and sin(90° − θ) = cos θ — the function switches." },
                { tex: "\\dfrac{1}{2}\\left[\\dfrac{\\sin\\theta}{\\cos^2\\theta}+\\dfrac{\\sin\\theta}{\\cos^2\\theta}\\right]\\times\\sin^2\\theta", why: "sin(90° − θ) = cos θ, so sin²(90° − θ) = cos²θ." },
              ],
            },
            {
              ok: { tex: "\\dfrac{\\sin\\theta}{\\cos^2\\theta}\\times\\cos^2\\theta", rule: "½ × 2 sin θ / cos²θ" },
              bad: [
                { tex: "\\dfrac{2\\sin\\theta}{\\cos^2\\theta}\\times\\cos^2\\theta", why: "Don't forget the ½: ½ × 2 sin θ / cos²θ = sin θ / cos²θ." },
                { tex: "\\dfrac{\\sin^2\\theta}{\\cos^4\\theta}\\times\\cos^2\\theta", why: "Adding two equal fractions doubles them; it doesn't square them." },
              ],
            },
            {
              ok: { tex: "\\sin\\theta", rule: "cancel cos²θ" },
              bad: [
                { tex: "\\sin\\theta\\cos^2\\theta", why: "÷ cos²θ then × cos²θ cancels completely." },
                { tex: "1", why: "Only cos²θ cancels. sin θ remains." },
              ],
            },
          ],
          then: {
            prompt: "(b) Hence find acute θ if $\\dfrac{1}{2}\\left[\\dfrac{\\tan\\theta}{\\cos\\theta}+\\dfrac{\\cos(90^\\circ-\\theta)}{\\cos^2\\theta}\\right]=\\dfrac{1}{\\cos\\theta}$.",
            label: "\\theta =", unit: "°", ans: 45,
            why: "From (a), the bracket part equals sin θ / cos²θ. So sin θ / cos²θ = 1 / cos θ, which gives sin θ = cos θ, i.e. tan θ = 1.",
          },
          tip: "Rewrite as sin / cos first.",
          win: "θ = 45°.",
        },
      ],
    },
  ];

  /* ─── state + save ──────────────────────────────────────────────────── */

  var state = {
    gen: 0, mode: "title", chapter: 0, pi: 0, alt: MAX_ALT, streak: 0,
    wrong: 0, crashes: 0, chWrong: 0, runStars: [], zapTimer: null, puzzle: null, cut: false,
  };

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

  /* ─── helpers ──────────────────────────────────────────────────────── */

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function texHTML(s) {
    if (window.katex) {
      try { return window.katex.renderToString(s, { throwOnError: false }); } catch (e) {}
    }
    return s.replace(/</g, "&lt;");
  }
  function rich(s) {
    return s.split("$").map(function (part, i) { return i % 2 ? texHTML(part) : part; }).join("");
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

  /* ─── DOM ──────────────────────────────────────────────────────────── */

  var SHIP_SVG =
    '<svg viewBox="0 0 240 124" aria-hidden="true">' +
    '<path d="M30 46 L6 22 L16 50 L6 78 L30 58 Z" fill="#8b5a2b" stroke="#4a2f14" stroke-width="2"/>' +
    '<path d="M22 50 C22 22 72 8 132 8 C192 8 228 28 230 50 C228 72 192 90 132 90 C72 90 22 78 22 50 Z" fill="#efe3c8" stroke="#6b4f2a" stroke-width="2.5"/>' +
    '<g fill="none" stroke="#b9a37a" stroke-width="1.6"><path d="M64 14 C56 34 56 66 64 86"/><path d="M98 9 C92 32 92 68 98 90"/><path d="M134 8 C130 32 130 68 134 90"/><path d="M170 10 C166 32 166 68 170 88"/><path d="M204 20 C200 38 200 62 204 80"/></g>' +
    '<path d="M24 56 C84 64 170 64 229 54" fill="none" stroke="#b91c1c" stroke-width="4"/>' +
    '<path d="M24 61 C84 69 170 69 228 59" fill="none" stroke="#d4a43a" stroke-width="1.6"/>' +
    '<g stroke="#4a2f14" stroke-width="2"><line x1="104" y1="88" x2="98" y2="98"/><line x1="166" y1="88" x2="172" y2="98"/></g>' +
    '<rect x="92" y="96" width="88" height="20" rx="8" fill="#5b3a1e" stroke="#2f1d0c" stroke-width="2"/>' +
    '<g fill="#fcd34d"><circle cx="104" cy="106" r="3.2"/><circle cx="116" cy="106" r="3.2"/><circle cx="128" cy="106" r="3.2"/><circle cx="140" cy="106" r="3.2"/><circle cx="152" cy="106" r="3.2"/></g>' +
    '<path d="M166 98 Q182 102 178 114 L166 114 Z" fill="#93c5fd" opacity=".8"/>' +
    '<line x1="70" y1="84" x2="56" y2="102" stroke="#4a2f14" stroke-width="2.5"/>' +
    '<ellipse class="prop" cx="54" cy="104" rx="3" ry="13" fill="#d4a43a"/>' +
    '<line x1="196" y1="82" x2="208" y2="98" stroke="#4a2f14" stroke-width="2.5"/>' +
    '<ellipse class="prop" cx="210" cy="100" rx="3" ry="12" fill="#d4a43a"/>' +
    "</svg>";

  root.innerHTML = "";
  var R = h("div", "bv-root");
  root.appendChild(R);
  // Needle sweeps 270°: 0 ft at −135°, 5000 ft at +135° (clockwise from 12 o'clock).
  function altAngle(v) { return -135 + v * 54; }
  var DIAL_SVG = (function () {
    function pt(v, r) { var a = rad(altAngle(v)); return { x: 60 + r * Math.sin(a), y: 60 - r * Math.cos(a) }; }
    function band(v0, v1, col) {
      var p0 = pt(v0, 41), p1 = pt(v1, 41);
      return '<path d="M' + p0.x.toFixed(1) + " " + p0.y.toFixed(1) + " A41 41 0 " + ((v1 - v0) * 54 > 180 ? 1 : 0) + " 1 " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="5"/>';
    }
    var s = '<svg class="bv-alt-dial" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
      '<radialGradient id="bv-face" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#2a2318"/><stop offset="1" stop-color="#0c0905"/></radialGradient>' +
      '<linearGradient id="bv-brass2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d98a"/><stop offset=".45" stop-color="#b8892f"/><stop offset=".7" stop-color="#7a5418"/><stop offset="1" stop-color="#d9b25a"/></linearGradient></defs>' +
      '<circle cx="60" cy="60" r="57" fill="url(#bv-brass2)" stroke="#2a1c08" stroke-width="2"/>' +
      '<circle cx="60" cy="60" r="50" fill="url(#bv-face)" stroke="#3b2a10" stroke-width="2"/>' +
      band(0, 1, "#ef4444") + band(1, 3, "#f59e0b") + band(3, 5, "#22c55e");
    for (var t = 0; t <= 10; t++) {
      var v = t / 2, a = pt(v, 47), b = pt(v, t % 2 ? 42 : 38);
      s += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="#f6e7c1" stroke-width="' + (t % 2 ? 1.2 : 2.2) + '"/>';
      if (!(t % 2)) { var n = pt(v, 29); s += '<text x="' + n.x.toFixed(1) + '" y="' + (n.y + 4.5).toFixed(1) + '" text-anchor="middle" class="bv-dial-n">' + v + "</text>"; }
    }
    s += '<text x="60" y="84" text-anchor="middle" class="bv-dial-cap">×1000 FT</text>' +
      '<g class="bv-needle"><path d="M58 64 L60 17 L62 64 Z" fill="#f8fafc"/><path d="M58.6 64 L60 74 L61.4 64 Z" fill="#94a3b8"/></g>' +
      '<circle cx="60" cy="60" r="5" fill="url(#bv-brass2)" stroke="#2a1c08" stroke-width="1"/>' +
      '<path d="M22 40 A44 44 0 0 1 70 17" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5" stroke-linecap="round"/>';
    return s + "</svg>";
  })();

  var BOLT_SVG =
    '<svg class="bv-bolt" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M62 0 L40 70 L58 74 L30 140 L50 144 L36 200" fill="none" stroke="rgba(160,200,255,.55)" stroke-width="10" stroke-linejoin="round"/>' +
    '<path d="M62 0 L40 70 L58 74 L30 140 L50 144 L36 200" fill="none" stroke="#f4f8ff" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M40 70 L22 104 M30 140 L14 160" fill="none" stroke="#dbe8ff" stroke-width="2"/></svg>';

  R.innerHTML =
    '<div class="bv-play" hidden>' +
    '  <div class="bv-console">' +
    '    <div class="bv-board">' +
    '      <div class="bv-view">' +
    '        <img class="bv-sky" alt=""><div class="bv-rain"></div>' +
    '        <div class="bv-ship">' + SHIP_SVG + "</div>" +
    '        <div class="bv-hurt"></div><div class="bv-zap"></div>' +
    '        <div class="bv-fig-slot"></div>' +
    '        <div class="bv-alt">' + DIAL_SVG + '<div class="bv-alt-val"></div><div class="bv-streak"></div></div>' +
    '        <div class="bv-place"></div>' +
    "      </div>" +
    '      <div class="bv-side">' +
    '        <div class="bv-con-head"><div class="bv-kicker"></div><h3 class="bv-ptitle"></h3></div>' +
    '        <div class="bv-prompt"></div>' +
    '        <div class="bv-con-body"></div>' +
    '        <div class="bv-pad" aria-label="Keypad"></div>' +
    "      </div>" +
    "    </div>" +
    '    <div class="bv-note"><p class="bv-note-txt"></p><button class="bv-btn bv-next" type="button" hidden>Next ▸</button></div>' +
    "  </div>" +
    '  <div class="bv-cut" hidden><img class="bv-cut-bg" alt=""><div class="bv-rain"></div>' +
    '    <div class="bv-cut-ship">' + SHIP_SVG + "</div>" + BOLT_SVG +
    '    <div class="bv-cut-burst"></div><div class="bv-cut-flash"></div>' +
    '    <div class="bv-cut-cap"></div><div class="bv-cut-skip">Click to skip</div></div>' +
    "</div>" +
    '<div class="bv-overlay bv-title" hidden></div>' +
    '<div class="bv-overlay bv-card" hidden></div>' +
    '<div class="bv-overlay bv-cine" hidden>' +
    '  <img class="bv-cine-bg" alt="">' +
    '  <div class="bv-dialog">' +
    '    <img class="bv-face" alt="" hidden>' +
    '    <div class="bv-dialog-body"><div class="bv-who"></div><p class="bv-line"></p></div>' +
    '    <div class="bv-cine-next">Click ▸</div>' +
    "  </div></div>" +
    '<div class="bv-tools">' +
    '  <button class="bv-tool" type="button" data-t="mute">Sound: on</button>' +
    '  <button class="bv-tool" type="button" data-t="fs">Fullscreen</button>' +
    '  <button class="bv-tool" type="button" data-t="menu">Menu</button>' +
    "</div>" +
    '<div class="bv-fade"></div>';

  function q(sel) { return R.querySelector(sel); }
  var el = {
    play: q(".bv-play"), view: q(".bv-view"), sky: q(".bv-sky"), ship: q(".bv-ship"),
    hurt: q(".bv-hurt"), zap: q(".bv-zap"), alt: q(".bv-alt"), needle: q(".bv-needle"),
    altVal: q(".bv-alt-val"), streak: q(".bv-streak"), place: q(".bv-place"), figSlot: q(".bv-fig-slot"),
    console: q(".bv-console"), pad: q(".bv-pad"), kicker: q(".bv-kicker"), ptitle: q(".bv-ptitle"), prompt: q(".bv-prompt"),
    cut: q(".bv-cut"), cutBg: q(".bv-cut-bg"), cutCap: q(".bv-cut-cap"),
    body: q(".bv-con-body"), note: q(".bv-note"), noteTxt: q(".bv-note-txt"), next: q(".bv-next"),
    title: q(".bv-title"), card: q(".bv-card"),
    cine: q(".bv-cine"), cineBg: q(".bv-cine-bg"), face: q(".bv-face"),
    who: q(".bv-who"), line: q(".bv-line"),
    mute: q('[data-t="mute"]'), fs: q('[data-t="fs"]'), menu: q('[data-t="menu"]'),
    fade: q(".bv-fade"),
  };
  for (var sk = 0; sk < CLIMB_STREAK; sk++) el.streak.appendChild(h("i"));
  el.cutBg.addEventListener("error", function () {
    var sky = ART + CHAPTERS[state.chapter].sky + V;
    if (el.cutBg.src.indexOf(CHAPTERS[state.chapter].sky) < 0) el.cutBg.src = sky;
  });

  /* permanent bottom-right keypad — always on the console */
  var padHook = null;
  var PAD_KEYS = ["7", "8", "9", "√", "(", ")", "4", "5", "6", "/", "+", "−", "1", "2", "3", "0", ".", "⌫"];
  PAD_KEYS.forEach(function (k) {
    var b = h("button", "bv-key" + (/[\d.]/.test(k) ? "" : " op"), k);
    b.type = "button";
    b.addEventListener("click", function () {
      if (!padHook || padHook.locked) return;
      sfx("tick");
      if (k === "⌫") padHook.inp.value = padHook.inp.value.slice(0, -1);
      else padHook.inp.value += k === "−" ? "-" : k;
      padHook.refresh();
    });
    el.pad.appendChild(b);
  });
  var padSend = h("button", "bv-key bv-send", "Check ▸");
  padSend.type = "button";
  padSend.addEventListener("click", function () { if (padHook && padHook.submit) padHook.submit(); });
  el.pad.appendChild(padSend);
  function setPad(hook) {
    padHook = hook || null;
    el.pad.classList.toggle("off", !padHook);
    padSend.textContent = (hook && hook.send) || "Check ▸";
  }
  setPad(null);

  function fadeThrough(fn) {
    el.fade.classList.add("on");
    later(360, function () { fn(); el.fade.classList.remove("on"); });
  }
  function preload(list) {
    list.forEach(function (n) { var i = new Image(); i.src = ART + n + V; });
  }

  /* ─── play screen: altitude, feedback strip ───────────────────────── */

  function updateHud() {
    el.needle.style.transform = "rotate(" + altAngle(state.alt) + "deg)";
    el.altVal.textContent = state.alt * 1000 + " ft";
    el.alt.classList.toggle("warn", state.alt === 2 || state.alt === 3);
    el.alt.classList.toggle("danger", state.alt <= 1);
    el.view.classList.toggle("low", state.alt <= 1);
    var pips = el.streak.children;
    for (var j = 0; j < pips.length; j++) pips[j].classList.toggle("on", j < state.streak);
    el.ship.style.top = 84 - state.alt * 11 + "%";
  }

  function flashScreen(cls) {
    el.console.classList.remove("ok", "climb", "shake");
    void el.console.offsetWidth;
    el.console.classList.add(cls);
  }

  /* full-stage cutaway shown only when altitude is lost */
  var CUT_MS = { bolt: 1800, ice: 1900, sink: 2600 };
  function cutaway(kind, cap, done) {
    var my = state.gen, finished = false, timers = [];
    var ch = CHAPTERS[state.chapter];
    state.cut = true;
    el.cutBg.src = ART + (kind === "ice" ? "iceberg.png" : ch.sky) + V;
    el.cut.className = "bv-cut " + kind + (ch.dry && kind !== "ice" ? " dry" : "");
    el.cutCap.innerHTML = cap;
    el.cut.hidden = false;
    void el.cut.offsetWidth;
    el.cut.classList.add("go");
    function at(ms, fn) { timers.push(setTimeout(function () { if (!finished) fn(); }, ms)); }
    if (kind === "bolt") { at(430, function () { sfx("thunder"); sfx("bad"); }); }
    else if (kind === "ice") { at(720, function () { sfx("crunch"); sfx("bad"); }); }
    else { at(500, function () { sfx("crash"); }); }
    function end() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      el.cut.hidden = true;
      el.cut.classList.remove("go");
      el.cut.onclick = null;
      state.cut = false;
      if (my === state.gen) done();
    }
    at(CUT_MS[kind], end);
    el.cut.onclick = kind === "sink" ? null : function () { sfx("tick"); end(); };
  }

  function note(text, tone) {
    el.note.classList.remove("good", "bad");
    if (tone) el.note.classList.add(tone);
    el.noteTxt.textContent = text || "";
    el.note.classList.toggle("empty", !text && el.next.hidden);
  }

  function clearFig() {
    el.figSlot.innerHTML = "";
    el.play.classList.remove("has-fig");
  }

  function setFig(node) {
    el.figSlot.innerHTML = "";
    if (!node) { el.play.classList.remove("has-fig"); return; }
    el.figSlot.appendChild(node);
    el.play.classList.add("has-fig");
  }

  function enterPlay() {
    var ch = CHAPTERS[state.chapter];
    state.mode = "play";
    el.play.hidden = false;
    el.sky.src = ART + ch.sky + V;
    el.view.classList.toggle("dry", !!ch.dry);
    el.place.textContent = ch.place;
    el.cut.hidden = true;
    state.cut = false;
    clearFig();
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
      el.zap.classList.remove("on");
      void el.zap.offsetWidth;
      el.zap.classList.add("on");
      sfx("thunder");
      scheduleZap();
    });
  }

  function gain() {
    state.streak++;
    if (state.streak >= CLIMB_STREAK) {
      state.streak = 0;
      if (state.alt < MAX_ALT) { state.alt++; sfx("climb"); flashScreen("climb"); }
      else flashScreen("ok");
    } else flashScreen("ok");
    updateHud();
  }

  function shake() {
    el.console.classList.remove("shake");
    void el.console.offsetWidth;
    el.console.classList.add("shake");
  }

  function hurt(why) {
    if (state.mode !== "play" || state.cut) return;
    var p = state.puzzle;
    if (p && p.free) {
      shake();
      sfx("deny");
      note("Practice question — no altitude lost. " + why, "bad");
      return;
    }
    state.alt = Math.max(0, state.alt - 1);
    state.streak = 0;
    state.wrong++;
    state.chWrong++;
    save.wrong = (save.wrong || 0) + 1;
    writeSave(save);
    if (state.alt <= 0) {
      note("Out of altitude! " + why, "bad");
      crash();
      return;
    }
    var ice = state.alt <= 2 && !CHAPTERS[state.chapter].dry;
    note("", "");
    cutaway(ice ? "ice" : "bolt",
      "<b>−1000 ft</b><span>" + (ice ? "Clipped an ice cliff!" : "Lightning strike!") + " Altitude " + state.alt * 1000 + " ft</span>",
      function () {
        updateHud();
        shake();
        el.ship.classList.remove("hit");
        void el.ship.offsetWidth;
        el.ship.classList.add("hit");
        el.hurt.classList.remove("on");
        void el.hurt.offsetWidth;
        el.hurt.classList.add("on");
        note("−1000 ft. " + why, "bad");
      });
  }

  /* hints and rough work: a wrong pick explains itself but costs no altitude */
  function hint(why) {
    sfx("deny");
    shake();
    note(why, "bad");
  }

  /* ─── answer box (exact values + surd keypad) ─────────────────────── */

  function answerBox(o) {
    var box = h("div", "bv-ans" + (o.wide ? " wide" : ""));
    var row = h("div", "bv-ans-row");
    var lab = h("span", "bv-ans-label", texHTML(o.label));
    var inp = document.createElement("input");
    inp.className = "bv-input";
    inp.type = "text";
    inp.setAttribute("inputmode", "none");
    inp.setAttribute("autocomplete", "off");
    inp.spellcheck = false;
    inp.placeholder = "exact value";
    row.appendChild(lab);
    row.appendChild(inp);
    if (o.unit) row.appendChild(h("span", "bv-unit", o.unit));
    var prev = h("div", "bv-preview");
    box.appendChild(row);
    box.appendChild(prev);
    box.appendChild(h("div", "bv-ans-tip", "Use the keypad · type r for √"));

    var hook = { inp: inp, refresh: refresh, submit: submit, locked: false, send: o.send || "Check ▸" };

    function refresh() {
      var v = inp.value.replace(/sqrt/gi, "√").replace(/[rRsSqQ]/g, "√").replace(/[^0-9√()+\-−*×/÷.]/g, "");
      if (v !== inp.value) inp.value = v;
      prev.innerHTML = v ? texHTML(toTex(v)) : "";
    }
    function submit() {
      if (hook.locked || state.cut) return;
      var raw = inp.value.trim();
      if (!raw) return;
      var r = parseAnswer(raw);
      if (!r) {
        sfx("deny");
        note("Can't read that. Use digits, √, /, + and brackets.", "");
        return;
      }
      var close = near(r.v, o.ans);
      if (r.dec) {
        if (close && isRational(o.ans)) return accept();
        if (close || Math.abs(r.v - o.ans) <= 0.01 * Math.abs(o.ans) + 0.005) {
          sfx("deny");
          note("Rounded decimal — give the exact value (use √).", "bad");
          return;
        }
        return reject();
      }
      if (close) {
        if (r.irr && !o.allowIrr) {
          sfx("deny");
          note("Right value — rationalize: no √ underneath.", "");
          return;
        }
        return accept();
      }
      reject();
    }
    function accept() {
      hook.locked = true;
      inp.disabled = true;
      setPad(null);
      sfx("ok");
      gain();
      o.onOk();
    }
    function reject() {
      inp.select();
      hurt(o.why);
    }
    inp.addEventListener("input", refresh);
    inp.addEventListener("focus", function () { setPad(hook); });
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

  /* ─── puzzle widgets ───────────────────────────────────────────────── */

  var W = {};

  W.num = function (p, body, done) {
    setFig(h("div", "bv-fig", p.fig()));
    var panel = h("div", "bv-panel");
    panel.appendChild(answerBox({ label: p.label, unit: p.unit, ans: p.ans, why: p.why, allowIrr: p.allowIrr, onOk: done }));
    body.appendChild(panel);
  };

  W.notch = function (p, body, done) {
    var fig = h("div", "bv-fig", p.fig());
    setFig(fig);
    var right = h("div", "bv-panel bv-notches");
    right.appendChild(h("div", "bv-cap", "SEXTANT NOTCH"));
    var sight = fig.querySelector("#bv-sight");
    var x1 = sight ? +sight.getAttribute("x1") : 0, y1 = sight ? +sight.getAttribute("y1") : 0;
    var busy = false;
    [30, 45, 60].forEach(function (a) {
      var b = h("button", "bv-notch", a + "°");
      b.type = "button";
      b.addEventListener("click", function () {
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
          later(500, done);
        } else {
          b.classList.add("bad");
          hurt(p.why);
        }
      });
      right.appendChild(b);
    });
    body.appendChild(right);
  };

  W.rebuild = function (p, body, done) {
    var SLOT = { adj: [190, 248], opp: [372, 150], hyp: [150, 118] };
    var fig = h("div", "bv-fig");
    var s = '<path d="M50 230 L330 230 L330 55 Z" class="f-tri"/>' + rightMark(330, 230, -1, -1) +
      arc(50, 230, 38, 0, 34) + tx(104, 218, "θ", "f-ang");
    Object.keys(SLOT).forEach(function (k) {
      var c = SLOT[k];
      s += '<g class="bv-slot" data-slot="' + k + '"><rect x="' + (c[0] - 40) + '" y="' + (c[1] - 19) + '" width="80" height="38" rx="8"/>' +
        '<text x="' + c[0] + '" y="' + (c[1] + 7) + '" class="f-txt" text-anchor="middle"></text></g>';
    });
    fig.innerHTML = svg(420, 280, s);
    setFig(fig);
    var right = h("div", "bv-panel bv-col bv-rebuild");
    right.appendChild(h("div", "bv-reading", texHTML(p.reading)));
    var tiles = h("div", "bv-tiles");
    right.appendChild(tiles);
    var gauges = h("div", "bv-gauges");
    right.appendChild(gauges);
    var work = h("div");
    right.appendChild(work);
    body.appendChild(right);

    var slots = {};
    fig.querySelectorAll(".bv-slot").forEach(function (g) { slots[g.getAttribute("data-slot")] = g; });
    function setSlot(k, val, cls) {
      slots[k].querySelector("text").textContent = val;
      slots[k].classList.remove("armed", "ask");
      if (cls) slots[k].classList.add(cls);
    }

    var picked = null, placed = 0;
    shuffle(p.place).forEach(function (k) {
      var t = h("button", "bv-tile", p.sides[k]);
      t.type = "button";
      t.addEventListener("click", function () {
        if (t.classList.contains("used")) return;
        sfx("tick");
        tiles.querySelectorAll(".bv-tile").forEach(function (x) { x.classList.remove("sel"); });
        t.classList.add("sel");
        picked = { key: k, btn: t };
        Object.keys(slots).forEach(function (sk) { if (!slots[sk].classList.contains("filled")) slots[sk].classList.add("armed"); });
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
          Object.keys(slots).forEach(function (sk) { slots[sk].classList.remove("armed"); });
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
      work.innerHTML = "";
      var nm = { opp: "\\text{opposite}", adj: "\\text{adjacent}", hyp: "\\text{hypotenuse}" }[p.missing];
      note("Find the third side.", "");
      work.appendChild(answerBox({
        label: nm + " =", ans: p.missAns, why: p.missWhy, allowIrr: true,
        onOk: function () {
          setSlot(p.missing, p.sides[p.missing], "filled");
          note("Now find the ratios.", "good");
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
      if (i >= p.asks.length) { later(400, done); return; }
      var a = p.asks[i];
      work.innerHTML = "";
      work.appendChild(answerBox({
        label: a.tex + " =", ans: a.ans, why: a.why,
        onOk: function () {
          rows[i].classList.add("done");
          rows[i].querySelector(".v").innerHTML = "✓";
          later(300, function () { askRatio(i + 1); });
        },
      }));
    }
  };

  function stepsWidget(p, body, done) {
    var chain = h("div", "bv-panel bv-chain");
    var opts = h("div", "bv-opts");
    body.appendChild(chain);
    body.appendChild(opts);
    var k = 0;
    function addLine(t, tag, rule) {
      chain.querySelectorAll(".bv-chain-line").forEach(function (x) { x.classList.remove("cur"); });
      var row = h("div", "bv-chain-line cur");
      row.appendChild(h("span", "tag", tag || ""));
      row.appendChild(h("span", "", texHTML(t)));
      if (rule) row.appendChild(h("span", "rule", "← " + rule));
      chain.appendChild(row);
      chain.scrollTop = chain.scrollHeight;
    }
    addLine(p.start, p.startTag || "");
    function showStep() {
      opts.innerHTML = "";
      if (k >= p.steps.length) {
        if (p.endTag) addLine("\\text{" + p.endTag + "}\\ \\checkmark", "", "");
        if (p.then) later(400, showThen);
        else later(400, done);
        return;
      }
      var st = p.steps[k];
      var all = shuffle([{ tex: st.ok.tex, ok: true }].concat(st.bad));
      all.forEach(function (o) {
        var b = h("button", "bv-opt", texHTML("=" + o.tex));
        b.type = "button";
        b.addEventListener("click", function () {
          if (b.classList.contains("bad")) return;
          if (o.ok) {
            sfx("gear");
            sfx("ok");
            gain();
            addLine(o.tex, "=", st.ok.rule);
            k++;
            showStep();
          } else {
            b.classList.add("bad");
            hurt(o.why);
          }
        });
        opts.appendChild(b);
      });
      fitOpts();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitOpts);
    }
    function fitOpts() {
      opts.classList.remove("stack");
      var tight = opts.scrollWidth > opts.clientWidth + 1 ||
        Array.prototype.some.call(opts.children, function (b) { return b.scrollWidth > b.clientWidth + 1; });
      opts.classList.toggle("stack", tight);
    }
    function showThen() {
      var t = p.then;
      opts.hidden = true;
      var box = h("div", "bv-panel bv-then");
      box.appendChild(h("div", "bv-then-q", rich(t.prompt)));
      box.appendChild(answerBox({ label: t.label, unit: t.unit, ans: t.ans, why: t.why, wide: true, onOk: done }));
      body.appendChild(box);
      note("Proved — now part (b).", "good");
    }
    showStep();
  }
  W.steps = stepsWidget;

  function renderExpr(items, onChip) {
    var wrap = h("span", "bv-frac-row");
    items.forEach(function (it) {
      if (typeof it === "string") {
        wrap.appendChild(h("span", "bv-chip", texHTML(it)));
      } else if (it.frac) {
        var f = h("span", "bv-frac");
        f.appendChild(renderExpr(it.frac[0], onChip));
        f.appendChild(h("span", "bv-frac-bar"));
        f.appendChild(renderExpr(it.frac[1], onChip));
        wrap.appendChild(f);
      } else {
        var c = h("button", "bv-chip hint", texHTML(it.tex));
        c.type = "button";
        onChip(it, c);
        wrap.appendChild(c);
      }
    });
    return wrap;
  }

  W.cofn = function (p, body, done) {
    var exprBox = h("div", "bv-panel bv-expr");
    var work = h("div", "bv-rewrite");
    var pick = null;
    exprBox.appendChild(renderExpr(p.expr, function (it, btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("fixed")) return;
        sfx("tick");
        exprBox.querySelectorAll(".bv-chip").forEach(function (x) { x.classList.remove("pick"); });
        btn.classList.add("pick");
        pick = { it: it, btn: btn };
        showChoices();
      });
    }));
    var ans = h("div", "bv-panel");
    ans.appendChild(answerBox({ label: p.final.label, unit: p.final.unit, ans: p.final.ans, why: p.final.why, wide: true, onOk: done }));
    body.appendChild(exprBox);
    body.appendChild(work);
    body.appendChild(ans);
    work.appendChild(h("p", "bv-ans-tip", "Optional: tap the dashed term to rewrite."));

    function showChoices() {
      work.innerHTML = "";
      var grid = h("div", "bv-coupling");
      grid.appendChild(h("div", "bv-cap", "EQUAL TO?"));
      shuffle([pick.it.to].concat(pick.it.alts)).forEach(function (t) {
        var b = h("button", "bv-opt", texHTML(t));
        b.type = "button";
        b.addEventListener("click", function () {
          if (b.classList.contains("bad") || !pick) return;
          if (t === pick.it.to) {
            sfx("gear");
            pick.btn.innerHTML = texHTML(pick.it.to);
            pick.btn.className = "bv-chip fixed";
            pick = null;
            work.innerHTML = "";
            note("Rewritten — type the answer.", "good");
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

  W.pairs = function (p, body, done) {
    var fn = p.fn === "cos" ? "\\cos" : "\\sin";
    var name = p.fn === "cos" ? "cos" : "sin";
    var grid = h("div", "bv-pairs");
    grid.style.gridTemplateColumns = "repeat(" + (p.angles.length > 8 ? 6 : 3) + ", 1fr)";
    var sumLine = h("div", "bv-reading bv-sum", "");
    var ans = h("div", "bv-panel");
    ans.appendChild(answerBox({
      label: p.final.label, ans: p.final.ans, why: p.final.why, wide: true,
      onOk: function () { grid.classList.add("off"); done(); },
    }));
    body.appendChild(grid);
    body.appendChild(sumLine);
    body.appendChild(ans);
    var parts = [], sel = null;
    function updSum() { sumLine.innerHTML = parts.length ? texHTML("=" + parts.join("+") + "+\\cdots") : ""; }
    shuffle(p.angles).forEach(function (a) {
      var b = h("button", "bv-card-t", texHTML(fn + "^2 " + a + "^\\circ"));
      b.type = "button";
      b.addEventListener("click", function () {
        if (b.classList.contains("done") || b.classList.contains("lone")) return;
        if (a === p.lone) {
          sfx("tick");
          b.classList.add("lone");
          parts.push(fn + "^2 45^\\circ");
          if (sel) { sel.b.classList.remove("sel"); sel = null; }
          note("45° has no partner — work out " + name + "²45° yourself.", "");
          updSum();
          return;
        }
        if (!sel) { sfx("tick"); sel = { a: a, b: b }; b.classList.add("sel"); return; }
        if (sel.b === b) { b.classList.remove("sel"); sel = null; return; }
        if (sel.a + a === 90) {
          sfx("gear");
          sel.b.classList.remove("sel");
          sel.b.classList.add("done");
          b.classList.add("done");
          sel.b.innerHTML = texHTML("1");
          b.innerHTML = texHTML("\\checkmark");
          parts.push("1");
          note(name + "²" + Math.min(sel.a, a) + "° + " + name + "²" + Math.max(sel.a, a) + "° = 1. " + p.pairWhy, "good");
          sel = null;
          updSum();
        } else {
          var other = sel.b;
          other.classList.remove("sel");
          [other, b].forEach(function (x) { x.classList.remove("bad"); void x.offsetWidth; x.classList.add("bad"); });
          var why = sel.a + "° + " + a + "° = " + (sel.a + a) + "°, not 90°. Partners must add up to 90°.";
          sel = null;
          hint(why);
        }
      });
      grid.appendChild(b);
    });
  };

  W.spot = function (p, body, done) {
    body.appendChild(h("div", "bv-claim", texHTML("\\text{Claim: }" + p.claim)));
    var log = h("div", "bv-log");
    var busy = false;
    p.lines.forEach(function (ln, i) {
      var b = h("button", "bv-log-line", '<span class="n">LINE ' + (i + 1) + "</span>" + texHTML(ln.tex));
      b.type = "button";
      b.addEventListener("click", function () {
        if (busy || b.classList.contains("bad")) return;
        if (ln.wrong) {
          busy = true;
          b.classList.add("good");
          sfx("ok");
          gain();
          later(300, done);
        } else {
          b.classList.add("bad");
          hurt(ln.why);
        }
      });
      log.appendChild(b);
    });
    body.appendChild(log);
  };

  /* ─── flow ─────────────────────────────────────────────────────────── */

  function runPuzzle(k) {
    var ch = CHAPTERS[state.chapter];
    if (k >= ch.puzzles.length) { chapterDone(); return; }
    state.pi = k;
    var p = ch.puzzles[k];
    ++state.gen;
    state.puzzle = p;
    if (state.mode !== "play") enterPlay();
    clearFig();
    setPad(null);
    scheduleZap();
    el.kicker.textContent = "Ch " + (state.chapter + 1) + " · " + (k + 1) + "/" + ch.puzzles.length;
    el.ptitle.textContent = p.title;
    el.prompt.innerHTML = rich(p.prompt);
    el.body.innerHTML = "";
    el.next.hidden = true;
    note(p.tip || "", "");
    W[p.type](p, el.body, function () { solved(p, k); });
  }

  function solved(p, k) {
    if (state.mode !== "play") return;
    el.next.hidden = false;
    note(p.win, "good");
    el.next.onclick = function () {
      sfx("tick");
      el.next.hidden = true;
      runPuzzle(k + 1);
    };
  }

  function crash() {
    state.mode = "crash";
    state.crashes++;
    save.crashes = (save.crashes || 0) + 1;
    writeSave(save);
    clearZap();
    setBed("none");
    ++state.gen;
    updateHud();
    cutaway("sink", "<b>Altitude zero</b><span>The airship is going down…</span>", crashCard);
  }

  function crashCard() {
    var ch = CHAPTERS[state.chapter];
    showCard({
      img: "crash.png", crash: true,
      kicker: "Altitude zero",
      name: "Into the sea",
      sub: "Too many wrong answers. Try " + ch.card.kicker.toLowerCase() + " again — you start with full altitude.",
      buttons: [
        { label: "Retry " + ch.card.kicker, act: function () { startChapter(state.chapter); } },
        { label: "Menu", ghost: true, act: showTitle },
      ],
    });
  }

  function chapterCard(i) {
    var ch = CHAPTERS[i];
    var best = save.stars[i] || 0;
    showCard({
      img: ch.card.img, kicker: ch.card.kicker, name: ch.card.name, sub: ch.card.sub,
      best: best ? "Best: " + starStr(best) : "",
      buttons: [{ label: "Take off ▸", act: function () { startChapter(i); } }],
    });
  }

  function startChapter(i) {
    hideOverlays();
    state.chapter = i;
    state.alt = MAX_ALT;
    state.streak = 0;
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
    state.runStars[i] = stars;
    save.cleared = Math.max(save.cleared || 0, i + 1);
    save.stars[i] = Math.max(save.stars[i] || 0, stars);
    writeSave(save);
    var last = i + 1 >= CHAPTERS.length;
    function showDoneCard() {
      var buttons = [];
      if (!last) buttons.push({ label: CHAPTERS[i + 1].card.kicker + " ▸", act: function () { chapterCard(i + 1); } });
      if (stars < 3) buttons.push({ label: "Retry for " + starStr(3), ghost: !last, act: function () { startChapter(i); } });
      buttons.push({ label: "Menu", ghost: true, act: showTitle });
      var total = 0;
      save.stars.forEach(function (n) { total += n || 0; });
      showCard({
        img: last ? "end-02-landing.png" : ch.card.img,
        kicker: ch.card.kicker + " complete",
        name: last ? "Voyage complete" : ch.card.name,
        stars: stars,
        badge: perfect ? "Perfect flight — no wrong answers" : "",
        sub: "Altitude left: " + state.alt * 1000 + " ft." + (last ? " All four chapters cleared — " + total + " / 12 stars in total." : ""),
        buttons: buttons,
        music: last ? "triumph" : "calm",
      });
    }
    if (last) playCine(ENDING, showDoneCard);
    else showDoneCard();
  }

  /* ─── overlays ─────────────────────────────────────────────────────── */

  function hideOverlays() { el.title.hidden = true; el.card.hidden = true; el.cine.hidden = true; }

  function playCine(scenes, done) {
    var i = 0, li = 0;
    ++state.gen;
    state.mode = "cine";
    clearZap();
    el.play.hidden = true;
    el.title.hidden = true;
    el.card.hidden = true;
    el.cine.hidden = false;

    function show() {
      if (i >= scenes.length) { el.cine.hidden = true; done(); return; }
      var sc = scenes[i];
      el.cineBg.src = ART + sc.bg + V;
      if (sc.music) setBed(sc.music);
      if (sc.who && sc.face && FACES[sc.who] && FACES[sc.who][sc.face]) {
        el.face.hidden = false;
        el.face.src = ART + FACES[sc.who][sc.face] + V;
        el.who.textContent = NAMES[sc.who] || sc.who;
      } else {
        el.face.hidden = true;
        el.who.textContent = "";
      }
      li = 0;
      el.line.textContent = sc.lines[0] || "";
    }
    function advance() {
      sfx("tick");
      var sc = scenes[i];
      if (li + 1 < sc.lines.length) {
        li++;
        el.line.textContent = sc.lines[li];
        return;
      }
      i++;
      show();
    }
    el.cine.onclick = advance;
    show();
  }

  function showCard(o) {
    ++state.gen;
    state.mode = "card";
    clearZap();
    el.card.className = "bv-overlay bv-card" + (o.crash ? " crash" : "");
    el.card.innerHTML = "";
    var img = h("img");
    img.alt = "";
    img.src = ART + o.img + V;
    el.card.appendChild(img);
    var t = h("div", "bv-ov-text");
    t.appendChild(h("div", "bv-eyebrow", o.kicker));
    t.appendChild(h("h2", "bv-ov-title", o.name));
    if (o.stars) t.appendChild(h("div", "bv-stars", starStr(o.stars)));
    if (o.badge) t.appendChild(h("div", "bv-badge", o.badge));
    t.appendChild(h("p", "bv-ov-sub", o.sub));
    if (o.best) t.appendChild(h("p", "bv-best", o.best));
    var btns = h("div", "bv-btns");
    o.buttons.forEach(function (b) {
      var x = h("button", "bv-btn" + (b.ghost ? " ghost" : ""), b.label);
      x.type = "button";
      x.addEventListener("click", function () { sfx("tick"); ensureAudio(); b.act(); });
      btns.appendChild(x);
    });
    t.appendChild(btns);
    el.card.appendChild(t);
    el.title.hidden = true;
    el.card.hidden = false;
    if (!o.crash) setBed(o.music || "calm");
  }

  function showTitle() {
    ++state.gen;
    state.mode = "title";
    clearZap();
    el.card.hidden = true;
    el.play.hidden = true;
    el.cut.hidden = true;
    el.title.innerHTML = "";
    var img = h("img");
    img.alt = "";
    img.src = ART + "title.png" + V;
    el.title.appendChild(img);
    var t = h("div", "bv-ov-text");
    t.appendChild(h("div", "bv-eyebrow", "JM34 · Trigonometric relations"));
    t.appendChild(h("h2", "bv-ov-title", "Blackout<br>Voyage"));
    t.appendChild(h("p", "bv-ov-sub", "A solar storm has knocked out every calculator on board. Fly the airship with exact values only — each wrong answer costs 1000 ft. Reach the sea and the chapter restarts."));
    var btns = h("div", "bv-btns");
    function btn(label, ghost, act) {
      var x = h("button", "bv-btn" + (ghost ? " ghost" : ""), label);
      x.type = "button";
      x.addEventListener("click", function () { ensureAudio(); sfx("tick"); act(); });
      btns.appendChild(x);
    }
    var cleared = save.cleared || 0;
    function beginFrom(i, withOpening) {
      if (withOpening) playCine(OPENING, function () { chapterCard(i); });
      else chapterCard(i);
    }
    if (cleared > 0 && cleared < CHAPTERS.length) {
      btn("Continue — " + CHAPTERS[cleared].card.kicker, false, function () { beginFrom(cleared, false); });
      btn("Start from Chapter 1", true, function () { beginFrom(0, true); });
    } else {
      btn("Start ▸", false, function () { beginFrom(0, true); });
    }
    t.appendChild(btns);
    var chaps = h("div", "bv-chaps");
    CHAPTERS.forEach(function (ch, i) {
      var c = h("button", "bv-chap", ch.card.kicker + " · " + ch.card.name + '<span class="bv-chap-stars">' + starStr(save.stars[i] || 0) + "</span>");
      c.type = "button";
      c.disabled = i > cleared;
      c.addEventListener("click", function () { ensureAudio(); sfx("tick"); chapterCard(i); });
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
      var lim = audio.ctx.createDynamicsCompressor();
      lim.threshold.value = -10;
      lim.ratio.value = 12;
      audio.master.connect(lim);
      lim.connect(audio.ctx.destination);
      audio.music = audio.ctx.createGain();
      audio.music.gain.value = 0.55;
      var hp = audio.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 60;
      audio.music.connect(hp);
      hp.connect(audio.master);
      audio.sfx = audio.ctx.createGain();
      audio.sfx.gain.value = 0.8;
      audio.sfx.connect(audio.master);
      applyMute();
      if (audio.bed) startBed();
    }
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return audio.ctx;
  }
  function applyMute() {
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.9;
    el.mute.textContent = "Sound: " + (audio.muted ? "off" : "on");
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
      if (n % 8 === 0) CALM[(n / 8) % 4].forEach(function (k) { tone(m, NOTE[k], t, 4.3, "triangle", 0.03); });
      if (n % 4 === 2 && Math.random() < 0.6) tone(m, NOTE[BELLS[Math.floor(Math.random() * BELLS.length)]], t, 1.6, "sine", 0.018);
    } else if (name === "storm") {
      if (n % 8 === 0) { tone(m, NOTE.A2, t, 4.3, "triangle", 0.05); tone(m, NOTE.E3, t, 4.3, "sine", 0.025); }
      if (n % 4 === 0) noise(m, t, 2.6, "bandpass", 380 + Math.random() * 300, 0.05);
      if (n % 2 === 1 && Math.random() < 0.25) tone(m, NOTE.D4, t, 0.9, "sine", 0.012);
    } else if (name === "tension") {
      tone(m, n % 2 ? 116.54 : NOTE.A2, t, 0.32, "triangle", 0.05);
      if (n % 8 === 0) { tone(m, NOTE.D3, t, 4.2, "sine", 0.03); tone(m, NOTE.F3, t, 4.2, "sine", 0.02); }
    } else if (name === "triumph") {
      var arp = ["C4", "E4", "G4", "C5", "G4", "E4", "D4", "G4"];
      tone(m, NOTE[arp[n % 8]], t, 0.6, "triangle", 0.04);
      if (n % 8 === 0) ["C4", "E4", "G4"].forEach(function (k) { tone(m, NOTE[k] / 2, t, 4.2, "sine", 0.03); });
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
    if (name === "tick") tone(d, 1800, t, 0.04, "square", 0.025);
    else if (name === "ok") { tone(d, 880, t, 0.18, "sine", 0.12); tone(d, 1318.5, t + 0.1, 0.3, "sine", 0.12); }
    else if (name === "deny") { tone(d, 330, t, 0.12, "square", 0.04); tone(d, 262, t + 0.1, 0.16, "square", 0.04); }
    else if (name === "bad") {
      tone(d, 140, t, 0.45, "sawtooth", 0.08, 70);
      tone(d, 740, t + 0.05, 0.22, "square", 0.04);
      tone(d, 554, t + 0.3, 0.22, "square", 0.04);
      noise(d, t, 0.5, "lowpass", 900, 0.12, 200);
    } else if (name === "climb") tone(d, 300, t, 0.6, "triangle", 0.08, 900);
    else if (name === "gear") { noise(d, t, 0.06, "highpass", 3000, 0.08); tone(d, 1250, t, 0.05, "square", 0.03); }
    else if (name === "thunder") noise(d, t, 2.2, "lowpass", 260, 0.18, 60);
    else if (name === "crash") { noise(d, t, 2.8, "lowpass", 1800, 0.35, 80); tone(d, 220, t, 1.8, "sawtooth", 0.1, 40); }
    else if (name === "crunch") { noise(d, t, 0.7, "bandpass", 1400, 0.3, 300); tone(d, 95, t, 0.6, "sawtooth", 0.12, 45); }
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
  el.menu.addEventListener("click", function (e) { e.stopPropagation(); showTitle(); });
  root.addEventListener("pointerdown", function () { ensureAudio(); }, { once: true });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || state.mode !== "play" || el.next.hidden) return;
    if (!root.offsetParent && !document.fullscreenElement) return;
    if (e.target && e.target.closest && e.target.closest("input:not([disabled]), textarea, select, button")) return;
    e.preventDefault();
    el.next.click();
  });

  applyMute();
  preload(["title.png", "ch1-card.png", "sky-ch1.png", "crash.png", "op-01-departure.png", "op-02-storm.png"]);
  showTitle();
})();
