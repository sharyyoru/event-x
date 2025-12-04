export * from './database'

// Floor plan related types
export interface BoothCoordinates {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface DXFEntity {
  type: string
  vertices?: Array<{ x: number; y: number }>
  position?: { x: number; y: number }
  center?: { x: number; y: number }
  radius?: number
  startAngle?: number
  endAngle?: number
  text?: string
}

export interface ParsedDXF {
  entities: DXFEntity[]
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}

// CAD canvas state
export interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
  selectedBoothId: string | null
  isDrawingMode: boolean
  drawingStartPoint: { x: number; y: number } | null
}

// Networking types
export interface MatchedUser {
  profile: import('./database').Profile
  matchScore: number
  matchedInterests: string[]
  connectionStatus: 'none' | 'pending' | 'connected'
}

// Session agenda
export interface AgendaItem {
  session: import('./database').Session
  isRegistered: boolean
  conflictsWith?: string[]
}

// Poll options structure
export interface PollOption {
  id: number
  text: string
  votes: number
}

// Survey question structure
export interface SurveyQuestion {
  id: string
  type: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'nps'
  question: string
  options?: string[]
  required: boolean
}

// RFP requirements
export interface RfpRequirements {
  roomBlocks: number
  meetingRooms: number
  cateringNeeded: boolean
  avEquipment: boolean
  specialRequirements: string[]
}

// Badge template
export interface BadgeTemplate {
  id: string
  name: string
  width: number
  height: number
  elements: BadgeElement[]
}

export interface BadgeElement {
  type: 'text' | 'image' | 'qrcode'
  x: number
  y: number
  width: number
  height: number
  field?: string // dynamic field like 'name', 'company', 'ticket_type'
  staticValue?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
}

// Analytics types
export interface EventAnalytics {
  totalRegistrations: number
  checkedInCount: number
  revenue: number
  ticketBreakdown: { ticketType: string; count: number; revenue: number }[]
  registrationTrend: { date: string; count: number }[]
  sessionPopularity: { sessionId: string; title: string; registrations: number }[]
  networkingStats: {
    connectionsCount: number
    appointmentsCount: number
    messagesCount: number
  }
}

// Notification types
export interface AppNotification {
  id: string
  type: 'appointment' | 'message' | 'match' | 'session' | 'general'
  title: string
  body: string
  read: boolean
  createdAt: string
  actionUrl?: string
}
