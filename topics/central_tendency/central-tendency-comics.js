/* JM31 comics — key pages, then two follow-up checks when a concept is complete. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "mean-equal-tea",
      chip: "P1",
      title: "Half milk in every sip",
      chapter: "P1 \u00b7 Mean",
      image: "comics/01-mean-equal-tea.png?v=20260816-jm31b",
      checks: [
        {
          id: "mean1",
          prompt: "The mean of 4, 8, 10 and 18 is",
          choices: ["8", "10", "12", "40"],
          answer: 1,
          explain: "Sum = 40; there are 4 data. Mean = 40 ÷ 4 = 10.",
        },
        {
          id: "mean2",
          prompt: "The mean shares the total equally. If five numbers have mean 12, their sum is",
          choices: ["12", "17", "60", "120"],
          answer: 2,
          explain: "Sum = mean × n = 12 × 5 = 60.",
        },
      ],
    },
    {
      id: "weighted-creamier",
      chip: "P2",
      title: "Creamier tea, weighted mean",
      chapter: "P2 \u00b7 Weighted mean",
      image: "comics/02-weighted-creamier.png?v=20260816-jm31b",
      checks: [
        {
          id: "w1",
          prompt: "A class has 10 scores of 6 and 5 scores of 9. The mean is",
          choices: ["6", "7", "7.5", "9"],
          answer: 1,
          explain: "Total = 10×6 + 5×9 = 60 + 45 = 105. Mean = 105 ÷ 15 = 7.",
        },
        {
          id: "w2",
          prompt: "A weighted mean is needed when",
          choices: [
            "every datum appears once and has the same importance",
            "some values are repeated, or groups have different sizes / weights",
            "you only want the middle value",
            "the data are not numbers",
          ],
          answer: 1,
          explain: "Weights (or frequencies) tell you how many times each value counts.",
        },
      ],
    },
    {
      id: "median-lamp-meet",
      chip: "P3",
      title: "Meeting at the lamp posts",
      chapter: "P3A \u00b7 Median",
      image: "comics/03-median-lamp-meet.png?v=20260816-jm31b",
    },
    {
      id: "median-why-plus-one",
      chip: "P4",
      title: "Why (n+1)/2 ?",
      chapter: "P3B \u00b7 Median formula",
      image: "comics/04-median-why-plus-one.png?v=20260816-jm31b",
    },
    {
      id: "median-zero-start",
      chip: "P5",
      title: "When do we just ÷2 ?",
      chapter: "P3C \u00b7 0-start vs 1-start",
      image: "comics/05-median-zero-start.png?v=20260816-jm31b",
      checks: [
        {
          id: "med1",
          prompt: "For the ordered list 2, 5, 6, 9, 11 (n = 5), the median is the value in position",
          choices: ["2", "3", "4", "(5+1)/2 is not used"],
          answer: 1,
          explain: "Odd n: position (n+1)/2 = 3. The 3rd value is 6.",
        },
        {
          id: "med2",
          prompt: "For the ordered list 3, 4, 8, 10 (n = 4), the median is",
          choices: ["3", "4", "6", "8"],
          answer: 2,
          explain: "Even n: average of the two middle values (positions 2 and 3): (4+8)/2 = 6.",
        },
      ],
    },
    {
      id: "mode-animal-vote",
      chip: "P6",
      title: "Mode is not 300",
      chapter: "P4 \u00b7 Mode",
      image: "comics/06-mode-animal-vote.png?v=20260818-jm31c",
      checks: [
        {
          id: "mode1",
          prompt: "The mode of 2, 7, 7, 7, 9, 12, 12 is",
          choices: ["7", "12", "2", "The mean 8"],
          answer: 0,
          explain: "7 appears three times — more than any other value. Mode is the most frequent value, not the largest or the total.",
        },
        {
          id: "mode2",
          prompt: "A data set can have",
          choices: [
            "exactly one mode, always",
            "no mode, one mode, or more than one mode",
            "a mode only if n is odd",
            "a mode equal to the mean only",
          ],
          answer: 1,
          explain: "If every value appears once there is no mode; if two values tie for most frequent the set is bimodal.",
        },
      ],
    },
    {
      id: "choose-average",
      chip: "P7",
      title: "Mean, median, or mode?",
      chapter: "P5 \u00b7 Which to choose",
      image: "comics/07-choose-average.png?v=20260818-jm31d",
      checks: [
        {
          id: "pick1",
          prompt: "A class has test scores 12, 14, 15, 16, 98. Which average best represents a typical score?",
          choices: [
            "The mean, because 98 should pull everyone up",
            "The median, because 98 is an outlier",
            "The mode, because there isn't one",
            "Any of the three — they are always equal",
          ],
          answer: 1,
          explain: "The mean is dragged by the 98. The median stays with the cluster of ordinary scores.",
        },
        {
          id: "pick2",
          prompt: "A shop records shoe sizes 5, 6, 6, 7, 7, 7, 8. To know which size to stock most, use the",
          choices: ["mean", "median", "mode", "range"],
          answer: 2,
          explain: "Mode is the most common size — the one customers ask for most.",
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
