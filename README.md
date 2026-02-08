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

Install
pnpm install
# or
npm install

Environment Variables

Create a .env.local file with your Gemini key(s).
(Confirm exact variable names in lib/api-key-rotation.)

GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
# or rotation:
GOOGLE_API_KEY_1=your_key_here
GOOGLE_API_KEY_2=your_key_here
GOOGLE_API_KEY_3=your_key_here

Run
pnpm dev


Open http://localhost:3000
