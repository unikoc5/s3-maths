/* Probability comics  EB-12 fair-games story + per-page concept checks.
   Completely separate from probability-quiz.js (does not touch QUIZ data). */
(function () {
  "use strict";

  const COMICS = [
    {
      id: "vowels-feel-easy",
      title: "Vowels Feel Easy",
      chapter: "Ch.1 · P = favourable / total",
      image: "comics/01-vowels-feel-easy.png",
      checks: [
        {
          id: "c1q1",
          prompt:
            "A letter is chosen at random from MATHEMATICS (11 letters). How many favourable outcomes are there for getting a vowel?",
          choices: ["2", "3", "4", "5"],
          answer: 2,
          explain:
            "Vowels in MATHEMATICS are A, A, E, I  Ethat is 4 favourable letters (count repeats).",
        },
        {
          id: "c1q2",
          prompt:
            "Using the same word, what is P(vowel)?",
          choices: ["\\frac{4}{11}", "\\frac{1}{2}", "\\frac{3}{11}", "\\frac{4}{10}"],
          answer: 0,
          explain:
            "P = favourable / total = 4/11. Do not invent a different total.",
        },
      ],
    },
    {
      id: "same-sticker",
      title: "Same Sticker, Different Rule",
      chapter: "Ch.2 · AND vs OR",
      image: "comics/02-same-sticker-different-rule.png",
      checks: [
        {
          id: "c2q1",
          prompt:
            "A fair die is thrown. Find P(even AND less than 4).",
          choices: ["\\frac{1}{6}", "\\frac{1}{2}", "\\frac{5}{6}", "\\frac{1}{3}"],
          answer: 0,
          explain:
            "Even and <4: only {2}. So P = 1/6.",
        },
        {
          id: "c2q2",
          prompt:
            "Same die. Find P(even OR less than 4).",
          choices: ["\\frac{1}{6}", "\\frac{1}{2}", "\\frac{5}{6}", "\\frac{2}{3}"],
          answer: 2,
          explain:
            "Even ∪ (<4) = {1,2,3,4,6} ↁE5 outcomes. P = 5/6. Same prize, different favourable set.",
        },
      ],
    },
    {
      id: "king-counted-twice",
      title: "The King Who Counted Twice",
      chapter: "Ch.3 · OR with overlap",
      image: "comics/03-king-counted-twice.png",
      checks: [
        {
          id: "c3q1",
          prompt:
            "A card is drawn from 52. Theo counts hearts or kings as 13+4=17. What is the correct favourable count?",
          choices: ["13", "16", "17", "18"],
          answer: 1,
          explain:
            "K♥ is in both sets. Favourable = 13+4∁E = 16.",
        },
        {
          id: "c3q2",
          prompt:
            "Find P(heart or king).",
          choices: ["\\frac{17}{52}", "\\frac{16}{52}=\\frac{4}{13}", "\\frac{13}{52}", "\\frac{4}{52}"],
          answer: 1,
          explain:
            "P(A or B) = P(A)+P(B)−P(A∩B) ↁE16/52 = 4/13.",
        },
      ],
    },
    {
      id: "when-listing-hurts",
      title: "When Listing Hurts",
      chapter: "Ch.4 · Complement",
      image: "comics/04-when-listing-hurts.png",
      checks: [
        {
          id: "c4q1",
          prompt:
            "A card is drawn from 52. Let E = spade or king. How many cards are in E?",
          choices: ["15", "16", "17", "36"],
          answer: 1,
          explain:
            "Spades 13 + kings 4 ∁EK♠ overlap 1 = 16.",
        },
        {
          id: "c4q2",
          prompt:
            "The badge is won if the card is NOT (spade or king). Find that probability.",
          choices: ["\\frac{16}{52}", "\\frac{36}{52}=\\frac{9}{13}", "\\frac{39}{52}", "\\frac{1}{2}"],
          answer: 1,
          explain:
            "P(not E) = 1 ∁E16/52 = 36/52 = 9/13. Complement beats listing all 52.",
        },
      ],
    },
    {
      id: "vinces-bean-bags",
      title: "Vince's Bean Bags",
      chapter: "Ch.5 · Unknown count from P",
      image: "comics/05-vinces-bean-bags.png",
      checks: [
        {
          id: "c5q1",
          prompt:
            "A bag has 8 red beans and k green beans. If P(red) = 2/7, which equation is correct?",
          choices: [
            "\\frac{8}{k}=\\frac{2}{7}",
            "\\frac{8}{8+k}=\\frac{2}{7}",
            "\\frac{k}{8}=\\frac{2}{7}",
            "\\frac{8+k}{8}=\\frac{2}{7}",
          ],
          answer: 1,
          explain:
            "Total = 8+k, so P(red) = 8/(8+k) = 2/7.",
        },
        {
          id: "c5q2",
          prompt:
            "Solve for k.",
          choices: ["14", "16", "20", "28"],
          answer: 2,
          explain:
            "7ÁE = 2(8+k) ↁE56 = 16+2k ↁEk = 20. Total beans = 28.",
        },
      ],
    },
    {
      id: "the-long-queue",
      title: "The Long Queue",
      chapter: "Ch.6 · Expected value",
      image: "comics/06-the-long-queue.png",
      checks: [
        {
          id: "c6q1",
          prompt:
            "Prizes $50, $150, $1000 with probabilities 0.7, 0.2, 0.1. What is the expected prize E?",
          choices: ["HK$165", "HK$200", "HK$400", "HK$1000"],
          answer: 0,
          explain:
            "E = 50(0.7)+150(0.2)+1000(0.1) = 35+30+100 = HK$165.",
        },
        {
          id: "c6q2",
          prompt:
            "The draw costs HK$200 to enter. On average, is it worth playing?",
          choices: [
            "Yes, because you might win $1000",
            "Yes, because E = $200",
            "No, because E = $165 < $200",
            "It does not matter  Eprobability is luck only",
          ],
          answer: 2,
          explain:
            "Compare E with the fee: $165 < $200 ↁEexpected loss of $35. A jackpot is still possible once, but the long-run average is unfavourable.",
        },
      ],
    },
  ];

  COMICS.forEach(function (comic, i) {
    comic.chip = comic.chip || ("P" + (i + 1));
  });

  function start() {
    if (window.initJmComics) window.initJmComics(COMICS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
