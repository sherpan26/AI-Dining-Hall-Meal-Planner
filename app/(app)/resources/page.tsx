"use client"

import { useState } from "react"
import {
  Apple,
  BookOpen,
  Utensils,
  Salad,
  Building2,
  HeartPulse,
  Activity,
  Dumbbell,
  Globe,
  ShieldCheck,
  Sparkles,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ResourceCard from "@/components/resources/ResourceCard"

type ExternalCategory = "Nutrition Basics" | "Healthy Eating" | "Exercise"
type Category = ExternalCategory | "App Safety"
type Tab = Category | "All"

const CATEGORY_GRADIENT: Record<ExternalCategory, string> = {
  "Nutrition Basics": "from-primary to-rose-800",
  "Healthy Eating": "from-emerald-500 to-teal-700",
  Exercise: "from-sky-500 to-indigo-700",
}

interface ResourceDef {
  title: string
  source: string
  category: ExternalCategory
  type: string
  href: string
  description: string
  why: string
  readTime?: string
  icon: React.ComponentType<{ className?: string }>
  featured?: boolean
}

const RESOURCES: ResourceDef[] = [
  {
    title: "USDA MyPlate",
    source: "USDA",
    category: "Nutrition Basics",
    type: "Official resource",
    href: "https://www.myplate.gov/",
    description: "Build a balanced plate with food groups, portions, and simple daily goals.",
    why: "Turns “eat balanced” into a plate you can copy at any dining hall.",
    readTime: "4 min",
    icon: Utensils,
    featured: true,
  },
  {
    title: "Dietary Guidelines for Americans",
    source: "USDA & HHS",
    category: "Nutrition Basics",
    type: "Official guide",
    href: "https://www.dietaryguidelines.gov/",
    description: "The federal, evidence-based guidance behind healthy eating patterns.",
    why: "The science behind balanced eating, straight from the source.",
    readTime: "8 min",
    icon: BookOpen,
  },
  {
    title: "Harvard — Healthy Eating Plate",
    source: "Harvard T.H. Chan",
    category: "Nutrition Basics",
    type: "Guide",
    href: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
    description: "A research-based visual guide to building better, balanced meals.",
    why: "A clearer, modern upgrade to the classic food pyramid.",
    readTime: "5 min",
    icon: Apple,
  },
  {
    title: "CDC — Nutrition",
    source: "CDC",
    category: "Healthy Eating",
    type: "Official resource",
    href: "https://www.cdc.gov/nutrition/",
    description: "Practical nutrition basics and healthier choices for any budget.",
    why: "Realistic, budget-friendly tips you can use day to day.",
    readTime: "5 min",
    icon: HeartPulse,
  },
  {
    title: "Academy of Nutrition and Dietetics",
    source: "eatright.org",
    category: "Healthy Eating",
    type: "Article hub",
    href: "https://www.eatright.org/",
    description: "Food and nutrition guidance written and reviewed by dietitians.",
    why: "Advice you can trust — from registered dietitian nutritionists.",
    readTime: "Varies",
    icon: Salad,
  },
  {
    title: "Rutgers Dining Services",
    source: "Rutgers Dining",
    category: "Healthy Eating",
    type: "Official resource",
    href: "https://food.rutgers.edu/",
    description: "Official campus menus, hours, and nutrition/allergen information.",
    why: "The authoritative source for allergens and what’s actually served.",
    readTime: "Reference",
    icon: Building2,
  },
  {
    title: "CDC — Physical Activity Basics",
    source: "CDC",
    category: "Exercise",
    type: "Official resource",
    href: "https://www.cdc.gov/physicalactivity/",
    description: "How much movement adults need, and easy ways to get started.",
    why: "Clear weekly targets without the gym intimidation.",
    readTime: "4 min",
    icon: Activity,
  },
  {
    title: "American Heart Association — Activity",
    source: "AHA",
    category: "Exercise",
    type: "Guide",
    href: "https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults",
    description: "Recommended weekly aerobic and muscle-strengthening activity.",
    why: "Simple cardio + strength targets for a healthier heart.",
    readTime: "6 min",
    icon: Dumbbell,
  },
  {
    title: "WHO — Physical Activity",
    source: "WHO",
    category: "Exercise",
    type: "Official guide",
    href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    description: "Global guidance on physical activity for health at every age.",
    why: "Trusted, age-by-age movement recommendations.",
    readTime: "7 min",
    icon: Globe,
  },
]

const TABS: { id: Tab; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Nutrition Basics", label: "Nutrition Basics" },
  { id: "Healthy Eating", label: "Healthy Eating" },
  { id: "Exercise", label: "Exercise" },
  { id: "App Safety", label: "App Safety" },
]

const HOW_TO_USE = [
  "Use MyPlate for balanced-plate basics.",
  "Use Rutgers Dining for official allergen & menu info.",
  "Use CDC, AHA & WHO for activity guidelines.",
  "Use this app for planning — not medical advice.",
]

const SAFETY_POINTS = [
  "Use recommendations as planning help — a starting point, not a prescription.",
  "Verify allergens and ingredients directly with Rutgers Dining Services.",
  "Calorie and macro estimates are approximate and may vary from actual servings.",
  "This app does not provide medical or dietary advice.",
]

function SafetySection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Using this app safely</h2>
      </div>
      <div className="rounded-xl border bg-muted/40 p-5">
        <ul className="grid gap-2 sm:grid-cols-2">
          {SAFETY_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Independent, student-built project — not affiliated with, endorsed by, or maintained by Rutgers University or
          Rutgers Dining Services.
        </p>
      </div>
    </section>
  )
}

export default function ResourcesPage() {
  const [active, setActive] = useState<Tab>("All")

  const featured = RESOURCES.find((r) => r.featured)
  const showFeatured = active === "All" && !!featured
  const showSafety = active === "All" || active === "App Safety"
  const showExternals = active !== "App Safety"

  const list = RESOURCES.filter((r) => active === "All" || r.category === active)
  const gridResources = showFeatured ? list.filter((r) => r !== featured) : list

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-[#9b0026] to-zinc-900 p-6 text-white shadow-sm sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Trusted guides
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Resources</h1>
        <p className="mt-1 max-w-xl text-pretty text-white/80">
          Trusted guides for balanced eating, nutrition basics, and healthy habits — curated from official sources.
        </p>
      </section>

      {/* How to use */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">How to use these</h2>
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {HOW_TO_USE.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              aria-pressed={isActive}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Featured */}
      {showFeatured && featured && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Featured</p>
          <ResourceCard {...featured} gradient={CATEGORY_GRADIENT[featured.category]} featured />
        </section>
      )}

      {/* Grid */}
      {showExternals && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridResources.map((r) => (
            <ResourceCard key={r.href} {...r} gradient={CATEGORY_GRADIENT[r.category]} />
          ))}
        </div>
      )}

      {/* Safety */}
      {showSafety && <SafetySection />}
    </div>
  )
}
