"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Surveys</h1>
        <p className="text-muted-foreground">
          Collect feedback from attendees
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Management</CardTitle>
          <CardDescription>
            Create and analyze post-event surveys
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Survey builder coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
