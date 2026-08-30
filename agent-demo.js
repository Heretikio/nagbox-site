/* Nagbox agent demo. A compact, self-playing MCP exchange: an agent calls
   nagbox_capture and nagbox_next_nag, and Nagbox answers. Vanilla JS, no
   network. Honest to the real tool names and their text output. Mounts into
   #agent-demo. Pauses offscreen; prefers-reduced-motion shows a static frame. */
(function () {
  'use strict';

  var LOOP_HOLD = 4200;

  /* Each turn is a real tool call or a real Nagbox tool result. The result
     text mirrors what mcp/src/tools.ts actually returns. */
  var TURNS = [
    { role: 'agent', tool: 'nagbox_capture', lines: [
      '{',
      '  "title": "Take the trash bins down",',
      '  "type": "reminder"',
      '}'
    ] },
    { role: 'nagbox', lines: [
      'Captured item #48.',
      '#48 · Take the trash bins down',
      'type=reminder  state=inbox  priority=normal',
      'workspace_id=1  pinned=true',
      'when=2026-09-05T14:30:00Z'
    ] },
    { role: 'agent', tool: 'nagbox_next_nag', lines: ['{}'] },
    { role: 'nagbox', lines: [
      'Nag #52 · kind=question · topic=coffee',
      'Do you take your coffee black?',
      'To respond: nagbox_answer_nag id=52 answer=… (answer "yes" or "no").'
    ] }
  ];

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function buildMsg(turn) {
    var msg = h('div', 'ad-msg ' + (turn.role === 'agent' ? 'ad-call' : 'ad-result'));
    var mhead = h('div', 'ad-mhead');
    if (turn.role === 'agent') {
      mhead.appendChild(h('span', 'ad-role', 'agent'));
      mhead.appendChild(h('span', 'ad-arrow', '→'));
      mhead.appendChild(h('code', 'ad-tool', turn.tool));
    } else {
      mhead.appendChild(h('span', 'ad-role ad-role-nb', 'nagbox'));
    }
    msg.appendChild(mhead);
    msg.appendChild(h('pre', 'ad-pre', turn.lines.join('\n')));
    return msg;
  }

  function init() {
    var mount = document.getElementById('agent-demo');
    if (!mount || mount.dataset.adInit) return;
    mount.dataset.adInit = '1';

    var panel = h('div', 'ad-console');
    var chead = h('div', 'ad-head');
    var dots = h('span', 'ad-dots');
    for (var d = 0; d < 3; d++) dots.appendChild(h('span', 'ad-hdot'));
    chead.appendChild(dots);
    chead.appendChild(h('span', 'ad-title', 'agent session · nagbox mcp'));
    panel.appendChild(chead);
    var body = h('div', 'ad-body');
    panel.appendChild(body);
    mount.appendChild(panel);

    var msgs = TURNS.map(function (t) {
      var el = buildMsg(t);
      body.appendChild(el);
      return { el: el, role: t.role };
    });

    var timers = [];
    function stop() {
      for (var t = 0; t < timers.length; t++) clearTimeout(timers[t]);
      timers = [];
    }
    function hideAll() {
      msgs.forEach(function (m) { m.el.classList.remove('ad-in'); });
    }
    function showAll() {
      msgs.forEach(function (m) { m.el.classList.add('ad-in'); });
    }

    function play() {
      stop();
      hideAll();
      var i = 0;
      function step() {
        if (i >= msgs.length) {
          timers.push(setTimeout(play, LOOP_HOLD));
          return;
        }
        var m = msgs[i];
        m.el.classList.add('ad-in');
        i++;
        timers.push(setTimeout(step, m.role === 'agent' ? 1350 : 1750));
      }
      step();
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var visible = true;
    var running = false;
    function sync() {
      if (reduced.matches) {
        running = false;
        stop();
        showAll();
      } else if (visible && !document.hidden) {
        if (!running) { running = true; play(); }
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
      }, { threshold: 0.25 }).observe(panel);
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
