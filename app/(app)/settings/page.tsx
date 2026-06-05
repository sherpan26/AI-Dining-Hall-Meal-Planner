"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Settings as SettingsIcon } from "lucide-react"
import { usePrefs } from "@/lib/store"
import PreferencesFields, {
  formToPrefs,
  prefsToForm,
  type PrefsFormState,
} from "@/components/settings/PreferencesFields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const { prefs, setPrefs, resetPrefs } = usePrefs()
  const [form, setForm] = useState<PrefsFormState>(() => prefsToForm(prefs))

  // Sync the form when stored prefs change (hydration, reset, or another tab).
  useEffect(() => {
    setForm(prefsToForm(prefs))
  }, [prefs])

  const save = () => {
    setPrefs(formToPrefs(form))
    toast.success("Preferences saved")
  }

  const reset = () => {
    resetPrefs()
    toast("Preferences reset to defaults")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rutgers–New Brunswick</p>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Your goal and dietary preferences guide every recommendation. Stored on this device — no account needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </CardTitle>
          <CardDescription>These apply to every new recommendation, and pre-fill the home page.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesFields value={form} onChange={setForm} />
        </CardContent>
        <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={reset}>
            Reset to defaults
          </Button>
          <Button className="w-full sm:w-auto" onClick={save}>
            Save preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
