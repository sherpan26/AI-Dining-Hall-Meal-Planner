# Rutgers Dining AI

> AI-powered Rutgers dining assistant for meal recommendations, macro targets, and daily meal logging.

**Live demo:** https://rutgers-dining.vercel.app

Rutgers Dining AI helps Rutgers–New Brunswick students decide what to eat from the
live dining hall menus. It pulls real menu data from Rutgers' Nutrislice and FoodPro
sources, combines it with your goals and dietary preferences, and uses Google Gemini
to generate structured, grounded meal recommendations. You can save plates you like,
log the meals you actually ate, and track your daily calories, protein, carbs, and
fat against personalized macro targets — all stored locally in your browser, no
account required.

## Screenshots

> These are placeholders. Drop real PNGs at the paths below to populate them — the
> `public/screenshots/` directory exists (kept by `.gitkeep`) and is ready for them.

| Home dashboard | AI recommendations |
| --- | --- |
| ![Home Dashboard](./public/screenshots/home-dashboard.png) | ![AI Recommendations](./public/screenshots/recommendations.png) |

| Daily Log | Settings |
| --- | --- |
| ![Daily Log](./public/screenshots/daily-log.png) | ![Settings](./public/screenshots/settings.png) |

## Features

- **Live Rutgers dining menu data** — real menus for Busch, Livingston, Neilson, and The Atrium
- **Nutrislice provider with FoodPro fallback** — structured JSON first, scraper as backup
- **AI plate recommendations** — structured Gemini output validated with Zod
- **Goal-based macro targets** — calorie/protein/carb/fat goals from your profile and goal
- **Dietary preferences and quick filters** — high-protein, lower-calorie, vegetarian, gluten-free, comfort
- **Remaining-target recommendations** — once you've logged meals today, the AI suggests the best *next* meal for the calories/protein you have left
- **Saved plate library** — search, filter, sort, and re-log your bookmarked plates anytime
- **Meal logging** — record what you actually ate
- **Today's Fuel progress tracker** — live progress bars vs. your daily targets
- **Calendar-based Daily Log** — a month calendar with per-day detail, plus **Weekly Insights** (7-day habits from your logged meals)
- **Resources** — trusted guides for nutrition basics, healthy eating, and activity
- **LocalStorage persistence** — everything stays in your browser, no account
- **Light/dark mode** — system-aware theme toggle
- **Rutgers-themed UI** — scarlet-accented, responsive dashboard

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) on [Radix UI](https://www.radix-ui.com/) primitives
- [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/google`)
- [Google Gemini API](https://ai.google.dev/)
- [Zod](https://zod.dev/) for structured-output schema validation
- Rutgers [Nutrislice](https://rutgers.api.nutrislice.com/) JSON API (primary menu source)
- Rutgers FoodPro fallback scraping
- Browser LocalStorage for persistence

## Architecture

The data flow from a menu request to a logged meal:

1. **`/api/menu`** receives a dining hall, date, and meal period.
2. The **Nutrislice provider** is tried first — it returns clean, structured JSON
   (and often has data when FoodPro does not).
3. The **FoodPro fallback** scraper runs if Nutrislice is unavailable or empty, and
   covers halls Nutrislice doesn't serve (e.g. The Atrium).
4. Menu items are **normalized** into the app's shared `MenuItem` shape
   (`lib/types.ts`), carrying any available nutrition, allergen, and dietary tags.
5. **`/api/recommend`** sends the grounded menu items plus the user's preferences and
   estimated macro targets to **Gemini** via the Vercel AI SDK's `generateObject`.
6. Gemini returns **structured plate recommendations**, validated against a Zod
   schema (`lib/ai/plate-schema.ts`).
7. The user can **save** a plate (bookmark) or **log** it (ate it) — both persisted to
   LocalStorage, kept as separate concepts.
8. **Today's Fuel** and the **`/log`** page read the logged-meal data from LocalStorage
   to calculate daily progress against targets.

Key directories:

```
app/(app)/        # Home, /saved, /log, /settings pages (App Router route group)
app/api/          # menu, recommend, nutrition route handlers
lib/menu/         # provider orchestration (Nutrislice → FoodPro)
lib/scrape/       # Nutrislice + FoodPro scrapers and nutrition lookup
lib/ai/           # Gemini helper, prompts, Zod plate schema
lib/nutrition/    # macro target estimation
lib/store.ts      # SSR-safe LocalStorage hooks (prefs, saved plates, logged meals)
components/       # UI (recommend, log, home, layout, shadcn/ui)
```

## Data Sources

- **Nutrislice** is the primary, structured menu source for **Busch**, **Livingston**,
  and **Neilson**.
- **FoodPro** is kept as a fallback and covers halls not available on Nutrislice
  (such as **The Atrium**).
- Menu availability depends on Rutgers Dining actually posting data for a given hall,
  date, and meal — some days or halls may be empty.
- **The app never invents menu items.** Recommendations are grounded strictly in the
  items returned by these sources; if no menu is available, no recommendations are
  generated.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ Yes | Your Google Gemini API key. |
| `GOOGLE_GENERATIVE_AI_API_KEY_2` … `_5` | Optional | Extra keys; used in a simple round-robin to spread load and avoid per-key rate limits. |
| `GOOGLE_GENERATIVE_AI_MODEL` | Optional | Override the Gemini model. Defaults to `gemini-2.5-flash-lite`. |

Only the first key is required. Get one at <https://aistudio.google.com/apikey>.

Example `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
GOOGLE_GENERATIVE_AI_MODEL=gemini-2.5-flash-lite
```

> **Default model:** `gemini-2.5-flash-lite` — chosen because it's consistently
> available on free-tier keys. See `lib/ai/gemini.ts` for the rationale.

## Local Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # then add your Gemini key
npm run dev
```

> **Why `--legacy-peer-deps`?** `react-day-picker@8` declares peer support for React
> 16/17/18, while this app runs on React 19, so a plain `npm install` fails on the
> peer-dependency conflict. (`pnpm install` also works.)

The app runs at **http://localhost:3000**.

Other useful commands:

```bash
npm run build      # production build (also runs TypeScript type-checking)
npx tsc --noEmit   # type-check only
```

## Deploy to Vercel

1. Push the repo to GitHub and **import it into [Vercel](https://vercel.com/new)**.
2. Add the environment variable **`GOOGLE_GENERATIVE_AI_API_KEY`** in
   *Project Settings → Environment Variables*.
3. Optionally set **`GOOGLE_GENERATIVE_AI_MODEL`** (and the extra `_2`…`_5` keys).
4. **Deploy.** Vercel auto-detects Next.js — no extra build configuration needed.
5. If recommendations fail in production, check your **Gemini quota and model access**
   for the key — free-tier quota for some models is `0`, which is why the default is
   `gemini-2.5-flash-lite`.

## Manual Test Checklist

- [ ] Home page loads
- [ ] Selecting a hall and meal loads the menu
- [ ] Recommendations generate
- [ ] Saving a plate works
- [ ] Logging a meal works
- [ ] Today's Fuel updates after logging
- [ ] `/log` page shows logged meals (today + previous days)
- [ ] Settings (profile/preferences) persist across reloads
- [ ] Dark/light theme toggle works
- [ ] `npm run build` passes

## Limitations

- No authentication or database yet — all data persists **locally in the browser only**
  and does not sync across devices.
- Menu quality depends on Rutgers / Nutrislice / FoodPro availability; some halls or
  dates may have no data.
- Nutrition and macro figures are **approximate estimates**, not exact values.
- Not affiliated with Rutgers University or Rutgers Dining Services.

## Disclaimer

This is an independent, student-built project and is **not affiliated with, endorsed
by, or maintained by Rutgers University or Rutgers Dining Services**. Nutrition
estimates are for general planning only and are **not medical or dietary advice**.
Users with allergies or dietary restrictions should verify information directly with
Rutgers Dining Services.

## Future Improvements

- User accounts and cloud sync
- Weekly nutrition analytics and trends
- Stronger allergy-safety controls
- More dining halls and data sources
- Mobile-first UI refinements
- Deployment monitoring and observability
- Automated tests (unit + integration)
