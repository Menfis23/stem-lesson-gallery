/* =========================================================
   slideshow.js — turns one lesson into a full-screen deck.

   URL: slideshow.html?id=br-912--gaming   (mission--theme)
   Controls: arrow keys / space / click to move, F for full
   screen, Home / End to jump. The slide number is kept in the
   URL hash (#3) so a reload doesn't send you back to slide 1.
   ========================================================= */

(async function () {
  const stage = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const titleEl = document.getElementById("show-title");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  // ---- Load the lesson ----
  let data;
  try {
    data = await LessonData.load();
  } catch (err) {
    stage.innerHTML = '<div class="slide is-active"><div class="slide-inner"><h1>Lesson could not load.</h1><p>Run a local server (see README), then try again.</p></div></div>';
    return;
  }

  // Optional extras from the Generator: &person=khan&min=60&size=18
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const base = data.lessons.find(l => l.id === id) || data.lessons[0];
  const chosenPerson = data.people.find(p => p.id === params.get("person"));
  const lesson = { ...base, person: chosenPerson || base.person };
  const sessionPlan = LessonData.plan(lesson, params.get("min"), params.get("size"));

  document.title = lesson.title + " · STEM Lesson Gallery";
  titleEl.textContent = lesson.title;
  document.body.dataset.theme = lesson.theme;

  // Remember this lesson was shown (the Generator uses this to avoid repeats).
  try {
    const key = "slg-shown";
    const shown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!shown.includes(lesson.id)) {
      shown.push(lesson.id);
      localStorage.setItem(key, JSON.stringify(shown));
    }
  } catch (e) { /* private browsing: fine to skip */ }

  // ---- Helpers ----
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const icon = LessonData.icons[lesson.topic];

  // Build time comes from the shared session plan (js/lessons.js).
  const buildMin = sessionPlan.build;
  const teamLine = sessionPlan.teams
    ? `<p class="teams-line">${sessionPlan.size} campers &rarr; <strong>${sessionPlan.teams} team${sessionPlan.teams === 1 ? "" : "s"}</strong> of about ${sessionPlan.perTeam}</p>`
    : "";

  // Older groups get an extra rule card (budgets, predictions, pitches).
  const levelUp = {
    "5-8": "Every bridge, tower and eruption that works gets a cheer.",
    "9-12": "Before you test, write down your guess. Closest guess gets bragging rights.",
    "13-17": "Track what you use and what it costs. Strong is good. Strong and cheap wins.",
    "18+": "Write a one-line spec, predict your result, and be ready to pitch it in one minute."
  }[lesson.age];

  // ---- The slides ----
  // act = which part of the lesson this slide belongs to (drives the progress bar)
  const slides = [
    {
      act: "Start", cls: "s-cover",
      html: `
        <div class="cover-icon">${icon}</div>
        <p class="kicker">${esc(lesson.topicName)} &middot; ${esc(lesson.ageName)} &middot; ${esc(lesson.themeName)}</p>
        <h1 class="cover-title">${esc(lesson.title)}</h1>
        <p class="cover-meta">${sessionPlan.total} minutes &middot; Hook, Mission, Showdown</p>
        <p class="hint">Press <kbd>&rarr;</kbd> or click to start</p>`
    },
    {
      act: "Hook", cls: "s-hook",
      html: `
        <p class="act-label">Act 1 &middot; The Hook</p>
        <p class="big-text">${esc(lesson.hook)}</p>
        <div class="hook-icon">${icon}</div>`
    },
    {
      act: "Hook", cls: "s-person",
      html: `
        <p class="act-label">Meet the ${esc(lesson.person.role.toLowerCase())}</p>
        <div class="person">
          <div class="person-badge" aria-hidden="true">${esc(initials(lesson.person.name))}</div>
          <div>
            <h2>${esc(lesson.person.name)}</h2>
            <p class="person-role">${esc(lesson.person.role)}</p>
            <p class="person-fact">${esc(lesson.person.fact)}</p>
          </div>
        </div>
        <p class="question">Today, you get to do what ${esc(firstName(lesson.person.name))} did: solve a real problem by building.</p>`
    },
    {
      act: "Mission", cls: "s-mission",
      html: `
        <p class="act-label">Act 2 &middot; Your Mission</p>
        <p class="big-text">${esc(lesson.mission)}</p>
        <div class="timer" data-seconds="${buildMin * 60}">
          <span class="timer-face">${pad(buildMin)}:00</span>
          <div class="timer-btns">
            <button type="button" class="tbtn" data-act="toggle">Start build timer</button>
            <button type="button" class="tbtn tbtn-ghost" data-act="reset">Reset</button>
          </div>
        </div>`
    },
    {
      act: "Mission", cls: "s-kit",
      html: `
        <p class="act-label">Your kit</p>
        ${teamLine}
        <ul class="kit">${lesson.materials.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
        <div class="rule">
          <span class="rule-tag">Level up &middot; ${esc(lesson.age)}</span>
          <p>${esc(levelUp)}</p>
        </div>`
    },
    {
      act: "Showdown", cls: "s-showdown",
      html: `
        <p class="act-label">Act 3 &middot; The Showdown</p>
        <p class="big-text">${esc(lesson.showdown)}</p>
        <button type="button" class="go-btn" data-act="countdown">3 &middot; 2 &middot; 1 &middot; Go</button>`
    },
    {
      act: "Showdown", cls: "s-talk",
      html: `
        <p class="act-label">Talk-back</p>
        <ol class="talk">${lesson.talkback.map(q => `<li>${esc(q)}</li>`).join("")}</ol>`
    },
    {
      act: "End", cls: "s-end",
      html: `
        <p class="kicker">Mission complete</p>
        <h1 class="cover-title">Nice work, engineers.</h1>
        <div class="end-actions">
          <a class="btn btn-yellow" href="library.html?topic=${lesson.topic}">More ${esc(lesson.topicName.toLowerCase())}</a>
          <button type="button" class="btn btn-ghost-light" data-act="restart">Run it again</button>
        </div>`
    }
  ];

  function initials(name) { return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join(""); }
  function firstName(name) { return name.split(" ")[0]; }
  function pad(n) { return String(n).padStart(2, "0"); }

  // ---- Draw slides + progress ----
  stage.innerHTML = slides.map((s, i) =>
    `<section class="slide ${s.cls}" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
       <div class="slide-inner">${s.html}</div>
     </section>`).join("");

  const acts = [...new Set(slides.map(s => s.act))];
  progressEl.innerHTML = acts.map(act => {
    const idx = slides.map((s, i) => s.act === act ? i : -1).filter(i => i >= 0);
    return `<div class="prog-act"><span class="prog-label">${act}</span>
      <div class="prog-dots">${idx.map(i => `<button type="button" class="dot" data-go="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("")}</div></div>`;
  }).join("");

  const slideEls = [...stage.querySelectorAll(".slide")];
  const dotEls = [...progressEl.querySelectorAll(".dot")];

  // ---- Navigation ----
  let current = clamp(parseInt(location.hash.slice(1), 10) - 1 || 0);

  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }

  function go(n) {
    current = clamp(n);
    slideEls.forEach((el, i) => {
      el.classList.toggle("is-active", i === current);
      el.classList.toggle("is-before", i < current);
      el.classList.toggle("is-after", i > current);
      el.inert = i !== current;   // hidden slides can't be tabbed into
    });
    dotEls.forEach((d, i) => {
      d.classList.toggle("is-done", i < current);
      d.classList.toggle("is-current", i === current);
    });
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
    history.replaceState(null, "", "#" + (current + 1));
  }

  prevBtn.addEventListener("click", () => go(current - 1));
  nextBtn.addEventListener("click", () => go(current + 1));
  progressEl.addEventListener("click", e => {
    const d = e.target.closest("[data-go]");
    if (d) go(Number(d.dataset.go));
  });

  // Clicking empty slide space moves forward (left fifth goes back).
  stage.addEventListener("click", e => {
    if (e.target.closest("button, a")) return;
    const x = e.clientX / window.innerWidth;
    go(x < 0.2 ? current - 1 : current + 1);
  });

  document.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("button, a") && (e.key === " " || e.key === "Enter")) return;
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": e.preventDefault(); go(current + 1); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); go(current - 1); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1); break;
      case "f": case "F": toggleFullscreen(); break;
    }
  });

  // Swipe on phones and tablets
  let touchX = null;
  stage.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // ---- Full screen ----
  document.getElementById("fullscreen").addEventListener("click", toggleFullscreen);
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  // ---- Build timer (Mission slide) ----
  const timerEl = stage.querySelector(".timer");
  const face = timerEl.querySelector(".timer-face");
  const toggleBtn = timerEl.querySelector('[data-act="toggle"]');
  let left = Number(timerEl.dataset.seconds);
  let tick = null;

  function showTime() {
    face.textContent = pad(Math.floor(left / 60)) + ":" + pad(left % 60);
    timerEl.classList.toggle("is-low", left <= 60 && left > 0);
    timerEl.classList.toggle("is-done", left === 0);
  }
  function stopTimer() { clearInterval(tick); tick = null; }

  timerEl.addEventListener("click", e => {
    const act = e.target.dataset.act;
    if (act === "toggle") {
      if (tick) { stopTimer(); toggleBtn.textContent = "Resume"; return; }
      if (left === 0) left = Number(timerEl.dataset.seconds);
      toggleBtn.textContent = "Pause";
      tick = setInterval(() => {
        left = Math.max(0, left - 1);
        showTime();
        if (left === 0) { stopTimer(); toggleBtn.textContent = "Time's up! Restart"; }
      }, 1000);
    }
    if (act === "reset") {
      stopTimer();
      left = Number(timerEl.dataset.seconds);
      toggleBtn.textContent = "Start build timer";
      showTime();
    }
  });

  // ---- 3-2-1 countdown (Showdown slide) and restart ----
  const overlay = document.getElementById("countdown");
  const num = document.getElementById("countdown-num");

  stage.addEventListener("click", e => {
    const act = e.target.dataset && e.target.dataset.act;
    if (act === "countdown") runCountdown();
    if (act === "restart") go(0);
  });

  function runCountdown() {
    const steps = ["3", "2", "1", "GO!"];
    overlay.hidden = false;
    steps.forEach((s, i) => setTimeout(() => {
      num.textContent = s;
      num.classList.remove("pop");
      void num.offsetWidth;          // restart the CSS animation
      num.classList.add("pop");
    }, i * 900));
    setTimeout(() => { overlay.hidden = true; }, steps.length * 900 + 300);
  }

  go(current);
})();
