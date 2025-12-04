"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

function ExhibitorLoginContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const invitedEmail = searchParams.get("email") || ""
  const exhibitorId = searchParams.get("exhibitor_id") || ""
  
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: invitedEmail,
    password: "",
    confirmPassword: "",
    fullName: "",
  })

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if exhibitor role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (profile?.role === "exhibitor") {
          router.push("/dashboard/exhibitor-portal")
        }
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      // Link user to exhibitor contact if not already linked
      await supabase
        .from("exhibitor_contacts")
        .update({ 
          user_id: data.user.id,
          invitation_status: "accepted"
        })
        .eq("email", formData.email)
        .is("user_id", null)

      // Also check exhibitor_team
      await supabase
        .from("exhibitor_team")
        .update({ 
          user_id: data.user.id,
          status: "active",
          joined_at: new Date().toISOString()
        })
        .eq("email", formData.email)
        .is("user_id", null)

      // Check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile?.role === "exhibitor") {
        toast({ title: "Welcome back!" })
        router.push("/dashboard/exhibitor-portal")
      } else {
        toast({ title: "Welcome back!" })
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Register the user with email confirmation disabled for invited exhibitors
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "exhibitor",
          },
          emailRedirectTo: `${window.location.origin}/dashboard/exhibitor-portal`,
        },
      })

      if (error) throw error

      // Check if email confirmation is pending
      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "Please click the confirmation link sent to your email to complete registration.",
        })
        return
      }

      if (data.user) {
        // Update the profile with exhibitor role
        await supabase
          .from("profiles")
          .update({ 
            role: "exhibitor",
            full_name: formData.fullName,
          })
          .eq("id", data.user.id)

        // Link to exhibitor contact if exhibitor_id provided
        if (exhibitorId) {
          await supabase
            .from("exhibitor_contacts")
            .update({ 
              user_id: data.user.id,
              invitation_status: "accepted"
            })
            .eq("exhibitor_id", exhibitorId)
            .eq("email", formData.email)
        }

        // Also try to find and link by email (for any matching exhibitor contact)
        await supabase
          .from("exhibitor_contacts")
          .update({ 
            user_id: data.user.id,
            invitation_status: "accepted"
          })
          .eq("email", formData.email)
          .is("user_id", null)
        
        // Also check exhibitor_team table
        await supabase
          .from("exhibitor_team")
          .update({ 
            user_id: data.user.id,
            status: "active",
            joined_at: new Date().toISOString()
          })
          .eq("email", formData.email)
          .is("user_id", null)

        toast({ 
          title: "Account created!",
          description: "You can now access your exhibitor portal.",
        })
        router.push("/dashboard/exhibitor-portal")
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Exhibitor Portal</CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Sign in to manage your exhibition" 
              : "Create your exhibitor account"
            }
          </CardDescription>
          {invitedEmail && (
            <p className="text-sm text-muted-foreground mt-2">
              Invited as: <span className="font-medium text-foreground">{invitedEmail}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  readOnly={!!invitedEmail}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to main login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ExhibitorLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ExhibitorLoginContent />
    </Suspense>
  )
}
