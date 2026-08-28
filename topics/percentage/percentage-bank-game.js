/* Percentages — City Bank RPG (Game Boy style).
 * Story about choosing savings products: simple vs compound interest.
 */
(function () {
  "use strict";

  const SCENES = [
    {
      id: "title",
      title: true,
      lines: ["CITY BANK", "Interest Quest", "", "Press START"],
    },
    {
      id: "intro",
      lines: [
        "You saved $10,000",
        "from summer jobs.",
        "Today you walk to",
        "CITY BANK downtown.",
      ],
      next: "enter",
    },
    {
      id: "enter",
      lines: [
        "Marble floors.",
        "A bell chimes.",
        '"Welcome to CITY BANK!"',
        "A clerk greets you.",
      ],
      next: "purpose",
    },
    {
      id: "purpose",
      flavor: true,
      lines: ["The clerk smiles.", "What brings you in today?"],
      choices: [
        { label: "open savings", branch: "savings", hintLabel: "grow your money" },
        { label: "ask about loans", branch: "loans", hintLabel: "borrow money" },
      ],
    },
    {
      id: "savings",
      lines: [
        '"Excellent! Let me show',
        "our savings plans.\"",
        "Two brochures slide",
        "across the desk.",
      ],
      next: "brochures",
    },
    {
      id: "loans",
      lines: [
        '"Loans are next door."',
        "But first — look at",
        "how savings can grow!",
        "Brochures appear.",
      ],
      next: "brochures",
    },
    {
      id: "brochures",
      flavor: true,
      lines: [
        "Two financial products.",
        "Which do you read first?",
      ],
      choices: [
        { label: "Simple Saver", branch: "simple_intro", hintLabel: "simple interest" },
        { label: "Compound Plus", branch: "compound_intro", hintLabel: "compound interest" },
      ],
    },
    {
      id: "simple_intro",
      lines: [
        "SIMPLE SAVER",
        "5% p.a. SIMPLE interest.",
        "Interest is paid on the",
        "original $10,000 only.",
      ],
      next: "compound_intro",
    },
    {
      id: "compound_intro",
      lines: [
        "COMPOUND PLUS",
        "5% p.a. COMPOUNDED yearly.",
        "Interest joins the pile",
        "and earns more interest!",
      ],
      next: "simple_interest_q",
    },
    {
      id: "simple_interest_q",
      math: true,
      lines: [
        "Plan A: Simple Saver",
        "Principal: $10,000",
        "Rate: 5% p.a.  Time: 2 yr",
        "",
        "Total INTEREST earned?",
      ],
      choices: [
        { label: "$500", correct: false, hint: "That is only ONE year of interest." },
        { label: "$1,000", correct: true, hint: "I = P x R% x T = 10000 x 5% x 2 = $1000." },
        { label: "$1,025", correct: false, hint: "$1,025 is compound interest, not simple." },
      ],
      next: "simple_amount_q",
    },
    {
      id: "simple_amount_q",
      math: true,
      lines: [
        "Same Simple Saver plan.",
        "After 2 years, what is",
        "the total AMOUNT?",
      ],
      choices: [
        { label: "$10,500", correct: false, hint: "That is only 1 year of simple interest." },
        { label: "$11,000", correct: true, hint: "A = P + I = 10000 + 1000 = $11,000." },
        { label: "$11,025", correct: false, hint: "$11,025 is the compound amount." },
      ],
      next: "compound_amount_q",
    },
    {
      id: "compound_amount_q",
      math: true,
      lines: [
        "Plan B: Compound Plus",
        "$10,000 at 5% p.a.",
        "compounded yearly, 2 yr.",
        "",
        "Total amount after 2 yr?",
      ],
      choices: [
        { label: "$11,000", correct: false, hint: "That is the simple-interest amount." },
        { label: "$11,025", correct: true, hint: "A = P(1 + R%)^2 = 10000 x 1.05^2 = $11,025." },
        { label: "$11,050", correct: false, hint: "Check: 10000 x 1.05 x 1.05." },
      ],
      next: "compare_q",
    },
    {
      id: "compare_q",
      math: true,
      lines: [
        "After 2 years at 5%,",
        "which plan earns MORE",
        "interest for you?",
      ],
      choices: [
        { label: "Simple Saver", correct: false, hint: "Simple earns $1,000 interest." },
        { label: "Compound Plus", correct: true, hint: "Compound earns $1,025 — $25 more!" },
        { label: "Same amount", correct: false, hint: "Compound snowballs; simple does not." },
      ],
      next: "open_account",
    },
    {
      id: "open_account",
      flavor: true,
      lines: [
        "The clerk asks:",
        "Which account do you",
        "want to open today?",
      ],
      choices: [
        { label: "Simple Saver", branch: "pick_simple", hintLabel: "steady & easy" },
        { label: "Compound Plus", branch: "pick_compound", hintLabel: "grows faster" },
      ],
    },
    {
      id: "pick_simple",
      lines: [
        "You sign for Simple Saver.",
        '"Safe and steady!"',
        "The clerk stamps your passbook.",
      ],
      next: "formula_q",
    },
    {
      id: "pick_compound",
      lines: [
        "You sign for Compound Plus.",
        '"Smart choice for long',
        'term growth!"',
        "The clerk high-fives you.",
      ],
      next: "formula_q",
    },
    {
      id: "formula_q",
      math: true,
      lines: [
        "Quick check before you go.",
        "Which is the COMPOUND",
        "interest formula?",
      ],
      choices: [
        { label: "A = P(1 + R% x T)", correct: false, hint: "That is simple interest (no power)." },
        { label: "A = P(1 + R%)^n", correct: true, hint: "Compound: rate applied n times as a factor." },
        { label: "I = P x R% x T", correct: false, hint: "That gives interest I, not amount A." },
      ],
      next: "monthly_q",
    },
    {
      id: "monthly_q",
      math: true,
      lines: [
        "Compound Plus also offers",
        "MONTHLY compounding.",
        "Which formula is correct?",
      ],
      choices: [
        { label: "A = P(1 + R%)^T", correct: false, hint: "Missing the 12 periods per year." },
        { label: "A = P(1 + R%/12)^(12T)", correct: true, hint: "12 periods per year: divide rate, multiply time." },
        { label: "A = P(1 + R% x 12)", correct: false, hint: "Do not multiply rate by 12 like that." },
      ],
      next: "ending",
    },
    {
      id: "ending",
      end: true,
      lines: [
        "You leave CITY BANK",
        "with a new account and",
        "a head full of interest!",
        "",
        "THE END",
      ],
    },
  ];

  window.PctBankGame = window.createPctGbGame({
    scenes: SCENES,
    ids: {
      root: "game-bank",
      shell: "bg-shell",
      screen: "bg-screen",
      text: "bg-text",
      choices: "bg-choices",
      score: "bg-score",
      chapter: "bg-chapter",
      restart: "bg-restart",
    },
    optHint(sc, ch) {
      if (sc.flavor) return ch.hintLabel || "financial product";
      if (/formula|A\s*=|I\s*=/.test(ch.label)) return "pick the formula";
      if (ch.label.includes("Simple") || ch.label.includes("Compound")) return "compare plans";
      if (/^\$/.test(ch.label)) return "money amount";
      return "your guess";
    },
  });
})();
