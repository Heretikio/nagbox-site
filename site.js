/* Nagbox marketing page. No dependencies, no external requests. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Scroll reveal ---------- */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function showAll() {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", function (e) {
        if (e.matches) {
          observer.disconnect();
          showAll();
        }
      });
    }
  }

  /* ---------- Copy buttons ---------- */
  /* Any element with data-copy-target (copies that node's text) or
     data-copy-text (copies a literal string). Zero external requests. */

  var copyEls = document.querySelectorAll("[data-copy-target], [data-copy-text]");
  Array.prototype.forEach.call(copyEls, function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-copy-target");
      var target = targetId ? document.getElementById(targetId) : null;
      if (targetId && !target) return;
      var text = target ? target.textContent : (btn.getAttribute("data-copy-text") || "");
      var original = btn.textContent;

      function done() {
        btn.classList.add("copied");
        btn.textContent = "Copied";
        window.setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = original;
        }, 2000);
      }

      function fallbackSelect() {
        if (!target) return;
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallbackSelect);
      } else {
        fallbackSelect();
      }
    });
  });

  /* ---------- Waitlist form ---------- */

  var form = document.getElementById("waitlist-form");
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');

    function showFallback() {
      var p = document.createElement("p");
      p.className = "waitlist-fallback";
      p.setAttribute("role", "status");
      p.textContent = "The hosted beta opens soon. Check back shortly.";
      form.replaceWith(p);
      var note = document.getElementById("waitlist-note");
      if (note) note.remove();
    }

    function showSuccess() {
      var p = document.createElement("p");
      p.className = "waitlist-success";
      p.setAttribute("role", "status");
      p.textContent = "You are on the list. One email when the beta opens.";
      form.replaceWith(p);
      var note = document.getElementById("waitlist-note");
      if (note) note.remove();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var input = document.getElementById("waitlist-email");
      var email = input ? input.value.trim() : "";
      if (!email || !input.checkValidity()) {
        if (input && input.reportValidity) input.reportValidity();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Joining…";
      }

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      })
        .then(function (res) {
          if (res.ok) {
            showSuccess();
          } else {
            showFallback();
          }
        })
        .catch(showFallback);
    });
  }
})();
