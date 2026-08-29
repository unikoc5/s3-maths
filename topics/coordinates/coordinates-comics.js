/* JM33 comics — key pages, then two follow-up checks when a concept is complete. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "distance-3-4-5",
      chip: "P1",
      title: "How far apart are we?",
      chapter: "P1 · Distance",
      image: "comics/01-distance-3-4-5.png?v=20260827-jm33s",
      checks: [
        {
          id: "d1",
          prompt: "A is (1, 2) and B is (4, 6). What is the distance AB?",
          choices: ["5", "7", "25", "3"],
          answer: 0,
          explain: "\\(\\Delta x = 3\\), \\(\\Delta y = 4\\). Then \\(d = \\sqrt{3^{2}+4^{2}} = 5\\) — Pythagoras on the grid.",
        },
        {
          id: "d2",
          prompt: "The distance formula is the same as Pythagoras. Which statement is always true?",
          choices: [
            "AB is \\(|x_2 - x_1| + |y_2 - y_1|\\)",
            "AB is \\(\\sqrt{(x_2-x_1)^{2}+(y_2-y_1)^{2}}\\)",
            "AB is \\((x_2-x_1)(y_2-y_1)\\)",
            "AB does not change if you swap \\(x\\) and \\(y\\) in the formula",
          ],
          answer: 1,
          explain: "The legs are the horizontal and vertical changes; AB is the hypotenuse.",
        },
      ],
    },
    {
      id: "slope-ramp",
      chip: "P2",
      title: "How steep is this ramp?",
      chapter: "P2 · Slope",
      image: "comics/02-slope-ramp.png?v=20260818-jm33b",
      checks: [
        {
          id: "s1",
          prompt: "A line goes from (0, 1) to (4, 3). What is its slope?",
          choices: ["2", "\\(\\dfrac{1}{2}\\)", "4", "\\(-\\dfrac{1}{2}\\)"],
          answer: 1,
          explain: "\\(m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{2}{4} = \\dfrac{1}{2}\\).",
        },
        {
          id: "s2",
          prompt: "What is the slope of a horizontal line?",
          choices: ["undefined", "1", "0", "the same as its \\(y\\)-intercept"],
          answer: 2,
          explain: "\\(\\Delta y = 0\\), so \\(m = 0\\). A vertical line has undefined slope because \\(\\Delta x = 0\\).",
        },
      ],
    },
    {
      id: "midpoint-meet",
      chip: "P3",
      title: "Meet in the middle",
      chapter: "P3 · Mid-point",
      image: "comics/03-midpoint-meet.png?v=20260818-jm33b",
      checks: [
        {
          id: "m1",
          prompt: "What is the mid-point of (2, 4) and (6, 10)?",
          choices: ["(4, 6)", "(8, 14)", "(4, 7)", "(3, 5)"],
          answer: 2,
          explain: "Average the coordinates: \\(\\left(\\dfrac{2+6}{2},\\dfrac{4+10}{2}\\right) = (4, 7)\\).",
        },
        {
          id: "m2",
          prompt: "The mid-point formula is a special case of the section formula when the ratio is:",
          choices: ["2 : 1", "1 : 1", "3 : 1", "1 : 0"],
          answer: 1,
          explain: "Halfway means the two parts are equal, so \\(m:n = 1:1\\).",
        },
      ],
    },
    {
      id: "section-2-1",
      chip: "P4",
      title: "Not halfway this time",
      chapter: "P4A · Section idea",
      image: "comics/04-section-2-1.png?v=20260818-jm33c",
    },
    {
      id: "section-why",
      chip: "P5",
      title: "Why multiply her coordinates by 2?",
      chapter: "P4B · Why it works",
      image: "comics/05-section-why.png?v=20260818-jm33g",
      checks: [
        {
          id: "sec1",
          prompt: "P divides AB in the ratio 2 : 1. A is (0, 0) and B is (6, 3). What are the coordinates of P?",
          choices: ["(2, 1)", "(3, 1.5)", "(4, 2)", "(6, 3)"],
          answer: 2,
          explain: "AP : PB = 2 : 1, so P is two-thirds of the way from A to B: \\(\\left(\\dfrac{2}{3}\\times 6,\\dfrac{2}{3}\\times 3\\right) = (4, 2)\\).",
        },
        {
          id: "sec2",
          prompt: "If P divides AB in the ratio \\(m:n\\), P is a weighted average. Which weights are correct?",
          choices: [
            "P is closer to the endpoint with the larger part of the ratio",
            "P is closer to A when \\(m > n\\)",
            "P is closer to B when \\(m > n\\)",
            "The ratio does not affect how close P is to A or B",
          ],
          answer: 2,
          explain: "A larger \\(m\\) means a longer stretch AP, so P sits closer to B.",
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
