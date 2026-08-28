window.JM25_COMICS_QUIZ = {
  factorization: [
    {
      id: "factor-q1",
      questionEn: "Factorize x² + 6x + 9 completely.",
      questionZh: "因式分解 x² + 6x + 9。",
      hintEn: "Check if it is a perfect square: ends are squares and middle is 2 × x × 3.",
      hintZh: "檢查是否完全平方：首尾是平方，中項是 2 × x × 3。",
      choices: [
        { textEn: "(x + 3)²", textZh: "(x + 3)²", correct: true },
        { textEn: "(x + 9)²", textZh: "(x + 9)²", correct: false },
        { textEn: "(x + 3)(x − 3)", textZh: "(x + 3)(x − 3)", correct: false },
        { textEn: "(x + 6)²", textZh: "(x + 6)²", correct: false },
      ],
    },
    {
      id: "factor-q2",
      questionEn: "Factorize x² − 49.",
      questionZh: "因式分解 x² − 49。",
      hintEn: "Two squares minus each other: a² − b² = (a + b)(a − b). Here 49 = 7².",
      hintZh: "兩個平方相減：a² − b² = (a + b)(a − b)，而 49 = 7²。",
      choices: [
        { textEn: "(x + 7)(x − 7)", textZh: "(x + 7)(x − 7)", correct: true },
        { textEn: "(x − 7)²", textZh: "(x − 7)²", correct: false },
        { textEn: "(x + 49)(x − 1)", textZh: "(x + 49)(x − 1)", correct: false },
        { textEn: "Cannot be factorized", textZh: "不能因式分解", correct: false },
      ],
    },
    {
      id: "factor-q3",
      questionEn: "Factorize ax + ay + bx + by.",
      questionZh: "因式分解 ax + ay + bx + by。",
      hintEn: "Group the first pair and second pair, then take out the common bracket (x + y).",
      hintZh: "分組前兩項同後兩項，再提取公因式 (x + y)。",
      choices: [
        { textEn: "(a + b)(x + y)", textZh: "(a + b)(x + y)", correct: true },
        { textEn: "(a + b)(x − y)", textZh: "(a + b)(x − y)", correct: false },
        { textEn: "a(x + y) + b", textZh: "a(x + y) + b", correct: false },
        { textEn: "(ax + by)(a + b)", textZh: "(ax + by)(a + b)", correct: false },
      ],
    },
  ],
  "cross-method": [
    {
      id: "cross-q1",
      questionEn: "Factorize 3a² + 10ab + 8b² completely.",
      questionZh: "因式分解 3a² + 10ab + 8b²。",
      hintEn: "Split 3 into 1×3 and 8 into 2×4, then cross — the middle must be 10ab.",
      hintZh: "把 3 拆成 1×3、8 拆成 2×4，再交叉相乘 — 中項應為 10ab。",
      choices: [
        { textEn: "(a + 2b)(3a + 4b)", textZh: "(a + 2b)(3a + 4b)", correct: true },
        { textEn: "(a + 4b)(3a + 2b)", textZh: "(a + 4b)(3a + 2b)", correct: false },
        { textEn: "(3a + 2b)(a + 4b)", textZh: "(3a + 2b)(a + 4b)", correct: false },
        { textEn: "(a + b)(3a + 8b)", textZh: "(a + b)(3a + 8b)", correct: false },
      ],
    },
    {
      id: "cross-q2",
      questionEn: "Factorize 2m² + 7mn + 3n² completely.",
      questionZh: "因式分解 2m² + 7mn + 3n²。",
      hintEn: "Split 2 into 1×2 and 3 into 1×3; try pairing so the cross sum is 7mn.",
      hintZh: "把 2 拆成 1×2、3 拆成 1×3；配對交叉相乘，中項和應為 7mn。",
      choices: [
        { textEn: "(m + 3n)(2m + n)", textZh: "(m + 3n)(2m + n)", correct: true },
        { textEn: "(m + n)(2m + 3n)", textZh: "(m + n)(2m + 3n)", correct: false },
        { textEn: "(2m + 3n)(m + n)", textZh: "(2m + 3n)(m + n)", correct: false },
        { textEn: "(m + 3n)(2m + 3n)", textZh: "(m + 3n)(2m + 3n)", correct: false },
      ],
    },
    {
      id: "cross-q3",
      questionEn: "Factorize r² + 2rs − 15s² completely.",
      questionZh: "因式分解 r² + 2rs − 15s²。",
      hintEn: "The last term is negative: find two numbers with sum 2 and product −15.",
      hintZh: "尾項係負數：搵兩個數和為 2、積為 −15。",
      choices: [
        { textEn: "(r + 5s)(r − 3s)", textZh: "(r + 5s)(r − 3s)", correct: true },
        { textEn: "(r + 3s)(r − 5s)", textZh: "(r + 3s)(r − 5s)", correct: false },
        { textEn: "(r + s)(r − 15s)", textZh: "(r + s)(r − 15s)", correct: false },
        { textEn: "(r + 15s)(r − s)", textZh: "(r + 15s)(r − s)", correct: false },
      ],
    },
  ],
};
