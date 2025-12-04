"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default function VenuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
        <p className="text-muted-foreground">
          Search and manage venues for your events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Directory</CardTitle>
          <CardDescription>
            Find the perfect venue for your event
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Venue search and RFP features coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
