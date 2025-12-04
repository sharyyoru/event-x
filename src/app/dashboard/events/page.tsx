"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Search, Filter, CalendarDays, MapPin, Users, MoreHorizontal, Pencil, Trash2, Eye, Loader2, X, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter, isBefore, isWithinInterval, parseISO, addDays } from "date-fns"

interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  start_date: string
  end_date: string
  status: string
  cover_image: string | null
  organizer_id: string
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  published: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
}

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past Events" },
  { value: "custom", label: "Custom Range" },
]

export default function EventsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDateStart, setCustomDateStart] = useState("")
  const [customDateEnd, setCustomDateEnd] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "09:00",
    end_date: "",
    end_time: "17:00",
    status: "draft",
    venue: "",
  })

  useEffect(() => {
    fetchEvents()
    fetchUsers()
    // Auto-open create dialog if action=create in URL
    if (searchParams.get("action") === "create") {
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .order("full_name")

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error("Error fetching users:", error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const startDateTime = `${newEvent.start_date}T${newEvent.start_time}:00`
      const endDateTime = `${newEvent.end_date}T${newEvent.end_time}:00`

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: newEvent.title,
          slug: generateSlug(newEvent.title),
          description: newEvent.description,
          start_date: startDateTime,
          end_date: endDateTime,
          status: newEvent.status,
          organizer_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Event created!",
        description: `${newEvent.title} has been created successfully.`,
      })

      setIsCreateDialogOpen(false)
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        start_time: "09:00",
        end_date: "",
        end_time: "17:00",
        status: "draft",
        venue: "",
      })
      setSelectedUsers([])
      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)

      if (error) throw error

      toast({
        title: "Event deleted",
        description: "The event has been removed.",
      })
      fetchEvents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Smart search for users
  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery) return true
    const query = userSearchQuery.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  })

  const filterEventsByDate = (event: Event) => {
    const eventStart = parseISO(event.start_date)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case "today":
        return format(eventStart, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
      case "week":
        const weekEnd = addDays(today, 7)
        return isWithinInterval(eventStart, { start: today, end: weekEnd })
      case "month":
        const monthEnd = addDays(today, 30)
        return isWithinInterval(eventStart, { start: today, end: monthEnd })
      case "upcoming":
        return isAfter(eventStart, now)
      case "past":
        return isBefore(eventStart, now)
      case "custom":
        if (!customDateStart || !customDateEnd) return true
        return isWithinInterval(eventStart, {
          start: parseISO(customDateStart),
          end: parseISO(customDateEnd),
        })
      default:
        return true
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    const matchesDate = filterEventsByDate(event)
    return matchesSearch && matchesStatus && matchesDate
  })

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
  }

  const upcomingCount = events.filter(e => isAfter(parseISO(e.start_date), new Date())).length
  const draftCount = events.filter(e => e.status === "draft").length
  const publishedCount = events.filter(e => e.status === "published").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new event
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent}>
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Basic Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">Event Title *</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Enter event title"
                      className="text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Describe your event..."
                      className="text-foreground min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Date & Time</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-foreground">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newEvent.start_date}
                        onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value, end_date: e.target.value })}
                        className="text-foreground"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time" className="text-foreground">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="text-foreground"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-foreground">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newEvent.end_date}
                        onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                        className="text-foreground"
                        min={newEvent.start_date}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time" className="text-foreground">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                        className="text-foreground"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Location</h3>
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="text-foreground">Venue</Label>
                    <Input
                      id="venue"
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      placeholder="Enter venue name or address"
                      className="text-foreground"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground">Status</Label>
                    <Select
                      value={newEvent.status}
                      onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                    >
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assign Users with Smart Search */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Assign Team Members</h3>
                  <p className="text-sm text-muted-foreground">Search and select users to assign to this event</p>
                  
                  {/* Selected Users Pills */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userId) => {
                        const user = users.find(u => u.id === userId)
                        if (!user) return null
                        return (
                          <Badge
                            key={userId}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 flex items-center gap-1"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px]">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{user.full_name}</span>
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(userId)}
                              className="ml-1 hover:bg-muted rounded p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 text-foreground"
                    />
                  </div>

                  {/* Filtered User List */}
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {userSearchQuery ? "No users found" : "Start typing to search users"}
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredUsers.slice(0, 10).map((user) => (
                          <div
                            key={user.id}
                            onClick={() => toggleUserSelection(user.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedUsers.includes(user.id)
                                ? "bg-primary/10 border border-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize shrink-0">
                              {user.role}
                            </Badge>
                            {selectedUsers.includes(user.id) && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        ))}
                        {filteredUsers.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            +{filteredUsers.length - 10} more users. Refine your search.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.length} user(s) selected
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Search */}
            <div className="flex-1">
              <Label className="text-foreground mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-foreground"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Label className="text-foreground mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-48">
              <Label className="text-foreground mb-2 block">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <>
                <div className="w-full md:w-40">
                  <Label className="text-foreground mb-2 block">From</Label>
                  <Input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="text-foreground"
                  />
                </div>
                <div className="w-full md:w-40">
                  <Label className="text-foreground mb-2 block">To</Label>
                  <Input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="text-foreground"
                  />
                </div>
              </>
            )}

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || dateFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setDateFilter("all")
                  setCustomDateStart("")
                  setCustomDateEnd("")
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {events.length === 0
                  ? "Get started by creating your first event"
                  : "Try adjusting your filters"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card 
                key={event.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                  <Calendar className="h-12 w-12 text-primary/50" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {event.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(event.id)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {format(parseISO(event.start_date), "MMM d, yyyy")}
                        {event.end_date !== event.start_date && (
                          <> - {format(parseISO(event.end_date), "MMM d, yyyy")}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary" className="capitalize">
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${STATUS_COLORS[event.status]}`} />
                        {event.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Details →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
