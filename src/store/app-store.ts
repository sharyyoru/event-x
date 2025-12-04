import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Event } from '@/types/database'

interface AppState {
  // User state
  user: Profile | null
  setUser: (user: Profile | null) => void
  
  // Current event context
  currentEvent: Event | null
  setCurrentEvent: (event: Event | null) => void
  
  // UI state
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Floor plan editor state
  floorPlanTool: 'select' | 'rectangle' | 'polygon' | 'pan'
  setFloorPlanTool: (tool: 'select' | 'rectangle' | 'polygon' | 'pan') => void
  
  // Networking
  savedConnections: string[]
  addSavedConnection: (userId: string) => void
  removeSavedConnection: (userId: string) => void
  
  // Notifications
  unreadNotifications: number
  setUnreadNotifications: (count: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Current event
      currentEvent: null,
      setCurrentEvent: (event) => set({ currentEvent: event }),
      
      // UI
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Floor plan
      floorPlanTool: 'select',
      setFloorPlanTool: (tool) => set({ floorPlanTool: tool }),
      
      // Networking
      savedConnections: [],
      addSavedConnection: (userId) =>
        set((state) => ({
          savedConnections: [...state.savedConnections, userId],
        })),
      removeSavedConnection: (userId) =>
        set((state) => ({
          savedConnections: state.savedConnections.filter((id) => id !== userId),
        })),
      
      // Notifications
      unreadNotifications: 0,
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    }),
    {
      name: 'eventx-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        savedConnections: state.savedConnections,
      }),
    }
  )
)
