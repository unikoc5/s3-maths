(function () {
  var readerEl = null;
  var flatList = [];
  var currentIndex = 0;
  var currentTopicKey = null;

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      return window.I18n.t(key);
    }
    return fallback || key;
  }

  function ensureReader() {
    if (readerEl) return readerEl;

    readerEl = document.createElement("div");
    readerEl.className = "comics-reader";
    readerEl.hidden = true;
    readerEl.innerHTML =
      '<div class="reader-backdrop" data-action="close"></div>' +
      '<div class="reader-panel" role="dialog" aria-modal="true" aria-label="Comic reader">' +
      '  <header class="reader-header">' +
      '    <div class="reader-meta">' +
      '      <span class="reader-topic" id="reader-topic"></span>' +
      '      <strong class="reader-title" id="reader-title"></strong>' +
      "    </div>" +
      '    <button type="button" class="reader-close" data-action="close" aria-label="Close">×</button>' +
      "  </header>" +
      '  <div class="reader-body">' +
      '    <img id="reader-image" alt="" />' +
      "  </div>" +
      '  <footer class="reader-footer">' +
      '    <button type="button" class="reader-nav" data-action="prev" id="reader-prev"></button>' +
      '    <span class="reader-counter" id="reader-counter"></span>' +
      '    <div class="reader-footer-right">' +
      '      <button type="button" class="reader-nav" data-action="next" id="reader-next"></button>' +
      '      <button type="button" class="reader-nav is-subtopic" data-action="next-subtopic" id="reader-next-subtopic" hidden></button>' +
      "    </div>" +
      "  </footer>" +
      "</div>";

    document.body.appendChild(readerEl);

    readerEl.addEventListener("click", function (e) {
      var action = e.target.closest("[data-action]");
      if (!action) return;
      var name = action.getAttribute("data-action");
      if (name === "close") window.ComicsReader.close();
      if (name === "prev") window.ComicsReader.prev();
      if (name === "next") window.ComicsReader.next();
      if (name === "next-subtopic") window.ComicsReader.nextSubTopic();
    });

    document.addEventListener("keydown", function (e) {
      if (!readerEl || readerEl.hidden) return;
      if (e.key === "Escape") window.ComicsReader.close();
      if (e.key === "ArrowLeft") window.ComicsReader.prev();
      if (e.key === "ArrowRight") {
        if (currentIndex < flatList.length - 1) {
          window.ComicsReader.next();
        }
      }
    });

    return readerEl;
  }

  function updateNavLabels() {
    if (!readerEl) return;
    document.getElementById("reader-prev").textContent = t("reader.prev", "← Previous");
    document.getElementById("reader-next").textContent = t("reader.next", "Next →");
    document.getElementById("reader-next-subtopic").textContent = t("reader.nextSubTopic", "Next sub-topic →");
  }

  function render(index) {
    var item = flatList[index];
    if (!item) return;

    currentIndex = index;
    currentTopicKey = item.topicKey;
    var el = ensureReader();
    el.hidden = false;
    document.body.classList.add("reader-open");
    updateNavLabels();

    document.getElementById("reader-topic").textContent = item.topicLabel + " · " + item.series;
    document.getElementById("reader-title").textContent = item.title;
    document.getElementById("reader-counter").textContent =
      index + 1 + " / " + flatList.length;

    var img = document.getElementById("reader-image");
    img.src = item.src;
    img.alt = item.title;

    var prevBtn = el.querySelector('[data-action="prev"]');
    var nextBtn = el.querySelector('[data-action="next"]');
    var nextSubBtn = el.querySelector('[data-action="next-subtopic"]');
    var isLastInTopic = index === flatList.length - 1;
    var nextTopicKey =
      window.getNextComicTopicKey && currentTopicKey
        ? window.getNextComicTopicKey(currentTopicKey)
        : null;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = isLastInTopic;
    nextBtn.hidden = isLastInTopic;
    nextSubBtn.hidden = !(isLastInTopic && nextTopicKey);
  }

  window.ComicsReader = {
    init: function init(topicKey) {
      if (topicKey && window.getComicFlatListForTopic) {
        flatList = window.getComicFlatListForTopic(topicKey);
        currentTopicKey = topicKey;
      }
    },
    openAt: function openAt(topicKey, index) {
      if (window.getComicFlatListForTopic) {
        flatList = window.getComicFlatListForTopic(topicKey);
      }
      currentTopicKey = topicKey;
      render(typeof index === "number" ? index : 0);
    },
    close: function close() {
      if (!readerEl) return;
      readerEl.hidden = true;
      document.body.classList.remove("reader-open");
    },
    prev: function prev() {
      if (currentIndex > 0) render(currentIndex - 1);
    },
    next: function next() {
      if (currentIndex < flatList.length - 1) render(currentIndex + 1);
    },
    nextSubTopic: function nextSubTopic() {
      var nextKey =
        window.getNextComicTopicKey && currentTopicKey
          ? window.getNextComicTopicKey(currentTopicKey)
          : null;
      if (!nextKey) return;
      window.ComicsReader.close();
      if (window.LessonComics && typeof window.LessonComics.switchSubTopic === "function") {
        window.LessonComics.switchSubTopic(nextKey);
      }
    },
    refreshLabels: function refreshLabels() {
      updateNavLabels();
    },
  };
})();
