(function () {
  "use strict";

  var TAB_ORDER = ["concept", "tools", "games", "comics", "summary", "quiz"];

  function renderKatex(root) {
    if (window.renderMathInElement && root) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  window.initJmTabs = function () {
    function showTab(name) {
      document.querySelectorAll(".jm-tab").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.tab === name);
      });
      document.querySelectorAll(".jm-panel").forEach(function (panel) {
        var show = panel.id === "panel-" + name;
        panel.classList.toggle("hidden", !show);
        panel.classList.remove("is-entering");
        if (show) {
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });
      history.replaceState(null, "", "#" + name);
      renderKatex(document.getElementById("panel-" + name));
    }

    document.querySelectorAll(".jm-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showTab(btn.dataset.tab);
      });
    });

    var hash = (location.hash || "").replace("#", "");
    var available = {};
    document.querySelectorAll(".jm-tab").forEach(function (btn) {
      available[btn.dataset.tab] = true;
    });
    if (hash && available[hash]) {
      showTab(hash);
      return;
    }
    var fallback = "concept";
    for (var i = 0; i < TAB_ORDER.length; i++) {
      if (available[TAB_ORDER[i]]) {
        fallback = TAB_ORDER[i];
        break;
      }
    }
    if (fallback === "concept" && available.concept) showTab("concept");
    else if (available[fallback]) showTab(fallback);
    else renderKatex(document.body);
  };
})();
