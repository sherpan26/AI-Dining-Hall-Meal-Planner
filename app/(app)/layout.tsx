import AppShell from "@/components/layout/AppShell"

/** Layout for the new AI Dining Concierge routes (/, /saved, /settings). */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
