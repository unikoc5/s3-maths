/* Factorization — PPT clip registry: Lecture + Quiz, grouped by timestamp span. */
(function () {
  "use strict";

  var CLIP_VIEWER = "../../slides/factorization/ppt-clip/index.html";

  function clipDeck(videoRel, sourceName, start, end, title) {
    var q = new URLSearchParams({
      v: videoRel,
      source: sourceName,
      start: String(start),
      end: String(end),
      title: title,
    });
    return CLIP_VIEWER + "?" + q.toString();
  }

  var LECTURE_VIDEO = "../l01-02-main-deck/l01-02-main.mp4";
  var LECTURE_SOURCE = "l01-02-main.mp4";
  /** ffprobe duration of l01-02-main.mp4 — update if re-exported */
  var LECTURE_DURATION = 500.4;
  var QUIZ_VIDEO = "../l01-02-quiz-deck/l01-02-quiz-ans.mp4";
  var QUIZ_SOURCE = "l01-02-quiz-ans.mp4";

  /** @param {string} id @param {string} group @param {number} start @param {number} end @param {{n:string,title:string}[]} items */
  function mkGroup(id, group, start, end, items) {
    var label = items.map(function (q) { return "Q" + q.n; }).join(", ");
    return {
      id: id,
      group: group,
      start: start,
      end: end,
      label: label,
      items: items,
      deck: clipDeck(LECTURE_VIDEO, LECTURE_SOURCE, start, end, label),
    };
  }

  /** Lecture clip groups — questions sharing a timestamp appear in one sidebar button. */
  var LECTURE_GROUPS = [
    mkGroup("l1-g1", "L1", 120.1, 140, [
      { n: "1", title: "a^2+4a+4" },
      { n: "4", title: "9b^2-6b+1" },
      { n: "16", title: "4x^2+12x+9" },
    ]),
    mkGroup("l1-g2", "L1", 140.2, 159, [{ n: "12", title: "5x^2+20x+20" }]),
    mkGroup("l1-g3", "L1", 180.2, 197, [
      { n: "13", title: "x^2+4x+3" },
      { n: "19", title: "p^2+8pq+15q^2" },
      { n: "22", title: "x^2+17xy+30y^2" },
    ]),
    mkGroup("l1-g4", "L1", 220.2, 239, [
      { n: "23", title: "x^2-14x+13" },
      { n: "30", title: "a^2-18ab+56b^2" },
      { n: "40", title: "m^2n-10mnk+21k^2n" },
      { n: "46", title: "x^4-16x^2y^2+63y^4" },
    ]),
    mkGroup("l1-g5", "L1", 280.3, 299, [
      { n: "61", title: "-6st+s^2-91t^2" },
      { n: "66", title: "3a^2-15ab-42b^2" },
      { n: "69", title: "-119\\theta\\phi-42\\theta^2+98\\phi^2" },
      { n: "70", title: "24\\alpha^4\\gamma^2+90\\beta^4\\gamma^2-94\\alpha^2\\beta^2\\gamma^2" },
    ]),
    mkGroup("l2-g1", "L2", 300.3, 319, [
      { n: "6", title: "-6s+s^2-91" },
      { n: "10", title: "-17n-n^2-72" },
    ]),
    mkGroup("l2-g2", "L2", 320.35, 340, [{ n: "22", title: "3a^2-7ac+2c^2" }]),
    mkGroup("l2-g3", "L2", 340.3, 360, [{ n: "36", title: "x^2y-4xy^2-32y^3" }]),
    mkGroup("l2-g4", "L2", 360.3, 380, [{ n: "45", title: "(x+3)^3-25x-75" }]),
    mkGroup("l2-g5", "L2", 380.4, 400, [{ n: "47", title: "x^2+2xy-15y^2" }]),
    mkGroup("l2-g6", "L2", 400.4, 420, [{ n: "52", title: "14x^2-25x+6" }]),
    mkGroup("l2-g7", "L2", 420.4, 440, [{ n: "53", title: "2x^2-x-10" }]),
    mkGroup("l2-g8", "L2", 440.4, 460, [{ n: "56", title: "5x^2-17xy+6y^2" }]),
    mkGroup("l2-g9", "L2", 460.4, 480, [{ n: "59", title: "5a^2-31a+6" }]),
    mkGroup("l2-g10", "L2", 480.4, LECTURE_DURATION, [{ n: "62", title: "9x^2-16y^2" }]),
  ];

  var SECTIONS = [
    {
      id: "lecture",
      label: "Lecture",
      source: LECTURE_SOURCE,
      fullDeck: "../../slides/factorization/l01-02-main-deck/index.html",
      groups: LECTURE_GROUPS,
    },
    {
      id: "quiz",
      label: "Quiz",
      source: QUIZ_SOURCE,
      fullDeck: "../../slides/factorization/l01-02-quiz-deck/index.html",
      groups: [],
    },
  ];

  var activeSectionId = "lecture";
  var activeGroupId = null;

  function showToolbar(group) {
    var toolbar = document.getElementById("ppt-clip-toolbar");
    var titleEl = document.getElementById("ppt-toolbar-title");
    if (!toolbar || !group) return;
    toolbar.classList.remove("hidden");
    if (titleEl) titleEl.textContent = group.label;
  }

  function renderTex(root) {
    if (!window.katex || !root) return;
    root.querySelectorAll("[data-tex]").forEach(function (el) {
      try {
        katex.render(el.getAttribute("data-tex"), el, { throwOnError: false, displayMode: false });
      } catch (e) { /* ignore */ }
    });
  }

  function getSection(id) {
    for (var i = 0; i < SECTIONS.length; i++) {
      if (SECTIONS[i].id === id) return SECTIONS[i];
    }
    return SECTIONS[0];
  }

  function setFrameSrc(src) {
    var frame = document.getElementById("worked-ppt-frame");
    if (!frame) return;
    if (frame.getAttribute("src") === src) return;
    frame.src = src;
  }

  function sendToFrame(msg) {
    var frame = document.getElementById("worked-ppt-frame");
    if (frame && frame.contentWindow) frame.contentWindow.postMessage(msg, "*");
  }

  function hideToolbar() {
    var toolbar = document.getElementById("ppt-clip-toolbar");
    if (toolbar) toolbar.classList.add("hidden");
  }

  function groupExprsHtml(items) {
    return items.map(function (q) {
      return "<span class=\"ppt-clip-expr-line\" data-tex=\"" + q.title + "\"></span>";
    }).join("");
  }

  function initSidebarToggle() {
    var layout = document.getElementById("ppt-clips-layout");
    var closeBtn = document.getElementById("ppt-sidebar-toggle");
    var openBtn = document.getElementById("ppt-sidebar-reopen");
    if (!layout || !closeBtn || !openBtn) return;

    function setCollapsed(collapsed) {
      layout.classList.toggle("sidebar-collapsed", collapsed);
      closeBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      closeBtn.setAttribute("aria-label", collapsed ? "Show question list" : "Hide question list");
      closeBtn.title = collapsed ? "Show question list" : "Hide question list";
      closeBtn.innerHTML = collapsed ? "&#8250;" : "&#8249;";
      openBtn.classList.toggle("hidden", !collapsed);
    }

    closeBtn.addEventListener("click", function () { setCollapsed(true); });
    openBtn.addEventListener("click", function () { setCollapsed(false); });
  }

  function setActiveGroup(group, section) {
    var srcEl = document.getElementById("ppt-clip-source");
    if (!group) return;

    activeGroupId = group.id;

    document.querySelectorAll(".ppt-clip-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.groupId === group.id);
    });

    if (srcEl) srcEl.textContent = section.source;

    showToolbar(group);
    setFrameSrc(group.deck);
  }

  function showFullVideo(section) {
    activeGroupId = null;
    var srcEl = document.getElementById("ppt-clip-source");
    if (srcEl) srcEl.textContent = section.source;
    hideToolbar();
    document.querySelectorAll(".ppt-clip-btn").forEach(function (btn) {
      btn.classList.remove("active");
    });
    setFrameSrc(section.fullDeck);
  }

  function buildList(section) {
    var list = document.getElementById("ppt-clip-list");
    if (!list) return;
    list.innerHTML = "";

    if (!section.groups.length) {
      var empty = document.createElement("p");
      empty.className = "ppt-clips-empty";
      empty.textContent = "No question clips yet — add timestamps in factorization-ppt-clips.js.";
      list.appendChild(empty);
      showFullVideo(section);
      return;
    }

    var lastGroup = "";
    section.groups.forEach(function (grp) {
      if (grp.group && grp.group !== lastGroup) {
        lastGroup = grp.group;
        var head = document.createElement("p");
        head.className = "ppt-clip-group-head";
        head.textContent = lastGroup;
        list.appendChild(head);
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ppt-clip-btn";
      btn.dataset.groupId = grp.id;
      btn.innerHTML =
        "<span class=\"ppt-clip-n\">" + grp.label + "</span>" +
        "<span class=\"ppt-clip-exprs\">" + groupExprsHtml(grp.items) + "</span>";
      btn.addEventListener("click", function () { setActiveGroup(grp, section); });
      list.appendChild(btn);
    });
    renderTex(list);

    var pick = section.groups[0];
    if (activeGroupId) {
      section.groups.forEach(function (g) {
        if (g.id === activeGroupId) pick = g;
      });
    }
    setActiveGroup(pick, section);
  }

  function switchSection(sectionId) {
    activeSectionId = sectionId;
    activeGroupId = null;
    var section = getSection(sectionId);

    document.querySelectorAll("[data-ppt-section]").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.pptSection === sectionId);
    });

    buildList(section);
  }

  function initChromeCollapse() {
    var toggle = document.getElementById("worked-chrome-toggle");
    var label = toggle && toggle.querySelector(".wct-label");
    if (!toggle) return;

    function setCollapsed(collapsed) {
      document.body.classList.toggle("worked-chrome-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.title = collapsed ? "Show controls" : "Hide controls";
      if (label) label.textContent = collapsed ? "Show controls" : "Hide controls";
    }

    toggle.addEventListener("click", function () {
      setCollapsed(!document.body.classList.contains("worked-chrome-collapsed"));
    });

    window.FZ_PPT_CLIPS.setChromeCollapsed = setCollapsed;
  }

  window.FZ_PPT_CLIPS = {
    sections: SECTIONS,
    clipDeck: clipDeck,
    init: function () {
      document.querySelectorAll("[data-ppt-section]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          switchSection(btn.dataset.pptSection);
        });
      });
      var playBtn = document.getElementById("ppt-toolbar-play");
      var restartBtn = document.getElementById("ppt-toolbar-restart");
      if (playBtn) playBtn.addEventListener("click", function () { sendToFrame({ type: "ppt-play" }); });
      if (restartBtn) restartBtn.addEventListener("click", function () { sendToFrame({ type: "ppt-restart" }); });
      initSidebarToggle();
      initChromeCollapse();
      switchSection(activeSectionId);
    },
  };

  window.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("ppt-clip-list")) window.FZ_PPT_CLIPS.init();
  });
})();
