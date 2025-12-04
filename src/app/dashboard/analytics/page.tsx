"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track event performance and engagement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Analytics</CardTitle>
          <CardDescription>
            Insights into your events
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Analytics dashboard will populate with event data
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
