# Project Context & Handoff — Rutgers Dining AI

A detailed handoff document for picking this project back up later. For the quick
day-to-day reference, see [`CLAUDE.md`](../CLAUDE.md) at the repo root.

---

## Product overview

**Rutgers Dining AI** helps Rutgers–New Brunswick students decide what to eat from
the live dining hall menus. It combines real menu data, the user's saved goal and
preferences, and Google Gemini to generate structured, grounded meal
recommendations. Users can save plates, log what they actually ate (with portion
adjustment), and track daily and weekly nutrition — all stored locally in the
browser, no account required.

Positioning: a **daily-use nutrition companion**, not a medical tool. Nutrition
values are estimates; the UI says so and points users to Rutgers Dining for
authoritative allergen/menu info.

---

## Current deployed feature set

- **Live Rutgers menu data** — Busch, Livingston, Neilson, The Atrium.
- **Gemini structured recommendations** — 1–3 plates, Zod-validated, built only from real menu items.
- **Remaining-target recommendations** — once meals are logged today, the AI prioritizes the calories/protein left for the rest of the day.
- **Saved Plate Library** — search, filter chips, sort, and **log-from-saved**.
- **Daily meal logging** with **portion/quantity adjustment** before logging.
- **Edit logged meals** — change quantities, meal period, or note after the fact.
- **Calendar-based Daily Log** — month calendar + selected-day detail.
- **Weekly Insights** — 7-day habits (averages, target hits, streak, top hall/meal).
- **Today's Fuel** — live progress vs. daily targets on Home.
- **Settings as source of truth** — goal/profile/targets configured once.
- **Visual Resources page** — article-style cards linking to trusted sources.
- **Dark/light Rutgers-themed UI**, deployed on **Vercel**.

---

## Core user flow

**Recommend → Save → Log → Adjust portions → Review → Resources**

1. **Recommend** (`/`): user reviews their saved goal (from Settings), picks a dining
   hall + meal, optionally toggles quick filters, and generates AI plates. The
   request includes prefs, macro targets, and — if anything was logged today —
   `todayTotals` + `remainingTargets`.
2. **Save** (`/saved`): bookmark a plate to reuse later. Saved plates are a library
   with search/filter/sort.
3. **Log** (`/`, `/saved`, or `/log`): logging opens **`MealLogDialog`** to confirm
   what was actually eaten.
4. **Adjust portions**: in the dialog, set quantity per item (0–5, step 0.5; 0
   excludes it), choose the meal period, add an optional note. Adjusted totals
   preview live, then save to the daily log.
5. **Review** (`/log`): a month calendar with per-day status, a selected-day panel
   (with edit/remove/clear), and **Weekly Insights** for the last 7 days. Today's
   Fuel on Home mirrors today's totals.
6. **Resources** (`/resources`): trusted, static guidance — use for planning, not
   medical advice.

---

## Menu data architecture (Nutrislice first, FoodPro fallback)

`lib/menu/get-menu.ts` orchestrates providers in priority order and returns the
first that yields items, in a single normalized `MenuData` shape:

1. **Nutrislice** (`lib/scrape/nutrislice.ts`) — structured JSON API; cleaner data,
   often populated when FoodPro is empty; carries nutrition/allergen/dietary tags.
   Covers Busch, Livingston, Neilson.
2. **FoodPro** (`lib/scrape/menu.ts`) — the original HTML scraper; fallback and the
   source for halls Nutrislice doesn't serve (e.g. The Atrium).

`lib/dining-halls.ts` is the single source of truth for hall config (ids, FoodPro
location codes, meal periods). `POST /api/menu` takes `{ diningHall, date, mealPeriod }`.
**The app never invents menu items** — recommendations are grounded strictly in
returned items.

---

## Gemini recommendation architecture

- `POST /api/recommend` validates the body with Zod (hall, meal, `menuItems`, optional
  `userPrefs`, `macroTargets`, `filters`, `todayTotals`, `remainingTargets`,
  `loggedMealCountToday`).
- `lib/ai/prompts.ts` builds the prompt: grounds it in the real menu, the user's goal/
  diet, per-meal targets, and — when meals are logged today — **remaining targets as
  the primary context** ("best next meal", no shaming if over).
- `lib/ai/gemini.ts` selects the model (default **`gemini-2.5-flash-lite`**, override
  via `GOOGLE_GENERATIVE_AI_MODEL`) and binds a rotated key from
  `lib/api-key-rotation.ts`.
- `lib/ai/plate-schema.ts` defines the Zod schema; `generateObject` returns typed
  plates. The server attaches `id`/`hall`/`meal` (not trusted from the model).
- Errors are logged **without** the key or the Gemini URL (which contains `?key=`).

---

## LocalStorage architecture

SSR-safe hooks in `lib/store.ts` (hydrate in an effect, sync across tabs via the
`storage` event):

| Key | Hook | Holds |
| --- | --- | --- |
| `ru-dining:prefs` | `usePrefs` | goal, profile, diets, avoid, calorie target |
| `ru-dining:saved-plates` | `useSavedPlates` | bookmarked plates (`SavedPlate[]`) |
| `ru-dining:logged-meals` | `useLoggedMeals` | eaten meals (`LoggedMeal[]`) |

**Critical pattern:** two instances of the same hook on one page do **not** sync (the
`storage` event is cross-tab only). The component that mutates must own the hook and
pass data down — Home owns `useLoggedMeals` for `TodaysFuelCard`; `/log` owns it for
`SelectedDayPanel` and `WeeklyInsights`. Day grouping uses **local** date keys
(`lib/date.ts`), never UTC.

---

## Saved Plates vs Logged Meals (keep distinct)

- **Saved Plate** (`SavedPlate`) = a bookmark for later. Saving/removing one never
  touches logged meals.
- **Logged Meal** (`LoggedMeal`) = something actually eaten, counted toward daily/
  weekly nutrition. Logging from a saved plate does **not** remove the bookmark.

They use separate localStorage keys and separate hooks. Don't merge them.

---

## Portion adjustment behavior

`components/log/MealLogDialog.tsx` (`mode="create" | "edit"`) is the single entry
point for logging/editing:

- Per-item quantity controls: **0–5, step 0.5**; `0` excludes the item from totals.
- Adjusted item macro = per-unit nutrition × quantity; totals recompute live.
- Missing nutrition shows "nutrition unavailable" and is excluded (no crash).
- Meal period selector (Breakfast/Lunch/Dinner/Snack) + optional note.
- Confirm is disabled if all quantities are 0. Copy: *"Nutrition values are estimates
  based on available dining data."*

Data model: `LoggedMeal` stores **per-unit `items`** + an optional aligned
**`quantities[]`** + adjusted **`totals`** + optional **`note`**. Older logs lack
`quantities`/`note` and are treated as all-1× — **keep this backward-compatible**.
Persisted via `addLoggedMeal` (create) / `updateLoggedMeal(id, patch)` (edit) in
`lib/store.ts`.

---

## Settings as source of truth

`/settings` owns the full profile form (goal, age, height, weight, calorie target,
activity, diets, foods-to-avoid) → saved to `ru-dining:prefs`. **Home is read-only**:
it shows a compact `GoalSummary` (goal, targets, diet) with an "Edit in Settings"
link, and derives macro targets from saved prefs via `lib/nutrition/targets.ts`.
Home keeps only session-only quick filters. If prefs are unset, defaults apply and
recommendations are never blocked.

---

## Resources page strategy

`/resources` is static (no API). `components/resources/ResourceCard.tsx` renders
article-style cards with **CSS gradient thumbnails + lucide icon overlays** (no
external images → no licensing/hotlinking issues), category badges, source, type,
read time, a "Why it helps" line, and a new-tab "Open resource" button
(`target="_blank" rel="noopener noreferrer"`). Category tabs (All / Nutrition Basics /
Healthy Eating / Exercise / App Safety), a featured card, and an internal
"Using this app safely" disclaimer. **Trusted sources only** (USDA, HHS, Harvard,
CDC, eatright, Rutgers Dining, AHA, WHO) — no random blogs, no medical claims.

---

## Deployment details

- **Vercel**, auto-detected Next.js (no custom build config).
- Required env: `GOOGLE_GENERATIVE_AI_API_KEY`. Optional: `GOOGLE_GENERATIVE_AI_MODEL`,
  `GOOGLE_GENERATIVE_AI_API_KEY_2…_5`.
- Local install needs `--legacy-peer-deps` (react-day-picker@8 vs React 19).
- If prod recommendations fail: check Gemini quota/model access for the key
  (free-tier quota for some models is 0).

---

## Security notes (.env.local & Gemini keys)

- `.env.local` is **gitignored** (`.gitignore`: `.env`, `.env.local`, `.env*.local`).
  Never commit it; never paste real keys into code, docs, or logs.
- The Gemini request URL contains the API key as `?key=…`. The recommend route logs
  only safe fields (model, counts, error name/message) — **never** the raw error or
  its URL. Preserve this when editing error handling.
- No secrets belong in localStorage or in this repo.

---

## Manual test checklist

- Home loads; selecting hall + meal loads the menu; recommendations generate.
- With meals logged today, the CTA switches to "…rest of today" and recs use remaining targets.
- Save a plate; it appears in `/saved`; search/filter/sort work; log-from-saved works.
- Logging opens the portion dialog: 0.5× / 2× / set an item to 0 → totals update; note + meal period save.
- `/log`: calendar renders, selecting a day updates detail, edit a logged meal updates totals + Weekly Insights + Today's Fuel; remove/clear work.
- Removing a saved plate does **not** delete a logged meal (and vice versa).
- `/resources` loads; tabs filter; links open in a new tab; safety card present.
- `/settings` persists across reloads; defaults work when unset.
- Dark/light toggle works. Refresh preserves all localStorage data.
- `npx tsc --noEmit` and `npm run build` pass.

---

## Suggested next features

- **Accounts + cloud sync** (replace localStorage) — the biggest unlock; would also enable cross-device history.
- Weekly/monthly nutrition **trends & analytics** beyond the 7-day view.
- **Stronger allergen-safety** controls and manual food entry / search.
- More halls / data sources; offline support.
- README/Resources **screenshots**; **automated tests**; wire up **ESLint**.

---

## Suggested future commit workflow

- Work in small, single-purpose commits; keep the build green (`tsc` + `next build`) before committing.
- Branch off the default branch; don't commit `.env.local` or build artifacts.
- Prefix by intent: `feat(...)`, `refactor(...)`, `polish(...)`, `docs(...)`, `fix(...)`.
- For multi-part work, keep changes organized so they can split into focused commits.
- Verify `git status` shows only intended files and `.env.local` is ignored before pushing.
