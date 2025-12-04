"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import {
  Calendar,
  Users,
  Map,
  Building2,
  Ticket,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  QrCode,
  Users2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Home,
  UserCircle,
  UserCog,
  UserPlus,
  LucideIcon,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "User Management", href: "/dashboard/users", icon: UserCog, adminOnly: true },
  { name: "Registration", href: "/dashboard/registration", icon: Ticket },
  { name: "Venues", href: "/dashboard/venues", icon: Building2 },
  { name: "Floor Plans", href: "/dashboard/floor-plans", icon: Map },
  { name: "Attendees", href: "/dashboard/attendees", icon: Users },
  { name: "Networking", href: "/dashboard/networking", icon: Users2 },
  { name: "Check-in", href: "/dashboard/check-in", icon: QrCode },
  { name: "Surveys", href: "/dashboard/surveys", icon: ClipboardList },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "RFP", href: "/dashboard/rfp", icon: FileText },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
]

const bottomNavigation: NavItem[] = [
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
        if (data) {
          setUserRole(data.role)
        } else {
          setUserRole(user.user_metadata?.role || "attendee")
        }
      }
    }
    fetchUserRole()
  }, [])

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon
    
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          !sidebarOpen && "justify-center px-2"
        )}
        title={!sidebarOpen ? item.name : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {sidebarOpen && <span>{item.name}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">EventX</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!sidebarOpen && "mx-auto")}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Admin Quick Action */}
        {userRole === "admin" && (
          <div className="border-b p-2">
            <Link href="/dashboard/users?action=create">
              <Button
                className={cn(
                  "w-full justify-start gap-2",
                  !sidebarOpen && "justify-center px-2"
                )}
                size={sidebarOpen ? "default" : "icon"}
              >
                <UserPlus className="h-4 w-4" />
                {sidebarOpen && <span>Create User</span>}
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navigation
              .filter(item => !item.adminOnly || userRole === "admin")
              .map(renderNavItem)}
          </nav>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t p-2">
          <nav className="space-y-1">
            {bottomNavigation.map(renderNavItem)}
          </nav>
        </div>
      </div>
    </aside>
  )
}
