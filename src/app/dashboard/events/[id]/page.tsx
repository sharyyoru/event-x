"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  DollarSign,
  Package,
  UserPlus,
  Truck,
  PlusCircle,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  Globe,
  FileText,
  Palette,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  status: string
  venue: string | null
  event_type: string
  branding_logo: string | null
  branding_banner: string | null
  budget_total: number | null
  budget_spent: number | null
  organizer_id: string
}

interface TeamMember {
  id: string
  user_id: string
  role: string
  profile: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    role: string
  }
}

interface Supplier {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  category: string
  items_supplied: string
  contract_amount: number | null
  paid_amount: number
  status: string
  notes: string | null
}

interface Cost {
  id: string
  category: string
  description: string
  estimated_amount: number
  actual_amount: number | null
  status: string
  notes: string | null
}

interface Exhibitor {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  industry: string | null
  booth_size: string | null
  booth_number: string | null
  status: string
  contract_value: number | null
  paid_amount: number
  package_type: string | null
  package_details: string | null
  special_requirements: string | null
  notes: string | null
}

const EVENT_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "exhibition", label: "Exhibition" },
  { value: "hybrid", label: "Conference + Exhibition" },
]

const TEAM_ROLES = [
  { value: "organizer", label: "Organizer" },
  { value: "coordinator", label: "Coordinator" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "support", label: "Support Staff" },
]

const SUPPLIER_CATEGORIES = [
  { value: "catering", label: "Catering" },
  { value: "av_equipment", label: "AV Equipment" },
  { value: "decoration", label: "Decoration" },
  { value: "security", label: "Security" },
  { value: "transportation", label: "Transportation" },
  { value: "printing", label: "Printing" },
  { value: "photography", label: "Photography/Video" },
  { value: "entertainment", label: "Entertainment" },
  { value: "furniture", label: "Furniture Rental" },
  { value: "staffing", label: "Staffing" },
  { value: "other", label: "Other" },
]

const COST_CATEGORIES = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "marketing", label: "Marketing" },
  { value: "staff", label: "Staff" },
  { value: "equipment", label: "Equipment" },
  { value: "transportation", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "printing", label: "Printing" },
  { value: "technology", label: "Technology" },
  { value: "insurance", label: "Insurance" },
  { value: "miscellaneous", label: "Miscellaneous" },
]

const EXHIBITOR_STATUSES = [
  { value: "potential", label: "Potential", color: "bg-gray-500" },
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
]

const BOOTH_SIZES = [
  { value: "small", label: "Small (9 sqm)" },
  { value: "medium", label: "Medium (18 sqm)" },
  { value: "large", label: "Large (36 sqm)" },
  { value: "premium", label: "Premium (72+ sqm)" },
]

const PACKAGE_TYPES = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "platinum", label: "Platinum" },
]

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Dialog states
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [showExhibitorDialog, setShowExhibitorDialog] = useState(false)
  const [showBrandingDialog, setShowBrandingDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [newTeamMember, setNewTeamMember] = useState({ user_id: "", role: "support" })
  const [newSupplier, setNewSupplier] = useState({
    name: "", company: "", email: "", phone: "", category: "catering",
    items_supplied: "", contract_amount: "", notes: ""
  })
  const [newCost, setNewCost] = useState({
    category: "venue", description: "", estimated_amount: "", notes: ""
  })
  const [newExhibitor, setNewExhibitor] = useState({
    company_name: "", contact_name: "", email: "", phone: "", website: "",
    industry: "", booth_size: "medium", status: "potential", contract_value: "",
    package_type: "standard", package_details: "", special_requirements: "", notes: ""
  })

  const fetchEventData = useCallback(async () => {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Fetch team members with profiles
      const { data: teamData } = await supabase
        .from("event_team_members")
        .select(`
          id, user_id, role,
          profile:profiles(id, full_name, email, avatar_url, role)
        `)
        .eq("event_id", eventId)

      // Transform data to handle the profile being returned as single object
      const transformedTeam = (teamData || []).map((member: any) => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
      }))
      setTeamMembers(transformedTeam)

      // Fetch suppliers
      const { data: supplierData } = await supabase
        .from("event_suppliers")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      setSuppliers(supplierData || [])

      // Fetch costs
      const { data: costData } = await supabase
        .from("event_costs")
        .select("*")
        .eq("event_id", eventId)
        .order("category")

      setCosts(costData || [])

      // Fetch exhibitors
      const { data: exhibitorData } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("event_id", eventId)
        .order("status", { ascending: true })

      setExhibitors(exhibitorData || [])

      // Fetch available users
      const { data: userData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name")

      setAvailableUsers(userData || [])
    } catch (error: any) {
      console.error("Error fetching event:", error)
      toast({
        title: "Error loading event",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [eventId, toast])

  useEffect(() => {
    fetchEventData()
  }, [fetchEventData])

  const handleAddTeamMember = async () => {
    if (!newTeamMember.user_id) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("event_team_members")
        .insert({
          event_id: eventId,
          user_id: newTeamMember.user_id,
          role: newTeamMember.role,
        })

      if (error) throw error
      toast({ title: "Team member added" })
      setShowTeamDialog(false)
      setNewTeamMember({ user_id: "", role: "support" })
      fetchEventData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.items_supplied) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("event_suppliers")
        .insert({
          event_id: eventId,
          ...newSupplier,
          contract_amount: newSupplier.contract_amount ? parseFloat(newSupplier.contract_amount) : null,
        })

      if (error) throw error
      toast({ title: "Supplier added" })
      setShowSupplierDialog(false)
      setNewSupplier({
        name: "", company: "", email: "", phone: "", category: "catering",
        items_supplied: "", contract_amount: "", notes: ""
      })
      fetchEventData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.estimated_amount) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("event_costs")
        .insert({
          event_id: eventId,
          ...newCost,
          estimated_amount: parseFloat(newCost.estimated_amount),
        })

      if (error) throw error
      toast({ title: "Cost added" })
      setShowCostDialog(false)
      setNewCost({ category: "venue", description: "", estimated_amount: "", notes: "" })
      fetchEventData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddExhibitor = async () => {
    if (!newExhibitor.company_name) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("exhibitors")
        .insert({
          event_id: eventId,
          ...newExhibitor,
          contract_value: newExhibitor.contract_value ? parseFloat(newExhibitor.contract_value) : null,
        })

      if (error) throw error
      toast({ title: "Exhibitor added" })
      setShowExhibitorDialog(false)
      setNewExhibitor({
        company_name: "", contact_name: "", email: "", phone: "", website: "",
        industry: "", booth_size: "medium", status: "potential", contract_value: "",
        package_type: "standard", package_details: "", special_requirements: "", notes: ""
      })
      fetchEventData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateEventType = async (eventType: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ event_type: eventType })
        .eq("id", eventId)

      if (error) throw error
      setEvent(prev => prev ? { ...prev, event_type: eventType } : null)
      toast({ title: "Event type updated" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase.from("event_team_members").delete().eq("id", id)
      if (error) throw error
      setTeamMembers(prev => prev.filter(m => m.id !== id))
      toast({ title: "Team member removed" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleUpdateExhibitorStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("exhibitors")
        .update({ status })
        .eq("id", id)

      if (error) throw error
      setExhibitors(prev => prev.map(e => e.id === id ? { ...e, status } : e))
      toast({ title: "Status updated" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount)
  }

  // Calculate totals
  const totalEstimatedCost = costs.reduce((sum, c) => sum + c.estimated_amount, 0)
  const totalActualCost = costs.reduce((sum, c) => sum + (c.actual_amount || 0), 0)
  const totalContractValue = exhibitors.filter(e => e.status === "confirmed").reduce((sum, e) => sum + (e.contract_value || 0), 0)
  const totalPaidByExhibitors = exhibitors.reduce((sum, e) => sum + e.paid_amount, 0)
  const potentialExhibitors = exhibitors.filter(e => ["potential", "contacted", "negotiating"].includes(e.status))
  const confirmedExhibitors = exhibitors.filter(e => e.status === "confirmed")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-2">Event not found</h2>
        <Button onClick={() => router.push("/dashboard/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/events")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_date), "MMM d, yyyy")}
                </span>
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.venue}
                  </span>
                )}
                <Badge variant={event.status === "published" ? "default" : "secondary"}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={event.event_type || "conference"} onValueChange={handleUpdateEventType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowBrandingDialog(true)}>
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Exhibitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedExhibitors.length}</div>
            <p className="text-xs text-muted-foreground">+{potentialExhibitors.length} potential</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</div>
            <p className="text-xs text-muted-foreground">Actual: {formatCurrency(totalActualCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalContractValue)}</div>
            <p className="text-xs text-muted-foreground">Collected: {formatCurrency(totalPaidByExhibitors)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="exhibitors">Exhibitors</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{event.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p className="mt-1 font-medium">{format(new Date(event.start_date), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">End Date</Label>
                    <p className="mt-1 font-medium">{format(new Date(event.end_date), "PPP")}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Type</Label>
                  <p className="mt-1 font-medium capitalize">{event.event_type?.replace("_", " + ") || "Conference"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team</CardTitle>
                <Button size="sm" onClick={() => setShowTeamDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profile?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profile?.full_name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People assigned to this event</CardDescription>
              </div>
              <Button onClick={() => setShowTeamDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event Role</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.profile?.full_name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.profile?.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.profile?.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{member.profile?.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTeamMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teamMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No team members assigned yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>Vendors and service providers for this event</CardDescription>
              </div>
              <Button onClick={() => setShowSupplierDialog(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Items Supplied</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.company}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {supplier.category.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{supplier.items_supplied}</TableCell>
                      <TableCell>{formatCurrency(supplier.contract_amount)}</TableCell>
                      <TableCell>{formatCurrency(supplier.paid_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={supplier.status === "completed" ? "default" : "secondary"} className="capitalize">
                          {supplier.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No suppliers added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exhibitors Tab */}
        <TabsContent value="exhibitors" className="space-y-6">
          {/* Exhibitor Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-2xl font-bold">{potentialExhibitors.length}</p>
                    <p className="text-xs text-muted-foreground">Potential</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{confirmedExhibitors.length}</p>
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalContractValue)}</p>
                    <p className="text-xs text-muted-foreground">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalPaidByExhibitors)}</p>
                    <p className="text-xs text-muted-foreground">Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Potential Exhibitors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Potential Exhibitors</CardTitle>
                <CardDescription>Companies in the sales pipeline</CardDescription>
              </div>
              <Button onClick={() => setShowExhibitorDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Exhibitor
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {potentialExhibitors.map((exhibitor) => (
                    <TableRow key={exhibitor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exhibitor.company_name}</p>
                          {exhibitor.website && (
                            <a href={exhibitor.website} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{exhibitor.contact_name}</p>
                          {exhibitor.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {exhibitor.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{exhibitor.industry || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{exhibitor.package_type}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(exhibitor.contract_value)}</TableCell>
                      <TableCell>
                        <Select
                          value={exhibitor.status}
                          onValueChange={(value) => handleUpdateExhibitorStatus(exhibitor.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXHIBITOR_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {potentialExhibitors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No potential exhibitors yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Confirmed Exhibitors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Confirmed Exhibitors
              </CardTitle>
              <CardDescription>Companies with signed contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Booth</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Contract Value</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedExhibitors.map((exhibitor) => (
                    <TableRow key={exhibitor.id}>
                      <TableCell className="font-medium">{exhibitor.company_name}</TableCell>
                      <TableCell>
                        <div>
                          <p>{exhibitor.booth_number || "TBD"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{exhibitor.booth_size}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize">{exhibitor.package_type}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(exhibitor.contract_value)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(exhibitor.paid_amount)}</TableCell>
                      <TableCell className="text-orange-600">
                        {formatCurrency((exhibitor.contract_value || 0) - exhibitor.paid_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {confirmedExhibitors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No confirmed exhibitors yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cost Management</CardTitle>
                <CardDescription>Track all event expenses</CardDescription>
              </div>
              <Button onClick={() => setShowCostDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Cost
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Estimated</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => {
                    const variance = cost.actual_amount 
                      ? cost.estimated_amount - cost.actual_amount 
                      : 0
                    return (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {cost.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{cost.description}</TableCell>
                        <TableCell>{formatCurrency(cost.estimated_amount)}</TableCell>
                        <TableCell>{formatCurrency(cost.actual_amount)}</TableCell>
                        <TableCell className={variance >= 0 ? "text-green-600" : "text-red-600"}>
                          {variance !== 0 ? (variance > 0 ? "+" : "") + formatCurrency(variance) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cost.status === "paid" ? "default" : "secondary"} className="capitalize">
                            {cost.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {costs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No costs tracked yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Budget Summary */}
              {costs.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Estimated</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Total Actual</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalActualCost)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Variance</p>
                      <p className={`text-2xl font-bold ${totalEstimatedCost - totalActualCost >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(totalEstimatedCost - totalActualCost)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Team Member Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Assign a user to this event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={newTeamMember.user_id} onValueChange={(v) => setNewTeamMember(p => ({ ...p, user_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers
                    .filter(u => !teamMembers.some(m => m.user_id === u.id))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Role</Label>
              <Select value={newTeamMember.role} onValueChange={(v) => setNewTeamMember(p => ({ ...p, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTeamMember} disabled={isSaving || !newTeamMember.user_id}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Add a vendor or service provider</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newSupplier.name} onChange={(e) => setNewSupplier(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={newSupplier.company} onChange={(e) => setNewSupplier(p => ({ ...p, company: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newSupplier.phone} onChange={(e) => setNewSupplier(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newSupplier.category} onValueChange={(v) => setNewSupplier(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract Amount (AED)</Label>
                <Input type="number" value={newSupplier.contract_amount} onChange={(e) => setNewSupplier(p => ({ ...p, contract_amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Items/Services Supplied *</Label>
              <Textarea value={newSupplier.items_supplied} onChange={(e) => setNewSupplier(p => ({ ...p, items_supplied: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier} disabled={isSaving || !newSupplier.name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Item</DialogTitle>
            <DialogDescription>Track an expense for this event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCost.category} onValueChange={(v) => setNewCost(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={newCost.description} onChange={(e) => setNewCost(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Amount (AED) *</Label>
              <Input type="number" value={newCost.estimated_amount} onChange={(e) => setNewCost(p => ({ ...p, estimated_amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newCost.notes} onChange={(e) => setNewCost(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCostDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCost} disabled={isSaving || !newCost.description}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exhibitor Dialog */}
      <Dialog open={showExhibitorDialog} onOpenChange={setShowExhibitorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Exhibitor</DialogTitle>
            <DialogDescription>Add a potential or confirmed exhibitor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={newExhibitor.company_name} onChange={(e) => setNewExhibitor(p => ({ ...p, company_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={newExhibitor.contact_name} onChange={(e) => setNewExhibitor(p => ({ ...p, contact_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newExhibitor.email} onChange={(e) => setNewExhibitor(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newExhibitor.phone} onChange={(e) => setNewExhibitor(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={newExhibitor.website} onChange={(e) => setNewExhibitor(p => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={newExhibitor.industry} onChange={(e) => setNewExhibitor(p => ({ ...p, industry: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Booth Size</Label>
                <Select value={newExhibitor.booth_size} onValueChange={(v) => setNewExhibitor(p => ({ ...p, booth_size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOTH_SIZES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Select value={newExhibitor.package_type} onValueChange={(v) => setNewExhibitor(p => ({ ...p, package_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newExhibitor.status} onValueChange={(v) => setNewExhibitor(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXHIBITOR_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contract Value (AED)</Label>
              <Input type="number" value={newExhibitor.contract_value} onChange={(e) => setNewExhibitor(p => ({ ...p, contract_value: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Package Details</Label>
              <Textarea value={newExhibitor.package_details} onChange={(e) => setNewExhibitor(p => ({ ...p, package_details: e.target.value }))} placeholder="What's included in the package..." />
            </div>
            <div className="space-y-2">
              <Label>Special Requirements</Label>
              <Textarea value={newExhibitor.special_requirements} onChange={(e) => setNewExhibitor(p => ({ ...p, special_requirements: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExhibitorDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExhibitor} disabled={isSaving || !newExhibitor.company_name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Exhibitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branding Dialog */}
      <Dialog open={showBrandingDialog} onOpenChange={setShowBrandingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Branding</DialogTitle>
            <DialogDescription>Upload logos and banners for this event</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Event Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {event.branding_logo ? "Logo uploaded" : "No logo uploaded"}
                </p>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event Banner</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {event.branding_banner ? "Banner uploaded" : "No banner uploaded"}
                </p>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Banner
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBrandingDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
