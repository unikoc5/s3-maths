/* Per-topic KOC worked-tab bootstrap (bank → KocWorked.mount). */
(function () {
  "use strict";

  window.KocTopic = {
    create: function (cfg) {
      var mounted = false;

      function wrapFigureApi(fig) {
        if (!fig) return null;
        if (fig.draw && fig.draw.length >= 4) return fig;
        return {
          draw: function (svg, spec, methods, reveal) {
            if (!spec || !spec.type) return;
            fig.draw(svg, spec.type, spec.data || {}, reveal);
          },
          renderTex: fig.renderTex,
        };
      }

      function init() {
        if (mounted) return;
        var mount = document.getElementById(cfg.mountId || "koc-worked-mount");
        if (!mount || !window.KocWorked || !window.KocBankBridge) return;
        var questions = cfg.questions;
        if (!questions && cfg.getBank) {
          questions = window.KocBankBridge.flattenBank(cfg.getBank);
        }
        if (!questions || !questions.length) return;
        var rawFig = cfg.figureApi;
        if (!rawFig && cfg.figureGlobal) rawFig = window[cfg.figureGlobal];
        var figureApi = wrapFigureApi(rawFig);
        window.KocWorked.mount(mount, questions, { figureApi: figureApi });
        mounted = true;
      }

      var out = { show: init };
      if (cfg.globalName) window[cfg.globalName] = out;
      return out;
    },
  };
})();
