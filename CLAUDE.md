# CLAUDE.md — AI Assistant Guide

Concise guide for working in this codebase with Claude Code (or any AI assistant).
For a deeper handoff, see [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## Project

**Rutgers Dining AI** — an AI dining companion for Rutgers–New Brunswick students.
It pulls live dining hall menus, uses Google Gemini to recommend structured meal
"plates" matched to the user's goal, and lets users save, log (with portion
adjustment), and track daily/weekly nutrition. **All data is local (browser
localStorage) — there is no auth or database.**

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript (strict; build fails on type errors)
- Tailwind CSS · shadcn/ui on Radix primitives · next-themes (dark/light)
- Vercel AI SDK (`ai`, `@ai-sdk/google`) · Google Gemini · Zod (structured output)
- Rutgers Nutrislice JSON API (primary menu) + FoodPro scraper (fallback)
- Deployed on Vercel

## App routes

All pages live under the `app/(app)/` route group (shared shell/nav):

- `/` — Home: review goal → pick hall/meal → quick filters → AI recommendations
- `/saved` — Saved Plate Library (search/filter/sort, log-from-saved)
- `/log` — Calendar-based Daily Log + selected-day detail + Weekly Insights
- `/resources` — Visual hub of trusted nutrition/activity links
- `/settings` — Profile & preferences (the source of truth for goal/targets)

API routes (`app/api/`): `menu`, `recommend`, `nutrition` (all `runtime = "nodejs"`).

## Key features

Live menus · Gemini structured recommendations · **remaining-target** recs (uses
what you've logged today) · Saved Plate Library · daily logging with **portion
adjustment** + edit · calendar Daily Log · Weekly Insights · Today's Fuel tracker ·
Settings as source of truth · visual Resources page.

## Architecture (where things live)

- `lib/menu/get-menu.ts` — provider orchestration: **Nutrislice first, FoodPro fallback**
- `lib/scrape/{nutrislice,menu,nutrition}.ts` — the providers/scrapers (don't touch casually)
- `lib/dining-halls.ts` — single source of truth for halls (busch, livingston, atrium, neilson)
- `lib/ai/{gemini,prompts,plate-schema}.ts` — model helper, prompt builder, Zod schema
- `lib/api-key-rotation.ts` — round-robins `GOOGLE_GENERATIVE_AI_API_KEY[_2.._5]`
- `lib/nutrition/targets.ts` — Mifflin–St Jeor-style macro target estimate
- `lib/store.ts` — SSR-safe localStorage hooks: `usePrefs`, `useSavedPlates`, `useLoggedMeals`
- `lib/date.ts` — local-time date/calendar helpers (never UTC for day grouping)
- `lib/types.ts` — domain types (`SavedPlate`, `LoggedMeal`, `MacroTargets`, …)
- `components/{home,log,recommend,saved,resources,settings,layout,ui}/` — UI by area

**localStorage keys:** `ru-dining:prefs`, `ru-dining:saved-plates`, `ru-dining:logged-meals`.

## Important commands

```bash
npm install --legacy-peer-deps   # react-day-picker@8 vs React 19 peer conflict
npm run dev                      # http://localhost:3000
npm run build                    # production build (also type-checks)
npx tsc --noEmit                 # type-check only
```

> Note: `npm run lint` is defined but ESLint isn't installed/configured — it's a no-op/optional.

## Environment variables

- `GOOGLE_GENERATIVE_AI_API_KEY` — **required** (Gemini)
- `GOOGLE_GENERATIVE_AI_API_KEY_2 … _5` — optional, used in round-robin
- `GOOGLE_GENERATIVE_AI_MODEL` — optional; default **`gemini-2.5-flash-lite`**
  (chosen because it's consistently available on free-tier keys — see `lib/ai/gemini.ts`)

Copy `.env.example` → `.env.local` and add a key. **`.env.local` is gitignored — never commit it or print key values.**

## Coding rules

- Keep TypeScript and `npm run build` passing (no `ignoreBuildErrors`).
- localStorage only — no auth/database, no new packages unless truly necessary.
- **Saved Plates ≠ Logged Meals** — keep them separate concepts/stores.
- Two `useLoggedMeals()` instances on one page **don't sync** (storage event is
  cross-tab only). The page that mutates must **own** the hook and pass data down
  (Home → `TodaysFuelCard`; `/log` → `WeeklyInsights`/`SelectedDayPanel`).
- Date grouping uses **local** date keys (`lib/date.ts`), never UTC.
- `LoggedMeal.quantities` / `note` are optional — keep changes backward-compatible
  with older logs (missing `quantities` ⇒ all 1×).
- New logging/edit flows go through `MealLogDialog` → `addLoggedMeal`/`updateLoggedMeal`.

## What not to touch casually

- Gemini model selection / prompt logic (`lib/ai/*`) unless explicitly asked.
- Menu provider behavior (`lib/menu`, `lib/scrape`, `lib/dining-halls`).
- `.env.local` and anything that could log/expose a key.
- The localStorage key names or `LoggedMeal`/`SavedPlate` shapes (migration risk).

## Deployment workflow

GitHub → Vercel (auto-detected Next.js). Set `GOOGLE_GENERATIVE_AI_API_KEY` (and
optionally the model / extra keys) in Vercel env vars. If recommendations fail in
prod, check the Gemini quota/model access for the key first.

## Known gotchas

- `gemini-2.0-flash` has **0 free-tier quota** (429); `1.5-flash` is 404. Use the default lite model.
- localStorage pages (`/saved`, `/log`) gate render on a `mounted` flag to avoid SSR
  hydration mismatches — they briefly show a "Loading…" state.
- Summer/empty days: Nutrislice often has data when FoodPro returns nothing.
- The Gemini error URL contains `?key=` — never log the raw error/url (see `app/api/recommend/route.ts`).

## Roadmap / next suggested work

- Optional accounts + cloud sync (replace localStorage) — biggest unlock.
- Weekly nutrition trends/analytics beyond the current 7-day view.
- Stronger allergen-safety filtering; manual food entry.
- Screenshots in README/Resources; automated tests; lint setup.
