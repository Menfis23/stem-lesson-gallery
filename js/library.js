/* =========================================================
   library.js — builds the Library page.
   1. Load the 60 lessons (js/lessons.js)
   2. Draw filter buttons for topic, age and theme
   3. Draw one scrolling row of cards per topic
   Filters are saved in the URL (?topic=towers&age=9-12) so a
   counselor can share or bookmark a filtered view.
   ========================================================= */

(async function () {
  const rowsEl = document.getElementById("rows");
  const countEl = document.getElementById("result-count");
  const emptyEl = document.getElementById("empty");
  const clearBtn = document.getElementById("clear-filters");

  let data;
  try {
    data = await LessonData.load();
  } catch (err) {
    rowsEl.innerHTML =
      '<p class="empty">Lessons could not load. If you opened this file by double-clicking it, ' +
      "run a local server instead (see README).</p>";
    console.error(err);
    return;
  }

  // ---- Filter state, read from the URL ----
  const params = new URLSearchParams(location.search);
  const state = {
    topic: params.get("topic") || "all",
    age: params.get("age") || "all",
    theme: params.get("theme") || "all"
  };

  const options = {
    topic: data.topics.map(t => ({ id: t.id, name: t.name })),
    age: data.ages.map(a => ({ id: a.id, name: a.id })),
    theme: data.themes.map(t => ({ id: t.id, name: t.name }))
  };

  // ---- Draw filter buttons ----
  document.querySelectorAll(".filter-group").forEach(group => {
    const key = group.dataset.filter;
    const wrap = group.querySelector(".filter-options");
    [{ id: "all", name: "All" }, ...options[key]].forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.textContent = opt.name;
      btn.dataset.value = opt.id;
      btn.addEventListener("click", () => {
        state[key] = opt.id;
        render();
      });
      wrap.appendChild(btn);
    });
  });

  clearBtn.addEventListener("click", () => {
    state.topic = state.age = state.theme = "all";
    render();
  });

  // ---- One card ----
  function cardHTML(l) {
    return `
      <a class="lesson-card" href="slideshow.html?id=${encodeURIComponent(l.id)}"
         data-theme="${l.theme}" aria-label="${l.title}, ${l.ageName}, ${l.themeName} theme">
        <div class="thumb">
          <span class="thumb-icon">${LessonData.icons[l.topic]}</span>
          <span class="thumb-age">${l.age}</span>
          <span class="thumb-theme">${l.themeName}</span>
          <span class="thumb-play" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </div>
        <div class="card-body">
          <h3>${l.title}</h3>
          <p class="card-sub">${l.missionTitle} &middot; ${l.minutes} min</p>
          <p class="card-person">Featuring ${l.person.name}</p>
        </div>
      </a>`;
  }

  // ---- Render everything for the current filters ----
  function render() {
    // Update buttons
    document.querySelectorAll(".filter-group").forEach(group => {
      const key = group.dataset.filter;
      group.querySelectorAll(".pill").forEach(b => {
        const on = b.dataset.value === state[key];
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
    });

    // Update URL without reloading
    const q = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v !== "all") q.set(k, v); });
    history.replaceState(null, "", q.toString() ? "?" + q : location.pathname);

    const matches = data.lessons.filter(l =>
      (state.topic === "all" || l.topic === state.topic) &&
      (state.age === "all" || l.age === state.age) &&
      (state.theme === "all" || l.theme === state.theme)
    );

    countEl.textContent = matches.length + (matches.length === 1 ? " lesson" : " lessons");
    clearBtn.hidden = Object.values(state).every(v => v === "all");
    emptyEl.hidden = matches.length > 0;

    rowsEl.innerHTML = data.topics.map(topic => {
      const list = matches.filter(l => l.topic === topic.id);
      if (!list.length) return "";
      return `
        <section class="row" aria-label="${topic.name}">
          <div class="row-head">
            <h2>${topic.name} <span>${list.length}</span></h2>
            <div class="row-arrows">
              <button type="button" class="arrow" data-dir="-1" aria-label="Scroll ${topic.name} left">
                <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
              </button>
              <button type="button" class="arrow" data-dir="1" aria-label="Scroll ${topic.name} right">
                <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
          <div class="row-track">${list.map(cardHTML).join("")}</div>
        </section>`;
    }).join("");

    wireRows();
  }

  // ---- Arrows + card tilt ----
  function wireRows() {
    rowsEl.querySelectorAll(".row").forEach(row => {
      const track = row.querySelector(".row-track");
      row.querySelectorAll(".arrow").forEach(btn => {
        btn.addEventListener("click", () => {
          track.scrollBy({ left: Number(btn.dataset.dir) * track.clientWidth * 0.85, behavior: "smooth" });
        });
      });
    });

    // Tilt toward the mouse. Skipped on touch screens and for reduced motion.
    const canTilt = matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;
    if (!canTilt) return;
    rowsEl.querySelectorAll(".lesson-card").forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(700px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  render();
})();
