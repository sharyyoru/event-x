"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function RFPPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RFP Management</h1>
        <p className="text-muted-foreground">
          Send and manage requests for proposals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request for Proposals</CardTitle>
          <CardDescription>
            Send RFPs to venues and compare bids
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            RFP features coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
