/* JM24 comics — linear JM35 reader + two follow-ups when a concept finishes. */
(function () {
  "use strict";

  var CHECKS = {
    rules: {
      ch1: [
        {
          id: "r1a",
          prompt: "Simplify \\(x^{3} \\times x^{4}\\).",
          choices: ["\\(x^{7}\\)", "\\(x^{12}\\)", "\\(x^{1}\\)", "\\(x^{6}\\)"],
          answer: 0,
          explain: "Same base — add the indices: \\(3+4=7\\).",
        },
        {
          id: "r1b",
          prompt: "Simplify \\(a^{5} \\div a^{2}\\).",
          choices: ["\\(a^{10}\\)", "\\(a^{7}\\)", "\\(a^{3}\\)", "\\(a^{2.5}\\)"],
          answer: 2,
          explain: "Same base — subtract the indices: \\(5-2=3\\).",
        },
      ],
      ch2: [
        {
          id: "r2a",
          prompt: "Evaluate \\(5^{-2}\\).",
          choices: ["\\(\\dfrac{1}{25}\\)", "25", "−25", "\\(\\dfrac{1}{5}\\)"],
          answer: 0,
          explain: "A negative index means the reciprocal: \\(5^{-2} = 1/5^{2} = 1/25\\).",
        },
        {
          id: "r2b",
          prompt: "The value of \\(7^{0}\\) is",
          choices: ["0", "7", "1", "undefined"],
          answer: 2,
          explain: "Any non-zero number to the power 0 is 1.",
        },
      ],
      ch3: [
        {
          id: "r3a",
          prompt: "Simplify \\(3^{2n} \\times 27\\).",
          choices: ["\\(3^{2n+3}\\)", "\\(3^{2n}\\)", "\\(3^{9n}\\)", "\\(3^{2n-3}\\)"],
          answer: 0,
          explain: "Rewrite 27 as \\(3^{3}\\), then add indices: \\(2n+3\\).",
        },
        {
          id: "r3b",
          prompt: "Write \\(8 \\times 2^{n}\\) as a power of 2.",
          choices: ["\\(2^{n}\\)", "\\(2^{n+3}\\)", "\\(2^{3n}\\)", "\\(16^{n}\\)"],
          answer: 1,
          explain: "\\(8 = 2^{3}\\), so \\(2^{3} \\times 2^{n} = 2^{n+3}\\).",
        },
      ],
      law1: [
        {
          id: "rl1",
          prompt: "Which law is used to simplify \\((x^{3})^{4}\\)?",
          choices: [
            "Add the indices",
            "Subtract the indices",
            "Multiply the indices",
            "Take the reciprocal",
          ],
          answer: 2,
          explain: "A power of a power: multiply indices, \\(3 \\times 4 = 12\\).",
        },
        {
          id: "rl2",
          prompt: "\\((2^{3})^{2} \\times 2^{-4}\\) simplifies to",
          choices: ["\\(2^{2}\\)", "\\(2^{6}\\)", "\\(2^{1}\\)", "\\(2^{8}\\)"],
          answer: 0,
          explain: "\\((2^{3})^{2} = 2^{6}\\), then \\(2^{6} \\times 2^{-4} = 2^{2}\\).",
        },
      ],
    },
    "scientific-notation": {
      ch1: [
        {
          id: "s1a",
          prompt: "Write 7 243 000 in standard form.",
          choices: [
            "\\(7.243 \\times 10^{6}\\)",
            "\\(7.243 \\times 10^{5}\\)",
            "\\(72.43 \\times 10^{6}\\)",
            "\\(0.7243 \\times 10^{7}\\)",
          ],
          answer: 0,
          explain: "One non-zero digit before the decimal: 7.243, and the point moved 6 places.",
        },
        {
          id: "s1b",
          prompt: "Write 0.00056 in standard form.",
          choices: [
            "\\(5.6 \\times 10^{4}\\)",
            "\\(5.6 \\times 10^{-4}\\)",
            "\\(56 \\times 10^{-5}\\)",
            "\\(0.56 \\times 10^{-3}\\)",
          ],
          answer: 1,
          explain: "5.6 and the point moved 4 places left, so the index is −4.",
        },
      ],
      ch2: [
        {
          id: "s2a",
          prompt: "Evaluate \\((4 \\times 10^{9})(2 \\times 10^{2})\\).",
          choices: [
            "\\(8 \\times 10^{11}\\)",
            "\\(6 \\times 10^{11}\\)",
            "\\(8 \\times 10^{9}\\)",
            "\\(4 \\times 10^{18}\\)",
          ],
          answer: 0,
          explain: "Multiply coefficients 4×2=8; add powers of 10: 9+2=11.",
        },
        {
          id: "s2b",
          prompt: "Evaluate \\(\\dfrac{6 \\times 10^{8}}{2 \\times 10^{3}}\\).",
          choices: [
            "\\(3 \\times 10^{5}\\)",
            "\\(3 \\times 10^{11}\\)",
            "\\(12 \\times 10^{5}\\)",
            "\\(3 \\times 10^{8/3}\\)",
          ],
          answer: 0,
          explain: "Divide coefficients 6÷2=3; subtract indices 8−3=5.",
        },
      ],
      ch3: [
        {
          id: "s3a",
          prompt: "Find \\(40.8\\times 10^{3} + 2\\times 10^{2} + 12.5\\times 10^{4}\\) aligned to \\(10^{5}\\).",
          choices: [
            "\\(1.66 \\times 10^{5}\\)",
            "\\(1.66 \\times 10^{4}\\)",
            "\\(16.6 \\times 10^{5}\\)",
            "\\(1.6 \\times 10^{6}\\)",
          ],
          answer: 0,
          explain: "\\(2\\times 10^{2} = 0.002\\times 10^{5}\\), not 0.02. Sum of coefficients = 1.66.",
        },
        {
          id: "s3b",
          prompt: "To add numbers in standard form you must first",
          choices: [
            "add the indices and ignore the coefficients",
            "write every term with the same power of 10",
            "always convert to ordinary numbers",
            "multiply the coefficients",
          ],
          answer: 1,
          explain: "Like place value: only coefficients with the same power of 10 can be added.",
        },
      ],
      ch4: [
        {
          id: "s4a",
          prompt: "A distance is \\(3 \\times 10^{8}\\) m. In standard form, 15 times that distance is",
          choices: [
            "\\(45 \\times 10^{8}\\)",
            "\\(4.5 \\times 10^{9}\\)",
            "\\(3.15 \\times 10^{8}\\)",
            "\\(1.5 \\times 10^{8}\\)",
          ],
          answer: 1,
          explain: "\\(15 \\times 3 = 45\\), so \\(45 \\times 10^{8} = 4.5 \\times 10^{9}\\) after writing one digit before the point.",
        },
        {
          id: "s4b",
          prompt: "Which number is already in standard form?",
          choices: [
            "\\(12.4 \\times 10^{3}\\)",
            "\\(0.81 \\times 10^{5}\\)",
            "\\(8.1 \\times 10^{4}\\)",
            "\\(81 \\times 10^{3}\\)",
          ],
          answer: 2,
          explain: "Standard form needs a coefficient \\(1 \\le a < 10\\).",
        },
      ],
      law1: [
        {
          id: "sl1",
          prompt: "\\((3 \\times 10^{4})^{2}\\) equals",
          choices: [
            "\\(9 \\times 10^{8}\\)",
            "\\(6 \\times 10^{8}\\)",
            "\\(9 \\times 10^{4}\\)",
            "\\(3 \\times 10^{8}\\)",
          ],
          answer: 0,
          explain: "Square the coefficient and double the index: \\(3^{2}=9\\), \\(4\\times 2=8\\).",
        },
        {
          id: "sl2",
          prompt: "0.0048 in standard form is",
          choices: [
            "\\(4.8 \\times 10^{3}\\)",
            "\\(4.8 \\times 10^{-3}\\)",
            "\\(48 \\times 10^{-4}\\)",
            "\\(0.48 \\times 10^{-2}\\)",
          ],
          answer: 1,
          explain: "Point moves 3 places: \\(4.8 \\times 10^{-3}\\).",
        },
      ],
    },
    binary: {
      ch1: [
        {
          id: "b1a",
          prompt: "In binary, the place values from the right are",
          choices: [
            "1, 2, 3, 4, …",
            "1, 2, 4, 8, …",
            "1, 10, 100, 1000, …",
            "2, 4, 6, 8, …",
          ],
          answer: 1,
          explain: "Each place is a power of 2: \\(2^{0}, 2^{1}, 2^{2}, 2^{3}, \\ldots\\).",
        },
        {
          id: "b1b",
          prompt: "The binary number 1000\\(_{2}\\) equals",
          choices: ["3", "4", "8", "10"],
          answer: 2,
          explain: "A 1 in the \\(2^{3}\\) place is 8.",
        },
      ],
      ch2: [
        {
          id: "b2a",
          prompt: "Convert 10110\\(_{2}\\) to denary.",
          choices: ["22", "20", "24", "18"],
          answer: 0,
          explain: "\\(16+0+4+2+0 = 22\\).",
        },
        {
          id: "b2b",
          prompt: "Convert 1101\\(_{2}\\) to denary.",
          choices: ["11", "12", "13", "14"],
          answer: 2,
          explain: "\\(8+4+0+1 = 13\\).",
        },
      ],
      ch3: [
        {
          id: "b3a",
          prompt: "Convert 20\\(_{10}\\) to binary.",
          choices: ["10100\\(_{2}\\)", "10010\\(_{2}\\)", "11000\\(_{2}\\)", "101000\\(_{2}\\)"],
          answer: 0,
          explain: "Divide by 2 and read remainders upward: 20 → 10 r0, 5 r0, 2 r1, 1 r0, 0 r1 → 10100\\(_{2}\\).",
        },
        {
          id: "b3b",
          prompt: "Convert 13\\(_{10}\\) to binary.",
          choices: ["1101\\(_{2}\\)", "1011\\(_{2}\\)", "1110\\(_{2}\\)", "1001\\(_{2}\\)"],
          answer: 0,
          explain: "13 = 8+4+1 = 1101\\(_{2}\\).",
        },
      ],
      ch4: [
        {
          id: "b4a",
          prompt: "Order 28\\(_{10}\\), 110111\\(_{2}\\), 111001\\(_{2}\\) from smallest to largest.",
          choices: [
            "28 < 55 < 57",
            "55 < 28 < 57",
            "57 < 55 < 28",
            "28 < 57 < 55",
          ],
          answer: 0,
          explain: "Convert first: 110111\\(_{2}\\)=55, 111001\\(_{2}\\)=57, then 28 < 55 < 57.",
        },
        {
          id: "b4b",
          prompt: "Which is largest?",
          choices: ["1111\\(_{2}\\)", "14\\(_{10}\\)", "10000\\(_{2}\\)", "15\\(_{10}\\)"],
          answer: 2,
          explain: "1111\\(_{2}\\)=15, 10000\\(_{2}\\)=16. So 10000\\(_{2}\\) is largest.",
        },
      ],
      law1: [
        {
          id: "bl1",
          prompt: "101\\(_{2}\\) + 11\\(_{2}\\) in denary is",
          choices: ["6", "7", "8", "9"],
          answer: 2,
          explain: "5 + 3 = 8.",
        },
        {
          id: "bl2",
          prompt: "The denary value of 1 0000\\(_{2}\\) is",
          choices: ["8", "10", "16", "32"],
          answer: 2,
          explain: "\\(2^{4} = 16\\).",
        },
      ],
    },
  };

  function start() {
    var map = window.JM24_COMICS;
    var order = window.JM24_COMIC_ORDER || ["rules", "scientific-notation", "binary"];
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
