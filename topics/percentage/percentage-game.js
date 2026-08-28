/* Percentages — Super Mart RPG (Game Boy style). */
(function () {
  "use strict";

  const SCENES = [
    {
      id: "title",
      title: true,
      lines: ["SUPER MART", "Percentages Quest", "", "Press START"],
    },
    {
      id: "intro",
      lines: [
        "Saturday morning.",
        "Mom hands you $50.",
        '"Go to SUPER MART.',
        'Don\'t forget the receipt!"',
      ],
      next: "enter",
    },
    {
      id: "enter",
      lines: [
        "You push through the",
        "automatic doors...",
        "BEEP BEEP BEEP",
        "Welcome to SUPER MART!",
      ],
      next: "discount",
    },
    {
      id: "discount",
      math: true,
      lines: [
        "Aisle 7. Red signs",
        "everywhere!",
        "",
        "70% OFF!!",
        "Price tag: $100",
        "",
        "How much do you pay?",
      ],
      choices: [
        { label: "$233", correct: false, hint: "Way too much! 70% OFF means you pay LESS." },
        { label: "$30", correct: true, hint: "Nice! Selling = 100 x (1 - 70%) = $30." },
        { label: "$70", correct: false, hint: "70% OFF is not pay $70. You pay what's LEFT." },
      ],
      next: "discount_ok",
    },
    {
      id: "discount_ok",
      lines: ["You grab the deal.", "Only $30! What a steal.", "Your wallet smiles."],
      next: "flavor",
    },
    {
      id: "flavor",
      flavor: true,
      lines: ["Hungry now.", "What do you wanna buy?"],
      choices: [
        { label: "fish", branch: "fish", hintLabel: "seafood counter" },
        { label: "super stinky tofu", branch: "tofu", hintLabel: "bold choice" },
      ],
    },
    {
      id: "fish",
      lines: ["You pick fresh fish.", "It glistens on ice.", "The clerk nods approvingly."],
      next: "profit",
    },
    {
      id: "tofu",
      lines: ["You pick SUPER STINKY TOFU.", "Three customers flee.", "Worth it."],
      next: "profit",
    },
    {
      id: "profit",
      math: true,
      lines: [
        "Next shelf: premium fish.",
        "Cost to shop: $80",
        "Marked price: $100",
        "",
        "What is the profit?",
      ],
      choices: [
        { label: "$80", correct: false, hint: "That's the cost, not profit." },
        { label: "$20", correct: true, hint: "Profit = Selling - Cost = 100 - 80 = $20." },
        { label: "$100", correct: false, hint: "That's the marked price, not profit." },
      ],
      next: "profit_pct",
    },
    {
      id: "profit_pct",
      math: true,
      lines: ["Same fish. Profit $20.", "Cost was $80.", "", "Percentage profit?"],
      choices: [
        { label: "20%", correct: false, hint: "20 is the dollar profit, not the %." },
        { label: "25%", correct: true, hint: "Profit% = 20/80 x 100% = 25%." },
        { label: "100%", correct: false, hint: "100% profit would mean profit = cost." },
      ],
      next: "tofu_aisle",
    },
    {
      id: "tofu_aisle",
      lines: ["You reach the tofu aisle.", "A cake is marked $260.", "Sign says 15% OFF today."],
      next: "selling",
    },
    {
      id: "selling",
      math: true,
      lines: ["Marked price: $260", "Discount: 15%", "", "What is the selling price?"],
      choices: [
        { label: "$245", correct: false, hint: "That would be only 5% off." },
        { label: "$221", correct: true, hint: "Selling = 260 x (1 - 15%) = $221." },
        { label: "$275", correct: false, hint: "Discount lowers the price!" },
      ],
      next: "cost_rev",
    },
    {
      id: "cost_rev",
      math: true,
      lines: ["Sold at marked $260", "the profit is 30%.", "", "What was the cost?"],
      choices: [
        { label: "$182", correct: false, hint: "Try: Cost x (1 + 30%) = 260." },
        { label: "$200", correct: true, hint: "260 = C x 1.3  =>  C = $200." },
        { label: "$338", correct: false, hint: "Cost should be LESS than $260." },
      ],
      next: "checkout",
    },
    {
      id: "checkout",
      lines: ["Checkout time!", "The cashier scans everything.", "Total: $47.50"],
      next: "ending",
    },
    {
      id: "ending",
      end: true,
      lines: [
        "You head home.",
        "Mom checks the receipt.",
        '"Good job with the percentages!"',
        "",
        "THE END",
      ],
    },
  ];

  window.PctMartGame = window.createPctGbGame({
    scenes: SCENES,
    ids: {
      root: "game-mart",
      shell: "pg-shell",
      screen: "pg-screen",
      text: "pg-text",
      choices: "pg-choices",
      score: "pg-score",
      chapter: "pg-chapter",
      restart: "pg-restart",
    },
    optHint(sc, ch) {
      if (sc.flavor) return ch.hintLabel || "your pick";
      if (/^\$/.test(ch.label)) return "pay this amount";
      if (ch.label.includes("%")) return "percentage";
      return "your guess";
    },
  });
})();
