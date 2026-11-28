/* Progressive enhancement only: every page stays readable without it.
   No analytics, no cookie. The only thing kept is the language chosen in the menu, in this
   browser's local storage (D-220), and the only request is the App Store prices of the site. */
(function () {
  "use strict";
  var root = document.documentElement;

  // Mobile menu: the inline script of the head opens it (so it works even if this file
  // fails to load); this closes it on a link, outside, with Escape or on a wider screen.
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("siteNav");
  var locale = document.querySelector(".locale-menu");
  function closeMenu(restoreFocus) {
    if (!toggle || !nav || !nav.classList.contains("open")) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  }
  if (toggle && nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (event) {
      if (event.matches) closeMenu(false);
    });
  }
  document.addEventListener("pointerdown", function (event) {
    if (locale && locale.open && !locale.contains(event.target)) locale.open = false;
    if (nav && toggle && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (locale && locale.open) {
      locale.open = false;
      locale.querySelector("summary").focus();
    } else {
      closeMenu(true);
    }
  });

  // Language. The root page sends a first visit to the browser's language; on any other page,
  // a visitor whose language differs from the page's is offered theirs, once, in a small note at
  // the bottom (no layout shift). The choice made in the menu, or by closing the note, is kept.
  var KEY = "vocalibur-lang";
  var OFFER = {
    fr: ["Cette page existe en français.", "Lire en français", "Fermer"],
    en: ["This page is available in English.", "Read in English", "Close"],
    de: ["Diese Seite gibt es auch auf Deutsch.", "Auf Deutsch lesen", "Schließen"],
    es: ["Esta página también está en español.", "Leer en español", "Cerrar"],
    it: ["Questa pagina è disponibile anche in italiano.", "Leggi in italiano", "Chiudi"]
  };
  function remember(code) { try { localStorage.setItem(KEY, code); } catch (e) { /* private mode */ } }
  function remembered() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  if (locale) {
    locale.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-lang]");
      if (link) remember(link.getAttribute("data-lang"));
    });
    var pageLang = (root.lang || "").slice(0, 2);
    var wanted = remembered();
    if (!OFFER[wanted]) {
      wanted = null;
      var prefs = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < prefs.length && !wanted; i++) {
        var code = String(prefs[i]).slice(0, 2).toLowerCase();
        if (OFFER[code]) wanted = code;
      }
    }
    // Only where the same page exists in that language (an hreflang alternate), not a menu
    // link that merely leads to that language's home.
    var twin = wanted && document.querySelector('link[rel="alternate"][hreflang="' + wanted + '"]');
    var target = twin && wanted !== pageLang && locale.querySelector('a[data-lang="' + wanted + '"]');
    if (target) {
      var note = document.createElement("aside");
      note.className = "lang-offer";
      note.lang = wanted;
      var text = document.createElement("span");
      text.textContent = OFFER[wanted][0];
      var go = document.createElement("a");
      go.href = target.getAttribute("href");
      go.hreflang = wanted;
      var flag = target.querySelector(".flag");
      if (flag) go.appendChild(flag.cloneNode(true));
      go.appendChild(document.createTextNode(OFFER[wanted][1]));
      go.addEventListener("click", function () { remember(wanted); });
      var close = document.createElement("button");
      close.type = "button";
      close.setAttribute("aria-label", OFFER[wanted][2]);
      close.textContent = "×";
      close.addEventListener("click", function () { remember(pageLang); note.remove(); });
      note.appendChild(text); note.appendChild(go); note.appendChild(close);
      document.body.appendChild(note);
    }
  }

  // Quiz dialog.
  var dialog = document.getElementById("diagnosticDialog");
  var opener;
  if (dialog && typeof dialog.showModal === "function") {
    document.querySelectorAll("[data-open-test]").forEach(function (button) {
      button.addEventListener("click", function () {
        opener = button;
        dialog.showModal();
        dialog.scrollTop = 0;
      });
    });
    dialog.querySelector("[data-close-test]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      var controls = Array.from(dialog.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(function (control) {
        return control.tabIndex >= 0 && control.getClientRects().length > 0;
      });
      if (!controls.length) return;
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("click", function (event) {
      var rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener("close", function () { if (opener) opener.focus(); });
    root.classList.add("js-dialog");
  }

  // Journal: filter the articles by category.
  var pills = Array.from(document.querySelectorAll(".cat-pill"));
  pills.forEach(function (pill) {
    pill.hidden = false;
    pill.addEventListener("click", function () {
      var category = pill.getAttribute("data-cat");
      pills.forEach(function (other) { other.setAttribute("aria-pressed", String(other === pill)); });
      document.querySelectorAll(".blog-entry").forEach(function (entry) {
        entry.hidden = !(category === "all" || entry.getAttribute("data-cat") === category);
      });
    });
  });
})();
