/* The home page's live pieces: a card to reveal and swipe, the schedule to read with the
   finger, and objects that move in as they come into view. Progressive enhancement only:
   without this file every piece is a still drawing that says the same thing. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var lang = root.lang || "en";

  // Objects move in once, as they come into view.
  var movers = document.querySelectorAll("[data-arrive]");
  if ("IntersectionObserver" in window && movers.length) {
    root.classList.add("js-arrive");
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-here");
        seen.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    movers.forEach(function (el) { seen.observe(el); });
  }

  // MARK: The card to swipe
  document.querySelectorAll("[data-deck]").forEach(function (deck) {
    var cards = Array.from(deck.querySelectorAll(".demo-card"));
    var status = deck.querySelector("[data-deck-status]");
    var reveal = deck.querySelector("[data-deck-reveal]");
    var labels = {};
    deck.querySelectorAll("[data-dir]").forEach(function (label) { labels[label.getAttribute("data-dir")] = label; });
    if (!cards.length || !reveal) return;
    deck.classList.add("is-live");
    reveal.hidden = false;
    var index = 0, busy = false;

    function top() { return cards[index]; }
    function order() {
      cards.forEach(function (card, i) {
        var depth = (i - index + cards.length) % cards.length;
        card.style.setProperty("--depth", depth);
        card.setAttribute("aria-hidden", depth === 0 ? "false" : "true");
        card.tabIndex = depth === 0 ? 0 : -1;
        card.classList.toggle("is-top", depth === 0);
      });
      reveal.classList.toggle("is-spent", top().classList.contains("is-revealed"));
    }
    function light(dir) {
      Object.keys(labels).forEach(function (key) { labels[key].classList.toggle("is-lit", key === dir); });
    }
    function show() {
      var card = top();
      if (card.classList.contains("is-revealed")) return;
      card.classList.add("is-revealed");
      reveal.classList.add("is-spent");
      if (status) status.textContent = card.getAttribute("data-answer");
    }
    function send(dir) {
      if (busy) return;
      busy = true;
      var card = top();
      var label = labels[dir];
      light(dir);
      if (status && label) status.textContent = label.querySelector("b").textContent + ". " + label.querySelector("span").textContent;
      card.style.transition = still.matches ? "opacity .2s" : "transform .42s cubic-bezier(.2,.7,.3,1), opacity .42s";
      var far = { right: "translate(130%, 0) rotate(14deg)", left: "translate(-130%, 0) rotate(-14deg)",
                  up: "translate(0, -120%)", down: "translate(0, 70%) scale(.9)" }[dir];
      card.style.transform = still.matches ? "" : far;
      card.style.opacity = "0";
      window.setTimeout(function () {
        var hadFocus = document.activeElement === card;
        card.classList.remove("is-revealed");
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = "";
        index = (index + 1) % cards.length;
        order();
        if (hadFocus) top().focus({ preventScroll: true });
        void card.offsetWidth;
        card.style.transition = "";
        light(null);
        busy = false;
      }, still.matches ? 220 : 440);
    }

    reveal.addEventListener("click", show);
    deck.addEventListener("keydown", function (event) {
      var dir = { ArrowRight: "right", ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down" }[event.key];
      if (dir && event.target.classList.contains("demo-card")) { event.preventDefault(); send(dir); }
      else if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("demo-card")) { event.preventDefault(); show(); }
    });

    // Drag: the card follows the finger, the gesture it would make lights up, and past a
    // threshold it leaves in that direction. A tap reveals it.
    var start = null;
    function direction(dx, dy) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    }
    deck.addEventListener("pointerdown", function (event) {
      var card = event.target.closest(".demo-card");
      if (!card || card !== top() || busy || event.button > 0) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false };
      card.setPointerCapture(event.pointerId);
      card.style.transition = "none";
    });
    deck.addEventListener("pointermove", function (event) {
      if (!start || event.pointerId !== start.id) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) start.moved = true;
      top().style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx / 22 + "deg)";
      light(direction(dx, dy));
    });
    function release(event) {
      if (!start || event.pointerId !== start.id) return;
      var card = top();
      var dx = event.clientX - start.x, dy = event.clientY - start.y;
      var moved = start.moved;
      start = null;
      card.style.transition = "";
      var far = Math.max(Math.abs(dx), Math.abs(dy)) > Math.min(110, card.offsetWidth * 0.32);
      if (moved && far) { send(direction(dx, dy)); return; }
      card.style.transform = "";
      light(null);
      if (!moved) show();
    }
    deck.addEventListener("pointerup", release);
    deck.addEventListener("pointercancel", release);
    order();
  });

  // MARK: The schedule, read with the finger
  document.querySelectorAll("[data-recall]").forEach(function (chart) {
    var data = JSON.parse(chart.getAttribute("data-recall"));
    var svg = chart.querySelector("svg");
    var cursor = chart.querySelector("[data-cursor]");
    var dotA = chart.querySelector("[data-dot-spaced]");
    var dotB = chart.querySelector("[data-dot-alone]");
    var out = { day: chart.querySelector("[data-out-day]"), spaced: chart.querySelector("[data-out-spaced]"), alone: chart.querySelector("[data-out-alone]") };
    var box = data.box, last = data.spaced.length - 1;
    var percent = new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 0 });
    function x(day) { return box[0] + (box[2] - box[0]) * day / last; }
    function y(value) { return box[3] - (box[3] - box[1]) * (value - data.floor) / (1 - data.floor); }
    function set(day) {
      day = Math.max(0, Math.min(last, Math.round(day)));
      var a = data.spaced[day], b = data.alone[day];
      cursor.setAttribute("x1", x(day)); cursor.setAttribute("x2", x(day));
      dotA.setAttribute("cx", x(day)); dotA.setAttribute("cy", y(a));
      dotB.setAttribute("cx", x(day)); dotB.setAttribute("cy", y(b));
      out.day.textContent = data.dayLabel.replace("{d}", day);
      out.spaced.textContent = percent.format(a);
      out.alone.textContent = percent.format(b);
      svg.setAttribute("aria-valuenow", day);
      svg.setAttribute("aria-valuetext", [out.day, out.spaced.parentNode, out.alone.parentNode].map(function (el) { return el.textContent.trim(); }).join(", "));
      chart.dataset.day = day;
    }
    function fromPointer(event) {
      var rect = svg.getBoundingClientRect();
      var vx = (event.clientX - rect.left) / rect.width * data.width;
      set((vx - box[0]) / (box[2] - box[0]) * last);
    }
    var dragging = false;
    svg.addEventListener("pointerdown", function (event) { dragging = true; svg.setPointerCapture(event.pointerId); fromPointer(event); });
    svg.addEventListener("pointermove", function (event) { if (dragging || event.pointerType === "mouse") fromPointer(event); });
    svg.addEventListener("pointerup", function () { dragging = false; });
    svg.addEventListener("pointercancel", function () { dragging = false; });
    svg.addEventListener("keydown", function (event) {
      var day = +chart.dataset.day, step = event.shiftKey ? 10 : 1;
      var next = { ArrowRight: day + step, ArrowUp: day + step, ArrowLeft: day - step, ArrowDown: day - step, Home: 0, End: last }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      set(next);
    });
    chart.classList.add("is-live");
    set(data.start);
  });
})();
