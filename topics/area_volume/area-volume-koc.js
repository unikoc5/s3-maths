(function () {
  "use strict";
  var mounted = false;

  function init() {
    if (mounted) return;
    var mount = document.getElementById("koc-worked-mount");
    if (!mount || !window.KocWorked || !window.AV_KOC) return;
    window.KocWorked.mount(mount, window.AV_KOC, {
      figureApi: window.AVFigure ? {
        draw: function (svg, spec, methods, reveal) {
          window.AVFigure.draw(svg, spec.type, spec.data || {}, reveal);
        },
        renderTex: window.AVFigure.renderTex,
      } : null,
    });
    mounted = true;
  }

  window.AVKoc = {
    show: function () { init(); },
  };

  if (document.getElementById("panel-worked") && !document.getElementById("panel-worked").classList.contains("hidden")) {
    init();
  }
})();
