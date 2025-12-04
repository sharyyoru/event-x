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
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  Edit,
  Save,
  Loader2,
  Users,
  UserPlus,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  Send,
  Copy,
  Pencil,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"

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
  social_facebook: string | null
  social_twitter: string | null
  social_linkedin: string | null
  social_instagram: string | null
  products_services: string | null
  created_at: string
  events?: {
    id: string
    title: string
    start_date: string
    end_date: string
    venue: string | null
  }
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

interface Document {
  id: string
  document_type: string
  document_name: string
  file_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string
}

const EXHIBITOR_STATUSES = [
  { value: "potential", label: "Potential", color: "bg-gray-500" },
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
]

export default function ExhibitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const exhibitorId = params.id as string

  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null)
  const [contacts, setContacts] = useState<ExhibitorContact[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)

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
    products_services: "",
  })

  const [newContact, setNewContact] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
    is_primary: false,
  })

  const fetchExhibitor = useCallback(async () => {
    try {
      // Fetch exhibitor first
      const { data, error } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("id", exhibitorId)
        .maybeSingle()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }
      
      if (!data) {
        console.log("No exhibitor found with ID:", exhibitorId)
        setIsLoading(false)
        return
      }
      
      // Fetch event separately if event_id exists
      let exhibitorWithEvent = { ...data, events: undefined as any }
      if (data.event_id) {
        const { data: eventData } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, venue")
          .eq("id", data.event_id)
          .maybeSingle()
        
        if (eventData) {
          exhibitorWithEvent.events = eventData
        }
      }
      
      setExhibitor(exhibitorWithEvent)

      // Set edit form with existing values
      setEditForm({
        company_name: data.company_name || "",
        company_description: data.company_description || "",
        company_website: data.company_website || "",
        industry: data.industry || "",
        booth_size: data.booth_size || "",
        booth_number: data.booth_number || "",
        status: data.status || "potential",
        package_type: data.package_type || "",
        contract_value: data.contract_value?.toString() || "",
        paid_amount: data.paid_amount?.toString() || "0",
        products_services: data.products_services || "",
      })

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from("exhibitor_contacts")
        .select("*")
        .eq("exhibitor_id", exhibitorId)
        .order("is_primary", { ascending: false })

      setContacts(contactsData || [])

      // Fetch documents
      const { data: docsData } = await supabase
        .from("exhibitor_documents")
        .select("*")
        .eq("exhibitor_id", exhibitorId)
        .order("created_at", { ascending: false })

      setDocuments(docsData || [])
    } catch (error: any) {
      console.error("Error fetching exhibitor:", error)
      toast({
        title: "Error",
        description: "Failed to load exhibitor details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [exhibitorId, toast])

  useEffect(() => {
    fetchExhibitor()
  }, [fetchExhibitor])

  const handleSave = async () => {
    if (!exhibitor) return
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
          products_services: editForm.products_services || null,
        })
        .eq("id", exhibitor.id)

      if (error) throw error

      toast({ title: "Exhibitor updated!" })
      setIsEditing(false)
      fetchExhibitor()
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

  const handleAddContact = async () => {
    if (!exhibitor || !newContact.full_name || !newContact.email) return
    setIsSaving(true)

    try {
      const invitationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

      const { error } = await supabase
        .from("exhibitor_contacts")
        .insert({
          exhibitor_id: exhibitor.id,
          full_name: newContact.full_name,
          email: newContact.email,
          phone: newContact.phone || null,
          job_title: newContact.job_title || null,
          is_primary: newContact.is_primary,
          invitation_token: invitationToken,
          invitation_status: "pending",
        })

      if (error) throw error

      toast({ title: "Contact added!" })
      setShowAddContactDialog(false)
      setNewContact({ full_name: "", email: "", phone: "", job_title: "", is_primary: false })
      fetchExhibitor()
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

  const copyInviteLink = (contact: ExhibitorContact) => {
    const link = `${window.location.origin}/auth/exhibitor-login?email=${encodeURIComponent(contact.email)}&exhibitor_id=${exhibitor?.id}`
    navigator.clipboard.writeText(link)
    toast({ title: "Invite link copied!" })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"
  }

  const getStatusColor = (status: string) => {
    const found = EXHIBITOR_STATUSES.find(s => s.value === status)
    return found?.color || "bg-gray-500"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!exhibitor) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Exhibitor Not Found</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {exhibitor.company_logo && <AvatarImage src={exhibitor.company_logo} />}
              <AvatarFallback>{getInitials(exhibitor.company_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{exhibitor.company_name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{exhibitor.industry || "No industry"}</span>
                <span>•</span>
                <Badge variant="outline">{exhibitor.events?.title}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(exhibitor.status)} text-white capitalize`}>
            {exhibitor.status}
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false)
                // Reset form to original values
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
                  products_services: exhibitor.products_services || "",
                })
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(exhibitor.contract_value)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(exhibitor.paid_amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Booth</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exhibitor.booth_number || "TBA"}</div>
            <p className="text-xs text-muted-foreground">{exhibitor.booth_size || "Size TBA"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
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
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editForm.company_description}
                        onChange={(e) => setEditForm(p => ({ ...p, company_description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={editForm.company_website}
                        onChange={(e) => setEditForm(p => ({ ...p, company_website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Products/Services</Label>
                      <Textarea
                        value={editForm.products_services}
                        onChange={(e) => setEditForm(p => ({ ...p, products_services: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      {exhibitor.company_description || "No description provided"}
                    </p>
                    {exhibitor.company_website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={exhibitor.company_website} target="_blank" className="text-primary hover:underline">
                          {exhibitor.company_website}
                        </a>
                      </div>
                    )}
                    {exhibitor.products_services && (
                      <div>
                        <Label className="text-muted-foreground">Products/Services</Label>
                        <p className="mt-1">{exhibitor.products_services}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exhibition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
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
                            {EXHIBITOR_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contract Value (AED)</Label>
                        <Input
                          type="number"
                          value={editForm.contract_value}
                          onChange={(e) => setEditForm(p => ({ ...p, contract_value: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Paid Amount (AED)</Label>
                        <Input
                          type="number"
                          value={editForm.paid_amount}
                          onChange={(e) => setEditForm(p => ({ ...p, paid_amount: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event</span>
                      <span className="font-medium">{exhibitor.events?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <Badge variant="secondary" className="capitalize">{exhibitor.package_type || "N/A"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booth Number</span>
                      <span className="font-medium">{exhibitor.booth_number || "TBA"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booth Size</span>
                      <span className="font-medium capitalize">{exhibitor.booth_size || "TBA"}</span>
                    </div>
                    {exhibitor.events && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event Dates</span>
                        <span className="font-medium">
                          {format(parseISO(exhibitor.events.start_date), "MMM d")} - {format(parseISO(exhibitor.events.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>People associated with this exhibitor</CardDescription>
              </div>
              <Button onClick={() => setShowAddContactDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No contacts added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{getInitials(contact.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {contact.full_name}
                                {contact.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                              </p>
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
                        <TableCell>{contact.job_title || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={contact.user_id ? "default" : "secondary"}>
                            {contact.user_id ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> {contact.invitation_status}</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!contact.user_id && (
                            <Button variant="outline" size="sm" onClick={() => copyInviteLink(contact)}>
                              <Copy className="mr-2 h-3 w-3" />
                              Copy Invite
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
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Submitted documents and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents submitted yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                        <TableCell className="capitalize">{doc.document_type.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(doc.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact person for {exhibitor.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newContact.full_name}
                  onChange={(e) => setNewContact(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newContact.job_title}
                  onChange={(e) => setNewContact(p => ({ ...p, job_title: e.target.value }))}
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
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))}
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
              <Label htmlFor="is_primary" className="text-sm font-normal">Primary contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContactDialog(false)}>Cancel</Button>
            <Button onClick={handleAddContact} disabled={isSaving || !newContact.full_name || !newContact.email}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
