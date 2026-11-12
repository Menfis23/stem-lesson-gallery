/* =========================================================
   generator.js — builds a fresh lesson from the library pieces.

   How "fresh" works:
   - Every lesson shown is saved in this browser (localStorage
     key "slg-shown"). The generator skips those.
   - Featured people are tracked too ("slg-people"), so the
     same scientist doesn't show up twice in a row.
   - When every matching lesson has been used, the cycle
     starts over for that combination and the page says so.
   localStorage lives only in this browser on this computer.
   Accounts (if funded) would make history follow a counselor.
   ========================================================= */

(async function () {
  const form = document.getElementById("gen-form");
  const resultEl = document.getElementById("gen-result");
  const noteEl = document.getElementById("gen-note");
  const sizeInput = document.getElementById("f-size");

  let data;
  try {
    data = await LessonData.load();
  } catch (err) {
    resultEl.innerHTML = '<p class="empty">Lessons could not load. Run a local server (see README).</p>';
    return;
  }

  // ---- Tiny localStorage helpers (wrapped: private windows can block storage) ----
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }
  };

  // ---- Build the segmented choices ----
  const saved = store.get("slg-form", {});
  const groups = {
    age:   { el: "f-age",   opts: data.ages.map(a => [a.id, a.id]), def: "9-12" },
    topic: { el: "f-topic", opts: [["any", "Surprise me"], ...data.topics.map(t => [t.id, t.name.replace(" Experiments", "")])], def: "any" },
    theme: { el: "f-theme", opts: [["any", "Mixed group"], ...data.themes.map(t => [t.id, t.name])], def: "any" },
    min:   { el: "f-min",   opts: [["30", "30 min"], ["45", "45 min"], ["60", "60 min"], ["90", "90 min"]], def: "45" }
  };

  Object.entries(groups).forEach(([name, g]) => {
    const wrap = document.getElementById(g.el);
    const chosen = saved[name] || g.def;
    wrap.innerHTML = g.opts.map(([value, label]) => `
      <label class="seg-opt">
        <input type="radio" name="${name}" value="${value}" ${value === chosen ? "checked" : ""}>
        <span>${label}</span>
      </label>`).join("");
  });
  if (saved.size) sizeInput.value = saved.size;

  // Group size +/- buttons
  form.querySelectorAll("[data-step]").forEach(btn => btn.addEventListener("click", () => {
    const v = (Number(sizeInput.value) || 0) + Number(btn.dataset.step);
    sizeInput.value = Math.min(60, Math.max(2, v));
  }));

  // ---- Generate ----
  form.addEventListener("submit", e => {
    e.preventDefault();
    generate();
  });

  function readForm() {
    const f = new FormData(form);
    const choice = {
      age: f.get("age"),
      topic: f.get("topic"),
      theme: f.get("theme"),
      min: f.get("min"),
      size: Math.min(60, Math.max(2, Number(f.get("size")) || 16))
    };
    store.set("slg-form", choice);
    return choice;
  }

  const pick = list => list[Math.floor(Math.random() * list.length)];

  function generate() {
    const c = readForm();
    noteEl.textContent = "";

    const matches = data.lessons.filter(l =>
      l.age === c.age &&
      (c.topic === "any" || l.topic === c.topic) &&
      (c.theme === "any" || l.theme === c.theme)
    );

    let shown = store.get("slg-shown", []);
    let fresh = matches.filter(l => !shown.includes(l.id));

    if (!fresh.length) {
      // Everything that fits has been used: start this combination over.
      shown = shown.filter(id => !matches.some(l => l.id === id));
      fresh = matches;
      noteEl.textContent = `You've used all ${matches.length} lessons that fit. Starting the cycle over.`;
    }

    const lesson = pick(fresh);

    // Featured person: someone from this topic who wasn't featured recently.
    const recentPeople = store.get("slg-people", []);
    const pool = data.people.filter(p => p.topic === lesson.topic);
    const person = pick(pool.filter(p => !recentPeople.includes(p.id))) || pick(pool);

    shown.push(lesson.id);
    store.set("slg-shown", shown);
    store.set("slg-people", [person.id, ...recentPeople.filter(id => id !== person.id)].slice(0, 4));

    render(lesson, person, c, matches.length - fresh.length + 1, matches.length);
    renderHistory();
  }

  // ---- Show the result ----
  function render(lesson, person, c, usedCount, total) {
    const p = LessonData.plan(lesson, c.min, c.size);
    const href = `slideshow.html?id=${encodeURIComponent(lesson.id)}&person=${person.id}&min=${c.min}&size=${c.size}`;

    resultEl.innerHTML = `
      <article class="result-card" data-theme="${lesson.theme}">
        <div class="result-top">
          <span class="thumb-icon">${LessonData.icons[lesson.topic]}</span>
          <div>
            <p class="result-tags">${lesson.topicName} &middot; ${lesson.ageName} &middot; ${lesson.themeName}</p>
            <h2>${lesson.title}</h2>
          </div>
        </div>

        <div class="result-body">
          <dl class="acts-list">
            <div><dt>Hook</dt><dd>${lesson.hook}</dd></div>
            <div><dt>Mission</dt><dd>${lesson.mission}</dd></div>
            <div><dt>Showdown</dt><dd>${lesson.showdown}</dd></div>
          </dl>

          <div class="plan">
            <p class="plan-label">Your ${p.total}-minute plan</p>
            <div class="plan-bar">
              ${p.split.map(s => `<span style="flex:${s.min}" class="seg-${s.act.toLowerCase().replace("-", "")}"><b>${s.act}</b>${s.min}m</span>`).join("")}
            </div>
            <p class="plan-teams">${p.size} campers &rarr; <strong>${p.teams} team${p.teams === 1 ? "" : "s"}</strong> of about ${p.perTeam}</p>
          </div>

          <p class="result-person"><strong>Featuring ${person.name}</strong>, ${person.role.toLowerCase()}. ${person.fact}</p>

          <div class="result-actions">
            <a class="btn btn-primary" href="${href}">Present this lesson</a>
            <button type="button" class="btn btn-ghost" id="again">Try another</button>
          </div>
          <p class="result-count">Lesson ${usedCount} of ${total} that fit this group.</p>
        </div>
      </article>`;

    resultEl.querySelector("#again").addEventListener("click", generate);
    resultEl.querySelector(".result-card").animate(
      [{ opacity: 0, transform: "translateY(12px) rotate(-1deg)" }, { opacity: 1, transform: "none" }],
      { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }

  // ---- History list ----
  function renderHistory() {
    const shown = store.get("slg-shown", []);
    const box = document.getElementById("history");
    const list = document.getElementById("history-list");
    const items = shown.map(id => data.lessons.find(l => l.id === id)).filter(Boolean).reverse();
    box.hidden = !items.length;
    list.innerHTML = items.map(l =>
      `<li><a href="slideshow.html?id=${encodeURIComponent(l.id)}">${l.title}</a><span>${l.age} &middot; ${l.themeName}</span></li>`
    ).join("");
  }

  document.getElementById("clear-history").addEventListener("click", () => {
    store.set("slg-shown", []);
    store.set("slg-people", []);
    renderHistory();
    noteEl.textContent = "History cleared. Every lesson is back in the mix.";
  });

  renderHistory();
})();
