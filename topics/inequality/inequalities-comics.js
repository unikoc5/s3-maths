/* JM26 comics — linear JM35 reader + two follow-ups when a concept finishes. */
(function () {
  "use strict";

  var CHECKS = {
    inequalities: {
      ch1: [
        {
          id: "i1a",
          prompt: "Solve \\(4x - 3 \\le 13\\).",
          choices: ["\\(x \\le 4\\)", "\\(x \\ge 4\\)", "\\(x < 4\\)", "\\(x \\le 16\\)"],
          answer: 0,
          explain: "Add 3, then divide by 4: \\(4x \\le 16\\), so \\(x \\le 4\\).",
        },
        {
          id: "i1b",
          prompt: "When you divide an inequality by a positive number, the inequality sign",
          choices: [
            "always reverses",
            "stays the same",
            "becomes an equals sign",
            "must be dropped",
          ],
          answer: 1,
          explain: "The sign reverses only when you multiply or divide by a negative number.",
        },
      ],
      ch2: [
        {
          id: "i2a",
          prompt: "Solve \\(\\dfrac{1}{2}(x + 6) > 5\\).",
          choices: ["\\(x > 4\\)", "\\(x < 4\\)", "\\(x > 16\\)", "\\(x \\ge 4\\)"],
          answer: 0,
          explain: "Multiply by 2: \\(x + 6 > 10\\), so \\(x > 4\\).",
        },
        {
          id: "i2b",
          prompt: "Solve \\(-3x < 12\\).",
          choices: ["\\(x < -4\\)", "\\(x > -4\\)", "\\(x < 4\\)", "\\(x > 4\\)"],
          answer: 1,
          explain: "Divide by −3 and reverse the sign: \\(x > -4\\).",
        },
      ],
      ch3: [
        {
          id: "i3a",
          prompt: "Solve \\(-2 < 3x + 1 \\le 7\\).",
          choices: [
            "\\(-1 < x \\le 2\\)",
            "\\(-1 \\le x < 2\\)",
            "\\(-3 < x \\le 2\\)",
            "\\(-1 < x < 2\\)",
          ],
          answer: 0,
          explain: "Split: \\(3x + 1 > -2\\) and \\(3x + 1 \\le 7\\) give \\(x > -1\\) and \\(x \\le 2\\).",
        },
        {
          id: "i3b",
          prompt: "The compound inequality \\(a < x \\le b\\) on a number line uses",
          choices: [
            "two filled dots",
            "an open circle at \\(a\\) and a filled dot at \\(b\\)",
            "a filled dot at \\(a\\) and an open circle at \\(b\\)",
            "arrows only, no dots",
          ],
          answer: 1,
          explain: "Strict \\(<\\) is hollow; “or equal” is filled.",
        },
      ],
      law1: [
        {
          id: "il1",
          prompt: "Which step is wrong when solving \\(2 - 5x \\ge 12\\)?",
          choices: [
            "Subtract 2: \\(-5x \\ge 10\\)",
            "Divide by −5 and keep ≥, giving \\(x \\ge -2\\)",
            "Divide by −5 and reverse, giving \\(x \\le -2\\)",
            "The boundary value is \\(x = -2\\)",
          ],
          answer: 1,
          explain: "Dividing by −5 reverses the sign, so \\(x \\le -2\\).",
        },
        {
          id: "il2",
          prompt: "\\(x > 3\\) and \\(x \\le 3\\) together have",
          choices: [
            "solution \\(x = 3\\)",
            "solution all real x",
            "no solution",
            "solution \\(x > 3\\)",
          ],
          answer: 2,
          explain: "A number cannot be both greater than 3 and at most 3.",
        },
      ],
    },
  };

  function seriesFromMap() {
    var map = window.JM26_COMICS;
    var order = window.JM26_COMIC_ORDER || ["inequalities"];
    if (!map) return null;
    return order.map(function (key) {
      return {
        id: key,
        label: map[key].label,
        comics: window.jmComicsFromTopic(map[key], CHECKS[key] || {}),
      };
    });
  }

  function start() {
    var series = seriesFromMap();
    if (!series) return;
    window.LESSON_COMICS_SERIES = series;
    if (document.getElementById("comics-subnav") && window.initJmComicsBundle) {
      window.initJmComicsBundle(series);
    }
  }

  window.startJm26Comics = start;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
