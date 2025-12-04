"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

// Dynamic imports to avoid SSR issues with zustand
const Sidebar = dynamic(() => import("@/components/layout/sidebar").then(mod => ({ default: mod.Sidebar })), { 
  ssr: false,
  loading: () => <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card" />
})

const Header = dynamic(() => import("@/components/layout/header").then(mod => ({ default: mod.Header })), { 
  ssr: false,
  loading: () => <div className="sticky top-0 z-30 h-16 border-b bg-background" />
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card" />
        <div className="ml-64 flex min-h-screen flex-col">
          <div className="sticky top-0 z-30 h-16 border-b bg-background" />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex min-h-screen flex-col transition-all duration-300">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
