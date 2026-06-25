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
    focusWindow(win);
  }

  function closeWindow(win) { if (win) win.hidden = true; }

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
