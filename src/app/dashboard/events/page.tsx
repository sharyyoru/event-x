"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>
            You haven't created any events yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Get started by creating your first event
          </p>
          <Link href="/dashboard/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
