import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RU Dining AI — Rutgers–New Brunswick Meal Planner',
  description:
    'AI-recommended plates with full macros, built from today’s live dining hall menus across Rutgers–New Brunswick — Busch, Livingston, Neilson, and The Atrium.',
  keywords: [
    'Rutgers',
    'dining hall',
    'meal planner',
    'nutrition',
    'AI',
    'Gemini',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
