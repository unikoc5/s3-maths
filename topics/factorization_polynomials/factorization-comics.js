/* JM25 comics — linear JM35 reader + two follow-ups when a concept finishes. */
(function () {
  "use strict";

  var CHECKS = {
    factorization: {
      ch1: [
        {
          id: "f1a",
          prompt: "Factorize \\(x^{2} + 6x + 9\\) completely.",
          choices: ["\\((x + 3)^{2}\\)", "\\((x + 9)^{2}\\)", "\\((x + 3)(x - 3)\\)", "\\((x + 6)^{2}\\)"],
          answer: 0,
          explain: "It is a perfect square: ends are squares and the middle is \\(2 \\times x \\times 3\\).",
        },
        {
          id: "f1b",
          prompt: "Factorize \\(x^{2} - 10x + 25\\).",
          choices: ["\\((x - 5)^{2}\\)", "\\((x + 5)^{2}\\)", "\\((x - 25)^{2}\\)", "\\((x - 10)^{2}\\)"],
          answer: 0,
          explain: "\\((x - 5)^{2} = x^{2} - 10x + 25\\).",
        },
      ],
      ch2: [
        {
          id: "f2a",
          prompt: "Factorize \\(x^{2} - 49\\).",
          choices: [
            "\\((x + 7)(x - 7)\\)",
            "\\((x - 7)^{2}\\)",
            "\\((x + 49)(x - 1)\\)",
            "Cannot be factorized",
          ],
          answer: 0,
          explain: "Difference of two squares: \\(a^{2} - b^{2} = (a + b)(a - b)\\), and 49 = \\(7^{2}\\).",
        },
        {
          id: "f2b",
          prompt: "Factorize \\(9y^{2} - 16\\).",
          choices: [
            "\\((3y - 4)^{2}\\)",
            "\\((3y + 4)(3y - 4)\\)",
            "\\((9y + 4)(y - 4)\\)",
            "\\((3y + 16)(3y - 1)\\)",
          ],
          answer: 1,
          explain: "\\((3y)^{2} - 4^{2} = (3y + 4)(3y - 4)\\).",
        },
      ],
      ch3: [
        {
          id: "f3a",
          prompt: "\\(x^{2} - 5x + 6 = 0\\). After factorizing, the solutions are",
          choices: ["\\(x = 2\\) or \\(x = 3\\)", "\\(x = -2\\) or \\(x = -3\\)", "\\(x = 6\\) or \\(x = 1\\)", "\\(x = 5\\)"],
          answer: 0,
          explain: "\\((x - 2)(x - 3) = 0\\), so \\(x = 2\\) or \\(x = 3\\).",
        },
        {
          id: "f3b",
          prompt: "If \\((x - 4)(x + 1) = 0\\), then",
          choices: ["\\(x = 4\\) only", "\\(x = -1\\) only", "\\(x = 4\\) or \\(x = -1\\)", "\\(x = 3\\)"],
          answer: 2,
          explain: "A product is zero when at least one factor is zero.",
        },
      ],
      ch4: [
        {
          id: "f4a",
          prompt: "Factorize \\(ax + ay + bx + by\\).",
          choices: [
            "\\((a + b)(x + y)\\)",
            "\\((a + b)(x - y)\\)",
            "\\(a(x + y) + b\\)",
            "\\((ax + by)(a + b)\\)",
          ],
          answer: 0,
          explain: "Group: \\(a(x + y) + b(x + y) = (a + b)(x + y)\\).",
        },
        {
          id: "f4b",
          prompt: "Factorize \\(x^{3} + 2x^{2} + 3x + 6\\) by grouping.",
          choices: [
            "\\((x^{2} + 3)(x + 2)\\)",
            "\\((x^{2} + 2)(x + 3)\\)",
            "\\((x + 6)(x^{2} + 1)\\)",
            "Cannot be grouped",
          ],
          answer: 0,
          explain: "\\(x^{2}(x + 2) + 3(x + 2) = (x^{2} + 3)(x + 2)\\).",
        },
      ],
      law1: [
        {
          id: "fl1",
          prompt: "Which identity matches a perfect square?",
          choices: [
            "\\(a^{2} - b^{2}\\)",
            "\\(a^{2} + 2ab + b^{2}\\)",
            "\\(a^{2} + b^{2}\\)",
            "\\(a^{3} - b^{3}\\)",
          ],
          answer: 1,
          explain: "\\(a^{2} + 2ab + b^{2} = (a + b)^{2}\\).",
        },
        {
          id: "fl2",
          prompt: "Factorize \\(2x^{2} + 7x + 3\\).",
          choices: ["\\((2x + 1)(x + 3)\\)", "\\((2x + 3)(x + 1)\\)", "\\((2x + 7)(x + 3)\\)", "\\((x + 3)^{2}\\)"],
          answer: 0,
          explain: "Numbers that multiply to 6 and add to 7 are 1 and 6, giving \\((2x + 1)(x + 3)\\).",
        },
      ],
    },
    "cross-method": {
      ch1: [
        {
          id: "c1a",
          prompt: "Factorize \\(3a^{2} + 10ab + 8b^{2}\\) completely.",
          choices: [
            "\\((a + 2b)(3a + 4b)\\)",
            "\\((a + 4b)(3a + 2b)\\)",
            "\\((3a + 2b)(a + 4b)\\)",
            "\\((a + b)(3a + 8b)\\)",
          ],
          answer: 0,
          explain: "Split 3 as 1×3 and 8 as 2×4; the cross products 4ab + 6ab give the middle 10ab.",
        },
        {
          id: "c1b",
          prompt: "Factorize \\(2m^{2} + 7mn + 3n^{2}\\) completely.",
          choices: [
            "\\((m + 3n)(2m + n)\\)",
            "\\((m + n)(2m + 3n)\\)",
            "\\((2m + 3n)(m + n)\\)",
            "\\((m + 3n)(2m + 3n)\\)",
          ],
          answer: 0,
          explain: "1×3 and 1×2: cross 1·n·m + 3n·2m = 7mn.",
        },
      ],
      law1: [
        {
          id: "cl1",
          prompt: "Factorize \\(r^{2} + 2rs - 15s^{2}\\) completely.",
          choices: [
            "\\((r + 5s)(r - 3s)\\)",
            "\\((r + 3s)(r - 5s)\\)",
            "\\((r + s)(r - 15s)\\)",
            "\\((r + 15s)(r - s)\\)",
          ],
          answer: 0,
          explain: "Two numbers with product −15 and sum 2 are +5 and −3.",
        },
        {
          id: "cl2",
          prompt: "In the cross method, the two cross products must",
          choices: [
            "each equal the middle term",
            "add to the middle term (the \\(xy\\) term)",
            "multiply to the first term",
            "be ignored if they are different",
          ],
          answer: 1,
          explain: "The pair is correct when those two products sum to the given middle coefficient.",
        },
      ],
    },
  };

  function start() {
    var map = window.JM25_COMICS;
    var order = window.JM25_COMIC_ORDER || ["factorization", "cross-method"];
    if (!map || !window.initJmComicsBundle) return;
    var series = order.map(function (key) {
      return {
        id: key,
        label: map[key].label,
        comics: window.jmComicsFromTopic(map[key], CHECKS[key] || {}),
      };
    });
    window.initJmComicsBundle(series);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
