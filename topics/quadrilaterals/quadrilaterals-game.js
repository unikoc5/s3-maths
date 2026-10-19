/* JM29 Game 1 — Identifying quadrilaterals.
 * Opening chapter + the five kingdoms of the parallelogram region.
 */
(function () {
  "use strict";

  var ART = "game/";
  var V = "?v=20261015-marks2";

  var TITLE = {
    eyebrow: "JM29 · Game 1",
    heading: "Identifying\nQuadrilaterals",
    sub: "Princesses are missing, impostors are everywhere, and kings are ready for war. Name the true princess in every kingdom.",
    bg: "op-01-title.png",
  };

  /* mode: "narration" = no speaker, "speech" = sage bubble, "scene" = corner prompt only. */
  var BEATS = [
    {
      bg: "op-02-missing.png",
      ken: "ken-a",
      mode: "narration",
      lines: ["One by one, the princesses of every kingdom have vanished."],
      music: "battle",
    },
    {
      bg: "op-03-distrust.png",
      ken: "ken-c",
      mode: "narration",
      lines: [
        "The kings blame one another.",
        "Armies are already gathering along every border.",
      ],
      music: "battle",
    },
    {
      bg: "op-04-impostors.png",
      ken: "ken-b",
      mode: "narration",
      lines: [
        "Meanwhile commoners hungry for palace riches step forward,",
        "each one claiming to be a missing princess.",
      ],
      music: "battle",
    },
    {
      bg: "op-05-relic.png",
      ken: "ken-d",
      mode: "narration",
      lines: [
        "You are a sage, and every court will let you examine its princess.",
        "Name the wrong one and the king will rage — and the war begins.",
      ],
      music: "battle",
    },
    {
      bg: "op-05-relic.png",
      mode: "speech",
      lines: [
        "This relic can rewind time three times.",
        "Choose wrongly, and it returns me to the moment before the choice.",
      ],
      fx: "relic",
      music: "battle",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "scene",
      music: "battle",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "speech",
      lines: [
        "This world has four major regions.",
        "Each region is home to several kingdoms.",
      ],
      fx: "map-zones",
      music: "battle",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "speech",
      lines: [
        "The parallelogram region is the largest of them all.",
        "Let us start there.",
      ],
      fx: "map-focus",
      music: "battle",
    },
  ];

  /* Between regions the story breathes: the "journey" bed, not the war drums. */
  var REGION_OUTRO = [
    {
      bg: "op-07-parallelogram-farewell.png",
      ken: "ken-a",
      mode: "scene",
      music: "journey",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "speech",
      lines: [
        "The Parallelogram Region is safe.",
        "Next stop: the Rhombus Zone.",
      ],
      fx: "next-rhombus",
      music: "journey",
    },
  ];

  var ZONES = [
    { id: "para", tag: "Parallelogram", stroke: "#60a5fa", points: [[125, 360], [625, 360], [540, 680], [40, 680]], label: [332, 528] },
    { id: "rhombus", tag: "Rhombus", stroke: "#4ade80", points: [[855, 85], [1065, 255], [855, 425], [645, 255]], label: [855, 268] },
    { id: "rectangle", tag: "Rectangle", stroke: "#f87171", points: [[1160, 95], [1460, 95], [1460, 425], [1160, 425]], label: [1310, 272] },
    { id: "square", tag: "Square", stroke: "#c084fc", points: [[1020, 480], [1270, 480], [1270, 730], [1020, 730]], label: [1145, 617] },
  ];

  var ROUTE = "M55,820 C80,745 110,680 165,600";

  /* Catmull-Rom through the points, as one smooth SVG path. */
  function smoothPath(pts) {
    var d = "M" + pts[0].join(",");
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + c1.join(",") + " " + c2.join(",") + " " + p2.join(",");
    }
    return d;
  }

  /* "Next stop" overlays: the spotlight, a pulsing outline, a dotted route and a name.
   * Rhombus crosses open land. Rectangle sails the river that leaves the rhombus
   * land. Square sails on: out of the rectangle land, down the central river,
   * then along the southern river into the square land. Points are map pixels. */
  var NEXT_STOPS = {
    rhombus: {
      zone: 1,
      name: "Rhombus",
      route: "M500,460 C590,450 650,420 710,375 C745,348 775,322 805,300",
    },
    rectangle: {
      zone: 2,
      name: "Rectangle",
      route: smoothPath([
        [975, 305], [1012, 294], [1038, 291], [1064, 298], [1090, 309], [1110, 324],
        [1108, 338], [1098, 347], [1124, 358], [1150, 372], [1190, 372], [1235, 340],
      ]),
    },
    square: {
      zone: 3,
      name: "Square",
      route: smoothPath([
        [1215, 385], [1165, 415], [1100, 438], [1055, 448], [1020, 455], [990, 468],
        [960, 488], [930, 506], [900, 518], [862, 536], [836, 556], [824, 580],
        [840, 598], [868, 606], [862, 636], [872, 664], [900, 678], [936, 681],
        [972, 696], [1004, 718], [1030, 730], [1066, 708], [1100, 660],
      ]),
    },
  };

  /* Every court offers the same five reasons; only the answer changes.
   * Each princess's marks give exactly one of them, with no steps between. */
  var REASONS = [
    "opp. sides equal",
    "opp. \u2220s equal",
    "diags. bisect each other",
    "2 sides equal and //",
    "by definition (opp. sides //)",
  ];

  var RH_REASONS = [
    "4 sides equal",
    "diags. \u22a5 each other",
    "diag. bisects \u2220s",
  ];

  var RHOMBUS_OUTRO = [
    {
      bg: "op-07-rhombus-farewell.jpg",
      ken: "ken-a",
      mode: "scene",
      music: "journey",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "speech",
      lines: [
        "The Rhombus Region is safe.",
        "Next stop: the Rectangle Zone.",
      ],
      fx: "next-rectangle",
      music: "journey",
    },
  ];

  var RE_REASONS = [
    "4 \u2220s = 90\u00b0",
    "diags. equal",
  ];

  var SQ_REASONS = [
    "4 sides equal and 4 \u2220s = 90\u00b0",
    "diags. equal and \u22a5 bisect each other",
    "4 \u2220s = 90\u00b0 and diag. bisects \u2220s",
  ];

  var RECTANGLE_OUTRO = [
    {
      bg: "op-07-rectangle-farewell.jpg",
      ken: "ken-a",
      mode: "scene",
      music: "journey",
    },
    {
      bg: "op-06-map-clean.png",
      mode: "speech",
      lines: [
        "The Rectangle Region is safe.",
        "Final stop: the Square Zone.",
      ],
      fx: "next-square",
      // The river route runs low on the map, so the bubble moves up out of its way.
      high: true,
      music: "journey",
    },
  ];

  /* The finale: all four kings hand in hand, under the saved "finale" bed. */
  var SQUARE_OUTRO = [
    {
      bg: "op-07-square-ending.jpg",
      ken: "ken-a",
      mode: "scene",
      music: "finale",
    },
    {
      bg: "op-07-square-ending.jpg",
      ken: "ken-c",
      mode: "speech",
      lines: [
        "The Square Region is safe.",
        "Every princess is home, and every king has lowered his sword.",
      ],
      music: "finale",
    },
  ];

  /* One seat shuffle is made on load; a region with fewer reasons keeps the
   * same relative order by dropping the seats it does not use. */
  var REGIONS = {
    para: { reasons: REASONS, ask: "Which claimant is a true parallelogram?", bed: "court", outro: REGION_OUTRO },
    rhombus: { reasons: RH_REASONS, ask: "Which claimant is a true rhombus?", bed: "rhombus", outro: RHOMBUS_OUTRO },
    rectangle: { reasons: RE_REASONS, ask: "Which claimant is a true rectangle?", bed: "rectangle", outro: RECTANGLE_OUTRO },
    square: { reasons: SQ_REASONS, ask: "Which claimant is a true square?", bed: "square", outro: SQUARE_OUTRO },
  };

  /* Card figures live in a 120 × 100 box and are drawn to scale: every mark
   * and every measurement is true for the drawing.
   * ticks / arrows are [sideIndex, count]; angles are [vertexIndex, count];
   * diagTicks are [vertexIndex, count] and mark the half-diagonal from that
   * vertex to where the two diagonals cross. Side i runs from P[i] to P[i+1].
   * Measurements: sideLabels [side, text], angleLabels [vertex, text],
   * halfLabels [vertex, text] on a half-diagonal, splitLabels
   * [vertex, text, text] for a corner cut by its diagonal, and crossLabel
   * for the angle between the halves running to P0 and P1. */
  var DEG = Math.PI / 180;

  /* Shapes are built from real lengths with y pointing up, then scaled into
   * the card box. rot turns the whole shape anticlockwise, in degrees. */
  function fit(pts, rot) {
    var r = (rot || 0) * DEG;
    var q = pts.map(function (p) {
      return [p[0] * Math.cos(r) - p[1] * Math.sin(r), -(p[0] * Math.sin(r) + p[1] * Math.cos(r))];
    });
    var xs = q.map(function (p) { return p[0]; });
    var ys = q.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var s = Math.min(74 / (maxX - minX), 60 / (maxY - minY));
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return q.map(function (p) {
      return [Math.round((60 + (p[0] - cx) * s) * 10) / 10, Math.round((50 + (p[1] - cy) * s) * 10) / 10];
    });
  }

  // Top and bottom of length a, slanted sides of length b, deg at the bottom-left corner.
  function para(a, b, deg, rot) {
    var c = b * Math.cos(deg * DEG), h = b * Math.sin(deg * DEG);
    return fit([[c, h], [a + c, h], [a, 0], [0, 0]], rot);
  }

  // h0–h3 run from each vertex to the crossing; deg is the angle between the halves to P0 and P1.
  function byDiags(h0, h1, h2, h3, deg, rot) {
    var t0 = (90 + deg / 2) * DEG, t1 = (90 - deg / 2) * DEG;
    return fit([
      [h0 * Math.cos(t0), h0 * Math.sin(t0)],
      [h1 * Math.cos(t1), h1 * Math.sin(t1)],
      [-h2 * Math.cos(t0), -h2 * Math.sin(t0)],
      [-h3 * Math.cos(t1), -h3 * Math.sin(t1)],
    ], rot);
  }

  var ARROWS = [[0, 1], [2, 1], [1, 2], [3, 2]];
  var PAIRS = [[0, 1], [2, 1], [1, 2], [3, 2]];
  var ALL_ONE = [[0, 1], [1, 1], [2, 1], [3, 1]];
  var ALL_RIGHT = [0, 1, 2, 3];

  /* Every claimant is a clean, regular shape, and every mark is true for
   * her drawing. An impostor is ruled out by what her marks fail to show. */
  var LEVELS = [
    {
      id: "para-01",
      chapter: "Parallelogram Region · Kingdom 1",
      name: "The Golden Court of Leo",
      bg: "kd-para-01.png",
      bgAngry: "kd-para-01-angry.png",
      bgPuzzled: "kd-para-01-puzzled.png",
      bgHappy: "kd-para-01-happy.png",
      king: "king-para-01.png",
      kingName: "King Leo",
      intro: [
        { who: "king", lines: ["Find the real princess.", "Every claimant looks like a parallelogram."] },
        { who: "you", lines: ["Then I will read the marks, not the shape."] },
      ],
      cards: [
        {
          name: "Anna",
          poly: para(6, 3.6, 62),
          ticks: [[0, 1], [2, 1]],
          why: "Only one pair of Anna's opposite sides is marked equal.\nBoth pairs of opposite sides must be equal.",
        },
        {
          name: "Claire",
          poly: para(6, 4, 68),
          ticks: [[0, 1], [2, 1]],
          arrows: [[1, 1], [3, 1]],
          why: "Claire has one pair of opposite sides equal and the other pair parallel.\nThe same pair of opposite sides must be both equal and parallel to prove a parallelogram.",
        },
        { name: "Mira", poly: para(6, 3.6, 65), ticks: PAIRS },
      ],
      answer: 2,
      kingWrong: ["Wrong! You would hand my throne to a thief?", "Guards — take him!"],
      kingCorrect: ["Mira. Her marks are only on her sides.", "Tell me why that makes her the one."],
      reasonAnswer: 0,
      reasonWhy: [
        "",
        "No angle is marked in her figure.",
        "No diagonals are drawn in her figure.",
        "None of her sides is marked parallel.",
        "None of her sides is marked parallel.",
      ],
      solve: [
        { who: "you", lines: ["Both pairs of her opposite sides are marked equal.", "So she is a parallelogram. (opp. sides equal)"] },
        { who: "king", lines: ["My daughter! Return to me!", "I owe you this peace, sage."] },
      ],
      outro: ["Leo lowers his banners of war.", "The road now climbs east, into the emerald hills of Owen."],
    },
    {
      id: "para-02",
      chapter: "Parallelogram Region · Kingdom 2",
      name: "The Emerald Court of Owen",
      bg: "kd-para-02.png",
      bgAngry: "kd-para-02-angry.png",
      bgPuzzled: "kd-para-02-puzzled.png",
      bgHappy: "kd-para-02-happy.png",
      king: "king-para-02.png",
      kingName: "King Owen",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Helen",
          poly: para(6.4, 3.8, 60),
          angles: [[0, 1], [2, 1]],
          why: "Only one pair of Helen's opposite angles is marked equal.\nBoth pairs of opposite angles must be equal.",
        },
        {
          name: "Grace",
          poly: para(5, 5, 65),
          ticks: [[0, 1], [1, 1]],
          why: "Grace only has two touching sides marked equal.\nTouching sides prove nothing; we need her opposite sides or opposite angles.",
        },
        { name: "Alice", poly: para(6, 4, 64), angles: PAIRS },
      ],
      answer: 2,
      kingWrong: ["You dare guess in my hall?", "My spears are already at the border, sage!"],
      kingCorrect: ["Alice, then. My court is listening.", "Name the reason, and name it exactly."],
      reasonAnswer: 1,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "",
        "No diagonals are drawn in her figure.",
        "No side is marked equal or parallel in her figure.",
        "None of her sides is marked parallel.",
      ],
      solve: [
        { who: "you", lines: ["Both pairs of her opposite angles are marked equal.", "So she is a parallelogram. (opp. \u2220s equal)"] },
        { who: "king", lines: ["Alice. My own stubborn Alice.", "Owen stands down. Go on, sage."] },
      ],
      outro: ["Owen's spears go back into the racks.", "Beyond the hills the red towers of Henry are already waiting."],
    },
    {
      id: "para-03",
      chapter: "Parallelogram Region · Kingdom 3",
      name: "The Crimson Court of Henry",
      bg: "kd-para-03.png",
      bgAngry: "kd-para-03-angry.png",
      bgPuzzled: "kd-para-03-puzzled.png",
      bgHappy: "kd-para-03-happy.png",
      king: "king-para-03.png",
      kingName: "King Henry",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Nina",
          poly: para(6.4, 4, 58),
          diagTicks: [[1, 1], [3, 1]],
          why: "Only one of Nina's diagonals is marked as cut in half.\nBoth diagonals must bisect each other.",
        },
        {
          name: "Rose",
          poly: para(6.2, 3.8, 60),
          ticks: [[1, 1], [3, 1]],
          why: "Only one pair of Rose's opposite sides is marked equal.\nBoth pairs of opposite sides must be equal.",
        },
        { name: "Iris", poly: para(6, 4, 64), diagTicks: PAIRS },
      ],
      answer: 2,
      kingWrong: ["A false daughter in the crimson seat!", "You have doomed us all, sage!"],
      kingCorrect: ["Iris. Hm. Not one side of hers is marked.", "Say why, and let the whole hall hear it."],
      reasonAnswer: 2,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "No angle is marked in her figure.",
        "",
        "No side is marked equal or parallel in her figure.",
        "None of her sides is marked parallel.",
      ],
      solve: [
        { who: "you", lines: ["Each of her diagonals is marked as cut into two equal halves.", "So the diagonals bisect each other. (diags. bisect each other)"] },
        { who: "king", lines: ["Then I was wrong to reach for my swords.", "Take my apology with you, sage."] },
      ],
      outro: ["Henry bolts his armoury shut.", "Ahead lie the violet spires of Victor."],
    },
    {
      id: "para-04",
      chapter: "Parallelogram Region · Kingdom 4",
      name: "The Violet Court of Victor",
      bg: "kd-para-04.png",
      bgAngry: "kd-para-04-angry.png",
      bgPuzzled: "kd-para-04-puzzled.png",
      bgHappy: "kd-para-04-happy.png",
      king: "king-para-04.png",
      kingName: "King Victor",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Paula",
          poly: para(6, 4, 62),
          arrows: [[0, 1], [2, 1]],
          ticks: [[1, 1], [3, 1]],
          why: "Paula's top and bottom are parallel, but it is her slanted sides that are equal.\nThe same pair of opposite sides must be both equal and parallel.",
        },
        {
          name: "Wendy",
          poly: para(6.4, 3.8, 66),
          arrows: [[0, 1], [2, 1]],
          why: "Only one pair of Wendy's opposite sides is marked parallel.\nThat pair must also be marked equal.",
        },
        { name: "Diana", poly: para(6, 4, 68), arrows: [[0, 1], [2, 1]], ticks: [[0, 1], [2, 1]] },
      ],
      answer: 2,
      kingWrong: ["Half a proof is no proof!", "Victor will answer this insult with steel!"],
      kingCorrect: ["Diana carries only one marked pair.", "Convince my court that one pair is enough."],
      reasonAnswer: 3,
      reasonWhy: [
        "Only one pair of her sides is marked equal, not both.",
        "No angle is marked in her figure.",
        "No diagonals are drawn in her figure.",
        "",
        "Only one pair of her sides is marked parallel, not both.",
      ],
      solve: [
        { who: "you", lines: ["Her top and bottom are marked equal, and the same two sides are parallel.", "One pair of opposite sides is equal and parallel. (2 sides equal and //)"] },
        { who: "king", lines: ["One pair. Both facts. I see it now.", "Victor is yours to leave in peace."] },
      ],
      outro: ["Victor puts out his war-fires.", "One kingdom remains: the iron-blue keep of Simon."],
    },
    {
      id: "para-05",
      chapter: "Parallelogram Region · Kingdom 5",
      name: "The Iron-Blue Court of Simon",
      bg: "kd-para-05.png",
      bgAngry: "kd-para-05-angry.png",
      bgPuzzled: "kd-para-05-puzzled.png",
      bgHappy: "kd-para-05-happy.png",
      king: "king-para-05.png",
      kingName: "King Simon",
      intro: [
        { who: "king", lines: ["Help me find the princess.", "Two of them look perfect. Surely it is one of those."] },
      ],
      cards: [
        {
          name: "Lily",
          poly: para(5, 5, 62),
          arrows: [[0, 1], [2, 1]],
          ticks: [[0, 1], [3, 1]],
          why: "Only Lily's top and bottom are marked parallel, and her equal sides touch each other.\nBoth pairs of opposite sides must be parallel.",
        },
        {
          name: "Fiona",
          poly: para(6, 4, 63),
          why: "Fiona carries no marks at all, only a shape that looks right.\nLooking like a parallelogram is not evidence of being one.",
        },
        { name: "Sarah", poly: para(6, 3.2, 42, -35), arrows: ARROWS },
      ],
      answer: 2,
      kingWrong: ["So the famous sage is a fraud after all!", "Simon marches at dawn!"],
      kingCorrect: ["Sarah? She hardly looks like a parallelogram.", "The oldest reason, sage. Say it plainly."],
      reasonAnswer: 4,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "No angle is marked in her figure.",
        "No diagonals are drawn in her figure.",
        "No side is marked equal, so this reason cannot be used.",
        "",
      ],
      solve: [
        { who: "you", lines: ["Both pairs of her opposite sides are marked parallel.", "That is what a parallelogram is. (by definition)"] },
        { who: "king", lines: ["Sarah. My daughter.", "Simon is at peace. The region is whole again."] },
      ],
      outro: ["Five thrones, five daughters, and every proof answered.", "The parallelogram region lowers its banners at last."],
    },
    {
      id: "rhombus-01",
      region: "rhombus",
      chapter: "Rhombus Region · Kingdom 1",
      name: "The Turquoise Court of Arthur",
      bg: "kd-rhombus-01.jpg",
      bgAngry: "kd-rhombus-01-angry.jpg",
      bgPuzzled: "kd-rhombus-01-puzzled.jpg",
      bgHappy: "kd-rhombus-01-happy.jpg",
      king: "king-rhombus-01.jpg",
      kingName: "King Arthur",
      intro: [
        { who: "king", lines: ["Help me find the princess.", "Every claimant here looks like a rhombus."] },
      ],
      cards: [
        {
          name: "Emma",
          poly: para(5, 5, 58),
          ticks: [[1, 1], [2, 1], [3, 1]],
          why: "Only three of Emma's sides are marked equal.\nAll four sides must be equal.",
        },
        {
          name: "Olivia",
          poly: para(5, 5, 66),
          ticks: [[0, 1], [1, 1], [2, 2], [3, 2]],
          why: "Olivia's equal sides come in two touching pairs, and the pairs are not marked equal to each other.\nAll four sides must be equal.",
        },
        { name: "Chloe", poly: para(5, 5, 62), ticks: ALL_ONE },
      ],
      answer: 2,
      kingWrong: ["Wrong! That is not my daughter.", "Guards, seize the sage!"],
      kingCorrect: ["Chloe? Emma and Olivia carry equal marks too.", "Tell me why Chloe is the one."],
      reasonAnswer: 0,
      reasonWhy: [
        "",
        "No diagonals are drawn in her figure.",
        "No diagonal is drawn, and no angle is marked.",
      ],
      solve: [
        { who: "you", lines: ["All four of her sides are marked equal.", "So she is a rhombus. (4 sides equal)"] },
        { who: "king", lines: ["Chloe! My daughter!", "Arthur owes you this peace, sage."] },
      ],
      outro: ["Arthur lowers his banners of war.", "The road turns east, to the amethyst towers of Oscar."],
    },
    {
      id: "rhombus-03",
      region: "rhombus",
      chapter: "Rhombus Region · Kingdom 2",
      name: "The Amethyst Court of Oscar",
      bg: "kd-rhombus-03.jpg",
      bgAngry: "kd-rhombus-03-angry.jpg",
      bgPuzzled: "kd-rhombus-03-puzzled.jpg",
      bgHappy: "kd-rhombus-03-happy.jpg",
      king: "king-rhombus-03.jpg",
      kingName: "King Oscar",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Lucy",
          poly: byDiags(3, 4.5, 3, 4.5, 90, -45),
          rightCross: true,
          diagTicks: [[1, 1], [3, 1]],
          why: "Lucy's diagonals are perpendicular, but only one of them is marked as bisected.\nThe diagonals must bisect each other at right angles.",
        },
        {
          name: "Zoe",
          poly: byDiags(3.5, 4.5, 3.5, 4.5, 90, -45),
          diagTicks: PAIRS,
          why: "Zoe's diagonals are marked as bisecting each other,\nbut nothing marks them as perpendicular.",
        },
        { name: "Amy", poly: byDiags(3, 4, 3, 4, 90, -45), rightCross: true, diagTicks: PAIRS },
      ],
      answer: 2,
      kingWrong: ["You call that my daughter?", "Oscar will answer with steel!"],
      kingCorrect: ["Amy. Only her diagonals are marked.", "Why is that enough?"],
      reasonAnswer: 1,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "",
        "No corner angle is marked in her figure.",
      ],
      solve: [
        { who: "you", lines: ["Her diagonals cut each other in half, and they meet at a right angle.", "So she is a rhombus. (diags. \u22a5 each other)"] },
        { who: "king", lines: ["Amy, my clever girl.", "Oscar puts away his sword."] },
      ],
      outro: ["Oscar opens his gates again.", "Far ahead glow the sapphire halls of Hugo."],
    },
    {
      id: "rhombus-05",
      region: "rhombus",
      chapter: "Rhombus Region · Kingdom 3",
      name: "The Sapphire Court of Hugo",
      bg: "kd-rhombus-05.jpg",
      bgAngry: "kd-rhombus-05-angry.jpg",
      bgPuzzled: "kd-rhombus-05-puzzled.jpg",
      bgHappy: "kd-rhombus-05-happy.jpg",
      king: "king-rhombus-05.jpg",
      kingName: "King Hugo",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Holly",
          poly: para(5, 5, 65),
          diagLines: [0, 1],
          splitAngles: [[3, 1]],
          why: "Only one of Holly's corners is marked as bisected.\nEvery corner must be cut into two equal angles by a diagonal.",
        },
        {
          name: "Jessica",
          poly: para(5, 5, 56),
          diagLines: [1],
          splitAngles: [[1, 1], [3, 1]],
          why: "Only one of Jessica's diagonals bisects its corners.\nBoth diagonals must bisect the angles they pass through.",
        },
        { name: "Bella", poly: para(5, 5, 60), diagLines: [0, 1], splitAngles: [[0, 2], [2, 2], [1, 1], [3, 1]] },
      ],
      answer: 2,
      kingWrong: ["The marks were right there, sage!", "Hugo calls his knights!"],
      kingCorrect: ["Bella? Jessica's corners are split evenly too.", "Explain it to my court."],
      reasonAnswer: 2,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "Nothing marks her diagonals as perpendicular.",
        "",
      ],
      solve: [
        { who: "you", lines: ["Each diagonal cuts both of its corners into two equal angles.", "So she is a rhombus. (diag. bisects \u2220s)"] },
        { who: "king", lines: ["Bella. You found her.", "Hugo is at peace. The region is whole again."] },
      ],
      outro: ["Three thrones, three daughters, and every proof answered.", "The rhombus region lowers its banners at last."],
    },
    {
      id: "rectangle-01",
      region: "rectangle",
      chapter: "Rectangle Region · Kingdom 1",
      name: "The Burgundy Court of Conrad",
      bg: "kd-rectangle-01.jpg",
      bgAngry: "kd-rectangle-01-angry.jpg",
      bgPuzzled: "kd-rectangle-01-puzzled.jpg",
      bgHappy: "kd-rectangle-01-happy.jpg",
      king: "king-rectangle-01.jpg",
      kingName: "King Conrad",
      intro: [
        { who: "king", lines: ["Help me find the princess.", "Every claimant here looks like a rectangle."] },
      ],
      cards: [
        {
          name: "Ivy",
          poly: para(6.5, 4, 90),
          rightAngles: [0, 3],
          why: "Only two of Ivy's corners are marked as right angles.\nAll four angles must be 90\u00b0.",
        },
        {
          name: "Jade",
          poly: para(6, 3.6, 90),
          arrows: ARROWS,
          why: "Jade's sides are marked parallel,\nbut none of her corners is marked as a right angle.",
        },
        { name: "Clara", poly: para(6, 4, 90), rightAngles: ALL_RIGHT },
      ],
      answer: 2,
      kingWrong: ["A false daughter on my throne?", "Guards, seize the sage!"],
      kingCorrect: ["Clara? Ivy carries right angles too.", "Tell me why Clara is the one."],
      reasonAnswer: 0,
      reasonWhy: [
        "",
        "No diagonals are drawn in her figure.",
      ],
      solve: [
        { who: "you", lines: ["All four of her angles are marked 90\u00b0.", "So she is a rectangle. (4 \u2220s = 90\u00b0)"] },
        { who: "king", lines: ["Clara! My daughter!", "Conrad owes you this peace, sage."] },
      ],
      outro: ["Conrad lowers his banners of war.", "The road runs on to the saffron halls of Rufus."],
    },
    {
      id: "rectangle-02",
      region: "rectangle",
      chapter: "Rectangle Region · Kingdom 2",
      name: "The Saffron Court of Rufus",
      bg: "kd-rectangle-02.jpg",
      bgAngry: "kd-rectangle-02-angry.jpg",
      bgPuzzled: "kd-rectangle-02-puzzled.jpg",
      bgHappy: "kd-rectangle-02-happy.jpg",
      king: "king-rectangle-02.jpg",
      kingName: "King Rufus",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Nora",
          poly: byDiags(3.6, 3.6, 3.6, 3.6, 112),
          diagTicks: [[0, 1], [1, 1], [2, 2], [3, 2]],
          why: "Nora's top halves match each other, and her bottom halves match each other,\nbut nothing shows her diagonals cut in half. They must bisect each other and be equal.",
        },
        {
          name: "Tessa",
          poly: byDiags(3.6, 3.6, 3.6, 3.6, 120),
          diagTicks: PAIRS,
          why: "Tessa's diagonals are marked as bisecting each other,\nbut the two diagonals are not marked equal.",
        },
        { name: "Vera", poly: byDiags(3.6, 3.6, 3.6, 3.6, 104), diagTicks: ALL_ONE },
      ],
      answer: 2,
      kingWrong: ["You call that my daughter?", "Rufus will answer with steel!"],
      kingCorrect: ["Vera? Only her diagonals are marked.", "Why Vera?"],
      reasonAnswer: 1,
      reasonWhy: [
        "No corner of her figure is marked as a right angle.",
        "",
      ],
      solve: [
        { who: "you", lines: ["All four halves of her diagonals are marked equal.", "So her diagonals bisect each other and are equal. (diags. equal)"] },
        { who: "king", lines: ["Vera. Come home.", "Rufus stands down. The region is whole again."] },
      ],
      outro: ["Two thrones, two daughters, and every proof answered.", "The rectangle region lowers its banners at last."],
    },
    {
      id: "square-01",
      region: "square",
      chapter: "Square Region · Kingdom 1",
      name: "The Cobalt Court of Alaric",
      bg: "kd-square-01.jpg",
      bgAngry: "kd-square-01-angry.jpg",
      bgPuzzled: "kd-square-01-puzzled.jpg",
      bgHappy: "kd-square-01-happy.jpg",
      king: "king-square-01.jpg",
      kingName: "King Alaric",
      intro: [
        { who: "king", lines: ["Help me find the princess.", "Every claimant here looks like a square."] },
        { who: "you", lines: ["A square needs the rhombus facts and the rectangle facts together.", "One without the other is not enough."] },
      ],
      cards: [
        {
          name: "Lena",
          poly: para(4, 4, 90),
          rightAngles: ALL_RIGHT,
          ticks: PAIRS,
          why: "All four of Lena's corners are 90\u00b0, but only her opposite sides are marked equal.\nThat proves a rectangle, not a square.",
        },
        {
          name: "Mabel",
          poly: para(4, 4, 90),
          ticks: ALL_ONE,
          why: "All four of Mabel's sides are marked equal, but no corner is marked 90\u00b0.\nThat proves a rhombus, not a square.",
        },
        { name: "Rosa", poly: para(4, 4, 90), rightAngles: ALL_RIGHT, ticks: ALL_ONE },
      ],
      answer: 2,
      kingWrong: ["Equal sides, and still not a square!", "Alaric has heard enough. To arms!"],
      kingCorrect: ["Rosa? Lena has four right angles too.", "Then prove Rosa is the square."],
      reasonAnswer: 0,
      reasonWhy: [
        "",
        "No diagonals are drawn in her figure.",
        "No diagonal is drawn in her figure.",
      ],
      solve: [
        { who: "you", lines: ["All four of her sides are marked equal, and all four angles are 90\u00b0.", "So she is a square. (4 sides equal and 4 \u2220s = 90\u00b0)"] },
        { who: "king", lines: ["Rosa. My daughter.", "Alaric sheathes his sword. Go well, sage."] },
      ],
      outro: ["The cobalt banners come down from the walls.", "Ahead, a rose-coloured court is waiting."],
    },
    {
      id: "square-02",
      region: "square",
      chapter: "Square Region · Kingdom 2",
      name: "The Rose Court of Bernard",
      bg: "kd-square-02.jpg",
      bgAngry: "kd-square-02-angry.jpg",
      bgPuzzled: "kd-square-02-puzzled.jpg",
      bgHappy: "kd-square-02-happy.jpg",
      king: "king-square-02.jpg",
      kingName: "King Bernard",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        { name: "Celia", poly: byDiags(3, 3, 3, 3, 90), rightCross: true, diagTicks: ALL_ONE },
        {
          name: "Dora",
          poly: byDiags(3, 3, 3, 3, 90),
          rightCross: true,
          diagTicks: PAIRS,
          why: "Dora's diagonals bisect each other at 90\u00b0, but they are not marked equal.\nThat proves a rhombus, not a square.",
        },
        {
          name: "Ines",
          poly: byDiags(3, 3, 3, 3, 90),
          diagTicks: ALL_ONE,
          why: "Ines's diagonals are equal and bisect each other, but nothing marks them as perpendicular.\nThat proves a rectangle, not a square.",
        },
      ],
      answer: 0,
      kingWrong: ["Marked diagonals everywhere, and you read them wrong!", "Bernard's patience is gone. To arms!"],
      kingCorrect: ["Celia? Not one of her corners is marked.", "How can she be a square?"],
      reasonAnswer: 1,
      reasonWhy: [
        "No side is marked equal and no corner is marked in her figure.",
        "",
        "No corner of her figure is marked as a right angle.",
      ],
      solve: [
        { who: "you", lines: ["All four halves of her diagonals are equal, and they meet at 90\u00b0.", "So she is a square. (diags. equal and \u22a5 bisect each other)"] },
        { who: "king", lines: ["Celia! You have come home.", "Bernard opens his gates to you, sage."] },
      ],
      outro: ["Bernard's knights step aside.", "One court is left: the bronze hall of Magnus."],
    },
    {
      id: "square-03",
      region: "square",
      chapter: "Square Region · Kingdom 3",
      name: "The Bronze Court of Magnus",
      bg: "kd-square-03.jpg",
      bgAngry: "kd-square-03-angry.jpg",
      bgPuzzled: "kd-square-03-puzzled.jpg",
      bgHappy: "kd-square-03-happy.jpg",
      king: "king-square-03.jpg",
      kingName: "King Magnus",
      intro: [
        { who: "king", lines: ["Help me find the princess."] },
      ],
      cards: [
        {
          name: "Pearl",
          poly: para(4, 4, 90),
          arrows: ARROWS,
          diagLines: [0],
          splitAngles: [[0, 1]],
          why: "Pearl's diagonal bisects her corner, but none of her corners is marked 90\u00b0.\nShe needs both facts to be a square.",
        },
        {
          name: "Sylvia",
          poly: para(5, 4, 90),
          rightAngles: ALL_RIGHT,
          diagLines: [0],
          splitAngles: [[0, 2, 1]],
          why: "All four of Sylvia's corners are 90\u00b0, but her diagonal cuts one into two different angles.\nThat corner is not bisected, so she is only a rectangle.",
        },
        { name: "Thea", poly: para(4, 4, 90), rightAngles: ALL_RIGHT, diagLines: [0], splitAngles: [[0, 1]] },
      ],
      answer: 2,
      kingWrong: ["Two daughters with four right angles each, and you chose the false one!", "Magnus rides to war!"],
      kingCorrect: ["Thea? Sylvia has four right angles and a diagonal too.", "Why her and not Sylvia?"],
      reasonAnswer: 2,
      reasonWhy: [
        "No side is marked equal in her figure.",
        "Only one diagonal is drawn, and nothing is marked where diagonals cross.",
        "",
      ],
      solve: [
        { who: "you", lines: ["All four of her angles are 90\u00b0, and her diagonal cuts a corner into two equal angles.", "So she is a square. (4 \u2220s = 90\u00b0 and diag. bisects \u2220s)"] },
        { who: "king", lines: ["Thea. Welcome home, my girl.", "Magnus yields. The last war is over."] },
      ],
      outro: ["Three thrones, three daughters, and not one sword drawn.", "The last banners in the land are lowered."],
    },
  ];

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MAX_REWIND = 3;

  var el = {};
  var index = -1;
  var typing = false;
  var typeTimer = null;
  var fullText = "";
  var stageReady = false;
  var mode = "intro"; // "intro" | "level" | "region-outro" | "card"
  var rewinds = MAX_REWIND;
  var levelNo = 0;
  var regionIndex = -1;
  // Shuffled once on load. The same seat order is used for every kingdom
  // and every replay until the page itself is reloaded.
  var reasonOrder = [];
  // A cross-fade owns the screen until the new beat is on it. Without this a
  // click landing mid-cut starts a second cut, and the first one still fires
  // its callbacks afterwards and repaints the beat we just left.
  var cutting = false;

  var lv = { data: null, phase: "", queue: [], chosen: -1, reasonMiss: 0, busy: false, picking: false };

  /* Scene cuts are timer-driven, so a jump (Skip intro, replay) must be able
   * to cancel every callback the previous scene still had in flight. */
  var timers = [];

  function later(fn, ms) {
    var id = setTimeout(function () {
      var k = timers.indexOf(id);
      if (k >= 0) timers.splice(k, 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }

  function cancelLater() {
    timers.forEach(clearTimeout);
    timers = [];
    // Whoever cancels the queue is taking the screen, so no cut is pending.
    cutting = false;
  }

  function svg(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function perimeter(points) {
    var total = 0;
    for (var i = 0; i < points.length; i++) {
      var a = points[i];
      var b = points[(i + 1) % points.length];
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return total;
  }

  function pointsAttr(points) {
    return points.map(function (p) { return p.join(","); }).join(" ");
  }

  function buildMapFx() {
    var fx = svg("svg", { class: "qg-mapfx", viewBox: "0 0 1600 900", preserveAspectRatio: "xMidYMid slice" });

    // Outer rect + parallelogram hole: evenodd keeps the focused region bright.
    var spot = svg("path", {
      class: "qg-spot",
      "fill-rule": "evenodd",
      d: "M0,0H1600V900H0Z M" + ZONES[0].points.map(function (p) { return p.join(","); }).join("L") + "Z",
    });
    fx.appendChild(spot);

    ZONES.forEach(function (zone, i) {
      var poly = svg("polygon", {
        class: "qg-zone" + (zone.id === "para" ? " hot" : ""),
        points: pointsAttr(zone.points),
        stroke: zone.stroke,
      });
      var len = Math.round(perimeter(zone.points));
      poly.style.setProperty("--len", len);
      poly.style.setProperty("--delay", (0.15 + i * 0.28) + "s");
      fx.appendChild(poly);
    });

    fx.appendChild(svg("path", { class: "qg-route", d: ROUTE }));

    // "Next stop": one shared set, aimed at a zone by setNextStop().
    fx.appendChild(svg("path", { class: "qg-spot-n", "fill-rule": "evenodd", d: "M0,0H1600V900H0Z" }));
    fx.appendChild(svg("polygon", { class: "qg-glow-n", points: "" }));
    fx.appendChild(svg("path", { class: "qg-route-n", d: "" }));
    fx.appendChild(svg("text", { class: "qg-tag-n", x: 0, y: 0 }));

    ZONES.forEach(function (zone) {
      var tag = svg("text", { class: "qg-zone-tag", x: zone.label[0], y: zone.label[1] });
      tag.textContent = zone.tag;
      fx.appendChild(tag);
    });

    return fx;
  }

  /* ─── geometry figures for the claimant cards ──────────────────────── */

  function unit(from, to) {
    var dx = to[0] - from[0];
    var dy = to[1] - from[1];
    var len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  }

  function segMarks(a, b, count, kind, shift) {
    var d = unit(a, b);
    var n = [-d[1], d[0]];
    var mx = (a[0] + b[0]) / 2 + d[0] * (shift || 0);
    var my = (a[1] + b[1]) / 2 + d[1] * (shift || 0);
    var gap = kind === "arrow" ? 3.6 : 2.8;
    var out = [];

    for (var k = 0; k < count; k++) {
      var off = (k - (count - 1) / 2) * gap;
      var cx = mx + d[0] * off;
      var cy = my + d[1] * off;
      if (kind === "arrow") {
        var wing = 3.6;
        var nose = 2.1;
        out.push(svg("path", {
          class: "qg-mark",
          d: "M" + (cx - d[0] * nose + n[0] * wing) + "," + (cy - d[1] * nose + n[1] * wing) +
             "L" + (cx + d[0] * nose) + "," + (cy + d[1] * nose) +
             "L" + (cx - d[0] * nose - n[0] * wing) + "," + (cy - d[1] * nose - n[1] * wing),
        }));
      } else {
        var half = 3.6;
        out.push(svg("line", {
          class: "qg-mark",
          x1: cx - n[0] * half, y1: cy - n[1] * half,
          x2: cx + n[0] * half, y2: cy + n[1] * half,
        }));
      }
    }
    return out;
  }

  function arcMarks(cur, u1, u2, count, base) {
    var sweep = (u1[0] * u2[1] - u1[1] * u2[0]) > 0 ? 1 : 0;
    var out = [];

    for (var k = 0; k < count; k++) {
      var r = (base || 9) + k * 3.4;
      out.push(svg("path", {
        class: "qg-mark",
        d: "M" + (cur[0] + u1[0] * r) + "," + (cur[1] + u1[1] * r) +
           "A" + r + "," + r + " 0 0 " + sweep + " " + (cur[0] + u2[0] * r) + "," + (cur[1] + u2[1] * r),
      }));
    }
    return out;
  }

  function angleMarks(P, v, count) {
    var cur = P[v];
    return arcMarks(cur, unit(cur, P[(v + P.length - 1) % P.length]), unit(cur, P[(v + 1) % P.length]), count);
  }

  function rightMark(cur, u1, u2) {
    var s = 5;
    return svg("path", {
      class: "qg-mark",
      d: "M" + (cur[0] + u1[0] * s) + "," + (cur[1] + u1[1] * s) +
         "L" + (cur[0] + (u1[0] + u2[0]) * s) + "," + (cur[1] + (u1[1] + u2[1]) * s) +
         "L" + (cur[0] + u2[0] * s) + "," + (cur[1] + u2[1] * s),
    });
  }

  function crossPoint(P) {
    var a = P[0], c = P[2], b = P[1], d = P[3];
    var d1x = c[0] - a[0], d1y = c[1] - a[1];
    var d2x = d[0] - b[0], d2y = d[1] - b[1];
    var den = d1x * d2y - d1y * d2x;
    if (!den) return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
    var t = ((b[0] - a[0]) * d2y - (b[1] - a[1]) * d2x) / den;
    return [a[0] + d1x * t, a[1] + d1y * t];
  }

  function buildFigure(spec) {
    var fig = svg("svg", { class: "qg-fig", viewBox: "0 0 120 100", "aria-hidden": "true" });
    var P = spec.poly;

    // diagLines picks single diagonals: 0 runs P0–P2, 1 runs P1–P3.
    var crossed = spec.diags || spec.diagTicks || spec.rightCross || spec.crossLabel || spec.halfLabels;
    var lines = crossed ? [0, 1] : spec.diagLines || [];
    lines.forEach(function (k) {
      fig.appendChild(svg("line", { class: "qg-diag", x1: P[k][0], y1: P[k][1], x2: P[k + 2][0], y2: P[k + 2][1] }));
    });

    fig.appendChild(svg("polygon", { class: "qg-poly", points: pointsAttr(P) }));

    // A side carrying both an equal-length tick and a parallel arrow needs the
    // two marks pulled apart, or they stack on the same mid-point.
    var shared = {};
    (spec.ticks || []).forEach(function (t) { shared[t[0]] = (shared[t[0]] || 0) + 1; });
    (spec.arrows || []).forEach(function (t) { shared[t[0]] = (shared[t[0]] || 0) + 1; });

    (spec.ticks || []).forEach(function (t) {
      var shift = shared[t[0]] > 1 ? -8 : 0;
      segMarks(P[t[0]], P[(t[0] + 1) % P.length], t[1], "tick", shift).forEach(function (m) { fig.appendChild(m); });
    });
    // Arcs and labels at a split corner reach far along its sides, so arrows there slide away from it.
    var split = {};
    (spec.splitAngles || []).forEach(function (t) { split[t[0]] = true; });
    (spec.arrows || []).forEach(function (t) {
      var shift = shared[t[0]] > 1 ? 8 : 0;
      if (split[t[0]]) shift += 9;
      if (split[(t[0] + 1) % 4]) shift -= 9;
      var from = P[t[0]];
      var to = P[(t[0] + 1) % P.length];
      // Walking the outline reverses sides 2 and 3, so flip them back and the
      // arrowheads of a parallel pair point the same way.
      var arrow = t[0] >= 2 ? segMarks(to, from, t[1], "arrow", -shift) : segMarks(from, to, t[1], "arrow", shift);
      arrow.forEach(function (m) { fig.appendChild(m); });
    });
    (spec.angles || []).forEach(function (t) {
      angleMarks(P, t[0], t[1]).forEach(function (m) { fig.appendChild(m); });
    });
    (spec.rightAngles || []).forEach(function (v) {
      var cur = P[v];
      fig.appendChild(rightMark(cur, unit(cur, P[(v + 3) % 4]), unit(cur, P[(v + 1) % 4])));
    });
    // A diagonal from vertex v splits that corner: [v, count] marks both
    // parts equal, [v, count, other] marks them as two different angles.
    // Each part's arc stops short of the diagonal; touching arcs would read as one mark on the whole corner.
    function turn(v, a) {
      return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    }
    function partArcs(cur, a, b, count) {
      var dir = (a[0] * b[1] - a[1] * b[0]) > 0 ? 1 : -1;
      var span = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1])));
      var gap = Math.min(12 * DEG, span / 3.2) * dir;
      arcMarks(cur, turn(a, gap), turn(b, -gap), count, 12).forEach(function (m) { fig.appendChild(m); });
    }
    (spec.splitAngles || []).forEach(function (t) {
      var cur = P[t[0]];
      var along = unit(cur, P[(t[0] + 2) % 4]);
      partArcs(cur, unit(cur, P[(t[0] + 3) % 4]), along, t[1]);
      partArcs(cur, along, unit(cur, P[(t[0] + 1) % 4]), t[2] || t[1]);
    });
    // [v, a, b, count] marks the angle at P[v] between the rays to P[a] and
    // P[b]; pointing at the opposite vertex measures against the diagonal.
    // A side-to-diagonal angle is narrow, so its arc alone reads like a tick;
    // a shaded wedge underneath shows it is an angle.
    (spec.arcs || []).forEach(function (t) {
      var cur = P[t[0]];
      var u1 = unit(cur, P[t[1]]);
      var u2 = unit(cur, P[t[2]]);
      var r = 14;
      var sweep = (u1[0] * u2[1] - u1[1] * u2[0]) > 0 ? 1 : 0;
      fig.appendChild(svg("path", {
        class: "qg-wedge",
        d: "M" + cur[0] + "," + cur[1] +
           "L" + (cur[0] + u1[0] * r) + "," + (cur[1] + u1[1] * r) +
           "A" + r + "," + r + " 0 0 " + sweep + " " + (cur[0] + u2[0] * r) + "," + (cur[1] + u2[1] * r) + "Z",
      }));
      arcMarks(cur, u1, u2, t[3], r).forEach(function (m) { fig.appendChild(m); });
    });

    var mid = crossPoint(P);
    if (spec.diagTicks) {
      spec.diagTicks.forEach(function (t) {
        segMarks(P[t[0]], mid, t[1], "tick").forEach(function (m) { fig.appendChild(m); });
      });
    }
    if (spec.rightCross) fig.appendChild(rightMark(mid, unit(mid, P[0]), unit(mid, P[1])));
    if (spec.crossAngles) {
      arcMarks(mid, unit(mid, P[0]), unit(mid, P[1]), spec.crossAngles, 6).forEach(function (m) { fig.appendChild(m); });
      arcMarks(mid, unit(mid, P[2]), unit(mid, P[3]), spec.crossAngles, 6).forEach(function (m) { fig.appendChild(m); });
    }

    var centre = [(P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4];
    function label(x, y, text) {
      var t = svg("text", { class: "qg-label", x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
      t.textContent = text;
      fig.appendChild(t);
    }
    // A label sits further out sideways than up or down, because the text is wider than it is tall.
    function awayFrom(at, n, base) {
      var off = base + 4.5 * Math.abs(n[0]);
      return [at[0] + n[0] * off, at[1] + n[1] * off];
    }
    function bisector(u1, u2) {
      var b = [u1[0] + u2[0], u1[1] + u2[1]];
      var len = Math.hypot(b[0], b[1]) || 1;
      return [b[0] / len, b[1] / len];
    }
    function halfAngle(u1, u2) {
      return Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
    }

    (spec.sideLabels || []).forEach(function (t) {
      var a = P[t[0]], b = P[(t[0] + 1) % 4];
      var d = unit(a, b);
      var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      var n = [-d[1], d[0]];
      if (n[0] * (m[0] - centre[0]) + n[1] * (m[1] - centre[1]) < 0) n = [-n[0], -n[1]];
      var at = awayFrom(m, n, 5.5);
      label(at[0], at[1], t[1]);
    });
    (spec.angleLabels || []).forEach(function (t) {
      var cur = P[t[0]];
      var u1 = unit(cur, P[(t[0] + 3) % 4]), u2 = unit(cur, P[(t[0] + 1) % 4]);
      arcMarks(cur, u1, u2, 1, 6).forEach(function (m) { fig.appendChild(m); });
      var r = Math.min(22, Math.max(12, 6 / Math.sin(halfAngle(u1, u2))));
      var u = bisector(u1, u2);
      label(cur[0] + u[0] * r, cur[1] + u[1] * r, t[1]);
    });
    (spec.splitLabels || []).forEach(function (t) {
      var cur = P[t[0]];
      var along = unit(cur, P[(t[0] + 2) % 4]);
      [[unit(cur, P[(t[0] + 3) % 4]), t[1]], [unit(cur, P[(t[0] + 1) % 4]), t[2]]].forEach(function (part) {
        var r = Math.min(30, Math.max(19, 7 / Math.sin(halfAngle(part[0], along))));
        var u = bisector(part[0], along);
        label(cur[0] + u[0] * r, cur[1] + u[1] * r, part[1]);
      });
    });
    // A half-diagonal's label goes into the wider of the two corners beside it.
    (spec.halfLabels || []).forEach(function (t) {
      var v = t[0];
      var d = unit(P[v], mid);
      var m = [(P[v][0] + mid[0]) / 2, (P[v][1] + mid[1]) / 2];
      var ray = unit(mid, P[v]);
      var next = unit(mid, P[(v + 1) % 4]), prev = unit(mid, P[(v + 3) % 4]);
      var toward = halfAngle(ray, next) >= halfAngle(ray, prev) ? next : prev;
      var n = [-d[1], d[0]];
      if (n[0] * toward[0] + n[1] * toward[1] < 0) n = [-n[0], -n[1]];
      var at = awayFrom(m, n, 4.5);
      label(at[0], at[1], t[1]);
    });
    if (spec.crossLabel) {
      var c0 = unit(mid, P[0]), c1 = unit(mid, P[1]);
      arcMarks(mid, c0, c1, 1, 6).forEach(function (m) { fig.appendChild(m); });
      var cu = bisector(c0, c1);
      var cr = Math.max(12, 6 / Math.sin(halfAngle(c0, c1)));
      label(mid[0] + cu[0] * cr, mid[1] + cu[1] * cr, spec.crossLabel);
    }

    return fig;
  }

  /* ─── stage construction ───────────────────────────────────────────── */

  function build(stage) {
    stage.innerHTML = "";

    var bg = document.createElement("img");
    bg.className = "qg-bg";
    bg.alt = "";
    bg.src = ART + TITLE.bg + V;
    stage.appendChild(bg);

    var vignette = document.createElement("div");
    vignette.className = "qg-layer qg-vignette";
    stage.appendChild(vignette);

    var mapFx = buildMapFx();
    stage.appendChild(mapFx);

    var hud = document.createElement("div");
    hud.className = "qg-hud";
    hud.innerHTML =
      '<span class="qg-hud-label">Rewinds</span>' +
      '<span class="qg-gems"><i></i><i></i><i></i></span>';
    stage.appendChild(hud);

    var chapter = document.createElement("div");
    chapter.className = "qg-chapter-tag";
    chapter.innerHTML = '<span class="qg-chapter-zone"></span><span class="qg-chapter-name"></span>';
    stage.appendChild(chapter);

    var ask = document.createElement("p");
    ask.className = "qg-ask";
    stage.appendChild(ask);

    var choices = document.createElement("div");
    choices.className = "qg-choices";
    stage.appendChild(choices);

    var reasonWrap = document.createElement("div");
    reasonWrap.className = "qg-reasonwrap";
    reasonWrap.innerHTML =
      '<div class="qg-focus"><span class="qg-focus-name"></span></div>' +
      '<div class="qg-reasons"></div>';
    stage.appendChild(reasonWrap);

    var corner = document.createElement("p");
    corner.className = "qg-tap-corner";
    corner.textContent = "(tap to continue)";
    stage.appendChild(corner);

    var dialogue = document.createElement("div");
    dialogue.className = "qg-dialogue";
    dialogue.innerHTML =
      '<span class="qg-avatar" aria-hidden="true"></span>' +
      '<p class="qg-speaker">You</p>' +
      '<p class="qg-text"><span class="qg-body"></span><span class="qg-caret"></span></p>' +
      '<p class="qg-tap">(tap to continue)</p>';
    stage.appendChild(dialogue);

    var skip = document.createElement("button");
    skip.type = "button";
    skip.className = "qg-skip";
    skip.textContent = "Skip intro";
    stage.appendChild(skip);

    var flash = document.createElement("div");
    flash.className = "qg-layer qg-flash";
    stage.appendChild(flash);

    var fade = document.createElement("div");
    fade.className = "qg-layer qg-fade";
    stage.appendChild(fade);

    var title = document.createElement("div");
    title.className = "qg-title";
    title.innerHTML =
      '<p class="qg-eyebrow"></p>' +
      "<h3></h3>" +
      '<p class="qg-sub"></p>' +
      '<button type="button" class="qg-start">Start</button>' +
      '<button type="button" class="qg-start qg-continue" hidden>Continue</button>';
    stage.appendChild(title);
    title.querySelector(".qg-eyebrow").textContent = TITLE.eyebrow;
    title.querySelector("h3").textContent = TITLE.heading;
    title.querySelector(".qg-sub").textContent = TITLE.sub;

    var card = document.createElement("div");
    card.className = "qg-card";
    card.innerHTML =
      '<p class="qg-chapter"></p>' +
      "<h4></h4>" +
      '<p class="qg-card-text"></p>' +
      '<div class="qg-card-actions"></div>';
    stage.appendChild(card);

    var settings = document.createElement("div");
    settings.className = "qg-settings";
    settings.innerHTML =
      '<button type="button" class="qg-settings-btn" aria-label="Settings" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" d="M9.49 5.09L10 1.69h4l.51 3.4.6.25 2.76-2.04 2.83 2.83-2.04 2.76.25.6h3.4v4h-3.4l-.25.6 2.04 2.76-2.83 2.83-2.76-2.04-.6.25L14 22.31h-4l-.51-3.4-.6-.25-2.76 2.04-2.83-2.83 2.04-2.76-.25-.6H1.69v-4h3.4l.25-.6L3.3 6.13 6.13 3.3l2.76 2.04.6-.25z"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>' +
      "</button>" +
      '<div class="qg-settings-panel">' +
        '<p class="qg-settings-title">Settings</p>' +
        '<label class="qg-settings-row">Music<input class="qg-vol-music" type="range" min="0" max="100" value="100"></label>' +
        '<label class="qg-settings-row">Sound<input class="qg-vol-sfx" type="range" min="0" max="100" value="100"></label>' +
        '<p class="qg-settings-title qg-levels-title">Select level</p>' +
        '<div class="qg-levels"></div>' +
        '<button type="button" class="qg-settings-home">Save and return home</button>' +
      "</div>";
    stage.appendChild(settings);

    el = {
      stage: stage,
      bg: bg,
      mapFx: mapFx,
      hud: hud,
      gems: [].slice.call(hud.querySelectorAll(".qg-gems i")),
      chapter: chapter,
      chapterZone: chapter.querySelector(".qg-chapter-zone"),
      chapterName: chapter.querySelector(".qg-chapter-name"),
      ask: ask,
      choices: choices,
      reasonWrap: reasonWrap,
      focus: reasonWrap.querySelector(".qg-focus"),
      focusName: reasonWrap.querySelector(".qg-focus-name"),
      reasons: reasonWrap.querySelector(".qg-reasons"),
      corner: corner,
      dialogue: dialogue,
      avatar: dialogue.querySelector(".qg-avatar"),
      speaker: dialogue.querySelector(".qg-speaker"),
      body: dialogue.querySelector(".qg-body"),
      tap: dialogue.querySelector(".qg-tap"),
      skip: skip,
      flash: flash,
      fade: fade,
      title: title,
      start: title.querySelector(".qg-start"),
      continueBtn: title.querySelector(".qg-continue"),
      card: card,
      cardChapter: card.querySelector(".qg-chapter"),
      cardHead: card.querySelector("h4"),
      cardText: card.querySelector(".qg-card-text"),
      cardActions: card.querySelector(".qg-card-actions"),
      settings: settings,
      settingsBtn: settings.querySelector(".qg-settings-btn"),
      settingsHome: settings.querySelector(".qg-settings-home"),
      volMusic: settings.querySelector(".qg-vol-music"),
      volSfx: settings.querySelector(".qg-vol-sfx"),
      levels: settings.querySelector(".qg-levels"),
    };
  }

  function setBg(file, ken) {
    var next = ART + file + V;
    if (el.bg.getAttribute("src") !== next) el.bg.src = next;
    el.bg.className = "qg-bg";
    void el.bg.offsetWidth;
    if (ken) el.bg.classList.add(ken);
  }

  /* Swap the palace plate for the king's current temper. Kingdoms without a
   * plate for that mood simply stay on their calm one. */
  function setMood(mood) {
    var data = lv.data;
    if (!data || mode !== "level") return;
    var file =
      (mood === "angry" && data.bgAngry) ||
      (mood === "puzzled" && data.bgPuzzled) ||
      (mood === "happy" && data.bgHappy) ||
      data.bg;
    setBg(file);
  }

  /* ─── dialogue typing ──────────────────────────────────────────────── */

  function clearTyping() {
    if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
    typing = false;
    el.dialogue.classList.remove("typing");
  }

  function unlockDialogueHeight() {
    el.dialogue.style.minHeight = "";
  }

  function lockDialogueHeight(text) {
    unlockDialogueHeight();
    el.body.textContent = text;
    var h = el.dialogue.offsetHeight;
    var w = el.stage.clientWidth || 1;
    el.dialogue.style.minHeight = (h / w * 100) + "cqw";
  }

  function finishTyping() {
    clearTyping();
    el.body.textContent = fullText;
    el.tap.classList.add("on");
  }

  function typeText(text) {
    fullText = text;
    el.tap.classList.remove("on");
    el.corner.classList.remove("on");
    lockDialogueHeight(text);
    el.body.textContent = "";
    typing = true;
    el.dialogue.classList.add("typing");

    // Dialogue is silent: no per-letter voice blips while a line types out.
    var i = 0;
    function step() {
      if (i >= text.length) { finishTyping(); return; }
      var ch = text[i++];
      el.body.textContent += ch;
      var wait = 24;
      if (ch === "," || ch === ";" || ch === "—") wait = 150;
      else if (ch === "." || ch === "!" || ch === "?") wait = 260;
      else if (ch === "\n") wait = 180;
      typeTimer = setTimeout(step, wait);
    }
    step();
  }

  function hideDialogue() {
    clearTyping();
    unlockDialogueHeight();
    el.dialogue.classList.remove("on");
    el.tap.classList.remove("on");
    el.stage.classList.remove("talking");
  }

  /* War under the story, court under the parallelogram kingdoms, one holy whoosh on rewind. */
  var audio = { ctx: null, master: null, music: null, sfx: null, bed: "", gen: 0, timer: null, noise: null };

  function ensureAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audio.ctx) {
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.9;
      // Brick-wall limiter: the beds used to clip on laptop speakers.
      audio.limiter = audio.ctx.createDynamicsCompressor();
      audio.limiter.threshold.value = -9;
      audio.limiter.knee.value = 4;
      audio.limiter.ratio.value = 16;
      audio.limiter.attack.value = 0.002;
      audio.limiter.release.value = 0.18;
      audio.master.connect(audio.limiter);
      audio.limiter.connect(audio.ctx.destination);
      audio.music = audio.ctx.createGain();
      // Keep sub-bass out of the music bus; small speakers turn it into buzz.
      audio.musicHp = audio.ctx.createBiquadFilter();
      audio.musicHp.type = "highpass";
      audio.musicHp.frequency.value = 70;
      audio.musicHp.Q.value = 0.7;
      audio.music.connect(audio.musicHp);
      audio.musicHp.connect(audio.master);
      audio.sfx = audio.ctx.createGain();
      audio.sfx.connect(audio.master);
      applyMix();
    }
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return audio.ctx;
  }

  function noiseBuffer() {
    if (audio.noise) return audio.noise;
    var len = audio.ctx.sampleRate;
    var buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    audio.noise = buf;
    return buf;
  }

  function tone(freq, t, dur, type, gain) {
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t + 0.03);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(audio.music);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noiseHit(t, dur, freq, gain) {
    var ctx = audio.ctx;
    var src = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    var amp = ctx.createGain();
    src.buffer = noiseBuffer();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(audio.music);
    src.start(t);
    src.stop(t + dur);
  }

  function ensureSpace() {
    if (audio.space) return audio.space;
    var ctx = audio.ctx;
    var rate = ctx.sampleRate;
    var seconds = 2.2;
    var len = Math.floor(rate * seconds);
    var impulse = ctx.createBuffer(2, len, rate);
    var taps = [0.013, 0.029, 0.047, 0.071, 0.098];
    for (var ch = 0; ch < 2; ch++) {
      var data = impulse.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        var n = i / rate;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / seconds, 3) * 0.4;
      }
      taps.forEach(function (at, k) {
        var idx = Math.floor((at + ch * 0.005) * rate);
        if (idx < len) data[idx] += (k % 2 ? 0.4 : -0.3) * (1 - k * 0.12);
      });
    }
    var conv = ctx.createConvolver();
    conv.buffer = impulse;
    conv.connect(audio.master);
    audio.space = conv;
    return conv;
  }

  // Music reverb must sit behind the music fader, unlike the SFX space.
  function musicSpace() {
    if (audio.musicSpace) return audio.musicSpace;
    var conv = audio.ctx.createConvolver();
    conv.buffer = ensureSpace().buffer;
    conv.connect(audio.music);
    audio.musicSpace = conv;
    return conv;
  }

  // Drum body must not glide in pitch: a falling sine reads as a bubble on laptop speakers.
  function drum(t, gain) {
    var ctx = audio.ctx;
    var src = ctx.createBufferSource();
    var band = ctx.createBiquadFilter();
    var amp = ctx.createGain();
    src.buffer = noiseBuffer();
    band.type = "bandpass";
    band.frequency.value = 220;
    band.Q.value = 1.4;
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(band);
    band.connect(amp);
    amp.connect(audio.music);
    src.start(t);
    src.stop(t + 0.18);
    noiseHit(t, 0.02, 4000, gain * 0.25);
  }

  // Bass sits an octave above the speaker roll-off and is filtered so it hums instead of buzzing.
  function bassNote(freq, t, dur, gain) {
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    var low = ctx.createBiquadFilter();
    var amp = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    low.type = "lowpass";
    low.frequency.value = 700;
    low.Q.value = 0.5;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(low);
    low.connect(amp);
    amp.connect(audio.music);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function swell(freq, t, attack, dur, type, gain, wet) {
    var ctx = audio.ctx;
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    var send = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    send.gain.value = wet;
    osc.connect(amp);
    amp.connect(audio.music);
    amp.connect(send);
    send.connect(musicSpace());
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function playRewind() {
    var ctx = ensureAudio();
    if (!ctx) return;
    var t = ctx.currentTime;
    var space = ensureSpace();

    var src = ctx.createBufferSource();
    var high = ctx.createBiquadFilter();
    var air = ctx.createGain();
    var airWet = ctx.createGain();
    src.buffer = noiseBuffer();
    src.loop = true;
    high.type = "highpass";
    high.Q.setValueAtTime(0.5, t);
    high.frequency.setValueAtTime(1600, t);
    high.frequency.exponentialRampToValueAtTime(6400, t + 0.16);
    high.frequency.exponentialRampToValueAtTime(2200, t + 0.42);
    air.gain.setValueAtTime(0.0001, t);
    air.gain.exponentialRampToValueAtTime(0.42, t + 0.035);
    air.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
    airWet.gain.value = 0.28;
    src.connect(high);
    high.connect(air);
    air.connect(audio.sfx);
    air.connect(airWet);
    airWet.connect(space);
    src.start(t);
    src.stop(t + 0.5);

    [1046, 1050, 1568].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      var dry = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(i === 2 ? 0.025 : 0.055, t + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      dry.gain.value = 0.08;
      osc.connect(g);
      g.connect(space);
      g.connect(dry);
      dry.connect(audio.sfx);
      osc.start(t);
      osc.stop(t + 1.55);
    });
  }

  var AUDIO_KEY = "jm29-qg-audio-v1";
  var mix = { music: 1, sfx: 1 };

  function clamp01(n) {
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function readMix() {
    try {
      var data = JSON.parse(localStorage.getItem(AUDIO_KEY));
      if (!data) return;
      if (typeof data.music === "number") mix.music = clamp01(data.music);
      if (typeof data.sfx === "number") mix.sfx = clamp01(data.sfx);
    } catch (err) {}
  }

  function applyMix() {
    if (audio.music) audio.music.gain.value = 4 * mix.music;
    if (audio.sfx) audio.sfx.gain.value = mix.sfx;
  }

  function writeMix() {
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(mix)); } catch (err) {}
    applyMix();
  }

  function playButton() {
    var ctx = ensureAudio();
    if (!ctx || mix.sfx <= 0) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.012);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    osc.connect(g);
    g.connect(audio.sfx);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  function playSample(name) {
    var clip = new Audio(ART + name + V);
    clip.volume = mix.sfx;
    var pending = clip.play();
    if (pending && pending.catch) pending.catch(function () {});
  }

  function playReasonMiss() {
    var ctx = ensureAudio();
    if (!ctx || mix.sfx <= 0) return;
    var t = ctx.currentTime;
    [0, 0.11].forEach(function (offset) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      var start = t + offset;
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.2, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      osc.connect(g);
      g.connect(audio.sfx);
      osc.start(start);
      osc.stop(start + 0.08);
    });
  }

  function stopMusic() {
    if (audio.timer) { clearInterval(audio.timer); audio.timer = null; }
    audio.gen += 1;
    audio.bed = "";
  }

  function bedStep(name, step, t) {
    if (name === "battle") {
      if (step % 4 === 0) drum(t, 0.32);
      if (step % 8 === 4) noiseHit(t, 0.08, 1800, 0.08);
      if (step % 8 === 6) noiseHit(t, 0.05, 900, 0.06);
      var bass = [147, 147, 220, 147, 175, 147, 196, 147];
      if (step % 2 === 0) bassNote(bass[(step / 2) % bass.length], t, 0.22, 0.09);
    } else if (name === "court") {
      var court = [220, 262, 330, 392, 370, 330, 294, 262];
      tone(court[step % court.length], t, 0.34, "triangle", 0.09);
      if (step % 4 === 0) tone(110, t, 0.6, "sine", 0.075);
    } else if (name === "rhombus") {
      var lead = [294, 370, 440, 587, 554, 440, 370, 330, 294, 370, 494, 587, 554, 494, 440, 370];
      tone(lead[step % lead.length], t, 0.3, "triangle", 0.08);
      if (step % 2 === 1) tone(lead[step % lead.length] * 2, t, 0.18, "sine", 0.025);
      var root = [147, 147, 124, 110];
      if (step % 4 === 0) tone(root[(step / 4) % root.length], t, 1.1, "sine", 0.08);
    } else if (name === "rectangle") {
      // Low C harmonic minor: pumping octave bass, semitone threats, syncopated drums.
      var bar = Math.floor(step / 16) % 4;
      var beat = step % 16;
      var root = [131, 104, 87, 98][bar];
      bassNote(beat % 2 ? root * 2 : root, t, 0.13, beat % 4 === 0 ? 0.07 : 0.045);
      var motif = [
        262, 0, 0, 311, 0, 0, 294, 0, 247, 0, 0, 262, 0, 0, 208, 0,
        262, 0, 0, 311, 0, 0, 349, 0, 311, 0, 294, 0, 247, 0, 196, 0,
      ];
      var note = motif[(bar % 2) * 16 + beat];
      if (note) tone(note, t, 0.28, "triangle", 0.07);
      if (bar === 3 && beat >= 8) tone(beat % 2 ? 415 : 392, t, 0.12, "square", 0.012);
      if (beat === 0 || beat === 6 || beat === 8 || beat === 11) drum(t, 0.32);
      if (beat === 4 || beat === 12) noiseHit(t, 0.1, 2200, 0.09);
      if (beat % 2 === 1) noiseHit(t, 0.025, 8000, 0.025);
    } else if (name === "square") {
      // Regal F-major march in the same triangle-lead voice as the other regions.
      var march = [349, 440, 523, 698, 659, 523, 587, 523, 466, 587, 698, 587, 523, 440, 392, 440];
      tone(march[step % march.length], t, 0.3, "triangle", 0.08);
      if (step % 2 === 1) tone(march[step % march.length] * 2, t, 0.16, "sine", 0.02);
      var walk = [175, 175, 233, 262];
      if (step % 4 === 0) bassNote(walk[(step / 4) % walk.length], t, 0.9, 0.08);
      if (step % 8 === 0) drum(t, 0.22);
      if (step % 8 === 4) noiseHit(t, 0.07, 2600, 0.06);
    } else if (name === "journey") {
      // Casual adventure between regions: C – G – Am – F stroll, plucky lead,
      // oom-pah bass and strums, a soft shaker. Eight bars of eight eighth-notes.
      var jbar = Math.floor(step / 8) % 8;
      var jpos = step % 8;
      var jlead = [
        [392, 0, 523, 0, 659, 0, 523, 392],
        [494, 0, 587, 0, 784, 0, 587, 494],
        [440, 0, 523, 0, 659, 0, 523, 440],
        [349, 0, 440, 0, 523, 0, 440, 392],
        [659, 0, 523, 0, 392, 0, 523, 0],
        [587, 0, 494, 0, 392, 494, 587, 0],
        [523, 0, 440, 0, 349, 440, 523, 0],
        [587, 0, 494, 0, 587, 0, 392, 0],
      ][jbar][jpos];
      if (jlead) {
        tone(jlead, t, 0.2, "triangle", 0.08);
        if (jpos % 4 === 0) tone(jlead * 2, t, 0.1, "sine", 0.018);
      }
      var jroot = [131, 196, 110, 175, 131, 196, 175, 196][jbar];
      var jfifth = [196, 147, 165, 131, 196, 147, 131, 147][jbar];
      if (jpos === 0 || jpos === 4) bassNote(jroot, t, 0.2, 0.07);
      if (jpos === 2 || jpos === 6) {
        bassNote(jfifth, t, 0.14, 0.04);
        [
          [262, 330, 392], [247, 294, 392], [262, 330, 440], [262, 349, 440],
          [262, 330, 392], [247, 294, 392], [262, 349, 440], [247, 294, 392],
        ][jbar].forEach(function (f) { tone(f, t, 0.12, "triangle", 0.022); });
      }
      if (jpos === 0 || jpos === 4) drum(t, 0.12);
      if (jpos % 2 === 1) noiseHit(t, 0.03, 9000, 0.02);
    } else if (name === "finale") {
      // Reserved for the ending: harp arpeggio over C – Am – F – G, a simple tune, a soft pad.
      var pos = step % 32;
      var chord = Math.floor(pos / 8);
      var harp = [
        [262, 330, 392, 494, 523, 494, 392, 330],
        [220, 262, 330, 392, 440, 392, 330, 262],
        [175, 262, 349, 440, 523, 440, 349, 262],
        [196, 294, 392, 494, 587, 494, 392, 294],
      ][chord][pos % 8];
      swell(harp, t, 0.01, 1.1, "triangle", 0.028, 0.55);
      if (pos % 8 === 0) {
        [[131, 196], [110, 165], [87, 131], [98, 147]][chord].forEach(function (f) {
          swell(f, t, 1.4, 3.4, "sine", 0.03, 0.5);
        });
      }
      var tune = [
        659, 0, 0, 0, 587, 0, 523, 0, 587, 0, 0, 0, 0, 0, 0, 0,
        523, 0, 0, 0, 659, 0, 784, 0, 659, 0, 587, 0, 0, 0, 0, 0,
      ][pos];
      if (tune) {
        swell(tune, t, 0.02, 2.2, "sine", 0.04, 0.75);
        swell(tune * 2, t, 0.02, 1, "sine", 0.007, 0.75);
      }
    }
  }

  function setBed(name) {
    if (!name || !ensureAudio()) return;
    if (audio.bed === name) return;
    stopMusic();
    audio.bed = name;
    var gen = audio.gen;
    var step = 0;
    var ms = name === "battle" ? 170 : name === "rhombus" ? 300 : name === "rectangle" ? 150 : name === "square" ? 300 : name === "finale" ? 380 : name === "journey" ? 240 : 340;
    function tick() {
      if (gen !== audio.gen || !audio.ctx) return;
      bedStep(name, step, audio.ctx.currentTime);
      step += 1;
    }
    tick();
    audio.timer = setInterval(tick, ms);
  }

  /* ─── opening chapter ──────────────────────────────────────────────── */

  function renderGems() {
    el.gems.forEach(function (gem, i) { gem.classList.toggle("lit", i < rewinds); });
  }

  var NEXT_CLASSES = ["next-stop", "next-rhombus", "next-rectangle", "next-square"];

  function setNextStop(key) {
    var stop = NEXT_STOPS[key];
    var zone = ZONES[stop.zone];
    var fx = el.mapFx;
    fx.querySelector(".qg-spot-n").setAttribute(
      "d",
      "M0,0H1600V900H0Z M" + zone.points.map(function (p) { return p.join(","); }).join("L") + "Z"
    );
    var glow = fx.querySelector(".qg-glow-n");
    glow.setAttribute("points", pointsAttr(zone.points));
    glow.style.setProperty("--len", Math.round(perimeter(zone.points)));
    fx.querySelector(".qg-route-n").setAttribute("d", stop.route);
    var tag = fx.querySelector(".qg-tag-n");
    tag.setAttribute("x", zone.label[0]);
    tag.setAttribute("y", zone.label[1]);
    tag.textContent = stop.name;
  }

  function applyFx(name) {
    var relic = name === "relic";
    var map = name === "map-zones" || name === "map-focus";

    el.hud.classList.toggle("on", relic || map);
    if (relic && !el.gems[0].classList.contains("lit")) {
      el.gems.forEach(function (gem, i) {
        later(function () { gem.classList.add("lit"); }, 260 + i * 280);
      });
      later(function () {
        el.flash.classList.remove("on");
        void el.flash.offsetWidth;
        el.flash.classList.add("on");
      }, 180);
    } else if (map) {
      el.gems.forEach(function (gem) { gem.classList.add("lit"); });
    } else if (!relic) {
      el.gems.forEach(function (gem) { gem.classList.remove("lit"); });
    }

    el.mapFx.classList.toggle("on", map);
    el.mapFx.classList.toggle("focus", name === "map-focus");
    el.mapFx.classList.toggle("labels", map);
    var next = name && name.indexOf("next-") === 0 ? name.slice(5) : "";
    if (!NEXT_STOPS[next]) next = "";
    if (next) setNextStop(next);
    el.mapFx.classList.toggle("next-stop", !!next);
    ["rhombus", "rectangle", "square"].forEach(function (key) {
      el.mapFx.classList.toggle("next-" + key, key === next);
    });
  }

  function renderBeat(beat) {
    var speech = beat.mode === "speech";
    var narration = beat.mode === "narration";
    var scene = beat.mode === "scene";

    el.dialogue.classList.toggle("narration", narration);
    el.dialogue.classList.toggle("high", !!beat.high);
    el.dialogue.classList.remove("king");
    el.avatar.style.backgroundImage = "";
    el.speaker.textContent = "You";

    el.stage.classList.toggle("talking", speech || narration);

    if (scene) {
      el.dialogue.classList.remove("on");
      el.tap.classList.remove("on");
      el.corner.classList.add("on");
      clearTyping();
      unlockDialogueHeight();
    } else {
      el.corner.classList.remove("on");
      el.dialogue.classList.add("on");
      typeText(beat.lines.join("\n"));
    }

    el.dialogue.setAttribute("aria-hidden", scene ? "true" : "false");
    if (speech || narration) el.dialogue.setAttribute("aria-live", "polite");
    applyFx(beat.fx);
    if (beat.music) setBed(beat.music);
  }

  function goTo(i, instant) {
    var beat = BEATS[i];
    var prev = BEATS[index];
    var sameShot = prev && prev.bg === beat.bg;
    index = i;

    el.skip.classList.toggle("on", i < BEATS.length - 1);

    if (sameShot || instant) {
      renderBeat(beat);
      return;
    }

    cutting = true;
    hideDialogue();
    el.corner.classList.remove("on");
    el.fade.classList.add("on");
    later(function () {
      setBg(beat.bg, beat.ken);
      el.fade.classList.remove("on");
      later(function () {
        cutting = false;
        renderBeat(beat);
      }, 220);
    }, 360);
  }

  var outroRegion = "para";

  function regionOf(data) {
    return (data && data.region) || "para";
  }

  function regionFirst(id) {
    for (var i = 0; i < LEVELS.length; i++) if (regionOf(LEVELS[i]) === id) return i;
    return 0;
  }

  function regionLast(id) {
    for (var i = LEVELS.length - 1; i >= 0; i--) if (regionOf(LEVELS[i]) === id) return i;
    return LEVELS.length - 1;
  }

  function goRegionTo(i) {
    var beats = REGIONS[outroRegion].outro;
    var beat = beats[i];
    var prev = beats[regionIndex];
    var sameShot = prev && prev.bg === beat.bg;
    regionIndex = i;

    if (sameShot) {
      renderBeat(beat);
      return;
    }

    cutting = true;
    hideDialogue();
    el.corner.classList.remove("on");
    el.fade.classList.add("on");
    later(function () {
      setBg(beat.bg, beat.ken);
      el.fade.classList.remove("on");
      later(function () {
        cutting = false;
        renderBeat(beat);
      }, 220);
    }, 360);
  }

  function startRegionOutro(region) {
    mode = "region-outro";
    outroRegion = REGIONS[region] ? region : "para";
    cancelLater();
    clearScreen();
    el.card.classList.remove("on", "over");
    regionIndex = -1;
    writeSave({ spot: "region-outro", level: regionLast(outroRegion), region: outroRegion });
    goRegionTo(0);
  }

  function regionAdvance() {
    if (typing) { finishTyping(); return; }
    if (regionIndex >= REGIONS[outroRegion].outro.length - 1) {
      showRegionCard(outroRegion);
      return;
    }
    goRegionTo(regionIndex + 1);
  }

  /* ─── kingdom runtime ──────────────────────────────────────────────── */

  function say(who, lines) {
    var narration = who === "narration";
    var king = who === "king";

    el.dialogue.classList.toggle("narration", narration);
    el.dialogue.classList.toggle("king", king);
    // Kings without a portrait plate are cropped out of their calm palace.
    el.dialogue.classList.toggle("crop", !!(king && lv.data && !lv.data.king));
    if (king && lv.data) {
      var kingImage = 'url("' + ART + (lv.data.king || lv.data.bg) + V + '")';
      el.dialogue.setAttribute("data-region", regionOf(lv.data));
      el.avatar.style.backgroundImage = lv.data.king ? kingImage : "";
      el.avatar.style.setProperty("--qg-king-image", kingImage);
      el.speaker.textContent = lv.data.kingName;
    } else {
      el.dialogue.removeAttribute("data-region");
      el.avatar.style.backgroundImage = "";
      el.avatar.style.removeProperty("--qg-king-image");
      el.speaker.textContent = "You";
    }
    el.stage.classList.add("talking");
    el.corner.classList.remove("on");
    el.dialogue.classList.add("on");
    el.dialogue.setAttribute("aria-hidden", "false");
    typeText(lines.join("\n"));
  }

  function queueSay(who, lines) {
    lv.queue.push({ who: who, lines: lines });
  }

  function lvAdvance() {
    if (lv.busy) return;
    if (typing) { finishTyping(); return; }
    if (lv.queue.length) {
      var beat = lv.queue.shift();
      say(beat.who, beat.lines);
      return;
    }
    lvPhaseEnd();
  }

  function shuffled(n) {
    var order = [];
    for (var i = 0; i < n; i++) order.push(i);
    for (var k = order.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var tmp = order[k]; order[k] = order[j]; order[j] = tmp;
    }
    return order;
  }

  function showChoices(data) {
    el.choices.innerHTML = "";
    el.choices.classList.remove("locked");
    // Reshuffle every time, so the true princess is never in a fixed seat.
    shuffled(data.cards.length).forEach(function (source, i) {
      var card = data.cards[source];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qg-choice";
      btn.style.setProperty("--i", i);
      btn.appendChild(buildFigure(card));
      var name = document.createElement("span");
      name.className = "qg-choice-name";
      name.textContent = card.name;
      btn.appendChild(name);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        pickCard(source, btn);
      });
      el.choices.appendChild(btn);
    });
    el.ask.textContent = REGIONS[regionOf(data)].ask;
    el.ask.classList.add("on");
    el.choices.classList.add("on");
    lv.picking = true;
  }

  function hideChoices() {
    lv.picking = false;
    el.ask.classList.remove("on");
    el.choices.classList.remove("on");
  }

  function rewind(after) {
    // The relic must still have a charge left; running dry ends the run.
    if (rewinds <= 0) { gameOver(); return; }
    lv.busy = true;
    rewinds -= 1;
    writeSave({ spot: "level", level: levelNo, rewinds: rewinds });
    renderGems();
    el.hud.classList.add("spend");

    later(function () {
      playRewind();
      el.flash.classList.remove("on", "bad");
      void el.flash.offsetWidth;
      el.flash.classList.add("on");
      el.stage.classList.add("rewinding");
    }, 220);

    later(function () {
      el.hud.classList.remove("spend");
      el.stage.classList.remove("rewinding");
      lv.busy = false;
      after();
    }, 1000);
  }

  function shakeAngry() {
    setMood("angry");
    el.stage.classList.remove("shake");
    void el.stage.offsetWidth;
    el.stage.classList.add("shake");
    el.flash.classList.remove("on", "bad");
    void el.flash.offsetWidth;
    el.flash.classList.add("on", "bad");
    later(function () { el.stage.classList.remove("shake"); }, 700);
  }

  function pickCard(i, btn) {
    if (!lv.picking || lv.busy) return;
    var data = lv.data;
    lv.picking = false;
    // The verdict animation owns the screen until the king answers.
    lv.busy = true;

    if (i === data.answer) {
      playSample("sfx-right.mp3");
      btn.classList.add("right");
      el.choices.classList.add("locked");
      lv.chosen = i;
      later(function () {
        hideChoices();
        if (!REGIONS[regionOf(data)].reasons) {
          lv.phase = "solve";
          setMood("happy");
          queueSay("king", data.kingCorrect);
          data.solve.forEach(function (b) { queueSay(b.who, b.lines); });
          queueSay("narration", data.outro);
          lv.busy = false;
          lvAdvance();
          return;
        }
        lv.phase = "reason-intro";
        queueSay("king", data.kingCorrect);
        lv.busy = false;
        lvAdvance();
      }, 900);
      return;
    }

    playSample("sfx-wrong.mp3");
    btn.classList.add("wrong");
    shakeAngry();
    later(function () {
      hideChoices();
      lv.phase = "card-wrong";
      queueSay("king", data.kingWrong);
      queueSay("you", data.cards[i].why.split("\n"));
      lv.busy = false;
      lvAdvance();
    }, 760);
  }

  function showReasons(data) {
    [].forEach.call(el.focus.querySelectorAll(".qg-fig"), function (n) { n.remove(); });
    el.focus.insertBefore(buildFigure(data.cards[data.answer]), el.focusName);
    el.focusName.textContent = data.cards[data.answer].name;

    el.reasons.innerHTML = "";
    el.reasons.classList.remove("locked");

    // Reason positions must not reveal the answer. Keep the source index on
    // each button so shuffling never changes which reason it represents.
    var texts = REGIONS[regionOf(data)].reasons;
    var seats = lv.reasonOrder.filter(function (i) { return i < texts.length; });
    seats.forEach(function (i, seat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qg-reason";
      btn.style.setProperty("--i", seat);
      btn.textContent = texts[i];
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        chooseReason(i, btn);
      });
      el.reasons.appendChild(btn);
    });

    el.ask.textContent = "Choose the reason for " + data.cards[data.answer].name + ".";
    el.ask.classList.add("on");
    el.reasonWrap.classList.add("on");
    lv.picking = true;
  }

  function hideReasons() {
    lv.picking = false;
    el.ask.classList.remove("on");
    el.reasonWrap.classList.remove("on");
  }

  function chooseReason(i, btn) {
    if (!lv.picking || lv.busy) return;
    var data = lv.data;
    lv.picking = false;
    // The verdict animation owns the screen until the king answers.
    lv.busy = true;

    if (i === data.reasonAnswer) {
      playSample("sfx-right.mp3");
      btn.classList.add("right");
      el.reasons.classList.add("locked");
      later(function () {
        hideReasons();
        lv.phase = "solve";
        setMood("happy");
        data.solve.forEach(function (b) { queueSay(b.who, b.lines); });
        queueSay("narration", data.outro);
        lv.busy = false;
        lvAdvance();
      }, 900);
      return;
    }

    playReasonMiss();
    btn.classList.add("wrong");
    var explanation = data.reasonWhy[i];
    lv.reasonMiss += 1;

    if (lv.reasonMiss === 1) {
      // First slip is a warning: the king only frowns.
      setMood("puzzled");
      later(function () {
        hideReasons();
        lv.phase = "reason-warn";
        queueSay("king", ["Hmm. That is not what her marks say.", "I will allow you one more attempt."]);
        queueSay("you", [explanation, "Let me read her figure again."]);
        lv.busy = false;
        lvAdvance();
      }, 700);
      return;
    }

    shakeAngry();
    later(function () {
      hideReasons();
      lv.phase = "reason-rage";
      queueSay("king", ["Enough! You cannot even name your own reasoning!"]);
      queueSay("you", [explanation, "The relic turns the moment back."]);
      lv.busy = false;
      lvAdvance();
    }, 760);
  }

  function lvPhaseEnd() {
    var data = lv.data;
    switch (lv.phase) {
      case "intro":
        lv.phase = "cards";
        hideDialogue();
        showChoices(data);
        break;
      case "card-wrong":
        hideDialogue();
        rewind(function () {
          lv.phase = "cards";
          setMood("calm");
          showChoices(data);
        });
        break;
      case "reason-intro":
        lv.phase = "reason";
        hideDialogue();
        setMood("calm");
        showReasons(data);
        break;
      case "reason-warn":
        lv.phase = "reason";
        hideDialogue();
        // Keep the warning mood visible during the second attempt. The next
        // submission will move the king to happy or angry.
        showReasons(data);
        break;
      case "reason-rage":
        hideDialogue();
        // The rewind returns to the second attempt, so one more slip is fatal.
        lv.reasonMiss = 1;
        rewind(function () {
          lv.phase = "reason";
          setMood("calm");
          showReasons(data);
        });
        break;
      case "solve":
        lv.phase = "done";
        hideDialogue();
        if (LEVELS[levelNo + 1] && regionOf(LEVELS[levelNo + 1]) === regionOf(data)) startLevel(levelNo + 1);
        else startRegionOutro(regionOf(data));
        break;
      default:
        break;
    }
  }

  function closeSettings() {
    el.settings.classList.remove("open");
    el.settingsBtn.setAttribute("aria-expanded", "false");
  }

  function jumpToLevel(n) {
    cancelLater();
    rewinds = MAX_REWIND;
    regionIndex = -1;
    closeSettings();
    el.title.classList.add("off");
    el.card.classList.remove("on", "over", "finale");
    startLevel(n);
  }

  function paintLevels() {
    el.levels.innerHTML = "";
    var regions = [
      { id: 1, label: "Para", key: "para" },
      { id: 2, label: "Rhombus", key: "rhombus" },
      { id: 3, label: "Rectangle", key: "rectangle" },
      { id: 4, label: "Square", key: "square" },
    ];
    regions.forEach(function (region) {
      var row = document.createElement("div");
      row.className = "qg-level-row";
      var tag = document.createElement("span");
      tag.textContent = region.id + " " + region.label;
      row.appendChild(tag);
      var first = regionFirst(region.key);
      var shown = regionLast(region.key) - first + 1;
      for (var i = 0; i < shown; i++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = region.id + "-" + (i + 1);
        btn.addEventListener("click", (function (n) {
          return function (e) {
            e.stopPropagation();
            jumpToLevel(n);
          };
        })(first + i));
        row.appendChild(btn);
      }
      el.levels.appendChild(row);
    });
  }

  var SAVE_KEY = "jm29-qg-save-v1";

  function readSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== 2) return null;
      if (data.spot !== "chapter" && data.spot !== "level" && data.spot !== "region-outro" && data.spot !== "region-cleared") return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function writeSave(patch) {
    var prev = readSave() || {};
    var next = {
      v: 2,
      seenIntro: true,
      region: prev.region || "para",
      level: typeof prev.level === "number" ? prev.level : 0,
      rewinds: typeof prev.rewinds === "number" ? prev.rewinds : MAX_REWIND,
      reasonOrder: prev.reasonOrder || reasonOrder.slice(),
      freeReplay: false,
      spot: prev.spot || "chapter",
    };
    Object.keys(patch).forEach(function (key) { next[key] = patch[key]; });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch (err) {}
    refreshContinue();
  }

  function refreshContinue() {
    if (!el.continueBtn) return;
    var save = readSave();
    if (!save) {
      el.continueBtn.hidden = true;
      return;
    }
    el.continueBtn.hidden = false;
    if (save.spot === "level" && LEVELS[save.level]) {
      var region = regionOf(LEVELS[save.level]);
      var n = save.level - regionFirst(region) + 1;
      var prefix = region === "rhombus" ? "Rhombus " : region === "rectangle" ? "Rectangle " : region === "square" ? "Square " : "";
      el.continueBtn.textContent = "Continue · " + prefix + "Kingdom " + n;
    } else {
      el.continueBtn.textContent = "Continue";
    }
  }

  function applySave(save) {
    if (save.reasonOrder && save.reasonOrder.length === REASONS.length) {
      reasonOrder = save.reasonOrder.slice();
    }
    rewinds = typeof save.rewinds === "number" ? save.rewinds : MAX_REWIND;
    levelNo = typeof save.level === "number" ? save.level : 0;
  }

  function continueGame() {
    var save = readSave();
    if (!save) return;
    applySave(save);
    el.title.classList.add("off");
    el.card.classList.remove("on", "over");
    if (save.spot === "level") startLevel(levelNo);
    else if (save.spot === "region-outro") startRegionOutro(save.region);
    else if (save.spot === "region-cleared") showRegionCard(save.region);
    else showChapterCard();
  }

  function startLevel(n) {
    var data = LEVELS[n];
    if (!data) { showRegionCard(); return; }

    mode = "level";
    setBed(REGIONS[regionOf(data)].bed);
    cancelLater();
    levelNo = n;
    // busy until the palace has faded in — a click during the cut must not
    // run the (still empty) intro queue straight into the card phase.
    lv = {
      data: data,
      phase: "intro",
      queue: [],
      chosen: -1,
      reasonMiss: 0,
      reasonOrder: reasonOrder,
      busy: true,
      picking: false,
    };
    writeSave({
      spot: "level",
      level: n,
      rewinds: rewinds,
      reasonOrder: reasonOrder.slice(),
      seenIntro: true,
      region: regionOf(data),
    });

    hideDialogue();
    el.dialogue.classList.remove("high");
    hideChoices();
    hideReasons();
    el.corner.classList.remove("on");
    el.skip.classList.remove("on");
    el.card.classList.remove("on", "finale");
    el.cardActions.innerHTML = "";
    el.mapFx.classList.remove.apply(el.mapFx.classList, ["on", "focus", "labels"].concat(NEXT_CLASSES));
    el.fade.classList.add("on");

    later(function () {
      setBg(data.bg);
      el.chapterZone.textContent = data.chapter;
      el.chapterName.textContent = data.name;
      el.chapter.classList.add("on");
      el.hud.classList.add("on");
      renderGems();
      el.fade.classList.remove("on");
      data.intro.forEach(function (b) { queueSay(b.who, b.lines); });
      later(function () {
        lv.busy = false;
        lvAdvance();
      }, 260);
    }, 520);
  }

  /* ─── full-screen cards ────────────────────────────────────────────── */

  function paintCard(chapter, head, text, actions) {
    el.cardChapter.textContent = chapter;
    el.cardHead.textContent = head;
    el.cardText.textContent = text;
    el.cardActions.innerHTML = "";
    actions.forEach(function (action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qg-start" + (action.ghost ? " ghost" : "");
      btn.textContent = action.label;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        action.run();
      });
      el.cardActions.appendChild(btn);
    });
  }

  function clearScreen() {
    hideDialogue();
    el.dialogue.classList.remove("high");
    hideChoices();
    hideReasons();
    el.corner.classList.remove("on");
    el.skip.classList.remove("on");
    el.hud.classList.remove("on");
    el.chapter.classList.remove("on");
    el.mapFx.classList.remove.apply(el.mapFx.classList, ["on", "focus", "labels"].concat(NEXT_CLASSES));
    el.choices.classList.remove("locked");
    el.reasons.classList.remove("locked");
  }

  function replayIntro() {
    resetToTitle();
    startStory();
  }

  /* The opening ends on this card so the jump into Kingdom 1 is a choice,
   * not a cut. */
  function showChapterCard() {
    mode = "card";
    cancelLater();
    clearScreen();
    el.card.classList.remove("over", "finale");
    paintCard(
      "Chapter 1",
      "The Parallelogram Region",
      "Five kingdoms, and every court wants a different reason. Read the marks on each claimant — " +
      "the relic rewinds time only three times.",
      [
        { label: "Start journey", run: function () { rewinds = MAX_REWIND; startLevel(0); } },
        { label: "Play again", ghost: true, run: replayIntro },
      ]
    );
    writeSave({ spot: "chapter", level: 0, region: "para", rewinds: MAX_REWIND, reasonOrder: reasonOrder.slice() });
    later(function () { el.card.classList.add("on"); }, 380);
  }

  function showRegionCard(region) {
    region = REGIONS[region] ? region : "para";
    mode = "card";
    cancelLater();
    clearScreen();
    el.card.classList.remove("over", "finale");
    var first = regionFirst(region);
    function replay() { rewinds = MAX_REWIND; startLevel(first); }
    if (region === "para") {
      paintCard(
        "Region cleared",
        "The Parallelogram Region is safe",
        "All five reasons proved: opposite sides equal, opposite angles equal, diagonals bisecting each other, " +
        "one pair equal and parallel, and the definition itself. " +
        "Next: the Rhombus Region, where a parallelogram alone is not enough.",
        [
          { label: "Enter the Rhombus Region", run: function () { rewinds = MAX_REWIND; startLevel(regionFirst("rhombus")); } },
          { label: "Replay kingdoms", ghost: true, run: replay },
        ]
      );
    } else if (region === "rhombus") {
      paintCard(
        "Region cleared",
        "The Rhombus Region is safe",
        "Four sides equal, diagonals at right angles, and a diagonal bisecting its angles. " +
        "Next: the Rectangle Region, where every corner counts.",
        [
          { label: "Enter the Rectangle Region", run: function () { rewinds = MAX_REWIND; startLevel(regionFirst("rectangle")); } },
          { label: "Replay rhombus kingdoms", ghost: true, run: replay },
        ]
      );
    } else if (region === "rectangle") {
      paintCard(
        "Region cleared",
        "The Rectangle Region is safe",
        "Four right angles and equal diagonals. " +
        "Next: the Square Region, where one fact is never enough.",
        [
          { label: "Enter the Square Region", run: function () { rewinds = MAX_REWIND; startLevel(regionFirst("square")); } },
          { label: "Replay rectangle kingdoms", ghost: true, run: replay },
        ]
      );
    } else {
      el.card.classList.add("finale");
      paintCard(
        "The End",
        "Congratulations! You have saved the world!",
        "Parallelogram, rhombus, rectangle and square — every princess found, every king at peace.",
        [
          { label: "Play again", run: replayIntro },
          { label: "Replay square kingdoms", ghost: true, run: replay },
        ]
      );
    }
    writeSave({ spot: "region-cleared", level: regionLast(region), region: region, rewinds: MAX_REWIND });
    later(function () { el.card.classList.add("on"); }, 380);
  }

  function gameOver() {
    mode = "card";
    cancelLater();
    clearScreen();
    el.card.classList.remove("finale");
    el.card.classList.add("over");
    paintCard(
      "Game over",
      "The relic is spent",
      "Three rewinds are gone and the king's patience with them. The war begins — unless you take the journey again.",
      [
        // A spent relic still resumes at the start of this kingdom.
        { label: "Try again", run: replayIntro },
        { label: "Retry this kingdom", ghost: true, run: function () { rewinds = MAX_REWIND; startLevel(levelNo); } },
      ]
    );
    writeSave({ spot: "level", level: levelNo, region: regionOf(LEVELS[levelNo]), rewinds: MAX_REWIND });
    later(function () { el.card.classList.add("on"); }, 380);
  }

  /* ─── global flow ──────────────────────────────────────────────────── */

  function advance() {
    if (!stageReady) return;
    if (!el.title.classList.contains("off")) return;
    // An end card owns the screen from the moment it is requested, not from
    // the moment it finishes fading in.
    if (mode === "card" || el.card.classList.contains("on")) return;
    if (cutting) return;

    if (mode === "level") {
      if (lv.picking) return; // the answer buttons own the click
      lvAdvance();
      return;
    }

    if (mode === "region-outro") {
      regionAdvance();
      return;
    }

    if (typing) { finishTyping(); return; }
    if (index >= BEATS.length - 1) { showChapterCard(); return; }
    goTo(index + 1);
  }

  function startStory() {
    mode = "intro";
    cancelLater();
    rewinds = MAX_REWIND;
    levelNo = 0;
    regionIndex = -1;
    el.title.classList.add("off");
    el.card.classList.remove("on", "over", "finale");
    el.chapter.classList.remove("on");
    index = -1;
    cutting = true;
    el.fade.classList.add("on");
    later(function () {
      setBg(BEATS[0].bg, BEATS[0].ken);
      el.fade.classList.remove("on");
      index = 0;
      later(function () {
        cutting = false;
        renderBeat(BEATS[0]);
      }, 240);
      el.skip.classList.add("on");
    }, 360);
  }

  function saveAndHome() {
    if (mode === "level" && lv.data) {
      writeSave({ spot: "level", level: levelNo, rewinds: rewinds });
    }
    resetToTitle();
  }

  function resetToTitle() {
    mode = "intro";
    cancelLater();
    rewinds = MAX_REWIND;
    levelNo = 0;
    regionIndex = -1;
    index = -1;
    lv.data = null;
    clearScreen();
    el.card.classList.remove("on", "over", "finale");
    el.gems.forEach(function (gem) { gem.classList.remove("lit"); });
    setBg(TITLE.bg, "ken-c");
    el.title.classList.remove("off");
    stopMusic();
    refreshContinue();
  }

  function gamesOpen() {
    var panel = document.getElementById("panel-games");
    var game = document.getElementById("qg-game");
    if (!panel || panel.classList.contains("hidden")) return false;
    if (game && game.classList.contains("game-off")) return false;
    return true;
  }

  function init() {
    var stage = document.getElementById("qg-stage");
    if (!stage) return;
    build(stage);
    stageReady = true;
    reasonOrder = shuffled(REASONS.length);
    setBg(TITLE.bg, "ken-c");

    stage.addEventListener("click", function (e) {
      if (e.target.closest("button")) playButton();
    }, true);

    stage.addEventListener("click", function (e) {
      if (e.target.closest(".qg-start") || e.target.closest(".qg-skip") || e.target.closest(".qg-settings")) return;
      if (e.target.closest(".qg-choice") || e.target.closest(".qg-reason")) return;
      advance();
    });

    el.start.addEventListener("click", startStory);
    el.continueBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      continueGame();
    });
    refreshContinue();
    el.skip.addEventListener("click", showChapterCard);

    el.stage.addEventListener("mousemove", function (e) {
      var rect = el.stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      el.settings.classList.toggle("near", x >= 0.84 && y <= 0.2);
    });
    el.stage.addEventListener("mouseleave", function () {
      el.settings.classList.remove("near");
    });

    readMix();
    el.volMusic.value = String(Math.round(mix.music * 100));
    el.volSfx.value = String(Math.round(mix.sfx * 100));
    function bindVol(input, key) {
      input.addEventListener("input", function () {
        mix[key] = clamp01(Number(input.value) / 100);
        writeMix();
      });
    }
    bindVol(el.volMusic, "music");
    bindVol(el.volSfx, "sfx");
    el.settingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = el.settings.classList.toggle("open");
      el.settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    paintLevels();
    el.settingsHome.addEventListener("click", function (e) {
      e.stopPropagation();
      closeSettings();
      saveAndHome();
    });
    document.addEventListener("click", function (e) {
      if (!el.settings.contains(e.target)) closeSettings();
    });

    document.addEventListener("keydown", function (e) {
      if (!gamesOpen()) return;
      if (e.target && e.target.closest && e.target.closest("input, textarea, select, button")) return;
      var next = e.code === "Space" || e.key === " " || e.key === "Enter" || e.key === "ArrowRight";
      if (!next) return;
      e.preventDefault();
      if (!el.title.classList.contains("off")) { startStory(); return; }
      advance();
    });

    // Leaving the tab must not leave a half-typed line behind.
    var panel = document.getElementById("panel-games");
    if (panel && window.MutationObserver) {
      new MutationObserver(function () {
        if (!gamesOpen() && typing) finishTyping();
      }).observe(panel, { attributes: true, attributeFilter: ["class"] });
    }

    // Pre-warm the art so black-screen cuts never stall.
    BEATS.forEach(function (beat) {
      var img = new Image();
      img.src = ART + beat.bg + V;
    });
    Object.keys(REGIONS).forEach(function (key) {
      REGIONS[key].outro.forEach(function (beat) {
        var img = new Image();
        img.src = ART + beat.bg + V;
      });
    });
    LEVELS.forEach(function (data) {
      [data.bg, data.bgAngry, data.bgPuzzled, data.bgHappy, data.king].forEach(function (file) {
        if (!file) return;
        var img = new Image();
        img.src = ART + file + V;
      });
    });
  }

  function initGameSwitch() {
    var nav = document.getElementById("games-subnav");
    if (!nav || nav.dataset.ready) return;
    nav.dataset.ready = "1";
    nav.addEventListener("click", function (event) {
      var btn = event.target.closest ? event.target.closest("[data-game]") : null;
      if (!btn || !nav.contains(btn)) return;
      var name = btn.getAttribute("data-game");
      var princess = document.getElementById("qg-game");
      var theorem = document.getElementById("thm-game");
      if (princess) princess.classList.toggle("game-off", name !== "princess");
      if (theorem) theorem.classList.toggle("game-off", name !== "theorem");
      var chips = nav.querySelectorAll("[data-game]");
      var i;
      for (i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i] === btn);
    });
  }

  function boot() {
    init();
    initGameSwitch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
