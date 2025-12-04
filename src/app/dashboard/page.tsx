import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const stats = [
  {
    title: "Total Events",
    value: "12",
    change: "+2 this month",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Total Registrations",
    value: "2,847",
    change: "+18% from last month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Revenue",
    value: "$124,500",
    change: "+12% from last month",
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Check-in Rate",
    value: "87%",
    change: "+5% improvement",
    icon: TrendingUp,
    trend: "up",
  },
]

const upcomingEvents = [
  {
    id: "1",
    title: "Tech Conference 2024",
    date: "Dec 15-17, 2024",
    location: "San Francisco, CA",
    registrations: 850,
    capacity: 1000,
    status: "live",
  },
  {
    id: "2",
    title: "Developer Summit",
    date: "Jan 20-21, 2025",
    location: "Austin, TX",
    registrations: 320,
    capacity: 500,
    status: "upcoming",
  },
  {
    id: "3",
    title: "AI Workshop Series",
    date: "Feb 5, 2025",
    location: "Online",
    registrations: 180,
    capacity: 200,
    status: "upcoming",
  },
]

const recentActivity = [
  { action: "New registration", user: "John Smith", event: "Tech Conference 2024", time: "2 min ago" },
  { action: "Booth reserved", user: "Acme Corp", event: "Tech Conference 2024", time: "15 min ago" },
  { action: "Payment received", user: "Jane Doe", event: "Developer Summit", time: "1 hour ago" },
  { action: "Check-in completed", user: "Mike Johnson", event: "Tech Conference 2024", time: "2 hours ago" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your events.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next scheduled events</CardDescription>
            </div>
            <Link href="/dashboard/events">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge
                      variant={event.status === "live" ? "default" : "secondary"}
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {event.registrations} / {event.capacity}
                  </div>
                  <Progress
                    value={(event.registrations / event.capacity) * 100}
                    className="mt-1 h-2 w-24"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      {" - "}
                      <span className="text-muted-foreground">{activity.user}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.event}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/events/new">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Calendar className="h-6 w-6" />
                Create Event
              </Button>
            </Link>
            <Link href="/dashboard/venues">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <MapPin className="h-6 w-6" />
                Find Venues
              </Button>
            </Link>
            <Link href="/dashboard/check-in">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Users className="h-6 w-6" />
                Check-in Mode
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
