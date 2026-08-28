(function () {
  "use strict";

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
        panel.classList.toggle("hidden", panel.id !== "panel-" + name);
      });
      history.replaceState(null, "", "#" + name);
      if (name === "tools") renderKatex(document.getElementById("panel-tools"));
      if (name === "comics") renderKatex(document.getElementById("panel-comics"));
    }

    document.querySelectorAll(".jm-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showTab(btn.dataset.tab);
      });
    });

    var hash = (location.hash || "").replace("#", "");
    if (hash === "comics") showTab("comics");
    else renderKatex(document.body);
  };
})();
