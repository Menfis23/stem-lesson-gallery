# STEM Lesson Gallery

Game-like, themed STEM lessons for summer camp groups ages 5 to 21.
Built for the CMU STEM Ambassador summer camp program.

Pick an age group, a topic, and what the group is into. The site builds a
full-screen lesson in three acts:

1. **Hook**: a short story and a big visual
2. **Mission**: the build or experiment
3. **Showdown**: a dramatic test, then a quick talk-back

> Independent student project. Not an official Carnegie Mellon University website.

## Why it exists

- Current camp lessons are designed for young kids and don't work for older students.
- The same lessons repeat every year.
- Lessons feel like school. Camp should feel fun, visual and game-like.
- Campers bring different interests. Lessons should connect with each group.

## What's in the demo

| Part | Details |
|---|---|
| Age groups | 5–8, 9–12, 13–17, 18+ (older groups get budgets, predictions, pitches) |
| Topics | Bridges, towers, science experiments (coding/tech later) |
| Theme packs | Sports, music, gaming, neighborhood (Pittsburgh / Hill District), heroes & anime |
| Library size | 12 missions x 5 themes = 60 lessons |
| Featured people | Each lesson features a scientist or engineer, rotating through people from many backgrounds |

Themes follow **interests**, never race.

## Pages

| File | Page | Status |
|---|---|---|
| `index.html` | Homepage: what the site is and how to use it | Done |
| `library.html` | Rows of lesson cards with topic / age / theme filters | Done |
| `slideshow.html` | Full-screen Hook / Mission / Showdown presentation | Done |
| `generator.html` | Form that builds a fresh lesson, remembers what was shown | Done |

## Project structure

```
.
├── index.html        # homepage
├── library.html      # lesson library with filters
├── slideshow.html    # full-screen lesson presentation
├── generator.html    # "Build a lesson" form
├── style.css         # shared styles (colors, fonts, layout) for every page
├── data/
│   └── lessons.json  # lesson PIECES: missions, theme skins, featured people
├── js/
│   ├── lessons.js    # mixes the pieces into 60 lessons (shared by all pages)
│   ├── library.js    # filters and card rows for library.html
│   ├── slideshow.js  # builds and runs the slide deck for one lesson
│   └── generator.js  # picks a fresh lesson and avoids repeats
├── assets/
│   └── logo.jpg      # approved demo logo
└── README.md
```

### How lessons are stored

`data/lessons.json` holds pieces, not finished lessons:

- **missions**: the 12 base lessons (3 topics x 4 age groups), each with hook, mission, showdown, materials and talk-back questions
- **skins**: for each mission, a themed title and hook per theme
- **people**: featured scientists and engineers, grouped by topic

`js/lessons.js` combines them: mission + skin + a rotating featured person = one lesson.
To add a theme, add it to `themes` and add a skin for each mission. That's 12 new lessons.

Filters are saved in the address bar (for example `library.html?topic=towers&age=9-12`),
so you can bookmark or share a filtered view.

## Building a lesson (Generator)

Pick an age group, topic (or "Surprise me"), what the group is into (or
"Mixed group"), session length (30–90 min) and group size. The generator:

1. Finds every lesson that fits, and skips ones already used in this browser.
2. Picks one at random and a featured person who wasn't featured recently.
3. Splits the session into Hook / Mission / Showdown / Talk-back
   (about 10% / 60% / 20% / 10%) and sizes the teams by age
   (3 per team for ages 5–8, 4 for older groups).
4. Links to the slideshow with those settings, for example
   `slideshow.html?id=tw-1317--neighborhood&person=eiffel&min=60&size=18`.

When every lesson that fits has been used, it says so and starts that set over.
"Clear history" at the bottom of the page brings everything back.

**What's saved in the browser (`localStorage`):**

| Key | Holds |
|---|---|
| `slg-shown` | IDs of lessons already used |
| `slg-people` | The last 4 featured people |
| `slg-form` | Your last form choices |

This lives only in one browser on one computer. A different laptop starts fresh.
That's what counselor accounts (on the roadmap) would fix.

## Presenting a lesson

Open any card in the Library, or go to `slideshow.html?id=<mission>--<theme>`
(for example `slideshow.html?id=br-912--gaming`).

Each deck has 8 slides: cover, Hook story, featured scientist or engineer,
Mission (with a build timer), kit and level-up rule for the age group,
Showdown (with a 3-2-1 countdown), talk-back questions, and an end slide.

| Key | Does |
|---|---|
| Right arrow, Space, click | Next slide |
| Left arrow, click the left edge | Previous slide |
| Home / End | First / last slide |
| F | Full screen |

On phones and tablets, swipe left or right. The slide number stays in the
address bar (`#4`), so reloading keeps your place.

Every lesson you open is remembered in your browser (`localStorage`, key
`slg-shown`) so the Generator can avoid showing it again.

## Run it on your computer

No install needed. It's plain HTML, CSS and JavaScript.

- **Quickest:** double-click `index.html` to open it in your browser.
- **Better (needed once we load `lessons.json`):** browsers block pages opened
  from disk from loading data files, so run a tiny local server from this folder:

  ```bash
  python -m http.server 8000
  ```

  Then open http://localhost:8000.

## Put it online with GitHub Pages

1. Create a new **public** repository on GitHub, for example `stem-lesson-gallery`.
2. Push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "First version of STEM Lesson Gallery homepage"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/stem-lesson-gallery.git
   git push -u origin main
   ```

3. On GitHub, open the repo's **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*,
   pick **main** and **/ (root)**, then **Save**.
5. Wait a minute or two. The site appears at
   `https://YOUR-USERNAME.github.io/stem-lesson-gallery/`.

Every time you push to `main`, the site updates on its own.

## Design notes

- **Colors:** CMU red `#C41230` as the main color, soft cream `#FBF4E2`
  background, sunny yellow `#F7B731` accent (matches the bulb in the logo),
  sky blue `#3E8EDE` used sparingly. All colors are variables at the top of
  `style.css`.
- **Fonts:** [Fredoka](https://fonts.google.com/specimen/Fredoka) for headings
  (rounded, close to the logo wordmark) and
  [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible)
  for body text (made to be easy to read for everyone).
- **Logo:** the approved demo logo only. Do **not** add the official CMU logo
  unless supervisors give permission. It's a trademark and this site is public.

## Adding real camp photos

The homepage polaroids currently show line drawings. To use a real photo,
save it to `assets/photos/` and, in `index.html`, replace a polaroid's
`<div class="photo ...">…</div>` with:

```html
<img class="photo-img" src="assets/photos/bridge-test.jpg" alt="Campers testing a paper bridge">
```

Only use photos where you have permission from the camp, and from parents
for any camper whose face is visible.

## If funded: roadmap

- Counselor accounts and sign-up questions (Supabase)
- Real AI lesson generation (Netlify Functions)
- Lesson history page
- Easier / harder buttons
- Lesson ratings
