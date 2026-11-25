/* Progressive enhancement only: every page stays readable without it.
   No analytics, no storage, no network request. */
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
