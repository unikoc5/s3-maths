/* JM24 solo game: drag index cards onto the power to make the biggest index. */
(function () {
  "use strict";

  var SETS = [
    [
      { start: 1, cards: [{ op: "add", k: 1 }, { op: "add", k: 2 }, { op: "add", k: 3 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }] },
      { start: 2, cards: [{ op: "mul", k: 2 }, { op: "mul", k: 3 }, { op: "mul", k: 4 }, { op: "sub", k: 5 }, { op: "sub", k: 4 }] },
      { start: 2, cards: [{ op: "add", k: 1 }, { op: "add", k: 2 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }, { op: "sub", k: 4 }] },
      { start: 2, cards: [{ op: "neg" }, { op: "add", k: 4 }, { op: "add", k: 3 }, { op: "add", k: 2 }, { op: "mul", k: 3 }] },
      { start: 4, cards: [{ op: "zero" }, { op: "add", k: 2 }, { op: "add", k: 1 }, { op: "add", k: 4 }, { op: "mul", k: 4 }] },
    ],
    [
      { start: 8, cards: [{ op: "div", k: 2 }, { op: "add", k: 2 }, { op: "add", k: 1 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }] },
      { start: 3, cards: [{ op: "zero" }, { op: "neg" }, { op: "add", k: 5 }, { op: "add", k: 3 }, { op: "mul", k: 3 }] },
      { start: 6, cards: [{ op: "div", k: 2 }, { op: "neg" }, { op: "add", k: 5 }, { op: "add", k: 4 }, { op: "mul", k: 4 }] },
      { start: 8, cards: [{ op: "zero" }, { op: "div", k: 2 }, { op: "add", k: 4 }, { op: "add", k: 4 }, { op: "mul", k: 4 }] },
      { start: 4, cards: [{ op: "sub", k: 8 }, { op: "sub", k: 3 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }, { op: "neg" }] },
    ],
    [
      { start: 8, cards: [{ op: "div", k: 2 }, { op: "sub", k: 10 }, { op: "neg" }, { op: "mul", k: 2 }, { op: "mul", k: 3 }] },
      { start: 4, cards: [{ op: "sub", k: 8 }, { op: "neg" }, { op: "add", k: 4 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }] },
      { start: 4, cards: [{ op: "zero" }, { op: "sub", k: 8 }, { op: "mul", k: 2 }, { op: "mul", k: 3 }, { op: "neg" }] },
      { start: 8, cards: [{ op: "zero" }, { op: "div", k: 2 }, { op: "sub", k: 8 }, { op: "mul", k: 4 }, { op: "neg" }] },
      { start: 4, cards: [{ op: "sub", k: 6 }, { op: "zero" }, { op: "neg" }, { op: "add", k: 6 }, { op: "mul", k: 3 }] },
    ],
    [
      { start: 8, cards: [{ op: "div", k: 2 }, { op: "add", k: 2 }, { op: "mul", k: 4 }, { op: "mul", k: 3 }, { op: "sub", k: 10 }] },
      { start: 4, cards: [{ op: "mul", k: 2 }, { op: "mul", k: 4 }, { op: "mul", k: 3 }, { op: "sub", k: 8 }, { op: "div", k: 2 }] },
      { start: 6, cards: [{ op: "sub", k: 9 }, { op: "zero" }, { op: "add", k: 4 }, { op: "add", k: 3 }, { op: "mul", k: 4 }] },
      { start: 6, cards: [{ op: "sub", k: 6 }, { op: "zero" }, { op: "add", k: 4 }, { op: "mul", k: 4 }, { op: "div", k: 2 }] },
      { start: 24, cards: [{ op: "sub", k: 8 }, { op: "div", k: 2 }, { op: "div", k: 4 }, { op: "add", k: 6 }, { op: "mul", k: 3 }] },
    ],
    [
      { start: 6, cards: [{ op: "sub", k: 8 }, { op: "zero" }, { op: "add", k: 6 }, { op: "add", k: 5 }, { op: "mul", k: 4 }] },
      { start: 6, cards: [{ op: "sub", k: 8 }, { op: "zero" }, { op: "add", k: 5 }, { op: "mul", k: 4 }, { op: "div", k: 2 }] },
      { start: 36, cards: [{ op: "sub", k: 12 }, { op: "div", k: 3 }, { op: "div", k: 4 }, { op: "add", k: 6 }, { op: "mul", k: 3 }] },
      { start: 20, cards: [{ op: "add", k: 2 }, { op: "add", k: 8 }, { op: "mul", k: 4 }, { op: "sub", k: 48 }, { op: "div", k: 2 }] },
      { start: 24, cards: [{ op: "add", k: 6 }, { op: "add", k: 8 }, { op: "mul", k: 3 }, { op: "sub", k: 48 }, { op: "div", k: 2 }] },
    ],
  ];

  var SAVE_KEY = "jm24-index-cards";
  var setIndex = 0;
  var levelIndex = 0;
  var hand = [];
  var played = [];
  var phase = "play";
  var started = false;
  var hasProgress = false;
  var storyPage = 0;
  var drag = null;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function rat(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function cmp(a, b) {
    return a.n * b.d - b.n * a.d;
  }

  function apply(e, card) {
    var k = card.k;
    if (card.op === "add") return rat(e.n + k * e.d, e.d);
    if (card.op === "sub") return rat(e.n - k * e.d, e.d);
    if (card.op === "mul") return rat(e.n * k, e.d);
    if (card.op === "div") return rat(e.n, e.d * k);
    if (card.op === "neg") return rat(-e.n, e.d);
    return rat(0, 1);
  }

  function texExp(e) {
    if (e.d === 1) return String(e.n);
    var sign = e.n < 0 ? "-" : "";
    return sign + "\\dfrac{" + Math.abs(e.n) + "}{" + e.d + "}";
  }

  function texPower(e) {
    return "x^{" + texExp(e) + "}";
  }

  function cardTex(card) {
    if (card.op === "add") return "\\times x^{" + card.k + "}";
    if (card.op === "sub") return "\\div x^{" + card.k + "}";
    if (card.op === "mul") return "(\\;)^{" + card.k + "}";
    if (card.op === "div") return "(\\;)^{\\frac{1}{" + card.k + "}}";
    if (card.op === "neg") return "(\\;)^{-1}";
    return "(\\;)^{0}";
  }

  function permutations(n) {
    var out = [];
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    function rec(l) {
      if (l === n) {
        out.push(a.slice());
        return;
      }
      for (var i = l; i < n; i++) {
        var t = a[l];
        a[l] = a[i];
        a[i] = t;
        rec(l + 1);
        t = a[l];
        a[l] = a[i];
        a[i] = t;
      }
    }
    rec(0);
    return out;
  }

  function runOrder(level, ord) {
    var e = rat(level.start, 1);
    ord.forEach(function (i) {
      e = apply(e, level.cards[i]);
    });
    return e;
  }

  function solve(level) {
    var bestE = null;
    permutations(level.cards.length).forEach(function (ord) {
      var e = runOrder(level, ord);
      if (!bestE || cmp(e, bestE) > 0) bestE = e;
    });
    return bestE;
  }

  function levels() {
    return SETS[setIndex];
  }

  function saveProgress(setNo, levelNo) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ set: setNo, level: levelNo }));
    } catch (err) {}
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || typeof data.set !== "number" || typeof data.level !== "number") return false;
      if (data.set < 0 || data.set >= SETS.length) return false;
      if (data.level < 0 || data.level >= SETS[data.set].length) return false;
      setIndex = data.set;
      levelIndex = data.level;
      return true;
    } catch (err) {
      return false;
    }
  }

  function rankInfo() {
    var names = ["Beginner", "Basic", "Normal", "Advanced", "Master"];
    var i = setIndex;
    if (i < 0) i = 0;
    if (i >= names.length) i = names.length - 1;
    return { name: names[i], endSet: i };
  }

  function markCleared() {
    if (levelIndex < levels().length - 1) saveProgress(setIndex, levelIndex + 1);
    else if (setIndex < SETS.length - 1) saveProgress(setIndex + 1, 0);
    else saveProgress(setIndex, levelIndex);
  }

  function goNext() {
    if (levelIndex < levels().length - 1) levelIndex += 1;
    else if (setIndex < SETS.length - 1) {
      setIndex += 1;
      levelIndex = 0;
    } else return;
    startLevel();
  }

  function shuffle(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j];
      a[j] = a[k];
      a[k] = t;
    }
    return a;
  }

  function paintMath(root) {
    if (typeof renderKatex === "function") renderKatex(root);
  }

  function overStage(ev, stage) {
    var r = stage.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  }

  function moveGhost(ev) {
    if (!drag) return;
    drag.ghost.style.left = (ev.clientX - drag.grabX) + "px";
    drag.ghost.style.top = (ev.clientY - drag.grabY) + "px";
    var stage = document.getElementById("ix-drop");
    if (stage) stage.classList.toggle("over", overStage(ev, stage));
  }

  function clearDrag() {
    if (!drag) return;
    drag.cardEl.removeEventListener("pointermove", onPointerMove);
    drag.cardEl.removeEventListener("pointerup", onPointerUp);
    drag.cardEl.removeEventListener("pointercancel", onPointerCancel);
    try { drag.cardEl.releasePointerCapture(drag.pointerId); } catch (err) {}
    drag.cardEl.classList.remove("dragging");
    if (drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    var stage = document.getElementById("ix-drop");
    if (stage) stage.classList.remove("over");
    drag = null;
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    moveGhost(ev);
  }

  function onPointerUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    var cardIndex = drag.cardIndex;
    var stage = document.getElementById("ix-drop");
    var hit = stage && overStage(ev, stage);
    clearDrag();
    if (hit) playCard(cardIndex);
  }

  function onPointerCancel(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    clearDrag();
  }

  function onPointerDown(ev) {
    if (phase !== "play" || drag) return;
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    var cardEl = ev.currentTarget;
    ev.preventDefault();
    var rect = cardEl.getBoundingClientRect();
    var ghost = cardEl.cloneNode(true);
    ghost.className = cardEl.className + " ix-ghost";
    ghost.style.width = rect.width + "px";
    ghost.style.height = rect.height + "px";
    document.body.appendChild(ghost);
    cardEl.classList.add("dragging");
    drag = {
      cardEl: cardEl,
      ghost: ghost,
      pointerId: ev.pointerId,
      cardIndex: +cardEl.getAttribute("data-card"),
      grabX: ev.clientX - rect.left,
      grabY: ev.clientY - rect.top,
    };
    try { cardEl.setPointerCapture(ev.pointerId); } catch (err) {}
    moveGhost(ev);
    cardEl.addEventListener("pointermove", onPointerMove);
    cardEl.addEventListener("pointerup", onPointerUp);
    cardEl.addEventListener("pointercancel", onPointerCancel);
  }

  function playCard(cardIndex) {
    if (phase !== "play") return;
    var at = hand.indexOf(cardIndex);
    if (at < 0) return;
    hand.splice(at, 1);
    played.push(cardIndex);
    if (!hand.length) {
      phase = "result";
      var done = levels()[levelIndex];
      if (cmp(runOrder(done, played), solve(done)) === 0) markCleared();
    }
    render();
  }

  function render() {
    var board = document.getElementById("ix-board");
    var levelEl = document.getElementById("ix-level");
    if (!board || !levelEl) return;
    var level = levels()[levelIndex];
    var current = runOrder(level, played);
    var best = solve(level);
    var won = phase === "result" && cmp(current, best) === 0;

    var rank = rankInfo();
    var rankEl = document.getElementById("ix-rank");
    if (rankEl) rankEl.textContent = rank.name;
    levelEl.textContent = "Level " + (setIndex + 1) + "-" + (levelIndex + 1);

    var cards = hand.map(function (cardIndex) {
      var card = level.cards[cardIndex];
      return '<button type="button" class="ix-card ix-op-' + card.op + '" data-card="' + cardIndex + '">' +
        '<div class="ix-face">\\(' + cardTex(card) + "\\)</div>" +
        "</button>";
    }).join("");

    var extra = "";
    var gameDone = won && setIndex === SETS.length - 1 && levelIndex === levels().length - 1;
    var rankDone = won && levelIndex === levels().length - 1 && setIndex === rank.endSet;
    if (won) {
      var note = "\\(" + texPower(current) + "\\) is the biggest index.";
      if (rankDone) note += " Congratulations! You finished the " + rank.name + " rank.";
      extra = '<p class="feedback ok">' + note + "</p>";
      if (!gameDone) {
        extra += '<div class="ix-actions"><button type="button" class="btn" id="ix-next">Next level</button></div>';
      }
    } else if (phase === "result") {
      extra = '<p class="feedback bad">Not the biggest possible index.</p>' +
        '<div class="ix-actions"><button type="button" class="btn" id="ix-retry">Try Again</button></div>';
    }

    board.innerHTML =
      '<div class="ix-stage" id="ix-drop" aria-label="Current power">\\(' + texPower(current) + "\\)</div>" +
      '<div class="ix-hand">' + cards + "</div>" +
      extra;
    paintMath(board);

    board.querySelectorAll(".ix-card").forEach(function (btn) {
      btn.addEventListener("pointerdown", onPointerDown);
    });

    var nextBtn = document.getElementById("ix-next");
    if (nextBtn) nextBtn.addEventListener("click", goNext);
    var retryBtn = document.getElementById("ix-retry");
    if (retryBtn) retryBtn.addEventListener("click", startLevel);
  }

  function startLevel() {
    clearDrag();
    saveProgress(setIndex, levelIndex);
    hand = shuffle(levels()[levelIndex].cards.length);
    played = [];
    phase = "play";
    render();
    syncPick();
  }

  /* TEMP pick-level: delete before publish */
  function syncPick() {
    var setSel = document.getElementById("ix-pick-set");
    var lvSel = document.getElementById("ix-pick-level");
    if (setSel) setSel.value = String(setIndex);
    if (lvSel) lvSel.value = String(levelIndex);
  }

  function fillPick() {
    var setSel = document.getElementById("ix-pick-set");
    var lvSel = document.getElementById("ix-pick-level");
    if (!setSel || !lvSel) return;
    var i;
    var opt;
    setSel.innerHTML = "";
    for (i = 0; i < SETS.length; i++) {
      opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i + 1);
      setSel.appendChild(opt);
    }
    lvSel.innerHTML = "";
    var count = SETS[0].length;
    for (i = 0; i < count; i++) {
      opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i + 1);
      lvSel.appendChild(opt);
    }
    syncPick();
  }

  function jumpToPicked() {
    var setSel = document.getElementById("ix-pick-set");
    var lvSel = document.getElementById("ix-pick-level");
    if (!setSel || !lvSel) return;
    var s = parseInt(setSel.value, 10);
    var l = parseInt(lvSel.value, 10);
    if (isNaN(s) || s < 0 || s >= SETS.length) return;
    if (isNaN(l) || l < 0 || l >= SETS[s].length) return;
    setIndex = s;
    levelIndex = l;
    started = true;
    startLevel();
    showPlay();
  }

  function goLabel() {
    if (started) return "Back to the game";
    return hasProgress ? "Continue" : "Start";
  }

  function renderStory() {
    var pages = document.querySelectorAll("#ix-intro .ix-page");
    var i;
    for (i = 0; i < pages.length; i++) {
      pages[i].classList.toggle("is-hidden", i !== storyPage);
    }
    var next = document.getElementById("ix-next-page");
    var go = document.getElementById("ix-go");
    var last = storyPage >= pages.length - 1;
    if (next) next.classList.toggle("is-hidden", last);
    if (go) {
      go.textContent = goLabel();
      go.classList.toggle("is-hidden", !(last || started));
    }
  }

  function showIntro() {
    var intro = document.getElementById("ix-intro");
    var play = document.getElementById("ix-play");
    if (intro) intro.classList.remove("is-hidden");
    if (play) play.classList.add("is-hidden");
    storyPage = 0;
    renderStory();
  }

  function showPlay() {
    var intro = document.getElementById("ix-intro");
    var play = document.getElementById("ix-play");
    if (intro) intro.classList.add("is-hidden");
    if (play) play.classList.remove("is-hidden");
  }

  function init() {
    if (!document.getElementById("ix-board")) return;
    var restart = document.getElementById("ix-restart");
    if (restart) restart.addEventListener("click", startLevel);
    hasProgress = loadProgress();
    fillPick();
    paintMath(document.getElementById("ix-intro"));
    var pickGo = document.getElementById("ix-pick-go");
    if (pickGo) pickGo.addEventListener("click", jumpToPicked);
    var go = document.getElementById("ix-go");
    if (go) {
      go.addEventListener("click", function () {
        if (!started) {
          started = true;
          startLevel();
        }
        showPlay();
      });
    }
    var help = document.getElementById("ix-help");
    if (help) {
      help.addEventListener("click", function () {
        clearDrag();
        showIntro();
      });
    }
    var nextPage = document.getElementById("ix-next-page");
    if (nextPage) {
      nextPage.addEventListener("click", function () {
        var pages = document.querySelectorAll("#ix-intro .ix-page");
        if (storyPage < pages.length - 1) storyPage += 1;
        renderStory();
      });
    }
    showIntro();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
