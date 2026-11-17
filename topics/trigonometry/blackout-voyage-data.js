/* JM34 Blackout Voyage - question bank, figures and story (data only; engine lives in blackout-voyage.js). */
(function () {
  "use strict";
  function L(en, zh) { return { en: en, zh: zh }; }

  var NAMES = {
    kit: L("KIT", "KIT"),
    captain: L("CAPTAIN REED", "船長里德"),
    engineer: L("ENG. MOSS", "工程師莫斯"),
    quartermaster: L("QUARTERMASTER VENN", "物資官雲恩"),
  };
  var FACES = {
    kit: { think: "kit-think.png", shock: "kit-shock.png", joy: "kit-joy.png" },
    captain: { calm: "captain-calm.png", stern: "captain-stern.png", smile: "captain-smile.png", worried: "captain-worried.png" },
    engineer: { focus: "engineer-focus.png", grin: "engineer-grin.png", panic: "engineer-panic.png", cheer: "engineer-cheer.png" },
    quartermaster: { friendly: "quartermaster-friendly.png", nervous: "quartermaster-nervous.png", exposed: "quartermaster-exposed.png" },
  };
  var OPENING = [
    { bg: "op-01-departure.png", music: "calm", lines: [L("Dawn. The airship leaves Hong Kong harbour under a clear sky.", "黎明。飛船在晴空下離開香港海港。"), L("You are Kit — apprentice navigator on your first long voyage.", "你是 Kit——見習領航員，首次長途航行。")] },
    { bg: "op-02-storm.png", music: "storm", lines: [L("By dusk a solar storm rolls in. Lightning crawls along the hull.", "黃昏時太陽風暴來襲，閃電沿船殼爬行。"), L("The radio dies. Then every electronic instrument follows.", "電台失靈。然後所有電子儀器相繼報廢。")] },
    { bg: "op-03-blackout.png", who: "engineer", face: "panic", lines: [L("Every screen is dead. Compass, GPS, the lot.", "所有螢幕都黑了。羅盤、GPS，全部失效。"), L("We're flying on brass dials and whatever Kit can still calculate.", "我們只靠黃銅錶盤，和 Kit 還算得出的數字飛行。")] },
    { bg: "op-04-briefing.png", who: "captain", face: "stern", lines: [L("Listen carefully. From this moment, only exact values count.", "聽好。從此刻起，只接受精確值。"), L("A rounded guess of √2 as 1.41 will put us kilometres off course.", "把 √2 約成 1.41，足以令我們偏離航線數公里。")] },
    { bg: "op-05-navigator.png", who: "kit", face: "think", lines: [L("The Clockwork Navigator still works — gears and a unit-length brass arm.", "齒輪領航儀仍可使用——齒輪與單位長黃銅臂。"), L("Sin, cos, tan… that's how we get home.", "sin、cos、tan……這是我們回家的方法。")] },
    { bg: "op-04-briefing.png", who: "captain", face: "calm", lines: [L("Altitude is your life. Every wrong number costs a thousand feet.", "高度就是生命。每錯一個數字，就損失一千呎。"), L("Drop to the sea and we restart that stretch. Ready?", "墜海便要重飛該段。準備好了嗎？")] },
  ];
  var CH_INTRO = [
    [{ bg: "ch1-intro.png", alt: "op-05-navigator.png", who: "kit", face: "think", lines: [L("Mountains ahead — we need exact heights so we don't clip a peak. Special angles only: 30°, 45°, 60°.", "前方是群山——得用精確高度，才不會撞峰。只用特別角：30°、45°、60°。")] }],
    [{ bg: "ch2-intro.png", alt: "bg-engine.png", who: "engineer", face: "focus", lines: [L("Half the gauges are smashed. Rebuild each triangle from what's left,", "一半儀表撞爛了。用剩餘資料重建每個三角形，"), L("then read sin and cos off the sides.", "再由邊長讀出 sin 與 cos。")] }],
    [{ bg: "ch3-intro.png", alt: "op-02-storm.png", who: "captain", face: "worried", lines: [L("Complementary angles: θ and 90° − θ swap sin and cos.", "互餘角：θ 與 90° − θ 互換 sin 與 cos。"), L("Use that to rewrite every reading on the board.", "用以改寫儀表板上的每一個讀數。")] }],
    [{ bg: "ch4-intro.png", alt: "op-04-briefing.png", who: "quartermaster", face: "nervous", lines: [L("Someone has been feeding us false identities.", "有人一直餵我們假的恆等式。"), L("Prove the true ones. Spot the forged lines.", "證明真的，揪出偽造的步驟。")] }],
  ];
  var ENDING = [
    { bg: "end-01-reveal.png", who: "quartermaster", face: "exposed", lines: [L("…Fine. It was me. I cut the instruments so you'd turn back.", "……好吧。是我。我破壞儀器，想逼你們折返。"), L("I never wanted this voyage.", "我從未想過要這次航行。")] },
    { bg: "end-02-landing.png", who: "captain", face: "smile", lines: [L("We land on exact values alone. Hong Kong harbour — home.", "我們只靠精確值降落。香港海港——家。")] },
    { bg: "end-03-crew.png", who: "kit", face: "joy", lines: [L("No calculator. Just trigonometry. And a crew that trusts the maths.", "沒有計算機。只有三角學。還有相信數學的船員。")] },
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
      card: { img: "ch1-card.png", kicker: L("Chapter 1", "第 1 章"), name: L("Special Angles", "特別角"), sub: L("Exact values of sin, cos and tan at 30°, 45° and 60° · rationalizing the denominator", "30°、45°、60° 的 sin、cos、tan 精確值 · 分母有理化") },
      sky: "sky-ch1.png", place: L("OVER THE MOUNTAINS", "越過群山"), music: "storm",
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
      card: { img: "ch2-card.png", kicker: L("Chapter 2", "第 2 章"), name: L("Basic Identities", "基本恆等式"), sub: L("Find the other ratios from one · sin²θ + cos²θ = 1 · tan θ = sin θ / cos θ", "由一個比率求其餘 · sin²θ + cos²θ = 1 · tan θ = sin θ / cos θ") },
      sky: "sky-ch2.png", place: L("HIGH PASS", "高山隘口"), music: "storm",
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
      card: { img: "ch3-card.png", kicker: L("Chapter 3", "第 3 章"), name: L("Complementary Angles", "互餘角"), sub: L("sin(90° − θ) = cos θ · cos(90° − θ) = sin θ · tan(90° − θ) = 1 / tan θ", "sin(90° − θ) = cos θ · cos(90° − θ) = sin θ · tan(90° − θ) = 1 / tan θ") },
      sky: "sky-ch3.png", place: L("OPEN SEA", "開阔海面"), music: "storm",
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
      card: { img: "ch4-card.png", kicker: L("Chapter 4", "第 4 章"), name: L("Proving Identities", "證明恆等式"), sub: L("Prove step by step · spot the wrong line · hence find θ", "逐步證明 · 找出錯誤一行 · 進而求 θ") },
      sky: "sky-ch4.png", place: L("APPROACHING HONG KONG", "駛近香港"), music: "tension", dry: true,
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

  (function bvApplyI18n() {
    var Z = (typeof window !== "undefined" && window.BV_ZH) || {};
    function isL(v) {
      return !!(v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "zh" in v));
    }
    function pack(s) {
      if (typeof s !== "string") return s;
      if (s.indexOf(".png") >= 0 || s === "storm" || s === "calm" || s === "tension" || s === "triumph") return s;
      return L(s, Z[s] || s);
    }
    function skipKey(k, v) {
      if (isL(v)) return true; /* already bilingual — do not nest */
      if (k === "fig" || k === "type" || k === "fn" || k === "angles" || k === "lone" || k === "ans" || k === "free" || k === "allowIrr" || k === "missAns" || k === "sides" || k === "missing" || k === "reading" || k === "start" || k === "claim" || k === "startTag" || k === "endTag" || k === "img" || k === "sky" || k === "music" || k === "bg" || k === "face" || k === "who" || k === "dry" || k === "wrong" || k === "tex" || k === "to" || k === "alts" || k === "notch") return true;
      if (k === "place" && Array.isArray(v)) return true; /* rebuild slot list */
      if (k === "unit" && (v === "°" || v === "m")) return true;
      if (k === "label" && typeof v === "string" && v.indexOf("\\") >= 0) return true;
      return false;
    }
    function walk(o) {
      if (!o || typeof o !== "object" || isL(o)) return;
      if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) {
          if (typeof o[i] === "string") o[i] = pack(o[i]);
          else if (o[i] && typeof o[i] === "object" && !isL(o[i])) walk(o[i]);
        }
        return;
      }
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (skipKey(k, v)) return;
        if (typeof v === "string") o[k] = pack(v);
        else if (v && typeof v === "object") walk(v);
      });
    }
    CHAPTERS.forEach(walk);
  })();

  window.BV_DATA = { L: L, NAMES: NAMES, FACES: FACES, OPENING: OPENING, CH_INTRO: CH_INTRO, ENDING: ENDING, CHAPTERS: CHAPTERS, rad: rad };
})();
