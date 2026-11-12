/* =========================================================
   lessons.js — shared by Library, Slideshow and Generator.

   data/lessons.json stores PIECES, not finished lessons:
     missions (12)  x  theme skins (5)  +  a featured person
   This file mixes those pieces into 60 complete lessons.
   Why: fix a typo in one mission and all 5 themed versions
   get the fix. Add a 6th theme and you get 12 new lessons.
   ========================================================= */

const LessonData = (() => {
  let cache = null;

  async function load() {
    if (cache) return cache;
    const res = await fetch("data/lessons.json");
    if (!res.ok) throw new Error("Could not load data/lessons.json (" + res.status + ")");
    const data = await res.json();
    cache = { ...data, lessons: buildLessons(data) };
    return cache;
  }

  function buildLessons(data) {
    const lessons = [];
    data.topics.forEach(topic => {
      const missions = data.missions.filter(m => m.topic === topic.id);
      const pool = data.people.filter(p => p.topic === topic.id);

      missions.forEach((mission, mi) => {
        const age = data.ages.find(a => a.id === mission.age);
        data.themes.forEach((theme, ti) => {
          const skin = (data.skins[mission.id] || {})[theme.id] || {};
          // Rotate featured people so neighbors in the grid show different faces.
          const person = pool[(mi * data.themes.length + ti) % pool.length];
          lessons.push({
            id: mission.id + "--" + theme.id,
            missionId: mission.id,
            topic: topic.id,
            topicName: topic.name,
            age: mission.age,
            ageName: age.name,
            minutes: age.minutes,
            theme: theme.id,
            themeName: theme.name,
            title: skin.title || mission.title,
            missionTitle: mission.title,
            hook: skin.hook || mission.hook,
            baseHook: mission.hook,
            mission: mission.mission,
            showdown: mission.showdown,
            materials: mission.materials,
            talkback: mission.talkback,
            person
          });
        });
      });
    });
    return lessons;
  }

  // Line-drawing icons per topic, reused on cards and slides.
  const icons = {
    bridges: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M6 60h108M18 60V38M102 60V38M18 38c14-22 30-22 42 0 12-22 28-22 42 0M30 60V46M44 60V42M60 60V38M76 60V42M90 60V46"/></svg>',
    towers: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M40 72h40M46 72L60 10l14 62M50 54h20M54 36h12M60 10v-4"/></svg>',
    science: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M50 8h20M54 8v20L36 66c-2 5 1 8 6 8h36c5 0 8-3 6-8L66 28V8M44 52h32"/><circle cx="56" cy="62" r="3"/><circle cx="66" cy="58" r="2"/></svg>'
  };

  /* ---- Session plan ----
     Splits the session into the three acts and sizes the teams.
     Used by both the Generator (to preview) and the Slideshow
     (to set the build timer), so the two always agree. */
  const teamSizes = { "5-8": 3, "9-12": 4, "13-17": 4, "18+": 4 };

  function plan(lesson, minutes, groupSize) {
    const total = Number(minutes) || lesson.minutes;
    const hook = Math.max(3, Math.round(total * 0.1));
    const talk = Math.max(3, Math.round(total * 0.1));
    let showdown = Math.max(5, Math.round(total * 0.2));
    let build = total - hook - talk - showdown;

    // Some missions name their own build time ("18 minutes"). Keep it if it fits.
    const named = lesson.mission.match(/(\d+)\s*minutes/);
    if (named && Number(named[1]) <= build) {
      showdown += build - Number(named[1]);   // spare time goes to the Showdown
      build = Number(named[1]);
    }

    const size = Number(groupSize) || 0;
    const teamSize = teamSizes[lesson.age];
    const teams = size ? Math.max(1, Math.round(size / teamSize)) : 0;

    return {
      total, build, size, teams,
      perTeam: teams ? Math.ceil(size / teams) : 0,
      split: [
        { act: "Hook", min: hook },
        { act: "Mission", min: build },
        { act: "Showdown", min: showdown },
        { act: "Talk-back", min: talk }
      ]
    };
  }

  return { load, icons, plan };
})();
