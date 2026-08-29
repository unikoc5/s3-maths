/* JM35 comics — key pages, then two follow-up checks when a concept is complete. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "inclination-ramp",
      chip: "P1",
      title: "Why is the ramp so long?",
      chapter: "P1A \u00b7 Inclination",
      image: "comics/01-inclination-ramp.png?v=20260828-hd2",
    },
    {
      id: "measuring-slope",
      chip: "P2",
      title: "Measuring the slope",
      chapter: "P1B \u00b7 Inclination",
      image: "comics/02-measuring-slope.png?v=20260828-hd2",
      checks: [
        {
          id: "inc1",
          prompt: "The angle of inclination of a straight line is the angle it makes with the positive \\(x\\)-axis. If the slope is \\(m\\), then",
          choices: [
            "\\(m = \\sin\\theta\\)",
            "\\(m = \\tan\\theta\\)",
            "\\(m = \\cos\\theta\\)",
            "\\(\\theta = m\\)",
          ],
          answer: 1,
          explain: "Slope is rise over run, which is \\(\\tan\\theta\\) for the inclination angle \\(\\theta\\).",
        },
        {
          id: "inc2",
          prompt: "A line has slope \\(1\\). What is its angle of inclination?",
          choices: ["\\(30^{\\circ}\\)", "\\(45^{\\circ}\\)", "\\(60^{\\circ}\\)", "\\(90^{\\circ}\\)"],
          answer: 1,
          explain: "\\(\\tan 45^{\\circ} = 1\\), so the line rises at \\(45^{\\circ}\\) to the positive \\(x\\)-axis.",
        },
      ],
    },
    {
      id: "map-scale",
      chip: "P3",
      title: "Why does the bridge look so short?",
      chapter: "P2 \u00b7 Scale",
      image: "comics/03-map-scale.png?v=20260827-jm35b",
      checks: [
        {
          id: "sc1",
          prompt: "A map scale is 1 : 50 000. 2 cm on the map represents an actual distance of",
          choices: ["25 m", "100 m", "1 km", "2 km"],
          answer: 2,
          explain: "2 cm \u00d7 50 000 = 100 000 cm = 1 000 m = 1 km.",
        },
        {
          id: "sc2",
          prompt: "On a scale drawing, lengths look shorter than in real life because",
          choices: [
            "angles are also reduced by the same scale",
            "only horizontal distances are scaled",
            "every length is multiplied by the scale factor (less than 1)",
            "height cannot be shown on a map",
          ],
          answer: 2,
          explain: "A scale of 1 : n multiplies real lengths by \\(1/n\\). Angles stay the same.",
        },
      ],
    },
    {
      id: "depression-elevation",
      chip: "P4",
      title: "Looking down, looking up",
      chapter: "P3A \u00b7 Elevation & depression",
      image: "comics/04-depression-elevation.png?v=20260828-hd2",
    },
    {
      id: "how-far-down",
      chip: "P5",
      title: "How far down?",
      chapter: "P3B \u00b7 Elevation & depression",
      image: "comics/05-how-far-down.png?v=20260828-hd2",
      checks: [
        {
          id: "ed1",
          prompt: "The angle of elevation is measured",
          choices: [
            "from the vertical, looking sideways",
            "from the horizontal, looking up",
            "from the horizontal, looking down",
            "from north, clockwise",
          ],
          answer: 1,
          explain: "Elevation is up from the horizontal; depression is down from the horizontal.",
        },
        {
          id: "ed2",
          prompt: "From the top of a cliff, the angle of depression to a boat is \\(25^{\\circ}\\). The angle of elevation from the boat to the top of the cliff is",
          choices: ["\\(65^{\\circ}\\)", "\\(155^{\\circ}\\)", "\\(25^{\\circ}\\)", "\\(90^{\\circ}\\)"],
          answer: 2,
          explain: "The two horizontals are parallel, so the angle of elevation equals the angle of depression (alternate angles).",
        },
      ],
    },
    {
      id: "true-bearings",
      chip: "P6",
      title: "Where did it go?",
      chapter: "P4A \u00b7 Bearings",
      image: "comics/06-true-bearings.png?v=20260828-hd2",
    },
    {
      id: "reverse-bearings",
      chip: "P7",
      title: "The way back",
      chapter: "P4B \u00b7 Bearings",
      image: "comics/07-reverse-bearings.png?v=20260828-hd2",
    },
    {
      id: "ferry-shortcut",
      chip: "P8",
      title: "The ferry's shortcut",
      chapter: "P4C \u00b7 Bearings",
      image: "comics/08-ferry-shortcut.png?v=20260828-hd2",
      checks: [
        {
          id: "br1",
          prompt: "A true bearing is measured from north, clockwise, with three digits. The bearing due east is",
          choices: ["E", "090\u00b0", "180\u00b0", "270\u00b0"],
          answer: 1,
          explain: "North is 000\u00b0, east is 090\u00b0, south is 180\u00b0, west is 270\u00b0.",
        },
        {
          id: "br2",
          prompt: "The reverse of bearing 040\u00b0 is",
          choices: ["040\u00b0", "140\u00b0", "220\u00b0", "320\u00b0"],
          answer: 2,
          explain: "Add 180\u00b0: 040\u00b0 + 180\u00b0 = 220\u00b0. (If the sum is 360\u00b0 or more, subtract 360\u00b0.)",
        },
      ],
    },
  ];

  function start() {
    if (window.initJmComics) window.initJmComics(COMICS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
