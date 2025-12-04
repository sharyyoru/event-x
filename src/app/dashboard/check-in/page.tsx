"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode } from "lucide-react"

export default function CheckInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground">
          QR code scanning and badge printing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in Station</CardTitle>
          <CardDescription>
            Scan attendee badges for quick check-in
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Check-in features will be available during live events
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
