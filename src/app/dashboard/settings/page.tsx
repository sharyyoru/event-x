"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your account preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Customize your EventX experience
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Settings options coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
