import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ResourceCardProps {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

/** A single trusted external resource, opening in a new tab. */
export default function ResourceCard({ title, description, href, icon: Icon }: ResourceCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-base leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="outline" size="sm" className="mt-auto w-full gap-1.5">
          <a href={href} target="_blank" rel="noopener noreferrer">
            Open resource
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
