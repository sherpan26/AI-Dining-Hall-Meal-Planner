# Rutgers Dining AI

**Live demo:** https://rutgers-dining.vercel.app

An AI-assisted meal planning and nutrition helper for Rutgers University students.

## Features
- **AI Meal Analysis (Gemini):** Estimates calories/macros, returns a health score (1–10), and suggests improvements
- **Menu Viewer:** Browse dining hall menus with nutritional information
- **Nutrition Calculator:** Estimate BMR/TDEE and macro targets
- **Meal Planning:** Build meals aligned with nutrition goals
- **Local Persistence:** Saves meal plans/history in browser storage (no account required)

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Vercel AI SDK (`ai`, `@ai-sdk/google`)
- Google Gemini
- Zod (schema validation)

## Getting Started

### Clone
```bash
git clone https://github.com/sherpan26/AI-Dining-Hall-Meal-Planner.git
cd AI-Dining-Hall-Meal-Planner
```

### Install
```bash
pnpm install
# or
npm install --legacy-peer-deps
```

> **Note:** With npm, use `--legacy-peer-deps`. `react-day-picker@8` currently
> declares peer support for React 16/17/18, while this app runs on React 19, so a
> plain `npm install` fails on the peer-dependency conflict.

### Environment Variables

Copy `.env.example` to `.env.local` and add your Gemini key(s):

```bash
cp .env.example .env.local
```

Only the first key is required. The rest are optional and, if set, are used in a
simple round-robin to help avoid per-key rate limits (see `lib/api-key-rotation.ts`).

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Optional
GOOGLE_GENERATIVE_AI_API_KEY_2=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY_3=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY_4=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY_5=your_key_here
```

Get a key at https://aistudio.google.com/apikey

### Run
```bash
pnpm dev
```

Open http://localhost:3000

## Disclaimer

Unofficial student-built tool — **not affiliated with Rutgers University or Rutgers
Dining Services**. Calorie and macro figures are **estimates for general planning
only and are not medical or dietary advice**. The calorie/macro estimator
(`lib/nutrition/targets.ts`) uses a deliberately simplified, sex-neutral
Mifflin–St Jeor–style calculation; treat its output as a rough guide, not a
prescription.

## Known cleanup / TODO

- **Strict build checks are intentionally suppressed** in `next.config.mjs`
  (`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are `true`).
- The remaining TypeScript errors are confined to the **legacy** components and
  routes (the original tabbed app, still reachable at `/legacy`). The new AI
  Dining Concierge code (`app/(app)`, `lib/`, `components/{home,recommend,settings,layout}`)
  type-checks cleanly.
- **Do not re-enable** `ignoreBuildErrors` / `ignoreDuringBuilds` until `/legacy`
  and the old components/unused API routes are removed (or fixed). Re-enabling
  before then will fail the build on pre-existing legacy errors.
