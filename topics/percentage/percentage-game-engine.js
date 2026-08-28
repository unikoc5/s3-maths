/* Shared Game Boy RPG engine for Percentages topic games. */
(function () {
  "use strict";

  let activeGame = null;

  function createPctGbGame(cfg) {
    const SCENES = cfg.scenes;
    const byId = {};
    SCENES.forEach((s) => { byId[s.id] = s; });

    const ids = cfg.ids;
    let els = {};
    let sceneId = "title";
    let sel = -1;
    let phase = "idle";
    let score = 0;
    let mathTotal = 0;
    let mathCorrect = 0;
    let typingTimer = null;
    let blinkTimer = null;
    let showCursor = true;
    let displayed = "";
    let pendingFull = "";
    let bound = false;
    const startAfterTitle = cfg.startAfterTitle || "intro";

    function beep(freq, dur) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.value = 0.06;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + (dur || 0.08));
      } catch (e) { /* silent */ }
    }

    function scene() { return byId[sceneId]; }
    function isActive() {
      const root = document.getElementById(ids.root);
      return root && !root.classList.contains("hidden") && activeGame === api;
    }

    function setHud() {
      if (els.score) els.score.textContent = "SCORE " + score;
      if (els.chapter) {
        const n = SCENES.findIndex((s) => s.id === sceneId) + 1;
        els.chapter.textContent = "SC " + String(n).padStart(2, "0");
      }
    }

    function clearTyping() {
      if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    }

    function startLines(sc, done, isFeedback) {
      clearTyping();
      displayed = "";
      let i = 0;
      phase = isFeedback ? "feedback" : "lines";
      const full = sc.lines.join("\n");
      pendingFull = full;
      els.text.textContent = "";
      typingTimer = setInterval(() => {
        if (i >= full.length) {
          clearTyping();
          els.text.textContent = full;
          if (done) done();
          else phase = "lines_done";
          return;
        }
        displayed += full[i++];
        els.text.textContent = displayed;
      }, 28);
    }

    const OPT_KEYS = ["A", "B", "C", "D"];

    function optHint(sc, ch) {
      if (cfg.optHint) return cfg.optHint(sc, ch);
      if (sc.flavor) return "your pick";
      if (/^\$/.test(ch.label)) return "amount";
      if (ch.label.includes("%")) return "rate / percent";
      if (/formula|A\s*=|I\s*=/.test(ch.label)) return "formula";
      return "your guess";
    }

    function renderChoices(sc) {
      els.choices.innerHTML = "";
      if (!sc.choices) { els.choices.classList.add("hidden"); return; }
      els.choices.classList.remove("hidden");

      const head = document.createElement("div");
      head.className = "pg-opt-head";
      head.textContent = sc.flavor ? "PICK ONE" : "CHOOSE ANSWER";
      els.choices.appendChild(head);

      const list = document.createElement("div");
      list.className = "pg-opt-list";

      sc.choices.forEach((c, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pg-opt" + (sel >= 0 && i === sel ? " sel" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", sel >= 0 && i === sel ? "true" : "false");

        const key = document.createElement("span");
        key.className = "pg-opt-key";
        key.textContent = OPT_KEYS[i] || String(i + 1);

        const body = document.createElement("span");
        body.className = "pg-opt-body";
        const lab = document.createElement("span");
        lab.className = "pg-opt-label";
        lab.textContent = c.label;
        const hint = document.createElement("span");
        hint.className = "pg-opt-hint";
        hint.textContent = c.hintLabel || optHint(sc, c);
        body.appendChild(lab);
        body.appendChild(hint);

        const cur = document.createElement("span");
        cur.className = "pg-opt-cursor";
        cur.setAttribute("aria-hidden", "true");

        btn.appendChild(key);
        btn.appendChild(body);
        btn.appendChild(cur);
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          sel = i;
          pickChoice();
        });
        // touch devices have no hover — mirror it while the finger holds the button
        btn.addEventListener("pointerdown", () => btn.classList.add("hold"));
        ["pointerup", "pointercancel", "pointerleave"].forEach((t) =>
          btn.addEventListener(t, () => btn.classList.remove("hold")));
        list.appendChild(btn);
      });

      els.choices.appendChild(list);
    }

    function renderTitle(sc) {
      els.choices.classList.add("hidden");
      phase = "title";
      els.text.innerHTML =
        '<div class="gb-title-main">' + sc.lines[0] + "</div>" +
        '<div class="gb-title-sub">' + sc.lines[1] + "</div>" +
        '<div class="gb-title-start' + (showCursor ? " blink" : "") + '">' + sc.lines[3] + "</div>";
    }

    function showScene(id) {
      sceneId = id;
      sel = -1;
      setHud();
      const sc = scene();
      if (!sc) return;

      if (sc.title) { renderTitle(sc); return; }
      if (sc.end) {
        phase = "end";
        els.choices.classList.add("hidden");
        startLines({ lines: sc.lines.concat(["", "Math: " + mathCorrect + "/" + mathTotal, "Score: " + score]) });
        if (els.restart) els.restart.classList.remove("hidden");
        return;
      }
      if (sc.choices) {
        phase = "lines";
        els.choices.classList.add("hidden");
        startLines(sc, () => { phase = "choose"; renderChoices(sc); });
        return;
      }
      phase = "lines";
      startLines(sc);
    }

    function advance() {
      const sc = scene();
      if (!sc) return;

      if (sc.title) { beep(660); showScene(startAfterTitle); return; }
      if (typingTimer) {
        clearTyping();
        els.text.textContent = pendingFull;
        if (phase === "feedback") phase = "feedback_done";
        else if (sc.choices && phase === "lines") { phase = "choose"; renderChoices(sc); }
        else phase = "lines_done";
        return;
      }
      if (phase === "feedback" || phase === "feedback_done") {
        beep(520);
        showScene(sc.next || startAfterTitle);
        return;
      }
      if (phase === "end") { restart(); return; }
      if (phase === "choose") return;
      if (sc.next) { beep(520); showScene(sc.next); }
    }

    function pickChoice() {
      const sc = scene();
      if (!sc || !sc.choices || phase !== "choose") return;
      const ch = sc.choices[sel];
      beep(ch.correct !== false ? 880 : 180);

      if (sc.flavor) {
        els.choices.classList.add("hidden");
        showScene(ch.branch);
        return;
      }

      mathTotal++;
      if (ch.correct) { score += 100; mathCorrect++; }
      else score = Math.max(0, score - 25);
      setHud();

      els.choices.classList.add("hidden");
      const msg = ch.correct
        ? ("* CORRECT! *\n\n" + ch.hint)
        : ("* OOPS... *\n\n" + ch.hint);
      startLines({ lines: msg.split("\n") }, () => { phase = "feedback_done"; }, true);
    }

    function moveSel(d) {
      const sc = scene();
      if (!sc || !sc.choices || phase !== "choose") return;
      if (sel < 0) sel = 0;
      else sel = (sel + d + sc.choices.length) % sc.choices.length;
      beep(440, 0.04);
      renderChoices(sc);
    }

    function handleKey(e) {
      if (!isActive()) return;
      if (e.target && e.target.closest && e.target.closest(".pg-calc")) return;
      const sc = scene();

      if (sc && sc.title && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        advance();
        return;
      }
      if (phase === "choose") {
        if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
        else if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (sel < 0) sel = 0;
          pickChoice();
        }
        return;
      }
      if (phase === "lines" || phase === "lines_done" || phase === "feedback" ||
          phase === "feedback_done" || phase === "end") {
        if (e.key === "Enter" || e.key === " " || e.key === "z" || e.key === "Z") {
          e.preventDefault();
          advance();
        }
      }
    }

    function restart() {
      score = 0;
      mathTotal = 0;
      mathCorrect = 0;
      if (els.restart) els.restart.classList.add("hidden");
      showScene("title");
      setHud();
    }

    function startBlink() {
      if (blinkTimer) clearInterval(blinkTimer);
      blinkTimer = setInterval(() => {
        showCursor = !showCursor;
        if (scene().title) renderTitle(scene());
      }, 520);
    }

    function bind() {
      els = {
        shell: document.getElementById(ids.shell),
        text: document.getElementById(ids.text),
        choices: document.getElementById(ids.choices),
        score: document.getElementById(ids.score),
        chapter: document.getElementById(ids.chapter),
        restart: document.getElementById(ids.restart),
        screen: document.getElementById(ids.screen),
      };
      if (!els.shell) return;

      els.screen.addEventListener("click", () => {
        if (phase === "choose") return;
        advance();
      });
      if (els.restart) els.restart.addEventListener("click", restart);
      startBlink();
      bound = true;
    }

    const api = {
      show() {
        if (!bound) bind();
        activeGame = api;
        restart();
      },
      hide() {
        if (activeGame === api) activeGame = null;
        clearTyping();
      },
      handleKey,
    };

    return api;
  }

  document.addEventListener("keydown", (e) => {
    if (activeGame) activeGame.handleKey(e);
  });

  window.createPctGbGame = createPctGbGame;
})();
