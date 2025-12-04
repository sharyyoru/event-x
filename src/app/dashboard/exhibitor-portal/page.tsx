"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
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
  package_type: string | null
  social_facebook: string | null
  social_twitter: string | null
  social_linkedin: string | null
  social_instagram: string | null
  products_services: string | null
  brochure_url: string | null
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
  full_name: string
  email: string
  phone: string | null
  job_title: string | null
  is_primary: boolean
  invitation_status: string
  user_id: string | null
}

export default function ExhibitorPortalPage() {
  const { toast } = useToast()
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)

  const [editForm, setEditForm] = useState({
    company_description: "",
    company_website: "",
    social_facebook: "",
    social_twitter: "",
    social_linkedin: "",
    social_instagram: "",
    products_services: "",
  })

  const [newInvite, setNewInvite] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
  })

  const fetchExhibitorData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find exhibitor contact for this user
      const { data: contact, error: contactError } = await supabase
        .from("exhibitor_contacts")
        .select("exhibitor_id, is_primary")
        .eq("user_id", user.id)
        .maybeSingle()

      if (contactError || !contact) {
        console.log("No exhibitor contact found for user")
        setIsLoading(false)
        return
      }

      setIsPrimaryContact(contact.is_primary)

      // Fetch exhibitor details
      const { data: exhibitorData, error: exhibitorError } = await supabase
        .from("exhibitors")
        .select(`
          *,
          events(id, title, start_date, end_date, venue)
        `)
        .eq("id", contact.exhibitor_id)
        .single()

      if (exhibitorError) throw exhibitorError
      setExhibitor(exhibitorData)

      // Populate edit form
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
        .from("exhibitor_contacts")
        .select("*")
        .eq("exhibitor_id", contact.exhibitor_id)
        .order("is_primary", { ascending: false })

      setTeamMembers(teamData || [])
    } catch (error: any) {
      console.error("Error fetching exhibitor data:", error)
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

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

      toast({ title: "Profile updated successfully" })
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
    if (!exhibitor || !newInvite.full_name || !newInvite.email) return
    setIsSaving(true)

    try {
      const invitationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

      const { error } = await supabase
        .from("exhibitor_contacts")
        .insert({
          exhibitor_id: exhibitor.id,
          full_name: newInvite.full_name,
          email: newInvite.email,
          phone: newInvite.phone || null,
          job_title: newInvite.job_title || null,
          is_primary: false,
          invitation_token: invitationToken,
          invitation_status: "pending",
        })

      if (error) throw error

      // Copy invite link to clipboard
      const inviteUrl = `${window.location.origin}/auth/exhibitor-login?email=${encodeURIComponent(newInvite.email)}`
      await navigator.clipboard.writeText(inviteUrl)

      toast({
        title: "Team member invited",
        description: "Invitation link copied to clipboard. Send it to your team member.",
      })

      setShowInviteDialog(false)
      setNewInvite({ full_name: "", email: "", phone: "", job_title: "" })
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

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"
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
        <h2 className="text-xl font-semibold mb-2">No Exhibitor Profile Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your account is not linked to any exhibitor profile. Please contact the event organizer for assistance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={exhibitor.company_logo || ""} />
            <AvatarFallback className="text-xl">
              {exhibitor.company_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{exhibitor.company_name}</h1>
            <p className="text-muted-foreground">{exhibitor.industry || "Industry not specified"}</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={exhibitor.status === "confirmed" ? "default" : "secondary"} className="capitalize">
                {exhibitor.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {exhibitor.package_type || "Package TBD"}
              </Badge>
              {exhibitor.booth_number && (
                <Badge variant="outline">Booth: {exhibitor.booth_number}</Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Event Info */}
      {exhibitor.events && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{exhibitor.events.title}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(exhibitor.events.start_date).toLocaleDateString()} - {new Date(exhibitor.events.end_date).toLocaleDateString()}
                </span>
              </div>
              {exhibitor.events.venue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{exhibitor.events.venue}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Company Profile</CardTitle>
                <CardDescription>Update your public exhibitor profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Description</Label>
                  <Textarea
                    value={editForm.company_description}
                    onChange={(e) => setEditForm(p => ({ ...p, company_description: e.target.value }))}
                    placeholder="Tell visitors about your company..."
                    className="min-h-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Products & Services</Label>
                  <Textarea
                    value={editForm.products_services}
                    onChange={(e) => setEditForm(p => ({ ...p, products_services: e.target.value }))}
                    placeholder="Describe your products and services..."
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={editForm.company_website}
                    onChange={(e) => setEditForm(p => ({ ...p, company_website: e.target.value }))}
                    placeholder="https://www.yourcompany.com"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Social Media Links</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <Input
                        value={editForm.social_facebook}
                        onChange={(e) => setEditForm(p => ({ ...p, social_facebook: e.target.value }))}
                        placeholder="Facebook URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-sky-500" />
                      <Input
                        value={editForm.social_twitter}
                        onChange={(e) => setEditForm(p => ({ ...p, social_twitter: e.target.value }))}
                        placeholder="Twitter URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      <Input
                        value={editForm.social_linkedin}
                        onChange={(e) => setEditForm(p => ({ ...p, social_linkedin: e.target.value }))}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <Input
                        value={editForm.social_instagram}
                        onChange={(e) => setEditForm(p => ({ ...p, social_instagram: e.target.value }))}
                        placeholder="Instagram URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {exhibitor.company_description || "No company description provided yet. Click 'Edit Profile' to add one."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Products & Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {exhibitor.products_services || "No products/services description provided yet."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact & Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {exhibitor.company_website && (
                      <a href={exhibitor.company_website} target="_blank" className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="h-4 w-4" />
                        {exhibitor.company_website}
                      </a>
                    )}
                    {exhibitor.social_facebook && (
                      <a href={exhibitor.social_facebook} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    )}
                    {exhibitor.social_twitter && (
                      <a href={exhibitor.social_twitter} target="_blank" className="flex items-center gap-2 text-sky-500 hover:underline">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </a>
                    )}
                    {exhibitor.social_linkedin && (
                      <a href={exhibitor.social_linkedin} target="_blank" className="flex items-center gap-2 text-blue-700 hover:underline">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {exhibitor.social_instagram && (
                      <a href={exhibitor.social_instagram} target="_blank" className="flex items-center gap-2 text-pink-600 hover:underline">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </a>
                    )}
                  </div>
                  {!exhibitor.company_website && !exhibitor.social_facebook && !exhibitor.social_linkedin && (
                    <p className="text-muted-foreground">No contact or social media links added yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People from your company attending this event</CardDescription>
              </div>
              {isPrimaryContact && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.full_name}</span>
                            {member.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>{member.job_title || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={member.user_id ? "default" : "secondary"}>
                          {member.user_id ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {member.invitation_status}</>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teamMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No team members yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Team Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a colleague to join your exhibitor team for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newInvite.full_name}
                  onChange={(e) => setNewInvite(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newInvite.job_title}
                  onChange={(e) => setNewInvite(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="Sales Manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite(p => ({ ...p, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newInvite.phone}
                  onChange={(e) => setNewInvite(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+971 50 123 4567"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteTeamMember}
              disabled={isSaving || !newInvite.full_name || !newInvite.email}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Invite & Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
