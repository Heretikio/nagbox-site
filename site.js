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

  /* ---------- Copy button ---------- */

  var copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var target = document.getElementById(copyBtn.getAttribute("data-copy-target"));
      if (!target) return;
      var text = target.textContent;

      function done() {
        copyBtn.classList.add("copied");
        copyBtn.textContent = "Copied";
        window.setTimeout(function () {
          copyBtn.classList.remove("copied");
          copyBtn.textContent = "Copy";
        }, 2000);
      }

      function fallbackSelect() {
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
  }

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
