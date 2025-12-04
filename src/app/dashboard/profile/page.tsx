"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Loader2, Eye, EyeOff, Check, X, User, Lock, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  email: string
  full_name: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  company: string | null
  job_title: string | null
  bio: string | null
  phone: string | null
  role: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = "/auth/login"
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setProfile(data)
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          role: user.user_metadata?.role || "attendee",
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single()
          
        if (createError) throw createError
        setProfile(createdProfile)
      }
    } catch (error: any) {
      console.error("Profile error:", error)
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
          company: profile.company,
          job_title: profile.job_title,
          bio: profile.bio,
          phone: profile.phone,
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      })
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingPhoto(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}/avatar.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwords

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      })

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      organizer: "bg-purple-500",
      staff: "bg-blue-500",
      exhibitor: "bg-green-500",
      delegate: "bg-yellow-500",
      attendee: "bg-gray-500",
    }
    return colors[role] || "bg-gray-500"
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Click on the avatar to upload a new photo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="text-center">
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2 capitalize" variant="secondary">
                <span className={`mr-1.5 h-2 w-2 rounded-full ${getRoleColor(profile.role)}`} />
                {profile.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.first_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.last_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email} disabled />
                    <p className="text-xs text-muted-foreground">
                      Contact admin to change email
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, company: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={profile.job_title || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, job_title: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="Tell us about yourself..."
                      value={profile.bio || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords({ ...passwords, newPassword: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirmPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !passwords.newPassword || !passwords.confirmPassword}
                    >
                      {isChangingPassword && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
