"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  Globe,
  UserPlus,
  Users,
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Copy,
  ExternalLink,
  Pencil,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Exhibitor {
  id: string
  event_id: string
  company_name: string
  company_description: string | null
  company_logo: string | null
  company_website: string | null
  industry: string | null
  booth_size: string | null
  booth_number: string | null
  status: string
  contract_value: number | null
  paid_amount: number
  package_type: string | null
  events?: {
    title: string
  }
  contacts?: ExhibitorContact[]
}

interface ExhibitorContact {
  id: string
  full_name: string
  email: string
  phone: string | null
  job_title: string | null
  is_primary: boolean
  invitation_status: string
  user_id: string | null
}

interface Event {
  id: string
  title: string
}

const EXHIBITOR_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "potential", label: "Potential", color: "bg-gray-500" },
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
]

const getStatusColor = (status: string) => {
  const found = EXHIBITOR_STATUSES.find(s => s.value === status)
  return found?.color || "bg-gray-500"
}

export default function ExhibitorsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newContact, setNewContact] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
    is_primary: false,
  })

  const [editForm, setEditForm] = useState({
    company_name: "",
    company_description: "",
    company_website: "",
    industry: "",
    booth_size: "",
    booth_number: "",
    status: "",
    package_type: "",
    contract_value: "",
    paid_amount: "",
    special_requirements: "",
  })

  useEffect(() => {
    fetchExhibitors()
    fetchEvents()
  }, [])

  const fetchExhibitors = async () => {
    try {
      // Fetch exhibitors with contacts
      const { data, error } = await supabase
        .from("exhibitors")
        .select(`
          *,
          contacts:exhibitor_contacts(id, full_name, email, phone, job_title, is_primary, invitation_status, user_id)
        `)
        .order("company_name")

      if (error) throw error
      
      // Fetch all events to map to exhibitors
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title")
      
      const eventsMap = new Map(eventsData?.map(e => [e.id, e]) || [])
      
      // Add event data to each exhibitor
      const exhibitorsWithEvents = (data || []).map(exhibitor => ({
        ...exhibitor,
        events: exhibitor.event_id ? eventsMap.get(exhibitor.event_id) : undefined
      }))
      
      setExhibitors(exhibitorsWithEvents)
    } catch (error: any) {
      console.error("Error fetching exhibitors:", error)
      toast({
        title: "Error loading exhibitors",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .order("start_date", { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const handleAddContact = async () => {
    if (!selectedExhibitor || !newContact.full_name || !newContact.email) return
    setIsSaving(true)

    try {
      // Generate invitation token
      const invitationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

      const { error } = await supabase
        .from("exhibitor_contacts")
        .insert({
          exhibitor_id: selectedExhibitor.id,
          full_name: newContact.full_name,
          email: newContact.email,
          phone: newContact.phone || null,
          job_title: newContact.job_title || null,
          is_primary: newContact.is_primary,
          invitation_token: invitationToken,
          invitation_status: "pending",
        })

      if (error) throw error

      toast({
        title: "Contact added",
        description: `${newContact.full_name} has been added. Send them the invitation link.`,
      })

      setShowContactDialog(false)
      setNewContact({ full_name: "", email: "", phone: "", job_title: "", is_primary: false })
      fetchExhibitors()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendInvitation = async (contact: ExhibitorContact, exhibitor: Exhibitor) => {
    // In a real app, this would send an email with the invitation link
    // For now, we'll copy the link to clipboard
    const inviteUrl = `${window.location.origin}/auth/exhibitor-login?email=${encodeURIComponent(contact.email)}`

    try {
      await navigator.clipboard.writeText(inviteUrl)
      
      // Update invitation status
      await supabase
        .from("exhibitor_contacts")
        .update({ 
          invitation_status: "sent",
          invitation_sent_at: new Date().toISOString()
        })
        .eq("id", contact.id)

      toast({
        title: "Invitation link copied!",
        description: `Send this link to ${contact.full_name} to invite them to the exhibitor portal.`,
      })

      fetchExhibitors()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invitation link",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor)
    setEditForm({
      company_name: exhibitor.company_name || "",
      company_description: exhibitor.company_description || "",
      company_website: exhibitor.company_website || "",
      industry: exhibitor.industry || "",
      booth_size: exhibitor.booth_size || "",
      booth_number: exhibitor.booth_number || "",
      status: exhibitor.status || "potential",
      package_type: exhibitor.package_type || "",
      contract_value: exhibitor.contract_value?.toString() || "",
      paid_amount: exhibitor.paid_amount?.toString() || "0",
      special_requirements: "",
    })
    setShowEditDialog(true)
  }

  const handleSaveExhibitor = async () => {
    if (!selectedExhibitor) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("exhibitors")
        .update({
          company_name: editForm.company_name,
          company_description: editForm.company_description || null,
          company_website: editForm.company_website || null,
          industry: editForm.industry || null,
          booth_size: editForm.booth_size || null,
          booth_number: editForm.booth_number || null,
          status: editForm.status,
          package_type: editForm.package_type || null,
          contract_value: editForm.contract_value ? parseFloat(editForm.contract_value) : null,
          paid_amount: editForm.paid_amount ? parseFloat(editForm.paid_amount) : 0,
        })
        .eq("id", selectedExhibitor.id)

      if (error) throw error

      toast({ title: "Exhibitor updated!" })
      setShowEditDialog(false)
      fetchExhibitors()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredExhibitors = exhibitors.filter((exhibitor) => {
    const matchesSearch = 
      exhibitor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibitor.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || exhibitor.status === statusFilter
    const matchesEvent = eventFilter === "all" || exhibitor.event_id === eventFilter
    return matchesSearch && matchesStatus && matchesEvent
  })

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount)
  }

  // Stats
  const totalExhibitors = exhibitors.length
  const confirmedExhibitors = exhibitors.filter(e => e.status === "confirmed").length
  const totalContractValue = exhibitors
    .filter(e => e.status === "confirmed")
    .reduce((sum, e) => sum + (e.contract_value || 0), 0)
  const totalCollected = exhibitors.reduce((sum, e) => sum + e.paid_amount, 0)

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
          <h1 className="text-3xl font-bold tracking-tight">Exhibitors</h1>
          <p className="text-muted-foreground">
            Manage all exhibitors across your events
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExhibitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedExhibitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalContractValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label className="text-foreground mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by company or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-foreground"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label className="text-foreground mb-2 block">Event</Label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label className="text-foreground mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXHIBITOR_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibitors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exhibitors</CardTitle>
          <CardDescription>
            {filteredExhibitors.length} exhibitor(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExhibitors.map((exhibitor) => (
                <TableRow key={exhibitor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={exhibitor.company_logo || ""} />
                        <AvatarFallback className="text-xs">
                          {exhibitor.company_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{exhibitor.company_name}</p>
                        <p className="text-xs text-muted-foreground">{exhibitor.industry || "N/A"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{exhibitor.events?.title || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{exhibitor.contacts?.length || 0}</span>
                      {exhibitor.contacts?.some(c => c.invitation_status === "accepted") && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(exhibitor.status)} text-white capitalize`}>
                      {exhibitor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {exhibitor.package_type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(exhibitor.contract_value)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/exhibitors/${exhibitor.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(exhibitor)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Exhibitor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedExhibitor(exhibitor)
                          setShowContactDialog(true)
                        }}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Contact
                        </DropdownMenuItem>
                        {exhibitor.company_website && (
                          <DropdownMenuItem onClick={() => window.open(exhibitor.company_website!, "_blank")}>
                            <Globe className="mr-2 h-4 w-4" />
                            Visit Website
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExhibitors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No exhibitors found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contacts Section */}
      {filteredExhibitors.some(e => e.contacts && e.contacts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Exhibitor Contacts</CardTitle>
            <CardDescription>All contacts with their invitation status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExhibitors.flatMap(exhibitor => 
                  (exhibitor.contacts || []).map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {contact.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {contact.full_name}
                              {contact.is_primary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{exhibitor.company_name}</TableCell>
                      <TableCell>{contact.job_title || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={contact.invitation_status === "accepted" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {contact.user_id ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {contact.invitation_status}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!contact.user_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendInvitation(contact, exhibitor)}
                          >
                            <Send className="mr-2 h-3 w-3" />
                            Copy Invite Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exhibitor Contact</DialogTitle>
            <DialogDescription>
              Add a contact person for {selectedExhibitor?.company_name}. They will receive a temporary login to manage their exhibitor profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newContact.full_name}
                  onChange={(e) => setNewContact(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newContact.job_title}
                  onChange={(e) => setNewContact(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="Marketing Manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(p => ({ ...p, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={newContact.is_primary}
                onChange={(e) => setNewContact(p => ({ ...p, is_primary: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_primary" className="text-sm font-normal">
                Set as primary contact (can invite other team members)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={isSaving || !newContact.full_name || !newContact.email}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exhibitor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exhibitor</DialogTitle>
            <DialogDescription>
              Update details for {selectedExhibitor?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={editForm.company_name}
                  onChange={(e) => setEditForm(p => ({ ...p, company_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={editForm.industry}
                  onChange={(e) => setEditForm(p => ({ ...p, industry: e.target.value }))}
                  placeholder="e.g., Technology, Marketing"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.company_description}
                onChange={(e) => setEditForm(p => ({ ...p, company_description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={editForm.company_website}
                  onChange={(e) => setEditForm(p => ({ ...p, company_website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXHIBITOR_STATUSES.filter(s => s.value !== "all").map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Booth Number</Label>
                <Input
                  value={editForm.booth_number}
                  onChange={(e) => setEditForm(p => ({ ...p, booth_number: e.target.value }))}
                  placeholder="A-101"
                />
              </div>
              <div className="space-y-2">
                <Label>Booth Size</Label>
                <Select 
                  value={editForm.booth_size} 
                  onValueChange={(v) => setEditForm(p => ({ ...p, booth_size: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (9 sqm)</SelectItem>
                    <SelectItem value="medium">Medium (18 sqm)</SelectItem>
                    <SelectItem value="large">Large (36 sqm)</SelectItem>
                    <SelectItem value="xlarge">X-Large (54+ sqm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Select 
                  value={editForm.package_type} 
                  onValueChange={(v) => setEditForm(p => ({ ...p, package_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Value (AED)</Label>
                <Input
                  type="number"
                  value={editForm.contract_value}
                  onChange={(e) => setEditForm(p => ({ ...p, contract_value: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Paid Amount (AED)</Label>
                <Input
                  type="number"
                  value={editForm.paid_amount}
                  onChange={(e) => setEditForm(p => ({ ...p, paid_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExhibitor} disabled={isSaving || !editForm.company_name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
