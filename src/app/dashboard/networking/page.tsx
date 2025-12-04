"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users2 } from "lucide-react"

export default function NetworkingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Networking</h1>
        <p className="text-muted-foreground">
          Smart matchmaking and meeting scheduling
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Networking Hub</CardTitle>
          <CardDescription>
            Connect attendees with smart matchmaking
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            AI-powered networking features coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
