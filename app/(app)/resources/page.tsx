import {
  Apple,
  BookOpen,
  Utensils,
  Salad,
  Leaf,
  Building2,
  HeartPulse,
  Activity,
  Dumbbell,
  Globe,
  ShieldCheck,
} from "lucide-react"
import ResourceCard from "@/components/resources/ResourceCard"

interface Resource {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface Section {
  heading: string
  icon: React.ComponentType<{ className?: string }>
  resources: Resource[]
}

const SECTIONS: Section[] = [
  {
    heading: "Nutrition Basics",
    icon: Salad,
    resources: [
      {
        title: "USDA MyPlate",
        description: "Build a balanced plate using USDA's MyPlate — food groups, portions, and simple daily goals.",
        href: "https://www.myplate.gov/",
        icon: Utensils,
      },
      {
        title: "Dietary Guidelines for Americans",
        description: "The federal, evidence-based Dietary Guidelines for healthy eating patterns across life stages.",
        href: "https://www.dietaryguidelines.gov/",
        icon: BookOpen,
      },
      {
        title: "Harvard Nutrition Source — Healthy Eating Plate",
        description: "Harvard's research-based Healthy Eating Plate: a clear visual guide to building better meals.",
        href: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
        icon: Apple,
      },
    ],
  },
  {
    heading: "Healthy Eating Habits",
    icon: Leaf,
    resources: [
      {
        title: "CDC — Nutrition",
        description: "CDC's practical nutrition basics: healthier choices, portions, and tips for any budget.",
        href: "https://www.cdc.gov/nutrition/",
        icon: HeartPulse,
      },
      {
        title: "Academy of Nutrition and Dietetics",
        description: "Food and nutrition guidance from registered dietitian nutritionists (EatRight.org).",
        href: "https://www.eatright.org/",
        icon: BookOpen,
      },
      {
        title: "Rutgers Dining Services",
        description: "Official Rutgers Dining: dining hall menus, hours, and nutrition/allergen information.",
        href: "https://food.rutgers.edu/",
        icon: Building2,
      },
    ],
  },
  {
    heading: "Exercise & Activity",
    icon: Activity,
    resources: [
      {
        title: "CDC — Physical Activity Basics",
        description: "How much movement adults actually need each week, and easy ways to get started.",
        href: "https://www.cdc.gov/physicalactivity/",
        icon: Activity,
      },
      {
        title: "American Heart Association — Activity Recommendations",
        description: "AHA's recommendations for weekly aerobic and muscle-strengthening activity.",
        href: "https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults",
        icon: Dumbbell,
      },
      {
        title: "World Health Organization — Physical Activity",
        description: "WHO's guidance on physical activity for health at every age.",
        href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
        icon: Globe,
      },
    ],
  },
]

const SAFETY_POINTS = [
  "Use recommendations as planning help — a starting point, not a prescription.",
  "Verify allergens and ingredients directly with Rutgers Dining Services.",
  "Calorie and macro estimates are approximate and may vary from actual servings.",
  "This app does not provide medical or dietary advice.",
]

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rutgers–New Brunswick</p>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Trusted guides for balanced eating, nutrition basics, and healthy habits.</p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-3">
          <div className="flex items-center gap-2">
            <section.icon className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">{section.heading}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.resources.map((r) => (
              <ResourceCard key={r.href} title={r.title} description={r.description} href={r.href} icon={r.icon} />
            ))}
          </div>
        </section>
      ))}

      {/* Using this app safely */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Using this app safely</h2>
        </div>
        <div className="rounded-xl border bg-muted/40 p-5">
          <ul className="space-y-2">
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
    </div>
  )
}
