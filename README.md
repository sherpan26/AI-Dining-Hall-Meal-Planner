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
