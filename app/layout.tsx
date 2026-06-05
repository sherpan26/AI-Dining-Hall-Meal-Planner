import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rutgers Dining Hall AI Meal Planner',
  description:
    'AI-powered meal planning and nutrition assistant for Rutgers University students. Browse live dining hall menus, analyze meals, and build plans aligned with your nutrition goals.',
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
