window.QUIZ_LETTERS = ["A", "B", "C", "D"];

window.formatQuizMath = function formatQuizMath(text) {
  if (!text) return text;
  return text.replace(/\((\d+)\/(\d+)\)/g, function (_, num, den) {
    return (
      '<span class="quiz-frac" aria-label="' +
      num +
      "/" +
      den +
      '">' +
      '<span class="quiz-frac-num">' +
      num +
      "</span>" +
      '<span class="quiz-frac-bar"></span>' +
      '<span class="quiz-frac-den">' +
      den +
      "</span>" +
      "</span>"
    );
  });
};

window.shuffleQuizChoices = function shuffleQuizChoices(choices) {
  var list = choices.slice();
  for (var i = list.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list.map(function (choice, index) {
    return {
      letter: window.QUIZ_LETTERS[index],
      textEn: choice.textEn,
      textZh: choice.textZh,
      correct: !!choice.correct,
    };
  });
};

window.buildQuizQuestionHtml = function buildQuizQuestionHtml(question, index, lang) {
  var qText = window.formatQuizMath(
    lang === "zh" ? question.questionZh : question.questionEn
  );
  var shuffled = window.shuffleQuizChoices(question.choices);
  var options = shuffled
    .map(function (opt) {
      var label = window.formatQuizMath(lang === "zh" ? opt.textZh : opt.textEn);
      return (
        '<button type="button" class="quiz-option" data-correct="' +
        (opt.correct ? "1" : "0") +
        '">' +
        '<span class="quiz-letter">' +
        opt.letter +
        "</span>" +
        '<span class="quiz-option-text">' +
        label +
        "</span>" +
        "</button>"
      );
    })
    .join("");

  return (
    '<article class="quiz-card" data-quiz-id="' +
    question.id +
    '">' +
    '<p class="quiz-num">Q' +
    (index + 1) +
    "</p>" +
    '<p class="quiz-question">' +
    qText +
    "</p>" +
    '<div class="quiz-options">' +
    options +
    "</div>" +
    '<p class="quiz-feedback" hidden></p>' +
    "</article>"
  );
};
