"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket } from "lucide-react"

export default function RegistrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registration</h1>
        <p className="text-muted-foreground">
          Manage event registrations and tickets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrations</CardTitle>
          <CardDescription>
            No registrations yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Registrations will appear here once attendees sign up for your events
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
