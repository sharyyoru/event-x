"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with attendees and exhibitors
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            No messages yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Messages will appear here when attendees reach out
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
