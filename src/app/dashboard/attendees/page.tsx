"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function AttendeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendees</h1>
        <p className="text-muted-foreground">
          View and manage event attendees
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendee List</CardTitle>
          <CardDescription>
            No attendees yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Attendees will appear here once people register for your events
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
