"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map } from "lucide-react"

export default function FloorPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Floor Plans</h1>
        <p className="text-muted-foreground">
          Design and manage event floor layouts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Floor Plan Editor</CardTitle>
          <CardDescription>
            Create interactive floor plans for your events
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Floor plan designer with DXF import coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
