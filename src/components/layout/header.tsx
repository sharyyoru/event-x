"use client"

import { useEffect, useState } from "react"
import { Bell, Search, Plus, LogOut, User, Settings, MessageSquare, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  full_name: string
  first_name: string | null
  avatar_url: string | null
  role: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      // Subscribe to new notifications
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchNotifications()
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id])

  const fetchNotifications = async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user?.id)
      .eq("is_read", false)
    fetchNotifications()
  }

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, first_name, avatar_url, role")
          .eq("id", authUser.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
        } else {
          // Fallback to auth user info
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
            first_name: authUser.user_metadata?.first_name || null,
            avatar_url: null,
            role: authUser.user_metadata?.role || "attendee",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
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

  const displayName = user?.first_name || user?.full_name?.split(" ")[0] || "User"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-96 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events, attendees, venues..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Create Event Button - Only for admins and organizers */}
        {(user?.role === "admin" || user?.role === "organizer") && (
          <Link href="/dashboard/events?action=create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.link) {
                        router.push(notification.link)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.type === 'message' ? 'bg-blue-500' : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {notification.body && (
                          <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link href="/dashboard/messages" className="text-sm text-primary">
                <MessageSquare className="mr-2 h-4 w-4" />
                View all messages
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.full_name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="flex items-center text-xs text-muted-foreground capitalize">
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${getRoleColor(user?.role || "")}`} />
                  {user?.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name || "Guest User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                <Badge variant="secondary" className="mt-1 w-fit capitalize text-xs">
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${getRoleColor(user?.role || "")}`} />
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {user?.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  User Management
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
