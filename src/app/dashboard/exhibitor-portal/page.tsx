"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Globe,
  Mail,
  Phone,
  Edit,
  Save,
  Loader2,
  Upload,
  Users,
  UserPlus,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  FileText,
  Send,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  X,
  AlertCircle,
  File,
  Trash2,
  Eye,
  Download,
  Copy,
  ExternalLink,
  Package,
  Grid3X3,
  Zap,
  Droplet,
  Wifi,
  XCircle,
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
  package_type: string | null
  package_details: string | null
  special_requirements: string | null
  social_facebook: string | null
  social_twitter: string | null
  social_linkedin: string | null
  social_instagram: string | null
  products_services: string | null
  events?: {
    id: string
    title: string
    start_date: string
    end_date: string
    venue: string | null
  }
}

interface TeamMember {
  id: string
  exhibitor_id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  designation: string
  role: string
  status: string
  invite_token: string | null
}

interface Document {
  id: string
  exhibitor_id: string
  document_type: string
  document_name: string
  file_url: string | null
  status: string
  rejection_reason: string | null
  team_member_id: string | null
  notes: string | null
  created_at: string
}

const DESIGNATIONS = [
  "Director",
  "Manager",
  "Sales Representative",
  "Marketing",
  "Technical Support",
  "Customer Service",
  "Booth Staff",
  "Other",
]

const DOCUMENT_TYPES = [
  { value: "company_profile", label: "Company Profile" },
  { value: "trade_license", label: "Trade License" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "visa", label: "Visa Copy" },
  { value: "passport", label: "Passport Copy" },
  { value: "id_card", label: "ID Card" },
  { value: "other", label: "Other Document" },
]

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  resubmit: "bg-orange-500",
  active: "bg-green-500",
  inactive: "bg-gray-500",
}

export default function ExhibitorPortalPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentTab, setCurrentTab] = useState(searchParams.get("tab") || "overview")

  const [editForm, setEditForm] = useState({
    company_description: "",
    company_website: "",
    social_facebook: "",
    social_twitter: "",
    social_linkedin: "",
    social_instagram: "",
    products_services: "",
  })

  const [inviteForm, setInviteForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    designation: "",
  })

  const [uploadForm, setUploadForm] = useState({
    document_type: "",
    document_name: "",
    team_member_id: "",
    notes: "",
    file: null as File | null,
  })

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      setCurrentUser({ ...user, ...profile })
      setIsAdmin(profile?.role === "admin" || profile?.role === "organizer")
    }
    return user
  }, [])

  const fetchExhibitorData = useCallback(async () => {
    try {
      const user = await fetchCurrentUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Try to find exhibitor through exhibitor_contacts or exhibitor_team
      let exhibitorId: string | null = null

      // Check exhibitor_contacts first (using maybeSingle to avoid errors)
      const { data: contactData } = await supabase
        .from("exhibitor_contacts")
        .select("exhibitor_id, is_primary")
        .eq("user_id", user.id)
        .maybeSingle()

      if (contactData) {
        exhibitorId = contactData.exhibitor_id
        setIsPrimaryContact(contactData.is_primary)
      }

      // If not found by user_id, try by email
      if (!exhibitorId) {
        const { data: contactByEmail } = await supabase
          .from("exhibitor_contacts")
          .select("exhibitor_id, is_primary")
          .eq("email", user.email)
          .maybeSingle()

        if (contactByEmail) {
          exhibitorId = contactByEmail.exhibitor_id
          setIsPrimaryContact(contactByEmail.is_primary)
          
          // Link the user_id to the contact for future lookups
          await supabase
            .from("exhibitor_contacts")
            .update({ user_id: user.id, invitation_status: "accepted" })
            .eq("email", user.email)
        }
      }

      // If still not found, check exhibitor_team
      if (!exhibitorId) {
        const { data: teamData } = await supabase
          .from("exhibitor_team")
          .select("exhibitor_id, role")
          .eq("user_id", user.id)
          .maybeSingle()

        if (teamData) {
          exhibitorId = teamData.exhibitor_id
          setIsPrimaryContact(teamData.role === "primary" || teamData.role === "admin")
        }
      }

      // Try by email in exhibitor_team as well
      if (!exhibitorId) {
        const { data: teamByEmail } = await supabase
          .from("exhibitor_team")
          .select("exhibitor_id, role")
          .eq("email", user.email)
          .maybeSingle()

        if (teamByEmail) {
          exhibitorId = teamByEmail.exhibitor_id
          setIsPrimaryContact(teamByEmail.role === "primary" || teamByEmail.role === "admin")
          
          // Link the user_id
          await supabase
            .from("exhibitor_team")
            .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
            .eq("email", user.email)
        }
      }

      if (!exhibitorId) {
        console.log("No exhibitor found for user:", user.id, user.email)
        setIsLoading(false)
        return
      }

      // Fetch exhibitor details (without join to avoid PostgREST errors)
      const { data: exhibitorData, error: exhibitorError } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("id", exhibitorId)
        .maybeSingle()

      if (exhibitorError) {
        console.error("Error fetching exhibitor:", exhibitorError)
      }

      if (exhibitorData) {
        // Fetch event separately
        let exhibitorWithEvent = { ...exhibitorData, events: undefined as any }
        if (exhibitorData.event_id) {
          const { data: eventData } = await supabase
            .from("events")
            .select("id, title, start_date, end_date, venue")
            .eq("id", exhibitorData.event_id)
            .maybeSingle()
          
          if (eventData) {
            exhibitorWithEvent.events = eventData
          }
        }
        setExhibitor(exhibitorWithEvent)
        setEditForm({
          company_description: exhibitorData.company_description || "",
          company_website: exhibitorData.company_website || "",
          social_facebook: exhibitorData.social_facebook || "",
          social_twitter: exhibitorData.social_twitter || "",
          social_linkedin: exhibitorData.social_linkedin || "",
          social_instagram: exhibitorData.social_instagram || "",
          products_services: exhibitorData.products_services || "",
        })

        // Fetch team members
        const { data: teamData } = await supabase
          .from("exhibitor_team")
          .select("*")
          .eq("exhibitor_id", exhibitorId)
          .order("created_at")

        setTeamMembers(teamData || [])

        // Fetch documents
        const { data: docsData } = await supabase
          .from("exhibitor_documents")
          .select("*")
          .eq("exhibitor_id", exhibitorId)
          .order("created_at", { ascending: false })

        setDocuments(docsData || [])
      }
    } catch (error: any) {
      console.error("Error fetching exhibitor data:", error)
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchCurrentUser, toast])

  useEffect(() => {
    fetchExhibitorData()
  }, [fetchExhibitorData])

  const handleSaveProfile = async () => {
    if (!exhibitor) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("exhibitors")
        .update({
          company_description: editForm.company_description,
          company_website: editForm.company_website,
          social_facebook: editForm.social_facebook,
          social_twitter: editForm.social_twitter,
          social_linkedin: editForm.social_linkedin,
          social_instagram: editForm.social_instagram,
          products_services: editForm.products_services,
        })
        .eq("id", exhibitor.id)

      if (error) throw error

      toast({ title: "Profile updated!" })
      setIsEditing(false)
      fetchExhibitorData()
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInviteTeamMember = async () => {
    if (!exhibitor) return
    setIsSaving(true)

    try {
      const inviteToken = crypto.randomUUID()
      
      const { error } = await supabase
        .from("exhibitor_team")
        .insert({
          exhibitor_id: exhibitor.id,
          full_name: inviteForm.full_name,
          email: inviteForm.email,
          phone: inviteForm.phone || null,
          designation: inviteForm.designation,
          role: "member",
          status: "pending",
          invite_token: inviteToken,
          invited_at: new Date().toISOString(),
        })

      if (error) throw error

      toast({ title: "Team member invited!" })
      setShowInviteDialog(false)
      setInviteForm({ full_name: "", email: "", phone: "", designation: "" })
      fetchExhibitorData()
    } catch (error: any) {
      toast({
        title: "Error inviting team member",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyInviteLink = (member: TeamMember) => {
    const link = `${window.location.origin}/auth/exhibitor-login?email=${encodeURIComponent(member.email)}&exhibitor_id=${exhibitor?.id}`
    navigator.clipboard.writeText(link)
    toast({ title: "Invite link copied!" })
  }

  const handleUploadDocument = async () => {
    if (!exhibitor || !uploadForm.file || !uploadForm.document_type) return
    setIsUploading(true)

    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop()
      const fileName = `${exhibitor.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exhibitor-documents")
        .upload(fileName, uploadForm.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("exhibitor-documents")
        .getPublicUrl(fileName)

      // Create document record
      const { error } = await supabase
        .from("exhibitor_documents")
        .insert({
          exhibitor_id: exhibitor.id,
          document_type: uploadForm.document_type,
          document_name: uploadForm.document_name || uploadForm.file.name,
          file_url: publicUrl,
          status: "pending",
          team_member_id: uploadForm.team_member_id || null,
          notes: uploadForm.notes || null,
          submitted_by: currentUser?.id,
        })

      if (error) throw error

      toast({ title: "Document uploaded!" })
      setShowUploadDialog(false)
      setUploadForm({ document_type: "", document_name: "", team_member_id: "", notes: "", file: null })
      fetchExhibitorData()
    } catch (error: any) {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleApproveDocument = async (doc: Document) => {
    if (!currentUser) return

    try {
      const { error } = await supabase
        .from("exhibitor_documents")
        .update({
          status: "approved",
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", doc.id)

      if (error) throw error

      toast({ title: "Document approved!" })
      fetchExhibitorData()
    } catch (error: any) {
      toast({
        title: "Error approving document",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRejectDocument = async () => {
    if (!selectedDocument || !currentUser || !rejectionReason) return

    try {
      const { error } = await supabase
        .from("exhibitor_documents")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedDocument.id)

      if (error) throw error

      toast({ title: "Document rejected and exhibitor notified" })
      setShowRejectDialog(false)
      setSelectedDocument(null)
      setRejectionReason("")
      fetchExhibitorData()
    } catch (error: any) {
      toast({
        title: "Error rejecting document",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"
  }

  const getDocumentProgress = () => {
    if (documents.length === 0) return 0
    const approved = documents.filter(d => d.status === "approved").length
    return Math.round((approved / documents.length) * 100)
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
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Exhibitor Account Found</h2>
        <p className="text-muted-foreground mb-4">
          You don't have an exhibitor account linked. Please contact the event organizer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {exhibitor.company_logo && <AvatarImage src={exhibitor.company_logo} />}
            <AvatarFallback className="text-lg">{getInitials(exhibitor.company_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{exhibitor.company_name}</h1>
            <p className="text-muted-foreground">{exhibitor.industry}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={exhibitor.status === "confirmed" ? "default" : "secondary"}>
                {exhibitor.status}
              </Badge>
              {exhibitor.package_type && (
                <Badge variant="outline">{exhibitor.package_type}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPrimaryContact && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{teamMembers.length}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {documents.filter(d => d.status === "approved").length}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Document Progress</span>
                <span className="text-sm text-muted-foreground">{getDocumentProgress()}%</span>
              </div>
              <Progress value={getDocumentProgress()} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editForm.company_description}
                        onChange={(e) => setEditForm({ ...editForm, company_description: e.target.value })}
                        placeholder="Describe your company..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={editForm.company_website}
                        onChange={(e) => setEditForm({ ...editForm, company_website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Products/Services</Label>
                      <Textarea
                        value={editForm.products_services}
                        onChange={(e) => setEditForm({ ...editForm, products_services: e.target.value })}
                        placeholder="What do you offer?"
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

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <Input
                        value={editForm.social_facebook}
                        onChange={(e) => setEditForm({ ...editForm, social_facebook: e.target.value })}
                        placeholder="Facebook URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-sky-500" />
                      <Input
                        value={editForm.social_twitter}
                        onChange={(e) => setEditForm({ ...editForm, social_twitter: e.target.value })}
                        placeholder="Twitter URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      <Input
                        value={editForm.social_linkedin}
                        onChange={(e) => setEditForm({ ...editForm, social_linkedin: e.target.value })}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <Input
                        value={editForm.social_instagram}
                        onChange={(e) => setEditForm({ ...editForm, social_instagram: e.target.value })}
                        placeholder="Instagram URL"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {exhibitor.social_facebook && (
                      <a href={exhibitor.social_facebook} target="_blank" className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {exhibitor.social_twitter && (
                      <a href={exhibitor.social_twitter} target="_blank" className="p-2 rounded-full bg-sky-100 text-sky-500 hover:bg-sky-200">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {exhibitor.social_linkedin && (
                      <a href={exhibitor.social_linkedin} target="_blank" className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {exhibitor.social_instagram && (
                      <a href={exhibitor.social_instagram} target="_blank" className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {!exhibitor.social_facebook && !exhibitor.social_twitter && !exhibitor.social_linkedin && !exhibitor.social_instagram && (
                      <p className="text-muted-foreground">No social media links added</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {exhibitor.events ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {exhibitor.events.title}
                </CardTitle>
                <CardDescription>
                  {format(parseISO(exhibitor.events.start_date), "MMMM d, yyyy")} - {format(parseISO(exhibitor.events.end_date), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Grid3X3 className="h-4 w-4" />
                      <span className="text-sm">Stand Number</span>
                    </div>
                    <p className="text-xl font-bold">{exhibitor.booth_number || "TBA"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">Package</span>
                    </div>
                    <p className="text-xl font-bold">{exhibitor.package_type || "Standard"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Booth Size</span>
                    </div>
                    <p className="text-xl font-bold">{exhibitor.booth_size || "TBA"}</p>
                  </div>
                </div>

                {exhibitor.package_details && (
                  <div className="mt-6">
                    <Label className="text-muted-foreground">Package Details</Label>
                    <p className="mt-1">{exhibitor.package_details}</p>
                  </div>
                )}

                {exhibitor.special_requirements && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Special Requirements</Label>
                    <p className="mt-1">{exhibitor.special_requirements}</p>
                  </div>
                )}

                {exhibitor.events.venue && (
                  <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{exhibitor.events.venue}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events assigned yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Team Members</h2>
              <p className="text-muted-foreground">Manage your exhibition team</p>
            </div>
            {isPrimaryContact && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No team members yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{getInitials(member.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            {member.role === "primary" && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.designation}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${STATUS_COLORS[member.status] || "bg-gray-500"}`} />
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => copyInviteLink(member)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Documents</h2>
              <p className="text-muted-foreground">Required documents and submissions</p>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => {
                    const teamMember = teamMembers.find(m => m.id === doc.team_member_id)
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.document_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </TableCell>
                        <TableCell>
                          {teamMember ? teamMember.full_name : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${STATUS_COLORS[doc.status]}`} />
                            {doc.status}
                          </Badge>
                          {doc.status === "rejected" && doc.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">{doc.rejection_reason}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(doc.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {doc.file_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.file_url} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {isAdmin && doc.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleApproveDocument(doc)}>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setSelectedDocument(doc)
                                  setShowRejectDialog(true)
                                }}>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Team Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Add a team member to your exhibition team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Designation *</Label>
              <Select
                value={inviteForm.designation}
                onValueChange={(value) => setInviteForm({ ...inviteForm, designation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleInviteTeamMember} 
              disabled={!inviteForm.full_name || !inviteForm.email || !inviteForm.designation || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Submit a required document</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={(value) => setUploadForm({ ...uploadForm, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                value={uploadForm.document_name}
                onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })}
                placeholder="e.g., Company Trade License 2024"
              />
            </div>
            {(uploadForm.document_type === "visa" || uploadForm.document_type === "passport" || uploadForm.document_type === "id_card") && (
              <div className="space-y-2">
                <Label>Team Member</Label>
                <Select
                  value={uploadForm.team_member_id}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, team_member_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>File *</Label>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setUploadForm({ ...uploadForm, file })
                }}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC up to 10MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUploadDocument}
              disabled={!uploadForm.document_type || !uploadForm.file || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this document. The exhibitor will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Rejection Reason *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a clear reason for rejection..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false)
              setSelectedDocument(null)
              setRejectionReason("")
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={!rejectionReason}
            >
              Reject & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
