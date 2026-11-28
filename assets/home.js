/* The home page's live pieces: a card to reveal and swipe, the schedule to read with the
   finger, and objects that move in as they come into view. Progressive enhancement only:
   without this file every piece is a still drawing that says the same thing. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var lang = root.lang || "en";
  var here = document.currentScript && document.currentScript.src;

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

  // MARK: The hero, the app filmed (D-221)
  // The poster is the recording's first frame. Once the page is shown, the video of the
  // visitor's theme loads and plays in a loop, only while on screen; none of it with reduced
  // motion or a request to save data.
  var video = document.querySelector(".hero-video");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (video && !still.matches && !saveData && "IntersectionObserver" in window) {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    var visible = false;
    var source = function () { return video.getAttribute(dark.matches ? "data-dark" : "data-light"); };
    var play = function () { if (visible && video.src) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } };
    video.addEventListener("playing", function () { video.classList.add("is-playing"); });
    var start = function () {
      video.src = source();
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else video.pause();
      }).observe(video);
    };
    dark.addEventListener("change", function () {
      if (!video.src) return;
      video.classList.remove("is-playing");
      video.src = source();
      play();
    });
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
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

  // MARK: How much of a text the most frequent words cover, read with the finger
  document.querySelectorAll("[data-coverage]").forEach(function (chart) {
    var data = JSON.parse(chart.getAttribute("data-coverage"));
    var svg = chart.querySelector("svg");
    var cursor = chart.querySelector("[data-cursor]");
    var dot = chart.querySelector("[data-dot]");
    var outWords = chart.querySelector("[data-out-words]");
    var outShare = chart.querySelector("[data-out-share]");
    var box = data.box, last = data.samples.length - 1;
    var percent = new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 0 });
    var count = new Intl.NumberFormat(lang, { useGrouping: data.group ? "always" : "min2" });
    var index = Math.round(data.start / data.step);
    function x(i) { return box[0] + (box[2] - box[0]) * i / last; }
    function y(value) { return box[3] - (box[3] - box[1]) * value / 100; }
    function set(i) {
      index = Math.max(0, Math.min(last, Math.round(i)));
      var value = data.samples[index];
      cursor.setAttribute("x1", x(index)); cursor.setAttribute("x2", x(index));
      dot.setAttribute("cx", x(index)); dot.setAttribute("cy", y(value));
      outWords.textContent = data.words.replace("{n}", count.format(index * data.step));
      outShare.textContent = data.share.replace("{p}", percent.format(value / 100));
      svg.setAttribute("aria-valuenow", index * data.step);
      svg.setAttribute("aria-valuetext", outWords.textContent + ", " + outShare.textContent);
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
      var step = event.shiftKey ? 10 : 1;
      var next = { ArrowRight: index + step, ArrowUp: index + step, ArrowLeft: index - step, ArrowDown: index - step, Home: 0, End: last }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      set(next);
    });
    chart.classList.add("is-live");
    set(index);
  });

  // MARK: App Store prices of the visitor's country
  // The page shows its own language's country (France for French…); prices.json, read from App
  // Store Connect, gives every storefront. The country comes from the time zone, else from the
  // browser's region; the visitor can pick another one.
  var plans = document.querySelector("[data-prices]");
  if (plans && here && window.fetch && "IntersectionObserver" in window) {
    var asked = false;
    var watch = new IntersectionObserver(function (entries) {
      if (asked || !entries[0].isIntersecting) return;
      asked = true;
      watch.disconnect();
      fetch(new URL("prices.json", here)).then(function (r) { return r.json(); }).then(prices).catch(function () {});
    }, { rootMargin: "700px 0px" });
    watch.observe(plans);
  }
  function prices(data) {
    var all = data.prices;
    var country = plans.getAttribute("data-country");
    var guess = null;
    try { guess = data.zones[Intl.DateTimeFormat().resolvedOptions().timeZone]; } catch (e) { guess = null; }
    if (!all[guess]) {
      guess = null;
      (navigator.languages || [navigator.language || ""]).forEach(function (tag) {
        var m = /-([a-z]{2})(?:-|$)/i.exec(String(tag));
        if (!guess && m && all[m[1].toUpperCase()]) guess = m[1].toUpperCase();
      });
    }
    var names = null;
    try { names = new Intl.DisplayNames([lang], { type: "region" }); } catch (e) { names = null; }
    function name(code) { try { return names ? names.of(code) : code; } catch (e) { return code; } }
    function money(code, amount) {
      var currency = all[code][0];
      var digits = /\.00$/.test(amount) ? 0 : 2;
      var options = { style: "currency", currency: currency, minimumFractionDigits: digits, maximumFractionDigits: digits };
      try { return new Intl.NumberFormat(lang + "-" + code, options).format(+amount); }
      catch (e) { return new Intl.NumberFormat(lang, options).format(+amount); }
    }
    function fill(slot, text) { var el = plans.querySelector('[data-price="' + slot + '"]'); if (el) el.textContent = text; }
    function show(code) {
      var p = all[code];
      if (!p) return;
      fill("free", money(code, "0.00"));
      fill("annual", money(code, p[2]));
      var monthly = (Math.floor(+p[2] / 12 * 100) / 100).toFixed(2);
      var equivalent = plans.querySelector('[data-price="equivalent"]');
      equivalent.textContent = equivalent.getAttribute("data-template").replace("{price}", money(code, monthly));
      var alternative = plans.querySelector('[data-price="alternative"]');
      alternative.textContent = alternative.getAttribute("data-template").replace("{month}", money(code, p[1])).replace("{life}", money(code, p[3]));
      plans.querySelector('[data-price="trial"]').hidden = !p[4];
    }
    // The country line becomes a menu of every storefront, named in the page's language.
    var line = plans.querySelector("[data-country-line]");
    var select = document.createElement("select");
    select.setAttribute("aria-label", line.getAttribute("data-label"));
    Object.keys(all).map(function (code) { return [name(code), code]; })
      .sort(function (a, b) { return a[0].localeCompare(b[0], lang); })
      .forEach(function (pair) {
        var option = document.createElement("option");
        option.value = pair[1];
        option.textContent = pair[0];
        select.appendChild(option);
      });
    var chosen = all[guess] ? guess : country;
    select.value = chosen;
    select.addEventListener("change", function () { show(select.value); });
    var label = document.createElement("span");
    label.textContent = line.getAttribute("data-template").split("{country}")[0].replace(/[\s  ]*:[\s  ]*$/, "");
    line.textContent = "";
    line.appendChild(label);
    line.appendChild(select);
    if (chosen !== country) show(chosen);
  }

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
