"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Building2,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity,
  Star,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, subDays, subMonths, isAfter, parseISO } from "date-fns"

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
  budget_total: number | null
  budget_spent: number | null
}

interface Exhibitor {
  id: string
  event_id: string
  company_name: string
  status: string
  contract_value: number | null
  paid_amount: number
}

interface Cost {
  id: string
  event_id: string
  estimated_amount: number
  actual_amount: number | null
  category: string
}

const DATE_RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
  { value: "all", label: "All Time" },
]

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState("all")

  const fetchData = useCallback(async () => {
    try {
      // Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false })

      setEvents(eventsData || [])

      // Fetch exhibitors
      const { data: exhibitorsData } = await supabase
        .from("exhibitors")
        .select("*")

      setExhibitors(exhibitorsData || [])

      // Fetch costs
      const { data: costsData } = await supabase
        .from("event_costs")
        .select("*")

      setCosts(costsData || [])
    } catch (error: any) {
      console.error("Error fetching analytics data:", error)
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter data based on date range
  const getFilteredData = () => {
    let startDate: Date | null = null
    const now = new Date()

    switch (dateRange) {
      case "7d":
        startDate = subDays(now, 7)
        break
      case "30d":
        startDate = subDays(now, 30)
        break
      case "90d":
        startDate = subDays(now, 90)
        break
      case "12m":
        startDate = subMonths(now, 12)
        break
      default:
        startDate = null
    }

    let filteredEvents = events
    if (startDate) {
      filteredEvents = events.filter(e => isAfter(parseISO(e.start_date), startDate!))
    }

    const eventIds = selectedEvent === "all" 
      ? filteredEvents.map(e => e.id)
      : [selectedEvent]

    const filteredExhibitors = exhibitors.filter(ex => eventIds.includes(ex.event_id))
    const filteredCosts = costs.filter(c => eventIds.includes(c.event_id))

    return { filteredEvents, filteredExhibitors, filteredCosts }
  }

  const { filteredEvents, filteredExhibitors, filteredCosts } = getFilteredData()

  // Calculate metrics
  const totalEvents = filteredEvents.length
  const upcomingEvents = filteredEvents.filter(e => isAfter(parseISO(e.start_date), new Date())).length
  const publishedEvents = filteredEvents.filter(e => e.status === "published").length

  const confirmedExhibitors = filteredExhibitors.filter(e => e.status === "confirmed")
  const totalExhibitors = filteredExhibitors.length
  const totalRevenue = confirmedExhibitors.reduce((sum, e) => sum + (e.contract_value || 0), 0)
  const collectedRevenue = filteredExhibitors.reduce((sum, e) => sum + e.paid_amount, 0)
  const pendingRevenue = totalRevenue - collectedRevenue

  const totalEstimatedCosts = filteredCosts.reduce((sum, c) => sum + c.estimated_amount, 0)
  const totalActualCosts = filteredCosts.reduce((sum, c) => sum + (c.actual_amount || 0), 0)
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalActualCosts) / totalRevenue * 100) : 0

  // Exhibitor pipeline
  const potentialExhibitors = filteredExhibitors.filter(e => e.status === "potential").length
  const contactedExhibitors = filteredExhibitors.filter(e => e.status === "contacted").length
  const negotiatingExhibitors = filteredExhibitors.filter(e => e.status === "negotiating").length
  const confirmedCount = confirmedExhibitors.length
  const conversionRate = totalExhibitors > 0 ? (confirmedCount / totalExhibitors * 100) : 0

  // Top events by revenue
  const eventRevenue = filteredEvents.map(event => {
    const eventExhibitors = confirmedExhibitors.filter(ex => ex.event_id === event.id)
    const revenue = eventExhibitors.reduce((sum, ex) => sum + (ex.contract_value || 0), 0)
    const collected = eventExhibitors.reduce((sum, ex) => sum + ex.paid_amount, 0)
    return {
      ...event,
      revenue,
      collected,
      exhibitorCount: eventExhibitors.length,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  // Cost breakdown by category
  const costsByCategory = filteredCosts.reduce((acc, cost) => {
    if (!acc[cost.category]) {
      acc[cost.category] = { estimated: 0, actual: 0 }
    }
    acc[cost.category].estimated += cost.estimated_amount
    acc[cost.category].actual += cost.actual_amount || 0
    return acc
  }, {} as Record<string, { estimated: number; actual: number }>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Financial overview and event performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Event:</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Period:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Collected:</span>
              <span className="text-xs font-medium text-green-600">{formatCurrency(collectedRevenue)}</span>
            </div>
            <Progress value={(collectedRevenue / totalRevenue) * 100 || 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalActualCosts)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Budget:</span>
              <span className="text-xs font-medium">{formatCurrency(totalEstimatedCosts)}</span>
            </div>
            <Progress value={(totalActualCosts / totalEstimatedCosts) * 100 || 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalRevenue - totalActualCosts) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalRevenue - totalActualCosts)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {profitMargin >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}% margin
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {confirmedCount} exhibitor(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event & Exhibitor Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Events Overview</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="text-lg font-bold">{totalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Published</span>
                <Badge variant="default">{publishedEvents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upcoming</span>
                <Badge variant="secondary">{upcomingEvents}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exhibitor Pipeline</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  Potential
                </span>
                <span className="font-medium">{potentialExhibitors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Contacted
                </span>
                <span className="font-medium">{contactedExhibitors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Negotiating
                </span>
                <span className="font-medium">{negotiatingExhibitors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Confirmed
                </span>
                <span className="font-medium">{confirmedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center py-4">
              {conversionRate.toFixed(1)}%
            </div>
            <Progress value={conversionRate} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {confirmedCount} of {totalExhibitors} exhibitors confirmed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Events & Cost Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Events by Revenue
            </CardTitle>
            <CardDescription>Highest performing events</CardDescription>
          </CardHeader>
          <CardContent>
            {eventRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events with revenue data
              </p>
            ) : (
              <div className="space-y-4">
                {eventRevenue.slice(0, 5).map((event, index) => (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{event.exhibitorCount} exhibitors</span>
                        <span>•</span>
                        <span>{format(parseISO(event.start_date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(event.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(event.collected)} collected
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Cost Breakdown by Category
            </CardTitle>
            <CardDescription>Budget vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(costsByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No cost data available
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(costsByCategory)
                  .sort((a, b) => b[1].estimated - a[1].estimated)
                  .slice(0, 6)
                  .map(([category, data]) => {
                    const percentage = (data.actual / data.estimated) * 100
                    const isOverBudget = percentage > 100
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{category}</span>
                          <span className={isOverBudget ? 'text-red-600' : 'text-muted-foreground'}>
                            {formatCurrency(data.actual)} / {formatCurrency(data.estimated)}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={Math.min(percentage, 100)} 
                            className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                          />
                          {isOverBudget && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 text-[10px] px-1 py-0">
                              +{(percentage - 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Overall financial health across all selected events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Collected</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(collectedRevenue)}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">Total Costs</p>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalActualCosts)}</p>
            </div>
            <div className={`p-4 rounded-lg ${(totalRevenue - totalActualCosts) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} border`}>
              <p className={`text-sm font-medium ${(totalRevenue - totalActualCosts) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Net Profit</p>
              <p className={`text-2xl font-bold ${(totalRevenue - totalActualCosts) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(totalRevenue - totalActualCosts)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
