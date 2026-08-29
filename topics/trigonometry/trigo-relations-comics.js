/* JM34 comics — key pages, then two follow-up checks when a concept is complete. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "lunchbox-45",
      chip: "P1",
      title: "Lunchbox 45\u00b0",
      chapter: "P1 \u00b7 45\u00b0",
      image: "comics/01-lunchbox-45.png?v=20260828-hd",
      checks: [
        {
          id: "a1",
          prompt: "In an isosceles right triangle, each acute angle is 45\u00b0. If the equal legs have length 1, what is \\(\\tan 45^{\\circ}\\)?",
          choices: ["\\(0\\)", "\\(\\dfrac{1}{2}\\)", "\\(1\\)", "\\(\\sqrt{2}\\)"],
          answer: 2,
          explain: "Opposite and adjacent are equal, so \\(\\tan 45^{\\circ} = 1\\).",
        },
        {
          id: "a2",
          prompt: "Which pair is true?",
          choices: [
            "\\(\\sin 45^{\\circ} = 1\\) and \\(\\cos 45^{\\circ} = 0\\)",
            "\\(\\sin 45^{\\circ} = \\cos 45^{\\circ} = \\dfrac{1}{\\sqrt{2}}\\)",
            "\\(\\sin 45^{\\circ} = 0\\) and \\(\\cos 45^{\\circ} = 1\\)",
            "\\(\\sin 45^{\\circ} = \\sqrt{2}\\) and \\(\\cos 45^{\\circ} = \\sqrt{2}\\)",
          ],
          answer: 1,
          explain: "The hypotenuse is \\(\\sqrt{2}\\), so each ratio opposite/hypotenuse or adjacent/hypotenuse is \\(1/\\sqrt{2}\\).",
        },
      ],
    },
    {
      id: "road-sign-30-60",
      chip: "P2",
      title: "Road sign 30\u00b0/60\u00b0",
      chapter: "P2 \u00b7 30\u00b0/60\u00b0",
      image: "comics/02-road-sign-30-60.png?v=20260828-hd",
      checks: [
        {
          id: "b1",
          prompt: "What is \\(\\sin 30^{\\circ}\\)?",
          choices: ["\\(\\dfrac{\\sqrt{3}}{2}\\)", "\\(\\dfrac{1}{2}\\)", "\\(1\\)", "\\(\\dfrac{1}{\\sqrt{2}}\\)"],
          answer: 1,
          explain: "In a half-equilateral triangle, the side opposite 30\u00b0 is half the hypotenuse.",
        },
        {
          id: "b2",
          prompt: "What is \\(\\cos 60^{\\circ}\\)?",
          choices: ["\\(\\dfrac{1}{2}\\)", "\\(\\dfrac{\\sqrt{3}}{2}\\)", "\\(\\sqrt{3}\\)", "0"],
          answer: 0,
          explain: "\\(\\cos 60^{\\circ} = \\sin 30^{\\circ} = \\dfrac{1}{2}\\). The 30\u00b0 and 60\u00b0 values swap sine and cosine.",
        },
      ],
    },
    {
      id: "phone-stand-memory",
      chip: "P3",
      title: "Phone stand & memory",
      chapter: "P3 \u00b7 Special values",
      image: "comics/03-phone-stand-memory.png?v=20260828-hd",
      checks: [
        {
          id: "c1",
          prompt: "Which row of special values is correct?",
          choices: [
            "\\(\\sin 0^{\\circ}=1,\\ \\sin 90^{\\circ}=0\\)",
            "\\(\\sin 0^{\\circ}=0,\\ \\sin 90^{\\circ}=1\\)",
            "\\(\\cos 0^{\\circ}=0,\\ \\cos 90^{\\circ}=1\\)",
            "\\(\\tan 90^{\\circ}=1\\)",
          ],
          answer: 1,
          explain: "Sine starts at 0 on the unit circle and reaches 1 at 90\u00b0. Tangent is undefined at 90\u00b0.",
        },
        {
          id: "c2",
          prompt: "Without a calculator: \\(\\sin 60^{\\circ}\\) equals",
          choices: ["\\(\\sin 30^{\\circ}\\)", "\\(\\cos 30^{\\circ}\\)", "\\(\\tan 30^{\\circ}\\)", "\\(\\cos 60^{\\circ}\\)"],
          answer: 1,
          explain: "\\(\\sin 60^{\\circ} = \\dfrac{\\sqrt{3}}{2} = \\cos 30^{\\circ}\\).",
        },
      ],
    },
    {
      id: "ladder-identity",
      chip: "P4",
      title: "Ladder of length 1",
      chapter: "P4 \u00b7 Identity",
      image: "comics/04-ladder-identity.png?v=20260828-hd",
      checks: [
        {
          id: "d1",
          prompt: "If \\(\\sin\\theta = \\dfrac{3}{5}\\) and \\(\\theta\\) is acute, what is \\(\\cos\\theta\\)?",
          choices: ["\\(\\dfrac{4}{5}\\)", "\\(\\dfrac{3}{4}\\)", "\\(\\dfrac{5}{3}\\)", "\\(\\dfrac{9}{25}\\)"],
          answer: 0,
          explain: "\\(\\sin^{2}\\theta + \\cos^{2}\\theta = 1\\), so \\(\\cos\\theta = \\sqrt{1-(3/5)^{2}} = 4/5\\).",
        },
        {
          id: "d2",
          prompt: "The identity \\(\\sin^{2}\\theta + \\cos^{2}\\theta = 1\\) comes from:",
          choices: [
            "the area formula for a triangle",
            "Pythagoras on a right triangle with hypotenuse 1",
            "the definition of slope",
            "the angle-sum formula only",
          ],
          answer: 1,
          explain: "On the unit circle (or a hypotenuse of 1), the two legs are \\(\\cos\\theta\\) and \\(\\sin\\theta\\).",
        },
      ],
    },
    {
      id: "one-photo-ratios",
      chip: "P5",
      title: "One photo, three ratios",
      chapter: "P5 \u00b7 tan = sin/cos",
      image: "comics/05-one-photo-ratios.png?v=20260828-hd",
      checks: [
        {
          id: "e1",
          prompt: "Which identity is always true (where \\(\\cos\\theta \\neq 0\\))?",
          choices: [
            "\\(\\tan\\theta = \\sin\\theta + \\cos\\theta\\)",
            "\\(\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}\\)",
            "\\(\\tan\\theta = \\sin\\theta \\times \\cos\\theta\\)",
            "\\(\\tan\\theta = \\dfrac{\\cos\\theta}{\\sin\\theta}\\)",
          ],
          answer: 1,
          explain: "Tangent is opposite over adjacent, which is sine over cosine.",
        },
        {
          id: "e2",
          prompt: "If \\(\\sin\\theta = \\dfrac{5}{13}\\) and \\(\\cos\\theta = \\dfrac{12}{13}\\), then \\(\\tan\\theta\\) is",
          choices: ["\\(\\dfrac{13}{5}\\)", "\\(\\dfrac{12}{5}\\)", "\\(\\dfrac{5}{12}\\)", "1"],
          answer: 2,
          explain: "\\(\\tan\\theta = \\dfrac{5/13}{12/13} = \\dfrac{5}{12}\\).",
        },
      ],
    },
    {
      id: "other-corner",
      chip: "P6",
      title: "Look from the other corner",
      chapter: "P6 \u00b7 Co-functions",
      image: "comics/06-other-corner.png?v=20260828-hd",
      checks: [
        {
          id: "f1",
          prompt: "Which is true for an acute angle \\(\\theta\\)?",
          choices: [
            "\\(\\sin(90^{\\circ}-\\theta) = \\sin\\theta\\)",
            "\\(\\sin(90^{\\circ}-\\theta) = \\cos\\theta\\)",
            "\\(\\cos(90^{\\circ}-\\theta) = \\cos\\theta\\)",
            "\\(\\tan(90^{\\circ}-\\theta) = \\tan\\theta\\)",
          ],
          answer: 1,
          explain: "The other acute angle is \\(90^{\\circ}-\\theta\\). Sine of one is cosine of the other.",
        },
        {
          id: "f2",
          prompt: "\\(\\cos 20^{\\circ}\\) is equal to",
          choices: ["\\(\\sin 20^{\\circ}\\)", "\\(\\tan 70^{\\circ}\\)", "\\(\\sin 70^{\\circ}\\)", "\\(\\cos 70^{\\circ}\\)"],
          answer: 2,
          explain: "\\(\\cos\\theta = \\sin(90^{\\circ}-\\theta)\\), so \\(\\cos 20^{\\circ} = \\sin 70^{\\circ}\\).",
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
