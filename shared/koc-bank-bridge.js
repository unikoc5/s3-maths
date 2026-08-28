/* Convert legacy worked-solution bank entries → KOC question list. */
(function () {
  "use strict";

  function esc(s) {
    return String(s || "").replace(/"/g, "&quot;");
  }

  function probHtml(rows) {
    if (!rows || !rows.length) return "";
    return rows.map(function (r) {
      var tex = r.tex != null ? r.tex : (r.txt || "");
      return '<div class="sp-q-row">' + (r.tag ? "<b>" + r.tag + "</b> " : "") +
        '<span data-tex="' + esc(tex) + '"></span></div>';
    }).join("");
  }

  function focusReveal(focus) {
    if (focus == null) return 0;
    if (typeof focus === "number") return focus;
    if (typeof focus === "object" && focus.reveal != null) return focus.reveal;
    return 99;
  }

  function resolveFocus(focus, item) {
    if (focus == null) return null;
    if (typeof focus === "number") {
      if (focus > 0 && item.methods && item.methods.cross) {
        return { type: "cross", reveal: focus, data: item.methods.cross };
      }
      return null;
    }
    if (typeof focus === "object" && focus.type) {
      var data = focus.data || (item.methods && item.methods[focus.type]) || {};
      return { type: focus.type, data: data, reveal: focusReveal(focus) };
    }
    return null;
  }

  function stepFocus(s, item, defaultFig) {
    var f = resolveFocus(s.focus, item);
    if (f) return f;
    if (defaultFig) {
      return {
        type: defaultFig.type,
        data: Object.assign({}, defaultFig.data || {}),
        reveal: focusReveal(s.focus),
      };
    }
    return null;
  }

  function itemToKoc(item, src, id) {
    if (!item.solved) return null;
    var prefix = src.prefix || "";
    var defaultFig = item.figure
      ? { type: item.figure.type, data: item.figure.data || {} }
      : null;
    return {
      id: id,
      label: prefix + item.n + " \u00b7 " + (item.short || item.title || "Question"),
      title: prefix + item.n + " \u2014 " + (item.title || "Worked solution"),
      subtitle: item.sub || src.name || "",
      problemHtml: probHtml(item.question),
      figure: defaultFig,
      methods: item.methods || {},
      steps: (item.steps || []).map(function (s, i) {
        return {
          reveal: focusReveal(s.focus),
          title: s.title || "Step " + (i + 1),
          body: s.body || "",
          focus: stepFocus(s, item, defaultFig),
        };
      }),
    };
  }

  function flattenBank(getBank) {
    var sources = typeof getBank === "function" ? getBank() : getBank;
    if (!sources || !sources.length) return [];
    var out = [];
    sources.forEach(function (src) {
      (src.groups || []).forEach(function (g, gi) {
        (g.items || []).forEach(function (item) {
          var id = (src.id || "src") + "-" + gi + "-" + String(item.n).replace(/[^a-zA-Z0-9]+/g, "_");
          var q = itemToKoc(item, src, id);
          if (q) out.push(q);
        });
      });
    });
    return out;
  }

  window.KocBankBridge = {
    flattenBank: flattenBank,
    itemToKoc: itemToKoc,
    probHtml: probHtml,
  };
})();
