window.BoundaryRunner = (function () {
  var PROGRESS_KEY = "jm26-runner-progress";
  var canvas, ctx;
  var width = 900;
  var height = 520;
  var rafId = null;
  var running = false;
  var phase = "map";
  var currentLevelId = null;
  var currentLevel = null;
  var currentQuestion = null;
  var lives = 3;
  var levelStartLives = 3;
  var progress = { unlocked: ["1-1"], stars: {} };
  var topicMisses = {};
  var keys = {};
  var touchDir = 0;
  var player = { x: 80, y: 300, w: 28, h: 32, vx: 0, vy: 0, onGround: false };
  var platforms = [];
  var flag = { x: 0, y: 0, w: 24, h: 40 };
  var platformConfig = null;
  var onKeyDown = null;
  var onKeyUp = null;

  var GRAVITY = 0.55;
  var JUMP = -11;
  var MOVE = 5;

  function t(key) {
    return window.I18n && window.I18n.t ? window.I18n.t(key) : key;
  }

  function lang() {
    return window.I18n && window.I18n.lang === "zh" ? "zh" : "en";
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.unlocked)) {
          progress = parsed;
        }
      }
    } catch (e) {
      progress = { unlocked: ["1-1"], stars: {} };
    }
    if (progress.unlocked.indexOf("1-1") < 0) {
      progress.unlocked.unshift("1-1");
    }
    if (!progress.stars) progress.stars = {};
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function isUnlocked(levelId) {
    return progress.unlocked.indexOf(levelId) >= 0;
  }

  function unlockNext(afterLevelId) {
    var order = window.getJM26RunnerLevelOrder();
    var idx = order.indexOf(afterLevelId);
    if (idx < 0 || idx >= order.length - 1) return;
    var next = order[idx + 1];
    if (progress.unlocked.indexOf(next) < 0) {
      progress.unlocked.push(next);
      saveProgress();
    }
  }

  function getNextLevelId(levelId) {
    var order = window.getJM26RunnerLevelOrder();
    var idx = order.indexOf(levelId);
    if (idx < 0 || idx >= order.length - 1) return null;
    return order[idx + 1];
  }

  function setStars(levelId, stars) {
    var prev = progress.stars[levelId] || 0;
    if (stars > prev) {
      progress.stars[levelId] = stars;
      saveProgress();
    }
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function formatMath(text) {
    return window.formatQuizMath ? window.formatQuizMath(text) : text;
  }

  function getChoiceLabel(choice) {
    return lang() === "zh" ? choice.textZh : choice.textEn;
  }

  function updateHud() {
    var livesEl = document.getElementById("hud-lives");
    var progEl = document.getElementById("hud-progress");
    if (livesEl) livesEl.textContent = String(lives);
    if (progEl) {
      progEl.textContent = currentLevelId
        ? currentLevelId.toUpperCase()
        : t("game.runner.map", "Map");
    }
  }

  function showMap() {
    phase = "map";
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    var mapView = document.getElementById("runner-map-view");
    var playView = document.getElementById("runner-play-view");
    if (mapView) mapView.hidden = false;
    if (playView) playView.hidden = true;
    renderMap();
    updateHud();
  }

  function renderMap() {
    var root = document.getElementById("runner-map");
    if (!root) return;

    var html = "";
    (window.JM26_RUNNER_WORLDS || []).forEach(function (world) {
      var wLabel = lang() === "zh" ? world.labelZh : world.labelEn;
      html += '<div class="runner-world">';
      html += '<h3 class="runner-world-title">' + wLabel + "</h3>";
      html += '<div class="runner-level-row">';
      (world.levels || []).forEach(function (level) {
        var unlocked = isUnlocked(level.id);
        var stars = progress.stars[level.id] || 0;
        var lLabel = lang() === "zh" ? level.labelZh : level.labelEn;
        html +=
          '<button type="button" class="runner-level-btn' +
          (unlocked ? "" : " is-locked") +
          '" data-level="' +
          level.id +
          '"' +
          (unlocked ? "" : " disabled") +
          ">";
        html += '<span class="runner-level-name">' + lLabel + "</span>";
        html += '<span class="runner-level-stars">' + "★".repeat(stars) + "☆".repeat(3 - stars) + "</span>";
        html += "</button>";
      });
      html += "</div></div>";
    });

    var bossUnlocked = isUnlocked("boss");
    var bossStars = progress.stars.boss || 0;
    html += '<div class="runner-world runner-world-boss">';
    html += '<h3 class="runner-world-title">' + (lang() === "zh" ? window.JM26_RUNNER_BOSS.labelZh : window.JM26_RUNNER_BOSS.labelEn) + "</h3>";
    html +=
      '<button type="button" class="runner-level-btn runner-level-btn-boss' +
      (bossUnlocked ? "" : " is-locked") +
      '" data-level="boss"' +
      (bossUnlocked ? "" : " disabled") +
      ">";
    html += '<span class="runner-level-name">BOSS</span>';
    html += '<span class="runner-level-stars">' + "★".repeat(bossStars) + "☆".repeat(3 - bossStars) + "</span>";
    html += "</button></div>";

    root.innerHTML = html;

    root.querySelectorAll(".runner-level-btn:not(.is-locked)").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startLevel(btn.getAttribute("data-level"));
      });
    });
  }

  function startLevel(levelId) {
    var level = window.getJM26RunnerLevel(levelId);
    if (!level || !isUnlocked(levelId)) return;

    currentLevelId = levelId;
    currentLevel = level;
    currentQuestion = window.getJM26RunnerQuestion(level.questionId);
    if (!currentQuestion) return;

    lives = 3;
    levelStartLives = 3;
    topicMisses = {};

    var overlay = document.getElementById("run-overlay");
    if (overlay) overlay.classList.remove("is-visible");

    var mapView = document.getElementById("runner-map-view");
    var playView = document.getElementById("runner-play-view");
    if (mapView) mapView.hidden = true;
    if (playView) playView.hidden = false;

    showSolvePhase();
    updateHud();
    drawIdle();
  }

  function showSolvePhase() {
    phase = "solve";
    running = false;
    if (rafId) cancelAnimationFrame(rafId);

    var panel = document.getElementById("solve-panel");
    if (!panel || !currentQuestion) return;

    var qText = formatMath(lang() === "zh" ? currentQuestion.questionZh : currentQuestion.questionEn);
    var hint = lang() === "zh" ? currentQuestion.hintZh : currentQuestion.hintEn;
    var choices = shuffle(currentQuestion.choices.slice());

    var optionsHtml = choices
      .map(function (choice, i) {
        return (
          '<button type="button" class="quiz-option runner-solve-option" data-correct="' +
          (choice.correct ? "1" : "0") +
          '">' +
          '<span class="quiz-letter">' +
          window.QUIZ_LETTERS[i] +
          "</span>" +
          '<span class="quiz-option-text">' +
          formatMath(getChoiceLabel(choice)) +
          "</span></button>"
        );
      })
      .join("");

    panel.innerHTML =
      '<div class="solve-panel-inner">' +
      '<p class="solve-phase-label">' +
      t("game.runner.solve", "Step 1 — Solve") +
      "</p>" +
      '<p class="solve-question">' +
      qText +
      "</p>" +
      '<p class="solve-hint">' +
      t("quiz.hint", "Hint:") +
      " " +
      hint +
      "</p>" +
      '<div class="quiz-options runner-solve-options">' +
      optionsHtml +
      "</div>" +
      '<p class="solve-feedback" id="solve-feedback" hidden></p>' +
      '<button type="button" class="reader-nav runner-back-map" id="btn-back-map">' +
      t("game.runner.backMap", "← World map") +
      "</button>" +
      "</div>";
    panel.hidden = false;

    panel.querySelectorAll(".runner-solve-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        var correct = btn.getAttribute("data-correct") === "1";
        var feedback = document.getElementById("solve-feedback");
        if (correct) {
          panel.querySelectorAll(".runner-solve-option").forEach(function (b) {
            b.disabled = true;
          });
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = t("game.runner.solveOk", "Correct! Now run on the solution set.");
            feedback.className = "solve-feedback is-correct";
          }
          setTimeout(startRunPhase, 700);
        } else {
          if (currentQuestion.topic) {
            topicMisses[currentQuestion.topic] = (topicMisses[currentQuestion.topic] || 0) + 1;
          }
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = t("game.runner.solveWrong", "Try again — check your steps.");
            feedback.className = "solve-feedback is-wrong";
          }
        }
      });
    });

    var backBtn = document.getElementById("btn-back-map");
    if (backBtn) {
      backBtn.addEventListener("click", showMap);
    }
  }

  function startRunPhase() {
    phase = "run";
    var panel = document.getElementById("solve-panel");
    if (panel) panel.hidden = true;

    platformConfig = currentLevel.platform;
    platforms = window.buildJM26RunnerPlatforms(platformConfig, width);

    if (!platforms.length) return;

    var plat = platforms[0];
    player.x = plat.x + 16;
    player.y = plat.y - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;

    flag.x = plat.x + plat.w - 36;
    flag.y = plat.y - flag.h + 4;

    running = true;
    if (rafId) cancelAnimationFrame(rafId);
    loop();
  }

  function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function onPlatform(px, py, pw, ph) {
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (rectHit(px, py, pw, ph, p.x, p.y - 4, p.w, p.h + 8)) return p;
    }
    return null;
  }

  function fallOff() {
    lives -= 1;
    updateHud();
    if (lives <= 0) {
      showRunOverlay(false);
      return;
    }
    startRunPhase();
  }

  function levelComplete() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    var stars = Math.max(1, lives);
    setStars(currentLevelId, stars);
    unlockNext(currentLevelId);
    showRunOverlay(true, stars);
  }

  function showRunOverlay(won, stars) {
    var overlay = document.getElementById("run-overlay");
    var title = document.getElementById("run-overlay-title");
    var msg = document.getElementById("run-overlay-msg");
    var weakest = document.getElementById("run-overlay-weakest");
    if (!overlay) {
      if (won) showMap();
      else showSolvePhase();
      return;
    }

    overlay.classList.add("is-visible");
    if (title) {
      title.textContent = won
        ? t("game.runner.levelClear", "Level clear!")
        : t("game.over", "Game over");
    }
    if (msg) {
      if (won) {
        msg.textContent =
          t("game.runner.stars", "Stars") +
          ": " +
          "★".repeat(stars) +
          " · " +
          t("game.lives", "Lives") +
          ": " +
          lives;
      } else {
        msg.textContent = t("game.runner.tryAgain", "You fell off the solution set. Try again!");
      }
    }

    if (weakest) {
      var weak = getWeakestTopic();
      if (weak && !won) {
        weakest.hidden = false;
        var label = window.getJM26RunnerTopicLabel
          ? window.getJM26RunnerTopicLabel(weak, lang())
          : weak;
        weakest.textContent = t("game.weakest") + ": " + label;
      } else {
        weakest.hidden = true;
      }
    }

    var mapBtn = document.getElementById("btn-run-map");
    var retryBtn = document.getElementById("btn-run-retry");
    var nextBtn = document.getElementById("btn-run-next");
    var nextLevelId = won && currentLevelId ? getNextLevelId(currentLevelId) : null;

    if (nextBtn) {
      if (nextLevelId) {
        nextBtn.hidden = false;
        nextBtn.onclick = function () {
          overlay.classList.remove("is-visible");
          startLevel(nextLevelId);
        };
      } else {
        nextBtn.hidden = true;
        nextBtn.onclick = null;
      }
    }

    if (mapBtn) {
      mapBtn.onclick = function () {
        overlay.classList.remove("is-visible");
        showMap();
      };
    }
    if (retryBtn) {
      retryBtn.onclick = function () {
        overlay.classList.remove("is-visible");
        if (won) {
          startLevel(currentLevelId);
        } else {
          lives = 3;
          showSolvePhase();
          updateHud();
        }
      };
    }

    var reviewBtn = document.getElementById("btn-run-review");
    if (reviewBtn) {
      var weakTopic = getWeakestTopic();
      if (weakTopic && !won && window.LessonComics) {
        reviewBtn.hidden = false;
        reviewBtn.onclick = function () {
          overlay.classList.remove("is-visible");
          showMap();
          var chapterIdx =
            weakTopic === "fractions" ? 1 : weakTopic === "double" || weakTopic === "flip" ? 2 : 0;
          if (window.LessonComics && window.LessonComics.switchSubTopic) {
            window.LessonComics.switchSubTopic("inequalities");
          }
          setTimeout(function () {
            if (window.ComicsReader) {
              window.ComicsReader.openAt("inequalities", chapterIdx);
            }
          }, 80);
        };
      } else {
        reviewBtn.hidden = true;
      }
    }
  }

  function getWeakestTopic() {
    var weakest = null;
    var max = 0;
    Object.keys(topicMisses).forEach(function (k) {
      if (topicMisses[k] > max) {
        max = topicMisses[k];
        weakest = k;
      }
    });
    return weakest;
  }

  function valueToCanvasX(val) {
    var pad = 48;
    var inner = width - pad * 2;
    var lineMin = platformConfig.lineMin;
    var lineMax = platformConfig.lineMax;
    return pad + ((val - lineMin) / (lineMax - lineMin)) * inner;
  }

  function drawNumberLine() {
    if (!platformConfig) return;
    var pad = 48;
    var lineY = 420;
    var lineMin = platformConfig.lineMin;
    var lineMax = platformConfig.lineMax;

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad - 12, lineY);
    ctx.lineTo(width - pad + 12, lineY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    var step = lineMax - lineMin <= 8 ? 1 : 2;
    for (var v = lineMin; v <= lineMax; v += step) {
      var tx = valueToCanvasX(v);
      ctx.beginPath();
      ctx.moveTo(tx, lineY - 6);
      ctx.lineTo(tx, lineY + 6);
      ctx.stroke();
      ctx.fillText(String(v), tx, lineY + 22);
    }

    var marks = window.getJM26RunnerGraphMarks(platformConfig);
    marks.forEach(function (mark) {
      var cx = valueToCanvasX(mark.value);
      var circleY = lineY - 36;
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, lineY);
      ctx.lineTo(cx, circleY + (mark.solid ? 8 : 8));
      ctx.stroke();

      ctx.lineWidth = 3;
      if (mark.solid) {
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(cx, circleY, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(cx, circleY, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (mark.ray === "right") {
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx + 8, circleY);
        ctx.lineTo(cx + 80, circleY);
        ctx.stroke();
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.moveTo(cx + 80, circleY);
        ctx.lineTo(cx + 68, circleY - 6);
        ctx.lineTo(cx + 68, circleY + 6);
        ctx.closePath();
        ctx.fill();
      } else if (mark.ray === "left") {
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, circleY);
        ctx.lineTo(cx - 80, circleY);
        ctx.stroke();
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.moveTo(cx - 80, circleY);
        ctx.lineTo(cx - 68, circleY - 6);
        ctx.lineTo(cx - 68, circleY + 6);
        ctx.closePath();
        ctx.fill();
      }
    });

    if (platformConfig.type === "segment") {
      var xL = valueToCanvasX(platformConfig.left);
      var xR = valueToCanvasX(platformConfig.right);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(xL, lineY - 36);
      ctx.lineTo(xR, lineY - 36);
      ctx.stroke();
    }
  }

  function draw() {
    if (!ctx) return;

    var g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#1a1033");
    g.addColorStop(1, "#2d1b4e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    if (phase === "run") {
      platforms.forEach(function (p) {
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(p.x, p.y, p.w, 4);
      });

      drawNumberLine();

      ctx.fillStyle = "#22c55e";
      ctx.fillRect(flag.x, flag.y, 6, flag.h);
      ctx.fillStyle = "#86efac";
      ctx.beginPath();
      ctx.moveTo(flag.x + 6, flag.y);
      ctx.lineTo(flag.x + 28, flag.y + 12);
      ctx.lineTo(flag.x + 6, flag.y + 24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(player.x + 6, player.y + 6, player.w - 12, 8);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 13px 'DM Sans', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(t("game.runner.run", "Step 2 — Run on the solution set!"), 16, 28);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "14px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t("game.runner.pickLevel", "Pick a level on the world map"), width / 2, height / 2);
    }
  }

  function drawIdle() {
    draw();
  }

  function update() {
    if (phase !== "run" || !running) return;

    var move = 0;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"] || touchDir < 0) move -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"] || touchDir > 0) move += 1;

    player.vx = move * MOVE;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    player.onGround = false;
    var plat = onPlatform(player.x, player.y + player.h - 2, player.w, 4);
    if (plat && player.vy >= 0) {
      player.y = plat.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > width) player.x = width - player.w;

    if (player.y > height + 20) {
      fallOff();
      return;
    }

    if (
      rectHit(player.x, player.y, player.w, player.h, flag.x, flag.y, flag.w, flag.h)
    ) {
      levelComplete();
    }
  }

  function loop() {
    update();
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  function jump() {
    if (phase !== "run" || !running) return;
    if (player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
    }
  }

  function bindControls() {
    onKeyDown = function (e) {
      keys[e.key] = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "w" || e.code === "W") {
        e.preventDefault();
        jump();
      }
    };
    onKeyUp = function (e) {
      keys[e.key] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function hold(dir) {
      return {
        down: function (ev) {
          ev.preventDefault();
          touchDir = dir;
        },
        up: function (ev) {
          ev.preventDefault();
          touchDir = 0;
        },
      };
    }

    var left = document.getElementById("btn-left");
    var right = document.getElementById("btn-right");
    var jumpBtn = document.getElementById("btn-jump");
    if (left) {
      var hL = hold(-1);
      left.addEventListener("pointerdown", hL.down);
      left.addEventListener("pointerup", hL.up);
      left.addEventListener("pointerleave", hL.up);
    }
    if (right) {
      var hR = hold(1);
      right.addEventListener("pointerdown", hR.down);
      right.addEventListener("pointerup", hR.up);
      right.addEventListener("pointerleave", hR.up);
    }
    if (jumpBtn) {
      jumpBtn.addEventListener("click", function (e) {
        e.preventDefault();
        jump();
      });
    }
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    loadProgress();
    bindControls();
    showMap();
    updateHud();
    drawIdle();
  }

  function destroy() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (onKeyDown) window.removeEventListener("keydown", onKeyDown);
    if (onKeyUp) window.removeEventListener("keyup", onKeyUp);
    onKeyDown = null;
    onKeyUp = null;
    canvas = null;
    ctx = null;
  }

  function onLangChange() {
    if (phase === "map") renderMap();
    if (phase === "solve") showSolvePhase();
    updateHud();
    drawIdle();
  }

  function onShow() {
    drawIdle();
  }

  function onHide() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  return {
    init: init,
    destroy: destroy,
    onLangChange: onLangChange,
    onShow: onShow,
    onHide: onHide,
  };
})();
