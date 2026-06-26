/* ============================================================
   Ruiz & Davies — retro desktop runtime
   ============================================================ */
(function () {
  "use strict";

  var boot = document.getElementById("boot");
  var fill = document.getElementById("bootFill");
  var pctEl = document.getElementById("bootPct");
  var statusEl = document.getElementById("bootStatus");
  var desktop = document.getElementById("desktop");
  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".boot-thumb"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- shuffle thumbnails reveal order ---------- */
  var order = thumbs.slice();
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  var revealAt = order.map(function (_, idx) {
    return 15 + Math.round((idx + 1) * (75 / (order.length + 1)));
  });
  var revealed = 0;
  var loadingBase = statusEl ? statusEl.textContent : "Loading";

  function nameOf(el) {
    var n = el.querySelector(".sp-name");
    return n ? n.textContent : "";
  }

  /* ---------- boot progress ---------- */
  var pct = 0;
  function tick() {
    pct += Math.random() * 7 + 3;
    if (pct > 100) pct = 100;
    if (fill) fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = Math.floor(pct);

    while (revealed < order.length && pct >= revealAt[revealed]) {
      order[revealed].classList.add("show");
      if (statusEl) statusEl.textContent = loadingBase.replace(/[.…]+$/, "") + ": " + nameOf(order[revealed]);
      revealed++;
    }

    if (pct < 100) {
      setTimeout(tick, 90 + Math.random() * 170);
    } else {
      order.forEach(function (t) { t.classList.add("show"); });
      if (statusEl) statusEl.textContent = "OK";
      setTimeout(finishBoot, 450);
    }
  }

  function finishBoot() {
    document.body.classList.remove("booting");
    if (desktop) desktop.hidden = false;
    if (boot) {
      boot.classList.add("hide");
      setTimeout(function () { if (boot) boot.style.display = "none"; }, 500);
    }
    openWindow("win-readme");
  }

  /* ---------- window manager ---------- */
  var z = 20;
  var cascade = 0;

  function allTitleBars() {
    return document.querySelectorAll(".window .title-bar");
  }

  function focusWindow(win) {
    z++;
    win.style.zIndex = z;
    allTitleBars().forEach(function (tb) { tb.classList.remove("title-bar-active"); });
    var bar = win.querySelector(".title-bar");
    if (bar) bar.classList.add("title-bar-active");
  }

  function openWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    if (win.hidden) {
      win.hidden = false;
      if (coarse) {
        // mobile: always reopen centered (CSS handles it when not dragged)
        win.classList.remove("dragged");
        win.style.left = "";
        win.style.top = "";
      } else if (!win.dataset.placed) {
        var off = 24 + (cascade % 6) * 24;
        win.style.left = off + "px";
        win.style.top = (20 + (cascade % 6) * 22) + "px";
        cascade++;
        win.dataset.placed = "1";
      }
    }
    initApp(id);
    focusWindow(win);
  }

  function closeWindow(win) { if (win) win.hidden = true; }

  /* lazy-init the easter-egg apps on first open */
  var inited = {};
  function initApp(id) {
    if (inited[id]) return;
    if (id === "win-calc") { inited[id] = true; initCalc(); }
    else if (id === "win-mines") { inited[id] = true; initMines(); }
  }

  /* open from desktop icons */
  document.querySelectorAll(".icon").forEach(function (icon) {
    var id = icon.getAttribute("data-win");
    function open() { openWindow(id); deselect(); }
    if (coarse) {
      icon.addEventListener("click", open);
    } else {
      icon.addEventListener("dblclick", open);
      icon.addEventListener("click", function () { select(icon); });
    }
    icon.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  function select(icon) {
    deselect();
    icon.classList.add("selected");
  }
  function deselect() {
    document.querySelectorAll(".icon.selected").forEach(function (i) { i.classList.remove("selected"); });
  }

  /* open windows from the File Manager list */
  document.querySelectorAll(".file-item").forEach(function (item) {
    var id = item.getAttribute("data-win");
    function open(e) {
      e.stopPropagation(); // don't let the document handler refocus the file window
      openWindow(id);
    }
    function pick() {
      item.parentElement.querySelectorAll(".file-item.selected").forEach(function (x) { x.classList.remove("selected"); });
      item.classList.add("selected");
    }
    if (coarse) {
      item.addEventListener("click", open);
    } else {
      item.addEventListener("dblclick", open);
      item.addEventListener("click", pick);
    }
  });

  /* clicks inside windows: close + open-other buttons */
  document.addEventListener("click", function (e) {
    var closeBtn = e.target.closest("[data-close]");
    if (closeBtn) { closeWindow(closeBtn.closest(".window")); return; }
    var opener = e.target.closest("[data-win]");
    if (opener && opener.classList.contains("btn95")) { openWindow(opener.getAttribute("data-win")); return; }
    var win = e.target.closest(".window");
    if (win) focusWindow(win);
  });

  /* dragging by title bar */
  document.querySelectorAll(".window .title-bar[data-drag]").forEach(function (bar) {
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".tb-btn")) return;
      var win = bar.closest(".window");
      focusWindow(win);
      var area = win.parentElement.getBoundingClientRect();
      var rect = win.getBoundingClientRect();
      var dx = e.clientX - rect.left;
      var dy = e.clientY - rect.top;
      // Freeze the current rendered position as inline coords BEFORE removing
      // the centering transform, so the window doesn't jump (esp. on mobile).
      win.style.left = (rect.left - area.left) + "px";
      win.style.top = (rect.top - area.top) + "px";
      win.classList.add("dragged");
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}

      function move(ev) {
        var left = ev.clientX - area.left - dx;
        var top = ev.clientY - area.top - dy;
        left = Math.max(-rect.width + 60, Math.min(left, area.width - 60));
        top = Math.max(0, Math.min(top, area.height - 24));
        win.style.left = left + "px";
        win.style.top = top + "px";
      }
      function up(ev) {
        try { bar.releasePointerCapture(e.pointerId); } catch (err) {}
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
      }
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
    });
  });

  /* tap hint on touch devices */
  if (coarse) {
    var hint = document.querySelector("[data-openhint]");
    if (hint && hint.dataset.tap) hint.textContent = hint.dataset.tap;
  }

  /* ============================================================
     Calculator
     ============================================================ */
  function initCalc() {
    var win = document.getElementById("win-calc");
    var disp = win.querySelector("[data-calc-display]");
    var acc = null, op = null, cur = "0", fresh = false;

    function show() {
      var s = cur;
      if (s.length > 14) s = parseFloat(cur).toPrecision(10).replace(/\.?0+$/, "");
      disp.textContent = s;
    }
    function clearAll() { acc = null; op = null; cur = "0"; fresh = false; show(); }
    function digit(d) {
      if (fresh) { cur = (d === "." ? "0." : d); fresh = false; }
      else if (d === ".") { if (cur.indexOf(".") < 0) cur += "."; }
      else cur = (cur === "0" ? d : cur + d);
      show();
    }
    function apply() {
      var a = parseFloat(acc), b = parseFloat(cur), r = b;
      if (op === "+") r = a + b;
      else if (op === "-") r = a - b;
      else if (op === "*") r = a * b;
      else if (op === "/") r = (b === 0 ? NaN : a / b);
      r = Math.round((r + Number.EPSILON) * 1e10) / 1e10;
      return isFinite(r) ? String(r) : "Error";
    }
    function operator(o) {
      if (op && !fresh) { cur = apply(); acc = cur; } else { acc = cur; }
      op = o; fresh = true; show();
    }
    function equals() {
      if (op) { cur = apply(); acc = null; op = null; fresh = true; show(); }
    }
    win.querySelector(".calc-keys").addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]"); if (!b) return;
      var k = b.getAttribute("data-k");
      if (/^[0-9.]$/.test(k)) digit(k);
      else if (k === "+" || k === "-" || k === "*" || k === "/") operator(k);
      else if (k === "=") equals();
      else if (k === "clear") clearAll();
      else if (k === "sign") { if (cur !== "0") { cur = String(parseFloat(cur) * -1); show(); } }
      else if (k === "pct") { cur = String(parseFloat(cur) / 100); fresh = true; show(); }
    });
    show();
  }

  /* ============================================================
     Minesweeper (original implementation, beginner 9x9 / 10 mines)
     ============================================================ */
  function initMines() {
    var win = document.getElementById("win-mines");
    var grid = win.querySelector("[data-mines-grid]");
    var leftEl = win.querySelector("[data-mines-left]");
    var timerEl = win.querySelector("[data-mines-timer]");
    var faceEl = win.querySelector("[data-mines-face]");
    var flagBtn = win.querySelector("[data-mines-flag]");
    var flagStateEl = win.querySelector("[data-flag-state]");
    var W = 9, H = 9, MINES = 10, N = W * H;
    var state, cells, started, over, flags, safeCount, timer, time, flagMode = false, suppress = false;

    function pad(n) { n = Math.max(0, Math.min(999, n)); return ("00" + n).slice(-3); }
    function neighbors(i) {
      var x = i % W, y = (i / W) | 0, r = [];
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) r.push(ny * W + nx);
      }
      return r;
    }
    function reset() {
      clearInterval(timer); time = 0; timerEl.textContent = pad(0);
      started = false; over = false; flags = 0; safeCount = 0;
      leftEl.textContent = pad(MINES); faceEl.textContent = "🙂";
      state = []; cells = []; grid.innerHTML = "";
      grid.style.gridTemplateColumns = "repeat(" + W + ", 1fr)";
      for (var i = 0; i < N; i++) {
        state.push({ mine: false, adj: 0, open: false, flag: false });
        var c = document.createElement("button");
        c.className = "cell"; c.dataset.i = i;
        cells.push(c); grid.appendChild(c);
      }
    }
    function plant(safe) {
      var placed = 0;
      while (placed < MINES) {
        var idx = (Math.random() * N) | 0;
        if (state[idx].mine || idx === safe) continue;
        state[idx].mine = true; placed++;
      }
      for (var i = 0; i < N; i++) {
        if (state[i].mine) continue;
        var n = 0; neighbors(i).forEach(function (j) { if (state[j].mine) n++; });
        state[i].adj = n;
      }
    }
    function startTimer() {
      timer = setInterval(function () { time++; timerEl.textContent = pad(time); if (time >= 999) clearInterval(timer); }, 1000);
    }
    function reveal(i) {
      var s = state[i];
      if (s.open || s.flag || over) return;
      if (!started) { plant(i); started = true; startTimer(); }
      s.open = true;
      var c = cells[i]; c.classList.add("open");
      if (s.mine) { c.classList.add("mine"); c.textContent = "💣"; boom(); return; }
      safeCount++;
      if (s.adj > 0) { c.textContent = s.adj; c.dataset.n = s.adj; }
      else neighbors(i).forEach(reveal);
      checkWin();
    }
    function boom() {
      over = true; clearInterval(timer); faceEl.textContent = "😵";
      state.forEach(function (s, i) {
        if (s.mine && !s.open) { cells[i].classList.add("open", "mine"); cells[i].textContent = "💣"; }
        if (s.flag && !s.mine) { cells[i].textContent = "✖"; }
      });
    }
    function checkWin() {
      if (safeCount === N - MINES) {
        over = true; clearInterval(timer); faceEl.textContent = "😎";
        state.forEach(function (s, i) { if (s.mine) { cells[i].classList.add("flag"); cells[i].textContent = "🚩"; } });
        leftEl.textContent = pad(0);
      }
    }
    function toggleFlag(i) {
      var s = state[i]; if (s.open || over) return;
      s.flag = !s.flag; cells[i].textContent = s.flag ? "🚩" : "";
      flags += s.flag ? 1 : -1; leftEl.textContent = pad(MINES - flags);
    }

    grid.addEventListener("click", function (e) {
      var c = e.target.closest(".cell"); if (!c) return;
      if (suppress) { suppress = false; return; }
      var i = +c.dataset.i;
      if (flagMode) toggleFlag(i); else reveal(i);
    });
    grid.addEventListener("contextmenu", function (e) {
      var c = e.target.closest(".cell"); if (!c) return;
      e.preventDefault(); toggleFlag(+c.dataset.i);
    });
    var lp;
    grid.addEventListener("pointerdown", function (e) {
      var c = e.target.closest(".cell"); if (!c) return;
      suppress = false; var i = +c.dataset.i;
      lp = setTimeout(function () { toggleFlag(i); suppress = true; }, 450);
    });
    function clearLp() { clearTimeout(lp); }
    grid.addEventListener("pointerup", clearLp);
    grid.addEventListener("pointerleave", clearLp);
    grid.addEventListener("pointercancel", clearLp);

    faceEl.addEventListener("click", reset);
    flagBtn.addEventListener("click", function () {
      flagMode = !flagMode;
      flagBtn.setAttribute("aria-pressed", String(flagMode));
      flagBtn.classList.toggle("on", flagMode);
      flagStateEl.textContent = flagMode ? "ON" : "OFF";
    });
    reset();
  }

  /* ---------- live clock ---------- */
  var clock = document.getElementById("clock");
  function setClock() {
    if (!clock) return;
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    clock.textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  setClock();
  setInterval(setClock, 15000);

  /* ---------- go ---------- */
  if (reduce) {
    if (fill) fill.style.width = "100%";
    if (pctEl) pctEl.textContent = "100";
    finishBoot();
  } else {
    setTimeout(tick, 350);
  }
})();
