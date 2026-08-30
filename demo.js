/* Nagbox hero demo. Self-playing ~18s loop of the triage stream:
   capture -> swipe-to-snooze -> time skip -> resurface pre-pinned -> sweep -> sunrise.
   Vanilla JS, no deps. Mounts into #demo (creates it if the page lacks one).
   Pauses offscreen; prefers-reduced-motion gets a static resurfaced frame. */
(function () {
  'use strict';

  var HERO = 'Take the trash bins down';
  var NOISE = ['Renew car tags', 'Text Sam back', 'Water the seedlings'];
  var LOOP_MS = 18000;

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function buildRow(text, opts) {
    opts = opts || {};
    var slot = h('div', 'nb-slot');
    var inner = h('div', 'nb-slotin');
    var row = h('div', 'nb-row');
    var revS = h('div', 'nb-rev nb-rev-snooze');
    revS.appendChild(h('span', 'nb-revlab', 'Snooze'));
    var revD = h('div', 'nb-rev nb-rev-done');
    revD.appendChild(h('span', 'nb-revlab', 'Done'));
    var card = h('div', 'nb-card');
    var dot = h('span', 'nb-dot');
    var body = h('div', 'nb-body');
    body.appendChild(h('div', 'nb-text', text));
    if (opts.chip) body.appendChild(h('span', 'nb-chip', opts.chip));
    card.appendChild(dot);
    card.appendChild(body);
    if (opts.pinned) card.appendChild(h('span', 'nb-pin'));
    row.appendChild(revS);
    row.appendChild(revD);
    row.appendChild(card);
    inner.appendChild(row);
    slot.appendChild(inner);
    return { slot: slot, row: row, card: card, dot: dot };
  }

  function init() {
    var mount = document.getElementById('demo');
    if (!mount) {
      mount = h('div');
      mount.id = 'demo';
      document.body.appendChild(mount);
    }
    if (mount.dataset.nbInit) return;
    mount.dataset.nbInit = '1';
    mount.classList.add('nb-demo');

    /* ---- static scaffolding ---- */
    var phone = h('div', 'nb-phone');
    var screen = h('div', 'nb-screen');
    var status = h('div', 'nb-status');
    status.appendChild(h('span', null, '9:41'));
    var sbgrp = h('span', 'nb-sbgrp');
    for (var i = 0; i < 3; i++) sbgrp.appendChild(h('span', 'nb-sb'));
    status.appendChild(sbgrp);
    var appbar = h('div', 'nb-appbar');
    appbar.appendChild(h('span', 'nb-burger'));
    appbar.appendChild(h('span', 'nb-brand', 'Nagbox'));
    appbar.appendChild(h('span', 'nb-avatar'));
    var sechead = h('div', 'nb-sechead');
    sechead.appendChild(h('span', null, 'Today'));
    var sweepPill = h('span', 'nb-sweeppill', 'Sweep');
    sechead.appendChild(sweepPill);
    var stream = h('div', 'nb-stream');
    var cap = h('div', 'nb-cap');
    cap.appendChild(h('span', 'nb-plus'));
    var capField = h('span', 'nb-capfield');
    capField.appendChild(h('span', 'nb-capph', 'Remind me…'));
    var capText = h('span', 'nb-captext');
    capField.appendChild(capText);
    capField.appendChild(h('span', 'nb-caret'));
    cap.appendChild(capField);
    var skip = h('div', 'nb-skip');
    skip.appendChild(h('span', 'nb-clock'));
    skip.appendChild(h('span', null, 'Saturday 9:00 AM'));
    var sunrise = h('div', 'nb-sunrise');
    var sunwrap = h('div', 'nb-sunwrap');
    sunwrap.appendChild(h('div', 'nb-sun'));
    sunrise.appendChild(sunwrap);
    sunrise.appendChild(h('div', 'nb-horizon'));
    sunrise.appendChild(h('div', 'nb-suntitle', 'All clear.'));
    sunrise.appendChild(h('div', 'nb-sunsub', 'Sweep earns you a sunrise.'));
    screen.appendChild(status);
    screen.appendChild(appbar);
    screen.appendChild(sechead);
    screen.appendChild(stream);
    screen.appendChild(cap);
    screen.appendChild(skip);
    screen.appendChild(sunrise);
    phone.appendChild(screen);
    mount.appendChild(phone);

    /* ---- timeline machinery ---- */
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function stop() {
      for (var t = 0; t < timers.length; t++) clearTimeout(timers[t]);
      timers = [];
    }
    function resetSurfaces() {
      stream.innerHTML = '';
      stream.classList.remove('nb-dim');
      cap.classList.remove('nb-typing');
      capText.textContent = '';
      skip.classList.remove('nb-on');
      sunrise.classList.remove('nb-on');
      sweepPill.classList.remove('nb-flash');
    }
    function seedNoise(popIn) {
      return NOISE.map(function (text, i) {
        var r = buildRow(text);
        if (popIn) {
          r.card.classList.add('nb-pop');
          r.card.style.animationDelay = (i * 80) + 'ms';
        }
        stream.appendChild(r.slot);
        return r;
      });
    }

    function run() {
      stop();
      resetSurfaces();
      var noise = seedNoise(true);
      var hero1, hero2;

      /* 1: capture. Typing into the capture bar, item lands on top. */
      at(650, function () { cap.classList.add('nb-typing'); });
      for (var c = 0; c < HERO.length; c++) {
        (function (n) {
          at(800 + n * 40, function () { capText.textContent = HERO.slice(0, n + 1); });
        })(c);
      }
      at(2150, function () {
        cap.classList.remove('nb-typing');
        capText.textContent = '';
        hero1 = buildRow(HERO);
        hero1.card.classList.add('nb-pop');
        stream.insertBefore(hero1.slot, stream.firstChild);
      });

      /* 2: swipe left into the orange Snooze reveal, then gone. */
      at(3450, function () { hero1.row.classList.add('nb-drag'); });
      at(4200, function () {
        hero1.row.classList.remove('nb-drag');
        hero1.row.classList.add('nb-flyL');
      });
      at(4650, function () { hero1.slot.classList.add('nb-gone'); });

      /* 3: time skip. */
      at(5350, function () {
        stream.classList.add('nb-dim');
        skip.classList.add('nb-on');
      });
      at(7000, function () {
        skip.classList.remove('nb-on');
        stream.classList.remove('nb-dim');
      });

      /* 4: resurface on top, pre-pinned, why-chip attached. */
      at(7500, function () {
        hero2 = buildRow(HERO, { pinned: true, chip: 'Snoozed until Sat' });
        hero2.card.classList.add('nb-glowp');
        stream.insertBefore(hero2.slot, stream.firstChild);
      });

      /* 5: sweep clears the noise; the pinned item survives. */
      at(9700, function () { sweepPill.classList.add('nb-flash'); });
      noise.forEach(function (r, i) {
        at(9900 + i * 150, function () { r.row.classList.add('nb-sweep'); });
        at(10380 + i * 150, function () {
          r.row.classList.add('nb-fade');
          r.slot.classList.add('nb-gone');
        });
      });
      at(11100, function () { sweepPill.classList.remove('nb-flash'); });
      at(11500, function () {
        hero2.card.classList.remove('nb-glowp'); /* glow long finished; avoid replaying it */
        hero2.card.classList.add('nb-nudge');
      });

      /* 6: the pinned item gets done, and the empty state is a reward. */
      at(12500, function () { hero2.dot.classList.add('nb-done'); });
      at(13100, function () { hero2.row.classList.add('nb-sweep'); });
      at(13600, function () { hero2.slot.classList.add('nb-gone'); });
      at(14100, function () { sunrise.classList.add('nb-on'); });
      at(17200, function () { sunrise.classList.remove('nb-on'); });

      /* loop */
      at(LOOP_MS, run);
    }

    function staticFrame() {
      stop();
      resetSurfaces();
      var hero = buildRow(HERO, { pinned: true, chip: 'Snoozed until Sat' });
      stream.appendChild(hero.slot);
      seedNoise(false);
    }

    /* ---- play/pause wiring ---- */
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var visible = true;
    var running = false;
    function sync() {
      if (reduced.matches) {
        running = false;
        staticFrame();
      } else if (visible && !document.hidden) {
        if (!running) { running = true; run(); }
      } else {
        running = false;
        stop();
      }
    }
    if ('IntersectionObserver' in window) {
      visible = false;
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(phone);
    }
    document.addEventListener('visibilitychange', sync);
    if (reduced.addEventListener) reduced.addEventListener('change', sync);
    else if (reduced.addListener) reduced.addListener(sync);
    sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
